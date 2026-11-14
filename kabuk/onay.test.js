// Onay bindirmesi saf mantık testleri: node kabuk/onay.test.js  (✓/✕, çıkış 0/1)
'use strict';
const fs = require('fs'), path = require('path');
const O = require('./onay.js');
const K = require('./kabuk.js');
const Yol = require('../motor/yol.js');

let gecen = 0, kalan = 0;
function t(ad, f) {
  try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); }
}
function esit(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a)); }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
const ham = n => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'alan', 'felsefe', 'asama-' + n + '.json'), 'utf8'));
const v1 = ham(1), u1 = v1.uniteler[0], d1 = u1.dersler[0], a1 = d1.alistirmalar[0];
const G = { durum: 'onayli', onaylayan: 'sahip', onayTarihi: '2026-11-14' };

t('bindirme: onay yoksa ya da başka aşamanınsa aynı nesne döner', () => {
  dogru(O.uygula(v1, 'felsefe', 1, {}) === v1 && O.uygula(v1, 'felsefe', 1, null) === v1);
  dogru(O.uygula(v1, 'felsefe', 1, { ['felsefe/2/' + d1.id]: G, ['tarih/1/' + d1.id]: G }) === v1, 'başka aşama ya da alan dokunmamalı');
  dogru(O.uygula(null, 'felsefe', 1, { ['felsefe/1/' + d1.id]: G }) === null, 'dosyası olmayan aşama null kalır');
});
t('bindirme: ders ve alıştırması onaylı olur, girdi değişmez, ötekiler taslak kalır', () => {
  const once = JSON.stringify(v1);
  const v = O.uygula(v1, 'felsefe', 1, { ['felsefe/1/' + d1.id]: G, ['felsefe/1/' + a1.id]: G });
  const d = v.uniteler[0].dersler[0];
  esit([d.durum, d.onaylayan, d.onayTarihi, d.alistirmalar[0].durum], ['onayli', 'sahip', '2026-11-14', 'onayli']);
  esit(JSON.stringify(v1), once, 'girdi değişti');
  esit(v.uniteler[0].dersler[1].durum, 'taslak');
  if (d.alistirmalar[1]) esit(d.alistirmalar[1].durum, 'taslak', 'anahtarı olmayan alıştırma');
});
t('bindirme: kimlik birebir eşleşir (ders kimliği alıştırmasını, önek başkasını onaylamaz)', () => {
  const v = O.uygula(v1, 'felsefe', 1, { ['felsefe/1/' + d1.id]: G, 'felsefe/1/felsefe.1': G, 'felsefe/1/felsefe.1.1.1.a': G });
  esit(v.uniteler[0].dersler[0].alistirmalar.map(a => a.durum).filter(x => x === 'onayli'), []);
  esit(v.uniteler[0].dersler[0].durum, 'onayli');
  dogru(!v.durum && !v.uniteler[0].durum, 'aşama ve ünitenin durumu yok, eklenmez');
});
t('bindirme: geçersiz kayıt yok sayılır (taslak, tarihsiz, onaylayansız, dizi)', () => {
  [{ durum: 'taslak', onaylayan: 'sahip', onayTarihi: '2026-11-14' }, { durum: 'onayli', onaylayan: 'sahip' }, { durum: 'onayli', onayTarihi: '2026-11-14' },
    { durum: 'onayli', onaylayan: 'sahip', onayTarihi: 'dün' }, null, 'onayli'].forEach(g => {
    dogru(O.uygula(v1, 'felsefe', 1, { ['felsefe/1/' + d1.id]: g }) === v1, JSON.stringify(g));
  });
});
t('bindirme: kapı soruları (ünite ve aşama) da onaylanır', () => {
  const v = O.uygula(v1, 'felsefe', 1, { ['felsefe/1/' + u1.kapi.sorular[0].id]: G, ['felsefe/1/' + v1.kapi.sorular[0].id]: G });
  esit([v.uniteler[0].kapi.sorular[0].durum, v.kapi.sorular[0].durum, v.uniteler[0].kapi.sorular[1].durum], ['onayli', 'onayli', 'taslak']);
});
t('Yol: onaylı ders taslak etiketini kaybeder, alıştırması tekrar adayı olur; taslakta olmaz', () => {
  const y0 = Yol.yukle(v1), ids = O.kimlikler(y0, d1.id), sec = d1.alistirmalar.filter(a => a.tur === 'secmeli')[0];
  dogru(sec, 'ilk dersin seçmeli alıştırması yok');
  const y = Yol.yukle(O.uygula(v1, 'felsefe', 1, O.onayla({}, 'felsefe', 1, ids, '2026-11-14')));
  esit([Yol.etiket(y.oge[d1.id]), Yol.etiket(y0.oge[d1.id])], ['onayli', 'taslak']);
  const cevap = yy => Yol.cevapla(yy, Yol.bosKayit(), sec.id, sec.dogru, 1).kayit;
  esit(Yol.tekrarAdaylari(y0, cevap(y0)).length, 0, 'taslak tekrara girdi');
  esit(Yol.tekrarAdaylari(y, cevap(y)).map(x => x.id), [sec.id]);
});
t('kabuk: Asama.kur bindirilmiş iki aşamayı kurar; ikinci aşamanın onayı birinciye karışmaz', () => {
  const v2 = ham(2), d2 = v2.uniteler[0].dersler[0], onay = { ['felsefe/2/' + d2.id]: G };
  const ys = K.Asama.kur(Yol, 'felsefe', [v1, v2].map((v, i) => O.uygula(v, 'felsefe', i + 1, onay)));
  esit(ys.length, 2);
  esit([Yol.etiket(ys[1].oge[d2.id]), O.sayim(ys[0].veri).onayli, O.sayim(ys[1].veri).onayli], ['onayli', 0, 1]);
});
t('kimlikler: ders + alıştırmaları; ünite = dersler + kapı; kapı = yalnız soruları', () => {
  const y = Yol.yukle(v1), dersAl = u1.dersler.reduce((l, d) => l.concat([d.id], d.alistirmalar.map(a => a.id)), []);
  esit(O.kimlikler(y, d1.id), [d1.id].concat(d1.alistirmalar.map(a => a.id)));
  esit(O.kimlikler(y, u1.id, true), u1.kapi.sorular.map(s => s.id));
  esit(O.kimlikler(y, u1.id), dersAl.concat(u1.kapi.sorular.map(s => s.id)));
  esit(O.kimlikler(y, v1.id, true), v1.kapi.sorular.map(s => s.id));
  esit([O.kimlikler(y, 'yok.boyle'), O.kimlikler(y, a1.id), O.kimlikler(y, d1.id, true), O.kimlikler(y, v1.id)], [[], [], [], []]);
});
t('asamaKimlikleri: bütün üniteler (ders, alıştırma, ünite kapısı) ve aşama kapısı; tekrar yok', () => {
  const y = Yol.yukle(v1), ids = O.asamaKimlikleri(y);
  const beklenen = v1.uniteler.reduce((l, u) => l.concat(O.kimlikler(y, u.id)), []).concat(v1.kapi.sorular.map(s => s.id));
  esit(ids, beklenen);
  esit(new Set(ids).size, ids.length, 'aynı kimlik iki kez');
  const m = O.onayla({}, 'felsefe', 1, ids, '2026-11-14'), v = O.uygula(v1, 'felsefe', 1, m);
  esit(O.sayim(v).taslak, 0, 'aşama onayından sonra taslak ders kalmamalı');
  esit(Object.keys(O.geriAl(m, 'felsefe', 1, ids)).length, 0, 'geri al hepsini kaldırmalı');
  esit([O.asamaKimlikleri(null), O.asamaKimlikleri({ veri: {} , oge: {}, tur: {} })], [[], []]);
});
t('onayla / geriAl: girdiyi değiştirmez, biçim SEMA «Onay» ile aynı, geri al eski hâle döner', () => {
  const ilk = { 'tarih/1/x': G }, m = O.onayla(ilk, 'felsefe', 1, [d1.id, a1.id], '2026-11-14');
  esit(Object.keys(ilk), ['tarih/1/x']);
  esit(m['felsefe/1/' + d1.id], { durum: 'onayli', onaylayan: 'sahip', onayTarihi: '2026-11-14' });
  esit(O.geriAl(m, 'felsefe', 1, [d1.id, a1.id]), ilk);
  dogru(O.gecerli(m['felsefe/1/' + a1.id]));
});
t('sayım: felsefe aşama 1 bugün hepsi taslak; iki ders onaylanınca 7/2 (ölçülen ders sayısı)', () => {
  const n = v1.uniteler.reduce((s, u) => s + u.dersler.length, 0);
  esit(O.sayim(v1), { taslak: n, onayli: 0 });
  esit(O.sayim(O.uygula(v1, 'felsefe', 1, { ['felsefe/1/' + d1.id]: G, ['felsefe/1/' + u1.dersler[1].id]: G })), { taslak: n - 2, onayli: 2 });
  esit(O.sayim(null), { taslak: 0, onayli: 0 });
});
t('hepsiOnayli: alıştırması taslak kalan ders onaylı sayılmaz', () => {
  const y = Yol.yukle(O.uygula(v1, 'felsefe', 1, { ['felsefe/1/' + d1.id]: G }));
  dogru(!O.hepsiOnayli(y, O.kimlikler(y, d1.id)) && !O.hepsiOnayli(y, []));
  const y2 = Yol.yukle(O.uygula(v1, 'felsefe', 1, O.onayla({}, 'felsefe', 1, O.kimlikler(y, d1.id), '2026-11-14')));
  dogru(O.hepsiOnayli(y2, O.kimlikler(y2, d1.id)));
});
t('depo: bozuk ya da dizi kayıt boş onay sayılır; tarih yerel gün', () => {
  const d = v => ({ getItem: () => v });
  esit([O.oku(d(null)), O.oku(d('{bozuk')), O.oku(d('[1]')), O.oku(d('{"a":1}'))], [{}, {}, {}, { a: 1 }]);
  esit(O.tarihYaz(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  esit(O.ANAHTAR, 'lifeos.onay');
});
t('index.html: onay.js kabuk.js\'ten önce yüklenir', () => {
  const h = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), i = h.indexOf('src="onay.js"');
  dogru(i > 0 && i < h.indexOf('src="kabuk.js"'));
});

t('ölçüm etiketi: sistem/etiket.py gecerli kuralının aynısı; niyetler sunucuyla aynı', () => {
  const py = fs.readFileSync(path.join(__dirname, '..', 'sistem', 'etiket.py'), 'utf8');
  esit(O.NIYETLER, /NIYETLER = \(([^)]*)\)/.exec(py)[1].match(/"(\w+)"/g).map(x => x.slice(1, -1)), 'niyet listesi');
  esit(O.ARAMA_DEGIL, /ARAMA_DEGIL = "([^"]+)"/.exec(py)[1], 'arama-degil');
  const r = { adaylar: [{ no: 'a1' }, { no: 'a2' }, 'bozuk', null] };
  esit(O.NIYETLER.map(n => O.etiketGecerli('anlama', {}, n)), [true, true, true, true, true]);
  esit(['Sohbet', 'merhaba', '', null, ['sohbet'], 'arama-degil'].map(e => O.etiketGecerli('anlama', {}, e)), [false, false, false, false, false, false]);
  esit([[], ['a1'], ['a2', 'a1'], 'arama-degil'].map(e => O.etiketGecerli('arama', r, e)), [true, true, true, true]);
  esit([['a1', 'a1'], ['a3'], [1], 'a1', null, {}, 'sohbet'].map(e => O.etiketGecerli('arama', r, e)), [false, false, false, false, false, false, false]);
  esit([O.etiketGecerli('arama', {}, []), O.etiketGecerli('arama', {}, ['a1']), O.etiketGecerli('kayit', r, []), O.etiketGecerli('anlama', r, ['a1'])], [true, false, false, false], 'adaysız satır, bilinmeyen set');
});

console.log(gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
