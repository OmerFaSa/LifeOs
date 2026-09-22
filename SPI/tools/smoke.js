#!/usr/bin/env node
/* Duman testi — uygulamayi gercekten acar, butun ekranlari gezer, akis dener.
 *
 * Birim testleri (tools/runtests.js) fonksiyonlari denetler; bu betik
 * UYGULAMAYI denetler: ekranlar cizilebiliyor mu, konsola hata dusuyor mu,
 * bir ogun gercekten eklenebiliyor mu, yapistirilan tahlil kaydediliyor mu.
 *
 * Hem kaynak surumu (src/index.html) hem derlenmis tek dosya (dist/spi.html)
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
/* img/brand/intro.mp4 gormezden gelinir: 1-2 MB'lik video henuz inerken
   duman testi ikinci hedefe (dist) gecince tarayici bu istegi net::ERR_ABORTED
   ile keser. Bu geculk sayfa gecisinin dogal sonucudur, gercek bir hata
   degildir — splash.js zaten error olayinda da kapaniyor. */
/* img/seviye/* gormezden gelinir ve bu BILINCLI bir eksikliktir. Onbes
   rutbe karti ile alti kademe sahnesi yerinde; eksik olanlar Kutsal'in
   K kartlari (`rutbe-k100 …`) ve kunyedeki kucuk rozet (`rozet-N.png`).
   Dosya yokken kart yerine kademe/etiket dairesi cizilir, rozet yerine
   kademe numarasi gorunur — yani 404 burada bir hata degil, sistemin
   tasarlanmis ara halidir (bkz. brand/seviye/OKU.md). Dosyalar
   eklendikce bu satirlar susar. */
