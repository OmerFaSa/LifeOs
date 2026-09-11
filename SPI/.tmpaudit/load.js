/* YÜK DENETİMİ — beş yıllık veri gerçekten yazıldığında ne oluyor?
   Önceki rapor 1,8 MB'ı ÖNGÖRDÜ; bu koşum onu yazıp ölçüyor. */
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const PORT = 4503; const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3',['-m','http.server',String(PORT)],{cwd:'/home/user/LifeOs/SPI',stdio:'ignore'});
  await wait(900);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const page = await b.newPage({ viewport:{ width:1280, height:900 } });
  page.on('pageerror', e => console.log('SAYFA HATASI:', String(e).slice(0,160)));
  await page.goto(`http://localhost:${PORT}/src/index.html`,{waitUntil:'load'});
  await page.waitForSelector('.site'); await wait(500);
  const skip = await page.$('[data-act="setup-skip"]'); if(skip) await skip.click();
  await wait(300);

  const olc = await page.evaluate(async () => {
    const t0 = performance.now();
    await SP.Model.saveProfile({ name:'Ömer', birthYear:1990, sex:'male', heightCm:178,
      weightKg:78, activity:'moderate', goal:'health' });
    const GUN = 365 * 5;
    const bugun = SP.U.today();
    /* vital: her gün */
    for(let i=0;i<GUN;i++){
      const d = SP.U.iso(SP.U.addDays(bugun, -i));
      SP.S.vitals[d] = Object.assign(SP.Model.defaultVitals(d), {
        sleep:6.5+Math.random(), rhr:55+Math.round(Math.random()*10),
        hrv:40+Math.round(Math.random()*30), weight:76+Math.random()*4,
        mood:3+Math.round(Math.random()*2), steps:6000+Math.round(Math.random()*5000),
        symptomsLogged:i%3===0, symptoms:i%3===0?{yorgunluk:1+(i%3)}:{},
      });
    }
    /* öğün: günde 3 */
    const gidalar = SP.FOODS.slice(0, 30).map(f=>f.id);
    for(let i=0;i<GUN;i++){
      const d = SP.U.iso(SP.U.addDays(bugun, -i));
      SP.S.meals[d] = ['kahvalti','ogle','aksam'].map(slot => {
        const m = SP.Model.newMeal(slot);
        m.items = [0,1,2].map(k => ({ foodId:gidalar[(i*3+k)%gidalar.length],
          g:80+((i+k)%150), cert:'estimated' }));
        return m;
      });
    }
    /* antrenman: haftada 3 */
    for(let i=0;i<GUN;i+=2){
      const d = SP.U.iso(SP.U.addDays(bugun, -i));
      SP.S.workouts.push({ id:SP.U.uid('w'), date:d, templateId:null, name:'Seans',
        kind:i%2?'strength':'cardio', items:[], minutes:45, rpe:6, note:'',
        createdAt:new Date().toISOString() });
    }
    SP.S.workouts.sort((a,b)=>a.date<b.date?-1:1);
    /* tahlil: 3 ayda bir → 20 oturum */
    for(let i=0;i<20;i++){
      const d = SP.U.iso(SP.U.addDays(bugun, -i*90));
      const r = SP.Model.newLab(d);
      SP.BIOMARKERS.filter(x=>!x.daily).slice(0,40).forEach(bm => {
        const lo = (bm.ref&&bm.ref[0])||1, hi=(bm.ref&&bm.ref[1])||100;
        r.values[bm.id] = { v:Number((lo+Math.random()*(hi-lo)).toFixed(2)), cert:'measured', unit:bm.unit };
      });
      SP.S.labs.push(SP.Model.applyDerived(r));
    }
    SP.S.labs.sort((a,b)=>a.date<b.date?-1:1);
    const tYaz = performance.now() - t0;

    /* gerçek depoya yaz ve boyutu ölç */
    const t1 = performance.now();
    let yazmaHatasi = null;
    try{
      await SP.Store.set('vitals', SP.S.vitals);
      await SP.Store.set('meals', SP.S.meals);
      await SP.Store.set('workouts', SP.S.workouts);
      for(const l of SP.S.labs) await SP.Store.set('labs/'+l.id, l);
    }catch(e){ yazmaHatasi = String(e).slice(0,120); }
    const tDepo = performance.now() - t1;

    let bayt = 0;
    try{ for(const k in localStorage) if(localStorage.hasOwnProperty(k))
      bayt += (localStorage[k]||'').length + k.length; }catch(e){}

    return { gun:GUN, ogun:Object.keys(SP.S.meals).length, seans:SP.S.workouts.length,
      tahlil:SP.S.labs.length, uretimMs:Math.round(tYaz), depoMs:Math.round(tDepo),
      depoKB:Math.round(bayt/1024), yazmaHatasi };
  });

  /* her ekranı çiz ve süresini ölç */
  const routes = await page.evaluate(() => SP.App.SECTIONS.reduce((a,s)=>a.concat(s.views.map(v=>v.route)),[]));
  const sureler = {};
  for(const r of routes){
    const t = await page.evaluate(async route => {
      const t0 = performance.now();
      await SP.App.go(route);
      await new Promise(res => requestAnimationFrame(()=>requestAnimationFrame(res)));
      return Math.round(performance.now() - t0);
    }, r);
    sureler[r] = t;
  }
  /* kural motorlarının ağır fonksiyonları */
  const motor = await page.evaluate(() => {
    const ol = (ad, fn) => { const t=performance.now(); try{ fn(); }catch(e){ return [ad,'HATA '+String(e).slice(0,60)]; }
      return [ad, Math.round(performance.now()-t)+' ms']; };
    return Object.fromEntries([
      ol('Calc.crossFindings', ()=>SP.Calc.crossFindings()),
      ol('Calc.weeklyReport', ()=>SP.Calc.weeklyReport()),
      ol('Office.handoffs', ()=>SP.Office.handoffs()),
      ol('Office.notes', ()=>SP.Office.notes()),
      ol('Bio.attention', ()=>SP.Bio.attention()),
      ol('Bio.patterns', ()=>SP.Bio.patterns()),
      ol('Nutri.gaps(30)', ()=>SP.Nutri.gaps(30)),
      ol('Nutri.windowAverage(90)', ()=>SP.Nutri.windowAverage(90)),
      ol('Move.loadWindow(28)', ()=>SP.Move.loadWindow(28)),
      ol('Symptom.window(365)', ()=>SP.Symptom.window(365)),
    ]);
  });
  console.log(JSON.stringify({ olc, sureler, motor }, null, 1));
  await b.close(); srv.kill();
})();
