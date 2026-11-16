// Açılış videosu (kabuk/acilis.js) saf kısım: node kabuk/acilis.test.js  (✓/✕, çıkış 0/1)
'use strict';
const A = require('./acilis.js');
const B = require('./bilesen.js');

let gecen = 0, kalan = 0;
function t(ad, f) {
  try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); }
}
function dogru(x, m) { if (!x) throw new Error(m || 'doğru değil'); }
const PC = { sunucu: { yerel: true } }, TEL = { sunucu: { yerel: false } };

t('oynasın mı: ayar açık, önceki sayfa yok, bu sekmede oynamadıysa; «?video» her zaman', () => {
  dogru(A.oynasinMi({ ayar: '1', onceki: '', arama: '', oynadi: false }));
  dogru(!A.oynasinMi({ ayar: null, onceki: '', arama: '', oynadi: false }), 'ayar kapalı');
  dogru(!A.oynasinMi({ ayar: '1', onceki: 'http://127.0.0.1/kabuk/', arama: '', oynadi: false }), 'başka sayfadan gelindi');
  dogru(!A.oynasinMi({ ayar: '1', onceki: '', arama: '', oynadi: true }), 'bu sekmede oynadı');
  dogru(A.oynasinMi({ ayar: null, onceki: 'x', arama: '?video', oynadi: true }) && A.oynasinMi({ arama: '?a=1&video' }), '?video zorlar');
});
t('bölüm: yalnız bilgisayarın kendisinde; video yokken açma düğmesi yerine tek cümle, varken «Açılışta oynat» ve «Şimdi izle»', () => {
  dogru(A.bolum({ acik: false, var: false }, B, TEL) === '', 'telefonda yok');
  const yok = A.bolum({ acik: false, var: false }, B, PC), var_ = A.bolum({ acik: true, var: true }, B, PC);
  dogru(/Henüz video yok/.test(yok) && !/data-ac-ac="ac"/.test(yok) && /Video seç/.test(yok) && !/Şimdi izle/.test(yok), yok);
  dogru(/aria-pressed="true"/.test(var_) && /Açılışta oynat/.test(var_) && /Videoyu değiştir/.test(var_) && /Şimdi izle/.test(var_), var_);
  dogru(/Yükleniyor/.test(A.bolum({ acik: null }, B, PC)));
  dogru(/&#60;x&#62;/.test(A.bolum({ acik: false, var: true, durum: '<x>' }, B, PC)), 'durum kaçışlı');
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
