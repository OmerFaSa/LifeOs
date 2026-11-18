# Tur 2026-11-18d · Profesyonel katman (sistem geneli)

Sahibin isteği (2026-11-18): «görsel tasarımı çok daha profesyonel bir hâle getirsene, sistem genelinde».

## Bulgular (14 ekranın ölçümü, 1280 px)
- Bölüm başlıkları çoğu ekranda 13 px soluk gri etiket; yalnız Ayarlar ve alan sayfası serifti (iki ayrı dil).
- Küçük yazı (etiket, alt satır, ipucu) 13 px.
- Giriş kutuları gri dolgulu; devre dışı gibi görünüyordu.
- Boş durumlar 170–225 px'lik dolu bej kutu.
- Masaüstünde içerik sütunu 720 px: 1280 ekranın yarısı boş, sayfalar telefon uygulaması gibi.
- Ayarlar ve Hesap'ta manzaralı başlık yoktu (öbür ana sayfalarla tutarsız).

## Değişiklikler (ortak taşlarda; her ekrana birden)
- `--yz-k` 13 → 14 px.
- Bütün bölüm başlıkları tek kural: serif, `--yz-h3`, tam yazı rengi (`kabuk.css` `:root .b-bolum__ust h2`); Ayarlar/alan/Hesap için ayrı kopyalar silindi.
- Giriş kutusu: çizgisiz (sahibin 2026-11-15 kuralı), açık dolgu + içe hafif gölge; üzerine gelince bir ton koyu; odakta yüzey + vurgu renginde hale.
- Boş durum (`bilesen.css .b-bos`): dolu kutu yerine zemine oturan hafif alan tonu ışığı.
- Yeni jetonlar `--sayfa: 960px` (içerik sütunu; eskiden 720) ve `--form: 640px` (formlar geniş sütunda okunur genişlikte). Bugün'ün alan ızgarası 960'ta üç sütun (dokuz alan üç tam satır). Ders okuma ekranı 760 px'te kalır.
- Ayarlar (Not odası sahnesi, dişli) ve Hesap (ufuk sahnesi, kişi) manzaralı başlıkla; sprite'a `i-ayarlar`, `i-hesap`.

## Önce/sonra
`gorsel/once-0..3.png` ve `gorsel/sonra-0..3.png` (aynı sıra: Bugün, Öğren, Sağlık, Not · King, Ayarlar, Plan, Tekrar · Kayıt, Hesap, Beslenme, Soru · Araçlar, Yönetim), `gorsel/sonra-koyu.png`, `gorsel/sonra-telefon.png`.

## Testler
Kabuk birim testleri, `tools/kabuk_gez.js` (320…1440 px çubuk kesişme/taşma dahil), `tools/kabuk_esit_gez.js`, `tools/hareket_gez.js`, `kalite/olcum.py --denetle`: hepsi geçti.
