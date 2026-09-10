/* Palet denetimi — yedi palet x iki tema x yedi bolum.

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
const OUT = '/tmp/pal'; fs.mkdirSync(OUT, { recursive:true });
const srv = spawn('python3', ['devserver.py'], { cwd:'/home/user/LifeOs/SPI', stdio:'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));

/* WCAG kontrast — arayuzun okunabilirligi goz kararina birakilmaz. */
function lum(c){ const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
  return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]); }
function ratio(a,b){ const l1=lum(a),l2=lum(b); return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05); }

(async () => {
  await wait(1200);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{ width:1280, height:900 } });
  await p.goto('http://127.0.0.1:4183/index.html', { waitUntil:'load' });
  await wait(1500);
  const skip = await p.$('[data-act="setup-skip"]'); if(skip){ await skip.click(); await wait(500); }
  await p.evaluate(async () => {
    const r = SP.Model.newLab('2026-08-20');
    Object.entries({ hemoglobin:13.8, ferritin:26, b12:288, hdl:44, ldl:128, tsh:2.6 })
      .forEach(([k,v]) => { const bb=SP.BIO_BY_ID[k]; r.values[k]={ v, cert:'measured', unit:bb?bb.unit:'' }; });
    await SP.Model.saveLab(r);
  });

  const pals = ['kagit','indigo','grafit','okyanus','mor','bordo','orman'];
  const secs = ['today','labs','meals','move','basket','office','family'];
  const bad = [];
  for(const theme of ['light','dark']){
    for(const pal of pals){
      await p.evaluate(async ([pl, th]) => {
        await SP.Model.saveProfile({ palette:pl, theme:th });
        SP.App.applyTheme();
      }, [pal, theme]);
      for(const route of secs){
        await p.evaluate(id => SP.App.go(id), route);
        await wait(180);
        const m = await p.evaluate(() => {
          const cs = getComputedStyle(document.documentElement);
          const g = n => cs.getPropertyValue(n).trim();
          const px = s => { const d=document.createElement('div'); d.style.color=s;
            document.body.appendChild(d); const c=getComputedStyle(d).color;
            d.remove(); return (c.match(/\d+/g)||[0,0,0]).slice(0,3).map(Number); };
          const foot = document.querySelector('.sitefoot');
          const fb = foot ? getComputedStyle(foot).backgroundColor : 'rgb(0,0,0)';
          return { sec:px(g('--sec')), bg:px(g('--bg')), surf:px(g('--surface')),
            text:px(g('--text')), text3:px(g('--text-3')), rule:px(g('--rule')),
            footBg:(fb.match(/\d+/g)||[0,0,0]).slice(0,3).map(Number),
            footFg:px(g('--ink-on')), footFg2:px(g('--ink-on-2')),
            primInk:px(g('--primary-ink')) };
        });
        const checks = [
          ['metin/zemin', ratio(m.text, m.bg), 4.5],
          ['ikincil/zemin', ratio(m.text3, m.bg), 4.5],
          ['bölüm rengi/zemin', ratio(m.sec, m.bg), 3.0],
          ['düğme yazısı/bölüm rengi', ratio(m.primInk, m.sec), 4.5],
          ['alt bant yazısı', ratio(m.footFg, m.footBg), 4.5],
          ['alt bant ikincil', ratio(m.footFg2, m.footBg), 4.5],
          ['cetvel çizgisi/yüzey', ratio(m.rule, m.surf), 1.25],
        ];
        checks.forEach(([name, r, min]) => {
          if(r < min) bad.push(`${theme}/${pal}/${route}  ${name}  ${r.toFixed(2)} < ${min}`);
        });
      }
      if(theme === 'light' && pal !== 'kagit') continue;
      await p.evaluate(id => SP.App.go(id), 'labs');
      await wait(250);
      await p.screenshot({ path:`${OUT}/${theme}-${pal}.png` });
    }
  }
  console.log(bad.length ? 'KONTRAST SORUNU:\n' + bad.join('\n') : 'butun paletler AA gecti');
  await b.close(); srv.kill(); process.exit(0);
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
