#!/usr/bin/env python3
"""Bilinc bench — King'in dusunce ortakligi (Ana sayfa › Bilinc haritasi), 2026-11-09.

Her vaka (bilinc_vakalar.json) calisan HKM'ye gider (POST /api/king/cumle, tur bilinc|bilinc_harita;
sunucu.py gun_cumlesi ile ayni yol) ve cevap kodla puanlanir. Olcutler (agirlikli):
  yanit   cevap geldi (gelmezse vaka 0)            sayi    girdide olmayan sayi yok
  bence   gorusunu «bence» ile sahiplenir          teshis  teshis/kisilik yargisi yok
  soru    sonunda tek derinlestiren soru            baglam  dusuncenin kendi sozcukleri gecer
  kisa    en cok bes cumle, madde listesi yok      ozel    vakanin istedigi: cevap / celiski / itiraz
Vaka puani 0-100; paket puani zorluk agirlikli (zor 3 kat). Gecmis bilinc_gecmis.json'a eklenir.

  python tools/king_bench/bilinc_bench.py                 # canli (HKM acik olmali)
  python tools/king_bench/bilinc_bench.py --etiket "orta model"
  python tools/king_bench/bilinc_bench.py --oz            # puanlayicinin oz-denetimi (HKM'siz)
  python tools/king_bench/bilinc_bench.py --gecmis        # son kosular"""
import datetime
import json
import os
import re
import sys
import urllib.request

BU = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.dirname(os.path.dirname(BU))
GECMIS = os.path.join(BU, "bilinc_gecmis.json")
SAYI = re.compile(r"\d+(?:[.,]\d+)?")
TESHIS = re.compile(r"teşhis|depresyon|bozukluk|narsis|hastalı|travma|anksiyete|patoloj|psikoloğa git|tedavi", re.I)
AGIRLIK = {"bence": 2, "soru": 2, "kisa": 1, "sayi": 2, "teshis": 2, "baglam": 1, "ozel": 3}


def kucuk(s):
    return (s or "").replace("I", "ı").replace("İ", "i").lower()


def cumleler(t):
    return [c for c in re.split(r"(?<=[.!?…])\s+", (t or "").strip()) if c.strip()]


def puanla(vaka, cevap):
    """-> (puan 0-100, {olcut: 0|1}). Cevap yoksa 0."""
    if not (cevap or "").strip():
        return 0, {"yanit": 0}
    k, c = kucuk(cevap), cumleler(cevap)
    o = {
        "bence": int("bence" in k),
        "soru": int(any("?" in x for x in c[-2:])),
        "kisa": int(len(c) <= 5 and not re.search(r"^\s*(?:[-*•]|\d+[.)])\s", cevap, re.M)),
        "sayi": int(not (set(SAYI.findall(cevap)) - set(SAYI.findall("\n".join(vaka["satirlar"]))))),
        "teshis": int(not TESHIS.search(cevap)),
        "baglam": int(any(kucuk(a) in k for a in vaka.get("anahtar") or [])),
    }
    ozel = []
    if vaka.get("cevap"):
        ozel.append(any(kucuk(a) in k for a in vaka["cevap"]))
    if vaka.get("celiski"):
        ozel.append(bool(re.search(r"çeliş|tutarsız|çatış|gerilim|ters düş|karşıt", k)))
    if vaka.get("itiraz"):
        ozel.append(any(kucuk(a) in k for a in vaka["itiraz"]))
    o["ozel"] = int(all(ozel)) if ozel else 1
    top = sum(AGIRLIK.values())
    return round(100 * sum(AGIRLIK[a] * v for a, v in o.items() if a in AGIRLIK) / top), o


def paket_puani(sonuclar):
    t = sum(s["zor"] for s in sonuclar)
    return round(sum(s["puan"] * s["zor"] for s in sonuclar) / t) if t else 0


