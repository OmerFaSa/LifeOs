/* PİKSEL KAPAK SAHNELERİ — Başbuğ (2026-11-16, depo sahibinin isteği: «hepsini sıfırdan sil, çok daha profesyonel ve amaca uygun yap»).
   Her yerin kendi sahnesi; Türk/Türkistan ve Anadolu dünyası: bozkır, otağ, kale, medrese, kervansaray, yayla, şifahane.
   Kabuk (kabuk/kabuk.js KAPAK) yer → sahne adı verir; eski adlar (yayla, dag, tarla…) ESKI ile yeni sahnelere gider.

   Sözler: süstür, veri okumaz, sayı üretmez; kodla çizilir; sahne bir kez çizilir (binaCiz), hareket saatten hesaplanır (kare).
   Çizim kuralları: az öğe, güçlü siluet; sahne başına sınırlı palet; uzak katman ufuk rengine karışır; ışık sağdan (güneş/ay sağda);
   geçiş yalnız bant kenarında titreşimle (Bayer). Yerleşim: üst-sol (logo, başlık) sakin, asıl öğe sağ yarıda; gök cismi üst
   çubuğun (arama kutusu) altinda. Gece: renk gece tonuna karışır; '!' önekli renk (gök, ateş, pencere ışığı) karışmaz. */
window.LIFEOS = window.LIFEOS || {};

