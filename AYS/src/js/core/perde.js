/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/seviye/perde.js içine yazılır; burası bir sonraki
   `python3 tools/seviye.py --yay` ile yeniden üretilir. */
/* Perde — tam ekran video katmanı. Marka girişi ve seviye kutlaması.

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

window.R = window.R || {};

R.Perde = (function(){

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

  /* GEÇ düğmesinin içi. Halka videonun ne kadarının geçtiğini, sayı kaç
     saniye kaldığını söyler; ikisi birlikte «beklemeye değer mi»
     sorusunu cevaplar. Düz bir «Atla» yazısı o soruyu cevapsız
     bırakıyordu. `index.html` içindeki durağan perde de BİREBİR bu
     gövdeyi taşır — ikisi ayrışmasın diye burada da yazılı. */
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

    var v = perde.querySelector('.perde__video');
    var ortam = perde.querySelector('.perde__ortam');
    var banner = perde.querySelector('.perde__banner');
    var gec = perde.querySelector('.perde__gec');
    var sesDugme = perde.querySelector('.perde__ses');
    /* Durağan perde `index.html` içinde yazılıdır ve bir gün buradaki
       gövdeden ayrışabilir. Ayrışma sessiz olmasın diye onarılır: halkası
       ya da sayacı eksik bir «Geç» düğmesi yeniden kurulur. Üç dosyada
       elle güncellenmesi unutulan bir düğme, çalışmayan bir düğmedir. */
    if(gec && !gec.querySelector('.perde__gec-yol')) gec.innerHTML = GEC_ICI;
    var sayi = gec ? gec.querySelector('.perde__gec-sayi') : null;
    var yol = gec ? gec.querySelector('.perde__gec-yol') : null;

    /* Hareket azaltma tercihinde video oynamaz. Banner varsa kalır —
       kademe atladığın bilgisi bir süs değil, kutlamanın kendisidir. */
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
      setTimeout(function(){
        if(perde.parentNode) perde.parentNode.removeChild(perde);
        if(typeof secenekler.bitti === 'function'){
          try{ secenekler.bitti(); }catch(e){}
        }
      }, 420);
    }

    function tusla(e){
      if(e.key === 'Escape' || e.key === 'Esc'){ e.preventDefault(); kapat(); }
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
       kapattıysa dokunulmaz — tercihi geri almak, tercihi yok saymaktır. */
    function ilkDokunus(){
      document.removeEventListener('pointerdown', ilkDokunus, true);
      if(v && v.muted && sesTercihi() === 'acik') sesiAc(false);
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

    var perde = el('div', 'perde' + (secenekler.sinif ? ' ' + secenekler.sinif : ''));
    perde.setAttribute('role', 'dialog');
    perde.setAttribute('aria-modal', 'true');
    perde.setAttribute('aria-label', secenekler.baslik || 'Giriş');
    if(secenekler.ortam === false) perde.setAttribute('data-ortam', 'kapali');

    var renk = (secenekler.banner && secenekler.banner.renk) || null;
    var isik = (secenekler.banner && secenekler.banner.isik) || null;
    if(renk) perde.style.setProperty('--kademe-renk', renk);
    if(isik) perde.style.setProperty('--kademe-isik', isik);

    if(secenekler.banner) perde.appendChild(bannerCiz(secenekler.banner));

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

  /* ------------------------------------------------- seviye kutlaması

     `yukselme` nesnesi XP motorundan gelir (XP.bekleyenKutlama ya da
     XP.dinle). Kademe DEĞİŞTİYSE video oynar; yalnız basamak değiştiyse
     banner yeter — her 1.2'de on saniyelik video izletmek, üçüncü günde
     kapatılan bir özelliktir.

     Video dosyası yoksa hata yoktur: banner zaten kutlamanın kendisidir,
     video onun üstüne gelen süstür. Altı videoyu altı ayrı günde
     eklemek böyle mümkün olur. */
  function kutla(yukselme, secenekler){
    if(!yukselme) return null;
    secenekler = secenekler || {};
    var k = yukselme.kademeBilgi || {};
    var kok = secenekler.kok || 'img/seviye/';

    return ac({
      sinif:'perde--seviye',
      baslik:'Seviye atladın: ' + (k.ad || '') + ' ' + yukselme.etiket,
      video:yukselme.yeniKademe ? (kok + 'kademe-' + yukselme.kademe + '.mp4') : null,
      enAz:yukselme.yeniKademe ? 6000 : 3600,
      banner:{
        no:yukselme.kademe,
        rozet:kok + 'kademe-' + yukselme.kademe + '.png',
        ustyazi:yukselme.yeniKademe ? 'Yeni kademe' : 'Yeni basamak',
        ad:k.ad || ('Kademe ' + yukselme.kademe),
        etiket:'KADEME ' + yukselme.etiket,
        slogan:k.slogan || '',
        renk:k.renk, isik:k.isik,
      },
      bitti:secenekler.bitti,
    });
  }

  return { ac:ac, baglan:baglan, kutla:kutla, sesTercihi:sesTercihi, GEC_ICI:GEC_ICI };
})();
