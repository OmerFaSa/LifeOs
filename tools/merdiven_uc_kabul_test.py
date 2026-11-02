# -*- coding: utf-8 -*-
"""064 kabul testi: HKM/tests/test_merdiven_uc.py — A6 model merdiveni ve §H kart cumlesi uclari HTTP'den sinanir.
Kosu: python tools/merdiven_uc_kabul_test.py"""
import os
import sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HKM = os.path.join(KOK, "HKM")
DOSYA = os.path.join(HKM, "tests", "test_merdiven_uc.py")
YOLLAR = ("/api/ai_olcum", "/api/king/cumle", "seviyeler", "dususler")


def main():
    assert os.path.isfile(DOSYA), "HKM/tests/test_merdiven_uc.py yok"
    metin = open(DOSYA, encoding="utf-8").read()
    eksik = [y for y in YOLLAR if y not in metin]
    assert not eksik, "eksik: %s" % eksik
    run = open(os.path.join(HKM, "tests", "run.py"), encoding="utf-8").read()
    assert "test_merdiven_uc.run()" in run, "tests/run.py test_merdiven_uc.run() cagirmali"
    mimari = open(os.path.join(HKM, "MIMARI.md"), encoding="utf-8").read()
    for k in ("RESOURCE_EXHAUSTED", "/api/king/cumle", "usage.seviye", "zorluk"):
        assert k in mimari, "HKM/MIMARI.md bolumunde yok: %s" % k

    sys.path.insert(0, HKM)
    os.chdir(HKM)
    from tests import harness, test_merdiven_uc
    test_merdiven_uc.run()
    sonuc = [r for r in harness.RESULTS]
    kirmizi = [r for r in sonuc if r[2]]
    assert len(sonuc) >= 4, "en az 4 test, %d" % len(sonuc)
    assert not kirmizi, "kirmizi: %s" % kirmizi
    print("merdiven uc kabul: %d test yesil." % len(sonuc))


if __name__ == "__main__":
    main()
