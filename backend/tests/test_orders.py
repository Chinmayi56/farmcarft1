"""
Tests for the customer cart/checkout flow: product-status enforcement,
stock safety, price security, and Admin/Customer order synchronization.

Like test_products.py, these run against the real PostgreSQL database
configured via `.env` and assume Alembic migrations have already been
applied. Any products/orders/carts created by these tests are cleaned
up afterwards.
"""
import uuid

import pytest

from app.config import settings
from app.database.connection import get_db_context
from app.models.order import Order, Cart
from app.models.product import Product
from app.models.user import User, UserRole

DEMO_ADMIN_EMAIL = settings.demo_admin_email
DEMO_ADMIN_PASSWORD = settings.demo_admin_password

TEST_CUSTOMER_EMAIL = "order-test-customer@farmcraft.com"

SKU_PREFIX = "ORDER-TEST-SKU-"


def _unique_sku() -> str:
    return f"{SKU_PREFIX}{uuid.uuid4().hex[:10]}"


def _sample_payload(**overrides) -> dict:
    payload = {
        "name": "Order Test Pipe",
        "category": "Grain Transfer",
        "sku": _unique_sku(),
        "price": 1000,
        "stock": 10,
        "description": "Product created for order/cart backend tests.",
        "status": "active",
    }
    payload.update(overrides)
    return payload


@pytest.fixture(autouse=True)
def _cleanup_test_data():
    """Remove any Orders/Carts/Products/Customer users created by these
    tests. Orders/carts are deleted first since they reference products
    via a RESTRICT foreign key."""
    yield
    with get_db_context() as db:
        customer = (
            db.query(User)
            .filter(User.email == TEST_CUSTOMER_EMAIL, User.role == UserRole.CUSTOMER)
            .first()
        )
        if customer:
            db.query(Order).filter(Order.customer_id == customer.id).delete()
            db.query(Cart).filter(Cart.customer_id == customer.id).delete()
        db.query(Product).filter(Product.sku.like(f"{SKU_PREFIX}%")).delete(
            synchronize_session=False
        )
        if customer:
            db.delete(customer)
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


def _create_product(client, admin_token, **overrides) -> dict:
    response = client.post(
        "/api/products",
        json=_sample_payload(**overrides),
        headers=_auth_headers(admin_token),
    )
    assert response.status_code == 201
    return response.json()


def _set_product_status(client, admin_token, product_id, status_value):
    response = client.put(
        f"/api/products/{product_id}",
        json={"status": status_value},
        headers=_auth_headers(admin_token),
    )
    assert response.status_code == 200
    return response.json()


def _clear_cart(client, customer_token):
    client.delete("/api/cart", headers=_auth_headers(customer_token))


# --- 1-3: product status gates adding to cart ----------------------------


