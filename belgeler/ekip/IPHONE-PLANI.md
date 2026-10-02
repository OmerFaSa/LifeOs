# iPhone planı — LifeOS'un tamamı sade, öz, modern

> 2026-10-02 · Kullanıcı kararı: «Sistemin tamamını iPhone vibe'ına çeviriyoruz. iPhone'da
> sadelik olur; ne kullanıyorsan karşında olur, biter. Ben ekstra bir şey istemiyorum.»
>
> Bu dosya planın kendisi ve canlı durumudur (§8). Bir faz bitince durum satırı ve commit
> buraya yazılır; oturum yarıda kalırsa iş buradan sürer.

## 1. Ölçülen başlangıç (dolu örnek profil, 1440 × 900)

Gezinti betiği 58 ekranda 434 başlıklı kart saydı (kapalı sekmeler dahil). **Araç ölçüsü**
(§5: görünen, en dıştaki, küçük/gizli olmayan; Rütbe hariç): **188 açık kart, 3'ü aşan 22
ekran** (AYS 74 / 8 · SPİ 55 / 8 · ESP 59 / 6). En kalabalıklar:

| Ekran | Açık kart | Sayfa boyu |
|---|---|---|
| AYS Analiz › Ayrıntı | 23 | 2 078 px |
| ESP Rütbe · SPİ Rütbe · AYS Rütbe | 22 · 22 · 21 | ~2 500 px |
| ESP Dil | 21 | 972 px (sekmeli) |
| AYS Ayarlar › Genel | 19 | 4 728 px |
| ESP Tarih · ESP Stüdyo · ESP Analiz | 18 · 18 · 18 | 1 495 · 3 668 · 2 509 px |
| SPİ Hareket | 17 | 1 433 px |
| ESP Okuma | 16 | 1 575 px |
| ESP Merdiven · ESP Yazı · ESP Ayarlar | 12 · 12 · 12 | — |
| SPİ Testler · SPİ Analiz · SPİ Ayarlar | 11 · 11 · 11 | — |
| SPİ Bütçe | 10 | 1 331 px |
| AYS Telafi | 9 | 1 438 px |
| AYS İlerleme | 8 | 2 738 px |
| AYS Hedefler | 5 | 3 010 px |

Ölçüm aracı: `node tools/sadelik.js` (§5). Sayılar elle yazılmaz.

## 2. iPhone sözleşmesi

1. **Bir ekran, bir iş.** Ekranın işi ne ise o karşında durur; gerisi bir dokunuş ötededir
   (widget bağı, «Tümü», ⓘ, sayfa sonundaki «N bölüm gizli · Göster»).
2. **Açık kart ≤ 3.** İşin kendisi + en çok iki küçük widget. Ara sıra açılanlar tek satırlık
   şerittir (küçük), başvuru/açıklama/tekrar kartları baştan gizlidir.
3. **Sayfa boyu ≤ 1 200 px** (1440 × 900). Telefonda en çok iki ekran boyu.
4. **Ekranda açıklama yok.** Açıklama başlığın yanındaki ⓘ'dedir; kart alt yazısı en çok
   altı kelime; doktrin, araştırma, kılavuz metni ekranda durmaz.
5. **Uzun liste kısa gelir.** İlk 3–5 satır (ya da «şimdi» etrafı) + «Tümü».
   Geçmiş, istenince açılır.
6. **Sayılar küçük dönen widget'ta.** Durum sayıları (`LIFEOS.VITRIN.donen`) kesinlik
   işaretiyle; eksik veri sayı değil cümle.
7. **Grafik ≤ 1** ve yalnız ekranın işi grafikse (Analiz); en çok 180 px.
8. **Gezinme sakin.** Kenarda tek düğmeli sistem seçici, ikincil çekmeceler «Daha fazla»da,
   alt bölümler bölümlü seçicide; «Ayrıntı» sayfaları menüde yok.
