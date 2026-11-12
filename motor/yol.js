/* LIFEOS.Motor.Yol — ogrenme yolu motoru. Sifir bagimlilik, saf fonksiyonlar (zaman disaridan gelir).
 * Veri bicimi: alan/SEMA.md. Icerik once `python alan/denetle.py` ile denetlenir; yukle() yalniz ucuz
 * yapisal denetim yapar ve bozuk veride hata firlatir.
 * Kayit (ogrenenin durumu) duz JSON'dur; her yazan fonksiyon yeni kayit dondurur, eskisine dokunmaz:
 *   { dersler: {id: {okundu}}, cevaplar: {id: [{cevap, dogru, zaman}]},
 *     kapilar: {sahipId: [{zaman, dogruSayisi, toplam, oran, esik, gecti, taslak}]}, asamalar: {id: {gecti}} }
 * Kural (AGENTS 0.1): asama/unite yalniz bilgi olcen kapi esigi tutunca gecer; okumak ve alistirma
 * cozmek (hacim) tek basina hicbir seyi gecirmez. Taslak icerik tekrara girmez.
 */
(function (kok) {
  'use strict';

  var ETIKET = { OLCULDU: 'ölçüldü', TAHMIN: 'tahmin', HESAPLANDI: 'hesaplandı', VERI_YOK: 'veri yok' };

  function hata(m) { throw new Error('Yol: ' + m); }
  function zamanDenetle(z) { if (typeof z !== 'number' || !isFinite(z)) hata('zaman sayı olmalı (ms)'); }
  function kopya(k) { return JSON.parse(JSON.stringify(k)); }
  function onayliMi(o) { return !!o && o.durum === 'onayli'; }
  function etiket(o) { return onayliMi(o) ? 'onayli' : 'taslak'; }

  function bosKayit() { return { dersler: {}, cevaplar: {}, kapilar: {}, asamalar: {} }; }

  // Asama verisini dizinler. Donen nesne salt okunur kabul edilir.
  function yukle(veri) {
    if (!veri || typeof veri !== 'object') hata('aşama verisi yok');
    if (!veri.id || !Array.isArray(veri.uniteler) || !veri.uniteler.length) hata('aşama kimliği ya da ünite listesi eksik');
    var y = { veri: veri, id: veri.id, oge: {}, tur: {}, ust: {} };
    function ekle(o, tur, ust) {
      if (!o || !o.id) hata(tur + ' kimliksiz');
      if (y.oge[o.id]) hata('yinelenen kimlik: ' + o.id);
      y.oge[o.id] = o; y.tur[o.id] = tur; y.ust[o.id] = ust;
    }
    function kapiEkle(k, sahip) {
      if (!k || !Array.isArray(k.sorular) || !k.sorular.length) hata(sahip + ' kapısı soru içermiyor');
      k.sorular.forEach(function (s) {
        if (s.tur !== 'secmeli' || !s.dogru) hata('kapı sorusu puanlanamıyor: ' + s.id);
        ekle(s, 'kapiSorusu', sahip);
      });
    }
    ekle(veri, 'asama', null);
    kapiEkle(veri.kapi, veri.id);
    veri.uniteler.forEach(function (u) {
      ekle(u, 'unite', veri.id);
      kapiEkle(u.kapi, u.id);
      (u.dersler || []).forEach(function (d) {
        ekle(d, 'ders', u.id);
        (d.alistirmalar || []).forEach(function (a) { ekle(a, 'alistirma', d.id); });
      });
    });
    Object.keys(y.oge).forEach(function (id) {
      if (y.tur[id] === 'asama') return; // asama onkosulu baska dosyadaki asamalardir
      (y.oge[id].onKosul || []).forEach(function (x) { if (!y.oge[x]) hata('bilinmeyen önkoşul: ' + id + ' → ' + x); });
    });
    return y;
  }

  function bul(y, id, tur) {
    if (!y.oge[id] || (tur && y.tur[id] !== tur)) hata('bilinmeyen ' + (tur || 'öğe') + ': ' + id);
    return y.oge[id];
  }

  function kapiGectiMi(kayit, id) {
    return (kayit.kapilar[id] || []).some(function (d) { return d.gecti; });
  }

  function asamaGectiMi(y, kayit, id) { return !!(kayit.asamalar[id] && kayit.asamalar[id].gecti != null); }

  // Bir onkosulun karsilanmasi: asama/unite icin kapi, ders icin okuma, alistirma icin dogru cevap.
  function karsilandi(y, kayit, id) {
    var t = y.tur[id];
    if (t === 'unite') return kapiGectiMi(kayit, id);
    if (t === 'ders') return !!kayit.dersler[id];
    if (t === 'alistirma') return (kayit.cevaplar[id] || []).some(function (c) { return c.dogru === true; });
    return asamaGectiMi(y, kayit, id); // yuklu olmayan asama da kayittan okunur
  }

  function hepsi(y, kayit, liste) {
    return (liste || []).every(function (x) { return karsilandi(y, kayit, x); });
  }

  function acikMi(y, kayit, id) {
    var t = y.tur[id], o = bul(y, id);
    if (t === 'asama') return hepsi(y, kayit, o.onKosul);
    if (t === 'unite') return acikMi(y, kayit, y.ust[id]) && hepsi(y, kayit, o.onKosul);
    if (t === 'ders') return acikMi(y, kayit, y.ust[id]) && hepsi(y, kayit, o.onKosul);
    return acikMi(y, kayit, y.ust[id]);
  }

  function uniteGectiMi(y, kayit, id) { bul(y, id, 'unite'); return kapiGectiMi(kayit, id); }

  function dersOku(y, kayit, dersId, zaman) {
    zamanDenetle(zaman);
    bul(y, dersId, 'ders');
    if (!acikMi(y, kayit, dersId)) hata('ders kilitli: ' + dersId);
    var k = kopya(kayit);
    if (!k.dersler[dersId]) k.dersler[dersId] = { okundu: zaman };
    return k;
  }

  // Ders alistirmasi. Kapi sorulari buradan cevaplanmaz (kapiDene). acik alistirma puanlanmaz: dogru null.
  function cevapla(y, kayit, id, cevap, zaman) {
    zamanDenetle(zaman);
    var a = bul(y, id, 'alistirma');
    if (!acikMi(y, kayit, id)) hata('alıştırma kilitli: ' + id);
    var dogru = a.tur === 'secmeli' ? cevap === a.dogru : null;
    var k = kopya(kayit);
    (k.cevaplar[id] = k.cevaplar[id] || []).push({ cevap: cevap, dogru: dogru, zaman: zaman });
    return { kayit: k, dogru: dogru };
  }

  function esikBul(kapi, ayar) {
    var e = ayar && ayar.esik != null ? ayar.esik : kapi.esik;
    if (typeof e !== 'number' || !(e > 0 && e <= 1)) hata('eşik 0 ile 1 arasında olmalı: ' + e);
    return e;
  }

  // Ustalik kapisi. sahipId: unite ya da asama. cevaplar: {soruId: 'A'}; bos birakilan yanlis sayilir.
  // Asama kapisi ancak butun uniteler gecildikten sonra acilir.
  function kapiDene(y, kayit, sahipId, cevaplar, zaman, ayar) {
    zamanDenetle(zaman);
    var t = y.tur[sahipId];
    if (t !== 'unite' && t !== 'asama') hata('kapı sahibi ünite ya da aşama olmalı: ' + sahipId);
    if (!acikMi(y, kayit, sahipId)) hata('kilitli: ' + sahipId);
    if (t === 'asama' && !y.veri.uniteler.every(function (u) { return kapiGectiMi(kayit, u.id); })) {
      hata('aşama kapısı için önce bütün ünitelerin kapısı geçilmeli');
    }
    var kapi = y.oge[sahipId].kapi, esik = esikBul(kapi, ayar);
    cevaplar = cevaplar || {};
    var dogruSayisi = kapi.sorular.filter(function (s) { return cevaplar[s.id] === s.dogru; }).length;
    var toplam = kapi.sorular.length, oran = dogruSayisi / toplam;
    var sonuc = {
      zaman: zaman, dogruSayisi: dogruSayisi, toplam: toplam, oran: oran, esik: esik,
      gecti: oran >= esik - 1e-9, // 3/4 = 0.75 gibi sinirda kayan nokta payi
      taslak: !kapi.sorular.every(onayliMi)
    };
    var k = kopya(kayit);
    (k.kapilar[sahipId] = k.kapilar[sahipId] || []).push(sonuc);
    if (t === 'asama' && sonuc.gecti && !k.asamalar[sahipId]) k.asamalar[sahipId] = { gecti: zaman };
    return { kayit: k, sonuc: sonuc };
  }

  // Tekrar kartina donusebilecek ogeler: onayli ders icindeki onayli, puanlanan ve en az bir kez
  // cevaplanmis alistirmalar. Taslak hicbir zaman; kapi sorulari olcum icin saklanir, girmez.
  function tekrarAdaylari(y, kayit) {
    var out = [];
    Object.keys(y.oge).forEach(function (id) {
      if (y.tur[id] !== 'alistirma') return;
      var a = y.oge[id], ders = y.oge[y.ust[id]];
      if (a.tur !== 'secmeli' || !onayliMi(a) || !onayliMi(ders) || !(kayit.cevaplar[id] || []).length) return;
      out.push({ id: id, ders: ders.id, unite: y.ust[ders.id], icerik: 'onayli' }); // icerik: Tekrar kartinin alani
    });
    return out;
  }

  function sayi(deger, etk, ek) {
    var o = { deger: deger, etiket: etk };
    for (var x in ek || {}) o[x] = ek[x];
    return o;
  }

  function kapiOzeti(kayit, id) {
    var d = kayit.kapilar[id] || [];
    if (!d.length) return { gecti: false, deneme: 0, son: sayi(null, ETIKET.VERI_YOK) };
    var son = d[d.length - 1];
    return {
      gecti: d.some(function (x) { return x.gecti; }), deneme: d.length,
      son: sayi(son.oran, ETIKET.OLCULDU, { dogruSayisi: son.dogruSayisi, toplam: son.toplam, esik: son.esik }),
      taslak: d.some(function (x) { return x.gecti && x.taslak; })
    };
  }

  // Butun durum: neyin acik oldugu, neyin gecildigi ve etiketli ilerleme sayilari.
  function durum(y, kayit) {
    var dersSay = 0, okunan = 0, cevapli = 0, dogru = 0, gecilen = 0;
    var uniteler = y.veri.uniteler.map(function (u) {
      var kp = kapiOzeti(kayit, u.id);
      if (kp.gecti) gecilen++;
      return {
        id: u.id, ad: u.ad, acik: acikMi(y, kayit, u.id), gecti: kp.gecti, kapi: kp,
        dersler: u.dersler.map(function (d) {
          dersSay++;
          if (kayit.dersler[d.id]) okunan++;
          d.alistirmalar.forEach(function (a) {
            if (a.tur !== 'secmeli' || !(kayit.cevaplar[a.id] || []).length) return;
            var c = kayit.cevaplar[a.id];
            cevapli++;
            if (c[c.length - 1].dogru) dogru++;
          });
          return { id: d.id, ad: d.ad, acik: acikMi(y, kayit, d.id), okundu: !!kayit.dersler[d.id], etiket: etiket(d) };
        })
      };
    });
    var ak = kapiOzeti(kayit, y.id), adim = y.veri.uniteler.length + 1;
    return {
      asama: { id: y.id, ad: y.veri.ad, acik: acikMi(y, kayit, y.id), gecti: asamaGectiMi(y, kayit, y.id), kapi: ak },
      uniteler: uniteler,
      ilerleme: {
        okunanDers: sayi(okunan, ETIKET.OLCULDU, { toplam: dersSay }),
        gecilenUnite: sayi(gecilen, ETIKET.HESAPLANDI, { toplam: y.veri.uniteler.length }),
        // asama ilerlemesi yalniz gecilen kapilardan hesaplanir; okuma ve alistirma sayilmaz
        asama: sayi((gecilen + (asamaGectiMi(y, kayit, y.id) ? 1 : 0)) / adim, ETIKET.HESAPLANDI),
        alistirmaDogruluk: cevapli ? sayi(dogru / cevapli, ETIKET.HESAPLANDI, { cevapli: cevapli })
                                   : sayi(null, ETIKET.VERI_YOK)
      }
    };
  }

  var Yol = {
    ETIKET: ETIKET, yukle: yukle, bosKayit: bosKayit, acikMi: acikMi, uniteGectiMi: uniteGectiMi,
    asamaGectiMi: function (y, kayit) { return asamaGectiMi(y, kayit, y.id); },
    dersOku: dersOku, cevapla: cevapla, kapiDene: kapiDene, tekrarAdaylari: tekrarAdaylari,
    durum: durum, etiket: etiket
  };

  kok.LIFEOS = kok.LIFEOS || {};
  kok.LIFEOS.Motor = kok.LIFEOS.Motor || {};
  kok.LIFEOS.Motor.Yol = Yol;
  if (typeof module !== 'undefined' && module.exports) module.exports = Yol;
})(typeof window !== 'undefined' ? window : globalThis);
