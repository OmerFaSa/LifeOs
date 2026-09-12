"""Dort etiketli kesinlik sozlugu — AYS/SPI/ESP ile bayt bayt ayni anlam.

    measured   olculdu    — cihaz ya da kullanici girdi
    estimated  tahmin     — bir modelden turetildi
    computed   hesaplandi — olculmus sayilardan uretildi
    missing    veri yok   — hicbir sey girilmedi

Eksik veri SIFIR DEGILDIR. Bir metrik alani bu etiketi tasimiyorsa sync
katmani onu reddeder (422); sessizce «0, olculdu» diye ambara girmesi
doktrini sinirda oldurur.
"""

LABELS = {
    "measured": "olculdu",
    "estimated": "tahmin",
    "computed": "hesaplandi",
    "missing": "veri yok",
}

VALID = set(LABELS)


def is_valid(cert):
    return cert in VALID


def metric(value, cert):
    """Tek bir metrik alani: {'value': ..., 'cert': ...}."""
    if not is_valid(cert):
        raise ValueError("gecersiz kesinlik etiketi: %r" % (cert,))
    if cert == "missing":
        return {"value": None, "cert": "missing"}
    return {"value": value, "cert": cert}


def value_of(m):
    """Olculmus/hesaplanmis degeri dondurur; yoksa None. Asla 0 uretmez."""
    if not isinstance(m, dict):
        return None
    if m.get("cert") == "missing":
        return None
    v = m.get("value")
    return v if isinstance(v, (int, float)) else None


def known(m):
    return value_of(m) is not None
