# Farm-Craft Backend — Steps 1–11

FastAPI + PostgreSQL + SQLAlchemy 2.x + Alembic with JWT/demo OTP authentication,
Products, Cart, Orders (COD), Admin Order Management, Stock, Reports and PL/pgSQL.
Deployment remains the next step.

## Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entrypoint
│   ├── config.py            # Environment-based settings (pydantic-settings)
│   ├── database/
│   │   ├── connection.py    # SQLAlchemy engine, session, get_db dependency
│   │   └── base.py          # Declarative Base for ORM models
│   ├── models/
│   │   ├── user.py           # User model (ADMIN / CUSTOMER roles)
│   │   ├── otp.py            # OTP model (demo Customer login)
│   │   └── product.py        # Product model + ProductStatus enum (Step 5A)
│   ├── schemas/
│   │   ├── auth.py           # Pydantic request/response schemas for auth
│   │   └── product.py        # ProductCreate / ProductUpdate / ProductOut schemas
│   ├── routers/
│   │   ├── health.py         # GET /api/health, GET /api/health/db
│   │   ├── auth.py           # /api/auth/* endpoints (see below)
│   │   └── products.py       # /api/products/* CRUD endpoints (see below)
│   ├── services/
│   │   ├── auth_service.py     # Admin login + Customer OTP business logic
│   │   └── product_service.py  # Product CRUD business logic
│   ├── middleware/            # (empty — custom middleware added later)
│   └── utils/
│       ├── security.py       # Password/OTP hashing (PBKDF2-HMAC-SHA256)
│       ├── jwt.py             # JWT create/decode
│       └── dependencies.py    # get_current_user / require_admin / require_customer
├── alembic/
│   ├── env.py                # Reads DATABASE_URL from app.config.settings
│   └── versions/              # Migration scripts (foundation + auth + products tables)
├── tests/
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_database.py
│   ├── test_auth.py          # Auth endpoint + JWT + role-protection tests
│   └── test_products.py      # Product CRUD + admin-authorization tests
├── requirements.txt
├── .env                       # Local environment config (not committed)
├── .env.example                # Template for .env
├── alembic.ini
└── pytest.ini
```

## Authentication (Step 4)

| Method | Endpoint                        | Purpose                                             |
| ------ | -------------------------------- | ---------------------------------------------------- |
| POST   | `/api/auth/admin/login`          | Admin login with email + password → JWT              |
| POST   | `/api/auth/customer/send-otp`    | Request a demo OTP for a Customer email (always `1234`, never returned) |
| POST   | `/api/auth/customer/verify-otp`  | Verify OTP `1234` → creates/authenticates Customer → JWT |
| GET    | `/api/auth/me`                   | Return the authenticated user (requires `Authorization: Bearer <jwt>`) |
| POST   | `/api/auth/logout`               | Stateless logout endpoint for frontend compatibility |

Notes:

- Passwords and OTP codes are **hashed** (PBKDF2-HMAC-SHA256, salted, 260k
  iterations) — never stored or returned in plain text.
- The initial demo Admin account (`admin@farmcraft.com` / `admin123` — the
  same credentials already shown in the Admin frontend's login screen) is
  seeded by the Alembic migration `b2a85fd20a3e_add_authentication_tables`.
- JWTs embed `sub` (user id), `email`, and `role`, and are signed with
  `JWT_SECRET_KEY` from `.env` (never hard-coded).
- `app/utils/dependencies.py` exposes `get_current_user`, `require_admin`,
  and `require_customer` FastAPI dependencies for future protected routes
  (Orders, Cart, etc. in later steps).

## Products (Step 5A)

| Method | Endpoint                | Auth required           | Purpose                                |
| ------ | ------------------------ | ------------------------ | --------------------------------------- |
| POST   | `/api/products`           | ADMIN                    | Create a product                        |
| GET    | `/api/products`           | Any authenticated user   | List products (filter/search/paginate)  |
| GET    | `/api/products/{id}`      | Any authenticated user   | Fetch a single product                  |
| PUT    | `/api/products/{id}`      | ADMIN                    | Update a product (partial update)       |
| DELETE | `/api/products/{id}`      | ADMIN                    | Delete a product                        |

Notes:

- The `Product` model (`app/models/product.py`) mirrors the fields already
  used by the Admin frontend's product form/type: `name`, `category`,
  `sku` (unique), `price`, `discount_price`, `stock`, `description`,
  `status` (`Active` / `Draft` / `Out of Stock`), `image` / `images`, and
  the optional machinery spec fields (`motor`, `capacity`, `length`,
  `height`, `pipe_material`, `screw_material`, `usage`, `features`,
  `applications`).
- Write operations (`POST` / `PUT` / `DELETE`) require an ADMIN JWT via
  the existing `require_admin` dependency — a valid Customer token gets
  `403 Forbidden`, and no token gets `401 Unauthorized`.
- `GET /api/products` supports `skip`, `limit`, `category`, `status`, and
  `search` (matches name or SKU) query parameters and returns
  `{"total": <int>, "items": [...]}`.
- Creating/updating a product with a SKU that's already in use returns
  `409 Conflict`. Fetching/updating/deleting an unknown id returns
  `404 Not Found`.
- No Cart, Orders, Stock Management, Reports, or Notifications logic is
  included — this step is the Product entity and its CRUD API only.

## Contact Messages / Customer Enquiries (Prompt 2)

| Method | Endpoint                              | Auth required | Purpose                              |
| ------ | -------------------------------------- | -------------- | ------------------------------------- |
| POST   | `/api/contact`                          | Public         | Customer submits a contact enquiry    |
| GET    | `/api/admin/contact-messages`           | ADMIN          | List all enquiries                    |
| GET    | `/api/admin/contact-messages/{id}`      | ADMIN          | Fetch a single enquiry                |
| PATCH  | `/api/admin/contact-messages/{id}`      | ADMIN          | Update an enquiry's status            |

Notes:

- `ContactMessage` status is one of `New` / `Read` / `Replied` (the
  `contact_message_status` PostgreSQL enum — renamed from `Resolved` to
  `Replied` via a follow-up Alembic migration).
- `POST /api/contact` always stores the enquiry in PostgreSQL first; a
  best-effort email notification is then sent to
  `CONTACT_RECIPIENT_EMAIL` (default `farmcraft68@gmail.com`). The
  response includes `email_sent: bool` so the Customer frontend can show
  a truthful message even when SMTP isn't configured or delivery fails —
  the stored enquiry is never lost or rolled back because of an email
  failure.
- All `/api/admin/contact-messages*` routes require a valid JWT **and**
  the ADMIN role via the existing `require_admin` dependency — the same
  mechanism used by Products/Orders/Stock/Reports. A Customer token gets
  `403 Forbidden`; no token gets `401 Unauthorized`.
- Email is sent via `app/services/email_service.py` using stdlib
  `smtplib` and the `SMTP_*` / `CONTACT_RECIPIENT_EMAIL` environment
  variables (see `.env.example`). `SMTP_PASSWORD` has no default and
  must never be committed.

## Prerequisites

- Python 3.11+
- A running PostgreSQL server and an empty database for this project

## 1. Create and activate a virtual environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
```

