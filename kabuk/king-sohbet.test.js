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

t('istek gövdesi: kip, başlangıç ve ders bağlamı (yalnız kimlik; ad ve metin gitmez)', () => {
  a.deepStrictEqual(K.istekGovdesi('anlat', 'antigravity', { kip: 'ogretmen', baslangic: '2026-11-16T10:00:00', baglam: { tur: 'ders', id: 'felsefe.1.1.1', ad: 'Thales', alan: 'x' } }),
    { text: 'anlat', agent: 'king', saglayici: 'antigravity', kip: 'ogretmen', baslangic: '2026-11-16T10:00:00', baglam: { tur: 'ders', alan: 'felsefe', id: 'felsefe.1.1.1' } });
  a.deepStrictEqual(K.istekGovdesi('x', 'oto', { kip: 'kotu', baglam: { tur: 'ders', id: '../../etc' } }), { text: 'x', agent: 'king', kip: 'ortak' });
  a.strictEqual(K.baglamGecerli({ tur: 'not', id: 'felsefe.1.1.1' }), null);
  a.strictEqual(K.yerelIso(new Date(2026, 10, 16, 9, 5, 7).getTime()), '2026-11-16T09:05:07');
});
t('depodaki konuşma: bozuksa boş konuşma; yabancı mesaj ve alan atılır, uzunluk sınırlı', () => {
  const T = new Date(2026, 10, 16, 9, 0, 0).getTime();
  a.deepStrictEqual(K.sohbetOku('{bozuk', T), { baslangic: '2026-11-16T09:00:00', kip: 'ortak', baglam: null, mesajlar: [] });
  const s = K.sohbetOku(JSON.stringify({ baslangic: '2026-11-15T20:00:00', kip: 'filozof', baglam: { tur: 'ders', id: 'felsefe.1.1.2', ad: 'Arkhe' },
    mesajlar: [{ kim: 'ben', metin: 'selam' }, { kim: 'sistem', metin: 'x' }, { kim: 'king', metin: 'y'.repeat(30000), alt: ['Kaynak: claude', 5], html: '<b>' }] }), T);
  a.strictEqual(s.baslangic, '2026-11-15T20:00:00'); a.strictEqual(s.kip, 'filozof'); a.strictEqual(s.baglam.id, 'felsefe.1.1.2');
  a.deepStrictEqual(s.mesajlar.map(m => m.kim), ['ben', 'king']);
  a.strictEqual(s.mesajlar[1].metin.length, 20000); a.deepStrictEqual(s.mesajlar[1].alt, ['Kaynak: claude']); a.ok(!('html' in s.mesajlar[1]));
});
t('biçim: paragraf, satır sonu, madde, numaralı liste, kalın, kod ve tablo; HTML kaçırılır', () => {
  a.strictEqual(K.bicimle('Bir\niki\n\nÜç'), '<p>Bir<br>iki</p><p>Üç</p>');
  a.strictEqual(K.bicimle('Liste:\n- a\n- **b**\n1. c\n2) `d`'), '<p>Liste:</p><ul><li>a</li><li><strong>b</strong></li></ul><ol><li>c</li><li><code>d</code></li></ol>');
  a.strictEqual(K.bicimle('| A | B |\n|---|---|\n| 1 | 2 |'), '<div class="king-md-tablo"><table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table></div>');
  a.strictEqual(K.bicimle('## Başlık'), '<p class="king-md-baslik"><strong>Başlık</strong></p>');
  const k = K.bicimle('<img src=x onerror=alert(1)> **<script>** [a](javascript:x) "q"');
  a.ok(!/<img|<script|href=/.test(k) && /&lt;img/.test(k) && /<strong>&lt;script&gt;<\/strong>/.test(k) && /&quot;q&quot;/.test(k), k);
  a.strictEqual(K.bicimle(null), '');
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
