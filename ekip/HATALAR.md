# LifeOS — hata ve risk raporu

| | |
|---|---|
| Sürüm | 2 (ilk sürüm aynı gün, `8521a85`) |
| Taban | `main` `65a7d16` |
| Tarih | 2026-09-24 |
| Kapsam | AYS, SPİ, ESP, HKM, `brand/ortak`, `brand/seviye`, depo kökü araçları |
| Kod değişikliği | **yok**. Bu belge bir bulgu raporudur. |
| Eşlik eden belge | [`OZELLIK-ANALIZI.md`](OZELLIK-ANALIZI.md) — düzeltilmesi ve eklenmesi gereken özellikler |

---

## 0. Yönetici özeti

Depo kendi ölçütleriyle temiz: birleştirilmiş taban üzerinde **4 936 birim
testinin hepsi** geçiyor (AYS 1676, SPİ 1324, ESP 1351, HKM 585). Duman,
erişilebilirlik, 390 px düzen, palet, dokuz aylık başarım, beş yıllık yük,
tek kaynak denetimleri ve uçtan uca bütünleşme yeşil. Üç arayüzde her
ekranın her düğmesine basıldı (1 156 tıklama); tek bir sayfa hatası ya da
ekrana sızan `undefined`/`NaN` çıkmadı.

Buna rağmen **44 bulgu** var: 1 kritik, 9 yüksek, 10 orta, 19 düşük, 4
belge kayması, 1 koşullu. Hiçbirini mevcut denetimler yakalamıyor, çünkü
hataların neredeyse hepsi **birimlerin arasında** ya da **zamanın
sınırlarında** duruyor. Her birim kendi sözleşmesini tutuyor; sorun iki
birimin birleştiği yerde çıkıyor.

**Beş tema:**

1. **Anlama katmanı sahte ölçüm üretiyor.** Olumsuz cümle («7 saat
   uyumadım») varsayılan ayarla, sormadan ölçüm olarak yazılıyor. SPİ'de
   bu cümle 420 dakikalık antrenman oluyor (KR-1). Telegram'da bir soruya
   verilen sayı ücretli bir teklifi onaylayabiliyor (Y-9). Doktrinin §1.7
   kuralı HKM'de uygulanmış, modüllerde uygulanmamış.
2. **Türetilmiş katmanlar günü yanlış sayıyor.** İşaret gün içinde birçok
   kez gönderiyor; etki ölçümü ve ikiz bunları ayrı ölçüm sayıyor (Y-3,
   O-1). Seri tespiti tek günü «seri» diye raporluyor (O-2). Gün ortasındaki
   kısmi değer günlük tabana göre yargılanıyor (O-9).
3. **Kimlik ve sözleşme sınırları dağınık.** HKM profil bilmiyor (Y-7,
   O-6). Onay kartı açılan akışların yalnız birini anlatıyor (Y-8). Niyet
   kataloğu dört yerde yazılı (D-12).
4. **Veri güvenliği yollarında sessiz kayıp.** HKM geri yüklemesi ambarı
   boşaltıp «ok» diyor (Y-1). «Geri al» sonraki kayıtları siliyor (Y-6).
   İçe aktarmanın geri alma kopyası yanlış duruma dönebiliyor (O-3).
5. **Zaman sınırları.** Dokuz aylık ufkun sonu olan sınav gününden sonra
   HKM her gün «Sınava −N gün kaldı» diyor ve öteki öneriler susuyor
   (Y-2). Geçmiş gönderimi ESP'de hiç çalışmıyor (Y-5). SPİ geçmiş günlerin
   toparlanma puanını bugünün tabanıyla hesaplıyor (O-4). `.ics` UTC saatleri
   gün kaydırıyor (O-10).

**İlk yapılacaklar** (ayrıntı §9): KR-1, Y-1, Y-9, Y-6, Y-2. İlk üçü veri
doğruluğunu ya da parayı doğrudan etkiliyor; Y-2 dokuz aylık ufkun sonunda
kesin olarak tetiklenecek.

---

## 1. Kapsam ve yöntem

| Adım | Ne yapıldı | Sonuç |
|---|---|---|
| Denetimler | Üç sistemde `runtests`, `smoke`, `a11ycheck`, `layoutcheck`, `palettecheck`, `perfcheck`, SPİ'ye özel üç denetim; `seviye.py`, `ortak.py`, `marka.py` denetimleri; HKM `tests.run`, `perf.py`, `yuz.js`; `tools/entegre.js`; `tools/kapsam.js` | hepsi yeşil |
| Statik analiz | Üç arayüzde eslint (tanımsız ad, yinelenen anahtar, sabit koşul, erişilemeyen kod…), HKM'de ruff | yinelenen anahtarlar ve etkisiz bir atama (D-9, D-10); gerisi yanlış alarm |
| HKM canlı deneme | Daemon geçici ambarla ayağa kaldırıldı; 72 yola (64 sabit + 8 önekli) bozuk gövde, bozuk tarih, uç değer; jetonsuz ve yanlış jetonlu istek | 102 kopuş (O-7) ve anlamsal bulgular |
| Tarayıcı taraması | Üç arayüzde her ekranın her `data-act` düğmesi ve açılan alt sayfalar; boş ve 120 günlük tohumlu profil | 1 156 tıklama, 0 hata |
| Uçtan uca senaryolar | Gerçek sayfada ayrıştırıcılar, öneri kutusu, geri alma, saat değiştirme, depo boyutu | KR-1, Y-2, Y-6, D-17 |
| Kod okuma | Sayı üreten ve veri taşıyan katmanlar (ayrıntı §11, §12) | çoğu bulgu |

Denetimlerin tam koşumu ve tıklama taraması bir önceki tabanda (`3e56b56`)
yapıldı. Arada gelen iki commit (`ab0b314`, `65a7d16`) ESP ve SPİ'ye
dokunduğu için birim testleri ve her bulgunun satır numarası `65a7d16`
üzerinde yeniden denetlendi.

**Doğrulama düzeyleri** (her bulguda yazılıdır):

- **tarayıcı** — gerçek uygulamada, gerçek tarayıcıda koşturuldu.
- **canlı** — HKM daemon'una gerçek HTTP isteği atıldı.
- **Python** — HKM işlevi geçici bir ambarla doğrudan çağrıldı.
- **okuma** — kod yolu satır satır izlendi, koşturulmadı.
- **platform** — tarayıcı davranışına dair bilgiye dayanıyor, bu ortamda
  denenemedi.

Bütün denemeler depo dışında, geçici veritabanında ve geçici tarayıcı
profilinde yapıldı. Kullanılan betikler depoya eklenmedi; tekrar adımları
her bulgunun içinde yazılı.

## 2. Ölçekler

**Önem**

| Düzey | Tanım |
|---|---|
| Kritik | Varsayılan ayarla, olağan kullanımda veri doğruluğunu bozar ve kullanıcı fark etmeyebilir |
| Yüksek | Veri kaybı, yanlış karar önerisi, para harcanması, mahremiyet sözünün çiğnenmesi ya da bir özelliğin tamamen çalışmaması |
| Orta | Yanlış ya da yanıltıcı sayı, belirli koşulda kayıp, sağlamlık açığı |
| Düşük | Sınırlı etki, kenar durumu, tutarsızlık |
| Belge | Elle yazılmış sayı ya da iddianın koddan ayrışması |
| Koşullu | Bugünkü kurulumda tetiklenmiyor, belgelenmiş başka bir kurulumda tetiklenir |

**Olasılık**

| Düzey | Tanım |
|---|---|
| Kesin | Belli bir tarihte ya da her açılışta mutlaka |
| Her gün | Olağan günlük kullanımda |
| Olağan | Olağan kullanımda ara sıra |
| Koşullu | Belli bir kurulum ya da kullanım biçimi gerekir |
| Nadir | Olağan dışı bir girdi gerekir |

