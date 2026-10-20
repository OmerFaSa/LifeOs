# -*- coding: utf-8 -*-
"""Ofis modeli — modullerin ofis sohbeti modeli HKM'den kullanir.

   Kanitlanan: rol sunucuda sabittir («<modul>.sohbet», bilinmeyen modul
   reddedilir); atama yoksa King'den miras alinir; model yoksa sebep doner;
   cevaptaki dayanaksiz olcum sayisi dusurulur (baglam brifingtir); bos ya
   da kullanici mesajiyla bitmeyen govde reddedilir."""
from core import db, models, ofismodel
from tests.harness import eq, no, ok, suite, test


def _cfg(model=True):
    cfg = {"local_token": "x", "budget": {"monthly_try": 850.0, "usd_try": 48.6,
                                          "rate_date": "2026-09-23", "ceiling_currency": "try"}}
    if not model:
        return cfg
    return models.apply(cfg, {"keys": {"google": "AIza-test"},
                              "assignments": {"king": {"provider": "google", "model": "gemini-2.5-flash"}}})


def _tasiyici(metin, gorulen=None):
    def cagir(provider, anahtar, model, sistem, gecmis):
        if gorulen is not None:
            gorulen.append({"sistem": sistem, "gecmis": gecmis})
        return metin, 100, 50
    return cagir


def run():
    suite("ofismodel")

    def t_rol():
        eq(ofismodel.rol_of("spi"), "spi.sohbet")
        eq(ofismodel.rol_of("SPI"), "spi.sohbet")
        eq(ofismodel.rol_of("king"), None)
        r = ofismodel.cevap(db.connect(":memory:"), _cfg(), {"modul": "x", "mesajlar": [{"role": "user", "text": "a"}]})
        no(r["ok"])
        eq(r["reason"], "modul")
    test("rol sunucuda sabit; bilinmeyen modul reddedilir", t_rol)

    def t_durum():
        d = ofismodel.durum(_cfg(), "spi")
        ok(d["ok"])
        eq(d["model"], "gemini-2.5-flash")
        ok(d["inherited"])
        d2 = ofismodel.durum(_cfg(False), "esp")
        no(d2["ok"])
        eq(d2["reason"], "no-model")
    test("atama yoksa King'den miras; model yoksa sebep", t_durum)

    def t_cevap():
        gor = []
        r = ofismodel.cevap(db.connect(":memory:"), _cfg(), {
            "modul": "spi", "sistem": "Sen Patron'sun.", "baglam": '{"uyku":7}',
            "mesajlar": [{"role": "user", "text": "merhaba"}, {"role": "agent", "text": "Merhaba!"},
                         {"role": "user", "text": "nasılsın"}]}, transport=_tasiyici("İyiyim, sen nasılsın?", gor))
        ok(r["ok"])
        eq(r["text"], "İyiyim, sen nasılsın?")
        eq(gor[0]["sistem"].startswith("Sen Patron'sun."), True)
        eq([m["role"] for m in gor[0]["gecmis"]], ["user", "assistant", "user"])
    test("cevap HKM modeliyle; gecmis rolleri cevrilir", t_cevap)

    def t_uydurma():
        r = ofismodel.cevap(db.connect(":memory:"), _cfg(), {
            "modul": "spi", "baglam": '{"uyku":7}',
            "mesajlar": [{"role": "user", "text": "uykum?"}]}, transport=_tasiyici("Uyku ortalaman 9 saat."))
        no(r["ok"])
        eq(r["reason"], "dropped")
    test("baglamda olmayan olcum sayisi dusurulur", t_uydurma)

    def t_bos():
        r = ofismodel.cevap(db.connect(":memory:"), _cfg(), {"modul": "spi", "mesajlar": [{"role": "agent", "text": "x"}]})
        no(r["ok"])
        eq(r["reason"], "bos")
    test("kullanici mesajiyla bitmeyen govde reddedilir", t_bos)

    def t_gorsel():
        eq(ofismodel.rol_of("spi", "gorsel"), "spi.gorsel")
        eq(ofismodel.rol_of("spi", "plan"), None)
        gor = []
        png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        r = ofismodel.cevap(db.connect(":memory:"), _cfg(), {
            "modul": "spi", "yetenek": "gorsel", "gorseller": [{"mime": "image/png", "data": png}],
            "mesajlar": [{"role": "user", "text": "Fişi oku, JSON döndür."}]},
            transport=_tasiyici('{"toplam": 412.5}', gor))
        ok(r["ok"])
        eq(r["text"], '{"toplam": 412.5}')
        eq(len(gor[0]["gecmis"][-1].get("gorseller") or []), 1)
        r2 = ofismodel.cevap(db.connect(":memory:"), _cfg(), {
            "modul": "spi", "yetenek": "gorsel", "mesajlar": [{"role": "user", "text": "oku"}]})
        no(r2["ok"])
        eq(r2["reason"], "gorsel")
    test("gorsel: goruntu son mesaja eklenir, belge denetimi (sayi dusmez); gorselsiz reddedilir", t_gorsel)
