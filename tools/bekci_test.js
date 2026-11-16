// Masaüstü kabuğunun sunucu bekçisi (uygulama/masaustu/sunucu-bekci.js): ölünce yeniden başlatır, sınırda vazgeçer.
const assert = require('assert');
const { bekci } = require('../uygulama/masaustu/sunucu-bekci.js');
(async () => {
  let acik = true, basladi = 0, vazgecti = 0, canlanir = true;
  const b = bekci({ yokla: async () => acik, baslat: async () => { basladi++; if (canlanir) acik = true; }, bekle: async () => acik,
                    vazgec: () => { vazgecti++; }, azami: 3, aralik: 1000 });
  assert.strictEqual(await b.tur(), 'saglam'); assert.strictEqual(basladi, 0);
  acik = false;
  assert.strictEqual(await b.tur(), 'yeniden-baslatildi'); assert.strictEqual(basladi, 1);
  canlanir = false; acik = false;
  assert.strictEqual(await b.tur(), 'basarisiz'); assert.strictEqual(b.gecikme(), 2000);   // geri çekilme: aralık × 2^başarısız
  assert.strictEqual(await b.tur(), 'basarisiz'); assert.strictEqual(b.gecikme(), 4000);
  assert.strictEqual(await b.tur(), 'vazgecildi'); assert.strictEqual(vazgecti, 1);
  const n = basladi; assert.strictEqual(await b.tur(), 'durdu'); assert.strictEqual(basladi, n);   // vazgeçince bir daha denemez
  const c = bekci({ yokla: async () => false, baslat: async () => {}, bekle: async () => false, azami: 9 }); c.dur();
  assert.strictEqual(await c.tur(), 'durdu');                       // dur(): kapanırken yeniden başlatma yok
  let kac = 0; const d = bekci({ yokla: async () => { kac++; return true; }, baslat: async () => {}, bekle: async () => true,
    aralik: 5 }); d.basla(); await new Promise(r => setTimeout(r, 60)); d.dur(); assert.ok(kac >= 2, 'döngü çalışır');
  console.log('bekci: yeniden baslatir, geri cekilir, sinirda vazgecer, dur() sonrasi dokunmaz');
})().catch(e => { console.error(e); process.exit(1); });
