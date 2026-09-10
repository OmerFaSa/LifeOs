# SPİ — Sağlık Performans İzleyicisi

> «Sağlıklı güçlü beden, sarsılmaz ve güçlü irade»

Kişisel ve aile odaklı bütüncül sağlık yönetim sistemi. Beş ajanlı bir ofis,
dört dikey uzman modül ve bir orkestratör. Çevrimdışı çalışır, veri cihazda
kalır, dil modeli olmadan da tam işlevlidir.

Bu belge mimari spesifikasyonun kod karşılığını anlatır: hangi kararın nerede
yaşadığını ve neden orada olduğunu.

---

## 1. Temel doktrin

Üç kural sistemin her yerinde geçerlidir ve tartışmaya açık değildir.

### Kural motoru otoritedir

```
Bio / Nutri / Move / Money  →  brief(agentId)  →  model  →  ekranda cümle
   (hesap, eşik, karar)         (rapor, JSON)    (yorum)
```

Sayıyı kural motoru üretir. Ajan hesap yapmaz, brifingdeki sayıyı olduğu gibi
kullanır. Karar `SP.Calc.nextAction()` içinden gelir; Patron ajan kararı
*gerekçelendirir*, değiştiremez.

**Model kapalıysa ofis kapanmaz.** Brifing doğrudan cümleye çevrilir
(`SP.Office.ruleText`) ve ajanlar «kural motoru» rozetiyle konuşur. Modelin
görevi anlatım katmanıdır, hesap katmanı değil.

### Uydurulmuş sayı, ölçülmüş sayı gibi gösterilmez

Her sayının nereden geldiği ekranda yazar (`SP.CERTAINTY`):

| Etiket | Ne demek |
|---|---|
| **ölçüldü** | Laboratuvar sonucu, cihaz ölçümü ya da tartılmış gramaj |
| **tahmin** | Porsiyon tahmini ya da seed fiyat — düzeltilebilir |
| **hesaplandı** | Girilen iki ölçümden formülle üretildi |
| **veri yok** | Hiç ölçülmemiş. **Sıfır sayılmaz.** |

Son satır en önemlisidir. Girilmemiş bir gün ortalamaya katılmaz; bilinmeyen
bir mikro besin sıfır sayılmaz. Eksik veri sıfır gibi gösterilirse eksiklik
olduğundan büyük görünür ve sistem yanlış alarm üretir.

### Klinik sınır

Sistem bir hekim değildir. Teşhis koymaz, doz önermez, tedaviyi bırakmayı
önermez, sonuç garantisi vermez (`SP.CLINICAL.never`). Kırmızı bayrak
eşiğinin ötesinde yorum üretmeyi tamamen bırakır ve hekime yönlendirir.

---

## 2. Modüller ve kod karşılıkları

Spesifikasyondaki beş modül, dört kural motoru dosyası ve bir orkestratör
olarak yaşar.

| Modül | Ajan | Kural motoru | Referans verisi | Ekranlar |
|---|---|---|---|---|
| 1 · Biyometrik ve laboratuvar | **Kerem** | `core/bio.js` | `data/biomarkers.js` | Tahliller, Günlük ölçüm |
| 2 · Beslenme ve biyoyararlanım | **Nesrin** | `core/nutri.js` | `data/foods.js`, `data/nutrients.js` | Öğünler, Mutfak |
| 3 · Hareketlilik ve toparlanma | **Barış** | `core/move.js` | `data/movement.js` | Hareket |
| 4 · Sağlık ekonomisi | **Sedef** | `core/money.js` | `data/prices.js` | Sepet |
| 5 · Baş danışman | **Patron** | `core/calc.js` | `data/rules.js`, `data/agents.js` | Ofis, Danışma, Toplantı, Analiz |

### Modül 1 — Biyometrik veri ve laboratuvar

Elli iki biyobelirteç, on iki panelde. Her belirteç üç ayrı bandı ayırır:

- **`ref`** — laboratuvarın «normal» dediği geniş aralık. Sağlıklı bir
  topluluğun %95'ini kapsar; «en iyi» değil «yaygın» demektir.
- **`optimal`** — hedef bant. Referansın içinde ama daha dar. Dışında olmak
  bir uyarı değil, iyileştirme alanıdır.
