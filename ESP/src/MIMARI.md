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
| 6 | Yazı | **Montaigne** | `core/intellect.js` (okunabilirlik) | `data/rhetoric.js` | Yazı Laboratuvarı |
| 7 | Tarih | **Herodot** | `core/chrono.js` | `data/history.js` | Kronoloji |
| — | **Hafıza koçu** | **Mnemosyne** | `core/curriculum.js`, `core/coach.js` | `data/curriculum.js`, `data/drills.js` | Merdiven |
| — | **Orkestrasyon** | **Patron** | `core/planner.js` | `data/rules.js`, `data/agents.js` | Ofis, Analiz |

`core/acoustic.js`'in **iki ajan tarafından paylaşılması kasıtlıdır**: ikisi de
aynı ham girdiyi (zamanlama ve tekrar) farklı eşiklerle okur. Kod tekrarı
yerine tek bir sinyal işleme katmanı.

### Modül 0 — Merdiven ve koç (`core/curriculum.js`, `core/coach.js`)

İlk sürüm bir **ölçüm** sistemiydi: ne kadar çalıştığını sayardı. Ölçüm tek
başına yol göstermez — «bugün 40 dakika gitar çalıştım» cümlesi kişiyi
ilerletmez, yalnızca kaydeder. Merdiven bu eksiği kapatır.

**Kademe.** Yedi disiplinin her birinde beş basamak (Acemi → Çırak → Kalfa →
Usta → Üstat) ve her basamakta **ölçülebilir kapılar**. Eşikler koda değil
`data/curriculum.js` içine yazılır: kullanıcı kendi tabanını değiştirebilmeli.

Üç kural merdiveni tutar:

1. **Kapı ölçülebilir olmak zorundadır.** «Fransızcayı iyi anlıyor» bir kapı
   değildir; «300+ aktif kart ve retansiyon ≥ 0,75» bir kapıdır. Ölçülemeyen
   kapı, kullanıcının kendine anlattığı bir hikâyedir.
2. **Merdiven ardışıktır.** 3. kademenin kapılarını geçmiş ama 2. kademede bir
   kapıyı atlamış biri 2. kademededir. Atlanan kapı ileride geri gelir ve
   üstüne kurulan her şeyi çökertir.
3. **Ölçülemeyen kapı geçilmiş sayılmaz — ama kalınmış da sayılmaz.** Üçüncü
   bir durum (`unknown`) vardır ve sistemin dürüstlüğü odur.

Kademenin kesinliği de yazılır: 0. basamak `veri yok`, bir üst basamakta
ölçülemeyen kapı varsa `tahmin`, aksi hâlde `hesaplandı`.

**Reçete.** `core/coach.js` üç bölümlü bir seans yazar — ısınma · asıl iş ·
zorlanma. Asıl iş, merdivende açık olan kapıya çalışır (`data/drills.js`
içindeki her egzersiz bir kapıyı hedefler). Zorlanma yalnızca **bir** üst
kademeden gelir; iki üst kademe bir egzersiz değil bir hayal kırıklığıdır.

Reçetenin toplamı profildeki günlük tabandan taşmaz ve gün içinde değişmez
(tohum günün tarihidir) — yoksa kullanıcı yenileyip hoşuna gideni seçerdi.
Bir egzersiz «işlendi» bayrağıyla değil, **gün kaydına oturum yazılarak**
kapanır: ayrı bir bayrak, yapılmamış işi yapılmış göstermenin en kolay yolu.

### Modül 0.5 — Bölümler, tezgâh, ders ve teklif

Dört katman sonradan eklendi ve dördü de **yedi bölümde birden** çalışır.

**Bölümler (`core/modules.js`).** Yedi disiplinin hepsini herkes çalışmaz.
Kapalı bir disiplin gezinmeden kalkar, reçeteye ve denge hesabına girmez,
merdiven ortalamasına katılmaz, ofiste masası kapanır. Ama **verisi
silinmez**: «kapalı» ile «yok» ayrı şeylerdir. En az bir bölüm açık kalmak
zorundadır — sistem kendi kendini kullanılamaz hâle getiremez.

Şerit numaraları çizim anında verilir (`core/nav.js`): kapalı bölüm boşluk
bırakmaz. Numara bir kimlik değil bir **sıra**dır; kimlik `id`'dir ve
yönlendirme ona bağlıdır.

