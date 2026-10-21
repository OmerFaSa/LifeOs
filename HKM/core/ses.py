# -*- coding: utf-8 -*-
"""Ses — King'in sesi (kullanici, 2026-10-19: «internete bagliyken Gemini,
   yerelde Piper; PC, telefon ve tablet icin; ayarlanabilsin»).

   Tarayicinin kendi sesi PC'de tek Turkce sestir (Microsoft Tolga) ve
   robotiktir; King bulut seslerini (Edge «Online») bilerek secmez. Bu
   modul sesi SUNUCUDA uretir; modul King'i ondan WAV ister, alamazsa
   cihazin kendi sesine duser (brand/ortak/king.js soz 28).

   Dokuz kural:

   1. SIRA KODDUR. «oto»: once Gemini (internet + Google anahtari + butce),
      olmazsa EMA, olmazsa Piper (ikisi de bu bilgisayarda), olmazsa «yok» —
      cihaz sesi. «gemini», «ema» ve «piper» yalniz kendisini dener.
   2. GEMINI UCRETLIDIR ve butce kapisindan gecer (core/butce.py guard);
      her cagri deftere yazilir. Fiyat «tahmin»dir (sabit tablo).
   3. PIPER YERELDIR, UCRETSIZDIR, METIN MAKINEDEN CIKMAZ. HKM onu KURMAZ ve
      INDIRMEZ: bilinen yerlerde `piper.exe` ve Turkce bir `.onnx` ses
      arar (Ollama gibi, core/ollama.py). Bulamazsa nerede aradigini soyler.
   4. MODEL CAGRISI DEGILDIR. Metin King'in zaten yazdigi cevaptir; ses
      onu okur, degistirmez, sayi uretmez.
   5. METIN SINIRLIDIR (EN_COK harf); bos metin ses istemez.
   6. ONBELLEK: ayni motor + ses + metin ikinci kez uretilmez (bellekte,
      en cok ONBELLEK_EN_COK parca). Ayni cevabi yeniden dinlemek bedava.
   7. HATA FIRLATMAZ: her yol (wav, motor, not) doner; not neden olmadigini
      adiyla soyler.
   8. KOTA DOLUNCA BEKLER (kullanici, 2026-10-19: «ses durduk yere Piper'a,
      cihaza geciyor»). Gemini 429 (kota) ya da 503 (yogun) donerse bir sure
      HIC denenmez: once BEKLE_ILK saniye, ust uste geldikce iki katina,
      en cok BEKLE_EN_COK; Google bekleme suresini soylerse (Retry-After,
      retryDelay) o kullanilir. Beklerken istek gitmez, deftere yazilmaz;
      «oto» dogrudan Piper'a gecer ve not nedenini soyler. Her parca icin
      yeniden Gemini denemek sesi parca parca Gemini/Piper arasinda
      gidip getiriyordu.
   9. EMA YERELDIR (2026-10-20, King 2.0 A): EMA Lightning, 34 MB Turkce
      ses, GPU'da. Kendi sanal ortaminda (venv, PyTorch) AYRI bir surec
      olarak calisir (tools/ema_isci.py); HKM'ye paket girmez. HKM onu
      KURMAZ ve INDIRMEZ (agirliklar da: HF_HUB_OFFLINE); bulamazsa nerede
      aradigini soyler. Surec ilk istekte acilir, sicak kalir (ilk ses
      milisaniyeler), EMA_BOS saniye bos kalirsa kapanir (RAM ve VRAM geri
      verilir). Uretim akislidir: ema_parcalar() PCM'i parca parca verir;
      seslendir() parcalari tek WAV'a dizer."""
import atexit
import base64
import collections
import glob
import io
import json
import os
import queue
import shutil
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request
import wave

from core import butce, models

TERCIHLER = ("oto", "gemini", "ema", "piper", "cihaz")
GEMINI_MODEL = "gemini-2.5-flash-preview-tts"
# Gemini'nin hazir sesleri (speechConfig.prebuiltVoiceConfig.voiceName).
GEMINI_SESLER = ("Kore", "Zephyr", "Puck", "Charon", "Fenrir", "Leda", "Orus", "Aoede",
                 "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba",
                 "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar",
                 "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi",
                 "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat")
