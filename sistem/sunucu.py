#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LifeOS — TEK SUNUCU.

   Dort ayri terminalde dort komut calistirmak, sistemi acmanin en olasi
   vazgecme noktasiydi. Bu betik hepsini TEK SURECTE ayaga kaldirir:

     http://127.0.0.1:4180   giris sayfasi (hangi sistem nerede)
     http://127.0.0.1:4173   AYS
     http://127.0.0.1:4183   SPI
     http://127.0.0.1:4193   ESP

   «Tek sunucu» ama NEDEN TEK PORT DEGIL

   Uc uygulamayi tek porta koymak en kolayi olurdu ve iki sey kirardi:

   1. VERI TASINMIS GORUNURDU. Tarayici depolamasi KOKENE baglidir ve
      koken porttur: 4173'te duran AYS verisi, 4180'de acilan AYS'e
      gorunmez. Kullanici «her sey silinmis» sanirdi — oysa duruyordur,
      baska bir kapinin ardinda.

   2. UC UYGULAMA TEK KOTAYI PAYLASIRDI. localStorage siniri koken
      basinadir (~5 MB). Ayri portlarda her sistemin kendi 5 MB'i var;
      tek portta ucu birden ayni 5 MB'i boluserdi ve dokuz aylik
      ufuk hesabi (her sistemin `perfcheck`/depo projeksiyonu) sessizce
      yanlis olurdu.

   Bu yuzden: TEK KOMUT, TEK SUREC, AYRI KAPILAR. Kullanicinin sayaci
   dort degil bir; sistemlerin sinirlari yine ayri.

   Uc kural:

   1. HKM'YE BAGLI DEGILDIR. Bu sunucu HKM'yi bilmez ve HKM kapaliyken de
      uc sistemi acar. Uc sistemin HKM'den bagimsizligi bir slogan degil,
      calisma bicimidir; sunucu katmaninda da boyle kalir.

   2. ONBELLEK YOK. Her yanit no-store tasir: kaynak duzenlendikten sonra
      eski surumun calismaya devam etmesi, saatler yiyen bir hatadir.

   3. YALNIZ YEREL. 127.0.0.1'e baglanir. Disari acmak ayri ve BILINCLI
      bir karardir; bu betik o karari kullanici yerine vermez.
      Tek istisna o kararin kendisidir: kullanici `python sistem/telefon.py`
      ile sertifika urettiyse uc modul ev aginda https ile DE acilir
      (5173/5183/5193; kurulum sayfasi http 5180). Bilgisayardaki 127.0.0.1
      kapilari ve onlarin verisi degismez; giris sayfasi ve onun API'leri
      ev agina hic acilmaz. `telefon.py --kapat` geri alir.

   4. HESAP API'SI MODUL KAPILARINDADIR (2026-10-04, depo sahibinin
      karari). /api/hesap/... (sistem/hesap.py) hem 127.0.0.1 hem ev agi
      kapilarinda calisir: PC, telefon ve tablet ayni hesapla girer, verinin
      kopyasi bu bilgisayarda durur. Jetonsuz istek veri goremez; admin
      yalniz bu bilgisayardan kurulur.
