# HKM — Hayat Kontrol Merkezi

> «Üçünü tek sesle özetlemek.»

LifeOS'un dördüncü katmanı. AYS, SPİ ve ESP kendi alanlarında egemen, sıfır
bağımlılıklı, tarayıcıda koşan üç ayrı sistemdir. HKM onların **üstünde
değil, yanında** duran isteğe bağlı bir servistir.

**Artık kapalı bir döngü var: veri → denetim → öneri → cevap.**
Faz 1–3 (şema, sync, VP konseyi, öncelik sırası, dijital ikiz, Yönetici,
öneri yaşam döngüsü), Faz 4–5'in metin tarafı (Büyük Patron, kanal katmanı,
WhatsApp geçidi) ve Faz 6 (üç arayüzden işaret) yazıldı. **106 HKM testi**
ve depo kökündeki `tools/entegre.js` bütünleşme denetimi geçiyor. Ses
(konuşma girişi) yazılmadı.

---

## 1. Ne olduğu ve ne OLMADIĞI

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ AYS:4173│  │ SPİ:4183│  │ ESP:4193│   ← HKM olmadan da TAM işlevli
└────┬────┘  └────┬────┘  └────┬────┘
     │  JSON push  │  JSON push  │
     └─────────────┼─────────────┘
                   ▼
        ┌──────────────────────┐
        │   HKM DAEMON  :4200  │   ← İSTEĞE BAĞLI ek katman
        │  SQLite · VP'ler ·   │      çöktüğünde üçü de çalışır,
        │  Yönetici · Gateway  │      geriye senkron olur
        └──────────────────────┘
```

**Tek yönlü bağımlılık kuralı:** AYS/SPİ/ESP, HKM'nin var olduğunu
**bilmez** — yalnızca «varsa gönder» (best-effort POST, hata sessizce
yutulur). HKM kapalıyken hiçbir modülün arayüzünde hata, bekleme ya da
bozulma olmaz.

Beacon eklenirken iki kural geçerlidir: **her çizimde çalışmaz**, ve
**kaydetmeyi bloklamaz**.

## 2. Bağımlılık istisnası

AYS/SPİ/ESP'nin «sıfır çalışma zamanı bağımlılığı» kuralı `HKM/core/` için
geçerli **değildir** — bir arka plan servisi bir veritabanı sürücüsü olmadan
var olamaz. Ama Faz 1 yine de **yalnızca standart kütüphaneyle** yazıldı:
`sqlite3`, `http.server`, `json`, `hmac`. Ne çerçeve, ne ORM, ne paket.

## 3. VP Konseyi — LLM'e HİÇ dokunmaz

```
raw_events (JSON) → VP audit (saf Python kural motoru)
                  → APPROVED / INCOMPLETE / ANOMALY
                  → Yönetici (LLM) → kullanıcı
