# -*- coding: utf-8 -*-
"""GUN — besinci bolum: gunu kurmak ve gidisi gormek (Gun plani F2).

Yeni surec ya da port ACMAZ (plan §2c): giris sunucusu (sistem/sunucu.py,
4180) `/gun/` yolunda sunar. Kenar cubugu modullerle AYNI (brand/ortak/kabuk.js
kenarCubugu; kullanici 2026-11-03: «sol taraftaki kenar cubugu ayni kalsin»);
ana alan Gun'e ozgu, plandaki taslak (§2): ustte niyet, enerji pili, ic hava;
ortada gunun seridi (07-23, «simdi» cizgisi, Yaptiklarim / Yapacaklarim);
altinda alan cubuklari, «Simdi ne yapsam?» ve haftanin hayat karnesi.

Dürüstluk (plan §9.3): Gun 4180 kokenindedir, modullerin kaydini okuyamaz
(plan §11); veri gelene kadar her alan «veri yok»tur, sifir degil. Niyet,
enerji ve ic hava SENIN GIRDIGIN degerlerdir (bu tarayicida, gun basina).
«Simdi ne yapsam?» yalniz saate bakar ve bunu soyler."""

# Kenarin ve sayfanin istedigi ortak dosyalar: kapali liste (URL'den yol kurulmaz).
ORTAK = {
    "jeton.css": "text/css; charset=utf-8", "base.css": "text/css; charset=utf-8",
    "layout.css": "text/css; charset=utf-8", "temel.css": "text/css; charset=utf-8",
    "kabuk.css": "text/css; charset=utf-8", "kabuk.js": "text/javascript; charset=utf-8",
    "cam.css": "text/css; charset=utf-8", "hareket.css": "text/css; charset=utf-8",
    "gunveri.js": "text/javascript; charset=utf-8",
}


def gun_html(tema=None, host="127.0.0.1"):
    sayfa = GUN_SAYFASI.replace("__HOST__", host)
    if tema in ("light", "dark"):
        sayfa = sayfa.replace('<html lang="tr">', '<html lang="tr" data-theme="%s">' % tema, 1)
    return sayfa


