/* LifeOS seviye sistemi — ALTI KADEME; BEŞİ NOKTALI, ALTINCISI SONSUZ.

   ===================== BU DOSYA TEK KAYNAKTIR =====================

   Kademe adlarını, renklerini ve XP eşiklerini değiştirmek istiyorsan
   YALNIZ BURAYI değiştir, sonra:

       python3 tools/seviye.py --yay

   komutunu çalıştır. Aynı dosya AYS, SPİ ve ESP'nin içine BİREBİR
   kopyalanır. Üç uygulamada üç ayrı liste tutmak, bir gün üç ayrı
   sistemin farklı isimler söylemesi demekti.

   Dosya bilerek AD ALANSIZDIR: `window.LIFEOS` üç uygulamanın da ortak
   adıdır.

   ------------------------------------------------------------------
   ORTAK OLAN TANIM, DEFTER DEĞİL

   AYS'nin, SPİ'nin ve ESP'nin HER BİRİNİN KENDİ SEVİYESİ VARDIR. Bu
   dosya yalnız «Altın nedir» sorusunu cevaplar: aynı ad, aynı renk,
   aynı eşik. «Altın'a kim ulaştı» sorusunu her sistem kendi deposunda,
   kendi işleriyle cevaplar — ESP'de gitar çalarak, SPİ'de antrenman
   yaparak, AYS'de soru çözerek.

   Puanlar KARIŞMAZ: motor (`core/xp.js`) yalnız kendi sisteminin
   etkinliklerini işler, yabancı bir etkinlik gelirse yazmaz.

   Bir sistemin İÇİNDEKİ alt modüller (ESP'de dil/felsefe/müzik,
   SPİ'de uyku/besin/hareket) ayrı seviye TUTMAZ: hepsi o sistemin tek
   seviyesini besler. Yedi ayrı seviye çubuğu, hiçbirinin anlamı
   olmaması demekti.

   ------------------------------------------------------------------
   İKİ KAVRAM, KARIŞTIRILMAMALI

     KADEME    1..6 — büyük eşik. Rengi, adı, sahnesi olan şey budur
               (Bronz, Gümüş, Altın, Yakut, Safir, Kutsal).
     BASAMAK   kademenin içindeki adım. Beş kademede ÜÇ tane ve noktayla
               yazılır: 1.1, 1.2, 1.3. Her basamağın kendi RÜTBE KARTI
               vardır ve kart, o basamağa geçildiğinde gösterilir.

   ------------------------------------------------------------------
   KUTSAL'DA NOKTA YOKTUR

   Altıncı kademe bir varış değil bir devamdır; sahnesinde yazdığı gibi:
   «daima daha yükseğe». Bu yüzden basamakları 6.1/6.2/6.3 diye değil
   K100, K200, … K1000 diye adlanır ve her biri bir öncekinin yaklaşık
   iki katı kadar emek ister.

   K1000 BİLEREK ULAŞILAMAZ. Ölçüldü: bir sistemin günlük tavanı ~430
   XP; K1000'in kümülatif eşiği 6 863 500 XP eder. Yani HER GÜN, HİÇ
   ATLAMADAN, katalogdaki her işi tavanına kadar yapan biri için bile
   kırk üç yıl. Gerçekçi bir tempoda (günde ~250 XP) yetmiş beş yıl.

   Bu bir hata değil TASARIM: tepesi görünen bir merdiven, tepesine
   varıldığı gün biten bir merdivendir. K500'ü görmek bile olağanüstü
   bir şeydir ve o hissi ancak üstünde hâlâ bir şey varsa verir.

   ESP'nin kendi `ESP.LEVELS` merdiveni (Acemi → Üstat) BAŞKA bir
   şeydir ve bununla birleştirilmez: o bir disiplinin ölçülmüş üretimi,
   bu ise günlük emeğin toplamıdır.

   ------------------------------------------------------------------
   XP NE DEĞİLDİR

   Bu deponun doktrini metrik oyununa (Goodhart) karşı açıkça uyarır ve
   XP tam olarak o riski taşır. Sınır şudur ve koda da yazılıdır:

     · XP HİÇBİR KARARI VERMEZ. Plan, reçete, uyarı, teşhis — hiçbiri
       XP'ye bakmaz. XP yalnızca GÖRÜNÜRLÜKTÜR.
     · XP GERİYE DÖNÜK YAZILMAZ. Kazanılan gün, kazanıldığı gündür.
     · HER ETKİNLİĞİN GÜNLÜK TAVANI VARDIR. Tavansız bir sayaç,
       bir gün otuz kez tıklanır ve anlamını kaybeder. `tavan:null`
       «tavan yok» DEĞİL «günde bir kez» demektir (bkz. core/xp.js,
       gunlukTavan).
     · GERİYE DÖNÜK PUAN TOPLANMAZ. Bir haftadan eski güne ve
       geleceğe yazılmaz.
     · SİLİNEN VERİ XP'Yİ GERİ ALIR. Kaydı silip puanı tutmak, sistemin
       kendi sözünü tutmaması olurdu.

   ------------------------------------------------------------------ */

