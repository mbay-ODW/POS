def test_post_and_get_station(client):
    r = client.post("/api/v1/stations", json={"name": "Bar", "categories": [], "vorlauf": 15})
    assert r.status_code == 201
    r2 = client.get("/api/v1/stations")
    assert r2.status_code == 200
    assert any(s["name"] == "Bar" for s in r2.get_json()["data"])


def test_update_station_vorlauf(client):
    post_r = client.post("/api/v1/stations", json={"name": "Küche", "categories": [], "vorlauf": 10})
    sid = post_r.get_json()["_id"]
    r = client.put(f"/api/v1/stations/{sid}", json={"name": "Küche", "categories": [], "vorlauf": 30})
    assert r.status_code == 200
