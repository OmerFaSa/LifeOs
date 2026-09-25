#!/usr/bin/env node
/* Tarayıcı istemeyen denetimler Playwright'sız ortamda da koşar.
 *
 * CI'daki «Tek kaynaklar» işi npm ci yapmaz (hızlı iş); orada
 * `node tools/sadelik.test.js` ve `node tools/sadelik.js --onay` yalnız
 * KAYNAK tarar. eef6d60 ve a2d29e4'te ikisi de «Playwright bulunamadi»
 * diyerek 2 ile çıktı: envanter.js Playwright'ı dosya yüklenirken
 * istiyordu ve sadelik.js envanteri en üstte yüklüyordu.
 *
 * Bu test Playwright'ı modül çözümlemesinde engelleyerek (yerelde kurulu
 * olsa bile) iki komutu koşturur; ikisi de 2 ile çıkmamalı ve
 * «Playwright bulunamadi» dememelidir.
 *
 *   node tools/playwrightsiz.test.js    (çıkış 0 temiz, 1 kırmızı)
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const KOK = path.resolve(__dirname, '..');
const engel = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pwsiz-')), 'engel.js');
fs.writeFileSync(engel,
  "const M = require('module'); const c = M._resolveFilename;\n" +
  "M._resolveFilename = function(r){ if(/(^|[\\\\/])playwright([\\\\/]|$)/.test(String(r))){\n" +
  "  const e = new Error(\"Cannot find module '\" + r + \"'\"); e.code = 'MODULE_NOT_FOUND'; throw e; }\n" +
  "  return c.apply(this, arguments); };\n");

const DURUMLAR = [
  ['sadelik sayaç testi', ['tools/sadelik.test.js']],
  ['sadelik --onay (kaynak taraması)', ['tools/sadelik.js', '--onay']],
];

let kirmizi = 0;
for(const [ad, arg] of DURUMLAR){
  const r = spawnSync(process.execPath, ['--require', engel].concat(arg),
    { cwd:KOK, encoding:'utf8', env:Object.assign({}, process.env, { NODE_PATH:'' }) });
  const cikti = (r.stdout || '') + (r.stderr || '');
  const ok = r.status !== 2 && !/Playwright bulunamadi/.test(cikti);
  if(!ok) kirmizi++;
  console.log((ok ? '  ✓ ' : '  ✕ ') + ad + (ok ? '' : ' — çıkış ' + r.status + ': ' + cikti.trim().split('\n').pop()));
}
fs.rmSync(path.dirname(engel), { recursive:true, force:true });
console.log(kirmizi ? '\n' + kirmizi + ' komut Playwright istedi.' : '\nTarayıcısız denetimler Playwright istemiyor.');
process.exit(kirmizi ? 1 : 0);
