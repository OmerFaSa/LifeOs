#!/usr/bin/env python3
"""veri_cikar / veri_gece dogrulama kurallarinin testi. Model gerektirmez.
    python tools/veri_test.py
"""
import sys, unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import veri_cikar as vc
import veri_gece as vg
import veri_ek as ek
import veri_gezgin as gz
from veri_topla import html_metin

PARCA = "Thales, MÖ 624 yılında Miletos'ta doğdu. Ona göre yaşamın kaynağı sudur ve her şey sudan oluşur."


class Alinti(unittest.TestCase):
    def test_birebir_alinti_kabul(self):
        self.assertTrue(vc.alinti_dogru("Ona göre yaşamın kaynağı sudur ve her şey sudan oluşur.", PARCA))

    def test_bosluk_ve_buyuk_harf_farki_onemsiz(self):
        self.assertTrue(vc.alinti_dogru("ona göre  yaşamın kaynağı\nsudur ve her şey sudan oluşur.", PARCA))

    def test_kaynakta_olmayan_alinti_red(self):
        self.assertFalse(vc.alinti_dogru("Thales aynı zamanda ilk matematik okulunu kurmuştur.", PARCA))

    def test_kisa_alinti_red(self):
        self.assertFalse(vc.alinti_dogru("Thales", PARCA))


class OlguKurallari(unittest.TestCase):
    def test_gecerli(self):
        o = {"baslik": "Doğum", "olgu": "Thales MÖ 624'te doğdu.", "alinti": "Thales, MÖ 624 yılında Miletos'ta doğdu."}
        self.assertIsNone(vg.olgu_gecerli(o, PARCA))

    def test_olgudaki_sayi_alintida_yoksa_red(self):
        o = {"baslik": "Doğum", "olgu": "Thales MÖ 640'ta doğdu.", "alinti": "Thales, MÖ 624 yılında Miletos'ta doğdu."}
        self.assertEqual(vg.olgu_gecerli(o, PARCA), "sayi-alintida-yok")

    def test_eksik_alan_sema_hatasi(self):
        self.assertEqual(vg.olgu_gecerli({"baslik": "x", "olgu": "y"}, PARCA), "sema")

    def test_uydurma_alinti(self):
        o = {"baslik": "x", "olgu": "Thales hekimdi.", "alinti": "Thales aynı zamanda ünlü bir hekim olarak bilinirdi."}
        self.assertEqual(vg.olgu_gecerli(o, PARCA), "alinti-kaynakta-yok")


class Tablo(unittest.TestCase):
    METIN = "\n".join(["TYT Matematik Konulara Göre Yıllık Soru Dağılımı", "Konu | 2025 | 2024 | 2023",
                       "Temel Kavramlar | 2 | 1 | –", "Problemler | 12 | 11 | 13", "TOPLAM | 30 | 30 | 30"])

    def test_tire_veri_yok_sifir_degil(self):
        k = vc.parse_tablolar(self.METIN, "t")
        self.assertIsNone(k[0]["yillar"]["2023"])
        self.assertNotEqual(k[0]["yillar"]["2023"], 0)

    def test_etiket_ikincil_kaynakta_tahmin(self):
        self.assertTrue(all(r["etiket"] == "tahmin" for r in vc.parse_tablolar(self.METIN, "t")))

    def test_bolum_baslikten_gelir(self):
        self.assertIn("Matematik", vc.parse_tablolar(self.METIN, "t")[0]["bolum"])

    def test_toplam_tablosu(self):
        m = "Türkçe\nKonu | Toplam Soru Sayısı (2018-2025)\nParagrafta Anlam | 164\nSözcükte Anlam | 29"
        k = vc.parse_tablolar(m, "t")
        self.assertEqual([r["toplam"] for r in k], [164, 29])


class Html(unittest.TestCase):
    def test_tablo_satiri_tek_satir(self):
        h = "<table><tr><td>Konu</td><td>2025</td></tr><tr><td><p>Mutlak\nDeğer</p></td><td>2</td></tr></table>"
        self.assertIn("Mutlak Değer | 2", html_metin(h))

    def test_script_atlanir(self):
        self.assertNotIn("alert", html_metin("<p>merhaba</p><script>alert(1)</script>"))


