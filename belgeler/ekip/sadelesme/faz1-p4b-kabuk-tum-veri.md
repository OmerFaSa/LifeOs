# Faz 1 · P4b · Kabuk sahibin bütün verisini gösterir (2026-11-14)

## Özet

- **Başlangıç paketi artık not, kayıt, kart ve beden bilgisinin yanında plan, soru ve Yol ilerlemesini de taşıyor.**
  Her kayıt motorun kendi göç bağdaştırıcısından geçiyor. Yönlendirme tek yerde: `tools/gercek_kosu.js` `ROTA`.
  Yeni dönüştürme kodu yazılmadı.
- **Gerçek veride kuru koşu:** kaynak `lifeos.db`'nin kopyası, 640 canlı kayıt. Önceki paket 5 not, 5 kayıt, 0 kart
  ve 4 beden alanı taşıyordu. Yeni paket 5 not, 5 kayıt, 0 kart, **69 plan**, 0 soru, **2 Yol girdisi** ve 4 beden alanı
  taşıyor:
  - 69 plan: 22 AYS gün planı, 45 hafta hedefi ya da program kaydı, 2 SPİ hafta şablonu.
  - 2 Yol girdisi: 1 eski konu durumu ve 1 cevap.

  Pakete 43 kayıt giriyor. **597 kayıt depoda kalıyor** ve her birinin nedeni yazılı. 342'si King'in kendi verisi
  (sohbet, kullanım, hafıza). 177'si cihazların arayüz ayarı ya da izi.
- **Kart ve soru gerçek veride 0, ama kayıp yok.** Depoda AYS/ESP kartı, deneme ya da hata kaydı yok. 22 AYS gününün
  64 bloğunun hepsi «bekliyor» durumunda. Yapılan dakika ve çözülen soru yazılmamış, bu yüzden Kayıt ve Soru'ya
  taşınacak ölçüm yok. Test ve gezi bu türleri gerçek eski biçimle sınıyor.
- **Kabuk:**
  - «Getir» paketi kimlikle birleştirir ve buradaki değere dokunmaz. İkinci kez getirmek bir şey değiştirmez.
  - Yeni bir paket kimliği görülünce yalnız buraya henüz gelmemiş olanlar teklif edilir. Gelecek bir şey yoksa
    sahibe sorulmaz, yalnız iz yazılır.
  - Plan ve Soru ekranlarına salt okunur bir «Eski sistemden» bölümü eklendi. Yol haritası, Akademik satırında eski
    konu durumunu sayıyor.
- `veri.OKU` değişmedi. Kapanış dalına dokunulmadı. `%LOCALAPPDATA%\LifeOS` dizinine yazılmadı. Çalışan kopyaya ve
  portlarına dokunulmadı.

## Tür tablosu

Sayılar gerçek verinin kopyasından, yalnız adet. «Pakete giren» sütunu kabuğa gelen öğe sayısını verir; bir gün
kaydı birkaç motora bölünebilir. «Göremedim» sütunu motorların `EKSIK` listesinden alındı: içinde «göremedim» geçen
maddeler.

