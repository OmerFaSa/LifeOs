/* LIFEOS.Kabuk.Harita — sistem haritası kaydı. Kabuktaki her yer burada bir satırdır;
 * halka, komut çubuğu, sistem haritası sayfası ve dal sayfaları bu tek listeden türetilir.
 * Satır: { id, ad, katman: kabuk|alan|motor|king, dal, alan?, yol, ikon?, durum?, eski?, aciklama }
 *   dal    : haritanın beş dalından biri (plan §7: Ana sayfa, Öğren, Sağlık, Motorlar, Ayarlar) + King
 *   durum  : "yeni" (kabukta), "pilot" (taşınıyor), "eski" (henüz eski modülde, `eski` bağlantısı var),
 *            "plan" (motor henüz yazılmadı)
 *   halka  : halkadaki sırası (yoksa halkada değil)
 *   asama  : alanın kabuğa taşınmış en yüksek aşama numarası; kabuk alan/<id>/asama-1..N.json'u ister, dosyası
 *            henüz olmayan (ya da bozuk) aşama gösterilmez; yoksa alan henüz eski modülde. Yeni aşama yazılınca bu sayı artar (testte).
 * Sıfır bağımlılık; tarayıcıda window.LIFEOS.Kabuk.Harita, Node'da module.exports. */