VARSAYILAN = {"gemini_ses": "Kore", "piper_yol": "", "ema_yol": ""}
EN_COK = 1500
GEMINI_ZAMAN = 25
PIPER_ZAMAN = 40
ORNEK_HZ = 24000                    # Gemini: 16 bit, tek kanal, 24 kHz PCM
# Tahmini fiyat (USD / 1M jeton): metin girisi ve ses cikisi.
FIYAT = {"giris": 0.5, "cikis": 10.0}
ONBELLEK_EN_COK = 64
_ONBELLEK = collections.OrderedDict()
_KILIT = threading.Lock()
# Kural 8: kota beklemesi (bellekte; HKM yeniden baslayinca sifirlanir).
BEKLE_ILK = 60
BEKLE_EN_COK = 1800
BEKLE_KODLARI = (429, 503)
_BEKLE = {"bitis": 0.0, "sure": 0}
SAAT = time.monotonic               # testler sahte saat koyar


def settings(cfg):
    out = dict(VARSAYILAN)
    g = (cfg or {}).get("ses")
    if isinstance(g, dict):
        if g.get("gemini_ses") in GEMINI_SESLER:
            out["gemini_ses"] = g["gemini_ses"]
        for k in ("piper_yol", "ema_yol"):
            if isinstance(g.get(k), str):
                out[k] = g[k].strip()
    return out


def validate(patch):
    if not isinstance(patch, dict):
        return False, ["ses bir nesne olmalı"]
    hata = []
    for k, v in patch.items():
        if k == "gemini_ses":
            if v not in GEMINI_SESLER:
                hata.append("ses.gemini_ses tanımlı bir Gemini sesi olmalı")
        elif k in ("piper_yol", "ema_yol"):
            if not isinstance(v, str) or len(v) > 400:
                hata.append("ses.%s bir klasör ya da dosya yolu olmalı" % k)
        else:
            hata.append("bilinmeyen ses ayarı: %s" % k)
    return (not hata), hata


# ------------------------------------------------------------------ wav

