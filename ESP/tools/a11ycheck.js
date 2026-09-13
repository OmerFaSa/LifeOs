#!/usr/bin/env node
/* ERİŞİLEBİLİRLİK DENETİMİ — kaynaktan değil, ÇİZİLEN sayfadan.

   Diğer altı koşum rengi, düzeni ve davranışı koruyor. Bu koşum
   uygulamanın KLAVYEYLE ve EKRAN OKUYUCUYLA kullanılabilirliğini
   korur; ikisi de göz kararıyla denetlenemez.

   Aranan hatalar:
     · adsız düğme ya da bağlantı (ekran okuyucu "düğme" der, başka bir şey demez)
     · etiketsiz form alanı
     · başlık sırası atlaması (h2 → h4)
     · 24 px altı dokunma hedefi (WCAG 2.2 AA · Target Size Minimum)
     · alt'sız görsel
     · pozitif tabindex (sekme sırasını bozar)
     · klavyeyle ulaşılamayan tıklanabilir öge
     · yer imi eksikliği (main / nav / footer)
     · atlama bağlantısının ilk durak olmaması

   Bilinen ve KABUL EDİLEN eksikler `IZIN` listesinde durur; her biri
   gerekçesiyle yazılır. Liste bir bahane defteri değil bir borç
   defteridir: dolu kalması normal değildir.

     node tools/a11ycheck.js [port]
*/

const { spawn } = require('child_process');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 4291;
const wait = ms => new Promise(r => setTimeout(r, ms));

