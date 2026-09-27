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
import subprocess
import sys
import threading
import time
import urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

SISTEM = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.dirname(SISTEM)          # deponun koku (sistem/ bir alt klasor)
sys.dont_write_bytecode = True      # __pycache__ birikmesin
sys.path.insert(0, SISTEM)
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
<style>
:root{ color-scheme:light dark;
  --bg:#f5f6f8; --yuzey:#ffffff; --yuzey-2:#f0f1f4; --fg:#15171a; --fg-2:#4a4f57; --fg-3:#6b717b;
  --cizgi:#e4e6ea; --cizgi-2:#d3d6dc; --golge:0 1px 2px rgba(16,24,40,.05), 0 4px 16px rgba(16,24,40,.06);
  --ok:#1a7f5a; --ok-t:#e5f4ee; --uyari:#a4620f; --uyari-t:#fcf1e2; --kapali:#8a9099;
  --ays:#2D5BE3; --spi:#0E8C79; --esp:#C8741C; --hkm:#7453D4;
  --ays-t:#EEF2FD; --spi-t:#E7F4F1; --esp-t:#FBF2E7; --hkm-t:#F1EEFB;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
@media (prefers-color-scheme:dark){ :root{
  --bg:#0d0f12; --yuzey:#15181c; --yuzey-2:#1c2026; --fg:#eceef1; --fg-2:#b3b8c0; --fg-3:#8c929c;
  --cizgi:#252a31; --cizgi-2:#323841; --golge:0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.25);
  --ok:#4cc38a; --ok-t:#122a20; --uyari:#f2a93b; --uyari-t:#2a1f0f; --kapali:#6b717b;
  --ays:#4F86FF; --spi:#2EC4A9; --esp:#F2A93B; --hkm:#9A86FF;
  --ays-t:#121A2C; --spi-t:#0E211E; --esp-t:#241A0D; --hkm-t:#1B1730; } }
*{ box-sizing:border-box; }
[hidden]{ display:none !important; }
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
  border:1px solid var(--cizgi); border-radius:999px; background:var(--yuzey); white-space:nowrap; }
/* ---- guncelleme ---- */
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
.kart{ display:flex; flex-direction:column; gap:14px; padding:18px; border-radius:14px; background:var(--yuzey);
  border:1px solid var(--cizgi); box-shadow:var(--golge); color:inherit; text-decoration:none;
  transition:border-color .15s, transform .15s; position:relative; overflow:hidden; }
.kart::before{ content:''; position:absolute; left:0; top:0; right:0; height:3px; background:var(--renk); opacity:.9; }
.kart:hover{ border-color:var(--cizgi-2); transform:translateY(-1px); }
.kart__ust{ display:flex; gap:14px; align-items:center; }
.logo{ flex:none; width:52px; height:52px; border-radius:13px; background:var(--renk-t); display:grid; place-items:center; }
.logo img{ width:40px; height:40px; object-fit:contain; }
.kart__ad{ font-size:16px; font-weight:650; display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; }
.kart__ad small{ font-size:12.5px; font-weight:500; color:var(--fg-3); }
.kart__acik{ color:var(--fg-2); font-size:13.5px; margin-top:2px; }
.kart__alt{ display:flex; align-items:center; gap:10px; margin-top:auto; padding-top:12px; border-top:1px solid var(--cizgi); }
.durum{ display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600; color:var(--fg-3); }
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
}
@media (prefers-reduced-motion:reduce){ *{ transition:none !important; } }
</style></head><body>
<main class="sarmal">
  <header class="ust">
    <span class="isaret" aria-hidden="true"><b></b><b></b><b></b><b></b></span>
    <h1>LifeOS<span>Kontrol paneli</span></h1>
    <span class="surum" id="surum">__SURUM__</span>
  </header>

  <section class="guncel" id="guncel" data-hal="bekle" aria-live="polite" aria-label="Güncelleme">
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

  <h2 class="bolum">Sistemler</h2>
  <div class="izgara">
  __KARTLAR__
  </div>

  <footer class="dip">
    <span>Verin bu bilgisayarda kalır; güncelleme ona dokunmaz.</span>
    <span>Durdurmak: <code>python sistem/baslat.py --dur</code></span>
  </footer>
</main>
<script>
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
  function post(yol){
    return fetch(yol, { method:'POST', headers:{ 'X-LifeOS':'guncelle' } })
      .then(function(r){ return r.json(); });
  }
  function hal(h, b, a, satirlar){
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
    if(d.geride > 0){
      hal('var', d.geride + ' yenilik var', 'İndirmek bir dakikadan kısa sürer; verin korunur.', d.yeni);
      return ana('Güncelle', guncelle);
    }
    hal('ok', 'Sistem güncel', d.ag ? 'En yeni sürümü kullanıyorsun.' : 'GitHub\\'a ulaşılamadı; son bilinen duruma göre.');
    ana('', null);
  }
  function kontrol(taze){
    hal('bekle', 'Güncelleme kontrol ediliyor…', ''); bak.hidden = true; ana('', null);
    fetch('/api/guncelleme' + (taze ? '?taze=1' : '')).then(function(r){ return r.json(); }).then(ciz)
      .catch(function(){ hal('uyari', 'Güncelleme durumu okunamadı', ''); bak.hidden = false; });
  }
  function guncelle(){
    dugme.disabled = true; dugme.textContent = 'İndiriliyor…'; bak.hidden = true;
    post('/api/guncelle').then(function(s){
      if(s.durum === 'guncellendi'){
        hal('ok', s.mesaj || 'Güncellendi', s.yeniden_baslat ? 'Yeni sürümün tamamı için sistemi yeniden başlat.' : 'Açık sayfaları yenile.', s.yeni);
        return s.yeniden_baslat ? ana('Yeniden başlat', yeniden) : ana('Sayfayı yenile', function(){ location.reload(); });
      }
      if(s.durum === 'guncel'){ hal('ok', 'Sistem güncel', ''); return ana('', null); }
      hal('uyari', 'Güncelleme yapılmadı', s.mesaj || ''); bak.hidden = false; ana('', null);
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

  /* Durum isigi: kapi GERCEKTEN cevap verdiginde yanar. Uc sistem ayni
     surecte oldugu icin dogrudan yoklanir; HKM'yi sunucu yoklar. */
  function yak(kart, acik){
    var d = kart.querySelector('.durum');
    d.setAttribute('data-hal', acik ? 'acik' : 'kapali');
    d.lastChild.textContent = acik ? 'Çalışıyor' : 'Kapalı';
  }
  document.querySelectorAll('.kart[data-yokla]').forEach(function(k){
    fetch(k.getAttribute('data-yokla'), { mode:'no-cors' }).then(function(){ yak(k, true); }).catch(function(){ yak(k, false); });
  });
  var hkm = document.querySelector('.kart[data-hkm]');
  var hkmDugme = hkm.querySelector('.dugme');
  function hkmCiz(acik){
    yak(hkm, acik);
    hkmDugme.textContent = acik ? 'Aç' : 'Başlat';
    hkmDugme.disabled = false;
  }
  fetch('/api/durum').then(function(r){ return r.json(); }).then(function(d){ hkmCiz(!!d.hkm); }).catch(function(){ hkmCiz(false); });
  hkm.addEventListener('click', function(e){
    e.preventDefault();
    if(hkmDugme.disabled) return;
    /* Sekme tiklamayla ayni anda acilir (acilir pencere engeline takilmaz);
       HKM hazir olunca adrese gider. Eslesme penceresi acildigi icin
       anahtar sorulmaz. */
    var sekme = window.open('', '_blank');
    hkmDugme.disabled = true; hkmDugme.textContent = 'Açılıyor…';
    post('/api/hkm').then(function(s){
      hkmCiz(!!s.ok);
      if(s.ok){ if(sekme) sekme.location = s.adres; else location.href = s.adres; }
      else { if(sekme) sekme.close(); hkm.querySelector('.kart__acik').textContent = s.mesaj || 'HKM açılamadı.'; }
    }).catch(function(){ if(sekme) sekme.close(); hkmCiz(false); });
  });
})();
</script>
</body></html>
"""


def _kac(t):
    return (str(t).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def giris_html():
    kartlar = []
    for anahtar, kisa, ad, aciklama, port in KARTLAR:
        adres = "http://%s:%d/" % (HOST, port)
        hkm = anahtar == "hkm"
        kartlar.append(
            '<a class="kart" href="%s" style="--renk:var(--%s);--renk-t:var(--%s-t)" %s>'
            '<div class="kart__ust"><span class="logo"><img src="/logo/%s.png" alt="" width="40" height="40"/></span>'
            '<div><div class="kart__ad">%s <small>%s</small></div>'
            '<div class="kart__acik">%s</div></div></div>'
            '<div class="kart__alt"><span class="durum" data-hal="bekle"><i></i><span>Bakılıyor…</span></span>'
            '<span class="port">:%d</span>'
            '<span class="dugme">%s</span></div></a>'
            % (adres, anahtar, anahtar,
               'data-hkm="1"' if hkm else 'data-yokla="%s"' % adres,
               anahtar, _kac(kisa), _kac(ad), _kac(aciklama), port,
               "Başlat" if hkm else "Aç"))
    s = guncelle.surum()
    surum = ("sürüm %s · %s" % (s["kisa"], s["tarih"])) if s else "zip sürümü"
    return (GIRIS_SAYFASI.replace("__KARTLAR__", "\n  ".join(kartlar))
            .replace("__SURUM__", _kac(surum)).replace("__IKON__", _IKON))


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
        if yol not in ("/api/guncelle", "/api/hkm", "/api/yeniden"):
            return self.send_error(404)
        if not guncelleme_izinli(self.headers):
            return self._json(403, {"durum": "engel", "mesaj": "İzin yok."})
        if yol == "/api/hkm":
            return self._json(200, hkm_ac())
        if yol == "/api/yeniden":
            yeniden_baslat_zamanla()
            return self._json(200, {"ok": True})
        with _GUNCEL_KILIT:
            sonuc = guncelle.uygula()
            _GUNCEL.update(zaman=0.0, veri=None)
        return self._json(200, sonuc)

    def do_GET(self):
        yol = self.path.split("?", 1)[0]
        if yol == "/api/guncelleme":
            return self._json(200, guncelleme_durumu(taze="taze=1" in self.path))
        if yol == "/api/durum":
            return self._json(200, {"hkm": hkm_ayakta()})
        if yol.startswith("/logo/"):
            return self._logo(yol[len("/logo/"):])
        if yol.startswith("/marka/"):
            return self._marka(yol[len("/marka/"):])
        govde = giris_html().encode("utf-8")
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
