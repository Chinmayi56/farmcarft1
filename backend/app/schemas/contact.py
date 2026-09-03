import re
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.contact import ContactMessageStatus

# Loosely validates a phone number: digits, spaces, +, -, ( ) — at least
# 7 digits total. Intentionally permissive since customers may enter
# numbers in several formats (with/without country code, spacing, etc.).
_PHONE_DIGITS_RE = re.compile(r"\d")


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=30)
    message: str = Field(min_length=1, max_length=2000)

    @field_validator("name")
    @classmethod
    def _name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name is required.")
        return v

    @field_validator("phone")
    @classmethod
    def _phone_has_enough_digits(cls, v: str) -> str:
        v = v.strip()
        digits = _PHONE_DIGITS_RE.findall(v)
        if len(digits) < 7:
            raise ValueError("Enter a valid phone number.")
        return v

    @field_validator("message")
    @classmethod
    def _message_reasonable_length(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Message is too short.")
        if len(v) > 2000:
            raise ValueError("Message is too long.")
        return v


class ContactOut(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    phone: str
    message: str
    status: ContactMessageStatus
    created_at: datetime
    updated_at: datetime
    # Not a database column — set by the router only on the POST /contact
    # response, so the Customer frontend can tell the difference between
    # "stored, and the email notification went out" and "stored, but the
    # email notification could not be sent" without ever seeing an SMTP
    # error. Left as None (omitted from the meaningful payload) on every
    # other response (GET/PATCH) since those don't attempt to send email.
    email_sent: Optional[bool] = None
    model_config = {"from_attributes": True}


class ContactStatusUpdate(BaseModel):
    """Body for PATCH /api/admin/contact-messages/{id} — updates only the
    enquiry's status. Pydantic/FastAPI will already reject any value that
    isn't one of NEW/READ/REPLIED with a 422, so no extra validation is
    needed here."""

    status: ContactMessageStatus
