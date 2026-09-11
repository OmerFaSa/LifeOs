#!/usr/bin/env node
/* DÜZEN DENETİMİ — beş tasarım dili × on iki ekran × üç genişlik.

   Düzen seçimi kabuğun ızgarasını değiştiriyor; bir düzende doğru duran
   bir ekran diğerinde taşabilir. Palet denetimi rengi, defter denetimi
   satır yapısını koruyor — bu da DÜZENİ korur.

   Aranan hatalar:
     · yatay taşma (kendi kaydırma kabı olmayan bir öge sayfayı aşıyor)
     · üst üste binen yapışkan sütun (künye sütunu içeriğin altında kalıyor)
     · çizilmeyen ekran (gövde boş)
     · konsol hatası

   Ek olarak `--shot` verilirse her düzen için birer ekran görüntüsü alır.

     node tools/designcheck.js [--shot] [port]
*/

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const SHOT = args.includes('--shot');
const PORT = Number(args.find(a => /^\d+$/.test(a))) || 4291;
const SHOTDIR = process.env.SHOT_DIR || path.join(ROOT, '.shots');

/* Genişlikler: her düzenin kendi eşikleri var, aralarda kalan ölçüler
   en çok hata çıkan yerler. Tam ekran listesi yalnız iki ölçüde gezilir;
   aradakiler temsilci ekranlarla taranır ki koşum süresi dürüst kalsın. */
const WIDTHS = [
  [1440, 'geniş', false], [1280, 'masaüstü', true], [1100, 'dar masaüstü', false],
  [980, 'tablet', false], [760, 'küçük tablet', false], [430, 'telefon', true],
];
const AZ_ROTA = ['today', 'labs', 'move', 'office', 'family'];

/* WCAG kontrastı — «metin görünüyor mu» sorusu göz kararına bırakılmaz. */
function lum(c){
  const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]);
}
function ratio(a, b){
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
}
const wait = ms => new Promise(r => setTimeout(r, ms));

async function waitForServer(url){
  for(let i = 0; i < 60; i++){
    try{ await fetch(url); return; }catch(e){ await wait(200); }
  }
  throw new Error('sunucu açılmadı: ' + url);
}

