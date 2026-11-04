#!/usr/bin/env node
/* PARCA KANITI — Lego'ya gecis gorunumu ve isleyisi bozmasin, parca gercekten cikabilsin.

     node tools/parca_kanit.js --yaz taban.json              uc modulun her ekranini kaydeder
     node tools/parca_kanit.js --karsilastir taban.json      kayitla ayni mi (cikis 1: fark var)
     node tools/parca_kanit.js --cikar minik,ses             parca yokken uygulama aciliyor mu
     node tools/parca_kanit.js --durum                       kac ekran, blok, yazi, bilgi parcaya gecti
     --modul AYS   yalniz o modul

   Saat ve rastgelelik sabitlenir, ekranlar ayni ornek veriyle (envanter DOLDUR) bos ve dolu
   cizilir. Karsilastirma boslugu yok sayar: kaynak girintisi degisebilir, gorunum degismez. */
const fs = require('fs'), path = require('path');
const KOK = path.resolve(__dirname, '..');
/* Worktree'de node_modules yok: asil depodakini kullan. */
const anaKok = path.resolve(KOK, require('child_process').execSync('git rev-parse --git-common-dir', { cwd:KOK, encoding:'utf8' }).trim(), '..');
const { chromium } = require(path.join(anaKok, 'AYS', 'node_modules', 'playwright'));
const { DOLDUR_KAYNAK } = require('./envanter.js');
const NS = { AYS:'R', SPI:'SP', ESP:'ESP' };

function arg(ad){ const i = process.argv.indexOf(ad); return i < 0 ? null : (process.argv[i + 1] || ''); }
const tekil = arg('--modul');
const MODULLER = tekil ? [tekil] : Object.keys(NS);
const sade = s => String(s == null ? '' : s).replace(/\s+/g, ' ').replace(/> </g, '><')
  /* sayfa boyu sayaclar: cizim sirasina bagli kimlik, gorunum degil */
  .replace(/sayi-k-\d+/g, 'sayi-k').replace(/data-grafik="g\d+"/g, 'data-grafik="g"').trim();

const SAAT = `(()=>{ const T = new Date('2026-11-04T10:30:00').getTime(), D = Date;
  let n = 0; Math.random = () => { n = (n * 9301 + 49297) % 233280; return n / 233280; };
  window.Date = class extends D { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } };
})();`;

async function ac(tarayici, modul, engel){
  const c = await tarayici.newContext({ viewport:{ width:1280, height:800 } });
  await c.addInitScript(SAAT);
  const p = await c.newPage(), hatalar = [];
  p.on('pageerror', e => hatalar.push(String(e.message).slice(0, 160)));
  if(engel) await p.route(u => engel.some(a => new RegExp('/' + a + '(-[a-z]+)?\\.(js|css)$').test(u.pathname)), r => r.abort());
  await p.goto('file:///' + path.join(KOK, modul, 'src', 'index.html').replace(/\\/g, '/'));
  const ns = NS[modul];
  await p.waitForFunction(n => window[n] && window[n].Screens && window[n].S && window[n].S.profile !== undefined, ns, { timeout:25000 });
  await p.waitForTimeout(500);
  return { c, p, ns, hatalar };
}

const CEK = async (p, ns) => p.evaluate(async n => {
  const out = {};
  const S = window[n].Screens;
  for(const id of Object.keys(S).sort()){
    const s = S[id];
    if(!s || typeof s.render !== 'function'){ continue; }
    const k = { };
    try{
      k.html = await Promise.race([Promise.resolve().then(() => s.render()), new Promise((_, r) => setTimeout(() => r(new Error('sure')), 8000))]);
      k.html = String(k.html);
    }catch(e){ k.hata = String(e && e.message || e).slice(0, 120); }
    try{ k.title = typeof s.title === 'function' ? s.title() : s.title; }catch(e){ k.title = 'hata'; }
    try{ k.alt = typeof s.subtitle === 'function' ? s.subtitle() : s.subtitle; }catch(e){ k.alt = 'hata'; }
    try{ k.eylem = String(typeof s.actions === 'function' ? s.actions() : s.actions || ''); }catch(e){ k.eylem = 'hata'; }
    k.handle = Object.keys(s.handle || {}).sort();
    k.change = Object.keys(s.change || {}).sort();
    k.kucuk = (s.kucukVarsayilan || []).slice().sort();
    out[id] = k;
  }
  return out;
}, ns);

async function modulKayit(t, modul){
  const { c, p, ns, hatalar } = await ac(t, modul);
  const bos = await CEK(p, ns);
  await p.evaluate(DOLDUR_KAYNAK[modul]);
  const dolu = await CEK(p, ns);
  const rota = await p.evaluate(() => Array.from(document.querySelectorAll('[data-route]')).map(e => e.getAttribute('data-route')));
  await c.close();
  return { bos, dolu, rota, hatalar };
}

