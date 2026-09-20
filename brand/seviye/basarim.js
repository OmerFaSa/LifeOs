/* BAŞARIM MOTORU — rozet sayar, kazanımı yakalar, defteri tutar.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/seviye/basarim.js`; `python3 tools/seviye.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne kopyalanır. `__NS__` ve `__MOD__`
   yer tutucuları yayarken her sistemin kendi adıyla değişir.

   ------------------------------------------------------------------
   NEDEN AY ÖZETİ — ve neden gün kırılımı YETMEZ

   XP defteri (`xp.js`) gün kırılımını 120 günde bir budar; eskiyen gün
   arşive gider ve DETAYI silinir. XP için bu doğru: toplam ayrı bir
   alanda durur, budama toplamı bozmaz.

   Rozet için yetmez. «1000 gün» rozeti üç yıllık bir sayıdır, «24 ay
   istikrar» iki yıllık bir seridir; ikisi de 120 günlük pencereden
   okunamaz. Ham veriyi her açılışta baştan taramak ise ölçülen bir
   bedeldi — beş yıllık defterde on binlerce satır (bkz. loadcheck).

   Çözüm: AY ÖZETİ. Her ay için dört sayı saklanır

       { gun: 21, dakika: 1870, gorev: 143, kusursuz: 9 }

   ve bu özet ASLA budanmaz. Yirmi beş yıl = 300 satır ≈ 12 KB; bir
   rozet görselinin yüzde biri etmez. Toplamlar özetin toplamıdır,
   seri özetin sırasından okunur, kusursuz ay özetin kendisindedir.

   Gün kırılımı yine de tutulur ama YALNIZ YAZILABİLİR PENCERE için
   (bugün + 7 gün geri, XP ile aynı kural): dünkü kaydı bu sabah
   girdiğinde o günün özeti düzeltilebilsin diye. Pencere dışına çıkan
   gün özete işlenmiş ve kapanmıştır.

   ------------------------------------------------------------------
   ROZET TETİKLENMEZ, TÜRETİLİR

   Hiçbir ekran «bana rozet ver» demez. Sayım o günün kendi verisinden
   okunur (`__NS__.BasarimSayim`), özete EŞİTLENİR, rozetler eşiklerden
   TÜRETİLİR. XP'nin doktrini neyse bunun da aynısı (AGENTS.md §1.6):

     · Bir ekran unutulamaz — sayım verinin kendisinden gelir.
     · Silinen kayıt rozetini bırakmaz — sayaç düşer.
     · Tekrar çalışması zararsızdır — eşitleme iki kez çağrılabilir.

   BİR İSTİSNA VE BİLEREK: kazanılmış rozet GERİ ALINMAZ. Sayaç
   düşerse rozet listede «kazanıldı» kalır, tarihiyle birlikte. Sebep:
   rozet bir DURUM değil bir OLAYdır — «şu gün 500 saate ulaştın»
   cümlesi, sonradan veri silinse de doğru kalır. Sayacın düştüğünü
   ekran zaten gösterir; kazanılmış bir anı geri almak ise kullanıcıya
   yalan söylemek olurdu.

   ------------------------------------------------------------------
   ROZET HİÇBİR KARARI VERMEZ

   XP gibi. Ne plan, ne reçete, ne uyarı, ne sıralama buna bakar.
   Aranan tek şey: kullanıcı kendi emeğinin biriktiğini görsün. */

window.__NS__ = window.__NS__ || {};