## 3. Risk matrisi

| Olasılık ↓ · Önem → | Kritik | Yüksek | Orta | Düşük |
|---|---|---|---|---|
| **Kesin** | | Y-2, Y-8 | | D-14 |
| **Her gün** | KR-1 | Y-3 | O-1, O-4, O-5, O-9 | D-17 |
| **Olağan** | | Y-4, Y-5, Y-6 | O-2 | D-6, D-8, D-12, D-15, D-16 |
| **Koşullu** | | Y-7, Y-9 | O-6, O-8, O-10 | D-4, D-13, D-18, D-19 |
| **Nadir** | | Y-1 | O-3, O-7 | D-1, D-2, D-3, D-5, D-7, D-9, D-10, D-11 |

## 4. İlk sürümle eşleme

| v2 | v1 | | v2 | v1 | | v2 | v1 |
|---|---|---|---|---|---|---|---|
| KR-1 | yeni | | O-1 | O1 | | D-1…D-14 | D1…D14 |
| Y-1 | Y1 | | O-2 | O2 | | D-15 | yeni |
| Y-2 | Y2 | | O-3 | O3 | | D-16 | yeni |
| Y-3 | Y3 | | O-4 | O5 | | D-17 | O4 (önemi düşürüldü: ölçüldü, kota %17) |
| Y-4 | Y4 | | O-5 | O6 | | D-18 | yeni |
| Y-5 | Y5 | | O-6 | O7 | | D-19 | yeni |
| Y-6 | Y6 (genişledi) | | O-7 | O8 | | B-1…B-4 | B1…B4 |
| Y-7 | Y7 (genişledi) | | O-8 | yeni | | KO-1 | K1 |
| Y-8 | Y8 | | O-9 | yeni | | | |
| Y-9 | yeni | | O-10 | yeni | | | |

---

## 5. Bulgular

### Kritik

#### KR-1 · Olumsuz cümle, sormadan ölçüm olarak yazılıyor

| Önem | Olasılık | Sistem | Doğrulama | Doktrin |
|---|---|---|---|---|
| Kritik | Her gün | AYS, SPİ, ESP | tarayıcı, uçtan uca | §1.1, §1.7, §1.9 |

**Ne yanlış.** Üç modülün cümle ayrıştırıcısı olumsuzluğu, gelecek
zamanı ve istek kipini tanımıyor. Sayıyı ve anahtar kelimeyi bulup eylem
kuruyor. Varsayılan `otomatikUygula:'istek'` ayarı, kullanıcının kendi
cümlesinden gelen **küçük** eylemi sormadan uyguluyor. Küçük eylemlerin
çoğu ölçüm yazıyor.

**Konum.**
- `AYS/src/js/core/komut.js:282` (`anla`), `AYS/src/js/core/proposals.js:752-765`
  (`otomatikMi`, `ayar`), `AYS/src/js/core/office.js:61` (varsayılan)
- `SPI/src/js/core/quickentry.js:179` (`parse`),
  `SPI/src/js/core/proposals.js:368-388` (`quickToAction`, `fromText`),
  `:517-528`, `SPI/src/js/core/office.js:31`
- `ESP/src/js/core/komut.js:99` (`anla`)
- Karşılaştırma: `HKM/core/dil.py:179` `olumsuz()` aynı cümleleri doğru
  reddediyor; modüller bunu kullanmıyor.

**Tekrar (tarayıcı, varsayılan ayarlar, boş profil).**

| Modül | Cümle | Sonuç |
|---|---|---|
| AYS | «bugün 40 soru çözmedim» | `freeQ` 0 → **40**, sormadan |
| AYS | «7 saat uyumadım» | `sleepHours` boş → **7**, sormadan |
| AYS | «40 soru çözemedim» | `soru-yaz 40` |
| AYS | «bu hafta ara vermek istemiyorum» | bu hafta **ara ver** önerisi |
| AYS | «günde 4 saat çalışmak istemiyorum» | günlük süre **240 dk** önerisi |
| SPİ | «7 saat uyumadım» | **420 dk serbest antrenman**, sormadan |
| SPİ | «30 dakika yürümedim» | 30 dk yürüyüş, sormadan |
| SPİ | «2 bardak su içmedim» | su **400 ml**, sormadan |
| ESP | «diksiyonu kapatma» | diksiyon bölümünü **kapat** önerisi |
| ESP | «diksiyon istemiyorum demedim» | kapat önerisi |

AYS: `R.Komut.isle(R.Komut.anla(c, {date}), {metin:c})`; SPİ:
`SP.Proposals.talep({action, agent:'patron', source:'istek', params})` her
`SP.Proposals.fromText(c).oneriler` için; ESP: `ESP.Komut.anla(c)`.

**Etki.** Uydurulmuş ölçüm deftere «ölçüldü» diye giriyor. Oradan XP'ye,
rozete, Goodhart ve sürtünme ölçerlerine, haftalık gerçekleşmeye ve
işaretle HKM'ye (VP'ler, kırmızı bayrak, seri, etki) yayılıyor. SPİ'deki
420 dakikalık sahte seans antrenman yükünü ve toparlanma reçetesini
etkiliyor. Kullanıcı sesle yazdığı için (DEVIR §1) olumsuz ekler günlük
kullanımda sık geçiyor. Ekranda «Geri al» kalıyor, ama kullanıcının fark
etmesi gerekiyor. Y-6 yüzünden geri alma da güvenli değil.

**Düzeltme yönü.** `OZELLIK-ANALIZI.md` A1 (ortak olumsuzluk ve kip
süzgeci), A2 (ölçüm yazan eylem hiçbir ayarda sormadan uygulanmaz), B2
(ayrıştırıcı kalite ölçümü).

---

### Yüksek

#### Y-1 · HKM geri yüklemesi, bozuk ya da eski şemalı yedekle ambarı boşaltıp «ok» diyor

| Önem | Olasılık | Sistem | Doğrulama | Doktrin |
|---|---|---|---|---|
| Yüksek | Nadir | HKM | canlı | §1.7 |

**Ne yanlış.** `HKM/core/db.py:1065` yazılacak sütunları yalnız **ilk
satırın** anahtarlarından seçiyor. Eşleşen sütun yoksa tabloyu sessizce
atlıyor. `replace:true` ise tablolar önceden silinmiş oluyor. Manifesto
denetimi yalnız satır *sayısına* baktığı için geçiyor. Aynı yol, ilk satırda
olmayan sütunları sonraki satırlardan da sessizce düşürüyor.

**Tekrar (canlı).** Bir olay yaz; sonra
`POST /api/restore {"backup":{"__meta":{"app":"hkm","schema":1,"tables":{"raw_events":1}},"raw_events":[["x"]]},"replace":true}`.
Cevap `200 {"ok":true,"written":{}}`, `raw_events` boş.

**Etki.** Sütunları yeniden adlandırılmış eski bir yedek ya da elle
düzenlenmiş bir dosya ambarı boşaltıyor, yüz «başarılı» diyor. Üstüne
yazmadan önce `hkm-oncesi-*.db` kopyası alındığı için veri elle
kurtarılabiliyor, ama kullanıcı kurtarılması gerektiğini bilmiyor.

**Düzeltme yönü.** `OZELLIK-ANALIZI.md` A11 (kuru çalıştırma; yazılacak
satır beyanla tutmazsa 409).

#### Y-2 · Sınav tarihi geçince HKM her gün «Sınava −N gün kaldı» diyor ve öteki önerileri susturuyor

| Önem | Olasılık | Sistem | Doğrulama | Doktrin |
|---|---|---|---|---|
| Yüksek | Kesin (sınav gününden sonra) | HKM, AYS | Python + tarayıcı | §1.1 |

