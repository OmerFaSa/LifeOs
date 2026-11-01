# -*- coding: utf-8 -*-
"""KING-4 A4: ajan dongusu (adim ve sure siniri, tekrar kirici) ve eylem
defteri (King'in yazdigi her is geri alinabilir). Ag'a cikilmaz."""
from core import arac, eylem, sohbet, soz
from tests.harness import eq, no, ok, suite, test
from tests.test_arac import BUGUN, KATALOG, _cfg, _con, _tasiyici

SONUC = [{"ad": "ays_denemeler", "param": {"aile": "TYT"}, "sonuc": [{"tarih": "2026-10-12", "toplamNet": 63.25}]}]


def run():
    suite("ajan dongusu ve eylem defteri (A4)")

    def t_dongu_of():
        eq(arac.dongu_of({"adim": 1, "gecen_ms": 900}), {"adim": 1, "gecen_ms": 900})
        for ham in (None, {}, {"adim": "x"}, {"adim": 0}, {"adim": arac.EN_COK_ADIM},
                    {"adim": 2, "gecen_ms": arac.SURE_SINIRI_MS}, {"adim": 2, "gecen_ms": -1}):
            eq(arac.dongu_of(ham), None)
    test("dongu siniri: adim ve sure", t_dongu_of)

    def t_ikinci_adim():
        # Sonuc turunde katalog yeniden sunulur; model bir okuma araci daha cagirir.
        t = _tasiyici(("", [{"ad": "sistem_haritasi", "param": {}}]))
        r = sohbet.konus(_con(), _cfg(), "son TYT denemem ve sistemde ne var", BUGUN, transport=t,
                         araclar=KATALOG, arac_sonuclari=SONUC, dongu={"adim": 1, "gecen_ms": 1200})
        eq((r["mode"], r["adim"], [c["ad"] for c in r["cagrilar"]]), ("arac", 2, ["sistem_haritasi"]))
        ok(t.gorulen[0]["ayar"].get("araclar"), "devam turunda katalog gitmedi")
        ok(arac.DONGU_TALIMATI.strip()[:20] in t.gorulen[0]["sistem"])
        ok("63.25" in t.gorulen[0]["sistem"], "onceki sonuc baglamda olmali")
    test("dongu: sonuc turunde bir arac daha", t_ikinci_adim)

    def t_tekrar_ve_sinir():
        # Ayni cagri tekrar edilirse reddedilir; model araclarsiz cevaplar.
        t = _tasiyici(("", [{"ad": "ays_denemeler", "param": {"aile": "TYT"}}]),
                      ("Son TYT denemende 63.25 net yaptın.", []))
        r = sohbet.konus(_con(), _cfg(), "son TYT denemelerim nasıldı", BUGUN, transport=t,
                         araclar=KATALOG, arac_sonuclari=SONUC, dongu={"adim": 1, "gecen_ms": 10})
        eq(r["mode"], "model")
        ok("63.25" in r["text"])
        no(t.gorulen[1]["ayar"].get("araclar"), "tekrardan sonra araclarsiz sorulmali")
        # Sinir asildi (ya da dongu yok: eski istemci): katalog gitmez, tek tur.
        for d in ({"adim": arac.EN_COK_ADIM, "gecen_ms": 0}, {"adim": 1, "gecen_ms": 31000}, None):
            t2 = _tasiyici(("Son TYT denemende 63.25 net yaptın.", []))
            sohbet.konus(_con(), _cfg(), "son TYT denemelerim nasıldı", BUGUN, transport=t2,
                         araclar=KATALOG, arac_sonuclari=SONUC, dongu=d)
            no(t2.gorulen[0]["ayar"].get("araclar"), "sinirda katalog gitmemeli: %s" % d)
        # Ilk turun cevabi adim 1 tasir.
        r0 = sohbet.konus(_con(), _cfg(), "son TYT denemelerim nasıldı", BUGUN,
                          transport=_tasiyici(("", [{"ad": "ays_denemeler", "param": {}}])), araclar=KATALOG)
        eq((r0["mode"], r0["adim"]), ("arac", 1))
    test("dongu: tekrar kirici, adim/sure siniri, eski istemci", t_tekrar_ve_sinir)

    def t_para_geri():
        con = _con()
        r = sohbet.konus(con, _cfg(), "market 450 TL", BUGUN, transport=_tasiyici())
        eq(r["mode"], "komut")
        e = eylem.listele(con)
        eq((len(e), e[0]["arac"], e[0]["geri_alinabilir"]), (1, "para.yaz", True))
        eq(con.execute("SELECT COUNT(*) FROM para WHERE silindi=0").fetchone()[0], 1)
        g = eylem.geri_al(con, e[0]["id"])
        ok(g["ok"], g)
        eq(con.execute("SELECT COUNT(*) FROM para WHERE silindi=0").fetchone()[0], 0)
        eq(eylem.listele(con)[0]["durum"], "geri_alindi")
        no(eylem.geri_al(con, e[0]["id"])["ok"], "iki kez geri alinmamali")
        no(eylem.geri_al(con, 999)["ok"])
    test("eylem: para kaydi deftere girer ve geri alinir", t_para_geri)

    def t_soz_geri():
        con = _con()
        s = soz.ekle(con, "yarın matematik çalışacağım", "Matematik çalıştın mı?", "2026-10-21T20:00:00",
                     "2026-10-21")
        eylem.soz_yazildi(con, {"soz": s["soz"]}, "local")
        g = eylem.geri_al(con, eylem.listele(con)[0]["id"])
        ok(g["ok"], g)
        eq(soz.getir(con, s["soz"]["id"])["durum"], "iptal")
    test("eylem: soz geri alinir", t_soz_geri)

    def t_istemci():
        con = _con()
        eid, h = eylem.istemciden(con, {"arac": "kayit_gir", "ozet": "Uyku 7 sa", "modul": "spi",
                                        "param": {"metin": "uyku 7"},
                                        "geri": {"ad": "kayit_sil", "param": {"id": "k1"}}})
        ok(eid, h)
        g = eylem.geri_al(con, eid)
        eq((g["ok"], g["istemci"]), (True, {"ad": "kayit_sil", "param": {"id": "k1"}}))
        # Ters islemi olmayan yazma: deftere girer, geri alinamaz der.
        e2, _ = eylem.istemciden(con, {"arac": "bolum_ac", "ozet": "Bütçe bölümü kapandı"})
        no(eylem.listele(con)[0]["geri_alinabilir"])
        no(eylem.geri_al(con, e2)["ok"])
        for kotu in ({}, {"arac": "x"}, {"arac": "x", "ozet": "y", "geri": {"ad": ""}},
                     {"arac": "x", "ozet": "y", "geri": "sil"}):
            eq(eylem.istemciden(con, kotu)[0], None)
    test("eylem: modulun yazmasi tersiyle kaydedilir", t_istemci)


def run_daemon():
    from tests.test_daemon import _Server
    suite("eylem · uclar")

    def t_uc():
        s = _Server()
        try:
            eq(s.call("/api/eylem", token=None)[0], 401)
            st, r = s.call("/api/eylem", {"arac": "kayit_gir", "ozet": "Uyku 7 sa",
                                                  "geri": {"ad": "kayit_sil", "param": {"id": "k1"}}})
            eq(st, 200)
            st, l = s.call("/api/eylem?limit=5")
            eq((st, l["eylemler"][0]["id"]), (200, r["id"]))
            st, g = s.call("/api/eylem/%d/geri" % r["id"], {})
            eq((st, g["istemci"]["ad"]), (200, "kayit_sil"))
            eq(s.call("/api/eylem/%d/geri" % r["id"], {})[0], 409)
            eq(s.call("/api/eylem", {"arac": "x"})[0], 400)
        finally:
            s.close()

    test("/api/eylem: kaydet, listele, geri al", t_uc)
