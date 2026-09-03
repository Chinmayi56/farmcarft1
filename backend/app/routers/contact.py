"""
Contact enquiry routes:

- POST   /api/contact                          PUBLIC — Customer contact form
- GET    /api/admin/contact-messages           ADMIN only — list enquiries
- GET    /api/admin/contact-messages/{id}      ADMIN only — one enquiry
- PATCH  /api/admin/contact-messages/{id}      ADMIN only — update status

The POST endpoint requires no authentication since the Customer contact
form is public. It never exposes internal errors — validation failures
return a safe 422/400 message and anything unexpected is logged
server-side and surfaced as a generic 500.

All /admin/contact-messages/* routes require a valid JWT AND the ADMIN
role via the existing `require_admin` dependency (same mechanism used by
Products/Orders/Stock/Reports) — no separate auth/JWT/role system is
introduced here.
"""
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.contact import ContactMessage
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactOut, ContactStatusUpdate
from app.services import contact_service
from app.utils.dependencies import require_admin

logger = logging.getLogger("app.routers.contact")

router = APIRouter(tags=["Contact"])


@router.post("/contact", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def submit_contact_message(payload: ContactCreate, db: Session = Depends(get_db)) -> ContactOut:
    try:
        record, email_sent = contact_service.create_contact_message(db, payload)
    except Exception:
        db.rollback()
        logger.exception("Failed to store contact enquiry.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="We couldn't send your enquiry right now. Please try again shortly.",
        )

    # The database record is the source of truth and is already safely
    # committed at this point regardless of email outcome. `email_sent`
    # lets the Customer frontend show a truthful, friendly message
    # instead of always claiming "email sent successfully".
    out = ContactOut.model_validate(record)
    out.email_sent = email_sent
    return out


@router.get("/admin/contact-messages", response_model=list[ContactOut])
def list_contact_messages(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ContactMessage]:
    return contact_service.list_contact_messages(db)


@router.get("/admin/contact-messages/{message_id}", response_model=ContactOut)
def get_contact_message(
    message_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ContactMessage:
    record = contact_service.get_contact_message(db, message_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact enquiry not found.",
        )
    return record


@router.patch("/admin/contact-messages/{message_id}", response_model=ContactOut)
def update_contact_message_status(
    message_id: uuid.UUID,
    payload: ContactStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ContactMessage:
    record = contact_service.get_contact_message(db, message_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact enquiry not found.",
        )
    try:
        return contact_service.update_contact_message_status(db, record, payload.status)
    except Exception:
        db.rollback()
        logger.exception("Failed to update contact enquiry status.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update the enquiry status right now. Please try again.",
        )
