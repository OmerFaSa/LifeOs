#!/usr/bin/env node
/* TEMBEL PARCA KANITI — dist, tembel veriyle kaynak surumle ayni seyi mi goruyor?

     node tools/parca_tembel_test.js     (once uc build.py)

   Modul basina: dist acilinca veri calismamis olmali; ad alaninda, LIFEOS'ta ve
   window'da kaynak surumun gordugu her ad bulunmali; ilk erisimde veri birebir ayni gelmeli. */
const path = require('path');
const KOK = path.resolve(__dirname, '..');
const anaKok = path.resolve(KOK, require('child_process').execSync('git rev-parse --git-common-dir', { cwd:KOK, encoding:'utf8' }).trim(), '..');
const { chromium } = require(path.join(anaKok, 'AYS', 'node_modules', 'playwright'));
const M = { AYS:['R', 'rota.html'], SPI:['SP', 'spi.html'], ESP:['ESP', 'esp.html'] };

async function ac(t, yol, ns){
  const c = await t.newContext();
  const p = await c.newPage(), hata = [];
  p.on('pageerror', e => hata.push(e.message));
  await p.goto('file:///' + yol.replace(/\\/g, '/'));
  await p.waitForFunction(n => window[n] && window[n].Screens && window[n].S && window[n].S.profile !== undefined, ns, { timeout:25000 });
  await p.waitForTimeout(800);
  return { c, p, hata };
}
const ADLAR = n => ({ ns:Object.getOwnPropertyNames(window[n]).sort(), lifeos:Object.getOwnPropertyNames(window.LIFEOS).sort(), yuklu:!!(window.__PARCA_TEMBEL && window.__PARCA_TEMBEL.yuklu), tembel:(window.__PARCA_TEMBEL || {}).adlar || [] });
const IZ = ([n, adlar]) => adlar.map(a => a + ':' + JSON.stringify(window[n][a], (k, v) => typeof v === 'function' ? 'fn' : v).length);

(async () => {
  const t = await chromium.launch();
  let kotu = 0;
  const hata = s => { kotu++; console.log('  ✕ ' + s); };
  for(const m of Object.keys(M)){
    const [ns, ad] = M[m];
    const dist = await ac(t, path.join(KOK, m, 'dist', ad), ns);
    const d = await dist.p.evaluate(ADLAR, ns);
    const kaynak = await ac(t, path.join(KOK, m, 'src', 'index.html'), ns);
    const k = await kaynak.p.evaluate(ADLAR, ns);
    console.log(m + ': ' + d.tembel.length + ' tembel ad, acilista ' + (d.yuklu ? 'CALISTI' : 'calismadi'));
    if(!d.tembel.length) hata('tembel ad yok');
    if(d.yuklu) hata('veri acilista calisti: kazanc yok');
    ['ns', 'lifeos'].forEach(a => {
      const yok = k[a].filter(x => !d[a].includes(x));
      if(yok.length) hata(a + ' dist te eksik: ' + yok.slice(0, 8).join(','));
    });
    const iz1 = await dist.p.evaluate(IZ, [ns, d.tembel]), iz2 = await kaynak.p.evaluate(IZ, [ns, d.tembel]);
    if(JSON.stringify(iz1) !== JSON.stringify(iz2)) hata('veri farkli: ' + iz1.filter((x, i) => x !== iz2[i]).slice(0, 4).join(','));
    if(!await dist.p.evaluate(() => window.__PARCA_TEMBEL.yuklu)) hata('erisim veriyi yuklemedi');
    if(dist.hata.length) hata('dist sayfa hatasi: ' + dist.hata[0]);
    await dist.c.close(); await kaynak.c.close();
  }
  await t.close();
  console.log(kotu ? kotu + ' sorun' : 'Tembel parca: uc modulde temiz');
  process.exit(kotu ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