def wav(pcm, hz=ORNEK_HZ):
    """Ham 16 bit tek kanal PCM -> WAV baytlari."""
    b = io.BytesIO()
    with wave.open(b, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(hz)
        w.writeframes(pcm)
    return b.getvalue()


def _hz(mime):
    """«audio/L16;codec=pcm;rate=24000» -> 24000."""
    for p in str(mime or "").split(";"):
        p = p.strip()
        if p.startswith("rate="):
            try:
                return int(p[5:])
            except ValueError:
                pass
    return ORNEK_HZ


# --------------------------------------------------------------- gemini

def _post(url, baslik, govde, timeout):
    istek = urllib.request.Request(url, data=json.dumps(govde).encode("utf-8"),
                                   headers=baslik, method="POST")
    with urllib.request.urlopen(istek, timeout=timeout) as y:      # noqa: S310
        return json.loads(y.read().decode("utf-8") or "{}")


# Testler AGA CIKMAZ (tests/harness.py «ag kapali» koyar).
VARSAYILAN_POST = _post


def _bekleme_suresi(e):
    """Google'in soyledigi bekleme (sn) ya da None: Retry-After basligi,
    yoksa govdedeki RetryInfo.retryDelay («37s»)."""
    try:
        b = (getattr(e, "headers", None) or {}).get("Retry-After")
        if b and str(b).strip().isdigit():
            return int(str(b).strip())
    except Exception:                           # noqa: BLE001
        pass
    try:
        g = json.loads(e.read().decode("utf-8", "replace") or "{}")
        for d in ((g.get("error") or {}).get("details") or []):
            r = str((d or {}).get("retryDelay") or "").strip()
            if r.endswith("s"):
                return int(float(r[:-1]) + 0.999)
    except Exception:                           # noqa: BLE001
        pass
    return None


def _bekle_kur(e):
    """429/503 sonrasi bekleme: ilk BEKLE_ILK, ust uste iki kati, tavan BEKLE_EN_COK."""
    with _KILIT:
        onceki = _BEKLE["sure"]
        sure = min(BEKLE_EN_COK, onceki * 2) if onceki else BEKLE_ILK
        g = _bekleme_suresi(e)
        if g:
            sure = min(BEKLE_EN_COK, max(sure, g))
        _BEKLE["sure"] = sure
        _BEKLE["bitis"] = SAAT() + sure
        return sure


def gemini_bekliyor():
    """Kalan bekleme (tam saniye); beklemiyorsa 0."""
    kalan = _BEKLE["bitis"] - SAAT()
    return int(kalan + 0.999) if kalan > 0 else 0


def _sure_yaz(sn):
    return "%d sn" % sn if sn < 90 else "%d dk" % ((sn + 59) // 60)


def gemini_hazir(con, cfg):
    """(ok, not). Para harcanmadan once: anahtar ve butce."""
    if not models.key_value(cfg, "google"):
        return False, "Google (Gemini) anahtarı yok; Ayarlar → Sağlayıcılar."
    g = butce.guard(con, cfg)
    if not g.get("ok"):
        return False, g.get("note") or "Bütçe izin vermiyor."
    return True, ""


def gemini(con, cfg, metin, post=None):
    """(wav, not). Basarisiz cagri da deftere yazilir (butce.record)."""
    ok, neden = gemini_hazir(con, cfg)
    if not ok:
        return None, neden
    kalan = gemini_bekliyor()
    if kalan:
        return None, ("Gemini kotası dolu; yaklaşık %s sonra yeniden denenecek." % _sure_yaz(kalan))
    ses = settings(cfg)["gemini_ses"]
    url = "%s/%s:generateContent" % (models.PROVIDERS["google"]["base"], GEMINI_MODEL)
    govde = {"contents": [{"parts": [{"text": metin}]}],
             "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {
                 "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": ses}}}}}
    try:
        y = (post or VARSAYILAN_POST)(url, {"Content-Type": "application/json",
                                            "x-goog-api-key": models.key_value(cfg, "google")},
                                      govde, GEMINI_ZAMAN)
    except Exception as e:                      # noqa: BLE001 — internet yok da bir durumdur
        kod = getattr(e, "code", None)
        butce.record(con, role="ses", task="tts", provider="google", model=GEMINI_MODEL,
                     ok=False, note="ses: %s" % (kod or type(e).__name__))
        if kod in BEKLE_KODLARI:
            sure = _bekle_kur(e)
            return None, ("Gemini %s; %s boyunca denenmeyecek." % (
                "kotası doldu" if kod == 429 else "şu an yoğun", _sure_yaz(sure)))
        return None, ("Gemini sesine ulaşılamadı (%s)." % (
            "HTTP %s" % kod if kod else "internet yok ya da yanıt gelmedi"))
    parca = ((((y.get("candidates") or [{}])[0].get("content") or {}).get("parts")) or [{}])[0]
    veri = (parca.get("inlineData") or {})
    k = y.get("usageMetadata") or {}
    gir, cik = int(k.get("promptTokenCount") or 0), int(k.get("candidatesTokenCount") or 0)
    usd = (gir * FIYAT["giris"] + cik * FIYAT["cikis"]) / 1e6
    if not veri.get("data"):
        butce.record(con, role="ses", task="tts", provider="google", model=GEMINI_MODEL,
                     in_tok=gir, out_tok=cik, usd=usd, ok=False, note="ses: bos cevap; tahmini-fiyat")
        return None, "Gemini ses döndürmedi."
    butce.record(con, role="ses", task="tts", provider="google", model=GEMINI_MODEL,
                 in_tok=gir, out_tok=cik, usd=usd, note="ses: %s; tahmini-fiyat" % ses)
    with _KILIT:
        _BEKLE["sure"] = 0
        _BEKLE["bitis"] = 0.0
    try:
        pcm = base64.b64decode(veri["data"])
    except ValueError:
        return None, "Gemini’nin sesi okunamadı."
    return wav(pcm, _hz(veri.get("mimeType"))), ""


# ---------------------------------------------------------------- piper

