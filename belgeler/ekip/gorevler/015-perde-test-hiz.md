# 015 · Perde testleri gerçek zamanı beklemesin

**Durum:** bekliyor
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
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
