"""
POC Test Script for Kalakriti Admin Panel Integrations
Tests: MongoDB + Cashfree + Shiprocket in isolation BEFORE building the full app.

Success criteria:
1. MongoDB: insert + read test doc
2. Cashfree: create a payment session (returns payment_session_id)
3. Shiprocket: login + courier serviceability check (proves auth + API works)

Run: cd /app/backend && python test_core.py
"""
import os
import sys
import asyncio
import httpx
import uuid
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load .env from /app/backend
load_dotenv(Path(__file__).parent / ".env")

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"

def log(msg, color=CYAN):
    print(f"{color}{msg}{RESET}")

def ok(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def fail(msg):
    print(f"{RED}✗ {msg}{RESET}")

def warn(msg):
    print(f"{YELLOW}⚠ {msg}{RESET}")


# =========================
# TEST 1: MongoDB
# =========================
async def test_mongodb():
    log("\n========== TEST 1: MongoDB ==========")
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "kalakriti_admin")
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        coll = db["poc_test"]
        doc_id = str(uuid.uuid4())
        await coll.insert_one({"_id": doc_id, "test": "hello", "created_at": datetime.utcnow()})
        found = await coll.find_one({"_id": doc_id})
        assert found is not None, "Insert succeeded but could not read"
        await coll.delete_one({"_id": doc_id})
        ok(f"MongoDB at {mongo_url} → DB '{db_name}' works (insert+read+delete)")
        client.close()
        return True
    except Exception as e:
        fail(f"MongoDB test failed: {e}")
        return False


