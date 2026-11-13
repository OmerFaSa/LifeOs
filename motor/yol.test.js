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

// ---- Goc: AYS konu durumu (gercek Akademik asama, AYS'nin eski bicimi) ----
var Tekrar = require('./tekrar.js'), Not = require('./not.js');
var AK = Yol.yukle(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'alan', 'akademik', 'asama-1.json'), 'utf8')));
function akDers(konu) {
  var kid = AK.veri.kaynaklar.filter(function (k) { return k.bolum === "R.KONU_ANLATIM['" + konu + "']"; })[0].id, bulunan;
  AK.veri.uniteler.forEach(function (u) { u.dersler.forEach(function (d) { if (!bulunan && d.kaynak[0] === kid) bulunan = d; }); });
  return bulunan;
}
var D1 = akDers('tr-01'), A0 = D1.alistirmalar[0], A1 = D1.alistirmalar[1];
var yanlisHarf = A1.dogru === 'A' ? 'B' : 'A';
function aysBelge() {
  return { subjectId: 'tyt-turkce', states: {
    'tr-01': { state: 'closed', first: 82, firstAt: '2026-10-01', second: 74, secondAt: '2026-10-08', note: 'gizli konu notu',
      okunduAt: '2026-09-30T08:00:00.000Z',
      ornek: { 0: { h: A0.dogru, d: true, at: '2026-09-30T09:00:00.000Z', ip: true, sure: 40 },
               1: { h: yanlisHarf, d: false, at: '2026-09-30T09:01:00.000Z' },
               2: { h: null, d: false, bak: true, at: '2026-09-30T09:02:00.000Z' },
               999: { h: 'A', d: true, at: '2026-09-30T09:03:00.000Z' } } },
    'tr-02': { state: 'learning', first: null, firstAt: null, second: null, secondAt: null, note: '' },
    'tr-03': { state: 'not_started', first: null, firstAt: null, second: null, secondAt: null, note: '' }
  } };
}

t('göç aysKonu: okuma, cevaplar ve durum taşınır; kapı geçmez', function () {
  var r = Yol.GOC.aysKonu(aysBelge(), AK), k = r.kayit;
  esit(r.red.length, 0, 'ret');
  esit(k.dersler[D1.id].okundu, Date.parse('2026-09-30T08:00:00.000Z'));
  esit(k.cevaplar[A0.id][0].dogru, true); esit(k.cevaplar[A0.id][0].ipucu, true); esit(k.cevaplar[A0.id][0].sure, 40);
  esit(k.cevaplar[A1.id][0].dogru, false); esit(k.cevaplar[A1.id][0].cevap, yanlisHarf);
  var a2 = D1.alistirmalar[2].id;
  esit(k.cevaplar[a2][0].bakildi, true); esit(k.cevaplar[a2][0].dogru, false);
  esit(Object.keys(k.cevaplar).length, 3, 'derin soru cevabı alıştırmaya yazılmaz');
  esit(r.say['derin soru cevabı: Yol\'da kapı sorusu, tek cevap kapı denemesi sayılmaz'], 1);
  esit(k.eski['ays:tyt-turkce/tr-01'].durum, 'closed'); esit(k.eski['ays:tyt-turkce/tr-01'].etiket, 'eski kayıt');
  esit(k.eski['ays:tyt-turkce/tr-01'].dersId, D1.id);
  esit(k.eski['ays:tyt-turkce/tr-02'].durum, 'learning'); esit(k.eski['ays:tyt-turkce/tr-02'].dersId, akDers('tr-02').id);
  dogru(!k.eski['ays:tyt-turkce/tr-03'], 'başlanmamış ve verisiz konu yazılmaz');
  esit(Object.keys(k.kapilar).length + Object.keys(k.asamalar).length, 0, 'kapalı konu kapı geçirmez');
  var d = Yol.durum(AK, k), u = d.uniteler.filter(function (x) { return x.id === AK.ust[D1.id]; })[0];
  esit(u.gecti, false); esit(d.ilerleme.okunanDers.deger, 1); esit(d.asama.gecti, false);
});

