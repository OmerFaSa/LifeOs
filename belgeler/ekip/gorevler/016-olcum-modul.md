# 016 · Tek komutla modül ölçümü (`tools/olcum_modul.js`)

**Durum:** bitti
**Dal:** `ag/016-olcum-modul`
**Efor:** orta
**Kabul testi:** `tools/olcum_modul_kabul_test.py`

## Amaç
KING-4 §O: «ölçmeden düzeltme yok». «Ölçüm 1c» sayıları elle, geçici betiklerle alındı; bir sonraki tur aynı sayıları tek komutla yeniden almalı (önce/sonra). Araç modülün `src/`'sini kendi sunucusunda açar, Playwright (modülün `node_modules/playwright`'ı) ile ölçer, tek JSON yazar ve kısa bir tablo basar.

## Dokunulacak dosyalar
- `tools/olcum_modul.js` (yeni) — `node tools/olcum_modul.js <AYS|SPI|ESP> [--port N] [--json yol] [--tekrar 3]`. Sunucu: `python -m http.server <port> --bind 127.0.0.1 -d <MOD>/src` (port doluysa çıkış 2, `tools/portmuhafiz` deseni). Rotalar: AYS `R.App.NAV` öğelerinin `id`'leri, SPİ `SP.App.SECTIONS[].views[].route`, ESP `ESP.App.SECTIONS()[].views[].route`; geçiş `X.App.go(r)` + iki `requestAnimationFrame`. Sayfa hazır: `.site` görünür.
  - `acilis`: her tekrarda yeni bağlam; `goto` → `.site`; `cizimMs` (süre), CDP `Performance.getMetrics`'ten `betikMs` (ScriptDuration), `stilMs` (RecalcStyleDuration), `yerlesimMs` (LayoutDuration); medyan; `tekrar`.
  - `kapsam`: `page.coverage` JS ve CSS, açılış + bütün rotalar; `cssKB`, `cssKullanilanYuzde`, `jsIslev` (adlı işlev), `jsKosanYuzde`.
  - `depo`: `addInitScript` ile `Storage.prototype.getItem/setItem` ve `JSON.parse` sayılır (rota geçişleri sırasında); `rotaBasinaOkuma`, `rotaBasinaYazma`, `rotaBasinaAyristirma`, `enCokOkunan` ([[anahtar, sayı]] ilk 5).
  - `rota`: rotalar bir kez gezilir (ısınma), sonra `browser.startTracing` (`devtools.timeline`) ile ikinci tur: `sayi`, `stilHesabi` (UpdateLayoutTree olay sayısı / rota), `yerlesim` (Layout / rota), `enYavas` (ilk 5 rota ve ms).
  - Çıktı: `{ modul, tarih, acilis, kapsam, depo, rota }`.

## Dokunma
- Uygulama kodu, `brand/`, modüllerin `tools/` klasörü, CI. Kabul testi dosyası.

## Kabul ölçütü
- `node tools/olcum_modul.js SPI --port 4389 --json <dosya>` çıkış 0, JSON'daki alanlar kabul testindeki aralıklarda.
- AYS ve ESP'de de çalışır (elle bir kez koş, sonucu Sonuç'a yaz).

## Koşulacak testler
- `python tools/olcum_modul_kabul_test.py`

## Sonuç
- **Ne değişti:** `tools/olcum_modul.js` yazıldı. Belirtilen parametrelerle (`<AYS|SPI|ESP> [--port N] [--json yol] [--tekrar 3]`) modülün `src/` klasörünü `http.server` ile açıp port muhafızı denetimi yapar; Playwright ile açılış (çizim, betik, stil, yerleşim ms medyanı), kapsam (CSS KB, CSS kullanılan %, JS adlı işlev sayısı ve koşan %), depolama (rota başına Storage okuma/yazma, JSON.parse ve en çok okunan 5 anahtar) ve rotaları (ısınma sonrası DevTools tracing ile UpdateLayoutTree ve Layout sayıları, en yavaş 5 rota) ölçüp JSON çıktısı yazar ve konsola özet tablo basar.
- **Koşan testler:** `python tools/olcum_modul_kabul_test.py` -> `olcum modul kabul: acilis, kapsam, depo, rota alanlari dolu ve akla yatkin.` | `node tools/olcum_modul.js AYS --port 4731` -> çıkış 0 | `node tools/olcum_modul.js ESP --port 4733` -> çıkış 0
- **Kabul testi:** `python tools/olcum_modul_kabul_test.py` -> `olcum modul kabul: acilis, kapsam, depo, rota alanlari dolu ve akla yatkin.` (çıkış 0)
- **Açık kalan:** yok
