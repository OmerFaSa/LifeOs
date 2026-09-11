const { spawn } = require('child_process');
const { chromium } = require('playwright');
const PORT = 4504; const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3',['-m','http.server',String(PORT)],{cwd:'/home/user/LifeOs/SPI',stdio:'ignore'});
  await wait(900);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const page = await b.newPage({ viewport:{ width:1280, height:900 } });
  await page.goto(`http://localhost:${PORT}/src/index.html`,{waitUntil:'load'});
  await page.waitForSelector('.site'); await wait(500);
  const skip = await page.$('[data-act="setup-skip"]'); if(skip) await skip.click();
  await wait(300);
  const r = await page.evaluate(async () => {
    await SP.Model.saveProfile({ name:'Ö', birthYear:1990, sex:'male', heightCm:178,
      weightKg:78, activity:'moderate', goal:'health' });
    const lab = SP.Model.newLab('2026-08-20');
    ['ferritin','vitd','b12','hemoglobin','tsh','crp'].forEach(id=>{
      const bb=SP.BIO_BY_ID[id]; if(bb) lab.values[id]={v:(bb.ref?bb.ref[0]*0.6:10),cert:'measured',unit:bb.unit};});
    await SP.Model.saveLab(lab);
    for(let i=0;i<200;i++){ const d=SP.U.iso(SP.U.addDays(SP.U.today(),-i));
      SP.S.vitals[d]=Object.assign(SP.Model.defaultVitals(d),{sleep:7,rhr:58,hrv:48,weight:78,mood:4}); }

    const sayac = {};
    const sar = (obj, ad) => { const o = obj[ad]; obj[ad] = function(){ sayac[ad]=(sayac[ad]||0)+1; return o.apply(this, arguments); }; };
    ['handoffs','handoffsFor','notes','brief','ruleText','agendaCandidates'].forEach(a=>sar(SP.Office,a));
    ['crossFindings','weeklyReport'].forEach(a=>sar(SP.Calc,a));
    ['attention','summary','overdue','patterns'].forEach(a=>sar(SP.Bio,a));

    await SP.App.go('office');
    await new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res)));
    const ofis = Object.assign({}, sayac);
    Object.keys(sayac).forEach(k=>delete sayac[k]);
    await SP.App.go('labs');
    await new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res)));
    const labs = Object.assign({}, sayac);
    Object.keys(sayac).forEach(k=>delete sayac[k]);
    await SP.App.go('today');
    await new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res)));
    return { ofis, labs, bugun:Object.assign({}, sayac) };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close(); srv.kill();
})();
