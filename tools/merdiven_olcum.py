#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""KING-4 A6 model merdiveni ölçüm aracı (görev 063).

Kolay iş yerel modelde, zor iş bulutta çalışır; bulut kotası
(429/RESOURCE_EXHAUSTED) dolunca yerele düşülür.

Kullanım:
    python tools/merdiven_olcum.py [--kuru] [--kota] [--yerel MODEL] [--bulut MODEL] [--json]
"""
import argparse
import copy
import io
import json
import os
import sys
import tempfile
import time
import urllib.error

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(KOK, "HKM"))

from core import ai, butce, db, models, motor, seviye

KOTA_GOVDE = json.dumps({"error": {"message": "RESOURCE_EXHAUSTED: Quota exceeded. Please retry in 120s."}}).encode("utf-8")

MESAJLAR = [
    "selam, nasılsın?",
    "teşekkürler King",
    "45 dk koştum cümlesi hangi modüle ait? tek kelime",
    "bugün için tek cümlelik sabah brifingi yaz",
    "önümüzdeki iki hafta için AYS çalışma planı çıkar, gün gün",
    "sabah mı akşam mı çalışmalıyım, karar ver ve gerekçelendir",
]


def _sahte_tasiyici(kota=False):
    def t(provider, anahtar, model, sistem, mesajlar, *args, **kwargs):
        if kota and provider == "google":
            raise urllib.error.HTTPError(
                "https://generativelanguage.googleapis.com",
                429,
                "Too Many Requests",
                {},
                io.BytesIO(KOTA_GOVDE)
            )
        return "Tamam.", 10, 3
    return t


def ayar_hazirla(kuru=False, yerel="gemma4:e2b", bulut="gemini-3.6-flash"):
    if kuru:
        taban = {
            "local_token": "x",
            "budget": {"ceiling_currency": "usd", "monthly_usd": 20.0}
        }
        yama = {
            "keys": {"google": "g-test"},
            "yer": "hibrit",
            "yerel": {"ekonomik": yerel},
            "assignments": {
                "king": {
                    "provider": "google",
                    "model": bulut
                }
            }
        }
        return models.apply(taban, yama)
    else:
        config_yol = os.path.join(KOK, "HKM", "config.json")
        taban = {"host": "127.0.0.1", "port": 4200, "local_token": ""}
        if os.path.exists(config_yol):
            try:
                with open(config_yol, "r", encoding="utf-8") as f:
                    taban.update(json.load(f))
            except Exception:
                pass
        kopya = copy.deepcopy(taban)
        yama = {
            "yer": "hibrit",
            "yerel": {"ekonomik": yerel},
            "assignments": {
                "king": {
                    "provider": "google",
                    "model": bulut
                }
            }
        }
        return models.apply(kopya, yama)


def parse_args():
    parser = argparse.ArgumentParser(description="KING-4 A6 Model merdiveni ölçüm aracı")
    parser.add_argument("--kuru", action="store_true", help="Ağ yok, sahte sağlayıcı kullanır")
    parser.add_argument("--kota", action="store_true", help="Kuru koşuda 429 kota hatası simüle eder")
    parser.add_argument("--yerel", default="gemma4:e2b", help="Yerel model adı (varsayılan: gemma4:e2b)")
    parser.add_argument("--bulut", default="gemini-3.6-flash", help="Bulut model adı (varsayılan: gemini-3.6-flash)")
    parser.add_argument("--json", action="store_true", help="JSON çıktısı verir")
    return parser.parse_args()


def tablo_yazdir(satirlar, seviyeler, dususler):
    baslik = f"{'Metin':<38} {'Seviye':<8} {'Kat':<7} {'Model':<18} {'ms':>6} {'Giriş':>6} {'Çıkış':>6}  {'Neden'}"
    print(baslik)
    print("-" * 110)
    for s in satirlar:
        metin_kisa = (s["metin"][:35] + "…") if len(s["metin"]) > 36 else s["metin"]
        kat_str = s["kat"] or "-"
        model_str = s["model"] or "-"
        neden_str = s["neden"] or "-"
        print(f"{metin_kisa:<38} {s['seviye']:<8} {kat_str:<7} {model_str:<18} {s['ms']:>6} {s['giris']:>6} {s['cikis']:>6}  {neden_str}")
    print()
    if seviyeler:
        kirilim = ", ".join(f"{x.get('seviye', '-')}: {x.get('cagri', 0)} çağrı" for x in seviyeler)
        print(f"Seviyeler kırılımı: {kirilim}")
    if dususler:
        print(f"Düşüşler ({len(dususler)} adet):")
        for d in dususler:
            print(f"  - {d.get('at', '')} {d.get('provider', '')}/{d.get('model', '')} -> {d.get('neden', '')}")


def main():
    args = parse_args()
    motor.kota_sifirla()
    cfg = ayar_hazirla(kuru=args.kuru, yerel=args.yerel, bulut=args.bulut)
    transport = _sahte_tasiyici(kota=args.kota) if args.kuru else None

    with tempfile.TemporaryDirectory() as td:
        db_yol = os.path.join(td, "gecici_hkm.db")
        con = db.connect(db_yol)
        try:
            satirlar = []
            for metin in MESAJLAR:
                sev_sonuc = seviye.sinifla(metin)
                sev = sev_sonuc["seviye"]
                t0 = time.perf_counter()
                try:
                    r = ai.ask(con, cfg, "king", "sohbet", [{"role": "user", "content": metin}],
                               baglam="", sistem="", transport=transport, seviye=sev)
                except Exception as e:
                    # Canlı koşu çökmeyecek, hata satırı oluşturacak
                    r = {"ok": False, "note": str(e), "model": "", "motor": {"kat": None, "kat_neden": f"hata: {e}"}}
                t1 = time.perf_counter()
                ms = int((t1 - t0) * 1000)

                kat = (r.get("motor") or {}).get("kat")
                neden = (r.get("motor") or {}).get("kat_neden") or r.get("note") or r.get("reason")
                model = r.get("model") or ""
                giris = int(r.get("in_tok") or 0)
                cikis = int(r.get("out_tok") or 0)

                satirlar.append({
                    "metin": metin,
                    "seviye": sev,
                    "kat": kat,
                    "neden": neden,
                    "model": model,
                    "ms": ms,
                    "giris": giris,
                    "cikis": cikis
                })

            olcum = butce.ai_olcum(con)
            seviyeler = olcum.get("seviyeler") or []
            dususler = olcum.get("dususler") or []
        finally:
            con.close()

    if getattr(args, "json", False):
        cikti = {
            "satirlar": satirlar,
            "seviyeler": seviyeler,
            "dususler": dususler
        }
        print(json.dumps(cikti, ensure_ascii=False, indent=2))
    else:
        tablo_yazdir(satirlar, seviyeler, dususler)


if __name__ == "__main__":
    main()
