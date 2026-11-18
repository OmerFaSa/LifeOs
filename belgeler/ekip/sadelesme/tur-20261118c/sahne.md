# Tur 18 Kasım c · Kapak sahneleri: daha güzel, daha kaliteli, daha çeşitli

Sahibin sözü (2026-11-18): «arkadaki piksel artları daha güzel, daha kaliteli ve daha çeşitli yapabilirsin».
Dokunulan: `brand/ortak/piksel-doga.js`, `brand/ortak/piksel.test.js`. `kabuk/` dokunulmadı. Commit yok (koordinatör yapar).

## Durum
- [x] Önce (HEAD 0cb9c226) çizimleri
- [x] Çeşitlilik çekirdeği (tarih + sahne tohumu, mevsim, hava)
- [x] Sahne zenginleştirme
- [x] Önce/sonra panoları
- [x] Testler, bayt, süre
- [x] Rapor

## Yön
Sahibin ölçütü: elle ayarlanmış üslup esas, yeni yordamsal çizim yok. Bu yüzden sahnelerin hiçbiri yeniden çizilmedi; var olan
yapı taşları (sırt, kar dilleri, zemin bantları, otlar, ağaç, otağ, bulut) güne ve mevsime göre değişen girdiler alıyor.
Yeni çizim yalnız üç küçük parça: kümülüs bulut, sis şeritleri, durağan yağış. Hepsi tek ya da iki renk, titreşim yok ya da azıcık.
İki yinelemede reddettiğim hâller: Bayer titreşimli sis (dama tahtası, kumlu görünüyordu) → düz şerit; yoğun yağmur/kar (gürültü) → üçte bir yoğunluk;
kışın «v» ot öbekleri (kar üstünde kuş sürüsüne benziyordu) → tek kuru sap.

## Ne değişti
Ortak (bütün açık hava sahneleri):
- **Bulut**: günün türü kümülüs (düz taban, iki üç tümsek, alt satır gölge, iki renk) ya da eski ince katman bulutu; sayısı havaya göre (açık 1-3, bulutlu 4-6, yağışta 4-7), iri bulut bulutlu/yağışlı günde. Bulutlar üst üste binmez.
- **Kapalı gök** (yağmur, kar): gök gri tona karışır (gece koyu griye), güneş/ay, ufuk halesi, Samanyolu, yıldız ve kayan yıldız görünmez; pencereli iç sahnelerde duvara güneş lekesi düşmez.
- **Sis**: ufka yaslanan üç düz şerit, uzak ve orta katmanın üstünde (paralaksta orta katmanla kayar); yer yer incelir, kopar. Şafakta pembe, gece mavi (ton zaten vaktin ışığından).
- **Yağış**: yağmur eğik kısa çizgi, kar tane; sağ yarıda (x < 0.4W boş, başlık sakin), ön katmanda.
- **Mevsim**: zemin bantları kışın kar (rüzgâr gölgesi çizgileriyle), sonbaharda sarı-kızıl, ilkbaharda taze yeşil; yaz = eski görünüm. Kışın uzak sırtlara var olan kar dilleri mekanizmasıyla kar başlığı, yakın sırtlara kar örtüsü; ağaç tacı ilkbaharda açık yeşil, sonbaharda turuncu-altın, kışın karlı; otlar kışın kuru sap.
- **Ön plan derinliği**: alt kenara yakın ot öbekleri bir piksel uzun.
- **Keçe/dokuma rengi** (günlük, 4 takım: kırmızı, lacivert, yeşil, erik): otağ kuşağı, nakışı ve kapısı; Not kilimi; hattat minderi; King sancakları.
- **Kuş sürüsü**: kuşu olmayan açık hava sahnesinde kimi gün bir sürü geçer; ilkbahar/sonbaharda beşli V dizisi (göç).

Sahne sahne:
- Ötüken (Bugün): 2-4 at, yeri ve donu günlük; kimi gün koyun sürüsü; ufuktaki atlının zamanı günlük.
- Ufuk (Plan): kuş sayısı ve yüksekliği günlük; kimi gün ufukta atlı yolcu; karaağaç mevsimle renk değiştirir.
- Kale (Tarih): kışın yamaç karlı; sürü, bulut, mevsim.
- Medrese: kuş sayısı günlük; sis kentin siluetini örter.
- Kitaplık (Akademik): raftaki kitap dizilimi günlük; pencerede yağmur/kar, kışın karlı ova.
- Hattat, Not: pencere havası ve kış; minder/kilim günün dokumasıyla.
- Kervansaray (Dil): kervan 2-4 deve, rengi günlük.
- Ateş (Müzik), Çadır (Uyku): atın donu günlük; çadırda kapalı gecede yıldız tozu yok.
- Yaylak (Hareket): sürünün yeri günlük; ilkbaharda çiçek bol, kışın yok; kışın çayırlar karla örtülü.
- Pınar (Beslenme): çınar mevsimle; bostan yaprakları sonbaharda sarı, kışın yok.
- Taht (King): sancak rengi günlük.

