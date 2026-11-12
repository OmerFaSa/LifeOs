// node motor/yol.test.js — ✓/✕ satirlari, cikis 0/1. Bagimlilik yok.
'use strict';
var path = require('path');
var fs = require('fs');
var Yol = require('./yol.js');

var hatali = 0, sayac = 0;
function t(ad, fn) {
  sayac++;
  try { fn(); console.log('✓ ' + ad); } catch (e) { hatali++; console.log('✕ ' + ad + ' — ' + e.message); }
}
function esit(a, b, m) { if (a !== b) throw new Error((m || '') + ' beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a)); }
function dogru(x, m) { if (!x) throw new Error(m || 'yanlış'); }
function atar(fn, parca) {
  try { fn(); } catch (e) { if (parca && e.message.indexOf(parca) < 0) throw new Error('beklenmeyen hata: ' + e.message); return; }
  throw new Error('hata bekleniyordu');
}

// Kucuk sabit asama: 2 unite, unite 2 unite 1'e bagli.
function soru(id, d, durum) { return { id: id, tur: 'secmeli', soru: id, sec: ['x', 'y', 'z'], dogru: d, durum: durum || 'taslak', yazan: 'model', kaynak: ['k1'] }; }
function ornek(durum) {
  durum = durum || 'taslak';
  return {
    sema: 1, alan: 't', id: 't.1', sira: 1, ad: 'A', hedef: 'h', onKosul: [], kaynaklar: [{ id: 'k1' }],
    kapi: { esik: 0.8, sorular: [soru('t.1.k1', 'A', durum), soru('t.1.k2', 'B', durum), soru('t.1.k3', 'C', durum)] },
    uniteler: [
      { id: 't.1.1', ad: 'U1', onKosul: [], kapi: { esik: 0.75, sorular: [soru('t.1.1.k1', 'A', durum), soru('t.1.1.k2', 'A', durum), soru('t.1.1.k3', 'A', durum), soru('t.1.1.k4', 'A', durum)] },
        dersler: [
          { id: 't.1.1.1', ad: 'D1', onKosul: [], durum: durum, yazan: 'model', kaynak: ['k1'], ozet: 'o', metin: ['m'],
            alistirmalar: [soru('t.1.1.1.a1', 'B', durum), { id: 't.1.1.1.a2', tur: 'acik', soru: 's', dogru: 'örnek', olcut: ['o'], durum: durum, yazan: 'model', kaynak: ['k1'] }] },
          { id: 't.1.1.2', ad: 'D2', onKosul: ['t.1.1.1'], durum: durum, yazan: 'model', kaynak: ['k1'], ozet: 'o', metin: ['m'], alistirmalar: [] }
        ] },
      { id: 't.1.2', ad: 'U2', onKosul: ['t.1.1'], kapi: { esik: 0.75, sorular: [soru('t.1.2.k1', 'C', durum), soru('t.1.2.k2', 'C', durum), soru('t.1.2.k3', 'C', durum)] },
        dersler: [{ id: 't.1.2.1', ad: 'D3', onKosul: [], durum: durum, yazan: 'model', kaynak: ['k1'], ozet: 'o', metin: ['m'], alistirmalar: [soru('t.1.2.1.a1', 'A', durum)] }] }
    ]
  };
}
function hepsiDogru(y, sahip) {
  var c = {};
  y.oge[sahip].kapi.sorular.forEach(function (s) { c[s.id] = s.dogru; });
  return c;
}
var Z = Date.UTC(2026, 10, 13);

t('yükle: geçerli aşama dizinlenir', function () {
  var y = Yol.yukle(ornek());
  esit(y.tur['t.1.2'], 'unite'); esit(y.tur['t.1.1.1.a1'], 'alistirma'); esit(y.tur['t.1.k1'], 'kapiSorusu');
});

t('yükle: yinelenen kimlik ve bilinmeyen önkoşul reddedilir', function () {
  var v = ornek(); v.uniteler[1].dersler[0].id = 't.1.1.1';
  atar(function () { Yol.yukle(v); }, 'yinelenen');
  var w = ornek(); w.uniteler[1].onKosul = ['t.9'];
  atar(function () { Yol.yukle(w); }, 'bilinmeyen önkoşul');
  var x = ornek(); x.uniteler[0].kapi.sorular[0].tur = 'acik';
  atar(function () { Yol.yukle(x); }, 'puanlanamıyor');
});

t('açık olan: ilk ünite ve ilk ders açık, önkoşullular kilitli', function () {
  var y = Yol.yukle(ornek()), k = Yol.bosKayit();
  dogru(Yol.acikMi(y, k, 't.1.1')); dogru(Yol.acikMi(y, k, 't.1.1.1'));
  dogru(!Yol.acikMi(y, k, 't.1.1.2'), 'D2 kilitli olmalı');
  dogru(!Yol.acikMi(y, k, 't.1.2'), 'U2 kilitli olmalı');
  atar(function () { Yol.dersOku(y, k, 't.1.2.1', Z); }, 'kilitli');
});

t('ders okumak sonraki dersi açar, kaydı değiştirmez (saf)', function () {
  var y = Yol.yukle(ornek()), k0 = Yol.bosKayit();
  var k1 = Yol.dersOku(y, k0, 't.1.1.1', Z);
  dogru(Yol.acikMi(y, k1, 't.1.1.2')); esit(Object.keys(k0.dersler).length, 0, 'eski kayıt');
  esit(k1.dersler['t.1.1.1'].okundu, Z);
  atar(function () { Yol.dersOku(y, k0, 't.1.1.1'); }, 'zaman');
});

t('cevapla: seçmeli puanlanır, açık uçlu puanlanmaz, kapı sorusu buradan cevaplanmaz', function () {
  var y = Yol.yukle(ornek()), k = Yol.bosKayit();
  var r1 = Yol.cevapla(y, k, 't.1.1.1.a1', 'B', Z); esit(r1.dogru, true);
  var r2 = Yol.cevapla(y, r1.kayit, 't.1.1.1.a1', 'A', Z + 1); esit(r2.dogru, false);
  esit(r2.kayit.cevaplar['t.1.1.1.a1'].length, 2);
  esit(Yol.cevapla(y, k, 't.1.1.1.a2', 'serbest', Z).dogru, null);
  atar(function () { Yol.cevapla(y, k, 't.1.1.k1', 'A', Z); }, 'bilinmeyen alistirma');
});

t('ustalık kapısı: hacim tek başına üniteyi geçirmez', function () {
  var y = Yol.yukle(ornek()), k = Yol.bosKayit();
  k = Yol.dersOku(y, k, 't.1.1.1', Z); k = Yol.dersOku(y, k, 't.1.1.2', Z);
  for (var i = 0; i < 100; i++) k = Yol.cevapla(y, k, 't.1.1.1.a1', 'B', Z + i).kayit;
  dogru(!Yol.uniteGectiMi(y, k, 't.1.1'), 'hacimle geçti');
  dogru(!Yol.acikMi(y, k, 't.1.2'), 'U2 hacimle açıldı');
  var d = Yol.durum(y, k);
  esit(d.ilerleme.asama.deger, 0); esit(d.uniteler[0].kapi.son.etiket, 'veri yok');
});

t('ustalık kapısı: eşik altı geçmez, eşik tutunca geçer ve sonraki ünite açılır', function () {
  var y = Yol.yukle(ornek()), k = Yol.bosKayit();
  var r = Yol.kapiDene(y, k, 't.1.1', { 't.1.1.k1': 'A', 't.1.1.k2': 'A', 't.1.1.k3': 'B' }, Z); // 2/4, bos = yanlis
  esit(r.sonuc.gecti, false); esit(r.sonuc.dogruSayisi, 2); esit(r.sonuc.toplam, 4);
  r = Yol.kapiDene(y, r.kayit, 't.1.1', { 't.1.1.k1': 'A', 't.1.1.k2': 'A', 't.1.1.k3': 'A' }, Z + 1); // 3/4 = 0.75
  esit(r.sonuc.gecti, true, 'tam eşikte');
  dogru(Yol.acikMi(y, r.kayit, 't.1.2')); dogru(Yol.acikMi(y, r.kayit, 't.1.2.1'));
  esit(r.sonuc.taslak, true, 'taslak sorularla geçiş işaretlenmeli');
});

t('eşik ayarlanabilir: ayar.esik veriyi ezer, geçersiz eşik reddedilir', function () {
  var y = Yol.yukle(ornek()), k = Yol.bosKayit();
  var c = { 't.1.1.k1': 'A', 't.1.1.k2': 'A', 't.1.1.k3': 'A' };
  esit(Yol.kapiDene(y, k, 't.1.1', c, Z, { esik: 1 }).sonuc.gecti, false);
  esit(Yol.kapiDene(y, k, 't.1.1', c, Z, { esik: 0.5 }).sonuc.gecti, true);
  atar(function () { Yol.kapiDene(y, k, 't.1.1', c, Z, { esik: 0 }); }, 'eşik');
  atar(function () { Yol.kapiDene(y, k, 't.1.1', c, Z, { esik: 1.5 }); }, 'eşik');
});

t('aşama: kilitli ünitenin kapısı denenemez; aşama kapısı ünitelerden sonra açılır', function () {
  var y = Yol.yukle(ornek()), k = Yol.bosKayit();
  atar(function () { Yol.kapiDene(y, k, 't.1.2', hepsiDogru(y, 't.1.2'), Z); }, 'kilitli');
  atar(function () { Yol.kapiDene(y, k, 't.1', hepsiDogru(y, 't.1'), Z); }, 'önce bütün');
  k = Yol.kapiDene(y, k, 't.1.1', hepsiDogru(y, 't.1.1'), Z).kayit;
  k = Yol.kapiDene(y, k, 't.1.2', hepsiDogru(y, 't.1.2'), Z).kayit;
  dogru(!Yol.asamaGectiMi(y, k), 'üniteler yetmez, aşama kapısı gerekir');
  var r = Yol.kapiDene(y, k, 't.1', { 't.1.k1': 'A', 't.1.k2': 'B' }, Z); // 2/3 < 0.8
  dogru(!Yol.asamaGectiMi(y, r.kayit));
  r = Yol.kapiDene(y, r.kayit, 't.1', hepsiDogru(y, 't.1'), Z + 5);
  dogru(Yol.asamaGectiMi(y, r.kayit)); esit(r.kayit.asamalar['t.1'].gecti, Z + 5);
  var d = Yol.durum(y, r.kayit);
  esit(d.ilerleme.asama.deger, 1); esit(d.ilerleme.asama.etiket, 'hesaplandı');
});

t('aşama önkoşulu: önceki aşama kayıtta geçilmeden sonraki aşama kilitli', function () {
  var v = ornek(); v.id = 't.2'; v.onKosul = ['t.1'];
  // kimlikleri t.2 altina tasimaya gerek yok: motor yalniz yuklu asamayi dizinler
  var y = Yol.yukle(v), k = Yol.bosKayit();
  dogru(!Yol.acikMi(y, k, 't.2')); dogru(!Yol.acikMi(y, k, 't.1.1.1'));
  k.asamalar['t.1'] = { gecti: Z };
  dogru(Yol.acikMi(y, k, 't.2')); dogru(Yol.acikMi(y, k, 't.1.1.1'));
});

t('tekrar adayı: taslak hiçbir zaman, onaylı ve cevaplanmış seçmeli girer', function () {
  var y = Yol.yukle(ornek('taslak')), k = Yol.bosKayit();
  k = Yol.cevapla(y, k, 't.1.1.1.a1', 'B', Z).kayit;
  esit(Yol.tekrarAdaylari(y, k).length, 0, 'taslak tekrara girdi');
  var y2 = Yol.yukle(ornek('onayli')), k2 = Yol.bosKayit();
  esit(Yol.tekrarAdaylari(y2, k2).length, 0, 'cevaplanmamış girdi');
  k2 = Yol.cevapla(y2, k2, 't.1.1.1.a1', 'A', Z).kayit;  // yanlis da olsa tekrar adayidir
  k2 = Yol.cevapla(y2, k2, 't.1.1.1.a2', 'x', Z).kayit;  // acik: girmez
  var a = Yol.tekrarAdaylari(y2, k2);
  esit(a.length, 1); esit(a[0].id, 't.1.1.1.a1'); esit(a[0].ders, 't.1.1.1');
  var v = ornek('onayli'); v.uniteler[0].dersler[0].durum = 'taslak'; // onayli soru, taslak ders
  var y3 = Yol.yukle(v);
  esit(Yol.tekrarAdaylari(y3, Yol.cevapla(y3, Yol.bosKayit(), 't.1.1.1.a1', 'B', Z).kayit).length, 0);
});

t('durum: etiketli ilerleme ve taslak etiketi', function () {
  var y = Yol.yukle(ornek()), k = Yol.bosKayit();
  var d = Yol.durum(y, k);
  esit(d.ilerleme.okunanDers.deger, 0); esit(d.ilerleme.okunanDers.etiket, 'ölçüldü'); esit(d.ilerleme.okunanDers.toplam, 3);
  esit(d.ilerleme.alistirmaDogruluk.deger, null); esit(d.ilerleme.alistirmaDogruluk.etiket, 'veri yok');
  esit(d.uniteler[0].dersler[0].etiket, 'taslak');
  k = Yol.cevapla(y, k, 't.1.1.1.a1', 'B', Z).kayit;
  d = Yol.durum(y, k);
  esit(d.ilerleme.alistirmaDogruluk.deger, 1); esit(d.ilerleme.alistirmaDogruluk.etiket, 'hesaplandı');
  var etiketler = Object.keys(Yol.ETIKET).map(function (x) { return Yol.ETIKET[x]; }).sort().join(',');
  esit(etiketler, 'hesaplandı,tahmin,veri yok,ölçüldü');
});

// Gercek icerik: alan/felsefe butun asama dosyalari motordan uctan uca gecer.
t('Felsefe: alan/felsefe yüklenir ve baştan sona yürünür', function () {
  var klasor = path.join(__dirname, '..', 'alan', 'felsefe');
  var dosyalar = fs.readdirSync(klasor).filter(function (f) { return /^asama-\d+\.json$/.test(f); }).sort();
  dogru(dosyalar.length >= 1, 'aşama dosyası yok');
  var k = Yol.bosKayit(), z = Z;
  dosyalar.forEach(function (f) {
    var y = Yol.yukle(JSON.parse(fs.readFileSync(path.join(klasor, f), 'utf8')));
    dogru(Yol.acikMi(y, k, y.id), y.id + ' açılmadı');
    // butun dersleri sirayla oku ve alistirmalari dogru cevapla: asama hala gecmemeli
    y.veri.uniteler.forEach(function (u) {
      dogru(Yol.acikMi(y, k, u.id), u.id + ' kilitli');
      u.dersler.forEach(function (d) {
        dogru(Yol.acikMi(y, k, d.id), d.id + ' kilitli');
        k = Yol.dersOku(y, k, d.id, z++);
        d.alistirmalar.forEach(function (a) { k = Yol.cevapla(y, k, a.id, a.dogru, z++).kayit; });
        esit(Yol.etiket(d), 'taslak', d.id + ' onaylı görünüyor');
      });
      dogru(!Yol.uniteGectiMi(y, k, u.id), u.id + ' hacimle geçti');
      var r = Yol.kapiDene(y, k, u.id, hepsiDogru(y, u.id), z++);
      dogru(r.sonuc.gecti && r.sonuc.taslak, u.id + ' kapısı'); k = r.kayit;
    });
    var r = Yol.kapiDene(y, k, y.id, hepsiDogru(y, y.id), z++);
    dogru(r.sonuc.gecti, y.id + ' aşama kapısı'); k = r.kayit;
    dogru(Yol.asamaGectiMi(y, k), y.id + ' geçmedi');
    esit(Yol.tekrarAdaylari(y, k).length, 0, 'taslak Felsefe içeriği tekrara girdi');
    var d = Yol.durum(y, k);
    esit(d.ilerleme.okunanDers.deger, d.ilerleme.okunanDers.toplam);
    esit(d.ilerleme.asama.deger, 1);
  });
});

console.log((sayac - hatali) + '/' + sayac + ' test geçti');
process.exit(hatali ? 1 : 0);
