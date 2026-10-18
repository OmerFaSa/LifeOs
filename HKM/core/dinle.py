# -*- coding: utf-8 -*-
"""Dinle — konusmayi yaziya dokmek (kullanici, 2026-10-19: «ses algilamayi
   AI ve Whisper olarak yap; Whisper yuklu olan PC Whisper'i, olmayan AI'yi
   secsin; Whisper inerse API'siz calisir, tavsiye edilir»).

   Tarayicinin kendi tanimasi masaustu uygulamasinda calismiyor (Chrome onu
   Google'in sunucusunda yapar). King sesi kaydeder, 16 kHz WAV olarak
   buraya yollar; metin geri doner.

   Bes kural:

   1. SIRA KODDUR. «oto»: bu bilgisayarda Whisper (whisper.cpp) varsa o;
      yoksa Gemini (yapay zeka, ucretli, ses Google'a gider). Ikisi de
      yoksa «yok» doner ve King tarayicinin tanimasina duser.
   2. WHISPER YERELDIR: ses makineden cikmaz, ucretsizdir. HKM onu KURMAZ;
      bilinen klasorlerde whisper-cli.exe ve ggml-*.bin arar (core/ses.py
      Piper gibi).
   3. GEMINI butce kapisindan gecer, her cagri deftere yazilir.
   4. METIN DEGISTIRILMEZ: ne duyulduysa o; bos ses bos metindir.
   5. FIRLATMAZ: (metin, motor, notlar)."""
import base64
import glob
import os
import shutil
import subprocess
import tempfile

from core import butce, models, ses

GEMINI_MODEL = "gemini-2.5-flash"
EN_COK_BAYT = 4 * 1024 * 1024          # ~2 dakika 16 kHz tek kanal
WHISPER_ZAMAN = 120
ISTEM = ("Bu ses kaydını Türkçe olarak kelimesi kelimesine yazıya dök. Yalnız söylenen metni yaz; "
         "açıklama, tırnak ya da başlık ekleme. Konuşma yoksa hiçbir şey yazma.")
TAVSIYE = ("Whisper bu bilgisayara inerse ses algılama API’siz, ücretsiz ve internetsiz çalışır "
           "(tavsiye edilir).")


def _adaylar():
    kok = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ev = os.path.expanduser("~")
    yerel = os.environ.get("LOCALAPPDATA") or os.path.join(ev, "AppData", "Local")
    return [os.path.join(yerel, "Programs", "whisper"), os.path.join(kok, "whisper"),
            os.path.join(yerel, "whisper"), os.path.join(ev, "whisper")]


def whisper_bul(ara=None):
    """{bulundu, exe, model, aranan, metin}. Hicbir sey calistirmaz."""
    aranan = _adaylar()
    exe = None
    for d in aranan:
        for ad in ("whisper-cli.exe", "main.exe", "whisper-cli"):
            for p in (os.path.join(d, ad), os.path.join(d, "Release", ad)):
                if os.path.isfile(p):
                    exe = p
                    break
            if exe:
                break
        if exe:
            break
    if not exe:
        exe = (ara or shutil.which)("whisper-cli") or None
    model = None
    for d in ([os.path.dirname(exe), os.path.dirname(os.path.dirname(exe))] if exe else []) + aranan:
        l = sorted(glob.glob(os.path.join(d, "ggml-*.bin")) + glob.glob(os.path.join(d, "*", "ggml-*.bin")))
        if l:
            # Buyuk model daha iyi duyar: small > base > tiny (ada gore kaba sira).
            sira = ("large", "medium", "small", "base", "tiny")
            l.sort(key=lambda p: next((i for i, s in enumerate(sira) if s in os.path.basename(p)), 9))
            model = l[0]
            break
    if not exe:
        metin = "Whisper bu bilgisayarda yok. " + TAVSIYE
    elif not model:
        metin = "Whisper bulundu ama modeli yok: ggml-small.bin dosyasını %s klasörüne koy." % os.path.dirname(exe)
    else:
        metin = "Whisper hazır: %s." % os.path.basename(model)
    return {"bulundu": bool(exe and model), "exe": exe, "model": model, "aranan": aranan, "metin": metin}