def sor(vaka, zaman=60):
    with open(os.path.join(KOK, "HKM", "config.json"), encoding="utf-8") as f:
        cfg = json.load(f) or {}
    istek = urllib.request.Request("http://127.0.0.1:%d/api/king/cumle" % int(cfg.get("port") or 4200),
                                   data=json.dumps({"tur": vaka["tur"], "satirlar": vaka["satirlar"]}).encode("utf-8"),
                                   headers={"Content-Type": "application/json", "Authorization": "Bearer " + (cfg.get("local_token") or "")})
    with urllib.request.urlopen(istek, timeout=zaman) as r:
        return json.loads(r.read().decode("utf-8") or "{}")


def oz():
    """Puanlayicinin kendisi: iyi cevap yuksek, kotu cevap dusuk almali."""
    v = {"satirlar": ["Düşünce: «Disiplin özgürlüktür»", "Çelişkili bulduğu düşünce: «Canım isteyince çalışırım»"],
         "anahtar": ["disiplin"], "celiski": True}
    iyi = ("Bence disiplinin kafanı boşalttığı fikri sağlam. Ama «canım isteyince çalışırım» düşüncenle çelişiyor; "
           "ikisi farklı işlerde doğru olabilir. Hangi işlerde ilhamı beklemek sana gerçekten kazandırıyor?")
    kotu = "- Depresyon belirtisi olabilir.\n- Günde 8 saat çalış.\n- 3 kural koy."
    pi, oi = puanla(v, iyi)
    pk, ok_ = puanla(v, kotu)
    hata = []
    if pi != 100:
        hata.append("iyi cevap 100 almadı: %s %s" % (pi, oi))
    if pk > 30:
        hata.append("kötü cevap fazla aldı: %s %s" % (pk, ok_))
    if puanla(v, "")[0] != 0:
        hata.append("boş cevap 0 değil")
    if paket_puani([{"puan": 100, "zor": 3}, {"puan": 0, "zor": 1}]) != 75:
        hata.append("zorluk ağırlığı yanlış")
    print("KIRMIZI: " + "; ".join(hata) if hata else "bilinc bench öz-denetim: temiz")
    return 1 if hata else 0


def main(a):
    if "--oz" in a:
        return oz()
    if "--gecmis" in a:
        for g in (json.load(open(GECMIS, encoding="utf-8")) if os.path.exists(GECMIS) else [])[-10:]:
            print(g["tarih"], g["puan"], g.get("etiket", ""), g.get("model", ""))
        return 0
    vakalar = json.load(open(os.path.join(BU, "bilinc_vakalar.json"), encoding="utf-8"))["vakalar"]
    sonuc, modeller = [], set()
    for v in vakalar:
        try:
            r = sor(v)
        except Exception as e:  # HKM kapali / zaman asimi: vaka 0, kosu surer
            r = {"ok": False, "note": type(e).__name__}
        metin = r.get("text") if r.get("ok") else ""
        p, o = puanla(v, metin)
        if r.get("model"):
            modeller.add(r["model"])
        sonuc.append({"id": v["id"], "zor": v["zor"], "puan": p, "olcut": o, "not": r.get("note") if not metin else None})
        eksik = [k for k, x in o.items() if not x]
        print("%-6s zor %d  %3d  %s" % (v["id"], v["zor"], p, ("eksik: " + ", ".join(eksik)) if eksik else "tam"))
        if metin:
            print("       " + metin.replace("\n", " ")[:220])
        elif r.get("note"):
            print("       cevap yok: %s" % r["note"])
    pp = paket_puani(sonuc)
    print("\nBilinç ortaklığı puanı: %d/100 (%d vaka, zorluk ağırlıklı)" % (pp, len(sonuc)))
    gecmis = json.load(open(GECMIS, encoding="utf-8")) if os.path.exists(GECMIS) else []
    gecmis.append({"tarih": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), "puan": pp,
                   "etiket": a[a.index("--etiket") + 1] if "--etiket" in a else "", "model": ", ".join(sorted(modeller)),
                   "vakalar": {s["id"]: s["puan"] for s in sonuc}})
    json.dump(gecmis, open(GECMIS, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
