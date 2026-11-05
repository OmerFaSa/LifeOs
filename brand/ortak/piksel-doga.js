/* PİKSEL MANZARA — tarla, dağ, mağara, göl, deniz, orman, şelale, kış, çöl, kiraz vadisi.
   Seçim sayfasının arka planı tarladır; yüklenme ekranları sırayla ötekileri gösterir (2026-11-05, depo sahibinin isteği).
   Modüllerin içi mahalledir (piksel-apartman.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/piksel-doga.js`; `python3 tools/ortak.py --yay` ile üç arayüze kopyalanır, giriş sayfası da yükler.

   Sözler: süstür, veri okumaz, sayı üretmez; kodla çizilir; sahne bir kez çizilir; kare saatten hesaplanır.
   Çizim kuralları: ışık sol üstten gelir, uzak olan açık ve mavidir, doku kümelenir (tek tek gürültü değil),
   renk geçişi titreşimle (Bayer) olur, gölge tonu rengi değiştirir (siyaha gitmez). */
window.LIFEOS = window.LIFEOS || {};

(function(L){
  const vakit = saat => (saat < 6 || saat >= 22 ? 'gece' : saat < 9 ? 'dogum' : saat < 17 ? 'ogle' : 'batim');
  const PALET = {
    dogum:{ gok:['#6f82c8', '#9098d8', '#b8a4dc', '#dcb0cc', '#f4bcb0', '#fccfa8', '#fde4b8', '#fff2d0'], gunes:'#fff6d0', hale:'#ffe6b8', bulut:['#fff4e4', '#fbd4c4', '#d8a4b8'], amb:[1, 0.92, 0.9], kisi:0.98, gunesYeri:[0.22, 0.27] },
    ogle:{ gok:['#3f97e0', '#55a8e6', '#6db7ec', '#86c6f0', '#a0d4f4', '#b9e1f6', '#d0ecf8', '#e6f6fa'], gunes:'#fffde0', hale:'#fff8c8', bulut:['#ffffff', '#e4eff8', '#b4cce4'], amb:[1, 1, 1], kisi:1, gunesYeri:[0.74, 0.13] },
    batim:{ gok:['#3f3f88', '#6a549c', '#9a5e9e', '#cc6a94', '#ec7f80', '#f8a074', '#fcc27c', '#fee09a'], gunes:'#fff4c4', hale:'#ffd798', bulut:['#ffe4c8', '#f6a89c', '#a8608c'], amb:[1, 0.82, 0.74], kisi:0.95, gunesYeri:[0.76, 0.36] },
    gece:{ gok:['#070820', '#0c0e30', '#121540', '#191c52', '#232462', '#322c70', '#44347c', '#5c4288'], gunes:'#f4f2dc', hale:'#8c86b8', bulut:['#5a5894', '#3e3a74', '#2a2856'], amb:[0.36, 0.4, 0.62], kisi:0.5, gunesYeri:[0.74, 0.15] },
  };
  /* ---------- TAMPON: piksel doğrudan yazılır; karanlık ve sıcaklık renge sorulurken uygulanır ---------- */
  let AMB = [1, 1, 1], onrenk = new Map();
  const ambAyarla = a => { AMB = a; onrenk = new Map(); };
  function renk(h){
    let v = onrenk.get(h);
    if(v !== undefined) return v;
    const ham = h[0] === '!', n = parseInt(h.slice(ham ? 2 : 1, ham ? 8 : 7), 16), A = ham ? [1, 1, 1] : AMB;
    v = ((255 << 24) | (Math.round((n & 255) * A[2]) << 16) | (Math.round(((n >> 8) & 255) * A[1]) << 8) | Math.round((n >> 16) * A[0])) >>> 0;
    onrenk.set(h, v);
    return v;
  }
  const tampon = (W, H) => ({ W, H, d:new Uint32Array(W * H) });
  const px = (b, x, y, c) => { x = Math.round(x); y = Math.round(y); if(x >= 0 && y >= 0 && x < b.W && y < b.H) b.d[y * b.W + x] = renk(c); };
  function R(b, x, y, w, h, c){ const v = renk(c), x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y)), x1 = Math.min(b.W, Math.round(x + w)), y1 = Math.min(b.H, Math.round(y + h)); for(let j = y0; j < y1; j++) b.d.fill(v, j * b.W + x0, j * b.W + x1); }
  function daire(b, cx, cy, r, c){ for(let y = -r; y <= r; y++){ const w = Math.round(Math.sqrt(r * r - y * y)); R(b, cx - w, cy + y, w * 2 + 1, 1, c); } }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const bay = (x, y) => BAYER[(x & 3) + (y & 3) * 4];
  /* Örtü: var olan pikselin üstüne yarı saydam; yalnız ışık ve sis için */
  function ortu(b, x, y, c, a){ x = Math.round(x); y = Math.round(y); if(x < 0 || y < 0 || x >= b.W || y >= b.H) return; const i = y * b.W + x, o = b.d[i], n = renk(c); const k = (s) => Math.round(((o >> s) & 255) * (1 - a) + ((n >> s) & 255) * a) << s; b.d[i] = ((255 << 24) | k(16) | k(8) | k(0)) >>> 0; }
  const hash = (i, s) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
  const sm = t => t * t * (3 - 2 * t);
  function g1(x, s){ const i = Math.floor(x), f = sm(x - i); return hash(i, s) * (1 - f) + hash(i + 1, s) * f; }
  function g2(x, y, s){ const i = Math.floor(x), j = Math.floor(y), u = sm(x - i), v = sm(y - j), h = (a, c) => hash(a + c * 57.31, s); return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v; }
  function tohum(s){ let v = s; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; }

  /* ---------- GÖK ---------- */
  function gokCiz(b, o, boy){
    const dur = o.P.gok, n = dur.length - 1;
    for(let y = 0; y < boy; y++){
      const f = y / boy * n, i = Math.min(n, Math.floor(f)), k = Math.max(0, Math.min(1, ((f - i) - 0.25) / 0.5)), A = renk('!' + dur[i]), B = renk('!' + dur[Math.min(n, i + 1)]);
      for(let x = 0; x < b.W; x++) b.d[y * b.W + x] = k > bay(x, y) ? B : A;
    }
  }
  function gunesCiz(b, o){
    const { P, W, H, gece } = o, sx = Math.round(W * P.gunesYeri[0]), sy = Math.round(H * P.gunesYeri[1]), r = Math.round(H * 0.035);
    for(let y = -r * 4; y <= r * 4; y++) for(let x = -r * 4; x <= r * 4; x++){ const d = Math.hypot(x, y) / r; if(d > 1 && d < 4){ const a = Math.ceil((1 - (d - 1) / 3) ** 2 * 5) / 5 * 0.42; if(a > 0) ortu(b, sx + x, sy + y, '!' + P.hale, a); } }
    daire(b, sx, sy, r, '!' + P.gunes);
    if(gece){ daire(b, sx + Math.round(r * 0.45), sy - Math.round(r * 0.3), Math.round(r * 0.8), '!' + P.gok[1]); [[-3, 1], [-1, -3], [2, 3]].forEach(q => R(b, sx + q[0] - 4, sy + q[1], 2, 2, '!#d8d6c0')); }
  }
  function yildizCiz(b, o, boy){
    if(!o.gece) return;
    const a = tohum(7);
    for(let i = 0; i < o.W * boy / 340; i++){ const x = a() * o.W, y = a() * boy * 0.9, q = a(); px(b, x, y, q < 0.2 ? '!#ffffff' : q < 0.6 ? '!#c9c6e8' : '!#8a88c0'); if(q < 0.05){ px(b, x + 1, y, '!#8a88c0'); px(b, x - 1, y, '!#8a88c0'); px(b, x, y + 1, '!#8a88c0'); px(b, x, y - 1, '!#8a88c0'); } }
    /* Samanyolu */
    for(let i = 0; i < o.W * 1.2; i++){ const t = a(), x = t * o.W, y = boy * (0.08 + t * 0.32) + (a() - 0.5) * boy * 0.16; px(b, x, y, a() < 0.5 ? '!#6c6aa8' : '!#4a4888'); }
  }
  /* Kümülüs bulut: üst üste kabarcıklar, düz taban; ışık sol üstten, üç ton */
  function bulutCiz(b, x0, y0, w, h, ton, s){
    const n = Math.max(3, Math.round(w / (h * 0.8))), P = [];
    for(let i = 0; i < n; i++){ const t = (i + 0.5) / n, r = h * (0.32 + 0.62 * Math.sin(t * Math.PI) * (0.65 + 0.35 * hash(i, s))); P.push({ x:x0 + t * w, y:y0 + h - r * 0.75, r }); }
    P.sort((a, c) => c.r - a.r);
    P.forEach(q => { const R0 = Math.ceil(q.r); for(let j = -R0; j <= R0; j++) for(let i = -R0; i <= R0; i++){ const X = q.x + i, Y = q.y + j; if(Y > y0 + h - 1 + g1(X * 0.18, s) * 3 || i * i + j * j > q.r * q.r * (0.82 + g1(Math.atan2(j, i) * 3 + q.x, s) * 0.3)) continue; const v = (j + i * 0.45) / q.r + (bay(Math.round(X), Math.round(Y)) - 0.5) * 0.3, c = v < 0.02 ? ton[0] : v < 0.62 ? ton[1] : ton[2]; px(b, X, Y, '!' + c); } });
  }
  function gokBulutlari(b, o, boy, kac){
    const r = tohum(11 + o.tur.length * 13 + o.tur.charCodeAt(0));
    for(let i = 0; i < kac; i++){ const w = o.W * (0.05 + r() * 0.1), h = w * (0.24 + r() * 0.1), x = r() * o.W - w / 2, y = boy * (0.04 + r() * 0.6); bulutCiz(b, x, y, w, h, o.P.bulut, i + 3 + o.tur.length); }
    /* İnce uzak bulut şeritleri */
    for(let i = 0; i < kac; i++){ const w = o.W * (0.05 + r() * 0.09), x = r() * o.W, y = boy * (0.34 + r() * 0.5); for(let q = 0; q < w; q++){ const t = q / w, u = Math.sin(t * 3.14); if(u * 0.9 > bay(Math.round(x + q), Math.round(y)) * 0.8) ortu(b, x + q, y + Math.round(Math.sin(q * 0.14 + i) * 1.2), '!' + o.P.bulut[1], 0.6); if(u > 0.6) ortu(b, x + q, y + 1 + Math.round(Math.sin(q * 0.14 + i) * 1.2), '!' + o.P.bulut[2], 0.3); } }
  }

  /* ---------- ARAZİ ---------- */
  /* Sırtlı dağ: yamaca göre ışık, kar çizgisi gürültülü, eteğe doğru pus */
  function dagCiz(b, o){
    const { W } = b, h = new Float32Array(W + 8), f = o.frek || 0.006;
    for(let x = 0; x < W + 8; x++){
      const r = (m) => 1 - Math.abs(2 * g1((x + (o.kay || 0)) * f * m, o.s + m) - 1);
      h[x] = o.taban - o.amp * Math.pow(r(1) * 0.62 + r(2.3) * 0.26 + r(5.1) * 0.12, 1.5);
    }
    for(let x = 0; x < W; x++){
      const t = Math.round(h[x + 3]);
      for(let y = t; y < o.taban + 4 && y < b.H; y++){
        if(y < 0) continue;
        const e = (h[Math.max(0, x)] - h[x + 6]) / 6, l = e * 1.5 + (g2((x + y * 0.8) * 0.055, y * 0.02, o.s) - 0.5) * 1.5 + (bay(x, y) - 0.5) * 0.25, kat = (o.taban - y) / o.amp;
        const kar = o.kar && kat > o.karEn + (g2(x * 0.06, y * 0.06, o.s + 9) - 0.5) * 0.28, P = kar ? o.kar : o.pal;
        let c = l > 0.32 ? P[0] : l > -0.1 ? P[1] : l > -0.55 ? P[2] : P[3];
        const pus = (y - t) / Math.max(1, o.taban - t);
        if(o.pus && pus > 0.45 && (pus - 0.45) * 1.6 > bay(x, y)) c = o.pus;
        px(b, x, y, c);
      }
      if(t >= 0 && (h[x + 2] > h[x + 4])) px(b, x, t, o.kar && (o.taban - t) / o.amp > o.karEn ? '#ffffff' : o.pal[0]);
    }
  }
  /* Tepe: tepede ışıklı kenar, gövdede kümelenmiş ton adaları, aşağı koyulaşır */
  function tepeCiz(b, o){
    const { W, H } = b, u = new Int32Array(W);
    for(let x = 0; x < W; x++) u[x] = Math.round(o.taban + (g1(x * (o.frek || 0.008), o.s) - 0.5) * o.amp * 2 + (g1(x * 0.03, o.s + 2) - 0.5) * o.amp * 0.4);
    const son = o.bit || H;
    for(let x = 0; x < W; x++) for(let y = Math.max(0, u[x]); y < son; y++){
      const d = (y - u[x]) / Math.max(1, son - u[x]), n = g2(x * 0.045, y * 0.09, o.s) + (bay(x, y) - 0.5) * 0.14 - d * 0.28;
      px(b, x, y, y - u[x] < 2 ? o.pal[0] : n > 0.56 ? o.pal[1] : n > 0.3 ? o.pal[2] : o.pal[3]);
    }
    return u;
  }
  function cam(b, x, F, h, P){
    R(b, x, F - 2, 1, 3, '#3a2820');
    for(let i = 0; i < h; i++){
      const w = Math.floor((i % 4 + i * 0.32) * 0.72) + 1, y = F - 2 - h + i;
      for(let q = -w; q <= w; q++){ const t = (q + w) / (2 * w + 0.01); px(b, x + q, y, t < 0.3 ? P[2] : t < 0.72 ? P[1] : P[0]); }
      if(i % 4 === 3) { px(b, x - w, y, P[0]); px(b, x + w, y, P[0]); }
    }
  }
  function ormanSirasi(b, taban, W, s, P, min, maks, ad){
    const r = tohum(s);
    R(b, 0, taban - min * 0.5, W, min, P[0]);
    for(let x = -4; x < W + 4; x += ad + Math.floor(r() * ad)) cam(b, x, taban + Math.floor(r() * 3), min + Math.floor(r() * (maks - min)), P);
  }
  /* Yuvarlak ağaç: gölge gövdesi, yaprak kümeleri, sol üstte ışık */
  function agac(b, x, F, r0, P, s){
    const g = Math.max(3, Math.round(r0 * 0.7)), y = F - g - r0 * 0.7, q = tohum((s || 5) * 7 + 3), n = 6 + Math.round(r0 * 0.9), kum = [];
    R(b, x - 1, F - g, 3, g, '#6f4a30'); R(b, x + 1, F - g, 1, g, '#4a3028');
    /* Taç: düzensiz kümeler; önce gölge, sonra orta, en üst sol ışık */
    for(let i = 0; i < n; i++){ const a = q() * 6.283, d = Math.sqrt(q()) * r0 * 0.78; kum.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.82, Math.max(1, r0 * (0.26 + q() * 0.16))]); }
    kum.forEach(k => daire(b, Math.round(k[0]), Math.round(k[1] + 1), Math.round(k[2] + 1), P[3]));
    kum.forEach(k => daire(b, Math.round(k[0] - k[2] * 0.12), Math.round(k[1]), Math.round(k[2]), P[2]));
    kum.forEach(k => { if((k[1] - y) / r0 + (k[0] - x) / r0 * 0.5 < 0.35) daire(b, Math.round(k[0] - k[2] * 0.25), Math.round(k[1] - k[2] * 0.25), Math.round(k[2] * 0.68), P[1]); });
    kum.forEach(k => { if((k[1] - y) / r0 + (k[0] - x) / r0 * 0.5 < -0.2) daire(b, Math.round(k[0] - k[2] * 0.35), Math.round(k[1] - k[2] * 0.4), Math.round(k[2] * 0.28), P[0]); });
    /* Yaprak benekleri: kenar yumuşar */
    for(let i = 0; i < r0 * 2.4; i++){ const a = q() * 6.283, d = r0 * (0.74 + q() * 0.3); px(b, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.84, q() < 0.5 ? P[2] : P[3]); }
  }
  /* Çayır: üç bant, ot tutamları kümeli, çiçek öbekleri */
  function cayirCiz(b, y0, s, P, cicek){
    const { W, H } = b, r = tohum(s);
    for(let y = y0; y < H; y++){ const d = (y - y0) / (H - y0); for(let x = 0; x < W; x++){ const n = g2(x * 0.03, y * 0.12, s) + (bay(x, y) - 0.5) * 0.12 - d * 0.22; px(b, x, y, n > 0.58 ? P[0] : n > 0.36 ? P[1] : P[2]); } }
    for(let x = 0; x < W; x++){ const y = y0 + Math.round((g1(x * 0.05, s) - 0.5) * 3); R(b, x, y - 1, 1, 2, P[0]); }
    for(let i = 0; i < W * (H - y0) / 26; i++){ const x = r() * W, y = y0 + 2 + r() * (H - y0 - 2), d = (y - y0) / (H - y0), u = 1 + Math.round(d * 3); if(g2(x * 0.04, y * 0.08, s + 1) > 0.42){ R(b, x, y - u, 1, u, P[3]); px(b, x - 1, y - u + 1, P[3]); px(b, x + 1, y - u + 1, P[3]); } }
    (cicek || []).forEach((c, k) => { for(let i = 0; i < W / 14; i++){ const cx = r() * W, cy = y0 + 4 + r() * (H - y0 - 4), n = 3 + r() * 6, d = (cy - y0) / (H - y0); for(let j = 0; j < n; j++){ const x = cx + (r() - 0.5) * 16, y = cy + (r() - 0.5) * 5; R(b, x, y, 1, 1 + d, P[3]); R(b, x, y - 1, 1 + Math.round(d), 1 + Math.round(d), c); } } });
  }
  /* Su: üstteki görüntü satır satır yansır; aşağı doğru derinleşir, yatay parıltılar kümeli */
  function suCiz(b, y0, y1, T, guc, s){
    const { W } = b, r = tohum(s || 55), son = Math.min(y1, b.H);
    for(let y = y0; y < son; y++){
      const u = y - y0, k = y0 - 1 - Math.floor(u * 0.85), kay = Math.round(Math.sin(y * 0.85 + s) * (0.6 + u * 0.025) + (g1(y * 0.4, s) - 0.5) * 2), a = Math.min(0.9, guc + u / (son - y0) * 0.42), c = T[Math.min(T.length - 1, Math.floor(u / (son - y0) * T.length))], n = renk(c);
      for(let x = 0; x < W; x++){ const q = k >= 0 ? b.d[k * W + Math.max(0, Math.min(W - 1, x + kay))] : n, m = sh => Math.round(((q >> sh) & 255) * (1 - a) + ((n >> sh) & 255) * a) << sh; b.d[y * W + x] = ((255 << 24) | m(16) | m(8) | m(0)) >>> 0; }
      const dalga = W / (28 + 14 * (1 - u / (son - y0)));
      for(let i = 0; i < dalga; i++) if(r() < 0.55){ const x = r() * W, w = 2 + r() * (2 + u * 0.08); for(let q = 0; q < w; q++) ortu(b, x + q, y, r() < 0.7 ? '#ffffff' : '#1a3a60', 0.2); }
    }
    R(b, 0, y0, W, 1, '#e6f6fa');
  }
  function kaya(b, x, y, r, P){ daire(b, x, y, r, P[2]); daire(b, x - Math.round(r * 0.2), y - Math.round(r * 0.25), Math.round(r * 0.72), P[1]); daire(b, x - Math.round(r * 0.35), y - Math.round(r * 0.45), Math.round(r * 0.32), P[0]); R(b, x - r, y + r - 1, r * 2, 2, P[3]); }

  function kayaTon(x, y, s, P){
    const h = (a, c) => g2(a * 0.024, c * 0.032, s) * 0.6 + g2(a * 0.075, c * 0.1, s + 1) * 0.3 + g2(a * 0.2, c * 0.26, s + 2) * 0.1, l = (h(x - 2, y - 2) - h(x + 2, y + 2)) * 8 + (bay(x, y) - 0.5) * 0.14;
    return l > 0.46 ? P[0] : l > 0.14 ? P[1] : l > -0.16 ? P[2] : l > -0.46 ? P[3] : P[4];
  }
  /* Ön plan otu: kareyi çerçeveler, derinlik verir */
  function onOt(b, P, s, yog){
    const r = tohum(s), { W, H } = b;
    for(let i = 0; i < W * (yog || 0.5); i++){ const x = r() * W, kenar = Math.abs(x / W - 0.5) * 2, h = (3 + r() * 10) * (0.4 + kenar * kenar * 1.6), e = (r() - 0.5) * 3; for(let q = 0; q < h; q++) px(b, x + e * (q / h) * (q / h), H - 1 - q, q < h * 0.4 ? P[1] : P[0]); }
  }
  const YESIL = { ormanUzak:['#6f9fa0', '#5f8f94', '#4f7f88'], ormanOrta:['#5a9272', '#467c62', '#336852'], ormanYakin:['#4c8a58', '#35704a', '#22583c'], yaprak:['#a4d67c', '#74b45c', '#4c9248', '#2f7040'] };
  const KAR = ['#ffffff', '#e6eef8', '#c4d4ec', '#9eb4d8'];

  /* ---------- SPRİT ---------- */
  const P_SABIT = { K:'#4a2c38', w:'#fbf6ea', W:'#e4dccb', s:'#f0c8b0', e:'#2a1a1c', d:'#3a3244', r:'#e8606b', R:'#b8444f', y:'#fff0b0', b:'#8ad0e8', B:'#5f86a8', o:'#d9a94f', O:'#e8953a', z:'#fff27a', n:'#7d5540', N:'#a8784f', p:'#f4a0c0', g:'#6f4a30', t:'#c9a27a', T:'#8a6450' };
  const pp = (P, o) => Object.assign({ }, P, o);
  const POZ = {
    koyun:{ h:0.7, k:[['...wwwww....', '.wwwwwwwww..', 'wwwwwwwwwwKK', 'wWwwwwwwwKsK', 'wwWwwwwwwKeK', '.wwwwwwwwKK.', '..KK...KK...', '..KK...KK...'], ['...wwwww....', '.wwwwwwwww..', 'wwwwwwwwww..', 'wWwwwwwwww..', 'wwWwwwwwwKK.', '.wwwwwwwKsK.', '..KK...KKeK.', '..KK...KKK..']] },
    koyunyuru:{ h:3, k:[['...wwwww....', '.wwwwwwwww..', 'wwwwwwwwwwKK', 'wWwwwwwwwKsK', 'wwWwwwwwwKeK', '.wwwwwwwwKK.', '..KK...KK...', '.KK.....KK..'], ['...wwwww....', '.wwwwwwwww..', 'wwwwwwwwwwKK', 'wWwwwwwwwKsK', 'wwWwwwwwwKeK', '.wwwwwwwwKK.', '..KK...KK...', '...KK.KK....']] },
    koyunuyu:{ h:0.5, k:[['............', '...wwwww....', '.wwwwwwwww..', 'wwwwwwwwwwKK', 'wWwwwwwwwKsK', 'wwWwwwwwwKKK', '.wwwwwwwww..', '..KKKKKKK...']] },
    inek:{ h:0.5, k:[['.............KK.', '.KKKKKKKKKKKKwwK', 'KwwggwwwwggwKwwK', 'KwwggwwwwwwwKeeK', 'KwwwwwwggwwwKwpK', 'KwwwwwwggwwwKppK', '.KKwKKKKKKwKKKK.', '..KwK....KwK....', '..KKK....KKK....'], ['.............KK.', '.KKKKKKKKKKKKwwK', 'KwwggwwwwggwKwwK', 'KwwggwwwwwwwKwwK', 'KwwwwwwggwwwKeeK', 'KwwwwwwggwwwKwpK', '.KKwKKKKKKwKKppK', '..KwK....KwKKKK.', '..KKK....KKK....']] },
    geyik:{ h:0.6, k:[['..........n.n.', '..........nnn.', '...........KKK', '..KKKKKKKKKKtK', '.KttttttttttKe', 'KtttTTttttttK.', 'KtttttttttttK.', '.KtKKKKKKKtK..', '.KtK.....KtK..', '.KKK.....KKK..'], ['..........n.n.', '..........nnn.', '...........KKK', '..KKKKKKKKKKtK', '.KttttttttttKt', 'KtttTTttttttKe', 'KtttttttttttK.', '.KtKKKKKKKtK..', '.KtK.....KtK..', '.KKK.....KKK..']] },
    deve:{ h:0.8, k:[['............KK', '....KK......Kd', '...KddK.KK...d', '..KddddKddK..d', '.KddddddddddKd', '.KddddddddddK.', '..KdKKKKKKdK..', '..Kd......Kd..', '..Kd......Kd..'], ['............KK', '....KK......Kd', '...KddK.KK...d', '..KddddKddK..d', '.KddddddddddKd', '.KddddddddddK.', '..KdKKKKKKdK..', '...Kd....Kd...', '...Kd....Kd...']] },
    kelebek:{ h:5, k:[['pp.pp', 'ppdpp', '.pdp.'], ['.p.p.', '.pdp.', '..d..']] },
    kelebek2:{ h:5, k:[['yy.yy', 'yydyy', '.ydy.'], ['.y.y.', '.ydy.', '..d..']] },
    kus:{ h:5, k:[['..dd...', '..ddd..', 'ddddddd', '..dd...'], ['.......', '...dd..', 'ddddddd', '..dd...']] },
    pervane:{ h:1.2, k:[
      ['.......n.......', '.......n.......', '.......n.......', '......wn.......', '......wn.......', '......wn.......', '.......n.......', 'nnnnnnnKnnnnnnn', '.......n.......', '.......nw......', '.......nw......', '.......nw......', '.......n.......', '.......n.......', '.......n.......'],
      ['n..............', '.n.............', '..n...........n', '...n........wn.', '....n.....wwn..', '.....n...wwn...', '......n.wn.....', '.......K.......', '.....nw.n......', '...nww...n.....', '..nww.....n....', '.nw........n...', 'n...........n..', '.............n.', '..............n'],
    ] },
    dalga:{ h:1, k:[['..yy...yyy......', 'yyy...yy.....yy.'], ['...yyy...yy.....', '.yy.....yyy...yy']] },
    pirilti:{ h:1.4, k:[['.w.', 'www', '.w.'], ['...', '.w.', '...'], ['...', '...', '...']] },
    bocek:{ h:1.5, k:[['z'], ['z'], ['.'], ['.']] },
    yildiz:{ h:0.5, k:[['.w.', 'www', '.w.'], ['...', '.w.', '...']] },
    tekne:{ h:1.2, k:[['.....n.........', '.....n.........', '.KKKKnKKKKKKKK.', 'KNNNNNNNNNNNNNK', '.KnnnnnnnnnnnK.', '..KKKKKKKKKKK..'], ['.....n.........', '.....n.........', '..KKKnKKKKKKKKK', '.KNNNNNNNNNNNNK', 'KnnnnnnnnnnnnK.', '.KKKKKKKKKKKK..']] },
    yelken:{ h:0.8, k:[['.......K.......', '.......Kww.....', '......wKwww....', '.....wwKwwww...', '....wwwKwwwww..', '...wwwwKwwwwww.', '..wwwwwKwwwwww.', '.......K.......', '.KRRRRRRRRRRRRK', '..KRRRRRRRRRRK.', '...KKKKKKKKKK..'], ['.......K.......', '.......Kww.....', '......wKwww....', '.....wwKwwww...', '....wwwKwwwww..', '...wwwwKwwwwww.', '..wwwwwKwwwwww.', '.......K.......', '..KRRRRRRRRRRRK', '.KRRRRRRRRRRK..', '..KKKKKKKKKK...']] },
    ordek:{ h:1, k:[['.......KK.', '......KwwK', '......KweK', '.K....KwwO', 'KwK.KKKwwK', 'KwwwwwwwwK', '.KwwWwwwK.', '..KKKKKK..'], ['.......KK.', '......KwwK', '......KweK', '......KwwO', '.KK.KKKwwK', 'KwwwwwwwwK', '.KwwWwwwK.', '..KKKKKK..']] },
    yarasa:{ h:6, k:[['K.......K', 'KK.K.K.KK', 'KKKKKKKKK', '..KKKKK..', '...KeK...'], ['.........', '...K.K...', '.KKKKKKK.', 'KKKKKKKKK', 'K..KeK..K']] },
    duman:{ h:1, k:[['..w.', '.w..', '..w.', '.w..', 'w...'], ['.w..', '..w.', '.w..', '..w.', '.w..'], ['..w.', '.w..', '..w.', '...w', '..w.']] },
    damla:{ h:3, k:[['b'], ['b'], ['b']] },
    deniz1:{ h:1, k:[['...bbb.....bbbb.......', 'bbb...bbbbb....bbbb...'], ['.....bbbb.....bbb.....', '..bbb....bbbbb...bbbb.']] },
    kopuk:{ h:1, k:[['ww...wwww....www....wwwww...', '.wwww....wwww...wwww.....www'], ['.www....www.....wwwww....ww.', 'w...wwww...wwww......wwww...']] },
    yengec:{ h:2, k:[['K.K....K.K', '.KRRRRRRK.', 'KRReRReRRK', '.KRRRRRRK.', 'K.K.KK.K.K'], ['.K......K.', 'K.KRRRRK.K', 'KRReRReRRK', '.KRRRRRRK.', '.K.K..K.K.']] },
    kar:{ h:1, k:[['w'], ['w'], ['w']] },
    kar2:{ h:1, k:[['.w.', 'www', '.w.']] },
    yaprak:{ h:2, k:[['pp', '.p'], ['.p', 'pp'], ['p.', 'pp']] },
    toz:{ h:1, k:[['y'], ['.'], ['y']] },
    gizli:{ h:1, k:[[]] },
  };
  /* Büyük bulut sprit'leri: ilk gerektiğinde tampondan */
  [[56, 18], [40, 14], [72, 22]].forEach((q, i) => { POZ['bulut' + i] = { h:1, k:[Array(q[1]).fill('.'.repeat(q[0]))], ciz(t, v){ bulutCiz(t, 1, 0, q[0] - 2, q[1] - 1, PALET[v].bulut, i + 21); } }; });
  const onbellek = new Map();
  function gorsel(poz, i, ters, v){
    const a = poz + i + (ters ? 't' : '') + v;
    let c = onbellek.get(a);
    if(c) return c;
    const Z = POZ[poz], s = Z.k[i], Pv = PALET[v];
    c = document.createElement('canvas'); c.width = (s[0] || '.').length; c.height = s.length || 1;
    const g = c.getContext('2d');
    if(Z.ciz){ const t = tampon(c.width, c.height); ambAyarla([1, 1, 1]); Z.ciz(t, v, i); g.putImageData(new ImageData(new Uint8ClampedArray(t.d.buffer), t.W, t.H), 0, 0); }
    else {
      const f = /^(bocek|yildiz|kar)/.test(poz) ? 1 : Pv.kisi;
      s.forEach((r, y) => { for(let x = 0; x < r.length; x++){ const q = r[x] !== '.' && P_SABIT[r[x]]; if(q){ g.fillStyle = q; g.fillRect(ters ? r.length - 1 - x : x, y, 1, 1); } } });
      if(f < 1){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(16,14,50,' + (1 - f) + ')'; g.fillRect(0, 0, c.width, c.height); }
    }
    onbellek.set(a, c);
    return c;
  }
  /* Rutin: [poz, süre, hedefX?, ters?, hedefY?]; saf saat */
  function rutin(x, y, adim){
    const seg = [];
    let z = 0, px0 = x, py = y;
    adim.forEach(a => { const hx = a[2] === undefined ? px0 : a[2], hy = a[4] === undefined ? py : a[4], s = a[1] || Math.abs(hx - px0) / 4; seg.push({ poz:a[0], t0:z, t1:z + s, x0:px0, x1:hx, y0:py, y1:hy, ters:a[3] === undefined ? hx < px0 : a[3] }); z += s; px0 = hx; py = hy; });
    return { seg, T:z };
  }
  function kareAl(a, t){
    const z = ((t % a.T) + a.T) % a.T, s = a.seg.find(q => z < q.t1) || a.seg[a.seg.length - 1];
    if(s.poz === 'gizli') return null;
    const P = POZ[s.poz], i = Math.floor(z * P.h) % P.k.length, f = (z - s.t0) / (s.t1 - s.t0);
    return { poz:s.poz, i, x:Math.round(s.x0 + (s.x1 - s.x0) * f), y:Math.round(s.y0 + (s.y1 - s.y0) * f) - P.k[i].length, ters:s.ters };
  }
  /* Her manzaranın göğünde olanlar: süzülen bulut, gece yıldızı, gündüz kuş sürüsü */
  function gokSakin(s, o, boy){
    const { W, gece } = o;
    s.push(rutin(-58, boy * 0.42, [['bulut0', 150, W + 2, false]]), rutin(W + 2, boy * 0.62, [['bulut1', 190, -44, false]]), rutin(W * 0.25, boy * 0.28, [['bulut2', 110, W + 2, false], ['bulut2', 90, W * 0.25, false]]));
    if(gece) [[0.08, 0.2], [0.34, 0.12], [0.55, 0.32], [0.9, 0.16]].forEach((q, i) => s.push(rutin(W * q[0], boy * q[1], [['yildiz', 3 + i]])));
    else { const y = boy * 0.55; [[0, 0], [-8, -4], [-14, 4], [-22, -2]].forEach(q => s.push(rutin(-8 + q[0], y + q[1], [['kus', W / 12, W + 8 + q[0], false], ['gizli', 26]]))); }
  }
  const taban = (tur, W, H, v) => ({ tur, W, H, vakit:v, gece:v === 'gece', dar:W < 200, P:PALET[v], sakin:[] });

  /* ---------- MANZARALAR ---------- */
  const TURLER = {
    /* Tarla: seçim sayfası. Ufukta dağlar, ambar ve değirmen, ufka daralan tarlalar, çiçekli çayır */
    tarla:{
      yer(o){
        const { W, H, gece, dar, sakin:s } = o, ufuk = o.ufuk = Math.round(H * 0.46), tarla = o.tarla = Math.round(H * 0.58), cayir = o.cayir = Math.round(H * 0.78), yer = f => Math.round(W * f);
        gokSakin(s, o, ufuk);
        s.push(rutin(yer(0.82) - 7, ufuk + 7, [['pervane', 20]]));
        if(gece){
          for(let i = 0; i < (dar ? 5 : 14); i++){ const x = yer(0.04 + i * 0.07), y = cayir - 6 + (i * 7) % 26; s.push(rutin(x, y, [['bocek', 4 + i % 3, x + 8, false, y - 5], ['bocek', 3 + i % 2, x, true, y]])); }
          s.push(rutin(yer(0.24), cayir + 12, [['koyunuyu', 12]]), rutin(yer(0.4), cayir + 20, [['koyunuyu', 14]]), rutin(yer(0.62), cayir + 10, [['koyunuyu', 10]]));
        } else {
          s.push(rutin(yer(0.18), cayir + 12, [['koyun', 11], ['koyunyuru', 0, yer(0.18) + 14], ['koyun', 9], ['koyunyuru', 0, yer(0.18)]]), rutin(yer(0.36), cayir + 22, [['koyun', 7], ['koyunyuru', 0, yer(0.36) - 10], ['koyun', 13, undefined, true], ['koyunyuru', 0, yer(0.36)]]), rutin(yer(0.64), cayir + 10, [['koyun', 15, undefined, true]]));
          if(!dar) s.push(rutin(yer(0.76), cayir + 18, [['inek', 20]]));
          [['kelebek', 0.28, 0.03], ['kelebek2', 0.5, 0.07], ['kelebek', 0.72, 0.04], ['kelebek2', 0.12, 0.09]].forEach(q => { const x = yer(q[1]), y = cayir + H * q[2]; s.push(rutin(x, y, [[q[0], 4, x + 14, false, y - 5], [q[0], 3, x + 8, true, y + 3], [q[0], 4, x, true, y]])); });
          s.push(rutin(-16, tarla + 10, [['dalga', W / 22, yer(0.48), false], ['gizli', 14]]));
          if(!dar) s.push(rutin(yer(0.52), tarla + 18, [['gizli', 8], ['dalga', W / 22, W, false], ['gizli', 6]]));
        }
      },
      ciz(b, o){
        const { W, H, ufuk, tarla, cayir, dar } = o, yer = f => Math.round(W * f);
        dagCiz(b, { taban:ufuk + 4, amp:H * 0.2, s:3, pal:['#c4d2ea', '#aebfdc', '#98accc', '#889cc0'], kar:['#ffffff', '#eef4fa', '#d4e0f0', '#c0cee4'], karEn:0.62, pus:'#d8e6f2', frek:0.005 });
        ormanSirasi(b, ufuk + 5, W, 3, ['#7db08c', '#6aa080', '#5a9074'], 5, 11, 4);
        R(b, 0, ufuk + 8, W, tarla - ufuk, '#88c868');
        tepeCiz(b, { taban:ufuk + 10, amp:5, s:4, pal:['#b4e088', '#9ad476', '#88c868', '#78bc5e'], frek:0.012, bit:tarla + 4 });
        [[0.06, 8, 2], [0.11, 6, 3], [0.46, 8, 4], [0.53, 6, 5], [0.95, 9, 6]].forEach(q => agac(b, yer(q[0]), ufuk + 12, q[1], YESIL.yaprak, q[2]));
        /* Ambar ve silo */
        const bx = yer(dar ? 0.08 : 0.22), by = ufuk + 12;
        R(b, bx, by - 15, 24, 15, '#c8503f'); R(b, bx, by - 15, 24, 1, '#e07060'); for(let i = 2; i < 24; i += 3) R(b, bx + i, by - 14, 1, 14, '#a4402f'); R(b, bx + 20, by - 14, 4, 14, '#a4402f');
        for(let i = 0; i < 8; i++){ R(b, bx - 2 + i, by - 16 - i, 28 - i * 2, 1, '#6d3a35'); px(b, bx - 2 + i, by - 16 - i, '#fbf6ea'); px(b, bx + 25 - i, by - 16 - i, '#fbf6ea'); }
        R(b, bx + 7, by - 10, 10, 10, '#fbf6ea'); R(b, bx + 8, by - 9, 8, 9, '#8a3226'); R(b, bx + 11, by - 9, 2, 9, '#fbf6ea'); for(let i = 0; i < 8; i++) px(b, bx + 8 + i, by - 9 + i, '#fbf6ea'); R(b, bx + 9, by - 21, 6, 4, '#fbf6ea'); R(b, bx + 10, by - 20, 4, 2, '#3a2028');
        R(b, bx + 26, by - 21, 8, 21, '#dcd8cc'); R(b, bx + 31, by - 21, 3, 21, '#b4b0a4'); for(let i = 3; i < 21; i += 4) R(b, bx + 26, by - 21 + i, 8, 1, '#a4a094'); daire(b, bx + 30, by - 22, 4, '#8a8aa0'); daire(b, bx + 29, by - 23, 2, '#a8a8bc');
        /* Değirmen kulesi */
        const mx = yer(0.82), my = ufuk + 15;
        for(let i = 0; i < 26; i++){ const w = 4 + Math.floor(i / 3); R(b, mx - Math.floor(w / 2), my - 26 + i, w, 1, i % 6 === 0 ? '#c9bfa8' : '#f0e8d4'); R(b, mx + Math.floor(w / 2) - 2, my - 26 + i, 2, 1, '#c8bfa8'); }
        R(b, mx - 2, my - 6, 4, 6, '#7d5540'); R(b, mx - 4, my - 28, 9, 3, '#8a5a48');
        /* Tarlalar: ufka daralan sıralar, her yama kendi rengi */
        const dip = cayir + 2, oy = ufuk - 16, cx = W * 0.5, YAMA = [['#e8c55a', '#d4a83e'], ['#86c25e', '#6aa84c'], ['#b89ae0', '#9276c8'], ['#e8c55a', '#d4a83e'], ['#d98a4a', '#c0723a']];
        for(let y = tarla; y < dip; y++){ const d = (y - oy) / (dip - oy); for(let x = 0; x < W; x++){ const k = (x - cx) / d, kk = k + (g2(k * 0.012, y * 0.05, 5) - 0.5) * W * 0.09, ya = kk < -W * 0.42 ? 4 : kk < -W * 0.18 ? 0 : kk < 0.02 * W ? 1 : kk < W * 0.26 ? 2 : kk < W * 0.48 ? 3 : 4, ser = k + Math.sin(y * 0.09 + ya) * 3 / d, sira = ((Math.floor((ser + W) / 8) % 2) + 2) % 2, q = g2(x * 0.03, y * 0.08, 8) + (bay(x, y) - 0.5) * 0.14; let c = YAMA[ya][sira]; if(q > 0.68) c = YAMA[ya][1 - sira]; else if(q < 0.26) c = YAMA[ya][1]; px(b, x, y, c); } }
        /* Tarla sınırında çalı öbekleri ve tek tük ağaç */
        for(const k0 of [-0.42, -0.18, 0.02, 0.26, 0.48]) for(let t = 0.08; t < 1; t += 0.11 + hash(t * 40, k0) * 0.14){ const y = tarla + (dip - tarla) * t, dd = (y - oy) / (dip - oy), x = cx + (k0 * W + (g2(k0 * W * 0.012, y * 0.05, 5) - 0.5) * -W * 0.09) * dd, r0 = 2 + dd * 4 * hash(t, k0 * 9); if(hash(t * 9, k0) > 0.32) agac(b, Math.round(x), Math.round(y), Math.round(r0 + (hash(t, k0) > 0.8 ? 3 : 0)), ['#a4d67c', '#6fae58', '#4c9248', '#2f7040'], Math.round(t * 90)); }
        const u = tohum(21); for(let x = 0; x < W; x++){ const y = tarla + Math.round((g1(x * 0.03, 6) - 0.5) * 3); R(b, x, y - 1, 1, 2, '#a4d680'); if(u() < 0.25) px(b, x, y - 2, '#c4ea9c'); }
        [[0.12, 10], [0.2, 20], [0.3, 13], [0.66, 12], [0.72, 22]].forEach(q => { const x = yer(q[0]), y = tarla + q[1], r = 3 + Math.round(q[1] / 12); daire(b, x, y, r, '#b8903a'); daire(b, x - 1, y - 1, r - 1, '#e8c870'); px(b, x, y, '#a07c2e'); px(b, x - 1, y - 1, '#a07c2e'); });
        cayirCiz(b, cayir, 33, ['#9edc76', '#86cc64', '#72bc56', '#559a44'], ['#fbf6ea', '#f490b4', '#ffe27a', '#b89ae0']);
        /* Çit */
        const cy = cayir + 3; R(b, 0, cy - 5, W, 1, '#dcb890'); R(b, 0, cy - 2, W, 1, '#c09a70'); R(b, 0, cy - 4, W, 1, '#8a6450'); for(let x = 4; x < W; x += 18){ R(b, x, cy - 8, 3, 10, '#8a6450'); R(b, x, cy - 8, 1, 10, '#b89470'); R(b, x, cy - 9, 3, 1, '#c9a27a'); }
        if(!dar){ const gx = yer(0.86), gy = Math.round(H * 0.91), rx = W * 0.085, ry = H * 0.05;
          for(let y = -ry - 3; y <= ry + 3; y++) for(let x = -rx - 3; x <= rx + 3; x++){ const a = Math.atan2(y / ry, x / rx), u = Math.hypot(x / rx, y / ry) - (g1(a * 2.4 + 7, 4) - 0.5) * 0.34; if(u < 1) px(b, gx + x, gy + y, y < -ry * 0.25 ? '#a8e0f2' : y < ry * 0.4 ? '#7cc4e4' : '#5cacd4'); else if(u < 1.12) px(b, gx + x, gy + y, '#8a7a56'); }
          R(b, gx - rx * 0.5, gy - ry * 0.4, rx * 0.34, 1, '#e6f8fc'); R(b, gx + rx * 0.1, gy + ry * 0.2, rx * 0.28, 1, '#e6f8fc');
          const t = tohum(9); for(let i = 0; i < 26; i++){ const a = 2.5 + t() * 2.2, x = gx + Math.cos(a) * rx, y = gy + Math.sin(a) * ry, h = 4 + t() * 8; R(b, x, y - h, 1, h, t() < 0.5 ? '#3f7f48' : '#5a9a50'); if(h > 9) R(b, x, y - h - 3, 1, 3, '#7a5038'); }
          [[-0.9, 0.5, 3], [0.84, 0.6, 4], [0.5, 0.95, 2]].forEach(q => kaya(b, gx + rx * q[0], gy + ry * q[1], q[2], ['#c4c0b0', '#9c988c', '#74706a', '#545050'])); }
      },
    },
    /* Dağ: karlı zirveler, çam ormanı, durgun göl, kulübe */
    dag:{
      yer(o){
        const { W, H, gece, sakin:s } = o, y = o.gol = Math.round(H * 0.66), yer = f => Math.round(W * f);
        gokSakin(s, o, y * 0.55);
        s.push(rutin(yer(0.74), y - 22, [['duman', 12]]));
        s.push(rutin(yer(0.2), y + H * 0.17, [['tekne', 20]]));
        [[0.4, 0.74], [0.56, 0.84], [0.72, 0.92], [0.1, 0.8], [0.3, 0.9]].forEach((q, i) => s.push(rutin(yer(q[0]), H * q[1], [['pirilti', 2 + i * 0.6]])));
        if(!gece) s.push(rutin(yer(0.56), y + 2, [['geyik', 18]]));
      },
      ciz(b, o){
        const { W, H, gol } = o, yer = f => Math.round(W * f);
        dagCiz(b, { taban:gol, amp:H * 0.5, s:11, pal:['#b0c2e0', '#94aad0', '#7c92bc', '#6c82ae'], kar:KAR, karEn:0.5, pus:'#c4d6ea', frek:0.0042 });
        dagCiz(b, { taban:gol, amp:H * 0.3, s:17, pal:['#8ca8c4', '#7490b0', '#5e7a9e', '#50688c'], kar:KAR, karEn:0.66, pus:'#9cbcd0', frek:0.0072 });
        ormanSirasi(b, gol - 12, W, 5, YESIL.ormanUzak, 9, 16, 4);
        ormanSirasi(b, gol - 6, W, 6, YESIL.ormanOrta, 12, 22, 5);
        ormanSirasi(b, gol, W, 7, YESIL.ormanYakin, 16, 30, 7);
        const kx = yer(0.7), ky = gol;
        R(b, kx, ky - 13, 22, 13, '#8a5a40'); for(let i = 2; i < 13; i += 3){ R(b, kx, ky - i, 22, 1, '#6d4632'); R(b, kx, ky - i - 1, 22, 1, '#a0704e'); }
        for(let i = 0; i < 8; i++){ R(b, kx - 3 + i, ky - 14 - i, 28 - i * 2, 1, i < 3 ? '#ffffff' : '#4a3028'); }
        R(b, kx + 9, ky - 9, 5, 9, '#3a2420'); R(b, kx + 3, ky - 10, 4, 4, '!#ffe6a0'); R(b, kx + 16, ky - 10, 4, 4, '!#ffe6a0'); R(b, kx + 5, ky - 10, 1, 4, '#4a3028'); R(b, kx + 18, ky - 10, 1, 4, '#4a3028'); R(b, kx + 16, ky - 24, 4, 8, '#5a3a35');
        suCiz(b, gol, H, ['#5ea0c8', '#4c90bc', '#3c80b0', '#2f70a4'], 0.28, 3);
        tepeCiz(b, { taban:H - 8, amp:5, s:9, pal:['#8a9068', '#6a7450', '#5a6444', '#4a5438'], frek:0.015 });
        const P = ['#b8bcae', '#94988a', '#6e7266', '#4f5349'];
        [[0.3, 4], [0.52, 5], [0.66, 3], [0.44, 3]].forEach(q => kaya(b, yer(q[0]), H - 5, q[1], P));
        [[0.015, 40], [0.05, 30], [0.09, 22], [0.93, 26], [0.975, 38]].forEach(q => cam(b, yer(q[0]), H, q[1], ['#3c7a52', '#26603e', '#16482e']));
        onOt(b, ['#6a8a50', '#4f6e40'], 3, 0.6);
      },
    },
    /* Mağara: ağızdan vadi görünür; sarkıtlar, ışıldayan kristaller, yeraltı gölü */
    magara:{
      yer(o){
        const { W, H, sakin:s } = o, yer = f => Math.round(W * f);
        [[0.2, 0.2], [0.72, 0.14], [0.84, 0.3], [0.1, 0.34]].forEach((q, i) => { const x = yer(q[0]), y = H * q[1]; s.push(rutin(x, y, [['yarasa', 5 + i, x + 34, false, y + 8], ['yarasa', 5, x, true, y]])); });
        [[0.34, 0.22], [0.62, 0.2], [0.14, 0.2]].forEach((q, i) => { const x = yer(q[0]), y0 = H * q[1], y1 = H * 0.72; s.push(rutin(x, y0, [['gizli', 3 + i * 2], ['damla', 1.2, x, false, y1], ['gizli', 4]])); });
        [[0.18, 0.84], [0.5, 0.88], [0.76, 0.82], [0.9, 0.9]].forEach((q, i) => s.push(rutin(yer(q[0]), H * q[1], [['pirilti', 2 + i * 0.5]])));
      },
      ciz(b, o){
        const { W, H } = o, r = tohum(17), yer = f => Math.round(W * f), su = Math.round(H * 0.72), cx = W * 0.5, cy = H * 0.46, rx = W * 0.21, ry = H * 0.27;
        /* Dış dünya */
        dagCiz(b, { taban:su - 8, amp:H * 0.24, s:21, pal:['#b0c2e0', '#94aad0', '#7c92bc', '#6c82ae'], kar:KAR, karEn:0.55, pus:'#c4d6ea', frek:0.012, kay:W * 0.2 });
        ormanSirasi(b, su - 6, W, 8, YESIL.ormanOrta, 6, 12, 4);
        R(b, 0, su - 6, W, 6, '#7ab98a');
        /* Kaya: karanlık sıcak mor, ağza yakın ışık yakalar */
        ambAyarla([1, 1, 1]);
        for(let y = 0; y < su + 3; y++) for(let x = 0; x < W; x++){
          const a = Math.atan2(y - cy, x - cx), n = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2, kenar = 1 + Math.sin(a * 7 + 1) * 0.08 + Math.sin(a * 19) * 0.05 + (g2(x * 0.05, y * 0.05, 3) - 0.5) * 0.2;
          if(n <= kenar) continue;
          const u = Math.min(1, (n - kenar) / 2.4), T = u < 0.25 ? ['#9a88a8', '#7a6890', '#5c4e74', '#46395e', '#352a4c'] : u < 0.6 ? ['#6e5e84', '#54466e', '#413558', '#332946', '#272038'] : ['#50446a', '#3e3454', '#302844', '#251f36', '#1c172a'];
          px(b, x, y, u < 0.03 ? '#a494b0' : kayaTon(x, y, 5, T));
        }
        const sivri = (x, y, h, yon) => { for(let i = 0; i < h; i++){ const w = Math.max(0, Math.round((h - i) / h * Math.min(5, h / 5))); for(let q = -w; q <= w; q++){ const t = (q + w) / (2 * w + 0.01); px(b, x + q, y + i * yon, t < 0.3 ? '#8a7a9e' : t < 0.7 ? '#5e4f74' : '#382e4e'); } } };
        for(let x = 4; x < W; x += 9 + Math.floor(r() * 16)) sivri(x, 0, 12 + Math.floor(r() * H * 0.14), 1);
        for(let x = 8; x < W; x += 14 + Math.floor(r() * 24)) if(Math.abs(x - cx) > rx * 0.8) sivri(x, su, 6 + Math.floor(r() * H * 0.07), -1);
        /* Kristaller ve ışıkları */
        const K = [[0.06, 16, 0], [0.09, 24, 0], [0.13, 12, 1], [0.16, 18, 1], [0.84, 20, 1], [0.88, 13, 0], [0.92, 26, 1], [0.95, 14, 0], [0.26, 10, 1], [0.73, 10, 0]];
        K.forEach(q => { const h = q[2] ? '#ec9cf0' : '#8ae0f4', x = yer(q[0]), y = su - q[1] * 0.5; for(let j = -q[1] * 1.6; j <= q[1] * 1.6; j++) for(let i = -q[1] * 1.6; i <= q[1] * 1.6; i++){ const d = Math.hypot(i, j) / (q[1] * 1.6); if(d < 1 && (1 - d) * 0.5 > bay(x + i | 0, y + j | 0) * 0.8) ortu(b, x + i, y + j, h, 0.16); } });
        K.forEach(q => { const P = q[2] ? ['#fbe0fb', '#ec9cf0', '#b85ccc', '#7c3a9c'] : ['#e4fbfe', '#8ae0f4', '#3fa4d4', '#2a6c9c'], x = yer(q[0]), h = q[1], w = Math.round(h * 0.26) + 1; for(let i = 0; i < h; i++){ const u = Math.min(w, Math.round((i + 1) / h * w * 1.6)); for(let d = -u; d <= u; d++) px(b, x + d, su - h + i, d < -u * 0.3 ? P[1] : d < u * 0.3 ? P[2] : P[3]); px(b, x - Math.round(u * 0.3), su - h + i, P[0]); } });
        suCiz(b, su, H, ['#27457a', '#203a68', '#1a3058', '#142648'], 0.34, 5);
        R(b, 0, su, W, 1, '#8ae0f4');
      },
    },
    /* Göl: karşı kıyıda orman, durgun su, iskele, nilüfer, ördekler */
    gol:{
      yer(o){
        const { W, H, gece, sakin:s } = o, y = o.gol = Math.round(H * 0.5), yer = f => Math.round(W * f);
        gokSakin(s, o, y);
        if(!gece) [[0.3, 0.68], [0.36, 0.72], [0.42, 0.7]].forEach((q, i) => { const x = yer(q[0]) - i * 2, yy = H * q[1]; s.push(rutin(x, yy, [['ordek', 14, x + 40, false], ['ordek', 14, x, true]])); });
        s.push(rutin(yer(0.64), H * 0.72, [['tekne', 20]]));
        [[0.2, 0.6], [0.5, 0.56], [0.6, 0.84], [0.86, 0.64], [0.14, 0.78]].forEach((q, i) => s.push(rutin(yer(q[0]), H * q[1], [['pirilti', 2 + i * 0.5]])));
      },
      ciz(b, o){
        const { W, H, gol:y0 } = o, r = tohum(23), yer = f => Math.round(W * f);
        dagCiz(b, { taban:y0 - 4, amp:H * 0.2, s:31, pal:['#b4c8e4', '#9cb4d8', '#88a0c8', '#7890bc'], kar:null, karEn:1, pus:'#d4e4f2', frek:0.006 });
        ormanSirasi(b, y0 - 7, W, 9, YESIL.ormanUzak, 7, 12, 4);
        for(let x = 0; x < W; x += 5 + Math.floor(r() * 6)) agac(b, x, y0 + 1, 5 + Math.floor(r() * 5), ['#94c878', '#6ca85e', '#4c8c50', '#2f6c40'], x);
        R(b, 0, y0 - 1, W, 2, '#2f6c40');
        suCiz(b, y0, H, ['#7cc0dc', '#62aed0', '#4c9cc4', '#3a8ab8'], 0.2, 7);
        for(let i = 0; i < W / 9; i++){ const x = r() * W, d = 0.35 + r() * 0.5, y = y0 + (H - y0) * d, w = 3 + d * 8; R(b, x, y, w, 1 + d * 2, '#3f7f48'); R(b, x + 1, y, w - 2, 1, '#6aa858'); if(r() < 0.4){ R(b, x + w * 0.3, y - 2, 2 + d * 2, 2 + d, '#f490b4'); px(b, x + w * 0.4, y - 1, '#ffe27a'); } }
        const dx = yer(0.8), dy = Math.round(H * 0.62);
        for(let i = 0; i < H - dy; i++){ const w = 10 + i * 0.62, x = dx - w / 2 + i * 0.15; R(b, x, dy + i, w, 1, Math.floor(i * (1 - i / (H - dy) * 0.4)) % 4 === 0 ? '#6d4632' : i % 2 ? '#b8865a' : '#a8784f'); R(b, x, dy + i, 1, 1, '#4a3028'); R(b, x + w - 1, dy + i, 1, 1, '#4a3028'); }
        [0, 18, 40].forEach(i => { const w = 10 + i * 0.62, x = dx - w / 2 + i * 0.15, h = 8 + i * 0.2; R(b, x - 2, dy + i - h, 3, h + 8, '#4a3028'); R(b, x + w - 1, dy + i - h, 3, h + 8, '#4a3028'); R(b, x - 2, dy + i - h, 1, h + 8, '#7d5540'); });
        tepeCiz(b, { taban:H - 6, amp:4, s:12, pal:['#a4d07c', '#86b862', '#6a9a50', '#567f42'], frek:0.018 });
        for(let i = 0; i < W / 1.6; i++){ const x = r() * W; if(x > yer(0.66) && x < yer(0.95)) continue; const k = x < W * 0.3 || x > W * 0.94 ? 1 : 0.36, h = (5 + r() * 24) * k; R(b, x, H - h - 2, 1, h + 2, r() < 0.5 ? '#3f7f48' : '#5a9a50'); if(h > 18){ R(b, x, H - h - 7, 2, 5, '#7a5038'); px(b, x, H - h - 8, '#a07a58'); } }
      },
    },
    /* Deniz: ufuk, güneş yolu, dalga, kumsal, palmiye, kayalıkta fener, yelkenli */
    deniz:{
      yer(o){
        const { W, H, gece, sakin:s } = o, y = o.deniz = Math.round(H * 0.48), kum = o.kum = Math.round(H * 0.8), yer = f => Math.round(W * f);
        gokSakin(s, o, y);
        s.push(rutin(yer(0.12), y + 14, [['yelken', 60, yer(0.46), false], ['yelken', 60, yer(0.12), true]]));
        for(let i = 0; i < 9; i++){ const x = (i * 71) % W, yy = y + 6 + i * 6; s.push(rutin(x, yy, [['deniz1', 6 + i, x + 10, false], ['deniz1', 6 + i, x, true]])); }
        for(let i = 0; i * 28 < W; i++) s.push(rutin(i * 28, kum + 1, [['kopuk', 3, i * 28 + 2, false, kum + 3], ['kopuk', 3, i * 28, false, kum + 1]]));
        if(!gece) s.push(rutin(yer(0.3), H - 8, [['yengec', 5], ['yengec', 4, yer(0.3) + 16, false], ['yengec', 5], ['yengec', 4, yer(0.3), true]]));
        [[0.72, 0.56], [0.77, 0.62], [0.74, 0.68], [0.8, 0.74]].forEach((q, i) => s.push(rutin(yer(q[0]), H * q[1], [['pirilti', 1.6 + i * 0.4]])));
      },
      ciz(b, o){
        const { W, H, deniz:y0, kum, P } = o, r = tohum(31), yer = f => Math.round(W * f), DZ = ['#7cc8e0', '#5fb4d8', '#4aa4d0', '#3a94c6', '#2f88bc', '#267cb0', '#3a9cc4', '#6cc4d0'];
        for(let y = y0; y < kum + 4; y++){ const f = (y - y0) / (kum + 4 - y0) * (DZ.length - 1), i = Math.floor(f), k = f - i; for(let x = 0; x < W; x++){ const n = k + (g2(x * 0.02, y * 0.3, 2) - 0.5) * 0.5; px(b, x, y, n > bay(x, y) ? DZ[Math.min(DZ.length - 1, i + 1)] : DZ[i]); } }
        R(b, 0, y0, W, 1, '#d4f2f8');
        const sx = W * P.gunesYeri[0];
        for(let y = y0 + 2; y < kum; y += 2){ const f = (y - y0) / (kum - y0), w = 6 + f * 40; for(let i = 0; i < 4; i++) if(r() < 0.8){ const x = sx - w / 2 + r() * w, u = 3 + r() * (5 + f * 10); for(let q = 0; q < u; q++) ortu(b, x + q, y, '!#fff4c8', 0.8); } }
        for(let i = 0; i < W * 1.1; i++){ const y = y0 + 3 + r() * (kum - y0 - 3), u = 2 + (y - y0) / 7; R(b, r() * W, y, u, 1, r() < 0.5 ? '#9cdcec' : '#205c94'); }
        for(let y = kum; y < H; y++){ const d = (y - kum) / (H - kum); for(let x = 0; x < W; x++){ const n = g2(x * 0.03, y * 0.14, 4) + (bay(x, y) - 0.5) * 0.14 - d * 0.2; px(b, x, y, d < 0.1 ? '#c4ae80' : n > 0.55 ? '#f8e8bc' : n > 0.3 ? '#f0dcae' : '#e0c690'); } }
        for(let x = 0; x < W; x++){ const y = kum + Math.round((g1(x * 0.018, 3) - 0.5) * 8 + (g1(x * 0.07, 4) - 0.5) * 3), u = 4 + Math.round(g1(x * 0.03, 5) * 7); R(b, x, y - 2, 1, u + 2, '#b8a478'); R(b, x, y - 2, 1, 2, '#fbf6ea'); if(g1(x * 0.11, 6) > 0.58) R(b, x, y - 4, 1, 2, '#e6f6f8'); R(b, x, y + u, 1, 1, '#a89468'); }
        for(let i = 0; i < W * (H - kum) / 22; i++) px(b, r() * W, kum + 4 + r() * (H - kum - 4), r() < 0.6 ? '#c4ae7c' : '#fff8e0');
        [[0.42, 0], [0.58, 1], [0.68, 2], [0.5, 2]].forEach(q => { const x = yer(q[0]), y = H - 8 - q[1] * 4; daire(b, x, y, 2, q[1] === 1 ? '#f490b4' : '#fbf6ea'); px(b, x - 1, y - 1, '#ffffff'); px(b, x, y, q[1] === 1 ? '#c8688c' : '#c8b8a0'); });
        /* Fener: kayalıkta */
        const fx = yer(0.86), fy = kum + 4, Q = H * 0.1, G = W * 0.11;
        for(let x = Math.round(fx - G); x < Math.min(W, fx + G); x++){ const v = Math.abs(x - fx) / G, h = Math.round((1 - v * v) * Q + (g1(x * 0.2, 4) - 0.5) * 5); for(let y = fy - h; y < fy + 3; y++) px(b, x, y, kayaTon(x, y, 7, ['#a89c8a', '#8c8072', '#6e6458', '#544c46', '#3e3834'])); }
        const ky = fy - Q + 1, kh = Math.round(H * 0.17);
        for(let i = 0; i < kh; i++){ const w = 8 + Math.floor(i / 5), S = Math.floor(i / (kh / 5)) % 2; R(b, fx - w / 2, ky - kh + i, w, 1, S ? '#e8505b' : '#fbf6ea'); R(b, fx + w / 2 - 3, ky - kh + i, 3, 1, S ? '#b03c48' : '#cfc8b8'); px(b, fx - w / 2, ky - kh + i, S ? '#f47c84' : '#ffffff'); }
        R(b, fx - 7, ky - kh - 1, 15, 2, '#4a2c38'); R(b, fx - 4, ky - kh - 8, 9, 7, '!#ffe6a0'); R(b, fx - 4, ky - kh - 8, 1, 7, '#4a2c38'); R(b, fx + 4, ky - kh - 8, 1, 7, '#4a2c38'); R(b, fx, ky - kh - 8, 1, 7, '#c8a050'); for(let i = 0; i < 6; i++) R(b, fx - 5 + i, ky - kh - 9 - i, 11 - i * 2, 1, '#c2503f');
        R(b, fx - 1, ky - kh * 0.5, 3, 5, '#5f86a8'); R(b, fx - 2, ky - 8, 5, 8, '#6d4632');
        if(o.gece) for(let i = 0; i < W * 0.3; i++) for(let j = -i * 0.05; j <= i * 0.05; j++) if(bay(fx - i | 0, ky - kh - 5 + j | 0) > 0.55) ortu(b, fx - 5 - i, ky - kh - 5 + j, '!#ffe6a0', 0.25);
        const palmiye = (x, F, h, yon) => {
          const eg = 0.3 / h;
          for(let i = 0; i < h; i++){ const q = x + Math.round(i * i * eg * yon); R(b, q, F - i, 5, 1, i % 4 === 0 ? '#6d4f34' : '#8a6a48'); R(b, q + 4, F - i, 1, 1, '#5a3f2a'); px(b, q, F - i, '#a48660'); px(b, q + 1, F - i, i % 4 === 0 ? '#8a6a48' : '#a48660'); }
          const tx = x + Math.round(h * 0.3 * yon) + 2, ty = F - h, ol = h / 42;
          [[-24, 9], [-22, 13], [-16, 16], [-10, 18], [-5, 19], [5, 19], [10, 18], [16, 16], [22, 13], [24, 9], [-18, 2], [-12, 5], [12, 5], [18, 2]].forEach(q0 => { const q = [Math.round(q0[0] * ol), Math.round(q0[1] * ol)], n = Math.abs(q[0]); for(let i = 0; i <= n; i++){ const dy = Math.round((i / n) ** 2 * q[1]) - Math.round(Math.sin(i / n * 3.14) * 5), X = tx + Math.sign(q[0]) * i, t = 4 - Math.round(i / n * 3); R(b, X, ty + dy, 1, t + 1, '#256a3c'); R(b, X, ty + dy, 1, t, '#3f9a4e'); px(b, X, ty + dy, '#7cc864'); if(i % 3 === 0) R(b, X, ty + dy + t, 1, 2, '#2f7c44'); } });
          daire(b, tx, ty + 1, 4, '#256a3c'); daire(b, tx - 1, ty, 3, '#3f9a4e'); daire(b, tx - 3, ty + 4, 2, '#5a3f2a'); daire(b, tx + 2, ty + 4, 2, '#6d4f34'); daire(b, tx, ty + 6, 2, '#5a3f2a'); px(b, tx - 4, ty + 3, '#a48660'); px(b, tx + 1, ty + 3, '#a48660');
        };
        for(let i = 0; i < W / 3; i++){ const x = r() * W, y = H - 2 - r() * 10; if(x < W * 0.34 || x > W * 0.92){ const h = 2 + r() * 6; R(b, x, y - h, 1, h, r() < 0.5 ? '#6a9a50' : '#8ab860'); } }
        palmiye(yer(0.03), H - 8, Math.round(H * 0.42), 1); palmiye(yer(0.24), H - 4, Math.round(H * 0.25), -1);
      },
    },
    /* Orman: iç içe ağaç katmanları, aralardan ışık sütunları, patika, geyik */
    orman:{
      yer(o){
        const { W, H, gece, sakin:s } = o, yer = f => Math.round(W * f);
        for(let i = 0; i < 16; i++){ const x = yer(0.05 + i * 0.06), y = H * (0.4 + (i * 13 % 40) / 100); s.push(rutin(x, y, [[gece ? 'bocek' : 'toz', 5 + i % 4, x + 10, false, y - 8], [gece ? 'bocek' : 'toz', 5, x, true, y]])); }
        if(!gece) s.push(rutin(yer(0.62), H * 0.82, [['geyik', 18]]), rutin(yer(0.36), H * 0.86, [['kelebek2', 5, yer(0.36) + 16, false], ['kelebek2', 5, yer(0.36), true]]));
      },
      ciz(b, o){
        const { W, H } = o, yer = f => Math.round(W * f), r = tohum(41), zemin = Math.round(H * 0.74);
        gokCiz(b, o, H * 0.7);
        const KAT = [['#b4d8bc', '#a0c8ac', '#8cb8a0', '#7ca894'], ['#8cbe94', '#72aa80', '#5c966e', '#4a845e'], ['#68a06a', '#4e8a56', '#3a7646', '#2a6238'], ['#4e8a48', '#387438', '#28602c', '#1c4e22']];
        const govde = (x, F, g, w, koyu) => { for(let i = 0; i < g; i++){ const f = i / g, ge = Math.max(2, Math.round(w * (1.5 - f * 0.7) + (i < 5 ? (5 - i) * 0.8 : 0))), sa = x + Math.sin(i * 0.05 + x) * 2.2; for(let q = 0; q < ge; q++){ const t = q / ge, n = g2((x + q) * 0.5, i * 0.08, 7); px(b, sa - ge / 2 + q, F - i, koyu ? (t < 0.22 ? '#7a5c44' : t < 0.6 ? (n > 0.62 ? '#5a4030' : '#4a3428') : '#2c1e16') : (t < 0.4 ? koyu === 0 ? KAT[1][2] : '#000' : KAT[1][3])); } } };
        for(let k = 0; k < 4; k++){
          const P = KAT[k], taban = H * (0.54 + k * 0.066);
          R(b, 0, taban - 16, W, H, P[3]);
          /* Taç örtüsü: arada gök boşluğu kalmaz, üst sınır düzensiz */
          for(let x = -12; x < W + 12; x += 7 + k * 3 + r() * (7 + k * 4)) agac(b, Math.round(x), Math.round(taban - 20 - r() * (26 + k * 6)), Math.round(8 + k * 3 + r() * (5 + k * 3)), P, Math.round(x) + k * 91);
          if(k > 1) for(let x = -8; x < W + 8; x += 26 + k * 12 + r() * 30){ const w = 2 + k * 1.6 + r() * 2; govde(x, Math.round(taban + 16), Math.round(H * 0.3 + r() * 28), w, true); }
          /* Çalı öbekleri gövdelerin dibinde */
          for(let x = -6; x < W + 6; x += 8 + r() * 10) agac(b, Math.round(x), Math.round(taban + 12 + k * 2), Math.round(3 + k + r() * 3), P, Math.round(x) + 7);
        }
        cayirCiz(b, zemin, 44, ['#7cb85a', '#62a24c', '#4e8c42', '#2f6c34'], ['#fbf6ea', '#ffe27a', '#b89ae0']);
        /* Yerde benekli güneş; yukarıdan süzülen ışık */
        if(!o.gece){
          for(let i = 0; i < 40; i++){ const x = r() * W, y = zemin + r() * (H - zemin), rx = 4 + r() * 16; for(let q = -rx; q < rx; q++) for(let j = -2 - rx * 0.12; j < 2 + rx * 0.12; j++) if(Math.abs(q) / rx + Math.abs(j) / (2 + rx * 0.12) < 1) ortu(b, x + q, y + j, '!#fff4c0', 0.16); }
          [[0.22, 22], [0.42, 30], [0.68, 24], [0.84, 16]].forEach(q => { for(let y = 0; y < zemin + 14; y++){ const c = yer(q[0]) + y * 0.36, w = q[1] * (0.4 + y / H), a = 0.17 * Math.min(1, y / 40) * Math.max(0, 1 - (y - zemin * 0.6) / (zemin * 0.5)); if(a > 0) for(let x = -w / 2; x < w / 2; x++) ortu(b, c + x, y, '!#fff4c0', a); } });
        }
        /* Patika: düzensiz kenar, ince kum, taşlar */
        for(let y = zemin; y < H; y++){ const d = (y - zemin) / (H - zemin), w = 3 + d * d * W * 0.13 + (g1(y * 0.2, 3) - 0.5) * (2 + d * 8), x = W * 0.46 + Math.sin(d * 3.6 + 0.4) * W * 0.07 * (1 - d * 0.7); for(let q = -w; q < w; q++){ const n = g2((x + q) * 0.06, y * 0.16, 4) + (bay(Math.round(x + q), y) - 0.5) * 0.2, e = Math.abs(q) / w; px(b, x + q, y, e > 0.86 ? '#8a7c52' : n > 0.6 ? '#d8bc92' : n > 0.32 ? '#c4a67c' : '#ac9068'); } }
        const t = tohum(5); for(let i = 0; i < 14; i++){ const y = zemin + t() * (H - zemin), dd = (y - zemin) / (H - zemin); kaya(b, W * 0.46 + (t() - 0.5) * W * 0.3 * dd, y, Math.round(1 + dd * 3), ['#c4c0b0', '#9c988c', '#74706a', '#545050']); }
        [[0.14, 6], [0.84, 8], [0.92, 4], [0.28, 3], [0.7, 3]].forEach(q => kaya(b, yer(q[0]), H - q[1] * 2.5, q[1], ['#c0c6a8', '#94a080', '#6e7a5c', '#4f5844']));
        /* Eğrelti: önde kümeler */
        const egrelti = (x, y, u, c) => { [-1, -0.55, -0.15, 0.2, 0.6, 1].forEach(a => { for(let i = 0; i < u; i++){ const f = i / u, X = x + a * i, Y = y - i * (0.9 - Math.abs(a) * 0.3) + f * f * u * 0.5; px(b, X, Y, c); if(i % 2 === 0){ px(b, X - 1, Y + 1, c); px(b, X + 1, Y + 1, c); } } }); };
        for(let i = 0; i < 30; i++){ const x = t() * W; if(Math.abs(x - W * 0.46) > W * 0.1) egrelti(x, H - 1 - t() * 10, 6 + t() * 10, t() < 0.5 ? '#2f6c34' : '#3f8040'); }
        /* Ön plan: iki yaşlı gövde ve üstten sarkan dallar kareyi çerçeveler */
        govde(yer(0.015), H + 2, H + 6, 13, true); govde(yer(0.975), H + 2, H + 6, 16, true);
        for(let i = 0; i < W / 2.2; i++){ const x = r() * W, u = Math.abs(x / W - 0.5) * 2; agac(b, Math.round(x), Math.round(-5 + r() * H * (0.05 + u * u * 0.17) + 6), Math.round(3 + r() * 4), ['#3f7c3c', '#2c6630', '#1e5226', '#123e1c'], i); }
      },
    },
    /* Şelale: kanyon duvarları, köpüklü düşüş, gökkuşağı, nehir */
    selale:{
      yer(o){
        const { W, H, gece, sakin:s } = o, cx = o.cx = Math.round(W * 0.5), gw = o.gw = Math.max(26, Math.round(W * 0.12)), ust = o.ust = Math.round(H * 0.24), alt = o.alt = Math.round(H * 0.66), ad = 'dusus' + gw + '_' + (alt - ust);
        if(!POZ[ad]) POZ[ad] = { h:5, k:[0, 1, 2, 3].map(() => Array(alt - ust).fill('.'.repeat(gw))), ciz(t, v, i){ for(let x = 0; x < t.W; x++){ const n = g1(x * 0.5, 2); for(let y = 0; y < t.H; y++){ const q = g1((y - i * 12 + x * 0.7 * 0) * (0.08 + n * 0.08) + x * 3.1, 5) + (x < 2 || x > t.W - 3 ? -0.2 : 0); px(t, x, y, q > 0.68 ? '!#ffffff' : q > 0.44 ? '!#d6f2fa' : q > 0.24 ? '!#9cdcf0' : '!#62b4dc'); } } } };
        gokSakin(s, o, ust);
        s.push(rutin(cx - Math.round(gw / 2), alt, [[ad, 20]]));
        for(let i = 0; i < 12; i++){ const x = cx - gw * 0.9 + (i * 17) % (gw * 1.8), y = alt + (i % 4) * 3; s.push(rutin(x, y, [['kar2', 1.6 + i % 3 * 0.4, x + (i % 2 ? 4 : -4), false, y - 7], ['gizli', 0.5]])); }
        [[0.4, 0.84], [0.56, 0.88], [0.62, 0.8], [0.3, 0.92]].forEach((q, i) => s.push(rutin(W * q[0], H * q[1], [['pirilti', 2 + i * 0.5]])));
        if(!gece) s.push(rutin(W * 0.2, H * 0.4, [['kus', 18, W * 0.38, false, H * 0.3], ['kus', 18, W * 0.2, true, H * 0.4]]));
      },
      ciz(b, o){
        const { W, H, cx, gw, ust, alt } = o, r = tohum(53), yer = f => Math.round(W * f), KT = ['#ccbca2', '#b6a48e', '#a08e7a', '#8a7868', '#736256'];
        gokCiz(b, o, H * 0.6); R(b, 0, H * 0.6 - 1, W, H, '#7ab0d0'); yildizCiz(b, o, H * 0.4); gunesCiz(b, o); gokBulutlari(b, o, H * 0.4, Math.round(W / 80));
        dagCiz(b, { taban:H * 0.5, amp:H * 0.3, s:61, pal:['#b4c8e4', '#9cb4d8', '#88a0c8', '#7890bc'], kar:KAR, karEn:0.6, pus:'#cfe0f0', frek:0.009 });
        /* Kanyon: kütle kütle kaya, ışık sol üstten; kenar girintili, tepede yosun ve çimen */
        const sinir = x => ust - 6 + (g1(x * 0.022, 6) - 0.5) * 34 + (g1(x * 0.09, 7) - 0.5) * 8;
        const duvarSu = y => gw * 0.5 + (g1(y * 0.05, 3) - 0.5) * 10 + (y - ust) * 0.015;
        for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
          if(y < sinir(x) || Math.abs(x - cx) < duvarSu(y)) continue;
          const u = y - sinir(x), m = g2(x * 0.03, y * 0.05, 11);
          if(u < 4 + g1(x * 0.3, 2) * 5) px(b, x, y, u < 1.5 ? '#b4e08c' : '#7cc060');
          else if(u < 22 && g2(x * 0.09, y * 0.12, 12) + (1 - u / 22) * 0.6 > 0.78) px(b, x, y, m > 0.5 ? '#5ea050' : '#468a48');
          else px(b, x, y, kayaTon(x, y, 8, KT));
        }
        /* Duvardan sızan ince su, kenarda sarkan yeşillik */
        [[-0.62, 0.3, 0.22], [0.7, 0.36, 0.16], [-1.2, 0.34, 0.1]].forEach(q => { const x = cx + gw * q[0] * 1.1, y0 = H * q[1]; for(let i = 0; i < H * q[2]; i++) { ortu(b, x + Math.sin(i * 0.13) * 0.7, y0 + i, '#d6f2fa', 0.55); ortu(b, x + 1 + Math.sin(i * 0.13) * 0.7, y0 + i, '#9cdcf0', 0.4); } });
        for(let i = 0; i < W / 6; i++){ const x = r() * W; if(Math.abs(x - cx) > gw * 0.65){ const y = sinir(x) + 5, u = 3 + r() * 16; for(let q = 0; q < u; q++) px(b, x + Math.sin(q * 0.4) * 0.8, y + q, r() < 0.5 ? '#4c9248' : '#2f7040'); } }
        for(let i = 0; i < 9; i++){ const x = i < 5 ? W * (0.03 + i * 0.08) : W * (0.64 + (i - 5) * 0.09), F = sinir(x) + 2; cam(b, x, F, 12 + r() * 14, ['#4c9a64', '#347e50', '#22603e']); }
        /* Düşüşün ağzı */
        R(b, cx - gw / 2 - 1, ust - 3, gw + 2, 4, '#7cc8e4'); R(b, cx - gw / 2 - 1, ust - 3, gw + 2, 1, '#d6f2fa');
        /* Gökkuşağı: sisin içinde */
        if(!o.gece) ['#ff7a7a', '#ffb45a', '#ffe27a', '#86d67c', '#6cb4f0', '#a48cf0'].forEach((c, i) => { const R0 = W * 0.17 - i * 2; for(let a = 3.6; a < 5.7; a += 0.004){ const x = cx + Math.cos(a) * R0, y = alt + 6 + Math.sin(a) * R0 * 0.82; ortu(b, x, y, '!' + c, 0.22 * Math.sin((a - 3.6) / 2.1 * 3.14)); } });
        /* Önde çayır, araya nehir kıvrılır, çakıllı kıyı */
        cayirCiz(b, Math.round(H * 0.8), 66, ['#8ccc68', '#6ab45a', '#509c4c', '#2f7040'], ['#fbf6ea', '#ffe27a', '#f490b4']);
        const orta = d => cx + Math.sin(d * 3.1) * W * 0.09 * d;
        for(let y = alt; y < H; y++){ const d = (y - alt) / (H - alt), w = gw * (0.95 + d * d * 3.2 + (y < H * 0.8 ? 0 : 0)) + (g1(y * 0.18, 5) - 0.5) * (2 + d * 8), c0 = orta(d); for(let x = c0 - w - 4 - d * 8; x < c0 + w + 4 + d * 8; x++){ const q = Math.abs(x - c0) / w; if(q >= 1){ if(y > H * 0.72 || d > 0.1){ const n = g2(x * 0.12, y * 0.2, 3) + (bay(Math.round(x), y) - 0.5) * 0.2; px(b, x, y, n > 0.56 ? '#cfc4a8' : n > 0.34 ? '#b0a488' : '#8c826c'); } continue; } const n = g2(x * 0.016, y * 0.42 - d, 4) + (bay(Math.round(x), y) - 0.5) * 0.08 - d * 0.1, kup = d < 0.16 && g2(x * 0.08, y * 0.26, 5) > 0.22 + d * 2.6; px(b, x, y, kup ? '!#ffffff' : n > 0.72 ? '#d6f2fa' : n > 0.5 ? '#8ad0e8' : n > 0.3 ? '#5eacd4' : '#4490c0'); } }
        /* Sis: düşüşün dibinde */
        for(let y = alt - 22; y < alt + 16; y++) for(let x = cx - gw * 1.3; x < cx + gw * 1.3; x++){ const u = 1 - Math.hypot((x - cx) / (gw * 1.3), (y - alt) / 24); if(u > 0 && g2(x * 0.06, y * 0.09, 6) + u * 0.6 > 0.72) ortu(b, x, y, '!#ffffff', 0.45 * u); }
        const P = ['#d0ccbc', '#a4a094', '#7a766e', '#585450'], t = tohum(9);
        for(let i = 0; i < 22; i++){ const y = alt + t() * (H - alt), d = (y - alt) / (H - alt), yn = t() < 0.5 ? -1 : 1, x = orta(d) + yn * gw * (0.7 + d * d * 3.4) * (0.7 + t() * 0.6); kaya(b, Math.round(x), Math.round(y), Math.round(1 + d * 5 + t() * 2), P); }
        onOt(b, ['#4c9248', '#2f7040'], 7, 0.7);
      },
    },
    /* Kış: karlı köy, ışıklı pencereler, duman, süzülen kar */
    kis:{
      yer(o){
        const { W, H, sakin:s } = o, yer = f => Math.round(W * f), a = tohum(71);
        gokSakin(s, o, H * 0.36);
        for(let i = 0; i < Math.round(W / 8); i++){ const x = a() * W, y0 = -4 - a() * H * 0.5, sure = 9 + a() * 8, sag = (a() - 0.3) * 30; s.push(rutin(x, y0, [[a() < 0.2 ? 'kar2' : 'kar', sure, x + sag, false, H + 2]])); }
        [[0.3, 0.57], [0.58, 0.62], [0.78, 0.55]].forEach(q => s.push(rutin(yer(q[0]) + 18, H * q[1] - 30, [['duman', 12]])));
      },
      ciz(b, o){
        const { W, H } = o, yer = f => Math.round(W * f), r = tohum(73), ufuk = Math.round(H * 0.5);
        dagCiz(b, { taban:ufuk + 6, amp:H * 0.34, s:81, pal:['#a0aec8', '#8896b4', '#6e7ea0', '#5a6a8c'], kar:KAR, karEn:0.34, pus:'#dce6f4', frek:0.0055 });
        dagCiz(b, { taban:ufuk + 8, amp:H * 0.18, s:84, pal:['#94a4bc', '#7c8caa', '#667694', '#546482'], kar:KAR, karEn:0.5, pus:'#e6eef8', frek:0.011 });
        const karliCam = (x, F, h, P) => { cam(b, x, F, h, P); for(let i = 0; i < h; i += 3){ const w = Math.floor((i % 4 + i * 0.32) * 0.72) + 1, y = F - 2 - h + i; for(let q = -w; q <= w * 0.5; q++) if(hash(q + i * 7, x) > 0.25) px(b, x + q, y, '#ffffff'); } };
        for(let x = -3; x < W; x += 4 + Math.floor(r() * 4)) karliCam(x, ufuk + 8 + Math.floor(r() * 3), 8 + Math.floor(r() * 7), ['#8aa8ba', '#7094a8', '#587e94']);
        const K = ['#ffffff', '#f8fafe', '#eef3fb', '#e0e8f4'];
        R(b, 0, ufuk + 6, W, H, '#eef3fb');
        tepeCiz(b, { taban:ufuk + 16, amp:8, s:13, pal:K, frek:0.009 });
        for(let x = -3; x < W; x += 9 + Math.floor(r() * 14)) karliCam(x, ufuk + 17 + Math.floor(r() * 5), 12 + Math.floor(r() * 10), ['#5e8c7c', '#44746a', '#305e56']);
        const ev = (x, F, w, h, c, c2) => {
          R(b, x, F - h, w, h, c); R(b, x + w - 4, F - h, 4, h, c2);
          for(let j = 3; j < h; j += 3){ R(b, x, F - j, w, 1, c2); }
          const ca = Math.round(w * 0.46); for(let i = 0; i < ca; i++){ const y = F - h - i; R(b, x - 4 + i, y, w + 8 - i * 2, 1, '#e8eef8'); R(b, x + w - i - 1, y, 5, 1, '#c8d4e8'); }
          for(let q = x - 4; q < x + w + 4; q++) if(hash(q, 3) > 0.3) R(b, q, F - h, 1, 1 + Math.floor(hash(q, 5) * 3), '#ffffff');
          R(b, x + w - 12, F - h - ca - 3, 6, ca - 2, '#7a6458'); R(b, x + w - 13, F - h - ca - 5, 8, 3, '#ffffff');
          R(b, x + Math.round(w * 0.42), F - 11, 7, 11, '#4a3028'); R(b, x + Math.round(w * 0.42) + 1, F - 10, 5, 10, '#6d4632'); px(b, x + Math.round(w * 0.42) + 5, F - 5, '#e8b45a');
          [[0.12], [0.72]].forEach(q => { const X = x + Math.round(w * q[0]), Y = F - h + 4; R(b, X - 1, Y - 1, 8, 9, '#fbf6ea'); R(b, X, Y, 6, 7, '!#ffe08a'); R(b, X + 3, Y, 1, 7, '#6d4632'); R(b, X, Y + 3, 6, 1, '#6d4632'); R(b, X - 2, Y + 7, 10, 1, '#ffffff'); });
          R(b, x - 4, F - 1, w + 8, 4, '#ffffff');
          if(o.gece) [[0.12], [0.72]].forEach(q => { const X = x + Math.round(w * q[0]) + 3, Y = F - h + 8; for(let j = -14; j < 14; j++) for(let i = -14; i < 14; i++){ const u = 1 - Math.hypot(i, j) / 14; if(u > 0) ortu(b, X + i, Y + j, '!#ffd080', u * 0.2); } });
        };
        ev(yer(0.08), ufuk + 42, 40, 22, '#a0704e', '#7c5a3e'); ev(yer(0.3), ufuk + 38, 44, 24, '#b8584a', '#944438'); ev(yer(0.58), ufuk + 46, 52, 28, '#a88460', '#846648'); ev(yer(0.8), ufuk + 36, 38, 20, '#5f86a8', '#4a6a88');
        tepeCiz(b, { taban:ufuk + 52, amp:6, s:15, pal:K, frek:0.012 });
        /* Patika: kardaki iz, evlere dolanır */
        for(let y = ufuk + 54; y < H; y++){ const d = (y - ufuk - 54) / (H - ufuk - 54), w = 2 + d * d * W * 0.07, x = W * 0.52 + Math.sin(d * 3) * W * 0.1; for(let q = -w; q < w; q++) px(b, x + q, y, Math.abs(q) > w - 1 ? '#c8d4e8' : (g2((x + q) * 0.2, y * 0.3, 3) > 0.5 ? '#d8e2f0' : '#ccd8ea')); }
        /* Çit: kara gömülü */
        const cy = ufuk + 58; for(let x = 0; x < W * 0.44; x += 14){ R(b, x, cy - 8, 2, 9, '#6d4632'); R(b, x, cy - 9, 2, 2, '#ffffff'); } R(b, 0, cy - 5, W * 0.44, 1, '#8a6450'); R(b, 0, cy - 6, W * 0.44, 1, '#ffffff');
        /* Donmuş gölet: kıyı düzensiz */
        const gx = W * 0.26, gy = H * 0.84, rx = W * 0.15, ry = H * 0.055;
        for(let y = -ry - 2; y <= ry + 2; y++) for(let x = -rx - 2; x <= rx + 2; x++){ const a = Math.atan2(y / ry, x / rx), u = Math.hypot(x / rx, y / ry) - (g1(a * 2.2 + 9, 6) - 0.5) * 0.3; if(u < 1) px(b, gx + x, gy + y, g2((gx + x) * 0.03, (gy + y) * 0.2, 6) > 0.56 ? '#d4ecf6' : '#aed6ea'); else if(u < 1.08) px(b, gx + x, gy + y, '#c8d8ec'); }
        for(let i = 0; i < 6; i++){ const x = gx - rx * 0.6 + r() * rx * 1.2, y = gy - ry * 0.5 + r() * ry, w = 6 + r() * 16; for(let q = 0; q < w; q++) px(b, x + q, y + q * 0.1, '#ffffff'); }
        [[0.03, 40], [0.075, 30], [0.12, 22], [0.9, 26], [0.94, 34], [0.985, 44]].forEach(q => karliCam(yer(q[0]), H - 1, q[1], ['#3f6c5c', '#2c5a4c', '#1e463c']));
        const kx = yer(0.7), ky = Math.round(H * 0.9); daire(b, kx, ky, 7, '#dfe7f4'); daire(b, kx - 1, ky - 1, 6, '#ffffff'); daire(b, kx, ky - 10, 5, '#dfe7f4'); daire(b, kx - 1, ky - 11, 4, '#ffffff'); px(b, kx - 2, ky - 11, '#2a1a1c'); px(b, kx + 1, ky - 11, '#2a1a1c'); R(b, kx, ky - 10, 3, 1, '#e8953a'); R(b, kx - 5, ky - 6, 10, 2, '#c2503f'); R(b, kx + 2, ky - 6, 2, 5, '#a8402f'); R(b, kx - 4, ky - 15, 9, 1, '#2a2430'); R(b, kx - 3, ky - 19, 7, 4, '#2a2430'); R(b, kx - 3, ky - 16, 7, 1, '#c2503f'); [-2, 0, 3].forEach((q, i) => px(b, kx + q, ky - 3 + i * 2, '#3a3244'));
      },
    },
    /* Çöl: katmanlı kumullar, kaktüs, vaha, deve kervanı; gece yıldızlı */
    col:{
      yer(o){
        const { W, H, gece, sakin:s } = o, yer = f => Math.round(W * f), ky = Math.round(H * 0.6);
        gokSakin(s, o, H * 0.3);
        if(!gece) s.splice(0, 3);
        [0, 16, 32].forEach((d, i) => s.push(rutin(-20 - d, ky, [['deve', W / 9, W + 20 - d, false], ['gizli', 20]])));
        [[0.7, 0.84], [0.76, 0.87]].forEach((q, i) => s.push(rutin(yer(q[0]), H * q[1], [['pirilti', 2 + i]])));
      },
      ciz(b, o){
        const { W, H } = o, yer = f => Math.round(W * f), r = tohum(83);
        dagCiz(b, { taban:H * 0.54, amp:H * 0.14, s:91, pal:['#e4b4a0', '#cc9c90', '#b48480', '#a07478'], kar:null, karEn:1, pus:'#f0ccb0', frek:0.012 });
        /* Mesa: düz tepeli kaya kütleleri */
        [[0.12, 0.09, 0.2], [0.82, 0.12, 0.15], [0.3, 0.05, 0.1]].forEach(q => { const x = yer(q[0]), w = W * q[1], h = H * q[2], F = H * 0.56; for(let i = -w; i < w; i++){ const t = F - h + (Math.abs(i) > w * 0.7 ? (Math.abs(i) - w * 0.7) * 2.4 : 0) + (g1((x + i) * 0.2, 3) - 0.5) * 3; for(let y = Math.round(t); y < F; y++){ const n = g2((x + i) * 0.02, y * 0.2, 5) * 0.55 + (i < 0 ? 0.22 : -0.02) + (bay(x + i, y) - 0.5) * 0.08, k = Math.floor(y / 5 + g1((x + i) * 0.03, 8) * 1.5) % 4; px(b, x + i, y, kayaTon(x + i, y, 5, k === 0 ? ['#f0b080', '#dc9468', '#c07c58', '#a0644a', '#804e40'] : n > 0.4 ? ['#ecaa78', '#d48c62', '#b87452', '#985e46', '#784a3c'] : ['#c88a64', '#b07450', '#945e42', '#784c38', '#603c30'])); } } });
        R(b, 0, H * 0.54, W, H * 0.46, '#f0c484');
        /* Kumullar: keskin sırt, aydınlık ve gölgeli yüz, rüzgâr çizgileri */
        const kumul = (taban0, amp, s, P) => { const u = new Float32Array(W + 2); for(let x = 0; x <= W + 1; x++) u[x] = taban0 + (g1(x * 0.007, s) - 0.5) * amp * 2 + (g1(x * 0.021, s + 1) - 0.5) * amp * 0.5; for(let x = 0; x < W; x++){ const e = u[Math.min(W + 1, x + 10)] - u[Math.max(0, x - 10)], gol = Math.max(0, Math.min(1, e * 0.14)), isik = Math.max(0, Math.min(1, -e * 0.09)); for(let y = Math.round(u[x]); y < H; y++){ const d = y - u[x], g = gol * Math.max(0, 1 - d / 34), a = isik * Math.max(0, 1 - d / 18), n = g2(x * 0.012 + y * 0.03, y * 0.42, s), by = bay(x, y); px(b, x, y, g > by * 0.95 ? (g > 0.6 + by * 0.3 ? P[3] : P[2]) : a > by ? P[0] : n > 0.66 ? P[0] : P[1]); } px(b, x, u[x], gol > 0.1 ? P[2] : P[0]); } };
        kumul(H * 0.56, H * 0.04, 3, ['#fbdca0', '#f0c484', '#d8a46c', '#b8845c']);
        kumul(H * 0.64, H * 0.05, 5, ['#fcdf9c', '#f4c880', '#dca668', '#b47e54']);
        /* Vaha */
        const vx = yer(0.74), vy = Math.round(H * 0.8), RX = W * 0.11, RY = H * 0.045;
        for(let i = -RY - 3; i <= RY + 3; i++){ const w = Math.sqrt(Math.max(0, 1 - i * i / ((RY + 3) * (RY + 3)))) * (RX + 6); R(b, vx - w, vy + i, w * 2, 1, '#7cb060'); } for(let i = -RY; i <= RY; i++){ const w = Math.sqrt(1 - i * i / (RY * RY)) * RX; R(b, vx - w, vy + i, w * 2, 1, i < 0 ? '#7cd0e8' : '#4caad8'); } R(b, vx - RX * 0.4, vy - 1, RX * 0.5, 1, '#e6f8fc');
        const palm = (x, F, h, yon) => { for(let i = 0; i < h; i++) R(b, x + i * i * 0.014 * yon, F - i, 3, 1, i % 3 ? '#8a6a48' : '#6d4f34'); const tx = x + h * h * 0.014 * yon + 1, ty = F - h; [[-13, 7], [-9, 9], [-5, 8], [5, 8], [9, 9], [13, 7]].forEach(q => { const n = Math.abs(q[0]); for(let i = 0; i <= n; i++){ const dy = Math.round((i / n) ** 2 * q[1]) - Math.round(Math.sin(i / n * 3.14) * 3); R(b, tx + Math.sign(q[0]) * i, ty + dy, 1, 2, '#2f7c44'); px(b, tx + Math.sign(q[0]) * i, ty + dy, '#6cbc5a'); } }); };
        palm(vx - RX - 6, vy - 2, 26, 1); palm(vx + RX + 2, vy, 32, -1); palm(vx - RX * 0.2, vy - RY - 2, 20, -1);
        kumul(H * 0.84, H * 0.04, 7, ['#fde4a8', '#f6cf8c', '#e0ae72', '#bc865c']);
        const kaktus = (x, F, h) => { R(b, x, F - h, 5, h, '#4c8a4a'); R(b, x, F - h, 1, h, '#74b45c'); R(b, x + 4, F - h, 1, h, '#2f6c3c'); R(b, x - 5, F - h * 0.6, 5, 3, '#4c8a4a'); R(b, x - 5, F - h * 0.86, 3, h * 0.26, '#4c8a4a'); R(b, x - 5, F - h * 0.86, 1, h * 0.26, '#74b45c'); R(b, x + 5, F - h * 0.46, 5, 3, '#3f7f44'); R(b, x + 7, F - h * 0.72, 3, h * 0.26, '#3f7f44'); for(let i = 2; i < h; i += 4) px(b, x + 2, F - i, '#a4d67c'); };
        onOt(b, ['#c8a060', '#a8824c'], 9, 0.25);
        kaktus(yer(0.14), H - 6, 34); kaktus(yer(0.34), H - 2, 20); kaktus(yer(0.92), H - 4, 28);
        [[0.22, 5], [0.5, 4], [0.58, 3]].forEach(q => kaya(b, yer(q[0]), H - 6 - q[1], q[1], ['#d8b894', '#b4906c', '#8a6c54', '#6a5040']));
      },
    },
    /* Kiraz vadisi: çiçek açmış ağaçlar, dere, taş köprü, süzülen yapraklar */
    kiraz:{
      yer(o){
        const { W, H, gece, sakin:s } = o, a = tohum(101);
        gokSakin(s, o, H * 0.36);
        for(let i = 0; i < Math.round(W / 9); i++){ const x = a() * W, y0 = -4 - a() * H * 0.4, sure = 12 + a() * 10; s.push(rutin(x, y0, [['yaprak', sure, x + 40 + a() * 40, false, H + 2]])); }
        [[0.46, 0.78], [0.54, 0.84], [0.42, 0.9]].forEach((q, i) => s.push(rutin(W * q[0], H * q[1], [['pirilti', 2 + i * 0.5]])));
        if(!gece) s.push(rutin(W * 0.5, H * 0.72, [['ordek', 16, W * 0.6, false], ['ordek', 16, W * 0.5, true]]));
      },
      ciz(b, o){
        const { W, H } = o, r = tohum(103), yer = f => Math.round(W * f), ufuk = Math.round(H * 0.46);
        dagCiz(b, { taban:ufuk + 8, amp:H * 0.24, s:111, pal:['#d4cce8', '#bcb4dc', '#a8a0d0', '#9890c4'], kar:KAR, karEn:0.72, pus:'#ece6f4', frek:0.0055 });
        const PEMBE = ['#ffe4ee', '#ffc4d8', '#f498bc', '#c86c98'], UZAK = ['#f4dcec', '#ecc4dc', '#dcaccc', '#cc9cc0'];
        R(b, 0, ufuk + 8, W, H, '#94c86c');
        tepeCiz(b, { taban:ufuk + 14, amp:6, s:16, pal:['#c4e08c', '#a8d47c', '#94c86c', '#80bc60'], frek:0.012 });
        for(let i = 0; i < 26; i++){ const x = r() * W, F = ufuk + 12 + r() * 12; agac(b, x, F, 4 + r() * 4, UZAK, i); }
        tepeCiz(b, { taban:ufuk + 34, amp:7, s:17, pal:['#b4dc80', '#98cc6c', '#82bc5e', '#6eac52'], frek:0.01 });
        /* Dere: ufuktan öne genişler */
        for(let y = ufuk + 34; y < H; y++){ const d = (y - ufuk - 34) / (H - ufuk - 34), w = 3 + d * d * W * 0.18, x = W * 0.5 + Math.sin(d * 5) * W * 0.07 * (1 - d * 0.5); for(let q = -w; q < w; q++){ const n = g2((x + q) * 0.05, y * 0.3, 4) + (bay(Math.round(x + q), y) - 0.5) * 0.16; px(b, x + q, y, Math.abs(q) > w - 1.5 ? '#d8d0b8' : n > 0.62 ? '#c4e8f4' : n > 0.36 ? '#8ad0e8' : '#62b4dc'); } }
        /* Taş köprü */
        const kx = W * 0.5 + Math.sin((0.4) * 5) * W * 0.07 * 0.8, ky = Math.round(ufuk + 34 + (H - ufuk - 34) * 0.4), kw = W * 0.09;
        for(let i = -kw; i < kw; i++){ const u = 1 - (i / kw) ** 2, y = ky - u * 12; R(b, kx + i, y, 1, 6 + (1 - u) * 6, Math.floor((i + 80) / 5) % 2 ? '#b4aca0' : '#a09888'); px(b, kx + i, y, '#d8d0c4'); if(Math.abs(i) < kw * 0.6) R(b, kx + i, y + 6, 1, u * 8 + 2, '#5ea8d0'); if(Math.floor(i + 80) % 9 === 0) R(b, kx + i, y - 5, 1, 5, '#6d4632'); } for(let i = -kw; i < kw; i++) px(b, kx + i, ky - (1 - (i / kw) ** 2) * 12 - 5, '#8a5a48');
        /* Taş fener */
        const tx = yer(0.34), ty = Math.round(H * 0.72); R(b, tx - 1, ty - 12, 3, 12, '#a09888'); R(b, tx - 4, ty - 16, 9, 4, '#b4aca0'); R(b, tx - 2, ty - 15, 5, 2, '!#ffe08a'); for(let i = 0; i < 4; i++) R(b, tx - 6 + i, ty - 17 - i, 13 - i * 2, 1, '#8a8478'); R(b, tx - 4, ty, 9, 2, '#8a8478');
        /* Büyük kiraz ağaçları */
        const kiraz = (x, F, q, s) => { const g = Math.round(q * 1.2); for(let i = 0; i < g; i++){ const w = 3 + (g - i) * 0.12; R(b, x + Math.sin(i * 0.09) * 3, F - i, w, 1, i % 5 ? '#6d4a40' : '#54382f'); px(b, x + Math.sin(i * 0.09) * 3, F - i, '#8c6c5c'); } const c = tohum(s); for(let i = 0; i < 5; i++){ const a = 3.6 + i * 0.55, u = q * 0.7; for(let j = 0; j < u; j++) R(b, x + 1 + Math.cos(a) * j, F - g + Math.sin(a) * j, 2, 1, '#54382f'); } agac(b, x + 1, F - g + q * 0.5, Math.round(q), PEMBE, s); for(let i = 0; i < 5; i++) agac(b, x + 1 + (c() - 0.5) * q * 1.7, F - g + q * 0.5 + (c() - 0.5) * q * 0.9, Math.round(q * (0.45 + c() * 0.2)), PEMBE, s + i); for(let i = 0; i < q * 3; i++) px(b, x + (c() - 0.5) * q * 3, F - g + (c() - 0.3) * q * 1.3, c() < 0.5 ? '#ffffff' : '#ffe4ee'); };
        kiraz(yer(0.16), H - 16, Math.round(H * 0.13), 3); kiraz(yer(0.82), H - 12, Math.round(H * 0.15), 7); kiraz(yer(0.68), Math.round(H * 0.76), Math.round(H * 0.07), 9); kiraz(yer(0.3), Math.round(H * 0.66), Math.round(H * 0.05), 11);
        onOt(b, ['#7cb058', '#5a9446'], 11, 0.6);
        /* Ön plan: yere düşmüş yapraklar */
        for(let i = 0; i < W * 1.6; i++){ const x = r() * W, y = H * 0.68 + r() * H * 0.32; if(Math.abs(x - W * 0.5) > W * 0.1 + (y / H - 0.68) * W * 0.3) px(b, x, y, r() < 0.5 ? '#ffc4d8' : '#f8e0ec'); }
      },
    },
  };
  const TUR_LISTE = Object.freeze(['dag', 'magara', 'gol', 'deniz', 'orman', 'selale', 'kis', 'col', 'kiraz', 'tarla']);

  /* ---------- ORTAK GÖK + ÇİZİM ---------- */
  const GOK_BOY = { tarla:0.5, dag:0.68, gol:0.52, deniz:0.5, kis:0.56, col:0.58, kiraz:0.52 };
  function binaCiz(g, o){
    const b = tampon(o.W, o.H), boy = GOK_BOY[o.tur];
    ambAyarla([1, 1, 1]);
    if(boy || o.tur === 'magara'){
      const gb = Math.round(o.H * (boy || 0.74));
      gokCiz(b, o, gb); yildizCiz(b, o, gb * 0.9); gunesCiz(b, o);
      gokBulutlari(b, o, gb * 0.7, Math.max(3, Math.round(o.W / (o.tur === 'col' ? 150 : 56))));
    }
    ambAyarla(o.P.amb);
    TURLER[o.tur].ciz(b, o);
    ambAyarla([1, 1, 1]);
    g.putImageData(new ImageData(new Uint8ClampedArray(b.d.buffer), o.W, o.H), 0, 0);
  }
  function yerlesim(W, H, v, tur){
    const o = taban(TURLER[tur] ? tur : 'tarla', W, H, v);
    TURLER[o.tur].yer(o);
    return o;
  }
  function kare(g, arka, o, t){
    const k = o.sakin.map(s => kareAl(s, t)), imza = k.map(q => (q ? q.poz + q.i + ',' + q.x + ',' + q.y : '-')).join('|');
    if(imza === o.imza) return 0;
    o.imza = imza;
    g.drawImage(arka, 0, 0);
    k.filter(Boolean).sort((a, c) => (a.y + POZ[a.poz].k[a.i].length) - (c.y + POZ[c.poz].k[c.i].length)).forEach(q => g.drawImage(gorsel(q.poz, q.i, q.ters, o.vakit), q.x, q.y));
    return 1;
  }
  L.PIKSEL_DOGA = Object.freeze({ vakit, yerlesim, binaCiz, kare, kareAl, POZ, PALET, TUR_LISTE });
})(window.LIFEOS);
