# -*- coding: utf-8 -*-
"""051 kabul testi: HKM/tests/test_hafiza_uc.py — hafiza ve kendiliginden King uclari HTTP'den sinanir.
Kosu: python tools/hafiza_uc_kabul_test.py"""
import os
import sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HKM = os.path.join(KOK, "HKM")
DOSYA = os.path.join(HKM, "tests", "test_hafiza_uc.py")
YOLLAR = ("/api/hafiza", "/api/hafiza/ara", "/duzelt", "/unut", "/api/olay",
          "/api/king/kendiliginden", "/api/king/bekleyen")


def main():
    assert os.path.isfile(DOSYA), "HKM/tests/test_hafiza_uc.py yok"
    metin = open(DOSYA, encoding="utf-8").read()
    eksik = [y for y in YOLLAR if y not in metin]
    assert not eksik, "cagrilmayan yollar: %s" % eksik
    run = open(os.path.join(HKM, "tests", "run.py"), encoding="utf-8").read()
    assert "test_hafiza_uc.run()" in run, "tests/run.py test_hafiza_uc.run() cagirmali"
    mimari = open(os.path.join(HKM, "MIMARI.md"), encoding="utf-8").read()
    assert "KING-OLAY.md" in mimari and "hafiza_gomme" in mimari, "HKM/MIMARI.md bolumu eksik"

    sys.path.insert(0, HKM)
    os.chdir(HKM)
    from tests import harness, test_hafiza_uc
    test_hafiza_uc.run()
    sonuc = [r for r in harness.RESULTS]
    kirmizi = [r for r in sonuc if r[2]]
    assert len(sonuc) >= 6, "en az 6 test, %d" % len(sonuc)
    assert not kirmizi, "kirmizi: %s" % kirmizi
    print("hafiza uc kabul: %d test yesil, %d yol cagriliyor." % (len(sonuc), len(YOLLAR)))


if __name__ == "__main__":
    main()
