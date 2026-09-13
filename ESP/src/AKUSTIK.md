# Akustik ölçüm sözleşmesi

Bu belge, ESP'de ses ölçümünün **bugün ne olduğunu** ve **mikrofonla ölçüm
eklenirse neye uyacağını** yazar. İkinci kısım şu an uygulanmış bir kod
değil, bağlayıcı bir sözleşmedir: o özellik eklenirse bu kurallarla
eklenecek, eklenmezse bu dosya niçin eklenmediğini açıklar.

## 1. Bugün ne var: sistem sesi DİNLEMİYOR

`core/acoustic.js` mikrofon açmaz, ses analizi yapmaz, kayıt tutmaz.
Ölçtüğü şey kullanıcının **kendi işaretlediği** tekrarlar ve zamanlayıcının
verdiği süredir. Bu bir eksiklik değil bir karardır: olmayan ses dosyası
sızamaz.

Tarayıcının ses arayüzleri projede iki yerde geçer ve ikisi de **ölçüm
değildir**:

| Yer | Ne yapar | Ölçüm mü? |
|---|---|---|
| `screens/studio.js` | `AudioContext` ile metronom tıkı **üretir** | Hayır — çıkıştır, girdi değil |
| `core/voice.js`, AYS `core/listen.js` | Konuşma tanımayla metin **dikte eder** | Hayır — bir metin giriş yöntemidir, skor üretmez |

Dolayısıyla bugün **cihaz kaynaklı bir ölçüm eşitsizliği yoktur**: iyi
mikrofonu olan kullanıcı merdivende daha hızlı ilerlemez, çünkü mikrofon
hiçbir kapıyı ölçmüyor.

## 2. Gerçek boşluk aynıdır, sebebi farklıdır: BEYAN

Mikrofon yok ama **kendi kendini değerlendirme** var. Şu iki sorunun
cevabını sistem bilmiyor, kullanıcı söylüyor:

- «Bu tekrar temiz miydi?» (`music.cleanBpm`)
- «Bu hece hatalı mıydı?» (`diction.errorRate`)

Bu bir ölçümdür ve değerlidir — ama sayaçtan okunan bir dakikayla aynı şey
değildir. Kendi kendini değerlendiren bir ölçü gevşemeye açıktır ve bu
gevşeme tam da kademe yükselirken işe yarar hâle gelir.

**Uygulanan kural** (`core/curriculum.js`):

1. **Asgari sinyal.** Beyana dayalı bir kapı, arkasında en az 5 kayıt
   yoksa hiç değerlendirilmez — `unknown` döner. Üç kayıttan çıkan bir
   hata oranı bir ölçü değil bir izlenimdir.
2. **Üstüne ödül yok.** Eşiğin üstünde daha çok kayıt daha hızlı ilerleme
   getirmez; yalnızca ölçümün gürültüsünü düşürür.
3. **Geçer ama zayıf.** Beyanla geçilen kapı geçilmiş sayılır, `weak`
   işaretlenir, ve o kademenin kesinliği `derived` olamaz — `estimated`
   kalır. Kademe durur, yanında nasıl ölçüldüğü yazar.

Bu, "uydurulmuş sayı ölçülmüş sayı gibi gösterilmez" ilkesinin doğal
uzantısıdır — sebebi sinyal/gürültü oranı değil, yargının kaynağıdır.

## 3. Mikrofonla ölçüm eklenirse: bağlayıcı sözleşme

Aşağıdakiler bir istek listesi değil, **ön koşuldur**. Biri eksikse
mikrofonla ölçüm eklenmez.

### 3.1 Her ölçüm kendi güven bilgisini taşır

| Alan | Nereden | Neden |
|---|---|---|
| `noiseFloor` | Ölçümden önce 1–2 sn sessizlik penceresinde RMS | Gürültü tabanı bilinmeden SNR hesaplanamaz |
| `snr` | Konuşma bandında (≈250–4000 Hz) sinyal/gürültü | Tek başına en sağlam güvenilirlik göstergesi |
| `algoConfidence` | Konuşma tanımanın kendi `confidence`'ı; perde için ana tepe ile ikinci tepe arasındaki fark | Algoritmanın kendi belirsizliği |
| `consistency` | Aynı tamponun farklı pencere boyu/ofsetle ikinci analizi | Kararsız ölçümü yakalar |
| `device` | `AudioContext.sampleRate`, `getSettings()` → `autoGainControl`, `noiseSuppression`, `echoCancellation` | AGC ve gürültü bastırma açıkken diksiyon ölçümü bozulur; sistem bunu bilmeli |

