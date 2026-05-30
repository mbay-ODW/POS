import pytest
from bson import ObjectId

PRODUCT_PAYLOAD = {
    "category": "000000000000000000000001",
    "name": "Testprodukt",
    "shortName": "Test",
    "active": True,
    "stock": {"current": 10},
    "price": {"current": 5.0},
    "thresholds": {"warning": 2, "info": 5},
}


def _create_product(client):
    r = client.post("/api/v1/products", json=PRODUCT_PAYLOAD)
    return r.get_json()["_id"]


def _order_payload(product_id, amount=2, station_id=None):
    payload = {
        "orders": [
            {"product": {"id": product_id, "name": "Testprodukt", "category": "000000000000000000000001", "price": 5.0}, "amount": amount}
        ],
        "total": 5.0 * amount,
    }
    if station_id:
        payload["station_id"] = station_id
    return payload


def test_post_order_reduces_stock(client, db):
    pid = _create_product(client)
    r = client.post("/api/v1/orders", json=_order_payload(pid, amount=3))
    assert r.status_code == 201
    product = db.products.find_one({"_id": ObjectId(pid)})
    assert product["stock"]["current"] == 7  # 10 - 3


def test_get_orders(client):
    pid = _create_product(client)
    client.post("/api/v1/orders", json=_order_payload(pid))
    r = client.get("/api/v1/orders")
    assert r.status_code == 200
    assert r.get_json()["total"] >= 1


def test_get_orders_filter_by_station(client):
    pid = _create_product(client)
    client.post("/api/v1/orders", json=_order_payload(pid, station_id="station-A"))
    client.post("/api/v1/orders", json=_order_payload(pid, station_id="station-B"))
    r = client.get("/api/v1/orders?station_id=station-A")
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert all(o.get("station_id") == "station-A" for o in data)


def test_delete_order_restores_stock(client, db):
    pid = _create_product(client)
    post_r = client.post("/api/v1/orders", json=_order_payload(pid, amount=2))
    oid = post_r.get_json()["_id"]
    client.delete(f"/api/v1/orders/{oid}")
    product = db.products.find_one({"_id": ObjectId(pid)})
    assert product["stock"]["current"] == 10  # restored