9. **Hiçbir işlev silinmez, kalabalık gizlenir.** Gizli kart verisiyle ve koduyla durur
   (envanter kayıp 0). Kalıcı silme yalnız bir hafta hiç açılmayan ve kullanıcının onayladığı
   şey için (`belgeler/ekip/envanter/kaldirilan.json`).

Doktrin aynen: kural motoru otorite, eksik veri sıfır değil, sıfır bağımlılık, Türkçe metin,
SPİ sınır satırı (sayfa sonu) kalır. **Rütbe ekranları olduğu gibi kalır** (kullanıcı kararı).

## 3. Ekran türleri ve kalıpları

| Tür | Ekranlar | Açık kalan (iş) | Widget | Şerit (küçük) | Gizli |
|---|---|---|---|---|---|
| Bugün | 3 × Bugün | kahraman / ölçüm / sıradaki iş + akış | 2 dönen | — | büyük durum kartları (Günü düzenle'de) |
| Plan | Hafta · Program · Hedefler · SPİ Hedefler · ESP Merdiven | bu hafta / sıradaki haftalar / hedef katmanı / bu kademe | 1 dönen | sözleşme, özet, matris, tercih | geçmiş, ısı haritası, referans tabloları |
| Liste | Deneme · Testler · Notlar · Kitaplar · Kütüphanem | listenin kendisi | 1 dönen | süzgeç | yan istatistik, başvuru |
| Giriş | Soru çöz · Öğün · Mutfak · Oturum · Tekrar · Sınama | form / oturum | — | son kayıtlar (5) | açıklama, katalog |
| Analiz | İlerleme · Analiz · SPİ Analiz · ESP Analiz · Telafi | kural seçtiği ≤ 3 grafik | 1 dönen | öbür grafikler | meta (doluluk, denetim, sürtünme) |
| Ofis | Masalar · Danışma · Toplantı (3 ×) | günün brifingi + tek eylem | — | masalar, gündem | açıklama, geçmiş |
| Ayarlar | Genel · Profil (3 ×) | — (iOS Ayarlar listesi) | — | **her bölüm bir satır** | kılavuz, doktrin |
| Rütbe | 3 × Rütbe | aynen | — | — | — |

## 4. Araçlar

Var olan (bu oturumda kuruldu): dönen widget (`vitrin.js donen`), `SADE_GIZLI` (her
`app.js`), `kucukVarsayilan` (ekran nesnesi), ⓘ bilgi kartı (`kabuk.sayfaBasi`), «N bölüm
gizli · Göster», `App.UST` (menüde olmayan alt ekran).

Eklenecek: §5 ölçüleri; uzun liste kısaltıcı kalıbı (ilk N + «Tümü», ekran başına).

## 5. Ölçüm

`tools/envanter.js` her ekranda **açık kart** sayısını (görünen, küçük ve gizli olmayan bölüm)
ölçer; `tools/sadelik.js` iki yeni kural taşır:

- `acikKart` en çok 3 (Rütbe hariç)
- `boyHepsi` en çok 1 200 px (Rütbe hariç)

Önce **ölçüm** (kırmızı yapmaz); bir çekmecenin bütün ekranları bütçeye girince o çekmece için
zorunlu olur, Faz 7'de hepsi zorunlu.

## 6. Fazlar

| Faz | Kapsam | Hedef |
|---|---|---|
| 0 | Plan + ölçü (`acikKart`, `boyHepsi`) | başlangıç sayıları araçla |
| 1 | **Plan çekmecesi**: AYS Hafta · Program · Hedefler, SPİ Hedefler, ESP Merdiven | açık ≤ 3, boy ≤ 1 200 |
| 2 | **Çalışma**: AYS Konu çalış · Ders notları · Soru çöz · Deneme · Tekrar · Sınama; SPİ Testler · Öğün · Mutfak · Hareket · Bütçe; ESP Dil · Felsefe · Tarih · Ses · Okuma · Yazı | açık ≤ 3 |
| 3 | **Analiz**: AYS İlerleme · Analiz · Telafi; SPİ Analiz; ESP Analiz | ≤ 3 grafik, gerisi şerit |
| 4 | **Onaylar · Ofis · Kütüphanem** (3 ×) | brifing + tek eylem |
| 5 | **Ayarlar** (Genel, Profil; 3 ×) | iOS Ayarlar listesi |
| 6 | **Kabuk ve Merkez**: sayfa sonu, «nasıl okunur» şeridi, HKM yüzü | aynı dil |
| 7 | Kurallar zorunlu, telefon (390 px) turu, belgeler | bütçe kırmızıya bağlı |

Her faz sonunda: üç modülde `runtests` · `smoke` · `layoutcheck` · `a11ycheck` ·
`palettecheck`, depo kökünde `sadelik` · `envanter`, `build.py --denetle`, `ortak.py
--denetle`; sonra commit ve §8'e satır.

### Faz 1 kararları (ayrıntı)

- **AYS Hafta:** açık yalnız hafta (gezinme + yedi gün şeridi). Sözleşme imzalıysa şerit, imza
  bekliyorsa açık; «Haftanın özeti» şerit. Plan tamamlama geçmişi, sınava kadar, plan
  ızgarası, planın şekli, müfredat referansı gizli.
- **AYS Program:** dört istatistik → dönen widget (ilerleme, sınava kalan, planlanan soru).
  Isı haritası ve «Program» notu gizli. Zaman çizgisi **bu hafta + sonraki üç hafta**;
  «Tüm program · 40 hafta» ile açılır.
- **AYS Hedefler:** dönen widget (ana hedef, tahmini sıra, hedefe kalan). Açık yalnız hedef
  katmanları. Net matrisi, 24 tercih, OBP şerit. Tahmini sıra kartı, sıra referansları,
  yerleşen profilleri gizli. Kesinlik açıklama satırı ve medyan tekrarı kalkar.
- **ESP Merdiven:** açık yalnız bulunduğun kademe; öbür kademeler ve açıklamalar şerit/gizli.

Faz 1'de yapılan (testler: `AYS/src/tests/iphone.test.js`, `ESP/src/tests/iphone.test.js`):

- AYS Hafta: açık yalnız hafta şeridi + imza bekleyen sözleşme (imzalanınca o da şerit;
  `kucukVarsayilan` artık hesaplanır). Ders dengesi ve revizyon kaydı da gizli. Sözleşme
  kartındaki iki açıklama cümlesi ⓘ'de zaten vardı, ekrandan kalktı.
- AYS Program: dönen «Program» kartı; «Sıradaki haftalar» (bu hafta + 3) ve «Tüm program ·
  40 hafta» düğmesi (`program-tumu`). Varsayılan sınav tarihi TAHMİN etiketiyle. Sayfa başı
  «Bu haftayı aç» kalktı (bölümlü seçicide Hafta var).
- AYS Hedef: dönen «Hedef» kartı (ana hedef, tahmini sıra, hedefe kalan; az denemede cümle).
  Kesinlik satırı, medyan tekrarı ve katman tablosunun açıklama paragrafı kalktı.
- ESP Merdiven: dört açıklama paragrafı ekrandan kalktı (aynı öğreti `data/hints.js`'te,
  ⓘ'de); ölçülemeyen kapılar ve kör noktalar şerit; Yol'da yalnız şimdiki kademe açık.
- Ortak (`brand/ortak/kart.css`): katmanlı bölümde seçili sekmenin adını ikinci kez yazan
  başlık gözden kalktı (ekran okuyucuya kalır) — üç modülde.
- SPİ Hedefler zaten tek kart (ölçü bütçede); dokunulmadı.

Faz 1'de görülen, sonraki fazlara kalan:

- Hafta 1 253 px (imza bekleyen sözleşme açıkken). Sayfa sonundaki «Bu ekran nasıl okunur»
  şeridi (~56 px) ⓘ'ye taşınınca bütçeye girer — Faz 6'nın ilk işi, öne alındı (6a): şimdi
  1 197 px.
- ESP'de sayfa başlığı ekranın cümlesi («Merdiven henüz başlamadı.»); iPhone'da başlık addır,
  cümle ⓘ ya da widget'tadır — Faz 6.
- Dolu profilde ilk açılışta üç rozet bildirimi üst üste çıkıyor — Faz 6.

### Faz 2 kararları (ayrıntı)

Yapılan (2a, AYS; testler `AYS/src/tests/iphone.test.js` «Faz 2»):

- **AYS Dersler:** üç kapanış istatistiği → dönen «Kapanış» kartı. Açık: ders listesi ve
  konular (yan yana — raf kutuları DOM sırasıyla ikişer dizer, `subjectPanel` parçalara
  ayrıldı). Öncelik sırası ve seçili dersin künyesi şerit (anahtar `kucukVarsayilan`
  getter'ında hesaplanır); Sınav profilleri gizli; «emir değil öneri» notu ⓘ'de (hints: risk).
- **AYS Soru çöz:** «Çözüm kaydı» kartı → dönen «Çözüm» kartı (kayıt yokken oran cümle).
  Kaynaklarım, konu başına çözüm, çözülen sorular şerit.
- **AYS Tekrar:** Due/Borç istatistikleri kalktı (sekme rozeti + uyarı + ⓘ zaten söylüyor);
  gelecek yük, tekrar takvimi, defter alanları gizli; «Dokun veya boşluk tuşuna bas» kalktı.

Sıradaki (2b–2c; ekran görüntüleriyle incelendi, karar verildi — kodu yazılmadı):

- **AYS Soru çöz** hâlâ 1 293 px: fotoğraf kutusu alçalsın; «Notun isteğe bağlı — nerede
  takıldığını…» ve «Açılır pencere yok · Enter kaydeder» açıklamaları ⓘ'ye. **AYS Dersler**
  1 238 px (küçük kırpma yeter).
- **SPİ Testler** (`labs`): «Referans bandı» kartı sonuç satırlarındaki bantların tekrarı →
  gizli. Sayfa içindeki «Sınır» uyarısı sayfa sonundaki sınır satırının tekrarı → kalkar
  (sayfa sonu satırı KALIR, AGENTS §1.5). Sonuçlar kartındaki «Önem sırasına göre…» cümlesi
  ⓘ'ye; kart içindeki «Test gir» sayfa başı eylemini tekrarlıyor. «Sonraki kontrol» şerit.
- **SPİ Öğün** (`meals`): «Ev ölçüsü tanınır…» açıklaması ⓘ'ye; «Günlük hedef» şerit (ya da
  dönen kart: kcal/protein ↔ hedef); açık: öğün ekle + günün öğünleri + sık öğünler.
- **SPİ Mutfak** (`kitchen`, açık 6): açık pişen yemek + paylaştırma + yemeğin besin kartı;
  Hane, Evde ne var?, Kendi gıdaların şerit; açıklama satırları ⓘ'ye.
- **SPİ Hareket** (`move`): «Bu hafta hareket» halkaları ile «Antrenman haftası» çubukları
  AYNI haftayı iki kez gösteriyor → Antrenman haftası gizli. Günün yük emri + bu hafta tek
  dönen karta dönebilir (yük emri, toparlanma 73, hafta n/7). «Emri toparlanma belirler…» ve
  «Öneri toparlanma bandından gelir…» açıklamaları ⓘ'ye.
- **SPİ Bütçe** (`basket`): «Bütçenin yeri» (kural sırası tablosu) ve «Fiyatlar nereden
  geliyor?» gizli; açık talep tablosu + Sedef'in notu.
- **ESP Tarih** (`history`): açık şerit + dönemler; yüzyıl boşlukları ve dağılım şerit;
  `note` açıklamaları ⓘ'ye (ESP Merdiven'de yapılan gibi: önce `data/hints.js`'te aynı öğreti
  var mı bak, yoksa hint'e taşı, sonra ekrandan sil).
- **ESP Ses** (`studio`, açık 11, 3 636 px): her parça ayrı «TEKNİK» kartı — hepsi aynı
  başlık, yani aynı gizle anahtarı (`teknik`; `bolumler` tekrar anahtarı atar, tek tek
  yönetilemez). Tek «Parçalar» kartında kompakt satır (ad · eşik/hedef BPM · çubuk; dokununca
  geçmiş tablosu), ilk 5 + «Tümü». Müzik bölümünün başındaki Tezgâh şerit; Metronom ve Tekrar
  kaydet açık (iş bunlar), açıklama satırları ⓘ'ye; Parça ekle ve Paket iste şerit.
- **ESP Okuma** (`library`): «Not ekle»nin iki açıklama satırı ⓘ'ye; not listesi kompakt
  satır (metin + etiketler tek satır), ilk 5 + «Tümü».
- **Ölçünün görmediği:** araç yalnız VARSAYILAN sekmeyi ölçer (katmanlı bölümlerde öbür
  sekmeler `display:none`). ESP Dil / Felsefe / Yazı ve AYS Ders notları / Deneme / Sınama
  bütçede görünüyor ama öbür sekmeleri elle gezilmeli (Faz 0 elle sayımında ESP Dil 21 kart).

## 7. Bilinen riskler

- Testler kartları ekranda arar: gizlemek uygulama düzeyindedir (`Gizle.uygula`), çizimi
  değiştirmez; kart taşıyan testler etkilenmez. Çizimden çıkan tekrarlar için test güncellenir.
- Raf düzeni gizlemeden sonra yeniden ölçülür (2026-10-02 düzeltmesi); yeni şerit kesikte kalmaz.

## 8. Durum (canlı)

| Faz | Durum | Commit | Açık kart (toplam) |
|---|---|---|---|
| — | başlangıç (araç) | c689817 | 188 · aşan 22 ekran |
| 0 | ✅ ölçü: `acikKart`, `boyHepsi` (ölçüm), envanter.test 13 durum | 2f7df20 | 188 · aşan 22 |
| 1 | ✅ AYS Hafta · Program · Hedef, ESP Merdiven (SPİ Hedefler zaten bütçede) | 147c177 | 180 · aşan 21 |
| 6a | ✅ öne alındı: «Bu ekran nasıl okunur» şeridi her ekranda ⓘ kartına taşınır (`kabuk.railBilgiye`, `Gizle.uygula`'dan); terim kaybolmaz | 75a889a | 180 · aşan 21 (boy: Hafta 1 197) |
| 2a | ✅ AYS Dersler · Soru çöz · Tekrar | (bu commit) | 172 · aşan 19 (AYS 59/5 · SPİ 55/8 · ESP 58/6) |
| 2b | ⏭ sıradaki: SPİ Testler · Öğün · Mutfak · Hareket · Bütçe (kararlar yukarıda) | — | — |
| 2c | ⏭ ESP Tarih · Ses · Okuma; AYS Soru çöz/Dersler boy kırpması; sekmelerin elle turu | — | — |

## 9. Devir notu — sıradaki oturum buradan başlar

Oturum 2026-10-02'de bağlam doldu; iş yarıda değil, faz sınırında bırakıldı (her şey
commit'li, denetimler temiz). Sıradaki iş §8'deki ilk ⏭ satırı.

**Bir ekranı sadeleştirme kalıbı** (Faz 1–2'de oturdu):

1. Ekranın görüntüsünü al (aşağıdaki betik) ve kartları say: iş hangisi, gerisi ne?
2. Durum sayıları → `LIFEOS.VITRIN.donen({ id, ad, maddeler:[{ ust, sayi, cumle, vurgu,
   sistem, dugme }] })`; sayı `LIFEOS.SAYI.html({ deger, birim, kesinlik, formul })` ile
   (`measured / computed / estimated`; veri yoksa sayı değil cümle). Örnek:
   `AYS/src/js/screens/plan.js` `DonenProgram`, `target.js` `DonenHedef`.
3. Başvuru/açıklama/tekrar kartı → `app.js` `SADE_GIZLI[ekran]` (gizli); ara sıra açılan →
   ekranın `kucukVarsayilan`'ı (şerit). Duruma göre değişiyorsa getter: `week.js`,
   `ESP/.../ladder.js`, `subjects.js`. Anahtar `LIFEOS.Gizle.anahtar(başlık)`: Türkçe küçük
   harf, RAKAMLAR ve gün adları atılır, aynı anahtarlı ikinci bölüm yok sayılır.
4. Kart içindeki açıklama cümlesi → önce o ekranın `data/hints.js`'inde aynı öğreti var mı
   bak; varsa ekrandan sil, yoksa hint'e taşı (bilgi kaybolmaz, ⓘ'de durur).
5. Raf iki sütunu DOM sırasıyla ikişer dizer (`.card`/`.lrow` bir hücre, `kutu`/`donen` tam
   satır): yerleşimi sıra belirler (`subjects.js` render örneği).
6. Test: `AYS/src/tests/iphone.test.js` ya da `ESP/src/tests/iphone.test.js` kalıbı
   (`bolumle(ekran)` → `acik / kucuk / gizli`); SPİ için `SPI/src/tests/iphone.test.js` açılır
   ve `tests/index.html`'e eklenir. Önce test, sonra kod.

**Denetim sırası** (her faz sonunda; Windows'ta `export PATH="/c/Program Files/nodejs:$PATH"`
ve `PYTHONIOENCODING=utf-8`): değişen modülde `python build.py` → `node tools/runtests.js`;
üç modülde `node tools/smoke.js <4179|4189|4199>`, `layoutcheck`, `a11ycheck`,
`palettecheck`; `brand/ortak` değiştiyse `python tools/ortak.py --yay` ve üç `build.py`;
kökte `node tools/envanter.js` (kayıp 0), `node tools/sadelik.js` (§8'e sayı),
`build.py --denetle`, `ortak.py --denetle`. `runtests` yalnız özet basar; tek bir testin
sonucunu görmek için `/tests/` sayfası açılıp `window.__ROTA_TESTS__` / `__SPI_TESTS__` /
`__ESP_TESTS__` süzülür.

**Ekran görüntüsü** (sistem `python sistem/baslat.py --tarayicisiz` ile açıkken; AYS 4173,
SPİ 4183, ESP 4193; dolu örnek profil envanterden):

```js
// node ekran.js AYS week  -> AYS_week.png
const ENV = require('<depo>/tools/envanter.js');
const { chromium } = require('<depo>/AYS/node_modules/playwright');
const PORT = { AYS:4173, SPI:4183, ESP:4193 };
(async () => {
  const [ad, rota] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ reducedMotion:'reduce', viewport:{ width:1440, height:900 } });
  await p.goto('http://127.0.0.1:' + PORT[ad] + '/index.html');
  await p.waitForSelector('.site');
  const gec = await p.$('[data-act="setup-skip"]'); if(gec) await gec.click();
  await p.evaluate(ENV.DOLDUR_KAYNAK[ad]);
  await p.evaluate(a => window[a.ns].App.go(a.rota), { ns:ENV.MODUL[ad].ns, rota });
  await p.waitForTimeout(1200); await p.mouse.move(1430, 890);
  await p.screenshot({ path:ad + '_' + rota + '.png', fullPage:true });
  await b.close();
})();
```

**Değişmeyenler:** Rütbe ekranlarına dokunulmaz. Hiçbir işlev silinmez (envanter kayıp 0).
Kullanıcının kendi dosyaları commit'e girmez: `.gitignore` değişikliği, `veri/`,
`tools/veri_*.py`, `HKM/db/`. HKM `local_token` hiçbir çıktıya yazılmaz. Commit kimliği
kalıcı ayarlanmaz (`git -c user.name=… -c user.email=…`); bu makinede push kimlik bilgisi
yok — `git push origin main`'i depo sahibi koşar.

