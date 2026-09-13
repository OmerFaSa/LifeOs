#!/usr/bin/env node
/* Duman testi — uygulamayi gercekten acar, butun ekranlari ve sekmeleri gezer.
 *
 * AYS uzun sure bu araçtan yoksundu: birim testleri (tools/runtests.js)
 * fonksiyonlari denetliyordu ama HICBIR SEY ekranin cizilip cizilmedigini
 * denetlemiyordu. Bir ekranda tanimsiz bir degisken, bir sekmede eksik bir
 * fonksiyon — ikisi de butun testler gecerken sessizce yasayabilirdi.
 * Kullanici bunu kirmizi bir hata panelinde gorurdu, biz hic gormezdik.
 *
 * Bu betik dort sey arar:
 *   1. Her ekran ciziliyor mu (baslik var mi, govde bos mu)
 *   2. Her SEKME ciziliyor mu — ekranin acilmasi ikinci sekmesinin de
 *      calistigi anlamina gelmez
 *   3. Konsola sayfa hatasi dusuyor mu
 *   4. Cizilen metinde sizinti var mi: undefined, NaN, [object Object]
 *
 * Hem kaynak (src/index.html) hem derlenmis parca (dist/rota.html) ayni
 * denetimden gecer.
 *
 *   node tools/smoke.js [port]
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/smoke.js
 *
 * Cikis kodu: 0 temiz, 1 sorun var.
 */

const { spawn } = require('child_process');
const path = require('path');

const PORT = Number(process.argv[2]) || 4176;
const ROOT = path.resolve(__dirname, '..');

let chromium;
try{
  ({ chromium } = require('playwright'));
}catch(e){
  console.error('Playwright bulunamadi. Kurulum:  npm i -D playwright');
  process.exit(2);
}

/* Cevrimdisi ortamda beklenen basarisizliklar. */
const IGNORE = [/fonts\.googleapis\.com/, /fonts\.gstatic\.com/, /favicon\.ico/];
function ignorable(url){ return IGNORE.some(re => re.test(url || '')); }

const wait = ms => new Promise(r => setTimeout(r, ms));

async function waitForServer(url, tries){
  for(let i = 0; i < (tries || 40); i++){
    try{ await fetch(url); return; }catch(e){ await wait(200); }
  }
  throw new Error('sunucu acilmadi: ' + url);
}

/* Cizilen METINDE sizinti. Bunlar kullaniciya asla gorunmemesi gereken
   degerlerdir ve gorundugunde bir hesap sessizce bozulmus demektir. */
const SIZINTI = [/\bundefined\b/, /\bNaN\b/, /\[object Object\]/];

async function scanText(page, nerede, errors){
  const txt = await page.$eval('#main', el => el.innerText || '');
  SIZINTI.forEach(re => {
    if(re.test(txt)){
      const m = txt.match(new RegExp('.{0,40}' + re.source + '.{0,40}'));
      errors.push(nerede + ': metinde sızıntı — ' + (m ? m[0].trim() : re.source));
    }
  });
}

async function checkPanel(page, nerede, errors){
  const panel = await page.$('.notice--danger');
  if(!panel) return;
  const txt = (await panel.textContent()) || '';
  if(/çizilemedi|başlatılamadı|ters gitti/.test(txt)){
    errors.push(nerede + ': hata paneli — ' + txt.trim().slice(0, 120));
  }
}

