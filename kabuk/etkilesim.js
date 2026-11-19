/* kabuk/etkilesim.js — İmlece tepki veren hareketler (sahibin isteği 2026-11-15: «biraz daha güzel, biraz daha etkileşimli»).
 * Hepsi süs; içerik ve sınamalar bunlara dayanmaz:
 *  - ışık: kartların üstünde imleci izleyen yumuşak bir parıltı (--mx/--my, kabuk.css .isik)
 *  - eğim: ızgara kartları imlece doğru en çok 4° eğilir (--rx/--ry)
 *  - dalga: düğmeye ve seçeneklere basılan noktadan halka yayılır
 *  - derinlik: sayfa başındaki piksel manzara imlece göre hafifçe kayar (--px/--py)
 *  - cevap: yeni verilen cevapta yanlış şık sarsılır, doğrunun işareti çizilir (.yeni-cevap)
 *  - ilerleme: değer artınca yeni dilimler dolar, sayı kayar (.yeni); aria-valuenow çizimle birlikte zaten yeni
 *  - tercih: ayar değişince seçili gösterge eski yerinden yenisine kayar (.tercih-kayan)
 * Hareket «az»sa (--sure 0) hiçbiri çalışmaz; ışık, eğim ve derinlik yalnız ince imleçte. Node'da yalnız saf hesap (egim, artanlar). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};

  // Saf: kartın içindeki nokta → eğim (derece). Ortada 0, köşede ±en; dışarıdaysa sınırda kalır.
  function egim(x, y, w, h, en) {
    var nx = Math.max(-1, Math.min(1, (x / Math.max(1, w)) * 2 - 1)), ny = Math.max(-1, Math.min(1, (y / Math.max(1, h)) * 2 - 1));
    return { rx: +(-ny * en).toFixed(2), ry: +(nx * en).toFixed(2) };
  }
  // Saf: önceki ve yeni ilerleme değerlerinden yeni dolan dilimlerin sırası; önceki yoksa (ilk görülüş) ya da artmadıysa boş
  function artanlar(once, simdi) { var l = []; if (once == null || !(simdi > once)) return l; for (var i = once; i < simdi; i++) l.push(i); return l; }
  var E = { egim: egim, artanlar: artanlar };
  Kabuk.Etkilesim = E;
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
  if (typeof document === 'undefined') return;

  var d = document, KART = '.b-karsilama__alan, a.b-satir, a.b-ders', EGIK = '.b-karsilama__alan, a.b-ders'; // yalnız tıklanan kartlar; düğme ve sayı kutusu sakin
  var SAHNE = '.kapak, .b-karsilama__sahne', DALGA = '.b-dugme, .b-tercih__sec, .b-soru__sik, .ust__sekmeler a';
  var ince = kok.matchMedia && kok.matchMedia('(hover: hover) and (pointer: fine)');
  function acik() {
    try {
      var r = d.documentElement, h = r.getAttribute('data-hareket');
      if (h === 'az' || r.style.getPropertyValue('--sure').trim() === '0s') return false;
      return !(h === 'sistem' && kok.matchMedia && kok.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

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

  // ---- mikro etkileşimler: yakalama evresinde tıklanandan önceki durum alınır, kabuk.js yeniden çizer, sonraki karede süs eklenir ----
  function sonraki(f) { requestAnimationFrame(function () { if (acik()) f(); }); }
  function ms(k) { return (parseFloat(getComputedStyle(d.documentElement).getPropertyValue('--sure')) || 0) * k * 1000; }
  d.addEventListener('click', function (e) {
    var t = e.target, sik = t.closest && t.closest('.b-soru[data-soru] [data-h]:not([aria-disabled="true"])');
    if (sik) {
      var id = sik.closest('.b-soru').getAttribute('data-soru');
      return sonraki(function () { var f = d.querySelector('.b-soru[data-soru="' + CSS.escape(id) + '"]'); if (f && f.querySelector('.b-soru__sik--dogru')) f.classList.add('yeni-cevap'); });
    }
    var sec = t.closest && t.closest('[role="radio"][data-ayar]');
    if (sec && sec.getAttribute('aria-checked') !== 'true') {
      var a = sec.getAttribute('data-ayar'), v = sec.getAttribute('data-deger'), eski = sec.parentElement.querySelector('[aria-checked="true"]');
      if (!eski) return;
      var er = eski.getBoundingClientRect();
      sonraki(function () { var y = d.querySelector('[data-ayar-satir="' + CSS.escape(a) + '"] [role="radio"][data-deger="' + CSS.escape(v) + '"][aria-checked="true"]'); if (y) kaydir(er, y); });
    }
  }, true);
  // seçili göstergenin kopyası eski yerden yenisine kayar; o sırada asıl düğmenin zemini gizli, bitince geri gelir (geçişsiz)
  function kaydir(er, y) {
    var g = y.parentElement, gr = g.getBoundingClientRect(), r = y.getBoundingClientRect(), cs = getComputedStyle(y), k = d.createElement('span');
    if (!r.width || !er.width) return;
    k.className = 'tercih-kayan'; k.setAttribute('aria-hidden', 'true');
    k.style.cssText = 'left:' + (r.left - gr.left - g.clientLeft) + 'px;top:' + (r.top - gr.top - g.clientTop) + 'px;width:' + r.width + 'px;height:' + r.height + 'px;background:' +
      cs.backgroundColor + ';box-shadow:' + cs.boxShadow + ';border-radius:' + cs.borderRadius;
    g.insertBefore(k, g.firstChild); y.classList.add('kayiyor');
    var an = k.animate([{ transform: 'translate(' + (er.left - r.left) + 'px,' + (er.top - r.top) + 'px) scale(' + (er.width / r.width) + ',' + (er.height / r.height) + ')' }, { transform: 'none' }],
      { duration: ms(2.25), easing: getComputedStyle(d.documentElement).getPropertyValue('--akis').trim() || 'ease-out' });
    function bitir() { y.style.transition = 'none'; y.classList.remove('kayiyor'); void y.offsetWidth; y.style.transition = ''; k.remove(); }
    an.onfinish = an.oncancel = bitir;
  }
  // ilerleme: her çizimde çubukların değeri sayfa + ad anahtarıyla hatırlanır; artmışsa yeni dilimler (ya da sürekli çubuk) dolar
  var ilerlemeDeger = {};
  function ilerleme(sayfa) {
    var cubuklar = sayfa.querySelectorAll('.b-ilerleme [role="progressbar"]');
    if (!cubuklar.length) return;
    var yer = sayfa.getAttribute('data-yer'), oyna = acik();
    [].forEach.call(cubuklar, function (c) {
      var key = yer + '|' + c.getAttribute('aria-label'), simdi = +c.getAttribute('aria-valuenow'), once = ilerlemeDeger[key], l = artanlar(once, simdi);
      ilerlemeDeger[key] = simdi;
      if (!oyna || !l.length) return;
      var dilim = c.children, s = c.parentElement.querySelector('.b-ilerleme__sayi');
      if (c.classList.contains('b-ilerleme__cubuk--surekli')) { if (dilim[0]) { dilim[0].style.setProperty('--once', (once / simdi).toFixed(3)); dilim[0].classList.add('yeni'); } }
      else l.forEach(function (i, j) { if (dilim[i]) { dilim[i].style.setProperty('--i', j); dilim[i].classList.add('yeni'); } });
      if (s) s.classList.add('yeni');
    });
  }
  E.ilerleme = ilerleme;
  // #sayfa her yeniden çizildiğinde (kabuk.js rota innerHTML) çubuklara bakılır; gözlemci boyamadan önce çalışır
  function izle() { var s = d.getElementById('sayfa'); if (s) new MutationObserver(function () { ilerleme(s); }).observe(s, { childList: true }); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', izle); else izle();
})(typeof window !== 'undefined' ? window : globalThis);
