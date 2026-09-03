import enum, uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

# NOTE ON ENUM VALUES vs POSTGRES:
# SQLAlchemy's `Enum` type, when built from a Python `enum.Enum` class,
# binds/reads rows using the enum MEMBER NAME (e.g. "PENDING",
# "CASH_ON_DELIVERY") by default -- NOT the member's `.value` -- unless
# `values_callable` is explicitly supplied to tell it to use `.value`
# instead. The PostgreSQL native enum types created by the Alembic
# migrations (see alembic/versions/d4f2c6b8a101_add_orders_cart_stock.py
# and b7c1e4a9d602_add_order_method.py) only contain the `.value` labels
# ('Pending', 'Cash on Delivery', 'delivery', 'visit_company', ...), not
# the Python member names. Every enum column below MUST therefore pass
# `values_callable=lambda enum_cls: [member.value for member in enum_cls]`
# -- exactly like `app.models.product.ProductStatus` already does --
# or every INSERT/UPDATE touching that column raises a PostgreSQL
# `invalid input value for enum ...` error (surfaced to the client as an
# unhandled 500).
class OrderStatus(str, enum.Enum):
    PENDING='Pending'; CONFIRMED='Confirmed'; PROCESSING='Processing'; DISPATCHED='Dispatched'; DELIVERED='Delivered'; CANCELLED='Cancelled'
class PaymentMethod(str, enum.Enum): CASH_ON_DELIVERY='Cash on Delivery'
class PaymentStatus(str, enum.Enum): PENDING='Pending'; PAID='Paid'; REFUNDED='Refunded'
class OrderMethod(str, enum.Enum):
    """How the customer chooses to complete the order: standard delivery
    (paid Cash on Delivery) or an in-person visit to the company. This is
    independent of `PaymentMethod` — it is NOT an online payment method,
    and no payment gateway is involved for either value."""
    DELIVERY='delivery'; VISIT_COMPANY='visit_company'

_enum_values = lambda enum_cls: [member.value for member in enum_cls]

class Cart(Base):
    __tablename__='carts'
    id: Mapped[uuid.UUID]=mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID]=mapped_column(PG_UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=lambda:datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=lambda:datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc), nullable=False)
    items=relationship('CartItem', back_populates='cart', cascade='all, delete-orphan')

class CartItem(Base):
    __tablename__='cart_items'
    id: Mapped[uuid.UUID]=mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id: Mapped[uuid.UUID]=mapped_column(PG_UUID(as_uuid=True), ForeignKey('carts.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id: Mapped[uuid.UUID]=mapped_column(PG_UUID(as_uuid=True), ForeignKey('products.id', ondelete='RESTRICT'), nullable=False, index=True)
    quantity: Mapped[int]=mapped_column(Integer, nullable=False)
    cart=relationship('Cart', back_populates='items')
    product=relationship('Product')

class Order(Base):
    __tablename__='orders'
    id: Mapped[uuid.UUID]=mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number: Mapped[str]=mapped_column(String(40), unique=True, nullable=False, index=True)
    purchase_code: Mapped[str]=mapped_column(String(40), unique=True, nullable=False, index=True)
    customer_id: Mapped[uuid.UUID]=mapped_column(PG_UUID(as_uuid=True), ForeignKey('users.id', ondelete='RESTRICT'), nullable=False, index=True)
    status: Mapped[OrderStatus]=mapped_column(SAEnum(OrderStatus,name='order_status',values_callable=_enum_values), default=OrderStatus.PENDING, nullable=False, index=True)
    order_method: Mapped[OrderMethod]=mapped_column(SAEnum(OrderMethod,name='order_method',values_callable=_enum_values), default=OrderMethod.DELIVERY, nullable=False)
    payment_method: Mapped[PaymentMethod]=mapped_column(SAEnum(PaymentMethod,name='payment_method',values_callable=_enum_values), default=PaymentMethod.CASH_ON_DELIVERY, nullable=False)
    payment_status: Mapped[PaymentStatus]=mapped_column(SAEnum(PaymentStatus,name='payment_status',values_callable=_enum_values), default=PaymentStatus.PENDING, nullable=False)
    total_amount: Mapped[Decimal]=mapped_column(Numeric(12,2), nullable=False)
    shipping_address: Mapped[dict]=mapped_column(JSONB, nullable=False)
    customer_snapshot: Mapped[dict]=mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=lambda:datetime.now(timezone.utc), nullable=False, index=True)
    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=lambda:datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc), nullable=False)
    items=relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')

class OrderItem(Base):
    __tablename__='order_items'
    id: Mapped[uuid.UUID]=mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID]=mapped_column(PG_UUID(as_uuid=True), ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id: Mapped[uuid.UUID]=mapped_column(PG_UUID(as_uuid=True), ForeignKey('products.id', ondelete='RESTRICT'), nullable=False)
    product_name: Mapped[str]=mapped_column(String(255), nullable=False)
    sku: Mapped[str]=mapped_column(String(100), nullable=False)
    quantity: Mapped[int]=mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal]=mapped_column(Numeric(12,2), nullable=False)
    subtotal: Mapped[Decimal]=mapped_column(Numeric(12,2), nullable=False)
    configuration: Mapped[str|None]=mapped_column(Text, nullable=True)
    order=relationship('Order', back_populates='items')
