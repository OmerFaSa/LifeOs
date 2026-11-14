#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LifeOS — TEK KAPI, TEK SUREC (sadelesme Faz 1 P5, plan A4).

   Bugun: sunucu.py tek surecte dort kapi (4180 giris + Gun, 4173 AYS, 4183 SPI,
   4193 ESP) ve HKM ayri surec (4200). Burada hepsi TEK ADRES, TEK SUREC:

     /                 yeni kabuga (/kabuk/) yonlenir; hesap ve sistem paneli /kartlar/ (sunucu.Giris)
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
import os
import sys

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
                "/piksel.css", "/piksel-yazi.css", "/api/guncelleme", "/api/durum")
KOK_ONEKLER = ("/api/hesap/", "/api/kabuk/", "/api/kalite/", "/api/ayar", "/api/ice", "/api/muzik", "/api/zemin/", "/api/planlama",
               "/marka/")
_ISTEK = ("rfile", "wfile", "connection", "request", "client_address", "server", "headers", "command",
          "path", "request_version", "requestline", "raw_requestline", "close_connection")

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

    def _yonlendir(self, yer, kod=301):
        self.send_response(kod)
        self.send_header("Location", yer)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _yonel(self):
        """Istegi kime devredecegine karar verir; kendi (Giris) islerse False."""
        yol = self.path.split("?", 1)[0].split("#", 1)[0]
        if yol in ("/", "/index.html"):
            # Ilk ekran yeni kabuktur; hesap ve sistem paneli /kartlar/'da. Sorgu korunur (?bagla=… cihaz baglama QR'i).
            q = self.path[len(yol):]
            return self._yonlendir("/kabuk/" + (q if q.startswith("?") else ""), 302) or True
        if yol == "/api/hkm" or yol == "/api/hkm/yeniden":
            return False                                    # 4180'in eski anlami (guncelleme_izinli)
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
    p = argparse.ArgumentParser(description="LifeOS tek kapı: tek adres, tek süreç (4180).")
    p.add_argument("--port", type=int, help="deneme kapısı (boş bir yüksek port)")
    p.add_argument("--hkm-ayri", action="store_true", help="HKM'yi bu sürece alma")
    a = p.parse_args(argv)
    global DENEME
    DENEME = a.port is not None
    srv = kur(a.port or ETKIN_PORT, hkm=not a.hkm_ayri)
    print("LifeOS tek kapı: http://%s:%d  (Merkez %s)" % (HOST, srv.server_address[1],
          "aynı süreçte" if HKM["srv"] else "kapalı"), flush=True)
    if a.port is None:
        sunucu.plan_zamanlayici().baslat()           # eski sunucu kapandiginda zamanlanmis isler burada
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
