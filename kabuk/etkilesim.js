/* kabuk/etkilesim.js — İmlece tepki veren hareketler (sahibin isteği 2026-11-15: «biraz daha güzel, biraz daha etkileşimli»).
 * Hepsi süs; içerik ve sınamalar bunlara dayanmaz:
 *  - ışık: kartların üstünde imleci izleyen yumuşak bir parıltı (--mx/--my, kabuk.css .isik)
 *  - eğim: ızgara kartları imlece doğru en çok 4° eğilir (--rx/--ry)
 *  - dalga: düğmeye ve seçeneklere basılan noktadan halka yayılır
 *  - derinlik: sayfa başındaki piksel manzara imlece göre hafifçe kayar (--px/--py)
 * Hareket «az»sa (--sure 0) ya da dokunmatik ekransa hiçbiri çalışmaz (dalga dokunmatikte de çalışır). Node'da yalnız saf hesap (egim). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};

  // Saf: kartın içindeki nokta → eğim (derece). Ortada 0, köşede ±en; dışarıdaysa sınırda kalır.
  function egim(x, y, w, h, en) {
    var nx = Math.max(-1, Math.min(1, (x / Math.max(1, w)) * 2 - 1)), ny = Math.max(-1, Math.min(1, (y / Math.max(1, h)) * 2 - 1));
    return { rx: +(-ny * en).toFixed(2), ry: +(nx * en).toFixed(2) };
  }
  var E = { egim: egim };
  Kabuk.Etkilesim = E;
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
  if (typeof document === 'undefined') return;

  var d = document, KART = '.b-karsilama__alan, a.b-satir, a.b-ders, .b-sayi, .hs-kimlik, .b-dugme', EGIK = '.b-karsilama__alan, a.b-ders, .b-sayi';
  var SAHNE = '.kapak, .b-karsilama__sahne', DALGA = '.b-dugme, .b-tercih__sec, .b-soru__sik, .ust__sekmeler a';
  var ince = kok.matchMedia && kok.matchMedia('(hover: hover) and (pointer: fine)');
  function acik() { try { return getComputedStyle(d.documentElement).getPropertyValue('--sure').trim() !== '0s'; } catch (e) { return false; } }

  var bekleyen = null, kare = 0, son = null, sahneSon = null;
  function uygula() {
    kare = 0; var e = bekleyen; if (!e) return;
    var k = e.target.closest && e.target.closest(KART);
    if (son && son !== k) birak(son);
    if (k) {
      var r = k.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      k.classList.add('isik'); k.style.setProperty('--mx', x + 'px'); k.style.setProperty('--my', y + 'px');
      if (k.matches(EGIK)) { var g = egim(x, y, r.width, r.height, 4); k.style.setProperty('--rx', g.rx + 'deg'); k.style.setProperty('--ry', g.ry + 'deg'); }
    }
    son = k;
    var s = e.target.closest && e.target.closest(SAHNE);
    if (sahneSon && sahneSon !== s) { sahneSon.style.removeProperty('--px'); sahneSon.style.removeProperty('--py'); }
    if (s) {
      var q = s.getBoundingClientRect();
      s.style.setProperty('--px', (((e.clientX - q.left) / q.width) * 2 - 1).toFixed(3)); s.style.setProperty('--py', (((e.clientY - q.top) / q.height) * 2 - 1).toFixed(3));
    }
    sahneSon = s;
  }
  function birak(k) { k.classList.remove('isik'); k.style.removeProperty('--rx'); k.style.removeProperty('--ry'); }
  d.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || (ince && !ince.matches) || !acik()) return;
    bekleyen = e; if (!kare) kare = requestAnimationFrame(uygula);
  }, { passive: true });
  d.addEventListener('pointerleave', function () { if (son) birak(son); son = null; }, true);

  d.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest(DALGA);
    if (!b || e.button > 0 || b.getAttribute('aria-disabled') === 'true' || !acik()) return;
    var r = b.getBoundingClientRect(), z = Math.hypot(Math.max(e.clientX - r.left, r.right - e.clientX), Math.max(e.clientY - r.top, r.bottom - e.clientY)) * 2;
    var s = d.createElement('span'); s.className = 'dalga'; s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'width:' + z + 'px;height:' + z + 'px;left:' + (e.clientX - r.left - z / 2) + 'px;top:' + (e.clientY - r.top - z / 2) + 'px';
    b.appendChild(s);
    s.addEventListener('animationend', function () { s.remove(); });
    setTimeout(function () { s.remove(); }, 1200);
  }, { passive: true });

  // Açılır bölüm yalnız kullanıcı açınca süzülür; aynı sayfanın yeniden çiziminde açık gelen bölüm yeniden oynamaz.
  d.addEventListener('click', function (e) {
    var u = e.target.closest && e.target.closest('summary'), a = u && u.parentElement;
    if (!a || a.tagName !== 'DETAILS' || a.open) return;
    a.classList.add('acildi'); setTimeout(function () { a.classList.remove('acildi'); }, 800);
  });
})(typeof window !== 'undefined' ? window : globalThis);
