# -*- coding: utf-8 -*-
"""112 cakisma — dilim duzeyinde (kullanici karari 2026-09-25).

Korunan sozler: dilim yalniz vakitle birlikte kabul edilir ve bilinen dort
dilimden biri olmalidir; ayni dilimi isteyen FARKLI modullerin etkin
hedefleri cakisir; ayni modulun iki hedefi, farkli dilimler, askidaki hedef
ve dilimi bilinmeyen hedef cakismaz; butce cevabi cakismalari tasir."""

from core import db, hedefag
from tests.harness import eq, no, ok, suite, test


def _h(id_, dilim=None, durum="aktif", dk=60, ozet=None):
    k = {"gunluk_dk": dk} if dk else {}
    if dilim:
        k["dilim"] = dilim
    return {"id": id_, "ozet": ozet or "hedef " + id_, "durum": durum, "paket": "x", "kapasite": k}


def run():
    suite("112 çakışma (dilim düzeyi)")

    def t_temizle():
        eq(hedefag.temizle(_h("1", "aksam"))["kapasite"], {"gunluk_dk": 60, "haftalik_gun": 7, "dilim": "aksam"})
        ok("dilim" not in hedefag.temizle(_h("2", "ikindi"))["kapasite"])
        eq(hedefag.temizle(_h("3", "aksam", dk=None))["kapasite"], None)
    test("oz-112 dilim yalnız vakitle ve bilinen dört dilimden biriyse alınır", t_temizle)

    def t_cakisma():
        con = db.connect(":memory:")
        hedefag.esitle(con, "ays", [_h("a1", "aksam", ozet="TYT paragraf"), _h("a2", "aksam"),
                                    _h("a3", "sabah"), _h("a4")])
        hedefag.esitle(con, "spi", [_h("s1", "aksam", dk=45, ozet="Koşu"), _h("s2", "ogle"),
                                    _h("s3", "sabah", durum="askida")])
        c = hedefag.butce(con)["cakismalar"]
        eq(len(c), 2)
        eq({(x["a"]["modul"], x["b"]["modul"], x["dilim"]) for x in c}, {("ays", "spi", "aksam")})
        s = [x for x in c if x["a"]["ad"] == "TYT paragraf"][0]
        eq((s["b"]["ad"], s["b"]["gunluk_dk"], s["dilim_adi"]), ("Koşu", 45, "akşam"))
    test("oz-112 aynı dilimi isteyen farklı modüllerin etkin hedefleri çakışır; aynı modül, "
         "farklı dilim, askıdaki ve dilimsiz hedef çakışmaz", t_cakisma)

    def t_bos():
        con = db.connect(":memory:")
        eq(hedefag.butce(con)["cakismalar"], [])
        hedefag.esitle(con, "esp", [_h("e1", "gece")])
        hedefag.esitle(con, "ays", [_h("a1", "gece", durum="askida")])
        eq(hedefag.butce(con)["cakismalar"], [])
    test("oz-112 hedef yoksa ya da eşleşme yoksa çakışma boş", t_bos)
