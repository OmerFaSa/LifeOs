# -*- coding: utf-8 -*-
"""Her yerden erisim (sistem/uzak.py).

Korunan sozler: vekilden gelen istek «bu bilgisayar» sayilmaz (admin kurulumu,
yedek, ayar disari acilmaz); yalniz `serve` kullanilir, `funnel` asla; jeton
erisim kapaliyken verilmez; kapi acilamazsa koken yazilmaz.
"""

import json
import os
import subprocess
import sys
import tempfile
import threading
import urllib.request

KOK = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if os.path.join(KOK, "sistem") not in sys.path:
    sys.path.append(os.path.join(KOK, "sistem"))
sys.dont_write_bytecode = True

import uzak  # noqa: E402
from tests.harness import eq, no, ok, suite, test  # noqa: E402

AD = "pc.tail123.ts.net"


def _sahte(serve_web=None, kod=0, stderr=""):
    cagri = []

    def calistir(arg, **_):
        cagri.append(arg[1:])
        if arg[1:3] == ["status", "--json"]:
            cikti = json.dumps({"BackendState": "Running", "Self": {"DNSName": AD + "."}})
        elif arg[1:4] == ["serve", "status", "--json"]:
            cikti = json.dumps({"Web": serve_web or {}})
        else:
            return subprocess.CompletedProcess(arg, kod, "", stderr)
        return subprocess.CompletedProcess(arg, 0, cikti, "")
    return calistir, cagri


def _web():
    return {"%s:%d" % (AD, d): {"Handlers": {"/": {"Proxy": "http://127.0.0.1:%d" % i}}}
            for d, i in uzak.KAPILAR.items()}


