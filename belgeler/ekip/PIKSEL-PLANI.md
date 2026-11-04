# Piksel planı — sistemin tatlı ve kaliteli piksel hâli

Depo sahibi, 2026-11-05: «Yapabileceklerinin hepsinin listesini çıkar ve yapmaya başla. Çok daha profesyonel, çok daha güzel.»

Kurallar: tek tema jetonla ve kabuk yüzeyleriyle değişir, ekran tema bilmez. Süs sayı üretmez, veri okumaz; eksik veri kesik çizgi kalır, sıfır çizilmez (AGENTS §1.2, §1.10). Arka plan odasına ve Rütbe'ye dokunulmaz. Efekt yalnız gerçek olayda ve çok hafif.

## Temel

- [x] Kendi rakam yazı tipi: 5 ve 7 okunur (`tools/piksel_rakam.py`)
- [x] Bölüm başlıklarında konuya göre simge (Su: damla, Öğünler: çatal)
- [x] Karşılamada modülün yüzü (kalp, kitap, ampul)
- [x] Kâğıt yaprağın üstünde bant
- [x] Sekmeler: dosya sekmesi gibi
- [x] Pano ve özet kartları: bütün kartlarla aynı piksel çerçeve
- [x] Sütun grafik ve çubuklar: bloklu, sıcak renkli
- [x] Eğri ve halka: keskin; yuvarlak köşeli sütun kalktı
- [x] Çerçeveli karta yazı yapışmaz (`piksel_denetim` «kenara-yapisik» tutar)
- [x] Grafik noktaları kare (`piksel.js` çizim çevirici)
- [x] Halka ve yay bloklu: üstüne aralık çizilir, değer uzunluğu değişmez

## Etkileşim

- [x] Açılır pencere: ahşap başlık çubuğu
- [x] Bildirim: konuşma balonu, yanında kedi
- [x] Anahtar, açılır liste oku, «i» düğmesi
- [x] Rozet ve etiket: çıkartma
- [x] Fare imleci: piksel ok ve el
- [x] Yükleniyor iskeleti: adımlı yanıp sönme
- [x] Küçük tepki: bardak dolunca zıplar
- [x] Küçük tepki: tik basılınca iner, kayıtta kalp

## Efektler (2026-11-05: «efektlerin kalitesini arttır, tüm sayfalarda»)

- [x] Bütün hareket adım adım: yumuşak eğri yok, süreler kısa (Rütbe ve geri sayım hariç)
- [x] Sayfa, pencere, sekme, menü ve bildirim tek giriş hareketi; kenar menü hızlı açılır
- [x] Düğme basılınca iner; menü ve kısayol simgesi üzerine gelince zıplar
- [x] Kıvılcım: bardak, tik ve gerçek kayıtta sekiz kare; hareket ayarına uyar
- [x] Açılış karşılaması: bulanık cam yerine duvar, kâğıt ve modül yüzü
- [x] «Yeni rozet» bildirimi: kâğıt pencere, piksel yazı, bloksuz çubuk
- [x] Rütbe kutlaması: yazı ve «Geç» düğmesi piksel; rütbe görseli ve video bilerek aynı

## Modüller

- [x] SPİ: tahlil aralığı kalın bant ve iğne
- [x] SPİ: kilo tuş takımı, puan ve set düğmeleri; uyku bloklu
- [x] AYS: soru şıkları klavye tuşu, tekrar kartı kâğıt, konu haritası kareleri
- [x] AYS: hafta günü kartları, yol haritası noktaları kare
- [x] ESP: merdiven basamakları, disiplin kartları, kart kutuları
- [x] Defter: kareli kâğıt
- [x] King: taçlı başlık, konuşma balonu, temanın vurgusu
- [x] Ayarlar: tema örnekleri gerçek palet, seçili sekme, «Yazı tipi: Piksel»
- [x] Ayarlar: ses ve animasyon kartları

## Kapılar

- [x] Giriş ekranı: duvar, kâğıt form, modül yüzleri, gerçek logo
- [x] Seçim ekranı kartları daha derli toplu
- [x] Gün sayfası: bloklu halka, aynı kart dili
- [x] Açılış perdesi

