"""
ContactMessage model — stores enquiries submitted via the Customer
website's Contact page (POST /api/contact).

Follows the project's existing UUID primary key + timezone-aware
created_at/updated_at conventions (see app.models.order.Order).
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class ContactMessageStatus(str, enum.Enum):
    NEW = "New"
    READ = "Read"
    REPLIED = "Replied"


_enum_values = lambda enum_cls: [member.value for member in enum_cls]  # noqa: E731


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ContactMessageStatus] = mapped_column(
        SAEnum(ContactMessageStatus, name="contact_message_status", values_callable=_enum_values),
        default=ContactMessageStatus.NEW,
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
