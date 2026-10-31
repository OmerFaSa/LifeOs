#!/usr/bin/env python3
"""GOREV TAKIP — Antigravity ajanlarini ve gorev kuyrugunu izleyen kucuk masaustu penceresi.

Kullanici (2026-10-31): «bununla alakali takip etmek amacli bir masaustu
uygulamasi»; sonra «model efor degistirip minik ajanlar … gorev takibi ona gore
detayli», «daha anlasilir», «ofis gibi yonet». Ustte ekip (Uygulayici, Denetci,
Arastirmaci: su an ne yapiyor, kacinci iste, baglam dolulugu, token), akis panosu
(Sirada, Calisiyor, Incelemede, Bitti), altinda her gorev (Denetci raporu dahil): su an ne yaptigi duz Turkce, sure, adim, token,
commit, koruma kancasinin mudahaleleri, zaman cizelgesi, son cevabi, alt
ajanlari; teknik ayrinti katlanir. Kaynak: tools/ajan.py (Antigravity'nin
konusma dokumu) ve belgeler/ekip/gorevler/ kuyrugu. Edge'i
uygulama penceresinde acar. Pencere kapaninca (60 sn nabiz yok) kendisi de
kapanir. Yalniz 127.0.0.1. Otomatik pilotun paneli, Testci tablosu ve model
olcumu de buradadir. Tek yazdigi sey «is iste» kutusudur: istek
LifeOs-ajan/istekler.jsonl'e satir olarak duser, gorevi Claude Code planlar.

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
sys.path.insert(0, str(Path(__file__).resolve().parent))
import ofis_pilot as PILOT  # noqa: E402
import ofis_test as TESTCI  # noqa: E402
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


def denetci_cumle(dn):
    """Gorev kartinda Denetci'nin durumu tek cumle."""
    if not dn:
        return ""
    if dn.get("asama") == "çalışıyor":
        return "Denetçi inceliyor"
    k = dn.get("karar")
    if k and k[0] == "temiz":
        return "Denetçi: temiz"
    if k:
        return "Denetçi: %d bulgu" % k[1]
    return "Denetçi cevap verdi"


def pano(gorevler, ajanlar):
    """Her isi dort kolondan birine koyar: sira, calisiyor, inceleme, bitti (saf islev, testli)."""
    out = []
    for g in gorevler:
        a = next((x for x in ajanlar if x.get("gorev") == g["dosya"] and x.get("acik")), None)
        k = (a or {}).get("canli") or {}
        dn = (a or {}).get("denetci")
        if g.get("main_de"):
            kolon, cumle = "bitti", "main'e alındı"
        elif a and a.get("asama") in ("çalışıyor", "sorun"):
            kolon, cumle = "calisiyor", k.get("simdi") or "Başlıyor"
        elif a and a.get("asama") == "inceleme":
            kolon, cumle = "inceleme", denetci_cumle(dn) or "Uygulayıcı bitirdi; Denetçi bekleniyor"
        elif g.get("dal_var") and g.get("ileri"):
            kolon, cumle = "inceleme", "Dalda %d commit; birleştirilmedi" % g["ileri"]
        else:
            kolon, cumle = "sira", "Henüz başlamadı"
        out.append({"tur": "görev", "ad": g["dosya"][:3], "baslik": re.sub(r"^\d{3}\s*·\s*", "", g["baslik"]),
                    "kolon": kolon, "cumle": cumle, "efor": (a or {}).get("efor") or g.get("efor"),
                    "sorun": bool(a and a.get("asama") == "sorun") or bool(dn and dn.get("karar") and dn["karar"][0] == "bulgu"),
                    "ajan": (a or {}).get("ad", "")})
    for a in ajanlar:
        if a.get("tur") in ("mini", "soru") and a.get("acik"):
            k = a.get("canli") or {}
            out.append({"tur": "soru", "ad": a["ad"], "baslik": (a.get("istem") or "")[:80],
                        "kolon": "inceleme" if a.get("asama") == "inceleme" else "calisiyor",
                        "cumle": "Cevap hazır" if a.get("asama") == "inceleme" else (k.get("simdi") or "Başlıyor"),
                        "efor": a.get("efor"), "sorun": a.get("asama") == "sorun", "ajan": a["ad"]})
    return out


def istek_gecerli(baslik, govde, istemci):
    """Is iste kutusu: (metin, hata). Yalniz bu bilgisayardan, ozel baslikla (baska site gonderemez)."""
    if istemci != "127.0.0.1" or baslik.get("Host") != "127.0.0.1:%d" % PORT:
        return None, "Yalnız bu bilgisayardan."
    if baslik.get("X-LifeOS-Ofis") != "1":
        return None, "Başlık eksik."
    try:
        metin = str(json.loads(govde or "{}").get("metin") or "").strip()
    except (ValueError, AttributeError):
        return None, "İstek okunamadı."
    if not 3 <= len(metin) <= 2000:
        return None, "İstek 3 ile 2000 karakter arasında olmalı."
    return metin, None


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
            "ofis": AJAN.uyeler(ajanlar), "sinir": {"is": AJAN.MAX_IS, "baglam": AJAN.BAGLAM_SINIR},
            "kanca": AJAN.kanca_kurulu(), "pilot": PILOT.ozet(),
            "testler": [t for t in (TESTCI.son_ozet(k.name) for k in sorted(TESTCI.klasor().glob("*"), reverse=True)
                                    if k.is_dir()) if t][:4],
            "istekler": PILOT.jsonl_oku("istekler.jsonl", 5),
            "yuva": {"dolu": sum(1 for a in ajanlar if a.get("acik")), "toplam": AJAN.YUVA_SAY},
            "antigravity": {"acik": sunucu_acik(), "klasor": str(AG), "var": AG.exists(), "dal": ag_dal,
                            "degisen": len(ag_degisen.splitlines()) if ag_degisen else 0}}


