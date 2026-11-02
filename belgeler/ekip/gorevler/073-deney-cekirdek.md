# 073 · Kişisel deney motoru: hesap çekirdeği (KOLAY Faz 5a)

**Durum:** bitti   <!-- bekliyor | sürüyor | bitti | takıldı -->
**Dal:** `ag/073-deney-cekirdek`
**Efor:** yüksek
**Kabul testi:** `tools/ays_deney_kabul_test.py`

## Amaç
`belgeler/ekip/KOLAY-PLANI.md` §Faz 5 — «bende işe yarayan» kanıtlı liste. Bu görev yalnız
hesap çekirdeği: koşulları kod sırayla dağıtır, sonucu fark + güven aralığıyla verir, yetersiz
veride sonuç vermez. Ekran (kart, sürgü) ve modüller arası bağ sonraki görevlerdir (Claude Code).
Kalıp için `AYS/src/js/core/gelecek.js`'i oku (sözler başlığı, `R.X = (function(){…})()`, saf işlevler).

## Dokunulacak dosyalar
- `AYS/src/js/core/deney.js` — YENİ. `window.R = window.R || {}; R.Deney = (function(){ … })();`
  Başta gelecek.js gibi «Sözler» yorumu: kod hesaplar, model yok (AGENTS §1.1); eksik veri sıfır
  değildir (§1.2); «etki» yalnız tamamlanan kendi deneyinden, öteki bulgular «ilişki»; SPİ teşhis
  ve doz alanına girmez (§1.5). Dışa açılan:
  - `ata(deney, tarih)` → `deney.kosullar[0]` ya da `[1]`; `deney = { id, baslangic:'YYYY-MM-DD', gun, kosullar:[a, b] }`.
    Belirlenimci; gün sırası iki günlük bloklara bölünür, her blokta bir a bir b; bloktaki sıra
    `id` + blok numarasından türeyen basit bir karmayla (rastgele sayı üreteci YOK). Aralık dışı → `null`.
  - `sonuc(deney, olcumler, bugun)` → `{ durum, n:{[a]:sayı,[b]:sayı}, fark, aralik:[alt, üst], anlamli, etiket, neden }`.
    `olcumler = [{ tarih, deger }]`; `deger` null/NaN olan gün sayılmaz. Kol başına `MIN_KOL = 5`
    geçerli değerin altı → `durum:'yetersiz'`, `fark` ve `aralik` null, `neden` kısa Türkçe cümle.
    Yoksa `fark = ortalama(b) − ortalama(a)`, aralık %95 Welch (Welch–Satterthwaite serbestlik
    derecesi; t değeri df 1–30 için tablo, üstünde 1,96). `bugun ≥ baslangic + gun` → `durum:'tamam'`,
    `etiket:'etki'`; önce → `durum:'suruyor'`, `etiket:'ara sonuç'`. `anlamli` = aralık sıfırı içermiyor.
  - `surguAcik(sonuc)` → yalnız `durum === 'tamam'` iken `true`.
  - `MIN_KOL` sabiti de dışa açılır.
- Tarih için `R.U.addDays`, `R.U.diffDays` (core/utils.js) kullan; kendi tarih hesabını yazma.

## Dokunma
- HTML, CSS, `brand/`, `AYS/src/index.html`, `AYS/src/tests/index.html` (betik etiketlerini Claude Code ekler).
- `gelecek.js` ve öteki çekirdek dosyalar; ekran dosyaları.
- Kabul testi dosyası.

## Kabul ölçütü
- Atama belirlenimci; 14 günde 7/7; her iki günlük blokta bir a bir b; aralık dışı null.
- Kol başına 5'ten az geçerli değer → `yetersiz`, fark/aralık null, neden dolu.
- null değer sayılmaz (n yalnız geçerli günleri sayar).
- Bilinen veride fark 2, aralık [0,433; 3,567] (±0,002); `etki`, `anlamli:true`, sürgü açık.
- Süren deneyde etiket «etki» değil, sürgü kapalı; sıfırı kesen aralıkta `anlamli:false`.

## Koşulacak testler
- `python tools/ays_deney_kabul_test.py` (önce kırmızı, sonra yeşil)
- `python tools/kabul_js_test.py`

## Sonuç
<!-- Antigravity doldurur; dört satır da dolu olmalı (yoksa «yok»). Pilot eksik bırakılanı bir kez geri gönderir. -->
- **Ne değişti:** `AYS/src/js/core/deney.js` eklendi (`R.Deney`). Başta doktrin sözleri tanımlandı. Belirlenimci bloklu koşul atama (`ata`), eksik veriyi sıfır saymayan ve kol başına en az 5 geçerli ölçüm arayan Welch %95 güven aralıklı sonuç motoru (`sonuc`), `surguAcik` ve `MIN_KOL` dışa aktarıldı; kabul testindeki Date/String `includes` uyumu için tolerans sağlandı.
- **Koşan testler:** `python tools/ays_deney_kabul_test.py` -> `ays deney kabul: bloklu atama, eksik veri, yetersiz veride sonuc yok, Welch araligi, etki yalniz tamamlanan deneyde.` · `python tools/kabul_js_test.py` -> `kabul_js temiz: ifade, promise, window, localStorage, hazirlik, gercek modul dosyasi, hatalar.`
- **Kabul testi:** `tools/ays_deney_kabul_test.py` yeşil.
- **Açık kalan:** yok
