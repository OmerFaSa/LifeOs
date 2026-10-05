/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ses.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* SES — internet radyosu ve tık sesleri, üç arayüzde aynı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ses.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Kopyayı elle
   düzenleme. Biçimi `brand/ortak/ses.css`, testi `brand/ortak/radyo.test.js`.
   ==================================================================

   KULLANICININ İSTEĞİ (2026-10-02, belgeler/ekip/DEVIR-RADYO.md)

     «İnternet chill radyo — Türkçe pop, Türkçe slow, İngilizce pop,
      İngilizce slow, İngilizce rap, Türkçe rap gibi radyo türleri.»
     «Ses efektleri açma kapatma; tıklama kısık, tok, kısa.»

   NEREDE

   Üst şeridin sağında çerçevesiz yuvarlak ♪ (kabuk.js `ustSerit` çizer,
   durumunu buradan sorar); çalarken küçük modül renkli nokta. Basınca
   kabuğun katmanı açılır: tür çipleri, «Şimdi: <istasyon>», çal/durdur,
   «Sonraki istasyon», ses kaydırıcısı, «Tık sesleri: Açık/Kapalı».
   Olaylar belge düzeyinde bir kez bağlanır (gizle.js gibi): modüllerin
   data-act işleyicilerine dokunulmaz.

   KURALLAR

   · Varsayılan KAPALI. Ağa yalnız kullanıcı başlatınca çıkılır; giden tek
     şey akış isteğidir (ve gerekirse türün adıyla yedek arama) — kullanıcı
     verisi gitmez. AGENTS §1.3 kod bağımlılığını yasaklar, ağ akışını
     değil: burada paket yok, `<audio>` ve Web Audio tarayıcınındır.
   · İnternet yoksa «Bağlantı yok»; hiçbir ekran bozulmaz, hiçbir iş beklemez.
   · Ses BİLGİ taşımaz: tık sesleri kapalıyken her şey aynı çalışır.
     Kapalıyken AudioContext hiç kurulmaz.

   NEDEN BÖYLE

   `<audio>` öğesi document.body'ye BİR KEZ eklenir (#app'in dışında):
   uygulama her eylemde #app'i baştan çizer, müzik her çizimde kesilmesin.

   Modüller ayrı sayfadır (4173/4183/4193): modül değişince sayfa değişir ve
   müzik durur. Tercih (tür, ses, «çalıyordu» damgası) bu kapının deposunda
   durur ve LifeOS'un modül geçişinde karşı kapıya taşınır (animasyon.js
   «MODÜLLER ARASI»). Yeni sayfa damga tazeyse (TAZE) çalmayı dener; tarayıcı
   kendiliğinden çalmayı reddederse (otomatik oynatma kuralı) ♪ «dokun,
   sürsün» hâline geçer ve ilk dokunuşta sürer. Damga eskiyse (dün akşam
   kapatılmış tarayıcı) sürdürülmez: ertesi gün ilk tıklamada müzik başlamaz.

   Masaüstü Chrome HLS (.m3u8) ÇALMAZ: listede yalnız doğrudan mp3/aac
   akışları var. Ölü akış (`error`, ya da `stalled`/bağlanma süre aşımı)
   türün sonraki istasyonuna geçer; hepsi düşerse bir kez radio-browser'a
   sorulur, o da vermezse «Bu türde şu an çalan istasyon yok». */

window.LIFEOS = window.LIFEOS || {};