async function walkScreens(page, base, target, errors){
  await page.goto(base + target, { waitUntil:'load' });
  await page.waitForSelector('.site', { timeout:15000 });
  await wait(800);

  /* Acik bir alt sayfa (sheet) tiklamalari yutar: her adimdan once kapat. */
  async function kapat(){
    const acik = await page.$('#sheet .sheet, #sheet .overlay__box, #sheet > *');
    if(acik){
      await page.keyboard.press('Escape');
      await wait(150);
      const hala = await page.$('#sheet .sheet, #sheet .overlay__box, #sheet > *');
      if(hala) await page.evaluate(() => { if(R.UI && R.UI.closeSheet) R.UI.closeSheet(); });
      await wait(120);
    }
  }

  const routes = await page.evaluate(() =>
    R.App.NAV.reduce((acc, s) => acc.concat(s.items.map(i => i.id)), []));

  let sekme = 0;
  for(const r of routes){
    await kapat();
    await page.evaluate(id => R.App.go(id), r);
    await wait(200);
    await kapat();
    const nerede = target + ' · ' + r;

    const title = await page.textContent('.hero__title');
    const size = await page.$eval('#main', el => el.innerHTML.length);
    if(!title) errors.push(nerede + ': başlık yok');
    if(size < 50) errors.push(nerede + ': ekran boş çizildi');
    await checkPanel(page, nerede, errors);
    await scanText(page, nerede, errors);

    /* Sekmeleri de gez: ekranin acilmasi ikinci sekmesinin calistigi
       anlamina gelmez. */
    const SEC = '.subtabs [data-act], .segmented [data-act]';
    const tablar = await page.$$(SEC);
    for(let i = 0; i < tablar.length; i++){
      const el = (await page.$$(SEC))[i];
      if(!el) continue;
      const ad = ((await el.textContent()) || '').trim().slice(0, 24);
      await kapat();
      await el.click({ timeout:5000 }).catch(() => {});
      await wait(200);
      sekme++;
      if(process.env.SMOKE_VERBOSE) console.log('      ' + nerede + '/' + ad);
      await checkPanel(page, nerede + '/' + ad, errors);
      await scanText(page, nerede + '/' + ad, errors);
      const s2 = await page.$eval('#main', e => e.innerHTML.length);
      if(s2 < 50) errors.push(nerede + '/' + ad + ': sekme boş çizildi');
    }
  }

  console.log('  ' + target + ' → ' + routes.length + ' ekran, ' + sekme + ' sekme gezildi');
}


/* Gercek kullanim akisi: kor net tahmini → deneme kaydi → kalibrasyon.

   Bu akis ozellikle KORLUGU dener: once tahmin yazilip sonra sonuclar
   girilirse tahmin puana girer; once sonuclar girilip sonra tahmin
   yazilirsa girmez. Ikisini de kontrol eder. */
async function walkFlows(page, base, errors){
  await page.goto(base + '/index.html', { waitUntil:'load' });
  await page.waitForSelector('.site', { timeout:15000 });
  await wait(800);

  async function denemeEkle(tahminOnce, tahmin){
    await page.evaluate(() => R.App.go('exams'));
    await wait(300);
    await page.evaluate(() => R.Screens.exams.handle['new-exam']());
    await wait(400);
    if(tahminOnce){
      await page.fill('#ex-guess', String(tahmin));
      await wait(80);
    }
    const hucre = await page.$$('#ex-tests [data-t="c"]');
    if(!hucre.length) throw new Error('deneme formu satır üretmedi');
    await hucre[0].fill('30');
    const yanlis = await page.$$('#ex-tests [data-t="w"]');
    await yanlis[0].fill('8');
    await wait(80);
    if(!tahminOnce){
      await page.fill('#ex-guess', String(tahmin));
      await wait(80);
    }
    await page.click('[data-act="save-exam"]');
    await wait(500);
  }

  await denemeEkle(true, 40);
  const korlu = await page.evaluate(() => {
    const f = R.Calib.settled();
    return { n:f.length, blind:f.length ? f[0].blind : null };
  });
  if(korlu.n !== 1) errors.push('kalibrasyon akışı: 1 kapanmış tahmin bekleniyordu, ' + korlu.n + ' geldi');
  if(korlu.blind !== true) errors.push('kalibrasyon akışı: önce yazılan tahmin kör sayılmadı');

  await denemeEkle(false, 40);
  const korsuz = await page.evaluate(() => {
    const hepsi = R.S.forecasts.filter(f => f.actual != null);
    return { n:hepsi.length, sonKor:hepsi.length ? hepsi[hepsi.length - 1].blind : null };
  });
  if(korsuz.n !== 2) errors.push('kalibrasyon akışı: ikinci tahmin kaydedilmedi');
  if(korsuz.sonKor !== false){
    errors.push('kalibrasyon akışı: sonuçlardan SONRA yazılan tahmin kör sayıldı');
  }

  console.log('  akışlar → kör net tahmini, deneme kaydı ve kalibrasyon çalıştı');
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
      if(r.status() >= 400 && !ignorable(r.url())) errors.push(r.status() + ': ' + r.url());
    });

    await walkScreens(page, base, '/index.html', errors);
    await walkScreens(page, base, '/dist/rota.html', errors);
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
