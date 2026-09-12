/* Dil referansi — YALNIZCA VERI.

   Uc sey tutar:

     1. Calisilan diller ve yazim yonleri.
     2. CEFR bantlarinin OLCULEBILIR karsiligi. Bir bandin adini kullanmak
        kolay, kriterini yazmak zordur; yazilmazsa sistem "B2'sin" demeye
        baslar ve pedagojik siniri ihlal eder. Buradaki her bant, sistemin
        gercekten olcebildigi seylerle tanimlidir: aktif kelime sayisi,
        retansiyon, uretim uzunlugu.
     3. Kart turleri ve baslangic destesi tohumu.

   Bant tanimlari resmi CEFR tanimlarinin YERINE GECMEZ; onlarin bu sistemde
   olculebilen izdusumudur. Ekranda bu cumleyle birlikte durur. */

window.ESP = window.ESP || {};

ESP.LANGS = [
  { id:'en', label:'İngilizce', native:'English' },
  { id:'de', label:'Almanca',   native:'Deutsch' },
  { id:'fr', label:'Fransızca', native:'Français' },
  { id:'es', label:'İspanyolca', native:'Español' },
  { id:'ar', label:'Arapça',    native:'العربية', rtl:true },
  { id:'ru', label:'Rusça',     native:'Русский' },
  { id:'it', label:'İtalyanca', native:'Italiano' },
  { id:'la', label:'Latince',   native:'Latina' },
];

ESP.LANG_BY_ID = ESP.LANGS.reduce(function(m, l){ m[l.id] = l; return m; }, {});

/* CEFR bantlarinin bu sistemdeki olculebilir izdusumu.

   `activeWords` aktif (uretimde kullanilmis) kart sayisi,
   `retention` o destenin retansiyon tabani.

   IKISI BIRDEN saglanmadikca bant "karsilaniyor" sayilmaz: yalnizca kelime
   sayisi bakilsaydi hicbiri hatirlanmayan 2000 kart B2 gosterirdi. */
ESP.CEFR = [
  { id:'a1', label:'A1', activeWords:300,  retention:0.70,
    can:'Tanıdık günlük ifadeleri anlar ve basit cümleler kurar.' },
  { id:'a2', label:'A2', activeWords:700,  retention:0.72,
    can:'Sık kullanılan konularda basit ve doğrudan alışverişi yürütür.' },
  { id:'b1', label:'B1', activeWords:1500, retention:0.75,
    can:'Tanıdık konularda bağlantılı metin üretir, deneyim ve planı anlatır.' },
  { id:'b2', label:'B2', activeWords:2800, retention:0.78,
    can:'Soyut konularda ayrıntılı metin üretir, kendi alanında tartışabilir.' },
  { id:'c1', label:'C1', activeWords:5000, retention:0.80,
    can:'Karmaşık metinleri anlar, dili esnek ve etkili kullanır.' },
  { id:'c2', label:'C2', activeWords:8000, retention:0.82,
    can:'Duyduğu ve okuduğu hemen her şeyi zorlanmadan işler.' },
];

/* Olculmus destenin hangi bandin kriterlerini KARSILADIGINI soyler.

   Donusteki dil kasitlidir: "B2'sin" degil "B2 bandinin kriterlerini
   karsiliyor". Bu cumle degistirilirse pedagojik sinir ihlal edilir ve
   ESP.Office.validate ciktiyi isaretler. */
ESP.cefrOf = function(activeWords, retention){
  if(activeWords == null || retention == null){
    return { band:null, cert:'missing',
      why:'Bant için hem aktif kelime sayısı hem retansiyon ölçülmüş olmalı.' };
  }
  let bulunan = null;
  ESP.CEFR.forEach(function(b){
    if(activeWords >= b.activeWords && retention >= b.retention) bulunan = b;
  });
  return {
    band:bulunan, cert:'derived',
    text:bulunan
      ? 'Ölçülen üretimin ' + bulunan.label + ' bandının kriterlerini karşılıyor '
        + '— bu bir öz-değerlendirmedir, resmî sınav yerine geçmez.'
      : 'Henüz A1 bandının ölçülebilir kriterleri karşılanmadı.',
  };
};

