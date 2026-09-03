"""
Authentication business logic: Admin login and the Customer demo OTP
flow. Kept separate from the router so it is independently testable and
reusable by future protected routes.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.models.otp import OTP
from app.models.user import User, UserRole
from app.utils.security import hash_secret, verify_secret


class AuthError(Exception):
    """Raised for any authentication/authorization failure. The message is
    safe to surface directly to API callers."""


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.strip().lower()).first()


def authenticate_admin(db: Session, email: str, password: str) -> User:
    """Validate Admin email + password credentials.

    Uses a deliberately generic error message for both "no such user" and
    "wrong password" so the API never confirms whether an email is
    registered.
    """
    user = get_user_by_email(db, email)
    if not user or user.role != UserRole.ADMIN or not user.password_hash:
        raise AuthError("Invalid email or password")

    if not verify_secret(password, user.password_hash):
        raise AuthError("Invalid email or password")

    if not user.is_active:
        raise AuthError("This account has been disabled")

    return user


def send_customer_otp(db: Session, email: str) -> None:
    """Create (and store, hashed) a demo OTP for the given email.

    Demo implementation: the OTP is always `settings.otp_demo_code`
    ("1234"), and it is never sent via email/SMS or returned in the API
    response — the caller is expected to already know the demo code.
    """
    email = email.strip().lower()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)

    otp = OTP(
        email=email,
        otp_hash=hash_secret(settings.otp_demo_code),
        expires_at=expires_at,
    )
    db.add(otp)
    db.commit()


def verify_customer_otp(db: Session, email: str, otp_code: str) -> User:
    """Verify the most recent unused OTP for `email`.

    On success, authenticates the existing Customer account or creates a
    new one (customers self-register implicitly via OTP verification).
    Raises `AuthError` for a missing/incorrect/expired/exhausted OTP.
    """
    email = email.strip().lower()

    otp = (
        db.query(OTP)
        .filter(OTP.email == email, OTP.is_used.is_(False))
        .order_by(OTP.created_at.desc())
        .first()
    )
    if not otp:
        raise AuthError("No OTP request found for this email. Please request a new OTP.")

    if otp.attempts >= settings.otp_max_attempts:
        raise AuthError("Too many incorrect attempts. Please request a new OTP.")

    expires_at = otp.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise AuthError("OTP has expired. Please request a new one.")

    if not verify_secret(otp_code, otp.otp_hash):
        otp.attempts += 1
        db.commit()
        raise AuthError("Incorrect OTP")

    otp.is_used = True
    db.commit()

    user = get_user_by_email(db, email)
    if user is None:
        user = User(email=email, role=UserRole.CUSTOMER, password_hash=None)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.role != UserRole.CUSTOMER:
        raise AuthError("This email is registered as an Admin account")
    elif not user.is_active:
        raise AuthError("This account has been disabled")

    return user
