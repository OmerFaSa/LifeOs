# -*- coding: utf-8 -*-
"""Anahtarsiz model kopruleri: Antigravity ve Claude Code.

   Ikisi de kullanicinin KENDI oturumudur; Başbuğ anahtar tutmaz.

     antigravity  Antigravity'nin yerel dil sunucusu (language_server.exe agentapi).
                  Adres ve CSRF anahtari calisan surecin komut satirindan okunur,
                  yalniz bellekte ve alt surecin ortaminda durur; hicbir yere yazilmaz.
     claude       Resmi Claude Code CLI'nin bassiz kipi (`claude -p`), aracsiz ve MCP'siz.

   SINIR: Claude masaustu uygulamasi ya da claude.ai ekran/arayuz otomasyonuyla
   SURULMEZ (kullanim kosullarina aykiri); yalniz resmi CLI cagrilir.

   Uygulama kapaliysa `Kapali` atilir: King bunu soyler ve sira bir sonraki
   basamaga (yerel/ucretsiz model) gecer; sessiz uydurma yok (core/ai.py ask).

   Paralellik: saglayici basina es zamanli cagri siniri (semafor) ve sinirli
   kuyruk; kuyrukta bekleyen sure sinirini asarsa cagri «kuyruk dolu» der.
   Gecici hata bir kez yeniden denenir; kapali ve kota yeniden denenmez.
   Olcum: istek, basari, hata, kapali, zaman asimi, kuyruk; gecikme (ms).

   Model (2026-11-16): Antigravity varsayilani gemini-4-hydrogen-medium. agentapi gecersiz kimligi SESSIZCE
   flash'a dusurur; kimligin tutundugu get-conversation-metadata'daki planModel'den olculdu (flash M322,
   hydrogen high/medium/low M525/M526/M527; belgeler/ekip/sadelesme/tur-20261116/king.md).

   Sureklilik: daemon bir sohbet oturumu verirse (OTURUM) Antigravity ayni konusmaya send-message ile devam
   eder; yalniz yeni mesaj gider. Claude'a gecmis her seferinde gider, butceli (gecmis_butcele).
"""

import contextvars
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
from pathlib import Path

SESSIZ = getattr(subprocess, "CREATE_NO_WINDOW", 0)

SAGLAYICI = {
    # es: ayni anda en cok cagri; kuyruk: bekleyebilecek en cok cagri; sure: tek cagrinin tavani (sn).
    "antigravity": {"ad": "Antigravity", "es": 2, "kuyruk": 4, "sure": 180,
                    "modeller": ["gemini-4-hydrogen-medium", "gemini-4-hydrogen-high", "gemini-4-hydrogen-low"]},
    "claude": {"ad": "Claude (Claude Code)", "es": 2, "kuyruk": 4, "sure": 180,
               "modeller": ["sonnet", "haiku", "opus"]},
}
DENEME = 2                  # ilk cagri + bir yeniden deneme (yalniz gecici hatada)
BEKLE_SN = 1.0              # yeniden denemeden once
HAL_SN = 30                 # «acik mi» sorusu bu kadar onbelleklenir
EN_COK_ISTEM = 24000        # Windows komut satiri siniri 32k; istem bundan uzunsa gecmisin ortasi kirpilir (baş ve son mesaj kalir)
AG_VARSAYILAN = "gemini-4-hydrogen-medium"
# Eski takma adlar: «pro» ve «flash_lite» agentapi'de flash'a gidiyordu (pro==flash olcumu); artik hydrogen kademesi.
# «flash» da hydrogen'e gider: sahibin istegi 2026-11-16 «Antigravity'de model olarak hydrogen» (Merkez atamasi eskiden flash idi).
AG_ESKI = {"": AG_VARSAYILAN, "flash": AG_VARSAYILAN, "pro": "gemini-4-hydrogen-high", "flash_lite": "gemini-4-hydrogen-low"}
TAM_TUR = 6                 # gecmiste sondan bu kadar mesaj tam gider; eskiler kisaltilir
KISA_HARF = 280             # eski mesajin kisaltilmis uzunlugu
GECMIS_BUTCE = 14000        # gecmisin toplam harf butcesi (istemin geri kalani sistem metnidir)
AG_OTURUM_SN = 6 * 3600     # bu kadar dokunulmayan Antigravity konusmasi unutulur
# Istek basina sohbet oturumu (daemon /api/chat koyar: kabugun «baslangic» + kip + ders). Bos: sureklilik yok.
OTURUM = contextvars.ContextVar("kopru_oturum", default="")
_AG_KONUSMA = {}            # oturum anahtari -> {kimlik, soru, t}; yalniz bellekte
BEYIN = Path(os.environ.get("LIFEOS_AG_BEYIN", Path.home() / ".gemini/antigravity/brain"))


