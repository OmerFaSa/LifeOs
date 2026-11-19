#!/usr/bin/env python3
"""king/arama.py testleri. AGA CIKMAZ: web/YouTube cevaplari HKM'nin kendi arastir testindeki fixture'lardir
(HKM/tests/test_arastir.py _ag), notlar ve alan icerigi gecici veridir. Calistir: python king/arama_test.py"""
import json
import os
import shutil
import sys
import tempfile
import threading
import unittest

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import arama  # noqa: E402  (HKM'yi sys.path'e koyar)
from core import db, web  # noqa: E402
from tests import test_arastir as ta  # noqa: E402  fixture'lar kopyalanmaz, alinir

NOTLAR = [{"kimlik": "n1", "baslik": "Zincir kuralı notum", "metin": "Zincir kuralı dıştan içe türev almaktır."},
          {"kimlik": "n2", "baslik": "Zincir kuralı sırrım", "metin": "Zincir kuralı özel düşüncem burada.",
           "ozel": True}]
ALAN = {"ad": "Türev", "hedef": "Zincir kuralı ile bileşke fonksiyonun türevini almayı öğrenmek."}


class AramaTest(unittest.TestCase):
    def setUp(self):
        self.kok = tempfile.mkdtemp(prefix="arama-test-")
        os.makedirs(os.path.join(self.kok, "alan", "matematik"))
        with open(os.path.join(self.kok, "alan", "matematik", "asama-1.json"), "w", encoding="utf-8") as f:
            json.dump(ALAN, f, ensure_ascii=False)
        self.con = db.connect(":memory:")

    def tearDown(self):
        shutil.rmtree(self.kok, ignore_errors=True)

    def ara(self, sorgu="zincir kuralı", **ek):
        a = dict(con=self.con, cfg={}, tasiyici=ek.pop("ag", None) or ta._ag(), notlar=NOTLAR, alan_kok=self.kok,
                 cevrimdisi=True, onbellek={})
        a.update(ek)
        return arama.ara(sorgu, **a)

    def test_her_iddia_kaynakli(self):
        r = self.ara()
        self.assertTrue(r["ok"])
        self.assertEqual([a["kaynak"] for a in r["plan"]], ["not", "alan", "web"])
        self.assertEqual({k["tur"] for k in r["kaynaklar"]}, {"web", "not", "alan"})
        for i in r["iddialar"]:
            self.assertTrue(i["kaynaklar"] and all(k.get("url") for k in i["kaynaklar"]), i)
            self.assertIn(i["kesinlik"], ("estimated", "verified"))
        self.assertIn("Zincir kuralı bileşke fonksiyonların türevini verir.", [i["metin"] for i in r["iddialar"]])

    def test_butce(self):
        ag = ta._ag()
        r = self.ara(ag=ag, butce={"ag": 1})
        self.assertLessEqual(len(ag.cagri), 1)
        self.assertTrue(r["butce"]["butce_doldu"])
        r2 = self.ara(butce={"kaynak": 2})
        self.assertLessEqual(len(r2["kaynaklar"]), 2)
        r3 = self.ara(butce={"iddia": 1})
        self.assertLessEqual(len(r3["iddialar"]), 1)

    def test_ozel_not_girmez(self):
        r = self.ara()
        dok = json.dumps(r, ensure_ascii=False)
        self.assertNotIn("not:n2", dok)
        self.assertNotIn("özel düşüncem", dok)
        self.assertIn("not:n1", [k["url"] for k in r["kaynaklar"]])

    def test_onbellek(self):
        ag = ta._ag()
        r1 = self.ara(ag=ag, onbellek={})
        n1 = len(ag.cagri)
        ob = {}
        self.ara(ag=ag, onbellek=ob)
        r2 = self.ara(ag=ag, onbellek=ob)
        self.assertGreater(n1, 0)
        self.assertEqual(r2["butce"]["ag_cagrisi"], 0, "web onbellekten (HKM web_onbellek)")
        self.assertEqual(sorted(r2["onbellekten"]), ["alan", "not"])
        self.assertEqual([i["metin"] for i in r1["iddialar"]], [i["metin"] for i in r2["iddialar"]])

    def test_hafizaya_yazmaz(self):
        def sayim():
            adlar = [t[0] for t in self.con.execute("SELECT name FROM sqlite_master WHERE type='table'")]
            return {t: self.con.execute('SELECT COUNT(*) FROM "%s"' % t).fetchone()[0] for t in adlar
                    if t not in ("web_onbellek", "web_sayac")}
        once, dosya = sayim(), sorted(os.listdir(self.kok))
        r = self.ara()
        self.assertEqual(sayim(), once)
        self.assertEqual(sorted(os.listdir(self.kok)), dosya)
        h = r["hafiza_onerisi"]
        self.assertFalse(h["yazildi"])
        self.assertTrue(h["oneriler"])
        self.assertTrue(all(o["kesinlik"] == "verified" and not o["kaynak"].startswith("not:") for o in h["oneriler"]))

    def test_cevrimdisi_aga_cikmaz(self):
        eski = web._ag
        web._ag = lambda *a, **k: (_ for _ in ()).throw(AssertionError("aga cikildi"))
        try:
            r = arama.ara("zincir kuralı", con=self.con, cfg={}, notlar=NOTLAR, alan_kok=self.kok,
                          cevrimdisi=True, onbellek={})
        finally:
            web._ag = eski
        self.assertEqual([a["kaynak"] for a in r["plan"]], ["not", "alan"])
        self.assertTrue(r["ok"])
        self.assertEqual(r["butce"]["ag_cagrisi"], 0)

    def test_plan(self):
        p = arama.plan("notlarımda zincir kuralı", tasiyici=ta._ag())
        self.assertNotIn("web", [a["kaynak"] for a in p])
        p = arama.plan("zincir kuralı için video bul", tasiyici=ta._ag())
        self.assertEqual([a["kaynak"] for a in p], ["not", "alan", "web", "video"])
        r = self.ara("notlarımda zincir kuralı")
        self.assertEqual(r["konu"], "zincir kuralı", "istek ve not sozcukleri konudan duser")
        self.assertEqual(r["butce"]["ag_cagrisi"], 0)

    def test_olcum_kosar(self):
        import arama_olc
        r = arama_olc.olc()
        self.assertFalse([s for s in r["satirlar"] if "hata" in s], "uc motor da hatasiz kosar")
        self.assertEqual(r["ozet"]["yeni: Arama"]["uydurma"], 0)
        self.assertEqual(r["etiket"], "vekil")

    def test_video_ani(self):
        r = self.ara("zincir kuralı için video bul")
        v = [k for k in r["kaynaklar"] if k["tur"] == "video"]
        self.assertTrue(v and any(k.get("an") for k in v), "altyazidaki an (arastir.video_ici_ara)")

    # --- esitlik: HKM/tests/test_arastir.py t_dongu_web ve t_denetle beklentileri
    def test_esitlik_arastir_model(self):
        def yazar(konu, blok):
            self.assertIn("KAYNAKLAR", blok)
            return ("Kural 1676 yılında Leibniz tarafından kullanıldı [1]. Kaynaksız uydurma. "
                    "Kural 1700'de bulundu [1]. Hoca «integral alalım» diyor [1]. Zincir kuralı çok eskidir [1].")
        r = self.ara(yazar=yazar, kaynaklar=("web",))
        metin = [i["metin"] for i in r["iddialar"]]
        self.assertEqual(metin, ["Kural 1676 yılında Leibniz tarafından kullanıldı.", "Zincir kuralı çok eskidir."])
        self.assertEqual([i["kesinlik"] for i in r["iddialar"]], ["verified", "estimated"])
        self.assertEqual(sorted(a["neden"][:8] for a in r["atilan"]), ["alıntı k", "kaynak g", "sayı kay"])
        self.assertEqual(r["iddialar"][0]["kaynaklar"][0]["url"], "https://tr.wikipedia.org/wiki/Zincir_kural%C4%B1")

    def test_esitlik_bam_kaynaksiz(self):
        """test_bam t_research_is_unverified: kaynaksiz arastirma dogrulanmis sayilmaz. Yeni motorda daha
        siki: kaynak yoksa model cagrilmaz, iddia cikmaz."""
        cagrildi = []
        r = arama.ara("ferritin neden düşer", con=self.con, cfg={}, notlar=[], alan_kok=self.kok,
                      cevrimdisi=True, onbellek={}, yazar=lambda k, b: cagrildi.append(1) or "Ferritin 30 altı [1].")
        self.assertFalse(r["ok"])
        self.assertEqual(r["iddialar"], [])
        self.assertEqual(cagrildi, [])

    def test_alan_indeks_ve_taslak_tazeleme(self):
        dosya = os.path.join(self.kok, "alan", "matematik", "asama-1.json")
        teri = ["zincir"]
        eski_load = arama.json.load
        sayac = [0]

        def izli_load(*a, **k):
            sayac[0] += 1
            return eski_load(*a, **k)

        arama.json.load = izli_load
        try:
            r1 = arama.alan_kaynaklari("zincir", teri, self.kok)
            self.assertEqual(sayac[0], 1)
            self.assertFalse(r1[0]["taslak"])
            r2 = arama.alan_kaynaklari("zincir", teri, self.kok)
            self.assertEqual(sayac[0], 1, "degismeyen alan dosyasi tekrar ayristirilmaz")
            self.assertEqual(r1, r2)
            # Dosya degisince (mtime + icerik) aninda tazelenir ve dogrulanmamis -> taslak True
            yeni = {"ad": "Türev", "hedef": "Zincir kuralı ve yeni örnekler burada.", "kaynaklar": [{"dogrulama": "dogrulanmamis"}]}
            with open(dosya, "w", encoding="utf-8") as f:
                json.dump(yeni, f, ensure_ascii=False)
            st = os.stat(dosya)
            os.utime(dosya, ns=(st.st_atime_ns, st.st_mtime_ns + 2_000_000_000))
            r3 = arama.alan_kaynaklari("zincir", teri, self.kok)
            self.assertEqual(sayac[0], 2)
            self.assertTrue(r3[0]["taslak"])
            self.assertIn("yeni örnekler", r3[0]["metin"])
            os.remove(dosya)
            self.assertEqual(arama.alan_kaynaklari("zincir", teri, self.kok), [])
        finally:
            arama.json.load = eski_load

    def test_onbellek_sinirli(self):
        ob = {}
        for i in range(160):
            arama._onbellekli(ob, ("not", "sorgu-%d" % i), lambda i=i: [{"no": i}])
        self.assertLessEqual(len(ob), arama.ONBELLEK_SINIR)

    def test_eszamanli_alan_ve_onbellek(self):
        ob, errs = {}, []
        def _calis(idx):
            try:
                for j in range(25):
                    arama._onbellekli(ob, ("alan", "q-%d" % ((idx + j) % 15)), lambda i=idx: [{"n": i}])
                    arama.alan_kaynaklari("zincir", ["zincir"], self.kok)
            except Exception as exc:
                errs.append(exc)
        ts = [threading.Thread(target=_calis, args=(i,)) for i in range(6)]
        for t in ts: t.start()
        for t in ts: t.join()
        self.assertEqual(errs, [])

    def test_mcp_tek_modul(self):
        import mcp
        eski = arama._MCP_MOD
        eski_sys = sys.modules.get("mcp")
        arama._MCP_MOD = None
        try:
            self.assertIs(arama._mcp_mod(), mcp)
            self.assertNotIn("king_mcp", sys.modules)
            # Yabanci/sahte sys.modules["mcp"] golgelemesinde yanlis modulu dondurmez
            arama._MCP_MOD = None
            sys.modules["mcp"] = type(sys)("sahte_mcp")
            bulunan = arama._mcp_mod()
            self.assertTrue(callable(getattr(bulunan, "t_notlar", None)))
            self.assertIsNot(bulunan, sys.modules["mcp"])
        finally:
            if eski_sys is not None:
                sys.modules["mcp"] = eski_sys
            arama._MCP_MOD = eski

    def test_alan_on_suzgec_esik(self):
        d1 = os.path.join(self.kok, "alan", "mat2")
        os.makedirs(d1, exist_ok=True)
        with open(os.path.join(d1, "asama-1.json"), "w", encoding="utf-8") as f:
            json.dump({
                "ad": "Dagilmis",
                "a": "Bu cumlede yalniz alfa ve beta terimleri birlikte geciyor uzun metin.",
                "b": "Burada da sadece gama ve delta kelimeleri ayri olarak duruyor uzun.",
                "c": "Burada Türkçe büyük İŞĞÜÖÇ harfleri ayrı parçada duruyor.",
            }, f, ensure_ascii=False)
        d2 = os.path.join(self.kok, "alan", "fiz2")
        os.makedirs(d2, exist_ok=True)
        with open(os.path.join(d2, "asama-1.json"), "w", encoding="utf-8") as f:
            json.dump({
                "ad": "Eslesen",
                "a": "Burada alfa, beta ve gama terimleri ayni metin parcasinda bulunuyor.",
                "t": "Türkçe büyük İŞĞÜÖÇ ve ÖĞRETİM kavramları aynı cümlede geçiyor.",
            }, f, ensure_ascii=False)
        r = arama.alan_kaynaklari("sorgu", ["alfa", "beta", "gama", "delta", "epsilon"], self.kok)
        self.assertEqual([x["url"] for x in r], ["alan/fiz2/asama-1.json"])
        self.assertIn("alfa, beta ve gama", r[0]["metin"])
        # Tek, iki, uc, dort terim + tekrarlayan terim + \n siniri + Turkce kucultme
        self.assertEqual(len(arama.alan_kaynaklari("q1", ["alfa"], self.kok)), 2)
        self.assertEqual([x["url"] for x in arama.alan_kaynaklari("q2", ["alfa", "gama"], self.kok)], ["alan/fiz2/asama-1.json"])
        self.assertEqual([x["url"] for x in arama.alan_kaynaklari("q3", ["alfa", "gama", "epsilon"], self.kok)], ["alan/fiz2/asama-1.json"])
        self.assertEqual([x["url"] for x in arama.alan_kaynaklari("q4", ["alfa", "gama", "theta", "epsilon"], self.kok)], ["alan/fiz2/asama-1.json"])
        self.assertEqual(len(arama.alan_kaynaklari("qrep", ["alfa", "alfa", "alfa"], self.kok)), 2)
        self.assertEqual([x["url"] for x in arama.alan_kaynaklari("qtr", ["işğüöç", "öğretim"], self.kok)], ["alan/fiz2/asama-1.json"])
        r_bos = arama.alan_kaynaklari("bos", [], self.kok)
        self.assertEqual(len(r_bos), 3)
        if os.name == "nt":
            arama._ALAN_INDEKS.clear()
            arama.alan_kaynaklari("qwin1", ["alfa"], self.kok.upper())
            arama.alan_kaynaklari("qwin2", ["alfa"], self.kok.lower())
            anahtarlar = [k for k in arama._ALAN_INDEKS if os.path.normcase(self.kok) in k]
            self.assertEqual(len(anahtarlar), 3)


if __name__ == "__main__":
    unittest.main(verbosity=1)
