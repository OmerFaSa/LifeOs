#!/usr/bin/env python3
"""AJAN — Claude Code'un Antigravity ajanlarini baslatip izledigi arac.

Kullanici (2026-10-31): «antigravity'yi tam takir sen kullanacaksin, model
efor degistirip minik ajanlar ayarlayabileceksin». Her ajan Antigravity'de
ayri bir konusmadir; her biri KENDI worktree'sinde ve KENDI test portlarinda
calisir, iki ajan birbirinin dalini ya da sunucusunu bozmaz.

  python tools/ajan.py baslat 001 [--efor dusuk|orta|yuksek] [--not "..."] [--yeni]
  python tools/ajan.py sor "<soru>" [--efor ...] [--ad x]  Arastirmaci (salt okunur) cevaplar
  python tools/ajan.py gozden 001 [--efor ...]             Denetci dali inceler (kanca bitince kendisi ister)
  python tools/ajan.py mesaj <ad> "<metin>"                 konusmaya yeni mesaj
  python tools/ajan.py durum [--json]                       butun ajanlar
  python tools/ajan.py bekle [ad ...]                       isler (ve Denetci) hazir olana dek bekler (arka planda kos)
  python tools/ajan.py rapor <ad>                           inceleme paketi: Sonuc, Denetci, diff tek ciktida
  python tools/ajan.py cevap <ad>                           son cevabin tam metni
  python tools/ajan.py kapat <ad> [--zorla]                 worktree'yi kaldirir (dal kalir)
  python tools/ajan.py kur [--kaldir]                       Antigravity kancasini (hooks.json) kurar/kaldirir

Ofis: Uygulayici, Arastirmaci, Denetci rolleri. Bir rolun konusmasi bos, kisa ve bagli
oldugu surece sonraki is ayni konusmaya mesajla gider (--yeni zorla yenisini acar).
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
    for n in range(1, YUVA_SAY):                       # son yuva Denetci'nin
        if n not in dolu:
            return n
    raise SystemExit("Bütün yuvalar dolu (%d uygulayıcı açık); önce birini kapat." % (YUVA_SAY - 1))


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


def konusma_oku(kimlik, son=12, wt=None, bas=0, bit=None):
    """Konusma dokumunden hal, adimlar, son cevap, token. Dokum yoksa None.
    bas/bit: ayni konusmada birden cok is varsa yalniz bu isin adimlari [bas, bit).
    wt verilirse o klasorun disinda calisan komut ve yazilan dosyalar 'disari'da listelenir."""
    yol = dokum_yolu(kimlik)
    satir = _satirlar(yol)
    if satir is None:
        return None
    hepsi_ = [adim_ozet(x) for x in satir]
    adimlar = [a for a in hepsi_ if (a["idx"] or 0) >= bas and (bit is None or (a["idx"] or 0) < bit)]
    cevap = next((a["metin"] for a in reversed(adimlar) if a["tur"] == "model" and a["metin"] and not a["arac"]), "")
    araclar = {}
    for a in adimlar:
        for n in a["araclar"]:
            araclar[n] = araclar.get(n, 0) + 1
    degisti = yol.stat().st_mtime
    son_adim = adimlar[-1] if adimlar else None
    if bit is not None:
        hal = "turu bitti"                                 # konusma sonraki ise gecti
    elif not adimlar:
        hal = "başlıyor"
    elif son_adim["tur"] == "hata" or son_adim["durum"] == "ERROR" and time.time() - degisti > 120:
        hal = "hata"                                       # arac hatasi olagandir; ajan iki dakikada tepki vermezse hata
    elif son_adim["tur"] == "model" and not son_adim["arac"] and son_adim["durum"] == "DONE":
        hal = "turu bitti"
    elif son_adim["durum"] == "RUNNING" or time.time() - degisti < 600:
        hal = "çalışıyor"
    else:
        hal = "sessiz"
    simdi = next((a["cumle"] for a in reversed(adimlar) if a["cumle"]), "")
    disari = [dict(idx=a["idx"], tur=d[0], metin=d[1]) for a in adimlar if a["tur"] == "model" and wt
              for d in [klasor_disi(a, wt)] if d]
    model_adim = [a for a in hepsi_ if a["tur"] == "model"]
    return {"adim": len(adimlar), "hal": hal, "son_degisim": int(degisti), "cevap": cevap, "araclar": araclar,
            "simdi": simdi, "disari": disari, "toplam_adim": len(hepsi_),
            "token": {k: sum(a[k] for a in adimlar) for k in ("giris", "cikis", "onbellek")},
            "baglam": (model_adim[-1]["giris"] + model_adim[-1]["onbellek"]) if model_adim else 0,
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


# ---------- ofis: roller ve konusma yeniden kullanimi ----------
# Kullanici (2026-10-31): «surekli yeni sohbet acma, bir sohbet icinde de kalabilirsin; hangisi
# verimliyse; Antigravity'yi senin icin calisan bir ofis gibi yonet; kaliteden odun yok».
# Her rol bir konusmadir; bos, kisa (MAX_IS) ve bagli (BAGLAM_SINIR) olduğu surece sonraki is
# ayni konusmaya mesajla gider: AGENTS.md'yi yeniden okumaz, onbellek isler. Sinir asilinca yenisi.

ROL = {"gorev": "uygulayici", "mini": "arastirmaci", "soru": "arastirmaci", "denetim": "denetci"}
ROL_AD = {"uygulayici": "Uygulayıcı", "arastirmaci": "Araştırmacı", "denetci": "Denetçi"}
OKUR = ("mini", "soru", "denetim")                 # salt okunur isler (kanca yazmayi reddeder)
MAX_IS = 3
BAGLAM_SINIR = 200_000                              # uzun baglam kaliteyi dusurur; onbellek ucuzlatir ama sinirsiz degil
DENETCI_YUVA = YUVA_SAY                             # denetci testleri hep son yuvada kosar
OFIS = {"arastirmaci": "ofis-arastirma", "denetci": "ofis-denetim"}


def rol(a):
    return ROL.get(a.get("tur"), "uygulayici")


def _isler(d):
    return {k: v for k, v in d.items() if not k.startswith("_")}


def devam_edilebilir(d, rol_, model):
    """Bu rol ve modelde yeni isi alabilecek konusma: (kimlik, baslangic_adimi) ya da None."""
    gruplar = {}
    for a in _isler(d).values():
        if rol(a) == rol_ and a.get("model") == model and a.get("konusma"):
            gruplar.setdefault(a["konusma"], []).append(a)
    for kimlik, isler in sorted(gruplar.items(), key=lambda g: -max(x.get("baslangic", 0) for x in g[1])):
        if len(isler) >= MAX_IS:
            continue
        k = konusma_oku(kimlik, son=1)
        if k and k["hal"] == "turu bitti" and k["baglam"] < BAGLAM_SINIR:
            return kimlik, k["toplam_adim"]
    return None


def gonder(d, rol_, model, baslik, ilk, devam, yeni=False):
    """Isi uygun konusmaya mesajla verir ya da yeni konusma acar: (kimlik, bas, yeni_mi)."""
    s = None if yeni else devam_edilebilir(d, rol_, model)
    if s:
        agentapi(["send-message", s[0], devam])
        return s[0], s[1], False
    y = agentapi(["new-conversation", "--model=" + model, "--title=" + baslik, ilk])
    kimlik = (y.get("newConversation") or {}).get("conversationId")
    if not kimlik:
        raise SystemExit("Antigravity konuşma kimliği dönmedi: %r" % y)
    return kimlik, 0, True


def _ayni_konusmayi_kapat(d, kimlik, haric):
    """Ayni konusmadaki onceki salt okunur isler bitmistir; yeni soru gelince kapanir."""
    for ad, a in _isler(d).items():
        if ad != haric and a.get("konusma") == kimlik and a.get("tur") in OKUR and a.get("acik"):
            a["acik"], a["kapanis"] = False, int(time.time())


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
KABUK = ("DİKKAT: komut kabuğun bu klasörde AÇILMAZ (varsayılanı C:\\Users\\ASUS\\LifeOs, orası yasak). Her komutu "
         "'cd %s; ' ile başlat. Bir kanca cd'siz komutu klasörüne yönlendirir, yasak yolu ve aracı engeller.\n")
ARACLAR = ("Araçlar: yerleşik araçlar ve playwright MCP (yalnız kendi portlarında arayüzü görmek için). Diğer MCP'ler "
           "(hkm-sqlite kişisel veri; Notion, Linear, Netlify, Canva, Figma kullanıcının hesapları) ve ask_question kapalı.\n")


def _gorev_govde(wt, dal, dosya, p, efor, ek):
    return (
        "Görevin: %(wt)s\\%(gorev)s. Yazanı yap, yazmayanı yapma; belirsizse tahmin etme, «Sonuç»a soru olarak yaz.\n"
        "Dalın hazır ve seçili: %(dal)s (main'den açıldı). Dal değiştirme, main'e merge ya da push etme.\n"
        "Tarayıcı testlerinde YALNIZ şu portlar: cd AYS && node tools/runtests.js %(AYS)d · "
        "cd SPI && node tools/runtests.js %(SPI)d · cd ESP && node tools/runtests.js %(ESP)d.\n"
        "Arka planda test başlattıysan bitmesini bekle; sonucu okumadan turu kapatma.\n"
        "Bitince görev dosyasında Durum: bitti yap, «Sonuç»u doldur; commit et "
        "(git -c user.name=OmerFaSa -c user.email=omerfaruksagsozz@gmail.com commit) ve git push -u origin %(dal)s. "
        "Takılırsan Durum: takıldı yap, nedenini yaz, yine commit ve push et. İşin bitince ofisin Denetçisi dalını inceler.\n"
        "%(alt_satir)s\n"
        "Son mesajın kısa olsun: ne değişti, hangi test koştu, çıktı satırı."
        % dict(p, wt=wt, dal=dal, gorev=str(dosya.relative_to(KOK)).replace("/", "\\"), alt_satir=(
            "Alt ajan (invoke_subagent) yalnız bağımsız bir okuma ya da araştırma için ve en çok %(alt)d tane; "
            "Model %(alt_model)s, aynı klasör ve aynı kurallar; dosyayı yalnız sen değiştirirsin." % ALT[efor]
            if ALT[efor]["alt"] else "Alt ajan açma; işi tek başına yap."))
        + ("\nEk not: " + ek if ek else ""))


def gorev_istemi(wt, dal, dosya, p, efor="orta", ek=""):
    return ("Sen LifeOS ofisinin Uygulayıcısısın; Claude Code sana görev verir ve işini izler.\n"
            "Çalışma klasörün: %s — yalnız bu klasörde çalış. C:\\Users\\ASUS\\LifeOs, "
            "C:\\Users\\ASUS\\LifeOs-ag ve C:\\Users\\ASUS\\LifeOS-Sistem açılmaz, değiştirilmez.\n" % wt
            + KABUK % wt + ARACLAR
            + "Önce %s\\AGENTS.md ve %s\\belgeler\\ekip\\gorevler\\README.md dosyalarını oku; kurallar sözleşmedir.\n" % (wt, wt)
            + _gorev_govde(wt, dal, dosya, p, efor, ek))


def gorev_devam_istemi(wt, dal, dosya, p, efor="orta", ek=""):
    return ("Yeni görev; önceki işin kapandı, kurallar aynı (AGENTS.md'yi yeniden okumana gerek yok).\n"
            "Çalışma klasörün ARTIK: %s — önceki klasöre dokunma.\n" % wt + KABUK % wt
            + _gorev_govde(wt, dal, dosya, p, efor, ek))


def soru_istemi(wt, soru):
    return ("Sen LifeOS ofisinin Araştırmacısısın. Claude Code sana sorular gönderir; her soru ayrı mesajla gelir.\n"
            "Klasör: %s (main'in salt okunur kopyası; her sorudan önce main'e güncellenir).\n" % wt
            + KABUK % wt + ARACLAR
            + "Dosya değiştirme, commit etme, sunucu açma; oku, ara, komutla incele. Cevabın kısa ve kanıtlı olsun "
              "(dosya:satır). Emin değilsen «göremedim» yaz, «yok» yazma (AGENTS.md §4).\n\nSoru: " + soru)


def soru_devam_istemi(wt, soru):
    return "Yeni soru (klasör %s main'e güncellendi; kurallar aynı):\n%s" % (wt, soru)


def denetim_govde(wt, hedef, dal, dosya):
    return ("İnceleme: görev %s, dal %s. Klasör %s bu dala hazırlandı (salt okunur).\n"
            "Bak: 'cd %s; git diff main...HEAD' ve görev dosyası %s\\%s (kabul ölçütü, Sonuç).\n"
            "Ölç: kabul ölçütü karşılanıyor mu; AGENTS.md §1 kırılıyor mu; yeni davranışın testi var mı; ekranda "
            "görünen metin düzgün Türkçe mi; dokunulmaması gereken dosyaya dokunulmuş mu. Gerekirse görevdeki testleri koş "
            "(portlar: AYS %d, SPİ %d, ESP %d).\n"
            "Cevap biçimi: ilk satır tam olarak 'KARAR: temiz' ya da 'KARAR: N bulgu'. Sonra her bulgu bir satır: "
            "dosya:satır · ne yanlış · hangi girdide bozulur · nasıl doğrulanır. «Şu daha iyi olurdu» bulgu değildir; "
            "emin değilsen «göremedim» yaz."
            % ((hedef, dal, wt, wt, wt, str(dosya.relative_to(KOK)).replace("/", "\\")) + tuple(portlar(DENETCI_YUVA).values())))


def denetim_istemi(wt, hedef, dal, dosya):
    return ("Sen LifeOS ofisinin Denetçisisin: Uygulayıcıların dallarını Claude Code'dan önce incelersin; dosya "
            "değiştirmez, commit etmezsin. Önce %s\\AGENTS.md'yi oku (§1 sözleşme, §4 bulgu biçimi).\n" % wt
            + KABUK % wt + ARACLAR + denetim_govde(wt, hedef, dal, dosya))


def karar_oku(metin):
    """Denetci cevabinin ilk KARAR satiri: ('temiz', 0) / ('bulgu', n) / None."""
    m = re.search(r"KARAR:\s*(temiz|(\d+)\s*bulgu)", metin or "", re.I)
    if not m:
        return None
    return ("temiz", 0) if m.group(1).lower() == "temiz" else ("bulgu", int(m.group(2)))


# ---------- komutlar ----------

def _secenek(argv, ad, varsayilan=None):
    if ad in argv:
        i = argv.index(ad)
        if i + 1 < len(argv):
            v = argv[i + 1]
            del argv[i:i + 2]
            return v
    return varsayilan


def baslat(no, efor=None, ek="", yeni=False):
    dosya = gorev_dosyasi(no)
    bilgi = gorev_bilgi(dosya.read_text(encoding="utf-8"))
    efor = efor_cevir(efor) or bilgi["efor"] or "orta"
    d = oku_durum()
    if d.get(no, {}).get("acik"):
        raise SystemExit("%s zaten açık (konuşma %s). Mesaj için: ajan.py mesaj %s \"...\"" % (no, d[no]["konusma"], no))
    yuva = yuva_sec({k: v for k, v in _isler(d).items() if v.get("tur") == "gorev"})
    wt = AJAN_KLASOR / no
    worktree_kur(wt, bilgi["dal"])
    p = portlar(yuva)
    args = (str(wt), bilgi["dal"], dosya, p, efor, ek)
    kimlik, bas, yeni_mi = gonder(d, "uygulayici", EFOR[efor], "LifeOS Uygulayıcı " + EFOR[efor],
                                  gorev_istemi(*args), gorev_devam_istemi(*args), yeni)
    d = oku_durum()
    d[no] = {"tur": "gorev", "gorev": dosya.name, "dal": bilgi["dal"], "efor": efor, "model": EFOR[efor],
             "konusma": kimlik, "adim_bas": bas, "worktree": str(wt), "yuva": yuva, "portlar": p,
             "baslangic": int(time.time()), "etkin": time.time(), "acik": True, "mesajlar": 1}
    yaz_durum(d)
    print("%s başladı · %s · efor %s (%s) · %s · klasör %s · portlar %s"
          % (no, "yeni konuşma" if yeni_mi else "aynı konuşmada devam", EFOR_AD[efor], EFOR[efor], kimlik, wt,
             "/".join(map(str, p.values()))))


def _ofis_klasoru(rol_, hedef):
    """Arastirmaci ve denetcinin kalici salt okunur klasoru; her iste hedefe (main ya da dal) ayrik."""
    wt = AJAN_KLASOR / OFIS[rol_]
    worktree_kur(wt, None)
    if git("status", "--porcelain", kok=wt, kontrol=False):
        raise SystemExit("%s klasöründe değişiklik var (salt okunur olmalıydı); elle bak." % wt)
    git("checkout", "-q", "--detach", hedef, kok=wt)
    return wt


def sor(soru, efor=None, ad=None, yeni=False):
    efor = efor_cevir(efor) or "dusuk"
    d = oku_durum()
    if ad is None:
        ad = "s-%d" % (1 + sum(1 for a in _isler(d).values() if a.get("tur") in ("soru", "mini")))
    if not re.fullmatch(r"[a-z0-9-]{2,30}", ad):
        raise SystemExit("Ad küçük harf, rakam ve tire olmalı (2-30).")
    if d.get(ad, {}).get("acik"):
        raise SystemExit("%s zaten açık." % ad)
    wt = _ofis_klasoru("arastirmaci", "main")
    kimlik, bas, yeni_mi = gonder(d, "arastirmaci", EFOR[efor], "LifeOS Araştırmacı " + EFOR[efor],
                                  soru_istemi(str(wt), soru), soru_devam_istemi(str(wt), soru), yeni)
    d = oku_durum()
    _ayni_konusmayi_kapat(d, kimlik, ad)
    d[ad] = {"tur": "soru", "istem": soru[:400], "efor": efor, "model": EFOR[efor], "konusma": kimlik,
             "adim_bas": bas, "worktree": str(wt), "baslangic": int(time.time()), "etkin": time.time(),
             "acik": True, "mesajlar": 1}
    yaz_durum(d)
    print("soru %s · %s · %s (%s)" % (ad, "yeni konuşma" if yeni_mi else "aynı konuşmada", EFOR_AD[efor], EFOR[efor]))


def gozden(no, efor=None, yeni=False):
    """Denetci: uygulayicinin dalini Claude Code'dan once inceler (KARAR + bulgu satirlari)."""
    d = oku_durum()
    a = d.get(no)
    if not a or a.get("tur") != "gorev":
        raise SystemExit("Böyle bir görev ajanı yok: %s" % no)
    efor = efor_cevir(efor) or ("yuksek" if a.get("efor") == "yuksek" else "orta")
    wt = _ofis_klasoru("denetci", a["dal"])
    dosya = gorev_dosyasi(no)
    kimlik, bas, yeni_mi = gonder(d, "denetci", EFOR[efor], "LifeOS Denetçi " + EFOR[efor],
                                  denetim_istemi(str(wt), no, a["dal"], dosya),
                                  denetim_govde(str(wt), no, a["dal"], dosya), yeni)
    ad = "d-" + no
    d = oku_durum()
    _ayni_konusmayi_kapat(d, kimlik, ad)
    d[ad] = {"tur": "denetim", "hedef": no, "dal": a["dal"], "efor": efor, "model": EFOR[efor], "konusma": kimlik,
             "adim_bas": bas, "worktree": str(wt), "baslangic": int(time.time()), "etkin": time.time(),
             "acik": True, "mesajlar": 1, "commit": git("rev-parse", "--short", a["dal"], kontrol=False)}
    d[no]["denetim"] = ad
    yaz_durum(d)
    print("denetim %s · %s · %s (%s)" % (ad, "yeni konuşma" if yeni_mi else "aynı konuşmada", EFOR_AD[efor], EFOR[efor]))


