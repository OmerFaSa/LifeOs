// İmlece tepki veren hareketlerin saf hesabı: node kabuk/etkilesim.test.js  (✓/✕, çıkış 0/1)
'use strict';
const E = require('./etkilesim.js');
let kalan = 0;
function t(ad, f) { try { f(); console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); } }
function esit(a, b) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a)); }

t('eğim: ortada düz, sağ alt köşede sağa ve öne, dışarıda sınırda kalır, sıfır boyda patlamaz', () => {
  esit(E.egim(100, 50, 200, 100, 4), { rx: 0, ry: 0 });
  esit(E.egim(200, 100, 200, 100, 4), { rx: -4, ry: 4 });
  esit(E.egim(0, 0, 200, 100, 4), { rx: 4, ry: -4 });
  esit(E.egim(900, -50, 200, 100, 4), { rx: 4, ry: 4 });
  esit(E.egim(0, 0, 0, 0, 4).ry, -4);
});
t('ilerleme: yalnız artan dilimler, ilk görülüşte ve azalınca hiçbiri', () => {
  esit(E.artanlar(1, 3), [1, 2]);
  esit(E.artanlar(undefined, 3), []);
  esit(E.artanlar(3, 3), []);
  esit(E.artanlar(4, 2), []);
  esit(E.artanlar(0, 1), [0]);
});
console.log(kalan ? kalan + ' kaldı' : 'hepsi geçti');
process.exit(kalan ? 1 : 0);
