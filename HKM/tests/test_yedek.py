# -*- coding: utf-8 -*-
"""Otomatik yedek (core/yedek.py).

   Kanitladigi sozler:
     1. Yazilan dosya, gelen baytlarin KENDISIDIR; bayt sayisi ve SHA-256
        geri okunarak dogrulanir.
     2. Baska modulun yedegi, LifeOS olmayan bir govde ve bozuk JSON
        reddedilir; hicbir dosya yazilmaz.
     3. Dondurme: son 14 gun + son 6 ayin her birinden ayin son yedegi.
        Silinmis bir tarayicinin iki haftalik bos yedegi iyi yedekleri
        atamaz.
     4. Bir oncekinin yarisindan kucuk yedek UYARIYLA doner.
     5. Dosya adi disaridan kurulamaz: gecersiz tarih ya da modul okunmaz."""
import datetime
import hashlib
import json
import os
import shutil
import tempfile

from core import yedek
from tests.harness import eq, no, ok, suite, test


def _govde(app="rota-84285", kayit=3):
    return json.dumps({"__meta": {"app": app, "schemaVersion": 1},
                       "data": {"k%d" % i: "x" * 40 for i in range(kayit)}},
                      ensure_ascii=False).encode("utf-8")


def _gun(bas, n):
    return (datetime.date.fromisoformat(bas) + datetime.timedelta(days=n)).isoformat()