def mesaj(ad, metin):
    d = oku_durum()
    a = d.get(ad)
    if not a:
        raise SystemExit("Böyle bir ajan yok: " + ad)
    sonraki = [x for k, x in _isler(d).items() if k != ad and x.get("konusma") == a["konusma"]
               and x.get("adim_bas", 0) > a.get("adim_bas", 0)]
    if sonraki:
        k = konusma_oku(a["konusma"], son=1) or {}
        if k.get("hal") != "turu bitti":
            raise SystemExit("Bu konuşma şu an başka bir işte çalışıyor; bitince gönder.")
    agentapi(["send-message", a["konusma"], metin])
    a["mesajlar"] = a.get("mesajlar", 1) + 1
    a["etkin"] = time.time()
    yaz_durum(d)
    print("%s: mesaj gönderildi." % ad)


def kapat(ad, zorla=False):
    d = oku_durum()
    a = d.get(ad)
    if not a:
        raise SystemExit("Böyle bir ajan yok: " + ad)
    wt = Path(a["worktree"])
    paylasilan = wt.name in OFIS.values() or any(
        k != ad and x.get("acik") and x.get("worktree") == a["worktree"] for k, x in _isler(d).items())
    if wt.exists() and not paylasilan:
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
    if a.get("denetim") in d and d[a["denetim"]].get("acik"):
        d[a["denetim"]].update(acik=False, kapanis=int(time.time()))
    yaz_durum(d)
    print("%s kapandı; dal (varsa) duruyor." % ad)