**Ne yanlış.** `HKM/core/precedence.py:55` `days <= DEADLINE_NEAR_DAYS`
negatif sayıları da yakalıyor. `AYS/src/js/core/beacon.js:203`
`exam_days_left`'i sınavdan sonra negatif gönderiyor ve HKM aralığı
(−3650…3650) bunu kabul ediyor. AYS'nin kendi başlığı da negatif sayıyı
yazıyor (`AYS/src/js/app.js:200, 217`).

**Tekrar.** (Python) `precedence.resolve(payloads={'ays':{'exam_days_left':{'value':-30,'cert':'computed'}}})`
→ «Sınava −30 gün kaldı. Bugünün merkezine AYS'yi almanı öneririm.»
(Tarayıcı) Saat 2027-07-01'e alındı: AYS başlığı «−12 gün · TYT (TAHMİNİ)»,
`R.Beacon.collect().exam_days_left` → `{"value":-12,"cert":"computed"}`.

**Etki.** Varsayılan TYT tarihi 2027-06-19, yani dokuz aylık ufkun sonu.
O günden sonra sıra 2 her gün kazanıyor. 3–5. sıralar (AYS tabanı, ESP
temeli, ESP yeni içerik) **kalıcı olarak** hiç önerilmiyor ve bunu hiçbir
şey söylemiyor (bkz. B4 öneri açlığı). Sınav gününde «Sınava 0 gün kaldı»
çıkıyor.

**Düzeltme yönü.** `OZELLIK-ANALIZI.md` A3 (sınav sonrası durumu), B4.

#### Y-3 · Etki ölçümü aynı günün her gönderimini ayrı ölçüm sayıyor

| Önem | Olasılık | Sistem | Doğrulama | Doktrin |
|---|---|---|---|---|
| Yüksek | Her gün (ilk 20 kararda) | HKM | Python | §1.2 |

**Ne yanlış.** `HKM/core/impact.py:79-96` önbelleksiz `_seri` her ham olayı
ayrı değer olarak ekliyor; önbellekli yol (`build_cache`) günün **son**
değerini alıyor. Önbellek yalnız 20'den fazla karar varken kullanılıyor
(`impact.py:173`), yani yanlış yol tam da ilk haftalarda çalışıyor.

**Tekrar (Python).** Karardan önceki bir günde 3 gönderim (20, 40, 90),
sonraki bir günde 3 gönderim (10, 30, 60). `impact.one(con, k)` →
`worsened (3/3)`; `impact.one(con, k, impact.build_cache(con))` → `missing (1)`.

**Etki.** İşaret varsayılan olarak saatte bir gönderiyor (`intervalMinutes:60`).
Gün içi **birikimli ara değerler** ölçüm sayılıyor ve «en az 3 ölçüm» şartı
tek günle karşılanıyor. Kullanıcıya «kabul ettiğin önerinin ardından ölçü
aşağı gitti» deniyor. HKM'nin kendi faydasını ölçtüğü tek katman bu.

**Düzeltme yönü.** `OZELLIK-ANALIZI.md` A7 (gün çözünürlüğünde tek yardımcı).

#### Y-4 · Tek bir «ağrı/enerji» girdisi, HKM'nin en üst sıradaki kırmızı bayrağını tetikliyor

| Önem | Olasılık | Sistem | Doğrulama | Doktrin |
|---|---|---|---|---|
| Yüksek | Olağan | SPİ, HKM | okuma | §1.1, §1.5 |

**Ne yanlış.** `SPI/src/js/core/beacon.js:173` `recovery`'yi `r.ok` ise
`computed` olarak gönderiyor. `readiness().thin`
(`SPI/src/js/core/move.js:129`, ağırlığın yarısından azı ölçülmüş) hiç
okunmuyor. SPİ kendi içinde ince ölçüme yük *artırma* yetkisi vermiyor;
HKM'ye ise tam ölçüm gibi gidiyor.

**Tekrar (okuma).** O gün yalnız «ağrı/enerji = 2» girilmiş (ağırlık %15).
`sorenessScore(2)` = 25 (`move.js:66-70`); ağırlık kalanlara dağıtılınca
puan 25 çıkıyor (`:97-99`). HKM `vp_bio` `recovery_floor` (40) altını
`danger` sayıyor; `precedence.py` sıra 1 doğuyor: «Fiziksel sermaye çöküş
eşiğinde. Bugünkü ağır yükün yarına ertelenmesini öneririm…».
`manager.py` `bio_red`'i «bir daha sorma» susturmasından muaf tuttuğu için
bu öneri susturulamıyor.

**Etki.** Kaynağı ince bir öznel girdi olan bir «çöküş» uyarısı, diğer
bütün önerileri o gün için bastırıyor.

**Düzeltme yönü.** İnce ölçüm HKM'ye `estimated` ya da `missing` olarak
gitmeli; `OZELLIK-ANALIZI.md` A10'daki «bugünden türeyen alan» kuralıyla
birlikte ele alınabilir.

#### Y-5 · ESP'nin «Geçmişi gönder»i ilk günde 422 alıp hiçbir gün göndermeden duruyor

| Önem | Olasılık | Sistem | Doğrulama | Doktrin |
|---|---|---|---|---|
| Yüksek | Olağan (geçmiş gönderimi kullanılırsa neredeyse kesin) | ESP, HKM | Python + okuma | §1.2 |

**Ne yanlış.** `ESP/src/js/core/beacon.js:180-196` `synthesis_gap_days`'i
geçmiş bir gün için de **bugünkü** not bağlantı durumundan hesaplıyor. Aynı
dosya retansiyonu geçmiş günde doğru olarak «veri yok»a çekiyor
(`:168-171`), bu alanı çekmiyor. O günden **sonra** yazılmış bağlanmamış
notların yaşı negatif çıkıyor ve `Math.max` negatif kalıyor. HKM bu alanı
0–3650 aralığında denetleyip gövdeyi 422 ile reddediyor.
`ESP/src/js/core/beacon.js:440` gönderimi en eski günden başlatıyor ve ilk
202 olmayan cevapta `break` ile tamamen duruyor.

**Tekrar.** (Python) `sync_engine.validate({... 'synthesis_gap_days':{'value':-12,'cert':'computed'}})`
→ `-12 degeri 0–3650 araliginin disinda`. (Okuma) Pratik kaydı olan ve
bugün bağlanmamış duran notların hepsinden eski ilk gün 422 alıyor.

**Etki.** Pratiğe notlardan önce başlamış hemen her kullanıcıda geçmiş
gönderimi «0 gün» gönderiyor ve ekranda yalnız «Geçmiş gönderimi 422 ile
durdu» yazıyor. Bağlantı durumu bugünün durumu olduğu için geçmiş günün
sentez açığı her durumda yanlış.

**Düzeltme yönü.** `OZELLIK-ANALIZI.md` A10.

#### Y-6 · «Geri al» sonraki kayıtları siliyor, geri alınmış kaydı diriltiyor, bloğu «tamamlandı» bırakıyor

| Önem | Olasılık | Sistem | Doğrulama | Doktrin |
|---|---|---|---|---|
| Yüksek | Olağan | AYS, SPİ | tarayıcı | §1.9 |

**Ne yanlış.** Bütün küçük eylemlerde `revert` eski değeri **mutlak**
yazıyor ve `undo(id)` sırayı denetlemiyor. Toplamaya dayalı eylemlerde
(`soru-yaz`, `paragraf-yaz`, `problem-yaz`, `sure-yaz`) `apply` değeri
**eklediği** için bu, sonraki kayıtları siliyor; değeri doğrudan yazan
eylemlerde (`uyku-yaz`, SPİ `vital-yaz`) sonraki değeri eskisiyle eziyor.
`revert`, `apply`'ın `pending → done` yaptığı blok durumunu da geri
çevirmiyor.

