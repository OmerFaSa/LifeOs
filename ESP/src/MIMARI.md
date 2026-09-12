# ESP — Entelektüel Seviye Planlayıcı

> «Ölçülmeyen gelişmez; ama her şey ölçülebilir gibi de gösterilmez.»

LifeOS ekosisteminin üçüncü sacayağı. AYS sınav performansını, SPİ bedensel
performansı yönetirken; ESP **dil, felsefe, müzik, diksiyon, derin okuma ve
yazı** alanlarındaki pratiği kural motoruyla takip eder. Çevrimdışı çalışır,
veri cihazda kalır, dil modeli olmadan da tam işlevlidir.

Bu belge mimari spesifikasyonun kod karşılığını anlatır: hangi kararın nerede
yaşadığını ve neden orada olduğunu.

---

## 1. Temel doktrin

Üç kural sistemin her yerinde geçerlidir ve tartışmaya açık değildir. AYS ve
SPİ'den değişmeden gelirler; tek fark, «hesap» yerine burada çoğu zaman
**pratik verisi** (süre, tekrar, doğruluk) geçmesidir.

### 1.1 Kural motoru otoritedir

```
Intellect / SRS / Acoustic / Planner  →  brief(agentId)  →  model  →  ekranda cümle
     (skor, eşik, sıradaki adım)          (rapor, JSON)     (yorum, soru)
```

Skoru `core/intellect.js`, `core/srs.js` ve `core/acoustic.js` üretir. Ajan bu
sayıyı **yorumlar, yeniden hesaplamaz**. «Sıradaki iş» `core/planner.js`'ten
gelir; Patron'un toplantı kapanışında yaptığı şey kararı *gerekçelendirmektir*,
değiştirmek değil.

**Model kapalıysa ofis kapanmaz.** Brifing doğrudan cümleye çevrilir
(`ESP.Office.ruleText`) ve ajanlar «kural motoru» rozetiyle konuşur. Bu bir
yedek plan değil **varsayılan** plandır; model bir iyileştirmedir.

Çıktı denetimi `ESP.Office.validate(text, { agentId, brief })` ile yapılır ve
**metni yeniden yazmaz, işaretler**:

```js
{ text,              // METİN DEĞİŞTİRİLMEZ
  ok,                // hiçbir uyarı yoksa true
  violations,        // yasak kalıp
  scopeBreaches,     // ajan alan dışına çıktı
  unsupported }      // brifingde geçmeyen sayı
```

Sessizce düzeltmek anlamı tersine çevirebilir: «kesinlikle başaramazsın»
cümlesindeki «kesinlikle»yi silmek cümleyi düzeltmez, gizler. Çağıran ya
uyarıyı gösterir ya kural motorunun cümlesine düşer.

### 1.2 Uydurulmuş sayı, ölçülmüş sayı gibi gösterilmez

Her sayının nereden geldiği ekranda yazar (`ESP.CERTAINTY`). Dört etiketli
sözlük AYS ve SPİ ile **birebir aynıdır** ve öyle kalmalıdır: HKM senkronu her
metrik alanının kesinlik etiketini taşımasını şart koşar, sözlük tutmazsa
senkron hiç çalışmaz.

| Etiket | Ne demek | ESP örneği |
|---|---|---|
| **ölçüldü** | Zamanlayıcı, kelime sayacı ya da SRS motorunun kaydettiği ham veri | Shadowing dakikası, metronom BPM |
| **tahmin** | Kullanıcının kendi bildirdiği öznel değerlendirme | Kayıtta işaretlenen hata sayısı |
| **hesaplandı** | İki ölçülmüş değerden formülle türetildi | EHS, SSK, retansiyon R(t) |
| **veri yok** | Hiç girilmemiş. **Sıfır sayılmaz.** | Bir hafta hiç gitar çalışılmamışsa |

Son satır burada AYS/SPİ'den **daha kritiktir**: entelektüel gelişim doğası
gereği yavaş ve düzensiz ilerler. Bir haftalık boşluğu «0 performans» diye
grafiğe sokmak yanlış alarm üretir ve motivasyonu kırar.

Kodda bu ayrım fonksiyon adlarında görünür: `dayHasEntry()` (hiç girildi mi)
ile `minutesOf()` (kaç dakika) **ayrı sorulardır** ve ikincisi girilmemiş gün
için `0` değil `null` döner.