def asama(a, k):
    """Isin hali tek kelimelik asamaya: calisiyor · inceleme · sorun · kapandi."""
    if not a.get("acik"):
        return "kapandı"
    if k.get("hal") in ("hata", "sessiz") or k.get("disari") and not kanca_kurulu():
        return "sorun"
    if k.get("hal") == "turu bitti":
        return "inceleme"
    return "çalışıyor"


def hepsi():
    """Takip penceresi ve 'durum' icin: her is + canli konusma ozeti (ayni konusmadaki isler adim araligiyla ayrilir)."""
    d = oku_durum()
    isler = _isler(d)
    out = []
    for ad, a in isler.items():
        bas = a.get("adim_bas", 0)
        sonraki = [x.get("adim_bas", 0) for k, x in isler.items() if k != ad and x.get("konusma") == a.get("konusma")
                   and x.get("adim_bas", 0) > bas]
        k = konusma_oku(a["konusma"], wt=a["worktree"], bas=bas, bit=min(sonraki) if sonraki else None) \
            or {"hal": "başlıyor" if a.get("acik") else "kayıt yok"}
        o = olaylar(ad)
        k["kanca"] = {"yonlendirildi": sum(1 for x in o if x.get("karar") == "yönlendirildi"),
                      "engellendi": [x for x in o if x.get("karar") == "engellendi"][-5:],
                      "devam": sum(1 for x in o if x.get("olay") == "devam")}
        k["alt"] = alt_ajanlar(a["konusma"], a.get("baslangic", 0)) if a.get("acik") and a.get("tur") == "gorev" else []
        if a["tur"] == "gorev" and a.get("acik") and Path(a["worktree"]).exists():
            k["degisen"] = len((git("status", "--porcelain", kok=Path(a["worktree"]), kontrol=False) or "").splitlines())
            k["commit"] = int(git("rev-list", "--count", "main..HEAD", kok=Path(a["worktree"]), kontrol=False) or 0)
        if a.get("tur") == "denetim":
            k["karar"] = karar_oku(k.get("cevap"))
        out.append(dict(a, ad=ad, rol=rol(a), canli=k, asama=asama(a, k)))
    ada = {x["ad"]: x for x in out}
    for x in out:                                     # gorev kartina denetcinin karari
        dn = ada.get(x.get("denetim") or "")
        if dn:
            x["denetci"] = {"ad": dn["ad"], "asama": dn["asama"], "karar": dn["canli"].get("karar"),
                            "cevap": dn["canli"].get("cevap", ""), "commit": dn.get("commit")}
    out.sort(key=lambda x: (not x.get("acik"), -x.get("baslangic", 0)))
    return out


