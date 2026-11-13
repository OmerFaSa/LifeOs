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
    c.execute("CREATE TABLE memories(metin TEXT)")
    c.execute("INSERT INTO memories VALUES (?)", (GIZLI,))
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
                  "| hesap | esp.prefs | esp:prefs | 1 |", "| hkm | kisi_bilgisi | hkm:memories | 1 |",
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
    dogru("çökme yeriyle sayıldı", "@ motor/kayit.js:" in cik and "@ motor/plan.js:" in cik, cik)
    dogru("çökmede de geçici kopyalar silindi", os.listdir(gecici2) == [], os.listdir(gecici2))
    dogru("çökmede de içerik basılmadı", GIZLI not in cik)
finally:
    shutil.rmtree(t, ignore_errors=True)

print(("✕ %d kırmızı" % kirmizi) if kirmizi else "✓ hepsi yeşil")
sys.exit(1 if kirmizi else 0)
