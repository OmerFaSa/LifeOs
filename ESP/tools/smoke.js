#!/usr/bin/env node
/* Duman testi — uygulamayi gercekten acar, butun ekranlari gezer, akis dener.
 *
 * Birim testleri (tools/runtests.js) fonksiyonlari denetler; bu betik
 * UYGULAMAYI denetler: ekranlar cizilebiliyor mu, konsola hata dusuyor mu,
 * bir oturum gercekten yazilabiliyor mu, yapistirilan kelime listesi karta
 * donusuyor mu, bir kart cevaplandiginda vadesi ilerliyor mu.
 *
 * Hem kaynak surumu (src/index.html) hem derlenmis tek dosya (dist/esp.html)
 * ayni denetimden gecer: derleme sirasinda bozulan bir sey burada yakalanir.
 *
 *   node tools/smoke.js [port]
 *
 * CHROMIUM_PATH ile hazir bir tarayici ikilisi gosterilebilir:
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/smoke.js
 *
 * Cikis kodu: 0 temiz, 1 sorun var.
 */

const { spawn } = require('child_process');
const path = require('path');

const PORT = Number(process.argv[2]) || 4193;
const ROOT = path.resolve(__dirname, '..');

let chromium;
try{
  ({ chromium } = require('playwright'));
}catch(e){
  console.error('Playwright bulunamadi. Kurulum:  npm i -D playwright');
  process.exit(2);
}

/* Cevrimdisi ortamda beklenen basarisizliklar: uygulamanin kendi hatasi degil. */
const IGNORE = [/fonts\.googleapis\.com/, /fonts\.gstatic\.com/, /favicon\.ico/];
function ignorable(url){ return IGNORE.some(re => re.test(url || '')); }

const wait = ms => new Promise(r => setTimeout(r, ms));

async function waitForServer(url, tries){
  for(let i = 0; i < (tries || 40); i++){
    try{ await fetch(url); return; }catch(e){ await wait(200); }
  }
  throw new Error('sunucu acilmadi: ' + url);
}

/* Kurulum sihirbazi acilirsa kapat — duman testi bos profille de gecmeli. */
async function dismissSetup(page){
  await wait(700);
  const skip = await page.$('[data-act="setup-skip"]');
  if(skip) await skip.click();
  await wait(200);
}

