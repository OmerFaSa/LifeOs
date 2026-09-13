#!/usr/bin/env node
/* Çizim maliyeti denetimi — AĞIR veriyle.
 *
 * Bu betiğin varlık sebebi ölçülmüş bir olaydır: beş yıllık veriyle ofis
 * ekranı 996 ms sürüyordu ve sebep ağır bir fonksiyon değil, AYNI
 * fonksiyonun tek çizimde defalarca çağrılmasıydı (bkz. core/memo.js).
 * Boş veriyle hiçbiri görünmüyordu; birim testleri sekiz ölçümle çalışır,
 * bin beş yüz kartla değil.
 *
 * Bu yüzden burada veri SENTETİK ve BÜYÜK üretilir: 1500 kart, 400 not,
 * 300 olay, 120 günlük oturum, 40 taslak, 30 parça. Sonra her ekran bir
 * çizim karesi içinde çizilir ve süresi ölçülür.
 *
 * Bütçeler aşağıda ve gerekçesi tek cümle: 16 ms bir karedir; 100 ms
 * kullanıcının "takıldı" dediği eşiktir. Ekran çizimi 100 ms'i aşarsa
 * denetim KALIR.
 *
 *   node tools/perfcheck.js [port]
 *
 * Çıkış kodu: 0 bütün ekranlar bütçede, 1 en az biri aştı.
 */

const { spawn } = require('child_process');
const path = require('path');

const PORT = Number(process.argv[2]) || 4187;
const ROOT = path.resolve(__dirname, '..');

/* Ekran başına bütçe (ms). Ofis en ağır ekran: sekiz masa, çapraz bulgular
   ve teklifler aynı karede. */
const BUDGET = { office:100, ladder:80, lang:80, today:80, history:80,
  analytics:100, default:60 };

let chromium;
try{ ({ chromium } = require('playwright')); }
catch(e){
  console.error('Playwright kurulu değil: npm i -D playwright');
  process.exit(0);
}

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
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil:'load' });
    await page.waitForSelector('.site', { timeout:15000 });
    const skip = await page.$('[data-act="setup-skip"]');
    if(skip) await skip.click();

    const boyut = await page.evaluate(() => {
      const M = ESP.Model, U = ESP.U;
      for(let i = 0; i < 1500; i++){
        ESP.S.cards.push(M.newCard({ front:'kelime' + i, back:'karsilik' + i,
          lang:i % 9 === 0 ? ESP.HISTORY_DECK : 'en',
          box:1 + (i % 5), reps:i % 7, interval:1 + (i % 30),
          due:U.iso(U.addDays(U.today(), (i % 40) - 20)),
          history:[{ at:new Date().toISOString(), grade:'good', box:2, interval:3 }] }));
      }
      const kavramlar = ['zaman', 'adalet', 'bilgi', 'erdem', 'ozgurluk', 'varlik'];
      for(let i = 0; i < 400; i++){
        ESP.S.notes.push(M.newNote({ text:'not ' + i,
          concepts:[kavramlar[i % kavramlar.length]].concat(i % 5 ? [] : ['ahlak']),
          bookId:'b' + (i % 60) }));
      }
      for(let i = 0; i < 60; i++){
        ESP.S.books.push(M.newBook({ title:'kitap' + i, author:'yazar' + (i % 20) }));
      }
      for(let i = 0; i < 300; i++){
        ESP.S.events.push(M.newEvent({ title:'olay' + i, year:-2000 + i * 12 }));
      }
      for(let i = 0; i < 120; i++){
        const g = M.ensureDay(U.iso(U.addDays(U.today(), -i)));
        g.sessions.push({ id:'s' + i,
          disc:['lang', 'music', 'reading', 'writing', 'history'][i % 5],
          minutes:30, minutesCert:'measured', count:null, countCert:'missing',
          quality:null, qualityCert:'missing', ref:null, note:'', at:new Date().toISOString() });
      }
      for(let i = 0; i < 40; i++){
        ESP.S.drafts.push(M.newDraft({ title:'taslak' + i,
          text:'Bu bir deneme cümlesidir ve ölçüm için yazılmıştır. '.repeat(40),
          revisions:i % 4 }));
      }
      for(let i = 0; i < 30; i++){
        ESP.S.pieces.push(M.newPiece({ name:'parca' + i, cleanBpm:80 + i, targetBpm:140,
          attempts:[{ date:U.iso(U.addDays(U.today(), -i)), bpm:80 + i, clean:true }] }));
      }
      return { cards:ESP.S.cards.length, notes:ESP.S.notes.length,
        events:ESP.S.events.length, days:Object.keys(ESP.S.days).length };
    });

    const routes = await page.evaluate(() =>
      ESP.Nav.sections().reduce((a, s) => a.concat(s.views.map(v => v.route)), []));

    const rows = [];
    for(const r of routes){
      const ms = await page.evaluate((route) => {
        const sc = ESP.Screens[route];
        if(!sc) return 0;
        ESP.S.route = route;
        /* Isınma: ilk çizim tarayıcının kendi önbelleklerini de kurar. */
        ESP.Memo.baslat(); try{ sc.render(); }catch(e){} ESP.Memo.bitir();
        const N = 3;
        const t0 = performance.now();
        for(let i = 0; i < N; i++){
          /* GERÇEK koşul: her çizim KENDİ karesidir, önbellek boş başlar. */
          ESP.Memo.baslat();
          try{ sc.render(); }catch(e){}
          ESP.Memo.bitir();
        }
        return (performance.now() - t0) / N;
      }, r);
      rows.push({ route:r, ms:Math.round(ms * 10) / 10,
        budget:BUDGET[r] || BUDGET.default });
    }

    rows.sort((a, b) => b.ms - a.ms);
    const asan = rows.filter(x => x.ms > x.budget);

    console.log('\nÇizim maliyeti — ' + boyut.cards + ' kart, ' + boyut.notes
      + ' not, ' + boyut.events + ' olay, ' + boyut.days + ' gün:\n');
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
