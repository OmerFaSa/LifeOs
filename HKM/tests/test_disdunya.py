# -*- coding: utf-8 -*-
"""Dis dunya (KING-4 §E/§G): ayri izin, onayli eylem, defterde geri al.
Gercek bilgisayara ve aga dokunmaz: platform ve kanal sahtedir."""

import datetime

from core import db, disdunya, eylem, outbox
from tests.harness import eq, ok, suite, test

T0 = datetime.datetime(2026, 11, 2, 21, 0, 0)
TG = {"channels": {"telegram": {"enabled": True, "bot_token": "x", "allow_from": ["1"]}}}


class Sahte:
    def __init__(self):
        self.kapatilan = []

    def ac(self, yol):
        return {"ok": True, "pid": 41, "yol": yol} if yol.startswith("C:\\") else {"ok": False, "hata": "Yol mutlak olmalı."}

    def baslat(self, ad):
        if ad == "spo":
            return {"ok": False, "hata": "Birden çok uygulama var.", "adaylar": ["Spotify", "Spotify Yardım"]}
        return {"ok": True, "pid": 42, "ad": "Hesap Makinesi"}

    def kapat(self, pid):
        self.kapatilan.append(pid)
        return {"ok": pid in (41, 42)}

    def ekran_oku(self):
        return {"ok": True, "metin": "Merhaba dünya"}


def _izinli(cfg, *adlar):
    for a in adlar:
        cfg, _ = disdunya.izin_ver(cfg, a, True)
    return cfg


