"""
Farm-Craft API — FastAPI application entrypoint.

Backend Step 1 — Foundation:
- FastAPI app wiring
- PostgreSQL connection via SQLAlchemy 2.x
- /api/health endpoint

Backend Step 4 — Authentication:
- User/OTP models (see app.models)
- /api/auth/* routes (Admin login, Customer OTP, /me, logout)

Backend Step 5A — Products:
- Product model (see app.models)
- /api/products/* CRUD routes (ADMIN only for write operations)

No other business models/routes yet (added in later steps).
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

# Ensure all ORM models are registered on Base.metadata before anything
# (Alembic autogenerate, tests, etc.) might rely on it.
from app import models  # noqa: F401
from app.database.connection import (
    check_database_connection,
    connection_target_description,
)
from app.routers import auth, health, products, orders, stock, reports, customers, contact

logger = logging.getLogger("app.startup")

app = FastAPI(
    title=settings.app_name,
    version=settings.api_version,
    description="Farm-Craft backend API",
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(products.router, prefix=settings.api_prefix)
app.include_router(orders.router, prefix=settings.api_prefix)
app.include_router(stock.router, prefix=settings.api_prefix)
app.include_router(reports.router, prefix=settings.api_prefix)
app.include_router(customers.router, prefix=settings.api_prefix)
app.include_router(contact.router, prefix=settings.api_prefix)


@app.on_event("startup")
def _log_database_connectivity() -> None:
    """On boot, verify the database is reachable and log a clear,
    password-free diagnostic either way. This surfaces connection
    problems (wrong role/password/host/port/database) immediately in the
    server logs instead of only on the first request that touches the DB.
    """
    if check_database_connection():
        logger.info("Database connection OK (%s)", connection_target_description())
    else:
        logger.error(
            "Database connection FAILED at startup (%s). The API will "
            "still start, but requests that touch the database will fail "
            "until this is resolved. See the preceding 'Database "
            "connection failed' log line for the error type.",
            connection_target_description(),
        )


@app.get("/")
def root() -> dict:
    return {
        "message": f"{settings.app_name} is running",
        "docs": "/docs",
        "health": f"{settings.api_prefix}/health",
    }
