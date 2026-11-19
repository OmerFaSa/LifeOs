// kabuk/ata.js: portre ızgaraları paletli ve 32×32, tablo çerçeveyle 40×40; harita ızgarası sabit boyda, devlet karada, başkent yıldızı devletin içinde;
// söz kaynağından portre; afiş teması kökte koyu + data-afis (ayar.js).
const assert = require('assert');
const Veri = require('./ata-veri.js'), A = require('./ata.js'), Ayar = require('./ayar.js');
let n = 0; const t = (ad, f) => { f(); n++; console.log('✓ ' + ad); };

t('portreler paletli ve 32×32; her adın ızgarası var', () => Object.keys(A.PORTRE).forEach(k => {
  const p = Veri.PORTRE[k]; assert.ok(p && A.PORTRE[k].ad, k);
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
t('harita HTML yaklaşık der', () => assert.ok(/yaklaşık/.test(A.haritaHtml('gokturk')) && /yaklaşık/.test(A.haritalarHtml('gokturk'))));
t('tarih tabloları: adı, metni, millî gün; resimler kabuk/tablo.js', () => {
  const R = require('./tablo.js');
  Object.keys(A.TABLO).forEach(k => { assert.ok(A.TABLO[k].ad && A.TABLO[k].metin, k); assert.ok(/^data:image\/png;base64,/.test(R[k].buyuk) && /^data:image\/png;base64,/.test(R[k].kucuk), k); });
  assert.strictEqual(A.gununTablosu(new Date(2026, 7, 26)), 'kocatepe'); assert.strictEqual(A.gununTablosu(new Date(2026, 3, 1)), null);
  assert.ok(/data-tablo="kocatepe"/.test(A.tablolarHtml()));
});
t('simgeler: 16×16, paletli, adı ve bilgisi var', () => Object.keys(A.SIMGE).forEach(k => {
  const x = Veri.SIMGE[k]; assert.strictEqual(x.s.length, 16); x.s.forEach(r => assert.strictEqual(r.length, 16)); assert.ok(A.SIMGE[k].ad && A.SIMGE[k].bilgi, k);
  x.s.join('').split('').forEach(c => assert.ok(c === '.' || x.p[c], k + ': paletsiz ' + c));
}));
t('logo: 32×32, on altı yıldız (on altı büyük Türk devleti)', () => {
  const s = A.LOGO.s; assert.strictEqual(s.length, 32); s.forEach(r => assert.strictEqual(r.length, 32));
  let n = 0; for (let y = 1; y < 31; y++) for (let x = 1; x < 31; x++) if (s[y][x] === 'w' && [s[y - 1][x], s[y + 1][x], s[y][x - 1], s[y][x + 1]].every(c => c === 'y')) n++;
  assert.strictEqual(n, 16); assert.strictEqual(A.logoTablo().w, 32);
});
t('Divan hükümdarlarının portresi var', () => ['mete', 'attila', 'bilge', 'alparslan', 'fatih', 'osman', 'yavuz', 'kanuni', 'babur', 'timur', 'enver'].forEach(k => assert.ok(A.PORTRE[k], k)));
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
  o = Ayar.kokNitelikleri(depo('seferberlik')); assert.strictEqual(o['data-theme'], 'light'); assert.strictEqual(o['data-afis'], 'seferberlik');
  ['boru', 'ergenekon', 'akinci'].forEach(v => assert.strictEqual(Ayar.kokNitelikleri(depo(v))['data-theme'], 'dark', v));
  o = Ayar.kokNitelikleri(depo('light')); assert.strictEqual(o['data-theme'], 'light'); assert.strictEqual(o['data-afis'], null);
  o = Ayar.kokNitelikleri(depo(null)); assert.strictEqual(o['data-theme'], null); assert.strictEqual(o['data-afis'], null);
});
console.log(n + ' sınama geçti');
