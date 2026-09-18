/* LifeOS seviye sistemi — ALTI KADEME, HER KADEMEDE ÜÇ BASAMAK.

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

     KADEME    1..6 — büyük eşik. Rengi, adı, rozeti ve geçiş videosu
               olan şey budur (Bronz, Gümüş, Altın, …).
     BASAMAK   her kademenin içinde üç adım: 1.1, 1.2, 1.3. Sessizdir,
               video oynatmaz; yalnız «ilerliyorsun» der.

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
LIFEOS.SEVIYE_SURUM = 1;

/* Her kademede kaç basamak var. Üçten başkasına geçilecekse tek yer
   burasıdır; motor bu sayıyı sabit varsaymaz. */
LIFEOS.BASAMAK_SAYISI = 3;

/* ======================= KADEMELER =======================

   ad       ekranda görünen isim — DEĞİŞTİRİLEBİLİR, tek satır.
   slogan   kademe bannerının altındaki cümle.
   renk     rozetin ve ilerleme çubuğunun rengi (koyu zemin üstünde).
   isik     rozetin parıltısı; renkten daha açık bir tonu.
   basamak  o kademedeki ÜÇ basamağın her birini bitiren XP miktarı.

   «Kan Kırmızı» ve «Nebula» geçici adlardır; yerlerine daha iyisi
   konacak. Aday listesi (sırayla denenebilir):

     4. kademe  →  Lal · Akik · Ateş · Köz · Yakut
     5. kademe  →  Semavi · Şafak · Kutup · Burç · Sema
     6. kademe  →  Kutsal · Arş · Nur · Zirve · Ebedî

   Adı değiştirmek yalnız `ad` alanını değiştirmektir: `id` sabit kalır,
   çünkü depodaki defter `id` ile yazılmıştır. `id` değişirse geçmiş
   kayıt sahipsiz kalır. */
LIFEOS.KADEMELER = [
  { no:1, id:'bronz',  ad:'Bronz',      slogan:'Temeli oluştur',
    renk:'#B87333', isik:'#E9A86A', basamak:[  300,   400,   500 ] },

  { no:2, id:'gumus',  ad:'Gümüş',      slogan:'Disiplini inşa et',
    renk:'#C9CDD3', isik:'#F2F5F8', basamak:[  700,   900,  1100 ] },

  { no:3, id:'altin',  ad:'Altın',      slogan:'Potansiyelini açığa çıkar',
    renk:'#E3B341', isik:'#FFDC8A', basamak:[ 1400,  1700,  2000 ] },

  { no:4, id:'lal',    ad:'Kan Kırmızı', slogan:'Sınırlarını aş',
    renk:'#C1272D', isik:'#FF6B63', basamak:[ 2500,  3000,  3500 ] },

  { no:5, id:'nebula', ad:'Nebula',     slogan:'Evreni keşfet',
    renk:'#7A5CC7', isik:'#C4A9FF', basamak:[ 4500,  5500,  6500 ] },

  { no:6, id:'kutsal', ad:'Kutsal',     slogan:'Daha yüksek bir amaca hizmet et',
    renk:'#EBD9A5', isik:'#FFF6DC', basamak:[ 8000, 10000, 12000 ] },
];

/* ======================= ETKİNLİKLER =======================

   XP'nin geldiği yer. Her satır TEK bir gerçek işi tarif eder ve o iş
   hangi sistemde yapılıyorsa `mod` alanı onu söyler.

   id       defterde yazılı kalan kimlik — DEĞİŞMEZ.
   mod      'ays' | 'spi' | 'esp' | 'hkm'
   ad       ekranda görünen cümle.
   xp       bir kez için kazanılan puan.
   tavan    aynı gün içinde bu etkinlikten kazanılabilecek EN ÇOK puan.
            `null` TAVANSIZ DEMEK DEĞİLDİR: günde BİR KEZ olabilen işi
            (gün kapanışı, beslenme günü) tarif eder ve tavanı tam
            olarak `xp` kadardır. «Sınırsız» diye okumak, tek çağrıda
            Bronz'dan Nebula'ya çıkmak demekti.
   birim    kullanıcıya «neyin başına» olduğunu söyler.

   Not: bu liste şimdilik BAĞLANMAMIŞ bir sözleşmedir. Motor hazır,
   ekranlar `XP.kazan(id)` çağırdığı gün bu satırlar çalışır. Boş bir
   katalog yazıp «altyapı kuruldu» demek, altyapının neyi taşıyacağını
   söylememek olurdu. */
