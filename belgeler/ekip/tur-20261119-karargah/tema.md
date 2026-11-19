# Sade tema · karargâh görünümü (2026-11-19, «tema» birliği)

Sahip: «temayı çok daha ciddi bir şekle oturt, askerî karargâh gibi olsun». Yalnız `:root[data-sade]` (Cihaza uy, Açık, Koyu); Klasik ve afiş temaları aynı.
Pano: `tema.png` (Bugün, Akademik alanı, Ayarlar; 1280 ve 390 px; açık ve koyu; önce/sonra; denenen üç yol).

## Seçim
Üç yol denendi (Bugün ve Akademik üzerinde):
- **A · Kurmay belgesi:** Bahnschrift başlık, köşe 4 px, gölge yok. Ciddi ama yumuşak kaldı; kartlar hâlâ «kart».
- **B · Komuta panosu (seçilen):** A + köşe 2 px (düğme ve seçiciler dahil), alan ızgarası 2 px aralıklı tek pano, sahne 380 → 300 px ve sert gri gravür, kapak gölgesi yok. En sıkı ve en sade; ekran tek bir pano gibi okunur.
- **C · Haki alt ton:** A + zeytin alt ton. Açıkta fark görünmüyor, sahneyi bulandırıyor; ek ton iş görmüyor.

## Ne değişti
- Başlıklar (`h1`–`h3`, selam, alan adları): Bahnschrift dar (yedek: DIN Condensed, Roboto Condensed, Arial Narrow); `h1` ve selam kalın, büyük harf.
- Bölüm başlıkları ve etiketler: küçük, büyük harf, 0,14 em aralıklı, soluk renk; süs simgesi (altın yıldız) yok.
- Gövde ve okuma yazısı sans (`--okuma` = `--govde`); italik yok (`em` kalınla vurgulanır); sayılar tabular.
- Gölge jetonları görünmez, gradyanlı kartlar düz yüzey; köşe 2 px; ayrım ton (zemin `#eeece6` / yüzey `#fbfaf7`; koyu `#0c0d0c` / `#171816`) ve boşlukla.
- Al yalnız vurgu jetonunda (etkin sekme, ilerleme, uyarı).

## Yazı kontrastı (WCAG, ölçüldü)
| Açık | zemin | yüzey | yüzey-2 |
|---|---|---|---|
| yazı | 15,59 | 17,65 | 14,10 |
| yazı-2 | 10,99 | 12,43 | 9,93 |
| soluk | 6,02 | 6,81 | 5,44 |
| al (ana) | 5,88 | 6,66 | 5,32 |
| altın | 5,11 | 5,79 | 4,62 |
| ana-yazı / ana: 6,95 · düğme yazısı / düğme: 18,42 | | | |

| Koyu | zemin | yüzey | yüzey-2 |
|---|---|---|---|
| yazı | 16,93 | 15,49 | 13,91 |
| yazı-2 | 13,03 | 11,92 | 10,70 |
| soluk | 7,19 | 6,58 | 5,91 |
| al (ana) | 5,79 | 5,30 | 4,76 |
| altın | 9,29 | 8,50 | 7,63 |
| ana-yazı / ana: 5,79 · düğme yazısı / düğme: 16,42 | | | |

En düşük 4,62 (açık, altın / yüzey-2). Sahne üstündeki beyaz selam (arka plan medyanına karşı): akşam 6,8 → 9,5; öğle 4,1 → 6,1.

## Açılış yükü
996 921 → 996 594 bayt. Blok +1 094 bayt; karşılığında `bilesen.css`'te kabuk.css'teki `:root` eşleri tarafından her temada ezilen 16 kuralın ölü bildirimleri silindi (görünüm değişmez; katalog sayfası da kabuk.css yükler).
Not: o 16 kuralın `:root` eşleri kabuk.css'te; birleştirirken biri silinirse taşın taban değeri artık bilesen.css'te yok.
