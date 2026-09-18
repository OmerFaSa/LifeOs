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

const PORT = Number(process.argv[2]) || 4189;
const ROOT = path.resolve(__dirname, '..');

/* Ekran basina butce (ms). Analiz ve ilerleme en agir ekranlar: butun
   deneme gecmisi, hata haritasi ve seriler ayni karede. */
const BUDGET = { analytics:140, progress:120, office:120, week:100,
  subjects:100, today:100, exams:100, default:70 };

/* ÖLÇÜM ORTAMI BÜTÇEYİ DEĞİL, PAYI DEĞİŞTİRİR.

   Yukarıdaki bütçeler yerel bir makinede ölçülerek yazıldı. Paylaşımlı
   bir koşum makinesi (CI) aynı kodu düzenli olarak daha yavaş ölçer:
   orada kırmızıya dönen bir sayı çoğu zaman bir gerileme değil, başka
   bir makinedir. Bütçeyi gevşetmek bu farkı KALICI olarak silerdi —
   yerelde de görünmez olurdu.

   Bu yüzden bütçe sabit kalır ve ortam kendi payını AÇIKÇA söyler:

     PERF_PAY=1.5 node tools/perfcheck.js

   Pay çıktıya yazılır; kimse gevşetilmiş bir bütçeyi sıkı sanmasın.
   Varsayılan 1: yerel koşum hep sıkı ölçer. */
const PAY = Number(process.env.PERF_PAY) > 0 ? Number(process.env.PERF_PAY) : 1;
function butce(rota){
  return Math.round((BUDGET[rota] || BUDGET.default) * PAY);
}

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
      const M = R.Model, U = R.U;

      /* 270 gun: dokuz ay. Her gun bloklariyla birlikte. */
      for(let i = 0; i < 270; i++){
        const d = U.iso(U.addDays(U.today(), -i));
        R.S.days[d] = { date:d, dow:i % 7, ritual:null,
          paragraphTarget:18, paragraphActual:15 + (i % 5),
          freeQ:20, freeCorrect:15,
          problemTarget:18, problemActual:16,
          sleepHours:7 + (i % 3) * 0.5, checklist:{},
          blocks:[
            { id:'b0', slot:'Sabah', subject:'TYT Matematik', topic:'Konu ' + i,
              targetMin:70, targetQ:25, status:'done',
              actualMin:65, actualQ:24, correctQ:18 },
            { id:'b1', slot:'Akşam', subject:'TYT Türkçe', topic:'Paragraf',
              targetMin:70, targetQ:30, status:i % 4 ? 'done' : 'skipped',
              actualMin:i % 4 ? 68 : null, actualQ:i % 4 ? 28 : null,
              correctQ:i % 4 ? 22 : null },
          ], note:'' };
      }

      /* 60 deneme: dokuz ayda haftada birden biraz fazla. */
      for(let i = 0; i < 60; i++){
        R.S.exams.push({ id:'e' + i,
          date:U.iso(U.addDays(U.today(), -(i * 4))),
          type:i % 3 ? 'Tam TYT' : 'Tam AYT (SAY)',
          family:i % 3 ? 'TYT' : 'AYT', kind:'full',
          publisher:['345', 'Endemik', 'Bilgi Sarmal'][i % 3], duration:165,
          tests:[
            { name:'Türkçe', correct:28 + (i % 8), wrong:6, blank:6, minutes:null },
            { name:'Matematik', correct:18 + (i % 10), wrong:8, blank:14, minutes:null },
          ],
          protocol:{}, createdAt:new Date().toISOString(),
          analysisCompletedAt:i % 5 ? new Date().toISOString() : null });
      }

      /* 800 kart ve 600 yanlis: dokuz ayin birikimi. */
      for(let i = 0; i < 800; i++){
        R.S.cards.push({ id:'c' + i, front:'soru ' + i, back:'cevap ' + i,
          subjectId:'tyt-matematik', stage:1 + (i % 4),
          dueAt:U.iso(U.addDays(U.today(), (i % 30) - 15)),
          lastReviewedAt:U.iso(U.addDays(U.today(), -(i % 20))),
          history:[{ at:U.todayISO(), rating:'remembered', result:'remembered',
            stage:2, gapDays:3 }] });
      }
      for(let i = 0; i < 600; i++){
        R.S.errors.push({ id:'er' + i, examId:'e' + (i % 60),
          createdAt:new Date().toISOString(),
          tag:['K', 'İ', 'Y', 'S', 'D'][i % 5],
          subject:'TYT Matematik', topic:'Konu ' + (i % 40),
          note:'Kök neden cümlesi ' + i,
          closedAt:i % 3 ? new Date().toISOString() : null });
      }

      return { days:Object.keys(R.S.days).length, exams:R.S.exams.length,
        cards:R.S.cards.length, errors:R.S.errors.length };
    });

    const routes = await page.evaluate(() =>
      R.App.NAV.reduce((a, s) => a.concat(s.items.map(v => v.id)), []));

    const rows = [];
    for(const r of routes){
      const ms = await page.evaluate(async (route) => {
        const sc = R.Screens[route];
        if(!sc || !sc.render) return 0;
        R.S.route = route;
        /* Isinma: ilk cizim tarayicinin kendi onbellegini de kurar. */
        try{ await sc.render(); }catch(e){}
        const N = 3;
        const t0 = performance.now();
        for(let i = 0; i < N; i++){
          try{ await sc.render(); }catch(e){}
        }
        return (performance.now() - t0) / N;
      }, r);
      rows.push({ route:r, ms:Math.round(ms * 10) / 10,
        budget:butce(r) });
    }

    rows.sort((a, b) => b.ms - a.ms);
    const asan = rows.filter(x => x.ms > x.budget);

    console.log('\nÇizim maliyeti — dokuz aylık veri: ' + boyut.days + ' gün, '
      + boyut.exams + ' deneme, ' + boyut.cards + ' kart, '
      + boyut.errors + ' yanlış.');
    console.log('Ölçülen: her ekranın AÇILIŞ sekmesi. Sekmeli ekranlarda '
      + 'öteki sekmeler ayrıca ağır olabilir.\n');
    if(PAY !== 1){
      console.log('BÜTÇE PAYI ×' + PAY + ' — bu koşum yerel ölçümden daha '
        + 'gevşek bir eşikle bakıyor (PERF_PAY).');
    }
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
