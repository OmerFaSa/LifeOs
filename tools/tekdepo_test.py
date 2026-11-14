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
    dogru("köprü: okuma P6'ya dek kapalı (veri.OKU)", veri.OKU is False and k2.oku is False)
    k2.depo.kapat()

    # --- P4b: sahibin okumasi tek depodan; ayni yazim dizisi eski ve yeni okumada ayni sonucu verir ---
    def senaryo(kok, oku):
        hdx = hesap.Depo(os.path.join(t, kok, "hesap.db"))
        if oku:
            hdx.kopru = veri.Kopru(veri.Depo(os.path.join(t, kok, "veri"), saat=lambda: SIMDI), 1, oku=True)
        yaz = lambda cihaz, g, kim=ben: hdx.esitle(kim, "spi/ben", cihaz, 0, g)
        yaz("cihazTEL01", [{"y": "a/%d" % i, "d": {"n": i}, "z": ms + i} for i in range(5)])
        yaz("cihazPC0001", [{"y": "a/1", "d": {"n": 10}, "z": ms + 50}, {"y": "a/2", "d": None, "z": ms + 50},
                            {"y": "a/3", "d": {"n": 0}, "z": ms - 99}])          # sonuncusu eski: reddedilir
        yaz("cihazTEL01", [{"y": "b/x", "d": [1, 2], "z": ms}])
        yaz("cihazTEL02", [{"y": "c/o", "d": {"x": 1}, "z": ms}], oteki)   # ikinci hesap
        gelen, son, donem, tur = {}, 0, None, 0
        while True:                                                   # ucuncu cihaz sayfa sayfa (sinir 2) indirir
            v = hdx.esitle(ben, "spi/ben", "cihazTAB01", son, [], sinir=2)
            gelen.update({x["y"]: (x["d"], x["z"]) for x in v["al"]})
            son, donem, tur = v["son"], v["donem"], tur + 1
            if not v["daha"]:
                break
        kendi = hdx.esitle(ben, "spi/ben", "cihazTEL01", 0, [], sinir=50)["al"]
        o2 = hdx.esitle(oteki, "spi/ben", "cihazTAB01", 0, [])
        return hdx, gelen, donem, tur, {x["y"] for x in kendi}, o2

    h_eski, g_eski, d_eski, _, kendi_eski, o_eski = senaryo("p4-eski", False)
    h_yeni, g_yeni, d_yeni, tur, kendi_yeni, o_yeni = senaryo("p4-yeni", True)
    dogru("P4b: üçüncü cihaz eski ve yeni okumada aynı kayıtları alır", g_yeni == g_eski and len(g_eski) == 6,
          (sorted(g_eski.items()), sorted(g_yeni.items())))
    dogru("P4b: sayfalama (sınır 2) tümünü getirir", tur >= 3, tur)
    dogru("P4b: dönem değişir, cihaz bir kez baştan indirir", d_yeni == d_eski.split(":")[0] + ":tek" or
          (d_yeni.endswith(":tek") and not d_eski.endswith(":tek")), (d_eski, d_yeni))
    dogru("P4b: cihaz kendi yazdığını geri almaz", kendi_yeni == kendi_eski and "b/x" not in kendi_yeni, (kendi_eski, kendi_yeni))
    dogru("P4b: ikinci hesap eski yoldan okur, dönemi değişmez", o_yeni["al"] == o_eski["al"] and not o_yeni["donem"].endswith(":tek"))
    tek = h_yeni.kopru.depo
    h_yeni.kopru, kopru = (lambda *a: 1 / 0), h_yeni.kopru
    h_yeni.kopru.oku, h_yeni.kopru.sahip = True, 1
    try:
        h_yeni.esitle(ben, "spi/ben", "cihazPC0001", 0, [{"y": "d/1", "d": {"k": 1}, "z": ms}])
        dogru("P4b: köprü yazamazsa 503 (okuma tek depodan, kayıp sessiz kalmaz)", False)
    except hesap.Hata as e:
        dogru("P4b: köprü yazamazsa 503 (okuma tek depodan, kayıp sessiz kalmaz)", e.kod == 503, e.kod)
    h_yeni.kopru = kopru
    dogru("P4b: hesap.db yazdı ama tek depo kaçırdı", tek.oku("spi/ben", "d/1") is None)
    v = h_yeni.esitle(ben, "spi/ben", "cihazPC0001", 0, [{"y": "d/1", "d": {"k": 1}, "z": ms}])
    dogru("P4b: aynı yazımın yeniden gönderimi kaçanı onarır", v["red"] == 1 and tek.oku("spi/ben", "d/1") == {"k": 1}, v)
    shutil.copyfile(h_eski.yol, os.path.join(t, "p4-kopya.db"))
    bos = veri.Depo(os.path.join(t, "p4-esle"), saat=lambda: SIMDI)
    n = veri.esle(os.path.join(t, "p4-kopya.db"), bos, 1)
    dogru("eşle: hesap kopyasından tek depo kurulur, sonra fark yok", n > 0
          and veri.karsilastir(os.path.join(t, "p4-kopya.db"), bos, 1) == [], n)
    dogru("eşle: ikinci kez bir şey değiştirmez", veri.esle(os.path.join(t, "p4-kopya.db"), bos, 1) == 0)
    bos.kapat()
    tek.kapat()

    print("\nKabuk kayıtları (kabuk/depo.js ↔ tek depo)")
    import re
    kb = veri.Depo(os.path.join(t, "kabuk-depo"), saat=lambda: SIMDI)
    js = open(os.path.join(KOK, "kabuk", "depo.js"), encoding="utf-8").read()
    js_onek = re.search(r"var KAYIT = /\^(.+?)/;", js).group(1)
    dogru("anahtar listesi kabuk/depo.js KAYIT ile aynı önekten", veri.KABUK_ANAHTAR.pattern.startswith("^" + js_onek[:-1])
          and all(veri.KABUK_ANAHTAR.match(k) for k in ("lifeos.not.kayit", "lifeos.yol.felsefe.1", "lifeos.kayit.kayitlar", "lifeos.onay", "lifeos.beden.boy"))
          and not any(veri.KABUK_ANAHTAR.match(k) for k in ("lifeos.yol.son", "lifeos.tema.secim", "lifeos.kayit.baska", "lifeos.not.../x", "lifeos.not." + "a" * 200, "baska")),
          js_onek)
    for kotu, neden in (({}, "liste"), ({"yazimlar": []}, "boş"), ({"yazimlar": [{"k": "lifeos.tema.secim", "v": "x"}]}, "ayar anahtarı"),
                        ({"yazimlar": [{"k": "lifeos.not.kayit", "v": 5}]}, "metin olmayan değer"),
                        ({"yazimlar": [{"k": "lifeos.not.kayit", "v": "x", "taban": -1}]}, "eksi taban"),
                        ({"yazimlar": [{"k": "lifeos.not.kayit", "v": "x", "taban": True}]}, "mantıksal taban"),
                        ({"yazimlar": [{"k": "lifeos.not.kayit", "v": "x", "sakla": 1}]}, "sakla sayı"),
                        ({"yazimlar": [{"k": "lifeos.not.kayit", "v": "x"}] * 201}, "201 yazım")):
        l, hata = veri.kabuk_yazimlari(kotu)
        dogru("doğrulama reddeder: " + neden, l is None and hata, (l, hata))
    l, hata = veri.kabuk_yazimlari({"yazimlar": [{"k": "lifeos.not.kayit", "v": "[1]"}, {"k": "lifeos.plan.durum", "v": None, "taban": 3, "sakla": False}]})
    dogru("doğrulama: taban ve sakla varsayılanı", hata is None and l == [{"k": "lifeos.not.kayit", "v": "[1]", "taban": 0, "sakla": False},
                                                                     {"k": "lifeos.plan.durum", "v": None, "taban": 3, "sakla": False}], l)
    metin = '[{"id":"n1","baslik":"Çıtır «not»","govde":"satır\\n2"}]'
    r1 = veri.kabuk_yaz(kb, [{"k": "lifeos.not.kayit", "v": metin, "taban": 0}], "pc")
    s1 = r1["surumler"]["lifeos.not.kayit"]
    cek = veri.kabuk_cek(kb, 0)
    dogru("yazılan kayıt bayt bayt aynı döner, sürüm ve imleç verir", s1 > 0 and r1["cakisma"] == 0
          and cek["kayitlar"] == [{"k": "lifeos.not.kayit", "v": metin, "surum": s1}] and cek["son"] >= s1 and cek["daha"] is False, cek)
    dogru("imleçten sonrası boş", veri.kabuk_cek(kb, cek["son"])["kayitlar"] == [])
    r2 = veri.kabuk_yaz(kb, [{"k": "lifeos.not.kayit", "v": metin, "taban": 0}], "uzak")
    dogru("aynı değer yeniden yazılmaz (sürüm aynı, çakışma yok)", r2 == {"surumler": {"lifeos.not.kayit": s1}, "cakisma": 0}, r2)
    r3 = veri.kabuk_yaz(kb, [{"k": "lifeos.not.kayit", "v": "[2]", "taban": s1}], "uzak")
    s3 = r3["surumler"]["lifeos.not.kayit"]
    dogru("güncel tabanla yazan çakışmasız günceller", s3 > s1 and r3["cakisma"] == 0 and kb.oku(veri.KABUK, "lifeos.not.kayit") == "[2]", r3)
    r4 = veri.kabuk_yaz(kb, [{"k": "lifeos.not.kayit", "v": "[3]", "taban": s1}], "pc")
    cak = [y for y, *_ in kb.degisenler(veri.KABUK_CAKISMA, 0, 50)[0]]
    dogru("eski tabanla yazan kazanır ama üstüne yazılan değer saklanır", r4["cakisma"] == 1 and kb.oku(veri.KABUK, "lifeos.not.kayit") == "[3]"
          and cak == ["lifeos.not.kayit|%d" % s3] and kb.oku(veri.KABUK_CAKISMA, cak[0]) == "[2]", (r4, cak))
    r5 = veri.kabuk_yaz(kb, [{"k": "lifeos.not.kayit", "v": "[yerel]", "taban": 0, "sakla": True}], "uzak")
    dogru("«sakla» asıl kaydı değiştirmez, değeri çakışma alanına koyar", r5 == {"surumler": {}, "cakisma": 1}
          and kb.oku(veri.KABUK, "lifeos.not.kayit") == "[3]"
          and any(y.startswith("lifeos.not.kayit|katilim|") for y, *_ in kb.degisenler(veri.KABUK_CAKISMA, 0, 50)[0]), r5)
    veri.kabuk_yaz(kb, [{"k": "lifeos.plan.durum", "v": "{}", "taban": 0}, {"k": "lifeos.kayit.kayitlar", "v": "[]", "taban": 0}], "pc")
    son_ = veri.kabuk_cek(kb, 0)["son"]
    r6 = veri.kabuk_yaz(kb, [{"k": "lifeos.plan.durum", "v": None, "taban": veri.kabuk_cek(kb, 0)["kayitlar"][-2]["surum"]}], "pc")
    silme = veri.kabuk_cek(kb, son_)
    dogru("silme öbür cihaza null olarak gider", r6["cakisma"] == 0 and silme["kayitlar"] == [{"k": "lifeos.plan.durum", "v": None, "surum": r6["surumler"]["lifeos.plan.durum"]}], silme)
    sayfa, imlec, tur = [], 0, 0
    while True:
        v = veri.kabuk_cek(kb, imlec, sinir=2)
        sayfa += [x["k"] for x in v["kayitlar"]]
        imlec, tur = v["son"], tur + 1
        if not v["daha"]:
            break
    dogru("sayfalama (sınır 2) her kaydı bir kez getirir", sorted(sayfa) == ["lifeos.kayit.kayitlar", "lifeos.not.kayit", "lifeos.plan.durum"] and tur >= 2, (sayfa, tur))
    dogru("çakışma alanı kabuk çekişine karışmaz", all(x["k"].startswith("lifeos.") and "|" not in x["k"] for x in veri.kabuk_cek(kb, 0)["kayitlar"]))
    h_yeni.kopru = veri.Kopru(kb, 1)
    yol1 = h_yeni.tek_depo_gunluk()
    dogru("günlük yedek: tek depo veri/yedek altına, günde bir kez", yol1 and os.path.isfile(yol1) and os.path.basename(yol1).startswith("lifeos-gunluk-")
          and h_yeni.tek_depo_gunluk() is None, yol1)
    yd = veri.Depo(os.path.dirname(yol1), saat=lambda: SIMDI) if False else None   # yedek dosyasi ayri adla: asagida dogrudan okunur
    cy = __import__("sqlite3").connect(yol1)
    dogru("günlük yedek kabuk kaydını taşır", cy.execute("SELECT count(*) FROM kayit WHERE alan=?", (veri.KABUK,)).fetchone()[0] >= 2)
    cy.close()
    h_yeni.kopru = None
    dogru("günlük yedek: tek depo yoksa hiçbir şey yapmaz", h_yeni.tek_depo_gunluk() is None)
    kb.kapat()
finally:
    shutil.rmtree(t, ignore_errors=True)

print("\nTek depo: %s" % ("temiz" if not kirmizi else "%d kırmızı" % kirmizi))
sys.exit(1 if kirmizi else 0)
