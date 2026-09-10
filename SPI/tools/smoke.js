#!/usr/bin/env node
/* Duman testi — uygulamayi gercekten acar, butun ekranlari gezer, akis dener.
 *
 * Birim testleri (tools/runtests.js) fonksiyonlari denetler; bu betik
 * UYGULAMAYI denetler: ekranlar cizilebiliyor mu, konsola hata dusuyor mu,
 * bir ogun gercekten eklenebiliyor mu, yapistirilan tahlil kaydediliyor mu.
 *
 * Hem kaynak surumu (src/index.html) hem derlenmis tek dosya (dist/spi.html)
 * ayni denetimden gecer: derleme sirasinda bozulan bir sey burada yakalanir.
 *
 *   node tools/smoke.js [port]
 *
 * CHROMIUM_PATH ile hazir bir tarayici ikilisi gosterilebilir:
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/smoke.js
 *
 * Cikis kodu: 0 temiz, 1 sorun var.
 */

const { spawn } = require('child_process');
const path = require('path');

const PORT = Number(process.argv[2]) || 4193;
const ROOT = path.resolve(__dirname, '..');

let chromium;
try{
  ({ chromium } = require('playwright'));
}catch(e){
  console.error('Playwright bulunamadi. Kurulum:  npm i -D playwright');
  process.exit(2);
}

/* Cevrimdisi ortamda beklenen basarisizliklar: uygulamanin kendi hatasi degil. */
const IGNORE = [/fonts\.googleapis\.com/, /fonts\.gstatic\.com/, /favicon\.ico/];
function ignorable(url){ return IGNORE.some(re => re.test(url || '')); }

const wait = ms => new Promise(r => setTimeout(r, ms));

async function waitForServer(url, tries){
  for(let i = 0; i < (tries || 40); i++){
    try{ await fetch(url); return; }catch(e){ await wait(200); }
  }
  throw new Error('sunucu acilmadi: ' + url);
}

/* Kurulum sihirbazi acilirsa kapat — duman testi bos profille de gecmeli. */
async function dismissSetup(page){
  await wait(700);
  const skip = await page.$('[data-act="setup-skip"]');
  if(skip) await skip.click();
  await wait(200);
}

async function walkScreens(page, base, target, errors){
  await page.goto(base + target, { waitUntil:'load' });
  await page.waitForSelector('.shell', { timeout:15000 });
  await dismissSetup(page);

  const routes = await page.evaluate(() =>
    SP.App.NAV.reduce((acc, g) => acc.concat(g.items.map(i => i.id)), []));

  for(const r of routes){
    await page.evaluate(id => SP.App.go(id), r);
    await wait(160);
    const title = await page.textContent('.topbar h1');
    const size = await page.$eval('#main', el => el.innerHTML.length);
    if(!title) errors.push(target + ' · ' + r + ': başlık yok');
    if(size < 50) errors.push(target + ' · ' + r + ': ekran boş çizildi');

    const panel = await page.$('.notice--danger');
    if(panel){
      const txt = (await panel.textContent()) || '';
      if(/çizilemedi|başlatılamadı/.test(txt)){
        errors.push(target + ' · ' + r + ': hata paneli — ' + txt.trim().slice(0, 120));
      }
    }
  }

  /* Komut paleti her yerden acilmali. */
  await page.keyboard.press('Control+K');
  await wait(250);
  if(!(await page.$('#cmdk'))) errors.push(target + ': komut paleti açılmadı');
  await page.keyboard.press('Escape');
  await wait(150);

  console.log('  ' + target + ' → ' + routes.length + ' ekran gezildi');
}

/* Gercek kullanim akisi: profil → ogun → tahlil → hedefin degismesi. */
async function walkFlows(page, base, errors){
  await page.goto(base + '/index.html', { waitUntil:'load' });
  await page.waitForSelector('.shell', { timeout:15000 });
  await dismissSetup(page);

  await page.evaluate(async () => {
    await SP.Model.saveProfile({ name:'Duman', birthYear:1994, sex:'male',
      heightCm:178, weightKg:78, activity:'moderate', goal:'health' });
  });

  /* 1 — serbest metinden ogun */
  await page.evaluate(() => SP.App.go('meals'));
  await wait(300);
  await page.fill('#meal-text', '1 tabak etli kuru fasulye, 2 dilim ekmek ve 1 bardak ayran');
  await page.click('[data-act="add-meal"]');
  await wait(400);
  const items = await page.evaluate(() => {
    const rows = SP.Model.mealsOf(SP.U.todayISO());
    return rows.length ? rows[0].items.length : 0;
  });
  if(items !== 3) errors.push('öğün akışı: 3 kalem bekleniyordu, ' + items + ' geldi');

  /* 2 — yapistirilan tahlil */
  await page.evaluate(() => SP.App.go('labs'));
  await wait(300);
  await page.click('[data-act="open-paste"]');
  await wait(300);
  await page.fill('#paste-text', 'Hemoglobin 14,2 g/dL\nFerritin 22 ng/mL\nAçlık glukozu 92 mg/dL');
  await page.click('[data-act="run-paste"]');
  await wait(400);
  await page.click('[data-act="save-paste"]');
  await wait(500);
  const labs = await page.evaluate(() => SP.S.labs.length);
  if(labs !== 1) errors.push('tahlil akışı: 1 oturum bekleniyordu, ' + labs + ' geldi');

  /* 3 — Modul 1 → Modul 2 bagi: dusuk ferritin demir hedefini yukseltmeli */
  const mult = await page.evaluate(() => SP.Nutri.targets().micro.iron.mult);
  if(!(mult > 1)) errors.push('laboratuvar bağı: demir çarpanı yükselmedi (' + mult + ')');

  /* 4 — gunluk olcum toparlanma skoru uretmeli */
  await page.evaluate(async () => { await SP.Model.saveVitals(SP.U.todayISO(), { sleep:8, soreness:4 }); });
  const score = await page.evaluate(() => SP.Move.readiness().score);
  if(!(score > 0)) errors.push('toparlanma akışı: skor üretilmedi');

  console.log('  akışlar → öğün, tahlil, laboratuvar bağı ve toparlanma çalıştı');
}

(async () => {
  const server = spawn('python3', [path.join(ROOT, 'devserver.py'), String(PORT)],
    { cwd:ROOT, stdio:'ignore' });

  let code = 1;
  let browser;
  const base = 'http://127.0.0.1:' + PORT;
  const errors = [];

  try{
    await waitForServer(base + '/index.html');
    browser = await chromium.launch(process.env.CHROMIUM_PATH
      ? { executablePath:process.env.CHROMIUM_PATH } : {});
    const page = await browser.newPage();

    page.on('pageerror', e => errors.push('sayfa hatası: ' + (e && e.message || e)));
    page.on('requestfailed', r => {
      if(!ignorable(r.url())) errors.push('istek başarısız: ' + r.url());
    });
    page.on('response', r => {
      if(r.status() >= 400 && !ignorable(r.url())){
        errors.push(r.status() + ': ' + r.url());
      }
    });

    await walkScreens(page, base, '/index.html', errors);
    await walkScreens(page, base, '/dist/spi.html', errors);
    await walkFlows(page, base, errors);

    if(errors.length){
      console.log('\n' + errors.length + ' sorun:');
      errors.forEach(e => console.log('  ✕ ' + e));
    }else{
      console.log('\nDuman testi temiz.');
    }
    code = errors.length ? 1 : 0;
  }catch(err){
    console.error('Koşum hatası:', err && err.message ? err.message : err);
  }finally{
    if(browser) await browser.close();
    server.kill();
  }
  process.exit(code);
})();
