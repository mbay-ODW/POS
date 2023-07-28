import re
from unicodedata import name
import requests
from pprint import pprint
from bson import ObjectId

URL = "http://localhost:3000/v1/products/"


def test_post_product():
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
        r = requests.post(url=URL, json=payload)
        data = r.json()
    except:
        data = None

    assert r.status_code == 201


def test_get_products():
    global productsId
    try:
        r = requests.get(url=URL)
        data = r.json()
        productsId = data[0]['_id']
    except:
        data = None

    assert len(data) == 1


def test_products_specific():
    global productsId
    id = productsId
    try:
        r = requests.get(url=URL + id)
        data = r.json()
    except:
        data = None

    assert data['name'] == "Blasfahsfkjasf"


def test_put_products_specific():
    payload = {
        "name": "Updated Name",
        "active": False
    }
    global productsId
    id = productsId

    r = requests.patch(url=URL + id, json=payload)

    assert r.status_code == 200


def test_delete_specific():
    global productsId
    id = productsId
    r = requests.delete(url=URL + id)

    assert r.status_code == 204


if __name__ == "__main__":
    test_post_product()
    test_get_products()
    test_products_specific()
    test_put_products_specific()
    test_delete_specific()