**Konum.** `AYS/src/js/core/proposals.js:500` (`soru-yaz`), `:526`
(`paragraf-yaz`), `:552` (`problem-yaz`), `:579` (`uyku-yaz`), `:614`
(`sure-yaz`), `:838` (`undo`); `SPI/src/js/core/proposals.js:85-99`
(`vital-yaz`).

**Tekrar (tarayıcı).**
`R.Proposals.hemen({action:'soru-yaz',params:{date:bugün,count:40}})`,
sonra `count:20` → `freeQ` 60. İlkini `undo` → **0** (20 olmalı).
İkincisini `undo` → **40** (0 olmalı; geri alınmış kayıt dirildi).

**Etki.** Aynı gün iki kayıt olağan (ör. sabah ve akşam «soru …»). Aradaki
elle düzenlemeler de eziliyor. SPİ'de «uyku 7» sonra «uyku 7,5» girilip
ilki geri alınınca uyku boşalıyor. Geri alınan blok `actualQ`/`actualMin`
boş hâlde «tamamlandı» sayıldığı için plan tamamlama yüzdesi şişiyor.
KR-1'in tek güvencesi «Geri al» olduğu için bu hata onu da zayıflatıyor.

**Düzeltme yönü.** `OZELLIK-ANALIZI.md` A4.

#### Y-7 · HKM profil bilmiyor: iki profilin ölçümleri, hafızası, hedefleri ve yedeği karışıyor

