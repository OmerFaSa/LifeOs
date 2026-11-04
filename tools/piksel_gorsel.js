#!/usr/bin/env node
/* PİKSEL GÖRSELLER — logo ve simge dosyalarını piksel figürlerden üretir (brand/ortak/piksel-figur.js).

     node tools/piksel_gorsel.js

   Yazar: brand/life/{logo.png, favicon.png, lifeos.svg, lifeos.ico} ve modüllerin img/brand/favicon.png'si.
   Bağımlılık yok: PNG'yi zlib ile kendi yazar; büyütme en yakın komşu, piksel bozulmaz. */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), vm = require('vm');
const KOK = path.resolve(__dirname, '..');
const c = { window:{} };
vm.runInNewContext(fs.readFileSync(path.join(KOK, 'brand/ortak/piksel-figur.js'), 'utf8'), c);
const F = c.window.LIFEOS.PIKSEL_FIGUR;

const CRC = (() => { const t = []; for(let n = 0; n < 256; n++){ let k = n; for(let i = 0; i < 8; i++) k = k & 1 ? 0xEDB88320 ^ (k >>> 1) : k >>> 1; t[n] = k >>> 0; } return b => { let r = -1; for(const x of b) r = t[(r ^ x) & 255] ^ (r >>> 8); return (r ^ -1) >>> 0; }; })();
function parca(ad, veri){
  const u = Buffer.alloc(4); u.writeUInt32BE(veri.length);
  const g = Buffer.concat([Buffer.from(ad), veri]);
  const k = Buffer.alloc(4); k.writeUInt32BE(CRC(g));
  return Buffer.concat([u, g, k]);
}
function png(boy, renk){
  const ham = Buffer.alloc((boy * 4 + 1) * boy);
  for(let y = 0; y < boy; y++){ const b = y * (boy * 4 + 1); ham[b] = 0; for(let x = 0; x < boy; x++){ const r = renk(x, y); ham.set(r, b + 1 + x * 4); } }
  const h = Buffer.alloc(13); h.writeUInt32BE(boy, 0); h.writeUInt32BE(boy, 4); h[8] = 8; h[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), parca('IHDR', h), parca('IDAT', zlib.deflateSync(ham, { level:9 })), parca('IEND', Buffer.alloc(0))]);
}
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
/* Figür, zemin karosu üstünde; tamsayı katla büyür, kalan kenar boşluk olur. */
function kare(ad, boy, zemin, kenarlik){
  const f = F[ad], G = f.s[0].length, Y = f.s.length, ic = 2, kat = Math.floor(boy / (Math.max(G, Y) + ic * 2)), ox = Math.floor((boy - G * kat) / 2), oy = Math.floor((boy - Y * kat) / 2);
  return png(boy, (x, y) => {
    const fx = Math.floor((x - ox) / kat), fy = Math.floor((y - oy) / kat);
    const h = x >= ox && y >= oy && fy < Y && fx < G ? f.s[fy][fx] : '.';
    if(h !== '.') return hex(f.p[h]);
    const kk = Math.ceil(boy / 16), kose = (x < kk || x >= boy - kk) && (y < kk || y >= boy - kk);
    if(kose) return [0, 0, 0, 0];
    return kenarlik && (x < kk * 2 && false) ? hex(kenarlik) : hex(zemin);
  });
}
const svg = ad => { const f = F[ad], yol = {}; f.s.forEach((r, y) => { for(let x = 0; x < r.length; x++){ const k = f.p[r[x]]; if(k) yol[k] = (yol[k] || '') + 'M' + x + ' ' + y + 'h1v1h-1z'; } }); return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + f.s[0].length + ' ' + f.s.length + '" shape-rendering="crispEdges">' + Object.keys(yol).map(k => '<path fill="' + k + '" d="' + yol[k] + '"/>').join('') + '</svg>\n'; };
function ico(p){
  const b = Buffer.alloc(22); b.writeUInt16LE(1, 2); b.writeUInt16LE(1, 4); b[6] = 0; b[7] = 0; b.writeUInt16LE(1, 10); b.writeUInt16LE(32, 12); b.writeUInt32LE(p.length, 14); b.writeUInt32LE(22, 18);
  return Buffer.concat([b, p]);
}

const yaz = (y, v) => { fs.writeFileSync(path.join(KOK, y), v); console.log(y); };
const ZEMIN = '#fdf3df';
yaz('brand/life/logo.png', kare('logo', 512, ZEMIN));
yaz('brand/life/favicon.png', kare('logo', 192, ZEMIN));
yaz('brand/life/lifeos.svg', svg('logo'));
yaz('brand/life/lifeos.ico', ico(kare('logo', 256, ZEMIN)));
[['AYS', 'ays'], ['SPI', 'spi'], ['ESP', 'esp']].forEach(([m, ad]) => {
  const k = path.join(m, 'src/img/brand/favicon.png');
  if(fs.existsSync(path.join(KOK, k))) yaz(k, kare(ad, 192, ZEMIN));
});
