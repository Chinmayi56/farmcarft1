"""Pydantic request/response schemas for Product endpoints (Backend Step 5A)."""
import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.product import ProductStatus


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category: str = Field(min_length=1, max_length=100)
    sku: str = Field(min_length=1, max_length=100)
    price: Decimal = Field(ge=0)
    discount_price: Decimal | None = Field(default=None, ge=0)
    stock: int = Field(ge=0)
    description: str | None = None
    status: ProductStatus = ProductStatus.ACTIVE

    image: str | None = None
    images: list[str] | None = None

    motor: str | None = None
    capacity: str | None = None
    length: str | None = None
    height: str | None = None
    pipe_material: str | None = None
    screw_material: str | None = None
    usage: str | None = None
    features: list[str] | None = None
    applications: list[str] | None = None

    @field_validator("discount_price")
    @classmethod
    def _discount_not_above_price(cls, v: Decimal | None, info) -> Decimal | None:
        price = info.data.get("price")
        if v is not None and price is not None and v > price:
            raise ValueError("discount_price cannot be greater than price")
        return v


class ProductCreate(ProductBase):
    """Payload for POST /api/products. All fields required except the
    optional/nullable ones inherited from ProductBase."""
    pass


class ProductUpdate(BaseModel):
    """Payload for PUT /api/products/{id}. All fields optional — only
    supplied fields are updated (partial update semantics)."""
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    sku: str | None = Field(default=None, min_length=1, max_length=100)
    price: Decimal | None = Field(default=None, ge=0)
    discount_price: Decimal | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)
    description: str | None = None
    status: ProductStatus | None = None

    image: str | None = None
    images: list[str] | None = None

    motor: str | None = None
    capacity: str | None = None
    length: str | None = None
    height: str | None = None
    pipe_material: str | None = None
    screw_material: str | None = None
    usage: str | None = None
    features: list[str] | None = None
    applications: list[str] | None = None


class ProductOut(ProductBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    total: int
    items: list[ProductOut]
