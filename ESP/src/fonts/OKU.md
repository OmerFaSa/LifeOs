# Yazı tipleri

Üç aile uygulamanın içine **gömülüdür**; hiçbiri ağdan inmez.

## Neden

Uygulama «çevrimdışı çalışır, bağımlılığı yoktur» diyordu ama üç yazı
ailesi Google Fonts'tan iniyordu ve bu istek **açılışı kilitliyordu**.
Ölçüldü:

| Durum | İlk çizim |
|---|---|
| Yazı tipi CDN'i kapalı | **342 ms** |
| CDN yanıt vermiyor | **12.931 ms** |

Otuz sekiz kat fark ve tamamı ağdan. Bu bir hız sorunundan fazlasıydı:
sistem çevrimdışı çalıştığını söylüyor, kötü bağlantıda ise ya bekletiyor
ya yanlış yazı tipiyle açılıyordu.

## Ne var

| Aile | Rol | Dosya |
|---|---|---|
| Newsreader | Başlık (serif) | `newsreader-latin.woff2` · `-latin-ext` |
| Manrope | Sayı | `manrope-latin.woff2` · `-latin-ext` |
| Inter | Gövde | `inter-latin.woff2` · `-latin-ext` |

Üçü de **değişken** yazı tipidir: tek dosya bütün ağırlıkları taşır.

## Nasıl küçüldü

392 KB → **92 KB**, iki adımda:

1. **Karakter indirgeme.** Kaynak dosyalarda geçen her karakter toplandı,
   üstüne ASCII + Türkçe + ölçü/ok işaretleri eklendi: 167 karakter.
   Latin Extended'in tamamı taşınmıyor.
2. **Optik boyut ekseni sabitlendi.** Newsreader'ın `opsz` ekseni 24'e
   sabitlendi; gözle ayırt edilmeyecek bir fark, dosyanın yarısı.

Yazılmayan bir karakter (bir notta geçen «ñ» gibi) sistem yazı tipine
düşer; düzen bozulmaz.

## Yeniden üretme

```
python tools/fonts.py     # src/fonts/*.woff2 -> src/css/fonts.css
```

`src/css/fonts.css` elle düzenlenmez.

## Lisans

Üçü de **SIL Open Font License 1.1** altındadır; tam metin `OFL.txt`.

- Newsreader — Production Type
- Manrope — Mikhail Sharanda
- Inter — The Inter Project Authors
