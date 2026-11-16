// Arayüz sesleri (kabuk/ses.js) saf parçalar: node kabuk/ses.test.js  (✓/✕, çıkış 0/1)
'use strict';
const S = require('./ses.js');

let gecen = 0, kalan = 0;
function t(ad, f) { try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); } }
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
const saat = (h, m) => new Date(2026, 10, 16, h, m || 0);
const BEKLENEN = ['tik', 'sec', 'ac', 'bas', 'acik', 'kapali', 'kayit', 'dogru', 'yanlis', 'ders', 'kapi', 'uyari', 'king', 'bildirim'];

t('katalog: istenen 14 ses, her biri ne zaman çaldığını söyler', () => {
  dogru(JSON.stringify(S.KATALOG) === JSON.stringify(BEKLENEN), S.KATALOG.join(','));
  BEKLENEN.forEach(k => dogru(S.SESLER[k].ne.length > 10 && S.SESLER[k].oncelik >= 1 && S.katmanlar(k).length >= 1, k));
  dogru(S.katmanlar('yok').length === 0, 'bilinmeyen ses boş');
});
t('tek akort: bütün tonlar Re majör pentatonikte, akort dışı nota hata verir', () => {
  dogru(Math.abs(S.hz('A4') - 440) < 1e-9 && Math.abs(S.hz('D5') - 587.33) < 0.01 && Math.abs(S.hz('F#4') - 369.99) < 0.01, 'hz');
  let hata = 0; try { S.hz('C5'); } catch (e) { hata++; } try { S.hz('G4'); } catch (e) { hata++; }
  dogru(hata === 2, 'C ve G akort dışı');
  BEKLENEN.forEach(k => S.katmanlar(k).filter(n => n.tip === 'ton').forEach(n => { S.hz(n.nota); if (n.nota2) S.hz(n.nota2); }));
});
t('zarf ve tını: atak çok kısa (≤ 15 ms, yalnız hava/kabarma sesleri ≤ 150 ms), sönüm atakla bitmez, kazanç kısık', () => {
  BEKLENEN.forEach(k => S.katmanlar(k).forEach(n => {
    const j = k + ' ' + JSON.stringify(n);
    dogru(['ton', 'hisirti'].includes(n.tip), j);
    dogru(n.atak > 0 && n.sure > n.atak * 2 && n.t >= 0 && n.g > 0 && n.g <= (n.tip === 'ton' ? 0.3 : 0.8), j); // gürültü dar bantta süzülür: kazancı yüksek görünür
    dogru(n.atak <= (k === 'ac' || n.tip === 'hisirti' && n.sure >= 0.2 ? 0.15 : 0.015), 'atak ' + j);
    if (n.yanki) dogru(n.yanki > 0 && n.yanki <= 0.6, 'yankı ' + j);
    if (n.tini) dogru(S.TINI[n.tini], 'tını ' + j);
    if (n.ayri) dogru(n.ayri > 0 && n.ayri <= 3, 'aralık küçük (titreşim duyulmaz) ' + j);
  }));
  BEKLENEN.forEach(k => dogru(Math.abs(S.SESLER[k].db) <= 12, 'ses düzeyi ' + k));
});
t('kısa: dokunuş sesleri ≤ 120 ms, durum sesleri ≤ 700 ms, yalnız ders/kapı uzun (≤ 1,5 sn)', () => {
  ['tik', 'sec', 'bas'].forEach(k => dogru(S.sure(k) <= 0.12, k + ' ' + S.sure(k)));
  ['ac', 'acik', 'kapali', 'kayit', 'dogru', 'yanlis', 'uyari', 'king', 'bildirim'].forEach(k => dogru(S.sure(k) <= 0.7, k + ' ' + S.sure(k)));
  ['ders', 'kapi'].forEach(k => dogru(S.sure(k) <= 1.5, k + ' ' + S.sure(k)));
  dogru(S.sure('kapi') > S.sure('ders') && S.katmanlar('kapi').length > S.katmanlar('ders').length, 'kapı dersten görkemli');
});
t('tını: her kısmi sesin payı ≤ temel, üst kısmiler daha çabuk söner', () => {
  Object.keys(S.TINI).forEach(ad => S.TINI[ad].forEach((k, i) => dogru(i ? k[0] > 1 && k[1] < 1 && k[2] < 1 : k.join() === '1,1,1', ad + ' ' + k)));
});
t('aç ve kapa aynı iki nota, ters yönde', () => {
  const a = S.katmanlar('acik').filter(n => n.tip === 'ton').map(n => n.nota), k = S.katmanlar('kapali').filter(n => n.tip === 'ton').map(n => n.nota);
  dogru(a.join() === k.slice().reverse().join() && S.hz(a[0]) < S.hz(a[1]), a + ' / ' + k);
});
t('yanlış cezalandırmaz: alçak ve inen, doğrudan daha kısık; uyarı da alçak', () => {
  const y = S.katmanlar('yanlis'), d = S.katmanlar('dogru');
  dogru(S.hz(y[0].nota) > S.hz(y[1].nota) && S.hz(y[0].nota) < S.hz(d[0].nota), 'iner, doğrudan alçak');
  dogru(Math.max(...y.map(n => n.g)) <= Math.max(...d.map(n => n.g)), 'kısık');
  dogru(S.katmanlar('uyari').every(n => S.hz(n.nota) <= 440), 'uyarı alçak');
});
t('hız sınırı: 60 ms içinde eşit/az önemli ses yok, önemlisi geçer; bilinmeyen hiç', () => {
  dogru(S.izin(null, 'tik', 0), 'ilk');
  dogru(!S.izin({ tur: 'tik', t: 1000 }, 'tik', 1030) && !S.izin({ tur: 'tik', t: 1000 }, 'sec', 1059), '60 ms içinde');
  dogru(S.izin({ tur: 'tik', t: 1000 }, 'tik', 1060), '60 ms sonra');
  dogru(S.izin({ tur: 'tik', t: 1000 }, 'ders', 1010) && !S.izin({ tur: 'kapi', t: 1000 }, 'tik', 1010), 'öncelik');
  dogru(!S.izin(null, 'yok', 0), 'bilinmeyen');
  // 20 ms arayla 10 tık → yalnız 60 ms'de bir çalar
  let son = null, n = 0; for (let i = 0; i < 10; i++) { const z = i * 20; if (S.izin(son, 'tik', z)) { son = { tur: 'tik', t: z }; n++; } }
  dogru(n === 4, 'hızlı seri ' + n);
});
t('ses düzeyi: kısık < orta < yüksek ≤ 1; bilinmeyen orta', () => {
  dogru(S.duzeyKazanci('kisik') < S.duzeyKazanci('orta') && S.duzeyKazanci('orta') < S.duzeyKazanci('yuksek') && S.duzeyKazanci('yuksek') <= 1);
  dogru(S.duzeyKazanci(null) === S.duzeyKazanci('orta') && S.duzeyKazanci('x') === S.duzeyKazanci('orta'));
  dogru(S.ANAHTAR === 'lifeos.ses.arayuz' && S.DUZEY_ANAHTAR === 'lifeos.ses.duzey', 'anahtar adları');
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
