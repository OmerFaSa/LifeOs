/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/seviye/perde.js içine yazılır; burası bir sonraki
   `python3 tools/seviye.py --yay` ile yeniden üretilir. */
/* Perde — tam ekran gösterim katmanı. Marka girişi ve rütbe kutlaması.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/seviye/perde.js`; `python3 tools/seviye.py --yay` ile
   AYS/SPİ/ESP içine kopyalanır; ad alanı yer tutucusu yayarken her
   uygulamanın kendi adıyla (R, SP, ESP) değiştirilir.

   Üç şeyi aynı anda doğru yapar ve üçü de daha önce yanlıştı:

   1. SES ÇALAR. Tarayıcı, kullanıcı sayfayla etkileşmeden önce SESLİ
      otomatik oynatmayı reddeder. Eski kod bunu `muted` yazarak
      «çözmüştü»: video hiç ses çıkarmıyordu. Doğrusu şu — önce sesli
      dene; reddedilirse sessize düşüp OYNAT, «sesi aç» düğmesini
      göster ve kullanıcının ilk dokunuşunda sesi kendiliğinden aç.

   2. GEÇİLEBİLİR. «Geç» düğmesi halkayla ne kadar kaldığını söyler.
      Esc de geçer; klavyeyle gezen biri fareye uzanmak zorunda değildir.

   3. ASLA TAKILMAZ. Video yoksa, bozuksa, codec'i desteklenmiyorsa ya
      da hiç başlamazsa perde kendini kapatır. Bir açılış videosunun
      uygulamayı rehin alması, uygulamanın kendisinden pahalıdır.

   ------------------------------------------------------------------
   İKİ GİRİŞ KAPISI — VE NEDEN İKİ TANE

     baglan(el, ...)   sayfada HAZIR DURAN bir perdeye davranış takar.
     ac({...})         perdeyi kendisi kurar ve sayfaya ekler.

   Marka girişi birincisini kullanır: perde `index.html` içinde DURAĞAN
   olarak durur ve sayfanın ilk boyamasında görünür. JavaScript'i
   beklemek, açılışta bir kare beyaz ekran demekti. Seviye kutlaması
   ikincisini kullanır: o an var olmayan bir şey kurulur.

   İkisi de aynı gövdeyi çalıştırır; «giriş perdesi» ile «seviye
   perdesi» iki ayrı kod olsaydı biri diğerinden geri kalırdı. */

window.ESP = window.ESP || {};

