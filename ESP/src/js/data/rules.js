/* Ev kurallari — sistemin bozulmaz sinirlari.

   Bu dosya ESP'nin anayasasidir. Ajanlar, ekranlar ve kural motoru buradan
   okur; hicbiri kendi basina bir siniri gevsetemez. Bir kural degisecekse
   burada degisir, tek yerde.

   Dort sinif kural vardir:

     PEDAGOGIC  ogretim siniri. Sistem sertifika vermez, yetenek yargisi kurmaz.
     GROUNDING  halusinasyon engeli. Model serbest sayi uretmez.
     PRIVACY    veri mahremiyeti. Ham ses ve tam metin disari cikmaz.
     PRECEDENCE yedi disiplin ayni anda zaman isterse sira budur.

   SPI'nin `CLINICAL` sinirinin ESP karsiligi `PEDAGOGIC`'tir: orada sistem
   hekim degildir, burada ogretmen degildir. Ikisi de ayni seyi soyler —
   sistem OLCER, yargilamaz. */

window.ESP = window.ESP || {};

/* ------------------------------------------------ Turkce kelime siniri

   JavaScript'te `\b` yalnizca [A-Za-z0-9_] uzerinden calisir. "çünkü"nun
   basindaki ç bir kelime karakteri SAYILMAZ; bu yuzden /\bçünkü\b/ hicbir
   Turkce cumlede eslesmez.

   Tehlikeli olan sey bunun SESSIZ olmasidir: desen yazilir, denetim
   kurulur, hicbir sey yakalanmaz ve sistem "temiz" der. Bir denetimin
   yanlis susmasi, denetledigi hatadan pahalidir.

   Bu yuzden siniri kendimiz yaziyoruz ve Turkce harfleri kelime karakteri
   sayiyoruz. Ayni tuzak `\w+` icin de gecerlidir: "söylediği" kelimesini
   `\w+` yalnizca "s" olarak okur. */
ESP.TR_LETTERS = 'A-Za-zÇĞİIÖŞÜçğıiöşüâîûÂÎÛ';
ESP.TR_W = ESP.TR_LETTERS + '0-9_';
ESP.TR_B = '(?<![' + ESP.TR_W + '])';    // kelime basi
ESP.TR_E = '(?![' + ESP.TR_W + '])';     // kelime sonu

/* Turkce farkinda desen kurar: trRe('çünkü|zira') → /(?<!harf)(?:çünkü|zira)(?!harf)/i */
ESP.trRe = function(inner, flags){
  return new RegExp(ESP.TR_B + '(?:' + inner + ')' + ESP.TR_E, flags || 'i');
};

ESP.PEDAGOGIC = {
  disclaimer:'ESP bir öğretmen, dilbilimci ya da müzik jürisi değildir. Buradaki '
    + 'her seviye ve skor bir «öz-değerlendirme»dir; resmî sertifika, akademik not '
    + 'ya da profesyonel yeterlilik beyanı yerine geçmez.',

  /* Sistemin asla yapmayacagi seyler. Ajan ciktisi bunlardan birini yaparsa
     ESP.Office.validate() ihlali ISARETLER ve cagiran kural motorunun
     cumlesine duser. */
  never:[
    { id:'certify', label:'Sahte sertifikasyon',
      note:'«Artık C1\'sin, sertifikaya hazırsın» denmez. Üretimin hangi bandın '
         + 'kriterlerini karşıladığı söylenir, sınav yerine geçmediği yazılır.' },
    { id:'talent', label:'Mutlak yetenek yargısı',
      note:'«Yeteneklisin / yeteneksizsin» denmez. Süreç hakkında konuşulur: '
         + 'neyin çalışıldığı, ne kadar tekrarlandığı, eğimin yönü.' },
    { id:'guarantee', label:'Sonuç garantisi',
      note:'«Bu tempoyla kesin üç ayda konsere çıkarsın» denmez. Yön ve olasılık '
         + 'söylenir, garanti verilmez.' },
    { id:'aesthetic', label:'Estetik otorite iddiası',
      note:'«Bu deneme yayımlanmaya hazır, kusursuz» denmez. Ölçülebilen şey '
         + 'söylenir: cümle uzunluğu, tekrar, bağlaç yoğunluğu.' },
  ],

  /* Seviye etiketi konusundaki tek tutum. */
  level:'Seviye etiketi (CEFR bandı, BPM eşiği, okunabilirlik indeksi) daima '
    + '«son N günün ölçülmüş üretimi şu bandın kriterlerini karşılıyor» biçiminde '
    + 'yazılır. Kişiye değil ÜRETİME verilir ve tarih aralığı hep görünür.',
};

