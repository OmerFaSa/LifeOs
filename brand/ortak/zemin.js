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

  uygula();
  temaIlk();
  if(typeof document !== 'undefined' && typeof MutationObserver !== 'undefined'){
    /* Tema değişince saat tonu da hemen tazelenir (koyuda yarısı). */
    new MutationObserver(() => { _temaKaydet(); saatUygula(); }).observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
  }
  if(typeof document !== 'undefined'){
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest ? e.target.closest('[data-zemin-sec]') : null;
      if(!b) return;
      e.preventDefault();
      ayarla(b.getAttribute('data-zemin-sec'));
    });
  }
  if(typeof window !== 'undefined' && window.addEventListener){
    window.addEventListener('storage', e => { if(e.key === ANAHTAR) yenile(); });
    try{ window.matchMedia('(prefers-reduced-transparency: reduce)').addEventListener('change', uygula); }catch(e){}
    try{ window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => saatUygula()); }catch(e){}
  }

  saatUygula();
  if(typeof setInterval === 'function') setInterval(saatUygula, 5 * 60 * 1000);

  L.ZEMIN = Object.freeze({ ANAHTAR, KIPLER, TEMA, kip, ayarla, yenile, seciciHtml, temaIlk, _temaKaydet,
    saatTonu, saatUygula, _saatSaglayici });
})();
