/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/seviye/xp.js içine yazılır; burası bir sonraki
   `python3 tools/seviye.py --yay` ile yeniden üretilir. */
/* XP motoru — kademe ve basamak hesabı, defter, yükselme olayı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================

   Kaynağı `brand/seviye/xp.js`; AYS/SPİ/ESP içine `python3 tools/seviye.py
   --yay` ile kopyalanır; yayarken ad alanı yer tutucusu her uygulamanın
   kendi adıyla değiştirilir (R, SP, ESP). Elle düzenlenen kopya bir
   sonraki yayında kaybolur — düzeltme kaynağa yazılır.

   Katalog (`data/kademeler.js`) NE OLDUĞUNU söyler; bu dosya NE OLDUĞUNU
   SAYAR. İkisi ayrı durur çünkü adlar ve eşikler değişecek, sayma
   biçimi değişmeyecek.

   ------------------------------------------------------------------
   DEFTER NEDEN OLAY LİSTESİ DEĞİL

   «Her kazanımı bir satır olarak yaz» en kolayıydı ve dokuz ayda on
   binlerce satır ederdi; bu depoda depo büyümesi ölçülen bir şeydir
   (core/storage.js, tools/perfcheck.js). Bunun yerine defter GÜN × ETKİNLİK
   toplamı tutar: bir günde kaç soru çözüldüğü tek sayıdır.

     gunler: { '2026-09-17': { 'ays.soru':48, 'esp.kart':30 } }

   Gün kırılımı SON YÜZ YİRMİ GÜN için saklanır; daha eskisi silinir.
   Toplam XP ayrı ve TEK YÖNLÜ bir sayaçtır: budama onu asla
   değiştirmez, yani seviye geçmiş silindi diye düşmez.

   ARŞİV BİR SAYAÇ DEĞİL, BİR ÇIKARMADIR

   «Silinen günlerin XP'sini bir sayaca ekle» ilk hâliydi ve iki yerde
   yalan söylüyordu: katalogdan bir etkinlik kalkarsa o günün puanı
   sayaca 0 olarak eklenir, toplamda ise durmaya devam ederdi. Artık
   arşiv SAKLANMIYOR, çıkarılıyor:

     arşiv = toplam − (defterde duran günlerin toplamı)

   Böylece «kırılım + arşiv = toplam» eşitliği bir testin umuduna değil,
   aritmetiğe dayanır ve katalog değişse de bozulmaz.

   ------------------------------------------------------------------
   XP KARAR VERMEZ

   Bu modülü hiçbir plan, reçete, uyarı ya da teşhis okumaz ve okumamalı.
   Kural motoru otoritedir; XP yalnızca kullanıcının kendi emeğini
   görmesidir. Bir gün bir ekran «XP'n düşük, şunu yap» derse kural
   ihlal edilmiştir. */

window.ESP = window.ESP || {};

