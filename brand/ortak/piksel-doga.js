/* PİKSEL KAPAK SAHNELERİ — Başbuğ (2026-11-16, depo sahibinin isteği: «hepsini sıfırdan sil, çok daha profesyonel ve amaca uygun yap»).
   Her yerin kendi sahnesi; Türk/Türkistan ve Anadolu dünyası: bozkır, otağ, kale, medrese, kervansaray, yayla, şifahane.
   Kabuk (kabuk/kabuk.js KAPAK) yer → sahne adı verir; eski adlar (yayla, dag, tarla…) ESKI ile yeni sahnelere gider.

   Sözler: süstür, veri okumaz, sayı üretmez; kodla çizilir; sahne bir kez çizilir (binaCiz), hareket saatten hesaplanır (kare).
   Çizim kuralları: az öğe, güçlü siluet; sahne başına sınırlı palet; uzak katman ufuk rengine karışır; ışık sağdan (güneş/ay sağda);
   geçiş yalnız bant kenarında titreşimle (Bayer). Yerleşim: üst-sol (logo, başlık) sakin, asıl öğe sağ yarıda; gök cismi üst
   çubuğun (arama kutusu) altında. Gece: renk gece tonuna karışır; '!' önekli renk (gök, ateş, pencere ışığı) karışmaz. */
window.LIFEOS = window.LIFEOS || {};

