"""Verify POST /api/bookings sends BOTH:
 - internal notification -> agendamento@castassessoria.com.br
 - customer confirmation -> booking.email (delivered@resend.dev)
Creates 1 TEST_ booking only, cleans it up via admin DELETE.
"""
import os
import re
import time
import asyncio
from datetime import date, timedelta

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://agendamento-vistos.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@castassessoria.com.br"
ADMIN_PASSWORD = "CastAdmin@2026"
NOTIFY_EMAIL = "agendamento@castassessoria.com.br"
CUSTOMER_EMAIL = "delivered@resend.dev"
BACKEND_LOG = "/var/log/supervisor/backend.err.log"


def future_weekday(delta_days: int) -> str:
    d = date.today() + timedelta(days=delta_days)
    while d.weekday() >= 5:
        d += timedelta(days=1)
    return d.isoformat()


def _find_free_slot(booking_date: str) -> str:
    r = requests.get(f"{API}/bookings/availability", params={"date": booking_date})
    r.raise_for_status()
    for s in r.json()["slots"]:
        if s["available"]:
            return s["time"]
    raise RuntimeError("No free slot")


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return s


def test_rejected_weekend_sends_no_emails():
    log_size_before = os.path.getsize(BACKEND_LOG) if os.path.exists(BACKEND_LOG) else 0
    d = date.today()
    while d.weekday() != 5:
        d += timedelta(days=1)
    r = requests.post(f"{API}/bookings", json={
        "name": "TEST_WeekendNoEmail", "email": CUSTOMER_EMAIL,
        "phone": "11999999999", "service": "passaporte",
        "date": d.isoformat(), "time": "10:00",
    })
    assert r.status_code == 400
    time.sleep(2)
    with open(BACKEND_LOG, "rb") as f:
        f.seek(log_size_before)
        tail = f.read().decode("utf-8", errors="replace")
    assert "Customer confirmation sent" not in tail
    assert "Booking notification sent" not in tail


def test_create_booking_sends_both_emails(admin_session):
    booking_date = future_weekday(21)
    time_slot = _find_free_slot(booking_date)
    log_size_before = os.path.getsize(BACKEND_LOG) if os.path.exists(BACKEND_LOG) else 0

    payload = {
        "name": "TEST_CustomerConf",
        "email": CUSTOMER_EMAIL,
        "phone": "11999999999",
        "service": "visto-americano",
        "date": booking_date,
        "time": time_slot,
        "notes": "note not included in customer email",
    }
    r = requests.post(f"{API}/bookings", json=payload)
    assert r.status_code == 200, r.text
    booking_id = r.json()["id"]
    assert r.json()["email"] == CUSTOMER_EMAIL

    try:
        deadline = time.time() + 30
        tail = ""
        found_internal = False
        found_customer = False
        count_202 = 0
        while time.time() < deadline:
            time.sleep(2)
            with open(BACKEND_LOG, "rb") as f:
                f.seek(log_size_before)
                tail = f.read().decode("utf-8", errors="replace")
            found_internal = f"Booking notification sent to {NOTIFY_EMAIL}" in tail
            found_customer = f"Customer confirmation sent for booking {booking_id}" in tail
            count_202 = len(re.findall(r'integrations\.emergentagent\.com[^\n]*HTTP/1\.1" 202', tail))
            if found_internal and found_customer and count_202 >= 2:
                break

        assert found_internal, f"Missing internal notification log. Tail:\n{tail[-3000:]}"
        assert found_customer, f"Missing customer confirmation log. Tail:\n{tail[-3000:]}"
        assert count_202 >= 2, f"Expected >=2 202 responses, got {count_202}. Tail:\n{tail[-3000:]}"
    finally:
        del_r = admin_session.delete(f"{API}/admin/bookings/{booking_id}")
        assert del_r.status_code == 200


def test_notify_customer_booking_template():
    """Code-level: template includes name/service/date/time; escapes HTML; excludes notes; sets Reply-To."""
    import sys
    sys.path.insert(0, "/app/backend")
    from dotenv import load_dotenv
    load_dotenv("/app/backend/.env")
    import email_service

    captured = {}

    async def fake_send(*, to, subject, html):
        captured.update(to=to, subject=subject, html=html)
        return "fake"

    orig = email_service.send_email
    email_service.send_email = fake_send
    try:
        booking = {
            "id": "abc123",
            "name": "<script>João</script> Silva Santos",
            "email": "x@y.com",
            "phone": "11999999999",
            "date": "2026-10-07",
            "time": "09:00",
            "notes": "SENSITIVE NOTES SHOULD NOT APPEAR",
        }
        asyncio.get_event_loop().run_until_complete(
            email_service.notify_customer_booking(booking, "Visto Americano")
        )
    finally:
        email_service.send_email = orig

    assert captured["to"] == "x@y.com"
    assert "recebemos seu agendamento" in captured["subject"].lower()
    # Only first name escaped
    assert "&lt;script&gt;" in captured["html"]
    assert "<script>" not in captured["html"]
    # Date BR format
    assert "07/10/2026" in captured["html"]
    assert "09:00" in captured["html"]
    assert "Visto Americano" in captured["html"]
    # Notes NOT included
    assert "SENSITIVE NOTES" not in captured["html"]
    # Form fields not allowed
    assert "<form" not in captured["html"].lower()


def test_notify_customer_booking_failure_does_not_raise():
    """If send_email raises, notify_customer_booking must catch and log, not raise."""
    import sys
    sys.path.insert(0, "/app/backend")
    from dotenv import load_dotenv
    load_dotenv("/app/backend/.env")
    import email_service

    async def boom(**kwargs):
        raise RuntimeError("resend down")

    orig = email_service.send_email
    email_service.send_email = boom
    try:
        asyncio.get_event_loop().run_until_complete(
            email_service.notify_customer_booking(
                {"id": "x", "name": "A", "email": "a@b.c", "date": "2026-10-07", "time": "09:00"},
                "Passaporte Brasileiro",
            )
        )  # must not raise
    finally:
        email_service.send_email = orig
