# -*- coding: utf-8 -*-
"""Fis okuma — para kolunun fotograf girisi (kullanici karari 2026-09-24).

Korunan sozler: model OKUR, kod DOGRULAR, kullanici ONAYLAR. Onaysiz hicbir
tutar para kaydina girmez; okunamayan toplam uydurulmaz; kategoriyi model
degil kod sozlugu secer; fis okuma bir gorsel model atanmadan calismaz ve
bunu soyler."""

import base64
import datetime
import json
import os
import tempfile

from core import ai, db, fis, models, outbox, sohbet
from tests.harness import eq, no, ok, suite, test

BUGUN = "2026-09-24"
PNG = base64.b64encode(b"\x89PNG\r\n\x1a\n" + b"0" * 64).decode("ascii")


def _cfg():
    cfg = {"local_token": "x",
           "budget": {"monthly_try": 850.0, "usd_try": 48.6,
                      "rate_date": BUGUN, "ceiling_currency": "try"},
           "channels": {"telegram": {"enabled": True, "bot_token": "T",
                                     "allow_from": ["7"]}}}
    return models.apply(cfg, {"keys": {"google": "AIza-test"},
                              "assignments": {"king": {"provider": "google",
                                                       "model": "gemini-2.5-flash"}}})


def _model(govde):
    def t(provider, anahtar, model, sistem, mesajlar):
        t.gorulen = {"sistem": sistem, "mesajlar": mesajlar}
        return (govde if isinstance(govde, str) else json.dumps(govde, ensure_ascii=False)), 900, 120
    t.gorulen = None
    return t


FIS = {"magaza": "MİGROS", "tarih": "2026-09-23", "toplam": "245,90",
       "para_birimi": "TL",
       "kalemler": [{"ad": "Süt", "tutar": "45,90"}, {"ad": "Ekmek", "tutar": "15,00"},
                    {"ad": "Peynir", "tutar": "185,00"}]}


