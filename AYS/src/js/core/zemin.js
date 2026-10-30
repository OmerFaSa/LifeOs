/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/zemin.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* ZEMİN — yumuşak renk zemini ve içeriğin arkasındaki buzlu yüzey.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/zemin.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Biçimi
   `brand/ortak/zemin.css`, testi `brand/ortak/zemin.test.js`.
   ==================================================================

   KULLANICININ İSTEĞİ (2026-10-02): «arka plana soft bir resim koyup
   panellerin olduğu yerin arkasına hafif, küçük, tam ekranı kaplamayacak
   şekilde buzlu madde». Canlı denemeyi görüp seçti: resim DOSYASI değil,
   modül rengine çalan yumuşak renk lekeleri; varsayılan açık, Görünüm'den
   kapatılır.

   KİPLER (tercih `localStorage` 'lifeos.zemin'; modül geçişinde taşınır,
   animasyon.js TASINAN)

     yumusak  renk zemini + içerik sütununun arkasında buzlu yüzey (VARSAYILAN)
     sade     eski düz zemin

   Bu dosya `<head>`'de animasyon.js'ten SONRA yüklenir: taşınan tercih
   önce depoya yazılır, sonra burada okunur; `<html data-zemin>` ilk
   çizimden önce konur, zemin açılışta yanıp sönmez. Görünüş tamamen
   CSS'tedir; burası yalnız tercihi tutar. */

window.LIFEOS = window.LIFEOS || {};