/* Kabul edilen, gerekçeli eksikler. Kapandıkça buradan silinir. */
const IZIN = [
  /* Ölçüyü küçültmeden dokunma alanını büyütmek gerekiyor; görsel
     boyut bilerek küçük (satırın içinde bir nokta kadar yer kaplar). */
  { tur:'kucuk', desen:/\bhint\b/,            not:'ⓘ düğmesi 16×16 — dokunma alanı ::after ile büyütülecek' },
  { tur:'kucuk', desen:/sitefoot__reload/,    not:'künye tazele bağlantısı 50×17' },
  { tur:'kucuk', desen:/INPUT 1[0-9]×1[0-9]/, not:'onay kutusu yerel denetim boyutu' },
  { tur:'etiketsiz', desen:/meal-slot/,       not:'öğün yuvası seçici — aria-label eklenecek' },
];
const izinli = (tur, metin) => IZIN.some(x => x.tur === tur && x.desen.test(metin));

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)],
    { cwd:ROOT, stdio:'ignore' });
  await wait(900);
  const base = 'http://localhost:' + PORT;
  const problems = [];
  const browser = await chromium.launch({
    executablePath:process.env.CHROMIUM_PATH || undefined });

  try{
    const page = await browser.newPage({ viewport:{ width:1280, height:900 } });
    page.on('pageerror', e => problems.push('sayfa hatası: ' + String(e).slice(0, 120)));
    await page.goto(base + '/src/index.html', { waitUntil:'load' });
    await page.waitForSelector('.site', { timeout:15000 });
    await wait(600);
    const skip = await page.$('[data-act="setup-skip"]');
    if(skip) await skip.click();
    await wait(300);

    /* VERİ TOHUMLA: boş ekranda denetlenecek bir denetim yoktur. */
    await page.evaluate(async () => {
      await ESP.Model.saveProfile({ name:'Ömer', focus:'balanced', langs:['en'],
        instrument:'gitar', dailyMinutes:60 });
      for(let i = 0; i < 8; i++){
        const d = ESP.U.iso(ESP.U.addDays(ESP.U.today(), -i));
        await ESP.Model.addSession(d, { disc:i % 2 ? 'lang' : 'music', minutes:30 + i });
      }
      for(const [f, bk] of [['nevertheless', 'yine de'], ['to grasp', 'kavramak'],
          ['make a point', 'bir noktaya değinmek'], ['as far as I can tell', 'anlayabildiğim kadarıyla']]){
        await ESP.Model.saveCard(ESP.Model.newCard({ front:f, back:bk, lang:'en' }));
      }
      await ESP.SRS.answer(ESP.S.cards[0].id, 'good');
      await ESP.Model.saveBook(ESP.Model.newBook({ title:'Devlet', author:'Platon' }));
      await ESP.Model.saveBook(ESP.Model.newBook({ title:'Etika', author:'Spinoza' }));
      await ESP.Model.saveNote(ESP.Model.newNote({ text:'Adalet, herkesin kendi işini yapmasıdır.',
        bookId:ESP.S.books[0].id, concepts:['adalet'] }));
      await ESP.Model.saveNote(ESP.Model.newNote({ text:'Özgürlük, zorunluluğun bilgisidir.',
        bookId:ESP.S.books[1].id, concepts:['ozgurluk'] }));
      await ESP.Model.saveArgument(ESP.Model.newArgument({
        thesis:'Özgürlük yalnızca seçenek çokluğu değildir.',
        supports:['Seçenekleri değerlendirecek bir ölçüt gerekir.'],
        objections:[{ id:'o1', text:'Ölçütü kim koyar?', answered:false }],
        concepts:['ozgurluk'] }));
      await ESP.Model.savePiece(ESP.Model.newPiece({ name:'Dönüşümlü mızrap',
        targetBpm:140, cleanBpm:96, thresholdAt:ESP.U.todayISO() }));
      await ESP.Model.saveRecording({ date:ESP.U.todayISO(), seconds:14, secondsCert:'measured',
        words:28, wordsCert:'measured', errors:2, errorsCert:'estimated' });
      await ESP.Model.saveDraft(ESP.Model.newDraft({ title:'Deneme',
        text:'Yazmak düşünmenin kendisidir. Bir cümle kurmak, o cümleyi savunmaktır.' }));
    });
    await wait(300);

    /* ---- kabuk düzeyinde: bir kez ---- */
    await page.evaluate(() => document.body.focus());
    const ilk = [];
    for(let i = 0; i < 3; i++){
      await page.keyboard.press('Tab');
      await wait(60);
      ilk.push(await page.evaluate(() =>
        (document.activeElement.className || '') + '|' +
        (document.activeElement.textContent || '').trim().slice(0, 20)));
    }
    if(!/skiplink/.test(ilk[0])) problems.push('atlama bağlantısı ilk Tab durağı değil: ' + ilk[0]);

    const kabuk = await page.evaluate(() => ({
      lang:document.documentElement.getAttribute('lang'),
      main:document.querySelectorAll('main,[role=main]').length,
      nav:document.querySelectorAll('nav,[role=navigation]').length,
      footer:document.querySelectorAll('footer,[role=contentinfo]').length,
    }));
    if(kabuk.lang !== 'tr') problems.push('kök dil "tr" değil: ' + kabuk.lang);
    if(kabuk.main !== 1) problems.push('tam olarak bir <main> olmalı, ' + kabuk.main + ' var');
    if(!kabuk.nav) problems.push('gezinme yer imi yok');
    if(!kabuk.footer) problems.push('künye yer imi yok');

    /* ---- her ekran ---- */
    const routes = await page.evaluate(() =>
      ESP.Nav.sections().reduce((a, s) => a.concat(s.views.map(v => v.route)), []));

    for(const route of routes){
      await page.evaluate(async r => { await ESP.App.go(r); }, route);
      await wait(380);
      const r = await page.evaluate(() => {
        const out = { adsiz:[], etiketsiz:[], baslik:[], kucuk:[], imgAlt:[],
          tabindex:[], odaksiz:[] };
        /* Ekran okuyucu `aria-hidden` isaretli metni OKUMAZ. textContent
           ise okur: icinde yalnizca dekoratif bir ✓ olan bir dugme,
           "adli" gorunup aslinda adsiz kaliyordu. Bu denetim tam da bunu
           bulmak icin var; kendi olcusu yanlisken bulamaz.

           Olculdu: bu duzeltmeden once etiketi hic cizilmeyen disiplin
           secicisi (bos kutular) denetimden TEMIZ gecti. */
        const metin = el => {
          const k = el.cloneNode(true);
          k.querySelectorAll('[aria-hidden="true"]').forEach(x => x.remove());
          return (k.textContent || '').trim();
        };
        const ad = el => metin(el) || el.getAttribute('aria-label')
          || el.getAttribute('title')
          || (el.getAttribute('aria-labelledby') &&
              (document.getElementById(el.getAttribute('aria-labelledby')) || {}).textContent)
          || '';
        const gorunur = el => el.offsetParent !== null;

        document.querySelectorAll('button, a[href], [role="button"]').forEach(el => {
          if(!gorunur(el)) return;
          if(!ad(el).trim())
            out.adsiz.push((el.className || el.tagName) + ' @' + (el.dataset.act || '?'));
        });
        document.querySelectorAll('input, select, textarea').forEach(el => {
          if(!gorunur(el) || el.type === 'hidden') return;
          const lbl = el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
          if(!lbl && !el.closest('label') && !el.getAttribute('aria-label')
             && !el.getAttribute('aria-labelledby'))
            out.etiketsiz.push(el.tagName.toLowerCase() + '#' + (el.id || '-'));
        });
        let onceki = 0;
        document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
          if(!gorunur(h)) return;
          const n = Number(h.tagName[1]);
          if(onceki && n > onceki + 1)
            out.baslik.push('h' + onceki + ' → h' + n + ': "' + metin(h).slice(0, 30) + '"');
          onceki = n;
        });
        document.querySelectorAll('button, a[href], [role="button"], input[type=checkbox], input[type=radio]')
          .forEach(el => {
            if(!gorunur(el)) return;
            const b = el.getBoundingClientRect();
            if(b.width < 24 || b.height < 24)
              out.kucuk.push((el.className || el.tagName) + ' ' +
                Math.round(b.width) + '×' + Math.round(b.height));
          });
        document.querySelectorAll('img').forEach(el => {
          if(el.getAttribute('alt') === null) out.imgAlt.push(String(el.src).slice(-40));
        });
        document.querySelectorAll('[tabindex]').forEach(el => {
          if(Number(el.getAttribute('tabindex')) > 0) out.tabindex.push(el.className);
        });
        document.querySelectorAll('[data-act]').forEach(el => {
          if(!gorunur(el)) return;
          const t = el.tagName.toLowerCase();
          if(/^(button|a|input|select|textarea)$/.test(t)) return;
          if(el.getAttribute('tabindex') !== null) return;
          out.odaksiz.push(t + '.' + String(el.className).split(' ')[0] + ' @' + el.dataset.act);
        });
        return out;
      });

      Object.entries(r).forEach(([tur, liste]) => {
        [...new Set(liste)].forEach(x => {
          if(izinli(tur, x)) return;
          problems.push(route + ' · ' + tur + ': ' + x);
        });
      });
    }

    /* ---- alt sayfa kipliliği ---- */
    await page.evaluate(async () => { await ESP.App.go('office'); });
    await wait(400);
    const ac = await page.$('[data-act="add-decision"]');
    if(ac){
      await ac.click();
      await wait(400);
      const m = await page.evaluate(() => {
        const el = document.getElementById('sheet');
        const site = document.querySelector('.site');
        return {
          rol:!!(el && el.querySelector('[role=dialog]')),
          odakIcerde:!!(el && el.contains(document.activeElement)),
          arkaGizli:!!(site && (site.hasAttribute('inert') ||
            site.getAttribute('aria-hidden') === 'true')),
        };
      });
      if(!m.rol) problems.push('alt sayfada role="dialog" yok');
      if(!m.odakIcerde) problems.push('alt sayfa açılınca odak içeri girmiyor');
      if(!m.arkaGizli) problems.push('alt sayfa açıkken arka plan inert/aria-hidden değil');
      await page.keyboard.press('Escape');
      await wait(250);
    }
  }catch(err){
    console.error('Koşum hatası:', err && err.message ? err.message : err);
    await browser.close(); srv.kill();
    process.exit(2);
  }

  await browser.close();
  srv.kill();

  if(problems.length){
    console.log('ERİŞİLEBİLİRLİK SORUNU (' + problems.length + ')');
    problems.forEach(p => console.log('  · ' + p));
    if(IZIN.length) console.log('\n(' + IZIN.length + ' bilinen eksik izin listesinde — bkz. tools/a11ycheck.js)');
    process.exit(1);
  }
  console.log('erisilebilirlik temiz'
    + (IZIN.length ? ' (' + IZIN.length + ' bilinen eksik izin listesinde)' : ''));
})();
