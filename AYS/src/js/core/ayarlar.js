/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ayarlar.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* AYARLAR — bölüm bölüm tek ayar paneli (kullanıcı, 2026-10-29).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ayarlar.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Biçimi
   `ayarlar.css`, testi `ayarlar.test.js`.
   ==================================================================

   Kullanıcı: «sisteme ayarlar kısmı getirmemiz gerekiyor; sol tarafa bir
   ayarlar yap, ses, animasyon, hesap ayarları gibi her şeyin bölüm bölüm
   bir arada olduğu yer» — «UI ve tasarımın karışık olmaması, sade ve
   minimalist olması çok değerli».

   Panel, kenardaki «Ayarlar» düğmesinin açtığı yan sayfadır: solda bölümler,
   sağda o bölümün satırları. Her modülün eski «Görünüm» paneli (open-appearance)
   bunu çizer; modüle özgü olan (tema seçicisi, profil, modülün kendi ayar
   ekranları) çağıran verir. Denetimlerin kendisi sahibinde kalır: animasyon,
   zemin, minik, King ve ses seçicileri kendi dosyalarının HTML'idir ve kendi
   olaylarını dinler; burası yalnız onları bölümlere dizer.

   YAZI TİPİ burada: «sistemin yazılarının fontunu değiştirebilelim». Yalnız
   pakette olan yazılar (fonts.css: Inter, Manrope, Newsreader) ve cihazın
   kendi yazısı — hiçbir şey indirilmez. Tercih `lifeos.yazi`, modül geçişinde
   taşınır (animasyon.js TASINAN); <head>'de okunur, ilk çizim doğru yazıyla. */
window.LIFEOS.PARCA.yazilar({
  'ortak.ayarlar.playfair-display':'Playfair Display',
  'ortak.ayarlar.aa':'Aa',
  'ortak.ayarlar.bu-modul':'Bu modül',
  'ortak.ayarlar.butun-sistemde-gecerli-ays-s':'Bütün sistemde geçerli: AYS, SPİ, ESP ve giriş sayfası',
  'ortak.ayarlar.yalniz':'Yalnız ',
  'ortak.ayarlar.hesabin-bu-bilgisayardaki-li':'Hesabın: bu bilgisayardaki LifeOS sunucusunda',
  'ortak.ayarlar.en-buyuk':'En büyük',
  'ortak.ayarlar.profile-bir-ad-ver':'Profile bir ad ver.',
  'ortak.ayarlar.en-cok':'En çok ',
  'ortak.ayarlar.su-an-bu-profil':'Şu an bu profil · ',
  'ortak.ayarlar.guncelle':'Güncelle',
  'ortak.ayarlar.gec':'Geç',
  'ortak.ayarlar.sil':'Sil',
  'ortak.ayarlar.ayar-profilleri':'Ayar profilleri',
  'ortak.ayarlar.gorunus-arka-plan-ses-animas':'Görünüş, arka plan, ses, animasyon, minikler, King ve tema birlikte saklanır; geçince hepsi o profile döner. Verin değişmez.',
  'ortak.ayarlar.henuz-profil-yok':'Henüz profil yok',
  'ortak.ayarlar.ayarlari-istedigin-gibi-yap':'Ayarları istediğin gibi yap, sonra buradan bir adla kaydet.',
  'ortak.ayarlar.su-anki-ayarlari-kaydet':'Şu anki ayarları kaydet',
  'ortak.ayarlar.arka-plan-dosyasi-profilde-s':'Arka plan dosyası profilde saklanmaz: profil «Kendi» seçimini tutar, o yuvadaki fotoğraf ya da video kullanılır.',
  'ortak.ayarlar.guvenlik-kontrolu':'Güvenlik kontrolü',
  'ortak.ayarlar.i-ki-adim-kurtarma-sorusu-ci':'İki adım, kurtarma sorusu, cihazlar ve yedek tek bakışta',
  'ortak.ayarlar.i-ki-adimli-dogrulama':'İki adımlı doğrulama',
  'ortak.ayarlar.giriste-telefondaki-kodu-da':'Girişte telefondaki kodu da sorar; yedek kodlar',
  'ortak.ayarlar.oturum-acik-cihazlar':'Oturum açık cihazlar',
  'ortak.ayarlar.hangi-cihazlar-bagli-birinde':'Hangi cihazlar bağlı; birinden ya da hepsinden çık',
  'ortak.ayarlar.son-etkinlik':'Son etkinlik',
  'ortak.ayarlar.girisler-ve-yanlis-denemeler':'Girişler ve yanlış denemeler',
  'ortak.ayarlar.hesap-deposunun-yedekleri-ge':'Hesap deposunun yedekleri; geri yükle, indir',
  'ortak.ayarlar.butun-verini-disa-aktar-ya':'Bütün verini dışa aktar ya da hesabı sil',
  'ortak.ayarlar.butun-baglantilar':'Bütün bağlantılar',
  'ortak.ayarlar.bu-hesaba-bagli-olan-her':'Bu hesaba bağlı olan her şey tek listede',
  'ortak.ayarlar.yeni-cihaz-bagla':'Yeni cihaz bağla',
  'ortak.ayarlar.telefonu-ya-da-tableti-kodla':'Telefonu ya da tableti kodla bağla',
  'ortak.ayarlar.kisayollar-ve-otomasyon':'Kısayollar ve otomasyon',
  'ortak.ayarlar.gelen-kutusu':'Gelen kutusu',
  'ortak.ayarlar.kisayollardan-gelen-satirlar':'Kısayollardan gelen satırlar; modül onaylamadan yazılmaz',
  'ortak.ayarlar.takvim-aboneligi':'Takvim aboneliği',
  'ortak.ayarlar.planini-telefonun-takvimine':'Planını telefonun takvimine abone et',
  'ortak.ayarlar.ac':'Aç',
  'ortak.ayarlar.hesap-ve-esitleme':'Hesap ve eşitleme',
  'ortak.ayarlar.lifeos-sunucusu-kapali-ya-da':'LifeOS sunucusu kapalı ya da giriş yapılmadı; kayıtlar bu cihazda',
  'ortak.ayarlar.m12-3v2m12-19v2m4-2-4-2l1-4':'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  'ortak.ayarlar.m5-19l10-5h1l5-14m7-14h7m17':'M5 19L10 5h1l5 14M7 14h7M17 19l2-6 2 6M17.6 17h2.8',
  'ortak.ayarlar.m12-3a9-9-0-1':'M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.2-1.7-.4-1 .3-2.3 1.5-2.3H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10zM7.5 11h.01M10 7.5h.01M14 7.5h.01',
  'ortak.ayarlar.m4-5h16v14h4zm4-15l4-5-4-5-4':'M4 5h16v14H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17',
  'ortak.ayarlar.m12-3c3-4-6-7-5':'M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z',
  'ortak.ayarlar.m6-16v11a6-6-0-0':'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  'ortak.ayarlar.m4-12h4l3-7-4-14-3-7h2':'M4 12h4l3-7 4 14 3-7h2',
  'ortak.ayarlar.m4-18h16m5-18l-1-10-5-4':'M4 18h16M5 18l-1-10 5 4 3-6 3 6 5-4-1 10',
  'ortak.ayarlar.m12-4a6-6-0-0':'M12 4a6 6 0 0 1 6 6v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6a6 6 0 0 1 6-6zM9.5 11h.01M14.5 11h.01',
  'ortak.ayarlar.m6-11h12v9h6zm8-5-11v8a3-5-3':'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  'ortak.ayarlar.m4-4h7v7h4zm13-4h7v7h-7zm4-1':'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  'ortak.ayarlar.m12-4v11m7-10l5-5-5-5m5':'M12 4v11M7 10l5 5 5-5M5 20h14',
  'ortak.ayarlar.m2-5-12s6-5-5-12-5-5':'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  'ortak.ayarlar.m3-6h18v12h3zm7-10h-01m11-10':'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  'ortak.ayarlar.m5-6h14m5-12h14m5-18h9m18-16':'M5 6h14M5 12h14M5 18h9M18 16.5l1.5 1.5 3-3',
  'ortak.ayarlar.m4-9v6h4l5-4v5l8-9h4zm16-5-8':'M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 0 1 0 7',
  'ortak.ayarlar.m4-6h16v14h4zm4-10h16m9-3v4m':'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  'ortak.ayarlar.m12-4-3-18-8-8-2v7-6l12-19-7':'M12 4.3 18.8 8.2v7.6L12 19.7 5.2 15.8V8.2zM12 9v6M9 12h6',
  'ortak.ayarlar.m10-14a4-4-0-0':'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  'ortak.ayarlar.m4-5h16v11h4zm9-20h6m12-16v4':'M4 5h16v11H4zM9 20h6M12 16v4',
  'ortak.ayarlar.m4-9v6h4l5-4v5l8-9h4zm16-5-8-2':'M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  'ortak.ayarlar.m4-6h12v12h4zm16-10l4-2-5v9l':'M4 6h12v12H4zM16 10l4-2.5v9L16 14',
  'ortak.ayarlar.butun-tercihlerin-tek-dosyad':'Bütün tercihlerin tek dosyada; başka bir bilgisayara ya da sonraya',
  'ortak.ayarlar.disa-aktar':'Dışa aktar',
  'ortak.ayarlar.gorunus-ses-king-profiller-v':'Görünüş, ses, King, profiller; verin girmez',
  'ortak.ayarlar.dosya-indir':'Dosya indir',
  'ortak.ayarlar.i-ce-aktar':'İçe aktar',
  'ortak.ayarlar.dosyadaki-tercihler-uygulani':'Dosyadaki tercihler uygulanır, sayfa yenilenir',
  'ortak.ayarlar.dosya-sec':'Dosya seç',
  'ortak.ayarlar.acik-koyu-ya-da-cihazinki':'Açık, koyu ya da cihazınki',
  'ortak.ayarlar.saate-gore':'Saate göre',
  'ortak.ayarlar.butun-modullerde-ayni':'Bütün modüllerde aynı',
  'ortak.ayarlar.yazi-tipi':'Yazı tipi',
  'ortak.ayarlar.i-cerik-birlikte-buyur-menu':'İçerik birlikte büyür; menü yerinde kalır',
  'ortak.ayarlar.yazi-boyutu':'Yazı boyutu',
  'ortak.ayarlar.renk-ve-cam':'Renk ve cam',
  'ortak.ayarlar.vurgu-rengi':'Vurgu rengi',
  'ortak.ayarlar.secili-dugme-ve-sekmeler':'Seçili düğme ve sekmeler',
  'ortak.ayarlar.cam-yogunlugu':'Cam yoğunluğu',
  'ortak.ayarlar.kartlarin-ne-kadar-saydam-ol':'Kartların ne kadar saydam olduğu',
  'ortak.ayarlar.sol-menu':'Sol menü',
  'ortak.ayarlar.cam-arkadaki-fotograf-gorunu':'Cam: arkadaki fotoğraf görünür',
  'ortak.ayarlar.ortam-isigi':'Ortam ışığı',
  'ortak.ayarlar.i-mlecin-pesindeki-hafif-isi':'İmlecin peşindeki hafif ışık',
  'ortak.ayarlar.gorunumu-sifirla':'Görünümü sıfırla',
  'ortak.ayarlar.verin-degismez':'Verin değişmez',
  'ortak.ayarlar.duvar-kagidi':'Duvar kâğıdı',
  'ortak.ayarlar.gunduz-acik-temada-gece-koyu':'Gündüz açık temada, gece koyu temada',
  'ortak.ayarlar.sade-fotograf-ve-cam-yok':'Sade: fotoğraf ve cam yok',
  'ortak.ayarlar.gunduz':'Gündüz',
  'ortak.ayarlar.acik-tema':'Açık tema',
  'ortak.ayarlar.gece':'Gece',
  'ortak.ayarlar.koyu-tema':'Koyu tema',
  'ortak.ayarlar.bulaniklik-ve-okunaklik':'Bulanıklık ve okunaklık',
  'ortak.ayarlar.her-katman-ayri-kapali-katma':'Her katman ayrı; kapalı katman dolu ve okunur',
  'ortak.ayarlar.fotografin-kendisi':'Fotoğrafın kendisi',
  'ortak.ayarlar.duvar-kagidinin-bulanikligi':'Duvar kâğıdının bulanıklığı',
  'ortak.ayarlar.fotografin-ustundeki-ortu':'Fotoğrafın üstündeki örtü',
  'ortak.ayarlar.okunaklik-perdesi':'Okunaklık perdesi',
  'ortak.ayarlar.sayfadaki-kartlar-buzlu-cam':'Sayfadaki kartlar buzlu cam',
  'ortak.ayarlar.kartlar-buzlu':'Kartlar buzlu',
  'ortak.ayarlar.menu-buzlu-cam':'Menü buzlu cam',
  'ortak.ayarlar.sol-menu-buzlu':'Sol menü buzlu',
  'ortak.ayarlar.ayarlar-bildirimler-cekmecel':'Ayarlar, bildirimler, çekmeceler',
  'ortak.ayarlar.pencereler-buzlu':'Pencereler buzlu',
  'ortak.ayarlar.arka-plan-videosu':'Arka plan videosu',
  'ortak.ayarlar.yalniz-video-seciliyken':'Yalnız video seçiliyken',
  'ortak.ayarlar.simdi-sustur':'Şimdi sustur',
  'ortak.ayarlar.sesler-ve-king-in-sesli-okum':'Sesler ve King’in sesli okuması bir süre susar',
  'ortak.ayarlar.sabaha-kadar':'Sabaha kadar',
  'ortak.ayarlar.sessiz-saatler':'Sessiz saatler',
  'ortak.ayarlar.sesler-ve-king-in-sesli-okum-2':'Sesler ve King’in sesli okuması susar; radyo susmaz',
  'ortak.ayarlar.sayaclar-ve-noktalar':'Sayaçlar ve noktalar',
  'ortak.ayarlar.kenardaki-bildirim-sayisi-ve':'Kenardaki bildirim sayısı ve kırmızı nokta',
  'ortak.ayarlar.az-yalniz-gerekli-gecisler':'Az: yalnız gerekli geçişler',
  'ortak.ayarlar.arayuz-ve-ajanlar-ayri-ayrin':'Arayüz ve ajanlar ayrı; Ayrıntı içindekileri tek tek',
  'ortak.ayarlar.yazi-ve-renk':'Yazı ve renk',
  'ortak.ayarlar.i-cerik-birlikte-buyur':'İçerik birlikte büyür',
  'ortak.ayarlar.satir-araligi':'Satır aralığı',
  'ortak.ayarlar.genis-paragraflar-daha-rahat':'Geniş: paragraflar daha rahat okunur',
  'ortak.ayarlar.yuksek-soluk-yazilar-koyulas':'Yüksek: soluk yazılar koyulaşır, kartlar dolar',
  'ortak.ayarlar.klavye-ve-baglantilar':'Klavye ve bağlantılar',
  'ortak.ayarlar.odak-cercevesi':'Odak çerçevesi',
  'ortak.ayarlar.klavyeyle-gezerken-secili-og':'Klavyeyle gezerken seçili öğe kalın çerçeveyle',
  'ortak.ayarlar.baglantilarin-alti-cizili':'Bağlantıların altı çizili',
  'ortak.ayarlar.baglantilar-renk-disinda-da':'Bağlantılar renk dışında da ayırt edilir',
  'ortak.ayarlar.az-kayma-yok-yalniz-solma':'Az: kayma yok, yalnız solma',
  'ortak.ayarlar.ses-duzeyleri':'Ses düzeyleri',
  'ortak.ayarlar.genel-hepsini-birlikte-kisar':'Genel hepsini birlikte kısar; Ayrıntı grubun içindekileri tek tek',
  'ortak.ayarlar.arka-plan-videosunun-sesi':'Arka plan videosunun sesi',
  'ortak.ayarlar.arka-plan-bolumunde-ses-kesi':'Arka plan bölümünde: ses, kesit ve hız',
  'ortak.ayarlar.adi-konusmasi-ve-sesi':'Adı, konuşması ve sesi',
  'ortak.ayarlar.bos-birakirsan-king':'Boş bırakırsan King',
  'ortak.ayarlar.merkez-uzerinden-model-aylik':'Merkez üzerinden: model, aylık tavan, kanallar ve hatırlatma eşikleri',
  'ortak.ayarlar.yukleniyor':'Yükleniyor…',
  'ortak.ayarlar.sayfada-gezen-kucuk-yardimci':'Sayfada gezen küçük yardımcılar',
  'ortak.ayarlar.kac-minik':'Kaç minik',
  'ortak.ayarlar.sayfada-en-cok':'Sayfada en çok',
  'ortak.ayarlar.kimler-gezsin':'Kimler gezsin',
  'ortak.ayarlar.basinca-sayfadan-cikar-ya-da':'Basınca sayfadan çıkar ya da gelir',
  'ortak.ayarlar.profili-ac':'Profili aç',
  'ortak.ayarlar.satin-alma-ve-kart-islemleri':'Satın alma ve kart işlemleri',
  'ortak.ayarlar.acik-yine-de-lifeos-ta-odeme':'Açık; yine de LifeOS’ta ödeme yapan bir araç yok',
  'ortak.ayarlar.kapali-king-ve-ajanlar-odeme':'Kapalı: King ve ajanlar ödeme, sipariş ya da kart işine girmez',
  'ortak.ayarlar.google-dan-veri':'Google’dan veri',
  'ortak.ayarlar.hesap-baglanmaz-veri-bu-bilg':'Hesap bağlanmaz; veri bu bilgisayarda kalır, ölçüm kendiliğinden kayda yazılmaz',
  'ortak.ayarlar.google-ve-youtube':'Google ve YouTube',
  'ortak.ayarlar.hesap-baglanmaz-king-in-buld':'Hesap bağlanmaz: King’in bulduğu bağlantılar senin tarayıcında, kendi oturumunla açılır; LifeOS Google’a veri göndermez',
  'ortak.ayarlar.sistem-planlamasi':'Sistem planlaması',
  'ortak.ayarlar.kartlarin-bu-moduldeki-duzen':'Kartların bu modüldeki düzeni',
  'ortak.ayarlar.gizlilik-kilidi':'Gizlilik kilidi',
  'ortak.ayarlar.bu-modul-acilirken-dort-hane':'Bu modül açılırken dört haneli kod sorar',
  'ortak.ayarlar.modulun-kendi-ayar-sayfalari':'Modülün kendi ayar sayfaları',
  'ortak.ayarlar.ayarlar':'Ayarlar',
  'ortak.ayarlar.i-ndirildi':'İndirildi: ',
  'ortak.ayarlar.bu-dosya-bir-lifeos-ayar':'Bu dosya bir LifeOS ayar yedeği değil.',
  'ortak.ayarlar.dosya-okunamadi':'Dosya okunamadı.',
  'ortak.ayarlar.merkez-bu-profilde-bagli-deg':'Merkez bu profilde bağlı değil. King yine çalışır; model, bütçe ve kanallar Merkez bağlanınca burada görünür.',
  'ortak.ayarlar.merkez-su-an-yanit-vermiyor':'Merkez şu an yanıt vermiyor; ayarların yerinde.',
  'ortak.ayarlar.merkez-i-baslat-ve-bagla':'Merkez’i başlat ve bağla',
  'ortak.ayarlar.acik-king-buradan-yazabilir':'Açık: King buradan yazabilir',
  'ortak.ayarlar.kurulu-degil-jetonu-ayarlar':'Kurulu değil; jetonu Ayarlar › Merkez › Kanallar’da',
  'ortak.ayarlar.model-paketi':'Model paketi',
  'ortak.ayarlar.aylik-tutar-son-30-gunun':'Aylık tutar son 30 günün ölçülen kullanımından tahmindir',
  'ortak.ayarlar.aylik-tavan':'Aylık tavan',
  'ortak.ayarlar.tavana-varinca-ucretli-model':'Tavana varınca ücretli model çağrısı durur',
  'ortak.ayarlar.butun-merkez-ayarlari':'Bütün Merkez ayarları',
  'ortak.ayarlar.anahtarlar-kanallar-zamanlam':'Anahtarlar, kanallar, zamanlama, bildirim, bütün eşikler',
  'ortak.ayarlar.merkez-i-ac':'Merkez’i aç ›',
  'ortak.ayarlar.merkez-calisiyor-ve-bagli':'Merkez çalışıyor ve bağlı',
  'ortak.ayarlar.merkez-bu-profilde-bagli-deg-2':'Merkez bu profilde bağlı değil',
  'ortak.ayarlar.merkez-yanit-vermiyor':'Merkez yanıt vermiyor',
  'ortak.ayarlar.king-in-hafizasi-modelleri-v':'King’in hafızası, modelleri ve kuralları. Arayüzü yok; ayarları burada.',
  'ortak.ayarlar.king-yine-calisir-merkez-aci':'King yine çalışır. Merkez açılınca model, bütçe, kanallar ve zamanlama burada ayarlanır.',
  'ortak.ayarlar.baslat-ve-bagla':'Başlat ve bağla',
  'ortak.ayarlar.kurulu':'Kurulu ••',
  'ortak.ayarlar.kurulu-degil':'Kurulu değil',
  'ortak.ayarlar.yenisiyle-degistir':'Yenisiyle değiştir',
  'ortak.ayarlar.kaydet':'Kaydet',
  'ortak.ayarlar.eski-merkez-ekranlari-motto':'Eski Merkez ekranları (Motto, Para, Ofis) taşınana dek arşivde:',
  'ortak.ayarlar.ac-2':'aç',
  'ortak.ayarlar.verileri-yerinde':'. Verileri yerinde.',
  'ortak.ayarlar.merkez-acilamadi':'Merkez açılamadı.',
  'ortak.ayarlar.merkez-acildi-ve-bu-modul':'Merkez açıldı ve bu modül bağlandı.',
  'ortak.ayarlar.merkez-acildi-baglanamadi':'Merkez açıldı; bağlanamadı: ',
  'ortak.ayarlar.merkez-yalniz-lifeos-sunucus':'Merkez yalnız LifeOS sunucusu bu bilgisayarda açıkken başlatılabilir.',
  'ortak.ayarlar.merkez-bagli-degil':'Merkez bağlı değil.',
  'ortak.ayarlar.kaydedilemedi-merkez-yanit-v':'Kaydedilemedi; Merkez yanıt vermedi.',
  'ortak.ayarlar.plan-okundu-ama-cizilemedi-s':'Plan okundu ama çizilemedi; sayfayı yenile.',
  'ortak.ayarlar.sistem-planlamasi-lifeos-sun':'Sistem planlaması LifeOS sunucusunun bu bilgisayarda açık olmasını ister; telefonda ve tek dosya sürümünde yoktur.',
  'ortak.ayarlar.her-gun':'Her gün',
  'ortak.ayarlar.hafta-ici':'Hafta içi',
  'ortak.ayarlar.hafta-sonu':'Hafta sonu',
  'ortak.ayarlar.her-gune':'Her güne',
  'ortak.ayarlar.saatinde-yapilamadi':'Saatinde yapılamadı',
  'ortak.ayarlar.yap':'Yap',
  'ortak.ayarlar.atla':'Atla',
  'ortak.ayarlar.kacarsa-ilk-musait-an':'Kaçarsa ilk müsait an',
  'ortak.ayarlar.kacarsa-sor':'Kaçarsa sor',
  'ortak.ayarlar.yenilik-varsa-kur':'Yenilik varsa kur',
  'ortak.ayarlar.henuz-yapilmadi':'Henüz yapılmadı',
  'ortak.ayarlar.calisiyor':'Çalışıyor…',
  'ortak.ayarlar.simdi-yap':'Şimdi yap',
  'ortak.ayarlar.lifeos-sunucusu-eski-surumle':'LifeOS sunucusu eski sürümle çalışıyor',
  'ortak.ayarlar.guncelleme-sunucu-dosyalarin':'Güncelleme sunucu dosyalarını da değiştirdi; LifeOS’u kapatıp yeniden açınca plan kaydedilebilir.',
  'ortak.ayarlar.acilis-ve-kapanis':'Açılış ve kapanış',
  'ortak.ayarlar.acilisi-windows-yapar-bilgis':'Açılışı Windows yapar (bilgisayar açık olmalı); kapanışı LifeOS kendisi. Boş gün: o gün yok.',
  'ortak.ayarlar.kendiliginden-acilis-yalniz':'Kendiliğinden açılış yalnız Windows’ta.',
  'ortak.ayarlar.periyodik-isler':'Periyodik işler',
  'ortak.ayarlar.kaydedilmedi-lifeos-sunucusu':'Kaydedilmedi: LifeOS sunucusu eski sürümle çalışıyor. LifeOS’u kapatıp yeniden aç.',
  'ortak.ayarlar.kaydedilemedi-lifeos-sunucus':'Kaydedilemedi: LifeOS sunucusu yanıt vermedi.',
  'ortak.ayarlar.emin-misin-sifirla':'Emin misin? Sıfırla',
  'ortak.ayarlar.silinsin-mi':'Silinsin mi?',
});

