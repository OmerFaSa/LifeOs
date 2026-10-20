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
   4. METIN DEGISTIRILMEZ: ne duyulduysa o; bos ses bos metindir. Konusma
      OLMAYAN sey metin degildir (sahada, 2026-10-19: Whisper sessizlikte
      «(Müzik çalıyor)», «(KAPI TIKTIK)» uyduruyordu, King «Müziği açtım»
      dedi): Whisper -sns ile calisir; «(...)», «[...]», «*...*», «♪»
      altyazi etiketleri ve Whisper'in bilinen sessizlik uydurmalari
      silinir. Geriye bir sey kalmazsa bos metindir.
   5. FIRLATMAZ: (metin, motor, notlar).
   6. GPU ONCE (2026-10-20, King 2.0 A). CUDA'li whisper.cpp (yaninda
      ggml-cuda.dll ve cublas64_*.dll) bulunursa en iyi model (large-v3-turbo)
      onunla calisir; olmazsa ya da hata verirse (GPU dolu) CPU'da small ile
      yeniden denenir. CPU'da turbo yavastir; CPU yolu small'u secer."""
import base64
import glob
import re
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


# Kural 6: ada gore kaba sira. GPU'da en iyi duyan once; CPU'da hizli olan.
GPU_SIRA = ("turbo", "large", "medium", "small", "base", "tiny")
CPU_SIRA = ("small", "base", "medium", "turbo", "large", "tiny")


def _cuda_mi(exe):
    d = os.path.dirname(exe)
    return os.path.isfile(os.path.join(d, "ggml-cuda.dll")) and bool(glob.glob(os.path.join(d, "cublas64_*.dll")))


def _exeler(aranan):
    """Bulunan whisper-cli'lar (CUDA klasoru once). main.exe yalniz o
    klasorde whisper-cli yoksa: yeni surumlerde main.exe bir uyari koprusudur."""
    out = []
    for d in aranan:
        for k in (os.path.join(d, "cuda", "Release"), os.path.join(d, "cuda"), d, os.path.join(d, "Release")):
            for ad in ("whisper-cli.exe", "whisper-cli", "main.exe"):
                p = os.path.join(k, ad)
                if os.path.isfile(p):
                    out.append(p)
                    break
    return out


def _modeller(dizinler):
    for d in dizinler:
        l = sorted(glob.glob(os.path.join(d, "ggml-*.bin")) + glob.glob(os.path.join(d, "*", "ggml-*.bin")))
        if l:
            return l
    return []


def _sec(modeller, sira):
    return sorted(modeller, key=lambda p: next((i for i, s in enumerate(sira) if s in os.path.basename(p)), 9))[0]


def whisper_bul(ara=None):
    """{bulundu, exe, model, cuda, yollar, aranan, metin}. Hicbir sey
    calistirmaz. `yollar` denenecek sira (kural 6); exe/model ilk yoldur."""
    aranan = _adaylar()
    exeler = _exeler(aranan)
    if not exeler:
        w = (ara or shutil.which)("whisper-cli")
        exeler = [w] if w else []
    gpu = next((e for e in exeler if _cuda_mi(e)), None)
    cpu = next((e for e in exeler if not _cuda_mi(e)), None)
    dizinler = []
    for e in exeler:
        dizinler += [os.path.dirname(e), os.path.dirname(os.path.dirname(e)),
                     os.path.dirname(os.path.dirname(os.path.dirname(e)))]
    modeller = _modeller(dizinler + aranan)
    yollar = []
    if modeller and gpu:
        yollar.append({"exe": gpu, "model": _sec(modeller, GPU_SIRA), "cuda": True})
    if modeller and (cpu or gpu):
        # CUDA'li ikili «-ng» ile CPU'da da calisir.
        yollar.append({"exe": cpu or gpu, "model": _sec(modeller, CPU_SIRA), "cuda": False, "ng": not cpu})
    ilk = yollar[0] if yollar else {}
    exe = ilk.get("exe") or (exeler[0] if exeler else None)
    if not exe:
        metin = "Whisper bu bilgisayarda yok. " + TAVSIYE
    elif not ilk:
        metin = ("Whisper bulundu ama modeli yok: ggml-large-v3-turbo-q5_0.bin ya da ggml-small.bin "
                 "dosyasını %s klasörüne koy." % aranan[0])
    else:
        metin = "Whisper hazır: %s (%s)." % (os.path.basename(ilk["model"]), "GPU" if ilk["cuda"] else "CPU")
        if len(yollar) > 1:
            metin += " GPU doluysa %s ile CPU’da." % os.path.basename(yollar[1]["model"])
    return {"bulundu": bool(ilk), "exe": exe, "model": ilk.get("model"), "cuda": bool(ilk.get("cuda")),
            "yollar": yollar, "aranan": aranan, "metin": metin}


def _calistir(exe, model, wav, timeout, ng=False):
    fd, yol = tempfile.mkstemp(suffix=".wav", prefix="hkm-dinle-")
    with os.fdopen(fd, "wb") as f:
        f.write(wav)
    try:
        bayrak = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        r = subprocess.run([exe, "-m", model, "-f", yol, "-l", "tr", "-nt", "-np", "-sns"] + (["-ng"] if ng else []),
                           capture_output=True, timeout=timeout, check=True, creationflags=bayrak)
        return r.stdout.decode("utf-8", "replace")
    finally:
        try:
            os.remove(yol)
        except OSError:
            pass


VARSAYILAN_CALISTIR = _calistir


ETIKET = re.compile(r"\([^()\n]{0,60}\)|\[[^\[\]\n]{0,60}\]|\*[^*\n]{0,60}\*|[♪♫]+")
# Whisper'in Turkce sessizlik uydurmalari (altyazi sonu kaliplari); yalniz
# metnin TAMAMI buysa silinir.
UYDURMA = re.compile(r"^(?:altyazı(?:\s+m\.?\s*k\.?)?|izlediğiniz için teşekkür(?:ler| ederim| ederiz)|"
                     r"abone olmayı unutmayın|beğenmeyi ve abone olmayı unutmayın|"
                     r"bir sonraki videoda görüşmek üzere|altyazılar? .{0,40} tarafından)[.!]*$", re.I)


def _temiz(metin):
    t = " ".join(ETIKET.sub(" ", str(metin or "")).split()).strip().strip("«»\"'").strip()
    if UYDURMA.match(t.replace("İ", "i").lower()) or not re.search(r"\w", t):
        return ""
    return t


def whisper(wav, calistir=None, bul=None):
    w = bul or whisper_bul()
    if not w["bulundu"]:
        return None, w["metin"]
    hata = None
    for y in w.get("yollar") or [{"exe": w["exe"], "model": w["model"]}]:
        try:
            ek = {"ng": True} if y.get("ng") else {}
            return _temiz((calistir or VARSAYILAN_CALISTIR)(y["exe"], y["model"], wav, WHISPER_ZAMAN, **ek)), ""
        except Exception as e:                  # noqa: BLE001 — kural 6: sonraki yol
            hata = e
    return None, "Whisper yazıya dökemedi (%s)." % type(hata).__name__


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
