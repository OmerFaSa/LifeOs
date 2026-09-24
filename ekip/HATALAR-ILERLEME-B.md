# HATALAR.md — Claude B ilerlemesi

> Oturum B'nin (modüller: AYS/, SPI/, ESP/, brand/, tools/ortak.py,
> tools/seviye.py, .github/, README.md, NOTLAR.md) düzelttiği bulgular.
> HKM/ ve ekip/DEVIR.md oturum A'nındır. `tools/sayilar.py --yaz` en sonda
> A tarafından koşulacak; bu dosyadaki test sayıları o yüzden elle
> yazılmış **koşum çıktısıdır**, belge sayısı değildir.

Sıra (ekip/IS-BOLUSUMU.md): KR-1 → Y-6 → Y-5 + O-4 + D-6 → Y-4 →
Y-8 + B-2 + B-3 → Y-2 (AYS) → Y-7 (modül) → O-3, O-5, O-8, O-10, O-11 →
D-8, D-9, D-10, D-11, D-14, D-17, D-19.

| Kod | Durum | Commit |
|---|---|---|
| KR-1 | düzeltildi | 29cb138 |
| Y-6 | düzeltildi | 4d79a17 |
| Y-5 + O-4 + D-6 | düzeltildi | e68c718 |
| Y-4 | düzeltildi | e68c718 |
| Y-8 + B-2 + B-3 | düzeltildi | 313a704 |
| Y-2 (AYS) | düzeltildi | 313a704 |
| Y-7 (modül) | düzeltildi | 8051dde |
| O-3, O-5, O-8, O-10, O-11 | düzeltildi | (bu commit) |
| D-8, D-9, D-10, D-11, D-14, D-17, D-19 | **Claude A'ya geçti** (kullanıcı kararı); B dokunmaz | |

---

## KR-1 · Olumsuz cümle sormadan ölçüm olarak yazılıyordu

**Ne değişti.**

1. **Tek kaynak süzgeç:** `brand/ortak/olumsuz.js` (`LIFEOS.Olumsuz`),
   `tools/ortak.py` DOSYALAR tablosuna eklendi ve `--yay` ile üç arayüze
   yayıldı. İki işlev:
   - `olcumEngeli(metin)` — olumsuz («çözmedim», «uyuyamadım», «değil»,
     «yok»), ileriye dönük («çözeceğim», «yarın»), istek ya da hedef
     («istiyorum», «lazım», «hedefim», «-malıyım»), soru («çözdüm mü»,
     sonda «?») ya da belirsiz («belki») cümle ölçüm değildir.
   - `eylemEngeli(metin, {haric})` — olumsuz ek, olumsuz kelime, sondaki
     olumsuz emir («kapatma», «ara verme») ya da «sakın» varsa istek
     tersine çevrilmez. Komutun KENDİSİ olan olumsuz sözler («bugün
     çalışmayacağım», «diksiyon istemiyorum», «3 değil 4 saat») çağıran
     tarafından `haric` ile bildirilir.
   - Dönüş `null` ya da `{neden, kelime, soru}`; `kelime` cümlede geçtiği
     biçimiyle, `soru` kullanıcıya gidecek Türkçe cümle. HKM
     `core/dil.py olumsuz()` örnek alındı (okundu, değiştirilmedi).
2. **Bağlanan ayrıştırıcılar.**
   - AYS: `core/entry.js fromText` (veri; palet, komut ve HKM akşam kaydı
     aynı yoldan geçer) ve `core/komut.js tekKomut` (ara, süre, bölüm,
     hedef). Engellenen parça `engellenen` alanında döner, `anla` onu
     `sorular`a çevirir.
   - SPİ: `core/quickentry.js parse` artık ölçüm olmayan cümleyi tanımaz
     (`parseHam` süzgeçsiz hali); `core/proposals.js fromText`
     `engellenen` döndürür. Palet («Bir şey sormam gerek» kartı), Ekip
     sohbeti ve HKM akşam kaydı nedeni gösterir.
   - ESP: `core/komut.js parca` (bölüm aç/kapat, günlük taban).
