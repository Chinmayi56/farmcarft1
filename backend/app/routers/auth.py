"""
Authentication routes (Backend Step 4):

- POST /api/auth/admin/login
- POST /api/auth/customer/send-otp
- POST /api/auth/customer/verify-otp
- GET  /api/auth/me
- POST /api/auth/logout
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.auth import (
    AdminLoginRequest,
    MessageResponse,
    SendOtpRequest,
    TokenResponse,
    UserOut,
    VerifyOtpRequest,
)
from app.services import auth_service
from app.utils.dependencies import get_current_user
from app.utils.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/admin/login", response_model=TokenResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Admin login with email + password. Returns a JWT on success."""
    try:
        user = auth_service.authenticate_admin(db, payload.email, payload.password)
    except auth_service.AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    token = create_access_token(user_id=user.id, email=user.email, role=user.role.value)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/customer/send-otp", response_model=MessageResponse)
def customer_send_otp(payload: SendOtpRequest, db: Session = Depends(get_db)) -> MessageResponse:
    """Request a demo OTP for a Customer email. The OTP itself is never
    returned here — for this demo it is always `1234`."""
    auth_service.send_customer_otp(db, payload.email)
    return MessageResponse(message="OTP sent. Please check and enter the 4-digit code.")


@router.post("/customer/verify-otp", response_model=TokenResponse)
def customer_verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Verify a Customer OTP. Authenticates (creating the account if
    needed) and returns a JWT on success."""
    try:
        user = auth_service.verify_customer_otp(db, payload.email, payload.otp)
    except auth_service.AuthError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    token = create_access_token(user_id=user.id, email=user.email, role=user.role.value)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)) -> UserOut:
    """Return the authenticated user's basic info from the JWT/database."""
    return UserOut.model_validate(current_user)


@router.post("/logout", response_model=MessageResponse)
def logout() -> MessageResponse:
    """Logout endpoint for frontend session compatibility.

    JWTs are stateless and short-lived by design (no server-side token
    store/blacklist is introduced in this step), so logging out is
    primarily a client-side action: the frontend discards its stored
    token/session after calling this endpoint.
    """
    return MessageResponse(message="Logged out successfully")
