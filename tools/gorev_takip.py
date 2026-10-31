#!/usr/bin/env python3
"""GOREV TAKIP — Antigravity ajanlarini ve gorev kuyrugunu izleyen kucuk masaustu penceresi.

Kullanici (2026-10-31): «bununla alakali takip etmek amacli bir masaustu
uygulamasi»; sonra «model efor degistirip minik ajanlar … gorev takibi ona gore
detayli». tools/ajan.py'nin baslattigi her ajani (efor, model, konusma, klasor,
portlar, adim adim ne yaptigi, son cevabi, alt ajanlari) ve
belgeler/ekip/gorevler/ kuyrugunu (dal, commit, Sonuc) gosterir; Edge'i
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
    return {"zaman": int(time.time()), "gorevler": gorevler, "ajanlar": ajanlar,
            "yuva": {"dolu": sum(1 for a in ajanlar if a.get("acik")), "toplam": AJAN.YUVA_SAY},
            "antigravity": {"acik": sunucu_acik(), "klasor": str(AG), "var": AG.exists(), "dal": ag_dal,
                            "degisen": len(ag_degisen.splitlines()) if ag_degisen else 0}}


SAYFA = """<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Görev takibi</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{ color-scheme:light dark; --bg:#f5f6f8; --kart:#fff; --yazi:#16181d; --ikinci:#5b616b; --cizgi:#e3e5ea; --zayif:#eef0f3;
  --bekliyor:#8a8f99; --suruyor:#2f6bff; --bitti:#1a8a5a; --takildi:#c2410c; --mor:#5b4bff; }
@media (prefers-color-scheme:dark){ :root{ --bg:#14161a; --kart:#1d2026; --yazi:#eceef2; --ikinci:#a2a7b0; --cizgi:#2c3038; --zayif:#252930; } }
*{ box-sizing:border-box; } body{ margin:0; font:14px/1.5 system-ui, "Segoe UI", sans-serif; background:var(--bg); color:var(--yazi); }
header{ display:flex; align-items:center; gap:12px; padding:16px 20px 8px; }
h1{ margin:0; font-size:18px; font-weight:650; } h2{ margin:14px 20px 8px; font-size:13px; font-weight:650; color:var(--ikinci); }
.zaman{ margin-left:auto; color:var(--ikinci); font-size:12px; }
.ag{ display:flex; flex-wrap:wrap; gap:6px 14px; align-items:center; margin:0 20px 4px; padding:10px 14px; border-radius:12px;
  background:var(--kart); box-shadow:inset 0 0 0 1px var(--cizgi); font-size:13px; }
.nokta{ display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--bekliyor); margin-right:6px; vertical-align:1px; }
.nokta.acik{ background:var(--bitti); }
.yuva{ display:inline-flex; gap:3px; vertical-align:-1px; } .yuva i{ width:9px; height:9px; border-radius:2px; background:var(--zayif); box-shadow:inset 0 0 0 1px var(--cizgi); }
.yuva i.dolu{ background:var(--suruyor); box-shadow:none; }
main{ display:grid; gap:10px; padding:0 20px 8px; }
.g{ padding:14px 16px; border-radius:14px; background:var(--kart); box-shadow:inset 0 0 0 1px var(--cizgi); }
.g-bas{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; } .g-bas b{ font-size:15px; }
.rozet{ padding:2px 10px; border-radius:999px; font-size:12px; font-weight:600; color:#fff; background:var(--bekliyor); }
.sag{ margin-left:auto; }
.rozet.sürüyor, .rozet.çalışıyor, .rozet.başlıyor{ background:var(--suruyor); } .rozet.bitti, .rozet.turu-bitti{ background:var(--bitti); }
.rozet.takıldı, .rozet.hata{ background:var(--takildi); } .rozet.main{ background:var(--mor); }
.efor{ padding:2px 8px; border-radius:999px; font-size:11.5px; box-shadow:inset 0 0 0 1px var(--cizgi); color:var(--ikinci); }
.efor b{ font-weight:650; color:var(--yazi); }
.alt{ margin-top:6px; color:var(--ikinci); font-size:12.5px; } .alt code{ font-size:12px; }
.olcu{ display:flex; flex-wrap:wrap; gap:4px 16px; margin-top:8px; font-size:12.5px; color:var(--ikinci); } .olcu b{ color:var(--yazi); font-weight:600; }
.cip{ display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; } .cip span{ padding:1px 8px; border-radius:6px; background:var(--zayif); font-size:11.5px; }
.simdi{ margin-top:8px; padding:8px 10px; border-radius:10px; background:var(--zayif); font-size:12.5px; }
details{ margin-top:8px; } summary{ cursor:pointer; font-size:12.5px; color:var(--ikinci); }
pre{ white-space:pre-wrap; word-break:break-word; margin:6px 0 0; font:12.5px/1.5 ui-monospace, Consolas, monospace; max-height:360px; overflow:auto; }
ol.adim{ margin:6px 0 0; padding-left:0; list-style:none; font-size:12.5px; }
ol.adim li{ display:grid; grid-template-columns:34px 86px 1fr; gap:6px; padding:3px 0; border-top:1px solid var(--cizgi); }
ol.adim li span:first-child{ color:var(--ikinci); text-align:right; } ol.adim li span:nth-child(2){ color:var(--ikinci); }
ol.adim li span:last-child{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.altajan{ margin-top:6px; padding:8px 10px; border-left:2px solid var(--cizgi); font-size:12.5px; }
.uyari summary{ color:var(--takildi); font-weight:600; }
.komut{ font:12px ui-monospace, Consolas, monospace; color:var(--ikinci); margin-top:6px; }
.bos{ color:var(--ikinci); padding:4px 0 8px; margin:0; font-size:13px; }
</style></head><body>
<header><h1>Görev takibi</h1><span class="zaman" id="zaman">yükleniyor…</span></header>
<div class="ag" id="ag"></div>
<h2>Ajanlar</h2><main id="ajanlar"></main>
<h2>Görev kuyruğu</h2><main id="liste"></main>
<script>
const kac = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
const once = t => { if(!t) return ''; const f = Math.round(Date.now() / 1000 - t);
  return f < 60 ? 'az önce' : f < 3600 ? Math.round(f / 60) + ' dk önce' : f < 86400 ? Math.round(f / 3600) + ' sa önce' : Math.round(f / 86400) + ' gün önce'; };
const sure = (a, b) => { const f = Math.max(0, Math.round((b || Date.now() / 1000) - a));
  return f < 3600 ? Math.round(f / 60) + ' dk' : Math.floor(f / 3600) + ' sa ' + Math.round(f % 3600 / 60) + ' dk'; };
const EFOR = { dusuk:'düşük', orta:'orta', yuksek:'yüksek' };
const sinif = s => kac(String(s || '').replace(/ /g, '-'));
const eforHtml = (e, m) => e ? '<span class="efor">efor <b>' + kac(EFOR[e] || e) + '</b>' + (m ? ' · ' + kac(m) : '') + '</span>' : '';
const adimHtml = a => '<li><span>' + a.idx + '</span><span>' + kac(a.tur) + '</span><span title="' + kac(a.ozet || a.metin) + '">'
  + (a.arac ? '<b>' + kac(a.arac) + '</b> ' + kac(a.ozet) : kac((a.metin || '').split('\\n')[0])) + '</span></li>';
function ajanHtml(a){
  const c = a.canli || {}, son = (c.son_adimlar || []).slice(-1)[0] || {};
  const hal = a.acik ? (c.hal || '?') : 'kapalı';
  const araclar = Object.entries(c.araclar || {}).sort((x, y) => y[1] - x[1]);
  return '<section class="g"><div class="g-bas"><b>' + kac(a.ad) + '</b>'
    + '<span class="efor">' + (a.tur === 'mini' ? 'mini ajan' : 'görev ' + kac(a.gorev || '')) + '</span>' + eforHtml(a.efor, a.model)
    + '<span class="rozet sag ' + sinif(hal) + '">' + kac(hal) + '</span></div>'
    + '<div class="olcu"><span>süre <b>' + sure(a.baslangic, a.acik ? null : a.kapanis) + '</b></span>'
    + '<span>adım <b>' + (c.adim == null ? '–' : c.adim) + '</b></span>'
    + '<span>son hareket <b>' + (once(c.son_degisim) || '–') + '</b></span>'
    + '<span>mesaj <b>' + (a.mesajlar || 1) + '</b></span>'
    + (a.tur === 'gorev' && c.commit != null ? '<span>commit <b>' + c.commit + '</b></span><span>kaydedilmemiş <b>' + (c.degisen || 0) + '</b></span>' : '')
    + ((c.alt || []).length ? '<span>alt ajan <b>' + c.alt.length + '</b></span>' : '') + '</div>'
    + (araclar.length ? '<div class="cip">' + araclar.map(([k, v]) => '<span>' + kac(k) + ' ' + v + '</span>').join('') + '</div>' : '')
    + ((c.disari || []).length ? '<details class="uyari"><summary>Klasör dışında ' + c.disari.length + ' iş (ana klasöre bak)</summary><ol class="adim">'
      + c.disari.map(x => '<li><span>' + x.idx + '</span><span>' + kac(x.tur) + '</span><span title="' + kac(x.metin) + '">' + kac(x.metin.split('\\n')[0]) + '</span></li>').join('') + '</ol></details>' : '')
    + (a.acik && son.idx != null ? '<div class="simdi">' + (c.hal === 'turu bitti' ? 'Tur bitti, sıra Claude Code’da.' : 'Şu an: ')
      + (c.hal === 'turu bitti' ? '' : (son.arac ? '<b>' + kac(son.arac) + '</b> ' + kac(son.ozet) : kac(son.tur))) + '</div>' : '')
    + '<div class="alt"><code>' + kac(a.worktree) + '</code>' + (a.dal ? ' · <code>' + kac(a.dal) + '</code>' : '')
    + (a.portlar ? ' · portlar ' + Object.entries(a.portlar).map(([k, v]) => k + ' ' + v).join(', ') : '')
    + ' · konuşma <code title="' + kac(a.konusma) + '">' + kac(String(a.konusma).slice(0, 8)) + '</code></div>'
    + (a.istem ? '<details><summary>İstem</summary><pre>' + kac(a.istem) + '</pre></details>' : '')
    + (c.son_adimlar && c.son_adimlar.length ? '<details' + (a.acik && c.hal !== 'turu bitti' ? ' open' : '') + '><summary>Son adımlar</summary><ol class="adim">'
      + c.son_adimlar.map(adimHtml).join('') + '</ol></details>' : '')
    + (c.cevap ? '<details' + (c.hal === 'turu bitti' ? ' open' : '') + '><summary>Son cevap</summary><pre>' + kac(c.cevap) + '</pre></details>' : '')
    + ((c.alt || []).length ? '<details><summary>Alt ajanlar</summary>' + c.alt.map(s => '<div class="altajan"><span class="rozet ' + sinif(s.hal) + '">'
        + kac(s.hal) + '</span> adım ' + kac(s.adim) + ' · ' + kac(s.istem.split('\\n')[0]) + (s.cevap ? '<pre>' + kac(s.cevap) + '</pre>' : '') + '</div>').join('') + '</details>' : '')
    + (a.acik ? '<div class="komut">python tools/ajan.py mesaj ' + kac(a.ad) + ' "…" · cevap ' + kac(a.ad) + ' · kapat ' + kac(a.ad) + '</div>' : '')
    + '</section>';
}
function gorevHtml(g){
  const no = g.dosya.slice(0, 3);
  return '<section class="g"><div class="g-bas"><b>' + kac(g.baslik) + '</b>' + eforHtml(g.efor)
    + '<span class="rozet sag ' + (g.main_de ? 'main' : kac(g.durum)) + '">' + (g.main_de ? 'main’de' : kac(g.durum)) + '</span></div>'
    + '<div class="alt">' + (g.dal_var ? '<code>' + kac(g.dal) + '</code> · main’den ' + g.ileri + ' commit ileri · son: ' + kac(g.son_mesaj) + ' (' + once(g.son_zaman) + ')'
      : 'dal henüz yok (<code>' + kac(g.dal) + '</code>)') + ' · okunan: ' + kac(g.kaynak) + (g.ajan ? ' · ajan <b>' + kac(g.ajan) + '</b>' : '') + '</div>'
    + (g.sonuc ? '<details' + (g.durum === 'bitti' || g.durum === 'takıldı' ? ' open' : '') + '><summary>Sonuç</summary><pre>' + kac(g.sonuc) + '</pre></details>' : '')
    + (!g.ajan && g.durum === 'bekliyor' ? '<div class="komut">python tools/ajan.py baslat ' + kac(no) + (g.efor ? '' : ' --efor orta') + '</div>' : '')
    + '</section>';
}
async function tazele(){
  let d; try{ d = await (await fetch('/api/durum', { cache:'no-store' })).json(); }catch(e){ document.getElementById('zaman').textContent = 'okunamadı'; return; }
  const a = d.antigravity, y = d.yuva, calisan = d.ajanlar.filter(x => x.acik && (x.canli || {}).hal === 'çalışıyor').length;
  document.getElementById('ag').innerHTML = '<span><span class="nokta' + (a.acik ? ' acik' : '') + '"></span>Antigravity ' + (a.acik ? 'açık' : (a.acik === false ? 'kapalı' : 'yoklanıyor')) + '</span>'
    + '<span>' + calisan + ' ajan çalışıyor</span>'
    + '<span aria-label="' + y.dolu + ' / ' + y.toplam + ' yuva dolu">yuva <span class="yuva">' + Array.from({ length:y.toplam }, (_, i) => '<i class="' + (i < y.dolu ? 'dolu' : '') + '"></i>').join('') + '</span> ' + y.dolu + '/' + y.toplam + '</span>'
    + (a.var ? '<span>elle çalışma klasörü: <b>' + kac(a.dal || '?') + '</b>' + (a.degisen ? ' · ' + a.degisen + ' değişiklik' : '') + '</span>' : '');
  document.getElementById('ajanlar').innerHTML = d.ajanlar.length ? d.ajanlar.map(ajanHtml).join('')
    : '<p class="bos">Henüz ajan yok. Başlatmak için: <code>python tools/ajan.py baslat 001</code></p>';
  document.getElementById('liste').innerHTML = d.gorevler.length ? d.gorevler.map(gorevHtml).join('') : '<p class="bos">Kuyrukta görev yok.</p>';
  document.getElementById('zaman').textContent = 'güncellendi ' + new Date().toLocaleTimeString('tr-TR');
}
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
