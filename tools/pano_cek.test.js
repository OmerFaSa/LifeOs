#!/usr/bin/env node
/* tools/pano_cek.js birim testleri (Playwright'siz kosar).
 * Calistir: node tools/pano_cek.test.js
 */
const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const KOK = path.resolve(__dirname, '..');
const pano = require('./pano_cek.js');

let basarili = 0;
function dene(ad, fn) {
  fn();
  basarili++;
  console.log('  ✓ ' + ad);
}

console.log('pano_cek birim testleri');

dene('argüman ayrıştırma: yardım ve varsayılanlar', () => {
  assert.deepStrictEqual(pano.ayristirArg([]), { komut: 'yardim' });
  assert.deepStrictEqual(pano.ayristirArg(['--yardim']), { komut: 'yardim' });
  assert.deepStrictEqual(pano.ayristirArg(['-h']), { komut: 'yardim' });

  const c1 = pano.ayristirArg(['cek', '--cikti=/tmp/a']);
  assert.deepStrictEqual(c1.yerler, ['bugun', 'ayarlar']);
  assert.strictEqual(c1.boylar.length, 2);
  assert.strictEqual(c1.tam, false);
  assert.strictEqual(c1.kati, false);
  assert.strictEqual(c1.bekle, 120);

  const c2 = pano.ayristirArg([
    'cek', '--yer', '#/bugun,ayarlar?grup-hesap', '--boy=1024x768:acik', '--cikti', '/tmp/b', '--tam', '--kati', '--bekle=0',
  ]);
  assert.deepStrictEqual(c2.yerler, ['bugun', 'ayarlar?grup-hesap']);
  assert.deepStrictEqual(c2.boylar, [{ w: 1024, h: 768, tema: 'acik', etiket: '1024x768-acik' }]);
  assert.strictEqual(c2.tam, true);
  assert.strictEqual(c2.kati, true);
  assert.strictEqual(c2.bekle, 0);

  const b1 = pano.ayristirArg(['birlestir', '--once=/tmp/a', '--sonra=/tmp/b', '--cikti=/tmp/p', '--baslik=Deneme']);
  assert.deepStrictEqual(b1, { komut: 'birlestir', once: '/tmp/a', sonra: '/tmp/b', cikti: '/tmp/p', baslik: 'Deneme' });
});

dene('argüman ayrıştırma: geçersiz girdileri reddeder', () => {
  assert.throws(() => pano.ayristirArg(['cek']), /--cikti/);
  assert.throws(() => pano.ayristirArg(['cek', '--cikti=/tmp/a', '--yer=']), /--yer/);
  assert.throws(() => pano.ayristirArg(['cek', '--cikti=/tmp/a', '--boy=']), /--boy/);
  assert.throws(() => pano.ayristirArg(['cek', '--cikti=/tmp/a', '--bekle=']), /--bekle/);
  assert.throws(() => pano.ayristirArg(['cek', '--cikti=/tmp/a', '--bekle=   ']), /--bekle/);
  assert.throws(() => pano.ayristirArg(['cek', '--cikti=/tmp/a', '--yer=../gizli']), /Geçersiz --yer/);
  assert.throws(() => pano.ayristirArg(['cek', '--cikti=/tmp/a', '--boy=50x50:acik']), /200\.\.4000/);
  assert.throws(() => pano.ayristirArg(['cek', '--cikti=/tmp/a', '--boy=4500x800:koyu']), /200\.\.4000/);
  assert.throws(() => pano.ayristirArg(['cek', '--cikti=/tmp/a', '--boy=1280x800:mavi']), /Geçersiz --boy/);
  assert.throws(() => pano.ayristirArg(['cek', '--cikti=/tmp/a', '--bilinmeyen=1']), /Bilinmeyen bayrak/);
  assert.throws(() => pano.ayristirArg(['birlestir', '--once=/tmp/a']), /--sonra/);
  assert.throws(() => pano.ayristirArg(['birlestir', '--once=   ', '--sonra=/tmp/b', '--cikti=/tmp/p']), /--once/);
  assert.throws(() => pano.ayristirArg(['bilinmeyen']), /Bilinmeyen komut/);
});

dene('yerDosyaAdi: güvenli dosya adı üretir', () => {
  assert.strictEqual(pano.yerDosyaAdi('#/bugun'), 'bugun');
  assert.strictEqual(pano.yerDosyaAdi('ayarlar?grup-hesap'), 'ayarlar-grup-hesap');
  assert.strictEqual(pano.yerDosyaAdi('ogren/felsefe'), 'ogren-felsefe');
  assert.strictEqual(pano.yerDosyaAdi('///'), 'ekran');
});

dene('eslestir: yalnız PNG çiftlerini sıralı eşleştirir', () => {
  const e = pano.eslestir(
    ['b.png', 'a.png', 'denetim.json', 'a.png'],
    ['c.png', 'A.png', 'a.png', 'not.txt']
  );
  assert.deepStrictEqual(e.eslesen, ['a.png']);
  assert.deepStrictEqual(e.yalnizOnce, ['b.png']);
  assert.deepStrictEqual(e.yalnizSonra, ['A.png', 'c.png']);
});

dene('panoHtml: başlık, ad ve data URI için HTML kaçışı uygular', () => {
  const html = pano.panoHtml({
    ad: 'bugun-1280x800-koyu.png',
    baslik: '<script>alert("x")</script> & Başbuğ',
    onceVeri: 'data:image/png;base64,AAA" onerror="x',
    sonraVeri: 'data:image/png;base64,BBB',
  });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; Başbuğ'));
  assert.ok(html.includes('AAA&quot; onerror=&quot;x'));
  assert.ok(html.includes('bugun-1280x800-koyu'));
  assert.ok(html.includes('ÖNCE') && html.includes('SONRA'));
});

dene('ozetle: taşma, dokunma ve hata sayılarını özetler', () => {
  assert.deepStrictEqual(pano.ozetle([
    { yatayTasma: false, kucukDokunma: [], sayfaHata: [], konsolHata: [] },
    { yatayTasma: true, kucukDokunma: [{ w: 30, h: 30 }], sayfaHata: [], konsolHata: ['x'] },
  ]), { toplam: 2, tasmali: 1, kucukDokunmali: 1, hatali: 1, temiz: false });
  assert.strictEqual(pano.ozetle([{ yatayTasma: false, kucukDokunma: [], sayfaHata: [], konsolHata: [] }]).temiz, true);
});

dene('Playwright olmadan yüklenir ve --yardim çıkış 0 verir', () => {
  const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'pano-pwsiz-'));
  const engel = path.join(gecici, 'engel.js');
  fs.writeFileSync(engel,
    "const M = require('module'); const c = M._resolveFilename;\n" +
    "M._resolveFilename = function(r){ if(/(^|[\\\\/])playwright([\\\\/]|$)/.test(String(r))){\n" +
    "  const e = new Error(\"Cannot find module '\" + r + \"'\"); e.code = 'MODULE_NOT_FOUND'; throw e; }\n" +
    "  return c.apply(this, arguments); };\n", 'utf8');
  try {
    const r = spawnSync(process.execPath, ['--require', engel, 'tools/pano_cek.js', '--yardim'], {
      cwd: KOK, encoding: 'utf8', env: Object.assign({}, process.env, { NODE_PATH: '' }),
    });
    assert.strictEqual(r.status, 0, r.stderr || r.stdout);
    assert.ok((r.stdout || '').includes('Kullanım:'), r.stdout);
  } finally {
    fs.rmSync(gecici, { recursive: true, force: true });
  }
});

console.log(`\n✓ ${basarili} pano_cek testi geçti.`);
