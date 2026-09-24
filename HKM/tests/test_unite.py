# -*- coding: utf-8 -*-
"""ESP dil unitesi (core/unite.py; Part 8d).

   Kanitladigi sozler:
     1. Girdi kapalidir: dil, duzey, konu, unite ve oge sayisi; bilinmeyen
        alan ve aralik disi sayi reddedilir.
     2. Yazi sistemi kodla denetlenir: Rusca on yuz Kiril olmayan oge,
        Kiril arka yuz ve on=arka duser; tekrar eden on yuz bir kez girer.
     3. Bagimsiz yargi «dogru» demeyen oge duser; 6'nin altina inen unite
        kayda girmez; hic unite kalmazsa kayit yok, teklif yok.
     4. Soru YAZDIRILMAZ: istem soru ya da sik istemez.
     5. Is King'in teklifinden gecer (2 cagri); biten kayit ESP'ye
        `unite.add` niyeti olarak birakilir, etiket «dogrulanmadi»."""
import json

from core import bam, db, intents, king, teklif, unite
from tests.yardim import onayla
from tests.harness import eq, no, ok, suite, test
from tests.test_bam import _cfg

AN = "2026-09-24T10:00:00"
RU = [("Привет", "merhaba"), ("Спасибо", "teşekkürler"), ("Пожалуйста", "lütfen"),
      ("До свидания", "hoşça kal"), ("Да", "evet"), ("Нет", "hayır"), ("Извините", "affedersiniz"),
      ("Доброе утро", "günaydın")]


def _unite(ogeler, baslik="Selamlaşma"):
    return {"baslik": baslik, "hedef": "Sekiz selamlaşma kalıbını düşünmeden kurmak.",
            "gorev": "Bir gün boyunca içinden bu kalıpları kur.",
            "ogeler": [{"on": a, "arka": b} for a, b in ogeler]}


class _Model(object):
    """Uretimde bir gecerli, bir kisa unite; yargida «Да» yanlis sayilir."""
    def __init__(self, yargi_hepsi_yanlis=False):
        self.cagri = []
        self.hepsi_yanlis = yargi_hepsi_yanlis

    def __call__(self, provider, anahtar, model, sistem, gecmis):
        self.cagri.append(sistem)
        if "Kalite Kontrol" in sistem:
            d = json.loads(gecmis[-1]["content"])
            return json.dumps({"yargilar": [
                {"no": m["no"], "dogru_mu": not self.hepsi_yanlis and m["on"] != "Да",
                 "neden": "çeviri eksik"} for m in d["maddeler"]]}, ensure_ascii=False), 40, 40
        birinci = RU + [("Hello", "merhaba"), ("Привет", "selam"), ("Мир", "Мир")]
        ikinci = RU[:5]
        return json.dumps({"uniteler": [_unite(birinci), _unite(ikinci, "Kısa")]},
                          ensure_ascii=False), 80, 80


def _tik(con, cfg, model, n):
    for _ in range(n):
        bam.ilerlet(con, cfg, transport=model, now=AN)
        king.esitle(con, now=AN)


def _niyetler(con):
    return [(n["kind"], n["payload"]) for n in db.intents_for(con, "esp", ("pending",))]