def _adaylar(cfg):
    """Piper'in arandigi yerler (sira onemli: kullanicinin yazdigi once)."""
    yol = settings(cfg)["piper_yol"]
    kok = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ev = os.path.expanduser("~")
    yerel = os.environ.get("LOCALAPPDATA") or os.path.join(ev, "AppData", "Local")
    out = []
    if yol:
        out.append(os.path.dirname(yol) if yol.lower().endswith((".exe", ".onnx")) or
                   os.path.basename(yol) == "piper" else yol)
    out += [os.path.join(kok, "piper"), os.path.join(yerel, "Programs", "piper"),
            os.path.join(yerel, "piper"), os.path.join(ev, "piper")]
    return out


def piper_bul(cfg, ara=None):
    """{bulundu, exe, ses, aranan, metin}. Hicbir sey calistirmaz."""
    aranan = _adaylar(cfg)
    exe = None
    for d in aranan:
        for ad in ("piper.exe", "piper"):
            p = os.path.join(d, ad)
            if os.path.isfile(p):
                exe = p
                break
        if exe:
            break
    if not exe:
        w = (ara or shutil.which)("piper")
        exe = w if w else None
    dizinler = ([os.path.dirname(exe)] if exe else []) + aranan
    ses = None
    for d in dizinler:
        # Iki kat derinlik yeter (piper/ ve piper/sesler/); butun diski taramaz.
        bulunan = sorted(glob.glob(os.path.join(d, "tr_TR*.onnx"))
                         + glob.glob(os.path.join(d, "*", "tr_TR*.onnx")))
        if bulunan:
            ses = bulunan[0]
            break
    yol = settings(cfg)["piper_yol"]
    if yol.lower().endswith(".onnx") and os.path.isfile(yol):
        ses = yol
    if not exe:
        metin = ("Piper bulunamadı. github.com/rhasspy/piper sürümlerinden Windows paketini "
                 "indirip şu klasöre aç: %s (ya da yolunu buraya yaz)." % aranan[1])
    elif not ses:
        metin = ("Piper bulundu ama Türkçe ses yok. «tr_TR-…-medium.onnx» ve yanındaki "
                 ".onnx.json dosyasını %s klasörüne koy." % os.path.dirname(exe))
    else:
        metin = "Piper hazır: %s." % os.path.basename(ses).replace(".onnx", "")
    return {"bulundu": bool(exe and ses), "exe": exe, "ses": ses,
            "aranan": aranan, "metin": metin}


def _calistir(exe, ses, metin, timeout):
    fd, cikti = tempfile.mkstemp(suffix=".wav", prefix="hkm-piper-")
    os.close(fd)
    try:
        bayrak = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        subprocess.run([exe, "--model", ses, "--output_file", cikti], input=metin.encode("utf-8"),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=timeout,
                       check=True, creationflags=bayrak)
        with open(cikti, "rb") as f:
            return f.read()
    finally:
        try:
            os.remove(cikti)
        except OSError:
            pass


# Testler sahte calistirici koyar.
VARSAYILAN_CALISTIR = _calistir


def piper(cfg, metin, calistir=None, bul=None):
    """(wav, not)."""
    p = bul or piper_bul(cfg)
    if not p["bulundu"]:
        return None, p["metin"]
    try:
        veri = (calistir or VARSAYILAN_CALISTIR)(p["exe"], p["ses"], metin, PIPER_ZAMAN)
    except Exception as e:                      # noqa: BLE001
        return None, "Piper sesi üretemedi (%s)." % type(e).__name__
    if not veri or veri[:4] != b"RIFF":
        return None, "Piper geçerli bir ses dosyası üretmedi."
    return veri, ""


# ------------------------------------------------------------------ ema

EMA_HZ = 24000
EMA_ZAMAN = 90                      # ilk istekte PyTorch ve model yuklenir
EMA_BOS = 600
_EMA = {"p": None, "q": None, "py": None, "son": 0.0, "cihaz": None, "acilis_sn": None}
_EMA_KILIT = threading.Lock()


