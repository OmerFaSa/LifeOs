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
"""

import os
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

KOK = os.path.dirname(os.path.abspath(__file__))
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


def _ortak_seviye_yolu(clean, kok):
    """/img/seviye/<ad> -> <kok>/brand/seviye/<ad>, yoksa None.

    Yalniz duz dosya adi kabul edilir: alt klasor ve ".." yok. Bir
    sunucunun kendi kokunun disina cikmasi, ancak sinirli ve okunakli
    bir kapiyla kabul edilebilir."""
    onek = "/img/seviye/"
    if not clean.startswith(onek):
        return None
    ad = clean[len(onek):]
    if not ad or "/" in ad or "\\" in ad or ad.startswith("."):
        return None
    return os.path.join(kok, "brand", "seviye", ad)


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
        ortak = _ortak_seviye_yolu(clean, KOK)
        if ortak:
            return ortak
        if clean == "/dist" or clean.startswith("/dist/"):
            rel = clean[len("/dist/"):] if clean.startswith("/dist/") else ""
            safe = os.path.normpath(rel).replace("\\", "/").lstrip("./")
            if safe.startswith(".."):
                return os.path.join(self.repo, "dist")
            return os.path.join(self.repo, "dist",
                                *[p for p in safe.split("/") if p])
        return super().translate_path(path)

    def guess_type(self, path):
        # Kaynaklar UTF-8; charset bildirilmezse tarayici latin-1 varsayar
        # ve Turkce karakterler bozulur.
        ctype = super().guess_type(path)
        base = ctype.split(";", 1)[0].strip()
        if base in ("text/html", "text/css", "application/javascript",
                    "text/javascript", "application/json", "text/plain"):
            return base + "; charset=utf-8"
        return ctype

    def end_headers(self):
        self.send_header("Cache-Control",
                         "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        status = str(args[1]) if len(args) > 1 else ""
        if status.startswith("2") or status.startswith("3"):
            return
        super().log_message(fmt, *args)


GIRIS_SAYFASI = """<!doctype html>
<html lang="tr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>LifeOS</title>
<link rel="icon" type="image/png" href="/marka/favicon.png"/>
<style>
:root{ --bg:#f7f7f5; --yuzey:#fff; --fg:#17181a; --dim:#63666b; --line:#e3e3df;
  --line-strong:#cfd0cb; --accent:#22456f;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
@media (prefers-color-scheme:dark){ :root{ --bg:#0f1113; --yuzey:#15181b;
  --fg:#e9eaec; --dim:#9aa0a6; --line:#24282c; --line-strong:#333940;
  --accent:#9dbdf0; } }
*{ box-sizing:border-box; }
body{ margin:0; background:var(--bg); color:var(--fg);
  font:15px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
.wrap{ max-width:720px; margin:0 auto; padding:56px 20px 72px; }
h1{ font:600 13px/1 var(--mono); letter-spacing:.16em; text-transform:uppercase;
  margin:0 0 28px; }
h1 span{ color:var(--dim); font-weight:400; letter-spacing:.08em; }
/* Marka gorseli brand/life/logo.png. Dosya degisirse logo degisir;
   burada hicbir sey degismez. Yuklenemezse yalniz yazi kalir. */
h1 .marka{ width:22px; height:22px; border-radius:5px; object-fit:cover;
  vertical-align:-6px; margin-right:11px; }
a.kart{ display:block; text-decoration:none; color:inherit;
  border-top:1px solid var(--line); padding:18px 0; }
a.kart:last-of-type{ border-bottom:1px solid var(--line); }
a.kart:hover .ad{ text-decoration:underline; }
.ad{ font-size:17px; font-weight:600; }
.aciklama{ color:var(--dim); font-size:13.5px; margin-top:2px; }
.adres{ font:11px/1 var(--mono); color:var(--dim); letter-spacing:.06em;
  margin-top:8px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.nokta{ width:8px; height:8px; border-radius:99px; background:var(--line-strong);
  display:inline-block; }
.nokta.acik{ background:var(--accent); }
.not{ color:var(--dim); font-size:13px; margin-top:28px; max-width:60ch; }
.not code{ font:12px/1.4 var(--mono); }
</style></head><body>
<div class="wrap">
  <h1><img class="marka" src="/marka/logo.png" alt="" aria-hidden="true"/>LifeOS <span>tek sunucu</span></h1>
  __KARTLAR__
  <p class="not">Üç sistem birbirini bilmez ve birbirini bozamaz; ayrı
    kapılarda durmalarının sebebi budur. HKM de üçünün üstünde değil
    <b>yanındadır</b>: kapalıyken üçü de olduğu gibi çalışır.</p>
  <p class="not">Durdurmak için bu betiği çalıştırdığın terminalde
    <code>Ctrl+C</code>.</p>
</div>
<script>
/* Nokta, o kapinin GERCEKTEN cevap verdigini soyler. Denenmeden yakilan
   bir isik, yalan soyleyen bir arayuzdur. */
document.querySelectorAll('[data-yokla]').forEach(function(el){
  fetch(el.dataset.yokla, { mode:'no-cors' })
    .then(function(){ el.querySelector('.nokta').classList.add('acik'); })
    .catch(function(){});
});
</script>
</body></html>
"""


def giris_html():
    kartlar = []
    for _, ad, port, _, aciklama in SISTEMLER:
        adres = "http://%s:%d/" % (HOST, port)
        kartlar.append(
            '<a class="kart" href="%s" data-yokla="%s"><div class="ad">%s</div>'
            '<div class="aciklama">%s</div><div class="adres">'
            '<span class="nokta"></span>%s</div></a>' % (adres, adres, ad,
                                                         aciklama, adres))
    hkm = "http://%s:%d/" % (HOST, HKM_PORT)
    kartlar.append(
        '<a class="kart" href="%s" data-yokla="%s"><div class="ad">'
        'HKM — Hayat Kontrol Merkezi</div><div class="aciklama">üçünün özeti; '
        'ayrı çalışır, kapalıyken hiçbiri bozulmaz</div><div class="adres">'
        '<span class="nokta"></span>%s</div></a>' % (hkm, hkm, hkm))
    return GIRIS_SAYFASI.replace("__KARTLAR__", "\n  ".join(kartlar))


MARKA_TURLERI = {".png": "image/png", ".jpg": "image/jpeg",
                 ".jpeg": "image/jpeg", ".webp": "image/webp",
                 ".svg": "image/svg+xml", ".mp4": "video/mp4"}


class Giris(SimpleHTTPRequestHandler):
    def do_GET(self):
        yol = self.path.split("?", 1)[0]
        if yol.startswith("/marka/"):
            return self._marka(yol[len("/marka/"):])
        govde = giris_html().encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(govde)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(govde)

    def _marka(self, ad):
        """LifeOS markasi — brand/life/ altindaki sabit adli dosya.

        Yalniz duz dosya adi ve yalniz gorsel uzantisi kabul edilir; bir
        logo kapisinin dosya sistemine acilan bir pencereye donusmesi
        kabul edilebilir bir bedel degil."""
        uzanti = os.path.splitext(ad)[1].lower()
        if ("/" in ad or "\\" in ad or ad.startswith(".")
                or uzanti not in MARKA_TURLERI):
            self.send_error(404)
            return
        tam = os.path.join(KOK, "brand", "life", ad)
        if not os.path.exists(tam):
            self.send_error(404)
            return
        with open(tam, "rb") as f:
            govde = f.read()
        self.send_response(200)
        self.send_header("Content-Type", MARKA_TURLERI[uzanti])
        self.send_header("Content-Length", str(len(govde)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(govde)

    def log_message(self, fmt, *args):
        return


def _sunucu_kur(klasor, port):
    """Bir sistemin sunucusu. Klasor yoksa None doner: olmayan bir sistemi
    «ayakta» gostermek, bulunmayan bir kapiya isaret etmek olurdu."""
    kok = os.path.join(KOK, klasor)
    src = os.path.join(kok, "src")
    if not os.path.isdir(src):
        return None
    sinif = type("Sunucu_" + klasor, (Sunucu,), {"repo": kok})
    return ThreadingHTTPServer((HOST, port), partial(sinif, directory=src))


def main():
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
        giris = ThreadingHTTPServer((HOST, GIRIS_PORT), Giris)
    except OSError as e:
        print("  ✕ Giriş sayfası açılamadı (%s): %s" % (GIRIS_PORT, e))
        return 1

    print("\nLifeOS — tek sunucu\n")
    for ad, port, _ in sunucular:
        print("  ✓ %-38s http://%s:%d" % (ad, HOST, port))
    for k in eksik:
        print("  • %-38s klasör yok, atlandı" % k)
    print("\n  Giriş sayfası:  http://%s:%d\n" % (HOST, GIRIS_PORT))
    print("  Durdurmak için: Ctrl+C\n")

    for _, _, s in sunucular:
        threading.Thread(target=s.serve_forever, daemon=True).start()
    try:
        giris.serve_forever()
    except KeyboardInterrupt:
        print("\nDurduruldu.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
