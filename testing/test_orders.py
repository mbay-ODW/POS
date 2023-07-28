import re
from unicodedata import name
import requests
from pprint import pprint
from bson import ObjectId

URL_PRODUCTS = "http://localhost:3000/v1/products/"
URL_ORDERS = "http://localhost:3000/v1/orders/"


def create_product():
    payload = {
        "category": "A",
        "name": "Blasfahsfkjasf",
        "shortname": "yvbxp",
        "active": True,
        "stock": {"current": 10},
        "price": {"current": 5},
        "image": "Base64",
        "thresholds": {"warning": 35, "info": 42},
        "schemaVersion": "1.0",
        "lastModified": "2022-02-11 13:53:00+00:00",
        "creationTime": "2022-02-11 13:53:00+00:00"
    }
    try:
        r = requests.post(url=URL_PRODUCTS, json=payload)
        data = r.json()
    except:
        data = None

    assert r.status_code == 201

    return str(data["_id"])


def get_product_stock(product_id):
    global stock
    try:
        r = requests.get(url=URL_PRODUCTS + product_id)
        data = r.json()
        stock = data["stock"]["current"]
    except:
        stock = None

    return stock


def test_post_order():
    global product_id
    product_id = create_product()

    initial_stock = get_product_stock(product_id)

    payload = {
        "orders": [
            {"id": 1, "product": {"id": product_id, "name": "name of the product"}, "amount": 2},
            {"id": 2, "product": {"id": product_id, "name": "name of the product"}, "amount": 2}
        ],
        "state": {"delivered": True, "lastModified": "2022-02-11 13:53:00+00:00"},
        "schemaVersion": "1.0",
        "creationTime": "2022-02-11 13:53:00+00:00",
        "lastModified": "2022-02-11 13:53:00+00:00"
    }
    try:
        r = requests.post(url=URL_ORDERS, json=payload)
        data = r.json()
    except:
        data = None

    assert r.status_code == 201

    updated_stock = get_product_stock(product_id)
    assert updated_stock == initial_stock - 4


def test_put_order():
    global product_id
    product_id = create_product()

    payload = {
        "_id": "the id",
        "orders": [
            {"id": 1, "product": {"id": product_id, "name": "name of the product"}, "amount": 2},
            {"id": 2, "product": {"id": product_id, "name": "name of the product"}, "amount": 2}
        ],
        "state": {"delivered": True, "lastModified": "2022-02-11 13:53:00+00:00"},
        "schemaVersion": "1.0",
        "creationTime": "2022-02-11 13:53:00+00:00",
        "lastModified": "2022-02-11 13:53:00+00:00"
    }
    try:
        r = requests.post(url=URL_ORDERS, json=payload)
        data = r.json()
    except:
        data = None

    assert r.status_code == 201

    initial_stock = get_product_stock(product_id)

    # Update the order (e.g., change the amount of the product)
    payload = {
        "_id": "the id",
        "orders": [
            {"id": 1, "product": {"id": product_id, "name": "name of the product"}, "amount": 1},
            {"id": 2, "product": {"id": product_id, "name": "name of the product"}, "amount": 3}
        ],
        "state": {"delivered": True, "lastModified": "2022-02-12 13:53:00+00:00"},
        "schemaVersion": "1.0",
        "creationTime": "2022-02-11 13:53:00+00:00",
        "lastModified": "2022-02-12 13:53:00+00:00"
    }
    try:
        r = requests.put(url=URL_ORDERS + "the id", json=payload)
        data = r.json()
    except:
        data = None

    assert r.status_code == 200

    updated_stock = get_product_stock(product_id)
    assert updated_stock == initial_stock + 2


def test_delete_order():
    global product_id
    global order_id
    product_id = create_product()

    payload = {
        "_id": "the id",
        "orders": [
            {"id": 1, "product": {"id": product_id, "name": "name of the product"}, "amount": 2},
            {"id": 2, "product": {"id": product_id, "name": "name of the product"}, "amount": 2}
        ],
        "state": {"delivered": True, "lastModified": "2022-02-11 13:53:00+00:00"},
        "schemaVersion": "1.0",
        "creationTime": "2022-02-11 13:53:00+00:00",
        "lastModified": "2022-02-11 13:53:00+00:00"
    }
    try:
        r = requests.post(url=URL_ORDERS, json=payload)
        data = r.json()
        order_id = str(data['_id'])
    except:
        data = None

    assert r.status_code == 201

    initial_stock = get_product_stock(product_id)


    # Check if the order is retrievable from the API before deletion
    try:
        r = requests.get(url=URL_ORDERS + order_id)
        data = r.json()
    except:
        data = None

    assert r.status_code == 200
    assert data["_id"] == order_id

    # Delete the order
    r = requests.delete(url=URL_ORDERS + "the id")
    assert r.status_code == 204

    updated_stock = get_product_stock(product_id)
    assert updated_stock == initial_stock + 4

    # Check if the order is no longer retrievable from the API after deletion
    try:
        r = requests.get(url=URL_ORDERS + order_id)
        data = r.json()
    except:
        data = None

    assert r.status_code == 404
    assert data is None


if __name__ == "__main__":
    test_post_order()
    test_put_order()
    test_delete_order()
