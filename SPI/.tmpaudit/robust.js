/* DAYANIKLILIK — düşmanca girdi, bozuk depo, dolu kota, çöken ekran. */
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const PORT = 4506; const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3',['-m','http.server',String(PORT)],{cwd:'/home/user/LifeOs/SPI',stdio:'ignore'});
  await wait(900);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const sonuc = {};

  /* 1 · düşmanca metin her yere girer mi? */
  {
    const page = await b.newPage();
    let alert = false;
    page.on('dialog', async d => { alert = true; await d.dismiss(); });
    await page.goto(`http://localhost:${PORT}/src/index.html`,{waitUntil:'load'});
    await page.waitForSelector('.site'); await wait(400);
    const s = await page.$('[data-act="setup-skip"]'); if(s) await s.click(); await wait(250);
    const kotu = '<img src=x onerror="window.__XSS=1">"><script>window.__XSS=1</script>';
    await page.evaluate(async k => {
      await SP.Model.saveProfile({ name:k, birthYear:1990, sex:'male', heightCm:178,
        weightKg:78, activity:'moderate', goal:'health' });
      const r = SP.Model.newLab('2026-08-20'); r.lab = k;
      r.values.ferritin = { v:14, cert:'measured', unit:'ng/mL' };
      await SP.Model.saveLab(r);
      await SP.Model.saveDecision({ title:k, why:k });
      const f = SP.Model.newFood ? SP.Model.newFood() : null;
      if(f){ f.name = k; f.kcal=100; f.p=5; f.f=2; f.c=10; await SP.Model.saveFood(f); }
    }, kotu);
    const routes = await page.evaluate(()=>SP.App.SECTIONS.reduce((a,x)=>a.concat(x.views.map(v=>v.route)),[]));
    for(const r of routes){ await page.evaluate(async x=>{await SP.App.go(x);}, r); await wait(200); }
    sonuc.xss = await page.evaluate(() => ({
      tetiklendi: !!window.__XSS,
      kacisliGorunuyor: document.body.textContent.indexOf('<img src=x') >= 0,
      enjekteImg: document.querySelectorAll('img[src="x"]').length,
    }));
    sonuc.xss.alert = alert;
    await page.close();
  }

  /* 2 · bozuk depo ile açılış */
  {
    const page = await b.newPage();
    const hatalar = []; page.on('pageerror', e=>hatalar.push(String(e).slice(0,110)));
    await page.goto(`http://localhost:${PORT}/src/index.html`,{waitUntil:'load'});
    await page.evaluate(() => { try{ localStorage.setItem('spi.db','{bozuk json'); }catch(e){} });
    await page.reload({ waitUntil:'load' });
    let acildi = true;
    try{ await page.waitForSelector('.site',{timeout:8000}); }catch(e){ acildi = false; }
    await wait(500);
    sonuc.bozukDepo = { acildi, ekranBos: await page.evaluate(()=>{
      const a=document.getElementById('app'); return !a || a.textContent.trim().length < 40; }),
      hata:hatalar.slice(0,2) };
    await page.close();
  }

  /* 3 · localStorage kapalı (gizli kip taklidi) */
  {
    const ctx = await b.newContext();
    await ctx.addInitScript(() => {
      const at = () => { const e = new Error('denied'); e.name='SecurityError'; throw e; };
      try{ Object.defineProperty(window,'localStorage',{ get:()=>({ getItem:at, setItem:at,
        removeItem:at, key:at, clear:at, length:0 }) }); }catch(e){}
    });
    const page = await ctx.newPage();
    const hatalar = []; page.on('pageerror', e=>hatalar.push(String(e).slice(0,110)));
    await page.goto(`http://localhost:${PORT}/src/index.html`,{waitUntil:'load'});
    let acildi = true;
    try{ await page.waitForSelector('.site',{timeout:8000}); }catch(e){ acildi=false; }
    await wait(500);
    sonuc.depoYok = { acildi, hata:hatalar.slice(0,2),
      uyariVar: await page.evaluate(()=>document.body.textContent.match(/depo|kay[ıi]t|saklan/i)?true:false) };
    await ctx.close();
  }

  /* 4 · bir ekran çökerse kabuk ayakta mı? */
  {
    const page = await b.newPage();
    await page.goto(`http://localhost:${PORT}/src/index.html`,{waitUntil:'load'});
    await page.waitForSelector('.site'); await wait(400);
    const s = await page.$('[data-act="setup-skip"]'); if(s) await s.click(); await wait(250);
    sonuc.cokenEkran = await page.evaluate(async () => {
      const eski = SP.Screens.labs.render;
      SP.Screens.labs.render = () => { throw new Error('bilerek çökertildi'); };
      await SP.App.go('labs');
      await new Promise(r=>setTimeout(r,300));
      const govde = document.getElementById('app').textContent;
      const kabuk = !!document.querySelector('.sitenav, .masthead, .site');
      SP.Screens.labs.render = eski;
      await SP.App.go('today');
      await new Promise(r=>setTimeout(r,300));
      return { kabukAyakta:kabuk, hataMesajiVar:/hata/i.test(govde),
        kurtarildi: document.getElementById('app').textContent.length > 200 };
    });
    await page.close();
  }
  console.log(JSON.stringify(sonuc, null, 1));
  await b.close(); srv.kill();
})();
