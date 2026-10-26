# -*- coding: utf-8 -*-
"""Aktif kip (core/aktif.py).

   Kanitladigi sozler:
     1. Varsayilan kapali: kapaliyken tur atilmaz. Ayar dogrulanir;
        bilinmeyen alan ve aralik disi deger reddedilir.
     2. Tetik olaydir: ilk tik «baslangic», hemen ardindan tur yok; yeni
        kayit «yeni_kayit», aralik dolunca «nabiz», ertesi gun «yeni_gun».
     3. Nabiz: kaydi gelen modul «ölçüldü», gelmeyen «veri yok» ve son
        kaydin gunuyle; sifir yazilmaz.
     4. Eksik: kullanilan modulun dunku eksik olcumu ve aksam olmus sessiz
        modul yazilir; kullanilmayan modul eksik sayilmaz.
     5. Tur module yazmaz: ham olay ve modul teklifleri (intents) degismez.
        Model cagrilmaz.
     6. Dusen adim turu durdurmaz; tur yine kaydedilir. Son 500 tur tutulur.
     7. Uclar bearer ister; «Simdi tara» kapaliyken de calisir; ayar
        yamasi aktif kipi acar, bozuk deger 422.
     8. Eksik icerik: plani olmayan ve suresi gecmis etkin hedef adiyla
        yazilir; askidaki hedef yazilmaz. Tur hedef.plan ACMAZ (plan
        sayilari modulde, uydurulmaz).
     9. Eskiyen arastirma «yapilabilir»dir: tur King isi ACMAZ ve model
        cagirmaz; dokununca (baslat) King'e modul «hkm» ile gider, acik
        is listeden duser; listede olmayan kimlik 409.
    10. Haftalik rapor haftada bir kez kendiliginden hazirlanir; kayitsiz
        modul «kayıt yok» der, sifir yazmaz."""
import datetime

import json

from core import ai, aktif, db, hedefag, manager, sync_engine
from tests.harness import eq, no, ok, suite, test

G = "2026-09-20"
ACIK = {"aktif": {"enabled": True, "aralik_dk": 30}}


def _an(gun=G, saat="10:00:00"):
    return datetime.datetime.fromisoformat(gun + "T" + saat)


def _con():
    return db.connect(":memory:")


def _kayit(con, modul, gun, saat="08:00:00", **metrics):
    return sync_engine.ingest(con, {"module": modul, "date": gun,
                                    "metrics": {k: {"value": v, "cert": "measured"}
                                                for k, v in metrics.items()}},
                              now=gun + "T" + saat)


def _dun(gun=G, n=1):
    return (datetime.date.fromisoformat(gun) - datetime.timedelta(days=n)).isoformat()


def _hedef(id_, ozet, durum="aktif", plan=None, son_tarih=None):
    return {"id": id_, "ozet": ozet, "durum": durum, "paket": "kilo",
            "son_tarih": son_tarih, "plan": plan}


def _arastirma(con, konu, gun_once, gun=G, tur="arastirma", govde=None):
    at = (datetime.date.fromisoformat(gun) - datetime.timedelta(days=gun_once)).isoformat()
    cur = con.execute("INSERT INTO bam_kayitlar(tur, baslik, govde, dogruluk, created_at, anahtar) "
                      "VALUES (?,?,?,?,?,?)",
                      (tur, konu, json.dumps(govde if govde is not None else {"konu": konu}),
                       "kaynakli", at + "T09:00:00", "k:" + konu))
    return cur.lastrowid


def _emir_sayisi(con):
    return con.execute("SELECT COUNT(*) FROM is_emirleri").fetchone()[0]


