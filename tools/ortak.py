#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Uc arayuzun ORTAK CSS'ini tek kaynaktan YAYAR ve ayrismayi DENETLER.

   NEDEN BOYLE

   Uc dosya uc uygulamada BAYT DUZEYINDE aynidir:

     base.css     219 satir   x3
     layout.css   671 satir   x3
     designs.css  565 satir   x3
                              = 4 365 satir birebir tekrar

   Birinde yapilan bir duzeltme digerlerinde unutulur ve fark ancak iki
   ekran yan yana konunca gorulur. Bu oturumda o sinifin bir ornegi
   yasandi: alt bant seciciisi uc dosyada ELLE duzeltildi; ucu de dogru
   yazildigi icin fark edilmedi — ama biri yanlis yazilsaydi hicbir
   denetim soylemeyecekti.

   `NOTLAR.md` §19 bunu zaten borc sayiyor ve cozumunu de yaziyor:
   "LifeOs/ortak/ + derleme zamani birlestirme". Bu betik o borcu
   kapatir.

     python3 tools/ortak.py --yay        kaynagi uc arayuze kopyala
     python3 tools/ortak.py --denetle    kopyalar kaynakla ayni mi

   Cikis kodu: 0 temiz, 1 ayrisma/eksik var.

   NEDEN `seviye.py` ILE BIRLESTIRILMEDI

   Ikisi ayni SOZU tutar ("tek kaynak, uc kopya, ayrisma yakalanir") ama
   ayni ISI yapmaz. `seviye.py` ad alani yer tutucularini degistirir
   (`__NS__`, `__MOD__`), HTML markupini `index.html` icine isaretler
   arasina yazar, uc `build.py` ve dort sunucunun icine Python bloklari
   gomer. Buradaki is bunlarin HICBIRI degil: dosyayi oldugu gibi
   kopyala, basina bir baslik koy. O makineyi bu ise uydurmak, bu isi
   o makinenin sartlarina sokmak demekti.

   Ortak olan tek sey dongudur ve dongu bir mekanizma degildir.

   NE YAYILIR, NE YAYILMAZ

   `tokens.css` (78 satir fark), `palettes.css` (52) ve `components.css`
   (~50) KISMEN ortaktir: farklari ajan renkleri ve uygulamaya ozel
   birkac bilesendir. Onlari paylasmak "ortak govde + uygulama kuyrugu"
   ayrimini gerektirir ve bu bir TASARIM KARARIDIR, bir kopyalama isi
   degil. Tam ortak ucu zaten kazancin buyuk kismidir; kismi olanlar
   ayri bir tur.

   `fonts.css` de ucunde ayni ama tasinmaz: gomulu yazi tipi
   tanimlarini `<APP>/tools/fonts.py` uretir ve o uretimin hedefi
   uygulamanin kendi klasorudur. Uretilmis bir dosyayi ikinci bir
   ureticinin altina koymak, iki sahipli bir dosya yapardi.

   SIRA ANLAMDIR

   CSS'te yukleme sirasi anlam tasir. Bu yuzden kopyalar arayuzlerin
   KENDI `src/css/` klasorune AYNI ADLA yazilir: `index.html`
   degismez, sira korunur, `build.py`'nin satir ici alma duzeni
   bozulmaz.
