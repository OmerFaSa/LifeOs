# -*- coding: utf-8 -*-
"""Ek cozumleme — belge yerelde, ses/video Gemini (kullanici karari 2026-09-25).

Korunan sozler: belge model olmadan okunur ve disari gitmez; okunamayan
belge «okundu» denmez; ses/video YALNIZ Google saglayicisina gider, baska
saglayicida model cagrilmaz ve nedeni soylenir; buyuk dosya gonderilmez;
ek bir kez islenir (hata olsa da her tikte modele gitmez); sonuc gonderene
yazilir ve hicbir aksiyonu tetiklemez."""

import json
import os
import tempfile
import zipfile
import zlib

from core import belge, cikti, cozumle, db, models, pdf, urunler
from tests.harness import eq, no, ok, suite, test

BUGUN = "2026-09-25"


def _cfg(provider="google", model="gemini-2.5-flash"):
    cfg = {"local_token": "x",
           "budget": {"monthly_try": 850.0, "usd_try": 48.6,
                      "rate_date": BUGUN, "ceiling_currency": "try"},
           "channels": {"telegram": {"enabled": True, "bot_token": "T", "allow_from": ["7"]}}}
    anahtar = {"google": "AIza-test", "anthropic": "sk-ant-test"}[provider]
    return models.apply(cfg, {"keys": {provider: anahtar},
                              "assignments": {"king": {"provider": provider, "model": model}}})


def _model(metin):
    def t(provider, anahtar, model, sistem, mesajlar):
        t.cagri.append({"provider": provider, "sistem": sistem, "mesajlar": mesajlar})
        return metin, 1200, 90
    t.cagri = []
    return t


def _dosya(ad, ham):
    d = tempfile.mkdtemp()
    yol = os.path.join(d, ad)
    with open(yol, "wb") as f:
        f.write(ham)
    return yol


def _ek(con, kind, yol, mime, ad=None, sure=None, mid="1", baslik=None):
    con.execute("INSERT INTO attachments(channel,sender,message_id,kind,file_id,state,local_path,"
                "mime_type,file_name,duration,caption,created_at) VALUES "
                "('telegram','7',?,?,?, 'ready', ?, ?, ?, ?, ?, ?)",
                (mid, kind, "f" + mid, yol, mime, ad, sure, baslik, BUGUN))
    return con.execute("SELECT max(id) FROM attachments").fetchone()[0]


def _giden(con):
    return [dict(r) for r in con.execute("SELECT * FROM outbox ORDER BY id")]


