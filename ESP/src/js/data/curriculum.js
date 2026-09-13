/* Mufredat merdiveni — sifirdan ustatliga.

   ESP'nin ilk surumu bir OLCUM sistemiydi: ne kadar calistigini sayardi.
   Olcum tek basina bir yol gostermez; "bugun 40 dakika gitar calistim"
   cumlesi kisiyi ilerletmez, yalnizca kaydeder. Merdiven bu eksigi kapatir:
   her disiplin icin ALTI kademe, her kademede OLCULEBILIR kapilar ve o
   kademede ne calisilacaginin listesi.

   Uc kural bu dosyanin tamamini yonetir:

   1. KAPI OLCULEBILIR OLMAK ZORUNDADIR. "Fransizcayi iyi anliyor" bir kapi
      degildir; "son 30 gunde 300+ aktif kart ve retansiyon >= 0.75" bir
      kapidir. Olculemeyen bir kapi, kullanicinin kendine soyledigi bir
      hikayedir — sistem hikaye tutmaz.

   2. KADEME KISIYE DEGIL URETIME VERILIR. ESP.PEDAGOGIC.level burada da
      gecerlidir: "Kalfa'sin" denmez, "son 30 gunun olculmus uretimi Kalfa
      kapilarini karsiliyor" denir. Uretim durursa kademe de durur.

   3. OLCULEMEYEN KAPI GECILMIS SAYILMAZ — AMA KALMIS DA SAYILMAZ. Veri
      yoksa kapi 'missing' durumundadir ve kullaniciya "once bunu olc"
      denir. Sifir varsaymak, sistemin en pahali hatasidir.

   Kademe adlari lonca geleneginden gelir (cirak-kalfa-usta). Sebep suslu
   degil: bu adlar bir SUREC anlatir, bir yetenek yargisi degil. "B2" ya da
   "ileri seviye" kisiyi etiketler; "kalfa" nerede durdugunu soyler. */

window.ESP = window.ESP || {};

/* Alti kademe. `rank` 0'dan baslar: hic dokunmamis bir disiplin de bir
   yerdedir — yokluk da bir konumdur ve gorunur olmalidir. */
ESP.LEVELS = [
  { rank:0, id:'temas',  label:'Temas',  short:'0',
    note:'Henüz ölçülmüş üretim yok. Sistem burada yargı kurmaz; ilk ölçümü ister.' },
  { rank:1, id:'acemi',  label:'Acemi',  short:'I',
    note:'Alet tanındı. Düzenlilik henüz yok, ama ilk ölçümler girildi.' },
  { rank:2, id:'cirak',  label:'Çırak',  short:'II',
    note:'Düzen kuruldu. Temel tekrar eder, hacim birikir, terk edilmiyor.' },
  { rank:3, id:'kalfa',  label:'Kalfa',  short:'III',
    note:'Üretim başladı. Artık yalnız tüketmiyor; kendi eserini çıkarıyor.' },
  { rank:4, id:'usta',   label:'Usta',   short:'IV',
    note:'Derinlik ve bağ. Alanın içinde kendi yargısını kurabiliyor.' },
  { rank:5, id:'ustat',  label:'Üstat',  short:'V',
    note:'Aktarım. Öğretebiliyor, özgün iş üretiyor, alanı başka alana bağlıyor.' },
];

ESP.LEVEL_BY_RANK = ESP.LEVELS.reduce(function(m, l){ m[l.rank] = l; return m; }, {});
ESP.LEVEL_BY_ID = ESP.LEVELS.reduce(function(m, l){ m[l.id] = l; return m; }, {});

