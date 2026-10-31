#!/usr/bin/env python3
"""AJAN — Claude Code'un Antigravity ajanlarini baslatip izledigi arac.

Kullanici (2026-10-31): «antigravity'yi tam takir sen kullanacaksin, model
efor degistirip minik ajanlar ayarlayabileceksin». Her ajan Antigravity'de
ayri bir konusmadir; her biri KENDI worktree'sinde ve KENDI test portlarinda
calisir, iki ajan birbirinin dalini ya da sunucusunu bozmaz.

  python tools/ajan.py baslat 001 [--efor dusuk|orta|yuksek] [--not "..."]
  python tools/ajan.py mini <ad> "<istem>" [--efor ...]   salt okuma, cevap verir
  python tools/ajan.py mesaj <ad> "<metin>"                 konusmaya yeni mesaj
  python tools/ajan.py durum [--json]                       butun ajanlar
  python tools/ajan.py cevap <ad>                           son cevabin tam metni
  python tools/ajan.py kapat <ad> [--zorla]                 worktree'yi kaldirir (dal kalir)
  python tools/ajan.py kur [--kaldir]                       Antigravity kancasini (hooks.json) kurar/kaldirir

Efor modeli secer: dusuk -> flash_lite, orta -> flash, yuksek -> pro.
Gorev dosyasindaki «**Efor:**» satiri varsayilandir; --efor onu ezer.

Antigravity'nin yerel dil sunucusuna (language_server.exe agentapi) baglanir;
adres ve CSRF anahtari calisan surecin komut satirindan okunur, hicbir yere
yazilmaz ve ekrana basilmaz. Konusma dokumu (~/.gemini/antigravity/brain/<id>/
.system_generated/logs/transcript.jsonl) yalniz okunur.
"""
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
GOREVLER = "belgeler/ekip/gorevler"
AJAN_KLASOR = Path(os.environ.get("LIFEOS_AJAN_KLASOR", Path.home() / "LifeOs-ajan"))
DURUM_DOSYA = AJAN_KLASOR / "ajanlar.json"
BEYIN = Path(os.environ.get("LIFEOS_AG_BEYIN", Path.home() / ".gemini/antigravity/brain"))
EFOR = {"dusuk": "flash_lite", "orta": "flash", "yuksek": "pro"}
EFOR_AD = {"dusuk": "düşük", "orta": "orta", "yuksek": "yüksek"}
YUVA_SAY = 9                    # yuva n -> AYS 47n1, SPI 47n2, ESP 47n3 (kapsam.js 4601-4603'u kullanir)
SESSIZ = getattr(subprocess, "CREATE_NO_WINDOW", 0)


def efor_cevir(s):
    s = (s or "").strip().lower().translate(str.maketrans("üşı", "usi"))
    return s if s in EFOR else None


def portlar(yuva):
    b = 4700 + 10 * yuva
    return {"AYS": b + 1, "SPI": b + 2, "ESP": b + 3}


def yuva_sec(ajanlar):
    dolu = {a.get("yuva") for a in ajanlar.values() if a.get("acik")}
    for n in range(1, YUVA_SAY + 1):
        if n not in dolu:
            return n
    raise SystemExit("Bütün yuvalar dolu (%d ajan açık); önce birini kapat." % YUVA_SAY)


# ---------- durum dosyasi ----------

