#!/usr/bin/env python3
"""AJAN KANCASI — Antigravity hook'u: Claude Code'un ajanlarini klasorlerine ve izinli araclara baglar.

Kullanici (2026-10-31): «antigravity'nin icindeki MCP'leri, ozellikleri profesyonelce kullan».
Ilk kosuda flash_lite ajan cd'siz komutlarla butun isi ana klasorde yapti; istemdeki uyari
modele birakilmis bir sozdu. Bu kanca sozu koda cevirir. `python tools/ajan.py kur` onu
~/.gemini/config/hooks.json'a «lifeos-ajan» adiyla yazar (kullanicinin onayiyla).

Yalniz ajanlar.json'daki konusmalara (ve onlarin alt ajanlarina) dokunur; kullanicinin
kendi Antigravity konusmalarina bos cevap ({}) doner, davranislarini degistirmez.

  PreToolUse  komut ajanin klasorunde degilse basina Set-Location eklenir; ana klasore,
              calisan kopyaya, main'e dokunan git komutu ve klasor disina yazma reddedilir;
              MCP'lerden yalniz playwright acik (hkm-sqlite kisisel veri, Notion/Linear/
              Netlify/Canva/Figma kullanicinin hesaplari); ask_question kapali.
  Stop        arka planda is surerken ya da gorev dosyasi «bitti/takildi» olmadan, degisiklik
              commit/push edilmeden durmak yerine devam ettirir (en cok 3 kez).
Her karar LifeOs-ajan/olay/<ad>.jsonl'e yazilir; Gorev Takibi oradan okur.
"""
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ajan as A  # noqa: E402

IZINLI_MCP = ("playwright",)
KAPALI_ARAC = {"ask_question": "Soru sorma; belirsiz yeri görev dosyasının «Sonuç» bölümüne yaz.",
               "search_marketplace": "Eklenti arama bu işte kapalı.",
               "list_plugin_accounts": "Kullanıcının hesapları bu işte kapalı."}
YAZAN = re.compile(r"write|edit|replace|delete|move", re.I)
YASAK_YOL = re.compile(r"c:[\\/]+users[\\/]+asus[\\/]+(lifeos([\\/]|['\"\s;]|$)|lifeos-sistem|lifeos-ag([\\/]|['\"\s;]|$))", re.I)
YASAK_GIT = [
    (re.compile(r"\bgit\b.*\bpush\b.*\b(main|master)\b", re.I), "main'e push yok; yalnız kendi dalını push et."),
    (re.compile(r"\bgit\b.*\bpush\b.*(--force|-f\b)", re.I), "Zorla push yok."),
    (re.compile(r"\bgit\b.*\b(merge|rebase)\b", re.I), "Birleştirme Claude Code'da; merge ve rebase yok."),
    (re.compile(r"\bgit\b.*\b(switch|checkout)\b\s+(-[bBc]\s+)?(?!--\s)(?!\.)\S", re.I), "Dal değiştirme yok; dalın hazır."),
    (re.compile(r"\bgit\b.*\breset\b.*--hard", re.I), "reset --hard yok."),
    (re.compile(r"\bgit\b.*\bworktree\b", re.I), "Worktree'leri Claude Code yönetir."),
]
STOP_SINIR = 3


def arg(a, k):
    """Antigravity arac argumanlari bazen JSON-kodlu metin olarak gelir ("\"x\"")."""
    v = a.get(k)
    if isinstance(v, str) and v[:1] == '"':
        try:
            return json.loads(v)
        except ValueError:
            pass
    return v


def ajan_bul(kimlik):
    """(ad, kayit) — konusma ya da onun alt ajani bizimse; degilse None."""
    if not kimlik:
        return None
    d = A.oku_durum()
    for ad, a in d.items():
        if not ad.startswith("_") and a.get("acik") and a.get("konusma") == kimlik:
            return ad, a
    ebeveyn = A.ebeveyn(kimlik)
    for ad, a in d.items():
        if not ad.startswith("_") and a.get("acik") and ebeveyn and a.get("konusma") == ebeveyn:
            return ad, dict(a, alt=True)
    return None


def olay_yaz(ad, kayit):
    k = A.AJAN_KLASOR / "olay"
    k.mkdir(parents=True, exist_ok=True)
    with open(k / (ad + ".jsonl"), "a", encoding="utf-8") as f:
        f.write(json.dumps(dict(kayit, t=int(time.time())), ensure_ascii=False) + "\n")


