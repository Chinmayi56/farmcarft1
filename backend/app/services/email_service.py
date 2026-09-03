"""
Minimal SMTP email service for outbound notifications (currently: new
Contact enquiry alerts to the company inbox).

Design notes:
- Uses Python's stdlib `smtplib`/`email` — no extra dependency needed.
- Reads all connection details (host/port/username/password/from) from
  `app.config.settings`, which in turn sources them from environment
  variables. SMTP_PASSWORD has no hard-coded default and is never
  exposed to any frontend.
- Sending is best-effort: if SMTP is not configured (no username/
  password set) or the send fails for any reason, this logs a warning
  and returns False instead of raising — a contact enquiry must still
  be saved to the database even if email delivery is unavailable.
"""
import logging
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Optional

from app.config import settings

logger = logging.getLogger("app.email")


def is_smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_username and settings.smtp_password)


def send_contact_notification(
    *,
    name: str,
    email: str,
    phone: str,
    message: str,
    submitted_at: Optional[datetime] = None,
) -> bool:
    """Send a best-effort email notification for a new contact enquiry.

    Returns True if the email was sent, False otherwise (including when
    SMTP is not configured). Never raises — a failure here must not
    break the POST /api/contact request, since the enquiry is already
    safely stored in PostgreSQL before this is called.
    """
    if not is_smtp_configured():
        logger.info("SMTP not configured — skipping contact notification email.")
        return False

    recipient = settings.contact_recipient_email or settings.smtp_from_email
    if not recipient:
        logger.warning("No contact recipient email configured — skipping notification email.")
        return False

    when = submitted_at or datetime.now(timezone.utc)

    msg = EmailMessage()
    msg["Subject"] = "Farm Craft Contact Enquiry"
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = recipient
    if email:
        msg["Reply-To"] = email
    msg.set_content(
        "Farm Craft Contact Enquiry\n\n"
        f"Customer Name:\n{name}\n\n"
        f"Customer Email:\n{email}\n\n"
        f"Customer Phone:\n{phone}\n\n"
        f"Message:\n{message}\n\n"
        f"Date/Time:\n{when.strftime('%d %b %Y, %I:%M %p %Z')}\n"
    )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            if settings.smtp_use_tls:
                server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
        return True
    except Exception:  # noqa: BLE001 — best-effort notification, never break the request
        logger.exception("Failed to send contact notification email.")
        return False
