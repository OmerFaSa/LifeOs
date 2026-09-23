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

   Uc dosyayla basladi (base/layout/designs.css), on yediye cikti.
   Eklenen
   her dosya ayni olcutu gecti: UC ARAYUZDE BIREBIR AYNI olmak zorunda
   mi? Oyleyse kaynak burada durur.

     kesinlik.*   dort kesinlik etiketi. Ayni `measured` birinde
                  «olculdu», oburunde baska bir sey gosterirse deponun
                  en cok tekrarlanan kurali ekranda ikiye ayrilir.
     tanitim.*    ilk kurulumun uc adimi. Sorular ucunde de ayni;
                  ayri yazilsalardi bir gun birinde IKINCI adim
                  duserdi ve o adim sistemin SINIRINI soyluyor.
     simge.*      bir kimligi gorseline ceviren ad kurali. Her
                  ekranin kendi kurmasi, biri bir gun `ders_tyt_turkce`
                  yazmasi demekti.
     medya.js     URETILMIS kunye (`tools/marka.py --kunye`): hangi
                  gorselin gercekten var oldugu. Uc arayuzun de ayni
                  kunyeye bakmasi gerekir.

   `tokens.css` (78 satir fark), `palettes.css` (52) ve `components.css`
   (~50) KISMEN ortaktir: farklari ajan renkleri ve uygulamaya ozel
   birkac bilesendir. Onlari paylasmak "ortak govde + uygulama kuyrugu"
   ayrimini gerektirir ve bu bir TASARIM KARARIDIR, bir kopyalama isi
   degil. Tam ortak olanlar zaten kazancin buyuk kismidir; kismi olanlar
   ayri bir tur.

   HKM'nin yuzu de YAYILMAZ ve bu bir eksik degil: HKM tek dosyadir ve
   uc arayuzun yanINDA durur, icinde degil (AGENTS.md §1.4). Ortak olan
   sozu tasir ama dosyayi tasimaz; `HKM/tests/test_yuz.py` iki tarafin
   ayni cumleyi soyledigini sinar.

   `fonts.css` de ucunde ayni ama tasinmaz: gomulu yazi tipi
   tanimlarini `<APP>/tools/fonts.py` uretir ve o uretimin hedefi
   uygulamanin kendi klasorudur. Uretilmis bir dosyayi ikinci bir
   ureticinin altina koymak, iki sahipli bir dosya yapardi.

   YER TUTUCU — AYNI GOVDE, BASKA AD ALANI

   Ilk on uc dosya ucunde BAYT DUZEYINDE aynidir. Ama bir dosya
   ucunde ayni ISI yapip yalnizca AD ALANINDA ayrilabilir: `quota.js`
   uc kopyasi 280 satirdir ve aralarindaki tek fark `R.` / `SP.` /
   `ESP.` ile depo onekidir (`rota.llm.quota` / `spi...` / `esp...`).

   Boyle bir dosya kaynakta YER TUTUCU tasir ve yayim sirasinda
   degistirilir:

     __NS__       ad alani       R      SP     ESP
     __DEPO__     depo oneki     rota   spi    esp
     __BASLIK__   saglayiciya gonderilen baslik (X-Title)

   Bu, `seviye.py`'nin makinesini buraya tasimak DEGILDIR: orada
   markup uretilir, HTML'e isaret arasina yazilir, dort sunucunun
   icine Python blogu gomulur. Burada yapilan tek sey bir dize
   degistirmedir ve onsuz bu dosyalar hic paylasilamazdi.

   Bunun bir borc olmadigina dair kanit: `status()` icinde "sinir
   bilinmiyorsa alanlar NULL doner" duzeltmesi SPI kopyasina yazildi,
   AYS ve ESP kopyalarinda UNUTULDU. Uc ay boyunca hicbir denetim
   soylemedi. Tek kaynak bunu imkansiz kilar.

   HER DOSYA UC SISTEME GITMEZ

   `YALNIZ` tablosunda adi gecen dosya orada yazan sistemlere yayilir.
   `llm.js` boyledir: SPI ile ESP kopyalari ayni dosyanin iki
   kopyasidir (737 satir, fark yalnizca ad alani), AYS'ninki ise BASKA
   BIR SEYDIR — 1337 satir ve otuz fazla islev (`diagnose`,
   `listModels`, `visionChain`, `stripThinking`...). Uc kopyayi zorla
   birlestirmek, AYS'nin uc aylik gelisimini geri almak olurdu.

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
    # KOTA — ucretsiz modellerin istek siniri. Uc kopya, tek fark ad
    # alani. Ayrisma KANITLI: `status()` semasi duzeltmesi SPI'ye
    # yazildi, oteki iki kopyada unutuldu.
    "quota.js":      "js/core",
    "quota.test.js": "tests",
    # DEPO TESTI — uc `store.js` ayni dosya DEGIL ama ayni YUZEYI acar.
    # Paket o yuzeyin sozunu sinar; govdesini degil. AYS'de %46, ESP'de
    # %54 olan kapsami olcum gosterdi ve ikisinde de paket yoktu.
    "store.test.js": "tests",
    # YEDEK HATIRLATMASI — veri kaybi geri alinamayan TEK olaydir ve uc
    # sistemin verisi de ayni olcude geri alinamaz. Uc arayuz ayni vaadi
    # uc ayri bicimde veriyordu: AYS 7 gun ve gunluk ekranda, SPI 30 gun
    # ve yalniz rehber rozetinde, ESP 30 gun ve yasi UTC'den. Kural tek
    # kaynakta; damganin hangi anahtarda durdugu her sistemde kalir.
    "yedek.js":      "js/core",
    "yedek.test.js": "tests",
    # HAFIZA — dort katman, yazma izni, komutlar. Uc arayuzde de ayni
    # olmak zorunda: «model hafizaya yazamaz» sozu birinde gevserse,
    # halusinasyon o arayuzde kalici olur.
    "hafiza.js":      "js/core",
    "hafiza.test.js": "tests",
    # OFIS KATLARI — King > Patron > uzman zinciri ve istem iskeleti.
    # «Kim kimin denetiminde konusur» uc arayuzde ayni olmali; biri
    # King'i bilmezse o arayuzun Patron'u modulun ustunu bilmez.
    "ofis.js":        "js/core",
    "ofis.test.js":   "tests",
    # HEDEF MOTORU — herhangi bir hedefi alan genel cerceve (ekip/PLAN.md).
    # Alan paketleri her modulun kendisindedir; motor ortak.
    "hedef.js":       "js/core",
    "hedef.test.js":  "tests",
    # HEDEF AGI — etkin hedeflerin ozeti HKM'ye, zaman butcesi geri
    # (HKM core/hedefag.py). Ozetin alanlari uc arayuzde ayni olmali.
    "hedefag.js":      "js/core",
    "hedefag.test.js": "tests",
    # GORSEL DENETIMI — tek dosya gorselsiz acildiginda bunu soylemek.
    # Uyari metni ve kosulu uc arayuzde ayni olmali.
    "gorsel.js":      "js/core",
    "gorsel.test.js": "tests",
    # MODEL KATMANI — yalniz SPİ ve ESP (bkz. YALNIZ).
    "llm.js":        "js/core",
}

