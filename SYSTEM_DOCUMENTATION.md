# Kalakriti Admin Panel — Complete System Documentation

**Version**: 1.0  
**Last updated**: 2026-05-02  
**Built by**: Emergent (E2 agent)  
**Repo**: This Emergent workspace + customer Next.js at `github.com/riddhijain0119/FINAL-KALAKRITI-2-`

---

## 1. Product Overview

### 1.1 What is this product?

**Kalakriti Admin Panel** is a headless, production-grade content + commerce admin built specifically for **kalakritishop.in** — a hand-crafted portrait commissioning business in India. The end-customer site (kalakritishop.in) is a Next.js storefront on Vercel where customers configure custom portraits (watercolour, pencil, oil-on-canvas, charcoal), upload reference photos, pay via Cashfree, and track their commissioned portrait through delivery.

The admin panel built in this Emergent workspace is **a completely separate React + FastAPI + MongoDB application** that:

- Provides the shop owner (Riddhi Jain) a luxurious, gallery-grade UI to manage all aspects of her business
- Exposes a **Public API** that the Next.js storefront consumes to render dynamic content (mediums, prices, gallery, testimonials, homepage CMS text)
- Exposes an **Admin API** (JWT-protected) used only by this admin UI
- Integrates with **Cashfree** (payment sessions + webhook + refunds) and **Shiprocket** (auth, courier serviceability, AWB, label, pickup, tracking)

### 1.2 Core user flows

**Shop owner (admin)**
1. Logs into admin panel via email/password (single-admin model)
2. Sees dashboard: today's orders, revenue today/MTD, pending shipments, recent orders, revenue trend, by-medium pie
3. Manages "Listings & Pricing" — quick-edits prices, turnaround days, full editor for sizes, badges, per-face pricing, rush fees
4. Receives orders from customers (placed via Next.js → POST /api/public/orders)
5. Views order detail with reference photos, customer info, pricing breakdown, status timeline
6. Updates order status as work progresses (NEW → PAYMENT_RECEIVED → ASSIGNED → IN_PROGRESS → DRAFT_SHARED → REVISIONS → APPROVED → PRINTING → SHIPPED → DELIVERED)
7. **Ships an order** in 1 click → backend calls Shiprocket: serviceability check → adhoc order create → AWB assign → label gen → pickup request
8. Manages content: gallery (before/after pairs with file upload), testimonials, homepage CMS text, coupons, site settings (pickup address, brand info)
9. Views analytics: revenue line chart, orders by status, revenue by medium

**Customer (on kalakritishop.in, eventually)**
1. Browses homepage → mediums fetched live from `/api/content/mediums`
2. Opens portrait configurator → live pricing calc via `/api/public/pricing/calculate`
3. Uploads reference photos
4. Submits order → POST `/api/public/orders` creates order, returns order_number
5. Pays → POST `/api/public/payment/create-session` → opens Cashfree checkout
6. Cashfree webhook → backend marks order PAID, status PAYMENT_RECEIVED
7. Admin processes the order (manual or AI-assisted in future)
8. Customer tracks via POST `/api/public/orders/track` (email + order number)

### 1.3 Target user

- **Primary user**: Riddhi Jain — shop owner, non-technical. Will use admin daily for orders, weekly for content/CMS.
- **Secondary**: Customers (indirect) — interact via the Next.js storefront only.
- **Eventually**: Could expand to artists (multi-user with roles).

---

## 2. Architecture

### 2.1 Stack overview

| Layer | Tech |
| ----- | ---- |
| Admin Frontend | React 19 + Vite/CRA (template) + TailwindCSS + shadcn/ui + lucide-react + recharts + sonner |
| Admin Backend | FastAPI 0.110 + Pydantic v2 + Motor (async MongoDB) + httpx |
| Database | MongoDB (Atlas-compatible URI in env) |
| Auth | JWT (PyJWT) + bcrypt for admin; cookies/JWT-bearer header |
| Payments | Cashfree v2025-01-01 Orders API (HTTP via httpx) |
| Shipping | Shiprocket v1 API (HTTP via httpx with token caching) |
| Customer site (separate repo) | Next.js 14 on Vercel |
| File storage | Local disk on backend (`/app/backend/uploads/`) served via `/api/uploads/{path}` |
| Deployment | Emergent (one-click) — backend at `https://order-hub-390.emergent.host` |

### 2.2 Folder structure (this Emergent workspace, `/app/`)

