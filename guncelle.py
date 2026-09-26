#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LifeOS — GUNCELLEME (main dalindan).

     python3 guncelle.py              # varsa guncellemeyi indirir
     python3 guncelle.py --kontrol    # yalniz bakar, hicbir seyi degistirmez
     python3 guncelle.py --yeniden    # indirir, sonra sistemi yeniden baslatir
                                      # (GUNCELLE.bat bunu cagirir)

   Giris sayfasindaki «Güncelle» dugmesi de AYNI iki islevi cagirir
   (durum / uygula); iki yerde iki guncelleme mantigi olsaydi bir gun
   ikisi ayrisirdi.

   Uc kural:

   1. VERIYE DOKUNMAZ. Kullanici verisi tarayicida ve HKM/db altinda
      durur; ikisi de git'in disindadir. Guncelleme yalniz depodaki
      dosyalari ileri sarar.

   2. YALNIZ ILERI SARAR (fast-forward). Klasorde elle degistirilmis bir
      dosya varsa ya da yerel dal main'den ayrismissa guncelleme YAPILMAZ
      ve neden yapilmadigi soylenir. Birlestirme, ustune yazma, «stash»
      kullanicinin yerine verilecek kararlar degildir.

   3. BELIRSIZSE SOYLER. git yoksa, klasor git ile indirilmemisse, ag
      yoksa: tahmin edilmez, ne oldugu ve ne yapilacagi yazilir.
