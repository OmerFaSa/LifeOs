/* PİKSEL MANZARA — tarla, dağ, mağara, göl, deniz, yayla, şelale, kış, çöl, kiraz vadisi.
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
  const P_SABIT = { K:'#4a2c38', w:'#fbf6ea', W:'#e4dccb', s:'#f0c8b0', e:'#2a1a1c', d:'#3a3244', r:'#e8606b', R:'#b8444f', y:'#fff0b0', b:'#8ad0e8', B:'#5f86a8', o:'#d9a94f', O:'#e8953a', z:'#fff27a', n:'#7d5540', N:'#a8784f', p:'#f4a0c0', g:'#6f4a30', t:'#c9a27a', T:'#8a6450', G:'#f0c040', A:'#e30a17', a:'#a8101c', X:'#241826', Z:'#e8906c', V:'#6a5470' };
  const pp = (P, o) => Object.assign({ }, P, o);

  /* ---------- TÜRK TEMASI sprit'leri (örnek) ---------- */
  const AT_DUR = ['..............K.K.', '.............KNNNK', '............eNNeNK', '...........eNNNNNK', '...eKKKKKKKNNnKK..', '..eKNNNNNNNNNNK...', '..eKNNNNNNNNNnK...', '.e.KnNNNNNNNnnK...', '.e.KgnnnnnnnngK...', 'e..KgKnKKKKgKnK...', '...KgKnK..KgKnK...', '...KgKnK..KgKnK...', '...KKKKK..KKKKK...'];
  const AT_ADIM = AT_DUR.slice(0, 10).concat(['..KgK.KnKKgK.KnK..', '.KgK...KnKgK..KnK.', '.KKK...KKKKK..KKK.']);
  const AT_OTLA = ['..................', '..................', '..................', '..................', '...eKKKKKKKKK.....', '..eKNNNNNNNNNKK...', '..eKNNNNNNNNNNNK..', '.e.KnNNNNNNNnnNNK.', '.e.KgnnnnnnnngKNK.', 'e..KgKnKKKKgKnKNNK', '...KgKnK..KgKnKeNK', '...KgKnK..KgKnKNNK', '...KKKKK..KKKKKKKK'];
  const AT_OTLA2 = AT_OTLA.map((r, j) => (j === 7 || j === 8 ? 'e..' + r.slice(3) : j === 9 ? '.e.' + r.slice(3) : r));
  const ATLI_UST = ['........KK..........', '.......KooK.........', '.......essK.........', '.....nKRRRK.........', '.....nRRRRRs........', '......KRRRRK........', '......KRK......KK...', '..ee.KKKKKKKKKKNNK..', '.e..KNNNNNNNNNNNNeNK', 'e...KNNNNNNNNNNNNNNK', '....KnNNNNNNNNnnKKK.', '....KgnnnnnnnnngK...', '.....KgKKKKKKKgK....'];
  const ATLI_BACAK = [['....Kg........gK....', '...Kg..........gK...', '..KK............KK..'], ['......KgK..KgK......', '.......Kg..gK.......', '.......KK..KK.......'], ['.....Kg......KgK....', '....Kg.......Kg.....', '....KK.......KK.....']];
  const ASKER = [['......X', '.....X.', '..XXXX.', '..XXXX.', '..XXX..', '.XXXXX.', '.XXXXX.', '.XXXXX.', '..XXX..', '..X.X..', '.X...X.', 'XX...XX'], ['......X', '.....X.', '..XXXX.', '..XXXX.', '..XXX..', '.XXXXX.', '.XXXXX.', '.XXXXX.', '..XXX..', '..XX...', '..XX...', '..XXX..']];
  const KAGNI = [['..KKKKKKKKK.................', '..KNNNKNNNK.................', '..KNnNKNnNK.............W..W', 'KKKKKKKKKKKKK..KKKKKKKKKKttK', 'KNNNNNNNNNNNK.KttttttttttteK', 'KnnnnnnnnnnnKgKtttttttttTTTK', 'KKKKKKKKKKKKK.KTTTTTTTTTKKK.', '...KKKKKK.....KtK..KtKtK....', '..KgggggKK....KtK..KtKtK....', '..KggKggK.....KTK..KTKTK....', '..KgggggK.....KKK..KKKKK....', '...KKKKK....................']];
  KAGNI.push(KAGNI[0].slice(0, 9).concat(['..KggKggK....KTK....KTKTK...', '..KgggggK....KKK....KKKKK...', '...KKKKK....................']));
  const KADIN = [['.WW..', 'WWWs.', '.Ws..', 'NBBB.', 'NBBBs', '.BBB.', '.BBB.', 'BBBBB', '.K.K.', 'K...K'], ['.WW..', 'WWWs.', '.Ws..', 'NBBB.', 'NBBBs', '.BBB.', '.BBB.', 'BBBBB', '.KK..', '.K.K.']];
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

    atli:{ h:8, k:[0, 2, 1, 2].map(i => ATLI_UST.concat(ATLI_BACAK[i])) },
    at:{ h:0.3, k:[AT_DUR, AT_OTLA, AT_OTLA2, AT_OTLA] },
    atyuru:{ h:3, k:[AT_DUR, AT_ADIM] },
    burkut:{ h:1.6, k:[['ee...........ee', '.eee...t...eee.', '...eeeeeeeee...', '.....eeeee.....', '......e.e......'], ['...............', 'eeee...t...eeee', '...eeeeeeeee...', '.....eeeee.....', '......e.e......']] },
    puskul:{ h:2, k:[['eee..', 'eeee.', 'edee.', '.eeee', '.edee', '..eee', '..e.e', '...e.', '.....'], ['eee..', 'eeee.', 'eede.', 'eeee.', '.eee.', '.ede.', '.e.e.', '..e..', '.....']] },
    ates:{ h:6, k:[['.y.', 'yzy', 'zOz', 'OOO'], ['..y', '.zy', 'zOz', 'OOO'], ['y..', 'yz.', 'zOz', 'OOO']] },
    albayrak:{ h:2.4, k:[0, 1, 2].map(() => Array(15).fill('.'.repeat(20))), ciz(t, v, i){ bayrakCiz(t, i, ['#ff3a40', '#e30a17', '#a8101c'], ayYildiz); } },
    halka:{ h:2.4, k:[0, 1, 2].map(() => Array(15).fill('.'.repeat(22))), ciz(t, v, i){ bayrakCiz(t, i, ['#c83040', '#9a1c2c', '#6a1420'], ucHalka); } },
    asker:{ h:3, k:siluet(ASKER) },
    kagni:{ h:1.5, k:siluet(KAGNI) },
    kadin:{ h:2, k:siluet(KADIN) },
    piyade:{ h:3, k:[['.V.', 'VVV', '.V.', 'V.V'], ['.V.', 'VVV', '.V.', '.V.']] },
    patla:{ h:4, k:[['..z..', '.zwz.', 'zwwwz', '.zwz.', '..z..'], ['.OyO.', 'OyzyO', 'yzOzy', 'OyzyO', '.OyO.'], ['.WWW.', 'WWWWW', 'WWWWW', '.WWW.', '.....']] },
    parlama:{ h:1, k:[['..y....', '.yzy...', 'yzwzyyy', '.yzy...', '..y....']] },
    tutun:{ h:1, k:[['.WWW.', 'WWWWW', 'WWWWW', '.WWW.']] },
    yolcu:{ h:2, k:[['.ww..', 'wwws.', '.ss..', 'BBBB.', 'BBBBs', 'BBB..', 'BBB..', 'BBBB.', '.K.K.', 'K...K'], ['.ww..', 'wwws.', '.ss..', 'BBBB.', 'BBBBs', 'BBB..', 'BBB..', 'BBBB.', '.KK..', '.K.K.']] },
    gizli:{ h:1, k:[[]] },
  };
  const renkle = (k, m) => k.map(f => f.map(r => r.replace(/./g, c => m[c] || c)));
  POZ.atli2 = { h:8, k:renkle(POZ.atli.k, { R:'B', o:'K', N:'d', n:'K', g:'K' }) };
  POZ.atli3 = { h:8, k:renkle(POZ.atli.k, { R:'T', o:'R', N:'w', n:'W', g:'t' }) };
  POZ.atak = { h:0.3, k:renkle(POZ.at.k, { N:'w', n:'W', g:'t', e:'W' }) };
  POZ.atkara = { h:0.3, k:renkle(POZ.at.k, { N:'d', n:'d', g:'e' }) };
  POZ.deve2 = { h:0.8, k:renkle(POZ.deve.k, { d:'t' }) };
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


  /* ---------- TÜRK TEMASI yardımcıları (örnek) ---------- */
  /* Sabit bit eşlem: alt kenarı F; isik verilirse üst ve sol kenar ona boyanır (arkadan gelen ışık) */
  function damga(b, x0, F, S, C, isik){
    const n = S.length;
    for(let j = 0; j < n; j++){ const r = S[j]; for(let i = 0; i < r.length; i++){ const c = C[r[i]]; if(!c) continue; const kenar = isik && (i === 0 || !C[r[i - 1]] || j === 0 || !C[S[j - 1][i]]); px(b, x0 + i, F - n + j, kenar ? isik : c); } }
  }
  /* Sprit'i siluete çevirir: üst kenar ışık (Z), gövde koyu (X) */
  function siluet(k){ return k.map(f => f.map((r, j) => r.replace(/[^.]/g, (c, i) => (j === 0 || (f[j - 1][i] || '.') === '.') ? 'Z' : 'X'))); }
  /* Sis katmanı: altta yoğun, yukarı titreşimle incelir */
  function sisKat(b, y0, h, c, a){ for(let j = 0; j < h; j++){ const k = 1 - j / h, y = y0 + h - 1 - j; for(let x = 0; x < b.W; x++) if(bay(x, y) < 0.9 * k) ortu(b, x, y, c, a * (0.4 + k * 0.6)); } }
  /* Türk gökyüzü (yalnız gece): Kuş Yolu, Yedi Han, Demir Kazık */
  function turkGogu(b, o, boy){
    if(!o.gece) return;
    const { W } = b, L = Math.hypot(W * 0.7, boy);
    for(let y = 0; y < boy; y++) for(let x = 0; x < W; x++){
      const d = ((x - W * 0.15) * boy + (y - boy) * W * 0.7) / L, k = Math.max(0, 1 - Math.abs(d) / (boy * 0.2)) * (0.55 + 0.45 * g2(x * 0.06, y * 0.08, 5));
      if(k > 0 && bay(x, y) < k * 0.55) ortu(b, x, y, '!#d4d0f4', 0.22);
      if(k > 0.3 && hash(x * 13 + y * 7, 3) > 0.985) px(b, x, y, '!#f4f0ff');
    }
    const yx = Math.round(W * 0.16), yy = Math.round(boy * 0.6), k = 1.4;
    const yildiz = (x, y, buyuk) => { x = Math.round(x); y = Math.round(y); px(b, x, y, '!#fffbe8'); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(q => ortu(b, x + q[0], y + q[1], '!#fff0c0', buyuk ? 0.85 : 0.55)); if(buyuk) [[2, 0], [-2, 0], [0, 2], [0, -2]].forEach(q => ortu(b, x + q[0], y + q[1], '!#fff0c0', 0.35)); };
    [[0, 6], [8, 2], [14, 1], [20, 2], [21, 8], [29, 9], [29, 1]].forEach(p => yildiz(yx + p[0] * k, yy + p[1] * k));   // Yedi Han
    yildiz(yx + 31 * k, yy - 24 * k, true);   // Demir Kazık: Yedi Han'ın ağzındaki iki yıldızın gösterdiği yönde
  }
  /* Dalgalanan bayrak: direğe bağlı kenar sabit, dalga sağa doğru büyür; amblem(x, y, G) renk üçlüsü döndürür */
  function bayrakCiz(t, i, zemin, amblem){
    const G = t.H - 2;
    for(let x = 0; x < t.W; x++){
      const faz = x * 0.45 - i * 2.1, dy = Math.round(Math.sin(faz) * 1.2 * Math.min(1, x / 6)), l = Math.cos(faz) * Math.min(1, x / 4);
      for(let y = 0; y < G; y++){ const P = amblem(x + 0.5, y + 0.5, G) || zemin; px(t, x, y + 1 + dy, l > 0.45 ? P[0] : l < -0.45 ? P[2] : P[1]); }
    }
  }
  const BEYAZ = ['#ffffff', '#f4eee4', '#d8d0c4'], ALTIN = ['#fff0a0', '#f0c040', '#c8962c'];
  /* Ay yıldız, bayrak kanunundaki oranlarla: dış ay 0,5G merkez 0,25G yarıçap; iç ay 0,0625G sağda 0,2G; yıldız 0,82G'de, bir ucu aya bakar */
  function ayYildiz(x, y, G){
    const cy = G / 2, x0 = G * 0.5;
    if(Math.hypot(x - x0, y - cy) <= G * 0.25 + 0.25 && Math.hypot(x - x0 - G * 0.0625, y - cy) > G * 0.2 + 0.1) return BEYAZ;
    const dx = x - G * 0.82, dy = y - cy, rr = Math.hypot(dx, dy), R0 = G * 0.125 + 0.3, dil = Math.PI * 0.4;
    if(rr > R0) return null;
    const a = ((Math.atan2(dy, dx) - Math.PI) % dil + dil) % dil, u = Math.min(a, dil - a) / (dil / 2);
    return rr <= R0 * (1 - u) + R0 * 0.45 * u ? BEYAZ : null;
  }
  /* Timur'un üç halka damgası: biri üstte ikisi altta */
  function ucHalka(x, y, G){ const r = G * 0.16; return [[0.5, 0.3], [0.32, 0.68], [0.68, 0.68]].some(q => Math.abs(Math.hypot(x - G * q[0] * 1.2, y - G * q[1]) - r) < 0.7) ? ALTIN : null; }
  /* Göktürk altın kurt başı (tuğ tepesi, sağa bakar) */
  const KURT = ['..K.K.....', '.KyKGK....', '.KyGGGK...', 'KyGGKGGGK.', 'KGGGGGGGGK', '.KoGGKKKK.', '..KoGGGK..', '...KooK...'];
  /* Kocatepe siluetleri */
  const BASKOMUTAN = ['...XXXXX...', '...XXXXX...', '...XXXXX...', '..XXXXXXX..', '....XXXXXXX', '....XXXXXXX', '....XXXX...', '...XXXXXXX.', '..XXXXXXXX.', '..XXXXXXX..', '..XXXXXX...', '..XXXXXX...', '..XXXXXX...', '..XXXXXX...', '..XXXXXXX..', '.XXXXXXXX..', '.XXXXXXXXX.', 'XXXXXXXXXX.', '...XX.XX...', '...XX.XX...', '...XX.XX...', '...XX.XX...', '...XX..XX..', '..XXX..XXX.'];
  const SUBAY1 = ['..XXXX...', '..XXXX...', '..XXXX...', '.XXXXXX..', '..XXXX...', '..XXXXX..', '...XXX...', '.XXXXXXX.', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXX.', '.XXXXXXX.', '.XXXXXXX.', '.XXXXXXX.', '.XXXXXXX.', '.XXXXXXXX', 'XXXXXXXXX', '..XX.XX..', '..XX.XX..', '..XX.XX..', '..XX.XX..', '..XX.XX..', '.XXX.XXX.'];
  const SUBAY2 = ['...XXXX....', '...XXXX....', '..XXXXXX...', '...XXXX....', '...XXXX....', '....XX.....', '..XXXXXXXXX', '.XXXXXX....', '.XXXXXX....', 'XXXXXXX....', 'XXXXXX.....', '.XXXXX.....', '.XXXXX.....', '.XXXXXX....', 'XXXXXXX....', '.XX.XX.....', '.XX.XX.....', '.XX.XX.....', '.XX.XX.....', '.XX.XX.....', 'XXX.XXX....'];
  const DIZ = ['..XX..', '.XXX..', '..XX..', '.XXXX.', 'XXXXXX', '.XXXX.', '.XXXXX', 'XX..XX'];
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
    /* Yayla (2026-11-06, ormanın yerine; kullanıcı: «bambaşka bir şey yap»): karlı doruklar, vadide sis, çay teraslı yamaç,
       ahşap yayla evi, çam kümeleri; önde çit, patika ve çiçekli çayır. */
    yayla:{
      yer(o){
        const { W, H, gece, dar, sakin:s } = o, ufuk = o.ufuk = Math.round(H * 0.42), cayir = o.cayir = Math.round(H * 0.76), yer = f => Math.round(W * f);
        gokSakin(s, o, ufuk);
        if(gece){ for(let i = 0; i < (dar ? 5 : 12); i++){ const x = yer(0.05 + i * 0.08), y = cayir - 4 + (i * 7) % 22; s.push(rutin(x, y, [['bocek', 4 + i % 3, x + 8, false, y - 5], ['bocek', 3 + i % 2, x, true, y]])); } }
        else {
          if(!dar) s.push(rutin(yer(0.74), cayir + 16, [['inek', 20]]));
          [['kelebek', 0.3, 0.05], ['kelebek2', 0.56, 0.09], ['kelebek', 0.84, 0.06]].forEach(q => { const x = yer(q[1]), y = cayir + H * q[2]; s.push(rutin(x, y, [[q[0], 4, x + 14, false, y - 5], [q[0], 3, x + 8, true, y + 2], [q[0], 4, x, true, y]])); });
        }
      },
      ciz(b, o){
        const { W, H, ufuk, cayir, dar } = o, yer = f => Math.round(W * f), r = tohum(77);
        gokCiz(b, o, Math.round(H * 0.7)); yildizCiz(b, o, ufuk * 0.8);   // gök tepelerin arkasına kadar iner: arada boş piksel kalmaz gunesCiz(b, o); gokBulutlari(b, o, ufuk * 0.8, Math.round(W / 70));
        dagCiz(b, { taban:ufuk + 10, amp:H * 0.27, s:17, pal:['#c4d0ea', '#aebcdc', '#98a8cc', '#8494bc'], kar:KAR, karEn:0.5, pus:'#d8e4f2', frek:0.0055 });
        /* Vadi sisi: tepelerin arasında aşağıdan yukarı titreşimle incelir */
        const sis = (y0, h) => { for(let j = 0; j < h; j++) for(let x = 0; x < W; x++) if(bay(x, y0 + j) < 0.8 * (1 - j / h)) ortu(b, x, y0 + h - j, '!#f2f6fa', 0.5); };
        tepeCiz(b, { taban:ufuk + 18, amp:8, s:21, pal:['#a8cca4', '#94bc94', '#84ae86', '#76a07a'], frek:0.011 });
        ormanSirasi(b, ufuk + 22, W, 5, ['#6a9a80', '#5a8a72', '#4a7a64'], 4, 8, 3);
        sis(ufuk + 14, 14);
        const orta = tepeCiz(b, { taban:Math.round(H * 0.58), amp:24, s:22, pal:['#a4d080', '#8cc06c', '#7ab05e', '#6aa052'], frek:0.0095 });
        /* Çay terasları: yamacın çizgisini izleyen koyu yeşil sıralar; tepesi ışık alır, altı gölge, aralarında toprak yol */
        for(let x = 0; x < W; x++) for(let k = 0; k < 12; k++){
          const y = orta[x] + 6 + k * 5 + Math.round(Math.sin(x * 0.018 + k * 0.7) * 1.4);
          if(y + 4 >= cayir - 8) break;   // çitin önünde çimen payı
          const ust = g1(x * 0.35, k + 3) > 0.45;
          px(b, x, y, ust ? '#7cbc5a' : '#5a9a44'); px(b, x, y + 1, '#4a8a3c'); px(b, x, y + 2, '#3c7a34'); px(b, x, y + 3, '#2f6a2e'); px(b, x, y + 4, (x + k) % 9 ? '#b8a272' : '#a08a5e');
        }
        /* Yamaçta çam kümeleri */
        [[0.04, 5], [0.09, 4], [0.14, 6], [0.9, 5], [0.95, 4], [0.36, 3], [0.4, 4]].forEach((q, i) => { const x = yer(q[0]); for(let n = 0; n < q[1]; n++){ const cx = x + n * 4 - q[1] * 2; cam(b, cx, orta[Math.max(0, Math.min(W - 1, cx))] + 3 + (n % 2) * 2, 12 + ((n + i) % 3) * 4, ['#4f8a5c', '#3c7650', '#2a6040']); } });
        /* Yayla evi: taş temel, ahşap gövde, dik çatı, baca, iki ışıklı pencere */
        const hx = yer(dar ? 0.5 : 0.66), hy = orta[Math.min(W - 1, hx + 10)] + 4;
        R(b, hx, hy - 4, 26, 4, '#8e8a84'); for(let i = 0; i < 26; i += 5) R(b, hx + i, hy - 4, 1, 4, '#6e6a66'); R(b, hx, hy - 4, 26, 1, '#aaa6a0');
        R(b, hx + 1, hy - 18, 24, 14, '#9a6a44'); for(let y = hy - 17; y < hy - 4; y += 3) R(b, hx + 1, y, 24, 1, '#7d5236'); R(b, hx + 22, hy - 18, 3, 14, '#7d5236');
        [[4, '#ffe6a0'], [15, '#ffe6a0']].forEach(q => { R(b, hx + q[0] - 1, hy - 15, 7, 7, '#5a3a28'); R(b, hx + q[0], hy - 14, 5, 5, o.gece ? '!#ffd890' : '#cfe6f2'); R(b, hx + q[0] + 2, hy - 14, 1, 5, '#5a3a28'); });
        for(let i = 0; i < 10; i++){ R(b, hx - 3 + i, hy - 19 - i, 32 - i * 2, 1, i % 2 ? '#a8443a' : '#923a32'); px(b, hx - 3 + i, hy - 19 - i, '#6a2a26'); px(b, hx + 28 - i, hy - 19 - i, '#6a2a26'); }
        R(b, hx + 18, hy - 32, 4, 8, '#8e8a84'); R(b, hx + 17, hy - 33, 6, 1, '#6e6a66');
        if(o.gece) for(let i = 0; i < 18; i++) for(let j = -i * 0.4; j <= i * 0.4; j++) if(bay(hx + 8 + j | 0, hy - 4 + i) > 0.6) ortu(b, hx + 8 + j, hy - 4 + i, '!#ffd890', 0.18);
        cayirCiz(b, cayir, 44, ['#88c464', '#70b052', '#5c9a46', '#3f7c38'], ['#fbf6ea', '#ffe27a', '#e890b0', '#b89ae0']);
        /* Patika: önden eve doğru kıvrılarak daralır */
        for(let y = cayir - 2; y < H; y++){ const d = (y - cayir + 2) / (H - cayir + 2), w = 2 + d * d * W * 0.09, x = W * 0.42 + Math.sin(d * 3.2 + 0.6) * W * 0.06; for(let q = -w; q < w; q++){ const n = g2((x + q) * 0.07, y * 0.15, 5); px(b, x + q, y, Math.abs(q) > w - 1.2 ? '#a08a5e' : n > 0.6 ? '#d8c49a' : n > 0.35 ? '#c8b48a' : '#b8a27a'); } }
        /* Çit: iki direk arası iki kalas, solda ve sağda */
        [[0, 0.32], [0.54, 1]].forEach(q => { const y = cayir + 6; R(b, yer(q[0]), y - 6, yer(q[1]) - yer(q[0]), 1, '#8a6a48'); R(b, yer(q[0]), y - 3, yer(q[1]) - yer(q[0]), 1, '#8a6a48'); R(b, yer(q[0]), y - 5, yer(q[1]) - yer(q[0]), 1, '#6d4f34'); for(let x = yer(q[0]) + 2; x < yer(q[1]); x += 12){ R(b, x, y - 9, 2, 10, '#7d5a3e'); R(b, x, y - 9, 1, 10, '#9a7454'); } });
        const t = tohum(9); for(let i = 0; i < 6; i++) kaya(b, W * (0.08 + t() * 0.84), cayir + 10 + t() * (H - cayir - 14), 2 + Math.round(t() * 3), ['#c0c6a8', '#94a080', '#6e7a5c', '#4f5844']);
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
          else {
            /* Tortul tabakalar: bant üstü ışık alır, altı gölgede; düşüşe yakın kaya ıslak ve koyu; ara ara dikey çatlak */
            const yy = y + (g1(x * 0.04, 9) - 0.5) * 10 + (g1(x * 0.011, 4) - 0.5) * 14, kal = 7 + Math.floor(g1(Math.floor(yy / 8) * 0.9, 6) * 6), bant = Math.floor(yy / kal), ic = yy - bant * kal, islak = Math.abs(x - cx) - duvarSu(y) < 8;
            let t = (bant % 3 === 2 ? 2 : 1) + (islak ? 1 : 0) + (g2(x * 0.018, y * 0.026, 11) > 0.58 ? 1 : 0) - (g2(x * 0.02, y * 0.02, 14) > 0.7 ? 1 : 0);
            if(ic < 1.2) t = Math.max(0, t - 1); else if(ic > kal - 1.6) t += 1;
            if(ic > 1.2 && g1(x * 0.8 + bant * 13, 5) > 0.92) t = 4;
            px(b, x, y, KT[Math.min(4, t)]);
          }
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

    /* BOZKIR (örnek tema): Ötüken'de kağan otağı. Ufukta Ötüken yışının karlı dağları ve ormanı, Orhun ırmağı;
       otağ önünde altın kurt başlı tuğ ve kazan; solda kaplumbağa kaideli yazıt, taş baba ve doğuya uzanan balbal
       sırası; atlılar dörtnala geçer, at sürüsü otlar, bürküt süzülür. Gece Kuş Yolu, Yedi Han ve Demir Kazık. */
    bozkir:{
      yer(o){
        const { W, H, gece, dar, sakin:s } = o, yer = f => Math.round(W * f), ufuk = o.ufuk = Math.round(H * 0.5), z = o.zemin = Math.round(H * 0.8);
        const ox = o.otag = yer(dar ? 0.55 : 0.6), w = o.otagW = Math.round(Math.min(W * 0.08, 34)), tx = o.tug = ox - w - 11, kz = o.kazan = [ox + w + 10, z + 8];
        const wh = Math.round(w * 0.62), dh = Math.round(w * 0.55);
        gokSakin(s, o, ufuk);
        s.push(rutin(tx - 1, z - 55 + 9, [['puskul', 30]]));
        s.push(rutin(ox - 2, z - wh - dh - 2, [['duman', 10]]), rutin(kz[0] - 2, kz[1] - 9, [['duman', 9]]));
        if(gece){
          s.push(rutin(kz[0] - 1, kz[1] + 1, [['ates', 30]]));
          for(let i = 0; i < (dar ? 4 : 9); i++){ const x = yer(0.08 + i * 0.1), y = Math.round(H * 0.7) + (i * 7) % 24; s.push(rutin(x, y, [['bocek', 4 + i % 3, x + 8, false, y - 5], ['bocek', 3 + i % 2, x, true, y]])); }
        } else {
          const sure = (W + 80) / 42;
          [['atli', 0, 0], ['atli2', 1, -6], ['atli3', 2, 2]].forEach(q => s.push(rutin(-40 - q[1] * 26, H - 2 + q[2], [['gizli', q[1] * 0.35], [q[0], sure, W + 40 - q[1] * 26, false], ['gizli', 22 - q[1] * 0.35]])));
          [[0.78, 2, 'at', false], [0.87, -4, 'atak', true], [0.94, 4, 'atkara', false], [0.83, 17, 'at', false], [0.96, 19, 'atak', true]].forEach((q, i) => { const x = yer(q[0]), y = z + q[1]; s.push(i === 3 ? rutin(x, y, [['at', 10, undefined, false], ['atyuru', 0, x - 14], ['at', 14, undefined, true], ['atyuru', 0, x]]) : rutin(x, y, [[q[2], 1000, undefined, q[3]]])); });
          s.push(rutin(-16, Math.round(H * 0.22), [['burkut', 26, W + 16, false], ['gizli', 30]]));
        }
      },
      ciz(b, o){
        const { W, H, ufuk, gece, dar, P } = o, z = o.zemin, yer = f => Math.round(W * f);
        turkGogu(b, o, ufuk);
        dagCiz(b, { taban:ufuk - 2, amp:H * 0.2, s:41, pal:['#b8c4e0', '#9eaed6', '#8698c6', '#7286b6'], kar:KAR, karEn:0.5, pus:'#d4dff0', frek:0.0048 });
        dagCiz(b, { taban:ufuk + 4, amp:H * 0.07, s:44, pal:['#7ea2a4', '#6a9096', '#5a8088', '#4c707c'], pus:'#bcd2dc', frek:0.009 });
        ormanSirasi(b, ufuk + 5, W, 45, ['#5e8c84', '#4e7c76', '#406c68'], 3, 7, 3);
        tepeCiz(b, { taban:ufuk + 8, amp:2, s:42, pal:['#d8d6a0', '#c8c88e', '#b8ba7e', '#a8ae70'], frek:0.012, bit:Math.round(H * 0.62) });
        /* Orhun: ovada kıvrılan ince ırmak, göğün rengini yansıtır */
        const su = P.gok;
        for(let x = 0; x < W; x++){ const yc = H * 0.58 + Math.sin(x * 0.016) * 6 + Math.sin(x * 0.0055 + 1) * 6, g = 0.6 + x / W * 1.6; for(let q = -g; q <= g; q += 0.5){ const y = Math.round(yc + q * 0.6); px(b, x, y, q < -g + 0.8 ? su[7] : bay(x, y) < 0.3 ? su[7] : su[5]); } px(b, x, Math.round(yc + g * 0.6 + 1), '#8a9a5c'); }
        cayirCiz(b, Math.round(H * 0.62), 52, ['#c8c47c', '#b2b26a', '#9ca05a', '#7e8c4a'], ['#f6ecb8']);
        /* Yurt: keçe duvarda kerege izi, kızıl kuşakta koçboynuzu, kubbede uuk çubukları, tepede tünlük */
        const yurt = (cx, F, w, buyuk) => {
          const wh = Math.round(w * 0.62), dh = Math.round(w * 0.55), ust = F - wh;
          for(let x = -w + 1; x <= w + Math.round(w * 0.5); x++){ ortu(b, cx + x, F, '#3a4a20', 0.35); ortu(b, cx + x, F + 1, '#3a4a20', 0.18); }
          for(let x = -w; x <= w; x++){ const t = (x + w) / (2 * w); for(let y = ust; y < F; y++){ let c = t < 0.1 ? '#fbf5e6' : t < 0.62 ? '#efe4cc' : t < 0.86 ? '#ddd0b4' : '#c8b898'; if(buyuk && t > 0.1 && ((x + y) % 6 === 0 || (x - y) % 6 === 0)) c = t < 0.62 ? '#e4d6ba' : '#cbbc9e'; px(b, cx + x, y, c); } }
          const by = ust + Math.round(wh * 0.28);
          for(let x = -w; x <= w; x++){ const t = (x + w) / (2 * w); R(b, cx + x, by, 1, buyuk ? 3 : 1, t > 0.62 ? '#983428' : '#b8443a'); const m = (x + w) % 6; if(buyuk){ if(m === 1 || m === 4) px(b, cx + x, by + 1, '#e8c860'); if(m === 2 || m === 3) px(b, cx + x, by, '#e8c860'); } }
          R(b, cx - w, ust + Math.round(wh * 0.74), w * 2 + 1, 1, '#9a7a5c'); R(b, cx - w, F - 1, w * 2 + 1, 1, '#9a8a70');
          for(let j = 1; j <= dh; j++){
            const k = j / dh, hw = Math.max(2, Math.round(w * (1.04 - Math.pow(k, 1.6) * 0.84)));
            for(let x = -hw; x <= hw; x++){ const t = (x + hw) / (2 * hw), u = x / hw * (buyuk ? 7 : 5); px(b, cx + x, ust - j, Math.abs(u - Math.round(u)) < 0.12 ? (t < 0.6 ? '#cdbb96' : '#b4a27e') : t < 0.18 ? '#f8efd9' : t < 0.6 ? '#e6d8ba' : t < 0.85 ? '#d2c29f' : '#bba985'); }
          }
          R(b, cx - w - 1, ust, w * 2 + 3, 1, '#8a5a48');
          const tw = Math.max(1, Math.round(w * 0.16)); R(b, cx - tw, ust - dh - 1, tw * 2 + 1, 2, '#7a4c3a'); px(b, cx, ust - dh - 1, '#a87050');
          const dw = Math.max(1, Math.round(w * 0.15)), dy = Math.round(wh * 0.78);
          R(b, cx - dw - 1, F - dy - 1, dw * 2 + 3, dy + 1, '#6d3226'); R(b, cx - dw, F - dy, dw * 2 + 1, dy, gece ? '!#ffcf80' : '#c0483a');
          if(buyuk && !gece){ R(b, cx - dw, F - dy, 1, dy, '#a83c30'); [[-2, 1], [2, 1], [-1, 2], [1, 2], [0, 3]].forEach(q => px(b, cx + q[0], F - dy + q[1], '#f0c860')); R(b, cx - dw, F - Math.round(dy * 0.4), dw * 2 + 1, 1, '#a83c30'); }
          if(gece){ const L = buyuk ? 18 : 6; for(let i = 0; i < L; i++) for(let q = -i * 0.5 - dw; q <= i * 0.5 + dw; q++) ortu(b, cx + q, F + i, '!#ffd890', 0.3 * (1 - i / L) * (1 - Math.abs(q) / (i * 0.5 + dw + 1))); }
        };
        /* Uzak oba */
        [[0.79, 7], [0.87, 8], [0.93, 6]].forEach(q => yurt(yer(q[0]), Math.round(H * 0.665), q[1], false));
        /* Balbal sırası doğuya, kurgana doğru uzanır */
        const sx = yer(dar ? 0.1 : 0.14), sy = Math.round(H * 0.88), n = dar ? 10 : 16, bx1 = sx + 20, bx2 = yer(0.44), by1 = sy + 3, by2 = Math.round(H * 0.645);
        const kx = bx2 + 16, ky = by2 + 1;
        for(let i = -14; i <= 14; i++){ const h = Math.round(5 * (1 - (i / 14) ** 2)); R(b, kx + i, ky - h, 1, h, i < 3 ? '#b8b47c' : '#a4a06c'); px(b, kx + i, ky - h, '#d4d09a'); }
        for(let k = n - 1; k >= 0; k--){ const t = k / (n - 1), x = Math.round(bx1 + (bx2 - bx1) * Math.pow(t, 0.75)), y = Math.round(by1 + (by2 - by1) * Math.pow(t, 0.6)), h = Math.round(7 - t * 5), c = t < 0.5 ? '#8e8a80' : '#a4a294'; R(b, x, y - h, h > 4 ? 2 : 1, h, c); if(h > 4){ px(b, x, y - h - 2, c); px(b, x + 1, y - h - 2, c); } px(b, x, y - h, '#c4c0b4'); R(b, x + 1, y, 3, 1, '#6e7a40'); }
        /* Kül Tigin yazıtı: kaplumbağa kaide, sütun sütun oyulmuş yazı, kemerli tepelikte dağ keçisi damgası */
        for(let j = 0; j < 7; j++){ const hw = Math.round(13 * Math.sqrt(1 - (j / 7) ** 2)); R(b, sx - hw, sy - 1 - j, hw * 2 + 1, 1, j < 2 ? '#7e786c' : '#9a9486'); px(b, sx - hw, sy - 1 - j, '#b8b2a4'); }
        for(let i = -10; i <= 10; i += 4) for(let j = 2; j < 6; j += 3) px(b, sx + i + (j % 2), sy - j, '#7e786c');
        R(b, sx + 13, sy - 4, 4, 3, '#8e887a'); px(b, sx + 16, sy - 4, '#2a2228'); R(b, sx - 15, sy - 2, 3, 2, '#7e786c'); R(b, sx - 16, sy, 34, 1, '#5e6a38');
        const gx = sx - 6, gy = sy - 50, gw = 13, gh = 44;
        R(b, gx, gy, gw, gh, '#bcb6a8'); R(b, gx, gy, 1, gh, '#ddd8ca'); R(b, gx + gw - 2, gy, 2, gh, '#9a9384');
        for(let c = 0; c < 4; c++) for(let y = gy + 4; y < gy + gh - 3; y += 3){ const g = hash(y * 5 + c * 31, 23), x = gx + 2 + Math.floor(c * 2.5); px(b, x, y, '#6e685e'); px(b, x, y + 1, '#6e685e'); if(g > 0.45) px(b, x + 1, y + (g > 0.7 ? 0 : 1), '#6e685e'); }
        for(let j = 0; j < 9; j++){ const hw = Math.round(8 * Math.sqrt(1 - (j / 9) ** 2)); R(b, sx - hw, gy - 1 - j, hw * 2 + 1, 1, '#b0aa9c'); px(b, sx - hw, gy - 1 - j, '#d8d2c4'); }
        R(b, sx - 8, gy - 1, 17, 1, '#8a8478');
        [[0, -3], [0, -4], [0, -5], [-1, -6], [1, -6], [-2, -7], [2, -7], [-2, -8], [2, -8]].forEach(q => px(b, sx + q[0], gy + q[1], '#6a6458'));
        [[-5, -3], [-6, -4], [-4, -4], [5, -3], [6, -4], [4, -4]].forEach(q => px(b, sx + q[0], gy + q[1], '#8a8476'));
        /* Taş baba: elinde kap tutan taş heykel */
        damga(b, sx - 25, sy + 2, ['.XXX.', 'XXXXX', 'XYXYX', '.XXX.', 'XXXXX', 'XXXXX', 'XXYYX', 'XXXXX', 'XXXXX', '.XXX.'], { X:'#a8a294', Y:'#7a7468' }, '#d0cabc');
        /* Otağ ve tuğ */
        yurt(o.otag, z, o.otagW, true);
        const tx = o.tug;
        for(let x = 0; x < 10; x++) ortu(b, tx + x, z + 1, '#3a4a20', 0.3);
        R(b, tx, z - 56, 1, 58, '#6a4630'); R(b, tx + 1, z - 56, 1, 58, '#4e3424'); R(b, tx - 1, z + 1, 4, 1, '#3a2a24');
        damga(b, tx - 4, z - 55, KURT, { K:'#5a3a1c', G:'#f0c040', o:'#c8962c', y:'#fff0a8' });
        /* Kazan ve sacayak */
        const [kzx, kzy] = o.kazan;
        for(let i = 0; i < 9; i++){ px(b, kzx - 4 + i * 0.45, kzy - i, '#3a2a24'); px(b, kzx + 4 - i * 0.45, kzy - i, '#3a2a24'); }
        R(b, kzx - 3, kzy - 7, 7, 4, '#5a4a3c'); R(b, kzx - 4, kzy - 8, 9, 1, '#8a7458'); R(b, kzx - 3, kzy - 7, 2, 3, '#7a6650'); R(b, kzx - 2, kzy - 3, 5, 1, '#4a3c30'); R(b, kzx - 3, kzy, 7, 1, '#5a3a28');
        if(gece) for(let j = -18; j <= 18; j++) for(let i = -28; i <= 28; i++){ const d = Math.sqrt(i * i + j * j * 2.2) / 28; if(d < 1) ortu(b, kzx + i, kzy - 3 + j, '!#ffb860', 0.42 * (1 - d) * (1 - d)); }
        onOt(b, ['#a8a85e', '#8a9050'], 13, 0.5);
      },
    },
    /* KOCATEPE (örnek tema): 26 Ağustos 1922 şafağı. Vadilerde sis, güneş arkadan doğar. Tepede dürbünle bakan
       başkomutan, yanında iki paşa ve dalgalanan al bayrak; teraslı mevzide toplar ateş açar, uzak sırtlarda
       mermiler patlar; yolda kağnı ve cephane taşıyan kadın (İstiklal Yolu), uzakta piyade ilerler. */
    kocatepe:{
      yer(o){
        const { W, H, gece, dar, sakin:s } = o, yer = f => Math.round(W * f), ufuk = o.ufuk = Math.round(H * 0.58);
        gokSakin(s, o, ufuk);
        const t = o.tepe = new Int32Array(W), zx = yer(dar ? 0.4 : 0.28), zy = Math.round(H * 0.46);
        for(let x = 0; x < W; x++){
          const d = (x - zx) / W, dd = d < 0.07 ? d : d < 0.17 ? 0.07 : d - 0.1, u = Math.max(0, dd - 0.035), duz = d > 0.07 && d < 0.17 ? 0.25 : 1;
          const y = d < 0 ? zy + Math.max(0, -d - 0.035) ** 1.6 * H * 1.5 : zy + u * H * 0.9 + u * u * H * 2.2;
          t[x] = Math.round(y + ((g1(x * 0.11, 61) - 0.5) * 2 + (g1(x * 0.035, 62) - 0.5) * 3 * Math.min(1, Math.abs(d) * 12)) * duz);
        }
        o.zirve = [zx, zy]; o.teras = [zx + yer(0.075), zx + yer(0.165)];
        const fx = o.direk = zx + 20;
        s.push(rutin(fx + 1, t[fx] - 48 + 15, [['albayrak', 30]]));
        const ta = o.teras[0];
        [[ta + 9, 0], [ta + 27, 2.2]].forEach(q => { const cx = q[0], hy = t[cx] - 3; s.push(rutin(cx + 10, hy - 3, [['gizli', 1 + q[1]], ['parlama', 0.3], ['tutun', 2.4, cx + 20, false, hy - 14], ['gizli', 3.3 - q[1]]])); });
        [[0.7, 0.64, 0, 7], [0.82, 0.65, 2.6, 7], [0.93, 0.63, 4.9, 7], [0.64, 0, 6.1, 9], [0.76, 0, 1.4, 9]].forEach(q => { const x = yer(q[0]), y = q[1] ? Math.round(H * q[1]) : ufuk - 3; s.push(rutin(x, y, [['gizli', q[2]], ['patla', 0.75], ['gizli', q[3] - q[2] - 0.75]])); });
        for(let k = 0; k < 6; k++){ const x = yer(0.74) + k * 7; s.push(rutin(x, Math.round(H * 0.68), [['piyade', 40, x + 50, false], ['gizli', 6]])); }
        /* Vadi yolu: kağnı sisli ovadan tepeye doğru gelir, tepenin ardında kaybolur */
        const ky = o.yolY = Math.round(H * 0.93);
        let bit = W - 1; while(bit > 0 && t[bit - 1] > ky + 1) bit--;
        o.yolBit = bit;
        const bas = W + 30, sure = (bas - bit - 8) / 5;
        s.push(rutin(bas, ky + 1, [['kagni', sure, bit + 8, true], ['gizli', 14]]));
        s.push(rutin(bas - 9, ky + 1, [['kadin', sure, bit - 1, true], ['gizli', 14]]));
        if(gece) for(let i = 0; i < 5; i++) s.push(rutin(zx + 30 + i * 18, t[zx + 30 + i * 18] + 8, [['bocek', 3 + i % 3]]));
      },
      ciz(b, o){
        const { W, H, ufuk, gece } = o, t = o.tepe, zx = o.zirve[0], sicak = gece ? '!#8880b8' : '!#ffd8c0', isik = gece ? '#6a6498' : '#f0a070', KOYU = '#1f1420';
        dagCiz(b, { taban:ufuk, amp:H * 0.08, s:71, pal:['#c4a4bc', '#b094ae', '#9e84a2', '#8e7496'], pus:'#f0c8bc', frek:0.008 });
        sisKat(b, ufuk - 8, 14, sicak, 0.5);
        tepeCiz(b, { taban:Math.round(H * 0.66), amp:5, s:72, pal:['#a88aa0', '#94788e', '#84687e', '#765c72'], frek:0.013 });
        sisKat(b, Math.round(H * 0.6), 16, sicak, 0.55);
        tepeCiz(b, { taban:Math.round(H * 0.78), amp:6, s:73, pal:['#866a7e', '#745a6e', '#664e62', '#5a4458'], frek:0.016 });
        sisKat(b, Math.round(H * 0.72), 18, sicak, 0.6);
        R(b, o.yolBit - 4, o.yolY, W, 2, '#8a6a7c'); R(b, o.yolBit - 4, o.yolY, W, 1, '#a88496');
        sisKat(b, Math.round(H * 0.84), 22, sicak, 0.45);
        /* Kocatepe: koyu kaya kütlesi, sırtta şafak kenar ışığı */
        for(let x = 0; x < W; x++) for(let y = Math.max(0, t[x]); y < H; y++){
          const d = y - t[x], n = g2(x * 0.07, y * 0.11, 64) + (bay(x, y) - 0.5) * 0.18 - d / H * 0.5;
          px(b, x, y, d < 1 ? '#f0a07a' : d < 2 ? '#9a5e66' : d < 4 && n > 0.5 ? '#6a4454' : n > 0.6 ? '#4a3143' : n > 0.36 ? '#42293c' : '#3a2436');
        }
        sisKat(b, Math.round(H * 0.86), Math.round(H * 0.14), sicak, 0.3);
        /* Sırtta kuru ot ve kaya: göğe karşı siluet */
        for(let x = 0; x < W; x++) if(hash(x, 67) > 0.74 && Math.abs(x - zx) > 22){ const h = 1 + Math.floor(hash(x, 68) * 3); R(b, x, t[x] - h, 1, h, '#3a2638'); px(b, x, t[x] - h, '#c87866'); }
        const r = tohum(66);
        for(let i = 0; i < 12; i++){ const x = Math.floor(r() * W), rr = 2 + Math.floor(r() * 3); if(Math.abs(x - zx) < 34) continue; daire(b, x, t[x] + 1, rr, '#2e1e2e'); R(b, x - rr + 1, t[x] + 1 - rr, rr, 1, '#a8606a'); px(b, x - rr + 1, t[x] + 2 - rr, '#c87866'); }
        /* Topçu mevzii: terasta iki sahra topu, nişancılar, kum torbaları */
        const [ta, tb] = o.teras;
        const top = (hx, F) => {
          const hy = F - 4;
          for(let i = 0; i < 12; i++){ const x = hx + i * 0.92, y = hy - 1 - i * 0.42; R(b, x, y, 1, 2, KOYU); px(b, x, y, '#d07a68'); }
          for(let i = 0; i < 11; i++){ px(b, hx - i, hy + i * 0.36, KOYU); px(b, hx - i, hy + 1 + i * 0.36, KOYU); }
          R(b, hx - 1, hy - 6, 2, 6, KOYU); px(b, hx - 1, hy - 6, '#d07a68');
          for(let a = 0; a < 24; a++){ const q = a / 24 * 6.283; px(b, hx + Math.round(Math.cos(q) * 3.6), hy + Math.round(Math.sin(q) * 3.6), KOYU); }
          for(let a = 0; a < 4; a++){ const q = a / 4 * 3.1416 + 0.4; for(let rr = -3; rr <= 3; rr++) px(b, hx + Math.round(Math.cos(q) * rr), hy + Math.round(Math.sin(q) * rr), KOYU); }
        };
        [ta + 9, ta + 27].forEach(cx => { top(cx, t[cx] + 1); damga(b, cx - 12, t[cx - 9] + 1, DIZ, { X:KOYU }, isik); R(b, cx - 18, t[cx - 16] - 2, 4, 3, KOYU); px(b, cx - 18, t[cx - 16] - 2, isik); });
        for(let x = tb - 8; x < tb + 2; x++){ const y = t[Math.min(W - 1, x)], h = x % 3 === 0 ? 4 : 3; R(b, x, y - h, 1, h, KOYU); px(b, x, y - h, '#c87866'); }
        /* Komuta yeri: başkomutan dürbünle bakar, solda ve sağda iki paşa; bayrak direği */
        damga(b, zx - 18, t[zx - 14] + 1, SUBAY1, { X:KOYU }, isik);
        damga(b, zx - 5, t[zx] + 1, BASKOMUTAN, { X:KOYU }, isik);
        damga(b, zx + 7, t[zx + 11] + 1, SUBAY2, { X:KOYU }, isik);
        const fx = o.direk; R(b, fx, t[fx] - 48, 1, 49, KOYU); R(b, fx - 1, t[fx] - 50, 3, 2, '#e8c860');
      },
    },
    /* SEMERKANT (örnek tema): Timur'un başkenti, gün batımı. Uzakta Zerefşan dağları ve Bibi Hanım'ın taç kapısı
       ile kubbesi; önde Gur-i Emir: sekizgen gövde, kufi yazılı kasnak, dilimli firuze kubbe, iki minare ve taç
       kapı; kavaklar, bahçeler, ark; yolda deve kervanı; Timur'un üç halka damgalı sancağı. */
    semerkant:{
      yer(o){
        const { W, H, gece, dar, sakin:s } = o, yer = f => Math.round(W * f), ufuk = o.ufuk = Math.round(H * 0.6), z = o.zemin = Math.round(H * 0.8);
        gokSakin(s, o, ufuk);
        const gx = o.gur = yer(dar ? 0.55 : 0.6), sx = o.sancak = yer(dar ? 0.1 : 0.15), yol = Math.round(H * 0.955);
        s.push(rutin(sx + 1, Math.round(H * 0.9) - 52 + 15, [['halka', 30]]));
        const sure = (W + 140) / 6;
        [['yolcu', 0], ['deve2', 8], ['deve2', 24], ['deve2', 40], ['deve2', 56]].forEach(q => s.push(rutin(W + 10 + q[1], yol, [[q[0], sure, -80 + q[1], true], ['gizli', 14]])));
        if(!gece) [[0, 0], [-6, -3], [-11, 2]].forEach(q => s.push(rutin(gx - 40 + q[0], Math.round(H * 0.3) + q[1], [['kus', 7, gx + 40 + q[0], false], ['kus', 7, gx - 40 + q[0], true]])));
      },
      ciz(b, o){
        const { W, H, ufuk, gece, dar, P } = o, z = o.zemin, yer = f => Math.round(W * f), gx = o.gur;
        const kavak = (x, F, h, C) => { R(b, x, F - 3, 1, 3, '#5a4030'); for(let i = 0; i < h; i++){ const k = i / h, w = Math.max(1, Math.round(Math.sin(Math.PI * Math.pow(k, 1.3)) * h * 0.11)), y = F - 3 - h + i; for(let q = -w; q <= w; q++){ const t = (q + w) / (2 * w + 0.01), n = hash(x * 7 + q * 3 + y * 11, 9); px(b, x + q, y, t < 0.3 && n > 0.3 ? C[0] : t < 0.7 ? (n > 0.8 ? C[2] : C[1]) : (n > 0.7 ? C[1] : C[2])); } } };
        const nis = (cx, top, hw, h, C, I) => { for(let j = 0; j < h; j++){ const w = Math.round((hw + 1) * Math.min(1, Math.sqrt(j / ((hw + 1) * 1.5)))); R(b, cx - w, top + j, w * 2 + 1, 1, C); if(j > 1){ const wi = Math.round(hw * Math.min(1, Math.sqrt((j - 2) / (hw * 1.5)))); R(b, cx - wi, top + j, wi * 2 + 1, 1, I); } } };
        const kubbe = (cx, taban, boyun, gen, yuk, C) => {
          for(let j = 0; j <= yuk; j++){
            const k = j / yuk, hw = k < 0.28 ? boyun + (gen - boyun) * Math.sin(k / 0.28 * Math.PI / 2) : gen * Math.sqrt(Math.max(0, 1 - ((k - 0.28) / 0.72) ** 2)), w = Math.round(hw);
            for(let x = -w; x <= w; x++){ const a = Math.asin(Math.max(-1, Math.min(1, x / (hw + 0.5)))), rib = (a / Math.PI + 0.5) * 18, f = rib - Math.floor(rib), gl = a / 1.57 - (k - 0.4) * 0.5; px(b, cx + x, taban - j, f < 0.16 ? C[0] : f < 0.55 ? (gl < -0.3 ? C[1] : gl < 0.35 ? C[2] : C[3]) : (gl < -0.3 ? C[4] : gl < 0.35 ? C[5] : C[6])); }
          }
          R(b, cx, taban - yuk - 6, 1, 6, '#e0b040'); daire(b, cx, taban - yuk - 3, 1, '#f0c850'); px(b, cx, taban - yuk - 7, '#fff0a0');
        };
        const FIRUZE = ['#16607e', '#a8eef2', '#5ccad8', '#2c98b4', '#6cd4e0', '#36acc4', '#1f7f9c'], FIRUZE_UZAK = ['#6aa8bc', '#d4f2f4', '#a8dce4', '#88c4d4', '#bce6ec', '#98d0dc', '#7ab8cc'];
        const evler = (taban, s, A, hmax, ag) => { const q = tohum(s); let x = -6; while(x < W){ const w = 7 + Math.floor(q() * 10), h = 4 + Math.floor(q() * hmax), y = taban - h; R(b, x, y, w, h, A[1]); R(b, x, y, 1, h, A[0]); R(b, x + w - 2, y, 2, h, A[2]); R(b, x - 1, y - 1, w + 1, 1, A[0]); if(q() < 0.7){ const k = x + 2 + Math.floor(q() * Math.max(1, w - 5)); R(b, k, y + 2, 1, 2, gece ? '!#ffd890' : A[3]); if(w > 10) R(b, k + 3, y + 2, 1, 2, gece && q() < 0.5 ? '!#ffd890' : A[3]); } if(q() < ag){ const kx = x + w + 1; if(q() < 0.5) agac(b, kx, taban, 3 + Math.floor(q() * 3), A[4], Math.floor(q() * 99)); else kavak(kx, taban, 14 + Math.floor(q() * 10), A[5]); } x += w - 1 + Math.floor(q() * 2); } };
        turkGogu(b, o, ufuk);
        dagCiz(b, { taban:ufuk - 4, amp:H * 0.12, s:51, pal:['#d4c4cc', '#c0b0c0', '#ac9cb4', '#9a8aa8'], kar:KAR, karEn:0.62, pus:'#ecdce0', frek:0.005 });
        tepeCiz(b, { taban:ufuk + 2, amp:2, s:52, pal:['#c8b890', '#b8a880', '#a89870', '#988860'], frek:0.01, bit:z + 1 });
        for(let i = 0; i < W / 9; i++){ const x = hash(i, 53) * W; kavak(Math.round(x), Math.round(H * 0.665), 8 + Math.floor(hash(i, 54) * 6), ['#a8b890', '#90a47c', '#7c906c']); }
        /* Bibi Hanım: uzak, sise karışan taç kapı, iri minareler ve kubbe */
        const bx = yer(dar ? 0.18 : 0.24), bF = Math.round(H * 0.69);
        R(b, bx - 14, bF - 16, 29, 16, '#dcc8a4'); R(b, bx + 10, bF - 16, 5, 16, '#c8b290');
        R(b, bx - 10, bF - 26, 21, 10, '#7aaed0'); R(b, bx - 10, bF - 26, 21, 2, '#e8dcc0'); for(let x = -10; x <= 10; x += 3) R(b, bx + x, bF - 23, 1, 6, '#5a8ab8');
        kubbe(bx, bF - 27, 10, 13, 18, FIRUZE_UZAK);
        const pX = bx + 27; R(b, pX - 11, bF - 40, 23, 40, '#dcc8a4'); R(b, pX - 9, bF - 38, 19, 2, '#7aaed0'); R(b, pX - 9, bF - 38, 2, 38, '#7aaed0'); R(b, pX + 8, bF - 38, 2, 38, '#7aaed0'); nis(pX, bF - 33, 6, 33, '#88b8d8', '#4a78a8');
        [pX - 13, pX + 13].forEach(mx => { R(b, mx - 1, bF - 50, 3, 50, '#d4bea0'); for(let y = bF - 48; y < bF; y += 6) R(b, mx - 1, y, 3, 1, '#7aaed0'); R(b, mx - 2, bF - 52, 5, 2, '#7aaed0'); });
        evler(Math.round(H * 0.7), 55, ['#ecdcc0', '#dccaa8', '#c8b490', '#8a7458', ['#c4d0a0', '#a8bc88', '#90a874', '#7a9462'], ['#a8b890', '#90a47c', '#7c906c']], 6, 0.35);
        evler(Math.round(H * 0.75), 56, ['#e8d0a8', '#d4b88c', '#b89a70', '#6a5440', ['#a4c47c', '#88b06a', '#6e9858', '#58804a'], ['#8aac6c', '#6e945a', '#567c4a']], 8, 0.4);
        /* Gur-i Emir: sekizgen gövde, sivri kemerli çini nişler */
        const bw = 30, bh = 26, gF = z;
        R(b, gx - bw, gF - bh, bw * 2 + 1, bh, '#d8b88a'); R(b, gx - bw, gF - bh, 2, bh, '#f0d4a8'); R(b, gx + bw - 6, gF - bh, 7, bh, '#bc9a6e'); R(b, gx - bw - 1, gF - bh - 1, bw * 2 + 3, 2, '#2a64a8');
        [-21, -7, 7, 21].forEach(dx => nis(gx + dx, gF - bh + 5, 4, bh - 6, dx > 14 ? '#24569a' : '#2f6db8', '#1a3e78'));
        /* Kasnak: kufi yazı kuşağı ve baklava çini */
        const dw = 17, dh = 26, dTop = gF - bh - 1 - dh;
        for(let x = -dw; x <= dw; x++){ const t = (x + dw) / (2 * dw); R(b, gx + x, dTop, 1, dh, t < 0.15 ? '#4a8ad0' : t < 0.65 ? '#2f6db8' : '#24569a'); }
        const ky = dTop + 3; R(b, gx - dw, ky, dw * 2 + 1, 6, '#f2ead8'); R(b, gx + dw - 5, ky, 6, 6, '#d8ccb4');
        for(let x = -dw + 1; x < dw; x++){ const g = hash(x, 77); if(g > 0.35) R(b, gx + x, ky + 1 + (g > 0.7 ? 0 : 2), 1, g > 0.6 ? 4 : 2, '#1a3e78'); }
        for(let y = ky + 8; y < gF - bh - 1; y++) for(let x = -dw; x <= dw; x++) if(((x + y) & 3) === 0 && ((x - y) & 3) === 0) px(b, gx + x, y, x > dw * 0.4 ? '#5aa0d8' : '#8ad0f0');
        R(b, gx - dw - 1, dTop - 1, dw * 2 + 3, 2, '#e8d8b0');
        kubbe(gx, dTop - 2, dw, 21, 28, FIRUZE);
        /* Minareler: çini bantlı, şerefeli */
        const minare = (mx, F, h) => { for(let j = 0; j < h; j++){ const w = j > h * 0.5 ? 2 : 3, y = F - j; for(let q = -w; q <= w; q++){ const t = (q + w) / (2 * w); let c = ((q + j) % 4 === 0 || (q - j) % 4 === 0) ? '#2f6db8' : t < 0.3 ? '#ecd0a4' : t < 0.7 ? '#d4b486' : '#b89668'; if(j % 14 < 2) c = '#2a64a8'; px(b, mx + q, y, c); } } R(b, mx - 4, F - h - 1, 9, 2, '#d4b486'); R(b, mx - 4, F - h + 1, 9, 1, '#2a64a8'); R(b, mx - 2, F - h - 6, 5, 5, '#3a8ac0'); R(b, mx - 2, F - h - 6, 1, 5, '#7cc0e8'); px(b, mx, F - h - 7, '#e0b040'); };
        minare(gx - bw - 6, gF, 74); minare(gx + bw + 6, gF, 74);
        /* Taç kapı (pishtak): çini çerçeve, mukarnaslı kemer, ahşap kapı */
        const px0 = gx - (dar ? 34 : 52), pw = 15, ph = 52;
        R(b, px0 - pw, gF - ph, pw * 2 + 1, ph, '#d4b486'); R(b, px0 - pw, gF - ph, 1, ph, '#f0d4a8'); R(b, px0 + pw - 2, gF - ph, 3, ph, '#b89668');
        R(b, px0 - pw + 2, gF - ph + 2, pw * 2 - 3, 3, '#2a64a8'); R(b, px0 - pw + 2, gF - ph + 2, 3, ph - 2, '#2a64a8'); R(b, px0 + pw - 4, gF - ph + 2, 3, ph - 2, '#2a64a8');
        for(let y = gF - ph + 3; y < gF; y += 2){ px(b, px0 - pw + 3, y, '#f0e0b0'); px(b, px0 + pw - 3, y, '#f0e0b0'); }
        for(let x = px0 - pw + 5; x < px0 + pw - 4; x += 2) px(b, x, gF - ph + 3, '#f0e0b0');
        nis(px0, gF - ph + 8, 8, ph - 8, '#3a78c0', '#173868');
        for(let j = 0; j < 8; j++) for(let i = -j; i <= j; i += 2) px(b, px0 + i, gF - ph + 13 + j, '#5a98d8');
        nis(px0, gF - 15, 3, 15, '#3a2418', gece ? '!#ffcf80' : '#6a4628');
        /* Bahçe, ark, yol */
        cayirCiz(b, z, 55, ['#9cb86c', '#86a85a', '#70944c', '#5a7c40'], ['#f0a0b0', '#fbf6ea']);
        [0.06, 0.16, 0.27, 0.36, 0.8, 0.9].forEach((f, i) => agac(b, yer(f), z + 10, 5 + (i % 3), YESIL.yaprak, i + 3));
        const ay = Math.round(H * 0.865); R(b, 0, ay, W, 2, P.gok[5]); R(b, 0, ay, W, 1, P.gok[7]); R(b, 0, ay + 2, W, 1, '#6a7c40');
        for(let y = ay + 3; y < H; y++) for(let x = 0; x < W; x++){ const n = g2(x * 0.05, y * 0.2, 57) + (bay(x, y) - 0.5) * 0.15; px(b, x, y, n > 0.6 ? '#ead4a8' : n > 0.35 ? '#dcc498' : '#ccb288'); }
        R(b, 0, Math.round(H * 0.94), W, 1, '#c4a87c'); R(b, 0, Math.round(H * 0.975), W, 1, '#c4a87c');
        /* Ön plan kavakları ve Timur'un sancağı */
        [[0.02, 70], [0.055, 56], [0.95, 62], [0.985, 78]].forEach(q => kavak(yer(q[0]), ay + 1, q[1], ['#7aa860', '#5a8a4c', '#3e6c3c']));
        const sx = o.sancak, sF = Math.round(H * 0.9);
        R(b, sx, sF - 52, 1, 53, '#5a3a28'); R(b, sx - 1, sF - 54, 3, 2, '#f0c040'); px(b, sx, sF - 55, '#fff0a0');
        for(let i = -2; i <= 0; i++) for(let q = 0; q < 6 + i; q++) px(b, sx + i, sF - 52 + q, '#2a2228');
      },
    },
  };
  const TUR_LISTE = Object.freeze(['dag', 'magara', 'gol', 'deniz', 'yayla', 'selale', 'kis', 'col', 'kiraz', 'tarla']);

  /* ---------- ORTAK GÖK + ÇİZİM ---------- */
  const GOK_BOY = { bozkir:0.62, kocatepe:0.72, semerkant:0.66, tarla:0.5, dag:0.68, gol:0.52, deniz:0.5, kis:0.56, col:0.58, kiraz:0.52 };
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
