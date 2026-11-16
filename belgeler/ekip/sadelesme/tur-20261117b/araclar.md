# Tur 2026-11-17b · Araç ekranları (Plan, Not, Kayıt, Tekrar, Sağlık, Yönetim, Tanışma, Deneme, Hesap)

Sahip: araç ekranları ajanı. Dal `sadelesme`, başlangıç HEAD 07f8bdc9. Commit/push yok.
Dosyalarım: kabuk/araclar.js, saglik.js, onay.js, tanisma.js, deneme.js, hesap*.js (+testler).

## Durum
- [x] 0. Okuma (AGENTS §0.1, bilesen.css başı, önceki raporlar)
- [x] 1a. Plan: tek ana eylem
- [x] 1b. Not: «Ayrıntılı not» manzara kapağına biniyor (1440)
- [x] 2. Gezi (1440/390, açık/koyu, boş/dolu) + ham düzeltmeler
- [x] 3. Testler + kalite kapısı

## Bulgular ve düzeltmeler
Önce çekimi: yalıtılmış sunucu (tools/gez_sunucu.js, geçici LOCALAPPDATA/APPDATA/LIFEOS_HESAP_KLASOR), 16 ekran × boş/dolu × 1440-açık/390-koyu
+ plan kurulu; betik scratchpad `araclar/cek.js` (ölçüm: görünür düğmeler ve türleri, ana düğme sayısı, başlık eylemi ↔ kapak kesişmesi, yatay taşma).

Bulunan hamlar (önce):
- Plan: boşken ana düğme yok (Hafta planı · Aralık ekle · İş ekle üçü eşit); kurulunca ana düğme «Yeniden kur» (yanlış eylem öne çıkıyor);
  boş zaman yazılmışken bile aralık formu hep açık kart.
- Plan haftası: başlıkta «planlanan 75 dk (hesaplandı)», bugünün sütununda «75 dk (tahmin)» (aynı sayı iki etiket); boş günde iki satır
  («Bu günde blok yok.» + «Planlanan iş yok»); boşken «Önce boş zamanını yaz» ikincil.
- Not: «Ayrıntılı not» başlık eylemi 1440'ta manzara kapağının içinde, sahnenin (pencere) üstünde (ölçüldü: düğme 136-180 px, kapak 0-300 px).
- Not: yer tutucu «[[başka not]] kullanabilirsin» diyor ama motor yalnız `[[not:kimlik|ad]]` biçimini bağ sayıyor; adla yazılan bağ hiç bağ olmuyor
  (3 not, 0 bağ). Bağsız notlarda «Not ağı» 450 px'lik boş kutu.
- Silme: not/kayıt/kart silme tarayıcının confirm() penceresi («Geri alınamaz»); Plan'da aralık/iş/sabit blok sorusuz ve geri bildirimsiz siliniyor.
- Kayıt: hareket kaydı «40 dakika (ölçüldü) · 6 (ölçüldü)»: birimsiz sayının ne olduğu yazmıyor.
- Tekrar: kart yokken tek eylem «Kartı ekle» ikincil (ana yok).
- Sağlık: boşken dört «Kaydet» ikincil + «Tahlil ekle» ana (asıl iş bugünü kaydetmek, ana düğme tahlilde).
- Hesap: «Açılış videosu» bölüm başlığı ve satır adı aynı (iki kez); satırda tıklanamayan soluk «Kapalı» düğmesi.


Düzeltmeler (yapıldı, kabuk/araclar.js · saglik.js · acilis.js):
- Plan tek ana eylem: boş zaman yokken «Aralık ekle», öneri varken «Planı kur», plan kuruluyken sıradaki (ilk bekleyen) bloğun «Yapıldı»sı;
  «Yeniden kur» ve «Hafta planı» sade; boş zaman yazılmışsa aralık formu kapalı «Başka aralık ekle» açılırında.
- Plan haftası: boşken «Önce boş zamanını yaz» ana, doluyken «Sabit blok ekle» ana; boş gün tek satır; hafta toplamının etiketi günlerden
  (bir gün tahminse toplam «tahmin»).
- Not: «Ayrıntılı not» başlıktan çıktı, hızlı kutunun solunda sade düğme (Kaydet sağda); «Ctrl + Enter» ipucu yer tutucuda. Ölçüm: kesişme 0.
- Not: `[[Notun adı]]` kaydederken tek eşleşen nota kimlikli bağ olur (`Arac.adBagla`; birden çok/hiç eşleşme yoksa metin aynen kalır).
  Bağ yokken boş ağ kutusu yerine tek satır ipucu; 6 ve daha az notta ağ 240 px (eskiden 400).
- Silme geri alınabilir: not, kayıt, kart, boş zaman aralığı, iş, sabit blok sormadan silinir ve aynı sayfada «… silindi. [Geri al]» iletisi kalır;
  «Geri al» depodaki önceki değeri yazar, «Geri alındı.» der. Başka bir eylem ya da sayfadan çıkış iletiyi kaldırır. confirm() pencereleri kalktı.
- Kayıt: birimsiz sayı adıyla («Zorluk (RPE) 6»), ölçekli olan ölçeğiyle («3/5»).
- Tekrar: sırada kart yokken «Kartı ekle» ana.
- Sağlık: kaydı olmayan ilk satırın «Kaydet»i ana, öbürleri sade; «Tahlil ekle» ancak bugün dolunca ana.
- Hesap › Açılış videosu: video yokken bölüm adını yineleyen satır ve açılamayan «Kapalı» düğmesi yerine tek cümle; video varken satır «Açılışta oynat»
  (kabuk/acilis.js: listede sahibi yok, Hesap ekranının parçası olduğu için ben düzelttim).

## Kabuk ajanına istekler (CSS / gezi)

## Kalite kapısı sonuçları

## Açık kalan

## Kapanış (2026-11-17, devralan oturum)
Ajan hesap sınırında kesildi; devralan oturum: davranış gezisi (gez2.js) 21/21 geçti, `acilis.test.js` ve `kabuk_gez` açılış videosu adımı yeni davranışa (video yokken anahtar yok, tek cümle) güncellendi, yerel CI yeşil.
