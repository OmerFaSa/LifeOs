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

BAKIS_SN = 45       # «yenilik var mi?» sayfa acilisini bekletir: kisa
INDIRME_SN = 900    # kurarken buyuk bir indirme yavas agda dakikalar surebilir
SARMA_SN = 600      # ileri sarma; yavas diskte 60 sn'de oldurulup yarim kalmamali


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


def durum(kok=KOK, calistir=subprocess.run, getir=True, sure=BAKIS_SN):
    """Guncelleme var mi? Hicbir dosyayi degistirmez.

    Doner: {"durum": "ok" | "git-yok" | "git-degil", ...}
    "ok" iken: dal, geride, ileride, kirli (liste), yeni (commit basliklari),
    ag (uzak bilgi tazelenebildi mi), asim (ag yavas: sure doldu)."""
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
    ag, asim = True, False
    if getir:
        kod, _ = _git(["fetch", "--quiet", UZAK, DAL], kok, calistir, timeout=sure)
        ag, asim = kod == 0, kod == 124
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
    # Ayrismis: hem uzakta yenilik var hem burada uzakta olmayan kayit.
    # Ileri sarilamaz; ancak kullanici isterse yerel kayitlar yedek dala
    # alinip guncellenebilir (uygula(yedekle=True)).
    return {"durum": "ok", "dal": dal.strip(), "geride": geride,
            "ileride": ileride, "kirli": kirli, "yeni": yeni, "ag": ag, "asim": asim,
            "yedeklenebilir": bool(geride and ileride)}


def engel_cumlesi(d):
    """durum() sonucu icin: guncelleme neden yapilamaz; yapilabiliyorsa bos.
    Baska cihazdan bakan da panelin gordugu nedeni gorsun."""
    if d.get("durum") != "ok":
        return d.get("mesaj") or ""
    if d.get("dal") != DAL:
        return "Klasör şu an «%s» dalında. Güncelleme yalnız «main» dalında yapılır." % d.get("dal")
    if d.get("ileride") and d.get("geride"):
        return "Bu klasörde GitHub'da olmayan %d kayıt var; bilgisayardaki panelden «Yedekle ve güncelle»." % d["ileride"]
    return ""


def kilit_temizle(kok=KOK, calistir=subprocess.run, simdi=None):
    """Oldurulmus bir git'in biraktigi index.lock sonraki her guncellemeyi
    durdurur. Ileri sarmanin en uzun suresinden eski kilidin sahibi yoktur."""
    import time
    kod, yol = _git(["rev-parse", "--git-path", "index.lock"], kok, calistir, timeout=10)
    if kod != 0:
        return False
    tam = os.path.join(kok, yol.strip())
    try:
        if (simdi or time.time()) - os.path.getmtime(tam) > SARMA_SN:
            os.remove(tam)
            return True
    except OSError:
        pass                # kilit yok ya da acik bir surec tutuyor
    return False


def _yarim_mi(kirli, kok, calistir):
    """Yarim kalmis ileri sarma: degisen HER dosya zaten hedef surumde (ya da
    hedefte olmayan bir dosya silinmis). Elle yazilmis bir sey yoktur; yalniz
    boyleyse dosyalarin ustune yazilir (soz 2 yine gecerli)."""
    hedef = UZAK + "/" + DAL
    for ad in kirli:
        kod, beklenen = _git(["rev-parse", "--verify", "--quiet", hedef + ":" + ad], kok, calistir, timeout=30)
        var = os.path.isfile(os.path.join(kok, ad))
        if kod != 0:
            if var:
                return False
            continue
        if not var:
            return False
        # --path: satir sonu donusumu depodakiyle ayni olsun (Windows'ta CRLF)
        kod, ozet = _git(["hash-object", "--path=" + ad, "--", ad], kok, calistir, timeout=60)
        if kod == 0 and ozet.strip() == beklenen.strip():
            continue
        # Depoya CRLF'le girmis dosya: donusum ozeti degistirir, ham bayt ayni (2026-11-06, quiz.js).
        kod, ozet = _git(["hash-object", "--no-filters", "--", ad], kok, calistir, timeout=60)
        if kod != 0 or ozet.strip() != beklenen.strip():
            return False
    return True