t('göç aysKonu: Tekrar ve Not ile çift sayım yok', function () {
  var b = aysBelge(), metin = JSON.stringify(Yol.GOC.aysKonu(b, AK));
  ['"first"', '"second"', '"firstAt"', '"secondAt"', '"note"', '2026-10-01', '2026-10-08', 'gizli konu notu'].forEach(function (x) {
    dogru(metin.indexOf(x) < 0, 'Yol çıktısında ' + x + ' var');
  });
  var kart = Tekrar.GOC.aysKapanis(b.states['tr-01'], 'tr-01');
  dogru(kart && kart.son === Date.parse('2026-10-01'), 'kapanış Tekrar\'da');
  esit(Not.goc.aysKonu([b], { zaman: 0 }).notlar.length, 1, 'not Not\'ta');
  dogru(Yol.EKSIK.aysKonu.some(function (x) { return x.indexOf('Tekrar.GOC.aysKapanis') >= 0; }));
  dogru(Yol.EKSIK.aysKonu.some(function (x) { return x.indexOf('Not.goc.aysKonu') >= 0; }));
});

t('göç aysKonu: boş ve bozuk girdi sessizce düşmez', function () {
  var bos = Yol.GOC.aysKonu({ subjectId: 'tyt-turkce', states: {} }, AK);
  esit(bos.red.length + Object.keys(bos.kayit.eski).length + Object.keys(bos.kayit.dersler).length, 0, 'boş belge');
  esit(Yol.GOC.aysKonu(null, AK).red.length, 1);
  esit(Yol.GOC.aysKonu({ subjectId: 'x' }, AK).red.length, 1);
  esit(Yol.GOC.aysKonu({ states: { 'tr-01': { state: 'closed' } } }, AK).red[0].neden.indexOf('subjectId') >= 0, true);
  var r = Yol.GOC.aysKonu({ subjectId: 'tyt-turkce', states: {
    'tr-01': { state: 'uydurma', okunduAt: 'dün', ornek: { 0: { h: A0.dogru, d: false, at: '2026-09-30T09:00:00Z' }, 1: { h: 'A', d: true }, x: {} }, eskiAlan: 1 },
    'tr-02': 'kapalı', 'tr-03': { state: 'practicing', ornek: [1] },
    'yok-99': { state: 'closed', okunduAt: '2026-09-30T08:00:00Z' }
  } }, AK);
  var neden = r.red.map(function (x) { return x.konu + ': ' + x.neden; }).join('\n');
  ['tr-01: bilinmeyen durum', 'tr-01: okuma zamanı', 'tr-01: cevap anahtarı tutmuyor', 'tr-01: örnek cevap bozuk', 'tr-01: örnek cevap anahtarı sıra değil',
   'tr-02: konu durumu nesne değil', 'tr-03: örnek cevaplar (ornek) nesne değil', 'yok-99: Yol içeriğinde konunun dersi yok'].forEach(function (x) {
    dogru(neden.indexOf(x) >= 0, 'ret yok: ' + x);
  });
  esit(r.say['bilinmeyen konu alanı «eskiAlan»: göremedim'], 1);
  esit(Object.keys(r.kayit.dersler).length + Object.keys(r.kayit.cevaplar).length, 0, 'bozuk okuma/cevap taşınmaz');
  esit(r.kayit.eski['ays:tyt-turkce/tr-03'].durum, 'practicing');
  esit(r.kayit.eski['ays:tyt-turkce/yok-99'].dersId, null, 'eşlenemeyen konunun durumu yine taşınır');
  dogru(!r.kayit.eski['ays:tyt-turkce/tr-01'], 'bilinmeyen durum ve taşınamayan veri: eski kayıt yazılmaz, ret var');
  esit(Yol.GOC.aysKonu(aysBelge()).red.filter(function (x) { return x.neden.indexOf('aşama verilmedi') >= 0; }).length, 1, 'aşamasız çağrı söyler');
});

t('göç aysKonu: AYS konu alanlarının hepsi okunuyor ya da EKSIK\'te', function () {
  var kaynak = String(Yol.GOC.aysKonu) + Yol.EKSIK.aysKonu.join('\n');
  ['state', 'okunduAt', 'ornek', 'first', 'firstAt', 'second', 'secondAt', 'note'].forEach(function (a) {
    dogru(new RegExp('(^|[^\\w$])' + a + '([^\\w$]|$)').test(kaynak), a + ' sessiz düşüyor');
  });
  ['h', 'd', 'at', 'ip', 'sure', 'bak'].forEach(function (a) { dogru(new RegExp('c\\.' + a + '\\b').test(kaynak), 'ornek.' + a); });
});