def run():
    suite("yedek")

    def t_yaz_dogrula():
        kok = tempfile.mkdtemp(prefix="hkm-yedek-")
        try:
            ham = _govde()
            r = yedek.kaydet(kok, "ays", ham, bugun="2026-09-20")
            eq((r["ok"], r["tarih"], r["bayt"]), (True, "2026-09-20", len(ham)))
            eq(r["sha256"], hashlib.sha256(ham).hexdigest())
            eq(yedek.oku(kok, "ays", "2026-09-20"), ham)
            l = yedek.liste(kok)
            ok(l["metin"]["ays"].startswith("Son yedek 20 Eylül 2026 · "))
            ok("henüz yedeği yok" in l["metin"]["spi"])
            no(os.path.exists(os.path.join(kok, "ays", "2026-09-20.json.yaziliyor")))
            # Ayni gun ikinci yedek oncekinin yerine gecer.
            ham2 = _govde(kayit=4)
            eq(yedek.kaydet(kok, "ays", ham2, bugun="2026-09-20")["saklanan"], 1)
            eq(yedek.oku(kok, "ays", "2026-09-20"), ham2)
        finally:
            shutil.rmtree(kok)
    test("yazilan dosya gelen baytlarin kendisi; geri okunarak dogrulanir", t_yaz_dogrula)

    def t_red():
        kok = tempfile.mkdtemp(prefix="hkm-yedek-")
        try:
            r = yedek.kaydet(kok, "spi", _govde(app="rota-84285"), bugun="2026-09-20")
            eq(r["ok"], False)
            ok("SPİ yedeği değil" in r["note"])
            eq(yedek.kaydet(kok, "ays", b"{bozuk", bugun="2026-09-20")["ok"], False)
            eq(yedek.kaydet(kok, "ays", b'{"a":1}', bugun="2026-09-20")["ok"], False)
            eq(yedek.kaydet(kok, "ays", b"", bugun="2026-09-20")["ok"], False)
            eq(yedek.kaydet(kok, "king", _govde(), bugun="2026-09-20")["ok"], False)
            eq(yedek.liste(kok)["moduller"], {"ays": [], "spi": [], "esp": []})
        finally:
            shutil.rmtree(kok)
    test("baska modulun, LifeOS olmayan ve bozuk govde reddedilir", t_red)

    def t_dondurme():
        kok = tempfile.mkdtemp(prefix="hkm-yedek-")
        try:
            # Yedi ay boyunca her gun iyi bir yedek.
            bas = "2026-02-01"
            for i in range(0, 212):
                yedek.kaydet(kok, "esp", _govde(app="esp-entelektuel", kayit=50),
                             bugun=_gun(bas, i))
            l = [x["tarih"] for x in yedek.liste(kok)["moduller"]["esp"]]
            son = _gun(bas, 211)
            eq(l[:14], [_gun(bas, 211 - i) for i in range(14)])
            # Ay sonlari: son 6 ay, en yeni ayin kendisi dahil.
            aylar = sorted({t[:7] for t in l})
            eq(len(aylar), 6)
            eq(son[:7], aylar[-1])
            eq(len(l), 14 + 5)
            # Tarayici silindi: iki hafta boyunca bos yedek.
            for i in range(212, 212 + 20):
                yedek.kaydet(kok, "esp", _govde(app="esp-entelektuel", kayit=0),
                             bugun=_gun(bas, i))
            l = yedek.liste(kok)["moduller"]["esp"]
            iyi = [x for x in l if x["bayt"] > 500]
            ok(len(iyi) >= 5)
        finally:
            shutil.rmtree(kok)
    test("dondurme: 14 gun + 6 ay sonu; bos yedekler iyileri atamaz", t_dondurme)

    def t_kuculme():
        kok = tempfile.mkdtemp(prefix="hkm-yedek-")
        try:
            yedek.kaydet(kok, "ays", _govde(kayit=40), bugun="2026-09-19")
            r = yedek.kaydet(kok, "ays", _govde(kayit=1), bugun="2026-09-20")
            ok(r["ok"])
            ok("yarısından küçük" in r["uyari"] and "2026-09-19" in r["uyari"])
            r = yedek.kaydet(kok, "ays", _govde(kayit=1), bugun="2026-09-21")
            no("uyari" in r)
        finally:
            shutil.rmtree(kok)
    test("oncekinin yarisindan kucuk yedek uyariyla doner", t_kuculme)

    def t_ad():
        kok = tempfile.mkdtemp(prefix="hkm-yedek-")
        try:
            yedek.kaydet(kok, "ays", _govde(), bugun="2026-09-20")
            for m, t in (("ays", "../ays/2026-09-20"), ("ays", "2026-02-31"),
                         ("../ays", "2026-09-20"), ("ays", "2026-9-20")):
                eq(yedek.oku(kok, m, t), None)
            eq(yedek.kaydet(kok, "ays", _govde(), bugun="2026-02-31")["ok"], False)
            # Klasore elle dusen yabanci dosya listelenmez.
            open(os.path.join(kok, "ays", "notlar.json"), "w").close()
            eq([x["tarih"] for x in yedek.liste(kok)["moduller"]["ays"]], ["2026-09-20"])
        finally:
            shutil.rmtree(kok)
    test("dosya adi disaridan kurulamaz", t_ad)

    def t_tek_zip():
        # Fikir 53: her sey TEK zip'te, okunur: HKM ambari + her modulun en
        # yeni yedegi + BENIOKU. Yedegi olmayan modul «yedek yok» diye yazilir.
        import io
        import zipfile
        from core import db
        kok = tempfile.mkdtemp(prefix="hkm-yedek-")
        try:
            yedek.kaydet(kok, "ays", _govde(), bugun="2026-09-19")
            yedek.kaydet(kok, "ays", _govde(kayit=4), bugun="2026-09-20")
            yedek.kaydet(kok, "spi", _govde(app="spi-saglik"), bugun="2026-09-20")
            con = db.connect(":memory:")
            z = zipfile.ZipFile(io.BytesIO(yedek.zip_paketi(con, kok, "2026-09-21")))
            adlar = sorted(z.namelist())
            eq(adlar, ["BENIOKU.txt", "ays/ays-yedek-2026-09-20.json", "hkm/hkm-ambar.json",
                       "spi/spi-yedek-2026-09-20.json"])
            eq(json.loads(z.read("ays/ays-yedek-2026-09-20.json"))["data"]["k3"], "x" * 40)
            ok("__meta" in json.loads(z.read("hkm/hkm-ambar.json")))
            oku = z.read("BENIOKU.txt").decode("utf-8")
            ok("ESP: HKM’de yedek yok" in oku and "2026-09-21" in oku, oku)
            ok("Rehber › Veri" in oku)
        finally:
            shutil.rmtree(kok)
    test("her sey tek zip'te, okunur; yedegi olmayan modul soylenir", t_tek_zip)
