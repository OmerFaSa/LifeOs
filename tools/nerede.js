/* NEREDE — sadelik aşımının YERİ (tools/sadelik.js yalnız sayar).

     node tools/nerede.js ESP                  # bütün ekranlar
     node tools/nerede.js ESP lang,office      # yalnız bunlar

   Boş ve dolu profilde (dolu veri tools/envanter.js'ten okunur), 1440 px'te
   her ekran için: 30+ kelimelik tek parça yazı (envanterle AYNI kural) ve
   birden fazlaysa dolu düğmeler — varsa hangi `.sayfabolum`da olduğu ile.
   Kırmızı yapmaz; bir iş listesi verir. (K yazdı, T3 SPİ'de kullanıldı.) */
const path = require('path');
const { spawn } = require('child_process');
const KOK = '/home/user/LifeOs';
const ad = process.argv[2];
const NS = { AYS:'R', SPI:'SP', ESP:'ESP' }[ad];
const { chromium } = require(path.join(KOK, ad, 'node_modules/playwright'));
const env = require('fs').readFileSync(path.join(KOK, 'tools/envanter.js'), 'utf8');
/* DOLDUR[ad] kaynagini envanterden al */
const bas = env.indexOf('\n  ' + ad + ': () => {');
let i = env.indexOf('{', bas), d = 0, j = i;
for(; j < env.length; j++){ if(env[j] === '{') d++; else if(env[j] === '}'){ d--; if(!d) break; } }
const doldur = '() => ' + env.slice(i, j + 1);
(async () => {
  const port = 4389;
  const srv = spawn('python3', [path.join(KOK, ad, 'devserver.py'), String(port)], { cwd:path.join(KOK, ad), stdio:'ignore' });
  await new Promise(r => setTimeout(r, 1500));
  const b = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath:process.env.CHROMIUM_PATH } : {}) });
  for(const profil of ['bos', 'dolu']){
    const p = await b.newPage({ viewport:{ width:1440, height:900 }, reducedMotion:'reduce' });
    await p.goto('http://127.0.0.1:' + port + '/index.html');
    await p.waitForTimeout(1200);
    for(let k = 0; k < 3; k++){ const s = await p.$('[data-act="setup-skip"]'); if(!s) break; await s.click({ force:true }).catch(() => {}); await p.waitForTimeout(300); }
    if(profil === 'dolu') await p.evaluate('(' + doldur + ')()');
    const rotalar = process.argv[3] ? process.argv[3].split(',') : await p.evaluate(ns => {
      const N = window[ns]; return Object.keys(N.Screens); }, NS);
    for(const r of rotalar){
      const ok = await p.evaluate(a => { try{ window[a.ns].App.go(a.r); return true; }catch(e){ return false; } }, { ns:NS, r });
      if(!ok) continue;
      await p.waitForTimeout(250);
      const o = await p.evaluate(() => {
        const main = document.getElementById('main') || document.body;
        const gor = el => !!(el.offsetWidth || el.offsetHeight);
        const say = t => ((t || '').match(/[\p{L}\p{N}]+/gu) || []).length;
        const ADAY = /^(block|flex|grid|list-item|flow-root)$/;
        const BOLER = /^(block|flex|grid|list-item|flow-root|table|table-row-group|table-row|table-header-group|table-footer-group)$/;
        const uzun = [];
        main.querySelectorAll('*').forEach(el => {
          if(say(el.textContent) <= 30) return;
          if(!ADAY.test(getComputedStyle(el).display) || !gor(el)) return;
          const bc = Array.from(el.children).some(c => BOLER.test(getComputedStyle(c).display));
          if(!bc && say(el.innerText) > 30){
            const sec = el.closest('.sayfabolum');
            uzun.push((sec ? '[' + sec.id + '] ' : '') + el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0] + ' :: ' + el.innerText.replace(/\s+/g, ' ').slice(0, 110));
          }
        });
        const dolu = Array.from(main.querySelectorAll('.btn--primary')).filter(gor).map(x => {
          const sec = x.closest('.sayfabolum');
          return (sec ? '[' + sec.id + '] ' : '') + x.textContent.trim() + ' <' + (x.getAttribute('data-act') || '') + '>';
        });
        return { uzun, dolu };
      });
      if(o.uzun.length || o.dolu.length > 1){
        console.log('== ' + profil + ' · ' + r);
        o.uzun.forEach(u => console.log('   uzun  ' + u));
        if(o.dolu.length > 1) o.dolu.forEach(u => console.log('   dolu  ' + u));
      }
    }
    await p.close();
  }
  await b.close(); srv.kill();
})();
