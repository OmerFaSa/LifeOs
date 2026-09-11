/* ERİŞİLEBİLİRLİK DENETİMİ — kaynaktan değil, ÇİZİLEN sayfadan.
   Aranan: adsız denetim, etiketsiz alan, kontrastsız odak, yanlış
   başlık sırası, canlı bölge eksikliği, dokunma hedefi boyutu. */
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const PORT = 4501; const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3',['-m','http.server',String(PORT)],{cwd:'/home/user/LifeOs/SPI',stdio:'ignore'});
  await wait(900);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const page = await b.newPage({ viewport:{ width:1280, height:900 } });
  await page.goto(`http://localhost:${PORT}/src/index.html`,{waitUntil:'load'});
  await page.waitForSelector('.site'); await wait(500);
  const skip = await page.$('[data-act="setup-skip"]'); if(skip) await skip.click();
  await wait(300);
  await page.evaluate(async () => {
    await SP.Model.saveProfile({ name:'Ömer', birthYear:1998, sex:'female', heightCm:170,
      weightKg:64, activity:'moderate', goal:'health' });
    const r = SP.Model.newLab('2026-08-20');
    Object.entries({ hemoglobin:11.8, ferritin:14, b12:288, hdl:44, ldl:128, chol:210,
      trig:140, tsh:2.6, crp:1.2, glukoz:92, vitd:16, creat:0.8 }).forEach(([k,v])=>{
      const bb=SP.BIO_BY_ID[k]; if(bb) r.values[k]={v,cert:'measured',unit:bb.unit};});
    await SP.Model.saveLab(r);
    for(let i=0;i<8;i++){ const d=SP.U.iso(SP.U.addDays(SP.U.today(),-i));
      await SP.Model.saveVitals(d,{sleep:7,rhr:58,weight:64,mood:4,hrv:48}); }
  });
  await wait(300);
  const routes = await page.evaluate(() =>
    SP.App.SECTIONS.reduce((a,s)=>a.concat(s.views.map(v=>v.route)),[]));
  const bulgular = {};
  const ekle = (tur, ek) => { (bulgular[tur]=bulgular[tur]||[]).push(ek); };

  for(const route of routes){
    await page.evaluate(async r => { await SP.App.go(r); }, route);
    await wait(400);
    const r = await page.evaluate(() => {
      const out = { adsiz:[], etiketsiz:[], baslik:[], kucuk:[], imgAlt:[], tabindex:[] };
      const metin = el => (el.textContent||'').trim();
      const ad = el => metin(el) || el.getAttribute('aria-label') || el.getAttribute('title')
        || (el.getAttribute('aria-labelledby') &&
            (document.getElementById(el.getAttribute('aria-labelledby'))||{}).textContent) || '';
      /* 1 · adsız düğme/bağlantı */
      document.querySelectorAll('button, a[href], [role="button"]').forEach(el => {
        if(el.offsetParent === null) return;
        if(!ad(el).trim()) out.adsiz.push((el.className||el.tagName) + ' @' +
          (el.dataset.act||el.dataset.change||'?'));
      });
      /* 2 · etiketsiz form alanı */
      document.querySelectorAll('input, select, textarea').forEach(el => {
        if(el.offsetParent === null) return;
        if(el.type === 'hidden') return;
        const id = el.id;
        const lbl = id && document.querySelector('label[for="'+CSS.escape(id)+'"]');
        const sarmal = el.closest('label');
        if(!lbl && !sarmal && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby'))
          out.etiketsiz.push(el.tagName.toLowerCase() + '#' + (id||'-') +
            ' [' + (el.placeholder||el.name||el.dataset.change||'?') + ']');
      });
      /* 3 · başlık sırası atlaması */
      let onceki = 0;
      document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
        if(h.offsetParent === null) return;
        const n = Number(h.tagName[1]);
        if(onceki && n > onceki + 1) out.baslik.push('h'+onceki+' → h'+n+': "'+metin(h).slice(0,34)+'"');
        onceki = n;
      });
      /* 4 · küçük dokunma hedefi (24px WCAG 2.2 AA) */
      document.querySelectorAll('button, a[href], [role="button"], input[type=checkbox], input[type=radio]').forEach(el => {
        if(el.offsetParent === null) return;
        const r = el.getBoundingClientRect();
        if(r.width < 24 || r.height < 24)
          out.kucuk.push((el.className||el.tagName)+' '+Math.round(r.width)+'×'+Math.round(r.height));
      });
      /* 5 · alt'sız görsel */
      document.querySelectorAll('img').forEach(el => {
        if(el.getAttribute('alt') === null) out.imgAlt.push(el.src.slice(-40));
      });
      /* 6 · pozitif tabindex */
      document.querySelectorAll('[tabindex]').forEach(el => {
        if(Number(el.getAttribute('tabindex')) > 0) out.tabindex.push(el.className);
      });
      return out;
    });
    Object.entries(r).forEach(([k,v]) => { if(v.length) ekle(k, route+': '+[...new Set(v)].slice(0,4).join(' · ')); });
  }

  /* 7 · canlı bölge: kaydetme bildirimi okunuyor mu? */
  const canli = await page.evaluate(() => {
    const n = document.querySelectorAll('[aria-live]');
    return { sayi:n.length, yerler:[...n].map(x=>x.id||x.className).slice(0,8) };
  });

  /* 8 · klavyeyle ulaşılamayan tıklanabilir öge */
  const tiklanabilir = await page.evaluate(async () => {
    await SP.App.go('office'); return null;
  });
  await wait(400);
  const odaksiz = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('[data-act]').forEach(el => {
      if(el.offsetParent === null) return;
      const t = el.tagName.toLowerCase();
      if(t === 'button' || t === 'a' || t === 'input' || t === 'select' || t === 'textarea') return;
      if(el.getAttribute('tabindex') !== null) return;
      bad.push(t+'.'+String(el.className).split(' ')[0]+' @'+el.dataset.act);
    });
    return [...new Set(bad)].slice(0, 10);
  });

  console.log(JSON.stringify({ bulgular, canli, odaksiz }, null, 1));
  await b.close(); srv.kill();
})();
