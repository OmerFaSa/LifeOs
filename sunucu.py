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

import json
import os
import sys
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

KOK = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True      # kok klasorde __pycache__ birikmesin
sys.path.insert(0, KOK)
import guncelle  # noqa: E402

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
    duyardi. Cozduktan sonra alt klasor, ".." ve gizli dosya reddedilir.
    """
    try:
        ad = _unquote(ad or "")
    except Exception:
        return None
    if not ad or "/" in ad or "\\" in ad or ad.startswith("."):
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
# ===== URETILMIS BLOK SONU =====
# SEVIYE:yol-bit


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
        ortak = (_ortak_seviye_yolu(clean, KOK)
                 or _ortak_marka_yolu(clean, KOK))
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
.guncel{ display:flex; align-items:center; gap:12px; flex-wrap:wrap;
  margin:0 0 28px; padding:12px 14px; border:1px solid var(--line);
  border-radius:10px; background:var(--yuzey); font-size:13.5px; }
.guncel .metin{ flex:1; min-width:200px; color:var(--dim); }
.guncel .metin b{ color:var(--fg); font-weight:600; }
.guncel ul{ margin:6px 0 0; padding-left:18px; font-size:12.5px; }
.guncel button{ font:inherit; font-size:13px; font-weight:600; cursor:pointer;
  min-height:32px; padding:0 14px; border-radius:8px; border:1px solid var(--fg);
  background:var(--fg); color:var(--bg); }
.guncel button.ikincil{ background:none; color:var(--fg); border-color:var(--line-strong); }
.guncel button:disabled{ opacity:.55; cursor:progress; }
.guncel .nokta.var{ background:#c7832b; }
</style></head><body>
<div class="wrap">
  <h1><img class="marka" src="/marka/logo.png" alt="" aria-hidden="true"/>LifeOS <span>tek sunucu</span></h1>
  <div class="guncel" id="guncel" aria-live="polite">
    <span class="nokta"></span>
    <div class="metin" id="guncel-metin">Güncelleme kontrol ediliyor…</div>
    <button type="button" id="guncel-dugme" hidden>Güncelle</button>
    <button type="button" class="ikincil" id="guncel-yenile" hidden>Sayfayı yenile</button>
  </div>
  __KARTLAR__
  <p class="not">Üç sistem birbirini bilmez ve birbirini bozamaz; ayrı
    kapılarda durmalarının sebebi budur. HKM de üçünün üstünde değil
    <b>yanındadır</b>: kapalıyken üçü de olduğu gibi çalışır.</p>
  <p class="not">Durdurmak için: <code>python baslat.py --dur</code>.
    Güncellemek için yukarıdaki düğme ya da klasördeki
    <code>GUNCELLE.bat</code>.</p>
</div>
<script>
/* Nokta, o kapinin GERCEKTEN cevap verdigini soyler. Denenmeden yakilan
   bir isik, yalan soyleyen bir arayuzdur. */
document.querySelectorAll('[data-yokla]').forEach(function(el){
  fetch(el.dataset.yokla, { mode:'no-cors' })
    .then(function(){ el.querySelector('.nokta').classList.add('acik'); })
    .catch(function(){});
});

/* Guncelleme: main dalindan ileri sarma (guncelle.py). Karar sunucuda
   verilir; sayfa yalniz ne oldugunu soyler. */
(function(){
  var kutu = document.getElementById('guncel');
  var metin = document.getElementById('guncel-metin');
  var dugme = document.getElementById('guncel-dugme');
  var yenile = document.getElementById('guncel-yenile');
  var nokta = kutu.querySelector('.nokta');
  function kac(t){ return String(t).replace(/[&<>"]/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function liste(y){ return y && y.length ? '<ul>' + y.slice(0, 6).map(function(s){
    return '<li>' + kac(s) + '</li>'; }).join('') + '</ul>' : ''; }
  function ciz(d){
    dugme.hidden = true; nokta.className = 'nokta';
    if(d.durum !== 'ok'){ metin.textContent = d.mesaj || 'Güncelleme durumu okunamadı.'; return; }
    if(d.geride > 0){
      nokta.className = 'nokta var';
      metin.innerHTML = '<b>' + d.geride + ' yenilik var.</b>' + liste(d.yeni);
      dugme.hidden = false; dugme.disabled = false; dugme.textContent = 'Güncelle';
    } else {
      nokta.className = 'nokta acik';
      metin.innerHTML = '<b>Sistem güncel.</b>' + (d.ag ? '' : ' (Sunucuya ulaşılamadı; son bilinen duruma göre.)');
    }
  }
  fetch('/api/guncelleme').then(function(r){ return r.json(); }).then(ciz)
    .catch(function(){ metin.textContent = 'Güncelleme durumu okunamadı.'; });
  dugme.addEventListener('click', function(){
    dugme.disabled = true; dugme.textContent = 'İndiriliyor…';
    fetch('/api/guncelle', { method:'POST', headers:{ 'X-LifeOS':'guncelle' } })
      .then(function(r){ return r.json(); })
      .then(function(s){
        dugme.hidden = true;
        var tamam = s.durum === 'guncellendi' || s.durum === 'guncel';
        nokta.className = 'nokta' + (tamam ? ' acik' : ' var');
        metin.innerHTML = '<b>' + kac(s.mesaj || '') + '</b>'
          + (s.durum === 'guncellendi' && s.yeniden_baslat
             ? ' LifeOS klasöründe <code>GUNCELLE.bat</code> dosyasını çift tıkla; sistem yeniden başlar.' : '');
        if(s.durum === 'guncellendi') yenile.hidden = false;
      })
      .catch(function(){ dugme.disabled = false; dugme.textContent = 'Güncelle';
        metin.textContent = 'Güncelleme isteği gönderilemedi.'; });
  });
  yenile.addEventListener('click', function(){ location.reload(); });
})();
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

    def do_POST(self):
        yol = self.path.split("?", 1)[0]
        if yol != "/api/guncelle":
            return self.send_error(404)
        if not guncelleme_izinli(self.headers):
            return self._json(403, {"durum": "engel", "mesaj": "İzin yok."})
        with _GUNCEL_KILIT:
            sonuc = guncelle.uygula()
            _GUNCEL.update(zaman=0.0, veri=None)
        return self._json(200, sonuc)

    def do_GET(self):
        yol = self.path.split("?", 1)[0]
        if yol == "/api/guncelleme":
            return self._json(200, guncelleme_durumu(taze="taze=1" in self.path))
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


def _sunucu_kur(klasor, port):
    """Bir sistemin sunucusu. Klasor yoksa None doner: olmayan bir sistemi
    «ayakta» gostermek, bulunmayan bir kapiya isaret etmek olurdu."""
    kok = os.path.join(KOK, klasor)
    src = os.path.join(kok, "src")
    if not os.path.isdir(src):
        return None
    sinif = type("Sunucu_" + klasor, (Sunucu,), {"repo": kok})
    return ThreadingHTTPServer((HOST, port), partial(sinif, directory=src))



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