def run():
    suite("aktif kip")

    def t_kapali():
        con = _con()
        eq(aktif.settings({})["enabled"], False)
        eq(aktif.tetik(con, {}, _an()), None)
        eq(aktif.tick(con, {}, _an()), None)
        eq(con.execute("SELECT COUNT(*) FROM aktif_tur").fetchone()[0], 0)
        ok(aktif.validate({"enabled": True})[0])
        no(aktif.validate({"enabled": "evet"})[0], "bool olmayan acik")
        no(aktif.validate({"aralik_dk": 2})[0], "aralik alt sinir")
        no(aktif.validate({"model": "x"})[0], "bilinmeyen alan")
        no(aktif.validate([])[0], "nesne olmayan")

    def t_tetik():
        con = _con()
        eq(aktif.tetik(con, ACIK, _an()), "baslangic")
        aktif.tick(con, ACIK, _an())
        eq(aktif.tetik(con, ACIK, _an(saat="10:01:00")), None)
        _kayit(con, "spi", G, "10:02:00", sleep_hours=7)
        eq(aktif.tetik(con, ACIK, _an(saat="10:03:00")), "yeni_kayit")
        aktif.tick(con, ACIK, _an(saat="10:03:00"))
        eq(aktif.tetik(con, ACIK, _an(saat="10:20:00")), None)
        eq(aktif.tetik(con, ACIK, _an(saat="10:33:00")), "nabiz")
        eq(aktif.tetik(con, ACIK, _an(gun="2026-09-21", saat="00:01:00")), "yeni_gun")

    def t_nabiz():
        con = _con()
        _kayit(con, "spi", G, "07:45:00", sleep_hours=7)
        _kayit(con, "ays", _dun(n=2), questions=40)
        g = aktif.tur(con, ACIK, "elle", now=_an())
        n = {x["modul"]: x for x in g["nabiz"]}
        eq((n["spi"]["etiket"], n["spi"]["metin"]), ("ölçüldü", "Bugün kayıt geldi (07:45)."))
        eq((n["ays"]["etiket"], n["ays"]["metin"]), ("veri yok", "Bugün kayıt yok; son kayıt 18 Eylül."))
        eq(n["esp"]["metin"], "Henüz hiç kayıt gelmedi.")
        for x in g["nabiz"]:
            no(" 0 " in " " + x["metin"] + " ", "sifir yazilmadi")
        ok(any("SPİ kayıt gönderdi" in y for y in g["yapilan"]), g["yapilan"])

    def t_eksik():
        con = _con()
        _kayit(con, "spi", _dun(), weight=70)               # dun kullanildi, uyku yok
        _kayit(con, "esp", _dun(n=3), minutes=20)           # son 7 gunde kullanildi
        sabah = aktif.tur(con, ACIK, "elle", now=_an(saat="09:00:00"))
        eq([e["metin"] for e in sabah["eksik"]], ["SPİ · Dün uyku kaydı yok."])
        aksam = aktif.tur(con, ACIK, "elle", now=_an(saat="21:00:00"))
        m = [e["metin"] for e in aksam["eksik"]]
        ok("ESP · Bugün henüz kayıt gelmedi." in m, m)
        no(any(x.startswith("AYS") for x in m), "kullanilmayan modul eksik sayilmaz")

    def t_modula_yazmaz():
        con = _con()
        _kayit(con, "spi", G, sleep_hours=4)
        once = (con.execute("SELECT COUNT(*) FROM raw_events").fetchone()[0],
                con.execute("SELECT COUNT(*) FROM intents").fetchone()[0])
        aktif.tur(con, ACIK, "elle", now=_an())
        aktif.tur(con, ACIK, "elle", now=_an(saat="11:00:00"))
        sonra = (con.execute("SELECT COUNT(*) FROM raw_events").fetchone()[0],
                 con.execute("SELECT COUNT(*) FROM intents").fetchone()[0])
        eq(sonra, once)
        ok(not hasattr(aktif, "ai") and not hasattr(aktif, "sohbet"), "model katmani yok")

    def t_hata_durdurmaz():
        con = _con()
        eski = manager.brief

        def bozuk(*a, **k):
            raise RuntimeError("deneme")
        manager.brief = bozuk
        try:
            g = aktif.tur(con, ACIK, "elle", now=_an())
        finally:
            manager.brief = eski
        eq(g["hata"], ["brifing: RuntimeError"])
        eq(len(g["nabiz"]), 3)
        eq(con.execute("SELECT COUNT(*) FROM aktif_tur").fetchone()[0], 1)

    def t_budama():
        con = _con()
        for i in range(aktif.TUR_TUT + 5):
            con.execute("INSERT INTO aktif_tur(at, gun, neden, son_olay, govde) VALUES (?,?,?,?,?)",
                        (G + "T00:00:00", G, "nabiz", 0, "{}"))
        aktif.tur(con, ACIK, "elle", now=_an())
        eq(con.execute("SELECT COUNT(*) FROM aktif_tur").fetchone()[0], aktif.TUR_TUT)
        d = aktif.durum(con, ACIK)
        eq((d["acik"], d["son"]["neden"], len(d["gecmis"])), (True, "elle", 8))

    def t_icerik_hedef():
        con = _con()
        hedefag.esitle(con, "spi", [
            _hedef("h1", "Kilo 80 → 75 kg"),
            _hedef("h2", "Yürüyüş", plan={"bitis": "2026-12-01"}, son_tarih="2026-09-01"),
            _hedef("h3", "Askıda hedef", durum="askida"),
            _hedef("h4", "Planlı ve süresi var", plan={"bitis": "2026-12-01"}, son_tarih="2026-12-01")],
            now=G + "T08:00:00")
        g = aktif.tur(con, ACIK, "elle", now=_an())
        eq(g["hata"], [])
        m = [e["metin"] for e in g["icerik"]]
        eq(m, ["SPİ · «Kilo 80 → 75 kg» hedefinin henüz planı yok; plan SPİ’de kurulur.",
               "SPİ · «Yürüyüş» hedefinin son tarihi (1 Eylül) geçti; hedef hâlâ etkin."])
        eq(_emir_sayisi(con), 0)
        eq(aktif.durum(con, ACIK)["gecmis"][0]["icerik"], 2)

    def t_yapilabilir():
        con = _con()
        cagri = []
        eski = ai.ask
        ai.ask = lambda *a, **k: cagri.append(1) or {"ok": False}
        try:
            rid = _arastirma(con, "Kreatin ve uyku", 120)
            _arastirma(con, "Yeni konu", 10)                        # taze: listelenmez
            _arastirma(con, "Eski not", 400, tur="materyal", govde={})
            g = aktif.tur(con, ACIK, "elle", now=_an())
            eq(g["hata"], [])
            eq([y["id"] for y in g["yapilabilir"]], ["arastirma:%d" % rid])
            y = g["yapilabilir"][0]
            eq((y["tur"], y["model"], "govde" in y), ("bam.arastirma", True, False))
            ok(any(e["metin"].startswith("BAM · «Eski not»") for e in g["icerik"]), g["icerik"])
            eq(_emir_sayisi(con), 0)
            eq(cagri, [])
            no(aktif.baslat(con, {}, "arastirma:999", now=_an())["ok"], "listede olmayan")
            eq(aktif.baslat(con, {}, "arastirma:999", now=_an())["status"], 409)
            r = aktif.baslat(con, {}, y["id"], now=_an())
            ok(r["ok"], r)
            e = con.execute("SELECT modul, tur, konu, durum FROM is_emirleri").fetchone()
            eq((e["modul"], e["tur"], e["konu"]), ("hkm", "bam.arastirma", "Kreatin ve uyku"))
            ok(r["note"], r)
            eq(cagri, [])
            from core import king
            if e["durum"] in king.ACIK:
                eq(aktif.tur(con, ACIK, "elle", now=_an(saat="10:05:00"))["yapilabilir"], [])
        finally:
            ai.ask = eski

    def t_haftalik():
        con = _con()
        pzt = "2026-09-21"                                          # pazartesi
        for i in range(1, 8):
            _kayit(con, "spi", _dun(pzt, i), sleep_hours=7)
        g = aktif.tur(con, ACIK, "elle", now=_an(gun=pzt, saat="09:00:00"))
        eq(g["hata"], [])
        eq((g["haftalik"]["from"], g["haftalik"]["to"]), ("2026-09-14", "2026-09-20"))
        eq(g["haftalik"]["gun"], {"ays": 0, "spi": 7, "esp": 0})
        cumle = [y for y in g["yapilan"] if y.startswith("Geçen haftanın raporu")]
        eq(cumle, ["Geçen haftanın raporu hazırlandı (14 Eylül – 20 Eylül): SPİ 7 gün kayıt; "
                   "AYS, ESP kayıt yok; önceki haftayla karşılaştırılacak kadar ölçüm yok."])
        no(" 0 " in cumle[0], "sifir yazilmadi")
        ikinci = aktif.tur(con, ACIK, "elle", now=_an(gun="2026-09-24"))
        eq(ikinci["haftalik"], None)
        no(any(y.startswith("Geçen haftanın") for y in ikinci["yapilan"]), "haftada bir")
        eq(aktif.tur(con, ACIK, "elle", now=_an(gun="2026-09-28"))["haftalik"]["donem"], "2026-W40")

    test("varsayılan kapalı; ayar doğrulanır", t_kapali)
    test("tetik: başlangıç, yeni kayıt, nabız, yeni gün", t_tetik)
    test("nabız: ölçüldü ya da veri yok, sıfır yok", t_nabiz)
    test("eksik: dünün ölçümü, akşam sessiz modül; kullanılmayan sayılmaz", t_eksik)
    test("tur modüle yazmaz, model çağırmaz", t_modula_yazmaz)
    test("düşen adım turu durdurmaz", t_hata_durdurmaz)
    test("son 500 tur tutulur; durum okunur", t_budama)
    test("eksik içerik: plansız ve süresi geçmiş hedef; tur plan açmaz", t_icerik_hedef)
    test("eskiyen araştırma yapılabilir: tur açmaz, dokununca King’e", t_yapilabilir)
    test("haftalık rapor haftada bir kez, sıfır yazmaz", t_haftalik)


