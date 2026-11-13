/* Not motorunun HKM BAM bağdaştırıcısı (Not.goc.bamKayit) testleri: node motor/not-hkm.test.js
   Satırlar HKM/core/db.py bam_kayitlar şemasının biçiminde (goc.topla_hkm gövdesi: sütun → değer, govde JSON metin);
   içerik uydurmadır. Ayrı dosya: not.test.js'e başka bir paket yazıyor. */
'use strict';
const assert = require('assert');
const N = require('./not.js');

let kirmizi = 0, sayi = 0;
function it(ad, f){
  sayi++;
  try{ f(); console.log('✓ ' + ad); }
  catch(e){ kirmizi++; console.log('✕ ' + ad + ' — ' + e.message); }
}
const GOC = Date.UTC(2026, 10, 13, 12, 0, 0);
const SUTUN = ['id', 'tur', 'baslik', 'govde', 'dogruluk', 'etiketler', 'surum', 'onceki_id', 'is_id', 'created_at', 'anahtar', 'denetim'];
const satir = o => Object.assign({ id:1, tur:'arastirma', baslik:'Kreatin ve uyku', dogruluk:'kaynakli', etiketler:'kreatin uykuyu etkiler mi',
  surum:1, onceki_id:null, is_id:7, created_at:'2026-11-01T10:00:00+03:00', anahtar:'kreatin-uyku', denetim:null,
  govde:JSON.stringify({ ozet:'Kısa özet.', bulgular:[{ iddia:'Birinci iddia', guven:'orta' }, { iddia:' ' }], kaynaklar:[{ url:'https://ornek.test/a' }] }) }, o);

it('araştırma kaydı → belge notu: özet ve iddialar gövdede, bütün gövde ozellik.bam içinde', () => {
  const r = N.goc.bamKayit([satir()], { zaman:GOC });
  assert.strictEqual(r.notlar.length, 1);
  const n = r.notlar[0];
  assert.strictEqual(N.dogrula(n), '');
  assert.deepStrictEqual([n.id, n.tur, n.baslik, n.govde], ['bam/1', 'belge', 'Kreatin ve uyku', 'Kısa özet.\n- Birinci iddia']);
  assert.deepStrictEqual(n.etiketler, []);
  assert.deepStrictEqual(n.kaynak, { yapi:'bam', yol:'bam_kayitlar/1' });
  assert.strictEqual(n.olusturma, Date.parse('2026-11-01T10:00:00+03:00'));
  assert.deepStrictEqual(n.ozellik.bam, { tur:'arastirma', dogruluk:'kaynakli', surum:1, onceki_id:null, is_id:7, anahtar:'kreatin-uyku',
    talep:'kreatin uykuyu etkiler mi', denetim:null, govde:JSON.parse(satir().govde) });
  assert.strictEqual(r.rapor.sayi, 1);
});
it('JSON olmayan gövde metin olarak kalır; denetim JSON ise nesne olur', () => {
  const n = N.goc.bamKayit([satir({ govde:'düz metin', denetim:'{"gun":"2026-11-02"}' })], { zaman:GOC }).notlar[0];
  assert.strictEqual(n.govde, 'düz metin');
  assert.strictEqual(n.ozellik.bam.govde, null);
  assert.deepStrictEqual(n.ozellik.bam.denetim, { gun:'2026-11-02' });
});
it('başlık ve gövde boşsa Türkçe nedenle ret; aynı kimlik ikinci kez ret', () => {
  const r = N.goc.bamKayit([satir({ id:2, baslik:'', govde:'{}' }), satir({ id:3 }), satir({ id:3 })], { zaman:GOC });
  assert.deepStrictEqual(r.rapor.reddedilen.map(x => x.neden), ['Başlığı da gövdesi de boş not kaydedilmez.', 'Aynı kimlik ikinci kez geldi; ilki alındı.']);
  assert.deepStrictEqual(r.notlar.map(n => n.id), ['bam/3']);
});
it('okunamayan zaman: göç anı yazılır ve sayılır', () => {
  const r = N.goc.bamKayit([satir({ created_at:'' })], { zaman:GOC });
  assert.strictEqual(r.notlar[0].olusturma, GOC);
  assert.strictEqual(r.rapor.zamanYok, 1);
});
it('göç anı verilmezse atar; boş liste boş döner', () => {
  assert.throws(() => N.goc.bamKayit([satir()]), /Göç anı/);
  assert.deepStrictEqual(N.goc.bamKayit(null, { zaman:GOC }).notlar, []);
});
it('her gerçek sütun bağdaştırıcıda adıyla geçer (sessiz düşen yok)', () => {
  const kaynak = String(N.goc.bamKayit);
  assert.deepStrictEqual(SUTUN.filter(a => !new RegExp('(^|[^\\w$])' + a + '([^\\w$]|$)').test(kaynak)), []);
});
it('rapor tools/gercek_kosu.js notListe biçiminde', () => {
  const r = N.goc.bamKayit([], { zaman:GOC }).rapor;
  ['reddedilen', 'tasinamayan', 'belirsiz', 'kopuk'].forEach(k => assert.ok(Array.isArray(r[k]), k));
  assert.strictEqual(typeof r.zamanYok, 'number');
});

console.log(kirmizi ? '✕ ' + kirmizi + '/' + sayi + ' kırmızı' : '✓ ' + sayi + '/' + sayi + ' yeşil');
process.exit(kirmizi ? 1 : 0);
