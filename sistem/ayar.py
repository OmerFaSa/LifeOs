"""ORTAK AYARLAR — sistem ayarlarinin bu bilgisayardaki tek kopyasi.

Kullanici (2026-10-30): «ses tum sisteme vuruyor ama duvar kagidi yalniz
AYS icin oluyor; bunu belirtin ya da sistem ayarlari, modul ayarlari diye
ayirin». Moduller ayri kokenlerdir (4173/4183/4193, giris 4180): tarayici
deposu paylasilmaz. Sistem ayarlari (gorunus, arka plan secimi, ses,
animasyon, minikler, King, profiller) bu yuzden PC'de bir kez durur; her
kapi sayfayi verirken guncel kopyayi sayfanin basina koyar (ilk cizim
dogru), sayfa degisikligi geri yazar (brand/ortak/animasyon.js).

  GET  /api/ayar     { ayar:{ anahtar:deger }, zaman }
  POST /api/ayar     { ayar:{ anahtar:deger|null } } — yalniz degisenler; null siler

Sozler:
  1. YALNIZ BU BILGISAYAR; yazma X-LifeOS: ayar ister.
  2. YALNIZ TERCIH. Anahtar `lifeos.` ile baslar ve kapali bir oneke uyar
     (gorunus, zemin, ses, muzik degil, minik, King tercihi, profil); veri,
     hesap, kilit ve King'in hafizasi buraya yazilamaz.
  3. SINIRLI. En cok 120 anahtar; deger 4 KB (profiller 60 KB).
  4. Modul kapali sunucuda (telefon, tek dosya) hicbir sey degismez: sayfa
     kendi deposuyla calisir.
"""

import json
import os
import re
import threading
import time

ANAHTAR = re.compile(r"^lifeos\.(yazi|boyut|vurgu|cam|kontrast|perde|rozet|kenar\.yuzey|zemin|zemin\.[a-z.]+|manzara|manzara\.[a-z.]+"
                     r"|tema\.oto|tema\.secim|hareket|hareket\.hiz|ses|ses\.duzey|sessiz|minik|minik\.[a-z]+"
                     r"|king\.(ad|gorunus|ses|hiz|tarz)|muzik\.(var|acilis\.gun)|profiller|profil\.etkin)$")
EN_COK = 120
_kilit = threading.Lock()


def klasor():
    elle = os.environ.get("LIFEOS_AYAR_KLASOR")
    if elle:
        return elle
    if os.name == "nt":
        return os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "LifeOS")
    return os.path.join(os.path.expanduser("~"), ".lifeos")


def _yol(kok=None):
    return os.path.join(kok or klasor(), "ayar.json")


def oku(kok=None):
    try:
        with open(_yol(kok), encoding="utf-8") as f:
            v = json.load(f)
        a = v.get("ayar") if isinstance(v, dict) else None
        return {"ayar": a if isinstance(a, dict) else {}, "zaman": v.get("zaman") or 0}
    except (OSError, ValueError, AttributeError):
        return {"ayar": {}, "zaman": 0}


def gecerli(k, v):
    if not isinstance(k, str) or not ANAHTAR.match(k):
        return False
    if v is None:
        return True
    return isinstance(v, str) and len(v) <= (60000 if k == "lifeos.profiller" else 4000)


def birlestir(degisen, kok=None):
    """Gecerli olanlari yazar; doner: (yeni durum, reddedilen anahtarlar)."""
    red = []
    with _kilit:
        d = oku(kok)
        a = d["ayar"]
        for k, v in (degisen or {}).items():
            if not gecerli(k, v):
                red.append(str(k)[:60])
                continue
            if v is None:
                a.pop(k, None)
            elif k in a or len(a) < EN_COK:
                a[k] = v
            else:
                red.append(k)
        d = {"ayar": a, "zaman": time.time()}
        k2 = kok or klasor()
        os.makedirs(k2, exist_ok=True)
        gecici = _yol(k2) + ".yaziliyor"
        with open(gecici, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False)
        os.replace(gecici, _yol(k2))
    return d, red


def sayfaya_ekle(govde, kok=None):
    """Sayfanin <head>'ine ortak ayarlari koyar (ilk cizimden once okunur)."""
    yazi = isinstance(govde, str)
    metin = govde if yazi else govde.decode("utf-8")
    veri = json.dumps(oku(kok)["ayar"], ensure_ascii=False).replace("</", "<\\/")
    etiket = "<script>window.__LIFEOS_AYAR__=%s;</script>" % veri
    i = metin.find("<head>")
    if i < 0:
        return govde
    metin = metin[:i + 6] + etiket + metin[i + 6:]
    return metin if yazi else metin.encode("utf-8")


def _json(h, kod, veri):
    govde = json.dumps(veri, ensure_ascii=False).encode("utf-8")
    h.send_response(kod)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(govde)))
    h.send_header("Cache-Control", "no-store")
    h.end_headers()
    h.wfile.write(govde)


def isle(h, kok=None):
    if h.client_address[0] not in ("127.0.0.1", "::1"):
        return _json(h, 403, {"hata": "Ayarlar yalnız bu bilgisayardan."})
    if h.command == "GET":
        return _json(h, 200, oku(kok))
    if h.command != "POST":
        return _json(h, 405, {"hata": "Desteklenmiyor."})
    if h.headers.get("X-LifeOS") != "ayar":
        return _json(h, 403, {"hata": "Yalnız LifeOS'un kendi sayfasından."})
    try:
        boy = min(int(h.headers.get("Content-Length") or 0), 512 * 1024)
        gelen = json.loads(h.rfile.read(boy).decode("utf-8") or "{}")
    except (ValueError, UnicodeDecodeError):
        return _json(h, 400, {"hata": "Okunamadı."})
    if not isinstance(gelen.get("ayar"), dict):
        return _json(h, 400, {"hata": "ayar bekleniyor."})
    d, red = birlestir(gelen["ayar"], kok)
    return _json(h, 200, dict(d, reddedilen=red))