window.LIFEOS.PARCA.yazilar({
  'ortak.ayarlar.inter':'Inter',
  'ortak.ayarlar.manrope':'Manrope',
  'ortak.ayarlar.cihazin':'Cihazın',
  'ortak.ayarlar.newsreader':'Newsreader',
  'ortak.ayarlar.fraunces':'Fraunces',
  'ortak.ayarlar.nunito':'Nunito',
  'ortak.ayarlar.space-grotesk':'Space Grotesk',
  'ortak.ayarlar.dm-sans':'DM Sans',
  'ortak.ayarlar.playfair':'Playfair',
  'ortak.ayarlar.lora':'Lora',
  'ortak.ayarlar.quicksand':'Quicksand',
  'ortak.ayarlar.comfortaa':'Comfortaa',
  'ortak.ayarlar.profiller':'Profiller',
  'ortak.ayarlar.gorunum':'Görünüm',
  'ortak.ayarlar.arka-plan':'Arka plan',
  'ortak.ayarlar.ses-ve-muzik':'Ses ve müzik',
  'ortak.ayarlar.animasyon':'Animasyon',
  'ortak.ayarlar.erisilebilirlik':'Erişilebilirlik',
  'ortak.ayarlar.king-ve-baglantilar':'King ve bağlantılar',
  'ortak.ayarlar.merkez':'Merkez',
  'ortak.ayarlar.minikler':'Minikler',
  'ortak.ayarlar.bildirimler':'Bildirimler',
  'ortak.ayarlar.planlama':'Planlama',
  'ortak.ayarlar.modul-ayarlari':'Modül ayarları',
  'ortak.ayarlar.guvenlik':'Güvenlik',
  'ortak.ayarlar.baglantilar':'Bağlantılar',
});


window.LIFEOS = window.LIFEOS || {};