def arac_karari(ad_arac, args, wt, mini):
    """(karar, neden, ust_yazim) — saf islev; testler bunu dogrudan cagirir."""
    if ad_arac in KAPALI_ARAC:
        return "deny", KAPALI_ARAC[ad_arac], None
    sunucu = None
    if ad_arac.startswith("mcp_"):
        sunucu = next((s for s in ("hkm-sqlite", "hkm_sqlite") + IZINLI_MCP if ad_arac[4:].startswith(s)), ad_arac[4:].split("_")[0])
    elif ad_arac == "call_mcp_tool":
        sunucu = str(arg(args, "ServerName") or arg(args, "server") or "")
    if sunucu is not None:
        if any(sunucu.startswith(s) for s in IZINLI_MCP):
            return "allow", "", None
        return "deny", "Bu işte yalnız playwright MCP açık (%s kapalı: kişisel veri ya da kullanıcı hesabı)." % sunucu, None
    if ad_arac == "run_command":
        komut = str(arg(args, "CommandLine") or "")
        cwd = str(arg(args, "Cwd") or "")
        for desen, neden in YASAK_GIT:
            if desen.search(komut):
                return "deny", neden, None
        if YASAK_YOL.search(komut):
            return "deny", "Yalnız kendi klasörün: %s. Ana klasör, çalışan kopya ve LifeOs-ag yasak." % wt, None
        if mini and re.search(r"\bgit\b.*\b(commit|push|add)\b", komut, re.I):
            return "deny", "Mini ajan salt okunur: commit ve push yok.", None
        if not (cwd and A._icinde(cwd, wt)) and wt.lower() not in komut.lower().replace("/", "\\"):
            return "allow", "klasöre yönlendirildi", {"CommandLine": "Set-Location -LiteralPath '%s'; %s" % (wt, komut)}
        return "allow", "", None
    if YAZAN.search(ad_arac):
        yol = str(arg(args, "TargetFile") or arg(args, "Path") or arg(args, "AbsolutePath") or arg(args, "FilePath") or "")
        if mini:
            return "deny", "Mini ajan salt okunur: dosya yazmaz.", None
        if yol and not A._icinde(yol, wt) and not A._icinde(yol, str(Path.home() / ".gemini" / "antigravity" / "brain")):
            return "deny", "Yalnız kendi klasörüne yaz: %s" % wt, None
    return "allow", "", None


def dur_karari(a, girdi, onceki):
    """Stop: (devam_mi, neden)."""
    if onceki >= STOP_SINIR:
        return False, ""
    if girdi.get("fullyIdle") is False:
        return True, "Arka planda başlattığın iş sürüyor; bitmesini bekle, sonucunu oku, sonra devam et."
    if a.get("tur") != "gorev" or a.get("alt"):
        return False, ""
    wt = Path(a["worktree"])
    gorev = wt / A.GOREVLER / a.get("gorev", "")
    try:
        durum = re.search(r"\*\*Durum:\*\*\s*([^\s<]+)", gorev.read_text(encoding="utf-8"))
    except OSError:
        durum = None
    if not durum or durum.group(1).lower() not in ("bitti", "takıldı"):
        return True, "Görev dosyasında Durum hâlâ «bitti» ya da «takıldı» değil. İşi bitir ya da nedenini yazıp «takıldı» yap."
    kirli = A.git("status", "--porcelain", kok=wt, kontrol=False)
    if kirli:
        return True, "Kaydedilmemiş değişiklik var: commit et ve dalını push et."
    ileri = A.git("rev-list", "--count", "@{u}..HEAD", kok=wt, kontrol=False)
    if ileri != "0":
        return True, "Commit'in push edilmemiş: git push -u origin %s." % a.get("dal", "<dal>")
    return False, ""


def isle(olay, girdi):
    bulgu = ajan_bul(girdi.get("conversationId"))
    if not bulgu:
        return {}
    ad, a = bulgu
    wt = a["worktree"]
    if olay == "PreToolUse":
        cagri = girdi.get("toolCall") or {}
        ad_arac, args = cagri.get("name", ""), cagri.get("args") or {}
        karar, neden, ust = arac_karari(ad_arac, args, wt, a.get("tur") == "mini")
        if karar != "allow" or ust:
            olay_yaz(ad, {"olay": "arac", "arac": ad_arac, "karar": "yönlendirildi" if ust else "engellendi", "neden": neden,
                          "ozet": str(arg(args, "CommandLine") or arg(args, "TargetFile") or arg(args, "Path") or "")[:200]})
        out = {"decision": karar}
        if neden:
            out["reason"] = neden
        if ust:
            out["overwrite"] = ust
        return out
    if olay == "Stop":
        onceki = sum(1 for o in A.olaylar(ad) if o.get("olay") == "devam")
        devam, neden = dur_karari(a, girdi, onceki)
        olay_yaz(ad, {"olay": "devam" if devam else "durdu", "neden": neden or girdi.get("terminationReason", "")})
        return {"decision": "continue", "reason": neden} if devam else {}
    return {}


def main():
    olay = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        girdi = json.loads(sys.stdin.buffer.read().decode("utf-8") or "{}")
        out = isle(olay, girdi)
    except Exception as e:  # kanca asla ajani kilitlememeli: hata -> karar yok
        out = {}
        try:
            olay_yaz("_kanca", {"olay": "hata", "neden": repr(e)[:300]})
        except OSError:
            pass
    sys.stdout.write(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
