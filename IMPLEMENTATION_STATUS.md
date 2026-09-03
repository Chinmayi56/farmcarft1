# Farm-Craft Project Status

- Step 1 — FastAPI Foundation: COMPLETE
- Step 2 — PostgreSQL: CONFIGURED
- Step 3 — SQLAlchemy + Alembic: COMPLETE
- Step 4 — JWT + Demo Customer OTP: COMPLETE
- Step 5A — Product Model + CRUD APIs: COMPLETE
- Step 5B — Admin Product API integration: COMPLETE
- Step 6 — Customer Products: COMPLETE
- Step 7 — Customer Cart + Orders + COD: COMPLETE
- Step 8 — Admin Order Management: COMPLETE
- Step 9 — Stock Management: COMPLETE
- Step 10 — Reports: COMPLETE
- Step 11 — PL/pgSQL: COMPLETE
- Prompt 2 — Admin + Company Info + Contact Messages + Email Notification: COMPLETE (code) — see note below
- Step 12 — Deployment: PENDING

Local demo credentials:
- Admin: admin@farmcraft.com / admin123
- Customer: any valid-looking email + OTP 1234

Local ports:
- Backend: http://127.0.0.1:8000
- Admin: http://localhost:5173
- Customer: http://localhost:5174

The Admin and Customer Vite development servers proxy `/api` to the backend on port 8000. Product, cart, order, stock, report, and contact-enquiry business data use the PostgreSQL-backed FastAPI API. Frontend wishlist/address preferences remain local until a later persistent profile subsystem is added.

Contact Messages / Customer Enquiries (Prompt 2):
- Statuses are `New` -> `Read` -> `Replied` (the earlier `Resolved` label was renamed via an Alembic migration).
- Admin: Contact Messages page (list + detail with status update), requires JWT + ADMIN role.
- Customer: Contact page form posts to `POST /api/contact`, which stores the enquiry in PostgreSQL and best-effort emails `farmcraft68@gmail.com`. Email delivery failure never loses the stored enquiry.
- Email delivery was NOT verified end-to-end in the development/build environment used to produce this codebase — no Gmail App Password was configured there. See the Prompt 2 final report for details.
