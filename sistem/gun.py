# -*- coding: utf-8 -*-
"""GUN — besinci bolum: gunu kurmak ve gidisi gormek (Gun plani F2, iskelet).

Yeni surec ya da port ACMAZ (plan §2c): giris sunucusu (sistem/sunucu.py,
4180) `/gun/` yolunda sunar. Uc bolum (plan §2): Bugun, Gecmis, Sen. Iskelette
her bolum ne olacagini tek cumleyle soyler; veri yok diye sayi uydurulmaz.
Merkez (HKM) kapaliyken de acilir (plan §6): durum satiri /api/durum'dan."""

BOLUMLER = (
    ("bugun", "Bugün", "Ne yaptım, ne yapacağım?",
     "Günün şeridi, niyetin, enerjin ve ruh halin burada; «Şimdi ne yapsam?» kartı da."),
    ("gecmis", "Geçmiş", "Nasıl gidiyor?",
     "Hayat karnesi ve üç modülün özeti burada toplanır: yapıldı, eksik, veri yok ayrı ayrı."),
    ("sen", "Sen", "Ne beni besliyor?",
     "Kendi sözün, sana enerji veren ve çalan şeyler, «Ne yapsam?» destesi burada."),
)

# (anahtar, ad, aciklama, port) — giris sayfasinin KARTLAR'iyla ayni kapilar.
MODULLER = (
    ("ays", "AYS", "Sınav hazırlığı", 4173),
    ("spi", "SPİ", "Uyku, beslenme, hareket", 4183),
    ("esp", "ESP", "Dil, felsefe, okuma", 4193),
)