- **`red`** — kırmızı bayrak. Ötesinde sistem yorum yapmayı bırakır.

Bu üçlü ayrım spesifikasyondaki *«tekil referans aralıkları yerine bireysel
trend»* ilkesinin ilk yarısıdır. İkinci yarısı `SP.Bio.trendOf()`: en küçük
karelerle eğim hesaplanır ve 90 güne ölçeklenir.

**En az üç ölçüm şartı vardır.** İki nokta her zaman bir doğru çizer; bu
«eğilim» değil yalnızca iki ölçüm arasındaki farktır.

Eğilimin iyi mi kötü mü olduğu yönden değil, belirtecin hangi yönde iyi
olduğundan (`dir`) ve değerin nerede durduğundan gelir. LDL'nin düşmesi
iyidir; HDL'nin düşmesi kötüdür.

**Akıllı tahlil ayrıştırma** (`core/parse.js`): laboratuvar raporunun metni
yapıştırılır, değerler ayıklanır. Ayrıştırıcı emin olamadığı satırı sessizce
atmaz — «eşleşmedi» olarak gösterir. Bilinen birim dönüşümleri uygulanır
(nmol/L → ng/mL), bilinmeyen birim dönüştürülmez ve bildirilir.

### Modül 2 — Beslenme ve biyoyararlanım

Ayırt edici iddia: **ne kadar aldığın kadar ne kadarını emebildiğin de
sayılır.** Aynı 5 mg demir, yanında limon varken ve yanında çay varken aynı
şey değildir.

Emilim öğün düzeyinde hesaplanır, gün düzeyinde değil — çünkü çay demirin
emilimini yalnızca *aynı* öğünde bozar (`SP.Nutri.absorbMeal`):

| Etki | Çarpan | Koşul |
|---|---|---|
| C vitamini | ×3 | Öğünde ≥ 25 mg |
| Çay/kahve tanenleri | ×0,5 | Öğünde tanen bayrağı |
| Kalsiyum | ×0,7 | Öğünde ≥ 300 mg |
| Fitat | ×0,85 | Tam tahıl / bakliyat |

Sonuç %1–20 aralığına sıkıştırılır ve her etki ekranda gerekçesiyle yazılır.

**Laboratuvara bağlı besin reçetesi** Modül 1 ile Modül 2 arasındaki tek
yönlü bağdır (`SP.Nutri.LAB_LINKS`). Ferritin referans altındaysa demir
hedefi ×1,6 olur; D vitamini düşükse hedef ikiye katlanır ve yağlı öğünle
eşleştirme gerekir. Yirmi iki kural deklaratif bir tabloda durur ve her biri
**gerekçesini** taşır — çarpanın nedeni kullanıcıdan saklanmaz.

Aynı öğe için birden fazla kural tetiklenirse **en güçlüsü geçerlidir**;
çarpanlar çarpılmaz, aksi hâlde üst üste binerek uygulanamaz hedef üretirdi.

**Hane mutfak uyarlaması** (`SP.Nutri.householdSplit`): tek tencere yemek
pişer, her bireyin hedefine göre porsiyon çarpanı hesaplanır. Öğünün günlük
hedefin yüzde kaçını taşıdığı (%35, ana öğün varsayımı) gizli bir sabit
değildir, ekranda yazar. Porsiyon protein hedefinin altında kalıyorsa yan
gıda önerilir.

### Modül 3 — Hareketlilik, yük yönetimi ve toparlanma

Tek dogma: **günün yükünü istek değil toparlanma belirler.**

Toparlanma skoru dört girdiden gelir ve **eksik girdi sıfır sayılmaz** —
ağırlığı kalan girdilere dağıtılır. Akıllı saati olmayan biri de uyku ve
nabızla anlamlı bir skor alır; cihaz sahibi olmayan cezalandırılmaz.

| Girdi | Ağırlık | Nasıl okunur |
|---|---|---|
| Uyku | %35 | Hedef banda uzaklık |
| HRV | %30 | **Kendi** 30 günlük ortalamana göre |
| İstirahat nabzı | %20 | **Kendi** ortalamandan sapma |
| Ağrı ve enerji | %15 | Kendi bildirdiğin his |

