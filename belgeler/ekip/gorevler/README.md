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

## Claude Code'un ajanları (`tools/ajan.py`)

Depo sahibinin kararı (2026-10-31): Antigravity'yi Claude Code sürer. Her ajan
Antigravity'de ayrı bir konuşmadır ve **kendi** klasöründe çalışır
(`C:\Users\ASUS\LifeOs-ajan\<numara>`, dal hazır seçili); test portları da
kendinedir (yuva n: AYS `47n1`, SPİ `47n2`, ESP `47n3`). Ajanın istemi
yukarıdaki akışı ve o portları söyler; README'deki 4378/4388/4398 yalnız
`LifeOs-ag`'de elle çalışırken geçerlidir.

```
python tools/ajan.py baslat 003                 görev ajanı; efor görev dosyasından
python tools/ajan.py baslat 001 --efor yuksek   efor dosyayı ezer
python tools/ajan.py mini css-ara "…"          salt okunur kısa iş, cevap verir
python tools/ajan.py durum                      hepsinin hâli, son adımı
python tools/ajan.py cevap 003                  son cevabın tam metni
python tools/ajan.py mesaj 003 "…"              konuşmaya ek talimat
python tools/ajan.py kapat 003                  klasörü kaldırır, dal kalır
```

- **Efor modeli seçer:** düşük → `flash_lite`, orta → `flash`, yüksek → `pro`.
  Görev dosyasındaki «**Efor:**» satırı varsayılandır. Efor alt ajan sınırını
  da belirler: düşükte alt ajan yok, ortada en çok 2, yüksekte en çok 3.
- **Mini ajan:** main'in ayrık bir kopyasında (`LifeOs-ajan\m-<ad>`) okur,
  arar, cevap verir; dosya değiştirmez, commit etmez. Varsayılan efor düşük.
- Ajan bitince dalını push eder; birleştirme yine Claude Code'dadır (akış 8).
- Antigravity'nin adresi ve CSRF anahtarı çalışan dil sunucusundan okunur;
  hiçbir dosyaya yazılmaz. Durum `LifeOs-ajan\ajanlar.json`'dadır (depoda değil).

## İzleme

Masaüstündeki **Görev Takibi** (`tools/gorev_takip.py`) beş saniyede bir
yenilenir ve şunları gösterir: Antigravity açık mı, kaç ajan çalışıyor, dolu
yuvalar; her ajanın türü, eforu ve modeli, hâli (başlıyor · çalışıyor · turu
bitti · sessiz · hata), süresi, adım sayısı, kullandığı araçlar, şu an ne
yaptığı, son adımları, son cevabı, alt ajanları, klasörü, dalı, portları,
commit ve kaydedilmemiş dosya sayısı; altında kuyruk (durum, efor, dal,
Sonuç). Yalnız okur, hiçbir şeyi değiştirmez.

## Görev dosyası şablonu

`_SABLON.md`'yi kopyala: `NNN-kisa-ad.md`.
