"""Sync — etiketsiz sayi ambara GIRMEZ.

Iki kural:
  1. Govdedeki her metrik alani {value, cert} bicimindedir ve cert dort
     etiketten biridir. Degilse istek 422 ile reddedilir.
  2. Dogrulama metni ya da veriyi YENIDEN YAZMAZ. Sessizce duzeltmek,
     anlami tersine cevirebilir; bu depodaki kanitlanmis desen reddet-ve-dus.
"""

import datetime
import hmac
import math

from core import certainty as C
from core import db, thresholds, vp_academic, vp_bio, vp_intellect

MODULES = {
    "ays": vp_academic,
    "spi": vp_bio,
    "esp": vp_intellect,
}

# Metrik olmayan, serbest alanlar: etiket aranmaz.
PASSTHROUGH = {"module", "date", "profile", "notes", "version"}

# Etiket TEK BASINA yetmez. «ölçüldü» etiketli bir `true`, bir NaN ya da
# -200 saatlik bir uyku, etiketi dogru olsa da OLCUM DEGILDIR: ambara
# girdigi an butun turetilmis katmanlari (ikiz, capraz, seri, etki)
# sessizce zehirler.
#
# Aralik, bilinen metrikler icin yazilir; bilinmeyen bir metrik yine
# kabul edilir ama SONLU bir sayi olmak zorundadir. Bilinmeyeni reddetmek
# isaretin genislemesini (beacon v2) her seferinde merkeze bagimli
# kilardi; sonsuzu kabul etmekse olcumu anlamsiz kilar.
RANGES = {
    "sleep_hours": (0, 24), "recovery": (0, 100), "hrv": (0, 400),
    "hrv_baseline": (0, 400), "weight": (0, 500), "rhr": (0, 250),
    "sbp": (0, 300), "dbp": (0, 250), "waist": (0, 300), "water": (0, 20000),
    "protein_g": (0, 1000), "kcal": (0, 20000), "train_minutes": (0, 1440),
    "symptom_count": (0, 100),
    "questions": (0, 5000), "study_minutes": (0, 1440),
    "mock_net": (-100, 200), "mock_net_baseline": (-100, 200),
    "exam_days_left": (-3650, 3650), "plan_blocks": (0, 100),
    "plan_done": (0, 100), "paragraph_done": (0, 1000),
    "problem_done": (0, 1000), "correct_questions": (0, 5000),
    "exam_count": (0, 10000), "cards_total": (0, 100000),
    "cards_due": (0, 100000), "errors_open": (0, 100000),
    "retention": (0, 1), "retention_cards": (0, 100000),
    "practice_minutes": (0, 1440), "synthesis_gap_days": (0, 3650),
    "sessions": (0, 100),
    # Seviye sistemi — ucunde de ayni anlam. Ust sinirlar comert: esikler
    # brand/seviye/kademeler.js icinde degisebilir ve merkezin o dosyayi
    # bilmesi gerekmemeli (isaret genisleyebilmeli).
    "xp_today": (0, 100000), "xp_total": (0, 100000000),
    "level_step": (0, 1000), "level_tier": (0, 100),
    "level_sub": (0, 100),
}


def _sayi_mi(v):
    """Sonlu bir sayi mi? Python'da bool bir int'tir: True degeri
    isinstance(v, int) denetiminden GECER ve «1 saat uyku» olur."""
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        return False
    return math.isfinite(v)


# Birim ekleri: «disc.lang.minutes» gibi genisleyen adlarda son parca
# birimi soyler. Her yeni disiplin icin ayri bir aralik yazmak yerine
# birimin kendisine bir aralik verilir.
UNIT_RANGES = {"minutes": (0, 1440), "hours": (0, 24), "days": (0, 3650),
               "count": (0, 100000), "pct": (0, 100)}


def _aralik(key):
    """Noktali metrik adlari (disc.lang.minutes) son parcasiyla eslesir."""
    if key in RANGES:
        return RANGES[key]
    son = key.rsplit(".", 1)[-1]
    if son in RANGES:
        return RANGES[son]
    return UNIT_RANGES.get(son) or UNIT_RANGES.get(son.rsplit("_", 1)[-1])


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
            g = datetime.date.fromisoformat(date)
        except ValueError:
            errors.append("date cozulemedi: %r" % (date,))
        else:
            # Gelecege ait bir olcum, olcum degildir.
            if g > datetime.date.today() + datetime.timedelta(days=1):
                errors.append("date gelecekte: %r" % (date,))

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
        if m["cert"] == "missing":
            if m.get("value") is not None:
                errors.append("%s: veri yok etiketiyle deger gonderilemez" % key)
            continue
        deger = m.get("value")
        if not _sayi_mi(deger):
            errors.append("%s: %s etiketli alanda sonlu bir sayi yok (%r)"
                          % (key, m["cert"], deger))
            continue
        aralik = _aralik(key)
        if aralik and not (aralik[0] <= deger <= aralik[1]):
            errors.append("%s: %r degeri %s–%s araliginin disinda"
                          % (key, deger, aralik[0], aralik[1]))

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