/* Kart turleri. Bir kartin turu, SRS'in nasil soracagini degil EKRANIN
   nasil cizecegini belirler; algoritma her turde aynidir. */
ESP.CARD_KINDS = [
  { id:'word',      label:'Kelime',   note:'Tek kelime ve karşılığı.' },
  { id:'phrase',    label:'Kalıp',    note:'Kalıp ifade; parçalara bölünmeden ezberlenir.' },
  { id:'sentence',  label:'Cümle',    note:'Bağlamıyla birlikte tam cümle.' },
  { id:'collocation', label:'Eşdizim', note:'Hangi kelimenin hangisiyle gittiği.' },
];

/* Kelime ayirma kaliplari — core/parse.js bunlari kullanir.

   Insanlar kart yazarken tek bir bicim kullanmaz; uc yaygin bicim var ve
   ucu de tanınir. Taninmayan satir ATILMAZ, "eşleşmedi" olarak isaretlenir
   ve kullanici elle baglar. */
ESP.VOCAB_SEPARATORS = [
  { id:'dash',  re:/^(.+?)\s+[–—-]\s+(.+)$/,  note:'kelime – karşılık' },
  { id:'equal', re:/^(.+?)\s*=\s*(.+)$/,      note:'kelime = karşılık' },
  { id:'colon', re:/^(.+?)\s*:\s*(.+)$/,      note:'kelime: karşılık' },
  { id:'tab',   re:/^(.+?)\t+(.+)$/,          note:'kelime<sekme>karşılık' },
];

/* Shadowing icin baslangic malzemesi. Uzun metin TUTULMAZ — telif ve
   depo boyutu. Tutulan sey kaynagin TARIFIDIR; metni kullanici getirir. */
ESP.SHADOW_SOURCES = [
  { id:'haber',    label:'Haber bülteni',  note:'Net telaffuz, orta hız. Başlangıç için en uygunu.' },
  { id:'podcast',  label:'Podcast',        note:'Doğal hız ve doğal duraklar; ikinci adım.' },
  { id:'belgesel', label:'Belgesel',       note:'Anlatıcı sesi yavaş ve tok; tonlama çalışmak için iyi.' },
  { id:'dizi',     label:'Dizi / film',    note:'En zoru: ağız, argo ve üst üste konuşma var.' },
  { id:'konusma',  label:'Konferans',      note:'Uzun cümle ve akademik sözcük; C1 üstü için.' },
];

/* Ilk desteyi bostan kurmak zordur; on kelimelik bir tohum verilir.

   Tohum "ölçüldü" DEGILDIR: kullanicinin kendi kartini yazmasi beklenir.
   Bu liste yalnizca ilk ekrani bos birakmamak icin var ve eklenirken
   acikca "tohum" diye isaretlenir. */
ESP.SEED_CARDS = {
  en:[
    { front:'nevertheless', back:'yine de, buna rağmen', kind:'word' },
    { front:'to grasp',     back:'kavramak',             kind:'word' },
    { front:'make a point', back:'bir noktaya değinmek', kind:'collocation' },
    { front:'as far as I can tell', back:'anlayabildiğim kadarıyla', kind:'phrase' },
    { front:'to take something for granted', back:'bir şeyi olağan saymak', kind:'phrase' },
  ],
  de:[
    { front:'trotzdem',     back:'yine de',              kind:'word' },
    { front:'begreifen',    back:'kavramak',             kind:'word' },
    { front:'eine Rolle spielen', back:'rol oynamak',    kind:'collocation' },
    { front:'soweit ich weiß', back:'bildiğim kadarıyla', kind:'phrase' },
    { front:'etwas für selbstverständlich halten', back:'bir şeyi olağan saymak', kind:'phrase' },
  ],
};
