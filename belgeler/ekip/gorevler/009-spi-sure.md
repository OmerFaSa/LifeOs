# 009 · SPİ hızlı girişte günlük Türkçe süreler

**Durum:** bekliyor   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/009-spi-sure`
**Efor:** orta   <!-- düşük (flash_lite = Gemini 3.8 Flash) | orta (flash) | yüksek (pro; flash ile aynı model) -->
**Kabul testi:** `tools/spi_sure_kabul_test.py`

## Amaç
SPİ'de hızlı giriş (`SP.Quick.parseMove`) süreyi tek `SURE_RE` eşleşmesiyle okuyor. «1 saat 20 dk yürüyüş» 60 dakika
yazılıyor (20 dakika kayboluyor); «yarım saat», «1 buçuk saat», «bir saat», «çeyrek saat» hiç tanınmıyor ve kayıt
düşüyor. Kullanıcı konuştuğu gibi yazar; ölçülen dakika doğru yazılmalı.

## Dokunulacak dosyalar
- `SPI/src/js/core/quickentry.js` — süre okuma tek yardımcıda: rakam ya da yazıyla sayı (bir…on), «buçuk» (+½),
  «yarım» (½), «çeyrek» (¼), «X saat Y dk/dakika» bileşiği; `parseMove` ve aynı süre kalıbını kullanan diğer
  işlevler (ör. `parseNap`) bu yardımcıyı kullanır. 600 dk sınırı ve «hangi hareket» eşleşmesi aynen kalır.
- `SPI/src/tests/quickentry.test.js` — yeni kenarların tarayıcı testleri (dosya yoksa ilgili test dosyasına ekle).

## Dokunma
- `tools/spi_sure_kabul_test.py` (kabul testi).
- `SPI/src/js/core/state.js`, `ui.js`, `components.js` ve `brand/ortak` kopyaları.

## Kabul ölçütü
- «1 saat 20 dk yürüyüş» → 80 dk, Tempolu yürüyüş; «2 saat 15 dk bisiklet» → 135.
- «yarım saat yürüyüş» → 30; «1 buçuk saat koşu» ve «bir buçuk saat bisiklet» → 90; «bir saat» → 60; «iki saat» → 120; «çeyrek saat koşu» → 15.
- Eski biçimler aynen: «45 dk», «1 saat», «2,5 saat» (150), «90 dakika».
- Süre yoksa null; 600 dakikayı aşan süre null.

## Koşulacak testler
- `python tools/spi_sure_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd SPI && node tools/runtests.js <kendi SPİ portun>`
- `python tools/yazi.py --denetle`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). Pilot eksik bırakılanı bir kez geri gönderir. -->
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
