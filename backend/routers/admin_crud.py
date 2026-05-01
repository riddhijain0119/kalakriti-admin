"""Admin CRUD routers for mediums, gallery, testimonials, content, coupons, settings."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

from db import mediums, gallery, testimonials, content, coupons, settings_col
from models import (
    Medium, MediumBase, MediumUpdate,
    GalleryItem, GalleryUpdate,
    Testimonial, TestimonialUpdate,
    Coupon, CouponUpdate,
    SiteSettings,
    HomepageContent,
)
from auth import get_current_admin
from utils import serialize_doc

router = APIRouter(prefix="/api/admin", tags=["admin-crud"], dependencies=[Depends(get_current_admin)])


# ======== MEDIUMS ========
@router.get("/mediums")
async def list_mediums():
    docs = await mediums.find({}).sort("sort_order", 1).to_list(length=100)
    return [serialize_doc(d) for d in docs]


@router.post("/mediums")
async def create_medium(body: MediumBase):
    existing = await mediums.find_one({"slug": body.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    doc = Medium(**body.dict()).dict()
    await mediums.insert_one(doc)
    return serialize_doc(doc)


@router.get("/mediums/{medium_id}")
async def get_medium(medium_id: str):
    doc = await mediums.find_one({"id": medium_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize_doc(doc)


@router.put("/mediums/{medium_id}")
async def update_medium(medium_id: str, body: MediumUpdate):
    update = {k: v for k, v in body.dict(exclude_none=True).items()}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    update["updated_at"] = datetime.utcnow()
    r = await mediums.update_one({"id": medium_id}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await mediums.find_one({"id": medium_id})
    return serialize_doc(doc)


@router.delete("/mediums/{medium_id}")
async def delete_medium(medium_id: str):
    r = await mediums.delete_one({"id": medium_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


# ======== GALLERY ========
@router.get("/gallery")
async def list_gallery():
    docs = await gallery.find({}).sort("sort_order", 1).to_list(length=500)
    return [serialize_doc(d) for d in docs]


@router.post("/gallery")
async def create_gallery(body: GalleryItem):
    await gallery.insert_one(body.dict())
    return serialize_doc(body.dict())


@router.put("/gallery/{gid}")
async def update_gallery(gid: str, body: GalleryUpdate):
    update = {k: v for k, v in body.dict(exclude_none=True).items()}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    r = await gallery.update_one({"id": gid}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await gallery.find_one({"id": gid})
    return serialize_doc(doc)


@router.delete("/gallery/{gid}")
async def delete_gallery(gid: str):
    r = await gallery.delete_one({"id": gid})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


# ======== TESTIMONIALS ========
@router.get("/testimonials")
async def list_testimonials():
    docs = await testimonials.find({}).sort("sort_order", 1).to_list(length=200)
    return [serialize_doc(d) for d in docs]


@router.post("/testimonials")
async def create_testimonial(body: Testimonial):
    await testimonials.insert_one(body.dict())
    return serialize_doc(body.dict())


@router.put("/testimonials/{tid}")
async def update_testimonial(tid: str, body: TestimonialUpdate):
    update = {k: v for k, v in body.dict(exclude_none=True).items()}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    r = await testimonials.update_one({"id": tid}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await testimonials.find_one({"id": tid})
    return serialize_doc(doc)


@router.delete("/testimonials/{tid}")
async def delete_testimonial(tid: str):
    r = await testimonials.delete_one({"id": tid})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


# ======== CONTENT ========
@router.get("/content/homepage")
async def get_homepage():
    doc = await content.find_one({"page": "homepage"})
    if not doc:
        return HomepageContent().dict()
    return serialize_doc(doc)


@router.put("/content/homepage")
async def update_homepage(body: dict):
    body["page"] = "homepage"
    body["updated_at"] = datetime.utcnow()
    await content.update_one({"page": "homepage"}, {"$set": body}, upsert=True)
    doc = await content.find_one({"page": "homepage"})
    return serialize_doc(doc)


# ======== COUPONS ========
@router.get("/coupons")
async def list_coupons():
    docs = await coupons.find({}).sort("created_at", -1).to_list(length=500)
    return [serialize_doc(d) for d in docs]


@router.post("/coupons")
async def create_coupon(body: Coupon):
    body.code = body.code.upper().strip()
    existing = await coupons.find_one({"code": body.code})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    await coupons.insert_one(body.dict())
    return serialize_doc(body.dict())


@router.put("/coupons/{cid}")
async def update_coupon(cid: str, body: CouponUpdate):
    update = {k: v for k, v in body.dict(exclude_none=True).items()}
    if "code" in update:
        update["code"] = update["code"].upper().strip()
    r = await coupons.update_one({"id": cid}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await coupons.find_one({"id": cid})
    return serialize_doc(doc)


@router.delete("/coupons/{cid}")
async def delete_coupon(cid: str):
    r = await coupons.delete_one({"id": cid})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


# ======== SETTINGS ========
@router.get("/settings")
async def get_settings():
    doc = await settings_col.find_one({"_id": "singleton"})
    if not doc:
        return SiteSettings().dict()
    doc.pop("_id", None)
    return serialize_doc(doc)


@router.put("/settings")
async def update_settings(body: dict):
    await settings_col.update_one({"_id": "singleton"}, {"$set": body}, upsert=True)
    doc = await settings_col.find_one({"_id": "singleton"})
    doc.pop("_id", None)
    return serialize_doc(doc)