HRV ve nabız mutlak değil kişisel ölçektir. Başkasının HRV'siyle
karşılaştırma yapılmaz.

**Aşırı antrenman koruması** iki katmanlıdır: akut/kronik yük oranı (son 7
günün ortalaması ÷ son 28 günün ortalaması) ve haftalık %10 büyüme sınırı.
Beş haftada bir yük %40 indirilir.

Sistem yükü **kendiliğinden azaltabilir ama asla kendiliğinden artıramaz.**
Toparlanma bandı taban emri verir; akut/kronik oran ve indirme haftası bunu
yalnızca daha temkinli yapabilir.

**Kademeli ilerleme**: her hareketin kendi merdiveni vardır. Üst basamak,
mevcut basamakta son 14 günde 3 seans yapıldığında açılır. Sistem basamak
atlatmaz — aşırı yüklenmenin en yaygın sebebi budur.

### Modül 4 — Sağlık ekonomisi

Bu modülün etik kuralı görünürdür: **uygulama market taramaz.**

Seed fiyatlar yalnızca sepetin boş kalmaması içindir ve her ekranda «tahmin»
rozetiyle durur. Hesabın yüzde kaçının tahmine dayandığı yazılır. Kullanıcının
fişinden girdiği fiyat tahmini ezer ve «ölçüldü» olur. Tahminin üzerinden
geçen ay sayısı gösterilir; eskidikçe güven düşer.

**Eşdeğer besin ikamesi** neyi koruduğunu ve neyi kaybettiğini birlikte söyler.
Sardalya somonun omega-3'ünü korur ama D vitamini içeriği üçte biridir. Karar
bu ikisi görülerek verilir; «ucuz olan iyidir» diye bir kural yoktur.

**`costPerNutrient()`** bütçe ile sağlık hedefini aynı tabloda buluşturur:
«bu öğeyi en ucuz hangi gıdadan alırım». Bu, bütçenin öncelik sırasında en
sonda olmasının ne demek olduğunu tanımlar — hedefi indirmek değil, hedefi
bozmadan en ucuz yolu bulmak.

**Toplu alım** yalnızca bozulmadan saklanan ve hane genelinde tüketilen
kalemleri kapsar. Taze üründe toplu alım tasarruf değil israf üretir.

### Modül 5 — Baş danışman ve orkestratör

`core/calc.js` dört uzmanı bir araya getirir.

**Sıradaki hamle** tek bir öncelik gösterir. Sıra `SP.PRECEDENCE` ile aynıdır
ve tartışılmaz:

| Sıra | Kural | Neden |
|---|---|---|
| 1 | Kırmızı bayrak | Hekime yönlendirme her şeyin önünde. Bayrak açıkken plan tartışılmaz. |
| 2 | Güvenlik | Sakatlık riski, aşırı antrenman, elektrolit sapması |
| 3 | Laboratuvar bulgusu | Ölçülmüş bir eksiklik, tahmin edilmiş bir tercihi yener |
| 4 | Beslenme hedefi | Protein ve mikro besin tabanı korunur |
| 5 | Antrenman hedefi | İlerleme, toparlanmanın ve beslenmenin önüne geçmez |
| 6 | Bütçe | En son gelir — ama «yok sayılır» demek değil |

**Çapraz çıkarım** (`crossFindings`) altı bağ arar: uyku↔HRV, yük↔toparlanma,
protein↔toparlanma, sodyum↔tansiyon, kalori↔kilo, uyku↔iştah.

**Korelasyon nedensellik değildir ve öyle sunulmaz.** Bulgu daima «birlikte
hareket ediyor» diliyle yazılır. En az 10 ortak gün şartı vardır ve
katsayının mutlak değeri 0,3'ün altındaysa bulgu üretilmez.

**Haftalık konsolide rapor** çelişkiyi tek cümlede taşır ve iyi haberi kötü
haberin arkasına saklamaz:

> «Bütçe %12 aşıldı fakat toparlanma ortalaması 78 ve protein hedefin %104'ü.»

---

## 3. Bölümler

Yedi bölüm, on üç sayfa. Bölüm alana göre değil, kullanıcının hayatındaki
**işe** göre ayrılır ve sırası kasıtlıdır: önce ölçülen, sonra ölçüme göre
karar verilen, sonra bunların bedeli, sonra günün kaydı, sonra danışma, en
sonda ayar.

