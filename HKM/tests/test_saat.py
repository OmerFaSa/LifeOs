# -*- coding: utf-8 -*-
"""Saat dilimi — HATALAR KO-1.

UTC bir VPS'te «08:00 brifingi» Istanbul saatiyle 11:00'de gidiyor, HKM'nin
gunu 03:00'te donuyordu. Dilim surec basinda kurulur; testler bunu AYRI
SURECTE sinar, cunku dilim surece geneldir ve oteki testleri etkilemez.
"""

import os
import subprocess
import sys

from tests.harness import eq, ok, suite, test

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _kos(kod, tz="UTC"):
    env = dict(os.environ)
    if tz is None:
        env.pop("TZ", None)
    else:
        env["TZ"] = tz
    r = subprocess.run([sys.executable, "-c", kod], cwd=KOK, env=env,
                       capture_output=True, text=True, timeout=30)
    return (r.stdout or "").strip() + (r.stderr or "").strip()


def run():
    suite("saat dilimi")
    if not hasattr(__import__("time"), "tzset"):
        return

    def t_config_dilimi():
        c = _kos("from core import saat; import time; "
                 "print(saat.dilimi_kur({'saat_dilimi': 'Asia/Tokyo'}), time.strftime('%z'))")
        eq(c, "Asia/Tokyo +0900")
    test("config'teki dilim kurulur", t_config_dilimi)

    def t_varsayilan_istanbul():
        """UTC sunucuda da gun Istanbul'a gore doner."""
        c = _kos("from core import saat; import time; "
                 "print(saat.dilimi_kur({}), time.strftime('%z'))")
        eq(c, "Europe/Istanbul +0300")
    test("dilim yazilmamissa Istanbul", t_varsayilan_istanbul)

    def t_bozuk_dilim():
        """Taninmayan ad tahmin edilmez: dilim degismez ve soylenir."""
        c = _kos("from core import saat; import time; "
                 "print(saat.dilimi_kur({'saat_dilimi': 'Mars/Olympus'}), time.strftime('%z'))")
        ok(c.startswith("None +0000"), c)
    test("taninmayan dilim kurulmaz", t_bozuk_dilim)