window.LIFEOS = window.LIFEOS || {};

/* Şema sürümü: eşikler ya da basamak sayısı değişirse artar. Depodaki
   defter bu numarayı taşır; eski defterin yeni eşiklerle yeniden
   okunması (yani seviyenin sessizce düşmesi) böyle yakalanır. */
/* 2 → 3: beşinci kademe Hüküm iken Safir oldu ve Kutsal üç basamaktan
   on K basamağına çıktı. Defterin BİÇİMİ değişmedi; bu yüzden gün
   kırılımı korunur (bkz. core/xp.js, BICIM_SURUM). */
LIFEOS.SEVIYE_SURUM = 4;

/* NOKTALI kademelerde (1–5) kaç basamak var. Kutsal bu sayıya UYMAZ:
   kendi `etiketler` listesi kadar basamağı vardır. Motor zaten hiçbir
   yerde sabit bir basamak sayısı varsaymaz — merdiveni katalogdan
   türetir (`LIFEOS.BASAMAKLAR`). */
LIFEOS.BASAMAK_SAYISI = 3;

/* ======================= KADEMELER =======================

   ad       ekranda görünen isim — DEĞİŞTİRİLEBİLİR, tek satır.
   slogan   kademe bannerının altındaki cümle.
   renk     rozetin ve ilerleme çubuğunun rengi (koyu zemin üstünde).
   isik     rozetin parıltısı; renkten daha açık bir tonu.
   basamak  o kademedeki ÜÇ basamağın her birini bitiren XP miktarı.

   Adı değiştirmek yalnız `ad` alanını değiştirmektir; `no` sabit kalır.
   Kademeye HER YERDE numarasıyla bakılır (`KADEME_ILE(no)`) ve rozet
   ile video dosyaları da numarayla adlanır (`kademe-4.mp4`), bu yüzden
   ad değişimi hiçbir dosyayı ve hiçbir kaydı sahipsiz bırakmaz.

   DEĞİŞMEMESİ GEREKEN şey `LIFEOS.XP_ETKINLIK` içindeki `id`'lerdir:
   defterde yazılı olan odur. */
