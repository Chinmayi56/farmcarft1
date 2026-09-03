"""
Tests for Backend Step 4 — Authentication.

These tests run against the real PostgreSQL database configured via
`.env` (same as the rest of the suite) and assume the Alembic migrations
have already been applied — in particular that the seed migration has
created the demo Admin account (admin@farmcraft.com / admin123).

Any Customer users / OTPs created during the tests are cleaned up
afterwards so the suite is repeatable and does not pollute the database.
"""
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import text

from app.config import settings
from app.database.connection import get_db_context
from app.models.otp import OTP
from app.models.user import User, UserRole
from app.utils.jwt import create_access_token
from app.utils.security import hash_secret

DEMO_ADMIN_EMAIL = settings.demo_admin_email
DEMO_ADMIN_PASSWORD = settings.demo_admin_password

TEST_CUSTOMER_EMAIL = "otp-test-customer@farmcraft.com"


@pytest.fixture(autouse=True)
def _cleanup_test_data():
    """Remove any OTPs/Customer users created by these tests, leaving the
    seeded demo Admin account and any pre-existing data untouched."""
    yield
    with get_db_context() as db:
        db.query(OTP).filter(OTP.email == TEST_CUSTOMER_EMAIL).delete()
        db.query(User).filter(
            User.email == TEST_CUSTOMER_EMAIL, User.role == UserRole.CUSTOMER
        ).delete()
        db.commit()


# --- Admin login -----------------------------------------------------------


