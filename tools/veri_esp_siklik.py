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

Ikinci cikti kelimeornek.js: listedeki kelimenin gectigi EN KISA Tatoeba
cumle cifti (yabanci + Turkce, CC BY 2.0 FR). Cumle aynen alinir; kelime
cumlede ayri sozcuk olarak gecmiyorsa ornek yoktur (uydurulmaz).

Kullanim: python tools/veri_esp_siklik.py [--n 2000] [--denetle]
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
GIRDI = KOK / "veri" / "temiz" / "esp" / "kelime_sikligi.jsonl"
CIKTI = KOK / "ESP" / "src" / "js" / "data" / "kelimesiklik.js"
CUMLE = [KOK / "veri" / "temiz" / "esp" / f for f in ("cumle_ciftleri.jsonl", "cumle_ciftleri_ek.jsonl")]
ORNEK = KOK / "ESP" / "src" / "js" / "data" / "kelimeornek.js"
TATOEBA = {"eng":"en", "deu":"de", "fra":"fr", "spa":"es", "ita":"it", "rus":"ru", "ara":"ar"}

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


SOZCUK = re.compile(r"[^\W\d_]+(?:['’][^\W\d_]+)*")


def ornekler(diller):
    """{dil: {kelime: [yabanci, turkce, tatoeba_id]}} — kelime basina en kisa cumle."""
    cift = defaultdict(list)
    for f in CUMLE:
        if not f.exists():
            continue
        for line in f.read_text(encoding="utf-8").splitlines():
            r = json.loads(line)
            dil = TATOEBA.get(r["hedef_dil"])
            if dil and 8 <= len(r["yabanci"]) <= 90:
                cift[dil].append((len(r["yabanci"]), r["tatoeba_id"], r["yabanci"], r["turkce"]))
    out = {}
    for dil, liste in diller.items():
        aranan, bulunan = set(liste), {}
        for _, tid, yab, tr in sorted(cift[dil]):
            for k in {w.lower() for w in SOZCUK.findall(yab)} & aranan:
                bulunan.setdefault(k, [yab, tr, tid])
        out[dil] = {k: bulunan[k] for k in liste if k in bulunan}
    return out


def uret_ornek(diller):
    o = ornekler(diller)
    govde = ",\n".join(f"    {dil}:{json.dumps(v, ensure_ascii=False, separators=(',', ':'))}" for dil, v in o.items())
    return (
        "/* ÜRETİLMİŞ DOSYA — BURAYI DÜZENLEME. Kaynak: veri/temiz/esp/cumle_ciftleri*.jsonl\n"
        "   (Tatoeba, CC BY 2.0 FR), üreten: python tools/veri_esp_siklik.py\n\n"
        "   Sık kelime başına, kelimenin geçtiği en kısa cümle çifti:\n"
        "   [yabancı cümle, Türkçesi, Tatoeba kimliği]. Cümle aynen alınır;\n"
        "   örneği olmayan kelime yoktur, uydurulmaz. */\n\n"
        "window.ESP = window.ESP || {};\n\n"
        "ESP.KELIME_ORNEK = {\n"
        "  kaynak:'Tatoeba',\n  lisans:'CC BY 2.0 FR',\n  adres:'https://tatoeba.org/sentences/show/',\n"
        "  diller:{\n" + govde + ",\n  },\n};\n"
    )


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
    uret.diller = diller
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
    cikti = [(CIKTI, uret(n))]
    cikti.append((ORNEK, uret_ornek(uret.diller)))
    if "--denetle" in sys.argv:
        eski = [y.name for y, m in cikti if not (y.exists() and y.read_text(encoding="utf-8") == m)]
        print("ESKI: " + ", ".join(eski) + " — python tools/veri_esp_siklik.py" if eski else "kelimesiklik.js, kelimeornek.js guncel")
        return 1 if eski else 0
    for yol, metin in cikti:
        yol.write_text(metin, encoding="utf-8")
        print(f"{yol.relative_to(KOK)} yazildi ({yol.stat().st_size / 1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
