/* kabuk/acilis.js — Açılış videosu (eski paneldeki sunucu.GIRIS_SAYFASI «data-acilis» betiği ve Ayarlar'ın «Açılış videosu» bölümü).
 * Oynar: LifeOS bu sekmede ilk açılıyorsa (önceki sayfa yok, bu oturumda oynamadı) ve sistem ayarı lifeos.acilis.video = '1' ise;
 * «?video» ya da «Şimdi izle» her zaman oynatır. Atla, Esc, Enter, boşluk geçer; 4 sn başlamazsa ya da hata olursa kendiliğinden kalkar.
 * Ayar sistem ayarıdır (sistem/ayar.py, /api/ayar; yazma yalnız bu bilgisayardan), video /api/zemin/acilis (sistem/zemin.py).
 * Hesap ekranına oturumdan bağımsız bir bölüm ekler (Kabuk.hesapUzanti, hep: true); yalnız bilgisayarın kendisinde. */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var ANAHTAR = 'lifeos.acilis.video', OYNADI = 'lifeos.acilis.oynadi', ADRES = '/api/zemin/acilis';

  function kac(x) { return String(x).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  // o: { ayar: /api/ayar'daki değer, onceki: document.referrer, arama: location.search, oynadi: bu sekmede oynadı mı }
  function oynasinMi(o) {
    if (/[?&]video(&|$)/.test(o.arama || '')) return true;
    return o.ayar === '1' && !o.onceki && !o.oynadi;
  }
  // s: { acik, var (video yüklü mü; null = bilinmiyor), is, durum }; bag: Hesap bağlamı
  function bolum(s, B, bag) {
    if (!bag.sunucu || !bag.sunucu.yerel) return '';
    var g = s.acik == null ? '<p class="soluk">Yükleniyor…</p>' : [
      B.ayar({ id: 'ac-video', ad: 'Açılış videosu', not: s.var ? 'Başbuğ ilk açıldığında oynar; «Atla» ya da Esc ile geçilir.' : 'Henüz video yok: önce bir video seç (en çok 600 MB).',
        govde: B.dugme({ metin: s.acik ? 'Açık' : 'Kapalı', basili: !!s.acik, etiket: 'Açılış videosu', veri: { 'ac-ac': 'ac' }, kapali: !!s.is || (!s.acik && !s.var) }) }),
      '<div class="b-eylemler"><label class="b-dugme">' + (s.var ? 'Videoyu değiştir' : 'Video seç') + // satır başında, düğme gibi (ortada boşta kalmasın)
        '<input type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mov,.m4v" data-ac-dosya hidden></label>' +
        (s.var ? ' ' + B.dugme({ metin: 'Şimdi izle', tur: 'sade', veri: { 'ac-ac': 'izle' } }) : '') + '</div>',
      s.durum ? '<p class="soluk" role="status">' + kac(s.durum) + '</p>' : ''];
    return B.bolum({ baslik: 'Açılış videosu', id: 'ac-bolum', govde: g });
  }

  var Acilis = { oynasinMi: oynasinMi, bolum: bolum };
  Kabuk.Acilis = Acilis;
  if (typeof module !== 'undefined' && module.exports) module.exports = Acilis;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document;
  function oynat() {
    if (d.querySelector('.avideo')) return;
    var kutu = d.createElement('div'), v = d.createElement('video'), gitti = false, basladi = false;
    kutu.className = 'avideo'; kutu.setAttribute('role', 'dialog'); kutu.setAttribute('aria-label', 'Açılış videosu');
    kutu.innerHTML = '<button type="button" class="avideo__atla">Atla<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l8 6-8 6zM18 6v12"/></svg></button><i class="avideo__cizgi" aria-hidden="true"></i>';
    v.className = 'avideo__v'; v.playsInline = true; v.preload = 'auto'; v.setAttribute('aria-hidden', 'true'); v.src = ADRES;
    kutu.insertBefore(v, kutu.firstChild);
    d.body.appendChild(kutu);
    var atla = kutu.querySelector('button');
    function bitir() {
      if (gitti) return;
      gitti = true;
      d.removeEventListener('keydown', tus, true);
      kutu.classList.add('is-bitiyor');
      setTimeout(function () {
        kutu.classList.add('is-gidiyor');
        setTimeout(function () { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { /* video zaten gitti */ } kutu.remove(); }, 900);
      }, basladi ? 600 : 0);
    }
    function tus(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); bitir(); } }
    d.addEventListener('keydown', tus, true);
    atla.addEventListener('click', bitir);
    v.addEventListener('playing', function () { if (basladi) return; basladi = true; kutu.classList.add('is-oynuyor'); try { atla.focus({ preventScroll: true }); } catch (e) { /* odak yok */ } });
    v.addEventListener('timeupdate', function () {
      if (!v.duration) return;
      kutu.style.setProperty('--ilerle', String(v.currentTime / v.duration));
      if (v.duration - v.currentTime < .6) bitir(); // son kareye gelmeden kararmaya başlar
    });
    v.addEventListener('ended', bitir);
    v.addEventListener('error', bitir);
    setTimeout(function () { if (!basladi) bitir(); }, 4000);
    v.volume = .8;
    var p = v.play();
    if (p && p.catch) p.catch(function () { v.muted = true; var q = v.play(); if (q && q.catch) q.catch(bitir); }); // sesli açılışa izin yoksa sessiz
  }
  function ayarOku() {
    return fetch('/api/ayar', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (v) { return v && v.ayar ? v.ayar[ANAHTAR] || null : null; });
  }

  // Açılışta: yalnız sunucudan açıldıysa; ayar okunamazsa oynamaz.
  if (/^https?:$/.test(location.protocol)) {
    var oynadi = false;
    try { oynadi = !!sessionStorage.getItem(OYNADI); } catch (e) { /* oturum deposu yok */ }
    var zorla = oynasinMi({ arama: location.search });
    if (zorla || (!d.referrer && !oynadi)) {
      ayarOku().then(function (a) {
        if (!oynasinMi({ ayar: a, onceki: d.referrer, arama: location.search, oynadi: oynadi })) return;
        try { sessionStorage.setItem(OYNADI, '1'); } catch (e) { /* oturum deposu yok */ }
        if (d.body) oynat(); else d.addEventListener('DOMContentLoaded', oynat);
      }).catch(function () { /* ayar yok: video da yok */ });
    }
  }

  var s = { acik: null, var: null, is: false, durum: '' }, yuk = false;
  function burada() { return location.hash.split('?')[0] === '#/hesap'; }
  function tazele() { if (burada() && Kabuk.ic) Kabuk.ic.rota(); }
  function yukle() {
    ayarOku().then(function (a) { s.acik = a === '1'; tazele(); }, function () { s.acik = false; tazele(); });
    fetch(ADRES + '?var', { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : '0'; }).then(function (t) { s.var = t === '1'; tazele(); }, function () { s.var = false; tazele(); });
  }
  function ayarYaz(deger) {
    var g = {}; g[ANAHTAR] = deger;
    return fetch('/api/ayar', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-LifeOS': 'ayar' }, body: JSON.stringify({ ayar: g }) })
      .then(function (r) { if (!r.ok) throw new Error('Ayar yazılamadı.'); s.acik = deger === '1'; });
  }
  function is(f, tamam, bekle) {
    s.is = true; s.durum = bekle || ''; tazele();
    f().then(function () { s.is = false; s.durum = tamam || ''; tazele(); }, function (e) { s.is = false; s.durum = String((e && e.message) || 'Olmadı.').slice(0, 160); tazele(); });
  }
  (Kabuk.hesapUzanti = Kabuk.hesapUzanti || []).push({ ad: 'acilis', sira: 50, hep: true, ciz: function (bag, B) {
    if (!bag.sunucu || !bag.sunucu.yerel) return '';
    if (!yuk) { yuk = true; yukle(); }
    return bolum(s, B, bag);
  } });
  kok.addEventListener('hashchange', function () { if (!burada()) { yuk = false; s.durum = ''; } });

  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ac-ac]');
    if (!b || b.getAttribute('aria-disabled') === 'true' || !burada()) return;
    var ne = b.getAttribute('data-ac-ac');
    if (ne === 'izle') return oynat();
    if (ne === 'ac') is(function () { return ayarYaz(s.acik ? null : '1'); });
  });
  d.addEventListener('change', function (e) {
    var t = e.target;
    if (!t.matches || !t.matches('input[data-ac-dosya]') || !t.files || !t.files[0] || !burada()) return;
    var f = t.files[0];
    is(function () {
      return fetch(ADRES, { method: 'POST', headers: { 'Content-Type': f.type || 'video/mp4', 'X-LifeOS': 'zemin' }, body: f }).then(function (r) {
        if (!r.ok) return r.text().then(function (x) { throw new Error(x || 'Yüklenemedi.'); });
        s.var = true;
        return ayarYaz('1');
      });
    }, 'Açılış videosu hazır.', 'Video yükleniyor… büyük dosya biraz sürer.');
  });
})(typeof window !== 'undefined' ? window : globalThis);
