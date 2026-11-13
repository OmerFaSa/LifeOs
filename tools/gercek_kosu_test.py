#!/usr/bin/env python3
"""tools/gercek_kosu.py testi, uydurma veriyle: sayilar dogru, kisisel icerik basilmaz, gecici kopyalar
silinir, «canli» dosyalar hic acilmaz ve degismez, baglastirici coktugunde cikis 1.

  python tools/gercek_kosu_test.py
"""
import hashlib
import io
import json
import os
import shutil
import sqlite3
import sys
import tempfile
from contextlib import redirect_stdout
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK / "sistem"))
sys.path.insert(0, str(KOK / "tools"))
import gercek_kosu  # noqa: E402
import hesap  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
kirmizi = 0
GIZLI = "GIZLI-ICERIK-7f3"


def dogru(ad, kosul, ek=""):
    global kirmizi
    print(("  ✓ " if kosul else "  ✕ ") + ad + ("" if kosul else "  %r" % (ek,)))
    kirmizi += 0 if kosul else 1


def canli_kur(kok, cokertici=False):
    """Uydurma «canli» kaynaklar: hesap.db (hesap.Depo semasi) ve hkm.db."""
    os.makedirs(kok / "hesap")
    d = hesap.Depo(str(kok / "hesap" / "hesap.db"))
    satirlar = [
        ("spi/profil" + GIZLI, "vitals/2026-11-01", {"date": "2026-11-01", "weight": 72, "water": 1500, "note": GIZLI, "yeniAlan": 1}),
        ("spi/profil" + GIZLI, "vitals/2026-11-02", {"date": "2026-11-02", "hrv": 987654}),          # sinir disi -> ret
        ("ays/profil" + GIZLI, "defter/n1", {"id": "n1", "baslik": GIZLI, "govde": GIZLI, "at": "2026-11-01T10:00:00Z", "guncel": "2026-11-01T10:00:00Z"}),
        ("ays/profil" + GIZLI, "defter/n2", {"id": "n2", "baslik": "", "govde": "", "at": "2026-11-01T10:00:00Z", "guncel": "2026-11-01T10:00:00Z"}),
        ("esp/profil" + GIZLI, "prefs/x", {"metin": GIZLI}),                                           # sahibi motor yok
        ("esp/profil" + GIZLI, "defter/silinen", None),                                                 # mezar tasi: goc atlar
    ]
    if cokertici:   # blocks dizi degil: baglastirici atar (cokme = hata, temiz ret degil)
        satirlar.append(("ays/profil" + GIZLI, "days/2026-11-03", {"date": "2026-11-03", "blocks": 5}))
    with d._islem() as c:
        for alan, yol, deger in satirlar:
            c.execute("INSERT INTO kayit(kullanici, alan, yol, deger, zaman, cihaz, sira) VALUES (1,?,?,?,?,?,1)",
                      (alan, yol, None if deger is None else json.dumps(deger, ensure_ascii=False), 1762000000000, "cPC"))
    os.makedirs(kok / "hkm")
    c = sqlite3.connect(str(kok / "hkm" / "hkm.db"))
    c.execute("CREATE TABLE meydan_deste(anahtar TEXT, vade TEXT, on_yuz TEXT, arka_yuz TEXT, tekrar INTEGER, silindi INTEGER)")
    c.execute("INSERT INTO meydan_deste VALUES ('m1', '2026-12-01T00:00:00+00:00', ?, ?, 2, 0)", (GIZLI, GIZLI))
    # HKM/core/db.py biciminde: King (memories), Not (bam_kayitlar), arsiv (bildirimler), sahipsiz (para).
    # Cokertici: memories'te id sutunu yok -> King baglastiricisi atar (yer king/hafiza.py:).
    c.execute("CREATE TABLE memories(%suser TEXT, scope TEXT, text TEXT, source TEXT, state TEXT, created_at TEXT, yeniSutun TEXT)"
              % ("" if cokertici else "id INTEGER PRIMARY KEY, "))
    c.execute("INSERT INTO memories(user, scope, text, source, state, created_at, yeniSutun) VALUES ('ben', 'all', ?, 'explicit', 'active', '2026-11-01T10:00:00', ?)", (GIZLI, GIZLI))
    c.execute("INSERT INTO memories(user, scope, text, source, state, created_at) VALUES ('ben', 'all', ' ', 'explicit', 'active', '2026-11-01T10:00:00')")
    c.execute("CREATE TABLE bam_kayitlar(id INTEGER PRIMARY KEY, tur TEXT, baslik TEXT, govde TEXT, dogruluk TEXT, etiketler TEXT, surum INTEGER,"
              " onceki_id INTEGER, is_id INTEGER, created_at TEXT, anahtar TEXT, denetim TEXT)")
    c.execute("INSERT INTO bam_kayitlar(tur, baslik, govde, dogruluk, etiketler, surum, created_at) VALUES ('arastirma', ?, ?, 'kaynakli', ?, 1, '2026-11-01T10:00:00Z')",
              (GIZLI, json.dumps({"ozet": GIZLI}), GIZLI))
    c.execute("CREATE TABLE bildirimler(id INTEGER PRIMARY KEY, modul TEXT, emir_id INTEGER, tur TEXT, metin TEXT, created_at TEXT, okundu_at TEXT)")
    c.execute("INSERT INTO bildirimler(modul, tur, metin, created_at) VALUES ('ays', 'bitti', ?, '2026-11-01T10:00:00')", (GIZLI,))
    c.execute("CREATE TABLE raw_events(id INTEGER PRIMARY KEY, module TEXT, date TEXT, received_at TEXT, payload TEXT)")
    c.executemany("INSERT INTO raw_events(module, date, received_at, payload) VALUES (?, ?, '', ?)",
                  [("spi", "2026-11-01", GIZLI), ("esp", "2026-11-05", GIZLI)])   # spi gunu depoda var, esp yok
    c.execute("CREATE TABLE para(id INTEGER PRIMARY KEY, gun TEXT, yon TEXT, kurus INTEGER, kategori TEXT, kaynak TEXT, created_at TEXT)")
    c.execute("INSERT INTO para(gun, yon, kurus, kategori, kaynak, created_at) VALUES ('2026-11-01', 'gider', 987654, ?, 'local', '2026-11-01')", (GIZLI,))
    c.commit()
    c.close()


