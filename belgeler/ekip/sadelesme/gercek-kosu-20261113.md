# Göç bağdaştırıcılarının gerçek veride ilk koşusu (2026-11-13)

Araç: `tools/gercek_kosu.py` (+ `tools/gercek_kosu.js`). Komut: `python tools/gercek_kosu.py`. Yalnız sayılar;
kişisel içerik, kayıt gövdesi, değer ya da ad yok.

## Özet

- **Hiçbir bağdaştırıcı çökmedi, gerçek biçimde alan adı uyuşmazlığı yok.** Kuru depodaki 394 canlı kaydın
  18'i bir motor bağdaştırıcısına ulaştı (ays:days'in 7 kaydı iki motora bölünür: Kayıt + Plan); 376'sının
  (%95) sahibi motor yok: 350'si HKM (sohbet 168, kullanım 166), kalanı modül meta, profil ve plan koleksiyonları.
- Uyarlanan: Plan 7 gün planı, Kayıt 4 ölçü kaydı ve 1 profil, Not 4 not. **Ret 1** (Not: «Başlığı da gövdesi
  de boş not kaydedilmez.»; içerik sıfır, kural doğru). Boş dönüş 9 (Kayıt AYS günü 7, konu notu 1, konu
  kapanışı 1): hepsi gerçekten boş girdi (21 bloğun 21'i «pending», uyku yok; konunun notu boş, ölçümü yok).
- **İki küçük düzeltme** (yalnız taşınamayan listeleri; bağdaştırıcı çıktısı aynı): Plan `EKSIK.aysGun` ve
  Kayıt `EKSIK.spiProfil` gerçek kayıtta duran ama ne okunan ne adıyla bildirilen alanları sessizce
  düşürüyordu (Plan: `badDay`, `ritual`, `dow`, `distractions`; Kayıt: profilin 9 alanı). Şimdi sessiz düşen
  alan 0.
- **Asıl sınama henüz yapılmadı:** göç paketi 0 (P2 düğmesine hiçbir cihazda basılmadı). Öğün, antrenman,
  ruh hâli, mola, ESP günü, kartlar, deneme, yanlış, video ve ESP notları, terim, Notum, Bilinç ve Meydan
  bağdaştırıcıları gerçek kayıt görmedi. Her cihaz paketi geldikten sonra aynı komut yeniden koşulmalı.
- Sahibi olmayan ama içerik taşıyan üç koleksiyon karar bekliyor: `ays:plan` (1), `ays:weeks` (2),
  `spi:haftaplan` (2). Ayrıca «Soru motoru»na ve «Not motoru»na gönderilen gün alanlarının o motorlarda
  bağdaştırıcısı yok (bkz. Kalanlar).

## Yöntem ve gizlilik

1. **Kopya.** `hesap.db` (+ `-wal`/`-shm`) ve `yedek/hesap-*.db` (goc.py canlı depo boşsa yedekten okur),
   `hkm.db` (+ `-wal`/`-shm`), varsa `goc/paket/` ve PC'nin üç JSON'u (`ayar.json`, `planlama.json`,
   `ice/ice.json`; müzik ve zemin dosyaları kopyalanmaz) geçici klasöre **bayt olarak** kopyalanır. Canlı dosya
   SQLite ile hiç açılmaz (faz1.md: `?mode=ro` bile yanına `-shm` yazar). Ölçüldü: koşudan önce ve sonra
   canlı 12 dosyanın boyutu ve değişme zamanı aynı.
2. **Kuru depo.** Kopyalardan `goc.goc()` geçici `lifeos.db` kurar (göç kimliği `ab38280667e3fef4`, sayı
   dengesi tutuyor, gidiş-dönüş birebir).
3. **Yönlendirme.** Her canlı kayıt rotasına göre (`<modül>:<koleksiyon>`, `hkm:<tablo>`, `gun:<tür>`,
   `pc:<tür>`, paket anahtarı için `anahtar:<ilk iki parça>`) sahibi bağdaştırıcıya gider; rota tablosu tek
   yerde: `tools/gercek_kosu.js` `ROTA`. Liste alan Not bağdaştırıcıları (başlık bağı aynı modülde aranır)
   bir alanın bütün kayıtlarını birlikte alır. Node'a en çok 500 kayıtlık partiler stdin üstünden gider
   (diske yazılmaz).
4. **Sayılan.** Okunan; çıktı (kayıt, kart, not, plan); ret (bağdaştırıcının Türkçe nedeni, gruplu); boş (ne
   çıktı ne ret); çökme (istisna ve `motor/x.js:satır`); çıktıda `undefined` ya da NaN alan; bağdaştırıcının
   kendi taşınamayan listesi; **sessiz düşen alan**: rotadaki hiçbir bağdaştırıcının kaynağında tam adıyla
   geçmeyen ve taşınamayan listesinde de adı olmayan üst düzey girdi alanı (yalnız şema adı biçimli
   anahtarlar; tarih ya da kimlik anahtarı sayılmaz).
5. **Gizlilik.** Rapora yalnız sayı, rota, alan adı ve kodun kendi metni girer. Ret ve çökme metninde rakamlar
   `#` olur, kimlik biçimli olmayan «…» içeriği «…» olur (sınır dışı bir ölçünün değeri basılmaz).
6. **Temizlik ve çıkış.** Geçici klasör `finally` ile silinir (ölçüldü: koşudan sonra `lifeos-gercek-kosu-*`
   klasörü 0). Çökme ya da goc hatası → çıkış 1; temiz ret → 0.

Gerçek biçim ayrıca araca girmeyen tek seferlik bir betikle yalnız anahtar adı, değer türü ve boş/sıfır
bilgisi olarak okundu (içerik basılmadan). Bloklar, konu durumları ve plan koleksiyonları hakkındaki yargılar
oradan.

## Sonuç tablosu

Göç kimliği `ab38280667e3fef4`; goc.py sayı dengesi tutuyor, gidiş-dönüş birebir, hata 0. Paket: 0.

Okunan: kuru depodaki canlı kayıt (goc.py'nin atladıkları sayılmaz). Çıktı: bağdaştırıcının ürettiği kayıt/kart/not/plan sayısı (bir gün kaydı birçok ölçü verebilir). Boş: ne çıktı ne ret (null ya da boş liste).

| Kaynak | Tür | Rota | Bağdaştırıcı | Okunan | Çıktı | Ret | Boş | Çöktü |
|---|---|---|---|---:|---:|---:|---:|---:|
| hesap | ays.days | ays:days | kayit.aysGun | 7 | 0 | 0 | 7 | 0 |
| hesap | ays.days | ays:days | plan.aysGun | 7 | 7 | 0 | 0 | 0 |
| hesap | ays.topics | ays:topics | not.aysKonu | 1 | 0 | 0 | 1 | 0 |
| hesap | ays.topics | ays:topics | tekrar.aysKapanis | 1 | 0 | 0 | 1 | 0 |
| hesap | not | ays:defter | not.defter | 2 | 2 | 0 | 0 | 0 |
| hesap | not | esp:defter | not.defter | 1 | 1 | 0 | 0 | 0 |
| hesap | not | spi:defter | not.defter | 2 | 1 | 1 | 0 | 0 |
| hesap | olcum | spi:vitals | kayit.spiVitals | 4 | 4 | 0 | 0 | 0 |
| hesap | profil | spi:profile | kayit.spiProfil | 1 | 1 | 0 | 0 | 0 |

#### Sahibi motor olmayan kayıtlar

| Kaynak | Tür | Rota | Kayıt |
|---|---|---|---:|
| gun | gun_kopya | gun:gun_kopya | 2 |
| hesap | esp.prefs | esp:prefs | 1 |
| hesap | meta | ays:meta | 3 |
| hesap | meta | esp:meta | 2 |
| hesap | meta | spi:meta | 2 |
| hesap | not | ays:defterklasor | 1 |
| hesap | plan_blogu | ays:plan | 1 |
| hesap | plan_blogu | ays:weeks | 2 |
| hesap | profil | ays:profile | 1 |
| hesap | profil | esp:profile | 1 |
| hesap | spi.basarim | spi:basarim | 1 |
| hesap | spi.chats | spi:chats | 1 |
| hesap | spi.haftaplan | spi:haftaplan | 2 |
| hesap | spi.seviye | spi:seviye | 1 |
| hkm | akis | hkm:bildirimler | 6 |
| hkm | akis | hkm:intents | 1 |
| hkm | akis | hkm:is_emirleri | 2 |
| hkm | bam | hkm:bam_isler | 1 |
| hkm | bam | hkm:bam_kayitlar | 1 |
| hkm | kisi_bilgisi | hkm:memories | 5 |
| hkm | kullanim | hkm:usage | 166 |
| hkm | sohbet | hkm:conversations | 168 |
| pc | planlama | pc:planlama | 1 |
| pc | tercih | pc:tercih | 4 |

#### Ret nedenleri (bağdaştırıcının metni)

| Bağdaştırıcı | Ne | Sayı |
|---|---|---:|
| not.defter | Başlığı da gövdesi de boş not kaydedilmez. | 1 |

#### Çökmeler

| Bağdaştırıcı | Ne | Sayı |
|---|---|---:|

#### Sessiz düşen girdi alanları (rotada ne okunan ne taşınamayan listesinde adı geçen)

| Rota | Ne | Sayı |
|---|---|---:|

#### Çıktıda tanımsız ya da NaN alan

| Bağdaştırıcı | Ne | Sayı |
|---|---|---:|
| plan.aysGun | araNeden | 7 |

#### Taşınamayan (bağdaştırıcının kendi listesi)

| Bağdaştırıcı | Ne | Sayı |
|---|---|---:|
| kayit.aysGun | blok hedefleri, durum, atlama nedeni: Plan motorunun bağdaştırıcısı (Plan.GOC.aysGun) | 7 |
| kayit.aysGun | dikkat dağılması sayısı (distractions): göremedim, taşınmaz | 7 |
| kayit.aysGun | doğru sayısı (correctQ): Soru motoru | 7 |
| kayit.aysGun | paragraf/problem sayıları ve serbest soru: Soru motoru | 7 |
| plan.aysGun | blok başlama anı (startedAt): planın saati değil; Kayıt motoru çalışma kaydının zamanı | 7 |
| plan.aysGun | blok saatleri: AYS bloklarının saati yoktu; bas/bit null | 7 |
| plan.aysGun | blok soru hedefi (targetQ), çözülen ve doğru soru (actualQ, correctQ): Soru motoru | 7 |
| plan.aysGun | dikkat dağılması sayısı (distractions): göremedim, taşınmaz | 7 |
| plan.aysGun | günün notu (note): Not motoruna | 7 |
| plan.aysGun | günün ritüeli (ritual): gün şablonundan gelir (aysSablon), gün kaydından taşınmaz | 7 |
| plan.aysGun | haftanın günü (dow): tarihten yeniden hesaplanır | 7 |
| plan.aysGun | kontrol listesi (checklist): Akademik alanın günlük ritüeli; göremedim | 7 |
| plan.aysGun | konu kimlikleri (subjectId, topicId): Akademik alanın müfredat bağı | 7 |
| plan.aysGun | kötü gün işareti (badDay, badDayTargets, badDaySoruYok; AYS state.js:1067): blokların «atlandı» durumu ve nedeni taşınır, işaret ve eski hedefler taşınmaz | 7 |
| plan.aysGun | paragraf/problem hedefleri ve serbest soru (paragraphTarget, problemTarget, paragraphActual, problemActual, freeQ, freeCorrect): Soru motoru | 7 |
| plan.aysGun | uyku saati (sleepHours): Kayıt motoru (Kayit.GOC.aysGun) | 7 |
| not.aysKonu | Konu adı konu durumunda yok (data/subjects.js); çağıran konuAdi(ders, konu) verirse başlık olur, vermezse konu kimliği. | 1 |
| not.aysKonu | Konu durumu, ölçümler (first/second) ve kapanış kuralı not değildir: Kayıt/Plan motorunda kalır. | 1 |
| not.aysKonu | Notun yazılma zamanı konu durumunda yok (firstAt/secondAt ölçüm zamanıdır): göç anı yazılır. | 1 |
| tekrar.aysKapanis | unutma: göremedim | 1 |
| tekrar.aysKapanis | zorluk (D) eski kayıttan çıkarılmadı: varsayılan D0(3), tahmin | 1 |
| tekrar.aysKapanis | ölçüm yüzdeleri (first/second) ve 75/70 eşikleri ölçüm kaydında kalır | 1 |
| not.defter | Başlık bağı yalnız aynı modülün notlarında aranır (bugünkü davranış: defter.js:691 modülün kendi listesine bakar). | 2 |
| not.defter | Boş klasör listesi (defterklasor/liste) not değil; bu bağdaştırıcı almaz, klasör ağacı notların klasor alanından yeniden çıkar. | 2 |
| not.defter | Medya dosyaları (IndexedDB «lifeos-defter-<modül>», yalnız o cihaz): ![[medya:KİMLİK]] başvurusu gövdede kalır, dosyanın kendisi bu kayda girmez. | 2 |
| not.defter | Başlık bağı yalnız aynı modülün notlarında aranır (bugünkü davranış: defter.js:691 modülün kendi listesine bakar). | 1 |
| not.defter | Boş klasör listesi (defterklasor/liste) not değil; bu bağdaştırıcı almaz, klasör ağacı notların klasor alanından yeniden çıkar. | 1 |
| not.defter | Medya dosyaları (IndexedDB «lifeos-defter-<modül>», yalnız o cihaz): ![[medya:KİMLİK]] başvurusu gövdede kalır, dosyanın kendisi bu kayda girmez. | 1 |
| not.defter | Başlık bağı yalnız aynı modülün notlarında aranır (bugünkü davranış: defter.js:691 modülün kendi listesine bakar). | 2 |
| not.defter | Boş klasör listesi (defterklasor/liste) not değil; bu bağdaştırıcı almaz, klasör ağacı notların klasor alanından yeniden çıkar. | 2 |
| not.defter | Medya dosyaları (IndexedDB «lifeos-defter-<modül>», yalnız o cihaz): ![[medya:KİMLİK]] başvurusu gövdede kalır, dosyanın kendisi bu kayda girmez. | 2 |
| kayit.spiVitals | günün notu (note): Not motoruna | 4 |
| kayit.spiVitals | semptomlar (symptoms, symptomsLogged) ve adet günü (period): Tahlil alanının türü, bu motorda yok | 4 |
| kayit.spiVitals | vitals sayıları etiketsiz: hepsi «eski kayıt» (karar 11) | 4 |
| kayit.spiProfil | etkinlik düzeyi (activity): hiçbir hedefe girmiyordu (nutri.js:74-82), taşınmaz | 1 |
| kayit.spiProfil | hedef dışı alanlar (koşullar: conditions; görünüm: theme, design; ad ve rol: name, role; sabitler: pinned; kimlik: id, createdAt): Çekirdek profil | 1 |

## Bağdaştırıcı hataları ve düzeltmeler

**Gerçek biçimde bozulan bağdaştırıcı yok.** SPİ vitals, SPİ profili, AYS günü, AYS konu belgesi ve Defter
notlarının gerçek alan adları bağdaştırıcıların okuduklarıyla birebir (`weightKg`, `heightCm`, `water`,
`waterSrc`, `blocks[].status/actualMin/skipReason`, `states[k].first/firstAt/note`, `baslik/govde/at/guncel`).

Düzeltmeler (ikisi de yalnız taşınamayan listesini tamamlar; bağdaştırıcı çıktısı değişmedi):

1. `motor/plan.js` `EKSIK.aysGun` (bağdaştırıcı `Plan.GOC.aysGun`). Gerçek AYS günündeki `badDay`, `ritual`,
   `dow`, `distractions` ne Plan'da ne Kayıt'ta okunuyor ne de listede adıyla söyleniyordu; AYS'nin
   `badDayTargets` ve `badDaySoruYok` alanları da (AYS `state.js:1067`). Eklendi: kötü gün işareti (blokların
   «atlandı» durumu ve nedeni zaten taşınıyor; işaret ve eski hedefler taşınmaz), ritüel (gün şablonundan
   gelir), haftanın günü (tarihten hesaplanır), dikkat dağılması (taşınmaz), blok `startedAt`. Var olan
   maddelere alan adları yazıldı (`note`, `sleepHours`, `paragraph*`, `problem*`, `freeQ`, `freeCorrect`,
   `actualQ`, `correctQ`). Test: `motor/plan.test.js` «göç AYS gün, gerçek biçim…» (gerçek alan kümesi,
   uydurma değer; eski listeyle kırmızı: `dow`, `ritual`, `badDay`, `badDayTargets` … düşüyor).
2. `motor/kayit.js` `EKSIK.spiProfil` (bağdaştırıcı `Kayit.GOC.spiProfil`). Profilin `id`, `name`, `role`,
   `createdAt`, `design`, `theme`, `pinned`, `conditions`, `activity` alanları yalnız Türkçe anlatılıyordu
   («koşullar, tema, sabitler»); adlarıyla yazıldı. Test: `motor/kayit.test.js` «göç SPİ profili, gerçek
   biçim…» (eski listeyle bu dokuz alan kırmızı).

## Kalanlar

Yalnız tanım; büyük ya da karar isteyen işler.

1. **Paketsiz koşu.** Cihaz paketi yok; 25 bağdaştırıcının 7'si gerçek kayıt gördü. Sahibin her cihazda
   «Bilgisayara gönder»inden sonra `python tools/gercek_kosu.py` yeniden koşulmalı; P6'dan önce kapı olarak.
2. **Söz verilen ama olmayan sahipler** (taşınamayan listesi «→ X motoru» diyor, X'te bağdaştırıcı yok):
   - AYS günü `paragraphTarget/Actual`, `problemTarget/Actual`, `freeQ/freeCorrect`, blok `targetQ/actualQ/
     correctQ` → «Soru motoru»: `motor/soru.js` `GOC`'ta gün bağdaştırıcısı yok (gerekli: `Soru.GOC.aysGun`).
     Bugün gerçek değerlerin hepsi 0 ya da boş: kayıp yok, paketle dolu gelebilir.
   - Günün notu (AYS günü `note`, SPİ vitals `note`) → «Not motoru»: `motor/not.js` `goc`'ta gün notu
     bağdaştırıcısı yok (gerekli: `Not.goc.gunNotu`). Bugün hepsi boş.
   - AYS konu durumu `states[k].state` ve `ornek` → `Not.goc.aysKonu` listesi «Kayıt/Plan motorunda kalır»
     diyor, ikisinde de konu bağdaştırıcısı yok. Gerçekte 1 konuda durum dolu. Yol motorunun adım durumuna
     mı gider: karar gerekir.
3. **İçerik taşıyan, sahipsiz koleksiyonlar:** `ays:plan` (1; üretilmiş yıllık plan, `meta.generatedAt`, 40
   hafta: türetilmiş sayılıp `goc.py` `TURETILMIS`'e mi girer, yoksa Plan bağdaştırıcısı mı?), `ays:weeks`
   (2; haftalık sözleşme: kapasite, soru hedefi, ana konular, imza → gerekli `Plan.GOC.aysHafta`),
   `spi:haftaplan` (2; hareket ve su haftalık planı → Plan ya da Kayıt). `ays:defterklasor` bilerek sahipsiz
   (klasör ağacı notlardan yeniden çıkar; boş klasör kaybolur). meta, profil, `esp.prefs`, `spi.basarim` ve
   `spi.seviye` (§0.1 arşiv), `spi.chats` ve HKM tabloları (sohbet, kullanım, kişi bilgisi, akış, BAM) bu
   motorların işi değil: Çekirdek ve King göçünde ele alınmalı.
4. **Sağlamlık.** Bağdaştırıcılar dizi öğesinin nesne olduğunu varsayar: `blocks:5` ya da `kestirmeler:[null]`
   atar (`motor/kayit.js:477`, `motor/plan.js:318`). Gerçek veride yok; olursa araç çökme diye sayar.
5. **Nedensiz ret.** Tekrar ve Soru bağdaştırıcıları reddederken `null` döner, neden vermez; araç bunları
   «boş» sayar. Paket gelince boş sayısı büyürse nedeni okumak için bu motorlara `reddedilen` gerekir.
6. **Araç sınırları.** Sessiz düşen denetimi üst düzey alanlarla sınırlı (iç içe `blocks[]` ve `states{}` bu
   koşuda ayrı betikle okundu). Paket anahtarlarından yalnız `lifeos.bilinc` yönlendirildi; Öğret, King dersi,
   Kavrat, Öğrenme motoru ve `Not.goc.ogren` anahtar biçimi ile `LIFEOS.USTA` (Node'da yok) gerektirir:
   paket gelene dek «sahipsiz» görünürler. `plan.aysGun` çıktısındaki `araNeden: undefined` bilerek
   (`|| undefined`), JSON'da düşer.
7. `tools/tools_dizin_kabul_test.py` üç yeni dosya commit'lenene dek kırmızı (yalnız `git ls-files`'ı sayar).

## Testler

- `python tools/gercek_kosu_test.py`: 19/19 yeşil. Sayılar; ret nedeni gruplu ve rakamsız; silinen kayıt
  bağdaştırıcıya gitmez; sahipsiz ve sessiz alan sayılır; içerik, değer ve profil adı basılmaz; canlı dosyaya
  `sqlite3.connect` yok ve canlı klasör bayt bayt aynı; geçici kopya silinir; çökmede çıkış 1, yer
  `motor/kayit.js:` ve `motor/plan.js:`, yine temiz.
- Motor testleri: kayıt 29/29, tekrar 21/21, not 26/26, soru 32/32, plan 24/24, yol 13/13.
- `belge_dizin_kabul_test.py` yeşil; `tools_dizin_kabul_test.py` yalnız commit'lenmemiş üç dosya için kırmızı.
- Gerçek koşu: çıkış 0, canlı 12 dosya değişmedi, geçici klasör kalmadı.
