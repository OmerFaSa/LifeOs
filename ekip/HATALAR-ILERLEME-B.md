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
| Y-5 + O-4 + D-6 | düzeltildi | (bu commit) |
| Y-4 | düzeltildi | (bu commit) |
| Y-8 + B-2 + B-3 | sırada | |
| Y-2 (AYS) | sırada | |
| Y-7 (modül) | sırada | |
| O-3, O-5, O-8, O-10, O-11 | sırada | |
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
