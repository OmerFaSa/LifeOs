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
const PORT = Number(process.argv[2]) || 4292;
const wait = ms => new Promise(r => setTimeout(r, ms));

/* Kabul edilen, gerekçeli eksikler. Kapandıkça buradan silinir. */
const IZIN = [
  /* Ölçüyü küçültmeden dokunma alanını büyütmek gerekiyor; görsel
     boyut bilerek küçük (satırın içinde bir nokta kadar yer kaplar). */
  { tur:'kucuk', desen:/\bhint\b/,            not:'ⓘ düğmesi 16×16 — dokunma alanı ::after ile büyütülecek' },
  { tur:'kucuk', desen:/INPUT 1[0-9]×1[0-9]/, not:'onay kutusu yerel denetim boyutu' },
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
    /* KURULUM ALT SAYFASI KAPANIR: açıkken sayfa `inert` olur ve
       denetlenecek hiçbir öge görünür sayılmaz. */
    await page.evaluate(async () => {
      R.S.profile.setupDone = true;
      R.S.profile.name = R.S.profile.name || 'Ömer';
      await R.Model.saveProfile();
      try{ R.UI.closeSheet(); }catch(e){}
      document.querySelectorAll('.sheet,.sheet-backdrop').forEach(n => n.remove());
      document.querySelectorAll('.site').forEach(n => {
        n.removeAttribute('inert'); n.removeAttribute('aria-hidden'); });
      await R.App.render();
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
      R.App.NAV.reduce((a, g) => a.concat(g.items.map(v => v.id)), []));

    for(const route of routes){
      await page.evaluate(async r => { await R.App.go(r); }, route);
      await wait(380);
      const r = await page.evaluate(() => {
        const out = { adsiz:[], etiketsiz:[], baslik:[], kucuk:[], imgAlt:[],
          tabindex:[], odaksiz:[] };
        const metin = el => (el.textContent || '').trim();
        const ad = el => metin(el) || el.getAttribute('aria-label')
          || el.getAttribute('title')
          || (el.getAttribute('aria-labelledby') &&
              (document.getElementById(el.getAttribute('aria-labelledby')) || {}).textContent)
          || '';
        /* ERISILEBILIRLIK AGACINDAN CIKARILMIS OGE DENETLENMEZ.

           `aria-hidden="true"` + `tabindex="-1"` tasiyan bir oge ekran
           okuyucuya hic gorunmez; gorsel olarak da yalnizca kendi
           tetikleyicisi araciligiyla kullanilir (ornegin gorunur bir
           birakma alaninin arkasindaki dosya girdisi). Ilk surum bunu
           "etiketsiz alan" diye bildiriyordu: olmayan bir hata. */
        const gizliAgac = el => !!el.closest('[aria-hidden="true"]');
        const gorunur = el => el.offsetParent !== null && !gizliAgac(el);

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

    /* ---- alt sayfa kipliliği ----

       Alt sayfa bir dugmeye basarak degil, DOGRUDAN acilir: hangi
       ekranda hangi dugmenin alt sayfa actigi zamanla degisir ve
       denetim o degisiklikte sessizce hicbir sey olcmez hale gelir.
       Olculen sey `UI.sheet`'in kendisidir. */
    await page.evaluate(async () => { await R.App.go('today'); });
    await wait(400);
    await page.evaluate(() => {
      document.querySelector('#main button, #main a[href]')?.focus();
      R.UI.sheet({ title:'Denetim', body:'<input id="dn-a"><button>Tamam</button>' });
    });
    await wait(400);
    const m = await page.evaluate(() => {
      const el = document.getElementById('sheet');
      const site = document.querySelector('.site');
      return {
        rol:!!(el && el.querySelector('[role=dialog]')),
        odakIcerde:!!(el && el.contains(document.activeElement)),
        arkaGizli:!!(site && (site.hasAttribute('inert') ||
          site.getAttribute('aria-hidden') === 'true')),
        kaydirmaKilidi:document.body.style.overflow === 'hidden',
      };
    });
    if(!m.rol) problems.push('alt sayfada role="dialog" yok');
    if(!m.odakIcerde) problems.push('alt sayfa açılınca odak içeri girmiyor');
    if(!m.arkaGizli) problems.push('alt sayfa açıkken arka plan inert/aria-hidden değil');
    if(!m.kaydirmaKilidi) problems.push('alt sayfa açıkken arka plan kaydırması kilitli değil');

    /* Tab dongusu iceride kalmali: son ogeden sonra basa doner. */
    await page.evaluate(() => {
      const el = document.getElementById('sheet');
      const list = el.querySelectorAll('a[href], button, input, textarea, select');
      list[list.length - 1].focus();
    });
    await page.keyboard.press('Tab');
    await wait(120);
    const icerde = await page.evaluate(() =>
      !!document.getElementById('sheet')?.contains(document.activeElement));
    if(!icerde) problems.push('alt sayfada Tab döngüsü dışarı çıkıyor');

    /* Kapaninca odak acan ogeye donmeli. */
    await page.evaluate(() => R.UI.closeSheet());
    await wait(200);
    const geriDondu = await page.evaluate(() =>
      !!document.querySelector('.site')?.contains(document.activeElement));
    if(!geriDondu) problems.push('alt sayfa kapanınca odak sayfaya dönmüyor');

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