def run():
    suite("unite")

    def t_girdi():
        g, h = unite.temizle({"dil": "ru", "duzey": "a1", "konu": "selamlaşma"})
        eq(h, [])
        eq(g, {"dil": "ru", "duzey": "A1", "konu": "selamlaşma", "unite": 2, "oge": 12})
        for kotu in ({"dil": "tr", "duzey": "A1", "konu": "x y"},
                     {"dil": "ru", "duzey": "D1", "konu": "selam"},
                     {"dil": "ru", "duzey": "A1", "konu": "selam", "oge": 40},
                     {"dil": "ru", "duzey": "A1", "konu": "selam", "yas": 17}):
            no(unite.temizle(kotu)[1] == [], kotu)
        eq(king.emir_ac(db.connect(":memory:"), _cfg(), "ays", "esp.unite",
                        {"unite": {"dil": "ru", "duzey": "A1", "konu": "selam"}})["ok"], False)
    test("girdi kapalidir", t_girdi)

    def t_yazi_sistemi():
        g = {"dil": "ru", "duzey": "A1", "konu": "selam", "unite": 2, "oge": 12}
        d = {"uniteler": [_unite(RU + [("Hello", "merhaba"), ("Привет", "selam"),
                                       ("Мир", "Мир")]), _unite(RU[:5], "Kısa")]}
        (u, dusen), hata = unite.ayikla(d, g)
        eq(hata, None)
        eq(len(u), 1)                                     # 5 ogeli unite girmez
        eq([o["on"] for o in u[0]["ogeler"]], [a for a, _ in RU])
        eq(dusen, 2)                                      # Latin on yuz + Kiril arka
        ok(unite.yazi_tutar("ar", "مرحبا") and not unite.yazi_tutar("en", "Привет"))
        ok(unite.yazi_tutar("de", "Grüß Gott") and not unite.yazi_tutar("ru", "Privet"))
        eq(unite.ayikla({"uniteler": [_unite(RU[:3])]}, g)[0], None)
        # Soru yazdirilmaz: bicim sik ya da celdirici istemez.
        ok("Soru, şık ya da çeldirici YAZMA" in unite.BICIM)
    test("yazi sistemi kodla denetlenir; kisa unite girmez", t_yazi_sistemi)

    def t_teklif_birim():
        b = teklif.birim("esp.unite", {"unite": {}}, ["kayit", "uretim"])
        eq((b["model"], b["web"]), (2, 0))
        eq(teklif.sinif(b), "dusuk")
    test("teklif: iki cagri, dusuk sinif", t_teklif_birim)

    def t_is_ve_niyet():
        con = db.connect(":memory:")
        m = _Model()
        r = king.emir_ac(con, _cfg(), "esp", "esp.unite",
                         {"unite": {"dil": "ru", "duzey": "A1", "konu": "selamlaşma"}}, now=AN)
        ok(r["ok"], r)
        e = onayla(con, _cfg(), r, now=AN)["emir"]
        _tik(con, _cfg(), m, 4)
        son = king.emir(con, e["id"])
        eq(son["durum"], "bitti")
        eq(len(m.cagri), 2)                               # uretim + bagimsiz yargi
        k = bam.kayit_getir(con, son["sonuc"]["kayit_id"])
        g = k["govde"]
        eq((k["dogruluk"], g["tur"], g["dil"], g["duzey"]), ("dogrulanmadi", "unite", "ru", "A1"))
        eq(len(g["uniteler"]), 1)
        eq([o["on"] for o in g["uniteler"][0]["ogeler"]], [a for a, _ in RU if a != "Да"])
        eq(g["kalite"]["gecen"], 7)
        n = _niyetler(con)
        eq([x[0] for x in n], ["unite.add"])
        eq((n[0][1]["dil"], n[0][1]["unite"], n[0][1]["oge"]), ("ru", 1, 7))
        ok(intents.validate("esp", "unite.add", n[0][1])[0])
    test("is: uretim + yargi, kayit dogrulanmadi, ESP'ye unite.add", t_is_ve_niyet)

    def t_yargi_hepsini_dusurur():
        con = db.connect(":memory:")
        e = onayla(con, _cfg(), king.emir_ac(con, _cfg(), "esp", "esp.unite",
                   {"unite": {"dil": "ru", "duzey": "A1", "konu": "selamlaşma"}}, now=AN),
                   now=AN)["emir"]
        _tik(con, _cfg(), _Model(yargi_hepsi_yanlis=True), 4)
        eq(king.emir(con, e["id"])["durum"], "hata")
        eq(_niyetler(con), [])
    test("yargi hepsini dusururse kayit ve teklif yok", t_yargi_hepsini_dusurur)