| # | Bölüm | Sayfalar | Ne yapar |
|---|---|---|---|
| 01 | Testler | Testler | Kapsamlı bir hastane testi tek seferde girilir; sonuçlar tek düz listede durur |
| 02 | Besin | Öğünler · Mutfak | Bazal metabolizma, hedef ve tahlile bağlı öğün önerisi |
| 03 | Hareket | Hareket | Kardiyo, kuvvet, esneklik ve dinlenme ayrı alanlar |
| 04 | Finans | Finans | Diğer koçların talebinden çıkan bütçe |
| 05 | Günlük | Bugün · Ölçüm | Günün asgari kaydı |
| 06 | Ofis | Masalar · Danışma · Toplantı · Analiz | Patron ve dört koç |
| 07 | Ayarlar | Hane · Rehber | Profil, görünüm, veri, sınırlar |

Yönlendirme kimlikleri (`labs`, `meals`, `move`, `basket`, …) değişmedi;
değişen yalnızca kullanıcıya görünen gruplama. Böylece komut paleti, testler
ve derin bağlantılar bozulmadan kaldı.

### Testler organ bazlı değildir

Önceki düzen ölçümleri on iki panele bölüyor, her paneli açılır bir kutuda
tutuyordu. Kullanıcı elinde **tek bir rapor**la gelir; o rapor organa göre
değil, tek seferde çıkar. Şimdi:

- **Test gir** — bütün ölçümler tek formda, arama kutusuyla daraltılır.
  Boş bırakılan satır yok sayılır, sıfır olarak kaydedilmez.
- **Sonuçlar** — ölçülen her şey tek düz listede, önem sırasına göre
  (kırmızı bayrak → referans dışı → hedef dışı → hedefte).
- **Panel** artık bir yapı değil bir **süzgeçtir**: listeyi daraltır, bölmez.

### Hareket alanlara ayrılır

Kullanıcı gününü planlarken "hangi kalıbı çalışayım" diye değil, "kardiyo mu
kuvvet mi, yoksa dinleneyim mi" diye düşünür. Sekmeler o soruyu karşılar:
**Bugün · Kardiyo · Kuvvet · Esneklik · Dinlenme · İlerleme**. Hareket kalıbı
(itme/çekme/çömelme/kalça/gövde/taşıma) kuvvetin içinde ikinci bir şerittir.

Dinlenmenin kendi sayfası olması kasıtlıdır: antrenman programlarında
dinlenme çoğu zaman "yapılmayan şey" olarak geçer ve görünmez olur — burada
görünür, çünkü yük yönetiminin yarısı odur.

### Koçlar birbiriyle konuşur

Zincir kural motorlarında zaten vardı; bölümler onu **görünür** kılar:

| Zincir | Nerede görünür |
|---|---|
| Kerem → Nesrin | Besin → Öneri: hangi ölçüm hangi besin hedefini ne kadar yükseltti |
| Nesrin/Kerem/Barış → Sedef | Finans → Bütçe: üç koçun talebi tek tabloda |
| Barış → Nesrin | Toparlanma düşükken esneklik ağır antrenmanın yerine geçer |

Bütçede fiyatı bilinmeyen kalem **sıfır sayılmaz**: «veri yok» olarak durur
ve toplamın dışında kalır. Bilinmeyeni sıfır sayan bir bütçe gerçeğinden hep
küçük çıkar.

### Fiyat neden internetten gelmiyor?

Uygulama çevrimdışı çalışır ve sağlık verisi cihazdan çıkmaz. Market taramak
için dışarı çıkan her istek bu iki kuralı da bozar. Bunun yerine: başlangıçta
açıkça «tahmin» etiketli bir tohum liste kullanılır, kullanıcının fişinden
girdiği fiyat tohumun üstüne yazılır ve «ölçüldü» olur. Hesabın yüzde kaçının
hâlâ tahmine dayandığı her ekranda yazar.

Her ekran aynı sözleşmeyi uygular:

```js
{ id, title, subtitle(), actions(), render(), handle:{}, change:{} }
```

