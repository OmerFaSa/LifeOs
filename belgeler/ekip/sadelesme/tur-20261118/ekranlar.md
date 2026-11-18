# Tur 2026-11-18 · Ekranlar: Ayarlar, Hesap, Sağlık, Plan, Not

Sahibin isteği (2026-11-18): «görsel kaliteyi arttırır mısın». Paket: tercih seçici taşma hatası (telefon), Ayarlar ve Hesap rafine, Sağlık Bugün kutucukları, Plan boş durum ve formu, Not rötuşu.
Dosyalar: kabuk/bilesen.css (yalnız tercih ve alan/form), kabuk/bilesen.js (tercih), kabuk/araclar.css, kabuk/araclar.js (Plan/Not), kabuk/saglik.js, kabuk/hesap*.js ve kabuk/ayar.js (yalnız çizim kısmı), tools/kabuk_gez.js (bir denetim). Commit yok.

## Durum
- [x] 1 Tercih seçici taşması (320/390) + kabuk_gez denetimi
- [x] 2 Ayarlar ve Hesap
- [x] 3 Sağlık Bugün, Plan (Not'a dokunulmadı: gerek görmedim)
- [x] Önce/sonra görseller (ekranlar-gorsel/)
- [x] Kalite kapısı
- [x] Bayt farkı

## Ne değişti
**1 · Tercih seçici (hata).** Kök: `.b-tercih` hap biçimliydi (`--kose-tam`); dar ekranda seçenekler satır kırınca hap şekilsiz bir yumağa dönüyordu. «Yazı tipi»nin kesik görünmesi tam sayfa görüntüde sabit alt çubuğun içeriğe binmesiydi; gerçek ekranda yatay taşma yoktu (ölçüldü).
- `bilesen.css`: tercih kabı `--kose` köşeli (hap değil), `max-width:100%`, seçenekler `flex:1 0 auto` (sarınca satırlar dolar).
- Telefonda (≤640) ayar satırında denetim tam genişlik; tercih iOS bölmeli seçim gibi satırı doldurur, seçenekler eşit genişlikte (`flex-basis:0; min-width:max-content`: sığmayan ezilmez, alt satıra geçer). Vurgu rengi 390'da 4+3, 320'de 2+3+2 dengeli satır; renk noktaları (kabuk.css) aynen.
- Hesap sekmelerindeki tercih (`.hs-sekmeler`, kabuk.css) etkilenmez: telefon kuralı yalnız `.b-ayar .b-tercih`.
- `tools/kabuk_gez.js`: yeni denetim «ayarlar: 320/390 px'te hiçbir tercih seçicisi kutusundan taşmaz, seçenek kesilmez, sarınca hap olmaz». Eski kurallar sayfaya geri enjekte edilince denetim üç seçiciyi «çok satırlı hap» diye yakaladı (scratchpad `ekr/dene.js`).

**2 · Ayarlar ve Hesap.**
- Ayar satırı daha ferah: iç boşluk 12/16 → 16/24 px, en az 68 px yükseklik; açıklama satır aralığı 1.45. Satırlar arası ayraç kenardan kenara değil, iç boşluktan başlar (ince, `--cizgi`; yüksek kontrastta güçlü çizgi).
- Hesap, oturum yokken her görünüm (kur, giriş, kod, şifre unuttum, bağlan) bir **karşılama kartı** (`.hg-kart`, hesap-giris.js `kart()`): kişi simgeli kısa serif başlık («Bu bilgisayarda henüz hesap yok.» / «Bu cihazda giriş yapılmadı.»), açıklama arayüz yazısıyla (eskiden büyük serif okuma yazısı), alanlar kartın içinde hizalı, kurtarma sorusu ince ayraçla ayrı, tek ana eylem kart genişliğinde. Kart 30rem, orta gölge, kenar çizgisi yok (yüksek kontrastta ince çerçeve). Eski serif giriş kuralları silindi.

**3 · Sağlık, Plan.**
- Sağlık Bugün: dört kutudaki «— · Bugün kayıt yok · Kaydet» tekrarı kalktı. Kutuda üstte simge ve köşede «+» (üzerine gelince ana düğme renginde), altında ad; boşken silik «—» ve türe özgü kısa soru («Ne yedin?», «Kaç dakika hareket?», «Kaç saat uyudun?», «Tartıldın mı?»); doluyken büyük serif değer, altında ayrıntı · kesinlik etiketi. Tek ana çağrı: hiç kayıt yokken «Bugün» başlığında «Kayıt ekle»; kayıt varken ana eylem Tahliller'e geçer. Ad artık simge satırının altında: dar kutuda «Gece uykusu» kesilmez. Kutunun tamamı yine Kayıt'ın o türüne bağlantı; aria-label aynı.
- Plan: boş zaman yokken tek kart (başlık + kısa açıklama + saat aralığı + tam genişlik «Aralık ekle»); eskiden boş durum kartı, yalnız duran «Hafta planı» ve ayrı «Boş zamanım» formu alt altaydı. «Hafta planı» «Bugünün planı» başlığının sağında. Boş zaman varken düzen eskisi gibi (liste + «Başka aralık ekle»). 360 px altında Plan'ın iki sütunlu alanları tek sütun (tarih alanı kesilmiyordu).
- Not: dokunulmadı (17d/17e turlarında düzenlenmişti, panoda sorun görmedim).

## Görseller
`ekranlar-gorsel/` (webp; soldan sağa önce → sonra):
- `ayarlar-telefon.webp`: 390 koyu önce/sonra, 320 açık önce/sonra.
- `ayarlar-1440.webp`: önce açık, sonra koyu.
- `hesap.webp`: 390 açık önce/sonra, 1440 koyu önce/sonra.
- `saglik.webp`: boş 390 koyu önce/sonra, dolu 390 açık sonra, boş 1440 açık önce/sonra, dolu 1440 koyu sonra (önce-dolu çekimi kayıt enjeksiyonu hatasıyla bozuk çıktı; 17e panosunda var).
- `plan.webp`: boş 390 açık önce/sonra, dolu 390 koyu önce/sonra, boş 1440 koyu önce/sonra.
Çekim: scratchpad `ekr/cek.js` (yalıtılmış sunucu, geçici LOCALAPPDATA/APPDATA/LIFEOS_HESAP_KLASOR; 1440/390/320 × açık/koyu; Sağlık dolu Kayıt motorunun `kaydet`iyle, Plan dolu formla). Her çekimde tercih taşma ölçüldü: sonra'da 0. Tam sayfa görüntüde sabit alt çubuk içeriğe biner (gerçekte değil). Üç yineleme: (1) tercih hap → köşeli + tam genişlik; (2) eşit genişlikte vurgu seçenekleri eziliyordu → `min-width:max-content`; Sağlık adı «Gece uy…» kesiliyordu → ad simge satırının altına; (3) Plan kartı dar kalıyordu → tam genişlik, 320'de tarih alanı → tek sütun.

## Bayt farkı (LF)
Başlangıç anlık kopyasına göre (öbür ajanların eşzamanlı işi hariç): bilesen.css +578, araclar.css +96, araclar.js +230, saglik.js −82, hesap-giris.js +483 (ilk kullanımda yüklenir, açılış yükünde değil). **Net +1305 B** (açılışa giren: +822 B). Silinenler: Sağlık eylem hapı/alt satır/etiket/ana kutu kuralları, Hesap serif giriş kuralları.

## Testler
- `node kabuk/bilesen.test.js` 24 geçti, 0 kaldı (ilk denemede `calc()` köşe jeton kuralına takıldı → `--kose`).
- hesap 12/0, hesap-giris 16/0, hesap-baglanti 14/0, hesap-yonetim 17/0, kabuk 74/0, saglik 6/0.
- `node tools/kabuk_gez.js`: çıkış 0, 380 ✓ (yeni tercih denetimi dahil; Sağlık «en çok bir ana eylem» ve Plan akışları geçti).
- `node tools/hareket_gez.js`: çıkış 0, 44 ✓, «hepsi geçti».

## Açık kalan
- Ayarlar'ın üstteki grup gezinmesi (telefonda üç satır hap) kabuk.js/kabuk.css'te; dokunmadım. **Kabuğa istek:** telefonda bu gezinme yatay kayan tek satır olabilir.
- Plan sayfasında üst çubukta «Bugün» sekmesi seçili görünüyor (Plan'ın halkadaki yeri); kabuk.js'in işi, dokunmadım.
- Ayar gruplarına kart gölgesi eklemedim: satırlar ayrı öğe, gölge ayraçların üstüne taşar.
- `python kalite/olcum.py --denetle` koşmadım (açılış yükü başka ajanda).
