#!/usr/bin/env python3
"""veri/temiz/ays/konu_dagilimi.jsonl -> AYS/src/js/data/sorusiklik.js

Yalniz YILLARA GORE yapilandirilmis tablo alinir: TYT Matematik, konu basina
2018-2025 soru sayisi (kaynak 'yks-dagilim-ozeldersalani', ikincil, etiket
'tahmin'). Ayni dosyadaki ozet satirlari (bolum adi cumle olan, yil vermeyen
toplamlar) alinmaz: hangi sinavin hangi yillari oldugu belli degil.

Bos hucre 'veri yok'tur (null); sifira cevrilmez. Sayilar toplanmaz,
yeniden yazilmaz; kaynaktaki seri aynen gider.

ESLEME asagida elle yazilidir ve yalniz AD eslemesidir (sayi degil): kaynak
konusu -> AYS konu kimlik(ler)i. Bir kaynak satiri birden cok AYS konusunu
kapsiyorsa («Problemler (toplam)») her birinde ayni seri «ortak» diye durur.

Kullanim: python tools/veri_ays_siklik.py [--denetle]
"""
import json
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
GIRDI = KOK / "veri" / "temiz" / "ays" / "konu_dagilimi.jsonl"
META = KOK / "veri" / "ham" / "yks-dagilim-ozeldersalani.meta.json"
CIKTI = KOK / "AYS" / "src" / "js" / "data" / "sorusiklik.js"
KAYNAK = "yks-dagilim-ozeldersalani"

ESLEME = {
    "Temel Kavramlar": ["tm-01"],
    "Sayı Basamakları": ["tm-02"],
    "Bölünebilme Kuralları": ["tm-03"],
    "Rasyonel Sayılar": ["tm-05"],
    "Mutlak Değer": ["tm-07"],
    "Üslü – Köklü Sayılar": ["tm-08", "tm-09"],
    "Oran – Orantı": ["tm-11"],
    "Problemler (toplam)": ["tm-13", "tm-14", "tm-15", "tm-16", "tm-17", "tm-18", "tm-19", "tm-20"],
    "Kümeler": ["tm-21"],
    "Mantık": ["tm-22"],
    "Fonksiyonlar": ["tm-23"],
    "Permütasyon – Kombinasyon": ["tm-26"],
    "Olasılık": ["tm-26"],
    "Veri – İstatistik": ["tm-27"],
}


def uret():
    satirlar = [json.loads(x) for x in GIRDI.read_text(encoding="utf-8").splitlines() if x.strip()]
    satirlar = [r for r in satirlar if r["kaynak"] == KAYNAK and r.get("yillar")]
    yillar = sorted({int(y) for r in satirlar for y in r["yillar"]})
    konular = {}
    eslenmeyen = []
    for r in satirlar:
        ids = ESLEME.get(r["konu"])
        if not ids:
            eslenmeyen.append(r["konu"])
            continue
        seri = [r["yillar"].get(str(y)) for y in yillar]
        for i in ids:
            konular.setdefault(i, []).append({"ad": r["konu"], "seri": seri, "ortak": len(ids) > 1})
    url = json.loads(META.read_text(encoding="utf-8"))["url"]
    govde = ",\n".join(f"    '{i}':{json.dumps(v, ensure_ascii=False, separators=(',', ':'))}" for i, v in sorted(konular.items()))
    metin = (
        "/* ÜRETİLMİŞ DOSYA — BURAYI DÜZENLEME. Kaynak: veri/temiz/ays/konu_dagilimi.jsonl,\n"
        "   üreten: python tools/veri_ays_siklik.py\n\n"
        "   TYT Matematik'te konu başına yıllık soru sayısı (ikincil kaynak, «tahmin»).\n"
        "   null = kaynakta yok; sıfır sayılmaz. Öncelik hesabına GİRMEZ (calc.js\n"
        "   konunun freq alanını kullanır); konu ekranında kanıt olarak çizilir. */\n\n"
        "window.R = window.R || {};\n\n"
        "R.SORU_SIKLIK = {\n"
        f"  kaynak:{json.dumps(url)},\n"
        "  etiket:'tahmin',\n"
        "  sinav:'TYT Matematik',\n"
        f"  yillar:{json.dumps(yillar)},\n"
        "  konular:{\n" + govde + ",\n  },\n};\n"
    )
    return metin, eslenmeyen


def main():
    metin, eslenmeyen = uret()
    if "--denetle" in sys.argv:
        ayni = CIKTI.exists() and CIKTI.read_text(encoding="utf-8") == metin
        print("sorusiklik.js " + ("guncel" if ayni else "ESKI: python tools/veri_ays_siklik.py"))
        return 0 if ayni else 1
    CIKTI.write_text(metin, encoding="utf-8")
    print(f"{CIKTI.relative_to(KOK)} yazildi; eslenmeyen (bilerek): {eslenmeyen}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
