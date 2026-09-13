# HKM — Hayat Kontrol Merkezi

> «Üçünü tek sesle özetlemek.»

LifeOS'un dördüncü katmanı. AYS, SPİ ve ESP kendi alanlarında egemen, sıfır
bağımlılıklı, tarayıcıda koşan üç ayrı sistemdir. HKM onların **üstünde
değil, yanında** duran isteğe bağlı bir servistir.

**Bu klasör hâlâ bir İSKELETTİR ama artık kapalı bir döngüsü var.**
Faz 1–3 (çekirdek şema, sync, VP konseyi, öncelik sırası, dijital ikiz,
Yönetici, öneri yaşam döngüsü) ve Faz 6 (üç arayüzden best-effort işaret)
yazıldı; **73/73 HKM testi** ve depo kökündeki `tools/entegre.js`
bütünleşme denetimi geçiyor. Faz 4–5 (Telegram, WhatsApp, ses) yazılmadı.

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

```bash
cd HKM
cp config.example.json config.json    # local_token'ı uzun rastgele bir dizeyle değiştir
python3 daemon.py                     # http://127.0.0.1:4200
python3 -m tests.run                  # 36 test: VP, sync, şema, öncelik
```

Uç noktalar:

| Yol | Ne yapar |
|---|---|
| `GET /api/health` | token istemez, yalnızca «ayakta mı» der |
| `POST /api/sync/<modul>` | etiketli metrikleri yutar — `202` ya da `422` |
| `GET /api/briefing?date=` | günün brifingi: VP raporları, dayanak ve **tek** öneri |
| `GET /api/twin?date=&days=` | dijital ikiz — son N günün tek resmi |
| `GET /api/decisions?date=` | günün bütün önerileri, reddedilenler dahil |
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

Giden şey günün ÖZETİDİR: AYS'den beş sayı, SPİ ve ESP'den dörder sayı.
Soru metni, tahlil değeri, ilaç adı, kart metni, not içeriği gitmez.

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

## 9. Fazlar

| Faz | İçerik | Durum |
|---|---|---|
| 1 | Çekirdek daemon, SQLite şeması, bearer'lı sync | **yazıldı** |
| 2 | Başkan Yardımcıları (VP) + öncelik sırası | **yazıldı** |
| 3 | Dijital İkiz, Yönetici, öneri yaşam döngüsü | **yazıldı, 70 test** |
| 4 | Telegram ağ geçidi | yapılacak |
| 5 | WhatsApp & ses | yapılacak |
| 6 | Üç arayüzden best-effort işaret | **yazıldı** |

## 10. Ve dürüst bir soru

Devir notu §18.8'deki soru duruyor ve cevaplanmadı:

> HKM'nin gerçek faydası tek cümle: «üçünü tek sesle özetlemek.» O fayda
> için bir daemon, SQLite, iki bot ve bir VP konseyi gerekiyor mu — yoksa
> SPİ'nin ofisine üç satırlık bir çapraz bulgu mu yeter?

Bu iskelet o soruyu kapatmıyor; yalnızca cevabın «gerekiyor» olması hâlinde
temelin hazır olmasını sağlıyor. Karar kullanıcınındır.
