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
  const SPOTIFY_EN_COK = 20;

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
    cerceve:null,
  };
  let ortam = Object.assign({}, VARSAYILAN_ORTAM);
  function cevrimici(){
    if(ortam.cevrimici) return !!ortam.cevrimici();
    try{ return navigator.onLine !== false; }catch(e){ return true; }
  }

  /* ---------------------------------------------------------- tercih */

  function bosTercih(){
    return { tur:'chill', ses:0.6, tik:false, son:{}, caliyordu:0, sekme:'radyo', spotify:[], spotifySecili:null };
  }
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
    if(d.sekme === 'spotify') t.sekme = 'spotify';
    if(Array.isArray(d.spotify)) t.spotify = d.spotify.filter(x => x && /^[A-Za-z0-9]{22}$/.test(x.id)
      && (x.tur === 'playlist' || x.tur === 'album')).slice(0, SPOTIFY_EN_COK)
      .map(x => ({ id:x.id, tur:x.tur, ad:String(x.ad || 'Spotify listesi').slice(0, 60) }));
    if(t.spotify.some(x => x.id === d.spotifySecili)) t.spotifySecili = d.spotifySecili;
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
    const etiket = hal === 'caliyor' ? 'Müzik ve sesler — çalıyor: ' + (aktif ? aktif.ad : '')
      : hal === 'dokun' ? 'Müzik bekliyor — dokun, sürsün'
      : 'Müzik ve sesler';
    const ipucu = hal === 'caliyor' ? (aktif ? aktif.ad : 'Müzik') : hal === 'dokun' ? 'Dokun, sürsün' : 'Müzik';
    return { sinif, etiket, ipucu };
  }

  const SIMGE_CAL = '<svg class="ses__sim" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
  const SIMGE_DUR = '<svg class="ses__sim" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="7" y="6" width="3.5" height="12" rx="1"/><rect x="13.5" y="6" width="3.5" height="12" rx="1"/></svg>';

  const SIMGE_LISTE = '<svg class="ses__sim" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6.5h11M4 11.5h11M4 16.5h7"/><path d="M17.5 18.5V9l3-1"/><circle cx="15.8" cy="18.5" r="1.8"/></svg>';
  const SIMGE_SIL = '<svg class="ses__sim" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 7l10 10M17 7L7 17"/></svg>';

  function sekmeDugme(id, ad){
    const on = tercih.sekme === id;
    return '<button type="button" class="' + (on ? 'is-on' : '') + '" data-ses-sekme="' + id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + ad + '</button>';
  }
  function spotifyHtml(){
    const l = tercih.spotify, sec = tercih.spotifySecili;
    const secili = l.find(x => x.id === sec);
    const liste = l.length
      ? '<ul class="ses__listeler">' + l.map(x => '<li class="ses__liste' + (x.id === sec ? ' is-on' : '') + '">'
          + '<button type="button" class="ses__liste-ad" data-sp-sec="' + x.id + '" aria-pressed="' + (x.id === sec ? 'true' : 'false') + '">'
          + SIMGE_LISTE + '<span>' + kac(x.ad) + '</span></button>'
          + '<button type="button" class="ses__liste-sil" data-sp-sil="' + x.id + '" aria-label="' + kac(x.ad + ' listesini kaldır') + '" title="Kaldır">'
          + SIMGE_SIL + '</button></li>').join('') + '</ul>'
      : '<p class="ses__bos">Henüz liste yok. Spotify\'da listeyi aç: Paylaş › Bağlantıyı kopyala, sonra buraya yapıştır.</p>';
    return liste
      + '<div class="ses__oynatici' + (secili ? ' is-dolu' : '') + '">' + (secili ? '' : (l.length ? '<span>Dinlemek için bir liste seç</span>' : '')) + '</div>'
      + '<div class="ses__ekle"><input type="url" inputmode="url" data-sp-ekle placeholder="open.spotify.com/playlist/…" aria-label="Spotify liste bağlantısı">'
      +   '<button type="button" class="ses__ekle-dugme" data-sp="ekle">Ekle</button></div>'
      + '<p class="ses__sp-not" role="status" aria-live="polite"></p>';
  }

  function panelHtml(){
    const sp = tercih.sekme === 'spotify';
    return '<div class="katman kmenu kmenu--ses" role="dialog" aria-label="Müzik ve sesler" data-ses-panel>'
      + '<p class="kmenu__bas">Müzik</p>'
      + '<div class="seg seg--block ses__sekmeler" role="group" aria-label="Kaynak">' + sekmeDugme('radyo', 'Radyo') + sekmeDugme('spotify', 'Spotify') + '</div>'
      + '<div class="ses__radyo"' + (sp ? ' hidden' : '') + '>'
      +   '<div class="ses__turler" role="group" aria-label="Tür">'
      +     TURLER.map(t => '<button type="button" class="ses__tur' + (t.id === tercih.tur ? ' is-on' : '') + '" data-ses-tur="' + t.id + '"'
            + ' aria-pressed="' + (t.id === tercih.tur ? 'true' : 'false') + '">' + kac(t.ad) + '</button>').join('')
      +   '</div>'
      +   '<p class="ses__simdi' + (hal === 'caliyor' ? ' is-caliyor' : '') + '" role="status" aria-live="polite">' + kac(mesaj()) + '</p>'
      +   '<div class="ses__eylem">'
      +     '<button type="button" class="ses__cal" data-ses="cal">' + (calarMi() ? SIMGE_DUR + 'Durdur' : SIMGE_CAL + 'Çal') + '</button>'
      +     '<button type="button" class="ses__sonraki" data-ses="sonraki">Sonraki istasyon</button>'
      +   '</div>'
      +   '<label class="ses__duzey"><span>Ses</span>'
      +     '<input type="range" min="0" max="100" step="1" value="' + Math.round(tercih.ses * 100) + '" data-ses="duzey" aria-label="Ses düzeyi"></label>'
      + '</div>'
      + '<div class="ses__spotify"' + (sp ? '' : ' hidden') + '>' + spotifyHtml() + '</div>'
      + '<div class="ses__satir"><span id="ses-tik-ad">Tık sesleri</span>'
      +   '<button type="button" class="ses__anahtar" data-ses="tik" role="switch" aria-labelledby="ses-tik-ad ses-tik-deger"'
      +     ' aria-checked="' + (tercih.tik ? 'true' : 'false') + '"><span id="ses-tik-deger">' + (tercih.tik ? 'Açık' : 'Kapalı') + '</span></button>'
      + '</div>'
      + '</div>';
  }

  /* ---------------------------------------------------------- spotify

     Kullanıcı (2026-10-03): «radyo kanallarının yanında birden fazla
     Spotify listesi de ekleyebilelim; bu listeleri görebileceğimiz bir
     bölüm olsun». Liste Spotify'ın KENDİ gömme oynatıcısıyla çalar
     (open.spotify.com/embed): şarkı listesi orada görünür, çalma orada
     yönetilir. Tarayıcıda Spotify hesabı açıksa tam şarkı, değilse
     Spotify'ın kendi kısıtı geçerlidir — bunu Spotify belirler.

     Oynatıcı TEK ve document.body'dedir (radyonun <audio>'su gibi): panel
     açıkken paneldeki yerin (.ses__oynatici) TAM ÜSTÜNE oturur, panel
     kapanınca ekran dışına çekilir ve çalmaya devam eder. Taşımak olmazdı:
     DOM'da yeri değişen iframe baştan yüklenir, müzik kesilir.

     Ağa yalnız kullanıcı istediğinde çıkılır: liste eklenince adı için bir
     kez oEmbed, liste seçilince (ya da panel seçili listeyle açılınca)
     oynatıcı. Liste radyo seçilince durmaz (Spotify'ın içini göremeyiz);
     liste seçilince radyo durur: iki müzik üst üste çalmasın. */
  function spotifyCoz(metin){
    const s = String(metin || '').trim();
    let m = /^spotify:(playlist|album):([A-Za-z0-9]{22})$/.exec(s);
    if(m) return { tur:m[1], id:m[2] };
    m = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?(?:embed\/)?(playlist|album)\/([A-Za-z0-9]{22})(?:[/?#].*)?$/i.exec(s);
    return m ? { tur:m[1].toLowerCase(), id:m[2] } : null;
  }
  function spotifyAdres(l){ return 'https://open.spotify.com/embed/' + l.tur + '/' + l.id; }
  function spotifyAdi(l){
    const yedek = l.tur === 'album' ? 'Spotify albümü' : 'Spotify listesi';
    const getir = ortam.fetch || (typeof fetch === 'function' ? fetch.bind(window) : null);
    if(!getir) return Promise.resolve(yedek);
    const url = 'https://open.spotify.com/oembed?url=' + encodeURIComponent('https://open.spotify.com/' + l.tur + '/' + l.id);
    let iptal = null, zaman = null;
    try{ iptal = new AbortController(); zaman = setTimeout(() => iptal.abort(), 6000); }catch(e){}
    return Promise.resolve()
      .then(() => getir(url, iptal ? { signal:iptal.signal } : {}))
      .then(r => r && r.ok ? r.json() : null)
      .then(v => { const ad = v && typeof v.title === 'string' ? v.title.trim().slice(0, 60) : ''; return ad || yedek; })
      .catch(() => yedek)
      .then(v => { if(zaman) clearTimeout(zaman); return v; });
  }
  async function spotifyEkle(metin){
    const l = spotifyCoz(metin);
    if(!l) return { ok:false, mesaj:'Bu bir Spotify liste bağlantısı değil' };
    if(tercih.spotify.some(x => x.id === l.id)) return { ok:false, mesaj:'Bu liste zaten ekli' };
    if(tercih.spotify.length >= SPOTIFY_EN_COK) return { ok:false, mesaj:'En çok ' + SPOTIFY_EN_COK + ' liste eklenir' };
    const ad = await spotifyAdi(l);
    if(tercih.spotify.some(x => x.id === l.id)) return { ok:false, mesaj:'Bu liste zaten ekli' };
    const yeni = { id:l.id, tur:l.tur, ad };
    tercihYaz({ spotify:tercih.spotify.concat([yeni]) });
    panelYenile();
    return { ok:true, liste:yeni };
  }

  let spKap = null;
  function spotifyKap(){
    if(spKap && spKap.isConnected) return spKap;
    spKap = document.getElementById('lifeos-spotify');
    if(!spKap){
      spKap = document.createElement('div');
      spKap.id = 'lifeos-spotify';
      spKap.className = 'spotify-kap';
      document.body.appendChild(spKap);
    }
    return spKap;
  }
  function cerceveKur(l){
    const kap = spotifyKap();
    const src = spotifyAdres(l);
    const eski = kap.querySelector('iframe');
    if(eski && kap.getAttribute('data-liste') === l.id) return eski;
    kap.innerHTML = '';
    let f;
    if(ortam.cerceve) f = ortam.cerceve(src);
    else{ f = document.createElement('iframe'); f.src = src; }
    f.setAttribute('title', 'Spotify: ' + l.ad);
    f.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
    f.setAttribute('loading', 'lazy');
    f.className = 'spotify-kap__cerceve';
    kap.appendChild(f);
    kap.setAttribute('data-liste', l.id);
    return f;
  }
  function spotifySec(id){
    const l = tercih.spotify.find(x => x.id === id);
    if(!l) return false;
    if(calarMi() || hal === 'dokun') durdur();
    tercihYaz({ spotifySecili:id });
    cerceveKur(l);
    panelYenile();
    return true;
  }
  function spotifySil(id){
    const secili = tercih.spotifySecili === id;
    tercihYaz({ spotify:tercih.spotify.filter(x => x.id !== id), spotifySecili:secili ? null : tercih.spotifySecili });
    if(secili && spKap){ spKap.innerHTML = ''; spKap.removeAttribute('data-liste'); }
    panelYenile();
    return true;
  }
  function sekmeSec(s){
    if(s !== 'radyo' && s !== 'spotify') return false;
    tercihYaz({ sekme:s });
    panelYenile();
    return true;
  }

  /* Oynatıcıyı paneldeki yerin üstüne oturtur; yer yoksa (panel kapalı,
     Radyo sekmesi) ekran dışına çeker. Panel açıkken her karede bir kez
     (panel açılırken kayar, kendi içinde kaydırılabilir). */
  let yerKare = 0;
  function spotifyYerlestir(){
    if(typeof document === 'undefined') return;
    const yer = document.querySelector('[data-ses-panel] .ses__oynatici.is-dolu');
    const gorunur = yer && yer.getClientRects().length > 0;
    if(gorunur){
      const l = tercih.spotify.find(x => x.id === tercih.spotifySecili);
      if(l) cerceveKur(l);
    }
    if(!spKap) return;
    if(gorunur){
      const r = yer.getBoundingClientRect();
      spKap.style.left = Math.round(r.left) + 'px';
      spKap.style.top = Math.round(r.top) + 'px';
      spKap.style.width = Math.round(r.width) + 'px';
      spKap.style.height = Math.round(r.height) + 'px';
      spKap.classList.add('is-yerinde');
      if(!yerKare && typeof requestAnimationFrame === 'function') yerKare = requestAnimationFrame(() => { yerKare = 0; spotifyYerlestir(); });
    }else{
      spKap.classList.remove('is-yerinde');
      spKap.style.left = '-10000px';
    }
  }

  /* Panel açıkken içerik değişti (liste eklendi/silindi, sekme): panel
     yerinde yeniden çizilir, kenardaki düğmeye göre yeniden yerleşir ve
     odak aynı denetime döner. */
  let sonCapa = null;
  function panelYenile(){
    const K = L.KABUK;
    if(typeof document === 'undefined' || !K || !K.katmanAcik('kabuk-ses')){ spotifyYerlestir(); return; }
    const odak = document.activeElement;
    const odakSecici = odak && odak.closest && odak.closest('[data-ses-panel]')
      ? ['data-ses-sekme', 'data-sp-sec', 'data-sp', 'data-ses'].map(a => odak.hasAttribute(a) ? '[' + a + '="' + odak.getAttribute(a) + '"]' : '').find(Boolean)
        || (odak.hasAttribute('data-sp-ekle') ? '[data-sp-ekle]' : null)
      : null;
    K.katmanTazele('kabuk-ses', panelHtml());
    const p = document.getElementById('kabuk-ses');
    if(p && sonCapa && sonCapa.isConnected && K.capaYerlestir) K.capaYerlestir(p, sonCapa);
    if(p && odakSecici){ const o = p.querySelector(odakSecici); if(o) try{ o.focus({ preventScroll:true }); }catch(e){} }
    spotifyYerlestir();
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
    if(K.katmanAcik('kabuk-ses')){ K.katmanKapat(); spotifyYerlestir(); return; }
    sonCapa = dugmeEl;
    K.katmanAc('kabuk-ses', panelHtml(), dugmeEl);
    spotifyYerlestir();
  }

  async function ekleGirdisi(panel){
    const g = panel && panel.querySelector('[data-sp-ekle]');
    const not = panel && panel.querySelector('.ses__sp-not');
    if(!g) return;
    if(!g.value.trim()){ if(not) not.textContent = 'Önce Spotify bağlantısını yapıştır'; return; }
    if(!cevrimici()){ if(not) not.textContent = 'Bağlantı yok'; return; }
    if(not) not.textContent = 'Ekleniyor…';
    const r = await spotifyEkle(g.value);
    if(!r.ok){
      const p2 = document.querySelector('[data-ses-panel] .ses__sp-not');
      if(p2) p2.textContent = r.mesaj;
      return;
    }
    spotifySec(r.liste.id);
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
      const sk = t.closest('[data-ses-sekme]');
      if(sk){ sekmeSec(sk.getAttribute('data-ses-sekme')); return; }
      const ss = t.closest('[data-sp-sec]');
      if(ss){ spotifySec(ss.getAttribute('data-sp-sec')); return; }
      const sl = t.closest('[data-sp-sil]');
      if(sl){ spotifySil(sl.getAttribute('data-sp-sil')); return; }
      if(t.closest('[data-sp="ekle"]')){ ekleGirdisi(t.closest('[data-ses-panel]')); return; }
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
    document.addEventListener('keydown', e => {
      const g = e.target;
      if(e.key === 'Enter' && g && g.matches && g.matches('[data-ses-panel] [data-sp-ekle]')){ e.preventDefault(); ekleGirdisi(g.closest('[data-ses-panel]')); }
    });
    /* Panel kapanınca (dışarı tık, Esc, başka panel) oynatıcı ekran dışına. */
    document.addEventListener('mousedown', () => setTimeout(spotifyYerlestir, 0), true);
    document.addEventListener('keydown', e => { if(e.key === 'Escape') setTimeout(spotifyYerlestir, 0); }, true);
    window.addEventListener('resize', () => spotifyYerlestir());
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
    if(spKap){ spKap.remove(); spKap = null; }
    tercih = tercihOku();
    guncelle();
  }

  bagla();
  L.SES = Object.freeze({
    ANAHTAR, TURLER,
    tercih:() => JSON.parse(JSON.stringify(tercih)),
    durum, dugme, panelHtml,
    cal, durdur, sonraki, turSec, sesAyarla, tikAc, tik, devret,
    spotifyCoz, spotifyAdres, spotifyEkle, spotifySec, spotifySil, sekmeSec,
    _ortam, _sifirla, _acilis:acilis, _sayfadanCik:sayfadanCik,
  });
  /* Başka modülde çalıyorduysa: gövde hazır olunca sürdürmeyi dene. */
  if(typeof document !== 'undefined'){
    const basla = () => { try{ acilis(); }catch(e){} };
    if(document.body) basla(); else document.addEventListener('DOMContentLoaded', basla);
  }
})();
