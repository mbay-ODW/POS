import json
import pytest


PRODUCT_PAYLOAD = {
    "category": "000000000000000000000001",
    "name": "Testprodukt",
    "shortName": "Test",
    "active": True,
    "stock": {"current": 10},
    "price": {"current": 5.0},
    "thresholds": {"warning": 2, "info": 5},
}


def test_get_products_empty(client):
    r = client.get("/api/v1/products")
    assert r.status_code == 200
    data = r.get_json()
    assert data["data"] == []
    assert data["total"] == 0


def test_post_product(client):
    r = client.post("/api/v1/products", json=PRODUCT_PAYLOAD)
    assert r.status_code == 201
    body = r.get_json()
    assert "_id" in body


def test_get_products_after_insert(client):
    client.post("/api/v1/products", json=PRODUCT_PAYLOAD)
    r = client.get("/api/v1/products")
    assert r.status_code == 200
    assert r.get_json()["total"] >= 1


def test_filter_active_products(client):
    client.post("/api/v1/products", json={**PRODUCT_PAYLOAD, "active": True})
    client.post("/api/v1/products", json={**PRODUCT_PAYLOAD, "name": "Inaktiv", "active": False})
    r = client.get("/api/v1/products?active=true")
    assert r.status_code == 200
    products = r.get_json()["data"]
    assert all(p["active"] for p in products)


def test_update_product(client):
    post_r = client.post("/api/v1/products", json=PRODUCT_PAYLOAD)
    pid = post_r.get_json()["_id"]
    r = client.put(f"/api/v1/products/{pid}", json={"name": "Aktualisiert"})
    assert r.status_code == 200


def test_delete_product(client):
    post_r = client.post("/api/v1/products", json=PRODUCT_PAYLOAD)
    pid = post_r.get_json()["_id"]
    r = client.delete(f"/api/v1/products/{pid}")
    assert r.status_code == 204
