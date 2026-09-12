"""Sync — etiketsiz sayi ambara GIRMEZ.

Iki kural:
  1. Govdedeki her metrik alani {value, cert} bicimindedir ve cert dort
     etiketten biridir. Degilse istek 422 ile reddedilir.
  2. Dogrulama metni ya da veriyi YENIDEN YAZMAZ. Sessizce duzeltmek,
     anlami tersine cevirebilir; bu depodaki kanitlanmis desen reddet-ve-dus.
"""

import datetime
import hmac

from core import certainty as C
from core import db, thresholds, vp_academic, vp_bio, vp_intellect

MODULES = {
    "ays": vp_academic,
    "spi": vp_bio,
    "esp": vp_intellect,
}

# Metrik olmayan, serbest alanlar: etiket aranmaz.
PASSTHROUGH = {"module", "date", "profile", "notes", "version"}


def check_token(given, expected):
    """Zamanlama sizintisi olmasin diye compare_digest."""
    if not expected:
        return False
    return hmac.compare_digest(str(given or ""), str(expected))


def validate(body):
    """(ok, hatalar) dondurur. Hicbir sey duzeltmez, yalnizca isaretler."""
    errors = []
    if not isinstance(body, dict):
        return False, ["govde bir JSON nesnesi olmali"]

    mod = body.get("module")
    if mod not in MODULES:
        errors.append("bilinmeyen modul: %r" % (mod,))

    date = body.get("date")
    if not isinstance(date, str) or len(date) != 10:
        errors.append("date ISO yyyy-mm-dd olmali")
    else:
        try:
            datetime.date.fromisoformat(date)
        except ValueError:
            errors.append("date cozulemedi: %r" % (date,))

    metrics = body.get("metrics")
    if not isinstance(metrics, dict) or not metrics:
        errors.append("metrics bos olamaz")
        return (not errors), errors

    for key, m in metrics.items():
        if key in PASSTHROUGH:
            continue
        if not isinstance(m, dict) or "cert" not in m:
            errors.append("%s: kesinlik etiketi yok" % key)
            continue
        if not C.is_valid(m["cert"]):
            errors.append("%s: gecersiz etiket %r" % (key, m["cert"]))
            continue
        if m["cert"] != "missing" and not isinstance(m.get("value"), (int, float)):
            errors.append("%s: %s etiketli alanda sayi yok" % (key, m["cert"]))

    return (not errors), errors


def ingest(con, body, now=None, th=None):
    """Dogrula, ambara koy, ilgili VP'yi kosur. Hata durumunda HICBIR SEY yazmaz."""
    ok, errors = validate(body)
    if not ok:
        return {"status": 422, "errors": errors}

    now = now or datetime.datetime.now().isoformat(timespec="seconds")
    th = th or thresholds.load()
    mod = body["module"]
    event_id = db.insert_event(con, mod, body["date"], now, body)
    result = MODULES[mod].audit(body["metrics"], th)
    audit_id = db.insert_audit(con, event_id, result["vp"], result["verdict"],
                               result["findings"], now)
    return {"status": 202, "event_id": event_id, "audit_id": audit_id,
            "audit": result}


def latest_audits(con, date):
    """Gunun her VP'si icin en son denetim."""
    out = {}
    rows = con.execute(
        "SELECT a.* FROM audits a JOIN raw_events e ON e.id = a.event_id "
        "WHERE e.date=? ORDER BY a.id", (date,)).fetchall()
    import json
    for r in rows:
        out[r["vp"]] = {"id": r["id"], "vp": r["vp"], "verdict": r["verdict"],
                        "findings": json.loads(r["findings"])}
    return out