def oku_durum():
    try:
        return json.loads(DURUM_DOSYA.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def yaz_durum(d):
    AJAN_KLASOR.mkdir(parents=True, exist_ok=True)
    gecici = DURUM_DOSYA.with_suffix(".tmp")
    gecici.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(gecici, DURUM_DOSYA)


# ---------- konusma dokumu (Antigravity'nin transcript.jsonl'i) ----------

def dokum_yolu(kimlik):
    return BEYIN / kimlik / ".system_generated" / "logs" / "transcript.jsonl"


def arglar(a):
    """Arac argumanlari dokumde JSON-kodlu metindir ("\"x\""); cozulmus sozluk."""
    out = {}
    for k, v in (a or {}).items():
        if isinstance(v, str) and v[:1] in '"[{':
            try:
                v = json.loads(v)
            except ValueError:
                pass
        out[k] = v
    return out


ARAC_AD = {"run_command": "Komut çalıştırıyor", "read_file": "Dosya okuyor", "view_file": "Dosya okuyor",
           "list_dir": "Klasöre bakıyor", "grep_search": "Arıyor", "find_by_name": "Arıyor",
           "write_file": "Dosya yazıyor", "write_to_file": "Dosya yazıyor", "edit_file": "Dosya düzenliyor",
           "replace_file_content": "Dosya düzenliyor", "multi_replace_file_content": "Dosya düzenliyor",
           "invoke_subagent": "Alt ajan açıyor", "manage_task": "Arka plan işine bakıyor",
           "send_message": "Mesaj gönderiyor", "schedule": "Bekliyor", "search_web": "Web'de arıyor"}


def arac_cumle(arac, a):
    """Bir arac cagrisini insanin okuyacagi kisa cumleye cevirir."""
    if arac.startswith("mcp_"):
        return "MCP aracı: " + arac[4:]
    ne = ARAC_AD.get(arac, arac)
    ayrinti = a.get("toolSummary") or a.get("CommandLine") or a.get("TargetFile") or a.get("Path") \
        or a.get("AbsolutePath") or a.get("Prompt") or ""
    ayrinti = str(ayrinti).strip().splitlines()[0] if str(ayrinti).strip() else ""
    if arac in ("read_file", "view_file", "write_file", "write_to_file", "edit_file", "replace_file_content",
                "multi_replace_file_content") and not a.get("toolSummary"):
        ayrinti = re.split(r"[\\/]", ayrinti)[-1]
    return ne + (": " + ayrinti[:140] if ayrinti else "")


def adim_ozet(x):
    """Dokumdeki bir satiri okunur bir adima cevirir."""
    tur = {"USER_INPUT": "istem", "PLANNER_RESPONSE": "model", "GENERIC": "sonuç", "SYSTEM_MESSAGE": "sistem",
           "EPHEMERAL_MESSAGE": "sistem", "ERROR_MESSAGE": "hata"}.get(x.get("type"), (x.get("type") or "").lower())
    cagri = (x.get("tool_calls") or [{}])[0]
    a = arglar(cagri.get("args"))
    arac = cagri.get("name", "")
    return {"idx": x.get("step_index"), "zaman": x.get("created_at", ""), "tur": tur, "durum": x.get("status", ""),
            "arac": arac, "araclar": [c.get("name", "") for c in x.get("tool_calls") or []],
            "cumle": arac_cumle(arac, a) if arac else "",
            "metin": re.sub(r"^(Created|Completed) At: \S+\n", "", str(x.get("content") or ""), flags=re.M)[:4000],
            "komut": str(a.get("CommandLine") or ""), "cwd": str(a.get("Cwd") or ""),
            "yol": str(a.get("TargetFile") or a.get("Path") or a.get("AbsolutePath") or ""),
            "giris": x.get("input_tokens") or 0, "cikis": x.get("output_tokens") or 0, "onbellek": x.get("cache_read_tokens") or 0}


def _icinde(yol, kok):
    n = lambda s: s.replace("/", "\\").strip("'\" ").rstrip("\\").lower()
    return n(yol) == n(kok) or n(yol).startswith(n(kok) + "\\")


YAZAN = re.compile(r"write|replace|edit|delete|move", re.I)


def klasor_disi(a, wt):
    """Ajanin kendi klasoru disinda calisan komutu ya da yazdigi dosya: (tur, metin) ya da None.
    Antigravity'nin kabugu ajanin klasorunde acilmaz (2026-10-31: 003 butun isi ana klasorde yapti)."""
    if a["komut"]:
        if a["cwd"] and _icinde(a["cwd"], wt):
            return None
        if wt.lower() in a["komut"].lower().replace("/", "\\"):
            return None
        return ("komut", a["komut"][:200])
    if a["yol"] and YAZAN.search(a["arac"]) and not _icinde(a["yol"], wt) \
            and not _icinde(a["yol"], str(Path.home() / ".gemini")):
        return ("dosya", a["yol"][:200])
    return None


def _satirlar(yol):
    out = []
    try:
        with open(yol, encoding="utf-8") as f:
            for s in f:
                try:
                    out.append(json.loads(s))
                except ValueError:                      # yazilmakta olan son satir
                    pass
    except OSError:
        return None
    return out


def konusma_oku(kimlik, son=12, wt=None):
    """Konusma dokumunden hal, adimlar, son cevap, token. Dokum yoksa None.
    wt verilirse o klasorun disinda calisan komut ve yazilan dosyalar 'disari'da listelenir."""
    yol = dokum_yolu(kimlik)
    satir = _satirlar(yol)
    if satir is None:
        return None
    adimlar = [adim_ozet(x) for x in satir]
    cevap = next((a["metin"] for a in reversed(adimlar) if a["tur"] == "model" and a["metin"] and not a["arac"]), "")
    araclar = {}
    for a in adimlar:
        for n in a["araclar"]:
            araclar[n] = araclar.get(n, 0) + 1
    degisti = yol.stat().st_mtime
    son_adim = adimlar[-1] if adimlar else None
    if not adimlar:
        hal = "başlıyor"
    elif son_adim["tur"] == "hata" or son_adim["durum"] == "ERROR":
        hal = "hata"
    elif son_adim["tur"] == "model" and not son_adim["arac"] and son_adim["durum"] == "DONE":
        hal = "turu bitti"
    elif son_adim["durum"] == "RUNNING" or time.time() - degisti < 600:
        hal = "çalışıyor"
    else:
        hal = "sessiz"
    simdi = next((a["cumle"] for a in reversed(adimlar) if a["cumle"]), "")
    disari = [dict(idx=a["idx"], tur=d[0], metin=d[1]) for a in adimlar if a["tur"] == "model" and wt
              for d in [klasor_disi(a, wt)] if d]
    return {"adim": len(adimlar), "hal": hal, "son_degisim": int(degisti), "cevap": cevap, "araclar": araclar,
            "simdi": simdi, "disari": disari,
            "token": {k: sum(a[k] for a in adimlar) for k in ("giris", "cikis", "onbellek")},
            "baslangic": adimlar[0]["zaman"] if adimlar else "",
            "son_adimlar": [{k: a[k] for k in ("idx", "zaman", "tur", "arac", "cumle", "metin", "durum")}
                            for a in adimlar[-son:]]}


def ebeveyn(kimlik):
    """Alt ajanin ebeveyni: ilk sistem mesaji 'sender=<kimlik>' tasir."""
    try:
        with open(dokum_yolu(kimlik), encoding="utf-8") as f:
            ilk = json.loads(f.readline() or "{}")
    except (OSError, ValueError):
        return None
    m = re.search(r"sender=([0-9a-f-]{36})", str(ilk.get("content") or ""))
    return m.group(1) if m else None


def alt_ajanlar(kimlik, baslangic):
    """Ajanin invoke_subagent ile actigi alt konusmalar."""
    out = []
    for d in BEYIN.iterdir() if BEYIN.exists() else []:
        try:
            if d.name == kimlik or dokum_yolu(d.name).stat().st_mtime < baslangic:
                continue
        except OSError:
            continue
        if ebeveyn(d.name) != kimlik:
            continue
        k = konusma_oku(d.name, son=3) or {}
        ilk = (_satirlar(dokum_yolu(d.name)) or [{}])[0]
        istem = str(ilk.get("content") or "").split("content=", 1)[-1]
        out.append({"konusma": d.name, "hal": k.get("hal"), "adim": k.get("adim"), "simdi": k.get("simdi"),
                    "istem": istem[:300], "cevap": (k.get("cevap") or "")[:600], "son_degisim": k.get("son_degisim")})
    return sorted(out, key=lambda x: x.get("son_degisim") or 0)


def olaylar(ad):
    """tools/ajan_kanca.py'nin bu ajan icin yazdigi kararlar (yonlendirme, engel, devam)."""
    try:
        satir = (AJAN_KLASOR / "olay" / (ad + ".jsonl")).read_text(encoding="utf-8").splitlines()
    except OSError:
        return []
    out = []
    for s in satir:
        try:
            out.append(json.loads(s))
        except ValueError:
            pass
    return out


# ---------- Antigravity kancasi (hooks.json) ----------

HOOKS = Path(os.environ.get("LIFEOS_AG_AYAR", Path.home() / ".gemini" / "config")) / "hooks.json"
KANCA_AD = "lifeos-ajan"


def kanca_tanimi(python=None):
    # cmd /c birden cok tirnakta ilk ve son tirnagi siler: tirnak yalniz bosluklu yolda
    t = lambda s: '"%s"' % s if " " in str(s) else str(s)
    komut = "%s %s " % (t(python or sys.executable), t(KOK / "tools" / "ajan_kanca.py"))
    return {"PreToolUse": [{"matcher": "*", "hooks": [{"type": "command", "command": komut + "PreToolUse", "timeout": 10}]}],
            "Stop": [{"type": "command", "command": komut + "Stop", "timeout": 20}]}


def kanca_kurulu():
    try:
        return KANCA_AD in json.loads(HOOKS.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False


def kur(kaldir=False):
    """Kullanicinin hooks.json'una yalniz «lifeos-ajan» anahtarini yazar/siler; digerlerine dokunmaz."""
    try:
        d = json.loads(HOOKS.read_text(encoding="utf-8"))
    except OSError:
        d = {}
    except ValueError:
        raise SystemExit("%s okunamadı (bozuk JSON); elle bakılmadan üzerine yazılmaz." % HOOKS)
    if kaldir:
        d.pop(KANCA_AD, None)
    else:
        d[KANCA_AD] = kanca_tanimi()
    HOOKS.parent.mkdir(parents=True, exist_ok=True)
    gecici = HOOKS.with_suffix(".tmp")
    gecici.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(gecici, HOOKS)
    print("Kanca %s: %s" % ("kaldırıldı" if kaldir else "kuruldu", HOOKS))


# ---------- Antigravity dil sunucusu ----------

def _ps(komut):
    r = subprocess.run(["powershell", "-NoProfile", "-Command", komut], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=30, creationflags=SESSIZ)
    return r.stdout


def sunucu():
    """(exe, ortam) — calisan dil sunucusu; yoksa None. Anahtar yalniz ortama gider."""
    j = _ps("$p = Get-CimInstance Win32_Process -Filter \"Name='language_server.exe'\" | Select-Object ProcessId,ExecutablePath,CommandLine;"
            " $o = foreach($x in $p){ [pscustomobject]@{ pid=$x.ProcessId; exe=$x.ExecutablePath; cmd=$x.CommandLine;"
            " port=@(Get-NetTCPConnection -OwningProcess $x.ProcessId -State Listen -ErrorAction SilentlyContinue | ForEach-Object LocalPort) } };"
            " ConvertTo-Json @($o) -Depth 3")
    try:
        surecler = json.loads(j or "[]")
    except ValueError:
        return None
    onbellek = oku_durum().get("_sunucu", {})
    for s in surecler:
        anahtar = re.search(r"--csrf_token[= ](\S+)", s.get("cmd") or "")
        if not anahtar or not s.get("exe"):
            continue
        sira = sorted(s.get("port") or [], key=lambda p: p != onbellek.get("port"))
        for port in sira:
            ortam = dict(os.environ, ANTIGRAVITY_CSRF_TOKEN=anahtar.group(1), ANTIGRAVITY_LS_ADDRESS="127.0.0.1:%d" % port)
            yanit = _agentapi(s["exe"], ortam, ["get-conversation-metadata", "00000000-0000-0000-0000-000000000000"])
            if "NotFound" in (yanit.get("error") or "") or yanit.get("response"):
                if onbellek.get("port") != port:
                    d = oku_durum()
                    d["_sunucu"] = {"port": port}
                    yaz_durum(d)
                return s["exe"], ortam
    return None


def _agentapi(exe, ortam, args):
    try:
        r = subprocess.run([exe, "agentapi"] + args, capture_output=True, text=True, encoding="utf-8",
                           errors="replace", timeout=120, env=ortam, creationflags=SESSIZ)
        return json.loads(r.stdout or "{}")
    except (OSError, ValueError, subprocess.SubprocessError) as e:
        return {"error": str(e)}


def agentapi(args):
    s = sunucu()
    if not s:
        raise SystemExit("Antigravity açık değil (language_server.exe bulunamadı). Antigravity'yi aç, sonra yeniden dene.")
    y = _agentapi(s[0], s[1], args)
    if y.get("error"):
        raise SystemExit("Antigravity yanıtı: " + y["error"][:300])
    return y.get("response") or {}


# ---------- worktree ----------

def git(*a, kok=KOK, kontrol=True):
    r = subprocess.run(["git", "-C", str(kok)] + list(a), capture_output=True, text=True,
                       encoding="utf-8", errors="replace", creationflags=SESSIZ)
    if kontrol and r.returncode:
        raise SystemExit("git %s: %s" % (" ".join(a), r.stderr.strip()[:300]))
    return r.stdout.strip()


def worktree_kur(yol, dal):
    if yol.exists():
        return
    if dal and git("rev-parse", "--verify", "--quiet", "refs/heads/" + dal, kontrol=False):
        git("worktree", "add", str(yol), dal)
    elif dal:
        git("worktree", "add", "-b", dal, str(yol), "main")
    else:
        git("worktree", "add", "--detach", str(yol), "main")
    for m in ("AYS", "SPI", "ESP"):                    # tarayici testleri Playwright'i ana kopyadan alir
        kaynak, hedef = KOK / m / "node_modules", yol / m / "node_modules"
        if kaynak.exists() and not hedef.exists():
            subprocess.run(["cmd", "/c", "mklink", "/J", str(hedef), str(kaynak)], capture_output=True, creationflags=SESSIZ)


# ---------- istemler ----------

def gorev_dosyasi(no):
    bul = sorted((KOK / GOREVLER).glob("%s-*.md" % no))
    if not bul:
        raise SystemExit("Görev bulunamadı: %s/%s-*.md" % (GOREVLER, no))
    return bul[0]


def gorev_bilgi(metin):
    dal = re.search(r"\*\*Dal:\*\*\s*`([^`]+)`", metin)
    efor = re.search(r"\*\*Efor:\*\*\s*([^\s<]+)", metin)
    return {"dal": dal.group(1) if dal else "", "efor": efor_cevir(efor.group(1)) if efor else None}


ALT = {"dusuk": {"alt": 0, "alt_model": "flash_lite"}, "orta": {"alt": 2, "alt_model": "flash_lite"},
       "yuksek": {"alt": 3, "alt_model": "flash"}}


def gorev_istemi(wt, dal, dosya, p, efor="orta", ek=""):
    return (
        "LifeOS deposunda bir görev yapacaksın; seni Claude Code başlattı ve izliyor.\n"
        "Çalışma klasörün: %(wt)s — yalnız bu klasörde çalış. C:\\Users\\ASUS\\LifeOs, "
        "C:\\Users\\ASUS\\LifeOs-ag ve C:\\Users\\ASUS\\LifeOS-Sistem açılmaz, değiştirilmez.\n"
        "Dalın hazır ve seçili: %(dal)s (main'den açıldı). Dal değiştirme, yeni dal açma, main'e merge ya da push etme.\n"
        "DİKKAT: komut kabuğun bu klasörde AÇILMAZ (varsayılanı C:\\Users\\ASUS\\LifeOs, orası yasak). Her komutu "
        "'cd %(wt)s; ' ile başlat; git komutundan önce 'git rev-parse --show-toplevel' çıktısı bu klasör olmalı.\n"
        "1. Önce %(wt)s\\AGENTS.md ve %(wt)s\\belgeler\\ekip\\gorevler\\README.md dosyalarını oku; kurallar sözleşmedir.\n"
        "2. Görevin: %(wt)s\\%(gorev)s. Yazanı yap, yazmayanı yapma; belirsizse tahmin etme, «Sonuç»a soru olarak yaz.\n"
        "3. Tarayıcı testlerinde README'deki portlar yerine YALNIZ şunlar: "
        "cd AYS && node tools/runtests.js %(AYS)d · cd SPI && node tools/runtests.js %(SPI)d · "
        "cd ESP && node tools/runtests.js %(ESP)d. Başka sunucu ya da port açma.\n"
        "4. Bitince görev dosyasında Durum: bitti yap, «Sonuç»u doldur; commit et "
        "(git -c user.name=OmerFaSa -c user.email=omerfaruksagsozz@gmail.com commit) ve git push -u origin %(dal)s.\n"
        "5. Takılırsan Durum: takıldı yap, nedenini «Sonuç»a yaz, yine commit ve push et.\n"
        "6. %(alt_satir)s\n"
        "7. Araçlar: yerleşik araçlar ve playwright MCP (yalnız kendi portlarında arayüzü görmek için). Diğer MCP'ler "
        "(hkm-sqlite kişisel veri; Notion, Linear, Netlify, Canva, Figma kullanıcının hesapları) ve ask_question bu işte kapalı; "
        "bir kanca bunları engeller ve cd'siz komutu klasörüne yönlendirir.\n"
        "8. Arka planda test başlattıysan bitmesini bekle; sonucu okumadan turu kapatma.\n"
        "9. Son mesajın kısa olsun: ne değişti, hangi test koştu, çıktı satırı."
        % dict(p, wt=wt, dal=dal, gorev=str(dosya.relative_to(KOK)).replace("/", "\\"), alt_satir=(
            "Alt ajan (invoke_subagent) yalnız bağımsız bir okuma ya da araştırma için ve en çok %(alt)d tane; "
            "Model %(alt_model)s, aynı klasör ve aynı kurallar. Dosyayı sen değiştirirsin, alt ajan değiştirmez. "
            "Commit'ten önce bir alt ajana (Model %(alt_model)s) 'git diff main' çıktısını AGENTS.md §1 ve görevin "
            "kabul ölçütüne göre gözden geçirt; bulduğunu düzelt ya da «Sonuç»a yaz."
            % ALT[efor] if ALT[efor]["alt"] else "Alt ajan açma; işi tek başına yap."))
        + ("\nEk not: " + ek if ek else ""))


def mini_istemi(wt, istem):
    return ("LifeOS deposunda kısa bir iş; seni Claude Code başlattı. Klasör: %s (main'in salt okunur kopyası).\n"
            "Komut kabuğun bu klasörde açılmaz: her komutu 'cd %s; ' ile başlat.\n"
            "Dosya değiştirme, commit etme, sunucu açma; yalnız oku, ara ve komutla incele. "
            "Cevabını kısa ve kanıtlı ver (dosya:satır).\n\nİş: %s" % (wt, wt, istem))


# ---------- komutlar ----------

def _secenek(argv, ad, varsayilan=None):
    if ad in argv:
        i = argv.index(ad)
        if i + 1 < len(argv):
            v = argv[i + 1]
            del argv[i:i + 2]
            return v
    return varsayilan


def baslat(no, efor=None, ek=""):
    dosya = gorev_dosyasi(no)
    bilgi = gorev_bilgi(dosya.read_text(encoding="utf-8"))
    efor = efor_cevir(efor) or bilgi["efor"] or "orta"
    d = oku_durum()
    if d.get(no, {}).get("acik"):
        raise SystemExit("%s zaten açık (konuşma %s). Mesaj için: ajan.py mesaj %s \"...\"" % (no, d[no]["konusma"], no))
    yuva = yuva_sec({k: v for k, v in d.items() if not k.startswith("_")})
    wt = AJAN_KLASOR / no
    worktree_kur(wt, bilgi["dal"])
    p = portlar(yuva)
    y = agentapi(["new-conversation", "--model=" + EFOR[efor], "--title=LifeOS " + dosya.stem,
                  gorev_istemi(str(wt), bilgi["dal"], dosya, p, efor, ek)])
    kimlik = (y.get("newConversation") or {}).get("conversationId")
    if not kimlik:
        raise SystemExit("Antigravity konuşma kimliği dönmedi: %r" % y)
    d = oku_durum()
    d[no] = {"tur": "gorev", "gorev": dosya.name, "dal": bilgi["dal"], "efor": efor, "model": EFOR[efor],
             "konusma": kimlik, "worktree": str(wt), "yuva": yuva, "portlar": p,
             "baslangic": int(time.time()), "acik": True, "mesajlar": 1}
    yaz_durum(d)
    print("%s başladı · efor %s (%s) · konuşma %s · klasör %s · portlar %s"
          % (no, EFOR_AD[efor], EFOR[efor], kimlik, wt, "/".join(map(str, p.values()))))


def mini(ad, istem, efor=None):
    if not re.fullmatch(r"[a-z0-9-]{2,30}", ad):
        raise SystemExit("Mini ajan adı küçük harf, rakam ve tire olmalı (2-30).")
    efor = efor_cevir(efor) or "dusuk"
    d = oku_durum()
    if d.get(ad, {}).get("acik"):
        raise SystemExit("%s zaten açık; mesaj gönder ya da kapat." % ad)
    wt = AJAN_KLASOR / ("m-" + ad)
    worktree_kur(wt, None)
    y = agentapi(["new-conversation", "--model=" + EFOR[efor], "--title=LifeOS mini " + ad, mini_istemi(str(wt), istem)])
    kimlik = (y.get("newConversation") or {}).get("conversationId")
    if not kimlik:
        raise SystemExit("Antigravity konuşma kimliği dönmedi: %r" % y)
    d = oku_durum()
    d[ad] = {"tur": "mini", "istem": istem[:400], "efor": efor, "model": EFOR[efor], "konusma": kimlik,
             "worktree": str(wt), "baslangic": int(time.time()), "acik": True, "mesajlar": 1}
    yaz_durum(d)
    print("mini %s başladı · efor %s (%s) · konuşma %s" % (ad, EFOR_AD[efor], EFOR[efor], kimlik))


def mesaj(ad, metin):
    d = oku_durum()
    a = d.get(ad)
    if not a:
        raise SystemExit("Böyle bir ajan yok: " + ad)
    agentapi(["send-message", a["konusma"], metin])
    a["mesajlar"] = a.get("mesajlar", 1) + 1
    yaz_durum(d)
    print("%s: mesaj gönderildi." % ad)


def kapat(ad, zorla=False):
    d = oku_durum()
    a = d.get(ad)
    if not a:
        raise SystemExit("Böyle bir ajan yok: " + ad)
    wt = Path(a["worktree"])
    if wt.exists():
        kirli = git("status", "--porcelain", kok=wt, kontrol=False)
        if kirli and not zorla and a["tur"] == "gorev":
            raise SystemExit("%s klasöründe kaydedilmemiş değişiklik var; bakmadan silmem (--zorla)." % wt)
        for m in ("AYS", "SPI", "ESP"):                # once baglantilar: remove hedefe inmesin
            j = wt / m / "node_modules"
            if j.exists():
                subprocess.run(["cmd", "/c", "rmdir", str(j)], capture_output=True, creationflags=SESSIZ)
        git("worktree", "remove", "--force", str(wt))
    a["acik"] = False
    a["kapanis"] = int(time.time())
    yaz_durum(d)
    print("%s kapandı; dal (varsa) duruyor." % ad)


def asama(a, k):
    """Ajanin hali tek kelimelik asamaya: calisiyor · inceleme · sorun · kapandi."""
    if not a.get("acik"):
        return "kapandı"
    if k.get("hal") in ("hata", "sessiz") or k.get("disari") and not kanca_kurulu():
        return "sorun"
    if k.get("hal") == "turu bitti":
        return "inceleme"
    return "çalışıyor"


def hepsi():
    """Takip penceresi ve 'durum' icin: her ajan + canli konusma ozeti."""
    d = oku_durum()
    out = []
    for ad, a in d.items():
        if ad.startswith("_"):
            continue
        k = konusma_oku(a["konusma"], wt=a["worktree"]) or {"hal": "başlıyor" if a.get("acik") else "kayıt yok"}
        o = olaylar(ad)
        k["kanca"] = {"yonlendirildi": sum(1 for x in o if x.get("karar") == "yönlendirildi"),
                      "engellendi": [x for x in o if x.get("karar") == "engellendi"][-5:],
                      "devam": sum(1 for x in o if x.get("olay") == "devam")}
        k["alt"] = alt_ajanlar(a["konusma"], a.get("baslangic", 0)) if a.get("acik") else []
        if a["tur"] == "gorev" and a.get("acik") and Path(a["worktree"]).exists():
            k["degisen"] = len((git("status", "--porcelain", kok=Path(a["worktree"]), kontrol=False) or "").splitlines())
            k["commit"] = int(git("rev-list", "--count", "main..HEAD", kok=Path(a["worktree"]), kontrol=False) or 0)
        out.append(dict(a, ad=ad, canli=k, asama=asama(a, k)))
    out.sort(key=lambda x: (not x.get("acik"), -x.get("baslangic", 0)))
    return out


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return
    k, argv = argv[0], argv[1:]
    efor = _secenek(argv, "--efor")
    ek = _secenek(argv, "--not", "")
    if k == "baslat" and argv:
        baslat(argv[0], efor, ek)
    elif k == "mini" and len(argv) >= 2:
        mini(argv[0], " ".join(argv[1:]), efor)
    elif k == "mesaj" and len(argv) >= 2:
        mesaj(argv[0], " ".join(argv[1:]))
    elif k == "kapat" and argv:
        kapat(argv[0], "--zorla" in argv)
    elif k == "kur":
        kur("--kaldir" in argv)
    elif k == "cevap" and argv:
        a = oku_durum().get(argv[0])
        k2 = a and konusma_oku(a["konusma"])
        print((k2 or {}).get("cevap") or "Henüz cevap yok.")
    elif k == "durum":
        h = hepsi()
        if "--json" in argv:
            print(json.dumps(h, ensure_ascii=False, indent=2))
            return
        for a in h:
            c = a["canli"]
            print("%-12s %-10s %-10s %-11s adım %-3s %s" % (
                a["ad"], a["asama"], a["model"], c.get("hal", ""), c.get("adim", "-"), c.get("simdi", "")))
        if not h:
            print("Kayıtlı ajan yok.")
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main(sys.argv[1:])