```

| VP | Modül | Neye bakar |
|---|---|---|
| VP-Academic | AYS | soru sayısı, deneme neti, çalışma süresi |
| VP-Bio | SPİ | uyku, HRV, toparlanma bandı |
| VP-Intellect | ESP | SRS retansiyonu, pratik dakikası, sentez açığı |

Üçü de **saf kural motorudur**. Eşikleri `core/thresholds.py`'den **veri
olarak** okurlar — koddan değil, çünkü kullanıcı kendi hedef uykusunu
ayarlayabilmeli.

> `tests/test_vps.py` bunu denetler: **VP modüllerinin hiçbiri bir model
> katmanı import etmez.** Bu tek satırlık test, katmanın bütün anlamını
> korur.

## 4. Kesinlik sınırı geçince kaybolmaz

AYS/SPİ/ESP her biri kendi verisini `ölçüldü / tahmin / hesaplandı / veri
yok` etiketiyle taşır. `POST /api/sync/<modul>` gövdesindeki **her metrik
alanı** bu etiketi taşımak zorundadır; taşımayan istek **422** ile
reddedilir.

Sessiz veri kaybı yerine görünür hata: etiketsiz bir sayı, ölçülmüş bir sayı
gibi ambara girerse doktrin sınırda ölür.

## 5. Çelişki çözümü — HKM.PRECEDENCE

| Sıra | Kural |
|---|---|
| 1 | SPİ kırmızı bayrağı (kritik biyobelirteç / toparlanma eşiği) |
| 2 | Dış dünyanın sabit takvimi (sınav, teslim tarihi) |
| 3 | AYS'nin zamana bağlı akademik hedefi |
| 4 | ESP'nin tıkanmış temeli (SRS vadesi, teknik plato) |
| 5 | ESP'nin yeni içerik hedefi — **ilk feda edilen** |

Doğru cümle biçimi emir değil **öneridir**:

> «Fiziksel sermaye çöküş eşiğinde. AYS'nin bugünkü denemesinin yarına
> **ertelenmesini öneririm**; **onaylarsan** yerine hafif konu tekrarı
> koyarım.»

«Ekran kapatma zorunlu kılındı» ifadesi kod düzeyinde bile yanlıştır: HKM'nin
işletim sistemi seviyesinde böyle bir yetkisi yoktur ve olmamalıdır.

## 6. Şema — ve spec'teki üç düzeltme

`core/db.py` içindeki şema spesifikasyondan üç yerde ayrılır. Üçü de devir
notunda (`NOTLAR.md` §18.5) gerekçelendirilmişti:

1. **`date DATE UNIQUE` kalktı.** Her karar bir öneridir ve kullanıcı
   reddedebilir; günde tek satır varken `proposed → declined → yeni öneri`
   aynı güne sığmıyordu. Artık `date` üzerinde indeks var, «günün geçerli
   kararı» en son `accepted` satırdır.
2. **`decision_sources` ara tablosu eklendi.** «Yönetici karar üretmez, karar
   taşır» diyorsan taşıdığı şeyin izi durmalı; yoksa bir kararı sonradan
   gerekçelendiremezsin.
3. **`validate()` metni yeniden yazmaz.** Spec emir kipini öneri kipine
   *çevirmeyi* öngörüyordu; sessizce yeniden yazmak anlamı tersine
   çevirebilir. Bu depodaki kanıtlanmış desen **reddet-ve-düş**.

## 7. Güvenlik

- `daemon.py` varsayılan olarak **yalnız `127.0.0.1`**'e bağlanır.
- `Authorization: Bearer <local_token>` zorunlu; token `config.json`'da
  üretilir ve `config.json` **`.gitignore`'dadır** — yanında
  `config.example.json` durur.
- Token karşılaştırması `hmac.compare_digest` ile yapılır (zamanlama sızıntısı
  olmasın diye).
- Ham ses dosyası transkripsiyondan sonra silinir
  (`conversations.audio_retained = 0` varsayılan). Saklanması ayrı bir onay
  ekranı ister.
- Yöneticiye yalnız VP onaylı brifing gider.

## 8. Çalıştırma

Sunucu, systemd, tünel ve kanal kurulumu ayrı bir belgede:
[`KURULUM.md`](KURULUM.md).

```bash
cd HKM
cp config.example.json config.json    # local_token'ı uzun rastgele bir dizeyle değiştir
python3 daemon.py                     # http://127.0.0.1:4200 (yüz de burada)
python3 -m tests.run                  # 74 test: VP, sync, şema, öncelik,
                                      # ikiz, Yönetici, daemon ve yüz