(async () => {
  const server = spawn('python3', [path.join(ROOT, 'devserver.py'), String(PORT)],
    { cwd:ROOT, stdio:'ignore' });
  const base = 'http://127.0.0.1:' + PORT;
  const problems = [];

  try{
    await waitForServer(base + '/index.html');
    const browser = await chromium.launch({
      executablePath:process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
    /* Görünüm geçişi (View Transitions) kapalı: açıkken tam sayfa
       görüntüsü eski kareyi yarı saydam yakalıyor ve ölçüm yanılıyor. */
    const page = await browser.newPage({ reducedMotion:'reduce' });

    const errs = [];
    /* Kaynak yükleme hataları burada denetlenmez: çevrimdışı ortamda yazı
       tipi CDN'i ve favicon düşer, ikisi de uygulamanın hatası değildir.
       Kaynakların gerçekten yüklendiğini duman testi denetliyor. */
    const ignorable = t => /Failed to load resource|fonts\.(googleapis|gstatic)|favicon/.test(t || '');
    page.on('pageerror', e => { if(!ignorable(e.message)) errs.push(String(e.message)); });
    page.on('console', m => {
      if(m.type() === 'error' && !ignorable(m.text())) errs.push(m.text());
    });

    await page.goto(base + '/index.html', { waitUntil:'load' });
    await page.waitForSelector('.site', { timeout:15000 });
    await wait(700);
    const skip = await page.$('[data-act="setup-skip"]');
    if(skip) await skip.click();
    await wait(300);

    /* VERİ TOHUMLA. Boş bir uygulama düzen hatalarını gizler: liste
       yoksa taşma da yoktur. Denetim ancak dolu ekranlarda anlamlı. */
    await page.evaluate(async () => {
      await SP.Model.saveProfile({ name:'Ömer', birthYear:1998, sex:'male',
        heightCm:178, weightKg:74, activity:'moderate', goal:'health' });
      const r = SP.Model.newLab('2026-08-20');
      /* Bir ölçüm BİLEREK bandın altında: masalar arası devir satırı
         ancak böyle çizilir, çizilmeyen satırın taşması da görülmez. */
      Object.entries({ hemoglobin:13.8, ferritin:14, b12:288, hdl:44, ldl:128,
                       tsh:2.6, crp:1.2, glukoz:92, vitd:16 })
        .forEach(([k, v]) => {
          const bb = SP.BIO_BY_ID[k];
          if(bb) r.values[k] = { v, cert:'measured', unit:bb.unit };
        });
      await SP.Model.saveLab(r);
      await SP.Model.saveVitals(SP.U.todayISO(), { sleep:7.2, rhr:58, weight:74, mood:4 });
    });
    await wait(300);

    const designs = await page.evaluate(() => SP.DESIGNS.map(d => d.id));
    const routes = await page.evaluate(() =>
      SP.App.SECTIONS.reduce((a, s) => a.concat(s.views.map(v => v.route)), []));

    if(SHOT) fs.mkdirSync(SHOTDIR, { recursive:true });

    const temalar = (process.env.TEMA || 'light,dark').split(',');
    for(const tema of temalar){
    for(const design of designs){
      await page.evaluate(async ([d, t]) => {
        await SP.Model.saveProfile({ design:d, theme:t });
        SP.App.applyTheme();
        await SP.App.render();
      }, [design, tema]);
      await wait(250);

      /* kök gerçekten yazıldı mı? */
      const attr = await page.evaluate(() => document.documentElement.getAttribute('data-design'));
      const beklenen = design === 'defter' ? null : design;
      if(attr !== beklenen) problems.push(design + ': kökte data-design "' + attr + '"');

      /* Jetonlar ÇÖZÜLÜYOR mu? Bir düzen `--bg`yi `--surface-2`den,
         `--surface-2`yi de `--bg`den türetirse CSS özel değişken
         DÖNGÜSÜ oluşur ve zincirdeki her değer geçersiz olur; ekran
         sessizce zeminsiz kalır ve metin görünmez olur.

         Jetonun METNİNE bakmak yanıltıcı: ölçülen şey BOYANMIŞ
         renktir. Zemin saydam kalıyorsa ya da metinle zemin arasında
         kontrast yoksa bir yerde zincir kopmuştur. */
      const boya = await page.evaluate(() => {
        /* Hesaplanmış renk her zaman `rgb()` olarak gelmez: `color-mix(in
           oklab, …)` Chromium'da `oklab(…)` diye serileşir ve sayıları
           0–1 aralığındadır. Doğrudan ayrıştırmak sessizce yanlış ölçüm
           üretir; o yüzden renk tuvale boyanıp gerçek sRGB değeri
           okunur. */
        const cv = document.createElement('canvas'); cv.width = cv.height = 1;
        const cx = cv.getContext('2d', { willReadFrequently:true });
        const toRgb = v => {
          cx.clearRect(0, 0, 1, 1);
          cx.fillStyle = '#000';
          cx.fillStyle = v;
          cx.fillRect(0, 0, 1, 1);
          const d = cx.getImageData(0, 0, 1, 1).data;
          return [d[0], d[1], d[2], d[3] / 255];
        };
        const site = document.querySelector('.site');
        const main = document.getElementById('main');
        const foot = document.querySelector('.sitefoot');
        return {
          siteBg:toRgb(getComputedStyle(site).backgroundColor),
          footBg:foot ? toRgb(getComputedStyle(foot).backgroundColor) : [0, 0, 0, 1],
          text:toRgb(getComputedStyle(main || document.body).color),
        };
      });
      const saydam = c => c[3] < 0.9;
      if(saydam(boya.siteBg)) problems.push(design + ': kabuk zemini saydam — jeton döngüsü?');
      if(saydam(boya.footBg)) problems.push(design + ': alt bant zemini saydam — jeton döngüsü?');
      const kontrast = ratio(boya.text.slice(0, 3), boya.siteBg.slice(0, 3));
      if(kontrast < 4.5)
        problems.push(design + ': metin/zemin kontrastı ' + kontrast.toFixed(2) + ' < 4.5');

      for(const [w, adi, tamListe] of WIDTHS){
        await page.setViewportSize({ width:w, height:900 });
        for(const route of (tamListe ? routes : AZ_ROTA)){
          await page.evaluate(r => SP.App.go(r), route);
          await wait(170);

          const r = await page.evaluate(() => {
            const d = document.documentElement;
            const ad = el => (typeof el.className === 'string' && el.className)
              ? el.tagName.toLowerCase() + '.' + el.className.trim().split(/\s+/)[0]
              : el.tagName.toLowerCase();
            const over = [], kirpik = [];

            for(const el of document.querySelectorAll('.site *')){
              const b = el.getBoundingClientRect();
              if(b.width === 0 && b.height === 0) continue;
              const cs = getComputedStyle(el);

              /* KIRPILAN İÇERİK. Yatay taşmayı yutan bir kap, sorunu
                 çözmez — gizler. `hidden`/`clip` bir kapta içerik
                 sığmıyorsa kullanıcı o veriyi HİÇ göremez ve kaydırarak
                 da ulaşamaz. `auto`/`scroll` sorun değil: kaydırılabilir. */
              const ox = cs.overflowX, oy = cs.overflowY;
              if((ox === 'hidden' || ox === 'clip') && el.scrollWidth > el.clientWidth + 2)
                kirpik.push(ad(el) + ' (' + el.scrollWidth + '>' + el.clientWidth + ')');
              if((oy === 'hidden' || oy === 'clip') && el.scrollHeight > el.clientHeight + 2
                 && cs.position !== 'fixed')
                kirpik.push(ad(el) + ' ↕(' + el.scrollHeight + '>' + el.clientHeight + ')');

              if(b.right <= d.clientWidth + 2 && b.left >= -2) continue;
              let p = el.parentElement, kapali = false;
              while(p){
                const ov = getComputedStyle(p).overflowX;
                if(ov === 'auto' || ov === 'scroll' || ov === 'hidden' || ov === 'clip'){
                  kapali = true; break;
                }
                p = p.parentElement;
              }
              if(!kapali) over.push(ad(el));
            }

            /* Üst çubuk araçları sağ uçta durur. Bir düzen aradaki
               esneyen ögeyi gizlediğinde araçlar markanın dibine
               yığılıyor ve künye bozuk görünüyor. */
            const bar = document.querySelector('.masthead__in');
            const tools = document.querySelector('.navtools');
            let aracBosluk = 0;
            if(bar && tools)
              aracBosluk = Math.round(bar.getBoundingClientRect().right
                - tools.getBoundingClientRect().right);

            const main = document.getElementById('main');
            return {
              scrollW:d.scrollWidth, clientW:d.clientWidth,
              text:(main && main.innerText || '').trim().length,
              over:[...new Set(over)].slice(0, 4),
              kirpik:[...new Set(kirpik)].slice(0, 4),
              aracBosluk,
            };
          });

          const yer = tema + '/' + design + '/' + route + ' @' + adi;
          if(r.scrollW > r.clientW + 2)
            problems.push(yer + ': yatay taşma ' + r.scrollW + '>' + r.clientW
              + (r.over.length ? ' — ' + r.over.join(', ') : ''));
          else if(r.over.length)
            problems.push(yer + ': kaba sığmayan öge — ' + r.over.join(', '));
          if(r.text < 60) problems.push(yer + ': gövde boş (' + r.text + ' karakter)');
          if(r.kirpik.length)
            problems.push(yer + ': içerik kırpılıyor — ' + r.kirpik.join(', '));
          if(r.aracBosluk > 40)
            problems.push(yer + ': künye araçları sağ uca yaslanmamış (' + r.aracBosluk + 'px açık)');
        }
      }

      if(SHOT && tema === 'light'){
        await page.setViewportSize({ width:1280, height:900 });
        await page.evaluate(() => SP.App.go('today'));
        await wait(400);
        /* Dar görünümden dönüldüğünde sayfa yüksekliği bir kare geç
           oturuyor; tam sayfa görüntüsü o eski yüksekliği yakalıyordu. */
        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(1100);
        await page.screenshot({ path:path.join(SHOTDIR, design + '.png'), fullPage:true });
      }

      /* AÇILAN KATMANLAR. Görünüm kâğıdı, komut paleti ve alt sayfa
         kabuğun dışında çizilir; bir düzenin ızgarası ya da yazı ölçüsü
         onları ekrandan taşırabilir. Boş ekranda görünmeyen bir hata. */
      await page.setViewportSize({ width:1280, height:900 });
      await page.evaluate(() => SP.App.go('today'));
      await wait(200);
      const katmanlar = [
        ['görünüm kâğıdı', () => document.querySelector('[data-act="open-appearance"]').click(),
          '#appearance', () => SP.App.closeAppearance()],
        ['komut paleti', () => SP.Palette.open(), '.cmdk__box', () => SP.Palette.close()],
      ];
      for(const [ad, ac, sec, kapat] of katmanlar){
        await page.evaluate(f => eval('(' + f + ')')(), ac.toString());
        await wait(320);
        const kt = await page.evaluate(s2 => {
          const el = document.querySelector(s2);
          if(!el) return { yok:true };
          const b = el.getBoundingClientRect();
          return { yok:false, l:Math.round(b.left), r:Math.round(b.right),
            t:Math.round(b.top), bt:Math.round(b.bottom),
            w:window.innerWidth, h:window.innerHeight,
            tas:el.scrollHeight > el.clientHeight + 2 };
        }, sec);
        if(kt.yok) problems.push(tema + '/' + design + ': ' + ad + ' açılmadı');
        else{
          if(kt.l < -2 || kt.r > kt.w + 2 || kt.t < -2)
            problems.push(tema + '/' + design + ': ' + ad + ' ekran dışına taşıyor ('
              + kt.l + '…' + kt.r + ' / ' + kt.w + ')');
          if(kt.bt > kt.h + 2)
            problems.push(tema + '/' + design + ': ' + ad + ' ekranın altından taşıyor ('
              + kt.bt + ' > ' + kt.h + ')');
        }
        await page.evaluate(f => eval('(' + f + ')')(), kapat.toString());
        await wait(180);
      }
    }
    }

    if(errs.length) problems.push('konsol — ' + [...new Set(errs)].slice(0, 3).join(' | '));
    await browser.close();
  }catch(e){
    problems.push('koşum hatası: ' + (e && e.message || e));
  }finally{
    server.kill();
  }

  if(problems.length){
    console.log(problems.slice(0, 40).join('\n'));
    if(problems.length > 40) console.log('… ve ' + (problems.length - 40) + ' tane daha');
    console.log('\n' + problems.length + ' sorun');
    process.exit(1);
  }
  console.log('beş düzen temiz');
})();
