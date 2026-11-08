# -*- coding: utf-8 -*-
"""Yerel model mesgulken King (2026-11-06, oyun acikken sahada).

Olculen: 34 sn'de bellek hatasi, iki cagri 60 sn'de kesildi (kesme yuklemeyi de iptal
ediyor), ucuncusu 43 sn'de geldi; kullanici «Saglayiciya ulasilamadi» gordu.
Korunan sozler: sebep kodda ayri; kullanici duz Turkce anlar; mesajlar birbirini
beklerken saatleri islemez; secim turu dustuyse ikinci kez beklenmez; akis sessiz kalmaz.
"""

import json
import threading
import time
import urllib.error
import urllib.request

from core import ai, db, ollama, sohbet
from tests.harness import eq, no, ok, suite, test
from tests.test_king_altyapi import BUGUN, KATALOG, _reddedildi, _sira, _yerel

SOR = [{"role": "user", "content": "selam"}]


def VARSAYILAN_YOK(*a, **k):
    raise AssertionError("bellek darken modele gidilmemeli")


def _oom():
    import io
    return urllib.error.HTTPError("http://x", 500, "x", {}, io.BytesIO(json.dumps({"error": {
        "message": "llama-server startup failed after projector CPU offload retry: "
                   "llama-server reported out-of-memory during startup"}}).encode()))


