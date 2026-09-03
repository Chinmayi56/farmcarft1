"""Tests for the health check endpoints."""


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert "message" in body
    assert body["health"] == "/api/health"


def test_health_endpoint_returns_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "database" in body


def test_health_endpoint_reports_database_connected(client):
    """With a correctly configured PostgreSQL instance, the health check
    should report the database as connected."""
    response = client.get("/api/health")
    body = response.json()
    assert body["database"] == "connected"