GUN_SAYFASI = r"""<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Gün — LifeOS</title>
<link rel="stylesheet" href="/gun/ortak/jeton.css"/>
<link rel="stylesheet" href="/gun/ortak/base.css"/>
<link rel="stylesheet" href="/gun/ortak/layout.css"/>
<link rel="stylesheet" href="/gun/ortak/temel.css"/>
<link rel="stylesheet" href="/gun/ortak/kabuk.css"/>
<link rel="stylesheet" href="/gun/ortak/hareket.css"/>
<link rel="stylesheet" href="/gun/ortak/cam.css"/>
<style>
/* Gun'un kimligi: Merkez'in moru (Merkez F7'de cekilince yerini Gun alir). */
:root{ --mod:var(--mer); --mod-ink:var(--mer-ink); --mod-t:var(--mer-t);
  --g-uyku:var(--spi); --g-beslenme:var(--spi); --g-hareket:var(--spi); --g-calisma:var(--ays); --g-okuma:var(--esp); }
/* King ve Ayarlar Gun'e henuz gelmedi (F3a): kenarda olmayan ise dugme gostermez. */
.site--gun .kenar [data-king-ac], .site--gun .kenar [data-act="open-appearance"],
.site--gun .kenar [data-cekmece="menu"], .site--gun .ust__king, .site--gun .ust [data-act="open-appearance"]{ display:none !important; }

.gun{ position:relative; max-width:1080px; margin:0 auto; padding:clamp(18px, 3vw, 36px) clamp(16px, 3vw, 32px) 64px; }
.gun::before{ content:""; position:absolute; inset:-40px -6% auto; height:380px; z-index:-1; pointer-events:none;
  -webkit-mask-image:radial-gradient(75% 80% at 50% 20%, #000 35%, transparent 80%); mask-image:radial-gradient(75% 80% at 50% 20%, #000 35%, transparent 80%);
  background:radial-gradient(60% 70% at 20% 0%, color-mix(in oklab, var(--mer) 22%, transparent), transparent 70%),
             radial-gradient(50% 60% at 85% 10%, color-mix(in oklab, var(--esp) 14%, transparent), transparent 70%); }
.gun-bas{ display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:22px; }
.gun-selam{ margin:0; font-size:clamp(26px, 3.2vw, 36px); font-weight:700; letter-spacing:-.025em; line-height:1.1; }
.gun-tarih{ margin:6px 0 0; color:var(--text-2); font-size:15px; }
.gun-merkez{ display:inline-flex; align-items:center; gap:8px; padding:6px 12px; border-radius:999px; font-size:12.5px; color:var(--text-2);
  background:color-mix(in oklab, var(--surface) 70%, transparent); box-shadow:inset 0 0 0 1px var(--border); }
.gun-merkez i{ width:7px; height:7px; border-radius:50%; background:var(--text-3); }
.gun-merkez[data-hal="acik"] i{ background:var(--ok, #1a7f5a); }

.gun-kart{ position:relative; border-radius:20px; background:color-mix(in oklab, var(--surface) 88%, transparent);
  box-shadow:inset 0 0 0 1px var(--border), 0 1px 2px rgba(16,24,40,.04), 0 12px 32px -22px rgba(16,24,40,.25); }
.gun-kart__ad{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin:0 0 10px; font-size:12.5px; font-weight:650;
  letter-spacing:.02em; text-transform:uppercase; color:var(--text-3); }
.gun-kart__ad small{ text-transform:none; letter-spacing:0; font-weight:500; }

/* ust sira: niyet · enerji · ic hava */
.gun-ust{ display:grid; grid-template-columns:1.6fr 1fr 1.2fr; gap:12px; margin-bottom:12px; }
.gun-ust > .gun-kart{ padding:16px 18px; }
.gun-niyet{ width:100%; border:0; padding:0; background:transparent; color:var(--text); font:inherit; font-size:18px; font-weight:600; letter-spacing:-.01em; }
.gun-niyet::placeholder{ color:var(--text-3); font-weight:500; }
.gun-niyet:focus{ outline:none; }
.gun-pil{ display:flex; align-items:center; gap:10px; }
.gun-pil__govde{ position:relative; flex:none; display:grid; grid-template-columns:repeat(5, 1fr); gap:3px; width:min(132px, 60%); height:34px; padding:4px;
  border-radius:9px; box-shadow:inset 0 0 0 2px var(--text-3); }
.gun-pil__govde::after{ content:""; position:absolute; right:-6px; top:11px; width:4px; height:12px; border-radius:0 3px 3px 0; background:var(--text-3); }
.gun-pil button{ border:0; padding:0; border-radius:4px; background:color-mix(in oklab, var(--text) 8%, transparent); cursor:pointer;
  transition:background .25s ease, transform .2s cubic-bezier(.22,1,.36,1); }
.gun-pil button:hover{ transform:scaleY(1.08); }
.gun-pil[data-v="1"] button:nth-child(-n+1), .gun-pil[data-v="2"] button:nth-child(-n+2){ background:#e5484d; }
.gun-pil[data-v="3"] button:nth-child(-n+3){ background:#f2a93b; }
.gun-pil[data-v="4"] button:nth-child(-n+4), .gun-pil[data-v="5"] button:nth-child(-n+5){ background:#30a46c; }
.gun-pil__metin{ font-size:13px; color:var(--text-2); white-space:nowrap; }
.gun-hava{ display:flex; gap:6px; }
.gun-hava button{ flex:1; display:grid; place-items:center; gap:2px; min-height:52px; padding:6px 2px; border:0; border-radius:12px; background:transparent;
  color:var(--text-2); font:inherit; font-size:11px; cursor:pointer; transition:background .2s ease, transform .25s cubic-bezier(.22,1,.36,1), color .2s; }
.gun-hava button svg{ width:22px; height:22px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
.gun-hava button:hover{ background:var(--surface-2); transform:translateY(-1px); }
.gun-hava button[aria-pressed="true"]{ background:var(--mod-t); color:var(--mod-ink); box-shadow:inset 0 0 0 1.5px var(--mod); }
.gun-senin{ margin:8px 0 0; font-size:11.5px; color:var(--text-3); }

/* gunun seridi */
.gun-serit{ padding:18px 20px 16px; margin-bottom:12px; }
.gun-serit__ust{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
.gun-serit__ust h2{ margin:0; font-size:18px; font-weight:680; letter-spacing:-.015em; }
.gun-gecis{ display:inline-flex; padding:3px; border-radius:999px; background:var(--surface-2); }
.gun-gecis button{ min-height:30px; padding:0 14px; border:0; border-radius:999px; background:transparent; color:var(--text-2); font:inherit; font-size:13px; font-weight:600;
  cursor:pointer; transition:background .25s ease, color .2s, box-shadow .25s; }
.gun-gecis button[aria-pressed="true"]{ background:var(--surface); color:var(--text); box-shadow:0 1px 3px rgba(16,24,40,.12); }
.gun-saat{ position:relative; height:132px; margin-top:30px; }
.gun-saat__izgara{ position:absolute; inset:0 0 22px; display:grid; grid-template-columns:repeat(16, 1fr); }
.gun-saat__izgara span{ border-left:1px dashed color-mix(in oklab, var(--text) 10%, transparent); }
.gun-saat__izgara span:first-child{ border-left-color:transparent; }
.gun-saat__etiket{ position:absolute; left:0; right:0; bottom:0; display:grid; grid-template-columns:repeat(16, 1fr); font-size:11px; color:var(--text-3);
  font-variant-numeric:tabular-nums; }
.gun-saat__gecmis{ position:absolute; top:0; bottom:22px; left:0; width:var(--simdi, 0%); border-radius:12px 0 0 12px;
  background:linear-gradient(90deg, color-mix(in oklab, var(--mod) 4%, transparent), color-mix(in oklab, var(--mod) 12%, transparent));
  transition:width .6s cubic-bezier(.22,1,.36,1), opacity .35s; }
.gun-saat[data-gorunum="yapacak"] .gun-saat__gecmis{ opacity:.35; }
.gun-saat__simdi{ position:absolute; top:-4px; bottom:18px; left:var(--simdi, 0%); width:2px; margin-left:-1px; background:var(--mod); border-radius:2px;
  transition:left .6s cubic-bezier(.22,1,.36,1); }
.gun-saat__simdi::before{ content:""; position:absolute; top:-3px; left:-4px; width:10px; height:10px; border-radius:50%; background:var(--mod);
  box-shadow:0 0 0 4px color-mix(in oklab, var(--mod) 22%, transparent); animation:gun-nabiz 2.4s ease-in-out infinite; }
.gun-saat__simdi b{ position:absolute; top:-26px; left:8px; padding:2px 7px; border-radius:6px; background:var(--mod); color:#fff; font-size:11px;
  font-weight:650; font-variant-numeric:tabular-nums; white-space:nowrap; }
@keyframes gun-nabiz{ 50%{ box-shadow:0 0 0 7px color-mix(in oklab, var(--mod) 8%, transparent); } }
.gun-saat__bos{ position:absolute; inset:24px 8% 40px; display:grid; place-items:center; text-align:center; font-size:13.5px; color:var(--text-2); }
.gun-saat__bos small{ display:block; margin-top:2px; color:var(--text-3); font-size:12px; }

/* alan cubuklari */
.gun-alanlar{ display:grid; grid-template-columns:repeat(5, 1fr); gap:8px; margin-bottom:12px; }
.gun-alan{ display:grid; gap:8px; padding:12px 14px; border:0; border-radius:16px; text-align:left; font:inherit; color:var(--text); cursor:pointer;
  background:color-mix(in oklab, var(--surface) 88%, transparent); box-shadow:inset 0 0 0 1px var(--border);
  transition:transform .3s cubic-bezier(.22,1,.36,1), box-shadow .25s ease; }
.gun-alan:hover{ transform:translateY(-2px); }
.gun-alan[aria-pressed="true"]{ box-shadow:inset 0 0 0 2px var(--renk); }
.gun-alan b{ display:flex; align-items:center; gap:7px; font-size:13.5px; font-weight:650; }
.gun-alan b i{ width:8px; height:8px; border-radius:50%; background:var(--renk); }
.gun-alan__cubuk{ height:8px; border-radius:99px;
  background:repeating-linear-gradient(135deg, color-mix(in oklab, var(--renk) 18%, transparent) 0 5px, transparent 5px 10px); box-shadow:inset 0 0 0 1px color-mix(in oklab, var(--renk) 30%, transparent); }
.gun-alan small{ font-size:11.5px; color:var(--text-3); }

/* alt sira: simdi ne yapsam · hayat karnesi */
.gun-alt{ display:grid; grid-template-columns:1fr 1.35fr; gap:12px; }
.gun-oneri{ padding:18px 20px; overflow:hidden;
  background:linear-gradient(150deg, color-mix(in oklab, var(--mod) 16%, var(--surface)), color-mix(in oklab, var(--surface) 92%, transparent) 70%); }
.gun-oneri h3{ margin:4px 0 6px; font-size:20px; font-weight:700; letter-spacing:-.02em; }
.gun-oneri p{ margin:0 0 14px; color:var(--text-2); font-size:14px; }
.gun-oneri a{ display:inline-flex; align-items:center; gap:6px; min-height:36px; padding:0 16px; border-radius:999px; background:var(--mod); color:#fff;
  text-decoration:none; font-size:13.5px; font-weight:650; transition:transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s; }
.gun-oneri a:hover{ transform:translateY(-1px); box-shadow:0 8px 20px -10px var(--mod); }
.gun-karne{ padding:18px 20px; }
.gun-karne__izgara{ display:grid; grid-template-columns:76px repeat(7, 1fr); gap:5px; align-items:center; font-size:11.5px; }
.gun-karne__izgara > span{ color:var(--text-3); text-align:center; }
.gun-karne__izgara > span.is-bugun{ color:var(--mod-ink); font-weight:700; }
.gun-karne__izgara > b{ font-weight:600; color:var(--text-2); font-size:12px; }
.gun-kare{ aspect-ratio:1; max-height:26px; border-radius:7px; box-shadow:inset 0 0 0 1.5px color-mix(in oklab, var(--text) 14%, transparent);
  background:repeating-linear-gradient(135deg, color-mix(in oklab, var(--text) 7%, transparent) 0 3px, transparent 3px 6px); }
.gun-kare.is-bugun{ box-shadow:inset 0 0 0 1.5px var(--mod); }
.gun-lejant{ display:flex; gap:14px; margin-top:12px; font-size:11.5px; color:var(--text-3); flex-wrap:wrap; }
.gun-lejant i{ display:inline-block; width:10px; height:10px; margin-right:5px; border-radius:3px; vertical-align:-1px; }

/* seritteki bloklar (F3a: hesap sunucusundaki «tek gun», sunucu sozu 22) */
.gun-blok{ position:absolute; left:var(--x); top:calc(8px + var(--serit, 0) * 34px); transform:translateX(-6px); display:inline-flex; align-items:center; gap:6px;
  max-width:24%; height:28px; padding:0 10px 0 8px; border-radius:9px; font-size:12px; font-weight:600; color:var(--text); text-decoration:none; white-space:nowrap;
  background:color-mix(in oklab, var(--renk) 10%, var(--surface)); box-shadow:inset 3px 0 0 var(--renk), inset 0 0 0 1px color-mix(in oklab, var(--renk) 30%, transparent);
  animation:gun-gel .45s cubic-bezier(.22,1,.36,1) both; animation-delay:calc(var(--i, 0) * 50ms); transition:transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s; z-index:1; }
.gun-blok span{ overflow:hidden; text-overflow:ellipsis; }
.gun-blok small{ color:var(--text-3); font-weight:500; font-variant-numeric:tabular-nums; }
.gun-blok:hover{ transform:translate(-6px, -2px); z-index:2; }
.gun-blok[data-durum="bitti"]{ background:color-mix(in oklab, var(--renk) 22%, var(--surface)); }
.gun-blok[data-durum="bitti"]::before{ content:"✓"; color:var(--renk); font-weight:800; }
.gun-blok[data-durum="atlandi"]{ opacity:.55; text-decoration:line-through; }
.gun-blok[data-durum="vakti"]{ box-shadow:inset 3px 0 0 var(--renk), 0 0 0 2px color-mix(in oklab, var(--renk) 45%, transparent); }
.gun-saatsiz{ display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; }
.gun-saatsiz > span{ font-size:11.5px; font-weight:650; color:var(--text-3); align-self:center; margin-right:2px; }
.gun-saatsiz .gun-blok{ position:static; transform:none; max-width:none; animation-delay:0s; }
.gun-saatsiz .gun-blok:hover{ transform:translateY(-2px); }
.gun-notlar{ margin:10px 0 0; padding:0; list-style:none; font-size:12px; color:var(--text-3); }
.gun-alan__cubuk.is-dolu{ background:var(--renk); box-shadow:none; }
.gun-alan__cubuk.is-kayitsiz{ background:transparent; box-shadow:inset 0 0 0 1.5px color-mix(in oklab, var(--renk) 45%, transparent); }
.gun-alan small b{ color:var(--text); font-weight:650; }
.gun-kare.is-yapildi{ background:var(--renk); box-shadow:none; }
.gun-kare.is-kayit-yok{ background:transparent; box-shadow:inset 0 0 0 1.5px color-mix(in oklab, var(--renk) 40%, transparent); }
.gun-kare.is-gelecek{ background:transparent; box-shadow:inset 0 0 0 1px color-mix(in oklab, var(--text) 8%, transparent); }
.gun-kare.is-bugun{ outline:2px solid var(--mod); outline-offset:1px; }

/* Gecmis ve Sen */
.gun-bos{ display:grid; justify-items:center; gap:10px; padding:56px 24px; text-align:center; }
.gun-bos svg{ width:40px; height:40px; fill:none; stroke:var(--mod); stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
.gun-bos h2{ margin:0; font-size:22px; letter-spacing:-.02em; }
.gun-bos p{ margin:0; max-width:460px; color:var(--text-2); }

.gun-gir > *{ animation:gun-gel .55s cubic-bezier(.22,1,.36,1) both; animation-delay:calc(var(--i, 0) * 60ms); }
@keyframes gun-gel{ from{ opacity:0; transform:translateY(10px); } }
@media (max-width:900px){ .gun-ust{ grid-template-columns:1fr 1fr; } .gun-ust > :first-child{ grid-column:1 / -1; } .gun-alt{ grid-template-columns:1fr; }
  .gun-alanlar{ grid-template-columns:repeat(3, 1fr); } }
@media (max-width:560px){ .gun-ust{ grid-template-columns:1fr; } .gun-alanlar{ grid-template-columns:repeat(2, 1fr); } .gun-saat{ height:110px; }
  .gun-saat__etiket span:nth-child(even){ visibility:hidden; } }
@media (prefers-reduced-motion:reduce){ .gun-gir > *{ animation:none; } .gun-saat__simdi::before{ animation:none; }
  .gun-alan, .gun-hava button, .gun-pil button, .gun-oneri a{ transition:none; } .gun-alan:hover, .gun-hava button:hover{ transform:none; } }
</style>
</head>
<body>
<a class="skiplink" href="#main">İçeriğe atla</a>
<div id="app"></div>
<div id="overlay-root"></div>
<script src="/gun/ortak/kabuk.js"></script>
<script src="/gun/ortak/gunveri.js"></script>
<script>
(function(){
  'use strict';
  var L = window.LIFEOS || {}, K = L.KABUK;
  var HOST = '__HOST__';
  var BOLUM = [{ id:'bugun', ad:'Bugün' }, { id:'analiz', ad:'Geçmiş' }, { id:'calisma', ad:'Sen' }];
  var ALANLAR = [['uyku', 'Uyku', 'spi'], ['beslenme', 'Beslenme', 'spi'], ['hareket', 'Hareket', 'spi'], ['calisma', 'Çalışma', 'ays'], ['gelisim', 'Gelişim', 'esp']];
  var MAD = { ays:'AYS', spi:'SPİ', esp:'ESP' }, MPORT = { ays:4173, spi:4183, esp:4193 }, SERIT_SIRA = { ays:0, spi:1, esp:2 };
  var DILIM_AD = { sabah:'Sabah', ogle:'Öğle', aksam:'Akşam', gece:'Gece', gun:'Gün içinde' };
  function adres(m, rota){ return 'http://' + HOST + ':' + MPORT[m] + '/' + (rota ? '#king=' + rota : ''); }
  function oturum(){ var m = document.cookie.match(/(?:^|;\s*)lifeos_hesap=([^;]*)/); if(!m) return null;
    try{ var o = JSON.parse(decodeURIComponent(m[1])); return o && o.j ? o : null; }catch(e){ return null; } }
  function api(yol){ var o = oturum(); if(!o) return Promise.reject({ kod:401 });
    return fetch((o.s || '') + yol, { headers:{ Authorization:'Bearer ' + o.j }, cache:'no-store', credentials:'omit' })
      .then(function(r){ if(r.status === 401) throw { kod:401 }; if(!r.ok) throw { kod:r.status }; return r.json(); }); }
  function simdiISO(){ var d = new Date(); return bugun() + 'T' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':00'; }
  function yukle(){
    if(!GV){ veri.durum = 'hata'; return; }
    if(!oturum()){ veri.durum = 'girisyok'; veri.karne = GV.karne(null, bugun()); ciz(); return; }
    Promise.all([api('/api/hesap/tekgun').catch(function(e){ return e && e.kod === 401 ? Promise.reject(e) : null; }),
                 api('/api/hesap/gunluk').catch(function(e){ return e && e.kod === 401 ? Promise.reject(e) : null; })])
      .then(function(r){ veri.serit = GV.serit(r[0], simdiISO()); veri.karne = GV.karne(r[1], bugun()); veri.durum = 'hazir';
        return api('/api/hesap/gunkayit').then(function(g){
          var y = oku();
          if(g && !g.bayat && (g.niyet || g.enerji || g.hava)) yazYerel({ niyet:g.niyet || undefined, enerji:g.enerji || undefined, hava:g.hava || undefined });
          else if(y.niyet || y.enerji || y.hava) gonder();      // girişten önce girilen yukarı çıkar
        }).catch(function(){}); })
      .then(function(){ if(veri.durum === 'hazir') ciz(); })
      .catch(function(){ veri.durum = 'girisyok'; veri.karne = GV.karne(null, bugun()); ciz(); });
  }
  var HAVA = [['gunes', 'Güneşli', '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>'],
    ['parcali', 'Parçalı', '<path d="M8 6.5a3.5 3.5 0 0 1 6.3-1"/><path d="M7 18h10a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.5A3.3 3.3 0 0 0 7 18z"/>'],
    ['bulut', 'Bulutlu', '<path d="M7 18h10a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.5A3.3 3.3 0 0 0 7 18z"/>'],
    ['yagmur', 'Yağmurlu', '<path d="M7 15h10a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.5A3.3 3.3 0 0 0 7 15z"/><path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2"/>'],
    ['firtina', 'Fırtına', '<path d="M7 14h10a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.5A3.3 3.3 0 0 0 7 14z"/><path d="M12.5 15l-2 3.5h3l-2 3.5"/>']];
  var PIL = ['', 'Bitkin', 'Düşük', 'Orta', 'İyi', 'Dolu'];
  var GUN = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  var gorunum = 'yaptim', secAlan = null, merkez = null, ilk = true;
  /* F3a: hesap sunucusundan uc modulun bugunu ve gunluk ozeti (oturum cerezi, giris sayfasiyla ortak). */
  var veri = { durum:'bekle', serit:null, karne:null };
  var GV = L.GunVeri;
  function kac(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function bugun(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  /* Senin girdigin: bu tarayicida, gun basina (F3a'da King ve modullerle paylasilacak). */
  var ANAHTAR = 'lifeos.gun.' + bugun();
  function oku(){ try{ return JSON.parse(localStorage.getItem(ANAHTAR) || '{}') || {}; }catch(e){ return {}; } }
  function yazYerel(o){ try{ localStorage.setItem(ANAHTAR, JSON.stringify(o)); }catch(e){} }
  /* Niyet, enerji, ic hava hesap sunucusunda da durur (sunucu sozu 26): King her modulde okur ve yazar. */
  var gonderSaat = null;
  function gonder(){
    clearTimeout(gonderSaat);
    gonderSaat = setTimeout(function(){
      var o = oturum(), v = oku();
      if(!o) return;
      fetch((o.s || '') + '/api/hesap/yayin', { method:'POST', cache:'no-store', credentials:'omit',
        headers:{ 'Content-Type':'application/json', 'X-LifeOS':'hesap', Authorization:'Bearer ' + o.j },
        body:JSON.stringify({ ad:'gun/kayit', gun:bugun(), icerik:JSON.stringify({ niyet:v.niyet || '', enerji:v.enerji || null, hava:v.hava || null }) }) })
        .catch(function(){ /* sunucu yok: yerelde kalir, sonraki degisiklikte yeniden denenir */ });
    }, 500);
  }
  function yaz(k, v){ var o = oku(); if(v === null || v === '') delete o[k]; else o[k] = v; yazYerel(o); gonder(); }
  function bolum(){ var h = (location.hash || '').slice(1); return BOLUM.some(function(b){ return b.id === h; }) ? h : 'bugun'; }
  function simdiYuzde(){ var d = new Date(), s = d.getHours() + d.getMinutes() / 60; return Math.max(0, Math.min(100, (s - 7) / 16 * 100)); }
  function saatMetni(){ var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function selam(){ var s = new Date().getHours(); return s < 5 ? 'İyi geceler' : s < 12 ? 'Günaydın' : s < 18 ? 'İyi günler' : 'İyi akşamlar'; }
  /* Simdi ne yapsam? — YALNIZ saate bakar (veri yok); bunu kartta soyler. */
  function oneri(){
    var x = veri.serit && GV ? GV.siradaki(veri.serit, simdiISO()) : null;
    if(x) return { bas:x.ad, ne:'Sıradaki: ' + MAD[x.modul] + (x.saat ? ' · ' + x.saat : ' · ' + DILIM_AD[x.dilim]) + (x.alt ? ' · ' + x.alt : '') + '. Modül kendi planından verdi.',
      ad:MAD[x.modul] + '’de aç', href:adres(x.modul, x.rota), kaynak:'planından' };
    var s = new Date().getHours(), v = oku();
    if(!v.niyet && s >= 5 && s < 12) return { bas:'Günün niyetini yaz', ne:'Sabah: bugün neyi bitirirsen gün iyi geçmiş olur? Tek cümle yeter.', ad:'Niyete git', href:'#bugun', odak:true };
    if(s < 7 || s >= 23) return { bas:'Dinlen', ne:'Gece: yarına enerji bırak. Uykunu SPİ’de kaydedebilirsin.', ad:'SPİ’yi aç', href:'http://' + HOST + ':4183/' };
    if(s < 12) return { bas:'Derin çalışma bloğu', ne:'Sabah dikkat en tazeyken: AYS’de bir çalışma oturumu aç.', ad:'AYS’yi aç', href:'http://' + HOST + ':4173/' };
    if(s < 14) return { bas:'Öğle: ye ve yürü', ne:'Öğününü ve kısa bir yürüyüşü SPİ’ye yaz.', ad:'SPİ’yi aç', href:'http://' + HOST + ':4183/' };
    if(s < 19) return { bas:'İkinci blok', ne:'Öğleden sonra: AYS’de soru çöz ya da ESP’de bir ders.', ad:'AYS’yi aç', href:'http://' + HOST + ':4173/' };
    return { bas:'Oku ve günü kapat', ne:'Akşam: ESP’de biraz oku, sonra günü kapat.', ad:'ESP’yi aç', href:'http://' + HOST + ':4193/' };
  }
  function ustHtml(v){
    var pil = Number(v.enerji) || 0;
    return '<div class="gun-ust">'
      + '<section class="gun-kart" style="--i:1"><h2 class="gun-kart__ad">Günün niyeti</h2>'
      + '<input class="gun-niyet" id="gun-niyet" maxlength="120" placeholder="Bugün neyi bitirirsem gün iyi geçmiş olur?" value="' + kac(v.niyet || '') + '" aria-label="Günün niyeti"/>'
      + '<p class="gun-senin">Senin yazdığın · bu tarayıcıda</p></section>'
      + '<section class="gun-kart" style="--i:2"><h2 class="gun-kart__ad">Enerji pili</h2><div class="gun-pil" data-v="' + pil + '">'
      + '<div class="gun-pil__govde" role="group" aria-label="Enerji">' + [1, 2, 3, 4, 5].map(function(n){
          return '<button type="button" data-pil="' + n + '" aria-label="Enerji ' + n + '/5: ' + PIL[n] + '" aria-pressed="' + (n === pil) + '"></button>'; }).join('') + '</div>'
      + '<span class="gun-pil__metin">' + (pil ? PIL[pil] : 'veri yok') + '</span></div><p class="gun-senin">Senin girdiğin</p></section>'
      + '<section class="gun-kart" style="--i:3"><h2 class="gun-kart__ad">İç hava</h2><div class="gun-hava" role="group" aria-label="İç hava">'
      + HAVA.map(function(h){ var on = v.hava === h[0];
          return '<button type="button" data-hava="' + h[0] + '" aria-pressed="' + on + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + h[2] + '</svg>' + h[1] + '</button>'; }).join('')
      + '</div><p class="gun-senin">Senin girdiğin</p></section></div>';
  }
  function blokHtml(x, i){
    return '<a class="gun-blok" href="' + kac(adres(x.modul, x.rota)) + '" data-durum="' + x.durum + '" style="--renk:var(--' + x.modul + ');--serit:' + SERIT_SIRA[x.modul]
      + (x.yuzde == null ? '' : ';--x:' + x.yuzde.toFixed(2) + '%') + ';--i:' + i + '" title="' + kac(MAD[x.modul] + ' · ' + x.ad + (x.alt ? ' · ' + x.alt : '') + (x.saat ? ' · ' + x.saat : '')) + '">'
      + '<span>' + kac(x.ad) + '</span>' + (x.saat ? '<small>' + x.saat + '</small>' : '') + '</a>';
  }
  function gorunsun(x){
    if(secAlan){ var m = ALANLAR.filter(function(a){ return a[0] === secAlan; })[0][2]; if(x.modul !== m) return false; }
    return gorunum === 'yaptim' ? (x.durum === 'bitti' || x.durum === 'atlandi') : (x.durum === 'bekliyor' || x.durum === 'vakti');
  }
  function seritHtml(){
    var saatler = []; for(var h = 7; h <= 22; h++) saatler.push(h);
    var sr = veri.serit, saatli = sr ? sr.bloklar.filter(gorunsun) : [], saatsiz = sr ? sr.saatsiz.filter(gorunsun) : [];
    var bos = veri.durum === 'bekle' ? 'Üç modülün bugünü getiriliyor…<small>&nbsp;</small>'
      : veri.durum === 'girisyok' ? 'Hesabınla giriş yapılmamış: veri yok<small>Giriş sayfasından hesabına girince AYS, SPİ ve ESP’nin bugünkü blokları burada dizilir</small>'
      : veri.durum === 'hata' ? 'Veri katmanı yüklenemedi<small>Sayfayı yenile</small>'
      : (gorunum === 'yaptim' ? 'Bugün biten blok yok' : 'Bekleyen blok yok') + '<small>' + (secAlan ? 'Bu alanda; alanı yeniden seçince hepsi döner' : 'Modüller bugün için plan yayınladıkça burada belirir') + '</small>';
    return '<section class="gun-kart gun-serit" style="--i:4"><div class="gun-serit__ust"><h2>Günün şeridi</h2>'
      + '<div class="gun-gecis" role="group" aria-label="Şerit">'
      + '<button type="button" data-gorunum="yaptim" aria-pressed="' + (gorunum === 'yaptim') + '">Yaptıklarım</button>'
      + '<button type="button" data-gorunum="yapacak" aria-pressed="' + (gorunum === 'yapacak') + '">Yapacaklarım</button></div></div>'
      + '<div class="gun-saat" data-gorunum="' + gorunum + '" style="--simdi:' + simdiYuzde().toFixed(2) + '%">'
      + '<div class="gun-saat__izgara" aria-hidden="true">' + saatler.map(function(){ return '<span></span>'; }).join('') + '</div>'
      + '<div class="gun-saat__gecmis" aria-hidden="true"></div>'
      + '<div class="gun-saat__simdi" aria-hidden="true"><b id="gun-simdi">' + saatMetni() + '</b></div>'
      + (saatli.length ? saatli.map(blokHtml).join('') : (saatsiz.length ? '' : '<div class="gun-saat__bos">' + bos + '</div>'))
      + '<div class="gun-saat__etiket" aria-hidden="true">' + saatler.map(function(h){ return '<span>' + ('0' + h).slice(-2) + '</span>'; }).join('') + '</div>'
      + '</div>'
      + (saatsiz.length ? '<div class="gun-saatsiz"><span>Saati yok</span>' + saatsiz.map(function(x, i){ return blokHtml(x, i).replace('<span>', '<span>' + kac(DILIM_AD[x.dilim]) + ' · '); }).join('') + '</div>' : '')
      + (sr && sr.notlar.length ? '<ul class="gun-notlar">' + sr.notlar.map(function(n){ return '<li>' + kac(n) + '</li>'; }).join('') + '</ul>' : '')
      + '</section>';
  }
  function alanlarHtml(){
    var oz = veri.karne ? veri.karne.bugunOzet : {};
    var hal = function(a){ var k = veri.karne && veri.karne.satirlar.filter(function(x){ return x.alan === a[0]; })[0]; return k ? k.hucreler[veri.karne.bugun] : 'veri-yok'; };
    return '<div class="gun-alanlar" role="group" aria-label="Alanlar" style="--i:5">' + ALANLAR.map(function(a){
      var h = hal(a), v = oz[a[0]];
      var alt = h === 'yapildi' ? '<b>' + v + ' dk</b> · ölçüldü · ' + MAD[a[2]] : h === 'kayit-yok' ? 'bugün kayıt yok · ' + MAD[a[2]] : 'veri yok · ' + MAD[a[2]];
      return '<button type="button" class="gun-alan" data-alan="' + a[0] + '" aria-pressed="' + (secAlan === a[0]) + '" style="--renk:var(--' + a[2] + ')">'
        + '<b><i aria-hidden="true"></i>' + a[1] + '</b><span class="gun-alan__cubuk' + (h === 'yapildi' ? ' is-dolu' : h === 'kayit-yok' ? ' is-kayitsiz' : '') + '" aria-hidden="true"></span><small>' + alt + '</small></button>'; }).join('') + '</div>';
  }
  function altHtml(){
    var o = oneri(), k = veri.karne, bugunNo = k ? k.bugun : (new Date().getDay() + 6) % 7;
    var HAL_AD = { 'yapildi':'yapıldı', 'kayit-yok':'kayıt yok', 'veri-yok':'veri yok', 'gelecek':'henüz gelmedi' };
    var dolu = k && k.satirlar.some(function(x){ return x.hucreler.indexOf('yapildi') >= 0 || x.hucreler.indexOf('kayit-yok') >= 0; });
    return '<div class="gun-alt"><section class="gun-kart gun-oneri" style="--i:6"><h2 class="gun-kart__ad">Şimdi ne yapsam?<small>' + (o.kaynak || 'saate göre') + '</small></h2>'
      + '<h3>' + kac(o.bas) + '</h3><p>' + kac(o.ne) + '</p><a href="' + kac(o.href) + '"' + (o.odak ? ' data-odak-niyet' : '') + '>' + kac(o.ad) + ' →</a></section>'
      + '<section class="gun-kart gun-karne" style="--i:7"><h2 class="gun-kart__ad">Haftanın hayat karnesi<small>' + (dolu ? 'modüllerin günlük özetinden' : 'veri yok') + '</small></h2>'
      + '<div class="gun-karne__izgara"><b></b>'
      + GUN.map(function(g, i){ return '<span' + (i === bugunNo ? ' class="is-bugun"' : '') + '>' + g + '</span>'; }).join('')
      + ALANLAR.map(function(a, r){ var sat = k ? k.satirlar[r] : null;
          return '<b>' + a[1] + '</b>' + GUN.map(function(g, i){ var h = sat ? sat.hucreler[i] : 'veri-yok', d = sat ? sat.degerler[i] : null;
            return '<i class="gun-kare is-' + h + (i === bugunNo ? ' is-bugun' : '') + '" style="--renk:var(--' + a[2] + ')" title="' + a[1] + ' · ' + g + ': ' + HAL_AD[h] + (d != null && h === 'yapildi' ? ' (' + d + ' dk)' : '') + '" role="img" aria-label="' + a[1] + ' ' + g + ': ' + HAL_AD[h] + '"></i>'; }).join(''); }).join('')
      + '</div><div class="gun-lejant"><span><i style="background:var(--mod)"></i>yapıldı</span>'
      + '<span><i style="box-shadow:inset 0 0 0 1.5px var(--text-3)"></i>kayıt yok</span>'
      + '<span><i class="gun-kare" style="display:inline-block;width:10px;height:10px"></i>veri yok</span></div>'
      + '<p class="gun-senin">Uyku, beslenme ve hareket: SPİ henüz günlük özet yayınlamıyor.</p></section></div>';
  }
  function bosHtml(b){
    var t = b === 'analiz'
      ? ['Geçmiş', 'Nasıl gidiyor? Hayat karnesi, günün şekli, ayın dokuması ve plan ile gerçeğin karşılaştırması burada toplanacak.', '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>']
      : ['Sen', 'Ne seni besliyor? Kendi sözün, enerji veren ve çalan şeyler, «Ne yapsam?» destesi burada olacak.', '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'];
    return '<section class="gun-kart gun-bos" style="--i:1"><svg viewBox="0 0 24 24" aria-hidden="true">' + t[2] + '</svg><h2>' + t[0] + '</h2><p>' + t[1] + '</p>'
      + '<p style="font-size:13px;color:var(--text-3)">Henüz kurulmadı · veriler AYS, SPİ ve ESP’den gelecek</p></section>';
  }
  function ciz(){
    if(document.activeElement && document.activeElement.id === 'gun-niyet') return;   // yazarken tazeleme kutuyu silmez
    var b = bolum(), v = oku();
    var cek = BOLUM.map(function(x){ return { id:x.id, ad:x.ad, route:x.id, on:x.id === b, bolumler:[] }; });
    var tarih = new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' });
    var ana = '<div class="gun' + (ilk ? ' gun-gir' : '') + '">'
      + '<header class="gun-bas" style="--i:0"><div><h1 class="gun-selam">' + (b === 'bugun' ? selam() : BOLUM.filter(function(x){ return x.id === b; })[0].ad) + '</h1>'
      + '<p class="gun-tarih">' + kac(tarih.charAt(0).toLocaleUpperCase('tr-TR') + tarih.slice(1)) + '</p></div>'
      + '<span class="gun-merkez" data-hal="' + (merkez ? 'acik' : 'kapali') + '"><i aria-hidden="true"></i>' + (merkez === null ? 'Merkez’e bakılıyor…' : merkez ? 'Merkez açık' : 'Merkez kapalı · yerel') + '</span></header>'
      + (b === 'bugun' ? ustHtml(v) + seritHtml() + alanlarHtml() + altHtml() : bosHtml(b)) + '</div>';
    document.getElementById('app').innerHTML = '<div class="site site--v5 site--gun">'
      + (K ? K.iskeletV5({ modul:'gun', baglam:'Günü kur, gidişi gör', cekmeceler:cek }) : '')
      + '<div class="site__body"><div class="wrapc sayfa"><main id="main" tabindex="-1">' + ana + '</main></div></div></div>';
    ilk = false;
  }
  document.addEventListener('click', function(e){
    var t = e.target;
    var go = t.closest && t.closest('[data-act="go"]');
    if(go){ e.preventDefault(); var r = go.getAttribute('data-route'); if(r) { ilk = true; location.hash = r; } return; }
    var mm = t.closest && t.closest('[data-act="modul-menu"]');
    if(mm && K){ e.preventDefault(); if(K.katmanAcik('kabuk-modul')) K.katmanKapat(); else K.katmanAc('kabuk-modul', K.modulMenusu({ modul:'gun' }), mm); return; }
    var p = t.closest && t.closest('[data-pil]');
    if(p){ var n = Number(p.getAttribute('data-pil')); yaz('enerji', Number(oku().enerji) === n ? null : n); ciz(); return; }
    var h = t.closest && t.closest('[data-hava]');
    if(h){ var hv = h.getAttribute('data-hava'); yaz('hava', oku().hava === hv ? null : hv); ciz(); return; }
    var g = t.closest && t.closest('[data-gorunum]');
    if(g && g.tagName === 'BUTTON'){ gorunum = g.getAttribute('data-gorunum'); ciz(); return; }
    var a = t.closest && t.closest('[data-alan]');
    if(a){ var al = a.getAttribute('data-alan'); secAlan = secAlan === al ? null : al; ciz(); return; }
    if(t.closest && t.closest('[data-odak-niyet]')){ e.preventDefault(); var i = document.getElementById('gun-niyet'); if(i) i.focus(); }
  });
  document.addEventListener('change', function(e){ if(e.target && e.target.id === 'gun-niyet') yaz('niyet', e.target.value.trim()); });
  window.addEventListener('hashchange', ciz);
  setInterval(function(){
    var s = document.querySelector('.gun-saat'), b = document.getElementById('gun-simdi');
    if(s) s.style.setProperty('--simdi', simdiYuzde().toFixed(2) + '%');
    if(b) b.textContent = saatMetni();
  }, 30000);
  if(K && K.kur) try{ K.kur(); }catch(e){}
  ciz();
  yukle();
  setInterval(yukle, 120000);
  window.addEventListener('focus', yukle);           // sekmeye donunce taze
  fetch('/api/durum').then(function(r){ return r.json(); }).then(function(d){ merkez = !!d.hkm; ciz(); }).catch(function(){ merkez = false; ciz(); });
})();
</script>
</body></html>
"""
