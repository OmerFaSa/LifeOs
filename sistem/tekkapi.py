#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Başbuğ — TEK KAPI, TEK SUREC (sadelesme Faz 1 P5, plan A4).

   Bugun: sunucu.py tek surecte dort kapi (4180 giris + Gun, 4173 AYS, 4183 SPI,
   4193 ESP) ve HKM ayri surec (4200). Burada hepsi TEK ADRES, TEK SUREC:

     /                 yeni kabuga (/kabuk/) yonlenir; /kartlar/ (eski panel) kabugun Hesap ekranina (/kabuk/#/hesap)
     /api/...          butun API'ler (hesap, ayar, ice, muzik, zemin, planlama, guncelle, durum; uzak/merkez 410)
     /api/hkm/<yol>    HKM cekirdegi AYNI SURECTE (HKM/daemon.Handler, /api/<yol> olarak)
     /kabuk/           yeni kabuk (Faz 2): kabuk/ + onun istedigi motor/, alan/ icerigi; kapali liste

   ISLEYICILER YENIDEN YAZILMADI: her istek mevcut isleyici sinifina devredilir
   (_devret: ayni soket, ayni basliklar, yol degistirilmis). Davranis eskisiyle ayni.

   DEVREDE (kapanis, Faz 7): ETKIN = True. `--port`'suz 4180'de acilir ve zamanlanmis isleri
   calistirir; `--port <bos port>` deneme/sinama kapisidir (zamanlayici baslamaz). Eski kapilar
   (sunucu.py'nin modul kapilari, ayri HKM sureci, ev agi) kalkti; geri donus = kapanis dalini geri al.
"""

import argparse
import json
import os
import sys
import threading
import time

SISTEM = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True
sys.path.insert(0, SISTEM)
import sunucu  # noqa: E402
from sunucu import Giris, KOK, HOST, KuyrukluSunucu, KABUK_KOKLER, KABUK_TEK, kabuk_dosyasi  # noqa: E402
import uzak  # noqa: E402

ETKIN = True           # kapanis: tek kapi devrede (sahibin anahtari main'de bu satirdir)
ETKIN_PORT = 4180
DENEME = False         # main: --port ile acilan deneme/sinama kapisi calisan sistemi guncellemez, yeniden baslatmaz

# Giris'in kok sayfalari; kalan her bilinmeyen yol 404 (Giris her seye giris sayfasini veriyordu).
KOK_SAYFALAR = ("/", "/index.html", "/kartlar", "/kartlar/")
# 4180'in sabit dosyalari ve oneklari (Giris.do_GET'teki liste ve dallar).
KOK_DOSYALAR = ("/hesap.js", "/gocpaket.js", "/hesap.css", "/animasyon.js", "/qr.js", "/muzik.js", "/parca.js",
                "/piksel.js", "/piksel-apartman.js", "/piksel-doga.js", "/piksel-figur.js", "/piksel-simge.js",
                "/piksel.css", "/piksel-yazi.css", "/api/guncelleme", "/api/durum") + tuple("/yazi/" + a for a in sunucu.YAZI_DOSYALARI)
KOK_ONEKLER = ("/api/hesap/", "/api/kabuk/", "/api/kalite/", "/api/ayar", "/api/ice", "/api/muzik", "/api/zemin/", "/api/planlama",
               "/marka/")
_ISTEK = ("rfile", "wfile", "connection", "request", "client_address", "server", "headers", "command",
          "path", "request_version", "requestline", "raw_requestline", "close_connection")

# Kabugun King sohbeti -> Merkez yolu (TekKapi._king). Baska Merkez yolu bu kapidan jetonsuz acilmaz.
KING_YOLLARI = {"/api/kabuk/king": "/api/chat", "/api/kabuk/king/kopru": "/api/kopru"}

# --- Kabuk ekran hatalari (/api/kabuk/hata): istemci window.onerror ile gonderir, sunucu dosyaya yazar ---------
HATA_EN_COK = 4096           # govde siniri (bayt); fazlasi 413
HATA_DAKIKADA = 20           # hiz siniri: pencere basina istek; fazlasi 429 (dongu halindeki bir hata diski doldurmaz)
HATA_DOSYA_SINIRI = 200_000  # gunluk bu boyu gecince .1'e doner (en cok iki dosya)
_hata_zamanlari = []
_hata_kilit = threading.Lock()


def hata_gunlugu():
    return os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "LifeOS", "kabuk-hata.log")


def hata_yaz(veri, yol=None, simdi=None):
    """Tek satir yazar (JSON, satir sonu yok edilir); donen gunluk. True: yazildi, False: hiz siniri."""
    simdi = simdi or time.time()
    with _hata_kilit:
        _hata_zamanlari[:] = [z for z in _hata_zamanlari if simdi - z < 60]
        if len(_hata_zamanlari) >= HATA_DAKIKADA:
            return False
        _hata_zamanlari.append(simdi)
        yol = yol or hata_gunlugu()
        os.makedirs(os.path.dirname(yol), exist_ok=True)
        try:
            if os.path.getsize(yol) > HATA_DOSYA_SINIRI:
                os.replace(yol, yol + ".1")
        except OSError:
            pass
        kayit = {k: str(veri.get(k, ""))[:n] for k, n in (("ileti", 500), ("yigin", 1500), ("sayfa", 200), ("tur", 40))}
        with open(yol, "a", encoding="utf-8") as f:
            f.write(time.strftime("%Y-%m-%d %H:%M:%S ") + json.dumps(kayit, ensure_ascii=False) + chr(10))
    return True

HKM = sunucu.HKM     # ayni surecte HKM cekirdegi (hkm_kur); sunucu.hkm_ayakta/hkm_ac buna bakar


def hkm_kur(config_yolu=None):
    """HKM cekirdegini bu surece kurar (HKM/daemon.hazirla). Ayar yoksa ya da jeton bossa
    None: tek kapi HKM'siz de calisir (sunucu.py kural 1), /api/hkm/ 503 verir."""
    hkm_dizin = os.path.join(KOK, "HKM")
    if hkm_dizin not in sys.path:
        sys.path.append(hkm_dizin)        # daemon kendini yine en one koyar; sistem/ ile ortak ust ad yok
    import daemon
    from core import saat
    yol = config_yolu or daemon.CONFIG_PATH
    eski, daemon.CONFIG_PATH = daemon.CONFIG_PATH, yol
    try:
        cfg = daemon.load_config()
    finally:
        daemon.CONFIG_PATH = eski
    if not cfg.get("local_token"):
        return None
    saat.dilimi_kur(cfg)
    srv = type("HkmCekirdek", (), {})()       # Handler yalniz nitelik okur (daemon.hazirla)
    daemon.hazirla(srv, cfg, yol)
    HKM.update(srv=srv, jeton=cfg["local_token"], sinif=daemon.Handler)
    return srv


def _hkm_ayni_surecte(port):
    """Cihazin Merkez yolu (hesap.py soz 30) bu surecin HKM'sine, bu kapinin portundan gider."""
    # Cihazin Merkez yolu (hesap.py soz 30) da bu surecin HKM'sine gider, 4200'e degil.
    sunucu.hesap.hkm_hedef = lambda: ("http://%s:%d/api/hkm" % (HOST, port), HKM["jeton"])


class TekKapi(Giris):
    """Giris'in kendisi + yol onekine gore mevcut isleyicilere devir."""
    disable_nagle_algorithm = True

    def parse_request(self):
        # Sunucu.parse_request ile ayni: Tailscale serve P6'da BU kapiya gelecek; vekil
        # istegi «bu bilgisayar» sayilmasin (uzak.py soz 2). Giris'te yoktu, cunku serve 4180'e gelmiyordu.
        tamam = super().parse_request()
        if tamam and uzak.vekilden_mi(self.client_address[0], self.headers):
            self.client_address = (uzak.VEKIL_IP, self.client_address[1])
        return tamam

    def _devret(self, sinif, yol, **nitelik):
        h = sinif.__new__(sinif)
        for a in _ISTEK:
            setattr(h, a, getattr(self, a))
        h.path = yol
        for k, v in nitelik.items():
            setattr(h, k, v)
        try:
            isle = getattr(h, "do_" + self.command, None)
            return isle() if isle else h.send_error(501)
        finally:
            self.close_connection = h.close_connection

    def _king(self, hedef):
        """Kabuktaki King sohbeti (kabuk/king-sohbet.js) Merkez'e AYNI KOKENDEN gider; ortak jeton tarayiciya
        hic girmez, burada eklenir. Yalniz bu bilgisayardan: uzaktan King'e Hesap › Merkez yolu (hesap.py soz 30,
        admin oturumu) gider. POST ozel baslik ister (tarayici on-kontrole zorlanir, bu kapi izin vermez)."""
        if not HKM["srv"]:
            if self.command == "GET":       # hal sorusu: Merkez yoksa koprulerin hali de bilinmez (hata degil)
                return self._json(200, {"kopruler": None, "merkez": False})
            return self._json(503, {"ok": False, "mesaj": "Merkez bu süreçte açık değil."})
        koken = self.headers.get("Origin")
        port = sunucu.GIRIS_PORT
        if self.client_address[0] not in ("127.0.0.1", "::1") or koken not in (
                None, "http://%s:%d" % (HOST, port), "http://localhost:%d" % port):
            return self._json(403, {"ok": False, "mesaj": "King sohbeti yalnız bu bilgisayarda; uzaktan Hesap › "
                                                          "Merkez bağlantısıyla (sahibin oturumu) ulaşılır."})
        if self.command == "POST" and self.headers.get("X-LifeOS") != "king":
            return self._json(403, {"ok": False, "mesaj": "İstek Başbuğ'dan gelmedi."})
        if self.command not in ("GET", "POST"):
            return self.send_error(405)
        del self.headers["Authorization"]
        self.headers["Authorization"] = "Bearer " + HKM["jeton"]
        q = self.path.split("?", 1)
        return self._devret(HKM["sinif"], hedef + ("?" + q[1] if len(q) > 1 else ""), server=HKM["srv"])

    def _hata(self):
        """Yalniz bu bilgisayardan (127.0.0.1, vekil degil), kendi kokeninden, X-LifeOS: kabuk-hata ile."""
        port = sunucu.GIRIS_PORT
        koken = self.headers.get("Origin")
        if (self.command != "POST" or self.client_address[0] not in ("127.0.0.1", "::1")
                or self.headers.get("Host") not in ("%s:%d" % (HOST, port), "localhost:%d" % port)
                or koken not in (None, "http://%s:%d" % (HOST, port), "http://localhost:%d" % port)
                or self.headers.get("X-LifeOS") != "kabuk-hata"):
            return self._json(403, {"ok": False})
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            n = -1
        if n < 0 or n > HATA_EN_COK:
            self.close_connection = True      # govde okunmadi: baglanti kapanir
            return self._json(413, {"ok": False})
        try:
            veri = json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return self._json(400, {"ok": False})
        if not isinstance(veri, dict):
            return self._json(400, {"ok": False})
        yazildi = hata_yaz(veri)
        return self._json(200 if yazildi else 429, {"ok": yazildi})

    def _yonlendir(self, yer, kod=301):
        self.send_response(kod)
        self.send_header("Location", yer)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _yonel(self):
        """Istegi kime devredecegine karar verir; kendi (Giris) islerse False."""
        yol = self.path.split("?", 1)[0].split("#", 1)[0]
        if yol in ("/", "/index.html"):
            # Ilk ekran yeni kabuktur. Sorgu korunur (?bagla=… cihaz baglama QR'i).
            q = self.path[len(yol):]
            return self._yonlendir("/kabuk/" + (q if q.startswith("?") else ""), 302) or True
        if yol == "/api/hkm" or yol == "/api/hkm/yeniden":
            return False                                    # 4180'in eski anlami (guncelleme_izinli)
        if yol == "/api/kabuk/hata":
            return self._hata() or True
        if yol in KING_YOLLARI:
            return self._king(KING_YOLLARI[yol]) or True
        if yol.startswith("/api/hkm/"):
            if not HKM["srv"]:
                return self._json(503, {"ok": False, "mesaj": "Merkez bu süreçte açık değil."}) or True
            return self._devret(HKM["sinif"], "/api/" + self.path[len("/api/hkm/"):], server=HKM["srv"]) or True
        if yol == "/api/uzak/merkez":
            # A10 (faz7-cihaz-zemini.md acik soru 2): tek kapida hesapsiz Merkez yolu yok; ortak jeton cihaza
            # gitmez, cihaz hesabiyla girip kendi anahtarini /api/hesap/merkez'den alir. hesap.js 410'da sessizce vazgecer.
            return self._json(410, {"hata": "Bu yol kapandı: hesabınla gir, Merkez bağlantısı Hesap › Merkez'de."}) or True
        if DENEME and yol in ("/api/guncelle", "/api/yeniden"):
            return self._json(403, {"durum": "engel", "mesaj": "Deneme kapısında kapalı."}) or True
        if yol == "/kabuk":
            return self._yonlendir("/kabuk/") or True
        if yol in KABUK_TEK or yol.split("/")[1] in KABUK_KOKLER:
            return self._kabuk_sun(kabuk_dosyasi(yol)) or True
        if yol in KOK_SAYFALAR or yol in KOK_DOSYALAR or yol.startswith(KOK_ONEKLER) or yol in ("/api/guncelle", "/api/yeniden"):
            return False
        return self.send_error(404) or True

    def do_GET(self):
        if not self._yonel():
            return super().do_GET()

    def do_HEAD(self):
        if not self._yonel():
            return self.send_error(405)

    def do_POST(self):
        if not self._yonel():
            return super().do_POST()

    def do_DELETE(self):
        if not self._yonel():
            return super().do_DELETE()

    def do_OPTIONS(self):
        if not self._yonel():
            return super().do_OPTIONS()


def kur(port, hkm=True, hkm_config=None):
    """Tek kapi sunucusu (henuz serve_forever yok). hkm=False: HKM ayri surecte kalir, /api/hkm/ 503."""
    srv = KuyrukluSunucu((HOST, port), TekKapi)
    sunucu.GIRIS_PORT = srv.server_address[1]     # guncelleme/gun cumlesi Origin denetimi bu kapiya bakar
    os.environ["LIFEOS_TASIMA"] = "1"             # koken tasimasi (kabuk/tasima.js): yalniz tek kapi devredeyken
    if hkm and hkm_kur(hkm_config):
        _hkm_ayni_surecte(srv.server_address[1])
    return srv


def main(argv=None):
    sunucu._cikti_utf8()
    p = argparse.ArgumentParser(description="Başbuğ tek kapı: tek adres, tek süreç (4180).")
    p.add_argument("--port", type=int, help="deneme kapısı (boş bir yüksek port)")
    p.add_argument("--hkm-ayri", action="store_true", help="HKM'yi bu sürece alma")
    a = p.parse_args(argv)
    global DENEME
    DENEME = a.port is not None
    srv = kur(a.port or ETKIN_PORT, hkm=not a.hkm_ayri)
    print("Başbuğ tek kapı: http://%s:%d  (Merkez %s)" % (HOST, srv.server_address[1],
          "aynı süreçte" if HKM["srv"] else "kapalı"), flush=True)
    if a.port is None:
        sunucu.plan_zamanlayici().baslat()           # eski sunucu kapandiginda zamanlanmis isler burada
        # Yeni surum dinlemeye basladi: guncellemenin donus noktasi artik gerekmez (sistem/baslat.py geri_al).
        threading.Thread(target=sunucu.guncelle.donus_sil, daemon=True).start()
    try:
        sunucu.surekli_hizmet(srv)
    except KeyboardInterrupt:
        pass
    finally:
        if HKM["srv"]:
            HKM["srv"].dur.set()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
