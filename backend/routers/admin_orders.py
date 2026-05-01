"""Admin order management + shipping."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from db import orders, settings_col
from models import (
    OrderStatusUpdate, OrderNotesUpdate, ShipOrderRequest, TimelineEvent,
    ORDER_STATUSES,
)
from auth import get_current_admin
from utils import serialize_doc
from integrations import shiprocket

router = APIRouter(prefix="/api/admin/orders", tags=["admin-orders"], dependencies=[Depends(get_current_admin)])


@router.get("")
async def list_orders(
    status: Optional[str] = None,
    medium: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
):
    q: dict = {}
    if status:
        q["status"] = status
    if medium:
        q["medium_slug"] = medium
    if search:
        q["$or"] = [
            {"order_number": {"$regex": search, "$options": "i"}},
            {"customer.email": {"$regex": search, "$options": "i"}},
            {"customer.name": {"$regex": search, "$options": "i"}},
        ]
    total = await orders.count_documents(q)
    docs = await orders.find(q).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    return {"total": total, "items": [serialize_doc(d) for d in docs]}


@router.get("/{order_id}")
async def get_order(order_id: str):
    doc = await orders.find_one({"id": order_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize_doc(doc)


@router.put("/{order_id}/status")
async def update_status(order_id: str, body: OrderStatusUpdate):
    if body.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {ORDER_STATUSES}")
    event = TimelineEvent(status=body.status, note=body.note).dict()
    r = await orders.update_one(
        {"id": order_id},
        {
            "$set": {"status": body.status, "updated_at": datetime.utcnow()},
            "$push": {"timeline": event},
        },
    )
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await orders.find_one({"id": order_id})
    return serialize_doc(doc)


@router.put("/{order_id}/notes")
async def update_notes(order_id: str, body: OrderNotesUpdate):
    r = await orders.update_one(
        {"id": order_id},
        {"$set": {"notes": body.notes, "updated_at": datetime.utcnow()}},
    )
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await orders.find_one({"id": order_id})
    return serialize_doc(doc)


@router.post("/{order_id}/check-serviceability")
async def check_serviceability(order_id: str):
    order = await orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    s = await settings_col.find_one({"_id": "singleton"}) or {}
    weight = float(s.get("default_package_weight_kg", 0.5))
    try:
        couriers = await shiprocket.check_serviceability(
            delivery_pincode=order["customer"].get("pincode", ""),
            weight=weight,
            cod=0,
        )
        couriers_sorted = sorted(couriers, key=lambda c: c.get("rate") or 99999)
        return {"couriers": couriers_sorted}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Shiprocket serviceability failed: {e}")


@router.post("/{order_id}/ship")
async def ship_order(order_id: str, body: ShipOrderRequest):
    order = await orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    s = await settings_col.find_one({"_id": "singleton"}) or {}
    weight = body.weight or float(s.get("default_package_weight_kg", 0.5))
    length = body.length or float(s.get("default_package_length_cm", 30))
    breadth = body.breadth or float(s.get("default_package_breadth_cm", 25))
    height = body.height or float(s.get("default_package_height_cm", 5))
    pickup_location = s.get("pickup_location_name", "Primary")

    cust = order["customer"]
    pricing = order.get("pricing", {})

    # Step 1: courier serviceability
    try:
        couriers = await shiprocket.check_serviceability(
            delivery_pincode=cust.get("pincode", ""),
            weight=weight,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Shiprocket serviceability error: {e}")
    if not couriers:
        raise HTTPException(status_code=400, detail="No couriers available for this route")

    # Select courier
    if body.courier_id:
        chosen = next((c for c in couriers if c.get("courier_company_id") == body.courier_id), None)
        if not chosen:
            raise HTTPException(status_code=400, detail="Requested courier not available")
    elif body.prefer == "fastest":
        chosen = min(couriers, key=lambda c: c.get("estimated_delivery_days") or 999)
    else:
        chosen = min(couriers, key=lambda c: c.get("rate") or 99999)

    # Step 2: create adhoc order in Shiprocket
    sr_payload = {
        "order_id": order["order_number"],
        "order_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "pickup_location": pickup_location,
        "billing_customer_name": cust.get("name", "")[:50] or "Customer",
        "billing_last_name": "",
        "billing_address": cust.get("address", "") or "N/A",
        "billing_city": cust.get("city", "") or "Unknown",
        "billing_pincode": cust.get("pincode", ""),
        "billing_state": cust.get("state", "") or "Unknown",
        "billing_country": cust.get("country", "India"),
        "billing_email": cust.get("email", ""),
        "billing_phone": cust.get("phone", ""),
        "shipping_is_billing": True,
        "order_items": [
            {
                "name": f"{order.get('medium_name', 'Portrait')} Portrait",
                "sku": order["order_number"],
                "units": 1,
                "selling_price": float(pricing.get("total", 0)),
                "discount": float(pricing.get("discount", 0)),
                "tax": 0,
                "hsn": "",
            }
        ],
        "payment_method": "Prepaid",
        "sub_total": float(pricing.get("total", 0)),
        "length": length,
        "breadth": breadth,
        "height": height,
        "weight": weight,
    }

    try:
        sr_order = await shiprocket.create_adhoc_order(sr_payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Shiprocket order create failed: {e}")

    shipment_id = sr_order.get("shipment_id")
    sr_order_id = sr_order.get("order_id")

    if not shipment_id:
        raise HTTPException(status_code=502, detail=f"Shiprocket did not return shipment_id: {sr_order}")

    # Step 3: assign AWB
    awb_code = None
    courier_name = chosen.get("courier_name")
    try:
        awb_res = await shiprocket.assign_awb(shipment_id=shipment_id, courier_id=chosen.get("courier_company_id"))
        awb_code = (
            awb_res.get("awb_assign_status") and awb_res.get("response", {}).get("data", {}).get("awb_code")
        ) or awb_res.get("awb_code")
        # Fallback exploration
        if not awb_code and isinstance(awb_res, dict):
            data = awb_res.get("response", {}).get("data", {}) or awb_res.get("data", {})
            awb_code = data.get("awb_code")
            courier_name = data.get("courier_name") or courier_name
    except Exception as e:
        # AWB failed but order is created; surface as warning
        pass

    # Step 4: generate label (best-effort)
    label_url = None
    try:
        label_res = await shiprocket.generate_label([shipment_id])
        label_url = label_res.get("label_url") or label_res.get("pdf_url")
    except Exception:
        pass

    # Step 5: generate pickup (best-effort)
    try:
        await shiprocket.generate_pickup([shipment_id])
    except Exception:
        pass

    # Update order
    shipping_update = {
        "status": "SHIPPED" if awb_code else "PROCESSING",
        "shiprocket_order_id": sr_order_id,
        "shiprocket_shipment_id": shipment_id,
        "awb_code": awb_code,
        "courier_name": courier_name,
        "courier_id": chosen.get("courier_company_id"),
        "label_url": label_url,
        "shipped_at": datetime.utcnow() if awb_code else None,
    }
    new_status = "SHIPPED" if awb_code else order.get("status", "NEW")
    event = TimelineEvent(
        status=new_status,
        note=f"Shipped via {courier_name}. AWB: {awb_code or 'pending'}",
    ).dict()
    await orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "shipping": shipping_update,
                "status": new_status,
                "updated_at": datetime.utcnow(),
            },
            "$push": {"timeline": event},
        },
    )
    doc = await orders.find_one({"id": order_id})
    return {
        "success": bool(awb_code),
        "awb_code": awb_code,
        "courier_name": courier_name,
        "shipment_id": shipment_id,
        "label_url": label_url,
        "order": serialize_doc(doc),
    }


@router.get("/{order_id}/track")
async def admin_track_order(order_id: str):
    order = await orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    awb = order.get("shipping", {}).get("awb_code")
    if not awb:
        raise HTTPException(status_code=400, detail="Order has not been shipped yet")
    try:
        data = await shiprocket.track_by_awb(awb)
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Tracking error: {e}")