3. **Ölçüm yazan eylem hiçbir ayarda sormadan uygulanmaz.** Katalogda
   `olcum:true` işareti: AYS `soru-yaz`, `paragraf-yaz`, `problem-yaz`,
   `uyku-yaz`, `sure-yaz`; SPİ `vital-yaz`, `ogun-ekle`, `seans-ekle`,
   `olcum-gir`, `semptom-isaretle`. `otomatikMi()` bu eylemler için her
   modda `false` döner (önizleme + onay). ESP'de metinden ölçüm yazan
   bir eylem yok (Komut yalnız bölüm ve taban üretir, ikisi de orta).

**Önce yazılan, kırmızı görülen testler.** Düzeltmeden önce koşum:
AYS 10, SPİ 8, ESP 3 test kırmızı (HATALAR.md'deki tablonun satırları).

- `brand/ortak/olumsuz.test.js` (üç arayüzde koşar): olumlu/olumsuz/kip
  tablosu, `haric`, «bacak», «komedi», «tamam», «sakin» gibi tuzaklar.
- AYS `tests/komut.test.js` «Komut — olumsuzluk ve kip (KR-1)»: tablodaki
  cümleler, bileşik cümle, uçtan uca `isle`, karar tablosu.
- AYS `tests/palette.test.js`, `tests/beacon.test.js`.
- SPİ `tests/oneri.test.js` «Öneri — olumsuzluk ve kip (KR-1)»,
  `tests/palette.test.js`, `tests/beacon.test.js`.
- ESP `tests/plans.test.js` «komut · konuşarak».

**Davranış değişikliği olarak güncellenen eski testler** (eski davranışı
kodluyorlardı; IS-BOLUSUMU «ölçüm yazan eylem hiçbir ayarda sormadan
uygulanmaz» kararı):
- SPİ «kullanıcının kendi cümlesi küçükse hemen yazılır» → onay bekler,
  onayla yazılır, geri alınır.
- AYS palet «tam anlaşılmış küçük istek hemen uygulanacağını söyler» →
  örnek artık bir tercih eylemi (haftalık hedef); ölçüm için ayrı test.
- AYS «anahtarsız veri girişi tekrar edilebilir» → iki giriş ayrı ayrı
  onaylanır, ikisi de yazılır.

**Koşturulan denetimler ve çıktı.**

```
AYS  node tools/runtests.js   1702/1702 gecti
SPI  node tools/runtests.js   1347/1347 gecti
ESP  node tools/runtests.js   1369/1369 gecti
AYS  node tools/smoke.js      Duman testi temiz — 2 hedefte 38 ekran, 46 sekme
SPI  node tools/smoke.js      Duman testi temiz — 2 hedefte 26 ekran, 74 sekme
ESP  node tools/smoke.js      Duman testi temiz — 2 hedefte 30 ekran, 192 sekme
python3 tools/ortak.py --denetle      kopyalar kaynakla ayni (45 dosya, 135 kopya)
python3 tools/seviye.py --denetle     uc arayuzde de kaynakla ayni
python3 tools/marka.py --sina         temiz (25 durum)
python3 tools/marka.py --kunye --denetle   taze
python3 build.py (üçü)                 dist yeniden derlendi
```

Uçtan uca (gerçek sayfa, devserver): HATALAR.md KR-1 tablosunun on
satırının hiçbiri artık bir şey yazmıyor ya da önermiyor; her biri
nedenini söyleyen bir soru döndürüyor. «bugün 40 soru çözdüm» ve «7 saat
uyudum» onay bekliyor; «bugün çalışmayacağım», «diksiyon istemiyorum»
komut olarak kalıyor.

**Bilinen sınırlar (göremediğim / bilerek bırakılan).**
- Süzgeç sözlük tabanlıdır: «çalışmam» gibi hem olumsuz geniş zaman hem
  ad olabilen «-mam/-mem» biçimi olumsuz sayılır (ardından «lazım»,
  «gerek» gelmiyorsa). Yanlış bir engel bir sorudur; yanlış bir geçiş
  sahte ölçümdür — taraf bilerek seçildi.
- «hiç» tek başına olumsuz sayılmaz («hiç ara vermeden 3 saat çalıştım»
  olumludur); «hiç çözmedim»in olumsuzluğu zaten fiildedir.
- HATALAR.md «Düzeltme yönü»ndeki B2 (ayrıştırıcı kalite ölçümü) yeni
  özellik olduğu için bu turda yapılmadı.
- Rozetlerin «olay» sayılıp geri almada kalıcı kalması (KR-1 etki
  paragrafı) ayrı bir tasarım konusudur; KR-1'in kökü (sahte ölçüm)
  kapandığı için bu yoldan artık rozet doğmuyor.

---

## Y-6 · «Geri al» sonraki kayıtları siliyordu

**Ne değişti.** `AYS/src/js/core/proposals.js` ve `SPI/src/js/core/proposals.js`:

- **Toplamalı alan** (`soru-yaz`, `paragraf-yaz`, `problem-yaz`, `sure-yaz`):
  geri alma yalnız o kaydın eklediğini çıkarır (`farkGeri`). Geriye yalnız
  bu kaydın payı kalmışsa alan eski hâline döner — girilmemiş blok alanı
  yine «girilmemiş» olur, sıfır değil. Elle azaltılmış ve çıkarma eksiye
  düşüyorsa dokunulmaz.
- **Değer yazan alan** (AYS `uyku-yaz`, `week-target`; SPİ `vital-yaz`,
  `semptom-isaretle`): aynı alana sonra yazan bir kayıt varsa değer onundur,
  dokunulmaz; yoksa alan hâlâ bu kaydın değerindeyse eski hâline döner,
  elle değiştirilmişse dokunulmaz.
- **Zincir:** sonraki kayıtların anlık görüntüsü bu kayıt hiç olmamış gibi
  düzeltilir; böylece geri alınmış kayıt sonradan «dirilmez».
- **Blok durumu:** `soru-yaz`/`sure-yaz` bloğu «bekliyor»dan «tamamlandı»ya
  çektiyse ve blokta başka iş kalmadıysa geri döner; kaldıysa sorumluluk
  sonraki kayda devredilir.
- **Uygulama sırası:** `approve` her kayda tekil bir `sira` yazar
  (`appliedAt` aynı milisaniyeye düşebiliyordu). Sırası olmayan eski kayıt
  önce uygulanmış sayılır; fark bilgisi olmayan eski anlık görüntü önerinin
  parametresinden geri alınır (göç gerekmez).

HATALAR konum listesinde olmayan ama bulgunun «bütün küçük eylemlerde»
cümlesine giren `week-target` ve SPİ `semptom-isaretle` aynı kurala
bağlandı. Kayıt oluşturan eylemler (`seans-ekle`, `ogun-ekle`, `block-add`
vb.) zaten kimlikle siler; değişmedi.

**Önce yazılan, kırmızı görülen testler:** AYS `tests/proposals.test.js`
«Öneri — geri alma sırası (Y-6)» (7 test, 7 kırmızı), SPİ
`tests/oneri.test.js` aynı başlık (3 test, 3 kırmızı). HATALAR'daki tekrar
birebir testtedir: 40 + 20 → ilki geri → 20, ikincisi geri → 0.

**Koşturulan denetimler ve çıktı.**

```
AYS  node tools/runtests.js   1709/1709 gecti
SPI  node tools/runtests.js   1350/1350 gecti
AYS  node tools/smoke.js      Duman testi temiz — 2 hedefte 38 ekran, 46 sekme
SPI  node tools/smoke.js      Duman testi temiz — 2 hedefte 26 ekran, 74 sekme
python3 build.py (AYS, SPI)   dist yeniden derlendi
```

**Bilinen sınır.** Elle yapılan bir düzenleme kaydın payını kısmen
silmişse (ör. 40 eklendi, elle 20'ye indirildi, sonra 20 daha eklendi)
hangi sayının kime ait olduğu belirsizdir; kural «eksiye düşüyorsa
dokunma, düşmüyorsa yalnız bu kaydın payını çıkar»dır, tahmin etmez.

---

## Y-5 + O-4 + D-6 · Geçmiş gönderimi · Y-4 · İnce toparlanma

**Ne değişti.**

- **D-6 (üç `beacon.js backfill`):** gövdeye özgü ret (400, 409, 413,
  422) yalnız o günündür; geri kalan günler gönderilmeye devam eder,
  reddedilen her gün `rejected:[{date, status, why}]` olarak döner ve
  `lastNote`'a yazılır («1 gün reddedildi: 2026-09-23 (422: …)»). HKM'nin
  `errors` listesi neden olarak okunur. Ağ, yetki ya da sunucu hatasında
  durulur (kalan günler de aynı cevabı alırdı). Ek olarak bulunan hata: ağ
  hatasında `status` `0 || 202` yüzünden **202** dönüyordu; artık 0.
  Üç ekranın toast'ı bu notu gösterir.
- **Y-5 (ESP `collect`):** geçmiş günün `synthesis_gap_days`'i «veri
  yok»tur; bağlantı durumu bugünün durumudur.
- **O-4 (SPİ `move.js`):** `baseline(key, days, bitis)` penceresi o güne
  göre kurulur; `readiness(d)` HRV ve nabız puanını o günün tabanıyla
  hesaplar. `calc.js` haftalık rapor, `goodhart.js` ve geçmiş gönderimi
  zaten `readiness(d)` çağırdığı için birlikte düzeldi.
- **Y-4 (SPİ `beacon.js collect`):** `readiness().thin` ise `recovery`
  `estimated` gider. (HKM tarafının `estimated`'e nasıl davrandığı A'nın
  alanıdır.)

**Önce yazılan, kırmızı görülen testler:** üç `tests/beacon.test.js`'e
«tek reddedilen gün geri kalanı durdurmaz» ve «ağ hatasında durur» (üçünde
2'şer kırmızı), ESP «geçmiş günün sentez açığı veri yok», SPİ «geçmiş
günün toparlanma tabanı o güne göre» ve «ince toparlanma tahmin olarak
gider» (her biri kırmızı). `olculmusGun()` yardımcısı tarih alacak
biçimde genişletildi.

**Koşturulan denetimler ve çıktı.**

```
AYS  node tools/runtests.js   1711/1711 gecti
SPI  node tools/runtests.js   1354/1354 gecti
ESP  node tools/runtests.js   1372/1372 gecti
AYS/SPI/ESP  node tools/smoke.js   Duman testi temiz (38 / 26 / 30 ekran, 2 hedefte)
python3 build.py (üçü)        dist yeniden derlendi
```

---

## Y-8 + B-2 + B-3 · Onay kartının sözü ve belgeler · Y-2 · Sınav sonrası

**Y-8 / B-2.** Kartın metni artık tek kaynaktan gelir:
`brand/ortak/yedekag.js` `LIFEOS.YedekAg.kartNotu(ad)` — «HKM'nin varlığını
bilir ama ona bağımlı değildir … Bu anahtar iki şeyi birlikte açar: günün
özeti ve günde bir kez bütün verinin HKM'ye yedeklenmesi; hafıza ve hedef
özetleri ile iş emirleri de aynı anahtarla gider. HKM başka bir makinedeyse
bu veri cihazdan çıkar.» Üç kart (AYS `screens/guide.js`, SPİ
`screens/guide.js`, ESP `screens/profile.js`) bunu gösterir; «GİTMEZ»
cümleleri «günün özetinde … gitmez (tam yedekte vardır)» oldu. Aynı yanlış
söz üç `data/hints.js` «hkm» yardım metninde de vardı; düzeltildi.
`README.md` HKM paragrafı AGENTS.md §1.4 ile aynı dili konuşur (bilir,
bağımlı değil; özet + tam yedek). Test: `brand/ortak/yedekag.test.js`
«onay kartının sözü».

**B-3.** `brand/ortak/OKU.md` tablo satırı ve «Her dosya üç sisteme
gitmez» bölümü, `NOTLAR.md` iki satırı: `llm.js`/`providers.js` üç
arayüze yayılır, `YALNIZ` tablosu boştur.

**Y-2 (AYS tarafı).** `R.PLAN.kalanGun(gun)`: sınav günü 0, sınavdan sonra
`null`. `beacon.js` `exam_days_left` sınavdan sonra «veri yok» gider;
başlık «— · TYT tarihi geçti» yazar; model aracı (`tools.js`
`sinavaKalanGun`) da eksi sayı vermez. HKM tarafı (precedence) A'nındır.
Test: AYS `tests/beacon.test.js` «sınav tarihi geçince kalan gün eksi
gitmez» (önce kırmızı: `kalanGun` yoktu, değer −12 gidiyordu).

**Koşturulan denetimler ve çıktı.**

```
AYS  node tools/runtests.js   1713/1713 gecti
SPI  node tools/runtests.js   1355/1355 gecti
ESP  node tools/runtests.js   1373/1373 gecti
AYS/SPI/ESP  node tools/smoke.js   Duman testi temiz (38 / 26 / 30 ekran, 2 hedefte)
python3 tools/ortak.py --denetle   kopyalar kaynakla ayni (45 dosya, 135 kopya)
python3 build.py (üçü)        dist yeniden derlendi
```

---

## Y-7 (modül tarafı) · HKM'ye aynı anda tek profil

**Ne değişti.**

- Yeni tek kaynak `brand/ortak/hkmbag.js` (`LIFEOS.HkmBag`), `tools/ortak.py`
  ile üç arayüze: bağın sahibi CİHAZDA, modül başına tek anahtarda
  (`lifeos.hkm.sahip.<modül>`). `al`, `birak`, `sahip`, `izinli`, `not`.
- Üç `beacon.js`: `settings()` bağ başka profildeyse `enabled:false,
  baskaProfil:<id>` döner. Özet, geçmiş, yedek (`yedekag`), hafıza,
  hedef ağı, King teklifi, BAM ve ürün kanalları hep `settings()`'ten
  geçtiği için hepsi birlikte susar. `save({enabled:true})` bağı alır ya da
  (başkasındaysa) açmaz; `save({enabled:false})` bırakır. `send({force})`
  de başka profilde gönderim yapmaz. `pair()` bağ başkasındaysa «HKM
  başka profile bağlı» der. Bu güncellemeden önce iki profilde de açık
  olan işaret: ilk açılan profil bağı alır, öteki kapalı sayılır.
- Kartlar (AYS, SPİ, ESP) bağ başkasındayken «HKM başka profile bağlı
  («X») … önce o profilde işareti kapat» uyarısını gösterir.
- SPİ ve ESP'de profil silinince tuttuğu bağ bırakılır (kilit asılı
  kalmaz). AYS'de profil silme işlevi yok.

**Testler.** `brand/ortak/hkmbag.test.js` (üç arayüzde) ve üç
`tests/beacon.test.js` «tek profil (Y-7)». Eski SPİ `beacon.js` ile koşum:
2 kırmızı (bağ başkasındayken işaret açılıyordu); yenisiyle yeşil.

**Koşturulan denetimler ve çıktı.**

```
AYS  node tools/runtests.js   1718/1718 gecti
SPI  node tools/runtests.js   1360/1360 gecti
ESP  node tools/runtests.js   1378/1378 gecti
AYS/SPI/ESP  node tools/smoke.js   Duman testi temiz (38 / 26 / 30 ekran, 2 hedefte)
python3 tools/ortak.py --denetle   kopyalar kaynakla ayni (47 dosya, 141 kopya)
python3 build.py (üçü)        dist yeniden derlendi
```

**Sınır.** Bağ aynı tarayıcı (aynı `localStorage`) içindeki profilleri
ayırır. İki ayrı cihazdan iki kişinin aynı HKM'ye bağlanması HKM
tarafının konusudur (profil alanını okumak); A'nın alanı.

---

## O-3 · O-5 · O-8 · O-10 · O-11

- **O-3 (üç `store.js importAll`):** geri alma kopyası yazılamazsa (kota)
  önceki içe aktarmanın kopyası da silinir; sonuç `geriAlinamaz:true`
  taşır ve üç ekranın toast'ı «yer olmadığı için bu içe aktarma geri
  alınamaz» der. Mevcut karar (kopya yazılamasa da içe aktarma denenir)
  korundu; düzeltilen şey eski kopyanın «geri al» ile haftalar önceki
  duruma dönüp aradaki kaydı silmesiydi. Test: `brand/ortak/store.test.js`
  (üç arayüzde, önce üçünde de kırmızı).
- **O-5 (AYS):** tek tanım `R.Calc.gunSorusu(day)` = blok + serbest +
  paragraf + problem. HKM işareti, Goodhart, XP sayımı, rozet sayımı,
  ajan aracı ve haftalık gerçekleşme (`questionRealization`) hep buradan
  okur. Geniş tanım seçildi çünkü HKM `questions`'ı akademik VP, seri ve
  etki için kullanıyor ve mevcut bir test («serbest, paragraf ve problem
  soruları da günün sorusudur») yalnız paragraf çözülen günün HKM'de «veri
  yok» görünmemesi için bunu bilerek istiyor. Sonuç: XP, rozet ve haftalık
  gerçekleşme artık paragraf ve problemi de sayar. Test: AYS
  `tests/beacon.test.js` «günün sorusu her yerde aynı tanımla sayılır».
- **O-8 (SPİ `hatirlat.js`):** `new Notification` kurulamazsa hizmet
  çalışanının `showNotification`'ı denenir; o da yoksa
  `bildirimSorunu()` bir cümle döndürür ve hatırlatma ekranı bunu uyarı
  olarak gösterir. Test: SPİ `tests/hatirlat.test.js` (kurucu atan sahte
  `Notification`; iki yol).
- **O-10 (AYS `takvim.js tarihOku`):** sondaki `Z` UTC'dir; yerel güne ve
  saate çevrilir. `DTSTART:20260619T220000Z` → 20 Haziran; `DTEND
  T000000Z` yerelde 03:00 olduğu için bir gün geri çekilmez. Yerel (Z'siz)
  saatler eskisi gibi. Test: AYS `tests/takvim.test.js`.
- **O-11 (AYS `istisna.js hafiflet`):** o gün zaten ara günüyse
  hafifletilmez: «O gün zaten ara günü; yükü sıfır, hafifletilecek bir şey
  yok.» HKM `load.reduce` teklifi bu nedenle uygulanamaz görünür, ara
  korunur. Test: AYS `tests/beacon.test.js` «ara günü hafifletilmez».

**Koşturulan denetimler ve çıktı.**

```
AYS  node tools/runtests.js   1729/1729 gecti
SPI  node tools/runtests.js   1368/1368 gecti
ESP  node tools/runtests.js   1386/1386 gecti
AYS/SPI/ESP  node tools/smoke.js   Duman testi temiz (38 / 26 / 30 ekran, 2 hedefte)
python3 build.py --denetle (üçü)   dist kaynaktan derlenmiş hâliyle aynı
python3 tools/ortak.py --denetle   kopyalar kaynakla ayni (47 dosya, 141 kopya)
```

---

## Tur sonu

B'nin listesindeki bütün bulgular kapandı: KR-1, Y-6, Y-5, O-4, D-6, Y-4,
Y-8, B-2, B-3, Y-2 (AYS), Y-7 (modül), O-3, O-5, O-8, O-10, O-11.
D-8, D-9, D-10, D-11, D-14, D-17, D-19 kullanıcı kararıyla A'ya geçti.
`tools/sayilar.py --yaz` koşulmadı (A en sonda koşacak).