| Tür (depoda) | Rota | Depoda | Pakete giren → ekran | Gösterilmeyen (neden) | Göremedim (EKSIK) |
|---|---|---:|---|---|---|
| ays.days | ays:days | 22 | 22 gün planı → Plan › Eski sistemden. Kayıt 0, Soru 0, gün notu 0. | 64 bloğun 64'ü «bekliyor»: yapılan dakika, çözülen soru ve not yok | kontrol listesi (checklist), dikkat dağılması (distractions) |
| plan_blogu | ays:weeks, ays:plan | 5 | 4 hafta sözleşmesi, 1 program ve 40 program haftası → Plan › Eski sistemden. Hafta başı AYS profilinin ilk gününden (44/44 dolu). | – | – |
| spi.haftaplan | spi:haftaplan | 2 | 2 hafta şablonu (su, hareket) → Plan › Eski sistemden | – | – |
| ays.topics | ays:topics | 1 | Yol: 1 eski konu durumu (durumu boş) ve 1 cevap → `lifeos.yol.akademik.1`, Yol haritası | Kapanış kartı 0 ve konu notu 0: ölçüm ve not yok | durumun değiştiği an; unutma |
| olcum | spi:vitals | 5 | 5 kayıt → Kayıt | – | – |
| profil | spi:profile, ays:profile, esp:profile | 3 | SPİ: 4 Beden alanı. AYS: yalnız programın ilk günü (hafta tarihleri için). | AYS profilinin öteki alanları ve ESP profili: Çekirdek göçünün işi | – |
| not | ays/spi/esp:defter, ays:defterklasor | 6 | 4 not → Not | 1 ret («Başlığı da gövdesi de boş not kaydedilmez.»); klasör ağacı notlardan yeniden çıkar | – |
| bam | hkm:bam_* | 5 | 1 not (BAM araştırma kaydı) → Not | 4 arşiv (`goc.HKM_ARSIV`: iz, iş adımları) | – |
| gun_kaydi | anahtar:lifeos.bilinc, anahtar:lifeos.gun | 3 | Bilinç: 0 (düşüncesi yok) | **2: eski Gün sayfasının gün bloğu ve kartı. Sahibi motor yok** | göremedim |
| sohbet | hkm:conversations | 168 | – | King'in verisi. Kabukta King sohbet ekranı yok (King Claude'da konuşur): yalnız depoda | – |
| kullanim | hkm:usage | 169 | – | King'in model maliyet defteri: yalnız depoda | – |
| kisi_bilgisi | hkm:memories | 5 | – | Sahibi King hafızası, Not değil (faz1-hkm-sahiplik.md): yalnız depoda | – |
| akis | hkm:bildirimler, is_emirleri, intents | 9 | – | arşiv (`goc.HKM_ARSIV`'in nedenleri) | – |
| anahtar | anahtar:* (cihaz başına) | 219 | – | 177 arayüz ayarı ya da izi (tema, ses, manzara, panel görünürlüğü…; kabuk kendi ayarını tutar). 39 eski King sohbeti, arşivi ve ayarı (King'in). 1 ESP profil listesi (Çekirdek). 1 AYS anlık yedeği (türetilmiş). **1 SPİ hane listesi: sahibi yok** | spi.household |
| meta | ays/spi/esp:meta | 7 | – | sürüm, yedek ve hafıza izi: türetilmiş | – |
| tercih, esp.prefs, planlama | pc:*, esp:prefs | 6 | – | eski arayüz tercihi ve PC planlama kuyruğu: Çekirdek | – |
| gun_kopya | gun:gun_kopya | 2 | – | sunucunun gün kopyası: türetilmiş | – |
| spi.basarim, spi.seviye | spi:* | 2 | – | rozet ve seviye: §0.1 arşiv | – |
| spi.chats | spi:chats | 1 | – | SPİ'nin eski King sohbeti: yalnız depoda | – |
| **Toplam** | | **640** | **43 kayıttan** 5 not, 5 kayıt, 69 plan, 2 Yol, 4 beden | **597** | |

Gerçek veride bugün olmayan türler de bağlı. Gelirlerse aynı yoldan geçerler ve test ile gezi bunları sınıyor:

| Tür | Ekran |
|---|---|
| AYS ve ESP kartı | Tekrar (iki yüzlü) |
| SPİ öğünü ve antrenmanı; AYS çalışma ve uyku kaydı, ruh hâli, mola; ESP günü | Kayıt |
| AYS denemesi, hata ve gün sorusu | Soru › Eski sistemden |
| AYS istisnası | Plan |
| Konu okuması | Yol |

## Nasıl

1. **`tools/kabuk_baslangic.py`** depoyu geçici bir kopyadan okur, canlı dosyayı açmaz. Kayıtları rotaya göre
   gruplar ve AYS profilinin `startDate` alanını okur. Bu alan yoksa AYS'nin kendi varsayılanı `2026-09-14`
   kullanılır. Gruplar `baglam.baslangic` ile birlikte Node yardımcısına gider.
   - Paket alanları: `notlar`, `kayitlar`, `kartlar`, `plan { gunler, hedefler, sablonlar }`,
     `soru { denemeler, hatalar, gunler }`, `yol { 'akademik.1': { dersler, cevaplar, eski } }`, `beden`.
   - `say` bölüm başına sayıyı verir. Kimlik içerikten üretilir: içerik değişirse kimlik de değişir ve kabuk
     paketi yeniden teklif eder.
   - Ekrana yalnız ad ve sayı basar: rota tablosu ve nedenleri, bağdaştırıcı tablosu (girdi, pakete giren, ret,
     çökme, pakete girmeyen çıktı ve nedeni, EKSIK madde sayısı) ve «göremedim» maddeleri.
2. **`tools/kabuk_baslangic.js`** `ROTA` zincirini kayıtlara uygular. Çıktıyı bağdaştırıcı önekine göre kabuk
   deposuna ayırır: `plan.*` plana, `soru.*` soruya, `yol.aysKonu` Yol'a. Kartta iki yüz zorunlu; iki yüzü olmayan
   kart «pakete girmeyen çıktı» sayılır ve nedeni yazılır. Rotası olmayan kayıt `rotasiz` olarak sayılır.
   Partiler arasında tekilleştirme kimlikle yapılır. AYS gün planının kimliği olmadığı için anahtarı `kaynak:gun`.
3. **`tools/gercek_kosu.js` `ROTA`'da iki küçük değişiklik:**
   - `plan.aysHafta` ve `plan.aysPlan` artık `baglam.baslangic` alıyor. gercek_kosu.py bu bağlamı vermediği için
     orada davranış aynı (`bas` null).
   - `yol.aysKonu` sarmalayıcısı Yol kaydının tamamını da döndürüyor (`kayit`).
4. **Kabuk (`kabuk/araclar.js`):**
   - `baslangicBirlestir` yedi bölümü kimlikle birleştirir. Var olan kimliğe dokunmaz. Motorun kabul etmediği
     şekli almaz (bozuk gün, tanınmayan hedef, iki yüzsüz kart).
   - `baslangicYol` Yol kaydına yalnız eksik `dersler`, `cevaplar` ve `eski` anahtarlarını ekler. Kabukta verilmiş
     cevap ve geçilmiş kapı kalır. `eski` hiçbir kapıyı geçirmez (Yol testi ve kabuk testi bunu sınıyor).
   - Yeni kayıt anahtarları `lifeos.plan.eski` ve `lifeos.soru.eski` (IndexedDB'de; `depo.test.js` listesine
     eklendi). Yol kaydı aşamanın kendi anahtarına `Kabuk.Asama.yaz` ile yazılır (`lifeos.yol.akademik.1`).
   - Teklif paketin toplamını değil, buraya henüz gelmemiş olanı sayar. Sonuç iletisi verinin hangi araçlarda
     göründüğünü söyler.
   - Ekranlar:
     - Plan › «Eski sistemden»: gün planları (yapılan/planlanan blok, planlanan dakika «hesaplandı»), hafta
       hedefleri ve program (başlangıç günü, soru hedefi, kapasite), hafta şablonları.
     - Soru › «Eski sistemden»: denemeler (`Soru.denemeAnalizi` neti ve kendi etiketi), günlük soru sayıları,
       hata defteri dağılımı.
     - Her satırda «eski kayıt» pulu var. Yol haritasındaki alan satırı «N konu eski sistemden (eski kayıt)» der.
   - Kural: eksik sayı sıfır yazılmaz. Çözülen boşsa satır «çözülen veri yok» der. Taslaklar taslak kalır: Not
     çıktısı olduğu gibi geçer, kart yalnız iki yüzlü olunca girer.

## Gerçek veride kuru koşu

`%LOCALAPPDATA%\LifeOS\veri\lifeos.db` bayt bayt scratch klasörüne kopyalandı. Kaynakta `-wal` ya da `-shm` yoktu.
Araç bu kopyanın da kopyasını açtı. Komut:
`python tools/kabuk_baslangic.py --depo <kopya> --cikti <scratch>/out1.json --zaman 1`. Sonuç çıkış 0, geçici kopya
kalmadı. Çıktı ve kopyalar raporlamadan sonra silindi.

```
Kabuk başlangıç paketi `26ca3501096bff07`: 5 not, 5 kayıt, 0 kart, 69 plan (22 gün, 45 hafta hedefi/program, 2 şablon),
0 soru, 2 Yol girdisi, 4 beden alanı
Depoda 640 canlı kayıt; yalnız depoda kalan 597.
```

| Bağdaştırıcı | Girdi | Pakete giren | Ret | Çöktü | Pakete girmeyen çıktı | EKSIK madde |
|---|---:|---:|---:|---:|---:|---:|
| kayit.aysGun | 22 | 0 | 0 | 0 | 0 | 5 |
| kayit.spiProfil | 1 | 1 | 0 | 0 | 0 | 2 |
| kayit.spiVitals | 5 | 5 | 0 | 0 | 0 | 3 |
| not.aysKonu | 1 | 0 | 0 | 0 | 0 | 0 |
| not.bamKayit | 1 | 1 | 0 | 0 | 0 | 0 |
| not.bilinc | 1 | 0 | 0 | 0 | 0 | 0 |
| not.defter | 5 | 4 | 1 | 0 | 0 | 0 |
| not.gunNotu | 27 | 0 | 0 | 0 | 0 | 0 |
| plan.aysGun | 22 | 22 | 0 | 0 | 0 | 12 |
| plan.aysHafta | 4 | 4 | 0 | 0 | 0 | 4 |
| plan.aysPlan | 1 | 41 | 0 | 0 | 0 | 5 |
| plan.spiHaftaplan | 2 | 2 | 0 | 0 | 0 | 6 |
| soru.aysGun | 22 | 0 | 0 | 0 | 0 | 4 |
| tekrar.aysKapanis | 1 | 0 | 0 | 0 | 0 | 3 |
| yol.aysKonu | 1 | 1 | 0 | 0 | 0 | 6 |

Kabuk tarafı aynı paketle denendi: `baslangicBirlestir`, boş bir kabuk deposuna Node'da uygulandı.

| Koşu | not | kayıt | kart | plan | soru | yol |
|---|---:|---:|---:|---:|---:|---:|
| Boş depoya | 5 | 5 | 0 | 69 | 0 | 2 |
| İkinci kez | 0 | 0 | 0 | 0 | 0 | 0 |

İkinci koşuda 79 öğenin hepsi «zaten var» diye atlandı. Sahip eski paketi daha önce getirdiyse yeni kimlik 69 plan
ve 2 Yol girdisi için teklif çıkar. Not ve kayıt zaten oradadır, sayılmaz.

## Testler

| Komut | Sonuç |
|---|---|
| `python tools/kabuk_baslangic_test.py` | 21/21 (önceden 11) |
| `node kabuk/kabuk.test.js` | 67/67 |
| `node kabuk/depo.test.js` | 13 |
| `node kabuk/bilesen.test.js` | 21 |
| `node kabuk/deneme.test.js` | 6 |
| `node kabuk/onay.test.js` | 15 |
| `node kabuk/tanisma.test.js` | 25 |
| `node motor/*.test.js` | kayıt 30, not 28, not-hkm 7, plan 27, soru 33, tekrar 21, yol 24 (değişmedi) |
| `python tools/gercek_kosu_test.py` | hepsi yeşil |
| `python tools/goc_test.py` | temiz |
| `python tools/tek_kapi_ac_test.py` | 128/128 |
| `python tools/belge_dizin_kabul_test.py` | 108 belge |
| `python kalite/katman.py` | tamam (1 bilinen istisna) |
| `python kalite/olcum.py --denetle` | 28 bütçe, aşım yok |

**`kabuk_baslangic_test.py`.** Uydurma bir depo, eski modüllerin gerçek biçimleriyle kuruluyor:
- SPİ ölçüsü, öğünü, antrenmanı ve hafta planı; AYS günü (bloklar, uyku, soru); AYS hafta sözleşmesi ve programı
  (`startDate` ile); AYS ve ESP kartı; AYS denemesi ve hatası; HKM sohbeti.
- AYS konusu gerçek Akademik aşamasıyla: `tr-01` dersinin ilk alıştırması.

Denetlenenler:
- Her tür doğru bölüme giriyor, kesinlik etiketi korunuyor.
- Hafta başı profilin ilk gününden geliyor.
- Yol'a ölçüm ve not girmiyor.
- King sohbeti ve sahipsiz rota «yalnız depoda» kalıyor, nedeni yazılıyor.
- İki yüzsüz kart «pakete girmeyen çıktı» olarak nedeniyle sayılıyor.
- «Göremedim» listesi EKSIK'ten geliyor.
- Ekrana içerik basılmıyor, depo değişmiyor.
- Kimlik ve içerik deterministik.
- `PARTI=1`, yani her grup ayrı Node çağrısında çevrildiğinde de aynı paket çıkıyor.

**`kabuk/kabuk.test.js`** yeni test. Plan, soru ve Yol öğeleri motorların gerçek `GOC` çıktısıyla geliyor.
Denetlenenler:
- Bozuk gün ve tanınmayan hedef alınmıyor.
- Kabukta verilmiş Yol cevabı ve geçilmiş kapı kalıyor.
- Hatalı aşama adı alınmıyor.
- `eski` durumunda «closed» üniteyi geçirmiyor (gerçek Akademik aşamasında `Yol.durum`).
- İkinci birleştirmede hiçbir şey değişmiyor.
- Metin ve araç adları doğru.

## Gezi

`node tools/kabuk_gez.js` bir kez koşuldu: yalıtılmış ortam, port 4397, tek headless tarayıcı. Sonuç **327 ✓,
0 ✕, «hepsi geçti»**.

Gezinin başlangıç paketi artık gerçek eski biçimdeki altı rotadan kuruluyor: AYS günü, hafta, SPİ hafta planı, AYS
denemesi, AYS kartı ve AYS konusu. Paket `tools/kabuk_baslangic.js topla` ile, yani aracın kendi zinciriyle
üretiliyor. Elle yazılmış bir not ve bir ölçü de pakete ekleniyor. Yeni ve değişen denetimler (12 başlangıç
denetiminin 9'u):

1. Teklif yalnız gelecek olanı sayıyor: 1 not, 2 kayıt, 1 kart, 3 plan, 2 soru kaydı, 1 Yol ilerlemesi.
   - Gezi aynı Akademik alıştırmasını daha önce kabukta cevaplıyor. Bu yüzden Yol'dan yalnız eski konu durumu
     geliyor.
   - Gezi bunu kendisi ölçüyor: önceki cevap yoksa beklenen Yol sayısı 2 olur.
2. «Getir» sonucu altı aracı adıyla söylüyor.
3. Kabukta verilmiş Yol cevabının üstüne yazılmadı.
4. AYS çalışması Kayıt deposunda, kesinlik etiketiyle.
5. Plan: «1/1 blok yapıldı · planlanan 50 dk», «Hafta 2 · Hafta iki», «14 Eyl 2026 başlar · 400 soru hedefi»,
   «Yürüyüş» ve «eski kayıt» pulu görünüyor. Telefonda yatay taşma yok.
6. Soru: «Tam TYT · 19 Eki 2026», «28 net (hesaplandı)», «28 çözüldü · 20 doğru».
7. Tekrar: eski AYS kartı görünüyor.
8. Yol haritası: Akademik satırında «1 konu eski sistemden (eski kayıt)».
9. Yol kaydı: cevap gerçek alıştırmada, hiçbir kapı geçilmemiş.

Önceden de olan denetimler yeşil kalıyor: Beden ayarının üstüne yazılmadı; eski not Not aracında; aynı paket ikinci
kez teklif edilmiyor; konsolda hata yok.

## Kapanıştan önce kalan

1. **Çalışan kopyada yeni paket üretilmeli.** Diskteki paket eski kodla üretildi (`e22ebcc2…`: 5 not, 5 kayıt,
   0 kart, 4 beden). Sırayla:
   - Bu değişiklik birleşir ve çalışan kopya güncellenir.
   - Çalışan kopyada `python tools/kabuk_baslangic.py` bir kez koşar ya da tek kapının «Kabuk başlangıç paketi»
     adımı yeniden yapılır. Bu adım yalnız `kabuk-baslangic.json` yazar.
   - Sahip Bugün'ü açıp «Getir»e basar. Teklif 69 plan ve 2 Yol girdisi gösterir; daha önce getirdiği not ve kayıt
     sayılmaz.

   Bu adım `%LOCALAPPDATA%` dizinine yazdığı için bu pakette yapılmadı.
2. **Sahibi motor olmayan 3 sahip kaydı:** `lifeos.gun.*` (2: eski Gün sayfasının gün bloğu ve kartı) ve
   `spi.household` (1: hane listesi). Kapanış eski ekranları silince bu kayıtlar yalnız depoda kalır.
3. **King'in 342 kaydı ve 39 eski King anahtarı yalnız depoda.** Sahipliğe göre bu doğru: King, Claude'da MCP ile
   konuşuyor. Kapanıştan önce King'in bunları gerçekten okuduğu doğrulanmalı. Kabukta sohbet ekranı yok.
4. **AYS profilinin öteki alanları ve ESP profili** (sınav tarihleri, hedef sıra, zayıf dersler, ESP odakları)
   Çekirdek göçünün işi. Kabukta bunların ekranı yok. Bu paket AYS profilinden yalnız programın ilk gününü okudu.

## Açık sorular

1. **Otomatik getirme yapılmadı.** Getirmek tek dokunuş olarak kaldı. Yeni kimlik görülünce yalnız yeni olan
   teklif ediliyor; yeni bir şey yoksa sahibe hiç sorulmuyor. Birleştirme hiçbir değerin üstüne yazmadığı için
   otomatik getirme güvenli olurdu. Yine de «Getir»i sahibin onay noktası olarak bıraktım: eski yerlerinde de
   duruyorlar. Sahip sormadan getirilmesini isterse değişiklik tek satır: teklif yerine `baslangicGetir()`.
2. **AYS'nin 22 gününün 64 bloğunun hepsi «bekliyor».** Yapılan dakika, çözülen soru ve gün notu yok. Gerçekten
   işaretlenmemiş olabilir. Ya da bu bilgi yalnız HKM `raw_events`'te kalmış olabilir: oradaki 38 modül-günün
   karşılığı depoda yok (faz1-hkm-sahiplik.md Açık 1) ve `raw_events` türetilmiş sayılıp taşınmadı. Kapanıştan
   önce sahibe sorulmalı.
3. **Eski plan ve soru kayıtları ayrı anahtarda duruyor ve motorlar onları okumuyor.** Bunlar listede görünüyor;
   hafta planı, deneme gidişi (`Soru.gidisSerisi`) ve arama (`kabuk/arama.js`) okumuyor. Gerçek veride deneme
   yok, bugün bir kaybı yok. Bağlamak ayrı bir paket.
4. **Yol'un eski konu durumu yalnız Yol haritası satırında sayı olarak görünüyor.** Ders kartında rozet yok.
   Gerçekte 1 konu var ve durumu boş; o konunun tek dolu alanı cevaptı.
5. **İki yüzü olmayan Tekrar çıktıları Tekrar ekranına girmiyor** (`aysKapanis` kapanış ölçümü, `aysHedefTekrar`).
   Gerçek veride 0. Gelirlerse ya Tekrar ekranı tek yüzlü «hatırlatma» kartı göstermeli ya da Plan'a iş olarak
   girmeliler.
