#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LifeOS — GUNCELLEME (main dalindan).

     python3 sistem/guncelle.py       # varsa guncellemeyi indirir
     python3 sistem/guncelle.py --kontrol # yalniz bakar, hicbir seyi degistirmez
     python3 sistem/guncelle.py --yeniden # indirir, sonra sistemi yeniden baslatir
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

SISTEM = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.dirname(SISTEM)          # deponun koku (sistem/ bir alt klasor)
UZAK = "origin"
DAL = "main"
# Zip ile indirilmis bir klasor bu adrese baglanir (depo herkese acik).
DEPO_URL = "https://github.com/OmerFaSa/LifeOs.git"

# Eski surumlerin kokte biraktigi, yeni duzende BASKA YERDE duran dosya ve
# klasorler. Zip klasoru baglanirken yalniz bunlar ve yalniz yeni surumde
# yoklarsa kaldirilir. Liste kapalidir: bilinmeyen bir dosyaya dokunulmaz.
ESKI_KOK = ("baslat.py", "sunucu.py", "guncelle.py", "baslat.sh",
            "BASLAT.command", "GELISTIRME_RAPORU.md", "NOTLAR.md",
            "LIFEOS2.md", "skills-lock.json", "ekip")


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
    kod, cikti = _git(["rev-parse", "--show-toplevel"], kok, calistir)
    # Ust klasorlerden birinin deposu bu klasorun deposu DEGILDIR.
    if kod != 0 or os.path.realpath(cikti.strip()) != os.path.realpath(kok):
        return {"durum": "git-degil", "baglanabilir": True,
                "mesaj": "Bu klasör zip ile indirilmiş. «Güncelle» onu "
                         "GitHub'daki sürüme bağlar ve en yeni sürümü kurar; "
                         "verin (tarayıcı ve HKM/db) korunur."}
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
ARTIKLAR = ("sunucu.log", "__pycache__", os.path.join("sistem", "__pycache__"))


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


def baglan(kok=KOK, calistir=subprocess.run, uzak_url=None):
    """Zip ile indirilmis klasoru uzaga baglar ve en yeni surumu kurar.

    Izlenen dosyalar en yeni surumle degisir; git disi dosyalar (veri,
    yapilandirma, kullanicinin kendi dosyalari) YERINDE KALIR. Uzaga
    ulasilamazsa klasor eski haline doner (yarim .git birakilmaz)."""
    import shutil
    git_klasor = os.path.join(kok, ".git")
    if os.path.exists(git_klasor):
        return {"durum": "engel", "mesaj": "Klasörde yarım bir git kaydı var (.git); "
                                           "elle bakılmalı."}

    def geri(mesaj):
        shutil.rmtree(git_klasor, ignore_errors=True)
        return {"durum": "engel", "mesaj": mesaj}

    for adim in (["init", "--quiet"],
                 ["remote", "add", UZAK, uzak_url or DEPO_URL]):
        kod, cikti = _git(adim, kok, calistir)
        if kod != 0:
            return geri("git hazırlanamadı: " + (cikti.splitlines() or ["?"])[-1])
    # Tek kayit derinliginde: yuzlerce megabaytlik gecmis indirilmez.
    kod, _ = _git(["fetch", "--quiet", "--depth", "1", UZAK, DAL], kok, calistir,
                  timeout=900)
    if kod != 0:
        return geri("GitHub'a ulaşılamadı; internet bağlantısını kontrol edip "
                    "yeniden dene. Klasörde hiçbir şey değişmedi.")
    hedef = UZAK + "/" + DAL
    for adim in (["reset", "--quiet", "--hard", hedef],
                 ["branch", "-M", DAL],
                 ["branch", "--quiet", "--set-upstream-to=" + hedef]):
        kod, cikti = _git(adim, kok, calistir, timeout=300)
        if kod != 0 and adim[0] == "reset":
            return geri("Sürüm kurulamadı: " + (cikti.splitlines() or ["?"])[-1])
    for ad in ESKI_KOK:
        kod, _ = _git(["ls-files", "--error-unmatch", ad], kok, calistir)
        if kod == 0:
            continue                                  # yeni surumde de var
        yol = os.path.join(kok, ad)
        try:
            if os.path.isdir(yol):
                shutil.rmtree(yol)
            elif os.path.isfile(yol):
                os.remove(yol)
        except OSError:
            pass
    artiklari_temizle(kok)
    _, yeni = _git(["log", "-1", "--format=%s"], kok, calistir)
    return {"durum": "guncellendi", "yeniden_baslat": True, "degisen": None,
            "yeni": [yeni.strip()] if yeni.strip() else [],
            "mesaj": "Klasör GitHub'a bağlandı ve en yeni sürüm kuruldu. "
                     "Sistemi yeniden başlat."}


def surum(kok=KOK, calistir=subprocess.run):
    """Kurulu surum: {"kisa", "tarih", "baslik"} ya da None (zip)."""
    kod, c = _git(["log", "-1", "--format=%h|%cd|%s", "--date=format:%d.%m.%Y"],
                  kok, calistir, timeout=10)
    if kod != 0 or not c or "|" not in c:
        return None
    k, t, b = (c.split("|", 2) + ["", ""])[:3]
    return {"kisa": k, "tarih": t, "baslik": b}


def uygula(kok=KOK, calistir=subprocess.run, uzak_url=None):
    """Guncellemeyi indirir — yalniz guvenliyse.

    Doner: {"durum": "guncellendi" | "guncel" | "engel" | "git-yok" |
    "git-degil" | "hata", "mesaj": ..., ...}"""
    d = durum(kok, calistir, getir=True)
    if d["durum"] == "git-degil" and d.get("baglanabilir"):
        return baglan(kok, calistir, uzak_url)
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
        baslat = os.path.join(SISTEM, "baslat.py")
        subprocess.call([sys.executable, baslat, "--dur"], cwd=KOK)
        return subprocess.call([sys.executable, baslat], cwd=KOK)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
