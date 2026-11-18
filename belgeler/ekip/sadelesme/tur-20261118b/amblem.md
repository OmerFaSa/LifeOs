# Tur 2026-11-18b · Alan amblemleri her yerde, kart etkileşimi

Sahibin isteği: «görsel kaliteyi arttır» → «daha güzel olsun». Yön: tur-20261117e/yon.md. Amblem API'si: tur-20261117e/sahne.md (`LIFEOS.PIKSEL_DOGA.amblem(alan)` → 16×16 PNG; piksel-doga.js'e dokunulmadı).

## Durum
- [x] Önce görüntüleri (Bugün, Öğren × açık/koyu/yüksek kontrast × 1440/390, üzerine gelme ve odak kırpıntıları; saat 14:10 sabit, yalıtılmış sunucu, boş hesap)
- [x] Amblem Bugün › İlerleme, Öğren (ve Sağlık) alan kartları, «Sıradaki» kartı
- [x] Kart etkileşimi (üzerine gelme/basma, amblem canlanması, odak halkası)
- [x] Sonra görüntüleri, üç tur (ikinci turda Sıradaki kutusu 40 px kalıyordu → 64; kutular kâğıt gibi)
- [x] Bayt, kalite kapısı

## Ne değişti
**Amblem tek yerde** (kabuk.js `amblemKoy`). Sayfa yine çizgi simgeyle yazılır (`#i-<alan>`); `manzara()` çizimden hemen sonra (aynı karede, boyamadan önce) sayfadaki `.b-simge > svg` öğelerinden alanı temsil edenleri (haritada `katman: 'alan'`; başlıktakiler her zaman) piksel amblemle değiştirir. Kitaplık geç gelirse `onload → manzara()` aynı işi yapar; gelmezse (file://, ağ hatası) çizgi simge kalır. Eskiden yalnız başlık için ayrı iki yol vardı (`amblem()` içinde ve `manzara()` içinde); ikisi bu tek işleve indi. Sayfa ne olursa olsun aynı kural: Bugün İlerleme (10 kart), Öğren kartları (6), Sağlık kartları (4), başlık.
**Sıradaki** (kabuk.js `siraKarti`, yalnız Öğren'de, `o.alan`): çalışılan alanın amblemi solda 64 px kutuda (48 px amblem), metin ortada, düğme sağda; telefonda 48 px kutu (32 px) üst iki satırın yanında.
**Boyutlar** (kabuk.css, amblem bloğu): 16 px'in tam katları. Küçük kartlar 40 px kutu / 32 px amblem; öne çıkanlar (çalışılan alanın geniş kartı, Sıradaki) 64 / 48, telefonda 48 / 32; Öğren geniş kart 48 / 32; başlık aynen 56 / 48 (telefonda 40 / 32). `image-rendering: pixelated`. Öne çıkan iki kutu kâğıt gibi: alan tonunun %10'u + yumuşak gölge (tonlu kart zemininde kaybolmuyor).
**Etkileşim**: kart üzerine gelince amblem 1 px kalkar, basınca iner; hareket az (ya da sistemde azaltılmış ve ayar «sistem») ise kıpırdamaz. Öğren/Sağlık geniş ekran kartları artık öbür kartlar gibi 2 px kalkar (eskiden yalnız gölge; satır listesinin geçiş kuralı dönüşümü anında yapıyordu, kartta geçiş geri verildi). Odak halkası alanın tonunda (%60 ton + %40 yazı), kartın 3 px dışında; satır listesinde (telefonda Öğren) halka içeride: liste `overflow:hidden` halkanın üç kenarını kesiyordu (eski hata). «Belirgin odak» ayarı vurgu rengini korur.

## Önce/sonra
`amblem-gorsel/bugun.png`, `ogren.png`: solda önce, sağda sonra; satırlar 1440 açık, koyu, yüksek kontrast; altta 390 (açık önce/sonra, koyu önce/sonra). `etkilesim.png`: solda önce, sağda sonra; üzerine gelme ve klavye odağı (Bugün küçük kart, Öğren kartı 1440, Öğren 390 satır).
Doğrulanan: amblem kutusu içinde tam sayı konumda, bulanık değil; kitaplık engellenince Bugün 11, Öğren 8 çizgi simge kalıyor, hata yok; kitaplık 2,5 sn geç gelince önce çizgi simge, sonra 8 amblem; üzerine gelince kart 2 px, amblem `translateY(-1px)`, hareket azda `none`.

## Bayt farkı (LF)
- kabuk/kabuk.css: +2 472 (amblem bloğu, Sıradaki düzeni, etkileşim; Öğren kart kuralına iki bildirim eklendi)
- kabuk/kabuk.js: +532 (`amblemKoy`, siraKarti'de amblem; `manzara()` ve `amblem()` kısaldı)
- Net: ~+3.0 KB (bütçe +4 KB). `kalite/olcum.py --denetle`: bütçe tamam; Kabuk açılış yükü 860 458 bayt (öbür ajanların o anki değişiklikleri dahil).

## Testler
`node kabuk/kabuk.test.js` 74/0, `node kabuk/bilesen.test.js` 24/0, `node tools/ortak_test.js` 280/0 (23 eski modül atlandı), `node tools/kabuk_gez.js` hepsi geçti, `node tools/hareket_gez.js` hepsi geçti (hareket azda en uzun kare 17 ms). Seçici ve test değişmedi.

## Açık kalanlar
- ~~Koyu temada amblemin koyu dış çizgisi koyu kutuda kayboluyor~~ → 2026-11-18 (oturum 2209a43f): koyuda amblemin çevresinde ince açık hale (`kabuk.css`, `.b-simge > img` koyu kuralı; kutu zeminleri aynı).
- Komut çubuğu (Ctrl K) ve halka öğeleri çizgi simgede kaldı: ikisi bölüm gezintisi (Bugün, Öğren, Sağlık…), alan değil; alan satırı çıkarsa `amblemKoy` yalnız `#sayfa` içine bakar.
- Bilesen bileşenlerine dokunulmadı (değişim kabukta, DOM'da).
