"""charlesbannister.com contact form: emails each message to Charles via SES.
Spam guards: honeypot, minimum time on page, length limits, per-IP limit."""
import json
import os
import re
import time

import boto3

TO = os.environ["TO_ADDRESS"]
FROM = os.environ["FROM_ADDRESS"]
ALLOWED = {o.strip() for o in os.environ["ALLOWED_ORIGINS"].split(",") if o.strip()}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
LIMITS = {"name": 200, "company": 200, "email": 320, "phone": 50, "message": 5000}
MAX_PER_HOUR = 5
_hits: dict[str, list[float]] = {}
ses = boto3.client("sesv2")


def _log(outcome, **extra):
    print(json.dumps({"event": "contact_form", "outcome": outcome, **extra}))


def _reply(status, body):
    return {"statusCode": status, "headers": {"Content-Type": "application/json"},
            "body": json.dumps(body)}


def _throttled(ip):
    now = time.time()
    recent = [t for t in _hits.get(ip, []) if now - t < 3600]
    recent.append(now)
    _hits[ip] = recent
    return len(recent) > MAX_PER_HOUR


def handler(event, context):
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    origin = headers.get("origin", "")
    ip = event.get("requestContext", {}).get("http", {}).get("sourceIp", "?")
    if event.get("requestContext", {}).get("http", {}).get("method") != "POST":
        return _reply(405, {"ok": False})
    if origin not in ALLOWED:
        _log("bad_origin", origin=origin[:100])
        return _reply(403, {"ok": False})
    try:
        data = json.loads(event.get("body") or "{}")
        assert isinstance(data, dict)
    except Exception:
        _log("bad_json")
        return _reply(400, {"ok": False, "error": "Something went wrong. Please try again."})

    # Bots: pretend it worked so they learn nothing.
    if str(data.get("website") or "").strip():
        _log("honeypot")
        return _reply(200, {"ok": True})
    try:
        elapsed = float(data.get("elapsed_ms") or 0)
    except (TypeError, ValueError):
        elapsed = 0
    if elapsed < 3000:
        _log("too_fast", elapsed_ms=elapsed)
        return _reply(200, {"ok": True})

    f = {k: str(data.get(k) or "").strip() for k in LIMITS}
    if not f["name"] or not f["message"] or not EMAIL_RE.match(f["email"]):
        _log("invalid")
        return _reply(400, {"ok": False, "error": "Please add your name, a valid email address and a message."})
    if any(len(f[k]) > n for k, n in LIMITS.items()):
        _log("too_long")
        return _reply(400, {"ok": False, "error": "That message is a bit long. Please shorten it."})
    if _throttled(ip):
        _log("throttled")
        return _reply(429, {"ok": False, "error": "Thanks, I've already got your messages. I'll be in touch."})

    one_line = lambda s: re.sub(r"[\r\n]+", " ", s)
    subject = f"Website message from {one_line(f['name'])[:80]}"
    if f["company"]:
        subject += f" ({one_line(f['company'])[:60]})"
    body = "\n".join([
        f"Name: {f['name']}",
        f"Company: {f['company'] or '-'}",
        f"Email: {f['email']}",
        f"Phone: {f['phone'] or '-'}",
        "",
        f["message"],
        "",
        "-- Sent from the contact form on charlesbannister.com. Reply to answer them.",
    ])
    try:
        ses.send_email(
            FromEmailAddress=FROM,
            Destination={"ToAddresses": [TO]},
            ReplyToAddresses=[one_line(f["email"])],
            Content={"Simple": {"Subject": {"Data": subject, "Charset": "UTF-8"},
                                "Body": {"Text": {"Data": body, "Charset": "UTF-8"}}}},
        )
    except Exception as exc:
        _log("send_failed", error=type(exc).__name__)
        return _reply(502, {"ok": False, "error": "Sorry, that didn't send. Please try again in a minute."})
    _log("sent", has_company=bool(f["company"]), has_phone=bool(f["phone"]))
    return _reply(200, {"ok": True})