LIFEOS.XP_ETKINLIK = [
  /* --- AYS: sınav --- */
  { id:'ays.soru',        mod:'ays', ad:'Soru çözümü',            xp: 2, tavan:120, birim:'soru' },
  { id:'ays.deneme',      mod:'ays', ad:'Deneme tamamlama',       xp:80, tavan:160, birim:'deneme' },
  { id:'ays.konu',        mod:'ays', ad:'Konu bitirme',           xp:40, tavan: 80, birim:'konu' },
  { id:'ays.kalibrasyon', mod:'ays', ad:'Tahmin kaydı',           xp:10, tavan: 30, birim:'tahmin' },
  { id:'ays.gun',         mod:'ays', ad:'Günün planını kapatma',  xp:25, tavan:null, birim:'gün' },

  /* --- SPİ: sağlık --- */
  { id:'spi.antrenman',   mod:'spi', ad:'Antrenman',              xp:50, tavan:100, birim:'antrenman' },
  { id:'spi.beslenme',    mod:'spi', ad:'Hedefe uyan beslenme günü', xp:40, tavan:null, birim:'gün' },
  { id:'spi.uyku',        mod:'spi', ad:'Uyku hedefini tutturma', xp:30, tavan:null, birim:'gün' },
  { id:'spi.olcum',       mod:'spi', ad:'Ölçüm kaydı',            xp: 8, tavan: 40, birim:'ölçüm' },
  { id:'spi.gun',         mod:'spi', ad:'Günü eksiksiz kaydetme', xp:25, tavan:null, birim:'gün' },

  /* --- ESP: gelişim --- */
  { id:'esp.kart',        mod:'esp', ad:'SRS kartı tekrarı',      xp: 1, tavan: 60, birim:'kart' },
  { id:'esp.gitar',       mod:'esp', ad:'Gitar pratiği',          xp: 3, tavan: 90, birim:'dakika' },
  { id:'esp.okuma',       mod:'esp', ad:'Atomik not',             xp:15, tavan: 75, birim:'not' },
  { id:'esp.yazi',        mod:'esp', ad:'Yazı taslağı',           xp:35, tavan: 70, birim:'taslak' },
  { id:'esp.oturum',      mod:'esp', ad:'Pratik oturumu',         xp: 2, tavan:120, birim:'dakika' },
  { id:'esp.gun',         mod:'esp', ad:'Günü kaydetme',          xp:25, tavan:null, birim:'gün' },

  /* --- HKM: üçünün üstü --- */
  { id:'hkm.brifing',     mod:'hkm', ad:'Günlük brifingi okuma',  xp:10, tavan:null, birim:'gün' },
];

/* ======================= TÜRETİLMİŞ =======================

   Eşikler elle yazılmaz: yazılan iki liste birbirinden ayrışır. Her
   basamağın KÜMÜLATİF eşiği burada bir kez hesaplanır.

   esik[i] = o basamağı BİTİRMEK için gereken toplam XP.
   Son basamağın (6.3) eşiği aynı zamanda tavandır; üstünde XP birikmeye
   devam eder ama kademe durur — «bitti» demek, her gün kullanılacak bir
   sistemde bir yıl sonra anlamını kaybeder. */
LIFEOS.BASAMAKLAR = (function(){
  var liste = [];
  var toplam = 0;
  LIFEOS.KADEMELER.forEach(function(k){
    k.basamak.forEach(function(xp, i){
      toplam += xp;
      liste.push({
        kademe:k.no,
        basamak:i + 1,
        etiket:k.no + '.' + (i + 1),
        maliyet:xp,
        esik:toplam,          // bu basamağı bitiren toplam XP
      });
    });
  });
  return liste;
})();

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
