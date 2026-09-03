"""
Health check endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.database.connection import get_db, check_database_connection

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check() -> dict:
    """Basic liveness check + database connectivity status.

    Always returns HTTP 200 so it's suitable for simple uptime checks;
    the `database` field reports whether the DB is actually reachable.
    """
    db_ok = check_database_connection()
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.api_version,
        "environment": settings.app_env,
        "database": "connected" if db_ok else "unavailable",
    }


@router.get("/health/db")
def health_check_db(db: Session = Depends(get_db)) -> dict:
    """Database-specific health check using a real request-scoped session."""
    from sqlalchemy import text

    result = db.execute(text("SELECT 1")).scalar()
    return {"database": "connected", "result": result}
