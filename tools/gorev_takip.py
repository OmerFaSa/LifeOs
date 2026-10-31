#!/usr/bin/env python3
"""GOREV TAKIP — Antigravity gorev kuyrugunu izleyen kucuk masaustu penceresi.

Kullanici (2026-10-31): «bununla alakali takip etmek amacli bir masaustu
uygulamasi». belgeler/ekip/gorevler/ kuyrugunu, her gorevin ag/ dalini ve
Antigravity'nin calisma klasorunu (C:\\Users\\ASUS\\LifeOs-ag) okur; Edge'i
uygulama penceresinde acar. Pencere kapaninca (60 sn nabiz yok) kendisi de
kapanir. Yalniz 127.0.0.1; hicbir seyi degistirmez, yalniz okur.

  python tools/gorev_takip.py            pencereyi acar
  python tools/gorev_takip.py --durum    durumu JSON olarak yazar (pencere yok)
"""
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
    sonuc = metin.split("## Sonuç", 1)[1] if "## Sonuç" in metin else ""
    sonuc = re.sub(r"<!--.*?-->", "", sonuc, flags=re.S).strip()
    d = (durum.group(1).strip().lower() if durum else "bekliyor")
    return {"baslik": bas.group(1).strip() if bas else "", "durum": d if d in DURUMLAR else "bekliyor",
            "dal": dal.group(1).strip() if dal else "", "sonuc": sonuc[:1200]}


def durum():
    ag_dal = git("rev-parse", "--abbrev-ref", "HEAD", kok=AG) if AG.exists() else None
    ag_degisen = git("status", "--porcelain", kok=AG) if AG.exists() else None
    birlesik = set((git("branch", "--merged", "main", "--format=%(refname:short)") or "").split())
    gorevler = []
    for yol in sorted((KOK / GOREVLER).glob("[0-9][0-9][0-9]-*.md")):
        rel = GOREVLER + "/" + yol.name
        g = gorev_oku(yol.read_text(encoding="utf-8"))
        g["dosya"] = yol.name
        dal = g["dal"]
        var = bool(dal) and git("rev-parse", "--verify", "--quiet", "refs/heads/" + dal) is not None
        if var and ag_dal == dal and (AG / rel).exists():
            g.update({k: v for k, v in gorev_oku((AG / rel).read_text(encoding="utf-8")).items() if k != "dal"})
            g["kaynak"] = "çalışma klasörü"
        elif var:
            m = git("show", dal + ":" + rel)
            if m:
                g.update({k: v for k, v in gorev_oku(m).items() if k != "dal"})
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
    return {"zaman": int(time.time()), "gorevler": gorevler,
            "antigravity": {"klasor": str(AG), "var": AG.exists(), "dal": ag_dal,
                            "degisen": len(ag_degisen.splitlines()) if ag_degisen else 0}}


