# Faz 1 · Modül kayıt boşlukları (2026-11-13)

Gerçek koşunun (gercek-kosu-20261113.md, «Kalanlar» 2-3) bulduğu sahipsiz koleksiyonları ve söz verilip
yazılmamış gün alanı bağdaştırıcılarını kapatma paketi. P6'dan (gerçek göç) önce.

## Özet

- **Sahipsiz üç koleksiyonun sahibi artık Plan motoru:** `Plan.GOC.aysHafta` (AYS hafta sözleşmesi),
  `Plan.GOC.aysPlan` (üretilmiş program ve tarihli istisnalar), `Plan.GOC.spiHaftaplan` (SPİ haftalık planları,
  beş türün hepsi). Gerçek veride: `ays:plan` 1 kayıt → 41 çıktı (1 program özeti + 40 hafta hedefi),
  `ays:weeks` 2 → 2, `spi:haftaplan` 2 → 2; ret 0, çökme 0, sessiz düşen alan 0, iç içe alanlarda da 0.
- **Söz verilen gün alanı bağdaştırıcıları yazıldı:** `Soru.GOC.aysGun` (AYS gününün soru sayıları) ve
  `Not.goc.gunNotu` (AYS günü, SPİ vitals, SPİ antrenman seansı, ESP günü ve seans notları). Gerçek veride
  ikisi de boş döner, çünkü girdiler gerçekten boş: yedi günün soru sayılarının hepsi 0 ya da boş (AYS'nin
  kendi `gunSorusu` toplamı da 0), notların hepsi boş.
- **Bir söz yanlıştı, düzeltildi:** Plan'ın listesi blokta çözülen soruyu (`actualQ`) yalnız «Soru motoru»na
  yolluyordu. Oysa `Kayit.GOC.aysGun` bu sayıyı zaten çalışma kaydının `sayi` alanına yazıyor. Şimdi iki liste
  de bunu söylüyor: sayı iki görünümde duruyor ve toplanmamalı.
- Taşınamayan listeleri artık bağdaştırıcının adını veriyor (`→ Soru.GOC.aysGun`, `→ Not.goc.gunNotu`).
  Plan: `aysGun`. Kayıt: `spiVitals`, `spiAntrenman`, `aysGun`, `espGun`.
- Kod değişikliği küçük ve yerel. `motor/not.js` içinde yalnız `aysKonu` ile `aysVideo` arasına tek bir
  bağdaştırıcı eklendi; dosyanın sonuna dokunulmadı (orada ekip arkadaşının HKM bloğu var).

## Plan bağdaştırıcıları

Kaynaklar satır satır okundu. AYS: `core/state.js` (137 normWeek, 215 weekStart, 307-344 defaultWeek),
`screens/week.js` (789-847 imza, revizyon, devir), `core/auto.js` (119-131 taslak), `core/planner.js`
(296-341 generate, 430-476 replan), `core/istisna.js` (93-101 depo, 403-411 kayıt), `data/curriculum.js` (24-27
`R.PLAN.startISO`). SPİ: `core/haftaplan.js` (174-243 yeni ve dogrula, 245-306 uyku, madde ve işaret).

Plan motorunda hafta düzeyinde bir şekil yoktu. Bu yüzden iki küçük şekil tanımlandı ve `motor/plan.js`'te
yorumla yazıldı:

- **Hafta hedefi** `{ id, tur:'hafta-hedefi', hafta, bas, ad, kaynak, soru, yuk, deneme, kontrol, konular:[{ ad,
  dersId, konuId, soru?, dogruluk? }] }`. Sözleşmede bunlara ek olarak `dk`, `davranis`, `devir`, `imza` ve
  `revizyonlar` da bulunur. Programda ise `evre`, `kapi` ve `tekrar` bulunur.
- **Hafta şablonu** `{ id, tur:'hafta-sablonu', alan, ad, kaynak, olusturma, guncelleme, gunler:[7 × { sablon:{ ad,
  ritual, bloklar }, uyku?, ogunler? }], maddeler?, yapilan?, suMl? }`. `gunler[i]` hiç çevrilmeden
  `haftaPlani`'nin gün girdisi olarak kullanılabilir. Test bunu gösteriyor: hareket şablonu haftaPlani'na
  girince bloklar doğru günlere düşüyor.

