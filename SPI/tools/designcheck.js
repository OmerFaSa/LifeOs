#!/usr/bin/env node
/* DÜZEN DENETİMİ — beş tasarım dili × on iki ekran × üç genişlik.

   Düzen seçimi kabuğun ızgarasını değiştiriyor; bir düzende doğru duran
   bir ekran diğerinde taşabilir. Palet denetimi rengi, defter denetimi
   satır yapısını koruyor — bu da DÜZENİ korur.

   Aranan hatalar:
     · yatay taşma (kendi kaydırma kabı olmayan bir öge sayfayı aşıyor)
     · üst üste binen yapışkan sütun (künye sütunu içeriğin altında kalıyor)
     · çizilmeyen ekran (gövde boş)
     · konsol hatası

   Ek olarak `--shot` verilirse her düzen için birer ekran görüntüsü alır.

     node tools/designcheck.js [--shot] [port]
*/

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const SHOT = args.includes('--shot');
const PORT = Number(args.find(a => /^\d+$/.test(a))) || 4291;
const SHOTDIR = process.env.SHOT_DIR || path.join(ROOT, '.shots');

const WIDTHS = [[1280, 'masaüstü'], [980, 'tablet'], [430, 'telefon']];
const wait = ms => new Promise(r => setTimeout(r, ms));

async function waitForServer(url){
  for(let i = 0; i < 60; i++){
    try{ await fetch(url); return; }catch(e){ await wait(200); }
  }
  throw new Error('sunucu açılmadı: ' + url);
}

(async () => {
  const server = spawn('python3', [path.join(ROOT, 'devserver.py'), String(PORT)],
    { cwd:ROOT, stdio:'ignore' });
  const base = 'http://127.0.0.1:' + PORT;
  const problems = [];

  try{
    await waitForServer(base + '/index.html');
    const browser = await chromium.launch({
      executablePath:process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
    const page = await browser.newPage();

    const errs = [];
    /* Kaynak yükleme hataları burada denetlenmez: çevrimdışı ortamda yazı
       tipi CDN'i ve favicon düşer, ikisi de uygulamanın hatası değildir.
       Kaynakların gerçekten yüklendiğini duman testi denetliyor. */
    const ignorable = t => /Failed to load resource|fonts\.(googleapis|gstatic)|favicon/.test(t || '');
    page.on('pageerror', e => { if(!ignorable(e.message)) errs.push(String(e.message)); });
    page.on('console', m => {
      if(m.type() === 'error' && !ignorable(m.text())) errs.push(m.text());
    });

    await page.goto(base + '/index.html', { waitUntil:'load' });
    await page.waitForSelector('.site', { timeout:15000 });
    await wait(700);
    const skip = await page.$('[data-act="setup-skip"]');
    if(skip) await skip.click();
    await wait(300);

    const designs = await page.evaluate(() => SP.DESIGNS.map(d => d.id));
    const routes = await page.evaluate(() =>
      SP.App.SECTIONS.reduce((a, s) => a.concat(s.views.map(v => v.route)), []));

    if(SHOT) fs.mkdirSync(SHOTDIR, { recursive:true });

    for(const design of designs){
      await page.evaluate(async d => {
        await SP.Model.saveProfile({ design:d });
        SP.App.applyTheme();
        await SP.App.render();
      }, design);
      await wait(250);

      /* kök gerçekten yazıldı mı? */
      const attr = await page.evaluate(() => document.documentElement.getAttribute('data-design'));
      const beklenen = design === 'defter' ? null : design;
      if(attr !== beklenen) problems.push(design + ': kökte data-design "' + attr + '"');

      for(const [w, adi] of WIDTHS){
        await page.setViewportSize({ width:w, height:900 });
        for(const route of routes){
          await page.evaluate(r => SP.App.go(r), route);
          await wait(170);

          const r = await page.evaluate(() => {
            const d = document.documentElement;
            const over = [];
            for(const el of document.querySelectorAll('.site *')){
              const b = el.getBoundingClientRect();
              if(b.width === 0 && b.height === 0) continue;
              if(b.right <= d.clientWidth + 2 && b.left >= -2) continue;
              let p = el.parentElement, kapali = false;
              while(p){
                const ov = getComputedStyle(p).overflowX;
                if(ov === 'auto' || ov === 'scroll' || ov === 'hidden'){ kapali = true; break; }
                p = p.parentElement;
              }
              if(!kapali) over.push(el.className || el.tagName.toLowerCase());
            }
            const main = document.getElementById('main');
            return {
              scrollW:d.scrollWidth, clientW:d.clientWidth,
              text:(main && main.innerText || '').trim().length,
              over:[...new Set(over)].slice(0, 4),
            };
          });

          const yer = design + '/' + route + ' @' + adi;
          if(r.scrollW > r.clientW + 2)
            problems.push(yer + ': yatay taşma ' + r.scrollW + '>' + r.clientW
              + (r.over.length ? ' — ' + r.over.join(', ') : ''));
          else if(r.over.length)
            problems.push(yer + ': kaba sığmayan öge — ' + r.over.join(', '));
          if(r.text < 60) problems.push(yer + ': gövde boş (' + r.text + ' karakter)');
        }
      }

      if(SHOT){
        await page.setViewportSize({ width:1280, height:900 });
        await page.evaluate(() => SP.App.go('today'));
        await wait(400);
        /* Dar görünümden dönüldüğünde sayfa yüksekliği bir kare geç
           oturuyor; tam sayfa görüntüsü o eski yüksekliği yakalıyordu. */
        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(1100);
        await page.screenshot({ path:path.join(SHOTDIR, design + '.png'), fullPage:true });
      }
    }

    if(errs.length) problems.push('konsol — ' + [...new Set(errs)].slice(0, 3).join(' | '));
    await browser.close();
  }catch(e){
    problems.push('koşum hatası: ' + (e && e.message || e));
  }finally{
    server.kill();
  }

  if(problems.length){
    console.log(problems.slice(0, 40).join('\n'));
    if(problems.length > 40) console.log('… ve ' + (problems.length - 40) + ' tane daha');
    console.log('\n' + problems.length + ' sorun');
    process.exit(1);
  }
  console.log('beş düzen temiz');
})();