SAYFA = """<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Görev takibi</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{ color-scheme:light dark; --bg:#f3f4f6; --kart:#fff; --yazi:#14161b; --ikinci:#5b616b; --ucuncu:#8b919b; --cizgi:#e1e3e8; --zayif:#eef0f3;
  --vurgu:#2f6bff; --vurgu-zayif:rgba(47,107,255,.12); --iyi:#15803d; --uyari:#b45309; --kotu:#c2410c; }
@media (prefers-color-scheme:dark){ :root{ --bg:#111317; --kart:#1a1d23; --yazi:#eceef2; --ikinci:#a3a8b1; --ucuncu:#7b818b; --cizgi:#2a2e36; --zayif:#22262d;
  --vurgu-zayif:rgba(47,107,255,.22); } }
*{ box-sizing:border-box; } body{ margin:0; font:14px/1.5 system-ui, "Segoe UI", sans-serif; background:var(--bg); color:var(--yazi); }
.sayfa{ max-width:1080px; margin:0 auto; padding:20px 20px 28px; }
header{ display:flex; align-items:flex-end; gap:16px; flex-wrap:wrap; }
h1{ margin:0; font-size:20px; font-weight:650; letter-spacing:-.01em; }
.cumle{ margin:2px 0 0; color:var(--ikinci); font-size:13.5px; } .cumle b{ color:var(--yazi); font-weight:600; }
.durumcuk{ margin-left:auto; display:flex; gap:14px; font-size:12px; color:var(--ikinci); flex-wrap:wrap; }
.nokta{ display:inline-block; width:7px; height:7px; border-radius:50%; margin-right:6px; vertical-align:1px; background:var(--ucuncu); }
.nokta.iyi{ background:var(--iyi); } .nokta.kotu{ background:var(--kotu); } .nokta.canli{ background:var(--vurgu); }
h2{ display:flex; align-items:baseline; gap:8px; margin:26px 0 10px; font-size:13px; font-weight:650; color:var(--yazi); }
h2 small{ font-weight:450; color:var(--ucuncu); font-size:12px; }
.ekip{ display:grid; grid-template-columns:repeat(auto-fill, minmax(232px, 1fr)); gap:10px; }
.uye{ background:var(--kart); border-radius:14px; box-shadow:inset 0 0 0 1px var(--cizgi); padding:14px; display:grid; gap:10px; }
.uye-bas{ display:flex; align-items:center; gap:10px; }
.avatar{ flex:none; width:36px; height:36px; border-radius:50%; display:grid; place-items:center; font-size:12.5px; font-weight:650;
  background:var(--zayif); color:var(--ikinci); position:relative; }
.avatar.calisiyor{ background:var(--vurgu-zayif); color:var(--vurgu); }
.avatar.calisiyor::after{ content:""; position:absolute; right:-1px; bottom:-1px; width:10px; height:10px; border-radius:50%; background:var(--vurgu);
  box-shadow:0 0 0 2px var(--kart); }
.uye-ad b{ display:block; font-size:14px; font-weight:600; } .uye-ad small{ color:var(--ikinci); font-size:12px; }
.uye-simdi{ font-size:12.5px; color:var(--ikinci); min-height:36px; } .uye-simdi b{ color:var(--yazi); font-weight:550; }
.olcek{ display:grid; gap:6px; font-size:11.5px; color:var(--ikinci); }
.olcek-satir{ display:grid; grid-template-columns:52px 1fr auto; gap:8px; align-items:center; }
.cubuk{ height:4px; border-radius:2px; background:var(--zayif); overflow:hidden; } .cubuk i{ display:block; height:100%; background:var(--ucuncu); border-radius:2px; }
.cubuk i.dolu{ background:var(--uyari); }
.tik{ display:flex; gap:3px; } .tik i{ width:14px; height:4px; border-radius:2px; background:var(--zayif); } .tik i.on{ background:var(--ucuncu); }
.pano{ display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:10px; }
@media (max-width:760px){ .pano{ grid-template-columns:repeat(2, minmax(0, 1fr)); } }
.kolon{ background:var(--zayif); border-radius:12px; padding:8px; min-height:84px; }
.kolon h3{ display:flex; justify-content:space-between; margin:2px 4px 8px; font-size:12px; font-weight:600; color:var(--ikinci); }
.is{ display:block; width:100%; text-align:left; font:inherit; color:inherit; background:var(--kart); border:0; border-radius:9px;
  padding:9px 10px; margin-bottom:6px; box-shadow:inset 0 0 0 1px var(--cizgi); cursor:pointer; }
.is:hover{ box-shadow:inset 0 0 0 1px var(--ucuncu); } .is:focus-visible{ outline:2px solid var(--vurgu); outline-offset:1px; }
.is:disabled{ cursor:default; } .is.sorun{ box-shadow:inset 3px 0 0 var(--kotu), inset 0 0 0 1px var(--cizgi); }
.is b{ display:block; font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.is small{ display:flex; align-items:center; color:var(--ikinci); font-size:12px; margin-top:3px; overflow:hidden; white-space:nowrap; }
.is small span{ overflow:hidden; text-overflow:ellipsis; }
.efor{ flex:none; display:inline-flex; gap:2px; margin-right:7px; } .efor i{ width:5px; height:10px; border-radius:1.5px; background:var(--cizgi); }
.efor i.dolu{ background:var(--vurgu); }
.bos{ color:var(--ucuncu); font-size:12px; margin:6px 4px; }
.isler{ display:grid; gap:12px; }
.ajan{ background:var(--kart); border-radius:14px; box-shadow:inset 0 0 0 1px var(--cizgi); padding:16px 18px; scroll-margin-top:12px; }
.ajan-bas{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; } .ajan-bas b{ font-size:15.5px; font-weight:650; }
.etiket{ font-size:12px; color:var(--ikinci); }
.asama{ margin-left:auto; font-size:12px; font-weight:600; padding:3px 10px; border-radius:999px; background:var(--zayif); color:var(--ikinci); }
.asama.calisiyor{ background:var(--vurgu); color:#fff; } .asama.inceleme{ background:var(--iyi); color:#fff; } .asama.sorun{ background:var(--kotu); color:#fff; }
.simdi{ margin:10px 0 0; font-size:14.5px; } .simdi span{ color:var(--ikinci); }
.olcu{ display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:8px; margin-top:12px; }
.olcu div{ background:var(--zayif); border-radius:9px; padding:7px 10px; } .olcu small{ display:block; font-size:11px; color:var(--ikinci); }
.olcu b{ font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; }
.rapor{ margin-top:12px; border-radius:10px; padding:10px 12px; background:var(--zayif); }
.rapor-bas{ display:flex; gap:8px; align-items:center; font-size:13px; } .rapor-bas b{ font-weight:600; }
.rapor.temiz .rapor-bas b{ color:var(--iyi); } .rapor.bulgu .rapor-bas b{ color:var(--kotu); }
.koruma{ margin-top:10px; font-size:12.5px; color:var(--ikinci); } .koruma b{ color:var(--yazi); font-weight:600; } .koruma.uyari{ color:var(--kotu); }
details{ margin-top:10px; } summary{ cursor:pointer; font-size:12.5px; color:var(--ikinci); }
ol.cizelge{ list-style:none; margin:8px 0 0; padding:0 0 0 14px; border-left:2px solid var(--cizgi); }
ol.cizelge li{ position:relative; padding:3px 0 5px 4px; font-size:12.5px; display:grid; grid-template-columns:44px 1fr; gap:8px; }
ol.cizelge li::before{ content:""; position:absolute; left:-20px; top:9px; width:8px; height:8px; border-radius:50%; background:var(--cizgi); }
ol.cizelge li.model::before{ background:var(--vurgu); } ol.cizelge li.hata::before{ background:var(--kotu); }
ol.cizelge time{ color:var(--ucuncu); font-variant-numeric:tabular-nums; } ol.cizelge span{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
pre{ white-space:pre-wrap; word-break:break-word; margin:8px 0 0; font:12.5px/1.55 ui-monospace, Consolas, monospace; max-height:340px; overflow:auto;
  background:var(--zayif); border-radius:9px; padding:10px 12px; }
.rapor pre{ background:var(--kart); }
.soru{ background:var(--kart); border-radius:12px; box-shadow:inset 0 0 0 1px var(--cizgi); padding:12px 14px; scroll-margin-top:12px; }
.soru p{ margin:0; font-size:13.5px; } .soru small{ color:var(--ikinci); font-size:12px; }
dl{ display:grid; grid-template-columns:auto 1fr; gap:3px 12px; margin:8px 0 0; font-size:12.5px; } dt{ color:var(--ikinci); } dd{ margin:0; word-break:break-all; }
code{ font:12px ui-monospace, Consolas, monospace; }
.tablo{ width:100%; border-collapse:collapse; font-size:12px; margin-top:10px; } .tablo th{ font-weight:500; color:var(--ikinci); text-align:center; padding:4px 2px; }
.tablo th:first-child{ text-align:left; } .tablo td{ text-align:center; padding:5px 2px; border-top:1px solid var(--cizgi); } .tablo tbody th{ text-align:left; border-top:1px solid var(--cizgi); }
.hucre{ display:inline-block; width:9px; height:9px; border-radius:50%; box-shadow:inset 0 0 0 1.5px var(--cizgi); }
.hucre.yesil{ background:var(--iyi); box-shadow:none; } .hucre.kirmizi{ background:var(--kotu); box-shadow:none; } .hucre.kosulamadi{ background:var(--ucuncu); box-shadow:none; }
.model{ display:grid; grid-template-columns:90px 1fr auto; gap:12px; align-items:center; font-size:12.5px; padding:7px 0; border-top:1px solid var(--cizgi); }
.model:first-child{ border-top:0; } .model b{ font-weight:600; } .model small{ color:var(--ikinci); }
.model .olcek-satir{ grid-template-columns:1fr auto; color:var(--ikinci); }
.iste{ display:grid; gap:8px; } .iste textarea{ font:inherit; color:inherit; background:var(--kart); border:0; border-radius:10px; padding:10px 12px; min-height:64px;
  resize:vertical; box-shadow:inset 0 0 0 1px var(--cizgi); } .iste textarea:focus-visible{ outline:2px solid var(--vurgu); outline-offset:1px; }
.iste-alt{ display:flex; align-items:center; gap:10px; font-size:12.5px; color:var(--ikinci); }
.iste button{ font:inherit; font-weight:600; color:#fff; background:var(--vurgu); border:0; border-radius:999px; padding:6px 16px; cursor:pointer; min-height:32px; }
.iste button:focus-visible{ outline:2px solid var(--vurgu); outline-offset:2px; }
.rehber{ margin-top:22px; font-size:12.5px; color:var(--ikinci); } .rehber p{ margin:6px 0; }
</style></head><body><div class="sayfa">
<header><div><h1>Görev takibi</h1><p class="cumle" id="cumle">Yükleniyor…</p></div><div class="durumcuk" id="durumcuk"></div></header>
<h2>Otomatik pilot <small>kuyruğu yürütür; birleştirmez, push etmez</small></h2><div id="pilot"></div>
<h2>Ekip <small>Antigravity'de Claude Code için çalışan roller</small></h2><div class="ekip" id="ekip"></div>
<h2>İş akışı</h2><div class="pano" id="pano"></div>
<h2 id="isler-baslik">İşler</h2><div class="isler" id="isler"></div>
<div id="testler"></div>
<div id="olcum"></div>
<div id="sorular"></div>
<h2>İş iste <small>görev dosyasını Claude Code yazar</small></h2>
<form class="iste" id="iste"><label for="iste-metin" class="etiket">Ne yapılsın? Kısa yaz; ölçütü ve görevi Claude Code planlar.</label>
<textarea id="iste-metin" maxlength="2000" required></textarea><div class="iste-alt"><button type="submit">Gönder</button><span id="iste-sonuc" role="status"></span></div>
<div id="istekler"></div></form>
<details class="rehber"><summary>Nasıl okunur</summary>
<p><b>Ekip:</b> Uygulayıcı görevi yapar ve dalını push eder; Denetçi o dalı Claude Code'dan önce inceler ve «temiz» ya da bulgu yazar; Araştırmacı soruları kanıtla cevaplar. Tasarım ve kritik işler Claude Code'da kalır, birleştirmeyi o yapar.</p>
<p><b>Aynı sohbet:</b> bir rolün sohbeti boşsa, içinde üçten az iş varsa ve bağlamı sınırın altındaysa yeni iş aynı sohbete gider (kuralları yeniden okumaz, önbellek işler). Kartın altındaki çubuk bağlamın ne kadarının dolduğunu, tikler kaçıncı işte olduğunu gösterir; dolunca yeni sohbet açılır.</p>
<p><b>Pilot:</b> sıradaki görevleri en çok üç paralel başlatır; Denetçi bulgu yazarsa Uygulayıcı'ya geri gönderir (en çok iki tur), Testçi'yi koşturur, sonra işi «hazır» yapar. Birleştirmeyi ve son incelemeyi Claude Code yapar.</p>
<p><b>Testçi:</b> model değil, betiktir: main ile dalın deneme birleşmesinde üç modülün tam denetimlerini ve uçtan uca denetimi koşar. Yeşil geçti, kırmızı kaldı, gri koşulamadı (port doluydu), boş halka sırada.</p>
<p><b>Efor:</b> bir çubuk düşük (flash_lite), iki orta (flash), üç yüksek (pro).</p>
<p><b>Koruma:</b> kanca komutu ajanın klasörüne yönlendirir; ana klasöre, main'e, kişisel veriye ve dış hesaplara dokunan aracı engeller; iş bitmeden ya da push edilmeden durmasına izin vermez.</p></details>
</div>
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
  const ad = 'efor ' + x[1] + (model ? ', ' + model : '');
  return '<span class="efor" role="img" aria-label="' + kac(ad) + '" title="' + kac(ad) + '">' + [1, 2, 3].map(i => '<i class="' + (i <= x[0] ? 'dolu' : '') + '"></i>').join('') + '</span>'; };
const ASAMA = { 'çalışıyor':['calisiyor', 'Çalışıyor'], inceleme:['inceleme', 'Hazır'], sorun:['sorun', 'Dikkat'], 'kapandı':['', 'Kapandı'] };
const KOLON = [['sira', 'Sırada'], ['calisiyor', 'Çalışıyor'], ['inceleme', 'İncelemede'], ['bitti', 'Bitti']];
const BAS = { uygulayici:'UY', denetci:'DE', arastirmaci:'AR' };
const kimlik = ad => 'is-' + String(ad).replace(/[^a-z0-9-]/gi, '');

function uyeHtml(u, s){
  const calisiyor = u.hal === 'çalışıyor' || u.hal === 'başlıyor', oran = Math.min(1, (u.baglam || 0) / (s.baglam || 1));
  const simdi = calisiyor ? '<b>' + kac(u.simdi || 'Başlıyor') + '</b>' : u.acik.length ? 'Boşta · son iş ' + kac(u.is) + ' hazır' : 'Boşta';
  return '<article class="uye"><div class="uye-bas"><span class="avatar' + (calisiyor ? ' calisiyor' : '') + '" aria-hidden="true">' + BAS[u.rol] + '</span>'
    + '<div class="uye-ad"><b>' + kac(u.rol_ad) + '</b><small>' + eforHtml(u.efor, u.model) + kac(u.model) + '</small></div></div>'
    + '<div class="uye-simdi">' + simdi + '</div>'
    + '<div class="olcek"><div class="olcek-satir"><span>İş</span><span class="tik" role="img" aria-label="' + u.isler.length + ' / ' + s.is + ' iş">'
    + Array.from({ length:s.is }, (_, i) => '<i class="' + (i < u.isler.length ? 'on' : '') + '"></i>').join('') + '</span><span>' + u.isler.length + ' / ' + s.is + '</span></div>'
    + '<div class="olcek-satir"><span>Bağlam</span><span class="cubuk" role="img" aria-label="bağlam ' + bin(u.baglam) + ', sınır ' + bin(s.baglam) + '"><i class="' + (oran > .8 ? 'dolu' : '')
    + '" style="width:' + Math.round(oran * 100) + '%"></i></span><span>' + bin(u.baglam) + '</span></div>'
    + '<div class="olcek-satir"><span>Token</span><span></span><span>' + bin(u.token.giris) + ' / ' + bin(u.token.cikis) + '</span></div></div></article>';
}

function panoHtml(p){
  return KOLON.map(([k, ad]) => { const l = p.filter(x => x.kolon === k);
    return '<section class="kolon" aria-label="' + ad + ', ' + l.length + ' iş"><h3><span>' + ad + '</span><span>' + l.length + '</span></h3>'
      + (l.length ? l.map(x => '<button class="is' + (x.sorun ? ' sorun' : '') + '"' + (x.ajan ? ' data-git="' + kimlik(x.ajan) + '"' : ' disabled')
        + '><b>' + (x.tur === 'soru' ? 'Soru · ' : kac(x.ad) + ' · ') + kac(x.baslik) + '</b><small>' + eforHtml(x.efor) + '<span>' + kac(x.cumle) + '</span></small></button>').join('')
        : '<p class="bos">Boş</p>') + '</section>'; }).join('');
}

function korumaHtml(c, kanca){
  const k = c.kanca || {}, eng = k.engellendi || [];
  if(!kanca && (c.disari || []).length) return '<p class="koruma uyari">Koruma kancası kurulu değil · ajan klasörü dışında <b>' + c.disari.length + '</b> iş yaptı.</p>';
  if(!kanca) return '<p class="koruma">Koruma kancası kurulu değil.</p>';
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
    const yazi = a.cumle || (a.tur === 'istem' ? 'Görev verildi' : a.tur === 'sistem' ? 'Mesaj geldi' : a.tur === 'sonuç' ? 'Araç çalışıyor…' : (a.metin || '').split('\\n')[0]);
    return '<li class="' + (a.tur === 'hata' ? 'hata' : a.tur === 'model' ? 'model' : '') + '"><time>' + saat(a.zaman) + '</time><span title="' + kac(yazi) + '">' + kac(yazi) + '</span></li>';
  }).join('') + '</ol>';
}

function raporHtml(dn){
  if(!dn) return '';
  if(dn.asama === 'çalışıyor') return '<div class="rapor"><div class="rapor-bas"><span class="nokta canli"></span><b>Denetçi inceliyor</b></div></div>';
  const k = dn.karar, sinif = k ? (k[0] === 'temiz' ? 'temiz' : 'bulgu') : '';
  const baslik = !k ? 'Denetçi cevap verdi' : k[0] === 'temiz' ? 'Denetçi: temiz' : 'Denetçi: ' + k[1] + ' bulgu';
  return '<div class="rapor ' + sinif + '"><div class="rapor-bas"><b>' + baslik + '</b><span class="etiket">' + (dn.commit ? 'commit ' + kac(dn.commit) : '') + '</span></div>'
    + (dn.cevap ? '<details' + (sinif === 'bulgu' ? ' open' : '') + '><summary>Raporu</summary><pre>' + kac(dn.cevap) + '</pre></details>' : '') + '</div>';
}

function isHtml(a, kanca){
  const c = a.canli || {}, s = ASAMA[a.asama] || ['', a.asama], t = c.token || {};
  const simdi = a.asama === 'inceleme' ? 'Uygulayıcı bitirdi ve dalını push etti.' : a.asama === 'kapandı' ? 'Kapandı.'
    : a.asama === 'sorun' ? 'Dikkat: ' + (c.hal === 'sessiz' ? 'on dakikadır hareket yok.' : c.hal === 'hata' ? 'Antigravity hata verdi.' : 'klasör dışında iş yaptı.')
    : (c.simdi || 'Başlıyor…');
  return '<section class="ajan" id="' + kimlik(a.ad) + '"><div class="ajan-bas"><b>' + kac(a.gorev || a.ad).replace(/\\.md$/, '') + '</b>'
    + eforHtml(a.efor, a.model) + '<span class="etiket">Uygulayıcı · ' + kac(a.model) + '</span><span class="asama ' + s[0] + '">' + s[1] + '</span></div>'
    + '<p class="simdi">' + (a.asama === 'çalışıyor' ? '<span>Şu an:</span> ' : '') + kac(simdi) + '</p>'
    + '<div class="olcu"><div><small>Süre</small><b>' + sure(a.baslangic, a.acik ? null : a.kapanis) + '</b></div>'
    + '<div><small>Adım</small><b>' + (c.adim == null ? '–' : c.adim) + '</b></div>'
    + '<div><small>Son hareket</small><b>' + once(c.son_degisim) + '</b></div>'
    + '<div><small>Token giriş / çıkış</small><b>' + bin(t.giris) + ' / ' + bin(t.cikis) + '</b></div>'
    + (c.commit != null ? '<div><small>Commit / açık dosya</small><b>' + c.commit + ' / ' + (c.degisen || 0) + '</b></div>' : '')
    + ((c.alt || []).length ? '<div><small>Alt ajan</small><b>' + c.alt.length + '</b></div>' : '') + '</div>'
    + raporHtml(a.denetci)
    + (a.acik ? korumaHtml(c, kanca) : '')
    + (c.son_adimlar && c.son_adimlar.length ? '<details' + (a.asama === 'çalışıyor' ? ' open' : '') + '><summary>Zaman çizelgesi</summary>' + cizelgeHtml(c.son_adimlar) + '</details>' : '')
    + (c.cevap ? '<details><summary>Uygulayıcının son mesajı</summary><pre>' + kac(c.cevap) + '</pre></details>' : '')
    + ((c.alt || []).length ? '<details><summary>Alt ajanlar</summary>' + c.alt.map(x => '<div class="rapor"><b>' + kac(x.hal) + '</b> · ' + kac(x.simdi || '')
        + (x.cevap ? '<pre>' + kac(x.cevap) + '</pre>' : '') + '</div>').join('') + '</details>' : '')
    + '<details><summary>Teknik ayrıntı</summary><dl>'
    + '<dt>Klasör</dt><dd><code>' + kac(a.worktree) + '</code></dd>' + (a.dal ? '<dt>Dal</dt><dd><code>' + kac(a.dal) + '</code></dd>' : '')
    + (a.portlar ? '<dt>Portlar</dt><dd>' + Object.entries(a.portlar).map(([k, v]) => k + ' ' + v).join(' · ') + '</dd>' : '')
    + '<dt>Konuşma</dt><dd><code>' + kac(a.konusma) + '</code>' + (a.adim_bas ? ' (adım ' + a.adim_bas + '’ten)' : '') + '</dd>'
    + '<dt>Araçlar</dt><dd>' + Object.entries(c.araclar || {}).sort((x, y) => y[1] - x[1]).map(([k, v]) => kac(k) + ' ' + v).join(' · ') + '</dd>'
    + (a.acik ? '<dt>Komut</dt><dd><code>python tools/ajan.py mesaj ' + kac(a.ad) + ' "…"</code> · <code>gozden ' + kac(a.ad) + '</code> · <code>kapat ' + kac(a.ad) + '</code></dd>' : '')
    + '</dl></details></section>';
}

function soruHtml(a){
  const c = a.canli || {}, hazir = a.asama === 'inceleme';
  return '<article class="soru" id="' + kimlik(a.ad) + '"><p>' + kac(a.istem) + '</p><small>' + eforHtml(a.efor, a.model)
    + (hazir ? 'Araştırmacı cevapladı' : a.asama === 'kapandı' ? 'Kapandı' : 'Araştırmacı: ' + kac(c.simdi || 'başlıyor')) + ' · ' + once(c.son_degisim) + '</small>'
    + (c.cevap ? '<details' + (hazir ? ' open' : '') + '><summary>Cevap</summary><pre>' + kac(c.cevap) + '</pre></details>' : '') + '</article>';
}

const EYLEM = { baslat:'başlattı', gozden:'Denetçi istedi', duzelt:'düzeltme gönderdi', test:'Testçi istedi', test_duzelt:'test düzeltmesi gönderdi',
  kota:'alt modele geçti', hazir:'hazır', birak:'bıraktı', hata:'hata', basla:'başladı', dur:'durdu' };
function pilotHtml(p){
  const isler = Object.entries(p.isler || {}).sort((a, b) => (a[1].hazir ? 1 : 0) - (b[1].hazir ? 1 : 0));
  return '<section class="ajan"><div class="ajan-bas"><b>' + (p.canli ? 'Çalışıyor' : 'Durmuş') + '</b>'
    + '<span class="tik" role="img" aria-label="bugün ' + p.bugun + ' / ' + p.gunluk + ' iş başlattı">' + Array.from({ length:p.gunluk }, (_, i) => '<i class="' + (i < p.bugun ? 'on' : '') + '"></i>').join('') + '</span>'
    + '<span class="etiket">bugün ' + p.bugun + ' / ' + p.gunluk + ' iş · en çok ' + p.paralel + ' paralel</span>'
    + '<span class="asama' + (p.canli ? ' calisiyor' : '') + '">' + (p.canli ? 'Canlı' : 'Kapalı') + '</span></div>'
    + (isler.length ? '<dl>' + isler.slice(0, 8).map(([no, s]) => '<dt>' + kac(no) + '</dt><dd>' + (s.hazir ? '<b>Hazır</b> · ' : '') + kac(s.sonuc || s.son || 'başladı') + '</dd>').join('') + '</dl>' : '')
    + (p.kararlar.length ? '<details' + (p.canli ? ' open' : '') + '><summary>Son kararlar</summary><ol class="cizelge">' + p.kararlar.slice().reverse().map(k => '<li class="'
      + (k.eylem === 'hata' || k.eylem === 'birak' ? 'hata' : 'model') + '"><time>' + saat(k.t * 1000) + '</time><span title="' + kac(k.neden) + '">'
      + kac((k.no === '-' ? 'Pilot' : k.no) + ' ' + (EYLEM[k.eylem] || k.eylem) + ': ' + k.neden) + '</span></li>').join('') + '</ol></details>' : '')
    + '<p class="koruma">' + (p.canli ? 'Durdurmak' : 'Başlatmak') + ' için: <code>python tools/ajan.py pilot ' + (p.canli ? 'dur' : 'baslat') + '</code></p></section>';
}
const DENETIM = [['derle', 'Derle'], ['runtests', 'Birim'], ['smoke', 'Duman'], ['a11ycheck', 'Erişim'], ['layoutcheck', 'Yerleşim'], ['palettecheck', 'Palet'], ['perfcheck', 'Başarım']];
const SONUC = { 'yeşil':'yesil', 'kırmızı':'kirmizi', 'koşulamadı':'kosulamadi' };
function testHtml(t){
  const bul = (m, ad) => t.adimlar.find(a => a.modul === m && a.ad === ad);
  const hucre = (m, ad, etiket) => { const a = bul(m, ad);
    return '<td><span class="hucre ' + (a ? SONUC[a.sonuc] : '') + '" role="img" aria-label="' + kac(m + ' ' + etiket + ': ' + (a ? a.sonuc + ', çıkış ' + a.kod : 'sırada')) + '"'
      + (a ? ' title="' + kac(a.log) + '"' : '') + '></span></td>'; };
  const kirmizi = t.adimlar.filter(a => a.sonuc === 'kırmızı').length;
  const durum = t.durum === 'koşuyor' ? ['calisiyor', 'Koşuyor'] : t.durum === 'çakışma' ? ['sorun', 'Çakışma'] : kirmizi ? ['sorun', kirmizi + ' kırmızı'] : ['inceleme', 'Yeşil'];
  return '<section class="ajan"><div class="ajan-bas"><b>' + kac(t.no) + '</b><span class="etiket">' + kac(t.dal) + ' @ ' + kac(t.commit) + ' + main ' + kac(t.main) + '</span>'
    + '<span class="asama ' + durum[0] + '">' + durum[1] + '</span></div>'
    + (t.durum === 'çakışma' ? '<pre>' + kac(t.birlesme) + '</pre>' : '<table class="tablo"><thead><tr><th scope="col">Modül</th>' + DENETIM.map(d => '<th scope="col">' + d[1] + '</th>').join('') + '</tr></thead><tbody>'
      + ['AYS', 'SPI', 'ESP'].map(m => '<tr><th scope="row">' + m + '</th>' + DENETIM.map(d => hucre(m, d[0], d[1])).join('') + '</tr>').join('')
      + '<tr><th scope="row">Uçtan uca</th>' + hucre('kök', 'entegre', 'uçtan uca') + '<td colspan="6"></td></tr></tbody></table>')
    + '<p class="koruma">Ham çıktı: <code>python tools/ajan.py testler ' + kac(t.no) + '</code></p></section>';
}
function olcumHtml(o){
  const l = Object.entries(o || {}); if(!l.length) return '';
  return '<h2>Model ölçümü <small>yalnız öneri; efor kararı Claude Code’da</small></h2><section class="ajan">' + l.map(([m, v]) => { const y = Math.round(v.oran * 100);
    return '<div class="model"><b>' + kac(m) + '</b><span class="olcek-satir"><span class="cubuk" role="img" aria-label="ilk turda temiz yüzde ' + y + ', ' + v.is + ' iş"><i style="width:' + y + '%"></i></span>'
    + '<span>ilk turda temiz %' + y + '</span></span><small>' + v.is + ' iş · ort. ' + v.ort_tur.toFixed(1).replace('.', ',') + ' tur · ' + Math.max(1, Math.round(v.ort_sure / 60)) + ' dk · ' + bin(v.ort_token) + ' token</small></div>'; }).join('') + '</section>';
}

async function tazele(){
  let d; try{ d = await (await fetch('/api/durum', { cache:'no-store' })).json(); }catch(e){ document.getElementById('cumle').textContent = 'Durum okunamadı; takip sunucusu kapanmış olabilir.'; return; }
  const ag = d.antigravity, say = k => d.pano.filter(x => x.kolon === k).length;
  const acikMi = {}; document.querySelectorAll('details').forEach(x => { acikMi[ayrAnahtar(x)] = x.open; });
  const parca = [];
  if(say('calisiyor')) parca.push('<b>' + say('calisiyor') + '</b> iş çalışıyor');
  if(say('inceleme')) parca.push('<b>' + say('inceleme') + '</b> iş incelemede');
  if(say('sira')) parca.push('<b>' + say('sira') + '</b> iş sırada');
  const sorun = d.pano.filter(x => x.sorun).length;
  if(sorun) parca.push('<b>' + sorun + '</b> işte dikkat gereken bir durum var');
  document.getElementById('cumle').innerHTML = parca.length ? parca.join(', ') + '.' : 'Ofis boşta; çalışan ya da bekleyen iş yok.';
  document.getElementById('durumcuk').innerHTML = '<span><span class="nokta ' + (ag.acik ? 'iyi' : ag.acik === false ? 'kotu' : '') + '"></span>Antigravity ' + (ag.acik ? 'açık' : ag.acik === false ? 'kapalı' : 'yoklanıyor') + '</span>'
    + '<span><span class="nokta ' + (d.kanca ? 'iyi' : 'kotu') + '"></span>Koruma ' + (d.kanca ? 'açık' : 'kurulu değil') + '</span>'
    + '<span>' + new Date().toLocaleTimeString('tr-TR') + '</span>';
  document.getElementById('ekip').innerHTML = d.ofis.length ? d.ofis.map(u => uyeHtml(u, d.sinir)).join('') : '<p class="bos">Ekipte şu an kimse yok; ilk iş verilince roller açılır.</p>';
  document.getElementById('pano').innerHTML = panoHtml(d.pano);
  document.getElementById('pilot').innerHTML = pilotHtml(d.pilot);
  document.getElementById('testler').innerHTML = d.testler.length ? '<h2>Testçi <small>main + dal; üç modül ve uçtan uca</small></h2><div class="isler">' + d.testler.map(testHtml).join('') + '</div>' : '';
  document.getElementById('olcum').innerHTML = olcumHtml(d.pilot.olcum);
  document.getElementById('istekler').innerHTML = d.istekler.length ? '<ol class="cizelge">' + d.istekler.slice().reverse().map(x => '<li><time>' + saat(x.t * 1000) + '</time><span title="' + kac(x.metin) + '">' + kac(x.metin) + '</span></li>').join('') + '</ol>' : '';
  const gorev = d.ajanlar.filter(a => a.tur === 'gorev'), acik = gorev.filter(a => a.acik), kapali = gorev.filter(a => !a.acik);
  document.getElementById('isler').innerHTML = (acik.length ? acik.map(a => isHtml(a, d.kanca)).join('') : '<p class="bos">Açık görev yok.</p>')
    + (kapali.length ? '<details><summary>Geçmiş (' + kapali.length + ' görev)</summary>' + kapali.map(a => isHtml(a, d.kanca)).join('') + '</details>' : '');
  const sorular = d.ajanlar.filter(a => a.tur === 'soru' || a.tur === 'mini');
  const acikSoru = sorular.filter(a => a.acik), eskiSoru = sorular.filter(a => !a.acik);
  document.getElementById('sorular').innerHTML = sorular.length ? '<h2>Sorular <small>Araştırmacı</small></h2><div class="isler">' + acikSoru.map(soruHtml).join('')
    + (eskiSoru.length ? '<details><summary>Önceki sorular (' + eskiSoru.length + ')</summary><div class="isler">' + eskiSoru.map(soruHtml).join('') + '</div></details>' : '') + '</div>' : '';
  document.querySelectorAll('details').forEach(x => { const k = ayrAnahtar(x); if(k in acikMi) x.open = acikMi[k]; });
}
// yeniden cizim acilan/kapatilan bolumleri sifirlamasin: bolum kimligi + baslik (sayilar haric) ile hatirlanir
const ayrAnahtar = x => ((x.parentElement.closest('[id]') || {}).id || '') + '|' + ((x.querySelector('summary') || {}).textContent || '').replace(/\\d+/g, '');
document.addEventListener('click', e => { const b = e.target.closest('[data-git]'); if(!b) return;
  const h = document.getElementById(b.dataset.git); if(h){ let g = h.parentElement.closest('details'); while(g){ g.open = true; g = g.parentElement.closest('details'); } h.scrollIntoView({ behavior:'smooth' }); } });
document.getElementById('iste').addEventListener('submit', async e => { e.preventDefault();
  const alan = document.getElementById('iste-metin'), sonuc = document.getElementById('iste-sonuc');
  try{ const r = await fetch('/api/istek', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-LifeOS-Ofis':'1' }, body:JSON.stringify({ metin:alan.value }) });
    const j = await r.json(); sonuc.textContent = j.tamam ? 'Kaydedildi; Claude Code planlayacak.' : j.hata; if(j.tamam){ alan.value = ''; tazele(); }
  }catch(_){ sonuc.textContent = 'Gönderilemedi; takip sunucusu kapanmış olabilir.'; } });
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
        if self.path == "/api/istek":
            n = min(int(self.headers.get("Content-Length") or 0), 16000)
            metin, hata = istek_gecerli(self.headers, self.rfile.read(n).decode("utf-8", "replace"), self.client_address[0])
            if hata:
                return self._yaz(400, json.dumps({"hata": hata}, ensure_ascii=False), "application/json")
            PILOT.jsonl_ekle("istekler.jsonl", {"metin": metin, "durum": "yeni"})
            return self._yaz(200, json.dumps({"tamam": True}), "application/json")
        self._yaz(204, "", "text/plain")

    def log_message(self, *a):
        return


def main():
    if "--durum" in sys.argv:
        sys.stdout.reconfigure(encoding="utf-8")       # yonlendirilince cp1254 Turkce disi karakterde cokuyordu
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
