# -*- coding: utf-8 -*-
"""Ollama — kendiliginden bulma ve baglama (core/ollama.py).

   Kanitladigi sozler:
     1. Kapali motor «kapali», bos motor «bos» der ve ne yapilacagini
        yazar; hicbiri firlatmaz.
     2. Gomme modeli elenir; oneri kodla kurulur (ekonomik <= 9 milyar,
        standart ondan buyuk <= 40 milyar); parametre yoksa boyuttan
        «tahmin».
     3. Durum: yazili model yoksa «bulundu», varsa «bagli», silinmisse
        «eksik».
     4. Kendiliginden baglama yalniz hic yerel model yokken, ayar acikken
        ve geri alinmamisken; elle secim ezilmez.
     5. Calisma yeri: bulutta OpenRouter anahtari varsa hibrit, yoksa
        yerel; yerel/hibrit secimine dokunulmaz.
     6. Ritim: acilista tarar, bes dakika dolmadan yeniden taramaz,
        bulunca baglar ve onceki hali saklar; geri al eski ayari dondurur
        ve bir daha kendiliginden baglamaz.
     7. Uclar bearer ister; Ollama'da olmayan model baglanmaz (409); ayar
        dogrulanir.
     8. Son cagri: kart yerel modelin defterdeki SON gercek sohbet cagrisini
        yazar; hata notu adiyla cumleye doner (reddetti, zaman asimi, 404);
        bulut cagrilari karismaz; defter bossa None.
     9. Roller (kural 7): gorsel uzman metin sinifina onerilmez, «gorsel»
        onerilir; gomme «gomme» olarak taninir ve baglanabilir; ekonomik
        sinifta TERCIH (gemma4:e2b) kazanir; bagliyken farkli oneri
        soylenir ama yazilmaz."""
import os
import tempfile
import types
import urllib.error

import datetime

from core import butce, db, models, ollama, settings
from tests.harness import eq, no, ok, suite, test

GB = 1000 ** 3
TAGS = {"models": [
    {"name": "gemma3:4b", "size": int(3.3 * GB), "details": {"family": "gemma3", "parameter_size": "4.3B"}},
    {"name": "qwen3:14b", "size": int(9.3 * GB), "details": {"family": "qwen3", "parameter_size": "14.8B"}},
    {"name": "llama3.2:1b", "size": int(1.3 * GB), "details": {"family": "llama", "parameter_size": "1.2B"}},
    {"name": "nomic-embed-text:latest", "size": int(0.27 * GB),
     "details": {"family": "nomic-bert", "parameter_size": "137M"}},
    {"name": "devasa:70b", "size": int(40 * GB), "details": {"parameter_size": "70.6B"}},
]}


def _kapali(url, timeout):
    raise urllib.error.URLError("kapali")


def _sahte(cevap):
    return lambda url, timeout: cevap