ESP.Perde = (function(){

  /* Ses tercihi PERDEYE değil KULLANICIYA aittir ve üç uygulamada da
     aynı anahtarda durur: birinde sesi kapatan, diğerinde yeniden
     kapatmak zorunda kalmasın. */
  var SES_ANAHTAR = 'lifeos.perde.ses';

  function sesTercihi(){
    try{ return localStorage.getItem(SES_ANAHTAR) === 'kapali' ? 'kapali' : 'acik'; }
    catch(e){ return 'acik'; }
  }
  function sesYaz(deger){
    try{ localStorage.setItem(SES_ANAHTAR, deger); }catch(e){}
  }

  function az(){
    try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch(e){ return false; }
  }

  function kacis(t){
    return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c];
    });
  }

  function el(tag, sinif, ic){
    var d = document.createElement(tag);
    if(sinif) d.className = sinif;
    if(ic != null) d.innerHTML = ic;
    return d;
  }

  var HOPARLOR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M11 5 6 9H3v6h3l5 4z"/>'
    + '<path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  var SESSIZ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M11 5 6 9H3v6h3l5 4z"/>'
    + '<path d="m16 9 5 6"/><path d="m21 9-5 6"/></svg>';

  /* AYNI ANDA TEK PERDE.

     Açılışta iki perde birden açılabiliyordu: marka videosu oynarken
     bekleyen seviye kutlaması da açılıyor, İKİ SES AYNI ANDA çalıyor ve
     tek Esc ikisini birden kapatıyordu — kullanıcı kutlamasını hiç
     görmeden «görüldü» damgası yiyordu. Artık ikincisi SIRAYA GİRER:
     marka girişi biter, kutlama onun ardından oynar.

     Sıraya girme kararı DOM'a bakarak verilir (`.perde` var mı), çünkü
     durağan marka perdesi sayfada JavaScript'ten önce durur; bir
     değişkene bakmak, henüz bağlanmamış bir perdeyi görmezden gelmek
     olurdu. */
  var kuyruk = [];

  /* İlk dokunuş sesi KENDİLİĞİNDEN açmalı mı?

     Saf bir karar; ayrı durmasının sebebi sınanabilir olması. Bu karar
     yanlışken düğme TERS çalışıyordu: `pointerdown` yakalama evresinde
     `click`ten önce gelip sesi açıyor, hemen ardından düğmenin kendi
     dinleyicisi «zaten açık» görüp kapatıyordu — «Sesi aç»a basmak sesi
     kapatıyor ve tercihi üç uygulama için birden `kapali` yazıyordu. */
  function kendiliginenAcilsinMi(hedef, araclar, sessizMi){
    /* Dokunuş düğmelerin üstündeyse kararı KULLANICI veriyor. */
    if(hedef && araclar && araclar.contains && araclar.contains(hedef)) return false;
    if(!sessizMi) return false;
    return sesTercihi() === 'acik';
  }

  function siradakini(){
    var n;
    while(kuyruk.length){
      n = kuyruk.shift();
      if(n.iptal) continue;
      /* Sırada bekleyen bir KUTLAMA ise perde doğrudan açılmaz: önce
         habercisi çıkar. Marka girişi biterken ekrana birden tam ekran
         bir kutlama düşmesi, kullanıcının ne olduğunu anlamadan «Geç»e
         basması demekti. */
      if(n.haberci) habercileAc(n.sec);
      else acHemen(n.sec);
      return;
    }
  }

  /* GEÇ düğmesinin içi. Halka videonun ne kadarının geçtiğini, sayı kaç
     saniye kaldığını söyler; ikisi birlikte «beklemeye değer mi»
     sorusunu cevaplar. Düz bir «Atla» yazısı o soruyu cevapsız
     bırakıyordu.

     `brand/seviye/perde.html` içindeki DURAĞAN perde aynı gövdeyi
     taşır — orası sayfanın ilk boyamasında görünsün diye HTML, burası
     sonradan kurulan perdeler için JavaScript. İkisi ayrı dosyada ama
     ikisi de tek kaynakta; `tools/seviye.py --denetle` bu dosyanın
     ARADIĞI her sınıfın markupta gerçekten bulunduğunu doğrular, yani
     birinden bir parça düşerse sessiz kalmaz. */
  var GEC_ICI =
      '<span class="perde__gec-halka" aria-hidden="true">'
    + '<svg viewBox="0 0 32 32"><circle class="perde__gec-iz" cx="16" cy="16" r="14"/>'
    + '<circle class="perde__gec-yol" cx="16" cy="16" r="14"/></svg>'
    + '<span class="perde__gec-sayi">·</span></span>'
    + '<span class="perde__gec-yazi">Geç</span>';

  /* ================================================================
     baglan — hazır duran bir perdeye davranış takar.

     secenekler:
       enAz    videosuz perde en az kaç ms dursun (varsayılan 4200)
       bitti   perde kapanınca çağrılır
     ================================================================ */
  function baglan(perde, secenekler){
    secenekler = secenekler || {};
    if(!perde || perde.__perdeBagli) return null;
    perde.__perdeBagli = true;

    var kapandi = false;
    var sayacId = null;
    /* Perde açıkken arkadaki sayfa kaymaz: tam ekran bir katmanın
       altında sayfayı kaydırmak, kapandığında bambaşka bir yere
       düşmek demektir. */
    var eskiTasma = null;
    function kaydirmaKilit(){
      try{
        eskiTasma = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
      }catch(e){}
    }
    function kaydirmaSerbest(){
      if(eskiTasma === null) return;
      try{ document.documentElement.style.overflow = eskiTasma; }catch(e){}
      eskiTasma = null;
    }

    var v = perde.querySelector('.perde__video');
    var ortam = perde.querySelector('.perde__ortam');
    var banner = perde.querySelector('.perde__banner');
    var gec = perde.querySelector('.perde__gec');
    var sesDugme = perde.querySelector('.perde__ses');
    var araclar = perde.querySelector('.perde__araclar') || perde;
    var sayi = gec ? gec.querySelector('.perde__gec-sayi') : null;
    var yol = gec ? gec.querySelector('.perde__gec-yol') : null;

    /* Hareket azaltma tercihinde video oynamaz. Banner varsa o kalır.
       (Seviye kutlaması bu tercihte perde HİÇ açmaz — bkz. `kutla`;
       buraya yalnız doğrudan `ac()` çağıran bir perde düşer.) */
    if(v && az() && banner){
      v.parentNode && v.parentNode.removeChild(v); v = null;
      if(ortam){ ortam.parentNode && ortam.parentNode.removeChild(ortam); ortam = null; }
      if(sesDugme){ sesDugme.parentNode && sesDugme.parentNode.removeChild(sesDugme); sesDugme = null; }
    }
    if(banner) banner.hidden = !!v;

    function bannerGoster(){ if(banner) banner.hidden = false; }

    /* ---------------------------------------------------------- kapat */
    function kapat(){
      if(kapandi) return;
      kapandi = true;
      if(sayacId) clearInterval(sayacId);
      document.removeEventListener('keydown', tusla, true);
      document.removeEventListener('pointerdown', ilkDokunus, true);
      /* Ses, perde kalkarken kesilir: kapanmış bir perdenin sesi
         uygulamanın içinden geliyormuş gibi duyulur. */
      try{ if(v){ v.pause(); } if(ortam){ ortam.pause(); } }catch(e){}
      perde.classList.add('perde--kapaniyor');
      kaydirmaSerbest();
      setTimeout(function(){
        if(perde.parentNode) perde.parentNode.removeChild(perde);
        if(typeof secenekler.bitti === 'function'){
          try{ secenekler.bitti(); }catch(e){}
        }
        /* Sıradaki perde ANCAK bu DOM'dan çıktıktan sonra açılır:
           `ac()` sıraya girip girmeyeceğine `.perde` var mı diye
           bakıyor. */
        siradakini();
      }, 420);
    }

    function tusla(e){
      /* Space de geçer. Haberci penceresinde Space «beni bu ekrana hiç
         sokma» demek; perde açıldıktan sonra da aynı tuşun aynı işi
         yapması gerekir, yoksa kullanıcı iki ayrı kural öğrenir. */
      if(e.key === 'Escape' || e.key === 'Esc' || e.key === ' '
        || e.key === 'Spacebar' || e.code === 'Space'){
        e.preventDefault();
        /* Üstteki perde kapanır, altındaki değil. Bugün aynı anda tek
           perde açık ama olayı yukarı bırakmak, yarın açılan ikinci bir
           dinleyicinin de tetiklenmesi demekti. */
        e.stopPropagation();
        kapat();
        return;
      }
      /* ODAK PERDEDE KALIR. `aria-modal="true"` demek, ekran okuyucuya
         arkadaki sayfanın erişilemez olduğunu söylemektir; Tab hâlâ
         arkaya geçiyorsa bu söz tutulmamış olur. */
      if(e.key === 'Tab') odakHapset(e);
    }

    function odaklanabilirler(){
      return Array.prototype.filter.call(
        perde.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])'),
        function(el){ return !el.hidden && el.offsetParent !== null; });
    }

    function odakHapset(e){
      var liste = odaklanabilirler();
      if(!liste.length) return;
      var ilk = liste[0], son = liste[liste.length - 1];
      var simdi = document.activeElement;
      if(e.shiftKey && (simdi === ilk || !perde.contains(simdi))){
        e.preventDefault(); son.focus();
      }else if(!e.shiftKey && (simdi === son || !perde.contains(simdi))){
        e.preventDefault(); ilk.focus();
      }
    }
    document.addEventListener('keydown', tusla, true);
    if(gec) gec.addEventListener('click', kapat);

    /* ---------------------------------------------------------- ses */
    function sesGoster(){
      if(!sesDugme || !v) return;
      var kapali = v.muted;
      sesDugme.innerHTML = kapali ? SESSIZ : HOPARLOR;
      sesDugme.setAttribute('data-ses', kapali ? 'kapali' : 'acik');
      sesDugme.setAttribute('aria-label', kapali ? 'Sesi aç' : 'Sesi kapat');
      sesDugme.title = kapali ? 'Sesi aç' : 'Sesi kapat';
    }

    function sesiAc(kalici){
      if(!v) return;
      v.muted = false;
      if(kalici) sesYaz('acik');
      if(v.paused){ var p = v.play(); if(p && p.catch) p.catch(function(){}); }
      sesGoster();
    }

    function sesiKapat(){
      if(!v) return;
      v.muted = true;
      sesYaz('kapali');
      sesGoster();
    }

    if(sesDugme){
      sesDugme.addEventListener('click', function(){
        if(v && v.muted) sesiAc(true); else sesiKapat();
      });
    }

    /* Tarayıcı sesli otomatik oynatmayı reddettiyse video SESSİZ oynuyor
       demektir. Kullanıcının sayfaya ilk dokunuşu, tarayıcının beklediği
       «etkileşim»dir: tam o anda ses açılır. Kullanıcı sesi KENDİ
       kapattıysa dokunulmaz — tercihi geri almak, tercihi yok saymaktır.

       DOKUNUŞ SES DÜĞMESİNİN ÜSTÜNDEYSE HİÇBİR ŞEY YAPILMAZ. Bu satır
       olmadan düğme TERS ÇALIŞIYORDU: `pointerdown` yakalama evresinde
       `click`ten önce gelir, sesi açardı; hemen ardından düğmenin kendi
       dinleyicisi «zaten açık» görüp KAPATIRDI. Yani «Sesi aç»a basmak
       sesi kapatıyor ve tercihi üç uygulama için birden `kapali`
       yazıyordu. */
    function ilkDokunus(e){
      document.removeEventListener('pointerdown', ilkDokunus, true);
      if(kendiliginenAcilsinMi(e && e.target, araclar, v && v.muted)) sesiAc(false);
    }
    document.addEventListener('pointerdown', ilkDokunus, true);

    /* ---------------------------------------------------------- oynat */
    if(v){
      v.muted = sesTercihi() === 'kapali';
      sesGoster();

      v.addEventListener('ended', kapat);
      /* Hata = video yok, bozuk ya da bu tarayıcıda çözülemiyor. */
      v.addEventListener('error', videoyuBirak);

      var dene = v.play();
      if(dene && dene.catch){
        dene.catch(function(){
          /* Reddedildi: sessize düş ve OYNAT. Oynamayan bir video,
             sessiz oynayan videodan kötüdür. */
          if(!v) return;
          v.muted = true;
          sesGoster();
          var ikinci = v.play();
          if(ikinci && ikinci.catch) ikinci.catch(videoyuBirak);
        });
      }
      if(ortam){
        var o = ortam.play();
        if(o && o.catch) o.catch(function(){});
      }
    }

    function videoyuBirak(){
      if(ortam && ortam.parentNode){ ortam.parentNode.removeChild(ortam); ortam = null; }
      if(v && v.parentNode) v.parentNode.removeChild(v);
      v = null;
      if(sesDugme && sesDugme.parentNode){
        sesDugme.parentNode.removeChild(sesDugme); sesDugme = null;
      }
      if(banner) bannerGoster(); else kapat();
    }

    /* ------------------------------------------------- halka ve sayaç */
    var enAz = Number(secenekler.enAz) > 0 ? Number(secenekler.enAz) : 4200;
    var basladi = Date.now();

    function tik(){
      var oran = 0, kalan = 0;
      if(v && v.duration && isFinite(v.duration) && v.duration > 0){
        oran = Math.min(1, v.currentTime / v.duration);
        kalan = Math.max(0, Math.ceil(v.duration - v.currentTime));
      }else{
        var gecen = Date.now() - basladi;
        oran = Math.min(1, gecen / enAz);
        kalan = Math.max(0, Math.ceil((enAz - gecen) / 1000));
      }
      if(yol) yol.style.setProperty('--ilerleme', String(oran));
      if(sayi) sayi.textContent = kalan > 0 ? String(kalan) : '·';
      if(!v && oran >= 1) kapat();     /* videosuz perde süresini doldurdu */
    }
    tik();
    sayacId = setInterval(tik, 250);

    /* Video HİÇ başlamazsa (ağ yok, codec yok, sekme arka planda) perde
       sonsuza kadar kalmaz. Süre cömerttir: erken kapanan bir giriş,
       geç kapanandan daha çok rahatsız eder. */
    setTimeout(function(){
      if(v && v.currentTime > 0 && !v.ended) return;   /* oynuyor, bitsin */
      if(v) kapat();
    }, 20000);

    kaydirmaKilit();
    try{ if(gec) gec.focus({ preventScroll:true }); }catch(e){}

    return { kapat:kapat, el:perde };
  }

  /* ================================================================
     ac — perdeyi kurar ve sayfaya ekler.

       video     oynatılacak dosyanın yolu (yoksa yalnız banner)
       banner    { no, rozet, ustyazi, ad, etiket, slogan, renk, isik }
       sinif     ek sınıf ('perde--seviye' gibi)
       ortam     bulanık arka kopya açık mı (varsayılan: açık)
       enAz      videosuz perde en az kaç ms dursun
       bitti     kapanınca çağrılır
     ================================================================ */
  function ac(secenekler){
    secenekler = secenekler || {};
    /* Ekranda perde varsa sıraya gir (bkz. AYNI ANDA TEK PERDE). */
    if(document.querySelector('.perde')){
      var bekleyen = { sec:secenekler, iptal:false };
      kuyruk.push(bekleyen);
      return {
        kapat:function(){ bekleyen.iptal = true; },
        el:null, sirada:true,
      };
    }
    return acHemen(secenekler);
  }

  function acHemen(secenekler){
    secenekler = secenekler || {};

    var perde = el('div', 'perde' + (secenekler.sinif ? ' ' + secenekler.sinif : ''));
    perde.setAttribute('role', 'dialog');
    perde.setAttribute('aria-modal', 'true');
    perde.setAttribute('aria-label', secenekler.baslik || 'Giriş');
    if(secenekler.ortam === false) perde.setAttribute('data-ortam', 'kapali');

    var renk = (secenekler.banner && secenekler.banner.renk) || null;
    var isik = (secenekler.banner && secenekler.banner.isik) || null;
    if(renk) perde.style.setProperty('--kademe-renk', renk);
    if(isik) perde.style.setProperty('--kademe-isik', isik);

    /* KADEME SAHNESİ — arka plan. Kartın arkasında duran geniş görsel
       (`sahne-4.webp`). Karartma ve bulanıklık CSS'te; burada yalnız
       katman kurulur. Dosya yoksa öğe hiç eklenmez ve kademe renginden
       çizilmiş zemin kalır — kırık resim simgesi göstermek, hiç
       göstermemekten kötüdür. */
    if(secenekler.sahne){
      var sahne = document.createElement('img');
      sahne.className = 'perde__sahne';
      sahne.alt = '';
      sahne.setAttribute('aria-hidden', 'true');
      sahne.addEventListener('error', function(){
        if(sahne.parentNode) sahne.parentNode.removeChild(sahne);
      });
      sahne.src = secenekler.sahne;
      perde.appendChild(sahne);
    }

    if(secenekler.banner) perde.appendChild(bannerCiz(secenekler.banner));

    /* KADEME GEÇİŞ KARESİ — «Altın → Yakut». Tam ekran, tek görsel;
       eski kademeyle yenisini YAN YANA gösterir, ki kullanıcı neyi
       bırakıp neye geçtiğini bir bakışta görsün.

       Banner ve kart YİNE ÇİZİLİR ve geçiş karesi ancak YÜKLENDİĞİNDE
       onları gizler (`data-gecis`). Kart için kurulan düzenin aynısı:
       dosya gelmezse ekranda hiçbir an boşluk olmaz, olan gösterim
       görülür. Sıra da bunun için: geçiş karesi banner'dan SONRA
       eklenir, üstünde durur. */
    if(secenekler.gecis){
      var gecisEl = document.createElement('img');
      gecisEl.className = 'perde__gecis';
      gecisEl.alt = '';
      gecisEl.setAttribute('aria-hidden', 'true');
      gecisEl.addEventListener('load', function(){
        perde.setAttribute('data-gecis', 'var');
      });
      gecisEl.addEventListener('error', function(){
        if(gecisEl.parentNode) gecisEl.parentNode.removeChild(gecisEl);
      });
      gecisEl.src = secenekler.gecis;
      perde.appendChild(gecisEl);
    }

    /* RÜTBE KARTI — gösterimin kahramanı. Banner'dan ÖNCE değil SONRA
       eklenir: kart yüklenirse banner gizlenir, yüklenmezse banner
       zaten çizilmiş hâlde durur ve hiçbir an boş ekran olmaz. */
    if(secenekler.kart){
      perde.appendChild(kartCiz(perde, secenekler));
    }

    if(secenekler.video){
      var ortam = document.createElement('video');
      ortam.className = 'perde__ortam';
      ortam.src = secenekler.video;
      ortam.muted = true; ortam.autoplay = true; ortam.loop = false;
      ortam.playsInline = true; ortam.setAttribute('playsinline', '');
      ortam.setAttribute('aria-hidden', 'true');
      ortam.tabIndex = -1;
      perde.appendChild(ortam);

      var v = document.createElement('video');
      v.className = 'perde__video';
      v.src = secenekler.video;
      v.autoplay = true;
      v.playsInline = true; v.setAttribute('playsinline', '');
      v.setAttribute('aria-hidden', 'true');
      perde.appendChild(v);
    }

    var araclar = el('div', 'perde__araclar');
    if(secenekler.video){
      var sesDugme = el('button', 'perde__dugme perde__ses');
      sesDugme.type = 'button';
      araclar.appendChild(sesDugme);
    }
    var gec = el('button', 'perde__dugme perde__gec', GEC_ICI);
    gec.type = 'button';
    gec.setAttribute('aria-label', 'Geç (Esc)');
    gec.title = 'Geç — Esc';
    araclar.appendChild(gec);
    perde.appendChild(araclar);

    (document.body || document.documentElement).appendChild(perde);
    return baglan(perde, secenekler);
  }

  /* -------------------------------------------------------- rütbe kartı

     Kart bir GÖRSELDİR ve öyle kalmalı: yüklenirse gösterilir,
     yüklenmezse aşağıdaki banner (kademe adı, etiket, slogan) zaten
     ekranda durur. İki katman da aynı anda çizilir, biri diğerini
     örter — «önce dene, olmazsa çiz» sırası bir kare boşluk bırakırdı.

     İDLE VİDEO. `LIFEOS.RUTBE_VIDEO` açıkken aynı adın `.mp4`'ü
     denenir ve oynayabilirse kartın yerini alır: sessiz, döngülü,
     kullanıcıyı bekletmeyen bir hareket. Bayrak kapalıyken hiç istek
     yapılmaz. Video hata verirse kart olduğu yerde kalır. */
  function kartCiz(perde, secenekler){
    var kutu = el('div', 'perde__kart');

    var img = document.createElement('img');
    img.className = 'perde__kart-gorsel';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.addEventListener('load', function(){
      /* Kart GELDİ. Perdeye işaret konur; CSS bunu görünce banner'daki
         yuvarlak rozeti gizler — kartın üstünde zaten o kademenin
         taşı duruyor, ikinci bir rozet aynı şeyi iki kez söylemekti.
         Kart gelMEZse işaret hiç konmaz ve rozet yerinde kalır. */
      perde.setAttribute('data-kart', 'var');
    });
    img.addEventListener('error', function(){
      if(kutu.parentNode) kutu.parentNode.removeChild(kutu);
    });
    img.src = secenekler.kart;
    kutu.appendChild(img);

    if(secenekler.kartVideo){
      var v = document.createElement('video');
      v.className = 'perde__kart-video';
      v.muted = true; v.loop = true; v.autoplay = true;
      v.playsInline = true; v.setAttribute('playsinline', '');
      v.setAttribute('aria-hidden', 'true');
      v.tabIndex = -1;
      v.addEventListener('canplay', function(){
        kutu.setAttribute('data-video', 'var');
      });
      v.addEventListener('error', function(){
        if(v.parentNode) v.parentNode.removeChild(v);
      });
      v.src = secenekler.kartVideo;
      kutu.appendChild(v);
      var oynat = v.play();
      if(oynat && oynat.catch) oynat.catch(function(){});
    }
    return kutu;
  }

  /* ------------------------------------------------------------ banner */

  function bannerCiz(b){
    var kutu = el('div', 'perde__banner');

    var rozet = el('div', 'perde__rozet');
    if(b.rozet){
      /* Kullanıcının kendi görseli. Yüklenemezse numaraya düşülür —
         kırık resim simgesi göstermek, hiç göstermemekten kötüdür. */
      var img = document.createElement('img');
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.addEventListener('error', function(){
        if(img.parentNode) img.parentNode.removeChild(img);
        rozet.appendChild(el('span', 'perde__rozet-no', String(b.no || '')));
      });
      img.src = b.rozet;
      rozet.appendChild(img);
    }else{
      rozet.appendChild(el('span', 'perde__rozet-no', String(b.no || '')));
    }
    kutu.appendChild(rozet);

    if(b.ustyazi) kutu.appendChild(el('div', 'perde__ustyazi', kacis(b.ustyazi)));
    if(b.ad) kutu.appendChild(el('div', 'perde__ad', kacis(b.ad)));
    kutu.appendChild(el('div', 'perde__ayrac'));
    if(b.etiket) kutu.appendChild(el('div', 'perde__etiket', kacis(b.etiket)));
    if(b.slogan) kutu.appendChild(el('p', 'perde__slogan', kacis(b.slogan)));
    return kutu;
  }

  /* ================================================= RÜTBE KUTLAMASI

     `yukselme` nesnesi XP motorundan gelir (XP.bekleyenKutlama ya da
     XP.dinle) ve iki şey söyler: hangi basamağa çıkıldı (`etiket`) ve
     kademe değişti mi (`yeniKademe`).

     GÖSTERİM ÜÇ KATMANDIR

       sahne   o kademenin geniş görseli, arkada, karartılmış
       kart    o rütbenin kendi kartı (5.2, K300 …), ortada
       yazı    kademe adı, etiket ve slogan, kartın altında

     Üçü de EKSİK OLABİLİR ve hiçbirinin eksikliği hata değildir: sahne
     yoksa kademe renginden bir zemin kalır, kart yoksa banner'ın kendi
     rozeti çizilir. Kutlama her hâlükârda olur.

     ------------------------------------------------------------------
     ÖNCE HABERCİ, SONRA PERDE

     Tam ekran bir katmanın habersiz açılması, kullanıcıyı yaptığı işin
     ortasında yakalar: yazarken, sayarken, bir kaydı bitirirken. Bu
     yüzden perde doğrudan açılmaz — önce sağ üstte üç saniyelik bir
     haberci çıkar ve ne olacağını söyler.

     O üç saniyede Space'e basmak kutlamayı İPTAL ETMEZ, GÖSTERİMİ
     atlar: rütbe kazanılmıştır, defterde durur, rozet yenilenir.
     Atlanan yalnız tam ekran gösterimdir ve kullanıcı o ekrana HİÇ
     girmez. Haberci dokunmatik cihazda da çalışsın diye kendi «Geç»
     düğmesini taşır; Space onun klavye kısayoludur. */

  var HABERCI_MS = 3000;

  /* Bu yükselme hangi kartı ister? Saf karar, ayrı duruyor ki
     sınanabilsin. Ad KATALOGDAN türer (`LIFEOS.MEDYA_ADI`), burada
     ikinci bir adlandırma kuralı yazılmaz. */
  function kartYolu(yukselme, kok){
    var L = window.LIFEOS;
    if(!yukselme || !yukselme.etiket || !L || !L.MEDYA_ADI) return null;
    return (kok || 'img/seviye/') + L.MEDYA_ADI(yukselme.etiket) + '.webp';
  }

  /* Kartın idle videosu — yalnız katalog bayrağı açıkken istenir.
     Kapalıyken `null` döner ve hiç istek yapılmaz. */
  function kartVideoYolu(yukselme, kok){
    var L = window.LIFEOS;
    if(!L || !L.RUTBE_VIDEO) return null;
    if(!yukselme || !yukselme.etiket || !L.MEDYA_ADI) return null;
    return (kok || 'img/seviye/') + L.MEDYA_ADI(yukselme.etiket) + '.mp4';
  }

  function sahneYolu(yukselme, kok){
    if(!yukselme || !yukselme.kademe) return null;
    return (kok || 'img/seviye/') + 'sahne-' + yukselme.kademe + '.webp';
  }

  /* Geçiş karesi YALNIZ yeni kademede istenir. Basamak (1.1 → 1.2)
     aynı kademenin içinde kalır; «Bronz → Bronz» diyen bir tam ekran
     kare, üç basamakta üç kez aynı şeyi söylerdi. */
  function gecisYolu(yukselme, kok){
    if(!yukselme || !yukselme.yeniKademe || !yukselme.kademe) return null;
    return (kok || 'img/seviye/') + 'gecis-' + yukselme.kademe + '.webp';
  }

  /* VİDEO BİTİNCE NEREYE SARAR — saf karar, ayrı duruyor ki sınanabilsin.

     Depo sahibinin isteği: «video 10. saniyede bittiği için bittiğinde
     6. saniyesine sarsın». İlk altı saniye bir AÇILIŞTIR ve her
     döngüde yeniden izlenmesi gerekmez; kalan dört saniye kendi içinde
     kapanan bir harekettir.

     BURADA, RÜTBE EKRANINDA DEĞİL: karar bir MEDYA kararıdır ve bu
     dosya medya kararlarının durduğu yer (`sahneYolu`, `kartVideoYolu`
     de burada). Ayrıca ekran modülleri test sayfasına yüklenmez;
     orada yaşayan bir saf işlev sınanamazdı.

     İki korumayla:

       süre bilinmiyorsa (NaN/Infinity) BAŞA sarar. Tarayıcı H.264
           çözemiyorsa `duration` NaN kalır; bilinmeyen bir süreye göre
           altıncı saniyeye sarmak, videonun sonuna düşüp `ended`
           olayını tekrar tetikleyebilir — saniyede yüz kez dönen bir
           döngü demekti.
       sarma noktası süreden BÜYÜKSE başa sarar. Bir gün altı saniyeden
           kısa bir sahne gelirse, o sahne sonsuza kadar kendi sonunda
           dönerdi. */
  function donguNoktasi(geri, sure){
    if(!(geri > 0)) return 0;
    if(!isFinite(sure) || !(sure > 0)) return 0;
    return geri < sure ? geri : 0;
  }

  /* Perde ne kadar dursun? Yeni bir kademe yeni bir ADDIR: okunacak bir
     slogan, bakılacak yeni bir kart vardır. Basamak ise bir ilerleme
     işaretidir, göz ucuyla görülür. İkisi de «Geç» ile kesilebilir. */
  function kutlamaSuresi(yukselme){
    return (yukselme && yukselme.yeniKademe) ? 7000 : 5000;
  }

  /* --------------------------------------------------------- haberci */

  /* Habercinin TARİFİ — perdeyi açan şeyden bağımsız.

     Önce bu işlev doğrudan `yukselme` okuyordu ve haberci yalnız rütbe
     için çalışabiliyordu. Rozet kazanımı da aynı üç saniyeyi ve aynı
     «Space geçer» sözleşmesini hak ediyor; iki ayrı haberci yazmak,
     ikisinin bir gün farklı davranması demekti. Artık çağıran ne
     yazacağını söyler, haberci NASIL yazacağını bilir. */
  function haberciTarifi(secenekler){
    if(secenekler.haberci) return secenekler.haberci;
    var y = secenekler.yukselme || {};
    var k = y.kademeBilgi || {};
    return {
      sinif:y.yeniKademe ? 'haberci--kademe' : '',
      ustyazi:y.yeniKademe ? 'Yeni kademe' : 'Yeni rütbe',
      ad:k.ad || ('Kademe ' + y.kademe),
      etiket:y.etiket || '',
      renk:k.renk, isik:k.isik,
    };
  }

  function habercileAc(secenekler){
    var t = haberciTarifi(secenekler);
    var kutu = el('div', 'haberci' + (t.sinif ? ' ' + t.sinif : ''));
    kutu.setAttribute('role', 'status');
    kutu.setAttribute('aria-live', 'polite');
    if(t.renk) kutu.style.setProperty('--kademe-renk', t.renk);
    if(t.isik) kutu.style.setProperty('--kademe-isik', t.isik);

    var sayiEl = el('span', 'haberci__sayi', String(Math.ceil(HABERCI_MS / 1000)));
    kutu.appendChild(el('div', 'haberci__ust', kacis(t.ustyazi)));
    kutu.appendChild(el('div', 'haberci__ad',
      kacis(t.ad) + (t.etiket ? ' <b>' + kacis(t.etiket) + '</b>' : '')));

    var alt = el('div', 'haberci__alt');
    alt.appendChild(sayiEl);
    alt.appendChild(el('span', 'haberci__alt-yazi', ' sn sonra açılıyor'));
    /* Klavye ipucu yalnız KLAVYESİ OLANA gösterilir (CSS, pointer:fine).
       Dokunmatikte «Space» yazmak, olmayan bir tuşu tarif etmektir. */
    alt.appendChild(el('span', 'haberci__tus', ' · <kbd>Space</kbd> geçer'));
    kutu.appendChild(alt);

    var gec = el('button', 'haberci__gec', 'Geç');
    gec.type = 'button';
    gec.setAttribute('aria-label', 'Gösterimi geç (Space)');
    kutu.appendChild(gec);

    var cubuk = el('div', 'haberci__cubuk', '<i></i>');
    cubuk.setAttribute('aria-hidden', 'true');
    kutu.appendChild(cubuk);
    var dolgu = cubuk.firstChild;

    (document.body || document.documentElement).appendChild(kutu);

    var basladi = Date.now();
    var bitti = false;
    var sayacId = setInterval(tik, 100);

    function temizle(){
      if(bitti) return true;
      bitti = true;
      clearInterval(sayacId);
      document.removeEventListener('keydown', tusla, true);
      kutu.classList.add('haberci--kapaniyor');
      setTimeout(function(){
        if(kutu.parentNode) kutu.parentNode.removeChild(kutu);
      }, 260);
      return false;
    }

    /* GEÇ: perde HİÇ AÇILMAZ. `bitti` yine çağrılır — kutlama görüldü
       sayılır ve defter damgalanır, yoksa aynı kutlama her açılışta
       yeniden çıkardı. */
    function gecildi(){
      if(temizle()) return;
      if(typeof secenekler.bitti === 'function'){
        try{ secenekler.bitti(); }catch(e){}
      }
      siradakini();
    }

    function ac_(){
      if(temizle()) return;
      acHemen(secenekler);
    }

    function tusla(e){
      if(e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space'
        || e.key === 'Escape' || e.key === 'Esc'){
        e.preventDefault();
        e.stopPropagation();
        gecildi();
      }
    }
    document.addEventListener('keydown', tusla, true);
    gec.addEventListener('click', gecildi);

    function tik(){
      var gecen = Date.now() - basladi;
      var kalan = Math.max(0, HABERCI_MS - gecen);
      sayiEl.textContent = String(Math.ceil(kalan / 1000));
      dolgu.style.width = Math.min(100, 100 * gecen / HABERCI_MS) + '%';
      if(kalan <= 0) ac_();
    }
    tik();

    return {
      kapat:gecildi, el:kutu, haberci:true,
      yukselme:secenekler.yukselme, sirada:false,
    };
  }

  /* ----------------------------------------------------------- kutla */

  function kutla(yukselme, secenekler){
    if(!yukselme) return null;
    secenekler = secenekler || {};
    var k = yukselme.kademeBilgi || {};
    var kok = secenekler.kok || 'img/seviye/';

    /* HAREKET AZALTMA TERCİHİNDE PERDE AÇILMAZ.

       Önce perde açılıp yalnız videosu kapatılıyordu: «kademe atladığın
       bilgisi bir süs değil» diye. Bilgi kısmı doğru, taşıma biçimi
       yanlıştı — hareket azaltmak isteyen birine tam ekran bir katman
       açıp odağını çalmak, tam olarak istemediği şey. Üstelik erişilebilirlik
       denetimi bunu yakaladı: perdenin «Geç» düğmesi sayfanın ilk Tab
       durağı oluyor ve atlama bağlantısının önüne geçiyordu.

       Karar çağırana bırakılır: `sessiz` işaretiyle döner, uygulama
       bilgiyi kendi sakin yoluyla (toast) söyler. */
    if(az()){
      return { sessiz:true, yukselme:yukselme, el:null,
        kapat:function(){}, sirada:false };
    }

    var sec = {
      sinif:'perde--rutbe' + (yukselme.yeniKademe ? ' perde--yeni-kademe' : ''),
      baslik:(yukselme.yeniKademe ? 'Yeni kademe: ' : 'Yeni rütbe: ')
        + (k.ad || '') + ' ' + yukselme.etiket,
      sahne:sahneYolu(yukselme, kok),
      gecis:gecisYolu(yukselme, kok),
      kart:kartYolu(yukselme, kok),
      kartVideo:kartVideoYolu(yukselme, kok),
      enAz:kutlamaSuresi(yukselme),
      banner:{
        /* Kart yoksa daire içinde bu yazar. Noktalı kademelerde kademe
           NUMARASI doğru cevaptır (1.1 ile 1.3 aynı kademedir); Kutsal'da
           numara yoktur, etiketin kendisi yazılır — «6» demek, noktasız
           olsun diye kurulmuş bir kademeye nokta sistemini geri
           getirmekti. */
        no:(k.etiketler ? yukselme.etiket : yukselme.kademe),
        rozet:null,        /* kart zaten o kademenin taşını taşıyor */
        ustyazi:yukselme.yeniKademe ? 'Yeni kademe' : 'Yeni rütbe',
        ad:k.ad || ('Kademe ' + yukselme.kademe),
        etiket:yukselme.etiket,
        slogan:k.slogan || '',
        renk:k.renk, isik:k.isik,
      },
      bitti:secenekler.bitti,
      yukselme:yukselme,
    };

    /* Ekranda perde varsa (marka girişi oynuyor olabilir) haberci de
       SIRAYA GİRER: iki katman üst üste binmez. */
    if(document.querySelector('.perde')){
      var bekleyen = { sec:sec, iptal:false, haberci:true };
      kuyruk.push(bekleyen);
      return {
        kapat:function(){ bekleyen.iptal = true; },
        el:null, sirada:true, yukselme:yukselme,
      };
    }
    return habercileAc(sec);
  }

  /* ------------------------------------------------------ rozet kutlaması */

  function rozetGorseliYolu(rozet, kok){
    if(!rozet || !rozet.gorsel) return null;
    return (kok || 'img/seviye/') + rozet.gorsel + '.webp';
  }

  /* Rozet kazanımı — rütbeyle AYNI sözleşme, AYRI görünüm.

     Aynı sözleşme: önce üç saniyelik haberci, Space o ekrana hiç
     sokmaz, hareket azaltma tercihinde perde hiç açılmaz. Bunlar
     kullanıcının öğrendiği davranış; rozet için ikinci bir davranış
     icat etmek, öğrendiğini bozmak olurdu.

     Ayrı görünüm: rozetin kademe rengi yoktur ve sahnesi yoktur —
     kendisi bir madalyadır, bir manzara değil. Perde sade kalır,
     ortada rozet durur.

     SÜRE rütbeden kısa (4 sn): rozet daha sık kazanılır. Yedi saniyelik
     bir kutlama, otuz yedi kez tekrarlandığında kutlama olmaktan çıkıp
     engel olur. */
  function rozetKutlamaSuresi(){ return 4000; }

  function rozetKutla(rozet, secenekler){
    if(!rozet) return null;
    secenekler = secenekler || {};
    var kok = secenekler.kok || 'img/seviye/';

    if(az()){
      return { sessiz:true, rozet:rozet, el:null,
        kapat:function(){}, sirada:false };
    }

    var sec = {
      sinif:'perde--rozet',
      baslik:'Yeni rozet: ' + (rozet.ad || rozet.kod),
      sahne:null,          /* rozetin manzarası yoktur */
      kart:rozetGorseliYolu(rozet, kok),
      kartVideo:null,
      enAz:rozetKutlamaSuresi(),
      banner:{
        no:String(rozet.esik || ''),
        rozet:null,
        /* AİLE GÖZ ÜSTÜNDE, SAYI BAŞLIKTA. Önce başlık `ad` idi ve
           «Saat 500 saat» okunuyordu — aile iki kez. Aile artık üst
           satırda, başlıkta yalnız kazanılan şey var. */
        ustyazi:'Yeni rozet · ' + (rozet.aileAd || ''),
        ad:rozet.kisaAd || rozet.ad || rozet.kod,
        etiket:'',
        slogan:rozet.ozet || '',
        renk:null, isik:null,
      },
      /* Haberci de rozetin dilini konuşur: «Yeni kademe» değil
         «Yeni rozet», etiket yerine ailenin adı. */
      haberci:{
        sinif:'haberci--rozet',
        ustyazi:'Yeni rozet',
        ad:rozet.aileAd || '',
        etiket:rozet.kisaAd || rozet.ad || '',
      },
      bitti:secenekler.bitti,
      rozet:rozet,
    };

    if(document.querySelector('.perde')){
      var bekleyen = { sec:sec, iptal:false, haberci:true };
      kuyruk.push(bekleyen);
      return {
        kapat:function(){ bekleyen.iptal = true; },
        el:null, sirada:true, rozet:rozet,
      };
    }
    return habercileAc(sec);
  }

  /* ACİL ÇIKIŞ — açık perdeyi hemen kaldırır ve sırayı boşaltır.

     İki yerde gerekli: testlerin birbirinin üstüne perde bırakmaması
     ve ileride «girişleri kapat» ayarının tek satırda çalışması. Normal
     akışta çağrılmaz; kapanma `kapat()` ile, yumuşak geçişle olur. */
  function hepsiniKapat(){
    kuyruk.length = 0;
    var liste = document.querySelectorAll('.perde, .haberci');
    Array.prototype.forEach.call(liste, function(el){
      if(el.parentNode) el.parentNode.removeChild(el);
    });
    try{ document.documentElement.style.overflow = ''; }catch(e){}
  }

  return {
    ac:ac, baglan:baglan, kutla:kutla,
    sesTercihi:sesTercihi, hepsiniKapat:hepsiniKapat,
    kendiliginenAcilsinMi:kendiliginenAcilsinMi,
    /* Saf kararlar — perde açmadan sınanabilsinler diye dışarıda. */
    kartYolu:kartYolu, kartVideoYolu:kartVideoYolu, sahneYolu:sahneYolu,
    gecisYolu:gecisYolu, donguNoktasi:donguNoktasi,
    kutlamaSuresi:kutlamaSuresi,
    rozetKutla:rozetKutla, rozetGorseliYolu:rozetGorseliYolu,
    rozetKutlamaSuresi:rozetKutlamaSuresi,
    GEC_ICI:GEC_ICI, SES_ANAHTAR:SES_ANAHTAR, HABERCI_MS:HABERCI_MS,
  };
})();
