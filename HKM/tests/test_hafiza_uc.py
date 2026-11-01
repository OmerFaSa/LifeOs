# -*- coding: utf-8 -*-
"""Hafiza (uc katman) ve kendiliginden King HTTP uclari testleri (052)."""
import datetime
import time
import urllib.parse

from tests.harness import eq, no, ok, suite, test


def run():
    from tests.test_daemon import _Server

    suite("hafiza ve kendiliginden King uclari")
    s = _Server()
    ctx = {}
    try:
        def t_hafiza_listele():
            # 1. GET /api/hafiza jetonsuz 401; jetonla 200 ve bilgiler, olanlar, beceriler, adaylar anahtarları.
            st, _ = s.call("/api/hafiza", token=None)
            eq(st, 401)

            st, r = s.call("/api/hafiza")
            eq(st, 200)
            for k in ("bilgiler", "olanlar", "beceriler", "adaylar"):
                ok(k in r, "anahtar eksik: %s" % k)

            # POST /api/memory {text} ile yazılan bilgi bilgiler'de kaynak ve tarih'le görünür.
            st, m = s.call("/api/memory", {"text": "Fıstık alerjim var"})
            eq(st, 200)
            ok(m.get("ok"))
            ctx["hafiza_id"] = m["id"]

            st, r2 = s.call("/api/hafiza")
            eq(st, 200)
            bulunan = [b for b in r2.get("bilgiler", []) if b["id"] == ctx["hafiza_id"]]
            ok(len(bulunan) == 1, "eklenen bilgi bilgiler'de bulunamadi")
            b = bulunan[0]
            eq(b["metin"], "Fıstık alerjim var")
            ok("kaynak" in b and b["kaynak"], "kaynak alani eksik")
            ok("tarih" in b and b["tarih"], "tarih alani eksik")
        test("GET /api/hafiza jetonsuz 401, jetonla anahtarlar ve POST /api/memory", t_hafiza_listele)

        def t_hafiza_ara():
            # 2. GET /api/hafiza/ara?q=... 200, yontem «kok» (testte ağ kapalı), ilk sonuç yazılan bilgi.
            st, r = s.call("/api/hafiza/ara?q=" + urllib.parse.quote("fıstık"))
            eq(st, 200)
            eq(r.get("yontem"), "kok")
            ok(r.get("sonuclar"), "sonuclar bos")
            eq(r["sonuclar"][0]["id"], ctx["hafiza_id"])
            eq(r["sonuclar"][0]["metin"], "Fıstık alerjim var")
        test("GET /api/hafiza/ara arama ve kok yontemi", t_hafiza_ara)

        def t_hafiza_duzelt_unut():
            # 3. POST /api/hafiza/<id>/duzelt {text} 200 ve metin değişir; boş metin 404; olmayan id 404.
            hid = ctx["hafiza_id"]
            st, _ = s.call("/api/hafiza/%d/duzelt" % hid, {"text": ""})
            eq(st, 404)

            st, _ = s.call("/api/hafiza/999999/duzelt", {"text": "Yeni metin"})
            eq(st, 404)

            st, d = s.call("/api/hafiza/%d/duzelt" % hid, {"text": "Ceviz ve fıstık alerjim var"})
            eq(st, 200)
            ok(d.get("ok"))

            st, r = s.call("/api/hafiza")
            eq(st, 200)
            bulunan = [b for b in r.get("bilgiler", []) if b["id"] == hid]
            ok(len(bulunan) == 1)
            eq(bulunan[0]["metin"], "Ceviz ve fıstık alerjim var")

            # POST /api/hafiza/<id>/unut 200, ikinci kez 404; GET /api/hafiza'da artık yok.
            st, u = s.call("/api/hafiza/%d/unut" % hid, {})
            eq(st, 200)
            ok(u.get("ok"))

            st, u2 = s.call("/api/hafiza/%d/unut" % hid, {})
            eq(st, 404)

            st, r2 = s.call("/api/hafiza")
            eq(st, 200)
            ok(not any(b["id"] == hid for b in r2.get("bilgiler", [])), "silinen bilgi hala listede")
        test("POST /api/hafiza/<id>/duzelt ve /unut", t_hafiza_duzelt_unut)

        def t_olay():
            # 4. POST /api/olay (KING-OLAY.md biçimi; spi, uyku_dustu, ort7 5,5, ort28 7,2, at şimdi) 200 ve
            # karar «basla» ya da «bekliyor» (sessiz saat 23:00–08:00); aynı kimlik ikinci kez tekrar: true.
            # Biçimsiz gövde 400.
            st, _ = s.call("/api/olay", {"modul": "gecersiz"})
            eq(st, 400)
            st, _ = s.call("/api/olay", {})
            eq(st, 400)

            simdi = datetime.datetime.now().replace(microsecond=0).isoformat()
            olay_govde = {
                "modul": "spi",
                "tur": "uyku_dustu",
                "kimlik": "spi.uyku_dustu.test_uc_%s" % int(time.time()),
                "at": simdi,
                "sayilar": {
                    "ort7": {"deger": 5.5, "birim": "saat", "etiket": "ölçüldü"},
                    "ort28": {"deger": 7.2, "birim": "saat", "etiket": "hesaplandı"}
                }
            }
            st, res = s.call("/api/olay", olay_govde)
            eq(st, 200)
            ok(res.get("ok"))
            ok(res.get("karar") in ("basla", "bekliyor"), "karar basla ya da bekliyor olmali: %s" % res.get("karar"))
            no(res.get("tekrar"))
            ctx["karar"] = res["karar"]
            ctx["olay_id"] = res["id"]

            st, res2 = s.call("/api/olay", olay_govde)
            eq(st, 200)
            ok(res2.get("ok"))
            eq(res2.get("tekrar"), True)
            eq(res2.get("id"), ctx["olay_id"])
        test("POST /api/olay dogrulama, karar ve tekrar kontrolu", t_olay)

        def t_kendiliginden():
            # 5. GET /api/king/kendiliginden 200: butce.toplam 3, sessiz_saat, kararlar[0].tur «uyku_dustu».
            # Karar «basla» ise bekleyen[0].neden.olay «spi.uyku_dustu».
            st, r = s.call("/api/king/kendiliginden")
            eq(st, 200)
            eq(((r.get("butce") or {}).get("toplam")), 3)
            ok("sessiz_saat" in r)
            ok(r.get("kararlar"), "kararlar bos")
            eq(r["kararlar"][0]["tur"], "uyku_dustu")
            if ctx.get("karar") == "basla":
                ok(r.get("bekleyen"), "bekleyen bos")
                eq(r["bekleyen"][0]["neden"]["olay"], "spi.uyku_dustu")
        test("GET /api/king/kendiliginden butce, sessiz saat ve kararlar", t_kendiliginden)

        def t_bekleyen():
            # 6. Karar «basla» ise GET /api/king/bekleyen?modul=spi mesajı neden alanıyla verir.
            st, r = s.call("/api/king/bekleyen?modul=spi")
            eq(st, 200)
            if ctx.get("karar") == "basla":
                ok(r.get("mesajlar"), "bekleyen mesajlar bos")
                bulunan = [m for m in r["mesajlar"] if m.get("neden") and m["neden"].get("olay") == "spi.uyku_dustu"]
                ok(len(bulunan) >= 1, "neden alanli mesaj bulunamadi")
                n = bulunan[0]["neden"]
                eq(n["olay"], "spi.uyku_dustu")
                eq(n["kural"], "uyku_7g_dusus")
        test("GET /api/king/bekleyen modul ve neden alani kontrolu", t_bekleyen)
    finally:
        s.close()