def _calistir(exe, model, wav, timeout):
    fd, yol = tempfile.mkstemp(suffix=".wav", prefix="hkm-dinle-")
    with os.fdopen(fd, "wb") as f:
        f.write(wav)
    try:
        bayrak = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        r = subprocess.run([exe, "-m", model, "-f", yol, "-l", "tr", "-nt", "-np"],
                           capture_output=True, timeout=timeout, check=True, creationflags=bayrak)
        return r.stdout.decode("utf-8", "replace")
    finally:
        try:
            os.remove(yol)
        except OSError:
            pass


VARSAYILAN_CALISTIR = _calistir


def _temiz(metin):
    return " ".join(str(metin or "").split()).strip().strip("«»\"'")


def whisper(wav, calistir=None, bul=None):
    w = bul or whisper_bul()
    if not w["bulundu"]:
        return None, w["metin"]
    try:
        return _temiz((calistir or VARSAYILAN_CALISTIR)(w["exe"], w["model"], wav, WHISPER_ZAMAN)), ""
    except Exception as e:                      # noqa: BLE001
        return None, "Whisper yazıya dökemedi (%s)." % type(e).__name__


def gemini(con, cfg, wav, post=None):
    ok, neden = ses.gemini_hazir(con, cfg)
    if not ok:
        return None, neden
    url = "%s/%s:generateContent" % (models.PROVIDERS["google"]["base"], GEMINI_MODEL)
    govde = {"contents": [{"parts": [{"text": ISTEM}, {"inlineData": {
        "mimeType": "audio/wav", "data": base64.b64encode(wav).decode("ascii")}}]}]}
    try:
        y = (post or ses.VARSAYILAN_POST)(url, {"Content-Type": "application/json",
                                                "x-goog-api-key": models.key_value(cfg, "google")},
                                          govde, 40)
    except Exception as e:                      # noqa: BLE001
        butce.record(con, role="dinle", task="stt", provider="google", model=GEMINI_MODEL,
                     ok=False, note="dinle: %s" % (getattr(e, "code", None) or type(e).__name__))
        return None, "Gemini’ye ulaşılamadı (internet yok ya da yanıt gelmedi)."
    k = y.get("usageMetadata") or {}
    gir, cik = int(k.get("promptTokenCount") or 0), int(k.get("candidatesTokenCount") or 0)
    # Tahmini: ses girisi 1 USD / 1M, metin cikisi 2,5 USD / 1M (flash).
    butce.record(con, role="dinle", task="stt", provider="google", model=GEMINI_MODEL,
                 in_tok=gir, out_tok=cik, usd=(gir * 1.0 + cik * 2.5) / 1e6, note="dinle; tahmini-fiyat")
    parca = (((y.get("candidates") or [{}])[0].get("content") or {}).get("parts")) or []
    return _temiz(" ".join(p.get("text", "") for p in parca)), ""


def yaziya(con, cfg, wav, post=None, calistir=None, bul=None, tercih="oto"):
    """{ok, metin?, motor?, notlar}. Sira kural 1; tercih: oto | whisper | ai."""
    if not wav or len(wav) > EN_COK_BAYT or wav[:4] != b"RIFF":
        return {"ok": False, "notlar": ["Ses kaydı geçersiz ya da çok uzun."]}
    notlar = []
    sira = {"whisper": ("whisper",), "ai": ("gemini",)}.get(tercih, ("whisper", "gemini"))
    for motor in sira:
        metin, neden = whisper(wav, calistir, bul) if motor == "whisper" else gemini(con, cfg, wav, post)
        if metin is not None:
            return {"ok": True, "metin": metin, "motor": motor, "notlar": notlar}
        notlar.append(neden)
    return {"ok": False, "notlar": notlar}


def durum(con, cfg):
    g_ok, g_not = ses.gemini_hazir(con, cfg)
    w = whisper_bul()
    return {"whisper": w, "gemini": {"hazir": g_ok, "not": g_not or "Gemini hazır (internet gerekir, ücretli)."},
            "motor": "whisper" if w["bulundu"] else ("gemini" if g_ok else "tarayici"), "tavsiye": TAVSIYE}
