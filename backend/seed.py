"""Seed default data for Kalakriti admin."""
from datetime import datetime
import uuid

from db import mediums, content, settings_col, gallery, testimonials


DEFAULT_MEDIUMS = [
    {
        "slug": "watercolour",
        "name": "Watercolour",
        "tagline": "Luminous washes, soft depth",
        "description": "Our most popular medium. Transparent layers build depth and emotion.",
        "base_price": 2800.0,
        "turnaround_min": 7,
        "turnaround_max": 10,
        "image_url": "https://kalakritishop.in/assets/images/gallery/art-05.jpeg",
        "badge": "Most Popular",
        "sort_order": 1,
        "active": True,
        "size_options": [
            {"size": "A4", "multiplier": 1.0, "label": "A4 (8.3\" x 11.7\")"},
            {"size": "A3", "multiplier": 1.5, "label": "A3 (11.7\" x 16.5\")"},
            {"size": "A2", "multiplier": 2.2, "label": "A2 (16.5\" x 23.4\")"},
        ],
        "per_face_price": 800.0,
        "rush_fee_percent": 25.0,
    },
    {
        "slug": "pencil-sketch",
        "name": "Pencil Sketch",
        "tagline": "Timeless graphite precision",
        "description": "Classic fine-art technique with rich tonal range.",
        "base_price": 1800.0,
        "turnaround_min": 5,
        "turnaround_max": 7,
        "image_url": "https://kalakritishop.in/assets/images/gallery/art-06.jpeg",
        "badge": "Best Value",
        "sort_order": 2,
        "active": True,
        "size_options": [
            {"size": "A4", "multiplier": 1.0, "label": "A4"},
            {"size": "A3", "multiplier": 1.5, "label": "A3"},
            {"size": "A2", "multiplier": 2.2, "label": "A2"},
        ],
        "per_face_price": 500.0,
        "rush_fee_percent": 25.0,
    },
    {
        "slug": "oil-on-canvas",
        "name": "Oil on Canvas",
        "tagline": "Heirloom-grade richness",
        "description": "The pinnacle of portrait art.",
        "base_price": 4500.0,
        "turnaround_min": 14,
        "turnaround_max": 18,
        "image_url": "https://kalakritishop.in/assets/images/gallery/art-07.jpeg",
        "badge": "Premium",
        "sort_order": 3,
        "active": True,
        "size_options": [
            {"size": "12x16", "multiplier": 1.0, "label": "12\" x 16\""},
            {"size": "16x20", "multiplier": 1.5, "label": "16\" x 20\""},
            {"size": "20x24", "multiplier": 2.0, "label": "20\" x 24\""},
        ],
        "per_face_price": 1500.0,
        "rush_fee_percent": 30.0,
    },
    {
        "slug": "charcoal",
        "name": "Charcoal",
        "tagline": "Dramatic contrast, raw emotion",
        "description": "Bold shadows and striking highlights.",
        "base_price": 2200.0,
        "turnaround_min": 5,
        "turnaround_max": 8,
        "image_url": "https://kalakritishop.in/assets/images/gallery/art-08.jpeg",
        "badge": None,
        "sort_order": 4,
        "active": True,
        "size_options": [
            {"size": "A4", "multiplier": 1.0, "label": "A4"},
            {"size": "A3", "multiplier": 1.5, "label": "A3"},
            {"size": "A2", "multiplier": 2.2, "label": "A2"},
        ],
        "per_face_price": 600.0,
        "rush_fee_percent": 25.0,
    },
]

DEFAULT_HOMEPAGE = {
    "page": "homepage",
    "hero_eyebrow": "Handcrafted in India",
    "hero_title": "From Snapshot to Masterpiece",
    "hero_subtitle": "Drag the slider to witness the transformation. Every Kalakriti portrait is handcrafted by a verified artist — no filters, no AI.",
    "hero_cta_primary": "Create My Portrait",
    "hero_cta_secondary": "Browse Gallery",
    "stats": [
        {"label": "Portraits Delivered", "value": "2,400+"},
        {"label": "Average Rating", "value": "4.9 / 5"},
        {"label": "Turnaround Time", "value": "5–14 Days"},
        {"label": "Satisfaction Guarantee", "value": "50-Day"},
    ],
    "process_steps": [
        {"title": "Configure & Price", "description": "Choose your medium, size, and number of faces. Our live pricing engine shows the exact cost — no surprises at checkout.", "icon": "palette"},
        {"title": "Upload References", "description": "Upload your reference photos directly in our configurator. We validate resolution on the spot — no blurry results.", "icon": "upload"},
        {"title": "Review & Approve", "description": "Your artist shares a watermarked draft. Annotate directly on the image, request revisions, or approve — all in one place.", "icon": "check"},
        {"title": "Receive Your Art", "description": "High-resolution digital file delivered instantly. Physical print shipped in archival packaging with tracking.", "icon": "package"},
    ],
    "cta_title": "Your memory deserves a permanent form.",
    "cta_subtitle": "Configure your portrait in 3 minutes. Live pricing, free India shipping, hand-painted by verified artists.",
}

