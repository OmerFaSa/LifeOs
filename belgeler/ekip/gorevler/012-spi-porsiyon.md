# 012 · SPİ öğün girişinde buçuklu porsiyon

**Durum:** bitti   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/012-spi-porsiyon`
**Efor:** orta   <!-- düşük (flash_lite = Gemini 3.8 Flash) | orta (flash) | yüksek (pro; flash ile aynı model) -->
**Kabul testi:** `tools/spi_porsiyon_kabul_test.py`

## Amaç
SPİ serbest öğün girişi (`SP.Parse.parseMeal`) «1 buçuk porsiyon pilav»ı 1 porsiyon (180 g) yazıyor; doğrusu 1,5
(270 g). «iki buçuk dilim ekmek» 2 dilim, «çeyrek porsiyon» 1 porsiyon oluyor: kalori yanlış. Miktar artık ortak
okuyucudan gelir: `LIFEOS.TurkceSayi.miktar(metin)` → `{ sayi, bas, son }` (brand/ortak/turkcesayi.js).

## Dokunulacak dosyalar
- `SPI/src/js/core/parse.js` — `parseMeal` (ve kullandığı miktar yardımcısı) miktarı `window.LIFEOS.TurkceSayi.miktar`
  ile okur (ÇAĞRI ANINDA eriş). Okuyucu yoksa bugünkü kural yedek. Gram miktarla ölçeklenir; `cert`, `source`, `portion`
  alanları ve yiyecek eşleşmesi aynen.
- `SPI/src/tests/` altındaki ilgili test dosyası — yeni kenarlar (yeni test dosyası açma).

## Dokunma
- `tools/spi_porsiyon_kabul_test.py` (kabul testi), `brand/ortak/turkcesayi.js` ve kopyası.
- `SPI/src/js/core/state.js`, `store.js`, `ui.js`, `components.js`, `quickentry.js` (görev 009'da), HTML ve CSS.

## Kabul ölçütü
- «1 buçuk porsiyon pilav» ve «bir buçuk tabak pilav» → pilav, 1.5, 270 g; «iki buçuk dilim ekmek» → beyaz-ekmek, 2.5, 75 g; «çeyrek porsiyon pilav» → 0.25, 45 g.
- Eski: «2 yumurta» → 2, 110 g; «yarım ekmek» → 0.5, 15 g; «1,5 porsiyon pilav» → 1.5, 270 g; yalnız «pilav» → 1, 180 g.

## Koşulacak testler
- `python tools/spi_porsiyon_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd SPI && node tools/runtests.js <kendi SPİ portun>`
- `python tools/yazi.py --denetle`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). Pilot eksik bırakılanı bir kez geri gönderir. -->
- **Ne değişti:** SPI/src/js/core/parse.js içinde miktar yardımcısı eklendi; parseMeal miktarı çağrı anında window.LIFEOS.TurkceSayi.miktar ile okuyor, okuyucu yoksa bugünkü kurala (rakam ve sayı sözcüğü) dönüyor. SPI/src/tests/parse.test.js dosyasına buçuklu/çeyrek porsiyon ve yedek kural testleri eklendi.
- **Koşan testler:**
  - python tools/spi_porsiyon_kabul_test.py -> spi porsiyon kabul: bucuklu ve ceyrek miktar, gram ve kalori olceklenir; eski bicimler.
  - cd SPI && node tools/runtests.js 4742 -> 2888/2889 gecti  ·  1 kaldi
  - python tools/yazi.py --denetle -> Yazı denetimi: temiz
- **Kabul testi:** tools/spi_porsiyon_kabul_test.py -> spi porsiyon kabul: bucuklu ve ceyrek miktar, gram ve kalori olceklenir; eski bicimler. (geçti)
- **Açık kalan:** SPI runtests çıktısındaki 1 kalan ('king.test.js' sesli sohbet uyanma), görev öncesinde de aynı şekilde kırmızıydı ve dokunulmayan brand/ortak bölgesine aittir; bu görev kapsamına giren bir açık yoktur.
