// King sohbeti (kabuk/king-sohbet.js) saf kısım: node kabuk/king-sohbet.test.js  (✓/✕, çıkış 0/1)
'use strict';
const K = require('./king-sohbet.js');
const a = require('assert');

let gecen = 0, kalan = 0;
function t(ad, f) { try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); } }

t('istek gövdesi: seçim yalnız geçerliyse gider, otomatik seçimde alan yok', () => {
  a.deepStrictEqual(K.istekGovdesi(' selam ', 'claude'), { text: 'selam', agent: 'king', saglayici: 'claude' });
  a.deepStrictEqual(K.istekGovdesi('x', 'kotu'), { text: 'x', agent: 'king' });
  a.deepStrictEqual(K.istekGovdesi('x', 'oto'), { text: 'x', agent: 'king' });
});
t('seçenek adı köprünün hâlini söyler; hâl bilinmiyorsa yalnız ad', () => {
  const s = K.secenekler({ antigravity: { acik: false }, claude: { acik: true } });
  a.strictEqual(s.antigravity, 'Antigravity · kapalı');
  a.strictEqual(s.claude, 'Claude Code · hazır');
  a.strictEqual(K.secenekler(null).claude, 'Claude Code');
});
t('cevap: metin, kaynak satırı ve köprü olmadıysa notu', () => {
  a.deepStrictEqual(K.cevapSatirlari({ mode: 'model', text: 'Merhaba', provider: 'google', model: 'g', seconds: 2.34,
    kopru: { kullanildi: false, not: 'Antigravity olmadı (kapalı). Sıradaki model cevaplıyor.' } }, 200),
  ['Merhaba', 'Kaynak: google · g · 2,3 sn', 'Antigravity olmadı (kapalı). Sıradaki model cevaplıyor.']);
  a.deepStrictEqual(K.cevapSatirlari({ mode: 'model', text: 'Tamam', provider: 'claude', kopru: { kullanildi: true, not: 'x' } }, 200),
    ['Tamam', 'Kaynak: claude']);
});
t('model konuşamadıysa kaynak kural motorudur; hata kodunda sunucunun cümlesi', () => {
  a.strictEqual(K.cevapSatirlari({ mode: 'komut', text: 'Bugün iki iş var.' }, 200)[1], 'Kaynak: kural motoru (model cevap vermedi)');
  a.deepStrictEqual(K.cevapSatirlari({ mesaj: 'yalnız bu bilgisayarda' }, 403), ['yalnız bu bilgisayarda']);
  a.deepStrictEqual(K.cevapSatirlari(null, 0), ['Merkez cevap vermedi.']);
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