// ---- Yerleştirme («Seviyemi bul», icerik-hatti.md §4.3) ----
function cevapVer(y, n) { // yerleştirme sorularının ilk n'ine doğru, kalanına yanlış cevap
  var c = {};
  Yol.yerlestirmeSorulari(y).forEach(function (id, i) { var d = y.oge[id].dogru; c[id] = i < n ? d : (d === 'A' ? 'B' : 'A'); });
  return c;
}
var F1 = JSON.parse(fs.readFileSync(path.join(__dirname, '../alan/felsefe/asama-1.json'), 'utf8'));
var F2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../alan/felsefe/asama-2.json'), 'utf8'));

t('yerleştirme soruları: aşama başına 5-8, ünite kapılarından, kolaydan zora (ünite sırası, içinde seviye)', function () {
  var y = Yol.yukle(F1), ids = Yol.yerlestirmeSorulari(y);
  esit(ids.length, 6); dogru(ids.every(function (id) { return y.tur[id] === 'kapiSorusu' && y.tur[y.ust[id]] === 'unite'; }), 'yalnız ünite kapısı');
  esit(ids.map(function (id) { return y.ust[id]; }).join(), [1, 1, 2, 2, 3, 3].map(function (n) { return 'felsefe.1.' + n; }).join());
  var a = Yol.yukle(JSON.parse(fs.readFileSync(path.join(__dirname, '../alan/akademik/asama-1.json'), 'utf8'))), ai = Yol.yerlestirmeSorulari(a);
  esit(ai.length, 8);
  var sira = ai.map(function (id) { return a.veri.uniteler.indexOf(a.oge[a.ust[id]]); });
  dogru(sira.every(function (x, i) { return !i || x > sira[i - 1]; }) && sira[0] === 0 && sira[7] === 29, 'otuz üniteden eşit aralıklı sekiz: ' + sira);
  // içinde seviye: «ileri» önde yazılmış olsa da «orta» önce sorulur
  var v = ornek(); v.uniteler[0].kapi.sorular[0].seviye = 'ileri'; v.uniteler[0].kapi.sorular[1].seviye = 'orta';
  var o = Yol.yerlestirmeSorulari(Yol.yukle(v));
  // etiketsiz soru «orta» sayılır: k3, k4 «ileri» k1'den önce; ünitede üç yer olduğundan k1 dışarıda kalır
  esit(o.join(), 't.1.1.k2,t.1.1.k3,t.1.1.k4,t.1.2.k1,t.1.2.k2');
  // ünitelerden beşten az soru çıkarsa aşama kapısından tamamlanır
  v = ornek(); v.uniteler = [v.uniteler[0]]; v.uniteler[0].kapi.sorular = v.uniteler[0].kapi.sorular.slice(0, 2);
  esit(Yol.yerlestirmeSorulari(Yol.yukle(v)).join(), 't.1.1.k1,t.1.1.k2,t.1.k1,t.1.k2,t.1.k3');
});

t('yerleştirme: eşik 2/3; 4/6 geçer, 3/6 geçmez; ölçüm yalnız sorulan sorulardan', function () {
  var y = Yol.yukle(F1), s = Yol.yerlestirmeDegerlendir(y, cevapVer(y, 4));
  esit(s.gecti, true); esit(s.dogruSayisi, 4); esit(s.toplam, 6); esit(s.esik, 2 / 3); esit(s.taslak, true);
  esit(Yol.yerlestirmeDegerlendir(y, cevapVer(y, 3)).gecti, false);
  esit(Yol.yerlestirmeDegerlendir(y, {}).dogruSayisi, 0, 'boş yanlış sayılır');
});