/* Merdivenler.

   `gates[].metric` core/curriculum.js icindeki OLCU KAYDINDAN okunur; orada
   karsiligi olmayan bir metrik adi yazmak sessiz bir hataya degil, acik bir
   teste dusmeye yol acar (tests/curriculum.test.js her metrik adini denetler).

   `min` esiktir; `max` varsa ustune cikmak da kapiyi kapatir (ornegin yazi
   okunabilirliginde cok kisa cumle de bir sorundur).

   `study` o kademede NE calisilacagini soyler — merdivenin asil degeri
   buradadir. `proof` kademenin kapanis isidir: bir kapiyi sayiyla degil
   bitmis bir isle kapatirsin. */
ESP.LADDERS = {

  /* ------------------------------------------------------------------ dil */
  lang:{
    disc:'lang', coach:'polyglot',
    aim:'Anlamaktan üretmeye, üretmekten düşünmeye.',
    /* Kapıların GÖREMEDİĞİ şeyler. Bu liste süs değil: ölçülen şeyin
       önemli, ölçülmeyenin önemsiz sanılması, ölçen her sistemin en
       pahalı hatasıdır. Merdiven bir yeterlilik belgesi değil, bir
       ÇALIŞMA DÜZENİDİR — sınırı burada yazılıdır. */
    blind:[
      'Aksanın bir anadili konuşanda bıraktığı izlenim',
      'Şaka, ima ve kibarlık derecesini yerinde kullanabilmek',
      'Gerçek bir konuşmada, hazırlıksız, kelime bulamadan devam edebilmek',
      'O dilde düşünüp o dilde hissetmek',
    ],
    levels:[
      { rank:1, title:'Ses ve ilk 500 kelime',
        study:['Alfabe ve ses uyumu', 'Günlük 10 yeni kart', 'Günde 10 dk shadowing',
               'Sayılar, saat, yön, temel fiiller'],
        gates:[
          { metric:'lang.cards', min:100, label:'100 kart destede' },
          { metric:'lang.days14', min:5, label:'Son 14 günün 5\'inde çalışıldı' },
        ],
        proof:'Kendini üç cümleyle tanıtan bir kayıt.' },

      { rank:2, title:'Kalıptan cümleye',
        study:['Zaman kipleri', 'Günlük 20 kart tekrarı', 'Basit diyalog üretimi',
               'Haftada bir 5 dakikalık dinleme günlüğü'],
        gates:[
          { metric:'lang.cards', min:400, label:'400 kart' },
          { metric:'lang.retention', min:0.70, label:'Retansiyon ≥ %70' },
          { metric:'lang.minutes30', min:600, label:'30 günde 600 dakika' },
        ],
        proof:'Sözlüğe bakmadan yazılmış 150 kelimelik bir metin.' },

      { rank:3, title:'i+1 üretim',
        study:['Kendi alanında okuma', 'Gölge okuma yerine ÖZET anlatma',
               'Yazılı üretimde hata günlüğü', 'Deyim ve eşdizim (collocation)'],
        gates:[
          { metric:'lang.cards', min:1200, label:'1200 kart' },
          { metric:'lang.retention', min:0.78, label:'Retansiyon ≥ %78' },
          { metric:'lang.minutes30', min:900, label:'30 günde 900 dakika' },
          { metric:'lang.streakDays', min:10, label:'10 günlük zincir' },
        ],
        proof:'Bir makaleyi hedef dilde özetleyip kendi itirazını yazmak.' },

      { rank:4, title:'Düşünce dili',
        study:['Primer metni hedef dilde okuma', 'Tartışma ve savunma',
               'Üslup farkları: gazete / akademik / konuşma'],
        gates:[
          { metric:'lang.cards', min:2500, label:'2500 kart' },
          { metric:'lang.retention', min:0.82, label:'Retansiyon ≥ %82' },
          { metric:'lang.minutes30', min:1200, label:'30 günde 1200 dakika' },
        ],
        proof:'Hedef dilde 800 kelimelik özgün bir deneme.' },

      { rank:5, title:'Aktarım',
        study:['Çeviri ve geri çeviri', 'İkinci dile geçiş', 'Başkasına öğretme'],
        gates:[
          { metric:'lang.cards', min:4000, label:'4000 kart' },
          { metric:'lang.retention', min:0.85, label:'Retansiyon ≥ %85' },
          { metric:'lang.langs', min:2, label:'İki dil aktif' },
        ],
        proof:'Bir metni çevirip geri çevirerek kayıp analizini yazmak.' },
    ],
  },

  /* -------------------------------------------------------------- felsefe */
  philo:{
    disc:'philo', coach:'socrates',
    aim:'Okumaktan argüman kurmaya, argümandan kendi konumuna.',
    blind:[
      'Bir argümanın gerçekten ikna edici olup olmadığı',
      'Kendi konumunu değiştirebilecek kadar dürüst okuyabilmek',
      'Sorunun doğru soru olup olmadığı — kapılar cevabı sayar, soruyu değil',
      'Düşüncenin hayata dokunup dokunmadığı',
    ],
    levels:[
      { rank:1, title:'Soruyu tanımak',
        study:['Felsefenin dört ana sorusu', 'Sokratik diyalog okuma',
               'Kavram sözlüğü kurma'],
        gates:[
          { metric:'philo.concepts', min:5, label:'5 kavram not edildi' },
          { metric:'philo.minutes30', min:180, label:'30 günde 180 dakika' },
        ],
        proof:'Bir kavramı kendi cümlenle tanımlamak.' },

      { rank:2, title:'İlk tez',
        study:['Öncül–sonuç ayrımı', 'Safsata kataloğu', 'Primer metin okuma'],
        gates:[
          { metric:'philo.args', min:3, label:'3 tez yazıldı' },
          { metric:'philo.primaryBooks', min:1, label:'1 primer metin' },
        ],
        proof:'Bir teze kendi itirazını yazıp cevaplamak.' },

      { rank:3, title:'İtirazla yaşamak',
        study:['Karşıt konumu en güçlü hâliyle kurma', 'Düşünce deneyleri',
               'Kavramlar arası bağ'],
        gates:[
          { metric:'philo.closedArgs', min:5, label:'5 tez kapatıldı' },
          { metric:'philo.primaryBooks', min:3, label:'3 primer metin' },
          { metric:'philo.minutes30', min:400, label:'30 günde 400 dakika' },
        ],
        proof:'Kendi tezini çürüten bir itirazı kabul edip tezi düzeltmek.' },

      { rank:4, title:'Gelenekler arası',
        study:['İki geleneği karşılaştırma', 'Tarihsel bağlam',
               'Kendi konumunu bir geleneğe yerleştirme'],
        gates:[
          { metric:'philo.closedArgs', min:12, label:'12 tez kapatıldı' },
          { metric:'philo.traditions', min:3, label:'3 gelenek okundu' },
        ],
        proof:'İki geleneği aynı soru üzerinden karşılaştıran bir metin.' },

      { rank:5, title:'Kendi sorusu',
        study:['Özgün soru üretme', 'Sistematik konum kurma', 'Yazarak savunma'],
        gates:[
          { metric:'philo.closedArgs', min:25, label:'25 tez kapatıldı' },
          { metric:'philo.traditions', min:5, label:'5 gelenek' },
        ],
        proof:'Kimsenin sormadığı bir soruyu kurup savunmak.' },
    ],
  },

  /* ----------------------------------------------------------------- müzik */
  music:{
    disc:'music', coach:'maestro',
    aim:'Temiz çalmaktan müzik yapmaya.',
    blind:[
      'Müzikal ifade: aynı notaların neden birinde canlı, ötekinde ölü olduğu',
      'Zamanlamanın insani esnekliği (rubato, nefes, gecikme)',
      'Dinleyicide bıraktığı etki',
      'Bir parçayı neden seçtiğin',
    ],
    levels:[
      { rank:1, title:'El ve ses',
        study:['Duruş ve pena tutuşu', 'Açık akorlar', 'Metronomla dörtlük vuruş'],
        gates:[
          { metric:'music.pieces', min:1, label:'1 parça/teknik kaydı' },
          { metric:'music.minutes30', min:240, label:'30 günde 240 dakika' },
        ],
        proof:'Bir akor geçişini 60 BPM\'de temiz çalmak.' },

      { rank:2, title:'Temiz tempo',
        study:['Barre akorlar', 'Pentatonik kalıp 1', 'Ritim kalıpları'],
        gates:[
          { metric:'music.cleanBpm', min:80, label:'Temiz eşik ≥ 80 BPM' },
          { metric:'music.pieces', min:3, label:'3 parça/teknik' },
          { metric:'music.minutes30', min:450, label:'30 günde 450 dakika' },
        ],
        proof:'Bir parçayı baştan sona duraksamadan çalmak.' },

      { rank:3, title:'Repertuar',
        study:['Beş pentatonik kalıp', 'Modlar', 'Kulakla akor bulma'],
        gates:[
          { metric:'music.cleanBpm', min:110, label:'Temiz eşik ≥ 110 BPM' },
          { metric:'music.pieces', min:8, label:'8 parça/teknik' },
          { metric:'music.noPlateau', min:1, label:'14+ gündür tıkanan teknik yok' },
        ],
        proof:'Üç parçalık bir seti hatasız çalmak.' },

      { rank:4, title:'Müzikalite',
        study:['Doğaçlama', 'Armoni analizi', 'Dinamik ve tını'],
        gates:[
          { metric:'music.cleanBpm', min:140, label:'Temiz eşik ≥ 140 BPM' },
          { metric:'music.pieces', min:15, label:'15 parça/teknik' },
          { metric:'music.minutes30', min:900, label:'30 günde 900 dakika' },
        ],
        proof:'Bir akor dizisi üzerine 12 ölçü doğaçlama.' },

      { rank:5, title:'Kendi sesi',
        study:['Beste', 'Düzenleme', 'Kayıt ve prodüksiyon'],
        gates:[
          { metric:'music.cleanBpm', min:160, label:'Temiz eşik ≥ 160 BPM' },
          { metric:'music.pieces', min:25, label:'25 parça/teknik' },
        ],
        proof:'Kendi bestenin kaydı.' },
    ],
  },

  /* -------------------------------------------------------------- diksiyon */
  diction:{
    disc:'diction', coach:'demosthenes',
    aim:'Anlaşılır olmaktan ikna ediciye.',
    blind:[
      'Sesin sıcaklığı ve inandırıcılığı',
      'Dinleyiciyi okuyup tempoyu oracıkta değiştirebilmek',
      'Susmanın doğru yerini bilmek',
      'Hata oranı düşükken bile sıkıcı olmak — temizlik, ilgi değildir',
    ],
    levels:[
      { rank:1, title:'Nefes',
        study:['Diyafram nefesi', 'Tekerleme (kolay grup)', 'Kendi kaydını dinleme'],
        gates:[
          { metric:'diction.recordings', min:3, label:'3 ölçülmüş kayıt' },
          { metric:'diction.minutes30', min:120, label:'30 günde 120 dakika' },
        ],
        proof:'Bir paragrafı nefesi kesilmeden okumak.' },

      { rank:2, title:'Artikülasyon',
        study:['Ünsüz netliği', 'Tekerleme (orta grup)', 'Hız değil netlik'],
        gates:[
          { metric:'diction.recordings', min:10, label:'10 kayıt' },
          { metric:'diction.errorRate', max:0.08, label:'Hata oranı ≤ %8' },
        ],
        proof:'Zor bir tekerlemeyi üç kez üst üste temiz söylemek.' },

      { rank:3, title:'Vurgu ve tempo',
        study:['Cümle vurgusu', 'Duraklama', 'WPM ölçümü ve bant'],
        gates:[
          { metric:'diction.wpm', min:120, label:'WPM ≥ 120' },
          { metric:'diction.recordings', min:25, label:'25 kayıt' },
        ],
        proof:'İki dakikalık hazırlıksız konuşma kaydı.' },

      { rank:4, title:'Hitabet',
        study:['Retorik figürler', 'Dinleyiciyle bağ', 'Soru-cevap yönetimi'],
        gates:[
          { metric:'diction.wpm', min:140, label:'WPM ≥ 140' },
          { metric:'diction.errorRate', max:0.05, label:'Hata oranı ≤ %5' },
          { metric:'diction.minutes30', min:400, label:'30 günde 400 dakika' },
        ],
        proof:'On dakikalık bir sunumun kaydı.' },

      { rank:5, title:'Sahne',
        study:['Uzun konuşma mimarisi', 'Doğaçlama cevap', 'Ses ekonomisi'],
        gates:[
          { metric:'diction.recordings', min:60, label:'60 kayıt' },
          { metric:'diction.errorRate', max:0.03, label:'Hata oranı ≤ %3' },
        ],
        proof:'Yarım saatlik bir konuşmayı notsuz vermek.' },
    ],
  },

  /* ---------------------------------------------------------------- okuma */
  reading:{
    disc:'reading', coach:'aristoteles',
    aim:'Sayfa saymaktan bağ kurmaya.',
    blind:[
      'Bir metnin seni değiştirip değiştirmediği',
      'Anlamanın derinliği — not sayısı anlamayı değil, not almayı ölçer',
      'Yanlış kitabı iyi okumak: doğru kitabı seçmek ölçülmez',
      'Yeniden okumanın kazandırdığı, ilk okumada görünmeyen şey',
    ],
    levels:[
      { rank:1, title:'Düzenli okuma',
        study:['Günde 20 dakika', 'Okurken altını çizme', 'Kaynak kaydı'],
        gates:[
          { metric:'reading.books', min:1, label:'1 kaynak kaydı' },
          { metric:'reading.minutes30', min:300, label:'30 günde 300 dakika' },
        ],
        proof:'Bir kitabı bitirip üç cümleyle özetlemek.' },

      { rank:2, title:'Atomik not',
        study:['Tek fikir = tek not', 'Kendi cümlenle yazma', 'Kavram etiketi'],
        gates:[
          { metric:'reading.notes', min:30, label:'30 atomik not' },
          { metric:'reading.books', min:3, label:'3 kaynak' },
        ],
        proof:'Bir bölümü on nota ayırmak.' },

      { rank:3, title:'Bağ',
        study:['Not–not bağı', 'Çelişen iki yazarı yan yana koyma',
               'Bağlanmamış not avı'],
        gates:[
          { metric:'reading.notes', min:100, label:'100 not' },
          { metric:'reading.linkedRatio', min:0.40, label:'Notların %40\'ı bağlı' },
        ],
        proof:'Farklı iki kitaptan iki notu gerekçeli bağlamak.' },

      { rank:4, title:'Sentopik okuma',
        study:['Tek soru, çok yazar', 'Kavram matrisi', 'Karşıtlık haritası'],
        gates:[
          { metric:'reading.syntopic', min:1.5, label:'Sentopik katsayı ≥ 1.5' },
          { metric:'reading.authors', min:8, label:'8 farklı yazar' },
          { metric:'reading.notes', min:250, label:'250 not' },
        ],
        proof:'Bir soruyu beş yazar üzerinden karşılaştıran bir harita.' },

      { rank:5, title:'Kendi kütüphanesi',
        study:['Kanon kurma', 'Okuma listesi tasarımı', 'Başkasına okuma planı'],
        gates:[
          { metric:'reading.syntopic', min:2.5, label:'Sentopik katsayı ≥ 2.5' },
          { metric:'reading.authors', min:20, label:'20 yazar' },
        ],
        proof:'Kendi kanonunu gerekçeleriyle yazmak.' },
    ],
  },

  /* ----------------------------------------------------------------- yazı */
  writing:{
    disc:'writing', coach:'montaigne',
    aim:'Yazabilmekten düşünebilmeye.',
    blind:[
      'Özgünlük: söylenenin daha önce söylenmemiş olup olmadığı',
      'Sesin kendine ait olup olmadığı',
      'Okunabilirlik puanı yüksek ama söyleyecek bir şeyi olmayan yazı',
      'Yazının doğru kişiye ulaşıp ulaşmadığı',
    ],
    levels:[
      { rank:1, title:'Sayfayı doldurmak',
        study:['Günde 200 kelime', 'Düzeltmeden yazma', 'Günlük tutma'],
        gates:[
          { metric:'writing.drafts', min:3, label:'3 taslak' },
          { metric:'writing.words30', min:1500, label:'30 günde 1500 kelime' },
        ],
        proof:'Tek oturuşta bitmiş 500 kelimelik bir metin.' },

      { rank:2, title:'Revizyon',
        study:['İkinci taslak', 'Gereksiz kelime avı', 'Cümle uzunluğu dengesi'],
        gates:[
          { metric:'writing.drafts', min:8, label:'8 taslak' },
          { metric:'writing.revisionRatio', min:1.0, label:'Taslak başına ≥ 1 revizyon' },
        ],
        proof:'Bir metni yarı uzunluğa indirip güçlendirmek.' },

      { rank:3, title:'Yapı',
        study:['Giriş–gelişme–sonuç mimarisi', 'Paragraf işlevi', 'Okunabilirlik ölçümü'],
        gates:[
          { metric:'writing.words30', min:6000, label:'30 günde 6000 kelime' },
          { metric:'writing.readability', min:45, label:'Ateşman ≥ 45' },
          { metric:'writing.drafts', min:20, label:'20 taslak' },
        ],
        proof:'Bir argümanı 1500 kelimede eksiksiz kurmak.' },

      { rank:4, title:'Üslup',
        study:['Ritim ve uzunluk değişimi', 'Somut ayrıntı', 'Kendi tekrarlarını görmek'],
        gates:[
          { metric:'writing.words30', min:12000, label:'30 günde 12000 kelime' },
          { metric:'writing.revisionRatio', min:2.0, label:'Taslak başına ≥ 2 revizyon' },
        ],
        proof:'Aynı fikri üç ayrı üslupta yazmak.' },

      { rank:5, title:'Eser',
        study:['Uzun biçim', 'Bölüm mimarisi', 'Kendi editörün olmak'],
        gates:[
          { metric:'writing.drafts', min:60, label:'60 taslak' },
          { metric:'writing.words30', min:20000, label:'30 günde 20000 kelime' },
        ],
        proof:'Bölümlü, bitirilmiş uzun bir metin.' },
    ],
  },

  /* ---------------------------------------------------------------- tarih */
  history:{
    disc:'history', coach:'herodot',
    aim:'Tarih bilmekten tarihsel düşünmeye.',
    blind:[
      'Tarihsel empati: geçmiştekilerin neden öyle davrandığını anlamak',
      'Kendi önyargını kaynakta fark edebilmek',
      'Nedenselliğin gerçekten öyle işleyip işlemediği — zincir kurmak, doğrulamak değildir',
      'Bugünü anlamakta işe yarayıp yaramadığı',
    ],
    levels:[
      { rank:1, title:'İskelet kronoloji',
        study:['Büyük dönemler ve sınırları', 'Yüzyıl mantığı',
               'On dönüm noktası ezberi'],
        gates:[
          { metric:'history.events', min:20, label:'20 olay kronolojide' },
          { metric:'history.minutes30', min:180, label:'30 günde 180 dakika' },
        ],
        proof:'Boş bir zaman şeridine on olayı doğru yerleştirmek.' },

      { rank:2, title:'Bağlam',
        study:['Aynı anda dünyanın başka yerinde ne oluyordu',
               'Neden–sonuç zinciri', 'Dönem içi süreklilik ve kırılma'],
        gates:[
          { metric:'history.events', min:60, label:'60 olay' },
          { metric:'history.eras', min:4, label:'4 dönem kapsandı' },
          { metric:'history.retention', min:0.70, label:'Tarih kartları retansiyonu ≥ %70' },
        ],
        proof:'Bir olayın üç nedenini ve iki sonucunu kaynakla yazmak.' },

      { rank:3, title:'Kaynak eleştirisi',
        study:['Birincil–ikincil ayrımı', 'Yazarın konumu ve çıkarı',
               'İç ve dış tutarlılık', 'Suskunluk kanıtı değildir'],
        gates:[
          { metric:'history.sources', min:15, label:'15 kaynak değerlendirildi' },
          { metric:'history.primaryRatio', min:0.30, label:'Kaynakların %30\'u birincil' },
          { metric:'history.causal', min:10, label:'10 nedensellik zinciri' },
        ],
        proof:'Bir birincil kaynağı eleştirip taraflılığını göstermek.' },

      { rank:4, title:'Tarih yazımı',
        study:['Tarih yazımı okulları', 'Anakronizm avı',
               'Karşı-olgusal düşünme', 'Uzun süre (longue durée)'],
        gates:[
          { metric:'history.schools', min:4, label:'4 tarih yazımı okulu' },
          { metric:'history.events', min:150, label:'150 olay' },
          { metric:'history.retention', min:0.78, label:'Retansiyon ≥ %78' },
        ],
        proof:'Aynı olayı iki okulun gözünden yazmak.' },

      { rank:5, title:'Kendi yorumu',
        study:['Özgün tez', 'Karşılaştırmalı tarih', 'Kaynak temelli anlatı'],
        gates:[
          { metric:'history.causal', min:40, label:'40 nedensellik zinciri' },
          { metric:'history.sources', min:60, label:'60 kaynak' },
          { metric:'history.primaryRatio', min:0.40, label:'Birincil oran ≥ %40' },
        ],
        proof:'Kaynaklara dayanan özgün bir tarih yazısı.' },
    ],
  },
};