/* ======================= ZORLUK EĞRİSİ =======================

   Depo sahibinin tarifi, kelimesi kelimesine: «bronz çok kolay, gümüş
   gene kolay, altın orta seviye, yakut zor, safir çok zor, kutsal çok
   nadir». Eşikler buna göre ÖLÇÜLDÜ, uydurulmadı — günde ~250 XP'lik
   gerçekçi bir tempoda:

     Bronz    800 XP        3 gün      çok kolay
     Gümüş  4 000 XP       16 gün      kolay
     Altın 16 000 XP      2,1 ay       orta
     Yakut 55 000 XP      7,2 ay       zor
     Safir 200 000 XP     2,2 yıl      çok zor
     Kutsal 300 000 XP    3,3 yıl      çok nadir  (K merdiveni açılır)

   Önceki eğri DÜZDÜ ve tarifi karşılamıyordu: Safir'e 4,5 ayda,
   Kutsal'a 6 ayda geliniyordu — «çok zor» ve «çok nadir» bunlar
   değildi. Artık her kademe bir öncekinin yaklaşık üç katı emek
   istiyor; fark kademeler arasında hissediliyor, basamaklar arasında
   değil (basamak bir gün-hafta işi olmalı, yoksa ilerleme durur).

   K MERDİVENİ KUTSAL'DAN SONRA. K100 Kutsal'a girişin kendisidir;
   K200'den itibaren merdiven Kutsal'ın İÇİNDE devam eder. K1000 bir
   ömürde ulaşılamaz ve bunu bir test koruyor: günlük tavanın tamamını
   HER GÜN alan biri bile 210 yıl sürer.

   Eşik değişimi gün kırılımını SİLMEZ: `xp.js` biçim değişimi ile eşik
   değişimini ayırır (`BICIM_SURUM`), yalnız yeniden türetme yapar. */
LIFEOS.KADEMELER = [
  { no:1, id:'bronz',  ad:'Bronz',      slogan:'Temeli oluştur',
    renk:'#B87333', isik:'#E9A86A', basamak:[  150,   250,   400 ] },

  { no:2, id:'gumus',  ad:'Gümüş',      slogan:'Disiplini inşa et',
    renk:'#C9CDD3', isik:'#F2F5F8', basamak:[  700,  1000,  1500 ] },

  { no:3, id:'altin',  ad:'Altın',      slogan:'Potansiyelini açığa çıkar',
    renk:'#E3B341', isik:'#FFDC8A', basamak:[ 3000,  4000,  5000 ] },

  { no:4, id:'yakut',  ad:'Yakut',      slogan:'Sınırlarını aş',
    renk:'#B31432', isik:'#FF6B7E', basamak:[ 9000, 13000, 17000 ] },

  /* Beşinci kademe önce «Nebula», sonra «Hüküm»dü; şimdi SAFİR. Ad
     rütbe kartlarıyla birlikte değişti — kartın üstünde yazan ne ise
     burada da o yazar, yoksa ekranla dosya iki ayrı şey söyler. Renk
     de kartın kendi mavisinden alındı. */
  { no:5, id:'safir',  ad:'Safir',      slogan:'Ustalığı berraklaştır',
    renk:'#1E3FA8', isik:'#7FB0FF', basamak:[30000, 45000, 70000 ] },

  /* KUTSAL — noktasız ve sonsuz. Basamak adları `etiketler` listesinden
     okunur; o liste varsa «no.sıra» biçimi hiç üretilmez.

     Maliyetler kabaca 1,85 katlanarak artar ve bu keyfi değil ÖLÇÜLMÜŞ
     bir seçimdir. Kümülatif eşikler (Safir 5.3 = 34 500 XP üstüne):

       K100      46 500      ~6 ay      (günde ~250 XP ile)
       K200      68 500      ~9 ay
       K300     108 500      ~1,2 yıl
       K400     183 500      ~2 yıl
       K500     323 500      ~3,5 yıl
       K600     583 500      ~6,4 yıl
       K700   1 063 500      ~11,7 yıl
       K800   1 963 500      ~21,5 yıl
       K900   3 663 500      ~40 yıl
       K1000  6 863 500      ~75 yıl   ← ulaşılmaz, bilerek

     K1000'i günlük tavanın (~430 XP) tamamını HER GÜN alan biri bile
     kırk üç yılda görebilir. Merdivenin tepesi görünmemeli: görünen
     bir tepe, varıldığı gün sistemi bitirir. */
  { no:6, id:'kutsal', ad:'Kutsal',     slogan:'Daima daha yükseğe',
    renk:'#C9A227', isik:'#FFF1C4',
    etiketler:['K100', 'K200', 'K300', 'K400', 'K500',
               'K600', 'K700', 'K800', 'K900', 'K1000'],
    basamak:[  100000,   200000,   350000,   550000,  1000000,
              1600000,  2800000,  4700000, 8000000, 13500000 ] },
];

