"""
Declarative base for SQLAlchemy 2.x models.

Business models subclass `Base` from here, e.g.:

    from app.database.base import Base

    class Product(Base):
        __tablename__ = "products"
        ...

This module only provides the shared metadata/base that Alembic
autogeneration targets. See `app.models.product.Product` (Backend Step 5A)
for the first business model built on it.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base class for all ORM models."""
    pass
