# 🎨 Kalakriti — Admin Panel × Next.js Storefront Integration Guide

This guide explains **how to connect your existing kalakritishop.in (Next.js on Vercel) to this admin panel's backend API** so that:
- ✅ Content edits in admin (prices, gallery, testimonials, homepage text) appear live on storefront
- ✅ Customer orders placed on storefront land in admin panel
- ✅ Cashfree payments flow from storefront → backend → admin
- ✅ You can ship from admin panel via Shiprocket

---

## 1. Architecture Overview

```
  kalakritishop.in (Next.js)           Admin Panel (this app)
  ┌───────────────────────┐            ┌──────────────────────┐
  │ Home, Gallery,        │  Public    │ FastAPI Backend      │
  │ Configurator,         │───API ───▶ │ + MongoDB            │
  │ Payment, Tracking     │  (fetch)   │ + Cashfree           │
  └───────────────────────┘            │ + Shiprocket         │
                                       └──────────┬───────────┘
                                                  │  JWT-secured Admin API
                                                  ▼
                                       ┌──────────────────────┐
                                       │ Admin React UI       │
                                       │ (you log in here)    │
                                       └──────────────────────┘
```

**Backend is deployed at:** `https://order-hub-390.preview.emergentagent.com` (update after final deploy).

---

## 2. Environment Variables to Add on Vercel

Open your Next.js repo on Vercel → Settings → Environment Variables, add:

```
NEXT_PUBLIC_API_URL=https://order-hub-390.preview.emergentagent.com/api
```

Redeploy the site once added.

---

## 3. Public API Endpoints (use these from Next.js)

All endpoints are **CORS-enabled** and **unauthenticated** (public).

| What you need                      | Method | Path                              |
| ---------------------------------- | ------ | --------------------------------- |
| List all active mediums            | GET    | `/public/mediums`                 |
| Get single medium                  | GET    | `/public/mediums/{slug}`          |
| Gallery images                     | GET    | `/public/gallery?featured=true`   |
| Testimonials                       | GET    | `/public/testimonials?featured=true` |
| Homepage CMS content               | GET    | `/public/homepage`                |
| Site settings (brand, contact)     | GET    | `/public/site-settings`           |
| Calculate live price               | POST   | `/public/pricing/calculate`       |
| Validate coupon code               | POST   | `/public/coupons/validate`        |
| Create order                       | POST   | `/public/orders`                  |
| Create Cashfree payment session    | POST   | `/public/payment/create-session`  |
| Cashfree webhook (server-to-server)| POST   | `/public/payment/webhook`         |
| Track order (customer)             | POST   | `/public/orders/track`            |
| Capture lead                       | POST   | `/public/leads`                   |

---

## 4. Replace Hardcoded Content — Code Snippets

### 4a. Home page mediums grid (`app/home-page/page.tsx`)

**Before (hardcoded):**
```tsx
const mediums = [
  { name: "Watercolour", price: 2800, ... }, // hardcoded
  ...
];
```

**After (fetch from backend):**
```tsx
// app/home-page/page.tsx
async function getMediums() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/mediums`, {
    next: { revalidate: 60 }, // ISR: cache 60 seconds
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function HomePage() {
  const mediums = await getMediums();
  return (
    <section>
      {mediums.map((m) => (
        <div key={m.slug}>
          <img src={m.image_url} alt={m.name} />
          <h3>{m.name}</h3>
          <p>{m.tagline}</p>
          <div>From ₹{m.base_price.toLocaleString('en-IN')}</div>
          <div>{m.turnaround_min}–{m.turnaround_max} days</div>
          {m.badge && <span className="badge">{m.badge}</span>}
        </div>
      ))}
    </section>
  );
}
```

### 4b. Gallery (`app/gallery/page.tsx`)

```tsx
async function getGallery() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/gallery`, {
    next: { revalidate: 300 },
  });
  return res.ok ? res.json() : [];
}

export default async function GalleryPage() {
  const items = await getGallery();
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((g) => (
        <figure key={g.id}>
          <img src={g.after_url} alt={g.title} />
          <figcaption>{g.title} · {g.medium}</figcaption>
        </figure>
      ))}
    </div>
  );
}
```

### 4c. Testimonials + Homepage stats/process steps

```tsx
async function getHomepage() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/homepage`, { next: { revalidate: 60 }});
  return r.ok ? r.json() : {};
}
async function getTestimonials() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/testimonials?featured=true`, { next: { revalidate: 300 }});
  return r.ok ? r.json() : [];
}
```
Use `homepage.hero_title`, `homepage.stats`, `homepage.process_steps`, `homepage.cta_title` in JSX.

### 4d. Portrait Configurator — live pricing (`app/portrait-configurator/page.tsx`)

This should be a **client component** ("use client") since it has interactive form:

```tsx
"use client";
import { useState, useEffect } from "react";

export default function Configurator() {
  const [mediumSlug, setMediumSlug] = useState("watercolour");
  const [size, setSize] = useState("A3");
  const [faces, setFaces] = useState(1);
  const [rush, setRush] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [price, setPrice] = useState(null);

  useEffect(() => {
    const fn = async () => {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/pricing/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medium_slug: mediumSlug, size, faces, rush, coupon_code: coupon }),
      });
      if (r.ok) setPrice(await r.json());
    };
    fn();
  }, [mediumSlug, size, faces, rush, coupon]);

  return (
    <form>
      {/* your selectors */}
      {price && <div className="total">₹{price.total.toLocaleString('en-IN')}</div>}
    </form>
  );
}
```

### 4e. Submit Order + Start Payment (configurator submit handler)