function fark(a, b){
  const out = [];
  if(JSON.stringify(a.rota) !== JSON.stringify(b.rota)) out.push('menu rotalari degisti');
  ['bos', 'dolu'].forEach(d => {
    const ad = new Set(Object.keys(a[d]).concat(Object.keys(b[d])));
    ad.forEach(id => {
      const x = a[d][id], y = b[d][id];
      if(!x || !y){ out.push(d + ' ' + id + ': ekran ' + (x ? 'kayboldu' : 'yeni')); return; }
      Object.keys(x).forEach(f => {
        const v1 = f === 'html' ? sade(x[f]) : JSON.stringify(x[f]), v2 = f === 'html' ? sade(y[f]) : JSON.stringify(y[f]);
        if(v1 === v2) return;
        let i = 0; while(i < v1.length && v1[i] === v2[i]) i++;
        out.push(d + ' ' + id + '.' + f + ' @' + i + '\n   once : ' + v1.slice(Math.max(0, i - 60), i + 80) + '\n   sonra: ' + v2.slice(Math.max(0, i - 60), i + 80));
      });
    });
  });
  return out;
}

function durum(){
  let ekran = 0, parcali = 0, sayfa = 0, blok = 0, yazi = 0, bilgi = 0;
  const kalan = {};
  MODULLER.forEach(m => {
    const k = path.join(KOK, m, 'src', 'js', 'screens');
    fs.readdirSync(k).filter(f => f.endsWith('.js')).forEach(f => {
      const s = fs.readFileSync(path.join(k, f), 'utf8');
      if(!/\.Screens\.\w+ *=/.test(s)) return;   // yardimci dosya (fotoui, hatirlatui)
      ekran++;
      sayfa += (s.match(/\.sayfa\(\{/g) || []).length;
      const b = (s.match(/\b(?:P|PARCA)\.blok\(/g) || []).length;
      blok += b; bilgi += (s.match(/\bP\.bilgi\(/g) || []).length;
      const yt = s.match(/(?:P|PARCA)\.yazilar\(\{[\s\S]*?\n\s*\}\);/g) || [];
      yt.forEach(t => { yazi += (t.match(/'[\w.-]+':/g) || []).length; });
      if(b) parcali++; else (kalan[m] = kalan[m] || []).push(f.replace('.js', ''));
    });
  });
  console.log('Ekran dosyasi ' + ekran + ' · bloklara bolunmus ' + parcali + ' · sayfa kaydi ' + sayfa + ' · blok ' + blok + ' · yazi ' + yazi + ' · bilgi ' + bilgi);
  Object.keys(kalan).forEach(m => console.log('  ' + m + ' kalan (' + kalan[m].length + '): ' + kalan[m].join(' ')));
  return 0;
}

(async () => {
  if(process.argv.includes('--durum')) process.exit(durum());
  const t = await chromium.launch();
  let cikis = 0;
  if(arg('--yaz') || arg('--karsilastir')){
    const dosya = arg('--yaz') || arg('--karsilastir');
    const taban = arg('--karsilastir') ? JSON.parse(fs.readFileSync(dosya, 'utf8')) : {};
    for(const m of MODULLER){
      const k = await modulKayit(t, m);
      const say = Object.keys(k.dolu).length, hata = Object.values(k.dolu).filter(x => x.hata).length;
      if(arg('--yaz')){ taban[m] = k; console.log(m + ': ' + say + ' ekran kaydedildi (' + hata + ' hata veriyor), sayfa hatasi ' + k.hatalar.length); continue; }
      const f = fark(taban[m], k);
      if(f.length){ cikis = 1; console.log(m + ': ' + f.length + ' FARK'); f.slice(0, 40).forEach(x => console.log('  ' + x)); }
      else console.log(m + ': ' + say + ' ekran birebir ayni');
    }
    if(arg('--yaz')){
      const eski = fs.existsSync(dosya) && tekil ? JSON.parse(fs.readFileSync(dosya, 'utf8')) : {};
      fs.writeFileSync(dosya, JSON.stringify(Object.assign(eski, taban)));
    }
  } else if(arg('--cikar') != null){
    for(const ad of arg('--cikar').split(',')){
      for(const m of MODULLER){
        try{
          const { c, p, ns, hatalar } = await ac(t, m, [ad]);
          await p.evaluate(DOLDUR_KAYNAK[m]);
          const k = await CEK(p, ns);
          const bozuk = Object.keys(k).filter(i => k[i].hata);
          const site = await p.evaluate(() => !!document.querySelector('.site'));
          const ok = site && !hatalar.length;
          console.log((ok && !bozuk.length ? 'TEMIZ ' : 'BOZUK ') + ad + ' ' + m + (site ? '' : ' · kabuk acilmadi') + (hatalar.length ? ' · ' + hatalar.length + ' hata: ' + hatalar[0] : '') + (bozuk.length ? ' · ekran: ' + bozuk.slice(0, 5).join(',') : ''));
          if(!ok || bozuk.length) cikis = 1;
          await c.close();
        }catch(e){ cikis = 1; console.log('BOZUK ' + ad + ' ' + m + ' · acilmadi: ' + String(e.message).slice(0, 100)); }
      }
    }
  } else { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); }
  await t.close();
  process.exit(cikis);
})().catch(e => { console.error(e); process.exit(2); });
