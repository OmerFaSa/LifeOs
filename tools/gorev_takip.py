#!/usr/bin/env python3
"""GOREV TAKIP — Antigravity ajanlarini ve gorev kuyrugunu izleyen kucuk masaustu penceresi.

Kullanici (2026-10-31): «bununla alakali takip etmek amacli bir masaustu
uygulamasi»; sonra «model efor degistirip minik ajanlar … gorev takibi ona gore
detayli», «daha anlasilir». Ustte akis panosu (Sirada, Calisiyor, Incelemede,
Bitti), altinda her ajan: su an ne yaptigi duz Turkce, sure, adim, token,
commit, koruma kancasinin mudahaleleri, zaman cizelgesi, son cevabi, alt
ajanlari; teknik ayrinti katlanir. Kaynak: tools/ajan.py (Antigravity'nin
konusma dokumu) ve belgeler/ekip/gorevler/ kuyrugu. Edge'i
uygulama penceresinde acar. Pencere kapaninca (60 sn nabiz yok) kendisi de
kapanir. Yalniz 127.0.0.1; hicbir seyi degistirmez, yalniz okur.

  python tools/gorev_takip.py            pencereyi acar
  python tools/gorev_takip.py --durum    durumu JSON olarak yazar (pencere yok)
"""
import importlib.util
import json
import os
import re
import subprocess
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
AG = Path(os.environ.get("LIFEOS_AG_KLASOR", r"C:\Users\ASUS\LifeOs-ag"))
GOREVLER = "belgeler/ekip/gorevler"
PORT = 4590
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
DURUMLAR = ("bekliyor", "sürüyor", "bitti", "takıldı")
_spec = importlib.util.spec_from_file_location("ajan", Path(__file__).resolve().parent / "ajan.py")
AJAN = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(AJAN)
_sunucu = {"zaman": 0, "acik": None}


