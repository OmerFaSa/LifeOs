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
python3 -m tests.run                  # VP, sync, şema, öncelik, ikiz,
                                      # Yönetici, daemon, yüz, Hayat Mottosu
                                      # (sayı README'de; sayilar.py yazar)
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
| `GET /api/impact` | öneri sonrası ölçüler ne yaptı (etki) |
| `GET /api/config` | ayarlar — **sırlar maskeli** |
| `POST /api/probe` | sağlayıcı anahtarını **sınar** (mesaj üretmez) |
| `POST /api/telegram/yoklama` | webhook'u siler, bir yoklama turu dener |
| `GET /api/budget` | aylık harcama, tahmin ve sınır durumu |
| `POST /api/config` | ayar yaması (doğrulanır; jetona dokunmaz) |
| `GET /api/backup` | bütün ambar tek JSON |
| `POST /api/prune` | eski ham ölçümler silinir; kararlar kalır |
| `GET /api/streak?date=&days=` | üst üste süren eşik kırıkları |
| `GET /api/weekly?date=` | haftalık rapor |
| `POST /api/restore` | yedeği geri yükler (üstüne yazmak açık karar) |
| `GET /api/outbox` | giden kutusu durumu |
| `GET /api/intents/<modul>` | modülün açık teklifleri |
| `POST /api/intents/<modul>` | **yeni teklif oluşturur** (tür + gövde) |
| `POST /api/intents/<modul>/take` | kuyruğu alır — **açık** teklifler; ilki `delivered` işaretlenir |
| `POST /api/intent/<id>/applied\|acknowledged\|dismissed\|unknown` | modülün/kullanıcının cevabı |
| `GET /api/cross?date=&days=` | çapraz bulgular — üç ambar yan yana |
| `GET /api/series?date=&days=&module=` | metrik metrik zaman serisi |
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

Yüz üç sekmedir ve üçü üç ayrı soruya bakar:

| Sekme | Soru |
|---|---|
| **Genel** | Bugün ne oldu, bir öneri var mı, çapraz bir bulgu görünüyor mu? |
| **Sistemler** | Üç sistemden hangi gün hangi sayı geldi? (seri + kıvılcım çizgisi) |
| **HKM** | Ambar ne durumda, hangi öneriler yazıldı, Patron'la ne konuşuldu? |

Sistemler sekmesi ambardaki **ham** seriyi gösterir: hiçbir şey hesaplanmaz,
çizgi gelen noktaların kendisidir. Gelmeyen gün çizgide de yoktur — sıfır
olarak çizmek, olmayan bir ölçümü varmış gibi göstermek olurdu. Her satırda
ölçüm sayısı, kesinlik karışımı (ölçüldü/hesaplandı ayrı ayrı yazılır), en
az/ortanca/en çok ve yön durur. Çizgi için en az iki nokta gerekir; tek
noktadan çizgi çizmek, olmayan bir eğilim uydurmaktır.

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

## 8.10 Etki — `core/impact.py`

Bir katman kendi faydasını ölçmüyorsa, «gerekli mi» sorusunu ancak
**izlenimle** cevaplayabilir — ve izlenim, ölçmeyen her sistemin kendini
haklı çıkarma biçimidir. Bu dosya zinciri kapatır:

```text
öneri → kullanıcının cevabı → SONRAKİ GÜNLERDE ÖLÇÜ NE OLDU
```

Beş kural, ve üçü «söylememe» kuralıdır:

1. **Neden-sonuç yok.** «Öneri işe yaradı» cümlesi buradan çıkmaz; çıkan
   cümle «kabul ettiğin önerilerin ardından şu ölçü şöyle hareket etti»dir.
   Aradaki fark bu dosyanın tamamıdır.
2. **Seçilim yanlılığı yazılır ve kaldırılamaz.** Kabul ettiğin günler zaten
   farklı günlerdi: bir öneriyi kabul edebilecek durumda olmak, ölçünün
   zaten iyi gidiyor olmasıyla aynı şeyden besleniyor olabilir.
3. **Eşiğin altında hüküm yok.** Üç cevaptan az, ya da önce/sonra
   pencerelerinde üçer ölçüm yoksa «veri yok» denir — «etkisiz» değil.
4. **Ret de bir veridir** ve kabulle karıştırılmaz; ikisini yan yana koymak
   HKM'nin elindeki en yakın karşılaştırmadır ve **bu bile bir deney
   değildir**.
5. **Yön tanımsızsa ölçülmez.** Sentez açığının düşmesi iyidir, soru
   sayısının düşmesi değil; yönü yazılı olmayan bir ölçüde etki hesaplanmaz.

Büyük Patron'a bir komut eklendi: **`etki`**. Cevap, ölçülmemiş bir faydayı
«fayda yok» diye sunmaz — «henüz ölçülmedi» der.

### Şema taşıma

`decisions` tablosuna iki sütun eklendi (`key`, `answered_at`).
`CREATE TABLE IF NOT EXISTS` var olan bir tabloyu **güncellemez**; bu yüzden
`db.MIGRATIONS` açık bir liste olarak yazıldı ve her açılışta koşuyor.
Tekrarlanabilir: ikinci koşumda hiçbir şey yapmaz. Bir test eski şemayla
kurulmuş bir veritabanını taşıyarak bunu denetliyor.

## 8.11 Yönetim — `core/settings.py`

`config.json`'u elle düzenlemek bir teknik ayrıntıdır ve kullanıcıya
yansıtılmamalı; ama ayarı bir arayüze açmak, o arayüzü yeni bir yüzey
yapar. Dört kural:

1. **Sır okunmaz.** Jeton, uygulama sırrı ve bot jetonu dışarı **maskeli**
   çıkar: «kurulu mu» bilgisi verilir, değerin kendisi verilmez. Bir ayar
   ekranı, sırrı ekranda göstermek zorunda değildir.
2. **Jeton buradan değişmez.** `local_token` bir ayar değil bir KİMLİKTİR;
   API'den değiştirilebilmesi, jetonu bilen birinin jetonu değiştirebilmesi
   demektir. Değişimi `kur.py` ve dosya yapar.
3. **Doğrulanmayan değer yazılmaz.** Eşiklerin izinli aralıkları vardır:
   «uyku tabanı 40 saat» diyen bir ayar, VP'yi sessizce susturur. Tip ya da
   aralık tutmuyorsa istek reddedilir ve **hiçbir şey yazılmaz** — yarım
   yazılmış bir yapılandırma, bozuk bir yapılandırmadır. Dosyaya yazma da
   önce geçici dosyaya, sonra yerine taşıyarak yapılır.
4. **Bilinmeyen alan sessizce yutulmaz.** Tanınmayan bir anahtar reddedilir;
   sessizce yok sayılan bir ayar, kullanıcıya «kaydedildi» der ve hiçbir şey
   yapmaz.

Bakım tarafında iki iş var: **yedek** (bütün ambar tek JSON — dokuz aylık
kayıt tek bir disk hatasına bağlı kalmasın) ve **budama** (yalnız ham ölçüm
geçmişi silinir; kararlar ve konuşmalar KALIR, çünkü bu katmanı sonradan
denetlemenin tek yolu onlar). Budama onay ister ve kaç satır sildiğini
söyler: «temizlendi» deyip sayı vermeyen bir işlem, ne yaptığını gizler.

Faz 7 sırasında bulunan iki hata: (a) ayar yazma yolu sabitti, bu yüzden bir
**test koşumu kullanıcının gerçek `config.json`'unu eziyordu** — yol artık
sunucudan geliyor; (b) eşik kaydedildiğinde başarı mesajı, hemen ardından
gelen yeniden çizimle siliniyordu, kullanıcı kaydettiğini göremiyordu.

## 8.12 Dil — `core/dil.py` (Faz 8)

Patron'un komut seti bilerek kapalı; ama insan «bugün ne yapmalıyım» der.
Bu dosya o boşluğa köprüdür ve bir **dil modeli değildir**: kelime tablosu,
Türkçe'ye uygun bir normalleştirme ve bir puanlama ile çalışır. Bir modelin
niyeti yanlış eşlemesi, bir kelime tablosunun yanlış eşlemesinden pahalıdır
— çünkü **neden** yanlış eşlediğini kimse gösteremez.

Beş kural:

1. **Emin değilse uydurmaz.** Puan eşiğin altındaysa ya da ilk iki aday
   birbirine yakınsa niyet belirsizdir ve Patron «şunu mu demek istedin»
   diye **sorar**.
2. **Türkçe'nin kendi harfleri var.** `I→ı`, `İ→i` çevrimi tabloyla yapılır;
   eşleştirmede aksan katlanır (`çapraz`≡`capraz`) — bir komut arayüzünün
   klavye düzenine göre anlayıp anlamaması kabul edilemez.
3. **Ek alır, kök kalır** — ama kök en az üç harf. Ek soyucu kısa
   kelimelerde fazla yediği için (`yarın`→`yar`) hem kök hem ham biçim
   birlikte aranır.
4. **Zaman ayrı okunur:** «dün», «bu hafta», «son 14 gün» bir niyet değil
   bir **parametredir**.
5. **Model eklenirse sayı üretemez.** Dosyanın sonundaki kanca yalnızca
   kurulmuş bir cümleyi yeniden ifade edebilir; kanca boşken HKM bugünkü
   gibi çalışır ve kanca patlarsa cümle olduğu gibi kalır.

### En tehlikeli kör nokta: olumsuzluk

«kabul etmiyorum» cümlesinin **ilk kelimesi «kabul»dür**. Kesin eşleşme tek
başına bırakılsaydı bu cümle bir ONAY olarak işlenirdi — bu katmanın
yapabileceği en kötü şey. Kural asimetriktir ve bilerek öyle:

| Durum | Sonuç |
|---|---|
| olumsuzluk + «kabul» | **belirsiz** → sorulur (bir kelimelik maliyet) |
| olumsuzluk + «ret» | ret kalır (olumsuzluk reddi pekiştirir) |

## 8.13 Niyet kuyruğu — `core/intents.py` (Faz 9)

«Yarın iki saat matematik» isteği, HKM'nin AYS'ye **yazması** demek olurdu
ve tek yönlü bağımlılığı kırardı. Çözüm sahip değiştirmektir:

```text
istek → HKM bir NIYET yazar → modül açılışta kuyruğu SORAR
      → kullanıcıya gösterilir → onaylanırsa MODÜL kendi koduyla uygular
```

Dört kural:

1. **Niyet bir emir değil bir tekliftir.** Kullanıcı görmeden hiçbir şey
   olmaz.
