"""Public API routes — consumed by the Next.js storefront (kalakritishop.in) and customer flows."""
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks

from db import mediums, gallery, testimonials, content, coupons, settings_col, orders, leads, payments
from models import (
    PricingCalculateRequest, PricingCalculateResponse,
    OrderCreateRequest, Order, TimelineEvent, OrderPricing, PaymentInfo,
    CouponValidateRequest, PaymentSessionRequest, PaymentSessionResponse,
    OrderTrackRequest, Lead,
)
from services.pricing import calculate_pricing
from services.orders import generate_order_number
from utils import serialize_doc
from integrations import cashfree
from config import settings

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/mediums")
async def public_mediums():
    docs = await mediums.find({"active": True}).sort("sort_order", 1).to_list(length=100)
    return [serialize_doc(d) for d in docs]


@router.get("/mediums/{slug}")
async def public_medium_by_slug(slug: str):
    doc = await mediums.find_one({"slug": slug, "active": True})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize_doc(doc)


@router.get("/gallery")
async def public_gallery(featured: bool | None = None):
    q = {}
    if featured is not None:
        q["featured"] = featured
    docs = await gallery.find(q).sort("sort_order", 1).to_list(length=500)
    return [serialize_doc(d) for d in docs]


@router.get("/testimonials")
async def public_testimonials(featured: bool | None = None):
    q = {}
    if featured is not None:
        q["featured"] = featured
    docs = await testimonials.find(q).sort("sort_order", 1).to_list(length=200)
    return [serialize_doc(d) for d in docs]


@router.get("/homepage")
async def public_homepage():
    doc = await content.find_one({"page": "homepage"})
    if not doc:
        return {}
    return serialize_doc(doc)


@router.get("/site-settings")
async def public_site_settings():
    doc = await settings_col.find_one({"_id": "singleton"})
    if not doc:
        return {}
    doc.pop("_id", None)
    # Remove shipping/pickup private fields from public response
    public_keys = ["brand_name", "tagline", "contact_email", "contact_phone", "whatsapp", "instagram", "facebook"]
    return {k: doc.get(k) for k in public_keys if k in doc}