def git(*a, kok=KOK):
    try:
        r = subprocess.run(["git", "-C", str(kok)] + list(a), capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=10,
                           creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        return r.stdout.strip() if r.returncode == 0 else None
    except (OSError, subprocess.SubprocessError):
        return None


def gorev_oku(metin):
    """Gorev dosyasindan baslik, durum, dal ve Sonuc bolumu."""
    bas = re.search(r"^#\s+(.+)$", metin, re.M)
    durum = re.search(r"\*\*Durum:\*\*\s*([^\s<]+)", metin)
    dal = re.search(r"\*\*Dal:\*\*\s*`([^`]+)`", metin)
    efor = re.search(r"\*\*Efor:\*\*\s*([^\s<]+)", metin)
    sonuc = metin.split("## Sonuç", 1)[1] if "## Sonuç" in metin else ""
    sonuc = re.sub(r"<!--.*?-->", "", sonuc, flags=re.S).strip()
    d = (durum.group(1).strip().lower() if durum else "bekliyor")
    return {"baslik": bas.group(1).strip() if bas else "", "durum": d if d in DURUMLAR else "bekliyor",
            "dal": dal.group(1).strip() if dal else "", "sonuc": sonuc[:1200],
            "efor": AJAN.efor_cevir(efor.group(1)) if efor else None}


def sunucu_acik():
    """Antigravity dil sunucusu yaniyor mu; yoklama pahali (powershell), 60 sn saklanir."""
    if time.time() - _sunucu["zaman"] > 60:
        try:
            _sunucu["acik"] = AJAN.sunucu() is not None
        except (OSError, subprocess.SubprocessError):
            _sunucu["acik"] = False
        _sunucu["zaman"] = time.time()
    return _sunucu["acik"]


def pano(gorevler, ajanlar):
    """Her isi dort kolondan birine koyar: sira, calisiyor, inceleme, bitti (saf islev, testli)."""
    out = []
    for g in gorevler:
        a = next((x for x in ajanlar if x.get("gorev") == g["dosya"] and x.get("acik")), None)
        k = (a or {}).get("canli") or {}
        if g.get("main_de"):
            kolon, cumle = "bitti", "main'e alındı"
        elif a and a.get("asama") in ("çalışıyor", "sorun"):
            kolon, cumle = "calisiyor", k.get("simdi") or "Başlıyor"
        elif a and a.get("asama") == "inceleme":
            kolon, cumle = "inceleme", "Ajan bitirdi; gözden geçirme bekliyor"
        elif g.get("dal_var") and g.get("ileri"):
            kolon, cumle = "inceleme", "Dalda %d commit; birleştirilmedi" % g["ileri"]
        else:
            kolon, cumle = "sira", "Henüz başlamadı"
        out.append({"tur": "görev", "ad": g["dosya"][:3], "baslik": re.sub(r"^\d{3}\s*·\s*", "", g["baslik"]),
                    "kolon": kolon, "cumle": cumle, "efor": (a or {}).get("efor") or g.get("efor"),
                    "sorun": bool(a and a.get("asama") == "sorun"), "ajan": (a or {}).get("ad", "")})
    for a in ajanlar:
        if a.get("tur") == "mini" and a.get("acik"):
            k = a.get("canli") or {}
            out.append({"tur": "mini", "ad": a["ad"], "baslik": (a.get("istem") or "")[:80],
                        "kolon": "inceleme" if a.get("asama") == "inceleme" else "calisiyor",
                        "cumle": "Cevap hazır" if a.get("asama") == "inceleme" else (k.get("simdi") or "Başlıyor"),
                        "efor": a.get("efor"), "sorun": a.get("asama") == "sorun", "ajan": a["ad"]})
    return out


def durum():
    ag_dal = git("rev-parse", "--abbrev-ref", "HEAD", kok=AG) if AG.exists() else None
    ag_degisen = git("status", "--porcelain", kok=AG) if AG.exists() else None
    birlesik = set((git("branch", "--merged", "main", "--format=%(refname:short)") or "").split())
    ajanlar = AJAN.hepsi()
    gorevler = []
    for yol in sorted((KOK / GOREVLER).glob("[0-9][0-9][0-9]-*.md")):
        rel = GOREVLER + "/" + yol.name
        g = gorev_oku(yol.read_text(encoding="utf-8"))
        g["dosya"] = yol.name
        dal = g["dal"]
        var = bool(dal) and git("rev-parse", "--verify", "--quiet", "refs/heads/" + dal) is not None
        ajan = next((a for a in ajanlar if a.get("gorev") == yol.name), None)
        g["ajan"] = ajan["ad"] if ajan else ""
        wt = Path(ajan["worktree"]) / rel if ajan and ajan.get("acik") else None
        sabit = ("dal", "efor")
        if wt and wt.exists():
            g.update({k: v for k, v in gorev_oku(wt.read_text(encoding="utf-8")).items() if k not in sabit})
            g["kaynak"] = "ajan klasörü"
        elif var and ag_dal == dal and (AG / rel).exists():
            g.update({k: v for k, v in gorev_oku((AG / rel).read_text(encoding="utf-8")).items() if k not in sabit})
            g["kaynak"] = "çalışma klasörü"
        elif var:
            m = git("show", dal + ":" + rel)
            if m:
                g.update({k: v for k, v in gorev_oku(m).items() if k not in sabit})
            g["kaynak"] = "dal"
        else:
            g["kaynak"] = "main"
        if var:
            son = (git("log", "-1", "--format=%ct|%s", dal) or "0|").split("|", 1)
            g["dal_var"] = True
            g["ileri"] = int(git("rev-list", "--count", "main.." + dal) or 0)
            g["son_zaman"] = int(son[0] or 0)
            g["son_mesaj"] = son[1] if len(son) > 1 else ""
            g["main_de"] = dal in birlesik and g["ileri"] == 0 and g["durum"] == "bitti"
        else:
            g["dal_var"] = False
        gorevler.append(g)
    return {"zaman": int(time.time()), "gorevler": gorevler, "ajanlar": ajanlar, "pano": pano(gorevler, ajanlar),
            "kanca": AJAN.kanca_kurulu(),
            "yuva": {"dolu": sum(1 for a in ajanlar if a.get("acik")), "toplam": AJAN.YUVA_SAY},
            "antigravity": {"acik": sunucu_acik(), "klasor": str(AG), "var": AG.exists(), "dal": ag_dal,
                            "degisen": len(ag_degisen.splitlines()) if ag_degisen else 0}}


SAYFA = """<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Görev takibi</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{ color-scheme:light dark; --bg:#f4f5f7; --kart:#fff; --yazi:#15171c; --ikinci:#5d636d; --ucuncu:#8a909a; --cizgi:#e2e4e9; --zayif:#eef0f3;
  --vurgu:#2f6bff; --iyi:#178553; --uyari:#b45309; --kotu:#c2410c; }
@media (prefers-color-scheme:dark){ :root{ --bg:#121418; --kart:#1b1e24; --yazi:#eceef2; --ikinci:#a4a9b2; --ucuncu:#7c828c; --cizgi:#2b2f37; --zayif:#23272e; } }
*{ box-sizing:border-box; } body{ margin:0; font:14px/1.5 system-ui, "Segoe UI", sans-serif; background:var(--bg); color:var(--yazi); }
header{ padding:18px 20px 6px; } h1{ margin:0; font-size:19px; font-weight:650; }
.cumle{ margin:4px 0 0; color:var(--ikinci); font-size:13.5px; } .cumle b{ color:var(--yazi); font-weight:600; }
.durumcuk{ display:flex; flex-wrap:wrap; gap:6px 14px; padding:8px 20px 4px; font-size:12.5px; color:var(--ikinci); }
.nokta{ display:inline-block; width:7px; height:7px; border-radius:50%; margin-right:6px; vertical-align:1px; background:var(--ucuncu); }
.nokta.iyi{ background:var(--iyi); } .nokta.kotu{ background:var(--kotu); }
h2{ margin:18px 20px 8px; font-size:12px; font-weight:650; letter-spacing:.02em; color:var(--ikinci); text-transform:uppercase; }
.pano{ display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:10px; padding:0 20px; }
.kolon{ background:var(--zayif); border-radius:12px; padding:8px; min-height:72px; }
.kolon h3{ display:flex; justify-content:space-between; margin:2px 4px 8px; font-size:12.5px; font-weight:600; color:var(--ikinci); }
.is{ display:block; width:100%; text-align:left; font:inherit; color:inherit; background:var(--kart); border:0; border-radius:9px;
  padding:8px 10px; margin-bottom:6px; box-shadow:inset 0 0 0 1px var(--cizgi); cursor:pointer; }
.is:hover{ box-shadow:inset 0 0 0 1px var(--ucuncu); } .is:focus-visible{ outline:2px solid var(--vurgu); outline-offset:1px; }
.is.sorun{ box-shadow:inset 3px 0 0 var(--kotu), inset 0 0 0 1px var(--cizgi); }
.is b{ display:block; font-size:13px; font-weight:600; } .is small{ display:block; color:var(--ikinci); font-size:12px; margin-top:2px;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.etiket{ display:inline-block; font-size:11px; color:var(--ikinci); margin-right:6px; }
.efor{ display:inline-flex; gap:2px; vertical-align:-1px; margin-right:6px; } .efor i{ width:6px; height:10px; border-radius:2px; background:var(--cizgi); }
.efor i.dolu{ background:var(--vurgu); }
.bos{ color:var(--ucuncu); font-size:12px; margin:4px; }
main{ display:grid; gap:12px; padding:0 20px 8px; }
.ajan{ background:var(--kart); border-radius:14px; box-shadow:inset 0 0 0 1px var(--cizgi); padding:14px 16px; scroll-margin-top:12px; }
.ajan-bas{ display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; } .ajan-bas b{ font-size:15.5px; font-weight:650; }
.asama{ margin-left:auto; font-size:12px; font-weight:600; padding:2px 10px; border-radius:999px; background:var(--zayif); color:var(--ikinci); }
.asama.calisiyor{ background:var(--vurgu); color:#fff; } .asama.inceleme{ background:var(--iyi); color:#fff; } .asama.sorun{ background:var(--kotu); color:#fff; }
.simdi{ margin:10px 0 0; font-size:14.5px; } .simdi span{ color:var(--ikinci); }
.olcu{ display:grid; grid-template-columns:repeat(auto-fit, minmax(96px, 1fr)); gap:8px; margin-top:12px; }
.olcu div{ background:var(--zayif); border-radius:9px; padding:6px 10px; } .olcu small{ display:block; font-size:11px; color:var(--ikinci); }
.olcu b{ font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; }
.koruma{ margin-top:10px; font-size:12.5px; color:var(--ikinci); } .koruma b{ color:var(--yazi); font-weight:600; }
.koruma.uyari{ color:var(--kotu); }
details{ margin-top:10px; } summary{ cursor:pointer; font-size:12.5px; color:var(--ikinci); }
ol.cizelge{ list-style:none; margin:8px 0 0; padding:0 0 0 14px; border-left:2px solid var(--cizgi); }
ol.cizelge li{ position:relative; padding:3px 0 5px 4px; font-size:12.5px; display:grid; grid-template-columns:44px 1fr; gap:8px; }
ol.cizelge li::before{ content:""; position:absolute; left:-20px; top:9px; width:8px; height:8px; border-radius:50%; background:var(--cizgi); }
ol.cizelge li.model::before{ background:var(--vurgu); } ol.cizelge li.hata::before{ background:var(--kotu); }
ol.cizelge time{ color:var(--ucuncu); font-variant-numeric:tabular-nums; } ol.cizelge span{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
pre{ white-space:pre-wrap; word-break:break-word; margin:8px 0 0; font:12.5px/1.55 ui-monospace, Consolas, monospace; max-height:340px; overflow:auto;
  background:var(--zayif); border-radius:9px; padding:10px 12px; }
.alt{ margin-top:6px; padding:6px 10px; border-left:2px solid var(--cizgi); font-size:12.5px; }
dl{ display:grid; grid-template-columns:auto 1fr; gap:3px 12px; margin:8px 0 0; font-size:12.5px; } dt{ color:var(--ikinci); } dd{ margin:0; word-break:break-all; }
code{ font:12px ui-monospace, Consolas, monospace; }
.rehber{ margin:18px 20px 22px; font-size:12.5px; color:var(--ikinci); } .rehber p{ margin:4px 0; }
</style></head><body>
<header><h1>Görev takibi</h1><p class="cumle" id="cumle">Yükleniyor…</p></header>
<div class="durumcuk" id="durumcuk"></div>
<h2>Akış</h2><div class="pano" id="pano"></div>
<h2 id="ajan-baslik">Ajanlar</h2><main id="ajanlar"></main>
<details class="rehber"><summary>Nasıl okunur</summary>
<p><b>Akış:</b> Sırada → Çalışıyor → İncelemede (ajan bitirdi, Claude Code gözden geçirip birleştirir) → Bitti (main'de).</p>
<p><b>Efor:</b> bir çubuk düşük (flash_lite, hızlı ve ucuz), iki çubuk orta (flash), üç çubuk yüksek (pro, en dikkatli).</p>
<p><b>Koruma:</b> Antigravity kancası ajanın komutunu kendi klasörüne yönlendirir; ana klasöre, main'e ve kişisel veriye dokunan aracı engeller; arka planda iş sürerken erken durmasını önler.</p>
<p><b>Token:</b> modele giden ve modelden gelen metin miktarı; önbellekten okunan ayrıca sayılır.</p></details>
<script>
const kac = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
const once = t => { if(!t) return '–'; const f = Math.round(Date.now() / 1000 - t);
  return f < 60 ? 'az önce' : f < 3600 ? Math.round(f / 60) + ' dk önce' : f < 86400 ? Math.round(f / 3600) + ' sa önce' : Math.round(f / 86400) + ' gün önce'; };
const sure = (a, b) => { const f = Math.max(0, Math.round((b || Date.now() / 1000) - a));
  return f < 3600 ? Math.max(1, Math.round(f / 60)) + ' dk' : Math.floor(f / 3600) + ' sa ' + Math.round(f % 3600 / 60) + ' dk'; };
const bin = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' mn' : n >= 1e3 ? Math.round(n / 1e3) + ' bin' : String(n || 0);
const saat = z => { const d = new Date(z); return isNaN(d) ? '' : d.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }); };
const EFOR = { dusuk:[1, 'düşük'], orta:[2, 'orta'], yuksek:[3, 'yüksek'] };
const eforHtml = (e, model) => { const x = EFOR[e]; if(!x) return '';
  return '<span class="efor" role="img" aria-label="efor ' + x[1] + (model ? ', model ' + kac(model) : '') + '" title="efor ' + x[1] + (model ? ' · ' + kac(model) : '') + '">'
    + [1, 2, 3].map(i => '<i class="' + (i <= x[0] ? 'dolu' : '') + '"></i>').join('') + '</span>'; };
const ASAMA = { 'çalışıyor':['calisiyor', 'Çalışıyor'], inceleme:['inceleme', 'İncelemede'], sorun:['sorun', 'Dikkat'], 'kapandı':['', 'Kapandı'] };
const KOLON = [['sira', 'Sırada'], ['calisiyor', 'Çalışıyor'], ['inceleme', 'İncelemede'], ['bitti', 'Bitti']];
const kimlik = ad => 'ajan-' + String(ad).replace(/[^a-z0-9-]/gi, '');

function panoHtml(p){
  return KOLON.map(([k, ad]) => { const l = p.filter(x => x.kolon === k);
    return '<section class="kolon" aria-label="' + ad + ', ' + l.length + ' iş"><h3><span>' + ad + '</span><span>' + l.length + '</span></h3>'
      + (l.length ? l.map(x => '<button class="is' + (x.sorun ? ' sorun' : '') + '"' + (x.ajan ? ' data-git="' + kimlik(x.ajan) + '"' : ' disabled')
        + '><b>' + (x.tur === 'mini' ? 'Mini · ' : kac(x.ad) + ' · ') + kac(x.baslik) + '</b><small>' + eforHtml(x.efor) + kac(x.cumle) + '</small></button>').join('')
        : '<p class="bos">Boş</p>') + '</section>'; }).join('');
}

function korumaHtml(c, kanca){
  const k = c.kanca || {}, eng = k.engellendi || [];
  if(!kanca && (c.disari || []).length) return '<p class="koruma uyari">Koruma kancası kurulu değil · ajan klasörü dışında <b>' + c.disari.length + '</b> iş yaptı; ana klasöre bak.</p>';
  if(!kanca) return '<p class="koruma">Koruma kancası kurulu değil; kurallar yalnız istemde.</p>';
  const parca = [];
  if(k.yonlendirildi) parca.push('<b>' + k.yonlendirildi + '</b> komut klasörüne yönlendirildi');
  if(eng.length) parca.push('<b>' + eng.length + '</b> araç engellendi');
  if(k.devam) parca.push('<b>' + k.devam + '</b> kez erken durması önlendi');
  return '<p class="koruma">Koruma: ' + (parca.length ? parca.join(' · ') : 'müdahale gerekmedi') + '</p>'
    + (eng.length ? '<details><summary>Engellenenler</summary><ol class="cizelge">' + eng.map(x => '<li class="hata"><time>' + saat(x.t * 1000) + '</time><span title="'
      + kac(x.ozet) + '">' + kac(x.arac) + ': ' + kac(x.neden) + '</span></li>').join('') + '</ol></details>' : '');
}

function cizelgeHtml(l){
  return '<ol class="cizelge">' + l.filter(a => a.tur !== 'sonuç' || a.durum === 'RUNNING').map(a => {
    const yazi = a.cumle || (a.tur === 'istem' ? 'Görev verildi' : a.tur === 'sonuç' ? 'Araç çalışıyor…' : (a.metin || '').split('\\n')[0]);
    return '<li class="' + (a.tur === 'hata' ? 'hata' : a.tur === 'model' ? 'model' : '') + '"><time>' + saat(a.zaman) + '</time><span title="' + kac(yazi) + '">' + kac(yazi) + '</span></li>';
  }).join('') + '</ol>';
}

function ajanHtml(a, kanca){
  const c = a.canli || {}, s = ASAMA[a.asama] || ['', a.asama], t = c.token || {};
  const simdi = a.asama === 'inceleme' ? (a.tur === 'mini' ? 'Cevap hazır.' : 'Ajan işini bitirdi; gözden geçirme ve birleştirme bekliyor.')
    : a.asama === 'kapandı' ? 'Kapandı.' : a.asama === 'sorun' ? 'Dikkat: ' + (c.hal === 'sessiz' ? 'on dakikadır hareket yok.' : c.hal === 'hata' ? 'Antigravity hata verdi.' : 'klasör dışında iş yaptı.')
    : (c.simdi || 'Başlıyor…');
  return '<section class="ajan" id="' + kimlik(a.ad) + '"><div class="ajan-bas"><b>' + (a.tur === 'mini' ? 'Mini ajan · ' + kac(a.ad) : kac(a.gorev || a.ad).replace(/\\.md$/, '')) + '</b>'
    + eforHtml(a.efor, a.model) + '<span class="etiket">' + kac(a.model) + '</span><span class="asama ' + s[0] + '">' + s[1] + '</span></div>'
    + '<p class="simdi">' + (a.asama === 'çalışıyor' ? '<span>Şu an:</span> ' : '') + kac(simdi) + '</p>'
    + '<div class="olcu">'
    + '<div><small>Süre</small><b>' + sure(a.baslangic, a.acik ? null : a.kapanis) + '</b></div>'
    + '<div><small>Adım</small><b>' + (c.adim == null ? '–' : c.adim) + '</b></div>'
    + '<div><small>Son hareket</small><b>' + once(c.son_degisim) + '</b></div>'
    + '<div><small>Token giriş / çıkış</small><b>' + bin(t.giris) + ' / ' + bin(t.cikis) + '</b></div>'
    + (a.tur === 'gorev' && c.commit != null ? '<div><small>Commit / açık dosya</small><b>' + c.commit + ' / ' + (c.degisen || 0) + '</b></div>' : '')
    + ((c.alt || []).length ? '<div><small>Alt ajan</small><b>' + c.alt.length + '</b></div>' : '') + '</div>'
    + (a.acik ? korumaHtml(c, kanca) : '')
    + (c.son_adimlar && c.son_adimlar.length ? '<details' + (a.asama === 'çalışıyor' ? ' open' : '') + '><summary>Zaman çizelgesi</summary>' + cizelgeHtml(c.son_adimlar) + '</details>' : '')
    + (c.cevap ? '<details' + (a.asama === 'inceleme' ? ' open' : '') + '><summary>Son cevabı</summary><pre>' + kac(c.cevap) + '</pre></details>' : '')
    + ((c.alt || []).length ? '<details><summary>Alt ajanlar</summary>' + c.alt.map(x => '<div class="alt"><b>' + kac(x.hal) + '</b> · ' + kac(x.simdi || '')
        + '<br><span>' + kac((x.istem || '').split('\\n')[0]) + '</span>' + (x.cevap ? '<pre>' + kac(x.cevap) + '</pre>' : '') + '</div>').join('') + '</details>' : '')
    + '<details><summary>Teknik ayrıntı</summary><dl>'
    + '<dt>Klasör</dt><dd><code>' + kac(a.worktree) + '</code></dd>' + (a.dal ? '<dt>Dal</dt><dd><code>' + kac(a.dal) + '</code></dd>' : '')
    + (a.portlar ? '<dt>Portlar</dt><dd>' + Object.entries(a.portlar).map(([k, v]) => k + ' ' + v).join(' · ') + '</dd>' : '')
    + '<dt>Konuşma</dt><dd><code>' + kac(a.konusma) + '</code></dd><dt>Mesaj</dt><dd>' + (a.mesajlar || 1) + '</dd>'
    + '<dt>Araçlar</dt><dd>' + Object.entries(c.araclar || {}).sort((x, y) => y[1] - x[1]).map(([k, v]) => kac(k) + ' ' + v).join(' · ') + '</dd>'
    + (a.acik ? '<dt>Komut</dt><dd><code>python tools/ajan.py mesaj ' + kac(a.ad) + ' "…"</code> · <code>cevap ' + kac(a.ad) + '</code> · <code>kapat ' + kac(a.ad) + '</code></dd>' : '')
    + (a.istem ? '<dt>İstem</dt><dd>' + kac(a.istem) + '</dd>' : '') + '</dl></details></section>';
}

async function tazele(){
  let d; try{ d = await (await fetch('/api/durum', { cache:'no-store' })).json(); }catch(e){ document.getElementById('cumle').textContent = 'Durum okunamadı; takip sunucusu kapanmış olabilir.'; return; }
  const ag = d.antigravity, acik = d.ajanlar.filter(a => a.acik), say = k => d.pano.filter(x => x.kolon === k).length;
  const parca = [];
  if(say('calisiyor')) parca.push('<b>' + say('calisiyor') + '</b> iş çalışıyor');
  if(say('inceleme')) parca.push('<b>' + say('inceleme') + '</b> iş incelemeyi bekliyor');
  if(say('sira')) parca.push('<b>' + say('sira') + '</b> iş sırada');
  const sorun = d.pano.filter(x => x.sorun).length;
  if(sorun) parca.push('<b>' + sorun + '</b> işte dikkat gereken bir durum var');
  document.getElementById('cumle').innerHTML = parca.length ? parca.join(', ') + '.' : 'Şu an çalışan ya da bekleyen iş yok.';
  document.getElementById('durumcuk').innerHTML = '<span><span class="nokta ' + (ag.acik ? 'iyi' : ag.acik === false ? 'kotu' : '') + '"></span>Antigravity ' + (ag.acik ? 'açık' : ag.acik === false ? 'kapalı' : 'yoklanıyor') + '</span>'
    + '<span><span class="nokta ' + (d.kanca ? 'iyi' : 'kotu') + '"></span>Koruma kancası ' + (d.kanca ? 'kurulu' : 'kurulu değil') + '</span>'
    + '<span>Yuva ' + d.yuva.dolu + ' / ' + d.yuva.toplam + '</span><span>Güncellendi ' + new Date().toLocaleTimeString('tr-TR') + '</span>';
  document.getElementById('pano').innerHTML = panoHtml(d.pano);
  const kapali = d.ajanlar.filter(a => !a.acik);
  document.getElementById('ajanlar').innerHTML = (acik.length ? acik.map(a => ajanHtml(a, d.kanca)).join('') : '<p class="bos">Açık ajan yok. Başlatmak için: <code>python tools/ajan.py baslat 004</code></p>')
    + (kapali.length ? '<details><summary>Geçmiş (' + kapali.length + ' ajan)</summary>' + kapali.map(a => ajanHtml(a, d.kanca)).join('') + '</details>' : '');
}
document.addEventListener('click', e => { const b = e.target.closest('[data-git]'); if(!b) return;
  const h = document.getElementById(b.dataset.git); if(h){ const g = h.closest('details'); if(g) g.open = true; h.scrollIntoView({ behavior:'smooth' }); } });
tazele(); setInterval(tazele, 5000);
setInterval(() => fetch('/nabiz', { method:'POST' }).catch(() => {}), 10000);
</script></body></html>"""

son_nabiz = time.time()


class Isleyici(BaseHTTPRequestHandler):
    def _yaz(self, kod, govde, tur):
        b = govde.encode("utf-8")
        self.send_response(kod)
        self.send_header("Content-Type", tur + "; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        global son_nabiz
        son_nabiz = time.time()
        if self.path.startswith("/api/durum"):
            return self._yaz(200, json.dumps(durum(), ensure_ascii=False), "application/json")
        return self._yaz(200, SAYFA, "text/html")

    def do_POST(self):
        global son_nabiz
        son_nabiz = time.time()
        self._yaz(204, "", "text/plain")

    def log_message(self, *a):
        return


def main():
    if "--durum" in sys.argv:
        print(json.dumps(durum(), ensure_ascii=False, indent=2))
        return
    adres = "http://127.0.0.1:%d/" % PORT
    try:
        s = ThreadingHTTPServer(("127.0.0.1", PORT), Isleyici)
    except OSError:                                    # zaten acik: yalniz pencereyi ac
        s = None
    if s:
        threading.Thread(target=s.serve_forever, daemon=True).start()
    if os.path.exists(EDGE):
        subprocess.Popen([EDGE, "--app=" + adres, "--window-size=760,820"])
    else:
        webbrowser.open(adres)
    if not s:
        return
    while time.time() - son_nabiz < 60:              # pencere kapaninca nabiz durur
        time.sleep(5)


if __name__ == "__main__":
    main()
