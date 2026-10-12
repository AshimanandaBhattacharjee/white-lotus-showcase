from tests.conftest import ADMIN, make_property


def create(client, **overrides) -> dict:
    res = client.post("/api/properties", json=make_property(**overrides), headers=ADMIN)
    assert res.status_code == 201, res.text
    return res.json()


def test_create_and_get(client):
    created = create(client)
    res = client.get(f"/api/properties/{created['id']}")
    assert res.status_code == 200
    assert res.json()["name"] == "Lotus Villa"


def test_write_endpoints_require_admin_key(client):
    assert client.post("/api/properties", json=make_property()).status_code == 401
    prop = create(client)
    wrong = {"X-Admin-Key": "nope"}
    assert client.put(f"/api/properties/{prop['id']}", json=make_property(), headers=wrong).status_code == 401
    assert client.delete(f"/api/properties/{prop['id']}").status_code == 401


def test_validation_rejects_bad_input(client):
    res = client.post(
        "/api/properties",
        json=make_property(name="   ", price=-1, image_url="not-a-url"),
        headers=ADMIN,
    )
    assert res.status_code == 422
    errors = res.json()["errors"]
    assert errors["name"] == "This field is required"
    assert "price" in errors
    assert "image_url" in errors


def test_update_and_delete(client):
    prop = create(client)
    res = client.put(f"/api/properties/{prop['id']}", json=make_property(price=50_000_000), headers=ADMIN)
    assert res.json()["price"] == 50_000_000
    assert client.delete(f"/api/properties/{prop['id']}", headers=ADMIN).status_code == 204
    assert client.get(f"/api/properties/{prop['id']}").status_code == 404


def test_filter_and_sort(client):
    create(client, name="A", location="Whitefield", bedrooms=3, price=30_000_000)
    create(client, name="B", location="Koramangala", bedrooms=5, price=90_000_000)
    create(client, name="C", location="whitefield", bedrooms=4, price=60_000_000)

    names = lambda res: [p["name"] for p in res.json()]  # noqa: E731
    assert sorted(names(client.get("/api/properties?location=WHITEFIELD"))) == ["A", "C"]
    assert names(client.get("/api/properties?min_bedrooms=4&sort=price_desc")) == ["B", "C"]
    assert names(client.get("/api/properties?sort=price_asc")) == ["A", "C", "B"]
    assert names(client.get("/api/properties?max_price=60000000&sort=price_asc")) == ["A", "C"]
    assert client.get("/api/properties?sort=drop_table").status_code == 422


def test_locations_are_case_insensitive_distinct(client):
    create(client, location="Whitefield")
    create(client, location="whitefield")
    create(client, location="Koramangala")
    assert client.get("/api/properties/locations").json() == ["Koramangala", "Whitefield"]
