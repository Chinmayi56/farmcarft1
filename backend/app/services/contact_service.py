import uuid

from sqlalchemy.orm import Session

from app.models.contact import ContactMessage, ContactMessageStatus
from app.schemas.contact import ContactCreate
from app.services.email_service import send_contact_notification


def create_contact_message(db: Session, data: ContactCreate) -> tuple[ContactMessage, bool]:
    """Store a new contact enquiry, then best-effort send an email
    notification. Email delivery failure never rolls back or blocks the
    stored record — the enquiry in PostgreSQL is the source of truth.

    Returns (record, email_sent) so the router can tell the Customer
    whether the notification actually went out, without ever exposing
    SMTP internals.
    """
    record = ContactMessage(
        name=data.name,
        email=str(data.email),
        phone=data.phone,
        message=data.message,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    email_sent = send_contact_notification(
        name=record.name,
        email=record.email,
        phone=record.phone,
        message=record.message,
        submitted_at=record.created_at,
    )

    return record, email_sent


def list_contact_messages(db: Session) -> list[ContactMessage]:
    return db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()


def get_contact_message(db: Session, message_id: uuid.UUID) -> ContactMessage | None:
    return db.get(ContactMessage, message_id)


def update_contact_message_status(
    db: Session, message: ContactMessage, new_status: ContactMessageStatus
) -> ContactMessage:
    message.status = new_status
    db.commit()
    db.refresh(message)
    return message
