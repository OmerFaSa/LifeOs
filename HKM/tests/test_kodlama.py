# -*- coding: utf-8 -*-
"""Kodlama adayi (core/kodlama.py). Ag yok: sahte tasiyici.

   Kanitladigi sozler:
     1. Aday sayfanin kendi cumlesidir ve adresiyle doner.
     2. Kodlama isareti ve konu koku birlikte gerekir.
     3. Cevabi iceren cumle elenir.
     4. Web kapaliysa ok:false ve neden; bicimsiz govde 400."""
import json
import urllib.parse

from core import db, kodlama
from tests.harness import eq, no, ok, suite, test
from tests.test_bam import _cfg

METIN = {
    "Dik üçgen": "Dik üçgen geometrinin temelidir. Pisagor üçlülerini akılda tutmak için 3-4-5 kodlaması kullanılır. "
                 "Öklid bağıntısında yükseklik kare iki parçanın çarpımıdır diye ezberlenir; cevap 15 çıkar. "
                 "Kısaltma kullanmayı seven öğrenciler için hafıza tekniği önerilir ama bu cümle konudan bağımsız.",
}


def _cfg_web():
    c = _cfg()
    c["web"] = {"acik": True}
    return c


class _Ag(object):
    def __init__(self):
        self.cagri = []

    def __call__(self, url, basliklar=None, govde=None, guvenilir=False):
        self.cagri.append(url)
        q = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(url).query))
        if q.get("list") == "search":
            d = {"query": {"search": [{"title": t, "snippet": t} for t in METIN]}}
        else:
            t = q.get("titles")
            d = {"query": {"pages": {"1": {"title": t, "extract": METIN.get(t, "")}}}}
        return 200, {"Content-Type": "application/json"}, json.dumps(d).encode("utf-8"), url


def run():
    suite("kodlama")

    def t_suzgec():
        m = METIN["Dik üçgen"]
        a = kodlama.adaylar(m, "Dik üçgen", ["Pisagor", "Öklid"], ["15"])
        ok(any("3-4-5" in x for x in a), "isaretli ve konulu cumle aday")
        no(any("bağımsız" in x for x in a), "konu koku olmayan cumle aday degil")
        no(any("Dik üçgen geometrinin" in x for x in a), "isaretsiz cumle aday degil")
        b = kodlama.adaylar(m, "Dik üçgen", ["Öklid"], ["iki parçanın çarpımı"])
        no(any("Öklid" in x for x in b), "cevabi iceren cumle elenir")
    test("suzgec: isaret + konu koku; cevabi veren elenir", t_suzgec)

    def t_ara():
        con, ag = db.connect(":memory:"), _Ag()
        r = kodlama.ara(con, _cfg_web(), "Dik üçgen", ["Pisagor"], [], tasiyici=ag, now="2026-11-06T10:00:00")
        ok(r["ok"], r.get("note"))
        ok(all(x["url"].startswith("http") for x in r["adaylar"]), "her aday adresli")
        ok(any("3-4-5" in x["metin"] for x in r["adaylar"]))
    test("ara: sayfanin cumlesi adresiyle doner", t_ara)

    def t_kapali():
        con = db.connect(":memory:")
        r = kodlama.ara(con, _cfg(), "Dik üçgen")
        no(r["ok"])
        ok(r["note"])
        eq(kodlama.uc(con, _cfg(), "POST", kodlama.YOL, {}, {"konu": 5})[0], 400)
        eq(kodlama.uc(con, _cfg(), "POST", kodlama.YOL, {}, {"konu": "x"})[1]["ok"], False)
    test("web kapali: neden soylenir; bicimsiz govde 400", t_kapali)
