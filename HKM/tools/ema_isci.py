# -*- coding: utf-8 -*-
"""EMA Lightning iscisi — core/ses.py bunu EMA'nin KENDI sanal ortaminda
   (venv) ayri bir surec olarak calistirir; HKM sifir bagimlilik kalir
   (Piper gibi: HKM kurmaz, indirmez, yalniz cagirir).

   Protokol (stdin/stdout, satir basina bir JSON, yalniz ASCII):
     acilista bir kez   <- {"hazir": true, "cihaz": "cuda"|"cpu", "sn": 3.2}
     istek              -> {"metin": "...", "hz": 24000}
     parca parca (akis) <- {"pcm": "<base64, 16 bit tek kanal PCM>"}
     sonda              <- {"son": true, "sn": 0.41}  ya da  {"hata": "..."}

   Agirliklar INDIRILMEZ (HF_HUB_OFFLINE=1): kurulumda bir kez iner.
   Kutuphanelerin kendi yazdiklari stderr'e gider; stdout yalniz protokoldur."""
import base64
import json
import os
import sys
import time

os.environ.setdefault("HF_HUB_OFFLINE", "1")
_CIKIS = sys.stdout
sys.stdout = sys.stderr


def yaz(d):
    _CIKIS.write(json.dumps(d) + "\n")
    _CIKIS.flush()


def main():
    t0 = time.perf_counter()
    try:
        import numpy as np
        import torch
        from ema_lightning import EMA
        tts = EMA()
        # Tek kullanici: kucuk parti VRAM'i Ollama'ya birakir (olculen:
        # ilk tur olcumu 16'yi secip ~5,6 GB ayirdi; 6 GB kartta model sigmaz).
        if hasattr(tts, "_batch_size"):
            tts._batch_size = int(os.environ.get("EMA_PARTI") or 4)
    except Exception as e:                      # noqa: BLE001
        yaz({"hata": "EMA yüklenemedi (%s): %s" % (type(e).__name__, str(e)[:200])})
        return 1
    yaz({"hazir": True, "cihaz": "cuda" if torch.cuda.is_available() else "cpu",
         "sn": round(time.perf_counter() - t0, 2)})
    for satir in sys.stdin.buffer:
        try:
            istek = json.loads(satir.decode("utf-8"))
            t1 = time.perf_counter()
            for parca in tts.stream(str(istek.get("metin") or ""), sample_rate=int(istek.get("hz") or 24000)):
                pcm = (np.clip(np.asarray(parca, dtype="float32"), -1.0, 1.0) * 32767).astype("<i2").tobytes()
                yaz({"pcm": base64.b64encode(pcm).decode("ascii")})
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            yaz({"son": True, "sn": round(time.perf_counter() - t1, 3)})
        except Exception as e:                  # noqa: BLE001
            yaz({"hata": "%s: %s" % (type(e).__name__, str(e)[:200])})
    return 0


if __name__ == "__main__":
    sys.exit(main())
