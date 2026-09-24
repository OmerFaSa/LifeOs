#!/usr/bin/env node
/* Test paketini tarayici acmadan kosar.
 *
 * Test kosucusu (src/tests/harness.js) tarayicida calisir ve sonucu
 * window.__ROTA_TESTS__ uzerine yazar. Bu betik devserver.py'yi ayaga
 * kaldirir, sayfayi bassiz Chromium'da acar ve ozeti yazdirir.
 *
 * Playwright yalnizca BU betik icin gerekir; uygulamanin kendisinin
 * hicbir bagimliligi yoktur.
 *
 *   npm i -D playwright
 *   node tools/runtests.js [port]
 *
 * Playwright'in indirdigi tarayici surumu ortamdakinden farkliysa
 * CHROMIUM_PATH ile hazir bir ikili gosterilebilir:
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/runtests.js
 *
 * Cikis kodu: 0 hepsi gecti, 1 en az bir test kaldi.
 */

const { spawn } = require('child_process');
const path = require('path');

const PORT = Number(process.argv[2]) || 4178;
const ROOT = path.resolve(__dirname, '..');

/* AYNI BETIK IKI KEZ YUKLENMEZ. ESP'nin test sayfasi `audit.test.js`'i
   iki kez yukluyordu: audit testleri iki kez kosuyor, gecen sayisi
   sisiyordu ve ikinci tur birincinin biraktigi durumu okuyordu. Hicbir
   test bunu goremez — ikisi de gecer. Sayfa acilmadan once denetlenir. */
function ikizBetikler(){
  const html = require('fs').readFileSync(path.join(ROOT, 'src', 'tests', 'index.html'), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '');
  const gorulen = {}, ikiz = [];
  (html.match(/<script[^>]*\bsrc="[^"]+"/g) || []).forEach(t => {
    const src = t.match(/src="([^"]+)"/)[1];
    if(gorulen[src]) ikiz.push(src);
    gorulen[src] = 1;
  });
  return ikiz;
}
{
  const ikiz = ikizBetikler();
  if(ikiz.length){
    console.error('Test sayfasi ayni betigi birden cok kez yukluyor: ' + ikiz.join(', '));
    process.exit(1);
  }
}

let chromium;
try{
  ({ chromium } = require('playwright'));
}catch(e){
  console.error('Playwright bulunamadi. Kurulum:  npm i -D playwright');
  process.exit(2);
}

function waitForServer(url, tries){
  return new Promise((resolve, reject) => {
    const attempt = n => {
      fetch(url).then(() => resolve()).catch(() => {
        if(n <= 0) return reject(new Error('sunucu acilmadi: ' + url));
        setTimeout(() => attempt(n - 1), 200);
      });
    };
    attempt(tries == null ? 40 : tries);
  });
}

(async () => {
  const server = spawn('python3', [path.join(ROOT, 'devserver.py'), String(PORT)],
    { cwd:ROOT, stdio:'ignore' });

  let code = 1;
  let browser;
  try{
    await waitForServer('http://127.0.0.1:' + PORT + '/tests/');
    browser = await chromium.launch(process.env.CHROMIUM_PATH
      ? { executablePath:process.env.CHROMIUM_PATH } : {});
    /* Kullanıcının saat dilimi: gece yarısından sonraki kayıt (00:00–03:00)
       UTC'de dünün tarihine düşer; testler bunu ancak burada görür. */
    const page = await browser.newPage({ reducedMotion:'reduce', timezoneId:'Europe/Istanbul' });

    const consoleErrors = [];
    page.on('pageerror', err => consoleErrors.push(String(err && err.message || err)));

    await page.goto('http://127.0.0.1:' + PORT + '/tests/', { waitUntil:'load' });
    const summary = await page.waitForFunction(() => window.__ROTA_TESTS__, null,
      { timeout:60000 }).then(h => h.jsonValue());

    const failed = summary.results.filter(r => !r.ok);
    failed.forEach(r => console.log('✕ ' + r.suite + ' › ' + r.name + '\n    ' + r.error));
    if(consoleErrors.length){
      console.log('\nSayfa hatalari:');
      consoleErrors.forEach(e => console.log('  ! ' + e));
    }
    console.log('\n' + summary.passed + '/' + summary.total + ' gecti'
      + (summary.failed ? '  ·  ' + summary.failed + ' kaldi' : ''));
    code = (summary.failed || consoleErrors.length) ? 1 : 0;
  }catch(err){
    console.error('Kosum hatasi:', err && err.message ? err.message : err);
  }finally{
    if(browser) await browser.close();
    server.kill();
  }
  process.exit(code);
})();