t('yerleştirme: geçilen aşama «atlandı» (geçildi değil, tahmin), ilk kalınan aşamada durulur, sonraki açılır', function () {
  var y1 = Yol.yukle(F1), y2 = Yol.yukle(F2);
  var r = Yol.yerlestir([y1, y2], [Yol.bosKayit(), Yol.bosKayit()], [cevapVer(y1, 6), cevapVer(y2, 2)], Z);
  esit(r.seviye, 2); esit(r.sonuclar.length, 2);
  var k1 = r.kayitlar[0], k2 = r.kayitlar[1];
  esit(k1.yerlestirme.sonuc, 'atlandi'); esit(k1.yerlestirme.etiket, 'tahmin'); esit(k2.yerlestirme.sonuc, 'burada');
  esit(Yol.asamaGectiMi(y1, k1), false, 'atlanan aşama geçilmiş sayılmaz');
  var d1 = Yol.durum(y1, k1);
  esit(d1.asama.atlandi, true); esit(d1.asama.gecti, false);
  dogru(d1.uniteler.every(function (u) { return u.atlandi && !u.gecti && u.acik; }), 'üniteler atlandı ve açık');
  esit(d1.ilerleme.gecilenUnite.deger, 0); esit(d1.ilerleme.asama.deger, 0);
  esit(d1.ilerleme.atlananUnite.deger, 3); esit(d1.ilerleme.atlananUnite.etiket, 'tahmin');
  dogru(Yol.acikMi(y1, k1, y1.veri.uniteler[2].dersler[0].id), 'atlanan ünitenin dersi açılabilir');
  // ikinci aşama, kabuğun yaptığı gibi birincinin aşama satırı eklenince açılır
  var k2b = JSON.parse(JSON.stringify(k2)); k2b.asamalar['felsefe.1'] = k1.asamalar['felsefe.1'];
  dogru(!Yol.acikMi(y2, k2, 'felsefe.2') && Yol.acikMi(y2, k2b, 'felsefe.2'));
  // birinci aşamada kalınırsa ikinci aşamanın cevapları yok sayılır
  var r2 = Yol.yerlestir([y1, y2], [Yol.bosKayit(), Yol.bosKayit()], [cevapVer(y1, 3), cevapVer(y2, 6)], Z);
  esit(r2.seviye, 1); esit(r2.sonuclar.length, 1); esit(r2.kayitlar[0].yerlestirme.sonuc, 'burada');
  esit(JSON.stringify(r2.kayitlar[1]), JSON.stringify(Yol.bosKayit()));
  esit(Object.keys(r2.kayitlar[0].asamalar).length, 0);
  // hepsi geçilirse seviye aşama sayısı + 1
  esit(Yol.yerlestir([y1, y2], [Yol.bosKayit(), Yol.bosKayit()], [cevapVer(y1, 6), cevapVer(y2, 6)], Z).seviye, 3);
});

t('yerleştirme: yalnız boş kayıtta; beceri alanında üretim görevi bekliyor; atlanan ünite tekrara girmez', function () {
  var y1 = Yol.yukle(F1), dolu = Yol.dersOku(y1, Yol.bosKayit(), y1.veri.uniteler[0].dersler[0].id, Z);
  atar(function () { Yol.yerlestir([y1], [dolu], [cevapVer(y1, 6)], Z); }, 'hiç kaydı olmayan');
  atar(function () { Yol.yerlestir([y1], [{ dersler: {}, cevaplar: {}, kapilar: {}, asamalar: {}, eski: { a: 1 } }], [cevapVer(y1, 6)], Z); }, 'hiç kaydı olmayan');
  atar(function () { Yol.yerlestir([y1], [], [], Z); }, 'eşit sayıda');
  esit(Yol.bosMu(Yol.bosKayit()), true); esit(Yol.bosMu(dolu), false);
  var k = Yol.yerlestir([y1], [Yol.bosKayit()], [cevapVer(y1, 6)], Z, { uretim: true }).kayitlar[0];
  esit(k.yerlestirme.uretim, 'bekliyor'); esit(Yol.durum(y1, k).asama.yerlestirme.uretim, 'bekliyor');
  atar(function () { Yol.yerlestir([y1], [k], [cevapVer(y1, 6)], Z); }, 'hiç kaydı olmayan');
  // onaylı içerikte bile: atlanan ünitede cevaplanan alıştırma kart adayı olmaz; kapısı ölçülünce olur
  var y = Yol.yukle(ornek('onayli')), ka = Yol.yerlestir([y], [Yol.bosKayit()], [cevapVer(y, 5)], Z).kayitlar[0];
  ka = Yol.cevapla(y, ka, 't.1.1.1.a1', 'B', Z + 1).kayit;
  esit(Yol.tekrarAdaylari(y, ka).length, 0);
  ka = Yol.kapiDene(y, ka, 't.1.1', hepsiDogru(y, 't.1.1'), Z + 2).kayit;
  esit(Yol.tekrarAdaylari(y, ka).length, 1);
});

