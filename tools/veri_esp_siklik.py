#!/usr/bin/env python3
"""veri/temiz/esp/kelime_sikligi.jsonl -> ESP/src/js/data/kelimesiklik.js

ESP'nin calistigi her dil icin en sik N kelime, sira korunarak. Kaynak
OpenSubtitles 2018 sayimi (hermitdave/FrequencyWords, CC BY-SA 4.0); veri
katmaninda etiketi 'hesaplandı'.

Temizlik (yalniz atar, kelime uydurmaz):
  - kesme ile baslayan ya da biten parca ('s, 't, l', c') — derlemin
    kisaltmayi bolmesinden kalir, kendi basina kelime degildir
  - harf icermeyen satir (Arapca virgul, tatvil)
  - dilin gercek tek harfli kelimeleri disindaki tek harf
  - Ingilizcede kesmesi dusmus olumsuzluk parcasi (don, didn, isn ...)

Kullanim: python tools/veri_esp_siklik.py [--n 2000] [--denetle]
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
GIRDI = KOK / "veri" / "temiz" / "esp" / "kelime_sikligi.jsonl"
CIKTI = KOK / "ESP" / "src" / "js" / "data" / "kelimesiklik.js"

DILLER = ["en", "de", "fr", "es", "it", "ru", "ar"]   # ESP.LANGS ile kesisim (la listesi yok)
TEK_HARF = {
    "en": {"a", "i"}, "de": set(), "fr": {"a", "à", "y"}, "es": {"a", "y", "o", "e", "u"},
    "it": {"a", "e", "è", "o", "i"}, "ru": {"в", "и", "с", "к", "у", "о", "я", "а"}, "ar": {"و"},
}
EN_PARCA = {"don", "didn", "doesn", "isn", "wasn", "aren", "couldn", "wouldn", "haven", "hasn",
            "shouldn", "weren", "hadn", "ain", "mustn", "needn"}


def temiz_mi(dil, k):
    if not k or k[0] == "'" or k[-1] == "'" or not any(ch.isalpha() for ch in k):
        return False
    if len(k) == 1 and k not in TEK_HARF[dil]:
        return False
    return not (dil == "en" and k in EN_PARCA)


def uret(n):
    satirlar = defaultdict(list)
    kaynak = lisans = None
    for line in GIRDI.read_text(encoding="utf-8").splitlines():
        r = json.loads(line)
        if r["dil"] in DILLER:
            satirlar[r["dil"]].append((r["sira"], r["kelime"].lower()))
            kaynak, lisans = r["kaynak"], r["lisans"]
    diller = {}
    for dil in DILLER:
        gorulen, liste = set(), []
        for _, k in sorted(satirlar[dil]):
            if temiz_mi(dil, k) and k not in gorulen:
                gorulen.add(k)
                liste.append(k)
            if len(liste) == n:
                break
        diller[dil] = liste
    govde = ",\n".join(f"    {dil}:{json.dumps(' '.join(l), ensure_ascii=False)}" for dil, l in diller.items())
    return (
        "/* ÜRETİLMİŞ DOSYA — BURAYI DÜZENLEME. Kaynak: veri/temiz/esp/kelime_sikligi.jsonl,\n"
        "   üreten: python tools/veri_esp_siklik.py\n\n"
        "   Dil başına en sık kelimeler, sıra korunarak, boşlukla ayrılmış.\n"
        "   Sayım kaynağın kendisidir (hesaplandı); kişinin bildiği kelime\n"
        "   DEĞİLDİR. Kapsam hesabı core/siklik.js'te. */\n\n"
        "window.ESP = window.ESP || {};\n\n"
        "ESP.KELIME_SIKLIK = {\n"
        f"  kaynak:{json.dumps(kaynak, ensure_ascii=False)},\n"
        f"  lisans:{json.dumps(lisans)},\n"
        "  etiket:'hesaplandı',\n"
        f"  n:{n},\n"
        "  diller:{\n" + govde + ",\n  },\n};\n"
    )


def main():
    n = int(sys.argv[sys.argv.index("--n") + 1]) if "--n" in sys.argv else 2000
    metin = uret(n)
    if "--denetle" in sys.argv:
        ayni = CIKTI.exists() and CIKTI.read_text(encoding="utf-8") == metin
        print("kelimesiklik.js " + ("guncel" if ayni else "ESKI: python tools/veri_esp_siklik.py"))
        return 0 if ayni else 1
    CIKTI.write_text(metin, encoding="utf-8")
    print(f"{CIKTI.relative_to(KOK)} yazildi ({CIKTI.stat().st_size / 1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
