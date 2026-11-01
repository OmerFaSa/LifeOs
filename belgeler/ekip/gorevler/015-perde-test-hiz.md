# 015 · Perde testleri gerçek zamanı beklemesin

**Durum:** bitti
**Dal:** `ag/015-perde-test-hiz`
**Efor:** orta
**Kabul testi:** `tools/perde_test_hiz_kabul_test.py`

## Amaç
KING-4 «Ölçüm 1c»: AYS birim testlerinin %54'ü (19,6 / 36,6 sn) 32 testte gerçek zaman beklemesi. En büyük parça `src/tests/perde.test.js`: on takım modül başına ~8,9 sn (`await bekle(520)`, `bekle(P.HABERCI_MS + 300)` = 3,3 sn…), üç modülde ~27 sn. Her oturum ve Testçi bu süreyi ödüyor. Testler aynı davranışı sınamaya devam etsin ama saati test ilerletsin.

## Dokunulacak dosyalar
- `AYS/src/tests/perde.test.js`, `SPI/src/tests/perde.test.js`, `ESP/src/tests/perde.test.js` — dosyanın içinde küçük bir sahte saat yardımcısı: test süresince `window.setTimeout/clearTimeout` (ve perde süreyi `Date.now`/`performance.now` ile ölçüyorsa onları) değiştirir, `ilerlet(ms)` ile zamanlayıcıları sırayla çalıştırır, `finally` içinde gerçeklerini mutlaka geri koyar. `await bekle(N)` yerine `ilerlet(N)` (gerekirse ardından bir mikro görev beklemesi). Üç dosya ad alanı dışında aynı kalsın.

## Dokunma
- `src/js/core/perde.js` ve bütün uygulama kodu (yasak bölge); `brand/`; `harness.js`; `tools/`.
- Testlerin sınadığı davranış: hiçbir `it(` ve `expect(` silinmez ya da gevşetilmez (sayı ve anlam aynı); yalnız bekleme yöntemi değişir.
- Kabul testi dosyası.

## Kabul ölçütü
- Her modülde `perde.test.js`'teki on takımın süre toplamı ≤ 800 ms (şimdi ~8 900 ms).
- Her modülde `perde.test.js`'te `it(` ≥ 53, `expect(` ≥ 103.
- Üç modülün bütün birim testleri yeşil (sahte saat sızmaz: sonraki takımlar gerçek saati kullanır).

## Koşulacak testler
- `python tools/perde_test_hiz_kabul_test.py` (önce kırmızı, sonra yeşil; üç modülün runtests'ini 4378/4388/4398'de koşar)

## Sonuç
- **Ne değişti:** `AYS/src/tests/perde.test.js`, `SPI/src/tests/perde.test.js`, `ESP/src/tests/perde.test.js` içine sahte saat yardımcısı (`saatKur`, `saatKaldir`, `ilerlet`, `saatle`) eklendi. Test süresince `window.setTimeout/clearTimeout`, `setInterval/clearInterval`, `Date.now` ve `performance.now` yönetilip `finally` içinde asılları geri konuyor; gerçek zaman bekleyen 11 test `await saatle` ve `await ilerlet(ms)` ile hızlandırıldı. Test (`it(` 53) ve beklenti (`expect(` 103) sayıları korundu; on takımın süresi modül başına ~8,9 sn'den ~180-260 ms'ye indi.
- **Koşan testler:** `cd AYS && node tools/runtests.js 4721` -> `3143/3143 gecti` · `python tools/yazi.py --denetle` -> `Yazı denetimi: temiz` · `python tools/ortak.py --denetle` -> `Ortak kaynak: kopyalar kaynakla ayni (179 dosya, 537 kopya).`
- **Kabul testi:** `python tools/perde_test_hiz_kabul_test.py` -> `AYS: perde takimlari 199 ms · SPI: perde takimlari 191 ms · ESP: perde takimlari 178 ms · perde test hiz kabul: uc modulde perde takimlari <= 800 ms, testler eksiksiz ve yesil.`
- **Açık kalan:** brand/ klasörü görev gereği dokunulmaz olduğundan `tools/seviye.py --denetle` ayrışma gösterir; testteki sahte saat yardımcısı ana klasörde `brand/seviye/perde.test.js` içine yayılmalı.
