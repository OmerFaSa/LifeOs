# Yarım kalan işler

Son güncelleme: 2026-11-06 (akşam). Bu dosya bir sonraki oturum içindir: önce bunu oku, bitirdiğini sil.
Oturumların kendi notları: `belgeler/ekip/yarim/<oturum>.md`.

## Son durum

Her yerden erişim, telefon hızı ve öğrenme motoru `main`'de. Birleşme sonrası `mobil_tara` ve `layoutcheck`
üç modülde temiz (2026-11-06). Kalan iş yalnız gerçek cihazda denemek.

Sürüyor (kendi dallarında, main'e almadan önce kullanıcıya soracaklar):
- Piksel sanatı: manzara, ofis ve apartmanların kalitesi (`local_de8da877-36fc-42be-b656-d645e024b8d4`).
- Öğretme altyapısı: `kavrat.js` ile öğrenme motorunu tek deneyimde birleştirme (`local_c18910ec-8efb-4b45-af1f-32c2865c85fb`).

Sahipsiz dal: `claude/yasayan-apartman-0339d0` (`d242341f`, 2026-11-05) main'e hiç girmemiş başka bir «iş binaları
apartman değil» denemesi; main'deki sürüm `e48116b4`. Birleştirilmeyecek, fikirleri piksel sanatı oturumuna verildi.
O oturum bitince dal silinebilir (kullanıcıya sor).

## Alınan karar

**AltStore ve AltServer kalıyor** (2026-11-06, kullanıcı: «Kalsın»). Ekran kapalıyken koşu rotası ve telefon bildirimleri
iPhone'daki yerel uygulamaya bağlı; uygulama 7 günde bir AltServer ile yenilenir. Yeniden önerme, kullanıcı sorarsa konuş.

## Gerçek cihazda denenmedi

Bilgisayarda taklitle ölçüldü, cihazda görülmedi:

1. iPhone: sayfayı yenile; yazı kutusuna dokununca büyüme olmamalı, klavye açılınca King görünen alana oturmalı, Ayarlar paneli opak olmalı.
2. Küçük King penceresi klavyeyle hiç ölçülmedi.
3. Samsung ve tablet hiç denenmedi (`https://desktop-alntlh5.tailaff979.ts.net:5183`). Tablet modeli bilinmiyor.
4. Bilgisayar kapalıyken telefondan açılış ve Ana Ekrana Ekle ile çevrimdışı açılış doğrulanmadı.
5. Telefon hızı gerçek adreste (yavaş 4G'de tekrar açılış, taklitte 37,8 sn'den 0,65 sn'ye) ölçülmedi.
6. Öğrenme motorunun model düğmeleri telefonda ve King üzerinden denenmedi.
7. Açılış filmi yeni bir hesapla ilk girişte görülmedi.

## Küçük açıklar

- **`tools/mobil_tara.js` CI'da değil** (modül başına ~2 dk) ve ekranları veri girilmemiş hâlde gezer. Dik 390 ve 820'de veriyle ölçümü yine `layoutcheck` yapar; yatayda veriyle ölçüm yok.
- **Oyun açıkken denetim yanıltıcı:** VALORANT açıkken SPİ birim testlerinde 266 kırmızı çıktı, oyun kapanınca aynı kodla 0. Sebep büyük ihtimalle bellek, kanıtlanmadı. Oyun açıkken model çağrıları da 60 sn sınırına takıldı.
- **LifeOS Windows açılışında kendiliğinden başlamaz, seçenek var:** Hesap › «Bilgisayar açılınca LifeOS başlasın» (`sistem/uzak.py` `acilis_ayarla`). Varsayılan kapalı; kullanıcı sunucuyu bazen bilerek kapatıyor: kapalı görürsen sormadan açma.

## Kapananlar (2026-11-06)

- Güncelleme «Invalid argument» ile yarıda kalırsa (Windows o an okunan dosyayı silemez) artık aynı koşuda tamamlanır (`sistem/guncelle.py`, test `HKM/tests/test_guncelle.py`). Kilidin kendisi önlenmedi.
- Depoda CRLF duran beş AYS dosyası (`quiz.js` dahil) LF'e çevrildi; `git ls-files --eol` başka dosya göstermiyor (`.bat` hariç).
- Çalışan kopya (`LifeOS-Sistem`) güncelleyici düzeltmesini (`e7c11529`) almış durumda.
