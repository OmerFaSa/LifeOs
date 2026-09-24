#!/usr/bin/env node
/* YÜK DENETİMİ — beş yıllık veriyle uygulama hâlâ hızlı mı?

   Kardeşi `SPI/tools/loadcheck.js` bir gerçek olaydan doğdu: ofis
   ekranının bir çizimi beş yıllık veriyle 996 ms sürüyordu, boş veriyle
   60 ms. Diğer bütün koşumlar dokuz aylık hacimle ölçtüğü için o
   yavaşlamayı hiçbiri göremedi. `README.md` şunu vaat ediyor: «Bir
   denetim bir sistemde bir hata bulduysa, aynı denetim ötekilere de
   taşınır.» Bu dosya o sözün ESP'deki karşılığıdır.

   `perfcheck.js` ile farkı tek şeydir: HACİM. O dokuz ay çizer, bu beş
   yıl (aynı tohumlama, 6,7 katı). Burada aranan «hızlı mı» değil,
   «veri biriktikçe çöküyor mu».

     node tools/loadcheck.js [port]

   ---------------------------------------------------------------
   ÖLÇÜLMÜŞ BAŞLANGIÇ NOKTASI

   Bu denetim bir yangını söndürmüyor, bir duman dedektörü takıyor:
   ilk koşumunda ESP beş yıllık hacimde GEÇTİ (office 210 ms, team 143,
   lang 88, on dört ekran toplamı 775 ms). «Geçiyor» demek de bir
   ölçümdür ve bunu böyle yazmak, yarın geçmediğinde farkın nereden
   geldiğini bilmeyi sağlar.

   Ofis ekranı dokuz aydan beş yıla giderken 3,1 kat yavaşlıyor. Bugün
   bütçede, ama bunu izleyen tek şey bu dosya. */

const { spawn } = require('child_process');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 4298;

/* Eşik SPİ'den alındı ve gerekçesi orada yazılı: 400 ms bir
   etkileşimin «anında» hissedilmesinin üst sınırıdır. Sistemden
   sisteme değişmesi için bir sebep yok.

   Toplam eşiği ekran sayısına orantılıdır: SPİ on iki ekran için
   3 500 ms kullanıyor (ekran başına ~292 ms); ESP'nin on dört ekranı
   var → 4 000 ms. */
/* ÖLÇÜM ORTAMI EŞİĞİ DEĞİL, PAYI DEĞİŞTİRİR.

   Eşikler yerel bir makinede ölçülerek yazıldı; paylaşımlı bir koşum
   makinesi (CI) aynı kodu düzenli olarak daha yavaş ölçer. Eşiği
   gevşetmek bu farkı YERELDE de silerdi. Bunun yerine ortam kendi
   payını açıkça söyler ve araç payı çıktısına yazar:

     PERF_PAY=1.5 node tools/loadcheck.js

   Varsayılan 1: yerel koşum hep sıkı ölçer. (Aynı mekanizma
   `tools/perfcheck.js` içinde de var; ikisi aynı sebepten.) */