class Gezgin(unittest.TestCase):
    IZIN = {"www.who.int": "x", "tr.wikipedia.org": "y"}

    def test_yalniz_https_ve_izinli_alan(self):
        self.assertTrue(gz.alan_izinli("https://www.who.int/news", self.IZIN))
        self.assertFalse(gz.alan_izinli("http://www.who.int/news", self.IZIN))
        self.assertFalse(gz.alan_izinli("https://kotu.example/x", self.IZIN))

    def test_alt_alan_adi_kandirmacasi(self):
        self.assertFalse(gz.alan_izinli("https://www.who.int.kotu.com/x", self.IZIN))
        self.assertFalse(gz.alan_izinli("https://kotu.com/www.who.int", self.IZIN))

    def test_calistirilabilir_dosya_ve_medya_yasak(self):
        self.assertFalse(gz.alan_izinli("https://www.who.int/a/setup.exe", self.IZIN))
        self.assertFalse(gz.alan_izinli("https://www.who.int/a/video.mp4?x=1", self.IZIN))
        self.assertTrue(gz.alan_izinli("https://www.who.int/a/rehber.pdf", self.IZIN))

    def test_baglantilar_filtreler_ve_mutlaklastirir(self):
        h = '<a href="/a">Bir</a><a href="https://kotu.example/">Kötü</a><a href="mailto:x@y">Posta</a><a href="/a#k">Bir</a><a href="/b"></a>'
        b = gz.baglantilar(h, "https://www.who.int/x", self.IZIN)
        self.assertEqual(b, [("https://www.who.int/a", "Bir")])

    def test_secim_gecersiz_indeksleri_atar(self):
        self.assertEqual(gz.gecerli_secim({"secilen": [1, 1, 99, -1, True, "2", 0]}, 5, 6), [1, 0])
        self.assertEqual(gz.gecerli_secim({"secilen": list(range(10))}, 10, 3), [0, 1, 2])
        self.assertEqual(gz.gecerli_secim("bozuk", 5, 3), [])

    def test_birincil_kurumlar(self):
        self.assertEqual(gz.duzey("www.who.int"), "birincil")
        self.assertEqual(gz.duzey("tr.wikipedia.org"), "ikincil")


class Ek(unittest.TestCase):
    def test_japonca_gurultu_filtresi(self):
        m = "の\nEOS\nは\ne\n日本語\n#\nabc"
        k = ek.japonca_filtre(m, 10)
        self.assertEqual([x["kelime"] for x in k], ["の", "は", "日本語"])
        self.assertEqual([x["sira"] for x in k], [1, 3, 5])

    def test_wiktionary_turkce_ceviri(self):
        wt = ("{{trans-top|liquid}}\n* Turkish: {{t+|tr|su}}\n* German: {{t+|de|Wasser}}\n"
              "{{trans-top|body of water}}\n* Turkish: {{t|tr|deniz}}, {{t+|tr|göl}}")
        self.assertEqual(ek.ceviri_cikar(wt), [{"anlam_en": "liquid", "tr": ["su"]},
                                                {"anlam_en": "body of water", "tr": ["deniz", "göl"]}])

    def test_ceviri_yoksa_bos(self):
        self.assertEqual(ek.ceviri_cikar("* German: {{t+|de|Wasser}}"), [])

    def test_anlam_yalniz_ilgili_dil_bolumu(self):
        wt = "==German==\n===Noun===\n# {{lb|de|rare}} [[house]], [[building]]\n# a [[home]]\n==French==\n# yanlis"
        self.assertEqual(ek.anlam_cikar(wt, "German"), ["house, building", "a home"])
        self.assertEqual(ek.anlam_cikar(wt, "Spanish"), [])

    def test_tatoeba_ciftleri_kisa_once_ve_tekrarsiz(self):
        tur = {"1": "Merhaba nasılsın bugün?", "2": "Selam dostum benim.", "3": "Çok kısa"}
        yab = {"10": "Hello, how are you today?", "20": "Hi my friend."}
        c = ek.tatoeba_ciftleri(tur, yab, ["1\t10", "2\t20", "3\t20", "9\t10"], 5)
        self.assertEqual([x[0] for x in c], ["Selam dostum benim.", "Merhaba nasılsın bugün?"])

    def test_osym_linkleri(self):
        h = ('<a href="https://dokuman.osym.gov.tr/pdfdokuman/2025/YKS/TSK/a.pdf ">A</a>'
             '<a href="https://dokuman.osym.gov.tr/pdfdokuman/yasakli-ve-izinli-belgeler.pdf">Y</a>')
        self.assertEqual(ek.osym_pdf_linkleri(h), ["https://dokuman.osym.gov.tr/pdfdokuman/2025/YKS/TSK/a.pdf"])


if __name__ == "__main__":
    unittest.main(verbosity=1)
