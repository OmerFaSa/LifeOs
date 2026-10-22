#!/usr/bin/env python3
"""veri/ katmanlarini kurala gore denetler; veri/DENETIM.md'yi yazar.

Katmanlar:
  temiz/   Yalniz bir kaynaktan indirilen ya da kaynaktan hesaplanan kayit.
           etiket: kaynakli-birincil | kaynakli-ikincil | tahmin | hesaplandı
           kaynakli-* kayitta 'kaynak' bir URL ya da veri/ham/<id>.meta.json,
           ve kanit: 'alinti' (kaynaktan aynen) ya da derlem kimligi (tatoeba_id).
  taslak/  Elle yazilan kayit. etiket 'dogrulanmamis', 'kaynak' alani yok
           (iddia 'iddia_edilen_kaynak'ta durur). Hicbir arayuze gitmez.
  reddedilen.jsonl  Elenen kayit; 'neden' zorunlu.

Cikis kodu: ihlal varsa 1. Kullanim: python tools/veri_denetle.py
"""
import json
import sys
import time
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
VERI = KOK / "veri"
TEMIZ_ETIKET = {"kaynakli-birincil", "kaynakli-ikincil", "tahmin", "hesaplandı"}
KANIT = ("alinti", "tatoeba_id")


def kaynak_gecerli(k):
    return isinstance(k, str) and (k.startswith("http") or (VERI / "ham" / f"{k}.meta.json").exists())


def denetle_kayit(katman, ad, r):
    if ad == "reddedilen.jsonl":
        return [] if r.get("neden") else ["neden yok"]
    e = r.get("etiket")
    if katman == "taslak":
        hata = [] if e == "dogrulanmamis" else [f"etiket {e!r}"]
        return hata + (["'kaynak' alani var"] if "kaynak" in r else [])
    if e not in TEMIZ_ETIKET:
        return [f"etiket {e!r}"]
    if not r.get("kaynak"):
        return ["kaynak yok"]
    if e.startswith("kaynakli-"):
        hata = [] if kaynak_gecerli(r["kaynak"]) else [f"kaynak dogrulanamaz: {str(r['kaynak'])[:50]}"]
        return hata + ([] if any(r.get(k) for k in KANIT) else ["alinti yok"])
    return []


def main():
    satirlar, toplam_ihlal = [], 0
    for katman in ("temiz", "taslak"):
        satirlar += [f"\n## {katman}/\n", "| Dosya | Kayıt | İhlal | İlk ihlal |", "| :--- | ---: | ---: | :--- |"]
        for yol in sorted((VERI / katman).glob("*/*.jsonl")):
            n, ihlal, ilk = 0, 0, ""
            for no, line in enumerate(yol.read_text(encoding="utf-8").splitlines(), 1):
                if not line.strip():
                    continue
                n += 1
                try:
                    hata = denetle_kayit(katman, yol.name, json.loads(line))
                except json.JSONDecodeError as ex:
                    hata = [f"JSON: {ex.msg}"]
                if hata:
                    ihlal += 1
                    ilk = ilk or f"{no}: {'; '.join(hata)}"
            toplam_ihlal += ihlal
            satirlar.append(f"| {yol.relative_to(VERI).as_posix()} | {n:,} | {ihlal} | {ilk} |")
    rapor = [
        "# Veri denetimi",
        "",
        f"`tools/veri_denetle.py` yazdı, {time.strftime('%Y-%m-%d %H:%M')}. Elle düzenlenmez.",
        "Kurallar betiğin başında. Bu denetim biçimi ve kaynak izini sınar;",
        "içeriğin doğruluğunu kanıtlamaz. `taslak/` kaynakla doğrulanana dek hiçbir arayüze gitmez.",
        f"\n**Toplam ihlal: {toplam_ihlal}**",
    ] + satirlar
    (VERI / "DENETIM.md").write_text("\n".join(rapor) + "\n", encoding="utf-8")
    print(f"veri/DENETIM.md yazildi; ihlal: {toplam_ihlal}")
    return 1 if toplam_ihlal else 0


if __name__ == "__main__":
    sys.exit(main())
