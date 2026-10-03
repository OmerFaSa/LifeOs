/* KAMERA — uygulamanın içinden, geri sayımlı fotoğraf. Kullanıcı isteği
   (2026-10-03): «kameraya anlık ulaşabileyim; 3, 5, 10 saniye geri
   sayayım ki telefonu bırakıp hareketi yaparken kendi fotoğrafımı
   çekebileyim». Kitaplık yok: getUserMedia + video + canvas.

   Sözler:
     1. TEK EKRAN, ÜÇ DÜĞME. Altta deklanşör; solunda galeri, sağında
        kamerayı çevir. Üstünde geri sayım seçimi: Hemen · 3 · 5 · 10.
        Çekince önizleme: «Yeniden» ya da «Kullan».
     2. GERİ SAYIM DUYULUR. Telefon uzaktayken rakam okunmaz: her saniye
        kısa bir bip, çekişte daha ince bir bip ve ekran bir an ağarır.
        Ekrana dokunmak sayımı keser.
     3. KAMERA YOKSA YOL KAPANMAZ. Tarayıcı kamerayı yalnız güvenli
        bağlantıda (https ya da localhost) verir; izin de reddedilebilir.
        O zaman aynı ekranda neden yazılır ve telefonun kendi kamerası /
        galerisi tek dokunuşla açılır (geri sayımsız).
     4. GÖRÜNTÜ CİHAZDA KALIR. Kamera akışı hiçbir yere gönderilmez;
        kapanınca bütün izler (track) durdurulur.

   Kullanım: `const blob = await SP.Kamera.cek({ baslik, yon })` —
   vazgeçilirse null. `yon`: 'user' (ön, kendin) ya da 'environment'. */

window.SP = window.SP || {};

