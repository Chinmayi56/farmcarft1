"""Basic database connectivity tests for the SQLAlchemy engine/session."""
from sqlalchemy import text

from app.database.connection import (
    engine,
    SessionLocal,
    get_db_context,
    check_database_connection,
)


def test_engine_connects_to_postgres():
    """The SQLAlchemy engine should be able to open a raw connection and
    run a trivial query against PostgreSQL."""
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1")).scalar()
        assert result == 1


def test_check_database_connection_helper():
    assert check_database_connection() is True


def test_session_local_executes_query():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT 2 + 2")).scalar()
        assert result == 4
    finally:
        db.close()


def test_get_db_context_manager():
    with get_db_context() as db:
        result = db.execute(text("SELECT current_database()")).scalar()
        assert result is not None


def test_database_is_postgresql():
    """Confirm we are actually talking to PostgreSQL (not e.g. SQLite),
    since this backend is built specifically for PostgreSQL."""
    with engine.connect() as connection:
        version = connection.execute(text("SELECT version()")).scalar()
        assert "PostgreSQL" in version
