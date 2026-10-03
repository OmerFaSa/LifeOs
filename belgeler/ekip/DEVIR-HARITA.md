# Devir — SPİ rota haritası (Strava benzeri)

> **DURUM (2026-10-03): KOD TAMAM, BİR KARAR BEKLİYOR.** GPX içe aktarma ve
> canlı kayıt bitti, testli ve denetimli. Telefonda canlı kaydın çalışması
> için uygulamanın **https** ile servis edilmesi gerekiyor; nasıl olacağı
> depo sahibinin kararı (aşağıda «Açık karar»).

## Kullanıcının kararları

- Yer: SPİ › Hareket › **Kardiyo**. Ekranda tek kart; ayrıntı kağıtta
  («minimalistliği bozmadan»).
- Rota iki yoldan gelir: **canlı kayıt** («rotayı biz hareket ederken
  çizecek») ve **GPX dosyası** (Strava / saat dışa aktarımı).
- Zemin: **OpenStreetMap karoları** — «veri cihazda kalır» ilkesine
  bilinçli istisna (SPI/src/MIMARI.md › Modül 3). Rota ve GPS noktaları
  cihazda kalır.

## Nerede ne var

| Dosya | Ne |
|---|---|
| `SPI/src/js/core/rota.js` | Hesap: GPX okuma, mesafe/hareket süresi/tempo/tırmanış, dilimler, profil, iz sıkıştırma, `noktalardan` (canlı kayıt da buradan geçer) |
| `SPI/src/js/core/harita.js` | Çizim: Web Mercator, OSM karoları, ısı haritası, yükseklik profili |
| `SPI/src/js/core/canli.js` | Canlı kayıt motoru: `watchPosition`, 30 m doğruluk eşiği, duraklat = yeni parça, `spi.canli.<profil>` taslağı, Wake Lock, konum boşluğu sayımı |
| `SPI/src/js/screens/move.js` | Kart, kağıtlar, canlı ekran (saniyede bir yalnız metin tazelenir) |
| `SPI/src/tests/rota.test.js`, `canli.test.js` | Birim testleri (sahte konum kaynağı, saat, depo) |
| `SPI/tools/smoke.js` | GPX akışı + **gerçek konum servisiyle** canlı kayıt (Playwright konum öykünmesi) |

## Açık karar — telefonda canlı kayıt

Tarayıcı konumu yalnız güvenli bağlantıda verir. Bugünkü telefon yolu
(`dist/spi.html`'i `file://` ile açmak) ve `127.0.0.1`'e bağlı
`sistem/sunucu.py` telefona konum vermez. Seçenekler:

1. **https'li statik yayın** (ör. GitHub Pages): uygulama kodu yayımlanır,
   veri yine telefonun tarayıcısında kalır. «Ana ekrana ekle» ile tam
   ekran açılır. Ekran açık kaldıkça kayıt çalışır. Depo herkese açık
   olmalı ya da ücretli plan gerekir; yayın dışa dönük bir adımdır, depo
   sahibinin onayı olmadan yapılmaz.
2. **Yerel ağ + https** (`sistem/baslat.py --ag` hiç yazılmadı; belgeler/TEKNIK.md
   «Neden yerel ağ modu yok»): koşuya çıkarken PC'ye bağlı kalmaz ama
   sertifika güveni telefonda zahmetli.
3. **Yerel uygulama sarmalayıcısı**: kilitli ekranda da kayıt; AGENTS §1.3'e
   istisna ister (iOS için ayrıca Mac gerekir).

## Ortam notu

`tools/sayilar.py --tam` bu makinede `python3` (Install Manager, paketli)
ile koşunca alt süreçteki node Playwright tarayıcısını göremiyor ve bütün
node denetimleri «KALDI» der. Paketsiz Python ile koşulmalı:
`C:\Users\ASUS\AppData\Local\Programs\Python\Python312\python.exe tools/sayilar.py --tam --yaz`
(çıktı dosyaya yönlenirse `PYTHONIOENCODING=utf-8` de gerekir).

## İleride

- Strava toplu dışa aktarma zip'i ve Apple Sağlık `workout-routes/*.gpx`
  — `core/saglikice.js › zipGirdisi` yeniden kullanılabilir.
- Kayıt sürerken başka ekrandayken küçük bir «kayıt sürüyor» işareti
  (şu an yalnız Kardiyo kartında görünür).