# =========================
# TEST 2: Cashfree Payment Session
# =========================
async def test_cashfree():
    log("\n========== TEST 2: Cashfree - Create Payment Session ==========")
    client_id = os.environ.get("CASHFREE_CLIENT_ID")
    client_secret = os.environ.get("CASHFREE_CLIENT_SECRET")
    env = os.environ.get("CASHFREE_ENVIRONMENT", "sandbox")
    api_version = os.environ.get("CASHFREE_API_VERSION", "2025-01-01")

    base_url = "https://api.cashfree.com/pg" if env == "production" else "https://sandbox.cashfree.com/pg"
    log(f"Environment: {env} → {base_url}")

    if not client_id or not client_secret:
        fail("Missing CASHFREE_CLIENT_ID or CASHFREE_CLIENT_SECRET")
        return False

    order_id = f"KALA-POC-{int(datetime.utcnow().timestamp())}"
    payload = {
        "order_id": order_id,
        "order_amount": 10.0,  # ₹10 test
        "order_currency": "INR",
        "customer_details": {
            "customer_id": "poc_customer_001",
            "customer_phone": "9999999999",
            "customer_email": "poc@kalakriti.in",
            "customer_name": "POC Test",
        },
        "order_meta": {
            "return_url": "https://kalakritishop.in/payment/return?order_id={order_id}",
            "notify_url": "https://kalakritishop.in/api/public/payment/webhook",
        },
        "order_note": "POC test order - DO NOT PROCESS",
    }
    headers = {
        "Content-Type": "application/json",
        "x-api-version": api_version,
        "x-client-id": client_id,
        "x-client-secret": client_secret,
        "x-request-id": f"poc-{uuid.uuid4().hex[:8]}",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as http:
            r = await http.post(f"{base_url}/orders", json=payload, headers=headers)
            log(f"HTTP {r.status_code}: {r.text[:300]}")
            if r.status_code not in (200, 201):
                fail(f"Cashfree returned {r.status_code}")
                return False
            data = r.json()
            session_id = data.get("payment_session_id")
            cf_order_id = data.get("cf_order_id")
            if not session_id:
                fail(f"No payment_session_id in response: {data}")
                return False
            ok(f"Cashfree payment session created")
            ok(f"  order_id: {order_id}")
            ok(f"  cf_order_id: {cf_order_id}")
            ok(f"  payment_session_id: {session_id[:40]}...")
            return True
    except Exception as e:
        fail(f"Cashfree exception: {e}")
        return False


# =========================
# TEST 3: Shiprocket Auth + Serviceability
# =========================
async def test_shiprocket():
    log("\n========== TEST 3: Shiprocket - Auth + Serviceability ==========")
    email = os.environ.get("SHIPROCKET_EMAIL")
    password = os.environ.get("SHIPROCKET_PASSWORD")
    pickup_pin = os.environ.get("SHIPROCKET_PICKUP_PINCODE", "201301")
    base_url = os.environ.get("SHIPROCKET_BASE_URL", "https://apiv2.shiprocket.in")

    if not email or not password:
        fail("Missing SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD")
        return False

    try:
        async with httpx.AsyncClient(timeout=20.0) as http:
            # 1. Login
            log(f"Authenticating as {email}...")
            r = await http.post(
                f"{base_url}/v1/external/auth/login",
                json={"email": email, "password": password},
                headers={"Content-Type": "application/json"},
            )
            log(f"Login HTTP {r.status_code}: {r.text[:200]}")
            if r.status_code != 200:
                fail(f"Shiprocket login failed: {r.status_code}")
                return False
            login_data = r.json()
            token = login_data.get("token")
            if not token:
                fail(f"No token in login response: {login_data}")
                return False
            ok(f"Shiprocket login OK. Token: {token[:25]}...")
            ok(f"  First name: {login_data.get('first_name')}, Company: {login_data.get('company_id')}")

            auth_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
            }

            # 2. Serviceability check - pickup 201301 -> Mumbai 400001, 0.5kg
            log(f"Checking serviceability {pickup_pin} → 400001 (0.5kg)...")
            r2 = await http.get(
                f"{base_url}/v1/external/courier/serviceability/",
                params={
                    "pickup_postcode": pickup_pin,
                    "delivery_postcode": "400001",
                    "weight": 0.5,
                    "cod": 0,
                },
                headers=auth_headers,
            )
            log(f"Serviceability HTTP {r2.status_code}")
            if r2.status_code != 200:
                fail(f"Serviceability check failed: {r2.text[:300]}")
                return False
            srv = r2.json()
            available = srv.get("data", {}).get("available_courier_companies", [])
            if not available:
                warn(f"No couriers returned. Full response: {srv}")
                # Not a total failure — means account may lack courier config
                return True
            ok(f"Serviceability returned {len(available)} couriers")
            # Show top 3 by rate
            sorted_c = sorted(available, key=lambda x: float(x.get("rate", 9999)))[:3]
            for c in sorted_c:
                log(f"  - {c.get('courier_name')}: ₹{c.get('rate')} ({c.get('etd', '?')})")

            # 3. List pickup locations
            log("Fetching pickup locations...")
            r3 = await http.get(f"{base_url}/v1/external/settings/company/pickup", headers=auth_headers)
            if r3.status_code == 200:
                pickups = r3.json().get("data", {}).get("shipping_address", [])
                ok(f"Pickup locations configured: {len(pickups)}")
                for p in pickups[:3]:
                    log(f"  - {p.get('pickup_location')}: {p.get('city')}, {p.get('pin_code')}")
            else:
                warn(f"Could not fetch pickup locations: {r3.status_code}")

            return True
    except Exception as e:
        fail(f"Shiprocket exception: {e}")
        return False


# =========================
# RUNNER
# =========================
async def main():
    log("\n" + "=" * 60, CYAN)
    log(" KALAKRITI ADMIN - POC Integration Tests", CYAN)
    log("=" * 60, CYAN)

    results = {}
    results["mongodb"] = await test_mongodb()
    results["cashfree"] = await test_cashfree()
    results["shiprocket"] = await test_shiprocket()

    log("\n" + "=" * 60, CYAN)
    log(" RESULTS", CYAN)
    log("=" * 60, CYAN)
    for k, v in results.items():
        (ok if v else fail)(f"{k.upper()}: {'PASS' if v else 'FAIL'}")

    all_pass = all(results.values())
    if all_pass:
        log("\n🎉 ALL INTEGRATIONS PASS - READY FOR PHASE 2\n", GREEN)
        sys.exit(0)
    else:
        log("\n❌ SOME TESTS FAILED - FIX BEFORE PROCEEDING\n", RED)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