2. **Tanımlı türler dışında niyet yok.** Kuyruk serbest bir uzaktan komut
   kanalı değildir: her tür, modülün ne yapacağını bilerek yazdığı bir
   sözleşmedir (`plan.add`, `focus.set`, `load.reduce`, `measure.ask`).
   Bilinmeyen tür ya da bilinmeyen alan **reddedilir**.
3. **Görülmemiş ile reddedilmiş ayrı şeylerdir** (`delivered` ≠ `dismissed`),
   ve teslim edilmiş bir niyet **uygulanmış sayılmaz**.
4. **Kuyruk kısa tutulur:** aynı teklif iki kez yazılmaz.
5. **Açık niyet, cevaplanana kadar açıktır.** Kuyruğu sormak bir cevap
   değildir: modül teklifi gösterdikten sonra kullanıcı sayfayı
   yenilerse teklif **yeniden gelir**. Aksi hâlde görülmüş ama
   cevaplanmamış bir teklif sessizce kaybolur, merkez de onu sonsuza
   kadar bekler.

Cevap dört sonuçtan biridir ve dördü birbirine indirgenmez:

| Cevap | Anlamı |
|---|---|
| `applied` | modül teklifi **kendi koduyla** uyguladı |
| `acknowledged` | teklif görüldü; uygulamak kullanıcının işi (SPİ'de hep budur) |
| `dismissed` | istenmedi |
| `unknown` | uygulama yarıda kaldı, sonuç **bilinmiyor** |

Son satır bir kaçamak değil bir ölçümdür: sekme kapanmışsa iş olmuş da
olabilir olmamış da. `applied` yazmak yapılmamış bir işi yapılmış,
`dismissed` yazmak olmuş olabilecek bir işi yok saymak olurdu.

Modül tarafında cevabın kaydı **ağdan önce** yerel deftere yazılır. Bu
defter üç şeyi garanti eder: aynı iş **en fazla bir kez** yapılır (çift
tıklama, yeniden yükleme, yeniden bağlanma), «uygulandı ama merkeze
bildirilemedi» hâli **kaybolmaz** — bağlantı gelince bildirim tekrar
denenir — ve yarıda kalmış bir uygulama kullanıcıya **belirsiz** diye
gösterilir, sessizce tekrarlanmaz.

Modül tarafında gelen sözlük bir «komut» değil bir **girdidir**: alanları
tek tek okunur, sınırlanır (süre 10–480 dk) ve sistemin kendi modeliyle
yazılır. SPİ bir teklifi kendiliğinden **uygulamaz** — sağlıkta ölçüm de
yük de kullanıcının kararıdır; ESP ise teklifi bir *hatırlatıcı* yapar,
oturum değil: yapılmamış bir çalışma ölçülmüş görünmemeli.

## 8.14 Ritim, giden kutusu ve haftalık rapor

### `core/outbox.py` — teslim güvencesi, ama tekrar değil

Kanal gönderimi ağdan geçer; ağ her zaman çalışmaz. İki kötü ihtimal de
burada engellenir: başarısız gönderimi **yutmak** (sessizce kaybolan bir
mesaj) ve tekrar denemeyi **tekrar göndermeye** çevirmek (aynı özetin iki
kez düşmesi).

1. Her satırın bir kimliği var: **(kanal, tür, gün)**. Aynı kimlikle ikinci
   satır yazılmaz.
2. Geri çekilme artar: 1, 5, 15, 60 dakika — sonra **vazgeçilir** ve sebebi
   yazılır. Sonsuz yeniden deneme, bir hatayı gizlemenin yavaş biçimidir.
3. **Kalıcı hata tekrarlanmaz:** 401/403/422 ağdan değil yapılandırmadan
   gelir; beklemenin faydası yoktur.
4. Gönderilen satır silinmez: neyin kaç denemede gittiği, neyin hiç
   gitmediği denetlenebilmeli.

### `core/schedule.py` — ritim, ama bildirim akışı değil

Varsayılan **kapalı**. Her işin kimliği (tür + gün) ve günde bir kez
çalışır — daemon dakikada bir tiklamasına rağmen. **Geçmiş iş kovalanmaz:**
daemon akşam açıldıysa sabahın brifingi gönderilmez; günü geçmiş bir
hatırlatma, hatırlatma değil gürültüdür (tolerans 90 dakika). Zamanlayıcı
iş üretmez, **mesaj** üretir: metni kural motoru kurar, teslimi outbox yapar.
Tik hiçbir koşulda fırlatmaz — bir zamanlayıcı hatası daemon'u durduramaz.

### `core/weekly.py` — günün altındaki eğri

Günlük brifing bugünü anlatır ve bugün gürültülüdür. Hafta eğriyi gösterir,
üç kuralla: **hafta bir toplam değil bir kapsamdır** (eksik günleri saymadan
verilen ortalama, ölçülmeyen günleri sıfır saymaktır); karşılaştırma yalnız
**iki hafta da ölçüldüyse** yapılır (tek hafta bir eğri değildir); ve hüküm
yok, hareket var.

Yüzde ve sıralama **daemon'da** üretilir: arayüzün kendi sayısını üretmesi
iki gerçek yaratırdı. Bir test bunu sayfanın kaynağında arıyor.

## 8.15 Sınırlar ve terminal

**Gövde sınırı:** 1 MB'tan büyük bir gövde hiç okunmaz — okunup sonra
reddedilen bir gövde zaten belleğe alınmıştır. **Hız sınırı:** jetonsuz
yollar (webhook, eşleme) dakikada sayılır; sınır kabadır ve öyle olmalı —
ince bir sayaç, korumadığı bir şeyi korur gibi görünür.

**`hkm.py`** terminalden çalışır ve daemon'a HTTP ile **gitmez**:
veritabanını doğrudan okur. Bir bakış için bir servisin ayakta olmasını şart
koşmak, ayakta olmadığı anda hiçbir şey söyleyememek demektir.

```bash
python3 hkm.py durum | hafta | capraz | etki | kararlar | kutu | niyetler
python3 hkm.py sor "bugün ne yapmalıyım"
python3 hkm.py yedek [dosya]
```

## 8.16 Seri — `core/streak.py`

VP'ler her günü **tek başına** denetler ve bu doğrudur: bir gecelik kötü
uyku bir kriz değildir. Ama üst üste dördüncü gece aynı şey değildir ve gün
gün bakan bir sistem bunu hiç görmez.

Dört kural:

1. **Seri en az üç gündür.** İki gün bir eğilim değil, bir rastlantıdır.
2. **Aradaki ölçülmemiş gün seriyi kırmaz ama sayılmaz.** Kayıt girilmemiş
   bir gün «iyiydi» de demek değildir «kötüydü» de: seri devam eder, uzunluk
   ölçülen günlerden sayılır ve **kaç gün atlandığı yazılır**. Atlanan günü
   iyi saymak, ölçmeyerek iyileşmek olurdu. (İki günden uzun boşluk kırar.)
3. **Biten seri de bir bulgudur.** Yalnız devam edeni göstermek, düzelmeyi
   görmezden gelmektir.
4. **Seri bir hüküm değil bir sayımdır.** «Tükenmişsin» denmez; «şu eşik şu
   kadar gün üst üste kırıldı» denir. Eşik de kullanıcınındır: `thresholds`
   üzerinden okunur, kodda sabit tutulmaz.

## 8.17 Dokuz aylık ufuk — `tools/perf.py`

Üç arayüzde `perfcheck` vardı, HKM'de yoktu: boş bir ambarda her sorgu
hızlıdır, asıl soru dokuz ayın sonunda brifingin hâlâ açılıp açılmadığıdır.
Araç 270 gün × 3 modül × 6 gönderim (≈4 900 olay) + 270 karar + konuşmalar
kurar ve sekiz sorguyu bütçeye karşı ölçer.

Bütçenin **yarısını** geçen sorgu «geçti» yazsa bile işaretlenir: sessizce
dolan bir bütçe, dolana kadar hiçbir şey söylemez. İlk koşumda `etki` 191 ms
ile işaretlendi — her karar için ambarı yeniden okuyordu (270 kararda 540
sorgu). Tek geçişli bir önbellekle **88 ms**'ye indi; haftalık rapor da 218 →
113 ms.

## 8.18 Geri yükleme

`POST /api/restore` iki kuralla çalışır: **üstüne yazmak açık bir karardır**
(`replace` verilmedikçe dolu bir ambara dokunulmaz — bir geri yükleme,
sessizce silinmiş bir geçmiş olamaz) ve **tanımadığı tabloya dokunmaz**
(yedekteki bilinmeyen anahtarlar atlanır ve kaç tanesinin atlandığı geri
bildirilir).

## 8.19 Yüzün denetimi — `tools/yuz.js`

Üç arayüz erişilebilirlik, telefon düzeni ve kontrast denetimlerinden
geçiyordu; HKM'nin yüzü hiçbirinden geçmiyordu. «Sade bir sayfa» olmak onu
denetimden muaf kılmaz: dört sekme, tablolar, formlar ve bir dosya seçici
taşıyor.

Araç daemon'u geçici bir veritabanıyla kaldırır, **veri tohumlar** (boş bir
sayfa her denetimden geçer ve hiçbir şey kanıtlamaz), sonra 390 ve 1280
pikselde, açık ve koyu temada, dört sekmeyi tek tek ölçer: yatay taşma,
24×24 dokunma hedefi, etiketsiz öge ve WCAG AA kontrast (4.5).

Yazıldığı ilk koşumda üç gerçek kusur buldu:

1. **Koyu temada birincil düğme kontrastı 2,20** — açılan vurgu renginin
   üzerine beyaz yazılıyordu. Vurgu üzerine gelen metin artık ayrı bir
   jeton (`--on-accent`) ve temayla birlikte değişiyor.
2. **Onay kutusu 13 piksel** — tarayıcı varsayılanı WCAG 2.2'nin 24px
   tabanını geçmiyordu.
3. **Tarih alanı etiketsiz** — ekran okuyucuda yalnızca «düzenleme kutusu»
   diye anılıyordu.

## 8.20 Hafıza, kanal ve BAM

