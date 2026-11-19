# Tur 2026-11-19 · Türk teması 4: ata portreleri, haritalar, koyu askerî afiş temaları (ÖRNEK)

Sahip: «atalarımızın resimleri piksel sanatla», «eski Türklerin sınırları ve başarıları», «İkinci Dünya Savaşı afişlerinin Türk temalı hâli gibi» koyu temalar.
İlk çizimler (yandan, şekilden piksel) sahibe «iğrenç» geldi; yön sahibin gösterdiği örneklere göre değişti: önden, iri pikselli, yağlıboya dokulu,
yaldız çerçeveli tablolar; Atatürk al zeminde ay yıldızla. Sınır: faşist/komünist sembol, slogan, ideoloji ya da başka milletlere düşmanlık yok;
esin yalnız afiş görselliği, içerik Türk tarihi ve Atatürk'ün sözleri.

## Örnekte olanlar (onaydan sonra genişler)
- `kabuk/ata.js`: 32×32 elle kurulmuş portreler (Atatürk, Fatih), 4 piksellik yaldız çerçeve, piksel başına sabit doku; Avrupa–Asya piksel haritası
  (kıyı çokgenleri, dağ sıraları, devlet sınırı; hücre merkezinden örnekleme), Göktürk Kağanlığı. Sınırlar «yaklaşık», tarih kaynağı yazılı. Test: `kabuk/ata.test.js`.
- Günün sözü: sözün sahibinin portresi. Divan: hükümdarın portresi. Tarih alanı: on altı yıldızın altında günün haritası.
- Ayarlar › Tema: **Kızıl Otağ** (siyah, al, altın) ve **Ordu** (haki, al). Kökte `data-theme="dark"` + `data-afis`; dar ve kalın büyük harf başlıklar
  (Bahnschrift), sayfa tepesinde al + altın şerit, bölüm başlığında al kare, söz kartı al/zeytin afiş zemini, piksel sahne SVG süzgeciyle
  birkaç tona iner (`index.html` `#afis-*`). Yazı AA: en düşük 5,0 (soluk yazı / söz kartı).

## Panolar
`pano-1-tema.png` (Bugün, 1280 ve 390, önce açık/koyu → sonra Kızıl Otağ/Ordu), `pano-2-portre.png` (söz kartı ve Divan), `pano-3-harita.png` (Tarih).

## Sıradaki (onayla)
Portreler: Mete, Bumin, Bilge, Kül Tigin, Tonyukuk, Alparslan, Osman Gazi, Yavuz, Kanuni, Timur, Babür. Haritalar: Büyük Hun, Uygur, Karahanlı,
Büyük Selçuklu, Timur, Babür, Osmanlı. Başarı sahneleri: Malazgirt, İstanbul'un fethi, Çanakkale, Büyük Taarruz. Temalar: Gök Börü, Ergenekon,
Akıncı, Seferberlik (açık). Telefonda Divan portresi küçülür (yazma kutusu adı örtmesin).