### 1.3 Pedagojik sınır

SPİ'nin «klinik sınır»ının ESP karşılığı. ESP bir öğretmen, dilbilimci ya da
müzik jürisi değildir. CEFR, seviye ve skor etiketleri **öz-değerlendirme
araçlarıdır**; resmî sertifika, akademik not ya da profesyonel yeterlilik
beyanı üretmez (`ESP.PEDAGOGIC.never`):

| Denetim | Ne arar |
|---|---|
| Sahte sertifikasyon | «Artık C1 seviyesindesin, sertifikaya hazırsın» |
| Mutlak yetenek yargısı | «Bu alanda yeteneklisin / yeteneksizsin» |
| Sonuç garantisi | «Bu tempoyla kesin üç ayda konsere çıkarsın» |
| Estetik otorite iddiası | «Bu deneme yayımlanmaya hazır, kusursuz» |

Doğru cümle biçimi: *«CEFR B2'sin»* değil → *«son 30 günlük üretimin B2
bandının kriterlerini karşılıyor — bu bir öz-değerlendirmedir, resmî sınav
yerine geçmez.»*

Seviye etiketi kişiye değil **üretime** verilir ve daima tarih aralığıyla
birlikte durur.

> **Tuzak — yaşandı.** Bu dört desenin üçü ilk yazılışta **sessizce
> çalışmıyordu**: JavaScript'te `\b` yalnızca `[A-Za-z0-9_]` üzerinden çalışır
> ve `ç` kelime karakteri sayılmaz, bu yüzden `/\bçıkarsın\b/` hiçbir Türkçe
> cümlede eşleşmez. Denetim kuruluydu, hiçbir şey yakalamıyordu.
> Çözüm `ESP.trRe()` ve `ESP.TR_B` / `ESP.TR_E` (`data/rules.js`).
> Aynı tuzak `\w+` için de geçerlidir: «söylediği» kelimesini `\w+` yalnızca
> «s» olarak okur.

---

## 2. Modüller ve kod karşılıkları

| # | Disiplin | Ajan | Kural motoru | Referans verisi | Ekran |
|---|---|---|---|---|---|
| 1 | Yabancı Dil | **Polyglot Mentor** | `core/srs.js` | `data/lexicon.js` | Dil Stüdyosu |
| 2 | Felsefe | **Socrates** | `core/intellect.js` (argüman) | `data/canon.js` | Sempozyum |
| 3 | Müzik / Gitar | **Maestro** | `core/acoustic.js` (metronom) | `data/guitar_tabs.js` | Stüdyo |
| 4 | Diksiyon | **Demosthenes** | `core/acoustic.js` (artikülasyon) | `data/phonetics.js` | Stüdyo |
| 5 | Derin Okuma | **Aristoteles** | `core/intellect.js` (sentopik) | `data/canon.js` | Kütüphane |
| 6 | Yazı | **Montaigne** | `core/intellect.js` (okunabilirlik) | — | Yazı Laboratuvarı |
| 7 | **Orkestrasyon** | **Patron** | `core/planner.js` | `data/rules.js`, `data/agents.js` | Ofis, Analiz |

`core/acoustic.js`'in **iki ajan tarafından paylaşılması kasıtlıdır**: ikisi de
aynı ham girdiyi (zamanlama ve tekrar) farklı eşiklerle okur. Kod tekrarı
yerine tek bir sinyal işleme katmanı.

### Modül 1 — Aralıklı tekrar (`core/srs.js`)

Leitner kutuları, SM-2 ile yumuşatılmış. İki yapı birlikte çalışır:

- **Kutu (1–5)** kaba sınıftır: «bu kartı ne kadar tanıyorum».
- **Ease (1,3–2,8)** ince ayardır: aynı kutudaki iki kart aynı hızda uzamaz.

Neden ikisi birden? Saf Leitner çok kaba (kolay ve zor kart aynı aralığı alır);
saf SM-2 çok kırılgan (tek yanlış cevap aralığı sıfırlar ve kullanıcı aynı
kartla günlerce boğuşur).

**Yanlış cevap kutuyu başa döndürür ama ease'i sıfırlamaz.** Sıfırlansaydı bir
kez unutulan kart, hiç öğrenilmemiş kartla aynı muameleyi görürdü — oysa
geçmişi var.

