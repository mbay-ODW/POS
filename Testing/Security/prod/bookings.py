import re
from unicodedata import name
import requests
from pprint import pprint
import json

URL = "https://api.drk-odw.de/api/v1/bookings"
expected_string = "https://authelia.drk-odw.de"


def test_get_bookings_list():
    try:
        r = requests.get(url = URL,headers={"Remote-Groups": "admin,xyz", "Accept": "*"})
        response_text = r.text
    except:
        data = None

    assert r.status_code == 401 or r.status_code == 403

def test_post_bookings_list():
    try:
        data = {}
        r = requests.post(url = URL,json=data, headers={"Remote-Groups": "admin,xyz", "Accept": "*"})
        response_text = r.text
    except:
        data = None

    assert r.status_code == 401 or r.status_code == 403


def test_put_bookings_list():
    try:
        data = {}
        r = requests.put(url = URL,json=data, headers={"Remote-Groups": "admin,xyz", "Accept": "*"})
        response_text = r.text
    except:
        data = None

    assert r.status_code == 401 or r.status_code == 403


def test_delete_bookings_list():
    try:
        r = requests.put(url = URL, headers={"Remote-Groups": "admin,xyz", "Accept": "*"})
        response_text = r.text
    except:
        data = None

    assert r.status_code == 401 or r.status_code == 403


def test_patch_bookings_list():
    try:
        data = {}
        r = requests.patch(url = URL,json=data, headers={"Remote-Groups": "admin,xyz", "Accept": "*"})
        response_text = r.text
    except:
        data = None

    assert r.status_code == 401 or r.status_code == 403



# Start with specifig endpoint here:
    

def test_get_bookings_specific():
    try:
        r = requests.get(url = URL + "/1234", headers={"Remote-Groups": "admin,xyz", "Accept": "*"})
        response_text = r.text
    except:
        data = None

    assert r.status_code == 401 or r.status_code == 403


def test_post_bookings_specific():
    try:
        data = {}
        r = requests.post(url = URL + "/1234", json=data, headers={"Remote-Groups": "admin,xyz", "Accept": "*"})
        response_text = r.text
    except:
        data = None

    assert r.status_code == 401 or r.status_code == 403


def test_put_bookings_specific():
    try:
        data = {}
        r = requests.put(url = URL + "/1234", json=data, headers={"Remote-Groups": "admin,xyz", "Accept": "*"})
        response_text = r.text
    except:
        data = None

    assert r.status_code == 401 or r.status_code == 403


def test_delete_bookings_specific():
    try:
        r = requests.put(url = URL + "/1234",  headers={"Remote-Groups": "admin,xyz", "Accept": "*"})
        response_text = r.text
    except:
        data = None

    assert r.status_code == 401 or r.status_code == 403


def test_patch_bookings_specific():
    try:
        data = {}
        r = requests.patch(url = URL + "/1234", json=data, headers={"Remote-Groups": "admin,xyz", "Accept": "*"})
        response_text = r.text
    except:
        data = None

    assert r.status_code == 401 or r.status_code == 403





if __name__ == "__main__":
        # Run tests for the general endpoint
    test_get_bookings_list()
    test_post_bookings_list()
    test_put_bookings_list()
    test_delete_bookings_list()
    test_patch_bookings_list()

    # Run tests for a specific endpoint
    test_get_bookings_specific()
    test_post_bookings_specific()
    test_put_bookings_specific()
    test_delete_bookings_specific()
    test_patch_bookings_specific()

