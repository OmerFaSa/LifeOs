#!/usr/bin/env node
/* Tek komutla modül ölçümü (KING-4 §O).
 *
 * Modülün src/ klasörünü http.server ile açar, Playwright ile ölçer:
 *   - açılış (çizim süresi, betik, stil, yerleşim ms, medyan)
 *   - kapsam (CSS toplam KB ve kullanılan %, JS adlı işlev sayısı ve koşan %)
 *   - depo (Storage getItem/setItem ve JSON.parse sayaçları / rota, en çok okunanlar)
 *   - rota (ısınma sonrası DevTools tracing ile stil ve yerleşim hesapları / rota, en yavaş rotalar)
 *
 * Kullanım:
 *   node tools/olcum_modul.js <AYS|SPI|ESP> [--port N] [--json yol] [--tekrar 3]
 *
 * Çıkış kodu: 0 başarılı, 1 parametre/çalışma hatası, 2 port dolu veya Playwright yok.
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const KOK = path.resolve(__dirname, '..');

// Parametre ayrıştırma
const argv = process.argv.slice(2);
let mod = null;
let port = 4389;
let jsonPath = null;
let tekrar = 3;

for(let i = 0; i < argv.length; i++){
  const a = argv[i];
  if(a === '--port' && i + 1 < argv.length){
    port = parseInt(argv[++i], 10);
  }else if(a === '--json' && i + 1 < argv.length){
    jsonPath = argv[++i];
  }else if(a === '--tekrar' && i + 1 < argv.length){
    tekrar = parseInt(argv[++i], 10);
  }else if(!a.startsWith('--')){
    const u = a.toUpperCase();
    if(['AYS', 'SPI', 'ESP'].includes(u)){
      mod = u;
    }
  }
}

if(!mod){
  console.error('Hata: Geçerli bir modül belirtilmeli (AYS, SPI, ESP).');
  console.error('Kullanım: node tools/olcum_modul.js <AYS|SPI|ESP> [--port N] [--json yol] [--tekrar 3]');
  process.exit(1);
}

const NS = { AYS:'R', SPI:'SP', ESP:'ESP' }[mod];

// Port muhafızı (tools/portmuhafiz deseni)
function portDolu(p){
  const dene = host => new Promise(r => {
    const s = net.connect({ host, port:p });
    s.setTimeout(1000, () => { s.destroy(); r(false); });
    s.once('connect', () => { s.destroy(); r(true); });
    s.once('error', () => r(false));
  });
  return Promise.all([dene('127.0.0.1'), dene('::1')]).then(x => x.some(Boolean));
}

async function portMuhafizi(p){
  if(await portDolu(p)){
    console.error('Port dolu: ' + p + ' — başka bir koşu (belki başka bir worktree\'de) ya da açık bir sunucu kullanıyor.\n'
      + 'Bu koşu kendi sunucusunu açamaz, ötekini ölçerdi; o bitince yeniden koş ya da boş bir port ver: '
      + 'node tools/olcum_modul.js ' + mod + ' --port <port>');
    process.exit(2);
  }
}

function sunucuBekle(url, maxTries = 60){
  return new Promise((resolve, reject) => {
    const dene = n => {
      fetch(url)
        .then(r => r.arrayBuffer())
        .then(() => resolve())
        .catch(() => {
          if(n <= 0) return reject(new Error('Sunucu açılmadı: ' + url));
          setTimeout(() => dene(n - 1), 150);
        });
    };
    dene(maxTries);
  });
}

function median(arr){
  if(!arr.length) return 0;
  const s = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Playwright yükleme (modülün node_modules/playwright'ı)
let chromium;
try{
  ({ chromium } = require(path.join(KOK, mod, 'node_modules', 'playwright')));
}catch(e1){
  try{
    ({ chromium } = require(path.join(KOK, 'ESP', 'node_modules', 'playwright')));
  }catch(e2){
    try{
      ({ chromium } = require('playwright'));
    }catch(e3){
      console.error('Playwright bulunamadı.');
      process.exit(2);
    }
  }
}

async function rotalariAl(page, ns){
  return await page.evaluate(n => {
    const N = window[n];
    if(!N || !N.App) return [];
    const out = [];
    const ekle = r => {
      if(r && typeof r === 'string' && !out.includes(r)) out.push(r);
    };

    if(n === 'R'){
      // AYS R.App.NAV öğelerinin id'leri
      const nav = N.App.NAV || [];
      for(const g of nav){
        if(g.items){
          for(const item of g.items) ekle(item.id);
        }else if(g.id){
          ekle(g.id);
        }
      }
    }else if(n === 'SP'){
      // SPİ SP.App.SECTIONS[].views[].route
      const sec = N.App.SECTIONS || [];
      for(const s of sec){
        for(const v of (s.views || [])) ekle(v.route);
      }
    }else if(n === 'ESP'){
      // ESP ESP.App.SECTIONS()[].views[].route
      const sec = typeof N.App.SECTIONS === 'function' ? N.App.SECTIONS() : (N.App.SECTIONS || []);
      for(const s of sec){
        for(const v of (s.views || [])) ekle(v.route);
      }
    }
    return out;
  }, ns);
}

async function rotaGec(page, ns, r){
  return await page.evaluate(async ({ ns, r }) => {
    try{
      window[ns].App.go(r);
    }catch(e){}
    await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
  }, { ns, r });
}

(async () => {
  await portMuhafizi(port);

  const pyCmd = process.platform === 'win32' ? 'python' : 'python3';
  const srcDir = path.join(KOK, mod, 'src');
  const srvArgs = ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '-d', srcDir];
  const srv = spawn(pyCmd, srvArgs, { cwd:KOK, stdio:'ignore' });

  let browser;
  try{
    const baseUrl = 'http://127.0.0.1:' + port;
    await sunucuBekle(baseUrl + '/index.html');

    browser = await chromium.launch(Object.assign({
      headless:true
    }, process.env.CHROMIUM_PATH ? { executablePath:process.env.CHROMIUM_PATH } : {}));

    // 1. AÇILIŞ ÖLÇÜMÜ (acilis)
    const acilisTekrar = Math.max(3, tekrar);
    const cizimArr = [];
    const betikArr = [];
    const stilArr = [];
    const yerlesimArr = [];

    for(let i = 0; i < acilisTekrar; i++){
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const client = await ctx.newCDPSession(page);
      await client.send('Performance.enable');

      const t0 = performance.now();
      await page.goto(baseUrl + '/index.html', { waitUntil:'load' });
      await page.waitForSelector('.site', { state:'visible' });
      const cizimMs = performance.now() - t0;
      cizimArr.push(cizimMs);

      const { metrics } = await client.send('Performance.getMetrics');
      const getM = name => {
        const m = metrics.find(x => x.name === name);
        return m ? m.value : 0;
      };

      // ScriptDuration, RecalcStyleDuration, LayoutDuration (saniye -> ms)
      betikArr.push(getM('ScriptDuration') * 1000);
      stilArr.push(getM('RecalcStyleDuration') * 1000);
      yerlesimArr.push(getM('LayoutDuration') * 1000);

      await page.close();
      await ctx.close();
    }

    const acilis = {
      cizimMs: Math.round(median(cizimArr) * 10) / 10,
      betikMs: Math.round(median(betikArr) * 10) / 10,
      stilMs: Math.round(median(stilArr) * 10) / 10,
      yerlesimMs: Math.round(median(yerlesimArr) * 10) / 10,
      tekrar: acilisTekrar
    };

    // 2. KAPSAM ÖLÇÜMÜ (kapsam)
    const ctxKapsam = await browser.newContext();
    const pageKapsam = await ctxKapsam.newPage();

    await pageKapsam.coverage.startJSCoverage({ resetOnNavigation:false });
    await pageKapsam.coverage.startCSSCoverage({ resetOnNavigation:false });

    await pageKapsam.goto(baseUrl + '/index.html', { waitUntil:'load' });
    await pageKapsam.waitForSelector('.site', { state:'visible' });

    const rotalar = await rotalariAl(pageKapsam, NS);
    for(const r of rotalar){
      await rotaGec(pageKapsam, NS, r);
    }

    const jsCoverage = await pageKapsam.coverage.stopJSCoverage();
    const cssCoverage = await pageKapsam.coverage.stopCSSCoverage();

    await pageKapsam.close();
    await ctxKapsam.close();

    let cssBytes = 0;
    let cssUsedBytes = 0;
    for(const entry of cssCoverage){
      const len = entry.text ? entry.text.length : 0;
      cssBytes += len;
      let used = 0;
      for(const range of (entry.ranges || [])){
        used += (range.end - range.start);
      }
      cssUsedBytes += used;
    }

    let jsIslev = 0;
    let jsKosan = 0;
    for(const entry of jsCoverage){
      for(const fn of (entry.functions || [])){
        if(!fn.functionName) continue;
        jsIslev++;
        const count = (fn.ranges && fn.ranges[0] && fn.ranges[0].count) || 0;
        if(count > 0) jsKosan++;
      }
    }

    const kapsam = {
      cssKB: Math.round((cssBytes / 1024) * 10) / 10,
      cssKullanilanYuzde: cssBytes > 0 ? Math.round((cssUsedBytes / cssBytes) * 1000) / 10 : 0,
      jsIslev: jsIslev,
      jsKosanYuzde: jsIslev > 0 ? Math.round((jsKosan / jsIslev) * 1000) / 10 : 0
    };

    // 3. DEPO VE 4. ROTA ÖLÇÜMÜ (depo & rota)
    const ctxDepo = await browser.newContext();
    await ctxDepo.addInitScript(() => {
      window.__depo = {
        okuma: 0,
        yazma: 0,
        parse: 0,
        okunanAnahtarlar: {}
      };
      const origGet = Storage.prototype.getItem;
      Storage.prototype.getItem = function(k){
        window.__depo.okuma++;
        const key = String(k);
        window.__depo.okunanAnahtarlar[key] = (window.__depo.okunanAnahtarlar[key] || 0) + 1;
        return origGet.apply(this, arguments);
      };
      const origSet = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v){
        window.__depo.yazma++;
        return origSet.apply(this, arguments);
      };
      const origParse = JSON.parse;
      JSON.parse = function(){
        window.__depo.parse++;
        return origParse.apply(this, arguments);
      };
    });

    const pageDepo = await ctxDepo.newPage();
    await pageDepo.goto(baseUrl + '/index.html', { waitUntil:'load' });
    await pageDepo.waitForSelector('.site', { state:'visible' });

    // 1. Tur: Isınma ve rota geçişleri sırasında depo ölçümü
    await pageDepo.evaluate(() => {
      window.__depo.okuma = 0;
      window.__depo.yazma = 0;
      window.__depo.parse = 0;
      window.__depo.okunanAnahtarlar = {};
    });

    for(const r of rotalar){
      await rotaGec(pageDepo, NS, r);
    }

    const depoHam = await pageDepo.evaluate(() => {
      return {
        okuma: window.__depo.okuma,
        yazma: window.__depo.yazma,
        parse: window.__depo.parse,
        okunanAnahtarlar: Object.entries(window.__depo.okunanAnahtarlar)
      };
    });

    const rotaSayi = rotalar.length || 1;
    const enCokOkunan = (depoHam.okunanAnahtarlar || [])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const depo = {
      rotaBasinaOkuma: Math.round((depoHam.okuma / rotaSayi) * 10) / 10,
      rotaBasinaYazma: Math.round((depoHam.yazma / rotaSayi) * 10) / 10,
      rotaBasinaAyristirma: Math.round((depoHam.parse / rotaSayi) * 10) / 10,
      enCokOkunan: enCokOkunan
    };

    // 2. Tur: browser.startTracing ('devtools.timeline') ile zamanlama ve olay ölçümü
    await browser.startTracing(pageDepo, { categories:['devtools.timeline'] });
    const sureler = [];

    for(const r of rotalar){
      const t0 = performance.now();
      await rotaGec(pageDepo, NS, r);
      const dt = performance.now() - t0;
      sureler.push([r, Math.round(dt * 10) / 10]);
    }

    const traceBuf = await browser.stopTracing();
    const traceObj = JSON.parse(traceBuf.toString('utf8'));
    const events = traceObj.traceEvents || (Array.isArray(traceObj) ? traceObj : []);

    let updateLayoutTreeSayisi = 0;
    let layoutSayisi = 0;
    for(const ev of events){
      if(ev.name === 'UpdateLayoutTree') updateLayoutTreeSayisi++;
      else if(ev.name === 'Layout') layoutSayisi++;
    }

    sureler.sort((a, b) => b[1] - a[1]);
    const enYavas = sureler.slice(0, 5);

    const rota = {
      sayi: rotalar.length,
      stilHesabi: Math.round((updateLayoutTreeSayisi / rotaSayi) * 100) / 100,
      yerlesim: Math.round((layoutSayisi / rotaSayi) * 100) / 100,
      enYavas: enYavas
    };

    await pageDepo.close();
    await ctxDepo.close();

    const cikti = {
      modul: mod,
      tarih: new Date().toISOString(),
      acilis,
      kapsam,
      depo,
      rota
    };

    if(jsonPath){
      const hedefYol = path.resolve(jsonPath);
      const dir = path.dirname(hedefYol);
      if(!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive:true });
      }
      fs.writeFileSync(hedefYol, JSON.stringify(cikti, null, 2), 'utf8');
    }

    // Kısa özet tablo
    console.log('');
    console.log('='.repeat(62));
    console.log(` LifeOS Modül Ölçümü: ${mod} (${cikti.tarih})`);
    console.log('='.repeat(62));
    console.log(` Açılış (${acilis.tekrar} tekrar medyan):`);
    console.log(`   İlk çizim:   ${acilis.cizimMs} ms`);
    console.log(`   Betik:       ${acilis.betikMs} ms`);
    console.log(`   Stil:        ${acilis.stilMs} ms`);
    console.log(`   Yerleşim:    ${acilis.yerlesimMs} ms`);
    console.log('');
    console.log(` Kapsam (açılış + ${rota.sayi} rota):`);
    console.log(`   CSS toplam:  ${kapsam.cssKB} KB (kullanılan: %${kapsam.cssKullanilanYuzde})`);
    console.log(`   JS işlev:    ${kapsam.jsIslev} adlı işlev (koşan: %${kapsam.jsKosanYuzde})`);
    console.log('');
    console.log(' Depolama (rota başına ortalama):');
    console.log(`   Okuma:       ${depo.rotaBasinaOkuma}`);
    console.log(`   Yazma:       ${depo.rotaBasinaYazma}`);
    console.log(`   Ayrıştırma:  ${depo.rotaBasinaAyristirma}`);
    console.log('   En çok okunan anahtarlar:');
    for(const [anahtar, sayi] of depo.enCokOkunan){
      console.log(`     - ${anahtar}: ${sayi}`);
    }
    console.log('');
    console.log(` Rotalar (${rota.sayi} rota):`);
    console.log(`   Stil hesabı: ${rota.stilHesabi} UpdateLayoutTree / rota`);
    console.log(`   Yerleşim:    ${rota.yerlesim} Layout / rota`);
    console.log('   En yavaş rotalar:');
    for(const [r, ms] of rota.enYavas){
      console.log(`     - ${r}: ${ms} ms`);
    }
    console.log('='.repeat(62));
    console.log('');

  }finally{
    if(browser) try{ await browser.close(); }catch(e){}
    srv.kill();
  }
})();