class Kapali(Exception):
    """Uygulama arka planda acik degil: yeniden denenmez, siradaki basamak devralir."""


class Gecici(Exception):
    """Bir kez yeniden denenebilir hata."""


class _Durum:
    def __init__(self, es, kuyruk):
        self.sem = threading.BoundedSemaphore(es)
        self.kilit = threading.Lock()
        self.es, self.kuyruk_siniri = es, kuyruk
        self.calisan = self.bekleyen = 0
        self.sayac = {"istek": 0, "basari": 0, "hata": 0, "kapali": 0, "zaman_asimi": 0,
                      "kuyruk_dolu": 0, "yeniden": 0, "kota": 0}
        self.gecikme = []       # son 50 basarili cagri (ms)


_DURUM = {ad: _Durum(t["es"], t["kuyruk"]) for ad, t in SAGLAYICI.items()}
_HAL = {}                   # ad -> (t, acik, not)
_AG_SUNUCU = {"t": 0.0, "deger": None}
_AG_KILIT = threading.Lock()


def kopru_mu(provider):
    return provider in SAGLAYICI


# ------------------------------------------------------------ acik mi

def _claude_yolu():
    yol = shutil.which("claude")
    if yol:
        return yol
    for aday in (Path.home() / ".local/bin/claude.exe", Path.home() / ".local/bin/claude"):
        if aday.exists():
            return str(aday)
    return None


def _ps(komut):
    r = subprocess.run(["powershell", "-NoProfile", "-Command", komut], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=20, creationflags=SESSIZ)
    return r.stdout


def _ag_bul():
    """(exe, ortam) ya da None. Anahtar yalniz ortam sozlugune gider."""
    if os.name != "nt":
        return None
    try:
        j = _ps("$p = Get-CimInstance Win32_Process -Filter \"Name='language_server.exe'\" | Select-Object ProcessId,ExecutablePath,CommandLine;"
                " $o = foreach($x in $p){ [pscustomobject]@{ exe=$x.ExecutablePath; cmd=$x.CommandLine;"
                " port=@(Get-NetTCPConnection -OwningProcess $x.ProcessId -State Listen -ErrorAction SilentlyContinue | ForEach-Object LocalPort) } };"
                " ConvertTo-Json @($o) -Depth 3")
        surecler = json.loads(j or "[]")
    except (OSError, ValueError, subprocess.SubprocessError):
        return None
    if isinstance(surecler, dict):
        surecler = [surecler]
    for s in surecler:
        anahtar = re.search(r"--csrf_token[= ](\S+)", s.get("cmd") or "")
        if not anahtar or not s.get("exe"):
            continue
        for port in s.get("port") or []:
            ortam = dict(os.environ, ANTIGRAVITY_CSRF_TOKEN=anahtar.group(1),
                         ANTIGRAVITY_LS_ADDRESS="127.0.0.1:%d" % int(port))
            y = _agentapi(s["exe"], ortam, ["get-conversation-metadata", "00000000-0000-0000-0000-000000000000"], 20)
            if "NotFound" in (y.get("error") or "") or y.get("response"):
                return s["exe"], ortam
    return None


def _ag_sunucu(tazele=False):
    with _AG_KILIT:
        if tazele or time.monotonic() - _AG_SUNUCU["t"] > HAL_SN:
            _AG_SUNUCU.update(t=time.monotonic(), deger=_ag_bul())
        return _AG_SUNUCU["deger"]