Ekranlar birbirini tanımaz; hepsi kabuğun (`app.js`) içinde yaşar ve yalnızca
`SP.S`'yi okur. Bir ekranın çizilirken hata vermesi diğerlerini kapatmaz:
hata paneline düşer, kenar çubuğu açılmaya devam eder.

---

## 4. Sıfır sürtünme

Spesifikasyondaki zorluk tablosunun kod karşılığı:

| Zorluk | Geleneksel (hatalı) | SPİ çözümü |
|---|---|---|
| Öğün takibi | Her lokmayı tartıp gramaj girmek | «1 tabak etli kuru fasulye» yaz — `SP.Parse.parseMeal` |
| Tahlil girişi | Onlarca parametreyi elle forma yazmak | Raporu yapıştır — `SP.Parse.parseLab` |
| Ortak yemek | Herkese ayrı diyet yemeği pişirmek | Tek tencereyi hedeflere göre paylaştır — `householdSplit` |
| Bütçe | Fişleri tek tek girmek | Haftalık sepetin maliyetini modelle — `basketTotal` |

Her ikisi de aynı ilkeye uyar: emin olamadığı satırı **atmaz ve uydurmaz.**
Eşleşmeyen parça geri döner, kullanıcı elle bağlar.

Ev ölçüleri tanınır: tabak, kase, dilim, bardak, avuç, kaşık, adet, porsiyon.
Gramaj ev ölçüsünden geldiyse «tahmin», tartıldıysa «ölçüldü» olur.

---

## 5. Güvenlik ve mahremiyet

- **Saklama.** Tahlil sonuçları ve kimlik bilgileri cihazda tutulur. Hesaba
  bağlı kopya açıldığında yalnızca kullanıcının kendi özel alanına yazılır.
- **Modele giden.** Ajana yalnızca **özet brifing** gider: sayılar ve durum
  etiketleri. Ad, doğum tarihi ve ham tahlil belgesi gönderilmez. Bu bir test
  tarafından denetlenir.
- **Eğitim.** Hiçbir veri ticari model eğitimine gönderilmez.
- **API anahtarı.** Yalnızca tarayıcıda, uygulama verisinden ayrı bir
  anahtarda durur. Yedeğe girmez, buluta gitmez, modele gönderilmez.
- **Hane izolasyonu.** Her profil kendi depo anahtarında yaşar
  (`spi.v1.<profil>`). Profil geçişi sayfayı yeniden yükler: yarım kalmış bir
  yazma işleminin yanlış profile düşmesi böylece imkânsızdır.

**Halüsinasyon engeli** iki katmanlıdır. Önce sistem istemi modele sayı
üretmeyi yasaklar; sonra çıktı ev kurallarına karşı denetlenir
(`SP.Office.validate`). Doz, teşhis, garanti ve tedaviyi bırakma ifadeleri
yakalanırsa çıktı **basılmaz**; yerine kural motorunun cümlesi geçer ve neden
engellendiği yazılır.

---

## 6. Kod düzeni

```
src/
  index.html            yükleme sırası: veri → çekirdek → ekranlar
  MIMARI.md             bu belge
  OFIS.md               beş ajanın çalışma düzeni
  STIL.md               tasarım sistemi
  css/
    tokens.css          tek token kaynağı (açık/koyu iki eksen)
    palettes.css        altı renk paleti
    base.css            temel öğeler
    layout.css          kabuk ve ızgara
    components.css      bileşenler + SPİ'ye özel yapılar
  js/
    data/               referans tabloları — mantık yok, yalnızca veri
      biomarkers.js     52 biyobelirteç, 12 panel, 3 türetilmiş ölçüm
      nutrients.js      15 besin öğesi, RDA, emilim etkileri
      foods.js          61 gıda, ev ölçüleri, mikro besin profilleri
      prices.js         seed fiyat endeksi, 10 ikame, toplu alım
      movement.js       11 hareket merdiveni, toparlanma ve yük kuralları
      rules.js          ev kuralları: klinik sınır, kırmızı bayrak, öncelik
      agents.js         beş ajan, gündem türleri
      hints.js          ⓘ açıklamaları
    core/
      utils.js h.js     tarih/sayı yardımcıları · şablon katmanı
      store.js          kalıcı depolama (bulut → yerel düşüş)
      state.js          SP.S durumu ve SP.Model veri modeli
      bio.js            Modül 1 kural motoru
      nutri.js          Modül 2 kural motoru
      move.js           Modül 3 kural motoru
      money.js          Modül 4 kural motoru
      calc.js           orkestratör: sıradaki hamle, çapraz çıkarım
      parse.js          serbest metin ayrıştırıcıları
      ui.js             ikon, grafik, referans çubuğu, katman
      components.js     bileşen sözlüğü (uygulamadan bağımsız)
      parts.js          SPİ'ye özel, veriye bağlı parçalar
      office.js         beş ajanlı ofis
      llm.js quota.js   model çağrısı ve kota yönetimi
      palette.js        komut paleti
      setup.js          ilk kurulum
    screens/            13 ekran
    app.js              kabuk: gezinme, görünüm paneli, olay dağıtımı, açılış
  tests/                394 test, 10 paket
tools/
  runtests.js           birim testleri (başsız tarayıcı)
  smoke.js              duman testi: gerçek uygulamayı gezer
build.py                tek dosyalık dağıtım üretir → dist/spi.html
devserver.py            geliştirme sunucusu (önbelleksiz)
```

