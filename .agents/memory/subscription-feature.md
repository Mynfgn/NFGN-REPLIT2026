---
name: Subscription / Autoship Feature
description: Recurring product delivery — subscribe from shop, manage from dashboard, 10% discount applied at reorder
---

## What was built

- **DB table**: `subscriptions` in `lib/db/src/schema/subscriptions.ts`
  - Fields: userId, productId, productName, productImage, quantity, frequency (monthly/bimonthly/quarterly), unitPrice, discountPct (default 10%), status (active/paused/cancelled), nextOrderAt, shippingAddress
- **API**: `artifacts/api-server/src/routes/subscriptions.ts` mounted at `/api/subscriptions`
  - GET /api/subscriptions — list user's subscriptions
  - POST /api/subscriptions — create (productId, quantity, frequency)
  - PATCH /api/subscriptions/:id — update status/frequency/quantity
  - POST /api/subscriptions/:id/reorder — adds to cart at discounted customPrice
- **Frontend**: `artifacts/nfgn/src/pages/dashboard/Subscriptions.tsx` at `/dashboard/subscriptions`
- **Nav**: Added "Subscriptions" item to DashboardLayout My Account section (RefreshCw icon)
- **Shop**: "Subscribe & Save 10%" button added to featured product cards (not shown on isProPackage or isDonation products)

## Key design decisions

- No auto-charge: subscriptions are intent-based. "Order Now" button in dashboard adds to cart at 10% off (via cartItemsTable.customPrice)
- Discount applied via customPrice on cart item, not a promo code
- Duplicate active subscription for same product is blocked (409)

**Why:** Storing card tokens for true auto-billing requires PCI-compliant token vaulting. Using cart-based reorder keeps the flow simple and safe.