**Hafıza** (`core/memory.py`) modüllerle aynı sözleşmeyi taşır
(`brand/ortak/hafiza.js`): *senin sözün* · *sohbetten* · *tahmin*. Model hiçbir
katmana yazamaz. Modüller hafızalarının **anlık görüntüsünü**
`POST /api/memory/sync/<modül>` ile yollar; HKM kopyasını eşitler (modülde
silinen düşer, HKM'de unutulan geri gelmez). King bütün kapsamları görür,
alt görevli yalnız kendi modülününkini. Profil › «King senin hakkında ne biliyor?»

**Patronlar arası kanal** (`core/kanal.py`, `GET /api/kanal/<modül>`): öteki
iki modülün bugünkü denetim hükmü ve King'in önerisi. **Yalnız okur** —
brifing gibi öneri kaydı yazmaz. Modül bunu Patron brifingine koyar.

**BAM — Bilgi ve Aksiyon Modülü** (`core/bam.py`). HKM'nin alt modülüdür,
beşinci bir sistem değildir. King'in altında BAM Patronu, onun altında dört
ofis: Kayıt · Araştırma · Planlama · Üretim.

| Kural | Neden |
|---|---|
| Yönlendirme kurallıdır; anlaşılmayan talep **sorulur** | AGENTS.md §1.7 |
| Her iş önce Kayıt Ofisi'nden geçer | aynı işi iki kez yapmamak, boşa harcamamak |
| Hazır olmayan ofis «ertelendi» der, iş «kısmen» biter | sessiz «tamam» yalandır |
| Model ya da bütçe yoksa iş **bekler**, uydurulmaz | «Devam et» ile kaldığı yerden |
| Kaynaksız araştırma her zaman «doğrulanmadı» | internete erişim henüz yok |
| BAM hiçbir modüle yazmaz; teklif bırakır | AGENTS.md §1.4 |
| Her kaydın kökü `bam_iz`'dedir | «bu neden var?» |

**Üretim Ofisi** soru seti, alıştırma ya da kart üretir (tür ve adet
kuralla: 3–30). Her madde önce biçim denetiminden, sonra **ikinci bir
çağrıdan** geçer: çoktan seçmeli soru cevap anahtarı ve çözüm GÖSTERİLMEDEN
baştan çözülür, tutmayan düşer; alıştırma ve kart yargıyla denetlenir. Kayıt
kalite raporunu taşır (üretilen / geçen / düşen ve nedeni). Hedef AYS ise
geçen maddeler `material.add` teklifi olur: AYS kaydı çeker, **kendi koduyla**
yeniden doğrular ve kart olarak ekler; aynı set iki kez eklenmez. Hedef ESP
ise aynı teklif ESP'ye gider: ESP seti yalnız dil ya da tarih destesine alır
ve hangisi olduğunu kendi kuralıyla okur.

**Planlama Ofisi v1** (`core/planlama.py`) kuralla çalışır, model kullanmaz.
Yalnız modülün gönderdiği **yapılandırılmış** hedefi alır (şimdilik SPİ kilo
planı); serbest bir cümleden plan kurmaz, o iş «ertelendi» diye kapanır.
Üç şey üretir: **program** (dönem → hafta → görev: tartı günü, enerji ve
protein — SPİ'nin kendi sayıları, yeniden hesaplanmaz —, kullanıcının verdiği
vakit, dört haftada bir değerlendirme), **simülasyon** (plan temposu, dörtte
üçü, yarısı; hepsi «tahmin») ve **plan denetimi** (kilonun %1,5 güvenlik
sınırı, bazal metabolizma tabanı, hekim kapısında enerji yazılmaması). Kritik
bir madde geçmezse program teklif edilmez. Aynı hedefin yeni programı eski
kaydın **yeni sürümüdür**. Kişisel veri en az: hekim talimatının metni
gelmez, yalnız sayısı; tanımsız alan ambara girmez.

İş kuyruğu ritimde her tikte **en fazla bir adım**
ilerler. Model rolleri `bam`, `bam.arastirma`… King'den miras alır.
Belge denetimi (`ai.ask(..., denetim="belge")`) dünya hakkındaki sayılara
izin verir; belge kullanıcının ölçümü gibi sunulmaz. Yüz: **Ofis** sekmesi.

## 8.21 King onay zinciri — `core/king.py` (Hedef motoru, Tur 2)

Modül bir iş için King'e **iş emri** verir (`POST /api/king/emir`). Zincir
katları atlamaz: modül koçu → modül Patronu → HKM alt patronu → King → BAM
Patronu → ofisler. Modül yalnız kendi adına yazar; zincirin HKM tarafını
**sunucu kurar** — istemcinin gönderdiği bir zincir saklanmaz.

| Adım | Ne olur |
|---|---|
| Tür kataloğu | `hedef.plan` (yalnız SPİ). Katalog dışı tür reddedilir; King serbest bir komut kanalı değildir |
| İmkân kontrolü | ofis hazır mı · model gerekiyorsa atanmış mı · bütçe · güvenlik (plan denetçisinin kritik maddeleri) · depo · kuyruk. Karar **onay / kısmi / ret**, her maddenin notuyla |
| Önce depo | Aynı girdiyle bitmiş iş yeniden kurulmaz; kayıt yeniden teklif edilir |
| Tahmini süre | En az üç benzer geçmiş işin ortancası, yoksa adım × ritim. Her zaman «tahmin» ve dayanağıyla; iş bitince gerçek süre yazılır, sapma ölçülür |
| Bildirim | `bildirimler` tablosu: onaylandı · başladı · bekliyor · bitti · reddedildi · iptal · hata. Bildirim **durum değişimidir**; aynı durum iki kez yazılmaz. `GET /api/bildirim/<modül>`, `POST /api/bildirim/<id>/okundu` (okundu silmez) |
| Cevap | İş bitince King modüle `plan.apply` teklifi bırakır (`core/intents.py`). Modül programı `GET /api/bam/kayit/<id>` ile çeker, **kendi kontrol noktalarıyla sınar** ve kullanıcı onaylarsa ekler |

King **uygulamaz, onaylar**: onay işin BAM'da açılmasıdır, hiçbir modülde
hiçbir şey değişmez. HKM kapalıyken modülün planı çalışır; iş emri açılmaz ve
bu söylenir. Yüz: **Ofis › King kuyruğu** (karar, imkân maddeleri, yol, tahmini
ve gerçek süre, iptal).

## 8.22 Hedef ağı ve zaman bütçesi — `core/hedefag.py`

Üç modül hedefini kendi kuralıyla kurar ve birbirini görmez; ama üç hedef
aynı günü paylaşır. Modül etkin hedeflerinin **özetini** yollar
(`POST /api/hedef/sync/<modül>`, anlık görüntü; istemci `brand/ortak/hedefag.js`).
HKM özeti kurala göre süzer: kimlik, kısa ad, durum, son tarih, vakit,
kararın bandı, planın ilerlemesi. Hedefin cümlesi ve kişisel ölçümler gelmez.

Zaman bütçesi kodla kurulur: talep = etkin hedeflerin haftalık vakti
(günlük dakika × haftada gün), vakit = kullanıcının beyanı (`POST /api/zaman`).
Sığar / sıkışık (vaktin 1,25 katına kadar) / sığmaz; cümle koddur ve
seçenekleri sayar (askıya al, tarihi uzat, vakti artır), seçim kullanıcınındır.
Vakti bilinmeyen hedef (SPİ kilo) toplama 0 ile girmez, adıyla söylenir;
toplam vakit bilinmiyorsa karar verilmez. Karar kullanıcının beyanına dayandığı
için «tahmin»dir. HKM › Hedefler sekmesi ve modüllerin Hedeflerim kartı aynı
cümleyi gösterir. Testler: `tests/test_hedefag.py`, `tools/entegre.js` §2.9 ve §4.5.

## 8.23 Otomatik modül yedeği — `core/yedek.py`

Üç arayüzün verisi tarayıcının deposundadır; site verisi silinirse geri
gelmez. HKM açıksa her modül **günde bir kez** kendi yedeğini yollar
(`POST /api/yedek/<modül>`; istemci `brand/ortak/yedekag.js`). Gövde
ayrıştırılıp yeniden yazılmaz: saklanan, modülün ürettiği baytların kendisidir
ve `db/yedek/<modül>/<tarih>.json` olarak ambarın yanında durur (depoya girmez).

- **Yazıldı demek, geri okundu demektir.** Geçici ada yaz, diske indir, adı
  değiştir, geri oku; bayt ve SHA-256 tutmazsa «yazıldı» denmez. Modül yedek
  hatırlatmasını ancak HKM aynı baytı (ve tarayıcı hesaplayabiliyorsa aynı
  özeti) söylerse kapatır.
- **Başka modülün dosyası kabul edilmez** (`__meta.app` yolun modülüne ait
  olmalı).
- **Silinmiş bir tarayıcı iyi yedekleri sildiremez.** Son 14 gün + son 6
  ayın her birinden ayın son yedeği kalır; bir öncekinin yarısından küçük
  yedek uyarıyla döner ve modül bunu gösterir. İstemci, hatırlatmanın kayıt
  eşiğinin (`YEDEK_ASGARI_KAYIT`) altında hiçbir şey yollamaz.
- **HKM modüle yazmaz.** Geri yükleme modülün kendi Rehber › Veri yolundan
  geçer; HKM › Ayarlar › Sunucu › Modül yedekleri yalnız listeler ve indirir.

Testler: `tests/test_yedek.py`, `tests/test_daemon.py` (uçlar),
`brand/ortak/yedekag.test.js`, `tools/entegre.js` §2.95.

## 8.24 Haftalık rapor basılır — `core/weekly.py` `belge()`

Haftalık rapor, BAM kayıtlarıyla aynı belge modeline çevrilir (`cikti.uret_belge`)
ve aynı çizicilerden (HTML, PDF) geçer. Belgenin her sayısı `report()`'tan gelir;
belge yeni sayı üretmez. Etiketi **«hesaplandı»**dır (kaynaktan değil ölçümden
gelir); alt bilgide BAM kayıt numarası yerine haftanın kendisi yazar
(`dayanak`). Bölümler: kapsam (kayıtlı gün), ölçüler (ortanca, önceki, değişim,
etiket), etkin hedefler ve zaman bütçesi (`core/hedefag.py`), çapraz bulgu ve etki.

Zamanlanmış haftalık iş Telegram'a metnin yanında PDF'i de koyar (`weekly:belge`
satırı; bayt ambara yazılmaz, giden kutusu gönderim anında raporun **kendi**
haftasını basar). WhatsApp'a belge yolu yoktur; metin PDF'in yerini söyler.
HKM › Sistemler › Haftalık karşılaştırma: «PDF indir» (`GET /api/weekly/belge`)
ve «Sohbet kanalına gönder» (`POST /api/weekly/gonder`, zamanlanmış işin aynısı;
aynı gün ikinci kez kuyruğa girmez). Testler: `tests/test_ritim.py`,
`tests/test_daemon.py`.

## 8.25 Akşam yoklaması — `core/dil.py` `rapor()`, niyet `kayit.add`

Bot akşam **sorar** (`schedule.checkin`, örnek «21:30»; boş = kapalı; HKM ›
Ayarlar › Otomatik mesajlar › «Akşam yoklaması»): «Bugün ne yaptın?» ve o gün
kaydı gelmeyen modüllerin adı. Soru sayı söylemez, emir kipi taşımaz.

Cevap sohbete gelir (Telegram, WhatsApp ya da HKM yüzü — tek yol,
`sohbet.konus`). **Geçmiş kip** (`dil.gecmis`: yalnız 1. tekil şahıs -dım/-tım,
-mıştım; «matematik»in -tik sonu geçmiş sayılmaz, «yardım» gibi isimler
dışlanır) bir **rapordur**, plan isteği değildir: `dil.istek` artık geçmiş
kipte `None` döner. `dil.rapor` cümleyi yan cümlelerine böler ve her parçayı
modülün kelimesine göre yönlendirir (ders adı genel fiilden ağır basar;
eşitlikte tahmin edilmez). Miktarı olmayan («matematik çalıştım») ya da
modülü belirsiz parça sorulur; olumsuz cümle («çalışmadım») kayıt değildir.

HKM **sayıyı okumaz ve hiçbir modüle yazmaz**: her parça `kayit.add`
(`date`, `metin`) teklifi olur. Modül metni KENDİ ayrıştırıcısıyla okur
(AYS `core/entry.js`, SPİ `core/proposals.js` `fromText`, ESP `core/parse.js`),
teklif kartında «… şöyle okudu» satırlarını onaydan ÖNCE gösterir; «Kaydet»
AYS ve SPİ'de öneri kapısından geçer (geri alınabilir), ESP'de oturum yazar.
Okunamayan parça sebebiyle gösterilir; AYS o gün planlanmış bloğu olmayan
derse uydurma blok açmaz.

Gün söylenmemişse bugündür; gece 04:00'e kadar gelen ve dünün yoklaması
sorulmuş cevap **dünün** kaydıdır (`patron.rapor_tarihi`). İleri tarihli
kayıt yazılmaz. Testler: `tests/test_dil.py`, `tests/test_intents.py`,
`tests/test_ritim.py`, `tests/test_sohbet.py`, modüllerin `beacon.test.js`,
`tools/entegre.js` §0.6 ve §2.75.

## 8.26 Ürün modüle, Ofis ekranı — W6

**Modülden ürün isteği.** Modül sohbetinde «türev hakkında özet hazırla»:
ön süzgeç (`brand/ortak/urun.js`, katalogla AYNI kelimeler — `tests/test_urun.py`
sınar) cümleyi `POST /api/king/urun`'a yollar; tanıyıcı HKM'dedir
(`sohbet.urun_istegi`). Tanınmazsa `tanindi: False` döner ve emir açılmaz.
Tanınırsa King `bam.urun` emrini **modül adına** açar; bitince ürün o modüle
`urun.add` teklifi olur (`king._teklif_urun`).

**Modülde ürün.** `urun.add` onaylanınca modül kaydı (`/api/bam/kayit/<id>`) ve
basılı hâlini (`…/cikti?bicim=html`) çeker, KENDİ koduyla sınar (tür, aile, ürün
adı teklifle tutmalı; belge bölümsüz, sunum slaytsız olamaz; HTML belgesi ve
300 000 karakter sınırı) ve kendi deposuna yazar (`meta/bamUrunleri`, en çok 20).
Ofis ekranındaki «BAM ürünleri» listesinden `sandbox=""` iframe'de açılır (betik
çalışmaz); HKM kapalıyken de okunur.