```
/app/
├── backend/
│   ├── server.py                       # FastAPI app + CORS + lifespan + all router includes
│   ├── config.py                       # Settings class — env vars (Mongo, Cashfree, Shiprocket, JWT, admin)
│   ├── db.py                           # Motor client + collection accessors
│   ├── models.py                       # All Pydantic models (request/response/DB)
│   ├── auth.py                         # JWT create/decode, bcrypt, ensure_default_admin, get_current_admin dependency
│   ├── seed.py                         # Default mediums, homepage content, settings, gallery, testimonials seeded at startup
│   ├── seed_demo_orders.py             # One-shot script to seed 7 demo orders + WELCOME10 coupon (run manually)
│   ├── utils.py                        # serialize_doc — strips _id/password_hash, ISO dates
│   ├── test_core.py                    # POC integration test (run before app build)
│   │
│   ├── routers/
│   │   ├── admin_auth.py               # /api/admin/auth/{login,me}
│   │   ├── admin_crud.py               # /api/admin/{mediums,gallery,testimonials,content,coupons,settings} CRUD
│   │   ├── admin_orders.py             # /api/admin/orders/* (list, detail, status, notes, ship, track)
│   │   ├── admin_analytics.py          # /api/admin/{dashboard/stats, analytics/*}
│   │   ├── public.py                   # /api/public/* — consumed by storefront
│   │   ├── compat.py                   # /api/content/* — backward-compat for Next.js storefront
│   │   └── uploads.py                  # /api/admin/upload (auth) + /api/uploads/* (public serve)
│   │
│   ├── integrations/
│   │   ├── cashfree.py                 # create_payment_session, get_order, create_refund, verify_webhook_signature
│   │   └── shiprocket.py               # token cache, login, serviceability, adhoc order, AWB, label, pickup, track
│   │
│   ├── services/
│   │   ├── pricing.py                  # calculate_pricing — base × size_mult + faces + rush − coupon
│   │   └── orders.py                   # generate_order_number — KALA-YYMMDD-XXXX (collision-checked)
│   │
│   ├── uploads/                        # Local image storage (YYYY/MM/uuid.ext)
│   ├── requirements.txt
│   └── .env                            # All secrets (MUST regenerate before prod)
│
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── public/
│   ├── .env                            # REACT_APP_BACKEND_URL (preview URL injected by Emergent)
│   └── src/
│       ├── App.js                      # Router setup with all 12 pages
│       ├── App.css
│       ├── index.css                   # Brand tokens (cream/gold/brown palette), font imports, luxury-card class
│       ├── api.js                      # axios client + adminApi/publicApi method bag + JWT interceptor
│       ├── context/AuthContext.jsx     # Admin auth provider (JWT in localStorage)
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.jsx         # Brand-themed sidebar with grouped nav
│       │   │   └── AdminLayout.jsx     # Page wrapper: sidebar + title + actions + Toaster
│       │   ├── StatusChip.jsx          # Color-coded status pills for order pipeline
│       │   ├── ImageUpload.jsx         # Reusable drag-drop file upload + URL paste fallback
│       │   ├── ProtectedRoute.jsx      # Redirects to /login if no auth
│       │   └── ui/                     # shadcn/ui components (Button, Input, Switch, Dialog, Select, etc.)
│       │
│       └── pages/
│           ├── Login.jsx               # Brand split-panel login
│           ├── Dashboard.jsx           # Stats cards + revenue area chart + by-medium pie + recent orders
│           ├── Orders.jsx              # Filterable orders table (search, status, medium)
│           ├── OrderDetail.jsx         # Customer info, references, pricing, timeline, status dropdown, ship modal
│           ├── Mediums.jsx             # Grid of 4 mediums with quick-edit price + full-listing button
│           ├── MediumEditor.jsx        # All fields editor (sizes, badge, per-face, rush, image upload)
│           ├── Gallery.jsx             # Grid + upload modal (before/after image upload)
│           ├── Testimonials.jsx        # Cards + add/delete dialog
│           ├── Content.jsx             # Homepage CMS editor (hero, stats, process steps, CTA)
│           ├── Coupons.jsx             # Table + create dialog (percentage/flat)
│           ├── Settings.jsx            # Brand, contact, pickup address, default package
│           └── Analytics.jsx           # Revenue line, status bar, by-medium pie
│
├── plan.md                             # Original project plan
├── design_guidelines.md                # design_agent output — full design system
├── INTEGRATION_GUIDE.md                # How to connect kalakritishop.in to this backend
└── memory/
    └── PRD.md / test_credentials.md    # Boilerplate from template
```

### 2.3 Key design decisions and tradeoffs

| Decision | Why | Tradeoff |
| -------- | --- | -------- |
| **Two API tiers** (`/api/public/*` for storefront, `/api/admin/*` for admin UI) | Clean separation: public is read-mostly + order placement, admin is fully authenticated | Slight duplication of read endpoints |
| **JWT in localStorage** for admin auth | Simple for single-admin SaaS; no cookie infra | Vulnerable to XSS — fine for a single-tenant admin |
| **bcrypt + 168h JWT expiry** | Standard, works | Long expiry; consider refresh tokens later |
| **MongoDB with single collections per entity** + `id` (uuid string) instead of `_id` | Frontend never needs ObjectId conversion; serialization is simple | Slight overhead vs ObjectId |
| **Local disk uploads** (vs S3/Cloudinary) | Zero external setup; ships in V1 | Not horizontally scalable; survives only if Emergent volume persists. For prod, migrate to S3. |
| **Compatibility layer** (`/api/content/*` returning `{data: {items: [...]}}`) | The Next.js storefront already had this contract — zero frontend changes needed | Duplicated public endpoints in two shapes (`/public/mediums` vs `/content/mediums`) |
| **No customer-side auth** (per user choice) | Customers track orders by email + order number; simpler UX | No login = no order history page in V1 |
| **Status pipeline as enum + timeline events** | Clean state machine; full audit trail | Status transitions not enforced server-side (admin can move freely) |
| **Live integrations in V1** (real Cashfree prod keys, real Shiprocket account) | Ensures the integration actually works on day 1 | Risk of accidental real charges/shipments — POC test creates real Cashfree session, AWB assignment is gated behind admin click |
| **Emergent LLM key NOT used** | No AI features in V1 | Add later for AI-assisted order routing, image analysis |
| **No customer accounts / Google OAuth** | Per user choice; existing kalakritishop.in handles its own auth | Customer-side history must come via order tracking endpoint |
| **ImageUpload component supports BOTH file upload AND URL paste** | Uploads work on Emergent disk; URL paste lets users use already-hosted images (Cloudinary, Drive, kalakritishop.in/assets) | Two code paths to maintain |
| **CORS uses regex + explicit origins + allow_credentials=True** | Storefront sends `credentials: 'include'`; spec requires specific origin (not `*`) | Hard to debug; documented in section 6 |