t('yerleştirme: ilk ölçülen ünite kapısı geçilince tahmin silinir; kalan deneme silmez', function () {
  var y1 = Yol.yukle(F1), y2 = Yol.yukle(F2);
  var r = Yol.yerlestir([y1, y2], [Yol.bosKayit(), Yol.bosKayit()], [cevapVer(y1, 6), cevapVer(y2, 0)], Z), k2 = r.kayitlar[1];
  k2.asamalar['felsefe.1'] = r.kayitlar[0].asamalar['felsefe.1'];
  var u = y2.veri.uniteler[0].id;
  k2 = Yol.kapiDene(y2, k2, u, {}, Z + 1).kayit;
  esit(k2.yerlestirme.etiket, 'tahmin', 'kalınca tahmin kalır');
  k2 = Yol.kapiDene(y2, k2, u, hepsiDogru(y2, u), Z + 2).kayit;
  esit(k2.yerlestirme.etiket, undefined); esit(k2.yerlestirme.olcum, Z + 2); esit(k2.yerlestirme.sonuc, 'burada');
  var k1 = Yol.tahminSil(r.kayitlar[0], Z + 2);
  esit(k1.yerlestirme.etiket, undefined); esit(r.kayitlar[0].yerlestirme.etiket, 'tahmin', 'saf');
  esit(Yol.durum(y1, k1).ilerleme.atlananUnite.etiket, 'hesaplandı');
  esit(Yol.tahminSil(k1, Z + 3), k1, 'silinecek tahmin yoksa aynı kayıt');
  // atlanan aşamanın kapısı sonradan ölçülerek geçilirse aşama geçilmiş olur, yerleştirme izi kalır
  var ka = r.kayitlar[0];
  y1.veri.uniteler.forEach(function (x) { ka = Yol.kapiDene(y1, ka, x.id, hepsiDogru(y1, x.id), Z + 3).kayit; });
  ka = Yol.kapiDene(y1, ka, 'felsefe.1', hepsiDogru(y1, 'felsefe.1'), Z + 4).kayit;
  esit(Yol.asamaGectiMi(y1, ka), true); esit(ka.asamalar['felsefe.1'].yerlestirme, Z); esit(Yol.durum(y1, ka).asama.atlandi, false);
});

t('eski kayıt: yerleştirmesiz kayıt aynı okunur (atlandı yok, ek satır yok)', function () {
  var y = Yol.yukle(F1), d = Yol.durum(y, Yol.bosKayit());
  esit(d.asama.atlandi, false); esit(d.asama.yerlestirme, null); esit(d.ilerleme.atlananUnite, undefined);
  dogru(d.uniteler.every(function (u) { return u.atlandi === false; }));
  dogru(!Yol.acikMi(y, Yol.bosKayit(), y.veri.uniteler[1].id), 'ikinci ünite yine kilitli');
});

// ---- Kapıda kalınca Tekrar ----
t('kapı tekrar adayları: yanlış ve boş sorular, kimlik soru kimliği, kaynak taşır, doğru cevap yok', function () {
  var y = Yol.yukle(ornek()), c = hepsiDogru(y, 't.1.1');
  c['t.1.1.k2'] = 'B'; delete c['t.1.1.k3'];
  var a = Yol.kapiTekrarAdaylari(y, 't.1.1', c);
  esit(a.map(function (x) { return x.id; }).join(), 't.1.1.k2,t.1.1.k3');
  esit(JSON.stringify(a[0]), JSON.stringify({ id: 't.1.1.k2', kapi: 't.1.1', unite: 't.1.1', asama: 't.1', icerik: 'taslak' }));
  var b = Yol.kapiTekrarAdaylari(Yol.yukle(ornek('onayli')), 't.1', {});
  esit(b.length, 3); esit(b[0].unite, null); esit(b[0].icerik, 'onayli');
  esit(Yol.kapiTekrarAdaylari(y, 't.1.1', hepsiDogru(y, 't.1.1')).length, 0);
  atar(function () { Yol.kapiTekrarAdaylari(y, 't.1.1.1', {}); }, 'kapı sahibi');
});

console.log((sayac - hatali) + '/' + sayac + ' test geçti');
process.exit(hatali ? 1 : 0);