@router.post("/pricing/calculate", response_model=PricingCalculateResponse)
async def public_pricing(body: PricingCalculateRequest):
    try:
        result = await calculate_pricing(
            medium_slug=body.medium_slug,
            size=body.size,
            faces=body.faces,
            rush=body.rush,
            coupon_code=body.coupon_code,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return PricingCalculateResponse(**{k: v for k, v in result.items() if k in PricingCalculateResponse.model_fields})


@router.post("/coupons/validate")
async def public_coupon_validate(body: CouponValidateRequest):
    coupon = await coupons.find_one({"code": body.code.upper().strip(), "active": True})
    if not coupon:
        return {"valid": False, "reason": "Invalid or inactive code"}
    now = datetime.utcnow()
    exp = coupon.get("expires_at")
    if exp and isinstance(exp, datetime) and exp < now:
        return {"valid": False, "reason": "Coupon expired"}
    if coupon.get("used_count", 0) >= coupon.get("max_uses", 99999):
        return {"valid": False, "reason": "Coupon limit reached"}
    if body.order_total < coupon.get("min_order", 0):
        return {"valid": False, "reason": f"Minimum order ₹{coupon['min_order']} required"}
    if coupon["type"] == "percentage":
        discount = body.order_total * float(coupon["value"]) / 100.0
    else:
        discount = float(coupon["value"])
    discount = min(discount, body.order_total)
    return {
        "valid": True,
        "code": coupon["code"],
        "type": coupon["type"],
        "value": coupon["value"],
        "discount": round(discount, 2),
    }


@router.post("/orders")
async def public_create_order(body: OrderCreateRequest):
    try:
        pricing_calc = await calculate_pricing(
            medium_slug=body.medium_slug,
            size=body.size,
            faces=body.faces,
            rush=body.rush,
            coupon_code=body.coupon_code,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    order_number = await generate_order_number()
    pricing = OrderPricing(
        base_price=pricing_calc["base_price"],
        size=body.size,
        size_multiplier=pricing_calc["size_multiplier"],
        faces=pricing_calc["faces"],
        per_face_price=pricing_calc["per_face_price"],
        rush=body.rush,
        rush_fee=pricing_calc["rush_fee"],
        coupon_code=pricing_calc["coupon_code"],
        discount=pricing_calc["discount"],
        subtotal=pricing_calc["subtotal"],
        total=pricing_calc["total"],
    )
    order = Order(
        order_number=order_number,
        customer=body.customer,
        medium_slug=body.medium_slug,
        medium_name=pricing_calc["medium_name"],
        size=body.size,
        faces=body.faces,
        rush=body.rush,
        references=body.references,
        pricing=pricing,
        status="NEW",
        timeline=[TimelineEvent(status="NEW", note="Order created").dict()],
        payment=PaymentInfo(amount=pricing.total),
    )
    doc = order.dict()
    await orders.insert_one(doc)
    return {
        "order_number": order.order_number,
        "order_id": order.id,
        "total": pricing.total,
        "order": serialize_doc(doc),
    }


@router.post("/orders/track")
async def public_track_order(body: OrderTrackRequest):
    order = await orders.find_one({
        "order_number": body.order_number.upper().strip(),
        "customer.email": body.email.lower().strip(),
    })
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    # Return limited info
    return {
        "order_number": order["order_number"],
        "status": order["status"],
        "medium": order.get("medium_name"),
        "timeline": serialize_doc(order.get("timeline", [])),
        "shipping": serialize_doc(order.get("shipping", {})),
        "created_at": order["created_at"].isoformat() if order.get("created_at") else None,
    }


@router.post("/payment/create-session", response_model=PaymentSessionResponse)
async def public_create_payment_session(body: PaymentSessionRequest):
    order = await orders.find_one({"id": body.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return_url = body.return_url or f"{settings.frontend_base_url}/payment/return?order_id={order['order_number']}"
    notify_url = f"{settings.backend_base_url}/api/public/payment/webhook"
    try:
        res = await cashfree.create_payment_session(
            order_number=order["order_number"],
            amount=float(order["pricing"]["total"]),
            customer={
                "id": order["id"],
                "email": order["customer"].get("email"),
                "phone": order["customer"].get("phone"),
                "name": order["customer"].get("name"),
            },
            return_url=return_url,
            notify_url=notify_url,
            note=f"Kalakriti order {order['order_number']}",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Cashfree error: {e}")

    # persist
    await orders.update_one(
        {"id": body.order_id},
        {"$set": {
            "payment.cashfree_order_id": res["cf_order_id"],
            "payment.payment_session_id": res["payment_session_id"],
            "payment.amount": float(order["pricing"]["total"]),
        }},
    )
    return PaymentSessionResponse(
        payment_session_id=res["payment_session_id"],
        cashfree_order_id=str(res["cf_order_id"]),
        order_number=order["order_number"],
        amount=float(order["pricing"]["total"]),
    )


@router.post("/payment/webhook")
async def public_payment_webhook(request: Request):
    """Cashfree webhook. Always 200 to prevent retries."""
    timestamp = request.headers.get("x-webhook-timestamp", "")
    signature = request.headers.get("x-webhook-signature", "")
    raw = await request.body()

    # Verify
    verified = cashfree.verify_webhook_signature(timestamp, raw, signature)

    try:
        body = json.loads(raw.decode("utf-8")) if raw else {}
    except Exception:
        body = {}

    await payments.insert_one({
        "received_at": datetime.utcnow(),
        "verified": verified,
        "payload": body,
    })

    # Only process if verified
    if not verified:
        return {"status": "ignored", "reason": "signature mismatch"}

    try:
        data = body.get("data", {}) if isinstance(body, dict) else {}
        order_info = data.get("order", {})
        payment_info = data.get("payment", {})
        order_number = order_info.get("order_id") or body.get("order_id")
        payment_status = payment_info.get("payment_status") or body.get("payment_status")
        cf_payment_id = payment_info.get("cf_payment_id") or body.get("cf_payment_id")
        if order_number and payment_status == "SUCCESS":
            await orders.update_one(
                {"order_number": order_number, "payment.status": {"$ne": "PAID"}},
                {"$set": {
                    "payment.status": "PAID",
                    "payment.cashfree_payment_id": str(cf_payment_id) if cf_payment_id else None,
                    "payment.paid_at": datetime.utcnow(),
                    "status": "PAYMENT_RECEIVED",
                    "updated_at": datetime.utcnow(),
                }, "$push": {"timeline": TimelineEvent(status="PAYMENT_RECEIVED", note="Cashfree webhook").dict()}},
            )
    except Exception:
        pass
    return {"status": "received"}


@router.post("/leads")
async def public_lead_capture(body: Lead):
    await leads.insert_one(body.dict())
    return {"success": True}
