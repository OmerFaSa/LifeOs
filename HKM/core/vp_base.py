"""VP'lerin ortak iskeleti — saf kural motoru, model katmani YOK.

Bir VP'nin uc hukmu vardir:
  APPROVED   — olculmus veri esikleri gecti
  INCOMPLETE — hukum verecek veri yok (SIFIR DEGIL, YOK)
  ANOMALY    — olculmus veri bir esigi kirdi

Ucuncu hukum ikinciyle asla karistirilmaz: veri yoklugu bir anomali degildir.
"""

from core import certainty as C

APPROVED = "APPROVED"
INCOMPLETE = "INCOMPLETE"
ANOMALY = "ANOMALY"


def finding(code, text, tone="warn", metric=None, cert=None):
    return {"code": code, "text": text, "tone": tone,
            "metric": metric, "cert": cert}


def verdict_of(findings, missing):
    """Bulgulardan hukum: once anomali, sonra eksiklik, sonra onay."""
    if any(f["tone"] == "danger" or f["tone"] == "warn" for f in findings):
        return ANOMALY
    if missing:
        return INCOMPLETE
    return APPROVED


def read(payload, key):
    """Etiketli metrigi okur: (deger, kesinlik). Deger yoksa (None, 'missing')."""
    m = (payload or {}).get(key)
    if not isinstance(m, dict):
        return None, "missing"
    cert = m.get("cert")
    if not C.is_valid(cert):
        return None, "missing"
    return C.value_of(m), cert
