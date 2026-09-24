#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Uc arayuzun ORTAK CSS'ini tek kaynaktan YAYAR ve ayrismayi DENETLER.

   NEDEN BOYLE

   Uc dosya uc uygulamada BAYT DUZEYINDE aynidir:

     base.css     219 satir   x3
     layout.css   671 satir   x3
     designs.css  565 satir   x3   (2026-09-24 kalkti: tek tasarim, EKIP-PLANI §8-4)
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
   `llm.js` boyleydi: SPI ile ESP ayni 737 satirlik kopyayi, AYS ise
   1337 satirlik gelismis hali tasiyordu (`diagnose`, `listModels`,
   `visionChain`...). 2026-09-24'te AYS'ninki (ve `providers.js`)
   kalip olarak tek kaynak oldu; SPI ve ESP gelismis hali aldi, geri
   alinan bir sey olmadi. Tablo su an bos; mekanizma yerinde duruyor.

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
    "jeton.css":    "css",
    "base.css":     "css",
    "layout.css":   "css",
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
    "aliskanlik.js":      "js/core",
    "aliskanlik.test.js": "tests",
    # HEDEF AGI — etkin hedeflerin ozeti HKM'ye, zaman butcesi geri
    # (HKM core/hedefag.py). Ozetin alanlari uc arayuzde ayni olmali.
    "hedefag.js":      "js/core",
    "hedefag.test.js": "tests",
    # Otomatik yedek istemcisi (HKM core/yedek.py): HKM acikken gunde bir.
    "yedekag.js":      "js/core",
    "yedekag.test.js": "tests",
    # King'in onay kapisi (HKM core/king.py): modulun teklif karti (Part 8a-3b).
    "kingteklif.js":      "js/core",
    "kingteklif.test.js": "tests",
    # GORSEL DENETIMI — tek dosya gorselsiz acildiginda bunu soylemek.
    # Uyari metni ve kosulu uc arayuzde ayni olmali.
    "gorsel.js":      "js/core",
    "gorsel.test.js": "tests",
    "urun.js":        "js/core",
    "urun.test.js":   "tests",
    # CEVRIMDISI KABUK — yalniz sunucuyla acilinca (http/https). Kabuk
    # `src/` kokunde durur: kapsami sayfanin klasorudur.
    # SERI DONDURMA ve TATIL — dondurulmus gunler (fikir 50, 56).
    "seri.js":        "js/core",
    "seri.test.js":   "tests",
    "temel.css":      "css",
    "temel.test.js":  "tests",
    # KABUK (T2) — ust cubuk, gun seridi, telefon bandi: uc arayuzde ayni
    # iskelet, ayni cekmece adlari (ekip/CEKMECE-HARITASI.md).
    "kabuk.js":       "js/core",
    "kabuk.css":      "css",
    "kabuk.test.js":  "tests",
    # HAREKET (T4) — once/sonra fotografi: yalniz DEGISEN oge hareket eder
    # (sayi, tik, satir kapanma), tek canli oge, kucülen baslik, odak
    # halkasi, onizleme, odak kapisi. Azaltilmis harekette hepsi kapali.
    "hareket.js":     "js/core",
    "hareket.css":    "css",
    "hareket.test.js": "tests",
    # AYAR (T5) — ayar ekranlarinin ortak davranisi: kaydedilmemis
    # degisiklik seridi, varsayilana don, ayar arama, tema onizlemesi.
    "ayar.js":        "js/core",
    "ayar.css":       "css",
    "ayar.test.js":   "tests",
    "pwa.js":         "js/core",
    "pwa.test.js":    "tests",
    "sw.js":          ".",
    # OLUMSUZLUK ve KIP SUZGECI — cumle ayristiricilarinin onundeki kapi
    # (ekip/HATALAR.md KR-1). «cozmedim» uc arayuzde de ayni sekilde
    # olumsuzdur; biri bir gun «-emedim»i unutursa o arayuz sahte olcum
    # yazar.
    "olumsuz.js":      "js/core",
    "olumsuz.test.js": "tests",
    # HKM BAGI — ayni anda TEK profil HKM'ye baglanir (ekip/HATALAR.md Y-7).
    # Sahip bilgisi cihazda, modul basina tek anahtarda; uc arayuzde ayni.
    "hkmbag.js":      "js/core",
    "hkmbag.test.js": "tests",
    # KARTLAR (K) — ortak bilesenler (ekip/EKIP-PLANI.md §4.1, K1). Ekranlar
    # bunlari K2'de kullanir; o zamana dek yalniz test sayfasinda yuklenir.
    # Sayi bileseni: 024 kesinlik, 025 koken karti, 026 tazelik, 028 fark.
    "sayi.js":        "js/core",
    "sayi.test.js":   "tests",
    # Grafik parcalari: 027 eksik gun, 035 aralik, 037 egilim, 041 doluluk.
    "grafik.js":      "js/core",
    "grafik.test.js": "tests",
    # Oneri karti ve onay kalibi: 110 111 112 114 116 121 150, 022 sonuc dugmesi.
    "oneri.js":       "js/core",
    # Test dosyasi `oneri.test.js` DEGIL: SPI'nin kendi src/tests/oneri.test.js'i
    # var (oneri kutusu testleri) ve yayim onun ustune yazardi.
    "onerikart.test.js": "tests",
    # Tek sozluk: 016 terim ipucu, 139 model kapali kipi (hazir cumle).
    "sozluk.js":      "js/core",
    "sozluk.test.js": "tests",
    # Guven: 173 yedek durumu, 177 kalici silme kapisi, 179 kayit gecmisi.
    "guven.js":       "js/core",
    "guven.test.js":  "tests",
    "kart.css":       "css",
    # MODEL KATMANI — uc arayuz (2026-09-24'ten beri AYS'ninki tek kaynak).
    "llm.js":        "js/core",
    "providers.js":  "js/data",
}

