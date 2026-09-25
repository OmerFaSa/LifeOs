#!/usr/bin/env node
/* Envanter HKM testlerini de sayar (ekip/T-DEVIR.md «H → T DEVRİ» 3).
 *
 * 119 · 120 · 126'nin HKM tarafi HKM/tests/test_merkez.py'de sinanir;
 * envanter yalniz brand/ortak ve uc src/tests'i okuyordu, bu yuzden o
 * ozellikler «testte» sayilmiyordu. Tarayici istemez.
 *
 *   node tools/envanterhkm.test.js   (cikis 0 temiz, 1 kirmizi)
 */
const { testOzellikleri } = require('./envanter.js');

const t = testOzellikleri();
const eksik = ['119', '120', '126'].filter(n => !t.has(n));
const hkmsiz = ['119', '120', '126'].filter(n => {
  const fs = require('fs'), path = require('path');
  const s = fs.readFileSync(path.join(__dirname, '..', 'HKM', 'tests', 'test_merkez.py'), 'utf8');
  return !new RegExp('test\\("oz-' + n + '\\b').test(s);
});
if(eksik.length || hkmsiz.length){
  console.log('  ✕ testte sayılmayan: ' + eksik.join(' ') + (hkmsiz.length ? ' · test_merkez.py adı oz- öneksiz: ' + hkmsiz.join(' ') : ''));
  process.exit(1);
}
console.log('  ✓ HKM testleri envanterde sayılıyor (119 · 120 · 126).');