Retansiyon `R(t) = e^(−t/S)`. S kartın kararlılığıdır ve her doğru cevapta
büyür. **Hiç cevaplanmamış kart ortalamaya girmez**; kapsam ekranda yazılır:
«12 karttan 9'undan hesaplandı».

### Modül 2 — Entelektüel hacim ve sentez (`core/intellect.js`)

```
EHS = Σ (D_i × H_i × K_i)
```

- `D_i` disiplin ağırlığı (`data/rules.js`). Ağırlıklar birbirine **yakın**
  tutulur: büyük fark, düşük katsayılı disiplini görünmez yapar ve kullanıcı
  onu bırakır — oysa denge sistemin amacı.
- `H_i` **ölçülen** pratik saati. «Veri yok» günler toplama girmez ve paydada
  da yoktur: EHS bir ortalama değil bir **hacim** ölçüsüdür.
- `K_i` kalite katsayısı. Disiplinin kendi **ölçülmüş** sinyalinden gelir
  (retansiyon, bağlanmış not oranı, hedef tempoya ulaşma, revizyon oranı);
  ölçülemiyorsa 1,0 kalır **ve bunu söyler**. Kullanıcının «bugün iyiydi»
  değerlendirmesi buraya girmez: tahmin, ölçülmüş bir hacmi büyütemez.
  Aralık [0,85 – 1,15] ile sınırlıdır.

EHS tek başına okunmaz: yanında daima kaç günden hesaplandığı yazar.

```
SSK = (Bağlantılı_Notlar / Toplam_Kitap) × log(1 + Yazar_Sayısı)
```

**Düzeltme aynen uygulandı.** Orijinal `log(Yazar_Sayısı)` formülü tek yazarda
`log(1) = 0` ile tüm sentezi sıfırlıyordu: bir kitabı derinlemesine analiz eden
kullanıcı cezalandırılıyordu. `log(1 + n)` bu tekilliği giderir ve `n = 0`
durumunda da tanımlı kalır. Payda **toplam kitaptır**, toplam not değil:
ölçüyü büyüten şey nota bölünmüş bir kitap değil, kitaplar **arası** bağlardır.

**Okunabilirlik için Ateşman formülü** kullanılır:

```
OS = 198,825 − 40,175 × (hece/kelime) − 2,610 × (kelime/cümle)
```

İngilizce için geliştirilmiş Flesch Türkçede yanlış sonuç verir: Türkçe sondan
eklemeli bir dildir, kelime başına hece sayısı doğal olarak yüksektir ve Flesch
her Türkçe metni «çok zor» gösterir. Türkçede **hece sayısı = ünlü harf
sayısıdır**; kural istisnasızdır, bu yüzden hece sayacı bir tahmin değil bir
ölçümdür.

Okunabilirlik bir **kalite yargısı değildir**: uzun cümle kötü değildir,
farkında olmadan uzayan cümle sorundur.

### Modül 3 — Akustik (`core/acoustic.js`)

Tek dogma: **hız bir sonuçtur, hedef değil.**

Temiz eşik yalnızca «temiz» işaretlenen tekrarlardan açılır: aynı tempoda
**üç** temiz tekrar, son **14 gün** içinde. Üç ay önce yapılmış bir tekrar
bugünün eşiğini açmaz.

**Eşik kendiliğinden artar, kendiliğinden düşmez.** Bir kötü hafta kazanılmış
eşiği geri almaz — yoksa hastalıklı bir hafta ayların kazanımını siler ve
kullanıcı sisteme güvenmeyi bırakır.

Plato: bir teknikte 14+ gündür eşiğin artmaması. **Hiç çalışılmamış parça plato
sayılmaz** — plato çalışan bir şeyin durmasıdır.

Diksiyon tarafında WPM için **hem süre hem kelime sayısı ölçülmüş olmalıdır**;
biri eksikse hesap yapılmaz — «tahmini WPM» diye bir şey yoktur. Hata oranı
daima «tahmin» etiketi taşır: sistem sesi dinlemedi.

### Modül 4 — Orkestrasyon (`core/planner.js`)

**Sıradaki iş** tek bir öncelik gösterir. Sıra `ESP.PRECEDENCE` ile aynıdır ve
tartışılmaz. Sınırlı olan kaynak **zamandır**, doğruluk değil — bu yüzden sıra
«hangisi daha doğru» değil «hangisi beklerse ötekileri çökertir» sorusuna göre
dizilir:

