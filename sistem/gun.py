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
    "piksel-yazi.css": "text/css; charset=utf-8", "piksel.css": "text/css; charset=utf-8", "piksel.js": "text/javascript; charset=utf-8", "piksel-apartman.js": "text/javascript; charset=utf-8", "piksel-figur.js": "text/javascript; charset=utf-8", "piksel-simge.js": "text/javascript; charset=utf-8", "gunveri.js": "text/javascript; charset=utf-8", "bilinc.js": "text/javascript; charset=utf-8", "parca.js": "text/javascript; charset=utf-8",
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
<title>Giriş — LifeOS</title>
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

/* Kagit (.sayfa) dolguyu verir; bolumler tek aralikla dizilir, kartlar kendi disini bilmez. */
.gun{ --gun:var(--mod); --gun-ara:16px; --gun-ic:20px; position:relative; max-width:1080px; margin:0 auto; padding:0 0 8px; }
.gun > * + *{ margin-top:var(--gun-ara); }
.gun-bas{ display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:24px; }
.gun-selam{ margin:0; font-size:clamp(26px, 3.2vw, 36px); font-weight:700; letter-spacing:-.025em; line-height:1.1; }
.gun-tarih{ margin:6px 0 0; color:var(--text-2); font-size:15px; }
.gun-merkez{ display:inline-flex; align-items:center; gap:8px; font-size:12.5px; color:var(--text-3); }
.gun-merkez i{ width:7px; height:7px; border-radius:50%; background:var(--text-3); }
.gun-merkez[data-hal="acik"] i{ background:var(--ok, #1a7f5a); }

.gun-kart{ position:relative; border-radius:20px; background:color-mix(in oklab, var(--surface) 88%, transparent);
  box-shadow:inset 0 0 0 1px var(--border); }
.gun-kart__ad{ display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:2px 12px; margin:0 0 12px; font-size:14px; font-weight:700; color:var(--text); }
.gun-kart__ad small{ font-weight:500; color:var(--text-3); }

/* Guncelleme karti (ilk ekran Ana sayfa): yalniz yenilik ya da sorun varken gorunur. */
.gun-guncel{ display:flex; flex-wrap:wrap; gap:12px 20px; align-items:center; justify-content:space-between; padding:14px var(--gun-ic); box-shadow:inset 0 0 0 1.5px var(--mod); }
.gun-guncel[data-hal="uyari"]{ box-shadow:inset 0 0 0 1.5px var(--warn, #c0392b); }
.gun-guncel b{ display:block; font-size:15px; }
.gun-guncel small{ display:block; color:var(--text-2); font-size:13px; margin-top:2px; }
.gun-guncel ul{ margin:6px 0 0; padding-left:18px; color:var(--text-2); font-size:13px; }
.gun-guncel__d{ display:flex; gap:8px; }
.gun-guncel button{ min-height:40px; padding:0 16px; border-radius:10px; border:1px solid var(--border); background:none; color:var(--text); font:inherit; font-weight:600; cursor:pointer; }
.gun-guncel button.is-ana{ border:0; background:var(--mod); color:var(--on-accent, #fff); }

/* Ana sayfa › Kisisel araclar (2026-11-09) */
.gun-araclar__liste{ display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:12px; }
.gun-araclar{ padding:var(--gun-ic); }
.gun-arac{ display:flex; gap:14px; align-items:center; padding:14px; border-radius:14px; color:inherit; text-decoration:none; box-shadow:inset 0 0 0 1px var(--border); }
.gun-arac:hover, .gun-arac:focus-visible{ box-shadow:inset 0 0 0 1.5px var(--mod); }
.gun-arac__simge{ flex:none; width:44px; height:44px; border-radius:12px; display:grid; place-items:center; background:var(--mod-t); }
.gun-arac__simge svg{ width:30px; height:30px; fill:var(--mod); stroke:var(--mod); stroke-width:1.5; }
.gun-arac__simge path{ fill:none; }
.gun-arac__metin{ display:grid; gap:2px; min-width:0; }
.gun-arac__metin small{ color:var(--text-2); font-size:13px; }
.gun-arac__metin i{ font-style:normal; color:var(--text-3); font-size:12.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* Bilinc haritasi: renk konuyu ayirir; golge yok, ince cizgi, tek vurgu. */
.gun{ --bh-0:var(--mer); --bh-1:var(--ays); --bh-2:var(--spi); --bh-3:var(--esp);
  --bh-4:color-mix(in oklab, var(--mer) 55%, var(--ays)); --bh-5:color-mix(in oklab, var(--spi) 55%, var(--esp));
  --bh-6:color-mix(in oklab, var(--ays) 50%, var(--text)); --bh-7:color-mix(in oklab, var(--esp) 50%, var(--text)); }
.gun:has(.bh){ max-width:min(1600px, 100%); }
.bh{ display:grid; gap:var(--gun-ara); }
.bh input, .bh select, .bh textarea{ min-height:40px; padding:8px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font:inherit; }
.bh input:focus-visible, .bh textarea:focus-visible, .bh select:focus-visible{ outline:2px solid var(--mod); outline-offset:1px; }
.bh button{ font:inherit; }
.bh .is-ana, .bh-sor button{ min-height:40px; padding:0 16px; border-radius:10px; border:0; background:var(--mod); color:var(--on-accent, #fff); font-weight:600; cursor:pointer; }
.bh-sor button[disabled], .bh-dugme[disabled]{ opacity:.55; cursor:default; }
.bh-dugme{ min-height:40px; padding:0 14px; border-radius:10px; border:1px solid var(--border); background:none; color:var(--text); font-weight:600; cursor:pointer; }
.bh-dugme[aria-pressed="true"]{ border-color:var(--mod); color:var(--mod-ink, var(--mod)); }
.bh-arac{ display:flex; flex-wrap:wrap; gap:10px 16px; align-items:center; justify-content:space-between; padding:12px; }
.bh-yaz{ display:flex; flex-wrap:wrap; gap:8px; flex:1 1 520px; }
.bh-yaz input[name="baslik"]{ flex:1 1 240px; }
.bh-yaz input[name="konu"]{ flex:0 1 150px; }
.bh-arac__sag{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.bh-ara{ width:180px; }
.bh-yorum{ padding:14px var(--gun-ic); box-shadow:inset 3px 0 0 var(--mod), inset 0 0 0 1px var(--border); }
.bh-yorum b{ font-size:13px; color:var(--text-2); }
.bh-yorum p{ margin:4px 0; line-height:1.55; }
.bh-yorum small{ color:var(--text-3); font-size:12px; }
.bh-izgara{ display:grid; grid-template-columns:minmax(0, 1fr) minmax(340px, 400px); gap:var(--gun-ara); align-items:start; }
@media (max-width:980px){ .bh-izgara{ grid-template-columns:1fr; } }
.bh-harita{ position:relative; padding:0; overflow:hidden; }
.bh-konular{ position:absolute; z-index:1; top:10px; left:10px; right:120px; display:flex; flex-wrap:wrap; gap:6px; pointer-events:none; }
.bh-konular > *{ pointer-events:auto; }
.bh-sayac{ align-self:center; font-size:12.5px; color:var(--text-2); }
.bh-yakin{ position:absolute; z-index:1; top:10px; right:10px; display:flex; flex-direction:column; border-radius:10px; overflow:hidden; box-shadow:inset 0 0 0 1px var(--border); background:var(--surface); }
.bh-yakin button{ width:36px; height:36px; border:0; background:none; color:var(--text); font-size:17px; cursor:pointer; }
.bh-yakin button + button{ border-top:1px solid var(--border); }
.bh-cip{ display:inline-flex; align-items:center; gap:6px; min-height:28px; padding:2px 10px; border-radius:999px; border:1px solid var(--border); background:var(--surface); color:var(--text-2); font-size:12.5px; cursor:pointer; }
.bh-cip i{ width:8px; height:8px; border-radius:50%; background:var(--r); }
.bh-cip[aria-pressed="true"]{ border-color:var(--r, var(--mod)); color:var(--text); }
.bh-cip.is-celiski{ border-style:dashed; border-color:var(--warn, #c0392b); }
.bh-svg{ display:block; width:100%; height:min(74vh, 780px); min-height:420px; cursor:grab; touch-action:none; user-select:none;
  background-image:radial-gradient(circle, color-mix(in oklab, var(--text) 10%, transparent) 1px, transparent 1.4px); background-size:24px 24px; }
.bh-svg.is-surukle{ cursor:grabbing; }
.bh-k{ stroke:var(--text-3); stroke-width:1.2; opacity:.5; }
.bh-k--etiket{ stroke-dasharray:2 4; opacity:.3; }
.bh-k--celiski{ stroke:var(--warn, #c0392b); stroke-dasharray:6 4; opacity:.85; }
.bh-d{ cursor:pointer; outline:none; }
.bh-d circle{ fill:color-mix(in oklab, var(--r) 22%, var(--surface)); stroke:var(--r); stroke-width:1.6; }
.bh-d circle.is-soru{ stroke-dasharray:3 2; }
.bh-d text{ fill:var(--text-2); font-size:12px; text-anchor:middle; pointer-events:none; paint-order:stroke; stroke:var(--surface); stroke-width:3px; }
.bh-d:hover circle, .bh-d:focus-visible circle{ stroke-width:2.8; }
.bh-d:hover text, .bh-d:focus-visible text{ fill:var(--text); }
.bh-d.is-secili circle{ fill:var(--r); stroke-width:2.8; }
.bh-d.is-secili text{ fill:var(--text); font-weight:700; }
.is-sonuk{ opacity:.16; }
.bh-bos{ display:grid; place-items:center; min-height:420px; text-align:center; color:var(--text-2); padding:24px; }
.bh-bos p{ max-width:440px; margin:0; }
.bh-gruplar{ display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:16px; padding:56px 16px 16px; min-height:420px; align-content:start; }
.bh-grup h3{ display:flex; justify-content:space-between; margin:0 0 6px; padding-bottom:6px; font-size:13px; border-bottom:2px solid var(--r); }
.bh-grup h3 small{ color:var(--text-3); font-weight:500; }
.bh-grup ul, .bh-ozet, .bh-cubuk, .bh-lejant, .bh-sohbet, .bh-oneri, .bh-ipucu{ list-style:none; margin:0; padding:0; }
.bh-grup button, .bh-ozet button, .bh-profil__alt button{ display:block; width:100%; min-height:32px; padding:4px 6px; border:0; border-radius:8px; background:none; color:var(--text); font-size:13.5px; text-align:left; cursor:pointer; }
.bh-profil__alt li button{ display:inline; width:auto; padding:2px 4px; }
.bh-grup button:hover, .bh-ozet button:hover, .bh-grup button[aria-current]{ background:var(--mod-t); }
.bh-tur{ display:inline-block; min-width:46px; margin-right:6px; color:var(--text-3); font-size:11.5px; }
.bh-duzen{ display:grid; grid-template-columns:minmax(0, 1fr); gap:12px; padding:var(--gun-ic); position:sticky; top:12px; max-height:calc(100vh - 24px); overflow:auto; }
.bh-duzen--bos p{ margin:0; }
.bh-ipucu{ display:grid; gap:8px; font-size:13px; color:var(--text-2); }
.bh-ipucu li{ padding-left:14px; position:relative; }
.bh-ipucu li::before{ content:''; position:absolute; left:0; top:.55em; width:5px; height:5px; border-radius:50%; background:var(--mod); }
.bh-duzen__bas{ display:flex; gap:8px; align-items:center; }
.bh-duzen .bh-baslik{ flex:1; min-width:0; font-size:19px; font-weight:700; border-color:transparent; padding-left:0; background:none; }
.bh-duzen .bh-baslik:focus{ border-color:var(--border); padding-left:12px; }
.bh-kapat{ width:36px; height:36px; border-radius:8px; border:0; background:none; color:var(--text-3); font-size:20px; cursor:pointer; }
.bh-satir{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.bh-satir input{ flex:1 1 140px; min-width:0; }
.bh-kesin{ display:flex; align-items:center; gap:4px; }
.bh-kesin button{ width:24px; height:24px; border-radius:50%; border:1.5px solid var(--mod); background:none; cursor:pointer; padding:0; }
.bh-kesin button[aria-pressed="true"]{ background:var(--mod); }
.bh-kesin small{ margin-left:6px; color:var(--text-3); font-size:12px; }
.bh-kip{ display:flex; gap:2px; border-bottom:1px solid var(--border); }
.bh-kip button{ min-height:34px; padding:0 14px; border:0; border-bottom:2px solid transparent; margin-bottom:-1px; background:none; color:var(--text-2); font-weight:600; cursor:pointer; }
.bh-kip button[aria-selected="true"]{ color:var(--text); border-bottom-color:var(--mod); }
.bh-yazi{ position:relative; }
.bh-yazi textarea{ width:100%; box-sizing:border-box; resize:vertical; line-height:1.6; min-height:180px; }
.bh-oneri{ position:absolute; z-index:3; left:8px; right:8px; bottom:-4px; transform:translateY(100%); border-radius:10px; background:var(--surface); box-shadow:inset 0 0 0 1px var(--mod); padding:4px; }
.bh-oneri li{ padding:6px 10px; border-radius:6px; font-size:13.5px; cursor:pointer; }
.bh-oneri li[aria-selected="true"], .bh-oneri li:hover{ background:var(--mod-t); }
.bh-onizle{ min-height:180px; line-height:1.65; font-size:14.5px; }
.bh-onizle p{ margin:0 0 10px; }
.bh-bosmetin{ color:var(--text-3); }
.bh-bag{ display:inline; padding:0 4px; border:0; border-radius:4px; background:var(--mod-t); color:var(--mod-ink, var(--text)); font-weight:600; cursor:pointer; }
.bh-bag.is-celiski{ background:none; box-shadow:inset 0 -2px 0 var(--warn, #c0392b); }
.bh-bag.is-yok{ background:none; box-shadow:inset 0 0 0 1px dashed var(--border); color:var(--text-2); font-weight:500; border:1px dashed var(--border); }
.bh-bagl{ display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.bh-bagl h4{ flex-basis:100%; margin:0; font-size:12px; font-weight:600; color:var(--text-3); }
.bh-king{ display:grid; gap:8px; padding-top:12px; border-top:1px solid var(--border); }
.bh-king h3, .bh-profil h3{ display:flex; justify-content:space-between; gap:8px; margin:0; font-size:13px; }
.bh-king h3 small{ color:var(--text-3); font-weight:500; }
.bh-sohbet{ display:grid; gap:8px; max-height:320px; overflow:auto; }
.bh-sohbet li{ padding:8px 12px; border-radius:12px; line-height:1.55; font-size:14px; background:var(--mod-t); }
.bh-sohbet li.is-sen{ background:none; box-shadow:inset 0 0 0 1px var(--border); margin-left:16%; }
.bh-sohbet li b{ display:block; font-size:11.5px; color:var(--text-3); }
.bh-sohbet li.is-bekle{ color:var(--text-3); }
.bh-not{ margin:0; font-size:13px; color:var(--text-2); }
.bh-sor{ display:flex; gap:8px; }
.bh-sor input{ flex:1; min-width:0; }
.bh-alt{ display:flex; justify-content:space-between; align-items:center; color:var(--text-3); }
.bh-sil{ min-height:32px; padding:0 12px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-2); font-size:13px; cursor:pointer; }
/* Bilinc haritasi, ic dunya (2026-11-09): kivilcim, ic catisma, yalniz bana, dusuncenin yolu, akis, atif, medya. */
.bh-kivilcim{ display:flex; flex-wrap:wrap; gap:10px 16px; align-items:center; padding:12px var(--gun-ic); }
.bh-kivilcim__bas{ display:grid; flex:0 0 auto; }
.bh-kivilcim__bas b{ font-size:14px; } .bh-kivilcim__bas small{ color:var(--text-3); font-size:12px; }
.bh-kivilcim__l{ display:flex; flex-wrap:wrap; gap:8px; flex:1 1 400px; }
.bh-kivilcim__l button{ flex:1 1 220px; display:grid; gap:2px; text-align:left; padding:8px 12px; border-radius:12px; border:1px solid var(--border); background:none; color:var(--text); font-size:13.5px; line-height:1.4; cursor:pointer; }
.bh-kivilcim__l button:hover{ border-color:var(--mod); background:var(--mod-t); }
.bh-kivilcim__l small{ color:var(--text-3); font-size:11.5px; }
.bh-cat{ display:grid; grid-template-columns:1fr auto 1fr; gap:8px; align-items:start; }
.bh-cat__y{ display:grid; gap:6px; padding:10px; border-radius:12px; box-shadow:inset 0 0 0 1px var(--border); }
.bh-cat__y:first-child{ box-shadow:inset 3px 0 0 var(--ays), inset 0 0 0 1px var(--border); }
.bh-cat__y:last-child{ box-shadow:inset -3px 0 0 var(--esp), inset 0 0 0 1px var(--border); }
.bh-cat__y input, .bh-cat__y textarea{ width:100%; box-sizing:border-box; font-size:13.5px; resize:vertical; }
.bh-cat__y input{ font-weight:700; }
.bh-cat__ara{ align-self:center; color:var(--text-3); font-size:18px; }
@media (max-width:560px){ .bh-cat{ grid-template-columns:1fr; } .bh-cat__ara{ justify-self:center; } }
.bh-ozel{ display:flex; align-items:center; gap:8px; min-height:24px; font-size:13.5px; }
.bh-ozel small{ color:var(--text-3); }
.bh-kip__ek{ margin-left:auto; min-height:30px; padding:0 10px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-2); font-size:12.5px; cursor:pointer; }
.bh-kip__ek[aria-expanded="true"]{ border-color:var(--mod); color:var(--text); }
.bh-atifp{ display:grid; gap:8px; padding:10px; border-radius:12px; box-shadow:inset 0 0 0 1px var(--mod); }
.bh-atifp ul{ list-style:none; margin:0; padding:0; display:grid; gap:4px; max-height:240px; overflow:auto; }
.bh-atifp li button{ display:grid; grid-template-columns:auto 1fr; gap:0 8px; width:100%; padding:6px 8px; border:0; border-radius:8px; background:none; color:var(--text); text-align:left; cursor:pointer; }
.bh-atifp li button:hover{ background:var(--mod-t); }
.bh-atifp li i, .bh-atif i{ font-style:normal; font-size:10.5px; font-weight:700; padding:1px 6px; border-radius:6px; color:var(--r); box-shadow:inset 0 0 0 1px var(--r); align-self:center; }
.bh-atifp li small{ grid-column:2; color:var(--text-3); font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bh-atif{ display:inline-flex; align-items:center; gap:6px; padding:1px 8px 1px 3px; border-radius:8px; box-shadow:inset 0 0 0 1px var(--border); color:var(--text); text-decoration:none; font-weight:600; }
.bh-atif:hover{ box-shadow:inset 0 0 0 1.5px var(--r); }
.bh-link{ color:var(--mod-ink, var(--mod)); font-weight:600; }
.bh-m{ display:block; max-width:100%; margin:8px 0; border-radius:10px; }
.bh-m--gorsel img{ display:block; max-width:100%; max-height:360px; border-radius:10px; }
.bh-m--ses{ width:100%; }
.bh-m--yt{ width:100%; aspect-ratio:16/9; border:0; }
.bh-evrim{ display:grid; gap:8px; padding-top:12px; border-top:1px solid var(--border); }
.bh-evrim h4{ display:flex; justify-content:space-between; margin:0; font-size:13px; }
.bh-evrim h4 small{ color:var(--text-3); font-weight:500; }
.bh-evrim ol{ list-style:none; margin:0; padding:0 0 0 14px; display:grid; gap:8px; border-left:2px solid var(--mod-t); }
.bh-evrim li{ font-size:13.5px; line-height:1.5; }
.bh-evrim li small{ display:block; color:var(--text-3); font-size:11.5px; }
.bh-akis{ display:grid; gap:4px; padding:56px 16px 16px; max-height:min(74vh, 780px); min-height:420px; overflow:auto; align-content:start; }
.bh-akis h3{ margin:12px 0 4px; font-size:12.5px; color:var(--text-3); font-weight:600; }
.bh-akis__o{ display:grid; grid-template-columns:110px 1fr; gap:2px 10px; padding:8px 10px; border:0; border-radius:10px; background:none; color:var(--text); text-align:left; cursor:pointer; }
.bh-akis__o:hover, .bh-akis__o.is-on{ background:var(--mod-t); }
.bh-akis__o small{ grid-column:2; color:var(--text-2); font-size:13px; }
.bh-d.is-ozel circle, .bh-d.is-ozel rect{ stroke-dasharray:2 3; }
.bh-d rect{ fill:color-mix(in oklab, var(--r) 22%, var(--surface)); stroke:var(--warn, #c0392b); stroke-width:1.8; }
.bh-d.is-cozuldu rect{ stroke:var(--r); }
.bh-d.is-secili rect{ fill:var(--r); stroke-width:2.8; }
.bh-y--deger{ background:var(--bh-4); } .bh-y--ozellik{ background:var(--bh-5); } .bh-y--catisma{ background:var(--warn, #c0392b); }
/* Telefon ve tablet (2026-11-09, kullanici: «telefon ve tablet boyutunda karmasik»): tek satir arac, tek kivilcim,
   kayan konu cipleri, bos duzenleyici gizli, secili dusunce alttan acilan sayfa. Masaustu degismez. */
@media (max-width:980px){
  .bh-arac{ padding:10px; gap:8px; }
  .bh-yaz{ flex:1 1 100%; flex-wrap:nowrap; }
  .bh-yaz select, .bh-yaz input[name="konu"]{ display:none; }
  .bh-arac__sag{ flex:1 1 100%; display:grid; grid-template-columns:1fr auto; }
  .bh-ara{ width:auto; min-width:0; }
  .bh-arac__sag [data-bh-tam]{ display:none; }
  .bh-arac__sag [data-bh-yorum]{ grid-column:1 / -1; min-height:36px; font-size:13px; }
  .bh-kivilcim{ padding:10px; gap:8px; }
  .bh-kivilcim__bas small{ display:none; }
  .bh-kivilcim__l{ flex:1 1 100%; }
  .bh-kivilcim__l button:nth-child(n+2){ display:none; }
  .bh-kivilcim > .bh-dugme{ min-height:36px; font-size:13px; }
  .bh-konular{ position:static; flex-wrap:nowrap; overflow-x:auto; padding:10px 10px 0; scrollbar-width:none; }
  .bh-konular .bh-cip{ flex:none; }
  .bh-yakin{ top:auto; bottom:10px; }
  .bh-svg{ height:auto; min-height:0; aspect-ratio:5 / 3; }
  .bh-gruplar, .bh-akis{ padding-top:10px; min-height:0; }
  .bh-duzen--bos{ display:none; }
  .bh-duzen.is-dolu{ position:fixed; z-index:70; left:0; right:0; bottom:0; top:auto; max-height:88vh; border-radius:20px 20px 0 0;
    background:var(--surface); box-shadow:0 -1px 0 var(--border); padding:16px 16px calc(16px + env(safe-area-inset-bottom)); }
  .bh-duzen .gun-gecis{ flex-wrap:nowrap; overflow-x:auto; max-width:100%; }
  .bh-duzen .gun-gecis button{ flex:none; }
  .bh-profil__alt{ grid-template-columns:1fr 1fr; }
}
@media (max-width:699px){ .bh-svg{ aspect-ratio:600 / 760; max-height:70vh; } }
@media (max-width:560px){ .bh-profil__alt{ grid-template-columns:1fr; } }
/* Odak kipi: duzenleyici ekranin neredeyse tamami; solda genis yazi, sagda ince yan sutun. */
html.bh-odak-acik{ overflow:hidden; }
.bh-odak-perde{ position:fixed; z-index:79; inset:0; background:color-mix(in oklab, var(--text) 35%, transparent); }
.bh-duzen.bh-duzen--odak{ position:fixed; z-index:80; inset:2vh 2vw; top:2vh; max-height:none; display:grid; grid-template-columns:minmax(0, 1fr) minmax(320px, 420px);
  gap:28px; padding:24px 28px; overflow:hidden; border-radius:20px; background:var(--surface); }
.bh-odak__yazi{ display:flex; flex-direction:column; gap:12px; min-height:0; min-width:0; }
.bh-odak__yazi .bh-baslik{ font-size:26px; }
.bh-odak__yazi .bh-yazi{ flex:1; display:flex; min-height:0; }
.bh-odak__yazi textarea{ flex:1; height:auto; min-height:0; resize:none; font-size:17px; line-height:1.8; padding:20px 28px; }
.bh-odak__yazi .bh-onizle{ flex:1; overflow:auto; font-size:17px; line-height:1.8; padding:8px 28px; }
.bh-odak__yazi .bh-oneri{ top:12px; bottom:auto; left:auto; right:12px; width:min(300px, 80%); transform:none; }
.bh-odak__yan .gun-gecis{ flex-wrap:wrap; }
.bh-yerel{ position:relative; display:grid; gap:6px; padding:10px; border-radius:14px; box-shadow:inset 0 0 0 1px var(--border); }
.bh-yerel h4{ display:flex; justify-content:space-between; margin:0; font-size:13px; }
.bh-yerel h4 small{ color:var(--text-3); font-weight:500; }
.bh-yerel .bh-svg{ height:auto; min-height:0; aspect-ratio:400 / 280; background-size:16px 16px; }
.bh-yerel .bh-yakin{ top:auto; bottom:14px; right:14px; }
.bh-yerel .bh-yakin button{ width:28px; height:28px; font-size:15px; }
.bh-yerel p{ margin:0; font-size:13px; }
.bh-odak__yan{ display:grid; grid-template-columns:minmax(0, 1fr); gap:12px; align-content:start; min-height:0; overflow:auto; padding-left:24px; border-left:1px solid var(--border); }
.bh-odakd{ min-height:34px; padding:0 12px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-2); font:inherit; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }
.bh-odakd[aria-pressed="true"]{ border-color:var(--mod); color:var(--text); }
.bh-kelime{ align-self:center; margin-left:12px; font-size:12.5px; color:var(--text-3); }
@media (max-width:980px){
  .bh-duzen.is-dolu.bh-duzen--odak{ inset:0; max-height:none; border-radius:0; grid-template-columns:minmax(0, 1fr); overflow-x:hidden; overflow-y:auto; padding:16px; }
  .bh-odak__yan{ overflow:visible; padding-left:0; border-left:0; border-top:1px solid var(--border); padding-top:12px; }
  .bh-odak__yazi .bh-yazi{ min-height:62vh; }
  .bh-odak__yazi textarea{ padding:14px 16px; font-size:16px; }
  .bh-odak__yazi .bh-baslik{ font-size:20px; }
}
/* Tam ekran: harita butun pencere, duzenleyici sagda. */
html.bh-tam-acik{ overflow:hidden; }
.bh--tam .bh-izgara{ position:fixed; z-index:60; inset:0; padding:12px; gap:12px; background:var(--bg, var(--surface)); grid-template-columns:minmax(0, 1fr) minmax(340px, 420px); }
.bh--tam .bh-svg{ height:calc(100vh - 24px); }
.bh--tam .bh-duzen{ max-height:calc(100vh - 24px); top:0; }
.bh--tam .bh-arac{ position:fixed; z-index:61; left:24px; bottom:24px; right:auto; max-width:calc(100vw - 480px); }
@media (max-width:980px){ .bh--tam .bh-izgara{ grid-template-columns:1fr; overflow:auto; } .bh--tam .bh-arac{ position:static; } }
.bh-profil{ padding:var(--gun-ic); display:grid; gap:16px; }
.bh-profil__ust{ display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px; }
.bh-profil__ust h3{ margin-bottom:8px; }
.bh-cubuk li{ display:grid; grid-template-columns:minmax(80px, 140px) 1fr 28px; gap:8px; align-items:center; font-size:13px; min-height:24px; }
.bh-cubuk span{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bh-cubuk i{ height:6px; border-radius:3px; background:linear-gradient(90deg, var(--mod) var(--o), var(--border) var(--o)); }
.bh-cubuk b{ text-align:right; font-weight:600; }
.bh-yigin{ display:flex; height:10px; border-radius:5px; overflow:hidden; gap:2px; }
.bh-y--fikir{ background:var(--bh-0); } .bh-y--inanc{ background:var(--bh-1); } .bh-y--soru{ background:var(--bh-2); }
.bh-y--karar{ background:var(--bh-3); } .bh-y--his{ background:var(--bh-6); }
.bh-lejant{ display:flex; flex-wrap:wrap; gap:4px 14px; margin-top:8px; font-size:12.5px; color:var(--text-2); }
.bh-lejant i{ display:inline-block; width:8px; height:8px; border-radius:2px; margin-right:6px; }
.bh-profil__alt{ display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; }
.bh-izin{ display:grid; gap:6px; padding-top:12px; border-top:1px solid var(--border); font-size:13.5px; }
.bh-izin label{ display:flex; gap:8px; align-items:center; min-height:24px; }
.bh-izin details ul{ margin:6px 0; padding-left:18px; color:var(--text-2); }
.bh-izin small{ color:var(--text-3); }

/* ust sira: niyet · enerji · ic hava */
.gun-ust{ display:grid; grid-template-columns:1.5fr 1fr 1.3fr; padding:var(--gun-ic); }
.gun-ust__b{ min-width:0; }
.gun-ust__b + .gun-ust__b{ margin-left:var(--gun-ic); padding-left:var(--gun-ic); border-left:2px dashed var(--border-strong); }
.gun-ust > .gun-senin{ grid-column:1 / -1; }
.gun-niyet{ width:100%; border:0; padding:0; background:transparent; color:var(--text); font:inherit; font-size:17px; font-weight:600; letter-spacing:-.01em; }
.gun-niyet::placeholder{ color:var(--text-3); font-weight:500; }
.gun-niyet:focus{ outline:none; }
.gun-pil{ display:flex; align-items:center; gap:16px; }
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
.gun-senin{ margin:12px 0 0; font-size:12px; color:var(--text-3); }

/* gunun seridi */
.gun-serit{ padding:var(--gun-ic); }
.gun-serit__ust{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.gun-serit__ust .gun-kart__ad{ margin:0; }
.gun-gecis{ display:inline-flex; padding:3px; border-radius:999px; background:var(--surface-2); }
.gun-gecis button{ min-height:30px; padding:0 14px; border:0; border-radius:999px; background:transparent; color:var(--text-2); font:inherit; font-size:13px; font-weight:600;
  cursor:pointer; transition:background .25s ease, color .2s, box-shadow .25s; }
.gun-gecis button[aria-pressed="true"]{ background:var(--surface); color:var(--text); box-shadow:none; }
.gun-saat{ position:relative; height:max(132px, calc(var(--seritler, 1) * 34px + 38px)); margin-top:36px; }
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
.gun-saat__simdi b{ position:absolute; top:-26px; left:8px; padding:2px 7px; border-radius:6px; background:var(--mod); color:var(--primary-ink); font-size:11px;
  font-weight:650; font-variant-numeric:tabular-nums; white-space:nowrap; }
.gun-saat__bos{ position:absolute; inset:24px 8% 40px; display:grid; place-items:center; text-align:center; font-size:13.5px; color:var(--text-2); }
.gun-saat__bos small{ display:block; margin-top:2px; color:var(--text-3); font-size:12px; }

/* alanlar: hedef olmadigi icin cubuk yok; deger ya da «veri yok» */
.gun-alanlar{ display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); padding:8px; }
.gun-alan{ display:grid; align-content:start; gap:4px; min-width:0; padding:12px; border:0; background:none; text-align:left; font:inherit; color:var(--text); cursor:pointer; }
.gun-alan + .gun-alan{ border-left:2px dashed var(--border-strong); }
.gun-alan:hover{ background:var(--surface-2); }
.gun-alan > b{ display:flex; align-items:center; gap:7px; font-size:13px; font-weight:650; color:var(--text-2); }
.gun-alan > b i{ flex:none; width:8px; height:8px; background:var(--renk); }
.gun-alan__deger{ font-size:18px; font-weight:700; font-variant-numeric:tabular-nums; }
.gun-alan__deger.is-yok{ font-size:14px; font-weight:500; color:var(--text-3); }
.gun-alan small{ font-size:12px; color:var(--text-3); }

/* alt sira: simdi ne yapsam · hayat karnesi */
.gun-alt{ display:grid; gap:var(--gun-ara); }
.gun-oneri{ padding:var(--gun-ic); }
.gun-oneri h3{ margin:4px 0 6px; font-size:20px; font-weight:700; letter-spacing:-.02em; }
.gun-oneri p{ margin:0 0 14px; color:var(--text-2); font-size:14px; }
.gun-oneri__eylem{ display:flex; flex-wrap:wrap; align-items:center; gap:10px 16px; }
.gun-oneri a{ display:inline-flex; align-items:center; gap:6px; min-height:36px; padding:0 16px; border-radius:999px; background:var(--mod); color:var(--primary-ink);
  text-decoration:none; font-size:13.5px; font-weight:650; transition:transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s; }
.gun-oneri a:hover{ transform:translateY(-1px); box-shadow:none; }
.gun-karne{ padding:var(--gun-ic); }
.gun-karne__izgara{ display:grid; grid-template-columns:84px repeat(7, 1fr); gap:4px; align-items:center; font-size:12px; }
.gun-karne__izgara > span{ color:var(--text-3); text-align:center; }
.gun-karne__izgara > span.is-bugun{ color:var(--mod-ink); font-weight:700; }
.gun-karne__izgara > b{ font-weight:600; color:var(--text-2); font-size:12px; }
/* Kare sutunun tamamini doldurur: bas yazi ve hucre ayni hizada (eskiden kare solda, gun adi ortadaydi). */
.gun-kare{ display:block; height:24px; box-shadow:inset 0 0 0 1.5px color-mix(in oklab, var(--text) 14%, transparent);
  background:repeating-linear-gradient(135deg, color-mix(in oklab, var(--text) 7%, transparent) 0 3px, transparent 3px 6px); }
.gun-lejant{ display:flex; gap:14px; margin-top:12px; font-size:11.5px; color:var(--text-3); flex-wrap:wrap; }
.gun-lejant i{ display:inline-block; width:10px; height:10px; margin-right:5px; border-radius:3px; vertical-align:-1px; }

/* seritteki bloklar (F3a: hesap sunucusundaki «tek gun», sunucu sozu 22) */
.gun-blok{ position:absolute; left:var(--x); top:calc(8px + var(--serit, 0) * 34px); width:calc(var(--gen, 20) * 1%); box-sizing:border-box; display:inline-flex; align-items:center; gap:6px;
  height:28px; padding:0 10px 0 8px; border-radius:9px; font-size:12px; font-weight:600; color:var(--text); text-decoration:none; white-space:nowrap;
  background:color-mix(in oklab, var(--renk) 10%, var(--surface)); box-shadow:inset 3px 0 0 var(--renk), inset 0 0 0 1px color-mix(in oklab, var(--renk) 30%, transparent);
  animation:gun-gel .45s cubic-bezier(.22,1,.36,1) both; animation-delay:calc(var(--i, 0) * 50ms); transition:transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s; z-index:1; }
.gun-blok span{ min-width:0; overflow:hidden; text-overflow:ellipsis; }
.gun-blok small{ margin-left:auto; color:var(--text-3); font-weight:500; font-variant-numeric:tabular-nums; }
.gun-blok:hover{ transform:translateY(-2px); z-index:2; }
.gun-blok[data-durum="bitti"]{ background:color-mix(in oklab, var(--renk) 22%, var(--surface)); }
.gun-blok[data-durum="bitti"]::before{ content:"✓"; color:var(--renk); font-weight:800; }
.gun-blok[data-durum="atlandi"]{ opacity:.55; text-decoration:line-through; }
.gun-blok[data-durum="vakti"]{ box-shadow:inset 3px 0 0 var(--renk), 0 0 0 2px color-mix(in oklab, var(--renk) 45%, transparent); }
.gun-saatsiz{ display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:12px; }
.gun-saatsiz > span{ font-size:12px; font-weight:650; color:var(--text-3); margin-right:2px; }
.gun-saatsiz .gun-blok{ position:static; width:auto; max-width:100%; animation-delay:0s; }
.gun-saatsiz .gun-blok:hover{ transform:translateY(-2px); }
.gun-notlar{ margin:10px 0 0; padding:0; list-style:none; font-size:12px; color:var(--text-3); }
.gun-kare.is-yapildi{ background:var(--renk); box-shadow:none; }
.gun-kare.is-kayit-yok{ background:transparent; box-shadow:inset 0 0 0 1.5px color-mix(in oklab, var(--renk) 40%, transparent); }
.gun-kare.is-gelecek{ background:transparent; box-shadow:inset 0 0 0 1px color-mix(in oklab, var(--text) 8%, transparent); }
.gun-kare.is-bugun{ outline:2px solid var(--mod); outline-offset:-2px; }

/* ust: modul kapagi gibi dogrudan kagitta, kart degil; selam, gunun cumlesi, ilerleme halkasi */
.gun-kahraman{ display:grid; grid-template-columns:minmax(0, 1fr) auto; align-items:start; gap:16px 24px; padding:0 0 8px; }
.gun-kahraman .gun-selam{ font-size:clamp(28px, 3.4vw, 40px); }
.gun-kahraman .gun-tarih{ display:flex; align-items:center; gap:4px 14px; flex-wrap:wrap; }
.gun-cumle{ margin:14px 0 0; max-width:640px; font-size:16px; line-height:1.5; color:var(--text); min-height:1.5em; }
.gun-cumle small{ display:block; margin-top:4px; font-size:12px; color:var(--text-3); }
.gun-halka{ position:relative; width:104px; height:104px; flex:none; }
.gun-halka svg{ width:100%; height:100%; transform:rotate(-90deg); }
.gun-halka circle{ fill:none; stroke-width:10; }
.gun-halka .iz{ stroke:color-mix(in oklab, var(--text) 9%, transparent); }
.gun-halka .dolu{ stroke:var(--mod); stroke-linecap:round; transition:stroke-dashoffset .8s cubic-bezier(.22,1,.36,1); }
.gun-halka div{ position:absolute; inset:0; display:grid; place-content:center; text-align:center; }
.gun-halka b{ font-size:22px; font-weight:750; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
.gun-halka small{ font-size:11px; color:var(--text-3); }
/* kendi isler: seritte dorduncu sira, planim listesi, ekle formu */
.gun-blok[data-kendi-blok]{ cursor:pointer; }
.gun-plan{ padding:var(--gun-ic); }
.gun-plan ul{ list-style:none; margin:0 0 10px; padding:0; display:grid; gap:4px; max-height:190px; overflow:auto; }
.gun-plan li{ display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:10px; transition:background .2s ease; }
.gun-plan li:hover{ background:var(--surface-2); }
.gun-plan li.is-bitti span{ color:var(--text-3); text-decoration:line-through; }
.gun-plan li span{ flex:1; min-width:0; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gun-plan li small{ font-size:12px; color:var(--text-3); font-variant-numeric:tabular-nums; }
.gun-tik{ flex:none; width:20px; height:20px; display:grid; place-items:center; padding:0; border:0; border-radius:6px; cursor:pointer;
  background:transparent; box-shadow:inset 0 0 0 1.5px color-mix(in oklab, var(--mod) 55%, var(--border)); color:var(--primary-ink); transition:background .2s ease, transform .2s; }
.gun-tik[aria-pressed="true"]{ background:var(--mod); box-shadow:none; }
.gun-tik:active{ transform:scale(.9); }
.gun-tik svg{ width:13px; height:13px; fill:none; stroke:currentColor; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; }
.gun-sil{ flex:none; width:24px; height:24px; padding:0; border:0; border-radius:6px; background:transparent; color:var(--text-3); cursor:pointer; opacity:.55; transition:opacity .2s; }
.gun-plan li:hover .gun-sil, .gun-destelist li:hover .gun-sil, .gun-sil:focus-visible{ opacity:1; }
.gun-ekle{ display:flex; align-items:center; gap:6px; }
.gun-ekle input{ min-width:0; height:36px; padding:0 12px; font:inherit; font-size:14px; color:var(--text); }
.gun-ekle input[name="ad"]{ flex:1; }
.gun-ekle input[name="saat"]{ width:116px; flex:none; }
.gun-ekle button{ height:36px; padding:0 14px; border:0; border-radius:10px; background:var(--mod); color:var(--primary-ink); font:inherit; font-size:13.5px; font-weight:650; cursor:pointer; }
.gun-alt{ grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); }

/* Gecmis (plan §2): olcu kutulari, hayat karnesi (hafta / ay), haftanin sekli, plan ve gercek, enerji izi */
.gun-bas .gun-gecis{ align-self:center; }
.gun-olcu{ display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:var(--gun-ara); }
.gun-olcu > .gun-kart{ padding:var(--gun-ic); }
.gun-sayi{ display:flex; align-items:baseline; gap:6px; margin:2px 0 2px; }
.gun-sayi b{ font-size:30px; font-weight:720; letter-spacing:-.03em; font-variant-numeric:tabular-nums; line-height:1.1; }
.gun-sayi span{ font-size:13px; color:var(--text-2); }
.gun-sayi.is-yok b{ color:var(--text-3); font-weight:600; font-size:22px; }
.gun-etiket{ margin:0 0 10px; font-size:12px; color:var(--text-3); }
.gun-sutun{ display:block; width:100%; height:38px; }
.gun-sutun rect.d{ fill:var(--renk); }
.gun-sutun rect.s{ fill:color-mix(in oklab, var(--renk) 35%, transparent); }
.gun-sutun rect.b{ fill:color-mix(in oklab, var(--mod) 12%, transparent); }
.gun-karne.is-ay .gun-karne__izgara{ grid-template-columns:84px repeat(30, 1fr); gap:2px; }
.gun-karne.is-ay .gun-kare{ border-radius:3px; height:18px; box-shadow:inset 0 0 0 1px color-mix(in oklab, var(--text) 12%, transparent); }
.gun-karne.is-ay .gun-kare.is-yapildi{ box-shadow:none; }
.gun-karne.is-ay .gun-kare.is-kayit-yok{ box-shadow:inset 0 0 0 1px color-mix(in oklab, var(--renk) 40%, transparent); }
.gun-karne.is-ay .gun-karne__izgara > span{ font-size:10px; }
.gun-iki{ display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:var(--gun-ara); }
.gun-iki > .gun-kart{ padding:var(--gun-ic); }
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
.gun-izkart{ padding:var(--gun-ic); }
.gun-iz svg{ width:16px; height:16px; fill:none; stroke:var(--text-2); stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
.gun-iz.is-ay small, .gun-iz.is-ay svg{ display:none; }

/* Sen (plan §2): kendi sozun, veren / calan, «Ne yapsam?» destesi */
.gun-soz{ padding:var(--gun-ic); }
/* Soz kartin kendisidir: piksel alan kutusu (uzerine yazi yapisiyordu) burada yok. */
:root[data-zemin="piksel"] .gun-soz textarea{ background:none; box-shadow:none; margin:0; }
.gun-soz textarea{ display:block; width:100%; min-height:2.8em; padding:0; border:0; resize:none; background:transparent; color:var(--text); font:inherit;
  font-size:clamp(19px, 2.4vw, 24px); font-weight:600; letter-spacing:-.015em; line-height:1.35; field-sizing:content; }
.gun-soz textarea::placeholder{ color:var(--text-3); font-weight:500; }
.gun-soz textarea:focus{ outline:none; }
.gun-cipler{ display:flex; flex-wrap:wrap; gap:6px; margin:0 0 12px; padding:0; list-style:none; min-height:32px; }
.gun-cipler li{ display:inline-flex; align-items:center; gap:2px; min-height:32px; padding:0 4px 0 12px; border-radius:999px; font-size:13.5px;
  background:color-mix(in oklab, var(--renk) 12%, var(--surface)); box-shadow:inset 0 0 0 1px color-mix(in oklab, var(--renk) 28%, transparent); }
.gun-cipler li button{ width:24px; height:24px; padding:0; border:0; border-radius:50%; background:transparent; color:var(--text-3); font-size:15px; cursor:pointer; }
.gun-cipler li button:hover{ background:var(--surface-2); color:var(--text); }
.gun-cipler .gun-senin{ margin:0; align-self:center; }
.gun-deste{ display:grid; grid-template-columns:minmax(0, 1.1fr) minmax(0, 1fr); gap:var(--gun-ic); padding:var(--gun-ic); align-items:start; }
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
  cursor:pointer; background:var(--mod); color:var(--primary-ink); transition:transform .25s cubic-bezier(.22,1,.36,1); text-decoration:none; }
.gun-dugme.is-ikinci{ background:var(--surface); color:var(--text); box-shadow:inset 0 0 0 1px var(--border); }
.gun-dugme:hover{ transform:translateY(-1px); }
.gun-destelist{ margin:0 0 10px; padding:0; list-style:none; display:grid; gap:2px; max-height:320px; overflow:auto; }
.gun-destelist li{ display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:10px; font-size:13.5px; }
.gun-destelist li:hover{ background:var(--surface-2); }
.gun-destelist li span{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gun-destelist li small{ color:var(--text-3); font-size:11.5px; font-variant-numeric:tabular-nums; white-space:nowrap; }
.gun-ekle select{ height:36px; padding-left:8px; color:var(--text); font:inherit; font-size:13px; }
.gun-oneri .gun-oneri__kart{ font-size:13px; color:var(--mod-ink); font-weight:600; text-decoration:none; background:none; padding:0; min-height:0; }
@media (max-width:900px){ .gun-olcu{ grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); } .gun-olcu > :last-child{ grid-column:1 / -1; } .gun-iki, .gun-deste{ grid-template-columns:minmax(0, 1fr); } }
@media (max-width:560px){ .gun-olcu{ grid-template-columns:minmax(0, 1fr); } .gun-karne.is-ay .gun-karne__izgara{ grid-template-columns:62px repeat(30, 1fr); gap:1px; }
  .gun-karne__izgara{ grid-template-columns:64px repeat(7, 1fr); } .gun-ekle{ flex-wrap:wrap; } .gun-ekle input[name="ad"]{ flex-basis:100%; }
  .gun-ekle input[name="saat"], .gun-ekle select{ flex:1; } .gun-destelist li{ flex-wrap:wrap; } .gun-destelist li span{ flex-basis:calc(100% - 40px); } }
@media (hover:none){ .gun-sil{ opacity:1; } }
.gun-saat__simdi.is-sag b{ left:auto; right:8px; }

/* Gecmis ve Sen */
.gun-bos{ display:grid; justify-items:center; gap:10px; padding:56px 24px; text-align:center; }
.gun-bos svg{ width:40px; height:40px; fill:none; stroke:var(--mod); stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
.gun-bos h2{ margin:0; font-size:22px; letter-spacing:-.02em; }
.gun-bos p{ margin:0; max-width:460px; color:var(--text-2); }

.gun-gir > *{ animation:gun-gel .55s cubic-bezier(.22,1,.36,1) both; animation-delay:calc(var(--i, 0) * 60ms); }
@keyframes gun-gel{ from{ opacity:0; transform:translateY(10px); } }
@media (max-width:900px){ .gun-ust{ grid-template-columns:minmax(0, 1fr) minmax(0, 1.3fr); }
  .gun-ust__b:first-child{ grid-column:1 / -1; margin-bottom:16px; padding-bottom:16px; border-bottom:2px dashed var(--border-strong); }
  .gun-ust__b:nth-child(2){ margin-left:0; padding-left:0; border-left:0; }
  .gun-alt{ grid-template-columns:minmax(0, 1fr); } }
/* Telefon: 16 saatlik yatay eksene ad sigmaz; ayni bloklar saat sirasiyla liste olur, ustte gunun gecen kismi. */
@media (max-width:560px){ .gun{ --gun-ic:16px; }
  .gun-kahraman{ gap:12px 16px; } .gun-halka{ width:72px; height:72px; } .gun-halka b{ font-size:16px; } .gun-halka small{ display:none; }
  .gun-niyet{ font-size:15px; }
  .gun-ust{ grid-template-columns:minmax(0, 1fr); }
  .gun-ust__b + .gun-ust__b{ margin-left:0; padding-left:0; border-left:0; }
  .gun-ust__b:not(:last-of-type){ margin-bottom:16px; padding-bottom:16px; border-bottom:2px dashed var(--border-strong); }
  .gun-alanlar{ grid-template-columns:minmax(0, 1fr); }
  .gun-alan{ grid-template-columns:minmax(0, 1fr) auto; align-items:baseline; column-gap:12px; padding:10px 8px; }
  .gun-alan + .gun-alan{ border-left:0; border-top:2px dashed var(--border-strong); }
  .gun-alan__deger{ grid-column:2; grid-row:1; text-align:right; } .gun-alan small{ grid-column:1 / -1; }
  .gun-karne__izgara{ grid-template-columns:64px repeat(7, 1fr); gap:3px; }
  .gun-saat{ height:auto; margin-top:12px; display:grid; gap:6px; padding-top:12px; }
  .gun-saat__izgara, .gun-saat__etiket, .gun-saat__simdi{ display:none; }
  .gun-saat__gecmis{ top:0; bottom:auto; height:6px; opacity:1; background:var(--mod); }
  .gun-saat[data-gorunum="yapacak"] .gun-saat__gecmis{ opacity:1; }
  .gun-saat .gun-blok{ position:static; width:100%; height:36px; }
  .gun-saat__bos{ position:static; padding:12px 0 4px; } }
@media (prefers-reduced-motion:reduce){ .gun-gir > *, .gun-blok, .gun-kartyuz{ animation:none; } .gun-saat__simdi::before{ animation:none; }
  .gun-hava button, .gun-pil button, .gun-oneri a, .gun-dugme, .gun-halka .dolu, .gun-saat__gecmis, .gun-saat__simdi, .gun-sekil__cift i, .gun-gecis button{ transition:none; }
  .gun-hava button:hover, .gun-dugme:hover, .gun-blok:hover, .gun-oneri a:hover{ transform:none; } }
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
<script src="/gun/ortak/bilinc.js"></script>
<script>
(function(){
  'use strict';
  var L = window.LIFEOS || {}, K = L.KABUK;
  var HOST = '__HOST__';
  var BOLUM = [{ id:'bugun', ad:'Giriş' }, { id:'bilinc', ad:'Bilinç haritası' }, { id:'analiz', ad:'Geçmiş' }, { id:'calisma', ad:'Sen' }];
  var ALANLAR = [['uyku', 'Uyku', 'spi'], ['beslenme', 'Beslenme', 'spi'], ['hareket', 'Hareket', 'spi'], ['calisma', 'Çalışma', 'ays'], ['gelisim', 'Gelişim', 'esp']];
  var MAD = { ays:'AYS', spi:'SPİ', esp:'ESP', gun:'Giriş' }, MPORT = { ays:4173, spi:4183, esp:4193 };
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
      ? 'cümle modelden · sayılar koddan' : 'hesaplandı') + '</small></p>';
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
      + '<form class="gun-ekle" data-gun-ekle><input type="text" name="ad" maxlength="80" placeholder="İş ekle: kitap oku" aria-label="İşin adı" required/>'
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
    if(x && x.modul === 'gun') return { bas:x.ad, ne:'Sıradaki: kendi planından' + (x.saat ? ' · ' + x.saat : ''), ad:'Bitti olarak işaretle', href:'#bugun', kendi:x.kendi, kaynak:'planından' };
    if(x) return { bas:x.ad, ne:'Sıradaki: ' + MAD[x.modul] + (x.saat ? ' · ' + x.saat : ' · ' + DILIM_AD[x.dilim]) + (x.alt ? ' · ' + x.alt : ''),
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
    return '<div class="gun-kart gun-ust" style="--i:1">'
      + '<section class="gun-ust__b"><h2 class="gun-kart__ad">Günün niyeti</h2>'
      + '<input class="gun-niyet" id="gun-niyet" maxlength="120" placeholder="Bugün neyi bitirmek istiyorsun?" value="' + kac(v.niyet || '') + '" aria-label="Günün niyeti"/></section>'
      + '<section class="gun-ust__b"><h2 class="gun-kart__ad">Enerji pili</h2><div class="gun-pil" data-v="' + pil + '">'
      + '<div class="gun-pil__govde" role="group" aria-label="Enerji">' + [1, 2, 3, 4, 5].map(function(n){
          return '<button type="button" data-pil="' + n + '" aria-label="Enerji ' + n + '/5: ' + PIL[n] + '" aria-pressed="' + (n === pil) + '"></button>'; }).join('') + '</div>'
      + '<span class="gun-pil__metin">' + (pil ? PIL[pil] : 'veri yok') + '</span></div></section>'
      + '<section class="gun-ust__b"><h2 class="gun-kart__ad">İç hava</h2><div class="gun-hava" role="group" aria-label="İç hava">'
      + HAVA.map(function(h){ var on = v.hava === h[0];
          return '<button type="button" data-hava="' + h[0] + '" aria-pressed="' + on + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + h[2] + '</svg>' + h[1] + '</button>'; }).join('')
      + '</div></section><p class="gun-senin">Senin girdiğin</p></div>';
  }
  function blokHtml(x, i, yer){
    return '<a class="gun-blok" href="' + kac(adres(x.modul, x.rota)) + '"' + (x.kendi != null ? ' data-kendi-blok="' + x.kendi + '"' : '') + ' data-durum="' + x.durum + '" style="--renk:var(--' + x.modul + ')'
      + (yer ? ';--serit:' + yer.serit + ';--x:' + yer.x.toFixed(2) + '%;--gen:' + yer.gen : '') + ';--i:' + i + '" title="' + kac(MAD[x.modul] + ' · ' + x.ad + (x.alt ? ' · ' + x.alt : '') + (x.saat ? ' · ' + x.saat : '')) + '">'
      + '<span>' + kac(x.ad) + '</span>' + (x.saat ? '<small>' + x.saat + '</small>' : '') + '</a>';
  }
  function gorunsun(x){
    if(secAlan){ var m = ALANLAR.filter(function(a){ return a[0] === secAlan; })[0][2]; if(x.modul !== m) return false; }
    return gorunum === 'yaptim' ? (x.durum === 'bitti' || x.durum === 'atlandi') : (x.durum === 'bekliyor' || x.durum === 'vakti');
  }
  function seritHtml(){
    var saatler = []; for(var h = 7; h <= 22; h++) saatler.push(h);
    var sr = serit(), saatli = sr.bloklar.filter(gorunsun), saatsiz = sr.saatsiz.filter(gorunsun), yer = GV.seritYeri(saatli);
    var bos = veri.durum === 'bekle' ? 'Üç modülün bugünü getiriliyor…<small>&nbsp;</small>'
      : veri.durum === 'girisyok' ? 'Hesabınla giriş yapılmamış: veri yok<small><a href="/kartlar/">Giriş sayfasından</a> hesabına girince AYS, SPİ ve ESP’nin bugünkü blokları burada dizilir</small>'
      : veri.durum === 'hata' ? 'Veri katmanı yüklenemedi<small>Sayfayı yenile</small>'
      : (gorunum === 'yaptim' ? 'Bugün biten blok yok' : 'Bekleyen blok yok') + '<small>' + (secAlan ? 'Bu alanda; alanı yeniden seçince hepsi döner' : 'Modüller bugün için plan yayınladıkça burada belirir') + '</small>';
    return '<section class="gun-kart gun-serit" style="--i:4"><div class="gun-serit__ust"><h2 class="gun-kart__ad">Günün şeridi</h2>'
      + '<div class="gun-gecis" role="group" aria-label="Şerit">'
      + '<button type="button" data-gorunum="yaptim" aria-pressed="' + (gorunum === 'yaptim') + '">Yaptıklarım</button>'
      + '<button type="button" data-gorunum="yapacak" aria-pressed="' + (gorunum === 'yapacak') + '">Yapacaklarım</button></div></div>'
      + '<div class="gun-saat" data-gorunum="' + gorunum + '" style="--simdi:' + simdiYuzde().toFixed(2) + '%;--seritler:' + yer.seritler + '">'
      + '<div class="gun-saat__izgara" aria-hidden="true">' + saatler.map(function(){ return '<span></span>'; }).join('') + '</div>'
      + '<div class="gun-saat__gecmis" aria-hidden="true"></div>'
      + '<div class="gun-saat__simdi' + (simdiYuzde() > 80 ? ' is-sag' : '') + '" aria-hidden="true"><b id="gun-simdi">' + saatMetni() + '</b></div>'
      + (saatli.length ? saatli.map(function(x, i){ return blokHtml(x, i, yer.yerler[i]); }).join('') : (saatsiz.length ? '' : '<div class="gun-saat__bos">' + bos + '</div>'))
      + '<div class="gun-saat__etiket" aria-hidden="true">' + saatler.map(function(h){ return '<span>' + ('0' + h).slice(-2) + '</span>'; }).join('') + '</div>'
      + '</div>'
      + (saatsiz.length ? '<div class="gun-saatsiz"><span>Saati yok</span>' + saatsiz.map(function(x, i){ return blokHtml(x, i).replace('<span>', '<span>' + kac(DILIM_AD[x.dilim]) + ' · '); }).join('') + '</div>' : '')
      + (sr.notlar.length ? '<ul class="gun-notlar">' + sr.notlar.map(function(n){ return '<li>' + kac(n) + '</li>'; }).join('') + '</ul>' : '')
      + '</section>';
  }
  function alanlarHtml(){
    var oz = veri.karne ? veri.karne.bugunOzet : {};
    var hal = function(a){ var k = veri.karne && veri.karne.satirlar.filter(function(x){ return x.alan === a[0]; })[0]; return k ? k.hucreler[veri.karne.bugun] : 'veri-yok'; };
    return '<div class="gun-kart gun-alanlar" role="group" aria-label="Alanlar" style="--i:5">' + ALANLAR.map(function(a){
      var h = hal(a), v = oz[a[0]];
      var deger = h === 'yapildi' ? v + ' dk' : h === 'kayit-yok' ? 'kayıt yok' : 'veri yok', alt = (h === 'yapildi' ? 'ölçüldü · ' : h === 'kayit-yok' ? 'bugün · ' : '') + MAD[a[2]];
      return '<button type="button" class="gun-alan" data-alan="' + a[0] + '" aria-pressed="' + (secAlan === a[0]) + '" style="--renk:var(--' + a[2] + ')">'
        + '<b><i aria-hidden="true"></i>' + a[1] + '</b><span class="gun-alan__deger' + (h === 'yapildi' ? '' : ' is-yok') + '">' + deger + '</span><small>' + alt + '</small></button>'; }).join('') + '</div>';
  }
  function altHtml(){
    var o = oneri(), k = veri.karne, bugunNo = k ? k.bugun : (new Date().getDay() + 6) % 7;
    return '<div class="gun-alt"><section class="gun-kart gun-oneri" style="--i:6"><h2 class="gun-kart__ad">Şimdi ne yapsam?<small>' + (o.kaynak || 'saate göre') + '</small></h2>'
      + '<h3>' + kac(o.bas) + '</h3><p>' + kac(o.ne) + '</p><div class="gun-oneri__eylem"><a href="' + kac(o.href) + '"' + (o.odak ? ' data-odak-niyet' : '') + (o.kendi != null ? ' data-kendi-blok="' + o.kendi + '"' : '') + '>' + kac(o.ad) + ' →</a>'
      + '<a class="gun-oneri__kart" href="#calisma">ya da desteden kart çek</a></div></section>'
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
      + '</div><div class="gun-lejant"><span><i style="background:var(--text-2)"></i>yapıldı</span>'
      + '<span><i style="box-shadow:inset 0 0 0 1.5px var(--text-3)"></i>kayıt yok</span>'
      + '<span><i class="gun-kare" style="display:inline-block;width:10px;height:10px"></i>veri yok</span></div>'
      + '<p class="gun-senin">Uyku, beslenme ve hareket: SPİ henüz günlük özet yayınlamıyor.</p></section>';
  }
  function gecmisHtml(){
    if(!GV || !GV.donem) return '<section class="gun-kart gun-bos"><h2>Veri katmanı yüklenemedi</h2><p>Sayfayı yenile.</p></section>';
    var n = donemN, bg = bugun(), d = GV.donem(veri.gunluk, bg, n), d30 = n === 30 ? d : GV.donem(veri.gunluk, bg, 30), z = GV.izDizi(sen.iz, bg, n);
    var a = {}; d.satirlar.forEach(function(s){ s.gunler = d.gunler; a[s.alan] = s; });
    var a30 = {}; d30.satirlar.forEach(function(s){ a30[s.alan] = s; });
    var giris = veri.durum === 'girisyok' ? '<p class="gun-senin" style="margin:0">Hesabınla giriş yapılmamış: modüllerin özeti gelmez, sayılar «veri yok» kalır.</p>' : '';
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
    var iz = '<section class="gun-kart gun-izkart" style="--i:7"><h2 class="gun-kart__ad">Enerji ve iç hava<small>senin girdiğin · girilmeyen gün nokta</small></h2>'
      + '<div class="gun-iz' + (n > 7 ? ' is-ay' : '') + '" style="--n:' + n + '" role="img" aria-label="Son ' + n + ' gün: ' + z.girilen + ' gün enerji girildi' + (z.ortalama == null ? '' : ', ortalama ' + z.ortalama + '/5') + '">'
      + z.gunler.map(function(g){ var h = g.hava && HAVA.filter(function(x){ return x[0] === g.hava; })[0];
          return '<div title="' + g.gun + ': ' + (g.enerji ? 'enerji ' + g.enerji + '/5' : 'enerji girilmedi') + (h ? ', ' + h[1].toLocaleLowerCase('tr-TR') : '') + '">'
            + '<i class="gun-iz__pil' + (g.enerji ? '" style="--e:' + g.enerji : ' is-yok') + '"></i>'
            + (h ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + h[2] + '</svg>' : '<small>' + GUN[(new Date(g.gun + 'T12:00').getDay() + 6) % 7] + '</small>') + '</div>'; }).join('')
      + '</div></section>';
    return giris + '<div class="gun-olcu">' + olcuHtml(a.calisma, 'Çalışma', 'AYS', 1) + olcuHtml(a.gelisim, 'Gelişim', 'ESP', 2) + enerji + '</div>'
      + karne + '<div class="gun-iki">' + sekil + plan + '</div>' + iz;
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
      + (l.length < 12 ? '<form class="gun-ekle" data-sen-ekle="' + k + '"><input type="text" name="ad" maxlength="40" placeholder="' + ornek + '" aria-label="' + ad + ': ekle" required/><button type="submit">Ekle</button></form>' : '')
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
      + dst.map(function(k, j){ return '<li><span>' + kac(k.ad) + '</span><small>' + [k.enerji ? EN_AD[k.enerji] : '', k.evet ? k.evet + ' yaptın' : '', k.gec ? k.gec + ' geçtin' : ''].filter(Boolean).join(' · ') + '</small>'
          + '<button type="button" class="gun-sil" data-kart-sil="' + j + '" aria-label="' + kac(k.ad) + ' sil" title="Sil">×</button></li>'; }).join('') + '</ul>'
      + (dst.length < 30 ? '<form class="gun-ekle" data-kart-ekle><input type="text" name="ad" maxlength="60" placeholder="Kart ekle: bir şarkı aç" aria-label="Kartın adı" required/>'
        + '<select name="enerji" aria-label="Kartın enerjisi"><option value="">Fark etmez</option><option value="az">Az enerji</option><option value="cok">Çok enerji</option></select>'
        + '<button type="submit">Ekle</button></form>' : '')
      + '</div></section>';
  }
  /* BILINC HARITASI (2026-11-09): Ana sayfa › Kisisel araclar. Saf katman brand/ortak/bilinc.js; burada
     depo (bu tarayici + hesap sunucusu `gun/bilinc`), cizim, gezinme (surukle, tekerlek, tam ekran), Defter
     gibi yazma ([[ onerisi, onizleme, geri baglar) ve King. King'in sozu modelden, profil ve sayilar koddan;
     King'in kisi modeline giden kayitlar `gun/kisi` (izin kapaliysa bos). */
  var BH = (function(){
    var B = L.Bilinc, ANA = 'lifeos.bilinc', YORUM = 'lifeos.bilinc.yorum', W = 1200, H = 720, OLCEK = 1;
    /* Dar ekran: dikey cerceve, buyuk nokta ve yazi (telefonda 1200 genislik yazilari 3 piksele dusuruyordu). */
    function boyut(){ var dar = window.innerWidth < 700, w = dar ? 600 : 1200; if(w !== W){ vb = { x:0, y:0, s:1 }; yerCache.anahtar = ''; } W = w; H = dar ? 760 : 720; OLCEK = dar ? 1.9 : 1; }
    var d = null, zaman = 0, sec = null, gor = 'harita', odak = null, aranan = '', bekle = null, not_ = '', saat = null;
    var kip = 'yaz', tam = false, vb = { x:0, y:0, s:1 }, surukle = null, yerCache = { anahtar:'', yer:null };
    var notlar = null, atifAc = false, atifAra = '', odakYaz = false, yvb = { x:0, y:0, s:1 };
    function vbM(h){ var st = h.st; return st.x.toFixed(1) + ' ' + st.y.toFixed(1) + ' ' + (h.w / st.s).toFixed(1) + ' ' + (h.h / st.s).toFixed(1); }
    function odakKur(v){ odakYaz = !!v && !!sec; document.documentElement.classList.toggle('bh-odak-acik', odakYaz); }   // modullerin Defter notlari (/api/hesap/defter), atif secici
    var yorum = (function(){ try{ return JSON.parse(localStorage.getItem(YORUM) || 'null'); }catch(e){ return null; } })();
    function yerel(){ try{ var v = JSON.parse(localStorage.getItem(ANA) || 'null'); if(v && v.veri){ zaman = Number(v.zaman) || 0; return B.temiz(v.veri); } }catch(e){} return B.temiz({}); }
    function veri(){ if(!d && B) d = yerel(); return d; }
    function kaydet(){
      zaman = Date.now();
      try{ localStorage.setItem(ANA, JSON.stringify({ veri:d, zaman:zaman })); }catch(e){}
      clearTimeout(saat);
      saat = setTimeout(function(){
        var o = oturum(); if(!o) return;
        var h = { 'Content-Type':'application/json', 'X-LifeOS':'hesap', Authorization:'Bearer ' + o.j };
        fetch((o.s || '') + '/api/hesap/yayin', { method:'POST', cache:'no-store', credentials:'omit', headers:h,
          body:JSON.stringify({ ad:'gun/bilinc', icerik:JSON.stringify(d) }) }).catch(function(){ /* yerelde kalir */ });
        fetch((o.s || '') + '/api/hesap/yayin', { method:'POST', cache:'no-store', credentials:'omit', headers:h,
          body:JSON.stringify({ ad:'gun/kisi', icerik:JSON.stringify({ kayitlar:B.kisiKayitlari(d) }) }) }).catch(function(){});
      }, 800);
    }
    /* Sunucu asil: daha yeniyse alinir; yerel daha yeniyse yukari cikar. */
    function yukle(){
      if(!B || !oturum()) return;
      api('/api/hesap/bilinc').then(function(s){
        veri();
        if(s && s.zaman && s.zaman > zaman){ d = B.temiz(s); zaman = s.zaman; try{ localStorage.setItem(ANA, JSON.stringify({ veri:d, zaman:zaman })); }catch(e){} ciz(true); }
        else if(d.dusunceler.length && (!s || !s.zaman || zaman > s.zaman)) kaydet();
      }).catch(function(){});
    }
    function bul(id){ var v = veri(); return v ? v.dusunceler.filter(function(x){ return x.id === id; })[0] || null : null; }
    function adla(ad){ var k = B.kucuk(ad); return veri().dusunceler.filter(function(x){ return B.kucuk(x.baslik) === k; })[0] || null; }
    function turAd(t){ return (B.TURLER.filter(function(x){ return x.id === t; })[0] || {}).ad || t; }
    /* Yerlesim yalniz yapi degisince yeniden hesaplanir (yazarken harita kipirdamaz). */
    function yerlesim(v, g){
      var a = JSON.stringify([v.dusunceler.map(function(x){ return x.id + '|' + x.konu; }), g.kenar.map(function(e){ return e.a + e.b + e.tur; })]);
      if(a !== yerCache.anahtar) yerCache = { anahtar:a, yer:B.yerlesim(v, g, W, H) };   // anahtar boyut degisince boyut() siler
      return yerCache.yer;
    }
    function vbMetin(){ var w = W / vb.s, h = H / vb.s; return vb.x.toFixed(1) + ' ' + vb.y.toFixed(1) + ' ' + w.toFixed(1) + ' ' + h.toFixed(1); }
    function vbYaz(){ var s = document.querySelector('.bh-svg'); if(s) s.setAttribute('viewBox', vbMetin()); }
    function yakinlas(k, cx, cy){
      var ns = Math.max(0.5, Math.min(4, vb.s * k)), w0 = W / vb.s, h0 = H / vb.s, w1 = W / ns, h1 = H / ns;
      cx = cx == null ? 0.5 : cx; cy = cy == null ? 0.5 : cy;
      vb.x += (w0 - w1) * cx; vb.y += (h0 - h1) * cy; vb.s = ns; vbYaz();
    }
    function araclarHtml(){
      var v = veri();
      if(!v) return '';
      var g = B.ag(v), son = v.dusunceler[0], bag = g.kenar.filter(function(e){ return e.tur !== 'etiket'; }).length;
      return '<section class="gun-kart gun-araclar" style="--i:2"><h2 class="gun-kart__ad">Kişisel araçlar<small>yalnız senin</small></h2><div class="gun-araclar__liste">'
        + '<a class="gun-arac" href="#bilinc" data-act="go" data-route="bilinc"><span class="gun-arac__simge" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M10 28L20 12L30 24Z"/><circle cx="10" cy="28" r="3.5"/><circle cx="20" cy="12" r="4.5"/><circle cx="30" cy="24" r="3"/></svg></span>'
        + '<span class="gun-arac__metin"><b>Bilinç haritası</b><small>' + (v.dusunceler.length ? v.dusunceler.length + ' düşünce · ' + bag + ' bağ' : 'Düşüncelerini yaz, bağla, King’le tartış') + '</small>'
        + (son ? '<i>Son: ' + kac(son.baslik) + '</i>' : '') + '</span></a></div></section>';
    }
    /* Onizleme: [[bag]] tiklanir; olmayan bag «+» ile yeni dusunce olur. */
    function notAdres(m, id){ return 'http://' + (location.hostname || HOST) + ':' + MPORT[m] + '/#defter=' + encodeURIComponent(id); }
    /* Medya: yalniz http(s); gorsel, video, ses yerinde oynar, YouTube cerezsiz gomulur, oteki adres baglanti olur. */
    function medyaHtml(u){
      var t = B.medyaTuru(u), a = kac(u);
      if(!t) return a;
      if(t.tur === 'gorsel') return '<a class="bh-m bh-m--gorsel" href="' + a + '" target="_blank" rel="noopener noreferrer"><img src="' + a + '" alt="Görsel" loading="lazy" referrerpolicy="no-referrer"/></a>';
      if(t.tur === 'video') return '<video class="bh-m" controls preload="metadata" src="' + a + '"></video>';
      if(t.tur === 'ses') return '<audio class="bh-m bh-m--ses" controls preload="none" src="' + a + '"></audio>';
      if(t.tur === 'youtube') return '<iframe class="bh-m bh-m--yt" src="https://www.youtube-nocookie.com/embed/' + t.id + '" title="YouTube videosu" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
      return '<a class="bh-link" href="' + a + '" target="_blank" rel="noopener noreferrer">' + kac(t.ad) + ' ↗</a>';
    }
    function onizle(metin){
      if(!String(metin || '').trim()) return '<p class="bh-bosmetin">Henüz metin yok.</p>';
      return String(metin).split(/\n{2,}/).map(function(p){
        var yer = [], tut = function(h){ yer.push(h); return '\u0001' + (yer.length - 1) + '\u0002'; };
        var t = kac(p).replace(/\[\[not:(ays|spi|esp)\/([\w-]{1,64})\|([^\[\]\n]{1,80})\]\]/gi, function(m, mod, id, ad){
          mod = mod.toLowerCase(); return tut('<a class="bh-atif" href="' + kac(notAdres(mod, id)) + '" style="--r:var(--' + mod + ')"><i>' + MAD[mod] + '</i>' + ad + '</a>'); });
        t = t.replace(/https?:\/\/[^\s<>"]+/g, function(u){
          var son = (/[.,;:!?)]+$/.exec(u) || [''])[0]; u = u.slice(0, u.length - son.length);
          return tut(medyaHtml(u.replace(/&amp;/g, '&'))) + son; });
        return '<p>' + t.replace(/\[\[(!?)([^\[\]\n]{1,80})\]\]/g, function(m, c, ad){
          var var_ = !!adla(ad.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
          return '<button type="button" class="bh-bag' + (c ? ' is-celiski' : '') + (var_ ? '' : ' is-yok') + '" data-bh-git="' + ad + '">' + (c ? '≠ ' : '') + ad + (var_ ? '' : ' +') + '</button>';
        }).replace(/\n/g, '<br/>').replace(/\u0001(\d+)\u0002/g, function(m, i){ return yer[Number(i)]; }) + '</p>';
      }).join('');
    }
    function notlariAl(){
      if(notlar || !oturum()) return;
      notlar = [];
      api('/api/hesap/defter').then(function(r){
        notlar = [];
        ((r && r.moduller) || []).forEach(function(m){ (m.notlar || []).forEach(function(n){ if(n && n.id && String(n.baslik || '').trim()) notlar.push({ modul:m.modul, id:String(n.id), baslik:String(n.baslik).slice(0, 80), govde:String(n.govde || '').slice(0, 160) }); }); });
        atifListeYaz();
      }).catch(function(){ notlar = null; });
    }
    function atifListe(){
      if(!oturum()) return '<p class="gun-senin">Hesabına girince AYS, SPİ ve ESP’deki eşitlenmiş notların burada listelenir.</p>';
      if(!notlar) return '<p class="gun-senin">Notlar yükleniyor…</p>';
      var q = B.kucuk(atifAra), l = notlar.filter(function(n){ return !q || B.kucuk(n.baslik + ' ' + n.govde).indexOf(q) >= 0; }).slice(0, 30);
      if(!l.length) return '<p class="gun-senin">' + (notlar.length ? 'Eşleşen not yok.' : 'Eşitlenmiş not yok: modülde Defter’e yazdığın notlar hesabına gidince burada görünür.') + '</p>';
      return '<ul>' + l.map(function(n){ return '<li><button type="button" data-bh-atif="' + notlar.indexOf(n) + '" style="--r:var(--' + n.modul + ')"><i>' + MAD[n.modul] + '</i><b>' + kac(n.baslik) + '</b>' + (n.govde ? '<small>' + kac(n.govde) + '</small>' : '') + '</button></li>'; }).join('') + '</ul>';
    }
    function atifListeYaz(){ var e = document.getElementById('bh-atifl'); if(e) e.innerHTML = atifListe(); }
    function catismaHtml(x){
      var yan = function(i){ var t = x.taraf[i]; return '<div class="bh-cat__y"><input data-bh-taraf="' + i + '" data-bh-tk="ad" maxlength="40" placeholder="' + (i ? 'Öbür yanım' : 'Bir yanım') + '" value="' + kac(t.ad) + '" aria-label="' + (i ? 'Öbür yanın adı' : 'Bir yanın adı') + '"/>'
        + '<textarea data-bh-taraf="' + i + '" data-bh-tk="ister" rows="2" maxlength="240" placeholder="Ne istiyor?" aria-label="Ne istiyor">' + kac(t.ister) + '</textarea>'
        + '<textarea data-bh-taraf="' + i + '" data-bh-tk="korkar" rows="2" maxlength="240" placeholder="Neden korkuyor?" aria-label="Neden korkuyor">' + kac(t.korkar) + '</textarea></div>'; };
      return '<div class="bh-cat">' + yan(0) + '<span class="bh-cat__ara" aria-hidden="true">↔</span>' + yan(1) + '</div>'
        + '<div class="gun-gecis" role="group" aria-label="Çatışmanın durumu">' + [['acik', 'Hâlâ açık'], ['cozuldu', 'Çözüldü']].map(function(k){ return '<button type="button" data-bh-durum="' + k[0] + '" aria-pressed="' + (x.durum === k[0]) + '">' + k[1] + '</button>'; }).join('') + '</div>';
    }
    function evrimHtml(x){
      return '<div class="bh-evrim"><h4>Düşüncenin yolu<small>' + (x.evrim.length ? x.evrim.length + ' kez yeniden düşündün' : 'fikrin değişirse buraya yaz') + '</small></h4>'
        + (x.evrim.length ? '<ol>' + x.evrim.slice().reverse().map(function(e){ return '<li><small>' + new Date(e.zaman).toLocaleDateString('tr-TR', { day:'numeric', month:'short', year:'numeric' }) + ' · kesinlik ' + e.kesinlik + '/5</small>' + kac(e.metin) + '</li>'; }).join('') + '</ol>' : '')
        + '<form class="bh-sor" data-bh-evrim><input name="metin" maxlength="600" placeholder="Şimdi ne düşünüyorum?" aria-label="Yeniden düşündüğün"/><button type="submit" class="bh-dugme">Ekle</button></form></div>';
    }
    function akisHtml(v){
      var gun = '';
      return '<div class="bh-akis">' + B.akis(v).slice(0, 150).map(function(e){
        var g = e.zaman ? new Date(e.zaman).toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : 'Tarihsiz', bas = g !== gun ? '<h3>' + g + '</h3>' : '';
        gun = g;
        return bas + '<button type="button" class="bh-akis__o' + (e.id === sec ? ' is-on' : '') + '" data-bh-sec="' + kac(e.id) + '"><span class="bh-tur">' + (e.olay === 'yeniden' ? 'yeniden düşündü' : turAd(e.tur)) + '</span><b>' + kac(e.baslik) + '</b>'
          + (e.metin ? '<small>' + kac(e.metin.slice(0, 160)) + '</small>' : '') + '</button>';
      }).join('') + '</div>';
    }
    function bagListe(baslik, l){
      return l.length ? '<div class="bh-bagl"><h4>' + baslik + '</h4>' + l.map(function(k){ return '<button type="button" class="bh-cip' + (k.tur === 'celiski' || k.celiski ? ' is-celiski' : '') + '" data-bh-sec="' + kac(k.id) + '">' + (k.tur === 'celiski' || k.celiski ? '≠ ' : '') + kac(k.baslik) + '</button>'; }).join('') + '</div>' : '';
    }
    /* Duzenleyici parcalari: normalde tek sutun; Odak kipinde (2026-11-09, kullanici: «ekranin neredeyse tamamini
       kaplayan odak modu») solda genis yazi alani, sagda ince yan sutun. */
    /* Yerel ag (Obsidian'daki gibi): yazarken kenarda bu dusunce, komsulari ve onlarin komsulari; en cok 30. */
    function yerelHtml(x){
      var v = veri(), g = B.ag(v), ids = {}, n = 1;
      ids[x.id] = 1;
      var k1 = B.komsular(v, g, x.id);
      k1.forEach(function(k){ if(!ids[k.id]){ ids[k.id] = 1; n++; } });
      k1.forEach(function(k){ B.komsular(v, g, k.id).forEach(function(k2){ if(!ids[k2.id] && n < 30){ ids[k2.id] = 1; n++; } }); });
      var alt = { dusunceler:v.dusunceler.filter(function(y){ return ids[y.id]; }), izin:v.izin }, g2 = B.ag(alt);
      return '<div class="bh-yerel" id="bh-yerel"><h4>Yerel ağ<small>' + (k1.length ? k1.length + ' doğrudan bağ' : 'bağ yok') + '</small></h4>'
        + (alt.dusunceler.length > 1 ? B.haritaSvg(alt, g2, B.yerlesim(alt, g2, 400, 280), { w:400, h:280, secili:x.id, vb:vbM({ st:yvb, w:400, h:280 }) })
          + '<div class="bh-yakin" role="group" aria-label="Yerel ağı yakınlaştır"><button type="button" data-bh-yzum="1.25" aria-label="Yakınlaş">+</button><button type="button" data-bh-yzum="0.8" aria-label="Uzaklaş">−</button><button type="button" data-bh-yzum="0" aria-label="Sığdır" title="Sığdır">⤢</button></div>'
          : '<p class="gun-senin">Henüz bağ yok: metinde [[ yazıp bir düşünce seç, burada belirir.</p>') + '</div>';
    }
    var yerelSaat = null;
    function yerelYaz(){ clearTimeout(yerelSaat); yerelSaat = setTimeout(function(){ var e = document.getElementById('bh-yerel'), x = bul(sec); if(e && x) e.outerHTML = yerelHtml(x); }, 350); }
    function duzenHtml(x, g){
      if(!x) return '<aside class="gun-kart bh-duzen bh-duzen--bos"><h2 class="gun-kart__ad">Düşünce</h2><p class="gun-senin">Haritada bir düşünceye dokun ya da yukarıdan yeni bir tane yaz.</p>'
        + '<ul class="bh-ipucu"><li><code>[[Başlık]]</code> iki düşünceyi bağlar; <code>[[</code> yazınca öneri gelir</li><li><code>[[!Başlık]]</code> «bununla çelişir» der</li><li>Ortak etiket ince bir bağ kurar</li><li>«Not ekle» ile AYS, SPİ, ESP’deki bir nota atıf yaparsın; tıklayınca orada açılır</li><li>Görsel, video, ses ya da YouTube adresi yapıştır: önizlemede yerinde açılır</li><li>Bir düşünceye çift tıkla ya da «Odak»a bas: yazı alanı ekranı kaplar</li><li>Haritada sürükle, tekerlekle yakınlaş; Esc tam ekrandan çıkar</li></ul></aside>';
      var kom = B.komsular(veri(), g, x.id), geri = B.geriBaglar(veri(), x.id), gid = {};
      geri.forEach(function(y){ gid[y.id] = 1; });
      var cik = kom.filter(function(k){ return k.tur !== 'etiket' && !gid[k.id]; }).map(function(k){ return { id:k.id, tur:k.tur, baslik:(bul(k.id) || {}).baslik }; });
      var et = kom.filter(function(k){ return k.tur === 'etiket'; }).map(function(k){ return { id:k.id, tur:k.tur, baslik:(bul(k.id) || {}).baslik }; });
      var bas = '<div class="bh-duzen__bas"><input class="bh-baslik" data-bh-alan="baslik" maxlength="80" value="' + kac(x.baslik) + '" aria-label="Başlık"/>'
        + '<button type="button" class="bh-odakd" data-bh-odak-yaz aria-pressed="' + odakYaz + '" title="' + (odakYaz ? 'Odaktan çık (Esc)' : 'Odak: yazı alanı ekranı kaplar') + '">' + (odakYaz ? 'Odaktan çık' : 'Odak') + '</button>'
        + '<button type="button" class="bh-kapat" data-bh-kapat aria-label="Kapat" title="Kapat">×</button></div>';
      var meta = '<div class="bh-satir"><div class="gun-gecis" role="group" aria-label="Tür">' + B.TURLER.map(function(t){ return '<button type="button" data-bh-tur="' + t.id + '" aria-pressed="' + (x.tur === t.id) + '">' + t.ad + '</button>'; }).join('') + '</div>'
        + '<div class="bh-kesin" role="group" aria-label="Kesinlik ' + x.kesinlik + '/5">' + [1, 2, 3, 4, 5].map(function(n){ return '<button type="button" data-bh-kesin="' + n + '" aria-pressed="' + (n <= x.kesinlik) + '" aria-label="Kesinlik ' + n + '"></button>'; }).join('') + '<small>ne kadar eminim</small></div></div>'
        + '<div class="bh-satir"><input data-bh-alan="konu" list="bh-konular" maxlength="40" placeholder="Konu" value="' + kac(x.konu) + '" aria-label="Konu"/>'
        + '<input data-bh-alan="etiket" maxlength="200" placeholder="Etiketler: virgülle" value="' + kac(x.etiket.join(', ')) + '" aria-label="Etiketler"/></div>'
        + (x.tur === 'catisma' ? catismaHtml(x) : '')
        + '<label class="bh-ozel"><input type="checkbox" data-bh-ozel' + (x.ozel ? ' checked' : '') + '/> Yalnız bana <small>King görmez, profiline girmez</small></label>';
      var kelime = (B.temizMetin(x.metin).match(/\S+/g) || []).length;
      var yazi = '<div class="bh-kip" role="tablist">' + [['yaz', 'Yaz'], ['onizle', 'Önizle']].map(function(k){ return '<button type="button" role="tab" data-bh-kip="' + k[0] + '" aria-selected="' + (kip === k[0]) + '">' + k[1] + '</button>'; }).join('')
          + (odakYaz ? '<span class="bh-kelime">' + kelime + ' kelime</span>' : '') + '<button type="button" class="bh-kip__ek" data-bh-atif-ac aria-expanded="' + atifAc + '">Not ekle</button></div>'
        + (atifAc ? '<div class="bh-atifp"><input type="search" id="bh-atif-ara" placeholder="Modüllerdeki notlarda ara" value="' + kac(atifAra) + '" aria-label="Notlarda ara"/><div id="bh-atifl">' + atifListe() + '</div></div>' : '')
        + (kip === 'yaz' ? '<div class="bh-yazi"><textarea id="bh-metin" data-bh-alan="metin" rows="9" maxlength="2000" placeholder="' + (x.tur === 'catisma' ? 'İkisini birlikte gözeten bir yol var mı?' : 'Ne düşünüyorsun, neden? [[ yazınca başka bir düşünceye bağlarsın; görsel, video ya da ses adresi yapıştırabilirsin.') + '" aria-label="Düşüncenin metni" aria-autocomplete="list" aria-controls="bh-oneri">' + kac(x.metin) + '</textarea><ul class="bh-oneri" id="bh-oneri" role="listbox" hidden></ul></div>'
          : '<div class="bh-onizle">' + onizle(x.metin) + '</div>');
      var baglar = bagListe('Bağladıkların', cik) + bagListe('Sana bağlananlar', geri) + bagListe('Aynı etiket', et)
        + (B.atiflar(x.metin).length ? '<div class="bh-bagl"><h4>Atıf yaptığın notlar</h4>' + B.atiflar(x.metin).map(function(a){ return '<a class="bh-atif" href="' + kac(notAdres(a.modul, a.id)) + '" style="--r:var(--' + a.modul + ')"><i>' + MAD[a.modul] + '</i>' + kac(a.baslik) + '</a>'; }).join('') + '</div>' : '');
      var king = x.ozel ? '<p class="bh-not">Bu düşünce yalnız sende: King’e gönderilmez.</p>' : '<div class="bh-king"><h3>King’le konuş<small>' + (merkez === false ? 'Merkez kapalı' : 'cümle modelden · düşünce senden') + '</small></h3>'
        + '<ol class="bh-sohbet">' + x.sohbet.map(function(m){ return '<li class="is-' + m.kim + '"><b>' + (m.kim === 'king' ? 'King' : 'Sen') + '</b>' + kac(m.metin) + '</li>'; }).join('')
        + (bekle === x.id ? '<li class="is-king is-bekle"><b>King</b>düşünüyor…</li>' : '') + '</ol>'
        + (not_ ? '<p class="bh-not">' + kac(not_) + '</p>' : '')
        + '<form class="bh-sor" data-bh-sor><input name="soru" maxlength="400" placeholder="Sor ya da boş bırak: King görüşünü söylesin" aria-label="King’e soru"/><button type="submit"' + (bekle ? ' disabled' : '') + '>King’e sor</button></form></div>';
      var alt = '<div class="bh-alt"><small>' + (x.zaman ? new Date(x.zaman).toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' }) : '') + '</small><button type="button" class="bh-sil" data-bh-sil>Sil</button></div>';
      if(odakYaz) return '<div class="bh-odak-perde" data-bh-odak-yaz aria-hidden="true"></div>'
        + '<aside class="gun-kart bh-duzen is-dolu bh-duzen--odak" role="dialog" aria-modal="true" aria-label="Odak: ' + kac(x.baslik) + '">'
        + '<div class="bh-odak__yazi">' + bas + yazi + '</div><div class="bh-odak__yan">' + yerelHtml(x) + meta + baglar + evrimHtml(x) + king + alt + '</div></aside>';
      return '<aside class="gun-kart bh-duzen is-dolu">' + bas + meta + yazi + baglar + evrimHtml(x) + king + alt + '</aside>';
    }
    function profilHtml(){
      var v = veri(), p = B.profil(v), kis = B.kisiKayitlari(v), tt = p.toplam || 1;
      if(!p.toplam) return '';
      var var_ = B.TURLER.filter(function(t){ return p.turler[t.id]; });
      var liste = function(baslik, l, f){ return l.length ? '<div><h3>' + baslik + '</h3><ul class="bh-ozet">' + l.map(f).join('') + '</ul></div>' : ''; };
      var git = function(x){ return '<li><button type="button" data-bh-sec="' + kac(x.id) + '">' + kac(x.baslik) + '</button></li>'; };
      return '<section class="gun-kart bh-profil" style="--i:3"><h2 class="gun-kart__ad">Düşünce profilin<small>yalnız senin yazdığından sayıldı</small></h2>'
        + '<div class="bh-profil__ust"><div><h3>Konular</h3><ul class="bh-cubuk">' + p.konular.slice(0, 6).map(function(k){ return '<li><span>' + kac(k[0]) + '</span><i style="--o:' + (k[1] / p.konular[0][1] * 100).toFixed(1) + '%"></i><b>' + k[1] + '</b></li>'; }).join('') + '</ul></div>'
        + '<div><h3>Nasıl yazıyorsun</h3><div class="bh-yigin" role="img" aria-label="' + var_.map(function(t){ return t.ad + ' ' + p.turler[t.id]; }).join(', ') + '">' + var_.map(function(t){ return '<i class="bh-y--' + t.id + '" style="flex:' + p.turler[t.id] + '"></i>'; }).join('') + '</div>'
        + '<ul class="bh-lejant">' + var_.map(function(t){ return '<li><i class="bh-y--' + t.id + '"></i>' + t.ad + ' ' + Math.round(p.turler[t.id] / tt * 100) + '%</li>'; }).join('') + '</ul>'
        + '<p class="gun-senin">' + p.toplam + ' düşünce, ' + p.bag + ' bağ' + (p.yalniz ? '; ' + p.yalniz + ' tanesi henüz hiçbir şeye bağlı değil' : '') + '.</p></div></div>'
        + '<div class="bh-profil__alt">' + liste('Merkez düşünceler', p.merkez, git) + liste('Emin olduğun', p.kesin, git) + liste('Açık sorular', p.sorular, git)
        + liste('Açık iç çatışmalar' + (p.cozulen ? ' · ' + p.cozulen + ' çözüldü' : ''), p.catisma, git) + liste('Karakterin', p.karakter, git) + liste('Değerlerin', p.degerler, git) + liste('Fikri değişenler', p.degisen, git)
        + liste('Çelişkiler', p.celiski, function(c){ return '<li><button type="button" data-bh-sec="' + kac(c[0].id) + '">' + kac(c[0].baslik) + '</button> ≠ <button type="button" data-bh-sec="' + kac(c[1].id) + '">' + kac(c[1].baslik) + '</button></li>'; }) + '</div>'
        + '<div class="bh-izin"><label><input type="checkbox" data-bh-izin' + (v.izin ? ' checked' : '') + '/> King beni bu haritadan tanısın</label>'
        + '<details><summary>King’e giden ' + kis.length + ' kayıt</summary><ul>' + kis.map(function(k){ return '<li>' + kac(k.metin) + '</li>'; }).join('') + '</ul><small>Her modüldeki King bunları «senin sözün» olarak görür; ajanlar görmez. Kapatınca King’den silinir.</small></details></div></section>';
    }
    function gruplarHtml(v, bulunan){
      return '<div class="bh-gruplar">' + B.konular(v).map(function(k, i){ return '<div class="bh-grup" style="--r:var(--bh-' + (i < 8 ? i : 0) + ')"><h3>' + kac(k[0]) + '<small>' + k[1] + '</small></h3><ul>'
        + v.dusunceler.filter(function(x){ return (x.konu || 'Konusuz') === k[0] && (!bulunan || bulunan.indexOf(x.id) >= 0); }).map(function(x){ return '<li><button type="button" data-bh-sec="' + kac(x.id) + '"' + (x.id === sec ? ' aria-current="true"' : '') + '><span class="bh-tur">' + turAd(x.tur) + '</span>' + kac(x.baslik) + '</button></li>'; }).join('') + '</ul></div>'; }).join('') + '</div>';
    }
    function sayfaHtml(){
      boyut();
      var v = veri();
      if(!v) return '<section class="gun-kart gun-bos"><h2>Bilinç haritası yüklenemedi</h2><p>Sayfayı yenile.</p></section>';
      if(sec && !bul(sec)) sec = null;
      var g = B.ag(v), kon = B.konular(v), bulunan = B.ara(v, aranan), harita;
      if(!v.dusunceler.length) harita = '<div class="bh-bos"><p>Harita boş. İlk düşünceni yaz: bir inanç, bir soru, bir karar. Bağladıkça ağ büyür; King de seni bu ağdan tanır.</p></div>';
      else if(gor === 'gruplar') harita = gruplarHtml(v, bulunan);
      else if(gor === 'akis') harita = akisHtml(v);
      else harita = B.haritaSvg(v, g, yerlesim(v, g), { w:W, h:H, secili:sec, odak:odak, bulunan:bulunan, vb:vbMetin(), olcek:OLCEK > 1 ? OLCEK : 0 })
        + '<div class="bh-yakin" role="group" aria-label="Yakınlaştırma"><button type="button" data-bh-zum="1.25" aria-label="Yakınlaş">+</button><button type="button" data-bh-zum="0.8" aria-label="Uzaklaş">−</button><button type="button" data-bh-zum="0" aria-label="Sığdır" title="Sığdır">⤢</button></div>';
      return '<div class="bh' + (tam ? ' bh--tam' : '') + '">'
        + '<div class="gun-kart bh-arac" style="--i:1"><form class="bh-yaz" data-bh-yeni><input name="baslik" maxlength="80" placeholder="Aklından ne geçiyor?" aria-label="Yeni düşüncenin başlığı" required/>'
        + '<select name="tur" aria-label="Tür">' + B.TURLER.map(function(t){ return '<option value="' + t.id + '">' + t.ad + '</option>'; }).join('') + '</select>'
        + '<input name="konu" list="bh-konular" maxlength="40" placeholder="Konu" aria-label="Konu" value="' + kac(odak && odak !== 'Konusuz' ? odak : '') + '"/><button type="submit" class="is-ana">Ekle</button></form>'
        + '<div class="bh-arac__sag"><input type="search" id="bh-ara" class="bh-ara" placeholder="Ara" value="' + kac(aranan) + '" aria-label="Düşüncelerde ara"/>'
        + '<div class="gun-gecis" role="group" aria-label="Görünüm">' + [['harita', 'Harita'], ['gruplar', 'Gruplar'], ['akis', 'Akış']].map(function(x){ return '<button type="button" data-bh-gor="' + x[0] + '" aria-pressed="' + (gor === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>'
        + '<button type="button" class="bh-dugme" data-bh-tam aria-pressed="' + tam + '">' + (tam ? 'Küçült' : 'Tam ekran') + '</button>'
        + (v.dusunceler.length ? '<button type="button" class="bh-dugme" data-bh-yorum' + (bekle ? ' disabled' : '') + '>King haritamı yorumlasın</button>' : '') + '</div></div>'
        + (tam ? '' : '<section class="gun-kart bh-kivilcim"><div class="bh-kivilcim__bas"><b>Bugün kendine sor</b><small>bir soru seç, cevabın haritana düşsün</small></div><div class="bh-kivilcim__l">'
          + B.kivilcimlar(v, bugun(), 3).map(function(k){ return '<button type="button" data-bh-kivilcim="' + k.no + '"><small>' + kac(k.alan) + '</small>' + kac(k.soru) + '</button>'; }).join('')
          + '</div><button type="button" class="bh-dugme" data-bh-catisma-yeni>İç çatışmanı yaz</button></section>')
        + '<datalist id="bh-konular">' + kon.filter(function(k){ return k[0] !== 'Konusuz'; }).map(function(k){ return '<option value="' + kac(k[0]) + '">'; }).join('') + '</datalist>'
        + (bekle === '*' || yorum ? '<section class="gun-kart bh-yorum" aria-live="polite"><b>King’in haritana bakışı</b>' + (bekle === '*' ? '<p>düşünüyor…</p>' : '<p>' + kac(yorum.metin) + '</p><small>' + new Date(yorum.zaman).toLocaleString('tr-TR', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' }) + ' · cümle modelden, sayılar koddan</small>') + '</section>' : '')
        + (not_ && !sec ? '<p class="bh-not">' + kac(not_) + '</p>' : '')
        + '<div class="bh-izgara"><section class="gun-kart bh-harita" style="--i:2">'
        + '<div class="bh-konular">' + kon.slice(0, 8).map(function(k, i){ return '<button type="button" class="bh-cip" style="--r:var(--bh-' + i + ')" data-bh-odak="' + kac(k[0]) + '" aria-pressed="' + (odak === k[0]) + '"><i></i>' + kac(k[0]) + ' ' + k[1] + '</button>'; }).join('')
        + (bulunan ? '<span class="bh-sayac">' + bulunan.length + ' sonuç</span>' : '') + '</div>'
        + harita + '</section>' + duzenHtml(bul(sec), g) + '</div>' + (tam ? '' : profilHtml()) + '</div>';
    }
    function alanYaz(x, alan, deger){
      if(alan === 'etiket') x.etiket = deger.split(',').map(function(s){ return s.trim().replace(/^#/, '').toLocaleLowerCase('tr-TR').slice(0, 30); }).filter(function(s, i, l){ return s && l.indexOf(s) === i; }).slice(0, 8);
      else if(alan === 'baslik'){ deger = deger.replace(/\s+/g, ' ').trim().slice(0, 80); if(deger) x.baslik = deger; }
      else if(alan === 'konu') x.konu = deger.replace(/\s+/g, ' ').trim().slice(0, 40);
      else if(alan === 'metin') x.metin = deger.slice(0, 2000);
    }
    function kingIste(tur, satir, bitti){
      fetch('/api/gun/cumle', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-LifeOS':'gun' }, body:JSON.stringify({ tur:tur, satirlar:satir }) })
        .then(function(r){ return r.json(); })
        .then(function(r){ if(r && r.ok && r.text) bitti(String(r.text).slice(0, 1200), r.model);
          else not_ = r && r.note === 'Merkez kapalı' ? 'Merkez kapalı: King şu an konuşamıyor. Düşüncen kaydedildi.' : 'King şu an cevap veremedi. Biraz sonra yeniden dene.'; })
        .catch(function(){ not_ = 'Merkez’e ulaşılamadı. Düşüncen kaydedildi.'; })
        .then(function(){ bekle = null; ciz(); });
    }
    function sor(x, soru){
      if(bekle) return;
      soru = String(soru || '').replace(/\s+/g, ' ').trim().slice(0, 400);
      var satir = B.kingSatirlar(veri(), x.id, soru);
      if(soru){ x.sohbet.push({ kim:'sen', metin:soru, zaman:Date.now() }); x.sohbet = x.sohbet.slice(-24); kaydet(); }
      bekle = x.id; not_ = ''; ciz();
      kingIste('bilinc', satir, function(t, m){ var y = bul(x.id); if(!y) return;
        y.sohbet.push({ kim:'king', metin:t, zaman:Date.now(), model:m || undefined }); y.sohbet = y.sohbet.slice(-24); kaydet(); });
    }
    function haritayiYorumla(){
      if(bekle) return;
      bekle = '*'; not_ = ''; ciz();
      kingIste('bilinc_harita', B.haritaSatirlar(veri()), function(t){ yorum = { metin:t, zaman:Date.now() }; try{ localStorage.setItem(YORUM, JSON.stringify(yorum)); }catch(e){} });
    }
    function git(ad){
      var y = adla(ad), x = bul(sec);
      if(!y){ y = B.yeni(veri(), { baslik:ad, konu:x ? x.konu : '', tur:'fikir' }); if(!y) return; kaydet(); }
      sec = y.id; kip = 'yaz'; ciz();
    }
    /* [[ onerisi: imlecten once acik bir [[ varsa listele; yalniz liste dugumu degisir (odak kalir). */
    function oneriDurum(t){ var m = /\[\[!?([^\[\]\n]{0,80})$/.exec(t.value.slice(0, t.selectionStart)); return m ? { q:m[1], bas:t.selectionStart - m[1].length } : null; }
    function oneriCiz(t){
      var u = document.getElementById('bh-oneri'), o = oneriDurum(t);
      if(!u) return;
      var l = o ? B.oneriler(veri(), o.q, sec, 6) : [];
      u.hidden = !l.length;
      u.innerHTML = l.map(function(x, i){ return '<li role="option" data-bh-oneri="' + kac(x.baslik) + '"' + (i ? '' : ' aria-selected="true"') + '>' + kac(x.baslik) + '</li>'; }).join('');
    }
    function oneriSec(ad){
      var t = document.getElementById('bh-metin'), o = t && oneriDurum(t), x = bul(sec);
      if(!o || !x) return;
      var son = t.value.slice(t.selectionStart).replace(/^[^\[\]\n]*\]\]/, '');
      t.value = t.value.slice(0, o.bas) + ad + ']]' + son;
      var yer = o.bas + ad.length + 2; t.setSelectionRange(yer, yer);
      alanYaz(x, 'metin', t.value); kaydet(); oneriCiz(t);
    }
    function tik(e){
      var t = e.target, c = function(s){ return t.closest && t.closest(s); }, k;
      if((k = c('[data-bh-oneri]'))){ oneriSec(k.getAttribute('data-bh-oneri')); var m = document.getElementById('bh-metin'); if(m) m.focus(); return true; }
      if((k = c('[data-bh-yzum]'))){ var yz0 = Number(k.getAttribute('data-bh-yzum')), ys = document.querySelector('.bh-yerel .bh-svg');
        if(yz0) zum({ st:yvb, w:400, h:280 }, ys, yz0); else { yvb = { x:0, y:0, s:1 }; if(ys) ys.setAttribute('viewBox', '0 0 400 280'); } return true; }
      if((k = c('[data-bh-sec]'))){ if(k.getAttribute('data-bh-sec') !== sec) yvb = { x:0, y:0, s:1 }; sec = k.getAttribute('data-bh-sec'); not_ = ''; ciz(); var b = document.querySelector('.bh-duzen'); if(b && window.innerWidth < 980 && !tam) b.scrollIntoView({ block:'start' }); return true; }
      if((k = c('[data-bh-git]'))){ git(k.getAttribute('data-bh-git')); return true; }
      if((k = c('[data-bh-odak]'))){ var o = k.getAttribute('data-bh-odak'); odak = odak === o ? null : o; ciz(); return true; }
      if((k = c('[data-bh-gor]'))){ gor = k.getAttribute('data-bh-gor'); ciz(); return true; }
      if((k = c('[data-bh-kip]'))){ kip = k.getAttribute('data-bh-kip'); ciz(); return true; }
      if((k = c('[data-bh-zum]'))){ var z = Number(k.getAttribute('data-bh-zum')); if(z) yakinlas(z); else { vb = { x:0, y:0, s:1 }; vbYaz(); } return true; }
      if(c('[data-bh-tam]')){ tam = !tam; document.documentElement.classList.toggle('bh-tam-acik', tam); ciz(); return true; }
      if(c('[data-bh-yorum]')){ haritayiYorumla(); return true; }
      if(c('[data-bh-kapat]')){ sec = null; atifAc = false; odakKur(false); ciz(); return true; }
      if(c('[data-bh-odak-yaz]')){ odakKur(!odakYaz); ciz(); var mo = document.getElementById('bh-metin'); if(mo && odakYaz) try{ mo.focus(); }catch(er){} return true; }
      if((k = c('[data-bh-kivilcim]'))){ var kv = B.KIVILCIM[Number(k.getAttribute('data-bh-kivilcim'))]; if(!kv) return true;
        var yk = B.yeni(veri(), { baslik:kv.soru.slice(0, 80), tur:kv.tur, konu:kv.alan });
        if(yk){ sec = yk.id; kip = 'yaz'; kaydet(); ciz(); var mk = document.querySelector(kv.tur === 'catisma' ? '[data-bh-taraf="0"][data-bh-tk="ister"]' : '#bh-metin'); if(mk) try{ mk.focus(); }catch(er){} } return true; }
      if(c('[data-bh-catisma-yeni]')){ var yc = B.yeni(veri(), { baslik:'Yeni iç çatışma', tur:'catisma', konu:'İç çatışma' });
        if(yc){ sec = yc.id; kip = 'yaz'; kaydet(); ciz(); var bb = document.querySelector('.bh-baslik'); if(bb) try{ bb.focus(); bb.select(); }catch(er){} } return true; }
      if((k = c('[data-bh-atif]'))){ var n = notlar && notlar[Number(k.getAttribute('data-bh-atif'))], xa = bul(sec); if(!n || !xa) return true;
        var at = B.atifYaz(n.modul, n.id, n.baslik), ta = document.getElementById('bh-metin');
        if(ta){ var i0 = ta.selectionStart || ta.value.length; ta.value = ta.value.slice(0, i0) + at + ta.value.slice(i0); alanYaz(xa, 'metin', ta.value); }
        else alanYaz(xa, 'metin', (xa.metin ? xa.metin + '\n\n' : '') + at);
        atifAc = false; kaydet(); ciz(); return true; }
      if(c('[data-bh-atif-ac]')){ atifAc = !atifAc; if(atifAc) notlariAl(); ciz(); var aa = document.getElementById('bh-atif-ara'); if(aa) aa.focus(); return true; }
      var x = bul(sec);
      if(!x) return false;
      if((k = c('[data-bh-tur]'))){ x.tur = k.getAttribute('data-bh-tur'); kaydet(); ciz(); return true; }
      if((k = c('[data-bh-kesin]'))){ x.kesinlik = Number(k.getAttribute('data-bh-kesin')); kaydet(); ciz(); return true; }
      if((k = c('[data-bh-durum]'))){ x.durum = k.getAttribute('data-bh-durum'); kaydet(); ciz(); return true; }
      if(c('[data-bh-sil]')){ if(!window.confirm('«' + x.baslik + '» silinsin mi?')) return true;
        d.dusunceler = d.dusunceler.filter(function(y){ return y.id !== x.id; }); sec = null; odakKur(false); kaydet(); ciz(); return true; }
      return false;
    }
    /* input: model guncellenir, cizim yok (odak kalir); change: harita yeniden cizilir. */
    function degis(e){
      var t = e.target;
      if(t.id === 'bh-atif-ara'){ atifAra = t.value; atifListeYaz(); return true; }
      if(t.hasAttribute && t.hasAttribute('data-bh-ozel')){ var xo = bul(sec); if(e.type !== 'change' || !xo) return true; xo.ozel = !!t.checked; kaydet(); ciz(); return true; }
      if(t.hasAttribute && t.hasAttribute('data-bh-taraf')){ var xt = bul(sec); if(!xt || !xt.taraf) return true;
        var tk = t.getAttribute('data-bh-tk'); xt.taraf[Number(t.getAttribute('data-bh-taraf'))][tk] = t.value.replace(/\s+/g, ' ').slice(0, tk === 'ad' ? 40 : 240); kaydet(); return true; }
      if(t.id === 'bh-ara'){ aranan = t.value; { ciz(); var a = document.getElementById('bh-ara'); if(a){ a.focus(); a.setSelectionRange(a.value.length, a.value.length); } } return true; }
      if(t.hasAttribute && t.hasAttribute('data-bh-izin')){ if(e.type !== 'change') return true; veri().izin = !!t.checked; kaydet(); ciz(); return true; }
      var a2 = t.getAttribute && t.getAttribute('data-bh-alan'), x = bul(sec);
      if(!a2 || !x) return false;
      alanYaz(x, a2, t.value); kaydet();
      if(t.id === 'bh-metin' && e.type === 'input'){ oneriCiz(t); if(odakYaz) yerelYaz(); }
      if(e.type === 'change' && t.id !== 'bh-metin'){ var y = window.scrollY; ciz(); window.scrollTo(0, y); }
      return true;
    }
    function tus(e){
      if(e.key === 'Escape' && odakYaz && !(document.getElementById('bh-oneri') && !document.getElementById('bh-oneri').hidden)){ odakKur(false); ciz(); return; }
      if(e.key === 'Escape' && tam){ tam = false; document.documentElement.classList.remove('bh-tam-acik'); ciz(); return; }
      if(e.target && e.target.id === 'bh-metin'){
        var u = document.getElementById('bh-oneri'), ilk = u && !u.hidden && u.querySelector('[data-bh-oneri]');
        if(ilk && (e.key === 'Enter' || e.key === 'Tab')){ e.preventDefault(); oneriSec(ilk.getAttribute('data-bh-oneri')); }
        else if(u && e.key === 'Escape') u.hidden = true;
      }
      if(e.target && e.target.id === 'bh-ara' && e.key === 'Enter'){ e.preventDefault(); aranan = e.target.value; ciz(); var a = document.getElementById('bh-ara'); if(a) a.focus(); }
    }
    function gonder(e){
      var f = e.target && e.target.closest ? e.target.closest('[data-bh-yeni], [data-bh-sor], [data-bh-evrim]') : null;
      if(!f) return false;
      e.preventDefault();
      if(f.hasAttribute('data-bh-sor')){ var x = bul(sec); if(x) sor(x, f.querySelector('[name="soru"]').value); return true; }
      if(f.hasAttribute('data-bh-evrim')){ var xe = bul(sec), me = f.querySelector('[name="metin"]').value.replace(/\s+/g, ' ').trim().slice(0, 600);
        if(xe && me){ xe.evrim.push({ zaman:Date.now(), metin:me, kesinlik:xe.kesinlik }); xe.evrim = xe.evrim.slice(-30); kaydet(); ciz(); } return true; }
      var ba = f.querySelector('[name="baslik"]').value.replace(/\s+/g, ' ').trim();
      if(!ba || !veri()) return true;
      var var_ = adla(ba);
      var y = var_ || B.yeni(veri(), { baslik:ba, tur:f.querySelector('[name="tur"]').value, konu:f.querySelector('[name="konu"]').value });
      if(y){ sec = y.id; kip = 'yaz'; if(!var_) kaydet(); ciz(); var m = document.getElementById('bh-metin'); if(m) try{ m.focus(); }catch(er){} }
      return true;
    }
    /* Gezinme: tekerlek imlecin altina yakinlasir, bos yerde surukleme kaydirir. */
    /* Iki harita, iki ayri goruş kutusu: ana harita (vb, W x H) ve odaktaki yerel ag (yvb, 400 x 280). */
    function hedef(s){ return s.closest('.bh-yerel') ? { st:yvb, w:400, h:280 } : { st:vb, w:W, h:H }; }
    function zum(h, svg, k, cx, cy){
      var st = h.st, ns = Math.max(0.4, Math.min(5, st.s * k)), w0 = h.w / st.s, h0 = h.h / st.s, w1 = h.w / ns, h1 = h.h / ns;
      st.x += (w0 - w1) * (cx == null ? 0.5 : cx); st.y += (h0 - h1) * (cy == null ? 0.5 : cy); st.s = ns;
      if(svg) svg.setAttribute('viewBox', vbM(h));
    }
    document.addEventListener('wheel', function(e){
      var s = e.target.closest && e.target.closest('.bh-svg'); if(!s) return;
      e.preventDefault(); var r = s.getBoundingClientRect();
      zum(hedef(s), s, e.deltaY < 0 ? 1.15 : 1 / 1.15, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    }, { passive:false });
    document.addEventListener('pointerdown', function(e){
      var s = e.target.closest && e.target.closest('.bh-svg'); if(!s || e.target.closest('.bh-d')) return;
      var r = s.getBoundingClientRect(), h = hedef(s); surukle = { x:e.clientX, y:e.clientY, vx:h.st.x, vy:h.st.y, k:h.w / h.st.s / r.width, h:h, svg:s };
      s.classList.add('is-surukle');
    });
    /* Bir dusunceye cift tikla: odakta acilir. */
    document.addEventListener('dblclick', function(e){
      var n = e.target.closest && e.target.closest('.bh-d'); if(!n || bolum() !== 'bilinc') return;
      sec = n.getAttribute('data-bh-sec'); kip = 'yaz'; odakKur(true); ciz(); var m = document.getElementById('bh-metin'); if(m) try{ m.focus(); }catch(er){}
    });
    document.addEventListener('pointermove', function(e){ if(!surukle) return; var st = surukle.h.st;
      st.x = surukle.vx - (e.clientX - surukle.x) * surukle.k; st.y = surukle.vy - (e.clientY - surukle.y) * surukle.k; surukle.svg.setAttribute('viewBox', vbM(surukle.h)); });
    document.addEventListener('pointerup', function(){ if(!surukle) return; surukle.svg.classList.remove('is-surukle'); surukle = null; });
    document.addEventListener('keydown', function(e){
      if(bolum() !== 'bilinc') return;
      tus(e);
      var n = e.target && e.target.closest && e.target.closest('.bh-d');
      if(n && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); sec = n.getAttribute('data-bh-sec'); ciz(); }
    });
    return { sayfaHtml:sayfaHtml, araclarHtml:araclarHtml, tik:tik, degis:degis, gonder:gonder, yukle:yukle };
  })();
  /* GUNCELLEME (2026-11-09): ilk karsilayan ekran artik Ana sayfa; guncelleme giris sayfasindaki kutuyla
     ayni uclardan (/api/guncelleme, POST /api/guncelle, X-LifeOS: guncelle; ayni koken 4180). Guncelse kart yok. */
  var GN = (function(){
    var h = { hal:'bekle' }, is = null;
    function post(yol){ return fetch(yol, { method:'POST', headers:{ 'X-LifeOS':'guncelle' } }).then(function(r){ return r.json(); }); }
    function koy(hal, baslik, alt, yeni, dugme, f){ h = { hal:hal, baslik:baslik, alt:alt || '', yeni:(yeni || []).slice(0, 5), dugme:dugme || '' }; is = f || null; var e = document.getElementById('gun-guncel'); if(e) e.outerHTML = html(); else if(bolum() === 'bugun') ciz(true); }
    function oku(d){
      if(d.durum === 'git-yok') return koy('uyari', 'Güncelleme için git gerekli', d.mesaj);
      if(d.durum === 'git-degil') return koy('var', 'Bu klasör zip ile indirilmiş', 'Güncelle, klasörü GitHub’daki sürüme bağlar ve en yenisini kurar. Verin korunur.', null, 'Bağla ve güncelle', guncelle);
      if(d.durum !== 'ok') return koy('uyari', 'Güncelleme durumu okunamadı', d.mesaj || '');
      if(d.geride > 0 && d.yedeklenebilir) return koy('var', d.geride + ' yenilik var', 'Bu klasörde GitHub’da olmayan ' + d.ileride + ' kayıt var; önce yedek dala konur, sonra en yeni sürüm kurulur. Verin korunur.', d.yeni, 'Yedekle ve güncelle', function(){ guncelle(true); });
      if(d.geride > 0) return koy('var', d.geride + ' yenilik var', 'İndirmek bir dakikadan kısa sürer; verin korunur.', d.yeni, 'Güncelle', guncelle);
      koy('ok', 'Sistem güncel', '');
    }
    function kontrol(taze){ fetch('/api/guncelleme' + (taze ? '?taze=1' : ''), { cache:'no-store' }).then(function(r){ return r.json(); }).then(oku).catch(function(){ koy('uyari', 'Güncelleme durumu okunamadı', ''); }); }
    function guncelle(yedekle){
      koy('bekle', 'İndiriliyor…', 'Bir dakikadan kısa sürer.');
      post('/api/guncelle' + (yedekle === true ? '?yedekle=1' : '')).then(function(s){
        if(s.durum === 'guncellendi'){
          if(s.yeniden_baslat){ koy('bekle', s.mesaj || 'Güncellendi', 'Yeni sürüm için sistem yeniden başlatılıyor…', s.yeni); return yeniden(); }
          return koy('ok2', s.mesaj || 'Güncellendi', 'Açık sayfaları yenile.', s.yeni, 'Sayfayı yenile', function(){ location.reload(); });
        }
        if(s.durum === 'guncel') return koy('ok', 'Sistem güncel', '');
        koy('uyari', 'Güncelleme yapılmadı', s.mesaj || '', null, s.yedeklenebilir ? 'Yedekle ve güncelle' : '', s.yedeklenebilir ? function(){ guncelle(true); } : null);
      }).catch(function(){ koy('uyari', 'Güncelleme isteği gönderilemedi', '', null, 'Yeniden dene', guncelle); });
    }
    function yeniden(){
      post('/api/yeniden').then(function(){
        var bitis = Date.now() + 60000;
        (function bekle(){ setTimeout(function(){
          fetch('/api/durum', { cache:'no-store' }).then(function(r){ if(r.ok) location.reload(); else throw 0; })
            .catch(function(){ if(Date.now() < bitis) bekle(); else koy('uyari', 'Sistem geri gelmedi', 'Klasördeki BASLAT.bat dosyasını çift tıkla.'); });
        }, 2500); })();
      }).catch(function(){ koy('uyari', 'Yeniden başlatılamadı', 'Klasördeki GUNCELLE.bat dosyasını çift tıkla.'); });
    }
    function html(){
      if(h.hal === 'ok') return '<div id="gun-guncel" hidden></div>';
      if(h.hal === 'bekle' && !h.baslik) return '<div id="gun-guncel" hidden></div>';
      return '<section class="gun-kart gun-guncel" id="gun-guncel" data-hal="' + h.hal + '" aria-live="polite" aria-label="Güncelleme"><div><b>' + kac(h.baslik) + '</b>'
        + (h.alt ? '<small>' + kac(h.alt) + '</small>' : '') + (h.yeni.length ? '<ul>' + h.yeni.map(function(x){ return '<li>' + kac(x) + '</li>'; }).join('') + '</ul>' : '') + '</div>'
        + '<div class="gun-guncel__d">' + (h.hal === 'uyari' ? '<button type="button" data-guncel-bak>Yeniden kontrol et</button>' : '')
        + (h.dugme && is ? '<button type="button" class="is-ana" data-guncel-is>' + kac(h.dugme) + '</button>' : '') + '</div></section>';
    }
    function tik(e){
      var t = e.target;
      if(t.closest && t.closest('[data-guncel-is]')){ if(is) is(); return true; }
      if(t.closest && t.closest('[data-guncel-bak]')){ koy('bekle', 'Güncelleme kontrol ediliyor…', ''); kontrol(true); return true; }
      return false;
    }
    return { html:html, tik:tik, kontrol:kontrol };
  })();
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
        + GN.html() + kahramanHtml(tarih.charAt(0).toLocaleUpperCase('tr-TR') + tarih.slice(1)) + BH.araclarHtml() + ustHtml(v) + seritHtml() + alanlarHtml() + altHtml() + '</div></main></div></div></div>';
      ilk = false;
      return;
    }
    var ana = '<div class="gun' + (ilk ? ' gun-gir' : '') + '">'
      + '<header class="gun-bas" style="--i:0"><div><h1 class="gun-selam">' + (b === 'bugun' ? selam() : BOLUM.filter(function(x){ return x.id === b; })[0].ad) + '</h1>'
      + '<p class="gun-tarih">' + (b === 'bilinc' ? 'Düşüncelerin, aralarındaki bağlar ve King’in ikinci gözü' : kac(tarih.charAt(0).toLocaleUpperCase('tr-TR') + tarih.slice(1))) + '</p></div>'
      + (b === 'analiz' ? '<div class="gun-gecis" role="group" aria-label="Dönem">'
          + [[7, 'Hafta'], [30, 'Ay']].map(function(d){ return '<button type="button" data-donem="' + d[0] + '" aria-pressed="' + (donemN === d[0]) + '">' + d[1] + '</button>'; }).join('') + '</div>'
        : '<span class="gun-merkez" data-hal="' + (merkez ? 'acik' : 'kapali') + '"><i aria-hidden="true"></i>' + (merkez === null ? 'Merkez’e bakılıyor…' : merkez ? 'Merkez açık' : 'Merkez kapalı · yerel') + '</span>')
      + '</header>' + (b === 'analiz' ? gecmisHtml() : b === 'bilinc' ? BH.sayfaHtml() : senHtml()) + '</div>';
    document.getElementById('app').innerHTML = '<div class="site site--v5 site--gun">'
      + (K ? K.iskeletV5({ modul:'gun', baglam:'Günü kur, gidişi gör', cekmeceler:cek }) : '')
      + '<div class="site__body"><div class="wrapc sayfa"><main id="main" tabindex="-1">' + ana + '</main></div></div></div>';
    ilk = false;
  }
  document.addEventListener('click', function(e){
    var t = e.target;
    if(GN.tik(e)) return;
    if(bolum() === 'bilinc' && BH.tik(e)) return;
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
  document.addEventListener('input', function(e){ if(bolum() === 'bilinc') BH.degis(e); });
  document.addEventListener('change', function(e){
    if(bolum() === 'bilinc' && BH.degis(e)) return;
    if(e.target && e.target.id === 'gun-niyet'){ yaz('niyet', e.target.value.trim()); cumleIste(); }
    if(e.target && e.target.id === 'gun-soz'){ sen.soz = e.target.value.replace(/\s+/g, ' ').trim().slice(0, 160); senYaz(); }
  });
  document.addEventListener('submit', function(e){
    if(BH.gonder(e)) return;
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
  BH.yukle();
  GN.kontrol(false);
  setInterval(yukle, 120000);
  window.addEventListener('focus', function(){ yukle(); BH.yukle(); });           // sekmeye donunce taze
  fetch('/api/durum').then(function(r){ return r.json(); }).then(function(d){ merkez = !!d.hkm; ciz(); }).catch(function(){ merkez = false; ciz(); });
})();
</script>
</body></html>
"""