def uyeler(isler, simdi=None):
    """Ofis uyeleri: her konusma bir uye (rol, model, isler, bagluk). Acik isi olmayanlardan her rol ve
    modelde yalniz en sonuncusu (sonraki isi alacak olan) gosterilir; 12 saattir sessiz olan hic."""
    simdi = simdi or time.time()
    g = {}
    for x in isler:
        g.setdefault(x["konusma"], []).append(x)
    out = []
    for kimlik, l in g.items():
        l.sort(key=lambda x: x.get("adim_bas", 0))
        son = l[-1]
        c = son.get("canli") or {}
        acik = [x["ad"] for x in l if x.get("acik")]
        sessiz = simdi - max(x.get("canli", {}).get("son_degisim") or x.get("baslangic", 0) for x in l)
        if not acik and sessiz > 12 * 3600:
            continue
        out.append({"_son": max(x.get("baslangic", 0) for x in l), "konusma": kimlik, "rol": son["rol"], "rol_ad": ROL_AD[son["rol"]], "model": son.get("model"),
                    "efor": son.get("efor"), "hal": c.get("hal"), "simdi": c.get("simdi", ""), "is": son["ad"],
                    "isler": [x["ad"] for x in l], "acik": acik, "baglam": c.get("baglam", 0), "sinir": BAGLAM_SINIR,
                    "max_is": MAX_IS, "token": {k: sum((x.get("canli", {}).get("token") or {}).get(k, 0) for x in l)
                                                for k in ("giris", "cikis", "onbellek")}})
    out.sort(key=lambda u: -u["_son"])
    gorulen, secilen = set(), []
    for u in out:
        anahtar = (u["rol"], u["model"])
        if u["acik"] or anahtar not in gorulen:
            secilen.append(u)
        gorulen.add(anahtar)
    sira = {"uygulayici": 0, "denetci": 1, "arastirmaci": 2}
    for u in secilen:
        u.pop("_son")
    return sorted(secilen, key=lambda u: (sira[u["rol"]], u["hal"] != "çalışıyor", u["model"]))