| Sıra | Kural | Neden |
|---|---|---|
| 1 | Tıkanmış temel | Yeni içerik, eskiyi çökertmeden eklenmez |
| 2 | Zamana bağlı hedef | Dış dünyanın takvimi iç plandan önce gelir |
| 3 | Vadesi geçmiş SRS kartları | Unutma eğrisi beklemez |
| 4 | Sentopik sentez | Derinlik, hacimden sonra gelir |
| 5 | Yeni içerik / repertuar | En son — ama «yok sayılır» demek değil |

> **Tuzak — testin bulduğu.** Retansiyon tabanı (%50) ilk yazılışta tek bir
> ölçümle tetikleniyordu: bir gecikmiş kart ortalamayı %7'ye düşürüyor ve
> sistem «temel tıkandı» diyordu — oysa söylenebilecek tek şey «bir kart
> gecikti»dir. SPİ'nin «eğilim için en az üç ölçüm» kuralının karşılığı
> kondu: `RETENTION_MIN_CARDS = 5`.

**Çapraz bulgular** iki *ayrı* masanın verisi birlikte anlam kazandığında
çıkar: dil↔okuma, okuma↔yazı, müzik↔diksiyon, felsefe↔yazı, SRS↔seri.
**Korelasyon nedensellik gibi yazılmaz** — bulgu daima «birlikte hareket
ediyor» diliyle kurulur.

---

## 3. Bölümler

Sekiz bölüm, on iki sayfa. Bölüm alana göre değil kullanıcının o gün yaptığı
**işe** göre ayrılır ve sırası kasıtlıdır: önce günün kaydı, sonra altı
disiplinin kendi tezgâhı, sonra danışma, en sonda ayar.

| # | Bölüm | Sayfalar |
|---|---|---|
| 01 | **Günlük** | Bugün |
| 02 | Dil | Dil Stüdyosu |
| 03 | Felsefe | Sempozyum |
| 04 | Ses | Stüdyo |
| 05 | Okuma | Kütüphane |
| 06 | Yazı | Yazı Laboratuvarı |
| 07 | Ofis | Masalar · Danışma · Toplantı · Analiz |
| 08 | Ayarlar | Profil · Rehber |

**Spesifikasyondan bilinçli sapma:** spec «Analiz»i ayrı bir gezinme grubu
sayıyor; burada Ofis'in dördüncü sayfası. Sebep: analiz bir alan değil bir
**iş** — kararı tartışmak. SPİ'de de öyle. Dokuz numaralı bir şerit telefonda
okunmaz hâle geliyordu.

**Spesifikasyonda eksik olan:** §7'deki dosya ağacı `lang.js`'i listelemiyor
ama §4'teki gezinme tablosu «Dil → Dil Stüdyosu» diyor. Ekran eklendi; SRS'in
yaşadığı yer orası.

Her ekran aynı sözleşmeyi uygular:

```js
{ id, title, headline?(), lede?(), stats?(), actions(), render(),
  handle:{}, change:{}, leave?() }
```

Ekranlar birbirini tanımaz; hepsi kabuğun (`app.js`) içinde yaşar ve yalnızca
`ESP.S`'yi okur. Bir ekranın çizilirken hata vermesi diğerlerini kapatmaz.

`leave()` isteğe bağlı bir temizlik kancasıdır ve yalnızca Stüdyo kullanır:
görünmeyen bir ekranın metronomu, kullanıcının kapatamayacağı bir sestir.

---

## 4. Sıfır sürtünme

| Zorluk | Geleneksel (hatalı) | ESP çözümü |
|---|---|---|
| Kelime takibi | Her kelimeyi elle deftere yazmak | Listeyi yapıştır — `Parse.parseVocab`, üç ayraç tanınır |
| Argüman kaydı | Uzun deneme formatına zorlamak | Tek cümlelik tez — `Parse.parseArgument` |
| Pratik kaydı | Süreyi kronometreyle not etmek | Palete «45 dk gitar» yaz, Enter |
| Sentopik not | Her kitap için ayrı doküman | Tek satırlık atomik kart, bağ önerisi otomatik |

**Emin olunamayan satır atılmaz ve uydurulmaz**; «eşleşmedi» olarak
işaretlenir, kullanıcı elle bağlar. Sessizce atılan bir satır, kullanıcının
girdiğini sandığı ama sistemde olmayan bir veri demektir.