---

## 3. Feature Breakdown

### 3.1 Admin authentication
- **Login**: POST `/api/admin/auth/login` with `{email, password}` → returns JWT bearer token (HS256, 168h expiry, payload includes `sub` (email) and `role`)
- **Default admin**: created on backend startup if not present, from `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars (default: `admin@kalakriti.in` / `Kalakriti@2026`)
- **Frontend**: token stored in `localStorage["kalakriti_admin_token"]`. Axios interceptor attaches `Authorization: Bearer ...` to every request. 401 → auto-redirect to `/login`.
- **All admin routes** depend on `get_current_admin` (FastAPI dependency that decodes JWT, looks up admin in DB, returns admin dict).

### 3.2 Dashboard
- `/api/admin/dashboard/stats` returns: today_orders, total_orders, pending_shipments (status in [APPROVED, PRINTING, PAYMENT_RECEIVED, IN_PROGRESS] AND no AWB), revenue_today (sum of paid orders today), revenue_mtd, status_counts dict, by_medium array, recent_orders (8 latest)
- `/api/admin/analytics/revenue-timeseries?days=30` aggregates `payment.paid_at` grouped by date.
- `/api/admin/analytics/orders-by-status` and `/orders-by-medium` for pie/bar charts.

### 3.3 Listings & Pricing (Mediums)
- 4 default mediums seeded: Watercolour, Pencil Sketch, Oil on Canvas, Charcoal
- Each medium has: slug (URL key), name, tagline, description, base_price, turnaround_min/max (days), image_url, badge ("Most Popular"/"Best Value"/"Premium"/"New"/null), sort_order, active (visibility), size_options[] (each with size key, multiplier, label), per_face_price, rush_fee_percent
- **Quick-edit price** in Mediums grid (inline form on card)
- **Full editor** at `/mediums/:id` — all fields including size options array, image uploader

### 3.4 Orders
- **Order shape**: order_number (`KALA-YYMMDD-XXXX`), customer (CustomerInfo: name, email, phone, address, city, state, pincode, country), medium_slug, medium_name, size, faces, rush, references[] (each with url + filename), pricing (OrderPricing breakdown), status (one of 12 enum values), timeline[] (TimelineEvent: status, note, at), payment (PaymentInfo: status, cashfree_order_id, cashfree_payment_id, payment_session_id, paid_at, amount), shipping (ShippingInfo: status, shiprocket_order_id, shipment_id, awb_code, courier_name, label_url, shipped_at, delivered_at), notes
- **List**: `/api/admin/orders` with query params status, medium, search, limit, skip
- **Detail**: `/api/admin/orders/{id}`
- **Update status**: PUT `/orders/{id}/status` — appends timeline event automatically
- **Update notes**: PUT `/orders/{id}/notes`
- **Ship**: POST `/orders/{id}/ship` — see section 3.10
- **Track**: GET `/orders/{id}/track` — calls Shiprocket track API with stored AWB

### 3.5 Gallery
- Schema: id, title, medium (slug), before_url (optional), after_url (required), featured, sort_order, created_at
- **Image upload**: drag-drop or paste URL (component `ImageUpload.jsx`)
- 4 default seeded with kalakritishop.in CDN URLs
- Public endpoint `/api/public/gallery?featured=true`

### 3.6 Testimonials
- Schema: id, name, location, quote, rating (1–5), medium, delivered_days, avatar_url, featured, sort_order
- 1 default seeded (Priya Krishnamurthy)
- Public endpoint with optional `?featured=true` filter

### 3.7 Homepage CMS
- Single document at `content` collection where `page="homepage"`
- Fields: hero_title, hero_subtitle, hero_eyebrow, hero_cta_primary, hero_cta_secondary, stats[] (each: label, value), process_steps[] (each: title, description, icon), cta_title, cta_subtitle
- Frontend editor allows add/remove rows for stats and process_steps
- Fetched via `/api/public/homepage` AND mapped to compat `/api/content/site_text` (flat key/value)

### 3.8 Coupons
- Schema: id, code (auto-uppercased), type ("percentage" | "flat"), value, min_order, max_uses, used_count, expires_at, active, description
- 1 default seeded: WELCOME10 (10% off, min ₹1,500, 500 uses)
- Public validation: POST `/api/public/coupons/validate` → returns valid + discount amount

### 3.9 Settings (singleton)
- Stored as `_id="singleton"` document in `settings` collection
- Brand info, contact, pickup address (used as `pickup_location` in Shiprocket adhoc order — must match exactly), default package dimensions (used for Shiprocket weight/length/breadth/height)
- Public-safe subset exposed at `/api/public/site-settings` (excludes pickup-address fields)

### 3.10 Shiprocket shipping flow

When admin clicks **"Ship with Shiprocket"** on order detail:

1. **Serviceability check** (POST `/api/admin/orders/{id}/check-serviceability`)
   - Backend calls `GET /v1/external/courier/serviceability/?pickup_postcode=201301&delivery_postcode={customer.pincode}&weight={settings.default_weight}&cod=0`
   - Returns sorted list of couriers (cheapest first)
   - UI shows modal with radio list

2. **Confirm shipment** (POST `/api/admin/orders/{id}/ship`) with `{courier_id, prefer="cheapest"}`
   - Re-runs serviceability
   - Selects courier (chosen by user OR cheapest fallback)
   - Calls `POST /v1/external/orders/create/adhoc` with full address + items + dimensions + payment_method=Prepaid + pickup_location (from settings)
   - Calls `POST /v1/external/courier/assign/awb` with shipment_id + courier_id → AWB code
   - Calls `POST /v1/external/courier/generate/label` (best-effort, returns label PDF URL)
   - Calls `POST /v1/external/courier/generate/pickup` (best-effort)
   - Updates order: status=SHIPPED (if AWB) or PROCESSING, populates shipping object, appends timeline event

**Token caching**: Shiprocket token (10-day expiry) cached in `/tmp/shiprocket_token.json` AND in-memory; auto-refreshed when within 24h of expiry.

### 3.11 Cashfree payment flow

1. Customer creates order on storefront → POST `/api/public/orders` returns `order_id` + `order_number`
2. Storefront calls POST `/api/public/payment/create-session` with `{order_id, return_url}`
3. Backend calls Cashfree `POST /pg/orders` (production base: `https://api.cashfree.com/pg`) with order_id, order_amount, customer_details, order_meta.return_url, order_meta.notify_url
4. Returns `payment_session_id` + `cf_order_id`; backend persists into order's payment object
5. Storefront opens Cashfree checkout (using JS SDK + payment_session_id)
6. After payment, Cashfree calls webhook: POST `/api/public/payment/webhook`
7. Backend verifies HMAC-SHA256 (`x-webhook-timestamp + raw_body` signed with Cashfree secret)
8. If verified + payment_status=SUCCESS → updates order: payment.status=PAID, status=PAYMENT_RECEIVED, appends timeline