**Tezgâh (`core/desk.js`).** Her bölüm sayfasının altında altı sekme:
**Reçete** · Koç · Harita · Ekler · Hatırlatma · Plan. Tek yerde tanımlı
olmasının sebebi tutarlılık: kullanıcı bir kez öğrensin, yedi kez değil.

Reçete bir zamanlar ayrı bir kutuydu (KOÇ) ve tezgâhın hemen üstünde
duruyordu. İkisi aynı cümleyi — sıradaki kapı — iki kez yazıyor, ekranı iki
katına çıkarıyordu. Reçete de koçun işi; artık tezgâhın ilk sekmesi.

Reçete satırı **minimaldir**: bir egzersiz tek satır. Görev metni kaybolmaz,
ada dokununca açılır — reçeteyi her gün okuyan biri üçüncü günden sonra görev
metnini değil adı arar.

İki değişmez:

- **Ses ikinci bir yol açmaz.** Bölüm sayfasındaki sohbet — sesli olanı
  dahil — Danışma ekranıyla aynı `ESP.Office.send()` üzerinden geçer: aynı
  brifing, aynı ev kuralları denetimi, aynı kayıt.
- **Koç ekleri görür, içeriğini görmez.** Brifinge yalnızca sayı, tür ve
  başlık gider. Ham ses dosyası zaten hiç tutulmaz: ses eki süresini taşır.

**Ders ve pratik (`core/lesson.js`).** Ünite bir ders değildir — ESP
öğretmen değil — bir **başlangıç malzemesidir**: boş ekranı kaldırır.
Üniteden gelen kart `seed` etiketi taşır. İlerleme ayrı bir «tamamlandı»
bayrağından değil SRS'ten okunur: bir kartı bilinen yapan şey bir kez doğru
bilmek değil, **aralığının uzamasıdır**.

Pratik ayrı bir hafıza kaydı açmaz; cevap tekrar ekranındakiyle aynı SRS'e
yazılır. Çeldiriciler aynı desteden gelir — uydurulmuş bir çeldirici yanlış
bir şeyi öğretebilir.

**Teklif (`core/plans.js`).** Koçun sistemi değiştirme yolu. İki seçenek
vardı ve aralarındaki fark bütün doktrin:

| | Ne olur |
|---|---|
| (a) Ajan doğrudan yazar | Yanlış bir çıkarım bir cümle olarak kalmaz; bir hatırlatıcıya, bir hedefe, bir karta dönüşür. |
| (b) Ajan **teklif eder**, kullanıcı onaylar, **kural motoru uygular** | Model hiçbir aşamada veriye dokunmaz. |

(b) seçildi. Teklif bir cümle değil **tipli bir nesnedir** ve onu kural
motoru üretir; model yalnızca cümleye çevirir. Her teklif ajanın kendi
alanındadır (`allowed()`), hiçbiri kendiliğinden uygulanmaz, hiçbiri silme
önermez ve uygulanan her teklif ne yaptığını kaydeder.

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

### Modül 3.5 — Kronoloji (`core/chrono.js`)

Tarih öğrenmenin iki yaygın biçimi de eksiktir: tarih **sıralaması**
ezberlemek (bağlamsız) ve tarih **hikâyesi** dinlemek (denetimsiz). ESP'nin
tarihi üçüncü biçimdir: bir olay bir **döneme** ve bir **neden zincirine**
bağlanır; zincirin her halkası bir **kaynağa** dayanır; kaynak eleştirilir.

Üç eksen ayrı ölçülür ve **asla tek puana toplanmaz**:

| Eksen | Ne sorar | Nerede |
|---|---|---|
| Kapsam | Hangi dönem, bölge, alan kör nokta? | `spread()`, `centuryGaps()` |
| Derinlik | Kaç olay kaynağıyla açıklanmış? | `sourceBalance()`, `unbalancedChains()` |
| Tutma | Öğrenilen duruyor mu? | `retention()` — ayrı deste |

Tek puan, hangi eksenin zayıf olduğunu gizler; gizlenen eksen çalışılmaz.

İki karar özellikle önemlidir:

- **Yalnızca tetikleyiciden kurulan zincir «dengesiz» işaretlenir.** «Savaş
  suikastla çıktı» tarihin en yaygın hatasıdır. Sistem yargılamaz, gösterir.
