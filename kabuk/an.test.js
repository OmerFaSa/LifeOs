// Anların saf hesabı: node kabuk/an.test.js  (✓/✕, çıkış 0/1)
'use strict';
const A = require('./an.js');
let kalan = 0;
function t(ad, f) { try { f(); console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); } }
function esit(a, b) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a)); }

t('aynı an 4 sn içinde tekrar etmez, başka an ve süre dolunca oynar, bilinmeyen an yok', () => {
  esit(A.gecer(null, 'ders', 1000), true);
  esit(A.gecer({ tur: 'ders', t: 1000 }, 'ders', 3000), false);
  esit(A.gecer({ tur: 'ders', t: 1000 }, 'kapi', 3000), true);
  esit(A.gecer({ tur: 'ders', t: 1000 }, 'ders', 5001), true);
  esit(A.gecer(null, 'patlama', 1000), false);
});
t('anlar bir saniyeden kısa', () => { Object.keys(A.SURE).forEach(k => { if (!(A.SURE[k] < 1000)) throw new Error(k + ' ' + A.SURE[k]); }); });
t('sayarak artış: baştan başlar, hedefte biter, yavaşlayarak varır, aralık dışı sınırda', () => {
  esit(A.sayAdim(0, 10, 0), 0); esit(A.sayAdim(0, 10, 1), 10); esit(A.sayAdim(3, 8, 2), 8); esit(A.sayAdim(3, 8, -1), 3);
  if (!(A.sayAdim(0, 100, 0.5) > 50)) throw new Error('yavaşlayarak varmalı');
});
t('günün ilk kaydı: aynı gün aynı anahtar, ertesi gün farklı', () => {
  const g = new Date(2026, 10, 17, 9, 0).getTime();
  esit(A.gunAnahtar(g), A.gunAnahtar(g + 5 * 3600e3));
  esit(A.gunAnahtar(g) === A.gunAnahtar(g + 24 * 3600e3), false);
});
t('kıvılcımlar tohumlu: aynı tohum aynı desen, değerler aralıkta', () => {
  esit(A.kivilcimlar(8, 42), A.kivilcimlar(8, 42));
  A.kivilcimlar(12, 7).forEach(k => { if (k[0] < 0 || k[0] > 1 || k[2] < -1 || k[2] > 1 || k[3] > 0.25) throw new Error(JSON.stringify(k)); });
});
console.log(kalan ? kalan + ' kaldı' : 'hepsi geçti');
process.exit(kalan ? 1 : 0);
