#!/usr/bin/env node
/* Cizim maliyeti — DOKUZ AYLIK veriyle.
 *
 * Bu betigin varlik sebebi tek cumle: bos bir ekran hizli cizilir.
 * Sistem dokuz ay boyunca her gun kullanilacak; asil soru, dokuz ayin
 * sonunda ekranlarin hala acilip acilmayacagidir.
 *
 * Bu yuzden sahte veri "biraz" degil, DOKUZ AYLIK olarak kurulur:
 * 270 gun kaydi, 60 deneme, 800 kart, 600 yanlis, butun konular.
 *
 *   node tools/perfcheck.js [port]
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/perfcheck.js
 *
 * Cikis kodu: 0 butun ekranlar butcede, 1 en az biri asti.
 */

const { spawn } = require('child_process');
const path = require('path');

const PORT = Number(process.argv[2]) || 4191;
const ROOT = path.resolve(__dirname, '..');

/* Ekran basina butce (ms). Analiz ve ilerleme en agir ekranlar: butun
   deneme gecmisi, hata haritasi ve seriler ayni karede. */
const BUDGET = { analytics:140, labs:120, office:120, meals:100,
  kitchen:100, today:100, move:100, basket:100, default:70 };

let chromium;
try{ ({ chromium } = require('playwright')); }
catch(e){ console.error('Playwright kurulu değil: npm i -D playwright'); process.exit(0); }

function waitForServer(url, tries){
  return new Promise((resolve, reject) => {
    let n = tries || 40;
    const dene = () => {
      fetch(url).then(() => resolve()).catch(() => {
        if(n-- <= 0) return reject(new Error('sunucu açılmadı: ' + url));
        setTimeout(dene, 250);
      });
    };
    dene();
  });
}

(async () => {
  const server = spawn('python3', [path.join(ROOT, 'devserver.py'), String(PORT)],
    { cwd:ROOT, stdio:'ignore' });
  let browser;
  try{
    await waitForServer('http://127.0.0.1:' + PORT + '/index.html');
    browser = await chromium.launch(process.env.CHROMIUM_PATH
      ? { executablePath:process.env.CHROMIUM_PATH } : {});
    const page = await browser.newPage({ reducedMotion:'reduce' });
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil:'load' });
    await page.waitForSelector('.site', { timeout:15000 });
    await page.waitForTimeout(500);

    const boyut = await page.evaluate(() => {
      const U = SP.U;

      /* 270 gun: dokuz ay. Gunluk olcum, ogun ve antrenman. */
      for(let i = 0; i < 270; i++){
        const d = U.iso(U.addDays(U.today(), -i));
        SP.S.vitals[d] = { sleep:7 + (i % 3) * 0.5, hrv:55 + (i % 15),
          rhr:56 + (i % 8), soreness:2 + (i % 4), weight:78 - (i % 30) * 0.05 };
        SP.S.meals[d] = [
          { id:'m' + i + 'a', slot:'kahvalti',
            items:[{ foodId:'yumurta', grams:100 }, { foodId:'ekmek-tam-bugday', grams:60 }] },
          { id:'m' + i + 'b', slot:'ogle',
            items:[{ foodId:'mercimek-corbasi', grams:300 }, { foodId:'pilav', grams:150 }] },
        ];
        if(i % 2 === 0){
          SP.S.workouts.push({ id:'w' + i, date:d, name:'Seans ' + i,
            kind:i % 4 ? 'strength' : 'cardio', items:[], minutes:45,
            rpe:6 + (i % 3), note:'', createdAt:new Date().toISOString() });
        }
      }

      /* 18 tahlil: dokuz ayda iki haftada bir degil, ayda iki — gercekci
         bir ust sinir. */
      for(let i = 0; i < 18; i++){
        SP.S.labs.push({ id:'l' + i, date:U.iso(U.addDays(U.today(), -(i * 15))),
          lab:'Laboratuvar ' + i,
          values:{ hgb:{ v:14 + (i % 3) * 0.2, cert:'measured' },
            ferritin:{ v:50 + i * 2, cert:'measured' },
            glucose:{ v:88 + (i % 10), cert:'measured' },
            ldl:{ v:110 + (i % 20), cert:'measured' },
            crp:{ v:1 + (i % 4), cert:'measured' },
            tsh:{ v:1.8 + (i % 5) * 0.2, cert:'measured' } } });
      }

      for(let i = 0; i < 12; i++){
        SP.S.meds.push({ id:'med' + i, kindId:'diger', name:'Kayıt ' + i,
          dose:'1x1', startDate:U.iso(U.addDays(U.today(), -(i * 20))),
          endDate:null, note:'', createdAt:new Date().toISOString() });
      }

      return { days:Object.keys(SP.S.vitals).length, labs:SP.S.labs.length,
        meals:Object.keys(SP.S.meals).length, workouts:SP.S.workouts.length };
    });

    const routes = await page.evaluate(() =>
      SP.App.SECTIONS.reduce((a, s) => a.concat(s.views.map(v => v.route)), []));

    const rows = [];
    for(const r of routes){
      const ms = await page.evaluate(async (route) => {
        const sc = SP.Screens[route];
        if(!sc || !sc.render) return 0;
        SP.S.route = route;
        /* Isinma: ilk cizim tarayicinin kendi onbellegini de kurar. */
        SP.Memo.baslat(); try{ await sc.render(); }catch(e){} SP.Memo.bitir();
        const N = 3;
        const t0 = performance.now();
        for(let i = 0; i < N; i++){
          /* GERCEK kosul: her cizim KENDI karesidir, onbellek bos baslar. */
          SP.Memo.baslat();
          try{ await sc.render(); }catch(e){}
          SP.Memo.bitir();
        }
        return (performance.now() - t0) / N;
      }, r);
      rows.push({ route:r, ms:Math.round(ms * 10) / 10,
        budget:BUDGET[r] || BUDGET.default });
    }

    rows.sort((a, b) => b.ms - a.ms);
    const asan = rows.filter(x => x.ms > x.budget);

    console.log('\nÇizim maliyeti — dokuz aylık veri: ' + boyut.days + ' gün, '
      + boyut.labs + ' tahlil, ' + boyut.meals + ' öğün günü, '
      + boyut.workouts + ' antrenman.');
    console.log('Ölçülen: her ekranın AÇILIŞ sekmesi. Sekmeli ekranlarda '
      + 'öteki sekmeler ayrıca ağır olabilir.\n');
    rows.forEach(x => {
      const pay = Math.round(100 * x.ms / x.budget);
      console.log('  ' + x.route.padEnd(12) + String(x.ms).padStart(7) + ' ms'
        + '   bütçe ' + String(x.budget).padStart(4) + ' ms   (%' + pay + ')');
    });

    if(asan.length){
      console.log('\n' + asan.length + ' ekran bütçeyi aştı:');
      asan.forEach(x => console.log('  ✕ ' + x.route + ' ' + x.ms + ' ms > ' + x.budget + ' ms'));
      process.exitCode = 1;
    }else{
      console.log('\nBütün ekranlar bütçede — en ağırı ' + rows[0].route
        + ' ' + rows[0].ms + ' ms (bütçe ' + rows[0].budget + ').');
    }
  }catch(err){
    console.error('Koşum hatası:', err.message);
    process.exitCode = 1;
  }finally{
    if(browser) await browser.close();
    server.kill();
  }
})();
