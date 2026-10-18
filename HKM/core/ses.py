# -*- coding: utf-8 -*-
"""Ses — King'in sesi (kullanici, 2026-10-19: «internete bagliyken Gemini,
   yerelde Piper; PC, telefon ve tablet icin; ayarlanabilsin»).

   Tarayicinin kendi sesi PC'de tek Turkce sestir (Microsoft Tolga) ve
   robotiktir; King bulut seslerini (Edge «Online») bilerek secmez. Bu
   modul sesi SUNUCUDA uretir; modul King'i ondan WAV ister, alamazsa
   cihazin kendi sesine duser (brand/ortak/king.js soz 28).

   Yedi kural:

   1. SIRA KODDUR. «oto»: once Gemini (internet + Google anahtari + butce),
      olmazsa Piper (bu bilgisayarda), olmazsa «yok» — cihaz sesi. «gemini»
      ve «piper» yalniz kendisini dener.
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
      adiyla soyler."""
import base64
import collections
import glob
import io
import json
import os
import shutil
import subprocess
import tempfile
import threading
import urllib.error
import urllib.request
import wave

from core import butce, models

TERCIHLER = ("oto", "gemini", "piper", "cihaz")
GEMINI_MODEL = "gemini-2.5-flash-preview-tts"
# Gemini'nin hazir sesleri (speechConfig.prebuiltVoiceConfig.voiceName).
GEMINI_SESLER = ("Kore", "Zephyr", "Puck", "Charon", "Fenrir", "Leda", "Orus", "Aoede",
                 "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba",
                 "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar",
                 "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi",
                 "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat")
VARSAYILAN = {"gemini_ses": "Kore", "piper_yol": ""}
EN_COK = 1500
GEMINI_ZAMAN = 25
PIPER_ZAMAN = 40
ORNEK_HZ = 24000                    # Gemini: 16 bit, tek kanal, 24 kHz PCM
# Tahmini fiyat (USD / 1M jeton): metin girisi ve ses cikisi.
FIYAT = {"giris": 0.5, "cikis": 10.0}
ONBELLEK_EN_COK = 64
_ONBELLEK = collections.OrderedDict()
_KILIT = threading.Lock()


def settings(cfg):
    out = dict(VARSAYILAN)
    g = (cfg or {}).get("ses")
    if isinstance(g, dict):
        if g.get("gemini_ses") in GEMINI_SESLER:
            out["gemini_ses"] = g["gemini_ses"]
        if isinstance(g.get("piper_yol"), str):
            out["piper_yol"] = g["piper_yol"].strip()
    return out


def validate(patch):
    if not isinstance(patch, dict):
        return False, ["ses bir nesne olmalı"]
    hata = []
    for k, v in patch.items():
        if k == "gemini_ses":
            if v not in GEMINI_SESLER:
                hata.append("ses.gemini_ses tanımlı bir Gemini sesi olmalı")
        elif k == "piper_yol":
            if not isinstance(v, str) or len(v) > 400:
                hata.append("ses.piper_yol bir klasör ya da dosya yolu olmalı")
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


# ---------------------------------------------------------------- giris

def _temiz(metin):
    return " ".join(str(metin or "").split())[:EN_COK]


def seslendir(con, cfg, metin, tercih="oto", post=None, calistir=None, bul=None):
    """{ok, wav?, motor?, notlar}. Sira kural 1."""
    t = _temiz(metin)
    if not t:
        return {"ok": False, "notlar": ["Okunacak metin yok."]}
    tercih = tercih if tercih in TERCIHLER else "oto"
    if tercih == "cihaz":
        return {"ok": False, "notlar": ["Cihazın kendi sesi seçili."]}
    sira = {"oto": ("gemini", "piper"), "gemini": ("gemini",), "piper": ("piper",)}[tercih]
    notlar = []
    for motor in sira:
        ses = settings(cfg)["gemini_ses"] if motor == "gemini" else "piper"
        anahtar = (motor, ses, t)
        with _KILIT:
            if anahtar in _ONBELLEK:
                _ONBELLEK.move_to_end(anahtar)
                return {"ok": True, "wav": _ONBELLEK[anahtar], "motor": motor, "notlar": notlar,
                        "onbellek": True}
        if motor == "gemini":
            veri, neden = gemini(con, cfg, t, post=post)
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


def durum(con, cfg):
    """Ayarlar karti: iki motorun hazirligi. Para harcamaz, ses uretmez."""
    g_ok, g_not = gemini_hazir(con, cfg)
    return {"ayar": settings(cfg), "sesler": list(GEMINI_SESLER), "tercihler": list(TERCIHLER),
            "gemini": {"hazir": g_ok, "not": g_not or "Gemini sesi hazır (internet gerekir).",
                       "model": GEMINI_MODEL},
            "piper": piper_bul(cfg)}