- **Tarih destesi dil destesinden ayrıdır.** İkisi aynı SRS motorunu kullanır
  ama ayrı ölçülür: birinin iyi olması ötekinin çöküşünü gizlememeli.
  Planlayıcı hangi destenin geciktiğini bilir ve doğru ekranı açar.

Dönem sınırları **örtüşmez** ve bu bir ayrıntı değil: 476 hem İlk Çağ'ın sonu
hem Orta Çağ'ın başı yazılsaydı `eraOf(476)` iki doğru cevabı olan bir soru
olurdu. Dönem bir ölçüm değil bir karardır — ama karar tek olmalıdır.

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

| # | Bölüm | Sayfalar | Sekmeler |
|---|---|---|---|
| 01 | **Günlük** | Bugün · Merdiven | giriş (reçete · sayaç · form), özet, geçmiş / genel, yol, seviye tespiti |
| 02 | Dil | Dil Stüdyosu | çalış, kartlar, ekle, **öğren**, dilbilgisi, ilerleme |
| 03 | Felsefe | Sempozyum | açık, kapalı, ekle, metinler, deneyler |
| 04 | Ses | Stüdyo | müzik, diksiyon, kulak, ilerleme |
| 05 | Okuma | Kütüphane | notlar, matris, kaynaklar, yöntem |
| 06 | Yazı | Yazı Laboratuvarı | taslaklar, ölçüm, araçlar |
| 07 | **Tarih** | Kronoloji | şerit, olaylar, kaynaklar, zincir, **öğren**, çalışma |
| 08 | Ofis | Masalar · Danışma · Toplantı · Analiz | — |
| 09 | Ayarlar | Profil · Rehber | — |

Numaralar **kullanıcıya göre** verilir: kapalı bir bölüm hiç çizilmez ve
kalanlar boşluk bırakmadan yeniden numaralanır. Yukarıdaki tablo «hepsi
açık» hâlidir.

