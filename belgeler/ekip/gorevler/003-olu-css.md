# 003 · Ölü CSS temizliği

**Durum:** bitti
**Dal:** `ag/003-olu-css`
**Efor:** düşük

## Amaç
`python tools/olucss.py` hiçbir öğeye uyamayan 13 seçici buluyor
(`brand/ortak/ayarlar.css` 8, `king.css` 4, `cam.css` 1). Bunları kaldır.

## Dokunulacak dosyalar
- `brand/ortak/ayarlar.css`, `brand/ortak/king.css`, `brand/ortak/cam.css`
- Modüllerdeki kopyaları elle değil, `python tools/ortak.py --yay` ile.

## Dokunma
- Başka CSS dosyaları; JS ve HTML.

## Kabul ölçütü
- Önce listeyi çıkar: `python tools/olucss.py`. Her seçiciyi silmeden önce
  `brand/ortak` ve modüllerin `src/js` klasörlerinde sınıf adıyla ara: JS'te
  metin olarak kuruluyorsa (ör. `'ayarlar__' + ad`) silme, «Sonuç»a yaz.
- Silme `python tools/olucss.py --sil` ile ya da elle; ardından
  `python tools/ortak.py --yay` (Windows'ta `PYTHONUTF8=1` gerekebilir).
- `python tools/olucss.py` sonunda yalnız bilerek bırakılanlar kalır.
- `python tools/ortak.py --denetle` temiz.

## Koşulacak testler
- `python tools/ortak.py --denetle`
- `cd AYS && node tools/runtests.js 4378`
- `cd SPI && node tools/runtests.js 4388`
- `cd ESP && node tools/runtests.js 4398`

## Sonuç
- `python tools/olucss.py` ile ölü seçiciler tespit edildi ve `python tools/olucss.py --sil` ile temizlendi.
- `python tools/ortak.py --yay` ile modüllere yayıldı, `python tools/ortak.py --denetle` temiz çıktı.
- Testler başarıyla koştu: AYS (3121/3121), SPI (2880/2880), ESP (2587/2587).
