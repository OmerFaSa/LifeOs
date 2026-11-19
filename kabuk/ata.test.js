// kabuk/ata.js: portre ızgaraları paletli ve 32×32, tablo çerçeveyle 40×40; harita ızgarası sabit boyda, devlet karada, başkent yıldızı devletin içinde;
// söz kaynağından portre; afiş teması kökte koyu + data-afis (ayar.js).
const assert = require('assert');
const A = require('./ata.js'), Ayar = require('./ayar.js');
let n = 0; const t = (ad, f) => { f(); n++; console.log('✓ ' + ad); };

t('portreler paletli ve 32×32', () => Object.keys(A.PORTRE).forEach(k => {
  const p = A.PORTRE[k];
  assert.strictEqual(p.s.length, 32, k); p.s.forEach(r => assert.strictEqual(r.length, 32, k));
  p.s.join('').split('').forEach(c => assert.ok(c === '.' || p.p[c], k + ': paletsiz ' + c));
}));
t('tablo çerçeveyle 40×40, köşe yaldız, orta resim', () => {
  const x = A.portreTablo('ataturk'); assert.strictEqual(x.w, 40); assert.strictEqual(x.h, 40);
  const px = (X, Y) => Array.from(x.d.slice((Y * 40 + X) * 4, (Y * 40 + X) * 4 + 4));
  assert.strictEqual(px(0, 0)[3], 255); assert.ok(px(2, 2)[0] > 180, 'yaldız açık'); assert.strictEqual(px(20, 20)[3], 255);
});
t('harita ızgarası: boy, devlet ve başkent', () => Object.keys(A.DEVLET).forEach(k => {
  const g = A.haritaIzgara(k); assert.strictEqual(g.length, A.HH); g.forEach(r => assert.strictEqual(r.length, A.HW));
  const s = g.join(''); assert.ok(/[dhD]/.test(s), k + ': devlet yok'); assert.strictEqual((s.match(/y/g) || []).length, A.DEVLET[k].baskent ? 1 : 0);
  assert.ok(/[sS]/.test(s) && /[lL]/.test(s), 'deniz ve kara');
  assert.ok(A.DEVLET[k].kaynak && A.DEVLET[k].yil && A.DEVLET[k].zirve, k + ': kaynak, yıl, zirve yazılı');
}));
t('harita HTML yaklaşık der', () => assert.ok(/yaklaşık/.test(A.haritaHtml('gokturk'))));
t('söz kaynağından portre', () => {
  assert.strictEqual(A.sozPortresi('Atatürk, Gençliğe Hitabe, 1927'), 'ataturk');
  assert.strictEqual(A.sozPortresi('Mustafa Kemal, Çanakkale, 1915'), 'ataturk');
  assert.strictEqual(A.sozPortresi('Türk atasözü'), null);
  assert.strictEqual(A.portreHtml(null), '');
});
t('afiş teması: kök koyu + data-afis; düz temada data-afis yok', () => {
  const depo = v => ({ getItem: k => (k === 'lifeos.tema.secim' ? v : null), setItem() {}, removeItem() {} });
  let o = Ayar.kokNitelikleri(depo('otag')); assert.strictEqual(o['data-theme'], 'dark'); assert.strictEqual(o['data-afis'], 'otag');
  o = Ayar.kokNitelikleri(depo('ordu')); assert.strictEqual(o['data-afis'], 'ordu');
  o = Ayar.kokNitelikleri(depo('light')); assert.strictEqual(o['data-theme'], 'light'); assert.strictEqual(o['data-afis'], null);
  o = Ayar.kokNitelikleri(depo(null)); assert.strictEqual(o['data-theme'], null); assert.strictEqual(o['data-afis'], null);
});
console.log(n + ' sınama geçti');
