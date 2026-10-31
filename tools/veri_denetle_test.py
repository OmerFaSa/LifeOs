#!/usr/bin/env python3
"""veri_denetle birim testleri (kenar durumlar).
Kullanim: python tools/veri_denetle_test.py
"""
import sys
import tempfile
import unittest
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "tools"))
import veri_denetle as vd


class TestKaynakGecerli(unittest.TestCase):
    def test_url_protokolleri(self):
        self.assertTrue(vd.kaynak_gecerli("http://ornek.org"))
        self.assertTrue(vd.kaynak_gecerli("https://ornek.org/yol?a=1&b=2"))
        self.assertTrue(vd.kaynak_gecerli("HTTP://ORNEK.ORG/TEST"))
        self.assertTrue(vd.kaynak_gecerli("Https://Ornek.Org/Test"))

    def test_gecersiz_urller(self):
        self.assertFalse(vd.kaynak_gecerli("httpx-kitap"))
        self.assertFalse(vd.kaynak_gecerli("http:ornek.org"))
        self.assertFalse(vd.kaynak_gecerli("ftp://ornek.org"))
        self.assertFalse(vd.kaynak_gecerli("file:///ornek"))
        self.assertFalse(vd.kaynak_gecerli("http"))
        self.assertFalse(vd.kaynak_gecerli("https"))
        self.assertFalse(vd.kaynak_gecerli(""))

    def test_tip_guvenligi(self):
        self.assertFalse(vd.kaynak_gecerli(None))
        self.assertFalse(vd.kaynak_gecerli(123))
        self.assertFalse(vd.kaynak_gecerli(["http://ornek.org"]))
        self.assertFalse(vd.kaynak_gecerli({"url": "http://ornek.org"}))

    def test_yerel_ham_meta(self):
        ham_dizin = vd.VERI / "ham"
        test_meta = ham_dizin / "birim_test_kaynak.meta.json"
        ham_dizin.mkdir(parents=True, exist_ok=True)
        try:
            test_meta.write_text("{}", encoding="utf-8")
            self.assertTrue(vd.kaynak_gecerli("birim_test_kaynak"))
            self.assertFalse(vd.kaynak_gecerli("olmayan_kaynak_kimligi"))
        finally:
            if test_meta.exists():
                test_meta.unlink()


class TestDenetleKayit(unittest.TestCase):
    def test_nesne_olmayan_tipler(self):
        for degersiz in (None, 123, 45.67, "metin", [1, 2], True, False):
            self.assertEqual(vd.denetle_kayit("temiz", "a.jsonl", degersiz), ["nesne değil"])
            self.assertEqual(vd.denetle_kayit("taslak", "a.jsonl", degersiz), ["nesne değil"])
            self.assertEqual(vd.denetle_kayit("temiz", "reddedilen.jsonl", degersiz), ["nesne değil"])

    def test_reddedilen(self):
        self.assertEqual(vd.denetle_kayit("temiz", "reddedilen.jsonl", {"neden": "hata"}), [])
        self.assertEqual(vd.denetle_kayit("temiz", "reddedilen.jsonl", {"x": 1}), ["neden yok"])

    def test_taslak_kurallari(self):
        self.assertEqual(vd.denetle_kayit("taslak", "a.jsonl", {"etiket": "dogrulanmamis"}), [])
        self.assertIn("etiket 'bilinmeyen'", vd.denetle_kayit("taslak", "a.jsonl", {"etiket": "bilinmeyen"}))
        hata = vd.denetle_kayit("taslak", "a.jsonl", {"etiket": "dogrulanmamis", "kaynak": "http://x"})
        self.assertIn("'kaynak' alani var", hata)

    def test_temiz_kurallari(self):
        kayit = {"etiket": "kaynakli-birincil", "kaynak": "https://ornek.org", "alinti": "metin"}
        self.assertEqual(vd.denetle_kayit("temiz", "a.jsonl", kayit), [])

        kayit_tatoeba = {"etiket": "kaynakli-ikincil", "kaynak": "https://ornek.org", "tatoeba_id": 123}
        self.assertEqual(vd.denetle_kayit("temiz", "a.jsonl", kayit_tatoeba), [])

        kayit_alintisiz = {"etiket": "kaynakli-birincil", "kaynak": "https://ornek.org"}
        self.assertIn("alinti yok", vd.denetle_kayit("temiz", "a.jsonl", kayit_alintisiz))

        kayit_tahmin = {"etiket": "tahmin", "kaynak": "analiz"}
        self.assertEqual(vd.denetle_kayit("temiz", "a.jsonl", kayit_tahmin), [])


