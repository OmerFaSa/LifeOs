# 011 · ESP serbest oturumda günlük Türkçe süreler

**Durum:** bitti   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/011-esp-sure`
**Efor:** orta   <!-- düşük (flash_lite = Gemini 3.8 Flash) | orta (flash) | yüksek (pro; flash ile aynı model) -->
**Kabul testi:** `tools/esp_sure_kabul_test.py`

## Amaç
ESP Bugün'deki serbest giriş (`ESP.Parse.parseSession`) «yarım saat İspanyolca», «1 buçuk saat gitar», «iki saat
İngilizce» girişlerini «süre girilmemiş» diye düşürüyor. Süre artık ortak okuyucudan gelir:
`LIFEOS.TurkceSayi.sure(metin)` → `{ dakika, bas, son }` (brand/ortak/turkcesayi.js; dört modül aynı kuralı kullanır).

## Dokunulacak dosyalar
- `ESP/src/js/core/parse.js` — `parseSession` süreyi `window.LIFEOS.TurkceSayi.sure` ile okur (ÇAĞRI ANINDA eriş;
  yükleme sırasına güvenme). Okuyucu yoksa bugünkü `SURE` kuralı yedek olarak kalır. Sayım (kelime/kart/sayfa/tekrar),
  disiplin eşleşmesi ve `unmatched` nedenleri aynen.
- `ESP/src/js/core/komut.js` — aynı süre okuması varsa aynı yardımcıya bağla (yoksa dokunma).
- `ESP/src/tests/` altındaki ilgili test dosyası — yeni kenarlar (yeni test dosyası açma: test sayfası HTML'dir).

## Dokunma
- `tools/esp_sure_kabul_test.py` (kabul testi), `brand/ortak/turkcesayi.js` ve modüllerdeki kopyası (ortak çekirdek Claude Code'da).
- `ESP/src/js/core/state.js`, `store.js`, `ui.js`, `components.js`, HTML ve CSS.

## Kabul ölçütü
- «yarım saat İspanyolca» → lang 30; «bir buçuk saat İspanyolca» → 90; «1 buçuk saat gitar» → music 90; «çeyrek saat gitar» → 15; «iki saat İngilizce» → 120.
- «1 saat 20 dk gitar» → 80; «30 dk İspanyolca» ve «45 dakika kitap okudum» aynen.
- «30 dk İspanyolca 20 kelime» → 30 dk ve sayım 20; süresiz «İspanyolca çalıştım» satır üretmez.

## Koşulacak testler
- `python tools/esp_sure_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd ESP && node tools/runtests.js <kendi ESP portun>`
- `python tools/yazi.py --denetle`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). Pilot eksik bırakılanı bir kez geri gönderir. -->
- **Ne değişti:** ESP.Parse.parseSession ve ESP.Komut.dakika süre okuması için window.LIFEOS.TurkceSayi'ye bağlandı (çağrı anında erişim; okuyucu yoksa yerel SURE kuralı yedek); ESP/src/tests/parse.test.js ve plans.test.js içine yeni süre kenar durumları eklendi.
- **Koşan testler:** python tools/esp_sure_kabul_test.py -> esp sure kabul: yarim, bucuk, ceyrek, yaziyla; bilesik ve eski bicimler; sayim korunur. · python tools/yazi.py --denetle -> Yazı denetimi: temiz · cd ESP && node tools/runtests.js 4733 -> 2596/2597 gecti  ·  1 kaldi
- **Kabul testi:** python tools/esp_sure_kabul_test.py -> esp sure kabul: yarim, bucuk, ceyrek, yaziyla; bilesik ve eski bicimler; sayim korunur.
- **Açık kalan:** runtests.js 4733'teki 1 kaldi (King 3.0 uyanma asenkron zamanlayıcı testi; dokunulmayan ortak kod).