def run():
    suite("dis dunya")
    eski = disdunya.PLATFORM

    def t_izin_varsayilan_kapali():
        eq(disdunya.izinler({}), {"dosya": False, "uygulama": False, "ekran": False, "telefon": False})
        cfg, h = disdunya.izin_ver({}, "dosya", True)
        eq((h, disdunya.izinler(cfg)["dosya"], disdunya.izinler(cfg)["ekran"]), (None, True, False))
        eq(disdunya.izin_ver({}, "her_sey", True)[1], "bilinmeyen izin: her_sey")
        eq(disdunya.izin_ver({}, "dosya", "evet")[1], "acik true/false olmali")
        ok(disdunya.izin_ver({"dis_dunya": {"dosya": True}}, "dosya", False)[0]["dis_dunya"]["dosya"] is False)

    def t_izinsiz_hicbir_sey_olmaz():
        con, s = db.connect(":memory:"), Sahte()
        disdunya.PLATFORM = s
        for is_ in ("ac", "baslat", "ekran", "telefon"):
            r = disdunya.uygula(con, _izinli({}, *(a for a in disdunya.IZINLER if a != disdunya.ISLER[is_])), is_,
                                {"yol": "C:\\a.txt", "ad": "hesap", "metin": "x"})
            eq((r["ok"], r.get("izin")), (False, disdunya.ISLER[is_]))
        eq(eylem.listele(con), [])
        eq(disdunya.uygula(con, {}, "sil", {})["ok"], False)

    def t_dosya_ac_deftere_ve_geri():
        con, s = db.connect(":memory:"), Sahte()
        disdunya.PLATFORM = s
        r = disdunya.uygula(con, _izinli({}, "dosya"), "ac", {"yol": "C:\\Belgeler\\rapor.pdf"}, now=T0)
        eq((r["ok"], r["metin"]), (True, "rapor.pdf açıldı."))
        e = eylem.listele(con)[0]
        eq((e["arac"], e["ozet"], e["geri"], e["geri_alinabilir"]), ("dis.ac", "Açıldı: rapor.pdf", {"hkm": "bilgisayar", "pid": 41}, True))
        eq(eylem.geri_al(con, e["id"])["ok"], True)
        eq(s.kapatilan, [41])
        eq(disdunya.uygula(con, _izinli({}, "dosya"), "ac", {"yol": "rapor.pdf"})["ok"], False)

    def t_uygulama_belirsiz_ve_kapanmayan():
        con, s = db.connect(":memory:"), Sahte()
        disdunya.PLATFORM = s
        cfg = _izinli({}, "uygulama")
        r = disdunya.uygula(con, cfg, "baslat", {"ad": "spo"})
        eq((r["ok"], r["adaylar"]), (False, ["Spotify", "Spotify Yardım"]))
        ok("Spotify, Spotify Yardım" in r["note"])
        eq(disdunya.uygula(con, cfg, "baslat", {"ad": "hesap"})["metin"], "Hesap Makinesi başlatıldı.")
        e = eylem.listele(con)[0]
        con.execute("UPDATE eylem SET geri=? WHERE id=?", ('{"hkm": "bilgisayar", "pid": 7}', e["id"]))
        g = eylem.geri_al(con, e["id"])
        eq(g["ok"], False)
        ok(g["note"].startswith("Pencere kapatılamadı"))

    def t_ekran_okunur_defterde_kalici():
        con = db.connect(":memory:")
        disdunya.PLATFORM = Sahte()
        r = disdunya.uygula(con, _izinli({}, "ekran"), "ekran", {})
        eq((r["ok"], r["metin"]), (True, "Merhaba dünya"))
        e = eylem.listele(con)[0]
        eq((e["arac"], e["geri_alinabilir"]), ("dis.ekran", False))

    def t_platform_yok():
        con = db.connect(":memory:")
        disdunya.PLATFORM = None
        if disdunya.platform() is None:
            ok(disdunya.uygula(con, _izinli({}, "dosya"), "ac", {"yol": "C:\\a"})["note"].startswith("Bu makinede"))

    def t_telefon_pencere_ve_geri():
        con = db.connect(":memory:")
        cfg = _izinli(dict(TG), "telefon")
        eq(disdunya.uygula(con, _izinli({}, "telefon"), "telefon", {"metin": "x"})["note"][:21], "Telefona giden kanal ")
        eq(disdunya.uygula(con, cfg, "telefon", {"metin": "  "})["ok"], False)
        r = disdunya.uygula(con, cfg, "telefon", {"metin": "Bugün  3 iş bitti.", "sesli": True}, now=T0)
        eq(r["ok"], True)
        eq(outbox.due(con, T0 + datetime.timedelta(seconds=30)), [])          # pencere: henuz gitmez
        sat = outbox.due(con, T0 + datetime.timedelta(seconds=61))
        eq([(x["text"], x["ek"]) for x in sat], [("Bugün 3 iş bitti.", '{"ses": true}')])
        e = eylem.listele(con)[0]
        eq((e["arac"], e["ozet"]), ("dis.telefon", "Telefona sesli özet: Bugün 3 iş bitti."))
        eq(eylem.geri_al(con, e["id"])["ok"], True)
        eq(outbox.due(con, T0 + datetime.timedelta(hours=1)), [])
        disdunya.uygula(con, cfg, "telefon", {"metin": "ikinci"}, now=T0 + datetime.timedelta(seconds=1))
        e = eylem.listele(con)[0]
        con.execute("UPDATE outbox SET state='sent' WHERE id=?", (e["geri"]["outbox"],))
        eq(eylem.geri_al(con, e["id"])["note"], "Mesaj telefona gitti; oradan geri alınamaz.")

    def t_sesli_ozet_gonderimi():
        from core import channels, ses
        con = db.connect(":memory:")
        cfg = _izinli(dict(TG), "telefon")
        disdunya.uygula(con, cfg, "telefon", {"metin": "Özet", "sesli": True}, now=T0)
        giden, es, eb, ess = [], channels.send, channels.send_document, ses.seslendir
        channels.send = lambda c, k, m, to=None, transport=None: giden.append(("metin", m)) or {"ok": True}
        channels.send_document = lambda c, k, ad, b, mime, caption="", to=None, transport=None: giden.append((ad, mime, caption)) or {"ok": True}
        try:
            ses.seslendir = lambda con, cfg, m: {"ok": True, "wav": b"RIFF"}
            eq(outbox.flush(con, cfg, now=T0 + datetime.timedelta(seconds=61))["sent"], 1)
            eq(giden, [("king-ozet.wav", "audio/wav", "Özet")])
            disdunya.uygula(con, cfg, "telefon", {"metin": "Sessiz", "sesli": True}, now=T0 + datetime.timedelta(seconds=2))
            ses.seslendir = lambda con, cfg, m: {"ok": False, "notlar": ["ses yok"]}
            outbox.flush(con, cfg, now=T0 + datetime.timedelta(seconds=70))
            eq(giden[-1], ("metin", "Sessiz"))                                  # ses uretilemezse metin gider
        finally:
            channels.send, channels.send_document, ses.seslendir = es, eb, ess

    try:
        for ad, fn in sorted(locals().items()):
            if ad.startswith("t_"):
                test(ad[2:], fn)
    finally:
        disdunya.PLATFORM = eski
