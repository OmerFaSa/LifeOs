// Kendi başlıkların (kabuk/konularim.js) saf kısım: node kabuk/konularim.test.js  (✓/✕, çıkış 0/1)
'use strict';
const K = require('./konularim.js');
const a = require('assert');

let gecen = 0, kalan = 0;
function t(ad, f) { try { f(); gecen++; console.log('✓ ' + ad); } catch (e) { kalan++; console.log('✕ ' + ad + '\n    ' + e.message); } }

t('depo okuma: bozuksa boş; yabancı alan, kimliksiz ya da adsız öğe atılır; ad tek satır ≤80', () => {
  a.deepStrictEqual(K.oku('{bozuk'), {}); a.deepStrictEqual(K.oku(null), {}); a.deepStrictEqual(K.oku('[1]'), {});
  const v = K.oku(JSON.stringify({ tarih: [{ id: 'k1', ad: '  Göktürk\n ordusu ', konular: [{ id: 'k2', ad: 'Onlu düzen', not: 'n' }, { id: '../x', ad: 'y' }, { id: 'k3', ad: '  ' }], html: '<b>' }],
    'Kotu': [{ id: 'k9', ad: 'x' }], felsefe: 'x', dil: [] }));
  a.deepStrictEqual(v, { tarih: [{ id: 'k1', ad: 'Göktürk ordusu', konular: [{ id: 'k2', ad: 'Onlu düzen', not: 'n' }] }] });
  a.strictEqual(K.oku({ tarih: [{ id: 'k1', ad: 'x'.repeat(300) }] }).tarih[0].ad.length, 80);
});
t('ekle, adını düzelt, taşı, sil; sınır dışı işlem false döner ve değeri bozmaz', () => {
  const v = {};
  const b = K.baslikEkle(v, 'tarih', 'Göktürk ordusu', 'b1');
  a.strictEqual(b, 'b1'); a.strictEqual(K.baslikEkle(v, 'tarih', '   '), false); a.strictEqual(K.baslikEkle(v, '../x', 'a'), false);
  K.konuEkle(v, 'tarih', 'b1', 'Onlu duzen', 'k1'); K.konuEkle(v, 'tarih', 'b1', 'Tonyukuk', 'k2'); K.konuEkle(v, 'tarih', 'b1', 'Kurultay', 'k3');
  a.strictEqual(K.konuEkle(v, 'tarih', 'k1', 'konunun altına konu yok'), false);
  a.strictEqual(K.konuEkle(v, 'tarih', 'yok', 'x'), false);
  a.ok(K.adDegistir(v, 'tarih', 'k1', 'Onlu düzen'));
  a.ok(K.tasi(v, 'tarih', 'k3', -1)); a.ok(!K.tasi(v, 'tarih', 'k1', -1), 'ilk öğe yukarı gitmez'); a.ok(!K.tasi(v, 'tarih', 'k2', 1), 'son öğe aşağı gitmez');
  a.deepStrictEqual(v.tarih[0].konular.map(k => k.ad), ['Onlu düzen', 'Kurultay', 'Tonyukuk']);
  K.baslikEkle(v, 'tarih', 'Orhon', 'b2'); a.ok(K.tasi(v, 'tarih', 'b2', -1)); a.deepStrictEqual(v.tarih.map(x => x.id), ['b2', 'b1']);
  a.ok(K.sil(v, 'tarih', 'k3')); a.deepStrictEqual(v.tarih[1].konular.map(k => k.id), ['k1', 'k2']);
  a.ok(K.sil(v, 'tarih', 'b1')); a.ok(K.sil(v, 'tarih', 'b2')); a.deepStrictEqual(v, {}, 'son başlık gidince alan da gider');
  a.ok(/^[a-z0-9]{1,24}$/.test(K.yeniId()) && K.yeniId(1, 0.5) !== K.yeniId(1, 0.6));
});
t('Başbuğ’un notu: yeni cevap eskinin altına eklenir, boş metin notu siler; kimliği bilinmeyen konuya yazılmaz', () => {
  const v = {}; K.baslikEkle(v, 'tarih', 'Göktürk ordusu', 'b1'); K.konuEkle(v, 'tarih', 'b1', 'Onlu düzen', 'k1');
  a.ok(K.notYaz(v, 'tarih', 'k1', ' bir ', true)); a.ok(K.notYaz(v, 'tarih', 'k1', 'iki', true));
  a.strictEqual(v.tarih[0].konular[0].not, 'bir\n\niki');
  a.ok(K.notYaz(v, 'tarih', 'k1', '')); a.ok(!('not' in v.tarih[0].konular[0]));
  a.ok(!K.notYaz(v, 'tarih', 'kyok', 'x', true)); a.ok(!K.notYaz(v, 'felsefe', 'k1', 'x', true), 'başka alanın konusu değil');
});
t('sohbet bağlamı: konu «Başlık › Konu» + kid, başlık yalnız adıyla; istek başlığı ve konuları sırayla taşır', () => {
  const b = { id: 'b1', ad: 'Göktürk ordusu', konular: [{ id: 'k1', ad: 'Onlu düzen' }, { id: 'k2', ad: 'Tonyukuk' }] };
  a.deepStrictEqual(K.baglam('tarih', b, b.konular[0]), { tur: 'konu', alan: 'tarih', ad: 'Göktürk ordusu › Onlu düzen', kid: 'k1' });
  a.deepStrictEqual(K.baglam('tarih', b), { tur: 'konu', alan: 'tarih', ad: 'Göktürk ordusu', kid: 'b1' });
  a.strictEqual(K.baglam('tarih', { id: 'b', ad: 'x'.repeat(80) }, { id: 'k', ad: 'y'.repeat(80) }).ad.length, 120);
  const i = K.istem(b);
  a.ok(/«Göktürk ordusu»/.test(i) && /1\. Onlu düzen\n2\. Tonyukuk/.test(i) && /yazım/.test(i) && /eksik/.test(i) && /ders bilgisi/.test(i), i);
  a.ok(i.length < 8000);
  a.ok(/henüz konu yok/.test(K.istem({ id: 'b', ad: 'Boş', konular: [] })));
});
t('sohbetle uyum: bağlam king-sohbet.js baglamGecerli’den aynen geçer', () => {
  const S = require('./king-sohbet.js'), b = { id: 'b1', ad: 'Göktürk ordusu', konular: [{ id: 'k1', ad: 'Onlu düzen' }] };
  a.deepStrictEqual(S.baglamGecerli(K.baglam('tarih', b, b.konular[0])), K.baglam('tarih', b, b.konular[0]));
});

console.log('\n' + gecen + ' geçti, ' + kalan + ' kaldı');
process.exit(kalan ? 1 : 0);
