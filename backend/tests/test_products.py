"""
Tests for Backend Step 5A — Product Model + CRUD APIs.

These tests run against the real PostgreSQL database configured via
`.env` (same as `test_auth.py`) and assume Alembic migrations have
already been applied (in particular the seed migration that creates the
demo Admin account, and the `add products table` migration).

Any products created during the tests are cleaned up afterwards so the
suite is repeatable and does not pollute the database.
"""
import uuid

import pytest

from app.config import settings
from app.database.connection import get_db_context
from app.models.product import Product
from app.models.user import User, UserRole

DEMO_ADMIN_EMAIL = settings.demo_admin_email
DEMO_ADMIN_PASSWORD = settings.demo_admin_password

TEST_CUSTOMER_EMAIL = "product-test-customer@farmcraft.com"

SKU_PREFIX = "TEST-SKU-"


def _unique_sku() -> str:
    return f"{SKU_PREFIX}{uuid.uuid4().hex[:10]}"


def _sample_payload(**overrides) -> dict:
    payload = {
        "name": "Grain Transferring Pipe",
        "category": "Grain Transfer",
        "sku": _unique_sku(),
        "price": 25000,
        "discount_price": 21999,
        "stock": 15,
        "description": "Heavy-duty pipe for transferring grains.",
        "motor": "5 HP to 16 HP",
        "capacity": "18 tons per hour",
        "features": ["Heavy-duty grain transfer", "Long-distance transfer"],
        "applications": ["Rice", "Corn", "Wheat"],
    }
    payload.update(overrides)
    return payload


