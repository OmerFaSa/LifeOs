/* kabuk/an.js — Anlar (tur 2026-11-17e, yon.md adım 4): ders bitince, kapı geçilince, günün ilk kaydında küçük, zarif bir an.
 *  - ders: hedefin (yeni sayfanın başlığı) üstünden ışık süzülür, birkaç altın kıvılcım yükselir
 *  - kapi: hedefin solunda kırlangıç kuyruklu sancak yükselir ve iki kez dalgalanır, altın kıvılcım saçılır
 *  - kayit: kaydın durum satırından küçük piksel kıvılcım (yalnız günün ilk kaydında)
 * Hepsi < 1 sn, sahnelerin paletinden, 3 px'lik keskin pikseller; aynı an art arda (4 sn) tekrar etmez; hareket azsa hiç yok.
 * Süs: aria-hidden tuval, işaretçi olaylarını almaz; ekran okuyucuya ayrı duyuru yok (metin zaten ekranda).
 * Sayılar: hedefin içindeki [data-an-say] öğeleri (metni tam sayı) 0'dan ya da data-an-once'den sayarak artar.
 * Tetikleme: document.dispatchEvent(new CustomEvent('lifeos:an', { detail: { tur: 'ders' | 'kapi' | 'kayit', el? } })) ya da Kabuk.An.oynat(tur, el).
 * Kabuk bu olayı göndermese de kendisi sezer: kapı sonucu paneli ([data-sonuc="gecti"]) sayfaya gelince, «okudum» ile ders bitince
 * (sonraki sayfanın başlığında), gönderilen formdan sonra ekranda yeni bir «kaydedildi» belirince. Node'da yalnız saf hesap. */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var SURE = { ders: 750, kapi: 900, kayit: 600 }, ARA = 4000, PX = 3;

  // Saf: aynı an ARA ms içinde ikinci kez oynamaz; başka an oynar
  function gecer(son, tur, simdi) { return !!SURE[tur] && !(son && son.tur === tur && simdi - son.t < ARA); }
  function gunAnahtar(t) { var d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  // Saf: sayarak artış (yavaşlayarak varır); f 0..1
  function sayAdim(a, b, f) { f = Math.max(0, Math.min(1, f)); return Math.round(a + (b - a) * (1 - Math.pow(1 - f, 3))); }
  // Saf: tohumlu kıvılcımlar [x 0..1, hız, yön, gecikme]; aynı tohum aynı desen (sınama ve görüntü kararlı)
  function kivilcimlar(n, tohum) {
    var l = [], v = tohum >>> 0;
    function r() { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }
    for (var i = 0; i < n; i++) l.push([r(), 0.6 + r() * 0.6, r() * 2 - 1, r() * 0.25]);
    return l;
  }
  var A = { gecer: gecer, gunAnahtar: gunAnahtar, sayAdim: sayAdim, kivilcimlar: kivilcimlar, SURE: SURE };
  Kabuk.An = A;
  if (typeof module !== 'undefined' && module.exports) module.exports = A;
  if (typeof document === 'undefined') return;

  var d = document, son = null, KAYIT_GUN = 'lifeos.an.kayit';
  function hareketAz() {
    try {
      var r = d.documentElement, h = r.getAttribute('data-hareket');
      if (h === 'az' || r.style.getPropertyValue('--sure').trim() === '0s') return true;
      return h !== 'tam' && !!kok.matchMedia && kok.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return true; }
  }
  function oku(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function yaz(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* özel pencere */ } }
  function hedefBul(el) { return el && el.isConnected ? el : d.querySelector('#sayfa h1') || d.querySelector('#sayfa'); }

  function say(el, hedef, ms) {
    var a = +el.getAttribute('data-an-once') || 0, t0 = performance.now();
    if (hareketAz() || !(hedef > a)) { el.textContent = String(hedef); return; }
    (function adim(t) { var f = (t - t0) / ms; el.textContent = String(sayAdim(a, hedef, f)); if (f < 1) requestAnimationFrame(adim); })(t0);
  }

  // Tuval hedefin çevresine (üstte sancak/kıvılcım payı) sabit konumla oturur; bitince kalkar.
  function oynat(tur, el) {
    var simdi = Date.now();
    if (hareketAz() || d.hidden || !gecer(son, tur, simdi)) return false;
    if (tur === 'kayit') { var g = gunAnahtar(simdi); if (oku(KAYIT_GUN) === g) return false; yaz(KAYIT_GUN, g); }
    var h = hedefBul(el); if (!h) return false;
    var r = h.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) return false;
    son = { tur: tur, t: simdi };
    [].forEach.call(h.querySelectorAll('[data-an-say]'), function (s) { var v = parseInt(s.textContent, 10); if (isFinite(v)) say(s, v, Math.min(500, SURE[tur])); });
    var pay = 16 * PX, w = Math.min(innerWidth, Math.round(r.width + pay * 2)), y0 = Math.max(0, r.top - pay * 1.5), hh = Math.round(r.bottom + pay * 0.5 - y0);
    var c = d.createElement('canvas'), W = Math.ceil(w / PX), H = Math.ceil(hh / PX);
    c.width = W; c.height = H; c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;left:' + Math.max(0, r.left - pay) + 'px;top:' + y0 + 'px;width:' + W * PX + 'px;height:' + H * PX + 'px;pointer-events:none;z-index:60;image-rendering:pixelated';
    d.body.appendChild(c);
    var g2 = c.getContext('2d'), kv = kivilcimlar(tur === 'kayit' ? 9 : 12, simdi % 997), t0 = performance.now(), T = SURE[tur];
    var ust = Math.round((r.top - y0) / PX), sol = Math.round((r.left - Math.max(0, r.left - pay)) / PX), gen = Math.round(r.width / PX), boy = Math.round(r.height / PX);
    function kare(t) {
      var f = (t - t0) / T;
      if (f >= 1 || !c.isConnected) { c.remove(); return; }
      g2.clearRect(0, 0, W, H);
      CIZ[tur](g2, f, { kv: kv, ust: ust, sol: sol, gen: gen, boy: boy, W: W, H: H });
      requestAnimationFrame(kare);
    }
    requestAnimationFrame(kare);
    setTimeout(function () { c.remove(); }, T + 200);   // sekme arka plandaysa rAF durur: tuval yine kalkar
    return true;
  }
  function nk(g, x, y, c, a) { g.globalAlpha = a; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  var ALTIN = ['#f0cf78', '#c69a48', '#ffe7a0'];
  function kivilcimCiz(g, f, o, x0, y0, yay) {
    o.kv.forEach(function (k, i) {
      var p = (f - k[3]) / (1 - k[3]); if (p <= 0) return;
      var x = x0 + (yay ? k[2] * yay * p : (k[0] - 0.5) * o.gen * 0.9), y = y0 - p * k[1] * 14 + (yay ? p * p * 6 : 0);
      nk(g, x, y, ALTIN[i % 3], (1 - p) * 0.95);
      if (p < 0.4) nk(g, x, y + 1, ALTIN[1], (1 - p) * 0.5);
    });
    g.globalAlpha = 1;
  }
  var CIZ = {
    // ışık süzülmesi: 45° eğik, 5 piksel genişlikte sıcak şerit soldan sağa; altta yükselen kıvılcımlar
    ders: function (g, f, o) {
      var bx = o.sol - 8 + (o.gen + 16) * f, a = Math.sin(Math.PI * Math.min(1, f * 1.2)) * 0.32;
      g.fillStyle = '#ffe2a8';
      for (var y = 0; y < o.boy; y++) { g.globalAlpha = a; g.fillRect(Math.round(bx - y * 0.6), o.ust + y, 5, 1); g.globalAlpha = a * 0.5; g.fillRect(Math.round(bx - y * 0.6) + 5, o.ust + y, 2, 1); }
      g.globalAlpha = 1;
      kivilcimCiz(g, f, o, o.sol + o.gen / 2, o.ust + 2, 0);
    },
    // sancak: direk yükselir, kırlangıç kuyruklu bayrak dalgalanır, sonda söner; kıvılcım direğin tepesinden saçılır
    kapi: function (g, f, o) {
      var x = Math.max(2, o.sol - 6), dib = o.ust + Math.min(o.boy, 10), L = 14, yuk = Math.min(1, f / 0.3), tepe = dib - Math.round(L * yuk), a = f > 0.8 ? (1 - f) / 0.2 : 1;
      g.globalAlpha = a; g.fillStyle = '#5a3c26'; g.fillRect(x, tepe, 1, dib - tepe); g.fillStyle = '#f0cf78'; g.fillRect(x, tepe - 1, 1, 1);
      for (var i = 0; i < 7; i++) {
        var dy = Math.round(Math.sin(i * 0.9 - f * 14) * (i / 7) * 1.4), kes = i >= 5 ? i - 4 : 0;
        for (var j = 0; j < 5; j++) { if (kes && Math.abs(j - 2) < kes) continue; g.fillStyle = Math.cos(i * 0.9 - f * 14) < -0.3 ? '#8e2925' : '#b8352f'; g.fillRect(x + 1 + i, tepe + 1 + j + dy, 1, 1); }
        if (i === 2) { g.fillStyle = '#f6efe2'; g.fillRect(x + 1 + i, tepe + 3 + dy, 1, 1); }
      }
      g.globalAlpha = 1;
      if (f > 0.3) kivilcimCiz(g, (f - 0.3) / 0.7, o, x + 4, tepe, 6);
    },
    kayit: function (g, f, o) { kivilcimCiz(g, f, o, Math.min(o.sol + 6, o.W - 2), o.ust + Math.round(o.boy / 2), 5); }
  };
  A.oynat = oynat; A.say = say;
  d.addEventListener('lifeos:an', function (e) { var x = e.detail || {}; oynat(x.tur, x.el); });

  // ---- kendiliğinden sezme (kabuk.js olay göndermese de) ----
  var bekleyenDers = false;
  d.addEventListener('click', function (e) {
    var ac = e.target.closest && e.target.closest('[data-ac="okudum"]');
    if (!ac || !e.isTrusted) return;
    var sorar = +ac.getAttribute('data-bos') > 0 && !ac.hasAttribute('data-yine'), son_ = d.querySelector('.ders-adim__oge:last-child');
    bekleyenDers = !sorar && !!son_ && son_.getAttribute('data-adim') !== 'bitti';   // ders şimdi bitiyor (zaten bitmişse «Sıradaki» yalnız gezinir)
    if (bekleyenDers) setTimeout(function () { bekleyenDers = false; }, 2000);   // ders kilitliyse ya da sayfa değişmediyse bekleyen an düşer
  }, true);
  d.addEventListener('submit', function (e) {
    var f = e.target; if (!e.isTrusted || f.matches('form.kapi') || (f.closest && f.closest('[data-king-bolum]'))) return;
    var once = tamamSay();
    setTimeout(function () { if (tamamSay() > once) oynat('kayit', sonTamam() || f); }, 250);
  }, true);
  function tamamSay() { var s = d.getElementById('sayfa'); return s ? (s.textContent.match(/kaydedildi/gi) || []).length + s.querySelectorAll('.b-uyari--tamam').length : 0; }
  function sonTamam() { var l = d.querySelectorAll('#sayfa .b-uyari--tamam'); return l[l.length - 1] || null; }
  function izle() {
    var s = d.getElementById('sayfa'); if (!s) return;
    new MutationObserver(function () {
      var p = s.querySelector('[data-sonuc="gecti"]');
      if (p) return requestAnimationFrame(function () { oynat('kapi', p); });
      if (bekleyenDers) { bekleyenDers = false; requestAnimationFrame(function () { oynat('ders', s.querySelector('h1')); }); }
    }).observe(s, { childList: true });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', izle); else izle();
})(typeof window !== 'undefined' ? window : globalThis);