# Yayim sirasinda yer tutucusu degistirilen dosyalar. Otekiler bayt
# duzeyinde kopyalanir; burasi bir dize degistirmedir, sablon motoru
# degil — kural: yer tutucu YALNIZ ad alani ve depo oneki icin.
KALIPLAR = {"quota.js", "llm.js", "providers.js", "quota.test.js", "store.test.js"}

# Varsayilan UC sistemdir. Burada adi gecen dosya yalnizca listedeki
# sistemlere yayilir; otekiler o dosyaya hic sahip olmaz.
YALNIZ = {
    # Bos: `llm.js` 2026-09-24'e kadar yalniz SPI ve ESP'ye gidiyordu;
    # AYS'nin gelismis hali tek kaynak olunca ucune birden yayildi.
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


URETILMIS_ISARET = "/* ÜRETİLMİŞ KOPYA"


def elle_yazilmis(hedef: Path) -> bool:
    """Hedef VAR ve basinda uretilmis kopya isareti YOKSA elle yazilmistir.

    Yayim bir dosyanin ustune yalniz kendi urettigi kopyanin ustune
    yazar. Isaretsiz bir hedef, arayuzun KENDI dosyasidir ve ortak
    kaynakla ayni adi tasiyordur: `brand/ortak/oneri.test.js` eklenince
    yayim SPI'nin kendi `src/tests/oneri.test.js`'ini sessizce ezdi
    (K yakaladi, ekip/HATALAR.md T2-07)."""
    if not hedef.exists():
        return False
    with open(hedef, encoding="utf-8") as f:
        bas = f.read(len(URETILMIS_ISARET) + 8)
    return not bas.startswith(URETILMIS_ISARET)


def yay() -> int:
    if not KAYNAK.is_dir():
        print("HATA: %s yok" % KAYNAK)
        return 1
    n = 0
    reddedilen = []
    for ad in DOSYALAR:
        if not (KAYNAK / ad).exists():
            print("  ! brand/ortak/%s yok, atlandi" % ad)
            continue
        for sistem, hedef in hedefler(ad):
            yeni = uret(ad, sistem)
            hedef.parent.mkdir(parents=True, exist_ok=True)
            if elle_yazilmis(hedef):
                reddedilen.append(hedef.relative_to(KOK))
                continue
            eski = hedef.read_text(encoding="utf-8") if hedef.exists() else None
            if eski == yeni:
                continue
            hedef.write_text(yeni, encoding="utf-8")
            print("  ✓ %s" % hedef.relative_to(KOK))
            n += 1
    print("\n%d dosya yazildi." % n if n else "\nHepsi zaten guncel.")
    if n:
        print("Unutma: src/ degisti — uc `build.py` yeniden kosmali.")
    if reddedilen:
        print("\nYAZILMADI — hedefte ayni adli ELLE YAZILMIS dosya var "
              "(basinda uretilmis kopya isareti yok):")
        for r in reddedilen:
            print("  ✕ %s" % r)
        print("Ortak kaynaga baska bir ad ver ya da o dosyayi bilerek kaldir.")
        return 1
    return 0


def baglanmayan():
    """Yayilan ama sayfaya BAGLANMAYAN kopyalar.

    Kopya kaynakla ayni olabilir ve yine de hic calismaz: sayfa onu
    yuklemiyorsa. K'nin `grafik.js`, `oneri.js`, `sozluk.js`, `guven.js`
    dosyalari uc arayuze yayildi, testlerde kostu, ama hicbir
    `index.html` onlari yuklemiyordu — uygulamada yoklardi ve bunu
    hicbir denetim soylemedi. Kok dosyalar (`sw.js`) etiketle degil
    kayitla yuklenir; onlar sayilmaz."""
    out = []
    for ad, klasor in DOSYALAR.items():
        if klasor == ".":
            continue
        for sistem, hedef in hedefler(ad):
            src = KOK / sistem / "src"
            if klasor == "tests":
                sayfa, ref = src / "tests" / "index.html", '"%s"' % ad
            else:
                sayfa, ref = src / "index.html", '"%s/%s"' % (klasor, ad)
            if not sayfa.exists():
                continue
            if ref not in sayfa.read_text(encoding="utf-8"):
                out.append("%s yayildi ama %s onu yuklemiyor"
                           % (hedef.relative_to(KOK), sayfa.relative_to(KOK)))
    return out


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
            if elle_yazilmis(hedef):
                hatalar.append("%s ELLE YAZILMIS bir dosya ve ortak kaynakla "
                               "ayni adi tasiyor — ortak dosyaya baska ad ver"
                               % hedef.relative_to(KOK))
                continue
            if hedef.read_text(encoding="utf-8") != yeni:
                hatalar.append("%s kaynaktan AYRISMIS — duzeltme "
                               "brand/ortak/%s icine yazilir"
                               % (hedef.relative_to(KOK), ad))
    hatalar.extend(baglanmayan())
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
