"""Pydantic models for API request/response validation."""
from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, EmailStr
import uuid


# ---------- Auth ----------
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    admin: Dict[str, Any]


# ---------- Medium ----------
class SizeOption(BaseModel):
    size: str
    multiplier: float = 1.0
    label: Optional[str] = None


class MediumBase(BaseModel):
    slug: str
    name: str
    tagline: Optional[str] = ""
    description: str
    base_price: float
    turnaround_min: int = 5
    turnaround_max: int = 10
    image_url: Optional[str] = ""
    badge: Optional[str] = None  # "Most Popular", "Best Value", "Premium"
    sort_order: int = 0
    active: bool = True
    size_options: List[SizeOption] = Field(default_factory=list)
    per_face_price: float = 500.0
    rush_fee_percent: float = 25.0


class Medium(MediumBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MediumUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    turnaround_min: Optional[int] = None
    turnaround_max: Optional[int] = None
    image_url: Optional[str] = None
    badge: Optional[str] = None
    sort_order: Optional[int] = None
    active: Optional[bool] = None
    size_options: Optional[List[SizeOption]] = None
    per_face_price: Optional[float] = None
    rush_fee_percent: Optional[float] = None


# ---------- Gallery ----------
class GalleryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    medium: str  # slug
    before_url: Optional[str] = ""
    after_url: str
    featured: bool = False
    sort_order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GalleryUpdate(BaseModel):
    title: Optional[str] = None
    medium: Optional[str] = None
    before_url: Optional[str] = None
    after_url: Optional[str] = None
    featured: Optional[bool] = None
    sort_order: Optional[int] = None


# ---------- Testimonials ----------
class Testimonial(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: Optional[str] = ""
    quote: str
    rating: float = 5.0
    medium: Optional[str] = None
    delivered_days: Optional[int] = None
    avatar_url: Optional[str] = ""
    featured: bool = True
    sort_order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TestimonialUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    quote: Optional[str] = None
    rating: Optional[float] = None
    medium: Optional[str] = None
    delivered_days: Optional[int] = None
    avatar_url: Optional[str] = None
    featured: Optional[bool] = None
    sort_order: Optional[int] = None


# ---------- Content / CMS ----------
class StatItem(BaseModel):
    label: str
    value: str


class ProcessStep(BaseModel):
    title: str
    description: str
    icon: Optional[str] = ""


class HomepageContent(BaseModel):
    hero_title: str = "From Snapshot to Masterpiece"
    hero_subtitle: str = "Drag the slider to witness the transformation. Every Kalakriti portrait is handcrafted by a verified artist — no filters, no AI."
    hero_eyebrow: str = "Handcrafted in India"
    hero_cta_primary: str = "Create My Portrait"
    hero_cta_secondary: str = "Browse Gallery"
    stats: List[StatItem] = Field(default_factory=list)
    process_steps: List[ProcessStep] = Field(default_factory=list)
    cta_title: str = "Your memory deserves a permanent form."
    cta_subtitle: str = "Configure your portrait in 3 minutes. Live pricing, free India shipping, hand-painted by verified artists."


# ---------- Coupons ----------
class Coupon(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    type: Literal["percentage", "flat"] = "percentage"
    value: float  # % or rupees
    min_order: float = 0
    max_uses: int = 1000
    used_count: int = 0
    expires_at: Optional[datetime] = None
    active: bool = True
    description: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    type: Optional[Literal["percentage", "flat"]] = None
    value: Optional[float] = None
    min_order: Optional[float] = None
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None
    active: Optional[bool] = None
    description: Optional[str] = None


class CouponValidateRequest(BaseModel):
    code: str
    order_total: float


# ---------- Settings ----------
class SiteSettings(BaseModel):
    brand_name: str = "Kalakriti"
    tagline: str = "Transform Your Memories into Museum-Grade Art"
    contact_email: str = "hello@kalakritishop.in"
    contact_phone: str = ""
    whatsapp: str = ""
    instagram: str = ""
    facebook: str = ""
    pickup_location_name: str = "Primary"
    pickup_address: str = ""
    pickup_city: str = "Gautam Buddha Nagar"
    pickup_state: str = "Uttar Pradesh"
    pickup_pincode: str = "201301"
    pickup_country: str = "India"
    pickup_phone: str = ""
    default_package_weight_kg: float = 0.5
    default_package_length_cm: float = 30
    default_package_breadth_cm: float = 25
    default_package_height_cm: float = 5


# ---------- Orders ----------
ORDER_STATUSES = [
    "NEW",
    "PAYMENT_RECEIVED",
    "ASSIGNED",
    "IN_PROGRESS",
    "DRAFT_SHARED",
    "REVISIONS",
    "APPROVED",
    "PRINTING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
]


class CustomerInfo(BaseModel):
    name: str
    email: str
    phone: str
    address: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""
    country: str = "India"


class OrderReference(BaseModel):
    url: str
    filename: Optional[str] = None
    content_type: Optional[str] = None


class OrderPricing(BaseModel):
    base_price: float
    size: Optional[str] = None
    size_multiplier: float = 1.0
    faces: int = 1
    per_face_price: float = 0
    rush: bool = False
    rush_fee: float = 0
    coupon_code: Optional[str] = None
    discount: float = 0
    subtotal: float
    total: float


class PaymentInfo(BaseModel):
    status: str = "PENDING"  # PENDING, PAID, FAILED, REFUNDED
    cashfree_order_id: Optional[str] = None
    cashfree_payment_id: Optional[str] = None
    payment_session_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    amount: float = 0


class ShippingInfo(BaseModel):
    status: str = "NOT_SHIPPED"  # NOT_SHIPPED, PROCESSING, SHIPPED, DELIVERED
    shiprocket_order_id: Optional[int] = None
    shiprocket_shipment_id: Optional[int] = None
    awb_code: Optional[str] = None
    courier_name: Optional[str] = None
    courier_id: Optional[int] = None
    label_url: Optional[str] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None


class TimelineEvent(BaseModel):
    status: str
    note: Optional[str] = None
    at: datetime = Field(default_factory=datetime.utcnow)


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str  # KALA-YYMMDD-XXX
    customer: CustomerInfo
    medium_slug: str
    medium_name: str
    size: Optional[str] = None
    faces: int = 1
    rush: bool = False
    references: List[OrderReference] = Field(default_factory=list)
    pricing: OrderPricing
    status: str = "NEW"
    timeline: List[TimelineEvent] = Field(default_factory=list)
    payment: PaymentInfo = Field(default_factory=PaymentInfo)
    shipping: ShippingInfo = Field(default_factory=ShippingInfo)
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class OrderCreateRequest(BaseModel):
    customer: CustomerInfo
    medium_slug: str
    size: Optional[str] = None
    faces: int = 1
    rush: bool = False
    references: List[OrderReference] = Field(default_factory=list)
    coupon_code: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None


class OrderNotesUpdate(BaseModel):
    notes: str


class PricingCalculateRequest(BaseModel):
    medium_slug: str
    size: Optional[str] = None
    faces: int = 1
    rush: bool = False
    coupon_code: Optional[str] = None


class PricingCalculateResponse(BaseModel):
    base_price: float
    size_multiplier: float
    per_face_price: float
    faces: int
    rush_fee: float
    subtotal: float
    coupon_code: Optional[str] = None
    discount: float = 0
    total: float


class OrderTrackRequest(BaseModel):
    email: str
    order_number: str


# ---------- Payments ----------
class PaymentSessionRequest(BaseModel):
    order_id: str  # internal order id
    return_url: Optional[str] = None


class PaymentSessionResponse(BaseModel):
    payment_session_id: str
    cashfree_order_id: str
    order_number: str
    amount: float


# ---------- Shipping ----------
class ShipOrderRequest(BaseModel):
    order_id: str  # internal id
    courier_id: Optional[int] = None  # if not provided, pick cheapest
    prefer: Optional[Literal["cheapest", "fastest"]] = "cheapest"
    weight: Optional[float] = None
    length: Optional[float] = None
    breadth: Optional[float] = None
    height: Optional[float] = None


class ServiceabilityRequest(BaseModel):
    delivery_pincode: str
    weight: float = 0.5
    cod: int = 0


# ---------- Leads ----------
class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: Optional[str] = None
    phone: Optional[str] = None
    source: str = "configurator"
    payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
