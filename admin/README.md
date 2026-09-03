# Farm Craft — Admin Portal

An admin dashboard for Farm Craft, built with React, TypeScript, Vite,
Tailwind CSS, React Router, Lucide React and Recharts.

**Products** (Backend Step 5B) are connected to the real FastAPI + PostgreSQL
backend — `admin/src/data/productApi.ts` calls the live
`/api/products` CRUD endpoints, and there is no product mock data or
localStorage product storage left in this app. **Admin login** uses the real
`/api/auth/admin/login` JWT endpoint so authenticated requests can reach the
protected Product endpoints. Customers, orders and offers are still mock
data/`localStorage` — those are out of scope for this step.

## Getting started

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend if not localhost:8000
npm run dev
```

Then open the printed local URL and go to `/admin/login`. Make sure the
backend (`../backend`) is running against a migrated PostgreSQL database —
the migrations seed the demo admin account below.

## Demo login

- Email: `admin@farmcraft.com`
- Password: `admin123`

Use **"Use Demo Credentials"** to autofill the form, or **"Login as Demo Admin"**
to sign in with one click. The JWT is stored under the `farmcraft_admin_token`
key in `localStorage` (with basic admin profile info under
`farmcraft_admin_session`) — clearing it (or logging out) returns you to
`/admin/login`.

## Routes

```
/admin/login
/admin/dashboard
/admin/products
/admin/products/add
/admin/products/:id
/admin/purchased-products
/admin/customers
/admin/customers/:id
/admin/out-of-stock
/admin/offers
/admin/reports
/admin/settings
```

## Notes

- Products are fetched/created/updated/deleted through the real Product API
  (`src/data/productApi.ts` → `src/lib/apiClient.ts`). Customers, orders,
  offers and dashboard chart data are still mock data in `src/data/mockData.ts`.
- The backend's Product entity has no low-stock `threshold` field yet (that
  belongs to a later Stock Management step), so the Admin UI defaults every
  product's threshold to `5` on the client; `lastStockDate` is derived from
  the server's real `updated_at` timestamp.
- This project only contains the `admin/` frontend, as scoped — no `customer/` or
  `backend/` folders/files are modified.
- Build for production with `npm run build`; preview with `npm run preview`.
