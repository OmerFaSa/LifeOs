"""Öz-değerlendirme: her King-Bench koşusundan sonra sistem kendine üç soru sorar.

  python oz.py SONUC.json [ONCEKI.json]   → SONUC-oz.md (bench.py çağırır)

  1. Eksikler        — yetenek YOK (araç/veri yok, model «veri yok» diyor, yeni alan).
  2. Düzeltilebilir  — yetenek VAR ama yol yanlış (sayfa açtı, sayı kayboldu, «yaptım» dedi değişmedi).
  3. Daha iyi etki   — fikirler.json; zayıf alanlara dokunan fikir öne çıkar (etki/çaba × alan zayıflığı).
Kural tabanlıdır (model yok): aynı sonuç her seferinde aynı rapor.
"""
import json, os, sys, collections

BU = os.path.dirname(os.path.abspath(__file__))
sys.stdout.reconfigure(encoding="utf-8")
EKSIK_IZ = ("«veri yok»", "beklenen yok")
DUZELT_IZ = ("veri değişmedi", "önizlemede sayı", "«yaptım» dedi", "tür ", "sayfa", "olmaması gereken", "iç metin", "işlem ne olsun", "tanışma")
YOK_CEVAP = ("bulamadım", "yok", "gerekli", "ölçmedim", "mevcut değil", "erişimim")


def sinif(s):
    n = " ".join(s["neden"])
    c = s.get("cevap", "")
    if s["alan"] == "yeni" or (any(k in n for k in EKSIK_IZ) and not any(k in n for k in DUZELT_IZ[:3])):
        return "eksik"
    if "teknik ret" in n and any(k in c for k in YOK_CEVAP):
        return "eksik"
    return "duzelt"


def main():
    et = os.path.basename(sys.argv[1])[6:-5]
    R = json.load(open(sys.argv[1], encoding="utf-8"))
    O = json.load(open(sys.argv[2], encoding="utf-8")) if len(sys.argv) > 2 else None
    oad = os.path.basename(sys.argv[2])[6:-5] if O else ""
    F = json.load(open(os.path.join(BU, "fikirler.json"), encoding="utf-8"))
    alan = collections.defaultdict(lambda: [0, 0])
    for s in R:
        alan[s["alan"]][1] += 1
        alan[s["alan"]][0] += s["gecti"]
    zayif = {a: 1 - g / n for a, (g, n) in alan.items()}
    kalan = [s for s in R if not s["gecti"]]
    g = sum(s["gecti"] for s in R)
    L = ["# Öz-değerlendirme · %s" % et, "",
         "King-Bench: **%d/%d (%%%d)**" % (g, len(R), round(100 * g / len(R)))
         + (" · önceki %s: %d/%d" % (oad, sum(s["gecti"] for s in O), len(O)) if O else ""), ""]
    if O:
        once = {s["id"]: s["gecti"] for s in O}
        duz = [s["id"] for s in R if s["gecti"] and once.get(s["id"]) is False]
        boz = [s["id"] for s in R if not s["gecti"] and once.get(s["id"])]
        L += ["Düzelen: %s" % (", ".join(duz) or "—"), "Bozulan: %s" % (", ".join(boz) or "—"), ""]
    L += ["Alanlar: " + " · ".join("%s %d/%d" % (a, x[0], x[1]) for a, x in sorted(alan.items(), key=lambda kv: kv[1][0] / kv[1][1])), ""]
    for baslik, k in (("1. Eksikler (yetenek yok)", "eksik"), ("2. Düzeltilebilir (yetenek var, yol yanlış)", "duzelt")):
        L += ["## " + baslik, ""]
        l = [s for s in kalan if sinif(s) == k]
        L += ["- **%s** [%s] «%s» — %s" % (s["id"], s["alan"], s["m"], "; ".join(s["neden"])) for s in l] or ["- yok"]
        L.append("")
    L += ["## 3. Şu olsa hayatta daha iyi etki eder mi?", "",
          "Sıra = etki ÷ çaba × (1 + o alanın bench'teki başarısızlığı). Etki 1–5: kullanıcının günlük hayatına dokunma derecesi (tahmin).", ""]
    for f in sorted(F, key=lambda f: -(f["etki"] / f["caba"]) * (1 + max(zayif.get(a, 0) for a in f["alan"]))):
        L.append("- **%s** · etki %d/5 · çaba %d/5 · %s — %s" % (f["ad"], f["etki"], f["caba"], f["durum"], f["neden"]))
    yol = sys.argv[1][:-5] + "-oz.md"
    open(yol, "w", encoding="utf-8").write("\n".join(L) + "\n")
    print("\n".join(L[:12]))
    print("→", yol)


if __name__ == "__main__":
    main()