**Refunds**: `cashfree.create_refund(order_number, amount, note)` (callable from admin code; not yet wired to UI)

### 3.12 File uploads
- POST `/api/admin/upload` (multipart/form-data, JWT-protected) → saves to `/app/backend/uploads/YYYY/MM/{uuid}.{ext}` and returns `{url, relative_path, filename, size, content_type}`
- Allowed types: `image/jpeg, image/png, image/webp, image/gif`
- Max size: 15 MB
- Public serve: GET `/api/uploads/{path:path}` returns FileResponse (no auth)
- URL is built from request host (X-Forwarded-Proto/Host honored) so works behind Emergent proxy

### 3.13 Compatibility layer (`/api/content/*`)

**This is the secret sauce that connects the existing Next.js storefront without ANY frontend code changes.** The Next.js app at kalakritishop.in expects:
- GET `/api/content/mediums` → `{data: {items: CmsMedium[]}}`
- GET `/api/content/hero` → `{data: {items: CmsHeroItem[]}}`
- GET `/api/content/gallery` → `{data: {items: CmsGalleryItem[]}}`
- GET `/api/content/pricing` → `{data: CmsPricing}`
- GET `/api/content/site_text` → `{data: Record<string,string>}`
- GET `/api/content/banner` → `{data: {active, text, cta_text, cta_url}}`
- GET `/api/content/testimonials` → `{data: {items: [...]}}`

The `routers/compat.py` reads from our admin schema (mediums, gallery, content, settings, testimonials collections) and maps to the EXACT shape Next.js expects (different field names: `slug`→`key`, `base_price`→`starting_price`, `turnaround_min/max`→`turnaround` string, `badge`→`tag`+`tag_color`, etc.).

So shop owner edits in admin → kalakritishop.in shows changes live (without redeploying Vercel).

---

## 4. State & Data Flow

### 4.1 Data flow overview

```
[Admin User Browser]
    |
    | (1) Login: POST /api/admin/auth/login → JWT
    | (2) All subsequent: Bearer token in Authorization header
    v
[React Admin App] (Vite/CRA, served at /)
    |
    | axios calls
    v
[FastAPI Backend] (port 8001, prefix /api)
    |
    +-- Motor async client --> [MongoDB] (collections below)
    |
    +-- httpx --> [Cashfree API] (api.cashfree.com/pg)
    |
    +-- httpx --> [Shiprocket API] (apiv2.shiprocket.in)
    |
    +-- File system --> [/app/backend/uploads/]


[Customer Browser on kalakritishop.in (Vercel Next.js)]
    |
    | fetch with credentials:include
    v
[Same FastAPI Backend]
    |
    | reads/writes same MongoDB
    | calls same Cashfree/Shiprocket
    v
[ MongoDB collections ]
```

