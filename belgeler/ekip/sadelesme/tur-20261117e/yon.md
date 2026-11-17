# Tur 2026-11-17e · Görsel sıçrama: tasarım yönü (bütün paketler önce bunu okur)

Sahibin isteği: «Sistemin görselliğini artırıp daha kaliteli ve daha zevkli hâle getir, minimalistliği bozmadan. Çok büyük şeyler, çok güzel şeyler yap.»
Kalıcı kararlar (bozulmaz): kart kenar çizgisi yok (ayrım ton + yumuşak gölge; yüksek kontrastta kenar geri gelir), manzara yalnız üstte kapak, rıhtım yok, tek ana eylem, bilgi saklamadan sadelik, ince ayar fotoğrafta görünmez: GÖRÜNÜR adım at. Görünen ad Başbuğ; iç kimlikler (lifeos.*, LIFEOS, data-*) aynı.

## Ruh
Ağırbaşlı, sıcak, el yapımı. Bir kütüphane, bir otağ, bir hattat masası: az öğe, iyi malzeme, ışık. «Uygulama» değil «mekân» hissi. Gürültü yok; her ekranda bir güzel an.

## Beş büyük adım
1. **Yazı kimliği.** Başlık ve okuma metni için sistemde hazır duran zarif serif yığını (indirme yok):
   - Başlık: `"Sitka Display", "Sitka Heading", "Iowan Old Style", "New York", ui-serif, Georgia, serif`
   - Okuma (ders metni, King cevabı, not gövdesi): `"Sitka Text", "Iowan Old Style", Charter, ui-serif, Georgia, serif`
   - Arayüz (düğme, etiket, liste, sayı): mevcut sans kalır; rakamlar tabular.
   Tek ölçek: h1 büyük ve iddialı (serif, sıkı harf aralığı), h2/h3 sakin. Ayarlar › Yazı tipi seçenekleri çalışmaya devam eder (Piksel seçilirse içerik piksele döner).
2. **Işık ve renk.** Sayfa zemini düz krem değil: kapak sahnesinin rengi aşağı doğru çok hafif bir ışıma olarak süzülür (alanın kendi tonu: tarih kırmızı-pembe, felsefe turuncu, akademik mavi…). Kartlar kâğıt gibi: sıcak beyaz, iki katmanlı yumuşak gölge. Koyu tema: gece mavisi-is siyahı, sıcak lamba vurgusu, yıldız serpintisi değil ama derinlik. Kontrast WCAG AA.
3. **Sahne canlı ve derin.** Kapak sahnesi gerçek saate göre gök rengini değiştirir (şafak, öğle, ikindi, gün batımı, gece), katmanlar kaydırınca hafif paralaks (hareket azsa yok), sahnenin alt kenarı sayfaya yumuşak erir. Her alanın piksel amblemi (küçük, keskin) başlığın yanında.
4. **Anlar.** Ders bitince, kapı geçilince, günün ilk kaydında küçük ve zarif bir an: tuğ/sancak dalgası, ışık süzülmesi, sayının sayarak artması. Bir saniyeden kısa, tekrar etmez, hareket azsa yok.
5. **Okuma deneyimi.** Ders sayfası bir kitap sayfası gibi: 62-68 karakter satır, serif metin, rahat satır aralığı, ilk paragrafta zarif başlangıç (büyük ilk harf ya da küçük büyük harf), «Özetle» bölümü ayrı bir ton bloğu, alıştırmalar sakin kartlar, üstte kaydırmayla dolan ince ilerleme çizgisi.

## Ölçüt
Önce/sonra aynı ekranlar, 1440 ve 390, açık ve koyu: bir bakışta «çok daha güzel» denmeli, ama ekranda öğe sayısı artmamalı. Performans: 4× yavaş CPU'da sayfa geçişi en uzun kare kötüleşmez (kalite/hiz_olcum.js), açılış kodu bütçesi aşılmaz (kalite/olcum.py --denetle).
