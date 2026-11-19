/* LIFEOS.Kabuk.Konularim — alan sayfasının sonunda «Kendi başlıkların» (2026-11-18, sahibin isteği: «derslere biz de bir şeyler
 * ekleyebilelim: başlık ve onun altına konular; sonra Başbuğ'dan bunu düzeltmesini ve altında derslerle ilgili bilgileri toplamasını isteyeyim»).
 * Kullanıcı başlık ve konu ekler, adını düzeltir, sırasını değiştirir, siler. Konu satırındaki «Başbuğ'la çalış» sohbeti o konunun bağlamıyla
 * (Öğretmen kipi; ad = «Başlık › Konu», kid = konu kimliği) açar; başlıktaki «Başbuğ düzenlesin» hazır isteği yazma kutusuna koyar
 * (data-king-istem; gönderen kişidir). Sohbetteki «Konuya kaydet» (king-sohbet.js) cevabı notKaydet ile o konunun «Başbuğ'un notu»na ekler.
 * kabuk.js'e dokunmaz: Kabuk.ek.alanSonu(alan) çizer, Kabuk.ic.rota() yeniden çizer. Bu dosya kabuk.js'ten ÖNCE yüklenir.
 * Depo: lifeos.not.konularim (kayıt; IndexedDB + tek depoya eşitlenir, kabuk/depo.js KAYIT «not.»): { <alan>: [{ id, ad, not?, konular: [{ id, ad, not? }] }] }.
 * Sıfır bağımlılık; tarayıcıda window.LIFEOS.Kabuk.Konularim, Node'da module.exports (saf kısım). */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var ANAHTAR = 'lifeos.not.konularim', AD_EN = 80, NOT_EN = 20000, BASLIK_EN = 40, KONU_EN = 60;

  /* ---------------- saf ---------------- */
  function adSuz(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, AD_EN); }
  function idGecerli(x) { return typeof x === 'string' && /^[a-z0-9]{1,24}$/.test(x); }
  function yeniId(t, r) { return 'k' + (t || Date.now()).toString(36) + Math.floor((r == null ? Math.random() : r) * 1296).toString(36); }
  function oge(o, konulu) {
    if (!o || typeof o !== 'object' || !idGecerli(o.id) || !adSuz(o.ad)) return null;
    var x = { id: o.id, ad: adSuz(o.ad) };
    if (typeof o.not === 'string' && o.not.trim()) x.not = o.not.slice(0, NOT_EN);
    if (konulu) x.konular = (Array.isArray(o.konular) ? o.konular : []).map(function (k) { return oge(k, false); }).filter(Boolean).slice(0, KONU_EN);
    return x;
  }
  // Depodaki değer: bozuksa boş; yabancı alan ve öğe atılır (sahte veri değil, kayıp en az)
  function oku(ham) {
    var v = null, o = {};
    try { v = typeof ham === 'string' ? JSON.parse(ham) : ham; } catch (e) { v = null; }
    if (!v || typeof v !== 'object' || Array.isArray(v)) return o;
    Object.keys(v).forEach(function (a) {
      if (/^[a-z]+$/.test(a) && Array.isArray(v[a])) { var l = v[a].map(function (b) { return oge(b, true); }).filter(Boolean).slice(0, BASLIK_EN); if (l.length) o[a] = l; }
    });
    return o;
  }
  // id → { liste (içinde durduğu dizi), i, oge, baslik (konuysa üstü) }
  function bul(v, alan, id) {
    var l = v[alan] || [];
    for (var i = 0; i < l.length; i++) {
      if (l[i].id === id) return { liste: l, i: i, oge: l[i], baslik: null };
      for (var j = 0; j < l[i].konular.length; j++) if (l[i].konular[j].id === id) return { liste: l[i].konular, i: j, oge: l[i].konular[j], baslik: l[i] };
    }
    return null;
  }
  // İşlemler değeri yerinde değiştirir; başardıysa true (yeni öğede kimliği) döner.
  function baslikEkle(v, alan, ad, id) {
    ad = adSuz(ad);
    if (!ad || !/^[a-z]+$/.test(alan) || (v[alan] || []).length >= BASLIK_EN) return false;
    (v[alan] = v[alan] || []).push({ id: id || yeniId(), ad: ad, konular: [] });
    return v[alan][v[alan].length - 1].id;
  }
  function konuEkle(v, alan, bid, ad, id) {
    var b = bul(v, alan, bid); ad = adSuz(ad);
    if (!b || b.baslik || !ad || b.oge.konular.length >= KONU_EN) return false;
    b.oge.konular.push({ id: id || yeniId(), ad: ad });
    return b.oge.konular[b.oge.konular.length - 1].id;
  }
  function adDegistir(v, alan, id, ad) { var b = bul(v, alan, id); ad = adSuz(ad); if (!b || !ad) return false; b.oge.ad = ad; return true; }
  function tasi(v, alan, id, yon) {
    var b = bul(v, alan, id), j = b ? b.i + (yon < 0 ? -1 : 1) : -1;
    if (!b || j < 0 || j >= b.liste.length) return false;
    b.liste[b.i] = b.liste[j]; b.liste[j] = b.oge;
    return true;
  }
  function sil(v, alan, id) { var b = bul(v, alan, id); if (!b) return false; b.liste.splice(b.i, 1); if (!v[alan].length) delete v[alan]; return true; }
  // Başbuğ'un notu: yeni cevap eskisinin altına eklenir (üstüne yazılmaz: kaydedilen kaybolmasın); metin boşsa not silinir
  function notYaz(v, alan, id, metin, ekle) {
    var b = bul(v, alan, id), m = String(metin == null ? '' : metin).trim();
    if (!b) return false;
    if (!m) { delete b.oge.not; return true; }
    b.oge.not = ((ekle && b.oge.not ? b.oge.not + '\n\n' : '') + m).slice(0, NOT_EN);
    return true;
  }
  // Sohbete giden konu bağlamı (king-sohbet.js baglamGecerli ile aynı sınırlar): ad «Başlık › Konu» ya da yalnız başlık
  function baglam(alan, b, k) { return { tur: 'konu', alan: alan, ad: (k ? b.ad + ' › ' + k.ad : b.ad).slice(0, 120), kid: (k || b).id }; }
  // «Başbuğ düzenlesin» isteği: kısa, net; uydurma yasağı sunucunun sistem talimatında
  function istem(b) {
    var k = b.konular.length ? b.konular.map(function (x, i) { return (i + 1) + '. ' + x.ad; }).join('\n') : '(henüz konu yok)';
    return '«' + b.ad + '» başlığımı ve altındaki konuları düzenle:\n' + k + '\n\n' +
      'Şunları yap:\n1. Başlık ve konu adlarında yazım ya da ad hatası varsa düzeltilmiş listeyi ver.\n' +
      '2. Bu başlıkta eksik kalan önemli konuları öner (en çok beş).\n' +
      '3. Her konu için kısa ders bilgisi topla: ne olduğu, temel kavramlar, önemli kişi, yer ve tarihler, nereden okunur.\n' +
      'Emin olmadığın bilgiyi kesin gibi yazma.';
  }
  function kac(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  /* ---------------- çizim ---------------- */
  var d = { duzen: null }; // adı düzeltilen öğenin kimliği
  function notHtml(B, alan, x) {
    if (!x.not) return '';
    var S = Kabuk.KingSohbet, ic = S && S.bicimle ? S.bicimle(x.not) : '<p>' + kac(x.not).replace(/\n/g, '<br>') + '</p>';
    return '<details class="konularim__not"><summary>Başbuğ’un notu</summary><div class="konularim__not-metin">' + ic + '</div>' +
      '<button type="button" class="b-dugme b-dugme--sade" data-km="not-sil" data-km-id="' + x.id + '">Notu sil</button></details>';
  }
  function menu(x, ad, ilk, son) {
    var t = function (e, m, kapali) { return '<button type="button" class="b-dugme b-dugme--sade" data-km="' + e + '" data-km-id="' + x.id + '"' + (kapali ? ' aria-disabled="true"' : '') + '>' + m + '</button>'; };
    return '<details class="konularim__menu"><summary aria-label="' + kac(ad) + ' seçenekleri" title="Seçenekler"><span aria-hidden="true">⋯</span></summary><div class="konularim__menu-ic">' +
      t('yukari', 'Yukarı taşı', ilk) + t('asagi', 'Aşağı taşı', son) + t('duzelt', 'Adını düzelt') + t('sil', 'Sil') + '</div></details>';
  }
  function adFormu(B, x) {
    return '<form class="konularim__ekle" data-km-form="ad" data-km-id="' + x.id + '">' +
      B.alan({ tur: 'metin', ad: 'Yeni ad', gizliAd: true, isim: 'km-ad-' + x.id, deger: x.ad, enCok: AD_EN }) +
      B.eylemler([{ metin: 'Kaydet', tur: 'ana', tip: 'submit' }, { metin: 'Vazgeç', tur: 'sade', veri: { km: 'vazgec' } }]) + '</form>';
  }
  function ekleFormu(B, tur, bid, yer) {
    return '<form class="konularim__ekle konularim__ekle--' + tur + '" data-km-form="' + tur + '"' + (bid ? ' data-km-id="' + bid + '"' : '') + '>' +
      B.alan({ tur: 'metin', ad: yer, gizliAd: true, isim: 'km-' + tur + (bid ? '-' + bid : ''), yerTutucu: yer, enCok: AD_EN }) +
      B.dugme({ metin: 'Ekle', tur: 'ikincil', tip: 'submit' }) + '</form>';
  }
  function konuHtml(B, alan, b, k, i) {
    var bg = baglam(alan, b, k);
    return '<li class="konularim__konu">' + (d.duzen === k.id ? adFormu(B, k) : '<div class="konu"><span class="konu__ad">' + kac(k.ad) + '</span>' +
      '<span class="konu__not"><a href="#/king" data-king-konu="' + kac(bg.ad) + '" data-alan="' + alan + '" data-king-kid="' + k.id + '">Başbuğ’la çalış</a></span>' +
      menu(k, k.ad, i === 0, i === b.konular.length - 1) + '</div>') + notHtml(B, alan, k) + '</li>';
  }
  function baslikHtml(B, alan, b, i, n) {
    var bg = baglam(alan, b);
    var ust = d.duzen === b.id ? adFormu(B, b) : '<div class="konularim__ust"><h3 class="konularim__ad">' + kac(b.ad) + '</h3>' +
      '<a class="konularim__duzenle" href="#/king" data-king-konu="' + kac(bg.ad) + '" data-alan="' + alan + '" data-king-kid="' + b.id + '" data-king-istem="' + kac(istem(b)) + '">' +
      '<svg aria-hidden="true"><use href="#i-king"/></svg>Başbuğ düzenlesin</a>' + menu(b, b.ad, i === 0, i === n - 1) + '</div>';
    return '<section class="konularim__baslik" aria-label="' + kac(b.ad) + '">' + ust + notHtml(B, alan, b) +
      (b.konular.length ? '<ul class="konularim__konular">' + b.konular.map(function (k, j) { return konuHtml(B, alan, b, k, j); }).join('') + '</ul>' : '') +
      ekleFormu(B, 'konu', b.id, 'Konu ekle') + '</section>';
  }
  function alanSonu(alan) {
    var B = Kabuk.Bilesen, I = Kabuk.ic;
    if (!B || !I || !/^[a-z]+$/.test(alan || '')) return '';
    var l = oku(I.depo.getItem(ANAHTAR))[alan] || [];
    if (!l.length) return '<section class="konularim konularim--bos" aria-label="Kendi başlıkların">' + ekleFormu(B, 'baslik', null, 'Kendi başlığını ekle') + '</section>';
    return '<div class="konularim">' + B.bolum({ baslik: 'Kendi başlıkların', id: 'konularim-baslik', govde:
      l.map(function (b, i) { return baslikHtml(B, alan, b, i, l.length); }).join('') + ekleFormu(B, 'baslik', null, 'Yeni başlık ekle') }) + '</div>';
  }

  /* ---------------- tarayıcı ---------------- */
  function degistir(alan, f) { // oku → değiştir → yaz; başarısızsa yazmaz
    var I = Kabuk.ic, v = oku(I.depo.getItem(ANAHTAR)), r = f(v);
    if (r) { if (Object.keys(v).length) I.depo.setItem(ANAHTAR, JSON.stringify(v)); else I.depo.removeItem(ANAHTAR); }
    return r;
  }
  // Sohbetteki «Konuya kaydet» (king-sohbet.js): cevabı o konunun notunun altına ekler; konu silindiyse false
  function notKaydet(alan, id, metin) { return !!(Kabuk.ic && idGecerli(id) && degistir(alan, function (v) { return notYaz(v, alan, id, metin, true); })); }
  function ciz(odak) {
    Kabuk.ic.rota();
    var e = odak && kok.document.querySelector(odak);
    if (e) e.focus({ preventScroll: true });
  }
  function kur() {
    var doc = kok.document;
    doc.addEventListener('submit', function (e) {
      var f = e.target.closest && e.target.closest('form[data-km-form]');
      if (!f) return;
      e.preventDefault();
      var tur = f.getAttribute('data-km-form'), id = f.getAttribute('data-km-id'), alan = Kabuk.ic.etkin(), g = f.querySelector('input'), ad = adSuz(g && g.value);
      if (!ad) return g && g.focus();
      if (tur === 'baslik') { var yeni = degistir(alan, function (v) { return baslikEkle(v, alan, ad); }); return ciz(yeni ? '[data-km-form="konu"][data-km-id="' + yeni + '"] input' : null); }
      if (tur === 'konu') { degistir(alan, function (v) { return konuEkle(v, alan, id, ad); }); return ciz('[data-km-form="konu"][data-km-id="' + id + '"] input'); } // ardı ardına konu yazılabilsin
      if (tur === 'ad') { degistir(alan, function (v) { return adDegistir(v, alan, id, ad); }); d.duzen = null; return ciz('[data-km="duzelt"][data-km-id="' + id + '"]'); }
    });
    doc.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-km]');
      if (!t || t.getAttribute('aria-disabled') === 'true') return;
      var ne = t.getAttribute('data-km'), id = t.getAttribute('data-km-id'), alan = Kabuk.ic.etkin();
      if (ne === 'vazgec') { var eski = d.duzen; d.duzen = null; return ciz('[data-km="duzelt"][data-km-id="' + eski + '"]'); }
      if (ne === 'duzelt') { d.duzen = id; return ciz('[data-km-form="ad"] input'); }
      if (ne === 'yukari' || ne === 'asagi') { degistir(alan, function (v) { return tasi(v, alan, id, ne === 'yukari' ? -1 : 1); }); return ciz('[data-km="' + ne + '"][data-km-id="' + id + '"]'); }
      if (ne === 'sil') {
        var b = bul(oku(Kabuk.ic.depo.getItem(ANAHTAR)), alan, id);
        if (!b || !kok.confirm('«' + b.oge.ad + '»' + (b.oge.konular && b.oge.konular.length ? ' ve altındaki ' + b.oge.konular.length + ' konu' : '') + ' silinsin mi?')) return;
        degistir(alan, function (v) { return sil(v, alan, id); }); return ciz();
      }
      if (ne === 'not-sil') { if (!kok.confirm('Başbuğ’un notu silinsin mi?')) return; degistir(alan, function (v) { return notYaz(v, alan, id, ''); }); return ciz(); }
    });
    doc.addEventListener('keydown', function (e) { // Escape adı düzeltmeyi bırakır
      if (e.key === 'Escape' && d.duzen && e.target.closest && e.target.closest('form[data-km-form="ad"]')) { var eski = d.duzen; d.duzen = null; ciz('[data-km="duzelt"][data-km-id="' + eski + '"]'); }
    });
  }

  var Konularim = { ANAHTAR: ANAHTAR, oku: oku, bul: bul, yeniId: yeniId, baslikEkle: baslikEkle, konuEkle: konuEkle, adDegistir: adDegistir, tasi: tasi, sil: sil,
    notYaz: notYaz, baglam: baglam, istem: istem, alanSonu: alanSonu, notKaydet: notKaydet };
  Kabuk.Konularim = Konularim;
  Kabuk.ek = Kabuk.ek || {};
  Kabuk.ek.alanSonu = alanSonu;
  if (typeof module !== 'undefined' && module.exports) module.exports = Konularim;
  else if (kok.document) kur();
})(typeof window !== 'undefined' ? window : globalThis);