def test_active_product_can_be_added_to_cart(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active")
    _clear_cart(client, customer_token)

    response = client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 201
    body = response.json()
    assert any(i["product"]["id"] == product["id"] for i in body["items"])


def test_draft_product_cannot_be_added_to_cart(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="draft")
    _clear_cart(client, customer_token)

    response = client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 400


def test_out_of_stock_product_cannot_be_added_to_cart(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="out of stock")
    _clear_cart(client, customer_token)

    response = client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 400


# --- 4-5: product status gates updating cart items ------------------------


def test_draft_product_cannot_be_updated_in_cart(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active")
    _clear_cart(client, customer_token)
    added = client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    ).json()
    item_id = next(i["id"] for i in added["items"] if i["product"]["id"] == product["id"])

    _set_product_status(client, admin_token, product["id"], "draft")

    response = client.put(
        f"/api/cart/items/{item_id}",
        json={"quantity": 2},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 400


def test_out_of_stock_product_cannot_be_updated_in_cart(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active")
    _clear_cart(client, customer_token)
    added = client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    ).json()
    item_id = next(i["id"] for i in added["items"] if i["product"]["id"] == product["id"])

    _set_product_status(client, admin_token, product["id"], "out of stock")

    response = client.put(
        f"/api/cart/items/{item_id}",
        json={"quantity": 2},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 400


# --- 6-7: product status gates checkout, even if item was added while active --


def test_draft_product_cannot_be_purchased(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    _set_product_status(client, admin_token, product["id"], "draft")

    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 400


def test_out_of_stock_product_cannot_be_purchased(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    _set_product_status(client, admin_token, product["id"], "out of stock")

    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 400


# --- 8-12: stock safety ----------------------------------------------------


def test_active_product_purchased_with_sufficient_stock(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 2},
        headers=_auth_headers(customer_token),
    )

    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 201


def test_insufficient_stock_fails_checkout(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active", stock=1)
    _clear_cart(client, customer_token)
    # Add 1 (allowed), then admin reduces stock to 0 to force insufficient
    # stock at checkout time without bypassing the cart-add check.
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    client.put(
        f"/api/products/{product['id']}",
        json={"stock": 0},
        headers=_auth_headers(admin_token),
    )

    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 400


def test_stock_decreases_correctly_after_order(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active", stock=10)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 3},
        headers=_auth_headers(customer_token),
    )

    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 201

    refreshed = client.get(f"/api/products/{product['id']}").json()
    assert refreshed["stock"] == 7


def test_stock_cannot_become_negative(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active", stock=2)
    _clear_cart(client, customer_token)

    # Cart-add already rejects a quantity above stock.
    response = client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 3},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 400

    refreshed = client.get(f"/api/products/{product['id']}").json()
    assert refreshed["stock"] == 2


def test_failed_checkout_does_not_partially_decrease_stock(client, admin_token, customer_token):
    ok_product = _create_product(client, admin_token, status="active", stock=10)
    short_product = _create_product(client, admin_token, status="active", stock=1)
    _clear_cart(client, customer_token)

    client.post(
        "/api/cart/items",
        json={"product_id": ok_product["id"], "quantity": 2},
        headers=_auth_headers(customer_token),
    )
    client.post(
        "/api/cart/items",
        json={"product_id": short_product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    # Force the second item to fail stock validation at checkout time.
    client.put(
        f"/api/products/{short_product['id']}",
        json={"stock": 0},
        headers=_auth_headers(admin_token),
    )

    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 400

    ok_refreshed = client.get(f"/api/products/{ok_product['id']}").json()
    assert ok_refreshed["stock"] == 10  # untouched — no partial decrement


# --- 13-14: price security --------------------------------------------------


def test_customer_cannot_override_price(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active", price=1000, stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )

    # Attempt to smuggle a manipulated price in the checkout payload; the
    # OrderCreate schema has no price field so this is silently ignored,
    # and the price actually used must come from the database.
    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}, "price": "0.01"},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 201
    order = response.json()
    assert float(order["items"][0]["unit_price"]) == 1000.0
    assert float(order["total_amount"]) == 1000.0


def test_backend_uses_discount_price_when_applicable(client, admin_token, customer_token):
    product = _create_product(
        client, admin_token, status="active", price=1000, discount_price=750, stock=5
    )
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )

    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 201
    order = response.json()
    assert float(order["items"][0]["unit_price"]) == 750.0
    assert float(order["total_amount"]) == 750.0


# --- 15-17: Admin/Customer order synchronization ---------------------------


def test_customer_order_appears_in_admin_orders(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    order = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}},
        headers=_auth_headers(customer_token),
    ).json()

    admin_orders = client.get(
        "/api/admin/orders", headers=_auth_headers(admin_token)
    ).json()
    assert any(o["id"] == order["id"] for o in admin_orders)


def test_admin_can_update_order_status_and_customer_sees_it(
    client, admin_token, customer_token
):
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    order = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}},
        headers=_auth_headers(customer_token),
    ).json()
    assert order["status"] == "Pending"

    updated = client.patch(
        f"/api/admin/orders/{order['id']}",
        json={"status": "Confirmed"},
        headers=_auth_headers(admin_token),
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "Confirmed"

    customer_orders = client.get(
        "/api/orders", headers=_auth_headers(customer_token)
    ).json()
    matching = next(o for o in customer_orders if o["id"] == order["id"])
    assert matching["status"] == "Confirmed"


# --- 18-19: relationships use database IDs, not name/email matching -------


def test_order_item_uses_product_id_relationship(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    order = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}},
        headers=_auth_headers(customer_token),
    ).json()

    assert order["items"][0]["product_id"] == product["id"]


def test_order_uses_customer_id_relationship(client, admin_token, customer_token):
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    order = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}},
        headers=_auth_headers(customer_token),
    ).json()

    me = client.get("/api/auth/me", headers=_auth_headers(customer_token)).json()
    assert order["customer_id"] == me["id"]