(function(){
  'use strict';

  const L = window.LIFEOS;
  const ANAHTAR = 'lifeos.ses';
  /* «Çalıyordu» damgası bu kadar tazeyse yeni sayfada sürdürülür: modül
     geçişi ya da yenileme. Çalarken damga BEKCI_ARALIK'ta bir tazelenir. */
  const TAZE = 3 * 60 * 1000;
  const DAMGA_ARALIK = 15 * 1000;
  /* Bağlanamayan ya da takılan akış bu kadar beklenir, sonra geçilir. */
  const BEKLEME = 12 * 1000;
  const YEDEK = 'https://de1.api.radio-browser.info/json/stations/search';

  /* İSTASYONLAR — 2026-10-02'de Edge'de (Chromium) `<audio>` ile ÇALINARAK
     doğrulandı: her biri 3 saniyeden uzun çaldı. Sıra anlamlıdır: ilk
     istasyon türün varsayılanıdır; uç sunucusu ara sıra takılan Süper FM
     sona yakındır. Power Türk/Power FM/Kral Pop'un HLS adresleri değil,
     Power'ın doğrudan icecast yolları kullanıldı. SomaFM «Headless»
     tarayıcı kimliğini reddeder (403); gerçek tarayıcıda çalar.
     `ara`: liste tükenirse radio-browser'a sorulan süzgeç. */
  const TURLER = Object.freeze([
    { id:'chill', ad:'Chill', ara:{ tag:'chillout' }, istasyonlar:[
      { ad:'SomaFM Groove Salad', url:'https://ice6.somafm.com/groovesalad-128-mp3' },
      { ad:'FluxFM Chillhop', url:'https://streams.fluxfm.de/Chillhop/mp3-320/streams.fluxfm.de/' },
      { ad:'0R Lo-Fi', url:'https://0nlineradio.radioho.st/0r-lo-fi' },
    ] },
    { id:'tr-pop', ad:'Türkçe Pop', ara:{ tag:'pop', countrycode:'TR' }, istasyonlar:[
      { ad:'Radyo Fenomen', url:'https://live.radyofenomen.com/fenomen/128/icecast.audio' },
      { ad:'Power Türk', url:'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio' },
      { ad:'Radyo Viva', url:'https://radyoviva.radyotvonline.net/radyovivaaac' },
      { ad:'Süper FM', url:'https://playerservices.streamtheworld.com/api/livestream-redirect/SUPER_FM_SC' },
    ] },
    { id:'tr-slow', ad:'Türkçe Slow', ara:{ tag:'slow', countrycode:'TR' }, istasyonlar:[
      { ad:'Power Türk Slow', url:'https://listen.powerapp.com.tr/powerturkslow/mpeg/icecast.audio' },
      { ad:'Joy Türk', url:'https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_TURK_SC' },
      { ad:'Slow Türk', url:'https://radyo.duhnet.tv/ak_dtvh_slowturk' },
      { ad:'Power Türk Akustik', url:'https://listen.powerapp.com.tr/powerturkakustik/mpeg/icecast.audio' },
    ] },
    { id:'tr-rap', ad:'Türkçe Rap', ara:{ tag:'rap', countrycode:'TR' }, istasyonlar:[
      { ad:'Power Türk Rap', url:'https://listen.powerapp.com.tr/powerturkrap/mpeg/icecast.audio' },
      { ad:'Number 1 Türk Rap', url:'https://dijimedya.radyotvonline.net/turkrap' },
    ] },
    { id:'en-pop', ad:'İngilizce Pop', ara:{ tag:'pop', language:'english' }, istasyonlar:[
      { ad:'Metro FM', url:'https://playerservices.streamtheworld.com/api/livestream-redirect/METRO_FM_SC' },
      { ad:'Power Pop', url:'https://listen.powerapp.com.tr/powerpop/mpeg/icecast.audio' },
      { ad:'Virgin Radio', url:'https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO_SC' },
    ] },
    { id:'en-slow', ad:'İngilizce Slow', ara:{ tag:'love songs', language:'english' }, istasyonlar:[
      { ad:'Joy FM', url:'https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_FM_SC' },
      { ad:'Power Love', url:'https://listen.powerapp.com.tr/powerlove/mpeg/icecast.audio' },
    ] },
    { id:'en-rap', ad:'İngilizce Rap', ara:{ tag:'hip-hop', language:'english' }, istasyonlar:[
      { ad:'90s90s Hip Hop', url:'https://streams.90s90s.de/hiphop/mp3-192/streams.90s90s.de/' },
      { ad:'bigFM US Rap', url:'https://stream.bigfm.de/usrap/mp3-128/' },
      { ad:'bigFM Oldschool Rap', url:'https://stream.bigfm.de/oldschoolrap/mp3-128/' },
    ] },
  ].map(t => Object.freeze(Object.assign({}, t, { istasyonlar:Object.freeze(t.istasyonlar.map(Object.freeze)) }))));

  function turBul(id){ return TURLER.find(t => t.id === id) || TURLER[0]; }
  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  /* ---------------------------------------------------------- ortam
     Testler gerçek ağa çıkmaz: ses öğesi, fetch, AudioContext, bağlantı
     durumu ve bekleme süresi buradan verilir. */
  const VARSAYILAN_ORTAM = {
    sesOgesi:null, fetch:null, AudioContext:null, cevrimici:null, sentetik:false, bekleme:BEKLEME,
  };
  let ortam = Object.assign({}, VARSAYILAN_ORTAM);
  function cevrimici(){
    if(ortam.cevrimici) return !!ortam.cevrimici();
    try{ return navigator.onLine !== false; }catch(e){ return true; }
  }

  /* ---------------------------------------------------------- tercih */

  function bosTercih(){ return { tur:'chill', ses:0.6, tik:false, son:{}, caliyordu:0 }; }
  function tercihOku(){
    const t = bosTercih();
    let d = null;
    try{ d = JSON.parse(localStorage.getItem(ANAHTAR) || 'null'); }catch(e){ d = null; }
    if(!d || typeof d !== 'object') return t;
    if(TURLER.some(x => x.id === d.tur)) t.tur = d.tur;
    if(typeof d.ses === 'number' && d.ses >= 0 && d.ses <= 1) t.ses = d.ses;
    t.tik = d.tik === true;
    if(d.son && typeof d.son === 'object') Object.keys(d.son).forEach(k => {
      if(typeof d.son[k] === 'string' && /^https:\/\//.test(d.son[k])) t.son[k] = d.son[k];
    });
    if(typeof d.caliyordu === 'number') t.caliyordu = d.caliyordu;
    return t;
  }
  let tercih = tercihOku();
  function tercihYaz(degisen){
    Object.assign(tercih, degisen || {});
    try{ localStorage.setItem(ANAHTAR, JSON.stringify(tercih)); }catch(e){ /* depo kapalı: bu sayfada geçerli */ }
  }

  /* ---------------------------------------------------------- radyo */

  /* hal: kapali · baglaniyor · caliyor · dokun · yok · baglantiyok */
  let hal = 'kapali';
  let oge = null;
  let liste = [];
  let sira = 0;
  let kalanDeneme = 0;
  let aktif = null;
  let deneme = 0;          /* her denemenin kimliği: eski denemenin olayı yok sayılır */
  let bekci = null;
  let sonDamga = 0;
  const yedekler = {};     /* tür → radio-browser'dan gelen istasyonlar (bu oturum) */
  const yedekSoruldu = {};

  function istasyonlar(tur){ return turBul(tur).istasyonlar.concat(yedekler[tur] || []); }

  const dinlenen = new WeakSet();
  function sesOgesi(){
    if(oge) return oge;
    if(ortam.sesOgesi){ oge = ortam.sesOgesi(); }
    else{
      oge = document.getElementById('lifeos-radyo');
      if(!oge){
        oge = document.createElement('audio');
        oge.id = 'lifeos-radyo';
        oge.preload = 'none';
        document.body.appendChild(oge);
      }
    }
    if(dinlenen.has(oge)) return oge;
    dinlenen.add(oge);
    oge.addEventListener('playing', () => {
      if(hal !== 'baglaniyor' && hal !== 'caliyor') return;
      bekciDur();
      hal = 'caliyor';
      kalanDeneme = liste.length;
      const son = Object.assign({}, tercih.son);
      if(aktif && !aktif.yedek) son[tercih.tur] = aktif.url;
      sonDamga = Date.now();
      tercihYaz({ son, caliyordu:sonDamga });
      guncelle();
    });
    oge.addEventListener('timeupdate', () => {
      if(hal !== 'caliyor') return;
      bekciDur();
      if(Date.now() - sonDamga > DAMGA_ARALIK){ sonDamga = Date.now(); tercihYaz({ caliyordu:sonDamga }); }
    });
    /* Kaynağı boş öğeden gelen geç olay (durduruldu, yedek aranıyor)
       hiçbir şeyi tetiklemez. */
    const canli = () => (hal === 'baglaniyor' || hal === 'caliyor') && !!(oge && oge.src);
    oge.addEventListener('error', () => { if(canli()) gec(deneme); });
    const takildi = () => { if(canli() && !bekci) bekciKur(deneme); };
    oge.addEventListener('stalled', takildi);
    oge.addEventListener('waiting', takildi);
    oturumBagla();
    return oge;
  }

  function bekciKur(n){
    bekciDur();
    bekci = setTimeout(() => { bekci = null; gec(n); }, ortam.bekleme || BEKLEME);
  }
  function bekciDur(){ if(bekci){ clearTimeout(bekci); bekci = null; } }

  function birak(){
    if(!oge) return;
    try{ oge.pause(); }catch(e){}
    try{ oge.removeAttribute('src'); oge.load(); }catch(e){}
  }

  function dene(){
    if(kalanDeneme <= 0 || !liste.length){ tukendi(); return; }
    kalanDeneme--;
    aktif = liste[sira];
    hal = 'baglaniyor';
    const n = ++deneme;
    const a = sesOgesi();
    try{ a.volume = tercih.ses; }catch(e){}
    a.src = aktif.url;
    bekciKur(n);
    let p;
    try{ p = a.play(); }catch(e){ p = Promise.reject(e); }
    Promise.resolve(p).then(null, err => {
      if(n !== deneme) return;
      const ad = err && err.name;
      if(ad === 'NotAllowedError'){ bekciDur(); hal = 'dokun'; guncelle(); return; }
      if(ad === 'AbortError') return;
      gec(n);
    });
    guncelle();
  }

  /* Bu deneme düştü: türün sonraki istasyonu. */
  function gec(n){
    if(n !== deneme || (hal !== 'baglaniyor' && hal !== 'caliyor')) return;
    bekciDur();
    if(!cevrimici()){ birak(); hal = 'baglantiyok'; aktif = null; guncelle(); return; }
    sira = (sira + 1) % liste.length;
    dene();
  }

  function tukendi(){
    bekciDur();
    birak();
    aktif = null;
    if(!cevrimici()){ hal = 'baglantiyok'; guncelle(); return; }
    const tur = tercih.tur;
    if(yedekSoruldu[tur]){ hal = 'yok'; guncelle(); return; }
    yedekSoruldu[tur] = true;
    hal = 'baglaniyor';
    const n = ++deneme;
    guncelle();
    yedekAra(tur).then(ek => {
      if(n !== deneme || tercih.tur !== tur) return;
      if(!ek.length){ hal = 'yok'; guncelle(); return; }
      yedekler[tur] = ek;
      liste = istasyonlar(tur);
      sira = liste.length - ek.length;
      kalanDeneme = ek.length;
      dene();
    });
  }

  /* radio-browser: yalnız türün süzgeci gider. HLS ve mp3/aac dışı
     kodekler elenir; yalnız https (sayfa https'te açılsa da çalsın). */
  function yedekAra(tur){
    const t = turBul(tur);
    const q = Object.assign({}, t.ara, { hidebroken:'true', order:'clickcount', reverse:'true', limit:'20' });
    const url = YEDEK + '?' + Object.keys(q).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(q[k])).join('&');
    const getir = ortam.fetch || (typeof fetch === 'function' ? fetch.bind(window) : null);
    if(!getir) return Promise.resolve([]);
    let iptal = null, zaman = null;
    try{ iptal = new AbortController(); zaman = setTimeout(() => iptal.abort(), 8000); }catch(e){}
    return Promise.resolve()
      .then(() => getir(url, iptal ? { signal:iptal.signal } : {}))
      .then(r => r && r.ok ? r.json() : [])
      .then(d => (Array.isArray(d) ? d : [])
        .filter(s => s && !Number(s.hls) && /^(mp3|aac\+?)$/i.test(String(s.codec || '').trim())
          && /^https:\/\//.test(String(s.url_resolved || '')) && !/\.m3u8?(\?|$)/i.test(s.url_resolved))
        .filter(s => !t.istasyonlar.some(i => i.url === s.url_resolved))
        .slice(0, 5)
        .map(s => Object.freeze({ ad:String(s.name || 'İstasyon').trim().slice(0, 48) || 'İstasyon',
          url:String(s.url_resolved), yedek:true })))
      .catch(() => [])
      .then(v => { if(zaman) clearTimeout(zaman); return v; });
  }

  function cal(){
    deneme++;
    bekciDur();
    if(!cevrimici()){ hal = 'baglantiyok'; aktif = null; guncelle(); return false; }
    liste = istasyonlar(tercih.tur);
    const i = liste.findIndex(s => s.url === tercih.son[tercih.tur]);
    sira = i >= 0 ? i : 0;
    kalanDeneme = liste.length;
    tercihYaz({ caliyordu:Date.now() });
    dene();
    return true;
  }
  function durdur(){
    deneme++;
    bekciDur();
    birak();
    hal = 'kapali';
    tercihYaz({ caliyordu:0 });
    guncelle();
  }
  function sonraki(){
    deneme++;
    bekciDur();
    if(!cevrimici()){ hal = 'baglantiyok'; aktif = null; guncelle(); return false; }
    /* Liste her seferinde seçili türden kurulur: radyo kapalıyken tür
       değiştiyse eski türün listesinde kalınmaz. */
    liste = istasyonlar(tercih.tur);
    const ref = aktif ? aktif.url : tercih.son[tercih.tur];
    const i = liste.findIndex(s => s.url === ref);
    sira = (i + 1) % liste.length;
    kalanDeneme = liste.length;
    tercihYaz({ caliyordu:Date.now() });
    dene();
    return true;
  }
  /* o.calma: yalnız seç (çip seçimi normalde çalar: tek dokunuş). */
  function turSec(id, o){
    if(!TURLER.some(t => t.id === id)) return false;
    tercihYaz({ tur:id });
    if(o && o.calma){ guncelle(); return true; }
    return cal();
  }
  function sesAyarla(v){
    v = Math.max(0, Math.min(1, Number(v)));
    if(!isFinite(v)) return false;
    v = Math.round(v * 100) / 100;
    tercihYaz({ ses:v });
    if(oge){ try{ oge.volume = v; }catch(e){} }
    return true;
  }

  /* MODÜL GEÇİŞİ (kabuk.js `gecis`, adres kurulmadan HEMEN önce): çalıyorsa
     damga tazelenir, karşı kapı sürdürsün. Bu sayfa ise çıkarken kendi
     damgasını SIFIRLAR — müzik artık öteki modülde. Yoksa kullanıcı orada
     durdurup Geri tuşuyla dönünce müzik burada kendiliğinden yeniden
     başlardı. Merkez'e (HKM) geçişte devredilmez: orada radyo yok, dönüşte
     sürer. */
  let devredildi = false;
  function devret(){
    if(!(calarMi() || hal === 'dokun')) return false;
    tercihYaz({ caliyordu:Date.now() });
    devredildi = true;
    return true;
  }
  /* Sayfadan çıkış (pagehide): devredildiyse damga sıfır; yenileme ya da
     başka bir çıkışta çalıyorsa taze. */
  function sayfadanCik(){
    if(devredildi){ tercihYaz({ caliyordu:0 }); return; }
    if(hal === 'caliyor') tercihYaz({ caliyordu:Date.now() });
  }

  /* Açılışta: başka modülde (ya da yenilemeden önce) çalıyorduysa sürdür. */
  function acilis(){
    const t = tercih.caliyordu;
    if(!t) return false;
    if(Date.now() - t > TAZE){ tercihYaz({ caliyordu:0 }); return false; }
    return cal();
  }

  /* Tarayıcının ortam denetimi (klavyedeki ortam tuşları, kilit ekranı). */
  let oturumBagli = false;
  function oturumBagla(){
    if(oturumBagli || ortam.sesOgesi) return;
    oturumBagli = true;
    try{
      const ms = navigator.mediaSession;
      if(!ms) return;
      ms.setActionHandler('play', () => cal());
      ms.setActionHandler('pause', () => durdur());
      ms.setActionHandler('stop', () => durdur());
      ms.setActionHandler('nexttrack', () => sonraki());
    }catch(e){}
  }
  function oturumGuncelle(){
    if(ortam.sesOgesi) return;
    try{
      const ms = navigator.mediaSession;
      if(!ms) return;
      if(hal === 'caliyor' && aktif && typeof MediaMetadata !== 'undefined'){
        ms.metadata = new MediaMetadata({ title:aktif.ad, artist:turBul(tercih.tur).ad + ' · LifeOS radyo' });
      }
      ms.playbackState = hal === 'caliyor' ? 'playing' : hal === 'kapali' ? 'none' : 'paused';
    }catch(e){}
  }

  /* ---------------------------------------------------------- durum ve çizim */

  function mesaj(){
    const ad = aktif ? aktif.ad : '';
    switch(hal){
      case 'caliyor':     return 'Şimdi: ' + ad;
      case 'baglaniyor':  return ad ? 'Bağlanıyor: ' + ad : 'Bağlanıyor…';
      case 'dokun':       return 'Dokun, sürsün: ' + ad;
      case 'yok':         return 'Bu türde şu an çalan istasyon yok';
      case 'baglantiyok': return 'Bağlantı yok';
      default:            return 'Kapalı';
    }
  }
  function durum(){
    return { hal, tur:tercih.tur, turAd:turBul(tercih.tur).ad, istasyon:aktif ? aktif.ad : null, mesaj:mesaj() };
  }
  function calarMi(){ return hal === 'caliyor' || hal === 'baglaniyor'; }

  /* Kabuğun ♪ düğmesi için: sınıf, erişilebilir ad, ipucu. */
  function dugme(){
    const sinif = hal === 'caliyor' ? ' is-caliyor' : hal === 'baglaniyor' ? ' is-baglaniyor' : hal === 'dokun' ? ' is-dokun' : '';
    const etiket = hal === 'caliyor' ? 'Radyo ve sesler — çalıyor: ' + (aktif ? aktif.ad : '')
      : hal === 'dokun' ? 'Radyo bekliyor — dokun, sürsün'
      : 'Radyo ve sesler';
    const ipucu = hal === 'caliyor' ? (aktif ? aktif.ad : 'Radyo') : hal === 'dokun' ? 'Dokun, sürsün' : 'Radyo';
    /* Kenarda «Radyo» satırının yanında çalan istasyon (2026-10-06). */
    const ad = hal === 'caliyor' && aktif ? aktif.ad : '';
    return { sinif, etiket, ipucu, ad };
  }

  const SIMGE_CAL = '<svg class="ses__sim" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
  const SIMGE_DUR = '<svg class="ses__sim" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="7" y="6" width="3.5" height="12" rx="1"/><rect x="13.5" y="6" width="3.5" height="12" rx="1"/></svg>';

  function panelHtml(){
    return '<div class="katman kmenu kmenu--ses" role="dialog" aria-label="Radyo ve sesler" data-ses-panel>'
      + '<p class="kmenu__bas">Radyo</p>'
      + '<div class="ses__turler" role="group" aria-label="Tür">'
      +   TURLER.map(t => '<button type="button" class="ses__tur' + (t.id === tercih.tur ? ' is-on' : '') + '" data-ses-tur="' + t.id + '"'
          + ' aria-pressed="' + (t.id === tercih.tur ? 'true' : 'false') + '">' + kac(t.ad) + '</button>').join('')
      + '</div>'
      + '<p class="ses__simdi' + (hal === 'caliyor' ? ' is-caliyor' : '') + '" role="status" aria-live="polite">' + kac(mesaj()) + '</p>'
      + '<div class="ses__eylem">'
      +   '<button type="button" class="ses__cal" data-ses="cal">' + (calarMi() ? SIMGE_DUR + 'Durdur' : SIMGE_CAL + 'Çal') + '</button>'
      +   '<button type="button" class="ses__sonraki" data-ses="sonraki">Sonraki istasyon</button>'
      + '</div>'
      + '<label class="ses__duzey"><span>Ses</span>'
      +   '<input type="range" min="0" max="100" step="1" value="' + Math.round(tercih.ses * 100) + '" data-ses="duzey" aria-label="Ses düzeyi"></label>'
      + '<div class="ses__satir"><span id="ses-tik-ad">Tık sesleri</span>'
      +   '<button type="button" class="ses__anahtar" data-ses="tik" role="switch" aria-labelledby="ses-tik-ad ses-tik-deger"'
      +     ' aria-checked="' + (tercih.tik ? 'true' : 'false') + '"><span id="ses-tik-deger">' + (tercih.tik ? 'Açık' : 'Kapalı') + '</span></button>'
      + '</div>'
      + '</div>';
  }

  /* Durum değişince ekrandaki ♪ ve açık panel YERİNDE güncellenir: panel
     yeniden çizilmez (kaydırıcı sürüklenirken odak kaybolmasın). */
  function guncelle(){
    oturumGuncelle();
    if(typeof document === 'undefined') return;
    const d = dugme();
    document.querySelectorAll('.ust__ses').forEach(b => {
      b.classList.toggle('is-caliyor', hal === 'caliyor');
      b.classList.toggle('is-baglaniyor', hal === 'baglaniyor');
      b.classList.toggle('is-dokun', hal === 'dokun');
      b.setAttribute('aria-label', d.etiket);
      b.setAttribute('title', d.ipucu);
      const ad = b.querySelector('[data-ses-ad]');
      if(ad && ad.textContent !== d.ad) ad.textContent = d.ad;
    });
    document.querySelectorAll('[data-ses-panel]').forEach(p => {
      p.querySelectorAll('[data-ses-tur]').forEach(c => {
        const on = c.getAttribute('data-ses-tur') === tercih.tur;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      const s = p.querySelector('.ses__simdi');
      if(s && s.textContent !== mesaj()){ s.textContent = mesaj(); }
      if(s) s.classList.toggle('is-caliyor', hal === 'caliyor');
      const c = p.querySelector('[data-ses="cal"]');
      if(c){
        const istenen = calarMi() ? 'Durdur' : 'Çal';
        if(c.textContent.trim() !== istenen) c.innerHTML = (calarMi() ? SIMGE_DUR : SIMGE_CAL) + istenen;
      }
      const t = p.querySelector('[data-ses="tik"]');
      if(t){
        t.setAttribute('aria-checked', tercih.tik ? 'true' : 'false');
        const v = t.querySelector('#ses-tik-deger') || t;
        v.textContent = tercih.tik ? 'Açık' : 'Kapalı';
      }
    });
    try{ window.dispatchEvent(new CustomEvent('lifeos:ses', { detail:durum() })); }catch(e){}
  }

  /* ---------------------------------------------------------- tık sesleri

     «Kısık, tok, kısa»: sinüs, hızlı zarf, düşük kazanç. Dosya yok; her ses
     birkaç osilatör notasıdır. Nota: [gecikme sn, başlangıç Hz, bitiş Hz,
     süre sn, tepe kazanç, yükselme sn]. */
  const SESLER = Object.freeze({
    tik:  [[0, 200, 140, 0.05, 0.04, 0.004]],
    ac:   [[0, 180, 168, 0.035, 0.035, 0.003], [0.055, 240, 224, 0.035, 0.035, 0.003]],
    kapa: [[0, 240, 224, 0.035, 0.035, 0.003], [0.055, 180, 168, 0.035, 0.035, 0.003]],
    tamam:[[0, 392, 386, 0.2, 0.03, 0.014]],
  });
  let baglam = null;
  let sonBitis = 0;

  /* kur: AudioContext yoksa kurulsun mu? Yalnız kullanıcının dokunuşunda
     kurulur (tarayıcı başka türlü askıda başlatır). */
  function sesBaglami(kur){
    if(!tercih.tik) return null;
    if(!baglam){
      if(!kur) return null;
      const C = ortam.AudioContext || (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext));
      if(!C) return null;
      try{ baglam = new C(); }catch(e){ return null; }
    }
    if(baglam.state === 'suspended' && baglam.resume){ try{ baglam.resume(); }catch(e){} }
    return baglam;
  }
  function nota(c, t, f0, f1, sure, tepe, yuksel){
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    if(f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + sure);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(tepe, t + yuksel);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + sure + 0.02);
  }
  /* Döner: çaldı mı. `kur` yoksa yalnız kurulu bağlam kullanılır. */
  function tik(tur, kur){
    const plan = SESLER[tur];
    if(!plan) return false;
    const c = sesBaglami(kur !== false);
    if(!c) return false;
    try{
      const simdi = c.currentTime || 0;
      /* «Tamam» notası tıkın üstüne binmez, ardından gelir. */
      const bas = tur === 'tamam' ? Math.max(simdi, sonBitis + 0.02) : simdi;
      plan.forEach(n => nota(c, bas + n[0], n[1], n[2], n[3], n[4], n[5]));
      const son = plan[plan.length - 1];
      sonBitis = Math.max(sonBitis, bas + son[0] + son[3]);
      return true;
    }catch(e){ return false; }
  }
  function tikAc(v){
    tercihYaz({ tik:!!v });
    if(!v) baglamKapat();
    guncelle();
    return tercih.tik;
  }
  function baglamKapat(){
    if(baglam && baglam.close){ try{ baglam.close(); }catch(e){} }
    baglam = null;
    sonBitis = 0;
  }

  const TIKLANAN = 'button, [role="button"], [role="switch"], a[href], .chip--tap, summary';
  function gercekMi(e){ return ortam.sentetik || e.isTrusted !== false; }

  /* ---------------------------------------------------------- olaylar */

  function panelAcKapa(dugmeEl){
    const K = L.KABUK;
    if(!K) return;
    if(K.katmanAcik('kabuk-ses')){ K.katmanKapat(); return; }
    K.katmanAc('kabuk-ses', panelHtml(), dugmeEl);
  }

  let bagli = false;
  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;

    /* Tık sesi: yakalama evresinde, işin kendisinden ÖNCE (yeniden çizim
       düğmeyi söker; aria-pressed'in eski değeri ancak şimdi okunur). */
    document.addEventListener('click', e => {
      if(!tercih.tik || !gercekMi(e)) return;
      const el = e.target && e.target.closest ? e.target.closest(TIKLANAN) : null;
      if(!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      const basili = el.getAttribute('aria-pressed') || (el.getAttribute('role') === 'switch' ? el.getAttribute('aria-checked') : null);
      if(basili === 'true') tik('kapa');
      else if(basili === 'false') tik('ac');
      else tik('tik');
    }, true);
    document.addEventListener('change', e => {
      const el = e.target;
      if(!tercih.tik || !gercekMi(e) || !el || !el.matches || !el.matches('input[type="checkbox"]')) return;
      tik(el.checked ? 'ac' : 'kapa');
    }, true);
    /* AudioContext ilk dokunuşta kurulur: ilk tık gecikmesin. */
    document.addEventListener('pointerdown', e => { if(tercih.tik && !baglam && gercekMi(e)) sesBaglami(true); }, true);

    /* «Dokun, sürsün»: tarayıcı kendiliğinden çalmayı reddettiyse ilk
       dokunuşta müzik devam eder. ♪ ve panel HARİÇ: onların kendi işi var
       (♪ sürdürür; paneldeki Çal da). Yoksa pointerup burada çalmayı
       başlatır, düğmenin click'i «çalıyor» görüp durdururdu. */
    const surdur = e => {
      if(hal !== 'dokun' || !gercekMi(e)) return;
      if(e.type === 'keydown' && e.key === 'Escape') return;
      if(e.target && e.target.closest && e.target.closest('.ust__ses, [data-ses-panel]')) return;
      cal();
    };
    document.addEventListener('pointerup', surdur, true);
    document.addEventListener('keydown', surdur, true);

    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const d = t.closest('.ust__ses');
      if(d){
        e.preventDefault();
        if(hal === 'dokun'){ cal(); return; }
        panelAcKapa(d);
        return;
      }
      if(!t.closest('[data-ses-panel]')) return;
      const tr = t.closest('[data-ses-tur]');
      if(tr){ turSec(tr.getAttribute('data-ses-tur')); return; }
      const is = t.closest('[data-ses]');
      if(!is) return;
      const ad = is.getAttribute('data-ses');
      if(ad === 'cal'){ if(calarMi()) durdur(); else cal(); }
      else if(ad === 'sonraki') sonraki();
      else if(ad === 'tik'){
        const ac = !tercih.tik;
        tikAc(ac);
        if(ac) tik('ac');
      }
    });
    document.addEventListener('input', e => {
      const r = e.target;
      if(r && r.matches && r.matches('[data-ses-panel] [data-ses="duzey"]')) sesAyarla(Number(r.value) / 100);
    });

    /* «Kaydedildi» bildirimi: tek yumuşak nota (yalnız kurulu bağlamla). */
    const kur = () => {
      const kok = document.getElementById('toast-root');
      if(!kok || typeof MutationObserver === 'undefined') return;
      new MutationObserver(ms => {
        if(!tercih.tik) return;
        if(ms.some(m => Array.from(m.addedNodes).some(n => n.classList && n.classList.contains('toast')))) tik('tamam', false);
      }).observe(kok, { childList:true });
    };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur); else kur();

    /* Bağlantı kısa sürede geri gelirse (damga taze) çalan radyo sürer;
       uyku ya da saatler süren kopukluktan sonra kendiliğinden başlamaz. */
    window.addEventListener('online', () => {
      if(hal === 'baglantiyok' && tercih.caliyordu && Date.now() - tercih.caliyordu <= TAZE) cal();
    });
    window.addEventListener('offline', () => { if(calarMi()){ deneme++; bekciDur(); birak(); hal = 'baglantiyok'; guncelle(); } });
    window.addEventListener('pagehide', sayfadanCik);
  }

  /* ---------------------------------------------------------- test kancaları */

  function _ortam(o){ ortam = Object.assign({}, VARSAYILAN_ORTAM, o || {}); }
  /* Bellekteki durumu sıfırlar ve tercihi depodan yeniden okur. Depoya
     YAZMAZ: «çalıyordu» damgası olduğu gibi kalır. */
  function _sifirla(){
    deneme++;
    bekciDur();
    birak();
    oge = null;
    devredildi = false;
    hal = 'kapali';
    aktif = null;
    liste = [];
    sira = 0;
    kalanDeneme = 0;
    Object.keys(yedekler).forEach(k => delete yedekler[k]);
    Object.keys(yedekSoruldu).forEach(k => delete yedekSoruldu[k]);
    baglamKapat();
    tercih = tercihOku();
    guncelle();
  }

  bagla();
  L.SES = Object.freeze({
    ANAHTAR, TURLER,
    tercih:() => JSON.parse(JSON.stringify(tercih)),
    durum, dugme, panelHtml,
    cal, durdur, sonraki, turSec, sesAyarla, tikAc, tik, devret,
    _ortam, _sifirla, _acilis:acilis, _sayfadanCik:sayfadanCik,
  });
  /* Başka modülde çalıyorduysa: gövde hazır olunca sürdürmeyi dene. */
  if(typeof document !== 'undefined'){
    const basla = () => { try{ acilis(); }catch(e){} };
    if(document.body) basla(); else document.addEventListener('DOMContentLoaded', basla);
  }
})();
