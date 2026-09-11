const { spawn } = require('child_process');
const { chromium } = require('playwright');
const PORT = 4508; const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3',['-m','http.server',String(PORT)],{cwd:'/home/user/LifeOs/SPI',stdio:'ignore'});
  await wait(900);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const cikti = [];
  for(const GUN of [0, 180, 365, 1095, 1825]){
    const page = await b.newPage();
    await page.goto(`http://localhost:${PORT}/src/index.html`,{waitUntil:'load'});
    await page.waitForSelector('.site'); await wait(350);
    const s = await page.$('[data-act="setup-skip"]'); if(s) await s.click(); await wait(200);
    const r = await page.evaluate(async gun => {
      /* TEK yazışla doldur: ölçülen şey doldurma değil, DOLU depoda
         tek bir kaydın maliyeti. */
      const db = {};
      const bugun = new Date();
      const iso = d => d.toISOString().slice(0,10);
      for(let i=0;i<gun;i++){
        const d = iso(new Date(bugun.getTime() - i*86400000));
        db['vitals/'+d] = { date:d, sleep:7, rhr:58, hrv:48, weight:74, mood:4,
          steps:8000, water:2000, symptoms:{}, symptomsLogged:false, period:false, note:'' };
        db['meals/'+d] = [0,1,2].map(k => ({ id:'m'+i+k, slot:['kahvalti','ogle','aksam'][k],
          items:[0,1,2].map(j=>({ foodId:'yumurta', g:100+j*20, cert:'estimated' })), note:'' }));
      }
      try{ localStorage.setItem('spi.v1.ben', JSON.stringify(db)); }
      catch(e){ return { hata:'kota doldu: '+gun+' gün' }; }
      let bayt=0; try{ bayt = (localStorage.getItem('spi.v1.ben')||'').length; }catch(e){}

      /* tek kayıt ve tek okuma */
      const olcYaz = async () => { const t=performance.now();
        await SP.Store.set('vitals/deneme', { date:'2026-01-01', sleep:7 });
        return performance.now()-t; };
      const olcOku = async () => { const t=performance.now();
        await SP.Store.get('vitals/deneme'); return performance.now()-t; };
      const olcListe = async () => { const t=performance.now();
        await SP.Store.list('meals'); return performance.now()-t; };
      const ort = async (fn,n) => { let s=0; for(let i=0;i<n;i++) s+=await fn(); return Math.round(s/n*100)/100; };
      return { gun, kb:Math.round(bayt/1024),
        yaz:await ort(olcYaz,5), oku:await ort(olcOku,5), liste:await ort(olcListe,3) };
    }, GUN);
    cikti.push(r);
    await page.close();
  }
  console.log('gün     depo(KB)  tek yazma  tek okuma  liste(meals)');
  cikti.forEach(x => x.hata ? console.log(x.hata) :
    console.log(String(x.gun).padEnd(7), String(x.kb).padStart(7),
      String(x.yaz+' ms').padStart(10), String(x.oku+' ms').padStart(10), String(x.liste+' ms').padStart(13)));
  await b.close(); srv.kill();
})();
