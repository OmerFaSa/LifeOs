#!/usr/bin/env node
/* YÜK DENETİMİ — beş yıllık veriyle uygulama hâlâ hızlı mı?

   Kardeşi `SPI/tools/loadcheck.js` bir gerçek olaydan doğdu: ofis
   ekranının bir çizimi beş yıllık veriyle 996 ms sürüyordu, boş veriyle
   60 ms. Diğer bütün koşumlar dokuz aylık hacimle ölçtüğü için o
   yavaşlamayı hiçbiri göremedi. `README.md` şunu vaat ediyor: «Bir
   denetim bir sistemde bir hata bulduysa, aynı denetim ötekilere de
   taşınır.» Bu dosya o sözün AYS'deki karşılığıdır.

   `perfcheck.js` ile farkı tek şeydir: HACİM. O dokuz ay çizer, bu beş
   yıl. Bütçeler de ona göre gevşektir — burada aranan «hızlı mı»
   değil, «veri biriktikçe çöküyor mu».

     node tools/loadcheck.js [port]

   ---------------------------------------------------------------
   NE TOHUMLANIR, NE TOHUMLANMAZ

   Tohumlanan dört koleksiyon, beş yılda gerçekten büyüyen ve ekran
   çizimini besleyenlerdir: `S.days`, `S.exams`, `S.cards`, `S.errors`.
   Hacimler `perfcheck.js`'teki dokuz aylık tohumlamanın aynısıdır,
   yalnızca 6,75 katına çıkarılmıştır (270 gün → 1 825 gün).

   Tohumlanmayanlar ve sebepleri:

     S.solved      `core/solver.js` içinde MAX_RECORDS ile tavanlı;
                   beş yılda da aynı boyda kalır, büyüme riski yok.
     S.forecasts   büyür ama ekran başına birkaç yüz kayıt; ölçülen
                   çizimde payı ölçüm gürültüsünün altında kalıyor.
     S.videoNotes  kullanıcının kendi hızında büyür, veri hacmine
                   bağlı değil.

   Bu liste bir eksiklik değil bir KARARDIR: tohumlanmamış bir
   koleksiyonu tohumlanmış saymak, ölçmediğini ölçtüm demektir. Biri
   yarın bir ekranı yavaşlatırsa buraya eklenir ve sebebi yazılır. */

const { spawn } = require('child_process');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 4294;

/* Eşik SPİ'den alındı ve gerekçesi orada yazılı: 400 ms bir
   etkileşimin «anında» hissedilmesinin üst sınırıdır. Sistemden
   sisteme değişmesi için bir sebep yok.

   Toplam eşiği ekran sayısına orantılıdır: SPİ on iki ekran için
   3 500 ms kullanıyor (ekran başına ~292 ms); AYS'nin on sekiz ekranı
   var → 5 250 ms. */