def _ema_adaylar(cfg):
    yol = settings(cfg)["ema_yol"]
    kok = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ev = os.path.expanduser("~")
    yerel = os.environ.get("LOCALAPPDATA") or os.path.join(ev, "AppData", "Local")
    out = []
    if yol:
        out.append(os.path.dirname(os.path.dirname(os.path.dirname(yol)))
                   if os.path.basename(yol).lower().startswith("python") else yol)
    return out + [os.path.join(yerel, "Programs", "ema-tts"), os.path.join(kok, "ema-tts"),
                  os.path.join(yerel, "ema-tts"), os.path.join(ev, "ema-tts")]


def ema_bul(cfg):
    """{bulundu, python, betik, aranan, metin}. Hicbir sey calistirmaz."""
    aranan = _ema_adaylar(cfg)
    py = None
    for d in aranan:
        for v in (os.path.join(d, "venv"), d):
            for p in (os.path.join(v, "Scripts", "python.exe"), os.path.join(v, "bin", "python")):
                if os.path.isfile(p):
                    py = p
                    break
            if py:
                break
        if py:
            break
    paket = False
    if py:
        v = os.path.dirname(os.path.dirname(py))
        paket = bool(glob.glob(os.path.join(v, "Lib", "site-packages", "ema_lightning"))
                     + glob.glob(os.path.join(v, "lib", "python3*", "site-packages", "ema_lightning")))
    betik = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tools", "ema_isci.py")
    if not py:
        metin = ("EMA bulunamadı. github.com/canberk7/ema-lightning paketini bir sanal ortama "
                 "(venv) kur: %s (ya da yolunu buraya yaz)." % os.path.join(aranan[-4], "venv"))
    elif not paket:
        metin = "EMA’nın ortamı bulundu ama ema-lightning paketi kurulu değil: %s." % os.path.dirname(os.path.dirname(py))
    elif not os.path.isfile(betik):
        metin = "EMA işçisi (tools/ema_isci.py) yok."
    else:
        metin = "EMA hazır" + (" (%s)" % _EMA["cihaz"].upper() if _EMA["cihaz"] else "") + "."
    return {"bulundu": bool(py and paket and os.path.isfile(betik)), "python": py, "betik": betik,
            "aranan": aranan, "metin": metin, "calisiyor": _ema_canli()}


def _ema_canli():
    p = _EMA["p"]
    return bool(p is not None and p.poll() is None)


def _ema_kapat():
    p = _EMA["p"]
    _EMA.update(p=None, q=None, cihaz=None)
    if p is not None:
        try:
            p.kill()
        except OSError:
            pass


atexit.register(_ema_kapat)


def _ema_satir(q, timeout):
    bitis = time.monotonic() + timeout
    while True:
        kalan = bitis - time.monotonic()
        if kalan <= 0:
            raise TimeoutError("EMA zamanında cevap vermedi")
        try:
            satir = q.get(timeout=kalan)
        except queue.Empty:
            raise TimeoutError("EMA zamanında cevap vermedi") from None
        if satir is None:
            raise RuntimeError("EMA süreci kapandı")
        try:
            return json.loads(satir.decode("utf-8"))
        except ValueError:
            continue                            # protokol disi satir


def _ema_nobet():
    """Bos kalan isciyi kapatir (kural 9)."""
    while _ema_canli():
        time.sleep(30)
        with _EMA_KILIT:
            if _ema_canli() and time.monotonic() - _EMA["son"] > EMA_BOS:
                _ema_kapat()


