const { spawn } = require('child_process');
const { chromium } = require('playwright');
const PORT = 4502; const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3',['-m','http.server',String(PORT)],{cwd:'/home/user/LifeOs/SPI',stdio:'ignore'});
  await wait(900);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const page = await b.newPage({ viewport:{ width:1280, height:900 } });
  await page.goto(`http://localhost:${PORT}/src/index.html`,{waitUntil:'load'});
  await page.waitForSelector('.site'); await wait(500);
  const skip = await page.$('[data-act="setup-skip"]'); if(skip) await skip.click();
  await wait(300);
  /* 1 · ilk Tab nereye düşüyor? Atlama bağlantısı var mı? */
  await page.evaluate(() => document.body.focus());
  const ilkler = [];
  for(let i=0;i<6;i++){
    await page.keyboard.press('Tab'); await wait(60);
    ilkler.push(await page.evaluate(() => {
      const a = document.activeElement;
      return a.tagName.toLowerCase()+'.'+String(a.className).split(' ')[0]+
        ' "'+(a.textContent||a.getAttribute('aria-label')||'').trim().slice(0,22)+'"';
    }));
  }
  /* 2 · yönlendirmede odak ve duyuru */
  await page.evaluate(async () => { await SP.App.go('labs'); });
  await wait(400);
  const yonlendirme = await page.evaluate(() => ({
    odak: document.activeElement.tagName + '.' + String(document.activeElement.className).split(' ')[0],
    landmark: { main: document.querySelectorAll('main,[role=main]').length,
                nav: document.querySelectorAll('nav,[role=navigation]').length,
                banner: document.querySelectorAll('header,[role=banner]').length,
                footer: document.querySelectorAll('footer,[role=contentinfo]').length },
    h1: [...document.querySelectorAll('h1')].map(h=>h.textContent.trim().slice(0,40)),
    baslikDuyuru: document.title,
  }));
  /* 3 · alt sayfa açıkken arka plan gizleniyor mu? */
  await page.evaluate(async () => { await SP.App.go('office'); });
  await wait(400);
  const btn = await page.$('[data-act="add-decision"]'); await btn.click(); await wait(400);
  const modal = await page.evaluate(() => {
    const sheet = document.getElementById('sheet');
    const app = document.getElementById('app') || document.querySelector('.site');
    return { arkaGizli: app ? app.getAttribute('aria-hidden') : 'yok',
             inert: app ? app.hasAttribute('inert') : false,
             rol: sheet.querySelector('[role=dialog]') ? 'dialog' : 'yok' };
  });
  await page.keyboard.press('Escape'); await wait(200);
  /* 4 · odak halkası görünür mü? */
  const odakHalka = await page.evaluate(() => {
    const b = document.querySelector('.btn') || document.querySelector('button');
    b.focus();
    const s = getComputedStyle(b);
    return { outline:s.outlineStyle+' '+s.outlineWidth+' '+s.outlineColor, shadow:s.boxShadow.slice(0,40) };
  });
  /* 5 · azaltılmış hareket */
  const rm = await page.evaluate(() => {
    const kur = [...document.styleSheets].reduce((n,ss)=>{ try{
      return n + [...ss.cssRules].filter(r=>r.conditionText && /reduced-motion/.test(r.conditionText)).length;
    }catch(e){ return n; } },0);
    return kur;
  });
  console.log(JSON.stringify({ ilkTablar:ilkler, yonlendirme, modal, odakHalka, reducedMotionKurali:rm }, null, 1));
  await b.close(); srv.kill();
})();