### Bağımlılık

Uygulamanın **hiçbir çalışma zamanı bağımlılığı yoktur.** Ne çerçeve, ne
derleyici, ne paket. Playwright yalnızca test betikleri için gerekir.

```bash
python devserver.py          # http://localhost:4183
python build.py              # dist/spi.html üretir
node tools/runtests.js       # 394 birim testi
node tools/smoke.js          # gerçek uygulamayı gez
```

---

## 7. Yol haritası durumu

Spesifikasyondaki MVP aşamalarının karşılığı:

| Aşama | Durum |
|---|---|
| 1 · Çekirdek veri tabanı — birey ve aile profilleri, tahlil tablosu | **Tamam.** `state.js` + hane profilleri, profil başına izole depo |
| 2 · Tahlil ayrıştırma + öğün girişi | **Tamam.** Metin yapıştırma ve serbest metin öğün; foto/ses kanalı açık değil |
| 3 · Finans katmanı ve toparlanma | **Tamam** (fiyat kullanıcı girişiyle; canlı market taraması yok) |
| 4 · Patron ajan ve haftalık konsolide rapor | **Tamam.** Ofis, toplantı, çapraz çıkarım ve sohbet |

**Henüz olmayan ve bilinçli olarak ertelenen:**

- **Fotoğraf ve ses girişi.** Görüntüden yemek tanıma ve sesli mesaj, bir
  görüntü modeli gerektirir. Metin ayrıştırıcı aynı işi bağımlılıksız yapar;
  görüntü katmanı bunun üzerine eklenir.
- **Canlı market fiyatı.** Uygulama çevrimdışıdır ve hiçbir siteyi taramaz.
  Fiyat kullanıcının fişinden gelir. Bu bir eksiklik değil, «uydurulmuş sayı
  gösterilmez» kuralının fiyat tarafındaki sonucudur.
- **Giyilebilir cihaz API'si.** HRV, nabız ve uyku elle girilir. Skor
  hesabı zaten eksik girdiye dayanıklıdır; cihaz bağlandığında yalnızca
  giriş kanalı değişir, hesap değişmez.
- **Telegram botu.** Kanal katmanıdır; kural motoru ve ofis hazır olduğu için
  eklendiğinde yeni bir hesap yazılması gerekmez.

---

## 8. Kardeş proje

Bu depoda iki bağımsız sistem yaşar:

| Klasör | Sistem | Alan |
|---|---|---|
| `AYS/` | Akademik Yol Sistemi | Sınav hazırlığı ve çalışma düzeni |
| `SPI/` | Sağlık Performans İzleyicisi | Sağlık, beslenme, hareket ve sağlık ekonomisi |

İkisi ortak bir tasarım dili paylaşır (aynı jetonlar, aynı kart/düğme/tablo
dili, aynı beş ajanlı ofis doktrini) ama **kodları ayrıdır**: farklı ad alanı
(`SP` ve `R`), farklı depo anahtarı, farklı test paketi. Biri diğerini import
etmez; birinde yapılan bir değişiklik diğerini bozamaz.