def hal(ad, tazele=False):
    """{acik, not}: uygulama simdi cagrilabilir mi. Ucuz; HAL_SN onbellekli."""
    if ad not in SAGLAYICI:
        return {"acik": False, "not": "Bilinmeyen köprü."}
    son = _HAL.get(ad)
    if son and not tazele and time.monotonic() - son[0] < HAL_SN:
        return {"acik": son[1], "not": son[2]}
    if ad == "claude":
        acik = bool(_claude_yolu())
        notu = "Claude Code hazır." if acik else "Claude Code (claude komutu) bu bilgisayarda bulunamadı."
    else:
        acik = bool(_ag_sunucu(tazele))
        notu = "Antigravity açık." if acik else "Antigravity açık değil; arka planda açık olması yeter."
    _HAL[ad] = (time.monotonic(), acik, notu)
    return {"acik": acik, "not": notu}


# ------------------------------------------------------------ istem

def _kisalt(metin, n):
    metin = " ".join(str(metin or "").split())
    return metin if len(metin) <= n else metin[:n].rsplit(" ", 1)[0] + " …"


def gecmis_butcele(mesajlar, tam=TAM_TUR, kisa=KISA_HARF, butce=GECMIS_BUTCE):
    """Uzun gecmiste baglam butcesi. Saf; test edilir.

    Son `tam` mesaj (son kullanici mesaji dahil) oldugu gibi; daha eskiler `kisa` harfe kisaltilir. Toplam `butce`yi
    asarsa en eskiden atilir; son mesaj hic atilmaz (tek basina butceyi asarsa istem() gecmisin basini kirpar, sistem talimati kalir).
    Doner: (mesajlar, kisaltilan, atilan)."""
    l = [dict(m) for m in (mesajlar or []) if str(m.get("content") or "").strip()]
    kisaltilan = 0
    for i, m in enumerate(l[:-tam] if tam else l):
        k = _kisalt(m["content"], kisa)
        if k != str(m["content"]).strip():
            kisaltilan += 1
        l[i] = dict(m, content=k)
    atilan = 0
    while len(l) > 1 and sum(len(str(m["content"])) for m in l) > butce:
        l.pop(0)
        atilan += 1
    return l, kisaltilan, atilan


