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
     `ara`: liste tükenirse radio-browser'a sorulan süzgeç; `haric`: etiketi
     buna uyan yedek akış alınmaz (sakin türe dans/pop girmesin, 2026-10-29).
     2026-10-29 akış başlıklarıyla (icy-name) denetlendi: bigFM US Rap adresi
     «bigFM 2000er» (pop) veriyordu, SomaFM ice6 403 dönüyordu. */
  const TURLER = Object.freeze([
    { id:'chill', ad:'Chill', ara:{ tag:'chillout' }, haric:/pop|dance|club|hits|rap|hip.?hop|rock|metal/i, istasyonlar:[
      { ad:'SomaFM Groove Salad', url:'https://ice2.somafm.com/groovesalad-128-mp3' },
      { ad:'FluxFM Chillhop', url:'https://streams.fluxfm.de/Chillhop/mp3-320/streams.fluxfm.de/' },
      { ad:'0R Lo-Fi', url:'https://0nlineradio.radioho.st/0r-lo-fi' },
    ] },
    { id:'tr-pop', ad:'Türkçe Pop', ara:{ tag:'pop', countrycode:'TR' }, istasyonlar:[
      { ad:'Radyo Fenomen', url:'https://live.radyofenomen.com/fenomen/128/icecast.audio' },
      { ad:'Power Türk', url:'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio' },
      { ad:'Radyo Viva', url:'https://radyoviva.radyotvonline.net/radyovivaaac' },
      { ad:'Süper FM', url:'https://playerservices.streamtheworld.com/api/livestream-redirect/SUPER_FM_SC' },
    ] },
    { id:'tr-slow', ad:'Türkçe Slow', ara:{ tag:'slow', countrycode:'TR' }, haric:/dance|club|rap|hip.?hop|rock|metal|arabesk/i, istasyonlar:[
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
    { id:'en-slow', ad:'İngilizce Slow', ara:{ tag:'love songs', language:'english' }, haric:/dance|club|rap|hip.?hop|rock|metal/i, istasyonlar:[
      { ad:'Joy FM', url:'https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_FM_SC' },
      { ad:'Power Love', url:'https://listen.powerapp.com.tr/powerlove/mpeg/icecast.audio' },
    ] },
    { id:'en-rap', ad:'İngilizce Rap', ara:{ tag:'hip-hop', language:'english' }, istasyonlar:[
      { ad:'90s90s Hip Hop', url:'https://streams.90s90s.de/hiphop/mp3-192/streams.90s90s.de/' },
      { ad:'bigFM US Rap', url:'https://streams.bigfm.de/bigfm-usrap-128-mp3' },
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

  /* Arayüz sesleri varsayılan AÇIK (kullanıcı, 2026-10-27: «sistemde ses de
     olsun; tıklama, sayfa açılma, miniklere dokununca tatlı sesler»).
     surum 2'den eski kayıttaki «kapalı» bir kez açılır; sonraki seçim korunur. */
  const SES_SURUM = 2;
  function bosTercih(){ return { tur:'chill', ses:0.6, tik:true, son:{}, caliyordu:0, surum:SES_SURUM }; }
  function tercihOku(){
    const t = bosTercih();
    let d = null;
    try{ d = JSON.parse(localStorage.getItem(ANAHTAR) || 'null'); }catch(e){ d = null; }
    if(!d || typeof d !== 'object') return t;
    if(TURLER.some(x => x.id === d.tur)) t.tur = d.tur;
    if(typeof d.ses === 'number' && d.ses >= 0 && d.ses <= 1) t.ses = d.ses;
    t.tik = d.surum === SES_SURUM ? d.tik === true : true;
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
        .filter(s => !(t.haric && t.haric.test(String(s.tags || '') + ' ' + String(s.name || ''))))
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

     «Tok, kısa» (2026-10-02); «daha profesyonel», «zayıf ve tırmalıyor» (2026-10-28). Dosya
     yok: her ses birkaç katmanlı küçük bir sentezdir. Katman türleri:
       tel      Karplus–Strong: süzülmüş gürültü bir gecikme halkasında
                söner — yumuşak naylon tel / kalimba (notalar)
       ton      sinüs; perdesi yukarı kıvrılırsa suda kabarcık «blup»
       keçe     alçak geçiren süzgeçten kısa gürültü: keçeye dokunuş, adım
       hisirti  bant süzgeçli gürültü (hava)
     Alanlar: t gecikme sn · f [başlangıç, bitiş] Hz · d süre sn · g tepe
     kazanç · a yükselme sn · suz süzgeç Hz · q · oda yankı payı ·
     parlak tel teli (0–1: koparmanın parlaklığı).
     Hepsi ortak bir çıkıştan geçer: sıcak alçak geçiren (2 kHz), kısa
     oda yankısı (üretilmiş, dosya yok) ve yumuşak bir sıkıştırıcı — sesler
     aynı odada çalıyor gibi durur, üst üste binince patlamaz. Her çalışta
     perde ±%2 oynar: aynı tık art arda makineli tüfek gibi duyulmaz. */
  /* Dördüncü tur (2026-10-28, «hâlâ elektronik; soft ve yumuşak değil»):
     osilatör ne yapılsa elektronik duyuluyordu (üçgen dalga, formant,
     titreşim). Notalar artık tel, minik sesleri kabarcık, dokunuş keçe;
     tonlu hiçbir katman 4 ms'den hızlı başlamaz. */
  const SESLER = Object.freeze({
    /* Dokunuş: keçeye parmak ucu — boğuk kısa vuruş + alttan hafif ağırlık. */
    tik:  [{ t:0, tur:'kece', f:[1800, 600], q:0.8, d:0.03, g:0.3, a:0.002 },
           { t:0, tur:'ton', dalga:'sine', f:[190, 120], d:0.05, g:0.22, a:0.005 }],
    /* Aç/kapa: iki notalık yumuşak tel (G4 ↔ D5); aç yükselir, kapa iner. */
    ac:   [{ t:0, tur:'tel', f:[392], d:0.5, g:0.22, a:0.004, oda:0.15, parlak:0.45 },
           { t:0.07, tur:'tel', f:[587], d:0.6, g:0.2, a:0.004, oda:0.18, parlak:0.45 }],
    kapa: [{ t:0, tur:'tel', f:[587], d:0.5, g:0.2, a:0.004, oda:0.15, parlak:0.45 },
           { t:0.07, tur:'tel', f:[392], d:0.6, g:0.22, a:0.004, oda:0.18, parlak:0.45 }],
    /* Kaydedildi: tel üzerinde yumuşak bir arpej (C5 · E5 · G5). */
    /* Uyarı (hata bildirimi): yumuşak, iki nota aşağı; sert değil. */
    uyari:[{ t:0, tur:'tel', f:[494], d:0.5, g:0.17, a:0.006, oda:0.2, parlak:0.35 },
           { t:0.12, tur:'tel', f:[392], d:0.6, g:0.15, a:0.006, oda:0.22, parlak:0.35 }],
    tamam:[{ t:0, tur:'tel', f:[523], d:0.8, g:0.2, a:0.004, oda:0.25, parlak:0.5 },
           { t:0.09, tur:'tel', f:[659], d:0.8, g:0.18, a:0.004, oda:0.25, parlak:0.5 },
           { t:0.18, tur:'tel', f:[784], d:0.8, g:0.16, a:0.004, oda:0.3, parlak:0.5 }],
    /* Sayfa açılınca: camın üstünden geçen hava — alçaktan açılan yumuşak keçe. */
    sayfa:[{ t:0, tur:'kece', f:[300, 1100], q:0.6, d:0.3, g:0.2, a:0.12, oda:0.3 }],
    /* Gıdık: suda dört kabarcık, her biri biraz daha ince («blup-blup-blip»). */
    gidik:[{ t:0, tur:'ton', dalga:'sine', f:[420, 760], d:0.07, g:0.16, a:0.006 },
           { t:0.1, tur:'ton', dalga:'sine', f:[460, 840], d:0.07, g:0.15, a:0.006 },
           { t:0.2, tur:'ton', dalga:'sine', f:[500, 920], d:0.07, g:0.14, a:0.006 },
           { t:0.31, tur:'ton', dalga:'sine', f:[540, 1000], d:0.09, g:0.13, a:0.006, oda:0.15 }],
    /* Kızan minik: «pfff» — burnundan boğuk bir üfleme ve alçak bir blup. */
    hirr: [{ t:0, tur:'kece', f:[1100, 350], q:0.7, d:0.12, g:0.3, a:0.01 },
           { t:0.02, tur:'ton', dalga:'sine', f:[240, 320], d:0.1, g:0.18, a:0.008 }],
    /* Minik adımı: yumuşak pati — boğuk, kısık, çoğu odadan (uzakta gibi). */
    adim: [{ t:0, tur:'kece', f:[700, 250], q:0.7, d:0.04, g:0.06, a:0.004, oda:0.3 },
           { t:0, tur:'ton', dalga:'sine', f:[130, 90], d:0.05, g:0.05, a:0.005, oda:0.3 }],
    /* Minik sohbeti: üç küçük kabarcık, ezgili; arkada kalır. */
    bla:  [{ t:0, tur:'ton', dalga:'sine', f:[380, 560], d:0.06, g:0.13, a:0.006 },
           { t:0.11, tur:'ton', dalga:'sine', f:[440, 620], d:0.06, g:0.13, a:0.006 },
           { t:0.22, tur:'ton', dalga:'sine', f:[400, 600], d:0.07, g:0.12, a:0.006, oda:0.1 }],
  });
  const TAVAN = 2000;        // hiçbir süzgeç bunun üstüne çıkmaz (Hz)
  const ARA = 0.04;          // aynı ses bundan sık çalmaz (sn)
  const KAYIT_TAVAN = 5500;  // kayıtların yumuşak tavanı: tizlik törpülenir, boğulmaz (sentez 2 kHz'de kalır)
  /* AİLELER ve AYRINTILI DÜZEY (kullanıcı, 2026-10-28: «ayarlarda ses kısmında
     her şeyini detaylı ayarlayabilelim: yürümenin sesinin yüksekliği, agentların
     konuşmasının sesi, sistemdeki tüm sesler»). Her tür bir aileye bağlıdır;
     ailenin düzeyi genel düzeyle çarpılır, 0 olan aile hiç çalmaz. Tercih
     `lifeos.ses.duzey` (animasyon.js TASINAN). King'in sesli okuması 'king'. */
  const AILE = Object.freeze({ tik:'dokunus', ac:'gecis', kapa:'gecis', sayfa:'gecis', tamam:'onay', uyari:'onay',
    gidik:'karakter', hirr:'karakter', bla:'karakter', adim:'ortam' });
  const DUZEY_ANAHTAR = 'lifeos.ses.duzey';
  /* GRUPLAR (kullanıcı, 2026-10-29: «genel, ajan, UI seslerini tek seferde kısalım;
     kenar köşesindeki şeye tıklayınca içlerindekini teker teker»): aile ile
     genel arasında bir çarpan daha. Düzey = genel × grup × aile. */
  const GRUP = Object.freeze({ dokunus:'arayuz', gecis:'arayuz', onay:'arayuz', karakter:'ajan', ortam:'ajan', king:'ajan' });
  const DUZEY_VARSAYILAN = Object.freeze({ genel:1, arayuz:1, ajan:1, dokunus:1, gecis:1, onay:1, karakter:.8, ortam:.7, king:1 });
  const DUZEY_AD = Object.freeze({ genel:'Genel', arayuz:'Arayüz', ajan:'Ajanlar ve King', dokunus:'Dokunuş', gecis:'Geçiş ve sayfa', onay:'Onay ve uyarı',
    karakter:'Minik konuşması ve gıdık', ortam:'Minik adımları', king:'King’in sesi' });
  function duzeyler(){
    let v = null;
    try{ v = JSON.parse(localStorage.getItem(DUZEY_ANAHTAR) || 'null'); }catch(e){ v = null; }
    return Object.assign({}, DUZEY_VARSAYILAN, v && typeof v === 'object' ? v : {});
  }
  function duzey(aile){
    const d = duzeyler(), x = k => Math.max(0, Math.min(1, Number(d[k]) || 0));
    if(aile === 'genel' || !(aile in DUZEY_VARSAYILAN)) return x('genel');
    return x('genel') * (GRUP[aile] ? x(GRUP[aile]) : 1) * x(aile);
  }
  function duzeyAyarla(aile, v){
    if(!(aile in DUZEY_VARSAYILAN)) return false;
    const d = duzeyler();
    d[aile] = Math.max(0, Math.min(1, Number(v) || 0));
    try{ localStorage.setItem(DUZEY_ANAHTAR, JSON.stringify(d)); }catch(e){ /* depo kapalı: bu sayfada geçerli değil */ }
    return true;
  }
  const yuzde = y => y ? '%' + y : 'Kapalı';
  function duzeySeciciHtml(){
    const d = duzeyler();
    const satir = k => {
      const y = Math.round(Math.max(0, Math.min(1, Number(d[k]) || 0)) * 100);
      return '<label class="sesduzey__satir"><span class="sesduzey__ad">' + DUZEY_AD[k] + '</span>'
        + '<input type="range" min="0" max="100" step="5" value="' + y + '" data-ses-duzey="' + k + '" aria-valuetext="' + yuzde(y) + '">'
        + '<output class="sesduzey__deger">' + yuzde(y) + '</output></label>';
    };
    /* Ana kaydırıcı görünür; ailelerin tek tek düzeyi kapalı «Ayrıntı»da. */
    const grup = g => '<div class="sesduzey__grup">' + satir(g)
      + '<details class="sesduzey__ayrinti"><summary>Ayrıntı</summary>'
      + Object.keys(GRUP).filter(k => GRUP[k] === g).map(satir).join('') + '</details></div>';
    return '<div class="sesduzey" role="group" aria-label="Ses düzeyleri">' + satir('genel') + grup('arayuz') + grup('ajan') + '</div>';
  }
  let sonDokunus = -1, sonOnay = -9;
  /* Göç (bir kez): eski «Minik sesleri» aç/kapa düğmeleri kalktı; kapalı olan
     aile kaydırıcıda «Kapalı» görünsün, yeniden açılabilsin. */
  try{
    const eski = typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('lifeos.minik.ses') || 'null');
    if(eski && typeof eski === 'object'){
      const d = duzeyler();
      if(eski.adim === false) d.ortam = 0;
      if(eski.konusma === false && eski.gidik === false) d.karakter = 0;
      localStorage.setItem(DUZEY_ANAHTAR, JSON.stringify(d));
      localStorage.removeItem('lifeos.minik.ses');
    }
  }catch(e){ /* depo kapalı */ }
  let baglam = null;
  let zincir = null;
  let sonBitis = 0;
  const sonCal = {};

  /* Bağlamı ASKIDA kurar (resume yok). Sayfa açılınca boşta çağrılır: `new
     AudioContext()` Windows'ta ses aygıtını o an kurar (~180 ms); ilk dokunuşta
     kurulunca ilk tık 470-700 ms sürüyordu (2026-10-29). Dokunuş yalnız resume eder. */
  function onKur(){
    if(!tercih.tik || baglam) return false;
    const C = ortam.AudioContext || (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext));
    if(!C) return false;
    try{ baglam = new C(); }catch(e){ return false; }
    kayitHazirla(baglam);
    return true;
  }
  /* kur: AudioContext yoksa kurulsun mu? Çalmak için kullanıcının dokunuşu
     gerekir (tarayıcı başka türlü askıda tutar). */
  function sesBaglami(kur){
    if(!tercih.tik) return null;
    if(!baglam){
      if(!kur || !onKur()) return null;
    }
    if(baglam.state === 'suspended' && baglam.resume){ try{ baglam.resume(); }catch(e){} }
    return baglam;
  }

  /* Ortak çıkış (bağlamda bir kez): giriş → sıkıştırıcı → hoparlör; yankı
     gönderisi → kısa oda → sıkıştırıcı. Bağlam bir düğümü tanımıyorsa
     (eski tarayıcı) o halka atlanır, ses yine çalar. */
  function zincirKur(c){
    if(zincir && zincir.c === c) return zincir;
    let hedef = c.destination;
    try{
      if(c.createDynamicsCompressor){
        const k = c.createDynamicsCompressor();
        k.threshold.value = -12; k.knee.value = 8; k.ratio.value = 4; k.attack.value = 0.002; k.release.value = 0.15;
        k.connect(c.destination);
        hedef = k;
        var sikistirici = k;
      }
      if(c.createBiquadFilter){
        const s = c.createBiquadFilter();
        s.type = 'lowpass'; s.frequency.setValueAtTime(TAVAN, 0); s.Q.value = 0.5;
        s.connect(hedef);
        hedef = s;
      }
    }catch(e){ hedef = c.destination; }
    /* Kayıtların ayrı ve yumuşak yolu: 2 kHz tavan tiz kayıtları boğup
       kısıyordu (ölçüldü: tık 10,7, aç 9,9, kapa 15,7 LU kayıp). */
    let kayit = hedef;
    try{
      if(c.createBiquadFilter && hedef !== c.destination){
        const s2 = c.createBiquadFilter();
        s2.type = 'lowpass'; s2.frequency.setValueAtTime(KAYIT_TAVAN, 0); s2.Q.value = 0.5;
        s2.connect(typeof sikistirici !== 'undefined' ? sikistirici : c.destination);
        kayit = s2;
      }
    }catch(e){ kayit = hedef; }
    let oda = null;
    try{
      if(c.createConvolver && c.createBuffer){
        /* Kısa oda: 0,7 sn, üstel sönen ve gittikçe yumuşayan gürültü. */
        const sr = c.sampleRate || 44100, n = Math.floor(sr * 0.7);
        const ir = c.createBuffer(2, n, sr);
        for(let k = 0; k < 2; k++){
          const v = ir.getChannelData(k);
          let once = 0;
          for(let i = 0; i < n; i++){
            const x = i / n, yumusa = 0.25 + 0.7 * x;
            once = once + (Math.random() * 2 - 1 - once) * (1 - yumusa);
            v[i] = once * Math.pow(1 - x, 3.2);
          }
        }
        oda = c.createConvolver();
        oda.buffer = ir;
        const og = c.createGain();
        og.gain.value = 0.5;
        oda.connect(og); og.connect(hedef);
      }
    }catch(e){ oda = null; }
    let gurultu = null;
    try{
      if(c.createBuffer){
        const sr = c.sampleRate || 44100;
        gurultu = c.createBuffer(1, Math.floor(sr * 0.4), sr);
        const v = gurultu.getChannelData(0);
        for(let i = 0; i < v.length; i++) v[i] = Math.random() * 2 - 1;
      }
    }catch(e){ gurultu = null; }
    zincir = { c, hedef, oda, gurultu, kayit:(typeof sikistirici !== 'undefined' && kayit !== hedef) ? kayit : hedef };
    return zincir;
  }

  function zarf(c, g, t, tepe, yuksel, sure){
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(tepe, t + Math.max(0.001, yuksel));
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
  }
  function suzgec(c, tur, f, q, t){
    if(!c.createBiquadFilter) return null;
    const s = c.createBiquadFilter();
    s.type = tur;
    s.frequency.setValueAtTime(f, t);
    if(q != null) s.Q.value = q;
    return s;
  }

  function katman(c, z, t, k, perde){
    const f0 = k.f[0] * perde, f1 = (k.f[1] || k.f[0]) * perde;
    const g = c.createGain();
    zarf(c, g, t, k.g, k.a || 0.003, k.d);
    g.connect(z.hedef);
    if(k.oda && z.oda){ const s = c.createGain(); s.gain.value = k.oda; g.connect(s); s.connect(z.oda); }
    let kaynak;
    if(k.tur === 'tel'){
      if(!c.createBufferSource) return;
      kaynak = c.createBufferSource();
      kaynak.buffer = telTampon(c, f0, k.d + 0.05, k.parlak == null ? 0.5 : k.parlak);
      const b = suzgec(c, 'lowpass', Math.min(TAVAN, f0 * 3), 0.5, t);
      if(b){ kaynak.connect(b); b.connect(g); } else kaynak.connect(g);
    } else if(k.tur === 'hisirti' || k.tur === 'kece'){
      if(!z.gurultu || !c.createBufferSource) return;
      kaynak = c.createBufferSource();
      kaynak.buffer = z.gurultu;
      const b = suzgec(c, k.tur === 'kece' ? 'lowpass' : 'bandpass', Math.min(TAVAN, f0), k.q == null ? 1 : k.q, t);
      if(b){
        if(f1 !== f0) b.frequency.exponentialRampToValueAtTime(Math.min(TAVAN, f1), t + k.d);
        kaynak.connect(b); b.connect(g);
      } else kaynak.connect(g);
    } else {
      kaynak = c.createOscillator();
      kaynak.type = k.dalga || 'sine';
      kaynak.frequency.setValueAtTime(f0, t);
      if(f1 !== f0) kaynak.frequency.exponentialRampToValueAtTime(f1, t + k.d);
      if(k.suz){
        const b = suzgec(c, 'lowpass', Math.min(TAVAN, k.suz * perde), 0.7, t);
        if(b){ kaynak.connect(b); b.connect(g); } else kaynak.connect(g);
      } else kaynak.connect(g);
    }
    kaynak.start(t);
    kaynak.stop(t + k.d + 0.03);
  }

  /* Karplus–Strong teli: süzülmüş gürültü (parlak: koparmanın parlaklığı)
     bir periyotluk halkada ortalanarak döner ve söner. Aynı perde ve süre
     bir kez üretilir (en çok 48 tampon). */
  const TELLER = new Map();
  function telTampon(c, f, sure, parlak){
    const sr = c.sampleRate || 44100, anahtar = Math.round(f) + ':' + sure + ':' + parlak + ':' + sr;
    if(TELLER.has(anahtar)) return TELLER.get(anahtar);
    const n = Math.max(1, Math.floor(sr * sure)), b = c.createBuffer(1, n, sr), v = b.getChannelData(0);
    const N = Math.max(2, Math.round(sr / f)), halka = new Float32Array(N);
    let o = 0;
    for(let i = 0; i < N; i++){ o += ((Math.random() * 2 - 1) - o) * parlak; halka[i] = o; }
    for(let i = 0, p = 0; i < n; i++){
      const a = halka[p], s2 = halka[(p + 1) % N];
      halka[p] = (a + s2) * 0.4985;
      v[i] = a;
      p = (p + 1) % N;
    }
    if(TELLER.size >= 48) TELLER.delete(TELLER.keys().next().value);
    TELLER.set(anahtar, b);
    return b;
  }

  /* KAYITLAR (2026-10-28, sesler.js): arayüz sesleri ve adım gerçek CC0
     kayıttır; sentezle AYNI zincirden geçer (oda, 2 kHz tavan, sıkıştırıcı,
     perde). İlk seste bir kez çözülür; çözülene kadar ya da çözülemezse
     sentez çalar. Kazançlar sentezin yüksekliğine eşlenmiştir. */
  const KAYITLI = Object.freeze(['tik', 'ac', 'kapa', 'tamam', 'sayfa', 'adim']);
  const KAYIT_KAZANC = { tik:.42, ac:1.1, kapa:.95, tamam:.23, sayfa:.2, adim:.06 };   // ses gözlemi 2026-10-28: aile hedeflerine eşlendi
  /* Çözülen tampon bağlamına aittir: bağlam yeniden kurulursa (ya da test
     sahte bir bağlam verirse) eskisinin tamponu kullanılmaz. */
  const KAYITLAR = new WeakMap();
  function kayitHazirla(c){
    if(!c || KAYITLAR.has(c) || typeof c.decodeAudioData !== 'function') return;
    const K = L.SES_KAYIT;
    if(!K) return;
    const d = { tablo:new Map(), bekleyen:0 };
    KAYITLAR.set(c, d);
    KAYITLI.forEach(tur => {
      if(!K[tur]) return;
      try{
        const ikili = atob(K[tur]), u8 = new Uint8Array(ikili.length);
        for(let i = 0; i < ikili.length; i++) u8[i] = ikili.charCodeAt(i);
        d.bekleyen++;
        const s = c.decodeAudioData(u8.buffer, b => { d.tablo.set(tur, b); d.bekleyen--; }, () => { d.bekleyen--; });
        if(s && typeof s.catch === 'function') s.catch(() => {});
      }catch(e){ /* çözülemedi: sentez çalar */ }
    });
  }
  /* Kapa, açın aynı kaydının bir perde aşağısıdır (aile tutarlı: aç yükselir, kapa iner). */
  function kayitCal(c, cikis, oda, tur, bas, perde){
    const d = KAYITLAR.get(c), kaynak = tur === 'kapa' && d && d.tablo.get('ac') ? 'ac' : tur;
    const b = d && d.tablo.get(kaynak);
    if(!b || !c.createBufferSource) return 0;
    const s = c.createBufferSource(), oran = perde * (tur === 'kapa' && kaynak === 'ac' ? .84 : 1);
    s.buffer = b;
    if(s.playbackRate) s.playbackRate.value = oran;
    const g = c.createGain();
    g.gain.value = KAYIT_KAZANC[tur] || .4;
    s.connect(g); g.connect(cikis);
    if(oda){ const o = c.createGain(); o.gain.value = .12; g.connect(o); o.connect(oda); }
    s.start(bas);
    /* Onay kısa kalır (en çok 0,6 sn): kalimba yumuşakça susar. */
    const sure = tur === 'tamam' ? Math.min(.6, b.duration / oran) : b.duration / oran;
    if(tur === 'tamam' && g.gain.setValueAtTime && g.gain.linearRampToValueAtTime){
      g.gain.setValueAtTime(KAYIT_KAZANC.tamam, bas + .4); g.gain.linearRampToValueAtTime(0, bas + .6);
      try{ s.stop(bas + .62); }catch(e){}
    }
    return sure;
  }

  /* Döner: çaldı mı. `kur` yoksa yalnız kurulu bağlam kullanılır.
     o.perde: frekans çarpanı (her minik kendi tonunda konuşur).
     o.pan: -1 (sol) … 1 (sağ); ses miniğin ekrandaki yerinden gelir. */
  function tik(tur, kur, o){
    const plan = SESLER[tur];
    if(!plan) return false;
    const c = sesBaglami(kur !== false);
    if(!c) return false;
    try{
      const simdi = c.currentTime || 0;
      if(sonCal[tur] != null && simdi - sonCal[tur] < ARA && simdi >= sonCal[tur]) return false;
      const aile = AILE[tur], dz = duzey(aile || 'genel');
      if(dz <= 0) return false;
      /* Bir olay bir ses: dokunuşun hemen ardından gelen sayfa sesi, kullanıcı
         sesinin ardından gelen ortam sesi çalmaz; onay ve uyarı 1,5 sn'de bir. */
      if(tur === 'sayfa' && simdi - sonDokunus < .15) return false;
      if(aile === 'ortam' && simdi - sonDokunus < .4) return false;
      if(aile === 'onay' && simdi - sonOnay < 1.5 && simdi >= sonOnay) return false;
      if(aile === 'dokunus' || aile === 'gecis') sonDokunus = simdi;
      if(aile === 'onay') sonOnay = simdi;
      sonCal[tur] = simdi;
      const z0 = zincirKur(c);
      const yol = cikis => {
        let h = cikis;
        if(dz < 1 && c.createGain){ const g = c.createGain(); g.gain.value = dz; g.connect(h); h = g; }
        if(o && o.pan && c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = o.pan; p.connect(h); h = p; }
        return h;
      };

      /* «Tamam» notası tıkın üstüne binmez, ardından gelir. */
      const bas = tur === 'tamam' ? Math.max(simdi, sonBitis + 0.02) : simdi + 0.005;
      const perde = (o && o.perde > 0 ? o.perde : 1) * (1 + (Math.random() - 0.5) * 0.04);
      kayitHazirla(c);
      if(KAYITLI.indexOf(tur) >= 0){
        const d = KAYITLAR.get(c), hazir = d && (d.tablo.has(tur) || (tur === 'kapa' && d.tablo.has('ac')));
        if(hazir){
          const ks = kayitCal(c, yol(z0.kayit || z0.hedef), z0.oda, tur, bas, perde);
          if(ks){ sonBitis = Math.max(sonBitis, bas + ks); return true; }
        } else if(d && d.bekleyen > 0) return false;   // kayıt çözülüyor: sentez değil sessizlik (ilk ses farklı çıkmasın)
      }
      const z = Object.assign({}, z0, { hedef:yol(z0.hedef) });
      plan.forEach(k => katman(c, z, bas + k.t, k, perde));
      sonBitis = Math.max(sonBitis, bas + Math.max.apply(null, plan.map(k => k.t + k.d)));
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
    zincir = null;
    sonBitis = 0;
    Object.keys(sonCal).forEach(k => delete sonCal[k]);
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
    /* Sayfa değişince (kabuk.js köke `sayfa-gecis` koyar) yumuşak çınlama;
       bağlam yalnız daha önce bir dokunuşla kurulduysa (kur:false). */
    if(typeof MutationObserver === 'function' && document.documentElement){
      let vardi = document.documentElement.classList.contains('sayfa-gecis');
      new MutationObserver(() => {
        const var_ = document.documentElement.classList.contains('sayfa-gecis');
        if(var_ && !vardi) tik('sayfa', false);
        vardi = var_;
      }).observe(document.documentElement, { attributes:true, attributeFilter:['class'] });
    }
    document.addEventListener('change', e => {
      const el = e.target;
      if(!tercih.tik || !gercekMi(e) || !el || !el.matches || !el.matches('input[type="checkbox"]')) return;
      tik(el.checked ? 'ac' : 'kapa');
    }, true);
    /* Bağlam boşta önceden kurulur (onKur); ilk dokunuş onu yalnız sürdürür. */
    const bosta = typeof requestIdleCallback === 'function' ? requestIdleCallback : f => setTimeout(f, 1500);
    bosta(() => onKur(), { timeout:4000 });
    document.addEventListener('pointerdown', e => { if(tercih.tik && gercekMi(e)) sesBaglami(true); }, true);

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

    /* Ses düzeyi kaydırıcıları (Görünüm › Ses): değer anında yazılır, bırakınca örnek ses çalar. */
    document.addEventListener('input', e => {
      const r = e.target && e.target.closest ? e.target.closest('[data-ses-duzey]') : null;
      if(!r) return;
      const y = Number(r.value) || 0;
      duzeyAyarla(r.getAttribute('data-ses-duzey'), y / 100);
      r.setAttribute('aria-valuetext', yuzde(y));
      const o = r.parentElement && r.parentElement.querySelector('output');
      if(o) o.textContent = yuzde(y);
    });
    document.addEventListener('change', e => {
      const r = e.target && e.target.closest ? e.target.closest('[data-ses-duzey]') : null;
      const ornek = r && { genel:'tik', arayuz:'tik', ajan:'gidik', dokunus:'tik', gecis:'ac', onay:'tamam', karakter:'gidik', ortam:'adim' }[r.getAttribute('data-ses-duzey')];
      if(ornek){ sonDokunus = -1; sonOnay = -9; tik(ornek, true); }
    });

    /* «Kaydedildi» bildirimi: tek yumuşak nota (yalnız kurulu bağlamla). */
    const kur = () => {
      const kok = document.getElementById('toast-root');
      if(!kok || typeof MutationObserver === 'undefined') return;
      new MutationObserver(ms => {
        if(!tercih.tik) return;
        const t = ms.reduce((v, m) => v || Array.from(m.addedNodes).find(n => n.classList && n.classList.contains('toast')), null);
        if(!t) return;
        /* Hata bildiriminde başarı sesi değil, yumuşak uyarı. */
        const hata = t.classList.contains('toast--hata') || t.classList.contains('toast--uyari') || t.getAttribute('data-ses') === 'uyari'
          || /başarısız|okunamadı|hata|silinemedi|bağlanamadı|yüklenemedi|kaydedilemedi|geçersiz/i.test(t.textContent || '');
        tik(hata ? 'uyari' : 'tamam', false);
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
    cal, durdur, sonraki, turSec, sesAyarla, tikAc, tik, devret, SESLER, KAYITLI,
    AILE, DUZEY_ANAHTAR, KAYIT_TAVAN, duzey, duzeyAyarla, duzeyler, duzeySeciciHtml,
    chime:ad => tik(/bitti|kapa|dur/i.test(String(ad || '')) ? 'kapa' : 'ac'),
    _ortam, _sifirla, _acilis:acilis, _sayfadanCik:sayfadanCik, _onKur:onKur,
  });
  /* Başka modülde çalıyorduysa: gövde hazır olunca sürdürmeyi dene. */
  if(typeof document !== 'undefined'){
    const basla = () => { try{ acilis(); }catch(e){} };
    if(document.body) basla(); else document.addEventListener('DOMContentLoaded', basla);
  }
})();