Türkçe ayrıştırmanın üç kuralı (AYS/SPİ ile birebir aynı):

1. **İnsanlar fiil söyler, isim değil.** «Shadowing oturumu» değil «shadowing
   yaptım». Her disiplin takma ad listesi taşır.
2. **Takma ad dizini uzundan kısaya sıralanır.** Yoksa «okuma» kelimesi «derin
   okuma»dan önce eşleşir ve yanlış disipline yazılır.
3. **Sayı içindeki virgül cümle ayracı değildir.** «7,5 saat» tek parçadır.

---

## 5. Güvenlik ve mahremiyet

- **Saklama.** Ses ölçümleri, taslaklar ve notlar cihazda tutulur. Hesaba bağlı
  kopya açıldığında yalnızca kullanıcının kendi özel alanına yazılır.
- **Ses dosyası hiç oluşmaz.** Diksiyonda saklanan şey süre, kelime sayısı ve
  kullanıcının kendi işaretlediği hata sayısıdır. Bu bir eksiklik değil bir
  karardır: **olmayan dosya sızamaz.**
- **Modele giden.** Ajana yalnızca **özet brifing** gider: ölçülmüş metrikler
  ve durum etiketleri. Ad, atomik notun cümlesi, taslak metni ve tezin metni
  girmez — **dört ayrı test** bunu denetler.
  Tek istisna kullanıcının açıkça paylaştığı parçadır: Sempozyum'da «Socrates'e
  sor» dendiğinde tezin metni **sorunun içinde** gider, brifingin içinde değil.
- **Eğitim.** Hiçbir veri ticari model eğitimine gönderilmez.
- **API anahtarı.** Yalnızca tarayıcıda, uygulama verisinden ayrı bir
  anahtarda durur. Yedeğe girmez, buluta gitmez, modele gönderilmez.
- **Profil izolasyonu.** Her profil kendi depo anahtarında yaşar
  (`esp.v1.<profil>`). Profil geçişi sayfayı yeniden yükler.

---

## 6. Kod düzeni

```
src/
  index.html            yükleme sırası: veri → çekirdek → ekranlar
  MIMARI.md             bu belge
  OFIS.md               yedi ajanın çalışma düzeni
  STIL.md               ESP'ye özel tasarım notları
  css/
    tokens.css palettes.css base.css layout.css components.css designs.css
                        AYS/SPİ ile ortak — elle düzenlenmez
    fonts.css           gömülü woff2 (base64), ağ isteği yok
    esp.css             ESP'ye özel: sekiz bölüm kimliği, ajan renkleri,
                        SRS kartı, metronom, radar, sentopik matris
  js/
    data/               referans tabloları — mantık yok, yalnızca veri
      rules.js          ev kuralları: pedagojik sınır, öncelik, disiplinler,
                        Türkçe kelime sınırı (ESP.trRe)
      agents.js         yedi ajan, gündem türleri (TEK yerde)
      canon.js          34 eser, 20 kavram, 11 gelenek, Sokratik kalıplar
      lexicon.js        8 dil, CEFR bantlarının ölçülebilir karşılığı
      guitar_tabs.js    12 gam/mod, 6 ilerleyiş, 10 teknik, 6 ölçü
      phonetics.js      6 ses grubu, 10 tekerleme, nefes ve vurgu çalışmaları
      hints.js          ⓘ açıklamaları
      palettes.js designs.js providers.js build.js
    core/
      utils.js h.js     tarih/sayı yardımcıları · şablon katmanı
      store.js          kalıcı depolama (bulut → yerel düşüş)
      state.js          ESP.S durumu ve ESP.Model veri modeli
      srs.js            Modül 1 kural motoru
      intellect.js      Modül 2 kural motoru
      acoustic.js       Modül 3 kural motoru (iki ajan paylaşır)
      planner.js        orkestratör: sıradaki iş, denge, çapraz bulgu
      parse.js          serbest metin ayrıştırıcıları
      office.js         yedi ajanlı ofis, brifingler, validate()
      components.js     bileşen sözlüğü (uygulamadan bağımsız)
      parts.js          ESP'ye özel parçalar: kesinlik rozeti, radar
      ui.js memo.js llm.js quota.js palette.js setup.js
      voice.js speak.js talk.js
    screens/            12 ekran
    app.js              kabuk: gezinme, olay dağıtımı, açılış
  tests/                151 test, 7 paket
tools/
  runtests.js           birim testleri (başsız tarayıcı)
  smoke.js              duman testi: 12 ekranı hem kaynakta hem dist'te gezer
  a11ycheck.js          erişilebilirlik, ÇİZİLEN sayfadan
  palettecheck.js       7 palet × 2 tema × 8 bölüm × 5 düzen kontrast
build.py                tek dosyalık dağıtım → dist/esp.html
devserver.py            geliştirme sunucusu (önbelleksiz) → :4193
```

