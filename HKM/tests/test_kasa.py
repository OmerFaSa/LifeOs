# -*- coding: utf-8 -*-
"""Kasa ve kutu (core/kasa.py, core/kutu.py).

   Kanitladigi sozler:
     1. Tasima: anahtar kasaya yazilir, geri okunup dogrulanir, config'te
        yalniz gonderme kalir; key_value kasadan okur; yerel adres tasinmaz.
     2. Geri: deger config'e doner, kasadaki kayit silinir; okunamayan adiyla.
     3. Yazilamayan kasa hicbir seyi degistirmez.
     4. Kutu: satir birakilir, yalniz hedef modul alir, alinan silinir; sinir."""
import tempfile

from core import kasa, kutu, models
from tests.harness import eq, no, ok, suite, test


def run():
    suite("kasa ve kutu")

    def t_kasa():
        cfg = {"models": {"keys": {"google": [{"id": "k1", "label": "HKM", "key": "AIza-gizli", "user": "ben"}], "yerel": [{"id": "k1", "label": "Anahtar 1", "key": "http://127.0.0.1:11434", "user": "ben"}]}}}
        eq(kasa.durum(cfg)["kasada"], 0)
        yeni, n, hata = kasa.tasi(cfg)
        eq((n, hata), (1, None))
        ham = [e["key"] for e in yeni["models"]["keys"]["google"]]
        ok(all(k.startswith("kasa:google:") for k in ham), ham)
        no("AIza-gizli" in str(yeni), "duz anahtar kaldi")
        eq(models.key_value(yeni, "google"), "AIza-gizli")
        eq(models.key_value(yeni, "yerel"), "http://127.0.0.1:11434")
        eq(models.key_value(cfg, "google"), "AIza-gizli")             # eski cfg degismedi
        geri, m, okunamayan = kasa.geri(yeni)
        eq((m, okunamayan, models.key_value(geri, "google")), (1, [], "AIza-gizli"))
        ok(geri["models"]["keys"]["google"][0]["key"] == "AIza-gizli")
        eq(kasa.oku(ham[0]), None)                                     # kasadan silindi
        eski = kasa.ARKA["yaz"]
        kasa.ARKA["yaz"] = lambda h, d: False
        try:
            y2, n2, h2 = kasa.tasi(cfg)
            eq((y2, n2), (None, 0))
            ok("yazılamadı" in h2, h2)
        finally:
            kasa.ARKA["yaz"] = eski

    def t_kutu():
        class S:
            db_path = tempfile.mkdtemp() + "/hkm.db"
        s = S()
        eq(kutu.ekle(s, "spi", "7 saat uyudum", "ays")["ok"], True)
        eq(kutu.ekle(s, "ays", "40 soru çözdüm")["ok"], True)
        no(kutu.ekle(s, "xyz", "x")["ok"], "bilinmeyen modul")
        no(kutu.ekle(s, "spi", "  ")["ok"], "bos metin")
        eq([x["metin"] for x in kutu.al(s, "spi")], ["7 saat uyudum"])
        eq(kutu.al(s, "spi"), [])                                      # alinan silindi
        eq([x["metin"] for x in kutu.al(s, "ays")], ["40 soru çözdüm"])
        for i in range(kutu.EN_COK):
            kutu.ekle(s, "esp", "satir %d" % i)
        no(kutu.ekle(s, "esp", "fazla")["ok"], "sinir")

    test("kasa: taşı, oku, geri al; yazılamazsa hiçbir şey değişmez", t_kasa)
    test("kutu: satır bırakılır, yalnız hedef modül alır, alınan silinir", t_kutu)


def run_daemon():
    from tests.test_daemon import _Server
    suite("kasa ve kutu · uçlar")

    def t_uclar():
        s = _Server()
        try:
            eq(s.call("/api/kutu", token=None, body={"modul": "spi", "metin": "x"})[0], 401)
            eq(s.call("/api/kutu", body={"modul": "spi", "metin": "7 saat uyudum"})[0], 200)
            st, r = s.call("/api/kutu?modul=spi")
            eq((st, [x["metin"] for x in r["kayitlar"]]), (200, ["7 saat uyudum"]))
            eq(s.call("/api/kutu?modul=spi")[1]["kayitlar"], [])
            eq(s.call("/api/kutu?modul=x")[0], 400)
            st, d = s.call("/api/kasa")
            eq((st, d["destek"]), (200, True))
            st, h = s.call("/api/health", token=None)
            ok(isinstance(h.get("baslangic"), (int, float)), h)
        finally:
            s.close()

    test("uçlar: kutu bearer ister, alınan silinir; kasa durumu; health başlangıcı", t_uclar)
