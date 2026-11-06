#!/usr/bin/env node
/* Telefon ve tablet taramasi (2026-11-06, depo sahibi: «telefon tablet gibi olaylarda hatalarin hepsini bul»).
 *
 * layoutcheck masaustu tarayicisinda 390 ve 820 pikselde dik ekrani olcer. Bunun gormedikleri burada:
 * dokunmatik kip (hover yok), yatay ekran, King'in butun bolumleri, hesap ve defter katmanlari.
 * Buldugu hatalar: fareyle gorunen dugme dokunmatikte gorunmez, son King sekmesine ulasilamaz,
 * kesik sekme adi, ekran disina tasan dugme, 24 pikselden kucuk hedef, sayfa hatasi.
 *
 *   node tools/mobil_tara.js AYS|SPI|ESP [port]
 *
 * Tarayicida olculemeyen iPhone davranislari (giris kutusu yakinlasmasi, klavye) birim testinde ve
 * gercek cihazda denenir. Cikis: 0 temiz, 1 bulgu var, 2 kosulamadi.
 */
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

const KOK = path.resolve(__dirname, '..');
const MOD = process.argv[2];
const ROTA = {
  SPI:() => SP.App.SECTIONS.reduce((a, s) => a.concat(s.views.map(v => v.route)), []),
  AYS:() => R.App.NAV.reduce((a, s) => a.concat(s.items.map(v => v.id)), []),
  ESP:() => ESP.Nav.sections().reduce((a, s) => a.concat(s.views.map(v => v.route)), []),
}[MOD];
if(!ROTA){ console.error('Kullanim: node tools/mobil_tara.js AYS|SPI|ESP [port]'); process.exit(2); }
const GIT = { SPI:r => SP.App.go(r), AYS:r => R.App.go(r), ESP:r => ESP.App.go(r) }[MOD];
const PORT = Number(process.argv[3]) || { AYS:4396, SPI:4397, ESP:4398 }[MOD];

let chromium;
try{ ({ chromium } = require(path.join(KOK, MOD, 'node_modules', 'playwright'))); }
catch(e){ console.error('Playwright kurulu degil: ' + MOD + ' icinde npm i -D playwright'); process.exit(2); }

const BOYLAR = [
  { ad:'telefon dik', w:390, h:844 }, { ad:'telefon yatay', w:844, h:390 },
  { ad:'tablet dik', w:820, h:1180 }, { ad:'tablet yatay', w:1180, h:820 },
];
const bulgu = new Map();
function not(tur, boy, yer, ayrinti){
  const k = tur + ': ' + ayrinti;
  if(!bulgu.has(k)) bulgu.set(k, new Set());
  bulgu.get(k).add(boy + ' / ' + yer);
}

/* Sayfada calisir: gorunen her dokunulabilir ogeyi olcer. */
function olc(){
  const W = innerWidth, sonuc = [];
  const ad = e => (typeof e.className === 'string' && e.className.trim()
    ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : e.tagName.toLowerCase());
  const ata = (e, f) => { for(let x = e; x && x !== document.documentElement; x = x.parentElement) if(f(getComputedStyle(x), x)) return true; return false; };
  const tasma = document.documentElement.scrollWidth - W;
  if(tasma > 1) sonuc.push(['sayfa tasiyor', tasma + 'px']);
  document.querySelectorAll('button,a[href],[role=button],input:not([type=hidden]),select,textarea,summary').forEach(e => {
    const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    if(r.width < 1 || r.height < 1 || s.pointerEvents === 'none' || e.disabled) return;
    if(ata(e, c => c.display === 'none' || c.visibility === 'hidden')) return;
    if(ata(e, c => Number(c.opacity) < 0.05)){ sonuc.push(['gorunmez dugme', ad(e) + ' ' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30)]); return; }
    if((r.right > W + 2 || r.left < -2) && !ata(e.parentElement, c => /(auto|scroll|hidden|clip)/.test(c.overflowX))) sonuc.push(['ekran disinda', ad(e)]);
    /* Etiketin icindeki kutuda hedef etiketin tamami; .sr-only gorunen etiketle acilir. */
    if((r.width < 24 || r.height < 24) && !e.closest('.hint, label, .sr-only')) sonuc.push(['kucuk hedef', ad(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)]);
  });
  document.querySelectorAll('.king__ray-ad,.bolumcubugu__ad,.subtab').forEach(e => {
    const s = getComputedStyle(e);
    if(s.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1 && e.getBoundingClientRect().width > 1) sonuc.push(['kesik ad', e.textContent.trim().slice(0, 20)]);
  });
  const ray = document.querySelector('.king__ray'), son = ray && [...ray.querySelectorAll('.king__ray-is')].pop();
  if(son){
    const k = son.getBoundingClientRect(), d = ray.getBoundingClientRect(), c = getComputedStyle(ray);
    if((k.bottom > d.bottom + 1 || k.right > d.right + 1) && !/(auto|scroll)/.test(c.overflowY + c.overflowX)) sonuc.push(['sekmeye ulasilamiyor', son.textContent.trim().slice(0, 20)]);
  }
  return sonuc;
}