### 4.2 MongoDB collections

| Collection | Purpose | Key fields |
| ---------- | ------- | ---------- |
| `admins` | Admin users | email, password_hash (bcrypt), role, created_at |
| `mediums` | Portrait listings | slug, name, base_price, turnaround_min/max, badge, image_url, size_options[], per_face_price, rush_fee_percent, sort_order, active |
| `orders` | Customer orders | order_number, customer{}, medium_slug, size, faces, rush, references[], pricing{}, status, timeline[], payment{}, shipping{}, notes, created_at |
| `gallery` | Portfolio images | title, medium, before_url, after_url, featured, sort_order |
| `testimonials` | Reviews | name, location, quote, rating, medium, delivered_days, avatar_url, featured |
| `content` | CMS docs (page-keyed) | page="homepage", hero_*, stats[], process_steps[], cta_* |
| `coupons` | Promo codes | code (uppercase), type, value, min_order, max_uses, used_count, expires_at, active |
| `settings` | Singleton site settings | `_id="singleton"`, brand_*, contact_*, pickup_*, default_package_* |
| `payments` | Webhook log | received_at, verified, payload (raw Cashfree webhook for audit) |
| `leads` | Captured leads | email, phone, source, payload, created_at |
| `poc_test` | Used by test_core.py only | (auto-cleaned) |

### 4.3 Order status state machine

```
NEW
 ├─→ PAYMENT_RECEIVED (via Cashfree webhook)
 │    ├─→ ASSIGNED (admin assigns artist)
 │    │    ├─→ IN_PROGRESS
 │    │    │    ├─→ DRAFT_SHARED (artist uploads watermarked draft — feature pending)
 │    │    │    │    ├─→ REVISIONS (customer requests changes — feature pending)
 │    │    │    │    │    └─→ APPROVED
 │    │    │    │    └─→ APPROVED
 │    │    │    └─→ APPROVED
 │    │    └─→ PRINTING
 │    │         └─→ SHIPPED (via Shiprocket)
 │    │              └─→ DELIVERED
 │    └─→ CANCELLED / REFUNDED
 └─→ CANCELLED
```

Status transitions are NOT enforced server-side (admin can jump to any status). Pipeline is informational.

### 4.4 Key Pydantic models

See `/app/backend/models.py`. Highlights:

- `Order`: 24 fields including embedded `CustomerInfo`, `OrderPricing`, `PaymentInfo`, `ShippingInfo`, `TimelineEvent[]`
- `Medium` / `MediumBase` / `MediumUpdate`: full / create / partial-update variants
- `LoginRequest`, `TokenResponse`
- `PricingCalculateRequest`, `PricingCalculateResponse`
- `ShipOrderRequest`, `ServiceabilityRequest`
- `Coupon`, `CouponValidateRequest`
- `Lead`

All models use `id: str = uuid4` (NOT MongoDB ObjectId).

---

## 5. Environment & Setup

### 5.1 Backend env variables (`/app/backend/.env`)

```
# MongoDB
MONGO_URL=mongodb://localhost:27017
DB_NAME=kalakriti_admin

# CORS — use specific origins (not "*") because storefront sends credentials:include
CORS_ORIGINS=https://kalakritishop.in,https://www.kalakritishop.in,http://localhost:3000

# Cashfree (PRODUCTION — REGENERATE for prod!)
CASHFREE_CLIENT_ID=<from dashboard>
CASHFREE_CLIENT_SECRET=<from dashboard>
CASHFREE_ENVIRONMENT=production              # or "sandbox"
CASHFREE_API_VERSION=2025-01-01

# Shiprocket
SHIPROCKET_EMAIL=<account email>
SHIPROCKET_PASSWORD=<account password>
SHIPROCKET_PICKUP_PINCODE=201301
SHIPROCKET_BASE_URL=https://apiv2.shiprocket.in

# Admin auth
ADMIN_EMAIL=admin@kalakriti.in
ADMIN_PASSWORD=<strong password>             # seeded on first startup
JWT_SECRET=<64 random chars>                 # openssl rand -hex 32
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=168

# URLs
BACKEND_BASE_URL=http://localhost:8001       # or your deployed URL
FRONTEND_BASE_URL=https://kalakritishop.in   # used for Cashfree return_url
```

### 5.2 Frontend env (`/app/frontend/.env`)

```
REACT_APP_BACKEND_URL=<deployed backend URL OR Emergent preview URL>
# DO NOT modify this — it's set by Emergent automatically
```

### 5.3 Backend dependencies (`/app/backend/requirements.txt`)
Key packages: `fastapi==0.110.1`, `motor==3.3.1`, `pymongo==4.5.0`, `pydantic==2.x`, `httpx>=0.25`, `PyJWT`, `bcrypt`, `python-multipart` (for uploads), `python-dotenv`

### 5.4 Frontend dependencies (`/app/frontend/package.json`)
Key: `react@19`, `react-router-dom`, `axios`, `tailwindcss`, all `@radix-ui/*` for shadcn primitives, `recharts`, `sonner`, `lucide-react`, `framer-motion`

### 5.5 Local development steps