def _calisan_kopya():
    return os.environ.get("LIFEOS_DIR") or os.path.join(os.path.expanduser("~"), "LifeOS-Sistem")


def _kabuk_klasoru():
    elle = os.environ.get("LIFEOS_KABUK_KLASOR")
    if elle:
        return elle
    temel = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    return os.path.join(temel, "Programs", "LifeOS", "resources", "app")


def kabuk_tazele(kok=KOK, hedef=None):
    """Masaustu kabugu (uygulama/masaustu) kuruluysa onu da yeni surume getirir;
    bir sonraki acilista gecerli olur. Yalniz uygulamanin calistirdigi kopya
    (LifeOS-Sistem) dokunur: gelistirme deposu kurulu uygulamayi degistirmez."""
    import shutil
    if hedef is None:
        if os.path.realpath(kok) != os.path.realpath(_calisan_kopya()):
            return []
        hedef = _kabuk_klasoru()
    kaynak = os.path.join(kok, "uygulama", "masaustu")
    if not os.path.isdir(hedef) or not os.path.isdir(kaynak):
        return []
    degisen = []
    for ad in sorted(os.listdir(kaynak)):
        a, b = os.path.join(kaynak, ad), os.path.join(hedef, ad)
        try:
            if os.path.isfile(a) and not _ayni(a, b):
                shutil.copyfile(a, b + ".yeni")
                os.replace(b + ".yeni", b)
                degisen.append(ad)
        except OSError:
            pass            # guncellemeyi durdurmaz; bir dahaki sefere
    return degisen


def _ayni(a, b):
    try:
        with open(a, "rb") as x, open(b, "rb") as y:
            return x.read() == y.read()
    except OSError:
        return False


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


def _yedek_dal(kok, calistir):
    """HEAD'i yeni bir yedek dala koyar; dalin adi ya da None."""
    import time
    ad = "yedek/yerel-" + time.strftime("%Y%m%d-%H%M%S")
    for ek in [""] + ["-%d" % i for i in range(2, 10)]:
        kod, _ = _git(["branch", ad + ek, "HEAD"], kok, calistir)
        if kod == 0:
            return ad + ek
    return None


