# 010 · AYS konuşarak girişte uyku ve çalışma süresi

**Durum:** bitti   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/010-ays-sure`
**Efor:** orta   <!-- düşük (flash_lite = Gemini 3.8 Flash) | orta (flash) | yüksek (pro; flash ile aynı model) -->
**Kabul testi:** `tools/ays_sure_kabul_test.py`

## Amaç
AYS'de konuşarak giriş (`R.Entry.parseUyku`, `parseSure`) saatten sonraki dakikayı ve «buçuk/yarım/çeyrek»i
tanımıyor: «7 saat 30 dk uyudum» 7 saat, «1 saat 15 dk matematik» 60 dk yazılıyor; «7 buçuk saat uyudum» ve
«yarım saat fizik» reddediliyor. Ölçülen süre (XP ve rozetler yalnız ölçülen dakikayı sayar) doğru yazılmalı.

## Dokunulacak dosyalar
- `AYS/src/js/core/entry.js` — süre okuma tek yardımcıda: rakam ya da yazıyla sayı (bir…on), «buçuk» (+½), «yarım» (½),
  «çeyrek» (¼), «X saat Y dk/dakika» bileşiği; `parseUyku` saati, `parseSure` dakikayı bundan alır. Soru/paragraf/problem
  sayacı olan cümle süre sayılmaz (bugünkü gibi); 24 saat ve 960 dk sınırları aynen.
- `AYS/src/tests/entry.test.js` — yeni kenarların tarayıcı testleri (dosya yoksa ilgili test dosyasına ekle).

## Dokunma
- `tools/ays_sure_kabul_test.py` (kabul testi).
- `AYS/src/js/core/state.js`, `store.js`, `ui.js`, `components.js` ve `brand/ortak` kopyaları.

## Kabul ölçütü
- Uyku: «7 saat 30 dk» → 7.5; «7 buçuk saat» ve «yedi buçuk saat» → 7.5; «6 saat 45 dakika» → 6.75; «8 saat», «7,5 saat», «5 saat uyuyabildim» aynen.
- Süre: «1 saat 15 dk matematik» → 75; «yarım saat fizik» → 30 (ayt-fizik); «bir buçuk saat matematik» → 90; «çeyrek saat» → 15; «45 dakika», «2 saat» aynen.
- «30 soru matematik 45 dakika» süre değil (soru kaydı); dersi olmayan süre null; «uyudum» tek başına null.

## Koşulacak testler
- `python tools/ays_sure_kabul_test.py` (önce kırmızı, sonra yeşil)
- `cd AYS && node tools/runtests.js <kendi AYS portun>`
- `python tools/yazi.py --denetle`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). Pilot eksik bırakılanı bir kez geri gönderir. -->
- **Ne değişti:** AYS/src/js/core/entry.js içinde sureOku tek yardımcısı tanımlandı; yarım/çeyrek, buçuk, bileşik (saat+dakika), tek saat ve tek dakika kalıpları eklendi. parseUyku saati, parseSure dakikayı sureOku üzerinden alacak şekilde bağlandı; soru/paragraf sayacı korundu, 24 saat ve 960 dk sınırları korundu. AYS/src/tests/entry.test.js dosyasına yeni uyku ve süre kenar testleri eklendi.
- **Koşan testler:**
  - python tools/ays_sure_kabul_test.py -> ays sure kabul: uyku saat+dakika ve bucuk, sure saat+dakika, yarim, ceyrek, yaziyla; soru sayaci korunur.
  - cd AYS && node tools/runtests.js 4721 -> 3122/3123 gecti  ·  1 kaldi
  - python tools/yazi.py --denetle -> Yazı denetimi: temiz
- **Kabul testi:** tools/ays_sure_kabul_test.py yeşil.
- **Açık kalan:** node tools/runtests.js 4721 koşusundaki 1 kalan test (king.test.js: King uyanma) brand/ortak kopyasındaki önceden var olan zamanlama testidir; görev öncesinde de 3120/3121 ile aynı şekilde kalıyordu.
