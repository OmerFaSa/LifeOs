# Tur 2026-11-19 · Türk teması 4: ata portreleri, haritalar, tablolar, simgeler, logo, koyu askerî afiş temaları

Sahip: «atalarımızın resimleri piksel sanatla», «eski Türklerin sınırları ve başarıları», «İkinci Dünya Savaşı afişlerinin Türk temalı hâli gibi» koyu temalar,
«Attila, Timur, Mete gibi bıyıklı liderler», «türlü türlü simgeleri ikonları arttır», «Başbuğ'a logo: bir kurdun etrafında Türk devleti sayısı kadar yıldız».
Sınır: faşist/komünist sembol, slogan, ideoloji ya da başka milletlere düşmanlık yok (sahip «faşist» dedi; yapılmadı). Esin yalnız afiş görselliği,
içerik Türk tarihi ve Atatürk'ün sözleri.

## Yön değişiklikleri (sahibin tepkisiyle)
- İlk portreler (yandan, şekilden piksel) «iğrenç»: sahibin gösterdiği örneklere göre önden, iri pikselli, yağlıboya dokulu, yaldız çerçeveli tablolar.
- Siluet zafer tabloları (Malazgirt, İstanbul, Çanakkale, Büyük Taarruz) «pixel artları çok kötü»: kaldırıldı. Yerine önceki turun elle ayarlanmış sahneleri
  (Ötüken, Kocatepe 26 Ağustos 1922, Semerkant; kaynak `belgeler/tasarim/turk-tema/`, artık depoda). Malazgirt, İstanbul ve Çanakkale bu kalitede yapılınca eklenir.

## Ne var
- `kabuk/ata.js`: 15 portre (32×32; Mete, Attila, Bumin, Bilge, Kül Tigin, Tonyukuk, Alp Arslan, Osman Gazi, Fatih, Yavuz, Kanuni, Timur, Babür, Enver, Atatürk),
  8 harita (Büyük Hun, Göktürk, Uygur, Karahanlı, Büyük Selçuklu, Timur, Babür, Osmanlı; en geniş hâl, «yaklaşık», tarih kaynağı TDV İslâm Ansiklopedisi),
  12 Türk simgesi (tuğ, Asena, kurt başlı sancak, ay yıldız, sekiz köşeli yıldız, çift başlı kartal, yay ve ok, kılıç, kalkan, kopuz, otağ, kös; adı ve bir cümle bilgi),
  logo (al mühür, dış kuşakta on altı yıldız = on altı büyük Türk devleti, ortada bozkurt başı). Test: `kabuk/ata.test.js` (CI'da).
- `kabuk/tablo.js`: üç tarih tablosu PNG (420×236 masaüstü 2×, 336×189 telefon 1×); açılış yüküne girmez, tablo gösteren sayfada yüklenir.
- Yerleri: günün sözünde sözün sahibi; Divan'da hükümdar; Tarih'te bugünün devletinin hükümdarı, günün haritası, «Bütün haritalar», tarih tabloları,
  Türk simgeleri; 26 ve 30 Ağustos'ta söz kartında Kocatepe; her sayfanın mührünün üstünde simge bandı; üst çubukta ve sekme simgesinde logo.
- Ayarlar › Tema: **Kızıl Otağ**, **Ordu**, **Gök Börü**, **Ergenekon**, **Akıncı** (koyu) ve **Seferberlik** (açık). Kökte `data-theme` + `data-afis`;
  dar kalın büyük harf başlık ve düğmeler, keskin köşe, sayfa tepesinde al–altın şerit, başlığın altında simge bandı, sahne SVG süzgeciyle baskı gibi
  birkaç tona iner. Yazı AA: en düşük 5,0 (hepsi ölçüldü).

## Panolar
`pano-1-tema.png` (Bugün ve Tarih, 1280 ve 390), `pano-2-portre.png` (galeri, söz, Divan), `pano-3-harita.png` (galeri, Tarih), `pano-4-logo-tablo-simge.png`.

## Açık
- Malazgirt, İstanbul'un fethi, Çanakkale: Kocatepe kalitesinde, sahne motoruyla (piksel-doga) çizilmeli.
- Kurulu uygulama simgesi ve `brand/life/favicon.png` hâlâ eski logo (tools/piksel_gorsel.js eski figürden üretir); kabuk sekme simgesini çalışırken logodan kurar.
- Mevcut kapak sahnelerinde işçilik turu yapılmadı (gece ışık havuzları bilerek titreşimli; sert halka şikâyeti vardı).
