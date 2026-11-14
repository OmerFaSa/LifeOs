// BİLEŞEN KATALOĞU GÖRÜNTÜSÜ: kabuk/bilesen.html'i file:// ile (sunucusuz) Chromium'da açar ve dört tam sayfa görüntü yazar:
// belgeler/ekip/sadelesme/kabuk-onizleme/bilesen-{masaustu (1280), telefon (390)}-{acik, koyu}.png
// Her görünümde yatay taşma ve konsol hatası denetlenir; sorun varsa çıkış 1. Kullanım: node tools/bilesen_goruntu.js
const path = require('path'), kok = path.resolve(__dirname, '..');
const { chromium } = require(kok + '/SPI/node_modules/playwright');
const url = require('url').pathToFileURL(path.join(kok, 'kabuk/bilesen.html')).href;
const cikti = path.join(kok, 'belgeler/ekip/sadelesme/kabuk-onizleme');

(async () => {
  const b = await chromium.launch();
  let kalan = 0;
  try {
    const p = await b.newPage(), hatalar = [];
    p.on('pageerror', e => hatalar.push(e.message));
    p.on('console', m => { if (m.type() === 'error') hatalar.push(m.text()); });
    for (const [w, vad] of [[1280, 'masaustu'], [390, 'telefon']]) for (const tm of ['acik', 'koyu']) {
      await p.setViewportSize({ width: w, height: 844 }); await p.emulateMedia({ colorScheme: tm === 'koyu' ? 'dark' : 'light' });
      await p.goto(url); await p.evaluate(() => document.fonts.ready);
      const tasma = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      const bolum = await p.evaluate(() => document.querySelectorAll('#katalog > .b-bolum').length);
      const ok = tasma <= 0 && bolum === 28;
      if (!ok) kalan++;
      console.log((ok ? '✓ ' : '✕ ') + vad + '-' + tm + ': taşma ' + tasma + ' px, ' + bolum + ' taş');
      await p.screenshot({ path: path.join(cikti, 'bilesen-' + vad + '-' + tm + '.png'), fullPage: true });
    }
    if (hatalar.length) { kalan++; console.log('✕ konsol: ' + hatalar.join(' | ')); } else console.log('✓ konsolda hata yok');
  } finally { await b.close(); }
  process.exit(kalan ? 1 : 0);
})();
