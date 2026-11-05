/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/piksel-apartman.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* PİKSEL APARTMAN — piksel temasının arka planı: önü açık bir bina. Ortada asansör, iki yanında koridor,
   dışta evler (her ev kapıyla bağlı odalar); üstte teras, altta sokak. Kart ve menü önünde durur;
   uzun süre işlem yapılmazsa çekilir, bütün sahne görünür (piksel.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/piksel-apartman.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır.

   Sözler:
     1. SÜSTÜR. Sakinler kurgudur: kullanıcıyı, modülü ya da ajanı temsil etmez; veri okumaz, sayı üretmez.
     2. KODLA ÇİZİLİR. Görsel dosyası yok; çevrimdışı ve tek dosyada çalışır.
     3. EKRANI YORMAZ. Sahne bir kez ayrı tuvale çizilir; karede yalnız içinde bir şey değişen bölge yenilenir.
     4. KARE SAATTEN HESAPLANIR. Saklı durum yok: aynı t aynı kareyi verir, hareketsiz kipte tek kare çizilir. */
window.LIFEOS = window.LIFEOS || {};

(function(L){
  const KAT = 34, TERAS = 16, ILK_KAT = 18, HIZ = 6, ASANSOR = 13, KORIDOR = 18, DAR = 200;
  const HAT = '#4a2c38', AHSAP = '#b5825a', AHSAP_K = '#7d5540', TOPRAK = '#c2603f', METAL = '#8e9aa0', KREM = '#f4e8d2', DOSEME = '#6d463c';
  /* Dört vakit gerçek saatten gelir; veri değil, süs. */
  const PALET = {
    dogum:{ gok:['#37427e', '#5d5a9c', '#9a6fa8', '#d98a9c', '#f4ab90', '#fbc892', '#fde2a6', '#fff0c4'], gunes:'#fff4c8', hale:'#ffe0a855', uzak:'#9c7aa4', yakin:'#6a5a88', pencere:'#ffdf9a', bulut1:'#ffe3d0', bulut2:'#f2b4b4', sakin:0.95, gunesYeri:[0.2, 11, 4], amb:[0.8, 0.78, 0.86], isik:[1.06, 1.0, 0.92] },
    ogle:{ gok:['#4f9ee0', '#5fabe6', '#70b8ea', '#83c4ee', '#97cff1', '#acdaf4', '#c2e4f6', '#d8eef8'], gunes:'#fff8cc', hale:'#fff4c066', uzak:'#8fb7cc', yakin:'#6f92a8', pencere:'#d8eef8', bulut1:'#ffffff', bulut2:'#d6e8f2', sakin:1, gunesYeri:[0.62, 5, 4], amb:[1, 0.99, 0.97], isik:[1.02, 1.01, 0.99] },
    batim:{ gok:['#3d3f7c', '#5b4f92', '#85599a', '#b45f93', '#d96f86', '#ee8c75', '#f7ae74', '#fcd28c'], gunes:'#fff0bd', hale:'#ffd79a55', uzak:'#a4628f', yakin:'#6e4574', pencere:'#ffcf8a', bulut1:'#ffd9c4', bulut2:'#f0a3a4', sakin:0.97, gunesYeri:[0.74, 8, 4], amb:[0.9, 0.84, 0.86], isik:[1.07, 1.03, 0.96] },
    gece:{ gok:['#0b0c24', '#101137', '#17194a', '#20215b', '#2d2a6a', '#3e3478', '#544084', '#70508f'], gunes:'#f2f0d8', hale:'#8c86b855', uzak:'#2a2658', yakin:'#17163a', pencere:'#e9c27a', bulut1:'#4c4a86', bulut2:'#332f66', sakin:0.88, gunesYeri:[0.74, 5, 3], amb:[0.32, 0.31, 0.5], isik:[1.1, 1.0, 0.84] },
  };
  const vakit = saat => (saat < 6 || saat >= 22 ? 'gece' : saat < 9 ? 'dogum' : saat < 17 ? 'ogle' : 'batim');
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function daire(g, cx, cy, r, c){
    g.fillStyle = c;
    for(let y = -r; y <= r; y++){ const w = Math.round(Math.sqrt(r * r - y * y)); g.fillRect(Math.round(cx) - w, Math.round(cy) + y, w * 2 + 1, 1); }
  }
  function tonla(c, f){
    const n = parseInt(c.slice(1, 7), 16), k = v => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0');
    return '#' + k(n >> 16) + k((n >> 8) & 255) + k(n & 255);
  }
  function tohum(s){ let v = s; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; }
  /* Eşyanın tek kuralı: koyu dış hat, üstte aydınlık, sağ ve altta gölge */
  function kutu(g, x, y, w, h, c){
    R(g, x, y, w, h, HAT);
    R(g, x + 1, y + 1, w - 2, h - 2, c);
    if(h > 3) R(g, x + 1, y + 1, w - 2, 1, tonla(c, 1.16));
    if(w > 3){ R(g, x + w - 2, y + 2, 1, h - 3, tonla(c, 0.82)); }
    if(h > 4) R(g, x + 1, y + h - 2, w - 2, 1, tonla(c, 0.82));
  }

  /* ---------- SAKİNLER: dokuz piksel eninde, on dört boyunda; dış hatlı, üç tonlu ---------- */
  const SAKIN = [
    { h:'#3b2a24', s:'#f2c9a1', g:'#c2603f', p:'#3f3a55', huy:'gul' },
    { h:'#1f1a22', s:'#e0ad82', g:'#5f86a8', p:'#4a3b34', uzun:1, huy:'kiz' },
    { h:'#a5612f', s:'#f6d5b3', g:'#7fa35a', p:'#39425a', huy:'nota' },
    { h:'#d9d3c6', s:'#eec39c', g:'#8a5f96', p:'#5a4a3e', huy:'uz' },
    { h:'#6b3a22', s:'#b97a50', g:'#e8b45a', p:'#2f3548', uzun:1, huy:'kalp' },
    { h:'#231b1c', s:'#8e5a3b', g:'#e6dcc6', p:'#4d3a50', huy:'gul' },
    { h:'#c9743a', s:'#f6d5b3', g:'#3f8f8a', p:'#54403a', uzun:1, huy:'nota' },
    { h:'#4a3a58', s:'#e8b793', g:'#d9737f', p:'#34384e', huy:'kalp' },
  ];
  const BAS = ['...KKKK..', '..KhHHhK.', '.KhHhhhhK', '.KhhssesK', '.KhhssesK', '.KhhcsnsK', '..KhSSsK.', '...KKKK..'];
  const ON = ['...KKK...', '..KhHhK..', '.KhHHhhK.', '.KsesesK.', '.KsesesK.', '.KcsnscK.', '.KSsssSK.', '..KKKKK..'];
  const ON_K = ON.map((r, i) => (i === 3 ? '.KsssssK.' : r));
  const GOVDE = ['.KgggGGK.', 'KsgggGGsK', '.KgggGGK.'];
  const BACAK = ['..KpPPK..', '..KpKPK..', '..KkKkK..'];
  const YAN = (u, a) => BAS.concat(u, a || BACAK);
  const OTUR = ['..KpPPPPK', '.....KPK.', '.....KkK.'];
  const DUR = ON.concat(GOVDE, BACAK), DUR2 = ON_K.concat(GOVDE, BACAK);
  const tvKare = s => Array.from({ length:8 }, (_, y) => Array.from({ length:14 }, (_, x) => ((x + s * 5 + (y < 4 ? 0 : 7)) % 14 < 7 ? 'T' : (y < 5 ? 'U' : 'V'))).join(''));
  const BALON = (a, b, c) => ['.KKKKKKK.', 'K' + a, 'K' + b, 'K' + c, '.KKKKKKK.', '...KK....'];
  const POZ = {
    dur:{ h:2, k:[DUR, DUR, DUR, DUR, DUR, DUR, DUR2, DUR, DUR, DUR] },
    yuru:{ h:5, k:[YAN(['..KgggGK.', '..KgsgGK.', '..KgggGK.'], ['..KpPPK..', '.KpKKPK..', '.KkK.KkK.']), YAN(['..KgggGK.', '..KgsgGK.', '..KgggGK.'], ['..KpPPK..', '...KpPK..', '...KkkK..'])] },
    yaz:{ h:4, k:[YAN(['..KggGssK', '..KgggGK.'], OTUR), YAN(['..KggGsK.', '..KgggGsK'], OTUR), YAN(['..KggGssK', '..KgggGK.'], OTUR), YAN(['..KggGsK.', '..KgggGK.'], OTUR)] },
    oku:{ h:0.3, k:[YAN(['..KggGbbb', '..KgggbbK'], OTUR), YAN(['..KggGbbb', '..KgggbbK'], OTUR), YAN(['..KggGbbw', '..KgggbbK'], OTUR)] },
    otur:{ h:1, k:[YAN(['..KgggGK.', '..KgggsK.'], OTUR)] },
    ye:{ h:0.8, k:[YAN(['..KggGssK', '..KgggGK.'], OTUR), ['...KKKK..', '..KhHHhK.', '.KhHhhhhK', '.KhhssesK', '.KhhssesK', '.KhhcsnsK', '..KhSSssK', '...KKKKs.', '..KggGsK.', '..KgggGK.'].concat(OTUR)] },
    konus:{ h:1.5, k:[YAN(['..KgggGK.', '..KgggsK.', '..KgggGK.']), YAN(['..KgggGsK', '..KgggGK.', '..KgggGK.']), YAN(['..KgggGK.', '..KgggsK.', '..KgggGK.'])] },
    ic:{ h:0.5, k:[YAN(['..KgggGK.', '..KgggsCK', '..KgggGK.']), ['...KKKK..', '..KhHHhK.', '.KhHhhhhK', '.KhhssesK', '.KhhssesK', '.KhhcsnsC', '..KhSSsCK', '...KKKKs.', '..KgggsK.', '..KgggGK.', '..KgggGK.'].concat(BACAK)] },
    esne:{ h:1, k:[['s..KKK..s', 's.KhHhK.s', 'sKhHHhhKs', '.KhhhhhK.', '.KsesesK.', '.KsesesK.', '.KcseseK.', '..KKKKK..', '.KgggGGK.', '..KggGK..', '..KggGK..'].concat(BACAK)] },
    uyu:{ h:1, k:[['.........', '.........', '.........', '....KKKK.', '...KhHHhK', '...KhhssK', '...KhcsnK', '....KKKK.', '..KggGssK', '..KgggGK.'].concat(OTUR)] },
    sev:{ h:1.5, k:[BAS.concat(['..KggGssK', '.KpggGK..', '.KkpPPkK.']), BAS.concat(['..KggGsK.', '.KpggGKs.', '.KkpPPkK.'])] },
    firca:{ h:1.5, k:[YAN(['..KgggGKs', '..KgggsK.', '..KgggGK.']), YAN(['..KgggsK.', '..KgggsK.', '..KgggGK.'])] },
    sula:{ h:1, k:[YAN(['..KgggsK.', '..KggGmmK', '..KgggKmK']), YAN(['..KgggsK.', '..KggGmmK', '..KgggKmd'])] },
    yat:{ h:1, k:[['.KKKK.........', 'KhHhsK.KKKKKK.', 'KhhesKKggggGKK', 'KhcnsKggggGGpk', '.KKKKKKKKKKKKK']] },
    kafa:{ h:2, k:[ON, ON, ON, ON, ON, ON_K, ON, ON] },
    kopuk:{ h:1.2, k:[['.w..ww...w..w.', 'wwwwwwwwwwwwww'], ['..w...ww..w...', 'wwwwwwwwwwwwww']] },
    /* Kedi ve küçük hareketler: sakin rengi kullanmaz */
    kedi:{ h:1, k:[['........K..K.', '.K.....KOKKOK', 'KoK...KoooooK', 'KoK...KooeoeK', 'KoKKKKoollooK', 'KooooooooooK.', '.KoKoKKKoKoK.', '.KK.KK.KK.KK.'], ['........K..K.', '.......KOKKOK', '.K....KoooooK', 'KoK...KooeoeK', 'KoKKKKoollooK', 'KooooooooooK.', '.KoKoKKKoKoK.', '.KK.KK.KK.KK.']] },
    kediyuru:{ h:5, k:[['........K..K.', '.K.....KOKKOK', 'KoK...KoooooK', 'KoK...KooeoeK', 'KoKKKKoollooK', 'KooooooooooK.', '.KoKKKKKKoK..', '.KK......KK..'], ['........K..K.', '.K.....KOKKOK', 'KoK...KoooooK', 'KoK...KooeoeK', 'KoKKKKoollooK', 'KooooooooooK.', '..KKoKKoKKK..', '...KK..KK....']] },
    buhar:{ h:2.2, k:[['w..', '...', '.w.', '...'], ['...', '.w.', '...', 'w..'], ['.w.', '...', 'w..', '...']] },
    laf:{ h:1.2, k:[['.KKKKK.', 'KwwwwwK', 'KwKwKwK', 'KwwwwwK', '.KKKKK.', '..K....'], ['.KKKKK.', 'KwwwwwK', 'KwKwwwK', 'KwwwwwK', '.KKKKK.', '..K....'], ['.KKKKK.', 'KwwwwwK', 'KwwwwwK', 'KwwwwwK', '.KKKKK.', '..K....']] },
    z:{ h:1, k:[['....', '....', 'zzzz', '..z.', '.z..', 'zzzz'], ['zzzz', '..z.', '.z..', 'zzzz', '....', '....'], ['....']] },
    kalp:{ h:1.5, k:[['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..', '.....'], ['.....', '.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..']] },
    tv:{ h:1.2, k:[tvKare(0), tvKare(1), tvKare(2)] },
    ekran:{ h:0.7, k:[['TTTTTTTT', 'TUUUTTTT', 'TTTTTTTT', 'TUUUUUTT', 'TTTTTTTT', 'TUUTTTTT'], ['TTTTTTTT', 'TUUUUUTT', 'TTTTTTTT', 'TUUTTTTT', 'TTTTTTTT', 'TUUUUTTT'], ['TTTTTTTT', 'TUUTTTTT', 'TTTTTTTT', 'TUUUUTTT', 'TTTTTTTT', 'TUUUTTTT']] },
    bulut:{ h:1, k:[['...CCCC........', '.CCCCCCCCC..CC.', 'CCCCCCCCCCCCCCC', '..DDDDDDDDDDD..']] },
    camasir:{ h:0.8, k:[['AAA.www.BB', 'AAA.www.BB', 'AA..www..B'], ['AAA.www.BB', '.AA.www.BB', '.AA..ww.B.']] },
    kus:{ h:1.3, k:[['..dd', 'dddd', '.d..'], ['..dd', 'dddd', '.d..'], ['.dd.', 'dddd', '.d..']] },
    ampul:{ h:0.6, k:[['y'], ['Y'], ['Y'], ['y']] },
    yildiz:{ h:0.5, k:[['.w.', 'www', '.w.'], ['...', '.w.', '...']] },
    araba:{ h:1, k:[['.....KKKKKKKKKK........', '....KUUUKUUUUUKK.......', '...KUUUUKUUUUUUKK......', '.KKBBBBBBBBBBBBBBBKKKK.', 'KBBBBBBBBBBBBBBBBBBBBYK', 'KAAAAAAAAAAAAAAAAAAAAAK', '.KKKdddKKKKKKKKKdddKKK.', '...KdwdK........KdwdK..']] },
    b_gul:{ h:1, k:[BALON('wwewewwK', 'wewwwewK', 'wweeewwK')] },
    b_uz:{ h:1, k:[BALON('wwewewwK', 'wweeewwK', 'wewwwewK')] },
    b_kiz:{ h:1, k:[BALON('wrwwwrwK', 'wwewewwK', 'wweeewwK')] },
    b_kalp:{ h:1, k:[BALON('wwrwrwwK', 'wwrrrwwK', 'wwwrwwwK')] },
    b_nota:{ h:1, k:[BALON('wwwdddwK', 'wwwdwdwK', 'wwddwddK')] },
    b_yemek:{ h:1, k:[BALON('wwOOOwwK', 'wOOOOOwK', 'wwlllwwK')] },
    gizli:{ h:1, k:[[]] },
  };
  const SABIT = { K:HAT, e:'#2a1a1c', k:'#2d2224', b:'#c2603f', w:'#fff8ea', C:'#fbeed5', m:'#6f8fa0', d:'#3a3244', o:'#ee9c52', O:'#c9743a', l:'#fbe3bb', z:'#5f5a8a', r:'#e8505b', T:'#8fc7d8', U:'#d9f0f2', V:'#5a7ea0', y:'#ffe6a0', Y:'#f4b860', L:'#ffe9b8', A:'#8a3f36', B:'#b8584a' };
  SABIT.C = '#fbeed5';
  const BULUT_P = { A:'#6f8fa0', B:'#d9737f' };
  const KABIN = ['ddddddddddd', 'dLLLLLLLLLd', 'dLLLLLLLLLd', 'dLLLLLLLLLd', 'dLLLLLLLLLd'];
  POZ.kabin = { h:1, k:[KABIN.concat(Array(14).fill('dLLLLLLLLLd'), ['ddddddddddd'])] };
  POZ.kabinK = { h:2, k:[KABIN.concat(DUR.map(r => 'd' + r.replace(/\./g, 'L') + 'd'), ['ddddddddddd'])] };

  /* Sakin ve poz ilk gerektiğinde küçük bir tuvale çizilir; kare başına piksel piksel çizim yok. */
  const onbellek = new Map();
  function gorsel(poz, i, kisi, ters, v){
    const anahtar = poz + i + '|' + (kisi ? SAKIN.indexOf(kisi) : '') + (ters ? 't' : '') + v;
    let c = onbellek.get(anahtar);
    if(c) return c;
    const s = POZ[poz].k[i].map(r => r.split('')), P = Object.assign({}, SABIT, /^camasir/.test(poz) ? BULUT_P : null, /^bulut/.test(poz) ? { C:PALET[v].bulut1, D:PALET[v].bulut2 } : null);
    if(kisi){
      Object.assign(P, { c:'#f4a39a', n:'#a84e46', h:kisi.h, H:tonla(kisi.h, 1.35), s:kisi.s, S:tonla(kisi.s, 0.84), g:kisi.g, G:tonla(kisi.g, 0.76), p:kisi.p, P:tonla(kisi.p, 0.76) });
      /* Uzun saç: başın arkasından omza iner */
      if(kisi.uzun) for(let y = 5; y <= 8 && y < s.length; y++){ const ilk = s[y].indexOf('K'); if(ilk > 0){ s[y][ilk - 1] = 'K'; s[y][ilk] = 'h'; } }
      Object.keys(P).forEach(k => { P[k] = tonla(P[k], PALET[v].sakin); });
    }
    c = document.createElement('canvas');
    c.width = s[0] ? s[0].length : 1; c.height = s.length || 1;
    const g = c.getContext('2d');
    s.forEach((r, y) => r.forEach((ad, x) => {
      const renk = ad === '.' ? null : P[ad];
      if(renk){ g.fillStyle = renk; g.fillRect(ters ? r.length - 1 - x : x, y, 1, 1); }
    }));
    onbellek.set(anahtar, c);
    return c;
  }

  /* Rutin: [poz, süre, hedefX?, ters?, hedefY?]. Hedef varsa o sürede oraya gider (süre 0 ise yürüyüş hızıyla). */
  function rutin(kisi, x, y, adimlar){
    const seg = [];
    let z = 0, px = x, py = y;
    adimlar.forEach(a => {
      const hx = a[2] === undefined ? px : a[2], hy = a[4] === undefined ? py : a[4], s = a[1] || Math.abs(hx - px) / HIZ;
      seg.push({ poz:a[0], t0:z, t1:z + s, x0:px, x1:hx, y0:py, y1:hy, ters:a[3] === undefined ? hx < px : a[3] });
      z += s; px = hx; py = hy;
    });
    return { kisi, seg, T:z };
  }
  /* Saf: aynı t aynı kareyi verir. null = görünmüyor. */
  function kareAl(a, t){
    const z = ((t % a.T) + a.T) % a.T, s = a.seg.find(q => z < q.t1) || a.seg[a.seg.length - 1];
    if(s.poz === 'gizli') return null;
    const P = POZ[s.poz], i = Math.floor(z * P.h) % P.k.length, f = (z - s.t0) / (s.t1 - s.t0);
    return { poz:s.poz, i, x:Math.round(s.x0 + (s.x1 - s.x0) * f), y:Math.round(s.y0 + (s.y1 - s.y0) * f) - P.k[i].length, ters:s.ters, kisi:s.kisi || a.kisi };
  }

  /* ---------- EŞYA ---------- */
  function resim(g, x, y, satirlar, p){ satirlar.forEach((r, j) => { for(let i = 0; i < r.length; i++){ const c = p[r[i]]; if(c) R(g, x + i, y + j, 1, 1, c); } }); }
  const BITKI = ['...KKK...', '..KGGgK..', '.KGGgGgK.', 'KGGgGGgGK', 'KGgGgGgGK', '.KgGgGgK.', '..KgggK..', '...KgK...', '.KKKKKKK.', '.KLtttTK.', '..KttTK..', '..KttTK..', '...KKK...'];
  const BITKI_P = { K:HAT, g:'#4c6f45', G:'#7fa35a', t:'#c2603f', T:'#9a4a30', L:'#dd7f5c' };
  const bitki = (g, x, F) => resim(g, x, F - 13, BITKI, BITKI_P);
  function masa(g, x, F, w){ kutu(g, x, F - 6, w, 3, AHSAP); R(g, x + 1, F - 3, 2, 3, HAT); R(g, x + w - 3, F - 3, 2, 3, HAT); }
  function sandalye(g, x, F){ R(g, x, F - 12, 3, 10, HAT); R(g, x + 1, F - 11, 1, 8, '#6f7f94'); R(g, x, F - 2, 7, 1, HAT); R(g, x + 3, F - 1, 1, 1, HAT); R(g, x + 1, F - 1, 5, 0, HAT); }
  function ekran(g, x, F){ kutu(g, x, F - 15, 10, 8, '#2c2a3d'); R(g, x + 1, F - 14, 8, 6, '#8fc7d8'); R(g, x + 4, F - 7, 2, 1, HAT); }
  function kitaplar(g, x, y, w){ const k = ['#c2603f', '#e8b45a', '#5f86a8', '#7fa35a', '#e6dcc6', '#8a5f96', '#a0523f'], r = tohum(x * 31 + y * 7); for(let i = 0; i < w;){ const e = 2, b = 3 + Math.floor(r() * 2), c = k[Math.floor(r() * 7)]; if(i + e > w) break; R(g, x + i, y + 4 - b, e, b, c); R(g, x + i + 1, y + 4 - b, 1, b, tonla(c, 0.78)); i += e + (r() < 0.14 ? 1 : 0); } }
  function raf(g, x, y, w){ kitaplar(g, x + 1, y, w - 2); R(g, x, y + 4, w, 1, HAT); R(g, x + 1, y + 5, w - 2, 1, '#00000022'); }
  function tablo(g, x, y, w, h, renk){ kutu(g, x, y, w, h, renk || '#d9a36f'); R(g, x + 1, y + Math.floor(h / 2), w - 2, Math.ceil(h / 2) - 1, TOPRAK); daire(g, x + w - 4, y + 3, 1, '#ffeeb0'); }
  function pencere(g, x, y, P){
    const w = 14, h = 13;
    kutu(g, x - 1, y - 1, w + 2, h + 2, KREM);
    for(let i = 0; i < h; i++) R(g, x, y + i, w, 1, P.gok[Math.min(P.gok.length - 1, 2 + Math.floor(i / h * (P.gok.length - 2)))]);
    R(g, x + 6, y, 2, h, KREM); R(g, x, y + 6, w, 1, KREM);
    R(g, x - 2, y + h + 1, w + 4, 1, HAT); R(g, x - 2, y + h, w + 4, 1, KREM);
    /* Perde */
    R(g, x - 1, y - 1, 3, h - 2, '#d9737f'); R(g, x + w - 2, y - 1, 3, h - 2, '#d9737f'); R(g, x + 1, y - 1, 1, h - 2, '#b85c68'); R(g, x + w, y - 1, 1, h - 2, '#b85c68');
    R(g, x - 3, y - 2, w + 6, 1, HAT);
  }
  function kanepe(g, x, F, w, c, c2){ kutu(g, x + 2, F - 12, w - 4, 7, c); kutu(g, x + 3, F - 7, w - 6, 5, tonla(c, 1.08)); kutu(g, x, F - 9, 4, 8, c); kutu(g, x + w - 4, F - 9, 4, 8, c); R(g, x + 2, F - 1, 2, 1, HAT); R(g, x + w - 4, F - 1, 2, 1, HAT); if(c2) kutu(g, x + 5, F - 10, 5, 4, c2); }
  function lambader(g, x, F){ kutu(g, x, F - 25, 7, 5, '#f0d9a0'); R(g, x + 3, F - 20, 1, 19, HAT); R(g, x + 1, F - 1, 5, 1, HAT); }

  /* Duygu balonu ara ara çıkar; kim olduğunu huy belirler */
  const duygu = (ad, x, y, once, sure, sonra) => rutin(null, x, y, [['gizli', once], [ad, sure], ['gizli', sonra]]);
  const ruh = (kisi, x, y) => duygu('b_' + kisi.huy, x, y, 6 + SAKIN.indexOf(kisi) * 2, 4, 12);
  const ODA = {
    /* Salon: kanepe, okuma koltuğu, televizyon */
    salon:{ g:62, duvar:'#f0c0b0', alt:'#dfa593', desen:'cizgi',
      ciz(g, X, F, P){ tablo(g, X + 6, F - 25, 15, 9); kanepe(g, X + 1, F, 26, '#7d6a8a', '#e8b45a'); pencere(g, X + 30, F - 28, P); kanepe(g, X + 28, F, 13, '#a0523f'); kutu(g, X + 44, F - 16, 16, 10, '#2c2a3d'); kutu(g, X + 43, F - 6, 18, 6, AHSAP); R(g, X + 51, F - 5, 1, 4, HAT); R(g, X + 28, F, 32, 1, TOPRAK); },
      hayat(X, F, k, v, il, uyku){
        const [a, b] = k;
        if(!a) return [];
        if(uyku) return [rutin(a, X + 7, F - 6, [['yat', 30]]), rutin(null, X + 10, F - 12, [['z', 30]])];
        const tv = rutin(null, X + 45, F - 7, [['tv', 30]]);
        if(b) return [tv, rutin(a, X + 6, F, [['otur', 30, undefined, false]]), rutin(b, X + 15, F, [['otur', 30, undefined, false]]), duygu('b_' + il, X + 10, F - 15, 5, 5, 10)];
        return [tv, rutin(a, X + 30, F, [['oku', 40, undefined, false]]), ruh(a, X + 33, F - 15)];
      } },
    /* Mutfak: dolaplar, ocak, kahve makinesi, buzdolabı, küçük masa */
    mutfak:{ g:76, duvar:'#fbdcb0', alt:'#f0c493', desen:'fayans',
      ciz(g, X, F){ for(let x = 0; x < 32; x += 8) kutu(g, X + 2 + x, F - 26, 9, 8, AHSAP); R(g, X + 9, F - 22, 1, 2, HAT); R(g, X + 17, F - 22, 1, 2, HAT); R(g, X + 25, F - 22, 1, 2, HAT); kutu(g, X + 2, F - 9, 33, 2, KREM); for(let x = 0; x < 32; x += 8){ kutu(g, X + 2 + x, F - 8, 9, 8, AHSAP); R(g, X + 5 + x, F - 5, 3, 1, HAT); }
        kutu(g, X + 4, F - 14, 7, 5, '#3a3244'); R(g, X + 5, F - 12, 5, 2, TOPRAK); R(g, X + 14, F - 10, 7, 1, HAT); R(g, X + 17, F - 13, 1, 3, METAL); R(g, X + 17, F - 13, 3, 1, METAL); kutu(g, X + 26, F - 13, 6, 4, '#5f86a8');
        kutu(g, X + 36, F - 25, 13, 25, '#e4e8e6'); R(g, X + 37, F - 15, 11, 1, HAT); R(g, X + 38, F - 22, 1, 5, METAL); R(g, X + 38, F - 13, 1, 6, METAL);
        sandalye(g, X + 52, F); masa(g, X + 59, F, 16); kutu(g, X + 63, F - 9, 5, 3, KREM); bitki(g, X + 66, F - 6); },
      hayat(X, F, k, v, il){
        const [a, b] = k;
        if(!a) return [];
        const s = [rutin(null, X + 6, F - 14, [['buhar', 30]])];
        if(v === 'gece') return s.concat(rutin(a, X + 16, F, [['ic', 20, undefined, false]]));
        s.push(rutin(a, X + 52, F, [['ye', 24, undefined, false]]), duygu('b_yemek', X + 55, F - 15, 3, 5, 16));
        if(b) s.push(rutin(b, X + 16, F, [['konus', 10, undefined, false], ['yuru', 0, X + 26], ['ic', 6, undefined, false], ['yuru', 0, X + 16]]), duygu('b_' + il, X + 20, F - 15, 11, 5, 8));
        return s;
      } },
    /* Yatak odası: yatak, komodin, dolap; kedi burada yaşar */
    yatak:{ g:66, duvar:'#d2e2c6', alt:'#b8cfa9', desen:'nokta',
      ciz(g, X, F, P){ pencere(g, X + 10, F - 28, P); kutu(g, X + 1, F - 11, 3, 11, AHSAP_K); kutu(g, X + 3, F - 6, 24, 5, KREM); kutu(g, X + 10, F - 7, 17, 6, TOPRAK); R(g, X + 13, F - 6, 1, 4, '#d97a55'); R(g, X + 18, F - 6, 1, 4, '#d97a55'); R(g, X + 23, F - 6, 1, 4, '#d97a55'); kutu(g, X + 4, F - 8, 6, 3, '#fff8ea'); R(g, X + 3, F - 1, 2, 1, HAT); R(g, X + 25, F - 1, 2, 1, HAT);
        kutu(g, X + 28, F - 6, 8, 6, AHSAP); R(g, X + 31, F - 4, 2, 1, HAT); kutu(g, X + 29, F - 13, 6, 4, '#f0d9a0'); R(g, X + 32, F - 9, 1, 3, HAT);
        kutu(g, X + 49, F - 26, 16, 26, AHSAP); R(g, X + 57, F - 25, 1, 24, HAT); R(g, X + 55, F - 14, 1, 3, '#e8b45a'); R(g, X + 59, F - 14, 1, 3, '#e8b45a'); R(g, X + 37, F, 24, 1, '#5f86a8'); },
      hayat(X, F, k, v, il, uyku){
        const [a, b] = k, s = [];
        if(uyku || (v === 'gece' && a)){
          if(b) s.push(rutin(b, X + 5, F - 8, [['yat', 30]]));
          if(a) s.push(rutin(a, X + 10, F - 6, [['yat', 30]]), rutin(null, X + 12, F - 12, [['z', 30]]));
          return s.concat(rutin(null, X + 38, F, [['kedi', 30]]));
        }
        s.push(rutin(null, X + 52, F, [['kedi', 8], ['kediyuru', 0, X + 44], ['kedi', 12, undefined, true], ['kediyuru', 0, X + 52]]));
        if(a && v === 'dogum') s.push(rutin(a, X + 34, F, [['esne', 4], ['dur', 9]]));
        else if(a) s.push(rutin(a, X + 36, F, [['dur', 9.33, undefined, false], ['sev', 13.34, undefined, false]]), rutin(null, X + 44, F - 10, [['gizli', 10.33], ['kalp', 10], ['gizli', 2.34]]));
        return s;
      } },
    /* Banyo: küvet, lavabo, ayna, fayans */
    banyo:{ g:34, duvar:'#d0ecec', alt:'#b4dadb', desen:'fayans',
      ciz(g, X, F){ R(g, X + 2, F - 25, 21, 1, METAL); R(g, X + 3, F - 24, 4, 17, '#d9737f'); R(g, X + 4, F - 24, 1, 17, '#b85c68'); kutu(g, X + 1, F - 8, 22, 8, '#fbf6ea'); R(g, X + 2, F - 1, 2, 1, HAT); R(g, X + 20, F - 1, 2, 1, HAT);
        kutu(g, X + 25, F - 23, 8, 10, '#bcd8dd'); R(g, X + 27, F - 21, 1, 4, '#fff8ea'); kutu(g, X + 25, F - 9, 8, 2, '#fbf6ea'); R(g, X + 28, F - 7, 2, 7, HAT); R(g, X + 28, F - 11, 2, 2, METAL); },
      hayat(X, F, k){
        const [a] = k;
        return a ? [rutin(a, X + 8, F - 7, [['kafa', 30]]), rutin(null, X + 5, F - 7, [['kopuk', 30]]), duygu('b_nota', X + 14, F - 16, 4, 6, 10)] : [];
      } },
    /* Çalışma odası: iki masa, su sebili */
    ofis:{ g:70, duvar:'#f2e1b8', alt:'#ddc695', desen:'duz',
      ciz(g, X, F, P){ R(g, X + 9, F - 22, 18, 1, HAT); raf(g, X + 9, F - 26, 18); pencere(g, X + 34, F - 28, P); [2, 33].forEach(d => { sandalye(g, X + d, F); masa(g, X + d + 7, F, 17); ekran(g, X + d + 11, F); }); kutu(g, X + 60, F - 13, 7, 13, '#dfe6e6'); kutu(g, X + 61, F - 18, 5, 6, '#9ec6d6'); },
      hayat(X, F, k, v, il, uyku){
        const [a, b] = k, s = [];
        if(a) s.push(rutin(null, X + 14, F - 8, [['ekran', 40]]));
        if(a && uyku) s.push(rutin(a, X + 2, F, [['uyu', 30]]), rutin(null, X + 6, F - 14, [['z', 30]]));
        else if(a) s.push(rutin(a, X + 2, F, [['yaz', 26, undefined, false], ['yuru', 0, X + 24], ['esne', 2], ['ic', 7, undefined, false], ['yuru', 0, X + 2], ['yaz', 6, undefined, false]]), ruh(a, X + 6, F - 15));
        if(b) s.push(rutin(null, X + 45, F - 8, [['ekran', 40]]), rutin(b, X + 33, F, [['yaz', 40, undefined, false]]));
        return s;
      } },
    /* Kütüphane: tam boy raf, merdiven, okuma koltuğu */
    kutuphane:{ g:66, duvar:'#a06e58', alt:'#865844', desen:'ahsap',
      ciz(g, X, F){ kutu(g, X + 14, F - 28, 36, 28, '#5a3a30'); for(let i = 0; i < 4; i++) raf(g, X + 15, F - 27 + i * 7, 34); R(g, X + 44, F - 27, 1, 27, '#d3a475'); R(g, X + 48, F - 27, 1, 27, '#d3a475'); for(let y = F - 25; y < F; y += 3) R(g, X + 44, y, 5, 1, '#d3a475'); kanepe(g, X, F, 13, '#a0523f'); lambader(g, X + 54, F); },
      hayat(X, F, k){
        const [a, b] = k, s = [];
        if(a) s.push(rutin(a, X + 2, F, [['oku', 40, undefined, false]]), ruh(a, X + 5, F - 15));
        if(b) s.push(rutin(b, X + 51, F, [['dur', 8], ['yuru', 0, X + 26], ['dur', 6], ['esne', 2], ['yuru', 0, X + 51], ['dur', 3]]));
        return s;
      } },
    /* Atölye: şövale, boya masası */
    atolye:{ g:64, duvar:'#cdd2ea', alt:'#b4bbd8', desen:'duz',
      ciz(g, X, F){ kutu(g, X + 19, F - 22, 18, 14, '#f3e8d0'); R(g, X + 20, F - 16, 16, 3, '#ef916b'); R(g, X + 20, F - 13, 16, 4, '#6a4470'); daire(g, X + 31, F - 17, 2, '#ffeeb0'); R(g, X + 20, F - 8, 2, 8, HAT); R(g, X + 34, F - 8, 2, 8, HAT); R(g, X + 18, F - 8, 20, 1, HAT);
        masa(g, X + 42, F, 18); kutu(g, X + 44, F - 9, 4, 3, TOPRAK); kutu(g, X + 49, F - 9, 4, 3, '#5f86a8'); R(g, X + 55, F - 11, 1, 5, '#d3a475'); R(g, X + 42, F - 20, 18, 1, HAT); [0, 6, 12].forEach((d, i) => kutu(g, X + 43 + d, F - 24, 5, 4, ['#c2603f', '#e8b45a', '#5f86a8'][i])); },
      hayat(X, F, k){
        const [a] = k;
        return a ? [rutin(a, X + 10, F, [['firca', 22, undefined, false], ['yuru', 0, X + 2], ['dur', 5], ['yuru', 0, X + 10]]), duygu('b_nota', X + 13, F - 15, 6, 5, 12)] : [];
      } },
  };
  /* Evler: kapıyla bağlı odalar; yer yetmezse sondaki oda düşer */
  const EVLER = [['salon', 'banyo', 'yatak'], ['mutfak', 'yatak'], ['yatak', 'ofis'], ['ofis', 'banyo', 'yatak'], ['mutfak', 'atolye'], ['yatak', 'banyo', 'kutuphane']];
  /* Günün planı: iki kişilik ev. Sabah banyo ve kahvaltı, öğlen iş ve yemek, akşam birlikte, gece uyku.
     Her evde gece kuşu yok: çift sıradaki evlerde biri geç saate kadar uyanık. */
  function gunPlani(tipler, a, b, v, sira){
    const yer = (...adlar) => adlar.find(t => tipler.includes(t)) || tipler[0], plan = {};
    const koy = (t, kisi, uyku) => { const q = plan[t] || (plan[t] = { k:[], uyku:false }); q.k.push(kisi); if(uyku) q.uyku = true; };
    if(v === 'gece'){
      koy(yer('yatak', 'salon'), a, true);
      if(sira % 2) koy(yer('yatak', 'salon'), b, true); else { const t = yer('ofis', 'kutuphane', 'atolye', 'salon', 'mutfak'); koy(t, b, sira % 4 === 0 && (t === 'ofis' || t === 'salon')); }
    } else if(v === 'dogum'){
      koy(yer('banyo', 'yatak'), a);
      koy(yer('mutfak', 'salon', 'yatak'), b);
    } else if(v === 'ogle'){
      const is = ['ofis', 'atolye', 'kutuphane'].find(t => tipler.includes(t));
      if(is) koy(is, a);   // işyeri evde değilse dışarıdadır
      koy(yer('mutfak', 'salon', 'yatak'), b);
    } else {
      const t = sira % 2 ? yer('salon', 'mutfak', 'yatak') : yer('mutfak', 'salon', 'yatak');
      koy(t, a); koy(t, b);
    }
    return plan;
  }
  const ILISKI = ['kalp', 'gul', 'kiz'];

  /* ---------- YERLEŞİM: saf. Ortada asansör, iki yanında koridor, dışta evler; üstte teras, altta sokak ---------- */
  function odaBol(tipler, x, en){
    const liste = [];
    let k = x;
    for(const tip of tipler){ if(k + ODA[tip].g > x + en && liste.length) break; liste.push({ tip, x:k, w:ODA[tip].g }); k += ODA[tip].g; }
    const pay = Math.floor((x + en - k) / liste.length);
    liste.forEach((o, j) => { o.x += pay * j; o.w = j === liste.length - 1 ? x + en - o.x : o.w + pay; });
    return liste;
  }
  function yerlesim(W, H, v){
    const gece = v === 'gece';
    const dar = W < DAR, n = Math.max(1, Math.floor((H - 22 - ILK_KAT) / KAT)), sokak = ILK_KAT + n * KAT;
    const ax = dar ? W - ASANSOR : Math.floor((W - ASANSOR) / 2), solSon = dar ? ax : ax - KORIDOR, sagBas = ax + ASANSOR + KORIDOR;
    const f1 = Math.min(1, n - 1), f2 = Math.max(0, n - 2), P = PALET[v], lamba = [], odalar = [];
    let s = 0;
    const zemin = { tip:'zemin', x:0, y:ILK_KAT + (n - 1) * KAT, w:W, h:H - ILK_KAT - (n - 1) * KAT, sakin:[] }, bolgeler = [];
    for(let k = 0; k < n; k++){
      const y = ILK_KAT + k * KAT, F = y + KAT - 4;
      (dar ? [0] : [0, 1]).forEach(yan => {
        const x = yan ? sagBas : 0, en = yan ? W - sagBas : solSon, ev = EVLER[(k * 2 + yan * 3) % EVLER.length];
        const faz = (k * 37 + yan * 13) % 41, sira = k * 2 + yan;
        const bolge = k === n - 1 ? zemin : { tip:'ev', x:yan ? ax + ASANSOR : 0, y, w:yan ? W - ax - ASANSOR : ax, h:F + 2 - y, sakin:[] };
        const a = SAKIN[s++ % SAKIN.length], b = SAKIN[s++ % SAKIN.length], bolum = odaBol(ev, x, en), plan = gunPlani(bolum.map(q => q.tip), a, b, v, sira);
        bolum.forEach((o, j) => {
          const X = o.x + Math.floor((o.w - ODA[o.tip].g) / 2), q = plan[o.tip] || { k:[], uyku:false };
          const sonuk = v === 'ogle' || !q.k.length || q.uyku;
          odalar.push({ tip:o.tip, x:o.x, y, w:o.w, F, X, sonuk, ilk:j === 0 });
          ODA[o.tip].hayat(X, F, q.k, v, ILISKI[sira % 3], q.uyku).forEach(r => { r.faz = faz + j * 7; bolge.sakin.push(r); });
          if(!sonuk) lamba.push({ x:o.x + Math.floor(o.w / 2), y:y + 3, r:Math.max(o.w * 0.62, 26), k:[o.x, y, o.w, F + 2 - y] });
        });
        if(bolge !== zemin) bolgeler.push(bolge);
        if(!dar && v !== 'ogle') lamba.push({ x:yan ? ax + ASANSOR + 9 : ax - 9, y:y + 3, r:20, k:[yan ? ax + ASANSOR : solSon, y, KORIDOR, F + 2 - y] });
      });
    }
    const o = { W, H, ax, dar, sokak, n, f1, f2, solSon, sagBas, gece, odalar, bolgeler, cati:catiYap(W, v), zemin, lamba, P, vakit:v };
    sokakYap(o);
    o.asansor = asansorYap(o);
    return o;
  }
  /* Teras: sohbet, çamaşır, kuş, bulut; asansör buraya da çıkar. */
  function catiYap(W, v){
    const gece = v === 'gece';
    const T = TERAS, s = [], yer = f => Math.round(W * f), genis = W >= DAR;
    const B = 'bulut';
    s.push(rutin(null, -16, 6, [[B, 90, W + 2, false], ['gizli', 10]]));
    s.push(rutin(null, W + 2, 9, [['gizli', 30], [B, 110, -16, false]]));
    if(gece) [[0.1, 1], [0.62, 0], [0.88, 2]].forEach((q, i) => s.push(rutin(null, yer(q[0]), q[1] + 3, [['yildiz', 3 + i]])));
    if(genis){
      s.push(rutin(SAKIN[7], yer(0.16), T, [['ic', 12, undefined, false], ['konus', 8, undefined, false]]));
      s.push(rutin(SAKIN[3], yer(0.16) + 12, T, [['konus', 12, undefined, true], ['dur', 8]]));
      s.push(duygu('b_kalp', yer(0.16) + 6, T - 15, 4, 5, 11));
      s.push(rutin(null, yer(0.33), T - 9, [['camasir', 20]]));
      s.push(rutin(null, yer(0.84), T - 4, [['kus', 12]]));
    }
    for(let i = 0; i * 14 < W - 8; i++) s.push(rutin(null, 6 + i * 14, 3 + (i % 2), [['ampul', 3 + (i % 3)]]));
    return { tip:'cati', x:0, y:0, w:W, h:T + 2, sakin:s };
  }
  function sokakYap(o){
    const { W, H, sokak, zemin } = o;
    zemin.sakin.push(rutin(SAKIN[4], -10, sokak + 4, [['gizli', 6], ['yuru', 0, W + 10], ['gizli', 20]]));
    if(!o.gece) zemin.sakin.push(rutin(SAKIN[0], W + 10, sokak + 5, [['gizli', 30], ['yuru', 0, -10], ['gizli', 6]]));
    zemin.sakin.push(rutin(null, -24, H - 3, [['gizli', 13], ['araba', W / 40 + 1, W + 24, false], ['gizli', 28]]));
  }
  /* Asansör ve iki yolcunun hikâyesi tek saatten kurulur: biri terasa çıkıp saksı sular, biri sokaktan eve gelip gider. */
  function asansorYap(o){
    const { ax, n, f1, f2, sokak, dar, zemin, cati, bolgeler } = o, X = SAKIN[2], Y = SAKIN[6], z = n - 1, x = ax + 1;
    const dip = k => (k === 't' ? TERAS + 1 : ILK_KAT + k * KAT + KAT - 3);
    const duraklar = [[z, 5, Y, null], [f1, 6, null, X], ['t', 20, X, X], [f1, 5, X, null], [z, 6, null, Y], [f2, 14, Y, Y]];
    const seg = [], an = [];
    let t = 0, py = dip(f2);
    const koy = (poz, kisi, s, y0, y1) => { seg.push({ poz, kisi, t0:t, t1:t + s, x0:x, x1:x, y0, y1, ters:false }); t += s; };
    duraklar.forEach((d, i) => {
      const y = dip(d[0]), gelen = duraklar[(i + duraklar.length - 1) % duraklar.length][3];
      koy(gelen ? 'kabinK' : 'kabin', gelen, Math.abs(y - py) / 12 || 0.1, py, y);
      const a = t, b = t + d[1];
      if(d[2]) koy('kabinK', d[2], 0.6, y, y);
      koy('kabin', null, b - t - (d[3] ? 0.6 : 0), y, y);
      if(d[3]) koy('kabinK', d[3], 0.6, y, y);
      an.push([a, b]); py = y;
    });
    const T = t, bolge = (k, yan) => (k === z ? zemin : bolgeler.find(b => b.y === ILK_KAT + k * KAT && (yan && !dar ? b.x > ax : b.x < ax)));
    const ek = (b, a) => { a.faz = 0; b.sakin.push(a); };
    const sol = ax - 9, hedefX = sol - 36, w = (sol - hedefX) / HIZ, sag = ax + ASANSOR, hedefY = dar ? hedefX : sag + 36, kapiY = dar ? sol : sag;
    const xBin = an[1][1] - 0.6, xCik = an[3][0] + 0.6;
    ek(bolge(f1, 0), rutin(X, hedefX, dip(f1) - 1, [['dur', xBin - w, undefined, false], ['yuru', 0, sol], ['gizli', xCik - xBin], ['yuru', 0, hedefX], ['dur', T - xCik - w, undefined, false]]));
    const tBas = an[2][0] + 0.6, tSon = an[2][1] - 0.6, tw = 28 / HIZ;
    ek(cati, rutin(X, sol, TERAS, [['gizli', tBas], ['yuru', 0, sol - 28], [o.gece ? 'dur' : 'sula', tSon - tBas - tw * 2, undefined, true], ['yuru', 0, sol], ['gizli', T - tSon]]));
    const yBas = an[5][0] + 0.6, ySon = an[5][1] - 0.6;
    ek(bolge(f2, 1), rutin(Y, kapiY, dip(f2) - 1, [['gizli', yBas], ['yuru', 0, hedefY], ['dur', ySon - yBas - w * 2], ['yuru', 0, kapiY], ['gizli', T - ySon]]));
    const sBas = an[0][0] + 0.6, sSon = an[4][1] - 0.6, sw = 14 / HIZ + 2;
    ek(zemin, rutin(Y, sol, dip(z) - 1, [['gizli', sBas], ['yuru', 0, sol - 14], ['yuru', 2, sol - 26, undefined, sokak + 4], ['dur', sSon - sBas - sw * 2], ['yuru', 2, sol - 14, undefined, dip(z) - 1], ['yuru', 0, sol], ['gizli', T - sSon]]));
    return { tip:'asansor', x:ax, y:0, w:ASANSOR, h:sokak, sakin:[{ kisi:null, seg, T, faz:0 }] };
  }

  /* ---------- SABİT SAHNE: yalnız hazırlıkta bir kez ---------- */
  function gokCiz(g, o){
    const { W, P } = o, n = P.gok.length - 1, boy = TERAS + 2;
    for(let y = 0; y < boy; y++){
      const f = y / boy * n, i = Math.floor(f), k = f - i;
      R(g, 0, y, W, 1, P.gok[k < 0.5 ? i : Math.min(n, i + 1)]);
      if(k > 0.3 && k < 0.7){ g.fillStyle = P.gok[k < 0.5 ? Math.min(n, i + 1) : i]; for(let x = y & 1; x < W; x += 2) g.fillRect(x, y, 1, 1); }
    }
    const sx = Math.round(W * P.gunesYeri[0]), sy = P.gunesYeri[1], r = P.gunesYeri[2];
    daire(g, sx, sy, r + 2, P.hale);
    daire(g, sx, sy, r, P.gunes);
    if(o.gece){
      daire(g, sx + 2, sy - 1, 2, P.gok[1]);
      const a = tohum(7); for(let i = 0; i < W / 9; i++) R(g, a() * W, a() * 10, 1, 1, a() < 0.2 ? '#ffffff' : '#c9c6e8');
    }
    const b = tohum(11);
    for(let i = 0; i < W / 70; i++){ const w = 14 + b() * 30, x = b() * W, y = 2 + b() * 6; R(g, x, y, w, 1, P.bulut1); R(g, x + 3, y + 1, w - 6, 1, P.bulut2); }
    const dip = TERAS + 2;
    [[P.uzak, 5, 8, 3], [P.yakin, 3, 4, 9]].forEach(q => {
      const a = tohum(q[3]);
      for(let x = -4; x < W;){ const w = 10 + Math.floor(a() * 18), h = q[1] + Math.floor(a() * q[2]); R(g, x, dip - h, w, h, q[0]); for(let wy = dip - h + 1; wy < dip - 1; wy += 3) for(let wx = x + 2; wx < x + w - 2; wx += 3) if(a() < 0.14) R(g, wx, wy, 1, 1, P.pencere); x += w; }
    });
  }
  function agac(g, x, F, r){
    R(g, x - 2, F - 12, 5, 12, HAT); R(g, x - 1, F - 12, 3, 12, AHSAP_K); R(g, x + 1, F - 12, 1, 12, '#5a3a35');
    const y = F - 12 - r;
    daire(g, x, y, r + 1, HAT);
    daire(g, x, y, r, '#4c6f45'); daire(g, x - 1, y - 1, r - 2, '#6a8f52'); daire(g, x - 2, y - 2, Math.max(1, r - 4), '#8ab060');
  }
  function direk(g, x, F, gece, lamba){
    R(g, x, F - 26, 1, 26, HAT); R(g, x - 1, F - 1, 3, 1, HAT); R(g, x, F - 27, 5, 1, HAT); kutu(g, x + 3, F - 27, 5, 4, gece ? '#ffe6a0' : '#d9d3c6');
    lamba.push({ x:x + 5, y:F - 23, r:22, k:[x - 28, F - 46, 66, 70] });
  }
  /* Duvar: desen, pervaz, süpürgelik, derinlik için önde iki sıra zemin */
  function duvarCiz(g, x, y, w, h, renk, alt, desen){
    R(g, x, y, w, h, renk);
    const k = tonla(renk, 0.95);
    if(desen === 'cizgi') for(let i = x + 2; i < x + w; i += 4) R(g, i, y, 1, h - 8, k);
    if(desen === 'fayans') for(let j = y + 1; j < y + h - 8; j += 3){ R(g, x, j, w, 1, k); for(let i = x + (j % 2 ? 2 : 0); i < x + w; i += 4) R(g, i, j, 1, 3, k); }
    if(desen === 'ahsap') for(let i = x + 1; i < x + w; i += 6) R(g, i, y, 1, h, k);
    if(desen === 'nokta') for(let j = y + 2; j < y + h - 8; j += 4) for(let i = x + (j % 8 < 4 ? 1 : 3); i < x + w; i += 4) R(g, i, j, 1, 1, k);
    R(g, x, y + h - 8, w, 7, alt); R(g, x, y + h - 8, w, 1, tonla(alt, 1.14)); for(let i = x + 4; i < x + w; i += 12) R(g, i, y + h - 6, 1, 4, tonla(alt, 0.9));
    R(g, x, y + h - 1, w, 1, HAT);
    R(g, x, y + h, w, 2, '#a07a60'); R(g, x, y + h, w, 1, '#b8927a'); for(let i = x + 3; i < x + w; i += 9) R(g, i, y + h + 1, 1, 1, '#7a5a46');
    R(g, x, y, w, 2, '#00000026');
  }
  /* Bölme: üstte duvar, altta kapı boşluğu ve kasası */
  function bolme(c, x, y, F){ R(c, x, y, 2, F - y - 16, DOSEME); R(c, x - 1, F - 16, 4, 1, HAT); R(c, x - 1, F - 15, 1, 15, AHSAP_K); R(c, x + 2, F - 15, 1, 15, AHSAP_K); }
  function koridorCiz(c, x, y, F, sagda){
    duvarCiz(c, x, y, KORIDOR, F - y, '#d7c3a0', '#bfa883', 'cizgi');
    bolme(c, sagda ? x + KORIDOR - 1 : x - 1, y, F);
    /* Asansör kapısı */
    const ic = sagda ? x : x + KORIDOR - 3;
    R(c, ic, F - 18, 3, 18, HAT); R(c, ic + 1, F - 17, 1, 17, METAL);
    R(c, sagda ? x + 4 : x + KORIDOR - 6, F - 11, 1, 2, '#e8b45a');
    const m = x + Math.floor(KORIDOR / 2);
    R(c, m, y, 1, 2, HAT); kutu(c, m - 2, y + 2, 5, 3, '#ffe6a0');
    R(c, x + 3, F, KORIDOR - 6, 1, TOPRAK);
  }
  function terasCiz(c, o){
    const { W, ax } = o, T = TERAS, yer = f => Math.round(W * f), genis = W >= DAR;
    R(c, 0, T, W, 2, '#8a6450'); R(c, 0, T, W, 1, '#b08b70');
    if(genis){
      const d = yer(0.03);
      kutu(c, d, T - 11, 13, 8, '#8a6a56'); R(c, d + 1, T - 3, 2, 3, HAT); R(c, d + 10, T - 3, 2, 3, HAT);
      const k = yer(0.33);
      R(c, k - 1, T - 11, 1, 11, HAT); R(c, k + 10, T - 11, 1, 11, HAT); R(c, k - 1, T - 10, 12, 1, HAT);
      R(c, yer(0.93), T - 15, 1, 15, HAT); R(c, yer(0.93) - 3, T - 13, 7, 1, HAT); R(c, yer(0.93) - 2, T - 15, 5, 1, HAT);
    }
    (genis ? [0.1, 0.26, 0.42, 0.56, 0.68, 0.8] : [0.08, 0.4]).forEach(f => { const x = yer(f); kutu(c, x, T - 4, 7, 4, TOPRAK); R(c, x, T - 7, 7, 3, HAT); R(c, x + 1, T - 7, 5, 3, '#6a8f52'); R(c, x + 1, T - 8, 5, 1, HAT); R(c, x + 2, T - 7, 3, 1, '#8ab060'); });
    R(c, 0, T - 4, W, 1, HAT);
    for(let x = 0; x < W; x += 6) R(c, x, T - 3, 1, 3, HAT);
    R(c, 0, 2, W, 1, HAT);
    /* Asansör başı */
    R(c, ax - 2, 0, ASANSOR + 4, T, HAT); R(c, ax - 1, 1, 1, T - 1, '#a06a4c'); R(c, ax + ASANSOR, 1, 1, T - 1, '#7d5540');
  }
  function binaCiz(g, o){
    const { W, H, P, ax, sokak, solSon, dar, n, gece } = o;
    gokCiz(g, o);
    /* Bina ve sokak ayrı tuvalde: ışık yalnız bunlara düşer */
    const on = document.createElement('canvas'); on.width = W; on.height = H;
    const c = on.getContext('2d', { willReadFrequently:true });
    R(c, 0, sokak, W, 6, '#a58c7a'); R(c, 0, sokak, W, 1, '#c2a892'); for(let x = 3; x < W; x += 12) R(c, x, sokak, 1, 6, '#8c7666');
    R(c, 0, sokak + 6, W, 1, '#6a5a58'); R(c, 0, sokak + 7, W, H - sokak - 7, '#544b5a');
    for(let x = 6; x < W; x += 22) R(c, x, Math.floor((sokak + 7 + H) / 2), 10, 1, '#c9b98e');
    terasCiz(c, o);
    o.odalar.forEach(a => {
      const T = ODA[a.tip];
      duvarCiz(c, a.x, a.y, a.w, a.F - a.y, T.duvar, T.alt, T.desen);
      T.ciz(c, a.X, a.F, P);
      const m = a.x + Math.floor(a.w / 2);
      R(c, m, a.y, 1, 2, HAT); kutu(c, m - 3, a.y + 2, 7, 3, a.sonuk ? '#7a7680' : '#ffe6a0');
      if(!a.ilk) bolme(c, a.x - 1, a.y, a.F);
    });
    for(let k = 0; k < n; k++){
      const y = ILK_KAT + k * KAT, F = y + KAT - 4;
      if(!dar){ koridorCiz(c, solSon, y, F, false); koridorCiz(c, ax + ASANSOR, y, F, true); }
      R(c, 0, F + 2, W, 2, DOSEME); R(c, 0, F + 2, W, 1, '#8a5f4c');
    }
    R(c, ax, TERAS, ASANSOR, sokak - TERAS, '#3a2a2e'); R(c, ax + 1, TERAS, 1, sokak - TERAS, '#4c3a3c'); R(c, ax + ASANSOR - 2, TERAS, 1, sokak - TERAS, '#4c3a3c'); R(c, ax + 6, TERAS, 1, sokak - TERAS, '#2a1e22');
    for(let k = 0; k < n; k++){ const F = ILK_KAT + k * KAT + KAT - 4; R(c, ax, F + 2, ASANSOR, 2, DOSEME); R(c, ax + 5, F - 24, 3, 1, '#e8b45a'); }
    if(!dar){
      [0.06, 0.2, 0.8, 0.94].forEach(f => agac(c, Math.round(W * f), sokak + 3, 6));
      [0.34, 0.66].forEach(f => direk(c, Math.round(W * f), sokak + 3, gece, o.lamba));
      [0.13, 0.87].forEach(f => { const x = Math.round(W * f); kutu(c, x, sokak - 1, 16, 3, AHSAP); R(c, x + 2, sokak + 2, 1, 2, HAT); R(c, x + 13, sokak + 2, 1, 2, HAT); });
    }
    isikla(c, o);
    g.drawImage(on, 0, 0);
  }
  /* Tek geçişlik ışık: lamba odanın duvarından taşmaz; dört basamak, yalnız sınırda ince titreşim. */
  function isikla(c, o){
    const { W, H, P } = o, d = c.getImageData(0, 0, W, H), a = d.data, l = new Float32Array(W * H);
    o.lamba.forEach(q => {
      const r = q.r, x0 = Math.max(0, q.k[0]), x1 = Math.min(W, q.k[0] + q.k[2]), y0 = Math.max(0, q.k[1]), y1 = Math.min(H, q.k[1] + q.k[3]);
      for(let y = y0; y < y1; y++) for(let x = x0; x < x1; x++){ const v = 1 - Math.hypot((x - q.x) * 0.75, y - q.y) / r; if(v > l[y * W + x]) l[y * W + x] = v; }
    });
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
      const i = (y * W + x) * 4;
      if(!a[i + 3]) continue;
      const q = Math.min(1, Math.floor(l[y * W + x] * 5 + 0.3 + BAYER[(x & 3) + (y & 3) * 4] * 0.4) / 4);
      for(let n = 0; n < 3; n++) a[i + n] = Math.min(255, a[i + n] * (P.amb[n] + (P.isik[n] - P.amb[n]) * q));
    }
    c.putImageData(d, 0, 0);
  }

  /* Karede yalnız değişen bölge: önce sabit hâli, üstüne sakinleri. Geniş bölge asansörü de siler; o da yeniden çizilir. */
  function kare(g, arka, o, t){
    if(!o.cizildi){ g.drawImage(arka, 0, 0); o.cizildi = true; }
    let yenilenen = 0;
    const tum = o.tum || (o.tum = [o.cati, o.zemin, o.asansor].concat(o.bolgeler).filter(a => a.sakin.length));
    for(let j = 0; j < tum.length; j++){
      const a = tum[j], kareler = a.sakin.map(s => kareAl(s, t + (s.faz || 0)));
      const imza = kareler.map(k => (k ? k.poz + k.i + ',' + k.x + ',' + k.y : '-')).join('|');
      if(imza === a.imza) continue;
      a.imza = imza; yenilenen++;
      if(a.w === o.W) o.asansor.imza = '';
      g.drawImage(arka, a.x, a.y, a.w, a.h, a.x, a.y, a.w, a.h);
      kareler.forEach(k => { if(k) g.drawImage(gorsel(k.poz, k.i, k.kisi, k.ters, o.vakit), k.x, k.y); });
    }
    return yenilenen;
  }

  L.PIKSEL_APARTMAN = Object.freeze({ vakit, yerlesim, gunPlani, binaCiz, kare, kareAl, ODA, EVLER, POZ, PALET, KAT, TERAS, ILK_KAT, KORIDOR, ASANSOR });
})(window.LIFEOS);
