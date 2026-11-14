/* LIFEOS.Kabuk.Onay — sahibin taslak içeriği dokunarak onayladığı yer (#/onay; belgeler/ekip/sadelesme/faz6-onay-ekrani.md).
 * Onay kaydı: lifeos.onay (kayıt, IndexedDB) = { "<alan>/<aşama no>/<öğe kimliği>": { durum: 'onayli', onaylayan: 'sahip', onayTarihi: 'YYYY-MM-DD' } }.
 * Bindirme (uygula): kabuk aşama dosyasını Yol.yukle'ye vermeden önce kayıttaki öğeleri dosyada `durum: "onayli"` yazılmış gibi yapar;
 * öğe = ders, alıştırma ya da kapı sorusu (alan/SEMA.md: durum taşıyanlar), kimlik birebir eşleşir. Dosyaya kalıcı yazım tools/onay_uygula.py ile.
 * Hiçbir şey kendiliğinden onaylanmaz: kayıt yalnız sahibin dokunuşuyla yazılır (SEMA «Onay»: model onayli yazmaz).
 * Sıfır bağımlılık; tarayıcıda window.LIFEOS.Kabuk.Onay, Node'da module.exports (yalnız saf kısım). kabuk.js'ten ÖNCE yüklenir. */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};
  var ANAHTAR = 'lifeos.onay', ONAYLAYAN = 'sahip';

  function anahtar(alan, n, id) { return alan + '/' + n + '/' + id; }
  function gecerli(g) {
    return !!g && g.durum === 'onayli' && typeof g.onaylayan === 'string' && g.onaylayan !== '' && typeof g.onayTarihi === 'string' && /^\d{4}-\d{2}-\d{2}/.test(g.onayTarihi);
  }
  function dizi(x) { return Array.isArray(x) ? x : []; }
  // aşamadaki durum taşıyan her öğe: aşama ve ünite kapı soruları, dersler, alıştırmalar
  function durumlular(veri, f) {
    function kapi(k) { dizi(k && k.sorular).forEach(f); }
    kapi(veri.kapi);
    dizi(veri.uniteler).forEach(function (u) { kapi(u && u.kapi); dizi(u && u.dersler).forEach(function (d) { f(d); dizi(d && d.alistirmalar).forEach(f); }); });
  }
  // Bindirme: girdiye dokunmaz; bu aşamaya ait geçerli onay yoksa aynı nesneyi döndürür.
  function uygula(veri, alan, n, onay) {
    if (!veri || typeof veri !== 'object' || !onay || typeof onay !== 'object') return veri;
    var onek = anahtar(alan, n, '');
    if (!Object.keys(onay).some(function (k) { return k.indexOf(onek) === 0 && gecerli(onay[k]); })) return veri;
    var v = JSON.parse(JSON.stringify(veri));
    durumlular(v, function (o) {
      var g = o && onay[onek + o.id];
      if (gecerli(g)) { o.durum = 'onayli'; o.onaylayan = g.onaylayan; o.onayTarihi = g.onayTarihi; }
    });
    return v;
  }
  // Onaylanacak kimlikler (y: Yol.yukle çıktısı). ders: kendisi + alıştırmaları; ünite: bütün dersleri + ünite kapısı;
  // kapi true: yalnız o ünitenin ya da aşamanın kapı soruları.
  function kimlikler(y, id, kapi) {
    var o = y.oge[id], t = y.tur[id];
    if (!o) return [];
    if (kapi) return t === 'unite' || t === 'asama' ? o.kapi.sorular.map(function (s) { return s.id; }) : [];
    if (t === 'ders') return [id].concat(dizi(o.alistirmalar).map(function (a) { return a.id; }));
    if (t === 'unite') return dizi(o.dersler).reduce(function (l, d) { return l.concat(kimlikler(y, d.id)); }, []).concat(kimlikler(y, id, true));
    return [];
  }
  function onayla(onay, alan, n, ids, tarih) {
    var m = Object.assign({}, onay);
    ids.forEach(function (id) { m[anahtar(alan, n, id)] = { durum: 'onayli', onaylayan: ONAYLAYAN, onayTarihi: tarih }; });
    return m;
  }
  function geriAl(onay, alan, n, ids) {
    var m = Object.assign({}, onay);
    ids.forEach(function (id) { delete m[anahtar(alan, n, id)]; });
    return m;
  }
  // ders sayısı (ölçüldü): ders kendi durumuna göre sayılır
  function sayim(veri) {
    var s = { taslak: 0, onayli: 0 };
    dizi(veri && veri.uniteler).forEach(function (u) { dizi(u.dersler).forEach(function (d) { s[d.durum === 'onayli' ? 'onayli' : 'taslak']++; }); });
    return s;
  }
  function hepsiOnayli(y, ids) { return ids.length > 0 && ids.every(function (id) { return y.oge[id] && y.oge[id].durum === 'onayli'; }); }
  function iki(x) { return (x < 10 ? '0' : '') + x; }
  function tarihYaz(t) { return t.getFullYear() + '-' + iki(t.getMonth() + 1) + '-' + iki(t.getDate()); } // yerel gün (UTC değil)
  function oku(depo) { try { var v = JSON.parse(depo.getItem(ANAHTAR)); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch (e) { return {}; } }

  // Ölçüm etiketi: sistem/etiket.py `gecerli` kuralının aynısı (onay.test.js iki listeyi karşılaştırır). anlama → beş niyetten biri;
  // arama → o satırın aday numaralarından tekrarsız liste ([] = hiçbiri doğru değil) ya da «arama-degil».
  var NIYETLER = ['sohbet', 'kayit', 'ogren', 'arastir', 'yonet'], ARAMA_DEGIL = 'arama-degil';
  function etiketGecerli(set, satir, e) {
    if (set === 'anlama') return NIYETLER.indexOf(e) >= 0;
    if (set !== 'arama') return false;
    var nolar = dizi(satir && satir.adaylar).filter(function (a) { return a && typeof a === 'object'; }).map(function (a) { return a.no; });
    return e === ARAMA_DEGIL || (Array.isArray(e) && e.every(function (x, i) { return typeof x === 'string' && nolar.indexOf(x) >= 0 && e.indexOf(x) === i; }));
  }

  var Onay = { ANAHTAR: ANAHTAR, anahtar: anahtar, gecerli: gecerli, uygula: uygula, kimlikler: kimlikler, onayla: onayla, geriAl: geriAl,
    sayim: sayim, hepsiOnayli: hepsiOnayli, tarihYaz: tarihYaz, oku: oku, NIYETLER: NIYETLER, ARAMA_DEGIL: ARAMA_DEGIL, etiketGecerli: etiketGecerli };
  Kabuk.Onay = Onay;
  if (typeof module !== 'undefined' && module.exports) module.exports = Onay;
  if (typeof document === 'undefined') return;

  /* ---------------- tarayıcı ---------------- */
  var d = document, ic = function () { return Kabuk.ic; }, B = Kabuk.Bilesen;
  var soruluyor = null; // «Ünitenin hepsini onayla» onay bloğu açık olan ünite

  // Sahibin kendi yapması gereken, sistemin yapamadığı adımlar (düz Türkçe, durağan)
  var ADIMLAR = [
    ['Telefondan bilgisayara gönder', 'Telefonda LifeOS\'a gir ve «Bilgisayara gönder»e bas. Telefondaki kayıtlar bilgisayara geçer; bu yapılmadan tek kapı açılamaz.'],
    ['King\'i Claude\'da kullan', 'Claude\'u bir kez tamamen kapatıp yeniden aç. King ancak bundan sonra Claude\'un içinde görünür.'],
    ['Diski şifrele', 'Windows Ayarlar\'da «BitLocker» ya da «Cihaz şifreleme» diye ara ve aç. Bilgisayar kaybolursa kayıtların okunamaz.']
  ];

  function asamalar(I, alan) { return I.asamalar(alan) || []; }
  function bekleyenSayisi(I) {
    return I.tasinanlar().reduce(function (t, a) { return t + asamalar(I, a.id).reduce(function (s, y) { return s + sayim(y.veri).taslak; }, 0); }, 0);
  }
  function kirinti(I, href, ust, ad) {
    var k = I.kac;
    return '<a class="kirinti" href="' + href + '"><span aria-hidden="true">‹ </span>' + k(ust) + '</a><span class="kirinti__ayrac" aria-hidden="true">/</span><span>' + k(ad) + '</span>';
  }
  function durumPul(onayli) { return onayli ? { metin: 'onaylı', tur: 'altin' } : { metin: 'taslak', tur: 'kesik' }; }
  // Sahibin cevap anahtarı: doğru şık işaretli, şıklar kapalı; öğrenenin kaydına hiçbir şey yazılmaz (data-soru yok)
  function cevapli(a) {
    if (a.tur === 'secmeli') return B.soru({ soru: a.soru, secenekler: a.sec, dogru: a.dogru, kilitli: true, sonuc: dizi(a.cozum).length ? { baslik: 'Çözüm.', metin: a.cozum.join(' ') } : null });
    return B.soru({ soru: a.soru, govde: '<p class="soluk">Açık uçlu; puanlanmaz, öğrenen kendini ölçütlerle değerlendirir.</p>',
      sonuc: { baslik: 'Örnek cevap.', metin: a.dogru || '', maddeler: dizi(a.olcut) } });
  }
  // Onay durumu ve eylemleri (ders ya da kapı sayfasının altında)
  function durumHtml(I, y, ad, alan, n, ids, sonraki) {
    var m = oku(I.depo), bizde = ids.some(function (id) { return m[anahtar(alan, n, id)]; });
    if (hepsiOnayli(y, ids)) {
      var g = y.oge[ids[0]];
      return B.panel({ tur: 'basari', durum: true, id: 'onay-durum', govde: ['<p><b>Onaylandı.</b> ' + I.kac(g.onayTarihi || '') + ' · ' + I.kac(g.onaylayan || '') +
        (bizde ? '' : ' · içerik dosyasında') + '</p>', B.eylemler([sonraki, bizde ? { metin: 'Geri al', tur: 'sade', etiket: 'Geri al: ' + ad, veri: { 'onay-ac': 'geri-al' } } : null])] });
    }
    return B.eylemler([{ metin: 'Onayla', tur: 'ana', etiket: 'Onayla: ' + ad, veri: { 'onay-ac': 'onayla' } }, sonraki ? Object.assign({}, sonraki, { tur: 'sade' }) : null,
      bizde ? { metin: 'Geri al', tur: 'sade', veri: { 'onay-ac': 'geri-al' } } : null]);
  }

  /* ---- Ölçüm için etiketle (sistem/etiket.py API'si, yalnız bu bilgisayardan; rapor faz2-cila.md). Gerçek mesajlar yalnız `et`
   * değişkeninde durur: depoya, IndexedDB'ye, konsola ya da tarayıcı önbelleğine (no-store) yazılmaz. */
  var NIYET_AD = { sohbet: 'Sohbet: konuşmak, fikir paylaşmak; bir iş istemiyor', kayit: 'Kayıt: bir şeyi yazdırmak ya da saydırmak istiyor (su, uyku, harcama…)',
    ogren: 'Öğren: bir konuyu anlamak, ders almak istiyor', arastir: 'Araştır: bir bilgiyi bulmak, aramak istiyor',
    yonet: 'Yönet: plan, ayar ya da sayfa gibi bir şeyi açmak, değiştirmek istiyor' };
  var et = null; // { durum: yukleniyor | kapali | hazir, sayi, kuyruk, set, i, yazilan, hata, ileti, mesgul }
  function etApi(govde, set) {
    return fetch(govde ? '/api/kalite/etiket' : '/api/kalite/etiket/adaylar?set=' + set, govde
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde), cache: 'no-store' } : { cache: 'no-store' })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { durum: r.status, j: j || {} }; }); });
  }
  // dosyadan açılış, telefon (403), sunucu yok: hepsi aynı sakin satır
  function etKapat() { et = { durum: 'kapali' }; etCiz(); }
  function etYukle(odak) {
    Promise.all(['anlama', 'arama'].map(function (s) { return etApi(null, s); })).then(function (l) {
      if (l.some(function (x) { return x.durum !== 200 || !x.j.ok || !Array.isArray(x.j.satirlar); })) return etKapat();
      et = Object.assign(et || {}, { durum: 'hazir', set: null, sayi: { anlama: l[0].j.bekleyen, arama: l[1].j.bekleyen }, kuyruk: { anlama: l[0].j.satirlar, arama: l[1].j.satirlar } });
      etCiz(odak);
    }, etKapat);
  }
  function etHtml() {
    if (!et || et.durum === 'yukleniyor') return '<p class="soluk" aria-busy="true">Yükleniyor…</p>';
    if (et.durum === 'kapali') return B.uyari({ tur: 'bilgi', metin: 'Etiketleme yalnız bu bilgisayarda açılır.' });
    var hata = et.hata ? B.uyari({ tur: 'hata', metin: et.hata }) : '', a = et.sayi.anlama, r = et.sayi.arama;
    if (!et.set) return (et.ileti ? B.uyari({ tur: 'tamam', metin: et.ileti }) : '') +
      '<p class="soluk">Gerçek mesajlarına doğru cevabı sen verirsin; Anlama ve Arama ölçümü bu etiketlerden yapılır. Mesajlar bu bilgisayardan çıkmaz.</p>' +
      B.sayilar({ ad: 'Etiket bekleyen', ogeler: [{ ad: 'Anlama · bekleyen', deger: a, birim: 'mesaj', etiket: 'measured' }, { ad: 'Arama · bekleyen', deger: r, birim: 'soru', etiket: 'measured' }] }) +
      (a + r ? B.eylemler([{ metin: 'Anlama etiketle', tur: a ? 'ana' : 'ikincil', kapali: !a, veri: { 'onay-ac': 'etiket-bas', set: 'anlama' } },
        { metin: 'Arama etiketle', tur: a || !r ? 'ikincil' : 'ana', kapali: !r, veri: { 'onay-ac': 'etiket-bas', set: 'arama' } }])
        : B.bos({ baslik: 'Etiketlenecek mesaj yok.', metin: 'Yeni mesajlar ölçüm setine girince burada sayılır.' }));
    var s = et.set, x = et.kuyruk[s][et.i], ust = (s === 'anlama' ? 'Anlama' : 'Arama') + ' · ' + (et.i + 1) + ' / ' + et.kuyruk[s].length + ' · ' + et.sayi[s] + ' bekliyor · ';
    var son = B.eylemler([{ metin: 'Atla', tur: 'sade', veri: { 'onay-ac': 'etiket-atla' } }, { metin: 'Bitir', tur: 'sade', veri: { 'onay-ac': 'etiket-bitir' } }]);
    if (s === 'anlama') return B.soru({ soru: x.metin || '(boş mesaj)', ust: ust + 'bu mesaj ne istiyor?', secenekler: NIYETLER.map(function (n) { return NIYET_AD[n]; }),
      sikVeri: { 'onay-ac': 'etiket-niyet' }, veri: { 'etiket-soru': '' } }) + hata + son;
    var ad = {}; dizi(x.adaylar).forEach(function (c) { ad[c.no] = (c.baslik || 'Başlıksız') + (c.ozet ? ' — ' + c.ozet : ''); });
    var var_ = Object.keys(ad).length;
    return B.soru({ soru: x.metin || '(boş soru)', ust: ust + 'hangi sonuçlar bu soruyu cevaplıyor?', veri: { 'etiket-soru': '' }, govde: [
      var_ ? B.alan({ ad: 'Doğru olan sonuçlar', isim: 'etiket-aday', tur: 'coklu', secenekler: ad }) : '<p class="soluk">Bu soruya aday sonuç gelmedi.</p>', hata,
      B.eylemler([var_ ? { metin: 'Seçtiklerim doğru', tur: 'ana', veri: { 'onay-ac': 'etiket-secili' } } : null, { metin: 'Hiçbiri doğru değil', veri: { 'onay-ac': 'etiket-hicbiri' } },
        { metin: 'Bu bir arama sorusu değil', veri: { 'onay-ac': 'etiket-degil' } }])] }) + son;
  }
  function etCiz(odak) {
    var el = d.querySelector('[data-etiket-govde]'); if (!el) return;
    el.innerHTML = etHtml();
    var f = odak && el.querySelector(odak); if (f) f.focus();
  }
  function etBitir() { et.ileti = et.yazilan ? et.yazilan + ' etiket yazıldı.' : null; et.durum = 'yukleniyor'; etCiz(); etYukle('.b-uyari'); }
  function etSonraki() { if (++et.i < et.kuyruk[et.set].length) return etCiz('[data-etiket-soru]'); etBitir(); }
  function etEylem(ne, b) {
    if (!et || et.durum !== 'hazir' || et.mesgul) return;
    et.hata = null;
    if (ne === 'etiket-bas') { Object.assign(et, { set: b.getAttribute('data-set'), i: 0, yazilan: 0, ileti: null }); return etCiz('[data-etiket-soru]'); }
    if (ne === 'etiket-bitir') return etBitir();
    if (ne === 'etiket-atla') return etSonraki();
    var x = et.kuyruk[et.set][et.i], e;
    if (ne === 'etiket-niyet') e = NIYETLER['ABCDE'.indexOf(b.getAttribute('data-h'))];
    else if (ne === 'etiket-hicbiri') e = [];
    else if (ne === 'etiket-degil') e = ARAMA_DEGIL;
    else {
      e = [].map.call(d.querySelectorAll('[data-etiket-govde] input[name="etiket-aday"]:checked'), function (c) { return c.value; });
      if (!e.length) { et.hata = 'Bir sonuç seç ya da «Hiçbiri doğru değil»e bas.'; return etCiz('.b-uyari'); }
    }
    if (!etiketGecerli(et.set, x, e)) { et.hata = 'Bu etiket bu soruya uymuyor.'; return etCiz('.b-uyari'); }
    et.mesgul = true;
    etApi({ set: et.set, id: x.id, etiket: e }).then(function (r) {
      et.mesgul = false;
      if (r.durum === 200 && r.j.ok) { et.yazilan++; et.sayi[et.set]--; return etSonraki(); }
      if (r.durum !== 400) return etKapat();
      et.hata = 'Yazılamadı: ' + (r.j.mesaj || 'sunucu kabul etmedi') + '.'; etCiz('.b-uyari');
    }, etKapat);
  }

  function anaSayfa(I, yer) {
    var k = I.kac, toplam = { taslak: 0, onayli: 0 };
    var satirlar = I.tasinanlar().map(function (a) {
      var ys = asamalar(I, a.id), say = ys.map(function (y) { return sayim(y.veri); });
      say.forEach(function (s) { toplam.taslak += s.taslak; toplam.onayli += s.onayli; });
      var bek = say.reduce(function (t, s) { return t + s.taslak; }, 0);
      return { ad: a.ad, href: '#/onay/' + a.id, uzun: true, pul: bek ? { metin: bek + ' bekliyor' } : { metin: 'hepsi onaylı', tur: 'altin' },
        not: ys.length ? say.map(function (s, j) { return 'Aşama ' + (j + 1) + ': ' + s.taslak + ' taslak, ' + s.onayli + ' onaylı'; }).join(' · ') + ' · ölçüldü' : 'İçerik bu açılışta yüklenemedi.' };
    });
    var kayit = Object.keys(oku(I.depo)).length;
    if (!et || !et.set) setTimeout(etYukle, 0); // sayılar her açılışta tazelenir; süren etiketleme turu bozulmaz
    return I.ust(I.kirinti(yer)) + '<div class="govde" data-onay-sayfa="ana">' +
      B.baslik({ metin: 'Onaylar', alt: 'Taslak dersleri oku; doğruysa onayla. Sen onaylamadan hiçbir ders onaylanmaz.' }) +
      B.sayilar({ ad: 'Dersler', ogeler: [{ ad: 'Onay bekleyen', deger: toplam.taslak, birim: 'ders', etiket: 'measured' }, { ad: 'Onaylı', deger: toplam.onayli, birim: 'ders', etiket: 'measured' }] }) +
      B.bolum({ baslik: 'Alanlar', govde: B.liste({ ad: 'Alanlar', ogeler: satirlar }) }) +
      B.bolum({ baslik: 'Ölçüm için etiketle', veri: { etiket: '' }, govde: '<div data-etiket-govde>' + etHtml() + '</div>' }) +
      B.bolum({ baslik: 'Onayları sakla', govde: ['<p class="soluk">Onayların şimdilik bu cihazda durur. Dosyayı al ve bilgisayardaki LifeOS klasörüne ver; içerik dosyalarına oradan yazılır.</p>',
        B.eylemler([{ metin: 'Onayları dosya olarak al', veri: { 'onay-ac': 'disari' }, kapali: !kayit }, { yazi: kayit ? kayit + ' öğe onaylı (alıştırma ve kapı soruları dahil)' : 'Henüz onay yok.' }])] }) +
      B.bolum({ baslik: 'Senin adımın', govde: ['<p class="soluk">Bunları sistem yapamaz; yalnız sen yapabilirsin.</p>',
        B.liste({ ad: 'Senin adımın', ogeler: ADIMLAR.map(function (x) { return { ad: x[0], not: x[1], uzun: true }; }) })] }) + '</div>';
  }
  function alanSayfasi(I, a) {
    var ys = asamalar(I, a.id);
    return I.ust(kirinti(I, '#/onay', 'Onaylar', a.ad)) + '<div class="govde" data-onay-sayfa="alan">' + B.baslik({ metin: a.ad, alt: 'Bir üniteyi aç, derslerini oku ve onayla.' }) +
      (ys.length ? ys.map(function (y, j) {
        var n = j + 1, kok_ = '#/onay/' + a.id + '/' + n + '/';
        return B.bolum({ baslik: 'Aşama ' + n + ' · ' + y.veri.ad, govde: B.liste({ ad: 'Aşama ' + n + ' üniteleri', ogeler: y.veri.uniteler.map(function (u) {
          var s = sayim({ uniteler: [u] }), tamam = hepsiOnayli(y, kimlikler(y, u.id));
          return { ad: u.ad, href: kok_ + u.id, not: s.onayli + '/' + (s.taslak + s.onayli) + ' ders onaylı · ölçüldü', pul: durumPul(tamam) };
        }).concat([{ ad: 'Aşama kapısı', href: kok_ + y.id + '/kapi', not: y.veri.kapi.sorular.length + ' soru', pul: durumPul(hepsiOnayli(y, kimlikler(y, y.id, true))) }]) }) });
      }).join('') : B.bos({ baslik: 'Bu alanın içeriği bu açılışta yüklenemedi.' })) + '</div>';
  }
  function uniteSayfasi(I, a, y, n, u) {
    var kok_ = '#/onay/' + a.id + '/' + n + '/', ids = kimlikler(y, u.id), m = oku(I.depo);
    var bekleyen = u.dersler.filter(function (x) { return !hepsiOnayli(y, kimlikler(y, x.id)); }).length, kapiSay = u.kapi.sorular.length;
    var bizde = ids.some(function (id) { return m[anahtar(a.id, n, id)]; }), eylem;
    if (soruluyor === u.id && bekleyen) {
      eylem = B.panel({ tur: 'guclu', id: 'onay-sor', durum: true, govde: ['<p><b>' + bekleyen + ' ders onaylansın mı?</b></p>',
        '<p>Alıştırmaları ve ünite kapısının ' + kapiSay + ' sorusu da onaylanır. Okumadığın ders de onaylanmış sayılır; sonra tek tek geri alabilirsin.</p>',
        B.eylemler([{ metin: bekleyen + ' dersi onayla', tur: 'ana', veri: { 'onay-ac': 'onayla' } }, { metin: 'Vazgeç', tur: 'sade', veri: { 'onay-ac': 'vazgec' } }])] });
    } else {
      eylem = B.eylemler([bekleyen ? { metin: 'Ünitenin hepsini onayla', veri: { 'onay-ac': 'sor' } } : null,
        bizde ? { metin: 'Ünitenin onayını geri al', tur: 'sade', veri: { 'onay-ac': 'geri-al' } } : null]);
    }
    return I.ust(kirinti(I, '#/onay/' + a.id, a.ad, u.ad)) + '<div class="govde" data-onay-sayfa="unite">' + B.baslik({ metin: u.ad, alt: 'Aşama ' + n + ' · ' + y.veri.ad }) +
      B.liste({ ad: u.ad + ' dersleri', ogeler: u.dersler.map(function (x) {
        return { ad: x.ad, not: x.ozet, href: kok_ + x.id, pul: durumPul(hepsiOnayli(y, kimlikler(y, x.id))) };
      }).concat([{ ad: 'Ünite kapısı', not: kapiSay + ' soru; öğrenen bunları derste görmez', href: kok_ + u.id + '/kapi', pul: durumPul(hepsiOnayli(y, kimlikler(y, u.id, true))) }]) }) +
      eylem + '</div>';
  }
  function dersSayfasi(I, a, y, n, x) {
    var u = y.oge[y.ust[x.id]], kok_ = '#/onay/' + a.id + '/' + n + '/', i = u.dersler.indexOf(x), s = u.dersler[i + 1];
    var sonraki = s ? { metin: 'Sonraki ders', tur: 'ana', href: kok_ + s.id } : { metin: 'Ünite kapısı', tur: 'ana', href: kok_ + u.id + '/kapi' };
    return I.ust(kirinti(I, kok_ + u.id, u.ad, x.ad)) + '<article class="govde ders" data-onay-sayfa="ders">' + I.dersMetni(y, x, true) +
      B.bolum({ baslik: 'Alıştırmalar · cevap anahtarı', govde: dizi(x.alistirmalar).length ? x.alistirmalar.map(cevapli) : '<p class="soluk">Bu dersin alıştırması yok.</p>' }) +
      '<p class="soluk">Onay dersi alıştırmalarıyla birlikte kapsar.</p>' + durumHtml(I, y, x.ad, a.id, n, kimlikler(y, x.id), sonraki) + '</article>';
  }
  function kapiSayfasi(I, a, y, n, o) {
    var asama = y.tur[o.id] === 'asama', kok_ = '#/onay/' + a.id + '/' + n + '/', ad = asama ? 'Aşama kapısı' : o.ad + ' · kapı';
    var geri = asama ? { metin: 'Alana dön', tur: 'ana', href: '#/onay/' + a.id } : { metin: 'Üniteye dön', tur: 'ana', href: kok_ + o.id };
    return I.ust(asama ? kirinti(I, '#/onay/' + a.id, a.ad, ad) : kirinti(I, kok_ + o.id, o.ad, 'Ünite kapısı')) + '<div class="govde" data-onay-sayfa="kapi">' +
      B.baslik({ metin: ad, alt: o.kapi.sorular.length + ' soru. Öğrenen bunları derste görmez; kapıda doğru cevap gösterilmez.' }) +
      o.kapi.sorular.map(cevapli).join('') + durumHtml(I, y, ad, a.id, n, kimlikler(y, o.id, true), geri) + '</div>';
  }

  // «#/onay», «#/onay/<alan>», «#/onay/<alan>/<n>/<ünite|ders>», «#/onay/<alan>/<n>/<ünite|aşama>/kapi»
  function konum() {
    var p = (/^#\/onay\/([\w./-]+)$/.exec(location.hash.split('?')[0]) || [])[1];
    p = p ? p.split('/') : [];
    return { alan: p[0], n: +p[1], id: p[2], kapi: p[3] === 'kapi' };
  }
  function sayfa(yer) {
    var I = ic(), eksik = I.tasinanlar().filter(function (a) { return !I.al(a.id); });
    if (eksik.length) {
      Promise.all(eksik.map(function (a) { return I.alanYukle(a.id); })).then(function () { if (d.querySelector('[data-onay-sayfa="yukleniyor"]')) I.rota(); });
      return I.ust(I.kirinti(yer)) + '<div class="govde" data-onay-sayfa="yukleniyor"><p class="soluk" aria-busy="true">Yükleniyor…</p></div>';
    }
    var k = konum(), a = k.alan && I.tasinanlar().filter(function (x) { return x.id === k.alan; })[0];
    if (!k.alan) return anaSayfa(I, yer);
    var yok = function (m) { return I.ust(kirinti(I, '#/onay', 'Onaylar', 'Bulunamadı')) + '<div class="govde">' + B.bos({ baslik: m, eylem: { metin: 'Onaylar', tur: 'ana', href: '#/onay' } }) + '</div>'; };
    if (!a) return yok('Böyle bir alan yok.');
    if (!k.id) return alanSayfasi(I, a);
    var y = asamalar(I, a.id)[k.n - 1], o = y && y.oge[k.id], t = o && y.tur[k.id];
    if (k.kapi && (t === 'unite' || t === 'asama')) return kapiSayfasi(I, a, y, k.n, o);
    if (!k.kapi && t === 'unite') return uniteSayfasi(I, a, y, k.n, o);
    if (!k.kapi && t === 'ders') return dersSayfasi(I, a, y, k.n, o);
    return yok('Böyle bir ders ya da ünite yok.');
  }
  function yaz(I, alan, m) {
    if (Object.keys(m).length) I.depo.setItem(ANAHTAR, JSON.stringify(m)); else I.depo.removeItem(ANAHTAR);
    I.onayDegisti(alan); // içerik yeni bindirmeyle yeniden kurulur: onaylı öğe taslak etiketini kaybeder, tekrara girebilir
  }
  function disari() {
    var m = oku(ic().depo), a = d.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(m, null, 1) + '\n'], { type: 'application/json' }));
    a.download = 'lifeos-onay-' + tarihYaz(new Date()) + '.json';
    d.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  // Bugün: «Onay bekleyen N ders» tek satırı, yalnız N > 0 iken. Sayı bütün alanların içeriğinden sayılır; yüklenmemiş alan
  // varsa önce boş yer tutucu çizilir, içerik gelince yalnız o satır yerine konur (sayfa yeniden çizilmez).
  function bugunSatiri(I) {
    var n = bekleyenSayisi(I);
    return n ? B.uyari({ tur: 'bilgi', veri: { 'onay-bekleyen': String(n) }, metin: 'Onay bekleyen ' + n + ' ders.', eylem: { metin: 'Onaylar', tur: 'sade', href: '#/onay' } }) : '';
  }
  Kabuk.onayBugun = function () {
    var I = ic(); if (!I) return '';
    var eksik = I.tasinanlar().filter(function (a) { return !I.al(a.id); });
    if (!eksik.length) return bugunSatiri(I);
    Promise.all(eksik.map(function (a) { return I.alanYukle(a.id); })).then(function () {
      var el = d.querySelector('[data-onay-yer]'); if (el) el.outerHTML = bugunSatiri(I);
    });
    return '<div data-onay-yer hidden></div>';
  };
  Kabuk.ek = Kabuk.ek || {};
  Kabuk.ek.onay = sayfa;

  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-onay-ac]');
    if (!b || b.getAttribute('aria-disabled') === 'true') return;
    var I = ic(), ne = b.getAttribute('data-onay-ac'), k = konum(), y = k.alan && asamalar(I, k.alan)[k.n - 1];
    if (ne === 'disari') return disari();
    if (ne.indexOf('etiket-') === 0) return etEylem(ne, b);
    if (!y || !y.oge[k.id]) return;
    var odak = null;
    if (ne === 'sor') { soruluyor = k.id; odak = '#onay-sor'; }
    else if (ne === 'vazgec') soruluyor = null;
    else {
      var ids = kimlikler(y, k.id, k.kapi), m = oku(I.depo);
      yaz(I, k.alan, ne === 'onayla' ? onayla(m, k.alan, k.n, ids, tarihYaz(new Date())) : geriAl(m, k.alan, k.n, ids));
      soruluyor = null; odak = ne === 'onayla' && y.tur[k.id] !== 'unite' ? '#onay-durum' : null;
    }
    I.rota();
    var el = odak && d.querySelector(odak); if (el) el.focus({ preventScroll: true });
  });
})(typeof window !== 'undefined' ? window : globalThis);