def run_daemon():
    from tests.test_daemon import _Server
    suite("aktif kip · uçlar")

    def t_uclar():
        s = _Server()
        try:
            eq(s.call("/api/aktif", token=None)[0], 401)
            st, d = s.call("/api/aktif")
            eq((st, d["acik"], d["son"], d["kendiliginden"]), (200, False, None, False))
            eq(s.call("/api/config", body={"king": {"kendiliginden": "evet"}})[0], 422)
            st, c = s.call("/api/config", body={"king": {"kendiliginden": True}})
            eq((st, c["config"]["king"]["kendiliginden"]), (200, True))
            eq(s.call("/api/aktif")[1]["kendiliginden"], True)
            st, r = s.call("/api/aktif/tara", body={})
            eq((st, r["tur"]["neden"], len(r["tur"]["nabiz"])), (200, "elle", 3))
            eq(s.call("/api/config", body={"aktif": {"enabled": "evet"}})[0], 422)
            st, c = s.call("/api/config", body={"aktif": {"enabled": True}})
            eq((st, c["config"]["aktif"]["enabled"]), (200, True))
            eq(s.call("/api/aktif")[1]["acik"], True)
            eq(s.call("/api/aktif/baslat", token=None, body={"id": "x"})[0], 401)
            st, r = s.call("/api/aktif/baslat", body={"id": "arastirma:1"})
            eq((st, r["ok"]), (409, False))
        finally:
            s.close()

    test("uçlar bearer ister; elle tarama; ayar açar", t_uclar)