def test_admin_login_success(client):
    response = client.post(
        "/api/auth/admin/login",
        json={"email": DEMO_ADMIN_EMAIL, "password": DEMO_ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == DEMO_ADMIN_EMAIL
    assert body["user"]["role"] == "ADMIN"
    # Never leak the password/hash back to the client.
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


def test_admin_login_incorrect_password(client):
    response = client.post(
        "/api/auth/admin/login",
        json={"email": DEMO_ADMIN_EMAIL, "password": "definitely-wrong"},
    )
    assert response.status_code == 401
    assert "access_token" not in response.json()


def test_admin_login_unknown_email(client):
    response = client.post(
        "/api/auth/admin/login",
        json={"email": "nobody@farmcraft.com", "password": "whatever123"},
    )
    assert response.status_code == 401


def test_admin_login_rejects_customer_credentials(client):
    """A Customer account (no password) must not be able to use the Admin
    login endpoint even if somehow submitted."""
    with get_db_context() as db:
        db.add(User(email=TEST_CUSTOMER_EMAIL, role=UserRole.CUSTOMER, password_hash=None))
        db.commit()

    response = client.post(
        "/api/auth/admin/login",
        json={"email": TEST_CUSTOMER_EMAIL, "password": "anything"},
    )
    assert response.status_code == 401


# --- Customer OTP flow -------------------------------------------------------


def test_customer_send_otp(client):
    response = client.post(
        "/api/auth/customer/send-otp", json={"email": TEST_CUSTOMER_EMAIL}
    )
    assert response.status_code == 200
    body = response.json()
    assert "message" in body
    # The OTP value itself must never be returned in the response.
    assert "1234" not in response.text
    assert "otp" not in body

    with get_db_context() as db:
        otp = (
            db.query(OTP)
            .filter(OTP.email == TEST_CUSTOMER_EMAIL)
            .order_by(OTP.created_at.desc())
            .first()
        )
        assert otp is not None
        assert otp.otp_hash != "1234"  # stored hashed, not plain text
        assert otp.is_used is False


def test_customer_verify_otp_correct(client):
    client.post("/api/auth/customer/send-otp", json={"email": TEST_CUSTOMER_EMAIL})

    response = client.post(
        "/api/auth/customer/verify-otp",
        json={"email": TEST_CUSTOMER_EMAIL, "otp": "1234"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["user"]["email"] == TEST_CUSTOMER_EMAIL
    assert body["user"]["role"] == "CUSTOMER"

    with get_db_context() as db:
        user = db.query(User).filter(User.email == TEST_CUSTOMER_EMAIL).first()
        assert user is not None
        assert user.password_hash is None


def test_customer_verify_otp_incorrect(client):
    client.post("/api/auth/customer/send-otp", json={"email": TEST_CUSTOMER_EMAIL})

    response = client.post(
        "/api/auth/customer/verify-otp",
        json={"email": TEST_CUSTOMER_EMAIL, "otp": "0000"},
    )
    assert response.status_code == 400
    assert "access_token" not in response.json()


def test_customer_verify_otp_expired(client):
    """Manually store an already-expired OTP and confirm it is rejected."""
    with get_db_context() as db:
        expired = OTP(
            email=TEST_CUSTOMER_EMAIL,
            otp_hash=hash_secret("1234"),
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        )
        db.add(expired)
        db.commit()

    response = client.post(
        "/api/auth/customer/verify-otp",
        json={"email": TEST_CUSTOMER_EMAIL, "otp": "1234"},
    )
    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()


def test_customer_verify_otp_without_request(client):
    response = client.post(
        "/api/auth/customer/verify-otp",
        json={"email": "never-requested@farmcraft.com", "otp": "1234"},
    )
    assert response.status_code == 400


# --- JWT / current user -----------------------------------------------------


def test_me_requires_authentication(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_rejects_garbage_token(client):
    response = client.get(
        "/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401


def test_me_returns_current_admin(client):
    login = client.post(
        "/api/auth/admin/login",
        json={"email": DEMO_ADMIN_EMAIL, "password": DEMO_ADMIN_PASSWORD},
    )
    token = login.json()["access_token"]

    response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == DEMO_ADMIN_EMAIL
    assert body["role"] == "ADMIN"


def test_jwt_contains_expected_claims():
    with get_db_context() as db:
        admin = db.query(User).filter(User.email == DEMO_ADMIN_EMAIL).first()
    assert admin is not None

    import jwt as pyjwt

    token = create_access_token(user_id=admin.id, email=admin.email, role=admin.role.value)
    payload = pyjwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])

    assert payload["sub"] == str(admin.id)
    assert payload["email"] == admin.email
    assert payload["role"] == "ADMIN"
    assert "exp" in payload


# --- Logout ------------------------------------------------------------------


def test_logout(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"]


# --- Role protection ---------------------------------------------------------


def test_admin_only_route_rejects_customer_token(client):
    """Exercise the `require_admin` dependency by mounting a throwaway
    admin-only route and confirming a Customer token is rejected."""
    from fastapi import Depends

    from app.main import app
    from app.utils.dependencies import require_admin

    @app.get("/api/_test/admin-only")
    def _admin_only(user=Depends(require_admin)):
        return {"ok": True, "email": user.email}

    try:
        # Get a customer token.
        client.post("/api/auth/customer/send-otp", json={"email": TEST_CUSTOMER_EMAIL})
        customer_login = client.post(
            "/api/auth/customer/verify-otp",
            json={"email": TEST_CUSTOMER_EMAIL, "otp": "1234"},
        )
        customer_token = customer_login.json()["access_token"]

        response = client.get(
            "/api/_test/admin-only",
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        assert response.status_code == 403

        admin_login = client.post(
            "/api/auth/admin/login",
            json={"email": DEMO_ADMIN_EMAIL, "password": DEMO_ADMIN_PASSWORD},
        )
        admin_token = admin_login.json()["access_token"]

        response = client.get(
            "/api/_test/admin-only",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
    finally:
        app.router.routes = [
            r for r in app.router.routes if getattr(r, "path", None) != "/api/_test/admin-only"
        ]


def test_customer_only_route_rejects_admin_token(client):
    from fastapi import Depends

    from app.main import app
    from app.utils.dependencies import require_customer

    @app.get("/api/_test/customer-only")
    def _customer_only(user=Depends(require_customer)):
        return {"ok": True, "email": user.email}

    try:
        admin_login = client.post(
            "/api/auth/admin/login",
            json={"email": DEMO_ADMIN_EMAIL, "password": DEMO_ADMIN_PASSWORD},
        )
        admin_token = admin_login.json()["access_token"]

        response = client.get(
            "/api/_test/customer-only",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 403
    finally:
        app.router.routes = [
            r
            for r in app.router.routes
            if getattr(r, "path", None) != "/api/_test/customer-only"
        ]