def _kac(t):
    return (str(t).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def gun_html(tema=None, host="127.0.0.1"):
    sekmeler = "".join(
        '<a class="gun-sekme" href="#%s" data-sekme="%s" role="tab" aria-controls="gun-%s">%s</a>'
        % (a, a, a, _kac(ad)) for a, ad, _, _ in BOLUMLER)
    bolumler = "".join(
        '<section class="gun-bolum" id="gun-%s" role="tabpanel" aria-label="%s" hidden>'
        '<h2>%s</h2><div class="gun-bos"><i class="gun-isaret" aria-hidden="true"></i><p>%s</p>'
        '<small>Henüz kurulmadı. Kurulunca veriler AYS, SPİ ve ESP’nin kendi kayıtlarından gelir.</small></div></section>'
        % (a, _kac(ad), _kac(soru), _kac(ne)) for a, ad, soru, ne in BOLUMLER)
    kapilar = "".join(
        '<a class="gun-kapi" href="http://%s:%d/" style="--renk:var(--%s)"><i class="sekil sekil--%s" aria-hidden="true"></i>'
        '<span><b>%s</b><small>%s</small></span></a>' % (host, p, k, k, _kac(ad), _kac(acik)) for k, ad, acik, p in MODULLER)
    sayfa = GUN_SAYFASI.replace("__SEKMELER__", sekmeler).replace("__BOLUMLER__", bolumler).replace("__KAPILAR__", kapilar)
    if tema in ("light", "dark"):
        sayfa = (sayfa.replace("@media (prefers-color-scheme:dark)", "@media all" if tema == "dark" else "@media not all")
                 .replace("color-scheme:light dark;", "color-scheme:%s;" % tema)
                 .replace('<html lang="tr">', '<html lang="tr" data-theme="%s">' % tema, 1))
    return sayfa


GUN_SAYFASI = """<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>LifeOS — Gün</title>
<style>
:root{ color-scheme:light dark;
  --bg:#f5f6f8; --yuzey:#ffffff; --yuzey-2:#f0f1f4; --fg:#15171a; --fg-2:#4a4f57; --fg-3:#6b717b;
  --cizgi:#e4e6ea; --golge:0 1px 2px rgba(16,24,40,.05), 0 4px 16px rgba(16,24,40,.06);
  --ok:#1a7f5a; --kapali:#8a9099;
  --ays:#2D5BE3; --spi:#0E8C79; --esp:#C8741C; --gun:#7453D4; --gun-t:#F1EEFB; }
@media (prefers-color-scheme:dark){ :root{
  --bg:#121214; --yuzey:#1C1C1F; --yuzey-2:#26262A; --fg:#ECECEF; --fg-2:#ABABB3; --fg-3:#909099;
  --cizgi:#2C2C31; --golge:0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.25);
  --ok:#4cc38a; --kapali:#6b717b;
  --ays:#4F86FF; --spi:#2EC4A9; --esp:#F2A93B; --gun:#9A86FF; --gun-t:#1F1C29; } }
*{ box-sizing:border-box; }
[hidden]{ display:none !important; }
body{ margin:0; background:var(--bg); color:var(--fg);
  font:15px/1.55 "Segoe UI Variable Text","Segoe UI",ui-sans-serif,system-ui,-apple-system,Roboto,sans-serif;
  -webkit-font-smoothing:antialiased; }
.gun-sarmal{ max-width:880px; margin:0 auto; padding:28px 16px 56px; }
.gun-bas{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:22px; }
.gun-geri{ display:inline-flex; align-items:center; gap:6px; min-height:36px; padding:0 12px 0 8px; border-radius:999px;
  color:var(--fg-2); text-decoration:none; font-size:13px; font-weight:550; }
.gun-geri:hover{ background:var(--yuzey-2); color:var(--fg); }
.gun-geri svg{ width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.gun-ad{ display:flex; align-items:center; gap:10px; margin:0; font-size:22px; font-weight:680; letter-spacing:-.015em; }
.gun-isaret{ display:inline-block; width:18px; height:18px; background:var(--gun); border-radius:50% 50% 3px 3px; }
.gun-tarih{ color:var(--fg-3); font-size:14px; }
.gun-merkez{ margin-left:auto; display:inline-flex; align-items:center; gap:7px; font-size:12.5px; color:var(--fg-3); }
.gun-merkez i{ width:7px; height:7px; border-radius:50%; background:var(--kapali); }
.gun-merkez[data-hal="acik"] i{ background:var(--ok); }
.gun-sekmeler{ display:flex; gap:4px; padding:4px; margin-bottom:18px; border-radius:999px; background:var(--yuzey-2); width:max-content; max-width:100%; }
.gun-sekme{ min-height:36px; padding:7px 18px; border-radius:999px; color:var(--fg-2); text-decoration:none; font-size:14px; font-weight:600;
  transition:background .25s ease, color .25s ease, box-shadow .25s ease; }
.gun-sekme:hover{ color:var(--fg); }
.gun-sekme[aria-selected="true"]{ background:var(--yuzey); color:var(--fg); box-shadow:var(--golge); }
.gun-sekme:focus-visible, .gun-kapi:focus-visible, .gun-geri:focus-visible{ outline:2px solid var(--gun); outline-offset:2px; }
.gun-bolum h2{ margin:0 0 12px; font-size:15px; font-weight:600; color:var(--fg-2); }
.gun-bolum:not([hidden]){ animation:gun-gel .35s cubic-bezier(.22,1,.36,1) both; }
@keyframes gun-gel{ from{ opacity:0; transform:translateY(6px); } }
.gun-bos{ display:grid; justify-items:center; gap:8px; padding:44px 20px; border-radius:16px; background:var(--yuzey);
  box-shadow:inset 0 0 0 1px var(--cizgi); text-align:center; }
.gun-bos .gun-isaret{ width:28px; height:28px; opacity:.9; }
.gun-bos p{ margin:6px 0 0; max-width:440px; font-size:15px; color:var(--fg); }
.gun-bos small{ max-width:440px; color:var(--fg-3); font-size:13px; }
.gun-kapilar-ad{ margin:28px 0 10px; font-size:13px; font-weight:600; color:var(--fg-3); }
.gun-kapilar{ display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:8px; }
.gun-kapi{ display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:14px; background:var(--yuzey);
  box-shadow:inset 0 0 0 1px var(--cizgi); color:var(--fg); text-decoration:none;
  transition:transform .3s cubic-bezier(.22,1,.36,1), box-shadow .25s ease; }
.gun-kapi:hover{ transform:translateY(-2px); box-shadow:inset 0 0 0 1px var(--renk), var(--golge); }
.gun-kapi span{ display:grid; gap:1px; min-width:0; }
.gun-kapi b{ font-size:14px; font-weight:650; }
.gun-kapi small{ font-size:12.5px; color:var(--fg-3); }
.sekil{ flex:none; display:block; width:16px; height:16px; background:var(--renk); }
.sekil--ays{ border-radius:4px; } .sekil--spi{ border-radius:50%; } .sekil--esp{ transform:rotate(45deg) scale(.86); border-radius:3px; }
@media (prefers-reduced-motion:reduce){ .gun-bolum:not([hidden]){ animation:none; } .gun-kapi, .gun-sekme{ transition:none; } .gun-kapi:hover{ transform:none; } }
</style>
</head>
<body>
<main class="gun-sarmal">
  <header class="gun-bas">
    <a class="gun-geri" href="/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg>LifeOS</a>
    <h1 class="gun-ad"><i class="gun-isaret" aria-hidden="true"></i>Gün</h1>
    <span class="gun-tarih" id="gun-tarih"></span>
    <span class="gun-merkez" id="gun-merkez" data-hal="bekle" role="status"><i aria-hidden="true"></i><span>Merkez’e bakılıyor…</span></span>
  </header>
  <nav class="gun-sekmeler" role="tablist" aria-label="Gün bölümleri">__SEKMELER__</nav>
  __BOLUMLER__
  <h2 class="gun-kapilar-ad">Modüller</h2>
  <nav class="gun-kapilar" aria-label="Modüller">__KAPILAR__</nav>
</main>
<script>
(function(){
  'use strict';
  var BOLUM = ['bugun', 'gecmis', 'sen'];
  function sec(){
    var a = (location.hash || '').slice(1);
    if(BOLUM.indexOf(a) < 0) a = 'bugun';
    BOLUM.forEach(function(b){
      var s = document.getElementById('gun-' + b), t = document.querySelector('[data-sekme="' + b + '"]');
      s.hidden = b !== a;
      t.setAttribute('aria-selected', b === a ? 'true' : 'false');
      t.tabIndex = b === a ? 0 : -1;
    });
  }
  window.addEventListener('hashchange', sec);
  sec();
  try{ document.getElementById('gun-tarih').textContent = new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' }); }catch(e){}
  var m = document.getElementById('gun-merkez');
  function yaz(hal, metin){ m.setAttribute('data-hal', hal); m.lastChild.textContent = metin; }
  fetch('/api/durum').then(function(r){ return r.json(); })
    .then(function(d){ yaz(d.hkm ? 'acik' : 'kapali', d.hkm ? 'Merkez açık' : 'Merkez kapalı · yerel özet'); })
    .catch(function(){ yaz('kapali', 'Merkez kapalı · yerel özet'); });
})();
</script>
</body></html>
"""