def run():
    suite("uzak: her yerden erisim")
    eski_cli = uzak._cli
    uzak._cli = lambda: "tailscale"
    try:
        def vekil():
            y = uzak.vekilden_mi
            no(y("127.0.0.1", {"Host": "127.0.0.1:4173"}), "bilgisayarin kendisi")
            no(y("127.0.0.1", {"Host": "localhost:4173"}), "localhost")
            no(y("::1", {}), "Host yok, yerel")
            no(y("192.168.1.5", {"X-Forwarded-For": "1.1.1.1"}), "ev agi zaten yerel degil")
            ok(y("127.0.0.1", {"Host": AD + ":5173"}), "Host disarinin adi")
            ok(y("127.0.0.1", {"Host": "127.0.0.1:4173", "X-Forwarded-For": "100.1.2.3"}), "vekil basligi")
            ok(y("127.0.0.1", {"Host": "127.0.0.1", "Tailscale-User-Login": "a@b"}), "tailscale basligi")
        test("vekilden gelen istek yerel sayilmaz", vekil)

        def kapida():
            import sunucu
            from http.server import ThreadingHTTPServer
            gorulen = []

            class Isleyici(sunucu.Sunucu):
                def do_GET(self):
                    gorulen.append(self.client_address[0])
                    self.send_response(204)
                    self.end_headers()

                def log_message(self, *a):
                    pass
            with tempfile.TemporaryDirectory() as klasor:
                srv = ThreadingHTTPServer(("127.0.0.1", 0), lambda *a: Isleyici(*a, directory=klasor))
                threading.Thread(target=srv.serve_forever, daemon=True).start()
                try:
                    adres = "http://127.0.0.1:%d/x" % srv.server_address[1]
                    urllib.request.urlopen(adres, timeout=5).close()
                    urllib.request.urlopen(urllib.request.Request(adres, headers={"Host": AD}), timeout=5).close()
                finally:
                    srv.shutdown()
                    srv.server_close()
            eq(gorulen, ["127.0.0.1", uzak.VEKIL_IP])
        test("kapi vekili isaretler: butun yerel denetimler ayni adresi gorur", kapida)

        def serve_funnel():
            calistir, cagri = _sahte()
            yazilan = []
            r = uzak.ac(calistir, kok_yaz=yazilan.append)
            ok(r["ok"], "acildi")
            eq(yazilan, [AD])
            kapilar = [c for c in cagri if c[0] == "serve" and "--bg" in c]
            eq(len(kapilar), 4)
            no(any("funnel" in c for c in cagri), "funnel yok")
            ok(["serve", "--bg", "--https=443", "http://127.0.0.1:4200"] in kapilar, "Merkez")
        test("yalniz serve; dort kapi; basarida koken yazilir", serve_funnel)

        def basarisiz():
            calistir, _ = _sahte(kod=1, stderr="Serve is not enabled on your tailnet")
            yazilan = []
            r = uzak.ac(calistir, kok_yaz=yazilan.append)
            no(r["ok"], "acilmadi")
            ok("not enabled" in r["mesaj"], "sebep gosterilir")
            eq(yazilan, [])
        test("kapi acilamazsa sebep soylenir, koken yazilmaz", basarisiz)

        def onay_bekler():
            ic, _ = _sahte()

            def calistir(arg, **k):
                if "--bg" in arg:
                    raise subprocess.TimeoutExpired(arg, 30, output=b"To enable, visit:\n\n  https://login.tailscale.com/f/serve?node=abc\n", stderr=None)
                return ic(arg, **k)
            yazilan = []
            r = uzak.ac(calistir, kok_yaz=yazilan.append)
            no(r["ok"], "acilmadi")
            eq(r["onay"], "https://login.tailscale.com/f/serve?node=abc")
            ok(r["mesaj"].startswith("Tailscale'de"), "Turkce yonerge")
            eq(yazilan, [])
        test("serve kapaliysa takilmaz: onay adresi soylenir", onay_bekler)

        def jeton():
            with tempfile.TemporaryDirectory() as klasor:
                yol = os.path.join(klasor, "config.json")
                with open(yol, "w", encoding="utf-8") as f:
                    json.dump({"local_token": "gizli", "allowed_origins": ["https://x.y", "https://eski.ts.net:5173"]}, f)
                eq(uzak.merkez(oku=lambda: {"acik": False, "ad": AD}, yol=yol), None)
                eq(uzak.merkez(oku=lambda: {"acik": True, "ad": AD}, yol=yol),
                   {"url": "https://" + AD, "token": "gizli", "adres": "https://%s:5183" % AD})
                uzak._kokenleri_yaz(AD, yol)
                with open(yol, encoding="utf-8") as f:
                    cfg = json.load(f)
                eq(cfg["local_token"], "gizli")
                eq(cfg["allowed_origins"], ["https://x.y"] + ["https://%s:%d" % (AD, p) for p in (5173, 5183, 5193)])
        test("jeton yalniz erisim acikken; koken yazimi ayari korur", jeton)

        def kimlik():
            m = {"url": "u", "token": "t"}
            y = lambda b: uzak.merkez_kimlikle(b, oku_sahip=lambda: "ben@x.com", oku_merkez=lambda: m)
            eq(y({"Tailscale-User-Login": "BEN@x.com"}), m)
            eq(y({"Tailscale-User-Login": "baskasi@x.com"}), None)
            eq(y({}), None)
            eq(uzak.merkez_kimlikle({"Tailscale-User-Login": ""}, oku_sahip=lambda: "", oku_merkez=lambda: m), None)
        test("hesapsiz Merkez bagi yalniz bilgisayarin sahibine", kimlik)

        def modul_kapisi():
            # Telefon sayfasi modul kapisindan acilir; uc orada olmalidir (Giris'te kalmisti, telefon 405 aliyordu).
            import sunucu
            from http.server import ThreadingHTTPServer

            class Isleyici(sunucu.Sunucu):
                def log_message(self, *a):
                    pass
            eski = uzak.merkez_kimlikle
            uzak.merkez_kimlikle = lambda b: {"url": "u", "token": "t"} if b.get("Tailscale-User-Login") == "ben@x.com" else None
            with tempfile.TemporaryDirectory() as klasor:
                srv = ThreadingHTTPServer(("127.0.0.1", 0), lambda *a: Isleyici(*a, directory=klasor))
                threading.Thread(target=srv.serve_forever, daemon=True).start()

                def post(**baslik):
                    b = {"Host": AD + ":5183", "X-LifeOS": "hesap", "Origin": "https://%s:5183" % AD}
                    b.update({k.replace("_", "-"): v for k, v in baslik.items()})
                    b = {k: v for k, v in b.items() if v}
                    istek = urllib.request.Request("http://127.0.0.1:%d/api/uzak/merkez" % srv.server_address[1], data=b"{}", headers=b, method="POST")
                    try:
                        with urllib.request.urlopen(istek, timeout=5) as y:
                            return y.status, json.loads(y.read())
                    except urllib.error.HTTPError as h:
                        return h.code, None
                try:
                    eq(post(Tailscale_User_Login="ben@x.com"), (200, {"url": "u", "token": "t"}))
                    eq(post(Tailscale_User_Login="baskasi@x.com")[0], 403)
                    eq(post(Tailscale_User_Login="ben@x.com", X_LifeOS="")[0], 403)
                    eq(post(Tailscale_User_Login="ben@x.com", Origin="https://kotu.example")[0], 403)
                finally:
                    uzak.merkez_kimlikle = eski
                    srv.shutdown()
                    srv.server_close()
        test("telefonun Merkez bagi modul kapisindan alinir", modul_kapisi)

        def durumu():
            d = uzak.durum(_sahte(serve_web=_web())[0])
            ok(d["acik"], "dort kapi dogru hedefte")
            eq(d["ad"], AD)
            web = _web()
            del web["%s:443" % AD]
            no(uzak.durum(_sahte(serve_web=web)[0])["acik"], "eksik kapi acik sayilmaz")
        test("durum tailscale'in kendisinden okunur", durumu)
    finally:
        uzak._cli = eski_cli


if __name__ == "__main__":
    run()
