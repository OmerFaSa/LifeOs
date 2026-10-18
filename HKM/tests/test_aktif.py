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
        yamasi aktif kipi acar, bozuk deger 422."""
import datetime

from core import aktif, db, manager, sync_engine
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

    test("varsayılan kapalı; ayar doğrulanır", t_kapali)
    test("tetik: başlangıç, yeni kayıt, nabız, yeni gün", t_tetik)
    test("nabız: ölçüldü ya da veri yok, sıfır yok", t_nabiz)
    test("eksik: dünün ölçümü, akşam sessiz modül; kullanılmayan sayılmaz", t_eksik)
    test("tur modüle yazmaz, model çağırmaz", t_modula_yazmaz)
    test("düşen adım turu durdurmaz", t_hata_durdurmaz)
    test("son 500 tur tutulur; durum okunur", t_budama)


def run_daemon():
    from tests.test_daemon import _Server
    suite("aktif kip · uçlar")

    def t_uclar():
        s = _Server()
        try:
            eq(s.call("/api/aktif", token=None)[0], 401)
            st, d = s.call("/api/aktif")
            eq((st, d["acik"], d["son"]), (200, False, None))
            st, r = s.call("/api/aktif/tara", body={})
            eq((st, r["tur"]["neden"], len(r["tur"]["nabiz"])), (200, "elle", 3))
            eq(s.call("/api/config", body={"aktif": {"enabled": "evet"}})[0], 422)
            st, c = s.call("/api/config", body={"aktif": {"enabled": True}})
            eq((st, c["config"]["aktif"]["enabled"]), (200, True))
            eq(s.call("/api/aktif")[1]["acik"], True)
        finally:
            s.close()

    test("uçlar bearer ister; elle tarama; ayar açar", t_uclar)