**HKM yüzü › Ofis.** Kayıt PDF / HTML (görselse SVG) olarak indirilir (jetonla,
fetch + blob; dosya adı ASCII — Chromium Türkçe harfli adı «download» yapıyordu),
her adımın **ajan izi** (`adimlar[].iz`) açılır, «Depoyu denetle» depo denetimini
(`GET /api/bam/depo`; yüzdeyi kod verir) gösterir. **Ayarlar › Web:** açık/kapalı,
sağlayıcı sırası, anahtarlar (maskeli döner, maskeli değer geri gelirse dokunulmaz),
Google cx, SearXNG adresi, günlük sınır, güncellik turu ve «Dene»
(`POST /api/web/dene`). Testler: `tests/test_urun.py`, `tests/test_daemon.py`,
`brand/ortak/urun.test.js`, `tools/entegre.js` §0.7, §2.76 ve §7.

## 8.27 Bilgi Deposu tarayıcısı — `core/depo.py` `tarayici()` (Y9)

HKM › Ofis › Bilgi Deposu: bütün BAM kayıtları (araştırma, materyal, plan) tek
listede; arama, tür ve tazelik süzgeci (`GET /api/bam/depo/tara?q=&tur=&durum=`).
Sayım süzgeçten ÖNCE yapılır, seçim kutusu neyin kalacağını söyler. Her kaydın
tazeliği KODLA verilir ve etiketlidir:

- **ölçüldü:** eski sürüm (aynı konunun yeni sürümü var) · güncel / kaynağı
  değişti / denetlenemedi (Kayıt Doğrulama Uzmanı'nın son canlı denetimi).
- **hesaplandı:** eskiyen (tür süresi geçti: araştırma 90, plan 180, materyal 365
  gün) · yeni (bugün yazıldı) · araştırmaya dayanmıyor.
- **veri yok:** ölçülmedi — ölçülmemiş kayıt «güncel» diye gösterilmez.

Materyal ve plan kaydı, dayandığı araştırmanın tazeliğini taşır. Kaydı açınca
tazelik, sürüm zinciri (aynı konu anahtarı ya da `onceki_id` bağları, iki yöne)
ve kaynaklar görünür; kaynağın iz parmağı sunucudan çıkmaz. Tarayıcı ağa
çıkmaz, model çağırmaz, kayıt silmez; tazeleme eylemi Part 8e'dedir.
Testler: `tests/test_depo.py`, `tests/test_daemon.py`.

## 8.28 King'in teklifi — `core/teklif.py` (Part 8a)

İş BAM'da açılmadan önce King üç şeyi kodla hesaplar ve iş emrine yazar
(`is_emirleri.teklif`):

- **Yoğunluk sınıfı.** Ölçü «iş birimi»: tahmini model çağrısı + web isteği,
  ofislerin gerçek çağrı yerlerinden sayılır (araştırma ~4 çağrı + ~8 web; kitapta
  bölüm × 2: üretim + bağımsız çözüm; ürün 1; program 1; kural işi 0). Eşikler TEK
  tabloda (`SINIFLAR`): düşük ≤ 3 çağrı ve web yok · orta ≤ 10 · yüksek ≤ 40 · ekstra.
- **Maliyet, önce ölçümden.** Model çağrısı ait olduğu BAM işine yazılır
  (`usage.is_id`; `butce.is_baglami` iş parçacığına özel bağlam, `bam.ilerlet`
  kurar). Biten işin ölçülen maliyeti `sonuc.maliyet`'tedir. Teklif: aynı tür ve
  sınıfta ≥ 3 biten işin ortancası ve p90 → yoksa ölçülen çağrı başına ortanca ×
  tahmini çağrı → yoksa jeton tahmini × modelin tarifesi. Üçü de «tahmin» ve
  dayanaklı. Model atanmamışsa maliyet uydurulmaz: «hesaplanamadı».
- **Süre** `king.tahmini_sure` (kitabın ek bölümleri ek tik); **bütçe payı** aylık
  tavandan («aylık bütçenin %X’i; kalan Y»), tavan yoksa söylenir.

Seçenekler genel kuralla: tür başına bir küçültücü (`KUCULT`: kitap → yalnız 1.
bölüm, kaynaklı ürün/program → kaynaksız). Öneri koddan: tam seçenek kalan bütçeye
sığmıyorsa ya da tavanın %25'inden fazlasını yiyorsa küçük önerilir, gerekçesi
yazılır. Seçeneklerin gövdesi sunucuda kalır; ekrana ve bildirime yalnız sayı ve
cümle gider. HKM › Ofis › King kuyruğu teklifi, gerçek maliyeti ve tahmin–ölçüm
sapmasını (`king.maliyet_sapmasi`) gösterir.

**Onay kapısı (8a-3).** Ücretli iş `teklif` durumunda bekler; BAM'da iş AÇILMAZ.
Onay üç yoldan gelir ve hepsi `king.teklif_onayla(emir, secenek)`'ten geçer:
HKM › Ofis › King kuyruğundaki seçenek düğmeleri (`POST /api/king/emir/<id>/onayla`),
sohbet kanalı («1», «2», «iptal»; `king.teklif_cevap` — yalnız aynı kanal ve alıcının
en yeni teklifi, yerel sohbette HKM'den açılan) ve modülün teklif kartı (AYS/SPİ/ESP
Bugün › «King teklifi»; `brand/ortak/kingteklif.js`, `GET /api/king/teklifler/<modül>`;
modül King'e iş verince `lifeos:king` olayıyla hemen, yoksa dakikada bir tazelenir). Onay anında
imkân kontrolü YENİDEN yapılır (bütçe ya da kuyruk değişmiş olabilir). Küçük seçenek
gövdeyi `KUCULT` ile yeniden kurar, konu bunu söyler. Kural işi (model yok, bedava)
sorulmaz; düşük sınıfı kullanıcı Ayarlar › Bütçe › «Düşük sınıf işleri sormadan yap»
ile açabilir (`king.sormadan_dusuk`); orta ve üstü her zaman sorar. King'in güncellik
turunun açtığı yeni sürüm araştırması da teklif olarak bekler.
**Parça parça ve ara onay (8b).** Seçenekler tür başına bir sözlüktür
(`teklif.SECENEK`: tam · küçük · parça). Test kitabında «bölüm bölüm, her bölümden
sonra onayınla» seçeneği tam kitabın aynısıdır (sınıf ve maliyet aynı, bölüm başı
pay söylenir); yüksek ve ekstra sınıfta önerilir. Seçilirse iş gövdesi `parcali`
taşır; BAM her bölümden sonra `ara_onay`da durur (`bam._kitap_adimi`), tik geçse de
model çağrılmaz. King bölümün kalite sonucunu ve o ana kadarki ölçülen maliyeti
bildirir (Telegram'a da gider). «devam» (`bam.devam`) sıradaki bölümü üretir, «dur»
(`bam.kes`) kitabı üretilen bölümlerle bitirip modüle teklif eder; hiçbir bölüm
kaybolmaz. Yollar: `king.parca`, `POST /api/king/emir/<id>/devam|dur`, sohbette
«devam» / «dur», HKM King kuyruğu ve modül kartı düğmeleri.
Testler: `tests/test_teklif.py`, `tests/test_butce.py`, `tests/test_urun.py`,
`tests/test_kitap.py`, `tests/test_daemon.py`; üretimi sınayan testler onayı
`tests/yardim.py onayla` ile verir.

## 8.29 Kütüphanem — AYS test kitabı ekranı (Part 8b)

Kayıt görünümü (`GET /api/bam/kayit/<id>` → `depo`) kaydı üreten işin ÖLÇÜLEN
maliyetini taşır (`depo._kayit_maliyeti`: `usage.is_id` toplamı, `butce.is_maliyeti`).
İşsiz kayıtta alan boştur; çağrısı bağlanmamış iş (`usage.is_id` sonradan geldi)
sıfır maliyetli sayılmaz, **veri yok** der. AYS kitabı eklerken bu ölçümü kitaba
yazar (`testkitabi.maliyetOku`), kendisi hesaplamaz.

AYS › Sınama › «Kütüphanem · test kitapları»: her kitabın kaynağı (kaynaklı /
kaynaksız), çözülen bölüm ve soru oranı (hesaplandı), ölçülen maliyeti; bölüm
başına «Çöz / Yeniden çöz» ve çözülmüşse «Gözden geçir» (son sonucun cevaplı
incelemesi, `ozetAc`). Çözme ekranında soru şeridi her soruya tek dokunuşla
gider; cevaplı soru dolu görünür, doğru/yanlış bölüm bitene kadar görünmez.
Sonuçta «Yanlışları deftere ekle» (Part 7 madde 9): yalnız YANLIŞ cevaplar (boş ve
hatalı işaretli sorular hariç) yanlış defterine yazılır, aynı soru ikinci kez
girmez, «Geri al» kalır. Hata etiketi UYDURULMAZ: kayıt etiketsiz gelir, defterde
«etiket yok» rozetiyle durur, türü (K/İ/Y/S/D) kullanıcı seçer; seçilene kadar
hata dağılımına ve reçeteye girmez. Testler: `AYS/src/tests/testkitabi.test.js`,
`tests/test_depo.py`.

## 8.30 SPİ bilgisi — `core/spibilgi.py` (Part 8c)

King iş türü `spi.bilgi` (yalnız SPİ): **besin** değerleri (100 g), **market fiyatı**,
**yer** listesi (spor salonu vb.; semt ya da şehir zorunlu). Girdi kapalıdır: tür, ad,
konum; sağlık verisi bu işe gitmez. Teklif: 1 yazım çağrısı + kurallı 2 arama + en çok
5 sayfa okuma (`teklif.birim`), orta sınıf; onaysız açılmaz.

Araştırma Bürosu sorguları KURALLA kurar (model yok), kaynakları okur, model tek
çağrıda tipli JSON yazar. Kod süzer: makrolar enerjiyle tutmazsa (|4p+4c+9f − kcal| >
max(40, %25)) ya da toplamı 100 g'ı aşarsa kayıt YAZILMAZ; aralık dışı ve bilinmeyen
mikro besin boş kalır (`bilinmeyen_mikro`), sıfır yazılmaz; doymuş yağ toplam yağı,
şeker karbonhidratı aşamaz. Alıntı kaynakta, SAYI alıntıda aranır
(`spibilgi.sayi_alintida`: 14,1 / 14.1 / 1.299,90 biçimleri). Besinde en az bir makro
alıntıda geçmezse kayıt «doğrulanmadı»dır; fiyatta ve yerde doğrulanmayan satır düşer,
birim fiyatı (TL/kg) ve ortancayı kod hesaplar, etiket «tahmin». Yerin fiyatı alıntıda
yoksa fiyat boş kalır. **Fiyat ve yer model bilgisinden yazılmaz:** web kapalıysa ya da
kaynak çıkmazsa iş model çağırmadan «hata» ile biter ve nedenini söyler; besin web'siz
yazılabilir ama «doğrulanmadı» ve uyarılıdır. Biten kayıt SPİ'ye niyet olarak bırakılır
(`besin.add` / `fiyat.add` / `yer.add`, `king._teklif_spibilgi`); aynı konu depoda
güncelse yeniden aranmaz (Depolama Bürosu, konu anahtarı `spibilgi.konu`). King'in
güncellik turu değişen kaynağı SPİ'ye bildirir. Testler: `tests/test_spibilgi.py`.

## 8.31 Bildirim politikası ve kolaylıklar — `core/bildirim.py`, `core/eksik.py` (Grup 1)

Kullanıcının dikkati korunur, hiçbir mesaj kaybolmaz:

- **Sessiz saat + günlük sınır** (fikir 12, 13): `outbox.flush` her satırı göndermeden
  önce `bildirim.ertele_mi`'ye sorar. Cevap («reply:») hiç beklemez. Bekleyen satır
  `ertelendi=1` olur, vadesi sabaha kayar; vadesi gelen birden çok bekleyen `birlestir`
  ile TEK özet satırında gider (orijinaller «birlesti», silinmez). Varsayılan kapalı;
  Ayarlar › Otomatik mesajlar (`bildirim.sessiz_bas/bit`, `gunluk_en_cok`).
- **Eksik veri tek soru** (9): sabah brifingi dünün eksik TEK ölçümünü sorar (uyku, sonra
  AYS soru; son 7 günde kullanılan modül). Tablo `sorular`. «7» → dünün tarihiyle
  `kayit.add` (sayıyı modül okur), «bilmiyorum» → veri yok kalır.
- **Bir daha sorma** (14): tablo `susturmalar`; soru türünü (`eksik:*`), günün öneri
  kuralını (`oneri:<key>`) ya da akşam yarın özetini (`yarin`) susturur. `bio_red`
  susturulamaz. Ayarlar'da «Yeniden sor»; `POST /api/bildirim/ac|sustur`.
- **Cevapsız teklif kapanır** (15): `bayatlari_kapat` her tikte; `teklif_omru_gun`
  (3) günden eski cevapsız modül teklifi `expired`, King teklifi `iptal` olur; kapananlar
  tek mesajla söylenir.
- **Tek kelime kayıt** (8): `dil.kisa_kayit` — «su 2, uyku 7, soru 40» (yalnız «alan sayı
  [birim]») rapor gibi `kayit.add` olur.
- **Akşam «yarın şunlar var»** (19): modüller yarının ilk işlerini KENDİ koduyla seçip
  hedef eşitlemesiyle yollar (`brand/ortak/hedefag.js` `yarin` kancası → tablo
  `yarin_ozet`); akşam kapanışı (yoksa yoklama) en çok üç işi AYS-SPİ-ESP sırasıyla
  dizer. «yarın hafif» → modüllere `load.reduce` teklifi (oranı modül seçer).
- **Önce depo** (46): aynı konuda depoda kayıt varsa King'in teklifinde EN ÜSTTE «depodaki
  kayıt (2 ay önce yapıldı) · ücretsiz · hemen»; 90 günden yeniyse önerilir, seçilirse BAM'da
  iş açılmaz (`king._depodan_ver`). Güncelliği bu yolda denetlenmez ve bu söylenir.
- **Toplu onay** (11, modüller): Bugün › HKM teklifi kartında «Hepsini kaydet (N)» —
  yalnız okunabilen günlük kayıtlar (küçük aksiyon); her biri modülün kendi yolundan geri alınır.

Testler: `tests/test_bildirim.py`, `tests/test_teklif.py` (önce depo), `tools/entegre.js`
§2.78–2.79.

## 8.32 Tatil ve haftalık kazanımlar — `core/hedefag.py`, `core/weekly.py` (Grup 4)

- **Tatil modu** (fikir 56): modül tatili `brand/ortak/seri.js` ile işaretler; hedef
  eşitlemesi yalnız TARİHİ yollar (`tatil_ozet`). Tatildeyken yoklama sorulmaz, sabah
  brifingi «Tatil modundasın» der, eksik veri sorusu ve akşam «yarın» özeti gitmez,
  bayat teklif kapatma bekler. Dönüş sabahı (`donus_teklifi`) modüllere tek seferlik
  `load.reduce` teklifi bırakılır; oranı modül seçer (AYS `core/tatil.js`: dönüşün ilk
  iki günü yarım süre).
- **Seri dondurma** (50): hasta/izin/tatil günü seriyi kırmaz, sayılmaz da; üç modülün
  seri hesabı (`calc.js` / `state.js`) donmuş günü atlar. HKM'ye neden gitmez.
- **Neler kazandın** (49): `weekly.kazanimlar` — yalnız yönü kodda belli ölçüler (`YON`;
  kilo, nabız, tansiyon, su YOK), en az %5 iyi yönde hareket, en çok üç; uyku yalnız
  tabana/banda (esik – 9 saat) yaklaşınca; ardından düzen (7 günün en az 5'inde kayıt).
  Hepsi «hesaplandı»; XP'ye bakılmaz; yoksa «ölçülmüş bir artış yok». Rapor satırları
  artık ekran adını (`ad`) ve Türkçe yüzdeyi (`degisim`) taşır; mesaj, yüz ve belge
  ham anahtar yazmaz. `cross.py` cümleleri Türkçe harfle.

Testler: `tests/test_ritim.py` (kazanımlar), `tests/test_bildirim.py` (tatil),
`tests/test_cross.py` (Türkçe metin).

## 9. Fazlar

| Faz | İçerik | Durum |
|---|---|---|
| 1 | Çekirdek daemon, SQLite şeması, bearer'lı sync | **yazıldı** |
| 2 | Başkan Yardımcıları (VP) + öncelik sırası | **yazıldı** |
| 3 | Dijital İkiz, Yönetici, öneri yaşam döngüsü, çapraz bulgu, veri merkezi, etki | **yazıldı** |
| 4 | Kanal katmanı + Telegram adaptörü | **yazıldı** (kapalı gelir) |
| 5 | WhatsApp geçidi (Cloud API, imzalı webhook) | **yazıldı** · ses yapılacak |
| 8 | Doğal dil (kural tabanlı niyet eşleme) | **yazıldı** |
| 9 | Niyet kuyruğu — HKM iş başlatır, modül yazar | **yazıldı** |
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


## Sağlayıcılar ve görev dağılımı

Sistemde bir hiyerarşi var ve her kademenin işi farklı. Hepsini tek
anahtara bağlamak iki şeyi birden yapardı: ucuz bir işi pahalı modele
yaptırmak, ve tek bir anahtarın sızmasını bütün sistemin sızması hâline
getirmek. Bu yüzden **atama kademe kademedir** (`core/models.py`):

```
king                        Büyük Patron — günün tek cümlesini taşıyan ses
├── vp_bio                  HKM konseyi: biyolojik sermaye   (SPİ)
│   └── spi.{sohbet,analiz,plan,gorsel}
├── vp_academic             HKM konseyi: akademik hedef      (AYS)
│   └── ays.{sohbet,analiz,plan,gorsel}
└── vp_intellect            HKM konseyi: entelektüel gelişim (ESP)
    └── esp.{sohbet,analiz,plan,gorsel}
```

Yedi kural, hepsi bir şeyi korur — **model otorite değildir**:

1. **Kural motoru otoritedir.** Buradaki hiçbir ayar bir eşiği, bir hükmü
   ya da bir önceliği değiştirmez. Bütün anahtarlar boş olsa sistem aynen
   çalışır.
2. **Varsayılan kapalıdır.** Hiçbir kademe kendiliğinden bir modele
   bağlanmaz; bağlamak bilinçli ve **parası olan** bir karardır.
3. **Sır ekranda görünmez.** Anahtar dışarı maskeli çıkar (`key_set` +
   son iki karakter) ve hiçbir günlüğe yazılmaz.
4. **Atama miras alır.** Kademeye atama yoksa üstüne bakılır; en üstte de
   yoksa «atanmamış» denir. Uydurulmuş bir varsayılan, kullanıcının
   seçmediği bir modele para ödemesidir.
5. **Bilinmeyen kademe reddedilir.** Kademe listesi kapalı bir kümedir.
6. **Bağlantı denenmeden «çalışıyor» denmez.** `POST /api/probe` anahtarı
   sınar — model çağırmaz, mesaj üretmez; yalnızca kapının kimliği tanıyıp
   tanımadığına bakar. **Kurulu olmak, çalışmak değildir.** Sınama, hangi
   anahtar seçilmişse **onu** sınar: «sağlayıcı çalışıyor» demek, ikinci
   anahtarın da çalıştığını göstermez.
7. **Bir sağlayıcının birden çok anahtarı olabilir.** İki kişi aynı
   sistemi kullanıyorsa harcamaları da ayrı görünmeli; bir anahtarın
   limiti dolunca sistemin tamamı durmamalı. Her anahtarın bir **adı** ve
   bir **sahibi** vardır; harcama o sahibin defterine yazılır
   (`usage.user`), yani bütçe ekranındaki «kim harcadı» ayrımı bir
   tahminden değil **ölçümden** gelir.

   Kademe hangi anahtarla ödeyeceğini seçer; seçmezse sağlayıcının ilk
   anahtarı geçerlidir. Seçilen anahtar **silinmişse başka bir anahtara
   sessizce geçilmez** — bu, başkasının hesabından para harcamak olurdu;
   durum «seçili anahtar silinmiş» diye söylenir ve çağrı yapılmaz.

   Silinen bir anahtar kimliği **yeniden kullanılmaz**: kimliği geri
   vermek, eski bir atamayı sessizce başka bir anahtara bağlardı. Sayaç
   (`models.key_seq`) yamadan gelmez, sunucuda tutulur.

### Anahtarların yapılandırmadaki hâli

```json
"models": {
  "keys": {
    "openrouter": [
      { "id": "k1", "label": "Benim",    "key": "sk-or-…", "user": "ben" },
      { "id": "k2", "label": "Kardeşim", "key": "sk-or-…", "user": "kardeş" }
    ]
  },
  "assignments": { "king": { "provider": "openrouter",
                             "model": "google/gemini-2.5-flash",
                             "key": "k2" } }
}
```

Tek dizeli **eski biçim** (`"openrouter": "sk-or-…"`) okunmaya devam eder
ve tek elemanlı liste sayılır: kullanıcının dosyayı elle dönüştürmesi
gereken bir sürüm yükseltmesi, kurulumu bozmanın sessiz yoludur.

Ayarlar → **Yapay zekâ** sekmesinde iki bölüm: **Sağlayıcılar** (her
sağlayıcının altında anahtar satırları; her satırda ad, sahip, değer,
«Sına» ve «Sil») ve **Görev dağılımı** (kademe kademe, mirasla ve — iki
anahtar varsa — anahtar seçiciyle birlikte). Sohbet kanalları ayrı bir
sekmededir.

Ekran kayıtlı bir anahtarın **değerini hiçbir zaman getirmez**, maske
gösterir. Değer alanı boş bırakılırsa sır **korunur** ve yalnız adı ile
sahibi güncellenir; bir anahtarı silmek için satırını «Sil» ile kaldırıp
kaydetmek gerekir. Maskeyi geri gönderip sırrı silen bir ekran,
kaydetmeyi tehlikeli bir iş yapardı.

## Bütçe — paranın ölçümü

Fatura ay sonunda gelir; o zamana kadar «ne kadar harcadım» sorusunun
cevabı ya ölçümdür ya tahmindir. `core/butce.py` + `usage` tablosu ölçümü
tutar. Beş kural:

1. **Tavan aşılmaz, aşılması gereken de değildir.** Tavan bir hedef değil
   bir sınırdır; sınıra yaklaşmak bir başarı ölçüsü değildir.
2. **Sınırda ücretli çağrı durur.** «Birazcık aşalım» diyen bir sistem,
   sınırın kendisini kaldırmış olur. Kural motoru çalışmaya devam eder —
   HKM modelsiz de çalışır.
3. **Kur elle girilir ve tarihlidir.** Kuru sessizce internetten çekmek,
   hesabı her gün değiştiren görünmez bir değişken eklemektir. Eskiyen kur
   ekranda **söylenir**.

   **Tavanın para birimi bir seçimdir** (`ceiling_currency`: `usd` ya da
   `try`) ve varsayılanı USD'dir. Bu bir kolaylık değil, bir tıkanıklığın
   çözümü: tavan yalnızca TL olabilirken, TL hesabı için kur gerekiyordu
   ve **kur girilmeden hiçbir model çağrısı yapılamıyordu**. Kullanıcı
   anahtarını giriyor, modelini seçiyor, sohbet sessizce çalışmıyordu —
   anahtarı doğru, modeli doğru, ama başka bir sekmedeki boş bir kur alanı
   yüzünden. Tavan USD tutulursa kur hiç gerekmez: harcama zaten USD
   ölçülür. TL seçilirse kur şarttır ve eksikliği ekranda **kırmızı**
   yazılır — «model çağrıları yapılmıyor» cümlesiyle birlikte.
4. **Ölçülmeyen kategori sıfır değildir.** Hiç kullanılmamış bir yetenek
   için «0 TL» yazmak, o kategorinin bedava olduğunu ima eder.
5. **Tahmin iki sayıdır.** Tek bir aylık tahmin, iyimser günün tahminidir:
   p50 (ortanca gün) ve p90 (yoğun gün) ayrı ayrı verilir. Az sayıda gün
   ölçüldüğünde p90, ölçülen **en yoğun gündür** — bütçe uyarısında yoğun
   günü küçük göstermek, uyarıyı işe yaramaz yapar.

Başarısız çağrı da deftere yazılır: para, cevap alınmadan da harcanmış
olabilir; yazılmayan bir çağrı, görünmeyen bir giderdir.

**Önerilen sağlayıcı: OpenRouter** — tek hesap, tek bakiye, tek anahtar;
OpenAI, Claude, Gemini, DeepSeek, Qwen ve diğerleri aynı anahtarla. Anahtar
başına aylık limit, bütçe sayacından bağımsız **ikinci bir kilittir**.
Yönetim sekmesindeki «Başlarken» bölümü beş adımı ekranda anlatır: anahtar
girilecek yerde, nereden alınacağı da yazılıdır.

## Mesaj neden yarım kesilirdi — üç ayrı sebep

Kullanıcı «Telegram'da yazılar yarım kesiliyor» dedi. Tek bir sebep
yoktu; üç ayrı yerde üç ayrı kesme vardı ve üçü de sessizdi.

**1. Sağlayıcının «neden durdum» işareti hiç okunmuyordu.** Model jeton
sınırına dayandığında cevabını cümlenin ortasında keser ve bunu
söyler — OpenAI `finish_reason: "length"`, Anthropic
`stop_reason: "max_tokens"`, Google `finishReason: "MAX_TOKENS"`. Biz bu
alanı hiç okumuyor, yarım cevabı tamamlanmış sayıp olduğu gibi
gönderiyorduk. Yarım bir cevabı tam gibi göstermek, ölçülmemiş bir şeyi
ölçülmüş gibi göstermekle aynı aileden bir yanlıştır.

Artık işaret okunuyor ve üç şey oluyor: modele **bir kez** «daha kısa
yaz» deniyor; hâlâ kesikse metin **son tam cümlede** kırpılıyor (yarım
bir cümle, kullanıcıya bitmiş bir düşünce gibi görünür ve çoğu zaman
anlamını da değiştirir); ve kesildiği **metnin içinde söyleniyor** —
Telegram'da yan not yeri yoktur, mesajın kendisi söylemelidir.

**2. Telegram'ın 4096 karakter sınırı yoktu.** Uzun bir mesaj 400 ile
reddediliyor ve kullanıcı «gönderilemedi» görüyordu: cevabın tamamı
hazırdı, yalnızca tek parça hâlinde sığmıyordu. Kanalın kendi sınırı
kanalın sorunudur — artık metin bölünüp sırayla gönderiliyor. Bölme yeri
önem sırasıyla aranır: boş satır, satır sonu, cümle sonu, boşluk;
kelimenin ortasından bölmek okunabilir bir metni okunmaz yapar. Her
parça kaçıncı olduğunu yazar `(2/3)`. Bir parça gitmezse **gerisi de
gönderilmez**: yarım teslim edilmiş bir metin, sırası bozuk okunur.

**3. Sorulan sorunun cevabı da 900 karakterde kırpılıyordu.** `MAX_CHARS`
proaktif mesaj için konmuştu ve gerekçesi doğruydu — davet edilmeden
gelen bir metin kısa olmalı, okunmayan bir rapor rapor değildir. Ama aynı
sınır **cevaplara** da uygulanıyordu: «hafta» diye soran kullanıcı
raporun 900. karakterinde «…» görüyordu. Sorunun cevabını yarım vermek,
vermemenin kibar biçimidir. Kırpma artık yalnızca proaktif mesajda;
uzun cevap bölünerek gidiyor.

## Teslim garantisi ve bakım

**Gelen mesaj bir kez işlenir.** WhatsApp ve Telegram, cevap alamadıklarında
aynı webhook'u **tekrar yollar** — bu bir arıza değil, sözleşmenin
parçasıdır: sağlayıcı teslimi garanti eder, **tek** teslimi değil. Her gelen
mesajın sağlayıcı kimliği (`wamid`, `chat:message_id`) `inbox_seen`
tablosunda **kalıcı** durur; aynı kimlik ikinci kez işlenmez. Bellekte
tutulan bir küme, daemon yeniden başlatıldığı anda boşalır ve koruma tam da
en kırılgan anda kaybolurdu.

**Her cevap giden kutusundan geçer.** Webhook cevapları ve `/api/say` önce
doğrudan gönderiliyordu: ağ koptuğunda mesaj hiçbir yere yazılmadan yok
oluyordu. Artık kuyruğa yazılır, sonra gönderilmeye çalışılır — geç gelen
bir mesaj, hiç gelmeyenden iyidir. Bir cevabın kimliği, cevapladığı mesajın
kimliğidir (`reply:<kanal kimliği>`); böylece aynı mesaja iki kez cevap
yazılmaz.

**«Teslim belirsiz» ayrı bir hâldir.** Ağ koptuğunda isteğin gidip
gitmediği **bilinmez**: sağlayıcı mesajı almış da olabilir. Tekrar denemek
onu iki kez düşürebilir, denememek hiç düşürmeyebilir. Bu sistem tekrar
dener **ve belirsizliği kayda geçer** — `/api/outbox` bunu ayrıca sayar.

**Bakım sessiz olur, başarısızlığı sessiz olmaz.** Zamanlayıcı günde bir
kez (varsayılan 03:30) yedek alır, dokuz aydan eski ham ölçümleri budar
(kararlar kalır) ve gelen mesaj defterini temizler. Kanal ayarı kapalıyken
de çalışır: «mesaj göndermiyorum» ile «kendimi korumuyorum» ayrı şeylerdir.

### Eşzamanlılık

Veritabanı **WAL** kipinde açılır, `busy_timeout` tanımlıdır ve bağlantılar
**otomatik commit** kullanır. Bu bir başarım ayarı değil bir **doğruluk**
ayarıdır: varsayılan kipte unutulan tek bir `commit()`, başka bir iş
parçacığının yazmasını «database is locked» ile düşürür — kaybolan yazma,
olmamış bir olaydır. Atomik olması gereken tek yer geri yüklemedir ve orada
işlem açıkça başlatılır (`BEGIN IMMEDIATE … COMMIT`).

## Yüz — günlük kullanım ile teknik yönetim ayrı

Önce dört teknik sekme vardı (Genel / Sistemler / HKM / Yönetim) ve günlük
ekran; jeton, webhook ve eşik ayarlarıyla **aynı yerdeydi**. Gün içinde
açılan bir merkez ile ayda bir açılan bir yönetim paneli aynı ekranı
paylaşmamalı: her gün gördüğün şey, her gün ihtiyacın olan şey olmalı.

| Bölüm | İçerik |
|---|---|
| **Bugün** | Selam + tarih, üç sistemin durumu yan yana, **onay bekleyen öneri** öne çıkmış, günün özeti (en fazla 5 satır), **konsey kartları** (üç alt patron: sistemi, bugünkü hükmü, kaç bulgusu, modeli var mı, «Konuş →» ve «… aç →»), King'e yazma kutusu. Seri ve çapraz dayanak «Dayanağı göster» altında. |
| **Sohbetler** | Dört görevli kart hâlinde (King + üç alt patron; her birinin modeli ve **King'den miras mı** aldığı yazılı), balon biçiminde konuşma, Enter gönderir / Shift+Enter satır başı. `#/sohbet/bio` doğrudan o görevliyi açar. |
| **Sistemler** | Metrik serileri; haftalık karşılaştırma, dijital ikiz, etki ve karar geçmişi **istenince açılır**. |
| **Ayarlar** (ayrı sayfa) | Yapay zekâ · Bütçe · Sohbet kanalları · Cihazlar · Eşikler · **Sunucu** |

**Yol adres çubuğunda durur** (`#/bugun`, `#/ayarlar`): yenilendiğinde aynı
yerde kalırsın. **Yükleme görünüme göredir** — her sekmede bütün ambarı
sorgulamak, açılışı bekletmekten başka iş yapmıyordu.

**Tema üç hâldir:** açık, koyu, sistem. «Sistem» işaretsiz bırakılır ve
işletim sisteminin tercihi geçerli olur; kullanıcı açıkça seçtiğinde
`<html data-tema>` damgalanır ve medya sorgusunu yener. Seçim kaydedilir:
her açılışta yeniden seçmek zorunda kalmak, seçim olmamasından kötüdür.

**Konsey açıkta durur.** Bir süre «Dayanağı göster»in içindeydi ve o blok
kapalı geliyordu: günün hükmünü veren üç alt patron, onları arayan bir
kullanıcının bile göremediği bir yerdeydi. Hükmü verenler, hükmün yanında
durur.

`tools/yuz.js` **40 görünüm** denetler (4 ana bölüm + 6 ayar sekmesi
× 2 genişlik × 2 tema): yatay taşma, 24px dokunma hedefi, etiket ve AA
kontrast.

## Sohbet — komut seti küçüktür, konuşma değil

Komut seti küçük ve kapalıdır; bu iyi bir şey ama yeterli değil. «Bugün
odaklanamadım, programı hafifletelim mi?» bir komut değildir ve bir komuta
çevrilmesi de gerekmez.

`core/sohbet.py` o cümleyi karşılar — ama **sistemi değiştirmez**. Dört
sınır:

1. **Önce komut, sonra istek.** Kullanıcı «durum» yazdıysa kural motoru
   cevap verir; modele **gidilmez**. Ücretsiz, kesin ve her zaman aynı
   olan yol önce denenir. Bu, Telegram'dan gelen mesajda da böyledir.

   Komut değilse ikinci soru sorulur: bu bir **istek** mi? «Yarın iki saat
   matematik» bir sohbet değil, ilgili modülün kuyruğuna **teklif**
   bırakan bir eylemdir. Bu adım bir süre atlanıyordu ve sonucu sessiz bir
   kayıptı: model bağlanmadan önce bu cümle teklif üretiyor, model
   bağlandıktan sonra aynı cümleye yalnızca güzel bir laf dönüyordu —
   **model bağlamak, sistemi daha az iş yapar hâle getirmişti.**

   Eylem, ifadenin önünde gelir: bir teklif onay zincirinden geçer ve iş
   yapar; bir paragraf yalnızca söyler. `dil.istek` ihtiyatlıdır (gün ve
   süre birlikte geçmiyorsa `None` döner), bu yüzden olağan sohbeti
   kaçırmaz.
2. **Model yalnız cümle kurar.** Gönderilen bağlam, kural motorunun
   **ürettiği** ölçülerdir — ham veri değil, zaten yazılmış satırlar.
   Modelin göreceği tek gerçek budur ve cevaptaki sayılar bununla
   denetlenir.
3. **Sohbet onay değildir.** Konuşmak bir şey değiştirmez. Planı ya da
   veriyi değiştiren her şey **teklif** olur ve mevcut onay zincirinden
   geçer.
4. **Model yoksa sistem çalışır.** Atama yapılmamışsa ya da bütçe
   bittiyse bu **açıkça** söylenir ve komutlar sunulmaya devam eder.
   «Yapay zekâ yok» ile «sistem bozuk» ayrı şeylerdir — ekranda da ayrı
   yazılır, eksik olan şey ile yapılacak iş aynı cümlede durur.

Her görevli **yalnız kendi alanına** bakar: `vp_bio` SPİ'yi, `vp_academic`
AYS'yi, `vp_intellect` ESP'yi görür; bağlamı da o kadardır. King hepsini
görür — modüller arası ilişkiyi ancak böyle kurar.

**Kayıt sorumluluğu tek yerdedir** (`core/sohbet.py`). Bir süre hem uç
nokta hem `patron.respond` yazıyordu ve aynı cümle akışta iki kez
görünüyordu. `conversations.agent` sütunu kimin konuştuğunu tutar; sütun
eklenmeden önceki satırlar King'in akışı sayılır.

### `core/ai.py` — tek kapı

Hiçbir modül bir sağlayıcıya doğrudan istek atamaz. Bütün çağrılar buradan
geçer; çünkü bir çağrının yanında her zaman dört şey olmalı: **bütçe**
(para harcamadan önce sınır sorulur), **defter** (harcanan yazılır —
başarısız çağrı da), **sınır** (cevap kural motorunun yerine geçemez) ve
**kaynak** (hangi veriye dayandığı söylenebilir olmalı). Bu dördü ayrı ayrı
yazılsaydı, biri bir gün unutulurdu.

Yedi kural: kural motoru otoritedir · model **ölçüm** uyduramaz ·
buyurgan kip düşürülür · bütçe önce sorulur · her çağrı deftere yazılır ·
model modeli çağırmaz · atanmamış kademe çağrı yapmaz.

### Sayı söylemek ile ölçüm uydurmak ayrı şeylerdir

Bir süre **her sayı** şüphe sayılıyordu: cevapta geçip bağlamda geçmeyen
bir sayı varsa cevabın tamamı düşüyordu. Sonuç şuydu — «Bugün 45 dakikalık
bir blok deneyebilirsin» ya da «Saat 22:00'den sonra ekranı azaltmayı
önerebilirim» gibi **tamamen doğru** cevaplar düşürülüyor, kullanıcı
sohbet edemiyor ve sorusunun yerine günün brifingini alıyordu. Kural,
korumak istediği şeyin kendisini bozuyordu.

Orada uydurulmuş bir ölçüm yok, **önerilen** bir süre var: bir öneri,
geçmiş hakkında hiçbir şey iddia etmez. Şimdi üç koşul birden aranır:

1. Sayı bağlamda **geçmiyor** (kural motoru böyle bir şey üretmedi),
2. Sayının bulunduğu parçada bir **ölçüm adı** geçiyor (uyku, soru, net,
   kalıcılık… — sistemin gerçekten ölçtüğü şeylerin adları),
3. O parça **öneri kipinde değil** («önerebilirim», «istersen»,
   «-ebilir», «yarın»…).

Öneri kipi **ileri doğru** işler: «İstersen yarın iki saatlik bir plan
kuralım, 3 blok halinde» cümlesinde «3 blok» birinci parçanın devamıdır.
Ama «Uyku ortalaman 7.83 saat, istersen artıralım» cümlesinde öneri
**sonra** gelir ve kendinden önceki iddiayı aklamaz.

Nokta ve virgül iki rakamın arasında bölmez: `7.83` bir sayıdır, iki parça
değil.

### Düşen cevap için bir kez düzeltme istenir

Kullanıcıya «cevap düşürüldü» deyip bırakmak, sohbeti her ihlalde kesmek
demekti; oysa ihlalin ne olduğunu **modele söylemek** çoğu zaman yeter.
Düşen bir cevabın ardından modele tam olarak neyi ihlal ettiği yazılır ve
bir kez daha sorulur. Sınır yumuşamaz: ikinci cevap da düşerse üçüncü
deneme **yoktur** — sınırsız deneme, sınırın kendisini kaldırmanın yavaş
biçimi olurdu. Her iki çağrı da deftere yazılır.

### Model konuşamazsa cevap yine sohbet biçimindedir

Önce kural motorunun **komut tahmini** dönüyordu: kullanıcı «uykum nasıl?»
diye soruyor, karşısına «Emin olamadım: durum mu demek istedin?»
çıkıyordu. Model konuşamadıysa söylenecek şey budur — sebep, ve çalışan
yolun adı. Gerçek bir komut yazılmışsa kural motorunun cevabı zaten doğru
cevaptır ve o döner.

**Düşürülen cevap yutulmaz:** kural motoru devreye girer ve sebebi ekranda
yazılır — hangi sayının dayanağı olmadığı, hangi buyurgan kelimenin
geçtiği. Bilinmeyen bir model için tarife bulunamazsa **0 yazılmaz**;
«bedava» demek olurdu, tahmini bir taban kullanılır.

### «API girdim ama çalışmıyor» — `POST /api/chat/tani`

Bu cümlenin tek cevabı, zinciri **gerçekten koşturup** hangi halkanın
koptuğunu göstermektir. Ayarlar → Yapay zekâ → **«Sohbeti dene»** sırayla
şunları işaretler ve her birine kendi cümlesini yazar:

| Adım | Ne söyler |
|---|---|
| Model ataması | Hangi sağlayıcı, hangi model, King'den miras mı |
| Model adı | Sağlayıcı seçilmiş ama ad yazılmamışsa burada durur |
| Anahtar | Hangi anahtar, kimin; silinmişse söyler |
| Bütçe | Sınır içinde mi; kur eksikse **hangi iki yolla** çözüleceği |
| Kural motoru bağlamı | Kaç satır ölçüme dayanıyor |
| Sağlayıcıya çağrı | **Sağlayıcının kendi cümlesi** — «HTTP 404» değil, «model not found: gemini-2.5-flush» |
| Cevabın denetimi | Sınırlardan geçti mi, geçmediyse hangi kural |

Geçen adımlar da yazılır: «nerede çalışıyor» bilgisi «nerede bozuk» kadar
iş görür. Gerçek bir çağrı yapar — çok az para harcar ve deftere yazılır;
sınamak, sınanmamış bir şeye «çalışıyor» demekten ucuzdur.

**Model adları listeden seçilir — ve liste sağlayıcıdan gelir.**

Elle yazılan bir ad tek harf yanlış olduğunda sağlayıcı 404 döner ve
kullanıcı «anahtar çalışmıyor» sanır; oysa anahtar doğrudur, ad yanlıştır.

Ama koda gömülü bir model listesi de **zamanla eskir** ve bunu kullanıcı
bir 404 ile öğrenir. Gerçekten yaşandı:

> `HTTP 404 — This model models/gemini-2.5-flash is no longer available to
> new users. Please update your code to use models/gemini-3.6-flash…`

Kullanıcının kendi yazdığı ad doğruydu, **bizim listemiz** eskiydi. Bu
yüzden sağlayıcı satırındaki **«Modelleri getir»** düğmesi listeyi
sağlayıcıya sorar (`POST /api/models`) ve dönen adlar gömülü listenin
**yerine geçer**. Gömülü liste artık bir sözleşme değil, hiçbir şey
sorulmamışken gösterilen bir başlangıçtır. «Sına» düğmesi de aynı ucu
çağırdığı için dönen listeyi zaten doldurur — onu atmak, kullanıcıyı adı
elle yazmaya bırakmak olurdu.

Google `models/gemini-3.6-flash` biçiminde döner; çağrıda kullanılan ad
önekin **sonrasıdır** ve bu ayıklama okuma tarafında yapılır.

**Tarifesi bilinmeyen model işaretlenir.** Yeni bir model için fiyat
tablomuzda karşılık yoksa harcama tahmini bir tabanla (1.00/5.00 USD ·
1M jeton) yazılır — «bedava» demek yanlış olurdu. Ama bu tahmin sessizce
ölçümün yerine geçmez: defterde `tahmini-fiyat` diye durur, sohbet
notunda ve «Sohbeti dene» çıktısında **söylenir**. Yüksek bir tahmin
tavanı erken doldurur ve kullanıcı sohbetin neden durduğunu anlamazdı.

Tanı çıktısında üçüncü bir hâl vardır: **⚠** — zincir çalışıyor ama
söylenecek bir şey var. Bunu «kopuk» diye göstermek çalışan bir şeye
bozuk demek, hiç göstermemek ise bilinmeyeni bilinir saymak olurdu.

## Gelen mesaj: iki kapı, tek işleme

Bir mesaj HKM'ye iki kapıdan gelebilir:

- **webhook** — sağlayıcı bize bağlanır (dışarı açık bir adres ister),
- **yoklama** — biz sağlayıcıya bağlanırız (`getUpdates`; hiçbir kapı
  açmaz, adres ve sertifika istemez).

İki kapı ama **tek işleme** (`core/gelen.py`): tanımayan gönderenin içeriği
ambara girmez, aynı mesaj iki kez işlenmez, cevap giden kutusundan geçer.
Kopyalanan bir mantık, bir gün yalnız bir kapıda düzeltilir ve ötekinde
bozuk kalır.

**Cevabı ekranla aynı katman üretir.** Telegram'dan gelen bir cümle ile HKM
ekranından yazılan aynı cümle, aynı yoldan geçer (`core/sohbet.py`): önce
komut, sonra model, sonra dürüst bir «yok». İki ayrı cevap üretici olsaydı,
aynı soruya iki farklı cevap veren bir sistem olurdu — ve hangisinin doğru
olduğu bilinemezdi. Yani Telegram'dan **doğal cümleyle** konuşulabilir ve
bunun için ayrı bir ayar yoktur: King'e atanan model neyse, Telegram da
onunla konuşur; model yoksa komutlar çalışmaya devam eder.

**Yoklama kuralları** (`core/yoklama.py`): varsayılan kapalı · webhook ile
aynı anda olmaz (Telegram reddeder; açarken webhook silinir ve **söylenir**)
· uzun bekleme (25 sn), kısa döngü değil · **imleç ambarda durur** —
bellekteki bir imleç tam da yeniden başlatma anında kaybolur ve aynı
mesajlar yeniden işlenirdi · hata döngüyü durdurmaz.

## Üç sistemde HKM şeridi

HKM ayarları üç uygulamanın da **ayar/rehber ekranının içinde** duruyordu:
günde bir bakılan bir yerde, gün boyu açık duran bir bağlantının durumu.
Bağlı mı değil mi, en son ne zaman gitti, gitmediyse neden — bunlar
**günlük ekranda tek satır** olmalı.

Her üç sistemde de (AYS, SPİ, ESP) `Bugün` ekranında küçük bir HKM şeridi
var. Şerit **bir ayar ekranı değildir**: yalnızca durumu söyler ve tek bir
iş yaptırır — «Şimdi gönder». Ayarın yeri yine kendi ekranıdır; iki yerde
iki ayar olsaydı biri ötekini sessizce yenerdi.

| Durum | Şeritte yazan |
|---|---|
| Kapalı | «bağlı değil» + HKM kapalıyken hiçbir şeyin eksilmediği |
| Açık, gitmiş | «son gönderim 14:32» |
| Açık, gitmemiş | «henüz gönderilmedi» |
| Son deneme başarısız | «son deneme 14:32 · başarısız» + sağlayıcının sebebi |

Başarısız son deneme **yutulmaz**: «gönderildi» ile «gönderilmeye
çalışıldı» ayrı şeylerdir. Ve şerit hiçbir durumda bağırmaz — HKM'nin
kapalı olması bir hata değil, bir seçimdir.

Şerit **tek yönlü bağımlılığı bozmaz**: üç sistem HKM'nin varlığını yine
bilmez, `beacon.js` bu kuralın tek istisnasıdır ve şerit de o modülün
okuduğu durumu gösterir. HKM kapalıyken şerit «bağlı değil» der ve
uygulamada başka hiçbir şey değişmez.

## Teklifler ekranı — HKM'nin sistemlere konuşma yolu

HKM üç sisteme doğrudan yazmaz ve yazamaz. **Teklifler** bölümünden
bırakılan şey bir niyettir: ilgili sistem açıldığında kullanıcıya
gösterilir ve onaylanırsa **o sistemin kendi kodu** uygular.

- Form alanları **sunucudan** gelir (`intents.KINDS` + `FIELD_RULES`):
  ekranın kendi listesi olsaydı, bir tür eklendiğinde iki yerde iki
  sözleşme olurdu.
- **Boş bırakılan cümle boş gitmez.** `intents.create()` türe ve gövdeye
  göre Türkçe bir cümle kurar — modülde boş bir teklif satırı, ne olduğunu
  söylemeyen bir düğmedir. Kullanıcının yazdığı cümle korunur; uydurulan
  yalnız boşluğun yerine geçer.
- «Geri al», teklifi **istenmedi** olarak kapatır; kayıt silinmez.
- Aynı modüle aynı tür ve aynı gövdeyle ikinci bir teklif yazılmaz.

**Modüller girişte sorar, sekmeye dönünce yeniden sorar.** Önce yalnız
açılışta soruluyordu: HKM bir teklif bıraktığında, sayfa açıkken
görmüyordun. Odaklanma bir kullanıcı eylemidir, çizim değil — bu istek
hiçbir çizimde atılmaz ve 30 saniyeden sık tekrarlanmaz.

**Bugün ekranından sistemler açılır.** Üç kartın her biri kendi sistemine
bağlantı taşır ve yanındaki nokta o kapının gerçekten cevap verdiğini
söyler.


## Telegram medya girişi

Telegram metin dışında fotoğraf, video, sesli mesaj, ses ve belge de kabul
eder. Bu içerikler doğrudan «analiz edildi» sayılmaz. İlk kapı yalnızca
Telegram'ın dosya kimliğini ve güvenli metaveriyi attachments kuyruğuna
yazar; durum received olur. Fotoğrafta Telegram'ın gönderdiği en büyük
sürüm seçilir.

Gönderen izin listesinde değilse dosya kimliği dahil hiçbir içerik ambara
girmez. file_id Telegram'dan dosya alma yetkisidir ve /api/attachments
çıktısında gösterilmez.

Dosya, kanal isteğini bekletmeden arka plan ritminde indirilir. Tür bazlı
boyut sınırı hem Telegram metaverisinden önce hem indirme sırasında uygulanır;
yarım dosya kalıcı ada taşınmaz. İçerik SHA-256 ile tekilleştirilir ve ham
dosya saklama süresi ayarlanabilir.

## Kullanıcı onaylı hafıza

Kalıcı hafıza yalnız açık bir `hatırla:` komutuyla veya yönetim API'siyle
yazılır. Model konuşmadan kendiliğinden hafıza oluşturamaz. `hafızam` etkin
kayıtları listeler, `#<kimlik> unut` kaydı geri çağrılmayacak duruma getirir.
Kayıtlar King, AYS, SPİ ve ESP kapsamlarıyla ayrılır; süresi dolan kayıt model
bağlamına girmez.