(function(L){
  'use strict';
  const vakit = s => (s >= 6 && s < 20 ? 'gunduz' : 'gece');   // kabuk/gece.js kipSec ile aynı sınır

  /* ---------- RENK: gece karışımı renge sorulurken uygulanır ---------- */
  const sayi = h => parseInt(h.slice(h[0] === '!' ? 2 : 1, h[0] === '!' ? 8 : 7), 16);
  const hex = n => '#' + ((n & 0xffffff) | 0x1000000).toString(16).slice(1);
  function karis(a, b, f){ const x = sayi(a), y = sayi(b), k = s => Math.round(((x >> s) & 255) * (1 - f) + ((y >> s) & 255) * f) << s; return hex(k(16) | k(8) | k(0)); }
  /* gece: ay ışığı. Renk sabit bir tona karışmaz (her şey aynı griye çöküyordu); değeri korunur, doygunluğu düşer, maviye kayar:
     siluetler ve yakın/uzak ayrımı gece de okunur, yer gökten koyu kalır, açık taş ve keçe ayda parlar. İç mekânda (gece = 2) oda kandille loş ve sıcak kalır. */
  function geceTon(c, ic){
    const n = sayi(c), l = 0.3 * (n >> 16) + 0.59 * (n >> 8 & 255) + 0.11 * (n & 255), p = (l / 255) * (l / 255), k = (v, m, a) => Math.round(kis((v * 0.62 + l * 0.38) * m + a, 0, 255));
    /* 2026-11-18b: gece bir tık açık (sahip: «boş ve sönük»); oda kandille biraz daha aydınlık */
    return ic ? hex(k(n >> 16, 0.48, 12) << 16 | k(n >> 8 & 255, 0.39, 9) << 8 | k(n & 255, 0.37, 16)) : hex(k(n >> 16, 0.23, 9 + p * 32) << 16 | k(n >> 8 & 255, 0.27, 12 + p * 38) << 8 | k(n & 255, 0.37, 26 + p * 48));
  }
  let gece = 0, MEV = 'yaz';   // 0 gündüz, 1 gece (ay ışığı), 2 gece iç mekân; MEV: sahnenin mevsimi
  const geceKip = o => (o.gece ? (SAHNE[o.tur].ic ? 2 : 1) : 0);
  /* vaktin ışığı (2026-11-17e): gündüz renk ışığın tonuyla çarpılır, koyu tonlar gölge rengine kayar (şafakta mor, ikindide sıcak,
     gün batımında turuncu ışık + erik gölge); öğle kimliktir (sahneler öğle için çizildi). Gece payı (gf) ay ışığı tonuna karışır. */
  let DER = null, DERA = '', ISIK = null;
  function gunTon(c, D){
    const n = sayi(c), r = n >> 16, g = n >> 8 & 255, b = n & 255, l = (0.3 * r + 0.59 * g + 0.11 * b) / 255, w = (1 - l) * (1 - l) * D.sf;
    const k = (v, i) => Math.round(kis(v * D.t[i] * (1 - w) + D.s[i] * w, 0, 255));
    return hex(k(r, 0) << 16 | k(g, 1) << 8 | k(b, 2));
  }
  function derece(c){ const D = DER; let v = D.gf < 1 ? gunTon(c, D) : c; if(D.gf > 0){ const n = geceTon(c, D.ic); v = D.gf >= 1 ? n : karis(v, n, D.gf); } return v; }
  function derSec(o){ gece = geceKip(o); ISIK = o.isik; MEV = o.mev || 'yaz'; if(DERA !== o.derA){ DERA = o.derA; DER = o.der; onbellek.clear(); } }
  const onbellek = new Map();
  const ton = c => (c[0] === '!' ? c.slice(1) : DER ? derece(c) : c);
  function renk(c){
    const a = c;
    let v = onbellek.get(a);
    if(v === undefined){ const n = sayi(ton(c)); v = ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; onbellek.set(a, v); }
    return v;
  }

  /* ---------- TAMPON ---------- */
  /* k: her pikselin derinlik katmanı (0 gök + uzak, 1 orta, 2 ön); paralaks için kat() anlık görüntü alır */
  const tampon = (W, H) => ({ W, H, d:new Uint32Array(W * H), k:new Uint8Array(W * H), kat:0 });
  const px = (b, x, y, c) => { x = Math.round(x); y = Math.round(y); if(x >= 0 && y >= 0 && x < b.W && y < b.H){ const i = y * b.W + x; b.d[i] = renk(c); b.k[i] = b.kat; } };
  function R(b, x, y, w, h, c){ const v = renk(c), x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y)), x1 = Math.min(b.W, Math.round(x + w)), y1 = Math.min(b.H, Math.round(y + h)); if(x1 <= x0) return; for(let j = y0; j < y1; j++){ b.d.fill(v, j * b.W + x0, j * b.W + x1); b.k.fill(b.kat, j * b.W + x0, j * b.W + x1); } }
  /* dikey şerit (sırt sütunu): R'nin satır başına iki fill çağrısı tek piksellik sütunda pahalıydı */
  function sutun(b, x, y0, y1, c){ const v = renk(c), W = b.W; y0 = Math.max(0, Math.round(y0)); y1 = Math.min(b.H, Math.round(y1)); if(x < 0 || x >= W) return; for(let i = y0 * W + x, j = y0; j < y1; j++, i += W){ b.d[i] = v; b.k[i] = b.kat; } }
  /* katman sınırı: o ana dek çizilen her şey alttaki katmandır (1: gök + uzak sırt bitti, 2: orta plan bitti) */
  function kat(b, n){ if(b.kat >= n) return; if(n === 2 && b.o && b.o.hava === 'sis') sis(b, b.o); if(n === 1) b.s1 = b.d.slice(); else { if(!b.s1) b.s1 = b.d.slice(); b.s2 = b.d.slice(); b.k2 = b.k.slice(); } b.kat = n; }
  /* yarı saydam örtü: yalnız ışık havuzu */
  function ortu(b, x, y, c, a){ if(x < 0 || y < 0 || x >= b.W || y >= b.H) return; const i = y * b.W + x, o = b.d[i], n = renk(c), k = s => Math.round(((o >> s) & 255) * (1 - a) + ((n >> s) & 255) * a) << s; b.d[i] = ((255 << 24) | k(16) | k(8) | k(0)) >>> 0; b.k[i] = b.kat; }
  /* üç kademe; kademe sınırı ince bir Bayer şeridiyle yumuşar (eskiden iç içe sert halkalar görünüyordu) */
  /* yer: yalnız merkezin altı (kapıdan yere düşen ışık duvara tırmanmaz) */
  function isik(b, cx, cy, r, c, a, yer){ for(let y = yer ? 0 : -r; y <= r; y++) for(let x = -r; x <= r; x++){ const d = Math.hypot(x, y * 1.6) / r, X = Math.round(cx + x), Y = Math.round(cy + y); if(d >= 1) continue; const v = (1 - d) * 3, k = Math.min(3, Math.floor(v) + (bay(X, Y) < (v - Math.floor(v) - 0.6) / 0.4 ? 1 : 0)); if(!k || X < 0 || Y < 0 || X >= b.W || Y >= b.H) continue;
    /* iki havuz üst üste binince renk katlanmaz: piksel en güçlü kademeyi bir kez alır (renk sayısı sınırlı kalır) */
    const i = Y * b.W + X; if(!b.lv){ b.lv = new Uint8Array(b.W * b.H); b.lo = new Uint32Array(b.W * b.H); b.lw = new Uint32Array(b.W * b.H); }
    const yak = b.lv[i] && b.d[i] === b.lw[i]; if(yak && k <= b.lv[i]) continue;
    if(yak) b.d[i] = b.lo[i]; else b.lo[i] = b.d[i];
    ortu(b, X, Y, c, k / 3 * a); b.lv[i] = k; b.lw[i] = b.d[i]; } }
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
    aksam:{ g:['#2f3764', '#4f4a7a', '#87597a', '#bf6c62', '#de8c5c', '#efb272'], gunes:'#ffdc98', hale:'#f2a46e', bulut:['#f2b48a', '#8e5a6e'] },   // gün batımı: şafaktan daha turuncu, ufukta kor
    alaca:{ g:['#232c4e', '#323c64', '#4a5480', '#6c7099', '#958ca9'], gunes:'#e9e3c8', hale:'#6f7398', bulut:['#5d6488', '#474e74'] },
    gece:{ g:['#0a1022', '#0f172e', '#151f3b', '#1d2848', '#283355'], gunes:'#ebe5c8', hale:'#2c3860', bulut:['#253054', '#1d2645'] },
    ikindi:{ g:['#4a6f9c', '#6587ae', '#8ea3bb', '#b8b8b0', '#d9c49e', '#e8d2a6'], gunes:'#fff0c4', hale:'#f0d6a2', bulut:['#f4e4c6', '#c9b4a4'] },
  };
  /* GERÇEK SAATE GÖRE GÖK (2026-11-17e): saat → iki komşu durak arası yumuşak geçiş (smoothstep). Gündüz 6–20 (gece.js ile aynı sınır);
     gündüzün iki ucu ve gecenin iki ucu alaca (mavi saat) olduğundan gündüz/gece sınırında gök sıçramaz.
     Her durağın ışığı: t ton (çarpan), s gölge rengi, sf gölge payı, i kenar ışığı, if payı, u kenar ışığının boyu (alçak güneş uzun), a güneşin alçaklığı (1 ufukta). */
  const DURAK = {
    gun:{ t:'#ffffff', s:'#000000', sf:0, i:'#fff1d0', if:0, u:1, a:0 },
    sabah:{ t:'#fff4e6', s:'#56628c', sf:0.1, i:'#ffecc8', if:0.25, u:1.2, a:0.35 },
    safak:{ t:'#f2dad6', s:'#4a4478', sf:0.26, i:'#ffcfb4', if:0.5, u:1.7, a:0.82 },   // şafak serin pembe-lila; akşam sıcak turuncu
    ikindi:{ t:'#fff0d8', s:'#5c4c6c', sf:0.12, i:'#ffd690', if:0.4, u:1.35, a:0.42 },
    aksam:{ t:'#ffcaa4', s:'#3e2c58', sf:0.3, i:'#ffa868', if:0.65, u:2, a:0.92 },
    alaca:{ t:'#b0b4d6', s:'#232848', sf:0.36, i:'#c8b4c8', if:0.15, u:1.2, a:1.25 },
    gece:{ gf:1, a:0 },
  };
  const SEYIR = [[0, 'gece'], [5, 'gece'], [6, 'alaca'], [7, 'safak'], [9, 'sabah'], [12.5, 'gun'], [15.5, 'ikindi'], [18.3, 'aksam'], [20, 'alaca'], [21, 'gece'], [24, 'gece']];
  /* beş an (adları ve temsilî saatleri); eski adlar (dogum, batim) aynı ana gider */
  const AN_SAAT = Object.freeze({ safak:7, ogle:12.5, ikindi:15.5, gunbatimi:18.3, gece:23 });
  const AN_AD = { safak:'safak', dogum:'safak', ogle:'ogle', ikindi:'ikindi', gunbatimi:'gunbatimi', batim:'gunbatimi', aksam:'gunbatimi', gece:'gece' };
  const an = h => (h < 5.5 || h >= 20.5 ? 'gece' : h < 8.5 ? 'safak' : h < 14 ? 'ogle' : h < 17.3 ? 'ikindi' : 'gunbatimi');
  function seyir(h){
    for(let i = 0; i < SEYIR.length - 1; i++){ const [h0, a] = SEYIR[i], [h1, b] = SEYIR[i + 1]; if(h >= h0 && h < h1) return [a, b, sm((h - h0) / (h1 - h0))]; }
    return ['gece', 'gece', 0];
  }
  /* gökler alti durağa örneklenir ki ikisi karışabilsin */
  const alti = g => Array.from({ length:6 }, (_, i) => { const f = i / 5 * (g.length - 1), j = Math.min(g.length - 2, Math.floor(f)); return karis(g[j], g[j + 1], f - j); });
  function gokKaris(A, B, f){ const a = alti(A.g), b = alti(B.g); return { g:a.map((c, i) => karis(c, b[i], f)), gunes:karis(A.gunes, B.gunes, f), hale:karis(A.hale, B.hale, f), bulut:A.bulut.map((c, i) => karis(c, B.bulut[i], f)) }; }
  const rgb = c => { const n = sayi(c); return [n >> 16, n >> 8 & 255, n & 255]; };
  /* saat → gök, ışık ve gölge; ic: iç mekânda ton yarı güçte (oda pencereden aydınlanır) */
  function vaktinIsigi(h, ic){
    const [a, b, f] = seyir(h), A = DURAK[a], B = DURAK[b];
    const G = gokKaris(GOK[a], GOK[b], f);
    const gf = (A.gf || 0) * (1 - f) + (B.gf || 0) * f, D = A.gf && B.gf ? DURAK.alaca : A.gf ? B : B.gf ? A : null;   // gece ucunda öteki durağın ışığı
    const P = D || { t:karis(A.t, B.t, f), s:karis(A.s, B.s, f), sf:A.sf + (B.sf - A.sf) * f, i:karis(A.i, B.i, f), if:A.if + (B.if - A.if) * f, u:A.u + (B.u - A.u) * f };
    const t = ic ? karis('#ffffff', P.t, 0.5) : P.t, sf = ic ? P.sf * 0.5 : P.sf;
    const kimlik = gf === 0 && sf === 0 && t === '#ffffff';
    return { G, a:A.a * (1 - f) + B.a * f, gf, der:kimlik ? null : { t:rgb(t).map(v => v / 255), s:rgb(P.s), sf, gf, ic:!!ic }, isik:{ i:P.i, if:P.if, u:P.u } };
  }
  const YILDIZ = ['!#68718f', '!#b9c0d6', '!#f1efe4'];
  function gok(b, o, boy){
    const dur = o.G.g, n = dur.length - 1;
    /* 2026-11-18e: titreşim şeridi yerine düz bant (piksel-dürüst); başlığın altindan ufka dek iki durak arasına bir ara ton girer,
       ufka yaklaşan geçiş yumuşar; üstte iki durak tam ortada keskin değişir (üst-sol az renkli kalır) */
    for(let y = 0; y < boy; y++){
      const f = y / Math.max(1, boy - 1) * n, i = Math.min(n - 1, Math.floor(f)), q = f - i;
      const c = y < b.H * 0.36 ? dur[q < 0.5 ? i : i + 1] : q < 0.25 ? dur[i] : q < 0.75 ? karis(dur[i], dur[i + 1], 0.5) : dur[i + 1];
      b.d.fill(renk('!' + c), y * b.W, (y + 1) * b.W);
    }
  }
  function gokCismi(b, o, x, y, r){
    const G = o.G, hale = o.gece ? 0.32 : 0.55;
    for(let j = -r * 4; j <= r * 4; j++) for(let i = -r * 4; i <= r * 4; i++){
      const d = Math.hypot(i, j); if(d <= r || d > r * 4) continue;
      /* hale: sabit yoğunluklu halkalar (kenarda dama, sonra çeyrek, sonra seyrek); sürekli azalan yoğunluk kumlu görünüyordu */
      /* 2026-11-18e: dağınık nokta (kumlu) yerine iki dolu halka: içte hale, dışta haleyle göğün yarısı; gece yalnız iç halka */
      if(d <= r + 1.5) px(b, x + i, y + j, '!' + G.hale);
      else if(!o.gece && d <= r * 2.3 && d - r * 2.3 < -0.5) px(b, x + i, y + j, '!' + karis(G.hale, G.g[Math.min(G.g.length - 1, 3)], 0.55));
    }
    for(let j = -r; j <= r; j++) for(let i = -r; i <= r; i++){
      if(Math.hypot(i, j) > r + 0.35) continue;
      if(!o.gece){ px(b, x + i, y + j, '!' + G.gunes); continue; }
      const golge = Math.hypot(i - r * 0.6, j + r * 0.25) < r * 0.95;   // hilal: aydınlık yan solda (bayraktaki gibi)
      px(b, x + i, y + j, golge ? '!#2b3657' : (i + j) % 5 === 0 && i < 0 && j > -r + 1 ? '!#d2cbae' : '!' + G.gunes);
    }
  }
  /* gündüz güneşin altinda ufukta sıcak hale: ufka yaslanmış alçak, dolu bir kuşak; kenarı dama ve seyrek titreşimle söner, tek renk */
  function ufukHale(b, o){
    const a = kis(o.alcak || 0, 0, 1), c = '!' + karis(o.hz, karis('#f7d4a0', ISIK ? ISIK.i : '#f7d4a0', 0.5), 0.4 + a * 0.2), cx = o.gy[0], rx = b.W * (0.3 + a * 0.12), ry = o.ufuk * (0.2 + a * 0.14);   // alçak güneşte daha geniş ve sıcak
    for(let y = Math.round(o.ufuk - ry); y < o.ufuk + 2; y++) for(let x = Math.max(0, Math.round(cx - rx)); x < Math.min(b.W, cx + rx); x++){
      const d = Math.hypot((x - cx) / rx, (o.ufuk - y) / ry), yog = d < 0.82 ? 1 : 0;   // dolu kuşak (eski seyrek noktalar kumluydu)
      if(bay(x, y) < yog) b.d[y * b.W + x] = renk(c);
    }
  }
  /* Samanyolu (2026-11-18b): gecede göğe derinlik. Kuşak sağ altta ufuktan sol üste yükselir, başlığın durduğu üst-sol bölgeye girmez;
     yeni renk yok: kuşaktaki piksel göğün bir (çekirdekte iki) sonraki, daha açık durağını alır, yoğunluk kümeli, ortada ince karanlık bir yarık */
  let SY = null;   // kuşak gürültüsü için hazır tablo (her pikselde sinüs hesaplanmaz)
  function samanyolu(b, o){
    if(!SY){ SY = new Float32Array(1024); for(let i = 0; i < 1024; i++) SY[i] = hash(i, 3); }
    const dur = o.G.g, n = dur.length - 1, z = o.ufuk, W = b.W, hw = b.H * 0.13, sn = 0.21, r2 = o.gr * o.gr * 16, [ax, ay] = o.gy;
    for(let y = 0; y < z - 1; y++){
      const xl = W * (0.52 + 0.48 * (0.9 - y / z) / 0.85), f = y / Math.max(1, z + 1) * n, i = Math.min(n - 1, Math.floor(f)), a = renk('!' + dur[Math.min(n, i + 1)]), c = renk('!' + dur[Math.min(n, i + 2)]);
      const yar = hw * 0.12 + (g1(y * 0.15, 7) - 0.5) * 3, sol = kis((z - 2 - y) / (z * 0.25), 0, 1), dy2 = (y - ay) * (y - ay);
      for(let x = Math.max(Math.round(W * 0.42), Math.round(xl - hw / sn)); x < Math.min(W, xl + hw / sn); x++){
        const e = (x - xl) * sn, d = Math.abs(e) / hw;
        if(d >= 1 || Math.abs(e - yar) < 1.1 || (x - ax) * (x - ax) + dy2 < r2) continue;   // kuşak dışı, yarık, ayın halesi
        const v = x * 0.07 + y * 0.11, k = Math.floor(v), t = sm(v - k), gr = SY[k & 1023] * (1 - t) + SY[(k + 1) & 1023] * t;
        const yog = (1 - d) * (1.25 - d * 0.6) * (0.45 + 0.75 * gr) * sol, q = bay(x, y);
        if(yog > 0.62 && (yog - 0.62) * 2.4 > q) b.d[y * W + x] = c; else if(yog > q) b.d[y * W + x] = a;
      }
    }
  }
  function yildizCiz(b, o){ o.yildizlar.forEach(q => { px(b, q[0], q[1], YILDIZ[q[2]]); if(q[2] === 2 && q[3]) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => px(b, q[0] + d[0], q[1] + d[1], '!#55607e')); }); }
  /* bulut (2026-11-18c, güne göre): ince katman ya da kümülüs (düz taban, iki üç tümsek, alt satır gölge); iki renk */
  function bulut(b, x, y, w, c, kume){
    if(kume){
      const h = kis(Math.round(w / 5), 3, 8), n = w > 26 ? 3 : 2, L = [];
      for(let i = 0; i < n; i++) L.push([x + w * (n === 2 ? 0.32 + i * 0.36 : 0.22 + i * 0.28) + (hash(i, x) - 0.5) * w * 0.1, h * (i === 1 || n === 2 ? 1 : 0.62 + hash(i, y) * 0.25)]);
      /* 2026-11-18e: hacim — her tümseğin güneşe (sağ üst) bakan kubbesi aydınlık, sol alt hilali ara ton, taban gölge; tümsek iç içe geçer */
      const orta = '!' + karis(c[0], c[1], 0.5), isk = (X, j) => L.some(([cx, rr]) => { const a = rr * 1.5 - 1.6, e = rr - 1.6; if(a < 1 || e < 1) return false; const dx = (X - cx - 1) / a, dy = (j - 2) / e; return dy >= -0.5 && dx * dx + Math.max(0, dy) * Math.max(0, dy) < 1; });
      for(let i = 0; i < w; i++){
        let t = Math.min(i, w - 1 - i, 2);
        L.forEach(([cx, rr]) => { const d = (x + i - cx) / (rr * 1.5); if(d * d < 1) t = Math.max(t, Math.round(rr * Math.sqrt(1 - d * d))); });
        for(let j = 0; j < t; j++) px(b, x + i, y - j, j === 0 ? c[1] : isk(x + i, j) ? c[0] : j === 1 && bay(x + i, y) < 0.5 ? c[1] : orta);
      }
      return;
    }
    const h = Math.max(2, Math.round(w / 8));
    for(let j = 0; j < h; j++){
      const ww = Math.round(w * (1 - j * 0.62 / h)), xx = x + Math.round((w - ww) * (0.3 + 0.4 * hash(j, x)));
      R(b, xx + 1, y - j, ww - 2, 1, j === 0 ? c[1] : c[0]); px(b, xx, y - j - (j ? 0 : 1), c[0]); if(j === 0) R(b, xx + 1, y - 1, ww - 2, 1, c[0]);
    }
  }
  /* sis: ufka yaslanan üç yatay şerit, kat 2'den önce (uzak ve orta katmanın üstünde); yer yer incelir, kopar */
  function sis(b, o){
    const c = karis(o.hz, '#f2f2ee', 0.4), c2 = karis(o.hz, '#f2f2ee', 0.2), a = Math.max(3, Math.round(o.H * 0.05));
    for(let k = 0; k < 3; k++){ const yo = o.ufuk - 1 - k * a; for(let x = 0; x < b.W; x++){ const t = Math.round((g1(x * (0.012 + k * 0.007), 9 + k * 5) - 0.25) * (12 - k * 3.5)); for(let j = 0; j < t; j++) px(b, x, yo - (t >> 1) + j, j && j < t - 1 ? c : c2); } }
  }
  /* durağan yağış, tek renk: yağmur eğik çizgi, kar tane; x < 0.4W boş (başlık sakin) */
  function yagis(b, o, x0, y0, x1, y1, ic){
    const kar = o.hava === 'kar', c = kar ? '#f2f4f4' : '#a4aebc', r = tohum(o.gun * 7 + x0), n = (x1 - x0) * (y1 - y0) / (kar ? 60 : 80);
    for(let i = 0; i < n; i++){ const x = x0 + Math.floor(r() * (x1 - x0)), y = y0 + Math.floor(r() * (y1 - y0)); if(!ic && r() > kis((x / b.W - 0.4) / 0.35, 0, 1)) continue; px(b, x, y, c); if(!kar){ px(b, x, y + 1, c); px(b, x - 1, y + 2, c); if(r() < 0.5) px(b, x - 1, y + 3, c); } }
  }
  /* pencereden görünen gök (iç sahneler): aynı paletin küçük kopyası */
  function pencereGok(b, o, x0, y0, x1, y1){
    const dur = o.G.g, n = dur.length - 1, h = y1 - y0;
    for(let y = y0; y < y1; y++){ const f = (y - y0) / Math.max(1, h - 1) * n, i = Math.min(n - 1, Math.floor(f)); R(b, x0, y, x1 - x0, 1, '!' + dur[f - i < 0.5 ? i : i + 1]); }
  }

  /* ---------- ARAZİ ---------- */
  function yuk(a, x){ let n = g1(x * a.f, a.s) * 0.7 + g1(x * a.f * 2.7, a.s + 11) * 0.3; if(a.sivri) n = Math.pow(n, a.sivri); return a.y - a.amp * n; }
  /* sırt: gövde rengi, sağa bakan yamaçta ışık (güneş sağda), istenirse kar */
  function sirt(b, a){
    /* kenar ışığı vaktin ışığını alır: alçak güneşte uzun ve sıcak (şafak, gün batımı), öğlede kısa */
    if(MEV === 'kis' && !a.kar && !a.karli) a = Object.assign({}, a, a.i ? { kar:[karis(a.i, '#f6f8f8', 0.7), karis(a.c, '#e8eef0', 0.45), 0.6] } : { c:karis(a.c, '#e8eef0', 0.6) });   // kışın uzak sırtta kar başlığı, yakında kar örtüsü
    const u = !gece && ISIK ? ISIK.u : 1, ic = a.i && !gece && ISIK && ISIK.if ? karis(a.i, ISIK.i, ISIK.if) : a.i;
    /* 2026-11-18e atmosfer perspektifi: ard → arkada daha yüksek, ufka karışmış soluk bir sırt; uzak sırtın eteğinde vadi pusu (dalgalı, tek ton) */
    if(a.ard && b.o) sirt(b, { y:a.y - 1, amp:a.amp * 1.45, f:a.f * 0.62, s:a.s + 50, sivri:a.sivri, alt:Math.round(a.y) + 1, c:karis(a.c, b.o.hz, 0.55) });   // alt: öndeki sırt örter, sütun orada biter
    const pus = (a.ard || a.vadi) && b.o ? karis(a.c, b.o.hz, 0.4) : null;   // yalnız uzak sırt (yakın çayır pusla yıkanmasın)
    for(let x = 0; x < b.W; x++){
      const h = yuk(a, x), y0 = Math.round(h), e = yuk(a, x + 1.5) - yuk(a, x - 1.5);
      sutun(b, x, y0, a.alt || b.H, a.c);
      if(pus){ const yp = Math.max(y0 + 2, Math.round(a.y - a.amp * (0.12 + 0.22 * g1(x * 0.05, a.s + 8)))); sutun(b, x, yp, Math.round(a.y) + 4, pus); }
      if(a.i && e > 0.25){ const d = Math.min(Math.round((a.dd || 5) * u), Math.round(1 + e * 2.5 * u)); for(let j = 0; j < d; j++) if(bay(x, y0 + j) > j / d * 0.9) px(b, x, y0 + j, ic); }
      if(a.kar){ const sinir = a.y - a.amp * a.kar[2] + (g1(x * 0.4, a.s + 3) - 0.5) * 3 + Math.pow(g1(x * 0.22, a.s + 5), 2) * a.amp * 0.16 + (g1(x * 1.3, a.s + 6) > 0.7 ? 1 : 0); /* derelere inen geniş kar dilleri, kırık alt kenar */ for(let y = y0; y < sinir; y++) px(b, x, y, e > -0.15 ? a.kar[0] : a.kar[1]); }
    }
  }
  /* zemin: ufuktan öne koyulaşan bantlar, dalgalı ve titreşimli dikiş */
  /* doygunluk: renk griden f oranında uzaklaşır (öndeki zemin bantları daha doygun, atmosfer perspektifi) */
  function doy(c, f){ const n = sayi(c), l = 0.3 * (n >> 16) + 0.59 * (n >> 8 & 255) + 0.11 * (n & 255), k = v => Math.round(kis(l + (v - l) * (1 + f), 0, 255)); return hex(k(n >> 16) << 16 | k(n >> 8 & 255) << 8 | k(n & 255)); }
  /* mevsim (2026-11-18c): sahneler yaz için çizildi; zemin kışın kar, sonbaharda sarı, ilkbaharda taze yeşile karışır */
  const MEVR = { kis:['#eef2f4', 0.74], sonbahar:['#b8924a', 0.3], ilkbahar:['#80a858', 0.32] };
  function zemin(b, y0, rk, s){
    const n = rk.length, M = MEVR[MEV];
    rk = rk.map((c, i) => doy(M ? karis(c, M[0], M[1]) : c, i / (n - 1) * 0.35));
    for(let x = 0; x < b.W; x++){
      let y = y0;
      for(let i = 0; i < n; i++){
        const yb = i === n - 1 ? b.H : Math.round(y0 + (b.H - y0) * Math.pow((i + 1) / n, 1.3) + (g1(x * 0.03, s + i) - 0.5) * 3);
        if(yb > y){ R(b, x, y, 1, yb - y, rk[i]); if(i && bay(x, y) < 0.5) px(b, x, y, rk[i - 1]); y = yb; }
      }
    }
    /* 2026-11-18e doku: yeni renk açmadan alttaki (koyu) bandın rengiyle kısa çizgiler, üstüne bir satır üstteki (açık) bandın rengi:
       ışık alan öbek ve toprak kırığı; ufukta seyrek ve kısa, önde sık ve uzun; başlığın altinda (sol) yarı yoğun; en öndeki band bir koyu ton alır */
    if(MEV !== 'kis'){
      const r = tohum(s * 3 + 1), N = b.W * (b.H - y0) / 7, kd = karis(rk[n - 1], '#2a2016', 0.22);
      for(let q = 0; q < N; q++){
        const x = Math.floor(r() * b.W), y = Math.floor(y0 + 2 + r() * (b.H - y0 - 2)), f = (y - y0) / (b.H - y0), L = 1 + Math.floor(r() * (1 + f * 4));
        if(r() > 0.2 + f * 0.8 || (x < b.W * 0.4 && r() < 0.5)) continue;
        const k = Math.min(n - 1, Math.floor(Math.pow(f, 1 / 1.3) * n));
        R(b, x, y, L, 1, k < n - 1 ? rk[k + 1] : kd);
        if(k && r() < 0.6) R(b, x + (L > 2 ? 1 : 0), y - 1, Math.max(1, L - 2), 1, rk[k - 1]);
      }
    }
    /* kar yüzeyi düz beyaz kalmasın: rüzgârın bıraktığı kısa gölge çizgileri (alttaki bandın rengi) */
    if(MEV === 'kis'){ const r = tohum(s); for(let i = 0; i < b.W * (b.H - y0) / 50; i++){ const y = Math.floor(y0 + 1 + r() * (b.H - y0)), k = Math.min(n - 1, Math.floor(Math.pow((y - y0) / (b.H - y0), 1 / 1.3) * n) + 1); R(b, Math.floor(r() * b.W), y, 2 + Math.floor(r() * 4), 1, rk[k]); } }
  }
  /* ot öbeği; önde (alt kenara yakın) uzun saplı: ön planın derinliği; kışın kardan çıkan kuru sap */
  function otlar(b, o, y0, n, c, s){ const r = tohum(s + (o.gun || 0)); if(MEV === 'kis') n *= 0.4; else if(MEVR[MEV]) c = karis(c, MEVR[MEV][0], 0.3); for(let i = 0; i < n; i++){ const x = Math.floor(r() * b.W), y = Math.floor(y0 + r() * (b.H - y0)); if(x < b.W * 0.52 && y < b.H * 0.86) continue; px(b, x, y, c); if(MEV === 'kis'){ px(b, x, y - 1, c); continue; } px(b, x - 1, y - 1, c); px(b, x + 1, y - 1, c); if(y > b.H * 0.88){ px(b, x - 1, y - 2, c); px(b, x + 2, y - 2, c); px(b, x, y - 1, c); } } }
  function spr(b, x, y, k, pal, ters, z){ z = z || 1; const w = k[0].length; for(let j = 0; j < k.length; j++) for(let i = 0; i < w; i++){ const ch = k[j][ters ? w - 1 - i : i]; if(ch !== '.') R(b, x + i * z, y + j * z, z, z, pal[ch] || P_SABIT[ch]); } }
  /* sivri kemer: x sol, y alt, w genişlik, h boy */
  function kemer(b, x, y, w, h, c){ const hw = w / 2; for(let j = 0; j < h; j++){ const t = j / h, k = t < 0.6 ? 1 : Math.sqrt(1 - Math.pow((t - 0.6) / 0.4, 2)), ww = Math.max(1, Math.round(w * k)); R(b, x + Math.round(hw - ww / 2), y - j, ww, 1, c); } }
  /* mukarnas (2026-11-18e): sivri kemerin başında basamaklı hücre sıraları (üstü ışık, altı gölge), kemer içinin sağ kenarı gölgede
     (güneş sağda, iç duvar gölge alır). cx orta, y kemerin alt satırı, w, h kemerin boyu; c: [ışık, orta, gölge] */
  function mukarnas(b, cx, y, w, h, c){
    const yar = j => { const t = j / h, k = t < 0.6 ? 1 : Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.6) / 0.4, 2))); return Math.round(w * k / 2); };
    for(let j = Math.round(h * 0.62), n = 0; j < h - 1; j += 2, n++){ const hw = yar(j) - 1; for(let i = -hw + (n % 2); i < hw; i += 3){ px(b, cx + i, y - j, c[0]); px(b, cx + i, y - j + 1, c[1]); px(b, cx + i + 1, y - j + 1, c[2]); } }
    for(let j = 2; j < Math.round(h * 0.62); j++) R(b, cx + yar(j) - 3, y - j, 2, 1, c[2]);
  }

  /* TÜRK ÖĞELERİ (2026-11-18e, sahibin isteği) */
  /* Selçuklu sekiz köşeli yıldızı: 5×5 kare ile yarıçapı 3 baklavanın birleşimi, göbeği ayrı renk */
  function yildiz8(b, cx, cy, c, ic){ for(let j = -3; j <= 3; j++) for(let i = -3; i <= 3; i++) if((Math.abs(i) <= 2 && Math.abs(j) <= 2) || Math.abs(i) + Math.abs(j) <= 3) px(b, cx + i, cy + j, Math.abs(i) + Math.abs(j) <= 1 ? ic : c); }
  /* çini kitabe şeridi: lacivert zemin, firuze kenar, beyaz yazı izlenimi */
  function kitabe(b, x0, x1, y, h){ R(b, x0, y, x1 - x0, h, '#1e3a62'); R(b, x0, y, x1 - x0, 1, '#3ea0a8'); R(b, x0, y + h - 1, x1 - x0, 1, '#3ea0a8'); for(let x = x0 + 1; x < x1 - 1; x++) if(h > 2 && (hash(x, 7) > 0.5 || x % 3 === 0)) px(b, x, y + 1 + (h > 3 && hash(x, 8) > 0.6 ? 1 : 0), '#e8dcc0'); }
  const KURT = ['..y.y', '.yyyy', 'yyyyy', '...yy'];   // altin kurt başı (sola bakar)
  /* Göktürk sancağı: direğin tepesinde altin kurt başı, altında gök mavisi alem */
  function gokSancak(b, x, y, h){
    R(b, x, y - h, 1, h, '#4a3c30');
    spr(b, x - 3, y - h - 4, KURT, { y:'#d8b456' });
    for(let j = 0; j < Math.round(h * 0.4); j++){ const w = Math.max(1, 6 - (j > h * 0.3 ? j - Math.round(h * 0.3) : 0)); R(b, x - w, y - h + 1 + j, w, 1, j === 0 ? '#d8b456' : '#2c6aa8'); }
  }
  /* Orhun tarzı dikili taş (kitabe): sütun sütun çentikler, Göktürk harfi izlenimi (gerçek yazı değil); balbal: insan biçimli küçük taş */
  function dikiliTas(b, x, y, h){
    R(b, x + 1, y - h - 1, 3, 1, '#9a968a'); R(b, x, y - h, 5, h, '#9a968a'); R(b, x, y - h, 1, h, '#77736a'); R(b, x + 4, y - h, 1, h, '#bdb8aa');
    for(const c of [1, 3]) for(let j = y - h + 2; j < y - 2; j += 2){ const q = hash(j * 3 + c, 5); if(q > 0.25) px(b, x + c, j, '#4e4a44'); if(q > 0.7) px(b, x + c + (q > 0.85 ? 0 : -1), j + 1, '#4e4a44'); }
    R(b, x - 1, y, 7, 1, '#6a665c');
  }
  const balbal = (b, x, y) => spr(b, x, y - 5, ['.t.', 'tkt', 'ttt', 'ttt', 'ttt'], { t:'#8a867a', k:'#5a564e' });

  /* ---------- YAPILAR ---------- */
  /* otağ (keçe ev): x orta, y yer, s duvar boyu, f uzaklık (ufka karışma) */
  function otag(b, o, x, y, s, f){
    const u = c => (f ? karis(c, o.pus, f) : c), hw = Math.round(s * 1.6), top = y - s, rh = Math.max(2, Math.round(s * 0.85));
    R(b, x - hw - 1, y, hw * 2 + 3, 1, u('#5c4f3c'));
    for(let i = -hw; i <= hw; i++) R(b, x + i, top, 1, s, u(i < -hw * 0.35 ? '#c3b294' : '#e5d8be'));
    const K = o.kece || KECE[0];
    if(s > 4){ R(b, x - hw, top + 1, hw * 2 + 1, 1, u(K[0])); for(let i = -hw; i <= hw; i += 3) px(b, x + i, top + 1, u(K[1])); }
    for(let j = 0; j < rh; j++){
      const w = Math.round((hw + 1) * Math.sqrt(1 - Math.pow(j / rh, 2))), yy = top - 1 - j;
      for(let i = -w; i <= w; i++) px(b, x + i, yy, j === 0 ? u('#8f7d63') : i < -w * 0.35 ? u('#b8a587') : (s > 6 && i % Math.max(3, Math.round(w / 3)) === 0 && j < rh - 1) ? u('#c4b293') : u('#d9c9aa'));
    }
    R(b, x - 1, top - rh, 3, 1, u('#5a4636'));
    /* 2026-11-18e yakın otağ: saçak gölgesi, yere oturduğu yerde koyuluk, güneş yanında ışık kenarı, yere sola düşen gölge, kapı kanatları */
    if(!f && s > 5){
      R(b, x - hw, top, hw * 2 + 1, 1, '#b8a587'); R(b, x - hw, top, Math.round(hw * 0.65), 1, '#a8957a');
      R(b, x - hw, y - 1, hw * 2 + 1, 1, '#c8b898'); R(b, x - hw, y - 1, Math.round(hw * 0.65), 1, '#a8957a');
      if(!o.gece) R(b, x + hw, top + 1, 1, s - 2, '#f4ead4');
      if(!o.gece) for(let j = 1; j <= 2; j++) R(b, x - hw - Math.round(s * (j === 1 ? 1.1 : 0.6)), y + j, hw + Math.round(s * (j === 1 ? 1.1 : 0.6)), 1, '#7d6c4c');
      for(let i = -hw + 2; i < hw; i += 4) px(b, x + i, top - 1, u('#8f7d63'));
    }
    const dw = Math.max(1, Math.round(s * 0.42)), dh = Math.max(2, Math.round(s * 0.68)), dx = x + Math.round(hw * 0.15) - Math.floor(dw / 2);
    if(s > 3) R(b, dx - 1, y - dh - 1, dw + 2, dh + 1, u('#c08c3c'));
    R(b, dx, y - dh, dw, dh, o.lamba ? '!#efb15c' : u(K[2]));
    if(!f && dw > 2 && !o.lamba){ R(b, dx + (dw >> 1), y - dh, 1, dh, karis(K[2], '#1a1210', 0.35)); px(b, dx + (dw >> 1) - 1, y - (dh >> 1), K[1]); px(b, dx + (dw >> 1) + 1, y - (dh >> 1), K[1]); }   // iki kanat, iki tokmak
    if(!o.lamba || f) return;
    /* yakın otağ gece: kapıdan yere sıcak ışık, tündükten sızan ışık, ay tarafında (sağ) ince ay ışığı kenarı */
    isik(b, dx + dw / 2, y, Math.round(s * 1.6), '!#f0a858', 0.52, true);
    px(b, x, top - rh, '!#efb15c'); if(s > 6){ px(b, x - 1, top - rh, '!#efb15c'); px(b, x + 1, top - rh, '!#efb15c'); }
    if(o.gece){ for(let j = 1; j < rh; j++){ const w = Math.round((hw + 1) * Math.sqrt(1 - Math.pow(j / rh, 2))); px(b, x + w, top - 1 - j, '!#9aa4c8'); } R(b, x + hw, top, 1, s, '!#9aa4c8'); }
  }
  const KECE = [['#9a4636', '#c98e44', '#7f3428'], ['#2c4a72', '#d0a24c', '#24385a'], ['#4e6a3a', '#d8b456', '#3a4e2a'], ['#7a3a5a', '#c98e44', '#5a2a44']];   // kuşak, nakış, kapı (güne göre)
  /* ocak: taş halka, odun, yere ve yakındakilere düşen ateş ışığı; alevi sakin çizer (HAREKET alev, kıvılcım) */
  function ocak(b, x, y, r){
    isik(b, x, y - 1, r, '!#f0a858', 0.52);
    [[-3, 0], [-2, 1], [0, 1], [2, 1], [3, 0]].forEach(d => px(b, x + d[0], y + d[1], '#5c4f3c'));
    R(b, x - 2, y, 5, 1, '#5a4636'); px(b, x - 1, y, '!#c4482c'); px(b, x + 1, y, '!#f39a44');
  }
  /* kara çadır (Yörük): uzun, alçak, direkli */
  function karaCadir(b, o, x, y, w, h){
    /* üç direkle gerilmiş kıl çadır: direk başlarında tepe, aralarda sarkan çatı, uçlarda yere inen yamaç ve gergi ipleri;
       dokuma şeritleri çatıyla aynı eğride (eski dikey çizgiler ahşap barakaya benziyordu) */
    const d = [0.2, 0.5, 0.8].map(t => Math.round(t * (w - 1))), sk = h * 0.16;
    const hh = i => i <= d[0] ? h * (0.45 + 0.55 * i / d[0]) : i >= d[2] ? h * (0.45 + 0.55 * (w - 1 - i) / (w - 1 - d[2])) : h - sk * Math.sin(Math.PI * (i < d[1] ? (i - d[0]) / (d[1] - d[0]) : (i - d[1]) / (d[2] - d[1])));
    [[0, -1], [w - 1, 1]].forEach(([i, yon]) => { const t = y - Math.round(hh(i)), L = Math.round(h * 0.6); for(let k = 1; k <= L; k++) px(b, x + i + yon * k, t + Math.round(k * (y - t) / L), '#4f4650'); px(b, x + i + yon * L, y, '#6a5444'); });
    for(let i = 0; i < w; i++){
      const t = Math.round(y - hh(i)), uc = i > d[2];
      for(let yy = t + 1; yy < y; yy++){ const k = yy - t; px(b, x + i, yy, k % 4 === 0 ? (uc ? '#3c343a' : '#2c262a') : (i * 3 + yy * 5) % 11 === 0 ? '#40363c' : uc ? '#463d44' : '#382f35'); }
      px(b, x + i, t, '!#6c6a8a'); if(i > w * 0.5) px(b, x + i, t + 1, '!#4a4866');
    }
    for(let i = 1; i < w - 1; i++){ const t = Math.round(y - hh(i)), yy = t + Math.round(hh(i) * 0.38); px(b, x + i, yy, (i >> 1) % 2 ? '#8a3a2e' : '#2c4570'); if(i % 4 === 0) px(b, x + i, yy + 1, '#c98e44'); }   // dokuma kuşak (kırmızı-lacivert)
    d.forEach(i => { const t = y - Math.round(hh(i)); R(b, x + i, t - 2, 1, 2, '#6a5444'); });
    const kx = x + Math.round(w * 0.56), kw = Math.max(3, Math.round(w * 0.18)), kh = Math.round(hh(kx - x) * 0.66), ky = y - kh;
    R(b, kx, ky, kw, kh, o.lamba ? '!#e0a258' : '#1e181c'); if(o.lamba){ R(b, kx, ky, kw, 1, '!#f2c47a'); isik(b, kx + kw / 2, y, Math.round(kw * 1.4), '!#e0a258', 0.34, true); }
    R(b, kx - 1, ky - 1, kw + 2, 1, '#2a2328');
    /* önde kamış çiğ: gündüz açık renk, gece ışığın önünde siluet */
    const ch = Math.max(2, Math.round(kh * 0.3));
    for(let i = 0; i < kw; i++) for(let j = 0; j < ch; j++) px(b, kx + i, y - 1 - j, o.lamba ? '#3a2e26' : j === ch >> 1 && i % 3 === 1 ? '#8a3a2e' : i % 2 ? '#9a8a62' : '#7a6a4c');
    R(b, x - 2, y, w + 4, 1, '#2a2629');
  }
  const KOYUN = ['.ww.', 'Wwwk', '.k.k'], KOYUN_P = { w:'#ece8dc', W:'#c4bdae', k:'#3a3632' };   // yakın koyun: post, gölge, baş ve bacak
  /* koyun sürüsü: beyaz post, koyu baş (Yaylak ve kimi gün Ötüken) */
  function suru(b, x0, x1, y0, y1, n, r){ for(let i = 0; i < n; i++){ const x = Math.round(x0 + r() * (x1 - x0)), y = Math.round(y0 + r() * (y1 - y0)); R(b, x, y, 2, 1, '#e6e4da'); px(b, x + (i % 2 ? 2 : -1), y, '#3a3632'); } }
  /* bayrak direği (bayrağı kare çizer) */
  function direk(b, x, y, h, c){ R(b, x, y - h, 1, h, c || '#4a3f36'); px(b, x, y - h - 1, '#d8b456'); }

  /* ---------- İÇ MEKÂN ---------- */
  function duvar(b, o, y1, ac, koyu, isikX){
    for(let y = 0; y < y1; y++) for(let x = 0; x < b.W; x++){
      /* düz duvar; yalnız tavan gölgesi (üst çubuğun altinda kalır) — başlığın arkasında kumlanma yok */
      px(b, x, y, y < b.H * 0.1 ? koyu : y < b.H * 0.14 ? karis(koyu, ac, 0.5) : ac);   // 2026-11-18e: tavan gölgesi dama yerine ara ton bandı
    }
  }
  /* gündüz pencereden duvara düşen güneş: pencerenin sola-aşağı kaymış eğik kopyası, kayıtlar gölge, kenar titreşimli;
     başlık bölgesine (sol, üst üçte bir) girmez */
  /* gece aynı yoldan ay ışığı düşer: soğuk, soluk (kandilin sıcak havuzuyla karşıtlık) */
  function gunIsigi(b, o, p, ac){
    const a = o.gece ? 0.6 : o.alcak || 0; if(a > 1 || (o.kapali && !o.gece)) return;   // güneş ufkun altında ya da gök kapalı: pencereden ışık düşmez
    const c = o.gece ? '!' + karis(ton(ac), '#a4b4e0', 0.16) : karis(ac, ISIK && ISIK.if ? karis('#fff1d0', ISIK.i, ISIK.if) : '#fff1d0', 0.3), ww = p.wx1 - p.wx0, wh = p.wy1 - p.wy0, kay = 0.5 + a * 0.5;   // alçak güneş uzun, eğik
    const y0 = Math.max(Math.round(b.H * 0.36), p.wy0 + Math.round(wh * 0.3)), y1 = Math.min(p.yz - 2, y0 + Math.round(wh * 0.8)), sag = p.wx0 - 6;
    const w = Math.min(Math.round(ww * 0.75), sag - Math.round((y1 - y0) * kay) - Math.round(b.W * 0.42));
    if(w < 8) return;
    for(let y = y0; y < y1; y++){ const s = sag - w - Math.round((y - y0) * kay); for(let x = s; x < s + w; x++){
      const kx = x - s, ky = y - y0, kenar = Math.min(kx, w - 1 - kx, ky, y1 - 1 - y);
      if(kx === (w >> 1) || ky === ((y1 - y0) >> 1) || (kenar === 0 && bay(x, y) < 0.5)) continue;
      px(b, x, y, c);
    } }
  }
  /* pencereden inen huzme (2026-11-18e; eskiden dama titreşimiydi): havada tek soluk ton, yere vurduğu yerde ikinci ton, içinde durağan toz zerreleri;
     y0..y1 satırları, x0 − k0·d … x1 − k1·d (d = y − y0), yz zemin; başlığın bölgesine (sol üst) girmez */
  function huzme(b, o, x0, x1, y0, y1, k0, k1, yz){
    if(o.lamba) return;
    const c = '!#fff0c8';
    for(let y = y0; y < y1; y++){ const d = y - y0, a = Math.round(x0 - d * k0), z = Math.round(x1 - d * k1); for(let x = a; x < z; x++){ if(x < b.W * 0.4 && y < b.H * 0.36) continue; ortu(b, x, y, c, y >= yz ? 0.2 : 0.1); } }
    for(let i = 0; i < 9; i++){ const y = Math.round(y0 + hash(i, 61) * (Math.min(y1, yz) - y0)), d = y - y0, x = Math.round(x0 - d * k0 + hash(i, 62) * (x1 - x0 + d * (k0 - k1))); px(b, x, y, '!#fff6e0'); }
  }
  /* duvarın dibinde kuşak: ahşap lambri ya da (hattat) çini; pervazı ışık alır, alti gölge */
  function lambri(b, y1, h, cini){
    const y0 = y1 - h;
    if(cini){
      R(b, 0, y0, b.W, h, '#e4dac2'); R(b, 0, y0, b.W, 1, '#2c5585'); R(b, 0, y1 - 1, b.W, 1, '#2c5585');
      const m = y0 + (h >> 1);
      for(let x = 3; x < b.W; x += 6){ for(let d = 0; d <= 2; d++){ px(b, x - d, m - 2 + d, '#2c5585'); px(b, x + d, m - 2 + d, '#2c5585'); px(b, x - d, m + 2 - d, '#2c5585'); px(b, x + d, m + 2 - d, '#2c5585'); } px(b, x, m, '#3ea0a8'); px(b, x + 3, m, '#b8352f'); }
      return;
    }
    R(b, 0, y0, b.W, h, '#8f7052'); if(!gece) R(b, 0, y0, b.W, 1, '#b08c66');   // gece pervaz ışığı yok (renk bütçesi kandil ışığına) R(b, 0, y0 + 1, b.W, 1, '#6e543c');
    for(let x = 5; x < b.W; x += 12) R(b, x, y0 + 3, 1, h - 4, '#6e543c');
  }
  function pencere(b, o, x0, y0, x1, y1, a){
    pencereGok(b, o, x0, y0, x1, y1);
    const z = Math.round(y0 + (y1 - y0) * 0.72), son = o.G.g[o.G.g.length - 1];
    if(a.uzak) for(let x = x0; x < x1; x++){ const h = Math.round(z - (g1(x * 0.12, 5) * 0.8 + 0.2) * (y1 - y0) * 0.16); R(b, x, h, 1, y1 - h, karis(a.uzak, son, 0.45)); }
    /* önde ova: uzak tepeler soluk ve maviye kayık, yakın yer sıcak (eskiden pencerenin alti tek gri banttı) */
    if(a.uzak) for(let x = x0; x < x1; x++){ const h = Math.round(z + 2 + g1(x * 0.2, 6) * 2); for(let y = h; y < y1; y++) px(b, x, y, y === h && bay(x, y) < 0.5 ? karis(a.uzak, son, 0.45) : y > h + 2 ? (MEV === 'kis' ? '#d8dcd8' : '#7f8a5c') : MEV === 'kis' ? '#e8ecea' : '#97a06a'); }
    if(a.minare){ const mx = x0 + Math.round((x1 - x0) * 0.3), mh = Math.round((y1 - y0) * 0.5), c = karis(a.minare, o.hz, 0.35); R(b, mx, z - mh, 2, mh, c); px(b, mx, z - mh - 1, c); px(b, mx + 1, z - mh - 2, c); }
    if(a.cisim && !o.kapali) gokCismi(b, o, x0 + Math.round((x1 - x0) * 0.68), y0 + Math.round((y1 - y0) * 0.3), 2);
    if(o.kapali) yagis(b, o, x0, y0, x1, y1, true);
    else if(o.gece) for(let i = 0; i < (x1 - x0) * (y1 - y0) / 40; i++){ const x = x0 + Math.floor(hash(i, 3) * (x1 - x0)), y = y0 + Math.floor(hash(i, 4) * (z - y0 - 2)); px(b, x, y, YILDIZ[i % 2]); }
  }
  /* kitap sırası: rafın üstünde, türlü boy ve sırt rengi */
  const KITAP = ['#7a3a33', '#3c566a', '#6a683a', '#8b6a3c', '#4a3e58', '#b8a882'];
  function kitaplar(b, x0, x1, y, h, s){ const r = tohum(s); let x = x0; while(x < x1 - 1){ const w = 1 + (r() < 0.35 ? 1 : 0), hh = Math.max(2, Math.round(h * (0.6 + r() * 0.4))), c = KITAP[Math.floor(r() * KITAP.length)]; if(r() < 0.08){ x += 2; continue; } R(b, x, y - hh, w, hh, c); if(hh > 3) px(b, x, y - hh + 1, '#d8c8a0'); if(hh > 5 && r() < 0.45) R(b, x, y - hh + 3, w, 1, '#c69a48'); x += w; } }   // sırtta yaldız şerit
  /* yer kilimi (2026-11-18e): öne doğru açılan yamuk, günün dokuması; kenar şeridi, ortada baklava dizisi, önde saçak */
  function kilim(b, o, x0, x1, y0, y1){
    const K = o.kece, h = y1 - y0, m = y0 + (h >> 1);
    for(let y = y0; y < y1; y++){ const e = Math.round((y - y0) * 0.5), a = x0 - e, z = x1 + e; R(b, a, y, z - a, 1, K[0]); px(b, a, y, K[2]); px(b, z - 1, y, K[2]); if(y === y0 + 1 || y === y1 - 2) R(b, a + 2, y, z - a - 4, 1, K[2]); }
    for(let x = x0 + 4; x < x1 - 3; x += 7){ const e = m - y0 >> 1; px(b, x - e, m - 2, K[1]); px(b, x - e - 1, m - 1, K[1]); px(b, x - e + 1, m - 1, K[1]); px(b, x - e - 2, m, K[1]); px(b, x - e + 2, m, K[1]); px(b, x - e - 1, m + 1, K[1]); px(b, x - e + 1, m + 1, K[1]); px(b, x - e, m + 2, K[1]); px(b, x - e, m, K[2]); }
    for(let x = x0 - (h >> 1); x < x1 + (h >> 1); x += 2) px(b, x, y1, '#e8dcc4');
  }
  /* ağaç: gövde, ışığı sağdan alan küme küme taç (Pınar'ın çınarı; Ufuk'ta yalnız karaağaç) */
  function agac(b, tx, ty, th, sd, gv){
    R(b, tx - 1, ty - th * 0.7, 3, th * 0.7, gv[0]); R(b, tx - 1, ty - th * 0.7, 1, th * 0.7, gv[1]); for(let j = 4; j < th * 0.7; j += 5) px(b, tx, ty - j, gv[1]);
    const r = tohum(sd), tepe = ty - th, T = TAC[MEV] || TAC.yaz;
    for(let i = 0; i < 14; i++){
      const a = r() * Math.PI, d = r(), cx = tx + Math.cos(a) * th * 0.5 * d * 1.2, cy = tepe + th * 0.3 + Math.sin(a) * -th * 0.22 * d + r() * th * 0.12, rr = th * (0.12 + r() * 0.08);
      for(let y = -rr; y <= rr; y++){ const w = Math.sqrt(rr * rr - y * y) * 1.3; for(let x = -w; x <= w; x++){ const isk = x / w - y / rr * 0.6; px(b, Math.round(cx + x), Math.round(cy + y), T[isk > 0.55 ? 0 : isk < -0.5 ? 2 : 1]); } }
    }
    R(b, tx - Math.round(th * 0.6), ty, Math.round(th * 1.2), 1, '#5c6e44');
  }
  const TAC = { yaz:['#86a25c', '#66844a', '#4b6638'], ilkbahar:['#a2c06a', '#78984e', '#56723c'], sonbahar:['#dcae4e', '#b47a34', '#7c5430'], kis:['#eef2f0', '#6a7468', '#4a5448'] };   // ışık, gövde, gölge
  function kandil(b, o, x, y){ R(b, x - 1, y, 3, 1, '#a07a3c'); px(b, x, y + 1, '#7d5d2e'); if(o.gece) isik(b, x, y - 2, 9, '!#f1b860', 0.3); }

  /* ---------- SPRİTLER (kare çizer; harf → renk P_SABIT ya da sahnenin paleti) ---------- */
  const P_SABIT = { a:'#7a4e32', m:'#3a2618', k:'#2f2a2a', h:'#7a2f2a', s:'#c99a78', c:'#3c4a68', C:'#2a3550', w:'#a8743c', y:'!#ffe7a0', o:'!#f39a44', r:'!#c4482c' };
  const POZ = {
    at:{ k:[
      ['........m.', '.......maa', 'm.....am..', 'maaaaaaa..', '.aaaaaaa..', '.a.a..a.a.', '.a.a..a.a.'],
      ['..........', '..........', 'm.........', 'maaaaaam..', '.aaaaaaaa.', '.a.a..a.aa', '.a.a..a..a']] },
    /* 2026-11-18e: atlı bir boy büyük, börk kırmızı (ufukta okunur); kervana önde yürüyen kervancı */
    atli:{ k:[['...h.....', '...k...k.', '..kk..kkk', 'kkkkkkkk.', '.kkkkkk..', '.k.k..k.k'], ['...h.....', '...k...k.', '..kk..kkk', 'kkkkkkkk.', '.kkkkkk..', 'k..k...kk']] },
    yaya:{ k:[['.h.', '.s.', 'kkk', '.k.', '.k.', 'k.k'], ['.h.', '.s.', 'kkk', '.k.', '.k.', '.k.']] },
    deve:{ k:[
      ['kk.......', '.k...hh..', '.kk.hwhk.', '..kkkkkkk', '..k.k.k.k', '..k.k.k.k'],
      ['kk.......', '.k...hh..', '.kk.hwhk.', '..kkkkkkk', '...kk..kk', '...kk..kk']] },   // hörgücün üstünde kırmızı çul ve yük
    ozan:{ k:[['....hhh.....', '...hhhhh....', '....sss.....', '....sms...m.', '...cccc..m..', '..cCcccsm...', '..cCccwm....', '..cCcwww....', '..chhwwws...', '.cCccwww....', 'mCccccccccm.']] },
    kartal:{ k:[['k...k', '.kkk.'], ['kk.kk', '..k..']] },
    kus:{ k:[['k.k', '.k.'], ['kkk', '...']] },
    alev:{ k:[['..r..', '.rr..', '.ror.', 'royor', 'oyyyo', 'oyyyo'], ['.r...', '..rr.', '.ror.', 'royor', 'oyyyo', 'oyyyo'], ['...r.', '.rr..', '.orr.', 'royor', 'oyyyo', 'oyyyo']] },
  };
  const INSAN = ['ozan', 'atli'];
  /* tahtta oturan hakan (King divanı). 2026-11-19 (sahip: «Başbuğ'u kapkara bir siluet gibi yapma»): saygın bir Türk hükümdarı —
     altın sorguçlu ak börk (samur kenarlı), buğday tenli yüz (göz, sarkık bıyık), lacivert kaftan, al iç entari, altın yaka, düğme
     ve kuşak, eller dizlerde, sahtiyan çizme. Işık sağdan (tündük, mangal): gölge tonları solda. Harfler HAKAN_P'de. */
  const HAKAN = ['......y......', '.....kgk.....', '....kHhhk....', '...kHhhhhk...', '...kfffffk...', '...kSssssk...', '...kSesesk...', '...kSmmmsk...', '.....msm.....', '...kCgygck...',
    '.kCCcgygccck.', '.kCccgigccck.', '.kCccgygccck.', '.kGgggggggGk.', '.ssCcgigccss.', '.kCccgigccck.', '.kCccgigccck.', '..knnk.knnk..', '..kkkk.kkkk..'];
  const HAKAN_P = { k:'#1e1412', y:'#e8c872', g:'#c69a48', G:'#94682e', h:'#ece2cc', H:'#c4b496', f:'#4a3024', s:'#e2b48a', S:'#b98a64', e:'#2a1a14', m:'#3a2418',
    c:'#2c5585', C:'#1e3a62', i:'#b8352f', n:'#5a3020' };

  /* ---------- HAREKET: al(s, t) saf saatten küçük bir durum verir; ciz yalnız o durumu çizer ---------- */
  const nk = (g, x, y, c, w, h) => { g.fillStyle = ton(c); g.fillRect(x, y, w || 1, h || 1); };
  function sprG(g, x, y, k, pal, ters, z){ z = z || 1; const w = k[0].length; for(let j = 0; j < k.length; j++) for(let i = 0; i < w; i++){ const ch = k[j][ters ? w - 1 - i : i]; if(ch !== '.') nk(g, x + i * z, y + j * z, (pal && pal[ch]) || P_SABIT[ch], z, z); } }
  const kesir = v => v - Math.floor(v);
  const dongu = (t, T) => (((t % T) + T) % T) / T;
  const HAREKET = {
    duman:{ al:(s, t) => Math.floor(t * 2), ciz(g, s, k){ for(let i = 0; i < 5; i++){ const p = kesir(k / 2 / s.T + i / 5), y = s.y - Math.round(p * s.L), x = s.x + Math.round(p * p * s.L * 0.7 + Math.sin(p * 9 + i * 2) * 0.6); g.globalAlpha = Math.ceil((1 - p) * 3) / 4; nk(g, x, y, s.c, p > 0.35 ? 2 : 1, 1); } g.globalAlpha = 1; } },
    bayrak:{ al:(s, t) => Math.floor(t * 3) % 4, ciz(g, s, k){ for(let i = 0; i < s.w; i++){ const f = i * 1.2 - k * Math.PI / 2, d = Math.round(Math.sin(f) * (i / s.w) * 1.2); nk(g, s.x + i, s.y + d, Math.cos(f) < -0.3 ? s.c[1] : s.c[0], 1, s.h); } if(s.ay) [[3, -2], [2, -1], [2, 0], [2, 1], [3, 2], [5, 0]].forEach(([i, j]) => { if(i < s.w) nk(g, s.x + i, s.y + Math.round(Math.sin(i * 1.2 - k * Math.PI / 2) * (i / s.w) * 1.2) + (s.h >> 1) + j, '#f4ece0'); }); } },   // al bayrak: ay (açığı uca bakar) ve yıldız
    tug:{ al:(s, t) => Math.floor(t * 2) % 4, ciz(g, s, k){ const d = [0, 1, 0, -1][k]; for(let j = 0; j < s.L; j++) nk(g, s.x + Math.round(d * j / s.L) - (j > s.L * 0.3 ? 1 : 0), s.y + j, s.c[j % 3 === 2 ? 1 : 0], j > s.L * 0.3 ? 3 : 1, 1); } },
    yildiz:{ al:(s, t) => { const k = Math.floor(t / 0.9); return s.l.map((_, i) => (hash(i + 1, (k % 997) + s.s) > 0.75 ? 1 : 0)).join(''); },
      ciz(g, s, k){ s.l.forEach((q, i) => nk(g, q[0], q[1], k[i] === '1' ? YILDIZ[0] : YILDIZ[2])); } },
    kayan:{ al:(s, t) => { const p = dongu(t, s.T) * s.T; return p < 0.9 ? Math.floor(p * 10) : -1; },
      ciz(g, s, k){ if(k < 0) return; for(let i = 0; i < 4; i++) if(k - i >= 0){ g.globalAlpha = 1 - i * 0.24; nk(g, s.x - (k - i) * 2, s.y + (k - i), '!#e6ebf6'); } g.globalAlpha = 1; } },
    atli:{ al:(s, t) => { const p = dongu(t, s.T); if(p > s.yol) return '-'; return Math.round(s.x0 + (s.x1 - s.x0) * p / s.yol) + ',' + (Math.floor(t * 4) % 2); },
      ciz(g, s, k){ if(k === '-') return; const q = k.split(','); sprG(g, +q[0], s.y, POZ.atli.k[+q[1]], { k:s.c }, s.x1 < s.x0); } },
    kervan:{ al:(s, t) => Math.round(s.x0 + (s.x1 - s.x0) * dongu(t, s.T)) + ',' + (Math.floor(t * 2.5) % 2),
      ciz(g, s, k){ const q = k.split(','), x = +q[0]; for(let i = 0; i < s.n; i++){ const xx = x + i * 11; if(xx > s.dur - 2 && xx < s.x0 + 2) sprG(g, xx, s.y, POZ.deve.k[(+q[1] + i) % 2], { k:s.c }, false); } if(x - 5 > s.dur - 2 && x - 5 < s.x0 + 2) sprG(g, x - 5, s.y, POZ.yaya.k[+q[1]], { k:s.c }); } },
    kartal:{ al:(s, t) => { const a = t / s.T * Math.PI * 2; return Math.round(s.x + Math.cos(a) * s.r) + ',' + Math.round(s.y + Math.sin(a) * s.r * 0.32) + ',' + (Math.floor(t * 1.5) % 6 === 0 ? 0 : 1); },
      ciz(g, s, k){ const q = k.split(','); sprG(g, +q[0] - 2, +q[1], POZ.kartal.k[+q[2]], { k:s.c }); } },
    kus:{ al:(s, t) => { const p = dongu(t, s.T); if(p > s.yol) return '-'; const f = p / s.yol; return Math.round(s.x0 + (s.x1 - s.x0) * f) + ',' + Math.round(s.y + Math.sin(f * 7) * 1.2) + ',' + (Math.floor(t * 3) % 2); },
      ciz(g, s, k){ if(k === '-') return; const q = k.split(','); (s.v ? [[0, 0], [4, -2], [4, 2], [8, -4], [8, 4]] : [[0, 0], [5, -2], [9, 1]]).slice(0, s.n).forEach((d, i) => sprG(g, +q[0] + d[0], +q[1] + d[1], POZ.kus.k[(+q[2] + i) % 2], { k:s.c })); } },
    at:{ al:(s, t) => (hash(Math.floor(t / 7), s.s) > 0.4 ? 1 : 0), ciz(g, s, k){ sprG(g, s.x, s.y, POZ.at.k[k], s.pal, s.ters); } },
    alev:{ al:(s, t) => Math.floor(t * 6) % 3, ciz(g, s, k){ sprG(g, s.x, s.y, POZ.alev.k[k], null, false, s.z); } },
    kivilcim:{ al:(s, t) => Math.floor(t * 4), ciz(g, s, k){ for(let i = 0; i < 3; i++){ const p = kesir(k / 4 / 2.6 + i / 3); if(p < 0.85) nk(g, s.x + Math.round(Math.sin(p * 7 + i * 2) * 1.5), s.y - Math.round(p * s.L), p < 0.5 ? '!#ffc677' : '!#c6683a'); } } },
    su:{ al:(s, t) => Math.floor(t * 6) % 3, ciz(g, s, k){ for(let j = 0; j < s.L; j++) nk(g, s.x, s.y + j, (j + k) % 3 === 0 ? s.c[1] : s.c[0]); nk(g, s.x - 1 + (k % 2) * 2, s.y + s.L - 1, s.c[1]); } },
    parilti:{ al:(s, t) => Math.floor(t * 1.2), ciz(g, s, k){ for(let i = 0; i < s.n; i++) nk(g, s.x + Math.floor(hash(k * 7 + i, s.s) * s.w), s.y + Math.floor(hash(k * 13 + i, s.s + 1) * s.h), s.c, 2, 1); } },
    toz:{ al:(s, t) => Math.floor(t * 2), ciz(g, s, k){ g.globalAlpha = 0.7; for(let i = 0; i < s.n; i++){ const p = kesir(k / 2 / s.T + i / s.n); nk(g, s.x + Math.round(hash(i, s.s) * s.w + Math.sin(p * 6 + i) + p * s.kay), s.y + Math.round(p * s.h), s.c); } g.globalAlpha = 1; } },
    /* süzülen ışık (2026-11-19, Öğren): l = [ilk satır, son satır, sol x, sağ x, sol eğim, sağ eğim, saydamlık]; satır başına x − d·eğim.
       Gündüz yavaş nefes (T saniyede 12 adım), gece (titre) kandil titremesi. Yere (yer satırından sonra) düşen kısım bir kat parlak. */
    huzme:{ al:(s, t) => (s.titre ? Math.floor(t * 4) : Math.floor(t / s.T * 12) % 12),
      ciz(g, s, k){ const f = s.titre ? 0.75 + 0.25 * hash(k, s.s) : 0.78 + 0.22 * Math.sin(k / 6 * Math.PI);
        g.globalCompositeOperation = 'screen';   // ışık aydınlatır, griye boğmaz (koyu eyvanda çamur rengi çıkıyordu)
        s.l.forEach(([ya, yb, a0, a1, k0, k1, al]) => { for(let y = ya; y < yb; y++){ const d = y - ya, x0 = Math.round(a0 - d * k0), x1 = Math.round(a1 - d * k1); if(x1 <= x0) continue; g.globalAlpha = al * f * Math.min(1, (d + 1) / (s.fi || 1)) * (y >= s.yer ? 1.8 : 1); nk(g, x0, y, s.c, x1 - x0, 1); } });
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } },
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
        const { W, H } = o, z = o.ufuk, s = Math.max(4, Math.round(H * 0.1)), ox = Math.round(W * 0.7), oy = z + Math.round((H - z) * 0.42);
        o.p = { s, ox, oy };
        /* gece otağın önünde (solunda) küçük ateş: sahnenin odağı ışıkla okunur (sahip: «otağ minicik ve karanlık») */
        if(o.lamba){ const fx = ox - Math.round(s * 1.6) - Math.max(3, Math.round(s * 0.3)), fy = oy + Math.max(2, Math.round(s * 0.35)); o.p.ates = [fx, fy]; o.sakin.push({ tur:'alev', x:fx - 2, y:fy - 6, z:1 }); o.sakin.push({ tur:'kivilcim', x:fx, y:fy - 7, L:Math.round(H * 0.12) }); }
        dumanEkle(o, ox, oy - s - Math.round(s * 0.85) - 2, Math.round(H * 0.16));
        const tx = ox + Math.round(s * 1.6) + Math.max(3, Math.round(s * 0.6)), th = Math.round(s * 2.4);
        o.p.tug = [tx, oy, th];
        o.sakin.push({ tur:'tug', x:tx, y:oy - th + 1, L:Math.max(3, Math.round(th * 0.32)), c:['#2c2724', '#5c5048'] });
        /* güne göre: iki ile dört at (yer ve don), kimi gün koyun sürüsü */
        const AT = [[0.53, 0.66], [0.86, 0.28, 1], [0.92, 0.78], [0.82, 0.6, 1], [0.6, 0.86]], n = 2 + Math.floor(o.r() * 3), bas = Math.floor(o.r() * 5);
        for(let i = 0; i < n; i++){ const a = AT[(bas + i) % 5]; atEkle(o, W * a[0], z + (H - z) * a[1], Math.floor(o.r() * 4), a[2]); }
        if(o.mev !== 'kis' && o.r() < 0.5) o.p.suru = [0.56 + o.r() * 0.3, 0.45 + o.r() * 0.3];
        o.sakin.push({ tur:'atli', x0:W + 6, x1:Math.round(W * 0.56), y:z - 4, T:80, yol:(W * 0.44 + 6) / 3 / 80, faz:Math.round(o.r() * 80), c:karis('#3a3433', o.hz, 0.3) });
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.pus;
        sirt(b, { ard:1, y:z, amp:H * 0.15, f:0.016, s:3, c:karis('#5f5f84', hz, 0.5), i:karis('#a28fa2', hz, 0.42) }); kat(b, 1);
        sirt(b, { y:z + 1, amp:H * 0.06, f:0.03, s:9, c:karis('#857a5e', hz, 0.3) });
        kat(b, 2); zemin(b, z + Math.round(H * 0.02), ['#ab966a', '#9c885f', '#8b7954', '#786a4a'], 4);
        otlar(b, o, z + (H - z) * 0.4, Math.round(W / 9), '#675b3f', 2);
        otag(b, o, Math.round(W * 0.6), z + 2, Math.max(2, Math.round(p.s * 0.36)), 0.42);   // obanın öbür ucu: gece kapısı yanar, odak tek otağa sıkışmaz
        otag(b, o, Math.round(W * 0.88), z + 3, Math.max(2, Math.round(p.s * 0.42)), 0.35);
        otag(b, o, Math.round(W * 0.95), z + 2, Math.max(2, Math.round(p.s * 0.32)), 0.42);
        if(p.suru) suru(b, W * p.suru[0], W * (p.suru[0] + 0.1), z + (H - z) * p.suru[1], z + (H - z) * (p.suru[1] + 0.14), 8, tohum(o.gun));
        otag(b, o, p.ox, p.oy, p.s, 0);
        direk(b, p.tug[0], p.tug[1], p.tug[2], '#4a3c30');
        const kx = Math.round(W * 0.55), ky = p.oy + 3; dikiliTas(b, kx, ky, Math.round(p.s * 1.7)); [8, 12, 16].forEach(d => balbal(b, kx - d, ky + 1));   // kitabe ve balbal dizisi
        gokSancak(b, p.tug[0] + 9, p.oy, Math.round(p.s * 3));
        if(p.ates) ocak(b, p.ates[0], p.ates[1], Math.round(H * 0.13));
      } },

    /* Plan: sabah ufku — ufka uzanan yol, kilometre taşları */
    ufuk:{ gok:'sabah', ufuk:0.58, gyy:0.5,
      yer(o){
        const { W, H } = o;
        o.p = { vx:Math.round(W * 0.74), bx:Math.round(W * 0.6), bw:Math.round(W * 0.09) };
        o.sakin.push({ tur:'kus', x0:W + 4, x1:Math.round(W * 0.55), y:Math.round(H * (0.24 + o.r() * 0.1)), n:2 + Math.floor(o.r() * 2), T:70, yol:0.6, faz:25, c:o.gece ? '#1e2236' : '#4c4a52' });
        if(o.r() < 0.5) o.sakin.push({ tur:'atli', x0:W + 6, x1:Math.round(W * 0.5), y:o.ufuk - 4, T:90, yol:(W * 0.5 + 6) / 3 / 90, faz:Math.round(o.r() * 90), c:karis('#3a3433', o.hz, 0.3) });
        if(o.gece){ yildizEkle(o); o.sakin.push({ tur:'kayan', x:Math.round(W * 0.9), y:Math.round(H * 0.12), T:41, faz:20 }); }
        const bx = Math.round(W * 0.82), by = o.ufuk + Math.round((H - o.ufuk) * 0.45), bh = Math.round(H * 0.3); o.p.bay = [bx, by, bh];
        o.sakin.push({ tur:'bayrak', x:bx + 1, y:by - bh, w:Math.max(7, Math.round(H * 0.1)), h:Math.max(5, Math.round(H * 0.06)), ay:true, c:['#c8302c', '#962622'] });
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.pus;
        sirt(b, { ard:1, y:z, amp:H * 0.05, f:0.02, s:21, c:karis('#6c7889', hz, 0.58) }); kat(b, 1);
        kat(b, 2); zemin(b, z + 1, ['#a4a57a', '#93976f', '#828763', '#707656'], 22);
        for(let y = z + 1; y < H; y++){
          const f = (y - z) / (H - z), cx = p.vx + (p.bx - p.vx) * f, hw = 0.4 + f * p.bw;
          for(let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++){ const q = Math.abs(x - cx) / hw; px(b, x, y, q > 0.86 ? '#9f8c69' : Math.abs(q - 0.45) < 0.12 && bay(x, y) < 0.7 ? '#a8936e' : f < 0.4 ? '#cdb994' : '#bea983'); }
        }
        [0.12, 0.3, 0.55, 0.88].forEach(f => { const y = Math.round(z + (H - z) * f), x = Math.round(p.vx + (p.bx - p.vx) * f + 0.4 + f * p.bw + 2 + f * 6), h = Math.max(1, Math.round(1 + f * 7)), w = Math.max(1, Math.round(1 + f * 3)); R(b, x, y - h, w, h, '#a39a86'); R(b, x + Math.ceil(w / 2), y - h, Math.floor(w / 2), h, '#d2c9b4'); if(w > 2) R(b, x + 1, y - h - 1, w - 2, 1, '#c2b9a4'); });
        otag(b, o, p.vx + Math.round(W * 0.035), z + 1, Math.max(2, Math.round(H * 0.035)), 0.4);   // yolun ucunda konak: gece kapısı yanar
        agac(b, Math.round(W * 0.9), Math.round(z + (H - z) * 0.32), Math.round(H * 0.2), 24, ['#6a5644', '#4d3e33']);   // yalnız karaağaç (eskiden lolipop gibi yuvarlaktı)
        direk(b, p.bay[0], p.bay[1], p.bay[2]); R(b, p.bay[0] - 1, p.bay[1], 3, 1, '#6a5644');
      } },

    /* Tarih: sırtta kale — burçlar, bayrak, süzülen kartal */
    kale:{ gok:'gun', ufuk:0.66, gyy:0.28, gx:0.86, gxt:0.5,
      yer(o){
        const { W, H } = o, xa = Math.round(W * 0.5);
        const tepe = x => o.ufuk - H * 0.26 * sm(kis((x - xa) / (W * 0.3), 0, 1)) + (g1(x * 0.08, 41) - 0.5) * H * 0.04;
        const kx = Math.round(W * 0.64), kh = Math.round(H * 0.22), ky = Math.round(tepe(kx)) - kh, bh = Math.max(4, Math.round(H * 0.1));
        o.p = { xa, tepe, kule:[[kx, kh], [Math.round(W * 0.8), Math.round(H * 0.13)], [Math.round(W * 0.95), Math.round(H * 0.15)]], direk:[kx + 2, ky, bh] };
        o.sakin.push({ tur:'bayrak', x:kx + 3, y:ky - bh, w:Math.max(7, Math.round(H * 0.1)), h:Math.max(5, Math.round(H * 0.06)), ay:true, c:['#c8302c', '#962622'] });
        o.sakin.push({ tur:'kartal', x:Math.round(W * 0.78), y:Math.round(H * 0.26), r:Math.round(W * 0.05), T:26, c:o.gece ? '#1b2033' : '#3b3634' });
        if(o.lamba){ const [x, h] = o.p.kule[1]; o.p.isaret = [x, Math.round(tepe(x)) - h - 3]; o.sakin.push({ tur:'mum', x, y:o.p.isaret[1], s:41 }); }   // burçta nöbet ateşi
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.pus;
        sirt(b, { ard:1, y:z, amp:H * 0.12, f:0.014, s:31, c:karis('#6b7a8d', hz, 0.62), i:karis('#94a1b0', hz, 0.56) }); kat(b, 1);
        sirt(b, { y:z + 2, amp:H * 0.05, f:0.03, s:33, c:karis('#6f7b62', hz, 0.3) });
        kat(b, 2); zemin(b, z + Math.round(H * 0.04), ['#8d9670', '#7f8966', '#717c5c', '#626e51'], 34);
        for(let x = 0; x < W * 0.5; x++){ const y = Math.round(z + H * 0.1 + Math.sin(x * 0.05) * 2 + x * 0.08); px(b, x, y, o.gece ? (hash(x, 45) > 0.86 ? '!#c8d0e4' : '!#6f7ca6') : '#a9b9bb'); px(b, x, y + 1, '#5f6b4e'); }   // gece ırmakta ay
        for(let x = p.xa - 4; x < W; x++){
          const h = Math.round(p.tepe(x)), e = p.tepe(x + 1) - p.tepe(x - 1);
          /* kaya katmanları: dalgalı yatay tabakalar, üst yüzü ışık alan çıkıntılar, seyrek koyu yarıklar (eski çapraz çizgiler taranmış gibiydi) */
          for(let y = h, ay = Math.min(H, Math.round(z + (z - h) * 1.5)); y < ay; y++){
            const q = y + g1(x * 0.06, 44) * 5, kat = Math.floor(q / 4), ust = q - kat * 4 < 1, yar = hash(kat, Math.floor((x + kat * 5) / 11));
            px(b, x, y, y - h < 2 && e < -0.2 ? '#a99d84' : y > z + H * 0.1 ? (MEV === 'kis' ? '#c4cac8' : '#6f7356') : ust && yar > 0.35 ? '#a3967c' : !ust && q - kat * 4 < 2 && yar > 0.35 ? '#776d5c' : '#8b806b');
          }
        }
        if(MEV !== 'kis'){ const r = tohum(46); for(let i = 0; i < W * 0.6; i++){ const x = Math.round(p.xa + r() * (W - p.xa)), y = Math.round(z + H * 0.1 + 2 + r() * (H - z - H * 0.1 - 2)); R(b, x, y, 1 + Math.floor(r() * 3), 1, '#626e51'); if(r() < 0.5) px(b, x + 1, y - 1, '#7f8966'); } }   // eteğin yeşil yamacında öbek
        const wh = Math.max(3, Math.round(H * 0.07)), xa = Math.round(W * 0.62);
        /* sur: kesme taş sıraları (yatay derz, şaşırtmalı dikey derz), dendan, yürüme yolunun gölgesi, kayaya oturduğu yerde koyuluk */
        for(let x = xa; x < W; x++){ const t = Math.round(p.tepe(x)) - wh + 1; R(b, x, t, 1, wh + 1, '#c0ae8a'); for(let y = t + 4, n = 0; y < t + wh; y += 2, n++) if(n % 2 === 0 || (x + n * 2) % 5 === 0) px(b, x, y, '#b19f7c'); if((x - xa) % 3 === 2) px(b, x, t, '#8d7d62'); px(b, x, t + 2, '#a8977a'); px(b, x, t + wh, '#8f8066'); }
        p.kule.forEach(([x, h], i) => {
          const tw = Math.max(5, Math.round(H * (i === 0 ? 0.09 : 0.07))), x0 = x - (tw >> 1), y0 = Math.round(p.tepe(x)) - h;
          R(b, x0, y0, tw, h + 2, '#c8b792'); R(b, x0, y0, Math.round(tw * 0.38), h + 2, '#9e8e72');
          for(let i2 = -1; i2 <= tw; i2 += 2) R(b, x0 + i2, y0 - 2, 1, 2, i2 < tw * 0.38 ? '#9e8e72' : '#c8b792');
          R(b, x0 - 1, y0, tw + 2, 1, '#8f8066');
          /* 2026-11-18e burç: taş sıraları ışıkta ve gölgede ayrı tonla, dendan altında konsollar, güneş yanında ışık kenarı, eteğinde şev */
          const gx = x0 + Math.round(tw * 0.38);
          for(let y = y0 + 3, n = 0; y < y0 + h + 1; y += 3, n++){ R(b, x0, y, tw, 1, '#b5a37e'); R(b, x0, y, gx - x0, 1, '#8c7d63'); for(let xx = x0 + (n % 2 ? 1 : 3); xx < x0 + tw; xx += 4) px(b, xx, y + 1, xx < gx ? '#8c7d63' : '#b5a37e'); }
          for(let xx = x0; xx < x0 + tw; xx += 2) px(b, xx, y0 + 1, '#8f8066');
          if(!o.gece) R(b, x0 + tw - 1, y0 + 2, 1, h - 1, '#dccba4');
          R(b, x0 - 1, y0 + h - 1, tw + 2, 3, '#b5a37e'); R(b, x0 - 1, y0 + h - 1, gx - x0 + 1, 3, '#8c7d63');
          for(let j = y0 + 3; j < y0 + h - 2; j += Math.max(4, Math.round(h / 3))) { if(o.lamba) isik(b, x0 + (tw >> 1), j + 1, 4, '!#e9a95a', 0.24); R(b, x0 + (tw >> 1), j, 1, 2, o.lamba ? '!#e9a95a' : '#3c3430'); }
        });
        direk(b, p.direk[0], p.direk[1], p.direk[2]);
        if(p.isaret) isik(b, p.isaret[0], p.isaret[1] - 1, Math.round(H * 0.08), '!#f0a050', 0.32);
      } },

    /* Felsefe, Öğren: Semerkant medresesi — pîştak, firuze kubbe, iki minare; gece hücrelerde kütüphane ışığı */
    medrese:{ gok:'gun', ufuk:0.82, gyy:0.3, gx:0.9,
      yer(o){
        const { W, H } = o;
        o.p = { x:Math.round(W * 0.68), w:Math.max(14, Math.round(H * 0.34)), h:Math.round(H * 0.6) };
        o.sakin.push({ tur:'kus', x0:Math.round(W * 0.98), x1:Math.round(W * 0.56), y:Math.round(H * 0.22), n:2 + Math.floor(o.r() * 2), T:50, yol:0.5, faz:8, c:o.gece ? '#1b2033' : '#4a4644' });
        if(o.gece) yildizEkle(o);
        /* 2026-11-19 (sahip: «Öğren'e tıkladığımda orada ışıklar süzülsün»): gündüz güneşten avluya yelpaze huzmeler ve eyvanın
           mukarnasından kapıya inen huzme, içlerinde süzülen toz; gece eyvanda asma kandilin konisi, yanan hücrelerden avluya ışık. */
        const z = o.ufuk, aw = Math.round(o.p.w * 0.56), ah = Math.round(o.p.h * 0.78), ax = o.p.x - (aw >> 1), cx = ax + Math.round(aw * 0.62);
        o.p.kandil = [o.p.x, z - Math.round(ah * 0.6)];
        if(!o.lamba){
          const [sx, sy] = o.gy, l = [];
          if(!o.kapali && sy < z - 12) [[0.42, 0.035], [0.62, 0.05], [0.84, 0.03], [1.02, 0.055], [1.2, 0.035], [1.34, 0.025]].forEach(([a, d], i) => { const ya = Math.round(sy + o.gr * 2.5), ta = Math.tan(a + d), tb = Math.tan(a - d), h = ya - sy; l.push([ya, z + Math.round((H - z) * 0.7), sx - h * ta, sx - h * tb, ta, tb, i % 2 ? 0.08 : 0.12]); });
          const ic = [z - Math.round(ah * 0.8), z - 1, cx, cx + Math.max(2, Math.round(aw * 0.14)), aw * 0.4 / (ah * 0.8), aw * 0.3 / (ah * 0.8), 0.36];
          const c = o.isik && o.isik.if > 0.05 ? '!' + karis('#fff0c8', o.isik.i, Math.min(0.6, o.isik.if)) : '!#fff0c8';
          if(l.length) o.sakin.push({ tur:'huzme', l, c, T:9, fi:8, yer:z });
          o.sakin.push({ tur:'huzme', l:[ic], c:'!#dce8ff', T:7, fi:6, yer:z, faz:3 });
          o.sakin.push({ tur:'toz', x:ax + Math.round(aw * 0.25), y:ic[0] + 2, w:Math.round(aw * 0.4), h:ic[1] - ic[0] - 3, kay:-Math.round(aw * 0.3), n:4, T:15, s:57, c:'!#fff4d8' });
          if(l.length > 1){ const t = Math.tan(0.74), y = z - Math.round(H * 0.24), x = Math.round(sx - (y - sy) * t); o.sakin.push({ tur:'toz', x:x - 4, y, w:8, h:Math.round(H * 0.24), kay:-Math.round(H * 0.24 * t), n:6, T:20, s:59, c:'!#fff4d8' }); }
        } else {
          const [kx, ky] = o.p.kandil, l = [[ky + 2, z - 1, kx - 1, kx + 2, 0.42, -0.42, 0.36], [ky + 3, z - 1, kx, kx + 1, 0.18, -0.18, 0.3]], kh = Math.round(o.p.h * 0.52), cw = Math.max(3, Math.round(kh * 0.22)), x0 = o.p.x - (o.p.w >> 1), x1 = x0 + o.p.w;
          [[Math.round(W * 0.47), x0], [x1, Math.min(W, x1 + Math.round(o.p.w * 0.9))]].forEach(([xa, xb]) => { for(let x = xa + 2; x < xb - cw; x += cw + 2) if(hash(x, z - 2) > 0.45) l.push([z, z + Math.round((H - z) * 0.4), x, x + cw, 0.25, -0.25, 0.24]); });   // kanat(): aynı hücreler yanar
          o.sakin.push({ tur:'huzme', l, c:'!#ffa848', titre:1, s:53, fi:2, yer:H });
          o.sakin.push({ tur:'toz', x:kx - 4, y:ky + 4, w:8, h:z - ky - 6, kay:0, n:4, T:18, s:61, c:'!#ffd890' });
        }
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.pus, r = tohum(55);
        for(let x = 0; x < W; x++){ const h = Math.round(z - H * 0.12 - g1(x * 0.2, 51) * H * 0.05 * (x % 9 < 6 ? 1 : 0.4)); R(b, x, h, 1, z - h, karis('#b9a888', hz, 0.55)); } kat(b, 1);
        for(let i = 0; i < 6; i++){ const x = Math.round(W * (0.06 + r() * 0.42)), h = Math.round(H * (0.14 + r() * 0.08)); for(let j = 0; j < h; j++) R(b, x - (j > 1 && j < h - 2 ? 1 : 0), z - H * 0.1 - j, j > 1 && j < h - 2 ? 3 : 1, 1, karis('#6c7a5a', hz, 0.45)); }
        kat(b, 2); R(b, 0, z, W, H - z, '#cdb995');
        for(let y = z + 2, n = 0; y < H; y += 3, n++){ R(b, 0, y, W, 1, '#bba782'); const a = 4 + n * 2; if(n) for(let x = (n * 5) % a; x < W; x += a) if(x > W * 0.4) px(b, x, y - 1, '#bba782'); }   // döşeme taşı: öne doğru büyüyen şaşırtmalı derz (sol sakin)
        const kanat = (xa, xb, kh) => {
          R(b, xa, z - kh, xb - xa, kh, '#c4a274'); R(b, xa, z - kh, xb - xa, 1, '#3a8f98'); R(b, xa, z - kh + 1, xb - xa, 1, '#2c5585');
          for(let y = z - kh + 4, n = 0; y < z; y += 2, n++) for(let x = xa + (n % 2) * 2; x < xb; x += 4) px(b, x, y, '#b8956a');   // tuğla örgüsü (şaşırtmalı derz)
          R(b, xa, z - kh + 2, xb - xa, 1, '#9c7c56');   // saçak gölgesi
          const aw = Math.max(3, Math.round(kh * 0.22)), ah = Math.round(kh * 0.36);
          for(let x = xa + 2; x < xb - aw; x += aw + 2) for(const yb of [z - 2, z - ah - 4]){ const yak = o.lamba && hash(x, yb) > 0.45; R(b, x - 1, yb - ah, aw + 2, ah + 1, '#ad8a5e'); kemer(b, x, yb, aw, ah, yak ? '!#e6b05a' : '#5a4632'); if(!yak) R(b, x + aw - 1, yb - Math.round(ah * 0.55), 1, Math.round(ah * 0.55) + 1, '#46362a'); if(yak && yb === z - 2) isik(b, x + aw / 2, z, aw + 2, '!#e6b05a', 0.3, true); if(!yak) R(b, x, yb - Math.round(ah * 0.5), aw, 1, '#6d5740'); }
        };
        const x0 = p.x - (p.w >> 1), x1 = x0 + p.w, kh = Math.round(p.h * 0.52);
        kanat(Math.round(W * 0.47), x0, kh); kanat(x1, Math.min(W, x1 + Math.round(p.w * 0.9)), kh);
        const dx = x1 + Math.round(p.w * 0.38), dr = Math.round(p.w * 0.44), dy = z - Math.round(p.h * 0.72);
        R(b, dx - dr + 2, dy, dr * 2 - 3, Math.round(p.h * 0.2), '#2f6f86'); R(b, dx - dr + 2, dy + 1, dr * 2 - 3, 1, '#c4a274');
        for(let j = 0; j < Math.round(dr * 1.15); j++){ const t = j / (dr * 1.15), w = Math.round(dr * Math.sqrt(1 - t * t) * (1 + 0.12 * Math.sin(t * 3))); for(let i = -w; i <= w; i++) px(b, dx + i, dy - 1 - j, (i + 99) % 3 === 0 ? '#2b7a8a' : i > w * 0.25 ? '#74c3c0' : i < -w * 0.4 ? '#2f7d8c' : '#3ea0a8'); }
        R(b, dx, dy - Math.round(dr * 1.15) - 2, 1, 3, '#d8b456');
        if(p.h * 0.2 >= 8) [-0.45, 0.45].forEach(f => yildiz8(b, dx + Math.round(dr * f), dy + Math.round(p.h * 0.1) + 1, '#1e3a62', '#e8dcc0'));   // kasnakta Selçuklu yıldızı
        R(b, x0, z - p.h, p.w, p.h, '#c9a776'); R(b, x0, z - p.h, Math.round(p.w * 0.18), p.h, '#a8875c');
        R(b, x0 + 1, z - p.h + 1, p.w - 2, 1, '#2c5585'); R(b, x0 + 1, z - p.h + 1, 1, p.h - 1, '#2c5585'); R(b, x1 - 2, z - p.h + 1, 1, p.h - 1, '#2c5585');
        for(let y = z - p.h + 3; y < z; y += 2){ px(b, x0 + 2, y, '#3ea0a8'); px(b, x1 - 3, y, '#3ea0a8'); }
        for(let x = x0 + 3; x < x1 - 3; x += 2) px(b, x, z - p.h + 2, '#3ea0a8');
        const aw = Math.round(p.w * 0.56), ah = Math.round(p.h * 0.78), ax = p.x - (aw >> 1);
        R(b, ax - 1, z - ah - 2, aw + 2, ah + 2, '#2c5585');
        kemer(b, ax, z - 1, aw, ah, '#22324c'); kemer(b, ax + 2, z - Math.round(ah * 0.45), aw - 4, Math.round(ah * 0.5), '#2f4565');
        /* 2026-11-18e: köşeliklerde (kemerle çerçeve arası) firuze-lacivert çini örgüsü; üstte beyaz yazılı kitabe kuşağı;
           kemerin başında mukarnas (basamaklı küçük hücreler, üstü ışık altı gölge); kemer içi sağdan gölgeli (güneş sağda, iç duvar gölgede) */
        for(let y = z - p.h + 4; y < z - ah - 2; y++) for(let x = x0 + 4; x < x1 - 4; x++) if((x + y) % 4 === 0 || (x - y + 400) % 4 === 0) px(b, x, y, (x + y) % 8 === 0 ? '#3ea0a8' : '#2c5585');
        const kb = z - p.h + 3, kh3 = Math.max(3, Math.round(p.h * 0.08)); R(b, x0 + 3, kb, p.w - 6, kh3, '#1e3a62'); for(let x = x0 + 5; x < x1 - 5; x++) if(hash(x, 7) > 0.45 || x % 3 === 0) px(b, x, kb + 1 + (hash(x, 8) > 0.6 ? 1 : 0), '#e8dcc0');
        mukarnas(b, ax + aw / 2, z - 1, aw, ah, ['#5a7aa0', '#3e5b80', '#1a263a']);
        const kw = Math.max(2, Math.round(aw * 0.36)), kh2 = Math.round(ah * 0.36);
        kemer(b, p.x - (kw >> 1), z - 1, kw, kh2, o.lamba ? '!#efc06a' : '#16202f');
        if(!o.lamba){ R(b, p.x, z - kh2 + 2, 1, kh2 - 2, '#2a3a52'); px(b, p.x - 2, z - (kh2 >> 1), '#c69a48'); px(b, p.x + 2, z - (kh2 >> 1), '#c69a48'); }   // ahşap kapı: iki kanat, pirinç tokmak
        R(b, x0 - 1, z, p.w + 2, 1, '#a89470'); R(b, Math.round(W * 0.47), z, x0 - Math.round(W * 0.47), 1, '#b8a47e');   // binanın yere oturduğu çizgi
        if(o.lamba){ isik(b, p.x, z - 2, Math.round(p.w * 0.55), '!#e2a352', 0.32); isik(b, p.x, z, Math.round(p.w * 0.6), '!#efc06a', 0.36, true); }
        if(o.lamba){ const [kx, ky] = p.kandil; R(b, kx, z - ah, 1, ky - z + ah - 1, '#6a5232'); R(b, kx - 1, ky - 1, 3, 1, '#a07a3c'); R(b, kx - 1, ky, 3, 1, '!#ffe7a0'); px(b, kx, ky + 1, '!#f39a44'); }   // eyvanda asma kandil (konisini sakin çizer)
        const minare = (x, h) => { const mw = Math.max(3, Math.round(p.w * 0.12)), se = z - Math.round(h * 0.82); R(b, x, z - h, mw, h, '#cfae7c'); R(b, x, z - h, 1, h, '#a8875c'); R(b, x + mw - 1, z - h, 1, h, '#e2c494');
          for(let y = z - h + 2; y < z - 2; y += 5){ R(b, x, y, mw, 1, '#3ea0a8'); if(y + 1 < z - 2) for(let i = (y >> 1) % 2; i < mw; i += 2) px(b, x + i, y + 1, '#2c5585'); }
          R(b, x - 1, se, mw + 2, 2, '#2c5585'); R(b, x - 1, se, mw + 2, 1, '#3ea0a8'); R(b, x, se + 2, mw, 1, '#8a6a46');   // şerefe ve altındaki gölge
          R(b, x - 1, z - h - 1, mw + 2, 2, '#2c5585'); R(b, x, z - h - 3, mw, 2, '#3ea0a8'); px(b, x + (mw >> 1), z - h - 4, '#d8b456'); };
        minare(x0 - Math.max(4, Math.round(p.w * 0.14)), Math.round(p.h * 1.05)); minare(x1 + 1, Math.round(p.h * 1.05));
      } },

    /* Akademik: çalışma odası — kitaplık, pencere, masa lambası */
    kitaplik:{ ic:true,
      yer(o){
        const { W, H } = o, wx0 = Math.round(W * 0.56), wx1 = Math.round(W * 0.74);
        o.p = { wx0, wx1, wy0:Math.round(H * 0.3), wy1:Math.round(H * 0.68), yz:Math.round(H * 0.82) };
        if(o.lamba) o.sakin.push({ tur:'mum', x:Math.round(W * 0.7), y:o.p.yz - Math.round(H * 0.14) - 4, s:3 });
        else o.sakin.push({ tur:'toz', x:wx0 - Math.round(W * 0.08), y:o.p.wy1, w:Math.round(W * 0.1), h:o.p.yz - o.p.wy1, kay:-4, n:5, T:14, s:5, c:'!#f4e2b4' });
      },
      ciz(b, o){
        const { W, H } = o, p = o.p, gc = o.gece;
        duvar(b, o, p.yz, gc ? '#a08a6c' : '#c2ae8e', gc ? '#8a7558' : '#ac9776', gc ? W * 0.7 : (p.wx0 + p.wx1) / 2);
        gunIsigi(b, o, p, gc ? '#a08a6c' : '#c2ae8e'); lambri(b, p.yz, Math.max(5, Math.round(H * 0.1)));
        R(b, 0, Math.round(H * 0.06), W, 1, '#8c7556');
        R(b, 0, p.yz, W, H - p.yz, '#6b4a34'); for(let y = p.yz + 2; y < H; y += 3) R(b, 0, y, W, 1, '#5d4030');
        R(b, 0, p.yz - 1, W, 1, '#4a3426');
        kilim(b, o, Math.round(W * 0.5), Math.round(W * 0.76), p.yz + 3, H - 2);
        R(b, p.wx0 - 2, p.wy0 - 2, p.wx1 - p.wx0 + 4, p.wy1 - p.wy0 + 4, '#5a4130');
        pencere(b, o, p.wx0, p.wy0, p.wx1, p.wy1, { uzak:'#7a8a96', minare:'#8a8a9a', cisim:true });
        R(b, Math.round((p.wx0 + p.wx1) / 2), p.wy0, 1, p.wy1 - p.wy0, '#5a4130'); R(b, p.wx0, Math.round((p.wy0 + p.wy1) / 2), p.wx1 - p.wx0, 1, '#5a4130');
        R(b, p.wx0 - 3, p.wy1 + 2, p.wx1 - p.wx0 + 6, 1, '#7a5a40');
        huzme(b, o, p.wx0, p.wx1, p.wy1 + 3, H, 0.6, 0.45, p.yz);
        { const x0 = Math.round(W * 0.752), x1 = Math.round(W * 0.788), y0 = Math.round(H * 0.3), y1 = Math.round(H * 0.44); R(b, x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2, '#c69a48'); R(b, x0, y0, x1 - x0, y1 - y0, gc ? '#a89878' : '#e8dcc0');
          const hy = y1 - 3; R(b, x0 + 2, hy, x1 - x0 - 4, 1, '#2a2420'); [0.35, 0.6].forEach(f => R(b, x0 + Math.round((x1 - x0) * f), y0 + 3, 1, hy - y0 - 3, '#2a2420')); px(b, x0 + 3, y0 + 4, '#2a2420'); }   // küçük hat levhası
        const rx = Math.round(W * 0.8), rw = W - rx, rt = Math.round(H * 0.1), raf = Math.max(6, Math.round(H * 0.16));
        R(b, rx, rt, rw, p.yz - rt, '#4e3627'); R(b, rx, rt, 2, p.yz - rt, '#6d4c36');
        for(let y = rt + raf; y <= p.yz; y += raf){ R(b, rx + 2, y - raf, rw - 2, 1, '#3a281c'); kitaplar(b, rx + 3, W - 1, y - 1, raf - 2, y + o.gun); R(b, rx + 2, y - 1, rw - 2, 1, '#7a5a40'); }   // her gözün tepesinde rafın gölgesi
        R(b, rx - 1, rt - 2, rw + 1, 2, '#6d4c36'); R(b, rx - 1, rt - 2, rw + 1, 1, '#7a5a40'); R(b, rx - 2, rt, 1, p.yz - rt, '#3a281c');   // korniş, dolabın duvara düşen gölgesi
        const mt = p.yz - Math.round(H * 0.14), mx0 = Math.round(W * 0.52), mx1 = Math.round(W * 0.77);
        R(b, mx0, mt, mx1 - mx0, 2, '#7d583c'); R(b, mx0, mt, mx1 - mx0, 1, '#9a7250'); R(b, mx0 + 2, mt + 2, 2, p.yz - mt - 2, '#5a3e2c'); R(b, mx1 - 4, mt + 2, 2, p.yz - mt - 2, '#5a3e2c');
        R(b, Math.round(W * 0.58), mt - 2, 8, 2, '#e8dfc8'); R(b, Math.round(W * 0.58) + 4, mt - 2, 1, 2, '#b8a888');
        kitaplar(b, Math.round(W * 0.54), Math.round(W * 0.54) + 4, mt, 5, 9 + o.gun);
        const lx = Math.round(W * 0.7); R(b, lx - 1, mt - 1, 3, 1, '#a07a3c'); R(b, lx, mt - 3, 1, 2, '#c49a50'); R(b, lx - 1, mt - 4, 3, 1, '#d8c8a0');
        if(o.lamba) isik(b, lx, mt - 4, Math.round(H * (gc ? 0.34 : 0.24)), '!#f2bd66', 0.38);
      } },

    /* Okuma ve yazı: hattat odası — rahle, divit, sivri kemerli pencere, kandil */
    hattat:{ ic:true,
      yer(o){
        const { W, H } = o;
        o.p = { wx0:Math.round(W * 0.72), wx1:Math.round(W * 0.86), wy0:Math.round(H * 0.2), wy1:Math.round(H * 0.62), yz:Math.round(H * 0.76) };
        if(o.lamba) o.sakin.push({ tur:'mum', x:Math.round(W * 0.56) + 2, y:o.p.yz - 6, s:7 });
        else o.sakin.push({ tur:'toz', x:o.p.wx0 - Math.round(W * 0.08), y:o.p.wy1, w:Math.round(W * 0.08), h:o.p.yz - o.p.wy1, kay:-3, n:4, T:16, s:9, c:'!#f6e4b8' });
      },
      ciz(b, o){
        const { W, H } = o, p = o.p, gc = o.gece, kag = gc ? '#bfb092' : '#ece3cc', mur = '#2a2420';
        duvar(b, o, p.yz, gc ? '#a48c6a' : '#cbb690', gc ? '#8c7454' : '#b39d78', gc ? W * 0.6 : (p.wx0 + p.wx1) / 2);
        if(!gc) gunIsigi(b, o, p, '#cbb690');   // gece ay ışığı yok: levha ve kandil havuzuyla üst üste biniyordu
        lambri(b, p.yz, Math.max(5, Math.round(H * 0.08)) | 1, true);
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
        huzme(b, o, p.wx0, p.wx1, p.wy1 + 4, H, 0.9, 0.6, p.yz);
        /* duvarda hat levhası: altin pervaz, kâğıt, iki satır yazı */
        const lx0 = Math.round(W * 0.5), lx1 = Math.round(W * 0.64), ly0 = Math.round(H * 0.24), ly1 = Math.round(H * 0.5);
        R(b, lx0 - 2, ly0 - 2, lx1 - lx0 + 4, ly1 - ly0 + 4, '#5a4232'); R(b, lx0 - 1, ly0 - 1, lx1 - lx0 + 2, ly1 - ly0 + 2, '#c69a48');
        R(b, lx0, ly0, lx1 - lx0, ly1 - ly0, gc ? '#8a6e50' : '#e8dcc0');
        R(b, lx0 + 2, ly0 + 2, lx1 - lx0 - 4, ly1 - ly0 - 4, kag);
        /* hat: elif dikmeleri, kalın taban çanağı, noktalar (okunmaz, yazı izlenimi) */
        const hx0 = lx0 + 4, hx1 = lx1 - 4, hw = hx1 - hx0, lh = ly1 - ly0, hy = ly0 + Math.round(lh * 0.68);
        /* kâşide: sağda kalın taban, solda yukarı kıvrılan kuyruk; eğik elifler, nun çanağı, eğik harekeler (eski dikmeler tarağa benziyordu) */
        for(let i = 0; i <= hw; i++){ const t = i / hw, y = hy + Math.round(Math.sin(t * Math.PI) * 2 - (t < 0.14 ? (0.14 - t) * 28 : 0)); R(b, hx0 + i, y, 1, t > 0.22 && t < 0.92 ? 2 : 1, mur); }
        [[0.4, 0.56], [0.55, 0.4], [0.8, 0.62]].forEach(([t, k]) => { const x = hx0 + Math.round(hw * t), y = hy + Math.round(Math.sin(t * Math.PI) * 2), h = Math.round(lh * k); for(let j = 1; j < h; j++) px(b, x + (j > h * 0.62 ? 1 : 0), y - j, mur); px(b, x, y - h, mur); });
        const nx = hx0 + Math.round(hw * 0.2), ny = hy - Math.round(lh * 0.2);
        for(let a = 0; a <= 8; a++) px(b, nx + Math.round(Math.cos(a / 8 * Math.PI) * 3), ny + Math.round(Math.sin(a / 8 * Math.PI) * 2), mur);
        px(b, nx, ny - 2, mur);
        [0.3, 0.66, 0.92].forEach((t, n) => { const x = hx0 + Math.round(hw * t), y = ly0 + Math.round(lh * (n === 1 ? 0.22 : 0.3)); px(b, x, y, mur); px(b, x + 1, y - 1, mur); });
        px(b, hx0 + Math.round(hw * 0.67), hy - 4, '#7a3a33'); px(b, hx0 + Math.round(hw * 0.67) + 1, hy - 4, '#7a3a33');
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
        if(o.lamba) isik(b, sx + 2, sy - 8, Math.round(H * (gc ? 0.28 : 0.22)), '!#f1b860', 0.36);
        { const x = Math.round(W * 0.69); R(b, x, Math.round(H * 0.1), 1, Math.round(H * 0.2), '#7d5d2e'); kandil(b, o, x, Math.round(H * 0.3)); }   // asma kandil
        R(b, Math.round(W * 0.47), p.yz - 3, 9, 3, o.kece[2]); R(b, Math.round(W * 0.47), p.yz - 3, 9, 1, o.kece[0]); R(b, Math.round(W * 0.47) + 1, p.yz - 5, 7, 2, '#7a3a33');   // minder: günün dokuması
      } },

    /* Not: yazı masası — açık defter, kalem, mum, sabah penceresi */
    yazi:{ ic:true,
      yer(o){
        const { W, H } = o;
        o.p = { wx0:Math.round(W * 0.6), wx1:Math.round(W * 0.82), wy0:Math.round(H * 0.28), wy1:Math.round(H * 0.6), yz:Math.round(H * 0.84), mt:Math.round(H * 0.68) };
        if(o.lamba) o.sakin.push({ tur:'mum', x:Math.round(W * 0.84), y:o.p.mt - 6, s:11 });
      },
      ciz(b, o){
        const { W, H } = o, p = o.p, gc = o.gece;
        duvar(b, o, p.yz, gc ? '#9a8a74' : '#c7b89c', gc ? '#82725c' : '#ae9f84', gc ? W * 0.84 : (p.wx0 + p.wx1) / 2);
        gunIsigi(b, o, p, gc ? '#9a8a74' : '#c7b89c'); lambri(b, p.yz, Math.max(5, Math.round(H * 0.1)));
        R(b, 0, p.yz, W, H - p.yz, '#5e4434'); R(b, 0, p.yz, W, 1, '#4a3428'); for(let y = p.yz + 3; y < H; y += 3) R(b, 0, y, W, 1, '#553c2e');   // tahta döşeme
        kilim(b, o, Math.round(W * 0.6), Math.round(W * 0.86), p.yz + 3, H - 2);
        R(b, p.wx0 - 2, p.wy0 - 2, p.wx1 - p.wx0 + 4, p.wy1 - p.wy0 + 4, '#5c4434');
        pencere(b, o, p.wx0, p.wy0, p.wx1, p.wy1, { uzak:'#6f8070', cisim:true });
        for(let i = 1; i < 3; i++) R(b, p.wx0 + Math.round((p.wx1 - p.wx0) * i / 3), p.wy0, 1, p.wy1 - p.wy0, '#5c4434');
        R(b, p.wx0, Math.round((p.wy0 + p.wy1) / 2), p.wx1 - p.wx0, 1, '#5c4434');
        R(b, p.wx0 - 3, p.wy1 + 2, p.wx1 - p.wx0 + 6, 1, '#7c6048');
        const sx = p.wx1 - 6; R(b, sx, p.wy1 - 1, 4, 3, '#9a5a3c'); R(b, sx + 1, p.wy1 - 4, 1, 3, '#5d7a46'); R(b, sx + 2, p.wy1 - 5, 1, 4, '#6f8c52'); px(b, sx, p.wy1 - 3, '#5d7a46');
        const mx0 = Math.round(W * 0.54), mx1 = Math.round(W * 0.92);
        R(b, mx0, p.mt, mx1 - mx0, 3, '#7a5236'); R(b, mx0, p.mt, mx1 - mx0, 1, '#9c7048'); R(b, mx0 + 2, p.mt + 3, 2, p.yz - p.mt - 3, '#553a28'); R(b, mx1 - 4, p.mt + 3, 2, p.yz - p.mt - 3, '#553a28');
        huzme(b, o, p.wx0, p.wx1, p.wy1 + 3, p.mt, 1, 0, p.mt);
        const dx = Math.round(W * 0.66), dw = Math.max(10, Math.round(W * 0.06));
        R(b, dx, p.mt - 2, dw, 2, '#efe7d4'); R(b, dx + (dw >> 1), p.mt - 2, 1, 2, '#bcae90');
        for(let i = 1; i < dw - 1; i += 2) if(i !== dw >> 1) px(b, dx + i, p.mt - 2, '#9a9080');
        for(let i = 0; i < 6; i++) px(b, dx + dw + 2 + i, p.mt - 2 - (i >> 1), i < 4 ? '#3a3230' : '#d8c8a0');
        R(b, Math.round(W * 0.58), p.mt - 3, 6, 3, '#4a5a6e'); R(b, Math.round(W * 0.58), p.mt - 4, 6, 1, '#7a3a33');
        /* duvar kilimi: pencerenin sağında, sınırlı palet (kırmızı, lacivert, krem) */
        const kx0 = p.wx1 + Math.round(W * 0.03), kw = Math.max(9, Math.round(H * 0.16)), ky0 = p.wy0 - 2, kh = Math.round(H * 0.34);
        R(b, kx0, ky0, kw, kh, o.kece[2]); R(b, kx0 + 1, ky0 + 1, kw - 2, kh - 2, o.kece[0]);   // kilim: günün dokuması
        const ks = o.kece === KECE[1] ? '#8a3a2e' : '#2c4570';   // lacivert kilimde kırmızı baklava
        for(let j = 3; j < kh - 3; j += 6){ const m = kx0 + (kw >> 1); for(let d = 0; d < 3; d++){ px(b, m - d, ky0 + j + d, ks); px(b, m + d, ky0 + j + d, ks); px(b, m - d, ky0 + j + 5 - d, ks); px(b, m + d, ky0 + j + 5 - d, ks); } px(b, m, ky0 + j + 2, '#e8dcc4'); px(b, m, ky0 + j + 3, '#e8dcc4'); }
        for(let i = 0; i < kw; i += 2) px(b, kx0 + i, ky0 + kh, '#e8dcc4');
        R(b, kx0 - 1, ky0 - 1, kw + 2, 1, '#5c4434');
        { const x = Math.round(W * 0.57); R(b, x, Math.round(H * 0.1), 1, Math.round(H * 0.18), '#7d5d2e'); kandil(b, o, x, Math.round(H * 0.28)); }   // asma kandil
        const cx = Math.round(W * 0.84); R(b, cx - 2, p.mt - 1, 5, 1, '#a07a3c'); R(b, cx, p.mt - 5, 1, 4, '#ece6d6');
        if(o.lamba) isik(b, cx, p.mt - 7, Math.round(H * (gc ? 0.34 : 0.24)), '!#f2bd66', 0.38);
      } },

    /* Dil: kervansaray — taç kapı, yol, kapıya varan kervan */
    kervansaray:{ gok:'gun', ufuk:0.62, gyy:0.3, gx:0.62,
      yer(o){
        const { W, H } = o, z = o.ufuk, bt = z + Math.round(H * 0.12), kx = Math.round(W * 0.7);
        o.p = { xa:Math.round(W * 0.5), bt, wh:Math.round(H * 0.17), kx };
        o.sakin.push({ tur:'kervan', x0:W + 4, x1:kx - 40, dur:kx, y:bt - 4 + Math.round(H * 0.04), n:2 + Math.floor(o.r() * 3), T:90, c:['#5d4a3a', '#6e5842', '#4a3c32'][Math.floor(o.r() * 3)] });
        /* gece taç kapının iki yanında meşale (titrer) */
        const kw = Math.max(9, Math.round(H * 0.2)), my = bt - Math.round(H * 0.17 * 0.55);
        o.p.mesale = o.lamba ? [kx - (kw >> 1) - 3, kx - (kw >> 1) + kw + 2].map(x => [x, my]) : [];
        o.p.mesale.forEach(([x, y], i) => o.sakin.push({ tur:'mum', x, y:y - 1, s:17 + i }));
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.pus;
        sirt(b, { ard:1, y:z, amp:H * 0.2, f:0.02, s:61, sivri:1.4, c:karis('#7a8094', hz, 0.56), i:karis('#a8acb8', hz, 0.5) }); kat(b, 1);
        sirt(b, { y:z + 2, amp:H * 0.05, f:0.04, s:62, c:karis('#a89070', hz, 0.3) });
        kat(b, 2); zemin(b, z + Math.round(H * 0.03), ['#c2aa7e', '#b29b72', '#a08b66', '#8d7a59'], 63);
        otlar(b, o, z + (H - z) * 0.5, Math.round(W / 10), '#8a7a52', 64);
        const yy = p.bt + Math.round(H * 0.04);
        R(b, p.kx, yy - 1, W - p.kx, 3, '#d4c09a'); R(b, p.kx, yy + 2, W - p.kx, 1, '#b8a47e');
        R(b, p.xa, p.bt - p.wh, W - p.xa, p.wh, '#c4ae8a'); R(b, p.xa, p.bt - p.wh, W - p.xa, 1, '#a8946f');
        /* kesme taş sıraları: derz çizgisi, şaşırtmalı dikey derzler; dibinde güneşin bıraktığı gölge; üstte dendanlar */
        for(let y = p.bt - p.wh + 3, n = 0; y < p.bt; y += 3, n++){ R(b, p.xa, y, W - p.xa, 1, '#b7a17d'); for(let x = p.xa + (n % 2 ? 3 : 7); x < W; x += 8) px(b, x, y - 1, '#b7a17d'); }
        R(b, p.xa, p.bt - p.wh + 1, W - p.xa, 1, '#d4c09c');
        for(let x = p.xa + 1; x < W; x += 4) R(b, x, p.bt - p.wh - 1, 2, 1, '#c4ae8a');
        R(b, p.xa, p.bt, W - p.xa, 1, '#8d7a59'); for(let x = p.xa; x < W; x++) if(bay(x, p.bt + 1) < 0.5) px(b, x, p.bt + 1, '#8d7a59');
        R(b, p.xa, p.bt - p.wh, 1, p.wh, '#96835f');
        const bw = Math.max(3, Math.round(H * 0.045));
        for(let x = p.xa + Math.round(W * 0.06); x < W; x += Math.round(W * 0.085)){ if(Math.abs(x - p.kx) < H * 0.16) continue; R(b, x, p.bt - p.wh - 1, bw, p.wh + 1, '#ccb692'); R(b, x, p.bt - p.wh - 1, 1, p.wh + 1, '#a08c68'); R(b, x + 1, p.bt - p.wh - 2, bw - 2, 1, '#ccb692'); for(let y = p.bt - p.wh; y < p.bt; y++) if(bay(x + bw, y) < 0.5) px(b, x + bw, y, '#a8946f'); }
        const kw = Math.max(9, Math.round(H * 0.2)), kh = p.wh + Math.round(H * 0.14), k0 = p.kx - (kw >> 1);
        R(b, k0, p.bt - kh, kw, kh, '#d2bc96'); R(b, k0, p.bt - kh, Math.round(kw * 0.25), kh, '#ac9672');
        /* taç kapı süsü: iki renkli örgü (zencerek) çerçeve, kemerin üstünde kitabe kuşağı, kapının sağa düşen gölgesi */
        for(let y = p.bt - kh + 1; y < p.bt; y++) for(const x of [k0 + 1, k0 + kw - 2]) px(b, x, y, (y + x) % 2 ? '#8c7658' : '#e6d4ae');
        for(let x = k0 + 1; x < k0 + kw - 1; x++) px(b, x, p.bt - kh + 1, x % 2 ? '#8c7658' : '#e6d4ae');
        kitabe(b, k0 + 2, k0 + kw - 2, p.bt - kh + 2, 4);
        if(p.wh >= 12) [k0 - 7, k0 + kw + 6].forEach(x => yildiz8(b, x, p.bt - Math.round(p.wh * 0.6), '#2c5585', '#3ea0a8'));   // taç kapının iki yanında Selçuklu yıldızı
        for(let y = p.bt - p.wh; y < p.bt; y++) for(let i = 0; i < 3; i++) if(bay(k0 + kw + i, y) < 0.6 - i * 0.2) px(b, k0 + kw + i, y, '#a8946f');
        const aw = kw - 6, ah = kh - 5;
        kemer(b, k0 + 3, p.bt - 1, aw, ah, '#8c7658');
        mukarnas(b, k0 + 3 + aw / 2, p.bt - 1, aw, ah, ['#c8b48c', '#a89070', '#6e5a42']);
        const dw = Math.max(3, Math.round(aw * 0.5)), dh = Math.round(ah * 0.5);
        kemer(b, p.kx - (dw >> 1), p.bt - 1, dw, dh, o.lamba ? '!#eab062' : '#3a3028');
        if(!o.lamba && dw > 3){ R(b, p.kx - (dw >> 1) + 1, p.bt - dh + 2, dw - 2, dh - 2, '#5a4430'); R(b, p.kx, p.bt - dh + 2, 1, dh - 2, '#3a3028'); for(let y = p.bt - dh + 3; y < p.bt - 1; y += 2){ px(b, p.kx - 2, y, '#a8875c'); px(b, p.kx + 2, y, '#a8875c'); } }   // ahşap kanatlar, demir çiviler
        if(o.lamba) isik(b, p.kx, p.bt, Math.round(H * 0.16), '!#e8a858', 0.36, true);
        p.mesale.forEach(([x, y]) => { isik(b, x, y - 1, Math.round(H * 0.07), '!#f0a050', 0.3); px(b, x, y, '#3a3028'); px(b, x, y + 1, '#3a3028'); });
      } },

    /* Müzik: bozkırda ateş başı — kopuzlu ozan, kıvılcım, duman */
    ates:{ gok:'aksam', ufuk:0.62, gyy:0.42,
      yer(o){
        /* ozan ve ateş yakın planda: masaüstünde iki kat (2026-11-17; eskiden 12×11 px ozan uzakta kayboluyordu) */
        const { W, H } = o, z = o.ufuk, k = H >= 90 ? 2 : 1, fx = Math.round(W * 0.7), fy = z + Math.round((H - z) * 0.62);
        o.p = { fx, fy, k };
        o.sakin.push({ tur:'alev', x:fx - 2 * k, y:fy - 6 * k, z:k });
        o.sakin.push({ tur:'kivilcim', x:fx, y:fy - 6 * k - 1, L:Math.round(H * 0.16) });
        dumanEkle(o, fx, fy - 7 * k - Math.round(H * 0.05), Math.round(H * 0.18), 9);
        atEkle(o, fx + Math.round(W * 0.1), z + (H - z) * 0.4, Math.floor(o.r() * 4), true);
        o.sakin.push({ tur:'atli', x0:W + 6, x1:Math.round(W * 0.5), y:z - 4, T:85, yol:(W * 0.5 + 6) / 3 / 85, faz:Math.round(o.r() * 85), c:karis('#3a3433', o.hz, 0.25) });
        if(!o.gece) o.sakin.push({ tur:'kartal', x:Math.round(W * 0.8), y:Math.round(H * 0.24), r:Math.round(W * 0.04), T:28, c:'#3b3634' });
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.pus;
        sirt(b, { ard:1, y:z, amp:H * 0.09, f:0.018, s:71, c:karis('#5a5276', hz, 0.42), i:karis('#8a7088', hz, 0.4) }); kat(b, 1);
        kat(b, 2); zemin(b, z + 1, ['#7a6658', '#6a5a50', '#5b4f49', '#4c4442'], 72);
        otlar(b, o, z + (H - z) * 0.4, Math.round(W / 10), '#4a3f3a', 73);
        otag(b, o, Math.round(W * 0.88), z + 5, Math.max(3, Math.round(H * 0.06)), 0.2);
        const k = p.k;
        [[-4, 0], [-3, 1], [-1, 1], [1, 1], [3, 1], [4, 0]].forEach(d => R(b, p.fx + d[0] * k, p.fy + d[1] * k, k, k, '#8a8078'));
        R(b, p.fx - 3 * k, p.fy, 7 * k, k, '#3a2a22'); R(b, p.fx - 2 * k, p.fy - k, 5 * k, k, '#5a3a26');
        spr(b, p.fx - 17 * k, p.fy - 10 * k, POZ.ozan.k[0], {}, false, k);
        isik(b, p.fx - 3 * k, p.fy - 3 * k, Math.round(H * (o.gece ? 0.36 : 0.2)), '!#e58c50', o.gece ? 0.42 : 0.25);   // ozan da ateşin ışığında (gece siluet kalıyordu)
        if(o.gece) [[-6, -5], [-5, -6], [-6, -2], [-7, -1]].forEach(d => R(b, p.fx + d[0] * k, p.fy + d[1] * k, k, k, '!#e09a5a'));
      } },

    /* Hareket, Sağlık: dağ yaylası — karlı doruklar, yayla evleri, patika, sürü, kartal.
       2026-11-19 (sahip: «Sağlığa tıkladığımda arkadaki pikseller daha profesyonel olsun»): derinlik — dağ eteğinde çam kuşağı, orta planda
       keçe otağ obası (ocak dumanı, otlayan iki at, çoban ve koyun sürüsü), dağdan inen dere (sağdan ışık, köpük), önde lale ve çiçek öbekleri. */
    yaylak:{ gok:'gun', ufuk:0.52, gyy:0.3, gx:0.86,
      yer(o){
        const { W, H } = o, z = o.ufuk, orta = { y:z + H * 0.16, amp:H * 0.14, f:0.026, s:82 }, dag = { y:z + 2, amp:H * 0.34, f:0.02, s:81, sivri:1.7 };
        o.bulutlar = o.bulutlar.filter(([bx, by, bw]) => { for(let x = bx - 2; x <= bx + bw + 2; x++) if(yuk(dag, x) < by + 5) return false; return true; });   // zirveye şapka gibi oturan bulut olmaz
        o.p = { orta, dag, evler:[0.72, 0.79, 0.84].map((f, i) => { const x = Math.round(W * f); return [x, Math.round(yuk(orta, x)) + 2 + i]; }) };
        const e = o.p.evler[1]; dumanEkle(o, e[0] + 2, e[1] - Math.round(H * 0.07) - 2, Math.round(H * 0.12), 8); o.sakin[o.sakin.length - 1].kat = 1;
        /* oba: önde büyük otağ (ocak dumanı), yanında otlayan iki at; sürü ve çoban patikanın solunda */
        const os = Math.max(4, Math.round(H * 0.07)), ox = Math.round(W * 0.585), oy = Math.round(H * 0.79);
        o.p.oba = [ox, oy, os];
        dumanEkle(o, ox, oy - os - Math.max(2, Math.round(os * 0.85)) - 2, Math.round(H * 0.14), 9); o.sakin[o.sakin.length - 1].kat = 1;
        [[0.47, 0], [0.515, 1]].forEach(([f, i]) => { const n = Math.floor(o.r() * 4); atEkle(o, W * f, H * 0.79 + i, n + i, i === 1); o.sakin[o.sakin.length - 1].kat = 1; });
        o.sakin.push({ tur:'kartal', x:Math.round(W * 0.66), y:Math.round(H * 0.24), r:Math.round(W * 0.06), T:30, c:o.gece ? '#1b2033' : '#3b3634' });
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.pus;
        sirt(b, { ...p.dag, vadi:1, c:karis('#64748e', hz, 0.5), i:karis('#9aa8bc', hz, 0.44), kar:o.gece ? ['!#8d99bb', '!#5f6a90', 0.58] : ['#eef1f0', '#b8c4d2', 0.58], dd:4 }); kat(b, 1);   // ay ışığında kar parlak kalır
        const kk = MEV === 'kis', ky = kk ? ['#d8dee0', '#eef2f4'] : ['#5f7c4e', '#7f9a5e'];   // kışın yayla çayırı karla örtülü
        sirt(b, Object.assign({ c:karis(ky[0], hz, 0.22), i:karis(ky[1], hz, 0.2), karli:kk }, p.orta));
        /* çam kuşağı: orta sırtın tepesinde öbek öbek, sağdan ışık; kışın uçları karlı */
        { const cr = tohum(86), cm = [karis('#3a5634', hz, 0.3), kk ? '#e4eaec' : karis('#58764a', hz, 0.28)];
          for(let x = Math.round(W * 0.46); x < W; x += 2 + Math.floor(cr() * 2)){ if(g1(x * 0.07, 87) < 0.42) continue; const h = 3 + Math.floor(cr() * (H > 80 ? 5 : 3)), y = Math.round(yuk(p.orta, x)) + 1;
            for(let j = 0; j < h; j++){ const w = (h - j) >> 1; R(b, x - w, y - j, w * 2 + 1, 1, cm[0]); px(b, x + w, y - j, cm[1]); } px(b, x, y - h, cm[1]); } }
        const r = tohum(83 + o.gun), sx = W * (0.56 + r() * 0.2);
        for(let i = 0; i < 9; i++){ const x = Math.round(sx + r() * W * 0.2), y = Math.round(yuk(p.orta, x)) + 3 + Math.floor(r() * H * 0.08); R(b, x, y, 2, 1, '#e6e4da'); px(b, x + (i % 2 ? 2 : -1), y, '#3a3632'); }
        for(let y = Math.round(yuk(p.orta, p.evler[1][0])) + 3; y < H; y++){ const f = (y - z - H * 0.16) / (H * 0.5), x = Math.round(p.evler[1][0] - f * W * 0.12 + Math.sin(f * 5) * W * 0.03); R(b, x, y, Math.max(1, Math.round(1 + f * 2)), 1, '#b4a37a'); }
        /* çayır dokusu (yeni renk açmadan): orta planda sağ yarıda kısa ışık ve gölge çizgileri, öne doğru sıklaşır */
        if(!kk){ const tr = tohum(89), ci = karis(ky[1], hz, 0.2), cg = '#5e7a44';
          for(let q = 0; q < W * H / 50; q++){ const x = Math.floor(W * (0.42 + tr() * 0.58)), yt = yuk(p.orta, x), y = Math.round(yt + 3 + tr() * (z + H * 0.36 - yt)); if(tr() > (y - yt) / (H * 0.25)) continue; R(b, x, y, 1 + Math.floor(tr() * 3), 1, tr() < 0.3 ? ci : cg); } }
        kat(b, 2); const yakin = { y:z + H * 0.36, amp:H * 0.07, f:0.03, s:84 }; sirt(b, { ...yakin, c:kk ? '#d4dadc' : '#5e7a44', i:kk ? '#eaeef0' : '#7a9656', karli:kk });
        otlar(b, o, z + H * 0.36, Math.round(W / 8), '#4e6a3a', 85);
        /* dere: dağın eteğinden öne kıvrılarak iner, önde genişler; sağ kıyı ışık, ortada köpük; yakın sırtın üstünde kalan kısmı ortayla kayar */
        { const y0 = Math.round(yuk(p.orta, W * 0.93)) + 2, su = kk ? ['#c4d8e0', '#eef4f6', '#ffffff'] : ['#5f93ae', '#9cc6d6', '#e6f2f2'];
          for(let y = y0; y < H; y++){ const f = (y - y0) / (H - y0), cx = W * (0.93 - 0.1 * f) + Math.sin(f * 7) * W * 0.016, w = 1 + Math.round(f * f * 5), x = Math.round(cx - w / 2);
            b.kat = y < yuk(yakin, cx) ? 1 : 2; px(b, x - 1, y, kk ? '#d4dadc' : '#5e7a44'); R(b, x, y, w, 1, su[0]); px(b, x + w - 1 + (w > 2 ? 0 : 1), y, su[1]); if(w > 2 && hash(y, 41) > 0.72) R(b, x + 1, y, Math.min(2, w - 2), 1, su[2]); }
          b.kat = 2; }
        /* sürü ve çoban (orta plan, patikanın solunda) */
        if(H > 60){ const sr = tohum(88 + o.gun), [ox, oy] = p.oba; b.kat = 1;
          for(let i = 0; i < 9; i++){ const x = Math.round(W * (0.64 + sr() * 0.1)), y = Math.round(oy - H * (0.09 - sr() * 0.07)); spr(b, x, y - 3, sr() < 0.5 ? KOYUN : KOYUN.map(r => r.split('').reverse().join('')), KOYUN_P); }
          spr(b, Math.round(W * 0.745), oy - 8, POZ.yaya.k[0], { k:'#5a4a3a' }); R(b, Math.round(W * 0.745) + 3, oy - 9, 1, 7, '#5a4a3a');   // çoban değneği
          otag(b, o, ox, oy, p.oba[2], 0); b.kat = 2; }
        for(let i = 0; i < (MEV === 'kis' ? 0 : W / (MEV === 'ilkbahar' ? 6 : 11)); i++){ const x = Math.round(W * 0.5 + r() * W * 0.5), y = Math.round(H * 0.84 + r() * H * 0.14), c = i % 4 === 0 ? '#c8302c' : i % 3 ? '#e8d27a' : '#d9a0b0'; px(b, x, y, c); if(y > H * 0.9){ px(b, x, y + 1, '#4e6a3a'); if(c === '#c8302c') px(b, x, y - 1, c); } }   // önde lale (al) ve sarı çiçek saplı
        const hh = Math.max(3, Math.round(H * 0.06));
        b.kat = 1;   // evler orta sırtın üstünde: ortayla kayar
        { const x = Math.round(W * 0.64); otag(b, o, x, Math.round(yuk(p.orta, x)) + 4, Math.max(3, Math.round(H * 0.045)), 0.12); }   // yaylada keçe otağ
        p.evler.forEach(([x, y], i) => { const w = hh + 3; R(b, x - 1, y - 1, w + 2, 2, '#8e8576'); R(b, x, y - hh, w, hh - 1, '#7a5a3e'); R(b, x, y - hh, 1, hh - 1, '#5e4430'); for(let j = 0; j < 3; j++) R(b, x - 1 + j, y - hh - 1 - j, w + 2 - j * 2, 1, j ? '#55494a' : '#6f6260'); if(o.lamba && i !== 2) isik(b, x + (w >> 1), y - hh + 1, 4, '!#efb45c', 0.26); px(b, x + (w >> 1), y - hh + 1, o.lamba && i !== 2 ? '!#efb45c' : '#3a2c22'); if(i === 1) R(b, x + 2, y - hh - 4, 1, 2, '#5a4e4a'); }); b.kat = 2;
      } },

    /* Beslenme: su başı — çeşme, çınar, bostan */
    pinar:{ gok:'gun', ufuk:0.6, gyy:0.32, gx:0.62,
      yer(o){
        const { W, H } = o, z = o.ufuk, cx = Math.round(W * 0.68), cy = z + Math.round((H - z) * 0.5), cw = Math.max(10, Math.round(H * 0.2)), ch = Math.max(12, Math.round(H * 0.32));
        o.p = { cx, cy, cw, ch };
        o.sakin.push({ tur:'su', x:cx, y:cy - Math.round(ch * 0.42), L:Math.round(ch * 0.42) - 1, c:['#8ab8c6', '#e6f2f2'] });
        o.sakin.push({ tur:'parilti', x:cx - (cw >> 1) - 1, y:cy + 1, w:cw + 2, h:1, n:2, s:91, c:'#e8f4f4' });
        o.sakin.push({ tur:'kus', x0:Math.round(W * 0.98), x1:Math.round(W * 0.58), y:Math.round(H * 0.2), n:2, T:60, yol:0.5, faz:12, c:o.gece ? '#1b2033' : '#4a4644' });
        if(o.gece) yildizEkle(o);
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.pus;
        sirt(b, { ard:1, y:z, amp:H * 0.12, f:0.018, s:92, c:karis('#6c8070', hz, 0.56), i:karis('#94a890', hz, 0.5) }); kat(b, 1);
        kat(b, 2); zemin(b, z + 1, ['#9aa872', '#8a9a68', '#7a8c5e', '#6a7d54'], 93);
        for(let k = 0; k < 4; k++){ const y = Math.round(z + (H - z) * (0.25 + k * 0.16)), x0 = Math.round(W * (0.4 - k * 0.04)), x1 = Math.round(W * 0.58); R(b, x0, y, x1 - x0, 1, '#7e6c4c'); if(MEV !== 'kis') for(let x = x0 + (k % 2); x < x1; x += 2) px(b, x, y - 1, MEV === 'sonbahar' ? (k % 2 ? '#9a7a3a' : '#b08a42') : k % 2 ? '#5e7e3c' : '#6e8e46'); }
        agac(b, Math.round(W * 0.86), z + Math.round((H - z) * 0.36), Math.round(H * 0.4), 94, ['#cdbfa4', '#a2957c']);
        const x0 = p.cx - (p.cw >> 1), y0 = p.cy - p.ch;
        R(b, x0, y0, p.cw, p.ch, '#dad3c3'); R(b, x0, y0, Math.round(p.cw * 0.22), p.ch, '#b5ad9b');
        R(b, x0 - 2, y0 - 2, p.cw + 4, 2, '#8a6c52'); R(b, x0 - 2, y0 - 2, p.cw + 4, 1, '#a4866a');
        R(b, x0 + 2, y0 + 1, p.cw - 4, 2, '#8c8a80'); for(let i = x0 + 3; i < x0 + p.cw - 3; i += 2) px(b, i, y0 + 1, '#e6e0d2');
        for(let y = y0 + 4, n = 0; y < p.cy; y += 3, n++){ R(b, x0 + Math.round(p.cw * 0.22), y, p.cw - Math.round(p.cw * 0.22), 1, '#cbc3b1'); R(b, x0, y, Math.round(p.cw * 0.22), 1, '#a59d8b'); }   // kesme taş sıraları
        kemer(b, x0 + 1, p.cy - 1, p.cw - 2, Math.round(p.ch * 0.66) + 1, '#a59d8b');   // niş çerçevesi
        kemer(b, x0 + 2, p.cy - 1, p.cw - 4, Math.round(p.ch * 0.66), '#bdb4a0');
        mukarnas(b, p.cx, p.cy - 1, p.cw - 4, Math.round(p.ch * 0.66), ['#d4ccba', '#bdb4a0', '#9a9282']);
        R(b, p.cx - 2, p.cy - Math.round(p.ch * 0.42) - 4, 4, 2, '#8c8a80');   // ayna taşı (kitabe)
        R(b, p.cx - 1, p.cy - Math.round(p.ch * 0.42) - 1, 2, 1, '#a07a40');
        R(b, x0 - 2, p.cy, p.cw + 4, 3, '#c9c1ae'); R(b, x0 - 1, p.cy, p.cw + 2, 1, '#7fb0bf'); R(b, x0 - 2, p.cy + 3, p.cw + 4, 1, '#8e8878');
        const tx0 = x0 - 5; R(b, tx0, p.cy - 3, 3, 4, '#b0603e'); R(b, tx0 + 1, p.cy - 5, 1, 2, '#b0603e'); R(b, tx0 + 2, p.cy - 3, 1, 4, '#8a4a30'); px(b, tx0 + 3, p.cy - 4, '#8a4a30');   // testi
        if(o.lamba){ const fx = p.cx + (p.cw >> 1) + 3; R(b, fx, y0 - 1, 1, 3, '#4a3a2a'); R(b, fx - 1, y0 + 2, 3, 3, '!#f0b65e'); px(b, fx, y0 + 3, '!#ffe2a0'); isik(b, fx, y0 + 3, Math.round(H * 0.18), '!#e8a852', 0.3); for(let x = x0 - 1; x < x0 + p.cw + 1; x += 3) px(b, x, p.cy, '!#d8a050'); }   // fener; yalakta yansıması
      } },

    /* Uyku: gece çadırı — kara çadır, köz, uyuyan at, samanyolu */
    cadir:{ gok:'alaca', alaca:true, ufuk:0.62, gyy:0.36, yog:60, yildizGunduz:true,
      yer(o){
        const { W, H } = o, z = o.ufuk, cx = Math.round(W * 0.64), cy = z + Math.round((H - z) * 0.42);
        o.p = { cx, cy, cw:Math.max(22, Math.round(W * 0.17)), ch:Math.max(9, Math.round(H * 0.2)) };
        o.sakin.push({ tur:'mum', x:cx - 5, y:cy - 1, s:13 });
        dumanEkle(o, cx - 5, cy - 3, Math.round(H * 0.12), 10);
        atEkle(o, cx + o.p.cw + 4, cy, Math.floor(o.r() * 4), true);
        yildizEkle(o);
        o.sakin.push({ tur:'kayan', x:Math.round(W * 0.88), y:Math.round(H * 0.14), T:37, faz:18 });
      },
      ciz(b, o){
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.pus;
        if(!o.kapali) for(let i = 0; i < W * z / 18; i++){ const f = hash(i, 101), x = Math.round(W * (0.52 + f * 0.48)), y = Math.round(z * (0.9 - f * 0.85) + (hash(i, 102) - 0.5) * H * 0.18); if(y > 0 && y < z - 3 && bay(x, y) < 0.5) px(b, x, y, o.gece ? '!#3a4670' : '!#7a7ea4'); }
        sirt(b, { ard:1, y:z, amp:H * 0.1, f:0.02, s:103, c:karis('#3a3f5c', hz, 0.3), i:karis('#4c5272', hz, 0.3) }); kat(b, 1);
        kat(b, 2); zemin(b, z + 1, ['#47495a', '#3f414f', '#373946', '#30323d'], 104);
        karaCadir(b, o, p.cx, p.cy, p.cw, p.ch);
        R(b, p.cx - 7, p.cy, 5, 1, '#5a4a42'); if(o.lamba) isik(b, p.cx - 5, p.cy - 1, Math.round(H * 0.12), '!#d8803e', 0.34);
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
        const { W, H } = o, z = o.ufuk, p = o.p, hz = o.pus;
        sirt(b, { ard:1, y:z, amp:H * 0.1, f:0.016, s:112, c:karis('#76808e', hz, 0.62), i:karis('#9ea6b0', hz, 0.56) }); kat(b, 1);
        kat(b, 2); zemin(b, z, ['#a9a682', '#9a9876', '#8b8a6a', '#7c7c5e'], 113);
        R(b, p.xa, z - p.bh, p.xb - p.xa, p.bh + 1, '#cbbb9c'); R(b, p.xa, z - p.bh, Math.round((p.xb - p.xa) * 0.08), p.bh + 1, '#a5967a'); R(b, p.xa - 1, z - p.bh - 1, p.xb - p.xa + 2, 1, '#998a6e');
        for(let y = z - p.bh + 3; y < z; y += 3) R(b, p.xa, y, p.xb - p.xa, 1, '#bfae8e');
        p.yans = [];
        for(let x = p.xa + 5; x < p.xb - 4; x += 9){ if(Math.abs(x - p.kx) < H * 0.16) continue; const yak = o.lamba && hash(x, 5) > 0.3; kemer(b, x, z - Math.round(p.bh * 0.35), 3, Math.round(p.bh * 0.32), yak ? '!#e6ac5c' : '#5a4a3a'); if(yak) p.yans.push(x + 1); }
        const kmx = Math.round(W * 0.9), kmw = Math.max(7, Math.round(H * 0.13)), kmh = Math.round(H * 0.12), kt = z - p.bh - kmh, kk = Math.round(H * 0.13);
        R(b, kmx - (kmw >> 1), kt, kmw, kmh, '#cdbd9e'); R(b, kmx - (kmw >> 1), kt, Math.round(kmw * 0.3), kmh, '#a5967a');
        for(let j = 0; j < kk; j++){ const w = Math.round((kmw / 2 + 1) * (1 - j / kk)); R(b, kmx - w, kt - 1 - j, w * 2 + 1, 1, '#7c848e'); R(b, kmx + Math.round(w * 0.1), kt - 1 - j, Math.round(w * 0.9) + 1, 1, '#a0a8b2'); }
        const tw = Math.max(9, Math.round(H * 0.2)), th = Math.round(H * 0.44), t0 = p.kx - (tw >> 1);
        R(b, t0, z - th, tw, th + 1, '#d6c7a8'); R(b, t0, z - th, Math.round(tw * 0.22), th + 1, '#ad9e82');
        for(let y = z - th + 1; y < z; y += 2){ px(b, t0 + 1, y, '#9e8e70'); px(b, t0 + tw - 2, y, '#9e8e70'); }
        for(let x = t0 + 1; x < t0 + tw - 1; x += 2) px(b, x, z - th + 1, '#9e8e70');
        const aw = tw - 6, ah = th - 5;
        kemer(b, t0 + 3, z - 1, aw, ah, '#8f7f64');
        kitabe(b, t0 + 2, t0 + tw - 2, z - th + 2, 3);
        if(p.bh >= 18) [t0 - 6, t0 + tw + 5].forEach(x => yildiz8(b, x, z - p.bh + 5, '#2c5585', '#3ea0a8'));
        mukarnas(b, t0 + 3 + aw / 2, z - 1, aw, ah, ['#e2d4b6', '#ab9b7c', '#6e6050']);
        kemer(b, p.kx - Math.round(aw * 0.25), z - 1, Math.max(2, Math.round(aw * 0.5)), Math.round(ah * 0.45), o.lamba ? '!#ecb464' : '#3a3028');
        const servi = (x, h) => { for(let j = 0; j < h; j++){ const w = Math.round(Math.sin(Math.min(1, j / h * 1.25) * Math.PI) * 2.2 + 0.5); R(b, x - w, z - j, w * 2 + 1, 1, '#3d5840'); R(b, x + 1, z - j, Math.max(0, w), 1, '#557256'); } px(b, x, z, '#4a3a2a'); };
        servi(Math.round(W * 0.53), Math.round(H * 0.4)); servi(Math.round(W * 0.555), Math.round(H * 0.3));
        const hw = Math.max(2, Math.round(H * 0.05));
        R(b, Math.round(W * 0.59), p.hy - 1, Math.round(W * 0.26), hw + 2, '#d8ccb0');
        R(b, Math.round(W * 0.6), p.hy, Math.round(W * 0.24), hw, '#86aebb'); R(b, Math.round(W * 0.6), p.hy, Math.round(W * 0.24), 1, '#6e98a8');   // kenarın suya düşen gölgesi
        for(let i = 0; i < 6; i++) R(b, Math.round(W * (0.62 + hash(i, 114) * 0.2)), p.hy + 1 + (i % Math.max(1, hw - 1)), 3 + (i % 3), 1, '#a6c8d0');
        p.yans.forEach(x => { if(x > W * 0.6 && x < W * 0.84) R(b, x - 1, p.hy + 1, 3, 1, '!#b8844c'); });   // havuzda yanan pencerelerin yansıması
        if(o.lamba){ isik(b, p.kx, z - 2, Math.round(H * 0.16), '!#d89a52', 0.26); isik(b, p.kx, z, Math.round(H * 0.14), '!#ecb464', 0.34, true); }
      } },

    /* King: otağda divan (2026-11-17, sahip: «taht eklenebilir, Mete Han, Attila gibi»): tahtta oturan hakan silueti, iki yanda tuğ ve
       sancak, tahta uzanan halı, sağda mangal; gündüz tündükten inen ışık, gece mangal ateşi. Üst-sol ve arama kutusu bölgesi düz keçe. */
    taht:{ ic:true,
      yer(o){
        const { W, H } = o, tx = Math.round(W * 0.72), yz = Math.round(H * 0.8), z = H >= 90 ? 2 : 1, u = H / 100;
        o.p = { tx, yz, z, dy:Math.round(H * 0.3), dt:yz - 4 * z, tug:Math.round(H * 0.6), san:Math.round(H * 0.54), mx:tx + Math.round(44 * u), my:yz + Math.round(9 * u) };
        [-1, 1].forEach((y, i) => o.sakin.push({ tur:'tug', x:tx + y * Math.round(36 * u), y:yz - o.p.tug + 3, L:Math.max(5, Math.round(17 * u)), faz:i * 0.7, c:['#e8dcc4', '#b8ac96'] }));
        if(o.gece){ o.sakin.push({ tur:'alev', x:o.p.mx - 2 * z - 1, y:o.p.my - 6 * z - 1, z }); o.sakin.push({ tur:'kivilcim', x:o.p.mx, y:o.p.my - 6 * z, L:Math.round(H * 0.16) }); }
        else o.sakin.push({ tur:'toz', x:tx - Math.round(2 * u), y:Math.round(H * 0.24), w:Math.round(12 * u), h:o.p.dt - Math.round(H * 0.32), kay:-Math.round(8 * u), n:5, T:18, s:121, c:'!#f6e2b0' });
      },
      ciz(b, o){
        const { W, H } = o, p = o.p, gc = o.gece, z = p.z, u = H / 100, ALTIN = '#c69a48', TEK = '#1e1412';
        /* tavan keçesi; uyk direkleri yalnız sağ yarıda ve sönük (başlık ve arama kutusu sakin) */
        R(b, 0, 0, W, p.dy, '#3c221e');
        for(let i = -9; i <= 9; i++) for(let y = 0; y < p.dy; y++){ const x = Math.round(p.tx + i * W * 0.05 * (y + H) / (p.dy + H)); if(x > W * 0.46 && bay(x, y) < kis((x / W - 0.46) / 0.12, 0, 1)) px(b, x, y, '#4c2e23'); }
        R(b, 0, p.dy, W, 1, TEK); R(b, 0, p.dy + 1, W, 1, ALTIN);
        /* kerege duvarı: kafes sağa doğru belirir */
        for(let y = p.dy + 2; y < p.yz; y++) for(let x = 0; x < W; x++){ const k = (x + y) % 6 === 0 || (x - y + 600) % 6 === 0; px(b, x, y, k && bay(x, y) < kis((x / W - 0.36) / 0.16, 0, 1) ? '#63342a' : '#552a24'); }
        /* tahtın ardındaki perde: lacivert, altin kenar, seyrek altin baklava */
        const pw = Math.round(28 * u), px0 = p.tx - pw, px1 = p.tx + pw, py0 = p.dy + 3;
        R(b, px0, py0, px1 - px0, p.yz - py0, '#2c4570'); R(b, px0, py0, px1 - px0, 1, ALTIN); R(b, px0, py0, 1, p.yz - py0, ALTIN); R(b, px1 - 1, py0, 1, p.yz - py0, ALTIN);
        for(let y = py0 + 5; y < p.yz - 3; y += 7) for(let x = px0 + 4 + ((y / 7) & 1) * 3; x < px1 - 3; x += 7){ const c = karis(o.kece[0], '#2c4570', 0.45); px(b, x, y, c); px(b, x - 1, y + 1, c); px(b, x + 1, y + 1, c); px(b, x, y + 2, c); }   // perdede günün dokumasından baklava
        /* zemin ve halı: tahta uzanan kırmızı yol, altin kenar */
        R(b, 0, p.yz, W, H - p.yz, '#3c221e'); R(b, 0, p.yz, W, 1, TEK);
        for(let y = p.yz + 1; y < H; y++){
          const hw = Math.round(16.5 * z + (y - p.yz) * 1.6), x0 = p.tx - hw, x1 = p.tx + hw;
          R(b, x0, y, x1 - x0 + 1, 1, '#7e2a26'); px(b, x0 + 1, y, ALTIN); px(b, x1 - 1, y, ALTIN);
          const m = (y - p.yz) % 6; if(m >= 2 && m <= 4) ['xx.xx', 'x.x.x', '..x..'][m - 2].split('').forEach((c, i) => { if(c === 'x') px(b, p.tx - 2 + i, y, ALTIN); });   // koç boynuzu motifi
        }
        /* iki yanda tuğ (kuyruğu sakin çizer) ve dışta sancak */
        [-1, 1].forEach(yon => {
          const x = p.tx + yon * Math.round(36 * u), t = p.yz - p.tug;
          R(b, x, t + 2, 1, p.tug - 2, '#5a3c26'); R(b, x - 1, t, 3, 2, ALTIN); px(b, x, t - 1, '#e8c872'); px(b, x, t - 2, '#e8c872');
          const sx = p.tx + yon * Math.round(52 * u), st = p.yz - p.san, bw = Math.max(4, Math.round(8 * u)), bh = Math.round(24 * u), b0 = sx - (yon < 0 ? bw : 0) + (yon < 0 ? 0 : 1);
          R(b, sx, st, 1, p.san, '#5a3c26'); px(b, sx, st - 1, '#e8c872');
          R(b, b0 - (yon < 0 ? 1 : 0), st + 2, bw + 1, 1, ALTIN);
          for(let j = 0; j < bh; j++){ const kes = j > bh - 3 ? j - (bh - 3) : 0; for(let i = 0; i < bw; i++){ if(kes && Math.abs(i - (bw - 1) / 2) < kes) continue; px(b, b0 + i, st + 3 + j, i === 0 || i === bw - 1 ? (yon < 0 ? '#8e2925' : '#1e3a62') : yon < 0 ? '#b8352f' : '#2c5585'); } }
          const ex = b0 + (bw >> 1), ey = st + 3 + Math.round(bh * 0.38);
          if(yon < 0) [[-1, -1], [-2, 0], [-1, 1], [1, 0]].forEach(([i, j]) => px(b, ex + i, ey + j, '#f4ece0'));   // al sancak: ay yıldız
          else spr(b, ex - 2, ey - 2, KURT, { y:ALTIN });   // gök sancak: altin kurt başı
        });
        /* divan: iki basamak, taht arkalığı, kolçaklar, oturan hakan */
        R(b, p.tx - Math.round(16.5 * z), p.yz - 2 * z, 33 * z + 1, 2 * z, '#5a3c26'); R(b, p.tx - Math.round(16.5 * z), p.yz - 2 * z, 33 * z + 1, 1, ALTIN);
        R(b, p.tx - Math.round(13.5 * z), p.dt, 27 * z + 1, 2 * z, '#5a3c26'); R(b, p.tx - Math.round(13.5 * z), p.dt, 27 * z + 1, 1, ALTIN);
        const hx = p.tx - Math.floor(6.5 * z), hy = p.dt - 19 * z, aw = 19 * z, ax0 = p.tx - Math.floor(aw / 2), at = hy - 4 * z;
        R(b, ax0, at, aw + 1, p.dt - at, '#5a3c26'); R(b, ax0 + z, at + z, aw + 1 - 2 * z, p.dt - at - z, '#9a2e28');
        R(b, ax0, at, aw + 1, 1, ALTIN); R(b, ax0, at, 1, p.dt - at, ALTIN); R(b, ax0 + aw, at, 1, p.dt - at, ALTIN);
        kemer(b, p.tx - 3 * z, at, 6 * z + 1, 4 * z, ALTIN); px(b, p.tx, at - 4 * z - 1, '#e8c872');
        [-1, 1].forEach(yon => { const kx = yon < 0 ? ax0 - z : ax0 + aw - 2 * z + 1; R(b, kx, hy + 10 * z, 3 * z, p.dt - hy - 10 * z, '#5a3c26'); R(b, kx, hy + 10 * z, 3 * z, 1, ALTIN); });
        spr(b, hx, hy, HAKAN, gc ? Object.assign({}, HAKAN_P, { s:'!#c88a5c', S:'!#8e5a3c', y:'!#e0a850', g:'!#a8783a', h:'!#c8a080', H:'!#987458' }) : HAKAN_P, false, z);   // gece yüz, el, börk ve altın mangal ateşiyle sıcak
        HAKAN.forEach((sat, j) => { const i = sat.lastIndexOf('k'); if(i > 6) R(b, hx + (i + 1) * z - 1, hy + j * z, 1, z, gc ? '!#c0703a' : '#8a6a48'); });   // sağ konturda ışık (gece mangal ateşi sıcak)
        /* mangal: sağda, pirinç tas ve üç ayak; köz hep yanar */
        const mw = Math.max(5, Math.round(9 * u)) | 1, m0 = p.mx - (mw >> 1);
        R(b, m0, p.my - 3 * z, mw, 3 * z, '#5a3c26'); R(b, m0 - 1, p.my - 3 * z, mw + 2, 1, ALTIN);
        [0, mw >> 1, mw - 1].forEach(i => R(b, m0 + i, p.my, 1, 2 * z, '#5a3c26'));
        for(let i = 1; i < mw - 1; i++) px(b, m0 + i, p.my - 3 * z - 1, i % 2 ? '!#e0703a' : '!#ffb050');
        if(gc) isik(b, p.mx, p.my - 4 * z, Math.round(H * 0.36), '!#f0a050', 0.32);
        else {
          isik(b, p.mx, p.my - 3 * z, Math.round(H * 0.1), '!#f0a050', 0.16);
          /* tündükten inen ışık: sağ üstten tahta, titreşimli ve hafif */
          const y0 = Math.round(H * 0.22);   // arama kutusunun (üst çubuk) altinda başlar, yavaşça belirir
          for(let y = y0; y < at; y++){ const cx = p.tx + Math.round(16 * u) - y * 0.2, w = 5 * u + y * 0.08, f = Math.min(1, (y - y0) / 10); for(let x = Math.round(cx - w); x < cx + w; x++){ const q = Math.abs(x - cx) / w; if(f >= 1 || bay(x, y) < f) ortu(b, x, y, '!#ffe2a8', q < 0.55 ? 0.2 : 0.11); } }   // 2026-11-18e: dolu iki tonlu huzme (eskiden dama)
        }
      } },
  };
  /* eski sahne adları (kabuk Bugün'e 'yayla' der; piksel.js ve sinematik.js eski adları kullanır) */
  const ESKI = Object.freeze({ yayla:'otuken', dag:'yaylak', tarla:'ufuk', kiraz:'pinar', gol:'pinar', selale:'pinar', deniz:'kervansaray', col:'kervansaray', magara:'medrese', kis:'cadir' });
  const TUR_LISTE = Object.freeze(Object.keys(SAHNE));

  /* v: saat (sayı, 0–24), an adı (safak · ogle · ikindi · gunbatimi · gece; eski dogum · batim) ya da kabuğun 'gunduz' · 'gece'si:
     o ikisinde gerçek saat kullanılır (10 dakikalık adım), saat o vakitte değilse temsilî saat (öğle, gece yarısı) */
  function saatAl(v){
    if(typeof v === 'number' && isFinite(v)) return ((v % 24) + 24) % 24;
    if(v === 'gunduz' || v === 'gece'){ const d = new Date(), h = d.getHours() + Math.floor(d.getMinutes() / 10) / 6; return vakit(h) === v ? h : v === 'gece' ? 23 : 12.5; }
    return AN_SAAT[AN_AD[v]] != null ? AN_SAAT[AN_AD[v]] : 12.5;
  }
  /* GÜNÜN HÂLİ (2026-11-18c): aynı sahne her gün birebir aynı görünmesin, gün içinde sabit kalsın. Mevsim aydan; hava yalnız tarihten
     (o gün bütün sayfalar aynı havayı görür); dizilim (bulut, kuş, at, sürü, keçe rengi) tarih + sahne tohumundan. gun: Date ya da ms, yoksa bugün. */
  const MEVSIM = ['kis', 'kis', 'ilkbahar', 'ilkbahar', 'ilkbahar', 'yaz', 'yaz', 'yaz', 'sonbahar', 'sonbahar', 'sonbahar', 'kis'];
  function gunHali(gun){
    const d = new Date(gun == null ? Date.now() : +gun), no = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5), mev = MEVSIM[d.getMonth()], q = hash(no, 17);
    return { no, mev, hava:q < 0.4 ? 'acik' : q < 0.68 ? 'bulutlu' : q < 0.8 ? 'sis' : mev === 'kis' ? 'kar' : mev === 'yaz' && q < 0.94 ? 'acik' : 'yagmur' };
  }
  /* kapalı gök (yağmur, kar): gök griye karışır, güneş/ay ve yıldız görünmez */
  const KAPALI = { gun:{ g:['#7e8a98', '#8e98a4', '#9ea6ae', '#acb2b6', '#b8bcbc'], gunes:'#e8eaea', hale:'#c4cacc', bulut:['#c4cace', '#959ca6'] },
    gece:{ g:['#10141e', '#151a26', '#1a202e', '#202636', '#262c3e'], gunes:'#5a6070', hale:'#262c3e', bulut:['#2a3042', '#1e2434'] } };
  const BULUT_SAY = { acik:[1, 3], bulutlu:[4, 6], sis:[1, 2], yagmur:[5, 7], kar:[4, 6] };
  function yerlesim(W, H, v, tur, gun){
    const ad = SAHNE[tur] ? tur : ESKI[tur] || 'otuken', S = SAHNE[ad], saat = saatAl(v), gc = vakit(saat) === 'gece', V = vaktinIsigi(saat, S.ic);
    const tel = typeof innerWidth === 'number' ? innerWidth < 640 : W < 220, Wg = W, ax = S.ax || 0.7;
    /* telefonda sağ üstte yuvarlak arama/hesap düğmeleri var: sahne (W + dx) genişliğinde kurulur, soldaki dx kesilir;
       asıl öğe (masaüstünde x ≈ ax) dar ekranda ortaya gelir. Boyutlar H'den, yalnız aralıklar açılır. */
    const dx = tel ? Math.round(W * kis((ax - 0.5) / (1 - ax), 0, 1)) : 0;
    W += dx;
    const o = { tur:ad, W, H, dx, vakit:gc ? 'gece' : 'gunduz', gece:gc, saat, an:an(saat), sakin:[], imza:'', kay:0 }, gh = gunHali(gun);
    o.gun = gh.no; o.mev = gh.mev; o.hava = gh.hava; o.kapali = gh.hava === 'yagmur' || gh.hava === 'kar';
    o.r = tohum(adTohum(ad) + gh.no * 7919); o.kece = KECE[Math.floor(o.r() * KECE.length)];   // sahnenin günlük dizilimi
    /* gündüz gök saatten; gece uzak katmanların pus rengi eskisi gibi sahnenin kendi gündüz göğünden (sonra ay ışığı tonuna döner) */
    o.G = S.alaca && !gc ? gokKaris(V.G, GOK.alaca, 0.55) : V.G;   // Uyku sahnesi gündüz de alacakaranlığa yakın
    if(o.kapali) o.G = gokKaris(o.G, gc ? KAPALI.gece : KAPALI.gun, 0.5);
    o.Gd = gc ? GOK[S.gok || 'gun'] : o.G; o.hz = o.Gd.g[o.Gd.g.length - 1];
    o.lamba = gc || V.a >= 1;   // pencere, kapı, kandil yanar: gece ve mavi saatte (alacakaranlık), şafak ve gün batımı ufkun altına inince
    o.der = V.der; o.isik = gc ? null : V.isik; o.alcak = gc ? 0 : V.a; o.derA = [gc ? (S.ic ? 2 : 1) : 0, saat, S.ic ? 1 : 0].join();
    o.pus = karis(o.hz, o.Gd.g[o.Gd.g.length - 3], 0.35);   // atmosfer: uzak katmanlar ufkun biraz üstündeki gök rengine (gündüz mavimsi, şafakta mor) karışır
    o.ufuk = Math.round(H * (S.ufuk || 0.62));
    o.gr = kis(Math.round(H * 0.045), 3, 5);
    /* gök cismi üst çubuğun altinda: çubuk ~56 px; telefonda tuval 2×, masaüstünde 3× büyür (kabuk.js manzara) */
    const ust = Math.round(56 / (tel ? 2 : 3)) + o.gr + 3;
    o.gy = [Math.round(Wg * (tel ? S.gxt || 0.6 : S.gx || 0.8)) + dx, Math.min(o.ufuk - 2, Math.max(ust, Math.round(H * (S.gyy || 0.34))))];
    if(!S.ic && o.alcak) o.gy[1] = Math.round(o.gy[1] + (o.ufuk - o.gr - 1 - o.gy[1]) * o.alcak);   // güneş öğlede tasarlanan yerde, şafak ve akşamda ufka iner
    o.yildizlar = [];
    if((gc || S.yildizGunduz) && !o.kapali){
      const r = tohum(adTohum(ad) + W * 13 + H), n = Math.round(W * o.ufuk / (S.yog || 95));
      for(let i = 0; i < n; i++){ const x = Math.floor(r() * W), y = Math.floor(r() * o.ufuk * 0.9), q = r(); if(x < W * 0.5 && y < o.ufuk * 0.55 && r() < 0.7) continue; if(Math.hypot(x - o.gy[0], y - o.gy[1]) < o.gr * 3) continue; o.yildizlar.push([x, y, q < 0.12 ? 2 : q < 0.45 ? 1 : 0, x > W * 0.55 && q < 0.04]); }
    }
    o.bulutlar = [];
    if(!S.ic){
      const r = o.r, [a, z] = BULUT_SAY[o.hava], n = a + Math.floor(r() * (z - a + 1)), iri = o.kapali || o.hava === 'bulutlu';
      o.kume = r() < 0.55;   // günün bulutu: kümülüs ya da ince katman
      for(let i = 0, d = 0; i < n && d < 40; d++){
        const w = Math.round(W * ((iri ? 0.07 : 0.05) + r() * 0.07)), x = Math.round(W * (0.46 + r() * 0.5)), y = Math.round(o.ufuk * (0.2 + r() * 0.3));
        if(!o.kapali && Math.abs(x + w / 2 - o.gy[0]) < w / 2 + o.gr * 3 && Math.abs(y - o.gy[1]) < o.gr * 3) continue;
        if(o.bulutlar.some(q => x < q[0] + q[2] + 3 && q[0] < x + w + 3 && Math.abs(q[1] - y) < 7)) continue;
        o.bulutlar.push([x, y, w]); i++;
      }
    }
    S.yer(o);
    if(o.kapali) o.sakin = o.sakin.filter(s => s.tur !== 'kayan' && s.tur !== 'yildiz');
    /* kuşsuz açık hava sahnesinde kimi gün bir sürü geçer; göç mevsiminde beşli V dizisi */
    if(!S.ic && !gc && !o.kapali && !o.sakin.some(s => s.tur === 'kus') && o.r() < 0.5){ const goc = o.mev === 'ilkbahar' || o.mev === 'sonbahar'; o.sakin.push({ tur:'kus', x0:W + 4, x1:Math.round(W * 0.5), y:Math.round(H * (0.2 + o.r() * 0.12)), n:goc ? 5 : 3, v:goc, T:Math.round(60 + o.r() * 40), yol:0.55, faz:Math.round(o.r() * 50), c:'#4a4644' }); }
    return o;
  }
  function binaCiz(g, o){
    const b = tampon(o.W, o.H), S = SAHNE[o.tur];
    derSec(o);
    if(!S.ic){
      gok(b, o, o.ufuk + 2);
      if(!o.gece && !S.yildizGunduz && !o.kapali) ufukHale(b, o);
      if(o.gece && !S.yildizGunduz && !o.kapali) samanyolu(b, o);
      yildizCiz(b, o);
      if(!o.kapali) gokCismi(b, o, o.gy[0], o.gy[1], o.gr);
      o.bulutlar.forEach(q => bulut(b, q[0], q[1], q[2], o.G.bulut.map(c => '!' + c), o.kume));
    }
    b.o = o;   // kat(b, 2) sisi çizer
    S.ciz(b, o);
    if(!S.ic && o.kapali) yagis(b, o, 0, 0, o.W, o.H);
    g.putImageData(new ImageData(new Uint8ClampedArray(b.d.buffer), o.W, o.H), -(o.dx || 0), 0);
    o.katman = b.s1 && typeof document !== 'undefined' ? katmanYap(b) : null;
  }
  /* ALAN AMBLEMLERİ (2026-11-17e): 16×16 keskin piksel, sahnelerin paletinden; başlığın yanında (sayfa 2× ya da 3× ölçekler,
     image-rendering:pixelated). Koyu çizgi açık zeminde, dolgu koyu zeminde okunur. amblem(alan) → PNG data-URL (önbellekli) ya da null. */
  const AMB_P = { k:'#3a2a24', t:'#e6d6b2', s:'#b09a78', r:'#b8352f', R:'#8e2925', y:'#f0cf78', g:'#c69a48', G:'#94682e', b:'#2c5585', B:'#1e3a62',
    f:'#3ea0a8', w:'#f6efe2', l:'#5e7e3c', L:'#8aa85a', m:'#8a5a36', n:'#5a3c26', o:'#ef8a3c', e:'#ffe7a0', h:'#efe6c8', c:'#c8a070', C:'#9a7448', v:'#6a7ea6' };
  const AMBLEM = Object.freeze({
    tarih:['........y.......', '........krrrr...', '........krrRrr..', '........krrr....', '........k.......', '..kkk..kkk..kkk.', '..ktk..ktk..ktk.', '..ktkkkktkkkktk.',
      '..ksttttttttttk.', '..ksttttktttttk.', '..ksttttktttttk.', '..ksttttttttttk.', '..kstttkkkttttk.', '..ksttknnnktttk.', '..ksttknnnktttk.', '..kkkkkkkkkkkkk.'],
    felsefe:['................', '............o...', '...........oeo..', '...........oeo..', '............k...', '...kkkkkk...k...', '..kyyyyyykkkgk..', '.kggggggggggggk.',
      '.kGgggggggkkkk..', '..kGGGGGGk......', '...kkkkkk.......', '.kkkkkkkkkkkkkk.', '.krrrrrrrrrrrrk.', '.kwwwwwwwwwwwwk.', '.kRRRRRRRRRRRRk.', '.kkkkkkkkkkkkkk.'],
    akademik:['..............kk', '.............kck', '............kcmk', '...........kcmk.', '..........kcmk..', '.........kcmk...', '....kkkkkcmkk...', '...kggggkmkggk..',
      '..kBBBBBBBBBBk..', '.kbbfbbbbbbbbBk.', '.kbfbbbbbbbbbBk.', '.kbbbbbbbbbbbBk.', '.kbbbbbbbbbbbBk.', '..kbbbbbbbbbBk..', '...kkkkkkkkkk...', '................'],
    dil:['................', '............kk..', '...........kcck.', '...........kcckk', '...........kck..', '....kkkk...kck..', '...kryrrk..kck..', '..kcrrrrckkcck..',
      '.kcccccccccccck.', '.kCcccccccccck..', '..kCcccccccck...', '..kck.kk..kck...', '..kck.kk..kck...', '..kck.kk..kck...', '..kkk.kk..kkk...', '................'],
    muzik:['............kkk.', '...........kgnk.', '...........knk..', '..........kmk...', '.........kmk....', '........kmk.....', '...kkkkkmk......', '..kmmmmmmmk.....',
      '.kmcccccccmk....', '.kmcckkkccmk....', '.kmcckkkccmk....', '.kmcccccccmk....', '.kmcccgccccmk...', '..kmcccccmmk....', '...kkmmmmkk.....', '.....kkkk.......'],
    okuma:['................', '................', '..kkkk....kkkk..', '.kwwwwkkkkwwwwk.', '.kwsswwwkwwsswk.', '.kwwwwswkwswwwk.', '.kwsswwwkwwsswk.', '.kwwwwswkwswwwk.',
      '.kwsswwwkwwsswk.', '.kwwwwwwkwwwwwk.', '.krrkkkwkwkkkrrk', 'krrrrrrkkrrrrrrk', 'kRRRRRRRRRRRRRRk', '.kkkkkkkkkkkkkk.', '................', '................'],
    saglik:['................', '..........kk....', '.........kLLk...', '........kLlk....', '...kkk..klkkkk..', '..krrrkkkrrrrrk.', '.krwwrrrrrrrrrrk', '.krwrrrrrrrrrrrk',
      '.krrrrrrrrrrrrRk', '..krrrrrrrrrrRk.', '...krrrrrrrrRk..', '....krrrrrrRk...', '.....krrrrRk....', '......krrRk.....', '.......kRk......', '........k.......'],
    uyku:['................', '.....kkkk.......', '...kkhhhk.......', '..khhhkk.....y..', '.khhhk......yey.', '.khhk........y..', 'khhhk...........', 'khhk............',
      'khhk............', 'khhhk...........', '.khhhk.......kk.', '.khhhhkk...kkhk.', '..khhhhhkkkhhk..', '...kkhhhhhhkk...', '.....kkkkkk.....', '................'],
    /* 2026-11-19 (sahip: Başbuğ'un amblemi taç olmasın): Türk tuğu — altın ay alem, kırmızı bağ, beyaz at kuyruğu, direk */
    king:['....kk....kk....', '....kyk..kyk....', '....kyykkyyk....', '.....kyyyyk.....', '......kggk......', '.....kgyygk.....', '......kggk......', '.......nk.......',
      '.....krrRrk.....', '....khhhshhk....', '....khshhshk....', '...khhshhshhk...', '...khshhshhsk...', '..khhshhshhshk..', '..khsk.nk.kshk..', '...k...nk...k...'],
    beslenme:['................', '.......kkk......', '......krRrk.....', '.......kRk......', '....kkkkrkkkk...', '...krrrrrrrrrk..', '..krrwrrrrrrrRk.', '.krrwrrrrrrrrrRk',
      '.krrrrrrrrrrrrRk', '.krrrrrrrrrrrrRk', '.krrrrrrrrrrrRRk', '.kRrrrrrrrrrrRRk', '..kRrrrrrrrrRRk.', '...kRRrrrrRRRk..', '....kkRRRRRkk...', '......kkkkk.....'],
    hareket:['................', '................', '........k.......', '.......kwk......', '......kwwwk.....', '.....kwwswwk....', '....kwsvvswwk...', '...kvvvvvsvvvk..',
      '..kvvvvvvvvvvvk.', '.kvvvvlkvvvvvvvk', 'kvvvvlLlkvvvvvvk', 'kvvvlLLLlkvvvvvk', 'klllLLLLLLlllllk', 'kLLLLLLLLLLLLLLk', 'kkkkkkkkkkkkkkkk', '................'],
    tahlil:['................', '.....kkkkkk.....', '......kssk......', '......kwwk......', '......kwwk......', '......kwwk......', '.....kwwwwk.....', '....kwwwwwwk....',
      '...kwwwwwwwwk...', '..kfffffffffffk.', '..kfwffffffffBk.', '.kffwfffffffffBk', '.kfffffffffffBBk', '.kBfffffffffBBBk', '..kkkkkkkkkkkkk.', '................'],
  });
  const AMB_TAKMA = { ogren:'okuma', soru:'akademik', tekrar:'akademik', yol:'dil', onay:'tarih' };
  const ambOnbellek = {};
  function amblem(alan){
    const ad = AMBLEM[alan] ? alan : AMB_TAKMA[alan];
    if(!ad || typeof document === 'undefined') return null;
    if(ambOnbellek[ad]) return ambOnbellek[ad];
    const c = document.createElement('canvas'), k = AMBLEM[ad]; c.width = c.height = 16;
    const g = c.getContext('2d');
    k.forEach((sat, y) => { for(let x = 0; x < 16; x++){ const h = sat[x]; if(h !== '.'){ g.fillStyle = AMB_P[h]; g.fillRect(x, y, 1, 1); } } });
    return (ambOnbellek[ad] = c.toDataURL('image/png'));
  }
  /* PARALAKS (2026-11-17e): açık hava sahnesi üç katman: gök + uzak sırt, orta plan, ön plan. Sayfa kaydıkça kapak yukarı çıkar;
     uzak katmanlar daha yavaş çıkar (tuvalin içinde aşağı kayar). Tuval pikseli başına kayma: uzak 0.14, orta 0.06 (kapak tam
     kaybolurken uzak sırt ~14 tuval pikseli). Sakinler: gökteki kuş, kartal, yıldız uzakla; ufuktaki atlı ortayla gider. */
  const KAY = [0.14, 0.06], SAKIN_KAT = { kus:0, kartal:0, yildiz:0, kayan:0, atli:1 };
  function katmanYap(b){
    const n = b.W * b.H, s2 = b.s2 || b.d, k2 = b.k2 || b.k, orta = new Uint32Array(n), on = new Uint32Array(n);
    for(let i = 0; i < n; i++){ const k = b.k[i]; if(k === 2) on[i] = b.d[i]; else if(k === 1) orta[i] = b.d[i]; if(!orta[i] && k2[i] === 1) orta[i] = s2[i]; }   // geç çizilen orta plan (yayla evleri) de ortada
    return [b.s1, orta, on].map(d => { const c = document.createElement('canvas'); c.width = b.W; c.height = b.H; c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(d.buffer), b.W, b.H), 0, 0); return c; });
  }
  const kaymalar = o => (o.katman && o.kay > 0 && !durgun() ? KAY.map(k => Math.round(o.kay * k)) : null);
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
    bagla(g, arka, o);
    g.imageSmoothingEnabled = false;
    const ky = kaymalar(o), k = o.sakin.map(s => kareAl(s, t)), imza = k.join('|') + (ky && (ky[0] || ky[1]) ? '#' + ky : '');
    if(imza === o.imza) return 0;
    o.imza = imza;
    derSec(o);
    if(ky && (ky[0] || ky[1])){
      const c = o.katman, dx = o.dx || 0;
      if(ky[0]) g.drawImage(c[0], 0, 0, o.W, 1, -dx, 0, o.W, ky[0]);   // açılan üst şerit: göğün en üst satırı
      g.drawImage(c[0], -dx, ky[0]); g.drawImage(c[1], -dx, ky[1]); g.drawImage(c[2], -dx, 0);
    } else g.drawImage(arka, 0, 0);
    o.sakin.forEach((s, i) => {
      const y = ky ? ky[s.kat != null ? s.kat : SAKIN_KAT[s.tur]] || 0 : 0;
      if(o.dx || y){ g.save(); g.translate(-(o.dx || 0), y); HAREKET[s.tur].ciz(g, s, k[i], o); g.restore(); } else HAREKET[s.tur].ciz(g, s, k[i], o);
    });
    return 1;
  }
  /* kaydırma izleyici: yalnız ekrandaki son sahne; kare başına bir okuma (rAF), kapak görünmüyorsa ya da hareket azsa çizmez */
  let aktif = null, kayIstek = 0;
  function kayOku(c){
    const r = c.getBoundingClientRect();
    if(!r.height) return 0;
    return Math.min(r.height, Math.max(0, -r.top)) * c.height / r.height;   // kapak üstten taştığı kadar, tuval pikseliyle
  }
  function bagla(g, arka, o){
    if(aktif && aktif.g === g && aktif.o === o) return;
    aktif = { g, arka, o };
    try{ o.kay = g.canvas && g.canvas.isConnected && o.katman ? kayOku(g.canvas) : 0; }catch(e){ o.kay = 0; }
  }
  function kayKare(){
    kayIstek = 0;
    const A = aktif;
    if(!A || !A.o.katman || durgun() || document.hidden) return;
    const c = A.g.canvas;
    if(!c.isConnected){ aktif = null; return; }
    const once = kaymalar(A.o) + '';
    A.o.kay = kayOku(c);
    if(kaymalar(A.o) + '' !== once) kare(A.g, A.arka, A.o, Date.now() / 1000);
  }
  if(typeof document !== 'undefined') document.addEventListener('scroll', () => { if(aktif && !kayIstek) kayIstek = requestAnimationFrame(kayKare); }, { passive:true, capture:true });
  L.PIKSEL_DOGA = Object.freeze({ vakit, an, gunHali, AN_SAAT, saatAl, amblem, AMBLEM, AMB_P, yerlesim, binaCiz, kare, kareAl, durgun, POZ, PALET:GOK, P_SABIT, TUR_LISTE, ESKI, INSAN:Object.freeze(INSAN.slice()) });
})(window.LIFEOS);