| Önem | Olasılık | Sistem | Doğrulama | Doktrin |
|---|---|---|---|---|
| Yüksek | Koşullu (iki profil HKM'ye bağlı) | HKM, SPİ, AYS, ESP | okuma | §1.2, §1.4 |

**Ne yanlış.** İşaret ayarı (`hkm` anahtarı) profil başına duruyor
(`SPI/src/js/core/store.js:262`, `LOCAL_KEY` profil başına). HKM'nin sync,
hafıza, hedef ve yedek uçları ise yalnız modül adıyla anahtarlanıyor. Gövde
profil taşımıyor; `sync_engine.py`'deki `profile` alanı hiçbir yerde
okunmuyor.

**Tekrar (okuma).** SPİ hanesinde iki profil ayrı ayrı HKM'ye bağlanır:
- İki kişinin uyku ve HRV'si aynı `spi` serisine yazılıyor. Günün «son
  gövdesi» kazanıyor; VP'ler ve kırmızı bayrak başka birinin verisiyle
  çalışabiliyor.
- `HKM/core/memory.py:207-211` profil her değiştiğinde öteki profilin
  hafızasını `forgotten` yapıyor ve kural gereği bir daha diriltmiyor
  (`:164-165`). Başka bir hane üyesinin cümlesi «ben»in hafızası olarak
  King'e gidiyor.
- `HKM/core/hedefag.py` `esitle` de modül başına: iki profilin hedefleri
  birbirini eziyor.
- `HKM/core/yedek.py:120` yedeği `<modül>/<tarih>.json`'a yazıyor. Aynı gün
  açılan ikinci profil birincinin yedeğini eziyor; HKM'deki otomatik yedek
  her gün yalnız son açılan profili koruyor.

**Düzeltme yönü.** `OZELLIK-ANALIZI.md` A6 (dokuz ay için en küçük yol: tek
profilden bağlanmaya izin vermek).

#### Y-8 · HKM onay kartı, aynı anahtarın tam veri yedeğini de açtığını söylemiyor

| Önem | Olasılık | Sistem | Doğrulama | Doktrin |
|---|---|---|---|---|
| Yüksek | Kesin (her açılışta) | AYS, SPİ, ESP | okuma | §1.4, §1.5, §1.7 |

**Ne yanlış.** `SPI/src/js/screens/guide.js:248` «SPİ, HKM'nin var olduğunu
bilmez. İşaret tek yönlüdür», `:293` «Tahlil değeri, ilaç adı, semptom ve
öğün GİTMEZ» diyor. Aynı cümle `AYS/src/js/screens/guide.js:491` ve
`ESP/src/js/screens/profile.js:254`'te de var. `brand/ortak/yedekag.js:57`
otomatik yedeği yalnız bu anahtara (`enabled` + jeton) bağlıyor. Açılınca
`Store.exportAll()` günde bir kez modülün **bütün verisiyle** (SPİ'de
tahlil, ilaç, semptom ve öğün dahil) `/api/yedek/<modül>`'e gidiyor
(`SPI/src/js/app.js:1386`, `AYS/src/js/app.js:1378`,
`ESP/src/js/app.js:1582`). Hafıza ve hedef anlık görüntüleri ve King iş
emirleri de aynı anahtarla gidiyor.

**Tekrar.** HKM açıkken SPİ'de işareti aç, ~8 sn bekle,
`HKM/db/yedek/spi/<tarih>.json` içinde `labs` ve `meds` alanlarına bak.

**Etki.** Kullanıcı karttaki metne güvenip anahtarı açıyor. HKM `https`
ile başka bir makinede duruyorsa (işaret buna izin veriyor) sağlık
verisinin tamamı cihazdan çıkıyor. Yerelde bile kartın sözü yanlış.

**Düzeltme yönü.** `OZELLIK-ANALIZI.md` A5.

#### Y-9 · Telegram'da bir soruya verilen sayı, açık bir King teklifini onaylayabiliyor

| Önem | Olasılık | Sistem | Doğrulama | Doktrin |
|---|---|---|---|---|
| Yüksek | Koşullu (aynı kanalda açık teklif + açık soru) | HKM | Python | §1.7, §1.9 |

**Ne yanlış.** `HKM/core/sohbet.py:373-381` teklif cevabını (0a), sistemin
sorduğu soruya verilen cevaptan (0c, `:410-419`) **önce** deniyor.
`HKM/core/king.py:801` `CEVAP` ifadesi `1|2|3|4` rakamlarını yakalıyor.
Eksik veri sorusu (`HKM/core/eksik.py:29-35`) ise «Dün uyku kaydı yok. Kaç
saat uyudun?» diye soruyor ve tek sayı bekliyor.

**Tekrar (Python).** `is_emirleri`'nde `durum='teklif'`, `kanal='telegram'`
bir satır (iki seçenek) ve `sorular`'da dünkü uyku sorusu varken
`sohbet.konus(..., "4", kanal="telegram", hedef=...)` →
«Bu teklifte o seçenek yok. «1» «2» ya da «iptal» yazabilirsin.»; uyku kaydı
teklifi açılmıyor (`intents` 0). «2» aynı yoldan `teklif_onayla`'ya gidiyor.

**Etki.** 4 saat uyuyan kullanıcının cevabı kayboluyor. Teklifte kaç
seçenek varsa (ör. «1» tam, «2» küçük) o rakamlardan biriyle verilen her
cevap teklifi onaylıyor: soruya düşük bir değer yazan kullanıcı ücretli bir
BAM işini niyeti olmadan açabiliyor.

**Düzeltme yönü.** `OZELLIK-ANALIZI.md` A9.

---

### Orta

#### O-1 · İkiz aynı günün gönderimlerini ayrı nokta sayıyor: %400 kapsama, sahte eğilim

| Önem | Olasılık | Sistem | Doğrulama |
|---|---|---|---|
| Orta | Her gün | HKM | Python |

`HKM/core/twin.py:105` · `snapshot` her olayı seriye ekliyor. `twin.series`
her günün son değerini alıyor ve kendi belgesinde «ikizin kuralı neyse
burada da odur» diyor; `snapshot` bu kurala uymuyor. **Tekrar:** aynı gün
4 gönderim (10, 30, 50, 90) + `twin.snapshot(con, gün, 1)` → `points 4`,
`coverage 4.0`, «Son 4 ölçümün ortancası, öncekilere göre %250 yukarıda».
**Etki:** «yön için en az dört ölçüm» tabanı tek günle karşılanıyor;
brifing, ikiz ekranı ve kapsama satırı yanıltıcı. **Yön:** A7.

#### O-2 · Tek günlük «seri» brifinge «bitti» diye düşüyor ve 45 gün kalıyor

| Önem | Olasılık | Sistem | Doğrulama |
|---|---|---|---|
| Orta | Olağan | HKM | Python |

`HKM/core/streak.py:111` · Boşluk seriyi kapatırken
`bitmis = bitmis or _paket(aktif…)` uzunluğa (`ASGARI = 3`) bakmıyor.
`bitmis or` ilk kapananı tutuyor, öteki dal en yeniyi. «Bitti» günü
ölçülmemiş bir gün oluyor; «atlanan» sayısı sondaki boşluk günlerini
sayıyor. **Tekrar:** 45 gün önce tek bir 5 saatlik gece, ardından 3
ölçümsüz gün, `streak._kural(KURALLAR[0], 7.0, değerler, günler)` → «uyku
tabanının altında 1 gün sürdü ve 2026-08-14 günü bitti — arada 2 gün
ölçülmedi». **Etki:** kural 1 («seri en az üç gündür») çiğneniyor; satır
brifinge düşüyor.

#### O-3 · İçe aktarmada geri alma kopyası yazılamazsa eski kopya kalıyor

| Önem | Olasılık | Sistem | Doğrulama |
|---|---|---|---|
| Orta | Nadir | AYS, SPİ, ESP | okuma |

`AYS/src/js/core/store.js:316-318` (SPİ `:317-319`, ESP `:318-320` aynı) ·
Kopya yazılamazsa (kota) `catch` boş kalıyor ve **önceki** içe aktarmanın
kopyası silinmiyor. **Sıra:** içe aktarma #1 (kopya = durum 0), haftalarca
kayıt, içe aktarma #2 kopya yazamıyor. Ekranda «Bu içe aktarmayı geri al»
(`AYS/src/js/screens/guide.js:335-340`) eski tarihle duruyor; basılınca
durum 0'a dönülüyor ve #1 ile #2 arasındaki bütün kayıt siliniyor. NOTLAR
§7.4 «anlık görüntü alınamıyorsa içe aktarmayı reddet» diyordu; kod tersini
yapıyor. Kopya süresiz duruyor. **Yön:** A12.

#### O-4 · SPİ toparlanma tabanı hep bugüne göre; geçmiş günlerin puanı yanlış

| Önem | Olasılık | Sistem | Doğrulama |
|---|---|---|---|
| Orta | Her gün | SPİ, HKM | okuma |

`SPI/src/js/core/move.js:21-32` · `baseline()` penceresini **bugüne** göre
kuruyor; `readiness(d)` geçmiş bir gün için de bugünün HRV ve nabız
tabanını kullanıyor. **Etki:** (a) geçmiş gönderimi (`beacon.js` backfill)
geçmiş günün `recovery`'sini o günden **sonraki** günlerin ve günün kendi
değerinin tabanıyla hesaplıyor; aynı dosyadaki `hrv_baseline` ise doğru
olarak `d`'ye göre. (b) Geçmiş günün ekrandaki puanı her gün değişiyor.
(c) `SPI/src/js/core/calc.js:295` toparlanma serisi ve `goodhart.js:104`
aynı hatayla hesaplanıyor.

#### O-5 · AYS'de «günün sorusu» dört ayrı tanımla sayılıyor

| Önem | Olasılık | Sistem | Doğrulama |
|---|---|---|---|
| Orta | Her gün | AYS | okuma |

`AYS/src/js/core/beacon.js:170-177` ve `goodhart.js:104-109` blok + serbest
+ paragraf + problem sayıyor. `xpsayim.js:32-34`, `basarimsayim.js:44-45`
ve `tools.js:139` blok + serbest sayıyor. `calc.js:122-136`
(`questionRealization`) **yalnız blok** sayıyor. **Örnek:** blokta 20,
«soru 40», 15 paragraf, 15 problem. HKM ve Goodhart 90 görüyor; XP, rozet
ve ajan aracı 60; haftalık gerçekleşme 20. `xpsayim.js`'in yorumu «goodhart
ile aynı okumadır» diyor, değil. `today.js:63` «burada görünmezse kayıt
kaybolmuş sanılır» diyor, ama serbest soru haftalık gerçekleşmede
kayboluyor.

#### O-6 · Hafıza eşitlemesi eksik kaydı kalıcı olarak «unutuldu» yapıyor

| Önem | Olasılık | Sistem | Doğrulama |
|---|---|---|---|
| Orta | Koşullu | HKM | okuma |

`HKM/core/memory.py:207-211` · Modülün anlık görüntüsünde olmayan kayıt
`forgotten` oluyor. Bu, kullanıcının «unut» sözüyle aynı durum ve bir daha
dirilmiyor (`:164-165`, `:202`). **Senaryo:** hafızası eksik eski bir yedek
içe aktarılıyor (işaret ayarı cihaza ait olduğu için korunuyor). Açılıştaki
eşitleme (`AYS/src/js/core/state.js:1253`) HKM'deki kayıtları unutturuyor;
yeni yedek geri yüklense de HKM'de dirilmiyorlar. **Yön:** A13.

#### O-7 · HKM uçları bozuk girdide cevap vermeden bağlantıyı koparıyor

| Önem | Olasılık | Sistem | Doğrulama |
|---|---|---|---|
| Orta | Nadir | HKM | canlı |

`HKM/daemon.py` · Kopan istek sunucuyu düşürmüyor, ama istemci 400/422
yerine «bağlantı kapandı» görüyor ve bu kullanıcıya «HKM ulaşılamıyor» gibi
yansıyor. Canlı denemede 102 durum:
- Gövde nesne değilse (`[]`, `null`, `1`, `"x"`): `sync` (`:1428`
  `setdefault`), `restore` (`:1274`), `prune`, `say`, `message`, `memory`,
  `motto/*`, `probe`, `models`, `web/dene`, `pair/open`, `intents`, `chat`,
  `chat/tani`.
- `?date=bozuk` ya da `?date=2026-13-45` (`:628` doğrulanmıyor): `briefing`,
  `twin`, `series`, `cross`, `streak`, `weekly`, `weekly/belge`, `budget`.
  Gövdede bozuk `date` ile `POST /api/chat` ve `/api/message`.
- `motto/{edit,move,archive,link,unlink,accept}` `id`'siz: `int(None)`.
- `prune {"days":"abc"}`, `restore {"__meta":{"schema":"abc"}}`.

Kopuşlar hiçbir yerde sayılmıyor (bkz. B3).

#### O-8 · Android'de hatırlatma bildirimi gösterilmiyor ve bu söylenmiyor

| Önem | Olasılık | Sistem | Doğrulama |
|---|---|---|---|
| Orta | Koşullu (Android tarayıcı) | SPİ | platform |

`SPI/src/js/core/hatirlat.js:185` · Bildirim sayfanın içinde
`new window.Notification(...)` ile açılıyor. Android'deki Chrome bu kurucuyu
desteklemiyor («Illegal constructor»; `ServiceWorkerRegistration.showNotification`
gerekir). Hata `try/catch` ile yutuluyor. Telefonda izin verilmiş ve
«bildirim açık» görünürken ilaç hatırlatması gelmiyor. **Not:** telefon
ikincil cihaz (GELISTIRME_RAPORU Soru 1). **Yön:** B7.

#### O-9 · Gün ortasındaki kısmi değer, günlük tabana göre yargılanıyor

| Önem | Olasılık | Sistem | Doğrulama |
|---|---|---|---|
| Orta | Her gün | HKM | Python |

`HKM/core/vp_academic.py:22` ve `precedence.py:60` · Bugünün değeri gün
bitmeden günlük tabanla karşılaştırılıyor. **Tekrar:**
`vp_academic.audit({'questions':20 ölçüldü,'study_minutes':60 ölçüldü})` →
`ANOMALY`, «Soru sayısı 20 — taban 80»; `precedence.resolve` → «AYS'nin
günlük tabanı karşılanmadı. Önce oradaki açığı kapatmanı öneririm.» Saat
10:00'da da aynı sonuç çıkıyor ve öneri o tarihin kararı olarak ambara
yazılıyor (`manager.carry`). Aynı kısmi değer seri tespitinde de «kırık
gün» sayılıyor. **Yön:** A8; doktrin tartışması §6 DK-4.

#### O-10 · `.ics` içe aktarması UTC saatlerini yerel gün sayıyor

| Önem | Olasılık | Sistem | Doğrulama |
|---|---|---|---|
| Orta | Koşullu (UTC saatli etkinlik) | AYS | okuma |

`AYS/src/js/core/takvim.js:87-92` · `tarihOku` sondaki `Z`'yi yakalıyor
ama kullanmıyor. Google Takvim saatli etkinlikleri UTC olarak dışa aktarır:
`DTSTART:20260619T220000Z` (İstanbul'da 20 Haziran 01:00) 19 Haziran'a
düşüyor. `:127` `T000000Z` bitişini «gece yarısı» sayıp bir gün geri
çekiyor; oysa o an 03:00. Takvim kayıtları planı değiştirdiği için
(LIFEOS2 §2) yanlış gün yanlış plan demek. Depo bu hata sınıfını `4b01be2`'de
başka yerlerde kapatmıştı.

---

### Düşük

| # | Konum | Ne yanlış · hangi girdide | Doğrulama |
|---|---|---|---|
| D-1 | `HKM/daemon.py:1428` | `/api/sync/ays` gövdesinde `"module":"spi"` varsa kayıt SPİ'ye yazılıyor; yol ile gövde uyuşmazlığı denetlenmiyor. | canlı |
| D-2 | `HKM/core/intents.py` `take` | Cevapta `state:"delivered"` ama `delivered_at:null`; sözlük yerinde güncellenmiyor. | canlı |
| D-3 | `HKM/core/manager.py` `brief` → `carry` | `GET /api/briefing` ambara karar yazıyor; `?date=2020-01-01` dahil her okunan tarih için karar satırı açılabiliyor. | okuma |
| D-4 | `HKM/core/yedek.py:120-126` | Aynı modülün eşzamanlı iki yedek isteği aynı `.yaziliyor` geçici adını kullanıyor; biri `FileNotFoundError` ile kopabiliyor (iki sekme). | okuma |
| D-5 | `HKM/core/program.py:229-241` | Yorum «toplam öğrenme süresini aşmaz» diyor; `max(1, t)` sıfır dilim alan birime dilim ekleyince toplam aşılabiliyor. | okuma |
| D-6 | Üç `beacon.js` `backfill` | İlk hatada `break`; tek bozuk gün geri kalan günleri engelliyor, hangi günün neden reddedildiği söylenmiyor. | okuma |
| D-7 | `HKM/daemon.py:1288` | `prune {"days":0}` sessizce 180 gün oluyor (`or 180`). | canlı |
| D-8 | `AYS/src/js/screens/exams.js:115, 123`; `AYS/src/js/core/utils.js` | Doğru ve yanlışı 0 olan test (hepsi boş ya da girilmemiş) «Doğruluk %0» gösteriyor; «veri yok» olmalı. `U.pct(x, 0)` ve `U.round(NaN)` 0 döndürüyor; çağıranların çoğu koruyor, bu ekran korumuyor. `fmtMin(119.6)` «1 sa 60 dk» yazıyor (bugün yalnız tam sayı toplamlar gidiyor, hata gizli). | okuma |
| D-9 | `*/src/js/core/ui.js:17/49, 19/51`; `ESP/src/js/data/hints.js:104/195` | `target`, `shield` ve `ladder` anahtarları iki kez tanımlı; ilk tanımlar ölü. | eslint |
| D-10 | `AYS/src/js/app.js:656` | `S.ui.examOpen = S.ui.examOpen` hiçbir şey yapmıyor; niyet belirsiz. | eslint |
| D-11 | `ESP/src/js/core/srs.js` başlık | «EASE ince ayardır; aynı kutudaki iki kart aynı hızda uzamaz» diyor; `schedule()` ease'i yalnız «Kolay»da kullanıyor. | okuma |
| D-12 | `HKM/core/intents.py:44`; `AYS beacon.js:489`, `SPI :471`, `ESP :466` | Niyet kataloğu dört yerde. Bugün 15 türün hepsi tutarlı, karşılaştıran test yok. HKM'ye bir tür eklenip modül listesi unutulursa teklif modülde sessizce atlanıyor (`AYS beacon.js:486`), HKM'de üç gün sonra `expired` olarak kapanıyor (`bildirim.py` `bayatlari_kapat`); kullanıcı teklifi hiç görmemiş oluyor. | okuma |
| D-13 | `HKM/core/settings.py:260-268` | `config.json` (jeton, sağlayıcı anahtarları, kanal jetonları) izin ayarlanmadan, varsayılan umask ile yazılıyor; ambar ve `db/yedek/` de öyle. VPS kurulumunda başka kullanıcılar okuyabilir. | okuma |
| D-14 | `*/dist/*.html`, `.github/workflows/ci.yml` | Tek dosya sürümü depoda ve duman testi onu geziyor, ama kaynaktan derlenmiş hâliyle aynı olduğunu hiçbir şey sınamıyor (`R.BUILD` damgası denetlenmiyor). | okuma |
| D-15 | `HKM/core/outbox.py` `flush`; çağıranlar `gelen.py:80,97`, `schedule.py:411`, `daemon.py:452` | Vadesi gelenleri okuma ile «gönderildi» işareti arasında kilit yok. Ritim ve Telegram'dan gelen her mesaj **bütün** vadesi gelen satırları gönderiyor; aynı satır iki iş parçacığında gidebilir (sabah brifingi ya da haftalık PDF iki kez). `media.process_next` için de aynı yarış. | okuma |
| D-16 | `HKM/core/ai.py:97,112,130,376-381` | Sağlayıcı kullanım bilgisi dönmezse jeton 0, maliyet «0 USD, ölçüldü» yazılıyor; `tahmini` bayrağı yalnız fiyat tablosuna bakıyor. Bütçenin kuralı 4 («ölçülmeyen sıfır değildir») çiğneniyor; bu tür bir uçta tavan hiç dolmaz. `FIYAT` tablosunun tarihi yok, dokuz ayda eskir (B5). | okuma |
| D-17 | `*/src/js/core/store.js:424-437` | Doluluk yalnız etkin profilin anahtarından ölçülüyor; öteki profiller ve `.oncesi` kopyası sayılmıyor. **Ölçüldü:** dokuz aylık tipik AYS verisi (270 gün, 60 deneme, 800 kart, 600 yanlış) 894 356 karakter, kotanın %17'si; kapasite dokuz ay için risk değil. Tek küçük yazma medyan **36,4 ms**, 1 660 kaydı tek tek yazmak 25,6 sn (tek anahtar, NOTLAR §7.3). | tarayıcı |
| D-18 | `HKM/core/butce.py:307-314` | `guard` USD tavanında çağrının tahmini maliyetini eklemiyor (yalnız TL'de `cost_try`); çağrı öncesi yalnız «harcanan ≥ sınır». Eşzamanlı iki çağrı (ritim BAM + sohbet) ikisi de geçiyor; tek pahalı çağrı tavanı aşabiliyor. | okuma |
| D-19 | `brand/ortak/seri.js:61, 82` | Aylık hasta/izin sınırı yalnız kaydın başladığı ayı sayıyor; ay dönümünü geçen izin öteki ayın sınırına bakmıyor. Tatilin toplam sınırı yok; 21 günlük kayıtlar art arda eklenebiliyor (baş yorum «bahane makinesi olmamalı»). | okuma |

### Belge ve iddia kayması

| # | Konum | Kayma |
|---|---|---|
| B-1 | `README.md:30`, `HKM/MIMARI.md:12` | «312 test», «106 HKM testi»; ölçülen 585. |
| B-2 | `README.md:37`, `HKM/MIMARI.md` §1, üç onay kartı (Y-8) | «Üç sistem HKM'nin var olduğunu bilmez.» AGENTS.md §1.4 ve `intents.py` «bilir» diyor; modüller 9 dosyadan ~15 HKM ucuna konuşuyor. |
| B-3 | `brand/ortak/OKU.md:28, 75`, `NOTLAR.md:1552` | `llm.js` «yalnız SPİ + ESP», «AYS'ninki başka bir şeydir»; `tools/ortak.py` `YALNIZ` boş, `llm.js` üçüne yayılıyor. |
| B-4 | `HKM/KURULUM.md:122`, `HKM/MIMARI.md:400` | «`/api/wa/webhook` tek bearer'sız POST yoludur»; `/api/tg/webhook` ve `/api/pair` de bearer'sız. |

### Koşullu

**KO-1 · HKM'de saat dilimi yok.** 51 yerde `date.today()` ya da
`datetime.now()` kullanılıyor; KURULUM'daki systemd biriminde `TZ` yok. UTC
bir VPS'te «08:00 brifingi» İstanbul saatiyle 11:00'de gidiyor, HKM'nin günü
03:00'te dönüyor. Yerelde çalışırken tetiklenmiyor. Gelecek tarih denetimi
bir günlük pay bıraktığı için sync reddi **olmuyor**. Yön: B6.

---

## 6. Doktrin eleştirisi — neyi imkânsız kılıyor

Paket §6 bunu açıkça istiyor. Aşağıdakiler bir doktrin maddesinin yanlış
olduğunu değil, bugünkü uygulanışıyla **neyi imkânsız kıldığını** gösteriyor.

**DK-1 · §1.1 ile §1.7 çatışıyor.** «Kural motoru otoritedir, model yalnız
cümle kurar» kuralı, cümle anlamayı düzenli ifade ayrıştırıcılarına
bırakıyor. Düzenli ifade olumsuzluğu ve kipi güvenilir biçimde
yakalayamadığında ayrıştırıcının kendisi «anlamış gibi yapan» katman oluyor
(KR-1). HKM `dil.olumsuz` ile bunu kısmen çözmüş; modüller çözmemiş.
Doktrin bugün şunu imkânsız kılıyor: bir ölçümün **kullanıcının söylediği**
değil, **ayrıştırıcının sandığı** şey olmadığını garanti etmek. Doktrinle
uyumlu çıkış: ayrıştırıcı çıktısının ortak bir olumsuzluk ve kip
süzgecinden geçmesi, ölçüm yazan eylemin her zaman önizlenmesi (A1, A2).

**DK-2 · §1.4'ün bedeli dağınık sözleşme.** «HKM modüle yazmaz, modüller
bağımsızdır» ilkesi her ortak sözleşmenin birden çok kopyasını doğuruyor:
niyet kataloğu dört yerde (D-12), kesinlik sözlüğü iki biçimde (PLAN A2),
gün sınırı kuralı iki yerde (modüllerde düzeltildi, HKM'de değil, KO-1),
profil kavramı hiç yok (Y-7). İlke, ortak bir sözleşmenin **çalışma
zamanında** zorlanmasını imkânsız kılıyor. Depo bunu CSS ve seviye için
derleme zamanında tek kaynakla çözmüş; aynı yol sözleşmelere de açık (B1).

**DK-3 · «Günde tek öneri + katı sıra» açlığa izin veriyor.** Sıra
kesindir ve bir sıranın «süresi» yoktur. Üst sıradaki tek bir hata (Y-2)
ya da kalıcı bir koşul, alt sıraları süresiz susturuyor. Doktrin
«duyulmayan VP yanılmış değildir» diyor, ama bir VP'nin **ne kadar süredir**
duyulmadığı ölçülmüyor (B4).

**DK-4 · Dört etikette zaman yok.** `ölçüldü / tahmin / hesaplandı / veri
yok` bir sayının **kesinliğini** anlatıyor, **tamamlanmışlığını**
anlatmıyor. Saat 10:00'daki «20 soru» doğru olarak «ölçüldü», ama günün
değeri değil. Bu yüzden VP'ler kısmi günü günlük tabanla yargılıyor (O-9),
türetilmiş katmanlar gün içi ara değerleri ayrı ölçüm sayıyor (Y-3, O-1).
Doktrin bugün «bu sayı henüz bitmedi» demeyi imkânsız kılıyor. Öneri:
etiketin yanına bir zaman ekseni (gün kapandı / sürüyor), A8.

**DK-5 · «Eksik veri sıfır değildir» sınırda sağlam, içeride sızıyor.**
HKM sınırı (422) ve işaret sözleşmesi çok iyi koruyor. Ama yardımcılar
(`U.pct`, `U.round`) paydası yokken hâlâ 0 döndürüyor ve onları korumadan
kullanan ekran «%0 doğruluk» yazıyor (D-8), maliyet defteri kullanım bilgisi gelmeyen çağrıya «0 USD, ölçüldü»
yazıyor (D-16).

## 7. Ölçülmeyenler

Paket §6 madde 3: «Hangi önemli şey hâlâ ölçülmüyor?»

| Ölçülmeyen | Neden önemli | Kanıt |
|---|---|---|
| Sistem beni doğru anladı mı | KR-1'i hiçbir ölçüm fark etmedi | `undone` yalnız `proposals.js`'te; geri alma oranı ve «anlaşılmayan» oranı hiçbir yerde sayılmıyor |
| HKM kendi hatalarını görüyor mu | 102 kopuş, hiçbiri sayılmıyor | `handle_error` yalnız stderr'e yazıyor; `tani.py`'de sayaç yok |
| İşaret teslim oranı | Sessiz kayıp günleri | İşaret yalnız son durumu (`lastStatus`, `lastNote`) tutuyor; «son 30 günde kaç gönderim başarısız» yok |
| Bir öneri sırası ne kadar süredir duyulmadı | Y-2 gibi bir hata haftalarca görünmez | Konsey yalnız bugünkü «duyuldu» bilgisini taşıyor |
| Fiyat tablosunun yaşı | Dokuz ayda maliyetler sessizce yanlış olur | `FIYAT` sabit, tarihsiz |
| Modül günü ile HKM günü uyumu | Sunucuya taşınınca kayma | KO-1 |
| Yedeklerin geri yüklenebilirliği | Bayt ve SHA doğrulanıyor, ama modülün `readBackup`'ından geçip geçmediği hiç denenmiyor | `yedek.py` yalnız `__meta.app` ve `data` biçimine bakıyor |

## 8. Dokuz aylık ufukta ne kırılır

| Ne zaman | Ne olur | Bulgu |
|---|---|---|
| Her gün, ilk günden | Olumsuz cümleler sahte ölçüm yazıyor | KR-1 |
| Her gün, ilk günden | Gün ortasında «taban karşılanmadı» önerisi; ikizde sahte eğilim | O-9, O-1 |
| İlk haftalar (≤ 20 karar) | Etki ölçümü yanlış hüküm veriyor | Y-3 |
| İlk geçmiş gönderimi | ESP hiç göndermiyor; SPİ yanlış tabanla gönderiyor | Y-5, O-4 |
| Hane profili eklendiğinde | HKM'de veriler, hafıza ve yedek karışıyor | Y-7 |
| Ay dönümleri | Seri dondurma sınırı yanlış ay | D-19 |
| 3–6. ay | Depo her küçük yazmada ~30–40 ms; toplu işlemler saniyelerce kilitliyor | D-17 |
| Sağlayıcı fiyat değişiklikleri | Maliyet defteri eski fiyatla «ölçüldü» | D-16, B5 |
| **2027-06-19 (sınav, ufkun sonu)** | HKM her gün «Sınava −N gün kaldı»; öteki öneriler susuyor; AYS başlığı eksi gün | Y-2 |

## 9. Önerilen düzeltme sırası

Risk × maliyet sırasıyla. Ayrıntı ve kabul ölçütleri
`OZELLIK-ANALIZI.md`'de.

| Sıra | Bulgu | Neden şimdi | Boy |
|---|---|---|---|
| 1 | KR-1 | Varsayılan ayarla her gün sahte ölçüm | K (A2) + O (A1) |
| 2 | Y-1 | HKM ambarı «ok» diyerek boşalabiliyor | K |
| 3 | Y-9 | Para ve kayıp cevap | K |
| 4 | Y-6 | KR-1'in tek güvencesi olan «Geri al» güvenilir değil | O |
| 5 | Y-3, O-1, O-2 | HKM'nin türetilmiş sayıları; tek yardımcıyla birlikte | K |
| 6 | Y-5, O-4, D-6 | Geçmiş gönderimi | K |
| 7 | Y-4, O-9 | Yanlış kırmızı bayrak ve yarım gün hükmü | K–O |
| 8 | Y-8, B-2 | Onay metni ve belgeler | O |
| 9 | Y-2 | Ufkun sonundan önce yeter; ama tarih kesin | K |
| 10 | O-3, O-5, O-6, O-10 | Veri tutarlılığı | K |
| 11 | Y-7 | Yalnız birden çok profil HKM'ye bağlanacaksa | K (tek profil) |
| 12 | Düşükler, belgeler | Fırsat buldukça | K |

## 10. Test boşlukları

Genel «test yazın» tavsiyesi değil: aşağıdaki her satır, bu turda bulunan
bir hatanın **sınıfını** yakalayacak, bugün var olmayan bir sınama türü.

| Sınama | Yakaladığı sınıf | Bulgu |
|---|---|---|
| Ortak cümle tablosu (olumlu / olumsuz / kipli / çelişkili) üç ayrıştırıcıya | Olumsuzluğun ölçüme dönüşmesi | KR-1 |
| «Art arda iki uygula, ilkini geri al» her küçük eylem için | Mutlak geri alma | Y-6 |
| Aynı gün 1 ve 5 gönderimli iki ambarda türetilmiş katmanların eşitliği | Gün çözünürlüğü | Y-3, O-1 |
| Saati sınav gününe ve sonrasına alan uçtan uca sınama | Tarih sınırları | Y-2 |
| Geçmiş gönderimi, bağlanmamış notu olan ve eski pratiği olan profilde | Geçmişe bugünün değeri | Y-5, O-4 |
| İki profilin aynı HKM'ye bağlandığı bütünleşme sınaması | Profil sınırı | Y-7 |
| HKM uçlarına nesne olmayan gövde ve bozuk tarih | Sağlamlık | O-7 |
| Açık teklif + açık soru aynı kanalda | Cevap bağlamı | Y-9 |
| HKM `KINDS` ile üç `INTENT_KINDS` karşılaştırması | Sözleşme ayrışması | D-12 |
| Sütunları tutmayan yedekle geri yükleme | Sessiz boşaltma | Y-1 |
| UTC saatli `.ics` | Saat dilimi | O-10 |

## 11. Ölçtüm, sorun çıkmadı

- **Tarayıcı tıklama taraması:** AYS (boş ve tohumlu), SPİ ve ESP'nin her
  ekranı; 1 156 tıklama, sayfa hatası 0, ekrana sızan
  `undefined`/`NaN`/`[object Object]` 0.
- **HKM sync doğrulaması:** NaN, Infinity, bool, metin, aralık dışı, gelecek
  tarih, etiketsiz değer, «veri yok» etiketli değer — hepsi 422.
- **HKM yetkilendirme (canlı):** jetonsuz ve yanlış jetonlu istekler 401;
  jeton `hmac.compare_digest` ile karşılaştırılıyor; yapılandırmada jeton
  boşsa hiçbir istek geçmiyor.
- **Yol güvenliği:** yedek indirme (`..%2F`) 404; medya ve marka kapıları
  yalnız düz ad ve izinli uzantı kabul ediyor; Telegram ekleri içerik
  özetiyle adlandırılıyor, boyut akış sırasında da sınırlanıyor.
- **Niyet cevapları:** uygulanmış teklif başka cevaba çevrilemiyor (409);
  bayat teklif ayrı `expired` durumunu alıyor, kullanıcı adına cevap
  uydurulmuyor.
- **HKM yüzü:** `innerHTML`'e kaçışsız karışan veri görmedim (99 atama,
  sezgisel tarama).
- **PDF üretimi:** metin glif kimlikleriyle onaltılık yazılıyor, kaçış
  sorunu yok.
- **Sessiz saatler:** gece yarısını geçen pencere (23:00–08:00) doğru.
- **Service worker:** yalnız aynı kökenden GET isteklerini saklıyor.
- **Telegram ayrıştırıcısı** (`dil.py`): olumsuz, gelecek zamanlı ve
  çelişkili cümleleri kayda çevirmiyor.
- **Bütçe:** fiyatı bilinmeyen model «bedava» sayılmıyor; sınırda ücretli
  çağrı duruyor.
- **SPİ işareti** eksik değeri `missing` gönderiyor; **semptom sayacı**
  kaldırılan semptomu siliyor; **tarih yardımcıları** yerel gün kullanıyor;
  **SRS** hiç sorulmamış kartı ortalamaya katmıyor; **ek sınav profili**
  plana ve net hesabına dokunmuyor; **hekim özeti** teşhis ve doz içermiyor;
  **aralık doğrulaması** («günde 25 saat») çalışıyor.
- **Depo kapasitesi:** dokuz aylık tipik veri kotanın %17'si (D-17).

## 12. Bakamadığım yerler

Buralarda «hata yok» demiyorum, **göremedim**:

- `king.py`, `bam.py`, `teklif.py` üretim akışlarının model ve web
  gerektiren kısımları; Telegram/WhatsApp'ın gerçek ağ davranışı.
- AYS planlayıcısı ve istisna hesabının ayrıntısı; ESP merdiven kapıları;
  XP ve rozet motoru (testlere güvenildi, satır satır okunmadı).
- `build.py` ile tek dosya derlemenin kendisi (duman testi sonucu geziyor).
- Android ve iOS'ta gerçek cihaz davranışı (O-8 platform bilgisine dayanıyor).

---

## Ek A · Tekrar adımları için ortam

- **HKM canlı:** `tests/test_daemon.py`'deki `_Server` sınıfıyla aynı biçimde
  geçici bir ambar ve `ThreadingHTTPServer`; `srv.handle_error`
  değiştirilerek kopuşlar sayıldı.
- **HKM Python:** `db.connect(':memory:')` üzerinde doğrudan işlev çağrısı;
  `tests.harness` içe aktarılarak ağ kapatıldı.
- **Tarayıcı:** her sistemin `devserver.py`'si ayrı bir portta; Playwright
  ile `/index.html`, kurulum atlanarak (`[data-act="setup-skip"]`); dış ağ
  istekleri engelli; saat değiştirme `addInitScript` ile `Date` sarmalanarak.
- **Tıklama taraması:** her rotada (`R.App.NAV`, `SP.App.SECTIONS`,
  `ESP.Nav.sections()`) her görünür `[data-act]` öğesine yeniden gezinip
  basıldı; açılan alt sayfada en çok 12 eylem; `pageerror`, konsol hatası ve
  metin sızıntısı toplandı.
