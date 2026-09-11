/* DEPO ÖLÇÜMÜ — tek bir kaydın maliyeti veri büyüdükçe ne oluyor? */
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const PORT = 4507; const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3',['-m','http.server',String(PORT)],{cwd:'/home/user/LifeOs/SPI',stdio:'ignore'});
  await wait(900);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const page = await b.newPage();
  await page.goto(`http://localhost:${PORT}/src/index.html`,{waitUntil:'load'});
  await page.waitForSelector('.site'); await wait(400);
  const s = await page.$('[data-act="setup-skip"]'); if(s) await s.click(); await wait(250);
  const r = await page.evaluate(async () => {
    const olc = async () => {
      const t = performance.now();
      await SP.Model.saveVitals(SP.U.todayISO(), { sleep:7.1, rhr:57, weight:74 });
      return Math.round((performance.now() - t) * 100) / 100;
    };
    const bayt = () => { let n=0; try{ for(const k in localStorage)
      if(localStorage.hasOwnProperty(k)) n += (localStorage[k]||'').length; }catch(e){} return n; };

    const noktalar = [];
    const ekle = async etiket => {
      const bir = await olc(), iki = await olc(), uc = await olc();
      noktalar.push({ etiket, kb:Math.round(bayt()/1024),
        kayitMs:Math.round(((bir+iki+uc)/3)*100)/100 });
    };
    await ekle('boş');

    const bugun = SP.U.today();
    const gidalar = SP.FOODS.slice(0,30).map(f=>f.id);
    const doldur = async (bas, son) => {
      for(let i=bas;i<son;i++){
        const d = SP.U.iso(SP.U.addDays(bugun, -i));
        await SP.Store.set('vitals/'+d, Object.assign(SP.Model.defaultVitals(d),
          { sleep:7, rhr:58, hrv:48, weight:74, mood:4, steps:8000 }));
        const m = ['kahvalti','ogle','aksam'].map(slot => {
          const x = SP.Model.newMeal(slot);
          x.items = [0,1,2].map(k=>({ foodId:gidalar[(i*3+k)%30], g:100+(i%120), cert:'estimated' }));
          return x;
        });
        await SP.Store.set('meals/'+d, m);
      }
    };
    await doldur(0, 180);    await ekle('6 ay');
    await doldur(180, 365);  await ekle('1 yıl');
    await doldur(365, 1095); await ekle('3 yıl');
    await doldur(1095, 1825);await ekle('5 yıl');
    return noktalar;
  });
  console.log('etiket   depo(KB)  tek kayıt(ms)');
  r.forEach(x => console.log(String(x.etiket).padEnd(8), String(x.kb).padStart(7), String(x.kayitMs).padStart(12)));
  await b.close(); srv.kill();
})();
