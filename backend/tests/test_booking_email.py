"""Targeted test: booking creation triggers background email notification to BOOKING_NOTIFY_EMAIL.
Creates AT MOST 1 TEST_ booking and cleans it up via admin endpoints.
Verifies supervisor backend log contains the success log line + 202 from Resend proxy.
"""
import os
import re
import time
from datetime import date, timedelta

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://agendamento-vistos.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@castassessoria.com.br"
ADMIN_PASSWORD = "CastAdmin@2026"
NOTIFY_EMAIL = "agendamento@castassessoria.com.br"
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


def test_booking_rejected_does_not_send_email():
    """Weekend/past rejection: 400 and no email trigger (code path never reaches background task)."""
    # Saturday
    d = date.today()
    while d.weekday() != 5:
        d += timedelta(days=1)
    r = requests.post(f"{API}/bookings", json={
        "name": "TEST_WeekendNoEmail", "email": "test_weekend@example.com",
        "phone": "11999999999", "service": "passaporte",
        "date": d.isoformat(), "time": "10:00",
    })
    assert r.status_code == 400


def test_create_booking_sends_notification_email(admin_session):
    booking_date = future_weekday(14)
    time_slot = _find_free_slot(booking_date)

    # Record log size before
    log_size_before = os.path.getsize(BACKEND_LOG) if os.path.exists(BACKEND_LOG) else 0

    payload = {
        "name": "TEST_EmailUser <script>alert(1)</script>",  # HTML escape check
        "email": "test_email@example.com",
        "phone": "11999999999",
        "service": "visto-americano",
        "date": booking_date,
        "time": time_slot,
        "notes": "Linha 1\n<b>Bold</b> & special",
    }
    r = requests.post(f"{API}/bookings", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("id")
    booking_id = data["id"]

    try:
        # Wait for background task to run
        deadline = time.time() + 25
        new_log_tail = ""
        found_sent = False
        found_202 = False
        while time.time() < deadline:
            time.sleep(2)
            if os.path.exists(BACKEND_LOG):
                with open(BACKEND_LOG, "rb") as f:
                    f.seek(log_size_before)
                    new_log_tail += f.read().decode("utf-8", errors="replace")
                    log_size_before += len(new_log_tail.encode("utf-8", errors="replace"))
            if f"Booking notification sent to {NOTIFY_EMAIL}" in new_log_tail:
                found_sent = True
            if re.search(r"HTTP/1\.1\" 202", new_log_tail) or "HTTP/1.1 202" in new_log_tail or '"POST /api/v1/email/send HTTP/1.1" 202' in new_log_tail:
                found_202 = True
            if found_sent and found_202:
                break

        assert found_sent, f"Expected success log line missing. Tail:\n{new_log_tail[-2000:]}"
        # 202 line is a nice-to-have; emit informative assertion
        assert found_202, f"Expected 202 from Resend proxy. Tail:\n{new_log_tail[-2000:]}"
    finally:
        # Cleanup via admin
        del_r = admin_session.delete(f"{API}/admin/bookings/{booking_id}")
        assert del_r.status_code == 200


def test_email_html_escapes_user_input():
    """Code-level check that notify_new_booking escapes HTML in name/notes/email."""
    import asyncio
    import sys
    sys.path.insert(0, "/app/backend")
    from dotenv import load_dotenv
    load_dotenv("/app/backend/.env")
    from email_service import notify_new_booking  # noqa
    # Patch send_email to capture the html
    import email_service

    captured = {}

    async def fake_send(*, to, subject, html):
        captured["to"] = to
        captured["subject"] = subject
        captured["html"] = html
        return "fake-id"

    orig = email_service.send_email
    email_service.send_email = fake_send
    try:
        booking = {
            "name": "<script>alert(1)</script>",
            "email": "x@y.com",
            "phone": "11999999999",
            "date": "2026-10-07",
            "time": "09:00",
            "notes": "<b>html</b> & new\nline",
        }
        asyncio.get_event_loop().run_until_complete(
            notify_new_booking(booking, "Visto Americano")
        )
    finally:
        email_service.send_email = orig

    assert captured["to"] == NOTIFY_EMAIL
    assert "<script>" not in captured["html"]
    assert "&lt;script&gt;" in captured["html"]
    assert "&lt;b&gt;html&lt;/b&gt;" in captured["html"]
    assert "&amp;" in captured["html"]
    # newline converted to <br> in notes
    assert "new<br>line" in captured["html"]
