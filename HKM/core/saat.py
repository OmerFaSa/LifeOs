"""HKM'nin saati — «bugun» tek yerden okunur.

Gun siniri kurali modullerde duzeltilmisti, HKM'de 50'den fazla yerde
`date.today()` daginiktı (HATALAR KO-1). Yeni kod gunu buradan okur.
"""

import contextlib
import datetime
import os
import re
import time

# Testler «bugun»u sabitler: sabit tarihli bir senaryo o gunu yasiyormus
# gibi kosar. Uretimde hep None.
SABIT = None


@contextlib.contextmanager
def sabit(gun):
    global SABIT
    eski, SABIT = SABIT, gun
    try:
        yield
    finally:
        SABIT = eski


# HATALAR KO-1: UTC bir VPS'te (ya da TZ=UTC tasiyan bir kapta) «08:00
# brifingi» Istanbul saatiyle 11:00'de gidiyor, HKM'nin gunu 03:00'te
# donuyordu. Dilim SUREC BASINDA kurulur (daemon, hkm.py); boylece her
# `date.today()` / `datetime.now()` kullanicinin gununu gorur. Sira:
# config.json «saat_dilimi» > Europe/Istanbul. Ortamdaki TZ'ye bakilmaz:
# kaplarin cogu TZ=UTC tasir ve bu tam da duzeltilen durumdur.
VARSAYILAN_DILIM = "Europe/Istanbul"
_DILIM_AD = re.compile(r"^[A-Za-z][A-Za-z0-9_+-]*(?:/[A-Za-z0-9_+-]+){0,2}$")


def _dilim_var(ad):
    if not ad or not _DILIM_AD.match(ad):
        return False
    try:
        import zoneinfo
        zoneinfo.ZoneInfo(ad)
        return True
    except ImportError:                          # pragma: no cover (py<3.9)
        return os.path.exists(os.path.join("/usr/share/zoneinfo", ad))
    except Exception:                            # noqa: BLE001
        return False


def dilimi_kur(cfg):
    """Surecin saat dilimini kurar; kurulan adi ya da None dondurur.

    Taninmayan ad TAHMIN EDILMEZ: dilim degismez, None doner ve cagiran
    bunu soyler."""
    ad = str((cfg or {}).get("saat_dilimi") or VARSAYILAN_DILIM).strip()
    if not hasattr(time, "tzset") or not _dilim_var(ad):
        return None
    os.environ["TZ"] = ad
    time.tzset()
    return ad


def simdi():
    return datetime.datetime.now()


def bugun(now=None):
    """ISO gun. `now` bir datetime ya da ISO metin olabilir (testler icin)."""
    if now is None:
        return SABIT or simdi().date().isoformat()
    if isinstance(now, (datetime.datetime, datetime.date)):
        return now.isoformat()[:10]
    return str(now)[:10]
