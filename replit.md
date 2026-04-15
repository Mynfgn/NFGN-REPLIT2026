# New Face Global Network (NFGN) — Workspace

## Overview

Full-stack MLM/network marketing platform for naturopathic wellness products. Built as a pnpm monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (async handlers; return Promise<void>)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → `lib/api-client-react`)
- **Frontend**: React + Vite + Wouter + Zustand + shadcn/ui + TailwindCSS
- **Auth**: JWT (HS256) stored in localStorage as `nfgn_token`; Bearer header via `customFetch`
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed the DB with demo data (idempotent)

## Artifacts

- **Frontend** (`artifacts/nfgn`) — React + Vite app at `/`; port from `$PORT`
- **API Server** (`artifacts/api-server`) — Express 5 API at port 8080; Vite proxies `/api` → `localhost:8080`

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@nfgn.com | NFGNAdmin!2026# |
| Pro Member | promember@nfgn.com | ProMember!2026# |
| Customer | customer@nfgn.com | Customer!2026# |

## Database Schema (15 tables)

All tables in `lib/db/src/schema/index.ts`:
- `usersTable` — users with roles: super_admin, admin, store_admin, pro_member, affiliate, customer
- `productsTable` + `categoriesTable` — product catalog with images
- `ordersTable` + `orderItemsTable` — e-commerce orders
- `cartItemsTable` — server-side cart per user
- `commissionsTable` — 9-level MLM commissions (level 2 = power level at 20%)
- `walletTable` + `walletTransactionsTable` — e-wallet and transaction history
- `payoutsTable` — payout requests and processing
- `bookingsTable` + `professionalsTable` — Book-A-Professional feature
- `messagesTable` — internal messaging with broadcast support
- `promosTable` — promo/coupon codes
- `settingsTable` — system-wide key/value settings

## Key Files

- `artifacts/api-server/src/routes/index.ts` — mounts all 14 route modules
- `artifacts/api-server/src/lib/auth.ts` — JWT middleware, hashPassword, requireAuth, requireAdmin
- `artifacts/api-server/src/lib/commissions.ts` — 9-level MLM commission processing
- `artifacts/nfgn/src/App.tsx` — frontend router with all 30+ routes wired up
- `artifacts/nfgn/src/hooks/use-auth.ts` — JWT auth state (localStorage "nfgn_token")
- `artifacts/nfgn/vite.config.ts` — Vite config with /api proxy to port 8080
- `lib/api-client-react/src/generated/api.ts` — all generated hooks (useLogin, useListProducts, etc.)
- `scripts/src/seed.ts` — full database seed (idempotent)

## Frontend Pages Built

### Public
- `/` — Luxury homepage with hero, featured products, stats, CTA sections
- `/shop` — Product catalog with search, category filter, add-to-cart
- `/join` — MLM membership signup flow with sponsor lookup
- `/book` — Book-A-Professional directory with expert cards
- `/about`, `/contact`, `/rep/:username` — stub pages

### Auth
- `/login` — JWT login with demo credential hints and role-based redirect

### Member Dashboard (`/dashboard/*`)
- `/dashboard` — Overview with wallet balance, earnings, team size, recent orders/commissions
- `/dashboard/orders` — Order history with status badges
- `/dashboard/wallet` — Wallet balance, transactions, payout requests
- `/dashboard/commissions` — 9-level commission history and rules display
- `/dashboard/genealogy` — Visual downline tree with stats
- `/dashboard/messages` — Inbox with message threading and mark-as-read
- `/dashboard/bookings`, `/dashboard/payouts`, `/dashboard/profile`, `/dashboard/reports` — stubs

### Admin (`/admin/*`)
- `/admin` — KPI dashboard with sales, orders, members, top products
- `/admin/users` — User management with role upgrade to Pro Member
- `/admin/orders` — All orders with status management
- `/admin/commissions` — Commission approval/rejection queue
- `/admin/payouts` — Payout processing queue
- `/admin/products`, `/admin/categories`, `/admin/bookings`, `/admin/professionals`, `/admin/messages`, `/admin/promos`, `/admin/settings`, `/admin/reports`, `/admin/genealogy` — stubs

## MLM Commission Rules

- Level 1: 10% (direct sponsor)
- Level 2: 20% (power level)
- Level 3: 5%
- Level 4–9: 3% each
- Only `pro_member` role earns commissions

## Brand Colors

- Black: `#0a0a0a` (background)
- Gold: `#C9A84C` (primary)
- White: `#ffffff` (foreground)
- Forest Green: `#2D6A4F` (accent)

## API Hook Naming Conventions (Generated)

Query hooks: `useListXxx`, `useGetXxx`
Mutation hooks: `useLogin`, `useRegister`, `useLogout`, `useUpgradeToPro`, `useApproveCommission`, `useRejectCommission`, `useRequestPayout`, `useProcessPayout`, `useSendMessage`, `useMarkMessageRead`, `useUpdateOrderStatus`, `useAdjustWallet`, `useCreateBooking`, `useUpdateBookingStatus`, `useAddToCart`, `useUpdateCartItem`, `useRemoveCartItem`, `useClearCart`, `useCreateOrder`