class TestDenetleDosya(unittest.TestCase):
    def test_bos_metin(self):
        self.assertEqual(vd.denetle_dosya("taslak", "a.jsonl", ""), [])
        self.assertEqual(vd.denetle_dosya("taslak", "a.jsonl", "\n   \n\t\n"), [])

    def test_satir_numarasi_ve_bosluklar(self):
        metin = "\n".join([
            "",
            '{"etiket": "dogrulanmamis", "id": 1}',
            "   ",
            "5",
            "",
            '{"etiket": "dogrulanmamis", "id": 2}',
        ])
        ihlaller = vd.denetle_dosya("taslak", "a.jsonl", metin)
        self.assertEqual(len(ihlaller), 1)
        self.assertEqual(ihlaller[0][0], 4)
        self.assertEqual(ihlaller[0][1], ["nesne değil"])

    def test_coklu_yinelenen_ve_ilk_satir(self):
        k1 = '{"etiket": "dogrulanmamis", "k": "v", "n": 1}'
        k2 = '{"n": 1, "k": "v", "etiket": "dogrulanmamis"}'
        k3 = '{"k": "v", "etiket": "dogrulanmamis", "n": 1}'
        metin = "\n".join([k1, "", k2, "", k3])
        ihlaller = vd.denetle_dosya("taslak", "a.jsonl", metin)
        self.assertEqual(len(ihlaller), 2)
        # Satir 3, satir 1 ile ayni
        self.assertEqual(ihlaller[0][0], 3)
        self.assertIn("yinelenen kayıt (satır 1 ile aynı)", ihlaller[0][1])
        # Satir 5, ilk satir olan satir 1 ile ayni (satir 3 ile degil)
        self.assertEqual(ihlaller[1][0], 5)
        self.assertIn("yinelenen kayıt (satır 1 ile aynı)", ihlaller[1][1])

    def test_ic_ice_nesnelerde_anahtar_sirasi(self):
        k1 = '{"etiket": "dogrulanmamis", "ic": {"b": 2, "a": 1}}'
        k2 = '{"ic": {"a": 1, "b": 2}, "etiket": "dogrulanmamis"}'
        metin = f"{k1}\n{k2}"
        ihlaller = vd.denetle_dosya("taslak", "a.jsonl", metin)
        self.assertEqual(len(ihlaller), 1)
        self.assertEqual(ihlaller[0][0], 2)
        self.assertIn("yinelenen kayıt (satır 1 ile aynı)", ihlaller[0][1])

    def test_liste_sirasi_farki_yinelenen_sayilmaz(self):
        k1 = '{"etiket": "dogrulanmamis", "liste": [1, 2]}'
        k2 = '{"etiket": "dogrulanmamis", "liste": [2, 1]}'
        metin = f"{k1}\n{k2}"
        ihlaller = vd.denetle_dosya("taslak", "a.jsonl", metin)
        self.assertEqual(ihlaller, [])

    def test_ayni_satirda_coklu_ihlal(self):
        k1 = '{"etiket": "gecersiz", "kaynak": "http://x", "x": 1}'
        k2 = '{"x": 1, "kaynak": "http://x", "etiket": "gecersiz"}'
        metin = f"{k1}\n{k2}"
        ihlaller = dict(vd.denetle_dosya("taslak", "a.jsonl", metin))
        self.assertIn(1, ihlaller)
        self.assertIn(2, ihlaller)
        # 2. satirda hem etiket hem 'kaynak' alani hem de yinelenen hatasi olmali
        hata2 = ihlaller[2]
        self.assertTrue(any("etiket" in h for h in hata2))
        self.assertTrue(any("'kaynak'" in h for h in hata2))
        self.assertTrue(any("yinelenen kayıt (satır 1 ile aynı)" in h for h in hata2))


if __name__ == "__main__":
    unittest.main()
