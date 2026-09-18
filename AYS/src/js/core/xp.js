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

     gunler: { '2026-09-17': { 'ays.soru':[48, 96] } }
                                          adet  kazanılan XP

   DEFTER ADEDİ DEĞİL KAZANILANI YAZAR. Önce yalnız adet yazılıyor, XP
   okurken katalogdan yeniden hesaplanıyordu — yani katalogdaki bir
   fiyat değişimi GEÇMİŞİ yeniden fiyatlıyordu. Bir muhasebe defteri
   böyle çalışmaz: fiyat değişir, kaydedilmiş işlem değişmez. Artık
   kazanılan XP yazıldığı anda donar ve okurken bir daha hesaplanmaz.

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

window.R = window.R || {};

R.XP = (function(){
  var U = function(){ return R.U; };
  var K = function(){ return window.LIFEOS; };

  /* HER SİSTEMİN KENDİ SEVİYESİ VAR.

     AYS'nin Altın'ı, ESP'nin Altın'ı ve SPİ'nin Altın'ı AYNI ŞEYİ
     İFADE EDER (aynı eşik, aynı ad, aynı renk) ama AYRI AYRI kazanılır.
     Ortak olan tanımdır, defter değil: defter her sistemin kendi
     deposunda durur ve o sistemin kendi işleriyle dolar.

     Bu satır o kuralın bekçisidir — bir ekran yanlışlıkla başka bir
     sistemin etkinliğini yazmaya kalkarsa puan işlenmez. Üç sistemin
     puanı bir gün karışırsa sebebini aramak günler alırdı. */
  var MOD = 'ays';

  var YOL = 'seviye';          /* depo anahtarı */
  var DETAY_GUN = 120;         /* gün kırılımı bu yaştan eskiyse silinir */

  /* Defterin BİÇİMİ en son bu sürümde değişti. Katalogdaki şema sürümü
     (`LIFEOS.SEVIYE_SURUM`) bundan büyük olabilir — eşikler ya da
     kademe adları değiştiğinde o da artar, ama eşik değişimi defteri
     BOZMAZ. Ayrım `normalize` içindeki göç bloğunda kullanılır. */
  var BICIM_SURUM = 2;

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
      /* Uygulanmış göçlerin defteri. Bir gün «seviyem neden değişti»
         diye sorulduğunda cevap burada yazılı olsun. */
      gocler:[],
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
     bir çağrıda Bronz'dan Hüküm'e çıkmak demekti. */
  function gunlukTavan(e){
    return (e.tavan == null) ? e.xp : e.tavan;
  }

  /* O gün o işten KAZANILMIŞ XP — defterde yazılı olan. Hesaplanmaz,
     okunur: hesaplamak geçmişi bugünün fiyatıyla yeniden yazmaktı. */
  function gunXPsi(gun, id, kaynak){
    var d = kaynak || defter;
    if(!d) return 0;
    var satir = d.gunler[gun];
    var kayit = satir && satir[id];
    if(!kayit) return 0;
    return Number(kayit[1]) || 0;
  }

  function gunAdedi(gun, id, kaynak){
    var d = kaynak || defter;
    if(!d) return 0;
    var satir = d.gunler[gun];
    var kayit = satir && satir[id];
    if(!kayit) return 0;
    return Number(kayit[0]) || 0;
  }

  /* Bu kimlik BAŞKA bir sisteme mi ait? Yalnız katalogda olup modülü
     tutmayanlar yabancıdır. Katalogda HİÇ olmayan bir kimlik (bir
     zamanlar bizdeydi, sonra katalogdan kalktı) yabancı DEĞİLDİR:
     onu dışarıda bırakmak, kullanıcının geçmişte gerçekten yaptığı
     işi yok saymak olurdu. */
  function yabanciMi(id){
    var e = K().ETKINLIK_ILE(id);
    return !!e && e.mod !== MOD;
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
      if(yabanciMi(id)) return;
      t += gunXPsi(gun, id, d);
    });
    return t;
  }

  /* O günün deftere yazılmış bir kaydı var mı? «0 XP» ile «kayıt yok»
     ayrı cümlelerdir ve dışarıya (HKM işareti) doğru olanı gitmeli. */
  function gunuVar(gun, kaynak){
    var d = kaynak || defter;
    return !!(d && d.gunler[gun]);
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
    var gelenSurum = Number(ham.surum) || 1;

    if(ham.gunler && typeof ham.gunler === 'object'){
      Object.keys(ham.gunler).forEach(function(g){
        /* Tarih olmayan anahtar deftere alınmaz: sıralamaya, budamaya ve
           çizime girip hepsini sessizce bozardı. */
        if(!isoMu(g)) return;
        var satir = ham.gunler[g];
        if(!satir || typeof satir !== 'object') return;
        var temiz = {};
        Object.keys(satir).forEach(function(id){
          var kayit = satir[id];
          /* Bugünkü biçim: [adet, kazanılan XP]. */
          if(Array.isArray(kayit)){
            var adet = Math.floor(Number(kayit[0]) || 0);
            var xp = Math.floor(Number(kayit[1]) || 0);
            if(adet > 0 && xp >= 0) temiz[id] = [adet, xp];
          }
        });
        if(Object.keys(temiz).length) d.gunler[g] = temiz;
      });
    }
    if(ham.arsiv && typeof ham.arsiv === 'object'){
      d.arsiv.ilkGun = ham.arsiv.ilkGun || null;
      d.arsiv.sonGun = ham.arsiv.sonGun || null;
    }
    d.gocler = Array.isArray(ham.gocler) ? ham.gocler.slice(0, 20) : [];

    /* ---------------------------------------------------------- göç

       İKİ AYRI DEĞİŞİKLİK, İKİ AYRI SONUÇ. Şema sürümü iki sebeple
       artar ve ikisi aynı şey değildir:

         BİÇİM değişti   defterin yazılış şekli başkalaştı; eski
                         satırlar okunamaz, arşive düşer.
         EŞİK değişti    kademe adları ya da XP eşikleri başkalaştı;
                         defter aynen okunur, yalnız seviye yeniden
                         TÜRETİLİR.

       Bu ayrım pahalıya öğrenildi: ikisi tek koşula bağlıyken, «beşinci
       kademenin adı Safir oldu» gibi bir katalog düzenlemesi
       kullanıcının yüz yirmi günlük kırılımını siliyordu. Kaybedilen
       şey bir puan değildi ama bir sebep de yoktu.

       SÜRÜM 1 → 2 BİÇİM değişimiydi: gün kırılımı `{id: adet}` idi ve
       XP okunurken katalogdan hesaplanıyordu; yeni biçim `{id: [adet,
       xp]}`. Eski kırılım taşınamazdı, çünkü onu çevirmenin tek yolu
       bugünün fiyatlarıyla yeniden fiyatlamaktı ve fiyatlar değişmişti.

       SÜRÜM 2 → 3 EŞİK değişimidir: Hüküm → Safir, ve Kutsal üç
       basamaktan on K basamağına çıktı. Defter olduğu gibi kalır.

       Toplam XP'ye hiçbir durumda dokunulmaz. */
    if(gelenSurum < BICIM_SURUM){
      var atilan = Object.keys(d.gunler);
      if(atilan.length){
        atilan.sort();
        d.arsiv.ilkGun = d.arsiv.ilkGun && d.arsiv.ilkGun < atilan[0]
          ? d.arsiv.ilkGun : atilan[0];
        d.arsiv.sonGun = d.arsiv.sonGun && d.arsiv.sonGun > atilan[atilan.length - 1]
          ? d.arsiv.sonGun : atilan[atilan.length - 1];
      }
      d.gunler = {};
      d.gocler.push({
        from:gelenSurum, to:K().SEVIYE_SURUM,
        at:new Date().toISOString(),
        not:'gün kırılımı arşive alındı; toplam XP korundu',
        gun:atilan.length,
      });
    }else if(gelenSurum < K().SEVIYE_SURUM){
      d.gocler.push({
        from:gelenSurum, to:K().SEVIYE_SURUM,
        at:new Date().toISOString(),
        not:'eşikler değişti; defter korundu, seviye yeniden türetildi',
        gun:0,
      });
    }
    d.surum = K().SEVIYE_SURUM;
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
      try{ ham = await R.Store.get(YOL); }catch(e){ ham = null; }
      defter = normalize(ham);
      if(R.S) R.S.seviye = durum();
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
    if(R.S) R.S.seviye = null;
  }

  async function yaz(){
    buda(defter);
    defter.guncellendi = new Date().toISOString();
    if(R.S) R.S.seviye = durum();
    try{ await R.Store.set(YOL, defter); }catch(e){}
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

    var oncekiAdet = gunAdedi(gun, id);
    var oncekiXP = gunXPsi(gun, id);
    var yeniAdet = oncekiAdet + adet;
    /* Tavan YAZARKEN uygulanır; okurken bir daha hesaplanmaz. */
    var yeniXP = Math.min(yeniAdet * e.xp, gunlukTavan(e));
    /* Fiyat düştüyse geçmişten puan geri alınmaz: kayıt asla küçülmez. */
    if(yeniXP < oncekiXP) yeniXP = oncekiXP;

    if(!defter.gunler[gun]) defter.gunler[gun] = {};
    defter.gunler[gun][id] = [yeniAdet, yeniXP];

    var kazanilan = Math.max(0, yeniXP - oncekiXP);

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

  /* ================= GÜNÜ EŞİTLE — XP'yi VERİDEN türet =================

     `kazan()` bir OLAYDIR: «şunu yaptım, puanımı ver». Onaltı ayrı
     ekrana serpiştirilmiş onaltı `kazan()` çağrısı iki şeyi kaçınılmaz
     kılardı: biri unutulur (o iş hiç puan vermez) ve birinin geri alma
     yolu yazılmaz (silinen kayıt puanı bırakır).

     `esitle()` ise bir PROJEKSİYONDUR: «bugünün verisi şunu söylüyor,
     defteri ona eşitle». Bu deponun doktrini zaten budur — sayıyı ve
     kararı kod üretir. Sonuçları:

       · Tek çağrı yeri. Ekranlar XP'yi bilmez.
       · Kendiliğinden geri alır. Kayıt silinince sayım düşer, XP düşer.
       · Tekrar çalışması zararsız. İki kez çağırmak bir şey değiştirmez.

     `sayimlar` o günün ADET'leridir: { 'esp.kart':30, 'esp.oturum':45 }.
     Yalnız verilen kimlikler yönetilir; deftere `kazan()` ile girmiş
     başka bir satır varsa ona dokunulmaz.

     Gün YAZILABİLİR olmalı (bugün ya da bir haftalık pencere). Eski bir
     günü eşitlemek, geçmişi bugünün fiyatlarıyla yeniden yazmak olurdu. */
  /* YAZILABİLİR GÜNLER — bugün ve pencere içindeki geçmiş.

     Eşitleme yalnız bugüne bakarken gerçek bir boşluk vardı: dünkü
     antrenmanı bu sabah giren kişinin puanı HİÇ gelmiyordu. Motor o
     güne yazmaya izin veriyordu ama kimse o günü eşitlemiyordu. */
  function pencere(){
    var bugun = U().todayISO();
    var out = [];
    for(var i = 0; i <= GERI_GUN; i++) out.push(gunKaydir(bugun, -i));
    return out;
  }

  /* Tek günü deftere uygular. Depoya YAZMAZ, yükselme HESAPLAMAZ:
     ikisi de çağıranın işi, çünkü birden çok gün tek yazmada
     eşitlenebilmeli. Döner: XP farkı (değişiklik yoksa 0). */
  function gunuUygula(gun, sayimlar){
    if(!yazilabilirGun(gun)) return null;
    if(!sayimlar || typeof sayimlar !== 'object') return null;

    var satir = defter.gunler[gun] || {};
    var fark = 0;
    var degisti = false;

    Object.keys(sayimlar).forEach(function(id){
      var e = K().ETKINLIK_ILE(id);
      if(!e || e.mod !== MOD) return;      /* yabancı ya da bilinmeyen */
      var adet = Math.floor(Number(sayimlar[id]));
      if(!(adet > 0)) adet = 0;
      var eskiAdet = gunAdedi(gun, id);
      var eskiXP = gunXPsi(gun, id);
      var yeniXP = adet > 0 ? Math.min(adet * e.xp, gunlukTavan(e)) : 0;
      if(adet === eskiAdet && yeniXP === eskiXP) return;
      degisti = true;
      if(adet > 0) satir[id] = [adet, yeniXP]; else delete satir[id];
      fark += (yeniXP - eskiXP);
    });

    if(!degisti) return null;
    if(Object.keys(satir).length) defter.gunler[gun] = satir;
    else delete defter.gunler[gun];
    return fark;
  }

  /* Uygulanan farkı toplama işler, yükselmeyi bulur, bir kez yazar. */
  async function farkiIsle(fark){
    var onceki = konum(defter.toplam);
    defter.toplam = Math.max(0, defter.toplam + fark);
    var sonraki = konum(defter.toplam);

    var yukselme = null;
    if(sonraki.bitmisBasamak > onceki.bitmisBasamak){
      var b = basamagin(sonraki.bitmisBasamak);
      var oncekiB = basamagin(onceki.bitmisBasamak);
      yukselme = {
        kademe:b.kademe, basamak:b.basamak, etiket:b.etiket,
        kademeBilgi:K().KADEME_ILE(b.kademe),
        yeniKademe:!oncekiB || oncekiB.kademe !== b.kademe,
      };
    }
    /* Veri silinip seviye düştüyse «görülen» de düşer: yeniden
       kazanıldığında kutlama yine oynasın. */
    if(defter.gorulen > sonraki.bitmisBasamak) defter.gorulen = sonraki.bitmisBasamak;

    await yaz();
    if(yukselme) duyur(yukselme);
    return { degisti:true, fark:fark, durum:durum(), yukselme:yukselme };
  }

  async function esitle(gun, sayimlar){
    if(!defter) await yukle();
    gun = gun || U().todayISO();
    if(!yazilabilirGun(gun)){
      return { degisti:false, fark:0, durum:durum(), yukselme:null, gecersizGun:true };
    }
    var fark = gunuUygula(gun, sayimlar);
    if(fark === null) return { degisti:false, fark:0, durum:durum(), yukselme:null };
    return farkiIsle(fark);
  }

  /* Birden çok günü TEK YAZMADA eşitle.

       XP.esitleCok({ '2026-09-18':{…}, '2026-09-17':{…} })

     Çağıran genelde `pencere()` üzerinde döner: dün girilen bir kayıt
     da, bugün silinen bir kayıt da aynı turda yerine oturur. Pencere
     dışındaki gün sessizce atlanır — orası artık yazılabilir değil. */
  async function esitleCok(harita){
    if(!defter) await yukle();
    if(!harita || typeof harita !== 'object'){
      return { degisti:false, fark:0, durum:durum(), yukselme:null };
    }
    var toplamFark = 0;
    var degisti = false;
    Object.keys(harita).forEach(function(gun){
      var fark = gunuUygula(gun, harita[gun]);
      if(fark === null) return;
      degisti = true;
      toplamFark += fark;
    });
    if(!degisti) return { degisti:false, fark:0, durum:durum(), yukselme:null };
    return farkiIsle(toplamFark);
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

    var oncekiAdet = gunAdedi(gun, id);
    var oncekiXP = gunXPsi(gun, id);
    var kalanAdet = Math.max(0, oncekiAdet - adet);

    /* Geri alınan pay ORANTILIDIR. Kaydı bugünün fiyatıyla yeniden
       hesaplamak, tavana takılmış bir günde yanlış sonuç verirdi:
       60 kartın 30'unu silmek, o günün yarısını geri alır. */
    var kalanXP = oncekiAdet > 0
      ? Math.round(oncekiXP * (kalanAdet / oncekiAdet)) : 0;

    if(kalanAdet > 0){ satir[id] = [kalanAdet, kalanXP]; }
    else{ delete satir[id]; kalanXP = 0; }
    if(!Object.keys(satir).length) delete defter.gunler[gun];

    var fark = Math.max(0, oncekiXP - kalanXP);
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
        if(yabanciMi(id)) return;
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
    if(R.S) R.S.seviye = durum();
    try{ await R.Store.set(YOL, defter); }catch(e){}
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

    return '<span class="seviye-rozet" data-seviye-rozet style="--kademe-renk:'
      + kac(k.renk || '#888')
      + ';--kademe-isik:' + kac(k.isik || '#ccc')
      /* KÜÇÜK ROZET — künyedeki ve alt banttaki gösterge. Rütbe
         kartından AYRI bir dosyadır ve olmak zorundadır: kart dikey
         ve yazılı, bu ise 28 piksellik bir daire. Kartı buraya
         küçültmek, okunmayan bir şey göstermekti.

         Dosya yoksa katman hiç çizilmez ve altındaki kademe numarası
         görünür kalır — kırık resim simgesi de, boşluk da göstermeden.
         Kullanıcı `img/seviye/rozet-N.png` bıraktığı an devreye girer.

         Adres MUTLAK verilir: özel bir CSS değişkeni içindeki göreli
         url(), değişkenin kullanıldığı yere değil TANIMLANDIĞI stil
         sayfasına göre çözülüyor ve `css/img/seviye/...` diye yanlış bir
         adres çıkıyordu. */
      + ';--kademe-gorsel:url(&quot;' + kac(mutlak(kok + 'rozet-' + d.kademe + '.png')) + '&quot;)"'
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

  /* ------------------------------------------------------- merdiven

     BÜTÜN basamaklar, her birinin durumuyla. Rütbe ekranı bunu çizer.

     Durum üç değerden biri:
       gecildi   eşik aşıldı, rütbe kazanıldı
       simdi     içinde bulunulan basamak
       kilitli   henüz gelinmedi

     Kart adresi burada üretilir çünkü kural katalogda tek satırdır
     (`LIFEOS.MEDYA_ADI`); ekranın kendi adını kurması, bir gün perde
     ile ekranın ayrı dosyalara bakması demekti. */
  function merdiven(opt){
    opt = opt || {};
    var kok = opt.kok || 'img/seviye/';
    var L = K();
    var d = durum();
    var bitmis = d ? d.bitmisBasamak : 0;
    var simdiki = d ? d.etiket : null;
    return (L.BASAMAKLAR || []).map(function(b, i){
      var hal = 'kilitli';
      if(i < bitmis) hal = 'gecildi';
      else if(b.etiket === simdiki) hal = 'simdi';
      return {
        etiket:b.etiket, kademe:b.kademe, basamak:b.basamak,
        maliyet:b.maliyet, esik:b.esik,
        kademeBilgi:L.KADEME_ILE(b.kademe),
        durum:hal,
        kart:L.MEDYA_ADI ? (kok + L.MEDYA_ADI(b.etiket) + '.webp') : null,
      };
    });
  }

  /* ---------------------------------------------------- bugün ne oldu

     Etkinlik başına BUGÜN: kaç kez yapıldı, kaç XP getirdi, tavanına
     ne kadar kaldı. Defterden OKUNUR, katalogdan hesaplanmaz — o gün
     kazanılan XP yazıldığı anda dondu (bkz. DEFTER NEDEN OLAY LİSTESİ
     DEĞİL).

     `tavan` alanı «bugün bu işten en çok kaç XP alınabilir» demektir;
     `doldu` ise o tavana varıldığını söyler. İkisi birlikte, ekranın
     «bugün buradan daha fazla puan çıkmaz» diyebilmesini sağlar. */
  function bugunku(){
    var gun = U().todayISO();
    return etkinlikler().map(function(e){
      var xp = gunXPsi(gun, e.id);
      var tavan = gunlukTavan(e);
      return {
        id:e.id, ad:e.ad, birim:e.birim, xp:e.xp,
        rota:e.rota || null, nerede:e.nerede || '', nasil:e.nasil || '',
        adet:gunAdedi(gun, e.id),
        kazanilan:xp,
        tavan:tavan,
        doldu:tavan > 0 && xp >= tavan,
        oran:tavan > 0 ? Math.min(1, xp / tavan) : 0,
      };
    });
  }

  /* ---------------------------------------------------------- panel

     «XP nereden geldi» — bir ÖDÜL DUVARI değil bir DEFTER ÖZETİ.

     Bilerek YOK olan üç şey:
       seri (streak)  tatile çıkanı cezalandırır; dokuz aylık ufukla
                      çelişir ve insanı sisteme değil sayaca bağlar.
       sıralama       kiminle yarışacaksın? Tek kullanıcı var.
       «geride kaldın» XP karar vermez; uyarı vermek karar vermektir.

     Kalan şey tek bir cümleye indirgenebilir: bu puan hangi işten
     geldi, ve bir sonraki basamağa ne kadar kaldı. */
  function panelHtml(opt){
    var d = durum();
    if(!d || !d.kademeBilgi) return '';
    opt = opt || {};
    var k = d.kademeBilgi;
    var kir = kirilim();

    var satirlar = Object.keys(kir.etkinlik)
      .map(function(id){
        var e = K().ETKINLIK_ILE(id);
        return { id:id, xp:kir.etkinlik[id],
          ad:e ? e.ad : 'Katalogdan kalkmış iş', bilinen:!!e };
      })
      .filter(function(r){ return r.xp > 0; })
      .sort(function(a, b){ return b.xp - a.xp; });

    var enBuyuk = satirlar.length ? satirlar[0].xp : 0;
    if(kir.arsiv > enBuyuk) enBuyuk = kir.arsiv;

    var govde = '';
    satirlar.forEach(function(r){
      govde += '<li class="seviye-panel__satir">'
        + '<span class="seviye-panel__ad' + (r.bilinen ? '' : ' is-eski') + '">'
        + kac(r.ad) + '</span>'
        + '<span class="seviye-panel__cubuk" aria-hidden="true"><i style="width:'
        + (enBuyuk ? Math.round(100 * r.xp / enBuyuk) : 0) + '%"></i></span>'
        + '<span class="seviye-panel__xp">' + r.xp + '</span></li>';
    });
    if(kir.arsiv > 0){
      govde += '<li class="seviye-panel__satir seviye-panel__satir--arsiv">'
        + '<span class="seviye-panel__ad">Arşiv <span class="seviye-panel__not">'
        + 'kırılımı saklanmayan eski günler</span></span>'
        + '<span class="seviye-panel__cubuk" aria-hidden="true"><i style="width:'
        + (enBuyuk ? Math.round(100 * kir.arsiv / enBuyuk) : 0) + '%"></i></span>'
        + '<span class="seviye-panel__xp">' + kir.arsiv + '</span></li>';
    }
    if(!govde){
      govde = '<li class="seviye-panel__bos">Henüz XP yok. '
        + 'Aşağıdaki işlerden biri kaydedildiğinde burada görünür.</li>';
    }

    /* Son on dört gün. Veri OLMAYAN gün boş bırakılır; sıfır çizmek
       «o gün hiç çalışmadı» demektir, oysa «kayıt yok» başka cümledir. */
    var seri = sonGunler(14);
    var tepe = 0;
    seri.forEach(function(g){ if(g.xp != null && g.xp > tepe) tepe = g.xp; });
    var serit = '';
    seri.forEach(function(g){
      var yuzde = (g.xp != null && tepe) ? Math.max(6, Math.round(100 * g.xp / tepe)) : 0;
      serit += '<span class="' + (g.xp == null ? 'seviye-serit__yok' : 'seviye-serit__gun')
        + '" title="' + kac(g.gun + ' · ' + (g.xp == null ? 'kayıt yok' : g.xp + ' XP'))
        + '"><i style="height:' + yuzde + '%"></i></span>';
    });

    var sonrakiSatir = d.tamam
      ? 'En üst basamaktasın. XP birikmeye devam ediyor.'
      : 'Bir sonraki basamağa <b>' + d.kalan + ' XP</b>';

    return '<div class="seviye-panel" data-seviye-panel style="--kademe-renk:'
      + kac(k.renk || '#888')
      + ';--kademe-isik:' + kac(k.isik || '#ccc') + '">'
      + '<div class="seviye-panel__ust">'
      +   rozetHtml(opt)
      +   '<span class="seviye-panel__sonraki">' + sonrakiSatir + '</span>'
      + '</div>'
      + '<div class="seviye-serit" role="img" aria-label="Son on dört günün XP\'si">'
      +   serit + '</div>'
      + '<ul class="seviye-panel__liste">' + govde + '</ul>'
      + '<p class="seviye-panel__sinir">Bugün <b>' + (d.bugun || 0) + ' XP</b>. '
      + 'Toplam <b>' + d.toplam + '</b>. '
      + 'XP hiçbir kararı vermez — ne plan, ne uyarı, ne teşhis ona bakar; '
      + 'yalnızca emeği görünür kılar.</p>'
      + isListesiHtml()
      + '</div>';
  }

  /* Bu sistemde XP veren işler — katalogdan üretilir, elle yazılmaz.
     Elle yazılan bir liste, kataloğa bir satır eklendiği gün eskir. */
  function isListesiHtml(){
    var isler = etkinlikler();
    if(!isler.length) return '';
    var satir = '';
    isler.forEach(function(e){
      var tavan = gunlukTavan(e);
      satir += '<tr><td>' + kac(e.ad) + '</td>'
        + '<td class="seviye-isler__sayi">' + e.xp + '</td>'
        + '<td class="seviye-isler__birim">/ ' + kac(e.birim) + '</td>'
        + '<td class="seviye-isler__sayi">' + tavan + '</td></tr>';
    });
    return '<details class="seviye-isler">'
      + '<summary>Bu sistemde XP veren işler</summary>'
      + '<table class="seviye-isler__tablo"><thead><tr>'
      + '<th>İş</th><th class="seviye-isler__sayi">XP</th><th></th>'
      + '<th class="seviye-isler__sayi">Günlük tavan</th>'
      + '</tr></thead><tbody>' + satir + '</tbody></table>'
      + '<p class="seviye-panel__sinir">Günlük tavan, aynı işin bir günde '
      + 'kazandırabileceği en çok XP\'dir: tavansız bir sayaç bir gün otuz kez '
      + 'tıklanır ve anlamını kaybeder. Geleceğe puan yazılmaz; geçmişe en fazla '
      + GERI_GUN + ' gün geriye yazılır.</p>'
      + '</details>';
  }

  /* ---------------------------------------------------------- tazele

     SEVİYE ÇİZİMLE GÜNCELLENMEZ, KENDİ DÜĞÜMÜYLE GÜNCELLENİR.

     Eşitleme her tıklamadan kısa süre sonra koşuyor ve XP değiştiğinde
     bütün ekranı yeniden çizdiriyordu. Ekranda değişen tek şey bir
     rozet ve bir paneldi; bedeli ise tıklanan öğenin altından kayması
     oldu (denetim aracı «element is not attached to the DOM» dedi —
     kullanıcı tarafında bu, yazarken kaybolan bir odak demek).

     Bu, deponun `startClock()` içinde zaten çözülmüş bir sorunu:
     değişen düğüm tazelenir, sayfa çizilmez. */
  function tazele(kok){
    var alan = kok || document;
    if(!alan || !alan.querySelectorAll) return 0;
    var n = 0;
    ['[data-seviye-rozet]', '[data-seviye-panel]'].forEach(function(sec){
      var yeni = sec === '[data-seviye-panel]' ? panelHtml() : rozetHtml();
      if(!yeni) return;
      Array.prototype.forEach.call(alan.querySelectorAll(sec), function(el){
        /* İçinde odak varsa DOKUNULMAZ: kullanıcı o an oradadır. */
        if(el.contains && document.activeElement && el.contains(document.activeElement)) return;
        try{ el.outerHTML = yeni; n++; }catch(e){}
      });
    });
    return n;
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
    kazan:kazan, esitle:esitle, esitleCok:esitleCok, geriAl:geriAl,
    pencere:pencere,
    durum:durum, konum:konum, basamagin:basamagin, rozetHtml:rozetHtml, panelHtml:panelHtml,
    tazele:tazele,
    gunToplami:gunToplami, gunuVar:gunuVar, sonGunler:sonGunler, kirilim:kirilim,
    etkinlikler:etkinlikler, gunlukTavan:gunlukTavan,
    merdiven:merdiven, bugunku:bugunku,
    yazilabilirGun:yazilabilirGun, gunKaydir:gunKaydir,
    bekleyenKutlama:bekleyenKutlama, kutlandi:kutlandi, dinle:dinle,
    /* Test ve teşhis için ham defter; ekranlar buna DOKUNMAZ. */
    _defter:function(){ return defter; },
    YOL:YOL, DETAY_GUN:DETAY_GUN, GERI_GUN:GERI_GUN, MOD:MOD,
  };
})();
