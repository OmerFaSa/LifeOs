#!/usr/bin/env python3
"""tools/veri_dogrula.py icindeki saf islevlerin unit testleri."""

import unittest
import sys
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
        self.assertEqual(veri_dogrula.birim_kalip("g"), ("", r"\s*(?:g|gram)(?![" + veri_dogrula.HARF + "])"))
        self.assertEqual(veri_dogrula.birim_kalip("litre"), ("", r"\s*(?:litre|lt|l)(?![" + veri_dogrula.HARF + "])"))

    def test_sayi_kaliplari_ve_bul(self):
        satirlar1 = ["Demir 15 mg"]
        satir, alinti = veri_dogrula.bul(satirlar1, ["demir"], ["15"], "mg")
        self.assertEqual(satir, 1)
        self.assertIn("15 mg", alinti)

        satirlar2 = ["Protein 45 - 60 g"]
        satir, alinti = veri_dogrula.bul(satirlar2, ["protein"], ["45", "60"], "g")
        self.assertEqual(satir, 1)

        satirlar3 = ["Enerji 112,5 kcal"]
        satir, alinti = veri_dogrula.bul(satirlar3, ["enerji"], ["12", "5"], "kcal")
        self.assertIsNone(satir)

    def test_cinsiyet_ve_grup_filtresi(self):
        satirlar = [
            "Demir 15 mg bebek",
            "Demir 15 mg yetiskin erkek"
        ]
        satir, alinti = veri_dogrula.bul(satirlar, ["demir"], ["15"], "mg", cinsiyet="erkek")
        self.assertEqual(satir, 2)


if __name__ == "__main__":
    unittest.main()