/* ======================= ETKİNLİKLER =======================

   XP'nin geldiği yer. Her satır TEK bir gerçek işi tarif eder ve o iş
   hangi sistemde yapılıyorsa `mod` alanı onu söyler.

   id       defterde yazılı kalan kimlik — DEĞİŞMEZ.
   rota     bu iş hangi ekranda yapılır (Rütbe ekranı oraya götürür).
   nerede   o ekranın kullanıcıya görünen adı — «Günlük › Bugün».
   nasil    tek cümlede «bu puanı ne kazandırır».

   Son üçü BİLGİ ALANIDIR ve motor onlara bakmaz; Rütbe ekranı
   «nereden XP kazanırım» sorusunu onlarla cevaplar. Ekranın kendi
   listesini tutması, katalog değiştiğinde eskiyen ikinci bir liste
   demekti.
   mod      'ays' | 'spi' | 'esp' | 'hkm'
   ad       ekranda görünen cümle.
   xp       bir kez için kazanılan puan.
   tavan    aynı gün içinde bu etkinlikten kazanılabilecek EN ÇOK puan.
            `null` TAVANSIZ DEMEK DEĞİLDİR: günde BİR KEZ olabilen işi
            (gün kapanışı, beslenme günü) tarif eder ve tavanı tam
            olarak `xp` kadardır. «Sınırsız» diye okumak, tek çağrıda
            Bronz'dan Hüküm'e çıkmak demekti.
   birim    kullanıcıya «neyin başına» olduğunu söyler.

   HER SATIR TÜRETİLEBİLİR OLMALI. Bu liste bir dilek listesi değil:
   her satırın karşılığı, o sistemin kendi verisinden okunabilen bir
   SAYIDIR (`core/xpsayim.js`). Karşılığı olmayan bir satır, hiç
   kazanılamayan bir puandır ve kataloğu yalancı yapar; bir test iki
   yönü de denetler (bkz. src/tests/xp.test.js). */
