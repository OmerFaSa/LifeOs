/* LIFEOS.Kalite.Kullanim — kullanım sayacı (plan A2 «Kullanım sayacıyla silme kararı», sadeleşme A9).
 * Hangi ekranın ve aracın kaç kez açıldığını YALNIZ BU BİLGİSAYARDA sayar: tarayıcı deposuna (localStorage)
 * gün gün yazar, hiçbir yere göndermez (bu dosyada ağ çağrısı yoktur; kalite/kullanim.test.js bunu da sınar).
 * Kimlik yalnız haritadaki yer kimliğidir (küçük harf, rakam, tire); serbest metin sayılmaz, kişisel veri girmez.
 * Depo yoksa ya da yazılamıyorsa (gizli pencere, dolu depo) sessizce false döner: kabuk bozulmaz.
 *
 *   Kullanim.say(localStorage, 'ekran', 'felsefe', Date.now())   → true | false
 *   Kullanim.ozet(Kullanim.oku(localStorage), Date.now(), 28)    → { 'ekran/felsefe': 3, … }
 *
 * Saklanan değer (anahtar ANAHTAR): { surum: 1, gunler: { 'YYYY-MM-DD': { '<tur>/<kimlik>': sayı } } }.
 * kalite/olcum.py aynı değeri kalite/veri/yerel/kullanim.json'dan okur (biçim kalite/veri/README.md).
 * Sıfır bağımlılık; tarayıcıda window.LIFEOS.Kalite.Kullanim, Node'da module.exports. */
(function (kok) {
  'use strict';
  var ANAHTAR = 'lifeos.kullanim', TURLER = ['ekran', 'arac'], SAKLA_GUN = 56, KIMLIK = /^[a-z0-9][a-z0-9-]{0,39}$/;

  function gunAdi(ms) { // yerel gün (kullanıcının günü)
    var t = new Date(ms), iki = function (n) { return (n < 10 ? '0' : '') + n; };
    return t.getFullYear() + '-' + iki(t.getMonth() + 1) + '-' + iki(t.getDate());
  }
  function bos() { return { surum: 1, gunler: {} }; }
  function oku(depo) {
    try {
      var v = JSON.parse(depo.getItem(ANAHTAR) || 'null');
      return v && v.surum === 1 && v.gunler && typeof v.gunler === 'object' ? v : bos();
    } catch (e) { return bos(); }
  }
  // simdi'den geriye gun günlük pencerenin ilk günü (dahil)
  function pencereBasi(simdi, gun) { return gunAdi(simdi - (gun - 1) * 864e5); }

  function say(depo, tur, kimlik, simdi) {
    if (TURLER.indexOf(tur) < 0 || typeof kimlik !== 'string' || !KIMLIK.test(kimlik) || !isFinite(simdi)) return false;
    try {
      var v = oku(depo), g = gunAdi(simdi), bas = pencereBasi(simdi, SAKLA_GUN), k = tur + '/' + kimlik;
      Object.keys(v.gunler).forEach(function (d) { if (d < bas) delete v.gunler[d]; }); // depo büyümez
      var gun = v.gunler[g] = v.gunler[g] || {};
      gun[k] = (gun[k] || 0) + 1;
      depo.setItem(ANAHTAR, JSON.stringify(v));
      return true;
    } catch (e) { return false; }
  }

  function ozet(v, simdi, gun) {
    var bas = pencereBasi(simdi, gun || 28), son = gunAdi(simdi), t = {};
    Object.keys((v && v.gunler) || {}).forEach(function (d) {
      if (d < bas || d > son) return;
      Object.keys(v.gunler[d]).forEach(function (k) { t[k] = (t[k] || 0) + v.gunler[d][k]; });
    });
    return t;
  }

  var Kullanim = Object.freeze({ ANAHTAR: ANAHTAR, TURLER: TURLER, SAKLA_GUN: SAKLA_GUN, gunAdi: gunAdi, oku: oku, say: say, ozet: ozet });
  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Kalite = kok.LIFEOS.Kalite || {};
  kok.LIFEOS.Kalite.Kullanim = Kullanim;
  if (typeof module !== 'undefined' && module.exports) module.exports = Kullanim;
})(typeof window !== 'undefined' ? window : globalThis);