/* ------------------------------------------------------------- dayanak

   Modelin ne yapip ne yapamayacagi. Kural motoru otoritedir: skoru
   Intellect/SRS/Acoustic uretir, karari Planner verir, model yalnizca
   cumleye cevirir.

     Intellect / SRS / Acoustic / Planner  →  brief(agentId)  →  model  →  ekran
          (skor, esik, siradaki adim)           (rapor, JSON)     (yorum)

   Model kapali olsa da sistem calisir: brifing dogrudan cumleye cevrilir
   (ESP.Office.ruleText) ve ajanlar "kural motoru" rozetiyle konusur. */
ESP.GROUNDING = {
  authority:'Sayı kural motorundan gelir. Ajan hesap yapmaz, geldiği gibi kullanır.',
  decision:'Sıradaki iş ESP.Planner.nextAction() içinden gelir. Patron kararı '
         + 'gerekçelendirir, değiştiremez.',
  sources:'Kelime ve kanon verisi data/lexicon.js ve data/canon.js, gam ve akor '
        + 'data/guitar_tabs.js, artikülasyon data/phonetics.js. Pratik süresi '
        + 'kullanıcının kendi zamanlayıcısından ya da elle girdiği dakikadan gelir.',
  noModel:'Model yoksa ofis kapanmaz; brifing doğrudan cümleye çevrilir.',

  /* Cikti denetimi — ESP.Office.validate() bu desenleri arar.

     Desenler DAR tutulur: genis bir desen dogru cumleyi de yakalar ve
     ajan susar. "Yetenek" kelimesinin gectigi her cumle yargi degildir;
     yargi olan "sende yetenek var/yok" kalibidir. */
  banned:[
    { id:'certify',
      re:ESP.trRe('(artık|resmen|kesinlikle)\\s+([abc]\\s?[12])'
        + '|sertifika(ya|sına)?\\s*(hazırsın|verebilirim|alabilirsin)'),
      why:'Sahte sertifikasyon' },
    { id:'talent',
      re:ESP.trRe('(sende|sizde)[^.!?]{0,40}yetenek[^.!?]{0,20}(var|yok)'
        + '|yeteneksizsin|yeteneklisin'),
      why:'Mutlak yetenek yargısı' },
    { id:'guarantee',
      re:ESP.trRe('(kesinlikle|garanti|mutlaka|eminim ki)[^.!?]{0,60}'
        + '(çıkarsın|olursun|başarırsın|geçersin|ulaşırsın|düzelir)'),
      why:'Sonuç garantisi' },
    { id:'aesthetic',
      re:ESP.trRe('(yayımlanmaya|yayınlanmaya|basılmaya)\\s*hazır'
        + '|kusursuz\\s*(bir)?\\s*(metin|deneme|eser|performans)|şaheser'),
      why:'Estetik otorite iddiası' },
  ],

  /* Brifingde olmayan sayi. Model bir sayi yazdiginda o sayinin brifingde
     gecmesi beklenir; gecmiyorsa "desteksiz" olarak isaretlenir.

     Kucuk sayilar (0-3) ve yuzyil/yil gibi dogal sayilar cok yanlis alarm
     uretiyordu: "iki itiraz", "1789" ya da "3 gün" bir olcum iddiasi degil
     dilin kendisidir. Esik bu yuzden var. */
  numberFloor:4,
};

/* ------------------------------------------------------------- mahremiyet */
ESP.PRIVACY = {
  storage:'Ses kayıtları, tam metin taslaklar ve kişisel notlar bu cihazda tutulur. '
        + 'Hesaba bağlı kopya açıldığında yalnızca kullanıcının kendi özel alanına yazılır.',
  training:'Hiçbir veri ticari model eğitimine gönderilmez.',
  model:'Bir dil modeli bağlandığında ajana yalnızca ÖZET brifing gider: ölçülmüş '
       + 'metrikler ve durum etiketleri. Ham ses dosyası, tam deneme metni ve '
       + 'günlük notu gönderilmez; yalnızca kullanıcının açıkça paylaştığı alıntı gider.',
  export:'Yedek dosyası şifresizdir; paylaşılan bir dizine konmaz.',
};

