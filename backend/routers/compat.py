"""
Compatibility layer for the existing kalakritishop.in Next.js frontend.

The existing Next.js app expects endpoints at /api/content/{section} returning
shapes like { data: { items: [...] } } with specific field names (key, starting_price,
turnaround as string, tag, image, etc).

This router maps data from our admin schema into their expected shapes so the
Next.js storefront works without any frontend code changes — just point
NEXT_PUBLIC_BACKEND_URL at this backend.
"""
from fastapi import APIRouter
from datetime import datetime

from db import mediums as mediums_col, gallery as gallery_col, testimonials as tcol, content as content_col, settings_col

router = APIRouter(prefix="/api", tags=["compat"])


def _tag_color(badge: str) -> str:
    m = {
        "Most Popular": "bg-[#C9A84C] text-[#2C1810]",
        "Best Value": "bg-[#2C1810] text-[#FAF6F0]",
        "Premium": "bg-amber-100 text-amber-800",
        "New": "bg-emerald-100 text-emerald-800",
    }
    return m.get(badge or "", "")


def _medium_to_cms(m: dict) -> dict:
    return {
        "id": m.get("id"),
        "key": m.get("slug"),
        "name": m.get("name"),
        "tagline": m.get("tagline", ""),
        "description": m.get("description", ""),
        "image": m.get("image_url") or "",
        "image_alt": f"{m.get('name')} portrait",
        "starting_price": float(m.get("base_price", 0)),
        "turnaround": f"{m.get('turnaround_min', 5)}–{m.get('turnaround_max', 10)} days",
        "tag": m.get("badge") or "",
        "tag_color": _tag_color(m.get("badge")),
    }


@router.get("/content/mediums")
async def content_mediums():
    docs = await mediums_col.find({"active": True}).sort("sort_order", 1).to_list(length=50)
    items = [_medium_to_cms(m) for m in docs]
    return {"data": {"items": items}}


@router.get("/content/hero")
async def content_hero():
    docs = await gallery_col.find({"featured": True, "before_url": {"$ne": ""}}).sort("sort_order", 1).to_list(length=10)
    items = []
    for g in docs:
        if not g.get("before_url"):
            continue
        slug = g.get("medium") or ""
        mdoc = await mediums_col.find_one({"slug": slug})
        mname = mdoc.get("name") if mdoc else slug.replace("-", " ").title()
        mdays = f"{mdoc.get('turnaround_min', 7)} days" if mdoc else "7 days"
        items.append({
            "id": g.get("id"),
            "before": g.get("before_url", ""),
            "before_alt": f"Original photo — {g.get('title')}",
            "after": g.get("after_url", ""),
            "after_alt": f"{mname} portrait — {g.get('title')}",
            "medium": mname,
            "turnaround": mdays,
            "size": "A3",
        })
    return {"data": {"items": items}}


@router.get("/content/gallery")
async def content_gallery():
    docs = await gallery_col.find({}).sort("sort_order", 1).to_list(length=500)
    items = []
    for g in docs:
        mslug = g.get("medium") or ""
        mdoc = await mediums_col.find_one({"slug": mslug})
        mname = mdoc.get("name") if mdoc else mslug.replace("-", " ").title()
        items.append({
            "id": g.get("id"),
            "title": g.get("title", ""),
            "medium": mname,
            "size": "A3",
            "image": g.get("after_url", ""),
            "alt": g.get("title", "") or f"{mname} portrait",
            "tag": "Featured" if g.get("featured") else "",
        })
    return {"data": {"items": items}}


@router.get("/content/pricing")
async def content_pricing():
    docs = await mediums_col.find({}).sort("sort_order", 1).to_list(length=50)
    medium_base_prices = {}
    medium_days = {}
    for m in docs:
        key = m.get("slug")
        medium_base_prices[key] = float(m.get("base_price", 0))
        medium_days[key] = int(m.get("turnaround_min", 7))
    size_multipliers = {}
    for m in docs:
        for so in (m.get("size_options") or []):
            size_multipliers[so.get("size")] = float(so.get("multiplier", 1.0))
        if size_multipliers:
            break
    if not size_multipliers:
        size_multipliers = {"A4": 1.0, "A3": 1.5, "A2": 2.2}
    return {
        "data": {
            "medium_base_prices": medium_base_prices,
            "size_multipliers": size_multipliers,
            "frame_costs": {"none": 0, "classic": 800, "premium": 1500},
            "medium_days": medium_days,
            "addon_prices": {"express_delivery": 500, "gift_wrap": 200, "digital_copy": 300},
            "gst_rate": 0.18,
            "rush_delivery_surcharge": 0.25,
        }
    }


@router.get("/content/site_text")
async def content_site_text():
    hp = await content_col.find_one({"page": "homepage"}) or {}
    s = await settings_col.find_one({"_id": "singleton"}) or {}
    data = {
        "hero_headline": hp.get("hero_title", "From Snapshot to Masterpiece"),
        "hero_eyebrow": hp.get("hero_eyebrow", "Handcrafted in India"),
        "hero_subtitle": hp.get("hero_subtitle", ""),
        "hero_cta_primary": hp.get("hero_cta_primary", "Create My Portrait"),
        "hero_cta_secondary": hp.get("hero_cta_secondary", "Browse Gallery"),
        "cta_title": hp.get("cta_title", ""),
        "cta_subtitle": hp.get("cta_subtitle", ""),
        "brand_name": s.get("brand_name", "Kalakriti"),
        "brand_tagline": s.get("tagline", ""),
        "contact_email": s.get("contact_email", ""),
        "contact_phone": s.get("contact_phone", ""),
        "whatsapp": s.get("whatsapp", ""),
        "instagram": s.get("instagram", ""),
        "facebook": s.get("facebook", ""),
    }
    for i, stat in enumerate(hp.get("stats", []) or []):
        data[f"stat_{i}_value"] = stat.get("value", "")
        data[f"stat_{i}_label"] = stat.get("label", "")
    for i, step in enumerate(hp.get("process_steps", []) or []):
        data[f"step_{i}_title"] = step.get("title", "")
        data[f"step_{i}_description"] = step.get("description", "")
    return {"data": data}


@router.get("/content/banner")
async def content_banner():
    return {"data": {"active": False, "text": "", "cta_text": "", "cta_url": ""}}


@router.get("/content/testimonials")
async def content_testimonials():
    docs = await tcol.find({}).sort("sort_order", 1).to_list(length=200)
    items = []
    for t in docs:
        items.append({
            "id": t.get("id"),
            "name": t.get("name"),
            "location": t.get("location", ""),
            "avatar": t.get("avatar_url", ""),
            "avatarAlt": t.get("name", ""),
            "rating": int(t.get("rating", 5)),
            "medium": t.get("medium", ""),
            "text": t.get("quote", ""),
            "deliveredIn": f"{t.get('delivered_days')} days" if t.get("delivered_days") else "",
            "orderValue": "",
        })
    return {"data": {"items": items}}
