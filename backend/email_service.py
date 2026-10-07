import os
import re
import ipaddress
import logging
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx

logger = logging.getLogger(__name__)

EMAIL_BASE_URL = "https://integrations.emergentagent.com"

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> str | None:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": os.environ["EMAIL_FROM_NAME"]}
    reply_to = os.environ.get("EMAIL_REPLY_TO")
    if reply_to:
        payload["contact_email"] = reply_to
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{EMAIL_BASE_URL}/api/v1/email/send",
            headers={"X-Email-Key": os.environ["EMERGENT_EMAIL_KEY"]},
            json=payload,
        )
    resp.raise_for_status()
    return resp.json().get("id")


def _row(label: str, value: str) -> str:
    return (f'<tr><td style="padding:8px 0;color:#5f6b62;font-size:13px;width:140px;vertical-align:top">{label}</td>'
            f'<td style="padding:8px 0;color:#141a16;font-size:14px">{value}</td></tr>')


async def notify_new_booking(booking: dict, service_label: str) -> None:
    to = os.environ["BOOKING_NOTIFY_EMAIL"]
    brand = escape(os.environ["EMAIL_FROM_NAME"])
    date_br = "/".join(reversed(booking["date"].split("-")))
    email = escape(booking["email"])
    phone = escape(booking["phone"])
    subject = f"Novo agendamento: {service_label} em {date_br} às {booking['time']}"
    rows = "".join([
        _row("Nome", escape(booking["name"])),
        _row("E-mail", f'<a href="mailto:{email}" style="color:#586e42">{email}</a>'),
        _row("Telefone", phone),
        _row("Serviço", escape(service_label)),
        _row("Data", escape(date_br)),
        _row("Horário", escape(booking["time"])),
        _row("Observações", escape(booking.get("notes") or "—").replace("\n", "<br>")),
    ])
    html = (
        '<table role="presentation" width="100%" style="background:#f4f6f1;padding:24px 0"><tr><td align="center">'
        '<table role="presentation" width="560" style="background:#ffffff;border-radius:12px;padding:32px;font-family:Arial,sans-serif">'
        f'<tr><td style="color:#586e42;font-size:12px;letter-spacing:3px;text-transform:uppercase">{brand}</td></tr>'
        '<tr><td style="padding:8px 0 20px;color:#141a16;font-size:22px;font-weight:bold">Novo agendamento de assessoria</td></tr>'
        f'<tr><td><table role="presentation" width="100%">{rows}</table></td></tr>'
        '<tr><td style="padding-top:24px;color:#8a938c;font-size:12px">'
        f'Enviado automaticamente pelo site {brand}. O agendamento também está disponível no painel administrativo.'
        '</td></tr></table></td></tr></table>'
    )
    try:
        await send_email(to=to, subject=subject, html=html)
        logger.info("Booking notification sent to %s", to)
    except Exception as e:
        logger.error("Booking notification failed: %s", e)
