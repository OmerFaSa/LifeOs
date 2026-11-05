# -*- coding: utf-8 -*-
"""GUN — besinci bolum: gunu kurmak ve gidisi gormek (Gun plani F2).

Yeni surec ya da port ACMAZ (plan §2c): giris sunucusu (sistem/sunucu.py,
4180) `/gun/` yolunda sunar. Kenar cubugu modullerle AYNI (brand/ortak/kabuk.js
kenarCubugu; kullanici 2026-11-03: «sol taraftaki kenar cubugu ayni kalsin»);
ana alan Gun'e ozgu, plandaki taslak (§2): ustte niyet, enerji pili, ic hava;
ortada gunun seridi (07-23, «simdi» cizgisi, Yaptiklarim / Yapacaklarim);
altinda alan cubuklari, «Simdi ne yapsam?» ve haftanin hayat karnesi.

Gecmis (plan §2): olcu kutulari, hayat karnesi (hafta / ay), haftanin sekli,
plan ve gercek, enerji ve ic hava izi. Sen: kendi sozun, enerji veren / calan,
«Ne yapsam?» destesi (sunucu sozu 27, `gun/sen`). Sayilari gunveri.js hesaplar.

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
    "piksel-yazi.css": "text/css; charset=utf-8", "piksel.css": "text/css; charset=utf-8", "piksel.js": "text/javascript; charset=utf-8", "piksel-apartman.js": "text/javascript; charset=utf-8", "piksel-figur.js": "text/javascript; charset=utf-8", "piksel-simge.js": "text/javascript; charset=utf-8", "gunveri.js": "text/javascript; charset=utf-8", "parca.js": "text/javascript; charset=utf-8",
}


def gun_html(tema=None, host="127.0.0.1"):
    sayfa = GUN_SAYFASI.replace("__HOST__", host)
    if tema in ("light", "dark"):
        sayfa = sayfa.replace('<html lang="tr" data-zemin="piksel">', '<html lang="tr" data-zemin="piksel" data-theme="%s">' % tema, 1)
    return sayfa


GUN_SAYFASI = r"""<!doctype html>
<html lang="tr" data-zemin="piksel">
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
<link rel="stylesheet" href="/gun/ortak/piksel-yazi.css"/>
<link rel="stylesheet" href="/gun/ortak/piksel.css"/>
<style>
/* Gun'un kimligi: Merkez'in moru (Merkez F7'de cekilince yerini Gun alir). */
:root{ --mod:var(--mer); --mod-ink:var(--mer-ink); --mod-t:var(--mer-t);
  --g-uyku:var(--spi); --g-beslenme:var(--spi); --g-hareket:var(--spi); --g-calisma:var(--ays); --g-okuma:var(--esp); }
/* King ve Ayarlar Gun'e henuz gelmedi (F3a): kenarda olmayan ise dugme gostermez. */
.site--gun .kenar [data-king-ac], .site--gun .kenar [data-act="open-appearance"],
.site--gun .kenar [data-cekmece="menu"], .site--gun .ust__king, .site--gun .ust [data-act="open-appearance"]{ display:none !important; }

.gun{ position:relative; max-width:1080px; margin:0 auto; padding:clamp(18px, 3vw, 36px) clamp(16px, 3vw, 32px) 64px; }
.gun::before{ content:none; }
.gun-bas{ display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:22px; }
.gun-selam{ margin:0; font-size:clamp(26px, 3.2vw, 36px); font-weight:700; letter-spacing:-.025em; line-height:1.1; }
.gun-tarih{ margin:6px 0 0; color:var(--text-2); font-size:15px; }
.gun-merkez{ display:inline-flex; align-items:center; gap:8px; padding:6px 12px; border-radius:999px; font-size:12.5px; color:var(--text-2);
  background:color-mix(in oklab, var(--surface) 70%, transparent); box-shadow:inset 0 0 0 1px var(--border); }
