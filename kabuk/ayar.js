/* LIFEOS.Kabuk.Ayar — tek ayar şeması. Bir ayar yalnız burada tanımlanır; ekran (ciz), doğrulama
 * (dogrula), okuma/yazma (oku, yaz), sıfırlama (sifirla) ve eşitleme dışa aktarımı (disaAktar, iceAl)
 * bu tanımdan türetilir. Yeni ayar = SEMA'ya tek satır.
 * Satır: { anahtar, ad, tur: secim|saatAraligi, varsayilan, secenekler?, esitlenir, aciklama, grup, kok?, kaynak }
 *   kok      : değer köke yazılan data-* niteliği (CSS onu okur)
 *   esitlenir: cihazlar arası eşitlenir mi (eski katalogdaki «o» bayrağı)
 *   kaynak   : envanter-kabuk-sunucu.md'de «tut» diyen satır
 * Anahtar adları eski `lifeos.*` adlarıdır: göçte değer olduğu gibi okunur.
 * Depo: getItem/setItem/removeItem veren her nesne (localStorage ya da testte sahte depo). */
(function (kok) {
  'use strict';

  var ENV = 'envanter-kabuk-sunucu.md';
  var GRUPLAR = [
    { id: 'gorunum', ad: 'Görünüm' }, { id: 'erisim', ad: 'Erişilebilirlik' },
    { id: 'bildirim', ad: 'Bildirim' }, { id: 'hesap', ad: 'Hesap ve güvenlik' }
  ];

  var SEMA = [
    { anahtar: 'lifeos.tema.secim', ad: 'Tema', tur: 'secim', varsayilan: 'system', grup: 'gorunum', kok: 'data-theme', esitlenir: true,
      secenekler: { system: 'Cihaza uy', light: 'Açık', dark: 'Koyu' }, aciklama: 'Açık ya da koyu renkler.', kaynak: ENV + ' §3c Tema, yazı: tema.secim' },
    { anahtar: 'lifeos.tema.oto', ad: 'Saate göre tema', tur: 'secim', varsayilan: 'kapali', grup: 'gorunum', esitlenir: true,
      secenekler: { kapali: 'Kapalı', acik: 'Açık' }, aciklama: 'Akşam koyu, sabah açık tema.', kaynak: ENV + ' §3c Tema, yazı: tema.oto' },
    { anahtar: 'lifeos.yazi', ad: 'Yazı tipi', tur: 'secim', varsayilan: 'piksel', grup: 'gorunum', kok: 'data-yazi', esitlenir: true,
      secenekler: { piksel: 'Piksel', sistem: 'Cihazın yazısı' }, aciklama: 'Başlıklar her zaman piksel kalır.', kaynak: ENV + ' §3c Tema, yazı: yazi' },
    { anahtar: 'lifeos.vurgu', ad: 'Vurgu rengi', tur: 'secim', varsayilan: 'modul', grup: 'gorunum', kok: 'data-vurgu', esitlenir: true,
      secenekler: { modul: 'Alanın rengi', mavi: 'Mavi', yesil: 'Yeşil', mor: 'Mor', turuncu: 'Turuncu', pembe: 'Pembe', grafit: 'Grafit' },
      aciklama: 'Seçili düğme ve sekmenin rengi; ölçü renkleri değişmez.', kaynak: ENV + ' §3b lifeos.vurgu' },
    { anahtar: 'lifeos.boyut', ad: 'Yazı boyutu', tur: 'secim', varsayilan: 'normal', grup: 'erisim', kok: 'data-boyut', esitlenir: true,
      secenekler: { kucuk: 'Küçük', normal: 'Normal', buyuk: 'Büyük', enbuyuk: 'En büyük' }, aciklama: 'Bütün arayüz birlikte büyür.', kaynak: ENV + ' §3b lifeos.boyut' },
    { anahtar: 'lifeos.satir', ad: 'Satır aralığı', tur: 'secim', varsayilan: 'normal', grup: 'erisim', kok: 'data-satir', esitlenir: true,
      secenekler: { normal: 'Normal', genis: 'Geniş' }, aciklama: 'Uzun metinlerde okumayı kolaylaştırır.', kaynak: ENV + ' §3b lifeos.satir' },
    { anahtar: 'lifeos.kontrast', ad: 'Kontrast', tur: 'secim', varsayilan: 'normal', grup: 'erisim', kok: 'data-kontrast', esitlenir: true,
      secenekler: { normal: 'Normal', yuksek: 'Yüksek' }, aciklama: 'Yazı ile zemin arasındaki fark.', kaynak: ENV + ' §3b lifeos.kontrast' },
    { anahtar: 'lifeos.odak', ad: 'Odak çerçevesi', tur: 'secim', varsayilan: 'normal', grup: 'erisim', kok: 'data-odak', esitlenir: true,
      secenekler: { normal: 'Normal', belirgin: 'Belirgin' }, aciklama: 'Klavyeyle gezerken seçili yerin çerçevesi.', kaynak: ENV + ' §3b lifeos.odak' },
    { anahtar: 'lifeos.altcizgi', ad: 'Bağlantıların altı çizili', tur: 'secim', varsayilan: 'hayir', grup: 'erisim', kok: 'data-altcizgi', esitlenir: true,
      secenekler: { hayir: 'Hayır', evet: 'Evet' }, aciklama: 'Bağlantıları renkten bağımsız ayırır.', kaynak: ENV + ' §3b lifeos.altcizgi' },
    { anahtar: 'lifeos.hareket', ad: 'Hareket', tur: 'secim', varsayilan: 'tam', grup: 'erisim', kok: 'data-hareket', esitlenir: true,
      secenekler: { tam: 'Tam', az: 'Az', sistem: 'Cihaza uy' }, aciklama: 'Geçişler ve açılır katmanların hareketi.', kaynak: ENV + ' §3c Animasyon: hareket' },
    { anahtar: 'lifeos.rozet', ad: 'Sayaçlar ve noktalar', tur: 'secim', varsayilan: 'acik', grup: 'bildirim', kok: 'data-rozet', esitlenir: true,
      secenekler: { acik: 'Göster', kapali: 'Gizle' }, aciklama: 'Bekleyen işleri gösteren küçük işaretler.', kaynak: ENV + ' §3b lifeos.rozet' },
    { anahtar: 'lifeos.sessiz', ad: 'Sessiz saatler', tur: 'saatAraligi', varsayilan: { acik: false, bas: '22:00', bit: '07:00' }, grup: 'bildirim', esitlenir: true,
      aciklama: 'Bu aralıkta sesler ve sesli okuma susar; gece yarısını geçebilir.', kaynak: ENV + ' §3c Ses ve müzik: sessiz saatler' },
    { anahtar: 'lifeos.kilit.odeme', ad: 'Satın alma ve kart işlemleri', tur: 'secim', varsayilan: 'kapali', grup: 'hesap', esitlenir: false,
      secenekler: { kapali: 'Kapalı', acik: 'Açık' }, aciklama: 'Kapalıyken King ödeme, sipariş ya da kart işine girmez.', kaynak: ENV + ' §3c Diğer: kilit.odeme' }
  ];

  var SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;
  function tanim(anahtar) { return SEMA.filter(function (s) { return s.anahtar === anahtar; })[0] || null; }
  function kopya(v) { return v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v; }

  function dogrula(t, v) {
    if (!t) return false;
    if (t.tur === 'secim') return typeof v === 'string' && Object.prototype.hasOwnProperty.call(t.secenekler, v);
    if (t.tur === 'saatAraligi') return !!v && typeof v === 'object' && typeof v.acik === 'boolean' && SAAT.test(v.bas) && SAAT.test(v.bit);
    return false;
  }
  // depoda düz metin (secim) ya da JSON (saatAraligi); bozuk ya da geçersiz değer varsayılana düşer
  function coz(t, ham) {
    if (ham == null) return kopya(t.varsayilan);
    var v = ham;
    if (t.tur !== 'secim') { try { v = JSON.parse(ham); } catch (e) { return kopya(t.varsayilan); } }
    return dogrula(t, v) ? v : kopya(t.varsayilan);
  }
  function oku(depo, anahtar) {
    var t = tanim(anahtar); if (!t) throw new Error('Ayar: bilinmeyen anahtar ' + anahtar);
    var ham = null; try { ham = depo.getItem(anahtar); } catch (e) { /* depo kapalı */ }
    return coz(t, ham);
  }
  function yaz(depo, anahtar, v) {
    var t = tanim(anahtar); if (!t || !dogrula(t, v)) return false;
    try { depo.setItem(anahtar, t.tur === 'secim' ? v : JSON.stringify(v)); return true; } catch (e) { return false; }
  }
  function sifirla(depo, anahtar) {
    (anahtar ? [tanim(anahtar)].filter(Boolean) : SEMA).forEach(function (t) {
      try { depo.removeItem(t.anahtar); } catch (e) { /* depo kapalı */ }
    });
  }
  // eşitleme: yalnız esitlenir satırlar ve yalnız geçerli değerler gider
  function disaAktar(depo) {
    var o = {};
    SEMA.forEach(function (t) { if (t.esitlenir) o[t.anahtar] = oku(depo, t.anahtar); });
    return o;
  }
  // gelen paket: bilinmeyen, eşitlenmeyen ya da geçersiz değer reddedilir; kabul edilen anahtarlar döner
  function iceAl(depo, paket) {
    var alinan = [];
    Object.keys(paket || {}).forEach(function (k) {
      var t = tanim(k);
      if (t && t.esitlenir && yaz(depo, k, paket[k])) alinan.push(k);
    });
    return alinan;
  }
  // kök nitelikleri: { 'data-boyut': 'normal', ... }; temada «system» niteliği kaldırır (null)
  function kokNitelikleri(depo) {
    var o = {};
    SEMA.forEach(function (t) {
      if (!t.kok) return;
      var v = oku(depo, t.anahtar);
      o[t.kok] = (t.kok === 'data-theme' && v === 'system') ? null : v;
    });
    return o;
  }

  function kac(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* Ekran: bir satırın denetimi (HTML metni). Saf; olay bağlamayı kabuk.js yapar (data-ayar, data-deger). */
  function ciz(t, v) {
    var id = 'ayar-' + t.anahtar.replace(/[^a-z0-9]/g, '-');
    var bas = '<div class="ayar" data-ayar-satir="' + kac(t.anahtar) + '"><div class="ayar__metin"><span class="ayar__ad" id="' + id + '">' + kac(t.ad) +
      '</span><span class="ayar__not">' + kac(t.aciklama) + '</span></div>';
    var govde;
    if (t.tur === 'secim') {
      govde = '<div class="seg" role="radiogroup" aria-labelledby="' + id + '">' + Object.keys(t.secenekler).map(function (k) {
        var on = k === v;
        return '<button type="button" role="radio" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-ayar="' + kac(t.anahtar) +
          '" data-deger="' + kac(k) + '">' + kac(t.secenekler[k]) + '</button>';
      }).join('') + '</div>';
    } else {
      govde = '<div class="aralik" role="group" aria-labelledby="' + id + '">' +
        '<label class="anahtar"><input type="checkbox" data-ayar="' + kac(t.anahtar) + '" data-parca="acik"' + (v.acik ? ' checked' : '') + '><span>Açık</span></label>' +
        '<label>Başlangıç <input type="time" data-ayar="' + kac(t.anahtar) + '" data-parca="bas" value="' + kac(v.bas) + '"></label>' +
        '<label>Bitiş <input type="time" data-ayar="' + kac(t.anahtar) + '" data-parca="bit" value="' + kac(v.bit) + '"></label></div>';
    }
    return bas + govde + '</div>';
  }

  var Ayar = { SEMA: SEMA, GRUPLAR: GRUPLAR, tanim: tanim, dogrula: dogrula, oku: oku, yaz: yaz, sifirla: sifirla,
    disaAktar: disaAktar, iceAl: iceAl, kokNitelikleri: kokNitelikleri, ciz: ciz };
  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Kabuk = kok.LIFEOS.Kabuk || {};
  kok.LIFEOS.Kabuk.Ayar = Ayar;
  if (typeof module !== 'undefined' && module.exports) module.exports = Ayar;
})(typeof window !== 'undefined' ? window : globalThis);
