# Görev kuyruğu (Antigravity)

Depo sahibinin kararı (2026-10-31): tasarım dışındaki tanımı net işleri
Antigravity yapar; Claude Code görevi yazar, gözden geçirir, `main`'e alır.

## Antigravity için akış

1. **Önce `AGENTS.md`'yi oku.** §1 sözleşmedir; görev onunla çelişiyorsa işi
   yapma, görev dosyasının «Sonuç» bölümüne nedenini yaz.
2. Yalnız `C:\Users\ASUS\LifeOs-ag` klasöründe çalış. `C:\Users\ASUS\LifeOs`
   (Claude Code'un klasörü) ve `C:\Users\ASUS\LifeOS-Sistem` (çalışan kopya)
   açılmaz, değiştirilmez.
3. Sıradaki görev: bu klasörde «Durum: bekliyor» olan en küçük numaralı dosya.
4. Görev dalını `main`'den aç:
   `git switch -c ag/<numara>-<kısa-ad> main`
5. Görevde yazanı yap; yazmayanı yapma. «Dokunma» listesindeki dosyalara
   dokunma. Belirsiz bir yer varsa tahmin etme, «Sonuç»a soru olarak yaz.
6. Görevdeki testleri koş. Tarayıcı testlerinde **yalnız aşağıdaki portlar**
   (Claude Code aynı anda öbür portları kullanıyor olabilir):
   `cd AYS && node tools/runtests.js 4378` · `cd SPI && node tools/runtests.js 4388`
   · `cd ESP && node tools/runtests.js 4398`. Python testleri her yerde koşar
   (`python tools/<ad>_test.py`). `smoke`, `layoutcheck`, `palettecheck`,
   `perfcheck`, `entegre` koşulmaz: onları birleştirmeden önce Claude Code koşar.
7. Görev dosyasında «Durum: bitti» yap, «Sonuç» bölümünü doldur (ne değişti,
   hangi test koştu, çıktısı, açık kalan), aynı dalda commit et ve push et:
   `git push -u origin ag/<numara>-<kısa-ad>`. Commit kimliği:
   `git -c user.name=OmerFaSa -c user.email=omerfaruksagsozz@gmail.com commit`
8. `main`'e merge etme, push etme. Kullanıcıya «ag/… bitti» de; gerisi Claude Code'da.

## Değişmez kurallar (özet; asıl metin AGENTS.md)

- Sıfır bağımlılık: paket, çerçeve, derleyici eklenmez. Python'da yalnız
  standart kütüphane.
- Ekranda görünen metin düzgün Türkçe. Kod yorumu ASCII olabilir.
- Eksik veri sıfır değildir; sayıyı kod üretir, uydurulmaz.
- `brand/ortak/` tek kaynaktır: modüllerdeki kopyalar (`*/src/js/core`,
  `*/src/css`, `*/src/tests`) **elle düzenlenmez**; önce `brand/ortak/`
  düzenlenir, sonra `python tools/ortak.py --yay`.
- `*/dist/` ve `*/src/js/data/build.js` elle değiştirilmez, commit'e girmez
  (derlemeyi Claude Code yapar).
- Kullanıcı verisi (`HKM/config.json*`, `*.db`, `AYS/debug.log`, `.claude/`)
  commit'e girmez.
- Düzeltilen her hata için önce o hatayı yakalayan test yazılır.

## İzleme

Masaüstündeki **Görev Takibi** (`tools/gorev_takip.py`) kuyruğu, her görevin
dalını ve Antigravity'nin o an hangi dalda çalıştığını gösterir; on saniyede
bir yenilenir. Yalnız okur, hiçbir şeyi değiştirmez.

## Görev dosyası şablonu

`_SABLON.md`'yi kopyala: `NNN-kisa-ad.md`.
