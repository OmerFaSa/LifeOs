#!/usr/bin/env node
/* HKM yuzu — erisilebilirlik, telefon duzeni ve kontrast denetimi.
 *
 * Uc arayuz a11ycheck, layoutcheck ve palettecheck'ten geciyor; HKM'nin
 * yuzu hicbirinden gecmiyordu. «Sade bir sayfa» olmasi onu denetimden muaf
 * kilmaz: dort sekme, tablolar, formlar ve bir dosya secici tasiyor.
 *
 * Olculen dort sey:
 *   TASMA           390 pikselde yatay kaydirma (telefonda ENGELDIR)
 *   DOKUNMA HEDEFI  24x24'ten kucuk tiklanabilir oge (WCAG 2.2 AA asgari)
 *   ETIKET          adsiz dugme/alan (ekran okuyucuda «dugme» diye anilir)
 *   KONTRAST        metin/zemin orani, iki temada da (WCAG AA 4.5)
 *
 *   node tools/yuz.js
 *
 * Cikis kodu: 0 temiz, 1 sorun, 2 arac eksik.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEPO = path.resolve(ROOT, '..');
const PORT = 4296;
const TOKEN = 'yuz-denetimi-icin-gecici-jeton';
/* Ana gorunumler ve Ayarlar'in alt sekmeleri AYRI gezilir: teknik
 * yonetim artik gunluk ekranin icinde degil, kendi sayfasinda. */
const GORUNUMLER = ['bugun', 'sohbet', 'sistemler'];
const AYAR_SEKMELERI = ['yapayzeka', 'butce', 'kanallar', 'cihazlar',
  'esikler', 'sunucu'];
const MIN_TAP = 24;
const MIN_KONTRAST = 4.5;

