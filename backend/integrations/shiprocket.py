"""Shiprocket shipping integration."""
import asyncio
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

from config import settings

TOKEN_CACHE_FILE = Path("/tmp/shiprocket_token.json")
TOKEN_TTL_HOURS = 240  # 10 days
REFRESH_BEFORE_HOURS = 24  # refresh if less than 24h remaining

_lock = asyncio.Lock()
_token_cache: Dict[str, Any] = {"token": None, "expires_at": None}


def _load_cached_token() -> Optional[Dict[str, Any]]:
    try:
        if TOKEN_CACHE_FILE.exists():
            data = json.loads(TOKEN_CACHE_FILE.read_text())
            expires_at = datetime.fromisoformat(data["expires_at"])
            if expires_at - datetime.utcnow() > timedelta(hours=REFRESH_BEFORE_HOURS):
                return {"token": data["token"], "expires_at": expires_at}
    except Exception:
        return None
    return None


def _save_cached_token(token: str, expires_at: datetime) -> None:
    try:
        TOKEN_CACHE_FILE.write_text(
            json.dumps({"token": token, "expires_at": expires_at.isoformat()})
        )
    except Exception:
        pass


async def _login() -> str:
    async with httpx.AsyncClient(timeout=20.0) as http:
        r = await http.post(
            f"{settings.shiprocket_base_url}/v1/external/auth/login",
            json={"email": settings.shiprocket_email, "password": settings.shiprocket_password},
            headers={"Content-Type": "application/json"},
        )
        r.raise_for_status()
        data = r.json()
        token = data.get("token")
        if not token:
            raise RuntimeError(f"No token in Shiprocket login response: {data}")
        return token


async def get_token() -> str:
    global _token_cache
    async with _lock:
        # Memory cache
        if _token_cache["token"] and _token_cache["expires_at"]:
            if _token_cache["expires_at"] - datetime.utcnow() > timedelta(hours=REFRESH_BEFORE_HOURS):
                return _token_cache["token"]
        # File cache
        cached = _load_cached_token()
        if cached:
            _token_cache = cached
            return cached["token"]
        # Fresh login
        token = await _login()
        expires_at = datetime.utcnow() + timedelta(hours=TOKEN_TTL_HOURS)
        _token_cache = {"token": token, "expires_at": expires_at}
        _save_cached_token(token, expires_at)
        return token


async def _auth_headers() -> Dict[str, str]:
    token = await get_token()
    return {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}


async def check_serviceability(
    delivery_pincode: str,
    weight: float = 0.5,
    cod: int = 0,
) -> List[Dict[str, Any]]:
    headers = await _auth_headers()
    async with httpx.AsyncClient(timeout=20.0) as http:
        r = await http.get(
            f"{settings.shiprocket_base_url}/v1/external/courier/serviceability/",
            params={
                "pickup_postcode": settings.shiprocket_pickup_pincode,
                "delivery_postcode": delivery_pincode,
                "weight": weight,
                "cod": cod,
            },
            headers=headers,
        )
        r.raise_for_status()
        data = r.json()
        available = data.get("data", {}).get("available_courier_companies", [])
        # Normalize
        result = []
        for c in available:
            try:
                result.append({
                    "courier_company_id": c.get("courier_company_id"),
                    "courier_name": c.get("courier_name"),
                    "rate": float(c.get("rate", 0)),
                    "etd": c.get("etd"),
                    "estimated_delivery_days": c.get("estimated_delivery_days"),
                    "rating": c.get("rating"),
                    "is_surface": c.get("is_surface"),
                    "cod": c.get("cod"),
                })
            except Exception:
                continue
        return result


async def list_pickup_locations() -> List[Dict[str, Any]]:
    headers = await _auth_headers()
    async with httpx.AsyncClient(timeout=15.0) as http:
        r = await http.get(f"{settings.shiprocket_base_url}/v1/external/settings/company/pickup", headers=headers)
        r.raise_for_status()
        return r.json().get("data", {}).get("shipping_address", [])


async def create_adhoc_order(order: Dict[str, Any]) -> Dict[str, Any]:
    """Create a Shiprocket adhoc order. Returns dict with order_id, shipment_id."""
    headers = await _auth_headers()
    async with httpx.AsyncClient(timeout=30.0) as http:
        r = await http.post(
            f"{settings.shiprocket_base_url}/v1/external/orders/create/adhoc",
            json=order,
            headers=headers,
        )
        if r.status_code not in (200, 201):
            raise RuntimeError(f"Shiprocket order create failed {r.status_code}: {r.text}")
        return r.json()


async def assign_awb(shipment_id: int, courier_id: Optional[int] = None) -> Dict[str, Any]:
    headers = await _auth_headers()
    payload: Dict[str, Any] = {"shipment_id": shipment_id}
    if courier_id:
        payload["courier_id"] = courier_id
    async with httpx.AsyncClient(timeout=30.0) as http:
        r = await http.post(
            f"{settings.shiprocket_base_url}/v1/external/courier/assign/awb",
            json=payload,
            headers=headers,
        )
        if r.status_code not in (200, 201):
            raise RuntimeError(f"Shiprocket AWB assign failed {r.status_code}: {r.text}")
        return r.json()


async def generate_label(shipment_ids: List[int]) -> Dict[str, Any]:
    headers = await _auth_headers()
    async with httpx.AsyncClient(timeout=30.0) as http:
        r = await http.post(
            f"{settings.shiprocket_base_url}/v1/external/courier/generate/label",
            json={"shipment_id": shipment_ids},
            headers=headers,
        )
        if r.status_code not in (200, 201):
            return {"label_created": False, "error": r.text}
        return r.json()


async def generate_pickup(shipment_ids: List[int]) -> Dict[str, Any]:
    headers = await _auth_headers()
    async with httpx.AsyncClient(timeout=30.0) as http:
        r = await http.post(
            f"{settings.shiprocket_base_url}/v1/external/courier/generate/pickup",
            json={"shipment_id": shipment_ids},
            headers=headers,
        )
        if r.status_code not in (200, 201):
            return {"success": False, "error": r.text}
        return r.json()


async def track_by_awb(awb_code: str) -> Dict[str, Any]:
    headers = await _auth_headers()
    async with httpx.AsyncClient(timeout=15.0) as http:
        r = await http.get(
            f"{settings.shiprocket_base_url}/v1/external/courier/track/awb/{awb_code}",
            headers=headers,
        )
        if r.status_code != 200:
            return {"success": False, "error": r.text}
        return r.json()
