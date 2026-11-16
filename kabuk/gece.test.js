// Ambiyans sesi (kabuk/gece.js) saf parçalar: node kabuk/gece.test.js  (✓/✕, çıkış 0/1)
'use strict';
const G = require('./gece.js');

let gecen = 0, kalan = 0;
function t(ad, f) { try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); } }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
function rnd(tohum) { let s = tohum; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function bir(dk, r, kip) { let d = null, l = []; for (let s = 0; s < dk * 60; s += 1) { const p = G.plan(d, s, 2.5, r, kip); d = p.durum; l = l.concat(p.olaylar); } return l; }

t('kip: açıkken saate göre (06–20 gündüz), seçilen kip saati ezer', () => {
  dogru(G.kipSec('acik', 5) === 'gece' && G.kipSec('acik', 6) === 'gunduz' && G.kipSec('acik', 19) === 'gunduz' && G.kipSec('acik', 20) === 'gece');
  dogru(G.kipSec('gece', 12) === 'gece' && G.kipSec('gunduz', 2) === 'gunduz');
});
t('plan: olaylar pencerede ve sıralı; aynı olay iki kez gelmez (iki kipte de)', () => {
  ['gece', 'gunduz'].forEach(kip => {
    const p = G.plan(null, 10, 2.5, rnd(7), kip);
    dogru(p.olaylar.every(o => o.t >= 10 && o.t < 12.5) && p.olaylar.every((o, i, l) => !i || l[i - 1].t <= o.t), kip);
    const l = bir(2, rnd(3), kip), k = l.map(o => o.tur + o.i + o.t.toFixed(4));
    dogru(new Set(k).size === k.length, 'tekrar eden olay ' + kip);
  });
});
t('gece: on dakikada cırcır sık, kurbağa seyrek, baykuş çok seyrek; gündüz sesi yok', () => {
  const l = bir(10, rnd(11), 'gece'), say = tur => l.filter(o => o.tur === tur).length;
  dogru(say('cir') > 1000 && say('cir') < 2100, 'cır ' + say('cir'));
  dogru(say('kurbaga') >= 35 && say('kurbaga') <= 90, 'kurbağa ' + say('kurbaga'));
  dogru(say('baykus') >= 5 && say('baykus') <= 16, 'baykuş ' + say('baykus'));
  dogru(!say('kus') && !say('guguk'));
});
t('gündüz: kuşlar 3–9 sn arayla, guguk seyrek; gece sesi yok', () => {
  const l = bir(10, rnd(13), 'gunduz'), say = tur => l.filter(o => o.tur === tur).length;
  dogru(say('kus') >= 180 && say('kus') <= 400, 'kuş ' + say('kus'));
  dogru(say('guguk') >= 8 && say('guguk') <= 26, 'guguk ' + say('guguk'));
  dogru(!say('cir') && !say('baykus'));
  [0, 1, 2].forEach(i => { const z = l.filter(o => o.tur === 'kus' && o.i === i).map(o => o.t);
    dogru(z.every((x, j) => !j || (x - z[j - 1] >= 3 - 1e-9 && x - z[j - 1] <= 9 + 1e-9)), 'kuş ' + i); });
});
t('cırcırlar ayrı ayrı: her birinin ardışık sesi 0,9–1,7 sn arayla', () => {
  const l = bir(3, rnd(5), 'gece');
  [0, 1, 2].forEach(i => { const z = l.filter(o => o.tur === 'cir' && o.i === i).map(o => o.t);
    dogru(z.length > 50 && z.every((x, j) => !j || (x - z[j - 1] >= 0.9 - 1e-9 && x - z[j - 1] <= 1.7 + 1e-9)), 'cırcır ' + i); });
});
t('döngü dikişsiz: kahverengi gürültüde döngü noktasındaki sıçrama sıradan bir örnek adımından büyük değil', () => {
  const r = rnd(9), n = 20000, x = 2000, h = new Float32Array(n + x); let s = 0;
  for (let i = 0; i < n + x; i++) { s = (s + 0.02 * (r() * 2 - 1)) / 1.02; h[i] = s * 3.5; }
  const v = G.dikis(h, n, x), adim = [];
  for (let i = x + 1; i < n; i++) adim.push(Math.abs(v[i] - v[i - 1]));
  const enCok = Math.max(...adim), dikis = Math.abs(v[0] - v[n - 1]), ham = Math.abs(h[0] - h[n - 1]);
  dogru(v.length === n && dikis <= enCok, 'dikiş ' + dikis + ' > ' + enCok);
  dogru(ham > enCok * 3, 'sınama anlamlı olsun: ham döngü sıçrar ' + ham);
  dogru(v.slice(x).every((y, i) => y === h[x + i]), 'bindirme dışı aynı');
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