(function (kok) {
  'use strict';

  var AYS = '../AYS/dist/rota.html', ESP = '../ESP/dist/esp.html', SPI = '../SPI/dist/spi.html';

  var YERLER = [
    // kabuk
    { id: 'bugun', ad: 'Bugün', katman: 'kabuk', dal: 'ana', yol: '#/bugun', ikon: 'gunes', halka: 1, durum: 'yeni', aciklama: 'Şimdi ne yapacağın' },
    { id: 'ogren', ad: 'Öğren', katman: 'kabuk', dal: 'ogren', yol: '#/ogren', ikon: 'kitap', halka: 2, durum: 'yeni', aciklama: 'Öğrenme alanları' },
    { id: 'saglik', ad: 'Sağlık', katman: 'kabuk', dal: 'saglik', yol: '#/saglik', ikon: 'kalp', halka: 3, durum: 'yeni', aciklama: 'Beslenme, hareket, uyku, tahlil' },
    { id: 'motorlar', ad: 'Araçlar', katman: 'kabuk', dal: 'motorlar', yol: '#/motorlar', ikon: 'cark', durum: 'yeni', aciklama: 'Her alanın ortak araçları' },
    { id: 'harita', ad: 'Sistem haritası', katman: 'kabuk', dal: 'ana', yol: '#/harita', ikon: 'harita', halka: 6, durum: 'yeni', aciklama: 'Bütün yerler tek sayfada' },
    { id: 'tanisma', ad: 'Tanışma', katman: 'kabuk', dal: 'ana', yol: '#/tanisma', ikon: 'el', durum: 'yeni', aciklama: 'Kendini kendi sözlerinle anlat; başlangıcın buna göre önerilir' },
    { id: 'ayarlar', ad: 'Ayarlar', katman: 'kabuk', dal: 'ayarlar', yol: '#/ayarlar', ikon: 'ayar', durum: 'yeni', aciklama: 'Görünüm, erişilebilirlik, bildirim, hesap' },
    { id: 'eskisistem', ad: 'Eski sistem', katman: 'kabuk', dal: 'ayarlar', yol: '#/eski', ikon: 'kutu', durum: 'eski', eski: '/kartlar/', aciklama: 'Kontrol paneli, güncelleme, AYS · SPİ · ESP' },
    // alanlar (plan §3, on alan); Öğren dalı
    { id: 'akademik', ad: 'Akademik', katman: 'alan', alan: 'akademik', dal: 'ogren', yol: '#/alan/akademik', ikon: 'kalem', durum: 'pilot', asama: 2, eski: AYS, aciklama: 'Sınav hazırlığı' },
    { id: 'dil', ad: 'Dil', katman: 'alan', alan: 'dil', dal: 'ogren', yol: '#/alan/dil', ikon: 'balon', durum: 'pilot', asama: 2, eski: ESP, aciklama: 'Diller ve diksiyon' },
    { id: 'felsefe', ad: 'Felsefe', katman: 'alan', alan: 'felsefe', dal: 'ogren', yol: '#/alan/felsefe', ikon: 'soru', durum: 'pilot', asama: 2, eski: ESP, aciklama: 'Soru, kavram, tanım' },
    { id: 'tarih', ad: 'Tarih', katman: 'alan', alan: 'tarih', dal: 'ogren', yol: '#/alan/tarih', ikon: 'kum', durum: 'pilot', asama: 2, eski: ESP, aciklama: 'Olaylar ve dönemler' },
    { id: 'muzik', ad: 'Müzik', katman: 'alan', alan: 'muzik', dal: 'ogren', yol: '#/alan/muzik', ikon: 'nota', durum: 'pilot', asama: 2, eski: ESP, aciklama: 'Çalgı ve kulak' },
    { id: 'okuma', ad: 'Okuma ve yazı', katman: 'alan', alan: 'okuma', dal: 'ogren', yol: '#/alan/okuma', ikon: 'sayfa', durum: 'pilot', asama: 2, eski: ESP, aciklama: 'Okumak ve yazmak' },
    // alanlar; Sağlık dalı
    { id: 'beslenme', ad: 'Beslenme', katman: 'alan', alan: 'beslenme', dal: 'saglik', yol: '#/alan/beslenme', ikon: 'tabak', durum: 'pilot', asama: 2, eski: SPI, aciklama: 'Öğünler ve tabak' },
    { id: 'hareket', ad: 'Hareket', katman: 'alan', alan: 'hareket', dal: 'saglik', yol: '#/alan/hareket', ikon: 'kos', durum: 'pilot', asama: 2, eski: SPI, aciklama: 'Spor ve yürüyüş' },
    { id: 'uyku', ad: 'Uyku', katman: 'alan', alan: 'uyku', dal: 'saglik', yol: '#/alan/uyku', ikon: 'ay', durum: 'pilot', asama: 2, eski: SPI, aciklama: 'Uyku ve şekerleme' },
    { id: 'tahlil', ad: 'Tahlil', katman: 'alan', alan: 'tahlil', dal: 'saglik', yol: '#/alan/tahlil', ikon: 'damla', durum: 'pilot', asama: 2, eski: SPI, aciklama: 'Tahlil sonuçları' },
    // motorlar (plan §3); Araçlar dalı. Not halkada: her yerden çağrılan defter.
    { id: 'yol', ad: 'Yol haritası', katman: 'motor', dal: 'motorlar', yol: '#/motor/yol', ikon: 'yol', durum: 'yeni', aciklama: 'Aşama, ünite, ders ve kapı' },
    { id: 'tekrar', ad: 'Tekrar', katman: 'motor', dal: 'motorlar', yol: '#/motor/tekrar', ikon: 'dongu', durum: 'yeni', aciklama: 'Aralıklı tekrar kartları' },
    { id: 'soru', ad: 'Soru', katman: 'motor', dal: 'motorlar', yol: '#/motor/soru', ikon: 'soru', durum: 'yeni', aciklama: 'Deneme ve soru çözme' },
    { id: 'kayit', ad: 'Kayıt', katman: 'motor', dal: 'motorlar', yol: '#/motor/kayit', ikon: 'liste', durum: 'yeni', aciklama: 'Ölçülen her şeyin kaydı' },
    { id: 'plan', ad: 'Plan', katman: 'motor', dal: 'motorlar', yol: '#/motor/plan', ikon: 'takvim', durum: 'yeni', aciklama: 'Günün ve haftanın planı' },
    { id: 'not', ad: 'Not', katman: 'motor', dal: 'motorlar', yol: '#/motor/not', ikon: 'not', halka: 4, durum: 'yeni', aciklama: 'Her yerden açılan tek defter' },
    { id: 'arama', ad: 'Arama', katman: 'motor', dal: 'motorlar', yol: '#/motor/arama', ikon: 'buyutec', durum: 'plan', aciklama: 'Her şeyde arama' },
    // King
    { id: 'king', ad: 'King', katman: 'king', dal: 'king', yol: '#/king', ikon: 'tac', halka: 5, durum: 'plan', aciklama: 'Düşünce ortağı' }
  ];

  var DALLAR = [
    { id: 'ana', ad: 'Ana sayfa' }, { id: 'ogren', ad: 'Öğren' }, { id: 'saglik', ad: 'Sağlık' },
    { id: 'motorlar', ad: 'Araçlar' }, { id: 'king', ad: 'King' }, { id: 'ayarlar', ad: 'Ayarlar' }
  ];
  // dal sayfası: o dalın çocuklarını listeleyen yer (halkadan bir adım, çocuğuna iki adım)
  var DAL_SAYFASI = { ana: 'harita', ogren: 'ogren', saglik: 'saglik', motorlar: 'motorlar', king: 'king', ayarlar: 'ayarlar' };

  function halka(liste) {
    return (liste || YERLER).filter(function (y) { return y.halka; }).sort(function (a, b) { return a.halka - b.halka; });
  }
  function bul(id, liste) { return (liste || YERLER).filter(function (y) { return y.id === id; })[0] || null; }
  function dalinYerleri(dal, liste) {
    return (liste || YERLER).filter(function (y) { return y.dal === dal && DAL_SAYFASI[dal] !== y.id; });
  }

  /* Halkadan kaç adım: halkadaysa 1; dal sayfası ya da sistem haritası halkadaysa 2 (halka → sayfa → yer). */
  function halkaAdimi(id, liste) {
    liste = liste || YERLER;
    var y = bul(id, liste);
    if (!y) return Infinity;
    var h = halka(liste).map(function (x) { return x.id; });
    if (h.indexOf(id) >= 0) return 1;
    if (h.indexOf(DAL_SAYFASI[y.dal]) >= 0 || h.indexOf('harita') >= 0) return 2;
    return Infinity;
  }

  /* Kayıt denetimi: hata listesi döner (boş = geçerli). */
  var KATMANLAR = ['kabuk', 'alan', 'motor', 'king'], DURUMLAR = ['yeni', 'pilot', 'eski', 'plan'];
  function denetle(liste) {
    liste = liste || YERLER;
    var h = [], gor = {}, yol = {};
    liste.forEach(function (y, i) {
      var ad = y.id || ('#' + i);
      if (!y.id || !/^[a-z]+$/.test(y.id)) h.push(ad + ': id küçük harf olmalı');
      if (gor[y.id]) h.push(ad + ': id tekrar ediyor'); gor[y.id] = 1;
      if (!y.ad) h.push(ad + ': ad yok');
      if (KATMANLAR.indexOf(y.katman) < 0) h.push(ad + ': katman geçersiz');
      if (!DAL_SAYFASI[y.dal]) h.push(ad + ': dal geçersiz');
      if (!/^#\//.test(y.yol || '')) h.push(ad + ': yol #/ ile başlamalı');
      if (yol[y.yol]) h.push(ad + ': yol tekrar ediyor'); yol[y.yol] = 1;
      if (DURUMLAR.indexOf(y.durum) < 0) h.push(ad + ': durum geçersiz');
      if (y.durum === 'eski' && !y.eski) h.push(ad + ': eski yerin bağlantısı yok');
      if (y.katman === 'alan' && !y.alan) h.push(ad + ': alan adı yok');
    });
    var hs = halka(liste);
    if (hs.length < 3 || hs.length > 6) h.push('halka 3 ile 6 yer arasında olmalı');
    liste.forEach(function (y) { if (halkaAdimi(y.id, liste) > 2) h.push(y.id + ': halkadan iki adımda ulaşılmıyor'); });
    return h;
  }

  var Harita = { YERLER: YERLER, DALLAR: DALLAR, DAL_SAYFASI: DAL_SAYFASI, halka: halka, bul: bul,
    dalinYerleri: dalinYerleri, halkaAdimi: halkaAdimi, denetle: denetle };
  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Kabuk = kok.LIFEOS.Kabuk || {};
  kok.LIFEOS.Kabuk.Harita = Harita;
  if (typeof module !== 'undefined' && module.exports) module.exports = Harita;
})(typeof window !== 'undefined' ? window : globalThis);
