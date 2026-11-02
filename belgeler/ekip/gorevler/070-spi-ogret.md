# 070 · SPİ öğretme motoru adaptörü: kavram sorusu, 1/3/7 tekrar, King araçları (KING-4 §D)

**Durum:** bekliyor
**Dal:** `ag/070-spi-ogret`
**Efor:** orta
**Kabul testi:** `tools/ogret_spi_kabul_test.py`

## Amaç
KING-4 §D: AYS, SPİ ve ESP'nin öğretme parçaları **tek öğretme motoru** olur (`brand/ortak/ogret.js`, `window.LIFEOS.OGRET`; Claude yazdı, oku, değiştirme). SPİ'de bugün yalnız ders var (`SP.KingDers.ders`), soru yok. Bu görev SPİ'yi motora bağlar: King «set kavramını anlat» dersinin sonunda «Anladım, soru sor» der, «bana soru sor» SPİ'de de kart getirir, yanlış cevap motorun 1/3/7 takvimine girer, «bugünkü tekrarlarım» ve «neden yanlış yaptım» araçları çalışır.

AGENTS §1: soru, seçenekler ve doğru cevap **koddan ve `data/ogrenme.js`'ten**; metin uydurulmaz, kavramın tanımı aynen kullanılır. SPİ teşhis koymaz (§1.5): soru yalnız kavram bilgisidir.

## Motor (oku: `brand/ortak/ogret.js`, kopyası `SPI/src/js/core/ogret.js`)
`const O = window.LIFEOS.OGRET` — çağrı anında oku (yükleme sırası farklı olabilir).
- `O.bul(liste, metin, x => [ad, …])` konu eşleştirme; `O.secenek(dogruMetin, havuz)` → `{ sec, dogru:'A'…}` ya da null.
- `O.depo(anahtar)` localStorage kaydı; `O.vade(depo, bugunISO)` vadesi gelen `[{ kavram, n, … }]`.
- `O.cevap({ tekrar, son, bugun }, g)` → `{ isabet, not, teshis, satirlar }`: takvimi ve son yanlışı yazar. `g = { id, kavram, konu, soru, secilen, dogru, secMetin, dogruMetin, cozum }`.
- `O.araclar({ modul:'spi', tekrar, son, ad:kavramId => okunur ad, bugun })` → iki okuma aracı.

## Dokunulacak dosyalar
- `SPI/src/js/core/kingders.js` — `SP.KingDers` genişler:
  - `ders(konu)`: çıktı aynı; eşleştirme `O.bul(SP.OGRENME_KAVRAMLAR, konu, c => [c.title])`; `soruVar:true` (adayı ≥ 4 kavram varsa).
  - `soru(konu)` → `{ id:'<kavram id>|<doğru harf>', konu:c.title, soru:'Hangi kavramın tanımı: «<c.definition>»', sec(4), kaynak, not }` ya da null. Adaylar: `title` ve `definition` dolu kavramlar (< 4 ise null). Konu varsa `O.bul`; bulunmazsa null. Konu yoksa: önce `O.vade(depo('spi.ogret.tekrar'), bugün)`'ün ilk geçerli kavramı, not `'Tekrar (' + (n+1) + '. tur): aynı kavram.'`; yoksa takvimde hiç olmayan ilk kavram (liste sırası), not `''`; o da yoksa ilk aday. Seçenekler `O.secenek(c.title, öteki başlıklar)`. `kaynak`: `'SPİ · öğrenme kavramı'`, `ready_for_app` değilse sonuna `' · doğrulanmadı, uzman incelemesi bekliyor'`. Sorulan sorunun seçenekleri bellekte (`id → sec`) tutulur ki `cevapla` seçilen metni bilsin.
  - `cevapla(id, harf)` → `{ dogru, cozum, not }` ya da (bilinmeyen kavram/boş kimlik) null. `O.cevap({ tekrar:depo('spi.ogret.tekrar'), son:depo('spi.ogret.son'), bugun:() => SP.U.todayISO() }, …)`; `cozum = satirlar.concat(['Tanım: ' + c.definition])`; `not` motorun notu.
  - `araclar()` → `O.araclar({ modul:'spi', … ad:id => kavramın başlığı })`.
- `SPI/src/js/app.js` — `kartlar` içine (ders satırının yanına) `soru:konu => SP.KingDers.soru(konu)`, `cevapla:(id, harf) => SP.KingDers.cevapla(id, harf)`. Başka satıra dokunma.
- `SPI/src/js/core/kingarac.js` — `liste()` dönüşüne `SP.KingDers.araclar()` eklenir (motor ya da KingDers yoksa boş dizi).
- `SPI/src/tests/kingders.test.js` — kenarlar: soru seçenekleri farklı, yanlış → takvim, üçüncü tekrar doğrusu kavramı kapatır (`bitti`), boş kimlik null.
- `tools/king_kapsam.json` yalnız kapsam testi isterse.

## Dokunma
- `brand/` (motor ve King dosyaları), `SPI/src/js/core/ogret.js` (üretilmiş kopya), `index.html` dosyaları, `screens/`, `state.js`, `store.js`, `data/`, `HKM/`, dist ve build.js, kabul testi dosyası.
- Kendi 1/3/7 takvimini, çeldiricisini ya da eşleştiricisini yazma: motorunkini çağır.
- Yeni Model işlevi, yeni ekran metni.

## Kabul ölçütü
- Kabul testinin altı bölümü: ders aynı + `soruVar`; soru biçimi, doğru harf, tanım aynen; yanlış/doğru cevapta takvim ve son yanlış; vadesi gelen kavram önce, yoksa sorulmamış kavram; araçlar ve satırı; `app.js`/`kingarac.js` bağlantısı, `kingders.js`'te kendi 1/3/7'si yok.
- SPİ takımı yeşil; `node tools/king_kapsam.js --modul=spi --port=<senin portun>` yeşil.

## Koşulacak testler
- `python tools/ogret_spi_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd SPI && node tools/runtests.js <senin portun>`
- `node tools/king_kapsam.js --modul=spi --port=<senin portun>`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). -->
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
