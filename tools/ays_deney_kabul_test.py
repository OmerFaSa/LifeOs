#!/usr/bin/env python3
"""Gorev 073 kabul testi (Claude Code yazdi; Uygulayici degistirmez).
KOLAY-PLANI Faz 5 — kisisel deney motorunun hesap cekirdegi (AYS/src/js/core/deney.js, R.Deney):
kosullar kodla sirayla dagitilir (iki gunluk blokta bir A bir B), eksik veri sifir sayilmaz,
yetersiz veride sonuc yok, fark + %95 Welch araligi, «etki» etiketi ve surgu yalniz tamamlanan deneyde.
Node'da kosar (tools/kabul_js.py). python tools/ays_deney_kabul_test.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kabul_js as J  # noqa: E402

DOSYALAR = ["src/js/core/utils.js", "src/js/core/deney.js"]
D = "({ id:'sabah-aksam-mat', baslangic:'2026-11-03', gun:14, kosullar:['sabah','aksam'] })"
GUNLER = "Array.from({ length:14 }, (_, i) => R.U.iso(R.U.addDays('2026-11-03', i)))"
A = [10, 12, 11, 13, 9, 10, 11]
B = [x + 2 for x in A]   # fark tam 2; ortak varyans 1.8095, df 12, t=2.1788 -> yari genislik 1.5666

hata = []
def bak(ad, kosul, deger):
    if not kosul:
        hata.append("%s: %r" % (ad, deger))

# 1) Atama: belirlenimci, 14 gunde 7/7, her iki gunluk blokta bir sabah bir aksam, aralik disi null.
r = J.calistir("AYS", DOSYALAR, "(() => { const d = %s, g = %s; return { a:g.map(x => R.Deney.ata(d, x)), b:g.map(x => R.Deney.ata(d, x)),"
               " once:R.Deney.ata(d, '2026-11-02'), sonra:R.Deney.ata(d, '2026-11-17') }; })()" % (D, GUNLER))
bak("ata belirlenimci", r["a"] == r["b"], r["a"])
bak("ata 7/7", r["a"].count("sabah") == 7 and r["a"].count("aksam") == 7, r["a"])
bak("ata bloklu", all(sorted(r["a"][i:i + 2]) == ["aksam", "sabah"] for i in range(0, 14, 2)), r["a"])
bak("ata aralik disi null", r["once"] is None and r["sonra"] is None, (r["once"], r["sonra"]))

# Olcumleri atamaya gore dagitan hazirlik: sabah gunlerine A, aksam gunlerine B sirayla.
def olcum(a, b, bos=()):
    return ("(() => { const d = %s, a = %s, b = %s, bos = %s; let i = 0, j = 0;"
            " return %s.map(t => ({ tarih:t, deger:bos.includes(t) ? null : (R.Deney.ata(d, t) === 'sabah' ? a[i++] : b[j++]) })); })()"
            % (D, a, b, list(bos), GUNLER))

# 2) Yetersiz veri: kol basina 5'ten az gecerli deger -> sonuc yok, fark null.
y = J.calistir("AYS", DOSYALAR, "R.Deney.sonuc(%s, %s.slice(0, 8), '2026-11-20')" % (D, olcum(A, B)))
bak("yetersiz durum", y["durum"] == "yetersiz", y)
bak("yetersiz fark yok", y.get("fark") is None and y.get("aralik") is None, y)
bak("yetersiz neden", isinstance(y.get("neden"), str) and y["neden"], y)

# 3) Eksik veri sifir degil: null deger sayilmaz.
n = J.calistir("AYS", DOSYALAR, "R.Deney.sonuc(%s, %s, '2026-11-20')" % (D, olcum(A, B, ["2026-11-03", "2026-11-04"])))
bak("null sayilmaz", n["n"]["sabah"] + n["n"]["aksam"] == 12, n.get("n"))

# 4) Tamamlanan deney: fark B - A = 2, Welch %95 araligi, etki, anlamli, surgu acik.
t = J.calistir("AYS", DOSYALAR, "(() => { const s = R.Deney.sonuc(%s, %s, '2026-11-17'); return Object.assign({ surgu:R.Deney.surguAcik(s) }, s); })()" % (D, olcum(A, B)))
bak("tamam durum", t["durum"] == "tamam", t)
bak("fark 2", abs(t["fark"] - 2) < 1e-9, t.get("fark"))
bak("aralik", t.get("aralik") and abs(t["aralik"][0] - 0.4334) < 2e-3 and abs(t["aralik"][1] - 3.5666) < 2e-3, t.get("aralik"))
bak("n 7/7", t["n"] == {"sabah": 7, "aksam": 7}, t.get("n"))
bak("etki etiketi", t["etiket"] == "etki", t.get("etiket"))
bak("anlamli", t["anlamli"] is True, t.get("anlamli"))
bak("surgu acik", t["surgu"] is True, t.get("surgu"))

# 5) Suren deney: sayi gosterilebilir ama «etki» degil, surgu kapali.
s = J.calistir("AYS", DOSYALAR, "(() => { const s = R.Deney.sonuc(%s, %s, '2026-11-16'); return Object.assign({ surgu:R.Deney.surguAcik(s) }, s); })()" % (D, olcum(A, B)))
bak("suruyor", s["durum"] == "suruyor" and s["etiket"] != "etki" and s["surgu"] is False, s)

# 6) Aralik sifiri kesiyorsa tamam ama anlamli degil.
z = J.calistir("AYS", DOSYALAR, "R.Deney.sonuc(%s, %s, '2026-11-17')" % (D, olcum(A, [10, 13, 9, 12, 11, 10, 12])))
bak("sifiri kesen aralik", z["durum"] == "tamam" and z["anlamli"] is False and z["aralik"][0] < 0 < z["aralik"][1], z)

if hata:
    print("KIRMIZI:", *hata, sep="\n  ")
    sys.exit(1)
print("ays deney kabul: bloklu atama, eksik veri, yetersiz veride sonuc yok, Welch araligi, etki yalniz tamamlanan deneyde.")
