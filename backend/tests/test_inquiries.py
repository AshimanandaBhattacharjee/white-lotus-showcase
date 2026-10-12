from tests.conftest import ADMIN, make_property

INQUIRY = {
    "name": "Riya Sharma",
    "email": "riya@example.com",
    "phone": "+91 98765-43210",
    "message": "Can we schedule a visit this weekend?",
}


def create_property(client) -> int:
    return client.post("/api/properties", json=make_property(), headers=ADMIN).json()["id"]


def test_submit_inquiry_and_admin_sees_property_name(client):
    pid = create_property(client)
    res = client.post(f"/api/properties/{pid}/inquiries", json=INQUIRY)
    assert res.status_code == 201

    listed = client.get("/api/inquiries", headers=ADMIN).json()
    assert len(listed) == 1
    assert listed[0]["property_name"] == "Lotus Villa"
    assert listed[0]["email"] == "riya@example.com"


def test_listing_inquiries_requires_admin(client):
    assert client.get("/api/inquiries").status_code == 401


def test_inquiry_validation(client):
    pid = create_property(client)
    res = client.post(
        f"/api/properties/{pid}/inquiries",
        json={"name": "", "email": "nope", "phone": "123", "message": ""},
    )
    assert res.status_code == 422
    assert set(res.json()["errors"]) == {"name", "email", "phone", "message"}


def test_inquiry_for_missing_property_is_404(client):
    assert client.post("/api/properties/999/inquiries", json=INQUIRY).status_code == 404


def test_deleting_property_keeps_its_inquiries(client):
    pid = create_property(client)
    client.post(f"/api/properties/{pid}/inquiries", json=INQUIRY)
    client.delete(f"/api/properties/{pid}", headers=ADMIN)

    listed = client.get("/api/inquiries", headers=ADMIN).json()
    assert len(listed) == 1
    assert listed[0]["property_id"] is None
    assert listed[0]["property_name"] is None


def test_filter_inquiries_by_property(client):
    a = create_property(client)
    b = create_property(client)
    client.post(f"/api/properties/{a}/inquiries", json=INQUIRY)
    client.post(f"/api/properties/{b}/inquiries", json=INQUIRY)
    assert len(client.get(f"/api/inquiries?property_id={a}", headers=ADMIN).json()) == 1
