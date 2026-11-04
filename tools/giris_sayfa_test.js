#!/usr/bin/env node
/* GIRIS VE GUN SAYFASI — modul disinda ortak dosya yukleyen iki sayfa gercekten aciliyor mu?

     node tools/giris_sayfa_test.js

   Modul denetimleri bu sayfalari acmaz. Ortak dosya parca motoru ister (brand/ortak/parca.js);
   motorsuz yuklenirse hesap.js tek satirda duser ve giris ekrani calismaz: Lego 7'de oldu.
   Cikis: 0 temiz, 1 sorun, 2 kosulamadi (port dolu). */
const path = require('path'), { spawn } = require('child_process');
const KOK = path.resolve(__dirname, '..');
const anaKok = path.resolve(KOK, require('child_process').execSync('git rev-parse --git-common-dir', { cwd:KOK, encoding:'utf8' }).trim(), '..');
const { chromium } = require(path.join(anaKok, 'ESP', 'node_modules', 'playwright'));
const PORT = 4179;

const PY = `
import sys, os
sys.path.insert(0, os.path.join(r"${KOK.replace(/\\/g, '/')}", "sistem"))
os.chdir(r"${KOK.replace(/\\/g, '/')}")
import sunucu
sunucu.KuyrukluSunucu(("127.0.0.1", ${PORT}), sunucu.Giris).serve_forever()
`;

function dolu(){
  return new Promise(r => {
    const s = require('net').connect({ host:'127.0.0.1', port:PORT });
    s.setTimeout(800, () => { s.destroy(); r(false); });
    s.once('connect', () => { s.destroy(); r(true); });
    s.once('error', () => r(false));
  });
}

(async () => {
  if(await dolu()){ console.error('Port dolu: ' + PORT); process.exit(2); }
  const sunucu = spawn('python3', ['-c', PY], { cwd:KOK, stdio:'ignore', env:Object.assign({}, process.env, { PYTHONUTF8:'1' }) });
  let kotu = 0;
  const t = await chromium.launch();
  try{
    for(let i = 0; i < 50 && !await dolu(); i++) await new Promise(r => setTimeout(r, 200));
    for(const [ad, yol, kontrol] of [
      ['giris', '/', () => !!(window.LIFEOS && window.LIFEOS.HESAP && window.LIFEOS.PARCA)],
      ['gun', '/gun/', () => !!(document.querySelector('.site') || document.querySelector('#app').children.length)],
    ]){
      const p = await t.newPage(), hata = [], yok = [];
      p.on('pageerror', e => hata.push(e.message));
      p.on('response', r => { if(r.status() === 404 && /\.(js|css)(\?|$)/.test(r.url())) yok.push(r.url()); });
      await p.goto('http://127.0.0.1:' + PORT + yol, { waitUntil:'load' });
      await p.waitForTimeout(1000);
      const ok = await p.evaluate(kontrol);
      const durum = ok && !hata.length && !yok.length;
      console.log((durum ? '  ✓ ' : '  ✕ ') + ad + (hata.length ? ' · ' + hata[0] : '') + (yok.length ? ' · yok: ' + yok[0] : '') + (ok ? '' : ' · sayfa kurulmadi'));
      if(!durum) kotu++;
      await p.close();
    }
  } finally {
    await t.close();
    sunucu.kill();
  }
  console.log(kotu ? kotu + ' sorun' : 'Giris ve Gun sayfalari temiz');
  process.exit(kotu ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