def run():
    suite("ollama")

    def t_son_cagri():
        con = db.connect(":memory:")
        eq(ollama.son_cagri(con), None)
        eq(ollama.son_cagri(None), None)
        t0 = datetime.datetime(2026, 10, 19, 9, 49, 27)
        butce.record(con, role="king", task="sohbet", provider="yerel", model="gemma3:4b", ok=False,
                     note="URLError: <urlopen error [WinError 10061] Hedef makine etkin olarak "
                          "reddettiğinden bağlantı kurulamadı>", now=t0)
        r = ollama.son_cagri(con)
        eq((r["ok"], r["saat"], r["model"]), (False, "2026-10-19 09:49", "gemma3:4b"))
        ok("reddetti" in r["metin"] and "cevap gelmedi" in r["metin"], r["metin"])
        # Bulut cagrisi yerelin durumunu degistirmez.
        butce.record(con, role="ses", task="tts", provider="google", model="x", ok=True,
                     now=t0 + datetime.timedelta(minutes=1))
        eq(ollama.son_cagri(con)["ok"], False)
        butce.record(con, role="king", task="sohbet", provider="yerel", model="gemma3:4b", ok=True,
                     note="seviye=alt", now=t0 + datetime.timedelta(minutes=2))
        r = ollama.son_cagri(con)
        eq((r["ok"], r["metin"]), (True, "Son sohbet çağrısı 2026-10-19 09:51: cevap geldi (gemma3:4b)."))
        for ham, beklenen in (("timed out", "zamanında"), ("HTTP 404 model not found", "bulunamadı"),
                              ("[Errno 11001] getaddrinfo failed", "adresine"), ("garip", "garip")):
            ok(beklenen in ollama._cagri_nedeni(ham), (ham, ollama._cagri_nedeni(ham)))

    def t_kapali_bos():
        t = ollama.tara({}, getir=_kapali)
        eq(t["durum"], "kapali")
        ok("ollama.com" in t["metin"], t["metin"])
        eq(t["adres"], "http://127.0.0.1:11434")
        b = ollama.tara({}, getir=_sahte({"models": [TAGS["models"][3]]}))
        eq((b["durum"], b["modeller"]), ("bos", []))
        ok("ollama pull" in b["metin"], b["metin"])
        eq(ollama.tara({}, getir=lambda u, t: (_ for _ in ()).throw(ValueError("bozuk")))["durum"], "kapali")

    def t_oneri():
        liste = ollama.modeller(TAGS)
        eq([m["ad"] for m in liste], ["llama3.2:1b", "gemma3:4b", "qwen3:14b", "devasa:70b"])
        eq(ollama.oneri(liste), {"ekonomik": "gemma3:4b", "standart": "qwen3:14b"})
        eq(ollama.oneri(ollama.modeller({"models": [TAGS["models"][4]]})), {"ekonomik": "devasa:70b"})
        tahmin = ollama.modeller({"models": [{"name": "x:latest", "size": int(3 * GB)}]})
        eq((tahmin[0]["milyar"], tahmin[0]["etiket"]), (5.0, "tahmin"))
        eq(ollama.oneri([]), {})

    def t_durum():
        g = _sahte(TAGS)
        eq(ollama.tara({}, getir=g)["durum"], "bulundu")
        cfg = {"models": {"yer": "hibrit", "yerel": {"ekonomik": "gemma3:4b"}}}
        t = ollama.tara(cfg, getir=g)
        eq((t["durum"], t["bagli"]), ("bagli", {"ekonomik": "gemma3:4b"}))
        cfg = {"models": {"yer": "hibrit", "yerel": {"ekonomik": "silindi:2b"}}}
        e = ollama.tara(cfg, getir=g)
        eq(e["durum"], "eksik")
        ok("silindi:2b" in e["metin"], e["metin"])

    def t_kendiliginden():
        g = _sahte(TAGS)
        t = ollama.tara({}, getir=g)
        eq(ollama.kendiliginden({}, t), {"ekonomik": "gemma3:4b", "standart": "qwen3:14b",
                                         "gomme": "nomic-embed-text:latest"})
        eq(ollama.kendiliginden({"ollama": {"kendiligi": False}}, t), None)
        eq(ollama.kendiliginden({"ollama_bag": {"geri_alindi": True}}, t), None)
        elle = {"models": {"yerel": {"ekonomik": "silindi:2b"}}}
        eq(ollama.kendiliginden(elle, ollama.tara(elle, getir=g)), None)

    def t_yer():
        secim = {"ekonomik": "gemma3:4b"}
        eq(ollama.yama({}, secim)["models"]["yer"], "yerel")
        eski = models.key_value
        models.key_value = lambda cfg, p, k=None: "sk-or-x" if p == "openrouter" else None
        try:
            eq(ollama.yama({}, secim)["models"]["yer"], "hibrit")
            eq(ollama.yama({"models": {"yer": "yerel"}}, secim)["models"]["yer"], "yerel")
        finally:
            models.key_value = eski
        eq(ollama.yama({"models": {"yer": "hibrit"}}, secim)["models"]["yer"], "hibrit")
        y = ollama.yama({}, dict(secim, baska="x"))
        eq(y["models"]["yerel"], secim)
        ok(settings.validate(y)[0], settings.validate(y))

    def t_ayar():
        eq(settings.read({})["ollama"], {"kendiligi": True, "sicak": True})
        ok(settings.validate({"ollama": {"kendiligi": False}})[0])
        no(settings.validate({"ollama": {"kendiligi": "evet"}})[0], "bool olmayan")
        no(settings.validate({"ollama": {"model": "x"}})[0], "bilinmeyen alan")
        eq(settings.apply({}, {"ollama": {"kendiligi": False}})["ollama"], {"kendiligi": False})

    def t_ritim():
        import daemon
        d = tempfile.mkdtemp(prefix="hkm-ollama-")
        srv = types.SimpleNamespace(config={"local_token": "x"}, config_path=os.path.join(d, "config.json"))
        eski = ollama.VARSAYILAN_GETIR
        ollama.VARSAYILAN_GETIR = _sahte(TAGS)
        try:
            r = daemon._ollama_tik(srv, simdi=1000.0)
            ok(r and r["ok"], r)
            eq(srv.config["models"]["yerel"], {"ekonomik": "gemma3:4b", "standart": "qwen3:14b",
                                               "gomme": "nomic-embed-text:latest"})
            eq(srv.config["models"]["yer"], "yerel")
            b = srv.config["ollama_bag"]
            eq((b["kendiliginden"], b["onceki"]), (True, {"yer": "", "yerel": {}}))
            ok(os.path.exists(srv.config_path), "ayar diske yazildi")
            eq(srv.ollama_son["durum"], "bagli")
            eq(daemon._ollama_tik(srv, simdi=1100.0), None)          # bes dakika dolmadi
            g = daemon._ollama_geri(srv)
            ok(g["ok"], g)
            eq((srv.config["models"].get("yerel"), srv.config["models"].get("yer")), (None, None))
            ok(srv.config["ollama_bag"]["geri_alindi"], "isaretlendi")
            eq(daemon._ollama_tik(srv, simdi=2000.0), None)          # geri alindi: baglanmaz
            no("yerel" in srv.config["models"], "yeniden baglanmadi")
            no(daemon._ollama_geri(srv)["ok"], "iki kez geri alinmaz")
            ollama.VARSAYILAN_GETIR = _kapali
            srv2 = types.SimpleNamespace(config={}, config_path=os.path.join(d, "c2.json"))
            eq(daemon._ollama_tik(srv2, simdi=1.0), None)
            eq(srv2.ollama_son["durum"], "kapali")
        finally:
            ollama.VARSAYILAN_GETIR = eski

    def t_roller():
        ham = {"models": [
            {"name": "gemma3:4b", "size": int(3.3 * GB), "details": {"parameter_size": "4.3B"}},
            {"name": "gemma4:e2b", "size": int(7.2 * GB), "details": {"parameter_size": "5.1B"}},
            {"name": "qwen3-vl:4b", "size": int(3.3 * GB), "details": {"parameter_size": "4.4B"}},
            {"name": "qwen3-vl:8b", "size": int(6.1 * GB), "details": {"parameter_size": "8.8B"}},
            {"name": "qwen3-embedding:0.6b", "size": int(0.6 * GB),
             "details": {"family": "qwen3", "parameter_size": "595.78M"}},
        ]}
        liste = ollama.modeller(ham)
        eq([m["ad"] for m in liste if m["gorsel"]], ["qwen3-vl:4b", "qwen3-vl:8b"])
        eq([m["ad"] for m in ollama.gommeler(ham)], ["qwen3-embedding:0.6b"])
        eq(ollama.oneri(liste, ollama.gommeler(ham)),
           {"gorsel": "qwen3-vl:4b", "gomme": "qwen3-embedding:0.6b", "ekonomik": "gemma4:e2b"})
        # Tercih yoksa kural 3; gorsel uzman metin sinifina girmez.
        yok = [m for m in liste if m["ad"] != "gemma4:e2b"]
        eq(ollama.oneri(yok)["ekonomik"], "gemma3:4b")
        eq(ollama.oneri([m for m in liste if m["gorsel"]]),
           {"gorsel": "qwen3-vl:4b", "ekonomik": "qwen3-vl:8b"})
        g = _sahte(ham)
        t = ollama.tara({}, getir=g)
        secim, hata = ollama.secim_denetle(t, {})
        eq((hata, secim["gomme"], secim["gorsel"]), (None, "qwen3-embedding:0.6b", "qwen3-vl:4b"))
        y = ollama.yama({}, secim)
        ok(settings.validate(y)[0], settings.validate(y))
        cfg = settings.apply({}, y)
        eq((models.yerel_of(cfg), models.yerel_ek_of(cfg)),
           ({"ekonomik": "gemma4:e2b"}, {"gorsel": "qwen3-vl:4b", "gomme": "qwen3-embedding:0.6b"}))
        eq(ollama.tara(cfg, getir=g)["durum"], "bagli")
        no(ollama.tara(cfg, getir=g)["oneri_farkli"], "oneri ayni")
        # Elle gemma3 baglanmis: oneri SOYLENIR, kendiliginden yazilmaz.
        eski = {"models": {"yer": "yerel", "yerel": {"ekonomik": "gemma3:4b"}}}
        e = ollama.tara(eski, getir=g)
        eq((e["durum"], e["oneri_farkli"]), ("bagli", True))
        ok("Önerilen: Ekonomik gemma4:e2b" in e["metin"] and "Görsel qwen3-vl:4b" in e["metin"], e["metin"])
        eq(ollama.kendiliginden(eski, e), None)
        no(ollama.secim_denetle(t, {"gomme": "yok:1b", "ekonomik": "gemma4:e2b"})[0], "olmayan gomme")

    test("roller: görsel ve gömme tanınır, gemma4:e2b ekonomik önerilir", t_roller)
    test("kapalı ve boş motor söylenir, fırlatmaz", t_kapali_bos)
    test("gömme elenir; öneri kodla kurulur", t_oneri)
    test("durum: bulundu, bağlı, eksik", t_durum)
    test("kendiliğinden bağlama yalnız boşken; elle seçim ezilmez", t_kendiliginden)
    test("çalışma yeri: bulut → yerel/hibrit, yamalar doğrulanır", t_yer)
    test("ayar okunur ve doğrulanır", t_ayar)
    test("ritim: tarar, bağlar, geri al, bir daha bağlamaz", t_ritim)
    test("son sohbet çağrısı defterden okunur; neden adıyla söylenir", t_son_cagri)

    def t_isit():
        cfg = {"models": {"yer": "yerel", "yerel": {"ekonomik": "gemma3:4b"}}}
        giden = []
        gonder = lambda url, govde, t: giden.append((url, govde)) or True      # noqa: E731
        eq(ollama.isit(cfg, {"durum": "bagli"}, gonder), "gemma3:4b")
        eq(giden, [("http://127.0.0.1:11434/api/generate", {"model": "gemma3:4b", "keep_alive": "30m"})])
        eq(ollama.isit(cfg, {"durum": "kapali"}, gonder), None)
        eq(ollama.isit(dict(cfg, ollama={"sicak": False}), {"durum": "bagli"}, gonder), None)
        eq(ollama.isit({}, {"durum": "bagli"}, gonder), None)
        eq(ollama.isit(cfg, {"durum": "bagli"}, lambda *a: (_ for _ in ()).throw(OSError("x"))), None)
        eq(len(giden), 1)
    test("sıcak tutma: bağlı model bellekte tutulur; kapalıysa ya da ayar kapalıysa gitmez", t_isit)


