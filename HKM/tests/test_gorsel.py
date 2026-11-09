# -*- coding: utf-8 -*-
"""Görsel/ses öğrenme kaynakları (core/gorsel.py): lisans sınıfı, mod süzgeci, önbellek, web kapalı."""
import json

from core import db, gorsel
from tests.harness import ok, no, eq, suite, test


def _con():
    return db.connect(":memory:")


def _tasiyici(cagri):
    def t(url, basliklar=None, govde=None, guvenilir=False):
        cagri.append(url)
        if "wikipedia.org" in url:
            # «limit» sayfasının görseli yok: Commons aramasına düşülür (orada NC ve hakları saklı var)
            body = {"query": {"pages": {"1": {"title": "Limit"}}}} if "Limit" in url or "limit" in url else \
                {"query": {"pages": {"1": {"title": "Türev", "pageimage": "Tangent_to_a_curve.svg"}}}}
        elif "list=search" in url:
            body = {"query": {"search": [{"title": "File:Derivative_nc.png"}, {"title": "File:Arr.jpg"}]}}
        else:
            md = lambda l: {"LicenseShortName": {"value": l}, "Artist": {"value": "<a>Yazar</a>"}}
            body = {"query": {"pages": {
                "1": {"title": "File:Tangent_to_a_curve.svg", "imageinfo": [{"thumburl": "https://u/t.png", "url": "https://u/t.svg",
                      "descriptionurl": "https://c/t", "mime": "image/svg+xml", "extmetadata": md("Public domain")}]},
                "2": {"title": "File:Derivative_nc.png", "imageinfo": [{"url": "https://u/d.png", "descriptionurl": "https://c/d",
                      "mime": "image/png", "extmetadata": md("CC BY-NC-SA 4.0")}]},
                "3": {"title": "File:Arr.jpg", "imageinfo": [{"url": "https://u/a.jpg", "descriptionurl": "https://c/a",
                      "mime": "image/jpeg", "extmetadata": md("All rights reserved")}]},
                "4": {"title": "File:De-Haus.ogg", "imageinfo": [{"url": "https://u/h.ogg", "descriptionurl": "https://c/h",
                      "mime": "application/ogg", "extmetadata": md("CC BY-SA 3.0")}]}}}}
        return 200, {}, json.dumps(body).encode("utf-8"), url
    return t


def _resim():
    eq(gorsel.sinif("Public domain"), "acik")
    eq(gorsel.sinif("CC BY-SA 4.0"), "acik")
    eq(gorsel.sinif("CC BY-NC-SA 4.0"), "kisisel")
    eq(gorsel.sinif("All rights reserved"), None)
    con, cagri = _con(), []
    r = gorsel.resim(con, {}, "türev", tasiyici=_tasiyici(cagri))
    ok(r["ok"])
    eq([x["sinif"] for x in r["liste"]], ["acik"])          # sayfa görseli varsa yalnız o (en ilgili)
    eq(r["liste"][0]["yazar"], "Yazar")
    r = gorsel.resim(con, {}, "limit", tasiyici=_tasiyici(cagri))
    eq([x["sinif"] for x in r["liste"]], ["kisisel"])       # aramadan: NC kişisel modda, hakları saklı hiç
    n = len(cagri)
    r2 = gorsel.resim(con, {"icerik": {"mod": "ticari"}}, "limit", tasiyici=_tasiyici(cagri))
    eq(len(cagri), n)                                   # önbellekten
    no(r2["ok"])                                        # ticari modda kişisel kullanımlık süzülür
    no(gorsel.resim(con, {"web": {"acik": False}}, "integral", tasiyici=_tasiyici(cagri))["ok"])


def _ses():
    r = gorsel.ses(_con(), {}, "Haus", dil="de", tasiyici=_tasiyici([]))
    ok(r["ok"])
    eq(r["liste"][0]["url"], "https://u/h.ogg")


def run():
    suite("gorsel")
    test("görsel: lisans sınıfı; kişisel modda NC dahil, ticaride yalnız açık; hakları saklı hiç; önbellek", _resim)
    test("ses: telaffuz kaydı Commons'tan, lisanslı ve ses türünde", _ses)
