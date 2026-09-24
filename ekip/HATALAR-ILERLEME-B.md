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
| KR-1 | düzeltildi | (bu commit) |
| Y-6 | sırada | |
| Y-5 + O-4 + D-6 | sırada | |
| Y-4 | sırada | |
| Y-8 + B-2 + B-3 | sırada | |
| Y-2 (AYS) | sırada | |
| Y-7 (modül) | sırada | |
| O-3, O-5, O-8, O-10, O-11 | sırada | |
| D-8, D-9, D-10, D-11, D-14, D-17, D-19 | sırada | |

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