def run():
    suite("yerel model mesgul")

    def t_sure():
        gorulen, eski = [], ai._istek
        ai._istek = lambda url, baslik, govde, timeout=None: (
            gorulen.append(timeout) or {"choices": [{"message": {"content": "Tamam."}}]})
        try:
            r = ai.ask(db.connect(":memory:"), _yerel(), "king", "sohbet", SOR, sistem="s1")
        finally:
            ai._istek = eski
        ok(r["ok"], r)
        eq(gorulen, [ai.YEREL_ZAMAN_ASIMI])
        ok(ai.YEREL_ZAMAN_ASIMI >= 2 * 43.43, "en yavas basarili cagrinin en az iki kati")
    test("yerel cagri 60 sn'de kesilmez", t_sure)

    def t_sira():
        icerde, en_cok, kilit = [0], [0], threading.Lock()

        def tasiyici(provider, anahtar, model, sistem, mesajlar, ayar=None):
            with kilit:
                icerde[0] += 1
                en_cok[0] = max(en_cok[0], icerde[0])
            time.sleep(0.05)
            with kilit:
                icerde[0] -= 1
            return "Tamam.", 10, 2, False, {}

        def is_(i):
            ai.ask(db.connect(":memory:"), _yerel(), "king", "sohbet", SOR, sistem="s%d" % i, transport=tasiyici)
        liste = [threading.Thread(target=is_, args=(i,)) for i in range(3)]
        [x.start() for x in liste]
        [x.join() for x in liste]
        eq(en_cok[0], 1, "model ayni anda tek cagri")
    test("mesajlar sirayla gider: birinin suresi otekini beklerken islemez", t_sira)

    def t_sira_dolu():
        eski = ai.YEREL_ZAMAN_ASIMI
        ai._YEREL_SIRA.acquire()
        ai.YEREL_ZAMAN_ASIMI = 0.05
        try:
            t = _sira(("Bu gelmemeli.", []))
            r = ai.ask(db.connect(":memory:"), _yerel(), "king", "sohbet", SOR, sistem="s", transport=t)
            eq(r.get("sebep"), "yerel-mesgul")
            eq(t.gorulen, [], "sira gelmedi, modele gitmedi")
        finally:
            ai.YEREL_ZAMAN_ASIMI = eski
            ai._YEREL_SIRA.release()
    test("sira gelmezse mesgul denir, modele gidilmez", t_sira_dolu)

    def t_sebepler():
        ollama._KAPALI[0] = 0.0
        con = db.connect(":memory:")
        r = ai.ask(con, _yerel(), "king", "sohbet", SOR, sistem="a", transport=_sira((TimeoutError("timed out"), [])))
        eq((r["reason"], r["sebep"]), ("provider", "yerel-mesgul"))
        r = ai.ask(con, _yerel(), "king", "sohbet", SOR, sistem="b", transport=_sira((_oom(), [])))
        eq(r["sebep"], "yerel-mesgul", "bellek hatasi da mesguldur")
        ok(r.get("yerel_gec"), "ayni anda ikinci yerel model denenmez")
        eski = ollama.uyandir
        ollama.uyandir = lambda cfg: False
        try:
            r = ai.ask(con, _yerel(), "king", "sohbet", SOR, sistem="c", transport=_sira((_reddedildi(), [])))
            eq(r["sebep"], "yerel-kapali")
        finally:
            ollama.uyandir = eski
        ollama._KAPALI[0] = ollama.time.monotonic() + 30
        try:
            r = ai.ask(con, _yerel(), "king", "sohbet", SOR, sistem="d", transport=_sira())
            eq(r["sebep"], "yerel-kapali", "acilamadiysa da kapali")
        finally:
            ollama._KAPALI[0] = 0.0
    test("sebep kodda ayri: mesgul, kapali", t_sebepler)

    def t_duz_turkce():
        for hata in (TimeoutError("timed out"), _oom()):
            con = db.connect(":memory:")
            r = sohbet.konus(con, _yerel(), "bugün neler önerirsin", BUGUN, transport=_sira((hata, [])))
            ok(r["ok"], r)
            ok("meşgul" in r["text"], r["text"])
            no("Sağlayıcı" in r["text"], "kullanici bulut sebebi gormez")
            eq(r["ai"]["sebep"], "yerel-mesgul")
        eski = ollama.uyandir
        ollama.uyandir = lambda cfg: False
        try:
            r = sohbet.konus(db.connect(":memory:"), _yerel(), "bugün neler önerirsin", BUGUN,
                             transport=_sira((_reddedildi(), [])))
            ok("kapalı" in r["text"], r["text"])
        finally:
            ollama.uyandir = eski
            ollama._KAPALI[0] = 0.0
    test("kullanici model mesgulken bunu duz Turkceyle anlar", t_duz_turkce)

    def t_ikinci_bekleme_yok():
        con = db.connect(":memory:")
        t = _sira((TimeoutError("timed out"), []), ("Bu gelmemeli.", []))
        r = sohbet.konus(con, _yerel(), "bugün neler önerirsin", BUGUN, transport=t, araclar=KATALOG)
        eq(len(t.gorulen), 1, "secim turu dustu: sohbet turu ayni sureyi yeniden beklemez")
        ok("meşgul" in r["text"], r["text"])
    test("secim turu mesgulse ikinci kez beklenmez", t_ikinci_bekleme_yok)

    def t_hal():
        eski = dict(ai._YEREL_SON)
        try:
            ai._YEREL_SON.update(hal=None, t=0.0)
            eq(ai.yerel_hal(), "", "denenmedi: veri yok")
            ai.ask(db.connect(":memory:"), _yerel(), "king", "sohbet", SOR, sistem="h1",
                   transport=_sira((TimeoutError("timed out"), [])))
            eq(ai.yerel_hal(), "mesgul")
            ai.ask(db.connect(":memory:"), _yerel(), "king", "sohbet", SOR, sistem="h2", transport=_sira(("Tamam.", [])))
            eq(ai.yerel_hal(), "hazir")
            ai._YEREL_SON.update(hal="mesgul", t=time.monotonic() - ai.YEREL_HAL_SN - 1)
            eq(ai.yerel_hal(), "", "bayat hal soylenmez")
        finally:
            ai._YEREL_SON.update(eski)
    test("modelin hali yalniz son gercek cagridan okunur", t_hal)

    def t_iptal_akis():
        # Kullanici sayfayi kapatti: okuma kesilir, baglanti kapanir, Ollama uretmeyi birakir.
        okunan = []

        class Y:
            kapandi = False

            def __enter__(self):
                return self

            def __exit__(self, *a):
                Y.kapandi = True

            def __iter__(self):
                for i in range(5):
                    okunan.append(i)
                    yield ('data: {"choices":[{"delta":{"content":"s%d "}}]}\n' % i).encode()
        eski = urllib.request.urlopen
        urllib.request.urlopen = lambda *a, **k: Y()
        try:
            gelen = []
            kes = lambda: len(gelen) >= 2
            try:
                ai._akis_istek("http://x", {}, {}, 5, gelen.append, iptal=kes)
                no(True, "kesilmeliydi")
            except ai.AkisKesildi:
                pass
        finally:
            urllib.request.urlopen = eski
        ok(len(okunan) <= 3, okunan)
        ok(Y.kapandi, "baglanti kapanir")
    test("iptal: sayfa kapaninca model okumasi kesilir", t_iptal_akis)

    def t_iptal_sohbet():
        con = db.connect(":memory:")
        t = _sira((ai.AkisKesildi("gitti"), []), ("Bu gelmemeli.", []))
        r = ai.ask(con, _yerel(), "king", "sohbet", SOR, sistem="i1", transport=t)
        eq(r["sebep"], "iptal")
        eq(len(t.gorulen), 1, "ust basamaga ya da yedege gidilmez")
        # Sira beklerken istemci gittiyse modele hic gidilmez.
        ai._YEREL_SIRA.acquire()
        try:
            t2 = _sira(("Bu gelmemeli.", []))
            r = ai.ask(con, _yerel(), "king", "sohbet", SOR, sistem="i2", transport=t2, iptal=lambda: True)
            eq((r["sebep"], t2.gorulen), ("iptal", []))
        finally:
            ai._YEREL_SIRA.release()
        # Yarim kalan konusma gecmise yazilmaz, ikinci tura gidilmez.
        t3 = _sira((ai.AkisKesildi("gitti"), []), ("Bu gelmemeli.", []))
        n0 = con.execute("SELECT COUNT(*) FROM conversations").fetchone()[0]
        r = sohbet.konus(con, _yerel(), "bugün neler önerirsin", BUGUN, transport=t3, araclar=KATALOG,
                         iptal=lambda: False, kayit=True)
        eq((r["ok"], r["mode"], len(t3.gorulen)), (False, "yok", 1))
        eq(con.execute("SELECT COUNT(*) FROM conversations").fetchone()[0], n0)
    test("iptal: yedege gidilmez, gecmise yazilmaz", t_iptal_sohbet)

    def t_iptal_uc():
        # Telefon akisi kapatinca Merkez bunu nabizdan anlar ve konus'a soyler.
        from tests.test_daemon import TOKEN, _Server
        import daemon
        import socket
        eski_konus, eski_sn = sohbet.konus, daemon.NABIZ_SN
        daemon.NABIZ_SN = 0.02
        gordu, bitti = [], threading.Event()

        def sahte(*a, **kw):
            sinir = time.monotonic() + 4
            while time.monotonic() < sinir and not kw["iptal"]():
                time.sleep(0.01)
            gordu.append(kw["iptal"]())
            bitti.set()
            return {"ok": False, "mode": "yok", "text": None, "agent": "king"}
        sohbet.konus = sahte
        s = _Server()
        try:
            g = json.dumps({"text": "selam", "agent": "king", "date": BUGUN}).encode()
            k = socket.create_connection(("127.0.0.1", s.port), timeout=5)
            k.sendall(("POST /api/chat/akis HTTP/1.1\r\nHost: x\r\nAuthorization: Bearer %s\r\nContent-Type: application/json\r\n"
                       "Content-Length: %d\r\n\r\n" % (TOKEN, len(g))).encode() + g)
            k.recv(200)
            k.close()
            ok(bitti.wait(6), "konus bitmedi")
            eq(gordu, [True])
        finally:
            sohbet.konus, daemon.NABIZ_SN = eski_konus, eski_sn
            s.close()
    test("iptal: akis kopunca Merkez konus'u durdurur", t_iptal_uc)

    def t_bellek():
        # Olcum 2026-11-06: bos sanal bellek <=5,5 GiB iken yukleme bellek hatasi verdi, >=6,8 GiB iken oldu.
        cfg = dict(_yerel(), king={"kendiliginden": True})
        giden, eski = [], ollama.VARSAYILAN_BELLEK
        gonder = lambda u, g, t: giden.append(g.get("model")) or {"embeddings": [[1.0]]}
        try:
            ollama.VARSAYILAN_BELLEK = lambda: ollama.BELLEK_ALT - 1
            ok(ollama.bellek_dar())
            eq(ollama.isit(cfg, {"durum": "bagli"}, gonder), None)
            eq(giden, [], "oyunla yarisip model yuklenmez")
            ollama._gomme_hata[0] = 0.0
            eq(ollama.gomme(cfg, ["x"], VARSAYILAN_YOK), None, "gomme modeli de yuklenmez")
            ollama.VARSAYILAN_BELLEK = lambda: ollama.BELLEK_ALT + 1
            no(ollama.bellek_dar())
            ok(ollama.isit(cfg, {"durum": "bagli"}, gonder))
            ollama.VARSAYILAN_BELLEK = lambda: None
            no(ollama.bellek_dar(), "okunamadiysa engellemez")
        finally:
            ollama.VARSAYILAN_BELLEK = eski
    test("bellek darsa sicak tutma ve gomme modeli yuklemez", t_bellek)

    def t_acinca_isit():
        # «Kendi basina» anahtari kapaliyken arka planda yuklenmez (depo sahibinin karari);
        # kullanici King'i acmasi istegin kendisidir: ilk soru soguk yuklemeyi beklemesin.
        from tests.test_daemon import _Server
        cfg = dict(_yerel(), king={"sormadan_dusuk": True})
        giden = []
        gonder = lambda u, g, t: giden.append(g.get("model")) or True
        eq(ollama.isit(cfg, {"durum": "bagli"}, gonder), None, "kendiliginden degil")
        eq(ollama.isit(cfg, {"durum": "bagli"}, gonder, istek=True), "gemma4:e2b")
        eq(ollama.isit(dict(cfg, ollama={"sicak": False}), {"durum": "bagli"}, gonder, istek=True), None, "ayar kapali")
        eski = ollama.isit
        cagri, bitti = [], threading.Event()

        def sahte(c, t, gonder=None, istek=False, yaziyor=False):
            cagri.append((t, istek, yaziyor))
            time.sleep(0.2)
            bitti.set()
        ollama.isit = sahte
        s = _Server()
        try:
            t0 = time.perf_counter()
            kod, v = s.call("/api/ollama/isit", body={})
            eq((kod, v["ok"]), (200, True))
            ok(time.perf_counter() - t0 < 0.2, "cevap yuklemeyi beklemez")
            ok(bitti.wait(3))
            eq(cagri, [({"durum": "bagli"}, True, False)])
            # King 5 D7: yazmaya baslayinca «yaziyor» tasinir.
            bitti.clear()
            eq(s.call("/api/ollama/isit", body={"yaziyor": True})[0], 200)
            ok(bitti.wait(3))
            eq(cagri[-1], ({"durum": "bagli"}, True, True))
            eq(s.call("/api/ollama/isit", token=None, body={})[0], 401)
        finally:
            ollama.isit = eski
            s.close()
    test("King acilinca model isinir, cevap beklenmez", t_acinca_isit)

    def t_nabiz():
        from tests.test_daemon import TOKEN, _Server
        import daemon
        eski_konus, eski_sn = sohbet.konus, daemon.NABIZ_SN
        daemon.NABIZ_SN = 0.03

        def sahte(*a, **kw):
            time.sleep(0.15)
            kw["akis"]("Tamam.")
            return {"ok": True, "mode": "model", "text": "Tamam.", "agent": "king"}
        sohbet.konus = sahte
        s = _Server()
        try:
            eq(set(s.call("/api/health", token=None)[1]) >= {"ok", "model"}, True)
            req = urllib.request.Request(s.url("/api/chat/akis"), method="POST",
                                         data=json.dumps({"text": "selam", "agent": "king", "date": BUGUN}).encode())
            req.add_header("Authorization", "Bearer " + TOKEN)
            req.add_header("Content-Type", "application/json")
            with urllib.request.urlopen(req, timeout=10) as y:
                turler = [json.loads(x)["t"] for x in y.read().decode("utf-8").splitlines() if x.strip()]
            ok(turler[0] == "bekle", turler)
            eq(turler[-1], "son")
            ok("parca" in turler, turler)
        finally:
            sohbet.konus, daemon.NABIZ_SN = eski_konus, eski_sn
            s.close()
    test("akis cevap beklerken sessiz kalmaz; saglik ucu modelin halini soyler", t_nabiz)


if __name__ == "__main__":
    run()
