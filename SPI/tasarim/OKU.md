# Tasarım Örnekleri

Yirmi ayrı tasarım dili. **Hiçbiri çalışan bir sistem değildir** — hepsi
aynı içeriği gösteren, tek dosyalık, statik örneklerdir. Amaç karşılaştırma:
aynı veri yirmi farklı dille anlatıldığında hangisi dokuz ay boyunca her gün
açılmaya dayanır?

## Nasıl bakılır

`index.html` dosyasını aç — yirmisini küçük önizlemeler hâlinde listeler.
Birine tıklayınca tam ekran açılır. Üstteki düğme önizlemeleri büyütür.

## Hepsinde aynı içerik var

Karşılaştırma ancak içerik sabitken adil olur. Yirmisi de şunu gösterir:

- Yedi bölümlü gezinme
- Günün durumu: bir cümle + özet sayılar (12 / 1 / 5 / 2)
- Beş tahlil sonucu (biri referans altı, ikisi hedef dışı)
- Toparlanma skoru 85/100 ve altındaki üç ölçüm (biri **girilmedi**)
- Beslenme hedefi 2.285 kcal

Değişen yalnızca **dil**: iskelet, tipografi, renk, hiyerarşi ve mekanik.

## Yirmi dil

| # | Ad | Ayırt eden şey |
|---|---|---|
| 01 | Klinik Rapor | Hastane raporu dizgisi, çizgi cetveller, kutusuz satırlar |
| 02 | Dergi | Büyük serif başlık, geniş boşluk, okunacak sayfa |
| 03 | Bento | Farklı boyda kutucuklar, hızlı tarama |
| 04 | Terminal | Tek aralıklı yazı, komut satırı estetiği |
| 05 | İsviçre | Katı ızgara, tek vurgu rengi, hizalama |
| 06 | Zaman Çizgisi | Tek omurgaya asılı gün akışı |
| 07 | Brutalist | Kalın çerçeve, ham renk, gizlenmeyen yapı |
| 08 | Cam | Koyu zemin, buzlu katmanlar |
| 09 | Gazete | Sütunlar, manşet, kenar notları |
| 10 | Mobil Uygulama | Telefon çerçevesi, alt gezinme |
| 11 | Odak | Ekranda tek devasa sayı |
| 12 | Kraft | Kâğıt dokusu, daktilo yazısı |
| 13 | Veri Yoğun | Üç panel, çok bilgi, az tıklama |
| 14 | Sağlık Karnesi | Açılmış defter: sol ölçüm, sağ yorum |
| 15 | Minimal Mono | Tek renk, dar sütun, yalnızca çizgi |
| 16 | Katmanlı | Kenar çubuğu + liste/ayrıntı |
| 17 | Şerit | Tam genişlik renk şeritleri |
| 18 | Dairesel | Çeperde ölçümler, merkezde günün skoru |
| 19 | Kağıt Fiş | Dar sütun, nokta liderli satırlar |
| 20 | Harita | Tuval üzerinde düğümler ve neden bağları |

## Doğrulama

Örnekler çalışan sistem değil ama düzgün çizilmek zorunda. `tools/tasarimcheck.js`
yirmi biri de gerçek tarayıcıda üç genişlikte (1280 / 900 / 420) açar; yatay
taşma, kaba sığmayan öge, boş sayfa ve konsol hatası arar.

```
node tools/tasarimcheck.js
```

Yazı tipleri Google Fonts'tan gelir; internet yoksa örnekler sistem yazı
tipine düşer, düzen bozulmaz.

## Seçtikten sonra

Seçilen dil sistemin tamamına uygulanır: kabuk, on iki ekran, yedi bölüm
kimliği, yedi palet ve karanlık tema. Tek bir numara seçmek şart değil —
«14'ün düzeni, 5'in tipografisi, 3'ün kart mantığı» gibi bir karışım da
tariftir. Bu klasör o noktadan sonra referans olarak kalır.