"""

import os
import subprocess
import sys

sys.dont_write_bytecode = True

KOK = os.path.dirname(os.path.abspath(__file__))
UZAK = "origin"
DAL = "main"


def _git(args, kok=KOK, calistir=subprocess.run, timeout=60):
    """(kod, cikti). git yoksa kod None."""
    try:
        r = calistir(["git"] + list(args), cwd=kok, capture_output=True,
                     text=True, encoding="utf-8", errors="replace",
                     timeout=timeout)
    except FileNotFoundError:
        return None, ""
    except subprocess.TimeoutExpired:
        return 124, "zaman aşımı"
    return r.returncode, ((r.stdout or "") + (r.stderr or "")).strip()


def durum(kok=KOK, calistir=subprocess.run, getir=True):
    """Guncelleme var mi? Hicbir dosyayi degistirmez.

    Doner: {"durum": "ok" | "git-yok" | "git-degil", ...}
    "ok" iken: dal, geride, ileride, kirli (liste), yeni (commit basliklari),
    ag (uzak bilgi tazelenebildi mi)."""
    kod, _ = _git(["--version"], kok, calistir)
    if kod is None:
        return {"durum": "git-yok",
                "mesaj": "Bu bilgisayarda git kurulu değil. git-scm.com'dan "
                         "kurduktan sonra güncelleme buradan yapılabilir."}
    kod, cikti = _git(["rev-parse", "--is-inside-work-tree"], kok, calistir)
    if kod != 0 or cikti.strip() != "true":
        return {"durum": "git-degil",
                "mesaj": "Bu klasör git ile indirilmemiş (zip olabilir); "
                         "buradan güncellenemez. Depoyu «git clone» ile "
                         "yeniden indirmek gerekir."}
    _, dal = _git(["rev-parse", "--abbrev-ref", "HEAD"], kok, calistir)
    ag = True
    if getir:
        kod, _ = _git(["fetch", "--quiet", UZAK, DAL], kok, calistir, timeout=45)
        ag = kod == 0
    hedef = UZAK + "/" + DAL
    kod, g = _git(["rev-list", "--count", "HEAD.." + hedef], kok, calistir)
    geride = int(g) if kod == 0 and g.strip().isdigit() else 0
    kod, i = _git(["rev-list", "--count", hedef + "..HEAD"], kok, calistir)
    ileride = int(i) if kod == 0 and i.strip().isdigit() else 0
    # Izlenen ve elle degistirilmis dosyalar (hazirlanmis ya da degil).
    # Izlenmeyenler (gunluk, yerel veri) engel degildir.
    _, k = _git(["diff", "--name-only", "HEAD"], kok, calistir)
    kirli = [s.strip() for s in k.splitlines() if s.strip()]
    yeni = []
    if geride:
        _, log = _git(["log", "--format=%s", "-n", "15", "HEAD.." + hedef],
                      kok, calistir)
        yeni = [s for s in log.splitlines() if s.strip()]
    return {"durum": "ok", "dal": dal.strip(), "geride": geride,
            "ileride": ileride, "kirli": kirli, "yeni": yeni, "ag": ag}


# Eski surumlerin kok klasorde biraktigi, git disi URETILMIS artiklar.
# Liste kapalidir: kullanici verisi (HKM/db, config) burada hic gecmez.
ARTIKLAR = ("sunucu.log", "__pycache__")


def artiklari_temizle(kok=KOK):
    import shutil
    for ad in ARTIKLAR:
        yol = os.path.join(kok, ad)
        try:
            if os.path.isdir(yol):
                shutil.rmtree(yol)
            elif os.path.isfile(yol):
                os.remove(yol)
        except OSError:
            pass        # acik bir surec tutuyor olabilir; bir dahaki sefere


def uygula(kok=KOK, calistir=subprocess.run):
    """Guncellemeyi indirir — yalniz guvenliyse.

    Doner: {"durum": "guncellendi" | "guncel" | "engel" | "git-yok" |
    "git-degil" | "hata", "mesaj": ..., ...}"""
    d = durum(kok, calistir, getir=True)
    if d["durum"] != "ok":
        return d
    if not d["ag"]:
        return dict(d, durum="engel",
                    mesaj="Sunucuya ulaşılamadı; internet bağlantısını "
                          "kontrol edip yeniden dene.")
    if d["dal"] != DAL:
        return dict(d, durum="engel",
                    mesaj="Klasör şu an «%s» dalında. Güncelleme yalnız "
                          "«main» dalında yapılır." % d["dal"])
    if d["kirli"]:
        return dict(d, durum="engel",
                    mesaj="Şu dosyalarda elle yapılmış değişiklik var; "
                          "üstüne yazmamak için güncelleme yapılmadı: "
                          + ", ".join(d["kirli"][:6])
                          + (" …" if len(d["kirli"]) > 6 else ""))
    if not d["geride"]:
        return dict(d, durum="guncel", mesaj="Sistem zaten güncel.")
    if d["ileride"]:
        return dict(d, durum="engel",
                    mesaj="Bu klasörde main'de olmayan %d kayıt var; "
                          "ileri sarmak mümkün değil." % d["ileride"])
    _, eski = _git(["rev-parse", "HEAD"], kok, calistir)
    kod, cikti = _git(["merge", "--ff-only", UZAK + "/" + DAL], kok, calistir)
    if kod != 0:
        return dict(d, durum="hata",
                    mesaj="Güncelleme uygulanamadı: " + (cikti.splitlines() or ["?"])[-1])
    _, degisen = _git(["diff", "--name-only", eski.strip(), "HEAD"], kok, calistir)
    degisen = [s for s in degisen.splitlines() if s.strip()]
    yeniden = any(s.endswith(".py") for s in degisen)
    artiklari_temizle(kok)
    return dict(d, durum="guncellendi", degisen=len(degisen),
                yeniden_baslat=yeniden,
                mesaj="%d yenilik indirildi." % d["geride"]
                      + (" Sunucu dosyaları da değişti: sistemi yeniden "
                         "başlat." if yeniden else " Açık sayfaları yenile."))


def _yaz(isaret, metin):
    print("  %s %s" % (isaret, metin))


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    for ad in ("stdout", "stderr"):
        try:
            getattr(sys, ad).reconfigure(errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    print("\nLifeOS güncelleme\n")
    if "--kontrol" in argv:
        d = durum()
        if d["durum"] != "ok":
            _yaz("✕", d["mesaj"])
            return 1
        if not d["ag"]:
            _yaz("•", "Sunucuya ulaşılamadı; son bilinen duruma göre:")
        if d["geride"]:
            _yaz("•", "%d yenilik var:" % d["geride"])
            for s in d["yeni"]:
                print("      - " + s)
        else:
            _yaz("✓", "Sistem güncel.")
        return 0

    s = uygula()
    isaret = {"guncellendi": "✓", "guncel": "✓"}.get(s["durum"], "✕")
    _yaz(isaret, s["mesaj"])
    for y in s.get("yeni", []) if s["durum"] == "guncellendi" else []:
        print("      - " + y)
    if s["durum"] not in ("guncellendi", "guncel"):
        return 1
    # --yeniden (GUNCELLE.bat): «guncelle ve ac». Zaten gunceldeyse de
    # yeniden baslatir: giris sayfasindan indirilen bir guncelleme sunucu
    # dosyasini degistirmis olabilir ve onu ancak yeniden baslatma yukler.
    if "--yeniden" in argv:
        print("\n  Sistem yeniden başlatılıyor…")
        baslat = os.path.join(KOK, "baslat.py")
        subprocess.call([sys.executable, baslat, "--dur"], cwd=KOK)
        return subprocess.call([sys.executable, baslat], cwd=KOK)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