# --- 20-28: Visit Company order option --------------------------------------
#
# "Visit Company" is a new order_method (NOT a payment method / gateway).
# Cash on Delivery must keep working exactly as before; these tests verify
# both flows plus that Visit Company still goes through the same
# product/stock/price security checks as Cash on Delivery.


def test_customer_can_create_visit_company_order(client, admin_token, customer_token):
    """1. Customer can create a Visit Company order."""
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )

    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}, "order_method": "visit_company"},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 201
    order = response.json()
    assert order["order_method"] == "visit_company"


def test_visit_company_stored_correctly_in_postgres(client, admin_token, customer_token):
    """2. Visit Company is stored correctly in PostgreSQL."""
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    order = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}, "order_method": "visit_company"},
        headers=_auth_headers(customer_token),
    ).json()

    with get_db_context() as db:
        stored = db.query(Order).filter(Order.id == uuid.UUID(order["id"])).first()
        assert stored is not None
        assert stored.order_method.value == "visit_company"
        # Cash on Delivery / payment_method is untouched by Visit Company.
        assert stored.payment_method.value == "Cash on Delivery"


def test_admin_sees_visit_company_order(client, admin_token, customer_token):
    """3. Admin sees the same Visit Company order."""
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    order = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}, "order_method": "visit_company"},
        headers=_auth_headers(customer_token),
    ).json()

    admin_orders = client.get(
        "/api/admin/orders", headers=_auth_headers(admin_token)
    ).json()
    matching = next(o for o in admin_orders if o["id"] == order["id"])
    assert matching["order_method"] == "visit_company"


def test_customer_sees_visit_company_in_order_history(client, admin_token, customer_token):
    """4. Customer sees Visit Company in order history."""
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    order = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}, "order_method": "visit_company"},
        headers=_auth_headers(customer_token),
    ).json()

    customer_orders = client.get(
        "/api/orders", headers=_auth_headers(customer_token)
    ).json()
    matching = next(o for o in customer_orders if o["id"] == order["id"])
    assert matching["order_method"] == "visit_company"


def test_invalid_order_method_is_rejected(client, admin_token, customer_token):
    """5. Invalid order method is rejected."""
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )

    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}, "order_method": "online_payment"},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 400


def test_existing_cash_on_delivery_still_works(client, admin_token, customer_token):
    """6. Existing Cash on Delivery still works (no order_method sent, same
    as before this change)."""
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )

    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 201
    order = response.json()
    assert order["order_method"] == "delivery"
    assert order["payment_method"] == "Cash on Delivery"

    admin_orders = client.get(
        "/api/admin/orders", headers=_auth_headers(admin_token)
    ).json()
    assert any(o["id"] == order["id"] for o in admin_orders)


def test_visit_company_cannot_bypass_product_status_validation(client, admin_token, customer_token):
    """7. Visit Company cannot bypass product status validation."""
    product = _create_product(client, admin_token, status="active", stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    _set_product_status(client, admin_token, product["id"], "draft")

    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}, "order_method": "visit_company"},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 400


def test_visit_company_cannot_bypass_stock_validation(client, admin_token, customer_token):
    """8. Visit Company cannot bypass stock validation."""
    product = _create_product(client, admin_token, status="active", stock=1)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )
    client.put(
        f"/api/products/{product['id']}",
        json={"stock": 0},
        headers=_auth_headers(admin_token),
    )

    response = client.post(
        "/api/orders",
        json={"address": {"line1": "123 Farm Rd"}, "order_method": "visit_company"},
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 400


def test_visit_company_backend_price_protection_still_applies(client, admin_token, customer_token):
    """9. Backend price protection still applies to Visit Company orders."""
    product = _create_product(client, admin_token, status="active", price=1000, stock=5)
    _clear_cart(client, customer_token)
    client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=_auth_headers(customer_token),
    )

    response = client.post(
        "/api/orders",
        json={
            "address": {"line1": "123 Farm Rd"},
            "order_method": "visit_company",
            "price": "0.01",
        },
        headers=_auth_headers(customer_token),
    )
    assert response.status_code == 201
    order = response.json()
    assert float(order["items"][0]["unit_price"]) == 1000.0
    assert float(order["total_amount"]) == 1000.0