(function(){
  'use strict';

  const L = window.LIFEOS;

  /* ------------------------------------------------------------ yazı */
  const YAZI_ANAHTAR = 'lifeos.yazi';
  const YAZILAR = Object.freeze([
    { id:'inter',   ad:yz('ortak.ayarlar.inter'),     not:'varsayılan, sade' },
    { id:'manrope', ad:yz('ortak.ayarlar.manrope'),   not:'yuvarlak, yumuşak' },
    { id:'sistem',  ad:yz('ortak.ayarlar.cihazin'),   not:'işletim sisteminin yazısı' },
    { id:'kitap',   ad:yz('ortak.ayarlar.newsreader'), not:'kitap gibi, serif' },
    /* Ek aileler (kullanıcı, 2026-10-30: «çok daha güzel fontlar; kullanıcının
       gözüne birçok şey hitap edebilir»; OFL, src/fonts/ek/KUNYE.md). Gömülmez:
       yalnız seçilince ya da seçici açılınca yüklenir (yaziYukle). */
    { id:'fraunces',  ad:yz('ortak.ayarlar.fraunces'),   not:'sıcak serif, şık başlık', aile:'Fraunces',         dosya:'fraunces',         agirlik:'300 700' },
    { id:'nunito',    ad:yz('ortak.ayarlar.nunito'),     not:'yuvarlak, dost canlısı',  aile:'Nunito',           dosya:'nunito',           agirlik:'400 800' },
    { id:'grotesk',   ad:yz('ortak.ayarlar.space-grotesk'), not:'modern, teknik',       aile:yz('ortak.ayarlar.space-grotesk'),    dosya:'space-grotesk',    agirlik:'400 700' },
    { id:'dmsans',    ad:yz('ortak.ayarlar.dm-sans'),    not:'temiz, geometrik',        aile:yz('ortak.ayarlar.dm-sans'),          dosya:'dm-sans',          agirlik:'400 700' },
    { id:'playfair',  ad:yz('ortak.ayarlar.playfair'),   not:'zarif, dergi gibi',       aile:yz('ortak.ayarlar.playfair-display'), dosya:'playfair-display', agirlik:'400 800' },
    { id:'lora',      ad:yz('ortak.ayarlar.lora'),       not:'okunaklı kitap serifi',   aile:'Lora',             dosya:'lora',             agirlik:'400 700' },
    { id:'quicksand', ad:yz('ortak.ayarlar.quicksand'),  not:'yuvarlak, oyunsu',        aile:'Quicksand',        dosya:'quicksand',        agirlik:'400 700' },
    { id:'comfortaa', ad:yz('ortak.ayarlar.comfortaa'),  not:'yumuşak, tatlı',          aile:'Comfortaa',        dosya:'comfortaa',        agirlik:'400 700' },
  ]);
  const ARALIK = { latin:'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    'latin-ext':'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF' };
  const yuklenen = {};
  /* Dosya adresi ayarlar.js'in yerine göre (kaynak ve test sayfası); tek dosyada belgenin yanı (dist/fonts/ek). */
  function ekYol(dosya){
    const b = typeof document !== 'undefined' ? document.querySelector('script[src*="core/ayarlar.js"]') : null;
    return new URL(b ? '../../fonts/ek/' + dosya : 'fonts/ek/' + dosya, b ? b.src : document.baseURI).href;
  }
  function yaziYukle(id){
    const y = YAZILAR.find(x => x.id === id);
    if(!y || !y.dosya || yuklenen[id] || typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) return false;
    yuklenen[id] = true;
    Object.keys(ARALIK).forEach(alt => {
      try{
        const f = new FontFace(y.aile, 'url("' + ekYol(y.dosya + '-' + alt + '.woff2') + '") format("woff2")', { weight:y.agirlik, display:'swap', unicodeRange:ARALIK[alt] });
        f.load().then(ff => document.fonts.add(ff)).catch(() => { /* dosya yok: sistem yazısına düşer */ });
      }catch(e){ /* eski tarayıcı */ }
    });
    return true;
  }
  function yazi(){
    let v = null;
    try{ v = localStorage.getItem(YAZI_ANAHTAR); }catch(e){}
    return YAZILAR.some(y => y.id === v) ? v : 'inter';
  }
  function yaziUygula(k){
    if(typeof document === 'undefined') return;
    const kok = document.documentElement;
    if(k === 'inter') kok.removeAttribute('data-yazi'); else kok.setAttribute('data-yazi', k);
    yaziYukle(k);
  }
  function yaziAyarla(k){
    if(!YAZILAR.some(y => y.id === k)) return false;
    try{ if(k === 'inter') localStorage.removeItem(YAZI_ANAHTAR); else localStorage.setItem(YAZI_ANAHTAR, k); }catch(e){ /* depo kapalı: bu sayfada geçerli */ }
    yaziUygula(k);
    return true;
  }
  yaziUygula(yazi());

  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  function yaziSeciciHtml(){
    const s = yazi();
    YAZILAR.forEach(y => yaziYukle(y.id));   // örnek «Aa»lar kendi yazısıyla görünsün
    return '<div class="ayarlar__yazilar" role="radiogroup" aria-label="Yazı tipi">' + YAZILAR.map(y =>
      '<button type="button" class="ayarlar__yazi' + (y.id === s ? ' is-on' : '') + '" role="radio" aria-checked="' + (y.id === s) + '"'
      + ' data-yazi-sec="' + y.id + '" data-yazi-ornek="' + y.id + '">'
      + ('<b>' + yz('ortak.ayarlar.aa') + '</b><span>') + kac(y.ad) + '</span><small>' + kac(y.not) + '</small></button>').join('') + '</div>';
  }

  /* ---------------------------------------------------------- bölümler */
  /* GRUPLAR (kullanıcı, 2026-10-29: «sistem direkt olmayacak; Sistem altında ses,
     animasyon, plan; sonra Hesap: güvenlik, bağlantılar, Google»; «görünüm ve
     minik ve King'i de Sistem'in içine koy; seçenekleri arttır; arka plan
     fotoğrafını değiştirebilmeyi göremedim»). Grup adı başlıktır, sekme değil. */
  /* KAPSAM (kullanıcı, 2026-10-30: «hangi ayar sadece AYS'de, hangisi bütün
     sistemde belli değil; sol tarafa sistem ayarları ve modül ayarları diye
     ayırın; karmaşık yapma, sadeleştir»). Sistem ayarları PC'de tek kopya
     (sistem/ayar.py) ve her modülde, giriş sayfasında aynıdır; «Bu modül»
     yalnız açık modülü değiştirir. Her bölümün başında kapsamı tek satır. */
  const BOLUMLER = Object.freeze([
    { id:'profil',   ad:yz('ortak.ayarlar.profiller'),        grup:'Sistem' },
    { id:'gorunum',  ad:yz('ortak.ayarlar.gorunum'),          grup:'Sistem' },
    { id:'zemin',    ad:yz('ortak.ayarlar.arka-plan'),        grup:'Sistem' },
    { id:'ses',      ad:yz('ortak.ayarlar.ses-ve-muzik'),     grup:'Sistem' },
    { id:'hareket',  ad:yz('ortak.ayarlar.animasyon'),        grup:'Sistem' },
    { id:'erisim',   ad:yz('ortak.ayarlar.erisilebilirlik'),  grup:'Sistem' },
    { id:'king',     ad:yz('ortak.ayarlar.king-ve-baglantilar'), grup:'Sistem' },
    { id:'merkez',   ad:yz('ortak.ayarlar.merkez'),           grup:'Sistem' },
    { id:'ekip',     ad:yz('ortak.ayarlar.minikler'),         grup:'Sistem' },
    { id:'bildirim', ad:yz('ortak.ayarlar.bildirimler'),      grup:'Sistem' },
    { id:'sistem',   ad:yz('ortak.ayarlar.planlama'),         grup:'Sistem' },
    { id:'modul',    ad:yz('ortak.ayarlar.modul-ayarlari'),   grup:yz('ortak.ayarlar.bu-modul') },
    { id:'hesap',    ad:yz('ortak.ayarlar.guvenlik'),         grup:'Hesap' },
    { id:'baglanti', ad:yz('ortak.ayarlar.baglantilar'),      grup:'Hesap' },
  ]);
  const MODUL_AD = Object.freeze({ ays:'AYS', spi:'SPİ', esp:'ESP' });
  /* ALANLAR (kullanıcı, 2026-10-30: «sistem ile yalnız o modül arasındaki ayrımı
     daha güzel yap; ayarları daha minimalist, anlaşılır yap»). Üstte üç alan;
     solda yalnız seçili alanın bölümleri. Modül alanı modülün renginde. */
  const ALANLAR = Object.freeze(['Sistem', yz('ortak.ayarlar.bu-modul'), 'Hesap']);
  const alanOf = id => (BOLUMLER.find(b => b.id === id) || {}).grup || 'Sistem';
  function alanlarHtml(){
    const m = MODUL_AD[modulAdi()] || yz('ortak.ayarlar.bu-modul'), simdi = alanOf(secili);
    const bilgi = { 'Sistem':['Sistem', 'her yerde'], 'Bu modül':[m, 'yalnız burada'], 'Hesap':['Hesap', 'hesabın'] };
    return '<div class="ayarlar__alanlar" role="group" aria-label="Ayar alanı">' + ALANLAR.map(a => '<button type="button" class="ayarlar__alan ayarlar__alan--'
      + (a === yz('ortak.ayarlar.bu-modul') ? 'modul' : a === 'Hesap' ? 'hesap' : 'sistem') + (a === simdi ? ' is-on' : '') + '" aria-pressed="' + (a === simdi) + '" data-ayar-alan="' + kac(a) + '">'
      + SIMGE_KAPSAM[a === yz('ortak.ayarlar.bu-modul') ? 'modul' : a === 'Hesap' ? 'hesap' : 'sistem'] + '<b>' + kac(bilgi[a][0]) + '</b><small>' + bilgi[a][1] + '</small></button>').join('') + '</div>';
  }
  const SIMGE_KAPSAM = {
    sistem:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    modul:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 9h16"/></svg>',
    hesap:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
  };
  /* Bölümün başı (2026-10-31: «daha kaliteli»): büyük başlık ve altında kapsam rozeti. */
  function kapsamHtml(grup, ad){
    const m = MODUL_AD[modulAdi()] || yz('ortak.ayarlar.bu-modul');
    const [tur, yazi] = grup === 'Sistem' ? ['sistem', yz('ortak.ayarlar.butun-sistemde-gecerli-ays-s')]
      : grup === yz('ortak.ayarlar.bu-modul') ? ['modul', yz('ortak.ayarlar.yalniz') + m + '’de geçerli; öbür modüller değişmez']
      : ['hesap', yz('ortak.ayarlar.hesabin-bu-bilgisayardaki-li')];
    return '<header class="ayarlar__bolum-bas">' + (ad ? '<h3>' + kac(ad) + '</h3>' : '')
      + '<p class="ayarlar__kapsam ayarlar__kapsam--' + tur + '">' + SIMGE_KAPSAM[tur] + '<span>' + yazi + '</span></p></header>';
  }

  /* SEÇİMLER: tek anahtarlı, kökte niteliği olan tercihler (biçimi cam.css §45).
     Nitelik hep yazılır (varsayılan da): CSS özgüllüğü buna dayanır. */
  const SECIMLER = Object.freeze({
    cam:     { anahtar:'lifeos.cam',           kok:'data-cam',      vars:'orta',  sira:['az', 'orta', 'cok'],  ad:{ az:'Dolu', orta:'Orta', cok:'Saydam' } },
    kontrast:{ anahtar:'lifeos.kontrast',      kok:'data-kontrast', vars:'normal', sira:['normal', 'yuksek'], ad:{ normal:'Normal', yuksek:'Yüksek' } },
    perde:   { anahtar:'lifeos.perde',         kok:'data-perde',    vars:'orta',  sira:['yok', 'az', 'orta', 'cok'],  ad:{ yok:'Yok', az:'Az', orta:'Orta', cok:'Çok' } },
    /* «Hiç» (kullanıcı, 2026-10-30: «az var ama hiç seçeneği yok; arka planda öyle bir şey olmasın»):
       fotoğraf da kartların arkası da bulanmaz (cam.css §51). «Net» yalnız fotoğrafı bulandırmaz. */
    bulanik: { anahtar:'lifeos.zemin.bulanik', kok:'data-bulanik',  vars:'yok',   sira:['yok', 'hafif', 'cok'], ad:{ yok:'Yok', hafif:'Hafif', cok:'Yumuşak' } },
    /* KATMAN KATMAN BULANIKLIK (kullanıcı, 2026-10-30: «bulanıklık ayrı ayrı olsun:
       ayarların, sistem kartlarının, duvar kâğıdının, menünün bulanıklığını aç ya
       da kapat»). Kapalı katman buzlu cam yerine dolu ve okunur (cam.css §51). */
    buzluKart:{ anahtar:'lifeos.buzlu.kart',   kok:'data-buzlu-kart',    vars:'acik', sira:['acik', 'kapali'], ad:{ acik:'Buzlu', kapali:'Dolu' } },
    buzluMenu:{ anahtar:'lifeos.buzlu.menu',   kok:'data-buzlu-menu',    vars:'acik', sira:['acik', 'kapali'], ad:{ acik:'Buzlu', kapali:'Dolu' } },
    buzluPencere:{ anahtar:'lifeos.buzlu.pencere', kok:'data-buzlu-pencere', vars:'acik', sira:['acik', 'kapali'], ad:{ acik:'Buzlu', kapali:'Dolu' } },
    /* Vurgu rengi (2026-10-30, yeni): seçili düğme, sekme ve anahtarın rengi; ölçü renkleri değişmez (§1.10). */
    vurgu:   { anahtar:'lifeos.vurgu',         kok:'data-vurgu',    vars:'modul', sira:['modul', 'mavi', 'yesil', 'mor', 'turuncu', 'pembe', 'grafit'],
      ad:{ modul:'Modülün', mavi:'Mavi', yesil:'Yeşil', mor:'Mor', turuncu:'Turuncu', pembe:'Pembe', grafit:'Grafit' } },
    /* Yazı boyutu (2026-10-30, yeni): bütün arayüz birlikte büyür ya da küçülür (ayarlar.css «boyut»). */
    boyut:   { anahtar:'lifeos.boyut',         kok:'data-boyut',    vars:'normal', sira:['kucuk', 'normal', 'buyuk', 'enbuyuk'], ad:{ kucuk:'Küçük', normal:'Normal', buyuk:'Büyük', enbuyuk:yz('ortak.ayarlar.en-buyuk') } },
    rozet:   { anahtar:'lifeos.rozet',         kok:'data-rozet',    vars:'acik',  sira:['acik', 'kapali'],     ad:{ acik:'Göster', kapali:'Gizle' } },
    /* ERİŞİLEBİLİRLİK ve ORTAM (2026-10-31, kullanıcı: «ayarların özelliklerini çok arttır»). */
    odak:    { anahtar:'lifeos.odak',          kok:'data-odak',     vars:'normal', sira:['normal', 'belirgin'], ad:{ normal:'Normal', belirgin:'Belirgin' } },
    altcizgi:{ anahtar:'lifeos.altcizgi',      kok:'data-altcizgi', vars:'hayir', sira:['hayir', 'evet'],      ad:{ hayir:'Hayır', evet:'Evet' } },
    satir:   { anahtar:'lifeos.satir',         kok:'data-satir',    vars:'normal', sira:['normal', 'genis'],   ad:{ normal:'Normal', genis:'Geniş' } },
    isik:    { anahtar:'lifeos.isik',          kok:'data-isik',     vars:'acik',  sira:['acik', 'kapali'],     ad:{ acik:'Açık', kapali:'Kapalı' } },
    /* 2026-10-30 (kullanıcı: «sol taraftaki menüyü de camsı yapabilelim ayarlarda»). */
    kenar:   { anahtar:'lifeos.kenar.yuzey',   kok:'data-kenar',    vars:'buzlu', sira:['buzlu', 'cam'],       ad:{ buzlu:'Buzlu', cam:'Cam' } },
  });
  function secim(k){
    const x = SECIMLER[k];
    let v = null;
    try{ v = localStorage.getItem(x.anahtar); }catch(e){}
    return x.sira.indexOf(v) >= 0 ? v : x.vars;
  }
  function secimUygula(k){ if(typeof document !== 'undefined') document.documentElement.setAttribute(SECIMLER[k].kok, secim(k)); }
  function secimAyarla(k, v){
    const x = SECIMLER[k];
    if(!x || x.sira.indexOf(v) < 0) return false;
    try{ if(v === x.vars) localStorage.removeItem(x.anahtar); else localStorage.setItem(x.anahtar, v); }catch(e){ /* depo kapalı: bu sayfada geçerli */ }
    secimUygula(k);
    if(typeof document !== 'undefined') document.querySelectorAll('[data-secim^="' + k + ':"]').forEach(b => {
      const on = b.getAttribute('data-secim') === k + ':' + v;
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    return true;
  }
  const secimHtml = (k, ad) => '<div class="seg seg--block" role="group" aria-label="' + kac(ad) + '">' + SECIMLER[k].sira.map(v => {
    const on = v === secim(k);
    return '<button type="button" class="' + (on ? 'is-on' : '') + '" data-secim="' + k + ':' + v + '" aria-pressed="' + on + '">' + SECIMLER[k].ad[v] + '</button>';
  }).join('') + '</div>';
  const VURGU_RENK = Object.freeze({ modul:'var(--mod, var(--primary))', mavi:'#2f6bff', yesil:'#1f9d6b', mor:'#7a5af5', turuncu:'#e2761f', pembe:'#e2558f', grafit:'#4a4f5a' });
  const vurguHtml = () => '<div class="vurgu" role="group" aria-label="Vurgu rengi">' + SECIMLER.vurgu.sira.map(v => {
    const on = v === secim('vurgu');
    return '<button type="button" class="vurgu__renk' + (on ? ' is-on' : '') + '" data-secim="vurgu:' + v + '" aria-pressed="' + on + '" title="' + SECIMLER.vurgu.ad[v] + '"'
      + ' aria-label="' + SECIMLER.vurgu.ad[v] + '" style="--v:' + VURGU_RENK[v] + '"></button>'; }).join('') + '</div>';
  /* Göç (bir kez): eski «Hiç» bulanıklık = hiçbir katman bulanmaz. */
  try{ if(localStorage.getItem('lifeos.zemin.bulanik') === 'hic'){ localStorage.removeItem('lifeos.zemin.bulanik');
    ['lifeos.buzlu.kart', 'lifeos.buzlu.menu', 'lifeos.buzlu.pencere'].forEach(k => localStorage.setItem(k, 'kapali')); } }catch(e){ /* depo kapalı */ }
  Object.keys(SECIMLER).forEach(secimUygula);
  /* Aç/kapa anahtarı (iki değerli seçim için; Ses'teki anahtarla aynı biçim). */
  const anahtarHtml = (k, ad) => { const on = secim(k) === SECIMLER[k].vars;
    return '<button type="button" class="plan__anahtar' + (on ? ' is-on' : '') + '" role="switch" aria-checked="' + on + '" aria-label="' + kac(ad) + '" data-anahtar="' + k + '"><i aria-hidden="true"></i></button>'; };
  /* Tema paketleri kalktı (kullanıcı, 2026-10-30: «o kısımları kaldır; kastım ayar
     profilleri»): eski seçim depoda kalmasın. */
  try{ localStorage.removeItem('lifeos.tema.paket'); if(typeof document !== 'undefined') document.documentElement.removeAttribute('data-paket'); }catch(e){ /* depo kapalı */ }

  /* AYAR PROFİLLERİ (kullanıcı, 2026-10-30: «bir profil olsun, adını koyabileyim;
     ona geçtiğimde tüm ayarlarım o profildekine dönsün»). Profil = görünüş,
     arka plan seçimi, ses, animasyon, minik ve King tercihleri ve tema.
     Veri, hesap, kilitler ve King'in hafızası girmez. Arka plan dosyası yuvada
     tektir: profil «Kendi»yi tutar, dosyanın kendisini değil.
     Modüller ayrı kökende: liste ve etkin profil taşınır (animasyon.js
     TASINAN). Öbür modül açılınca etkin profilin damgası orada görülmemişse
     profil oraya da uygulanır ve sayfa bir kez yenilenir. */
  /* Yenilemeden önce ortak ayarı sunucuya yaz (animasyon.js ortakYenile). */
  /* Büyük ortak değişiklik (profiller) beklemeden sunucuya: kapanıştaki keepalive sınırına kalmasın. */
  function ortakSimdi(){ try{ if(L.ANIMASYON && L.ANIMASYON.ortakGonder) L.ANIMASYON.ortakGonder(false); }catch(e){ /* yok */ } }
  function yenileKaydet(){ if(L.ANIMASYON && L.ANIMASYON.ortakYenile) L.ANIMASYON.ortakYenile(); else try{ location.reload(); }catch(e){ /* yok */ } }
  const PROFIL_ANAHTAR = 'lifeos.profiller', ETKIN_ANAHTAR = 'lifeos.profil.etkin', GORDU_ANAHTAR = 'lifeos.profil.gordu', TEMA_BEKLE = 'lifeos.profil.tema';
  const PROFIL_EN = 8;
  const PROFIL_KAPSAR = L.ANIMASYON.katalogListe('p');
  const depoAl = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
  const depoKoy = (k, v) => { try{ if(v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){ /* depo kapalı */ } };
  function profiller(){
    let l = null;
    try{ l = JSON.parse(depoAl(PROFIL_ANAHTAR) || '[]'); }catch(e){ l = []; }
    return (Array.isArray(l) ? l : []).filter(p => p && typeof p.ad === 'string' && p.ayar && typeof p.ayar === 'object').slice(0, PROFIL_EN);
  }
  function etkinProfil(){ try{ const e = JSON.parse(depoAl(ETKIN_ANAHTAR) || 'null'); return e && typeof e.ad === 'string' ? e : null; }catch(x){ return null; } }
  const adTemiz = ad => String(ad || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
  const ayni = (a, b) => a.toLocaleLowerCase('tr-TR') === b.toLocaleLowerCase('tr-TR');
  function anlik(){ const o = {}; PROFIL_KAPSAR.forEach(k => { const v = depoAl(k); if(v != null) o[k] = v; }); return o; }
  function temaSimdi(){
    if(typeof document === 'undefined') return null;
    const b = document.querySelector('.ayarlar [data-act="set-theme"][aria-pressed="true"]');
    return b ? b.getAttribute('data-theme') : null;
  }
  /* Döner: { ok, mesaj }. Aynı adda profil varsa üstüne yazılır (Güncelle). */
  function profilKaydet(ad, tema){
    ad = adTemiz(ad);
    if(!ad) return { ok:false, mesaj:yz('ortak.ayarlar.profile-bir-ad-ver') };
    const l = profiller(), i = l.findIndex(p => ayni(p.ad, ad));
    if(i < 0 && l.length >= PROFIL_EN) return { ok:false, mesaj:yz('ortak.ayarlar.en-cok') + PROFIL_EN + ' profil; birini sil.' };
    const p = { ad:i >= 0 ? l[i].ad : ad, ayar:anlik(), tema:tema === undefined ? temaSimdi() : tema, zaman:Date.now() };
    if(i >= 0) l[i] = p; else l.push(p);
    depoKoy(PROFIL_ANAHTAR, JSON.stringify(l));
    const damga = String(Date.now());
    depoKoy(ETKIN_ANAHTAR, JSON.stringify({ ad:p.ad, damga }));
    depoKoy(GORDU_ANAHTAR, damga);
    ortakSimdi();
    return { ok:true, mesaj:i >= 0 ? '«' + p.ad + '» güncellendi.' : '«' + p.ad + '» kaydedildi.' };
  }
  /* Profilin ayarlarını depoya yazar (profilde olmayan anahtar varsayılana döner). */
  /* Döner: depoda değişen anahtar sayısı (profil zaten uygulanmışsa 0: sayfa boşuna yenilenmez). */
  function profilYaz(p){
    let n = 0;
    PROFIL_KAPSAR.forEach(k => { const v = Object.prototype.hasOwnProperty.call(p.ayar, k) ? String(p.ayar[k]) : null;
      if(depoAl(k) !== v){ depoKoy(k, v); n++; } });
    /* Profilin teması ortak tema seçimi olur (öbür modüller de geçer); modül kendi eylemiyle uygular. */
    if(p.tema){ if(depoAl('lifeos.tema.secim') !== p.tema){ depoKoy('lifeos.tema.secim', p.tema); n++; } depoKoy(TEMA_BEKLE, p.tema); }
    return n;
  }
  function profilUygula(ad, yenile){
    const p = profiller().find(x => ayni(x.ad, String(ad || '')));
    if(!p) return false;
    profilYaz(p);
    const damga = String(Date.now());
    depoKoy(ETKIN_ANAHTAR, JSON.stringify({ ad:p.ad, damga }));
    depoKoy(GORDU_ANAHTAR, damga);
    if(yenile !== false) yenileKaydet();
    return true;
  }
  function profilSil(ad){
    const l = profiller(), k = l.filter(p => !ayni(p.ad, String(ad || '')));
    if(k.length === l.length) return false;
    depoKoy(PROFIL_ANAHTAR, k.length ? JSON.stringify(k) : null);
    const e = etkinProfil();
    if(e && ayni(e.ad, ad)) depoKoy(ETKIN_ANAHTAR, null);
    ortakSimdi();
    return true;
  }
  /* Açılışta: başka modülde seçilen profil burada görülmediyse uygulanır (bir kez). */
  function profilEsitle(){
    const e = etkinProfil();
    if(!e || !e.damga || depoAl(GORDU_ANAHTAR) === String(e.damga)) return false;
    depoKoy(GORDU_ANAHTAR, String(e.damga));
    const p = profiller().find(x => ayni(x.ad, e.ad));
    if(!p) return false;
    return profilYaz(p) > 0;
  }
  /* TEMA SİSTEM AYARIDIR (2026-10-30): seçim `lifeos.tema.secim`'de (ortak
     kopya); modül kendi kaydında tutar, bu yüzden açılışta farklıysa modülün
     kendi «set-theme» eylemiyle eşitlenir. Saate göre tema açıkken dokunulmaz. */
  const TEMA_SECIM = 'lifeos.tema.secim';
  const TEMALAR = ['system', 'light', 'dark'];
  function temaBekleyen(){
    if(typeof document === 'undefined' || !document.body) return false;
    let t = depoAl(TEMA_BEKLE);
    depoKoy(TEMA_BEKLE, null);
    if(!t){
      t = depoAl(TEMA_SECIM);
      if(depoAl('lifeos.tema.oto') === 'acik') return false;
      if(!t || (document.documentElement.getAttribute('data-theme') || 'system') === t) return false;
    }
    if(TEMALAR.indexOf(t) < 0) return false;
    const b = document.createElement('button');
    b.type = 'button'; b.hidden = true;
    b.setAttribute('data-act', 'set-theme'); b.setAttribute('data-theme', t); b.setAttribute('data-value', t);
    document.body.appendChild(b);
    b.click();
    setTimeout(() => b.remove(), 0);
    return true;
  }
  if(typeof document !== 'undefined' && typeof location !== 'undefined' && !/\/tests\//.test(String(location.pathname || ''))){
    if(profilEsitle()) yenileKaydet();
    else{
      const bekle = () => setTimeout(temaBekleyen, 1200);   // modül ilk çizimini bitirsin
      if(document.readyState === 'complete') bekle(); else window.addEventListener('load', bekle, { once:true });
    }
  }
  let profilMesaj = '';
  const SIMGE_PROFIL = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="18" cy="18" r="2.5"/></svg>';
  function profilHtml(){
    const l = profiller(), e = etkinProfil();
    const satir = p => {
      const on = !!(e && ayni(e.ad, p.ad)), n = Object.keys(p.ayar).length;
      return '<li class="profil' + (on ? ' is-on' : '') + '"><span class="profil__harf" aria-hidden="true">' + kac(p.ad.charAt(0).toLocaleUpperCase('tr-TR')) + '</span>'
        + '<span class="profil__bilgi"><b>' + kac(p.ad) + '</b><small>' + (on ? yz('ortak.ayarlar.su-an-bu-profil') : '') + n + ' ayar' + (p.tema ? ' · tema ' + ({ light:'açık', dark:'koyu', system:'sistem' }[p.tema] || p.tema) : '') + '</small></span>'
        + (on ? '<button type="button" class="btn btn--sm btn--ghost" data-profil-guncelle="' + kac(p.ad) + ('">' + yz('ortak.ayarlar.guncelle') + '</button>')
              : '<button type="button" class="btn btn--sm" data-profil-gec="' + kac(p.ad) + ('">' + yz('ortak.ayarlar.gec') + '</button>'))
        + '<button type="button" class="profil__sil" data-profil-sil="' + kac(p.ad) + '" aria-label="' + kac(p.ad) + (' profilini sil">' + yz('ortak.ayarlar.sil') + '</button></li>');
    };
    return '<div class="profiller" data-profil-kok>'
      + '<section class="skart"><header class="skart__bas"><span class="skart__simge">' + SIMGE_PROFIL + ('</span><span class="skart__baslik"><b>' + yz('ortak.ayarlar.ayar-profilleri') + '</b>')
      + ('<small>' + yz('ortak.ayarlar.gorunus-arka-plan-ses-animas') + '</small></span></header>')
      + '<div class="skart__govde">'
      + (l.length ? '<ul class="profil__liste">' + l.map(satir).join('') + '</ul>' : '<div class="skart__bos">' + SIMGE_PROFIL + ('<b>' + yz('ortak.ayarlar.henuz-profil-yok') + '</b><small>' + yz('ortak.ayarlar.ayarlari-istedigin-gibi-yap') + '</small></div>'))
      + '<form class="profil__yeni" data-profil-form><input class="ayarlar__girdi" type="text" maxlength="24" data-profil-ad placeholder="Profil adı, örneğin Türklük" aria-label="Yeni profilin adı">'
      + ('<button type="submit" class="btn btn--sm">' + yz('ortak.ayarlar.su-anki-ayarlari-kaydet') + '</button></form>')
      + '<p class="skart__durum" role="status">' + kac(profilMesaj) + '</p>'
      + ('<p class="skart__not">' + yz('ortak.ayarlar.arka-plan-dosyasi-profilde-s') + '</p>')
      + '</div></section></div>';
  }
  function profilYenile(){ if(typeof document !== 'undefined') document.querySelectorAll('[data-profil-kok]').forEach(el => { el.outerHTML = profilHtml(); }); }

  /* «Görünümü varsayılana döndür»: yalnız görünüş tercihleri; veri değil. İki adım. */
  const SIFIRLANAN = L.ANIMASYON.katalogListe('s');

  /* Arka plan önizlemesi zemin.js'te: seçim ve yüklemede kendini yeniler. */
  const onizleHtml = yuva => L.ZEMIN && L.ZEMIN.onizleHtml ? L.ZEMIN.onizleHtml(yuva) : '';
  let secili = 'gorunum';

  const H = (ad, not, denetim) => '<div class="ayarlar__satir"><div class="ayarlar__ad">' + kac(ad)
    + (not ? '<small>' + kac(not) + '</small>' : '') + '</div><div class="ayarlar__deger">' + (denetim || '') + '</div></div>';
  /* Geniş denetim (kaydırıcılar, katmanlı seçiciler): ad üstte, denetim altta tam genişlik. */
  const G = (ad, not, denetim) => H(ad, not, denetim).replace('ayarlar__satir"', 'ayarlar__satir ayarlar__satir--genis"');
  const hesapVar = () => { try{ const d = L.HESAP && L.HESAP.dugme ? L.HESAP.dugme() : null; return !!(d && !d.gizli); }catch(e){ return false; } };
  /* Hesap merkezinin sayfaları (hesap.js SAYFA_AD): tek tıkla oraya açılır. */
  const HESAP_SAYFALARI = Object.freeze([
    ['guvenlik', yz('ortak.ayarlar.guvenlik-kontrolu'), yz('ortak.ayarlar.i-ki-adim-kurtarma-sorusu-ci')],
    ['ikiadim', yz('ortak.ayarlar.i-ki-adimli-dogrulama'), yz('ortak.ayarlar.giriste-telefondaki-kodu-da')],
    ['cihazlar', yz('ortak.ayarlar.oturum-acik-cihazlar'), yz('ortak.ayarlar.hangi-cihazlar-bagli-birinde')],
    ['etkinlik', yz('ortak.ayarlar.son-etkinlik'), yz('ortak.ayarlar.girisler-ve-yanlis-denemeler')],
    ['yedek', 'Yedekler', yz('ortak.ayarlar.hesap-deposunun-yedekleri-ge')],
    ['verin', 'Verin', yz('ortak.ayarlar.butun-verini-disa-aktar-ya')],
  ]);
  /* Bağlantılar: hesap merkezinin bağlantı sayfaları (hesap.js SAYFA_AD). */
  const BAGLANTI_SAYFALARI = Object.freeze([
    ['baglantilar', yz('ortak.ayarlar.butun-baglantilar'), yz('ortak.ayarlar.bu-hesaba-bagli-olan-her')],
    ['bagla', yz('ortak.ayarlar.yeni-cihaz-bagla'), yz('ortak.ayarlar.telefonu-ya-da-tableti-kodla')],
    ['anahtarlar', yz('ortak.ayarlar.kisayollar-ve-otomasyon'), 'iPhone Kısayollar, Home Assistant erişim anahtarları'],
    ['gelen', yz('ortak.ayarlar.gelen-kutusu'), yz('ortak.ayarlar.kisayollardan-gelen-satirlar')],
    ['takvim', yz('ortak.ayarlar.takvim-aboneligi'), yz('ortak.ayarlar.planini-telefonun-takvimine')],
  ]);
  const sayfaSatirlari = l => l.map(([sayfa, ad, not]) => H(ad, not,
    '<button type="button" class="btn btn--sm" data-ayarlar-hesap="' + sayfa + ('">' + yz('ortak.ayarlar.ac') + '</button>'))).join('');
  const hesapYok = () => H(yz('ortak.ayarlar.hesap-ve-esitleme'), yz('ortak.ayarlar.lifeos-sunucusu-kapali-ya-da'), '');
  const modulAdi = () => (typeof document !== 'undefined' && document.documentElement.getAttribute('data-modul')) || 'ays';
  const ODEME_ANAHTAR = 'lifeos.kilit.odeme';
  function odemeAcik(){ try{ return localStorage.getItem(ODEME_ANAHTAR) === 'acik'; }catch(e){ return false; } }
  function odemeAyarla(acik){
    try{ if(acik) localStorage.setItem(ODEME_ANAHTAR, 'acik'); else localStorage.removeItem(ODEME_ANAHTAR); }catch(e){ /* depo kapalı */ }
    if(typeof document !== 'undefined') document.querySelectorAll('[data-odeme]').forEach(b => {
      const on = (b.getAttribute('data-odeme') === 'acik') === acik;
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  const odemeSecici = () => '<div class="seg seg--block" role="group" aria-label="Satın alma ve kart işlemleri">'
    + [['kapali', 'Kapalı'], ['acik', 'Açık']].map(([k, ad]) => { const on = (k === 'acik') === odemeAcik();
      return '<button type="button" class="' + (on ? 'is-on' : '') + '" data-odeme="' + k + '" aria-pressed="' + on + '">' + ad + '</button>'; }).join('') + '</div>';
  const cagir = (nesne, ad) => { try{ return nesne && typeof nesne[ad] === 'function' ? nesne[ad]() : ''; }catch(e){ return ''; } };
  /* Kart (Ses ve Profiller; biçimi ayarlar.css «skart»): başlık, kısa not, gövde. */
  const SVG = d => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
  const kart = (simge, ad, not, govde) => '<section class="skart"><header class="skart__bas"><span class="skart__simge">' + simge + '</span>'
    + '<span class="skart__baslik"><b>' + kac(ad) + '</b>' + (not ? '<small>' + kac(not) + '</small>' : '') + '</span></header><div class="skart__govde">' + govde + '</div></section>';
  const SIMGE = {
    tema:SVG(yz('ortak.ayarlar.m12-3v2m12-19v2m4-2-4-2l1-4')),
    yazi:SVG(yz('ortak.ayarlar.m5-19l10-5h1l5-14m7-14h7m17')),
    renk:SVG(yz('ortak.ayarlar.m12-3a9-9-0-1')),
    resim:SVG(yz('ortak.ayarlar.m4-5h16v14h4zm4-15l4-5-4-5-4')),
    bulanik:SVG(yz('ortak.ayarlar.m12-3c3-4-6-7-5')),
    zil:SVG(yz('ortak.ayarlar.m6-16v11a6-6-0-0')),
    hareket:SVG(yz('ortak.ayarlar.m4-12h4l3-7-4-14-3-7h2')),
    king:SVG(yz('ortak.ayarlar.m4-18h16m5-18l-1-10-5-4')),
    minik:SVG(yz('ortak.ayarlar.m12-4a6-6-0-0')),
    kilit:SVG(yz('ortak.ayarlar.m6-11h12v9h6zm8-5-11v8a3-5-3')),
    yuzey:SVG(yz('ortak.ayarlar.m4-4h7v7h4zm13-4h7v7h-7zm4-1')),
    indir:SVG(yz('ortak.ayarlar.m12-4v11m7-10l5-5-5-5m5')),
    goz:SVG(yz('ortak.ayarlar.m2-5-12s6-5-5-12-5-5')),
    klavye:SVG(yz('ortak.ayarlar.m3-6h18v12h3zm7-10h-01m11-10')),
    profil:SVG(yz('ortak.ayarlar.m5-6h14m5-12h14m5-18h9m18-16')),
    ses:SVG(yz('ortak.ayarlar.m4-9v6h4l5-4v5l8-9h4zm16-5-8')),
    plan:SVG(yz('ortak.ayarlar.m4-6h16v14h4zm4-10h16m9-3v4m')),
    merkez:SVG(yz('ortak.ayarlar.m12-4-3-18-8-8-2v7-6l12-19-7')),
    bag:SVG(yz('ortak.ayarlar.m10-14a4-4-0-0')),
    ekran:SVG(yz('ortak.ayarlar.m4-5h16v11h4zm9-20h6m12-16v4')),
  };
  const SIMGE_SES = SVG(yz('ortak.ayarlar.m4-9v6h4l5-4v5l8-9h4zm16-5-8-2'));
  const SIMGE_VIDEO = SVG(yz('ortak.ayarlar.m4-6h12v12h4zm16-10l4-2-5v9l'));

  /* o = { tema:'<tema seçici HTML>', profil:{ ad, alt, route }, modul:[{ ad, route, not }] } */
  function icerik(id, o){
    if(id === 'profil') return profilHtml() + '<div class="skartlar" style="margin-top:14px">'
      + kart(SIMGE.indir, 'Yedek', yz('ortak.ayarlar.butun-tercihlerin-tek-dosyad'),
        H(yz('ortak.ayarlar.disa-aktar'), yz('ortak.ayarlar.gorunus-ses-king-profiller-v'), ('<button type="button" class="btn btn--sm" data-ayar-disa>' + yz('ortak.ayarlar.dosya-indir') + '</button>'))
        + H(yz('ortak.ayarlar.i-ce-aktar'), yz('ortak.ayarlar.dosyadaki-tercihler-uygulani'), ('<label class="btn btn--sm btn--ghost">' + yz('ortak.ayarlar.dosya-sec') + '<input type="file" accept=".json,application/json" data-ayar-ice hidden></label>'))
        + '<p class="skart__durum" role="status" data-ayar-yedek-durum></p>') + '</div>';
    /* YERLİ YERİNDE (kullanıcı, 2026-10-30: «ayarlar karman çorman oldu; her şeyi yerli
       yerinde yap»): her bölüm Ses'teki gibi başlıklı kartlardan oluşur; bir kart
       tek bir konuyu toplar. */
    if(id === 'gorunum') return '<div class="skartlar">'
      + kart(SIMGE.tema, 'Tema', yz('ortak.ayarlar.acik-koyu-ya-da-cihazinki'), H('Tema', '', o.tema) + H(yz('ortak.ayarlar.saate-gore'), '07:00–19:00 açık, sonra koyu', cagir(L.ZEMIN, 'otoSeciciHtml')))
      + kart(SIMGE.yazi, 'Yazı', yz('ortak.ayarlar.butun-modullerde-ayni'),
        ('<details class="ayarlar__acilir"><summary class="ayarlar__satir"><span class="ayarlar__ad">' + yz('ortak.ayarlar.yazi-tipi') + '</span>')
        + '<span class="ayarlar__acilir-deger" data-yazi-ad>' + kac((YAZILAR.find(y => y.id === yazi()) || YAZILAR[0]).ad) + '</span></summary>' + yaziSeciciHtml() + '</details>'
        + G('Boyut', yz('ortak.ayarlar.i-cerik-birlikte-buyur-menu'), secimHtml('boyut', yz('ortak.ayarlar.yazi-boyutu'))))
      + kart(SIMGE.renk, yz('ortak.ayarlar.renk-ve-cam'), '', H(yz('ortak.ayarlar.vurgu-rengi'), yz('ortak.ayarlar.secili-dugme-ve-sekmeler'), vurguHtml())
        + H(yz('ortak.ayarlar.cam-yogunlugu'), yz('ortak.ayarlar.kartlarin-ne-kadar-saydam-ol'), secimHtml('cam', yz('ortak.ayarlar.cam-yogunlugu')))
        + H(yz('ortak.ayarlar.sol-menu'), yz('ortak.ayarlar.cam-arkadaki-fotograf-gorunu'), secimHtml('kenar', yz('ortak.ayarlar.sol-menu')))
        + H(yz('ortak.ayarlar.ortam-isigi'), yz('ortak.ayarlar.i-mlecin-pesindeki-hafif-isi'), anahtarHtml('isik', yz('ortak.ayarlar.ortam-isigi'))))
      + ('<div class="ayarlar__dip"><button type="button" class="btn btn--sm btn--ghost" data-ayarlar-sifirla>' + yz('ortak.ayarlar.gorunumu-sifirla') + '</button><small>' + yz('ortak.ayarlar.verin-degismez') + '</small></div>')
      + '</div>';
    if(id === 'zemin') return '<div class="skartlar">'
      + kart(SIMGE.resim, yz('ortak.ayarlar.duvar-kagidi'), yz('ortak.ayarlar.gunduz-acik-temada-gece-koyu'), H('Zemin', yz('ortak.ayarlar.sade-fotograf-ve-cam-yok'), cagir(L.ZEMIN, 'seciciHtml'))
        + '<div class="zemin-yuvalar">'
        + ('<div class="zemin-yuvasi"><div class="zemin-yuvasi__bas"><b>' + yz('ortak.ayarlar.gunduz') + '</b><small>' + yz('ortak.ayarlar.acik-tema') + '</small></div>') + onizleHtml('gunduz') + cagir(L.ZEMIN, 'manzaraSeciciHtml') + '</div>'
        + ('<div class="zemin-yuvasi"><div class="zemin-yuvasi__bas"><b>' + yz('ortak.ayarlar.gece') + '</b><small>' + yz('ortak.ayarlar.koyu-tema') + '</small></div>') + onizleHtml('gece') + cagir(L.ZEMIN, 'geceSeciciHtml') + '</div></div>')
      + kart(SIMGE.bulanik, yz('ortak.ayarlar.bulaniklik-ve-okunaklik'), yz('ortak.ayarlar.her-katman-ayri-kapali-katma'),
        H(yz('ortak.ayarlar.duvar-kagidi'), yz('ortak.ayarlar.fotografin-kendisi'), secimHtml('bulanik', yz('ortak.ayarlar.duvar-kagidinin-bulanikligi')))
        + H('Perde', yz('ortak.ayarlar.fotografin-ustundeki-ortu'), secimHtml('perde', yz('ortak.ayarlar.okunaklik-perdesi')))
        + H('Kartlar', yz('ortak.ayarlar.sayfadaki-kartlar-buzlu-cam'), anahtarHtml('buzluKart', yz('ortak.ayarlar.kartlar-buzlu')))
        + H(yz('ortak.ayarlar.sol-menu'), yz('ortak.ayarlar.menu-buzlu-cam'), anahtarHtml('buzluMenu', yz('ortak.ayarlar.sol-menu-buzlu')))
        + H('Pencereler', yz('ortak.ayarlar.ayarlar-bildirimler-cekmecel'), anahtarHtml('buzluPencere', yz('ortak.ayarlar.pencereler-buzlu'))))
      + kart(SIMGE_VIDEO, yz('ortak.ayarlar.arka-plan-videosu'), yz('ortak.ayarlar.yalniz-video-seciliyken'), cagir(L.ZEMIN, 'videoAyarHtml'))
      + '</div>';
    if(id === 'bildirim'){
      const ss = L.SES && L.SES.sessiz ? L.SES.sessiz() : null;
      const sb = L.SES && L.SES.susturBitis ? L.SES.susturBitis() : 0;
      const sustur = L.SES && L.SES.sustur ? H(yz('ortak.ayarlar.simdi-sustur'), sb ? saatYazi(sb) + '’e kadar susturuldu' : yz('ortak.ayarlar.sesler-ve-king-in-sesli-okum'),
        '<div class="seg" role="group" aria-label="Şimdi sustur">' + [['60', '1 saat'], ['sabah', yz('ortak.ayarlar.sabaha-kadar')], ['0', 'Kapalı']].map(([v, ad]) => {
          const on = v === '0' ? !sb : false;
          return '<button type="button" class="' + (on ? 'is-on' : '') + '" aria-pressed="' + on + '" data-sustur="' + v + '">' + ad + '</button>'; }).join('') + '</div>') : '';
      return '<div class="skartlar">' + kart(SIMGE.zil, 'Bildirimler', '', sustur + (ss ? H(yz('ortak.ayarlar.sessiz-saatler'), yz('ortak.ayarlar.sesler-ve-king-in-sesli-okum-2'),
          '<div class="sessiz">' + '<button type="button" class="plan__anahtar' + (ss.acik ? ' is-on' : '') + '" role="switch" aria-checked="' + ss.acik + '" data-sessiz-ac>'
          + '<i aria-hidden="true"></i><span class="sr-only">' + (ss.acik ? 'Açık' : 'Kapalı') + '</span></button>'
          + '<input type="time" class="plan__saat" data-sessiz="bas" value="' + kac(ss.bas) + '" aria-label="Başlangıç">'
          + '<span aria-hidden="true">–</span><input type="time" class="plan__saat" data-sessiz="bit" value="' + kac(ss.bit) + '" aria-label="Bitiş"></div>') : '')
        + H(yz('ortak.ayarlar.sayaclar-ve-noktalar'), yz('ortak.ayarlar.kenardaki-bildirim-sayisi-ve'), secimHtml('rozet', yz('ortak.ayarlar.sayaclar-ve-noktalar')))) + '</div>';
    }
    if(id === 'hareket') return '<div class="skartlar">' + kart(SIMGE.hareket, 'Animasyon', yz('ortak.ayarlar.az-yalniz-gerekli-gecisler'),
      H('Animasyonlar', '', cagir(L.ANIMASYON, 'seciciHtml')) + G('Hız', yz('ortak.ayarlar.arayuz-ve-ajanlar-ayri-ayrin'), cagir(L.ANIMASYON, 'hizSeciciHtml'))) + '</div>';
    /* ERİŞİLEBİLİRLİK (2026-10-31): okumayı ve gezinmeyi kolaylaştıran ayarlar tek yerde. */
    if(id === 'erisim') return '<div class="skartlar">'
      + kart(SIMGE.goz, 'Okuma', yz('ortak.ayarlar.yazi-ve-renk'), G(yz('ortak.ayarlar.yazi-boyutu'), yz('ortak.ayarlar.i-cerik-birlikte-buyur'), secimHtml('boyut', yz('ortak.ayarlar.yazi-boyutu')))
        + H(yz('ortak.ayarlar.satir-araligi'), yz('ortak.ayarlar.genis-paragraflar-daha-rahat'), secimHtml('satir', yz('ortak.ayarlar.satir-araligi')))
        + H('Kontrast', yz('ortak.ayarlar.yuksek-soluk-yazilar-koyulas'), secimHtml('kontrast', 'Kontrast')))
      + kart(SIMGE.klavye, 'Gezinme', yz('ortak.ayarlar.klavye-ve-baglantilar'), H(yz('ortak.ayarlar.odak-cercevesi'), yz('ortak.ayarlar.klavyeyle-gezerken-secili-og'), secimHtml('odak', yz('ortak.ayarlar.odak-cercevesi')))
        + H(yz('ortak.ayarlar.baglantilarin-alti-cizili'), yz('ortak.ayarlar.baglantilar-renk-disinda-da'), secimHtml('altcizgi', yz('ortak.ayarlar.baglantilarin-alti-cizili'))))
      + kart(SIMGE.hareket, 'Hareket', '', H('Animasyonlar', yz('ortak.ayarlar.az-kayma-yok-yalniz-solma'), cagir(L.ANIMASYON, 'seciciHtml')))
      + '</div>';
    /* Ses (kullanıcı, 2026-10-30: «ses kısmında bayağı eksiklik, amatörlük ve tasarımda kötülük var»):
       kartlar; düzeyler, müzik kitaplığı, açılış, arka plan müziği, arka plan videosu. */
    if(id === 'ses') return '<div class="skartlar">'
      + kart(SIMGE_SES, yz('ortak.ayarlar.ses-duzeyleri'), yz('ortak.ayarlar.genel-hepsini-birlikte-kisar'), cagir(L.SES, 'duzeySeciciHtml'))
      + cagir(L.MUZIK, 'ayarHtml')
      + '<button type="button" class="skart skart--bag" data-ayarlar-git="zemin">' + SIMGE_VIDEO
      + ('<span class="skart__baslik"><b>' + yz('ortak.ayarlar.arka-plan-videosunun-sesi') + '</b><small>' + yz('ortak.ayarlar.arka-plan-bolumunde-ses-kesi') + '</small></span><span aria-hidden="true">›</span></button>')
      + '</div>';
    if(id === 'king') return '<div class="skartlar">' + kart(SIMGE.king, 'King', yz('ortak.ayarlar.adi-konusmasi-ve-sesi'),
        H('Adı', yz('ortak.ayarlar.bos-birakirsan-king'), '<input class="ayarlar__girdi" type="text" maxlength="20" data-king-ad placeholder="King"'
        + ' value="' + kac((() => { try{ return localStorage.getItem('lifeos.king.ad') || ''; }catch(e){ return ''; } })()) + '" aria-label="King’in adı">')
      + (L.KING && L.KING.ayarHtml ? cagir(L.KING, 'ayarHtml') : H('Görünüşü', '', cagir(L.KING, 'gorunusSeciciHtml'))))
      + kart(SIMGE.bag, 'Bağlantılar', yz('ortak.ayarlar.merkez-uzerinden-model-aylik'),
        ('<div class="merkezayar" data-merkez-kok><p class="ayarlar__bos">' + yz('ortak.ayarlar.yukleniyor') + '</p></div>')) + '</div>';
    if(id === 'ekip') return '<div class="skartlar">' + kart(SIMGE.minik, 'Minikler', yz('ortak.ayarlar.sayfada-gezen-kucuk-yardimci'),
        H(yz('ortak.ayarlar.kac-minik'), yz('ortak.ayarlar.sayfada-en-cok'), cagir(L.MINIK, 'seciciHtml')) + H('Boy', '', cagir(L.MINIK, 'boySeciciHtml')))
      + kart(SIMGE.minik, yz('ortak.ayarlar.kimler-gezsin'), yz('ortak.ayarlar.basinca-sayfadan-cikar-ya-da'), cagir(L.MINIK, 'galeriHtml')) + '</div>';
    if(id === 'hesap'){
      const p = o.profil || {};
      return '<div class="skartlar"><div class="ayarlar__profil"><i class="ayarlar__avatar" aria-hidden="true">' + kac(((p.ad || 'Ben').trim().charAt(0) || 'B').toLocaleUpperCase('tr-TR')) + '</i>'
        + '<span><b>' + kac(p.ad || 'Profil') + '</b><small>' + kac(p.alt || '') + '</small></span>'
        + (p.route ? '<button type="button" class="btn btn--sm" data-act="go" data-route="' + kac(p.route) + ('">' + yz('ortak.ayarlar.profili-ac') + '</button>') : '') + '</div>'
        + kart(SIMGE.kilit, 'Güvenlik', '', hesapVar() ? sayfaSatirlari(HESAP_SAYFALARI) : hesapYok())
        + kart(SIMGE.kilit, yz('ortak.ayarlar.satin-alma-ve-kart-islemleri'), '', H('Durum', odemeAcik() ? yz('ortak.ayarlar.acik-yine-de-lifeos-ta-odeme')
            : yz('ortak.ayarlar.kapali-king-ve-ajanlar-odeme'), odemeSecici())) + '</div>';
    }
    if(id === 'baglanti') return G(yz('ortak.ayarlar.google-dan-veri'), yz('ortak.ayarlar.hesap-baglanmaz-veri-bu-bilg'), cagir(L.ICE, 'ayarHtml'))
      + H(yz('ortak.ayarlar.google-ve-youtube'), yz('ortak.ayarlar.hesap-baglanmaz-king-in-buld'), '')
      + (hesapVar() ? sayfaSatirlari(BAGLANTI_SAYFALARI) : hesapYok());
    if(id === 'merkez') return ('<div class="merkezayar merkezayar--tam" data-merkez-tam-kok><p class="ayarlar__bos">' + yz('ortak.ayarlar.yukleniyor') + '</p></div>');
    if(id === 'sistem') return ('<h4 class="plan__baslik">' + yz('ortak.ayarlar.sistem-planlamasi') + '</h4><div class="plan" data-plan-kok><p class="ayarlar__bos">' + yz('ortak.ayarlar.yukleniyor') + '</p></div>');
    if(id === 'modul') return '<div class="skartlar">'
      + kart(SIMGE.yuzey, 'Yüzey', yz('ortak.ayarlar.kartlarin-bu-moduldeki-duzen'), H('Düzen', '', cagir(L.ZEMIN, 'yuzeySeciciHtml')))
      + (L.KILIT && L.KILIT.ayarHtml ? kart(SIMGE.kilit, yz('ortak.ayarlar.gizlilik-kilidi'), yz('ortak.ayarlar.bu-modul-acilirken-dort-hane'), L.KILIT.ayarHtml(modulAdi(), { govde:true })) : '')
      + ((o.modul || []).length ? kart(SIMGE.ekran, (MODUL_AD[modulAdi()] || 'Modül') + ' ekranları', yz('ortak.ayarlar.modulun-kendi-ayar-sayfalari'), o.modul.map(m => H(m.ad, m.not || '',
        '<button type="button" class="btn btn--sm" data-act="go" data-route="' + kac(m.route) + ('">' + yz('ortak.ayarlar.ac') + '</button>'))).join('')) : '')
      + '</div>';
    return '';
  }

  function html(o){
    o = o || {};
    if(!BOLUMLER.some(b => b.id === secili)) secili = 'gorunum';
    if(secili === 'sistem' && typeof setTimeout === 'function') setTimeout(() => planYukle(), 0);
    if(o.hkm) merkezHkm = o.hkm;
    if(secili === 'king' && typeof setTimeout === 'function') setTimeout(() => merkezYukle(), 0);
    if(secili === 'merkez' && typeof setTimeout === 'function') setTimeout(() => merkezTamYukle(), 0);
    const alan = alanOf(secili);
    const NAV_SIMGE = { profil:SIMGE.profil, merkez:SIMGE.merkez, gorunum:SIMGE.tema, zemin:SIMGE.resim, ses:SIMGE.ses, hareket:SIMGE.hareket, erisim:SIMGE.goz, king:SIMGE.king,
      ekip:SIMGE.minik, bildirim:SIMGE.zil, sistem:SIMGE.plan, modul:SIMGE.yuzey, hesap:SIMGE.kilit, baglanti:SIMGE.bag };
    const nav = BOLUMLER.map(b => '<button type="button" class="ayarlar__sekme' + (b.id === secili ? ' is-on' : '') + '" role="tab"' + (b.grup === alan ? '' : ' hidden')
      + ' id="ayarlar-sekme-' + b.id + '" aria-selected="' + (b.id === secili) + '" aria-controls="ayarlar-bolum-' + b.id + '"'
      + ' data-ayar-bolum="' + b.id + '">' + (NAV_SIMGE[b.id] || '') + kac(b.ad) + '</button>').join('');
    const govde = BOLUMLER.map(b => '<section class="ayarlar__bolum" role="tabpanel" id="ayarlar-bolum-' + b.id + '" data-baslik="' + kac(b.ad) + '"'
      + ' aria-labelledby="ayarlar-sekme-' + b.id + '"' + (b.id === secili ? '' : ' hidden') + '>'
      + kapsamHtml(b.grup, b.ad) + icerik(b.id, o) + '</section>').join('');
    return '<div class="katman kmenu kmenu--yan ayarlar" role="dialog" aria-label="Ayarlar">'
      + ('<header class="ayarlar__bas"><b>' + yz('ortak.ayarlar.ayarlar') + '</b>')
      + '<button type="button" class="bildirim__kapat" data-katman-kapat aria-label="Ayarları kapat">'
      + (L.KABUK ? L.KABUK.simge('kapat') : '×') + '</button></header>'
      + alanlarHtml()
      + '<div class="ayarlar__govde"><nav class="ayarlar__nav" role="tablist" aria-label="Ayar bölümleri" aria-orientation="vertical">'
      + '<input type="search" class="ayarlar__ara" data-ayarlar-ara placeholder="Ayarlarda ara" aria-label="Ayarlarda ara" autocomplete="off">' + nav + '</nav>'
      + '<div class="ayarlar__icerik">' + govde + '</div></div></div>';
  }

  const saatYazi = t => { try{ return new Date(t).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }); }catch(e){ return ''; } };
  /* Bir bölümü yerinde yeniden çizer (kaydırma yerinde kalır). */
  function bolumYenile(panel, id){
    const sec = panel && panel.querySelector('#ayarlar-bolum-' + id);
    if(!sec) return;
    const b = BOLUMLER.find(x => x.id === id), ic = panel.querySelector('.ayarlar__icerik'), y = ic ? ic.scrollTop : 0;
    sec.innerHTML = kapsamHtml(b.grup, b.ad) + icerik(id, {});
    if(ic) ic.scrollTop = y;
  }
  /* YEDEK (2026-10-31): tercihleri dosyaya yazar / dosyadan okur. Yalnız ortak tercih
     anahtarları (animasyon.js ORTAK; sistem/ayar.py ile aynı); veri, hesap ve kilit girmez. */
  function yedekDurum(m){ if(typeof document !== 'undefined') document.querySelectorAll('[data-ayar-yedek-durum]').forEach(x => { x.textContent = m; }); }
  function ayarAnlik(){
    const R = L.ANIMASYON && L.ANIMASYON.ORTAK, o = {};
    try{ for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(R && R.test(k)) o[k] = localStorage.getItem(k); } }catch(e){ /* depo kapalı */ }
    return o;
  }
  function ayarDisa(){
    try{
      const veri = JSON.stringify({ lifeos:'ayarlar', surum:1, tarih:new Date().toISOString(), ayar:ayarAnlik() }, null, 2);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([veri], { type:'application/json' }));
      a.download = 'lifeos-ayarlar-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
      yedekDurum(yz('ortak.ayarlar.i-ndirildi') + Object.keys(JSON.parse(veri).ayar).length + ' tercih.');
    }catch(e){ yedekDurum('İndirilemedi.'); }
  }
  /* Döner: uygulanan anahtar sayısı (dosya bozuksa 0, hiçbir şey değişmez). */
  function ayarUygula(metin){
    let v = null;
    try{ v = JSON.parse(metin); }catch(e){ return 0; }
    const R = L.ANIMASYON && L.ANIMASYON.ORTAK;
    if(!v || v.lifeos !== 'ayarlar' || !v.ayar || typeof v.ayar !== 'object' || !R) return 0;
    let n = 0;
    Object.keys(v.ayar).forEach(k => { const x = v.ayar[k];
      if(R.test(k) && typeof x === 'string' && x.length <= (k === 'lifeos.profiller' ? 60000 : 4000)){ depoKoy(k, x); n++; } });
    return n;
  }
  function ayarIce(dosya){
    if(!dosya || !dosya.text) return;
    dosya.text().then(m => {
      const n = ayarUygula(m);
      if(!n){ yedekDurum(yz('ortak.ayarlar.bu-dosya-bir-lifeos-ayar')); return; }
      yedekDurum(n + ' tercih uygulandı; sayfa yenileniyor…');
      setTimeout(yenileKaydet, 600);
    }).catch(() => yedekDurum(yz('ortak.ayarlar.dosya-okunamadi')));
  }
  function sessizYaz(degisen){
    if(!(L.SES && L.SES.sessiz)) return;
    const v = Object.assign(L.SES.sessiz(), degisen);
    try{ localStorage.setItem(L.SES.SESSIZ_ANAHTAR, JSON.stringify(v)); }catch(e){ /* depo kapalı */ }
  }
  const kucukHarf = x => String(x || '').toLocaleLowerCase('tr-TR');
  function ara(panel, q){
    if(!panel) return;
    const a = kucukHarf(q).trim();
    panel.classList.toggle('is-aranir', !!a);
    panel.querySelectorAll('.ayarlar__bolum').forEach(sec => {
      if(!a){ sec.hidden = sec.id !== 'ayarlar-bolum-' + secili; sec.querySelectorAll('[data-ara-gizli]').forEach(x => { x.hidden = false; x.removeAttribute('data-ara-gizli'); }); return; }
      const satirlar = Array.from(sec.querySelectorAll('.ayarlar__satir, .zemin-yuvasi, .minikgal__kart, .skart'));
      const basUyar = kucukHarf(sec.getAttribute('data-baslik')).indexOf(a) >= 0;   // bölümün adı tutarsa hepsi kalır
      satirlar.forEach(x => {
        const uy = basUyar || kucukHarf(x.textContent).indexOf(a) >= 0;
        x.hidden = !uy;
        if(uy) x.removeAttribute('data-ara-gizli'); else x.setAttribute('data-ara-gizli', '');
      });
      sec.hidden = !(basUyar || satirlar.some(x => !x.hidden));
    });
  }
  function sekmeSec(panel, id){
    if(!panel || !BOLUMLER.some(b => b.id === id)) return;
    /* Yeni bölüm en üstten açılır (2026-10-31: «ayarlarda kaydırma bazen buga giriyor»:
       bölüm değişince öncekinin kaydırma yerinde, ortadan açılıyordu). */
    const ic = panel.querySelector('.ayarlar__icerik');
    if(ic && secili !== id) ic.scrollTop = 0;
    secili = id;
    panel.querySelectorAll('[data-ayar-bolum]').forEach(b => {
      const on = b.getAttribute('data-ayar-bolum') === id;
      b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panel.querySelectorAll('.ayarlar__bolum').forEach(s => { s.hidden = s.id !== 'ayarlar-bolum-' + id; });
    const alan = alanOf(id);
    panel.querySelectorAll('[data-ayar-bolum]').forEach(b => { b.hidden = alanOf(b.getAttribute('data-ayar-bolum')) !== alan; });
    panel.querySelectorAll('[data-ayar-alan]').forEach(b => { const on = b.getAttribute('data-ayar-alan') === alan; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    if(id === 'sistem') planYukle();
    if(id === 'king') merkezYukle();
    if(id === 'merkez') merkezTamYukle();
  }

  /* KING VE BAĞLANTILAR (Gün planı F1, 2026-11-03): HKM'nin ayarlarından yalnız
     görünen kısım (model paketi, aylık tavan, kanal aç-kapa, üç eşik); veri
     katmanı LIFEOS.MerkezAyar. Anahtar, jeton ve sunucu ayarları burada yok:
     yalnız cihazın sahibine «Atölye» bağlantısı (HKM'nin kendi sayfası).
     Merkez bağlı değilse ya da bu profil sahibi değilse tek cümle söyler. */
  let merkezHkm = null, merkezSon = null, merkezMesaj = '';
  function merkezKok(){ return typeof document !== 'undefined' ? document.querySelector('[data-merkez-kok]') : null; }
  function merkezIstemci(){ return L.MerkezAyar && merkezHkm ? L.MerkezAyar.kur({ hkm:merkezHkm }) : null; }
  function merkezYukle(){
    const kok = merkezKok(), m = merkezIstemci();
    if(!kok) return;
    if(!m){ kok.innerHTML = merkezYok('baglanti'); return; }
    m.oku().then(r => { merkezSon = r.ok ? r : null; const k = merkezKok(); if(k) k.innerHTML = r.ok ? merkezCiz(r.gorunum) : merkezYok(r.neden); });
  }
  const merkezYok = neden => '<p class="ayarlar__bos">' + (neden === 'baglanti'
    ? yz('ortak.ayarlar.merkez-bu-profilde-bagli-deg')
    : yz('ortak.ayarlar.merkez-su-an-yanit-vermiyor')) + '</p>'
    + ('<button type="button" class="btn btn--sm" data-merkez-baslat>' + yz('ortak.ayarlar.merkez-i-baslat-ve-bagla') + '</button>');
  const para = (v, b) => v == null ? 'veri yok' : (b === 'try' ? '₺' : '$') + String(v).replace('.', ',');
  function merkezCiz(g){
    const paket = '<div class="seg seg--block" role="group" aria-label="Model paketi">' + g.paket.liste.map(p => {
      const on = p.id === g.paket.secili;
      return '<button type="button" class="' + (on ? 'is-on' : '') + '" aria-pressed="' + on + '" data-merkez="paket:' + kac(p.id) + '">'
        + kac(p.id) + '<small class="merkezayar__alt">' + (p.aylik == null ? 'veri yok' : '≈ ' + para(p.aylik, 'usd') + '/ay · tahmin') + '</small></button>'; }).join('') + '</div>';
    const birim = g.tavan.birim === 'try' ? 'try' : 'usd';
    const tavan = '<div class="merkezayar__tavan"><input class="ayarlar__girdi" type="number" min="0" step="1" inputmode="decimal" data-merkez-tavan'
      + ' value="' + (g.tavan.deger == null ? '' : kac(g.tavan.deger)) + '" placeholder="veri yok" aria-label="Aylık tavan">'
      + '<div class="seg" role="group" aria-label="Para birimi">' + [['usd', 'USD'], ['try', 'TL']].map(([v, a]) =>
        '<button type="button" class="' + (v === birim ? 'is-on' : '') + '" aria-pressed="' + (v === birim) + '" data-merkez="birim:' + v + '">' + a + '</button>').join('') + '</div></div>';
    const kanal = g.kanallar.map(k => H(k.baslik, k.hazir ? (k.acik ? yz('ortak.ayarlar.acik-king-buradan-yazabilir') : 'Kapalı') : yz('ortak.ayarlar.kurulu-degil-jetonu-ayarlar'),
      '<button type="button" class="plan__anahtar' + (k.acik ? ' is-on' : '') + '" role="switch" aria-checked="' + k.acik + '" aria-label="' + kac(k.baslik) + '"'
      + (k.hazir || k.acik ? '' : ' disabled') + ' data-merkez="kanal:' + k.ad + ':' + (!k.acik) + '"><i aria-hidden="true"></i></button>')).join('');
    const esik = g.esikler.map(e => G(e.etiket, e.min + '–' + e.max + ' arası',
      '<div class="merkezayar__esik"><input type="range" min="' + e.min + '" max="' + e.max + '" step="' + (e.max - e.min > 50 ? 1 : 0.5) + '" value="' + e.deger + '"'
      + ' data-merkez-esik="' + kac(e.grup + ':' + e.ad) + '" aria-label="' + kac(e.etiket) + '"><output>' + String(e.deger).replace('.', ',') + '</output></div>')).join('');
    return G(yz('ortak.ayarlar.model-paketi'), yz('ortak.ayarlar.aylik-tutar-son-30-gunun'), paket)
      + H(yz('ortak.ayarlar.aylik-tavan'), yz('ortak.ayarlar.tavana-varinca-ucretli-model'), tavan)
      + kanal + esik
      + H(yz('ortak.ayarlar.butun-merkez-ayarlari'), yz('ortak.ayarlar.anahtarlar-kanallar-zamanlam'),
        ('<button type="button" class="btn btn--sm btn--ghost" data-ayarlar-git="merkez">' + yz('ortak.ayarlar.merkez-i-ac') + '</button>'))
      + '<p class="merkezayar__durum" role="status">' + kac(merkezMesaj) + '</p>';
  }
  /* AYARLAR › MERKEZ (Gün planı, 2026-11-03: «HKM'yi komple kaldır, ayarlara taşı»).
     HKM'nin eski Ayarlar ekranının hepsi burada, sekmelerle (MerkezAyar.sekmeler: açık
     şema; yalnız şemadaki alan yazılır, HKM ayrıca denetler). Sır okunmaz: «kurulu ••xy»
     ve yeni değer kutusu. Merkez kapalıysa tek düğme: başlat ve bu modülü bağla. */
  let merkezSekme = 'genel';
  function merkezTamKok(){ return typeof document !== 'undefined' ? document.querySelector('[data-merkez-tam-kok]') : null; }
  function merkezTamYukle(){
    const kok = merkezTamKok(), m = merkezIstemci();
    if(!kok) return;
    if(!m){ kok.innerHTML = merkezDurumKart(false, 'baglanti'); return; }
    m.oku().then(r => { if(r.ok) merkezSon = r; const k = merkezTamKok(); if(k) k.innerHTML = r.ok ? merkezTamCiz(r.cfg) : merkezDurumKart(false, r.neden); });
  }
  function merkezDurumKart(acik, neden){
    return '<div class="merkezayar__ust"><i class="merkezayar__isaret' + (acik ? ' is-acik' : '') + '" aria-hidden="true"></i><div><b>'
      + (acik ? yz('ortak.ayarlar.merkez-calisiyor-ve-bagli') : neden === 'baglanti' ? yz('ortak.ayarlar.merkez-bu-profilde-bagli-deg-2') : yz('ortak.ayarlar.merkez-yanit-vermiyor')) + '</b><small>'
      + (acik ? yz('ortak.ayarlar.king-in-hafizasi-modelleri-v') : yz('ortak.ayarlar.king-yine-calisir-merkez-aci'))
      + '</small></div>' + (acik ? '' : ('<button type="button" class="btn btn--sm" data-merkez-baslat>' + yz('ortak.ayarlar.baslat-ve-bagla') + '</button>')) + '</div>'
      + '<p class="merkezayar__durum" role="status">' + kac(merkezMesaj) + '</p>';
  }
  function merkezDenetim(a){
    const id = 'mz-' + a.yol.replace(/\./g, '-'), ortak = ' id="' + id + '" data-merkez-alan="' + kac(a.yol) + '" data-tur="' + a.tur + '"';
    if(a.tur === 'bool') return '<button type="button" class="plan__anahtar' + (a.deger ? ' is-on' : '') + '" role="switch" aria-checked="' + !!a.deger + '" aria-label="' + kac(a.ad) + '"' + ortak + '><i aria-hidden="true"></i></button>';
    if(a.tur === 'sir') return '<div class="merkezayar__sir"><span class="merkezayar__rozet' + (a.deger && a.deger.kurulu ? ' is-kurulu' : '') + '">'
      + (a.deger && a.deger.kurulu ? yz('ortak.ayarlar.kurulu') + kac(a.deger.ipucu) : yz('ortak.ayarlar.kurulu-degil')) + '</span>'
      + '<input class="ayarlar__girdi" type="password" autocomplete="off" placeholder="' + (a.deger && a.deger.kurulu ? yz('ortak.ayarlar.yenisiyle-degistir') : 'Yapıştır') + '" aria-label="' + kac(a.ad) + '"' + ortak + '>'
      + '<button type="button" class="btn btn--sm btn--ghost" data-merkez-sir="' + id + ('">' + yz('ortak.ayarlar.kaydet') + '</button></div>');
    if(a.tur === 'secim') return '<select class="ayarlar__girdi" aria-label="' + kac(a.ad) + '"' + ortak + '>' + (a.secenek || []).map(x =>
      '<option value="' + kac(x[0]) + '"' + (x[0] === (a.deger || '') ? ' selected' : '') + '>' + kac(x[1]) + '</option>').join('') + '</select>';
    const tip = a.tur === 'sayi' ? 'number' : a.tur === 'saat' ? 'time' : 'text';
    const deger = Array.isArray(a.deger) ? a.deger.join(', ') : a.deger == null ? '' : a.deger;
    return '<input class="ayarlar__girdi' + (a.tur === 'sayi' ? ' merkezayar__sayi' : '') + '" type="' + tip + '" value="' + kac(deger) + '" aria-label="' + kac(a.ad) + '"'
      + (a.tur === 'sayi' ? ' min="' + a.min + '" max="' + a.max + '" step="' + (a.adim || (a.max - a.min <= 2 ? 0.01 : a.max - a.min <= 20 ? 0.5 : 1)) + '" inputmode="decimal"' : '') + ortak + '>';
  }
  function merkezTamCiz(cfg){
    const l = L.MerkezAyar.sekmeler(cfg);
    if(!l.some(x => x.id === merkezSekme)) merkezSekme = 'genel';
    const s = l.find(x => x.id === merkezSekme);
    const not = a => [a.not, a.tur === 'sayi' && a.min != null ? a.min + '–' + a.max : ''].filter(Boolean).join(' · ');
    return merkezDurumKart(true)
      + '<div class="seg seg--block merkezayar__sekmeler" role="tablist" aria-label="Merkez ayarları">' + l.map(x => '<button type="button" role="tab" class="'
        + (x.id === merkezSekme ? 'is-on' : '') + '" aria-selected="' + (x.id === merkezSekme) + '" data-merkez-sekme="' + x.id + '">' + kac(x.ad) + '</button>').join('') + '</div>'
      + '<div class="skartlar">' + s.gruplar.map(g => kart(SIMGE.merkez, g.ad, g.not, g.alanlar.map(a => H(a.ad, not(a), merkezDenetim(a))).join(''))).join('') + '</div>'
      + (merkezSekme === 'genel' ? ('<p class="merkezayar__arsiv">' + yz('ortak.ayarlar.eski-merkez-ekranlari-motto') + ' ')
        + ('<a href="http://127.0.0.1:4200/atolye" target="_blank" rel="noopener">' + yz('ortak.ayarlar.ac-2') + '</a>' + yz('ortak.ayarlar.verileri-yerinde') + '</p>') : '');
  }
  async function merkezBaslat(dugme){
    if(dugme){ dugme.disabled = true; dugme.textContent = 'Başlatılıyor…'; }
    merkezMesaj = '';
    try{
      const r = await fetch('/api/merkez/ac', { method:'POST', headers:{ 'X-LifeOS':'merkez' }, cache:'no-store' }).then(x => x.json());
      if(!r || !r.ok) merkezMesaj = (r && r.mesaj) || yz('ortak.ayarlar.merkez-acilamadi');
      else{
        const b = merkezHkm && merkezHkm();
        const e = b && b.kendiBaglan ? await b.kendiBaglan() : { ok:false };
        merkezMesaj = e && e.ok ? yz('ortak.ayarlar.merkez-acildi-ve-bu-modul') : yz('ortak.ayarlar.merkez-acildi-baglanamadi') + ((e && e.note) || 'eşleme penceresi kapandı, yeniden dene') + '.';
      }
    }catch(er){ merkezMesaj = yz('ortak.ayarlar.merkez-yalniz-lifeos-sunucus'); }
    merkezYukle(); merkezTamYukle();
  }
  function merkezYaz(d){
    const m = merkezIstemci();
    if(!m) return;
    merkezMesaj = 'Kaydediliyor…';
    document.querySelectorAll('.merkezayar__durum').forEach(x => { x.textContent = merkezMesaj; });
    m.oku().then(() => m.yaz(d)).then(r => {
      merkezMesaj = r.ok ? 'Kaydedildi.' : (r.hata || (r.neden === 'baglanti' ? yz('ortak.ayarlar.merkez-bagli-degil') : yz('ortak.ayarlar.kaydedilemedi-merkez-yanit-v')));
      merkezYukle(); merkezTamYukle();
    });
  }
  if(typeof document !== 'undefined'){
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const bs = t.closest('[data-merkez-baslat]');
      if(bs){ e.preventDefault(); merkezBaslat(bs); return; }
      const sk = t.closest('[data-merkez-sekme]');
      if(sk){ merkezSekme = sk.getAttribute('data-merkez-sekme'); const k = merkezTamKok(); if(k && merkezSon) k.innerHTML = merkezTamCiz(merkezSon.cfg); return; }
      const al = t.closest('[data-merkez-alan][data-tur="bool"]');
      if(al){ merkezYaz({ tur:'alan', yol:al.getAttribute('data-merkez-alan'), deger:al.getAttribute('aria-checked') !== 'true' }); return; }
      const sr = t.closest('[data-merkez-sir]');
      if(sr){ const i = document.getElementById(sr.getAttribute('data-merkez-sir')); if(i && i.value.trim()){ const v = i.value; i.value = '';
        merkezYaz({ tur:'alan', yol:i.getAttribute('data-merkez-alan'), deger:v }); } return; }
    });
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest ? e.target.closest('[data-merkez]') : null;
      if(!b || b.disabled) return;
      const [t, a, c] = b.getAttribute('data-merkez').split(':');
      if(t === 'paket') merkezYaz({ tur:'paket', deger:a });
      else if(t === 'kanal') merkezYaz({ tur:'kanal', ad:a, acik:c === 'true' });
      else if(t === 'birim'){ const g = merkezSon && merkezSon.gorunum; const i = document.querySelector('[data-merkez-tavan]');
        const v = i && i.value !== '' ? Number(i.value) : (g && g.tavan.deger) || 0; merkezYaz({ tur:'tavan', birim:a, deger:v }); }
    });
    document.addEventListener('input', e => {
      const r = e.target && e.target.matches && e.target.matches('[data-merkez-esik]') ? e.target : null;
      const o = r && r.nextElementSibling;
      if(o) o.textContent = String(r.value).replace('.', ',');
    });
    document.addEventListener('change', e => {
      const t = e.target;
      if(!t || !t.matches) return;
      if(t.matches('[data-merkez-alan]') && ['sayi', 'saat', 'secim', 'metin', 'liste'].indexOf(t.getAttribute('data-tur')) >= 0){
        const tur = t.getAttribute('data-tur');
        merkezYaz({ tur:'alan', yol:t.getAttribute('data-merkez-alan'), deger:tur === 'sayi' ? (t.value === '' ? NaN : Number(t.value)) : t.value });
      }
      else if(t.matches('[data-merkez-esik]')){ const [g, a] = t.getAttribute('data-merkez-esik').split(':'); merkezYaz({ tur:'esik', grup:g, ad:a, deger:Number(t.value) }); }
      else if(t.matches('[data-merkez-tavan]') && t.value !== ''){ const b = document.querySelector('[data-merkez^="birim:"].is-on');
        merkezYaz({ tur:'tavan', birim:b ? b.getAttribute('data-merkez').slice(6) : 'usd', deger:Number(t.value) }); }
    });
  }

  /* SİSTEM PLANLAMASI (kullanıcı, 2026-10-29: «sistemin kendini ne zaman
     başlatacağını, ne zaman kapatacağını periyodik bir çizgi üzerinden
     haftalık ayarlayalım; misal her cumartesi 7'de genel tarama; kaçarsa en
     müsait anda yapsın ya da onayımızı beklesin»). Plan PC'deki sunucudadır
     (sistem/planlama.py, /api/planlama; yalnız bu bilgisayardan): her
     değişiklik hemen kaydedilir. Haftalık çizgi yedi gündür; her günde o gün
     planlanan açılış, kapanış ve işler saatiyle durur. */
  let plan = null, planMesaj = '', planZaman = 0;
  const saatAd = t => { try{ const d = new Date(t * 1000); return d.toLocaleDateString('tr-TR', { day:'numeric', month:'short' }) + ' ' + d.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }); }catch(e){ return ''; } };
  function planKok(){ return typeof document !== 'undefined' ? document.querySelector('[data-plan-kok]') : null; }
  function planYukle(){
    const kok = planKok();
    if(!kok || typeof fetch !== 'function') return;
    if(!/^https?:$/.test(location.protocol)){ kok.innerHTML = planYok(); return; }
    fetch('/api/planlama', { cache:'no-store' }).then(r => r.ok ? r.json() : Promise.reject())
      .then(v => {
        plan = planUyumla(v);
        try{ planCiz(); }catch(e){ const k = planKok(); if(k) k.innerHTML = ('<p class="ayarlar__bos">' + yz('ortak.ayarlar.plan-okundu-ama-cizilemedi-s') + '</p>'); }
      }, () => { const k = planKok(); if(k) k.innerHTML = planYok(); });
  }
  /* Güncellemeden sonra sunucu yeniden başlatılmadıysa eski biçim gelir (açılışta
     gunler + saat, işte tek gun; 2026-10-30'da bu yüzden «sunucu yok» yazıyordu).
     Gösterilir ama kaydedilmez: eski sunucu yeni biçimi anlamaz. */
  function planUyumla(v){
    const p = v && v.plan;
    if(!p) return v;
    ['acilis', 'kapanis'].forEach(k => {
      const x = p[k];
      if(x && !Array.isArray(x.saatler)){ v.eski = true; x.saatler = [0, 1, 2, 3, 4, 5, 6].map(g => (x.gunler || []).indexOf(g) >= 0 ? x.saat : null); }
    });
    Object.keys(p.isler || {}).forEach(id => { const x = p.isler[id]; if(x && !Array.isArray(x.gunler)){ v.eski = true; x.gunler = [typeof x.gun === 'number' ? x.gun : 5]; } });
    return v;
  }
  const planYok = () => ('<p class="ayarlar__bos">' + yz('ortak.ayarlar.sistem-planlamasi-lifeos-sun') + '</p>');
  /* Esnek plan (kullanıcı, 2026-10-30: «planlama çok eksik ve çok karmaşık;
     her gün aynı saat olmak zorunda değil; esneklik yokken arayüz çok
     karmaşık ve acemice»). Açılış ve kapanış tek tablo: her günün kendi saati
     (boş = o gün yok). İşler tek satır özet; ayrıntı «Düzenle»de: hazır gün
     kümeleri, birden çok gün, saat, kaçarsa. */
  let planAcik = '';
  const KUMELER = [['her', yz('ortak.ayarlar.her-gun'), [0, 1, 2, 3, 4, 5, 6]], ['ici', yz('ortak.ayarlar.hafta-ici'), [0, 1, 2, 3, 4]], ['sonu', yz('ortak.ayarlar.hafta-sonu'), [5, 6]]];
  const ESIT = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  function gunOzet(gunler){
    const k = KUMELER.find(x => ESIT(x[2], gunler));
    return k ? k[1] : gunler.map(g => plan.gunler[g]).join(', ');
  }
  function gunCipleri(ad, secili){
    return '<div class="plan__gunler" role="group" aria-label="Günler">' + plan.gunler.map((g, i) => {
      const on = secili.indexOf(i) >= 0;
      return '<button type="button" class="plan__gun' + (on ? ' is-on' : '') + '" data-plan-gun="' + ad + '|' + i + '" aria-pressed="' + on + '">' + kac(g) + '</button>';
    }).join('') + '</div>';
  }
  const anahtar = (ad, acik, etiket) => '<button type="button" class="plan__anahtar' + (acik ? ' is-on' : '') + '" role="switch" aria-checked="' + acik + '" data-plan-ac="' + ad + '"'
    + ' aria-label="' + kac(etiket) + '"><i aria-hidden="true"></i></button>';
  const saatGirdi = (ad, v, etiket) => '<input type="time" class="plan__saat" data-plan-saat="' + ad + '" value="' + kac(v) + '" aria-label="' + kac(etiket || 'Saat') + '">';
  const gunSaati = (ad, g) => plan.plan[ad].acik ? plan.plan[ad].saatler[g] : null;
  function cizgi(){
    const p = plan.plan, gunler = plan.gunler.map(() => []);
    ['acilis', 'kapanis'].forEach(k => plan.gunler.forEach((x, g) => { const s = gunSaati(k, g); if(s) gunler[g].push({ saat:s, ad:k === 'acilis' ? 'Açılış' : 'Kapanış', tur:k }); }));
    plan.isler.forEach(x => { const i = p.isler[x.id]; if(i.acik) i.gunler.forEach(g => gunler[g].push({ saat:i.saat, ad:x.ad, tur:'is' })); });
    return '<ol class="plan__cizgi" aria-label="Haftalık plan">' + gunler.map((l, i) => '<li><b>' + kac(plan.gunler[i]) + '</b>'
      + l.sort((a, b) => a.saat.localeCompare(b.saat)).map(x => '<span class="plan__olay plan__olay--' + x.tur + '"><time>' + kac(x.saat) + '</time>' + kac(x.ad) + '</span>').join('')
      + '</li>').join('') + '</ol>';
  }
  function saatTablosu(){
    const UZUN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const hucre = (ad, g) => {
      const s = gunSaati(ad, g), ne = (UZUN[g] || '') + (ad === 'acilis' ? ' açılış' : ' kapanış');
      return s ? '<span class="plan__hucre is-on"><input type="time" class="plan__saat" data-plan-gunsaat="' + ad + '|' + g + '" value="' + kac(s) + '" aria-label="' + kac(ne) + ' saati">'
          + '<button type="button" class="plan__sil" data-plan-gunkapa="' + ad + '|' + g + '" aria-label="' + kac(ne) + ' kaldır">×</button></span>'
        : '<button type="button" class="plan__hucre plan__ekle" data-plan-gunac="' + ad + '|' + g + '" aria-label="' + kac(ne) + ' ekle">+</button>';
    };
    const bas = (ad, ne) => '<span class="plan__tbas">' + ne + (plan.plan[ad].acik ? '<button type="button" class="plan__hepsi" data-plan-hepsi="' + ad + ('">' + yz('ortak.ayarlar.her-gune') + '</button>') : '') + '</span>';
    return '<div class="plan__tablo" role="group" aria-label="Açılış ve kapanış saatleri"><span></span>' + bas('acilis', 'Açılış') + bas('kapanis', 'Kapanış')
      + plan.gunler.map((g, i) => '<b class="plan__tgun">' + kac(g) + '</b>' + hucre('acilis', i) + hucre('kapanis', i)).join('') + '</div>';
  }
  function planCiz(){
    const kok = planKok();
    if(!kok || !plan) return;
    const p = plan.plan;
    const bekleyen = p.bekleyen.length ? ('<div class="plan__bekleyen" role="status"><b>' + yz('ortak.ayarlar.saatinde-yapilamadi') + '</b>') + p.bekleyen.map(id => {
      const x = plan.isler.find(i => i.id === id) || { ad:id };
      return '<div class="plan__bek-satir"><span>' + kac(x.ad) + '</span><button type="button" class="btn btn--sm" data-plan-yap="' + id + ('">' + yz('ortak.ayarlar.yap') + '</button>')
        + '<button type="button" class="btn btn--sm btn--ghost" data-plan-atla="' + id + ('">' + yz('ortak.ayarlar.atla') + '</button></div>');
    }).join('') + '</div>' : '';
    const isler = plan.isler.map(x => {
      const i = p.isler[x.id], son = p.son[x.id], acik = planAcik === x.id && i.acik;
      const ozet = i.acik ? gunOzet(i.gunler) + ' · ' + i.saat + (i.kacarsa === 'onay' ? ' · kaçarsa sorar' : '') : x.not;
      return '<div class="plan__is' + (acik ? ' is-acik' : '') + '"><div class="plan__is-bas">' + anahtar('is:' + x.id, i.acik, x.ad)
        + '<div class="plan__ad">' + kac(x.ad) + '<small>' + kac(ozet) + '</small></div>'
        + (i.acik ? '<button type="button" class="plan__duzen" data-plan-duzen="' + x.id + '" aria-expanded="' + acik + '">' + (acik ? 'Kapat' : 'Düzenle') + '</button>' : '') + '</div>'
        + (acik ? '<div class="plan__ayar"><div class="plan__kumeler" role="group" aria-label="Hazır günler">'
            + KUMELER.map(k => '<button type="button" class="plan__kume' + (ESIT(k[2], i.gunler) ? ' is-on' : '') + '" data-plan-kume="' + x.id + '|' + k[0] + '">' + k[1] + '</button>').join('') + '</div>'
          + gunCipleri('is:' + x.id, i.gunler) + '<div class="plan__ayar-alt">' + saatGirdi('is:' + x.id, i.saat, x.ad + ' saati')
          + '<div class="seg plan__kacarsa" role="group" aria-label="Kaçarsa">'
          + ['hemen', 'onay'].map(k => '<button type="button" class="' + (i.kacarsa === k ? 'is-on' : '') + '" data-plan-kacarsa="' + x.id + ':' + k + '" aria-pressed="' + (i.kacarsa === k) + '">'
            + (k === 'hemen' ? yz('ortak.ayarlar.kacarsa-ilk-musait-an') : yz('ortak.ayarlar.kacarsa-sor')) + '</button>').join('') + '</div></div>'
          + (x.id === 'guncelleme' ? '<label class="plan__kur"><input type="checkbox" data-plan-kur' + (i.kur ? ' checked' : '') + ('> ' + yz('ortak.ayarlar.yenilik-varsa-kur') + '</label>') : '')
          + '</div>' : '')
        + '<div class="plan__son">' + (son && son.zaman ? '<span class="' + (son.ok ? 'is-ok' : 'is-sorun') + '">' + (son.ok ? '✓ ' : '✕ ') + kac(saatAd(son.zaman)) + ' · ' + kac(son.mesaj || '') + '</span>' : ('<span>' + yz('ortak.ayarlar.henuz-yapilmadi') + '</span>'))
        + (plan.calisan.indexOf(x.id) >= 0 ? ('<span>' + yz('ortak.ayarlar.calisiyor') + '</span>') : '<button type="button" class="plan__simdi" data-plan-yap="' + x.id + ('">' + yz('ortak.ayarlar.simdi-yap') + '</button>')) + '</div></div>';
    }).join('');
    kok.innerHTML = (plan.eski ? ('<div class="plan__bekleyen" role="status"><b>' + yz('ortak.ayarlar.lifeos-sunucusu-eski-surumle') + '</b><span>' + yz('ortak.ayarlar.guncelleme-sunucu-dosyalarin') + '</span></div>') : '')
      + bekleyen + cizgi()
      + ('<h5 class="plan__alt">' + yz('ortak.ayarlar.acilis-ve-kapanis') + '</h5>')
      + '<p class="plan__not">' + (plan.windows ? yz('ortak.ayarlar.acilisi-windows-yapar-bilgis') : yz('ortak.ayarlar.kendiliginden-acilis-yalniz')) + '</p>'
      + saatTablosu()
      + ('<h5 class="plan__alt">' + yz('ortak.ayarlar.periyodik-isler') + '</h5>') + isler
      + '<p class="plan__mesaj" role="status">' + kac(planMesaj) + '</p>';
  }
  function planKaydet(){
    if(plan.eski){ planMesaj = yz('ortak.ayarlar.kaydedilmedi-lifeos-sunucusu'); planCiz(); return; }
    clearTimeout(planZaman);
    planZaman = setTimeout(() => {
      fetch('/api/planlama', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-LifeOS':'planlama' }, body:JSON.stringify(plan.plan) })
        .then(r => r.json().then(v => ({ ok:r.ok, v })))
        .then(({ ok, v }) => { if(ok){ plan.plan = v.plan; planMesaj = v.mesaj || 'Kaydedildi.'; } else planMesaj = v.hata || 'Kaydedilemedi.'; planCiz(); })
        .catch(() => { planMesaj = yz('ortak.ayarlar.kaydedilemedi-lifeos-sunucus'); planCiz(); });
    }, 350);
  }
  function hedef(ad){ return ad.indexOf('is:') === 0 ? plan.plan.isler[ad.slice(3)] : plan.plan[ad]; }
  const VARS_SAAT = { acilis:'07:00', kapanis:'23:30' };
  function gunAyarla(ad, g, saat){
    const h = plan.plan[ad];
    if(!h.acik){ h.saatler = [null, null, null, null, null, null, null]; h.acik = true; }
    h.saatler[g] = saat;
    if(!h.saatler.some(Boolean)) h.acik = false;
  }
  function planTikla(t){
    if(!plan) return false;
    const ac = t.closest('[data-plan-ac]');
    if(ac){ const ad = ac.getAttribute('data-plan-ac'), h = hedef(ad); h.acik = !h.acik; if(!h.acik && planAcik === ad.slice(3)) planAcik = ''; planCiz(); planKaydet(); return true; }
    const dz = t.closest('[data-plan-duzen]');
    if(dz){ const id = dz.getAttribute('data-plan-duzen'); planAcik = planAcik === id ? '' : id; planCiz(); return true; }
    const g = t.closest('[data-plan-gun]');
    if(g){
      const [ad, n] = g.getAttribute('data-plan-gun').split('|'), i = Number(n), h = hedef(ad);
      if(h.gunler.indexOf(i) >= 0){ if(h.gunler.length > 1) h.gunler = h.gunler.filter(x => x !== i); }
      else h.gunler = h.gunler.concat(i).sort();
      planCiz(); planKaydet(); return true;
    }
    const km = t.closest('[data-plan-kume]');
    if(km){ const [id, k] = km.getAttribute('data-plan-kume').split('|'); plan.plan.isler[id].gunler = KUMELER.find(x => x[0] === k)[2].slice(); planCiz(); planKaydet(); return true; }
    const ga = t.closest('[data-plan-gunac], [data-plan-gunkapa]');
    if(ga){
      const acilsin = ga.hasAttribute('data-plan-gunac'), [ad, n] = ga.getAttribute(acilsin ? 'data-plan-gunac' : 'data-plan-gunkapa').split('|');
      const h = plan.plan[ad], once = h.acik ? h.saatler.filter(Boolean)[0] : null;
      gunAyarla(ad, Number(n), acilsin ? (once || VARS_SAAT[ad]) : null);
      planCiz(); planKaydet(); return true;
    }
    const hp = t.closest('[data-plan-hepsi]');
    if(hp){ const ad = hp.getAttribute('data-plan-hepsi'), h = plan.plan[ad], s = h.saatler.filter(Boolean)[0] || VARS_SAAT[ad]; h.saatler = h.saatler.map(() => s); h.acik = true; planCiz(); planKaydet(); return true; }
    const k = t.closest('[data-plan-kacarsa]');
    if(k){ const [id, v] = k.getAttribute('data-plan-kacarsa').split(':'); plan.plan.isler[id].kacarsa = v; planCiz(); planKaydet(); return true; }
    const y = t.closest('[data-plan-yap], [data-plan-atla]');
    if(y){
      const yap = y.hasAttribute('data-plan-yap'), id = y.getAttribute(yap ? 'data-plan-yap' : 'data-plan-atla');
      fetch('/api/planlama/' + (yap ? 'yap/' : 'atla/') + id, { method:'POST', headers:{ 'X-LifeOS':'planlama' } })
        .then(() => setTimeout(planYukle, yap ? 1200 : 0)).catch(() => {});
      if(yap){ plan.calisan = plan.calisan.concat(id); planCiz(); }
      return true;
    }
    return false;
  }
  function planDegisti(t){
    if(!plan) return false;
    if(t.matches('[data-plan-gunsaat]')){ const [ad, n] = t.getAttribute('data-plan-gunsaat').split('|'); if(/^\d\d:\d\d$/.test(t.value)){ gunAyarla(ad, Number(n), t.value); planCiz(); planKaydet(); } return true; }
    if(t.matches('[data-plan-saat]')){ const h = hedef(t.getAttribute('data-plan-saat')); if(/^\d\d:\d\d$/.test(t.value)){ h.saat = t.value; planCiz(); planKaydet(); } return true; }
    if(t.matches('[data-plan-kur]')){ plan.plan.isler.guncelleme.kur = t.checked; planKaydet(); return true; }
    return false;
  }

  if(typeof document !== 'undefined'){
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      if(planTikla(t)) return;
      const se = t.closest('[data-secim]');
      if(se){ const [k, v] = se.getAttribute('data-secim').split(':'); secimAyarla(k, v); return; }
      const sf = t.closest('[data-ayarlar-sifirla]');
      if(sf){
        if(sf.getAttribute('data-onay') !== '1'){ sf.setAttribute('data-onay', '1'); sf.textContent = yz('ortak.ayarlar.emin-misin-sifirla'); return; }
        SIFIRLANAN.forEach(k => { try{ localStorage.removeItem(k); }catch(e){} });
        try{ if(L.ZEMIN && L.ZEMIN.yuzeyAnahtar) localStorage.removeItem(L.ZEMIN.yuzeyAnahtar()); }catch(e){}   // Yüzey modüle özel
        yenileKaydet();
        return;
      }
      const su = t.closest('[data-sustur]');
      if(su && L.SES && L.SES.sustur){
        const v = su.getAttribute('data-sustur'), d = new Date();
        if(v === 'sabah'){ const s = new Date(d); s.setDate(d.getDate() + (d.getHours() >= 7 ? 1 : 0)); s.setHours(7, 0, 0, 0); L.SES.sustur(s.getTime()); }
        else L.SES.sustur(v === '0' ? 0 : d.getTime() + Number(v) * 60000);
        bolumYenile(su.closest('.ayarlar'), 'bildirim');
        return;
      }
      if(t.closest('[data-ayar-disa]')){ ayarDisa(); return; }
      const an = t.closest('[data-anahtar]');
      if(an){
        const k = an.getAttribute('data-anahtar'), x = SECIMLER[k];
        if(x){ const ac = secim(k) !== x.vars; secimAyarla(k, ac ? x.vars : x.sira.find(v => v !== x.vars));
          an.classList.toggle('is-on', ac); an.setAttribute('aria-checked', ac ? 'true' : 'false'); }
        return;
      }
      const sa = t.closest('[data-sessiz-ac]');
      if(sa){ sessizYaz({ acik:sa.getAttribute('aria-checked') !== 'true' }); sa.classList.toggle('is-on'); sa.setAttribute('aria-checked', String(sa.classList.contains('is-on'))); return; }
      const ts = t.closest('[data-act="set-theme"][data-theme]');
      if(ts && TEMALAR.indexOf(ts.getAttribute('data-theme')) >= 0 && !ts.hidden){   // modül de kendi işini yapar
        depoKoy(TEMA_SECIM, ts.getAttribute('data-theme'));
        /* Elle tema seçmek «Saate göre»yi kapatır: yoksa düğme işe yaramıyor gibi görünüyordu. */
        if(L.ZEMIN && L.ZEMIN.oto && L.ZEMIN.oto() === 'saat') L.ZEMIN.otoAyarla('kapali');
      }
      const al = t.closest('[data-ayar-alan]');
      if(al){ const ilk = BOLUMLER.find(b => b.grup === al.getAttribute('data-ayar-alan')); if(ilk) sekmeSec(al.closest('.ayarlar'), ilk.id); return; }
      const git = t.closest('[data-ayarlar-git]');
      if(git){ e.preventDefault(); sekmeSec(git.closest('.ayarlar'), git.getAttribute('data-ayarlar-git')); return; }
      const pg = t.closest('[data-profil-gec], [data-profil-guncelle], [data-profil-sil]');
      if(pg){
        e.preventDefault();
        if(pg.hasAttribute('data-profil-gec')){ profilMesaj = 'Geçiliyor…'; profilYenile(); profilUygula(pg.getAttribute('data-profil-gec')); return; }
        if(pg.hasAttribute('data-profil-guncelle')){ profilMesaj = profilKaydet(pg.getAttribute('data-profil-guncelle')).mesaj; profilYenile(); return; }
        if(pg.getAttribute('data-emin') !== '1'){ pg.setAttribute('data-emin', '1'); pg.textContent = yz('ortak.ayarlar.silinsin-mi'); return; }
        const ad = pg.getAttribute('data-profil-sil');
        profilMesaj = profilSil(ad) ? '«' + ad + '» silindi; şu anki ayarların değişmedi.' : '';
        profilYenile();
        return;
      }
      const sk = t.closest('[data-ayar-bolum]');
      if(sk){ sekmeSec(sk.closest('.ayarlar'), sk.getAttribute('data-ayar-bolum')); return; }
      const yzSec = t.closest('[data-yazi-sec]');
      if(yzSec){
        yaziAyarla(yzSec.getAttribute('data-yazi-sec'));
        const yad = (YAZILAR.find(y => y.id === yzSec.getAttribute('data-yazi-sec')) || {}).ad;
        document.querySelectorAll('[data-yazi-ad]').forEach(x => { x.textContent = yad || ''; });
        const g = yzSec.closest('.ayarlar__yazilar');
        if(g) g.querySelectorAll('[data-yazi-sec]').forEach(b => {
          const on = b === yzSec; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        return;
      }
      const od = t.closest('[data-odeme]');
      if(od){ odemeAyarla(od.getAttribute('data-odeme') === 'acik'); return; }
      /* Hesap merkezi istenen sayfasında açılır (hesap.js merkezAc). */
      const hs = t.closest('[data-ayarlar-hesap]');
      if(hs && L.HESAP && L.HESAP.merkezAc){
        if(L.KABUK) L.KABUK.katmanKapat();
        L.HESAP.merkezAc(hs.getAttribute('data-ayarlar-hesap') || 'kok');
      }
    });
    document.addEventListener('change', e => {
      if(!(e.target && e.target.matches)) return;
      if(e.target.matches('[data-sessiz]') && /^\d\d:\d\d$/.test(e.target.value)) sessizYaz({ [e.target.getAttribute('data-sessiz')]:e.target.value });
      else if(e.target.matches('[data-ayar-ice]') && e.target.files && e.target.files[0]){ ayarIce(e.target.files[0]); e.target.value = ''; }
      else if(e.target.matches('[data-king-ad]')){
        const v = String(e.target.value || '').replace(/[<>"]/g, '').trim().slice(0, 20);
        try{ if(v) localStorage.setItem('lifeos.king.ad', v); else localStorage.removeItem('lifeos.king.ad'); }catch(x){ /* depo kapalı */ }
      }
      else planDegisti(e.target);
    });
    document.addEventListener('submit', e => {
      const f = e.target && e.target.matches && e.target.matches('[data-profil-form]') ? e.target : null;
      if(!f) return;
      e.preventDefault();
      const i = f.querySelector('[data-profil-ad]');
      profilMesaj = profilKaydet(i ? i.value : '').mesaj;
      profilYenile();
    });
    /* Ayarlarda ara: yazınca bütün bölümler açılır, eşleşmeyen satır gizlenir. */
    document.addEventListener('input', e => {
      if(!(e.target && e.target.matches && e.target.matches('[data-ayarlar-ara]'))) return;
      ara(e.target.closest('.ayarlar'), e.target.value);
    });
    /* Sekmelerde ok tuşları (dikey liste). */
    document.addEventListener('keydown', e => {
      if(e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const sk = e.target && e.target.closest && e.target.closest('[data-ayar-bolum]');
      if(!sk) return;
      const l = Array.from(sk.parentElement.querySelectorAll('[data-ayar-bolum]'));
      const h = l[(l.indexOf(sk) + (e.key === 'ArrowDown' ? 1 : -1) + l.length) % l.length];
      e.preventDefault(); h.focus(); sekmeSec(sk.closest('.ayarlar'), h.getAttribute('data-ayar-bolum'));
    });
  }

  L.AYARLAR = Object.freeze({ html, BOLUMLER, YAZILAR, yazi, yaziAyarla, yaziYukle, HESAP_SAYFALARI, BAGLANTI_SAYFALARI, ODEME_ANAHTAR, odemeAcik, odemeAyarla,
    SECIMLER, secim, secimAyarla, SIFIRLANAN, ara, _sec:id => { secili = id; },
    ayarAnlik, ayarUygula,
    PROFIL_ANAHTAR, ETKIN_ANAHTAR, GORDU_ANAHTAR, TEMA_BEKLE, PROFIL_KAPSAR, PROFIL_EN, profiller, etkinProfil, profilKaydet, profilUygula, profilSil, profilEsitle, profilHtml });
})();
