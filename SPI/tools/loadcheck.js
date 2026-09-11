#!/usr/bin/env node
/* YÜK DENETİMİ — beş yıllık veriyle uygulama hâlâ hızlı mı?

   Diğer koşumlar sekiz ölçümle çalışır ve bu bir kör nokta yarattı:
   ofis ekranının bir çizimi beş yıllık veriyle 996 ms sürüyordu, boş
   veriyle 60 ms. Yavaşlama veri biriktikçe geliyor ve kullanıcı onu
   fark ettiğinde çoktan alışkanlık kırılmış oluyor.

   Bu koşum gerçek hacimde veri üretir, on iki ekranı çizer ve her
   birinin süresini bir eşikle karşılaştırır. Eşik keyfi değil: 400 ms
   bir etkileşimin "anında" hissedilmesinin üst sınırıdır.

     node tools/loadcheck.js [port]
*/

const { spawn } = require('child_process');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 4292;
const ESIK_MS = 400;        /* tek ekran çizimi */
const TOPLAM_ESIK_MS = 3500;/* on iki ekran */
const YIL = 5;
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd:ROOT, stdio:'ignore' });
  await wait(900);
  const browser = await chromium.launch({
    executablePath:process.env.CHROMIUM_PATH || undefined });
  const problems = [];
  let sureler = {}, motor = {};

  try{
    const page = await browser.newPage({ viewport:{ width:1280, height:900 } });
    page.on('pageerror', e => problems.push('sayfa hatası: ' + String(e).slice(0, 120)));
    await page.goto('http://localhost:' + PORT + '/src/index.html', { waitUntil:'load' });
    await page.waitForSelector('.site', { timeout:15000 });
    await wait(600);
    const skip = await page.$('[data-act="setup-skip"]');
    if(skip) await skip.click();
    await wait(300);

    const hacim = await page.evaluate(async yil => {
      await SP.Model.saveProfile({ name:'Ömer', birthYear:1990, sex:'male',
        heightCm:178, weightKg:78, activity:'moderate', goal:'health' });
      const GUN = 365 * yil;
      const bugun = SP.U.today();
      const gidalar = SP.FOODS.slice(0, 30).map(f => f.id);

      /* Doğrudan duruma yazılır: ölçülen şey DEPO değil ÇİZİM. */
      for(let i = 0; i < GUN; i++){
        const d = SP.U.iso(SP.U.addDays(bugun, -i));
        SP.S.vitals[d] = Object.assign(SP.Model.defaultVitals(d), {
          sleep:6.5 + (i % 3) * 0.5, rhr:55 + (i % 10), hrv:40 + (i % 30),
          weight:76 + (i % 40) / 10, mood:3 + (i % 3), steps:6000 + (i % 5000),
          symptomsLogged:i % 3 === 0, symptoms:i % 3 === 0 ? { yorgunluk:1 + (i % 3) } : {},
        });
        SP.S.meals[d] = ['kahvalti', 'ogle', 'aksam'].map((slot, k) => {
          const m = SP.Model.newMeal(slot);
          m.items = [0, 1, 2].map(j => ({ foodId:gidalar[(i * 3 + k + j) % gidalar.length],
            g:80 + ((i + j) % 150), cert:'estimated' }));
          return m;
        });
      }
      for(let i = 0; i < GUN; i += 2){
        SP.S.workouts.push({ id:SP.U.uid('w'), date:SP.U.iso(SP.U.addDays(bugun, -i)),
          templateId:null, name:'Seans', kind:i % 2 ? 'strength' : 'cardio',
          items:[], minutes:45, rpe:6, note:'', createdAt:new Date().toISOString() });
      }
      SP.S.workouts.sort((a, b) => a.date < b.date ? -1 : 1);
      for(let i = 0; i < yil * 4; i++){
        const r = SP.Model.newLab(SP.U.iso(SP.U.addDays(bugun, -i * 90)));
        SP.BIOMARKERS.filter(x => !x.daily).slice(0, 40).forEach(bm => {
          const lo = (bm.ref && bm.ref[0]) || 1, hi = (bm.ref && bm.ref[1]) || 100;
          r.values[bm.id] = { v:Number((lo + (i % 7) / 7 * (hi - lo)).toFixed(2)),
            cert:'measured', unit:bm.unit };
        });
        SP.S.labs.push(SP.Model.applyDerived(r));
      }
      SP.S.labs.sort((a, b) => a.date < b.date ? -1 : 1);
      return { gun:GUN, ogun:Object.keys(SP.S.meals).length,
        seans:SP.S.workouts.length, tahlil:SP.S.labs.length };
    }, YIL);

    const routes = await page.evaluate(() =>
      SP.App.SECTIONS.reduce((a, s) => a.concat(s.views.map(v => v.route)), []));

    for(const r of routes){
      /* Isınma çizimi sayılmaz; ölçülen ikinci çizimdir. */
      await page.evaluate(async x => { await SP.App.go(x); }, r);
      await wait(200);
      const t = await page.evaluate(async route => {
        const t0 = performance.now();
        await SP.App.render();
        await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
        return Math.round(performance.now() - t0);
      }, r);
      sureler[r] = t;
      if(t > ESIK_MS) problems.push(r + ': ' + t + ' ms (eşik ' + ESIK_MS + ')');
    }

    const toplam = Object.values(sureler).reduce((a, b) => a + b, 0);
    if(toplam > TOPLAM_ESIK_MS)
      problems.push('on iki ekran toplamı ' + toplam + ' ms (eşik ' + TOPLAM_ESIK_MS + ')');

    motor = await page.evaluate(() => {
      const ol = (ad, fn) => { const t = performance.now();
        try{ fn(); }catch(e){ return [ad, -1]; }
        return [ad, Math.round(performance.now() - t)]; };
      return Object.fromEntries([
        ol('Calc.crossFindings', () => SP.Calc.crossFindings()),
        ol('Office.notes', () => SP.Office.notes()),
        ol('Office.handoffs', () => SP.Office.handoffs()),
        ol('Bio.attention', () => SP.Bio.attention()),
        ol('Nutri.gaps(30)', () => SP.Nutri.gaps(30)),
      ]);
    });

    console.log('  hacim → ' + hacim.gun + ' gün vital · ' + (hacim.ogun * 3) + ' öğün · '
      + hacim.seans + ' seans · ' + hacim.tahlil + ' tahlil');
    const sirali = Object.entries(sureler).sort((a, b) => b[1] - a[1]);
    console.log('  en yavaş üç ekran → ' + sirali.slice(0, 3)
      .map(([k, v]) => k + ' ' + v + ' ms').join(' · '));
    console.log('  toplam → ' + toplam + ' ms');
  }catch(err){
    console.error('Koşum hatası:', err && err.message ? err.message : err);
    await browser.close(); srv.kill();
    process.exit(2);
  }

  await browser.close();
  srv.kill();

  if(problems.length){
    console.log('YÜK SORUNU (' + problems.length + ')');
    problems.forEach(p => console.log('  · ' + p));
    console.log('  motor → ' + Object.entries(motor).map(([k, v]) => k + ' ' + v + ' ms').join(' · '));
    process.exit(1);
  }
  console.log('yuk denetimi temiz (' + YIL + ' yillik veri)');
})();