ESP.XP = (function(){
  var U = function(){ return ESP.U; };
  var K = function(){ return window.LIFEOS; };

  /* HER SİSTEMİN KENDİ SEVİYESİ VAR.

     AYS'nin Altın'ı, ESP'nin Altın'ı ve SPİ'nin Altın'ı AYNI ŞEYİ
     İFADE EDER (aynı eşik, aynı ad, aynı renk) ama AYRI AYRI kazanılır.
     Ortak olan tanımdır, defter değil: defter her sistemin kendi
     deposunda durur ve o sistemin kendi işleriyle dolar.

     Bu satır o kuralın bekçisidir — bir ekran yanlışlıkla başka bir
     sistemin etkinliğini yazmaya kalkarsa puan işlenmez. Üç sistemin
     puanı bir gün karışırsa sebebini aramak günler alırdı. */
  var MOD = 'esp';

  var YOL = 'seviye';          /* depo anahtarı */
  var DETAY_GUN = 120;         /* gün kırılımı bu yaştan eskiyse silinir */

  /* GERİYE YAZMA PENCERESİ.

     Dünkü antrenmanı bu sabah girmek olağandır; geçen ayın gününe puan
     yazmak değildir. Pencere bir hafta: bundan eskisi ve gelecek
     REDDEDİLİR. Sınır olmasaydı XP, ölçmek yerine oynanacak bir sayı
     olurdu — ve budama penceresinden (120 gün) çok küçük olması ayrıca
     önemli: yazılabilir bir gün asla budanmış olamaz, yoksa silinmiş
     bir günün tavanı sıfırdan başlardı. */
  var GERI_GUN = 7;

  /* Bellekteki defter. `null` = henüz yüklenmedi; sıfır DEĞİL.
     Yüklenmemiş bir defteri «0 XP» diye çizmek, bu deponun en çok
     tekrarlanan kuralının (eksik veri sıfır değildir) ihlali olurdu. */
  var defter = null;
  var yukleniyor = null;       /* uçuştaki yükleme sözü — iki kez yüklenmesin */
  var dinleyiciler = [];

  function bosDefter(){
    return {
      surum:K().SEVIYE_SURUM,
      toplam:0,
      gunler:{},
      /* Arşivin XP'si SAKLANMAZ (yukarıdaki nota bakın); yalnız hangi
         aralığın silindiği bilgi olarak durur. */
      arsiv:{ ilkGun:null, sonGun:null },
      /* En son GÖRÜLEN basamak. Yükselmenin «yeni» olduğunu bilmenin tek
         yolu budur: kullanıcı uygulamayı kapatıp açsa da kutlama iki kez
         oynamaz. */
      gorulen:0,
      guncellendi:null,
    };
  }

  /* Tarih yardımcıları YYYY-AA-GG metniyle çalışır; üç uygulamanın
     `U.addDays`'i ise Date alıp Date döner. Metni metne çeviren tek
     satır burada durur: çağıranların üçünde ayrı ayrı dönüştürme
     yapması, birinde unutulması demekti (ve unutuldu). */
  function gunKaydir(gun, n){
    var d = U().parse(gun);
    if(!d || !isFinite(d.getTime())) return gun;
    return U().iso(U().addDays(d, n));
  }

  function isoMu(gun){
    return typeof gun === 'string' && U().isISO ? !!U().isISO(gun) : false;
  }

  /* Yazılabilir gün mü? ISO metni olacak, gelecekte olmayacak ve
     pencereden eski olmayacak. ISO metinleri sözlük sırasıyla tarih
     sırasındadır; karşılaştırma bu yüzden düz metin karşılaştırmasıdır. */
  function yazilabilirGun(gun){
    if(!isoMu(gun)) return false;
    var bugun = U().todayISO();
    if(gun > bugun) return false;
    return gun >= gunKaydir(bugun, -GERI_GUN);
  }

  /* ---------------------------------------------------------- hesap */

  /* Toplam XP'nin hangi basamağa denk geldiği. Saf fonksiyondur: deftere
     de depoya da dokunmaz, bu yüzden eşik matematiği onu tek başına
     sınayarak denetlenir. */
  function konum(toplam){
    var B = K().BASAMAKLAR;
    if(!B || !B.length){
      /* Katalog boş ya da bozuksa çökmek yerine «bilinmiyor» denir. */
      return { toplam:toplam || 0, bitmisBasamak:0, kademe:0, basamak:0,
        etiket:'—', kademeBilgi:null, icinde:0, gereken:0, oran:0, kalan:0,
        tamam:false, tepe:0 };
    }
    var bitmis = 0;
    for(var i = 0; i < B.length; i++){
      if(toplam >= B[i].esik) bitmis = i + 1; else break;
    }
    /* Bitmiş basamak sayısı = kaç kapı geçildi. İçinde bulunulan basamak
       bir sonrakidir; hepsi bittiyse sonuncuda durulur. */
    var icinde = Math.min(bitmis, B.length - 1);
    var d = B[icinde];
    var altEsik = icinde > 0 ? B[icinde - 1].esik : 0;
    var tamam = bitmis >= B.length;

    var kazanilan = Math.max(0, toplam - altEsik);
    var gereken = d.esik - altEsik;

    return {
      toplam:toplam,
      bitmisBasamak:bitmis,          /* 0..18 — yükselme karşılaştırması bununla yapılır */
      kademe:d.kademe,
      basamak:d.basamak,
      etiket:d.etiket,
      kademeBilgi:K().KADEME_ILE(d.kademe),
      icinde:tamam ? gereken : kazanilan,
      gereken:gereken,
      oran:tamam ? 1 : (gereken > 0 ? Math.min(1, kazanilan / gereken) : 0),
      kalan:tamam ? 0 : Math.max(0, d.esik - toplam),
      tamam:tamam,
      tepe:K().TOPLAM_XP,
    };
  }

  /* Bir basamak numarasının (1..18) hangi kademenin kaçıncı adımı olduğu. */
  function basamagin(no){
    var B = K().BASAMAKLAR;
    if(!B || no < 1 || no > B.length) return null;
    return B[no - 1];
  }

  /* ---------------------------------------------------------- tavan */

  /* Bir etkinliğin o gün kazandırdığı XP — TAVAN UYGULANMIŞ hâli.

     `tavan:null` «tavan yok» DEMEK DEĞİLDİR: günde bir kez olabilen işi
     (gün kapanışı, beslenme günü) tarif eder ve tavanı tam olarak bir
     kezdir. Bunu «sınırsız» diye okumak, `kazan(id, {adet:1000})` ile
     bir çağrıda Bronz'dan Nebula'ya çıkmak demekti. */
  function gunlukTavan(e){
    return (e.tavan == null) ? e.xp : e.tavan;
  }

  function gunXPsi(gun, id, kaynak){
    var e = K().ETKINLIK_ILE(id);
    if(!e) return 0;
    var d = kaynak || defter;
    if(!d) return 0;
    var satir = d.gunler[gun];
    var adet = (satir && satir[id]) || 0;
    return Math.min(adet * e.xp, gunlukTavan(e));
  }

  /* Bir günün toplamı — YALNIZ BU SİSTEMİN etkinlikleri.

     Yazma yolu yabancı etkinliği zaten reddediyor; okuma yolu da
     reddetmeli. Yoksa geri yüklenen bir yedek ya da elle düzenlenmiş bir
     depo, «bugün» sayısıyla toplamı aynı ekranda çelişkiye düşürürdü. */
  function gunToplami(gun, kaynak){
    var d = kaynak || defter;
    if(!d) return 0;
    var satir = d.gunler[gun];
    if(!satir) return 0;
    var t = 0;
    Object.keys(satir).forEach(function(id){
      var e = K().ETKINLIK_ILE(id);
      if(!e || e.mod !== MOD) return;
      t += gunXPsi(gun, id, d);
    });
    return t;
  }

  /* Defterde duran günlerin toplamı. Arşiv bundan ÇIKARILIR. */
  function detayToplami(kaynak){
    var d = kaynak || defter;
    if(!d) return 0;
    var t = 0;
    Object.keys(d.gunler).forEach(function(g){ t += gunToplami(g, d); });
    return t;
  }

  /* ---------------------------------------------------------- defter */

  /* YAŞA göre budama. Önce SAYIYA göreydi («en yeni 120 anahtarı tut») ve
     her gün kaydetmeyen biri için beş yıllık satır saklıyordu: yorum
     «yüz yirmi gün yaşar» diyor, kod «yüz yirmi KAYIT yaşar» yapıyordu.
     Artık pencere takvimden ölçülür. */
  function buda(d){
    var sinir = gunKaydir(U().todayISO(), -(DETAY_GUN - 1));
    Object.keys(d.gunler).forEach(function(g){
      if(g >= sinir && isoMu(g)) return;
      if(!d.arsiv.ilkGun || g < d.arsiv.ilkGun) d.arsiv.ilkGun = g;
      if(!d.arsiv.sonGun || g > d.arsiv.sonGun) d.arsiv.sonGun = g;
      delete d.gunler[g];
    });
    return d;
  }

  function normalize(ham){
    var d = bosDefter();
    if(!ham || typeof ham !== 'object') return d;
    d.toplam = Number(ham.toplam) > 0 ? Math.floor(Number(ham.toplam)) : 0;
    d.gorulen = Number(ham.gorulen) > 0 ? Math.floor(Number(ham.gorulen)) : 0;
    d.guncellendi = ham.guncellendi || null;
    if(ham.gunler && typeof ham.gunler === 'object'){
      Object.keys(ham.gunler).forEach(function(g){
        /* Tarih olmayan anahtar deftere alınmaz: sıralamaya, budamaya ve
           çizime girip hepsini sessizce bozardı. */
        if(!isoMu(g)) return;
        var satir = ham.gunler[g];
        if(!satir || typeof satir !== 'object') return;
        var temiz = {};
        Object.keys(satir).forEach(function(id){
          var n = Number(satir[id]);
          if(n > 0) temiz[id] = Math.floor(n);
        });
        if(Object.keys(temiz).length) d.gunler[g] = temiz;
      });
    }
    if(ham.arsiv && typeof ham.arsiv === 'object'){
      d.arsiv.ilkGun = ham.arsiv.ilkGun || null;
      d.arsiv.sonGun = ham.arsiv.sonGun || null;
    }
    /* Sürüm defterde SAKLANIR ama bugün bir göç yapmaz: eşikler
       değişmedikçe gerek yok. Değiştiği gün LIFEOS.SEVIYE_SURUM artar ve
       göç burada yazılır — defterin hangi eşiklerle doldurulduğunu
       bilmeden onu yeniden yorumlamak, seviyeyi sessizce oynatmak olur. */
    d.surum = Number(ham.surum) || K().SEVIYE_SURUM;
    /* Görülen basamak, defterin gerçekten olduğu yerden ileride olamaz:
       bozuk bir depo yüzünden kutlama sonsuza kadar susmasın. */
    var k = konum(d.toplam);
    if(d.gorulen > k.bitmisBasamak) d.gorulen = k.bitmisBasamak;
    return d;
  }

  /* Yükleme TEK SEFERDİR. İki ekran aynı anda `kazan` çağırırsa ikisi de
     `yukle()` tetikler, ikincisi birincinin taze defterini eziyor ve o
     çağrının puanı yok oluyordu. Uçuştaki söz paylaşılır. */
  function yukle(){
    if(yukleniyor) return yukleniyor;
    yukleniyor = (async function(){
      var ham = null;
      try{ ham = await ESP.Store.get(YOL); }catch(e){ ham = null; }
      defter = normalize(ham);
      if(ESP.S) ESP.S.seviye = durum();
      yukleniyor = null;
      return defter;
    })();
    return yukleniyor;
  }

  /* Bellekteki defteri unut — depoya DOKUNMADAN. Profil değişiminde ve
     testlerde «henüz yüklenmedi» hâline dönmenin tek yolu budur. */
  function bosalt(){
    defter = null;
    yukleniyor = null;
    if(ESP.S) ESP.S.seviye = null;
  }

  async function yaz(){
    buda(defter);
    defter.guncellendi = new Date().toISOString();
    if(ESP.S) ESP.S.seviye = durum();
    try{ await ESP.Store.set(YOL, defter); }catch(e){}
    return defter;
  }

  /* ---------------------------------------------------------- yazma */

  /* XP kazan.

       XP.kazan('esp.kart', { adet:10 })

     `adet` kaç kez olduğu (varsayılan 1), `gun` hangi güne yazılacağı
     (varsayılan bugün). Gün GELECEKTE olamaz ve bir haftadan eski
     olamaz; olursa hiçbir şey yazılmaz ve `gecersizGun` işaretlenir.

     Döner: { kazanilan, durum, yukselme }
       kazanilan  tavandan SONRA gerçekten eklenen XP (0 olabilir)
       yukselme   null ya da { kademe, basamak, etiket, yeniKademe } */
  async function kazan(id, opt){
    opt = opt || {};
    var e = K().ETKINLIK_ILE(id);
    if(!e) return { kazanilan:0, durum:durum(), yukselme:null, bilinmeyen:true };
    /* Başka bir sistemin işi burada puan olmaz — sessizce de olmaz. */
    if(e.mod !== MOD){
      console.warn('[XP] «' + id + '» ' + e.mod + ' sistemine ait; '
        + MOD + ' defterine yazılmaz.');
      return { kazanilan:0, durum:durum(), yukselme:null, yabanci:true };
    }
    if(!defter) await yukle();

    var gun = opt.gun || U().todayISO();
    if(!yazilabilirGun(gun)){
      console.warn('[XP] «' + gun + '» yazılabilir bir gün değil '
        + '(gelecek ya da ' + GERI_GUN + ' günden eski).');
      return { kazanilan:0, durum:durum(), yukselme:null, gecersizGun:true };
    }

    var adet = Number(opt.adet);
    if(!(adet > 0)) adet = 1;
    adet = Math.floor(adet);

    var oncekiGun = gunXPsi(gun, id);

    if(!defter.gunler[gun]) defter.gunler[gun] = {};
    defter.gunler[gun][id] = (defter.gunler[gun][id] || 0) + adet;

    var kazanilan = Math.max(0, gunXPsi(gun, id) - oncekiGun);

    var onceki = konum(defter.toplam);
    defter.toplam += kazanilan;
    var sonraki = konum(defter.toplam);

    var yukselme = null;
    if(sonraki.bitmisBasamak > onceki.bitmisBasamak){
      var b = basamagin(sonraki.bitmisBasamak);
      /* Bitmiş basamak numarası, kutlanacak olan basamaktır: 1.1'i bitiren
         kişi 1.1'i kazanmıştır ve artık 1.2'nin içindedir. */
      var oncekiB = basamagin(onceki.bitmisBasamak);
      yukselme = {
        kademe:b.kademe,
        basamak:b.basamak,
        etiket:b.etiket,
        kademeBilgi:K().KADEME_ILE(b.kademe),
        /* Kademe DEĞİŞTİYSE video oynar; basamak değiştiyse sessiz kalır. */
        yeniKademe:!oncekiB || oncekiB.kademe !== b.kademe,
      };
    }

    await yaz();
    if(yukselme) duyur(yukselme);
    return { kazanilan:kazanilan, durum:durum(), yukselme:yukselme };
  }

  /* Kaydı silen ekran puanı da geri alır. Kazanılmamış puan geri alınmaz:
     sonuç asla eksiye düşmez. */
  async function geriAl(id, opt){
    opt = opt || {};
    var e = K().ETKINLIK_ILE(id);
    if(!e || e.mod !== MOD) return { geriAlinan:0, durum:durum() };
    if(!defter) await yukle();

    var gun = opt.gun || U().todayISO();
    if(!isoMu(gun)) return { geriAlinan:0, durum:durum(), gecersizGun:true };

    var adet = Number(opt.adet);
    if(!(adet > 0)) adet = 1;
    adet = Math.floor(adet);

    var satir = defter.gunler[gun];
    if(!satir || !satir[id]) return { geriAlinan:0, durum:durum() };

    var onceki = gunXPsi(gun, id);
    satir[id] = Math.max(0, satir[id] - adet);
    if(!satir[id]) delete satir[id];
    if(!Object.keys(satir).length) delete defter.gunler[gun];

    var fark = Math.max(0, onceki - gunXPsi(gun, id));
    defter.toplam = Math.max(0, defter.toplam - fark);

    /* Seviye düşebilir; «görülen» basamak da düşer, yoksa geri kazanınca
       kutlama oynamazdı. */
    var k = konum(defter.toplam);
    if(defter.gorulen > k.bitmisBasamak) defter.gorulen = k.bitmisBasamak;

    await yaz();
    return { geriAlinan:fark, durum:durum() };
  }

  /* ---------------------------------------------------------- kutlama */

  /* Kutlanmamış yükselme var mı? Uygulama açılışında sorulur: kullanıcı
     dün gece son kartı çözüp uygulamayı kapattıysa kutlama kaybolmaz. */
  function bekleyenKutlama(){
    if(!defter) return null;
    var k = konum(defter.toplam);
    if(k.bitmisBasamak <= defter.gorulen) return null;
    var b = basamagin(k.bitmisBasamak);
    if(!b) return null;
    var onceki = basamagin(defter.gorulen);
    return {
      kademe:b.kademe, basamak:b.basamak, etiket:b.etiket,
      kademeBilgi:K().KADEME_ILE(b.kademe),
      yeniKademe:!onceki || onceki.kademe !== b.kademe,
    };
  }

  /* Kutlama gösterildi; bir daha gösterme. */
  async function kutlandi(){
    if(!defter) return;
    var k = konum(defter.toplam);
    if(defter.gorulen >= k.bitmisBasamak) return;
    defter.gorulen = k.bitmisBasamak;
    await yaz();
  }

  function dinle(fn){
    if(typeof fn === 'function') dinleyiciler.push(fn);
    return function(){ dinleyiciler = dinleyiciler.filter(function(x){ return x !== fn; }); };
  }

  function duyur(y){
    dinleyiciler.forEach(function(fn){
      try{ fn(y); }catch(e){ console.error('[XP dinleyici]', e); }
    });
  }

  /* ---------------------------------------------------------- okuma */

  function durum(){
    if(!defter) return null;
    var k = konum(defter.toplam);
    k.bugun = gunToplami(U().todayISO());
    k.yuklendi = true;
    return k;
  }

  /* Son N günün günlük XP'si — çizim için. Veri OLMAYAN gün 0 değil
     `null` döner; sıfır çizmek «o gün hiç çalışmadı» demektir, oysa
     «o gün kayıt yok» başka bir cümledir. */
  function sonGunler(n){
    if(!defter) return [];
    var out = [];
    var bugun = U().todayISO();
    for(var i = n - 1; i >= 0; i--){
      var g = gunKaydir(bugun, -i);
      out.push({ gun:g, xp:defter.gunler[g] ? gunToplami(g) : null });
    }
    return out;
  }

  /* Bu sistemin XP'si hangi işten geldi.

     `arsiv`, budanmış günlerin payıdır ve SAKLANMAZ — toplamdan
     çıkarılır. Bu yüzden «kırılım + arşiv = toplam» her zaman doğrudur,
     katalog değişse bile. */
  function kirilim(){
    if(!defter) return { etkinlik:{}, arsiv:0, mod:MOD };
    var out = {};
    Object.keys(defter.gunler).forEach(function(g){
      Object.keys(defter.gunler[g]).forEach(function(id){
        var e = K().ETKINLIK_ILE(id);
        if(!e || e.mod !== MOD) return;
        out[id] = (out[id] || 0) + gunXPsi(g, id);
      });
    });
    return {
      etkinlik:out,
      arsiv:Math.max(0, defter.toplam - detayToplami()),
      mod:MOD,
    };
  }

  /* Bu sistemde XP veren işlerin listesi — ekranlar «ne yaparsam puan
     alırım» sorusunu buradan cevaplar. */
  function etkinlikler(){
    return K().XP_ETKINLIK.filter(function(e){ return e.mod === MOD; });
  }

  /* Testler ve «her şeyi sil» için. */
  async function sifirla(){
    defter = bosDefter();
    yukleniyor = null;
    if(ESP.S) ESP.S.seviye = durum();
    try{ await ESP.Store.set(YOL, defter); }catch(e){}
    return defter;
  }

  /* ---------------------------------------------------------- rozet

     Ekranlara HTML METNİ döner; hangi şablon motoru kullanılırsa
     kullanılsın `raw(...)` ile yerleştirilir. Üç uygulamanın üç ayrı
     rozet çizmesi, üç ayrı rozetin bir gün ayrışması demekti.

     Defter YÜKLENMEMİŞSE boş metin döner — «0 XP» çizmek, bilinmeyeni
     sıfır saymaktır. */
  function rozetHtml(opt){
    var d = durum();
    if(!d || !d.kademeBilgi) return '';
    opt = opt || {};
    var kok = opt.kok || 'img/seviye/';
    var k = d.kademeBilgi;
    var yuzde = Math.round(d.oran * 100);

    var baslik = 'Seviye ' + d.etiket + ' — ' + (k.ad || '') + ', '
      + (d.tamam ? 'en üst basamak' : (d.icinde + '/' + d.gereken + ' XP'));

    return '<span class="seviye-rozet" style="--kademe-renk:' + kac(k.renk || '#888')
      + ';--kademe-isik:' + kac(k.isik || '#ccc')
      /* Rozet görseli CSS katmanı olarak gelir. Dosya yoksa katman hiç
         çizilmez ve altındaki kademe numarası görünür kalır — kırık
         resim simgesi de, boşluk da göstermeden. Kullanıcı görseli
         `img/seviye/kademe-N.png` olarak bıraktığı an devreye girer.

         Adres MUTLAK verilir: özel bir CSS değişkeni içindeki göreli
         url(), değişkenin kullanıldığı yere değil TANIMLANDIĞI stil
         sayfasına göre çözülüyor ve `css/img/seviye/...` diye yanlış bir
         adres çıkıyordu. */
      + ';--kademe-gorsel:url(&quot;' + kac(mutlak(kok + 'kademe-' + d.kademe + '.png')) + '&quot;)"'
      + ' title="' + kac(baslik) + '" aria-label="' + kac(baslik) + '">'
      + '<span class="seviye-rozet__mark" aria-hidden="true">'
      +   '<span>' + d.kademe + '</span></span>'
      + '<span class="seviye-rozet__metin">'
      +   '<b class="seviye-rozet__etiket">' + kac(d.etiket) + '</b>'
      +   '<span class="seviye-rozet__ad">' + kac(k.ad || '') + '</span>'
      + '</span>'
      + '<span class="seviye-rozet__cubuk" aria-hidden="true">'
      +   '<i style="width:' + yuzde + '%"></i></span>'
      + '</span>';
  }

  function kac(t){
    return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c];
    });
  }

  function mutlak(yol){
    try{ return new URL(yol, location.href).href; }
    catch(e){ return yol; }
  }

  return {
    yukle:yukle, bosalt:bosalt, sifirla:sifirla,
    kazan:kazan, geriAl:geriAl,
    durum:durum, konum:konum, basamagin:basamagin, rozetHtml:rozetHtml,
    gunToplami:gunToplami, sonGunler:sonGunler, kirilim:kirilim,
    etkinlikler:etkinlikler, gunlukTavan:gunlukTavan,
    yazilabilirGun:yazilabilirGun, gunKaydir:gunKaydir,
    bekleyenKutlama:bekleyenKutlama, kutlandi:kutlandi, dinle:dinle,
    /* Test ve teşhis için ham defter; ekranlar buna DOKUNMAZ. */
    _defter:function(){ return defter; },
    YOL:YOL, DETAY_GUN:DETAY_GUN, GERI_GUN:GERI_GUN, MOD:MOD,
  };
})();
