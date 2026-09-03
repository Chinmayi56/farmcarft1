"""
SQLAlchemy engine and session configuration.

Provides:
- `engine`: the SQLAlchemy 2.x engine connected to PostgreSQL.
- `SessionLocal`: a session factory for creating DB sessions.
- `get_db`: a FastAPI dependency that yields a session per request.
- `check_database_connection`: a simple connectivity test helper.
"""
import logging
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, Session

from app.config import settings

logger = logging.getLogger("app.database")

# --- Engine ---
# pool_pre_ping avoids handing out stale/dead connections.
engine = create_engine(
    settings.sqlalchemy_database_url,
    echo=settings.db_echo,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout,
    pool_pre_ping=True,
    future=True,
)


def connection_target_description() -> str:
    """Human-readable, PASSWORD-FREE description of the configured DB
    target (driver/host/port/database/user), for use in logs and any
    diagnostic messages. Never include the password here.
    """
    try:
        url = make_url(settings.sqlalchemy_database_url)
        return (
            f"driver={url.drivername} user={url.username!r} "
            f"host={url.host} port={url.port} database={url.database!r}"
        )
    except Exception:
        # Even the URL parsing itself must never blow up into leaking
        # the raw (password-containing) URL string.
        return "driver=<unparseable> host=<unknown> database=<unknown>"

# --- Session factory ---
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    future=True,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context-manager version of get_db, for use outside request handlers
    (e.g. scripts, startup checks, tests)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    """Attempt a lightweight query against the database.

    Returns True if the connection succeeds, False otherwise. Never raises.

    On failure, logs a diagnostic message that identifies the target
    host/port/database/user and the underlying error class, WITHOUT ever
    including the password (neither the configured password nor whatever
    psycopg/SQLAlchemy may have embedded in its own error text/DSN).
    """
    target = connection_target_description()
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        # Use the exception's class + a short, generic reason rather than
        # str(exc) verbatim: some DBAPI errors can echo back the DSN they
        # tried to use (which may contain the password), so we deliberately
        # do not log the raw exception message.
        reason = type(exc).__name__
        logger.error(
            "Database connection failed (%s). Target: %s. This is almost "
            "always a PostgreSQL server/role/permissions issue rather than "
            "an application bug -- verify the role's password and that it "
            "can authenticate to this host/database (see pg_hba.conf).",
            reason,
            target,
        )
        return False
