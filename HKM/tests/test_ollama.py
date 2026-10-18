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
        dogrulanir."""
import os
import tempfile
import types
import urllib.error

from core import models, ollama, settings
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
        eq(ollama.kendiliginden({}, t), {"ekonomik": "gemma3:4b", "standart": "qwen3:14b"})
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
        eq(settings.read({})["ollama"], {"kendiligi": True})
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
            eq(srv.config["models"]["yerel"], {"ekonomik": "gemma3:4b", "standart": "qwen3:14b"})
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

    test("kapalı ve boş motor söylenir, fırlatmaz", t_kapali_bos)
    test("gömme elenir; öneri kodla kurulur", t_oneri)
    test("durum: bulundu, bağlı, eksik", t_durum)
    test("kendiliğinden bağlama yalnız boşken; elle seçim ezilmez", t_kendiliginden)
    test("çalışma yeri: bulut → yerel/hibrit, yamalar doğrulanır", t_yer)
    test("ayar okunur ve doğrulanır", t_ayar)
    test("ritim: tarar, bağlar, geri al, bir daha bağlamaz", t_ritim)


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
