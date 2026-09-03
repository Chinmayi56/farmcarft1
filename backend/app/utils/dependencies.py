"""
Reusable FastAPI authentication/authorization dependencies.

Any future route (Products, Orders, Cart, Wishlist, Stock, Reports, ...)
can lock itself down with one of:

    Depends(get_current_user)   -> any authenticated user (Admin or Customer)
    Depends(require_admin)      -> ADMIN role only
    Depends(require_customer)   -> CUSTOMER role only

All three resolve the bearer token from the `Authorization: Bearer <jwt>`
header, decode/validate the JWT, then load the corresponding user row from
the database (rejecting inactive/missing users) so authorization always
reflects the user's *current* state, not just what was true when the
token was issued.
"""
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.utils.jwt import TokenError, decode_access_token

_bearer_scheme = HTTPBearer(auto_error=False)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the request's bearer JWT."""
    if credentials is None or not credentials.credentials:
        raise _CREDENTIALS_EXCEPTION

    try:
        payload = decode_access_token(credentials.credentials)
    except TokenError:
        raise _CREDENTIALS_EXCEPTION

    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError, TypeError):
        raise _CREDENTIALS_EXCEPTION

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise _CREDENTIALS_EXCEPTION

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency for routes restricted to ADMIN users."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_customer(current_user: User = Depends(get_current_user)) -> User:
    """Dependency for routes restricted to CUSTOMER users."""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required",
        )
    return current_user
