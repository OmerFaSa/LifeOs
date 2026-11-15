// Arayüz sesleri (kabuk/ses.js) saf parçalar: node kabuk/ses.test.js  (✓/✕, çıkış 0/1)
'use strict';
const S = require('./ses.js');

let gecen = 0, kalan = 0;
function t(ad, f) { try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); } }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
const saat = (h, m) => new Date(2026, 10, 16, h, m || 0);

t('üç ses var, hepsi kısa ve kısık (kulağı yormaz)', () => {
  ['tik', 'ac', 'tamam'].forEach(tur => {
    const l = S.notalar(tur);
    dogru(l.length >= 1, tur + ' boş');
    l.forEach(n => dogru(n.g > 0 && n.g <= 0.06 && n.t + n.sure <= 1.2 && n.f > 0 && n.f2 > 0, tur + ' ' + JSON.stringify(n)));
  });
  dogru(S.notalar('yok').length === 0, 'bilinmeyen ses boş');
});
t('sessiz saatler: kapalıyken hep çalar, gece yarısını geçen aralık', () => {
  const s = { acik: true, bas: '22:00', bit: '07:00' };
  dogru(!S.susmali(null, saat(23)) && !S.susmali(Object.assign({}, s, { acik: false }), saat(23)), 'kapalı');
  dogru(S.susmali(s, saat(23)) && S.susmali(s, saat(3)) && S.susmali(s, saat(6, 59)) && !S.susmali(s, saat(7)) && !S.susmali(s, saat(12)), 'gece yarısını geçen');
  const g = { acik: true, bas: '13:00', bit: '14:30' };
  dogru(S.susmali(g, saat(13, 10)) && !S.susmali(g, saat(14, 30)) && !S.susmali(g, saat(9)), 'gün içi');
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
