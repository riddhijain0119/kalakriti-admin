# plan.md — Kalakriti Admin Panel + Headless Backend

## 1) Objectives
- Build a **headless backend (FastAPI + MongoDB)** exposing **Public APIs** for the existing Next.js storefront and **Admin APIs** for management.
- Build a **luxury-themed Admin Panel (React + Tailwind + shadcn/ui)** for: mediums/pricing, orders, Shiprocket shipping, CMS content, gallery, testimonials, coupons, analytics.
- Validate the **core failure-prone workflow** early: **Cashfree payment session + webhook** and **Shiprocket auth + shipment creation**.
- Deploy on **Emergent**, provide an **integration guide** for the Next.js site.

---

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation): Payments + Shipping + DB
**Goal:** Prove core integrations work end-to-end *before* building the full app.

**Web research / integration playbook**
- Confirm latest docs + required headers/fields for:
  - Cashfree: order/session creation, webhook signature verification, environment (prod vs sandbox)
  - Shiprocket: auth token, create order/shipment, tracking endpoints, pickup address requirements

**POC implementation (minimal FastAPI + scripts)**
- Create a tiny backend skeleton with config loading from env.
- Add `scripts/poc_core.py` (or `app/test_core.py`) that:
  1. Connects to MongoDB; insert/read a test doc.
  2. Cashfree: create payment session/order; store pending payment record.
  3. Expose webhook endpoint; verify webhook signature; mark payment paid.
  4. Shiprocket: login; fetch token; call a simple endpoint; create a test shipment/order.

**Fix-until-works criteria**
- Do not proceed until:
  - Cashfree session creation returns a valid session/payment link id
  - Webhook verification passes using a real sample payload
  - Shiprocket token retrieval works reliably
  - Shiprocket shipment creation returns tracking/awb/order id

**Phase 1 user stories**
1. As an owner, I want to confirm Cashfree session creation works so payments won’t fail in production.
2. As an owner, I want webhook verification to be correct so payment status updates automatically.
3. As an owner, I want Shiprocket auth to work so shipments can be created from the admin.
4. As an owner, I want Shiprocket shipment creation tested so tracking is generated reliably.
5. As a developer, I want MongoDB connectivity validated so order storage is stable.

---

### Phase 2 — V1 App Development (build around proven core)
**Goal:** Deliver a working admin + public API MVP (skip draft review portal in V1).

**Backend (FastAPI)**
- Project structure: `routers/public.py`, `routers/admin.py`, `integrations/cashfree.py`, `integrations/shiprocket.py`, `models/*`, `services/*`.
- Data models/collections: `admins`, `mediums`, `orders`, `gallery`, `testimonials`, `content`, `coupons`, `settings`, `payments`, `leads`.
- Public endpoints:
  - mediums/gallery/testimonials/homepage/settings
  - pricing calculate
  - create order + upload references
  - create Cashfree session
  - Cashfree webhook
  - coupon validate
  - order tracking via email + order_number
- Admin endpoints (temporarily **no auth** until core flows are stable):
  - CRUD mediums + pricing rules
  - Orders list/detail + status updates + notes
  - Shiprocket: create shipment for order, store tracking
  - CRUD gallery/testimonials/content/coupons/settings
  - dashboard stats + basic analytics
- Seed default mediums + homepage content approximating current site.
- File handling (MVP): store uploads as Base64 or local file storage (choose simplest that reliably serves images in Emergent).

**Admin Frontend (React)**
- Routes/pages: Login placeholder (wire later), Dashboard, Orders, Order detail (Shiprocket button), Mediums editor, Gallery manager, Testimonials, Content/CMS, Coupons, Settings, Analytics.
- UI style: match palette (#2C1810, #FAF6F0, #C9A84C, #9C8878), premium typography.
- Data tables with filters/search; forms with validation; image upload/preview.

**End-to-end V1 test**
- Use testing agent after Phase 2 to validate:
  - Public reads (mediums/gallery/testimonials/homepage)
  - Create order + upload references
  - Create Cashfree session + simulate webhook update
  - Admin updates: pricing edits reflect in public endpoints
  - Shiprocket create shipment from an order

**Phase 2 user stories**
1. As an owner, I want to edit medium prices/turnaround so the storefront always shows correct pricing.
2. As an owner, I want to see all orders in one place with filters so I can manage work efficiently.
3. As an owner, I want to open an order and ship via Shiprocket so tracking is created in one click.
4. As an owner, I want to update homepage content/stats from admin so I don’t need code changes.
5. As an owner, I want to manage gallery + testimonials so the site stays fresh and credible.

---

### Phase 3 — Add Admin Auth + Hardening
**Goal:** Add JWT auth + secure admin APIs; harden public write endpoints.

- Implement admin auth:
  - `/admin/auth/login`, `/admin/auth/me`, JWT, bcrypt
  - Seed single admin user (env-driven email/password)
  - Protect all admin routes
- Security hardening:
  - CORS allowlist (kalakritishop.in + admin origin)
  - Rate-limit public POST endpoints (orders/leads/webhook)
  - Strong request validation + size limits for uploads
  - Audit logging for status changes + shipping creation
- Improve analytics (minimal charts): revenue over time, orders by medium/status.
- Run testing agent again for authenticated flows.

**Phase 3 user stories**
1. As an owner, I want secure login so only I can access admin data.
2. As an owner, I want my session to persist so I don’t log in repeatedly.
3. As an owner, I want all admin actions protected so customer data is safe.
4. As an owner, I want basic analytics so I can track business performance.
5. As a developer, I want rate limits/validation so the public API isn’t abused.

---

### Phase 4 — Integration Guide + Deployment Finalization
**Goal:** Make integration with the Next.js storefront straightforward.

- Deploy backend + admin to Emergent with env vars.
- Produce `INTEGRATION_GUIDE.md`:
  - What to replace on each Next.js page with which endpoint
  - Example fetch snippets (home, gallery, configurator pricing, order create, payment session)
  - Webhook URL setup in Cashfree dashboard
  - CORS + env vars for Vercel (`NEXT_PUBLIC_API_URL`)
- Optional: if repo access granted later, provide a PR/fork with integration changes.

**Phase 4 user stories**
1. As an owner, I want a deployed admin URL so I can operate daily without local setup.
2. As an owner, I want the storefront to fetch live data so pricing/content updates instantly.
3. As an owner, I want payments to auto-confirm via webhook so I don’t reconcile manually.
4. As an owner, I want customers to track orders via email+order id so support load reduces.
5. As a developer, I want clear integration steps so updates on Vercel are low-risk.

---

## 3) Next Actions (Immediate)
1. **Regenerate/replace exposed production secrets** (recommended) and provide **sandbox keys** if available.
2. Create Emergent project + set env placeholders for MongoDB, Cashfree, Shiprocket.
3. Do Phase 1 web research + implement `poc_core.py` and webhook verifier.
4. Run POC until all integrations pass; only then start Phase 2 build.

---

## 4) Success Criteria
- Phase 1: Cashfree session creation + webhook verification + Shiprocket token + shipment creation + MongoDB read/write all pass.
- Phase 2: Admin can manage mediums/orders/content; public APIs serve data; order create + reference upload works; Shiprocket shipping works from admin.
- Phase 3: Admin JWT auth fully protects admin routes; public endpoints validated + rate-limited.
- Phase 4: Emergent deployment stable; integration guide enables Next.js site to replace hardcoded content with APIs without breakage.
