/* LIFEOS.Kabuk.Bilesen (global `Bilesen`) — A2 bileşen kataloğu: kabuğun yirmi sekiz yapı taşı.
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
  // bağlantı: kabuk yolu (#/…), göreli dosya (./ ../), aynı kökte kök yolu (/esp/; //alan değil) ya da http(s); javascript: vb. reddedilir
  var YOL = /^(#\/|\.{1,2}\/|\/(?!\/)|https?:\/\/)[^\s]*$/;
  function yol(tas, v) { if (typeof v !== 'string' || !YOL.test(v)) hata(tas, 'href #/, ./, ../, / ya da http(s):// ile başlamalı'); return v; }
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

  /* 1 · Düğme. tur: ikincil | ana | sade. href varsa bağlantı; kapali: aria-disabled (odakta kalır, okunur).
   * basili: aç/kapa düğmesi (aria-pressed, seçili 3 px çizgi); kisayol: aria-keyshortcuts, tus: görünen kısayol (<kbd>). */
  function dugme(o) {
    nesne('dugme', o);
    var m = metin('dugme', 'metin', o.metin, false, 40), tur = sec('dugme', 'tur', o.tur, ['ikincil', 'ana', 'sade']);
    var tip = sec('dugme', 'tip', o.tip, ['button', 'submit']);
    if (o.basili != null && typeof o.basili !== 'boolean') hata('dugme', 'basili true/false olmalı');
    var ek = ' class="b-dugme b-dugme--' + tur + '"' + (o.etiket ? ' aria-label="' + kac(metin('dugme', 'etiket', o.etiket)) + '"' : '') +
      (o.kisayol ? ' aria-keyshortcuts="' + kac(metin('dugme', 'kisayol', o.kisayol)) + '"' : '') + (o.basili != null ? ' aria-pressed="' + o.basili + '"' : '') + veri('dugme', o.veri);
    var ic = kac(m) + (o.tus ? '<kbd>' + kac(metin('dugme', 'tus', o.tus, false, 12)) + '</kbd>' : '');
    if (o.kapali) return '<button type="button"' + ek + ' aria-disabled="true">' + ic + '</button>';
    if (o.href != null) return '<a' + ek + ' href="' + kac(yol('dugme', o.href)) + '">' + ic + '</a>';
    return '<button type="' + tip + '"' + ek + '>' + ic + '</button>';
  }
  /* 13 · Eylem sırası. Düğme seçenekleri dizisi (boş öğe atlanır); {yazi} öğesi kısa soluk açıklamadır. Hepsi boşsa hiçbir şey çizilmez. */
  function eylemler(l) {
    if (!Array.isArray(l)) hata('eylemler', 'seçenek nesnesi dizisi gerekli');
    var ic = l.filter(Boolean).map(function (x) {
      return nesne('eylemler', x).yazi != null ? '<span class="b-eylemler__yazi">' + kac(metin('eylemler', 'yazi', x.yazi)) + '</span>' : dugme(x);
    }).join('');
    return ic ? '<div class="b-eylemler">' + ic + '</div>' : '';
  }

  /* 2 · Rozet. Kısa etiket (≤ 24 karakter, kesilmez). tur: normal | vurgu | altin | kesik (tahmin gibi kesin olmayan). */
  function pul(o) {
    if (typeof o === 'string') o = { metin: o };
    nesne('pul', o);
    return '<span class="b-pul b-pul--' + sec('pul', 'tur', o.tur, ['normal', 'vurgu', 'altin', 'kesik']) + '">' +
      kac(metin('pul', 'metin', o.metin, false, 24)) + '</span>';
  }

  /* 3 · Liste satırı ve liste. Satır yüksekliği sabit (ad ve not birer satır, taşan kısaltılır).
   * durum: acik | kilitli | secili. Liste <ul aria-label>; tur: satir | ders.
   * eylemler: bağlantı olmayan satırın sağındaki düğmeler (Sil, Düzelt…); bağlantı satırında iç içe etkileşim olmaz.
   * uzun: ad ve not kısaltılmaz, sarılır; satır en az standart boyda, gerekirse uzar (sayı + kesinlik etiketi taşıyan notlar, saatli plan blokları).
   * form {veri, govde}: satır yerinde düzenlenirken aynı kutuda <form novalidate> (gövde başka taşlar; gönderme ekranın işi). liste canli: aria-live. */
  function satir(o) {
    nesne('satir', o);
    if (o.form != null) { var f = nesne('satir', o.form); return '<form class="b-satir b-satir--form"' + veri('satir', f.veri) + ' novalidate>' + govde('satir', f.govde) + '</form>'; }
    var durum = sec('satir', 'durum', o.durum, ['acik', 'kilitli', 'secili']), ad = metin('satir', 'ad', o.ad, false), sinif = 'b-satir' + (o.uzun ? ' b-satir--uzun' : '');
    if (o.eylemler != null && o.href != null) hata('satir', 'bağlantı satırında eylem olmaz');
    var ic = '<span class="b-satir__metin"><span class="b-satir__ad">' + kac(ad) + '</span>' +
      (o.not != null && o.not !== '' ? '<span class="b-satir__not">' + kac(metin('satir', 'not', o.not)) + '</span>' : '') + '</span>' +
      (durum === 'kilitli' ? pul({ metin: 'kilitli' }) : o.pul != null ? pul(o.pul) : '') + (o.eylemler != null ? eylemler(o.eylemler) : '');
    if (durum === 'kilitli') return '<div class="' + sinif + ' b-satir--kilitli" aria-disabled="true">' + ic + '</div>';
    var cur = durum === 'secili' ? ' aria-current="true"' : '';
    if (o.href != null) return '<a class="' + sinif + '" href="' + kac(yol('satir', o.href)) + '"' + cur + veri('satir', o.veri) + '>' + ic +
      '<span class="b-satir__ok" aria-hidden="true">›</span></a>';
    return '<div class="' + sinif + '"' + cur + veri('satir', o.veri) + '>' + ic + '</div>';
  }
  function liste(o) {
    nesne('liste', o);
    var tur = sec('liste', 'tur', o.tur, ['satir', 'ders']), ad = metin('liste', 'ad', o.ad, false);
    if (!Array.isArray(o.ogeler) || !o.ogeler.length) hata('liste', 'ogeler boş olmayan dizi olmalı; boşsa Bilesen.bos kullan');
    var ciz = tur === 'ders' ? ders : satir;
    return '<ul class="b-liste b-liste--' + tur + '" aria-label="' + kac(ad) + '"' + (o.canli ? ' aria-live="polite"' : '') + '>' + o.ogeler.map(function (x) { return '<li>' + ciz(x) + '</li>'; }).join('') + '</ul>';
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

  /* 6 · Form alanı. tur: metin | cok | sayi | tarih | saat | arama | secim | onay | coklu | radyo. Etiket her zaman görünür (for/id;
   * coklu ve radyo: fieldset + legend, aynı isimli onay kutuları / radyolar); ipucu ve hata aria-describedby ile bağlı;
   * hata aria-invalid + «Hata:» öneki (renk tek başına değil). sayi metin kutusudur (inputmode decimal): Türkçe virgül yazılabilsin,
   * geçerliliğe motor karar verir. salt: readonly; uzun: çok satır 12 satır; yerTutucu: placeholder; veri: denetimin data-*'ı;
   * secim'de değeri nesne olan seçenek <optgroup> olur; gizliAd: etiket yalnız ekran okuyucuda (adı yanında yazan ayar satırı). */
  var GIRIS = { metin: 'text', sayi: 'text', tarih: 'date', saat: 'time', arama: 'search' };
  function alan(o) {
    nesne('alan', o);
    var tur = sec('alan', 'tur', o.tur, ['metin', 'cok', 'sayi', 'tarih', 'saat', 'arama', 'secim', 'onay', 'coklu', 'radyo']), ad = metin('alan', 'ad', o.ad);
    if (typeof o.isim !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(o.isim)) hata('alan', 'isim harfle başlayan [a-zA-Z0-9_-] olmalı');
    var id = 'b-alan-' + o.isim, ipucu = metin('alan', 'ipucu', o.ipucu, true), h = metin('alan', 'hata', o.hata, true);
    if (o.tarif != null && (typeof o.tarif !== 'string' || !AD.test(o.tarif))) hata('alan', 'tarif bir öğe kimliği olmalı');
    var tarif = [o.tarif, ipucu ? id + '-ipucu' : '', h ? id + '-hata' : ''].filter(Boolean).join(' ');
    var nit = ' name="' + kac(o.isim) + '"' + veri('alan', o.veri), ek = (tarif ? ' aria-describedby="' + tarif + '"' : '') + (h ? ' aria-invalid="true"' : '');
    var ortak = ' id="' + id + '"' + nit + ek + (o.zorunlu ? ' required' : '');
    var alt = (ipucu ? '<p class="b-alan__ipucu" id="' + id + '-ipucu">' + kac(ipucu) + '</p>' : '') +
      (h ? '<p class="b-alan__hata" id="' + id + '-hata"><b>Hata:</b> ' + kac(h) + '</p>' : '');
    if (tur === 'onay') {
      if (o.deger != null && typeof o.deger !== 'boolean') hata('alan', 'onay değeri true/false olmalı');
      return '<div class="b-alan"><label class="b-alan__onay"><input type="checkbox"' + ortak + (o.deger ? ' checked' : '') + '><span>' + kac(ad) + '</span></label>' + alt + '</div>';
    }
    if (tur === 'coklu' || tur === 'radyo') {
      var gs = nesne('alan', o.secenekler), gl = Object.keys(gs), dz = tur === 'coklu' ? (o.deger == null ? [] : o.deger) : [metin('alan', 'deger', o.deger, true)];
      if (!gl.length) hata('alan', 'secenekler boş');
      if (!Array.isArray(dz)) hata('alan', 'coklu değeri dizi olmalı');
      dz = dz.map(String).filter(Boolean);
      dz.forEach(function (v) { if (gl.indexOf(v) < 0) hata('alan', 'deger seçeneklerde yok'); });
      return '<fieldset class="b-alan b-alan--grup"' + ek + '><legend class="b-alan__ad">' + kac(ad) + '</legend><div class="b-alan__secenekler">' + gl.map(function (k) {
        return '<label class="b-alan__onay"><input type="' + (tur === 'coklu' ? 'checkbox' : 'radio') + '"' + nit + ' value="' + kac(k) + '"' + (dz.indexOf(k) >= 0 ? ' checked' : '') + '><span>' +
          kac(metin('alan', 'secenek', gs[k])) + '</span></label>';
      }).join('') + '</div>' + alt + '</fieldset>';
    }
    var deger = metin('alan', 'deger', o.deger, true), denetim, duz = {};
    var yt = (o.yerTutucu ? ' placeholder="' + kac(metin('alan', 'yerTutucu', o.yerTutucu)) + '"' : '') + (o.salt ? ' readonly' : '') + (o.enCok ? ' maxlength="' + (o.enCok | 0) + '"' : '');
    if (tur === 'secim') {
      var secenek = function (g) {
        return Object.keys(nesne('alan', g)).map(function (k) {
          if (g[k] && typeof g[k] === 'object') return '<optgroup label="' + kac(k) + '">' + secenek(g[k]) + '</optgroup>';
          duz[k] = true;
          return '<option value="' + kac(k) + '"' + (k === deger ? ' selected' : '') + '>' + kac(metin('alan', 'secenek', g[k])) + '</option>';
        }).join('');
      };
      var ic = secenek(o.secenekler);
      if (!Object.keys(duz).length) hata('alan', 'secenekler boş');
      if (deger && !duz[deger]) hata('alan', 'deger seçeneklerde yok');
      denetim = '<select class="b-alan__giris"' + ortak + '>' + ic + '</select>';
    } else if (tur === 'cok') {
      denetim = '<textarea class="b-alan__giris b-alan__giris--cok' + (o.uzun ? ' b-alan__giris--uzun" rows="12"' : '" rows="4"') + ortak + yt + '>' + kac(deger) + '</textarea>';
    } else {
      denetim = '<input type="' + GIRIS[tur] + '" class="b-alan__giris"' + ortak + ' value="' + kac(deger) + '"' + yt + (tur === 'sayi' ? ' inputmode="decimal"' : '') + ' autocomplete="off">';
    }
    return '<div class="b-alan' + (h ? ' b-alan--hata' : '') + '"><label class="b-alan__ad' + (o.gizliAd ? ' gizli' : '') + '" for="' + id + '">' + kac(ad) +
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
   * Tür renkle değil, önündeki sözcükle de ayrılır. eylem: bir düğme ya da düğme dizisi (sağda).
   * hata ve tamam odak alabilir (tabindex=-1): form gönderilince ekran iletinin üstüne odaklanır, ekran okuyucu okur. */
  var UYARI = { bilgi: ['Bilgi', 'note'], tamam: ['Tamam', 'status'], dikkat: ['Dikkat', 'note'], hata: ['Hata', 'alert'] };
  function uyari(o) {
    nesne('uyari', o);
    var tur = sec('uyari', 'tur', o.tur, ['bilgi', 'tamam', 'dikkat', 'hata']);
    return '<div class="b-uyari b-uyari--' + tur + '" role="' + UYARI[tur][1] + '"' + (tur === 'hata' || tur === 'tamam' ? ' tabindex="-1"' : '') + veri('uyari', o.veri) + '><span class="b-uyari__tur">' + UYARI[tur][0] + '</span>' +
      '<p class="b-uyari__metin">' + kac(metin('uyari', 'metin', o.metin)) + '</p>' + (o.eylem ? (Array.isArray(o.eylem) ? eylemler(o.eylem) : dugme(o.eylem)) : '') + '</div>';
  }

  /* 11 · Bölüm. <section aria-labelledby> + h2 + isteğe bağlı tek eylem; aralıklar sabit. */
  function bolum(o) {
    nesne('bolum', o);
    var b = metin('bolum', 'baslik', o.baslik), id = kimlik('bolum', o, b);
    return '<section class="b-bolum" aria-labelledby="' + id + '"' + veri('bolum', o.veri) + '><div class="b-bolum__ust"><h2 id="' + id + '">' + kac(b) + '</h2>' +
      (o.eylem ? dugme(o.eylem) : '') + '</div>' + govde('bolum', o.govde) + '</section>';
  }

  /* 12 · Panel. Yüzeyli kutu; tur: normal | guclu | basari (kalın altın çizgi). Başlık varsa <section aria-labelledby>.
   * durum: sonuç kutusu (role=status, odak alabilir: tabindex=-1; sonuç çizilince ekran okuyucu söyler). */
  function panel(o) {
    nesne('panel', o);
    var tur = sec('panel', 'tur', o.tur, ['normal', 'guclu', 'basari']), g = govde('panel', o.govde);
    var sinif = 'b-panel b-panel--' + tur + '"' + (o.durum ? ' role="status" tabindex="-1"' : '') + veri('panel', o.veri);
    if (o.baslik == null) return '<div class="' + sinif + (o.id != null ? ' id="' + kimlik('panel', o, '') + '"' : '') + '>' + g + '</div>';
    var b = metin('panel', 'baslik', o.baslik), id = kimlik('panel', o, b);
    return '<section class="' + sinif + ' aria-labelledby="' + id + '"><h2 id="' + id + '">' + kac(b) + '</h2>' + g + '</section>';
  }

  /* 14 · Açılır bölüm. <details>/<summary>; başlık h2 (ya da h3) ve kısa not üst sırada, gövde başka taşların çıktısı. */
  function acilir(o) {
    nesne('acilir', o);
    var d = o.duzey == null ? 2 : sec('acilir', 'duzey', o.duzey, [2, 3]);
    return '<details class="b-acilir"' + (o.acik ? ' open' : '') + veri('acilir', o.veri) + '><summary class="b-acilir__ust"><h' + d + ' class="b-acilir__baslik">' +
      kac(metin('acilir', 'baslik', o.baslik)) + '</h' + d + '>' + (o.not ? '<span class="b-acilir__not">' + kac(metin('acilir', 'not', o.not)) + '</span>' : '') +
      '</summary><div class="b-acilir__govde">' + govde('acilir', o.govde) + '</div></details>';
  }

  /* 15 · Soru. Soru metni (legend) ve şıklar A, B, … ya da şıksız (açık uçlu) gövde; altında sonuç satırı (role=status, odak alır, boşken görünmez).
   * kip: dugme (her şık bir <button> + data-h harfi; sikVeri her şıkka) | radyo (form içinde radyo grubu, isim gerekli; ok tuşlarını tarayıcı yönetir).
   * secili: seçilen harf (aria-pressed / checked). dogru verilirse işaretlenir: doğru şık 3 px altın çizgi + «✓ doğru», seçilen yanlış şık kesik çizgi
   * + «✕ senin cevabın» (renk tek başına değil). kilitli: şıklar aria-disabled (Sekme ile gezilir, okunur; tıklamayı yok saymak ekranın işi). ust: legend altında kısa soluk not. sonuc: {baslik, metin?, maddeler?, not?}. */
  var HARF = 'ABCDEFGH';
  function soru(o) {
    nesne('soru', o);
    var kip = sec('soru', 'kip', o.kip, ['dugme', 'radyo']), s = o.secenekler, ic;
    if (s != null) {
      if (!Array.isArray(s) || s.length < 2 || s.length > HARF.length) hata('soru', 'secenekler 2–8 öğeli dizi olmalı');
      var harf = HARF.slice(0, s.length);
      ['secili', 'dogru'].forEach(function (a) { if (o[a] != null && (typeof o[a] !== 'string' || o[a].length !== 1 || harf.indexOf(o[a]) < 0)) hata('soru', a + ' şıklardan birinin harfi olmalı'); });
      var isim = kip === 'radyo' ? kac(metin('soru', 'isim', o.isim)) : '';
      ic = '<div class="b-soru__siklar">' + s.map(function (m, i) {
        var h = harf[i], im = o.dogru == null ? '' : h === o.dogru ? 'dogru' : h === o.secili ? 'yanlis' : '';
        var yazi = '<b class="b-soru__harf">' + h + '</b><span class="b-soru__yazi">' + kac(metin('soru', 'secenek', m)) + '</span>' +
          (im ? '<span class="b-soru__im">' + (im === 'dogru' ? '✓ doğru' : '✕ senin cevabın') + '</span>' : '');
        var sinif = 'b-soru__sik' + (im ? ' b-soru__sik--' + im : ''), kapali = o.kilitli ? ' aria-disabled="true"' : '';
        if (kip === 'radyo') return '<label class="' + sinif + '"><input type="radio" name="' + isim + '" value="' + h + '"' + (h === o.secili ? ' checked' : '') + kapali + '>' + yazi + '</label>';
        return '<button type="button" class="' + sinif + '"' + veri('soru', o.sikVeri) + ' data-h="' + h + '" aria-pressed="' + (h === o.secili) + '"' + kapali + '>' + yazi + '</button>';
      }).join('') + '</div>';
    } else if (o.govde != null) ic = govde('soru', o.govde);
    else hata('soru', 'secenekler ya da govde gerekli');
    var r = o.sonuc == null ? null : nesne('soru', o.sonuc);
    if (r && r.maddeler != null && !Array.isArray(r.maddeler)) hata('soru', 'sonuc.maddeler dizi olmalı');
    var sonuc = !r ? '' : '<b>' + kac(metin('soru', 'sonuc.baslik', r.baslik)) + '</b>' + (r.metin ? ' ' + kac(metin('soru', 'sonuc.metin', r.metin)) : '') +
      (r.maddeler && r.maddeler.length ? '<ul>' + r.maddeler.map(function (x) { return '<li>' + kac(metin('soru', 'madde', x)) + '</li>'; }).join('') + '</ul>' : '') +
      (r.not ? '<p class="b-soru__not">' + kac(metin('soru', 'sonuc.not', r.not)) + '</p>' : '');
    return '<fieldset class="b-soru" tabindex="-1"' + veri('soru', o.veri) + '><legend class="b-soru__metin">' + kac(metin('soru', 'soru', o.soru)) + '</legend>' +
      (o.ust ? '<p class="b-soru__ust">' + kac(metin('soru', 'ust', o.ust)) + '</p>' : '') + ic + '<div class="b-soru__sonuc" tabindex="-1" role="status">' + sonuc + '</div></fieldset>';
  }

  /* 16 · Tercih düğmeleri. Kısa seçenekler yan yana: radiogroup + radio (aria-checked); seçili tek, sekme durağı tek (seçili, yoksa ilki).
   * Ok tuşları ve seçim olayı ekranın işidir (kabuk.js ayar satırı, katalog sayfası). etiket: başlığın kimliği (aria-labelledby) ya da
   * ad (aria-label); secenekler {deger: ad}; deger: seçili anahtar; veri her düğmeye (data-deger ayrıca). */
  function tercih(o) {
    nesne('tercih', o);
    var s = nesne('tercih', o.secenekler), l = Object.keys(s), odak = l.indexOf(o.deger) < 0 ? l[0] : o.deger;
    if (!l.length) hata('tercih', 'secenekler boş');
    if (o.etiket != null && (typeof o.etiket !== 'string' || !AD.test(o.etiket))) hata('tercih', 'etiket bir öğe kimliği olmalı');
    return '<div class="b-tercih" role="radiogroup"' + (o.etiket ? ' aria-labelledby="' + o.etiket + '"' : ' aria-label="' + kac(metin('tercih', 'ad', o.ad)) + '"') + '>' + l.map(function (k) {
      return '<button type="button" class="b-tercih__sec" role="radio" aria-checked="' + (k === o.deger) + '" tabindex="' + (k === odak ? 0 : -1) + '"' + veri('tercih', o.veri) +
        ' data-deger="' + kac(k) + '">' + kac(metin('tercih', 'secenek', s[k], false, 40)) + '</button>';
    }).join('') + '</div>';
  }

  function dizi(tas, ad, v, enAz) { if (!Array.isArray(v) || v.length < (enAz || 1)) hata(tas, ad + ' en az ' + (enAz || 1) + ' öğeli dizi olmalı'); return v; }
  // aria-labelledby (bir başlığın kimliği) ya da aria-label (ad)
  function adlandir(tas, o) {
    if (o.etiket == null) return ' aria-label="' + kac(metin(tas, 'ad', o.ad)) + '"';
    if (typeof o.etiket !== 'string' || !AD.test(o.etiket)) hata(tas, 'etiket bir öğe kimliği olmalı');
    return ' aria-labelledby="' + o.etiket + '"';
  }

  /* 17 · Kart (Tekrar). Ön yüz büyük; arka yüz çizgiyle ayrılır ve odak alır (açılınca ekran okuyucu okur). notlar (arkayla birlikte):
   * eşit genişlikte not düğmeleri {metin, sure: ne zaman yeniden sorulur, veri}; sığmazsa iki sütun. eylem: arka kapalıyken tek düğme.
   * ust: ön yüzün üstünde kısa soluk satır (bugünün sırası: «Bugün 3 tekrar, 1 yeni kart»). */
  function kart(o) {
    nesne('kart', o);
    var n = o.notlar == null ? null : dizi('kart', 'notlar', o.notlar);
    if (n && o.arka == null) hata('kart', 'notlar arka yüzle birlikte verilir');
    return '<div class="b-kart"' + veri('kart', o.veri) + '>' + (o.ust ? '<p class="b-kart__ust">' + kac(metin('kart', 'ust', o.ust)) + '</p>' : '') + '<p class="b-kart__on">' + kac(metin('kart', 'on', o.on)) + '</p>' +
      (o.arka != null ? '<p class="b-kart__arka" tabindex="-1">' + kac(metin('kart', 'arka', o.arka)) + '</p>' : '') +
      (n ? '<div class="b-kart__notlar" role="group" aria-label="Ne kadar hatırladın?">' + n.map(function (x) {
        return '<button type="button" class="b-kart__not"' + veri('kart', nesne('kart', x).veri) + '><span class="b-kart__notad">' + kac(metin('kart', 'not', x.metin, false, 16)) +
          '</span><span class="gizli">, </span><span class="b-kart__sure">' + kac(metin('kart', 'sure', x.sure)) + '</span></button>';
      }).join('') + '</div>' : '') + (o.eylem ? eylemler([o.eylem]) : '') + '</div>';
  }

  /* 18 · Tablo. ilk: satır başlıkları sütununun adı; sutunlar {metin, alt?, bugun?}; satirlar {ad, alt?, pul?, hucreler}; hücre {metin, alt?, okunur?
   * (yalnız ekran okuyucu)} ya da null: veri yok («·», okunur «veri yok»; sıfır değil). Kendi kabında yatay kayar (Sekme durağı), sayfa taşmaz. */
  function tablo(o) {
    nesne('tablo', o);
    var su = dizi('tablo', 'sutunlar', o.sutunlar), ad = adlandir('tablo', o);
    var alt = function (x) { return x.alt != null && x.alt !== '' ? '<small>' + kac(metin('tablo', 'alt', x.alt)) + '</small>' : ''; };
    return '<div class="b-tablo" role="region" tabindex="0"' + ad + '><table><thead><tr><th scope="col">' + kac(metin('tablo', 'ilk', o.ilk)) + '</th>' + su.map(function (s) {
      return '<th scope="col"' + (nesne('tablo', s).bugun ? ' aria-current="date"' : '') + '>' + kac(metin('tablo', 'sutun', s.metin)) + alt(s) + '</th>';
    }).join('') + '</tr></thead><tbody>' + dizi('tablo', 'satirlar', o.satirlar).map(function (r) {
      if (!Array.isArray(nesne('tablo', r).hucreler) || r.hucreler.length !== su.length) hata('tablo', 'her satırda sütun sayısı kadar hücre olmalı');
      return '<tr><th scope="row">' + kac(metin('tablo', 'satir', r.ad)) + (r.alt ? ' ' + alt(r) : '') + (r.pul != null ? ' ' + pul(r.pul) : '') + '</th>' + r.hucreler.map(function (c) {
        if (c == null) return '<td class="b-tablo__yok"><span aria-hidden="true">·</span><span class="gizli">veri yok</span></td>';
        return '<td>' + kac(metin('tablo', 'hucre', nesne('tablo', c).metin)) + alt(c) + (c.okunur ? '<span class="gizli"> ' + kac(metin('tablo', 'okunur', c.okunur)) + '</span>' : '') + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
  }

  /* 19 · Şerit. Ekranın üstüne yapışan tek sıra: başlık ve altında kısa not solda, sayaç sağda (role=timer). sayac {metin, ad, az}: az iken
   * 3 px vurgu çerçeve (renk tek başına değil, yanıp sönmez). Saniyelik güncelleme ekranın işi (.b-serit__sayac, sınıf b-serit__sayac--az).
   * duyuru: gizli canlı satırın kimliği («5 dakika kaldı» gibi sözleri ekran yazar; görünmez, ekran okuyucu söyler). */
  function serit(o) {
    nesne('serit', o);
    var s = o.sayac == null ? null : nesne('serit', o.sayac);
    if (o.duyuru != null && (typeof o.duyuru !== 'string' || !AD.test(o.duyuru))) hata('serit', 'duyuru bir öğe kimliği olmalı');
    return '<div class="b-serit"' + veri('serit', o.veri) + '><p class="b-serit__baslik">' + kac(metin('serit', 'baslik', o.baslik)) +
      (o.alt ? '<span class="b-serit__alt">' + kac(metin('serit', 'alt', o.alt)) + '</span>' : '') + '</p>' + (s ? '<span class="b-serit__sayac' + (s.az ? ' b-serit__sayac--az' : '') +
      '" role="timer" aria-label="' + kac(metin('serit', 'sayac.ad', s.ad)) + '">' + kac(metin('serit', 'sayac.metin', s.metin)) + '</span>' : '') +
      (o.duyuru ? '<p class="gizli" aria-live="polite" id="' + o.duyuru + '"></p>' : '') + '</div>';
  }

  /* 20 · Adımlar. Sıra numaralı 44 px kare düğmeler (deneme soruları); sığmayan alt satıra geçer. Öğe {etiket: tam ad, dolu: yapıldı (yüzey + güçlü
   * çizgi, numara koyu), secili: şu anki (aria-current=step, 3 px vurgu), veri}. */
  function adimlar(o) {
    nesne('adimlar', o);
    return '<nav class="b-adimlar" aria-label="' + kac(metin('adimlar', 'ad', o.ad)) + '">' + dizi('adimlar', 'ogeler', o.ogeler).map(function (x, j) {
      return '<button type="button" class="b-adimlar__no' + (nesne('adimlar', x).dolu ? ' b-adimlar__no--dolu' : '') + '"' + veri('adimlar', x.veri) + (x.secili ? ' aria-current="step"' : '') +
        ' aria-label="' + kac(metin('adimlar', 'etiket', x.etiket)) + '">' + (j + 1) + '</button>';
    }).join('') + '</nav>';
  }

  /* 21 · Ayar satırı. Ad ve bir cümle açıklama solda, denetim sağda (sığmazsa alta geçer). id: adın kimliği (denetim aria-labelledby ile ona bağlanır).
   * govde: başka taşların çıktısı (tercih, alan; birden çoksa role=group) ya da deger: salt okunur değer. isik: bağlantıyla gelinen satır (3 px vurgu). */
  function ayar(o) {
    nesne('ayar', o);
    if (typeof o.id !== 'string' || !AD.test(o.id)) hata('ayar', 'id küçük harf ve tire olmalı');
    var grup = Array.isArray(o.govde) && o.govde.length > 1 ? ' role="group" aria-labelledby="' + o.id + '"' : '';
    return '<div class="b-ayar' + (o.isik ? ' b-ayar--isik' : '') + '"' + veri('ayar', o.veri) + '><p class="b-ayar__metin"><span class="b-ayar__ad" id="' + o.id + '">' +
      kac(metin('ayar', 'ad', o.ad)) + '</span>' + (o.not ? '<span class="b-ayar__not">' + kac(metin('ayar', 'not', o.not)) + '</span>' : '') + '</p><div class="b-ayar__denetim"' + grup + '>' +
      (o.deger != null ? '<span class="b-ayar__deger">' + kac(metin('ayar', 'deger', o.deger)) + '</span>' : govde('ayar', o.govde)) + '</div></div>';
  }

  /* 22 · Ağ çizimi. Düğümler bağlantıdır (Sekme ile gezilir, Enter açar; ad 22 karakterde kısalır, tamamı <title> ve aria-label'da), kenarlar
   * üç çizgi türünde: duz | kesik | kalin (kalın kesik). Konumlar ekranın (viewBox en × boy). ozet: altta tek satır; aciklama {tur: ad}: çizgi türleri
   * örnek çizgiyle (renk tek başına değil). Kırktan çok düğümde adlar yalnız üstüne gelince ya da odakta görünür. */
  var CIZGI = ['duz', 'kesik', 'kalin'];
  function ag(o) {
    nesne('ag', o);
    var en = o.en, boy = o.boy, yer = {}, dl = dizi('ag', 'dugumler', o.dugumler, 2), ac = o.aciklama == null ? {} : nesne('ag', o.aciklama);
    if (!(en > 0 && boy > 0)) hata('ag', 'en ve boy pozitif sayı olmalı');
    dl.forEach(function (d) { if (typeof nesne('ag', d).x !== 'number' || typeof d.y !== 'number') hata('ag', 'düğüm konumu sayı olmalı'); yer[d.id] = d; });
    var svg = '<svg class="b-ag__cizim' + (dl.length > 40 ? ' b-ag__cizim--kalabalik' : '') + '" viewBox="0 0 ' + en + ' ' + boy + '" role="group" aria-label="' + kac(metin('ag', 'ad', o.ad)) + '">' +
      (o.kenarlar || []).map(function (e) {
        var a = yer[e.a], b = yer[e.b];
        if (!a || !b) hata('ag', 'kenar bilinmeyen düğüme bağlı');
        return '<line class="b-ag__' + sec('ag', 'kenar.tur', e.tur, CIZGI) + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
      }).join('') + dl.map(function (d) {
        var ad = metin('ag', 'dugum.ad', d.ad), sag = d.x < en - 140;
        return '<a href="' + kac(yol('ag', d.href)) + '" aria-label="' + kac(metin('ag', 'etiket', d.etiket || ad)) + '"><title>' + kac(ad) + '</title>' +
          '<circle cx="' + d.x + '" cy="' + d.y + '" r="' + (d.r > 0 ? d.r : 8) + '"/><text x="' + (d.x + (sag ? 14 : -14)) + '" y="' + (d.y + 4) + '"' + (sag ? '' : ' text-anchor="end"') + '>' +
          kac(ad.length > 22 ? ad.slice(0, 21) + '…' : ad) + '</text></a>';
      }).join('') + '</svg>';
    var l = Object.keys(ac).map(function (t) { return '<li><span class="b-ag__im b-ag__im--' + sec('ag', 'aciklama', t, CIZGI) + '" aria-hidden="true"></span>' + kac(metin('ag', 'aciklama', ac[t])) + '</li>'; }).join('');
    return '<figure class="b-ag"' + veri('ag', o.veri) + '>' + svg + (o.ozet || l ? '<figcaption class="b-ag__alt">' + (o.ozet ? '<span>' + kac(metin('ag', 'ozet', o.ozet)) + '</span>' : '') +
      (l ? '<ul class="b-ag__aciklama">' + l + '</ul>' : '') + '</figcaption>' : '') + '</figure>';
  }

  /* 23 · Karşılama (Bugün, «Manzara» yönü, sahibin seçimi 2026-11-14; örnek belgeler/tasarim/kabuk-pro/v2/odak.html?manzara=1).
   * Üstte manzara şeridi (canvas.b-karsilama__manzara: çizimi ekran yapar, çizilmezse gökyüzü rengi kalır), tarih ve selam (tek h1);
   * altında şeride binen iş kartı: «sırada» satırı (sira {ust, metin}), sıradaki adım, tek ana düğme (eylem), isteğe bağlı bağlantı
   * (baglanti {metin, href}) ve ilerleme halkası (ilerleme {deger, toplam}); altında «Bekleyenler» (ekler: uyarı taşları tek liste kartında)
   * ve «Alanlar» (alanlar [{ad, not?, href, simge (index.html'deki #i-<simge>), renk?, yuzde?}]). */
  var RENK = ['mavi', 'yesil', 'turuncu', 'pembe', 'gok', 'sari', 'mor', 'deniz'];
  function karsilama(o) {
    nesne('karsilama', o);
    var s = o.sira == null ? null : nesne('karsilama', o.sira), b = o.baglanti == null ? null : nesne('karsilama', o.baglanti), ek = o.ekler == null ? '' : govde('karsilama', o.ekler);
    var il = o.ilerleme == null ? null : nesne('karsilama', o.ilerleme), oran = il && il.toplam > 0 ? Math.max(0, Math.min(1, il.deger / il.toplam)) : null;
    var yuzde = oran == null ? 0 : Math.round(oran * 100);
    var halka = oran == null ? '' : '<div class="b-karsilama__halka" role="img" aria-label="İlerleme yüzde ' + yuzde + '"><svg viewBox="0 0 96 96" aria-hidden="true">' +
      '<circle class="b-karsilama__iz" cx="48" cy="48" r="40"/><circle class="b-karsilama__dolu" cx="48" cy="48" r="40" stroke-dasharray="251.3" stroke-dashoffset="' + (251.3 * (1 - oran)).toFixed(1) + '"/></svg>' +
      '<span class="b-karsilama__oran">%' + yuzde + '<small>' + (+il.deger) + ' / ' + (+il.toplam) + ' ders</small></span></div>';
    var al = (o.alanlar || []).map(function (a) {
      nesne('karsilama', a);
      var renk = RENK.indexOf(a.renk) >= 0 ? a.renk : 'turuncu';
      return '<a class="b-karsilama__alan" href="' + kac(yol('karsilama', a.href)) + '"><span class="b-karsilama__simge b-karsilama__simge--' + renk + '" aria-hidden="true"><svg><use href="#i-' + kac(String(a.simge || 'nokta')) + '"/></svg></span>' +
        '<span class="b-karsilama__alanmetin"><span class="b-karsilama__alanad">' + kac(metin('karsilama', 'alanlar.ad', a.ad)) + '</span>' +
        (a.not ? '<span class="b-karsilama__alannot">' + kac(metin('karsilama', 'alanlar.not', a.not)) + '</span>' : '') + '</span>' +
        (a.yuzde != null ? '<span class="b-karsilama__yuzde">%' + Math.round(+a.yuzde) + '</span>' : '<svg class="b-karsilama__ok" aria-hidden="true"><use href="#i-sag"/></svg>') + '</a>';
    }).join('');
    return '<div class="b-karsilama"><div class="b-karsilama__sahne"><canvas class="b-karsilama__manzara" width="384" height="96" aria-hidden="true"></canvas>' +
      '<div class="b-karsilama__ic">' + (o.tarih ? '<p class="b-karsilama__tarih">' + kac(metin('karsilama', 'tarih', o.tarih)) + '</p>' : '') +
      '<h1 class="b-karsilama__selam">' + kac(metin('karsilama', 'selam', o.selam)) + '</h1></div></div>' +
      '<section class="b-karsilama__is" aria-label="Sıradaki"><div class="b-karsilama__govde">' +
      (s ? '<p class="b-karsilama__sira"><span class="b-karsilama__ust">' + kac(metin('karsilama', 'sira.ust', s.ust)) + '</span><br>' + kac(metin('karsilama', 'sira.metin', s.metin)) + '</p>' : '') +
      (o.adim ? '<p class="b-karsilama__adim">' + kac(metin('karsilama', 'adim', o.adim)) + '</p>' : '') +
      '<div class="b-karsilama__eylem">' + dugme(Object.assign({ tur: 'ana' }, nesne('karsilama', o.eylem))) +
      (b ? '<a class="b-karsilama__baglanti" href="' + kac(yol('karsilama', b.href)) + '">' + kac(metin('karsilama', 'baglanti.metin', b.metin)) + '</a>' : '') + '</div></div>' + halka + '</section>' +
      (ek ? '<section class="b-karsilama__bolum" aria-label="Bekleyenler"><h2 class="b-karsilama__baslik">Bekleyenler</h2><div class="b-karsilama__ek">' +
        ek.replace(/class="b-uyari /g, 'class="b-uyari b-uyari--satir ') + '</div></section>' : '') +
      (al ? '<section class="b-karsilama__bolum" aria-label="Alanlar"><h2 class="b-karsilama__baslik">Alanlar</h2><nav class="b-karsilama__alanlar" aria-label="Alanlar">' + al + '</nav></section>' : '') + '</div>';
  }

  /* 24 · Halka (Yerler). Basılı tutunca ya da Ctrl . ile açılan dairesel menü: role=menu, öğeler menuitem düğmeleri (data-yol); ilki tepede, saat yönünde
   * eşit açıyla (--a). Gizli çizilir; açma (b-halka--acik), konum (--x --y --r), seçim (b-halka__oge--secili) ve ok tuşları ekranın işi (kabuk.js).
   * Zemin yuvarlak (sahibin kararı, faz2-kabuk.md); köşe değil, daire: radyal geçişle çizilir. */
  function halka(o) {
    nesne('halka', o);
    if (typeof o.id !== 'string' || !AD.test(o.id)) hata('halka', 'id küçük harf ve tire olmalı');
    var l = dizi('halka', 'ogeler', o.ogeler, 2);
    return '<div id="' + o.id + '" class="b-halka" role="menu" aria-label="' + kac(metin('halka', 'ad', o.ad)) + '" hidden><span class="b-halka__merkez" aria-hidden="true"></span>' +
      l.map(function (x, i) {
        return '<button type="button" role="menuitem" class="b-halka__oge" data-yol="' + kac(yol('halka', nesne('halka', x).yol)) + '" style="--a:' + (-90 + i * 360 / l.length) + 'deg">' +
          kac(metin('halka', 'ad', x.ad, false, 24)) + '</button>';
      }).join('') + '</div>';
  }

  /* 25 · Komut çubuğu. Ortada açılan arama penceresi: role=dialog aria-modal; combobox girişi, listbox sonuçlar (<id>-liste), gizli canlı durum satırı
   * (<id>-durum). Gizli çizilir; açma, süzme, ok tuşları ve seçim ekranın işi (kabuk.js). komutListe({id, ogeler: [{ad, etiket}]}): sonuç öğeleri
   * role=option (<id>-0, -1, …; ilki seçili, data-i sırası); boşsa «Sonuç yok» (seçilemez). */
  function komut(o) {
    nesne('komut', o);
    if (typeof o.id !== 'string' || !AD.test(o.id)) hata('komut', 'id küçük harf ve tire olmalı');
    var yt = kac(metin('komut', 'yerTutucu', o.yerTutucu));
    return '<div id="' + o.id + '" class="b-komut" role="dialog" aria-modal="true" aria-label="' + kac(metin('komut', 'ad', o.ad)) + '" hidden><div class="b-komut__giris">' +
      '<input class="b-komut__alan" type="text" role="combobox" aria-expanded="false" aria-controls="' + o.id + '-liste" aria-autocomplete="list" aria-label="' + yt + '" placeholder="' + yt +
      '" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div><ul id="' + o.id + '-liste" class="b-komut__liste" role="listbox" aria-label="Sonuçlar"></ul>' +
      '<p id="' + o.id + '-durum" class="gizli" aria-live="polite"></p></div>';
  }
  function komutListe(o) {
    nesne('komutListe', o);
    if (typeof o.id !== 'string' || !AD.test(o.id)) hata('komutListe', 'id küçük harf ve tire olmalı');
    if (!Array.isArray(o.ogeler)) hata('komutListe', 'ogeler dizi olmalı');
    if (!o.ogeler.length) return '<li class="b-komut__bos" role="presentation">Sonuç yok</li>';
    return o.ogeler.map(function (x, i) {
      return '<li class="b-komut__oge" role="option" id="' + o.id + '-' + i + '" aria-selected="' + (i === 0) + '" data-i="' + i + '"><span>' + kac(metin('komutListe', 'ad', nesne('komutListe', x).ad)) +
        '</span><span class="b-komut__etiket">' + kac(metin('komutListe', 'etiket', x.etiket, true)) + '</span></li>';
    }).join('');
  }

  /* 26 · Sohbet (Tanışma). <section aria-label>; geçmiş [{soru, cevap: [metin…] | atlandi: true, eylem?}]: soru solda yüzeyde, cevabın sağda koyu
   * yüzeyde (atlanan soru «Atladın»), yanında tek düğme (Değiştir). simdi {soru?: {metin, id?, canli?, odak?}, govde, form?: veri | etiket: başlık kimliği}:
   * şu anki adım; soru vurgulu (canli: aria-live, odak: tabindex=-1), form verilirse <form novalidate> (gönderme ekranın işi), yoksa <section aria-labelledby>. */
  function sohbet(o) {
    nesne('sohbet', o);
    var g = o.gecmis == null ? [] : o.gecmis, s = nesne('sohbet', o.simdi);
    if (!Array.isArray(g)) hata('sohbet', 'gecmis dizi olmalı');
    var akis = g.length ? '<ol class="b-sohbet__akis">' + g.map(function (x) {
      nesne('sohbet', x);
      if (!x.atlandi && !Array.isArray(x.cevap)) hata('sohbet', 'cevap metin dizisi olmalı (ya da atlandi)');
      var c = x.atlandi ? '<span class="b-sohbet__atla">Atladın</span>' : x.cevap.map(function (m) { return '<span>' + kac(metin('sohbet', 'cevap', m)) + '</span>'; }).join('');
      return '<li class="b-sohbet__soru">' + kac(metin('sohbet', 'soru', x.soru)) + '</li><li class="b-sohbet__ben">' + c + (x.eylem ? dugme(x.eylem) : '') + '</li>';
    }).join('') + '</ol>' : '';
    var q = s.soru == null ? null : nesne('sohbet', s.soru);
    if (q && q.id != null && (typeof q.id !== 'string' || !AD.test(q.id))) hata('sohbet', 'soru.id küçük harf ve tire olmalı');
    var soz = q ? '<p class="b-sohbet__soru b-sohbet__soru--simdi"' + (q.id ? ' id="' + q.id + '"' : '') + (q.canli ? ' aria-live="polite"' : '') + (q.odak ? ' tabindex="-1"' : '') + '>' +
      kac(metin('sohbet', 'soru.metin', q.metin)) + '</p>' : '';
    var ic = soz + govde('sohbet', s.govde), simdi;
    if (s.form != null) simdi = '<form class="b-sohbet__simdi"' + veri('sohbet', s.form) + ' novalidate>' + ic + '</form>';
    else {
      if (typeof s.etiket !== 'string' || !AD.test(s.etiket)) hata('sohbet', 'form değilse simdi.etiket bir başlığın kimliği olmalı');
      simdi = '<section class="b-sohbet__simdi" aria-labelledby="' + s.etiket + '">' + ic + '</section>';
    }
    return '<section class="b-sohbet" aria-label="' + kac(metin('sohbet', 'ad', o.ad)) + '">' + akis + simdi + '</section>';
  }

  /* 27 · Çipler. Hızlı seçenekler: <fieldset> + gizli legend (ad; kaç seçilebileceğini de söyler) içinde aç/kapa düğmeleri (aria-pressed).
   * ogeler: düğme seçenekleri; basılı değilse false yazılır. Tek mi çok mu seçileceği ekranın işi. */
  function cipler(o) {
    nesne('cipler', o);
    return '<fieldset class="b-cipler"><legend class="gizli">' + kac(metin('cipler', 'ad', o.ad)) + '</legend>' +
      eylemler(dizi('cipler', 'ogeler', o.ogeler).map(function (x) { return Object.assign({}, nesne('cipler', x), { basili: !!x.basili }); })) + '</fieldset>';
  }

  /* 28 · Yanlı düzen. Ana sütun + yapışkan yan sütun; 820 px ve altında alt alta, yan yapışmaz. taraf: sol (yan önce; Ayarlar gezinmesi 12 rem) |
   * sag (ana önce; Tanışma paneli, 3:2). tamamlayici: yan <aside>. gezinme({ad, ogeler: [{metin, href}]}): sayfa içi bağlantılar (<nav aria-label>),
   * her biri en az 44 px; dar ekranda yan yana sarar. */
  function yanli(o) {
    nesne('yanli', o);
    var t = sec('yanli', 'taraf', o.taraf, ['sol', 'sag']), e = o.tamamlayici ? 'aside' : 'div';
    var yan = '<' + e + ' class="b-yanli__yan">' + govde('yanli', o.yan) + '</' + e + '>', ana = '<div class="b-yanli__ana">' + govde('yanli', o.ana) + '</div>';
    return '<div class="b-yanli b-yanli--' + t + '">' + (t === 'sol' ? yan + ana : ana + yan) + '</div>';
  }
  function gezinme(o) {
    nesne('gezinme', o);
    return '<nav class="b-gezinme" aria-label="' + kac(metin('gezinme', 'ad', o.ad)) + '">' + dizi('gezinme', 'ogeler', o.ogeler).map(function (x) {
      return '<a class="b-gezinme__oge" href="' + kac(yol('gezinme', nesne('gezinme', x).href)) + '">' + kac(metin('gezinme', 'metin', x.metin)) + '</a>';
    }).join('') + '</nav>';
  }

  var Bilesen = {
    TASLAR: ['dugme', 'pul', 'satir', 'ders', 'ilerleme', 'alan', 'bos', 'baslik', 'sayi', 'uyari', 'bolum', 'panel', 'eylemler', 'acilir', 'soru', 'tercih',
      'kart', 'tablo', 'serit', 'adimlar', 'ayar', 'ag', 'karsilama', 'halka', 'komut', 'sohbet', 'cipler', 'yanli'],
    ETIKET: ETIKET, kac: kac,
    dugme: dugme, pul: pul, satir: satir, liste: liste, ders: ders, ilerleme: ilerleme, alan: alan, bos: bos,
    baslik: baslik, sayi: sayi, sayilar: sayilar, uyari: uyari, bolum: bolum, panel: panel, eylemler: eylemler, acilir: acilir, soru: soru, tercih: tercih,
    kart: kart, tablo: tablo, serit: serit, adimlar: adimlar, ayar: ayar, ag: ag,
    karsilama: karsilama, halka: halka, komut: komut, komutListe: komutListe, sohbet: sohbet, cipler: cipler, yanli: yanli, gezinme: gezinme
  };
  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Kabuk = kok.LIFEOS.Kabuk || {};
  kok.LIFEOS.Kabuk.Bilesen = Bilesen;
  kok.Bilesen = Bilesen;
  if (typeof module !== 'undefined' && module.exports) module.exports = Bilesen;
})(typeof window !== 'undefined' ? window : globalThis);