def run_daemon():
    from tests.test_daemon import _Server
    suite("ollama · uçlar")

    def t_uclar():
        eski = ollama.VARSAYILAN_GETIR
        s = _Server()
        try:
            eq(s.call("/api/ollama", token=None)[0], 401)
            st, d = s.call("/api/ollama")
            eq((st, d["tarama"]["durum"], d["durum_ad"]), (200, "kapali", "Ollama bulunamadı"))
            ok("son_cagri" in d, sorted(d))
            ollama.VARSAYILAN_GETIR = _sahte(TAGS)
            st, r = s.call("/api/ollama/bagla", body={"ekonomik": "yok:1b"})
            eq((st, r["ok"]), (409, False))
            st, r = s.call("/api/ollama/bagla", body={})
            eq((st, r["ok"], r["durum"]["tarama"]["durum"]), (200, True, "bagli"))
            eq(s.srv.config["models"]["yerel"]["ekonomik"], "gemma3:4b")
            eq(s.call("/api/ollama")[1]["bag"]["kendiliginden"], False)
            st, g = s.call("/api/ollama/geri", body={})
            eq((st, g["ok"]), (200, True))
            eq(s.call("/api/ollama/geri", body={})[0], 409)
            eq(s.call("/api/config", body={"ollama": {"kendiligi": 1}})[0], 422)
        finally:
            ollama.VARSAYILAN_GETIR = eski
            s.close()

    test("uçlar bearer ister; olmayan model bağlanmaz; geri al", t_uclar)