const PAY = Number(process.env.PERF_PAY) > 0 ? Number(process.env.PERF_PAY) : 1;
const ESIK_MS = Math.round(400 * PAY);
const TOPLAM_ESIK_MS = Math.round(4000 * PAY);
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
      const M = ESP.Model, U = ESP.U;
      const GUN = 365 * yil;

      /* Doğrudan DURUMA yazılır, depoya değil: ölçülen şey ÇİZİM.
         Depoya yazmak `localStorage` kotasını aşar ve o noktadan sonra
         ölçülen şey çizim olmaktan çıkıp yazma hatası olur.

         Hacimler `perfcheck.js`'in dokuz aylık tohumlamasının 6,7
         katıdır; günler ise tam beş yıl (1 825), çünkü gün kaydı
         takvime bağlıdır, orana değil. */
      for(let i = 0; i < 10050; i++){
        ESP.S.cards.push(M.newCard({ front:'kelime' + i, back:'karsilik' + i,
          lang:i % 9 === 0 ? ESP.HISTORY_DECK : 'en',
          box:1 + (i % 5), reps:i % 7, interval:1 + (i % 30),
          due:U.iso(U.addDays(U.today(), (i % 40) - 20)),
          history:[{ at:new Date().toISOString(), grade:'good', box:2, interval:3 }] }));
      }
      const kavramlar = ['zaman', 'adalet', 'bilgi', 'erdem', 'ozgurluk', 'varlik'];
      for(let i = 0; i < 2680; i++){
        ESP.S.notes.push(M.newNote({ text:'not ' + i,
          concepts:[kavramlar[i % kavramlar.length]].concat(i % 5 ? [] : ['ahlak']),
          bookId:'b' + (i % 60) }));
      }
      for(let i = 0; i < 60; i++){
        ESP.S.books.push(M.newBook({ title:'kitap' + i, author:'yazar' + (i % 20) }));
      }
      for(let i = 0; i < 2010; i++){
        ESP.S.events.push(M.newEvent({ title:'olay' + i, year:-2000 + i * 2 }));
      }
      for(let i = 0; i < GUN; i++){
        const g = M.ensureDay(U.iso(U.addDays(U.today(), -i)));
        g.sessions.push({ id:'s' + i,
          disc:['lang', 'music', 'reading', 'writing', 'history'][i % 5],
          minutes:30, minutesCert:'measured', count:null, countCert:'missing',
          quality:null, qualityCert:'missing', ref:null, note:'', at:new Date().toISOString() });
      }
      for(let i = 0; i < 268; i++){
        ESP.S.drafts.push(M.newDraft({ title:'taslak' + i,
          text:'Bu bir deneme cümlesidir ve ölçüm için yazılmıştır. '.repeat(40),
          revisions:i % 4 }));
      }
      for(let i = 0; i < 201; i++){
        ESP.S.pieces.push(M.newPiece({ name:'parca' + i, cleanBpm:80 + i % 60,
          targetBpm:140,
          attempts:[{ date:U.iso(U.addDays(U.today(), -(i % 365))),
            bpm:80 + i % 60, clean:true }] }));
      }
      return { kart:ESP.S.cards.length, not:ESP.S.notes.length,
        olay:ESP.S.events.length, gun:Object.keys(ESP.S.days).length,
        taslak:ESP.S.drafts.length, parca:ESP.S.pieces.length };
    }, YIL);

    const routes = await page.evaluate(() =>
      ESP.Nav.sections().reduce((a, s) => a.concat(s.views.map(v => v.route)), []));

    for(const r of routes){
      const ms = await page.evaluate(route => {
        const sc = ESP.Screens[route];
        if(!sc || !sc.render) return 0;
        ESP.S.route = route;
        /* Kare önbelleği sarmalı BOZULMAZ: `perfcheck.js`'teki kalıp.
           Her çizim KENDİ karesidir, önbellek boş başlar — ısınma
           çizimi de öyle. */
        ESP.Memo.baslat(); try{ sc.render(); }catch(e){} ESP.Memo.bitir();
        const t0 = performance.now();
        ESP.Memo.baslat();
        try{ sc.render(); }catch(e){}
        ESP.Memo.bitir();
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
       de bunlardan biri tek başına kaçabilir. Adlar UYDURULMAZ —
       olmayan bir işlev burada -1 ms olarak görünür. */
    motor = await page.evaluate(() => {
      const ol = (ad, fn) => { const t = performance.now();
        try{ fn(); }catch(e){ return [ad, -1]; }
        return [ad, Math.round(performance.now() - t)]; };
      return Object.fromEntries([
        ol('Office.notes', () => ESP.Office.notes()),
        ol('Office.handoffs', () => ESP.Office.handoffs()),
        ol('Office.patronBrief', () => ESP.Office.patronBrief()),
        ol('SRS.dueCards', () => ESP.SRS.dueCards()),
        ol('Intellect.syntopic', () => ESP.Intellect.syntopic()),
      ]);
    });

    console.log('  hacim → ' + hacim.kart + ' kart · ' + hacim.not + ' not · '
      + hacim.olay + ' olay · ' + hacim.gun + ' gün · ' + hacim.taslak
      + ' taslak · ' + hacim.parca + ' parça');
    if(PAY !== 1){
      console.log('  BÜTÇE PAYI ×' + PAY + ' — bu koşum yerel ölçümden '
        + 'daha gevşek bir eşikle bakıyor (PERF_PAY).');
    }
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