def uygula(kok=KOK, calistir=subprocess.run, uzak_url=None, yedekle=False):
    """Guncellemeyi indirir — yalniz guvenliyse.

    yedekle=True YALNIZ kullanicinin acik istegiyle verilir: dal ayrismissa
    (burada uzakta olmayan kayitlar varsa) o kayitlar «yedek/yerel-…»
    dalina konur ve main en yeni surume alinir. Hicbir kayit silinmez;
    elle degistirilmis dosya varsa yine dokunulmaz.

    Doner: {"durum": "guncellendi" | "guncel" | "engel" | "git-yok" |
    "git-degil" | "hata", "mesaj": ..., ...}"""
    kilit_temizle(kok, calistir)
    d = durum(kok, calistir, getir=True, sure=INDIRME_SN)
    if d["durum"] == "git-degil" and d.get("baglanabilir"):
        return baglan(kok, calistir, uzak_url)
    if d["durum"] != "ok":
        return d
    if not d["ag"]:
        return dict(d, durum="engel",
                    mesaj="İndirme çok uzun sürdü; bağlantı yavaş. Hiçbir şey değişmedi, "
                          "sonra yeniden dene." if d.get("asim") else
                          "Sunucuya ulaşılamadı; internet bağlantısını "
                          "kontrol edip yeniden dene.")
    if d["dal"] != DAL:
        return dict(d, durum="engel",
                    mesaj="Klasör şu an «%s» dalında. Güncelleme yalnız "
                          "«main» dalında yapılır." % d["dal"])
    # Elektrik kesildi ya da surec olduruldu: ileri sarma yarim kaldi. Bu
    # «elle degisiklik» degildir; kendiliginden tamamlanir (test_guncelle).
    yarim = bool(d["kirli"] and d["geride"] and not d["ileride"]
                 and _yarim_mi(d["kirli"], kok, calistir))
    if d["kirli"] and not yarim:
        return dict(d, durum="engel",
                    mesaj="Şu dosyalarda elle yapılmış değişiklik var; "
                          "üstüne yazmamak için güncelleme yapılmadı: "
                          + ", ".join(d["kirli"][:6])
                          + (" …" if len(d["kirli"]) > 6 else ""))
    if not d["geride"]:
        return dict(d, durum="guncel", mesaj="Sistem zaten güncel.")
    yedek_dal = None
    _, eski = _git(["rev-parse", "HEAD"], kok, calistir)
    if d["ileride"]:
        if not yedekle:
            return dict(d, durum="engel",
                        mesaj="Bu klasörde GitHub'da olmayan %d kayıt var; ileri "
                              "sarmak mümkün değil. «Yedekle ve güncelle» onları "
                              "«yedek/yerel-…» dalına koyar ve en yeni sürümü "
                              "kurar; hiçbir kayıt silinmez." % d["ileride"])
        yedek_dal = _yedek_dal(kok, calistir)
        if not yedek_dal:
            return dict(d, durum="hata", mesaj="Yerel kayıtlar yedek dala konamadı; "
                                               "hiçbir şey değişmedi.")
        # --keep: izlenen dosyalar degisir, izlenmeyenler (veri) yerinde kalir.
        kod, cikti = _git(["reset", "--keep", UZAK + "/" + DAL], kok, calistir, timeout=SARMA_SN)
    elif yarim:
        kod, cikti = _git(["reset", "--hard", UZAK + "/" + DAL], kok, calistir, timeout=SARMA_SN)
    else:
        kod, cikti = _git(["merge", "--ff-only", UZAK + "/" + DAL], kok, calistir, timeout=SARMA_SN)
    if kod != 0:
        return dict(d, durum="hata",
                    mesaj="Az önce başka bir güncelleme başlamış; birkaç dakika sonra yeniden dene."
                          if "index.lock" in cikti else
                          "Güncelleme uygulanamadı: " + (cikti.splitlines() or ["?"])[-1])
    _, degisen = _git(["diff", "--name-only", eski.strip(), "HEAD"], kok, calistir)
    degisen = [s for s in degisen.splitlines() if s.strip()]
    yeniden = any(s.endswith(".py") for s in degisen)
    # HKM'nin kodu degistiyse calisan HKM sureci eski kodla kalir (sahada,
    # 2026-10-19: guncellendi ama HKM 40 dakika eski surumle cevap verdi).
    hkm = any(s.startswith("HKM/") and s.endswith(".py") for s in degisen)
    artiklari_temizle(kok)
    kabuk_tazele(kok)
    return dict(d, durum="guncellendi", degisen=len(degisen),
                yeniden_baslat=yeniden, hkm_degisti=hkm, yedek_dal=yedek_dal,
                mesaj="%d yenilik indirildi." % d["geride"]
                      + (" Bu klasöre özgü %d kayıt «%s» dalında saklı."
                         % (d["ileride"], yedek_dal) if yedek_dal else "")
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
        if d["ileride"]:
            _yaz("!", "Bu klasörde GitHub'da olmayan %d kayıt var%s." % (
                d["ileride"], "; ileri sarılamaz (--yedekle ile yedek dala alınıp "
                              "güncellenir)" if d["geride"] else ""))
        return 0

    yedekle = "--yedekle" in argv
    s = uygula(yedekle=yedekle)
    if s["durum"] == "engel" and s.get("yedeklenebilir") and not yedekle:
        _yaz("✕", s["mesaj"])
        try:
            cevap = input("\n  Yedekleyip güncelleyeyim mi? (E/H) ") if sys.stdin.isatty() else ""
        except EOFError:
            cevap = ""
        if cevap.strip().lower() not in ("e", "evet", "y", "yes"):
            print("  Hiçbir şey değişmedi.")
            return 1
        s = uygula(yedekle=True)
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