/* --------------------------------------------------- celiski cozum sirasi

   Yedi disiplin ayni anda zaman ister. Sinirli olan kaynak ZAMANDIR,
   dogruluk degil — bu yuzden sira "hangisi daha dogru" degil "hangisi
   beklerse digerlerini cokertir" sorusuna gore dizilir.

   Ustteki alttakini her zaman yener; bu tartisilmaz.

   Ornek: Maestro "bu hafta yeni parcaya gecmeye hazirsin" derken Polyglot
   "retansiyon %38'e dustu" diyorsa — temel disiplin yeni icerigi yener.
   Ama Maestro'nun isi bitmez: mevcut repertuarda BPM artisi onerir.
   "Hicbir sey yapma" demek degildir. */
ESP.PRECEDENCE = [
  { rank:1, id:'blocked-core', label:'Tıkanmış temel',
    note:'Retansiyon %50\'nin altına indiyse ya da bir teknik 14+ gündür ilerlemiyorsa. '
       + 'Yeni içerik, eskiyi çökertmeden eklenmez.' },
  { rank:2, id:'deadline', label:'Zamana bağlı hedef',
    note:'Yaklaşan sunum, konser ya da sınav. Dış dünyanın takvimi iç plandan önce gelir.' },
  { rank:3, id:'srs-due', label:'Vadesi geçmiş SRS kartları',
    note:'Unutma eğrisi beklemez. Geciken her gün kartı bir adım geriye atar.' },
  { rank:4, id:'synthesis', label:'Sentopik sentez',
    note:'Derinlik, hacimden sonra gelir. Okunan kitap bağlanmadıkça sermaye olmaz.' },
  { rank:5, id:'new-content', label:'Yeni içerik / repertuar genişletme',
    note:'En son — ama en son gelmesi «yok sayılır» demek değildir: temel sağlamken '
       + 'genişleme sistemin asıl amacıdır.' },
];

/* Gunluk asgari standart — kotu gunun alt siniri.
   Mukemmel gun yerine "hicbir sey yapmamak" secilmesin diye vardir. */
ESP.MINIMUM_DAY = {
  srs:'Vadesi gelen SRS kartları (kaç tane olursa)',
  read:'10 dakika primer metin',
  practice:'15 dakika tek bir disiplinde pratik',
  note:'Kötü bir gün bunu yapıp bitirdiğinde kayıp yoktur. Unutma eğrisi durur, '
     + 'zincir kopmaz, borç birikmez.',
};

/* Olcum kesinligi — bir sayinin nereden geldigini ekranda daima soyleriz.

   Dort etiket AYS ve SPI ile BIREBIR AYNIDIR ve oyle kalmalidir: HKM
   senkronu her metrik alaninin kesinlik etiketini tasimasini sart kosar,
   sozluk tutmazsa senkron hic calismaz. */
ESP.CERTAINTY = {
  measured:{ label:'ölçüldü', tone:'ok',
    note:'Zamanlayıcı, kelime sayacı ya da SRS motorunun kaydettiği ham veri.' },
  estimated:{ label:'tahmin', tone:'warn',
    note:'Kullanıcının kendi bildirdiği öznel değerlendirme. Düzeltilebilir.' },
  derived:{ label:'hesaplandı', tone:'info',
    note:'İki ölçülmüş değerden formülle üretildi.' },
  missing:{ label:'veri yok', tone:'muted',
    note:'Hiç girilmemiş. Sıfır sayılmaz.' },
};

/* ------------------------------------------------------------- disiplinler

   Yedi disiplin tek yerde tanimlidir. Ekranlar, ajanlar ve EHS hesabi
   buradan okur; bir disiplinin adi ya da agirligi degisecekse burada degisir.

   `weight` EHS'deki D_i katsayisidir: butun disiplinler esit degildir, ama
   fark KUCUK tutulur. Buyuk fark, dusuk katsayili disiplini gorunmez yapar
   ve kullanici onu birakir — oysa denge sistemin amaci. */
