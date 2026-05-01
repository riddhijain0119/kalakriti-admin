"""Cashfree Payment Gateway integration."""
import httpx
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

from config import settings


def _headers(request_id: Optional[str] = None) -> Dict[str, str]:
    return {
        "Content-Type": "application/json",
        "x-api-version": settings.cashfree_api_version,
        "x-client-id": settings.cashfree_client_id,
        "x-client-secret": settings.cashfree_client_secret,
        "x-request-id": request_id or f"kala-{uuid.uuid4().hex[:10]}",
    }


async def create_payment_session(
    order_number: str,
    amount: float,
    customer: Dict[str, str],
    return_url: str,
    notify_url: str,
    note: Optional[str] = None,
) -> Dict[str, Any]:
    payload = {
        "order_id": order_number,
        "order_amount": round(amount, 2),
        "order_currency": "INR",
        "customer_details": {
            "customer_id": customer.get("id") or customer.get("email") or str(uuid.uuid4()),
            "customer_phone": customer.get("phone", "9999999999"),
            "customer_email": customer.get("email", ""),
            "customer_name": customer.get("name", ""),
        },
        "order_meta": {
            "return_url": return_url,
            "notify_url": notify_url,
        },
    }
    if note:
        payload["order_note"] = note
    async with httpx.AsyncClient(timeout=15.0) as http:
        r = await http.post(f"{settings.cashfree_base_url}/orders", json=payload, headers=_headers())
        r.raise_for_status()
        data = r.json()
    return {
        "payment_session_id": data.get("payment_session_id"),
        "cf_order_id": data.get("cf_order_id"),
        "order_amount": data.get("order_amount"),
        "raw": data,
    }


async def get_order(order_number: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=15.0) as http:
        r = await http.get(f"{settings.cashfree_base_url}/orders/{order_number}", headers=_headers())
        r.raise_for_status()
        return r.json()


async def create_refund(order_number: str, refund_amount: float, note: str, refund_speed: str = "STANDARD") -> Dict[str, Any]:
    refund_id = f"refund-{order_number}-{int(datetime.utcnow().timestamp())}"
    payload = {
        "refund_amount": round(refund_amount, 2),
        "refund_id": refund_id,
        "refund_note": note,
        "refund_speed": refund_speed,
    }
    async with httpx.AsyncClient(timeout=15.0) as http:
        r = await http.post(
            f"{settings.cashfree_base_url}/orders/{order_number}/refunds",
            json=payload,
            headers=_headers(),
        )
        r.raise_for_status()
        return r.json()


def verify_webhook_signature(timestamp: str, raw_body: bytes, signature: str) -> bool:
    """HMAC-SHA256 verification of Cashfree webhook."""
    import hmac
    import hashlib
    import base64

    if not timestamp or not raw_body or not signature:
        return False
    try:
        body_str = raw_body.decode("utf-8") if isinstance(raw_body, (bytes, bytearray)) else raw_body
        signed = timestamp + body_str
        expected = base64.b64encode(
            hmac.new(
                settings.cashfree_client_secret.encode("utf-8"),
                signed.encode("utf-8"),
                hashlib.sha256,
            ).digest()
        ).decode("utf-8")
        return hmac.compare_digest(expected, signature)
    except Exception:
        return False