.gun-merkez i{ width:7px; height:7px; border-radius:50%; background:var(--text-3); }
.gun-merkez[data-hal="acik"] i{ background:var(--ok, #1a7f5a); }

.gun-kart{ position:relative; border-radius:20px; background:color-mix(in oklab, var(--surface) 88%, transparent);
  box-shadow:inset 0 0 0 1px var(--border); }
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
.gun-gecis button[aria-pressed="true"]{ background:var(--surface); color:var(--text); box-shadow:none; }
.gun-saat{ position:relative; height:132px; margin-top:30px; }
.gun-saat__izgara{ position:absolute; inset:0 0 22px; display:grid; grid-template-columns:repeat(16, 1fr); }
.gun-saat__izgara span{ border-left:1px dashed color-mix(in oklab, var(--text) 10%, transparent); }
.gun-saat__izgara span:first-child{ border-left-color:transparent; }
.gun-saat__etiket{ position:absolute; left:0; right:0; bottom:0; display:grid; grid-template-columns:repeat(16, 1fr); font-size:11px; color:var(--text-3);
  font-variant-numeric:tabular-nums; }
.gun-saat__gecmis{ position:absolute; top:0; bottom:22px; left:0; width:var(--simdi, 0%); border-radius:12px 0 0 12px;
  background:var(--surface-2);
  transition:width .6s cubic-bezier(.22,1,.36,1), opacity .35s; }
.gun-saat[data-gorunum="yapacak"] .gun-saat__gecmis{ opacity:.35; }
.gun-saat__simdi{ position:absolute; top:-4px; bottom:18px; left:var(--simdi, 0%); width:2px; margin-left:-1px; background:var(--mod); border-radius:2px;
  transition:left .6s cubic-bezier(.22,1,.36,1); }
.gun-saat__simdi::before{ content:""; position:absolute; top:-3px; left:-4px; width:10px; height:10px; border-radius:50%; background:var(--mod);
  box-shadow:0 0 0 3px var(--surface); }
.gun-saat__simdi b{ position:absolute; top:-26px; left:8px; padding:2px 7px; border-radius:6px; background:var(--mod); color:#fff; font-size:11px;
  font-weight:650; font-variant-numeric:tabular-nums; white-space:nowrap; }
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
  background:var(--surface-2); }
.gun-oneri h3{ margin:4px 0 6px; font-size:20px; font-weight:700; letter-spacing:-.02em; }
.gun-oneri p{ margin:0 0 14px; color:var(--text-2); font-size:14px; }
.gun-oneri a{ display:inline-flex; align-items:center; gap:6px; min-height:36px; padding:0 16px; border-radius:999px; background:var(--mod); color:#fff;
  text-decoration:none; font-size:13.5px; font-weight:650; transition:transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s; }
.gun-oneri a:hover{ transform:translateY(-1px); box-shadow:none; }
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

/* ust kart (2026-11-03: «daha guzel, profesyonel, modelle»): selam, gunun cumlesi, ilerleme halkasi */
.gun-kahraman{ display:grid; grid-template-columns:1fr auto; align-items:center; gap:24px; padding:22px 26px; margin-bottom:12px; border-radius:24px;
  background:var(--surface-2);
  box-shadow:inset 0 0 0 1px color-mix(in oklab, var(--mod) 18%, var(--border)); }
.gun-kahraman .gun-selam{ font-size:clamp(28px, 3.4vw, 40px); }
.gun-kahraman .gun-tarih{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.gun-cumle{ margin:14px 0 0; max-width:640px; font-size:16.5px; line-height:1.5; color:var(--text); min-height:1.5em; }
.gun-cumle small{ display:block; margin-top:4px; font-size:11.5px; color:var(--text-3); letter-spacing:.01em; }
.gun-halka{ position:relative; width:118px; height:118px; flex:none; }
.gun-halka svg{ width:100%; height:100%; transform:rotate(-90deg); }
.gun-halka circle{ fill:none; stroke-width:10; }
.gun-halka .iz{ stroke:color-mix(in oklab, var(--text) 9%, transparent); }
.gun-halka .dolu{ stroke:var(--mod); stroke-linecap:round; transition:stroke-dashoffset .8s cubic-bezier(.22,1,.36,1); }
.gun-halka div{ position:absolute; inset:0; display:grid; place-content:center; text-align:center; }
.gun-halka b{ font-size:26px; font-weight:750; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
.gun-halka small{ font-size:11px; color:var(--text-3); }
/* kendi isler: seritte dorduncu sira, planim listesi, ekle formu */
.gun-saat{ height:166px; }
.gun-blok[data-kendi-blok]{ cursor:pointer; }
.gun-plan{ padding:18px 20px; }
.gun-plan ul{ list-style:none; margin:0 0 10px; padding:0; display:grid; gap:4px; max-height:190px; overflow:auto; }
.gun-plan li{ display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:10px; transition:background .2s ease; }
.gun-plan li:hover{ background:var(--surface-2); }
.gun-plan li.is-bitti span{ color:var(--text-3); text-decoration:line-through; }
.gun-plan li span{ flex:1; min-width:0; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gun-plan li small{ font-size:12px; color:var(--text-3); font-variant-numeric:tabular-nums; }
.gun-tik{ flex:none; width:20px; height:20px; display:grid; place-items:center; padding:0; border:0; border-radius:6px; cursor:pointer;
  background:transparent; box-shadow:inset 0 0 0 1.5px color-mix(in oklab, var(--mod) 55%, var(--border)); color:#fff; transition:background .2s ease, transform .2s; }
.gun-tik[aria-pressed="true"]{ background:var(--mod); box-shadow:none; }
.gun-tik:active{ transform:scale(.9); }
.gun-tik svg{ width:13px; height:13px; fill:none; stroke:currentColor; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; }
.gun-sil{ flex:none; width:24px; height:24px; padding:0; border:0; border-radius:6px; background:transparent; color:var(--text-3); cursor:pointer; opacity:0; transition:opacity .2s; }
.gun-plan li:hover .gun-sil, .gun-destelist li:hover .gun-sil, .gun-sil:focus-visible{ opacity:1; }
.gun-ekle{ display:flex; gap:6px; }
.gun-ekle input{ min-width:0; height:36px; padding:0 12px; border:1px solid var(--border); border-radius:10px; background:var(--surface); color:var(--text); font:inherit; font-size:14px; }
.gun-ekle input[name="ad"]{ flex:1; }
.gun-ekle input[name="saat"]{ width:104px; }
.gun-ekle button{ height:36px; padding:0 14px; border:0; border-radius:10px; background:var(--mod); color:#fff; font:inherit; font-size:13.5px; font-weight:650; cursor:pointer; }
.gun-ekle input:focus{ outline:none; border-color:var(--mod); box-shadow:0 0 0 3px color-mix(in oklab, var(--mod) 18%, transparent); }
.gun-alt{ grid-template-columns:1fr 1fr; }
.gun-karne{ margin-top:12px; }
@media (max-width:900px){ .gun-kahraman{ grid-template-columns:1fr; } .gun-halka{ width:96px; height:96px; } }

/* Gecmis (plan §2): olcu kutulari, hayat karnesi (hafta / ay), haftanin sekli, plan ve gercek, enerji izi */
.gun-bas .gun-gecis{ align-self:center; }
.gun-olcu{ display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:12px; }
.gun-olcu > .gun-kart{ padding:16px 18px 14px; }
.gun-sayi{ display:flex; align-items:baseline; gap:6px; margin:2px 0 2px; }
.gun-sayi b{ font-size:30px; font-weight:720; letter-spacing:-.03em; font-variant-numeric:tabular-nums; line-height:1.1; }
.gun-sayi span{ font-size:13px; color:var(--text-2); }
.gun-sayi.is-yok b{ color:var(--text-3); font-weight:600; font-size:22px; }
.gun-etiket{ margin:0 0 10px; font-size:11.5px; color:var(--text-3); }
.gun-sutun{ display:block; width:100%; height:38px; }
.gun-sutun rect.d{ fill:var(--renk); }
.gun-sutun rect.s{ fill:color-mix(in oklab, var(--renk) 35%, transparent); }
.gun-sutun rect.b{ fill:color-mix(in oklab, var(--mod) 12%, transparent); }
.gun-karne.is-ay .gun-karne__izgara{ grid-template-columns:76px repeat(30, 1fr); gap:3px; }
.gun-karne.is-ay .gun-kare{ border-radius:3px; max-height:18px; box-shadow:inset 0 0 0 1px color-mix(in oklab, var(--text) 12%, transparent); }
.gun-karne.is-ay .gun-kare.is-yapildi{ box-shadow:none; }
.gun-karne.is-ay .gun-kare.is-kayit-yok{ box-shadow:inset 0 0 0 1px color-mix(in oklab, var(--renk) 40%, transparent); }
.gun-karne.is-ay .gun-karne__izgara > span{ font-size:10px; }
.gun-iki{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
.gun-iki > .gun-kart{ padding:18px 20px; }
.gun-sekil{ display:grid; grid-template-columns:repeat(7, 1fr); gap:6px; align-items:end; height:120px; }
.gun-sekil > div{ display:grid; grid-template-rows:1fr auto; gap:6px; height:100%; text-align:center; }
.gun-sekil__cift{ display:flex; align-items:flex-end; justify-content:center; gap:3px; }
.gun-sekil__cift i{ width:min(14px, 38%); min-height:2px; border-radius:4px 4px 1px 1px; background:var(--renk); transition:height .6s cubic-bezier(.22,1,.36,1); }
.gun-sekil__cift i.is-yok{ min-height:0; height:4px !important; width:4px; border-radius:50%; background:color-mix(in oklab, var(--text) 18%, transparent); }
.gun-sekil small{ font-size:11px; color:var(--text-3); }
.gun-pg{ display:grid; gap:12px; margin:0; padding:0; list-style:none; }
.gun-pg li{ display:grid; grid-template-columns:44px 1fr auto; align-items:center; gap:10px; font-size:13px; }
.gun-pg b{ font-weight:650; }
.gun-pg small{ color:var(--text-3); font-variant-numeric:tabular-nums; white-space:nowrap; }
.gun-yigin{ display:flex; height:10px; border-radius:99px; overflow:hidden; background:color-mix(in oklab, var(--renk) 10%, transparent); }
.gun-yigin i{ display:block; height:100%; }
.gun-yigin i.bitti{ background:var(--renk); }
.gun-yigin i.atlandi{ background:repeating-linear-gradient(135deg, color-mix(in oklab, var(--renk) 45%, transparent) 0 3px, transparent 3px 6px); }
.gun-iz{ display:grid; grid-template-columns:repeat(var(--n, 7), 1fr); gap:4px; align-items:end; height:96px; }
.gun-iz > div{ display:grid; grid-template-rows:1fr auto; justify-items:center; gap:5px; height:100%; }
.gun-iz__pil{ align-self:end; width:min(18px, 80%); border-radius:5px; background:var(--mod); opacity:calc(.35 + var(--e) * .13); height:calc(var(--e) * 20%); }
.gun-iz__pil.is-yok{ width:5px; height:5px; border-radius:50%; background:color-mix(in oklab, var(--text) 18%, transparent); opacity:1; }
.gun-iz small{ font-size:10.5px; color:var(--text-3); line-height:1; }
.gun-iz svg{ width:16px; height:16px; fill:none; stroke:var(--text-2); stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
.gun-iz.is-ay small, .gun-iz.is-ay svg{ display:none; }

/* Sen (plan §2): kendi sozun, veren / calan, «Ne yapsam?» destesi */
.gun-soz{ padding:22px 24px; margin-bottom:12px; }
.gun-soz textarea{ display:block; width:100%; min-height:3.2em; padding:0; border:0; resize:none; background:transparent; color:var(--text); font:inherit;
  font-size:clamp(19px, 2.4vw, 24px); font-weight:600; letter-spacing:-.015em; line-height:1.35; field-sizing:content; }
.gun-soz textarea::placeholder{ color:var(--text-3); font-weight:500; }
.gun-soz textarea:focus{ outline:none; }
.gun-cipler{ display:flex; flex-wrap:wrap; gap:6px; margin:0 0 12px; padding:0; list-style:none; min-height:32px; }
.gun-cipler li{ display:inline-flex; align-items:center; gap:2px; min-height:32px; padding:0 4px 0 12px; border-radius:999px; font-size:13.5px;
  background:color-mix(in oklab, var(--renk) 12%, var(--surface)); box-shadow:inset 0 0 0 1px color-mix(in oklab, var(--renk) 28%, transparent); }
.gun-cipler li button{ width:24px; height:24px; padding:0; border:0; border-radius:50%; background:transparent; color:var(--text-3); font-size:15px; cursor:pointer; }
.gun-cipler li button:hover{ background:var(--surface-2); color:var(--text); }
.gun-cipler .gun-senin{ margin:0; align-self:center; }
.gun-deste{ display:grid; grid-template-columns:minmax(0, 1.1fr) minmax(0, 1fr); gap:20px; padding:20px 22px; align-items:start; }
.gun-kartyuz{ position:relative; display:grid; align-content:space-between; gap:18px; min-height:190px; padding:22px; border-radius:18px;
  background:var(--surface-2);
  box-shadow:inset 0 0 0 1px color-mix(in oklab, var(--mod) 26%, transparent);
  animation:gun-kart .45s cubic-bezier(.22,1,.36,1) both; }
@keyframes gun-kart{ from{ opacity:0; transform:translateY(8px) rotate(-1.2deg); } }
.gun-kartyuz small{ font-size:11.5px; color:var(--mod-ink); font-weight:650; letter-spacing:.02em; text-transform:uppercase; }
.gun-kartyuz h3{ margin:0; font-size:clamp(22px, 2.6vw, 28px); font-weight:720; letter-spacing:-.025em; line-height:1.15; }
.gun-kartyuz p{ margin:0; font-size:13px; color:var(--text-2); }
.gun-kartyuz__dugme{ display:flex; gap:8px; flex-wrap:wrap; }
.gun-dugme{ display:inline-flex; align-items:center; gap:6px; min-height:36px; padding:0 16px; border:0; border-radius:999px; font:inherit; font-size:13.5px; font-weight:650;
  cursor:pointer; background:var(--mod); color:#fff; transition:transform .25s cubic-bezier(.22,1,.36,1); text-decoration:none; }
.gun-dugme.is-ikinci{ background:var(--surface); color:var(--text); box-shadow:inset 0 0 0 1px var(--border); }
.gun-dugme:hover{ transform:translateY(-1px); }
.gun-destelist{ margin:0 0 10px; padding:0; list-style:none; display:grid; gap:2px; max-height:240px; overflow:auto; }
.gun-destelist li{ display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:10px; font-size:13.5px; }
.gun-destelist li:hover{ background:var(--surface-2); }
.gun-destelist li span{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gun-destelist li small{ color:var(--text-3); font-size:11.5px; font-variant-numeric:tabular-nums; white-space:nowrap; }
.gun-ekle select{ height:36px; padding:0 8px; border:1px solid var(--border); border-radius:10px; background:var(--surface); color:var(--text); font:inherit; font-size:13px; }
.gun-oneri .gun-oneri__kart{ margin-left:12px; font-size:13px; color:var(--mod-ink); font-weight:600; text-decoration:none; background:none; padding:0; min-height:0; }
@media (max-width:900px){ .gun-olcu{ grid-template-columns:1fr 1fr; } .gun-olcu > :last-child{ grid-column:1 / -1; } .gun-iki, .gun-deste{ grid-template-columns:minmax(0, 1fr); } }
@media (max-width:560px){ .gun-olcu{ grid-template-columns:1fr; } .gun-karne.is-ay .gun-karne__izgara{ grid-template-columns:58px repeat(30, 1fr); gap:2px; }
  .gun-karne__izgara{ grid-template-columns:64px repeat(7, 1fr); } .gun-ekle{ flex-wrap:wrap; } .gun-ekle input[name="ad"]{ flex-basis:100%; }
  .gun-ekle input[name="saat"], .gun-ekle select{ flex:1; } .gun-kahraman{ padding:18px; gap:14px; } .gun-soz, .gun-deste{ padding:18px; } .gun-destelist li{ flex-wrap:wrap; } .gun-destelist li span{ flex-basis:calc(100% - 40px); } }
@media (hover:none){ .gun-sil{ opacity:1; } }
@media (max-width:700px){ .gun::before{ left:0; right:0; } }
.gun-saat__simdi.is-sag b{ left:auto; right:8px; }

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
@media (prefers-reduced-motion:reduce){ .gun-gir > *, .gun-blok, .gun-kartyuz{ animation:none; } .gun-saat__simdi::before{ animation:none; }
  .gun-alan, .gun-hava button, .gun-pil button, .gun-oneri a, .gun-dugme, .gun-halka .dolu, .gun-saat__gecmis, .gun-saat__simdi, .gun-sekil__cift i, .gun-gecis button{ transition:none; }
  .gun-alan:hover, .gun-hava button:hover, .gun-dugme:hover, .gun-blok:hover, .gun-oneri a:hover{ transform:none; } .gun-blok:hover{ transform:translateX(-6px); } }
</style>
</head>
<body>
<a class="skiplink" href="#main">İçeriğe atla</a>
<div id="app"></div>
<div id="overlay-root"></div>
<script src="/gun/ortak/parca.js"></script>
<script src="/gun/ortak/kabuk.js"></script>
<script src="/gun/ortak/piksel-figur.js"></script>
<script src="/gun/ortak/piksel-simge.js"></script>
<script src="/gun/ortak/piksel-apartman.js"></script>
<script src="/gun/ortak/piksel.js"></script>
<script src="/gun/ortak/gunveri.js"></script>
<script>
(function(){
  'use strict';
  var L = window.LIFEOS || {}, K = L.KABUK;
  var HOST = '__HOST__';
  var BOLUM = [{ id:'bugun', ad:'Bugün' }, { id:'analiz', ad:'Geçmiş' }, { id:'calisma', ad:'Sen' }];
  var ALANLAR = [['uyku', 'Uyku', 'spi'], ['beslenme', 'Beslenme', 'spi'], ['hareket', 'Hareket', 'spi'], ['calisma', 'Çalışma', 'ays'], ['gelisim', 'Gelişim', 'esp']];
  var MAD = { ays:'AYS', spi:'SPİ', esp:'ESP', gun:'Gün' }, MPORT = { ays:4173, spi:4183, esp:4193 }, SERIT_SIRA = { ays:0, spi:1, esp:2, gun:3 };
  var DILIM_AD = { sabah:'Sabah', ogle:'Öğle', aksam:'Akşam', gece:'Gece', gun:'Gün içinde' };
  function adres(m, rota){ return m === 'gun' ? '#bugun' : 'http://' + HOST + ':' + MPORT[m] + '/' + (rota ? '#king=' + rota : ''); }
  function oturum(){ var m = document.cookie.match(/(?:^|;\s*)lifeos_hesap=([^;]*)/); if(!m) return null;
    try{ var o = JSON.parse(decodeURIComponent(m[1])); return o && o.j ? o : null; }catch(e){ return null; } }
  function api(yol){ var o = oturum(); if(!o) return Promise.reject({ kod:401 });
    return fetch((o.s || '') + yol, { headers:{ Authorization:'Bearer ' + o.j }, cache:'no-store', credentials:'omit' })
      .then(function(r){ if(r.status === 401) throw { kod:401 }; if(!r.ok) throw { kod:r.status }; return r.json(); }); }
  function simdiISO(){ var d = new Date(); return bugun() + 'T' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':00'; }
  function yukle(){
    if(!GV){ veri.durum = 'hata'; return; }
    if(!oturum()){ veri.durum = 'girisyok'; veri.karne = GV.karne(null, bugun()); ciz(); cumleIste(); return; }
    Promise.all([api('/api/hesap/tekgun').catch(function(e){ return e && e.kod === 401 ? Promise.reject(e) : null; }),
                 api('/api/hesap/gunluk').catch(function(e){ return e && e.kod === 401 ? Promise.reject(e) : null; })])
      .then(function(r){ veri.serit = GV.serit(r[0], simdiISO()); veri.karne = GV.karne(r[1], bugun()); veri.gunluk = r[1]; veri.durum = 'hazir';
        api('/api/hesap/gunsen').then(function(s){
          if(s && s.zaman != null){ var yerelIz = sen.iz[bugun()]; delete s.zaman; sen = s; if(yerelIz && !sen.iz[bugun()]){ sen.iz[bugun()] = yerelIz; senYaz(); } else senKaydet(); }
          else if(senDolu()) senYaz();                                                   // girişten önce girilen yukarı çıkar
          ciz(true);
        }).catch(function(){});
        return api('/api/hesap/gunkayit').then(function(g){
          var y = oku();
          if(g && !g.bayat && (g.niyet || g.enerji || g.hava || (g.bloklar || []).length))
          { yazYerel({ niyet:g.niyet || undefined, enerji:g.enerji || undefined, hava:g.hava || undefined, bloklar:g.bloklar || [] });
            var z = sen.iz[bugun()] || {};                                                // King'in yazdığı enerji de ize girer
            if((z.enerji || null) !== (g.enerji || null) || (z.hava || null) !== (g.hava || null)) izGuncelle(oku()); }
          else if(y.niyet || y.enerji || y.hava || (y.bloklar || []).length) gonder();      // girişten önce girilen yukarı çıkar
        }).catch(function(){}); })
      .then(function(){ if(veri.durum === 'hazir'){ ciz(true); cumleIste(); } })
      .catch(function(){ veri.durum = 'girisyok'; veri.karne = GV.karne(null, bugun()); ciz(true); cumleIste(); });
  }
  /* Kendi plan (Gun kaydinin bloklari) seride dorduncu sira olarak katilir; saat uydurulmaz. */
  function kendiBloklar(){
    return (oku().bloklar || []).map(function(b, i){
      var sa = /^([01]\d|2[0-3]):[0-5]\d$/.test(b.saat || '') ? b.saat : null;
      var y = sa ? Math.max(0, Math.min(100, (Number(sa.slice(0, 2)) * 60 + Number(sa.slice(3)) - 420) / 960 * 100)) : null;
      return { modul:'gun', ad:b.ad, alt:'', saat:sa, dilim:'gun', durum:b.bitti ? 'bitti' : 'bekliyor', rota:null, yuzde:y, kendi:i };
    });
  }
  function serit(){
    var s = veri.serit || { baglanti:false, bloklar:[], saatsiz:[], notlar:[], bos:true }, k = kendiBloklar();
    var dk = function(x){ return Number(x.saat.slice(0, 2)) * 60 + Number(x.saat.slice(3)); };
    var bl = s.bloklar.concat(k.filter(function(x){ return x.saat; })).sort(function(a, b){ return dk(a) - dk(b); });
    var sz = s.saatsiz.concat(k.filter(function(x){ return !x.saat; }));
    return { baglanti:s.baglanti, bloklar:bl, saatsiz:sz, notlar:s.notlar, bos:!bl.length && !sz.length };
  }
  function sayac(){
    var s = serit(), hep = s.bloklar.concat(s.saatsiz);
    return { toplam:hep.length, biten:hep.filter(function(x){ return x.durum === 'bitti'; }).length, hep:hep };
  }
  /* Gunun cumlesi: satirlari BU KOD kurar (sayilar ve adlar), cumleyi Merkez'deki model yazar
     (/api/gun/cumle → HKM /api/king/cumle «gun»). Ayni satirlar icin bir kez sorulur; model
     yoksa ya da Merkez kapaliysa kodun kendi cumlesi, etiketiyle. */
  var cumle = { anahtar:'', metin:'', kaynak:'' };
  function cumleSatirlari(){
    var c = sayac(), v = oku(), l = [], x = GV ? GV.siradaki(serit(), simdiISO()) : null;
    if(c.toplam) l.push('Bugünün işleri: ' + c.toplam + ', biten: ' + c.biten);
    var biten = c.hep.filter(function(b){ return b.durum === 'bitti'; }).slice(0, 4).map(function(b){ return b.ad + ' (' + MAD[b.modul] + ')'; });
    if(biten.length) l.push('Biten: ' + biten.join(', '));
    if(x) l.push('Sıradaki: ' + x.ad + (x.saat ? ', ' + x.saat : '') + ' (' + MAD[x.modul] + ')');
    var oz = veri.karne ? veri.karne.bugunOzet : {};
    if(oz.calisma != null) l.push('Çalışma bugün ' + oz.calisma + ' dk (ölçüldü)');
    if(oz.gelisim != null) l.push('Gelişim bugün ' + oz.gelisim + ' dk (ölçüldü)');
    if(v.niyet) l.push('Kullanıcının niyeti: «' + v.niyet + '»');
    if(v.enerji) l.push('Enerji ' + v.enerji + '/5 (kullanıcının girdiği)');
    return l;
  }
  function kodCumlesi(){
    var c = sayac(), x = GV ? GV.siradaki(serit(), simdiISO()) : null, n = oku().niyet;
    if(!c.toplam) return n ? 'Niyetin belli: «' + n + '». Planına ilk işi ekleyerek başlayabilirsin.' : 'Bugün için henüz plan yok; bir niyet yazarak ya da bir iş ekleyerek başlayabilirsin.';
    return c.biten + ' iş bitti, ' + (c.toplam - c.biten) + ' iş sırada' + (x ? '; sıradaki ' + x.ad + (x.saat ? ' (' + x.saat + ')' : '') : '') + '.';
  }
  function cumleIste(){
    var l = cumleSatirlari(), a = bugun() + '|' + JSON.stringify(l);
    if(a === cumle.anahtar) return;
    cumle = { anahtar:a, metin:kodCumlesi(), kaynak:'kod' };
    try{ var on = JSON.parse(localStorage.getItem('lifeos.gun.cumle') || 'null'); if(on && on.anahtar === a){ cumle = on; cumleYaz(); return; } }catch(e){}
    cumleYaz();
    if(!l.length) return;
    fetch('/api/gun/cumle', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-LifeOS':'gun' }, body:JSON.stringify({ satirlar:l }) })
      .then(function(r){ return r.json(); })
      .then(function(r){ if(r && r.ok && r.text && cumle.anahtar === a){ cumle = { anahtar:a, metin:String(r.text).slice(0, 300), kaynak:'model' };
        try{ localStorage.setItem('lifeos.gun.cumle', JSON.stringify(cumle)); }catch(e){} cumleYaz(); } })
      .catch(function(){});
  }
  function cumleHtml(){
    return '<p class="gun-cumle" id="gun-cumle">' + kac(cumle.metin || kodCumlesi()) + '<small>' + (cumle.kaynak === 'model'
      ? 'Cümleyi model kurdu · sayılar ve adlar Gün’ün kodundan' : 'hesaplandı · Merkez açıkken cümleyi model kurar') + '</small></p>';
  }
  function cumleYaz(){ var e = document.getElementById('gun-cumle'); if(e) e.outerHTML = cumleHtml(); }
  function halkaHtml(){
    var c = sayac(), r = 50, cevre = 2 * Math.PI * r, oran = c.toplam ? c.biten / c.toplam : 0;
    return '<div class="gun-halka" role="img" aria-label="' + (c.toplam ? 'Bugün ' + c.toplam + ' işten ' + c.biten + ' bitti' : 'Bugün için iş yok') + '">'
      + '<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="iz" cx="60" cy="60" r="' + r + '"/><circle class="dolu" cx="60" cy="60" r="' + r + '"'
      + ' stroke-dasharray="' + cevre.toFixed(1) + '" stroke-dashoffset="' + (cevre * (1 - oran)).toFixed(1) + '"/></svg>'
      + '<div><b>' + (c.toplam ? c.biten + '/' + c.toplam : '—') + '</b><small>' + (c.toplam ? 'iş bitti' : 'iş yok') + '</small></div></div>';
  }
  function kahramanHtml(tarih){
    return '<section class="gun-kahraman" style="--i:0"><div><h1 class="gun-selam">' + selam() + '</h1>'
      + '<p class="gun-tarih">' + kac(tarih) + '<span class="gun-merkez" data-hal="' + (merkez ? 'acik' : 'kapali') + '"><i aria-hidden="true"></i>'
      + (merkez === null ? 'Merkez’e bakılıyor…' : merkez ? 'Merkez açık' : 'Merkez kapalı · yerel') + '</span></p>' + cumleHtml() + '</div>' + halkaHtml() + '</section>';
  }
  function planHtml(){
    var b = oku().bloklar || [];
    return '<section class="gun-kart gun-plan" style="--i:6"><h2 class="gun-kart__ad">Gün planım<small>' + (b.length ? b.filter(function(x){ return x.bitti; }).length + '/' + b.length + ' bitti' : 'senin işlerin') + '</small></h2>'
      + (b.length ? '<ul>' + b.map(function(x, i){
          return '<li class="' + (x.bitti ? 'is-bitti' : '') + '"><button type="button" class="gun-tik" data-kendi-blok="' + i + '" aria-pressed="' + !!x.bitti + '" aria-label="' + kac(x.ad) + (x.bitti ? ': bitti' : ': bitir') + '">'
            + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button><span>' + kac(x.ad) + '</span>' + (x.saat ? '<small>' + x.saat + '</small>' : '')
            + '<button type="button" class="gun-sil" data-plan-sil="' + i + '" aria-label="' + kac(x.ad) + ' sil" title="Sil">×</button></li>'; }).join('') + '</ul>'
        : '<p class="gun-senin" style="margin:0 0 10px">Modüllerin planı şeritte; buraya kendi işlerini ekle. King de görür.</p>')
      + '<form class="gun-ekle" data-gun-ekle><input name="ad" maxlength="80" placeholder="İş ekle: kitap oku" aria-label="İşin adı" required/>'
      + '<input name="saat" type="time" aria-label="Saat (isteğe bağlı)"/><button type="submit">Ekle</button></form></section>';
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
        body:JSON.stringify({ ad:'gun/kayit', gun:bugun(), icerik:JSON.stringify({ niyet:v.niyet || '', enerji:v.enerji || null, hava:v.hava || null,
          bloklar:(v.bloklar || []).slice(0, 20) }) }) })
        .catch(function(){ /* sunucu yok: yerelde kalir, sonraki degisiklikte yeniden denenir */ });
    }, 500);
  }
  function yaz(k, v){ var o = oku(); if(v === null || v === '') delete o[k]; else o[k] = v; yazYerel(o); gonder();
    if(k === 'enerji' || k === 'hava') izGuncelle(o); }
  /* Gun › Sen (sunucu sozu 27): kendi soz, veren / calan, deste, enerji izi. Sunucu asil; bu tarayicida kopyasi. */
  var SEN_ANAHTAR = 'lifeos.gun.sen';
  var sen = (function(){ try{ var s = JSON.parse(localStorage.getItem(SEN_ANAHTAR) || 'null'); if(s && typeof s === 'object') return s; }catch(e){} return {}; })();
  ['veren', 'calan', 'deste'].forEach(function(k){ if(!Array.isArray(sen[k])) sen[k] = []; });
  if(typeof sen.soz !== 'string') sen.soz = '';
  if(!sen.iz || typeof sen.iz !== 'object') sen.iz = {};
  function senDolu(){ return !!(sen.soz || sen.veren.length || sen.calan.length || sen.deste.length || Object.keys(sen.iz).length); }
  function senKaydet(){ try{ localStorage.setItem(SEN_ANAHTAR, JSON.stringify(sen)); }catch(e){} }
  var senSaat = null;
  function senYaz(){
    senKaydet(); clearTimeout(senSaat);
    senSaat = setTimeout(function(){
      var o = oturum(); if(!o) return;
      fetch((o.s || '') + '/api/hesap/yayin', { method:'POST', cache:'no-store', credentials:'omit',
        headers:{ 'Content-Type':'application/json', 'X-LifeOS':'hesap', Authorization:'Bearer ' + o.j },
        body:JSON.stringify({ ad:'gun/sen', icerik:JSON.stringify({ soz:sen.soz, veren:sen.veren, calan:sen.calan, deste:sen.deste, iz:sen.iz }) }) })
        .catch(function(){ /* sunucu yok: yerelde kalir */ });
    }, 500);
  }
  function izGuncelle(o){
    var g = bugun(), e = Number(o.enerji) || null, h = o.hava || null;
    if(e || h) sen.iz[g] = { enerji:e, hava:h }; else delete sen.iz[g];
    var gunler = Object.keys(sen.iz).sort(); gunler.slice(0, Math.max(0, gunler.length - 90)).forEach(function(x){ delete sen.iz[x]; });
    senYaz();
  }
  function bolum(){ var h = (location.hash || '').slice(1); return BOLUM.some(function(b){ return b.id === h; }) ? h : 'bugun'; }
  function simdiYuzde(){ var d = new Date(), s = d.getHours() + d.getMinutes() / 60; return Math.max(0, Math.min(100, (s - 7) / 16 * 100)); }
  function saatMetni(){ var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function selam(){ var s = new Date().getHours(); return s < 5 ? 'İyi geceler' : s < 12 ? 'Günaydın' : s < 18 ? 'İyi günler' : 'İyi akşamlar'; }
  /* Simdi ne yapsam? — YALNIZ saate bakar (veri yok); bunu kartta soyler. */
  function oneri(){
    var x = GV ? GV.siradaki(serit(), simdiISO()) : null;
    if(x && x.modul === 'gun') return { bas:x.ad, ne:'Sıradaki: kendi planından' + (x.saat ? ' · ' + x.saat : '') + '. Bitince planında işaretle.', ad:'Bitti olarak işaretle', href:'#bugun', kendi:x.kendi, kaynak:'planından' };
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
      + '<input class="gun-niyet" id="gun-niyet" maxlength="120" placeholder="Bugün neyi bitirmek istiyorsun?" value="' + kac(v.niyet || '') + '" aria-label="Günün niyeti"/>'
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
    return '<a class="gun-blok" href="' + kac(adres(x.modul, x.rota)) + '"' + (x.kendi != null ? ' data-kendi-blok="' + x.kendi + '"' : '') + ' data-durum="' + x.durum + '" style="--renk:var(--' + x.modul + ');--serit:' + SERIT_SIRA[x.modul]
      + (x.yuzde == null ? '' : ';--x:' + x.yuzde.toFixed(2) + '%') + ';--i:' + i + '" title="' + kac(MAD[x.modul] + ' · ' + x.ad + (x.alt ? ' · ' + x.alt : '') + (x.saat ? ' · ' + x.saat : '')) + '">'
      + '<span>' + kac(x.ad) + '</span>' + (x.saat ? '<small>' + x.saat + '</small>' : '') + '</a>';
  }
  function gorunsun(x){
    if(secAlan){ var m = ALANLAR.filter(function(a){ return a[0] === secAlan; })[0][2]; if(x.modul !== m) return false; }
    return gorunum === 'yaptim' ? (x.durum === 'bitti' || x.durum === 'atlandi') : (x.durum === 'bekliyor' || x.durum === 'vakti');
  }
  function seritHtml(){
    var saatler = []; for(var h = 7; h <= 22; h++) saatler.push(h);
    var sr = serit(), saatli = sr.bloklar.filter(gorunsun), saatsiz = sr.saatsiz.filter(gorunsun);
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
      + '<div class="gun-saat__simdi' + (simdiYuzde() > 80 ? ' is-sag' : '') + '" aria-hidden="true"><b id="gun-simdi">' + saatMetni() + '</b></div>'
      + (saatli.length ? saatli.map(blokHtml).join('') : (saatsiz.length ? '' : '<div class="gun-saat__bos">' + bos + '</div>'))
      + '<div class="gun-saat__etiket" aria-hidden="true">' + saatler.map(function(h){ return '<span>' + ('0' + h).slice(-2) + '</span>'; }).join('') + '</div>'
      + '</div>'
      + (saatsiz.length ? '<div class="gun-saatsiz"><span>Saati yok</span>' + saatsiz.map(function(x, i){ return blokHtml(x, i).replace('<span>', '<span>' + kac(DILIM_AD[x.dilim]) + ' · '); }).join('') + '</div>' : '')
      + (sr.notlar.length ? '<ul class="gun-notlar">' + sr.notlar.map(function(n){ return '<li>' + kac(n) + '</li>'; }).join('') + '</ul>' : '')
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
    return '<div class="gun-alt"><section class="gun-kart gun-oneri" style="--i:6"><h2 class="gun-kart__ad">Şimdi ne yapsam?<small>' + (o.kaynak || 'saate göre') + '</small></h2>'
      + '<h3>' + kac(o.bas) + '</h3><p>' + kac(o.ne) + '</p><a href="' + kac(o.href) + '"' + (o.odak ? ' data-odak-niyet' : '') + (o.kendi != null ? ' data-kendi-blok="' + o.kendi + '"' : '') + '>' + kac(o.ad) + ' →</a>'
      + '<a class="gun-oneri__kart" href="#calisma">ya da desteden kart çek</a></section>'
      + planHtml() + '</div>'
      + karneHtml(ALANLAR.map(function(a, r){ var sat = k ? k.satirlar[r] : null;
          return { ad:a[1], modul:a[2], hucreler:sat ? sat.hucreler : GUN.map(function(){ return 'veri-yok'; }), degerler:sat ? sat.degerler : GUN.map(function(){ return null; }) }; }),
        GUN, bugunNo, false, 7, 'Haftanın hayat karnesi');
  }
  /* ---------------- Gecmis: sayilari GunVeri hesaplar; burada yalniz cizilir. */
  var donemN = 7, haric = [], sonEylem = '';
  function dkMetin(m){ return m >= 60 ? Math.floor(m / 60) + ' sa' + (m % 60 ? ' ' + (m % 60) + ' dk' : '') : m + ' dk'; }
  /* Mini sutun: yapildi = dolu sutun, kayit yok = ince taban (bilinen sifir), veri yok = bosluk. */
  function sutunSvg(degerler, hucreler, enCok, etiket){
    var n = degerler.length, max = Math.max.apply(null, degerler.map(function(v){ return v || 0; }).concat([enCok || 1])), gen = n > 7 ? 8 : 6, ic = '';
    hucreler.forEach(function(h, i){
      var x = i * 10 + (10 - gen) / 2, v = degerler[i] || 0;
      if(h === 'yapildi'){ var y = Math.max(3, v / max * 34); ic += '<rect class="d" x="' + x + '" y="' + (38 - y).toFixed(1) + '" width="' + gen + '" height="' + y.toFixed(1) + '" rx="1.5"/>'; }
      else if(h === 'kayit-yok') ic += '<rect class="s" x="' + x + '" y="36" width="' + gen + '" height="2" rx="1"/>';
    });
    return '<svg class="gun-sutun" viewBox="0 0 ' + n * 10 + ' 40" preserveAspectRatio="none" role="img" aria-label="' + kac(etiket) + '"><rect class="b" x="' + (n - 1) * 10 + '" y="0" width="10" height="40" rx="2"/>' + ic + '</svg>';
  }
  function olcuHtml(s, ad, kaynak, i){
    var n = s.hucreler.length, yok = s.toplam == null, vy = n - s.bilinen;
    var et = ad + ': son ' + n + ' günde ' + (yok ? 'veri yok' : s.etkin + ' etkin gün, toplam ' + s.toplam + ' dakika' + (vy ? ', ' + vy + ' gün veri yok' : ''));
    return '<section class="gun-kart" style="--i:' + i + ';--renk:var(--' + s.modul + ')"><h2 class="gun-kart__ad">' + ad + '<small>' + (yok ? kaynak : s.etkin + '/' + n + ' gün') + '</small></h2>'
      + '<p class="gun-sayi' + (yok ? ' is-yok' : '') + '"><b>' + (yok ? 'veri yok' : dkMetin(s.toplam)) + '</b>' + (yok ? '' : '<span>son ' + n + ' gün</span>') + '</p>'
      + '<p class="gun-etiket">' + (yok ? kaynak + ' bu dönem için özet yayınlamadı' : 'ölçüldü · ' + kaynak + (s.etkin ? ' · etkin günde ort. ' + Math.round(s.toplam / s.etkin) + ' dk' : '')) + '</p>'
      + sutunSvg(s.degerler, s.hucreler, 0, et) + '</section>';
  }
  var HAL_AD = { 'yapildi':'yapıldı', 'kayit-yok':'kayıt yok', 'veri-yok':'veri yok', 'gelecek':'henüz gelmedi' };
  function karneHtml(satirlar, etiketler, bugunNo, ay, i, baslik){
    var dolu = satirlar.some(function(x){ return x.hucreler.indexOf('yapildi') >= 0 || x.hucreler.indexOf('kayit-yok') >= 0; });
    return '<section class="gun-kart gun-karne' + (ay ? ' is-ay' : '') + '" style="--i:' + i + '"><h2 class="gun-kart__ad">' + baslik + '<small>' + (dolu ? 'modüllerin günlük özetinden' : 'veri yok') + '</small></h2>'
      + '<div class="gun-karne__izgara"><b></b>'
      + etiketler.map(function(g, j){ return '<span' + (j === bugunNo ? ' class="is-bugun"' : '') + '>' + g + '</span>'; }).join('')
      + satirlar.map(function(sat){
          return '<b>' + sat.ad + '</b>' + sat.hucreler.map(function(h, j){ var d = sat.degerler[j], ne = ay ? sat.gunler[j] : etiketler[j];
            return '<i class="gun-kare is-' + h + (j === bugunNo ? ' is-bugun' : '') + '" style="--renk:var(--' + sat.modul + ')" title="' + sat.ad + ' · ' + ne + ': ' + HAL_AD[h] + (d != null && h === 'yapildi' ? ' (' + d + ' dk)' : '') + '" role="img" aria-label="' + sat.ad + ' ' + ne + ': ' + HAL_AD[h] + '"></i>'; }).join(''); }).join('')
      + '</div><div class="gun-lejant"><span><i style="background:var(--mod)"></i>yapıldı</span>'
      + '<span><i style="box-shadow:inset 0 0 0 1.5px var(--text-3)"></i>kayıt yok</span>'
      + '<span><i class="gun-kare" style="display:inline-block;width:10px;height:10px"></i>veri yok</span></div>'
      + '<p class="gun-senin">Uyku, beslenme ve hareket: SPİ henüz günlük özet yayınlamıyor.</p></section>';
  }
  function gecmisHtml(){
    if(!GV || !GV.donem) return '<section class="gun-kart gun-bos"><h2>Veri katmanı yüklenemedi</h2><p>Sayfayı yenile.</p></section>';
    var n = donemN, bg = bugun(), d = GV.donem(veri.gunluk, bg, n), d30 = n === 30 ? d : GV.donem(veri.gunluk, bg, 30), z = GV.izDizi(sen.iz, bg, n);
    var a = {}; d.satirlar.forEach(function(s){ s.gunler = d.gunler; a[s.alan] = s; });
    var a30 = {}; d30.satirlar.forEach(function(s){ a30[s.alan] = s; });
    var giris = veri.durum === 'girisyok' ? '<p class="gun-senin" style="margin:0 0 12px">Hesabınla giriş yapılmamış: modüllerin özeti gelmez, sayılar «veri yok» kalır.</p>' : '';
    // enerji kutusu: senin girdigin
    var eH = z.gunler.map(function(g){ return g.enerji ? 'yapildi' : 'veri-yok'; }), eD = z.gunler.map(function(g){ return g.enerji; });
    var enerji = '<section class="gun-kart" style="--i:3;--renk:var(--mod)"><h2 class="gun-kart__ad">Enerji<small>' + z.girilen + '/' + n + ' gün</small></h2>'
      + '<p class="gun-sayi' + (z.ortalama == null ? ' is-yok' : '') + '"><b>' + (z.ortalama == null ? 'veri yok' : String(z.ortalama).replace('.', ',')) + '</b>' + (z.ortalama == null ? '' : '<span>/5 ortalama</span>') + '</p>'
      + '<p class="gun-etiket">senin girdiğin · hesaplandı</p>'
      + sutunSvg(eD, eH, 5, 'Enerji: son ' + n + ' günde ' + z.girilen + ' gün girildi' + (z.ortalama == null ? '' : ', ortalama ' + z.ortalama + '/5')) + '</section>';
    // karne: hafta = Pazartesi'den (Bugun'deki ile ayni), ay = son 30 gun
    var karne = n === 7 && veri.karne
      ? karneHtml(veri.karne.satirlar.map(function(s){ return Object.assign({ gunler:veri.karne.gunler }, s); }), GUN, veri.karne.bugun, false, 4, 'Haftanın hayat karnesi')
      : karneHtml(d.satirlar, d.gunler.map(function(g, j){ var gn = Number(g.slice(8)); return j === n - 1 || gn === 1 || gn % 5 === 0 ? String(gn) : ''; }), n - 1, true, 4, 'Ayın hayat karnesi');
    // haftanin sekli: son 30 gunde gunlere gore ortalama
    var c = a30.calisma.sekil, gl = a30.gelisim.sekil, mx = Math.max.apply(null, c.concat(gl).map(function(v){ return v || 0; }).concat([1]));
    var cubuk = function(v, m){ return v == null ? '<i class="is-yok" style="--renk:var(--' + m + ')"></i>' : '<i style="--renk:var(--' + m + ');height:' + Math.max(2, v / mx * 100).toFixed(1) + '%"></i>'; };
    var sekil = '<section class="gun-kart" style="--i:5"><h2 class="gun-kart__ad">Haftanın şekli<small>son 30 gün · gün başına ort.</small></h2>'
      + '<div class="gun-sekil">' + GUN.map(function(g, j){
          return '<div role="img" aria-label="' + g + ': çalışma ' + (c[j] == null ? 'veri yok' : c[j] + ' dk') + ', gelişim ' + (gl[j] == null ? 'veri yok' : gl[j] + ' dk') + '">'
            + '<span class="gun-sekil__cift">' + cubuk(c[j], 'ays') + cubuk(gl[j], 'esp') + '</span><small>' + g + '</small></div>'; }).join('') + '</div>'
      + '<div class="gun-lejant"><span><i style="background:var(--ays)"></i>Çalışma · AYS</span><span><i style="background:var(--esp)"></i>Gelişim · ESP</span><span>ölçüldü</span></div></section>';
    // bugun: plan ve gercek
    var pg = GV.planGercek(serit());
    var plan = '<section class="gun-kart" style="--i:6"><h2 class="gun-kart__ad">Bugün: plan ve gerçek<small>' + (pg.length ? 'modüllerin planından' : 'veri yok') + '</small></h2>'
      + (pg.length ? '<ul class="gun-pg">' + pg.map(function(x){ var y = function(k){ return (x[k] / x.plan * 100).toFixed(1) + '%'; };
          return '<li style="--renk:var(--' + (x.modul === 'gun' ? 'mod' : x.modul) + ')"><b>' + MAD[x.modul] + '</b><span class="gun-yigin" role="img" aria-label="' + MAD[x.modul] + ': ' + x.plan + ' işten ' + x.bitti + ' bitti, ' + x.atlandi + ' atlandı, ' + x.acik + ' açık">'
            + '<i class="bitti" style="width:' + y('bitti') + '"></i><i class="atlandi" style="width:' + y('atlandi') + '"></i></span><small>' + x.bitti + '/' + x.plan + ' bitti' + (x.atlandi ? ' · ' + x.atlandi + ' atlandı' : '') + '</small></li>'; }).join('') + '</ul>'
          + '<div class="gun-lejant"><span><i style="background:var(--text-2)"></i>bitti</span><span><i style="background:repeating-linear-gradient(135deg, var(--text-3) 0 2px, transparent 2px 4px)"></i>atlandı</span><span>boş kısım: açık</span></div>'
        : '<p class="gun-senin" style="margin:0">' + (veri.durum === 'girisyok' ? 'Giriş yapılmadığı için modüllerin planı gelmedi.' : 'Bugün için plan yok: modüller plan yayınlayınca ya da Bugün’e iş ekleyince burada görünür.') + '</p>')
      + '</section>';
    // enerji ve ic hava izi
    var iz = '<section class="gun-kart" style="--i:7;padding:18px 20px;margin-top:12px"><h2 class="gun-kart__ad">Enerji ve iç hava<small>senin girdiğin · girilmeyen gün nokta</small></h2>'
      + '<div class="gun-iz' + (n > 7 ? ' is-ay' : '') + '" style="--n:' + n + '" role="img" aria-label="Son ' + n + ' gün: ' + z.girilen + ' gün enerji girildi' + (z.ortalama == null ? '' : ', ortalama ' + z.ortalama + '/5') + '">'
      + z.gunler.map(function(g){ var h = g.hava && HAVA.filter(function(x){ return x[0] === g.hava; })[0];
          return '<div title="' + g.gun + ': ' + (g.enerji ? 'enerji ' + g.enerji + '/5' : 'enerji girilmedi') + (h ? ', ' + h[1].toLocaleLowerCase('tr-TR') : '') + '">'
            + '<i class="gun-iz__pil' + (g.enerji ? '" style="--e:' + g.enerji : ' is-yok') + '"></i>'
            + (h ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + h[2] + '</svg>' : '<small>' + GUN[(new Date(g.gun + 'T12:00').getDay() + 6) % 7] + '</small>') + '</div>'; }).join('')
      + '</div></section>';
    return giris + '<div class="gun-olcu">' + olcuHtml(a.calisma, 'Çalışma', 'AYS', 1) + olcuHtml(a.gelisim, 'Gelişim', 'ESP', 2) + enerji + '</div>'
      + karne + '<div class="gun-iki" style="margin-top:12px">' + sekil + plan + '</div>' + iz;
  }

  /* ---------------- Sen: kendi sozun, veren / calan, «Ne yapsam?» destesi (sunucu sozu 27). */
  function deste(){ return sen.deste.length ? sen.deste : GV.BASLANGIC.map(function(k){ return Object.assign({}, k); }); }
  function desteDegis(fn){ var d = deste().map(function(k){ return Object.assign({}, k); }); fn(d); sen.deste = d; senYaz(); }
  var EN_AD = { az:'az enerji', cok:'çok enerji' };
  function listeHtml(k, ad, renk, ornek, i){
    var l = sen[k];
    return '<section class="gun-kart" style="--i:' + i + ';--renk:' + renk + '"><h2 class="gun-kart__ad">' + ad + '<small>' + l.length + '/12</small></h2>'
      + (l.length ? '<ul class="gun-cipler">' + l.map(function(x, j){ return '<li>' + kac(x) + '<button type="button" data-sen-sil="' + k + '" data-i="' + j + '" aria-label="' + kac(x) + ' sil">×</button></li>'; }).join('') + '</ul>'
        : '<p class="gun-senin" style="margin:0 0 12px">' + (k === 'veren' ? 'Seni ne dolduruyor? Yürüyüş, bir şarkı, bir arkadaş…' : 'Seni ne boşaltıyor? Uzun ekran, dağınık masa…') + '</p>')
      + (l.length < 12 ? '<form class="gun-ekle" data-sen-ekle="' + k + '"><input name="ad" maxlength="40" placeholder="' + ornek + '" aria-label="' + ad + ': ekle" required/><button type="submit">Ekle</button></form>' : '')
      + '</section>';
  }
  function senHtml(){
    if(!GV || !GV.kartCek) return '<section class="gun-kart gun-bos"><h2>Veri katmanı yüklenemedi</h2><p>Sayfayı yenile.</p></section>';
    var dst = deste(), ilkDeste = !sen.deste.length, enerji = Number(oku().enerji) || null, c = GV.kartCek(dst, enerji, haric);
    var yuz = c
      ? '<div class="gun-kartyuz" aria-live="polite"><small>' + kac(c.neden) + '</small><div><h3>' + kac(c.kart.ad) + '</h3><p>'
        + (c.kart.enerji ? EN_AD[c.kart.enerji] + ' · ' : '') + (c.kart.evet ? c.kart.evet + ' kez yaptın' : 'henüz yapmadın') + '</p></div>'
        + '<div class="gun-kartyuz__dugme"><button type="button" class="gun-dugme" data-kart-evet="' + c.sira + '">Yaptım</button>'
        + '<button type="button" class="gun-dugme is-ikinci" data-kart-gec="' + c.sira + '">Başka kart</button></div></div>'
      : '<div class="gun-kartyuz" aria-live="polite"><small>Deste bitti</small><div><h3>Bugünlük bu kadar kart</h3><p>Geçtiğin kartlar yeniden karışır.</p></div>'
        + '<div class="gun-kartyuz__dugme"><button type="button" class="gun-dugme" data-kart-karistir>Yeniden karıştır</button></div></div>';
    return '<section class="gun-kart gun-soz" style="--i:1"><h2 class="gun-kart__ad">Kendi sözün<small>senin yazdığın</small></h2>'
      + '<textarea id="gun-soz" maxlength="160" rows="2" placeholder="Kendime sözüm: her gün biraz, ama her gün." aria-label="Kendi sözün">' + kac(sen.soz) + '</textarea></section>'
      + '<div class="gun-iki">' + listeHtml('veren', 'Enerji veren', '#30a46c', 'Ekle: akşam yürüyüşü', 2) + listeHtml('calan', 'Enerji çalan', '#e5484d', 'Ekle: gece telefon', 3) + '</div>'
      + '<section class="gun-kart gun-deste" style="--i:4"><div><h2 class="gun-kart__ad">Ne yapsam?<small>' + (ilkDeste ? 'başlangıç destesi' : 'senin desten') + '</small></h2>' + yuz
      + '<p class="gun-senin">Kartı kural seçer: sık yaptıkların ve enerjine uyanlar öne çıkar' + (enerji ? ' · enerjin ' + enerji + '/5' : ' · Bugün’de enerji girersen ona göre seçer') + '.</p>'
      + (sonEylem ? '<p class="gun-senin" role="status">' + kac(sonEylem) + '</p>' : '')
      + '</div><div><h2 class="gun-kart__ad">Deste<small>' + dst.length + '/30</small></h2><ul class="gun-destelist">'
      + dst.map(function(k, j){ return '<li><span>' + kac(k.ad) + '</span><small>' + (k.enerji ? EN_AD[k.enerji] + ' · ' : '') + k.evet + ' yaptın · ' + k.gec + ' geçtin</small>'
          + '<button type="button" class="gun-sil" data-kart-sil="' + j + '" aria-label="' + kac(k.ad) + ' sil" title="Sil">×</button></li>'; }).join('') + '</ul>'
      + (dst.length < 30 ? '<form class="gun-ekle" data-kart-ekle><input name="ad" maxlength="60" placeholder="Kart ekle: bir şarkı aç" aria-label="Kartın adı" required/>'
        + '<select name="enerji" aria-label="Kartın enerjisi"><option value="">Fark etmez</option><option value="az">Az enerji</option><option value="cok">Çok enerji</option></select>'
        + '<button type="submit">Ekle</button></form>' : '')
      + '</div></section>';
  }
  function ciz(arka){
    var ae = document.activeElement;                                    // yazarken arka plan tazelemesi kutuyu silmez
    if(ae && (ae.id === 'gun-niyet' || (arka && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.closest && ae.closest('#main')))) return;
    var b = bolum(), v = oku();
    var cek = BOLUM.map(function(x){ return { id:x.id, ad:x.ad, route:x.id, on:x.id === b, bolumler:[] }; });
    var tarih = new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' });
    if(b === 'bugun'){
      document.getElementById('app').innerHTML = '<div class="site site--v5 site--gun">'
        + (K ? K.iskeletV5({ modul:'gun', baglam:'Günü kur, gidişi gör', cekmeceler:cek }) : '')
        + '<div class="site__body"><div class="wrapc sayfa"><main id="main" tabindex="-1"><div class="gun' + (ilk ? ' gun-gir' : '') + '">'
        + kahramanHtml(tarih.charAt(0).toLocaleUpperCase('tr-TR') + tarih.slice(1)) + ustHtml(v) + seritHtml() + alanlarHtml() + altHtml() + '</div></main></div></div></div>';
      ilk = false;
      return;
    }
    var ana = '<div class="gun' + (ilk ? ' gun-gir' : '') + '">'
      + '<header class="gun-bas" style="--i:0"><div><h1 class="gun-selam">' + (b === 'bugun' ? selam() : BOLUM.filter(function(x){ return x.id === b; })[0].ad) + '</h1>'
      + '<p class="gun-tarih">' + kac(tarih.charAt(0).toLocaleUpperCase('tr-TR') + tarih.slice(1)) + '</p></div>'
      + (b === 'analiz' ? '<div class="gun-gecis" role="group" aria-label="Dönem">'
          + [[7, 'Hafta'], [30, 'Ay']].map(function(d){ return '<button type="button" data-donem="' + d[0] + '" aria-pressed="' + (donemN === d[0]) + '">' + d[1] + '</button>'; }).join('') + '</div>'
        : '<span class="gun-merkez" data-hal="' + (merkez ? 'acik' : 'kapali') + '"><i aria-hidden="true"></i>' + (merkez === null ? 'Merkez’e bakılıyor…' : merkez ? 'Merkez açık' : 'Merkez kapalı · yerel') + '</span>')
      + '</header>' + (b === 'analiz' ? gecmisHtml() : senHtml()) + '</div>';
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
    var kb = t.closest && t.closest('[data-kendi-blok]');
    if(kb){ e.preventDefault(); var bl = (oku().bloklar || []).slice(), ki = Number(kb.getAttribute('data-kendi-blok'));
      if(bl[ki]){ bl[ki] = Object.assign({}, bl[ki], { bitti:!bl[ki].bitti }); yaz('bloklar', bl); ciz(); cumleIste(); } return; }
    var ps = t.closest && t.closest('[data-plan-sil]');
    if(ps){ var bs = (oku().bloklar || []).slice(); bs.splice(Number(ps.getAttribute('data-plan-sil')), 1); yaz('bloklar', bs.length ? bs : null); ciz(); cumleIste(); return; }
    var dn = t.closest && t.closest('[data-donem]');
    if(dn){ donemN = Number(dn.getAttribute('data-donem')); ciz(); return; }
    var ss = t.closest && t.closest('[data-sen-sil]');
    if(ss){ sen[ss.getAttribute('data-sen-sil')].splice(Number(ss.getAttribute('data-i')), 1); senYaz(); ciz(); return; }
    var ke = t.closest && t.closest('[data-kart-evet], [data-kart-gec]');
    if(ke){ var evet = ke.hasAttribute('data-kart-evet'), si = Number(ke.getAttribute(evet ? 'data-kart-evet' : 'data-kart-gec')), kad = '';
      desteDegis(function(d){ if(!d[si]) return; kad = d[si].ad; d[si][evet ? 'evet' : 'gec'] = Math.min(999, (d[si][evet ? 'evet' : 'gec'] || 0) + 1); });
      if(kad){ haric.push(kad); sonEylem = evet ? '«' + kad + '» yapıldı; deste bunu öğrendi.' : '«' + kad + '» geçildi; bugün yeniden gelmez.'; }
      ciz(); return; }
    if(t.closest && t.closest('[data-kart-karistir]')){ haric = []; sonEylem = ''; ciz(); return; }
    var ks = t.closest && t.closest('[data-kart-sil]');
    if(ks){ desteDegis(function(d){ d.splice(Number(ks.getAttribute('data-kart-sil')), 1); }); ciz(); return; }
    if(t.closest && t.closest('[data-odak-niyet]')){ e.preventDefault(); var i = document.getElementById('gun-niyet'); if(i) i.focus(); }
  });
  document.addEventListener('change', function(e){
    if(e.target && e.target.id === 'gun-niyet'){ yaz('niyet', e.target.value.trim()); cumleIste(); }
    if(e.target && e.target.id === 'gun-soz'){ sen.soz = e.target.value.replace(/\s+/g, ' ').trim().slice(0, 160); senYaz(); }
  });
  document.addEventListener('submit', function(e){
    var se = e.target && e.target.closest ? e.target.closest('[data-sen-ekle]') : null;
    var ka = e.target && e.target.closest ? e.target.closest('[data-kart-ekle]') : null;
    if(se || ka){
      e.preventDefault();
      var f0 = se || ka, deg = f0.querySelector('[name="ad"]').value.replace(/\s+/g, ' ').trim();
      if(se){ var k = se.getAttribute('data-sen-ekle'); deg = deg.slice(0, 40);
        if(deg && sen[k].length < 12 && sen[k].indexOf(deg) < 0){ sen[k].push(deg); senYaz(); } }
      else { deg = deg.slice(0, 60); var en = f0.querySelector('[name="enerji"]').value || null;
        desteDegis(function(d){ if(deg && d.length < 30 && !d.some(function(x){ return x.ad === deg; })) d.push({ ad:deg, enerji:en, evet:0, gec:0 }); }); }
      ciz();
      var sel = se ? '[data-sen-ekle="' + se.getAttribute('data-sen-ekle') + '"] [name="ad"]' : '[data-kart-ekle] [name="ad"]', yeni = document.querySelector(sel);
      if(yeni) try{ yeni.focus(); }catch(er){}
      return;
    }
    var f = e.target && e.target.closest ? e.target.closest('[data-gun-ekle]') : null;
    if(!f) return;
    e.preventDefault();
    var ad = f.querySelector('[name="ad"]').value.replace(/\s+/g, ' ').trim().slice(0, 80), sa = f.querySelector('[name="saat"]').value || null;
    var bl = (oku().bloklar || []).slice();
    if(!ad || bl.length >= 20) return;
    bl.push({ ad:ad, saat:sa, bitti:false });
    yaz('bloklar', bl); gorunum = 'yapacak'; ciz(); cumleIste();
    var i = document.querySelector('[data-gun-ekle] [name="ad"]'); if(i) try{ i.focus(); }catch(er){}
  });
  window.addEventListener('hashchange', function(){ ciz(); });
  setInterval(function(){
    var s = document.querySelector('.gun-saat'), b = document.getElementById('gun-simdi');
    if(s) s.style.setProperty('--simdi', simdiYuzde().toFixed(2) + '%');
    var c = document.querySelector('.gun-saat__simdi'); if(c) c.classList.toggle('is-sag', simdiYuzde() > 80);
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
