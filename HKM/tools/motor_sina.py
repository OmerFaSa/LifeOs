# -*- coding: utf-8 -*-
"""Motor servisi calisiyor mu — iki makine arasinda tek komutla sinama.

    python tools/motor_sina.py http://192.168.1.20:11434
    python tools/motor_sina.py http://192.168.1.20:11434 --model qwen2.5:7b
    python tools/motor_sina.py https://motor.ornek.com --jeton GIZLI

Sirayla: adres kurali (core/models.adres_denetle), model listesi ve suresi,
tek kisa sohbet cagrisi ve suresi. Hicbir sey yazmaz, para harcamaz (yerel
motor). CI'ya girmez: ag ister. Cikis kodu: 0 hepsi gecti, 1 bir adim kaldi.
"""
import argparse
import json
import os
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core import ai, models  # noqa: E402

SINIF_ADI = {"ayni_makine": "aynı makine", "yerel_ag": "yerel ağ", "internet": "internet (https)"}


def _get(url, jeton, timeout):
    baslik = {"Accept": "application/json"}
    if jeton:
        baslik["Authorization"] = "Bearer " + jeton
    r = urllib.request.Request(url, headers=baslik, method="GET")
    with urllib.request.urlopen(r, timeout=timeout) as y:
        return json.loads(y.read().decode("utf-8", "replace") or "{}")


def _post(url, jeton, govde, timeout):
    baslik = {"Content-Type": "application/json", "Authorization": "Bearer " + (jeton or "")}
    return ai._istek(url, baslik, govde, timeout)


def sina(adres, model=None, jeton=None, get=_get, post=_post, saat=time.monotonic):
    """(gecti_mi, satirlar). `get`/`post` testte sahtesiyle degisir."""
    satir = []
    kok = str(adres or "").strip().rstrip("/")
    ok_, hata, sinif = models.adres_denetle(kok)
    if not ok_:
        return False, ["✗ Adres: " + hata]
    satir.append("✓ Adres: %s · %s" % (kok, SINIF_ADI.get(sinif, sinif)))
    if sinif == "internet" and not jeton:
        satir.append("! Uyarı: internetteki motor jetonsuz; adresi bilen herkes kullanabilir.")

    t0 = saat()
    try:
        liste = [m.get("id") for m in (get(kok + "/v1/models", jeton, 10).get("data") or [])
                 if m.get("id")]
    except Exception as e:                      # noqa: BLE001
        satir.append("✗ Model listesi: ulaşılamadı (%s: %s)." % (type(e).__name__, e))
        satir.append("  Model bilgisayarında Ollama açık mı, OLLAMA_HOST=0.0.0.0:11434 "
                     "ayarlı mı, güvenlik duvarında 11434 açık mı?")
        return False, satir
    satir.append("✓ Model listesi: %d model · %d ms" % (len(liste), round((saat() - t0) * 1000)))
    if not liste:
        satir.append("✗ Motorda model yok: model bilgisayarında «ollama pull <model>» çalıştır.")
        return False, satir
    if model and model not in liste:
        satir.append("✗ «%s» motorda yok. Olanlar: %s" % (model, ", ".join(liste)))
        return False, satir
    secilen = model or liste[0]

    t0 = saat()
    try:
        y = post(kok + "/v1/chat/completions", jeton,
                 {"model": secilen, "max_tokens": 8,
                  "messages": [{"role": "user", "content": "Tek kelimeyle: merhaba"}]},
                 ai.UZAK_ZAMAN_ASIMI if sinif != "ayni_makine" else ai.ZAMAN_ASIMI)
    except Exception as e:                      # noqa: BLE001
        if ai._zaman_asimi_mi(e):
            satir.append("✗ Sohbet (%s): zamanında dönmedi. Model belleğe yükleniyor olabilir; "
                         "bir dakika sonra yeniden dene." % secilen)
        else:
            satir.append("✗ Sohbet (%s): %s: %s" % (secilen, type(e).__name__, e))
        return False, satir
    metin = (((y.get("choices") or [{}])[0].get("message") or {}).get("content") or "").strip()
    satir.append("✓ Sohbet (%s): %d ms · «%s»" % (secilen, round((saat() - t0) * 1000),
                                                   metin[:40] or "boş cevap"))
    satir.append("Motor hazır. LifeOS'ta Ayarlar → Nerede çalışsın → Motor adresi: " + kok)
    return True, satir


def main(argv=None):
    # Turkce Windows konsolu (cp1254) «✓» yazamaz.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    p = argparse.ArgumentParser(description="Motor servisini (Ollama, LM Studio…) sına.")
    p.add_argument("adres", help="ör. http://192.168.1.20:11434")
    p.add_argument("--model", help="sınanacak model (varsayılan: listedeki ilk)")
    p.add_argument("--jeton", help="motor jeton istiyorsa")
    a = p.parse_args(argv)
    gecti, satirlar = sina(a.adres, a.model, a.jeton)
    print("\n".join(satirlar))
    return 0 if gecti else 1


if __name__ == "__main__":
    sys.exit(main())