(function(){
  'use strict';

  const L = window.LIFEOS;
  const ANAHTAR = 'lifeos.zemin';
  const KIPLER = Object.freeze(['yumusak', 'sade']);
  const AD = { yumusak:'Yumuşak', sade:'Sade' };
  const IPUCU = { yumusak:'Yumuşak renk zemini, içeriğin arkasında buzlu yüzey', sade:'Düz zemin' };

  function oku(){
    let v = null;
    try{ v = localStorage.getItem(ANAHTAR); }catch(e){}
    return KIPLER.indexOf(v) >= 0 ? v : 'yumusak';
  }
  let simdiki = oku();
  function kip(){ return simdiki; }

  /* «Saydamlığı azalt» (işletim sistemi) açıksa zemin Sade çizilir; kayıtlı
     tercih değişmez. Karar burada, CSS'te değil: bu özelliği tanımayan
     tarayıcıda `not (…)` medya sorgusu zemini tümden kapatırdı. */
  function saydamlikAz(){
    try{ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-transparency: reduce)').matches); }
    catch(e){ return false; }
  }
  /* GÜNÜN SAATİ (kullanıcı, 2026-10-05, «6 güzel»): zemin sabah biraz
     sıcak, gün ortası nötr, akşam altın, gece serin tona kayar — ÇOK az.
     Duraklar arasında yumuşak geçiş: saat değişince sıçrama olmaz.
     Döner: { renk:'#RRGGBB', guc:0..1 } (guc = tonun yüzdesi / 100). */
  const SAAT_DURAK = [
    [0,   '#3C4FA8', 0.12],     // gece: serin, derin
    [5,   '#3C4FA8', 0.10],
    [7,   '#FFC58A', 0.14],     // sabah: sıcak
    [10,  '#FFC58A', 0.04],
    [12,  '#FFFFFF', 0],        // gün ortası: nötr
    [16,  '#FFFFFF', 0],
    [18.5,'#FFB37A', 0.12],     // akşam: altın
    [20.5,'#6E8BFF', 0.10],     // akşam sonu: serinleşir
    [24,  '#3C4FA8', 0.12],
  ];
  function hex(h){ const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function saatTonu(tarih){
    const d = tarih || new Date();
    const s = d.getHours() + d.getMinutes() / 60;
    let i = 0;
    while(i < SAAT_DURAK.length - 2 && SAAT_DURAK[i + 1][0] <= s) i++;
    const [s1, r1, g1] = SAAT_DURAK[i], [s2, r2, g2] = SAAT_DURAK[i + 1];
    const t = s2 > s1 ? Math.min(1, Math.max(0, (s - s1) / (s2 - s1))) : 0;
    const a = hex(r1), b = hex(r2);
    const c = a.map((x, k) => Math.round(x + (b[k] - x) * t));
    const guc = Math.round((g1 + (g2 - g1) * t) * 1000) / 1000;
    return { renk:'#' + c.map(x => x.toString(16).padStart(2, '0')).join(''), guc };
  }
  /* Saat kaynağı: testte sabitlenir (_saatSaglayici); önceki kaynağı döner. */
  let saatSimdi = () => new Date();
  function _saatSaglayici(fn){ const once = saatSimdi; saatSimdi = fn; return once; }
  function saatUygula(){
    if(typeof document === 'undefined') return;
    const z = saatTonu(saatSimdi());
    /* Koyu temada ton yarıya iner: gece zemini zaten koyu, ışık bağırmasın. */
    let koyu = document.documentElement.getAttribute('data-theme') === 'dark';
    try{ if(!koyu && document.documentElement.getAttribute('data-theme') !== 'light')
      koyu = window.matchMedia('(prefers-color-scheme: dark)').matches; }catch(e){ /* sorgu yok */ }
    if(koyu) z.guc = Math.round(z.guc * 500) / 1000;
    document.documentElement.style.setProperty('--zemin-saat',
      z.guc > 0 ? 'color-mix(in oklab, ' + z.renk + ' ' + Math.round(z.guc * 100) + '%, transparent)' : 'transparent');
  }

  function uygula(){
    if(typeof document !== 'undefined' && document.documentElement){
      document.documentElement.setAttribute('data-zemin', simdiki === 'yumusak' && !saydamlikAz() ? 'yumusak' : 'sade');
    }
  }
  function seciciGuncelle(){
    if(typeof document === 'undefined') return;
    document.querySelectorAll('[data-zemin-sec]').forEach(b => {
      const on = b.getAttribute('data-zemin-sec') === simdiki;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function ayarla(k){
    if(KIPLER.indexOf(k) < 0) return false;
    try{ localStorage.setItem(ANAHTAR, k); }catch(e){ /* depo kapalı: bu sayfada geçerli */ }
    simdiki = k;
    uygula();
    seciciGuncelle();
    return true;
  }
  function yenile(){
    simdiki = oku();
    uygula();
    seciciGuncelle();
    return simdiki;
  }

  /* Görünüm panelinin satırı (animasyon.js seciciHtml ile aynı biçim). */
  function seciciHtml(){
    return '<div class="seg seg--block zeminsec" role="group" aria-label="Zemin">'
      + KIPLER.map(k => '<button type="button" class="' + (k === simdiki ? 'is-on' : '') + '" data-zemin-sec="' + k + '"'
        + ' aria-pressed="' + (k === simdiki ? 'true' : 'false') + '" title="' + IPUCU[k] + '">' + AD[k] + '</button>').join('')
      + '</div>';
  }

  /* SON TEMA (kullanıcı, 2026-10-03: «tema beyazdaysa girişte 3 saniye
     beklediğimiz yer de beyaz olsun»). Tema profilde durur ve uygulama
     açılınca konur (app.js applyTheme): ilk karede — marka girişi tam o
     an görünür — bilinmez. Son konan tema bu kapının deposunda hatırlanır
     ve ilk çizimden ÖNCE konur; uygulama açılınca aynısını yine koyar ya da
     «Sistem»se kaldırır (o zaman hatıra da silinir). Kullanıcı verisi
     değil, yalnız 'light' / 'dark'. */
  const TEMA = 'lifeos.tema';
  function _temaKaydet(){
    if(typeof document === 'undefined') return;
    try{
      const v = document.documentElement.getAttribute('data-theme');
      if(v === 'light' || v === 'dark') localStorage.setItem(TEMA, v); else localStorage.removeItem(TEMA);
    }catch(e){}
  }
  function temaIlk(){
    let v = null;
    try{ v = localStorage.getItem(TEMA); }catch(e){}
    if(v !== 'light' && v !== 'dark') return null;
    if(typeof document !== 'undefined' && !document.documentElement.hasAttribute('data-theme')){
      document.documentElement.setAttribute('data-theme', v);
    }
    return v;
  }

  /* YÜZEY (kullanıcı, 2026-10-20: «kart teması bir noktadan sonra boğuyor;
     kartlara benzeyen ama daha ferah bir iki tema da sun; modüllerde farklı
     temalar seçilebilsin»). Tercih MODÜL BAŞINA saklanır
     (`lifeos.yuzey.<modül>`; modül `<html data-modul>`'den), ilk çizimden
     önce `<html data-yuzey>` konur. Görünüş zemin.css'te:
       kart   bugünkü kartlar (VARSAYILAN)
       ferah  kart kutusu yok: bölümler ince çizgi ve boşlukla ayrılır,
              içerik levhası kalkar
       serit  hafif tonlu düz yüzey, solda ince modül rengi şerit, gölge yok */
  const YUZEYLER = Object.freeze(['kart', 'ferah', 'serit']);
  const YUZEY_AD = { kart:'Kart', ferah:'Ferah', serit:'Şerit' };
  const YUZEY_IPUCU = { kart:'Bölümler kart içinde', ferah:'Kartsız, bölümler çizgi ve boşlukla ayrılır', serit:'Hafif tonlu düz bölümler, solda ince şerit' };
  function modulOf(){
    try{ return (document.documentElement.getAttribute('data-modul') || 'lifeos').toLowerCase(); }catch(e){ return 'lifeos'; }
  }
  const yuzeyAnahtar = () => 'lifeos.yuzey.' + modulOf();
  function yuzeyOku(){
    let v = null;
    try{ v = localStorage.getItem(yuzeyAnahtar()); }catch(e){}
    return YUZEYLER.indexOf(v) >= 0 ? v : 'kart';
  }
  let yuzeySimdi = typeof document !== 'undefined' ? yuzeyOku() : 'kart';
  function yuzeyUygula(){
    if(typeof document === 'undefined' || !document.documentElement) return;
    if(yuzeySimdi === 'kart') document.documentElement.removeAttribute('data-yuzey');
    else document.documentElement.setAttribute('data-yuzey', yuzeySimdi);
    document.querySelectorAll('[data-yuzey-sec]').forEach(b => {
      const on = b.getAttribute('data-yuzey-sec') === yuzeySimdi;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function yuzeyAyarla(k){
    if(YUZEYLER.indexOf(k) < 0) return false;
    try{ localStorage.setItem(yuzeyAnahtar(), k); }catch(e){ /* depo kapalı: bu sayfada geçerli */ }
    yuzeySimdi = k;
    yuzeyUygula();
    return true;
  }
  function yuzeySeciciHtml(){
    return '<div class="seg seg--block yuzeysec" role="group" aria-label="Yüzey">'
      + YUZEYLER.map(k => '<button type="button" class="' + (k === yuzeySimdi ? 'is-on' : '') + '" data-yuzey-sec="' + k + '"'
        + ' aria-pressed="' + (k === yuzeySimdi ? 'true' : 'false') + '" title="' + YUZEY_IPUCU[k] + '">' + YUZEY_AD[k] + '</button>').join('')
      + '</div>';
  }

  /* MANZARA (kullanıcı, 2026-10-28: «sistemin arka planına gerekirse resim
     koy»): modülün kendi CC0 fotoğrafı (brand/medya/doku/doku-manzara-<modül>,
     künyesi brand/medya/OKU.md). Adres belgenin kendi adresinden kurulur:
     dist dosyada, LifeOS sunucusunda ve geliştirme sunucusunda aynı yol
     çalışır. Kapalıysa resim hiç istenmez. Görünüşü cam.css «MANZARA». */
  /* ARKA PLAN (kullanıcı, 2026-10-29: «arka planın fotoğraflarını değiştirebilelim;
     gece ile sabah aynı ya da ayrı olsun; PC'den fotoğraf ekleyebilelim; arka
     plana bir video seçimi koyabilelim; gece olunca tema otomatik geçsin ya da
     geçmesin»; «karanlık temada arka planın kararması kötü, daha akıllıca bir
     şey»). İki yuva:
       gündüz  modülün fotoğrafı (acik) · kendi dosyan (kendi) · kapalı
       gece    gece rengi (renk, varsayılan) · gündüzle aynı (ayni) · kendi dosyan
     Koyu temada gündüz fotoğrafı artık lacivert perdeyle karartılmaz: gece
     yuvası boşsa zemin modül tonunda derin renk alanıdır (cam.css §12).
     Kendi dosya (foto ya da video) PC'deki LifeOS sunucusunda durur
     (sistem/zemin.py, /api/zemin/<yuva>): her modül ve giriş sayfası aynısını
     görür; sunucu yoksa (dist dosya, telefon) modülün fotoğrafına düşer.
     Türü ve sürümü yerelde tutulur (`lifeos.manzara.tur.<yuva>`, taşınır). */
  const MANZARA_ANAHTAR = 'lifeos.manzara';
  const GECE_ANAHTAR = 'lifeos.manzara.gece';
  const OTO_ANAHTAR = 'lifeos.tema.oto';
  const MANZARALAR = Object.freeze(['acik', 'kendi', 'kapali']);
  const GECELER = Object.freeze(['renk', 'ayni', 'kendi']);
  const OTOLAR = Object.freeze(['kapali', 'saat']);
  const MANZARA_AD = { acik:'Modülün', kendi:'Kendi', kapali:'Kapalı' };
  const GECE_AD = { renk:'Renk', ayni:'Gündüzün', kendi:'Kendi' };   // yuva başlığı «Gece»: kısa ad kutuya sığar
  const OTO_AD = { kapali:'Kapalı', saat:'Saate göre' };
  const depoOku = (k, liste, vars) => { let v = null; try{ v = localStorage.getItem(k); }catch(e){} return liste.indexOf(v) >= 0 ? v : vars; };
  const depoYaz = (k, v) => { try{ localStorage.setItem(k, v); }catch(e){ /* depo kapalı: bu sayfada geçerli */ } };
  function manzaraOku(){ return depoOku(MANZARA_ANAHTAR, MANZARALAR, 'acik'); }
  let manzaraSimdi = 'acik', geceSimdi = 'renk', otoSimdi = 'kapali';
  function karanlik(){
    if(typeof document === 'undefined') return false;
    const t = document.documentElement.getAttribute('data-theme');
    if(t) return t === 'dark';
    try{ return !!window.matchMedia('(prefers-color-scheme: dark)').matches; }catch(e){ return false; }
  }
  function sunucuVar(){ return typeof location !== 'undefined' && /^https?:$/.test(location.protocol); }
  function dosyaTuru(yuva){ let v = null; try{ v = localStorage.getItem('lifeos.manzara.tur.' + yuva); }catch(e){} return v === 'video' || v === 'foto' ? v : null; }
  function dosyaAdresi(yuva){
    let surum = '';
    try{ surum = localStorage.getItem('lifeos.manzara.surum') || ''; }catch(e){}
    try{ return new URL('/api/zemin/' + yuva + (surum ? '?v=' + surum : ''), location.href).href; }catch(e){ return ''; }
  }
  /* Ayarlar'daki önizleme: bir yuvanın şu anki seçimi { tur:'modul'|'foto'|'video'|'renk', adres }. */
  function onizle(yuva){
    const secim = yuva === 'gece' ? (geceSimdi === 'ayni' ? manzaraSimdi : geceSimdi) : manzaraSimdi;
    const kendiYuva = yuva === 'gece' && geceSimdi === 'kendi' ? 'gece' : 'gunduz';
    const modul = () => { try{ return new URL('img/marka/doku-manzara-' + modulOf().replace(/[^a-z]/g, '') + '.webp', document.baseURI).href; }catch(e){ return ''; } };
    if(secim === 'kendi'){
      const t = dosyaTuru(kendiYuva);
      if(t && sunucuVar()) return { tur:t, adres:dosyaAdresi(kendiYuva) };
      return { tur:'modul', adres:modul(), eksik:true };   // dosya yok: gerçekte modülün fotoğrafı görünür
    }
    if(secim === 'acik') return { tur:'modul', adres:modul() };
    return { tur:'renk', adres:'' };
  }
  /* Önizleme (kullanıcı, 2026-10-30: «aydınlık temadayken karanlık temaya
     görsel eklediğimde önizlemede gözükmüyor; önizlemede minik sistem
     kartları olsun, istersen kaldırıp yalnız görseli görebileyim»). Her
     seçimde ve yüklemede manzaraUygula yeniden çizer. Kartlar yuvanın
     temasında: gece yuvası koyu cam, gündüz açık cam. */
  const ONIZLE_SADE = 'lifeos.zemin.onizle.sade';
  const onizleSade = () => { try{ return localStorage.getItem(ONIZLE_SADE) === '1'; }catch(e){ return false; } };
  const kacir = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  function onizleHtml(yuva){
    const o = onizle(yuva), sade = onizleSade();
    const etiket = o.eksik ? 'Dosya yok · modülün fotoğrafı'
      : { modul:'Modülün fotoğrafı', foto:'Kendi fotoğrafın', video:'Kendi videon', renk:yuva === 'gece' ? 'Gece rengi' : 'Düz renk' }[o.tur];
    return '<div class="zemin-onizle zemin-onizle--' + o.tur + ' zemin-onizle--' + (yuva === 'gece' ? 'gece' : 'gunduz') + (sade ? ' is-sade' : '') + '" data-zemin-onizle="' + kacir(yuva) + '"'
      + (o.tur === 'modul' || o.tur === 'foto' ? ' style="background-image:url(&quot;' + kacir(o.adres) + '&quot;)"' : '') + '>'
      + (o.tur === 'video' ? '<video src="' + kacir(o.adres) + '" muted playsinline preload="metadata" aria-hidden="true"></video>' : '')
      + '<span class="zemin-onizle__ui" aria-hidden="true"><i class="zo-kenar"></i><i class="zo-kart"><b></b><b></b></i><i class="zo-kart zo-kart--iki"><b></b></i></span>'
      + '<small>' + kacir(etiket) + '</small>'
      + '<button type="button" class="zemin-onizle__goz" data-zemin-onizle-sade aria-pressed="' + (sade ? 'true' : 'false') + '" aria-label="' + (sade ? 'Kartları göster' : 'Yalnız görsel') + '">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true">' + (sade ? '<rect x="4" y="5" width="16" height="14" rx="2.5"/><path d="M8 10h8M8 14h5"/>'
        : '<rect x="4" y="5" width="16" height="14" rx="2.5"/><path d="M4 15l4.5-4.5 4 4 2.5-2.5 5 5"/>') + '</svg></button></div>';
  }
  /* Şu an geçerli olan: { tur:'modul'|'foto'|'video'|'yok', yuva } */
  function etkinZemin(){
    const gece = karanlik();
    const secim = gece ? (geceSimdi === 'ayni' ? manzaraSimdi : geceSimdi) : manzaraSimdi;
    const yuva = gece && geceSimdi === 'kendi' ? 'gece' : 'gunduz';
    if(secim === 'acik') return { tur:'modul', yuva };
    if(secim === 'kendi'){
      const t = dosyaTuru(yuva);
      if(t && sunucuVar()) return { tur:t, yuva };
      return { tur:'modul', yuva };                 // dosya yok ya da sunucu yok: modülün fotoğrafı
    }
    return { tur:'yok', yuva };
  }
  function videoKur(adres){
    if(typeof document === 'undefined') return;
    let v = document.querySelector('video.zemin-video');
    if(!adres){ if(v) v.remove(); return; }
    if(!document.body){ document.addEventListener('DOMContentLoaded', () => videoKur(adres), { once:true }); return; }
    if(!v){
      v = document.createElement('video');
      v.className = 'zemin-video';
      v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
      v.setAttribute('aria-hidden', 'true'); v.setAttribute('tabindex', '-1');
      document.body.insertBefore(v, document.body.firstChild);
    }
    if(v.getAttribute('src') !== adres) v.setAttribute('src', adres);
    /* Az hareket ya da dinlenmede ilk kare durur (CPU ve dikkat). */
    const dur = (L.hareketAz && L.hareketAz()) || document.documentElement.classList.contains('is-dinlen');
    try{ if(dur) v.pause(); else { const p = v.play(); if(p && p.catch) p.catch(() => {}); } }catch(e){}
  }
  function manzaraUygula(){
    if(typeof document === 'undefined' || !document.documentElement) return;
    const kok = document.documentElement;
    const z = etkinZemin();
    if(z.tur === 'modul' || z.tur === 'foto'){
      let u = '';
      try{ u = z.tur === 'foto' ? dosyaAdresi(z.yuva) : new URL('img/marka/doku-manzara-' + modulOf().replace(/[^a-z]/g, '') + '.webp', document.baseURI).href; }catch(e){}
      kok.setAttribute('data-manzara', 'acik');
      if(u) kok.style.setProperty('--manzara', 'url("' + u + '")');
      videoKur(null);
    }else if(z.tur === 'video'){
      kok.setAttribute('data-manzara', 'acik');
      kok.style.setProperty('--manzara', 'none');
      videoKur(dosyaAdresi(z.yuva));
    }else{
      kok.removeAttribute('data-manzara');
      kok.style.removeProperty('--manzara');
      videoKur(null);
    }
    kok.toggleAttribute('data-zemin-video', z.tur === 'video');
    const isaretle = (sec, simdi) => document.querySelectorAll('[' + sec + ']').forEach(b => {
      const on = b.getAttribute(sec) === simdi;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    isaretle('data-manzara-sec', manzaraSimdi);
    isaretle('data-gece-sec', geceSimdi);
    isaretle('data-oto-sec', otoSimdi);
    document.querySelectorAll('[data-zemin-onizle]').forEach(el => { el.outerHTML = onizleHtml(el.getAttribute('data-zemin-onizle')); });
  }
  /* Saate göre tema: 07:00–19:00 açık, öbür saatler koyu. Açıkken modülün
     tema seçimi yerine saat geçerlidir; kapatınca seçim geri gelir. */
  function otoTema(tarih){ const h = (tarih || saatSimdi()).getHours(); return h >= 7 && h < 19 ? 'light' : 'dark'; }
  let otoOnceki = null;
  function otoUygula(){
    if(typeof document === 'undefined') return;
    const kok = document.documentElement;
    if(otoSimdi !== 'saat'){
      if(otoOnceki !== null){ if(otoOnceki) kok.setAttribute('data-theme', otoOnceki); else kok.removeAttribute('data-theme'); otoOnceki = null; }
      return;
    }
    const t = otoTema();
    if(otoOnceki === null) otoOnceki = kok.getAttribute('data-theme') || '';
    if(kok.getAttribute('data-theme') !== t) kok.setAttribute('data-theme', t);
  }
  function manzaraYenile(){
    manzaraSimdi = manzaraOku();
    geceSimdi = depoOku(GECE_ANAHTAR, GECELER, 'renk');
    otoSimdi = depoOku(OTO_ANAHTAR, OTOLAR, 'kapali');
    otoUygula();
    manzaraUygula();
  }
  function manzaraAyarla(k){
    if(MANZARALAR.indexOf(k) < 0) return false;
    depoYaz(MANZARA_ANAHTAR, k); manzaraSimdi = k; manzaraUygula();
    return true;
  }
  function geceAyarla(k){
    if(GECELER.indexOf(k) < 0) return false;
    depoYaz(GECE_ANAHTAR, k); geceSimdi = k; manzaraUygula();
    return true;
  }
  function otoAyarla(k){
    if(OTOLAR.indexOf(k) < 0) return false;
    depoYaz(OTO_ANAHTAR, k); otoSimdi = k; otoUygula(); manzaraUygula();
    return true;
  }
  /* Kendi dosyanı yükler: PC'deki sunucuya (yalnız bu bilgisayardan). */
  function dosyaYukle(yuva, dosya){
    if(!sunucuVar()) return Promise.resolve({ ok:false, mesaj:'Kendi dosyan için LifeOS bu bilgisayarda açık olmalı.' });
    const tur = String(dosya && dosya.type || '');
    if(!/^(image\/(jpeg|png|webp)|video\/(mp4|webm|quicktime|x-m4v))$/.test(tur)) return Promise.resolve({ ok:false, mesaj:'Yalnız JPEG, PNG, WebP fotoğraf ya da MP4, MOV, WebM video (MKV ve AVI’yi önce MP4’e çevir).' });
    if(dosya.size > 600 * 1024 * 1024) return Promise.resolve({ ok:false, mesaj:'Dosya 600 MB’tan büyük.' });
    return fetch(new URL('/api/zemin/' + yuva, location.href).href, { method:'POST', headers:{ 'Content-Type':tur, 'X-LifeOS':'zemin' }, body:dosya })
      .then(r => r.ok ? null : r.text().then(t => { throw new Error(t || 'Yüklenemedi.'); }))
      .then(() => {
        depoYaz('lifeos.manzara.tur.' + yuva, /^video/.test(tur) ? 'video' : 'foto');
        depoYaz('lifeos.manzara.surum', String(Date.now()));
        if(yuva === 'gece') geceAyarla('kendi'); else manzaraAyarla('kendi');
        return { ok:true, mesaj:/^video/.test(tur) ? 'Video kaydedildi; bitince başa döner.' : 'Fotoğraf kaydedildi.' };
      })
      .catch(e => ({ ok:false, mesaj:(e && e.message) || 'Yüklenemedi: LifeOS sunucusu yanıt vermedi.' }));
  }
  const seg = (ad, sec, sinif, liste, adlar, simdi) => '<div class="seg seg--block ' + sinif + '" role="group" aria-label="' + ad + '">'
    + liste.map(k => '<button type="button" class="' + (k === simdi ? 'is-on' : '') + '" ' + sec + '="' + k + '"'
      + ' aria-pressed="' + (k === simdi ? 'true' : 'false') + '">' + adlar[k] + '</button>').join('') + '</div>';
  /* «Fotoğraf ya da video» (kullanıcı, 2026-10-30: «yalnız resim seçeneği olmasın»): video bitince başa döner (videoKur loop). */
  const dosyaDugmesi = yuva => sunucuVar() ? '<label class="btn btn--sm zemin-dosya">Fotoğraf ya da video seç'
    + '<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/x-m4v,.mov,.m4v" data-zemin-dosya="' + yuva + '" hidden></label>'
    + '<small class="zemin-durum" data-zemin-durum="' + yuva + '" role="status"></small>' : '';
  function manzaraSeciciHtml(){ return '<div class="zemin-yuva">' + seg('Gündüz arka planı', 'data-manzara-sec', 'manzarasec', MANZARALAR, MANZARA_AD, manzaraSimdi) + dosyaDugmesi('gunduz') + '</div>'; }
  function geceSeciciHtml(){ return '<div class="zemin-yuva">' + seg('Gece arka planı', 'data-gece-sec', 'gecesec', GECELER, GECE_AD, geceSimdi) + dosyaDugmesi('gece') + '</div>'; }
  function otoSeciciHtml(){ return seg('Saate göre tema', 'data-oto-sec', 'otosec', OTOLAR, OTO_AD, otoSimdi); }

  uygula();
  yuzeyUygula();
  if(typeof document !== 'undefined') manzaraYenile();
  temaIlk();
  if(typeof document !== 'undefined' && typeof MutationObserver !== 'undefined'){
    /* Tema değişince saat tonu da hemen tazelenir (koyuda yarısı). */
    new MutationObserver(() => { otoUygula(); _temaKaydet(); saatUygula(); manzaraUygula(); }).observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
  }
  if(typeof document !== 'undefined'){
    document.addEventListener('click', e => {
      const y = e.target && e.target.closest ? e.target.closest('[data-yuzey-sec]') : null;
      if(y){ e.preventDefault(); yuzeyAyarla(y.getAttribute('data-yuzey-sec')); return; }
      const mz = e.target && e.target.closest ? e.target.closest('[data-manzara-sec]') : null;
      if(mz){ e.preventDefault(); manzaraAyarla(mz.getAttribute('data-manzara-sec')); return; }
      const gc = e.target && e.target.closest ? e.target.closest('[data-gece-sec]') : null;
      if(gc){ e.preventDefault(); geceAyarla(gc.getAttribute('data-gece-sec')); return; }
      const sd = e.target && e.target.closest ? e.target.closest('[data-zemin-onizle-sade]') : null;
      if(sd){ e.preventDefault(); depoYaz(ONIZLE_SADE, onizleSade() ? '0' : '1'); manzaraUygula(); return; }
      const ot = e.target && e.target.closest ? e.target.closest('[data-oto-sec]') : null;
      if(ot){ e.preventDefault(); otoAyarla(ot.getAttribute('data-oto-sec')); return; }
      const b = e.target && e.target.closest ? e.target.closest('[data-zemin-sec]') : null;
      if(!b) return;
      e.preventDefault();
      ayarla(b.getAttribute('data-zemin-sec'));
    });
  }
  if(typeof document !== 'undefined'){
    document.addEventListener('change', e => {
      const g = e.target && e.target.matches && e.target.matches('[data-zemin-dosya]') ? e.target : null;
      if(!g || !g.files || !g.files[0]) return;
      const yuva = g.getAttribute('data-zemin-dosya');
      const durum = document.querySelector('[data-zemin-durum="' + yuva + '"]');
      if(durum) durum.textContent = /^video/.test(g.files[0].type) ? 'Video yükleniyor… büyük dosya biraz sürer.' : 'Yükleniyor…';
      dosyaYukle(yuva, g.files[0]).then(s => { if(durum) durum.textContent = s.mesaj; g.value = ''; });
    });
  }
  if(typeof window !== 'undefined' && window.addEventListener){
    window.addEventListener('storage', e => { if(e.key === ANAHTAR) yenile(); if(e.key === MANZARA_ANAHTAR) manzaraYenile(); if(e.key === yuzeyAnahtar()){ yuzeySimdi = yuzeyOku(); yuzeyUygula(); } });
    try{ window.matchMedia('(prefers-reduced-transparency: reduce)').addEventListener('change', uygula); }catch(e){}
    try{ window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { saatUygula(); manzaraUygula(); }); }catch(e){}
  }

  saatUygula();
  if(typeof setInterval === 'function') setInterval(() => { saatUygula(); otoUygula(); }, 5 * 60 * 1000);

  /* KAYIT IŞIĞI (2026-10-17, zemin.css «CANLI ZEMİN»): bir kayıt gerçekten
     yazıldığında çağrılır; üstten bir ışık bir kez yayılıp söner. Işık
     katmanı gövdenin İLK çocuğudur: içerik sütununun buzlu levhası onun
     üstünde kalır. Azaltılmış harekette CSS oynatmaz; çağrı yine zararsız.
     Döner: ışık katmanı (yoksa null). */
  function nabiz(o){
    if(typeof document === 'undefined' || !document.body) return null;
    let el = document.querySelector('.zemin-isik');
    if(!el){
      el = document.createElement('div');
      el.className = 'zemin-isik';
      el.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(el, document.body.firstChild);
    }
    el.classList.remove('is-nabiz', 'is-gunaydin');
    void el.offsetWidth;                 // aynı sınıf yeniden eklenince animasyon baştan oynasın
    const gunaydin = !!(o && o.gunaydin);
    el.classList.add(gunaydin ? 'is-gunaydin' : 'is-nabiz');
    clearTimeout(el._zaman);
    el._zaman = setTimeout(() => el.classList.remove('is-nabiz', 'is-gunaydin'), gunaydin ? 3000 : 1800);
    return el;
  }

  /* GÜNÜN İLK AÇILIŞI (2026-10-17): modül o gün ilk kez açılınca zemin
     o saatin tonuyla bir kez, yavaşça aydınlanır (sabah sıcak, akşam
     altın, gece serin; gün ortası modül rengi). Gün bu cihazın yerel
     tarihidir; aynı gün ikinci açılışta oynamaz. Döner: oynadı mı. */
  const GUN_ANAHTAR = 'lifeos.zemin.gun';
  function gunIlk(tarih){
    const d = tarih || saatSimdi();
    const gun = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    let son = null;
    try{ son = localStorage.getItem(GUN_ANAHTAR); }catch(e){ return false; }
    if(son === gun) return false;
    try{ localStorage.setItem(GUN_ANAHTAR, gun); }catch(e){ return false; }
    const z = saatTonu(d);
    if(typeof document !== 'undefined') document.documentElement.style.setProperty('--zemin-gunaydin',
      z.guc > 0 ? z.renk : 'var(--mod, var(--ays))');
    nabiz({ gunaydin:true });
    return true;
  }

  L.ZEMIN = Object.freeze({ ANAHTAR, KIPLER, TEMA, kip, ayarla, yenile, seciciHtml, temaIlk, _temaKaydet,
    saatTonu, saatUygula, _saatSaglayici, nabiz, gunIlk, GUN_ANAHTAR,
    YUZEYLER, yuzey:() => yuzeySimdi, yuzeyAyarla, yuzeySeciciHtml, yuzeyAnahtar,
    MANZARA_ANAHTAR, manzara:() => manzaraSimdi, manzaraAyarla, manzaraYenile, manzaraSeciciHtml,
    GECE_ANAHTAR, OTO_ANAHTAR, gece:() => geceSimdi, geceAyarla, geceSeciciHtml, oto:() => otoSimdi, otoAyarla, otoSeciciHtml,
    otoTema, etkinZemin, karanlik, dosyaYukle, onizle, onizleHtml, ONIZLE_SADE });
  /* Gövde hazır olunca, ilk çizimden biraz sonra: açılış animasyonuyla çakışmasın. */
  if(typeof document !== 'undefined' && typeof setTimeout === 'function'
      && !/\/tests\//.test(String(location.pathname || ''))){   // test sayfasında kendiliğinden oynamaz
    const bas = () => setTimeout(() => { try{ if(oku() === 'yumusak') gunIlk(); }catch(e){ /* süs */ } }, 900);
    if(document.readyState === 'complete') bas(); else window.addEventListener('load', bas);
  }
})();
