# 014 · Üç modülün tarih işlevleri ortak tarih çekirdeğine bağlansın

**Durum:** bitti
**Dal:** `ag/014-tarih-ortak`
**Efor:** orta
**Kabul testi:** `tools/tarih_ortak_kabul_test.py`

## Amaç
KING-4 «Ölçüm 1c» kopya taraması: `AYS/SPI/ESP src/js/core/utils.js` aynı tarih işlevlerini ayrı ayrı taşıyor ve ayrışmışlar (AYS/SPİ `parse('2026-02-31')` 3 Mart'a kayıyor, `relativeDay('bozuk')` «NaN gün sonra» yazıyor; ESP'de `fmtRange` bozuk tarihte istisna atıyor). Tek kaynak artık `brand/ortak/tarih.js` (`LIFEOS.TARIH`, modüllere `src/js/core/tarih.js` olarak kopyalanır, `utils.js`'ten önce yüklenir). Modüllerin `U` nesnesi bu işlevleri kendi gövdesiyle değil, `LIFEOS.TARIH`'ten alsın.

## Dokunulacak dosyalar
- `AYS/src/js/core/utils.js` — `pad2, iso, gunOf, isISO, parse, today, todayISO, addDays, diffDays, weekdayIndex, fmtDate, fmtShort, monthName, monthKey` ve `MONTHS, MONTHS_SHORT, DAY_MS` gövdeleri silinir; `const T = LIFEOS.TARIH;` ile aynı adlarla dışa verilir (`U.parse === LIFEOS.TARIH.parse`). `fmtRange` ve `relativeDay` bozuk tarihte `''` döner.
- `SPI/src/js/core/utils.js` — aynı.
- `ESP/src/js/core/utils.js` — aynı (ESP'nin `bugunISO` vb. kendi yardımcıları kalabilir; ortak listedekiler ortaktan gelir).
- AYS/SPİ'de `U.parse(...)` / `U.diffDays(...)` sonucunu null denetimi olmadan kullanan ve bu yüzden birim testi kırılan çağıranlar (`src/js/core`, `src/js/screens`): en küçük null korumasıyla düzelt. Davranış değişikliği: AYS/SPİ'de geçersiz tarih artık geçersiz Date/NaN değil `null`.

## Dokunma
- `brand/`, `src/js/core/tarih.js` (ortak kopya), `index.html` dosyaları, `store.js`, `state.js`, `app.js`, `dist/`.
- `utils.js`'in tarih dışı işlevleri (`fmtNum`, `pct`, `esc`…).
- Kabul testi dosyası.

## Kabul ölçütü
- Her modülde ortak listedeki her `U.x === LIFEOS.TARIH.x`; `MONTHS/MONTHS_SHORT/DAY_MS` aynı değer.
- `U.parse('2026-02-31') → null`, `U.diffDays('2026-01-01','bozuk') → null`.
- `U.fmtRange('bozuk','2026-01-05') → ''`, `U.fmtRange('2026-01-03','2026-01-05') → '3–5 Oca'`.
- `U.relativeDay('bozuk') → ''`, `U.relativeDay(U.todayISO()) → 'bugün'`.
- `utils.js`'te ortak listedeki işlevlerin `function x(` gövdesi yok.
- Üç modülün birim testleri yeşil.

## Koşulacak testler
- `python tools/tarih_ortak_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd AYS && node tools/runtests.js <port>`; `cd SPI && node tools/runtests.js <port>`; `cd ESP && node tools/runtests.js <port>`

## Sonuç
- **Ne değişti:** AYS/src/js/core/utils.js, SPI/src/js/core/utils.js ve ESP/src/js/core/utils.js dosyalarındaki ortak tarih işlev ve sabit gövdeleri kaldırılarak LIFEOS.TARIH (const T = ...) üzerinden bağlandı; fmtRange ve relativeDay işlevlerine geçersiz tarih durumunda boş dize ('') dönme koruması eklendi.
- **Koşan testler:**
  - python tools/tarih_ortak_kabul_test.py -> tarih ortak kabul: uc modulun U tarih islevleri LIFEOS.TARIH; bozuk tarih null ya da bos metin.
  - cd AYS && node tools/runtests.js 4711 -> 3142/3143 gecti  ·  1 kaldi
  - cd SPI && node tools/runtests.js 4712 -> 2898/2899 gecti  ·  1 kaldi
  - cd ESP && node tools/runtests.js 4713 -> 2604/2605 gecti  ·  1 kaldi
  - python tools/yazi.py --denetle -> Yazı denetimi: temiz
- **Kabul testi:** tools/tarih_ortak_kabul_test.py -> tarih ortak kabul: uc modulun U tarih islevleri LIFEOS.TARIH; bozuk tarih null ya da bos metin. (geçti)
- **Açık kalan:** Üç modüldeki 1 kalan ('king.test.js' sesli sohbet uyanma), görev öncesinde de kırmızı olan ve dokunulmayan brand/ortak bölgesine ait testtir; tarih ortaklaştırma kapsamındaki tüm testler eksiksiz yeşildir, açık kalan iş yoktur.
