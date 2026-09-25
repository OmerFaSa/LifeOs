# -*- coding: utf-8 -*-
"""Merkez kayitlari (core/merkez.py) — katalog 119, 120, 126.

   Kanitladigi sozler:
     1. 119: cevaplanmis her teklif ve gunun karari tek satirdir, en yeni
        once; acik teklif gecmise girmez. Durum adi Turkcedir.
     2. 120: her modulden BIR satir; kaydi gelmeyen modul «veri yok»
        etiketini tasir, «0» yazilmaz; olculen hareket «hesaplandı»dir ve
        haftalik raporun AYNI satirindan gelir. Bekleyen teklif ve King
        onayi en altta sayilir. Kart pazar 17:00'den sonra one cikar.
     3. 126: okunan kayit ve uretilen her sey saatine duser; modullere
        yazilan 0'dir ve uygulanan teklif «modulun kendi kodu» olarak
        sayilir.
     4. Uc gorunumun hicbiri bir tabloya yazmaz.
     5. Uclar bearer ister; bozuk girdi reddedilir."""
import datetime

from core import db, merkez, sync_engine, weekly
from tests.harness import eq, ok, suite, test

G = "2026-09-20"            # pazar (gecmiste: ingest gelecegi reddeder)


def _con():
    return db.connect(":memory:")


def _gun(con, modul, gun, saat="08:00:00", **metrics):
    return sync_engine.ingest(con, {"module": modul, "date": gun,
                                    "metrics": {k: {"value": v, "cert": "measured"}
                                                for k, v in metrics.items()}},
                              now=gun + "T" + saat)


def _teklif(con, modul="ays", durum=None, cevap=None, olustu=None):
    nid = db.insert_intent(con, modul, "plan.add", {"date": G, "minutes": 30},
                           "Plana 30 dakikalık blok eklensin mi?", "patron", created_at=olustu)
    if durum:
        db.set_intent_state(con, nid, durum, at=cevap)
    con.commit()
    return nid


def _say(con):
    return {t: con.execute("SELECT COUNT(*) FROM %s" % t).fetchone()[0]
            for t in ("raw_events", "intents", "decisions", "outbox", "bildirimler",
                      "is_emirleri", "usage")}


