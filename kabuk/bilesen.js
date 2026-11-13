/* LIFEOS.Kabuk.Bilesen (global `Bilesen`) — A2 bileşen kataloğu: kabuğun on iki yapı taşı.
 * Ekranlar yalnız bunlardan kurulur; her ölçü kabuk/bilesen.css'tedir ve bağlama göre değişmez.
 * Her işlev saf: bir seçenek nesnesi alır, HTML metni döndürür (kabuğun öteki dosyaları gibi). Bütün metin kaçışlıdır;
 * yanlış girdi TypeError atar (sessizce bozuk HTML çizilmez). İç içe parça HTML olarak değil, seçenek nesnesi olarak
 * verilir (bos.eylem, bolum.eylem, liste.ogeler…); yalnız bolum/panel `govde`'si başka taşların çıktısını alır.
 * Katalog: kabuk/bilesen.html · test: node kabuk/bilesen.test.js · belge: belgeler/ekip/sadelesme/faz2-bilesen.md */
(function (kok) {
  'use strict';

  var KAC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function kac(s) { return String(s).replace(/[&<>"']/g, function (c) { return KAC[c]; }); }
  function hata(tas, neden) { throw new TypeError('Bilesen.' + tas + ': ' + neden); }
  function nesne(tas, o) { if (!o || typeof o !== 'object' || Array.isArray(o)) hata(tas, 'seçenek nesnesi gerekli'); return o; }
  // zorunlu ya da isteğe bağlı metin; sayı da metin sayılır, öteki türler reddedilir
  function metin(tas, ad, v, istege, enCok) {
    if (v == null || v === '') { if (istege) return ''; hata(tas, ad + ' gerekli'); }
    if (typeof v !== 'string' && typeof v !== 'number') hata(tas, ad + ' metin olmalı');
    var s = String(v);
    if (enCok && s.length > enCok) hata(tas, ad + ' en çok ' + enCok + ' karakter');
    return s;
  }
  function sec(tas, ad, v, izinli) {
    if (v == null) return izinli[0];
    if (izinli.indexOf(v) < 0) hata(tas, ad + ' şunlardan biri olmalı: ' + izinli.join(', '));
    return v;
  }
  // bağlantı: kabuk yolu (#/…), göreli dosya (./ ../) ya da http(s); javascript: vb. reddedilir
  var YOL = /^(#\/|\.{1,2}\/|https?:\/\/)[^\s]*$/;
  function yol(tas, v) { if (typeof v !== 'string' || !YOL.test(v)) hata(tas, 'href #/, ./, ../ ya da http(s):// ile başlamalı'); return v; }
  var AD = /^[a-z][a-z0-9-]*$/;
  function veri(tas, o) {
    if (o == null) return '';
    return Object.keys(nesne(tas, o)).map(function (k) {
      if (!AD.test(k)) hata(tas, 'veri anahtarı küçük harf ve tire olmalı: ' + k);
      return ' data-' + k + '="' + kac(metin(tas, 'veri.' + k, o[k], true)) + '"';
    }).join('');
  }
  var TR = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
  function kimlik(tas, o, yedek) {
    if (o.id != null) { if (typeof o.id !== 'string' || !AD.test(o.id)) hata(tas, 'id küçük harf ve tire olmalı'); return o.id; }
    return 'b-' + yedek.toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, function (c) { return TR[c]; })
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function govde(tas, g) {
    if (Array.isArray(g)) return g.map(function (x) { return govde(tas, x); }).join('');
    if (typeof g !== 'string') hata(tas, 'govde başka taşların HTML çıktısı (metin ya da metin dizisi) olmalı');
    return g;
  }
  function sayiYaz(n) { return Number(n).toLocaleString('tr-TR', { maximumFractionDigits: 2 }); }

  /* 1 · Düğme. tur: ikincil | ana | sade. href varsa bağlantı; kapali: aria-disabled (odakta kalır, okunur). */
  function dugme(o) {
    nesne('dugme', o);
    var m = metin('dugme', 'metin', o.metin, false, 40), tur = sec('dugme', 'tur', o.tur, ['ikincil', 'ana', 'sade']);
    var tip = sec('dugme', 'tip', o.tip, ['button', 'submit']);
    var ek = ' class="b-dugme b-dugme--' + tur + '"' + (o.etiket ? ' aria-label="' + kac(metin('dugme', 'etiket', o.etiket)) + '"' : '') + veri('dugme', o.veri);
    if (o.kapali) return '<button type="button"' + ek + ' aria-disabled="true">' + kac(m) + '</button>';
    if (o.href != null) return '<a' + ek + ' href="' + kac(yol('dugme', o.href)) + '">' + kac(m) + '</a>';
    return '<button type="' + tip + '"' + ek + '>' + kac(m) + '</button>';
  }

  /* 2 · Rozet. Kısa etiket (≤ 24 karakter, kesilmez). tur: normal | vurgu | altin | kesik (tahmin gibi kesin olmayan). */
  function pul(o) {
    if (typeof o === 'string') o = { metin: o };
    nesne('pul', o);
    return '<span class="b-pul b-pul--' + sec('pul', 'tur', o.tur, ['normal', 'vurgu', 'altin', 'kesik']) + '">' +
      kac(metin('pul', 'metin', o.metin, false, 24)) + '</span>';
  }

  /* 3 · Liste satırı ve liste. Satır yüksekliği sabit (ad ve not birer satır, taşan kısaltılır).
   * durum: acik | kilitli | secili. Liste <ul aria-label>; tur: satir | ders. */
  function satir(o) {
    nesne('satir', o);
    var durum = sec('satir', 'durum', o.durum, ['acik', 'kilitli', 'secili']), ad = metin('satir', 'ad', o.ad, false);
    var ic = '<span class="b-satir__metin"><span class="b-satir__ad">' + kac(ad) + '</span>' +
      (o.not != null && o.not !== '' ? '<span class="b-satir__not">' + kac(metin('satir', 'not', o.not)) + '</span>' : '') + '</span>' +
      (durum === 'kilitli' ? pul({ metin: 'kilitli' }) : o.pul != null ? pul(o.pul) : '');
    if (durum === 'kilitli') return '<div class="b-satir b-satir--kilitli" aria-disabled="true">' + ic + '</div>';
    var cur = durum === 'secili' ? ' aria-current="true"' : '';
    if (o.href != null) return '<a class="b-satir" href="' + kac(yol('satir', o.href)) + '"' + cur + veri('satir', o.veri) + '>' + ic +
      '<span class="b-satir__ok" aria-hidden="true">›</span></a>';
    return '<div class="b-satir"' + cur + veri('satir', o.veri) + '>' + ic + '</div>';
  }
  function liste(o) {
    nesne('liste', o);
    var tur = sec('liste', 'tur', o.tur, ['satir', 'ders']), ad = metin('liste', 'ad', o.ad, false);
    if (!Array.isArray(o.ogeler) || !o.ogeler.length) hata('liste', 'ogeler boş olmayan dizi olmalı; boşsa Bilesen.bos kullan');
    var ciz = tur === 'ders' ? ders : satir;
    return '<ul class="b-liste b-liste--' + tur + '" aria-label="' + kac(ad) + '">' + o.ogeler.map(function (x) { return '<li>' + ciz(x) + '</li>'; }).join('') + '</ul>';
  }

  /* 4 · Ders kartı. Sabit yükseklik: başlık 1 satır, özet en çok 2 satır, alt satır (durum, süre, taslak).
   * durum: yeni | okundu | kilitli. Kilitliyken bağlantı değildir. */
  var DERS_DURUM = { yeni: { metin: 'okunmadı', tur: 'normal' }, okundu: { metin: 'okundu', tur: 'altin' }, kilitli: { metin: 'kilitli', tur: 'normal' } };
  function ders(o) {
    nesne('ders', o);
    var durum = sec('ders', 'durum', o.durum, ['yeni', 'okundu', 'kilitli']);
    var sure = o.sure == null ? '' : (typeof o.sure === 'number' && o.sure > 0 && isFinite(o.sure) ? o.sure : hata('ders', 'sure pozitif dakika olmalı'));
    var ic = '<span class="b-ders__baslik">' + kac(metin('ders', 'baslik', o.baslik)) + '</span>' +
      '<span class="b-ders__ozet">' + kac(metin('ders', 'ozet', o.ozet, true)) + '</span>' +
      '<span class="b-ders__alt">' + pul(DERS_DURUM[durum]) + (o.taslak ? pul({ metin: 'taslak', tur: 'kesik' }) : '') +
      (sure ? '<span>' + sayiYaz(sure) + ' dk</span>' : '') + '</span>';
    if (durum === 'kilitli') return '<div class="b-ders b-ders--kilitli" aria-disabled="true">' + ic + '</div>';
    if (o.href == null) hata('ders', 'açık ders için href gerekli');
    return '<a class="b-ders b-ders--' + durum + '" href="' + kac(yol('ders', o.href)) + '">' + ic + '</a>';
  }

  /* 5 · İlerleme çubuğu. Yalnız hedefi olan tam sayı (AGENTS kural 10: hedef yoksa çubuk yok).
   * toplam ≤ 12 ise tik tik (her adım bir kare), üstü sürekli çubuk. Yükseklik sabit. */
  function ilerleme(o) {
    nesne('ilerleme', o);
    var ad = metin('ilerleme', 'ad', o.ad), d = o.deger, t = o.toplam;
    if (!Number.isInteger(t) || t < 1) hata('ilerleme', 'toplam 1 ya da büyük tam sayı olmalı');
    if (!Number.isInteger(d) || d < 0 || d > t) hata('ilerleme', 'deger 0 ile toplam arasında tam sayı olmalı (girilmemişse Bilesen.bos)');
    var dolgu = '';
    if (t <= 12) for (var i = 0; i < t; i++) dolgu += '<i' + (i < d ? ' class="dolu"' : '') + '></i>';
    else dolgu = '<i class="dolu" style="width:' + (Math.round(d / t * 1000) / 10) + '%"></i>';
    return '<div class="b-ilerleme"><div class="b-ilerleme__ust" aria-hidden="true"><span>' + kac(ad) + '</span><span class="b-ilerleme__sayi">' + d + ' / ' + t + '</span></div>' +
      '<div class="b-ilerleme__cubuk' + (t > 12 ? ' b-ilerleme__cubuk--surekli' : '') + '" role="progressbar" aria-label="' + kac(ad) + '" aria-valuemin="0" aria-valuemax="' + t +
      '" aria-valuenow="' + d + '" aria-valuetext="' + t + ' içinden ' + d + '">' + dolgu + '</div></div>';
  }

  /* 6 · Form alanı. tur: metin | cok | sayi | tarih | saat | secim | onay. Etiket her zaman görünür (for/id);
   * ipucu ve hata aria-describedby ile bağlı; hata aria-invalid + «Hata:» öneki (renk tek başına değil). */
  var GIRIS = { metin: 'text', sayi: 'number', tarih: 'date', saat: 'time' };
  function alan(o) {
    nesne('alan', o);
    var tur = sec('alan', 'tur', o.tur, ['metin', 'cok', 'sayi', 'tarih', 'saat', 'secim', 'onay']), ad = metin('alan', 'ad', o.ad);
    if (typeof o.isim !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(o.isim)) hata('alan', 'isim harfle başlayan [a-zA-Z0-9_-] olmalı');
    var id = 'b-alan-' + o.isim, ipucu = metin('alan', 'ipucu', o.ipucu, true), h = metin('alan', 'hata', o.hata, true);
    var tarif = [ipucu ? id + '-ipucu' : '', h ? id + '-hata' : ''].filter(Boolean).join(' ');
    var ortak = ' id="' + id + '" name="' + kac(o.isim) + '"' + (tarif ? ' aria-describedby="' + tarif + '"' : '') + (h ? ' aria-invalid="true"' : '') + (o.zorunlu ? ' required' : '');
    var alt = (ipucu ? '<p class="b-alan__ipucu" id="' + id + '-ipucu">' + kac(ipucu) + '</p>' : '') +
      (h ? '<p class="b-alan__hata" id="' + id + '-hata"><b>Hata:</b> ' + kac(h) + '</p>' : '');
    if (tur === 'onay') {
      if (o.deger != null && typeof o.deger !== 'boolean') hata('alan', 'onay değeri true/false olmalı');
      return '<div class="b-alan"><label class="b-alan__onay"><input type="checkbox"' + ortak + (o.deger ? ' checked' : '') + '><span>' + kac(ad) + '</span></label>' + alt + '</div>';
    }
    var deger = metin('alan', 'deger', o.deger, true), denetim;
    if (tur === 'secim') {
      var s = nesne('alan', o.secenekler), anahtarlar = Object.keys(s);
      if (!anahtarlar.length) hata('alan', 'secenekler boş');
      if (deger && anahtarlar.indexOf(deger) < 0) hata('alan', 'deger seçeneklerde yok');
      denetim = '<select class="b-alan__giris"' + ortak + '>' + anahtarlar.map(function (k) {
        return '<option value="' + kac(k) + '"' + (k === deger ? ' selected' : '') + '>' + kac(metin('alan', 'secenek', s[k])) + '</option>';
      }).join('') + '</select>';
    } else if (tur === 'cok') {
      denetim = '<textarea class="b-alan__giris b-alan__giris--cok" rows="4"' + ortak + (o.enCok ? ' maxlength="' + (o.enCok | 0) + '"' : '') + '>' + kac(deger) + '</textarea>';
    } else {
      denetim = '<input type="' + GIRIS[tur] + '" class="b-alan__giris"' + ortak + ' value="' + kac(deger) + '"' + (o.enCok ? ' maxlength="' + (o.enCok | 0) + '"' : '') +
        (tur === 'sayi' ? ' inputmode="decimal"' : '') + ' autocomplete="off">';
    }
    return '<div class="b-alan' + (h ? ' b-alan--hata' : '') + '"><label class="b-alan__ad" for="' + id + '">' + kac(ad) +
      (o.zorunlu ? ' <span class="b-alan__zorunlu">· gerekli</span>' : '') + '</label>' + denetim + alt + '</div>';
  }

  /* 7 · Boş durum. Veri yoksa sıfır yerine bu (AGENTS §1.2: eksik veri sıfır değildir). eylem: dugme seçenekleri. */
  function bos(o) {
    nesne('bos', o);
    return '<div class="b-bos" role="note"><p class="b-bos__baslik">' + kac(metin('bos', 'baslik', o.baslik)) + '</p>' +
      (o.metin ? '<p class="b-bos__metin">' + kac(metin('bos', 'metin', o.metin)) + '</p>' : '') + (o.eylem ? dugme(o.eylem) : '') + '</div>';
  }

  /* 8 · Başlık + eylem. duzey 1 (sayfa) ya da 2; sağda en çok bir eylem; alt: tek cümle açıklama. */
  function baslik(o) {
    nesne('baslik', o);
    var d = o.duzey == null ? 1 : sec('baslik', 'duzey', o.duzey, [1, 2]), m = metin('baslik', 'metin', o.metin), id = kimlik('baslik', o, m);
    return '<div class="b-baslik"><div class="b-baslik__metin"><h' + d + ' id="' + id + '">' + kac(m) + '</h' + d + '>' +
      (o.alt ? '<p class="b-baslik__alt">' + kac(metin('baslik', 'alt', o.alt)) + '</p>' : '') + '</div>' + (o.eylem ? dugme(o.eylem) : '') + '</div>';
  }

  /* 9 · Sayı kutusu. Kesinlik etiketi ZORUNLU (AGENTS §1.2, motor/kayit.js ETIKET anahtarları).
   * missing: deger null olmalı, «—» çizilir (sıfır değil). aria-label sayıyı cümleyle söyler. sayilar: <ul> ızgara. */
  var ETIKET = { measured: 'ölçüldü', estimated: 'tahmin', computed: 'hesaplandı', missing: 'veri yok', eski: 'eski kayıt' };
  function sayi(o) {
    nesne('sayi', o);
    var ad = metin('sayi', 'ad', o.ad), et = o.etiket;
    if (!Object.prototype.hasOwnProperty.call(ETIKET, et)) hata('sayi', 'etiket zorunlu: ' + Object.keys(ETIKET).join(', '));
    var birim = metin('sayi', 'birim', o.birim, true, 12), yazi;
    if (et === 'missing') { if (o.deger != null) hata('sayi', 'veri yok etiketinde deger null olmalı'); yazi = '—'; }
    else if (typeof o.deger !== 'number' || !isFinite(o.deger)) hata('sayi', 'deger sonlu sayı olmalı (yoksa etiket missing)');
    else yazi = sayiYaz(o.deger);
    var cumle = ad + ': ' + (et === 'missing' ? 'veri yok' : yazi + (birim ? ' ' + birim : '') + ', ' + ETIKET[et]);
    return '<div class="b-sayi' + (et === 'missing' ? ' b-sayi--yok' : '') + '" role="group" aria-label="' + kac(cumle) + '">' +
      '<span class="b-sayi__ad" aria-hidden="true">' + kac(ad) + '</span><span class="b-sayi__deger" aria-hidden="true">' + kac(yazi) +
      (birim && et !== 'missing' ? '<span class="b-sayi__birim">' + kac(birim) + '</span>' : '') + '</span>' +
      '<span aria-hidden="true">' + pul({ metin: ETIKET[et], tur: et === 'estimated' || et === 'eski' ? 'kesik' : 'normal' }) + '</span></div>';
  }
  function sayilar(o) {
    nesne('sayilar', o);
    if (!Array.isArray(o.ogeler) || !o.ogeler.length) hata('sayilar', 'ogeler boş olmayan dizi olmalı');
    return '<ul class="b-sayilar" aria-label="' + kac(metin('sayilar', 'ad', o.ad)) + '">' + o.ogeler.map(function (x) { return '<li>' + sayi(x) + '</li>'; }).join('') + '</ul>';
  }

  /* 10 · Uyarı / bilgi satırı. tur: bilgi (note) | tamam (status) | dikkat (note) | hata (alert).
   * Tür renkle değil, önündeki sözcükle de ayrılır. */
  var UYARI = { bilgi: ['Bilgi', 'note'], tamam: ['Tamam', 'status'], dikkat: ['Dikkat', 'note'], hata: ['Hata', 'alert'] };
  function uyari(o) {
    nesne('uyari', o);
    var tur = sec('uyari', 'tur', o.tur, ['bilgi', 'tamam', 'dikkat', 'hata']);
    return '<div class="b-uyari b-uyari--' + tur + '" role="' + UYARI[tur][1] + '"><span class="b-uyari__tur">' + UYARI[tur][0] + '</span>' +
      '<p class="b-uyari__metin">' + kac(metin('uyari', 'metin', o.metin)) + '</p></div>';
  }

  /* 11 · Bölüm. <section aria-labelledby> + h2 + isteğe bağlı tek eylem; aralıklar sabit. */
  function bolum(o) {
    nesne('bolum', o);
    var b = metin('bolum', 'baslik', o.baslik), id = kimlik('bolum', o, b);
    return '<section class="b-bolum" aria-labelledby="' + id + '"><div class="b-bolum__ust"><h2 id="' + id + '">' + kac(b) + '</h2>' +
      (o.eylem ? dugme(o.eylem) : '') + '</div>' + govde('bolum', o.govde) + '</section>';
  }

  /* 12 · Panel. Yüzeyli kutu; tur: normal | guclu | basari (kalın altın çizgi). Başlık varsa <section aria-labelledby>. */
  function panel(o) {
    nesne('panel', o);
    var tur = sec('panel', 'tur', o.tur, ['normal', 'guclu', 'basari']), sinif = 'b-panel b-panel--' + tur, g = govde('panel', o.govde);
    if (o.baslik == null) return '<div class="' + sinif + '">' + g + '</div>';
    var b = metin('panel', 'baslik', o.baslik), id = kimlik('panel', o, b);
    return '<section class="' + sinif + '" aria-labelledby="' + id + '"><h2 id="' + id + '">' + kac(b) + '</h2>' + g + '</section>';
  }

  var Bilesen = {
    TASLAR: ['dugme', 'pul', 'satir', 'ders', 'ilerleme', 'alan', 'bos', 'baslik', 'sayi', 'uyari', 'bolum', 'panel'],
    ETIKET: ETIKET, kac: kac,
    dugme: dugme, pul: pul, satir: satir, liste: liste, ders: ders, ilerleme: ilerleme, alan: alan, bos: bos,
    baslik: baslik, sayi: sayi, sayilar: sayilar, uyari: uyari, bolum: bolum, panel: panel
  };
  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Kabuk = kok.LIFEOS.Kabuk || {};
  kok.LIFEOS.Kabuk.Bilesen = Bilesen;
  kok.Bilesen = Bilesen;
  if (typeof module !== 'undefined' && module.exports) module.exports = Bilesen;
})(typeof window !== 'undefined' ? window : globalThis);