SAYFA = """<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Görev takibi</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{ color-scheme:light dark; --bg:#f5f6f8; --kart:#fff; --yazi:#16181d; --ikinci:#5b616b; --cizgi:#e3e5ea;
  --bekliyor:#8a8f99; --suruyor:#2f6bff; --bitti:#1a8a5a; --takildi:#c2410c; }
@media (prefers-color-scheme:dark){ :root{ --bg:#14161a; --kart:#1d2026; --yazi:#eceef2; --ikinci:#a2a7b0; --cizgi:#2c3038; } }
*{ box-sizing:border-box; } body{ margin:0; font:14px/1.5 system-ui, "Segoe UI", sans-serif; background:var(--bg); color:var(--yazi); }
header{ display:flex; align-items:center; gap:12px; padding:16px 20px 8px; }
h1{ margin:0; font-size:18px; font-weight:650; } .zaman{ margin-left:auto; color:var(--ikinci); font-size:12px; }
.ag{ margin:0 20px 12px; padding:10px 14px; border-radius:12px; background:var(--kart); box-shadow:inset 0 0 0 1px var(--cizgi); font-size:13px; }
.ozet{ display:flex; gap:8px; padding:0 20px 12px; flex-wrap:wrap; }
.ozet span{ padding:4px 10px; border-radius:999px; background:var(--kart); box-shadow:inset 0 0 0 1px var(--cizgi); font-size:12px; }
main{ display:grid; gap:10px; padding:0 20px 20px; }
.g{ padding:14px 16px; border-radius:14px; background:var(--kart); box-shadow:inset 0 0 0 1px var(--cizgi); }
.g-bas{ display:flex; align-items:center; gap:10px; } .g-bas b{ font-size:15px; }
.rozet{ margin-left:auto; padding:2px 10px; border-radius:999px; font-size:12px; font-weight:600; color:#fff; background:var(--bekliyor); }
.rozet.sürüyor{ background:var(--suruyor); } .rozet.bitti{ background:var(--bitti); } .rozet.takıldı{ background:var(--takildi); }
.rozet.main{ background:#5b4bff; }
.alt{ margin-top:6px; color:var(--ikinci); font-size:12.5px; } .alt code{ font-size:12px; }
details{ margin-top:8px; } summary{ cursor:pointer; font-size:12.5px; color:var(--ikinci); }
pre{ white-space:pre-wrap; margin:6px 0 0; font:12.5px/1.5 ui-monospace, Consolas, monospace; }
.bos{ color:var(--ikinci); padding:20px; }
</style></head><body>
<header><h1>Görev takibi</h1><span class="zaman" id="zaman">yükleniyor…</span></header>
<div class="ag" id="ag"></div><div class="ozet" id="ozet"></div><main id="liste"></main>
<script>
const kac = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
const once = t => { if(!t) return ''; const f = Math.round(Date.now() / 1000 - t);
  return f < 60 ? 'az önce' : f < 3600 ? Math.round(f / 60) + ' dk önce' : f < 86400 ? Math.round(f / 3600) + ' sa önce' : Math.round(f / 86400) + ' gün önce'; };
async function tazele(){
  let d; try{ d = await (await fetch('/api/durum', { cache:'no-store' })).json(); }catch(e){ document.getElementById('zaman').textContent = 'okunamadı'; return; }
  const a = d.antigravity;
  document.getElementById('ag').innerHTML = !a.var ? 'Antigravity klasörü yok: <code>' + kac(a.klasor) + '</code>'
    : 'Antigravity şu an <b>' + kac(a.dal || '?') + '</b> dalında' + (a.degisen ? ' · <b>' + a.degisen + '</b> dosya kaydedilmemiş değişiklik (çalışıyor olabilir)' : ' · kaydedilmemiş değişiklik yok');
  const say = {}; d.gorevler.forEach(g => { const k = g.main_de ? 'main’de' : g.durum; say[k] = (say[k] || 0) + 1; });
  document.getElementById('ozet').innerHTML = Object.keys(say).map(k => '<span>' + kac(k) + ' · ' + say[k] + '</span>').join('');
  document.getElementById('liste').innerHTML = d.gorevler.length ? d.gorevler.map(g => '<section class="g"><div class="g-bas"><b>' + kac(g.baslik) + '</b>'
      + '<span class="rozet ' + (g.main_de ? 'main' : kac(g.durum)) + '">' + (g.main_de ? 'main’de' : kac(g.durum)) + '</span></div>'
      + '<div class="alt">' + (g.dal_var ? '<code>' + kac(g.dal) + '</code> · main’den ' + g.ileri + ' commit ileri · son: ' + kac(g.son_mesaj) + ' (' + once(g.son_zaman) + ')'
        : 'dal henüz yok (<code>' + kac(g.dal) + '</code>)') + ' · okunan: ' + kac(g.kaynak) + '</div>'
      + (g.sonuc ? '<details' + (g.durum === 'bitti' || g.durum === 'takıldı' ? ' open' : '') + '><summary>Sonuç</summary><pre>' + kac(g.sonuc) + '</pre></details>' : '')
      + '</section>').join('') : '<p class="bos">Kuyrukta görev yok.</p>';
  document.getElementById('zaman').textContent = 'güncellendi ' + new Date().toLocaleTimeString('tr-TR');
}
tazele(); setInterval(tazele, 10000);
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
