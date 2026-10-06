"""Backend API tests for Cast Assessoria."""
import os
from datetime import date, timedelta

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://agendamento-vistos.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@castassessoria.com.br"
ADMIN_PASSWORD = "CastAdmin@2026"


def next_weekday(delta_days: int = 1) -> str:
    d = date(2026, 10, 6) + timedelta(days=delta_days)
    # ensure weekday (Mon-Fri)
    while d.weekday() >= 5:
        d += timedelta(days=1)
    # also ensure in the future relative to today
    today = date.today()
    while d <= today or d.weekday() >= 5:
        d += timedelta(days=1)
    return d.isoformat()


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_session(session):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    assert "access_token" in s.cookies, "access_token cookie not set"
    assert "refresh_token" in s.cookies, "refresh_token cookie not set"
    return s


# ---------- Public endpoints ----------
class TestPublic:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert "Cast Assessoria" in r.json().get("message", "")

    def test_availability_valid(self, session):
        d = next_weekday(5)
        r = session.get(f"{API}/bookings/availability", params={"date": d})
        assert r.status_code == 200
        data = r.json()
        assert data["date"] == d
        assert len(data["slots"]) == 8
        assert all("time" in s and "available" in s for s in data["slots"])

    def test_availability_invalid_date(self, session):
        r = session.get(f"{API}/bookings/availability", params={"date": "not-a-date"})
        assert r.status_code == 400


# ---------- Bookings ----------
class TestBookings:
    created_ids = []

    def test_create_booking_weekend_rejected(self, session):
        # find a saturday
        d = date.today() + timedelta(days=1)
        while d.weekday() != 5:
            d += timedelta(days=1)
        r = session.post(f"{API}/bookings", json={
            "name": "TEST_Weekend", "email": "test_weekend@example.com", "phone": "11999999999",
            "service": "passaporte", "date": d.isoformat(), "time": "10:00"
        })
        assert r.status_code == 400

    def test_create_booking_past_rejected(self, session):
        past = (date.today() - timedelta(days=1)).isoformat()
        r = session.post(f"{API}/bookings", json={
            "name": "TEST_Past", "email": "test_past@example.com", "phone": "11999999999",
            "service": "passaporte", "date": past, "time": "10:00"
        })
        assert r.status_code == 400

    def test_create_booking_invalid_time(self, session):
        d = next_weekday(7)
        r = session.post(f"{API}/bookings", json={
            "name": "TEST_InvalidTime", "email": "test_invalid@example.com", "phone": "11999999999",
            "service": "passaporte", "date": d, "time": "12:00"
        })
        assert r.status_code == 400

    def test_create_booking_success_and_conflict(self, session):
        d = next_weekday(10)
        payload = {
            "name": "TEST_Booking", "email": "test_booking@example.com", "phone": "11999999999",
            "service": "visto-americano", "date": d, "time": "15:00", "notes": "TEST entry"
        }
        r = session.post(f"{API}/bookings", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Booking"
        assert data["status"] == "pendente"
        assert data.get("id")
        TestBookings.created_ids.append(data["id"])

        # verify shows up as unavailable
        avail = session.get(f"{API}/bookings/availability", params={"date": d}).json()
        slot = next(s for s in avail["slots"] if s["time"] == "15:00")
        assert slot["available"] is False

        # duplicate -> 409
        r2 = session.post(f"{API}/bookings", json=payload)
        assert r2.status_code == 409

    def test_create_booking_invalid_service(self, session):
        d = next_weekday(12)
        r = session.post(f"{API}/bookings", json={
            "name": "TEST_X", "email": "t@example.com", "phone": "11999999999",
            "service": "invalid-service", "date": d, "time": "10:00"
        })
        assert r.status_code == 422


# ---------- Contacts ----------
class TestContacts:
    created_ids = []

    def test_create_contact(self, session):
        r = session.post(f"{API}/contacts", json={
            "name": "TEST_Contact", "email": "test_contact@example.com", "phone": "11988887777",
            "subject": "TEST subject", "message": "This is a TEST message from backend test."
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Contact"
        assert data["status"] == "novo"
        assert data.get("id")
        TestContacts.created_ids.append(data["id"])

    def test_create_contact_invalid_email(self, session):
        r = session.post(f"{API}/contacts", json={
            "name": "TEST_X", "email": "not-an-email", "subject": "x", "message": "hello world"
        })
        assert r.status_code == 422


# ---------- Admin auth ----------
class TestAdminAuth:
    def test_admin_endpoints_require_auth(self, session):
        for ep in ["/admin/bookings", "/admin/contacts"]:
            r = requests.get(f"{API}{ep}")
            assert r.status_code == 401, f"{ep} should be 401 without auth, got {r.status_code}"

    def test_login_wrong_password(self):
        # Use a different email to avoid locking admin account
        r = requests.post(f"{API}/auth/login", json={"email": "nobody_test@example.com", "password": "wrong"})
        assert r.status_code == 401

    def test_me_endpoint(self, admin_session):
        r = admin_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# ---------- Admin CRUD & cleanup ----------
class TestAdminCRUD:
    def test_list_bookings(self, admin_session):
        r = admin_session.get(f"{API}/admin/bookings")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_contacts(self, admin_session):
        r = admin_session.get(f"{API}/admin/contacts")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_update_booking_status(self, admin_session):
        if not TestBookings.created_ids:
            pytest.skip("No booking created")
        bid = TestBookings.created_ids[0]
        r = admin_session.patch(f"{API}/admin/bookings/{bid}", json={"status": "confirmado"})
        assert r.status_code == 200
        assert r.json()["status"] == "confirmado"

    def test_update_contact_status(self, admin_session):
        if not TestContacts.created_ids:
            pytest.skip("No contact created")
        cid = TestContacts.created_ids[0]
        r = admin_session.patch(f"{API}/admin/contacts/{cid}", json={"status": "respondido"})
        assert r.status_code == 200
        assert r.json()["status"] == "respondido"

    def test_zz_cleanup_delete(self, admin_session):
        # delete all TEST_ bookings and contacts
        bookings = admin_session.get(f"{API}/admin/bookings").json()
        for b in bookings:
            if b.get("name", "").startswith("TEST_") or b.get("email", "").startswith("test_"):
                r = admin_session.delete(f"{API}/admin/bookings/{b['id']}")
                assert r.status_code == 200
        contacts = admin_session.get(f"{API}/admin/contacts").json()
        for c in contacts:
            if c.get("name", "").startswith("TEST_") or c.get("email", "").startswith("test_"):
                r = admin_session.delete(f"{API}/admin/contacts/{c['id']}")
                assert r.status_code == 200

    def test_logout(self, session):
        s = requests.Session()
        s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200