def run():
    suite("fis okuma")

    def t_saglayici_bicimleri():
        """Ayni gorsel uc saglayicinin kendi biciminde gider."""
        m = {"role": "user", "content": "Oku.", "gorseller": [{"mime": "image/png", "data": PNG}]}
        o = ai._openai_mesaj(m)
        eq(o["content"][0], {"type": "text", "text": "Oku."})
        ok(o["content"][1]["image_url"]["url"].startswith("data:image/png;base64,"))
        a = ai._anthropic_mesaj(m)
        eq(a["content"][0]["source"], {"type": "base64", "media_type": "image/png", "data": PNG})
        g = ai._google_parcalar(m)
        eq(g[0], {"inline_data": {"mime_type": "image/png", "data": PNG}})
        eq(g[-1], {"text": "Oku."})
        # Gorselsiz mesaj eskisi gibi duz metin kalir; bilinmeyen alan gitmez.
        eq(ai._openai_mesaj({"role": "user", "content": "x"}), {"role": "user", "content": "x"})
    test("gorsel uc saglayicinin biciminde gider", t_saglayici_bicimleri)

    def t_gorsel_dogrulama():
        eq(ai.gorsel_dogrula([{"mime": "image/png", "data": PNG}])[1], None)
        for bozuk in ([{"mime": "application/pdf", "data": PNG}],
                      [{"mime": "image/png", "data": "***"}],
                      [{"mime": "image/png"}], ["x"],
                      [{"mime": "image/png", "data": PNG}] * 5):
            ok(ai.gorsel_dogrula(bozuk)[1], bozuk)
    test("gorsel dogrulanir: tur, base64, sayi", t_gorsel_dogrulama)

    def t_butce_gorseli_sayar():
        """Gorselin jetonu tahmin edilir ve cagri oncesi tavana eklenir (D-18)."""
        con = db.connect(":memory:")
        cfg = _cfg()
        cfg["budget"] = {"ceiling_currency": "usd", "monthly_usd": 0.0012,
                         "usd_try": 0.0, "rate_date": ""}
        cagri = []
        r = ai.ask(con, cfg, "para.fis", "gorsel_oku",
                   [{"role": "user", "content": "Oku."}],
                   gorseller=[{"mime": "image/png", "data": PNG}] * 4,
                   transport=lambda *a: (cagri.append(1), ("{}", 10, 10))[1],
                   denetim="belge")
        no(r["ok"])
        eq(r["reason"], "budget")
        eq(cagri, [])
    test("gorselin jetonu tavana cagri oncesi eklenir", t_butce_gorseli_sayar)

    def t_model_yoksa_soyler():
        con = db.connect(":memory:")
        r = fis.oku(con, {"local_token": "x"}, base64.b64decode(PNG), "image/png", BUGUN)
        no(r["ok"])
        ok("model" in r["note"].lower(), r["note"])
        eq(con.execute("SELECT COUNT(*) FROM para").fetchone()[0], 0)
    test("gorsel model atanmadan fis okunmaz ve bu soylenir", t_model_yoksa_soyler)

    def t_okur_dogrular_taslak():
        con = db.connect(":memory:")
        m = _model(FIS)
        r = fis.oku(con, _cfg(), base64.b64decode(PNG), "image/png", BUGUN, transport=m)
        ok(r["ok"], r)
        t = r["taslak"]
        eq((t["kurus"], t["birim"], t["gun"], t["kategori"]), (24590, "TRY", "2026-09-23", "Gıda"))
        eq(t["etiket"], "tahmin")
        eq(t["uyarilar"], [])
        # Gorsel modele gitti; para kaydina HICBIR SEY yazilmadi.
        ok(m.gorulen["mesajlar"][-1]["gorseller"])
        eq(con.execute("SELECT COUNT(*) FROM para").fetchone()[0], 0)
        eq(fis.taslak(con, r["id"])["durum"], "bekliyor")
        # Gizlilik panosu (fikir 55): modele giden veri TURU adiyla gorunur.
        from core import gizlilik
        u = con.execute("SELECT veri FROM usage").fetchone()
        eq(u["veri"], "fis_gorseli")
        ok("fiş fotoğrafı" in gizlilik.ADLAR["fis_gorseli"])
    test("model okur, kod dogrular, taslak olur; hicbir sey yazilmaz", t_okur_dogrular_taslak)

    def t_tutarsizlik_ve_eksik():
        con = db.connect(":memory:")
        kotu = dict(FIS, kalemler=[{"ad": "Süt", "tutar": "45,90"}])
        r = fis.oku(con, _cfg(), base64.b64decode(PNG), "image/png", BUGUN, transport=_model(kotu))
        ok(r["ok"])
        ok(any("tutmuyor" in u for u in r["taslak"]["uyarilar"]), r["taslak"]["uyarilar"])
        # Gelecek ya da bozuk tarih: bugun yazilir ve SOYLENIR.
        r = fis.oku(con, _cfg(), base64.b64decode(PNG), "image/png", BUGUN,
                    transport=_model(dict(FIS, tarih="2027-01-01")))
        eq(r["taslak"]["gun"], BUGUN)
        ok(any("tarih" in u for u in r["taslak"]["uyarilar"]))
        # Toplam okunamadiysa taslak YOK: tutar uydurulmaz.
        for govde in (dict(FIS, toplam=None), dict(FIS, toplam="0"), "bu bir fis degil", {"okunamadi": True}):
            r = fis.oku(con, _cfg(), base64.b64decode(PNG), "image/png", BUGUN,
                        transport=_model(govde))
            no(r["ok"], govde)
            ok("toplam" in r["note"].lower() or "okuyamadım" in r["note"].lower(), r["note"])
    test("tutarsizlik soylenir; okunamayan toplam uydurulmaz", t_tutarsizlik_ve_eksik)

    def t_kaydet_duzelt_iptal():
        con = db.connect(":memory:")
        r = fis.oku(con, _cfg(), base64.b64decode(PNG), "image/png", BUGUN, transport=_model(FIS))
        k = fis.kaydet(con, r["id"], {"tutar": "250", "kategori": "Diğer"}, BUGUN)
        ok(k["ok"], k)
        p = con.execute("SELECT * FROM para").fetchone()
        eq((p["kurus"], p["kategori"], p["kaynak"], p["yon"]), (25000, "Diğer", "fis", "gider"))
        eq(fis.taslak(con, r["id"])["durum"], "kaydedildi")
        no(fis.kaydet(con, r["id"], None, BUGUN)["ok"])      # iki kez yazilmaz
        r2 = fis.oku(con, _cfg(), base64.b64decode(PNG), "image/png", BUGUN, transport=_model(FIS))
        ok(fis.iptal(con, r2["id"])["ok"])
        no(fis.kaydet(con, r2["id"], None, BUGUN)["ok"])
        # Bozuk duzeltme reddedilir, taslak bekler.
        r3 = fis.oku(con, _cfg(), base64.b64decode(PNG), "image/png", BUGUN, transport=_model(FIS))
        no(fis.kaydet(con, r3["id"], {"tutar": "abc"}, BUGUN)["ok"])
        eq(fis.taslak(con, r3["id"])["durum"], "bekliyor")
        eq(con.execute("SELECT COUNT(*) FROM para").fetchone()[0], 1)
    test("onayla kaydedilir, duzeltilebilir, iptal edilir, iki kez yazilmaz", t_kaydet_duzelt_iptal)

    def t_sohbet_komutlari():
        con = db.connect(":memory:")
        r = fis.oku(con, _cfg(), base64.b64decode(PNG), "image/png", BUGUN, transport=_model(FIS),
                    kanal="telegram", hedef="7")
        # Baska kanalin taslagi bu kanaldan onaylanmaz.
        c = sohbet.konus(con, _cfg(), "fiş kaydet", BUGUN, kanal="local")
        eq(c["command"], "fis")
        ok("bekleyen" in c["text"].lower(), c["text"])
        c = sohbet.konus(con, _cfg(), "fiş kaydet", BUGUN, kanal="telegram", hedef="7")
        ok("kaydedildi" in c["text"].lower(), c["text"])
        eq(fis.taslak(con, r["id"])["durum"], "kaydedildi")
        r2 = fis.oku(con, _cfg(), base64.b64decode(PNG), "image/png", BUGUN, transport=_model(FIS),
                     kanal="telegram", hedef="7")
        c = sohbet.konus(con, _cfg(), "fis iptal", BUGUN, kanal="telegram", hedef="7")
        eq(fis.taslak(con, r2["id"])["durum"], "iptal")
        eq(con.execute("SELECT COUNT(*) FROM para").fetchone()[0], 1)
    test("«fiş kaydet» / «fiş iptal» yalniz kendi kanalinin taslagina", t_sohbet_komutlari)

    def t_telegram_akisi():
        """«fiş» yazili fotograf okunur, taslak cevap olarak gider; baslıksiz
        fotograf okunmaz (maliyet ve mahremiyet)."""
        con = db.connect(":memory:")
        kok = tempfile.mkdtemp(prefix="hkm-fis-")
        yol = os.path.join(kok, "a.jpg")
        with open(yol, "wb") as f:
            f.write(base64.b64decode(PNG))
        for mid, baslik in (("1", "fiş"), ("2", None), ("3", "tatil fotoğrafı")):
            con.execute("INSERT INTO attachments(channel,sender,message_id,kind,file_id,state,"
                        "local_path,caption,mime_type,created_at) VALUES "
                        "('telegram','7',?,'photo',?, 'ready', ?, ?, 'image/jpeg', ?)",
                        (mid, "f" + mid, yol, baslik, BUGUN))
        m = _model(FIS)
        r = fis.telegram_isle(con, _cfg(), transport=m, bugun=BUGUN)
        eq(r["islenen"], 1)
        satir = con.execute("SELECT * FROM outbox").fetchall()
        eq(len(satir), 1)
        ok("fiş kaydet" in satir[0]["text"], satir[0]["text"])
        ok("245,90 TL" in satir[0]["text"], satir[0]["text"])
        eq(satir[0]["target"], "7")
        # Ikinci tik ayni eki bir daha okumaz.
        eq(fis.telegram_isle(con, _cfg(), transport=m, bugun=BUGUN)["islenen"], 0)
        eq(con.execute("SELECT COUNT(*) FROM para").fetchone()[0], 0)
    test("Telegram: «fiş» basligi okunur, taslak cevap gider; digerleri okunmaz",
         t_telegram_akisi)

    def t_kategori_koddan():
        """Kategoriyi model degil kod sozlugu secer; bilinmeyen «Diğer»."""
        eq(fis.kategori("MİGROS", []), "Gıda")
        eq(fis.kategori("Shell", [{"ad": "Benzin"}]), "Ulaşım")
        eq(fis.kategori("XYZ LTD", [{"ad": "Parça"}]), "Diğer")
    test("kategori kod sozlugunden", t_kategori_koddan)

    def t_gelen_fis_yaniti():
        """«fiş» basligiyla gelen fotografa anlik cevap «analiz kuyrugu» degil,
        ne olacagini soyler: okunur, taslak gelir, onaysiz yazilmaz."""
        from core import gelen
        con = db.connect(":memory:")
        m = {"id": "55", "from": "7", "text": "fiş",
             "attachment": {"kind": "photo", "file_id": "f55", "size": 10}}
        gelen.isle(con, _cfg(), "telegram", m, transport=lambda *a: (200, "{}"), date=BUGUN)
        t = con.execute("SELECT text FROM outbox ORDER BY id DESC").fetchone()["text"]
        ok("taslağ" in t and "onay" in t, t)
        m2 = dict(m, id="56", text="tatil", attachment=dict(m["attachment"], file_id="f56"))
        gelen.isle(con, _cfg(), "telegram", m2, transport=lambda *a: (200, "{}"), date=BUGUN)
        t2 = con.execute("SELECT text FROM outbox ORDER BY id DESC").fetchone()["text"]
        ok("analiz kuyruğuna" in t2, t2)
    test("«fiş» basligina anlik cevap ne olacagini soyler", t_gelen_fis_yaniti)
