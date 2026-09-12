/* Palet denetimi — yedi palet x iki tema x alti bolum x bes duzen.

   Bir rengin okunup okunmadigi goz kararina birakilmaz. Bu betik her
   kombinasyonda WCAG AA kontrast oranini olcer ve gecemeyeni yazar:

     metin/zemin, ikincil metin/zemin, bolum rengi/zemin,
     dugme yazisi/bolum rengi, alt bant yazilari, cetvel cizgisi/yuzey

   Kullanim:  node tools/palettecheck.js
   Cikti:     "butun paletler AA gecti"  ya da  sorunlu kombinasyonlar

   Ayrica /tmp/pal altina her paletin ekran goruntusunu birakir. */

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const OUT = '/tmp/pal-ays'; fs.mkdirSync(OUT, { recursive:true });
const srv = spawn('python3', ['devserver.py'], { cwd:'/home/user/LifeOs/AYS', stdio:'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));

/* WCAG kontrast — arayuzun okunabilirligi goz kararina birakilmaz. */
function lum(c){ const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
  return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]); }
function ratio(a,b){ const l1=lum(a),l2=lum(b); return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05); }

/* Olcum ve denetim listesi TEK YERDE: ekran, palet ve duzen donguleri
   ayni tanimi kullansin, biri guncellenip digeri unutulmasin diye. */
async function measure(p){
  return p.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const g = n => cs.getPropertyValue(n).trim();
    /* Renk tuvale boyanip gercek sRGB degeri okunur. Hesaplanmis renk
       her zaman `rgb()` olarak gelmez: `color-mix(in oklab, …)`
       Chromium'da `oklab(…)` diye serilesir ve sayilari 0–1
       araligindadir. Metni dogrudan ayristirmak sessizce yanlis olcum
       uretir — nitekim uretiyordu. */
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently:true });
    const px = v => { cx.clearRect(0,0,1,1); cx.fillStyle='#000'; cx.fillStyle=v;
      cx.fillRect(0,0,1,1); const d=cx.getImageData(0,0,1,1).data;
      return [d[0], d[1], d[2]]; };
    const foot = document.querySelector('.sitefoot');
    const fb = foot ? getComputedStyle(foot).backgroundColor : 'rgb(0,0,0)';
    return { sec:px(g('--sec')), bg:px(g('--bg')), surf:px(g('--surface')),
      text:px(g('--text')), text2:px(g('--text-2')), text3:px(g('--text-3')),
      rule:px(g('--rule')),
      footBg:px(fb),
      footFg:px(g('--ink-on')), footFg2:px(g('--ink-on-2')),
      primInk:px(g('--primary-ink')) };
  });
}

function checksOf(m){
  return [
    ['metin/zemin', ratio(m.text, m.bg), 4.5],
    ['ikincil/zemin', ratio(m.text2, m.bg), 4.5],
    ['ucuncul/zemin', ratio(m.text3, m.bg), 4.5],
    ['metin/yuzey', ratio(m.text, m.surf), 4.5],
    ['ucuncul/yuzey', ratio(m.text3, m.surf), 4.5],
    ['bölüm rengi/zemin', ratio(m.sec, m.bg), 3.0],
    ['düğme yazısı/bölüm rengi', ratio(m.primInk, m.sec), 4.5],
    ['alt bant yazısı', ratio(m.footFg, m.footBg), 4.5],
    ['alt bant ikincil', ratio(m.footFg2, m.footBg), 4.5],
    ['cetvel çizgisi/yüzey', ratio(m.rule, m.surf), 1.25],
    /* Metin merdiveni SIRALI kalmali: ikincil metin, ucunculden her
       zaman guclu olmali. Bir duzen jetonlari yeniden turetirken bu
       siranin bozulmasi kolaydir ve gozle fark edilmez. */
    ['metin merdiveni sırası', ratio(m.text2, m.bg) / ratio(m.text3, m.bg), 1.0],
  ];
}

(async () => {
  await wait(1200);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.goto('http://127.0.0.1:4173/index.html', { waitUntil:'load' });
  await wait(1500);
  /* Kurulum alt sayfasi olcumu kapatir: acikken sayfa `inert` olur ve
     olculen renkler perdenin arkasindan gelir. */
  await p.evaluate(async () => {
    R.S.profile.setupDone = true;
    await R.Model.saveProfile();
    try{ R.UI.closeSheet(); }catch(e){}
    document.querySelectorAll('#sheet,.overlay,.sheet,.sheet-backdrop').forEach(n => n.remove());
    document.querySelectorAll('.site').forEach(n => {
      n.removeAttribute('inert'); n.removeAttribute('aria-hidden'); });
    await R.App.render();
  });

  const pals = ['kagit','indigo','grafit','okyanus','mor','bordo','orman'];
  const secs = ['today','plan','learn','progress','guide','office'];
  const bad = [];
  /* GECEN BIR DENETIM DE SAYI GOSTERIR. Hicbir sey olcmeyen bir betik de
     «gecti» yazar; en dusuk oran yazilinca olcumun gercekten yapildigi
     gorunur. */
  let en = { ad:"-", oran:Infinity, min:1, pay:Infinity, yer:"" };
  for(const theme of ['light','dark']){
    for(const pal of pals){
      await p.evaluate(async ([pl, th]) => {
        R.S.profile.palette = pl; R.S.profile.theme = th;
        await R.Model.saveProfile();
        R.App.applyTheme();
      }, [pal, theme]);
      for(const route of secs){
        await p.evaluate(id => R.App.go(id), route);
        await wait(180);
        const m = await measure(p);
        checksOf(m).forEach(([name, r, min]) => {
          if(r < min) bad.push(`${theme}/${pal}/${route}  ${name}  ${r.toFixed(2)} < ${min}`);
          if(r / min < en.pay || en.pay === undefined){ en = { ad:name, oran:r, min, pay:r/min, yer:`${theme}/${pal}/${route}` }; }
        });
      }
      /* DUZENLER. Bazi duzenler jeton yeniden tanimliyor (ornegin kraft
         kagit rengini turetiyor); o yuzden kontrast varsayilan duzende
         gectigi icin diger dortte de gecmis sayilmaz. Tek temsilci ekran
         yeter: olculen sey ekranin icerigi degil, kokteki jetonlar. */
      for(const design of ['odak', 'kraft', 'katmanli', 'harita']){
        await p.evaluate(async d => {
          R.S.profile.design = d;
          await R.Model.saveProfile();
          R.App.applyTheme();
          await R.App.render();
        }, design);
        await p.evaluate(id => R.App.go(id), 'progress');
        await wait(220);
        const m = await measure(p);
        checksOf(m).forEach(([name, r, min]) => {
          if(r < min) bad.push(`${theme}/${pal}/${design}  ${name}  ${r.toFixed(2)} < ${min}`);
        });
      }
      await p.evaluate(async () => {
        R.S.profile.design = R.DEFAULT_DESIGN;
        await R.Model.saveProfile();
        R.App.applyTheme();
        await R.App.render();
      });

      /* Her palet icin bir ekran goruntusu birak. */
      await p.evaluate(id => R.App.go(id), 'progress');
      await wait(250);
      await p.screenshot({ path:`${OUT}/${theme}-${pal}.png` });
    }
  }
  console.log(bad.length ? 'KONTRAST SORUNU:\n' + bad.join('\n') : 'butun paletler AA gecti');
  console.log(`en dar pay: ${en.ad} ${en.oran.toFixed(2)} (asgari ${en.min}) — ${en.yer}`);
  await b.close(); srv.kill(); process.exit(0);
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
