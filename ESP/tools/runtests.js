#!/usr/bin/env node
/* Test paketini tarayici acmadan kosar.
 *
 * Test kosucusu (src/tests/harness.js) tarayicida calisir ve sonucu
 * window.__ESP_TESTS__ uzerine yazar. Bu betik devserver.py'yi ayaga
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

const PORT = Number(process.argv[2]) || 4188;
const ROOT = path.resolve(__dirname, '..');

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
    const page = await browser.newPage();

    const consoleErrors = [];
    page.on('pageerror', err => consoleErrors.push(String(err && err.message || err)));

    await page.goto('http://127.0.0.1:' + PORT + '/tests/', { waitUntil:'load' });
    const summary = await page.waitForFunction(() => window.__ESP_TESTS__, null,
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
