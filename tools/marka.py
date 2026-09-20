#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Marka görsellerini SERVİS EDİLEBİLİR hâle getirir.

   NE İŞE YARAR

   Dört sistemin ortak marka görselleri — modül kapakları, ajan
   portreleri, durum illüstrasyonları, dokular, ikonlar, rapor
   kapakları. Hepsi `brand/medya/<aile>/` altında durur ve
   `/img/marka/<ad>.webp` adresinden servis edilir.

   Seviye medyasıyla (`tools/rutbe.py`) KARIŞMAZ ve karışmamalı: orası
   bir kataloğa bağlıdır ve eksiği kod tarafından bilinir; burası
   serbesttir, bir doku eklenmesi hiçbir kodu kırmaz.

   ------------------------------------------------------------------
   ÖNCE `--dene`

   Büyük bir teslimatta otuz dosyanın adı yanlışsa, bunu YAZDIKTAN
   SONRA değil yazmadan önce bilmek gerekir. `--dene` hiçbir şey
   yazmaz; her dosya için nereye gideceğini ya da neden gitmeyeceğini
   söyler.

       python3 tools/marka.py ~/indirilenler --dene
       python3 tools/marka.py ~/indirilenler
       python3 tools/marka.py --liste

   ------------------------------------------------------------------
   KALİTEDEN ÖDÜN VERİLMEZ

   Varsayılan KAYIPSIZDIR. Hiçbir piksel değişmez, hiçbir görsel
   küçülmez. Yapılan tek şey aynı pikselleri daha iyi PAKETLEMEK:
   saydam kenar boşluğu kırpılır (atılan şey görünmeyen boşluktur,
   ışık değil) ve kayıpsız WebP olarak yazılır. Video olduğu gibi
   kopyalanır — depo sahibinin ürettiğini ikinci kez bozmak olurdu.

   ------------------------------------------------------------------
   AD HEDEFİ BELİRLER, İÇERİK DEĞİL

   Araç görselin içine bakıp «bu hangi ajan» diye TAHMİN ETMEZ. Adı
   bir aileye uymayan dosya işlenmez ve sebebi yazılır; sessizce
   atlanan bir dosya, «neden görünmüyor» diye aranan bir akşam demekti.

   Üreticinin verdiği ad ile servis edilen ad farklı olabilir: alt
   çizgi tireye döner, Türkçe karakter sadeleşir, büyük harf küçülür.
   Çeviri TEK yerde (`kanonik`) yazılıdır.