ESP.DISCIPLINES = [
  { id:'lang',    label:'Yabancı Dil',  short:'Dil',     weight:1.0, agent:'polyglot',
    unit:'dakika', route:'lang',
    note:'Shadowing, üretim ve aralıklı tekrar. Hacmi dakika, kalitesi retansiyon ölçer.' },
  { id:'philo',   label:'Felsefe',      short:'Felsefe', weight:1.1, agent:'socrates',
    unit:'dakika', route:'symposium',
    note:'Primer metin okuma ve argüman kurma. Tez yazılmadan okuma tamamlanmış sayılmaz.' },
  { id:'music',   label:'Müzik / Gitar', short:'Müzik',  weight:1.0, agent:'maestro',
    unit:'dakika', route:'studio',
    note:'Metronomlu teknik çalışma ve repertuar. Hacmi dakika, kalitesi temiz BPM.' },
  { id:'diction', label:'Diksiyon',     short:'Diksiyon', weight:0.9, agent:'demosthenes',
    unit:'dakika', route:'studio',
    note:'Artikülasyon, nefes ve vurgu. En kolay ertelenen disiplin; ofis bunu izler.' },
  { id:'reading', label:'Derin Okuma',  short:'Okuma',   weight:1.1, agent:'aristoteles',
    unit:'dakika', route:'library',
    note:'Atomik not ve sentopik bağ. Sayfa değil BAĞLANTI biriktirir.' },
  { id:'writing', label:'Yazı',         short:'Yazı',    weight:1.0, agent:'montaigne',
    unit:'dakika', route:'writing',
    note:'Taslak üretimi ve revizyon. Hacmi kelime, kalitesi okunabilirlik ölçer.' },
  { id:'history', label:'Tarih',        short:'Tarih',   weight:1.1, agent:'herodot',
    unit:'dakika', route:'history',
    note:'Kronoloji, nedensellik ve kaynak eleştirisi. Olay sayısı iskelet, '
       + 'zincir ve kaynak ettir.' },
];

ESP.DISCIPLINE_BY_ID = ESP.DISCIPLINES.reduce(function(m, d){ m[d.id] = d; return m; }, {});

/* ------------------------------------------------------------------ odak

   Profilin odagi. Bir disiplini "onceligim" diye isaretlemek onu EHS'de
   agirliklandirmaz — sistemin kendi olcumunu kullanicinin niyeti bozmaz.
   Yaptigi tek sey haftalik rotada esit skorlu iki is arasinda sirayi
   belirlemektir. */
ESP.FOCUS = [
  { id:'balanced', label:'Dengeli',
    note:'Altı disiplin eşit sırada. Hiçbiri ötekini beklemez.' },
  { id:'lang',     label:'Dil ağırlıklı',
    note:'Eşit skorlu iki iş çıkarsa dil önce gelir.' },
  { id:'philo',    label:'Felsefe ağırlıklı',
    note:'Eşit skorlu iki iş çıkarsa okuma ve argüman önce gelir.' },
  { id:'music',    label:'Müzik ağırlıklı',
    note:'Eşit skorlu iki iş çıkarsa enstrüman önce gelir.' },
  { id:'writing',  label:'Yazı ağırlıklı',
    note:'Eşit skorlu iki iş çıkarsa taslak önce gelir.' },
  { id:'history',  label:'Tarih ağırlıklı',
    note:'Eşit skorlu iki iş çıkarsa kronoloji ve kaynak önce gelir.' },
];

/* ----------------------------------------------------------- masa notlari

   Not bir tavsiye degil BULGUDUR. Kosul saglandiginda kendiliginden
   birakilir, kosul gectiginde kendiliginden kalkar. Kullanici silmez. */
ESP.NOTE_TYPES = [
  { id:'blocked', label:'Tıkanma', tone:'danger',
    when:'Bir teknik ya da kavram 14+ gündür ilerlemiyor.' },
  { id:'overdue', label:'Vadesi geçmiş', tone:'warn',
    when:'SRS kartı ya da sentopik not güncellemesi gecikti.' },
  { id:'win', label:'Kazanım', tone:'ok',
    when:'Yeni BPM eşiği, yeni band, seri rekoru ya da kapanan bir açık.' },
  { id:'info', label:'Bilgi', tone:'info',
    when:'Haftalık pratik dağılımı dengesiz — örneğin yalnızca müzik, hiç yazı yok.' },
];
