"""Öz-değerlendirme: her King-Bench koşusundan sonra sistem kendine üç soru sorar (kural tabanlı, model yok).

  python oz.py SONUC.json [ONCEKI.json]   → SONUC-oz.md (bench.py çağırır)

  1. Eksikler        — yetenek YOK (cevap yok, «veri yok», gerçek değer yok).
  2. Düzeltilebilir  — yetenek VAR ama yol yanlış (yanlış gün, tutarsız sayı, modele gitti, sayfa açtı).
  3. Şu olsa hayatta daha iyi etki eder mi — fikirler.json; zayıf pakete dokunan öne çıkar (etki ÷ çaba × zayıflık).
  Ayrıca: her zorlukta %90'ı geçen paket için «sertleştir» (o pakete daha zor vakalar yazma zamanı).
"""
import json, os, sys, collections

BU = os.path.dirname(os.path.abspath(__file__))
sys.stdout.reconfigure(encoding="utf-8")
SIRA = ["kayit", "icgoru", "ogrenme", "plan", "guven", "diyalog", "kocluk", "gun", "dayaniklilik", "ogretmen", "hafiza", "gorsel", "proaktif"]
# fikirler.json'daki eski alan adları → paket
ALAN = {"kayıt": "kayit", "çok adım": "kayit", "ölçü": "icgoru", "analiz": "icgoru", "öğretme": "ogrenme", "plan": "plan",
        "güvenlik": "guven", "bağlam": "diyalog", "yardım": "diyalog", "hafıza": "diyalog", "destek": "kocluk", "yeni": "kocluk"}
DUZELT_IZ = ("veri değişmedi", "farkı", "hedef gün", "hedef değer", "önizlemede sayı", "«yaptım» dedi", "tür ", "sayfa",
             "olmaması gereken", "iç metin", "işlem ne olsun", "tanışma", "tutarsız", "modele gitti", "yavaş", "onaya sunmadı")


def sinif(s):
    n = " ".join(s["neden"])
    if any(k in n for k in DUZELT_IZ):
        return "duzelt"
    return "eksik"


def puan(l):
    t = sum(s.get("zor", 1) for s in l)
    return round(100 * sum(s.get("zor", 1) for s in l if s["gecti"]) / t) if t else None


def main():
    et = os.path.basename(sys.argv[1])[6:-5]
    R = json.load(open(sys.argv[1], encoding="utf-8"))
    O = json.load(open(sys.argv[2], encoding="utf-8")) if len(sys.argv) > 2 else None
    F = json.load(open(os.path.join(BU, "fikirler.json"), encoding="utf-8"))
    paket = collections.OrderedDict((p, [s for s in R if s.get("paket") == p]) for p in SIRA if any(s.get("paket") == p for s in R))
    pp = {p: puan(l) for p, l in paket.items()}
    king = round(sum(pp.values()) / len(pp)) if pp else 0
    L = ["# Öz-değerlendirme · %s" % et, "", "King puanı **%d/100** · %d/%d vaka" % (king, sum(s["gecti"] for s in R), len(R)), "",
         "| Paket | Puan | zor 1 | zor 2 | zor 3 | zor 4 |", "|---|---|---|---|---|---|"]
    sert = []
    for p, l in paket.items():
        z = [puan([s for s in l if s.get("zor", 1) == k]) for k in (1, 2, 3, 4)]
        L.append("| %s | %s | %s |" % (p, pp[p], " | ".join("—" if v is None else str(v) for v in z)))
        if all(v is None or v >= 90 for v in z):
            sert.append(p)
    L.append("")
    if O:
        once = {s["id"]: s["gecti"] for s in O}
        L += ["Düzelen: %s" % (", ".join(s["id"] for s in R if s["gecti"] and once.get(s["id"]) is False) or "—"),
              "Bozulan: %s" % (", ".join(s["id"] for s in R if not s["gecti"] and once.get(s["id"])) or "—"), ""]
    if sert:
        L += ["**Sertleştir:** %s — her zorlukta %%90 üstü; bu paketlere daha zor vakalar yazma zamanı." % ", ".join(sert), ""]
    kalan = [s for s in R if not s["gecti"]]
    for baslik, k in (("1. Eksikler (yetenek yok)", "eksik"), ("2. Düzeltilebilir (yetenek var, yol yanlış)", "duzelt")):
        L += ["## " + baslik, ""]
        l = sorted([s for s in kalan if sinif(s) == k], key=lambda s: -s.get("zor", 1))
        L += ["- **%s** [%s·%s] «%s» — %s" % (s["id"], s.get("paket"), s.get("zor", 1), s["m"], "; ".join(s["neden"])) for s in l] or ["- yok"]
        L.append("")
    L += ["## 3. Şu olsa hayatta daha iyi etki eder mi?", "",
          "Sıra = etki ÷ çaba × (1 + paketin eksik puanı). Etki 1–5: kullanıcının günlük hayatına dokunma derecesi (tahmin).", ""]
    zayif = lambda f: max((1 - (pp.get(ALAN.get(a, a)) or 100) / 100) for a in f["alan"])
    for f in sorted([f for f in F if f["durum"] != "yapıldı"], key=lambda f: -(f["etki"] / f["caba"]) * (1 + zayif(f))):
        L.append("- **%s** · etki %d/5 · çaba %d/5 · %s — %s" % (f["ad"], f["etki"], f["caba"], f["durum"], f["neden"]))
    yol = sys.argv[1][:-5] + "-oz.md"
    open(yol, "w", encoding="utf-8").write("\n".join(L) + "\n")
    print("\n".join(L[:16]))
    print("→", yol)


if __name__ == "__main__":
    main()
