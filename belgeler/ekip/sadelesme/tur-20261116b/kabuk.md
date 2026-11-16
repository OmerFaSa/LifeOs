# Tur 2026-11-16b · Kabuk gezinme + öğrenme yapısı + estetik

Sahip: kabuk paketi (kabuk.js KAPAK hariç, kabuk.css, bilesen.css, bilesen.js, index.html,
kabuk.test.js, bilesen.test.js, tools/kabuk_gez.js, tools/kabuk_esit_gez.js). Commit/push yok.

## Devralındı (2026-11-16, ikinci ajan)
İlk ajan hesap sınırında kesildi (111 çağrı, rapor boş kaldı). `git diff` ile kabuk dosyalarındaki gerçek durum aşağıda.

## Durum
- [x] 1 Adlandırma: üst çubuk logosu «B · Başbuğ», `d.title = … · Başbuğ`, index.html `<title>`, yükleme etiketi,
      King/hata metinleri. İç kimlikler (lifeos.*, LIFEOS, data-*, yollar) aynı.
- [x] 2 Üst çubuk: sekmeler `H.halka()`dan (Sistem haritası hariç), yalnız simge + seçili sekmede ad; kaydırınca
      gizlenir (`:root.ust-gizli`), yukarı kaydırınca döner, sayfa başında (<64 px) hep görünür; klavye odağı varken
      görünür kalır; hareket azken `--orta` 0 olduğu için anında. Ay (ambiyans) düğmesi üst çubuktan kalktı (Ayarlar › Ses).
