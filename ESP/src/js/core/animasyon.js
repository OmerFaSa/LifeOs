/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/animasyon.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* ANİMASYONLAR — LifeOS'un kendi hareket ayarı: Tam · Az · Sistem.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/animasyon.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Kopyayı elle
   düzenleme. Testi `brand/ortak/animasyon.test.js`.
   ==================================================================

   NEDEN

   Kullanıcının Windows'unda «Animasyon efektleri» KAPALI (2026-10-02,
   ölçüldü: ClientAreaAnimation=False). Chrome bunu
   `prefers-reduced-motion: reduce` diye bildirir; base.css o durumda
   bütün geçişleri sıfırlar ve kenar 64→208 px ANINDA açılır. Kullanıcı
   aynı gün üç kez animasyon istedi. İşletim sisteminin ayarı bütün
   bilgisayarındır; LifeOS'ta ne göreceği LifeOS'un ayarı olmalı.

   KİPLER (tercih `localStorage` 'lifeos.hareket')

     tam     tarayıcı ne derse desin bütün geçişler oynar   (VARSAYILAN)
     az      kayma yok, yalnız solma — base.css'in azaltılmış kipi
     sistem  işletim sisteminin bildirdiği tercih (eski davranış)

   Varsayılan TAM: kullanıcı kararıdır (DEVIR-RADYO.md, «üç kez animasyon
   istedi»). İSTİSNA: `navigator.webdriver` — denetim araçları (smoke,
   layout, design, palette…) tarayıcıyı `reducedMotion:'reduce'` ile açar
   ve belirli bir yerleşim ölçer; orada varsayılan Sistem'dir, yoksa ölçüm
   animasyonun ortasına düşerdi.

   NASIL

   CSS: `document.styleSheets` içindeki her medya kuralında
   `prefers-reduced-motion` geçiyorsa kuralın `media.mediaText`'i
   değiştirilir — Tam'da koşul hiç tutmaz (`not all`), Az'da koşul düşer
   (`all` ya da kalan `(min-width:…)`), Sistem'de özgün metin geri gelir
   (WeakMap'te saklanır; kipten kipe geçiş hep özgünden hesaplanır).
   Bu dosya `<head>`'de, stillerden SONRA ve ilk çizimden ÖNCE yüklenir.

   JS: ~37 yerde `matchMedia('(prefers-reduced-motion: reduce)')` çağrılır
   (hareket.js, kabuk.js, components.js, perde.js…). Hepsini tek tek
   değiştirmek yerine `window.matchMedia` YALNIZ bu sorgu için sarılır:
   sorgu aynı dönüştürücüden geçer ve gerçek `matchMedia`'ya sorulur.
   Öteki sorgulara dokunulmaz. Kısa yol: `LIFEOS.hareketAz()`.

   MODÜLLER ARASI

   Modüller ayrı kapılarda açılır (4173/4183/4193) ve tarayıcı deposu
   kökene, yani KAPIYA bağlıdır: AYS'nin `localStorage`'ı SPİ'de görünmez
   (sistem/sunucu.py başındaki not). «Üç modülde ortak» tercih bu yüzden
   LifeOS'un kendi modül geçişinde taşınır: kabuk.js `gecis()` adresin
   sonuna `#lifeos=…` ekler, varılan sayfada bu dosya (ilk betik) onu
   okur, kendi deposuna yazar ve adresten siler (zemin.js bu dosyadan
   SONRA yüklenir, taşınanı okur). Yalnız `TASINAN`
   listesindeki anahtarlar taşınır; kullanıcı verisi taşınmaz, parça
   (#…) sunucuya hiç gitmez. Yer imiyle doğrudan açılan modül kendi son
   ayarıyla açılır. */

window.LIFEOS = window.LIFEOS || {};

(function(){
  'use strict';

  const L = window.LIFEOS;
  const ANAHTAR = 'lifeos.hareket';
  const KIPLER = Object.freeze(['tam', 'az', 'sistem']);
  const AD = { tam:'Tam', az:'Az', sistem:'Sistem' };
  const IPUCU = {
    tam:'Bütün geçişler oynar',
    az:'Kayma yok, yalnız solma',
    sistem:'İşletim sisteminin ayarını izler',
  };
  const SORGU = /prefers-reduced-motion/i;
  const OZELLIK = /^\(\s*prefers-reduced-motion\s*(?::\s*([a-z-]+)\s*)?\)$/i;
  const ORJ = new WeakMap();
  const gercekMM = typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null;

  /* ---------------------------------------------------------- kip */

  function varsayilan(webdriver){
    if(webdriver == null){ try{ webdriver = !!navigator.webdriver; }catch(e){ webdriver = false; } }
    return webdriver ? 'sistem' : 'tam';
  }
  function oku(){
    let v = null;
    try{ v = localStorage.getItem(ANAHTAR); }catch(e){}
    return KIPLER.indexOf(v) >= 0 ? v : varsayilan();
  }
  /* Her matchMedia çağrısında depoya gidilmez: kip bellekte tutulur,
     ayarla(), yenile() ve başka sekmenin yazması (storage) tazeler. */
  let simdiki = oku();
  function kip(){ return simdiki; }

  function sistemAz(){
    try{ return !!(gercekMM && gercekMM('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; }
  }
  function hareketAz(){ return simdiki === 'az' ? true : simdiki === 'tam' ? false : sistemAz(); }

  /* ---------------------------------------------------------- dönüştürücü

     Medya sorgu listesi: virgülle ayrılmış sorgular; her biri isteğe bağlı
     `not`/`only` + `and` ile bağlı parçalar. `prefers-reduced-motion`
     parçası kipe göre doğru ya da yanlış sayılır: doğruysa düşer, yanlışsa
     sorgu hiç tutmaz. Çözülemeyen sözdizimi (or, iç içe) olduğu gibi kalır. */
  function donustur(metin, az){
    let hepsi = false;
    const kalan = [];
    String(metin).split(',').forEach(ham => {
      const q = ham.trim();
      if(!q) return;
      if(!SORGU.test(q)){ kalan.push(q); return; }
      const m = /^(not\s+|only\s+)?([\s\S]*)$/i.exec(q);
      const onek = (m[1] || '').trim().toLowerCase();
      const parca = m[2].split(/\s+and\s+/i).map(s => s.trim()).filter(Boolean);
      let dogru = true;
      const geri = [];
      parca.forEach(p => {
        const f = OZELLIK.exec(p);
        if(!f){ geri.push(p); return; }
        const deger = (f[1] || 'reduce').toLowerCase();
        if(!(deger === 'no-preference' ? !az : az)) dogru = false;
      });
      if(geri.some(p => SORGU.test(p))){ kalan.push(q); return; }
      const degil = onek === 'not';
      if(!dogru){ if(degil) hepsi = true; return; }
      if(!geri.length){ if(!degil) hepsi = true; return; }
      kalan.push((degil ? 'not ' + (/^\(/.test(geri[0]) ? 'all and ' : '') : onek === 'only' ? 'only ' : '')
        + geri.join(' and '));
    });
    if(hepsi) return 'all';
    return kalan.length ? kalan.join(', ') : 'not all';
  }

  /* ---------------------------------------------------------- CSS */

  function medyaKuraliMi(r){
    if(typeof CSSMediaRule !== 'undefined') return r instanceof CSSMediaRule;
    return r && r.type === 4;
  }
  function gez(kurallar, fn){
    Array.from(kurallar || []).forEach(r => {
      if(medyaKuraliMi(r)) fn(r);
      if(r.styleSheet){ try{ gez(r.styleSheet.cssRules, fn); }catch(e){} }   /* @import */
      if(r.cssRules) gez(r.cssRules, fn);                                     /* @media, @supports, @layer */
    });
  }
  /* Döner: hareket koşulu taşıyan kaç kural bulundu. Başka kökenden gelen
     sayfa (cssRules okunamaz) sessizce atlanır. */
  function uygula(k, sayfalar){
    k = KIPLER.indexOf(k) >= 0 ? k : simdiki;
    const liste = sayfalar || (typeof document !== 'undefined' ? Array.from(document.styleSheets) : []);
    let n = 0;
    liste.forEach(ss => {
      let kurallar;
      try{ kurallar = ss.cssRules; }catch(e){ return; }
      gez(kurallar, r => {
        const orj = ORJ.has(r) ? ORJ.get(r) : r.media.mediaText;
        if(!SORGU.test(orj)) return;
        ORJ.set(r, orj);
        const yeni = k === 'sistem' ? orj : donustur(orj, k === 'az');
        if(r.media.mediaText !== yeni){ try{ r.media.mediaText = yeni; }catch(e){} }
        n++;
      });
    });
    if(!sayfalar && typeof document !== 'undefined' && document.documentElement){
      document.documentElement.setAttribute('data-hareket', k);
    }
    return n;
  }

  /* ---------------------------------------------------------- JS */

  if(gercekMM){
    window.matchMedia = function(q){
      if(simdiki !== 'sistem' && SORGU.test(String(q))) return gercekMM(donustur(String(q), simdiki === 'az'));
      return gercekMM(q);
    };
  }

  /* ---------------------------------------------------------- ayar */

  function seciciGuncelle(){
    if(typeof document === 'undefined') return;
    document.querySelectorAll('[data-animasyon]').forEach(b => {
      const on = b.getAttribute('data-animasyon') === simdiki;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function ayarla(k){
    if(KIPLER.indexOf(k) < 0) return false;
    try{ localStorage.setItem(ANAHTAR, k); }catch(e){ /* depo kapalı: bu sayfada geçerli */ }
    simdiki = k;
    uygula(k);
    seciciGuncelle();
    try{ window.dispatchEvent(new CustomEvent('lifeos:hareket', { detail:{ kip:k } })); }catch(e){}
    return true;
  }
  /* Depodan yeniden okur ve uygular (test, başka sekme). */
  function yenile(){
    simdiki = oku();
    uygula(simdiki);
    seciciGuncelle();
    return simdiki;
  }

  /* Görünüm panelinin satırı. Olay belge düzeyinde bağlıdır: modülün
     data-act işleyicisine düşmez. */
  function seciciHtml(){
    return '<div class="seg seg--block anisec" role="group" aria-label="Animasyonlar">'
      + KIPLER.map(k => '<button type="button" class="' + (k === simdiki ? 'is-on' : '') + '" data-animasyon="' + k + '"'
        + ' aria-pressed="' + (k === simdiki ? 'true' : 'false') + '" title="' + IPUCU[k] + '">' + AD[k] + '</button>').join('')
      + '</div>';
  }

  /* ---------------------------------------------------------- modüller arası */

  const TASINAN = Object.freeze(['lifeos.hareket', 'lifeos.ses', 'lifeos.zemin']);
  const ISARET = '#lifeos=';

  function tasimaEkle(url){
    const veri = {};
    TASINAN.forEach(k => {
      let v = null;
      try{ v = localStorage.getItem(k); }catch(e){}
      if(v != null) veri[k] = v;
    });
    if(!Object.keys(veri).length) return url;
    return String(url).split('#')[0] + ISARET + encodeURIComponent(JSON.stringify(veri));
  }
  /* Döner: depoya yazılan anahtar sayısı. */
  function tasimaAl(hash){
    if(typeof hash !== 'string' || hash.indexOf(ISARET) !== 0) return 0;
    let veri;
    try{ veri = JSON.parse(decodeURIComponent(hash.slice(ISARET.length))); }catch(e){ return 0; }
    if(!veri || typeof veri !== 'object') return 0;
    let n = 0;
    TASINAN.forEach(k => {
      const v = veri[k];
      if(typeof v !== 'string' || v.length > 4000) return;
      try{ localStorage.setItem(k, v); n++; }catch(e){}
    });
    return n;
  }
  if(typeof location !== 'undefined' && typeof location.hash === 'string' && location.hash.indexOf(ISARET) === 0){
    tasimaAl(location.hash);
    try{ history.replaceState(history.state, '', location.pathname + location.search); }catch(e){}
    simdiki = oku();
  }

  /* ---------------------------------------------------------- kurulum */

  uygula(simdiki);
  if(typeof document !== 'undefined'){
    /* Gövdede sonradan gelen stiller (tek dosya sürümü, test sayfası) için
       bir kez daha. Kural zaten değiştiyse aynı metin yeniden yazılmaz. */
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => uygula(simdiki));
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest ? e.target.closest('[data-animasyon]') : null;
      if(!b) return;
      e.preventDefault();
      ayarla(b.getAttribute('data-animasyon'));
    });
  }
  if(typeof window !== 'undefined' && window.addEventListener){
    window.addEventListener('storage', e => { if(e.key === ANAHTAR) yenile(); });
  }

  L.hareketAz = hareketAz;
  L.ANIMASYON = Object.freeze({
    ANAHTAR, KIPLER, TASINAN,
    kip, ayarla, yenile, varsayilan, sistemAz, hareketAz,
    donustur, uygula, seciciHtml, tasimaEkle, tasimaAl,
  });
})();