let chromium;
try{ ({ chromium } = require(path.join(DEPO, 'ESP', 'node_modules', 'playwright'))); }
catch(e){
  console.error('Playwright bulunamadi (ESP/node_modules).');
  process.exit(2);
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function bekle(url, kere){
  for(let i = 0; i < (kere || 60); i++){
    try{ await fetch(url); return true; }catch(e){ await wait(200); }
  }
  return false;
}

function api(yol, opt){
  return fetch('http://127.0.0.1:' + PORT + yol, Object.assign({
    headers:{ 'Authorization':'Bearer ' + TOKEN, 'Content-Type':'application/json' },
  }, opt || {}));
}

/* Denetim VERIYLE yapilir: bos bir sayfa her denetimden gecer ve hicbir
   sey kanitlamaz. */
async function tohum(){
  const bugun = new Date();
  for(let i = 20; i >= 0; i--){
    const t = new Date(bugun.getTime() - i * 86400000).toISOString().slice(0, 10);
    await api('/api/sync/spi', { method:'POST', body:JSON.stringify({
      date:t, metrics:{ sleep_hours:{ value:4 + (i % 4), cert:'measured' },
        recovery:{ value:40 + (i % 30), cert:'computed' } } }) });
    await api('/api/sync/ays', { method:'POST', body:JSON.stringify({
      date:t, metrics:{ questions:{ value:40 + (i % 60), cert:'measured' },
        study_minutes:{ value:60 + (i % 90), cert:'measured' } } }) });
  }
  await api('/api/briefing?date=' + bugun.toISOString().slice(0, 10));
}

/* Kontrast: WCAG bagil parlaklik. Ayristirmak yerine tarayicinin cozdugu
   rgb() degerleri okunur — «renk temasi degisince ne oluyor» sorusunun
   cevabi ancak boyle alinir. */
const OLC = `(() => {
  const luminans = (r, g, b) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const oku = s => (s || '').match(/\\d+(\\.\\d+)?/g) || [];
  const zemin = el => {
    let p = el;
    while(p && p !== document.documentElement){
      const c = oku(getComputedStyle(p).backgroundColor);
      const a = c.length > 3 ? Number(c[3]) : 1;
      if(c.length >= 3 && a > 0.1) return c.slice(0, 3).map(Number);
      p = p.parentElement;
    }
    const c = oku(getComputedStyle(document.body).backgroundColor);
    return c.length >= 3 ? c.slice(0, 3).map(Number) : [255, 255, 255];
  };
  const oran = (a, b) => {
    const la = luminans(a[0], a[1], a[2]), lb = luminans(b[0], b[1], b[2]);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  const sonuc = { tasma:0, sucluler:[], kucuk:[], etiketsiz:[], kontrast:[] };
  sonuc.tasma = document.documentElement.scrollWidth - window.innerWidth;
  if(sonuc.tasma > 1){
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if(r.right > window.innerWidth + 1 && sonuc.sucluler.length < 4){
        let p = el, kasitli = false;
        while(p && p !== document.body){
          const ox = getComputedStyle(p).overflowX;
          if(ox === 'auto' || ox === 'scroll'){ kasitli = true; break; }
          p = p.parentElement;
        }
        if(!kasitli) sonuc.sucluler.push(el.tagName.toLowerCase()
          + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
      }
    });
  }

  document.querySelectorAll('button, a[href], input, select, [role="button"]')
    .forEach(el => {
      const r = el.getBoundingClientRect();
      if(r.width === 0 && r.height === 0) return;
      if(r.width < ${MIN_TAP} || r.height < ${MIN_TAP}){
        const ad = (el.id || el.textContent || el.tagName).trim().slice(0, 24);
        if(sonuc.kucuk.length < 6) sonuc.kucuk.push(ad + ' '
          + Math.round(r.width) + '×' + Math.round(r.height));
      }
      const etiket = (el.getAttribute('aria-label') || el.textContent || '').trim()
        || (el.labels && el.labels.length ? 'label' : '')
        || el.getAttribute('placeholder') || '';
      if(!etiket && sonuc.etiketsiz.length < 6){
        sonuc.etiketsiz.push((el.id || el.tagName).toString());
      }
    });

  const gorulen = new Set();
  document.querySelectorAll('p, td, th, h1, h2, .tag, .muted, .line, button')
    .forEach(el => {
      const metin = (el.textContent || '').trim();
      if(!metin || el.children.length > 2) return;
      const st = getComputedStyle(el);
      const renk = oku(st.color).slice(0, 3).map(Number);
      if(renk.length < 3) return;
      const o = oran(renk, zemin(el));
      const ad = el.tagName.toLowerCase() + '.' + (String(el.className).split(' ')[0] || '-');
      if(gorulen.has(ad)) return;
      gorulen.add(ad);
      if(o < ${MIN_KONTRAST} && sonuc.kontrast.length < 8){
        sonuc.kontrast.push(ad + ' ' + o.toFixed(2));
      }
    });
  return sonuc;
})()`;

async function main(){
  const hatalar = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hkm-yuz-'));
  const cfgYol = path.join(ROOT, 'config.json');
  const vardi = fs.existsSync(cfgYol);
  const yedek = vardi ? fs.readFileSync(cfgYol, 'utf8') : null;
  fs.writeFileSync(cfgYol, JSON.stringify({ host:'127.0.0.1', port:PORT,
    local_token:TOKEN, db_path:path.join(tmp, 'hkm.db') }, null, 2));

  const daemon = spawn('python3', [path.join(ROOT, 'daemon.py')],
    { cwd:ROOT, stdio:'ignore' });
  let browser;
  const kapat = () => {
    try{ daemon.kill(); }catch(e){}
    if(vardi) fs.writeFileSync(cfgYol, yedek); else { try{ fs.unlinkSync(cfgYol); }catch(e){} }
    try{ fs.rmSync(tmp, { recursive:true, force:true }); }catch(e){}
  };

  let bakilan = 0;
  try{
    if(!await bekle('http://127.0.0.1:' + PORT + '/api/health')){
      console.error('HKM ayaga kalkmadi.'); kapat(); process.exit(1);
    }
    await tohum();
    browser = await chromium.launch(process.env.CHROMIUM_PATH
      ? { executablePath:process.env.CHROMIUM_PATH } : {});

    for(const [ad, genislik, yukseklik] of [['telefon', 390, 780],
                                            ['masaüstü', 1280, 900]]){
      for(const tema of ['light', 'dark']){
        const page = await browser.newPage({
          viewport:{ width:genislik, height:yukseklik },
          colorScheme:tema });
        const konsol = [];
        page.on('pageerror', e => konsol.push(String(e.message)));
        await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil:'load' });
        await page.waitForSelector('#giris');
        await page.fill('#token', TOKEN);
        await page.click('#gir');
        await wait(1500);
        const duraklar = GORUNUMLER.map(g => ({ ad:g, git:async () => {
          await page.click('#gez a[data-yol="' + g + '"]');
        }}));
        for(const a of AYAR_SEKMELERI){
          duraklar.push({ ad:'ayarlar/' + a, git:async () => {
            await page.click('#ayar-bag');
            await wait(250);
            await page.click('[data-ayar="' + a + '"]');
          }});
        }
        for(const durak of duraklar){
          await durak.git();
          await wait(350);
          bakilan++;
          const r = await page.evaluate(OLC);
          const yer = ad + '/' + tema + '/' + durak.ad;
          if(genislik === 390 && r.tasma > 1){
            hatalar.push(yer + ': yatay taşma ' + r.tasma + 'px'
              + (r.sucluler.length ? ' — ' + r.sucluler.join(', ') : ''));
          }
          r.kucuk.forEach(k => hatalar.push(yer + ': küçük dokunma hedefi — ' + k));
          r.etiketsiz.forEach(k => hatalar.push(yer + ': etiketsiz öge — ' + k));
          r.kontrast.forEach(k => hatalar.push(yer + ': düşük kontrast — ' + k));
        }
        if(konsol.length) hatalar.push(ad + '/' + tema + ': sayfa hatası — ' + konsol[0]);
        await page.close();
      }
    }
  }catch(err){
    hatalar.push('kosum hatasi: ' + (err && err.message ? err.message : err));
  }finally{
    if(browser) await browser.close().catch(() => {});
    kapat();
  }

  const tekil = Array.from(new Set(hatalar));
  if(tekil.length){
    console.log('\n' + tekil.length + ' sorun:');
    tekil.slice(0, 25).forEach(h => console.log('  ✕ ' + h));
    if(tekil.length > 25) console.log('  … ve ' + (tekil.length - 25) + ' tane daha');
    process.exit(1);
  }
  console.log('\nHKM yüzü temiz — ' + bakilan + ' görünümde taşma yok, bütün '
    + 'hedefler ' + MIN_TAP + 'px ve üstü, etiketler yerinde, kontrast AA.');
  process.exit(0);
}

main();