## 2. Install dependencies

```bash
pip install -r requirements.txt
```

## 3. Configure the environment

Copy the example file and edit it with your real PostgreSQL credentials:

```bash
cp .env.example .env
```

Edit `.env` and set:

```
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
```

(Credentials are never hard-coded in the source — everything is read from
`.env` / environment variables via `app/config.py`.)

Make sure the target database already exists, e.g.:

```bash
createdb farmcraft_db
# or with psql:
psql -c "CREATE DATABASE farmcraft_db;"
```

## 4. Run the database migrations

```bash
alembic upgrade head
```

This applies, in order: the initial (empty) migration, the authentication
tables migration (`users`, `otps` + seeded demo Admin), and the
`add products table` migration (Step 5A) — confirming the migration
pipeline works end-to-end against PostgreSQL.

To create a new migration later (once more models exist):

```bash
alembic revision --autogenerate -m "add <table> table"
alembic upgrade head
```

## 5. Start the API server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API root: http://localhost:8000/
- Interactive docs (Swagger UI): http://localhost:8000/docs
- Health check: http://localhost:8000/api/health
- DB-specific health check: http://localhost:8000/api/health/db

A healthy response looks like:

```json
{
  "status": "ok",
  "app": "Farm-Craft API",
  "version": "1.0.0",
  "environment": "development",
  "database": "connected"
}
```

## 6. Run the tests

Make sure you've run `alembic upgrade head` first (step 4 above) — the
auth tests rely on the seeded demo Admin account existing in the
database, and the product tests rely on the `products` table existing.

```bash
pytest
```

This runs the health-endpoint tests, the database-connection tests
(engine connect, session query, context-manager session, and a check that
the connected database is in fact PostgreSQL), the authentication tests
(Admin login success/failure, Customer OTP send/verify including
incorrect and expired codes, JWT claims, `/api/auth/me`, and Admin/Customer
role protection), and the Product CRUD tests (create/list/get/update/delete,
duplicate-SKU handling, not-found handling, and ADMIN-only enforcement on
write operations).

## What's intentionally NOT in this step

- No Order, Cart, Wishlist, Stock Management, Reports, or Notifications
  models/tables/routes
- No mock product/order/customer data beyond the single seeded demo Admin
  account required for login
- No server-side token blacklist/refresh-token system (JWTs are
  short-lived and stateless by design for this step)

These are planned for later backend steps and will build on this
foundation (`app/database/base.py`'s `Base` class, the `app/models/`,
`app/schemas/`, `app/routers/`, and `app/services/` packages, Alembic
autogeneration, and the `require_admin` / `require_customer` auth
dependencies already available in `app/utils/dependencies.py`).