(function(L){
  'use strict';
  const vakit = s => (s >= 6 && s < 20 ? 'gunduz' : 'gece');   // kabuk/gece.js kipSec ile aynı sınır

  /* ---------- RENK: gece karışımı renge sorulurken uygulanır ---------- */
  const sayi = h => parseInt(h.slice(h[0] === '!' ? 2 : 1, h[0] === '!' ? 8 : 7), 16);
  const hex = n => '#' + ((n & 0xffffff) | 0x1000000).toString(16).slice(1);
  function karis(a, b, f){ const x = sayi(a), y = sayi(b), k = s => Math.round(((x >> s) & 255) * (1 - f) + ((y >> s) & 255) * f) << s; return hex(k(16) | k(8) | k(0)); }
  const GECE_TON = '#101831';
  let gece = false;
  const onbellek = new Map();
  const ton = c => (c[0] === '!' ? c.slice(1) : gece ? karis(c, GECE_TON, 0.64) : c);
  function renk(c){
    const a = (gece ? 'g' : 'd') + c;
    let v = onbellek.get(a);
    if(v === undefined){ const n = sayi(ton(c)); v = ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; onbellek.set(a, v); }
    return v;
  }

  /* ---------- TAMPON ---------- */
  const tampon = (W, H) => ({ W, H, d:new Uint32Array(W * H) });
  const px = (b, x, y, c) => { x = Math.round(x); y = Math.round(y); if(x >= 0 && y >= 0 && x < b.W && y < b.H) b.d[y * b.W + x] = renk(c); };
  function R(b, x, y, w, h, c){ const v = renk(c), x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y)), x1 = Math.min(b.W, Math.round(x + w)), y1 = Math.min(b.H, Math.round(y + h)); for(let j = y0; j < y1; j++) b.d.fill(v, j * b.W + x0, j * b.W + x1); }
  /* yarı saydam örtü: yalnız ışık havuzu */
  function ortu(b, x, y, c, a){ if(x < 0 || y < 0 || x >= b.W || y >= b.H) return; const i = y * b.W + x, o = b.d[i], n = renk(c), k = s => Math.round(((o >> s) & 255) * (1 - a) + ((n >> s) & 255) * a) << s; b.d[i] = ((255 << 24) | k(16) | k(8) | k(0)) >>> 0; }
  function isik(b, cx, cy, r, c, a){ for(let y = -r; y <= r; y++) for(let x = -r; x <= r; x++){ const d = Math.hypot(x, y * 1.6) / r; if(d < 1) ortu(b, Math.round(cx + x), Math.round(cy + y), c, Math.ceil((1 - d) * 3) / 3 * a); } }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const bay = (x, y) => BAYER[(x & 3) + (y & 3) * 4];
  const hash = (i, s) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
  const sm = t => t * t * (3 - 2 * t);
  const g1 = (x, s) => { const i = Math.floor(x), f = sm(x - i); return hash(i, s) * (1 - f) + hash(i + 1, s) * f; };
  function tohum(s){ let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; }
  const adTohum = ad => { let h = 7; for(const ch of ad) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const kis = (v, a, z) => Math.max(a, Math.min(z, v));

  /* ---------- GÖK ---------- */
  const GOK = {
    safak:{ g:['#4b5785', '#676d97', '#8f839f', '#b9979d', '#d8ae9b', '#e9c9a8'], gunes:'#fff2d4', hale:'#f3d3ae', bulut:['#f1d6c2', '#c99c9e'] },
    gun:{ g:['#4e77a4', '#678fb6', '#86a8c5', '#a7c0d1', '#c6d4d8'], gunes:'#fffbea', hale:'#e2eaea', bulut:['#eef0ec', '#c9d2d8'] },
    sabah:{ g:['#56799f', '#7493b6', '#98adc4', '#bec4c6', '#ddcfb4'], gunes:'#fff3d8', hale:'#efdcbc', bulut:['#f1e6d6', '#c7c0c0'] },
    aksam:{ g:['#36406c', '#52537f', '#7c6584', '#a6767c', '#c78d74', '#dcab84'], gunes:'#ffe4b0', hale:'#eab58a', bulut:['#ecc0a0', '#9c6c7a'] },
    alaca:{ g:['#232c4e', '#323c64', '#4a5480', '#6c7099', '#958ca9'], gunes:'#e9e3c8', hale:'#6f7398', bulut:['#5d6488', '#474e74'] },
    gece:{ g:['#0a1022', '#0f172e', '#151f3b', '#1d2848', '#283355'], gunes:'#ebe5c8', hale:'#2c3860', bulut:['#253054', '#1d2645'] },
  };
  const YILDIZ = ['!#68718f', '!#b9c0d6', '!#f1efe4'];
  function gok(b, o, boy){
    const dur = o.G.g, n = dur.length - 1;
    for(let y = 0; y < boy; y++){
      const f = y / Math.max(1, boy - 1) * n, i = Math.min(n - 1, Math.floor(f)), k = kis((f - i - 0.3) / 0.4, 0, 1);
      const A = renk('!' + dur[i]), B = renk('!' + dur[i + 1]);
      for(let x = 0; x < b.W; x++) b.d[y * b.W + x] = k > bay(x, y) ? B : A;
    }
  }
  function gokCismi(b, o, x, y, r){
    const G = o.G, hale = o.gece ? 0.32 : 0.55;
    for(let j = -r * 4; j <= r * 4; j++) for(let i = -r * 4; i <= r * 4; i++){
      const d = Math.hypot(i, j); if(d <= r || d > r * 4) continue;
      const a = 1 - (d - r) / (r * 3); if(bay(x + i, y + j) < a * a * hale) px(b, x + i, y + j, '!' + G.hale);
    }
    for(let j = -r; j <= r; j++) for(let i = -r; i <= r; i++){
      if(Math.hypot(i, j) > r + 0.35) continue;
      if(!o.gece){ px(b, x + i, y + j, '!' + G.gunes); continue; }
      const golge = Math.hypot(i - r * 0.6, j + r * 0.25) < r * 0.95;   // hilal: aydınlık yan solda (bayraktaki gibi)
      px(b, x + i, y + j, golge ? '!#2b3657' : (i + j) % 5 === 0 && i < 0 && j > -r + 1 ? '!#d2cbae' : '!' + G.gunes);
    }
  }
  function yildizCiz(b, o){ o.yildizlar.forEach(q => { px(b, q[0], q[1], YILDIZ[q[2]]); if(q[2] === 2 && q[3]) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => px(b, q[0] + d[0], q[1] + d[1], '!#55607e')); }); }
  function bulut(b, x, y, w, c){
    const h = Math.max(2, Math.round(w / 8));
    for(let j = 0; j < h; j++){
      const ww = Math.round(w * (1 - j * 0.62 / h)), xx = x + Math.round((w - ww) * (0.3 + 0.4 * hash(j, x)));
      R(b, xx + 1, y - j, ww - 2, 1, j === 0 ? c[1] : c[0]); px(b, xx, y - j - (j ? 0 : 1), c[0]); if(j === 0) R(b, xx + 1, y - 1, ww - 2, 1, c[0]);
    }
  }
  /* pencereden görünen gök (iç sahneler): aynı paletin küçük kopyası */
  function pencereGok(b, o, x0, y0, x1, y1){
    const dur = o.G.g, n = dur.length - 1, h = y1 - y0;
    for(let y = y0; y < y1; y++){ const f = (y - y0) / Math.max(1, h - 1) * n, i = Math.min(n - 1, Math.floor(f)), k = kis((f - i - 0.3) / 0.4, 0, 1); for(let x = x0; x < x1; x++) px(b, x, y, '!' + (k > bay(x, y) ? dur[i + 1] : dur[i])); }
  }

  /* ---------- ARAZİ ---------- */
  function yuk(a, x){ let n = g1(x * a.f, a.s) * 0.7 + g1(x * a.f * 2.7, a.s + 11) * 0.3; if(a.sivri) n = Math.pow(n, a.sivri); return a.y - a.amp * n; }
  /* sırt: gövde rengi, sağa bakan yamaçta ışık (güneş sağda), istenirse kar */
  function sirt(b, a){
    for(let x = 0; x < b.W; x++){
      const h = yuk(a, x), y0 = Math.round(h), e = yuk(a, x + 1.5) - yuk(a, x - 1.5);
      R(b, x, y0, 1, b.H - y0, a.c);
      if(a.i && e > 0.25){ const d = Math.min(a.dd || 5, Math.round(1 + e * 2.5)); for(let j = 0; j < d; j++) if(bay(x, y0 + j) > j / d * 0.9) px(b, x, y0 + j, a.i); }
      if(a.kar){ const sinir = a.y - a.amp * a.kar[2] + (g1(x * 0.4, a.s + 3) - 0.5) * 3; for(let y = y0; y < sinir; y++) px(b, x, y, e > -0.15 ? a.kar[0] : a.kar[1]); }
    }
  }
  /* zemin: ufuktan öne koyulaşan bantlar, dalgalı ve titreşimli dikiş */
  function zemin(b, y0, rk, s){
    const n = rk.length;
    for(let x = 0; x < b.W; x++){
      let y = y0;
      for(let i = 0; i < n; i++){
        const yb = i === n - 1 ? b.H : Math.round(y0 + (b.H - y0) * Math.pow((i + 1) / n, 1.3) + (g1(x * 0.03, s + i) - 0.5) * 3);
        if(yb > y){ R(b, x, y, 1, yb - y, rk[i]); if(i && bay(x, y) < 0.5) px(b, x, y, rk[i - 1]); y = yb; }
      }
    }
  }
  function otlar(b, o, y0, n, c, s){ const r = tohum(s); for(let i = 0; i < n; i++){ const x = Math.floor(r() * b.W), y = Math.floor(y0 + r() * (b.H - y0)); if(x < b.W * 0.52 && y < b.H * 0.86) continue; px(b, x, y, c); px(b, x - 1, y - 1, c); px(b, x + 1, y - 1, c); } }
  function spr(b, x, y, k, pal, ters){ const w = k[0].length; for(let j = 0; j < k.length; j++) for(let i = 0; i < w; i++){ const ch = k[j][ters ? w - 1 - i : i]; if(ch !== '.') px(b, x + i, y + j, pal[ch] || P_SABIT[ch]); } }
  /* sivri kemer: x sol, y alt, w genişlik, h boy */
  function kemer(b, x, y, w, h, c){ const hw = w / 2; for(let j = 0; j < h; j++){ const t = j / h, k = t < 0.6 ? 1 : Math.sqrt(1 - Math.pow((t - 0.6) / 0.4, 2)), ww = Math.max(1, Math.round(w * k)); R(b, x + Math.round(hw - ww / 2), y - j, ww, 1, c); } }

  /* ---------- YAPILAR ---------- */
  /* otağ (keçe ev): x orta, y yer, s duvar boyu, f uzaklık (ufka karışma) */
  function otag(b, o, x, y, s, f){
    const u = c => (f ? karis(c, o.hz, f) : c), hw = Math.round(s * 1.6), top = y - s, rh = Math.max(2, Math.round(s * 0.85));
    R(b, x - hw - 1, y, hw * 2 + 3, 1, u('#5c4f3c'));
    for(let i = -hw; i <= hw; i++) R(b, x + i, top, 1, s, u(i < -hw * 0.35 ? '#c3b294' : '#e5d8be'));
    if(s > 4){ R(b, x - hw, top + 1, hw * 2 + 1, 1, u('#9a4636')); for(let i = -hw; i <= hw; i += 3) px(b, x + i, top + 1, u('#c98e44')); }
    for(let j = 0; j < rh; j++){
      const w = Math.round((hw + 1) * Math.sqrt(1 - Math.pow(j / rh, 2))), yy = top - 1 - j;
      for(let i = -w; i <= w; i++) px(b, x + i, yy, j === 0 ? u('#8f7d63') : i < -w * 0.35 ? u('#b8a587') : (s > 6 && i % Math.max(3, Math.round(w / 3)) === 0 && j < rh - 1) ? u('#c4b293') : u('#d9c9aa'));
    }
    R(b, x - 1, top - rh, 3, 1, u('#5a4636'));
    const dw = Math.max(1, Math.round(s * 0.42)), dh = Math.max(2, Math.round(s * 0.68)), dx = x + Math.round(hw * 0.15) - Math.floor(dw / 2);
    if(s > 3) R(b, dx - 1, y - dh - 1, dw + 2, dh + 1, u('#c08c3c'));
    R(b, dx, y - dh, dw, dh, o.gece ? '!#efb15c' : u('#7f3428'));
    if(o.gece && !f) for(let j = 1; j < 4; j++) for(let i = -1 - j; i <= dw + j; i++) if(bay(dx + i, y + j) < 0.55 - j * 0.14) px(b, dx + i, y + j, '!#8a6844');
  }
  /* kara çadır (Yörük): uzun, alçak, direkli */
  function karaCadir(b, o, x, y, w, h){
    for(let i = 0; i < w; i++){ const t = i / (w - 1), hh = Math.round(h * (t < 0.08 || t > 0.92 ? 0.55 : Math.abs(Math.sin(t * Math.PI * 2)) * 0.25 + 0.75)); R(b, x + i, y - hh, 1, hh, i % 4 === 0 ? '#463b40' : '#382f35'); px(b, x + i, y - hh, '#56494c'); }
    const kx = x + Math.round(w * 0.58), kw = Math.max(2, Math.round(w * 0.16)), kh = Math.round(h * 0.62);
    R(b, kx, y - kh, kw, kh, o.gece ? '!#e0a258' : '#6b584c'); if(o.gece) R(b, kx, y - kh, kw, 1, '!#f2c47a');
    R(b, x - 2, y, w + 4, 1, '#2a2629');
  }
  /* bayrak direği (bayrağı kare çizer) */
  function direk(b, x, y, h, c){ R(b, x, y - h, 1, h, c || '#4a3f36'); px(b, x, y - h - 1, '#d8b456'); }

  /* ---------- İÇ MEKÂN ---------- */
  function duvar(b, o, y1, ac, koyu, isikX){
    for(let y = 0; y < y1; y++) for(let x = 0; x < b.W; x++){
      /* düz duvar; yalnız tavan gölgesi (üst çubuğun altında kalır) — başlığın arkasında kumlanma yok */
      px(b, x, y, y < b.H * 0.1 || (y < b.H * 0.14 && bay(x, y) < 0.5) ? koyu : ac);
    }
  }
  function pencere(b, o, x0, y0, x1, y1, a){
    pencereGok(b, o, x0, y0, x1, y1);
    const z = Math.round(y0 + (y1 - y0) * 0.72), son = o.G.g[o.G.g.length - 1];
    if(a.uzak) for(let x = x0; x < x1; x++){ const h = Math.round(z - (g1(x * 0.12, 5) * 0.8 + 0.2) * (y1 - y0) * 0.16); R(b, x, h, 1, y1 - h, karis(a.uzak, son, 0.45)); }
    if(a.minare){ const mx = x0 + Math.round((x1 - x0) * 0.3), mh = Math.round((y1 - y0) * 0.5), c = karis(a.minare, o.hz, 0.35); R(b, mx, z - mh, 2, mh, c); px(b, mx, z - mh - 1, c); px(b, mx + 1, z - mh - 2, c); }
    if(a.cisim) gokCismi(b, o, x0 + Math.round((x1 - x0) * 0.68), y0 + Math.round((y1 - y0) * 0.3), 2);
    if(o.gece) for(let i = 0; i < (x1 - x0) * (y1 - y0) / 40; i++){ const x = x0 + Math.floor(hash(i, 3) * (x1 - x0)), y = y0 + Math.floor(hash(i, 4) * (z - y0 - 2)); px(b, x, y, YILDIZ[i % 2]); }
  }
  /* kitap sırası: rafın üstünde, türlü boy ve sırt rengi */
  const KITAP = ['#7a3a33', '#3c566a', '#6a683a', '#8b6a3c', '#4a3e58', '#b8a882'];
  function kitaplar(b, x0, x1, y, h, s){ const r = tohum(s); let x = x0; while(x < x1 - 1){ const w = 1 + (r() < 0.35 ? 1 : 0), hh = Math.max(2, Math.round(h * (0.6 + r() * 0.4))), c = KITAP[Math.floor(r() * KITAP.length)]; if(r() < 0.08){ x += 2; continue; } R(b, x, y - hh, w, hh, c); if(hh > 3) px(b, x, y - hh + 1, '#d8c8a0'); x += w; } }
  function kandil(b, o, x, y){ R(b, x - 1, y, 3, 1, '#a07a3c'); px(b, x, y + 1, '#7d5d2e'); if(o.gece) isik(b, x, y - 2, 9, '!#f1b860', 0.3); }

  /* ---------- SPRİTLER (kare çizer; harf → renk P_SABIT ya da sahnenin paleti) ---------- */
  const P_SABIT = { a:'#7a4e32', m:'#3a2618', k:'#2f2a2a', h:'#7a2f2a', s:'#c99a78', c:'#3c4a68', w:'#a8743c', y:'!#ffe7a0', o:'!#f39a44', r:'!#c4482c' };
  const POZ = {
    at:{ k:[
      ['........m.', '.......maa', 'm.....am..', 'maaaaaaa..', '.aaaaaaa..', '.a.a..a.a.', '.a.a..a.a.'],
      ['..........', '..........', 'm.........', 'maaaaaam..', '.aaaaaaaa.', '.a.a..a.aa', '.a.a..a..a']] },
    atli:{ k:[['..k....', '..k..k.', 'kkkkkk.', '.kkkk..', '.k..k..'], ['..k....', '..k..k.', 'kkkkkk.', '.kkkk..', 'k....k.']] },
    deve:{ k:[
      ['kk.......', '.k...kk..', '.kk.kkkk.', '..kkkkkkk', '..k.k.k.k', '..k.k.k.k'],
      ['kk.......', '.k...kk..', '.kk.kkkk.', '..kkkkkkk', '...kk..kk', '...kk..kk']] },
    ozan:{ k:[['....hhh.....', '...hhhhh....', '....sss.....', '....sss...m.', '...cccc..m..', '..cccccsm...', '..ccccwm....', '..cccwww....', '..ccwwwws...', '.ccccwww....', 'cccccccccc..']] },
    kartal:{ k:[['k...k', '.kkk.'], ['kk.kk', '..k..']] },
    kus:{ k:[['k.k', '.k.'], ['kkk', '...']] },
    alev:{ k:[['..r..', '.rr..', '.ror.', 'royor', 'oyyyo', 'oyyyo'], ['.r...', '..rr.', '.ror.', 'royor', 'oyyyo', 'oyyyo'], ['...r.', '.rr..', '.orr.', 'royor', 'oyyyo', 'oyyyo']] },
  };
  const INSAN = ['ozan', 'atli'];

  /* ---------- HAREKET: al(s, t) saf saatten küçük bir durum verir; ciz yalnız o durumu çizer ---------- */
  const nk = (g, x, y, c, w, h) => { g.fillStyle = ton(c); g.fillRect(x, y, w || 1, h || 1); };
  function sprG(g, x, y, k, pal, ters){ const w = k[0].length; for(let j = 0; j < k.length; j++) for(let i = 0; i < w; i++){ const ch = k[j][ters ? w - 1 - i : i]; if(ch !== '.') nk(g, x + i, y + j, (pal && pal[ch]) || P_SABIT[ch]); } }
  const kesir = v => v - Math.floor(v);
  const dongu = (t, T) => (((t % T) + T) % T) / T;
  const HAREKET = {
    duman:{ al:(s, t) => Math.floor(t * 2), ciz(g, s, k){ for(let i = 0; i < 5; i++){ const p = kesir(k / 2 / s.T + i / 5), y = s.y - Math.round(p * s.L), x = s.x + Math.round(p * p * s.L * 0.7 + Math.sin(p * 9 + i * 2) * 0.6); g.globalAlpha = Math.ceil((1 - p) * 3) / 4; nk(g, x, y, s.c, p > 0.35 ? 2 : 1, 1); } g.globalAlpha = 1; } },
    bayrak:{ al:(s, t) => Math.floor(t * 3) % 4, ciz(g, s, k){ for(let i = 0; i < s.w; i++){ const f = i * 1.2 - k * Math.PI / 2, d = Math.round(Math.sin(f) * (i / s.w) * 1.2); nk(g, s.x + i, s.y + d, Math.cos(f) < -0.3 ? s.c[1] : s.c[0], 1, s.h); } if(s.ay) nk(g, s.x + 2, s.y + Math.round(Math.sin(2.4 - k * Math.PI / 2) * 0.5) + (s.h >> 1), '#f4ece0'); } },
    tug:{ al:(s, t) => Math.floor(t * 2) % 4, ciz(g, s, k){ const d = [0, 1, 0, -1][k]; for(let j = 0; j < s.L; j++) nk(g, s.x + Math.round(d * j / s.L) - (j > s.L * 0.3 ? 1 : 0), s.y + j, s.c[j % 3 === 2 ? 1 : 0], j > s.L * 0.3 ? 3 : 1, 1); } },
    yildiz:{ al:(s, t) => { const k = Math.floor(t / 0.9); return s.l.map((_, i) => (hash(i + 1, (k % 997) + s.s) > 0.75 ? 1 : 0)).join(''); },
      ciz(g, s, k){ s.l.forEach((q, i) => nk(g, q[0], q[1], k[i] === '1' ? YILDIZ[0] : YILDIZ[2])); } },
    kayan:{ al:(s, t) => { const p = dongu(t, s.T) * s.T; return p < 0.9 ? Math.floor(p * 10) : -1; },
      ciz(g, s, k){ if(k < 0) return; for(let i = 0; i < 4; i++) if(k - i >= 0){ g.globalAlpha = 1 - i * 0.24; nk(g, s.x - (k - i) * 2, s.y + (k - i), '!#e6ebf6'); } g.globalAlpha = 1; } },
    atli:{ al:(s, t) => { const p = dongu(t, s.T); if(p > s.yol) return '-'; return Math.round(s.x0 + (s.x1 - s.x0) * p / s.yol) + ',' + (Math.floor(t * 4) % 2); },
      ciz(g, s, k){ if(k === '-') return; const q = k.split(','); sprG(g, +q[0], s.y, POZ.atli.k[+q[1]], { k:s.c }, s.x1 < s.x0); } },
    kervan:{ al:(s, t) => Math.round(s.x0 + (s.x1 - s.x0) * dongu(t, s.T)) + ',' + (Math.floor(t * 2.5) % 2),
      ciz(g, s, k){ const q = k.split(','), x = +q[0]; for(let i = 0; i < s.n; i++){ const xx = x + i * 11; if(xx > s.dur - 2 && xx < s.x0 + 2) sprG(g, xx, s.y, POZ.deve.k[(+q[1] + i) % 2], { k:s.c }, false); } } },
    kartal:{ al:(s, t) => { const a = t / s.T * Math.PI * 2; return Math.round(s.x + Math.cos(a) * s.r) + ',' + Math.round(s.y + Math.sin(a) * s.r * 0.32) + ',' + (Math.floor(t * 1.5) % 6 === 0 ? 0 : 1); },
      ciz(g, s, k){ const q = k.split(','); sprG(g, +q[0] - 2, +q[1], POZ.kartal.k[+q[2]], { k:s.c }); } },
    kus:{ al:(s, t) => { const p = dongu(t, s.T); if(p > s.yol) return '-'; const f = p / s.yol; return Math.round(s.x0 + (s.x1 - s.x0) * f) + ',' + Math.round(s.y + Math.sin(f * 7) * 1.2) + ',' + (Math.floor(t * 3) % 2); },
      ciz(g, s, k){ if(k === '-') return; const q = k.split(','); [[0, 0], [5, -2], [9, 1]].slice(0, s.n).forEach((d, i) => sprG(g, +q[0] + d[0], +q[1] + d[1], POZ.kus.k[(+q[2] + i) % 2], { k:s.c })); } },
    at:{ al:(s, t) => (hash(Math.floor(t / 7), s.s) > 0.4 ? 1 : 0), ciz(g, s, k){ sprG(g, s.x, s.y, POZ.at.k[k], s.pal, s.ters); } },
    alev:{ al:(s, t) => Math.floor(t * 6) % 3, ciz(g, s, k){ sprG(g, s.x, s.y, POZ.alev.k[k]); } },
    kivilcim:{ al:(s, t) => Math.floor(t * 4), ciz(g, s, k){ for(let i = 0; i < 3; i++){ const p = kesir(k / 4 / 2.6 + i / 3); if(p < 0.85) nk(g, s.x + Math.round(Math.sin(p * 7 + i * 2) * 1.5), s.y - Math.round(p * s.L), p < 0.5 ? '!#ffc677' : '!#c6683a'); } } },
    su:{ al:(s, t) => Math.floor(t * 6) % 3, ciz(g, s, k){ for(let j = 0; j < s.L; j++) nk(g, s.x, s.y + j, (j + k) % 3 === 0 ? s.c[1] : s.c[0]); nk(g, s.x - 1 + (k % 2) * 2, s.y + s.L - 1, s.c[1]); } },
    parilti:{ al:(s, t) => Math.floor(t * 1.2), ciz(g, s, k){ for(let i = 0; i < s.n; i++) nk(g, s.x + Math.floor(hash(k * 7 + i, s.s) * s.w), s.y + Math.floor(hash(k * 13 + i, s.s + 1) * s.h), s.c, 2, 1); } },
    toz:{ al:(s, t) => Math.floor(t * 2), ciz(g, s, k){ g.globalAlpha = 0.7; for(let i = 0; i < s.n; i++){ const p = kesir(k / 2 / s.T + i / s.n); nk(g, s.x + Math.round(hash(i, s.s) * s.w + Math.sin(p * 6 + i) + p * s.kay), s.y + Math.round(p * s.h), s.c); } g.globalAlpha = 1; } },
    mum:{ al:(s, t) => (hash(Math.floor(t * 5), s.s) > 0.5 ? 1 : 0), ciz(g, s, k){ nk(g, s.x, s.y - 1 - k, '!#ffe7a0'); nk(g, s.x, s.y, '!#f39a44'); } },
  };
  function kareAl(s, t){ return HAREKET[s.tur].al(s, t + (s.faz || 0)); }

  /* ---------- SAHNELER: yer(o) konum ve sakinleri kurar (deterministik), ciz(b, o) bir kez çizer ---------- */
  const AT_RENK = [{ a:'#7a4e32', m:'#3a2618' }, { a:'#d6d0c2', m:'#8f887c' }, { a:'#33302f', m:'#1c1a1a' }, { a:'#a68658', m:'#5a4230' }];
  const atEkle = (o, x, y, i, ters) => o.sakin.push({ tur:'at', x:Math.round(x), y:Math.round(y) - 7, pal:AT_RENK[i % 4], ters:!!ters, s:i * 7 + 3 });
  const dumanEkle = (o, x, y, L, T) => o.sakin.push({ tur:'duman', x, y, L, T:T || 7, c:o.gece ? '!#56607e' : '!#ece3d4' });
  const yildizEkle = o => { const l = o.yildizlar.filter(q => q[2] && q[0] > o.W * 0.45).slice(0, 7).map(q => [q[0], q[1]]); if(l.length) o.sakin.push({ tur:'yildiz', l, s:o.W % 97 }); };

  const SAHNE = {
    /* Bugün: Ötüken'de şafak — otağ, tuğ, otlayan atlar, ufukta bir atlı */
    otuken:{ gok:'safak', ufuk:0.6, gyy:0.44,
      yer(o){
        const { W, H } = o, z = o.ufuk, s = Math.max(4, Math.round(H * 0.085)), ox = Math.round(W * 0.7), oy = z + Math.round((H - z) * 0.42);
        o.p = { s, ox, oy };
        dumanEkle(o, ox, oy - s - Math.round(s * 0.85) - 2, Math.round(H * 0.16));
        const tx = ox + Math.round(s * 1.6) + Math.max(3, Math.round(s * 0.6)), th = Math.round(s * 2.4);
        o.p.tug = [tx, oy, th];
        o.sakin.push({ tur:'tug', x:tx, y:oy - th + 1, L:Math.max(3, Math.round(th * 0.32)), c:['#2c2724', '#5c5048'] });
        atEkle(o, W * 0.53, z + (H - z) * 0.66, 0); atEkle(o, W * 0.86, z + (H - z) * 0.28, 1, true); atEkle(o, W * 0.92, z + (H - z) * 0.78, 3);
        o.sakin.push({ tur:'atli', x0:W + 6, x1:Math.round(W * 0.56), y:z - 4, T:80, yol:(W * 0.44 + 6) / 3 / 80, faz:20, c:karis('#3a3433', o.hz, 0.3) });
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.hz;
        sirt(b, { y:z, amp:H * 0.15, f:0.016, s:3, c:karis('#5f5f84', hz, 0.42), i:karis('#a28fa2', hz, 0.35) });
        sirt(b, { y:z + 1, amp:H * 0.06, f:0.03, s:9, c:karis('#857a5e', hz, 0.3) });
        zemin(b, z + Math.round(H * 0.02), ['#ab966a', '#9c885f', '#8b7954', '#786a4a'], 4);
        otlar(b, o, z + (H - z) * 0.4, Math.round(W / 9), '#675b3f', 2);
        otag(b, o, Math.round(W * 0.88), z + 3, Math.max(2, Math.round(p.s * 0.42)), 0.35);
        otag(b, o, Math.round(W * 0.95), z + 2, Math.max(2, Math.round(p.s * 0.32)), 0.42);
        otag(b, o, p.ox, p.oy, p.s, 0);
        direk(b, p.tug[0], p.tug[1], p.tug[2], '#4a3c30');
      } },

    /* Plan: sabah ufku — ufka uzanan yol, kilometre taşları */
    ufuk:{ gok:'sabah', ufuk:0.58, gyy:0.5,
      yer(o){
        const { W, H } = o;
        o.p = { vx:Math.round(W * 0.74), bx:Math.round(W * 0.6), bw:Math.round(W * 0.09) };
        o.sakin.push({ tur:'kus', x0:W + 4, x1:Math.round(W * 0.55), y:Math.round(H * 0.3), n:3, T:70, yol:0.6, faz:25, c:o.gece ? '#1e2236' : '#4c4a52' });
        if(o.gece){ yildizEkle(o); o.sakin.push({ tur:'kayan', x:Math.round(W * 0.9), y:Math.round(H * 0.12), T:41, faz:20 }); }
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.hz;
        sirt(b, { y:z, amp:H * 0.05, f:0.02, s:21, c:karis('#6c7889', hz, 0.5) });
        zemin(b, z + 1, ['#a4a57a', '#93976f', '#828763', '#707656'], 22);
        for(let y = z + 1; y < H; y++){
          const f = (y - z) / (H - z), cx = p.vx + (p.bx - p.vx) * f, hw = 0.4 + f * p.bw;
          for(let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++){ const q = Math.abs(x - cx) / hw; px(b, x, y, q > 0.86 ? '#9f8c69' : Math.abs(q - 0.45) < 0.12 && bay(x, y) < 0.7 ? '#a8936e' : f < 0.4 ? '#cdb994' : '#bea983'); }
        }
        [0.12, 0.3, 0.55, 0.88].forEach(f => { const y = Math.round(z + (H - z) * f), x = Math.round(p.vx + (p.bx - p.vx) * f + 0.4 + f * p.bw + 2 + f * 6), h = Math.max(1, Math.round(1 + f * 7)), w = Math.max(1, Math.round(1 + f * 3)); R(b, x, y - h, w, h, '#a39a86'); R(b, x + Math.ceil(w / 2), y - h, Math.floor(w / 2), h, '#d2c9b4'); if(w > 2) R(b, x + 1, y - h - 1, w - 2, 1, '#c2b9a4'); });
        const ax = Math.round(W * 0.9), ay = Math.round(z + (H - z) * 0.32), ah = Math.round(H * 0.16);
        R(b, ax, ay - ah * 0.55, 1, ah * 0.55, '#4d3e33');
        for(let j = 0; j < ah * 0.6; j++){ const w = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((j - ah * 0.3) / (ah * 0.3), 2))) * ah * 0.32); R(b, ax - w, ay - ah + j, w * 2 + 1, 1, '#5d6c48'); R(b, ax + Math.round(w * 0.2), ay - ah + j, Math.round(w * 0.8), 1, '#73835a'); }
        R(b, ax - Math.round(ah * 0.3), ay, Math.round(ah * 0.6), 1, '#5f6448');
      } },

    /* Tarih: sırtta kale — burçlar, bayrak, süzülen kartal */
    kale:{ gok:'gun', ufuk:0.66, gyy:0.28, gx:0.86, gxt:0.5,
      yer(o){
        const { W, H } = o, xa = Math.round(W * 0.5);
        const tepe = x => o.ufuk - H * 0.26 * sm(kis((x - xa) / (W * 0.3), 0, 1)) + (g1(x * 0.08, 41) - 0.5) * H * 0.04;
        const kx = Math.round(W * 0.64), kh = Math.round(H * 0.22), ky = Math.round(tepe(kx)) - kh, bh = Math.max(4, Math.round(H * 0.1));
        o.p = { xa, tepe, kule:[[kx, kh], [Math.round(W * 0.8), Math.round(H * 0.13)], [Math.round(W * 0.95), Math.round(H * 0.15)]], direk:[kx + 2, ky, bh] };
        o.sakin.push({ tur:'bayrak', x:kx + 3, y:ky - bh, w:Math.max(5, Math.round(H * 0.07)), h:Math.max(3, Math.round(H * 0.045)), ay:H > 70, c:['#b8352f', '#8e2925'] });
        o.sakin.push({ tur:'kartal', x:Math.round(W * 0.78), y:Math.round(H * 0.26), r:Math.round(W * 0.05), T:26, c:o.gece ? '#1b2033' : '#3b3634' });
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.hz;
        sirt(b, { y:z, amp:H * 0.12, f:0.014, s:31, c:karis('#6b7a8d', hz, 0.55), i:karis('#94a1b0', hz, 0.5) });
        sirt(b, { y:z + 2, amp:H * 0.05, f:0.03, s:33, c:karis('#6f7b62', hz, 0.3) });
        zemin(b, z + Math.round(H * 0.04), ['#8d9670', '#7f8966', '#717c5c', '#626e51'], 34);
        for(let x = 0; x < W * 0.5; x++){ const y = Math.round(z + H * 0.1 + Math.sin(x * 0.05) * 2 + x * 0.08); if(bay(x, y) < 0.8) px(b, x, y, '#a9b9bb'); }
        for(let x = p.xa - 4; x < W; x++){
          const h = Math.round(p.tepe(x)), e = p.tepe(x + 1) - p.tepe(x - 1);
          for(let y = h, ay = Math.min(H, Math.round(z + (z - h) * 1.5)); y < ay; y++){ const n = g1(x * 0.3 + y * 0.7, 43); px(b, x, y, y - h < 2 && e < -0.2 ? '#a99d84' : n > 0.72 ? '#6c6354' : y > z + H * 0.1 ? '#6f7356' : '#8b806b'); }
        }
        const wh = Math.max(3, Math.round(H * 0.07)), xa = Math.round(W * 0.62);
        for(let x = xa; x < W; x++){ const t = Math.round(p.tepe(x)) - wh + 1; R(b, x, t, 1, wh + 1, x % 7 < 5 ? '#c0ae8a' : '#b19f7c'); if((x - xa) % 3 === 2) px(b, x, t, '#8d7d62'); px(b, x, t + 2, '#a8977a'); }
        p.kule.forEach(([x, h], i) => {
          const tw = Math.max(5, Math.round(H * (i === 0 ? 0.09 : 0.07))), x0 = x - (tw >> 1), y0 = Math.round(p.tepe(x)) - h;
          R(b, x0, y0, tw, h + 2, '#c8b792'); R(b, x0, y0, Math.round(tw * 0.38), h + 2, '#9e8e72');
          for(let i2 = -1; i2 <= tw; i2 += 2) R(b, x0 + i2, y0 - 2, 1, 2, i2 < tw * 0.38 ? '#9e8e72' : '#c8b792');
          R(b, x0 - 1, y0, tw + 2, 1, '#8f8066');
          for(let j = y0 + 3; j < y0 + h - 2; j += Math.max(4, Math.round(h / 3))) R(b, x0 + (tw >> 1), j, 1, 2, o.gece ? '!#e9a95a' : '#3c3430');
        });
        direk(b, p.direk[0], p.direk[1], p.direk[2]);
      } },

    /* Felsefe, Öğren: Semerkant medresesi — pîştak, firuze kubbe, iki minare; gece hücrelerde kütüphane ışığı */
    medrese:{ gok:'gun', ufuk:0.82, gyy:0.3, gx:0.9,
      yer(o){
        const { W, H } = o;
        o.p = { x:Math.round(W * 0.68), w:Math.max(14, Math.round(H * 0.34)), h:Math.round(H * 0.6) };
        o.sakin.push({ tur:'kus', x0:Math.round(W * 0.98), x1:Math.round(W * 0.56), y:Math.round(H * 0.22), n:2, T:50, yol:0.5, faz:8, c:o.gece ? '#1b2033' : '#4a4644' });
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.hz, r = tohum(55);
        for(let x = 0; x < W; x++){ const h = Math.round(z - H * 0.12 - g1(x * 0.2, 51) * H * 0.05 * (x % 9 < 6 ? 1 : 0.4)); R(b, x, h, 1, z - h, karis('#b9a888', hz, 0.55)); }
        for(let i = 0; i < 6; i++){ const x = Math.round(W * (0.06 + r() * 0.42)), h = Math.round(H * (0.14 + r() * 0.08)); for(let j = 0; j < h; j++) R(b, x - (j > 1 && j < h - 2 ? 1 : 0), z - H * 0.1 - j, j > 1 && j < h - 2 ? 3 : 1, 1, karis('#6c7a5a', hz, 0.45)); }
        R(b, 0, z, W, H - z, '#cdb995');
        for(let y = z + 2; y < H; y += 3) R(b, 0, y, W, 1, '#bba782');
        const kanat = (xa, xb, kh) => {
          R(b, xa, z - kh, xb - xa, kh, '#c4a274'); R(b, xa, z - kh, xb - xa, 1, '#3a8f98'); R(b, xa, z - kh + 1, xb - xa, 1, '#2c5585');
          const aw = Math.max(3, Math.round(kh * 0.22)), ah = Math.round(kh * 0.36);
          for(let x = xa + 2; x < xb - aw; x += aw + 2) for(const yb of [z - 2, z - ah - 4]){ const yak = o.gece && hash(x, yb) > 0.45; kemer(b, x, yb, aw, ah, yak ? '!#e6b05a' : '#5a4632'); if(!yak) R(b, x, yb - Math.round(ah * 0.5), aw, 1, '#6d5740'); }
        };
        const x0 = p.x - (p.w >> 1), x1 = x0 + p.w, kh = Math.round(p.h * 0.52);
        kanat(Math.round(W * 0.47), x0, kh); kanat(x1, Math.min(W, x1 + Math.round(p.w * 0.9)), kh);
        const dx = x1 + Math.round(p.w * 0.38), dr = Math.round(p.w * 0.44), dy = z - Math.round(p.h * 0.72);
        R(b, dx - dr + 2, dy, dr * 2 - 3, Math.round(p.h * 0.2), '#2f6f86'); R(b, dx - dr + 2, dy + 1, dr * 2 - 3, 1, '#c4a274');
        for(let j = 0; j < Math.round(dr * 1.15); j++){ const t = j / (dr * 1.15), w = Math.round(dr * Math.sqrt(1 - t * t) * (1 + 0.12 * Math.sin(t * 3))); for(let i = -w; i <= w; i++) px(b, dx + i, dy - 1 - j, (i + 99) % 3 === 0 ? '#2b7a8a' : i > w * 0.25 ? '#74c3c0' : i < -w * 0.4 ? '#2f7d8c' : '#3ea0a8'); }
        R(b, dx, dy - Math.round(dr * 1.15) - 2, 1, 3, '#d8b456');
        R(b, x0, z - p.h, p.w, p.h, '#c9a776'); R(b, x0, z - p.h, Math.round(p.w * 0.18), p.h, '#a8875c');
        R(b, x0 + 1, z - p.h + 1, p.w - 2, 1, '#2c5585'); R(b, x0 + 1, z - p.h + 1, 1, p.h - 1, '#2c5585'); R(b, x1 - 2, z - p.h + 1, 1, p.h - 1, '#2c5585');
        for(let y = z - p.h + 3; y < z; y += 2){ px(b, x0 + 2, y, '#3ea0a8'); px(b, x1 - 3, y, '#3ea0a8'); }
        for(let x = x0 + 3; x < x1 - 3; x += 2) px(b, x, z - p.h + 2, '#3ea0a8');
        const aw = Math.round(p.w * 0.56), ah = Math.round(p.h * 0.78), ax = p.x - (aw >> 1);
        R(b, ax - 1, z - ah - 2, aw + 2, ah + 2, '#2c5585');
        kemer(b, ax, z - 1, aw, ah, '#22324c'); kemer(b, ax + 2, z - Math.round(ah * 0.45), aw - 4, Math.round(ah * 0.5), '#2f4565');
        for(let j = 0; j < 4; j++) for(let i = 0; i < aw - 6; i += 2) if((i + j) % 4 === 0) px(b, ax + 3 + i, z - ah + Math.round(ah * 0.3) + j * 2, '#3e5b80');
        const kw = Math.max(2, Math.round(aw * 0.36)), kh2 = Math.round(ah * 0.36);
        kemer(b, p.x - (kw >> 1), z - 1, kw, kh2, o.gece ? '!#efc06a' : '#16202f');
        if(o.gece) isik(b, p.x, z - 2, Math.round(p.w * 0.5), '!#e2a352', 0.22);
        const minare = (x, h) => { const mw = Math.max(3, Math.round(p.w * 0.12)); R(b, x, z - h, mw, h, '#cfae7c'); R(b, x, z - h, 1, h, '#a8875c'); for(let y = z - h + 2; y < z - 2; y += 5) R(b, x, y, mw, 1, '#3ea0a8'); R(b, x - 1, z - h - 1, mw + 2, 2, '#2c5585'); R(b, x, z - h - 3, mw, 2, '#3ea0a8'); };
        minare(x0 - Math.max(4, Math.round(p.w * 0.14)), Math.round(p.h * 1.05)); minare(x1 + 1, Math.round(p.h * 1.05));
      } },

    /* Akademik: çalışma odası — kitaplık, pencere, masa lambası */
    kitaplik:{ ic:true,
      yer(o){
        const { W, H } = o, wx0 = Math.round(W * 0.56), wx1 = Math.round(W * 0.74);
        o.p = { wx0, wx1, wy0:Math.round(H * 0.3), wy1:Math.round(H * 0.68), yz:Math.round(H * 0.82) };
        if(o.gece) o.sakin.push({ tur:'mum', x:Math.round(W * 0.7), y:o.p.yz - Math.round(H * 0.14) - 4, s:3 });
        else o.sakin.push({ tur:'toz', x:wx0 - Math.round(W * 0.08), y:o.p.wy1, w:Math.round(W * 0.1), h:o.p.yz - o.p.wy1, kay:-4, n:5, T:14, s:5, c:'!#f4e2b4' });
      },
      ciz(b, o){
        const { W, H } = o, p = o.p, gc = o.gece;
        duvar(b, o, p.yz, gc ? '#a08a6c' : '#c2ae8e', gc ? '#8a7558' : '#ac9776', gc ? W * 0.7 : (p.wx0 + p.wx1) / 2);
        R(b, 0, Math.round(H * 0.06), W, 1, '#8c7556');
        R(b, 0, p.yz, W, H - p.yz, '#6b4a34'); for(let y = p.yz + 2; y < H; y += 3) R(b, 0, y, W, 1, '#5d4030');
        R(b, 0, p.yz - 1, W, 1, '#4a3426');
        R(b, p.wx0 - 2, p.wy0 - 2, p.wx1 - p.wx0 + 4, p.wy1 - p.wy0 + 4, '#5a4130');
        pencere(b, o, p.wx0, p.wy0, p.wx1, p.wy1, { uzak:'#7a8a96', minare:'#8a8a9a', cisim:true });
        R(b, Math.round((p.wx0 + p.wx1) / 2), p.wy0, 1, p.wy1 - p.wy0, '#5a4130'); R(b, p.wx0, Math.round((p.wy0 + p.wy1) / 2), p.wx1 - p.wx0, 1, '#5a4130');
        R(b, p.wx0 - 3, p.wy1 + 2, p.wx1 - p.wx0 + 6, 1, '#7a5a40');
        if(!gc) for(let y = p.wy1 + 3; y < H; y++){ const k = y - p.wy1, x0 = p.wx0 - k * 0.6, x1 = p.wx1 - k * 0.45; for(let x = Math.round(x0); x < x1; x++) if(bay(x, y) < 0.45) ortu(b, x, y, '!#fff0c8', 0.22); }
        const rx = Math.round(W * 0.8), rw = W - rx, rt = Math.round(H * 0.1), raf = Math.max(6, Math.round(H * 0.16));
        R(b, rx, rt, rw, p.yz - rt, '#4e3627'); R(b, rx, rt, 2, p.yz - rt, '#6d4c36');
        for(let y = rt + raf; y <= p.yz; y += raf){ kitaplar(b, rx + 3, W - 1, y - 1, raf - 2, y); R(b, rx + 2, y - 1, rw - 2, 1, '#7a5a40'); }
        const mt = p.yz - Math.round(H * 0.14), mx0 = Math.round(W * 0.52), mx1 = Math.round(W * 0.77);
        R(b, mx0, mt, mx1 - mx0, 2, '#7d583c'); R(b, mx0, mt, mx1 - mx0, 1, '#9a7250'); R(b, mx0 + 2, mt + 2, 2, p.yz - mt - 2, '#5a3e2c'); R(b, mx1 - 4, mt + 2, 2, p.yz - mt - 2, '#5a3e2c');
        R(b, Math.round(W * 0.58), mt - 2, 8, 2, '#e8dfc8'); R(b, Math.round(W * 0.58) + 4, mt - 2, 1, 2, '#b8a888');
        kitaplar(b, Math.round(W * 0.54), Math.round(W * 0.54) + 4, mt, 5, 9);
        const lx = Math.round(W * 0.7); R(b, lx - 1, mt - 1, 3, 1, '#a07a3c'); R(b, lx, mt - 3, 1, 2, '#c49a50'); R(b, lx - 1, mt - 4, 3, 1, '#d8c8a0');
        if(gc) isik(b, lx, mt - 4, Math.round(H * 0.3), '!#f2bd66', 0.32);
      } },

    /* Okuma ve yazı: hattat odası — rahle, divit, sivri kemerli pencere, kandil */
    hattat:{ ic:true,
      yer(o){
        const { W, H } = o;
        o.p = { wx0:Math.round(W * 0.72), wx1:Math.round(W * 0.86), wy0:Math.round(H * 0.2), wy1:Math.round(H * 0.62), yz:Math.round(H * 0.76) };
        if(o.gece) o.sakin.push({ tur:'mum', x:Math.round(W * 0.56) + 2, y:o.p.yz - 6, s:7 });
        else o.sakin.push({ tur:'toz', x:o.p.wx0 - Math.round(W * 0.08), y:o.p.wy1, w:Math.round(W * 0.08), h:o.p.yz - o.p.wy1, kay:-3, n:4, T:16, s:9, c:'!#f6e4b8' });
      },
      ciz(b, o){
        const { W, H } = o, p = o.p, gc = o.gece, kag = gc ? '#bfb092' : '#ece3cc', mur = '#2a2420';
        duvar(b, o, p.yz, gc ? '#a48c6a' : '#cbb690', gc ? '#8c7454' : '#b39d78', gc ? W * 0.6 : (p.wx0 + p.wx1) / 2);
        R(b, 0, p.yz - Math.round(H * 0.1), W, 1, '#9a7f5c');
        R(b, 0, p.yz, W, H - p.yz, '#7c3730');
        for(let y = p.yz + 2; y < H - 1; y += 4) for(let x = (y >> 1) % 6; x < W; x += 6){ px(b, x, y, '#b0763c'); px(b, x + 1, y + 1, '#b0763c'); px(b, x - 1, y + 1, '#b0763c'); }
        R(b, 0, p.yz, W, 1, '#5a2a26');
        /* kemerli pencere, kafesli */
        const ww = p.wx1 - p.wx0, wh = p.wy1 - p.wy0;
        kemer(b, p.wx0 - 2, p.wy1 + 2, ww + 4, wh + 4, '#5a4232');
        const ust = b.d.slice();
        pencere(b, o, p.wx0, p.wy0, p.wx1, p.wy1, { uzak:'#8a8a7a', minare:'#8f8676', cisim:true });
        for(let y = p.wy0; y < p.wy1; y++) for(let x = p.wx0; x < p.wx1; x++){ const t = (p.wy1 - y) / wh, k = t < 0.6 ? 1 : Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.6) / 0.4, 2))); if(Math.abs(x - p.wx0 + 0.5 - ww / 2) > ww * k / 2) b.d[y * W + x] = ust[y * W + x]; }
        R(b, Math.round((p.wx0 + p.wx1) / 2), p.wy0 + 2, 1, wh - 2, '#5a4232'); R(b, p.wx0, p.wy0 + Math.round(wh * 0.55), ww, 1, '#5a4232');
        R(b, p.wx0 - 3, p.wy1 + 2, ww + 6, 2, '#8a6a48');
        if(!gc) for(let y = p.wy1 + 4; y < H; y++){ const k = y - p.wy1; for(let x = Math.round(p.wx0 - k * 0.9); x < p.wx1 - k * 0.6; x++) if(bay(x, y) < 0.42) ortu(b, x, y, '!#fff0c8', 0.2); }
        /* duvarda hat levhası: altın pervaz, kâğıt, iki satır yazı */
        const lx0 = Math.round(W * 0.5), lx1 = Math.round(W * 0.64), ly0 = Math.round(H * 0.24), ly1 = Math.round(H * 0.5);
        R(b, lx0 - 2, ly0 - 2, lx1 - lx0 + 4, ly1 - ly0 + 4, '#5a4232'); R(b, lx0 - 1, ly0 - 1, lx1 - lx0 + 2, ly1 - ly0 + 2, '#c69a48');
        R(b, lx0, ly0, lx1 - lx0, ly1 - ly0, gc ? '#8a6e50' : '#e8dcc0');
        R(b, lx0 + 2, ly0 + 2, lx1 - lx0 - 4, ly1 - ly0 - 4, kag);
        /* hat: elif dikmeleri, kalın taban çanağı, noktalar (okunmaz, yazı izlenimi) */
        const hx0 = lx0 + 4, hx1 = lx1 - 4, hw = hx1 - hx0, hy = ly0 + Math.round((ly1 - ly0) * 0.68);
        for(let i = 0; i <= hw; i++){ const t = i / hw, d = Math.round(Math.sin(t * Math.PI) * 3); R(b, hx0 + i, hy + d, 1, t > 0.15 && t < 0.85 ? 2 : 1, mur); }
        [0.12, 0.3, 0.42, 0.66, 0.8].forEach((t, n) => { const x = hx0 + Math.round(hw * t), h = Math.round((ly1 - ly0) * (n % 2 ? 0.34 : 0.5)), d = Math.round(Math.sin(t * Math.PI) * 3); R(b, x, hy + d - h, 1, h, mur); px(b, x + 1, hy + d - h, mur); });
        [[0.22, 0.3], [0.54, 0.26], [0.92, 0.36]].forEach(q => R(b, hx0 + Math.round(hw * q[0]), ly0 + Math.round((ly1 - ly0) * q[1]), 2, 1, mur));
        R(b, hx0 + Math.round(hw * 0.5), hy - 3, 3, 1, '#7a3a33');
        px(b, Math.round((lx0 + lx1) / 2), ly0 - 4, '#c69a48'); R(b, Math.round((lx0 + lx1) / 2), ly0 - 3, 1, 1, '#5a4232');
        /* rahle: çapraz ayaklar, üstünde açık kitap */
        const rx = Math.round(W * 0.68), ry = p.yz - 1, rh = Math.max(8, Math.round(H * 0.18));
        for(let j = 0; j < rh; j++){ px(b, rx - rh * 0.45 + j * 0.9, ry - j, '#6e4a30'); px(b, rx + rh * 0.45 - j * 0.9, ry - j, '#8a5e3c'); }
        const kx = rx - Math.round(rh * 0.65), ky = ry - rh + 1, kw = Math.round(rh * 1.3);
        for(let i = 0; i < kw; i++){ const y = ky - Math.round(Math.sin(i / kw * Math.PI) * 2.5); px(b, kx + i, y, kag); px(b, kx + i, y + 1, i % 3 ? '#e2d6ba' : '#3a2e2a'); px(b, kx + i, y + 2, '#7a3a33'); }
        /* alçak yazı masası: kâğıt, hokka, kamış kalem */
        const sx = Math.round(W * 0.56), sy = p.yz - 4, sw = Math.round(W * 0.08);
        R(b, sx, sy, sw, 4, '#6a4a32'); R(b, sx, sy, sw, 1, '#8a6444'); R(b, sx + 1, sy + 4, 1, 1, '#4a3222'); R(b, sx + sw - 2, sy + 4, 1, 1, '#4a3222');
        R(b, sx + 3, sy - 1, Math.round(sw * 0.5), 1, kag); for(let i = 0; i < sw * 0.4; i += 2) px(b, sx + 4 + i, sy - 1, mur);
        R(b, sx + sw - 6, sy - 3, 3, 3, '#2a2624'); px(b, sx + sw - 5, sy - 3, '#4a5a7a');
        for(let i = 0; i < 5; i++) px(b, sx + sw - 8 + i, sy - 2 - (i >> 1), '#c8a050');
        if(gc) isik(b, sx + 2, sy - 8, Math.round(H * 0.22), '!#f1b860', 0.3);
        R(b, Math.round(W * 0.47), p.yz - 3, 9, 3, '#3c5a7a'); R(b, Math.round(W * 0.47), p.yz - 3, 9, 1, '#5a7a9a'); R(b, Math.round(W * 0.47) + 1, p.yz - 5, 7, 2, '#7a3a33');
      } },

    /* Not: yazı masası — açık defter, kalem, mum, sabah penceresi */
    yazi:{ ic:true,
      yer(o){
        const { W, H } = o;
        o.p = { wx0:Math.round(W * 0.6), wx1:Math.round(W * 0.82), wy0:Math.round(H * 0.28), wy1:Math.round(H * 0.6), yz:Math.round(H * 0.84), mt:Math.round(H * 0.68) };
        if(o.gece) o.sakin.push({ tur:'mum', x:Math.round(W * 0.84), y:o.p.mt - 6, s:11 });
      },
      ciz(b, o){
        const { W, H } = o, p = o.p, gc = o.gece;
        duvar(b, o, p.yz, gc ? '#9a8a74' : '#c7b89c', gc ? '#82725c' : '#ae9f84', gc ? W * 0.84 : (p.wx0 + p.wx1) / 2);
        R(b, 0, p.yz, W, H - p.yz, '#5e4434'); R(b, 0, p.yz, W, 1, '#4a3428');
        R(b, p.wx0 - 2, p.wy0 - 2, p.wx1 - p.wx0 + 4, p.wy1 - p.wy0 + 4, '#5c4434');
        pencere(b, o, p.wx0, p.wy0, p.wx1, p.wy1, { uzak:'#6f8070', cisim:true });
        for(let i = 1; i < 3; i++) R(b, p.wx0 + Math.round((p.wx1 - p.wx0) * i / 3), p.wy0, 1, p.wy1 - p.wy0, '#5c4434');
        R(b, p.wx0, Math.round((p.wy0 + p.wy1) / 2), p.wx1 - p.wx0, 1, '#5c4434');
        R(b, p.wx0 - 3, p.wy1 + 2, p.wx1 - p.wx0 + 6, 1, '#7c6048');
        const sx = p.wx1 - 6; R(b, sx, p.wy1 - 1, 4, 3, '#9a5a3c'); R(b, sx + 1, p.wy1 - 4, 1, 3, '#5d7a46'); R(b, sx + 2, p.wy1 - 5, 1, 4, '#6f8c52'); px(b, sx, p.wy1 - 3, '#5d7a46');
        const mx0 = Math.round(W * 0.54), mx1 = Math.round(W * 0.92);
        R(b, mx0, p.mt, mx1 - mx0, 3, '#7a5236'); R(b, mx0, p.mt, mx1 - mx0, 1, '#9c7048'); R(b, mx0 + 2, p.mt + 3, 2, p.yz - p.mt - 3, '#553a28'); R(b, mx1 - 4, p.mt + 3, 2, p.yz - p.mt - 3, '#553a28');
        if(!gc) for(let y = p.wy1 + 3; y < p.mt; y++) for(let x = p.wx0 - (y - p.wy1); x < p.wx1; x++) if(bay(x, y) < 0.35) ortu(b, x, y, '!#fff2cc', 0.18);
        const dx = Math.round(W * 0.66), dw = Math.max(10, Math.round(W * 0.06));
        R(b, dx, p.mt - 2, dw, 2, '#efe7d4'); R(b, dx + (dw >> 1), p.mt - 2, 1, 2, '#bcae90');
        for(let i = 1; i < dw - 1; i += 2) if(i !== dw >> 1) px(b, dx + i, p.mt - 2, '#9a9080');
        for(let i = 0; i < 6; i++) px(b, dx + dw + 2 + i, p.mt - 2 - (i >> 1), i < 4 ? '#3a3230' : '#d8c8a0');
        R(b, Math.round(W * 0.58), p.mt - 3, 6, 3, '#4a5a6e'); R(b, Math.round(W * 0.58), p.mt - 4, 6, 1, '#7a3a33');
        const cx = Math.round(W * 0.84); R(b, cx - 2, p.mt - 1, 5, 1, '#a07a3c'); R(b, cx, p.mt - 5, 1, 4, '#ece6d6');
        if(gc) isik(b, cx, p.mt - 7, Math.round(H * 0.32), '!#f2bd66', 0.32);
      } },

    /* Dil: kervansaray — taç kapı, yol, kapıya varan kervan */
    kervansaray:{ gok:'gun', ufuk:0.62, gyy:0.3, gx:0.62,
      yer(o){
        const { W, H } = o, z = o.ufuk, bt = z + Math.round(H * 0.12), kx = Math.round(W * 0.7);
        o.p = { xa:Math.round(W * 0.5), bt, wh:Math.round(H * 0.17), kx };
        o.sakin.push({ tur:'kervan', x0:W + 4, x1:kx - 40, dur:kx, y:bt - 4 + Math.round(H * 0.04), n:3, T:90, c:'#5d4a3a' });
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.hz;
        sirt(b, { y:z, amp:H * 0.2, f:0.02, s:61, sivri:1.4, c:karis('#7a8094', hz, 0.48), i:karis('#a8acb8', hz, 0.42) });
        sirt(b, { y:z + 2, amp:H * 0.05, f:0.04, s:62, c:karis('#a89070', hz, 0.3) });
        zemin(b, z + Math.round(H * 0.03), ['#c2aa7e', '#b29b72', '#a08b66', '#8d7a59'], 63);
        otlar(b, o, z + (H - z) * 0.5, Math.round(W / 10), '#8a7a52', 64);
        const yy = p.bt + Math.round(H * 0.04);
        R(b, p.kx, yy - 1, W - p.kx, 3, '#d4c09a'); R(b, p.kx, yy + 2, W - p.kx, 1, '#b8a47e');
        R(b, p.xa, p.bt - p.wh, W - p.xa, p.wh, '#c4ae8a'); R(b, p.xa, p.bt - p.wh, W - p.xa, 1, '#a8946f');
        for(let y = p.bt - p.wh + 3; y < p.bt; y += 3) for(let x = p.xa + ((y >> 1) % 4); x < W; x += 8) R(b, x, y, 3, 1, '#b8a27e');
        R(b, p.xa, p.bt - p.wh, 1, p.wh, '#96835f');
        const bw = Math.max(3, Math.round(H * 0.045));
        for(let x = p.xa + Math.round(W * 0.06); x < W; x += Math.round(W * 0.085)){ if(Math.abs(x - p.kx) < H * 0.16) continue; R(b, x, p.bt - p.wh - 1, bw, p.wh + 1, '#ccb692'); R(b, x, p.bt - p.wh - 1, 1, p.wh + 1, '#a08c68'); R(b, x + 1, p.bt - p.wh - 2, bw - 2, 1, '#ccb692'); }
        const kw = Math.max(9, Math.round(H * 0.2)), kh = p.wh + Math.round(H * 0.14), k0 = p.kx - (kw >> 1);
        R(b, k0, p.bt - kh, kw, kh, '#d2bc96'); R(b, k0, p.bt - kh, Math.round(kw * 0.25), kh, '#ac9672');
        for(let y = p.bt - kh + 1; y < p.bt; y++) for(const x of [k0 + 1, k0 + kw - 2]) if((y + x) % 2) px(b, x, y, '#9a8462');
        for(let x = k0 + 1; x < k0 + kw - 1; x++) if(x % 2) px(b, x, p.bt - kh + 1, '#9a8462');
        const aw = kw - 6, ah = kh - 5;
        kemer(b, k0 + 3, p.bt - 1, aw, ah, '#8c7658');
        for(let j = 0; j < 3; j++) for(let i = 0; i < aw - 2; i += 2) px(b, k0 + 4 + i + (j % 2), p.bt - ah + 2 + j * 2, '#a89070');
        const dw = Math.max(3, Math.round(aw * 0.5)), dh = Math.round(ah * 0.5);
        kemer(b, p.kx - (dw >> 1), p.bt - 1, dw, dh, o.gece ? '!#eab062' : '#3a3028');
        if(o.gece) isik(b, p.kx, p.bt, Math.round(H * 0.14), '!#d89a52', 0.25);
      } },

    /* Müzik: bozkırda ateş başı — kopuzlu ozan, kıvılcım, duman */
    ates:{ gok:'aksam', ufuk:0.62, gyy:0.42,
      yer(o){
        const { W, H } = o, z = o.ufuk, fx = Math.round(W * 0.7), fy = z + Math.round((H - z) * 0.45);
        o.p = { fx, fy };
        o.sakin.push({ tur:'alev', x:fx - 2, y:fy - 6 });
        o.sakin.push({ tur:'kivilcim', x:fx, y:fy - 7, L:Math.round(H * 0.14) });
        dumanEkle(o, fx, fy - 8 - Math.round(H * 0.05), Math.round(H * 0.18), 9);
        atEkle(o, fx + Math.round(W * 0.1), z + (H - z) * 0.4, 2, true);
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.hz;
        sirt(b, { y:z, amp:H * 0.09, f:0.018, s:71, c:karis('#5a5276', hz, 0.42), i:karis('#8a7088', hz, 0.4) });
        zemin(b, z + 1, ['#7a6658', '#6a5a50', '#5b4f49', '#4c4442'], 72);
        otlar(b, o, z + (H - z) * 0.4, Math.round(W / 10), '#4a3f3a', 73);
        otag(b, o, Math.round(W * 0.88), z + 5, Math.max(3, Math.round(H * 0.06)), 0.2);
        isik(b, p.fx, p.fy - 2, Math.round(H * (o.gece ? 0.22 : 0.15)), '!#e58c50', o.gece ? 0.4 : 0.25);
        [[-4, 0], [-3, 1], [-1, 1], [1, 1], [3, 1], [4, 0]].forEach(d => px(b, p.fx + d[0], p.fy + d[1], '#8a8078'));
        R(b, p.fx - 3, p.fy, 7, 1, '#3a2a22'); R(b, p.fx - 2, p.fy - 1, 5, 1, '#5a3a26');
        spr(b, p.fx - 18, p.fy - 10, POZ.ozan.k[0], {}, false);
        if(o.gece) [[-8, -5], [-7, -6], [-8, -2], [-9, -1]].forEach(d => px(b, p.fx + d[0], p.fy + d[1], '!#e09a5a'));
      } },

    /* Hareket, Sağlık: dağ yaylası — karlı doruklar, yayla evleri, patika, sürü, kartal */
    yaylak:{ gok:'gun', ufuk:0.52, gyy:0.3, gx:0.86,
      yer(o){
        const { W, H } = o, z = o.ufuk, orta = { y:z + H * 0.16, amp:H * 0.14, f:0.026, s:82 };
        o.p = { orta, evler:[0.72, 0.79, 0.84].map((f, i) => { const x = Math.round(W * f); return [x, Math.round(yuk(orta, x)) + 2 + i]; }) };
        const e = o.p.evler[1]; dumanEkle(o, e[0] + 2, e[1] - Math.round(H * 0.07) - 2, Math.round(H * 0.12), 8);
        o.sakin.push({ tur:'kartal', x:Math.round(W * 0.66), y:Math.round(H * 0.24), r:Math.round(W * 0.06), T:30, c:o.gece ? '#1b2033' : '#3b3634' });
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.hz;
        sirt(b, { y:z + 2, amp:H * 0.34, f:0.02, s:81, sivri:1.7, c:karis('#64748e', hz, 0.42), i:karis('#9aa8bc', hz, 0.38), kar:['#eef1f0', '#b8c4d2', 0.58], dd:4 });
        sirt(b, Object.assign({ c:karis('#5f7c4e', hz, 0.22), i:karis('#7f9a5e', hz, 0.2) }, p.orta));
        const r = tohum(83);
        for(let i = 0; i < 9; i++){ const x = Math.round(W * (0.6 + r() * 0.34)), y = Math.round(yuk(p.orta, x)) + 3 + Math.floor(r() * H * 0.08); R(b, x, y, 2, 1, '#e6e4da'); px(b, x + (i % 2 ? 2 : -1), y, '#3a3632'); }
        for(let y = Math.round(yuk(p.orta, p.evler[1][0])) + 3; y < H; y++){ const f = (y - z - H * 0.16) / (H * 0.5), x = Math.round(p.evler[1][0] - f * W * 0.12 + Math.sin(f * 5) * W * 0.03); R(b, x, y, Math.max(1, Math.round(1 + f * 2)), 1, '#b4a37a'); }
        sirt(b, { y:z + H * 0.36, amp:H * 0.07, f:0.03, s:84, c:'#5e7a44', i:'#7a9656' });
        otlar(b, o, z + H * 0.36, Math.round(W / 8), '#4e6a3a', 85);
        for(let i = 0; i < W / 14; i++){ const x = Math.round(W * 0.55 + r() * W * 0.45), y = Math.round(H * 0.84 + r() * H * 0.14); px(b, x, y, i % 3 ? '#e8d27a' : '#d9a0b0'); }
        const hh = Math.max(3, Math.round(H * 0.06));
        p.evler.forEach(([x, y], i) => { const w = hh + 3; R(b, x - 1, y - 1, w + 2, 2, '#8e8576'); R(b, x, y - hh, w, hh - 1, '#7a5a3e'); R(b, x, y - hh, 1, hh - 1, '#5e4430'); for(let j = 0; j < 3; j++) R(b, x - 1 + j, y - hh - 1 - j, w + 2 - j * 2, 1, j ? '#55494a' : '#6f6260'); px(b, x + (w >> 1), y - hh + 1, o.gece && i !== 2 ? '!#efb45c' : '#3a2c22'); if(i === 1) R(b, x + 2, y - hh - 4, 1, 2, '#5a4e4a'); });
      } },

    /* Beslenme: su başı — çeşme, çınar, bostan */
    pinar:{ gok:'gun', ufuk:0.6, gyy:0.32, gx:0.62,
      yer(o){
        const { W, H } = o, z = o.ufuk, cx = Math.round(W * 0.68), cy = z + Math.round((H - z) * 0.5), cw = Math.max(8, Math.round(H * 0.15)), ch = Math.max(9, Math.round(H * 0.22));
        o.p = { cx, cy, cw, ch };
        o.sakin.push({ tur:'su', x:cx, y:cy - Math.round(ch * 0.42), L:Math.round(ch * 0.42) - 1, c:['#8ab8c6', '#e6f2f2'] });
        o.sakin.push({ tur:'parilti', x:cx - (cw >> 1) - 1, y:cy + 1, w:cw + 2, h:1, n:2, s:91, c:'#e8f4f4' });
        o.sakin.push({ tur:'kus', x0:Math.round(W * 0.98), x1:Math.round(W * 0.58), y:Math.round(H * 0.2), n:2, T:60, yol:0.5, faz:12, c:o.gece ? '#1b2033' : '#4a4644' });
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.hz;
        sirt(b, { y:z, amp:H * 0.12, f:0.018, s:92, c:karis('#6c8070', hz, 0.48), i:karis('#94a890', hz, 0.42) });
        zemin(b, z + 1, ['#9aa872', '#8a9a68', '#7a8c5e', '#6a7d54'], 93);
        for(let k = 0; k < 4; k++){ const y = Math.round(z + (H - z) * (0.25 + k * 0.16)), x0 = Math.round(W * (0.4 - k * 0.04)), x1 = Math.round(W * 0.58); R(b, x0, y, x1 - x0, 1, '#7e6c4c'); for(let x = x0 + (k % 2); x < x1; x += 2) px(b, x, y - 1, k % 2 ? '#5e7e3c' : '#6e8e46'); }
        const tx = Math.round(W * 0.86), ty = z + Math.round((H - z) * 0.36), th = Math.round(H * 0.4);
        R(b, tx - 1, ty - th * 0.7, 3, th * 0.7, '#cdbfa4'); R(b, tx - 1, ty - th * 0.7, 1, th * 0.7, '#a2957c'); for(let j = 4; j < th * 0.7; j += 5) px(b, tx, ty - j, '#9e9278');
        const r = tohum(94), tepe = ty - th;
        for(let i = 0; i < 14; i++){
          const a = r() * Math.PI, d = r(), cx = tx + Math.cos(a) * th * 0.5 * d * 1.2, cy = tepe + th * 0.3 + Math.sin(a) * -th * 0.22 * d + r() * th * 0.12, rr = th * (0.12 + r() * 0.08);
          for(let y = -rr; y <= rr; y++){ const w = Math.sqrt(rr * rr - y * y) * 1.3; for(let x = -w; x <= w; x++){ const isk = x / w - y / rr * 0.6; px(b, Math.round(cx + x), Math.round(cy + y), isk > 0.55 ? '#86a25c' : isk < -0.5 ? '#4b6638' : '#66844a'); } }
        }
        R(b, tx - Math.round(th * 0.6), ty, Math.round(th * 1.2), 1, '#5c6e44');
        const x0 = p.cx - (p.cw >> 1), y0 = p.cy - p.ch;
        R(b, x0, y0, p.cw, p.ch, '#dad3c3'); R(b, x0, y0, Math.round(p.cw * 0.22), p.ch, '#b5ad9b');
        R(b, x0 - 2, y0 - 2, p.cw + 4, 2, '#8a6c52'); R(b, x0 - 2, y0 - 2, p.cw + 4, 1, '#a4866a');
        R(b, x0 + 2, y0 + 1, p.cw - 4, 2, '#8c8a80'); for(let i = x0 + 3; i < x0 + p.cw - 3; i += 2) px(b, i, y0 + 1, '#e6e0d2');
        kemer(b, x0 + 2, p.cy - 1, p.cw - 4, Math.round(p.ch * 0.66), '#bdb4a0');
        R(b, p.cx - 1, p.cy - Math.round(p.ch * 0.42) - 1, 2, 1, '#a07a40');
        R(b, x0 - 2, p.cy, p.cw + 4, 3, '#c9c1ae'); R(b, x0 - 1, p.cy, p.cw + 2, 1, '#7fb0bf'); R(b, x0 - 2, p.cy + 3, p.cw + 4, 1, '#8e8878');
        if(o.gece){ const fx = p.cx + (p.cw >> 1) + 3; R(b, fx, y0 - 1, 1, 3, '#4a3a2a'); R(b, fx - 1, y0 + 2, 3, 3, '!#f0b65e'); isik(b, fx, y0 + 3, Math.round(H * 0.14), '!#e8a852', 0.22); }
      } },

    /* Uyku: gece çadırı — kara çadır, köz, uyuyan at, samanyolu */
    cadir:{ gok:'alaca', ufuk:0.62, gyy:0.36, yog:60, yildizGunduz:true,
      yer(o){
        const { W, H } = o, z = o.ufuk, cx = Math.round(W * 0.64), cy = z + Math.round((H - z) * 0.42);
        o.p = { cx, cy, cw:Math.max(18, Math.round(W * 0.15)), ch:Math.max(7, Math.round(H * 0.15)) };
        o.sakin.push({ tur:'mum', x:cx - 5, y:cy - 1, s:13 });
        dumanEkle(o, cx - 5, cy - 3, Math.round(H * 0.12), 10);
        atEkle(o, cx + o.p.cw + 4, cy, 2, true);
        yildizEkle(o);
        o.sakin.push({ tur:'kayan', x:Math.round(W * 0.88), y:Math.round(H * 0.14), T:37, faz:18 });
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.hz;
        for(let i = 0; i < W * z / 18; i++){ const f = hash(i, 101), x = Math.round(W * (0.52 + f * 0.48)), y = Math.round(z * (0.9 - f * 0.85) + (hash(i, 102) - 0.5) * H * 0.18); if(y > 0 && y < z - 3 && bay(x, y) < 0.5) px(b, x, y, o.gece ? '!#3a4670' : '!#7a7ea4'); }
        sirt(b, { y:z, amp:H * 0.1, f:0.02, s:103, c:karis('#3a3f5c', hz, 0.3), i:karis('#4c5272', hz, 0.3) });
        zemin(b, z + 1, ['#47495a', '#3f414f', '#373946', '#30323d'], 104);
        karaCadir(b, o, p.cx, p.cy, p.cw, p.ch);
        R(b, p.cx - 7, p.cy, 5, 1, '#5a4a42'); if(o.gece) isik(b, p.cx - 5, p.cy - 1, Math.round(H * 0.08), '!#c8703a', 0.25);
      } },

    /* Tahlil: şifahane — taç kapı, kümbet, servi, havuz */
    sifahane:{ gok:'gun', ufuk:0.72, gyy:0.3, gx:0.62,
      yer(o){
        const { W, H } = o, z = o.ufuk;
        o.p = { xa:Math.round(W * 0.58), xb:Math.round(W * 0.96), bh:Math.round(H * 0.24), kx:Math.round(W * 0.72), hy:z + Math.round((H - z) * 0.45) };
        o.sakin.push({ tur:'parilti', x:Math.round(W * 0.6), y:o.p.hy + 1, w:Math.round(W * 0.24), h:Math.max(1, Math.round(H * 0.04)), n:3, s:111, c:o.gece ? '#9ab0c8' : '#eef6f6' });
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.hz;
        sirt(b, { y:z, amp:H * 0.1, f:0.016, s:112, c:karis('#76808e', hz, 0.55), i:karis('#9ea6b0', hz, 0.5) });
        zemin(b, z, ['#a9a682', '#9a9876', '#8b8a6a', '#7c7c5e'], 113);
        R(b, p.xa, z - p.bh, p.xb - p.xa, p.bh + 1, '#cbbb9c'); R(b, p.xa, z - p.bh, Math.round((p.xb - p.xa) * 0.08), p.bh + 1, '#a5967a'); R(b, p.xa - 1, z - p.bh - 1, p.xb - p.xa + 2, 1, '#998a6e');
        for(let y = z - p.bh + 3; y < z; y += 3) R(b, p.xa, y, p.xb - p.xa, 1, '#bfae8e');
        for(let x = p.xa + 5; x < p.xb - 4; x += 9){ if(Math.abs(x - p.kx) < H * 0.16) continue; kemer(b, x, z - Math.round(p.bh * 0.35), 3, Math.round(p.bh * 0.32), o.gece && hash(x, 5) > 0.3 ? '!#e6ac5c' : '#5a4a3a'); }
        const kmx = Math.round(W * 0.9), kmw = Math.max(7, Math.round(H * 0.13)), kmh = Math.round(H * 0.12), kt = z - p.bh - kmh, kk = Math.round(H * 0.13);
        R(b, kmx - (kmw >> 1), kt, kmw, kmh, '#cdbd9e'); R(b, kmx - (kmw >> 1), kt, Math.round(kmw * 0.3), kmh, '#a5967a');
        for(let j = 0; j < kk; j++){ const w = Math.round((kmw / 2 + 1) * (1 - j / kk)); R(b, kmx - w, kt - 1 - j, w * 2 + 1, 1, '#7c848e'); R(b, kmx + Math.round(w * 0.1), kt - 1 - j, Math.round(w * 0.9) + 1, 1, '#a0a8b2'); }
        const tw = Math.max(9, Math.round(H * 0.2)), th = Math.round(H * 0.44), t0 = p.kx - (tw >> 1);
        R(b, t0, z - th, tw, th + 1, '#d6c7a8'); R(b, t0, z - th, Math.round(tw * 0.22), th + 1, '#ad9e82');
        for(let y = z - th + 1; y < z; y += 2){ px(b, t0 + 1, y, '#9e8e70'); px(b, t0 + tw - 2, y, '#9e8e70'); }
        for(let x = t0 + 1; x < t0 + tw - 1; x += 2) px(b, x, z - th + 1, '#9e8e70');
        const aw = tw - 6, ah = th - 5;
        kemer(b, t0 + 3, z - 1, aw, ah, '#8f7f64');
        for(let j = 0; j < 4; j++) for(let i = 0; i < aw - 2; i += 2) px(b, t0 + 4 + i + (j % 2), z - ah + 2 + j * 2, '#ab9b7c');
        kemer(b, p.kx - Math.round(aw * 0.25), z - 1, Math.max(2, Math.round(aw * 0.5)), Math.round(ah * 0.45), o.gece ? '!#ecb464' : '#3a3028');
        const servi = (x, h) => { for(let j = 0; j < h; j++){ const w = Math.round(Math.sin(Math.min(1, j / h * 1.25) * Math.PI) * 2.2 + 0.5); R(b, x - w, z - j, w * 2 + 1, 1, '#3d5840'); R(b, x + 1, z - j, Math.max(0, w), 1, '#557256'); } px(b, x, z, '#4a3a2a'); };
        servi(Math.round(W * 0.53), Math.round(H * 0.4)); servi(Math.round(W * 0.555), Math.round(H * 0.3));
        const hw = Math.max(2, Math.round(H * 0.05));
        R(b, Math.round(W * 0.59), p.hy - 1, Math.round(W * 0.26), hw + 2, '#d8ccb0');
        R(b, Math.round(W * 0.6), p.hy, Math.round(W * 0.24), hw, '#86aebb');
        if(o.gece) isik(b, p.kx, z - 2, Math.round(H * 0.16), '!#d89a52', 0.22);
      } },

    /* King: otağ içi — kerege, uyk direkleri, taht, iki tuğ; gündüz tündükten ışık, gece mangal */
    taht:{ ic:true,
      yer(o){
        const { W, H } = o, tx = Math.round(W * 0.72), yz = Math.round(H * 0.8), th = Math.round(H * 0.42), L = Math.max(4, Math.round(H * 0.1));
        o.p = { tx, yz, dy:Math.round(H * 0.36), tug:th };
        [tx - Math.round(H * 0.3), tx + Math.round(H * 0.3)].forEach((x, i) => o.sakin.push({ tur:'tug', x, y:yz - th + 2, L, faz:i * 0.7, c:['#efe8da', '#b8b0a2'] }));
        if(o.gece){ o.sakin.push({ tur:'alev', x:Math.round(W * 0.56) - 1, y:yz - 6 }); o.sakin.push({ tur:'kivilcim', x:Math.round(W * 0.56), y:yz - 7, L:Math.round(H * 0.12) }); }
        else o.sakin.push({ tur:'toz', x:tx - Math.round(H * 0.12), y:Math.round(H * 0.1), w:Math.round(H * 0.2), h:yz - Math.round(H * 0.2), kay:-Math.round(H * 0.1), n:5, T:18, s:121, c:'!#f6e2b0' });
      },
      ciz(b, o){
        const { W, H } = o, p = o.p, gc = o.gece;
        for(let y = 0; y < p.dy; y++) for(let x = 0; x < W; x++) px(b, x, y, bay(x, y) < y / p.dy * 0.6 ? '#7a352c' : '#5e2924');
        const ux = p.tx + Math.round(W * 0.04), uy = -Math.round(H * 0.5);
        for(let i = -14; i <= 14; i++){ const ex = ux + i * W * 0.06; for(let y = 0; y < p.dy; y++){ const x = Math.round(ux + (ex - ux) * (y - uy) / (p.dy - uy)); if(x >= 0 && x < W) px(b, x, y, x < W * 0.45 ? '#7e4a30' : '#a0683a'); } }
        R(b, 0, p.dy, W, 2, '#c69a48'); R(b, 0, p.dy + 2, W, 1, '#7a3a2a');
        for(let y = p.dy + 3; y < p.yz; y++) for(let x = 0; x < W; x++) px(b, x, y, ((x + y) % 6 === 0 || (x - y + 600) % 6 === 0) ? '#86503a' : '#6c3229');
        const hx0 = p.tx - Math.round(H * 0.22), hx1 = p.tx + Math.round(H * 0.22), hy0 = p.dy + 4;
        R(b, hx0, hy0, hx1 - hx0, p.yz - hy0, '#2c4570'); R(b, hx0, hy0, hx1 - hx0, 1, '#c69a48'); R(b, hx0, hy0, 1, p.yz - hy0, '#c69a48'); R(b, hx1 - 1, hy0, 1, p.yz - hy0, '#c69a48');
        for(let y = hy0 + 4; y < p.yz - 4; y += 6) for(let x = hx0 + 4; x < hx1 - 4; x += 6){ px(b, x, y, '#c69a48'); px(b, x + 1, y + 1, '#c69a48'); px(b, x - 1, y + 1, '#c69a48'); px(b, x, y + 2, '#c69a48'); }
        R(b, 0, p.yz, W, H - p.yz, '#7e2a26');
        for(let x = 0; x < W; x += 4){ px(b, x, p.yz + 2, '#c69a48'); px(b, x + 1, p.yz + 3, '#c69a48'); }
        R(b, 0, p.yz, W, 1, '#4e1c1a');
        const sw = Math.round(H * 0.34), sx = p.tx - (sw >> 1), sy = p.yz - Math.round(H * 0.05), oh = Math.round(H * 0.07);
        R(b, sx - 3, sy, sw + 6, p.yz - sy, '#8a5a34'); R(b, sx - 3, sy, sw + 6, 1, '#c69a48');
        R(b, sx, sy - oh, sw, oh, '#b8873e'); R(b, sx, sy - oh, Math.round(sw * 0.2), oh, '#8a6430');
        R(b, sx + 2, sy - Math.round(H * 0.18), sw - 4, Math.round(H * 0.11), '#c69a48'); R(b, sx + 3, sy - Math.round(H * 0.17), sw - 6, Math.round(H * 0.09), '#2c4570');
        R(b, sx + 2, sy - Math.round(H * 0.09), sw - 4, 2, '#3c5c8c');
        [p.tx - Math.round(H * 0.3), p.tx + Math.round(H * 0.3)].forEach(x => { R(b, x, p.yz - p.tug, 1, p.tug, '#5a3c26'); R(b, x - 1, p.yz - p.tug - 2, 3, 2, '#d8b456'); px(b, x, p.yz - p.tug - 3, '#efd27a'); R(b, x - 2, p.yz - p.tug + 1, 5, 1, '#c69a48'); });
        if(!gc) for(let y = 0; y < p.yz; y++){ const cx = p.tx + Math.round(W * 0.06) - y * 0.32, w = 3 + y * 0.12; for(let x = Math.round(cx - w); x < cx + w; x++) if(bay(x, y) < 0.5) ortu(b, x, y, '!#ffe2a8', 0.2); }
        if(gc){ const mx = Math.round(W * 0.56); R(b, mx - 3, p.yz - 2, 7, 2, '#5a4a3a'); R(b, mx - 2, p.yz, 1, 2, '#4a3a2a'); R(b, mx + 2, p.yz, 1, 2, '#4a3a2a'); isik(b, mx, p.yz - 4, Math.round(H * 0.34), '!#f0a050', 0.34); }
      } },
  };
  /* eski sahne adları (kabuk Bugün'e 'yayla' der; piksel.js ve sinematik.js eski adları kullanır) */
  const ESKI = Object.freeze({ yayla:'otuken', dag:'yaylak', tarla:'ufuk', kiraz:'pinar', gol:'pinar', selale:'pinar', deniz:'kervansaray', col:'kervansaray', magara:'medrese', kis:'cadir' });
  const TUR_LISTE = Object.freeze(Object.keys(SAHNE));

  function yerlesim(W, H, v, tur){
    const ad = SAHNE[tur] ? tur : ESKI[tur] || 'otuken', S = SAHNE[ad], gc = v === 'gece';
    const o = { tur:ad, W, H, vakit:gc ? 'gece' : 'gunduz', gece:gc, sakin:[], imza:'' };
    o.Gd = GOK[S.gok || 'gun']; o.G = gc ? GOK.gece : o.Gd; o.hz = o.Gd.g[o.Gd.g.length - 1];
    o.ufuk = Math.round(H * (S.ufuk || 0.62));
    o.gr = kis(Math.round(H * 0.045), 3, 5);
    /* gök cismi üst çubuğun altında: çubuk ~56 px; telefonda tuval 2×, masaüstünde 3× büyür (kabuk.js manzara) */
    const tel = typeof innerWidth === 'number' ? innerWidth < 640 : W < 220, ust = Math.round(56 / (tel ? 2 : 3)) + o.gr + 3;
    o.gy = [Math.round(W * (tel ? S.gxt || 0.6 : S.gx || 0.8)), Math.min(o.ufuk - 2, Math.max(ust, Math.round(H * (S.gyy || 0.34))))];
    o.yildizlar = [];
    if(gc || S.yildizGunduz){
      const r = tohum(adTohum(ad) + W * 13 + H), n = Math.round(W * o.ufuk / (S.yog || 95));
      for(let i = 0; i < n; i++){ const x = Math.floor(r() * W), y = Math.floor(r() * o.ufuk * 0.9), q = r(); if(x < W * 0.5 && y < o.ufuk * 0.55 && r() < 0.7) continue; if(Math.hypot(x - o.gy[0], y - o.gy[1]) < o.gr * 3) continue; o.yildizlar.push([x, y, q < 0.12 ? 2 : q < 0.45 ? 1 : 0, x > W * 0.55 && q < 0.04]); }
    }
    o.bulutlar = [];
    if(!S.ic){ const r = tohum(adTohum(ad) + 5); for(let i = 0; i < 3; i++){ const w = Math.round(W * (0.05 + r() * 0.07)), x = Math.round(W * (0.46 + r() * 0.5)), y = Math.round(o.ufuk * (0.18 + r() * 0.3)); if(Math.abs(x + w / 2 - o.gy[0]) < w / 2 + o.gr * 3 && Math.abs(y - o.gy[1]) < o.gr * 3) continue; o.bulutlar.push([x, y, w]); } }
    S.yer(o);
    return o;
  }
  function binaCiz(g, o){
    const b = tampon(o.W, o.H), S = SAHNE[o.tur];
    gece = o.gece;
    if(!S.ic){
      gok(b, o, o.ufuk + 2);
      yildizCiz(b, o);
      gokCismi(b, o, o.gy[0], o.gy[1], o.gr);
      o.bulutlar.forEach(q => bulut(b, q[0], q[1], q[2], o.G.bulut.map(c => '!' + c)));
    }
    S.ciz(b, o);
    g.putImageData(new ImageData(new Uint8ClampedArray(b.d.buffer), o.W, o.H), 0, 0);
  }
  /* Hareket azsa (uygulama ayarı ya da işletim sistemi) sahne t = 0'da durur: her çağrıda aynı kare */
  function durgun(){
    try{
      const h = document.documentElement.getAttribute('data-hareket');   // kabuğun ayarı (az · tam · sistem), piksel.js ile aynı sıra
      if(h === 'az' || h === 'tam') return h === 'az';
      if(L.hareketAz) return !!L.hareketAz();
      return !!window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    }catch(e){ return false; }
  }
  function kare(g, arka, o, t){
    if(durgun()) t = 0;
    g.imageSmoothingEnabled = false;
    const k = o.sakin.map(s => kareAl(s, t)), imza = k.join('|');
    if(imza === o.imza) return 0;
    o.imza = imza;
    gece = o.gece;
    g.drawImage(arka, 0, 0);
    o.sakin.forEach((s, i) => HAREKET[s.tur].ciz(g, s, k[i], o));
    return 1;
  }
  L.PIKSEL_DOGA = Object.freeze({ vakit, yerlesim, binaCiz, kare, kareAl, durgun, POZ, PALET:GOK, P_SABIT, TUR_LISTE, ESKI, INSAN:Object.freeze(INSAN.slice()) });
})(window.LIFEOS);