const IGNORE = [/fonts\.googleapis\.com/, /fonts\.gstatic\.com/, /favicon\.ico/,
  /img\/brand\/intro\.mp4/, /img\/seviye\//];
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

/* Gecen bir denetim de SAYI gostermeli: hicbir sey gezmeyen bir betik
   de «temiz» yazar. Son satir bu yuzden ne gezildigini soyler. */
const SAYAC = { hedef:0, ekran:0, sekme:0 };

/* TELEFON ETIKETLERI — tek dosya surumunde de durmali.

   Tek dosya surumu telefona kopyalanip «Ana ekrana ekle» ile kurulmak
   icin var (README, «Telefonda kullanim»). `build.py` uzun sure <head>'i
   sifirdan yaziyordu ve su bes satir sessizce dusuyordu: manifest
   dugumu, ikon, tema rengi ve iki apple etiketi. Sonucu: `installManifest()`
   dugumu bulamayip sessizce donuyor, iOS'ta uygulama tam ekran acilmiyor,
   ikon hic gelmiyordu.

   Sessizce dusen bir sey, ancak onu arayan bir denetim varsa gorulur. */
async function checkPwa(page, target, errors){
  const r = await page.evaluate(() => {
    const el = document.getElementById('pwa-manifest');
    const href = (el && el.getAttribute('href')) || '';
    let man = null;
    try{ man = JSON.parse(decodeURIComponent(href.split(',')[1] || '')); }catch(e){}
    const ikon = document.querySelector('link[rel="icon"]');
    return {
      manifest:!!(man && man.name && man.icons && man.icons.length),
      ikon:(ikon && ikon.getAttribute('href')) || '',
      apple:!!document.querySelector('meta[name="apple-mobile-web-app-capable"]'),
      baslik:!!document.querySelector('meta[name="apple-mobile-web-app-title"]'),
    };
  });
  if(!r.manifest) errors.push(target + ': PWA manifesti kurulmadi (#pwa-manifest)');
  if(!r.apple) errors.push(target + ': apple-mobile-web-app-capable etiketi yok');
  if(!r.baslik) errors.push(target + ': apple-mobile-web-app-title etiketi yok');
  if(!r.ikon) errors.push(target + ': <link rel="icon"> yok');
  /* Tek dosya TEK DOSYADIR: yanindaki img/ klasoru telefona gitmez.
     Goreli bir ikon yolu orada 404 verir. */
  if(target.indexOf('/dist/') === 0 && r.ikon.indexOf('data:') !== 0){
    errors.push(target + ': tek dosya surumunun ikonu gomulu degil (' 
      + r.ikon.slice(0, 40) + ')');
  }
}


async function walkScreens(page, base, target, errors){
  await page.goto(base + target, { waitUntil:'load' });
  await page.waitForSelector('.site', { timeout:15000 });
  await dismissSetup(page);

  await checkPwa(page, target, errors);

  const routes = await page.evaluate(() =>
    SP.App.SECTIONS.reduce((acc, s) => acc.concat(s.views.map(v => v.route)), []));

  /* Cizilen METINDE sizinti: bunlar kullaniciya asla gorunmemeli ve
     gorundugunde bir hesap sessizce bozulmus demektir. (Bu tarama ve
     asagidaki sekme gezisi ESP'den alindi — uc sistemin denetim
     araclari birbirine tasinir.) */
  const SIZINTI = [/\bundefined\b/, /\bNaN\b/, /\[object Object\]/];

  async function scanText(nerede){
    const txt = await page.$eval('#main', el => el.innerText || '');
    SIZINTI.forEach(re => {
      if(re.test(txt)){
        const m = txt.match(new RegExp('.{0,40}' + re.source + '.{0,40}'));
        errors.push(nerede + ': metinde sızıntı — ' + (m ? m[0].trim() : re.source));
      }
    });
  }

  async function checkPanel(nerede){
    const panel = await page.$('.notice--danger');
    if(!panel) return;
    const txt = (await panel.textContent()) || '';
    if(/çizilemedi|başlatılamadı|ters gitti/.test(txt)){
      errors.push(nerede + ': hata paneli — ' + txt.trim().slice(0, 120));
    }
  }

  async function kapat(){
    const acik = await page.$('#sheet > *');
    if(acik){
      await page.keyboard.press('Escape');
      await wait(150);
    }
  }

  let sekme = 0;
  for(const r of routes){
    await kapat();
    await page.evaluate(id => SP.App.go(id), r);
    await wait(200);
    await kapat();
    const nerede = target + ' · ' + r;

    const title = await page.textContent('.hero__title');
    const size = await page.$eval('#main', el => el.innerHTML.length);
    if(!title) errors.push(nerede + ': başlık yok');
    if(size < 50) errors.push(nerede + ': ekran boş çizildi');
    await checkPanel(nerede);
    await scanText(nerede);

    /* Sekmeleri de gez: ekranin acilmasi ikinci sekmesinin calistigi
       anlamina gelmez. */
    const SEC = '.subtabs [data-act]';
    const tablar = await page.$$(SEC);
    for(let i = 0; i < tablar.length; i++){
      const el = (await page.$$(SEC))[i];
      if(!el) continue;
      const ad = ((await el.textContent()) || '').trim().slice(0, 24);
      await kapat();
      await el.click({ timeout:5000 }).catch(() => {});
      await wait(220);
      sekme++;
      await checkPanel(nerede + '/' + ad);
      await scanText(nerede + '/' + ad);
      const s2 = await page.$eval('#main', e => e.innerHTML.length);
      if(s2 < 50) errors.push(nerede + '/' + ad + ': sekme boş çizildi');
    }
  }

  /* Komut paleti her yerden acilmali. */
  await page.keyboard.press('Control+K');
  await wait(250);
  if(!(await page.$('#cmdk'))) errors.push(target + ': komut paleti açılmadı');
  await page.keyboard.press('Escape');
  await wait(150);

  console.log('  ' + target + ' → ' + routes.length + ' ekran, ' + sekme + ' sekme gezildi');
  SAYAC.ekran += routes.length; SAYAC.sekme += sekme; SAYAC.hedef++;
}

/* Gercek kullanim akisi: profil → ogun → tahlil → hedefin degismesi. */
async function walkFlows(page, base, errors){
  await page.goto(base + '/index.html', { waitUntil:'load' });
  await page.waitForSelector('.site', { timeout:15000 });
  await dismissSetup(page);

  await page.evaluate(async () => {
    await SP.Model.saveProfile({ name:'Duman', birthYear:1994, sex:'male',
      heightCm:178, weightKg:78, activity:'moderate', goal:'health' });
  });

  /* 1 — serbest metinden ogun */
  await page.evaluate(() => SP.App.go('meals'));
  await wait(300);
  await page.fill('#meal-text', '1 tabak etli kuru fasulye, 2 dilim ekmek ve 1 bardak ayran');
  await page.click('[data-act="add-meal"]');
  await wait(400);
  const items = await page.evaluate(() => {
    const rows = SP.Model.mealsOf(SP.U.todayISO());
    return rows.length ? rows[0].items.length : 0;
  });
  if(items !== 3) errors.push('öğün akışı: 3 kalem bekleniyordu, ' + items + ' geldi');

  /* 2 — yapistirilan tahlil */
  await page.evaluate(() => SP.App.go('labs'));
  await wait(300);
  await page.click('[data-act="open-paste"]');
  await wait(300);
  await page.fill('#paste-text', 'Hemoglobin 14,2 g/dL\nFerritin 22 ng/mL\nAçlık glukozu 92 mg/dL');
  await page.click('[data-act="run-paste"]');
  await wait(400);
  await page.click('[data-act="save-paste"]');
  await wait(500);
  const labs = await page.evaluate(() => SP.S.labs.length);
  if(labs !== 1) errors.push('tahlil akışı: 1 oturum bekleniyordu, ' + labs + ' geldi');

  /* 3 — Modul 1 → Modul 2 bagi: dusuk ferritin demir hedefini yukseltmeli */
  const mult = await page.evaluate(() => SP.Nutri.targets().micro.iron.mult);
  if(!(mult > 1)) errors.push('laboratuvar bağı: demir çarpanı yükselmedi (' + mult + ')');

  /* 4 — gunluk olcum toparlanma skoru uretmeli */
  await page.evaluate(async () => { await SP.Model.saveVitals(SP.U.todayISO(), { sleep:8, soreness:4 }); });
  const score = await page.evaluate(() => SP.Move.readiness().score);
  if(!(score > 0)) errors.push('toparlanma akışı: skor üretilmedi');

  console.log('  akışlar → öğün, tahlil, laboratuvar bağı ve toparlanma çalıştı');
}


/* AÇILIŞTA BEKLEYEN ROZET KUTLAMASI — kuyruk boşalıyor mu.

   Motor «kuyruk defterde durur, uygulama kapansa da kaybolmaz» diyor.
   Kuyruk gerçekten duruyordu ama onu BOŞALTAN tek yer eşitlemeden
   dönen yeni rozet listesiydi: perde kapanmadan sekmeyi kapatan biri
   o rozeti bir daha hiç göremiyordu, ta ki aylar sonra başka bir rozet
   kazanana kadar. XP'nin aynı hâli çözülmüştü (`bekleyenKutlama`),
   rozet tarafı unutulmuştu.

   Denetim BİLEREK önce defteri eşitler: eşitleme «değişen yok» derse
   kuyruğu boşaltan başka hiçbir yol kalmaz, yani sınanan şey gerçekten
   AÇILIŞ davranışıdır. Bu tarayıcı `reducedMotion:'reduce'` ile açılır,
   yani perde değil sessiz yol koşar — kuyruk anında boşalmalı. */
async function rozetKuyrugu(page, base, errors){
  await page.goto(base + '/index.html', { waitUntil:'load' });
  await page.waitForSelector('.site', { timeout:15000 });
  await wait(900);

  const kod = await page.evaluate(async () => {
    if(!SP.Basarim) return null;
    /* Defteri eşitle ve kuyruğu boşalt: açılışta «değişen yok» çıksın. */
    await SP.Basarim.esitleCok(SP.BasarimSayim.gunler(SP.XP.pencere()));
    let b;
    while((b = SP.Basarim.bekleyen())) await SP.Basarim.gorundu(b.kod);
    /* Kutlaması yarıda kalmış bir rozet bırak. */
    const ham = await SP.Store.get('basarim');
    const k = window.LIFEOS.ROZETLER[0].kod;
    ham.kazanilan[k] = SP.U.todayISO();
    ham.bekleyen = [k];
    await SP.Store.set('basarim', ham);
    return k;
  });
  if(!kod){ errors.push('rozet kuyruğu: başarım motoru yüklenmedi'); return; }

  await page.reload({ waitUntil:'load' });
  await page.waitForSelector('.site', { timeout:15000 });
  await wait(1500);

  const kalan = await page.evaluate(() => {
    const b = SP.Basarim.bekleyen();
    return b ? b.kod : null;
  });
  if(kalan === kod){
    errors.push('rozet kuyruğu: açılışta bekleyen kutlama gösterilmedi ('
      + kod + ' hâlâ kuyrukta)');
  }
  console.log('  akışlar → açılışta bekleyen rozet kutlaması boşaldı');
}


/* RÜTBE EKRANINDA AYRAÇSIZ UZUN SAYI OLMAMALI.

   Tek ekranda iki biçim yan yana duruyordu ve ölçüldü:

       TOPLAM         1.500.000 XP      (K.Stat biçimliyor)
       Bu basamakta     100000 / 1000000 XP
       Bir sonraki basamağa 900000 XP
       (üst başlık)   Kutsal K500 · 1500000 XP

   Küçük sayılarda görünmüyordu; XP büyüdükçe okunaksızlaştı. Denetim
   defteri BÜYÜK bir toplamla kurar — küçük sayıyla koşan bir denetim
   bu hatayı hiç göremezdi — ve ekranda beş haneden uzun, ayraçsız bir
   sayı arar.

   ARANAN ŞEY TEK BAŞINA DURAN bir sayı: desenin iki yanında harf ya da
   rakam olmamalı. İlk yazımda bu sınır yoktu ve denetim kendi kendine
   kırmızıya döndü — künyedeki DERLEME DAMGASI bir git özetidir
   (`4f18345+`) ve içinde beş haneli bir rakam dizisi çıkabiliyor.
   «Damga dört haneyi geçmez» diye yazmıştım; geçiyormuş. */
async function rutbeSayilari(page, base, errors){
  await page.goto(base + '/index.html', { waitUntil:'load' });
  await page.waitForSelector('.site', { timeout:15000 });
  await wait(700);

  const kuruldu = await page.evaluate(async () => {
    if(!SP.XP || !SP.Basarim) return false;
    SP.XP.bosalt();
    await SP.Store.set('seviye',
      { surum:window.LIFEOS.SEVIYE_SURUM, toplam:1500000 });
    await SP.XP.yukle();
    /* Başarım defteri de BÜYÜK olsun: «Toplam saat» ve «Toplam görev»
       ancak beş haneye çıkınca ayraç gerektiriyor. */
    SP.Basarim.bosalt();
    const aylar = {};
    for(let i = 0; i < 40; i++){
      const y = 2023 + Math.floor(i / 12), a = (i % 12) + 1;
      aylar[y + '-' + String(a).padStart(2, '0')] =
        { gun:28, dakika:33000, gorev:400, kusursuz:2 };
    }
    await SP.Store.set('basarim', { surum:window.LIFEOS.BASARIM_SURUM,
      aylar:aylar, gunler:{}, enIyi:{ odakDakika:600, odakTaban:600 },
      kazanilan:{}, bekleyen:[] });
    await SP.Basarim.yukle();
    SP.App.go('rutbe');
    return true;
  });
  if(!kuruldu){ errors.push('rütbe sayıları: seviye motoru yüklenmedi'); return; }
  await wait(700);

  for(const sekme of ['simdi', 'merdiven', 'rozet', 'kazanc', 'defter']){
    await page.evaluate(t => {
      const el = document.querySelector('[data-act="rutbe-tab"][data-tab="' + t + '"]');
      if(el) el.click();
    }, sekme);
    await wait(500);
    const kotu = await page.evaluate(() => {
      const n = document.querySelector('#view') || document.body;
      /* Derleme damgasi bir commit kimligidir, miktar degil: yedi hanesi
         bazen yalniz rakamdan olusur (~%4) ve bu denetimi rastgele
         kirardi. Damga metinden cikarilir. */
      let metin = n.innerText;
      document.querySelectorAll('.sitefoot__sha').forEach(el => {
        metin = metin.split(el.innerText.replace(/\+$/, '')).join('');
      });
      const bulunan = (metin.match(/(?<![0-9A-Za-zçğıöşüÇĞİÖŞÜ])\d{5,}(?![0-9A-Za-zçğıöşüÇĞİÖŞÜ])/g) || []);
      return bulunan.slice(0, 5);
    });
    if(kotu.length){
      errors.push('rütbe/' + sekme + ': ayraçsız uzun sayı — ' + kotu.join(', '));
    }
  }
  /* Üst başlık da aynı kurala tabi. */
  const alt = await page.evaluate(() => SP.Screens.rutbe.subtitle());
  if(/(?<![0-9A-Za-z])\d{5,}(?![0-9A-Za-z])/.test(alt)){
    errors.push('rütbe alt başlığı: ayraçsız uzun sayı — ' + alt);
  }
  console.log('  akışlar → rütbe ekranındaki sayılar binlik ayraçlı');
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
    const page = await browser.newPage({ reducedMotion:'reduce' });

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
    await walkScreens(page, base, '/dist/spi.html', errors);
    await walkFlows(page, base, errors);
    await rozetKuyrugu(page, base, errors);
    await rutbeSayilari(page, base, errors);

    if(errors.length){
      console.log('\n' + errors.length + ' sorun:');
      errors.forEach(e => console.log('  ✕ ' + e));
    }else{
      console.log('\nDuman testi temiz — ' + SAYAC.hedef + ' hedefte '
        + SAYAC.ekran + ' ekran, ' + SAYAC.sekme + ' sekme gezildi.');
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
