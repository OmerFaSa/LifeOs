# HKM — Hayat Kontrol Merkezi

> «Üçünü tek sesle özetlemek.»

LifeOS'un dördüncü katmanı. AYS, SPİ ve ESP kendi alanlarında egemen, sıfır
bağımlılıklı, tarayıcıda koşan üç ayrı sistemdir. HKM onların **üstünde
değil, yanında** duran isteğe bağlı bir servistir.

**Bu klasör şu an bir İSKELETTİR.** Faz 1–2 (çekirdek şema, sync, VP
konseyi, öncelik sırası) yazıldı ve **36/36 testi geçiyor**; Faz 3–6
(Yönetici, Telegram, WhatsApp, ses, tam döngü) yazılmadı. Şu anki odak
ESP'dir; HKM sonra.

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
| `GET /api/briefing?date=` | günün VP raporu ve **tek** önerisi |

Daemon `ThreadingHTTPServer`'dır ve SQLite bağlantısı **iş parçacığına
bağlıdır**: paylaşılan tek bağlantı ilk eş zamanlı istekte `SQLite objects
created in a thread…` ile patlıyordu.

## 9. Fazlar

| Faz | İçerik | Durum |
|---|---|---|
| 1 | Çekirdek daemon, SQLite şeması, bearer'lı sync | **yazıldı, 36 test** |
| 2 | Başkan Yardımcıları (VP) + öncelik sırası | **yazıldı, 36 test** |
| 3 | Dijital İkiz & sentez (Yönetici) | yapılacak |
| 4 | Telegram ağ geçidi | yapılacak |
| 5 | WhatsApp & ses | yapılacak |
| 6 | Üç arayüze best-effort beacon | yapılacak |

## 10. Ve dürüst bir soru

Devir notu §18.8'deki soru duruyor ve cevaplanmadı:

> HKM'nin gerçek faydası tek cümle: «üçünü tek sesle özetlemek.» O fayda
> için bir daemon, SQLite, iki bot ve bir VP konseyi gerekiyor mu — yoksa
> SPİ'nin ofisine üç satırlık bir çapraz bulgu mu yeter?

Bu iskelet o soruyu kapatmıyor; yalnızca cevabın «gerekiyor» olması hâlinde
temelin hazır olmasını sağlıyor. Karar kullanıcınındır.
