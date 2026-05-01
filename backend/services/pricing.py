"""Pricing calculation service."""
from typing import Optional, Tuple
from datetime import datetime

from db import mediums, coupons


async def calculate_pricing(
    medium_slug: str,
    size: Optional[str],
    faces: int,
    rush: bool,
    coupon_code: Optional[str] = None,
) -> dict:
    medium = await mediums.find_one({"slug": medium_slug, "active": True})
    if not medium:
        raise ValueError("Medium not found or inactive")

    base_price = float(medium["base_price"])
    size_mult = 1.0
    if size and medium.get("size_options"):
        for opt in medium["size_options"]:
            if opt.get("size") == size:
                size_mult = float(opt.get("multiplier", 1.0))
                break

    per_face = float(medium.get("per_face_price", 0))
    faces = max(1, int(faces))
    additional_face_charge = per_face * (faces - 1)

    subtotal_before_rush = (base_price * size_mult) + additional_face_charge

    rush_fee = 0.0
    if rush:
        rush_fee = subtotal_before_rush * float(medium.get("rush_fee_percent", 0)) / 100.0

    subtotal = subtotal_before_rush + rush_fee

    # Coupon
    discount = 0.0
    applied_coupon = None
    if coupon_code:
        coupon = await coupons.find_one({"code": coupon_code.upper().strip(), "active": True})
        if coupon:
            now = datetime.utcnow()
            exp = coupon.get("expires_at")
            valid = True
            if exp and isinstance(exp, datetime) and exp < now:
                valid = False
            if coupon.get("used_count", 0) >= coupon.get("max_uses", 99999):
                valid = False
            if subtotal < coupon.get("min_order", 0):
                valid = False
            if valid:
                if coupon["type"] == "percentage":
                    discount = subtotal * float(coupon["value"]) / 100.0
                else:
                    discount = float(coupon["value"])
                discount = min(discount, subtotal)
                applied_coupon = coupon["code"]

    total = max(0.0, subtotal - discount)

    return {
        "base_price": base_price,
        "size_multiplier": size_mult,
        "per_face_price": per_face,
        "faces": faces,
        "additional_face_charge": additional_face_charge,
        "rush_fee": round(rush_fee, 2),
        "subtotal": round(subtotal, 2),
        "coupon_code": applied_coupon,
        "discount": round(discount, 2),
        "total": round(total, 2),
        "medium_name": medium.get("name"),
    }