Her disiplin bölümünün altında ayrıca **tezgâh** durur: Koç (yazılı + sesli
sohbet) · Harita · Ekler · Hatırlatma · Plan.

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
  tests/                501 test, 23 paket
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
node tools/runtests.js       # 501 birim testi
node tools/smoke.js          # gerçek uygulamayı gez
node tools/a11ycheck.js      # erişilebilirlik
node tools/palettecheck.js   # kontrast
```

---

## 7. Dürüstlük katmanı — sistemin kendini denetlemesi

Dışarıdan gelen üç ayrı eleştiri (Gemini, GPT-5.6, Grok) dört noktada
buluştu ve dördü de haklıydı: **ölçüm fetişizmi**, **Goodhart yasası**,
**karar bağımlılığı** ve **ölçülemeyeni ölçülüyormuş gibi göstermek**.

Bunlara karşı yazılmış bir uyarı cümlesi işe yaramaz; uyarı da bir
ekrandır. Tek dürüst cevap dördünü de ölçmek ya da açıkça yazmaktır.

### Sürtünme — `core/friction.js`

Sistemi yönetmeye giden süre, çalışmaya giden sürenin karşısına konur.
Süre duvar saatinden gelir; pratik sayacı açıkken geçen süre **çalışma**
sayılır (metronom da bir ekrandır); son bir dakikada etkileşim yoksa
sayılmaz (açık unutulmuş sekme sürtünme değildir). Bütçe (12 dk/gün) **ve**
oran (%34) birlikte aşılmadıkça sistem susar. Öneriler yalnızca yükü
**azaltır**: kendi lehine karar veren bir ölçü, ölçü değildir. Veri yoksa
`unknown` — ölçülmemiş sürtünme sıfır sürtünme değildir.

### Goodhart nöbetçisi — `core/goodhart.js`

Dokuz çift, iki bitişik 28 günlük pencerede karşılaştırılır: okuma
dakikası → çıkan not, not sayısı → not başına bağ, kart tekrarı → ilk
denemede hatırlama, gitar dakikası → temiz deneme oranı, diksiyon
dakikası → kelime başına hata, ve diğerleri.

Dört kural: nöbetçi **hüküm vermez, soru sorar**; iki tarafta da ölçüm
yoksa ayrışma yoktur; **çaba düşerken uyarı üretilmez** (işi tembelliği
değil verimsiz gayreti görmektir); küçük hacimde gürültü vardır.

### Kalibrasyon defteri — `core/calib.js`

Sistem söylemeden önce kullanıcı söyler. Tahmin **kör** açılır (gerçek
değer o an hesaplanmaz), vadesinde kapanır, beşin altında kayıtla puan
verilmez. Yanlılık yönü hatanın büyüklüğünden **ayrı** ölçülür: rastgele
sapan biriyle sistemli olarak kendini abartan biri aynı ortalama hataya
sahip olabilir ama farklı şeyler yapmaları gerekir. Yüzde sapma ile Brier
aynı ölçek değildir; ortalanmazlar.

Bu, sistem kapalıyken de geçerli olan tek ölçüdür.

### Merdivenin kör noktası — `data/curriculum.js` → `blind[]`

Her merdiven, kapılarının **göremediği** şeyleri yazar: müzikal ifade,
yazının özgünlüğü, tarihsel empati, bir metnin seni değiştirip
değiştirmediği. Liste süs değil: ölçülenin önemli, ölçülmeyenin önemsiz
sanılması ölçen her sistemin en pahalı hatasıdır. Üstat kademesi bile bu
maddeleri kapatmaz — merdiven bir yeterlilik belgesi değil, bir çalışma
düzenidir.

Testler bu listelerin varlığını ve **sayı eşiği içermemesini** denetler:
ölçülebilir bir eşik yazılabiliyorsa o zaten bir kapı olmalıydı.

### Nerede görünür

Analiz ekranında **Dürüstlük** sekmesi; merdiven ekranında **«Bu
merdivenin göremediği»** bölümü.

## 8. Ölçülmüş durum

| Ölçüm | Sonuç |
|---|---|
| Birim testi | **501/501** geçiyor |
| Duman testi | temiz — 14 ekran, **85 sekme**, kaynak + `dist/esp.html` |
| Erişilebilirlik | temiz (4 bilinen eksik izin listesinde) |
| Kontrast | **1848 ölçüm**, hepsi AA — en dar pay 4,52 (asgari 4,5) |
| Çizim maliyeti | ağır veriyle en ağır ekran **76 ms** (bütçe 100) |
| Telefon düzeni | 390 pikselde **98 yer**: taşma yok, hedefler ≥ 24 px |
| Tek dosya dağıtım | ~1,2 MB, 67 js modülü |

Duman testi üç şeyi daha denetler ve üçü de ölçülmüş birer olaydan doğdu:
**metinde sızıntı** (çizilen metinde «undefined», «NaN», «[object Object]»),
**ölü düğme** (karşılığı olmayan `data-act` — tıklanır, hiçbir şey olmaz) ve
**eksik ipucu** (karşılığı olmayan `data-hint` düğmesi hiç çizilmez).

Duman testi artık **sekmeleri de gezer**: ekranın açılması ikinci sekmesinin
çizildiğini söylemez ve çoğu ekranda içeriğin yarısı ilk sekmede değil.
Aynı geçişte her `data-hint` anahtarının karşılığı olup olmadığı da denetlenir
— karşılığı olmayan ipucu düğmesi hiç çizilmez, yani sessizce kaybolur.

---

## 9. Bilinçli olarak ertelenenler

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

## 10. Açık borçlar

| Borç | Nerede | Risk |
|---|---|---|
| İçe aktarma geri alınamıyor | `core/store.js` | **yüksek** — SPİ ile ortak; tasarımı hazır, kod yazılmadı |
| Ortak CSS kopyaları | üç uygulama | orta — doğru çözüm `LifeOs/ortak/` + derleme zamanı birleştirme |
| `C.Textarea` / `C.Select` düzeltmesi | `core/components.js` | düşük — `aria` ve `class` artık kabul ediliyor; **aynı hata SPİ'de duruyor** |
| Model yolu testi | `core/llm.js` | orta — ESP'de model çağrısı hiç denenmedi (SPİ'deki A3 borcunun aynısı) |

> Devir notu §16'daki kural: **bir hata bulduğunda kardeş uygulamada da ara.**
> `Textarea`/`Select` hatası SPİ'nin kopyasında hâlâ var.

---

## 11. Kardeş projeler

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