LIFEOS.XP_ETKINLIK = [
  /* --- AYS: sınav --- */
  { id:'ays.soru',        mod:'ays', ad:'Soru çözümü',            xp: 2, tavan:120, birim:'soru',
    rota:'today',  nerede:'Günlük › Bugün',   nasil:'Blok sonuçlarına ve serbest soru alanına yazdığın her soru' },
  { id:'ays.deneme',      mod:'ays', ad:'Deneme tamamlama',       xp:80, tavan:160, birim:'deneme',
    rota:'exams',  nerede:'Kayıt › Deneme',   nasil:'Kaydettiğin her deneme' },
  { id:'ays.blok',        mod:'ays', ad:'Plan bloğu tamamlama',   xp:20, tavan: 80, birim:'blok',
    rota:'today',  nerede:'Günlük › Bugün',   nasil:'«Bitti» işaretlediğin her plan bloğu' },
  { id:'ays.kalibrasyon', mod:'ays', ad:'Tahmin kaydı',           xp:10, tavan: 30, birim:'tahmin',
    rota:'exams',  nerede:'Kayıt › Deneme',   nasil:'Denemeden önce yazdığın kör net tahmini' },
  { id:'ays.gun',         mod:'ays', ad:'Günü kaydetme',          xp:40, tavan:null, birim:'gün',
    rota:'today',  nerede:'Günlük › Bugün',   nasil:'O güne dair bir şey girmen yeter — günde bir kez' },

  /* --- SPİ: sağlık ---

     Buradaki her satır bir KAYIT ödüllendirir, bir SONUÇ değil. Önce
     «hedefe uyan beslenme günü» ve «uyku hedefini tutturma» vardı ve
     ikisi de yanlış taraftaydı: o sonucu kullanıcı kendi giriyor, yani
     sistem ona kendi sağlık verisini güzelleştirmesi için puan teklif
     ediyordu. SPİ'nin bütün değeri verinin dürüst olmasında; bozulursa
     geriye kalan şey, yalan söylenen bir defter. */
  { id:'spi.antrenman',   mod:'spi', ad:'Antrenman kaydı',        xp:70, tavan:140, birim:'antrenman',
    rota:'move',   nerede:'Hareket',          nasil:'Kaydettiğin her seans — kardiyo, kuvvet ya da esneklik' },
  { id:'spi.ogun',        mod:'spi', ad:'Öğün kaydı',             xp:15, tavan: 60, birim:'öğün',
    rota:'meals',  nerede:'Besin › Öğünler',  nasil:'Girdiğin her öğün' },
  { id:'spi.uyku',        mod:'spi', ad:'Uyku kaydı',             xp:30, tavan: 30, birim:'gün',
    rota:'today',  nerede:'Günlük',           nasil:'O günün uyku süresini yazman — günde bir kez' },
  { id:'spi.olcum',       mod:'spi', ad:'Ölçüm kaydı',            xp:10, tavan: 60, birim:'ölçüm',
    rota:'today',  nerede:'Günlük',           nasil:'Doldurduğun her ölçüm alanı: kilo, nabız, HRV, adım…' },
  { id:'spi.tahlil',      mod:'spi', ad:'Tahlil kaydı',           xp:40, tavan: 80, birim:'tahlil',
    rota:'labs',   nerede:'Testler',          nasil:'Girdiğin her hastane tahlili' },
  { id:'spi.gun',         mod:'spi', ad:'Günü kaydetme',          xp:40, tavan:null, birim:'gün',
    rota:'today',  nerede:'Günlük',           nasil:'Yukarıdakilerden biri yeter — günde bir kez' },

  /* --- ESP: gelişim ---

     Tek bir «pratik dakikası» satırı var ve enstrüman da ona yazılır:
     ayrıca bir «gitar pratiği» satırı olsaydı aynı dakika iki kez
     sayılırdı. */
  { id:'esp.kart',        mod:'esp', ad:'SRS kartı tekrarı',      xp: 1, tavan: 60, birim:'kart',
    rota:'lang',   nerede:'Dil › Dil Stüdyosu', nasil:'Tekrarladığın her kart' },
  { id:'esp.oturum',      mod:'esp', ad:'Pratik dakikası',        xp: 2, tavan:140, birim:'dakika',
    rota:'today',  nerede:'Günlük › Bugün',   nasil:'Girdiğin her pratik dakikası — hangi disiplin olursa olsun' },
  { id:'esp.okuma',       mod:'esp', ad:'Atomik not',             xp:15, tavan: 75, birim:'not',
    rota:'library', nerede:'Okuma › Kütüphane', nasil:'Yazdığın her atomik not' },
  { id:'esp.yazi',        mod:'esp', ad:'Yazı taslağı',           xp:35, tavan:105, birim:'taslak',
    rota:'writing', nerede:'Yazı › Yazı Laboratuvarı', nasil:'Oluşturduğun ya da üzerinden geçtiğin her taslak' },
  { id:'esp.gun',         mod:'esp', ad:'Günü kaydetme',          xp:40, tavan:null, birim:'gün',
    rota:'today',  nerede:'Günlük › Bugün',   nasil:'O güne dair bir şey girmen yeter — günde bir kez' },

  /* HKM'nin XP'si YOKTUR ve olmamalı: HKM üçünün üstünde değil
     yanındadır, kendi defteri olsa dördüncü bir seviye yarışı açardı.
     HKM üç sistemin seviyesini GÖSTERİR, kazanmaz. */
];

/* ======================= TÜRETİLMİŞ =======================

   Eşikler elle yazılmaz: yazılan iki liste birbirinden ayrışır. Her
   basamağın KÜMÜLATİF eşiği burada bir kez hesaplanır.

   esik[i] = o basamağı BİTİRMEK için gereken toplam XP.
   Son basamağın (K1000) eşiği aynı zamanda tavandır; üstünde XP birikmeye
   devam eder ama kademe durur. O tavan bilerek ulaşılamayacak kadar
   uzaktır (bkz. KUTSAL'DA NOKTA YOKTUR): görünen bir tepe, varıldığı gün
   biten bir sistemdir.

   ETİKET KATALOGDAN GELİR, ÜRETİLMEZ — kademe kendi `etiketler`
   listesini veriyorsa o kullanılır (Kutsal: K100, K200, …), vermiyorsa
   «no.sıra» biçimi üretilir (1.1, 1.2, …). Kural tek yerde durur; iki
   ayrı biçim iki ayrı yerde yazılsaydı biri diğerinden geri kalırdı. */
