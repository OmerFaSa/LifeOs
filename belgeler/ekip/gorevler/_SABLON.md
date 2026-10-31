# NNN · Görevin kısa adı

**Durum:** bekliyor   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/NNN-kisa-ad`
**Efor:** orta   <!-- düşük (flash_lite) | orta (flash) | yüksek (pro; ölçülen 2026-10-31: flash ile aynı model) -->
**Kabul testi:** `tools/ornek_kabul_test.py`   <!-- Claude Code yazar, görevle commit eder; şu an kırmızı. Yeni dosya (CI listesinde değil); birleştirirken CI'a eklenir. Kanca değiştirtmez. Yoksa satırı sil. -->

## Amaç
Ne yapılacak ve neden (kullanıcının sözü varsa tırnakla).

## Dokunulacak dosyalar
- `yol/dosya` — ne değişecek

## Dokunma
- Bu görevin dışında kalan her şey; özellikle: …
- Kabul testi dosyası.

## Kabul ölçütü
- «Şu girdiyle şu çıktı» biçiminde, denetlenebilir maddeler; her madde kabul testinde bir sınama.

## Koşulacak testler
- `python tools/ornek_kabul_test.py` (önce kırmızı, sonra yeşil)
- `python tools/…_test.py`
- `cd AYS && node tools/runtests.js 4378` (gerekiyorsa)

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). Pilot eksik bırakılanı bir kez geri gönderir. -->
- **Ne değişti:**
- **Koşan testler:**
- **Kabul testi:**
- **Açık kalan:**