```bash
# Backend
cd /app/backend
pip install -r requirements.txt
# Make sure MongoDB is running locally OR set MONGO_URL to remote
# Backend auto-runs via supervisor on port 8001
sudo supervisorctl restart backend

# Frontend
cd /app/frontend
yarn install
sudo supervisorctl restart frontend

# Seed demo orders (one-time)
cd /app/backend && python seed_demo_orders.py

# Run POC integration tests
python test_core.py    # tests MongoDB + Cashfree + Shiprocket end-to-end
```

### 5.6 Deployment (Emergent)

1. Click **Deploy** in Emergent UI → pick subdomain (e.g. `order-hub-390`)
2. Confirm env vars in deployment dialog
3. Wait 10–15 min
4. Get URL: `https://<subdomain>.emergent.host`
5. Test: `https://<subdomain>.emergent.host/api/health` → `{status: "ok"}`

To migrate to another platform (Railway, Render, AWS, etc.):
- Backend is a standard FastAPI app: `uvicorn server:app --host 0.0.0.0 --port 8001`
- Frontend is a React app: `yarn build` → serve `build/` as static
- MongoDB: provide `MONGO_URL` (Atlas works)
- File uploads will be lost on container restart unless persistent volume is mounted at `/app/backend/uploads`. **Recommended: migrate to S3/Cloudinary in production.**

### 5.7 Connect kalakritishop.in to this backend

On Vercel (the Next.js project):
1. Settings → Environment Variables → add `NEXT_PUBLIC_BACKEND_URL=<deployed-backend-url>` (no trailing slash, no spaces, all 3 environments checked)
2. Deployments → Redeploy (uncheck "Use existing Build Cache" — `NEXT_PUBLIC_*` is build-time)
3. Verify: open kalakritishop.in DevTools → Network → see calls to `<backend>/api/content/mediums` returning 200 with current admin data

---

## 6. AI / Agent Decisions

### 6.1 Why these choices

| Decision | Rationale |
| -------- | --------- |
| **POC test_core.py first** | Per E2 development philosophy — prove integrations work in isolation BEFORE building UI. Caught nothing here (all 3 passed first try) but would have saved hours if Cashfree keys were wrong. |
| **Build a parallel admin instead of modifying their existing repo** | User asked for new admin without revealing existing admin/backend in their Vercel repo. Pivoted later via compat layer. |
| **Compat layer (`/api/content/*`)** | Discovered late that Next.js storefront already had a contract for `/api/content/{section}`. Adding a compat layer was cheaper than refactoring their frontend. |
| **JWT with localStorage (not httpOnly cookies)** | Simpler for single-tenant admin SPA; tradeoff is XSS exposure (not a concern for solo-admin). For customer auth in future, prefer httpOnly cookies. |
| **Single admin user (no multi-tenant)** | Per user choice — solo founder. Schema supports multi-admin via `role` field but UI doesn't expose it. |
| **No customer auth in V1** | Per user choice — customers track via email+order_number. Avoids Google OAuth complexity. |
| **Local disk uploads** | Fastest path to demoable feature. **Migrate to S3 before serious production traffic.** |
| **Production Cashfree keys used during dev** | User insisted; we documented the regenerate-before-prod warning. POC sent ₹10 test session (no actual charge unless customer pays). |
| **CORS uses regex + explicit origins + allow_credentials=True** | Browsers reject `Access-Control-Allow-Origin: *` when fetch sends `credentials: 'include'`. Tricky to debug; solved via `allow_origin_regex` for emergent.host/vercel.app dynamic subdomains. |

### 6.2 Known limitations

