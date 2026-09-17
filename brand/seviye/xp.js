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

   Detay YÜZ YİRMİ GÜN yaşar, sonra `arsiv.xp` içine toplanır. Toplam XP
   ayrı ve TEK YÖNLÜ bir sayaçtır: budama onu asla değiştirmez, yani
   seviye geçmiş silindi diye düşmez.

   ------------------------------------------------------------------
   XP KARAR VERMEZ

   Bu modülü hiçbir plan, reçete, uyarı ya da teşhis okumaz ve okumamalı.
   Kural motoru otoritedir; XP yalnızca kullanıcının kendi emeğini
   görmesidir. Bir gün bir ekran «XP'n düşük, şunu yap» derse kural
   ihlal edilmiştir. */

window.__NS__ = window.__NS__ || {};

__NS__.XP = (function(){
  var U = function(){ return __NS__.U; };
  var K = function(){ return window.LIFEOS; };

  /* HER SİSTEMİN KENDİ SEVİYESİ VAR.

     AYS'nin Altın'ı, ESP'nin Altın'ı ve SPİ'nin Altın'ı AYNI ŞEYİ
     İFADE EDER (aynı eşik, aynı ad, aynı renk) ama AYRI AYRI kazanılır.
     Ortak olan tanımdır, defter değil: defter her sistemin kendi
     deposunda durur ve o sistemin kendi işleriyle dolar.

     Bu satır o kuralın bekçisidir — bir ekran yanlışlıkla başka bir
     sistemin etkinliğini yazmaya kalkarsa puan işlenmez. Üç sistemin
     puanı bir gün karışırsa sebebini aramak günler alırdı. */
  var MOD = '__MOD__';

  var YOL = 'seviye';          /* depo anahtarı */
  var DETAY_GUN = 120;         /* gün kırılımının yaşı */

  /* Bellekteki defter. `null` = henüz yüklenmedi; sıfır DEĞİL.
     Yüklenmemiş bir defteri «0 XP» diye çizmek, bu deponun en çok
     tekrarlanan kuralının (eksik veri sıfır değildir) ihlali olurdu. */
  var defter = null;
  var dinleyiciler = [];

  function bosDefter(){
    return {
      surum:K().SEVIYE_SURUM,
      toplam:0,
      gunler:{},
      arsiv:{ xp:0, ilkGun:null, sonGun:null },
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

  /* ---------------------------------------------------------- hesap */

  /* Toplam XP'nin hangi basamağa denk geldiği. Dönen `basamakNo` 0 ise
     henüz ilk basamak bitmemiştir — kullanıcı 1.1'in İÇİNDEDİR. */
  function konum(toplam){
    var B = K().BASAMAKLAR;
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
      /* İçinde bulunulan basamakta ne kadar yol alındı */
      icinde:tamam ? gereken : kazanilan,
      gereken:gereken,
      oran:tamam ? 1 : (gereken > 0 ? Math.min(1, kazanilan / gereken) : 0),
      kalan:tamam ? 0 : Math.max(0, d.esik - toplam),
      tamam:tamam,
      tepe:K().TOPLAM_XP,
    };
  }

  /* Bir basamak numarasının (1..18) hangi kademenin kaçıncı adımı olduğu.
     Yükselme kutlaması «kademe değişti mi» sorusunu bununla sorar. */
  function basamagin(no){
    var B = K().BASAMAKLAR;
    if(no < 1 || no > B.length) return null;
    return B[no - 1];
  }

  /* ---------------------------------------------------------- defter */

  function gunlerSirali(d){
    return Object.keys(d.gunler).sort();
  }

  /* Yüz yirmi günden eski kırılımı arşive topla. Toplam XP'ye DOKUNMAZ. */
  function buda(d){
    var gunler = gunlerSirali(d);
    if(gunler.length <= DETAY_GUN) return d;
    var atilacak = gunler.slice(0, gunler.length - DETAY_GUN);
    atilacak.forEach(function(g){
      var satir = d.gunler[g];
      Object.keys(satir).forEach(function(id){
        /* Arşive giden sayı, o günün TAVANDAN SONRAKİ XP'sidir. Ham adedi
           çarpmak, tavanı dolduran bir günü arşivde olduğundan büyük
           gösterirdi ve kırılım toplamı, toplam XP'yi aşardı. */
        d.arsiv.xp += gunXPsi(g, id, d);
      });
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
      d.arsiv.xp = Number(ham.arsiv.xp) > 0 ? Math.floor(Number(ham.arsiv.xp)) : 0;
      d.arsiv.ilkGun = ham.arsiv.ilkGun || null;
      d.arsiv.sonGun = ham.arsiv.sonGun || null;
    }
    /* Sürüm defterde SAKLANIR ama bugün bir göç yapmaz: eşikler
       değişmedikçe gerek yok. Değiştiği gün LIFEOS.SEVIYE_SURUM artar ve
       göç burada yazılır — defterin hangi eşiklerle doldurulduğunu
       bilmeden onu yeniden yorumlamak, seviyeyi sessizce oynatmak olur. */
    d.surum = Number(ham.surum) || K().SEVIYE_SURUM;
    return d;
  }

  async function yukle(){
    var ham = null;
    try{ ham = await __NS__.Store.get(YOL); }catch(e){ ham = null; }
    defter = normalize(ham);
    if(__NS__.S) __NS__.S.seviye = durum();
    return defter;
  }

  async function yaz(){
    buda(defter);
    defter.guncellendi = new Date().toISOString();
    if(__NS__.S) __NS__.S.seviye = durum();
    try{ await __NS__.Store.set(YOL, defter); }catch(e){}
    return defter;
  }

  /* ---------------------------------------------------------- tavan */

  /* Bir etkinliğin o gün kazandırdığı XP. Tavan burada uygulanır; çağıran
     tarafın tavanı bilmesi gerekmez. */
  function gunXPsi(gun, id, kaynak){
    var e = K().ETKINLIK_ILE(id);
    if(!e) return 0;
    var d = kaynak || defter;
    if(!d) return 0;
    var satir = d.gunler[gun];
    var adet = (satir && satir[id]) || 0;
    var ham = adet * e.xp;
    return (e.tavan == null) ? ham : Math.min(ham, e.tavan);
  }

  function gunToplami(gun){
    var satir = defter.gunler[gun];
    if(!satir) return 0;
    var t = 0;
    Object.keys(satir).forEach(function(id){ t += gunXPsi(gun, id); });
    return t;
  }

  /* ---------------------------------------------------------- yazma */

  /* XP kazan.

       XP.kazan('esp.kart', { adet:10 })

     `adet` kaç kez olduğu (varsayılan 1), `gun` ise hangi güne yazılacağı
     (varsayılan bugün). GELECEĞE ve GEÇMİŞE yazmaz: bugünden başka bir
     gün verilirse yalnız o günün SATIRI güncellenir ama tavan yine o
     günün tavanıdır — geriye dönük puan toplamak, ölçmeyi oyuna çevirir.

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

    var adet = Number(opt.adet);
    if(!(adet > 0)) adet = 1;
    adet = Math.floor(adet);

    var gun = opt.gun || U().todayISO();
    var oncekiGun = gunXPsi(gun, id);

    if(!defter.gunler[gun]) defter.gunler[gun] = {};
    defter.gunler[gun][id] = (defter.gunler[gun][id] || 0) + adet;

    var sonrakiGun = gunXPsi(gun, id);
    var kazanilan = Math.max(0, sonrakiGun - oncekiGun);

    var onceki = konum(defter.toplam);
    defter.toplam += kazanilan;
    var sonraki = konum(defter.toplam);

    var yukselme = null;
    if(sonraki.bitmisBasamak > onceki.bitmisBasamak){
      var b = basamagin(sonraki.bitmisBasamak);
      /* Bitmiş basamak numarası, kutlanacak olan basamaktır: 1.1'i bitiren
         kişi 1.1'i kazanmıştır ve artık 1.2'nin içindedir. */
      yukselme = {
        kademe:b.kademe,
        basamak:b.basamak,
        etiket:b.etiket,
        kademeBilgi:K().KADEME_ILE(b.kademe),
        /* Kademe DEĞİŞTİYSE video oynar; basamak değiştiyse sessiz kalır. */
        yeniKademe:basamagin(onceki.bitmisBasamak)
          ? basamagin(onceki.bitmisBasamak).kademe !== b.kademe
          : true,
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

    var adet = Number(opt.adet);
    if(!(adet > 0)) adet = 1;
    adet = Math.floor(adet);

    var gun = opt.gun || U().todayISO();
    var satir = defter.gunler[gun];
    if(!satir || !satir[id]) return { geriAlinan:0, durum:durum() };

    var onceki = gunXPsi(gun, id);
    satir[id] = Math.max(0, satir[id] - adet);
    if(!satir[id]) delete satir[id];
    if(!Object.keys(satir).length) delete defter.gunler[gun];

    var sonra = gunXPsi(gun, id);
    var fark = Math.max(0, onceki - sonra);
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

  /* Bu sistemin XP'si hangi işten geldi. Defterde duran günler için
     etkinlik başına toplanır; arşivlenmiş günler kırılımı taşımaz ve
     `arsiv` olarak AYRI raporlanır — bilinmeyeni bir işe yamamak,
     bilmediğini bilmemek olurdu. */
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
    return { etkinlik:out, arsiv:defter.arsiv.xp, mod:MOD };
  }

  /* Bu sistemde XP veren işlerin listesi — ekranlar «ne yaparsam puan
     alırım» sorusunu buradan cevaplar. */
  function etkinlikler(){
    return K().XP_ETKINLIK.filter(function(e){ return e.mod === MOD; });
  }

  /* Testler ve «her şeyi sil» için. */
  async function sifirla(){
    defter = bosDefter();
    if(__NS__.S) __NS__.S.seviye = durum();
    try{ await __NS__.Store.set(YOL, defter); }catch(e){}
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
    if(!d) return '';
    opt = opt || {};
    var kok = opt.kok || 'img/seviye/';
    var k = d.kademeBilgi || {};
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
         url(), değişkenin kullanıldığı yere değil TANIMLANDIĞI
         stil sayfasına göre çözülüyor ve `css/img/seviye/...` diye
         yanlış bir adres çıkıyordu. */
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
    yukle:yukle, sifirla:sifirla,
    kazan:kazan, geriAl:geriAl,
    durum:durum, konum:konum, basamagin:basamagin, rozetHtml:rozetHtml,
    gunToplami:gunToplami, sonGunler:sonGunler, kirilim:kirilim, etkinlikler:etkinlikler,
    bekleyenKutlama:bekleyenKutlama, kutlandi:kutlandi, dinle:dinle,
    /* Test ve teşhis için ham defter; ekranlar buna DOKUNMAZ. */
    _defter:function(){ return defter; },
    gunKaydir:gunKaydir,
    YOL:YOL, DETAY_GUN:DETAY_GUN, MOD:MOD,
  };
})();
