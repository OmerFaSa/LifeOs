# Piksel sahneler · Başbuğ turu (2026-11-16b)

Sahip isteği: eski piksel sahneleri sıfırdan sil, her yere işine uygun yeni, profesyonel sahne çiz (Türk/Türkistan + Anadolu, ağırbaşlı, sakin).

## Durum
- Devralındı (2026-11-16, ikinci ajan): önceki ajan keşfi bitirip piksel-doga.js'i yazdıktan sonra hesap sınırında kesildi. Kalan: sözdizimi, KAPAK, takma adlar, test, ölçüm, görseller.
- [x] keşif (API, kullanıcılar)
- [x] yeni sahneler (ilk yazım; doğrulanacak)
- [x] KAPAK eşlemesi
- [x] testler
- [x] ölçümler
- [x] görseller (gerçek kabuk, gündüz/gece, 1440 ve 390; 56 görüntü)

## Değişen dosyalar
- `brand/ortak/piksel-doga.js`: sıfırdan 14 sahne (eski 10 sahne silindi), API korundu (`vakit, yerlesim, binaCiz, kare, kareAl, durgun, POZ, PALET, P_SABIT, TUR_LISTE, INSAN`) + `ESKI` (eski ad → yeni sahne), sahne başına `gxt` (telefonda gök cismi x'i). 83,5 KB → 63,1 KB.
- `brand/ortak/piksel.test.js`: sahne testleri yeni sahnelere göre yeniden yazıldı (deterministik zaman ve hareket-az testleri korundu).
- `kabuk/kabuk.js`: yalnız `var KAPAK = {…}` bloğu.
- `belgeler/ekip/sadelesme/tur-20261116b/piksel-gorsel/`: `sahne-<yer>-<gunduz|gece>-<1440|390>.png` (14 yer × 2 × 2).

## Yer → sahne
| sahne | ne | yerler |
|---|---|---|
| otuken | Ötüken'de şafak: otağlar, tuğ, otlayan atlar, ufukta atlı | Bugün (kabuk 'yayla' ister → takma ad), harita |
| ufuk | sabah ufku, uzanan yol, tek ağaç, kuşlar | plan, motorlar (Araçlar), arama |
| kale | kale burçları, bayrak, kartal | tarih, soru, onay (Yönetim) |
| medrese | Semerkant medrese avlusu, taç kapı, çini kubbe | felsefe, ogren |
| kitaplik | çalışma odası, pencere, kitaplık | akademik, tekrar |
| hattat | hat levhası, rahle + açık kitap, hokka, kemerli pencere | okuma |
| yazi | yazı masası, açık defter, pencere | not |
| kervansaray | kervansaray, yol, kervan | dil, yol |
| ates | bozkırda ateş başı, kopuzlu ozan, otağ, at | muzik |
| yaylak | dağ yaylası, yayla evleri, patika, kartal | hareket, saglik |
| pinar | su başı (çeşme), çınar, kuşlar | beslenme, kayit |
| cadir | gece kara çadır, köz, uyuyan at, samanyolu, kayan yıldız | uyku |
| sifahane | şifahane, taç kapı, kümbet, servi, havuz | tahlil |
| taht | otağ içi: kerege, taht, iki tuğ; gündüz tündük ışığı, gece mangal | king |

## Test çıktıları
- `node tools/ortak_test.js` (tam): `274 geçti, 0 kaldı, 23 eski modül vakası atlandı`; `✓ piksel: 48/50 (2 eski modül vakası atlandı)`, `✓ sinematik: 4/6` (eski adlar takma adla çalışıyor). Son düzeltmeden sonra yeniden: `✓ piksel: 48/50`, `✓ sinematik: 4/6`, `52 geçti, 0 kaldı`.
- piksel sayfasında `[sayfa hatası] Cannot set properties of undefined (setting 'ritim')` yazıyor: kaynağı `brand/ortak/king-arac.js:254` (bu paketin dışı), test sayımını etkilemiyor.
- `python kalite/olcum.py --denetle`: `Bütçe tamam: 28 bütçe, aşım yok.`
- Yeni testler: 14 sahne × 4 vakit × 2 boy kurulur/boşluksuz çizilir; eski adlar yeni sahneye; üst-sol ≤ 8 renk, sahne ≤ 72 renk (ışık karışımları dahil), masaüstünde gök cismi diski 19. satırın altında; yeniden kurulan sahne aynı t'de aynı kare (sayfaya dönüş), Not dışında her sahne canlı; sprit dikdörtgen/palet; hareket azken durgun; açık hava sahnelerinde ufkun altında başlığı biçen tek renk satır yok.

## Ölçümler
- Sahne çizim süresi (Node, 427×100, gündüz, 5 denemenin en kısası; **ölçüldü**): eski 4,9–29,4 ms (selale 29,4, magara 22,1, dag 11,9) → yeni 0,6–2,8 ms.
- Gerçek kabuk, 1280×800, 4× yavaş CPU, kapaklı 12 gezinme, önce = HEAD piksel-doga + eski KAPAK (istek yakalama), 3'er koşu (**ölçüldü, gürültülü**):
  - önce: en uzun kare 417 / 450 / 583 ms, medyan 133 / 117 / 167 ms
  - sonra: en uzun kare 467 / 467 / 500 ms, medyan 133 / 133 / 117 ms
  - boşta 5 sn: ikisinde de >50 ms kare 0, en uzun 17 ms.
  - Yorum (**çıkarım**): fark gürültü içinde; en uzun kare her iki sürümde de ilk gezinmede (felsefe) ve sahne çizimi artık ≤ 3 ms olduğundan kaynağı sahne değil. Önceki turun 283 ms'i başka betik/başka çalışma kopyası; kıyas aynı koşulda önce/sonra.

## Açık kalanlar
- Not sayfasında «Ayrıntılı not» düğmesi 1440'ta kapak sahnesinin üstüne (pencerenin içine) biniyor: sayfa yerleşimi, kabuk ajanının alanı.
- `king-arac.js:254` sayfa hatası (`KI` tanımsız) piksel test sayfasında; bu paketin dışı.
- Telefonda (390) sağdaki asıl öğe yer yer yuvarlak arama/hesap düğmelerinin arkasına düşüyor (kapak 136 px, çubuk 56 px); düğmelerin zemini olduğu için okunurluk bozulmuyor.
- Performans ölçümü gürültülü; ilk gezinmedeki 400-580 ms'lik kare sahneden değil, ayrıca bakılmalı.
- Müzik sahnesinde ozan hâlâ küçük (12×11 px, masaüstünde 36 px); daha yakın plan istenirse sahne yeniden kurulmalı.

## Keşif notları (ilk)
- Kabukta görünen tek sahne kitaplığı `brand/ortak/piksel-doga.js` (`LIFEOS.PIKSEL_DOGA`); `piksel-apartman.js` eski modüllerin mahallesi (kabukta yok), dokunulmayacak.
- Korunacak API: `vakit, yerlesim(W,H,v,tur), binaCiz(g,o), kare(g,arka,o,t)→0/1, kareAl, durgun, POZ, PALET, P_SABIT, TUR_LISTE, INSAN`.
  Kullananlar: `kabuk/kabuk.js` (manzara/bostaCiz/sahneYap/canlandir), `brand/ortak/piksel.js` (yüklenme manzarası, TUR_LISTE döngüsü), `brand/ortak/sinematik.js` (eski adlar: dag, yayla, tarla, kiraz).
- Bugün'ün tuvalinde `data-sahne` yok → kabuk `'yayla'` ister; eski adlar yeni sahnelere takma adla gider (dosyalarına dokunmadan).
- Kapak boyu: masaüstü 300 px (tuval W/3 × 100), telefon 136 px (tuval W/2 × 68); Bugün 300/260. Başlık sol-orta (x ≈ %25-50), arama kutusu sağ üst (x ≈ %69-87, y < 55 px).
- Önce (eski sahneler) görüntüleri: yayla güneşi 1440'ta tam arama kutusunun arkasında.

## Devralan ajanın adımları
- Sözdizimi + Node duman testi: 14 sahne + 10 eski ad × 4 boy × 2 vakit, 200 sn hareket: 0 hata.
- KAPAK (kabuk/kabuk.js) yeni adlara geçti (aşağıda liste). Eski adlar `PIKSEL_DOGA.ESKI` ile gider (yayla→otuken, dag→yaylak, tarla→ufuk, kiraz/gol/selale→pinar, deniz/col→kervansaray, magara→medrese, kis→cadir); sinematik.js ve piksel.js dokunulmadan çalışır.
- İlk görüntülerden sonra düzeltilen zayıf sahneler: iç mekân duvarı başlığın arkasında Bayer kumlanması yapıyordu → düz duvar (tavan gölgesi üst çubuğun altında); Okuma (hattat) boştu → hat levhası, büyük rahle + açık kitap, alçak yazı masası (hokka, kamış kalem), gece mum masada; Müzik (ateş) ozan ve ateş çok küçüktü → 12×11 kopuzlu ozan, 5×6 alev, sahne alt soluklaşmanın üstüne çıktı; Uyku (çadır) kara çadır alt soluklaşmada kayboluyordu → ufuk 0.62, çadır büyüdü; King kerege kafesi başlığın arkasında parlaktı → sönük tek ton.