def _ema_baslat(py, betik, timeout):
    env = dict(os.environ, HF_HUB_OFFLINE="1", PYTHONIOENCODING="utf-8")
    p = subprocess.Popen([py, "-I", betik], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                         stderr=subprocess.DEVNULL, env=env,
                         creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    q = queue.Queue()

    def oku():
        for satir in p.stdout:
            q.put(satir)
        q.put(None)
    threading.Thread(target=oku, daemon=True).start()
    _EMA.update(p=p, q=q, py=py, son=time.monotonic())
    ilk = _ema_satir(q, timeout)
    if not ilk.get("hazir"):
        _ema_kapat()
        raise RuntimeError(ilk.get("hata") or "EMA açılmadı")
    _EMA.update(cihaz=ilk.get("cihaz"), acilis_sn=ilk.get("sn"))
    threading.Thread(target=_ema_nobet, daemon=True).start()


def _ema_akis(py, betik, metin, timeout):
    """PCM parcalari (16 bit, EMA_HZ). Yarida birakilirsa surec kapatilir:
    borudaki artik parcalar sonraki istege karismasin."""
    with _EMA_KILIT:
        bitti = False
        try:
            if not _ema_canli() or _EMA["py"] != py:
                _ema_kapat()
                _ema_baslat(py, betik, timeout)
            p = _EMA["p"]
            p.stdin.write((json.dumps({"metin": metin, "hz": EMA_HZ}) + "\n").encode("utf-8"))
            p.stdin.flush()
            while True:
                d = _ema_satir(_EMA["q"], timeout)
                if "pcm" in d:
                    yield base64.b64decode(d["pcm"])
                elif d.get("son"):
                    bitti = True
                    return
                else:
                    raise RuntimeError(d.get("hata") or "EMA boş cevap verdi")
        finally:
            _EMA["son"] = time.monotonic()
            if not bitti:
                _ema_kapat()


# Testler sahte uretici koyar (tests/harness.py: «EMA calistirilmaz»).
VARSAYILAN_EMA = _ema_akis


def ema_parcalar(cfg, metin, calistir=None, bul=None):
    """Akisli uretim: PCM parcalari (EMA_HZ, 16 bit tek kanal). Bulunamazsa
    hic parca vermez; hata firlatabilir (cagiran yakalar)."""
    p = bul or ema_bul(cfg)
    if not p["bulundu"]:
        return iter(())
    return (calistir or VARSAYILAN_EMA)(p["python"], p["betik"], _temiz(metin), EMA_ZAMAN)


def ema(cfg, metin, calistir=None, bul=None):
    """(wav, not)."""
    p = bul or ema_bul(cfg)
    if not p["bulundu"]:
        return None, p["metin"]
    try:
        pcm = b"".join(ema_parcalar(cfg, metin, calistir=calistir, bul=p))
    except Exception as e:                      # noqa: BLE001
        return None, "EMA sesi üretemedi (%s)." % type(e).__name__
    if not pcm:
        return None, "EMA ses döndürmedi."
    return wav(pcm, EMA_HZ), ""


# ---------------------------------------------------------------- giris

def _temiz(metin):
    return " ".join(str(metin or "").split())[:EN_COK]


def seslendir(con, cfg, metin, tercih="oto", post=None, calistir=None, bul=None,
              ema_calistir=None, ema_bulgu=None):
    """{ok, wav?, motor?, notlar}. Sira kural 1."""
    t = _temiz(metin)
    if not t:
        return {"ok": False, "notlar": ["Okunacak metin yok."]}
    tercih = tercih if tercih in TERCIHLER else "oto"
    if tercih == "cihaz":
        return {"ok": False, "notlar": ["Cihazın kendi sesi seçili."]}
    sira = {"oto": ("gemini", "ema", "piper"), "gemini": ("gemini",), "ema": ("ema",),
            "piper": ("piper",)}[tercih]
    notlar = []
    for motor in sira:
        ses = settings(cfg)["gemini_ses"] if motor == "gemini" else motor
        anahtar = (motor, ses, t)
        with _KILIT:
            if anahtar in _ONBELLEK:
                _ONBELLEK.move_to_end(anahtar)
                return {"ok": True, "wav": _ONBELLEK[anahtar], "motor": motor, "notlar": notlar,
                        "onbellek": True}
        if motor == "gemini":
            veri, neden = gemini(con, cfg, t, post=post)
        elif motor == "ema":
            veri, neden = ema(cfg, t, calistir=ema_calistir, bul=ema_bulgu)
        else:
            veri, neden = piper(cfg, t, calistir=calistir, bul=bul)
        if veri:
            with _KILIT:
                _ONBELLEK[anahtar] = veri
                while len(_ONBELLEK) > ONBELLEK_EN_COK:
                    _ONBELLEK.popitem(last=False)
            return {"ok": True, "wav": veri, "motor": motor, "notlar": notlar}
        notlar.append(neden)
    return {"ok": False, "notlar": notlar}


def _wav_pcm(veri):
    """(hz, pcm) ya da None: yalniz 16 bit tek kanal WAV parcalanir."""
    try:
        with wave.open(io.BytesIO(veri)) as w:
            if w.getsampwidth() != 2 or w.getnchannels() != 1:
                return None
            return w.getframerate(), w.readframes(w.getnframes())
    except (wave.Error, EOFError):
        return None


def _biriktir(anahtar, ilk, kalan):
    """EMA parcalarini aynen verir; sona kadar okununca butunu onbellege yazar."""
    tum = [ilk]
    yield ilk
    for p in kalan:
        tum.append(p)
        yield p
    with _KILIT:
        _ONBELLEK[anahtar] = wav(b"".join(tum), EMA_HZ)
        while len(_ONBELLEK) > ONBELLEK_EN_COK:
            _ONBELLEK.popitem(last=False)


def akis(con, cfg, metin, tercih="oto", post=None, calistir=None, bul=None,
         ema_calistir=None, ema_bulgu=None):
    """King 3.0 K3: akisli ses. {ok, motor, hz, parcalar, notlar}; parcalar 16 bit
    tek kanal PCM. Sira seslendir ile ayni (kural 1). EMA ilk parcasi gelir gelmez
    doner: ilk kelime butun cumle uretilmeden calinir. Oteki motorlar tek parca."""
    t = _temiz(metin)
    if not t:
        return {"ok": False, "notlar": ["Okunacak metin yok."]}
    tercih = tercih if tercih in TERCIHLER else "oto"
    if tercih == "cihaz":
        return {"ok": False, "notlar": ["Cihazın kendi sesi seçili."]}
    sira = {"oto": ("gemini", "ema", "piper"), "gemini": ("gemini",), "ema": ("ema",),
            "piper": ("piper",)}[tercih]
    notlar = []
    for motor in sira:
        if motor != "ema":
            r = seslendir(con, cfg, t, motor, post=post, calistir=calistir, bul=bul)
            pcm = _wav_pcm(r["wav"]) if r["ok"] else None
            if pcm:
                return {"ok": True, "motor": motor, "hz": pcm[0], "parcalar": iter([pcm[1]]), "notlar": notlar}
            notlar.extend(r["notlar"] if not r["ok"] else ["%s sesi akışa uygun değil." % motor.capitalize()])
            continue
        anahtar = ("ema", "ema", t)
        with _KILIT:
            hazir = _ONBELLEK.get(anahtar)
        if hazir:
            pcm = _wav_pcm(hazir)
            return {"ok": True, "motor": "ema", "hz": pcm[0], "parcalar": iter([pcm[1]]), "notlar": notlar,
                    "onbellek": True}
        p = ema_bulgu or ema_bul(cfg)
        if not p["bulundu"]:
            notlar.append(p["metin"])
            continue
        try:
            g = iter(ema_parcalar(cfg, t, calistir=ema_calistir, bul=p))
            ilk = next(g, None)
        except Exception as e:                  # noqa: BLE001
            notlar.append("EMA sesi üretemedi (%s)." % type(e).__name__)
            continue
        if not ilk:
            notlar.append("EMA ses döndürmedi.")
            continue
        return {"ok": True, "motor": "ema", "hz": EMA_HZ, "parcalar": _biriktir(anahtar, ilk, g), "notlar": notlar}
    return {"ok": False, "notlar": notlar}


def durum(con, cfg):
    """Ayarlar karti: motorlarin hazirligi. Para harcamaz, ses uretmez."""
    g_ok, g_not = gemini_hazir(con, cfg)
    kalan = gemini_bekliyor()
    if g_ok and kalan:
        g_ok, g_not = False, "Gemini kotası dolu; yaklaşık %s sonra yeniden denenecek." % _sure_yaz(kalan)
    return {"ayar": settings(cfg), "sesler": list(GEMINI_SESLER), "tercihler": list(TERCIHLER),
            "gemini": {"hazir": g_ok, "not": g_not or "Gemini sesi hazır (internet gerekir).",
                       "model": GEMINI_MODEL, "bekliyor": kalan},
            "ema": ema_bul(cfg), "piper": piper_bul(cfg)}