async function walkScreens(page, base, target, errors){
  await page.goto(base + target, { waitUntil:'load' });
  await page.waitForSelector('.site', { timeout:15000 });
  await dismissSetup(page);

  const routes = await page.evaluate(() =>
    ESP.Nav.sections().reduce((acc, s) => acc.concat(s.views.map(v => v.route)), []));

  let sekme = 0;
  for(const r of routes){
    await page.evaluate(id => ESP.App.go(id), r);
    await wait(160);
    const title = await page.textContent('.hero__title');
    const size = await page.$eval('#main', el => el.innerHTML.length);
    if(!title) errors.push(target + ' · ' + r + ': başlık yok');
    if(size < 50) errors.push(target + ' · ' + r + ': ekran boş çizildi');

    const panel = await page.$('.notice--danger');
    if(panel){
      const txt = (await panel.textContent()) || '';
      if(/çizilemedi|başlatılamadı/.test(txt)){
        errors.push(target + ' · ' + r + ': hata paneli — ' + txt.trim().slice(0, 120));
      }
    }

    /* SEKMELER DE GEZILIR. Ekranin acilmasi, ikinci sekmesinin cizildigini
       soylemez: cogu ekranda icerigin yarisi ilk sekmede degil. Sekmeleri
       gezmeyen bir duman testi, kirik bir sekmeye "temiz" der. */
    const tabs = await page.$$eval('.subtabs .subtab',
      els => els.map(e => e.getAttribute('data-tab')).filter(Boolean));
    for(const t of tabs){
      const btn = await page.$('.subtabs .subtab[data-tab="' + t + '"]');
      if(!btn) continue;
      await btn.click();
      await wait(140);
      const boyut = await page.$eval('#main', el => el.innerHTML.length);
      if(boyut < 50) errors.push(target + ' · ' + r + '/' + t + ': sekme boş çizildi');
      const hata = await page.$('.notice--danger');
      if(hata){
        const txt = (await hata.textContent()) || '';
        if(/çizilemedi|başlatılamadı/.test(txt)){
          errors.push(target + ' · ' + r + '/' + t + ': hata paneli — '
            + txt.trim().slice(0, 120));
        }
      }
      sekme++;
    }

    /* OLU DUGME: `data-act` degeri hicbir yerde karsiligi olmayan bir
       dugme SESSIZCE hicbir sey yapmaz — tiklanir, bir sey olmaz, kullanici
       iki kez tiklar. Bir harf hatasi (desk-tab / desk-tabs) burada
       gorunmezdi; artik goruluyor. */
    const oluEylem = await page.evaluate(() => {
      const sc = ESP.Screens[ESP.S.route] || {};
      const ekran = Object.keys(sc.handle || {});
      const genel = (window.__ESP_GLOBAL_ACTS__ || []);
      const bilinen = ekran.concat(genel);
      const out = [];
      document.querySelectorAll('[data-act]').forEach(el => {
        const a = el.getAttribute('data-act');
        if(a && bilinen.indexOf(a) < 0 && out.indexOf(a) < 0) out.push(a);
      });
      return out;
    });
    oluEylem.forEach(a => errors.push(target + ' · ' + r + ': ölü düğme — data-act="' + a + '"'));

    /* Ayni sey degisim kancalari icin: `data-change` karsiligi yoksa alan
       yazilir ama hicbir yere islenmez. */
    const oluDegisim = await page.evaluate(() => {
      const sc = ESP.Screens[ESP.S.route] || {};
      const ekran = Object.keys(sc.change || {});
      const genel = (window.__ESP_GLOBAL_CHANGES__ || []);
      const bilinen = ekran.concat(genel);
      const out = [];
      document.querySelectorAll('[data-change]').forEach(el => {
        const a = el.getAttribute('data-change');
        if(a && bilinen.indexOf(a) < 0 && out.indexOf(a) < 0) out.push(a);
      });
      return out;
    });
    oluDegisim.forEach(a => errors.push(target + ' · ' + r
      + ': ölü alan — data-change="' + a + '"'));

    /* METINDE SIZINTI: "undefined", "NaN", "[object Object]" ya da "null"
       cizilmis olmasi bir bicim hatasi degil bir VERI hatasidir — cogu
       zaman olmayan bir alani okumaktan gelir ve ekranda kullaniciya
       hicbir sey soylemez. Bos veriyle ozellikle sik cikar. */
    const sizinti = await page.evaluate(() => {
      const t = (document.getElementById('main') || {}).innerText || '';
      const bulgular = [];
      [/\bundefined\b/, /\bNaN\b/, /\[object Object\]/, /\bnull\b/]
        .forEach(re => {
          const m = re.exec(t);
          if(m){
            const i = Math.max(0, m.index - 40);
            bulgular.push(m[0] + ' → …' + t.slice(i, m.index + 40).replace(/\n/g, ' ') + '…');
          }
        });
      return bulgular;
    });
    sizinti.forEach(x => errors.push(target + ' · ' + r + ': metinde sızıntı — ' + x));

    /* Ipucu anahtari eksikse UI.hint('') doner ve dugme HIC cizilmez:
       sessiz bir kayip. Cizilen her `data-hint` anahtarinin karsiligi
       olmali; olmayan anahtar burada gorunur olur. */
    const eksikIpucu = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-hint]'))
        .map(e => e.getAttribute('data-hint'))
        .filter(k => k && !ESP.HINTS[k]));
    eksikIpucu.forEach(k => errors.push(target + ' · ' + r + ': ipucu yok — ' + k));
  }

  /* Komut paleti her yerden acilmali. */
  await page.keyboard.press('Control+K');
  await wait(250);
  if(!(await page.$('#cmdk'))) errors.push(target + ': komut paleti açılmadı');
  await page.keyboard.press('Escape');
  await wait(150);

  console.log('  ' + target + ' → ' + routes.length + ' ekran, ' + sekme + ' sekme gezildi');
}