# ---------- tasarruf: tek cagrida bekle, tek cagrida incele ----------
# Claude Code'un maliyeti «cagri sayisi x baglam». Yoklama turu ve parca parca inceleme
# en pahali kisim: bekle bir arka plan komutudur (bitince tek bildirim), rapor incelemenin
# ihtiyac duydugu her seyi tek ciktida verir.

def hazir_mi(x, ada, simdi=None):
    """Is Claude Code'un incelemesine hazir mi: (hazir, neden). Gorevde Denetci de beklenir."""
    simdi = simdi or time.time()
    if x.get("asama") in ("sorun", "kapandı"):
        return True, x.get("asama")
    if x.get("asama") != "inceleme":
        return False, "çalışıyor"
    if x.get("tur") != "gorev":
        return True, "cevap hazır"
    dn = ada.get(x.get("denetim") or "")
    if dn:
        return (dn.get("asama") != "çalışıyor"), "denetçi " + ("bitti" if dn.get("asama") != "çalışıyor" else "inceliyor")
    son = (x.get("canli") or {}).get("son_degisim") or 0
    if x.get("denetim") == "istendi" or simdi - son < 180:     # kanca Denetci'yi birkac saniyede acar
        return False, "denetçi bekleniyor"
    return True, "denetçi yok (görev bitti değil ya da push edilmedi)"


