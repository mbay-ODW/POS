def test_post_and_get_category(client):
    r = client.post("/api/v1/categories", json={"name": "Getränke"})
    assert r.status_code == 201
    r2 = client.get("/api/v1/categories")
    assert r2.status_code == 200
    assert any(c["name"] == "Getränke" for c in r2.get_json()["data"])


def test_delete_category(client):
    post_r = client.post("/api/v1/categories", json={"name": "ZuLöschen"})
    cid = post_r.get_json()["_id"]
    r = client.delete(f"/api/v1/categories/{cid}")
    assert r.status_code == 204
