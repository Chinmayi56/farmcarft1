"""
Product model (Backend Step 5A).

Mirrors the fields already used by the Admin frontend's product form/type
(`admin/src/components/products/ProductForm.tsx`,
`admin/src/types/index.ts`): core listing fields (name, category, sku,
price, discountPrice, stock, description, image(s)) plus the optional
agricultural-machinery specification fields (motor, capacity, length,
height, pipeMaterial, screwMaterial, usage, features, applications).

Only the Product entity itself is introduced in this step — Cart, Orders,
Stock Management, Reports, and Notifications are explicitly out of scope
and are NOT modeled here (e.g. no low-stock `threshold` / stock-history
fields, which belong to a later Stock Management step).
"""
import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class ProductStatus(str, enum.Enum):
    """Values MUST match the PostgreSQL `product_status` enum exactly
    (lowercase, matching what's actually stored in the database — see
    alembic/versions/f1a6c8e2b933_normalize_product_status_enum.py). Do
    NOT reintroduce Title Case values here without also migrating the
    database enum; app values and DB enum values must always match."""

    ACTIVE = "active"
    DRAFT = "draft"
    OUT_OF_STOCK = "out of stock"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # --- Core listing fields ---
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    stock: Mapped[int] = mapped_column(nullable=False, default=0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ProductStatus] = mapped_column(
        SAEnum(
            ProductStatus,
            name="product_status",
            native_enum=True,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=ProductStatus.ACTIVE,
    )

    # --- Images ---
    image: Mapped[str | None] = mapped_column(Text, nullable=True)
    images: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)

    # --- Optional technical specifications (agricultural machinery) ---
    motor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    capacity: Mapped[str | None] = mapped_column(String(255), nullable=True)
    length: Mapped[str | None] = mapped_column(String(255), nullable=True)
    height: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pipe_material: Mapped[str | None] = mapped_column(String(255), nullable=True)
    screw_material: Mapped[str | None] = mapped_column(String(255), nullable=True)
    usage: Mapped[str | None] = mapped_column(Text, nullable=True)
    features: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    applications: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)

    # --- Bookkeeping ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<Product id={self.id} sku={self.sku!r} name={self.name!r}>"