- [x] 3 Rıhtım ve boş yerde basılı tutma kalktı (kod + CSS). Telefonda (≤640 px) kalıcı alt çubuk (5 öğe, 56 px,
      güvenli alan, kaydırınca 44 px'e incelir, adlar gizlenir). Halka: sağ tık (dokunmatikte değil) + Ctrl . .
      «Her yere iki adımda» ipucu kalktı. Üç yüzey aynı `H.halka()` listesinden.
- [x] 4 Alan genel bakış (`sayfaAlan` + `siraKarti`): konum satırı, sıradaki ders, tek ince ilerleme çizgisi, tek ana
      düğme, «Biliyorsan: seviyemi bul» küçük ikincil bağlantı; aşama bölümü (hedef cümlesi + üniteler = ders adları,
      özetsiz); aşamalar listesi. Öğren sayfasında en üstte «kaldığın ders» kartı (hemen öğren). Ders: konum
      `Alan / Ünite / Ders n / N`, Oku→Alıştır→Bitir; boş alıştırmayla Bitir yumuşak onay (`bitirSor`); kapı/yerleştirme
      boş soruyla «Yine de gönder» (`bosSor`).
- [x] 5 Estetik: tek h1 ölçeği (selam `--yz-h1`), `.b-ayar + .b-ayar` yarım kenar gölgesi → tek ince ayraç, geçiş
      110+220 ms, odak halkası manzara üstünde açık renk + koyu hale, Plan etiketi için `kapakPay()` (ilk blok
      sahnenin altına itilir), açık temada giriş kutusu bir ton koyu dolgu, ünite satırları kart değil düz satır.
- [x] 6 Bilinmeyen adres → «Bu sayfa yok» + «Bugün'e dön» (`YOK_YER`); kilitli sayfalarda kırıntı «Kilitli ders/kapı/aşama».
- [x] İstemci hata ucu: kabuk.js `error` dinleyicisi → POST `/api/kabuk/hata` (`X-LifeOS: kabuk-hata`, gövde
      `{tur, ileti≤500, yigin≤1500, sayfa≤200}`, 4000 baytı geçerse yığın kısalır), yalnız 127.0.0.1/localhost, açılış başına
      en çok 5, `fetch(...).catch` ile sessiz. Gezide sınandı (günlüğe ileti, yığın, sayfa yazılıyor).
- [x] Kalite kapısı yeşil (aşağıda)
- [x] Görsel önce/sonra: `kabuk-gorsel/once-*` (ilk ajan) ve `sonra-*` (yeniden alındı, son hâl): Bugün, Öğren, Tarih,
      Akademik, ders, Notlar, Plan, Sağlık, Ayarlar, «Bu sayfa yok» × 1440/390 × açık/koyu.

## Değişen dosyalar
- `kabuk/kabuk.js` (KAPAK bloğuna dokunulmadı): üst çubuk/sekmeler, rıhtım ve basılı tut silindi, alt çubuk, kaydırınca
  gizlenme, alan genel bakışı (`sayfaAlan`, `siraKarti`, `dersKirinti`), `bitirSor`, `bosSor`, «Bu sayfa yok», `kapakPay`,
  hata ucu, ad «Başbuğ».
- `kabuk/kabuk.css`: tur 2026-11-16b bloğu (üst çubuk, alt çubuk, odak halkası, giriş kutusu, genel bakış, ders), rıhtım/
  yol-ozet/sira__not kuralları silindi, geçiş 110+220 ms.
- `kabuk/bilesen.css`: `.b-ayar + .b-ayar` yarım kenar → tek ince ayraç; selam tek h1 ölçeğinde; `.b-gezinme__oge[aria-current]`
  renkli sol şerit yerine ton + kalın yazı (Ayarlar yan menüsü).
- `kabuk/index.html`: `<title>Başbuğ</title>`, yükleme etiketi (saglik.js satırı içerik paketinin).
- `kabuk/harita.js`: yalnız ilk ajanın görmediği içerik paketi değişiklikleri; benim `halka:` değişikliğim yok.
- `kabuk/ayar.js` (tek ifade): Ambiyans açıklamasındaki «üst çubuktaki düğme de açıp kapatır» kalktı — düğmeyi ben
  kaldırdığım için yanlış kalmıştı.
- `tools/kabuk_gez.js`, `tools/kabuk_esit_gez.js`: sunucu `tools/gez_sunucu.js` ile boş portta (sabit 4397/4392 kalktı);
  yeni davranış denetimleri (ad, üst çubuk, kaydırma, alt çubuk, basılı tut yok, «Bu sayfa yok», genel bakış, Öğren'de
  kaldığın adım, ders konumu, Bitir onayı, kapı «Yine de gönder», hata ucu); içerik paketinin değişikliklerine göre
  güncellenenler aşağıda.

## Kararlar ve gerekçeler
- Sekmeler: «Yerler» menüsü yerine yalnız simge + seçili sekmede ad. Gerekçe: tek tıkla erişim kalır (menü bir adım
  ekler), çubuk görsel olarak küçülür; adlar ekran okuyucuda ve `title`'da. Sekmeler `H.halka()`dan gelir, böylece üst çubuk,
  alt çubuk, halka ve Ctrl K aynı yerleri aynı adla gösterir; Plan, Bugün sekmesinin parçası sayılır.
- Ay düğmesi kaldırıldı (ses simgesine çevirmek yerine): Ayarlar › Ses'te var, üst çubukta bir şey daha eksilir.
- Telefonda halka sağ tıkla açılmaz (`hover: none`): uzun basış tarayıcınındır, gezinme alt çubukta.
- Genel bakışta ders özetleri gizli (yalnız ders adları): «konu başlıklarını göreyim» isteği; özet dersin sayfasında.
- Gezi testleri, içerik paketinin bilinçli değişikliklerine göre güncellendi (zayıflatılmadı):
  - Hafta: bugünün sütunu artık Gün planının kendisi (araclar.js `bugunPlani`) → «Rapor» bugünde var, öbür günlerde yok;
    şablon (Okul/Uyku) bugünü değiştirmez, öbür altı günde denetlenir. Ayrıca eski regex'te «Cuma» «Cumartesi»yi de
    yakalıyordu (güne bağlı yanlış kırmızı); düzeltildi.
  - Soru: metin «havuzda N soru» → «karışık N soru».
  - Onay: «Onayları dosya olarak al» kapalı «Onayları sakla» bölümünde; test önce bölümü açar.

## Test çıktıları (son koşu)
- `node kabuk/kabuk.test.js` → 68 geçti, 0 kaldı; `node kabuk/bilesen.test.js` → 22 geçti, 0 kaldı
- Öbür `kabuk/*.test.js` (acilis, deneme, depo, etkilesim, gece, hesap*, king-sohbet, onay, saglik, ses, tanisma) → hepsi geçti
- `node tools/kabuk_gez.js` → 356 ✓, «hepsi geçti» (exit 0)
- `node tools/kabuk_esit_gez.js` → «hepsi geçti» (exit 0)
- `node tools/ortak_test.js` → «274 geçti, 0 kaldı, 23 eski modül vakası atlandı»
- `python kalite/olcum.py --denetle` → «Bütçe tamam: 28 bütçe, aşım yok.»

## Açık kalanlar
- Akademik genel bakışı telefonda uzun (30 ünite, kilitliler kapalı satır). İçerik büyüklüğünden; ünite gruplama (TYT/AYT)
  ayrı bir iş.
- Telefonda «basılı tut» tamamen yok; halka telefonda yalnız Ctrl . (klavye) ile. Alt çubuk yetiyor, sahip isterse geri gelir.
- Hata ucu yalnız yakalanmamış hataları gönderir (`unhandledrejection` yok); gerekirse eklenir.
- Gerçek uygulamada (4180, sahibin verisiyle) gezinilmedi; yalnız yalıtılmış sunucu. Commit yok.
