/* node kalite/kullanim.test.js — kullanım sayacının testi (sahte depo). Çıkış 0/1. */
'use strict';
const fs = require('fs');
const path = require('path');
const K = require('./kullanim.js');

let hata = 0;
function dene(ad, kosul) { console.log((kosul ? '✓ ' : '✗ ') + ad); if (!kosul) hata++; }
function depo() { const m = {}; return { m, getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; }

const GUN = 864e5, T0 = new Date(2026, 10, 13, 12, 0).getTime(); // yerel 13 Kasım öğle
const d = depo();
dene('ekran sayılır', K.say(d, 'ekran', 'felsefe', T0) && K.say(d, 'ekran', 'felsefe', T0 + 1000));
dene('araç sayılır', K.say(d, 'arac', 'not', T0));
dene('gün yerel tarihle yazılır', Object.keys(K.oku(d).gunler).join() === '2026-11-13');
dene('özet toplar', JSON.stringify(K.ozet(K.oku(d), T0, 28)) === JSON.stringify({ 'ekran/felsefe': 2, 'arac/not': 1 }));
dene('bilinmeyen tür sayılmaz', K.say(d, 'tiklama', 'x', T0) === false);
dene('serbest metin kimlik olamaz', K.say(d, 'ekran', 'Ali Veli\'nin notu', T0) === false && K.say(d, 'ekran', '', T0) === false);
dene('zaman sayı olmalı', K.say(d, 'ekran', 'felsefe', NaN) === false);

K.say(d, 'ekran', 'uyku', T0 - 40 * GUN);
dene('pencere dışı gün özete girmez', !('ekran/uyku' in K.ozet(K.oku(d), T0, 28)) && K.ozet(K.oku(d), T0, 60)['ekran/uyku'] === 1);
K.say(d, 'ekran', 'felsefe', T0 + 20 * GUN);
dene('56 günden eski gün silinir (depo büyümez)', !Object.keys(K.oku(d).gunler).some(g => g < K.gunAdi(T0 + 20 * GUN - 55 * GUN)));

const bozuk = depo(); bozuk.m[K.ANAHTAR] = '{bozuk';
dene('bozuk değer sıfırdan başlar', K.say(bozuk, 'ekran', 'felsefe', T0) && K.ozet(K.oku(bozuk), T0)['ekran/felsefe'] === 1);
const kapali = { getItem() { throw new Error('gizli pencere'); }, setItem() { throw new Error('dolu'); } };
dene('depo yazılamazsa false, hata fırlatmaz', K.say(kapali, 'ekran', 'felsefe', T0) === false);

const kaynak = fs.readFileSync(path.join(__dirname, 'kullanim.js'), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
dene('ağ çağrısı yok (yalnız bu bilgisayar)', !/fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|navigator\.|import\(/.test(kaynak));

console.log('\n' + (hata ? 'HATA' : 'TAMAM') + ': kullanim.test ' + hata + ' hata');
process.exit(hata ? 1 : 0);
