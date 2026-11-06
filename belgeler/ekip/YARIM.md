# Yarım kalan işler

Son güncelleme: 2026-11-06. Bu dosya bir sonraki oturum içindir: önce bunu oku, bitirdiğini sil.
Oturumların kendi notları kendi dallarındadır: `belgeler/ekip/yarim/<oturum>.md`.

## Son durum (2026-11-06)

Tablodaki iki dal da `main`'de ve bilgisayardaki kopyada (`573560dd`). Birim, duman, uçtan uca temiz; birleşme sonrası `mobil_tara` ve `layoutcheck` koşmadı: önce bunları koş. Gerçek telefonda hız ve King denenmedi; dalların kendi notları `belgeler/ekip/yarim/` altında.

## Oturumlar

| Oturum | Dal | Durum | Yapılacak |
|---|---|---|---|
| Her yerden erişim (`local_28a9a5f6-edf7-4d03-aea1-39a05b4ec25d`) | `claude/her-yerden-erisim-7242be` (`2b09db31`) | Kullanıcı «main'e al» dedi. Yöneticinin çalışma klasöründe birleştirildi (`8ead3deb`), derlemeler üretildi, denetimler sürüyordu | `.claude/worktrees/yasayan-apartman-0339d0` klasörüne bak: derlemeleri commit'le, §2 denetimleri (entegre dahil) temizse `git push origin HEAD:main`. `main`'de değilse iş bitmemiştir |
| Telefon ve tablette sayfa hızı (`local_50507126-4efd-4c93-b99e-50a8358f4f3d`) | `claude/telefon-hiz-f459e1` (`92d1ae4b`) | Bitti, `main`'e ALINMADI: kullanıcıdan söz yok. Bildirilen: yavaş 4G taklidinde tekrar açılış 37,8 sn'den 0,65 sn'ye; gerçek adreste denenmedi, yönetici doğrulamadı | Kullanıcı «al» derse birleştir. Her yerden erişimle çakışır: `brand/ortak/sw.js` (ve kopyaları), `SPI/src/js/data/build.js`. `sw.js`'i ikisinin davranışını koruyarak elle çöz, sonra `tools/ortak.py --yay`, üç `build.py`, denetimler. Notu dalda: `belgeler/ekip/yarim/telefon-hiz.md` |
| Öğrenme motoru (`local_73d2870f-f5b5-4932-87aa-d77510db2d40`) | `main`'de (`660751a1`) | Bitti | Telefonda ve King üzerinden model düğmeleri denenmedi; ayrıntı o oturumun son raporunda |

Tam dal adını `git branch -a --no-merged origin/main` verir.

## Alınan karar

**AltStore ve AltServer kalıyor** (2026-11-06, kullanıcı: «Kalsın»). Ekran kapalıyken koşu rotası ve telefon bildirimleri
iPhone'daki yerel uygulamaya bağlı; uygulama 7 günde bir AltServer ile yenilenir. Yeniden önerme, kullanıcı sorarsa konuş.

## Gerçek cihazda denenmedi

Bilgisayarda taklitle ölçüldü, cihazda görülmedi:

1. iPhone: sayfayı yenile; yazı kutusuna dokununca büyüme olmamalı, klavye açılınca King görünen alana oturmalı, Ayarlar paneli opak olmalı.
2. Küçük King penceresi klavyeyle hiç ölçülmedi.
3. Samsung ve tablet hiç denenmedi (`https://desktop-alntlh5.tailaff979.ts.net:5183`). Tablet modeli bilinmiyor.
4. Bilgisayar kapalıyken telefondan açılış ve Ana Ekrana Ekle ile çevrimdışı açılış doğrulanmadı.

## Küçük açıklar

- **Çalışan kopya bir commit geride:** `%USERPROFILE%\LifeOS-Sistem` `adbe59a7`'de; güncelleyici düzeltmesi `e7c11529`. Sonraki «Güncelle» alır, sunucu dosyası değiştiği için yeniden başlatır. Düzeltme yeni sürüm açılana dek çalışmaz.
- **Güncelleme yarım kalma sebebi:** 2026-11-06'da `git merge` `SPI/dist/spi.html`'i silemedi («Invalid argument»), muhtemelen dosya o an okunuyordu. Sebep kanıtlanmadı. Yarım kalan iş artık kendiliğinden tamamlanıyor, ama ilk hata önlenmiş değil.
- **`AYS/src/js/core/quiz.js` depoda CRLF.** Zararsız hâle getirildi, dosya normalleştirilmedi. Başka CRLF dosya var mı `git ls-files --eol` ile bakılmadı.
- **`tools/mobil_tara.js` CI'da değil** (modül başına ~2 dk) ve ekranları veri girilmemiş hâlde gezer. Dik 390 ve 820'de veriyle ölçümü yine `layoutcheck` yapar; yatayda veriyle ölçüm yok.
- **Oyun açıkken denetim yanıltıcı:** VALORANT açıkken SPİ birim testlerinde 266 kırmızı çıktı, oyun kapanınca aynı kodla 0. Sebep büyük ihtimalle bellek, kanıtlanmadı. Oyun açıkken model çağrıları da 60 sn sınırına takıldı.
- **LifeOS Windows açılışında başlamıyor.** Kullanıcı sunucuyu bazen bilerek kapatıyor: kapalı görürsen sormadan açma. Kendiliğinden başlatma seçeneği Her yerden erişim oturumunun işi.
