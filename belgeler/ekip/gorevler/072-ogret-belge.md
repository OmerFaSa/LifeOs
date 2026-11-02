# 072 · Öğretme motoru belgeleri (KING-4 §D)

**Durum:** bekliyor
**Dal:** `ag/072-ogret-belge`
**Efor:** düşük
**Kabul testi:** `tools/ogret_belge_kabul_test.py`

## Amaç
Tek öğretme motoru (`brand/ortak/ogret.js`, `window.LIFEOS.OGRET`) üç modülün belgesinde kısa, doğru anlatılsın. Kaynak: `brand/ortak/ogret.js` başlık yorumu (sözler 1–4) ve `AYS/src/js/core/ogren.js` (`kingSoru`, `kingCevapla`, `tekrarDepo`). Koddan oku; kodda olmayanı yazma.

## Dokunulacak dosyalar
- `AYS/src/DURUSTLUK.md` — yeni kısa bölüm «Öğretme motoru»: teşhisin dört türü (kavram, işlem, dikkat, bilmiyor) ve kuralları, kanıt yoksa tür yok (uydurulmaz); 1, 3, 7 gün ve üçüncü doğruda konunun kapanması; vadesi gelen konuda **benzer** soru; kayıt `ays.king.tekrar` (konu başına; eski soru kimlikli kayıt taşınır, ham değer `ays.king.tekrar.yedek`'e bir kez yazılır), son yanlış `ays.ogret.son`; araçlar `ays_tekrarlarim`, `ays_neden_yanlis`.
- `SPI/src/MIMARI.md` — aynı bölüm SPİ için: `core/kingders.js` adaptörü, `spi.ogret.tekrar`, `spi.ogret.son`, `spi_tekrarlarim`, `spi_neden_yanlis`; SPİ teşhis koymaz (§1.5), soru kavram bilgisidir.
- `ESP/src/MIMARI.md` — aynı bölüm ESP için: `core/kingogret.js` adaptörü, `esp.ogret.tekrar`, `esp.ogret.son`, kartın kendi SRS'i (`srs.js`) değişmez; `esp_tekrarlarim`, `esp_neden_yanlis`.

## Dokunma
- Kod dosyaları, `brand/` (ortak dizin satırını Claude yazdı), `belgeler/ekip/KING-4.md` (yönetici yazar), kabul testi dosyası.

## Kabul ölçütü
- Kabul testi yeşil; bölümler kısa (her biri ≤ 25 satır), Türkçe, koddaki adlarla.

## Koşulacak testler
- `python tools/ogret_belge_kabul_test.py` (önce kırmızı, sonra yeşil)
- `python tools/belge_dizin_kabul_test.py`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). -->
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
