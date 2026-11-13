#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tek kapi (sistem/tekkapi.py, sadelesme P5) sinamasi — yalniz stdlib.

Eski topolojiyi (sunucu.py: giris + uc modul kapisi, ayri HKM daemon'u) ve tek kapiyi
GECICI veriyle, BOS YUKSEK PORTLARDA acar; ayni istegi ikisine sorar ve cevabi karsilastirir.
Sahibin calisan LifeOS'una (4173/4180/4183/4193/4200/51xx) ve verisine dokunmaz: her veri
klasoru (LOCALAPPDATA/APPDATA dahil) gecici klasore yonlendirilir.

  python tools/tekkapi_test.py            sinama
  python tools/tekkapi_test.py --bellek   + bostaki bellek (RSS), eski vs tek, uc tur, ortanca
"""
import json
import os
import re
import shutil
import socket
import statistics
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SISTEM = os.path.join(KOK, "sistem")
H = "127.0.0.1"
YASAK = {4173, 4180, 4183, 4193, 4200} | set(range(5100, 5200))

ESKI = r"""
import os, sys
sys.path.insert(0, %r)
import sunucu
g, a, s, e = map(int, os.environ["TK_PORTLAR"].split(","))
sunucu.SISTEMLER = [(k, ad, p, d, t) for (k, ad, _, d, t), p in zip(sunucu.SISTEMLER, (a, s, e))]
sunucu.GIRIS_PORT = g
sunucu._bekci_dongusu = lambda: None          # bekci 4200'de HKM acabilir; tek kapi deneme kipinde de yok
sunucu.planlama.Zamanlayici.baslat = lambda self: None   # zamanlanmis isler gercek isleri calistirir
sys.exit(sunucu.main())
""" % SISTEM


def bos_port():
    while True:
        s = socket.socket()
        s.bind((H, 0))
        p = s.getsockname()[1]
        s.close()
        if p not in YASAK:
            return p


def ortam(kok, hkm_port):
    os.makedirs(kok, exist_ok=True)
    cfg = os.path.join(kok, "hkm-config.json")
    with open(cfg, "w", encoding="utf-8") as f:
        json.dump({"host": H, "port": hkm_port, "local_token": "tekkapi-test-jetonu-" + "x" * 24,
                   "db_path": os.path.join(kok, "hkm.db")}, f)
    o = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1", PYTHONDONTWRITEBYTECODE="1",
             LOCALAPPDATA=kok, APPDATA=kok, HKM_CONFIG=cfg, LIFEOS_DIR=os.path.join(kok, "sistem"))
    for ad in ("HESAP", "AYAR", "ICE", "MUZIK", "PLAN", "ZEMIN", "TELEFON", "KABUK"):
        o["LIFEOS_%s_KLASOR" % ad] = os.path.join(kok, ad.lower())
    return o


def bekle(port, yol="/", sure=60):
    son = time.time() + sure
    while time.time() < son:
        try:
            urllib.request.urlopen("http://%s:%d%s" % (H, port, yol), timeout=2).close()
            return True
        except urllib.error.HTTPError:
            return True
        except Exception:
            time.sleep(0.3)
    return False


def iste(port, yol, yontem="GET", govde=None, basliklar=None):
    """(kod, basliklar, govde) — hata kodunda da."""
    r = urllib.request.Request("http://%s:%d%s" % (H, port, yol), data=govde, method=yontem,
                               headers=basliklar or {})
    try:
        with urllib.request.urlopen(r, timeout=30) as c:
            return c.status, c.headers, c.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers, e.read()


class _Yonlenmesiz(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def iste_yonsuz(port, yol, basliklar=None):
    ac = urllib.request.build_opener(_Yonlenmesiz)
    try:
        with ac.open(urllib.request.Request("http://%s:%d%s" % (H, port, yol), headers=basliklar or {}), timeout=10) as c:
            return c.status, c.headers
    except urllib.error.HTTPError as e:
        return e.code, e.headers


class Topoloji:
    def __init__(self, kok):
        self.kok = kok
        self.surecler = []

    def ac(self, arg, o):
        p = subprocess.Popen([sys.executable] + arg, cwd=KOK, env=o, stdout=subprocess.DEVNULL,
                             stderr=open(os.path.join(self.kok, "stderr-%d.txt" % len(self.surecler)), "w"))
        self.surecler.append(p)
        return p

    def kapat(self):
        for p in self.surecler:
            p.kill()
            p.wait(10)


def eski_ac(kok):
    """Bugunku topoloji: sunucu.py (4 kapi) + HKM daemon.py; ikisi de gecici port/veri."""
    port = {"giris": bos_port(), "ays": bos_port(), "spi": bos_port(), "esp": bos_port(), "hkm": bos_port()}
    o = ortam(kok, port["hkm"])
    o["TK_PORTLAR"] = "%d,%d,%d,%d" % (port["giris"], port["ays"], port["spi"], port["esp"])
    t = Topoloji(kok)
    t.ac(["-c", ESKI], o)
    t.ac([os.path.join(KOK, "HKM", "daemon.py")], o)
    ok = bekle(port["giris"]) and bekle(port["hkm"], "/api/health")
    return t, port, ok


def tek_ac(kok):
    port = bos_port()
    o = ortam(kok, bos_port())
    t = Topoloji(kok)
    t.ac([os.path.join(SISTEM, "tekkapi.py"), "--port", str(port)], o)
    return t, port, bekle(port)


# ---------------------------------------------------------------- sinama
SONUC = []


def dene(ad, kosul, ayrinti=""):
    SONUC.append((bool(kosul), ad))
    print("  %s %s%s" % ("✓" if kosul else "✕", ad, "" if kosul else "  — " + str(ayrinti)[:300]))


def ayni(ad, a, b, govde=True):
    """Iki cevap ayni mi: kod, Content-Type, onbellek basliklari, (istenirse) govde."""
    fark = []
    if a[0] != b[0]:
        fark.append("kod %s / %s" % (a[0], b[0]))
    for k in ("Content-Type", "Cache-Control", "Pragma", "Expires", "Access-Control-Allow-Origin"):
        if a[1].get(k) != b[1].get(k):
            fark.append("%s %r / %r" % (k, a[1].get(k), b[1].get(k)))
    if govde and a[2] != b[2]:
        fark.append("govde %d / %d bayt" % (len(a[2]), len(b[2])))
    dene(ad, not fark, "; ".join(fark))


def sina(eski, tek):
    g, T = eski["giris"], tek
    print("\nGiris ve Gun (4180 ↔ /)")
    for yol in ("/", "/kartlar/", "/gun/", "/hesap.js", "/piksel.css", "/gun/ortak/kabuk.js", "/logo/ays.png",
                "/marka/favicon.png", "/api/ayar", "/api/guncelleme", "/api/planlama"):
        ayni("GET " + yol, iste(g, yol), iste(T, yol), govde=yol not in ("/api/guncelleme",))
    ayni("GET /api/zemin/gunduz", iste(g, "/api/zemin/gunduz"), iste(T, "/api/zemin/gunduz"))
    ayni("GET /api/muzik", iste(g, "/api/muzik"), iste(T, "/api/muzik"))
    ayni("GET /api/ice", iste(g, "/api/ice"), iste(T, "/api/ice"))
    k, b = iste_yonsuz(T, "/", {"Cookie": "lifeos_hesap=1"})
    dene("çerezle / → 302 /gun/", k == 302 and b.get("Location") == "/gun/", (k, b.get("Location")))
    dene("/gun → 301 /gun/", iste_yonsuz(T, "/gun")[0] == 301)

    print("\nModüller (4173/4183/4193 ↔ /ays/ /spi/ /esp/)")
    for ad in ("ays", "spi", "esp"):
        a, b = iste(eski[ad], "/"), iste(T, "/%s/" % ad)
        ayni("GET /%s/ (dist sayfası)" % ad, a, b)
        v = re.search(rb'/dist-betik\.js\?v=([0-9a-f]+)', b[2])
        dene("/%s/ dist betiği bölünmüş" % ad, v, "sayfada /dist-betik.js?v= yok (src yedeği?)")
        if v:
            yol = "/dist-betik.js?v=" + v.group(1).decode()
            ayni("GET %s (%s)" % (yol[:30], ad), iste(eski[ad], yol), iste(T, yol))
        s = re.search(rb'/dist-stil\.css\?v=([0-9a-f]+)', b[2])
        if s:
            yol = "/dist-stil.css?v=" + s.group(1).decode()
            ayni("GET /dist-stil.css (%s)" % ad, iste(eski[ad], yol), iste(T, yol))
        ayni("GET /%s/sw.js" % ad, iste(eski[ad], "/sw.js"), iste(T, "/%s/sw.js" % ad))
        ayni("GET /%s/api/hesap/durum" % ad, iste(eski[ad], "/api/hesap/durum"), iste(T, "/%s/api/hesap/durum" % ad))
        k, bb = iste_yonsuz(T, "/" + ad)
        dene("/%s → 301 /%s/" % (ad, ad), k == 301 and bb.get("Location") == "/%s/" % ad, (k, bb.get("Location")))
    ortak = sorted(os.listdir(os.path.join(KOK, "brand", "seviye", "medya")))[0]
    ayni("GET /ays/img/seviye/" + ortak, iste(eski["ays"], "/img/seviye/" + ortak), iste(T, "/ays/img/seviye/" + ortak))
    ayni("GET /img/seviye/ (kökte)", iste(eski["ays"], "/img/seviye/" + ortak), iste(T, "/img/seviye/" + ortak))
    dene("bilinmeyen dist sürümü 404", iste(T, "/dist-betik.js?v=000000000000")[0] == 404)
    dene("/ays/../HKM/config.json dışarı çıkmaz", iste(T, "/ays/%2e%2e/%2e%2e/HKM/config.example.json")[0] == 404)

    print("\nHesap ve köken kuralları")
    ayni("GET /api/hesap/durum", iste(g, "/api/hesap/durum"), iste(T, "/api/hesap/durum"))
    durum = json.loads(iste(T, "/api/hesap/durum")[2])
    dene("/api/hesap/durum çalışır (kurulum bekliyor)", durum.get("kurulum") is True and durum.get("yerel") is True, durum)
    kotu = {"Origin": "http://kotu.example", "Content-Type": "application/json"}
    ayni("yabancı köken POST /api/hesap/giris 403", iste(g, "/api/hesap/giris", "POST", b"{}", kotu),
         iste(T, "/api/hesap/giris", "POST", b"{}", kotu))
    dene("yabancı köken 403", iste(T, "/api/hesap/giris", "POST", b"{}", kotu)[0] == 403)
    ayni("OPTIONS telefon uygulaması kökeni", iste(g, "/api/hesap/durum", "OPTIONS", None, {"Origin": "http://127.0.0.1:4173"}),
         iste(T, "/api/hesap/durum", "OPTIONS", None, {"Origin": "http://127.0.0.1:4173"}), govde=False)
    ayni("OPTIONS yabancı köken 403", iste(g, "/api/hesap/durum", "OPTIONS", None, {"Origin": "http://kotu.example"}),
         iste(T, "/api/hesap/durum", "OPTIONS", None, {"Origin": "http://kotu.example"}), govde=False)
    kendi = iste(T, "/api/hesap/durum", basliklar={"Origin": "http://%s:%d" % (H, T)})
    dene("aynı köken (tek kapının kendisi) geçer", kendi[0] == 200, kendi[0])
    vekil = {"X-Forwarded-For": "100.100.1.2"}
    a, b = iste(eski["ays"], "/api/ayar", basliklar=vekil), iste(T, "/api/ayar", basliklar=vekil)
    # modul kapisiyla (vekil isareti orada) kod+govde; onbellek basliklari 4180'inkidir (Pragma/Expires yok)
    dene("vekil (Tailscale) isteği «bu bilgisayar» sayılmaz (/api/ayar, modül kapısıyla aynı)",
         (a[0], a[2]) == (b[0], b[2]), (a[0], b[0], b[2][:120]))
    dene("vekil durum: yerel değil", json.loads(iste(T, "/api/hesap/durum", basliklar=vekil)[2]).get("yerel") is False)
    ayni("POST /api/gun/cumle başlıksız 403", iste(g, "/api/gun/cumle", "POST", b"{}"), iste(T, "/api/gun/cumle", "POST", b"{}"))
    ayni("POST /api/hkm izinsiz 403", iste(g, "/api/hkm", "POST", b""), iste(T, "/api/hkm", "POST", b""))
    ayni("POST /api/merkez/ac izinsiz 403", iste(eski["ays"], "/api/merkez/ac", "POST", b""), iste(T, "/api/merkez/ac", "POST", b""))
    ayni("POST /api/uzak/merkez yerelden 403", iste(eski["ays"], "/api/uzak/merkez", "POST", b""), iste(T, "/api/uzak/merkez", "POST", b""))
    izin = {"X-LifeOS": "guncelle"}
    dene("deneme kapısı güncellemez (POST /api/guncelle 403)", iste(T, "/api/guncelle", "POST", b"", izin)[0] == 403)
    dene("deneme kapısı yeniden başlatmaz (POST /api/yeniden 403)", iste(T, "/api/yeniden", "POST", b"", izin)[0] == 403)

    print("\nMerkez (HKM 4200 ↔ /api/hkm/)")
    jeton = {"Authorization": "Bearer tekkapi-test-jetonu-" + "x" * 24}
    a, b = iste(eski["hkm"], "/api/health"), iste(T, "/api/hkm/health")
    dene("GET /api/hkm/health = HKM /api/health (kod, alanlar)",
         a[0] == b[0] == 200 and set(json.loads(a[2])) == set(json.loads(b[2])), (a[0], b[0], b[2][:200]))
    for yol in ("/api/memory", "/api/settings", "/api/king/durum"):
        a, b = iste(eski["hkm"], yol, basliklar=jeton), iste(T, "/api/hkm" + yol[4:], basliklar=jeton)
        dene("GET %s jetonla aynı kod (%s)" % (yol, a[0]), a[0] == b[0], (a[0], b[0]))
        a, b = iste(eski["hkm"], yol), iste(T, "/api/hkm" + yol[4:])
        dene("GET %s jetonsuz aynı kod (%s)" % (yol, a[0]), a[0] == b[0], (a[0], b[0]))
    a = iste(eski["hkm"], "/api/health", "OPTIONS", None, {"Origin": "http://127.0.0.1:4173", "Access-Control-Request-Method": "POST"})
    b = iste(T, "/api/hkm/health", "OPTIONS", None, {"Origin": "http://127.0.0.1:4173", "Access-Control-Request-Method": "POST"})
    dene("HKM CORS ön isteği aynı", a[0] == b[0] and a[1].get("Access-Control-Allow-Origin") == b[1].get("Access-Control-Allow-Origin"),
         (a[0], b[0]))
    d = json.loads(iste(T, "/api/durum")[2])
    dene("/api/durum: Merkez aynı süreçte ayakta", d.get("hkm") is True and d.get("hkm_eski") is False, d)
    k, _, gv = iste(T, "/api/hkm", "POST", b"", izin)
    dene("POST /api/hkm ikinci HKM açmaz", k == 200 and json.loads(gv).get("durum") == "ayni-surec", gv[:200])

    print("\nBilinmeyen ve ayrılmış yollar")
    for yol in ("/yok-boyle", "/favicon.ico", "/api/yok", "/AYS/", "/HKM/config.example.json"):
        dene("%s → 404" % yol, iste(T, yol)[0] == 404, iste(T, yol)[0])
    dene("/kabuk/ ayrıldı (404, JSON)", iste(T, "/kabuk/")[0] == 404 and b"Kabuk" in iste(T, "/kabuk/")[2])
    dene("kökte HEAD dosya vermez", iste(T, "/sistem/tekkapi.py", "HEAD")[0] in (404, 405))
    dene("tek kapı --port'suz açılmaz (ETKIN kapalı)",
         subprocess.run([sys.executable, os.path.join(SISTEM, "tekkapi.py")], capture_output=True, timeout=60).returncode == 2)


# ---------------------------------------------------------------- bellek
def rss_mb(pid):
    """Windows calisma kumesi (tasklist «Mem Usage»), MB; olculemezse None."""
    try:
        c = subprocess.run(["tasklist", "/FI", "PID eq %d" % pid, "/FO", "CSV", "/NH"],
                           capture_output=True, text=True, timeout=20).stdout
        return int(re.sub(r"\D", "", c.strip().split('","')[-1])) / 1024.0
    except Exception:
        return None


def bos_bellek_mb():
    try:
        c = subprocess.run(["powershell", "-NoProfile", "-Command", "(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory"],
                           capture_output=True, text=True, timeout=60).stdout
        return int(c.strip()) / 1024.0
    except Exception:
        return None


def bellek(tur=3, dinlen=15):
    print("\nBoştaki bellek (çalışma kümesi, MB), %d tur, açıldıktan %d sn sonra" % (tur, dinlen))
    olc = {"eski": [], "tek": []}
    for i in range(tur):
        for ad, acici in (("eski", eski_ac), ("tek", tek_ac)):
            serbest = bos_bellek_mb()
            if serbest is not None and serbest < 400:
                print("  • %s tur %d koşulamadı: boş bellek %.0f MB (< 400)" % (ad, i + 1, serbest))
                continue
            kok = tempfile.mkdtemp(prefix="tekkapi-bellek-")
            t, port, ok = acici(kok)
            try:
                if not ok:
                    print("  • %s tur %d açılmadı" % (ad, i + 1))
                    continue
                time.sleep(dinlen)
                parca = [rss_mb(p.pid) for p in t.surecler]
                if None in parca:
                    print("  • %s tur %d ölçülemedi" % (ad, i + 1))
                    continue
                olc[ad].append(sum(parca))
                print("  %s tur %d: %s = %.1f MB (boş bellek önce %s MB)" % (
                    ad, i + 1, " + ".join("%.1f" % x for x in parca), sum(parca),
                    "?" if serbest is None else "%.0f" % serbest))
            finally:
                t.kapat()
                shutil.rmtree(kok, ignore_errors=True)
    for ad in olc:
        if olc[ad]:
            print("  ORTANCA %s: %.1f MB (ölçüldü, n=%d)" % (ad, statistics.median(olc[ad]), len(olc[ad])))
    return olc


def main():
    eski_kok, tek_kok = tempfile.mkdtemp(prefix="tekkapi-eski-"), tempfile.mkdtemp(prefix="tekkapi-tek-")
    e = t = None
    try:
        e, eport, eok = eski_ac(eski_kok)
        t, tport, tok = tek_ac(tek_kok)
        if not (eok and tok):
            for k in (eski_kok, tek_kok):
                for f in os.listdir(k):
                    if f.startswith("stderr"):
                        print(k, f, open(os.path.join(k, f), encoding="utf-8", errors="replace").read()[-1500:])
            print("koşulamadı: sunucular açılmadı (eski %s, tek %s)" % (eok, tok))
            return 1
        sina(eport, tport)
    finally:
        for x in (e, t):
            if x:
                x.kapat()
        shutil.rmtree(eski_kok, ignore_errors=True)
        shutil.rmtree(tek_kok, ignore_errors=True)
    kirmizi = [a for k, a in SONUC if not k]
    print("\n%d/%d yeşil" % (len(SONUC) - len(kirmizi), len(SONUC)))
    if "--bellek" in sys.argv:
        bellek()
    return 1 if kirmizi else 0


if __name__ == "__main__":
    for akis in (sys.stdout, sys.stderr):
        try:
            akis.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    raise SystemExit(main())
