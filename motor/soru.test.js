/* Soru motoru testi — `node motor/soru.test.js`. Her satır ✓ ya da ✕; kırmızıda çıkış 1.

   Eşlik (parity) üç katmanlı:
   1. Sabitler eski kaynak dosyadan okunur (scoring.js, reference.js, curriculum.js, ogrentest.js,
      gelecek.js, state.js) ve motorunkilerle karşılaştırılır.
   2. Eski testlerin vakaları (calc.test, engine.test, denemeanaliz.test, prova.test, gelecek.test,
      features.test «Süreli deneme», tools/ays_sinav_sure_kabul_test.py) aynı beklenen değerlerle.
   3. Fark testi: eski AYS kaynağının KENDİSİ (calc.js, denemeanaliz.js, gelecek.js, examrun.js,
      state.js'ten examNet/testNet/blankCertainty) yüklenir; aynı girdiler iki motora verilir. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const S = require('./soru.js'), Yol = require('./yol.js'), Tekrar = require('./tekrar.js');

const KOK = path.join(__dirname, '..');
const ESKI = path.join(__dirname, 'eski');   // kapanis: esitlik icin donmus eski modul kaynaklari (belgeler/ekip/sadelesme/faz7-kapanis.md)
const kaynak = f => fs.readFileSync(path.join(/^(AYS|SPI|ESP)\//.test(f) ? ESKI : KOK, f), 'utf8');
const T0 = Date.UTC(2026, 10, 13, 9), DK = 60000;
const E = S.ETIKET;

/* Eski kaynakların tarayıcı küreselleri (yalnız yüklemek için; motor bunlara bakmaz). */
globalThis.window = globalThis;
globalThis.yz = s => s;
globalThis.LIFEOS = { PARCA:{ yazilar(){} } };
require(path.join(KOK, 'brand/ortak/tarih.js'));
require(path.join(KOK, 'brand/ortak/bicim.js'));
let uidSay = 0;
globalThis.R = { U:Object.assign({ uid:p => (p || 'x') + (++uidSay) }, LIFEOS.TARIH, LIFEOS.BICIM),
  S:{ exams:[], errors:[], sessions:[], profile:{} } };
/* state.js yüklenemez (depo, göç); net ve boş kuralı kaynak metinden olduğu gibi çıkarılır. */
function fonk(dosya, ad){
  const src = kaynak(dosya), i = src.indexOf('function ' + ad + '(');
  assert.ok(i >= 0, ad + ' bulunamadı');
  for(let k = src.indexOf('{', i), d = 0; k < src.length; k++){
    if(src[k] === '{') d++;
    else if(src[k] === '}' && --d === 0) return src.slice(i, k + 1);
  }
}
R.Model = new Function(['examNet', 'testNet', 'blankCertainty'].map(a => fonk('AYS/src/js/core/state.js', a)).join('\n')
  + '\nreturn { examNet, testNet, blankCertainty };')();
const depo = {};
R.Store = { get:async k => (k in depo ? JSON.parse(depo[k]) : null), set:async (k, v) => { depo[k] = JSON.stringify(v); }, remove:async k => { delete depo[k]; } };
['data/scoring.js', 'data/reference.js', 'data/curriculum.js', 'data/subjects.js',
  'core/calc.js', 'core/denemeanaliz.js', 'core/gelecek.js', 'core/examrun.js'].forEach(f => require(path.join(ESKI, 'AYS/src/js', f)));
const C = R.Calc, DA = R.DenemeAnaliz, GL = R.Gelecek, X = R.ExamRun;