# Yayim sirasinda yer tutucusu degistirilen dosyalar. Otekiler bayt
# duzeyinde kopyalanir; burasi bir dize degistirmedir, sablon motoru
# degil — kural: yer tutucu YALNIZ ad alani ve depo oneki icin.
KALIPLAR = {"quota.js", "llm.js", "quota.test.js", "store.test.js"}

# Varsayilan UC sistemdir. Burada adi gecen dosya yalnizca listedeki
# sistemlere yayilir; otekiler o dosyaya hic sahip olmaz.
YALNIZ = {
    # AYS'nin `llm.js`'i bu dosyanin kopyasi DEGIL, gelismis halidir.
    # Ayrintisi ust taraftaki "HER DOSYA UC SISTEME GITMEZ" bolumunde.
    "llm.js": ["SPI", "ESP"],
}

YERTUTUCU = {
    "AYS": {"__NS__": "R",   "__DEPO__": "rota",
            "__BASLIK__": "Rota — YKS ofisi"},
    "SPI": {"__NS__": "SP",  "__DEPO__": "spi",
            "__BASLIK__": "SPİ — sağlık ofisi"},
    "ESP": {"__NS__": "ESP", "__DEPO__": "esp",
            "__BASLIK__": "ESP — entelektüel ofis"},
}

BASLIK = ("/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.\n"
          "   Düzeltme brand/ortak/%s içine yazılır; burası bir sonraki\n"
          "   `python3 tools/ortak.py --yay` ile yeniden üretilir. */\n")

KALIP_BASLIK = ("/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.\n"
                "   Düzeltme brand/ortak/%s içine yazılır; burası bir sonraki\n"
                "   `python3 tools/ortak.py --yay` ile yeniden üretilir.\n"
                "   Kaynak bir KALIPTIR: ad alanı ve depo öneki yayım\n"
                "   sırasında konur (__NS__, __DEPO__, __BASLIK__). */\n")


def uret(ad: str, sistem: str) -> str:
    """Kaynagi okur, kalipsa yer tutucularini degistirir, basina baslik koyar.

    Yer tutucu degistirme DUZ bir dize degistirmedir ve oyle kalmali:
    kosul, dongu, icerme yok. Bir gun bunlardan birine ihtiyac duyulursa
    cozum sablon motoru eklemek degil, o dosyayi paylasmamaktir."""
    govde = (KAYNAK / ad).read_text(encoding="utf-8")
    if ad not in KALIPLAR:
        return (BASLIK % ad) + govde
    for yer, deger in YERTUTUCU[sistem].items():
        govde = govde.replace(yer, deger)
    kalan = [y for y in YERTUTUCU[sistem] if y in govde]
    if kalan:  # degistirilememis yer tutucu sessizce gecmemeli
        raise ValueError("%s (%s): degistirilmemis yer tutucu: %s"
                         % (ad, sistem, ", ".join(kalan)))
    return (KALIP_BASLIK % ad) + govde


def hedefler(ad: str):
    klasor = DOSYALAR[ad]
    for sistem in YALNIZ.get(ad, SISTEMLER):
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
        for sistem, hedef in hedefler(ad):
            yeni = uret(ad, sistem)
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
        for sistem, hedef in hedefler(ad):
            yeni = uret(ad, sistem)
            if not hedef.exists():
                hatalar.append("%s yok — `python3 tools/ortak.py --yay`"
                               % hedef.relative_to(KOK))
                continue
            if hedef.read_text(encoding="utf-8") != yeni:
                hatalar.append("%s kaynaktan AYRISMIS — duzeltme "
                               "brand/ortak/%s icine yazilir"
                               % (hedef.relative_to(KOK), ad))
    if hatalar:
        print("Ortak kaynak ayrismis:\n")
        for h in hatalar:
            print("  ✕ " + h)
        return 1
    kopya = sum(len(list(hedefler(ad))) for ad in DOSYALAR)
    print("Ortak kaynak: kopyalar kaynakla ayni (%d dosya, %d kopya)."
          % (len(DOSYALAR), kopya))
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