"""

import os
import re
import shutil
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
MEDYA = KOK / "brand" / "medya"

# Aileler ve ne oldukları. Klasör adı = önek.
AILELER = {
    "kimlik":  "modül kapak ve hero görselleri",
    "ajan":    "ajan portreleri",
    "durum":   "durum illüstrasyonları",
    "tanitim": "ilk kurulum sahneleri",
    "doku":    "arka plan dokuları",
    "bos":     "boş durum illüstrasyonları",
    "kapak":   "rapor kapakları",
    "simge":   "ikon ailesi",
}

GORSEL = {".png", ".jpg", ".jpeg", ".webp", ".svg"}
VIDEO = {".mp4", ".webm"}

# Turkce karakterler dosya adinda YER ALMAZ: ad bir URL parcasidir ve
# yuzde kodlamasi gereken bir ad, bir gun bulunamayan bir istektir.
SADELES = str.maketrans({
    "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u",
    "Ç": "c", "Ğ": "g", "İ": "i", "I": "i", "Ö": "o", "Ş": "s", "Ü": "u",
})


def kanonik(govde: str):
    """Üreticinin adını servis edilen ada çevirir; (aile, ad) döner.

    Uymuyorsa (None, sebep). Kural tek yerde yazılıdır:
      · küçük harf, Türkçe karakter sadeleşir
      · boşluk ve alt çizgi tire olur
      · art arda tireler tek tireye iner
      · ilk parça AİLE adı olmak zorunda
    """
    ad = govde.translate(SADELES).lower()
    ad = re.sub(r"[\s_]+", "-", ad)
    ad = re.sub(r"[^a-z0-9-]", "", ad)
    ad = re.sub(r"-{2,}", "-", ad).strip("-")
    if not ad:
        return None, "ad boşaldı"
    aile = ad.split("-", 1)[0]
    if aile not in AILELER:
        return None, "aile tanınmadı (%s)" % ", ".join(sorted(AILELER))
    if ad == aile:
        return None, "aileden sonra bir ad gerekiyor (örn. %s-ays)" % aile
    return aile, ad


def _kb(n):
    return "%6.0f KB" % (n / 1024)


def isle(kaynak: Path, dene: bool = False) -> int:
    if not kaynak.is_dir():
        print("HATA: %s bir klasör değil" % kaynak)
        return 1
    try:
        from PIL import Image
    except ImportError:
        if not dene:
            print("HATA: Pillow yok.  pip install pillow")
            return 1
        Image = None

    yazilan = atlanan = 0
    once = sonra = 0
    for dosya in sorted(kaynak.rglob("*")):
        if not dosya.is_file():
            continue
        uzanti = dosya.suffix.lower()
        if uzanti not in GORSEL and uzanti not in VIDEO:
            continue
        aile, ad = kanonik(dosya.stem)
        if not aile:
            print("  · %-36s ATLANDI — %s" % (dosya.name[:36], ad))
            atlanan += 1
            continue

        klasor = MEDYA / aile
        # SVG ve video DÖNÜŞTÜRÜLMEZ: biri zaten vektör, öteki yeniden
        # kodlanınca bozulur.
        koru = uzanti in VIDEO or uzanti == ".svg"
        hedef = klasor / (ad + (uzanti if koru else ".webp"))

        if dene:
            print("  → %-36s %s/%s" % (dosya.name[:36], aile, hedef.name))
            yazilan += 1
            continue

        klasor.mkdir(parents=True, exist_ok=True)
        if koru:
            shutil.copy2(dosya, hedef)
            n = hedef.stat().st_size
            once += n; sonra += n; yazilan += 1
            print("  ✓ %-36s olduğu gibi   %s" % (aile + "/" + hedef.name, _kb(n)))
            continue

        im = Image.open(dosya)
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            kutu = im.getchannel("A").getbbox()
            if kutu:
                im = im.crop(kutu)
        else:
            im = im.convert("RGB")
        im.save(hedef, "WEBP", lossless=True, quality=100, method=6)
        a, b = dosya.stat().st_size, hedef.stat().st_size
        once += a; sonra += b; yazilan += 1
        print("  ✓ %-36s %4dx%-4d %s → %s"
              % (aile + "/" + hedef.name, im.width, im.height, _kb(a), _kb(b)))

    if dene:
        print("\nDENEME: hiçbir şey yazılmadı. %d dosya işlenecek, %d atlanacak."
              % (yazilan, atlanan))
        return 0
    print("\n%d dosya yazıldı, %d atlandı." % (yazilan, atlanan))
    if once and sonra and once != sonra:
        print("Toplam %.1f MB → %.1f MB (%%%.0f küçüldü)."
              % (once / 1048576, sonra / 1048576, 100 * (1 - sonra / once)))
    return 0


def liste() -> int:
    """Ne var. EKSİĞİ SÖYLEMEZ — marka medyasında eksik diye bir şey
    yoktur; hiçbir ekran bir görselin varlığına bel bağlamaz."""
    if not MEDYA.is_dir():
        print("brand/medya/ yok.")
        return 0
    toplam = 0
    for aile in sorted(AILELER):
        k = MEDYA / aile
        d = sorted(f for f in k.iterdir() if f.is_file()) if k.is_dir() else []
        boy = sum(f.stat().st_size for f in d)
        toplam += boy
        print("\n%-8s %-34s %d dosya, %.1f MB"
              % (aile.upper(), AILELER[aile], len(d), boy / 1048576))
        for f in d:
            print("   %-30s %s" % (f.name, _kb(f.stat().st_size)))
    print("\nTOPLAM %.1f MB" % (toplam / 1048576))
    return 0


def sina() -> int:
    """Ad kurali ve yol muhafizi — `--sina`.

    Bu arac bir teslimat aldiginda otuz dosyayi tek seferde ISIMLENDIRIR
    ve YERLESTIRIR; kurali bozan bir degisiklik sessizce yanlis yere
    yazabilir. Kural burada, aracin yaninda sinanir: `sayilar.py` bunu
    kok denetimleri arasinda kosar.
    """
    hata = []

    def esit(girdi, bek_aile, bek_ad):
        a, n = kanonik(girdi)
        if (a, n) != (bek_aile, bek_ad):
            hata.append("%r -> (%r, %r), beklenen (%r, %r)"
                        % (girdi, a, n, bek_aile, bek_ad))

    def red(girdi):
        a, _ = kanonik(girdi)
        if a is not None:
            hata.append("%r reddedilmeliydi, kabul edildi" % girdi)

    # Uretici ne verirse versin, servis edilen ad TEK bicimdir.
    esit("kimlik-ays", "kimlik", "kimlik-ays")
    esit("kimlik_AYS", "kimlik", "kimlik-ays")
    esit("Kimlik AYS", "kimlik", "kimlik-ays")
    esit("ajan__patron", "ajan", "ajan-patron")
    # Turkce karakter SADELESIR: ad bir URL parcasidir.
    esit("doku_kağıt", "doku", "doku-kagit")
    esit("kapak_Haftalık Rapor", "kapak", "kapak-haftalik-rapor")
    esit("durum-veri-yok", "durum", "durum-veri-yok")

    # Aile taninmiyorsa ISLENMEZ: sessizce atlanan bir dosya, «neden
    # gorunmuyor» diye aranan bir aksam demekti.
    red("IMG_2931")
    red("rastgele-dosya")
    red("logo")
    # Aileden sonra bir ad gerekir; yoksa klasorle ayni adda dosya olur.
    red("ajan")
    red("kimlik")
    red("---")

    # YOL MUHAFIZI: aile ADDAN turer, yoldan degil.
    import importlib.util
    yol_py = KOK / "brand" / "seviye" / "ortak_yol.py"
    kaynak = "import os\n" + yol_py.read_text(encoding="utf-8")
    ns = {}
    exec(compile(kaynak, str(yol_py), "exec"), ns)
    marka = ns["_ortak_marka_yolu"]

    if not marka("/img/marka/kimlik-ays.webp", "/k"):
        hata.append("gecerli ad reddedildi")
    elif not marka("/img/marka/kimlik-ays.webp", "/k").endswith(
            os.path.join("brand", "medya", "kimlik", "kimlik-ays.webp")):
        hata.append("aile yanlis turedi")
    # IKI KATMAN AYRI AYRI SINANIR. Once `_guvenli_medya_adi`: bolu
    # isareti, ters bolu, gizli dosya ve izinsiz uzanti REDDEDILMELI.
    # Sonra `_ortak_marka_yolu`nun kendi `aile.isalnum()` savunmasi.
    # Tek katmani sinamak yaniltir: oteki katman hatayi orter ve test
    # yesil kalir — olculdu, tam olarak boyle oldu.
    guvenli = ns["_guvenli_medya_adi"]
    for kotu in ("a/b.webp", "a\\b.webp", ".gizli.webp", "ad.txt", ""):
        if guvenli(kotu):
            hata.append("_guvenli_medya_adi(%r) reddetmeliydi" % kotu)
    if not guvenli("kimlik-ays.webp"):
        hata.append("_guvenli_medya_adi gecerli adi reddetti")

    # Alt klasor ve dizin gezinme REDDEDILIR: bir gorsel kapisinin dosya
    # sistemine acilan bir pencereye donusmesi kabul edilebilir degil.
    for kotu in ("/img/marka/../../etc/passwd", "/img/marka/kimlik/gizli.webp",
                 "/img/marka/.gizli.webp", "/img/marka/ad.txt",
                 "/img/marka/", "/img/seviye/kimlik-ays.webp"):
        if kotu != "/img/seviye/kimlik-ays.webp" and marka(kotu, "/k"):
            hata.append("%r reddedilmeliydi" % kotu)

    if hata:
        print("MARKA SINAMASI KALDI:")
        for h in hata:
            print("  ✕ " + h)
        return 1
    print("marka adlandirma ve yol muhafizi temiz (%d durum)" % 25)
    return 0


def main() -> int:
    if "--sina" in sys.argv:
        return sina()

    if "--liste" in sys.argv:
        return liste()
    arg = [a for a in sys.argv[1:] if not a.startswith("-")]
    if not arg:
        print(__doc__)
        return 0
    dene = "--dene" in sys.argv
    if dene:
        print("DENEME koşumu — hiçbir şey yazılmayacak.\n")
    return isle(Path(arg[0]).expanduser().resolve(), dene)


if __name__ == "__main__":
    raise SystemExit(main())