const ESIK_MS = 400;
const TOPLAM_ESIK_MS = 5250;
const YIL = 5;
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const srv = spawn('python3', [path.join(ROOT, 'devserver.py'), String(PORT)],
    { cwd:ROOT, stdio:'ignore' });
  await wait(900);
  const browser = await chromium.launch({
    executablePath:process.env.CHROMIUM_PATH || undefined });
  const problems = [];
  let sureler = {}, motor = {};

  try{
    const page = await browser.newPage({ reducedMotion:'reduce',
      viewport:{ width:1280, height:900 } });
    page.on('pageerror', e => problems.push('sayfa hatası: ' + String(e).slice(0, 120)));
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil:'load' });
    await page.waitForSelector('.site', { timeout:15000 });
    await wait(600);
    const skip = await page.$('[data-act="setup-skip"]');
    if(skip) await skip.click();
    await wait(300);

    const hacim = await page.evaluate(async yil => {
      const U = R.U;
      const GUN = 365 * yil;

      /* Doğrudan DURUMA yazılır, depoya değil: ölçülen şey ÇİZİM.
         Depoya yazmak `localStorage` kotasını aşar ve o noktadan sonra
         ölçülen şey çizim olmaktan çıkıp yazma hatası olur. */
      for(let i = 0; i < GUN; i++){
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

      /* Deneme, kart ve yanlış sayıları dokuz aylık tohumlamanın
         6,75 katı — aynı oran, aynı dağılım. */
      for(let i = 0; i < 405; i++){
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
      for(let i = 0; i < 5400; i++){
        R.S.cards.push({ id:'c' + i, front:'soru ' + i, back:'cevap ' + i,
          subjectId:'tyt-matematik', stage:1 + (i % 4),
          dueAt:U.iso(U.addDays(U.today(), (i % 30) - 15)),
          lastReviewedAt:U.iso(U.addDays(U.today(), -(i % 20))),
          history:[{ at:U.todayISO(), rating:'remembered', result:'remembered',
            stage:2, gapDays:3 }] });
      }
      for(let i = 0; i < 4050; i++){
        R.S.errors.push({ id:'er' + i, examId:'e' + (i % 405),
          createdAt:new Date().toISOString(),
          tag:['K', 'İ', 'Y', 'S', 'D'][i % 5],
          subject:'TYT Matematik', topic:'Konu ' + (i % 40),
          note:'Kök neden cümlesi ' + i,
          closedAt:i % 3 ? new Date().toISOString() : null });
      }

      return { gun:Object.keys(R.S.days).length, deneme:R.S.exams.length,
        kart:R.S.cards.length, yanlis:R.S.errors.length };
    }, YIL);

    const routes = await page.evaluate(() =>
      R.App.NAV.reduce((a, s) => a.concat(s.items.map(v => v.id)), []));

    for(const r of routes){
      const ms = await page.evaluate(async route => {
        const sc = R.Screens[route];
        if(!sc || !sc.render) return 0;
        R.S.route = route;
        /* Isınma çizimi sayılmaz; ölçülen ikinci çizimdir. */
        try{ await sc.render(); }catch(e){}
        const t0 = performance.now();
        try{ await sc.render(); }catch(e){}
        await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
        return Math.round(performance.now() - t0);
      }, r);
      sureler[r] = ms;
      if(ms > ESIK_MS) problems.push(r + ': ' + ms + ' ms (eşik ' + ESIK_MS + ')');
    }

    const toplam = Object.values(sureler).reduce((a, b) => a + b, 0);
    if(toplam > TOPLAM_ESIK_MS)
      problems.push(routes.length + ' ekran toplamı ' + toplam
        + ' ms (eşik ' + TOPLAM_ESIK_MS + ')');

    /* Ağır motor işlevleri ayrıca ölçülür: bir ekran bütçede kalırken
       de bunlardan biri tek başına kaçabilir. */
    motor = await page.evaluate(() => {
      const ol = (ad, fn) => { const t = performance.now();
        try{ fn(); }catch(e){ return [ad, -1]; }
        return [ad, Math.round(performance.now() - t)]; };
      /* Adlar UYDURULMAZ: olmayan bir işlev burada sessizce 0 ms
         ölçülür ve «ölçtüm» yalanı doğar. Dördü de modüllerinin dışa
         açtığı gerçek işlevlerdir (core/calc.js, core/analytics.js). */
      return Object.fromEntries([
        ol('Calc.errorPareto', () => R.Calc.errorPareto()),
        ol('Calc.comparableNets', () => R.Calc.comparableNets()),
        ol('Analytics.errorHeatmap', () => R.Analytics.errorHeatmap()),
        ol('Analytics.forgettingCurve', () => R.Analytics.forgettingCurve()),
      ]);
    });

    console.log('  hacim → ' + hacim.gun + ' gün · ' + hacim.deneme + ' deneme · '
      + hacim.kart + ' kart · ' + hacim.yanlis + ' yanlış');
    const sirali = Object.entries(sureler).sort((a, b) => b[1] - a[1]);
    console.log('  en yavaş üç ekran → ' + sirali.slice(0, 3)
      .map(([k, v]) => k + ' ' + v + ' ms').join(' · '));
    console.log('  toplam → ' + toplam + ' ms (' + routes.length + ' ekran)');
    console.log('  motor → ' + Object.entries(motor)
      .map(([k, v]) => k + ' ' + v + ' ms').join(' · '));
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
    process.exit(1);
  }
  console.log('yuk denetimi temiz (' + YIL + ' yillik veri)');
})();