LIFEOS.BASAMAKLAR = (function(){
  var liste = [];
  var toplam = 0;
  LIFEOS.KADEMELER.forEach(function(k){
    k.basamak.forEach(function(xp, i){
      toplam += xp;
      liste.push({
        kademe:k.no,
        basamak:i + 1,
        etiket:(k.etiketler && k.etiketler[i]) || (k.no + '.' + (i + 1)),
        maliyet:xp,
        esik:toplam,          // bu basamağı bitiren toplam XP
      });
    });
  });
  return liste;
})();

/* Bir basamağın MEDYA ADI — ekranda yazan etiketten türer.

     '5.2'  → 'rutbe-5-2'        (kart: rutbe-5-2.webp)
     'K300' → 'rutbe-k300'

   Kural TEK SATIRDIR ve tek yerdedir: perde de, `tools/rutbe.py` de
   aynı adı bekler. İki yerde yazılsaydı, bir gün biri nokta koyar
   diğeri koymazdı ve kart sessizce görünmezdi. */
/* Rütbe kartının yerinde IDLE VİDEO oynasın mı?

   Kartlar bugün durağan görsel. İleride her rütbenin kendi kısa idle
   videosu gelecek (`rutbe-5-2.mp4`); o gün bu satır `true` olur ve
   perde önce videoyu dener, bulamazsa karta düşer.

   Neden bir liste değil de tek bayrak: «hangi rütbenin videosu var»
   sorusunu hem dosya sistemi hem de bir liste cevaplasaydı, ikisi bir
   gün ayrışırdı. Bayrak kapalıyken hiç istek yapılmaz — yani bugün
   her kutlamada bulunamayacak bir dosya istenmez. */
LIFEOS.RUTBE_VIDEO = false;

LIFEOS.MEDYA_ADI = function(etiket){
  return 'rutbe-' + String(etiket || '').toLowerCase().replace(/\./g, '-');
};

/* Bütün sistemin tepesi. Ekranda «64.500 XP'nin 1.240'ı» derken payda. */
LIFEOS.TOPLAM_XP = LIFEOS.BASAMAKLAR.length
  ? LIFEOS.BASAMAKLAR[LIFEOS.BASAMAKLAR.length - 1].esik : 0;

LIFEOS.KADEME_ILE = function(no){
  for(var i = 0; i < LIFEOS.KADEMELER.length; i++){
    if(LIFEOS.KADEMELER[i].no === no) return LIFEOS.KADEMELER[i];
  }
  return null;
};

LIFEOS.ETKINLIK_ILE = function(id){
  for(var i = 0; i < LIFEOS.XP_ETKINLIK.length; i++){
    if(LIFEOS.XP_ETKINLIK[i].id === id) return LIFEOS.XP_ETKINLIK[i];
  }
  return null;
};

/* Bir sistemin BİR GÜNDE kazanabileceği en çok XP.

   Üç sistemin bu sayısı birbirine yakın olmalı: aynı «Altın» birinde
   iki kat yavaş kazanılıyorsa, ad aynı ama anlam aynı değildir. Ölçüm
   burada durur ki dengeyi bozan bir düzenleme testten geçmesin. */
LIFEOS.GUNLUK_TAVAN = function(mod){
  var t = 0;
  LIFEOS.XP_ETKINLIK.forEach(function(e){
    if(e.mod !== mod) return;
    t += (e.tavan == null) ? e.xp : e.tavan;
  });
  return t;
};

LIFEOS.MODULLER = ['ays', 'spi', 'esp'];