### Bağımlılık

**Hiçbir çalışma zamanı bağımlılığı yoktur.** Ne çerçeve, ne derleyici, ne
paket. Playwright yalnızca test betikleri için gerekir.

```bash
python devserver.py          # http://localhost:4193
python build.py              # dist/esp.html üretir
node tools/runtests.js       # 151 birim testi
node tools/smoke.js          # gerçek uygulamayı gez
node tools/a11ycheck.js      # erişilebilirlik
node tools/palettecheck.js   # kontrast
```

---

## 7. Ölçülmüş durum

| Ölçüm | Sonuç |
|---|---|
| Birim testi | **151/151** geçiyor |
| Duman testi | temiz — 12 ekran, kaynak + `dist/esp.html` |
| Erişilebilirlik | temiz (4 bilinen eksik izin listesinde) |
| Kontrast | **1848 ölçüm**, hepsi AA — en dar pay 4,52 (asgari 4,5) |
| Tek dosya dağıtım | 872 KB, 45 js modülü |

---

## 8. Bilinçli olarak ertelenenler

- **Otomatik transkripsiyon.** Konuşma-metin modeli gerektirir; MVP'de süre ve
  öz-değerlendirme elle işaretlenir.
- **Canlı CEFR / müzik teorisi sınavı entegrasyonu.** Sistem çevrimdışıdır ve
  resmî sınav kurumlarına bağlanmaz (§1.3).
- **Giyilebilir cihaz.** Pratik süresi elle ya da dahili zamanlayıcıyla girilir;
  hesap zaten eksik girdiye dayanıklıdır.
- **Öneri kutusu (`proposals.js`).** SPİ'deki kapalı eylem kataloğu ESP'ye
  taşınmadı: şu an modelin uygulayabileceği bir eylem yok, hepsi kullanıcının
  kendi girdisi. Model bir eylem önerecek hâle geldiğinde katman gerekir.

---

## 9. Açık borçlar

| Borç | Nerede | Risk |
|---|---|---|
| İçe aktarma geri alınamıyor | `core/store.js` | **yüksek** — SPİ ile ortak; tasarımı hazır, kod yazılmadı |
| Ortak CSS kopyaları | üç uygulama | orta — doğru çözüm `LifeOs/ortak/` + derleme zamanı birleştirme |
| `C.Textarea` / `C.Select` düzeltmesi | `core/components.js` | düşük — `aria` ve `class` artık kabul ediliyor; **aynı hata SPİ'de duruyor** |
| Model yolu testi | `core/llm.js` | orta — ESP'de model çağrısı hiç denenmedi (SPİ'deki A3 borcunun aynısı) |

> Devir notu §16'daki kural: **bir hata bulduğunda kardeş uygulamada da ara.**
> `Textarea`/`Select` hatası SPİ'nin kopyasında hâlâ var.

---

## 10. Kardeş projeler

| | AYS | SPİ | ESP |
|---|---|---|---|
| Ad alanı | `R.*` | `SP.*` | `ESP.*` |
| Depo anahtarı | `rota84285.v2` | `spi.v1.<profil>` | `esp.v1.<profil>` |
| Test paketi | `AYS/src/tests/` | `SPI/src/tests/` | `ESP/src/tests/` |
| Dev sunucu portu | 4173 | 4183 | **4193** |
| Dağıtım | `dist/rota.html` | `dist/spi.html` | `dist/esp.html` |

Üçü ortak bir tasarım dili paylaşır (aynı token'lar, aynı kart/düğme/tablo
dili, aynı «kural motoru otoritedir» doktrini) ama **kodları ayrıdır**. Biri
diğerini import etmez; birinde yapılan bir değişiklik diğerini bozamaz.