"""

import hashlib
import html
import json
import os
import re
import socket
import ssl
import subprocess
import sys
import threading
import time
import urllib.request
from functools import partial
from http.server import BaseHTTPRequestHandler, SimpleHTTPRequestHandler, ThreadingHTTPServer

SISTEM = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.dirname(SISTEM)          # deponun koku (sistem/ bir alt klasor)
sys.dont_write_bytecode = True      # __pycache__ birikmesin
sys.path.insert(0, SISTEM)
import guncelle  # noqa: E402
import hesap  # noqa: E402
import zemin  # noqa: E402  (kullanicinin arka plan dosyasi, sistem/zemin.py)
import muzik  # noqa: E402  (kullanicinin muzik dosyalari ve listeleri, sistem/muzik.py)
import ice  # noqa: E402  (Google verisini hesap baglamadan getirmek, sistem/ice.py)
import ayar  # noqa: E402  (sistem ayarlarinin tek kopyasi, sistem/ayar.py)
import planlama  # noqa: E402  (Sistem planlamasi, sistem/planlama.py)
import telefon  # noqa: E402

HOST = "127.0.0.1"
GIRIS_PORT = 4180
HKM_PORT = 4200

# (klasor, ad, port, dist dosyasi)
SISTEMLER = [
    ("AYS", "Akademik Yol Sistemi", 4173, "rota.html",
     "sınav hazırlığı: plan, deneme, kalibrasyon"),
    ("SPI", "SPİ — Sağlık Performans İzleyicisi", 4183, "spi.html",
     "uyku, besin, hareket, toparlanma"),
    ("ESP", "Entelektüel Seviye Planlayıcı", 4193, "esp.html",
     "dil, felsefe, müzik: merdiven ve SRS"),
]


# SEVIYE:yol-bas
# ===== BU BLOK URETILMISTIR — BURAYI DUZENLEME =====
# Kaynak: brand/seviye/ortak_yol.py
# Yayan:  python3 tools/seviye.py --yay   (denetim: --denetle)
#
# Ayni muhafiz dort sunucuda da duruyordu ve dordunu elle guncellemek
# gerekiyordu: bu depoda tam olarak bunu onlemek icin --denetle yazildi,
# ama Python tarafi disarida kalmisti. Artik o da yayiliyor.
from urllib.parse import unquote as _unquote

# Servis edilen medya turleri. Listede olmayan uzanti hic acilmaz: bir
# gorsel kapisinin dosya sistemine acilan bir pencereye donusmesi, bu
# depoda kabul edilebilir bir bedel degil.
MEDYA_TURLERI = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".svg": "image/svg+xml",
    ".mp4": "video/mp4", ".webm": "video/webm",
}


def _guvenli_medya_adi(ad, izinli=None):
    """URL parcasini DUZ bir dosya adina indirger; olmuyorsa None.

    Yuzde kodlamasi ONCE cozulur. Cozmeden birakmak iki sey yapardi:
    `kademe%201.png` gibi bosluklu bir ad hic bulunamaz (sessiz 404) ve
    muhafiz, cozulmus hali hic gormedigi icin yanlis yerde guven
    duyardi. Cozduktan sonra alt klasor, ".." ve gizli dosya reddedilir;
    ":" da: Windows'ta `D:foto.png` os.path.join'i D: surucusune atlatir.
    """
    try:
        ad = _unquote(ad or "")
    except Exception:
        return None
    if not ad or "/" in ad or "\\" in ad or ":" in ad or ad.startswith("."):
        return None
    uzanti = os.path.splitext(ad)[1].lower()
    if uzanti not in (izinli if izinli is not None else MEDYA_TURLERI):
        return None
    return ad


def _ortak_marka_yolu(clean, kok):
    """/img/marka/<ad> -> <kok>/brand/medya/<aile>/<ad>, yoksa None.

    AILE ADDAN TURER, yoldan degil: `kimlik-ays.webp` ->
    `brand/medya/kimlik/kimlik-ays.webp`. Boylece URL duz kalir ve
    muhafiz alt klasor gezmek zorunda kalmaz — bir gorsel kapisinin
    dosya sistemine acilan bir pencereye donusmesi, bu depoda kabul
    edilebilir bir bedel degil.

    Marka medyasi seviye medyasindan AYRI durur (bkz. brand/medya/OKU.md):
    seviye medyasi bir kataloga baglidir ve eksigi kod tarafindan
    bilinir; marka medyasi serbesttir ve eksik gorsel hata degildir."""
    onek = "/img/marka/"
    if not clean.startswith(onek):
        return None
    ad = _guvenli_medya_adi(clean[len(onek):])
    if not ad:
        return None
    aile = os.path.splitext(ad)[0].split("-", 1)[0]
    if not aile or not aile.isalnum():
        return None
    return os.path.join(kok, "brand", "medya", aile, ad)


def _ortak_seviye_yolu(clean, kok):
    """/img/seviye/<ad> -> <kok>/brand/seviye/medya/<ad>, yoksa None.

    Rutbe kartlari ve kademe sahneleri uc sistemin de AYNI dosyasidir;
    uc kez kopyalamak depoyu buyutmekten baska bir sey yapmazdi.
    Sistemlerin bagimsizligi bozulmaz: dosya yoksa perde karti kendisi
    cizer, arayuzde hicbir sey kirilmaz.

    MEDYA KENDI KLASORUNDE. Once gorseller `brand/seviye/` icinde,
    `xp.js` ve `perde.js` ile yan yana duruyordu; yirmi bir dosya
    eklenince o klasorde kodu bulmak zorlasti. Kaynak kod ve servis
    edilen medya ayni yerde durmaz — `medya/` yalniz servis edilen
    dosyalari tutar, `eski/` ise servis EDILMEYENLERI (bkz. OKU.md).
    """
    onek = "/img/seviye/"
    if not clean.startswith(onek):
        return None
    ad = _guvenli_medya_adi(clean[len(onek):])
    if not ad:
        return None
    return os.path.join(kok, "brand", "seviye", "medya", ad)


def _ortak_dist_yolu(clean, kok):
    """/dist/<yol> -> <kok>/dist/<yol>, /dist degilse None.

    ".." ust klasore, ":" iceren parca (`E:`, `C:x`) Windows'ta baska bir
    surucuye cikar: `/dist/E:/` telefon portundan depo disini listeliyordu
    (2026-10-26). Ikisinden biri varsa dist kokune duser."""
    if clean != "/dist" and not clean.startswith("/dist/"):
        return None
    parca = [p for p in clean[len("/dist/"):].replace("\\", "/").split("/") if p not in ("", ".")]
    if any(p == ".." or ":" in p for p in parca):
        return os.path.join(kok, "dist")
    return os.path.join(kok, "dist", *parca)
# ===== URETILMIS BLOK SONU =====
# SEVIYE:yol-bit


# Guncel tek dosya (2026-10-29, kullanici: «yuklenme gecikiyor»). Kapinin
# kokunden src/index.html ~230 ayri istekti (tarayici bir kokene alti
# baglanti acar: kabuk ~1,2-1,4 sn); dist uc istektir (~0,33 sn). build.py
# dist'in yanina hangi kaynaklardan derlendigini yazar (dist/kaynak.json:
# dosya basina sha256, satir sonu esitlenmis — Windows'ta git CRLF'e cevirir).
# Kok dist'i YALNIZ listedeki her kaynak ayniysa sunar; degil ya da liste
# yoksa/bozuksa src (kural 2: eski surum calismaz). Imza mtime+boyut
# degismedikce yeniden hesaplanmaz. Test: tools/dist_sun_test.py
_IMZA = {}


def _dosya_imzasi(yol):
    st = os.stat(yol)
    anahtar = (st.st_mtime_ns, st.st_size)
    eski = _IMZA.get(yol)
    if eski and eski[0] == anahtar:
        return eski[1]
    with open(yol, encoding="utf-8", newline=None) as f:
        imza = hashlib.sha256(f.read().encode("utf-8")).hexdigest()
    _IMZA[yol] = (anahtar, imza)
    return imza


def _guncel_dist(repo):
    """Kaynakla ayni derlenmis dist dosyasinin yolu; degilse None."""
    try:
        with open(os.path.join(repo, "dist", "kaynak.json"), encoding="utf-8") as f:
            liste = json.load(f)
        ad = _guvenli_medya_adi(str(liste["dosya"]), (".html",))
        kaynak = liste["kaynak"]
        if not ad or not isinstance(kaynak, dict) or not kaynak:
            return None
        src = os.path.join(repo, "src")
        for rel, imza in kaynak.items():
            if _dosya_imzasi(os.path.join(src, rel)) != imza:
                return None
        dist = os.path.join(repo, "dist", ad)
        return dist if os.path.isfile(dist) else None
    except (OSError, ValueError, KeyError, TypeError, AttributeError):
        return None


# Dist'in buyuk satir ici betigi ayri adresten (2026-10-29). Chromium satir
# ici betigi ana is parcaciginda derler (AYS 6 MB: ~85 ms); ayri dosyayi
# inerken arka planda derler, calistirma da hizlanir. Olculen (AYS): tekrar
# acilista DOMContentLoaded ~440 -> ~330 ms, ilk acilis ~1450 -> ~780 ms.
# Dist dosyasi degismez; yalniz sunulurken bolunur. Test: tools/dist_sun_test.py
DIST_BETIK = "/dist-betik.js"
_BOLUK = {}


def _dist_bol(yol):
    """(html, betik, surum). En buyuk <script> govdesi betige tasinir ve HTML'de
    ayni yerde <script src> kalir (sira ve engelleme ayni); betik yoksa None.
    Surum adreste durur: tutan istek onbellege girer, V8 derlemeyi de saklar."""
    st = os.stat(yol)
    anahtar = (st.st_mtime_ns, st.st_size)
    eski = _BOLUK.get(yol)
    if eski and eski[0] == anahtar:
        return eski[1]
    with open(yol, encoding="utf-8") as f:
        metin = f.read()
    en = max(re.finditer(r"<script>(.*?)</script>", metin, re.S),
             key=lambda m: len(m.group(1)), default=None)
    if en is None:
        sonuc = (metin.encode("utf-8"), None, None)
    else:
        betik = en.group(1).encode("utf-8")
        surum = hashlib.sha256(betik).hexdigest()[:12]
        etiket = '<script src="%s?v=%s"></script>' % (DIST_BETIK, surum)
        sonuc = ((metin[:en.start()] + etiket + metin[en.end():]).encode("utf-8"), betik, surum)
    _BOLUK[yol] = (anahtar, sonuc)
    return sonuc


class Sunucu(SimpleHTTPRequestHandler):
    """Bir sistemin src/ klasoru.

    Iki adres kendi klasorunun disina cikar:
      /dist/...        o sistemin derlenmis tek dosya surumu
      /img/seviye/...  UCUNUN ORTAK seviye gorselleri (brand/seviye/)

    Ikincisi bilincli bir istisnadir. Kademe videolari uc sistemin de
    ayni dosyasidir; uc kez kopyalamak depoyu yuz megabayta tasirdi.
    Sistemlerin birbirinden bagimsizligi bozulmaz: dosya yoksa kutlama
    banner'a duser, arayuzde hicbir sey kirilmaz.
    """

    repo = KOK

    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if clean in ("/", "/index.html"):
            dist = _guncel_dist(self.repo)
            if dist:
                return dist
        ortak = (_ortak_seviye_yolu(clean, KOK)
                 or _ortak_marka_yolu(clean, KOK))
        return ortak or _ortak_dist_yolu(clean, self.repo) or super().translate_path(path)

    def guess_type(self, path):
        # Kaynaklar UTF-8; charset bildirilmezse tarayici latin-1 varsayar
        # ve Turkce karakterler bozulur.
        ctype = super().guess_type(path)
        base = ctype.split(";", 1)[0].strip()
        if base in ("text/html", "text/css", "application/javascript",
                    "text/javascript", "application/json", "text/plain"):
            return base + "; charset=utf-8"
        return ctype

    # HESAP ve ESITLEME (sistem/hesap.py): her modul kapisinda ayni API.
    # PC'de ayni koken (http 127.0.0.1), tablette ayni koken (ev agi
    # https), telefon uygulamasindan capraz koken (yalniz uygulamanin
    # kendi kokenleri). Dosya sunumu bundan etkilenmez.
    def do_GET(self):
        if self.path.startswith("/api/hesap/"):
            return hesap.isle(self)
        if self.path.split("?", 1)[0] == "/api/ayar":
            return ayar.isle(self)
        if self.path.startswith("/api/ice"):
            return ice.isle(self)
        if self.path.startswith("/api/muzik"):
            return muzik.isle(self)
        if self.path.startswith("/api/zemin/"):
            return zemin.isle(self)
        if self.path.startswith("/api/planlama"):
            return plan_isle(self)
        clean = self.path.split("?", 1)[0].split("#", 1)[0]
        if clean in ("/", "/index.html", DIST_BETIK):
            dist = _guncel_dist(self.repo)
            if dist:
                sayfa, betik, surum = _dist_bol(dist)
                govde = betik if clean == DIST_BETIK else self._ayarli(sayfa)
                if govde is not None:
                    tur = "text/javascript" if clean == DIST_BETIK else "text/html"
                    # Yalniz surumu tutan adres saklanir; yaris aninda eski
                    # surum adresine yeni govde gittiyse saklanmaz.
                    self._kalici = clean == DIST_BETIK and self.path.endswith("?v=" + surum)
                    self.send_response(200)
                    self.send_header("Content-Type", tur + "; charset=utf-8")
                    self.send_header("Content-Length", str(len(govde)))
                    self.end_headers()
                    self.wfile.write(govde)
                    return
            elif clean != DIST_BETIK:
                return self._src_sayfa()
        return super().do_GET()

    def _ayarli(self, govde):
        """Ortak ayar yalniz bu bilgisayardan acilan sayfaya konur (sistem/ayar.py
        soz 1). Ev agindan baglanan tablet ayni Sunucu sinifiyla sunulur; ona da
        konunca kendi ayarlari her yenilemede bilgisayarinkiyle eziliyor, yazmasi
        ise reddediliyordu (2026-10-31, hata analizi)."""
        if self.client_address[0] in ("127.0.0.1", "::1"):
            return ayar.sayfaya_ekle(govde)
        return govde

    def _src_sayfa(self):
        """Kaynak (src) sayfasi da ortak ayarlarla verilir (sistem/ayar.py)."""
        yol = super().translate_path("/index.html")
        if not os.path.isfile(yol):
            return super().do_GET()
        with open(yol, "rb") as f:
            govde = self._ayarli(f.read())
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(govde)))
        self.end_headers()
        self.wfile.write(govde)

    def do_POST(self):
        if self.path.startswith("/api/hesap/"):
            return hesap.isle(self)
        if self.path.split("?", 1)[0] == "/api/ayar":
            return ayar.isle(self)
        if self.path.startswith("/api/ice"):
            return ice.isle(self)
        if self.path.startswith("/api/muzik"):
            return muzik.isle(self)
        if self.path.startswith("/api/zemin/"):
            return zemin.isle(self)
        if self.path.startswith("/api/planlama"):
            return plan_isle(self)
        return self.send_error(405)

    def do_DELETE(self):
        if self.path.startswith("/api/ice"):
            return ice.isle(self)
        if self.path.startswith("/api/muzik"):
            return muzik.isle(self)
        if self.path.startswith("/api/zemin/"):
            return zemin.isle(self)
        return self.send_error(405)

    def do_OPTIONS(self):
        if self.path.startswith("/api/hesap/"):
            return hesap.isle(self)
        return self.send_error(405)

    def end_headers(self):
        if getattr(self, "_kalici", False):
            self._kalici = False   # keep-alive: ayni isleyici sonraki istege gecer
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
            return super().end_headers()
        self.send_header("Cache-Control",
                         "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        status = str(args[1]) if len(args) > 1 else ""
        if status.startswith("2") or status.startswith("3"):
            return
        # Takvim abonelik adresi bir anahtardir: gunluge yazilmaz (hesap soz 17).
        if args and isinstance(args[0], str):
            args = (hesap.gunluk_maskele(args[0]),) + args[1:]
        super().log_message(fmt, *args)


# Giris sayfasinin gorselleri: HER SISTEMIN KENDI GUNCEL LOGOSU (uygulama
# acilisinda gorunenle ayni dosya). Kapali bir liste: URL'den yol kurulmaz.
LOGOLAR = {
    "ays": ("AYS", "src", "img", "brand", "favicon.png"),
    "spi": ("SPI", "src", "img", "brand", "favicon.png"),
    "esp": ("ESP", "src", "img", "brand", "favicon.png"),
    "hkm": ("HKM", "brand", "favicon.png"),
}

# (anahtar, kisa ad, tam ad, aciklama, port)
KARTLAR = [
    ("ays", "AYS", "Akademik Yol Sistemi", "Sınav hazırlığı: plan, deneme, kalibrasyon", 4173),
    ("spi", "SPİ", "Sağlık Performans İzleyicisi", "Uyku, beslenme, hareket, toparlanma", 4183),
    ("esp", "ESP", "Entelektüel Seviye Planlayıcı", "Dil, felsefe, müzik, diksiyon, okuma", 4193),
    ("hkm", "HKM", "Hayat Kontrol Merkezi", "İsteğe bağlı merkez: günün özeti, çapraz bulgu", HKM_PORT),
]

# Sekme ikonu: kenar cubugundaki dort renkli isaretin aynisi (SVG, gomulu).
_IKON = ("data:image/svg+xml,"
         "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E"
         "%3Crect x='3' y='3' width='12' height='12' rx='3' fill='%234F86FF'/%3E"
         "%3Ccircle cx='23' cy='9' r='6' fill='%232EC4A9'/%3E"
         "%3Crect x='5' y='19' width='9' height='9' rx='2' fill='%23F2A93B' transform='rotate(45 9.5 23.5)'/%3E"
         "%3Crect x='17' y='17' width='12' height='12' rx='3' fill='%239A86FF'/%3E%3C/svg%3E")

GIRIS_SAYFASI = """<!doctype html>
<html lang="tr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>LifeOS — Kontrol paneli</title>
<link rel="icon" href="__IKON__"/>
<link rel="stylesheet" href="/hesap.css"/>
<script src="/animasyon.js"></script>
<style>
:root{ color-scheme:light dark;
  --bg:#f5f6f8; --yuzey:#ffffff; --yuzey-2:#f0f1f4; --fg:#15171a; --fg-2:#4a4f57; --fg-3:#6b717b;
  --cizgi:#e4e6ea; --cizgi-2:#d3d6dc; --golge:0 1px 2px rgba(16,24,40,.05), 0 4px 16px rgba(16,24,40,.06);
  --ok:#1a7f5a; --ok-t:#e5f4ee; --uyari:#a4620f; --uyari-t:#fcf1e2; --kapali:#8a9099;
  --ays:#2D5BE3; --spi:#0E8C79; --esp:#C8741C; --hkm:#7453D4;
  --ays-t:#EEF2FD; --spi-t:#E7F4F1; --esp-t:#FBF2E7; --hkm-t:#F1EEFB;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
@media (prefers-color-scheme:dark){ :root{
  --bg:#121214; --yuzey:#1C1C1F; --yuzey-2:#26262A; --fg:#ECECEF; --fg-2:#ABABB3; --fg-3:#909099;
  --cizgi:#2C2C31; --cizgi-2:#3A3A40; --golge:0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.25);
  --ok:#4cc38a; --ok-t:#122a20; --uyari:#f2a93b; --uyari-t:#2a1f0f; --kapali:#6b717b;
  --ays:#4F86FF; --spi:#2EC4A9; --esp:#F2A93B; --hkm:#9A86FF;
  --ays-t:#1A1F2A; --spi-t:#18221F; --esp-t:#231E17; --hkm-t:#1F1C29; } }
*{ box-sizing:border-box; }
[hidden]{ display:none !important; }
/* Giris ekrani (brand/ortak/hesap.css): modul secimi bir kez, burada. Kartin
   degiskenleri bu sayfanin renklerine eslenir. */
.hesap-kapi, .hesap-merkez, .hesap-cip{ --surface:var(--yuzey); --surface-2:var(--yuzey-2); --text:var(--fg); --text-2:var(--fg-2);
  --text-3:var(--fg-3); --border:var(--cizgi); --kart-golge:var(--golge); --primary:var(--fg);
  --bad:#c8463b; --bad-ink:#b53a30; --ok-ink:var(--ok); --accent:#d99a1e; }
@media (prefers-color-scheme:dark){ .hesap-kapi, .hesap-merkez, .hesap-cip{ --bad:#ef6b61; --bad-ink:#ef6b61;
  --buz-isik:inset 0 1px 0 rgba(255,255,255,.09), inset 0 0 0 1px rgba(255,255,255,.055);
  --buz-golge:0 32px 72px -36px rgba(0,0,0,.6); } }
.hesap-cip:not([hidden]) + .surum{ margin-left:0; }
body{ margin:0; background:var(--bg); color:var(--fg);
  font:15px/1.55 "Segoe UI Variable Text","Segoe UI",ui-sans-serif,system-ui,-apple-system,Roboto,sans-serif;
  -webkit-font-smoothing:antialiased; }
.sarmal{ max-width:980px; margin:0 auto; padding:40px 20px 56px; }
button{ font:inherit; }
/* ---- ust ---- */
.ust{ display:flex; align-items:center; gap:14px; margin-bottom:28px; }
.isaret{ display:grid; grid-template-columns:repeat(2,11px); gap:3px; flex:none; }
.isaret b{ width:11px; height:11px; border-radius:3px; background:var(--ays); }
.isaret b:nth-child(2){ background:var(--spi); border-radius:50%; }
.isaret b:nth-child(3){ background:var(--esp); transform:rotate(45deg) scale(.8); }
.isaret b:nth-child(4){ background:var(--hkm); }
.ust h1{ margin:0; font-size:20px; font-weight:650; letter-spacing:-.01em; }
.ust h1 span{ color:var(--fg-3); font-weight:450; margin-left:6px; }
.surum{ margin-left:auto; font:12px/1 var(--mono); color:var(--fg-3); padding:7px 10px;
  border:1px solid var(--cizgi); border-radius:999px; background:var(--yuzey); white-space:nowrap; cursor:pointer; }
/* ---- guncelleme ---- */
.guncel[hidden]{ display:none; }
.guncel{ display:flex; gap:16px; align-items:flex-start; padding:18px 20px; margin-bottom:32px;
  background:var(--yuzey); border:1px solid var(--cizgi); border-radius:14px; box-shadow:var(--golge); }
.guncel__ikon{ flex:none; width:40px; height:40px; border-radius:10px; display:grid; place-items:center;
  background:var(--yuzey-2); color:var(--fg-3); }
.guncel__ikon svg{ width:20px; height:20px; }
.guncel[data-hal="ok"] .guncel__ikon{ background:var(--ok-t); color:var(--ok); }
.guncel[data-hal="var"] .guncel__ikon, .guncel[data-hal="uyari"] .guncel__ikon{ background:var(--uyari-t); color:var(--uyari); }
.guncel__govde{ flex:1; min-width:0; }
.guncel__baslik{ font-weight:650; font-size:15.5px; }
.guncel__alt{ color:var(--fg-2); font-size:13.5px; margin-top:2px; }
.guncel ul{ margin:8px 0 0; padding:0; list-style:none; font-size:13px; color:var(--fg-2); }
.guncel li{ padding:3px 0 3px 14px; position:relative; }
.guncel li::before{ content:''; position:absolute; left:2px; top:11px; width:5px; height:5px; border-radius:50%; background:var(--cizgi-2); }
.guncel__eylem{ display:flex; gap:8px; flex:none; align-self:center; flex-wrap:wrap; justify-content:flex-end; }
.dugme{ display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:36px; padding:0 16px;
  border-radius:9px; border:1px solid var(--cizgi-2); background:var(--yuzey); color:var(--fg);
  font-size:13.5px; font-weight:600; cursor:pointer; text-decoration:none; white-space:nowrap;
  transition:background .15s, border-color .15s, transform .05s; }
.dugme:hover{ background:var(--yuzey-2); }
.dugme:active{ transform:translateY(1px); }
.dugme--ana{ background:var(--fg); color:var(--bg); border-color:var(--fg); }
.dugme--ana:hover{ background:var(--fg); opacity:.9; }
.dugme:disabled{ opacity:.6; cursor:progress; }
.dugme:focus-visible, a.kart:focus-visible{ outline:2px solid var(--ays); outline-offset:2px; }
/* ---- sistemler ---- */
.bolum{ font-size:12px; font-weight:650; letter-spacing:.08em; text-transform:uppercase; color:var(--fg-3); margin:0 0 12px 2px; }
.izgara{ display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:14px; }
/* SECIM KARTI (kullanici, 2026-10-06: «daha guzel, modern, sade ve
   animasyonlu; o bolumle ilgili minik ozetler gecilsin»). Ferah, yumusak;
   ust cizgi yerine modulun renginde kosede hafif bir isik. Dokununca hafifce
   basilir, birakinca yerine oturur; ok yana kayar. */
.kart{ display:flex; flex-direction:column; padding:20px; border-radius:20px; background:var(--yuzey);
  border:1px solid var(--cizgi); box-shadow:var(--golge); color:inherit; text-decoration:none;
  position:relative; overflow:hidden; isolation:isolate; -webkit-tap-highlight-color:transparent;
  transition:transform .42s cubic-bezier(.32,.72,0,1), box-shadow .42s cubic-bezier(.32,.72,0,1), border-color .2s; }
.kart::before{ content:''; position:absolute; z-index:-1; top:-55%; right:-25%; width:70%; aspect-ratio:1; border-radius:50%;
  background:radial-gradient(closest-side, var(--renk-t), transparent); pointer-events:none; }
.kart:hover{ border-color:var(--cizgi-2); transform:translateY(-2px);
  box-shadow:0 1px 2px rgba(16,24,40,.05), 0 14px 32px -12px rgba(16,24,40,.16); }
.kart:active{ transform:scale(.985); transition-duration:.12s; }
.kart__ust{ display:flex; gap:14px; align-items:center; }
.kart__metin{ flex:1; min-width:0; }
.kart__ok{ flex:none; width:20px; height:20px; color:var(--fg-3); fill:none; stroke:currentColor; stroke-width:2;
  stroke-linecap:round; stroke-linejoin:round; transition:transform .42s cubic-bezier(.32,.72,0,1); }
.kart:hover .kart__ok{ transform:translateX(3px); }
.logo{ flex:none; width:48px; height:48px; border-radius:14px; background:var(--renk-t); display:grid; place-items:center; }
.logo img{ width:40px; height:40px; object-fit:contain; }
/* SADE (kullanıcı, 2026-10-05: «görseller profesyonel gözükmüyor; daha
   sade»): parlak 3B logo yerine LifeOS işaretinin şekli, modülün renginde
   — AYS kare, SPİ daire, ESP karo, Merkez altıgen (renk körlüğünde de
   ayrılır). */
.sekil{ display:block; width:20px; height:20px; background:var(--renk); }
.sekil--ays{ border-radius:4px; }
.sekil--spi{ border-radius:50%; }
.sekil--esp{ transform:rotate(45deg) scale(.86); border-radius:3px; }
.sekil--hkm{ clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); }
.kart__ad{ font-size:17px; font-weight:650; letter-spacing:-.01em; display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; }
.kart__ad small{ font-size:12.5px; font-weight:500; color:var(--fg-3); }
.kart__acik{ color:var(--fg-2); font-size:13.5px; margin-top:2px; }
.kart__alt{ display:flex; align-items:center; gap:10px; margin-top:auto; padding-top:14px; }
/* Minik ozet (hesap.js soz 16): Bugun'un donen maddeleri; her sayi kesinligiyle,
   sagda ne zamanin ozeti oldugu. Giden satir yukari solar, gelen asagidan. */
.kart__ozet{ display:flex; align-items:center; gap:12px; margin-top:16px; padding-top:14px; border-top:1px solid var(--cizgi);
  font-size:13px; color:var(--fg-2); }
.kart__ozet-sahne{ position:relative; flex:1; min-width:0; height:21px; overflow:hidden; }
.kart__ozet-satir{ position:absolute; inset:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  opacity:0; transform:translateY(10px);
  transition:opacity .5s cubic-bezier(.32,.72,0,1), transform .5s cubic-bezier(.32,.72,0,1); }
.kart__ozet-satir.is-giden{ transform:translateY(-10px); }
.kart__ozet-satir.is-on{ opacity:1; transform:none; }
.kart__ozet b{ font-weight:600; color:var(--fg); }
.kart__ozet i{ font-style:normal; font-size:11.5px; color:var(--fg-3); margin-left:2px; }
.kart__ozet-ne{ flex:none; font-size:12px; color:var(--fg-3); }
.durum{ display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600; color:var(--fg-3); }
.durum[hidden]{ display:none; }
.durum i{ width:8px; height:8px; border-radius:50%; background:var(--kapali); }
.durum[data-hal="acik"]{ color:var(--ok); } .durum[data-hal="acik"] i{ background:var(--ok); box-shadow:0 0 0 3px var(--ok-t); }
.port{ font:12px/1 var(--mono); color:var(--fg-3); }
.kart__alt .dugme{ margin-left:auto; min-height:32px; padding:0 13px; font-size:13px; }
/* ---- alt ---- */
.dip{ margin-top:32px; display:flex; flex-wrap:wrap; gap:8px 24px; font-size:12.5px; color:var(--fg-3); }
.dip code{ font:12px var(--mono); color:var(--fg-2); background:var(--yuzey-2); padding:2px 6px; border-radius:5px; }
@media (max-width:640px){
  .sarmal{ padding:24px 16px 40px; }
  .izgara{ grid-template-columns:1fr; }
  .guncel{ flex-wrap:wrap; }
  .guncel__eylem{ width:100%; justify-content:flex-start; }
  .surum{ display:none; }
  .ust:has(.hesap-cip:not([hidden])) h1 span{ display:none; }
}
/* TITREMEZ (hesap.js soz 15): hesap.js «giris ekrani gerekli mi» kararini
   verene dek sayfa gorunmez; giris ekranindan once bir an gorunuyordu.
   Betik yuklenemezse 1,5 sn sonra kendiliginden gorunur. */
html:not(.giris-hazir) .sarmal{ visibility:hidden; animation:giris-yedek 0s 1.5s forwards; }
@keyframes giris-yedek{ to{ visibility:visible; } }
/* Giris ekrani acikken secim sayfasi gizli: ekran saydamdan belirirken
   kartlar arkasindan goruluyordu (2026-10-06, PC acilisi: 119-191 ms'de
   8 karede kapi %0-37 opakken kartlar gorunur). Kapi cekilince kartlar
   sirayla belirir. */
html.hesap-kapi-acik .sarmal{ visibility:hidden; }
/* BELIRME: giris ekrani yokken (acilis, beta girisi, giris) once yer, sonra
   yazi; sirayla, sakin baslayarak. */
html.giris-hazir:not(.hesap-kapi-acik) :is(.ust, .guncel, .bolum, .kart){
  animation:giris-gel .62s cubic-bezier(.32,.72,0,1) both; animation-delay:calc(var(--sira, 0) * 70ms); }
html.giris-hazir:not(.hesap-kapi-acik) :is(.kart__ust, .kart__ozet, .kart__alt){
  animation:giris-yazi .5s cubic-bezier(.32,.72,0,1) both; animation-delay:calc(var(--sira, 0) * 70ms + 140ms); }
@keyframes giris-gel{ from{ opacity:0; transform:translateY(16px) scale(.985); } to{ opacity:1; transform:none; } }
@keyframes giris-yazi{ from{ opacity:0; filter:blur(3px); } to{ opacity:1; filter:none; } }
/* Azaltilmis harekette (LifeOS'un kendi ayari, animasyon.js) gecis yok;
   kendiliginden gorunme (yedek) kalir. */
@media (prefers-reduced-motion:reduce){ *{ transition:none !important; } :not(.sarmal){ animation:none !important; } }
/* SICAK ISIK (kullanici, 2026-10-27; modullerdeki cam.css ile ayni dil):
   altta sicak zemin isigi ve ince yansima cizgisi; kartin alt kenarinda o
   isigin yansimasi. Duran isik; dort sistem kapisi zemini degismez. */
html::after{ content:''; position:fixed; inset:auto 0 0 0; height:42vh; z-index:-1; pointer-events:none;
  background:radial-gradient(30% 2.4% at 50% 84%, rgba(255,236,222,.9), transparent),
    radial-gradient(55% 34% at 50% 100%, rgba(255,168,120,.5), transparent 75%); }
.kart{ box-shadow:var(--golge), inset 0 1px 0 rgba(255,255,255,.6), inset 0 -14px 26px -20px rgba(255,168,120,.32); }
/* CAM VE MANZARA (kullanici, 2026-10-28: «HKM, AYS, SPI, ESP sectigimiz
   bolumden yuklenme ekranlarina kadar zirveye tasi»; referans Liquid Glass
   Kit). Modullerle ayni dil: CC0 manzara (brand/medya/doku/doku-manzara-secim)
   uzerinde buzlu cam kartlar, pastel karoda beyaz isaret, cam hap dugmeler.
   Eski sicak zemin isigi ve yansima cizgisi kalkti (reddedilmisti). */
html::after{ content:none; }
:root{ --cam:linear-gradient(140deg, rgba(255,255,255,.66), rgba(255,255,255,.42)); --cam-kenar:rgba(255,255,255,.72);
  --cam-ust:inset 0 1px 0 rgba(255,255,255,.95), inset 0 0 0 1px rgba(255,255,255,.3);
  --cam-golge:0 1px 2px rgba(20,24,40,.06), 0 18px 40px -22px rgba(20,30,60,.38);
  --hap:rgba(255,255,255,.56); --hap-kenar:rgba(255,255,255,.85); --hale:0 1px 14px rgba(255,255,255,.8); }
@media (prefers-color-scheme:dark){ :root{ --cam:linear-gradient(140deg, rgba(255,255,255,.1), rgba(255,255,255,.05)); --cam-kenar:rgba(255,255,255,.12);
  --cam-ust:inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.05);
  --cam-golge:0 1px 2px rgba(0,0,0,.3), 0 22px 48px -26px rgba(0,0,0,.75);
  --hap:rgba(255,255,255,.08); --hap-kenar:rgba(255,255,255,.16); --hale:0 1px 14px rgba(0,0,0,.6); } }
body{ background:#dfe8f3 url("/img/marka/doku-manzara-secim.webp") center / cover no-repeat fixed; }
body::before{ content:''; position:fixed; inset:0; z-index:-1; pointer-events:none;
  background:radial-gradient(80% 60% at 20% 8%, rgba(255,255,255,.55), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,.16) 50%, rgba(255,255,255,.32)); }
@media (prefers-color-scheme:dark){ body{ background-color:#0d1220; }
  body::before{ background:linear-gradient(180deg, rgba(8,12,26,.74), rgba(8,12,26,.6) 45%, rgba(8,12,26,.82)); } }
.ust h1, .bolum, .dip{ text-shadow:var(--hale); }
.surum{ background:var(--hap); border-color:var(--hap-kenar); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); }
.guncel, .kart{ background:var(--cam); border:1px solid var(--cam-kenar); border-radius:26px; box-shadow:var(--cam-ust), var(--cam-golge);
  -webkit-backdrop-filter:blur(24px) saturate(150%); backdrop-filter:blur(24px) saturate(150%); }
.kart{ transition:transform .5s cubic-bezier(.16,1,.3,1), box-shadow .5s cubic-bezier(.16,1,.3,1); }
.kart:hover{ transform:translateY(-3px);
  box-shadow:var(--cam-ust), 0 1px 2px rgba(20,24,40,.06), 0 26px 50px -24px color-mix(in oklab, var(--renk) 50%, rgba(20,30,60,.4)); }
.kart:active{ transform:translateY(-1px) scale(.99); transition-duration:.12s; }
.kart__ozet{ border-top-color:var(--hap-kenar); }
.logo{ width:52px; height:52px; border-radius:16px;
  background:linear-gradient(160deg, color-mix(in oklab, var(--renk) 26%, #fff), color-mix(in oklab, var(--renk) 52%, #fff));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 color-mix(in oklab, var(--renk) 30%, transparent), 0 10px 20px -12px var(--renk); }
@media (prefers-color-scheme:dark){ .logo{ background:linear-gradient(160deg, color-mix(in oklab, var(--renk) 62%, #fff), var(--renk));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.45), 0 10px 22px -12px var(--renk); } }
.sekil{ background:#fff; width:22px; height:22px; filter:drop-shadow(0 1px 1.5px color-mix(in oklab, var(--renk) 70%, transparent)); }
.dugme{ background:var(--hap); border:1px solid var(--hap-kenar); border-radius:999px; box-shadow:inset 0 1px 0 rgba(255,255,255,.6), 0 4px 12px -8px rgba(20,30,60,.35);
  -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); transition:background-color .25s ease, transform .4s cubic-bezier(.16,1,.3,1); }
.dugme:hover{ background:color-mix(in oklab, var(--hap) 70%, #fff); transform:translateY(-1px); }
/* Ana düğme cam hapın üstünde renkli cam: zemini cam kuralına yenilip yazısı koyu kalıyordu (koyu temada okunmuyordu, 2026-10-29). */
.dugme--ana, .dugme--ana:hover{ background:color-mix(in oklab, var(--ays) 26%, var(--hap)); border-color:color-mix(in oklab, var(--ays) 40%, transparent); color:var(--fg); opacity:1; }
.kart__alt .dugme{ color:color-mix(in oklab, var(--renk) 82%, #000); font-weight:650; }
.kart::before{ background:radial-gradient(closest-side, color-mix(in oklab, var(--renk) 16%, transparent), transparent); }
@media (prefers-color-scheme:dark){ .kart__alt .dugme{ color:color-mix(in oklab, var(--renk) 70%, #fff); } }
/* YENI DUZEN (kullanici, 2026-10-29, cizimle: «ESP, SPI, AYS kartlari dikey
   yan yana; yukarida S kisminda surum, G kisminda guncelleme, HKM ortada;
   uzerine geldigimizde belirginlesecek»). Ust: kavisli cam serit. Alt: uc
   dikey cam kart, ortadaki biraz asagida; uzerine gelinen one cikar,
   otekiler hafifce geri cekilir. Guncelleme kutusu G'ye basinca acilir. */
.sarmal{ max-width:min(1320px, 92vw); padding-top:0; }
/* (2026-10-29, ikinci bakis: «guncelleme baska yere gelsin; LifeOS sag kisimda
   olsun, yukarida degil; HKM'nin oldugu yarim sey yukariya yapisik olsun»):
   marka sag ustte, serit ekranin ust kenarindan sarkar, guncelleme kutusu
   sol ustte yuzen kart (sayfayi itmez). */
.ust{ position:fixed; top:18px; right:26px; z-index:3; margin:0; }
.ust h1{ margin:0; font-size:clamp(18px, 1.4vw, 22px); }
.bolum{ position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
.yay{ position:relative; display:flex; align-items:center; justify-content:center; gap:10px; width:max-content; max-width:100%;
  margin:0 auto clamp(24px, 4vh, 48px); padding:clamp(12px, 1.6vh, 18px) clamp(16px, 1.6vw, 26px) clamp(16px, 2.2vh, 24px);
  border-top:0; border-radius:0 0 140px 140px / 0 0 52px 52px; font-size:clamp(13px, .95vw, 15px);
  background:var(--cam); border:1px solid var(--cam-kenar); box-shadow:var(--cam-ust), var(--cam-golge);
  -webkit-backdrop-filter:blur(24px) saturate(150%); backdrop-filter:blur(24px) saturate(150%); }
.yay__uc{ position:relative; display:flex; align-items:center; gap:8px; min-height:44px; padding:0 14px 0 8px; border-radius:999px;
  border:0; background:transparent; color:var(--fg-2); font:inherit; font-size:13px; font-weight:550; cursor:pointer;
  transition:background .2s, color .2s; }
.yay__uc:hover{ background:var(--hap); color:var(--fg); }
.yay__uc b{ width:30px; height:30px; display:grid; place-items:center; border-radius:50%; background:var(--hap);
  box-shadow:inset 0 0 0 1px var(--hap-kenar); font-size:13px; font-weight:700; color:var(--fg); }
.yay__s span{ font:12px var(--mono); }
.yay__g[aria-expanded="true"]{ background:var(--hap); color:var(--fg); }
.yay__nokta{ position:absolute; top:7px; left:31px; width:8px; height:8px; border-radius:50%; background:var(--uyari); display:none; }
.yay__g[data-hal="var"] .yay__nokta, .yay__g[data-hal="uyari"] .yay__nokta{ display:block; }
.yay .kart--hkm{ flex-direction:row; align-items:center; gap:12px; padding:8px 10px 8px 8px; border-radius:999px; min-width:0; }
.yay .kart--hkm::before{ display:none; }
.yay .kart--hkm .kart__ust{ gap:10px; }
.yay .kart--hkm .logo{ width:36px; height:36px; border-radius:50%; }
.yay .kart--hkm .sekil{ width:15px; height:15px; }
.yay .kart--hkm .kart__ad{ font-size:14.5px; }
.yay .kart--hkm .kart__ad small, .yay .kart--hkm .kart__acik{ display:none; }
.yay .kart--hkm .kart__alt{ margin:0; padding:0; gap:10px; }
.yay .kart--hkm .hkm-eski{ display:none; }
.yay .kart--hkm:hover{ transform:translateY(-1px); }
.guncel{ position:fixed; z-index:4; bottom:20px; left:20px; width:min(440px, calc(100vw - 40px)); margin:0; flex-wrap:wrap; }
.guncel .guncel__eylem{ width:100%; justify-content:flex-end; }
.sarmal{ min-height:100vh; display:flex; flex-direction:column; }
.izgara{ margin-block:auto; }
/* ORANLI (2026-10-29: «daha oranli yap»): kart, aralik, simge ve ortadaki
   kayma ekranin boyuyla olceklenir; buyuk ekranda kucuk kalmaz. */
.izgara{ display:flex; justify-content:center; align-items:flex-start; gap:clamp(18px, 2.4vw, 40px); }
.izgara .kart{ flex:0 1 clamp(250px, 23vw, 360px); min-height:clamp(340px, 46vh, 500px); padding:clamp(24px, 2.6vw, 38px) clamp(20px, 2vw, 30px) clamp(20px, 2vw, 28px);
  border-radius:clamp(26px, 2.4vw, 36px); text-align:center; }
.izgara .kart:nth-child(2){ margin-top:clamp(28px, 6vh, 64px); }
.izgara .kart__ust{ flex-direction:column; gap:16px; }
.izgara .logo{ width:clamp(64px, 6vw, 92px); height:clamp(64px, 6vw, 92px); border-radius:clamp(20px, 1.8vw, 28px); }
.izgara .sekil{ width:clamp(26px, 2.3vw, 36px); height:clamp(26px, 2.3vw, 36px); }
.izgara .kart__ad{ justify-content:center; flex-direction:column; align-items:center; gap:2px; font-size:clamp(21px, 1.8vw, 28px); }
.izgara .kart__acik{ font-size:clamp(13.5px, 1vw, 15.5px); }
.izgara .kart__acik{ margin-top:8px; text-wrap:balance; }
.izgara .kart__ozet{ text-align:left; }
.izgara .kart__alt{ justify-content:center; }
.izgara .kart__alt .dugme{ margin-left:0; }
@media (hover:hover){
  .izgara .kart{ transition:transform .5s cubic-bezier(.16,1,.3,1), box-shadow .5s cubic-bezier(.16,1,.3,1), opacity .4s ease, filter .4s ease; }
  .izgara:has(.kart:hover) .kart:not(:hover){ opacity:.7; filter:saturate(.8); transform:scale(.975); }
  .izgara .kart:hover{ transform:translateY(-8px) scale(1.035); }
  .izgara .kart:nth-child(2):hover{ transform:translateY(-8px) scale(1.035); }
}
@media (max-width:760px){
  .izgara{ flex-direction:column; align-items:stretch; }
  .izgara .kart{ flex:none; min-height:0; text-align:left; }
  .izgara .kart:nth-child(2){ margin-top:0; }
  .izgara .kart__ust{ flex-direction:row; }
  .izgara .logo{ width:52px; height:52px; border-radius:16px; }
  .izgara .kart__ad{ align-items:flex-start; font-size:17px; }
  .yay{ border-radius:0 0 22px 22px; }
  .ust{ position:static; justify-content:center; margin:16px 0; }
}
/* KENDI ARKA PLANIN (Ayarlar › Görünüm; sistem/zemin.py): fotoğraf ya da video;
   koyu temada gece yuvasi, yoksa fotograf karartilmaz: derin renk zemin. */
body{ min-height:100vh; }
.dip{ justify-content:center; text-align:center; }
@media (prefers-color-scheme:dark){ html:not([data-kendi]) body{ background-image:none;
  background:radial-gradient(60% 50% at 18% 0%, rgba(80,110,220,.22), transparent 70%), radial-gradient(60% 60% at 100% 100%, rgba(120,90,220,.16), transparent 70%), linear-gradient(175deg, #10162a, #090c16);
  background-attachment:fixed; }
  html:not([data-kendi]) body::before{ background:none; } }
html[data-kendi="foto"] body{ background-image:var(--kendi); }
video.giris-video{ position:fixed; inset:0; width:100%; height:100%; object-fit:cover; z-index:-2; pointer-events:none; }
/* GIRIS AYARLARI (kullanici, 2026-10-30: «uc kartin durdugu yerde de ayarlar
   olsun, o kismi da ayarlayabilelim; karmasik yapma»). Sagdan acilan sade
   bir levha: tema, acilinca, muzik, arka plan. Tema ve arka plan sistem
   ayaridir (sistem/ayar.py): modullerle ayni. */
.ust__ayar{ width:36px; height:36px; display:grid; place-items:center; padding:0; border:0; border-radius:50%; cursor:pointer;
  background:var(--cam, rgba(255,255,255,.7)); color:var(--fg); box-shadow:inset 0 0 0 1px var(--cam-kenar, var(--cizgi)); }
.ust__ayar svg, .gayar svg{ width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
.ust__ayar:focus-visible, .gayar button:focus-visible, .gayar select:focus-visible{ outline:2px solid var(--ays); outline-offset:2px; }
.gayar{ position:fixed; z-index:20; top:12px; right:12px; bottom:12px; width:min(380px, calc(100vw - 24px)); overflow:auto;
  padding:18px 18px 22px; border-radius:20px; background:var(--yuzey); color:var(--fg); box-shadow:0 20px 60px -20px rgba(10,14,30,.45), inset 0 0 0 1px var(--cizgi); }
.gayar__bas{ display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
.gayar__bas b{ font-size:17px; }
.gayar__kapat{ width:32px; height:32px; display:grid; place-items:center; border:0; border-radius:50%; background:var(--yuzey-2); color:var(--fg); cursor:pointer; }
.gayar__not{ margin:0 0 14px; font-size:12.5px; line-height:1.45; color:var(--fg-3); }
.gayar__bolum{ display:grid; gap:8px; padding:14px 0; border-top:1px solid var(--cizgi); }
.gayar__bolum > b{ font-size:13.5px; }
.gayar__bolum > small{ font-size:12px; color:var(--fg-3); line-height:1.4; }
.gayar__seg{ display:flex; gap:3px; padding:3px; border-radius:11px; background:var(--yuzey-2); }
.gayar__seg button{ flex:1; min-height:30px; padding:0 8px; border:0; border-radius:8px; background:transparent; color:var(--fg-2); font:inherit; font-size:12.5px; cursor:pointer; }
.gayar__seg button.is-on{ background:var(--yuzey); color:var(--fg); font-weight:600; box-shadow:0 1px 2px rgba(0,0,0,.08); }
.gayar select{ height:34px; padding:0 10px; border-radius:10px; border:1px solid var(--cizgi-2); background:var(--yuzey); color:var(--fg); font:inherit; font-size:13px; }
.gayar__satir{ display:flex; gap:8px; flex-wrap:wrap; }
.gayar__dugme{ display:inline-flex; align-items:center; gap:6px; min-height:32px; padding:0 12px; border:0; border-radius:10px; background:var(--yuzey-2); color:var(--fg); font:inherit; font-size:12.5px; cursor:pointer; }
.gayar__durum{ font-size:12px; color:var(--fg-2); min-height:1em; }
.gacilis{ position:fixed; z-index:15; left:50%; bottom:24px; transform:translateX(-50%); display:flex; align-items:center; gap:12px;
  padding:10px 10px 10px 16px; border-radius:999px; background:var(--yuzey); color:var(--fg); box-shadow:0 10px 30px -12px rgba(10,14,30,.4), inset 0 0 0 1px var(--cizgi); font-size:13.5px; }
@media (prefers-color-scheme:dark){ .gayar, .gacilis{ background:#1b1e26; } .gayar__seg button.is-on{ background:#2a2e38; } .gayar select{ background:#1b1e26; } }
/* SADE GIRIS (kullanici, 2026-10-30: «uc kartin oldugu yerde tasarim cok
   kalabalik oldu; oran-orantiyi ve minimalistligi sagla»). Kartlar ayni
   hizada ve ayni boyda (ortadaki kayma yok); kartta logo, ad ve tek satir;
   tam ad ve «Ac» yazisi yok (kartin tamami baglanti); durum yalniz kosede
   bir nokta (yazisi ekran okuyucuda). Ust serit ince, marka yalniz LifeOS,
   alt yazi yok. */
.izgara{ align-items:stretch; gap:clamp(14px, 1.8vw, 28px); }
.izgara .kart{ position:relative; flex:0 1 clamp(210px, 18vw, 290px); min-height:clamp(240px, 34vh, 360px);
  padding:clamp(26px, 2.4vw, 36px) clamp(18px, 1.8vw, 26px); justify-content:center; }
.izgara .kart:nth-child(2){ margin-top:0; }
.izgara .kart__ust{ gap:14px; }
.izgara .logo{ width:clamp(56px, 4.6vw, 76px); height:clamp(56px, 4.6vw, 76px); border-radius:clamp(18px, 1.5vw, 24px); }
.izgara .sekil{ width:clamp(22px, 1.9vw, 30px); height:clamp(22px, 1.9vw, 30px); }
.izgara .kart__ad{ font-size:clamp(20px, 1.6vw, 26px); letter-spacing:-.01em; }
.izgara .kart__ad small{ display:none; }
.izgara .kart__acik{ margin-top:2px; font-size:clamp(12.5px, .9vw, 14px); color:var(--fg-3); }
.izgara .kart__alt{ position:absolute; top:14px; right:14px; margin:0; padding:0; border:0; }
.izgara .kart__alt .dugme{ display:none; }
.izgara .kart__alt .durum{ padding:0; background:none; }
.izgara .kart__alt .durum > span{ position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
@media (hover:hover){ .izgara .kart:nth-child(2):hover{ transform:translateY(-6px) scale(1.025); } .izgara .kart:hover{ transform:translateY(-6px) scale(1.025); } }
.ust h1 span{ display:none; }
.yay{ gap:4px; padding:6px 10px 10px; margin-bottom:clamp(20px, 3vh, 36px); }
.yay__uc{ min-height:38px; font-size:12.5px; }
.yay__uc b{ width:26px; height:26px; font-size:12px; }
.yay__g > span, .yay__s > span{ position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
.yay__uc{ padding:0 6px; }
.dip{ display:none; }
@media (max-width:760px){ .izgara .kart{ min-height:0; } .izgara .kart__alt{ top:50%; transform:translateY(-50%); } }
</style></head><body>
<main class="sarmal">
  <header class="ust" style="--sira:0">
    <span class="isaret" aria-hidden="true"><b></b><b></b><b></b><b></b></span>
    <h1>LifeOS<span>Kontrol paneli</span></h1>
    <button type="button" class="hesap-cip" data-hesap-cip hidden></button>
    <button type="button" class="ust__ayar" id="ayar-ac" aria-label="Giriş ayarları" aria-haspopup="dialog" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg></button>
  </header>
  __YAY__

  <section class="guncel" id="guncel" data-hal="bekle" aria-live="polite" aria-label="Güncelleme" style="--sira:1" hidden>
    <div class="guncel__ikon" id="guncel-ikon"></div>
    <div class="guncel__govde">
      <div class="guncel__baslik" id="guncel-baslik">Güncelleme kontrol ediliyor…</div>
      <div class="guncel__alt" id="guncel-alt"></div>
      <ul id="guncel-liste" hidden></ul>
    </div>
    <div class="guncel__eylem">
      <button type="button" class="dugme" id="guncel-bak" hidden>Yeniden kontrol et</button>
      <button type="button" class="dugme dugme--ana" id="guncel-dugme" hidden>Güncelle</button>
    </div>
  </section>

  <h2 class="bolum" style="--sira:1">Sistemler</h2>
  <div class="izgara">
  __KARTLAR__
  </div>

  <footer class="dip">
    <span>Verin bu bilgisayarda kalır; güncelleme ona dokunmaz.</span>
  </footer>
</main>
<script>
(function(){
  /* Kendi arka planin: koyu temada gece yuvasi, acikta gunduz; yoksa varsayilan.
     Sistem ayarlari (sistem/ayar.py) varsa onlara uyar: tema secimi ve
     modullerde secilen yuva (Gece: Renk / Gunduzun / Kendi). */
  try{
    var A = window.__LIFEOS_AYAR__ || {};
    var tema = A['lifeos.tema.secim'];
    var gece = tema === 'dark' || (tema !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    var yuva = gece ? 'gece' : 'gunduz';
    if('lifeos.manzara' in A || 'lifeos.manzara.gece' in A){
      var gm = A['lifeos.manzara'] || 'acik', gg = A['lifeos.manzara.gece'] || 'renk';
      yuva = !gece ? (gm === 'kendi' ? 'gunduz' : '') : gg === 'kendi' ? 'gece' : (gg === 'ayni' && gm === 'kendi') ? 'gunduz' : '';
    }
    if(!yuva) throw 0;
    var adres = '/api/zemin/' + yuva + (A['lifeos.manzara.surum'] ? '?v=' + A['lifeos.manzara.surum'] : '');
    var iptal = new AbortController();
    fetch(adres, { signal:iptal.signal, cache:'no-store' }).then(function(r){
      if(!r.ok) return;
      var tur = (r.headers.get('Content-Type') || '').split(';')[0];
      iptal.abort();
      var kok = document.documentElement;
      if(/^image[/]/.test(tur)){ kok.style.setProperty('--kendi', 'url("' + adres + '")'); kok.setAttribute('data-kendi', 'foto'); }
      else if(/^video[/]/.test(tur)){
        var v = document.createElement('video');
        v.className = 'giris-video'; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
        v.setAttribute('aria-hidden', 'true'); v.src = adres;
        /* Videonun kendi sesi (Ayarlar › Arka plan videosu): tarayici izin vermezse ilk dokunusta. */
        try{
          var va = JSON.parse(A['lifeos.zemin.video'] || '{}');
          if(va.hiz) v.playbackRate = va.hiz;
          if(va.ses === true){
            v.volume = Math.max(0, Math.min(1, typeof va.duzey === 'number' ? va.duzey : .6)); v.muted = false;
            v.play().catch(function(){ v.muted = true; v.play().catch(function(){});
              document.addEventListener('pointerdown', function(){ v.muted = false; }, { once:true, capture:true }); });
          }
          if(va.bas || va.bit) v.addEventListener('timeupdate', function(){ if((va.bit && v.currentTime >= va.bit) || (va.bas && v.currentTime < va.bas - .3)) v.currentTime = va.bas || 0; });
        }catch(e){}
        document.body.insertBefore(v, document.body.firstChild);
        kok.setAttribute('data-kendi', 'video');
      }
    }).catch(function(){});
  }catch(e){}
})();
(function(){
  /* GIRIS AYARLARI ve ACILIS MUZIGI (kullanici, 2026-10-30). Muzik betigi
     (brand/ortak/muzik.js) burada da calisir: acilis muzigi modulu secmeden
     baslar; buradan acilan modulde ikinci kez calmaz. */
  var ac = document.getElementById('ayar-ac');
  if(!ac) return;
  ac.hidden = false;
  var mz = document.createElement('script'); mz.src = '/muzik.js'; document.body.appendChild(mz);
  var A = window.__LIFEOS_AYAR__ || {};
  var al = function(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } };
  var koy = function(k, v){ try{ if(v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} };
  var kac = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); };
  var AD = { ays:'AYS', spi:'SPİ', esp:'ESP' };
  /* Son acilan modul ve «Acilinca: son modul» (bu sayfanin kendi tercihi). */
  document.querySelectorAll('.kart[data-modul]').forEach(function(k){
    if(k.getAttribute('data-modul') !== 'hkm') k.addEventListener('click', function(){ koy('lifeos.giris.son', k.getAttribute('data-modul')); });
  });
  var son = al('lifeos.giris.son');
  if(al('lifeos.giris.ac') === 'son' && AD[son] && !document.referrer && location.search.indexOf('sec') < 0){
    var kart = document.querySelector('.kart[data-modul="' + son + '"]');
    if(kart){
      var bant = document.createElement('div');
      bant.className = 'gacilis'; bant.setAttribute('role', 'status');
      bant.innerHTML = '<span>' + AD[son] + ' açılıyor…</span><button type="button" class="gayar__dugme">Vazgeç</button>';
      document.body.appendChild(bant);
      var zaman = setTimeout(function(){ bant.remove(); kart.click(); }, 1800);
      bant.querySelector('button').addEventListener('click', function(){ clearTimeout(zaman); bant.remove(); });
    }
  }
  function post(yol, govde, baslik){
    return fetch(yol, { method:'POST', headers:{ 'Content-Type':'application/json', 'X-LifeOS':baslik }, body:JSON.stringify(govde) }).then(function(r){ return r.json(); });
  }
  function seg(ad, liste, simdi, veri){
    return '<div class="gayar__seg" role="group" aria-label="' + ad + '">' + liste.map(function(x){
      var on = String(x[0]) === String(simdi);
      return '<button type="button" class="' + (on ? 'is-on' : '') + '" aria-pressed="' + on + '" ' + veri + '="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  }
  var panel = null, muzik = null, durum = '';
  function ciz(){
    var tema = A['lifeos.tema.secim'] || 'system', m = muzik || { parcalar:[], acilis:{ ne:'kapali' }, arka:{ acik:false } };
    var parcalar = m.parcalar || [];
    panel.innerHTML = '<div class="gayar__bas"><b>Ayarlar</b><button type="button" class="gayar__kapat" data-g="kapat" aria-label="Kapat">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'
      + '<p class="gayar__not">Tema, arka plan ve müzik sistem ayarıdır: AYS, SPİ ve ESP’de de aynı. Öbür her şey modüllerin Ayarlar’ında.</p>'
      + '<div class="gayar__bolum"><b>Tema</b>' + seg('Tema', [['system', 'Sistem'], ['light', 'Açık'], ['dark', 'Koyu']], tema, 'data-g-tema') + '</div>'
      + '<div class="gayar__bolum"><b>Açılınca</b>' + seg('Açılınca', [['sec', 'Bu sayfa'], ['son', 'Son açtığım modül']], al('lifeos.giris.ac') || 'sec', 'data-g-acilis')
      + '<small>' + (AD[son] ? 'Son açtığın: ' + AD[son] + '. ' : '') + 'Son modül seçiliyse LifeOS açılınca iki saniye içinde ona geçer; «Vazgeç» ile burada kalırsın.</small></div>'
      + '<div class="gayar__bolum"><b>Açılış müziği</b>'
      + (parcalar.length ? seg('Açılış müziği', [['kapali', 'Kapalı'], ['her', 'Her açılışta'], ['gunde', 'Günde bir']], m.acilis.ne, 'data-g-ne')
          + '<select data-g-parca aria-label="Açılış parçası"><option value="">Parça seç</option>' + parcalar.map(function(p){ return '<option value="' + kac(p.id) + '"' + (m.acilis.id === p.id ? ' selected' : '') + '>' + kac(p.ad) + '</option>'; }).join('') + '</select>'
          + '<small>Kesit ve ses: bir modülde Ayarlar › Ses ve müzik.</small>'
        : '<small>Henüz parça yok. Bir modülde Ayarlar › Ses ve müzik › Müzik ekle.</small>') + '</div>'
      + (parcalar.length ? '<div class="gayar__bolum"><b>Arka plan müziği</b>' + seg('Arka plan müziği', [['false', 'Kapalı'], ['true', 'Açık']], String(!!m.arka.acik), 'data-g-arka') + '</div>' : '')
      + '<div class="gayar__bolum"><b>Arka plan</b><small>Fotoğraf ya da video (en çok 600 MB). Gündüz açık temada, gece koyu temada görünür.</small>'
      + '<div class="gayar__satir"><label class="gayar__dugme">Gündüz için seç<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/x-m4v,.mov,.m4v" data-g-dosya="gunduz" hidden></label>'
      + '<label class="gayar__dugme">Gece için seç<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/x-m4v,.mov,.m4v" data-g-dosya="gece" hidden></label></div>'
      + '<span class="gayar__durum" role="status">' + kac(durum) + '</span></div>';
  }
  function muzikOku(){ return fetch('/api/muzik', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(v){ muzik = v; ciz(); }).catch(function(){}); }
  function acKapa(acik){
    if(acik && !panel){
      panel = document.createElement('div');
      panel.className = 'gayar'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Giriş ayarları');
      document.body.appendChild(panel);
      ciz(); muzikOku();
      panel.addEventListener('click', tikla);
      panel.addEventListener('change', degisti);
    }
    if(panel) panel.hidden = !acik;
    ac.setAttribute('aria-expanded', acik ? 'true' : 'false');
    if(acik){ var b = panel.querySelector('button'); if(b) b.focus(); } else ac.focus();
  }
  ac.addEventListener('click', function(){ acKapa(!panel || panel.hidden); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && panel && !panel.hidden) acKapa(false); });
  function ayarYaz(degisen){ Object.keys(degisen).forEach(function(k){ if(degisen[k] == null) delete A[k]; else A[k] = degisen[k]; koy(k, degisen[k]); });
    return post('/api/ayar', { ayar:degisen }, 'ayar'); }
  function muzikYaz(degisen){
    if(!muzik) return;
    var v = { listeler:muzik.listeler, acilis:muzik.acilis, arka:muzik.arka };
    Object.keys(degisen).forEach(function(k){ v[k] = Object.assign({}, v[k], degisen[k]); });
    post('/api/muzik/ayar', v, 'muzik').then(function(x){ if(x && x.parcalar){ muzik = x; ciz(); } });
  }
  function tikla(e){
    var t = e.target.closest('button');
    if(!t) return;
    if(t.getAttribute('data-g') === 'kapat') return acKapa(false);
    if(t.hasAttribute('data-g-tema')) return ayarYaz({ 'lifeos.tema.secim':t.getAttribute('data-g-tema') }).then(function(){ location.reload(); });
    if(t.hasAttribute('data-g-acilis')){ koy('lifeos.giris.ac', t.getAttribute('data-g-acilis') === 'son' ? 'son' : null); return ciz(); }
    if(t.hasAttribute('data-g-ne')) return muzikYaz({ acilis:{ ne:t.getAttribute('data-g-ne') } });
    if(t.hasAttribute('data-g-arka')) return muzikYaz({ arka:{ acik:t.getAttribute('data-g-arka') === 'true' } });
  }
  function degisti(e){
    var t = e.target;
    if(t.hasAttribute('data-g-parca')) return muzikYaz({ acilis:{ id:t.value || null, ne:t.value ? (muzik.acilis.ne === 'kapali' ? 'her' : muzik.acilis.ne) : 'kapali' } });
    if(t.hasAttribute('data-g-dosya') && t.files && t.files[0]){
      var yuva = t.getAttribute('data-g-dosya'), f = t.files[0], tur = f.type || '';
      durum = /^video/.test(tur) ? 'Video yükleniyor… büyük dosya biraz sürer.' : 'Yükleniyor…'; ciz();
      fetch('/api/zemin/' + yuva, { method:'POST', headers:{ 'Content-Type':tur, 'X-LifeOS':'zemin' }, body:f }).then(function(r){
        if(!r.ok) return r.text().then(function(x){ throw new Error(x || 'Yüklenemedi.'); });
        var d = { 'lifeos.manzara.surum':String(Date.now()) };
        d['lifeos.manzara.tur.' + yuva] = /^video/.test(tur) ? 'video' : 'foto';
        if(yuva === 'gece') d['lifeos.manzara.gece'] = 'kendi'; else { d['lifeos.manzara'] = 'kendi'; if(!A['lifeos.manzara.gece']) d['lifeos.manzara.gece'] = 'ayni'; }
        return ayarYaz(d).then(function(){ location.reload(); });
      }).catch(function(x){ durum = String(x && x.message || 'Yüklenemedi.').slice(0, 160); ciz(); });
    }
  }
})();
(function(){
  var IKON = {
    bekle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
    ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    var:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>',
    uyari:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 8v5"/><path d="M12 16.5v.5"/><circle cx="12" cy="12" r="9"/></svg>'
  };
  var $ = function(id){ return document.getElementById(id); };
  var kutu = $('guncel'), baslik = $('guncel-baslik'), alt = $('guncel-alt'), liste = $('guncel-liste'),
      dugme = $('guncel-dugme'), bak = $('guncel-bak');
  var sonraki = null;     // ana dugmenin yapacagi is
  /* Guncel sistemde kutu surum etiketine katlanir (2026-10-27); etiket yeniden kontrol eder. */
  var surumEt = $('surum'), surumYazi = $('surum-metin'), surumMetni = surumYazi.textContent;
  var yayG = $('yay-g');
  function kutuAc(ac){ kutu.hidden = !ac; if(yayG) yayG.setAttribute('aria-expanded', ac ? 'true' : 'false'); }
  surumEt.addEventListener('click', function(){ kutuAc(true); kontrol(true); });
  if(yayG) yayG.addEventListener('click', function(){ kutuAc(kutu.hidden); });
  function post(yol){
    return fetch(yol, { method:'POST', headers:{ 'X-LifeOS':'guncelle' } })
      .then(function(r){ return r.json(); });
  }
  function hal(h, b, a, satirlar){
    if(yayG) yayG.setAttribute('data-hal', h);
    kutu.setAttribute('data-hal', h); $('guncel-ikon').innerHTML = IKON[h] || IKON.bekle;
    baslik.textContent = b; alt.textContent = a || '';
    liste.innerHTML = ''; liste.hidden = !(satirlar && satirlar.length);
    (satirlar || []).slice(0, 5).forEach(function(s){ var li = document.createElement('li'); li.textContent = s; liste.appendChild(li); });
  }
  function ana(etiket, is){ sonraki = is; dugme.textContent = etiket; dugme.hidden = !is; dugme.disabled = false; }
  function ciz(d){
    bak.hidden = false;
    if(d.durum === 'git-yok'){ hal('uyari', 'Güncelleme için git gerekli', d.mesaj); return ana('', null); }
    if(d.durum === 'git-degil'){
      hal('var', 'Bu klasör zip ile indirilmiş', 'Güncelle, klasörü GitHub\\'daki sürüme bağlar ve en yenisini kurar. Verin korunur.');
      return ana('Bağla ve güncelle', guncelle);
    }
    if(d.durum !== 'ok'){ hal('uyari', 'Güncelleme durumu okunamadı', d.mesaj || ''); return ana('', null); }
    if(d.geride > 0 && d.yedeklenebilir){
      hal('var', d.geride + ' yenilik var', 'Bu klasörde GitHub’da olmayan ' + d.ileride + ' kayıt var; ileri sarılamıyor. '
        + 'Önce onlar bir yedek dala konur, sonra en yeni sürüm kurulur. Hiçbir kayıt silinmez; verin korunur.', d.yeni);
      return ana('Yedekle ve güncelle', function(){ guncelle(true); });
    }
    if(d.geride > 0){
      hal('var', d.geride + ' yenilik var', 'İndirmek bir dakikadan kısa sürer; verin korunur.', d.yeni);
      return ana('Güncelle', guncelle);
    }
    hal('ok', 'Sistem güncel', d.ag ? 'En yeni sürümü kullanıyorsun.' : 'GitHub\\'a ulaşılamadı; son bilinen duruma göre.');
    ana('', null);
    if(d.ag){ kutuAc(false); surumYazi.textContent = surumMetni + ' · güncel'; }
  }
  function kontrol(taze){
    surumYazi.textContent = surumMetni;
    hal('bekle', 'Güncelleme kontrol ediliyor…', ''); bak.hidden = true; ana('', null);
    fetch('/api/guncelleme' + (taze ? '?taze=1' : '')).then(function(r){ return r.json(); }).then(ciz)
      .catch(function(){ hal('uyari', 'Güncelleme durumu okunamadı', ''); bak.hidden = false; });
  }
  function guncelle(yedekle){
    dugme.disabled = true; dugme.textContent = 'İndiriliyor…'; bak.hidden = true;
    post('/api/guncelle' + (yedekle === true ? '?yedekle=1' : '')).then(function(s){
      if(s.durum === 'guncellendi'){
        /* Sunucu dosyasi degistiyse yeniden baslatma kendiliginden (2026-10-29):
           dugmeye basilmayinca sunucu yarim gun eski kodla calismisti. */
        if(s.yeniden_baslat){
          hal('ok', s.mesaj || 'Güncellendi', 'Yeni sürüm için sistem yeniden başlatılıyor…', s.yeni);
          return yeniden();
        }
        hal('ok', s.mesaj || 'Güncellendi', 'Açık sayfaları yenile.', s.yeni);
        return ana('Sayfayı yenile', function(){ location.reload(); });
      }
      if(s.durum === 'guncel'){ hal('ok', 'Sistem güncel', ''); return ana('', null); }
      hal('uyari', 'Güncelleme yapılmadı', s.mesaj || ''); bak.hidden = false;
      if(s.yedeklenebilir) return ana('Yedekle ve güncelle', function(){ guncelle(true); });
      ana('', null);
    }).catch(function(){ hal('uyari', 'Güncelleme isteği gönderilemedi', ''); ana('Yeniden dene', guncelle); });
  }
  function yeniden(){
    dugme.disabled = true; dugme.textContent = 'Yeniden başlatılıyor…';
    post('/api/yeniden').then(function(){
      var bitis = Date.now() + 60000;
      (function bekle(){
        setTimeout(function(){
          fetch('/api/durum', { cache:'no-store' }).then(function(r){ if(r.ok) location.reload(); else throw 0; })
            .catch(function(){ if(Date.now() < bitis) bekle(); else hal('uyari', 'Sistem geri gelmedi', 'Klasördeki BASLAT.bat dosyasını çift tıkla.'); });
        }, 2500);
      })();
    }).catch(function(){ hal('uyari', 'Yeniden başlatılamadı', 'Klasördeki GUNCELLE.bat dosyasını çift tıkla.'); });
  }
  dugme.addEventListener('click', function(){ if(sonraki) sonraki(); });
  bak.addEventListener('click', function(){ kontrol(true); });
  kontrol(false);

  /* Durum isigi. Uc sistem bu sayfayla ayni surecte: sayfa geldiyse onlar da
     ayaktadir ve no-cors yoklamasi her HTTP cevabinda (503 dahil) cozulur.
     Bu yuzden modul durumu yalniz ag hatasinda («Kapalı») gorunur; HKM'yi
     sunucu yoklar. */
  function yak(kart, acik){
    var d = kart.querySelector('.durum');
    d.hidden = false;
    d.setAttribute('data-hal', acik ? 'acik' : 'kapali');
    d.lastChild.textContent = acik ? 'Çalışıyor' : 'Kapalı';
  }
  document.querySelectorAll('.kart[data-yokla]').forEach(function(k){
    fetch(k.getAttribute('data-yokla'), { mode:'no-cors' }).catch(function(){ yak(k, false); });
  });
  var hkm = document.querySelector('.kart[data-hkm]');
  var hkmDugme = hkm.querySelector('.dugme');
  function hkmCiz(acik, eski){
    yak(hkm, acik);
    hkmDugme.textContent = acik ? (eski ? 'Yeniden başlat' : 'Aç') : 'Başlat';
    hkmDugme.disabled = false;
    hkm.dataset.eski = eski ? '1' : '';
    var not = hkm.querySelector('.hkm-eski');
    if(eski && !not){ not = document.createElement('small'); not.className = 'hkm-eski'; not.textContent = 'HKM eski sürümle çalışıyor; yeni kod için yeniden başlat.'; hkm.appendChild(not); }
    if(!eski && not) not.remove();
  }
  fetch('/api/durum').then(function(r){ return r.json(); }).then(function(d){ hkmCiz(!!d.hkm, !!d.hkm_eski); }).catch(function(){ hkmCiz(false); });
  hkm.addEventListener('click', function(e){
    e.preventDefault();
    if(hkmDugme.disabled) return;
    /* Sekme tiklamayla ayni anda acilir (acilir pencere engeline takilmaz);
       HKM hazir olunca adrese gider. Eslesme penceresi acildigi icin
       anahtar sorulmaz. */
    if(hkm.dataset.eski === '1'){
      hkmDugme.disabled = true; hkmDugme.textContent = 'Yeniden başlatılıyor…';
      post('/api/hkm/yeniden').then(function(){ hkmCiz(true, false); }).catch(function(){ hkmCiz(true, true); });
      return;
    }
    var sekme = window.open('', '_blank');
    hkmDugme.disabled = true; hkmDugme.textContent = 'Açılıyor…';
    post('/api/hkm').then(function(s){
      hkmCiz(!!s.ok);
      /* Gecis (animasyon.js): Merkez'in yuzu yeni sekmede yumusakca belirir. */
      if(s.ok){ try{ document.cookie = 'lifeos_gecis=hkm.' + Date.now() + '; Path=/; Max-Age=15; SameSite=Strict'; }catch(e){} }
      if(s.ok){ if(sekme) sekme.location = s.adres; else location.href = s.adres; }
      else { if(sekme) sekme.close(); hkm.querySelector('.kart__acik').textContent = s.mesaj || 'HKM açılamadı.'; }
    }).catch(function(){ if(sekme) sekme.close(); hkmCiz(false); });
  });
})();
</script>
<script src="/qr.js"></script>
<script src="/hesap.js" data-giris></script>
</body></html>
"""


def _kac(t):
    return (str(t).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


# Telefonda kartin sagindaki ok («Ac» dugmesi yerine; kartin tamami baglantidir).
_OK = ('<svg class="kart__ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6.5L15 12l-5.5 5.5"/></svg>')


def giris_html(telefon=False, tema=None):
    """Giris sayfasi. telefon=True: iPhone uygulamasinin acilis sayfasi
    (uygulama/ios/hazirla.py derlemede uretir) — ayni stil ve kartlar; HKM
    karti, guncelleme kutusu ve bilgisayarin API'lerine giden betik yok
    (telefonda ikisi de yok; moduller HKM'siz calisir, AGENTS §1.4)."""
    kartlar = []
    hkm_kart = ""
    sira = 2
    # Kullanicinin cizimi (2026-10-29): ESP · SPI · AYS yan yana dikey kartlar,
    # HKM ustteki kavisli seridin ortasinda.
    duzen = {"esp": 0, "spi": 1, "ays": 2, "hkm": 3}
    for anahtar, kisa, ad, aciklama, port in sorted(KARTLAR, key=lambda k: duzen.get(k[0], 9)):
        adres = "http://%s:%d/" % (HOST, port)
        hkm = anahtar == "hkm"
        if telefon and hkm:
            continue
        sira += 1
        # Minik ozet yuvasi (hesap.js soz 16): HKM'nin kendi ozeti yok.
        ozet = '' if hkm else '<div class="kart__ozet" data-ozet="%s" hidden></div>' % anahtar
        bas = ('<a class="kart" href="%s" data-modul="%s" title="%s · %s" style="--renk:var(--%s);--renk-t:var(--%s-t);--sira:%d"%s>'
               '<div class="kart__ust"><span class="logo" aria-hidden="true"><i class="sekil sekil--%s"></i></span>'
               '<div class="kart__metin"><div class="kart__ad">%s <small>%s</small></div>'
               '<div class="kart__acik">%s</div></div>%s</div>'
               % (adres, anahtar, _kac(kisa), port, anahtar, anahtar, sira,
                  "" if telefon else (' data-hkm="1"' if hkm else ' data-yokla="%s"' % adres),
                  anahtar, _kac(kisa), _kac(ad), _kac(aciklama),
                  _OK if telefon else ""))
        if telefon:
            kartlar.append(bas + ozet + '</a>')
            continue
        kart = (bas + ozet
                + '<div class="kart__alt"><span class="durum" data-hal="bekle"%s><i></i><span>Bakılıyor…</span></span>'
                '<span class="dugme">%s</span></div></a>' % ("" if hkm else " hidden", "Başlat" if hkm else "Aç"))
        if hkm:
            hkm_kart = kart.replace('class="kart"', 'class="kart kart--hkm"', 1)
        else:
            kartlar.append(kart)
    s = guncelle.surum()
    surum = ("sürüm %s" % s["tarih"]) if s else "zip sürümü"
    # KAVISLI SERIT: G (guncelleme) · HKM · S (surum). Telefonda yalniz S.
    s_dugme = ('<button type="button" class="yay__uc yay__s surum" id="surum" title="Güncellemeyi yeniden kontrol et">'
               '<b aria-hidden="true">S</b><span id="surum-metin">%s</span></button>' % _kac(surum))
    if telefon:
        yay = '<div class="yay yay--tek" style="--sira:1"><span class="yay__uc yay__s"><b aria-hidden="true">S</b><span>%s</span></span></div>' % _kac(surum)
    else:
        yay = ('<nav class="yay" aria-label="Güncelleme, Merkez ve sürüm" style="--sira:1">'
               '<button type="button" class="yay__uc yay__g" id="yay-g" aria-expanded="false" aria-controls="guncel" title="Güncelleme">'
               '<b aria-hidden="true">G</b><span>Güncelleme</span><i class="yay__nokta" aria-hidden="true"></i></button>'
               + hkm_kart + s_dugme + '</nav>')
    sayfa = GIRIS_SAYFASI
    if telefon:
        sayfa = _telefon_iskeleti(sayfa)
    if tema in ("light", "dark"):
        # Sistem ayarindaki tema (sistem/ayar.py, lifeos.tema.secim): sayfa
        # cihazin tercihine degil secime uyar. Koyu kurallar ya hep ya hic.
        sayfa = (sayfa.replace("@media (prefers-color-scheme:dark)", "@media all" if tema == "dark" else "@media not all")
                 .replace("color-scheme:light dark;", "color-scheme:%s;" % tema)
                 # hesap.css (giris ve hesap kutusu) temayi data-theme'den okur
                 .replace('<html lang="tr">', '<html lang="tr" data-theme="%s">' % tema, 1))
    return (sayfa.replace("__KARTLAR__", "\n  ".join(kartlar)).replace("__YAY__", yay)
            .replace("__SURUM__", _kac(surum)).replace("__IKON__", _IKON))


def _telefon_iskeleti(sayfa):
    """Bilgisayara ozgu parcalar cikar: guncelleme kutusu, betik (API'ler),
    dipteki durdurma komutu. Parca bulunamazsa sessizce gecilmez: hata."""
    def kes(s, bas, son):
        i = s.index(bas)
        j = s.index(son, i) + len(son)
        return s[:i] + s[j:]
    sayfa = kes(sayfa, '<section class="guncel"', "</section>")
    sayfa = kes(sayfa, "<script>", "</script>")
    i = sayfa.index('<footer class="dip">')
    j = sayfa.index("</footer>", i) + len("</footer>")
    dip = ('<footer class="dip"><span>Hesabınla girince bu telefondaki veri bilgisayarındaki '
           'LifeOS ile eşitlenir; beta girişinde yalnız bu telefonda kalır.</span>'
           '<span>Merkez (HKM) bilgisayarda çalışır.</span></footer>')
    return sayfa[:i] + dip + sayfa[j:]


def hkm_ayakta(timeout=1.0):
    try:
        with urllib.request.urlopen("http://%s:%d/api/health" % (HOST, HKM_PORT),
                                    timeout=timeout) as r:
            return r.status < 500
    except Exception:
        return False


def hkm_ac(calistir=subprocess.run):
    """HKM'yi baslatir (kapaliysa) ve yuz icin kisa bir esleme penceresi
    acar — HKM'nin KENDI baslaticisiyla: iki yerde iki baslatma mantigi
    olsaydi bir gun ayrisirdi. Acik olsa da cagrilir: pencere yeniden
    acilir, yuz anahtar sormadan baglanir."""
    betik = os.path.join(KOK, "HKM", "baslat.py")
    if not os.path.exists(betik):
        return {"ok": False, "mesaj": "HKM klasörü bulunamadı."}
    try:
        calistir([sys.executable, betik, "--tarayicisiz"], cwd=os.path.dirname(betik),
                 capture_output=True, timeout=120,
                 env=dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1",
                          PYTHONDONTWRITEBYTECODE="1"))
    except Exception as e:
        return {"ok": False, "mesaj": "HKM başlatılamadı: %s" % e}
    if hkm_ayakta(timeout=2.0):
        return {"ok": True, "adres": "http://%s:%d/" % (HOST, HKM_PORT)}
    return {"ok": False, "mesaj": "HKM açılamadı. Ayrıntı: HKM klasöründeki günlük."}


def hkm_kod_zamani():
    """HKM'nin Python dosyalarinin en yeni degisme zamani (epoch)."""
    en = 0.0
    for klasor in (os.path.join(KOK, "HKM"), os.path.join(KOK, "HKM", "core")):
        try:
            for ad in os.listdir(klasor):
                if ad.endswith(".py"):
                    en = max(en, os.path.getmtime(os.path.join(klasor, ad)))
        except OSError:
            pass
    return en


def hkm_eski(timeout=1.0):
    """Calisan HKM, dosyalardaki koddan eski mi? HKM /api/health «baslangic»
    (surecin acilis zamani) dondurur; bilinmiyorsa None (eski sayilmaz)."""
    try:
        with urllib.request.urlopen("http://%s:%d/api/health" % (HOST, HKM_PORT), timeout=timeout) as r:
            b = json.loads(r.read().decode("utf-8") or "{}").get("baslangic")
    except Exception:
        return None
    return bool(isinstance(b, (int, float)) and hkm_kod_zamani() > b + 2)


def hkm_yeniden(calistir=subprocess.run):
    """HKM'yi durdurup KENDI baslaticisiyla yeniden acar (yeni kod yuklensin)."""
    betik = os.path.join(KOK, "HKM", "baslat.py")
    if not os.path.exists(betik):
        return {"ok": False, "mesaj": "HKM klasörü bulunamadı."}
    try:
        calistir([sys.executable, betik, "--dur"], cwd=os.path.dirname(betik), capture_output=True, timeout=60,
                 env=dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1", PYTHONDONTWRITEBYTECODE="1"))
    except Exception:
        pass
    return hkm_ac(calistir)


def yeniden_baslat_zamanla(popen=subprocess.Popen, isletim=None):
    """Sistemi (bu sunucu dahil) yeniden baslatir. Is AYRI bir surece
    verilir: bu surec kendini kapatamaz. Windows'ta `start` araciligiyla
    acilir ki yeni surec bu surecin agacinda olmasin; --dur sunucuyu
    agaciyla (/T) kapatirken yeniden baslaticiyi da oldurmesin."""
    arg = [sys.executable, os.path.join(SISTEM, "baslat.py"), "--yeniden", "--tarayicisiz"]
    if (isletim or os.name) == "nt":
        return popen(["cmd", "/c", "start", "", "/b"] + arg, cwd=KOK,
                     creationflags=0x08000000)          # CREATE_NO_WINDOW
    return popen(arg, cwd=KOK, start_new_session=True,
                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# SISTEM PLANLAMASI (sistem/planlama.py): islerin kendisi burada, ne zaman
# orada. Her is (ok, cumle) doner; hicbiri veriyi degistirmez (yedek kopya
# ekler, guncelleme yalniz «kur» seciliyse kurar).
def _plan_araclari():
    def guncelleme():
        d = guncelleme_durumu(taze=True)
        if d.get("durum") != "ok":
            return False, d.get("mesaj") or "Güncelleme durumu okunamadı."
        n = d.get("geride") or 0
        if not n:
            return True, "Sistem güncel."
        if d.get("ileride"):
            return False, "%d yenilik var ama bu klasörde gönderilmemiş kayıt var; giriş sayfasından «Yedekle ve güncelle»." % n
        if not planlama.oku()["isler"]["guncelleme"]["kur"]:
            return True, "%d yenilik var; kurmak için giriş sayfasında «Güncelle»." % n
        with _GUNCEL_KILIT:
            sonuc = guncelle.uygula()
            _GUNCEL.update(zaman=0.0, veri=None)
        if sonuc.get("durum") != "guncellendi":
            return False, sonuc.get("mesaj") or "Güncelleme yapılmadı."
        if sonuc.get("yeniden_baslat"):
            yeniden_baslat_zamanla()
        return True, sonuc.get("mesaj") or "Güncellendi."

    def yedek():
        b = hesap.depo().kopya_al("elle")
        return True, "Yedek alındı: %s kayıt." % b.get("kayit", "?")

    def denetim():
        return planlama.veri_denetimi(hesap.depo().yol)

    def ozet():
        betik = os.path.join(KOK, "HKM", "hkm.py")
        if not os.path.exists(betik):
            return False, "Merkez (HKM) klasörü yok."
        r = subprocess.run([sys.executable, betik, "hafta"], cwd=os.path.dirname(betik), capture_output=True, text=True,
                           timeout=120, encoding="utf-8", errors="replace",
                           env=dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1", PYTHONDONTWRITEBYTECODE="1"))
        metin = (r.stdout or "").strip()
        return (r.returncode == 0 and bool(metin)), (metin[:400] or "Merkez haftanın özetini çıkaramadı.")

    def temizlik():
        guncelle.artiklari_temizle()
        return True, "Geçici dosyalar temizlendi."

    def hkm():
        if not hkm_ayakta():
            return True, "Merkez kapalı; tazelenecek bir şey yok."
        s = hkm_yeniden()
        return bool(s.get("ok")), s.get("mesaj") or "Merkez yeniden başlatıldı."

    def kapat():
        arg = [sys.executable, os.path.join(SISTEM, "baslat.py"), "--dur"]
        if os.name == "nt":
            subprocess.Popen(["cmd", "/c", "start", "", "/b"] + arg, cwd=KOK, creationflags=0x08000000)
        else:
            subprocess.Popen(arg, cwd=KOK, start_new_session=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    return {"guncelleme": guncelleme, "yedek": yedek, "denetim": denetim, "ozet": ozet,
            "temizlik": temizlik, "hkm": hkm, "kapat": kapat}


_PLAN = {"z": None}


def plan_zamanlayici():
    if _PLAN["z"] is None:
        _PLAN["z"] = planlama.Zamanlayici(_plan_araclari())
    return _PLAN["z"]


def plan_isle(h):
    return planlama.isle(h, plan_zamanlayici(), os.path.join(KOK, "BASLAT.bat"))


# Guncelleme durumu: her sayfa acilisinda aga cikmamak icin kisa sure
# saklanir. Uygulamadan sonra silinir.
_GUNCEL = {"zaman": 0.0, "veri": None}
_GUNCEL_KILIT = threading.Lock()
GUNCEL_SAKLA_SN = 300


def guncelleme_durumu(taze=False, durum=None):
    durum = durum or guncelle.durum
    with _GUNCEL_KILIT:
        if (not taze and _GUNCEL["veri"] is not None
                and time.time() - _GUNCEL["zaman"] < GUNCEL_SAKLA_SN):
            return _GUNCEL["veri"]
        veri = durum()
        _GUNCEL.update(zaman=time.time(), veri=veri)
        return veri


def guncelleme_izinli(basliklar):
    """POST /api/guncelle yalniz giris sayfasinin kendisinden gelir.

    Herhangi bir web sitesi tarayicidan 127.0.0.1'e POST gonderebilir.
    Ozel baslik (X-LifeOS) tarayiciyi on-kontrole zorlar ve bu sunucu
    on-kontrole izin vermez; Origin de varsa giris kapisi olmalidir."""
    if basliklar.get("X-LifeOS") != "guncelle":
        return False
    koken = basliklar.get("Origin")
    return koken in (None, "http://%s:%d" % (HOST, GIRIS_PORT),
                     "http://localhost:%d" % GIRIS_PORT)


class Giris(SimpleHTTPRequestHandler):
    def _json(self, kod, veri):
        govde = json.dumps(veri, ensure_ascii=False).encode("utf-8")
        self.send_response(kod)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(govde)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(govde)

    def do_OPTIONS(self):
        if self.path.startswith("/api/hesap/"):
            return hesap.isle(self)
        return self.send_error(405)

    def do_DELETE(self):
        if self.path.startswith("/api/ice"):
            return ice.isle(self)
        if self.path.startswith("/api/muzik"):
            return muzik.isle(self)
        if self.path.startswith("/api/zemin/"):
            return zemin.isle(self)
        return self.send_error(405)

    def _hesap_dosyasi(self, ad):
        """/hesap.js, /hesap.css, /animasyon.js, /qr.js — giris ve secim
        sayfasi (brand/ortak); kapali liste. qr.js: hesap sayfasinin iki
        adim kurulumu ve kodla cihaz baglama QR'i (hesap.js soz 17-18)."""
        tur = {"hesap.js": "text/javascript; charset=utf-8", "hesap.css": "text/css; charset=utf-8",
               "animasyon.js": "text/javascript; charset=utf-8", "qr.js": "text/javascript; charset=utf-8",
               "muzik.js": "text/javascript; charset=utf-8"}[ad]
        with open(os.path.join(KOK, "brand", "ortak", ad), "rb") as f:
            govde = f.read()
        self.send_response(200)
        self.send_header("Content-Type", tur)
        self.send_header("Content-Length", str(len(govde)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(govde)

    def do_POST(self):
        yol = self.path.split("?", 1)[0]
        if yol.startswith("/api/hesap/"):
            return hesap.isle(self)
        if yol == "/api/ayar":
            return ayar.isle(self)
        if yol.startswith("/api/ice"):
            return ice.isle(self)
        if yol.startswith("/api/muzik"):
            return muzik.isle(self)
        if yol.startswith("/api/zemin/"):
            return zemin.isle(self)
        if yol.startswith("/api/planlama"):
            return plan_isle(self)
        if yol not in ("/api/guncelle", "/api/hkm", "/api/hkm/yeniden", "/api/yeniden"):
            return self.send_error(404)
        if not guncelleme_izinli(self.headers):
            return self._json(403, {"durum": "engel", "mesaj": "İzin yok."})
        if yol == "/api/hkm":
            return self._json(200, hkm_ac())
        if yol == "/api/hkm/yeniden":
            return self._json(200, hkm_yeniden())
        if yol == "/api/yeniden":
            yeniden_baslat_zamanla()
            return self._json(200, {"ok": True})
        with _GUNCEL_KILIT:
            # yedekle=1 yalniz kutudaki «Yedekle ve güncelle» dugmesinden gelir.
            sonuc = guncelle.uygula(yedekle="yedekle=1" in self.path)
            _GUNCEL.update(zaman=0.0, veri=None)
        # HKM'nin kodu degistiyse ve HKM aciksa yeni kodla yeniden acilir (arka planda).
        if sonuc.get("durum") == "guncellendi" and sonuc.get("hkm_degisti") and hkm_ayakta():
            threading.Thread(target=hkm_yeniden, daemon=True).start()
            sonuc["mesaj"] = (sonuc.get("mesaj") or "") + " HKM yeni sürümle yeniden başlatılıyor."
        return self._json(200, sonuc)

    def do_GET(self):
        yol = self.path.split("?", 1)[0]
        if yol.startswith("/api/hesap/"):
            return hesap.isle(self)
        if yol == "/api/ayar":
            return ayar.isle(self)
        if yol.startswith("/api/ice"):
            return ice.isle(self)
        if yol.startswith("/api/muzik"):
            return muzik.isle(self)
        if yol.startswith("/api/zemin/"):
            return zemin.isle(self)
        if yol.startswith("/api/planlama"):
            return plan_isle(self)
        if yol in ("/hesap.js", "/hesap.css", "/animasyon.js", "/qr.js", "/muzik.js"):
            return self._hesap_dosyasi(yol[1:])
        if yol == "/api/guncelleme":
            return self._json(200, guncelleme_durumu(taze="taze=1" in self.path))
        if yol == "/api/durum":
            ayakta = hkm_ayakta()
            return self._json(200, {"hkm": ayakta, "hkm_eski": bool(ayakta and hkm_eski())})
        if yol.startswith("/logo/"):
            return self._logo(yol[len("/logo/"):])
        if yol.startswith("/marka/"):
            return self._marka(yol[len("/marka/"):])
        govde = ayar.sayfaya_ekle(giris_html(tema=ayar.oku()["ayar"].get("lifeos.tema.secim"))).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(govde)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(govde)

    def _logo(self, ad):
        """/logo/<sistem>.png — kapali listeden (LOGOLAR); URL'den yol kurulmaz."""
        parca = LOGOLAR.get(ad[:-4]) if ad.endswith(".png") else None
        tam = os.path.join(KOK, *parca) if parca else None
        if not tam or not os.path.exists(tam):
            return self.send_error(404)
        with open(tam, "rb") as f:
            govde = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(govde)))
        self.send_header("Cache-Control", "max-age=3600")
        self.end_headers()
        self.wfile.write(govde)

    def _marka(self, ad):
        """LifeOS markasi — brand/life/ altindaki sabit adli dosya.

        Ad muhafizi seviye gorselleriyle AYNI: tek yerde yazilmis, tek
        yerden yayilmis (bkz. SEVIYE:yol blogu)."""
        ad = _guvenli_medya_adi(ad)
        if not ad:
            self.send_error(404)
            return
        uzanti = os.path.splitext(ad)[1].lower()
        tam = os.path.join(KOK, "brand", "life", ad)
        if not os.path.exists(tam):
            self.send_error(404)
            return
        with open(tam, "rb") as f:
            govde = f.read()
        self.send_response(200)
        self.send_header("Content-Type", MEDYA_TURLERI[uzanti])
        self.send_header("Content-Length", str(len(govde)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(govde)

    def log_message(self, fmt, *args):
        return


class KuyrukluSunucu(ThreadingHTTPServer):
    """Varsayilan listen(5) bu surece dar: dort kapi TEK surecte, tek GIL'i
    paylasir ve HTTP/1.0'da her betik ayri baglantidir. Kabul dongusu bir an
    gecikince kuyruk tasar; Windows tasani REDDEDER ve sayfa bir betigi hic
    yuklemez — uygulama yarim acilir. tools/kuyruk_test.py sinar."""
    request_queue_size = 128

    def handle_error(self, request, client_address):
        """Tarayici sayfayi kapatip baglantiyi kestiyse (WinError 10053/10054,
        BrokenPipe) bu bir hata degildir; gunluge 30 satirlik yigin dusmesin
        (lifeos-sunucu.log, 2026-10-19). Baska her hata eskisi gibi yazilir."""
        import sys as _sys
        if isinstance(_sys.exc_info()[1], (ConnectionAbortedError, ConnectionResetError, BrokenPipeError)):
            return
        super().handle_error(request, client_address)


def _sunucu_kur(klasor, port):
    """Bir sistemin sunucusu. Klasor yoksa None doner: olmayan bir sistemi
    «ayakta» gostermek, bulunmayan bir kapiya isaret etmek olurdu."""
    kok = os.path.join(KOK, klasor)
    src = os.path.join(kok, "src")
    if not os.path.isdir(src):
        return None
    sinif = type("Sunucu_" + klasor, (Sunucu,), {"repo": kok})
    sunucu = KuyrukluSunucu((HOST, port), partial(sinif, directory=src))
    threading.Thread(target=_dist_isit, args=(kok,), daemon=True).start()
    return sunucu


def _dist_isit(kok):
    """Ilk bolme ~100 ms; ilk acilis beklemesin diye sunucu kurulunca yapilir."""
    try:
        dist = _guncel_dist(kok)
        if dist:
            _dist_bol(dist)
    except OSError:
        pass


# ------------------------------------------------------------ telefon
# Ev agi kapilari (telefon.py ile sertifika uretildiyse). Ayni dosya
# sunucusu, yalniz https ve 0.0.0.0: kodu ve gorselleri verir, bir de
# hesap API'sini (kural 4; jetonsuz istek veri goremez). Giris sayfasi
# (4180) ve onun API'leri ev agina ACILMAZ.
TELEFON_HOST = "0.0.0.0"
EL_SIKISMA_SN = 15


class HttpsYonlendir(BaseHTTPRequestHandler):
    """https kapisina duz http gelirse: ayni adresin https'ine 301. Adres
    semasiz ya da http:// ile yazilinca «bos yanit» yerine sayfa acilir."""
    def _yonlendir(self):
        host = (self.headers.get("Host") or "").strip()
        if not host or any(c in host for c in "\r\n /\\@"):
            return self.send_error(400)
        self.send_response(301)
        self.send_header("Location", "https://" + host + self.path)
        self.send_header("Content-Length", "0")
        self.end_headers()

    do_GET = do_HEAD = _yonlendir

    def log_message(self, fmt, *args):
        return


class TelefonSunucu(KuyrukluSunucu):
    """Ev agi kapisi. Ilk bayta bakar (okumadan, MSG_PEEK): 0x16 TLS el
    sikismasidir → https; oteki duz http'dir → `duz_isleyici` (modul
    kapisinda https'e yonlendirme, kurulum kapisinda ayni sayfa). Telefonda
    «güvenli bağlantı sağlanamıyor» buydu: semasiz yazilan adreste tarayici
    http kapisina https deniyordu (2026-10-04).
    El sikisma kabul dongusunde DEGIL, istegin kendi is parcaciginda
    yapilir: sertifikaya henuz guvenmeyen bir telefon ya da yarim kalan bir
    baglanti kapiyi kilitlemez; basarisiz el sikisma sessizce duser."""
    ssl_baglam = None
    duz_isleyici = HttpsYonlendir

    def finish_request(self, request, client_address):
        request.settimeout(EL_SIKISMA_SN)
        try:
            ilk = request.recv(1, socket.MSG_PEEK)
        except OSError:
            return
        if not ilk:
            return
        if ilk != b"\x16":
            self.duz_isleyici(request, client_address, self)
            return
        try:
            guvenli = self.ssl_baglam.wrap_socket(request, server_side=True)
        except (ssl.SSLError, OSError):
            return
        try:
            self.RequestHandlerClass(guvenli, client_address, self)
        finally:
            try:
                guvenli.close()
            except OSError:
                pass


def telefon_baglami(y):
    b = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    b.minimum_version = ssl.TLSVersion.TLSv1_2
    b.load_cert_chain(y["sertifika"], y["anahtar"])
    return b


def telefon_sunuculari(k=None, portlar=None, host=TELEFON_HOST):
    """Doner: ([(ad, port, sunucu)], [sorun]). Sertifika yoksa iki liste de
    bostur: sunucu eskisi gibi yalniz 127.0.0.1'dedir (kural 3). Acilamayan
    kapi atlanir ve sorun olarak yazilir; bilgisayardaki sistemler bundan
    etkilenmez."""
    if not telefon.acik_mi(k):
        return [], []
    try:
        baglam = telefon_baglami(telefon.yollar(k))
    except (ssl.SSLError, OSError) as e:
        return [], ["sertifika okunamadı: %s" % e]
    portlar = portlar or telefon.PORTLAR
    acik, sorun = [], []
    for klasor, ad, _, _, _ in SISTEMLER:
        port = portlar.get(klasor)
        src = os.path.join(KOK, klasor, "src")
        if port is None or not os.path.isdir(src):
            continue
        sinif = type("Telefon_" + klasor, (Sunucu,), {"repo": os.path.join(KOK, klasor)})
        try:
            s = TelefonSunucu((host, port), partial(sinif, directory=src))
        except OSError as e:
            sorun.append("%s (%s): %s" % (ad, port, e))
            continue
        s.ssl_baglam = baglam
        acik.append((ad, port, s))
    return acik, sorun


def telefon_kurulum_html(bilgisayar, ip_listesi, parmak):
    a = telefon.adresler(bilgisayar, ip_listesi)
    modul = "".join(
        '<li><b>%s</b> <a href="%s">%s</a>%s</li>' % (
            _kac(m), _kac(a[m][0]), _kac(a[m][0]),
            (' <span class="yedek">yedek: <a href="%s">%s</a></span>' % (_kac(a[m][1]), _kac(a[m][1]))
             if len(a[m]) > 1 else ""))
        for m in ("AYS", "SPI", "ESP"))
    return """<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LifeOS — telefon kurulumu</title>
<style>
:root{ --bg:#f6f6f8; --kart:#fff; --yazi:#1d1d22; --ikinci:#5c5c66; --vurgu:#3d3f8f; }
@media (prefers-color-scheme:dark){ :root{ --bg:#16171b; --kart:#202227; --yazi:#ececf1; --ikinci:#a3a3ad; --vurgu:#a7a9ff; } }
body{ margin:0; padding:24px 16px 40px; background:var(--bg); color:var(--yazi);
  font:16px/1.5 -apple-system, "Segoe UI", system-ui, sans-serif; }
main{ max-width:560px; margin:0 auto; }
section{ background:var(--kart); border-radius:16px; padding:16px 18px; margin:0 0 14px; }
h1{ font-size:22px; margin:0 0 16px; } h2{ font-size:16px; margin:0 0 8px; }
p, li{ color:var(--ikinci); } b{ color:var(--yazi); } a{ color:var(--vurgu); word-break:break-all; }
.dugme{ display:inline-block; margin-top:6px; padding:12px 18px; border-radius:999px;
  background:var(--vurgu); color:#fff; text-decoration:none; font-weight:600; }
@media (prefers-color-scheme:dark){ .dugme{ color:#16171b; } }
ul{ padding-left:18px; margin:6px 0; } .yedek{ font-size:13px; } code{ font-size:12px; word-break:break-all; }
</style></head><body><main>
<h1>LifeOS'u telefona kur</h1>
<section><h2>1. Sertifikayı indir</h2>
<p>Telefon bilgisayarla aynı Wi-Fi'da olmalı. Bu sertifika yalnız senin
bilgisayarının adresine güvenmeyi sağlar; internete hiçbir şey çıkmaz.</p>
<a class="dugme" href="/lifeos-kok.cer">Sertifikayı indir</a></section>
<section><h2>2. Sertifikayı kur</h2>
<p><b>iPhone:</b> Ayarlar › İndirilen Profil › Yükle. Sonra Ayarlar › Genel ›
Hakkında › Sertifika Güven Ayarları › «LifeOS Yerel Kok» için tam güveni aç.</p>
<p><b>Android:</b> Ayarlar › Güvenlik › Şifreleme ve kimlik bilgileri ›
Sertifika yükle › CA sertifikası › indirilen dosyayı seç.</p>
<p>Parmak izi (profilde aynı olmalı):<br><code>%s</code></p></section>
<section><h2>3. Modülü aç, ana ekrana ekle</h2>
<ul>%s</ul>
<p>Bir modülü hep aynı adresten aç: adres değişirse verin ayrı bir kökende
kalır ve «silinmiş» görünür. <b>.local</b> açılmazsa yedek adresi kullan.</p>
<p><b>iPhone:</b> Paylaş › Ana Ekrana Ekle. Verin o uygulamada durur.
<b>Android:</b> Chrome menüsü › Ana ekrana ekle.</p></section>
<section><h2>4. Evde bir kez aç</h2>
<p>Ana ekrandan bir kez açınca dosyalar telefona kaydedilir. Sonra dışarıda
internetsiz de açılır; kamera ve canlı rota çalışır. Harita karoları için
mobil internet gerekir.</p></section>
</main></body></html>""" % (_kac(parmak), modul)


class TelefonKurulum(BaseHTTPRequestHandler):
    """Ev agindan http ile acilan TEK sayfa: yonerge ve kok sertifikanin
    ACIK kismi. BaseHTTPRequestHandler bilincli: SimpleHTTPRequestHandler'in
    HEAD'i calisma klasorunu (deponun koku: veri/, HKM/db/) sunardi. Burada
    tanimlanmayan her yol ve yontem 404/501'dir; ozel anahtar hic okunmaz."""
    klasor = None

    def do_GET(self):
        yol = self.path.split("?", 1)[0]
        y = telefon.yollar(self.klasor)
        if yol == "/lifeos-kok.cer":
            try:
                with open(y["kok_der"], "rb") as f:
                    govde = f.read()
            except OSError:
                return self.send_error(404)
            self.send_response(200)
            self.send_header("Content-Type", "application/x-x509-ca-cert")
            self.send_header("Content-Disposition", 'attachment; filename="lifeos-kok.cer"')
        elif yol in ("/", "/index.html"):
            ipl = telefon.ipler()
            govde = telefon_kurulum_html(telefon.ad(), ipl, telefon.parmak_izi(y)).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
        else:
            return self.send_error(404)
        self.send_header("Content-Length", str(len(govde)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(govde)

    def log_message(self, fmt, *args):
        return


def telefon_kurulum_sunucusu(k=None, port=None, host=TELEFON_HOST):
    """Kurulum kapisi hem http hem https konusur: kok kurulmadan once
    https'te tarayici uyari verir (gecilebilir), sonra temiz acilir."""
    if not telefon.acik_mi(k):
        return None
    sinif = type("TelefonKurulum_", (TelefonKurulum,), {"klasor": k})
    s = TelefonSunucu((host, telefon.KURULUM_PORT if port is None else port), sinif)
    s.ssl_baglam = telefon_baglami(telefon.yollar(k))
    s.duz_isleyici = sinif
    return s



def _cikti_utf8():
    """Cikti dosyaya ya da boruya gidiyorsa UTF-8 yazilir.

    Python dosyaya yazarken sistemin kod sayfasini kullanir; Turkce
    Windows'ta bu cp1254'tur ve «✓» orada yoktur. Baslatici cocuga UTF-8
    soyler, ama surec elle ve ciktisi yonlendirilerek de acilabilir: o
    zaman da ilk satirda olmemeli. Konsolda kodlamaya dokunulmaz, yalniz
    yazilamayan karakter yerine «?» konur."""
    for ad in ("stdout", "stderr"):
        akis = getattr(sys, ad, None)
        try:
            if akis.isatty():
                akis.reconfigure(errors="replace")
            else:
                akis.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass


def main():
    _cikti_utf8()
    sunucular = []
    eksik = []
    for klasor, ad, port, _, _ in SISTEMLER:
        try:
            s = _sunucu_kur(klasor, port)
        except OSError as e:
            print("  ✕ %s açılamadı (%s): %s" % (ad, port, e))
            print("    Bu port başka bir şey tarafından kullanılıyor olabilir.")
            return 1
        if s is None:
            eksik.append(klasor)
            continue
        sunucular.append((ad, port, s))

    if not sunucular:
        print("Hiçbir sistem bulunamadı. Bu betik deponun kökünden çalışır.")
        return 1

    try:
        giris = KuyrukluSunucu((HOST, GIRIS_PORT), Giris)
    except OSError as e:
        print("  ✕ Giriş sayfası açılamadı (%s): %s" % (GIRIS_PORT, e))
        return 1

    print("\nLifeOS — tek sunucu\n")
    for ad, port, _ in sunucular:
        print("  ✓ %-38s http://%s:%d" % (ad, HOST, port))
    for k in eksik:
        print("  • %-38s klasör yok, atlandı" % k)
    print("\n  Giriş sayfası:  http://%s:%d\n" % (HOST, GIRIS_PORT))

    # Telefon: yalniz telefon.py ile sertifika uretildiyse. Acilamazsa
    # bilgisayardaki sistemler yine calisir.
    tel, tel_sorun = telefon_sunuculari()
    kurulum = None
    if tel:
        try:
            kurulum = telefon_kurulum_sunucusu()
        except OSError as e:
            tel_sorun.append("kurulum sayfası (%s): %s" % (telefon.KURULUM_PORT, e))
        ipl = telefon.ipler()
        print("  Telefon (ev ağı, https):")
        for ad, port, _ in tel:
            print("  ✓ %-38s https://%s.local:%d" % (ad, telefon.ad(), port))
        if kurulum and ipl:
            print("  Telefon kurulumu:  http://%s:%d\n" % (ipl[0], telefon.KURULUM_PORT))
    for s in tel_sorun:
        print("  • Telefon kapısı açılamadı — " + s)
    print("  Durdurmak için: Ctrl+C\n")

    for _, _, s in sunucular + tel:
        threading.Thread(target=s.serve_forever, daemon=True).start()
    plan_zamanlayici().baslat()
    if kurulum:
        threading.Thread(target=kurulum.serve_forever, daemon=True).start()
    try:
        giris.serve_forever()
    except KeyboardInterrupt:
        print("\nDurduruldu.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
