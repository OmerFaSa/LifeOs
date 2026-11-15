// Gece sesi (kabuk/gece.js) saf zamanlayıcı: node kabuk/gece.test.js  (✓/✕, çıkış 0/1)
'use strict';
const G = require('./gece.js');

let gecen = 0, kalan = 0;
function t(ad, f) { try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); } }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
function rnd(tohum) { let s = tohum; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function bir(dk, r) { let d = null, l = []; for (let s = 0; s < dk * 60; s += 1) { const p = G.plan(d, s, 2.5, r); d = p.durum; l = l.concat(p.olaylar); } return l; }

t('plan: olaylar pencerede ve sıralı; aynı olay iki kez gelmez', () => {
  const p = G.plan(null, 10, 2.5, rnd(7));
  dogru(p.olaylar.every(o => o.t >= 10 && o.t < 12.5) && p.olaylar.every((o, i, l) => !i || l[i - 1].t <= o.t));
  const l = bir(2, rnd(3)), k = l.map(o => o.tur + o.i + o.t.toFixed(4));
  dogru(new Set(k).size === k.length, 'tekrar eden olay');
});
t('yoğunluk: on dakikada cırcır sık, kurbağa seyrek, baykuş çok seyrek', () => {
  const l = bir(10, rnd(11)), say = tur => l.filter(o => o.tur === tur).length;
  dogru(say('cir') > 1000 && say('cir') < 2100, 'cır ' + say('cir'));
  dogru(say('kurbaga') >= 35 && say('kurbaga') <= 90, 'kurbağa ' + say('kurbaga'));
  dogru(say('baykus') >= 5 && say('baykus') <= 16, 'baykuş ' + say('baykus'));
});
t('cırcırlar ayrı ayrı: her birinin ardışık sesi 0,9–1,7 sn arayla', () => {
  const l = bir(3, rnd(5));
  [0, 1, 2].forEach(i => { const z = l.filter(o => o.tur === 'cir' && o.i === i).map(o => o.t);
    dogru(z.length > 50 && z.every((x, j) => !j || (x - z[j - 1] >= 0.9 - 1e-9 && x - z[j - 1] <= 1.7 + 1e-9)), 'cırcır ' + i); });
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