def bekle(adlar, azami=3600, aralik=15):
    """Verilen isler (bos: butun acik isler) hazir olana kadar bekler, sonra kisa ozet basar."""
    bas = time.time()
    while True:
        h = hepsi()
        ada = {x["ad"]: x for x in h}
        hedef = [ada[a] for a in adlar if a in ada] if adlar else [x for x in h if x.get("acik") and x.get("tur") != "denetim"]
        durum = [(x, hazir_mi(x, ada)) for x in hedef]
        if all(d[0] for _, d in durum) or time.time() - bas > azami:
            break
        time.sleep(aralik)
    for x, (hazir, neden) in durum:
        print("%-8s %-10s %s" % (x["ad"], "HAZIR" if hazir else "BEKLİYOR", neden))
    print("Sonraki adım: python tools/ajan.py rapor <ad>")


def rapor(ad, satir_siniri=250):
    """Inceleme paketi tek ciktida: Sonuc, Denetci karari ve bulgulari, diff ozeti, kucukse diff."""
    h = {x["ad"]: x for x in hepsi()}
    x = h.get(ad)
    if not x:
        raise SystemExit("Böyle bir iş yok: " + ad)
    c = x.get("canli") or {}
    if x.get("tur") != "gorev":
        print(c.get("cevap") or "Henüz cevap yok.")
        return
    dal = x["dal"]
    print("== %s · %s · %s · %d adım · token %d bin/%d bin" % (ad, x["asama"], x.get("model"), c.get("adim") or 0,
          (c.get("token") or {}).get("giris", 0) // 1000, (c.get("token") or {}).get("cikis", 0) // 1000))
    dn = h.get(x.get("denetim") or "")
    if dn:
        print("== Denetçi (%s): %s" % (dn.get("model"), (dn["canli"].get("cevap") or "cevap yok").strip()[:3000]))
    else:
        print("== Denetçi: yok")
    gorev = git("show", "%s:%s/%s" % (dal, GOREVLER, x["gorev"]), kontrol=False) or ""
    print("== Sonuç:\n" + (gorev.split("## Sonuç", 1)[-1].strip()[:2000] if "## Sonuç" in gorev else "(yok)"))
    print("== Diff özeti (main...%s):\n%s" % (dal, git("diff", "--stat", "main..." + dal, kontrol=False)))
    fark = git("diff", "main..." + dal, kontrol=False) or ""
    n = fark.count("\n")
    print(fark if n <= satir_siniri else "== Diff %d satır; tamamı için: git diff main...%s" % (n, dal))


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return
    k, argv = argv[0], argv[1:]
    efor = _secenek(argv, "--efor")
    ek = _secenek(argv, "--not", "")
    ad = _secenek(argv, "--ad")
    yeni = "--yeni" in argv
    argv = [x for x in argv if x != "--yeni"]
    if k == "baslat" and argv:
        baslat(argv[0], efor, ek, yeni)
    elif k == "sor" and argv:
        sor(" ".join(argv), efor, ad, yeni)
    elif k == "mini" and len(argv) >= 2:                # eski ad: sor --ad <ad>
        sor(" ".join(argv[1:]), efor, argv[0], yeni)
    elif k == "gozden" and argv:
        gozden(argv[0], efor, yeni)
    elif k == "mesaj" and len(argv) >= 2:
        mesaj(argv[0], " ".join(argv[1:]))
    elif k == "kapat" and argv:
        kapat(argv[0], "--zorla" in argv)
    elif k == "kur":
        kur("--kaldir" in argv)
    elif k == "bekle":
        bekle(argv)
    elif k == "rapor" and argv:
        rapor(argv[0])
    elif k == "cevap" and argv:
        h = {x["ad"]: x for x in hepsi()}
        print((h.get(argv[0]) or {}).get("canli", {}).get("cevap") or "Henüz cevap yok.")
    elif k == "durum":
        h = hepsi()
        if "--json" in argv:
            print(json.dumps(h, ensure_ascii=False, indent=2))
            return
        for u in uyeler(h):
            print("%-12s %-10s %-11s bağlam %3d bin  iş %s  %s" % (
                u["rol_ad"], u["model"], u["hal"] or "", u["baglam"] // 1000, ",".join(u["isler"]), u["simdi"]))
        for a in h:
            if a.get("acik"):
                c = a["canli"]
                print("  %-10s %-10s %-11s adım %-3s %s" % (a["ad"], a["asama"], c.get("hal", ""), c.get("adim", "-"), c.get("simdi", "")))
        if not h:
            print("Kayıtlı ajan yok.")
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main(sys.argv[1:])