/* Belirlenimci rastgele (mulberry32): fark testleri her koşuda aynı girdiyi üretir. */
function tohum(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* Eski harness.js makeExam/examWithNet ile aynı kayıt; motor biçimine GOC.aysDeneme çevirir. */
let eSay = 0;
function makeExam(o){
  o = o || {};
  const tests = o.tests || [{ name:'Türkçe', correct:o.correct == null ? 20 : o.correct, wrong:o.wrong == null ? 4 : o.wrong, blank:0, minutes:null }];
  return { id:o.id || 'e' + (++eSay), date:o.date || '2026-09-19', type:o.type || 'Tam TYT', family:o.family || 'TYT',
    kind:o.kind || 'full', publisher:o.publisher || '345', duration:o.duration || 165, tests };
}
const examWithNet = (d, net, fam) => makeExam({ date:d, family:fam || 'TYT', type:fam === 'AYT' ? 'Tam AYT (SAY)' : 'Tam TYT',
  tests:[{ name:fam === 'AYT' ? 'Matematik' : 'Türkçe', correct:net, wrong:0, blank:0, minutes:null }] });
const yeni = l => l.map(S.GOC.aysDeneme);
const haftalik = (nets, fam) => nets.map((n, i) => examWithNet(LIFEOS.TARIH.iso(LIFEOS.TARIH.addDays(LIFEOS.TARIH.parse('2026-11-01'), i * 7)), n, fam));

const testler = [];
const it = (ad, f) => testler.push([ad, f]);

/* ================================================================ 1. sabitler kaynakla aynı */
it('puan sabitleri ve sıra tablosu data/scoring.js ile birebir', () => {
  ['base', 'tyt', 'ayt', 'bandHalfWidth', 'sayRankTable'].forEach(k => assert.deepStrictEqual(S.PUAN[k], R.SCORING[k], k));
  assert.deepStrictEqual(Object.keys(S.KONUMLAR), R.SCORING.positions.map(p => p.key));
  R.SCORING.positions.forEach(p => assert.strictEqual(S.KONUMLAR[p.key], p.label));
});
it('OBP, hedef sıra, hata türleri reference.js / curriculum.js ile aynı', () => {
  assert.deepStrictEqual(S.OBP, R.OBP);
  assert.strictEqual(S.HEDEF_SIRA, R.PROGRAM.refRank);
  assert.deepStrictEqual(Object.keys(S.HATA_TURLERI), Object.keys(R.ERROR_TAGS));
  Object.keys(R.ERROR_TAGS).forEach(k => {
    assert.strictEqual(S.HATA_TURLERI[k].ad, R.ERROR_TAGS[k].name);
    assert.strictEqual(S.HATA_TURLERI[k].recete, R.ERROR_TAGS[k].recipe);
  });
});
it('prova ve karma test sabitleri ogrentest.js, gidiş sabitleri gelecek.js, net kuralı state.js', () => {
  const ot = kaynak('AYS/src/js/core/ogrentest.js');
  ['TYT', 'AYT'].forEach(s => {
    const m = new RegExp(s + ":\\{ ad:[^,]+, dk:(\\d+), soru:(\\d+), sira:\\[([^\\]]+)\\]").exec(ot);
    assert.ok(m, s);
    assert.deepStrictEqual([S.PROVA[s].dk, S.PROVA[s].soru, S.PROVA[s].sira], [+m[1], +m[2], m[3].split(',').map(x => x.trim().replace(/'/g, ''))]);
  });
  assert.ok(/const BOYLAR = \[10, 20\];/.test(ot) && /const EN_AZ = 5;/.test(ot) && /const PROVA_BOY = \[20, 40\];/.test(ot));
  assert.deepStrictEqual([S.BOYLAR, S.EN_AZ, S.PROVA_BOY], [[10, 20], 5, [20, 40]]);
  assert.deepStrictEqual([S.GIDIS.MIN_DENEME, S.GIDIS.MIN_GUN, S.GIDIS.MAX_NET, S.GIDIS.UFUK_KAT], [GL.MIN_DENEME, GL.MIN_GUN, GL.MAX_NET, GL.UFUK_KAT]);
  assert.ok(/Number\(t\.wrong\|\|0\)\/4/.test(fonk('AYS/src/js/core/state.js', 'testNet')) && S.YANLIS_BOLEN === 4);
});

/* ================================================================ 2. eski vakalar */
it('net: doğru − yanlış/4; negatif olabilir; testler toplanır; boş dizide 0 (calc.test Calc.examNet)', () => {
  const n = e => S.denemeNet(S.GOC.aysDeneme(e));
  assert.strictEqual(n(makeExam({ correct:20, wrong:4 })), 19);
  assert.strictEqual(n(makeExam({ correct:30, wrong:0 })), 30);
  assert.strictEqual(n(makeExam({ correct:0, wrong:8 })), -2);
  assert.strictEqual(n(makeExam({ tests:[{ name:'Türkçe', correct:28, wrong:8, blank:4 }, { name:'Temel Matematik', correct:20, wrong:4, blank:16 }] })), 45);
  assert.strictEqual(S.denemeNet({ testler:[] }), 0);
});
it('medyan gidişi: son 3, önceki 3, fark; yalnız tam deneme; aileler ayrı (calc.test Calc.medianTrend)', () => {
  const g = (l, a) => S.medyanGidis(yeni(l), a || 'TYT');
  let t = g([]);
  assert.deepStrictEqual([t.son3.deger, t.fark.deger, t.adet.deger, t.son3.etiket], [null, null, 0, E.VERI_YOK]);
  assert.strictEqual(g([examWithNet('2026-09-19', 40), examWithNet('2026-09-26', 44)]).son3.deger, null);
  t = g([examWithNet('2026-09-19', 40), examWithNet('2026-09-26', 50), examWithNet('2026-10-03', 44)]);
  assert.deepStrictEqual([t.son3.deger, t.son3.etiket], [44, E.HESAPLANDI]);
  t = g([30, 32, 34, 40, 42, 44].map((v, i) => examWithNet('2026-09-' + (5 + 7 * i < 10 ? '0' : '') + (5 + 7 * i > 30 ? '30' : 5 + 7 * i), v)));
  t = g([['2026-09-05', 30], ['2026-09-12', 32], ['2026-09-19', 34], ['2026-09-26', 40], ['2026-10-03', 42], ['2026-10-10', 44]].map(x => examWithNet(x[0], x[1])));
  assert.deepStrictEqual([t.onceki3.deger, t.son3.deger, t.fark.deger], [32, 42, 10]);
  assert.strictEqual(g([40, 40, 40, 40, 40, 40].map((v, i) => examWithNet('2026-09-0' + (i + 1), v))).fark.deger, 0);
  assert.strictEqual(g([['2026-09-05', 50], ['2026-09-12', 50], ['2026-09-19', 50], ['2026-09-26', 44], ['2026-10-03', 44], ['2026-10-10', 44]].map(x => examWithNet(x[0], x[1]))).fark.deger, -6);
  t = g([examWithNet('2026-09-19', 40), makeExam({ date:'2026-09-20', kind:'branch', type:'Branş — Türkçe', tests:[{ name:'Türkçe', correct:38, wrong:0, blank:2 }] }),
    examWithNet('2026-09-26', 44), examWithNet('2026-10-03', 48)]);
  assert.deepStrictEqual([t.adet.deger, t.son3.deger], [3, 44]);
  const iki = [examWithNet('2026-09-19', 40, 'TYT'), examWithNet('2026-09-26', 44, 'TYT'), examWithNet('2026-10-03', 48, 'TYT'),
    examWithNet('2026-09-20', 12, 'AYT'), examWithNet('2026-09-27', 14, 'AYT'), examWithNet('2026-10-04', 16, 'AYT')];
  assert.deepStrictEqual([g(iki, 'TYT').son3.deger, g(iki, 'AYT').son3.deger], [44, 14]);
});
it('taban ve test medyanı (calc.test Calc.examBase, Calc.testMedian)', () => {
  assert.strictEqual(S.taban([], 'TYT').deger, null);
  assert.strictEqual(S.taban(yeni([examWithNet('2026-09-19', 40), examWithNet('2026-09-26', 36)]), 'TYT').deger, 36);
  assert.strictEqual(S.taban(yeni([10, 40, 44, 42, 46].map((v, i) => examWithNet('2026-09-1' + i, v))), 'TYT').deger, 40);
  const l = yeni([0, 1, 2, 3].map(idx => makeExam({ date:'2026-09-0' + (idx + 1), tests:[
    { name:'Türkçe', correct:20 + idx * 2, wrong:0, blank:0 }, { name:'Temel Matematik', correct:10, wrong:4, blank:0 }] })));
  assert.strictEqual(S.testMedyan(l, 'Türkçe', 'TYT').deger, 23);
  assert.strictEqual(S.testMedyan(l, 'Temel Matematik', 'TYT').deger, 9);
  assert.strictEqual(S.testMedyan(yeni([examWithNet('2026-09-19', 40)]), 'Yok Böyle Test', 'TYT').deger, null);
});
it('hata paretosu: azalan sıra, pay yüzde; boşta beş tür sıfır (calc.test Calc.errorPareto)', () => {
  const h = ['K', 'K', 'K', 'İ', 'İ', 'Y'].map((tag, i) => S.GOC.aysHata({ id:'r' + i, tag, createdAt:'2026-09-19T10:00:00Z' }));
  const p = S.hataPareto(h);
  assert.deepStrictEqual([p[0].tur, p[0].adet, p[0].pay, p[1].tur], ['K', 3, 50, 'İ']);
  const bos = S.hataPareto([]);
  assert.deepStrictEqual([bos.length, bos[0].adet], [5, 0]);
  assert.strictEqual(S.hataPareto([{ tur:'S', zaman:'2026-09-19T10:00:00Z' }]).filter(r => r.adet > 0).length, 1);
  assert.strictEqual(S.hataPareto(h, '2026-09-20').reduce((a, r) => a + r.adet, 0), 0);   // sinceISO süzgeci
});
it('OBP: 70→350/+42, 85→+51, 100→+60, yerleşmiş 0,06/+21, 250-500 kırpılır (calc.test Calc.obp)', () => {
  assert.deepStrictEqual([S.obp({ diploma:70 }).deger, S.obp({ diploma:70 }).katki], [350, 42]);
  assert.strictEqual(S.obp({ diploma:85 }).katki, 51);
  assert.strictEqual(S.obp({ diploma:100 }).katki, 60);
  assert.deepStrictEqual([S.obp({ diploma:70, yerlesti:true }).katsayi, S.obp({ diploma:70, yerlesti:true }).katki], [0.06, 21]);
  assert.strictEqual(S.obp({ diploma:10 }).deger, 250);
  assert.strictEqual(S.obp({ diploma:150 }).deger, 500);
});
it('sıra tablosu uçlarda kırpılır; puan tabanın altına düşmez; tam net ~500; 455,7 → 36-46 bin; 530 → 1900 (engine.test)', () => {
  assert.strictEqual(S.siraTahmini(600), 1);
  assert.strictEqual(S.siraTahmini(50), 900000);
  assert.strictEqual(S.hamPuan(-50, null).deger, S.PUAN.base);
  assert.ok(Math.abs(S.hamPuan(90, 60).deger - S.hamPuan(90, null).deger) < 1);
  assert.strictEqual(Math.round(S.hamPuan(120, 80).deger), 500);
  const r = S.siraTahmini(455.7);
  assert.ok(r > 36000 && r < 46000, r);
  assert.strictEqual(S.siraTahmini(530), 1900);
});
it('puan tahmini: 3 denemeden az yok; bant; deneme arttıkça daralır; sıra ters yönlü; yüksek net iyi sıra (engine.test)', () => {
  const t = (l, p) => S.puanTahmini(yeni(l), p || {});
  const yok = t([]);
  assert.deepStrictEqual([yok.ok, yok.konum, yok.etiket], [false, 'unknown', E.VERI_YOK]);
  const u = t(haftalik([40, 44, 42]));
  assert.ok(u.ok && u.ornek.deger === 3 && u.puan.alt < u.puan.deger && u.puan.ust > u.puan.deger);
  assert.strictEqual(u.etiket, E.TAHMIN); assert.strictEqual(u.sira.etiket, E.TAHMIN); assert.strictEqual(u.puan.etiket, E.TAHMIN);
  assert.ok(t(haftalik([40, 44, 42, 43, 45, 44, 46, 45])).puan.yarim < u.puan.yarim);
  const b = t(haftalik([50, 52, 51]));
  assert.ok(b.sira.enIyi < b.sira.enKotu);
  assert.ok(t(haftalik([70, 70, 70])).sira.deger < t(haftalik([30, 30, 30])).sira.deger);
  const gap = S.hedefFarki(t(haftalik([30, 30, 30])));
  assert.ok(gap && !gap.ulasti && gap.netFarki > 0 && gap.etiket === E.TAHMIN);
  const tyt = t(haftalik([45, 45, 45]));
  assert.ok(tyt.tur === 'TYT' && /AYT/.test(tyt.varsayim));
  assert.ok(Object.keys(S.KONUMLAR).indexOf(tyt.konum) >= 0 && tyt.konumAd.length > 0);
  const say = t(haftalik([45, 45, 45]).concat(haftalik([30, 30, 30], 'AYT')));
  assert.ok(say.tur === 'SAY' && !say.varsayim);
});
it('ayrıştırma: yan yana ya da numaralı; belirsiz girdi kaydedilmez, nedeni söylenir (denemeanaliz.test)', () => {
  const ANAHTAR = 'ABCDEABCDEABCD';
  assert.deepStrictEqual(S.ayristir('abcde abcde abcd', 14, 'anahtar'), { ok:true, dizi:ANAHTAR });
  assert.strictEqual(S.ayristir(Array.from(ANAHTAR).map((h, i) => (i + 1) + '-' + h).join(' '), 14, 'anahtar').dizi, ANAHTAR);
  assert.strictEqual(S.ayristir('1) A 2) B 3) C 4) D', 4, 'anahtar').dizi, 'ABCD');
  assert.strictEqual(S.ayristir('1.A 2.B 3.. 4.D', 4, 'cevap').dizi, 'AB.D');
  assert.strictEqual(S.ayristir('1-A 2-B 4-D', 4, 'cevap').dizi, 'AB.D');
  assert.strictEqual(S.ayristir('AB-D_', 5, 'cevap').dizi, 'AB.D.');
  assert.strictEqual(S.ayristir('ABC*', 4, 'anahtar').dizi, 'ABC*');
  [['ABCDE', 14, 'anahtar', '14 soru bekleniyordu, 5'], ['ABCDF', 5, 'anahtar', '«F»'], ['AB.DE', 5, 'anahtar', 'iptal'],
    ['AB*DE', 5, 'cevap', 'nokta'], ['1-A 2-B 4-D', 4, 'anahtar', '3'], ['1-A 1-B 2-C 3-D', 3, 'anahtar', 'iki kez'],
    ['1-A 2-B 9-C', 3, 'anahtar', '9. soru yok'], ['Deneme 3 A kitapçığı 1-B 2-C 4-D 5-E', 5, 'cevap', 'DENEME'], ['ABıCD', 5, 'anahtar', '«ı»']]
    .forEach(([m, q, t, h]) => assert.ok(S.ayristir(m, q, t).hata.indexOf(h) >= 0, m));
  assert.strictEqual(S.ayristir('', 3, 'anahtar').ok, false);
  assert.strictEqual(S.ayristir('1-A 2-B 3-C', 8, 'cevap').dizi, 'ABC.....');
  const sy = S.ayristir('1-A 5-C 9-D', 40, 'cevap');
  assert.deepStrictEqual([sy.ok, sy.dizi[0], sy.dizi[4], sy.dizi[8], sy.dizi[1]], [true, 'A', 'C', 'D', '.']);
  assert.strictEqual(S.ayristir('1 A 2 B', 2, 'anahtar').dizi, 'AB');
  assert.strictEqual(S.ayristir('1A2B3C', 3, 'anahtar').dizi, 'ABC');
  assert.strictEqual(S.ayristir('1-A 2-B 3-C', null, 'anahtar').dizi, 'ABC');
});
it('karşılaştırma: D/Y/B ve net kodla; iptal D/Y/B’ye girmez (denemeanaliz.test)', () => {
  const CEVAP = 'ABCDE..CDAABCE', s = S.karsilastir('ABCDEABCDEABCD', CEVAP);
  assert.deepStrictEqual([s.d, s.y, s.b, s.iptal, s.net], [10, 2, 2, 0, 9.5]);
  assert.deepStrictEqual(s.sorular.filter(x => x.durum === 'yanlis').map(x => x.no), [10, 14]);
  const i = S.karsilastir('ABCDEABCDEABC*', CEVAP);
  assert.deepStrictEqual([i.d, i.y, i.b, i.iptal], [10, 1, 2, 1]);
});
it('prova planı: kota soru oranıyla, süre ölçekli — TYT 20 → 7/3/7/3 28 dk, AYT 20 → 10/4/3/3 45 dk (prova.test)', () => {
  const ds = {};
  R.SUBJECTS.forEach(s => { ds[s.id] = s.questions; });
  const tyt = S.provaPlani('TYT', ds, 20);
  assert.deepStrictEqual(tyt.dersler.map(d => d.id + ':' + d.n), ['tyt-turkce:7', 'tyt-sosyal:3', 'tyt-matematik:7', 'tyt-fen:3']);
  assert.strictEqual(tyt.sureDk, 28);
  const ayt = S.provaPlani('AYT', ds, 20);
  assert.deepStrictEqual([ayt.dersler.map(d => d.n), ayt.sureDk], [[10, 4, 3, 3], 45]);
  assert.strictEqual(S.provaPlani('TYT', ds, 40).dersler.reduce((a, d) => a + d.n, 0), 40);
  assert.strictEqual(S.provaPlani('YOK', ds, 20), null);
});
it('gidiş: Theil–Sen aykırıya dayanır; aralık sıralı ve tahmin; az veride çizilmez; ufuk ≤ 3×; AYT tabanı; sınır (gelecek.test)', () => {
  const seri = (nets, adim) => nets.map((n, i) => ({ tarih:LIFEOS.TARIH.iso(LIFEOS.TARIH.addDays(LIFEOS.TARIH.parse('2026-09-01'), i * (adim || 7))), net:n }));
  assert.strictEqual(Math.round(S.theilSen([{ x:0, y:40 }, { x:7, y:42 }, { x:14, y:44 }, { x:21, y:10 }, { x:28, y:48 }]).egim * 7), 2);
  let z = S.izdusum(seri([40, 42, 44, 46, 48]), 'TYT', '2026-10-01', '2026-12-31');
  assert.ok(z.ok && z.etiket === E.TAHMIN && z.alt <= z.olasi && z.olasi <= z.ust && z.egimHafta === 2 && z.ust - z.alt > 0 && z.olasi > 46);
  z = S.izdusum(seri([40, 42, 44]), 'TYT', '2026-10-01', '2027-06-19');
  assert.ok(!z.ok && /en az 4/.test(z.neden));
  z = S.izdusum(seri([40, 42, 44, 46], 3), 'TYT', '2026-10-01', '2027-06-19');
  assert.ok(!z.ok && /14 güne/.test(z.neden));
  z = S.izdusum(seri([48.5, 46.5, 44.5, 42.5]), 'TYT', '2026-10-16', '2027-06-19');
  assert.ok(z.ok && !z.sinavaKadar && z.ufukGun === 3 * z.yayilim && z.olasi > 20 && z.ufukTarih < '2027-06-19' && z.gerekGun > 0);
  assert.ok(S.izdusum(seri([40, 42, 44, 46, 48, 50, 52, 54, 56, 58], 14), 'TYT', '2026-10-16', '2026-12-31').sinavaKadar);
  z = S.izdusum(seri([40, 42, 44, 46, 48]), 'AYT', '2026-10-01', '2026-10-15');
  assert.ok(Math.abs((z.ust - z.olasi) - S.PUAN.bandHalfWidth.some / (S.PUAN.ayt.perNet * S.PUAN.ayt.aytWeight)) < 0.11);
  z = S.izdusum(seri([100, 105, 110, 115, 118]), 'TYT', '2026-10-01', '2027-06-19');
  assert.ok(z.ust <= 120 && z.olasi <= 120);
});
it('süreli deneme: şablon, işaret no/süre, geri alma, sonraki test, duraklat, plan süresi, bitiş kaydı (features.test)', () => {
  const tmpl = S.GOC.aysSablon(R.EXAM_TEMPLATES.find(t => t.id === 'tyt-full'));
  assert.strictEqual(S.denemeBaslat(null, T0).ok, false);
  let o = S.denemeBaslat(tmpl, T0).oturum;
  assert.ok(o.testler.length === 4 && S.testSn(o, o.testler[0], T0) === 0);
  const a = S.isaretle(o, 'ok', T0 + 30000), b = S.isaretle(a.oturum, 'slow', T0 + 100000);
  assert.deepStrictEqual([a.isaret.no, b.isaret.no, b.isaret.tur, b.isaret.sure], [1, 2, 'slow', 70]);
  assert.strictEqual(S.isaretGeriAl(b.oturum).isaretler.length, 1);
  const n = S.sonrakiTest(o, T0 + 5 * DK);
  assert.ok(n.test.ad !== o.testler[0].ad && n.oturum.testler[0].bitti && n.oturum.testler[0].sn === 300);
  assert.strictEqual(S.duraklat(o, T0).durakBas, T0);
  assert.strictEqual(S.surdur(S.duraklat(o, T0), T0 + DK).durakBas, null);
  S.denemeOzeti(o, T0).testler.forEach(t => assert.ok(t.plan.deger > 0));
  const bit = S.denemeBitir(b.oturum, [{ dogru:30, yanlis:4, bos:6 }], T0 + 10 * DK);
  assert.ok(bit.deneme.sureli && bit.deneme.testler[0].dakika === 10 && bit.oturum.durum === 'bitti');
  assert.deepStrictEqual([bit.deneme.testler[0].bos, bit.deneme.testler[0].bosEtiket], [6, E.OLCULDU]);
  assert.deepStrictEqual([bit.deneme.testler[1].bos, bit.deneme.testler[1].bosEtiket], [20, E.HESAPLANDI]);   // yazılmadı: soru sayısından
});
it('sahibin 2026-11-01 kararı: sekme kapalı geçen 10 dk toplam, test ve kalana sayılır; yalnız elle duraklatma durdurur', () => {
  const tmpl = { id:'t', ad:'T', aile:'TYT', tur:'tam', sure:165, testler:[{ ad:'A', q:40 }, { ad:'B', q:40 }] };
  const o = S.denemeBaslat(tmpl, T0).oturum;     // oturum kaydı diske gider; sekme kapanır, 10 dk sonra açılır
  const k = T0 + 10 * DK;
  assert.deepStrictEqual([S.gecenSn(o, k), S.testSn(o, o.testler[0], k), S.kalanSure(o, k)], [600, 600, 165 * 60 - 600]);
  const d = S.duraklat(o, k);
  assert.strictEqual(S.gecenSn(d, T0 + 20 * DK), 600);
});

/* ================================================================ 3. fark testleri (eski kaynak × motor) */
it('fark: sıra ve ham puan 150-600 aralığında eski calc.js ile birebir', () => {
  for(let p = 150; p <= 600; p += 0.37) assert.strictEqual(S.siraTahmini(p), C.rankForScore(p), 'puan ' + p);
  for(let t = -10; t <= 125; t += 3.25) for(let a = -5; a <= 85; a += 7.5){
    assert.deepStrictEqual([S.hamPuan(t, a).deger, S.hamPuan(t, a).tur], [C.rawScore(t, a).value, C.rawScore(t, a).kind]);
    assert.strictEqual(S.hamPuan(t, null).deger, C.rawScore(t, null).value);
  }
});
it('fark: 300 rastgele deneme geçmişinde puan tahmini, sıra bandı, konum ve hedef farkı eski calc.js ile birebir', () => {
  const rnd = tohum(7), hedefler = [undefined, 5000, 84285, 300000];
  for(let k = 0; k < 300; k++){
    const l = [];
    ['TYT', 'AYT'].forEach((fam, fi) => {
      const say = Math.floor(rnd() * (fi ? 8 : 11));
      for(let i = 0; i < say; i++){
        const max = fam === 'TYT' ? 120 : 80, c = Math.floor(rnd() * max), w = Math.floor(rnd() * (max - c + 1));
        l.push(makeExam({ date:'2026-' + String(1 + Math.floor(rnd() * 12)).padStart(2, '0') + '-' + String(1 + Math.floor(rnd() * 28)).padStart(2, '0'),
          family:fam, kind:rnd() < 0.85 ? 'full' : 'branch', tests:[{ name:'X', correct:c, wrong:w, blank:0 }] }));
      }
    });
    const prof = { diplomaGrade:50 + Math.floor(rnd() * 51), previouslyPlaced:rnd() < 0.3, targetRank:hedefler[Math.floor(rnd() * 4)] };
    R.S.exams = l; R.S.profile = prof;
    const a = C.estimateScore(), b = S.puanTahmini(yeni(l), { diploma:prof.diplomaGrade, yerlesti:prof.previouslyPlaced, hedefSira:prof.targetRank });
    assert.strictEqual(b.ok, a.ok);
    assert.strictEqual(b.ornek.deger, a.samples);
    if(!a.ok) continue;
    assert.deepStrictEqual([b.tur, b.puan.deger, b.puan.alt, b.puan.ust, b.puan.yarim, b.sira.deger, b.sira.enIyi, b.sira.enKotu, b.konum, b.hedefSira, b.obp.deger, !!b.varsayim],
      [a.kind, a.score, a.scoreLow, a.scoreHigh, a.halfWidth, a.rank, a.rankBest, a.rankWorst, a.position, a.targetRank, a.obp, !!a.assumption], 'geçmiş ' + k);
    const ga = C.netGapToTarget(), gb = S.hedefFarki(b);
    assert.deepStrictEqual(gb && [gb.gerekPuan, gb.puanFarki, gb.netFarki, gb.ulasti], ga && [ga.needScore, ga.scoreDiff, ga.netDiff, ga.reached]);
  }
  R.S.exams = []; R.S.profile = {};
});
it('fark: 3000 rastgele anahtar/cevap metninde ayrıştırma ve karşılaştırma eski denemeanaliz.js ile birebir', () => {
  const rnd = tohum(11), harf = ['A', 'B', 'C', 'D', 'E', 'a', 'e', '*', '.', '-', '_', ' ', ' ', '1', '2', '3', '0', '9', ')', '-', 'ı', 'F', '\n', ','];
  const qlar = [null, 0, 3, 4, 5, 14];
  for(let k = 0; k < 3000; k++){
    let m = '';
    const n = Math.floor(rnd() * 18);
    for(let i = 0; i < n; i++) m += harf[Math.floor(rnd() * harf.length)];
    const q = qlar[Math.floor(rnd() * qlar.length)], t = rnd() < 0.5 ? 'anahtar' : 'cevap';
    assert.deepStrictEqual(S.ayristir(m, q, t), DA.ayristir(m, q, t), JSON.stringify([m, q, t]));
  }
  for(let k = 0; k < 500; k++){
    const n = 1 + Math.floor(rnd() * 20);
    let a = '', c = '';
    for(let i = 0; i < n; i++){ a += 'ABCDE*'[Math.floor(rnd() * 6)]; c += 'ABCDE.'[Math.floor(rnd() * 6)]; }
    const x = S.karsilastir(a, c), y = DA.karsilastir(a, c);
    assert.deepStrictEqual([x.sorular, x.d, x.y, x.b, x.iptal, x.net], [y.sorular, y.d, y.y, y.b, y.iptal, y.net]);
  }
});
it('fark: boş sayısı kuralı ve net eski state.js ile birebir', () => {
  const hamlar = [null, undefined, '', '  ', '3', '-1', 'x', 4, 0, 2.6];
  [0, 5, 20, 40].forEach(c => [0, 3, 30].forEach(w => hamlar.forEach(h => [null, 0, 20, 40, 'q'].forEach(q => {
    const a = R.Model.blankCertainty(c, w, h, q), b = S.bosBelirle(c, w, h, q);
    assert.deepStrictEqual([b.bos, b.etiket], [a.blank, { measured:E.OLCULDU, derived:E.HESAPLANDI, missing:E.VERI_YOK }[a.blankCert]]);
    assert.strictEqual(S.testNet({ dogru:c, yanlis:w }), R.Model.testNet({ correct:c, wrong:w }));
  }))));
});
it('fark: 200 rastgele seride gidiş izdüşümü eski gelecek.js ile birebir', () => {
  const rnd = tohum(23), T = LIFEOS.TARIH;
  for(let k = 0; k < 200; k++){
    const n = 3 + Math.floor(rnd() * 9), adim = 2 + Math.floor(rnd() * 13), aile = rnd() < 0.5 ? 'TYT' : 'AYT', seri = [];
    let net = 20 + rnd() * 50;
    for(let i = 0; i < n; i++){ net += (rnd() - 0.4) * 6; seri.push({ tarih:T.iso(T.addDays(T.parse('2026-09-01'), i * adim)), net:Math.round(net * 4) / 4 }); }
    const bugun = T.iso(T.addDays(T.parse('2026-09-01'), n * adim)), sinav = ['2026-12-31', '2027-06-19', '2026-09-15'][Math.floor(rnd() * 3)];
    const a = GL.izdusum(seri, aile, bugun, sinav), b = S.izdusum(seri, aile, bugun, sinav);
    assert.strictEqual(b.ok, a.ok, 'seri ' + k);
    if(!a.ok) continue;
    ['n', 'yayilim', 'kalanGun', 'ufukGun', 'sinavaKadar', 'ufukTarih', 'gerekGun', 'duzey', 'egimHafta', 'sapma', 'alt', 'olasi', 'ust', 'max']
      .forEach(f => assert.strictEqual(b[f], a[f], 'seri ' + k + ' ' + f));
  }
});
it('fark: süreli deneme saati, işaretler ve özet eski examrun.js ile birebir (aynı sahte saatle)', async () => {
  const g = Date.now;
  let simdi = T0;
  Date.now = () => simdi;
  try{
    X.cancel(); await X.flush();
    X.start('tyt-full', { date:'2026-11-13' });
    let o = S.denemeBaslat(S.GOC.aysSablon(R.EXAM_TEMPLATES.find(t => t.id === 'tyt-full')), simdi, { tarih:'2026-11-13' }).oturum;
    const adim = [[45, 'ok'], [130, 'slow'], [20, 'ok'], [0, 'pause'], [300, 'resume'], [70, 'skip'], [10, 'next'], [95, 'ok'],
      [600, 'kapat'], [40, 'ok'], [1200, 'ok'], [30, 'slow'], [5, 'git0'], [61, 'ok'], [15, 'undo'], [800, 'next'], [33, 'ok']];
    for(const [sn, is] of adim){
      simdi += sn * 1000;
      if(is === 'pause'){ X.pause(); o = S.duraklat(o, simdi); }
      else if(is === 'resume'){ X.resume(); o = S.surdur(o, simdi); }
      else if(is === 'next'){ X.nextTest(); o = S.sonrakiTest(o, simdi).oturum; }
      else if(is === 'git0'){ X.gotoTest(0); o = S.testeGit(o, 0, simdi); }
      else if(is === 'undo'){ X.undoMark(); o = S.isaretGeriAl(o); }
      else if(is === 'kapat'){ await X.flush(); X.unutDurum(); assert.ok(await X.restore()); }   // sekme kapandı, açıldı
      else { const m = X.mark(is), r = S.isaretle(o, is, simdi); o = r.oturum; assert.deepStrictEqual([r.isaret.no, r.isaret.at, r.isaret.sure], [m.no, m.at, m.spent]); }
      assert.deepStrictEqual([S.gecenSn(o, simdi), S.testSn(o, S.GOC && o.testler[o.sira], simdi), S.kalanSure(o, simdi)], [X.elapsedTotal(), X.elapsedTest(), X.remaining()], is);
    }
    const a = X.summary(), b = S.denemeOzeti(o, simdi);
    assert.deepStrictEqual([b.toplamSn.deger, b.asimSn.deger, b.isaret.deger, b.zor.deger, b.atlanan.deger, b.medyanSn.deger, b.erkenOran.deger, b.gecOran.deger, b.isinma],
      [a.totalSeconds, a.overtime, a.marks, a.slow, a.skipped, a.medianSpent, a.earlyRate, a.lateRate, !!a.warmup]);
    assert.deepStrictEqual(b.testler.map(t => [t.sn.deger, t.plan.deger, t.sapma.deger]), a.perTest.map(t => [t.seconds, t.planned, t.drift]));
    assert.deepStrictEqual(b.enYavas.map(m => [m.test, m.no, m.sure]), a.slowest.map(m => [m.test, m.no, m.spent]));
    X.cancel(); await X.flush();
  }finally{ Date.now = g; }
});

/* ================================================================ 4. motorun kendi sözleri */
const sq = (id, dogru, ek) => Object.assign({ id, tur:'secmeli', soru:'Soru ' + id, sec:['a', 'b', 'c', 'd'], dogru, durum:'onayli', konu:'k' + id.length, ders:'d' }, ek || {});
it('soru modeli: seçmeli, iki seçenekli doğru/yanlış, açık uçlu; AYS içerik sorusu geçer, taslak olur', () => {
  assert.deepStrictEqual(S.kontrol(sq('s', 'B'), 'b'), { ok:true, dogru:true });
  assert.deepStrictEqual(S.kontrol(sq('s', 'B'), 'C'), { ok:true, dogru:false });
  assert.strictEqual(S.kontrol(sq('s', 'B'), 'E').ok, false);                     // 4 seçenekte E yok
  assert.strictEqual(S.kontrol(sq('s', 'B'), '').ok, false);
  assert.deepStrictEqual(S.kontrol({ soru:'Dünya düzdür.', sec:['Doğru', 'Yanlış'], dogru:'B' }, 'B'), { ok:true, dogru:true });
  const acik = { tur:'acik', soru:'Açıkla', dogru:'örnek', olcut:['tanım', 'örnek'] };
  assert.deepStrictEqual(S.kontrol(acik, 'cevabım'), { ok:true, dogru:null, olcut:['tanım', 'örnek'] });
  assert.ok(/ölçüt/.test(S.soruDenetle({ tur:'acik', soru:'x', dogru:'y' })));
  assert.ok(/tür/.test(S.soruDenetle({ tur:'eslestirme', soru:'x' })));
  assert.ok(/anahtar/.test(S.soruDenetle({ soru:'x', sec:['a', 'b'], dogru:'C' })));
  require(path.join(ESKI, 'AYS/src/js/data/derin-af.js'));
  const konu = Object.keys(R.KONU_DERIN)[0], q = S.GOC.aysSoru(R.KONU_DERIN[konu].sorular[0], konu + '#0', konu, 'ayt-fizik');
  assert.strictEqual(S.soruDenetle(q), null);
  assert.strictEqual(q.durum, 'taslak');
});
it('karma test: havuz 5ten azsa kurulmaz; aynı konu ard arda gelmez; aynı tohum aynı sıra; rnd ve simdi zorunlu', () => {
  const h = Array.from({ length:12 }, (_, i) => ({ id:'q' + i, konu:'k' + (i % 3) }));
  assert.deepStrictEqual(S.alistirmaKur(h.slice(0, 4), 10, T0, tohum(1)), { ok:false, neden:'az', n:4 });
  const a = S.alistirmaKur(h, 10, T0, tohum(5)), b = S.alistirmaKur(h, 10, T0, tohum(5));
  assert.deepStrictEqual(a, b);
  assert.strictEqual(a.oturum.sorular.length, 10);
  const konu = id => h.find(x => x.id === id).konu;
  // ogrentest.js:174-185 açgözlü serpiştirme: tekrar yalnız sonda, başka konu kalmayınca olur
  const ks = a.oturum.sorular.map(konu);
  ks.forEach((k, i) => { if(i && k === ks[i - 1]) assert.ok(ks.slice(i).every(x => x === k), 'ortada ard arda konu: ' + ks); });
  [5, 6, 7, 8, 9].forEach(t => { const s = S.alistirmaKur(h, 10, T0, tohum(t)).oturum.sorular.map(konu);
    s.forEach((k, i) => { if(i && k === s[i - 1]) assert.ok(s.slice(i).every(x => x === k)); }); });
  assert.throws(() => S.alistirmaKur(h, 10, T0), TypeError);
  assert.throws(() => S.alistirmaKur(h, 10, undefined, tohum(1)), TypeError);
});
it('alıştırma: ilk cevap kilitlenir; çözüme bakılan doğru sayılmaz; cevapsız boş; girdi oturum değişmez', () => {
  const soz = { a:sq('a', 'A'), b:sq('b', 'B'), c:sq('c', 'C'), d:{ id:'d', tur:'acik', soru:'?', dogru:'x', olcut:['o'] } };
  const o = Object.freeze(S.oturumKur(['a', 'b', 'c', 'd'], T0));
  let r = S.cevapla(o, 0, 'a', soz, T0 + 1000, { sure:12.4 });
  assert.ok(r.ok && r.dogru === true && r.oturum.cevaplar[0].sure === 12 && !o.cevaplar[0]);
  assert.strictEqual(S.cevapla(r.oturum, 0, 'B', soz, T0 + 2000).neden, 'kilitli');
  let y = S.bak(r.oturum, 1, T0 + 3000).oturum;
  y = S.cevapla(y, 3, 'serbest', soz, T0 + 4000).oturum;
  const { sonuc, ozet } = S.oturumBitir(y, soz, T0 + 5000);
  assert.deepStrictEqual(ozet.sayilar, { toplam:4, dogru:1, yanlis:0, bakildi:1, bos:1, acik:1 });
  assert.deepStrictEqual([ozet.ortSure.deger, ozet.ortSure.etiket], [12, E.OLCULDU]);
  assert.ok(sonuc.sorular[2].bos);
});
it('prova: doğru/yanlış dönmez, çözüme bakılmaz, süre dolunca cevap alınmaz; net doğru − yanlış/4, ders ders ÖSYM sırasıyla', () => {
  const soz = {};
  const havuz = { 'tyt-turkce':[], 'tyt-sosyal':[], 'tyt-matematik':[], 'tyt-fen':[] };
  Object.keys(havuz).forEach(d => { for(let i = 0; i < 12; i++){ const id = d + '#' + i; soz[id] = sq(id, 'A', { ders:d, konu:d + (i % 4), seviye:i < 3 ? 'temel' : 'orta' }); havuz[d].push({ id, konu:soz[id].konu, seviye:soz[id].seviye }); } });
  const plan = S.provaPlani('TYT', { 'tyt-turkce':40, 'tyt-sosyal':20, 'tyt-matematik':40, 'tyt-fen':20 }, 20);
  const k = S.provaKur(plan, havuz, T0, tohum(3));
  assert.ok(k.ok && k.oturum.sorular.length === 20 && k.oturum.sureDk === 28 && k.eksik.length === 0);
  assert.ok(k.oturum.sorular.every(id => soz[id].seviye !== 'temel'));               // sınav tarzı yetti
  let o = k.oturum;
  const r = S.cevapla(o, 0, 'A', soz, T0 + DK);
  assert.ok(r.ok && !('dogru' in r));
  assert.strictEqual(S.bak(o, 1, T0).neden, 'prova');
  o = r.oturum;
  for(let i = 1; i < 6; i++) o = S.cevapla(o, i, 'B', soz, T0 + 2 * DK).oturum;
  assert.strictEqual(S.kalanSn(o, T0 + 28 * DK), 0);
  assert.strictEqual(S.cevapla(o, 7, 'A', soz, T0 + 28 * DK).neden, 'sure');           // sekme kapalı geçen süre de sayıldı
  const oz = S.oturumBitir(o, soz, T0 + 28 * DK).ozet;
  assert.deepStrictEqual([oz.prova.net.deger, oz.prova.net.etiket, oz.prova.kullanilanDk.deger], [1 - 5 / 4, E.HESAPLANDI, 28]);
  assert.deepStrictEqual(oz.prova.dersler.map(d => d.ders), ['tyt-turkce', 'tyt-sosyal', 'tyt-matematik', 'tyt-fen']);
  assert.strictEqual(S.kalanSn(S.oturumKur(['x'], T0), T0), null);
});
it('Yanlışlarım: son deneme doğru değilse listede; yeniden doğru çözülünce düşer; en yenisi önce', () => {
  const soz = { a:sq('a', 'A'), b:sq('b', 'B'), c:sq('c', 'C') };
  const l = [{ id:'a', h:'C', at:1 }, { id:'a', h:'A', at:5 }, { id:'b', h:'B', at:2 }, { id:'b', h:'D', at:6 }, { id:'c', bak:true, at:3 }, { id:'yok', h:'A', at:9 }];
  assert.deepStrictEqual(S.yanlislarim(l, soz).map(x => x.id), ['b', 'c']);
});
it('deneme analizi: kayıt değişmez, anahtar farkı söylenir; konu ve hata türü bağlı hatalardan; her sayı etiketli', () => {
  const e = S.GOC.aysDeneme(Object.assign(makeExam({ id:'d1', type:'Branş — AYT Fizik', family:'AYT', kind:'branch',
    tests:[{ name:'Fizik', correct:9, wrong:3, blank:2, blankCert:'measured', minutes:null }] }), { anahtar:{ Fizik:'ABCDEABCDEABCD' }, cevaplar:{ Fizik:'ABCDE..CDAABCE' } }));
  const h = [{ id:'h1', tur:'K', denemeId:'d1', ders:'ayt-fizik', konu:'af-12' }, { id:'h2', tur:'İ', denemeId:'d1', ders:'ayt-fizik', konu:'af-12' },
    { id:'h3', tur:'K', denemeId:'d1', ders:'ayt-fizik', konu:'af-01' }, { id:'h4', tur:'K', denemeId:'baska' }];
  const a = S.denemeAnalizi(e, h);
  assert.ok(a.fark && a.testler[0].fark && a.testler[0].anahtarli.d === 10 && e.testler[0].dogru === 9);
  assert.deepStrictEqual([a.net.deger, a.testler[0].bos.etiket, a.testler[0].dakika.etiket], [8.25, E.OLCULDU, E.VERI_YOK]);
  assert.deepStrictEqual(a.konular.map(k => [k.konu, k.adet]), [['af-12', 2], ['af-01', 1]]);
  assert.deepStrictEqual(a.hata.slice(0, 2).map(r => [r.tur, r.adet]), [['K', 2], ['İ', 1]]);
  const f = S.denemeFarki(e, S.GOC.aysDeneme(makeExam({ tests:[{ name:'Fizik', correct:11, wrong:2, blank:1 }] })));
  assert.deepStrictEqual([f.fark, f.enBuyuk.ad, f.enBuyuk.fark, f.satirlar[0].isabetA], [2.25, 'Fizik', 2.25, 75]);
});
it('etiketsiz sayı çıkmaz: tahmin, analiz, özetlerde her sayı etiketli bir nesnenin içinde', () => {
  const degerler = new Set(Object.values(E));
  function bak(o, yol, etiketli){
    if(typeof o === 'number') return assert.ok(etiketli, 'etiketsiz sayı: ' + yol);
    if(!o || typeof o !== 'object') return;
    const e = etiketli || degerler.has(o.etiket);
    Object.keys(o).forEach(k => bak(o[k], yol + '.' + k, e));
  }
  const l = yeni(haftalik([40, 44, 42, 45, 47]).concat(haftalik([30, 31, 33], 'AYT')));
  const pt = S.puanTahmini(l, { diploma:80 });
  bak(pt, 'puanTahmini'); bak(S.hedefFarki(pt), 'hedefFarki'); bak(S.medyanGidis(l, 'TYT'), 'medyanGidis');
  bak(S.denemeAnalizi(l[0], []), 'denemeAnalizi'); bak(S.izdusum(S.gidisSerisi(l, 'TYT'), 'TYT', '2026-12-01', '2027-06-19'), 'izdusum');
  const o = S.denemeBaslat(S.GOC.aysSablon(R.EXAM_TEMPLATES[0]), T0).oturum;
  bak(S.denemeOzeti(S.isaretle(o, 'ok', T0 + 9000).oturum, T0 + DK), 'denemeOzeti');
  bak(S.oturumBitir(S.oturumKur(['a'], T0), { a:sq('a', 'A') }, T0).ozet, 'sonucOzeti');
  assert.strictEqual(pt.sira.etiket, E.TAHMIN);
});
it('Yol bağı: alıştırma cevapları Yol.kapiDene girdisi olur; çözüme bakılan yanlış sayılır, eşiği Yol verir', () => {
  const k = id => sq(id, 'A', { yazan:'x', kaynak:['k'] });
  const y = Yol.yukle({ id:'as', ad:'A', kapi:{ esik:0.75, sorular:[k('z1'), k('z2'), k('z3')] },
    uniteler:[{ id:'u1', ad:'U', kapi:{ esik:0.75, sorular:[k('g1'), k('g2'), k('g3'), k('g4')] }, dersler:[] }] });
  const soz = { g1:k('g1'), g2:k('g2'), g3:k('g3'), g4:k('g4') };
  let o = S.oturumKur(['g1', 'g2', 'g3', 'g4'], T0);
  ['A', 'A', 'A'].forEach((h, i) => { o = S.cevapla(o, i, h, soz, T0).oturum; });
  o = S.bak(o, 3, T0).oturum;
  const gir = S.yolGirdisi(S.oturumBitir(o, soz, T0).sonuc);
  assert.deepStrictEqual(gir.cevaplar, { g1:'A', g2:'A', g3:'A' });
  const r = Yol.kapiDene(y, Yol.bosKayit(), 'u1', gir.cevaplar, T0);
  assert.deepStrictEqual([r.sonuc.dogruSayisi, r.sonuc.toplam, r.sonuc.gecti], [3, 4, true]);
});
it('Tekrar bağı: yanlış ve bakılan onaylı sorudan kart önerisi; taslaktan asla; öneri Tekrar.plan\'a girer', () => {
  const soz = { a:sq('a', 'A'), b:sq('b', 'B'), t:sq('t', 'C', { durum:'taslak' }), ok:sq('ok', 'D') };
  const sonuc = { sorular:[{ id:'a', h:'B', at:1 }, { id:'b', bak:true, at:2 }, { id:'t', h:'A', at:3 }, { id:'ok', h:'D', at:4 }, { id:'a', h:'C', at:5 }, { id:'x', bos:true }] };
  const r = S.tekrarOnerileri(sonuc, soz);
  assert.deepStrictEqual(r.oneriler.map(o => o.id), ['soru:a', 'soru:b']);
  assert.deepStrictEqual(r.disarida.map(o => o.id), ['t']);
  assert.strictEqual(r.oneriler[0].ek.arka, 'A) a');
  const kartlar = r.oneriler.map(o => Tekrar.yeniKart(o.id, o.ek));
  assert.deepStrictEqual(Tekrar.plan(kartlar, T0).yeni.map(c => c.id), ['soru:a', 'soru:b']);
});
it('saflık: saat ve rastgele dışarıdan; dondurulmuş girdiyle çalışır', () => {
  ['gecenSn', 'kalanSn', 'oturumKur', 'duraklat'].forEach(f => assert.throws(() => S[f]({ testler:[], sure:1, bas:0, durakMs:0 }), TypeError, f));
  const derin = o => { Object.values(o).forEach(v => v && typeof v === 'object' && derin(v)); return Object.freeze(o); };
  const o = derin(S.denemeBaslat({ id:'t', ad:'T', aile:'TYT', tur:'tam', sure:10, testler:[{ ad:'A', q:5 }, { ad:'B', q:5 }] }, T0).oturum);
  S.denemeBitir(S.sonrakiTest(S.isaretle(o, 'ok', T0 + 5000).oturum, T0 + 9000).oturum, [], T0 + DK);
});

/* Modül boşlukları (faz1-modul-bosluklari.md): gerçek AYS gün kaydının biçimi, değerler uydurma. */
it('göç AYS gün soruları: yalnız çözülmüş kalem yazılır; toplam AYS gunSorusu ile aynı; soru alanlarının hepsi okunur ya da EKSIK\'te', () => {
  const blok = (id, o) => Object.assign({ id, slot:'Ana ders', subject:'Ders', subjectId:'tyt-mat', topic:'Konu', topicId:'m-sayi', targetMin:75, targetQ:15,
    status:'done', skipReason:null, actualMin:70, actualQ:null, correctQ:null, startedAt:null }, o);
  const gun = { id:'g1', date:'2026-11-02', dow:0, ritual:null, paragraphTarget:18, paragraphActual:12, problemTarget:18, problemActual:null,
    freeQ:10, freeCorrect:7, sleepHours:null, note:'', checklist:{}, distractions:0, badDay:false,
    blocks:[blok('b0', { actualQ:30, correctQ:24 }), blok('b1', { actualQ:0, correctQ:0 }), blok('b2', { slot:'Dinlenme', targetQ:0, actualMin:null })] };
  const r = S.GOC.aysGun(gun);
  assert.deepStrictEqual([r.id, r.tarih, r.etiket], ['ays:gun:2026-11-02', '2026-11-02', 'eski kayıt']);
  assert.deepStrictEqual(r.kalemler.map(k => [k.kalem, k.hedef, k.cozulen, k.dogru]), [['blok', 15, 30, 24], ['paragraf', 18, 12, null], ['serbest', null, 10, 7]]);
  assert.deepStrictEqual([r.kalemler[0].ders, r.kalemler[0].konu, r.kalemler[0].blok], ['tyt-mat', 'm-sayi', 'b0']);
  assert.strictEqual(r.kalemler.reduce((s, k) => s + k.cozulen, 0), R.Calc.gunSorusu(gun));
  const bos = Object.assign({}, gun, { paragraphActual:null, freeQ:0, freeCorrect:0, blocks:[blok('b0', { status:'pending', actualMin:null })] });
  assert.strictEqual(S.GOC.aysGun(bos), null);
  assert.strictEqual(R.Calc.gunSorusu(bos), 0);
  assert.strictEqual(S.GOC.aysGun({ blocks:[] }), null);
  const bilinen = String(S.GOC.aysGun) + ' ' + S.EKSIK.aysGun.join(' ');
  ['paragraphTarget', 'paragraphActual', 'problemTarget', 'problemActual', 'freeQ', 'freeCorrect', 'targetQ', 'actualQ', 'correctQ', 'badDayTargets', 'badDaySoruYok']
    .forEach(a => assert.ok(new RegExp('[^\\w$]' + a + '[^\\w$]').test(bilinen), a));
});

(async () => {
  let kirmizi = 0;
  for(const [ad, f] of testler){
    try{ await f(); console.log('✓ ' + ad); }
    catch(e){ kirmizi++; console.log('✕ ' + ad + '\n    ' + (e && e.message || e).toString().split('\n').slice(0, 6).join('\n    ')); }
  }
  console.log((kirmizi ? '✕ ' : '✓ ') + (testler.length - kirmizi) + '/' + testler.length + ' test geçti');
  process.exit(kirmizi ? 1 : 0);
})();