```tsx
async function submitOrder(orderData, references) {
  // 1) Create order
  const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: orderData.name,
        email: orderData.email,
        phone: orderData.phone,
        address: orderData.address,
        city: orderData.city,
        state: orderData.state,
        pincode: orderData.pincode,
      },
      medium_slug: orderData.medium,
      size: orderData.size,
      faces: orderData.faces,
      rush: orderData.rush,
      references: references, // [{ url, filename }]
      coupon_code: orderData.coupon,
    }),
  });
  const order = await orderRes.json();

  // 2) Create Cashfree payment session
  const paymentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/payment/create-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: order.order_id,
      return_url: `https://kalakritishop.in/payment/return?order=${order.order_number}`,
    }),
  });
  const session = await paymentRes.json();

  // 3) Open Cashfree Checkout with the session
  // Load https://sdk.cashfree.com/js/v3/cashfree.js in <Script> tag
  const cashfree = window.Cashfree({ mode: "production" });
  cashfree.checkout({
    paymentSessionId: session.payment_session_id,
    redirectTarget: "_self",
  });
}
```

Include Cashfree JS SDK once in `app/layout.tsx`:
```tsx
<Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" />
```

### 4f. Order Tracking (Project Review Portal)

```tsx
async function trackOrder(email, orderNumber) {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/orders/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, order_number: orderNumber }),
  });
  return r.ok ? r.json() : null;
}
```

### 4g. Reference photo uploads

For V1, upload photos to a storage provider (Cloudinary / S3 / Firebase) from the Next.js client, then pass the **public URLs** to the order-create endpoint as `references: [{ url, filename }]`.

Recommended free option: **Cloudinary** (free tier supports unsigned uploads from client).

---

## 5. Cashfree Webhook Setup

1. Log into **Cashfree Dashboard** → Developers → Webhooks
2. Add webhook URL: `https://order-hub-390.preview.emergentagent.com/api/public/payment/webhook`
3. Events to subscribe: `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`
4. Save. The backend verifies HMAC-SHA256 signatures automatically.

When a payment succeeds, the order in admin auto-updates:
- `payment.status = PAID`
- `status = PAYMENT_RECEIVED`
- Timeline event added

---

## 6. Shipping Flow (Admin-Driven)

No integration needed on Next.js for shipping — admin handles entirely:

1. Customer pays → order shows as "Paid" in admin
2. Admin completes portrait → marks status `APPROVED`
3. Admin clicks **Ship with Shiprocket** on order detail page
4. Admin selects courier from list (cheapest auto-selected)
5. Backend calls Shiprocket: create order → assign AWB → generate label → request pickup
6. AWB + tracking URL stored in order; customer can track via `/public/orders/track`

---

## 7. Admin Access

- **URL:** https://order-hub-390.preview.emergentagent.com/login
- **Default credentials** (change immediately from Settings → or via .env):
  - Email: `admin@kalakriti.in`
  - Password: `Kalakriti@2026`

---

## 8. Security Checklist

### Before going live:

- [ ] **Regenerate Cashfree production keys** (you shared them in chat during setup)
  - Cashfree Dashboard → Developers → API Keys → Regenerate
  - Update `CASHFREE_CLIENT_ID` and `CASHFREE_CLIENT_SECRET` in backend `.env`
- [ ] **Change default admin password** — update `ADMIN_PASSWORD` in backend `.env` and restart
- [ ] **Restrict CORS** — set `CORS_ORIGINS=https://kalakritishop.in,https://www.kalakritishop.in` instead of `*`
- [ ] **Rotate JWT_SECRET** — use a strong random string (`openssl rand -hex 32`)
- [ ] **Webhook IP whitelisting** (optional) — restrict to Cashfree IPs
- [ ] **Regenerate Shiprocket password** — you shared it in chat

---

## 9. Local Testing Without Deploying Next.js

From your local Next.js dev (`http://localhost:3000`):

```bash
# in Next.js .env.local
NEXT_PUBLIC_API_URL=https://order-hub-390.preview.emergentagent.com/api
```

The backend CORS is currently `*` so it works from any origin. Test the flows, then tighten CORS before production.

---

## 10. What's Included in Admin (Feature Recap)

| Feature                  | Where                             |
| ------------------------ | --------------------------------- |
| Dashboard + stats        | `/dashboard`                      |
| Orders list + detail     | `/orders`, `/orders/:id`          |
| **Ship via Shiprocket**  | Order detail → "Ship" button      |
| Edit prices, sizes, rush | `/mediums/:id`                    |
| Gallery before/after     | `/gallery`                        |
| Testimonials             | `/testimonials`                   |
| Homepage CMS             | `/content`                        |
| Coupons                  | `/coupons`                        |
| Site settings + pickup   | `/settings`                       |
| Revenue / funnel charts  | `/analytics`                      |

---

## 11. Additional Features You Could Add Later

1. **Artist management** — multi-artist, assignment, performance tracking
2. **Draft review portal** — artist uploads watermarked draft, customer annotates, approves
3. **Email automation** — SendGrid/Resend for order confirmation, draft ready, shipped
4. **WhatsApp notifications** — via Gupshup/Twilio for Indian customers
5. **Abandoned configurator recovery** — lead captured → WhatsApp reminder
6. **Revenue goals & forecasting**
7. **Customer accounts** — order history, repeat purchases
8. **Bulk order operations** — multi-ship, export to CSV
9. **SEO editor** — per-page meta titles/descriptions
10. **A/B testing for pricing**
11. **Referral program**

---

## 12. Need Help?

Your Admin Studio is at: https://order-hub-390.preview.emergentagent.com  
Backend API root: https://order-hub-390.preview.emergentagent.com/api  
API docs (Swagger): https://order-hub-390.preview.emergentagent.com/docs

---

_Built with ❤️ by Emergent._