@pytest.fixture(autouse=True)
def _cleanup_test_data():
    """Remove any Products/Customer users created by these tests."""
    yield
    with get_db_context() as db:
        db.query(Product).filter(Product.sku.like(f"{SKU_PREFIX}%")).delete(
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


# --- Authentication / authorization ------------------------------------


def test_create_product_requires_authentication(client):
    response = client.post("/api/products", json=_sample_payload())
    assert response.status_code == 401


def test_create_product_rejects_customer(client, customer_token):
    response = client.post(
        "/api/products", json=_sample_payload(), headers=_auth_headers(customer_token)
    )
    assert response.status_code == 403


def test_update_product_rejects_customer(client, admin_token, customer_token):
    created = client.post(
        "/api/products", json=_sample_payload(), headers=_auth_headers(admin_token)
    ).json()

    response = client.put(
        f"/api/products/{created['id']}",
        json={"stock": 5},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 403


def test_delete_product_rejects_customer(client, admin_token, customer_token):
    created = client.post(
        "/api/products", json=_sample_payload(), headers=_auth_headers(admin_token)
    ).json()

    response = client.delete(
        f"/api/products/{created['id']}", headers=_auth_headers(customer_token)
    )
    assert response.status_code == 403


def test_list_products_is_public(client):
    """The customer storefront must be able to browse products without
    logging in — GET /api/products requires no authentication."""
    response = client.get("/api/products")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body


def test_get_product_by_id_is_public(client, admin_token):
    """GET /api/products/{id} must also be publicly readable."""
    created = client.post(
        "/api/products", json=_sample_payload(), headers=_auth_headers(admin_token)
    ).json()

    response = client.get(f"/api/products/{created['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


# --- CRUD happy path -----------------------------------------------------


def test_create_product_success(client, admin_token):
    payload = _sample_payload()
    response = client.post(
        "/api/products", json=payload, headers=_auth_headers(admin_token)
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == payload["name"]
    assert body["sku"] == payload["sku"]
    assert body["status"] == "active"
    assert "id" in body
    assert "created_at" in body


def test_create_product_duplicate_sku_rejected(client, admin_token):
    payload = _sample_payload()
    first = client.post(
        "/api/products", json=payload, headers=_auth_headers(admin_token)
    )
    assert first.status_code == 201

    second = client.post(
        "/api/products", json=payload, headers=_auth_headers(admin_token)
    )
    assert second.status_code == 409


def test_get_product_by_id(client, admin_token):
    created = client.post(
        "/api/products", json=_sample_payload(), headers=_auth_headers(admin_token)
    ).json()

    response = client.get(
        f"/api/products/{created['id']}", headers=_auth_headers(admin_token)
    )
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_product_not_found(client, admin_token):
    response = client.get(
        f"/api/products/{uuid.uuid4()}", headers=_auth_headers(admin_token)
    )
    assert response.status_code == 404


def test_list_products_includes_created(client, admin_token):
    created = client.post(
        "/api/products", json=_sample_payload(), headers=_auth_headers(admin_token)
    ).json()

    response = client.get(
        "/api/products",
        params={"search": created["sku"]},
        headers=_auth_headers(admin_token),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert any(item["id"] == created["id"] for item in body["items"])


def test_update_product_success(client, admin_token):
    created = client.post(
        "/api/products", json=_sample_payload(), headers=_auth_headers(admin_token)
    ).json()

    response = client.put(
        f"/api/products/{created['id']}",
        json={"stock": 42, "status": "draft"},
        headers=_auth_headers(admin_token),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["stock"] == 42
    assert body["status"] == "draft"
    # Untouched fields remain unchanged.
    assert body["name"] == created["name"]


def test_update_product_not_found(client, admin_token):
    response = client.put(
        f"/api/products/{uuid.uuid4()}",
        json={"stock": 1},
        headers=_auth_headers(admin_token),
    )
    assert response.status_code == 404


def test_delete_product_success(client, admin_token):
    created = client.post(
        "/api/products", json=_sample_payload(), headers=_auth_headers(admin_token)
    ).json()

    response = client.delete(
        f"/api/products/{created['id']}", headers=_auth_headers(admin_token)
    )
    assert response.status_code == 204

    follow_up = client.get(
        f"/api/products/{created['id']}", headers=_auth_headers(admin_token)
    )
    assert follow_up.status_code == 404


def test_delete_product_not_found(client, admin_token):
    response = client.delete(
        f"/api/products/{uuid.uuid4()}", headers=_auth_headers(admin_token)
    )
    assert response.status_code == 404


# --- Status values / public customer catalog filtering -------------------


def test_status_round_trips_as_lowercase_string(client, admin_token):
    """ProductOut must serialize status as the lowercase DB/enum value
    ("active"/"draft"/"out of stock"), never the Python enum member
    name ("ACTIVE"/"DRAFT"/"OUT_OF_STOCK")."""
    created = client.post(
        "/api/products",
        json=_sample_payload(status="out of stock"),
        headers=_auth_headers(admin_token),
    ).json()
    assert created["status"] == "out of stock"

    fetched = client.get(f"/api/products/{created['id']}").json()
    assert fetched["status"] == "out of stock"

    updated = client.put(
        f"/api/products/{created['id']}",
        json={"status": "draft"},
        headers=_auth_headers(admin_token),
    ).json()
    assert updated["status"] == "draft"


def test_active_products_listed_publicly_by_status_filter(client, admin_token):
    """The customer storefront request (?status=active) must return
    active products without authentication."""
    created = client.post(
        "/api/products",
        json=_sample_payload(status="active"),
        headers=_auth_headers(admin_token),
    ).json()

    response = client.get("/api/products", params={"status": "active"})
    assert response.status_code == 200
    body = response.json()
    assert any(item["id"] == created["id"] for item in body["items"])
    assert all(item["status"] == "active" for item in body["items"])


def test_draft_products_excluded_from_customer_catalog_request(client, admin_token):
    """Draft products must never appear in the ?status=active request the
    customer catalog uses, even though Admin can still see them."""
    created = client.post(
        "/api/products",
        json=_sample_payload(status="draft"),
        headers=_auth_headers(admin_token),
    ).json()

    customer_view = client.get("/api/products", params={"status": "active"}).json()
    assert not any(item["id"] == created["id"] for item in customer_view["items"])

    admin_view = client.get(
        "/api/products",
        params={"search": created["sku"]},
        headers=_auth_headers(admin_token),
    ).json()
    assert any(item["id"] == created["id"] for item in admin_view["items"])
