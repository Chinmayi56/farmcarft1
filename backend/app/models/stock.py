import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base
class StockMovement(Base):
    __tablename__='stock_movements'
    id: Mapped[uuid.UUID]=mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID]=mapped_column(PG_UUID(as_uuid=True), ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True)
    quantity_change: Mapped[int]=mapped_column(Integer, nullable=False)
    reason: Mapped[str]=mapped_column(String(100), nullable=False)
    reference_id: Mapped[str|None]=mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=lambda:datetime.now(timezone.utc), nullable=False)
