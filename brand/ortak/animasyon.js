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
  /* SEÇİM SAYFASI (4180) ayrı kapıdır: modülün deposunu göremez. Tercih
     kapıya bakmayan çereze de yazılır; deposunda tercih olmayan sayfa
     (seçim sayfası, ilk açılan modül) çerezden okur (2026-10-06). */
  const CEREZ = 'lifeos_hareket';
  function cerezOku(){
    try{ const m = document.cookie.match(/(?:^|;\s*)lifeos_hareket=([^;]*)/); return m ? m[1] : null; }catch(e){ return null; }
  }
  function cerezYaz(k){
    try{
      const guvenli = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = CEREZ + '=' + k + '; Path=/; Max-Age=34560000; SameSite=Strict' + guvenli;
    }catch(e){ /* çerez kapalı: bu kapıda geçerli */ }
  }
  function oku(){
    let v = null;
    try{ v = localStorage.getItem(ANAHTAR); }catch(e){}
    if(KIPLER.indexOf(v) >= 0){
      if(cerezOku() !== v) cerezYaz(v);
      return v;
    }
    const c = cerezOku();
    return KIPLER.indexOf(c) >= 0 ? c : varsayilan();
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
    cerezYaz(k);
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

  /* ---------------------------------------------------------- geçiş

     SEÇİM SAYFASINDAN MODÜLE (kullanıcı, 2026-10-08: «Aç'a tıklayınca ani
     geçiyor; modül animasyonla açılsın»). Modüller ayrı kapıdadır (köken):
     tarayıcının sayfa geçişi (View Transitions) kökenler arasında çalışmaz.
     Geçiş bu yüzden iki yarıdır ve ortadaki sayfa değişimi GÖRÜNMEZ:
       1. Basılan kart (ya da kenardaki modül bağlantısı) yerinden büyüyüp
          ekranı kaplar ve modülün MARKA PERDESİNE dönüşür: aynı buğulu cam,
          aynı logo, aynı yerde ve boyda (brand/seviye/seviye.css
          .perde--marka). Önce yer, sonra logo; 560 ms, sakin başlar.
       2. Sayfa değişir. Varılan modül ilk karede perdeyi zaten gösterir;
          kapıya bakmayan kısa ömürlü çerez (`lifeos_gecis`, 15 sn) «geçişle
          geldin» der ve perdenin logosu yeniden belirmez — zaten yerinde.
     Azaltılmış harekette (bu dosyanın kipi) oynamaz: bağlantı olağan
     açılır. Ctrl/⌘/orta tık ve yeni sekme dokunulmadan geçer. Geri tuşuyla
     dönülen sayfada (bfcache) perde kalmaz. Merkez'in (HKM) marka perdesi
     yoktur: yeni sekmede açılır, kendi sayfası kısa bir girişle belirir. */

  const GECIS_CEREZ = 'lifeos_gecis';
  const GECIS_MS = 560;
  const GECIS_OMUR = 15000;
  const GECIS_MODUL = /^(ays|spi|esp|hkm)$/;
  /* Perdenin ölçüsü ve camı seviye.css .perde--marka ile AYNIDIR; biri
     değişirse geçişin sonu perdeye oturmaz. */
  const GECIS_STIL = [
    '.lifeos-gecis{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;pointer-events:auto;',
    'overflow:hidden;--g-zemin:rgba(12,13,18,.72);--g-golge:rgba(0,0,0,.5);background:var(--g-zemin);',
    '-webkit-backdrop-filter:blur(28px) saturate(1.35);backdrop-filter:blur(28px) saturate(1.35);',
    'transition:clip-path .56s cubic-bezier(.32,.72,0,1),opacity .2s ease;}',
    ':root[data-theme="light"] .lifeos-gecis{--g-zemin:rgba(244,244,248,.7);--g-golge:rgba(30,34,60,.16);}',
    '@media (prefers-color-scheme:light){:root:not([data-theme="dark"]) .lifeos-gecis{--g-zemin:rgba(244,244,248,.7);',
    '--g-golge:rgba(30,34,60,.16);}}',
    '.lifeos-gecis__ortam{position:absolute;inset:18%;width:64%;height:64%;object-fit:contain;',
    'filter:blur(72px) saturate(1.5);opacity:0;pointer-events:none;transition:opacity .56s ease .1s;}',
    '.lifeos-gecis.is-tam .lifeos-gecis__ortam{opacity:.34;}',
    '.lifeos-gecis__logo{position:relative;width:min(38vw,300px);height:auto;object-fit:contain;opacity:0;',
    'filter:drop-shadow(0 22px 56px var(--g-golge));transform-origin:50% 50%;',
    'transition:transform .56s cubic-bezier(.32,.72,0,1) .04s,opacity .32s ease .08s;}',
    '.lifeos-gecis.is-tam .lifeos-gecis__logo{opacity:1;transform:none;}',
    /* Varış: perde ilk karede durur; logosu yeniden gelmez, zaten yerinde. */
    'html.gecis-gel .perde--marka .perde__logo,html.gecis-gel .perde--marka .perde__ortam{animation:none!important;}',
  ].join('');

  function gecisStil(){
    if(typeof document === 'undefined' || document.getElementById('lifeos-gecis-stil')) return;
    const s = document.createElement('style');
    s.id = 'lifeos-gecis-stil';
    s.textContent = GECIS_STIL;
    (document.head || document.documentElement).appendChild(s);
  }
  function gecisCerezYaz(m, simdi){
    try{
      document.cookie = GECIS_CEREZ + '=' + m + '.' + (simdi || Date.now()) + '; Path=/; Max-Age=15; SameSite=Strict'
        + (location.protocol === 'https:' ? '; Secure' : '');
    }catch(e){ /* çerez kapalı: varışta logo yine gelir, geçiş bozulmaz */ }
  }
  /* Varılan sayfada: çerez taze mi? Döner: modül kimliği ya da null.
     Çerez okunur okunmaz silinir: yenilenen sayfa ikinci kez «geçişle
     geldi» sayılmaz. */
  function gecisVaris(cerez, simdi){
    const m = /(?:^|;\s*)lifeos_gecis=([a-z]{2,4})\.(\d{10,16})/.exec(String(cerez == null ? '' : cerez));
    if(!m || !GECIS_MODUL.test(m[1])) return null;
    if(Math.abs((simdi || Date.now()) - Number(m[2])) > GECIS_OMUR) return null;
    return m[1];
  }
  function logoAdresi(modul, url){
    try{ return new URL('img/marka/kimlik-' + modul + '.webp', url || location.href).href; }catch(e){ return ''; }
  }
  const onyuklenen = {};
  function gecisOnyukle(modul, url){
    const a = logoAdresi(modul, url);
    if(!a || onyuklenen[a] || typeof Image !== 'function') return;
    onyuklenen[a] = new Image();
    onyuklenen[a].src = a;
  }

  /* o = { modul, url, kaynak:Element (büyüyen kart), logoKaynak:Element
     (logonun çıktığı yer), git:Function, sure:ms (test) }. Döner: geçiş
     oynadı mı (false: çağıran olağan yolu izler). */
  let gecisAktif = false;
  /* Sayfayı değiştiren tek yer; testler değiştirir (sayfa gitmesin). */
  let yonlendir = h => { window.location.href = h; };
  function gecisBitir(){
    if(typeof document !== 'undefined') document.querySelectorAll('.lifeos-gecis').forEach(x => x.remove());
    gecisAktif = false;
  }
  function gecis(o){
    o = o || {};
    if(typeof document === 'undefined' || !document.body || hareketAz() || gecisAktif) return false;
    if(!GECIS_MODUL.test(o.modul || '') || typeof o.git !== 'function') return false;
    gecisAktif = true;
    gecisStil();
    const vw = window.innerWidth, vh = window.innerHeight;
    /* Görünmeyen kaynak (kapanmış pencere) ölçü vermez: perde ortadan açılır. */
    const olc = el => {
      const b = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      return b && b.width > 0 && b.height > 0 ? b : null;
    };
    const k = olc(o.kaynak);
    const r = k ? Math.max(0, parseFloat(getComputedStyle(o.kaynak).borderTopLeftRadius) || 20) : 0;
    const kap = document.createElement('div');
    kap.className = 'lifeos-gecis';
    kap.setAttribute('aria-hidden', 'true');
    kap.style.clipPath = k ? 'inset(' + Math.max(0, k.top) + 'px ' + Math.max(0, vw - k.right) + 'px '
      + Math.max(0, vh - k.bottom) + 'px ' + Math.max(0, k.left) + 'px round ' + r + 'px)' : 'inset(50% 50% 50% 50% round 24px)';
    const adres = logoAdresi(o.modul, o.url);
    const ortam = document.createElement('img'), logo = document.createElement('img');
    ortam.className = 'lifeos-gecis__ortam'; logo.className = 'lifeos-gecis__logo';
    ortam.alt = ''; logo.alt = '';
    ortam.onerror = () => ortam.remove(); logo.onerror = () => logo.remove();
    if(adres){ ortam.src = adres; logo.src = adres; }
    kap.appendChild(ortam); kap.appendChild(logo);
    document.body.appendChild(kap);
    /* Logo kartın küçük işaretinden çıkar (FLIP): son yerine göre farkı
       ve oranı başta verilir, sonra bırakılır. */
    const lk = olc(o.logoKaynak) || k;
    const son = Math.min(vw * 0.38, 300);
    if(lk){
      const dx = (lk.left + lk.width / 2) - vw / 2, dy = (lk.top + lk.height / 2) - vh / 2;
      logo.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + Math.max(0.08, lk.width / son) + ')';
    }else{
      logo.style.transform = 'translateY(14px) scale(.94)';
    }
    void kap.offsetWidth;                            // başlangıç çizilsin, sonra geçiş
    kap.classList.add('is-tam');
    kap.style.clipPath = 'inset(0px 0px 0px 0px round 0px)';
    logo.style.transform = '';
    const sure = typeof o.sure === 'number' ? o.sure : GECIS_MS + 40;
    setTimeout(() => {
      gecisCerezYaz(o.modul);
      try{ o.git(); }catch(e){ console.error('Geçiş:', e); }
      /* Sayfa değişmediyse (engellendi, hata) perde kendiliğinden kalkar. */
      setTimeout(() => { if(kap.isConnected){ kap.remove(); gecisAktif = false; } }, 6000);
    }, sure);
    return true;
  }

  /* ---------------------------------------------------------- kurulum */

  if(typeof document !== 'undefined' && document.documentElement){
    const gelen = gecisVaris(document.cookie);
    if(/lifeos_gecis=/.test(document.cookie || '')){
      try{ document.cookie = GECIS_CEREZ + '=; Path=/; Max-Age=0; SameSite=Strict'; }catch(e){}
    }
    if(gelen){
      document.documentElement.classList.add('gecis-gel');
      document.documentElement.setAttribute('data-gecis', gelen);
      gecisStil();
    }
  }

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
    /* Seçim sayfasının kartı (sistem/sunucu.py giris_html): olağan tık
       geçişle açılır. Merkez kartının kendi işleyicisi var (yeni sekme). */
    const secimKarti = t => {
      const a = t && t.closest ? t.closest('a.kart[data-modul]') : null;
      return a && !a.hasAttribute('data-hkm') && /^(ays|spi|esp)$/.test(a.getAttribute('data-modul')) ? a : null;
    };
    document.addEventListener('click', e => {
      if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = secimKarti(e.target);
      if(!a || (a.target && a.target !== '_self')) return;
      if(gecisAktif){ e.preventDefault(); return; }    // ikinci tık perdeyi kesip sayfayı ani açmasın
      const href = a.href;
      if(gecis({ modul:a.getAttribute('data-modul'), url:href, kaynak:a, logoKaynak:a.querySelector('.logo') || a,
        git:() => yonlendir(href) })) e.preventDefault();
    });
    /* Logo, basılmadan önce gelsin: üzerine gelince ya da dokununca. */
    const onyukle = e => {
      const a = secimKarti(e.target);
      if(a) gecisOnyukle(a.getAttribute('data-modul'), a.href);
    };
    document.addEventListener('pointerover', onyukle, { passive:true });
    document.addEventListener('pointerdown', onyukle, { passive:true });
  }
  if(typeof window !== 'undefined' && window.addEventListener){
    /* Geri tuşuyla dönülen sayfa (bfcache) perdeyle donmuş kalmasın. */
    window.addEventListener('pageshow', e => { if(e.persisted) gecisBitir(); });
  }
  if(typeof window !== 'undefined' && window.addEventListener){
    window.addEventListener('storage', e => { if(e.key === ANAHTAR) yenile(); });
  }

  L.hareketAz = hareketAz;
  L.ANIMASYON = Object.freeze({
    ANAHTAR, KIPLER, TASINAN,
    kip, ayarla, yenile, varsayilan, sistemAz, hareketAz,
    donustur, uygula, seciciHtml, tasimaEkle, tasimaAl,
    gecis, gecisVaris, gecisOnyukle, gecisBitir, logoAdresi, GECIS_CEREZ, GECIS_MS,
    _yonlendir:fn => { const eski = yonlendir; if(typeof fn === 'function') yonlendir = fn; return eski; },
  });
})();