"""

import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
KAYNAK = KOK / "brand" / "ortak"

SISTEMLER = ["AYS", "SPI", "ESP"]

# Kaynaktaki ad = hedefteki ad. Farkli olsalardi `index.html`'deki
# <link> etiketleri de degismek zorunda kalirdi (bkz. SIRA ANLAMDIR).
#
# Deger HEDEF KLASORDUR. Basta yalniz `css` vardi ve liste duz bir
# diziydi; kesinlik etiketi gelince JS de yayilmasi gerekti. Dosya
# turune gore ayri bir betik yazmak, ayni sozu ("tek kaynak, uc kopya,
# ayrisma yakalanir") iki yerde tutmak olurdu.
DOSYALAR = {
    "base.css":     "css",
    "layout.css":   "css",
    "designs.css":  "css",
    # KESINLIK ETIKETI — dort etiketin adi, gorseli ve isaretlemesi.
    # Uc arayuzde de BIREBIR ayni olmak zorunda: ayni `measured`
    # birinde «olculdu» birinde baska bir sey gosterirse, deponun en
    # cok tekrarlanan kurali ekranda ikiye ayrilmis olur.
    "kesinlik.js":   "js/core",
    "kesinlik.css":  "css",
    "kesinlik.test.js": "tests",
    # TANITIM ŞERİDİ — ilk kurulumun üç adımı. Sorular üçünde de aynı;
    # ayrı ayrı yazılsalardı bir gün birinde İKİNCİ adım düşerdi ve
    # düşecek olan, sistemin sınırını söyleyen adımdır.
    "tanitim.js":    "js/core",
    "tanitim.css":   "css",
    "tanitim.test.js": "tests",
    # KATALOG SİMGESİ — bir kimliği o kimliğin görseline çeviren tek
    # yer. Ad kuralını her ekranın kendi kurması, biri bir gün
    # `ders_tyt_turkce` yazması demekti.
    "simge.js":      "js/core",
    "simge.css":     "css",
    "simge.test.js": "tests",
    # MEDYA KÜNYESİ — üretilmiş dosya (`tools/marka.py --kunye`).
    # Buradan yayılır çünkü üç arayüzün de aynı künyeye bakması
    # gerekir: birinde olan bir görsel ötekinde de vardır.
    "medya.js":      "js/core",
}

BASLIK = ("/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.\n"
          "   Düzeltme brand/ortak/%s içine yazılır; burası bir sonraki\n"
          "   `python3 tools/ortak.py --yay` ile yeniden üretilir. */\n")


def uret(ad: str) -> str:
    return (BASLIK % ad) + (KAYNAK / ad).read_text(encoding="utf-8")


def hedefler(ad: str):
    klasor = DOSYALAR[ad]
    for sistem in SISTEMLER:
        kok = KOK / sistem
        if not (kok / "src").is_dir():
            continue
        yield sistem, kok / "src" / Path(klasor) / ad


def yay() -> int:
    if not KAYNAK.is_dir():
        print("HATA: %s yok" % KAYNAK)
        return 1
    n = 0
    for ad in DOSYALAR:
        if not (KAYNAK / ad).exists():
            print("  ! brand/ortak/%s yok, atlandi" % ad)
            continue
        yeni = uret(ad)
        for _sistem, hedef in hedefler(ad):
            hedef.parent.mkdir(parents=True, exist_ok=True)
            eski = hedef.read_text(encoding="utf-8") if hedef.exists() else None
            if eski == yeni:
                continue
            hedef.write_text(yeni, encoding="utf-8")
            print("  ✓ %s" % hedef.relative_to(KOK))
            n += 1
    print("\n%d dosya yazildi." % n if n else "\nHepsi zaten guncel.")
    if n:
        print("Unutma: src/ degisti — uc `build.py` yeniden kosmali.")
    return 0


def denetle() -> int:
    hatalar = []
    if not KAYNAK.is_dir():
        print("HATA: %s yok" % KAYNAK)
        return 1
    for ad in DOSYALAR:
        if not (KAYNAK / ad).exists():
            hatalar.append("brand/ortak/%s yok — kaynak eksik" % ad)
            continue
        yeni = uret(ad)
        for _sistem, hedef in hedefler(ad):
            if not hedef.exists():
                hatalar.append("%s yok — `python3 tools/ortak.py --yay`"
                               % hedef.relative_to(KOK))
                continue
            if hedef.read_text(encoding="utf-8") != yeni:
                hatalar.append("%s kaynaktan AYRISMIS — duzeltme "
                               "brand/ortak/%s icine yazilir"
                               % (hedef.relative_to(KOK), ad))
    if hatalar:
        print("Ortak CSS ayrismis:\n")
        for h in hatalar:
            print("  ✕ " + h)
        return 1
    print("Ortak CSS: uc arayuzde de kaynakla ayni (%d dosya)." % len(DOSYALAR))
    return 0


def main() -> int:
    if "--yay" in sys.argv:
        return yay()
    if "--denetle" in sys.argv:
        return denetle()
    print(__doc__)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