function portDolu(){
  return new Promise(r => {
    const s = net.connect({ host:'127.0.0.1', port:PORT });
    s.setTimeout(1000, () => { s.destroy(); r(false); });
    s.once('connect', () => { s.destroy(); r(true); });
    s.once('error', () => r(false));
  });
}

(async () => {
  if(await portDolu()){ console.error('Port dolu: ' + PORT + '; bos bir port ver.'); process.exit(2); }
  const srv = spawn('python3', [path.join(KOK, MOD, 'devserver.py'), String(PORT)], { cwd:path.join(KOK, MOD), stdio:'ignore' });
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath:process.env.CHROMIUM_PATH } : {});
  const adres = 'http://127.0.0.1:' + PORT + '/index.html';
  const hatalar = new Set();
  let ekran = 0;
  try{
    for(let n = 0; n < 80; n++){ try{ await (await fetch(adres)).arrayBuffer(); break; }catch(e){ await new Promise(r => setTimeout(r, 250)); } }
    for(const G of BOYLAR){
      const c = await b.newContext({ viewport:{ width:G.w, height:G.h }, isMobile:true, hasTouch:true, reducedMotion:'reduce' });
      const p = await c.newPage();
      p.on('pageerror', e => hatalar.add(String(e).slice(0, 160)));
      await p.goto(adres, { waitUntil:'load', timeout:60000 });
      await p.waitForFunction(() => window.LIFEOS && LIFEOS.KING_IC && document.querySelector('.site'), null, { timeout:60000 });
      await p.waitForTimeout(800);
      for(let i = 0; i < 3; i++){ const s = await p.$('[data-act="setup-skip"]'); if(!s) break; await s.evaluate(e => e.click()); await p.waitForTimeout(250); }
      /* Gecis bitsin diye: gorunmez sanilan ogeyi bir kez daha olc. */
      const yaz = async yer => {
        let l = await p.evaluate(olc);
        if(l.some(x => x[0] === 'gorunmez dugme')){ await p.waitForTimeout(900); l = await p.evaluate(olc); }
        l.forEach(x => not(x[0], G.ad, yer, x[1]));
      };
      for(const r of await p.evaluate(ROTA)){
        await p.evaluate(GIT, r).catch(() => {});
        await p.waitForTimeout(110);
        const sekmeler = await p.$$eval('.subtabs .subtab[data-tab], .bolumcubugu--sayfa .bolumcubugu__ad[data-tab]',
          l => l.filter(e => !e.classList.contains('is-on')).map(e => e.getAttribute('data-tab')).filter(Boolean)).catch(() => []);
        for(const t of [null].concat(sekmeler)){
          if(t){
            const d = await p.$(':is(.subtabs .subtab, .bolumcubugu--sayfa .bolumcubugu__ad)[data-tab="' + t + '"]');
            if(!d) continue;
            await d.evaluate(e => e.click());
            await p.waitForTimeout(70);
          }
          ekran++;
          await yaz(r + (t ? '/' + t : ''));
        }
      }
      await p.evaluate(() => LIFEOS.KING_IC.ac());
      await p.waitForTimeout(600);
      const say = await p.$$eval('.king__ray-is', l => l.length);
      for(let i = 0; i < say; i++){
        const ad = await p.evaluate(i => { const e = document.querySelectorAll('.king__ray-is')[i]; e.click(); return e.textContent.trim(); }, i);
        await p.waitForTimeout(700);
        ekran++;
        await yaz('King ' + ad);
      }
      await p.evaluate(() => LIFEOS.KING_IC.kapat());
      await p.waitForTimeout(500);
      await c.close();
    }
  }finally{
    await b.close();
    srv.kill();
  }
  hatalar.forEach(h => not('sayfa hatasi', '-', '-', h));
  if(!ekran){ console.error('Hic ekran gezilemedi.'); process.exit(2); }
  bulgu.forEach((yer, k) => console.log('  x ' + k + '  (' + yer.size + ' yer, or: ' + [...yer][0] + ')'));
  console.log(MOD + ': ' + ekran + ' olcum, ' + bulgu.size + ' bulgu.');
  process.exit(bulgu.size ? 1 : 0);
})().catch(e => { console.error(String(e).slice(0, 500)); process.exit(2); });
