# Ortak CSS — tek kaynak burasıdır

Bu klasördeki üç dosya AYS, SPİ ve ESP'nin **aynısını kullandığı**
biçimlerdir:

```
base.css      sıfırlama, tipografi, erişilebilirlik temelleri
layout.css    kabuk ızgarası, künye, alt bant, telefon düzeni
designs.css   beş tasarım dilinin ortak gövdesi
```

Üçü de üç uygulamada **bayt düzeyinde aynıydı** — 4 365 satır birebir
tekrar ve onu koruyan hiçbir şey yoktu. Birinde yapılan bir düzeltme
diğer ikisinde unutuluyor, fark ancak iki ekran yan yana konunca
görülüyordu.

## Nasıl çalışır

```bash
python3 tools/ortak.py --yay       # buradan üç arayüzün src/css/'ine
python3 tools/ortak.py --denetle   # kopyalar kaynakla aynı mı (CI de koşar)
```

`--yay` dosyayı her uygulamanın `src/css/` klasörüne **aynı adla**
yazar. Bu bilinçli: `index.html` değişmez, CSS'in yükleme sırası
korunur ve `build.py`'nin satır içine alma düzeni bozulmaz. CSS'te
**sıra anlamdır**.

Kopyalar «ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME» başlığı taşır. Elle
düzenlenen bir kopya bir sonraki yayında kaybolur; `--denetle` bunu
daha önce söyler.

`src/` değiştiği için yayından sonra üç `build.py` de yeniden koşmalı.

## Burada olmayanlar — ve nedenleri

| Dosya | Durum | Neden burada değil |
|---|---|---|
| `tokens.css` | 78 satır fark | ajan renkleri ve grafik serisi renkleri uygulamaya özel |
| `palettes.css` | 52 satır fark | aynı biçim |
| `components.css` | ~50 satır fark | uygulamaya özel birkaç bileşen |
| `fonts.css` | üçünde aynı | **üretilmiş** dosya: kaynağı `<APP>/tools/fonts.py`. İki sahipli bir dosya yapmamak için dokunulmaz |
| `seviye.css` | zaten yayılıyor | kaynağı `brand/seviye/` |
| `rota.css`, `esp.css` | uygulamaya özel | — |

Kısmen ortak olan üçü «ortak gövde + uygulama kuyruğu» ayrımını
gerektirir. Bu bir tasarım kararıdır, bir kopyalama işi değil; ayrı
bir turda yapılır.
