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


# Gun icinde BIRIKEN olculer: saat 10:00'daki «20 soru» olculmustur ama
# gunun degeri degildir (HATALAR O-9, DK-4). Gun surerken tabanin altindaki
# birikimli deger yargi degil, ara bilgidir. Tabani gecmis birikimli deger
# ise kesindir: sayim geri dusmez.
BIRIKIMLI = frozenset(("questions", "study_minutes", "practice_minutes"))

_KUCUK = {"I": "ı", "İ": "i"}


def _kucult(metin):
    if not metin:
        return metin
    ilk = metin[0]
    return _KUCUK.get(ilk, ilk.lower()) + metin[1:]


def gun_suruyor(audit):
    """Suren gunun denetimi: birikimli dusuk bulgular yargidan cikar.

    Ozgun denetime dokunmaz (ambardaki kayit ayni kalir); yeni bir sozluk
    dondurur. Bulgusu olmayan ya da yalniz birikimli olmayan bulgusu olan
    denetim oldugu gibi kalir."""
    if not audit:
        return audit
    yeni, degisti = [], False
    for f in audit.get("findings") or []:
        if f.get("metric") in BIRIKIMLI and f.get("tone") in ("warn", "danger"):
            f = dict(f, tone="info", suruyor=True,
                     text="Şimdilik " + _kucult(f["text"]))
            degisti = True
        yeni.append(f)
    if not degisti:
        return audit
    out = dict(audit, findings=yeni, suruyor=True)
    if not any(f["tone"] in ("warn", "danger") for f in yeni):
        # Kismi gun «onaylandi» da denemez: hukum icin gun henuz kapanmadi.
        out["verdict"] = INCOMPLETE
    return out


def read(payload, key):
    """Etiketli metrigi okur: (deger, kesinlik). Deger yoksa (None, 'missing')."""
    m = (payload or {}).get(key)
    if not isinstance(m, dict):
        return None, "missing"
    cert = m.get("cert")
    if not C.is_valid(cert):
        return None, "missing"
    return C.value_of(m), cert
