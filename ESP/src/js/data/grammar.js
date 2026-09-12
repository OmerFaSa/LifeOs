/* Dilbilgisi haritası ve hata taksonomisi.

   Kelime ezberi bir dili taşımaz: dört bin kart bilen biri, koşullu cümle
   kuramıyorsa üretemez. Bu dosya kelimenin yanındaki ikinci ekseni tutar.

   İki liste var ve ikisi de bilerek KISADIR:

     TOPICS  dilbilgisi konuları, CEFR bandına bağlı. Bir dil kursunun
             müfredatı değil; «bu bandı geçmiş biri bunu üretebiliyor
             olmalı» listesi.
     ERRORS  üretim hatalarının taksonomisi. Hata günlüğü tutmanın değeri,
             hatayı ADLANDIRABILMEKTEN gelir: adı olmayan hata tekrar eder.

   Konular dilden BAĞIMSIZ tutuldu ve bu bir eksiklik değil bir karar:
   «koşul kipi» sekiz dilde de vardır, karşılığı her dilde başkadır.
   Sistem karşılığı öğretmez — hangi işlevi üretebildiğini sorar. Dilin
   kendi kurallarını öğretmeye kalkmak, ESP'nin öğretmen olmama sınırını
   (ESP.PEDAGOGIC) ilk ihlal edecek yer olurdu. */

window.ESP = window.ESP || {};

ESP.GRAMMAR_TOPICS = [
  { id:'siralama', band:'A1', label:'Sözcük sırası',
    can:'Özne, nesne ve yüklemi doğru sırayla dizebiliyorum.',
    trap:'Ana dilinin sırasını hedef dile taşımak.' },
  { id:'sayi', band:'A1', label:'Sayı ve belirlilik',
    can:'Tekil–çoğul ve belirli–belirsiz ayrımını kurabiliyorum.',
    trap:'Türkçede belirsiz tanımlık olmadığı için atlanması.' },
  { id:'simdiki', band:'A1', label:'Şimdiki ve geniş zaman',
    can:'Alışkanlık ile şu an olanı ayırabiliyorum.',
    trap:'İkisini tek kalıpla karşılamak.' },
  { id:'gecmis', band:'A2', label:'Geçmiş zamanlar',
    can:'Bitmiş eylem ile süregelen geçmişi ayırabiliyorum.',
    trap:'Görünüş (aspect) ile zamanı karıştırmak.' },
  { id:'gelecek', band:'A2', label:'Gelecek ve niyet',
    can:'Plan, tahmin ve söz vermeyi ayrı kalıplarla söyleyebiliyorum.',
    trap:'Hepsini tek gelecek kipine yıkmak.' },
  { id:'edat', band:'A2', label:'Edatlar ve durum ekleri',
    can:'Yer, yön ve zaman ilişkilerini doğru edatla kurabiliyorum.',
    trap:'Sözlükten birebir karşılık almak; edat eşleşmesi dile özgüdür.' },
  { id:'kiplik', band:'B1', label:'Kiplik (modality)',
    can:'Gereklilik, olasılık ve izni ayırt edebiliyorum.',
    trap:'«-meli» ile «-ebilir» arasındaki farkı silmek.' },
  { id:'baglac', band:'B1', label:'Bağlaçlar ve cümle bağlama',
    can:'İki cümleyi neden, karşıtlık ve koşulla bağlayabiliyorum.',
    trap:'Her şeyi «ve» ile bağlayıp anlamı düzleştirmek.' },
  { id:'yantumce', band:'B1', label:'Yan cümle',
    can:'İsim, sıfat ve zarf işlevli yan cümle kurabiliyorum.',
    trap:'Uzun cümle kurmak ile karmaşık cümle kurmayı karıştırmak.' },
  { id:'kosul', band:'B2', label:'Koşul cümleleri',
    can:'Gerçek, olası ve gerçekdışı koşulu ayrı kurabiliyorum.',
    trap:'Gerçekdışı koşulda zaman kaydırmasını atlamak.' },
  { id:'edilgen', band:'B2', label:'Edilgen ve fail gizleme',
    can:'Faili gizlemenin anlamı nasıl değiştirdiğini kullanabiliyorum.',
    trap:'Edilgeni yalnızca «resmî üslup» sanmak.' },
  { id:'dolayli', band:'B2', label:'Dolaylı anlatım',
    can:'Başkasının sözünü zaman ve kişi kaydırarak aktarabiliyorum.',
    trap:'Kaynağa mesafe koyan kiplikleri düşürmek.' },
  { id:'uslup', band:'C1', label:'Kayıt ve üslup (register)',
    can:'Resmî, günlük ve akademik kaydı bilerek değiştirebiliyorum.',
    trap:'Tek üslupta akıcı olup ötekinde tökezlemek.' },
  { id:'deyim', band:'C1', label:'Deyim ve eşdizim',
    can:'Kelimeleri birlikte kullanıldıkları öbeklerle üretebiliyorum.',
    trap:'Doğru kelimeleri yanlış eşdizimle birleştirmek.' },
  { id:'ima', band:'C2', label:'İma, ironi ve ton',
    can:'Söylenmeyeni söyletebiliyor, tonu bilerek kurabiliyorum.',
    trap:'Şaka ile hakareti ayıran ince tonu kaçırmak.' },
];

ESP.GRAMMAR_BY_BAND = (function(){
  const m = {};
  ESP.GRAMMAR_TOPICS.forEach(function(t){
    (m[t.band] = m[t.band] || []).push(t);
  });
  return m;
})();

/* Üretim hatalarının taksonomisi.

   Hata günlüğünde bir hatayı ADLANDIRMAK, onu bir daha görmenin tek yolu:
   «bir şeyler yanlıştı» tekrar eder, «edat eşleşmesi» tekrar etmez. */
ESP.PRODUCTION_ERRORS = [
  { id:'dizim', label:'Dizim', note:'Sözcük sırası ana dilin sırası oldu.' },
  { id:'eslesme', label:'Eşdizim', note:'Kelimeler doğru, birlikte kullanılmıyorlar.' },
  { id:'kip', label:'Kip/zaman', note:'Zaman ya da görünüş yanlış seçildi.' },
  { id:'edat', label:'Edat', note:'Sözlük karşılığı alındı, dilin eşleşmesi atlandı.' },
  { id:'kayit', label:'Kayıt', note:'Üslup ortama uymadı: konuşma dili resmî metne girdi.' },
  { id:'aktarim', label:'Aktarım', note:'Ana dilden birebir çeviri yapıldı.' },
  { id:'telaffuz', label:'Telaffuz', note:'Yazılışı doğru, sesi anlaşılmadı.' },
  { id:'atlama', label:'Atlama', note:'Bilinen yapıdan kaçınıldı; hata değil ama kayıp.' },
];

ESP.ERROR_BY_ID_LANG = ESP.PRODUCTION_ERRORS.reduce(function(m, e){
  m[e.id] = e; return m;
}, {});

/* Kaçınma (avoidance) en sinsi hatadır ve tek satırla anlatılır. */
ESP.AVOIDANCE_NOTE = 'Bilmediğin yapıdan kaçınmak hata üretmez — bu yüzden '
  + 'ölçüme de girmez. Hata günlüğünde «atlama» satırı bunun içindir: '
  + 'kurmadığın cümle, yapamadığın cümledir.';