SP.Kamera = (function(){
  const SURELER = [0, 3, 5, 10];

  /* Dış dünya tek yerde; testler değiştirir. */
  const ortam = {
    medya:() => (navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? navigator.mediaDevices : null),
    guvenli:() => window.isSecureContext !== false,
    bekle:ms => new Promise(r => setTimeout(r, ms)),
    bip:null,                       /* null → WebAudio */
  };

  let ses = null;
  function bip(frekans, ms){
    if(ortam.bip){ ortam.bip(frekans, ms); return; }
    try{
      const C = window.AudioContext || window.webkitAudioContext;
      if(!C) return;
      ses = ses || new C();
      if(ses.state === 'suspended' && ses.resume) ses.resume();
      const t = ses.currentTime, o = ses.createOscillator(), g = ses.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(frekans, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.28, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      o.connect(g); g.connect(ses.destination);
      o.start(t); o.stop(t + ms / 1000 + 0.02);
    }catch(e){ /* ses yoksa sayım sessiz sürer */ }
  }

  const sureAnahtari = yon => 'spi.kamera.sure.' + (yon === 'user' ? 'on' : 'arka');
  function sureOku(yon){
    try{
      const v = Number(localStorage.getItem(sureAnahtari(yon)));
      if(SURELER.indexOf(v) >= 0 && localStorage.getItem(sureAnahtari(yon)) != null) return v;
    }catch(e){ /* depo yok */ }
    return yon === 'user' ? 5 : 0;
  }
  function sureYaz(yon, v){ try{ localStorage.setItem(sureAnahtari(yon), String(v)); }catch(e){ /* depo yok */ } }

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const ikon = ad => (SP.UI && SP.UI.icon) ? SP.UI.icon(ad) : '';

  function destek(){ return !!ortam.medya() && ortam.guvenli(); }

  let acik = null;                  /* aynı anda tek kamera */

  function cek(o){
    o = o || {};
    if(acik) acik.kapat(null);
    return new Promise(coz => { acik = oturum(o, coz); });
  }

  function oturum(o, coz){
    let yon = o.yon === 'user' ? 'user' : 'environment';
    let sure = sureOku(yon);
    let akis = null, sonuc = null, sayiyor = null, bitti = false;
    const once = document.activeElement;

    const el = document.createElement('div');
    el.className = 'kamera';
    el.id = 'kamera';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', o.baslik || 'Kamera');
    el.innerHTML =
      '<video class="kamera__video" playsinline muted autoplay></video>'
      + '<img class="kamera__onizleme" alt="" hidden/>'
      + '<div class="kamera__mesaj" hidden></div>'
      + '<div class="kamera__sayi" aria-live="assertive"></div>'
      + '<div class="kamera__ipucu">Durdurmak için dokun</div>'
      + '<div class="kamera__flas"></div>'
      + '<div class="kamera__ust">'
      +   '<span class="kamera__baslik">' + esc(o.baslik || '') + '</span>'
      +   '<button type="button" class="kamera__dug kamera__kapat" data-k="kapat" aria-label="Kapat">' + ikon('close') + '</button>'
      + '</div>'
      + '<div class="kamera__alt">'
      +   '<div class="kamera__sureler" role="group" aria-label="Geri sayım">'
      +     SURELER.map(v => '<button type="button" data-k="sure" data-v="' + v + '">' + (v ? v + ' sn' : 'Hemen') + '</button>').join('')
      +   '</div>'
      +   '<div class="kamera__satir kamera__satir--cek">'
      +     '<label class="kamera__dug kamera__galeri" aria-label="Galeriden seç">' + ikon('image')
      +       '<input type="file" accept="image/*" class="sr-only" data-k="galeri"/></label>'
      +     '<button type="button" class="kamera__deklansor" data-k="cek" aria-label="Fotoğraf çek"></button>'
      +     '<button type="button" class="kamera__dug" data-k="cevir" aria-label="Kamerayı çevir">' + ikon('refresh') + '</button>'
      +   '</div>'
      +   '<div class="kamera__satir kamera__satir--sonuc" hidden>'
      +     '<button type="button" class="kamera__metin" data-k="yeniden">Yeniden</button>'
      +     '<button type="button" class="kamera__metin kamera__metin--ana" data-k="kullan">Kullan</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(el);

    const $ = s => el.querySelector(s);
    const video = $('.kamera__video'), onizleme = $('.kamera__onizleme'), mesaj = $('.kamera__mesaj');
    const sayi = $('.kamera__sayi');

    function sureCiz(){
      el.querySelectorAll('[data-k="sure"]').forEach(b => {
        const on = Number(b.dataset.v) === sure;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    function durumCiz(){
      const bekliyor = !!sonuc;
      $('.kamera__satir--cek').hidden = bekliyor;
      $('.kamera__satir--sonuc').hidden = !bekliyor;
      $('.kamera__sureler').hidden = bekliyor || !akis;
      onizleme.hidden = !bekliyor;
      video.hidden = bekliyor || !akis;
      el.classList.toggle('is-sayiyor', !!sayiyor);
    }

    function izleriDurdur(){
      if(akis){ akis.getTracks().forEach(t => { try{ t.stop(); }catch(e){ /* durmuş */ } }); }
      akis = null;
      video.srcObject = null;
    }

    /* Kamera açılamazsa aynı ekran nedenini söyler; galeri ve telefonun
       kendi kamerası (capture) yine tek dokunuş uzaklıktadır. */
    function kameraYok(neden){
      izleriDurdur();
      mesaj.hidden = false;
      mesaj.innerHTML = '<p>' + esc(neden) + '</p>'
        + '<label class="kamera__metin kamera__metin--ana">Telefonun kamerasıyla çek'
        + '<input type="file" accept="image/*" capture="' + (yon === 'user' ? 'user' : 'environment')
        + '" class="sr-only" data-k="galeri"/></label>';
      $('.kamera__deklansor').disabled = true;
      $('[data-k="cevir"]').disabled = true;
      durumCiz();
    }

    async function baslat(){
      izleriDurdur();
      if(!ortam.guvenli()){ kameraYok('Kamera bu bağlantıda açılamıyor: tarayıcı kamerayı yalnız güvenli bağlantıda (https) verir.'); return; }
      const m = ortam.medya();
      if(!m){ kameraYok('Bu tarayıcı uygulama içinden kamera açamıyor.'); return; }
      try{
        akis = await m.getUserMedia({ audio:false,
          video:{ facingMode:{ ideal:yon }, width:{ ideal:1920 }, height:{ ideal:1440 } } });
      }catch(e){
        kameraYok(e && e.name === 'NotAllowedError'
          ? 'Kamera izni verilmedi. Tarayıcının site ayarlarından kameraya izin ver.'
          : 'Kamera açılamadı.');
        return;
      }
      if(bitti){ izleriDurdur(); return; }
      mesaj.hidden = true;
      $('.kamera__deklansor').disabled = false;
      $('[data-k="cevir"]').disabled = false;
      video.classList.toggle('is-ayna', yon === 'user');
      video.srcObject = akis;
      try{ await video.play(); }catch(e){ /* autoplay zaten oynatır */ }
      durumCiz();
    }

    /* Videonun o anki karesi → JPEG Blob. Ön kamera önizlemede aynalıdır
       ama çekilen fotoğraf aynalı DEĞİLDİR (başkasının gördüğü gibi). */
    function kareAl(){
      const w = video.videoWidth || 0, h = video.videoHeight || 0;
      if(!w || !h) return Promise.resolve(null);
      const t = document.createElement('canvas');
      t.width = w; t.height = h;
      t.getContext('2d').drawImage(video, 0, 0, w, h);
      return new Promise(r => t.toBlob(b => r(b), 'image/jpeg', 0.92));
    }

    async function cekim(){
      if(sayiyor || sonuc || !akis) return;
      if(sure){
        const kimlik = {};
        sayiyor = kimlik;
        durumCiz();
        for(let s = sure; s > 0; s--){
          if(sayiyor !== kimlik) return;
          sayi.textContent = String(s);
          bip(880, 120);
          await ortam.bekle(1000);
        }
        if(sayiyor !== kimlik) return;
        sayi.textContent = '';
        sayiyor = null;
      }
      bip(1320, 180);
      el.classList.remove('is-flas'); void el.offsetWidth; el.classList.add('is-flas');
      const b = await kareAl();
      if(!b || bitti) { durumCiz(); return; }
      sonucGoster(b);
    }

    function sonucGoster(b){
      sonuc = b;
      if(onizleme.src) URL.revokeObjectURL(onizleme.src);
      onizleme.src = URL.createObjectURL(b);
      durumCiz();
      const k = $('[data-k="kullan"]');
      if(k) k.focus();
    }

    function sayimiKes(){
      if(!sayiyor) return false;
      sayiyor = null;
      sayi.textContent = '';
      durumCiz();
      return true;
    }

    function kapat(deger){
      if(bitti) return;
      bitti = true;
      sayiyor = null;
      izleriDurdur();
      if(onizleme.src) URL.revokeObjectURL(onizleme.src);
      el.remove();
      document.removeEventListener('keydown', tus, true);
      if(acik && acik.el === el) acik = null;
      if(once && document.contains(once)){ try{ once.focus(); }catch(e){ /* odak verilemedi */ } }
      coz(deger);
    }

    el.addEventListener('click', async e => {
      const d = e.target.closest('[data-k]');
      if(!d){ sayimiKes(); return; }
      const k = d.dataset.k;
      if(k === 'galeri') return;                      /* dosya seçici kendi açılır */
      if(sayimiKes() && k !== 'kapat') return;        /* sayım sırasında dokunuş keser */
      if(k === 'kapat') kapat(null);
      else if(k === 'sure'){ sure = Number(d.dataset.v) || 0; sureYaz(yon, sure); sureCiz(); }
      else if(k === 'cevir'){ yon = yon === 'user' ? 'environment' : 'user'; sure = sureOku(yon); sureCiz(); baslat(); }
      else if(k === 'cek') cekim();
      else if(k === 'yeniden'){ sonuc = null; durumCiz(); if(!akis) baslat(); }
      else if(k === 'kullan' && sonuc) kapat(sonuc);
    });
    el.addEventListener('change', e => {
      const g = e.target.closest('[data-k="galeri"]');
      const f = g && g.files && g.files[0];
      if(f) sonucGoster(f);
    });

    /* Esc kapatır (sayım sürüyorsa önce keser); Tab kamerada döner. */
    function tus(e){
      if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); if(!sayimiKes()) kapat(null); return; }
      if(e.key !== 'Tab') return;
      const liste = Array.from(el.querySelectorAll('button:not([disabled]), input'))
        .filter(n => n.offsetParent !== null || n.closest('label:not([hidden])'));
      if(!liste.length) return;
      const ilk = liste[0], son = liste[liste.length - 1];
      if(e.shiftKey && document.activeElement === ilk){ e.preventDefault(); son.focus(); }
      else if(!e.shiftKey && document.activeElement === son){ e.preventDefault(); ilk.focus(); }
    }
    document.addEventListener('keydown', tus, true);

    sureCiz();
    durumCiz();
    baslat().then(() => { const d = $('.kamera__deklansor'); if(d && !d.disabled) d.focus(); });

    return { el, kapat, _cek:cekim, _durum:() => ({ akis:!!akis, sayiyor:!!sayiyor, sonuc:!!sonuc, sure, yon }) };
  }

  return { cek, destek, SURELER, _ortam:ortam, _acik:() => acik };
})();