node ../tools/entegre.js              # üç arayüz + HKM: uçtan uca
```

Uç noktalar:

| Yol | Ne yapar |
|---|---|
| `GET /api/health` | token istemez, yalnızca «ayakta mı» der |
| `GET /` | yerel yüz — tek dosya, sıfır bağımlılık |
| `POST /api/sync/<modul>` | etiketli metrikleri yutar — `202` ya da `422` |
| `GET /api/briefing?date=` | günün brifingi: VP raporları, dayanak ve **tek** öneri |
| `GET /api/twin?date=&days=` | dijital ikiz — son N günün tek resmi |
| `GET /api/decisions?date=` | günün bütün önerileri, reddedilenler dahil |
| `GET /api/cross?date=&days=` | çapraz bulgular — üç ambar yan yana |
| `POST /api/decision/<id>/accept` | öneriyi kabul eder |
| `POST /api/decision/<id>/decline` | öneriyi reddeder — **kayıt silinmez** |

Daemon `ThreadingHTTPServer`'dır ve SQLite bağlantısı **iş parçacığına
bağlıdır**: paylaşılan tek bağlantı ilk eş zamanlı istekte `SQLite objects
created in a thread…` ile patlıyordu.

## 8.5 Dijital ikiz ve Yönetici (Faz 3)

### `core/twin.py` — bir resim, üç modül

İkiz, `raw_events`'ten **türetilmiş** bir görüntüdür; ayrı bir tabloya
yazılmaz. Yazılsaydı iki gerçek olurdu ve hangisinin doğru olduğu
sorulurdu.

Üç kural:

1. **Eksik veri sıfır değildir** — ve iki ayrı körlük ayrı yazılır:
   bir metrik hiç gönderilmediyse «hiç görülmedi» (modülün sessizliği),
   gönderilip boş geldiyse «veri yok» (kullanıcının boş günü).
2. **Etiket resmin parçasıdır.** Kapsama tablosu «bu brifing neye
   dayanıyor» sorusunun cevabıdır; bir kalite notu değildir.
3. **Yön, yeterli nokta yoksa söylenmez.** Taban dört ölçümdür; altında
   yön «bilinmiyor»dur, ve %10'un altındaki fark «yerinde sayıyor»dur.
   İki noktadan trend çıkarmak, gürültüyü bulgu diye sunmaktır.

### `core/manager.py` — karar üretmez, karar taşır

Yönetici bir **dil modeli değildir** ve bir model katmanı **import etmez**;
`tests/test_manager.py` bunu her koşumda denetler. Bir model eklenecekse
yeri burası değil, bu brifingi yeniden ifade edecek ayrı bir katmandır — ve
o katman sayı üretemez.

Dört kural:

1. **Cümle emir değil öneridir.** Üretilen her satır buyurgan kelime
   denetçisinden geçer. Geçemeyen satır **sessizce düzeltilmez**: düşürülür
   ve düşürüldüğü brifingde yazar (`dropped[]`). Sessiz yeniden yazım
   anlamı tersine çevirebilir.
2. **Günde tek öneri.** İkinci bir öneri, birincinin önceliğini yok eder.
3. **Kaynak görünür.** Her öneri `decision_sources` üzerinden hangi VP
   denetimlerinden doğduğunu taşır.
4. **Reddedilen öneri silinmez.** Bir katmanın neyi önerdiği ve kullanıcının
   neyi reddettiği, o katmanı sonradan denetlemenin tek yoludur. Aynı cümle
   gün içinde iki kez yazılmaz; reddedilmiş bir cümle yeniden önerilebilir.

Faz 3 sırasında bulunan bir hata: brifing, önceliği hesaplarken günün
**gövdesini** `precedence.resolve`'a geçirmiyordu. «Dış dünyanın sabit
takvimi» (sıra 2) testte geçiyor ama üretimde hiç ateşlenmiyordu — testte
yaşayan, üretimde ölü bir yol. Artık gövdedeki metrikler de taşınıyor ve
`test_manager.py` bunu ayrıca denetliyor.

## 8.6 İşaret (Faz 6) — ve tarayıcının getirdiği sınır

Her arayüzde `core/beacon.js` durur. Beş kural dosyanın başında yazılı:

1. **Hiçbir çizimde çalışmaz.** Gönderim yalnızca açılışta bir kez (aralık
   dolduysa) ya da kullanıcı «Şimdi gönder» dediğinde tetiklenir.
2. **Hiçbir kaydı bloklamaz.** `ping()` söz vermez, beklemez, fırlatmaz.
3. **Etiketsiz sayı gönderilmez.** Sözleşmeyi gönderen taraf da denetler:
   HKM'nin 422 dönmesini beklemek yerine hatalı gövde hiç yola çıkmaz.
   Yerel «derived» etiketi HKM'nin «computed»ına AÇIK bir tabloyla
   eşlenir; bilinmeyen etiket sessizce «ölçüldü» sayılmaz, gövdeyi reddeder.
4. **Varsayılan kapalıdır** ve açılmadan önce gidecek gövdenin tamamı
   satır satır gösterilir.
5. **Açık metin jeton ağa çıkmaz.** Yerel olmayan bir adrese düz `http`
   ile gönderim reddedilir.

Giden şeyin genişliğini **kullanıcı seçer**:

| Kapsam | Ne gider | Kaç alan |
|---|---|---|
| **Özet** (varsayılan) | yük kararını etkileyen çekirdek ölçümler | 4–5 |
| **Gelişmiş** | bölüm bazında ilerleme de: plan, kart, hata, ölçüm, öğün, antrenman, disiplin dakikaları | ~14 |

İki seviyede de giden şey **sayıdır**. Soru metni, tahlil değeri, ilaç adı,
kart metni, not içeriği ve öğün **hiçbir seviyede** gitmez; SPİ'de semptom
yalnızca *kaç tane işaretlendiği* olarak gider, hangisi olduğu değil.

### Geçmiş gönderimi — ve geriye dönük dürüstlük

Çapraz bulgu ve yön tahlili **geçmiş** ister: bugünden biriken bir ambar ilk
iki ay hiçbir şey söyleyemez. «Geçmişi gönder» o boşluğu kapatır, iki katı
kuralla:

1. **Bugünden türetilen alan geçmiş güne yazılmaz.** Vadesi gelen kart
   sayısı, retansiyon ve kademe bugünün durumundan hesaplanır; dünün
   tarihiyle göndermek ambara **sahte bir ölçüm** yazmaktır. Bu alanlar
   geçmiş günlerde «veri yok» gider. AYS'nin deneme medyanı da o güne
   kadarki denemelerden hesaplanır — sonraki denemeler o güne sızmaz.
2. **Ölçülmemiş gün hiç gönderilmez.** Bir günün gönderilmesi için en az bir
   ÖLÇÜLMÜŞ alan gerekir; «hesaplandı» yetmez. Sınava kalan gün her tarih
   için hesaplanabilir ve yalnız onu taşıyan bir gövde, kullanıcının o gün
   bir şey yaptığı izlenimi bırakırdı.

### Tarayıcı sınırı: CORS

`tools/entegre.js` yazıldığı gün ortaya çıkan şey: üç arayüz kendi
devserver'ında (4173/4183/4193), HKM 4200'de koşuyor. Yani işaret isteği
**çift kökenli**dir ve tarayıcı önce bir ön-istek (OPTIONS) yollar. Daemon
buna cevap vermediği sürece gönderim hiç denenmiyor, dışarıdan bakınca
«HKM ulaşılamıyor» gibi görünüyordu — oysa daemon ayaktaydı. İki taraf da
kendi testinde geçerken aralarındaki bu boşluk yalnızca bütünleşme
denetiminde göründü.

Şimdi daemon ön-isteğe cevap veriyor, ama izin **yalnız yerel kökenlere**
(127.0.0.1, localhost, ::1 ve `config.json` → `allowed_origins`).
CORS bir kimlik doğrulama değildir: jeton yine şarttır.

## 8.7 Yerel yüz — `web/index.html`

Brifing yalnızca JSON olarak durduğu sürece HKM'nin vaadi kâğıt üzerindeydi:
«üçünü tek sesle özetlemek» için o sesin okunabildiği bir yer gerekir.
`GET /` tek bir HTML dosyası servis eder — çerçeve yok, paket yok, derleme
yok; üç arayüzün tasarım diline de benzemez, çünkü HKM bir arayüz değil bir
ÖZETTİR.

Üç kural sayfanın kendisinde de geçerlidir:

1. **Sayfa hiçbir sayı hesaplamaz ve hiçbir cümle kurmaz.** Ekrandaki her
   satır daemon'dan geldiği gibi yazılır. Burada bir hesap yapmak, iki
   gerçek yaratırdı — hangisinin doğru olduğu sorulurdu.
2. **Sayfa jeton taşımaz.** İçinde veri olmadığı için jetonsuz servis
   edilir; bütün veri `/api/*` üzerinden gelir ve orası bearer ister.
   Jetonu kullanıcı girer, kendi tarayıcısında saklanır.
3. **Öneri CEVAPLANABİLİR.** Cevaplanamayan bir öneri, öneri değil
   bildirimdir: kabul ve ret düğmeleri `decisions` kaydına yazar, reddedilen
   öneri silinmez.

`tools/entegre.js` bu sayfayı da gezer: gerçek tarayıcıda açar, jetonu
girer, brifingin ve ikizin çizildiğini doğrular, sentetik bir kırmızı
bayrakla öneriyi tetikler ve düğmeye basıp kararın ambara yazıldığını
kontrol eder. Yüklenmeyen bir sayfa çürür.

## 8.8 Çapraz bulgu — `core/cross.py`

§10'daki dürüst soru şuydu: «üçünü tek sesle özetlemek» için bir daemon,
bir SQLite ve bir VP konseyi gerekiyor mu? Cevabın tek bir yeri var:
**hiçbirinin tek başına göremeyeceği şey.** AYS uykuyu ölçmez, SPİ soru
sayısını bilmez, ESP ikisini de görmez. Bir gecenin ertesi güne ne yaptığı
yalnızca üç ambar yan yana konduğunda görünür.

Beş çift tanımlı: uyku→ertesi gün soru, uyku→ertesi gün pratik,
toparlanma→aynı gün çalışma, çalışma↔pratik (aynı saatlerden beslenirler),
uyku→ertesi gün retansiyon.

Dört kural dosyanın tamamını yönetir:

1. **Neden-sonuç kurulmaz.** Üretilen her cümle bir EŞLEŞMEDİR: «şu
   günlerde şu böyle ölçüldü». Aynı haftada başka her şey de değişti ve bu
   dosya bunu bilmez. «Çünkü» kelimesi buradan çıkmaz — bir test bunu
   kelime kelime arar.
2. **Eşiğin altında hüküm yok.** Taban sekiz eşleşmiş gün ve her yarıda üç
   gündür; altında «veri yok» denir — «ilişki yok» DEĞİL.
3. **Bölünme medyandan.** Kullanıcının kendi medyanı eşik olur; dışarıdan
   getirilmiş bir «7 saat uyku» eşiği bu kişi için doğru olmayabilir.
   İki değerli bir dağılımda medyan üst değere eşit düşerse bölünme
   yanlıştır, veri değil: eşitler üst yarıya alınıp bir kez daha denenir.
4. **Küçük fark bulgu değildir.** İki yarının ortancası arasındaki fark
   %15'in altındaysa «görünür bir ayrışma yok» denir.

Çapraz bulgu bir öneri DEĞİLDİR ve önceliği değiştirmez: brifinge en fazla
iki satır olarak düşer, yanında sorduğu soruyla. Öneri hâlâ yalnızca
`HKM.PRECEDENCE`'ten çıkar.

## 8.9 Büyük Patron ve kanallar (Faz 4–5)

### Hiyerarşi — ve her katmanın NE YAPMADIĞI

| Katman | İşi | Yapmadığı |
|---|---|---|
| VP'ler (`vp_*.py`) | ölçümü denetler | cümle kurmaz, öncelik bilmez |
| Yönetici (`manager.py`) | brifingi derler | karar üretmez, karar taşır |
| **Büyük Patron** (`patron.py`) | kanaldan konuşur | sayı üretmez, hüküm kurmaz |

Patron bir dil modeli **değildir** ve bir model ya da ağ katmanı **import
etmez** — bir test bunu her koşumda denetler. Metin, kural motorunun kendi
cümlelerinden dizilir.

Dört kural:

1. **Günde tek mesaj.** Kanal bir bildirim akışı değildir; aynı gün aynı
   kanala ikinci kez gönderilmez (`force` ile bilinçli olarak aşılır).
2. **Emir kipi yok.** Çıkan her metin buyurgan kip denetçisinden geçer;
   geçemeyen metin sessizce düzeltilmez, düşürülür.
3. **Tanımayan kişiye veri gitmez.** Gönderen izin listesinde değilse cevap
   verilmez ve **içeriği ambara yazılmaz** — yalnız reddedildiği not edilir.
4. **Komut seti küçük ve kapalıdır:** `durum`, `kabul`, `ret`, `neden`,
   `capraz`, `yardim`. Serbest metin yorumlanmaz. Anlaşılmayan mesaja
   «anlamadım, şunları yapabilirim» denir — anlamadığını anlamış gibi
   yapmak, bu depodaki en pahalı hatadır.

### `core/channels.py` — bir kolaylık değil, bir risk yüzeyi

Yerel bir daemon'a WhatsApp eklemek, o daemon'un kapısını internete açmak
demektir. Bu yüzden kurallar gevşek değil katı:

1. **Varsayılan kapalı.** Hiçbir kanal kendiliğinden açılmaz; `enabled`
   tek başına da yetmez — kimlik bilgileri eksikse kanal açık sayılmaz.
2. **İzin listesi boşsa kimse yok.** Boş liste «herkes» demek DEĞİLDİR.
3. **İmza doğrulanmadan içerik okunmaz.** Gelen webhook gövdesi uygulama
   sırrıyla HMAC-SHA256 imzalanmış olmalı (`X-Hub-Signature-256`);
   karşılaştırma `hmac.compare_digest` ile yapılır. İmzasız gövde
   ayrıştırılmaz bile. Tek baytı değişen gövdenin imzası düşer.
4. **Hiçbir çağrı fırlatmaz, hiçbiri bekletmez.** Ağ hatası bir DURUMDUR.
5. **Sır loglanmaz.** Jeton, uygulama sırrı ve doğrulama jetonu hiçbir
   çıktıda, hata metninde ya da kayıt satırında görünmez.

Taşıma için yalnız standart kütüphane (urllib) kullanılır ve testler gerçek
ağa çıkmaz: `transport` bağımlılığı dışarıdan verilebilir.

### Uç noktalar ve kimlik

`/api/wa/webhook` HKM'nin **tek** bearer'sız POST yoludur; isteği Meta
yollar, bearer taşıyamaz. Kapısı imzadır. `GET` tarafı yalnız doğru
`verify_token` ile gelen meydan okumayı yansıtır.

WhatsApp'ın çalışması için HKM'nin dışarıdan erişilebilir olması gerekir
(tünel ya da sunucu). Bu bir yazılım kararı değil bir **altyapı kararıdır**
ve kullanıcınındır: kanal kapalıyken HKM ve üç sistem olduğu gibi çalışır.

## 9. Fazlar

| Faz | İçerik | Durum |
|---|---|---|
| 1 | Çekirdek daemon, SQLite şeması, bearer'lı sync | **yazıldı** |
| 2 | Başkan Yardımcıları (VP) + öncelik sırası | **yazıldı** |
| 3 | Dijital İkiz, Yönetici, öneri yaşam döngüsü | **yazıldı, 70 test** |
| 4 | Kanal katmanı + Telegram adaptörü | **yazıldı** (kapalı gelir) |
| 5 | WhatsApp geçidi (Cloud API, imzalı webhook) | **yazıldı** · ses yapılacak |
| 6 | Üç arayüzden best-effort işaret | **yazıldı** |

## 10. Ve dürüst bir soru

Devir notu §18.8'deki soru duruyor ve cevaplanmadı:

> HKM'nin gerçek faydası tek cümle: «üçünü tek sesle özetlemek.» O fayda
> için bir daemon, SQLite, iki bot ve bir VP konseyi gerekiyor mu — yoksa
> SPİ'nin ofisine üç satırlık bir çapraz bulgu mu yeter?

Soru hâlâ açık ama artık **ölçülebilir**. `core/cross.py` tam da o «üç
satırlık çapraz bulgu»yu üretiyor: uykunun ertesi güne, toparlanmanın aynı
güne, çalışmanın pratiğe ne yaptığı. Eğer dokuz ayın sonunda bu beş çiftten
hiçbiri hiç görünür bir ayrışma göstermediyse, cevap «gerekmiyor»dur ve
HKM'yi kapatmak bir kayıp değil bir kazançtır.

Yani bu klasör kendi gerekliliğini de ölçüyor. Kapatma kararı kullanıcının,
ama karar artık bir izlenime değil `GET /api/cross` çıktısına dayanacak.