def istem(sistem, mesajlar, aracsiz=False):
    """Sistem metni ve gecmis tek metne. Son mesaj kullanicinindir; gecmis butcelidir (gecmis_butcele)."""
    parca = []
    if aracsiz:
        parca.append("Hiçbir araç kullanma: dosya okuma, yazma, komut çalıştırma, web araması yok. "
                     "Yalnız düz metinle cevap ver.")
    if sistem:
        parca.append(str(sistem).strip())
    l, kisaltilan, atilan = gecmis_butcele(mesajlar)
    gecmis = ["%s: %s" % ("Kullanıcı" if m.get("role") == "user" else "King", str(m["content"]).strip()) for m in l]
    son = "Son kullanıcı mesajına King olarak cevap ver; yalnız cevabı yaz."
    bas = "\n\n".join(parca)       # araç yasağı + King'in kimliği ve kip talimatı: istemin BAŞI, asla düşmez
    govde = ""
    if gecmis:
        govde = "Konuşma%s:\n" % (" (eski turlar kısaltıldı)" if kisaltilan or atilan else "") + "\n\n".join(gecmis)
    pay = EN_COK_ISTEM - len(son) - 4
    if len(bas) > pay // 2:          # başın kendisi şişkinse yalnız ORTASI kesilir; baş ve son satırlar kalır
        kes = max(pay // 2, pay - len(govde) - 4)
        bas = bas[:kes // 2] + "\n[...]\n" + bas[-(kes - kes // 2):]
    govde = govde[max(0, len(govde) - max(0, pay - len(bas) - 4)):] if govde else ""   # geçmişin EN ESKİ kısmı gider
    return "\n\n".join(x for x in (bas, govde, son) if x)


# ------------------------------------------------------------ claude -p

KOTA_RE = re.compile(r"usage limit|rate limit|quota|limit reached|too many requests", re.I)
OTURUM_RE = re.compile(r"not logged in|please run /login|invalid api key|authentication", re.I)


def _claude(model, sistem, mesajlar, sure):
    yol = _claude_yolu()
    if not yol:
        raise Kapali("Claude Code (claude komutu) bu bilgisayarda bulunamadı.")
    # --setting-sources= : kullanicinin kancalari ve ayarlari yuklenmez (olculdu 2026-11-15: 8,5 -> 4,4 sn).
    komut = [yol, "-p", "--output-format", "json", "--tools", "", "--strict-mcp-config",
             "--no-session-persistence", "--setting-sources="]
    if model:
        komut += ["--model", model]
    try:
        # Notr klasor: projenin CLAUDE.md'si istemi sisirmesin.
        r = subprocess.run(komut, input=istem(sistem, mesajlar), capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=sure, cwd=tempfile.gettempdir(),
                           creationflags=SESSIZ)
    except subprocess.TimeoutExpired:
        raise TimeoutError("Claude Code %d sn içinde cevap vermedi" % sure)
    except OSError as e:
        raise Kapali("Claude Code başlatılamadı (%s)." % type(e).__name__)
    try:
        y = json.loads(r.stdout or "{}")
    except ValueError:
        y = {}
    metin = str(y.get("result") or "")
    if r.returncode != 0 or y.get("is_error") or not metin.strip():
        ham = (metin or r.stderr or r.stdout or "")[:300]
        if KOTA_RE.search(ham):
            raise RuntimeError("HTTP 429 — Claude kullanım sınırı: %s" % " ".join(ham.split())[:160])
        if OTURUM_RE.search(ham):
            raise Kapali("Claude Code oturumu açık değil: bir terminalde «claude» ile giriş yap.")
        raise Gecici("Claude Code hata döndü (çıkış %s): %s" % (r.returncode, " ".join(ham.split())[:160]))
    k = y.get("usage") or {}
    gir = k.get("input_tokens")
    if gir is not None:
        gir += (k.get("cache_read_input_tokens") or 0) + (k.get("cache_creation_input_tokens") or 0)
    return metin.strip(), gir, k.get("output_tokens"), y.get("stop_reason") == "max_tokens"


# ------------------------------------------------------------ antigravity

def _agentapi(exe, ortam, args, sure=60):
    try:
        r = subprocess.run([exe, "agentapi"] + args, capture_output=True, text=True, encoding="utf-8",
                           errors="replace", timeout=sure, env=ortam, creationflags=SESSIZ)
        return json.loads(r.stdout or "{}")
    except subprocess.TimeoutExpired:
        return {"error": "agentapi zaman aşımı"}
    except (OSError, ValueError, subprocess.SubprocessError) as e:
        return {"error": type(e).__name__}


def ag_cevap(satirlar):
    """Dokum satirlarindan bitmis cevap: (bitti, metin, hata). Saf; test edilir."""
    for x in reversed(satirlar):
        t = x.get("type")
        if t == "ERROR_MESSAGE":
            return True, None, str(x.get("content") or "Antigravity hata verdi")[:200]
        if t == "PLANNER_RESPONSE":
            metin = re.sub(r"^(Created|Completed) At: \S+\n", "", str(x.get("content") or ""), flags=re.M).strip()
            if x.get("status") == "DONE" and not x.get("tool_calls") and metin:
                return True, metin, None
            return False, None, None
    return False, None, None


def _dokum(kimlik):
    yol = BEYIN / kimlik / ".system_generated" / "logs" / "transcript.jsonl"
    out = []
    try:
        with open(yol, encoding="utf-8") as f:
            for s in f:
                try:
                    out.append(json.loads(s))
                except ValueError:          # yazilmakta olan son satir
                    pass
    except OSError:
        pass
    return out


def ag_model(model):
    """Antigravity model kimligi: bos ve eski takma adlar hydrogen'e (AG_ESKI), digerleri oldugu gibi. Saf."""
    return AG_ESKI.get(str(model or ""), str(model))


def ag_oturum_anahtari(oturum, model):
    """Bellekteki konusma anahtari: kabugun oturumu + model (model degisirse yeni konusma). Saf."""
    return hashlib.sha1(("%s|%s" % (oturum, ag_model(model))).encode("utf-8")).hexdigest()[:16] if oturum else ""


def ag_devam_mi(kayit, mesajlar, simdi=None):
    """Kayitli Antigravity konusmasina devam edilebilir mi. Saf; test edilir.

    Kosul: kayit taze ve gecmisin sondan ucuncu mesaji (son King cevabindan onceki kullanici mesaji) o konusmaya
    en son gonderdigimiz soru. Arada baska bir saglayici cevap verdiyse ya da gecmis sifirlandiysa tutmaz: yeni
    konusma tam (butceli) gecmisle acilir; boylece Antigravity'nin hafizasi ambardaki gecmisten sapmaz."""
    if not kayit or (simdi if simdi is not None else time.monotonic()) - kayit.get("t", 0) > AG_OTURUM_SN:
        return False
    l = [m for m in (mesajlar or []) if str(m.get("content") or "").strip()]
    return (len(l) >= 3 and l[-1].get("role") == "user" and l[-2].get("role") == "assistant"
            and l[-3].get("role") == "user" and str(l[-3]["content"]).strip() == kayit.get("soru"))


DEVAM_ONEK = "(Araç kullanma; King olarak yalnız düz metinle cevap ver.)\n\n"


def _antigravity(model, sistem, mesajlar, sure, iptal=None):
    s = _ag_sunucu()
    if not s:
        raise Kapali("Antigravity açık değil; arka planda açık olması yeter.")
    son_an = time.monotonic() + sure
    anahtar = ag_oturum_anahtari(OTURUM.get(), model)
    kayit = _AG_KONUSMA.get(anahtar) if anahtar else None
    soru = str((mesajlar or [{}])[-1].get("content") or "").strip()
    kimlik, bas, y = None, 0, {}
    if ag_devam_mi(kayit, mesajlar):
        # Ayni konusmaya devam: yalniz yeni mesaj gider; cevap dokumun bu noktadan sonrasinda aranir
        # (oncekinin bitmis cevabi yeni cevap sanilmasin).
        bas = len(_dokum(kayit["kimlik"]))
        y = _agentapi(s[0], s[1], ["send-message", kayit["kimlik"], DEVAM_ONEK + soru], min(60, sure))
        if (y.get("response") or {}).get("sendMessage"):
            kimlik = kayit["kimlik"]
    if not kimlik:
        bas = 0
        y = _agentapi(s[0], s[1], ["new-conversation", "--model=" + ag_model(model), "--title=Başbuğ King",
                                   istem(sistem, mesajlar, aracsiz=True)], min(60, sure))
        kimlik = ((y.get("response") or {}).get("newConversation") or {}).get("conversationId")
    if not kimlik:
        _ag_sunucu(tazele=True)         # sunucu kapanmis ya da port degismis olabilir
        raise Gecici("Antigravity konuşma açmadı: %s" % str(y.get("error") or "kimlik dönmedi")[:120])
    if anahtar:
        _AG_KONUSMA.pop(anahtar, None)  # cevap gelmeden ikinci istek gelirse yarim konusmaya devam edilmez
    while time.monotonic() < son_an:
        if callable(iptal) and iptal():
            raise TimeoutError("istemci gitti")
        bitti, metin, hata = ag_cevap(_dokum(kimlik)[bas:])
        if bitti:
            if hata:
                if KOTA_RE.search(hata):
                    raise RuntimeError("HTTP 429 — Antigravity kotası: %s" % hata[:160])
                raise Gecici("Antigravity: %s" % hata)
            if anahtar:
                simdi = time.monotonic()
                for k in [k for k, v in _AG_KONUSMA.items() if simdi - v["t"] > AG_OTURUM_SN]:
                    del _AG_KONUSMA[k]
                _AG_KONUSMA[anahtar] = {"kimlik": kimlik, "soru": soru, "t": simdi}
            return metin, None, None, False
        time.sleep(0.5)
    raise TimeoutError("Antigravity %d sn içinde cevap vermedi" % sure)


# ------------------------------------------------------------ tek kapi

def cagir(ad, model, sistem, mesajlar, sure=None, iptal=None, _uygula=None):
    """Kopru cagrisi: (metin, giris_jeton|None, cikis_jeton|None, kesildi, ek).

    Kuyruk: es zamanli sinir doluysa en cok `kuyruk` cagri bekler; daha fazlasi
    hemen «kuyruk dolu» der. Bekleme de `sure`den duser. `_uygula`: test icin."""
    if ad not in SAGLAYICI:
        raise ValueError("bilinmeyen köprü: %s" % ad)
    d, tanim = _DURUM[ad], SAGLAYICI[ad]
    sure = int(sure or tanim["sure"])
    uygula = _uygula or (_claude if ad == "claude" else
                         lambda m, s, g, t: _antigravity(m, s, g, t, iptal))
    with d.kilit:
        d.sayac["istek"] += 1
        if d.calisan >= d.es and d.bekleyen >= d.kuyruk_siniri:
            d.sayac["kuyruk_dolu"] += 1
            raise Gecici("%s kuyruğu dolu (%d çalışıyor, %d bekliyor)" % (tanim["ad"], d.calisan, d.bekleyen))
        d.bekleyen += 1
    t0 = time.monotonic()
    alindi = False
    try:
        alindi = d.sem.acquire(timeout=sure)
        with d.kilit:
            d.bekleyen -= 1
            if alindi:
                d.calisan += 1
        if not alindi:
            with d.kilit:
                d.sayac["zaman_asimi"] += 1
            raise TimeoutError("%s sırası %d sn içinde gelmedi" % (tanim["ad"], sure))
        hata = None
        for i in range(DENEME):
            kalan = max(1, int(sure - (time.monotonic() - t0)))
            try:
                metin, gir, cik, kesildi = uygula(model, sistem, mesajlar, kalan)
                with d.kilit:
                    d.sayac["basari"] += 1
                    d.gecikme = (d.gecikme + [int((time.monotonic() - t0) * 1000)])[-50:]
                return metin, gir, cik, kesildi, {"kopru": ad}
            except Gecici as e:
                hata = e
                if i + 1 < DENEME and time.monotonic() - t0 + BEKLE_SN < sure:
                    with d.kilit:
                        d.sayac["yeniden"] += 1
                    time.sleep(BEKLE_SN)
                    continue
                break
        raise RuntimeError(str(hata))
    except Kapali:
        with d.kilit:
            d.sayac["kapali"] += 1
        _HAL[ad] = (time.monotonic(), False, SAGLAYICI[ad]["ad"] + " kapalı.")
        raise
    except TimeoutError:
        with d.kilit:
            d.sayac["zaman_asimi"] += 1
        raise
    except Exception as e:                      # noqa: BLE001
        with d.kilit:
            d.sayac["kota" if "HTTP 429" in str(e) else "hata"] += 1
        raise
    finally:
        if alindi:
            with d.kilit:
                d.calisan -= 1
            d.sem.release()


def _yuzde(dizi, p):
    if not dizi:
        return None
    s = sorted(dizi)
    return s[min(len(s) - 1, int(round(p / 100.0 * (len(s) - 1))))]


def durum(tazele=False):
    """Sahibe gorunen hal: acik mi, sinir, kuyruk, olcum. Sir icermez."""
    out = {}
    for ad, tanim in SAGLAYICI.items():
        d = _DURUM[ad]
        with d.kilit:
            sayac, gec = dict(d.sayac), list(d.gecikme)
            calisan, bekleyen = d.calisan, d.bekleyen
        biten = sayac["basari"] + sayac["hata"] + sayac["kapali"] + sayac["zaman_asimi"] + sayac["kota"]
        out[ad] = dict(hal(ad, tazele), ad=tanim["ad"], modeller=tanim["modeller"], sinir=tanim["es"],
                       kuyruk=tanim["kuyruk"], calisan=calisan, bekleyen=bekleyen, sayac=sayac,
                       basari_orani=(round(100.0 * sayac["basari"] / biten) if biten else None),
                       gecikme_ms={"medyan": _yuzde(gec, 50), "p95": _yuzde(gec, 95), "n": len(gec)},
                       # Olcum etiketi: surec acildigindan beri bu surecte olculdu; bos ise veri yok.
                       etiket="ölçüldü" if gec or biten else "veri yok")
    return out
