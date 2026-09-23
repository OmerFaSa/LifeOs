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
  SAYAC.ekran += routes.length; SAYAC.sekme += sekme; SAYAC.hedef++;
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

  /* 8 — SOHBETIN KENDI DUGMESI mesaji iletmeli. `withBusy(etiket, ipucu,
     fn)` uc yerde `withBusy(fn, etiket)` diye cagriliyordu: «Gönder»,
     masa sorusu ve «Brifing üret» hicbir sey yapmadan «fn is not a
     function» ile dusuyordu. Cekirdek testleri geciyordu cunku dugmeye
     kimse basmiyordu; bu akis basar. */
  await page.evaluate(() => { ESP.S.ui.officeAgent = 'patron'; ESP.App.go('team'); });
  await wait(400);
  await page.fill('#chat-input', 'diksiyon çalışmak istemiyorum');
  await page.click('[data-act="send-chat"]');
  await wait(600);
  const sohbet = await page.evaluate(() => {
    const l = ESP.S.officeChats.patron || [];
    return { n:l.length, son:(l[l.length - 1] || {}).text || '',
      dugme:!!document.querySelector('.msg [data-act="prop-accept"]') };
  });
  if(sohbet.n < 2) errors.push('sohbet: «Gönder» mesajı iletmedi');
  else if(sohbet.son.indexOf('Anladığım şu') < 0) errors.push('sohbet: bölüm isteği anlaşılmadı — ' + sohbet.son.slice(0, 60));
  else if(!sohbet.dugme) errors.push('sohbet: bekleyen isteğin onay düğmesi yok');
  if(sohbet.dugme){
    await page.click('.msg [data-act="prop-accept"]');
    await wait(400);
    const kapali = await page.evaluate(() => !ESP.Mod.isOn('diction'));
    if(!kapali) errors.push('sohbet: onaylanan bölüm kapanmadı');
    const geri = await page.evaluate(async () => {
      const son = ESP.S.proposals.filter(p => p.source === 'istek' && p.state === 'accepted')[0];
      return son ? (await ESP.Plans.geriAl(son.id)).ok && ESP.Mod.isOn('diction') : false;
    });
    if(!geri) errors.push('sohbet: onaylanan bölüm geri alınamadı');
  }

  console.log('  akışlar → oturum, kart, SRS, planlayıcı, ofis, brifing ve sohbet (istek → onay → geri al) denetimi geçti');
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
    if(!ESP.Basarim) return null;
    /* Defteri eşitle ve kuyruğu boşalt: açılışta «değişen yok» çıksın. */
    await ESP.Basarim.esitleCok(ESP.BasarimSayim.gunler(ESP.XP.pencere()));
    let b;
    while((b = ESP.Basarim.bekleyen())) await ESP.Basarim.gorundu(b.kod);
    /* Kutlaması yarıda kalmış bir rozet bırak. */
    const ham = await ESP.Store.get('basarim');
    const k = window.LIFEOS.ROZETLER[0].kod;
    ham.kazanilan[k] = ESP.U.todayISO();
    ham.bekleyen = [k];
    await ESP.Store.set('basarim', ham);
    return k;
  });
  if(!kod){ errors.push('rozet kuyruğu: başarım motoru yüklenmedi'); return; }

  await page.reload({ waitUntil:'load' });
  await page.waitForSelector('.site', { timeout:15000 });
  await wait(1500);

  const kalan = await page.evaluate(() => {
    const b = ESP.Basarim.bekleyen();
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
    if(!ESP.XP || !ESP.Basarim) return false;
    ESP.XP.bosalt();
    await ESP.Store.set('seviye',
      { surum:window.LIFEOS.SEVIYE_SURUM, toplam:1500000 });
    await ESP.XP.yukle();
    /* Başarım defteri de BÜYÜK olsun: «Toplam saat» ve «Toplam görev»
       ancak beş haneye çıkınca ayraç gerektiriyor. */
    ESP.Basarim.bosalt();
    const aylar = {};
    for(let i = 0; i < 40; i++){
      const y = 2023 + Math.floor(i / 12), a = (i % 12) + 1;
      aylar[y + '-' + String(a).padStart(2, '0')] =
        { gun:28, dakika:33000, gorev:400, kusursuz:2 };
    }
    await ESP.Store.set('basarim', { surum:window.LIFEOS.BASARIM_SURUM,
      aylar:aylar, gunler:{}, enIyi:{ odakDakika:600, odakTaban:600 },
      kazanilan:{}, bekleyen:[] });
    await ESP.Basarim.yukle();
    ESP.App.go('rutbe');
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
  const alt = await page.evaluate(() => ESP.Screens.rutbe.subtitle());
  if(/(?<![0-9A-Za-z])\d{5,}(?![0-9A-Za-z])/.test(alt)){
    errors.push('rütbe alt başlığı: ayraçsız uzun sayı — ' + alt);
  }
  console.log('  akışlar → rütbe ekranındaki sayılar binlik ayraçlı');
}

/* ÇEVRİMDIŞI KABUK (brand/ortak/sw.js, Y4) — sunucuyla açılan sayfa,
   sunucu kapanınca da açılmalı. Kabuk kaydedilmese ya da ilk açılışın
   dosyaları kasaya girmese bu adım bunu görür.

   Ağ gerçekten kesilir: sunucu DURDURULUR. `context.setOffline` kabuğun
   kendi isteklerine uygulanmıyor; onunla geçen bir denetim, kasayı hiç
   denemeden geçerdi. Bu yüzden bu adım EN SONDA koşar. Kesinti de
   ölçülür: kasada olmayan bir adres «ağ yok» ile düşmeli. */
async function cevrimdisi(browser, base, hedefler, durdur, errors){
  const ctx = await browser.newContext({ reducedMotion:'reduce' });
  const sayfalar = [];
  try{
    for(const hedef of hedefler){
      const page = await ctx.newPage();
      page.on('pageerror', e => errors.push('kabuk ' + hedef + ': sayfa hatası — ' + (e && e.message || e)));
      await page.goto(base + hedef, { waitUntil:'load' });
      await page.waitForSelector('.site', { timeout:15000 });
      let d = null;
      for(let i = 0; i < 80; i++){
        d = await page.evaluate(async () => {
          if(!navigator.serviceWorker || !navigator.serviceWorker.controller) return { kontrol:false };
          const k = await caches.open('lifeos-kabuk-v1');
          const adres = [location.href.split('#')[0]]
            .concat(Array.from(document.querySelectorAll('script[src]')).map(s => s.src));
          let eksik = 0;
          for(const a of adres) if(!(await k.match(a))) eksik++;
          return { kontrol:true, eksik, toplam:(await k.keys()).length };
        });
        if(d.kontrol && d.eksik === 0) break;
        await wait(250);
      }
      if(!d.kontrol) errors.push('kabuk ' + hedef + ': service worker sayfayı devralmadı');
      else if(d.eksik) errors.push('kabuk ' + hedef + ': ' + d.eksik + ' dosya kasaya girmedi');
      sayfalar.push({ hedef, page, toplam:d.toplam || 0 });
    }
    await durdur();
    for(const s of sayfalar){
      await s.page.reload({ waitUntil:'load' });
      await s.page.waitForSelector('.site', { timeout:15000 });
      const ag = await s.page.evaluate(() => fetch('kasada-yok-' + Date.now() + '.txt')
        .then(r => 'sunucu ' + r.status, () => 'ağ yok'));
      const boy = await s.page.$eval('#main', el => el.innerHTML.length);
      if(ag !== 'ağ yok') errors.push('kabuk ' + s.hedef + ': ağ kesilmedi (' + ag + '), denetim geçersiz');
      else if(boy < 50) errors.push('kabuk ' + s.hedef + ': ağ yokken ekran boş çizildi');
      else console.log('  kabuk → ' + s.hedef + ' sunucu kapalıyken açıldı (' + s.toplam + ' dosya kasada)');
    }
  }catch(e){
    errors.push('kabuk: ' + (e && e.message || e));
  }finally{
    await ctx.close();
  }
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
    await walkScreens(page, base, '/dist/esp.html', errors);
    await walkFlows(page, base, errors);
    await rozetKuyrugu(page, base, errors);
    await rutbeSayilari(page, base, errors);
    /* Gezinti sayfasi, sunucu BILEREK durdurulmadan once kapanir. Acik
       kalirsa sonradan yaptigi her istek (baslikta yeniden cizilen marka
       gorseli gibi) «istek basarisiz» sayiliyordu: uygulama hatasi degil,
       denetimin kendi yarisi. Tam kosumda zamanlamaya bagli kaliyordu. */
    await page.close();
    await cevrimdisi(browser, base, ['/index.html', '/dist/esp.html'],
      async () => { server.kill(); await wait(400); }, errors);

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