DEFAULT_SETTINGS = {
    "_id": "singleton",
    "brand_name": "Kalakriti",
    "tagline": "Transform Your Memories into Museum-Grade Art",
    "contact_email": "hello@kalakritishop.in",
    "contact_phone": "",
    "whatsapp": "",
    "instagram": "",
    "facebook": "",
    "pickup_location_name": "Primary",
    "pickup_address": "",
    "pickup_city": "Gautam Buddha Nagar",
    "pickup_state": "Uttar Pradesh",
    "pickup_pincode": "201301",
    "pickup_country": "India",
    "pickup_phone": "",
    "default_package_weight_kg": 0.5,
    "default_package_length_cm": 30,
    "default_package_breadth_cm": 25,
    "default_package_height_cm": 5,
}

DEFAULT_GALLERY = [
    {"title": "Anniversary Couple", "medium": "watercolour", "before_url": "https://kalakritishop.in/assets/images/gallery/art-01.jpeg", "after_url": "https://kalakritishop.in/assets/images/gallery/art-02.jpeg", "featured": True, "sort_order": 1},
    {"title": "Family Portrait", "medium": "oil-on-canvas", "before_url": "", "after_url": "https://kalakritishop.in/assets/images/gallery/art-07.jpeg", "featured": True, "sort_order": 2},
    {"title": "Pencil Study", "medium": "pencil-sketch", "before_url": "", "after_url": "https://kalakritishop.in/assets/images/gallery/art-06.jpeg", "featured": True, "sort_order": 3},
    {"title": "Charcoal Drama", "medium": "charcoal", "before_url": "", "after_url": "https://kalakritishop.in/assets/images/gallery/art-08.jpeg", "featured": False, "sort_order": 4},
]

DEFAULT_TESTIMONIALS = [
    {
        "name": "Priya Krishnamurthy",
        "location": "Bengaluru",
        "quote": "I ordered a watercolour portrait of my parents for their anniversary. The review portal was a revelation — I could pinpoint exactly what I wanted changed and see it corrected in the next draft. No WhatsApp threads, no miscommunication. The final piece made my mother cry.",
        "rating": 5.0,
        "medium": "watercolour",
        "delivered_days": 8,
        "avatar_url": "https://kalakritishop.in/assets/images/gallery/art-09.jpeg",
        "featured": True,
        "sort_order": 1,
    },
]


async def seed_all():
    # Mediums
    for m in DEFAULT_MEDIUMS:
        existing = await mediums.find_one({"slug": m["slug"]})
        if not existing:
            doc = dict(m)
            doc["id"] = str(uuid.uuid4())
            doc["created_at"] = datetime.utcnow()
            doc["updated_at"] = datetime.utcnow()
            await mediums.insert_one(doc)

    # Content
    existing_hp = await content.find_one({"page": "homepage"})
    if not existing_hp:
        doc = dict(DEFAULT_HOMEPAGE)
        doc["updated_at"] = datetime.utcnow()
        await content.insert_one(doc)

    # Settings
    existing_s = await settings_col.find_one({"_id": "singleton"})
    if not existing_s:
        await settings_col.insert_one(DEFAULT_SETTINGS)

    # Gallery
    existing_count = await gallery.count_documents({})
    if existing_count == 0:
        for g in DEFAULT_GALLERY:
            doc = dict(g)
            doc["id"] = str(uuid.uuid4())
            doc["created_at"] = datetime.utcnow()
            await gallery.insert_one(doc)

    # Testimonials
    existing_t_count = await testimonials.count_documents({})
    if existing_t_count == 0:
        for t in DEFAULT_TESTIMONIALS:
            doc = dict(t)
            doc["id"] = str(uuid.uuid4())
            doc["created_at"] = datetime.utcnow()
            await testimonials.insert_one(doc)
