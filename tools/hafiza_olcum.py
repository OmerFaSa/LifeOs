#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hafıza arama ölçüm aracı (KING-4 B, görev 050).

Kök eşlemesi ile gömme aramasının doğruluk (p1, p3) ve gecikme (ms)
karşılaştırmasını ölçer.

Kullanım:
    python tools/hafiza_olcum.py [--ollama http://127.0.0.1:11434] [--json çıktı.json]
"""
import argparse
import json
import os
import statistics
import sys
import time

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(KOK, "HKM"))

from core import db, memory


def parse_args():
    parser = argparse.ArgumentParser(description="Hafıza arama ölçüm aracı")
    parser.add_argument("--ollama", default="http://127.0.0.1:11434", help="Ollama adresi")
    parser.add_argument("--json", dest="json_out", default=None, help="Çıktı JSON dosya yolu")
    return parser.parse_args()


def main():
    args = parse_args()
    ollama_adres = args.ollama.rstrip("/")

    kume_yol = os.path.join(KOK, "tools", "hafiza_olcum_kume.json")
    with open(kume_yol, "r", encoding="utf-8") as f:
        kume = json.load(f)

    con = db.connect(":memory:")
    for c in kume:
        memory.add(con, c["bilgi"])

    # 1. Kök ölçümü
    kok_p1_count = 0
    kok_p3_count = 0
    kok_sureler = []

    for c in kume:
        soru = c["soru"]
        dogru = c["bilgi"]
        t0 = time.perf_counter()
        r = memory.ara(con, None, soru, k=3)
        t1 = time.perf_counter()
        kok_sureler.append((t1 - t0) * 1000)

        sonuclar = r.get("sonuclar", [])
        if sonuclar and sonuclar[0]["metin"] == dogru:
            kok_p1_count += 1
        if any(s["metin"] == dogru for s in sonuclar[:3]):
            kok_p3_count += 1

    n = len(kume)
    kok_p1 = round(kok_p1_count / n, 4) if n else 0.0
    kok_p3 = round(kok_p3_count / n, 4) if n else 0.0
    kok_ms = round(statistics.median(kok_sureler), 1) if kok_sureler else 0.0

    # 2. Gömme ölçümü
    cfg = {"models": {"yerel_adres": ollama_adres}}

    gomme_p1_count = 0
    gomme_p3_count = 0
    ilk_ms = None
    gomme_sureler = []
    dogru_benzerlikler = []
    yanlis_benzerlikler = []
    motor_var = True

    for idx, c in enumerate(kume):
        soru = c["soru"]
        dogru = c["bilgi"]
        t0 = time.perf_counter()
        r = memory.ara(con, cfg, soru, k=3)
        t1 = time.perf_counter()
        sure_ms = (t1 - t0) * 1000

        if r.get("yontem") != "gomme":
            motor_var = False
            break

        if idx == 0:
            ilk_ms = sure_ms
        else:
            gomme_sureler.append(sure_ms)

        sonuclar = r.get("sonuclar", [])
        if sonuclar and sonuclar[0]["metin"] == dogru:
            gomme_p1_count += 1
        if any(s["metin"] == dogru for s in sonuclar[:3]):
            gomme_p3_count += 1

        dogru_item = next((s for s in sonuclar if s["metin"] == dogru), None)
        if dogru_item:
            dogru_benzerlikler.append(dogru_item["benzerlik"])

        yanlis_item = next((s for s in sonuclar if s["metin"] != dogru), None)
        if yanlis_item:
            yanlis_benzerlikler.append(yanlis_item["benzerlik"])

    if motor_var:
        gomme_p1 = round(gomme_p1_count / n, 4) if n else 0.0
        gomme_p3 = round(gomme_p3_count / n, 4) if n else 0.0
        gomme_ms = round(statistics.median(gomme_sureler), 1) if gomme_sureler else (round(ilk_ms, 1) if ilk_ms is not None else 0.0)
        ilk_ms_val = round(ilk_ms, 1) if ilk_ms is not None else 0.0
        d_sim = round(statistics.median(dogru_benzerlikler), 3) if dogru_benzerlikler else 0.0
        y_sim = round(statistics.median(yanlis_benzerlikler), 3) if yanlis_benzerlikler else 0.0

        gomme_sonuc = {
            "p1": gomme_p1,
            "p3": gomme_p3,
            "ilk_ms": ilk_ms_val,
            "ms": gomme_ms,
            "dogru_benzerlik": d_sim,
            "yanlis_benzerlik": y_sim
        }
    else:
        gomme_sonuc = None

    cikti = {
        "kume": n,
        "motor": motor_var,
        "kok": {
            "p1": kok_p1,
            "p3": kok_p3
        },
        "gomme": gomme_sonuc
    }

    # Ekrana tek tablo
    print("\n{:<10} {:<10} {:<10} {:<10}".format("Yöntem", "p1", "p3", "ms"))
    print("-" * 42)
    print("{:<10} {:<10.3f} {:<10.3f} {:<10.1f}".format("kok", kok_p1, kok_p3, kok_ms))
    if motor_var and gomme_sonuc:
        print("{:<10} {:<10.3f} {:<10.3f} {:<10.1f}".format("gomme", gomme_sonuc["p1"], gomme_sonuc["p3"], gomme_sonuc["ms"]))
    else:
        print("{:<10} {:<30}".format("gomme", "(motor yok)"))

    if args.json_out:
        os.makedirs(os.path.dirname(os.path.abspath(args.json_out)), exist_ok=True)
        with open(args.json_out, "w", encoding="utf-8") as f:
            json.dump(cikti, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
