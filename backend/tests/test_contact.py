"""
Tests for Prompt 2 — Contact Messages / Customer Enquiries.

These tests run against the real PostgreSQL database configured via
`.env` (same as the rest of the suite) and assume the Alembic migrations
have already been applied — in particular that the seed migration has
created the demo Admin account (admin@farmcraft.com / admin123) and the
`contact_messages` table (status enum: New / Read / Replied) exists.

Any ContactMessage rows created during the tests are cleaned up
afterwards so the suite is repeatable and does not pollute the database.
"""
import uuid

import pytest

from app.config import settings
from app.database.connection import get_db_context
from app.models.contact import ContactMessage
from app.models.user import User, UserRole

DEMO_ADMIN_EMAIL = settings.demo_admin_email
DEMO_ADMIN_PASSWORD = settings.demo_admin_password

TEST_CUSTOMER_EMAIL = "contact-test-customer@farmcraft.com"

TEST_ENQUIRY_EMAIL = "test-enquiry@example.com"


def _sample_payload(**overrides) -> dict:
    payload = {
        "name": "Test Customer",
        "email": TEST_ENQUIRY_EMAIL,
        "phone": "+91 98765 43210",
        "message": "I would like to know more about your grain transfer pipes.",
    }
    payload.update(overrides)
    return payload


@pytest.fixture(autouse=True)
def _cleanup_test_data():
    """Remove any ContactMessages/Customer users created by these tests."""
    yield
    with get_db_context() as db:
        db.query(ContactMessage).filter(ContactMessage.email == TEST_ENQUIRY_EMAIL).delete(
            synchronize_session=False
        )
        db.query(User).filter(
            User.email == TEST_CUSTOMER_EMAIL, User.role == UserRole.CUSTOMER
        ).delete()
        db.commit()


@pytest.fixture()
def admin_token(client) -> str:
    response = client.post(
        "/api/auth/admin/login",
        json={"email": DEMO_ADMIN_EMAIL, "password": DEMO_ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture()
def customer_token(client) -> str:
    client.post("/api/auth/customer/send-otp", json={"email": TEST_CUSTOMER_EMAIL})
    response = client.post(
        "/api/auth/customer/verify-otp",
        json={"email": TEST_CUSTOMER_EMAIL, "otp": "1234"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# --- POST /api/contact (public) --------------------------------------------


def test_submit_contact_message_success(client):
    response = client.post("/api/contact", json=_sample_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Test Customer"
    assert body["email"] == TEST_ENQUIRY_EMAIL
    assert body["status"] == "New"
    # SMTP is not configured in this environment, so email_sent must be
    # truthfully reported as False — never claim success it didn't achieve.
    assert body["email_sent"] is False


def test_submit_contact_message_missing_fields_rejected(client):
    response = client.post("/api/contact", json={"name": "", "email": "not-an-email"})
    assert response.status_code == 422


def test_submit_contact_message_invalid_email_rejected(client):
    response = client.post("/api/contact", json=_sample_payload(email="not-an-email"))
    assert response.status_code == 422


def test_submit_contact_message_short_message_rejected(client):
    response = client.post("/api/contact", json=_sample_payload(message="hi"))
    assert response.status_code == 422


# --- Admin authorization ----------------------------------------------------


def test_list_contact_messages_requires_auth(client):
    response = client.get("/api/admin/contact-messages")
    assert response.status_code == 401


def test_list_contact_messages_rejects_customer(client, customer_token):
    response = client.get(
        "/api/admin/contact-messages", headers=_auth_headers(customer_token)
    )
    assert response.status_code == 403


def test_get_contact_message_rejects_customer(client, customer_token):
    response = client.get(
        f"/api/admin/contact-messages/{uuid.uuid4()}",
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 403


def test_patch_contact_message_rejects_customer(client, customer_token):
    response = client.patch(
        f"/api/admin/contact-messages/{uuid.uuid4()}",
        json={"status": "Read"},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 403


# --- Admin retrieval / status update -----------------------------------


def test_admin_can_list_and_retrieve_contact_message(client, admin_token):
    created = client.post("/api/contact", json=_sample_payload()).json()

    list_response = client.get(
        "/api/admin/contact-messages", headers=_auth_headers(admin_token)
    )
    assert list_response.status_code == 200
    assert any(m["id"] == created["id"] for m in list_response.json())

    detail_response = client.get(
        f"/api/admin/contact-messages/{created['id']}",
        headers=_auth_headers(admin_token),
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["email"] == TEST_ENQUIRY_EMAIL


def test_get_contact_message_not_found(client, admin_token):
    response = client.get(
        f"/api/admin/contact-messages/{uuid.uuid4()}",
        headers=_auth_headers(admin_token),
    )
    assert response.status_code == 404


def test_admin_can_update_contact_message_status(client, admin_token):
    created = client.post("/api/contact", json=_sample_payload()).json()

    read_response = client.patch(
        f"/api/admin/contact-messages/{created['id']}",
        json={"status": "Read"},
        headers=_auth_headers(admin_token),
    )
    assert read_response.status_code == 200
    assert read_response.json()["status"] == "Read"

    replied_response = client.patch(
        f"/api/admin/contact-messages/{created['id']}",
        json={"status": "Replied"},
        headers=_auth_headers(admin_token),
    )
    assert replied_response.status_code == 200
    assert replied_response.json()["status"] == "Replied"


def test_update_contact_message_invalid_status_rejected(client, admin_token):
    created = client.post("/api/contact", json=_sample_payload()).json()

    response = client.patch(
        f"/api/admin/contact-messages/{created['id']}",
        json={"status": "Resolved"},  # no longer a valid status (Prompt 2)
        headers=_auth_headers(admin_token),
    )
    assert response.status_code == 422


def test_update_contact_message_not_found(client, admin_token):
    response = client.patch(
        f"/api/admin/contact-messages/{uuid.uuid4()}",
        json={"status": "Read"},
        headers=_auth_headers(admin_token),
    )
    assert response.status_code == 404