__NS__.Basarim = (function(){
  var MOD = '__MOD__';
  var YOL = 'basarim';          /* depo anahtarı — `seviye`den AYRI */
  var PENCERE_GUN = 7;          /* geriye yazılabilir gün — XP ile aynı */

  var L = function(){ return window.LIFEOS; };
  var U = function(){ return __NS__.U; };

  var defter = null;
  var yukleniyor = null;
  var dinleyiciler = [];

  /* ------------------------------------------------------- defter */

  function bosDefter(){
    return {
      surum:L().BASARIM_SURUM,
      /* Ay özeti: '2026-09' → { gun, dakika, gorev, kusursuz }.
         BUDANMAZ. Bütün toplamlar buradan çıkar. */
      aylar:{},
      /* Yazılabilir penceredeki günler: '2026-09-20' → {dakika, gorev,
         kusursuz:0|1}. Pencereden çıkınca silinir — özete zaten
         işlenmiştir. */
      gunler:{},
      /* BİR GÜNDE görülen en iyi değerler. Ay özetine sığmaz çünkü
         özet toplamdır, bu ise en yüksek olandır. */
      enIyi:{ odakDakika:0 },
      /* Kazanılmış rozetler: kod → kazanıldığı gün (YYYY-AA-GG).
         Rozet geri alınmaz (yukarıdaki nota bakın). */
      kazanilan:{},
      /* Kullanıcıya HENÜZ GÖSTERİLMEMİŞ kazanımlar. Kutlama sırası
         burada bekler; uygulama kapanıp açılsa da kaybolmaz. */
      bekleyen:[],
      guncellendi:null,
    };
  }

  function ayinAdi(gun){ return String(gun || '').slice(0, 7); }

  function isoMu(gun){
    return /^\d{4}-\d{2}-\d{2}$/.test(String(gun || ''));
  }

  function bosAy(){ return { gun:0, dakika:0, gorev:0, kusursuz:0 }; }

  /* Yazılabilir gün — XP ile AYNI kural ve bilerek: iki defterin iki
     ayrı pencereye sahip olması, aynı günün birinde yazılıp ötekinde
     yazılmaması demekti. */
  function yazilabilirGun(gun){
    if(!isoMu(gun)) return false;
    var bugun = U().todayISO();
    if(gun > bugun) return false;
    var d = U().parse(gun), b = U().parse(bugun);
    if(!d || !b) return false;
    return Math.round((b - d) / 86400000) <= PENCERE_GUN;
  }

  /* --------------------------------------------------- normalize */

  function sayi(x){
    var n = Math.floor(Number(x));
    return isFinite(n) && n > 0 ? n : 0;
  }

  function normalize(ham){
    var d = bosDefter();
    if(!ham || typeof ham !== 'object') return d;

    if(ham.aylar && typeof ham.aylar === 'object'){
      Object.keys(ham.aylar).forEach(function(ay){
        if(!/^\d{4}-\d{2}$/.test(ay)) return;
        var s = ham.aylar[ay] || {};
        d.aylar[ay] = { gun:sayi(s.gun), dakika:sayi(s.dakika),
          gorev:sayi(s.gorev), kusursuz:sayi(s.kusursuz) };
      });
    }
    if(ham.gunler && typeof ham.gunler === 'object'){
      Object.keys(ham.gunler).forEach(function(g){
        if(!isoMu(g)) return;
        var s = ham.gunler[g] || {};
        d.gunler[g] = { dakika:sayi(s.dakika), gorev:sayi(s.gorev),
          kusursuz:s.kusursuz ? 1 : 0 };
      });
    }
    if(ham.enIyi && typeof ham.enIyi === 'object'){
      d.enIyi.odakDakika = sayi(ham.enIyi.odakDakika);
    }
    if(ham.kazanilan && typeof ham.kazanilan === 'object'){
      Object.keys(ham.kazanilan).forEach(function(kod){
        var g = ham.kazanilan[kod];
        if(isoMu(g)) d.kazanilan[kod] = g;
      });
    }
    if(Array.isArray(ham.bekleyen)){
      d.bekleyen = ham.bekleyen.filter(function(k){
        return typeof k === 'string' && d.kazanilan[k];
      });
    }
    d.guncellendi = ham.guncellendi || null;

    /* KATALOG SÜRÜMÜ ARTTIYSA kazanımlar yeniden türetilir. Eşik
       değiştiğinde defterdeki «kazandım» kaydı katalogla çelişebilir;
       çelişen iki kaynaktan biri yanlıştır ve doğru olan KATALOGtur.
       Ay özeti KORUNUR — ölçülen veri, eşik değişse de ölçülendir. */
    if(sayi(ham.surum) !== L().BASARIM_SURUM){
      d.kazanilan = {};
      d.bekleyen = [];
    }
    d.surum = L().BASARIM_SURUM;
    return d;
  }

  /* Pencereden çıkan günleri sil. Özete zaten işlendiler; ikinci kez
     saklamak, aynı sayıyı iki yerde tutmak demekti. */
  function buda(d){
    var bugun = U().todayISO();
    Object.keys(d.gunler).forEach(function(g){
      if(!yazilabilirGun(g) && g <= bugun) delete d.gunler[g];
    });
  }

  /* ----------------------------------------------------- okuma */

  /* Ömür boyu toplamlar — ay özetinin toplamı.

     Ay özeti gün gün değil AY AY gezilir: yirmi beş yıl 300 satırdır,
     aynı veri gün gün tutulsaydı 9 000 satır olacaktı ve her çizimde
     gezilecekti. */
  function toplamlar(){
    var t = { gun:0, dakika:0, gorev:0, kusursuzGun:0 };
    var d = defter;
    if(!d) return t;
    Object.keys(d.aylar).forEach(function(ay){
      var s = d.aylar[ay];
      t.gun += s.gun; t.dakika += s.dakika;
      t.gorev += s.gorev; t.kusursuzGun += s.kusursuz;
    });
    /* Penceredeki günler henüz özete işlenmiş OLABİLİR de olmayabilir
       de; `gunuUygula` ikisini birlikte yazdığı için burada tekrar
       eklenmez — eklenseydi son yedi gün iki kez sayılırdı. */
    return t;
  }

  /* Kesintisiz AY serisi — bugünden geriye.

     «Kesintisiz» ayın İÇİNDE en az bir kayıtlı gün olması demektir,
     ayın her günü değil. Her günü şart koşmak «istikrar»ı değil
     «kusursuzluk»u ölçerdi; ikisi ayrı rozet. */
  function seriAy(){
    var d = defter;
    if(!d) return 0;
    var bugun = U().todayISO();
    var yil = Number(bugun.slice(0, 4)), ay = Number(bugun.slice(5, 7));
    var n = 0;
    /* Bu ay henüz boş olabilir — seriyi kırmaz, çünkü ay daha bitmedi.
       Sayıma bu aydan başlanır ama boşsa bir önceki aydan devam eder. */
    var ilk = true;
    while(n < 1000){
      var anahtar = String(yil) + '-' + (ay < 10 ? '0' : '') + String(ay);
      var s = d.aylar[anahtar];
      if(s && s.gun > 0) n++;
      else if(!ilk) break;
      ilk = false;
      ay--; if(ay === 0){ ay = 12; yil--; }
    }
    return n;
  }

  /* Kusursuz hafta: yedi ARDIŞIK kusursuz gün. Penceredeki günlerden
     okunur; yedi günlük pencere tam bu yüzden yedi gün. */
  function kusursuzHaftaVar(){
    var d = defter;
    if(!d) return false;
    var gun = U().todayISO(), ardisik = 0;
    for(var i = 0; i <= PENCERE_GUN; i++){
      var s = d.gunler[gun];
      if(s && s.kusursuz){ ardisik++; if(ardisik >= 7) return true; }
      else ardisik = 0;
      gun = U().iso(U().addDays(U().parse(gun), -1));
    }
    return false;
  }

  /* Kusursuz ay: BİTMİŞ bir ayın bütün günleri kusursuz. Süren ay
     sayılmaz — daha bitmemiş bir ayı «kusursuz» ilan etmek, sonucu
     bilinmeyen bir şeye not vermektir. */
  function kusursuzAyVar(){
    var d = defter;
    if(!d) return false;
    var buAy = ayinAdi(U().todayISO());
    return Object.keys(d.aylar).some(function(ay){
      if(ay >= buAy) return false;
      var s = d.aylar[ay];
      return s.gun > 0 && s.kusursuz === gunSayisi(ay);
    });
  }

  function gunSayisi(ay){
    var y = Number(ay.slice(0, 4)), a = Number(ay.slice(5, 7));
    return new Date(y, a, 0).getDate();
  }

  /* Bir rozetin ÖLÇÜLEN değeri. Katalogdaki `olcu` hangi sayıya
     bakılacağını söyler; ekran bunu bilmez, bilmemeli. */
  function olcum(aile){
    var t = toplamlar();
    if(aile === 'gorev') return t.gorev;
    if(aile === 'gun') return t.gun;
    if(aile === 'saat') return Math.floor(t.dakika / 60);
    if(aile === 'odak') return Math.floor((defter.enIyi.odakDakika || 0) / 60);
    if(aile === 'istikrar') return seriAy();
    return 0;
  }

  /* ---------------------------------------------------- kazanım */

  /* Eşikleri gez, yeni geçilenleri bul. Bir rozet BİR KEZ kazanılır;
     ikinci kez kutlanmaz. */
  function kazanimlariTara(gun){
    var yeni = [];
    L().ROZETLER.forEach(function(r){
      if(defter.kazanilan[r.kod]) return;
      var hak = false;
      if(r.olcu === 'ozel'){
        if(r.esik === 'gun') hak = toplamlar().kusursuzGun > 0;
        else if(r.esik === 'hafta') hak = kusursuzHaftaVar();
        else if(r.esik === 'ay') hak = kusursuzAyVar();
      }else{
        hak = olcum(r.aile) >= r.esik;
      }
      if(hak){
        defter.kazanilan[r.kod] = gun;
        defter.bekleyen.push(r.kod);
        yeni.push(r.kod);
      }
    });
    return yeni;
  }

  /* ----------------------------------------------------- yazma */

  function yukle(){
    if(yukleniyor) return yukleniyor;
    yukleniyor = (async function(){
      var ham = null;
      try{ ham = await __NS__.Store.get(YOL); }catch(e){ ham = null; }
      defter = normalize(ham);
      yukleniyor = null;
      return defter;
    })();
    return yukleniyor;
  }

  function bosalt(){ defter = null; yukleniyor = null; }

  async function yaz(){
    buda(defter);
    defter.guncellendi = new Date().toISOString();
    try{ await __NS__.Store.set(YOL, defter); }catch(e){}
    return defter;
  }

  /* Bir günün sayımını defterle eşitle. Aynı gün iki kez çağrılırsa
     ikincisi FARK kadar düzeltir — üstüne eklemez. */
  function gunuUygula(gun, sayim){
    if(!yazilabilirGun(gun) || !sayim) return false;
    var yeni = {
      dakika:sayi(sayim.dakika),
      gorev:sayi(sayim.gorev),
      kusursuz:sayim.kusursuz ? 1 : 0,
    };
    var eski = defter.gunler[gun] || { dakika:0, gorev:0, kusursuz:0 };
    var vardi = eski.dakika > 0 || eski.gorev > 0;
    var var_ = yeni.dakika > 0 || yeni.gorev > 0;
    if(eski.dakika === yeni.dakika && eski.gorev === yeni.gorev
      && eski.kusursuz === yeni.kusursuz) return false;

    var ay = ayinAdi(gun);
    var s = defter.aylar[ay] || bosAy();
    s.dakika += (yeni.dakika - eski.dakika);
    s.gorev += (yeni.gorev - eski.gorev);
    s.kusursuz += (yeni.kusursuz - eski.kusursuz);
    s.gun += ((var_ ? 1 : 0) - (vardi ? 1 : 0));
    /* Eksiye düşmek bir hatanın belirtisidir, sessizce taşınmaz. */
    s.gun = Math.max(0, s.gun); s.dakika = Math.max(0, s.dakika);
    s.gorev = Math.max(0, s.gorev); s.kusursuz = Math.max(0, s.kusursuz);
    defter.aylar[ay] = s;

    if(var_) defter.gunler[gun] = yeni; else delete defter.gunler[gun];
    if(yeni.dakika > defter.enIyi.odakDakika) defter.enIyi.odakDakika = yeni.dakika;
    return true;
  }

  /* Dışarıya açık tek yazma kapısı. Birden çok gün TEK yazmada
     işlenir: sekiz günü sekiz kez depoya yazmak, sekiz kez
     serileştirmek demekti. */
  async function esitleCok(sayimlar){
    if(!defter) await yukle();
    if(!sayimlar || typeof sayimlar !== 'object'){
      return { degisti:false, yeni:[] };
    }
    var degisti = false;
    var gunler = Object.keys(sayimlar).sort();
    gunler.forEach(function(g){
      if(gunuUygula(g, sayimlar[g])) degisti = true;
    });
    if(!degisti) return { degisti:false, yeni:[] };

    var yeni = kazanimlariTara(gunler[gunler.length - 1] || U().todayISO());
    await yaz();
    if(yeni.length) duyur(yeni);
    return { degisti:true, yeni:yeni };
  }

  /* ------------------------------------------------- kutlama sırası */

  /* Gösterilmemiş ilk kazanım. Perde bunu sorar, gösterir, `gorundu`
     der. Kuyruk defterde durduğu için uygulama kapanıp açılsa da
     kazanım kaybolmaz — kutlamayı kaçırmak, kazanımı kaçırmak gibi
     hissettiriyordu. */
  function bekleyen(){
    if(!defter || !defter.bekleyen.length) return null;
    return rozet(defter.bekleyen[0]);
  }

  async function gorundu(kod){
    if(!defter) return;
    var i = defter.bekleyen.indexOf(kod);
    if(i < 0) return;
    defter.bekleyen.splice(i, 1);
    await yaz();
  }

  function rozet(kod){
    var r = null;
    L().ROZETLER.some(function(x){ if(x.kod === kod){ r = x; return true; } });
    if(!r) return null;
    return {
      kod:r.kod, aile:r.aile, aileAd:r.aileAd, ad:r.ad,
      kisaAd:r.kisaAd, etiket:r.etiket, esik:r.esik,
      birim:r.birim, olcu:r.olcu, gorsel:r.gorsel,
      kazanildi:(defter && defter.kazanilan[r.kod]) || null,
    };
  }

  function dinle(fn){ if(typeof fn === 'function') dinleyiciler.push(fn); }
  function duyur(yeni){
    dinleyiciler.slice().forEach(function(fn){
      try{ fn(yeni); }catch(e){}
    });
  }

  /* -------------------------------------------------- ekran için */

  /* Bütün rozetler, durumuyla. Ekran kendi döngüsünü yazmaz. */
  function liste(){
    if(!defter) return [];
    return L().ROZETLER.map(function(r){
      var kazanildi = defter.kazanilan[r.kod] || null;
      var deger = r.olcu === 'ozel' ? null : olcum(r.aile);
      return {
        kod:r.kod, aile:r.aile, aileAd:r.aileAd, ad:r.ad,
        kisaAd:r.kisaAd, etiket:r.etiket,
        esik:r.esik, birim:r.birim, olcu:r.olcu, gorsel:r.gorsel,
        kazanildi:kazanildi,
        deger:deger,
        oran:(deger == null || typeof r.esik !== 'number') ? null
          : Math.max(0, Math.min(1, deger / r.esik)),
      };
    });
  }

  function durum(){
    if(!defter) return null;
    var t = toplamlar();
    return {
      gun:t.gun,
      saat:Math.floor(t.dakika / 60),
      dakika:t.dakika,
      gorev:t.gorev,
      odakSaat:Math.floor((defter.enIyi.odakDakika || 0) / 60),
      seriAy:seriAy(),
      kusursuzGun:t.kusursuzGun,
      kazanilanSayisi:Object.keys(defter.kazanilan).length,
      toplamRozet:L().ROZETLER.length,
    };
  }

  /* ------------------------------------------- günün odak rozeti */

  /* O GÜNÜN odağı — günlük raporda, eylemlerin yanında duran rozet.

     Başarımlar sekmesindeki odak rozeti ÖMÜR BOYUNCA görülen en iyi
     gündür; bu ise BU GÜNÜN kendisi. İkisi aynı görseli kullanır ama
     aynı şeyi söylemez: biri «en iyin 7 saatti», öbürü «bugün 3
     saat». Günlük rapora ömürlük rekoru basmak, o günün raporunu o
     günden başka bir şey hakkında yapardı.

     Eşiğin ALTINDA kalan gün rozet almaz ve bu bir eksiklik değil:
     yarım saat çalışılan bir güne madalya vermek, madalyayı
     anlamsızlaştırır. `null` döner, ekran hiçbir şey çizmez. */
  function gununOdagi(dakika){
    var saat = Math.floor((Number(dakika) || 0) / 60);
    if(!(saat > 0)) return null;
    var aile = L().BASARIM_AILE_ILE('odak');
    if(!aile) return null;
    /* Geçilen EN YÜKSEK eşik: 3 saat çalışıldıysa 3H rozeti, 1H değil. */
    var esik = null;
    aile.esikler.forEach(function(e){ if(saat >= e) esik = e; });
    if(esik == null) return null;
    return {
      kod:'odak-' + esik, esik:esik, saat:saat,
      ad:esik + ' saat odak',
      gorsel:L().BASARIM_MEDYA_ADI('odak', esik),
      /* Tavanı aşan gün en üst rozeti alır ve bunu SÖYLER: «10 saat»
         yazıp 12 saati gizlemek, ölçülen şeyi saklamaktır. */
      asti:saat > esik,
    };
  }

  /* Günün odak rozetinin HTML'i. Üç uygulama da aynı işaretlemeyi
     kullansın diye burada duruyor: üç ayrı yerde yazılan bir rozet,
     bir gün üç farklı görünürdü. Görsel yoksa `onerror` düğümü
     kaldırır, yazı kalır. */
  function odakHtml(dakika){
    var o = gununOdagi(dakika);
    if(!o) return '';
    var kac = (__NS__.h && __NS__.h.esc) ? __NS__.h.esc : function(x){ return x; };
    return '<span class="odak-rozet" title="' + kac(o.ad) + '">'
      + '<img class="odak-rozet__gorsel" src="img/seviye/' + kac(o.gorsel)
      + '.webp" alt="" aria-hidden="true" loading="lazy" onerror="this.remove()">'
      + '<span class="odak-rozet__yazi">' + o.esik + ' saat odak'
      + (o.asti ? '<span class="odak-rozet__not"> · bugün ' + o.saat + '</span>' : '')
      + '</span></span>';
  }

  /* HKM'ye giden özet. Üç sistem birbirini görmez; toplamı yalnız
     merkez alır (AGENTS.md §1.4) ve bu satır onun girdisidir. */
  function isaret(){
    var d = durum();
    if(!d) return null;
    return {
      badge_days:d.gun, badge_hours:d.saat, badge_tasks:d.gorev,
      badge_focus_hours:d.odakSaat, badge_streak_months:d.seriAy,
      badge_count:d.kazanilanSayisi,
    };
  }

  return {
    yukle:yukle, bosalt:bosalt, esitleCok:esitleCok,
    durum:durum, liste:liste, rozet:rozet, isaret:isaret,
    bekleyen:bekleyen, gorundu:gorundu, dinle:dinle,
    toplamlar:toplamlar, seriAy:seriAy, olcum:olcum,
    gununOdagi:gununOdagi, odakHtml:odakHtml,
    PENCERE_GUN:PENCERE_GUN,
  };
})();
