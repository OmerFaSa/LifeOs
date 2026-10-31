#!/usr/bin/env python3
"""tools/veri_dogrula.py saf islevlerinin testleri (gorev 008; Claude Code duzeltti: cinsiyet, Yunan mu).
python3 tools/veri_dogrula_test.py"""

import re
import sys
import unittest
from pathlib import Path

# tools klasorunu path'e ekle
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

import veri_dogrula


class VeriDogrulaTest(unittest.TestCase):

    def test_sayilar(self):
        self.assertEqual(veri_dogrula.sayilar("45 - 60"), ["45", "60"])
        self.assertEqual(veri_dogrula.sayilar("< 10 (ideal < 5)"), ["10"])
        self.assertEqual(veri_dogrula.sayilar("15 (600 IU)"), ["15"])
        self.assertEqual(veri_dogrula.sayilar("1,5"), ["1,5"])

    def test_birim_kalip(self):
        self.assertEqual(veri_dogrula.birim_kalip("%"), (r"%\s*", ""))
        self.assertEqual(veri_dogrula.birim_kalip("mg"), ("", r"\s*mg"))
        self.assertEqual(veri_dogrula.birim_kalip("mcg"), ("", r"\s*(?:µg|μg|mcg|mikrogram)"))
        self.assertEqual(veri_dogrula.birim_kalip("µg"), ("", r"\s*(?:µg|μg|mcg|mikrogram)"))
        self.assertEqual(veri_dogrula.birim_kalip("μg"), veri_dogrula.birim_kalip("mcg"))  # Yunan mu
        self.assertEqual(veri_dogrula.birim_kalip("l"), veri_dogrula.birim_kalip("litre"))
        self.assertIsNone(re.search(veri_dogrula.birim_kalip("l")[1], " lif"))
        self.assertIsNone(re.search(veri_dogrula.birim_kalip("g")[1], " gün"))
        self.assertEqual(veri_dogrula.birim_kalip("g"), ("", r"\s*(?:g|gram)(?![" + veri_dogrula.HARF + "])"))
        self.assertEqual(veri_dogrula.birim_kalip("litre"), ("", r"\s*(?:litre|lt|l)(?![" + veri_dogrula.HARF + "])"))

    def test_sayi_kaliplari_ve_bul(self):
        satir, alinti = veri_dogrula.bul(["Başlık", "Demir 15 mg"], ["demir"], ["15"], "mg")
        self.assertEqual((satir, alinti), (2, "Demir 15 mg"))
        # 3+ bosluk sutun ayirir: ad ile sayi ayri sutundaysa eslesme yok (docstring: ayni parcada)
        satir, _ = veri_dogrula.bul(["Demir    15 mg"], ["demir"], ["15"], "mg")
        self.assertIsNone(satir)

        satirlar_aralik = ["Karbonhidrat %45-60"]
        satir, alinti = veri_dogrula.bul(satirlar_aralik, ["karbonhidrat"], ["45", "60"], "%")
        self.assertEqual(satir, 1)

        # 12,5 aranirken 112,5 eslesmemeli
        satirlar_ondalik = ["Enerji   112,5 kcal"]
        satir, alinti = veri_dogrula.bul(satirlar_ondalik, ["enerji"], ["12,5"], "kcal")
        self.assertIsNone(satir)

        satirlar_ondalik_dogru = ["Enerji 12,5 kcal"]
        satir, alinti = veri_dogrula.bul(satirlar_ondalik_dogru, ["enerji"], ["12,5"], "kcal")
        self.assertEqual(satir, 1)

        # 80 karakterden uzak sayi bulunmamali (YAKIN siniri)
        uzak_satir = ["Demir" + " " * 85 + "15 mg"]
        satir, alinti = veri_dogrula.bul(uzak_satir, ["demir"], ["15"], "mg")
        self.assertIsNone(satir)

    def test_cinsiyet_ve_grup_filtresi(self):
        satirlar = [
            "Demir 15 mg çocuk",
            "Demir 15 mg gebe",
            "Demir 15 mg kadın",
            "Demir 15 mg erkek"
        ]
        satir, alinti = veri_dogrula.bul(satirlar, ["demir"], ["15"], "mg", cinsiyet="erkek")
        self.assertEqual(satir, 4)                       # kadin satiri (3) alt satirdaki «erkek» ile aklanmaz
        satir, _ = veri_dogrula.bul(["Demir 15 mg kadın", "Demir 15 mg erkek"], ["demir"], ["15"], "mg", cinsiyet="erkek")
        self.assertEqual(satir, 2)
        satir, _ = veri_dogrula.bul(["Demir 15 mg kadın"], ["demir"], ["15"], "mg", cinsiyet="erkek")
        self.assertIsNone(satir)
        satir, _ = veri_dogrula.bul(["Demir 15 mg çocuk"], ["demir"], ["15"], "mg")
        self.assertIsNone(satir)


if __name__ == "__main__":
    unittest.main()
