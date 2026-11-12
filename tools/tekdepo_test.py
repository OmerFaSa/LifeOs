#!/usr/bin/env python3
"""Tek depo (sistem/veri.py) testi: python3 tools/tekdepo_test.py   (cikis 0 temiz, 1 kirmizi)

Gecici klasorde; korunan sozler veri.py basligindaki 1-5. Kullanicinin hicbir dosyasina dokunmaz."""
import itertools
import json
import os
import shutil
import sqlite3
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "sistem"))
sys.dont_write_bytecode = True

import goc  # noqa: E402
import veri  # noqa: E402

kirmizi = 0


def dogru(ad, kosul, ek=""):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %r" % (ek,)))
    kirmizi += 0 if kosul else 1


try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

SIMDI = 1_800_000_000.0           # sabit saat: test her makinede ayni
saat = [SIMDI]


def h(saniye, cihaz, sayac=0):
    return veri.hlc_yap(int((SIMDI + saniye) * 1000), sayac, cihaz)


def satirlar(d):
    return d.c.execute("SELECT id, govde, silindi, saatler FROM kayit ORDER BY id").fetchall()


t = tempfile.mkdtemp(prefix="lifeos-tekdepo-test-")
try:
    d = veri.Depo(os.path.join(t, "a"), saat=lambda: saat[0])
    dogru("yeni depo sürüm 2", d.c.execute("PRAGMA user_version").fetchone()[0] == 2)

    govde = {"tarih": "2026-11-12", "ogunler": [{"ad": "yulaf", "kcal": 350, "kcalCert": "estimated"}], "not": "ç ş ğ"}
    d.yaz("spi/ben", "meals/2026-11-12", govde, h(0, "tel"), "tel")
    ham = d.c.execute("SELECT govde FROM kayit WHERE id='spi/ben|meals/2026-11-12'").fetchone()[0]
    dogru("gidiş-dönüş bayt eşit", ham == goc.kanon(govde) and goc.kanon(d.oku("spi/ben", "meals/2026-11-12")) == goc.kanon(govde))
    etiket = json.loads(d.c.execute("SELECT etiket FROM kayit WHERE id='spi/ben|meals/2026-11-12'").fetchone()[0])
    dogru("etiket göç ile aynı dilde", etiket == {"ogunler.0.kcal": "estimated"}, etiket)

    # Ayni gunun iki ust anahtari iki cihazdan, ters sirayla gelir: ikisi de kalir.
    d.yaz("spi/ben", "sleep/2026-11-12", {"sure": 420}, h(20, "pc"), "pc")
    d.yaz("spi/ben", "sleep/2026-11-12", {"kalite": 4}, h(10, "tel"), "tel")
    dogru("iki cihazın iki alanı birleşir", d.oku("spi/ben", "sleep/2026-11-12") == {"sure": 420, "kalite": 4})
    dogru("aynı alanda eski saat kaybeder", d.yaz("spi/ben", "sleep/2026-11-12", {"sure": 300}, h(15, "tel"), "tel") == []
          and d.oku("spi/ben", "sleep/2026-11-12")["sure"] == 420)
    dogru("aynı yazım iki kez: ikincisi bir şey değiştirmez",
          d.yaz("spi/ben", "sleep/2026-11-12", {"kalite": 4}, h(10, "tel"), "tel") == [])

    # Saati bir gun ileri kaymis cihaz: 5 dk'ya kirpilir, 10 dk sonraki durust yazim kazanir.
    d.yaz("ays/main", "topics/t1", {"seviye": 9}, h(86400, "kayik"), "kayik")
    kayan = d.c.execute("SELECT hlc FROM kayit WHERE id='ays/main|topics/t1'").fetchone()[0]
    dogru("ileri saat 5 dk'ya kırpılır", veri.hlc_coz(kayan)[0] == int(SIMDI * 1000) + veri.ILERI_MS, kayan)
    saat[0] = SIMDI + 600
    d.yaz("ays/main", "topics/t1", {"seviye": 2}, h(600, "pc"), "pc")
    dogru("saati kayan cihaz kazanamaz", d.oku("ays/main", "topics/t1") == {"seviye": 2})

    # Silme yayilir: eski yazim diriltmez, yenisi yalniz kendi alaniyla diriltir.
    dogru("silme uygulanır", d.sil("spi/ben", "sleep/2026-11-12", h(30, "pc"), "pc") is True)
    dogru("silinen okunmaz", d.oku("spi/ben", "sleep/2026-11-12") is None)
    dogru("silmeden eski yazım diriltmez", d.yaz("spi/ben", "sleep/2026-11-12", {"sure": 1}, h(25, "tel"), "tel") == []
          and d.oku("spi/ben", "sleep/2026-11-12") is None)
    d.yaz("spi/ben", "sleep/2026-11-12", {"not": "yeni"}, h(40, "tel"), "tel")
    dogru("silmeden yeni yazım yalnız kendi alanıyla döner", d.oku("spi/ben", "sleep/2026-11-12") == {"not": "yeni"})
    dogru("tanınmayan kayda silme mezar taşı bırakır", d.sil("esp/ben", "goals/g9", h(50, "pc"), "pc")
          and d.yaz("esp/ben", "goals/g9", {"ad": "x"}, h(45, "tel"), "tel") == [])

    olay = d.c.execute("SELECT count(*) FROM olay").fetchone()[0]
    dogru("olay defteri her uygulanan değişikliği tutar", olay == 8, olay)
    try:
        d.yaz("ays/main", "decisions/d1", {"x": 1}, h(60, "pc"), "pc")
        dogru("türetilmiş yol tek depoya yazılmaz", False)
    except ValueError:
        dogru("türetilmiş yol tek depoya yazılmaz", True)

    a, b = d.damga(), d.damga()
    dogru("aynı ms'de iki damga artar", b > a, (a, b))

    # Yedek: tutarli, ustune yazmaz, acilinca ayni satirlar.
    yedek = d.yedekle(os.path.join(t, "yedek.db"))
    os.makedirs(os.path.join(t, "y"))
    shutil.copyfile(yedek, os.path.join(t, "y", "lifeos.db"))
    y = veri.Depo(os.path.join(t, "y"))
    dogru("yedekten dönüş: satırlar aynı", satirlar(y) == satirlar(d))
    y.kapat()
    try:
        d.yedekle(yedek)
        dogru("yedek üstüne yazmaz", False)
    except FileExistsError:
        dogru("yedek üstüne yazmaz", True)
    dogru("yarım dosya kalmaz", not os.path.exists(yedek + ".yarim"))
    d.kapat()

    # Sira bagimsizligi: dort islem, 24 sira, hepsinde ayni son durum.
    islemler = [("yaz", {"a": 1, "b": 1}, h(1, "x")), ("yaz", {"b": 2}, h(3, "y")),
                ("sil", None, h(2, "z")), ("yaz", {"c": 3}, h(4, "x"))]
    sonlar = set()
    for i, sira in enumerate(itertools.permutations(islemler)):
        p = veri.Depo(os.path.join(t, "p%d" % i), saat=lambda: SIMDI)
        for islem, deg, hh in sira:
            if islem == "yaz":
                p.yaz("esp/ben", "habits/h1", deg, hh, "c")
            else:
                p.sil("esp/ben", "habits/h1", hh, "c")
        sonlar.add(goc.kanon([p.oku("esp/ben", "habits/h1"), satirlar(p)[0][3]]))
        p.kapat()
    dogru("yazım ve silme sırası sonucu değiştirmez (24 sıra)", len(sonlar) == 1, sonlar)
    dogru("sıra bağımsız sonuç doğru", json.loads(next(iter(sonlar)))[0] == {"b": 2, "c": 3})

    # goc.py'nin yazdigi surum 1 depo acilir, yukseltilir, uzerine yazilir.
    k = os.path.join(t, "goc")
    os.makedirs(k)
    c = sqlite3.connect(os.path.join(k, "lifeos.db"))
    c.executescript(goc.SEMA)
    c.execute("INSERT INTO kayit VALUES (?,?,?,?,?,?,?,?,?,0,?,?)",
              ("ays/main|exams/e1", "olcum", 1, "ays/main", "exams/e1", goc.kanon({"net": 61.5, "ad": "TYT 3"}), "{}",
               goc.hlc(int(SIMDI * 1000) - 5000, "tel"), "tel", "hesap", "abc"))
    c.commit()
    c.close()
    g = veri.Depo(k, saat=lambda: SIMDI)
    dogru("göç deposu sürüm 2'ye yükselir", g.c.execute("PRAGMA user_version").fetchone()[0] == 2)
    dogru("göçle gelen kayıt okunur", g.oku("ays/main", "exams/e1") == {"net": 61.5, "ad": "TYT 3"})
    dogru("göçten eski yazım kaybeder", g.yaz("ays/main", "exams/e1", {"net": 1}, h(-9, "pc"), "pc") == [])
    g.yaz("ays/main", "exams/e1", {"net": 63}, h(1, "pc"), "pc")
    dogru("göç kaydına yeni yazım alanı birleştirir", g.oku("ays/main", "exams/e1") == {"net": 63, "ad": "TYT 3"})
    dogru("göç kimliği korunur (geri alma bulur)",
          g.c.execute("SELECT goc_id FROM kayit WHERE id='ays/main|exams/e1'").fetchone()[0] == "abc")
    g.kapat()

    # --- P4a: butun govdeyi degistirme (eski istemcinin yazimi) ---
    r = veri.Depo(os.path.join(t, "r"), saat=lambda: SIMDI)
    r.degistir("spi/ben", "prefs/p", {"a": 1, "b": 2}, h(1, "tel"), "tel")
    r.degistir("spi/ben", "prefs/p", {"a": 3}, h(2, "pc"), "pc")
    dogru("değiştirme eksik anahtarı siler", r.oku("spi/ben", "prefs/p") == {"a": 3})
    dogru("silinen anahtar eski alan yazımıyla dönmez", r.yaz("spi/ben", "prefs/p", {"b": 9}, h(1.5, "tel"), "tel") == []
          and r.oku("spi/ben", "prefs/p") == {"a": 3})
    r.yaz("spi/ben", "prefs/p", {"c": 4}, h(3, "tel"), "tel")
    dogru("değiştirmeden yeni alan yazımı korunur, eskisi değişir",
          r.degistir("spi/ben", "prefs/p", {"a": 0}, h(2.5, "x"), "x") is True and r.oku("spi/ben", "prefs/p") == {"a": 0, "c": 4})
    dogru("tabandan eski değiştirme kaybeder", r.degistir("spi/ben", "prefs/p", {"z": 1}, h(2.2, "x"), "x") is False)
    r.degistir("ays/main", "liste/l", [1, 2, 3], h(1, "tel"), "tel")
    dogru("sözlük olmayan gövde tek parça taşınır", r.oku("ays/main", "liste/l") == [1, 2, 3])
    dogru("tek parçada eski değiştirme kaybeder", r.degistir("ays/main", "liste/l", [9], h(0.5, "pc"), "pc") is False)
    r.degistir("ays/main", "liste/l", [4], h(2, "pc"), "pc")
    dogru("tek parçada yeni değiştirme kazanır", r.oku("ays/main", "liste/l") == [4])
    r.degistir("esp/ben", "bos/b", {}, h(1, "pc"), "pc")
    dogru("boş sözlük kayıt silinmiş sayılmaz", r.oku("esp/ben", "bos/b") == {})
    r.kapat()

    # Degistirme, alan yazimi ve silme: 5 islem, 120 sira, tek son durum.
    islemler = [("degistir", {"a": 1, "b": 1}, h(1, "x")), ("degistir", {"a": 2}, h(3, "y")),
                ("yaz", {"b": 5, "c": 5}, h(2, "z")), ("yaz", {"d": 7}, h(4, "x")), ("sil", None, h(0.5, "w"))]
    sonlar = set()
    for i, sira in enumerate(itertools.permutations(islemler)):
        p = veri.Depo(os.path.join(t, "q%d" % i), saat=lambda: SIMDI)
        for islem, deg, hh in sira:
            if islem == "sil":
                p.sil("esp/ben", "habits/h2", hh, "c")
            else:
                getattr(p, islem)("esp/ben", "habits/h2", deg, hh, "c")
        sonlar.add(goc.kanon(p.oku("esp/ben", "habits/h2")))
        p.kapat()
    dogru("değiştirme dahil sıra sonucu değiştirmez (120 sıra)", sonlar == {goc.kanon({"a": 2, "d": 7})}, sonlar)

    # --- P4a: hesap esitlemesinden tek depoya kopru (gercek hesap.Depo) ---
    sys.path.insert(0, str(KOK / "sistem"))
    import hesap  # noqa: E402
    hd = hesap.Depo(os.path.join(t, "hesap", "hesap.db"))
    kd = veri.Depo(os.path.join(t, "veri"), saat=lambda: SIMDI)
    hd.kopru = veri.Kopru(kd, 1)
    ms = int(SIMDI * 1000)
    ben, oteki = {"id": 1}, {"id": 2}
    c1 = hd.esitle(ben, "spi/ben", "cihazTEL01", 0, [
        {"y": "sleep/2026-11-12", "d": {"sure": 420, "kalite": 4}, "z": ms},
        {"y": "liste/l", "d": [1, 2], "z": ms},
        {"y": "decisions/d1", "d": {"x": 1}, "z": ms}])
    dogru("köprü: kabul edilen yazım tek depoda", kd.oku("spi/ben", "sleep/2026-11-12") == {"sure": 420, "kalite": 4}
          and kd.oku("spi/ben", "liste/l") == [1, 2], c1)
    dogru("köprü: türetilmiş yol tek depoya girmez", kd.oku("spi/ben", "decisions/d1") is None)
    c2 = hd.esitle(ben, "spi/ben", "cihazPC0001", 0, [{"y": "sleep/2026-11-12", "d": {"sure": 1}, "z": ms - 5}])
    dogru("köprü: hesabın reddettiği yazım tek depoya gitmez", c2["red"] == 1
          and kd.oku("spi/ben", "sleep/2026-11-12") == {"sure": 420, "kalite": 4}, c2)
    hd.esitle(ben, "spi/ben", "cihazPC0001", 0, [{"y": "sleep/2026-11-12", "d": {"sure": 400}, "z": ms + 9},
                                                {"y": "liste/l", "d": None, "z": ms + 9}])
    dogru("köprü: tüm gövde ve silme aynen", kd.oku("spi/ben", "sleep/2026-11-12") == {"sure": 400}
          and kd.oku("spi/ben", "liste/l") is None)
    hd.esitle(oteki, "spi/ben", "cihazTEL02", 0, [{"y": "meals/m1", "d": {"kcal": 1}, "z": ms}])
    dogru("köprü: ikinci hesabın kaydı karışmaz", kd.oku("spi/ben", "meals/m1") is None)
    kopya = os.path.join(t, "hesap-kopya.db")
    shutil.copyfile(hd.yol, kopya)
    dogru("karşılaştır: hesap ile tek depo aynı", veri.karsilastir(kopya, kd, 1) == [], veri.karsilastir(kopya, kd, 1))
    hd.kopru = lambda *a: 1 / 0
    c3 = hd.esitle(ben, "esp/ben", "cihazPC0001", 0, [{"y": "goals/g1", "d": {"ad": "koş"}, "z": ms}])
    dogru("köprü hatası eşitlemeyi durdurmaz", c3["kabul"] == 1 and "ZeroDivisionError" in hd.kopru_hata, c3)
    shutil.copyfile(hd.yol, kopya)
    dogru("karşılaştır: kaçan yazımı gösterir", veri.karsilastir(kopya, kd, 1) == [("esp/ben|goals/g1", "tek depoda yok")])
    dogru("köprü: tek depo yoksa açılmaz", veri.kopru_ac(os.path.join(t, "yok", "hesap"), 1) is None)
    kd.kapat()
    os.makedirs(os.path.join(t, "ev", "veri"))
    shutil.copyfile(kd.yol, os.path.join(t, "ev", "veri", "lifeos.db"))
    k2 = veri.kopru_ac(os.path.join(t, "ev", "hesap"), 1)
    dogru("köprü: tek depo varsa açılır", isinstance(k2, veri.Kopru) and k2.sahip == 1)
    k2.depo.kapat()
finally:
    shutil.rmtree(t, ignore_errors=True)

print("\nTek depo: %s" % ("temiz" if not kirmizi else "%d kırmızı" % kirmizi))
sys.exit(1 if kirmizi else 0)