**Tek başına yetersiz olanlar — ve sebepleri:**

- *Çift analiz tutarlılığı yalnız başına.* Algoritma sistematik bir
  önyargı taşıyorsa (oktav hatası gibi) iki koşum da aynı yanlışı verir.
  Mutlaka SNR ile birlikte okunur.
- *Bilinen referans sesle kalibrasyon.* Tarayıcının AGC'si, hoparlör–
  mikrofon mesafesi, oda akustiği ve cihaz frekans cevabı bilinmeyen
  değişkenler üretir. Harici kalibre kaynak olmadan "mutlak" referans elde
  edilemez; göreli tutarlılık bile şüphelidir. **Kendini kandırma sayılır.**
- *Yalnız gecikme damgası.* Tempo ölçümünde asıl sorun gecikme değil
  frekans cevabı ve SNR'dir.

### 3.2 Güvenilmez çıkan ölçümün davranışı

Üç seçenek vardı; seçilen ortadaki:

| Seçenek | Neden seçilmedi / seçildi |
|---|---|
| Hiç gösterme | Kullanıcıyı kör bırakır; kendi verisini görmesini engeller |
| **Geniş aralık + düşük kesinlik etiketiyle göster** | **Seçilen.** Sayı görünür, belirsizliği de görünür |
| "Bu cihazda ölçülemez" deyip kapat | Aşırı sert; bazı kullanıcıları tamamen dışlar |

Eşiğin altındaki ölçüm `measured` olamaz: en fazla `estimated` alır ve
**kapı ilerlemesine katkıda bulunmaz**. Pratik kaydı olarak durur,
istatistiklere girer, "üretim kanıtı" sayılmaz. Bu kural bugün beyana
dayalı ölçümler için zaten işliyor; mikrofon geldiğinde aynı yol kullanılır.

### 3.3 Ölçüm eşitsizliği

İyi mikrofonun daha hızlı merdiven getirmesi, SPİ'de HRV cihazı olmayanı
dolaylı cezalandırmanın aynısıdır. Dört kural:

1. **Merdivenin omurgası cihazdan bağımsız kalır.** Kapıların çoğu
   üretime dayanır: kayıt sayısı, zamanlayıcıyla ölçülmüş süre, tamamlanan
   egzersiz, yazılı çıktı. Akustik ölçüm bir **doğrulama katmanıdır**,
   zorunlu kapı değil.
2. **Göreli metrik, mutlak metriğe tercih edilir.** "Kendi önceki
   kayıtlarına göre tutarlılık" cihaz kalitesinden çok daha az etkilenir;
   mutlak eşikler (belirli BPM aralığında kalmak) isteğe bağlı doğrulama
   olur.
3. **Asgari sinyal eşiği; üstüne ödül yok.** Eşiği geçen herkes aynı
   muameleyi görür. Daha yüksek SNR ekstra puan ya da daha hızlı ilerleme
   getirmez. "Daha iyi cihaz = daha hızlı üstat" döngüsü böyle kırılır.
4. **Cihaz kalitesi ayrı bir katman olarak yüzeye çıkar.** Kullanıcıya
   "bu cihazda ölçüm güveni düşük, kademe için cihazdan bağımsız kanıt
   gerekir" denir — sessizce geri bırakılmaz.

## 4. Bu belgenin durumu

- **1. ve 2. bölüm:** uygulanmış, testleri var
  (`tests/curriculum.test.js` → «merdiven · beyana dayali kapi»).
- **3. bölüm:** açık borç. Mikrofonla ölçüm eklenmeden önce bu sözleşme
  koda dönüşür; dönüşmezse özellik eklenmez.

Bu ayrım bilerek yazılıdır: yapılmamış bir işi yapılmış gibi göstermek,
tam da bu deponun engellemeye çalıştığı şeydir.