| Koleksiyon | Bağdaştırıcı | Çıktı | Taşınamayan (adıyla `Plan.EKSIK`) |
|---|---|---|---|
| `ays:weeks` (`weeks/wNN`) | `aysHafta(w, baslangic)` | Hafta hedefi. `soru`=questionTarget, `dk`=capacityMin, `yuk`=planLoad, konular=mainTopics, `devir`=carryIn, `imza`=signedAt, revizyonlar | Hafta başı tarihi kayıtta yok: çağıran `baslangic` verirse hesaplanır, vermezse `null`. Numarası (`n`) olmayan kayıt alınmaz. Gerçekleşme haftada saklanmıyordu, günlerden yeniden sayılır. |
| `ays:plan` (`plan/main`) | `aysPlan(doc, baslangic)` | 1 program özeti (`hafta`, `uretildi`, `dusen` konular) + her hafta için bir hafta hedefi (`evre`, `kapi`, `tekrar`) | Üreticinin iç sayıları (`meta`'nın 17 alanı, adlarıyla) profilden yeniden hesaplanır. `phaseLabel`, `theme`, `topics` yeniden çıkarılır. Düşen konunun `subjectName` ve `freq` alanları müfredattan okunur. |
| `ays:plan` (`plan/istisnalar`) | `aysPlan` (`items` biçimi) | İstisna `{ bas, bit, ara, gunlukDakika, neden }`, yani haftaPlani gün girdisinin `ara` / `gunlukDakika` değerleri | Takvimden türetilen istisna (`carpan`, `kind`) saklanmıyordu. |
| `spi:haftaplan` (`haftaplan/<id>`) | `spiHaftaplan(p)` | Hafta şablonu. Hareket ve kısa uyku şablon bloğu olur (`alan` hareket / uyku, `zaman` korunur). Uyku saatleri kipten yedi güne açılır. Öğün metinleri, su hedefi, maddeler ve işaretler (`isaret` + `sayac` → `yapilan`) korunur. | Plan motoru `zaman` alanını okumaz. Uyku kipi seçimi taşınmaz (değerler taşınır). Öğün, uyku ve alışkanlık için motorda bir şekil yok: veri şablonda durur, ama planlanmaz. Kayıt motorunda alışkanlık türü yok. |

**Karar: `ays:plan` türetilmiş sayılmadı.** Program profilden yeniden üretilebilir, ama tam olarak değil.
`replan` geçmiş haftaları korur, kapanmayan konuları öne alır (planner.js:430-476) ve düşen konular listesini
tutar. Bunlar yeniden üretilemeyen geçmiştir. Bu yüzden hafta hedefi olarak taşındı. Yalnız üreticinin iç
sayıları (kapsama, tavan, havuz) taşınmadı, çünkü onlar yeniden hesaplanır.

## Soru ve Not gün alanları

**`Soru.GOC.aysGun(day)`** (AYS state.js:379-412, calc.js:224 `gunSorusu`) → `{ id:'ays:gun:<gün>', tarih,
kaynak, etiket:'eski kayıt', kalemler:[{ kalem:'blok'|'paragraf'|'problem'|'serbest', hedef, cozulen, dogru, … }] }`.
Yalnız çözülmüş kalemler yazılır. Hedefi olup çözülmemiş kalem (her güne yazılan 18'lik paragraf ve problem
varsayılanı gibi) soru kaydı sayılmaz. AYS de 0 ile boşu ayırmıyordu. Test, kalemlerin toplamının AYS'nin kendi
`R.Calc.gunSorusu` toplamına eşit olduğunu doğruluyor. `Soru.EKSIK.aysGun` yeni eklendi; Soru'da daha önce böyle
bir liste yoktu.

**`Not.goc.gunNotu(liste, { zaman, modul, koleksiyon })`**: her gün ya da seans için tek not üretir.
- Kimlik `gun/<modül>/<koleksiyon>/<gün|id>`, bağlam `{ modul, gun }`. Seansta buna `kayit:'workouts/<id>'` eklenir.
- Oluşturma anı günün başı (UTC 00:00), çünkü gün kayıtlarında notun yazıldığı an yok. ESP günü `updatedAt`
  alanını güncelleme anı olarak taşır.
- ESP seans notları ayrı not olmaz: günün notuna `disc: …` biçiminde eklenir.

Hangi listenin hangi sözünü karşıladığı:

| Söz veren liste | Alan | Artık |
|---|---|---|
| `Plan.EKSIK.aysGun`, `Kayit.EKSIK.aysGun` | `paragraph*`, `problem*`, `freeQ`, `freeCorrect`, blok `targetQ/actualQ/correctQ` | `Soru.GOC.aysGun`. `actualQ` Kayıt'ta da duruyor: liste düzeltildi. |
| `Plan.EKSIK.aysGun` (+ `Kayit.EKSIK.aysGun`'a eklendi) | `note` | `Not.goc.gunNotu` (days) |
| `Kayit.EKSIK.spiVitals` | `note` | `Not.goc.gunNotu` (vitals) |
| `Kayit.EKSIK.spiAntrenman` | seans `note` | `Not.goc.gunNotu` (workouts) |
| `Kayit.EKSIK.espGun` | `note`, `sessions[].note` | `Not.goc.gunNotu` (days) |

## Gerçek koşu sonrası

`tools/gercek_kosu.js` `ROTA`: `ays:weeks`, `ays:plan`, `spi:haftaplan` artık Plan'a gidiyor. `ays:days` rotasına
`soru.aysGun` ve `not.gunNotu` eklendi; `spi:vitals`, `spi:workouts` ve `esp:days` rotalarına `not.gunNotu`
eklendi (`notListe` artık ek seçenek de alıyor).

`python tools/gercek_kosu.py` kopya düzeneğiyle yeniden koşuldu ve yalnız sayılar okundu: çıkış 0, çökme 0. Ret
yalnız eskisi kadar: 1 (not.defter). Sessiz düşen alan 0. Yeni bağdaştırıcılarda tanımsız alan 0; `plan.aysGun`
`araNeden` eskisi gibi, bilerek. Tablo gercek-kosu-20261113.md'de, «Modül boşlukları sonrası» başlığı altında:

| Rota | Bağdaştırıcı | Okunan | Çıktı | Boş | Önce |
|---|---|---:|---:|---:|---|
| ays:plan | plan.aysPlan | 1 | 41 | 0 | sahipsiz |
| ays:weeks | plan.aysHafta | 2 | 2 | 0 | sahipsiz |
| spi:haftaplan | plan.spiHaftaplan | 2 | 2 | 0 | sahipsiz |
| ays:days | soru.aysGun | 7 | 0 | 7 | yok |
| ays:days | not.gunNotu | 7 | 0 | 7 | yok |
| spi:vitals | not.gunNotu | 4 | 0 | 4 | yok |

Araç yalnız üst düzey alanları denetler. Bu yüzden üç plan koleksiyonunun iç içe alan adları (4 düzeye dek)
ayrıca okundu. Bunun için tek seferlik bir betik kullanıldı; depoya girmedi. Betik `gercek_kosu.kopyalar` ve
`goc.goc` ile çalıştı ve yalnız ad ile sayı bastı. Sonuç: bağdaştırıcıda ya da EKSIK'te adı geçmeyen alan 0,
geçici klasör kalmadı. Gerçek biçim: programda 40 hafta var, `plan/istisnalar` kaydı yok, iki hafta kaydında da
`n` var, haftalık planlar `su` ve `hareket` türünde.

Sahipsiz kalanlar bilerek sahipsiz: meta, profil, `esp.prefs`, `spi.basarim`, `spi.seviye`, `spi.chats`,
`ays:defterklasor`, `gun_kopya`, `pc:*` (Çekirdek göçünün işi). HKM tablolarının sahibi ekip arkadaşının
paketinde.

## Testler

- `node motor/plan.test.js` 27/27 (+3). Testler:
  - AYS hafta sözleşmesi: alanlar, tarih, numarasız kayıt.
  - AYS programı: özet, haftalar, düşenler; istisnalar (ara ve geçici süre, bozuk tarih alınmaz).
  - SPİ: beş tür. Hareket şablonu haftaPlani'na giriyor, dinlenme günü (`null`) sırayı kaydırmıyor, su
    maddeleri ve işaretler korunuyor, uyku kipi açılıyor, kısa uyku seçili günlere düşüyor, bilinmeyen tür `null`.
  - Her testte, gerçek alan kümesinde okunmayan alanın EKSIK'te adıyla geçtiği denetleniyor. Önceki testte de
    `Object.keys(P.GOC)` her bağdaştırıcının bir listesi olduğunu denetliyor.
- `node motor/soru.test.js` 33/33 (+1). Yalnız çözülmüş kalem yazılıyor, toplam AYS `gunSorusu` ile aynı, boş gün
  `null`, soru alanlarının hepsi okunuyor ya da EKSIK'te geçiyor.
- `node motor/not.test.js` 27/27 (+1). AYS, SPİ vitals, SPİ seansı ve ESP günü (seans notu dahil) denetleniyor.
  Boş not yazılmıyor, kimlik, bağlam ve kaynak yolu doğru, modülsüz çağrı atıyor.
- `node motor/kayit.test.js` 29/29, `tekrar` 21/21, `yol` 13/13 (değişmedi).
- `python tools/gercek_kosu_test.py`: hepsi yeşil (+2). Yeni rotalar sahibine gidiyor ve içerik basılmıyor.
- `python tools/belge_dizin_kabul_test.py`: yeşil.

## Açık konular

1. **Hafta başı tarihi P6'da verilmeli.** `aysHafta` ve `aysPlan` tarihi `baslangic` girdisinden hesaplıyor.
   Bu tarih AYS profilinin `startDate` alanından gelmeli, o yoksa `2026-09-14` kullanılmalı. Gerçek koşuda
   verilmedi, bu yüzden `bas` null. `ays:profile` kaydı Çekirdek göçünde okunurken P6 bu tarihi geçirmeli.
2. **Plan motoru yeni şekilleri henüz tüketmiyor.** Hafta hedefi, program ve istisna şimdilik ekranların verisi.
   İstisnayı günlere açmak (gün girdisine `ara` ve `gunlukDakika` olarak) ile hafta hedefini hafta görünümüne
   bağlamak kabuk ekranlarını bağlama paketinin işi. Hafta şablonunun `gunler`'i bugün de doğrudan çalışıyor.
3. **Alışkanlık ve öğün planının şekli yok.** SPİ `su` ve `serbest` maddeleri ile işaretleri, öğün metinleri ve
   uyku saatleri şablonda taşınıyor, ama hiçbir motor bunları planlamıyor ya da saymıyor. Kayıt motoruna
   alışkanlık türü eklemek ayrı bir karar (sahibin «bir özellik bir yer» ilkesi).
4. **Blokta çözülen soru iki yerde.** Kayıt'ta çalışma kaydının `sayi` alanında, Soru'da günlük kalemin
   `cozulen` alanında. Günlük ya da haftalık toplamı alan kod yalnız Soru'yu kullanmalı.
5. **AYS konu durumu hâlâ sahipsiz** (gercek-kosu Kalanlar 2, üçüncü madde). `Not.goc.aysKonu` listesi «Kayıt/Plan
   motorunda kalır» diyor, ama ikisinde de konu bağdaştırıcısı yok. Bu bir gün alanı değil. Ekip kuralı
   gereği `not.js`'te yalnız gün alanı bölgesine dokunulduğu için liste düzeltilmedi. Sahibi büyük olasılıkla
   Yol motorunun adım durumu; Yol paketine karar olarak bırakıldı.
6. **İç içe alan denetimi araçta yok.** Bu turda tek seferlik bir betikle yapıldı. Paket gelince aynı denetim
   gerekecek; araca kalıcı olarak eklenmesi ayrı bir iş.
