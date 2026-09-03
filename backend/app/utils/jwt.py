"""
JWT creation/decoding utilities.

Tokens are signed with the algorithm/secret from `Settings`
(`JWT_SECRET_KEY` / `JWT_ALGORITHM` in `.env`) — never hard-coded here.
Each token embeds the authenticated user's id (`sub`), `email` and `role`
so protected-route dependencies can authorize requests directly from the
token, re-validating against the database in `get_current_user`.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from jwt import PyJWTError

from app.config import settings


class TokenError(Exception):
    """Raised when a JWT is missing, malformed, expired, or otherwise
    invalid."""


def create_access_token(*, user_id: uuid.UUID, email: str, role: str) -> str:
    """Create a signed JWT access token identifying a user and their role."""
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": now,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT, returning its payload.

    Raises `TokenError` for any expired/invalid/malformed token or a
    token missing the required `sub`/`role` claims.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except PyJWTError as exc:
        raise TokenError(str(exc)) from exc

    if "sub" not in payload or "role" not in payload:
        raise TokenError("Token payload is missing required claims")

    return payload