def durum(kok):
    return {str(p.relative_to(kok)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(kok.rglob("*")) if p.is_file()}


def kos(kok, cikti, gecici):
    """main()'i calistirir: canli klasoru acan sqlite3.connect yakalanir, gecici klasor ayri tutulur."""
    acilan, asil = [], sqlite3.connect

    def bekci(yol, *a, **k):
        acilan.append(str(yol))
        return asil(yol, *a, **k)
    sqlite3.connect, eski_tmp = bekci, tempfile.tempdir
    tempfile.tempdir = str(gecici)
    tampon = io.StringIO()
    try:
        with redirect_stdout(tampon):
            kod = gercek_kosu.main(["--cikti", str(cikti), "--hesap", str(kok / "hesap" / "hesap.db"),
                                    "--hkm", str(kok / "hkm" / "hkm.db"), "--paket", str(kok / "yok"), "--pc", str(kok / "yok")])
    finally:
        sqlite3.connect, tempfile.tempdir = asil, eski_tmp
    return kod, tampon.getvalue(), acilan


t = Path(tempfile.mkdtemp(prefix="lifeos-gercek-kosu-test-"))
try:
    print("gercek_kosu: temiz koşu")
    canli, gecici, cikti = t / "canli", t / "gecici", t / "cikti"
    os.makedirs(gecici)
    canli_kur(canli)
    once = durum(canli)
    kod, cik, acilan = kos(canli, cikti, gecici)
    rapor = (cikti / "gercek-kosu.md").read_text(encoding="utf-8")
    dogru("çıkış 0 (çökme yok)", kod == 0, kod)
    dogru("rapor dosyası basılanla aynı", rapor in cik)
    for satir in ("| hesap | olcum | spi:vitals | kayit.spiVitals | 2 | 2 | 1 | 0 | 0 |",
                  "| hesap | not | ays:defter | not.defter | 2 | 1 | 1 | 0 | 0 |",
                  "| hkm | kart | hkm:meydan_deste | tekrar.meydan | 1 | 1 | 0 | 0 | 0 |",
                  "| hesap | esp.prefs | esp:prefs | 1 |", "| hkm | para_hareketi | hkm:para | 1 |",
                  "| hkm | kisi_bilgisi | hkm:memories | king.hafiza | 2 | 1 | 1 | 0 | 0 |",
                  "| hkm | bam | hkm:bam_kayitlar | not.bamKayit | 1 | 1 | 0 | 0 | 0 |",
                  "| hkm | akis | hkm:bildirimler | arşiv | 1 | 1 | 0 | 0 | 0 |",
                  "| king.hafiza | Metni boş hafıza kaydı taşınmaz. | 1 |",
                  "modül-gün: 2; depoda karşılığı olmayan: 1 (esp 1, spi 0).", "| hkm:memories | yeniSutun | 1 |",
                  "| not.defter | Başlığı da gövdesi de boş not kaydedilmez. | 1 |", "| spi:vitals | yeniAlan | 1 |"):
        dogru("satır: " + satir, satir in rapor, rapor)
    dogru("ret nedeni gruplu, sayısı #'e döndü", "| kayit.spiVitals | hrv: HRV # ile # ms arasında olmalı. | 1 |" in rapor, rapor)
    dogru("silinen kayıt bağdaştırıcıya gitmez", "silinen" not in rapor and rapor.count("esp:defter") == 0)
    dogru("kişisel içerik, değer ve profil adı basılmadı", GIZLI not in cik and "987654" not in cik and "1500" not in cik, cik)
    dogru("canlı dosyalar hiç açılmadı", not any(a.startswith(str(canli)) for a in acilan), acilan)
    dogru("canlı klasör bayt bayt aynı (yanına -wal/-shm yazılmadı)", durum(canli) == once)
    dogru("geçici kopyalar silindi", os.listdir(gecici) == [], os.listdir(gecici))

    print("gercek_kosu: çöken bağdaştırıcı")
    canli2, gecici2 = t / "canli2", t / "gecici2"
    os.makedirs(gecici2)
    canli_kur(canli2, cokertici=True)
    kod, cik, _ = kos(canli2, t / "cikti2", gecici2)
    dogru("çökmede çıkış 1", kod == 1, kod)
    dogru("çökme yeriyle sayıldı", "@ motor/kayit.js:" in cik and "@ motor/plan.js:" in cik and "@ king/hafiza.py:" in cik, cik)
    dogru("çökmede de geçici kopyalar silindi", os.listdir(gecici2) == [], os.listdir(gecici2))
    dogru("çökmede de içerik basılmadı", GIZLI not in cik)
finally:
    shutil.rmtree(t, ignore_errors=True)

# Modül boşlukları (faz1-modul-bosluklari.md): eski sahipsiz plan koleksiyonları ve gün alanları sahibine gider.
gun = {"date": "2026-11-02", "note": GIZLI, "freeQ": 4, "freeCorrect": 3, "blocks": []}
yeni = gercek_kosu.node([
    {"no": 1, "rota": "ays:weeks", "alan": "ays", "kayitlar": [{"yol": "weeks/w01", "govde": {"n": 1, "title": GIZLI, "mainTopics": []}}]},
    {"no": 2, "rota": "ays:plan", "alan": "ays", "kayitlar": [{"yol": "plan/main", "govde": {"weeks": [{"n": 1}, {"n": 2}], "meta": {}}}]},
    {"no": 3, "rota": "spi:haftaplan", "alan": "spi", "kayitlar": [{"yol": "haftaplan/hp1", "govde": {"id": "hp1", "tur": "su", "ad": GIZLI}}]},
    {"no": 4, "rota": "ays:days", "alan": "ays", "kayitlar": [{"yol": "days/2026-11-02", "govde": gun}]}])
ozet = {s["bag"]: s["cikti"] for no in "1234" for s in yeni[no]}
dogru("plan koleksiyonları ve gün alanları sahibine gider",
      ozet == {"plan.aysHafta": 1, "plan.aysPlan": 3, "plan.spiHaftaplan": 1, "kayit.aysGun": 0, "plan.aysGun": 1, "soru.aysGun": 1, "not.gunNotu": 1}, ozet)
dogru("yeni rotalarda da içerik basılmadı", GIZLI not in json.dumps(yeni, ensure_ascii=False))

print(("✕ %d kırmızı" % kirmizi) if kirmizi else "✓ hepsi yeşil")
sys.exit(1 if kirmizi else 0)