def run():
    suite("merkez kayıtları (119 · 120 · 126)")

    def t_gecmis():
        con = _con()
        _teklif(con)                                               # acik: girmez
        _teklif(con, durum="applied", cevap=G + "T09:00:00")
        _teklif(con, "spi", durum="dismissed", cevap=G + "T11:00:00")
        _teklif(con, "esp", durum="unknown", cevap=G + "T10:00:00")
        did = db.insert_decision(con, G, 1, "Bugün yükü azaltmayı düşün.", G + "T07:00:00")
        db.set_decision_state(con, did, "declined", answered_at=G + "T12:00:00")
        g = merkez.oneri_gecmisi(con)
        eq([x["durum_adi"] for x in g["satirlar"]],
           ["geçildi", "istenmedi", "sonucu belirsiz", "uygulandı"])
        eq([x["modul_adi"] for x in g["satirlar"]], ["Merkez", "SPİ", "ESP", "AYS"])
        ok("Geri al" in g["not"], g["not"])
        eq(len(merkez.oneri_gecmisi(con, n=2)["satirlar"]), 2)
    test("119 cevaplanan teklif ve karar tek satır, en yeni önce; açık teklif girmez", t_gecmis)

    def t_hafta():
        con = _con()
        onceki = datetime.date.fromisoformat(G) - datetime.timedelta(days=7)
        for i in range(5):
            _gun(con, "ays", (onceki - datetime.timedelta(days=i)).isoformat(), questions=100)
            _gun(con, "ays", (datetime.date.fromisoformat(G) - datetime.timedelta(days=i)).isoformat(),
                 questions=130)
        _gun(con, "esp", G, practice_minutes=40)
        _teklif(con, "spi")
        _teklif(con, "spi")
        h = merkez.hafta_ozeti(con, G, now=G + "T18:30:00")
        eq([s["modul"] for s in h["satirlar"]], ["ays", "spi", "esp"])
        a, s, e = h["satirlar"]
        eq(a["kesinlik"], "hesaplandı")
        r = weekly.report(con, G)
        satir = [x for x in r["rows"] if x["module"] == "ays" and x["status"] == "compared"][0]
        ok(satir["note"] in a["cumle"], a["cumle"])               # ayni hesap, ikinci hesap yok
        eq((s["kesinlik"], s["gun"]), ("veri yok", None))
        ok("0" not in s["cumle"], s["cumle"])
        eq((e["kesinlik"], e["gun"]), ("ölçüldü", 1))
        eq((h["bekleyen"]["moduller"]["spi"], h["bekleyen"]["toplam"]), (2, 2))
        eq(h["zamani"], True)
        eq(merkez.hafta_ozeti(con, G, now=G + "T16:59:00")["zamani"], False)
        eq(merkez.pazar_aksami("2026-09-26T20:00:00"), False)      # cumartesi
    test("120 her modülden bir satır; eksik «veri yok», ölçülen «hesaplandı»; bekleyen en altta", t_hafta)

    def t_gunluk():
        con = _con()
        _gun(con, "ays", G, saat="08:15:00", questions=40)
        _gun(con, "spi", G, saat="08:40:00", sleep_hours=7)
        _gun(con, "esp", G, saat="21:05:00", practice_minutes=30)
        _gun(con, "ays", "2026-09-19", saat="23:00:00", questions=10)  # dun: girmez
        _teklif(con, "ays", olustu=G + "T09:10:00")
        nid = _teklif(con, "spi", olustu=G + "T09:20:00")
        db.set_intent_state(con, nid, "applied", at=G + "T21:30:00")
        db.insert_decision(con, G, 1, "Kısa bir yürüyüş iyi gelebilir.", G + "T08:50:00")
        g = merkez.gunluk(con, G)
        eq([x["saat"] for x in g["saatler"]], ["08", "09", "21"])
        eq(g["saatler"][0]["okudu"], [{"modul": "ays", "modul_adi": "AYS", "n": 1},
                                      {"modul": "spi", "modul_adi": "SPİ", "n": 1}])
        eq([u["tur"] for u in g["saatler"][0]["uretti"]], ["oneri"])
        eq(g["saatler"][1]["uretti"], [{"tur": "teklif", "ad": "modüle teklif (onayını bekler)", "n": 2}])
        eq((g["okunan"], g["uretilen"], g["modullere_yazilan"], g["uygulanan_teklif"]), (3, 3, 0, 1))
        ok("hiçbir modüle yazmadı" in g["yazmadi"] and "1 teklifi" in g["yazmadi"], g["yazmadi"])
        bos = merkez.gunluk(con, "2026-01-01")
        eq((bos["saatler"], bos["okunan"]), ([], 0))
        ok("uygulanan teklif yok" in bos["yazmadi"], bos["yazmadi"])
    test("126 okunan ve üretilen saatine düşer; modüllere yazılan 0", t_gunluk)

    def t_yazmaz():
        con = _con()
        _gun(con, "ays", G, questions=40)
        _teklif(con, "ays", durum="applied", cevap=G + "T09:00:00")
        once = _say(con)
        merkez.oneri_gecmisi(con)
        merkez.hafta_ozeti(con, G, now=G + "T18:00:00")
        merkez.gunluk(con, G)
        eq(_say(con), once)
    test("üç görünümün hiçbiri bir tabloya yazmaz", t_yazmaz)


def run_daemon():
    """Uclar gercek bir soketle (tests/test_daemon.py kalibi)."""
    from tests.test_daemon import _Server
    suite("merkez kayıtları · uçlar")

    def t_uclar():
        s = _Server()
        try:
            eq(s.call("/api/merkez/hafta", token=None)[0], 401)
            eq(s.call("/api/merkez/gunluk?date=20-09-2026")[0], 400)
            st, h = s.call("/api/merkez/hafta?date=%s" % G)
            eq((st, [x["modul"] for x in h["satirlar"]]), (200, ["ays", "spi", "esp"]))
            st, g = s.call("/api/merkez/gunluk?date=%s" % G)
            eq((st, g["modullere_yazilan"]), (200, 0))
            eq(s.call("/api/merkez/gecmis?n=5")[0], 200)
            eq(s.call("/api/merkez/gecmis?n=bes")[0], 400)
            eq(s.call("/api/merkez/yok")[0], 404)
        finally:
            s.close()
    test("uçlar bearer ister; bozuk tarih ve sayı reddedilir", t_uclar)