## Çeşitlilik kuralı
- `yerlesim(W, H, v, tur, gun)`: beşinci değer isteğe bağlı (Date ya da ms); yoksa bugün. Kabuk değişmeden bugünü kullanır.
- `gunHali(gun)` (dışa açık) → `{ no, mev, hava }`. **Mevsim aydan**: Ara-Şub kış, Mar-May ilkbahar, Haz-Ağu yaz, Eyl-Kas sonbahar.
  **Hava yalnız tarihten** (o gün bütün sayfalar aynı havayı görür): açık %40, bulutlu %28, sis %12, kalan %20 kışın kar, ilkbahar/sonbaharda yağmur, yazda çoğunlukla açık (%6 yağmur).
- **Dizilim tarih + sahneden**: `o.r = tohum(adTohum(sahne) + gün × 7919)` → bulut sayısı/türü/yeri, keçe rengi, at, sürü, kuş, kervan, kitap dizilimi.
- Gün içinde sabit (gün numarası yerel tarihten); test bunu 08:00 ile 23:50 arasında denetler. Gece yarısı kabuğun önbelleği (`sahneOnbellek`) yenilenmeden eski günü gösterebilir: sorun değil.

## Panolar (`sahne-gorsel/`, toplam ~290 KB, 256 renk PNG)
- `once-sonra-ogle.png`, `once-sonra-safak.png`, `once-sonra-gece.png`: 14 sahne, sol HEAD, sağ yeni (bugün: 18 Kasım = sonbahar, bulutlu).
- `cesitlilik-ogle.png`: 8 sahne × 4 gün (yaz açık, ilkbahar yağmur, sonbahar bulutlu, kış kar).
- `cesitlilik-safak-gece.png`: Ötüken, Medrese, Çadır, Kale × şafak/gece × 4 gün (ilkbahar sis, sonbahar yağmur, kış açık, yaz sis).

## Ölçümler
- Bayt: `piksel-doga.js` 98 051 → 107 497 (**+9.4 KB**; hedef ≲ +6 KB aşıldı). `python kalite/olcum.py --denetle`: «Bütçe tamam: 28 bütçe, aşım yok». Kısaltma payı: yorumlar ~1.2 KB, Türkçe karakterler UTF-8'de iki bayt.
- `binaCiz` (node, sahte tuval, 3 çağrının en kısası): bugün (sonbahar bulutlu) en kötü 480×100 otuken gece 5.38 ms (HEAD 5.29); her mevsim × hava × 14 sahne × 4 saat taramasında en kötü 480×127 **6.35 ms** (kış bulutlu, kale, 23:00). Sınır 8 ms.
- Renk: 16 mevsim/hava × 14 sahne × 12 saat taramasında en çok 71 (sınır 72), üst-sol en çok 8, boşluk yok, ufuk altında tek açık renkli satır yok. (480×127 bugün gece otuken 73 renk; test o boyu saymıyor, HEAD 71'di.)
- Testler: `node tools/ortak_test.js` → 281 geçti, 0 kaldı (piksel 55/55).

## Test değişikliği
- «her sahne her saatte…» testi açık bir güne (1 Haziran 2026) sabitlendi: gök ölçü noktası bulut/sis/kapalı gökten etkilenmesin, test hangi gün koşarsa koşsun aynı sonuç versin. Sınırlar (72 renk, üst-sol 8) değişmedi.
- Yeni test «günün hâli»: mevsim eşlemesi; beş havanın hepsi 800 günde çıkar; her mevsim×hava × 14 sahne × (7, 12.5, 23) boşluksuz, ≤72 renk, üst-sol ≤8; aynı gün aynı piksel (08:00 / 23:50), beş ardışık günde her sahne en az bir kez değişir.

## Açık kalanlar
- Bayt +9.4 KB (hedef +6 KB). İstenirse yorum kısaltma ya da ince bulut türünü kaldırma ile ~2 KB inilir.
- Gerçek uygulamada (kabuk, 3× ölçek) gözle bakılmadı; panolar node çizimi.
- Sis şeritleri ince ayar isteyebilir (kalınlık H'ye göre; telefonda 68 px boyda incecik kalıyor).
- Gece kar taneleri ay ışığı tonunda; koyu gökte soluk görünüyor (bilinçli: sakin).
