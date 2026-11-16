// Sağlık panosu (kabuk/saglik.js) saf kısım: node kabuk/saglik.test.js  (✓/✕, çıkış 0/1)
'use strict';
const fs = require('fs'), path = require('path'), a = require('assert');
const S = require('./saglik.js');
const Kayit = require('../motor/kayit.js');

let gecen = 0, kalan = 0;
function t(ad, f) { try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); } }
const kay = (tur, girdi, gun, zaman) => { const r = Kayit.kaydet(tur, girdi, { gun, zaman: zaman || null }); a.ok(r.ok, (r.hatalar || []).join(' ')); return r.kayit; };
const B = '2026-11-16';

t('boş kayıt: dört satır da «veri yok», eğilim ve tahlil boş (uydurma yok)', () => {
  const p = S.pano(Kayit, [], B);
  a.deepStrictEqual(p.bugun.map(x => [x.id, x.metin, x.d.k]), [['ogun', null, 'missing'], ['hareket', null, 'missing'], ['uyku', null, 'missing'], ['kilo', null, 'missing']]);
  a.deepStrictEqual([p.egilim, p.tahliller], [[], []]);
});
t('bugün: öğün sayısı ve son öğün, hareket toplamı, gece uykusu, son kilo ve günü; etiketler motordan', () => {
  const l = [kay('ogun', { icerik: 'yulaf ve ceviz' }, B, 1), kay('ogun', { icerik: 'mercimek çorbası' }, B, 2), kay('hareket', { dk: '30' }, B, 3), kay('hareket', { dk: '15' }, B, 4),
    kay('uyku', { saat: { v: '7,5', k: 'estimated' } }, B), kay('kilo', { kg: '72,4' }, '2026-11-12'), kay('kilo', { kg: '90' }, '2026-11-17')];
  const p = S.pano(Kayit, l, B), x = {}; p.bugun.forEach(s => { x[s.id] = s; });
  a.deepStrictEqual([x.ogun.metin, x.ogun.d.k], ['2 öğün · son: mercimek çorbası', 'computed']);
  a.deepStrictEqual([x.hareket.metin, x.hareket.d.k], ['45 dk · 2 seans', 'computed']);
  a.deepStrictEqual([x.uyku.metin, x.uyku.d.k], ['7,5 saat', 'estimated']);
  a.deepStrictEqual([x.kilo.metin, x.kilo.gun, x.kilo.d.k], ['72,4 kg', '2026-11-12', 'measured'], 'gelecekteki kilo okunmaz');
});
t('son 7 gün: yalnız kaydı olan ölçü; kayıtsız gün nokta, ortalama yalnız kayıtlı günlerden', () => {
  const l = [kay('uyku', { saat: '6' }, '2026-11-10'), kay('uyku', { saat: '8' }, B), kay('hareket', { dk: '20' }, '2026-11-14')];
  const p = S.pano(Kayit, l, B);
  a.deepStrictEqual(p.egilim.map(x => x.ad), ['Hareket', 'Gece uykusu']);
  const u = p.egilim[1];
  a.deepStrictEqual([u.cubuk, u.gun, u.ozet.metin, u.ozet.k], ['▁·····█', 2, 'ort. 7 saat', 'computed']);
  a.strictEqual(p.bas, '2026-11-10');
});
t('çubuk: hepsi aynıysa orta basamak, hiç değer yoksa null', () => {
  a.strictEqual(S.cubuk([5, null, 5]), '▄·▄');
  a.strictEqual(S.cubuk([null, null]), null);
});
t('tahliller panoya motorun listesiyle gelir', () => {
  const p = S.pano(Kayit, [kay('tahlil', { belirtec: 'ferritin', deger: '20', refAlt: '30' }, B)], B);
  a.deepStrictEqual([p.tahliller[0].belirtec, p.tahliller[0].son.konum], ['Ferritin', 'alt']);
});
t('index.html: saglik.js kabuk.js\'ten önce yüklenir', () => {
  const h = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), i = h.indexOf('src="saglik.js"');
  a.ok(i > 0 && i < h.indexOf('src="kabuk.js"'));
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