1. **CORS misconfig in deployed env**: Setting `CORS_ORIGINS=*` will break the Next.js storefront integration (because storefront uses `credentials: 'include'`). MUST be specific origins. Fix is in code (smart fallback) + must redeploy to take effect.
2. **No file persistence guarantee**: Uploads on `/app/backend/uploads/` are local — if Emergent volume isn't persistent, files vanish on redeploy. Migrate to S3 for prod.
3. **Order status transitions not validated**: Admin can move from NEW directly to DELIVERED. Add a state machine guard for V2.
4. **Cashfree webhook signature**: Verified with HMAC-SHA256. Tested only via curl (not real webhook flow yet). MUST test end-to-end before relying on auto-PAID status.
5. **Shiprocket "Ship with Shiprocket"** in admin actually creates real shipments via real API. There's no sandbox mode. Be careful when clicking on test orders.
6. **No email/WhatsApp notifications**: Customer doesn't get auto-emails when order status changes. The existing kalakritishop.in repo has WhatsApp integration; could be ported.
7. **Pricing engine duplication**: Backend has its own `services/pricing.py`. The Next.js storefront has its own `lib/pricing/engine.ts` with hardcoded constants + remote override fetch. They must agree — currently they may diverge for size_multipliers (defaults are A4=1.0, A3=1.5, A2=2.2 in both, but if admin adds custom sizes, frontend won't know).
8. **Admin password is plaintext in env**: Stored as `ADMIN_PASSWORD`, hashed only on first DB seed. Changing it via env requires deleting the admin doc in DB OR adding a "change password" UI (not built).
9. **No multi-currency**: All amounts assumed INR.
10. **No tax/GST handling on backend**: Frontend pricing engine has GST_RATE; backend `services/pricing.py` doesn't apply GST. If GST is required on order total, add it.
11. **No artist/draft review workflow**: Per user choice (skipped in V1). The existing kalakritishop.in repo has /project-review-portal pages — would need to wire to backend.
12. **`payments` collection holds raw Cashfree webhook payloads** for audit, never cleaned up.

### 6.3 Things to be careful about

- ⚠️ **Never expose `JWT_SECRET`, `CASHFREE_CLIENT_SECRET`, `SHIPROCKET_PASSWORD`** in frontend code or git
- ⚠️ **Cashfree keys provided by user during chat were PRODUCTION** — should be regenerated before any real go-live
- ⚠️ **Shipping a real order will create a real Shiprocket shipment**. There's a "Cancel" button in the modal; use it for testing
- ⚠️ **Coupon `used_count` is NOT incremented** when a coupon is applied to an order. (Bug — needs fix in `services/pricing.py` or order creation flow)
- ⚠️ **Webhook URL must be https** — Cashfree won't call http URLs
- ⚠️ **Pickup location name in Settings must match EXACTLY** the name configured in Shiprocket dashboard (default "Primary"). Mismatch = adhoc order create will fail
- ⚠️ **Default `CORS_ORIGINS=*` on deployed backend will break credentials-included fetches from storefront**
- ⚠️ Modifying `frontend/.env`'s `REACT_APP_BACKEND_URL` will break the Emergent preview/deploy

### 6.4 Things that ALMOST went wrong (lessons)

- The POC test PASSED on first try with production Cashfree keys → relief, but reinforced "always run isolated integration tests first"
- Initially shipped with `CORS_ORIGINS=*` causing credentials-cors bug — fixed with smart fallback in code
- Initially user couldn't find the "listings" page because it was called "Mediums" — renamed in sidebar to "Listings & Pricing" and added inline price quick-edit
- Initially returned upload URLs as `http://localhost:8001/...` (from `BACKEND_BASE_URL`) — fixed to use `request.headers["x-forwarded-host"]` so URLs work behind Emergent proxy

---

## 7. Pending Work / Roadmap

### 7.1 Critical (do BEFORE production go-live)

1. **Regenerate** all secrets exposed in chat: Cashfree keys, Shiprocket password, admin password, JWT secret
2. **Set CORS_ORIGINS** to specific origins (not `*`) on deployed backend
3. **Test Cashfree webhook end-to-end** with a real test payment (sandbox or small amount)
4. **Test Shiprocket "Ship" flow** end-to-end with one real test order
5. **Migrate uploads from local disk to S3 / Cloudinary** for production durability
6. **Add `coupon.used_count` increment** when coupon is applied to an order
7. **Add HTTPS-only flag to JWT cookies if switching from localStorage**

### 7.2 V2 features (in priority order)

1. **Bulk image upload** to gallery (drag 10 images at once)
2. **Artist management & draft review workflow**:
   - Artist accounts with role
   - Watermarked draft upload
   - Customer annotation tool (use canvas overlays)
   - Approve/Revise actions
3. **Email notifications** at each status change (Resend / SendGrid)
4. **WhatsApp notifications** (the customer's own repo has Gupshup integration that can be ported)
5. **Customer accounts** (Google OAuth) → order history page
6. **Refund UI** (backend already has `cashfree.create_refund`)
7. **Multi-language** (Hindi)
8. **PDF invoice generation** at order completion
9. **Artist commission/payout tracking**
10. **Ad spend ROI dashboard** (utm tracking, attribution)
11. **A/B price testing**
12. **SEO meta editor** per page
13. **Search across orders** with full-text Mongo index

### 7.3 Tech debt

- [ ] Replace `pydantic.BaseModel.dict()` (deprecated) with `.model_dump()` everywhere
- [ ] Add request rate limiting (slowapi)
- [ ] Add Sentry / structured logging
- [ ] Add proper test suite (currently only POC test_core.py)
- [ ] Move secrets to a vault (AWS Secrets Manager / 1Password Connect)
- [ ] Set up CI/CD with GitHub Actions
- [ ] Add backup/restore script for MongoDB
- [ ] Implement actual `OAuth flow` for `/api/auth/me` if integrating with their existing Next.js admin

---

## 8. "If another AI continues this project"

### 8.1 Quick orientation (read this first)

1. **READ THIS FILE FIRST** — entire system overview
2. Read `/app/plan.md` — original project plan
3. Read `/app/INTEGRATION_GUIDE.md` — how kalakritishop.in connects
4. Read `/app/design_guidelines.md` — full design system
5. Skim `/app/backend/server.py` — see all routers wired
6. Skim `/app/backend/models.py` — understand data shapes
7. Run `cd /app/backend && python test_core.py` — verify all integrations work in your env
8. Visit admin at `${REACT_APP_BACKEND_URL replaced with frontend URL}/login` → use `admin@kalakriti.in / Kalakriti@2026`

### 8.2 How to extend safely

**Adding a new admin feature** (e.g., "Artists" page):
1. Add Pydantic model(s) in `/app/backend/models.py`
2. Add collection accessor in `/app/backend/db.py`
3. Add CRUD endpoints in a new router (`/app/backend/routers/admin_artists.py`); use `dependencies=[Depends(get_current_admin)]`
4. Register router in `/app/backend/server.py`
5. Add API methods in `/app/frontend/src/api.js` (`adminApi.listArtists`, etc.)
6. Add page in `/app/frontend/src/pages/Artists.jsx` using `AdminLayout`
7. Add route in `/app/frontend/src/App.js` wrapped in `<ProtectedRoute>`
8. Add nav item in `/app/frontend/src/components/layout/Sidebar.jsx`
9. Run `testing_agent_v3` to verify end-to-end

**Adding a new public endpoint** (storefront-facing):
1. Add to `/app/backend/routers/public.py` (no auth)
2. If it must match an existing Next.js storefront contract, add a wrapper in `/app/backend/routers/compat.py` instead
3. Test from `kalakritishop.in` browser DevTools console:
   ```js
   fetch(`${BACKEND}/api/public/your-endpoint`, {credentials: 'include'}).then(r => r.json())
   ```

**Adding a new Shiprocket call**:
1. Add helper function to `/app/backend/integrations/shiprocket.py` (use `_auth_headers()` for auto token caching)
2. Use it in `/app/backend/routers/admin_orders.py` or new admin router
3. Always wrap external calls in try/except with HTTP 502 on failure

**Adding a new Cashfree call**:
1. Add helper to `/app/backend/integrations/cashfree.py`
2. Use `_headers()` for auto-auth
3. Use the env var `CASHFREE_BASE_URL` toggled by `CASHFREE_ENVIRONMENT`

### 8.3 What NOT to touch

- **`frontend/.env`'s `REACT_APP_BACKEND_URL`** — managed by Emergent
- **`backend/.env`'s `MONGO_URL`** — managed by Emergent
- **The compat layer (`/api/content/*`)** — kalakritishop.in storefront depends on it; changing return shapes will break the live site. If you must change, also update Next.js consumers.
- **Cashfree webhook signature verification** — if broken, all orders auto-mark PAID even if Cashfree didn't say so
- **Order `id` (uuid string) — DO NOT switch to MongoDB ObjectId** — frontend is wired to string IDs everywhere

### 8.4 Common gotchas

1. **CORS errors in browser** — almost always because `CORS_ORIGINS=*` while storefront uses `credentials: 'include'`. Fix: set explicit origins.
2. **Cashfree returns 400 on /pg/orders** — usually because amount has wrong format. Always `round(amount, 2)` and use Decimal-safe operations.
3. **Shiprocket "AWB assignment failed"** — usually because pickup_location name doesn't match. Check Settings.pickup_location_name vs Shiprocket dashboard.
4. **Image upload returns localhost URL** — `request.headers["x-forwarded-host"]` should override but check proxy setup.
5. **JWT decode fails after restart** — means `JWT_SECRET` changed. Old tokens will be invalid; user must re-login.
6. **Default admin not seeded** — only happens at startup `lifespan` event. Check supervisor backend logs.

### 8.5 Helpful commands

```bash
# Backend logs
tail -f /var/log/supervisor/backend.err.log

# Frontend logs
tail -f /var/log/supervisor/frontend.err.log

# Restart backend (after .env or requirements.txt change)
sudo supervisorctl restart backend

# Test backend health
curl http://localhost:8001/api/health

# Get admin JWT
curl -X POST http://localhost:8001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kalakriti.in","password":"Kalakriti@2026"}'

# Inspect Mongo
mongosh
> use kalakriti_admin
> db.orders.countDocuments({})
> db.mediums.find({}, {slug:1, name:1, base_price:1})

# Run POC integration test (Cashfree + Shiprocket + Mongo)
cd /app/backend && python test_core.py

# Reseed demo orders (after wiping)
cd /app/backend && python seed_demo_orders.py
```

### 8.6 Where to find each piece of info

| Question | File / Location |
| -------- | --------------- |
| What endpoints exist? | `/app/backend/server.py` (router includes) → routers/*.py |
| What's a medium's data shape? | `/app/backend/models.py` (Medium class) |
| How does pricing work? | `/app/backend/services/pricing.py` |
| What status transitions exist? | `/app/backend/models.py` (`ORDER_STATUSES` constant) |
| How does Shiprocket auth work? | `/app/backend/integrations/shiprocket.py` (`get_token` function) |
| How is the admin UI styled? | `/app/frontend/src/index.css` (CSS variables) + `/app/design_guidelines.md` |
| What does the storefront expect? | `/app/backend/routers/compat.py` + `INTEGRATION_GUIDE.md` |
| Default admin credentials? | `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars; defaults `admin@kalakriti.in` / `Kalakriti@2026` |
| Demo data seed? | `/app/backend/seed.py` (auto on startup) + `seed_demo_orders.py` (manual) |

### 8.7 Emergency contacts / context

- Shop owner: Riddhi Jain — `riddhi.jain@neudis.com`
- Storefront repo: `https://github.com/riddhijain0119/FINAL-KALAKRITI-2-`
- Live storefront: `https://kalakritishop.in`
- Admin (deployed): `https://order-hub-390.emergent.host` (subject to change)
- Cashfree dashboard: `merchant.cashfree.com`
- Shiprocket dashboard: `app.shiprocket.in`

---

**End of documentation.**  
*This document is auto-portable. Drop the entire `/app` folder + this file into any FastAPI/React-capable host and follow Section 5.5 to run locally.*