def _pdf_elle(metin):
    """Yazi tipi gomulu olmayan, FlateDecode akisli en kucuk PDF (WinAnsi)."""
    icerik = zlib.compress(("BT /F1 12 Tf 72 720 Td (%s) Tj ET" % metin).encode("latin-1"))
    n = [b"<< /Type /Catalog /Pages 2 0 R >>",
         b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
         b"<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
         b"<< /Length %d /Filter /FlateDecode >>\nstream\n" % len(icerik) + icerik + b"\nendstream",
         b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
    out = b"%PDF-1.4\n"
    for i, g in enumerate(n, 1):
        out += b"%d 0 obj\n" % i + g + b"\nendobj\n"
    return out + b"trailer << /Root 1 0 R >>\n%%EOF"


def run():
    suite("ek çözümleme (belge · ses · video)")

    def t_belge_turleri():
        eq(belge.metin_cikar(_dosya("not.txt", "Merhaba dünya, bugün çalıştım.".encode("utf-8")))["kelime"], 4)
        d = _dosya("a.docx", b"")
        with zipfile.ZipFile(d, "w") as z:
            z.writestr("word/document.xml",
                       '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
                       '<w:body><w:p><w:r><w:t>Birinci </w:t></w:r><w:r><w:t>paragraf</w:t></w:r></w:p>'
                       '<w:p><w:r><w:t>İkinci satır ğüş</w:t></w:r></w:p></w:body></w:document>')
        r = belge.metin_cikar(d)
        eq((r["ok"], r["metin"]), (True, "Birinci paragraf\nİkinci satır ğüş"))
        o = _dosya("b.odt", b"")
        with zipfile.ZipFile(o, "w") as z:
            z.writestr("content.xml", '<o:d xmlns:o="x" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">'
                       '<text:p>Açık belge metni</text:p></o:d>')
        eq(belge.metin_cikar(o)["metin"], "Açık belge metni")
        eq(belge.metin_cikar(_dosya("c.pdf", _pdf_elle("Deneme metni burada")))["metin"], "Deneme metni burada")
    test("belge: metin, Word, ODT ve sıkıştırılmış PDF yerelde okunur", t_belge_turleri)

    def t_pdf_turkce():
        yt = pdf.yazi_tipi_bul()
        if not yt[0]:
            ok(True)       # sistemde TrueType yok: HKM PDF'i zaten yazamaz
            return
        g = {"baslik": "Kurtuluş Savaşı", "alt_baslik": "ğüşıöç İĞÜŞÖÇ", "bolumler": [
            {"baslik": "Giriş", "bloklar": [{"t": "p", "metin": "Milli mücadele 1919'da başladı."}]}]}
        b = cikti.belge({"id": 7, "tur": "materyal", "baslik": "x", "dogruluk": "kaynakli",
                         "created_at": "2026-09-23", "govde": urunler.ayikla("ozet", g)[0]})
        r = belge.metin_cikar(_dosya("t.pdf", pdf.belge_pdf(b)["bayt"]))
        ok(r["ok"], r)
        ok("ğüşıöç İĞÜŞÖÇ" in r["metin"] and "Milli mücadele 1919'da başladı." in r["metin"], r["metin"])
        eq(r["sayfa"], 1)
    test("belge: gömülü yazı tipli PDF'te Türkçe harfler ToUnicode ile doğru gelir", t_pdf_turkce)

    def t_okunamayan():
        r = belge.metin_cikar(_dosya("s.pdf", b"%PDF-1.4\n1 0 obj << /Encrypt 2 0 R >> endobj"))
        no(r["ok"])
        ok("Şifreli" in r["note"])
        r = belge.metin_cikar(_dosya("t.pdf", b"%PDF-1.4\n1 0 obj << /Type /Page >> endobj"))
        no(r["ok"])
        ok("taranmış" in r["note"])
        r = belge.metin_cikar(_dosya("x.xlsx", b"PK"))
        no(r["ok"])
        ok("okuyamıyorum" in r["note"])
        no(belge.metin_cikar(_dosya("k.docx", b"bozuk"))["ok"])
    test("belge: şifreli, taranmış, desteklenmeyen ve bozuk belge «okundu» denmez", t_okunamayan)

    def t_belge_modelsiz():
        con = db.connect(":memory:")
        m = _model("x")
        i = _ek(con, "document", _dosya("n.txt", "Toplantı notu: salı günü sunum var.".encode("utf-8")),
                "text/plain", "n.txt")
        eq(cozumle.isle(con, _cfg(), transport=m, bugun=BUGUN)["islenen"], 1)
        eq(m.cagri, [])
        a = con.execute("SELECT * FROM attachments WHERE id=?", (i,)).fetchone()
        ok(a["analysis"].startswith("Toplantı notu"))
        g = _giden(con)
        eq(len(g), 1)
        ok("Belgeyi okudum" in g[0]["text"] and "6 kelime" in g[0]["text"], g[0]["text"])
        eq(cozumle.isle(con, _cfg(), transport=m, bugun=BUGUN)["islenen"], 0)
    test("belge modelsiz okunur, gönderene yazılır, bir kez işlenir", t_belge_modelsiz)

    def t_ses_gemini():
        con = db.connect(":memory:")
        m = _model("Yarın saat dokuzda koşuya çıkacağım.")
        i = _ek(con, "voice", _dosya("v.oga", b"OggS" + b"0" * 200), "audio/ogg", sure=4)
        eq(cozumle.isle(con, _cfg(), transport=m, bugun=BUGUN)["islenen"], 1)
        eq(len(m.cagri), 1)
        eq(m.cagri[0]["provider"], "google")
        parca = m.cagri[0]["mesajlar"][-1]["gorseller"][0]
        eq((parca["mime"], parca["jeton"]), ("audio/ogg", 4 * 32))
        ok("[anlaşılmıyor]" in m.cagri[0]["sistem"])
        a = con.execute("SELECT * FROM attachments WHERE id=?", (i,)).fetchone()
        eq(a["analysis"], "Yarın saat dokuzda koşuya çıkacağım.")
        ok("yazıya döktüm" in _giden(con)[0]["text"])
        # Komut degil: niyet/teklif yazilmaz.
        eq(con.execute("SELECT COUNT(*) FROM intents").fetchone()[0], 0)
    test("ses: yalnız Gemini'ye gider, yazıya dökülür, komut olarak uygulanmaz", t_ses_gemini)

    def t_saglayici_google_degil():
        con = db.connect(":memory:")
        m = _model("x")
        _ek(con, "video", _dosya("v.mp4", b"0" * 100), "video/mp4", sure=3, baslik="anlat")
        eq(cozumle.isle(con, _cfg("anthropic", "claude-sonnet-5"), transport=m, bugun=BUGUN)["islenen"], 1)
        eq(m.cagri, [])
        t = _giden(con)[0]["text"]
        ok("Google (Gemini)" in t, t)
        a = con.execute("SELECT * FROM attachments").fetchone()
        ok(a["analysis"] is None and a["error"])
        eq(cozumle.isle(con, _cfg("anthropic", "claude-sonnet-5"), transport=m, bugun=BUGUN)["islenen"], 0)
    test("video: Google dışı sağlayıcıya gönderilmez, nedeni söylenir, tekrar denenmez", t_saglayici_google_degil)

    def t_buyuk_dosya():
        con = db.connect(":memory:")
        m = _model("x")
        yol = _dosya("b.mp4", b"")
        with open(yol, "wb") as f:
            f.truncate(19 * 1024 * 1024)
        _ek(con, "video", yol, "video/mp4", baslik="bunu özetle")
        cozumle.isle(con, _cfg(), transport=m, bugun=BUGUN)
        eq(m.cagri, [])
        ok("18 MB" in _giden(con)[0]["text"])
    test("18 MB'tan büyük medya modele gönderilmez", t_buyuk_dosya)

    def t_video_istenmezse():
        con = db.connect(":memory:")
        m = _model("Bir parkta koşan iki kişi.")
        _ek(con, "video", _dosya("a.mp4", b"0" * 100), "video/mp4", sure=5, mid="1")
        cozumle.isle(con, _cfg(), transport=m, bugun=BUGUN)
        eq(m.cagri, [])
        ok("modele göndermedim" in _giden(con)[0]["text"])
        _ek(con, "video", _dosya("b.mp4", b"0" * 100), "video/mp4", sure=5, mid="2", baslik="Anlat")
        cozumle.isle(con, _cfg(), transport=m, bugun=BUGUN)
        eq(len(m.cagri), 1)
        eq(m.cagri[0]["mesajlar"][-1]["gorseller"][0]["jeton"], 5 * 300)
        ok("Videoda gördüğüm" in _giden(con)[1]["text"])
    test("video: başlık istemezse modele gitmez (plan); «anlat» derse Gemini anlatır", t_video_istenmezse)
