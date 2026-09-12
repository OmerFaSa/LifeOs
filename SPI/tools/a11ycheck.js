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
  /* Tarayıcının kendi onay kutusu; boyutunu işletim sistemi verir ve
     büyütmek için yerel denetimi bırakıp kendi kutumuzu çizmek gerekir.
     Dokunma alanı çevresindeki etiketle zaten büyüktür. */
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
    const skip = await page.$('[data-act="setup-skip"]');
    if(skip) await skip.click();
    await wait(300);

    /* VERİ TOHUMLA: boş ekranda denetlenecek bir denetim yoktur. */
    await page.evaluate(async () => {
      await SP.Model.saveProfile({ name:'Ömer', birthYear:1998, sex:'female',
        heightCm:170, weightKg:64, activity:'moderate', goal:'health' });
      const r = SP.Model.newLab('2026-08-20');
      Object.entries({ hemoglobin:11.8, ferritin:14, b12:288, hdl:44, ldl:128,
        chol:210, trig:140, tsh:2.6, crp:1.2, glukoz:92, vitd:16, creat:0.8 })
        .forEach(([k, v]) => {
          const bb = SP.BIO_BY_ID[k];
          if(bb) r.values[k] = { v, cert:'measured', unit:bb.unit };
        });
      await SP.Model.saveLab(r);
      for(let i = 0; i < 8; i++){
        const d = SP.U.iso(SP.U.addDays(SP.U.today(), -i));
        await SP.Model.saveVitals(d, { sleep:7, rhr:58, weight:64, mood:4, hrv:48 });
      }
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
      SP.App.SECTIONS.reduce((a, s) => a.concat(s.views.map(v => v.route)), []));

    for(const route of routes){
      await page.evaluate(async r => { await SP.App.go(r); }, route);
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
        /* DOKUNMA HEDEFI GORSEL KUTUYLA AYNI DEGILDIR.

           Ilk surum `getBoundingClientRect()` olcuyordu; oysa gorsel
           olarak kucuk kalmasi gereken bir dugmenin dokunma alani
           gorunmez bir `::after` ile buyutulebilir ve dogru cozum de
           budur. O olcum, dogru sekilde duzeltilmis bir dugmeyi hala
           "kucuk" diye bildiriyor ve borc defterinde sahte bir satir
           tutmaya zorluyordu.

           Ikinci surum `elementFromPoint` ile tarayiciya soruyordu; o da
           yanlisti: alt bant sayfanin dibinde, gorunen alanin disinda
           kaliyor ve `elementFromPoint` null donuyordu. Gorunmeyen her
           dugme "kucuk" sayiliyordu.

           Dogru olcum sahte ogenin KUTUSUNU okumaktir: konumlandirilmis
           bir ::before/::after, ogenin isabet alanini kendi olcusune
           kadar buyutur. Kaydirma konumundan bagimsizdir. */
        const sahteKutu = (el, hangi) => {
          const cs = getComputedStyle(el, hangi);
          if(!cs || cs.content === 'none' || cs.position === 'static') return null;
          const w = parseFloat(cs.width), h = parseFloat(cs.height);
          if(!isFinite(w) || !isFinite(h)) return null;
          return { w, h };
        };
        const etkinOlcu = el => {
          const b = el.getBoundingClientRect();
          let w = b.width, h = b.height;
          ['::before', '::after'].forEach(x => {
            const k = sahteKutu(el, x);
            if(!k) return;
            w = Math.max(w, k.w); h = Math.max(h, k.h);
          });
          return { w, h };
        };
        document.querySelectorAll('button, a[href], [role="button"], input[type=checkbox], input[type=radio]')
          .forEach(el => {
            if(!gorunur(el)) return;
            const e = etkinOlcu(el);
            if(e.w >= 24 && e.h >= 24) return;
            const b = el.getBoundingClientRect();
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
    await page.evaluate(async () => { await SP.App.go('office'); });
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