/* Seviye tespit sinavi — "sifirdan" baslamayan kullanicilar icin.

   Bir merdiven yalnizca en alttan basliyorsa, on yildir gitar calan birini
   "Temas" diye karsilar ve sistem gulunc olur. Tespit sinavi kademeyi
   ATLATMAZ; yalnizca "hangi kapilari zaten gecmis olabilirsin" diye sorar
   ve cevabi TAHMIN etiketiyle isaretler. Olculmus veri geldikce tahmin
   kendiliginden yerini olcume birakir. */
ESP.PLACEMENT = {
  note:'Bu sınav bir seviye VERMEZ. Verdiği şey bir başlangıç tahminidir ve '
     + '«tahmin» etiketiyle durur. İlk ölçümler geldiğinde tahmin silinir.',
  questions:[
    { id:'years', label:'Bu alanla kaç yıldır uğraşıyorsun?',
      options:[
        { value:0, label:'Hiç' }, { value:1, label:'1 yıldan az' },
        { value:2, label:'1–3 yıl' }, { value:3, label:'3–7 yıl' },
        { value:4, label:'7 yıldan fazla' },
      ] },
    { id:'output', label:'Bu alanda başkasının gördüğü bir şey ürettin mi?',
      options:[
        { value:0, label:'Hayır' }, { value:2, label:'Birkaç kez' },
        { value:3, label:'Düzenli' }, { value:4, label:'Bununla iş yapıyorum' },
      ] },
    { id:'teach', label:'Bu alanı birine öğrettin mi?',
      options:[
        { value:0, label:'Hayır' }, { value:1, label:'Arkadaşa anlattım' },
        { value:3, label:'Düzenli ders verdim' },
      ] },
  ],
};
