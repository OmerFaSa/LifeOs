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

Efor modeli secer: dusuk -> flash_lite, orta -> flash, yuksek -> pro.
Gorev dosyasindaki «**Efor:**» satiri varsayilandir; --efor onu ezer.

Antigravity'nin yerel dil sunucusuna (language_server.exe agentapi) baglanir;
adres ve CSRF anahtari calisan surecin komut satirindan okunur, hicbir yere
yazilmaz ve ekrana basilmaz. Konusma kayitlari (~/.gemini/antigravity/
conversations/<id>.db) yalniz okunur.
"""
import json
import os
import re
import sqlite3
import subprocess
import sys
import time
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
GOREVLER = "belgeler/ekip/gorevler"
AJAN_KLASOR = Path(os.environ.get("LIFEOS_AJAN_KLASOR", Path.home() / "LifeOs-ajan"))
DURUM_DOSYA = AJAN_KLASOR / "ajanlar.json"
KONUSMALAR = Path(os.environ.get("LIFEOS_AG_KONUSMA", Path.home() / ".gemini/antigravity/conversations"))
EFOR = {"dusuk": "flash_lite", "orta": "flash", "yuksek": "pro"}
EFOR_AD = {"dusuk": "düşük", "orta": "orta", "yuksek": "yüksek"}
YUVA_SAY = 9                    # yuva n -> AYS 47n1, SPI 47n2, ESP 47n3 (kapsam.js 4601-4603'u kullanir)
SESSIZ = getattr(subprocess, "CREATE_NO_WINDOW", 0)
ADIM = {14: "istem", 15: "model", 132: "araç sonucu"}


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


# ---------- konusma kaydi (protobuf, semasiz) ----------

def _varint(b, i):
    n = s = 0
    while True:
        if i >= len(b):
            raise ValueError
        c = b[i]
        i += 1
        n |= (c & 0x7F) << s
        if c < 0x80:
            return n, i
        s += 7
        if s > 63:
            raise ValueError


def pb_metinler(b, derin=0):
    """Protobuf govdesindeki okunur metinleri sirayla dondurur (sema gerekmez)."""
    out, i = [], 0
    try:
        while i < len(b):
            k, i = _varint(b, i)
            tur = k & 7
            if tur == 0:
                _, i = _varint(b, i)
            elif tur == 1:
                i += 8
            elif tur == 5:
                i += 4
            elif tur == 2:
                n, i = _varint(b, i)
                p = b[i:i + n]
                if len(p) != n:
                    raise ValueError
                i += n
                try:                                   # alt mesajin etiket baytlari yazdirilamaz; metin once
                    t = p.decode("utf-8")
                    metin = bool(t) and all(c.isprintable() or c in "\n\t\r" for c in t)
                except UnicodeDecodeError:
                    metin = False
                if metin:
                    out.append(t)
                elif derin < 12:
                    out.extend(pb_metinler(p, derin + 1) or [])
            else:
                raise ValueError
    except ValueError:
        return None if derin else out
    return out


KIMLIK = re.compile(r"^[\s\"$:(]*(bot-)?[0-9a-f-]{20,}[\s\"]*$|^call_\d+$|^type\.googleapis\.com/")


def adim_ozet(tur, durum, govde):
    """Bir adimi okunur bir satira cevirir: tur, arac, ozet, metin."""
    m = [t for t in (pb_metinler(govde or b"") or []) if not KIMLIK.match(t)]
    o = {"tur": ADIM.get(tur, "adım %d" % tur), "durum": durum, "arac": "", "ozet": "", "metin": ""}
    for j, t in enumerate(m):
        if re.fullmatch(r"[a-z_]{3,40}", t) and j + 1 < len(m) and m[j + 1].lstrip().startswith("{"):
            o["arac"] = t
            try:
                a = json.loads(m[j + 1])
                o["ozet"] = str(a.get("toolSummary") or a.get("CommandLine") or a.get("Path") or a.get("AbsolutePath") or "")[:160]
            except ValueError:
                o["ozet"] = m[j + 1][:160]
            break
    if tur == 14:
        o["metin"] = max(m, key=len, default="")
    elif tur == 15 and not o["arac"]:
        aday = [t for t in m if not t.startswith(("{", "sessionID")) and " " in t]
        o["metin"] = max(aday, key=len, default="")
    elif tur == 132:
        aday = [t for t in m if not t.startswith(("file:///", "{")) and len(t) > 1]
        o["metin"] = "\n".join(aday)[:600]
    return o


def konusma_oku(kimlik, son=10):
    """Konusma kaydindan adimlar, son eylem ve cevap. Kayit yoksa None."""
    yol = KONUSMALAR / (kimlik + ".db")
    if not yol.exists():
        return None
    try:
        db = sqlite3.connect("file:%s?mode=ro" % yol.as_posix(), uri=True, timeout=2)
        try:
            satir = db.execute("select idx, step_type, status, has_subtrajectory, step_payload,"
                               " length(error_details) from steps order by idx").fetchall()
        finally:
            db.close()
    except sqlite3.Error as e:
        return {"hata": "kayıt okunamadı: %s" % e}
    adimlar = [dict(adim_ozet(t, s, p), idx=i, alt=bool(h), hatali=bool(e)) for i, t, s, h, p, e in satir]
    cevap = next((a["metin"] for a in reversed(adimlar) if a["tur"] == "model" and a["metin"]), "")
    araclar = {}
    for a in adimlar:
        if a["arac"] and a["tur"] == "model":
            araclar[a["arac"]] = araclar.get(a["arac"], 0) + 1
    son_adim = adimlar[-1] if adimlar else None
    tamam = bool(son_adim and son_adim["tur"] == "model" and not son_adim["arac"] and son_adim["durum"] == 3)
    degisti = yol.stat().st_mtime
    if not adimlar:
        hal = "başlıyor"
    elif any(a["hatali"] for a in adimlar[-2:]):
        hal = "hata"
    elif tamam:
        hal = "turu bitti"
    else:
        hal = "çalışıyor" if time.time() - degisti < 600 else "sessiz"
    return {"adim": len(adimlar), "hal": hal, "son_degisim": int(degisti), "cevap": cevap, "araclar": araclar,
            "son_adimlar": [{k: a[k] for k in ("idx", "tur", "arac", "ozet", "metin")} for a in adimlar[-son:]]}


def alt_ajanlar(kimlik, baslangic):
    """Ajanin invoke_subagent ile actigi alt konusmalar: ilk adimlari 'sender=<kimlik>' tasir."""
    out = []
    for yol in KONUSMALAR.glob("*.db"):
        try:
            if yol.stem == kimlik or yol.stat().st_mtime < baslangic:
                continue
            db = sqlite3.connect("file:%s?mode=ro" % yol.as_posix(), uri=True, timeout=1)
            try:
                ilk = db.execute("select step_payload from steps where idx = 0 and step_type = 101").fetchone()
            finally:
                db.close()
        except (OSError, sqlite3.Error):
            continue
        if ilk and ("sender=" + kimlik).encode() in (ilk[0] or b""):
            k = konusma_oku(yol.stem, son=3) or {}
            gorev = next((t for t in (pb_metinler(ilk[0]) or []) if t.startswith("[Message]")), "")
            out.append({"konusma": yol.stem, "hal": k.get("hal"), "adim": k.get("adim"),
                        "istem": gorev.split("content=", 1)[-1][:300], "cevap": (k.get("cevap") or "")[:600],
                        "son_degisim": k.get("son_degisim")})
    return sorted(out, key=lambda x: x.get("son_degisim") or 0)


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
        "1. Önce %(wt)s\\AGENTS.md ve %(wt)s\\belgeler\\ekip\\gorevler\\README.md dosyalarını oku; kurallar sözleşmedir.\n"
        "2. Görevin: %(wt)s\\%(gorev)s. Yazanı yap, yazmayanı yapma; belirsizse tahmin etme, «Sonuç»a soru olarak yaz.\n"
        "3. Tarayıcı testlerinde README'deki portlar yerine YALNIZ şunlar: "
        "cd AYS && node tools/runtests.js %(AYS)d · cd SPI && node tools/runtests.js %(SPI)d · "
        "cd ESP && node tools/runtests.js %(ESP)d. Başka sunucu ya da port açma.\n"
        "4. Bitince görev dosyasında Durum: bitti yap, «Sonuç»u doldur; commit et "
        "(git -c user.name=OmerFaSa -c user.email=omerfaruksagsozz@gmail.com commit) ve git push -u origin %(dal)s.\n"
        "5. Takılırsan Durum: takıldı yap, nedenini «Sonuç»a yaz, yine commit ve push et.\n"
        "6. %(alt_satir)s\n"
        "7. Son mesajın kısa olsun: ne değişti, hangi test koştu, çıktı satırı."
        % dict(p, wt=wt, dal=dal, gorev=str(dosya.relative_to(KOK)).replace("/", "\\"), alt_satir=(
            "Alt ajan (invoke_subagent) yalnız bağımsız bir okuma ya da araştırma için ve en çok %(alt)d tane; "
            "Model %(alt_model)s, aynı klasör ve aynı kurallar. Dosyayı sen değiştirirsin, alt ajan değiştirmez."
            % ALT[efor] if ALT[efor]["alt"] else "Alt ajan açma; işi tek başına yap."))
        + ("\nEk not: " + ek if ek else ""))


def mini_istemi(wt, istem):
    return ("LifeOS deposunda kısa bir iş; seni Claude Code başlattı. Klasör: %s (main'in salt okunur kopyası).\n"
            "Dosya değiştirme, commit etme, sunucu açma; yalnız oku, ara ve komutla incele. "
            "Cevabını kısa ve kanıtlı ver (dosya:satır).\n\nİş: %s" % (wt, istem))


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


def hepsi():
    """Takip penceresi ve 'durum' icin: her ajan + canli konusma ozeti."""
    d = oku_durum()
    out = []
    for ad, a in d.items():
        if ad.startswith("_"):
            continue
        k = konusma_oku(a["konusma"]) or {"hal": "kayıt yok"}
        k["alt"] = alt_ajanlar(a["konusma"], a.get("baslangic", 0)) if a.get("acik") else []
        if a["tur"] == "gorev" and a.get("acik") and Path(a["worktree"]).exists():
            k["degisen"] = len((git("status", "--porcelain", kok=Path(a["worktree"]), kontrol=False) or "").splitlines())
            k["commit"] = int(git("rev-list", "--count", "main..HEAD", kok=Path(a["worktree"]), kontrol=False) or 0)
        out.append(dict(a, ad=ad, canli=k))
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
            son = (c.get("son_adimlar") or [{}])[-1]
            print("%-12s %-6s %-10s %-11s adım %-3s %s" % (
                a["ad"], "açık" if a.get("acik") else "kapalı", a["model"], c.get("hal", ""),
                c.get("adim", "-"), (son.get("arac") and son["arac"] + ": " + son.get("ozet", "")) or son.get("tur", "")))
        if not h:
            print("Kayıtlı ajan yok.")
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main(sys.argv[1:])
