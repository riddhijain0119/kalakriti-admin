"""Seed demo orders for testing. Run: python seed_demo_orders.py"""
import asyncio
import uuid
from datetime import datetime, timedelta
import random

from db import orders
from models import Order, CustomerInfo, OrderPricing, PaymentInfo, TimelineEvent, ShippingInfo


DEMOS = [
    {"name": "Priya Krishnamurthy", "email": "priya@example.com", "phone": "9876543210",
     "address": "42, Sarjapur Road, HSR Layout", "city": "Bengaluru", "state": "Karnataka", "pincode": "560102",
     "medium": "watercolour", "medium_name": "Watercolour", "size": "A3", "faces": 2, "rush": False,
     "base": 2800, "total": 4600, "status": "IN_PROGRESS", "paid": True, "day_offset": 1},

    {"name": "Arjun Mehta", "email": "arjun.mehta@example.com", "phone": "9988776655",
     "address": "12, Lodhi Road", "city": "New Delhi", "state": "Delhi", "pincode": "110003",
     "medium": "oil-on-canvas", "medium_name": "Oil on Canvas", "size": "16x20", "faces": 1, "rush": True,
     "base": 4500, "total": 8775, "status": "NEW", "paid": True, "day_offset": 0},

    {"name": "Meera Iyer", "email": "meera.iyer@example.com", "phone": "9123456780",
     "address": "5, Alipore Road", "city": "Kolkata", "state": "West Bengal", "pincode": "700027",
     "medium": "pencil-sketch", "medium_name": "Pencil Sketch", "size": "A4", "faces": 1, "rush": False,
     "base": 1800, "total": 1800, "status": "APPROVED", "paid": True, "day_offset": 3},

    {"name": "Rohan Kapoor", "email": "rohan.k@example.com", "phone": "9871234567",
     "address": "88, Carter Road, Bandra", "city": "Mumbai", "state": "Maharashtra", "pincode": "400050",
     "medium": "charcoal", "medium_name": "Charcoal", "size": "A3", "faces": 1, "rush": False,
     "base": 2200, "total": 3300, "status": "DRAFT_SHARED", "paid": True, "day_offset": 5},

    {"name": "Sneha Rao", "email": "sneha.rao@example.com", "phone": "9000011111",
     "address": "22, Jubilee Hills", "city": "Hyderabad", "state": "Telangana", "pincode": "500033",
     "medium": "watercolour", "medium_name": "Watercolour", "size": "A2", "faces": 3, "rush": True,
     "base": 2800, "total": 9450, "status": "PAYMENT_RECEIVED", "paid": True, "day_offset": 2},

    {"name": "Kavya Nair", "email": "kavya.n@example.com", "phone": "9812345670",
     "address": "77, MG Road", "city": "Kochi", "state": "Kerala", "pincode": "682016",
     "medium": "pencil-sketch", "medium_name": "Pencil Sketch", "size": "A3", "faces": 1, "rush": False,
     "base": 1800, "total": 2700, "status": "SHIPPED", "paid": True, "day_offset": 10,
     "awb": "DEL99887766", "courier": "Delhivery Surface"},

    {"name": "Vikram Singh", "email": "vikram.s@example.com", "phone": "9876500000",
     "address": "15, Golf Course Road", "city": "Gurgaon", "state": "Haryana", "pincode": "122002",
     "medium": "oil-on-canvas", "medium_name": "Oil on Canvas", "size": "20x24", "faces": 2, "rush": False,
     "base": 4500, "total": 10500, "status": "NEW", "paid": False, "day_offset": 0},
]

REFS = [
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
]


async def seed_demo():
    existing = await orders.count_documents({})
    if existing > 0:
        print(f"Skipping — {existing} orders already present")
        return

    for i, d in enumerate(DEMOS, 1):
        now = datetime.utcnow() - timedelta(days=d["day_offset"])
        order_number = f"KALA-{now.strftime('%y%m%d')}-{str(i).zfill(3)}{chr(65+i)}"
        cust = CustomerInfo(name=d["name"], email=d["email"], phone=d["phone"], address=d["address"], city=d["city"], state=d["state"], pincode=d["pincode"])
        pricing = OrderPricing(base_price=d["base"], size=d["size"], size_multiplier=1.0, faces=d["faces"], per_face_price=600, rush=d["rush"], rush_fee=0 if not d["rush"] else d["total"] * 0.2, subtotal=d["total"], total=d["total"])
        payment = PaymentInfo(
            status="PAID" if d["paid"] else "PENDING",
            amount=d["total"],
            paid_at=now if d["paid"] else None,
            cashfree_order_id="demo-" + order_number if d["paid"] else None,
        )
        timeline = [TimelineEvent(status="NEW", note="Order placed", at=now).dict()]
        if d["paid"]:
            timeline.append(TimelineEvent(status="PAYMENT_RECEIVED", note="Cashfree webhook", at=now + timedelta(minutes=3)).dict())
        if d["status"] not in ("NEW", "PAYMENT_RECEIVED"):
            timeline.append(TimelineEvent(status=d["status"], note="", at=now + timedelta(hours=2)).dict())
        shipping = ShippingInfo()
        if d.get("awb"):
            shipping = ShippingInfo(status="SHIPPED", awb_code=d["awb"], courier_name=d["courier"], shipped_at=now + timedelta(days=1))
        order = Order(
            order_number=order_number, customer=cust, medium_slug=d["medium"], medium_name=d["medium_name"],
            size=d["size"], faces=d["faces"], rush=d["rush"],
            references=[{"url": REFS[i % len(REFS)], "filename": f"ref-{i}.jpg"}],
            pricing=pricing, status=d["status"], timeline=timeline, payment=payment, shipping=shipping,
            notes="",
        )
        doc = order.dict()
        doc["created_at"] = now
        doc["updated_at"] = now
        await orders.insert_one(doc)
        print(f"Seeded {order_number}")

    # Sample coupon
    from db import coupons
    if await coupons.count_documents({}) == 0:
        await coupons.insert_one({
            "id": str(uuid.uuid4()), "code": "WELCOME10", "type": "percentage",
            "value": 10, "min_order": 1500, "max_uses": 500, "used_count": 12,
            "active": True, "description": "10% off for new customers",
            "created_at": datetime.utcnow(),
        })
        print("Seeded WELCOME10 coupon")


if __name__ == "__main__":
    asyncio.run(seed_demo())
