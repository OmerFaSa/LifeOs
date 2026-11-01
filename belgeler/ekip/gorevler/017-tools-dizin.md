# 017 · `tools/` dizini (DIZIN.md)

**Durum:** bitti
**Dal:** `ag/017-tools-dizin`
**Efor:** orta
**Kabul testi:** `tools/tools_dizin_kabul_test.py`

## Amaç
Depo sahibi (2026-11-01): «optimizasyon ve organizasyonla sistemi düzenli hale getir». `tools/` altında ~75 dosya (denetim, yayın, ofis araçları, veri, ölçüm, kabul testleri, testler) tek düzlemde duruyor; hangisinin ne işe yaradığı ancak dosya açılarak anlaşılıyor. Yollar CI ve ofis araçlarında sabit olduğu için dosyalar TAŞINMAZ; onun yerine tek sayfalık bir dizin yazılır.

## Dokunulacak dosyalar
- `tools/DIZIN.md` (yeni) — başlık, bir paragraf açıklama, sonra tam olarak şu sekiz bölüm bu sırayla: `## Denetim`, `## Yayın`, `## Ofis`, `## Veri`, `## Ölçüm`, `## Kabul testleri`, `## Testler`, `## Diğer`. Her dosya tek satır: `` - `ad.py` — ne yapar, ne zaman koşulur (CI'da mı) `` (açıklama dosyanın kendi docstring/başlık yorumundan, uydurma yok). `*_kabul_test.py` → Kabul testleri (hangi görevin: NNN); diğer `*_test.py` ve `*.test.js` → Testler; `ortak.py`, `seviye.py`, `marka.py`, `vitrin.py` → Yayın; `ajan*.py`, `ofis_*.py`, `gorev_takip.py`, `kabul_js.py` → Ofis; `veri_*` → Veri; `olcum_*`, `perf`, `sayilar.py`, `kapsam.js` → Ölçüm; CI'da koşan denetimler → Denetim.

## Dokunma
- `tools/` altındaki hiçbir betik (taşıma, ad değiştirme, silme yok); CI; kabul testi dosyası.

## Kabul ölçütü
- `tools/` altındaki her izlenen dosya (md hariç) dizinde tam bir kez, en az 12 karakter açıklamayla; dizinde olmayan dosya adı yok.
- Bölümler tam olarak yukarıdaki sekiz başlık; kabul testleri ve testler doğru bölümde.

## Koşulacak testler
- `python tools/tools_dizin_kabul_test.py`

## Sonuç
- **Ne değişti:** `tools/DIZIN.md` yazıldı. `tools/` altındaki 74 izlenen dosya kendi başlık/docstring açıklamalarıyla sekiz bölümde (`Denetim`, `Yayın`, `Ofis`, `Veri`, `Ölçüm`, `Kabul testleri`, `Testler`, `Diğer`) listelendi.
- **Koşan testler:** `python tools/tools_dizin_kabul_test.py` -> `tools dizin kabul: 74 dosya, sekiz bolum, her biri bir kez ve aciklamali.`
- **Kabul testi:** `python tools/tools_dizin_kabul_test.py` -> `tools dizin kabul: 74 dosya, sekiz bolum, her biri bir kez ve aciklamali.` (çıkış 0)
- **Açık kalan:** yok