/* Gercek kullanim akisi: profil → oturum → kart → cevap → siradaki is. */
async function walkFlows(page, base, errors){
  await page.goto(base + '/index.html', { waitUntil:'load' });
  await page.waitForSelector('.site', { timeout:15000 });
  await dismissSetup(page);

  await page.evaluate(async () => {
    await ESP.Model.saveProfile({ name:'Duman', focus:'balanced', langs:['en'],
      instrument:'gitar', dailyMinutes:60 });
  });

  /* 1 — serbest metinden oturum. Iki disiplin, tek cumle. */
  await page.evaluate(() => ESP.App.go('today'));
  await wait(300);
  await page.fill('#quick-text', '45 dakika gitar çalıştım ve 20 dakika kelime tekrarı yaptım');
  await page.click('[data-act="parse-quick"]');
  await wait(300);
  await page.click('[data-act="save-quick"]');
  await wait(400);
  const oturum = await page.evaluate(() => ESP.Model.sessionsOf(ESP.U.todayISO()).length);
  if(oturum !== 2) errors.push('oturum akışı: 2 oturum bekleniyordu, ' + oturum + ' geldi');

  /* 2 — girilmemis disiplin SIFIR sayilmamali */
  const bos = await page.evaluate(() => ESP.Model.minutesOf(ESP.U.todayISO(), 'writing'));
  if(bos !== null) errors.push('doktrin: girilmemiş disiplin null dönmeli, ' + bos + ' geldi');

  /* 3 — yapistirilan kelime listesi karta donmeli */
  await page.evaluate(() => { ESP.S.ui.langTab = 'ekle'; });
  await page.evaluate(() => ESP.App.go('lang'));
  await wait(300);
  await page.fill('#vocab-text', 'nevertheless – yine de\nto grasp = kavramak\nbozuk satır');
  await page.click('[data-act="parse-vocab"]');
  await wait(300);
  await page.click('[data-act="save-vocab"]');
  await wait(400);
  const kart = await page.evaluate(() => ESP.S.cards.length);
  if(kart !== 2) errors.push('kart akışı: 2 kart bekleniyordu, ' + kart + ' geldi');

  /* 4 — bir kart cevaplandiginda vadesi ILERLEMELI */
  const vade = await page.evaluate(async () => {
    const id = ESP.S.cards[0].id;
    await ESP.SRS.answer(id, 'good');
    const c = ESP.S.cards.find(x => x.id === id);
    return { due:c.due, bugun:ESP.U.todayISO(), reps:c.reps };
  });
  if(!(vade.due > vade.bugun)) errors.push('SRS akışı: vade ilerlemedi (' + vade.due + ')');
  if(vade.reps !== 1) errors.push('SRS akışı: tekrar sayacı işlemedi');

  /* 5 — kural motoru siradaki isi uretmeli ve gerekcesini soylemeli */
  const next = await page.evaluate(() => {
    const n = ESP.Planner.nextAction();
    return { title:n.title, why:n.why, rank:n.rank };
  });
  if(!next.title || !next.why) errors.push('planlayıcı: sıradaki iş gerekçesiz geldi');

  /* 6 — model kapaliyken ofis kapanmamali */
  const kural = await page.evaluate(() => ESP.Office.ruleText('patron'));
  if(!kural || kural.length < 10) errors.push('ofis: model kapalıyken kural cümlesi üretilmedi');

  /* 7 — brifingde ad GECMEMELI (mahremiyet testi) */
  const adSizdi = await page.evaluate(() =>
    JSON.stringify(ESP.Office.patronBrief()).indexOf('Duman') >= 0);
  if(adSizdi) errors.push('mahremiyet: profil adı brifinge sızdı');

  console.log('  akışlar → oturum, kart, SRS, planlayıcı, ofis ve brifing denetimi geçti');
}


(async () => {
  const server = spawn('python3', [path.join(ROOT, 'devserver.py'), String(PORT)],
    { cwd:ROOT, stdio:'ignore' });

  let code = 1;
  let browser;
  const base = 'http://127.0.0.1:' + PORT;
  const errors = [];

  try{
    await waitForServer(base + '/index.html');
    browser = await chromium.launch(process.env.CHROMIUM_PATH
      ? { executablePath:process.env.CHROMIUM_PATH } : {});
    const page = await browser.newPage();

    page.on('pageerror', e => errors.push('sayfa hatası: ' + (e && e.message || e)));
    page.on('requestfailed', r => {
      if(!ignorable(r.url())) errors.push('istek başarısız: ' + r.url());
    });
    page.on('response', r => {
      if(r.status() >= 400 && !ignorable(r.url())){
        errors.push(r.status() + ': ' + r.url());
      }
    });

    await walkScreens(page, base, '/index.html', errors);
    await walkScreens(page, base, '/dist/esp.html', errors);
    await walkFlows(page, base, errors);

    if(errors.length){
      console.log('\n' + errors.length + ' sorun:');
      errors.forEach(e => console.log('  ✕ ' + e));
    }else{
      console.log('\nDuman testi temiz.');
    }
    code = errors.length ? 1 : 0;
  }catch(err){
    console.error('Koşum hatası:', err && err.message ? err.message : err);
  }finally{
    if(browser) await browser.close();
    server.kill();
  }
  process.exit(code);
})();
