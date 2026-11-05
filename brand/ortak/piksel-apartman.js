/* PİKSEL APARTMAN — piksel temasının arka planı: önü açık bir bina. Ortada asansör, iki yanında koridor,
   dışta evler (her ev kapıyla bağlı odalar); üstte teras, altta sokak. Kart ve menü önünde durur;
   uzun süre işlem yapılmazsa çekilir, bütün sahne görünür (piksel.js).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/piksel-apartman.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır.

   Sözler:
     1. SÜSTÜR. Sakinler kurgudur: kullanıcıyı ya da modülü temsil etmez; veri okumaz, sayı üretmez.
        Tek istisna King'in odası (depo sahibinin isteği, 2026-11-05): pembe aksolot orada yaşar, o da veri okumaz.
     2. KODLA ÇİZİLİR. Görsel dosyası yok; çevrimdışı ve tek dosyada çalışır.
     3. EKRANI YORMAZ. Sahne bir kez ayrı tuvale çizilir; karede yalnız içinde bir şey değişen kat yenilenir.
     4. KARE SAATTEN HESAPLANIR. Saklı durum yok: aynı t aynı kareyi verir, hareketsiz kipte tek kare çizilir. */
window.LIFEOS = window.LIFEOS || {};

(function(L){
  const KAT = 34, TERAS = 30, SOKAK = 28, HIZ = 7, ASANSOR = 13, KORIDOR = 18, DAR = 200;
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

  /* ---------- SAKİNLER: on bir piksel eninde, on altı boyunda; saç, yüz, giysi ve boy katmanla kurulur.
     Otuz altı kişinin hiçbiri ötekinin aynısı değil. Ruh hâli vakte göre değişir, yüzde ve balonda görünür. ---------- */
  const TEN = ['#f6d3ae', '#e0ad82', '#eebf95', '#a8703f', '#c8905f', '#7a4f33'];
  const SAC = ['#3b2a24', '#1f1a22', '#7a4a26', '#a5612f', '#d9a94f', '#c9743a', '#d9d3c6', '#6b3a5a', '#2f4a6a'];
  const UST = ['#c2603f', '#5f86a8', '#7fa35a', '#8a5f96', '#e8b45a', '#e6dcc6', '#3f8f8a', '#d9737f', '#4a5a7a', '#b8584a', '#f0a060', '#6a8f52', '#9a7ad0'];
  const ALT = ['#3f3a55', '#4a3b34', '#39425a', '#5a4a3e', '#2f3548', '#54403a', '#34384e'];
  const SACLAR = ['kisa', 'uzun', 'kakul', 'topuz', 'kivircik', 'at', 'afro', 'yana', 'dazlak', 'kep', 'ortali', 'bere'];
  const GIYIM = ['kazak', 'cizgili', 'elbise', 'tulum', 'ceket', 'onluk', 'kazak'];
  const EK = [null, 'gozluk', null, 'sakal', null, 'kupe', null, 'biyik', 'fiyonk', null, 'gozluk', null];
  const BOY = [0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 0, 2];
  const SAKIN = Array.from({ length:36 }, (_, i) => {
    const boy = BOY[i % 12], h = SAC[i % 9];
    return { i, boy, h, s:TEN[i % 6], g:UST[(i * 7) % 13], p:ALT[i % 7], a:UST[(i * 3 + 5) % 13], sac:SACLAR[(i * 5) % 12], giyim:GIYIM[(i * 5 + 2) % 7],
      ek:boy === 2 ? null : EK[(i * 7) % 12], hiz:boy === 2 ? 1.25 : h === '#d9d3c6' ? 0.8 : 1 };
  });
  const SIRA = { dogum:0, ogle:1, batim:2, gece:3 }, RUHLAR = ['nese', 'gul', 'sakin', 'asik', 'uz', 'kiz', 'uyku', 'gul'], BALONU = { nese:'gul', gul:'gul', sakin:'nota', asik:'kalp', uz:'uz', kiz:'kiz', uyku:'uyku' };
  const ruhu = (k, v) => (v === 'dogum' && k.i % 3 === 0 ? 'uyku' : RUHLAR[(k.i * 3 + SIRA[v] * 5) % 8]);
  const BOS = '.'.repeat(13);
  /* Vücut satırları 11 enindedir. `ust` üstteki boşluk (adımda vücut bir piksel iner), `nod` yalnız baş, `kol` başın üstüne çizilen el. */
  function G(yon, govde, o){
    o = o || {};
    const u = o.ust || 0, r = Array(2 + u + 9).fill(BOS);
    govde.forEach(q => r.push('.' + q + '.'));
    while(r.length < 18) r.push(BOS);
    r.bas = { yon, y:2 + u + (o.nod || 0), yuz:o.yuz, kol:o.kol, t:2 + u + 9 };
    return r;
  }
  const ON_T = ['..KgggggK..', '.KGgggggGK.', '.KGgggggGK.', '.KsKpppKsK.'], ON_B = ['...KpKpK...', '...KPKPK...', '...KkKkK...'];
  const Y_T = ['...KgggK...', '..KggGggK..', '..KggGggK..', '...KpsPK...'], Y_B = ['...KpPpK...', '...KpKPK...', '...KkKkk...'];
  const OT = ['...KpppppK.', '.......KPK.', '.......KkK.'];
  const UST_K = (a, b) => ['...KgggK...', a, b, '...KpppK...'];
  const DUR = G('on', ON_T.concat(ON_B)), DUR_K = G('on', ON_T.concat(ON_B), { yuz:'kirp' });
  const yY = (t, o) => G('yan', t.concat(Y_B), o), yO = (t, o) => G('yan', t.concat(OT), o);
  const JEST = ['...KgggKsK.', '..KggGGGK..', '..KggGggK..', '...KpPpK...'];
  const KOL_YUK = [[0, 7, 's'], [10, 7, 's'], [0, 8, 'G'], [10, 8, 'G'], [1, 9, 'G'], [9, 9, 'G']];
  const tvKare = s => Array.from({ length:8 }, (_, y) => Array.from({ length:14 }, (_, x) => ((x + s * 5 + (y < 4 ? 0 : 7)) % 14 < 7 ? 'T' : (y < 5 ? 'U' : 'V'))).join(''));
  const BALON = (a, b, c) => ['.KKKKKKK.', 'K' + a, 'K' + b, 'K' + c, '.KKKKKKK.', '...KK....'];
  const POZ = {
    dur:{ h:2, k:[DUR, DUR, DUR, DUR, DUR, DUR, DUR_K, DUR, DUR, DUR] },
    /* Dört kareli adım: iki yere basış (vücut iner, kol karşı yönde) ve iki geçiş */
    yuru:{ h:6, k:[
      G('yan', ['...KgggK...', '..KgGgggK..', '..KggGgKsK.', '...KpppK...', '..KPK.KpK..', '..KkK.Kkk..'], { ust:1 }),
      G('yan', Y_T.concat(['...KpPpK...', '....KpPK...', '....Kkk....'])),
      G('yan', ['...KgggK...', '..KgGgggK..', '.KsKgGggK..', '...KpppK...', '..KpK.KPK..', '..KkK.Kkk..'], { ust:1 }),
      G('yan', Y_T.concat(['...KPpPK...', '....KPpK...', '....Kkk....'])),
    ] },
    /* Konuşma: ağız açılır kapanır, el söze eşlik eder; dinleyen başını sallar */
    konus:{ h:3, k:[yY(Y_T, { yuz:'ac' }), yY(Y_T), yY(JEST, { yuz:'ac' }), yY(JEST, { yuz:'ac' }), yY(JEST), yY(Y_T, { yuz:'ac' }), yY(Y_T), yY(Y_T, { yuz:'ac' })] },
    dinle:{ h:2, k:[yY(Y_T), yY(Y_T), yY(Y_T, { nod:1 }), yY(Y_T), yY(Y_T, { yuz:'kirp' }), yY(Y_T), yY(Y_T, { nod:1 }), yY(Y_T)] },
    kapi:{ h:5, k:[yY(UST_K('..KggGGGKsK', '..KggGggK..')), yY(UST_K('..KggGGKsK.', '..KggGggK..')), yY(UST_K('..KggGGGKsK', '..KggGggK..')), yY(UST_K('..KggGGKsK.', '..KggGggK..')), yY(Y_T), yY(Y_T)] },
    el:{ h:4, k:[G('on', ['..KgggggK..', '.KGgggggKK.', '.KGgggggK..', '.KsKpppK...'].concat(ON_B), { kol:[[9, 8, 'G'], [10, 7, 's']] }), G('on', ['..KgggggK..', '.KGgggggKK.', '.KGgggggK..', '.KsKpppK...'].concat(ON_B), { kol:[[9, 8, 'G'], [9, 6, 's']] })] },
    yaz:{ h:4, k:[yO(UST_K('..KggGGGKK.', '..KgggGsss.')), yO(UST_K('..KggGGKKK.', '..KgggGGss.')), yO(UST_K('..KggGGGKK.', '..KgggGsss.')), yO(UST_K('..KggGGKKK.', '..KgggGGss.'), { yuz:'kirp' })] },
    oku:{ h:0.5, k:[yO(UST_K('..KggGGKbbK', '..KgggGsbwK')), yO(UST_K('..KggGGKbbK', '..KgggGsbwK')), yO(UST_K('..KggGGKbbK', '..KgggGsbwK'), { nod:1 })] },
    otur:{ h:1, k:[yO(UST_K('..KggGggK..', '..KggGgsK..')), yO(UST_K('..KggGggK..', '..KggGgsK..')), yO(UST_K('..KggGggK..', '..KggGgsK..'), { yuz:'kirp' })] },
    oturK:{ h:3, k:[yO(UST_K('..KggGggK..', '..KggGgsK..'), { yuz:'ac' }), yO(UST_K('..KggGggK..', '..KggGgsK..')), yO(UST_K('..KggGGKsK.', '..KggGggK..'), { yuz:'ac' }), yO(UST_K('..KggGGKsK.', '..KggGggK..'))] },
    oturD:{ h:2, k:[yO(UST_K('..KggGggK..', '..KggGgsK..')), yO(UST_K('..KggGggK..', '..KggGgsK..'), { nod:1 }), yO(UST_K('..KggGggK..', '..KggGgsK..')), yO(UST_K('..KggGggK..', '..KggGgsK..'), { yuz:'kirp' })] },
    ye:{ h:1.2, k:[yO(UST_K('..KggGGssK.', '..KggGggK..')), yO(UST_K('..KggGGssK.', '..KggGggK..')), yO(['...KgggKs..', '..KggGGsK..', '..KggGggK..', '...KpppK...'], { yuz:'ac' }), yO(UST_K('..KggGGssK.', '..KggGggK..'))] },
    ic:{ h:0.7, k:[yY(['...KgggK...', '..KggGGKCK.', '..KggGgssK.', '...KpPpK...']), yY(['...KgggK...', '..KggGGKCK.', '..KggGgssK.', '...KpPpK...']), yY(['...KgggKs..', '..KggGGsK..', '..KggGggK..', '...KpPpK...'], { kol:[[9, 6, 'C'], [9, 5, 'C']], yuz:'kirp' })] },
    esne:{ h:1, k:[G('on', ['..KgggggK..', '.KGgggggGK.', '..KgggggK..', '...KpppK...'].concat(ON_B), { yuz:'esne', kol:KOL_YUK }), G('on', ['..KgggggK..', '.KGgggggGK.', '..KgggggK..', '...KpppK...'].concat(ON_B), { yuz:'kapali', kol:KOL_YUK })] },
    uyu:{ h:1, k:[yO(UST_K('..KgggGssK.', '..KggGggK..'), { nod:2, yuz:'kapali' })] },
    sev:{ h:1.5, k:[G('yan', UST_K('..KggGGKK..', '..KggGGssK.').concat(['..KpPPPK...', '..KkKKkK...']), { ust:1 }), G('yan', UST_K('..KggGGKKK.', '..KggGGGssK').concat(['..KpPPPK...', '..KkKKkK...']), { ust:1 })] },
    firca:{ h:1.5, k:[yY(JEST), yY(UST_K('..KggGGKsK.', '..KggGggK..'))] },
    sula:{ h:1, k:[yY(UST_K('..KggGGKmK.', '..KggGgmmmK')), yY(UST_K('..KggGGKmK.', '..KggGgmmmd'))] },
    kafa:{ h:2, k:[G('on', []), G('on', []), G('on', []), G('on', [], { yuz:'kirp' }), G('on', [])] },
    yat:{ h:1, k:[['.KKKK.........', 'KhHhsK.KKKKKK.', 'KhhesKKggggGKK', 'KhcnsKggggGGpk', '.KKKKKKKKKKKKK']] },
    kopuk:{ h:1.2, k:[['.w..ww...w..w.', 'wwwwwwwwwwwwww'], ['..w...ww..w...', 'wwwwwwwwwwwwww']] },
    /* Kedi ve küçük hareketler: sakin rengi kullanmaz */
    kedi:{ h:1, k:[['........K..K.', '.K.....KOKKOK', 'KoK...KoooooK', 'KoK...KooeoeK', 'KoKKKKoollooK', 'KooooooooooK.', '.KoKoKKKoKoK.', '.KK.KK.KK.KK.'], ['........K..K.', '.......KOKKOK', '.K....KoooooK', 'KoK...KooeoeK', 'KoKKKKoollooK', 'KooooooooooK.', '.KoKoKKKoKoK.', '.KK.KK.KK.KK.']] },
    kediyuru:{ h:5, k:[['........K..K.', '.K.....KOKKOK', 'KoK...KoooooK', 'KoK...KooeoeK', 'KoKKKKoollooK', 'KooooooooooK.', '.KoKKKKKKoK..', '.KK......KK..'], ['........K..K.', '.K.....KOKKOK', 'KoK...KoooooK', 'KoK...KooeoeK', 'KoKKKKoollooK', 'KooooooooooK.', '..KKoKKoKKK..', '...KK..KK....']] },
    buhar:{ h:2.2, k:[['w..', '...', '.w.', '...'], ['...', '.w.', '...', 'w..'], ['.w.', '...', 'w..', '...']] },
    laf:{ h:2, k:[['.KKKKKKK.', 'KwwwwwwwK', 'KwewwwwwK', 'KwwwwwwwK', '.KKKKKKK.', '...KK....'], ['.KKKKKKK.', 'KwwwwwwwK', 'KwewewwwK', 'KwwwwwwwK', '.KKKKKKK.', '...KK....'], ['.KKKKKKK.', 'KwwwwwwwK', 'KwewewewK', 'KwwwwwwwK', '.KKKKKKK.', '...KK....']] },
    tak:{ h:5, k:[['w...', '.w.w', 'w...', '.w.w'], ['....', 'w...', '.w..', 'w...'], ['.w..', 'w..w', '.w..', 'w..w'], ['....', '....', '....', '....'], ['....', '....', '....', '....']] },
    kapi_k:{ h:1, k:[Array(18).fill('Oo').map((r, y) => (y === 9 ? 'Oy' : r))] },
    kapi_a:{ h:1, k:[Array(18).fill('KOooooK').map((r, y) => (y === 0 || y === 17 ? 'KKKKKKK' : y === 9 ? 'KOoooyK' : y % 6 === 3 ? 'KOOOOOK' : r))] },
    z:{ h:1, k:[['....', '....', 'zzzz', '..z.', '.z..', 'zzzz'], ['zzzz', '..z.', '.z..', 'zzzz', '....', '....'], ['....']] },
    kalp:{ h:1.5, k:[['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..', '.....'], ['.....', '.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..']] },
    tv:{ h:1.2, k:[tvKare(0), tvKare(1), tvKare(2)] },
    ekran:{ h:0.7, k:[['TTTTTTTT', 'TUUUTTTT', 'TTTTTTTT', 'TUUUUUTT', 'TTTTTTTT', 'TUUTTTTT'], ['TTTTTTTT', 'TUUUUUTT', 'TTTTTTTT', 'TUUTTTTT', 'TTTTTTTT', 'TUUUUTTT'], ['TTTTTTTT', 'TUUTTTTT', 'TTTTTTTT', 'TUUUUTTT', 'TTTTTTTT', 'TUUUTTTT']] },
    bulut:{ h:1, k:[['....CCCCC..........', '..CCCCCCCCCC...CC..', '.CCCCCCCCCCCCCCCCC.', 'CCCCCCCCCCCCCCCCCCC', '..DDDDDDDDDDDDDDD..']] },
    camasir:{ h:0.8, k:[['AAAA.wwww.BBB.xxx', 'AAAA.wwww.BBB.xxx', 'AAA..wwww.BBB..xx', 'AAA...www..B...xx'], ['AAAA.wwww.BBB.xxx', '.AAA.wwww.BBB.xxx', '.AAA..www.BB..xx.', '..A...ww..BB..x..']] },
    kus:{ h:1.3, k:[['..dd', 'dddd', '.d..'], ['..dd', 'dddd', '.d..'], ['.dd.', 'dddd', '.d..']] },
    ampul:{ h:0.6, k:[['y'], ['Y'], ['Y'], ['y']] },
    yildiz:{ h:0.5, k:[['.w.', 'www', '.w.'], ['...', '.w.', '...']] },
    b_gul:{ h:1, k:[BALON('wwewewwK', 'wewwwewK', 'wweeewwK')] },
    b_uz:{ h:1, k:[BALON('wwewewwK', 'wweeewwK', 'wewwwewK')] },
    b_kiz:{ h:1, k:[BALON('wrwwwrwK', 'wwewewwK', 'wweeewwK')] },
    b_kalp:{ h:1, k:[BALON('wwrwrwwK', 'wwrrrwwK', 'wwwrwwwK')] },
    b_nota:{ h:1, k:[BALON('wwwdddwK', 'wwwdwdwK', 'wwddwddK')] },
    b_yemek:{ h:1, k:[BALON('wwOOOwwK', 'wOOOOOwK', 'wwlllwwK')] },
    b_uyku:{ h:1, k:[BALON('wwzzzzwK', 'wwwzzwwK', 'wwzzzzwK')] },
    gizli:{ h:1, k:[[]] },
  };
  /* Evcil hayvanlar: her evde başka biri */
  const yuruyus = (a, b) => [a, b];
  POZ.kopek = { h:2, k:[['.........KK..', '........KOOK.', 'K......KooooK', 'KoK....KooeoK', '.KoKKKKooollK', '.KooooooooKK.', '.KoKoKKKoKoK.', '.KK.KK.KK.KK.'], ['.........KK..', '........KOOK.', '.K.....KooooK', '.KoK...KooeoK', '.KoKKKKooollK', '.KooooooooKK.', '.KoKoKKKoKoK.', '.KK.KK.KK.KK.']] };
  POZ.kopekyuru = { h:5, k:yuruyus(['.........KK..', '........KOOK.', 'K......KooooK', 'KoK....KooeoK', '.KoKKKKooollK', '.KooooooooKK.', '.KoKKKKKKoK..', '.KK......KK..'], ['.........KK..', '........KOOK.', '.K.....KooooK', '.KoK...KooeoK', '.KoKKKKooollK', '.KooooooooKK.', '..KKoKKoKKK..', '...KK..KK....']) };
  POZ.tavsan = { h:1, k:[['....K.K...', '...KoKoK..', '...KoKoK..', '...KoooK..', '..KoooeoK.', 'KKKoooooOK', 'KoooooooK.', 'KooKooKoK.', '.KK.KK.K..'], ['....K.K...', '...KoKoK..', '...KoKoK..', '...KoooK..', '..KoooeoK.', 'KKKooooolK', 'KoooooooK.', 'KooKooKoK.', '.KK.KK.K..']] };
  POZ.tavsanyuru = { h:4, k:[['....K.K...', '...KoKoK..', '...KoKoK..', '...KoooK..', '..KoooeoK.', 'KKKoooooOK', 'KoooooooK.', 'KooKooKoK.', '.KK.KK.K..'], ['...K.K....', '..KoKoK...', '..KoKoK...', '..KoooK...', '.KoooeoK..', 'KKoooooOK.', 'KoooooK...', 'KoKKooKK..', '.K...KK...']] };
  ['kedi_s', 'kedi_b'].forEach(a => { POZ[a] = POZ.kedi; POZ[a + 'yuru'] = POZ.kediyuru; });
  POZ.kopek_b = POZ.kopek; POZ.kopek_byuru = POZ.kopekyuru;
  const EVCIL = ['kedi', 'kopek', 'tavsan', 'kedi_s', 'kopek_b', 'kedi_b'];
  /* Kuşlar: türlü türlü; uçarken kanat çırpar, tünekte gagalar */
  const KUSLAR = { k:{ o:'#d9534f', O:'#a83a3a', y:'#f4b860', e:'#2a1a1c', d:'#5a3a35' }, m:{ o:'#5f9fd0', O:'#3f6f9e', y:'#f4b860', e:'#2a1a1c', d:'#5a3a35' }, s:{ o:'#f2cf5a', O:'#c9a02e', y:'#e0812e', e:'#2a1a1c', d:'#5a3a35' }, y:{ o:'#6fb56a', O:'#4c8a4a', y:'#f4b860', e:'#2a1a1c', d:'#5a3a35' } };
  const OZEL = {};
  Object.keys(KUSLAR).forEach(a => {
    POZ['kusu_' + a] = { h:6, k:[['..OO...', '..OOo..', 'oooooey', '..ooo..'], ['.......', '...oo..', 'oooooey', '..OO...']] };
    POZ['kusk_' + a] = { h:0.8, k:[['..oo..', '.ooey.', 'oOooo.', '.OOo..', '..d.d.'], ['..oo..', '.ooey.', 'oOooo.', '.OOo..', '..d.d.'], ['......', '..oo..', '.oooey', 'oOoo..', '..d.d.']] };
    OZEL['kusu_' + a] = OZEL['kusk_' + a] = KUSLAR[a];
  });
  POZ.baykus = { h:0.5, k:[['.K...K.', 'KoKKKoK', 'KwewewK', 'KooyooK', 'KoOOOoK', 'KoOOOoK', '.KoooK.', '..y.y..'], ['.K...K.', 'KoKKKoK', 'KwewewK', 'KooyooK', 'KoOOOoK', 'KoOOOoK', '.KoooK.', '..y.y..'], ['.K...K.', 'KoKKKoK', 'KoooooK', 'KooyooK', 'KoOOOoK', 'KoOOOoK', '.KoooK.', '..y.y..']] };
  POZ.papagan = { h:1, k:[['..ooo..', '.ooeyy.', '.oooyy.', '..oOo..', '..oOo..', '..ooo..', 'dddrddd', '...r...', '...r...'], ['.......', '..ooo..', '.ooeyy.', '.oooyy.', '..oOo..', '..ooo..', 'dddrddd', '...r...', '...r...']] };
  POZ.kelebek = { h:5, k:[['rr.rr', 'rrdrr', '.rdr.'], ['.r.r.', '.rdr.', '..d..']] };
  POZ.bocek = { h:1.5, k:[['y'], ['Y'], ['.'], ['.'], ['Y']] };
  /* King'in aksolotu: pembe, solungaçlı, tacı küçük */
  const AKS = (a) => ['.....y.yy.y.....', '.....yYyyYy.....', a[0] + '...oooooooo...' + a[0], 'gg.ommmmmmmmo.gg', '.gommmmmmmmmmog.', 'ggommwkmmwkmmogg', '.gommkkmmkkmmog.', a[1] + '.opmmnnmmpo.' + a[1], '...ommmmmmmmo...', '....oMMMMMMo....', '...ommbbbbmmo...', '..omommbbmmomo..', '..oo.ommmmo.oo..', '....ommMMmmo....', a[2], a[3]];
  const AKS1 = AKS(['g.', 'gg', '....oMo..oMo....', '.....o....o.....'].map((r, i) => (i === 0 ? 'g' : r))), AKS2 = AKS(['.', '.g', '...oMo....oMo...', '....o......o....']);
  POZ.aksolot = { h:1.5, k:[AKS1, AKS1, AKS1, AKS2.map((r, y) => (y === 5 || y === 6 ? r.replace('wk', 'oo').replace('kk', 'kk') : r))].map(f => f.map((r, y) => (y >= 14 ? AKS1[y] : r))) };
  POZ.aksolotyuru = { h:4, k:[AKS1, AKS2] };
  POZ.aksolot_u = { h:1, k:[AKS1.map((r, y) => (y === 5 ? r.replace(/wk/g, 'mm') : y === 6 ? r.replace(/kk/g, 'oo') : r))] };
  ['aksolot', 'aksolotyuru', 'aksolot_u'].forEach(a => { OZEL[a] = { o:'#7a2f55', m:'#ff9ecb', M:'#e878ad', g:'#ff5f9e', y:'#ffd35a', Y:'#e0a52e', k:'#2a1430', w:'#ffffff', p:'#ff6f9f', b:'#ffd9e8', n:'#7a2f55' }; });
  /* Arabalar: kişiden biraz kısa, sağa bakar; tekerlek döner */
  const OTO = (w) => ['...........KKKKKKKKKKKK...........', '..........KUUUUUKUUUUUUK..........', '.........KUUUUUUKUUUUUUUK.........', '...KKKKKKBBBBBBBBBBBBBBBBKKKKK....', '..KBBBBBBBBBBBBBBBBBBBBBBBBBBBBK..', '.KrBBBBBBBBBBBKBBBBBBBBBBBBBBBBYK.', '.KAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAK.', '.KAAKKKKKAAAAAAAAAAAAAKKKKKAAAAAK.', '..KKK' + w[0] + 'KKKKKKKKKKKKKKK' + w[0] + 'KKKKKK..', '....K' + w[1] + 'K.............K' + w[1] + 'K.......', '.....KKK...............KKK........'];
  const VAN = (w) => ['......KKKKKKKKKKKKKKKKKKKK........', '.....KBBBBBBBBBBBBBBBBBBBBBKK......', '....KBBBBBBBBBBBBBBBBBBBBKUUUKK....', '....KBBBBBBBBBBBBBBBBBBBBKUUUUUK...', '....KBBBBBBBBBBBBBBBBBBBBKUUUUUUK..', '...KBBBBBBBBBBBBBBBBBBBBBBBBBBBBK..', '...KrBBBBBBBBBBBBBBBBBBBBKBBBBBYK..', '...KAAAAAAAAAAAAAAAAAAAAAKAAAAAAK..', '...KAKKKKKAAAAAAAAAAAAAKKKKKAAAAK..', '...KKK' + w[0] + 'KKKKKKKKKKKKKKK' + w[0] + 'KKKKK...', '.....K' + w[1] + 'K.............K' + w[1] + 'K.......', '......KKK...............KKK.......'];
  const TEKER = [['ddd', 'dwd'], ['dwd', 'ddd']];
  Object.assign(OZEL, { kapi_k:{ O:AHSAP_K, o:AHSAP, y:'#e8b45a' }, kapi_a:{ O:AHSAP_K, o:AHSAP, y:'#e8b45a' }, kedi_s:{ o:'#4a4250', O:'#332d38', l:'#8a8294', e:'#ffe6a0' }, kedi_syuru:{ o:'#4a4250', O:'#332d38', l:'#8a8294', e:'#ffe6a0' }, kedi_b:{ o:'#f4efe6', O:'#d9c9b8', l:'#ffffff' }, kedi_byuru:{ o:'#f4efe6', O:'#d9c9b8', l:'#ffffff' },
    kopek:{ o:'#b5825a', O:'#7d5540', l:'#f0d9b8' }, kopekyuru:{ o:'#b5825a', O:'#7d5540', l:'#f0d9b8' }, kopek_b:{ o:'#efe2cc', O:'#c49a6a', l:'#ffffff' }, kopek_byuru:{ o:'#efe2cc', O:'#c49a6a', l:'#ffffff' },
    tavsan:{ o:'#f8f2ea', O:'#f4a39a', l:'#f4a39a' }, tavsanyuru:{ o:'#f8f2ea', O:'#f4a39a', l:'#f4a39a' }, baykus:{ o:'#a07a5a', O:'#e0c8a0', y:'#f4b860', e:'#2a1a1c' }, papagan:{ o:'#5fb56a', O:'#3f8a4a', y:'#f4b860', e:'#2a1a1c', d:'#7d5540', r:'#e8505b' }, bocek:{ y:'#fff27a', Y:'#d9e85a' } });
  const ARABA_P = { araba1:{ A:'#8a3f36', B:'#b8584a' }, araba2:{ A:'#3f6a8a', B:'#5f8fb0' }, araba3:{ A:'#c9a24a', B:'#e8c76a' } };
  POZ.araba1 = { h:4, k:TEKER.map(OTO) }; POZ.araba2 = { h:4, k:TEKER.map(w => VAN(w).map(r => r.slice(0, 34).padEnd(34, '.'))) }; POZ.araba3 = { h:5, k:TEKER.map(OTO) };
  const SABIT = { K:HAT, e:'#2a1a1c', k:'#2d2224', b:'#c2603f', w:'#fff8ea', C:'#fbeed5', m:'#6f8fa0', d:'#3a3244', o:'#ee9c52', O:'#c9743a', l:'#fbe3bb', z:'#5f5a8a', r:'#e8505b', T:'#8fc7d8', U:'#d9f0f2', V:'#5a7ea0', y:'#ffe6a0', Y:'#f4b860', L:'#ffe9b8', A:'#8a3f36', B:'#b8584a', M:'#7a2c30', j:'#8fc7e8', W:'#fff8ea', x:'#e8b45a' };
  const BULUT_P = { A:'#6f8fa0', B:'#d9737f' };
  const kabinSatir = ic => ['d'.repeat(13)].concat(ic, ['d'.repeat(13)]);
  POZ.kabin = { h:1, k:[kabinSatir(Array(18).fill('dLLLLLLLLLLLd'))] };
  POZ.kabinK = { h:2, k:[Array(20).fill('')] };

  const BAS_ON = ['...KKKKK...', '..KsssssK..', '.KsssssssK.', '.KsssssssK.', '.KsssssssK.', '.KsssssssK.', '.KsssssssK.', '..KSSSSSK..', '...KKKKK...'];
  const BAS_YAN = BAS_ON.map((r, y) => (y === 5 ? '.KssssssssK' : r));
  function sacCiz(p, yan, k){
    const yat = (y, a, b, t) => { for(let x = a; x <= b; x++) p(x, y, t || 'h'); }, dik = (x, a, b, t) => { for(let y = a; y <= b; y++) p(x, y, t || 'h'); };
    const kap = t => { yat(1, 3, 7, t); yat(2, 2, 8, t); if(!t){ p(4, 1, 'H'); p(5, 1, 'H'); p(3, 2, 'H'); p(4, 2, 'H'); } };
    const arka = (bit) => { yat(3, 2, 6); for(let y = 4; y <= bit; y++) yat(y, 2, 3 + (y < 6 ? 1 : 0)); };
    switch(k.sac){
      case 'kisa': kap(); if(yan) arka(5); else { yat(3, 2, 3); yat(3, 7, 8); p(2, 4, 'h'); p(8, 4, 'h'); } break;
      case 'kakul': kap(); yat(3, 2, 8); if(yan) arka(6); else { dik(2, 4, 5); dik(8, 4, 5); } break;
      case 'ortali': kap(); if(yan) arka(6); else { yat(3, 2, 4); yat(3, 6, 8); dik(2, 4, 6); dik(8, 4, 6); } break;
      case 'yana': kap(); yat(3, 2, 6); if(yan) arka(5); else { yat(4, 2, 3); p(8, 3, 'h'); p(8, 4, 'h'); } break;
      case 'uzun': kap(); if(yan){ arka(6); [7, 8, 9, 10].forEach(y => { p(0, y, 'K'); yat(y, 1, 3); p(4, y, 'K'); }); yat(11, 1, 3, 'K'); }
        else { yat(3, 2, 8); [4, 5, 6].forEach(y => { p(2, y, 'h'); p(8, y, 'h'); }); [7, 8, 9, 10].forEach(y => { p(0, y, 'K'); yat(y, 1, 2); yat(y, 8, 9); p(10, y, 'K'); }); yat(11, 1, 2, 'K'); yat(11, 8, 9, 'K'); dik(0, 3, 6, 'K'); dik(10, 3, 6, 'K'); dik(1, 3, 6); dik(9, 3, 6); } break;
      case 'at': kap(); if(yan){ arka(5); dik(1, 2, 6); dik(0, 2, 6, 'K'); p(1, 7, 'K'); } else { yat(3, 2, 3); yat(3, 7, 8); p(2, 4, 'h'); p(8, 4, 'h'); dik(9, 2, 7); dik(10, 2, 7, 'K'); p(9, 8, 'K'); } break;
      case 'topuz': kap(); if(yan) arka(5); else { yat(3, 2, 3); yat(3, 7, 8); p(2, 4, 'h'); p(8, 4, 'h'); } yat(-2, 4, 6, 'K'); p(3, -1, 'K'); yat(-1, 4, 6); p(7, -1, 'K'); break;
      case 'kivircik': yat(0, 3, 7); [3, 5, 7].forEach(x => p(x, -1, 'K')); kap(); dik(1, 2, 6); dik(0, 3, 6, 'K'); if(yan) arka(6); else { dik(9, 2, 6); dik(10, 3, 6, 'K'); [2, 4, 6, 8].forEach(x => p(x, 3, 'h')); } break;
      case 'afro': yat(-2, 3, 7, 'K'); p(2, -1, 'K'); yat(-1, 3, 7); p(8, -1, 'K'); p(1, 0, 'K'); yat(0, 2, 8); p(9, 0, 'K'); [1, 2, 3, 4, 5].forEach(y => { p(0, y, 'K'); p(1, y, 'h'); if(!yan){ p(10, y, 'K'); p(9, y, 'h'); } }); kap(); if(yan) arka(6); else { yat(3, 2, 3); yat(3, 7, 8); dik(2, 4, 5); dik(8, 4, 5); } break;
      case 'dazlak': p(4, 1, 'W'); if(yan) dik(2, 4, 5); else { dik(2, 4, 5); dik(8, 4, 5); } break;
      case 'kep': kap('a'); p(4, 1, 'x'); if(yan){ yat(3, 2, 5, 'a'); yat(3, 6, 10, 'v'); arka(5); yat(3, 2, 5, 'a'); } else { yat(3, 1, 9, 'v'); p(2, 4, 'h'); p(8, 4, 'h'); } break;
      case 'bere': kap('a'); yat(0, 4, 6, 'a'); if(yan){ yat(3, 2, 7, 'v'); arka(5); yat(3, 2, 7, 'v'); } else { yat(3, 2, 8, 'v'); p(2, 4, 'h'); p(8, 4, 'h'); } break;
    }
  }
  function yuzCiz(p, yan, ruh, yuz, k){
    const d = yuz === 'kapali' || yuz === 'kirp' || yuz === 'esne' || ruh === 'uyku' ? 'kapali' : ruh, gozler = yan ? [7] : [3, 7];
    if(k.ek === 'sakal'){ for(let x = yan ? 4 : 3; x <= (yan ? 8 : 7); x++){ p(x, 6, 'h'); p(x, 7, 'h'); } }
    if(k.ek === 'biyik'){ if(yan){ p(7, 6, 'h'); p(8, 6, 'h'); } else { p(4, 6, 'h'); p(5, 6, 'h'); p(6, 6, 'h'); } }
    gozler.forEach(x => {
      if(d === 'kapali'){ p(x - 1, 5, 'e'); p(x, 5, 'e'); p(x + 1, 5, 'e'); }
      else if(d === 'nese'){ p(x - 1, 5, 'e'); p(x, 4, 'e'); p(x + 1, 5, 'e'); }
      else if(d === 'asik'){ p(x - 1, 5, 'e'); p(x, 4, 'e'); p(x + 1, 5, 'e'); }
      else if(k.ek === 'gozluk'){ p(x, 4, 'W'); p(x, 5, 'e'); }
      else { p(x, 4, 'e'); p(x, 5, 'e'); }
      if(d === 'kiz'){ const dis = x < 5 ? -1 : 1; p(x + dis, 3, 'K'); p(x, 4, 'K'); }
      if(d === 'uz'){ const ic = x < 5 ? 1 : -1; p(x + ic, 3, 'K'); p(x, 3, 'K'); p(x + 1, 6, 'j'); }
    });
    if(!(k.ek === 'sakal')){ const y = d === 'asik' || d === 'kiz' ? 'r' : 'c'; if(yan) p(5, 6, y); else { p(2, 6, y); p(8, 6, y); } }
    const ag = yuz === 'esne' ? 'esne' : yuz === 'ac' ? 'ac' : ruh;
    if(ag === 'esne'){ if(yan){ p(7, 6, 'M'); p(8, 6, 'M'); p(7, 7, 'M'); p(8, 7, 'M'); } else for(let x = 4; x <= 6; x++){ p(x, 6, 'M'); p(x, 7, 'M'); } }
    else if(ag === 'ac'){ if(yan){ p(7, 6, 'M'); p(8, 6, 'M'); p(7, 7, 'M'); } else { p(4, 6, 'M'); p(5, 6, 'M'); p(6, 6, 'M'); p(5, 7, 'M'); } }
    else if(ag === 'nese' || ag === 'gul'){ if(yan){ p(7, 7, 'n'); p(8, 6, 'n'); } else { p(4, 6, 'n'); p(6, 6, 'n'); p(5, 7, 'n'); } }
    else if(ag === 'uz'){ if(yan){ p(7, 6, 'n'); p(8, 7, 'n'); } else { p(5, 6, 'n'); p(4, 7, 'n'); p(6, 7, 'n'); } }
    else if(ag === 'kiz'){ if(yan){ p(7, 7, 'n'); p(8, 7, 'n'); } else { p(4, 7, 'n'); p(5, 7, 'n'); p(6, 7, 'n'); } }
    else if(k.ek !== 'biyik'){ if(yan){ p(7, 6, 'n'); p(8, 6, 'n'); } else { p(4, 6, 'n'); p(5, 6, 'n'); p(6, 6, 'n'); } }
    else if(yan) p(8, 7, 'n'); else p(5, 7, 'n');
    if(k.ek === 'gozluk') gozler.forEach(x => { p(x - 1, 4, 'K'); p(x + 1, 4, 'K'); p(x - 1, 5, 'K'); p(x + 1, 5, 'K'); if(!yan) p(5, 4, 'K'); });
    if(k.ek === 'kupe'){ if(yan) p(3, 7, 'y'); else { p(1, 7, 'y'); p(9, 7, 'y'); } }
    if(k.ek === 'fiyonk'){ if(yan){ p(2, 1, 'r'); p(3, 0, 'r'); p(4, 1, 'r'); p(3, 1, 'M'); } else { p(7, 1, 'r'); p(8, 0, 'r'); p(9, 1, 'r'); p(8, 1, 'M'); } }
  }
  function giyimCiz(s, t, k){
    const ayni = (y, x, a, b) => { if(s[y] && s[y][x] === a) s[y][x] = b; };
    for(let x = 0; x < 13; x++){
      if(k.giyim === 'cizgili'){ ayni(t + 1, x, 'g', 'x'); ayni(t + 3, x, 'g', 'x'); }
      if(k.giyim === 'elbise'){ for(let y = t + 3; y < t + 5; y++){ ayni(y, x, 'p', 'g'); ayni(y, x, 'P', 'G'); } for(let y = t + 5; y < 18; y++){ ayni(y, x, 'p', 's'); ayni(y, x, 'P', 'S'); } }
      if(k.giyim === 'tulum' && x >= 4 && x <= 8){ for(let y = t + 1; y < t + 3; y++) ayni(y, x, 'g', 'p'); ayni(t, 4, 'g', 'p'); ayni(t, 8, 'g', 'p'); }
      if(k.giyim === 'ceket' && x === 6){ for(let y = t; y < t + 3; y++){ ayni(y, x, 'g', 'w'); ayni(y, x, 'G', 'w'); } }
      if(k.giyim === 'onluk' && x >= 5 && x <= 7){ for(let y = t + 1; y < t + 4; y++){ ayni(y, x, 'g', 'w'); ayni(y, x, 'p', 'w'); ayni(y, x, 'G', 'w'); ayni(y, x, 'P', 'w'); } }
    }
  }
  /* Bir karenin satırları: vücut + giysi + baş + saç + yüz + aksesuar, sonra boy */
  function kisiSatir(poz, i, k, ruh){
    const kaynak = POZ[poz].k[i], s = kaynak.map(r => r.split('')), b = kaynak.bas;
    if(!b) return s;
    giyimCiz(s, b.t, k);
    const yan = b.yon === 'yan', p = (x, y, t) => { const r = s[b.y + y]; if(r && x >= -1 && x < 12) r[x + 1] = t; };
    (yan ? BAS_YAN : BAS_ON).forEach((r, y) => { for(let x = 0; x < 11; x++) if(r[x] !== '.') p(x, y, r[x]); });
    sacCiz(p, yan, k);
    yuzCiz(p, yan, ruh, b.yuz, k);
    (b.kol || []).forEach(q => p(q[0], q[1], q[2]));
    /* Boy: gövdeden bir sıra, çocukta bir de bacaktan; ayak yerinde kalır */
    if(k.boy && b.t + 1 < s.length && poz !== 'kafa'){ s.splice(b.t + 1, 1); s.unshift(BOS.split('')); }
    if(k.boy === 2 && poz !== 'kafa'){ s.splice(16, 1); s.unshift(BOS.split('')); }
    return s;
  }

  /* Sakin ve poz ilk gerektiğinde küçük bir tuvale çizilir; kare başına piksel piksel çizim yok. */
  const onbellek = new Map();
  function gorsel(poz, i, kisi, ters, v){
    const anahtar = poz + i + '|' + (kisi ? kisi.i : '') + (ters ? 't' : '') + v;
    let c = onbellek.get(anahtar);
    if(c) return c;
    let s;
    if(poz === 'kabinK') s = kabinSatir(kisiSatir('dur', 0, kisi, ruhu(kisi, v)).map(r => { const q = r.map(a => (a === '.' ? 'L' : a)); q[0] = 'd'; q[12] = 'd'; return q.join(''); })).map(r => r.split(''));
    else s = kisi ? kisiSatir(poz, i, kisi, ruhu(kisi, v)) : POZ[poz].k[i].map(r => r.split(''));
    const P = Object.assign({}, SABIT, /^camasir/.test(poz) ? BULUT_P : null, /^bulut/.test(poz) ? { C:PALET[v].bulut1, D:PALET[v].bulut2 } : null, ARABA_P[poz], OZEL[poz]);
    if(kisi){
      Object.assign(P, { c:'#f4a39a', n:'#a84e46', h:kisi.h, H:tonla(kisi.h, 1.35), s:kisi.s, S:tonla(kisi.s, 0.84), g:kisi.g, G:tonla(kisi.g, 0.76), p:kisi.p, P:tonla(kisi.p, 0.76), a:kisi.a, v:tonla(kisi.a, 0.76), x:tonla(kisi.g, 1.35) });
      Object.keys(P).forEach(k => { P[k] = tonla(P[k], PALET[v].sakin); });
    } else if(v === 'gece' && (ARABA_P[poz] || (OZEL[poz] && !/^aksolot|^kapi|^bocek/.test(poz)))){
      const f = ARABA_P[poz] ? 0.55 : 0.7;
      Object.keys(P).forEach(k => { P[k] = tonla(P[k], f); });
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
      const hx = a[2] === undefined ? px : a[2], hy = a[4] === undefined ? py : a[4], s = a[1] || Math.abs(hx - px) / (HIZ * (kisi && kisi.hiz || 1));
      seg.push({ poz:a[0], t0:z, t1:z + s, x0:px, x1:hx, y0:py, y1:hy, ters:a[3] === undefined ? hx < px : a[3] });
      z += s; px = hx; py = hy;
    });
    return { kisi, seg, T:z };
  }
  /* Saf: aynı t aynı kareyi verir. null = görünmüyor. Kişi kareleri 13 enindedir, konumdan iki piksel sola taşar. */
  function kareAl(a, t){
    const z = ((t % a.T) + a.T) % a.T, s = a.seg.find(q => z < q.t1) || a.seg[a.seg.length - 1];
    if(s.poz === 'gizli') return null;
    const P = POZ[s.poz], i = Math.floor(z * P.h) % P.k.length, f = (z - s.t0) / (s.t1 - s.t0), kare = P.k[i];
    return { poz:s.poz, i, x:Math.round(s.x0 + (s.x1 - s.x0) * f) - (kare.bas ? 2 : 0), y:Math.round(s.y0 + (s.y1 - s.y0) * f) - kare.length, ters:s.ters, kisi:s.kisi || a.kisi };
  }
  /* İki kişi sırayla konuşur: biri anlatır, öbürü başını sallar; balon konuşanın üstünde */
  function sohbet(a, b, xa, xb, y, d, ta, tb, pk, pd, bal){
    return [
      rutin(a, xa, y, [[pk, d, undefined, ta], [pd, d, undefined, ta]]), rutin(b, xb, y, [[pd, d, undefined, tb], [pk, d, undefined, tb]]),
      rutin(null, xa + 2, y - 18, [['laf', d], ['gizli', d]]), rutin(null, xb + 2, y - 18, [['gizli', d], [bal ? 'b_' + bal : 'laf', d]]),
    ];
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
    /* Cam parıltısı; gündüz duvara düşen ışık */
    R(g, x + 2, y + 1, 1, 3, '#ffffff66'); R(g, x + 3, y + 1, 1, 1, '#ffffff66'); R(g, x + 10, y + 8, 1, 3, '#ffffff44');
    if(P.amb[0] > 0.75) for(let i = 0; i < 11; i++) R(g, x + i, y + h + 2 + i, w, 1, '#ffffff12');
  }
  function kanepe(g, x, F, w, c, c2){ kutu(g, x + 2, F - 12, w - 4, 7, c); kutu(g, x + 3, F - 7, w - 6, 5, tonla(c, 1.08)); kutu(g, x, F - 9, 4, 8, c); kutu(g, x + w - 4, F - 9, 4, 8, c); R(g, x + 2, F - 1, 2, 1, HAT); R(g, x + w - 4, F - 1, 2, 1, HAT); if(c2) kutu(g, x + 5, F - 10, 5, 4, c2); }
  function lambader(g, x, F){ kutu(g, x, F - 25, 7, 5, '#f0d9a0'); R(g, x + 3, F - 20, 1, 19, HAT); R(g, x + 1, F - 1, 5, 1, HAT); }


  /* Duygu balonu ara ara çıkar; kim olduğunu huy belirler */
  const duygu = (ad, x, y, once, sure, sonra) => rutin(null, x, y, [['gizli', once], [ad, sure], ['gizli', sonra]]);
  const ruh = (kisi, x, y, v) => duygu('b_' + BALONU[ruhu(kisi, v)], x, y, 6 + kisi.i % 9 * 2, 4, 12);
  const ODA = {
    /* Salon: kanepe, okuma koltuğu, televizyon */
    salon:{ g:62, duvar:'#f0c0b0', alt:'#dfa593', desen:'cizgi',
      ciz(g, X, F, P){ tablo(g, X + 6, F - 25, 15, 9); kanepe(g, X + 1, F, 26, '#7d6a8a', '#e8b45a'); pencere(g, X + 30, F - 28, P); kanepe(g, X + 28, F, 13, '#a0523f'); kutu(g, X + 44, F - 16, 16, 10, '#2c2a3d'); kutu(g, X + 43, F - 6, 18, 6, AHSAP); R(g, X + 51, F - 5, 1, 4, HAT); R(g, X + 28, F, 32, 1, TOPRAK); },
      hayat(X, F, k, v, il, uyku){
        const [a, b] = k;
        if(!a) return [];
        if(uyku) return [rutin(a, X + 7, F - 6, [['yat', 30]]), rutin(null, X + 10, F - 12, [['z', 30]])];
        const tv = rutin(null, X + 45, F - 7, [['tv', 30]]);
        if(b) return [tv].concat(sohbet(a, b, X + 5, X + 15, F, 6, false, true, 'oturK', 'oturD', il));
        return [tv, rutin(a, X + 30, F, [['oku', 40, undefined, false]]), ruh(a, X + 33, F - 18, v)];
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
        s.push(rutin(a, X + 52, F, [['ye', 24, undefined, false]]), duygu('b_yemek', X + 55, F - 18, 3, 5, 16));
        if(b) s.push(rutin(b, X + 16, F, [['konus', 10, undefined, false], ['yuru', 0, X + 26], ['ic', 6, undefined, false], ['yuru', 0, X + 16]]), duygu('b_' + il, X + 20, F - 18, 11, 5, 8));
        return s;
      } },
    /* Yatak odası: yatak, komodin, dolap; kedi burada yaşar */
    yatak:{ g:66, duvar:'#d2e2c6', alt:'#b8cfa9', desen:'nokta',
      ciz(g, X, F, P){ pencere(g, X + 10, F - 28, P); kutu(g, X + 1, F - 11, 3, 11, AHSAP_K); kutu(g, X + 3, F - 6, 24, 5, KREM); kutu(g, X + 10, F - 7, 17, 6, TOPRAK); R(g, X + 13, F - 6, 1, 4, '#d97a55'); R(g, X + 18, F - 6, 1, 4, '#d97a55'); R(g, X + 23, F - 6, 1, 4, '#d97a55'); kutu(g, X + 4, F - 8, 6, 3, '#fff8ea'); R(g, X + 3, F - 1, 2, 1, HAT); R(g, X + 25, F - 1, 2, 1, HAT);
        kutu(g, X + 28, F - 6, 8, 6, AHSAP); R(g, X + 31, F - 4, 2, 1, HAT); kutu(g, X + 29, F - 13, 6, 4, '#f0d9a0'); R(g, X + 32, F - 9, 1, 3, HAT);
        kutu(g, X + 49, F - 26, 16, 26, AHSAP); R(g, X + 57, F - 25, 1, 24, HAT); R(g, X + 55, F - 14, 1, 3, '#e8b45a'); R(g, X + 59, F - 14, 1, 3, '#e8b45a'); R(g, X + 37, F, 24, 1, '#5f86a8'); },
      hayat(X, F, k, v, il, uyku, e){
        const [a, b] = k, s = [];
        e = e || 'kedi';
        if(uyku || (v === 'gece' && a)){
          if(b) s.push(rutin(b, X + 5, F - 8, [['yat', 30]]));
          if(a) s.push(rutin(a, X + 10, F - 6, [['yat', 30]]), rutin(null, X + 12, F - 12, [['z', 30]]));
          return s.concat(rutin(null, X + 38, F, [[e, 30]]));
        }
        s.push(rutin(null, X + 52, F, [[e, 8], [e + 'yuru', 0, X + 44], [e, 12, undefined, true], [e + 'yuru', 0, X + 52]]));
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
        return a ? [rutin(a, X + 8, F, [['kafa', 30]]), rutin(null, X + 5, F - 7, [['kopuk', 30]]), duygu('b_nota', X + 14, F - 18, 4, 6, 10)] : [];
      } },
    /* Çalışma odası: iki masa, su sebili */
    ofis:{ g:70, duvar:'#f2e1b8', alt:'#ddc695', desen:'duz',
      ciz(g, X, F, P){ R(g, X + 9, F - 22, 18, 1, HAT); raf(g, X + 9, F - 26, 18); pencere(g, X + 34, F - 28, P); [2, 33].forEach(d => { sandalye(g, X + d, F); masa(g, X + d + 7, F, 17); ekran(g, X + d + 11, F); }); kutu(g, X + 60, F - 13, 7, 13, '#dfe6e6'); kutu(g, X + 61, F - 18, 5, 6, '#9ec6d6'); },
      hayat(X, F, k, v, il, uyku){
        const [a, b] = k, s = [];
        if(a) s.push(rutin(null, X + 14, F - 8, [['ekran', 40]]));
        if(a && uyku) s.push(rutin(a, X + 2, F, [['uyu', 30]]), rutin(null, X + 6, F - 14, [['z', 30]]));
        else if(a) s.push(rutin(a, X + 2, F, [['yaz', 26, undefined, false], ['yuru', 0, X + 24], ['esne', 2], ['ic', 7, undefined, false], ['yuru', 0, X + 2], ['yaz', 6, undefined, false]]), ruh(a, X + 6, F - 18, v));
        if(b) s.push(rutin(null, X + 45, F - 8, [['ekran', 40]]), rutin(b, X + 33, F, [['yaz', 40, undefined, false]]));
        return s;
      } },
    /* Kütüphane: tam boy raf, merdiven, okuma koltuğu */
    kutuphane:{ g:66, duvar:'#a06e58', alt:'#865844', desen:'ahsap',
      ciz(g, X, F){ kutu(g, X + 14, F - 28, 36, 28, '#5a3a30'); for(let i = 0; i < 4; i++) raf(g, X + 15, F - 27 + i * 7, 34); R(g, X + 44, F - 27, 1, 27, '#d3a475'); R(g, X + 48, F - 27, 1, 27, '#d3a475'); for(let y = F - 25; y < F; y += 3) R(g, X + 44, y, 5, 1, '#d3a475'); kanepe(g, X, F, 13, '#a0523f'); lambader(g, X + 54, F); },
      hayat(X, F, k, v){
        const [a, b] = k, s = [];
        if(a) s.push(rutin(a, X + 2, F, [['oku', 40, undefined, false]]), ruh(a, X + 5, F - 18, v));
        if(b) s.push(rutin(b, X + 51, F, [['dur', 8], ['yuru', 0, X + 26], ['dur', 6], ['esne', 2], ['yuru', 0, X + 51], ['dur', 3]]));
        return s;
      } },
    /* Atölye: şövale, boya masası */
    atolye:{ g:64, duvar:'#cdd2ea', alt:'#b4bbd8', desen:'duz',
      ciz(g, X, F){ kutu(g, X + 19, F - 22, 18, 14, '#f3e8d0'); R(g, X + 20, F - 16, 16, 3, '#ef916b'); R(g, X + 20, F - 13, 16, 4, '#6a4470'); daire(g, X + 31, F - 17, 2, '#ffeeb0'); R(g, X + 20, F - 8, 2, 8, HAT); R(g, X + 34, F - 8, 2, 8, HAT); R(g, X + 18, F - 8, 20, 1, HAT);
        masa(g, X + 42, F, 18); kutu(g, X + 44, F - 9, 4, 3, TOPRAK); kutu(g, X + 49, F - 9, 4, 3, '#5f86a8'); R(g, X + 55, F - 11, 1, 5, '#d3a475'); R(g, X + 42, F - 20, 18, 1, HAT); [0, 6, 12].forEach((d, i) => kutu(g, X + 43 + d, F - 24, 5, 4, ['#c2603f', '#e8b45a', '#5f86a8'][i])); },
      hayat(X, F, k){
        const [a] = k;
        return a ? [rutin(a, X + 10, F, [['firca', 22, undefined, false], ['yuru', 0, X + 2], ['dur', 5], ['yuru', 0, X + 10]]), duygu('b_nota', X + 13, F - 18, 6, 5, 12)] : [];
      } },
    /* King'in odası: binanın sağ alt köşesinde; pembe aksolot, akvaryum, minder */
    king:{ g:38, duvar:'#ffd3e6', alt:'#f5b0cf', desen:'nokta',
      ciz(g, X, F){ kutu(g, X + 3, F - 26, 11, 8, '#fff1f7'); [[5, 3], [8, 4], [11, 3]].forEach(q => R(g, X + q[0], F - 24, 1, q[1], '#e0a52e')); R(g, X + 5, F - 21, 7, 1, '#e0a52e');
        kutu(g, X + 22, F - 25, 14, 10, '#9fdcec'); R(g, X + 23, F - 24, 12, 2, '#d3f2f8'); R(g, X + 25, F - 19, 1, 3, '#4c8a4a'); R(g, X + 32, F - 20, 1, 4, '#4c8a4a'); R(g, X + 28, F - 21, 2, 1, '#ee9c52'); R(g, X + 23, F - 17, 12, 1, '#e8d5a8'); kutu(g, X + 21, F - 15, 16, 2, AHSAP);
        kutu(g, X + 20, F - 5, 16, 5, '#ff7fb0'); R(g, X + 22, F - 4, 12, 1, '#ffb3d0'); R(g, X + 1, F, 36, 1, '#ff9ecb'); },
      hayat(X, F, k, v){
        if(v === 'gece') return [rutin(null, X + 20, F, [['aksolot_u', 30]]), rutin(null, X + 30, F - 18, [['z', 30]])];
        return [rutin(null, X + 3, F, [['aksolot', 9], ['aksolotyuru', 0, X + 18], ['aksolot', 7], ['aksolotyuru', 0, X + 3]]), duygu('kalp', X + 8, F - 20, 12, 2.5, 14)];
      } },
  };
  /* Evler: kapıyla bağlı odalar; her evde tek yatak odası var, yer yetmezse önce ötekiler düşer */
  const EVLER = [['salon', 'banyo', 'yatak'], ['mutfak', 'yatak'], ['yatak', 'ofis'], ['banyo', 'yatak', 'atolye'], ['kutuphane', 'yatak'], ['mutfak', 'banyo', 'yatak']];
  /* Günün planı: iki kişilik ev. Sabah banyo ve kahvaltı, öğlen iş ve yemek, akşam birlikte, gece uyku.
     Her evde gece kuşu yok: çift sıradaki evlerde biri geç saate kadar uyanık. */
  function gunPlani(tipler, a, b, v, sira){
    const yer = (...adlar) => adlar.find(t => tipler.includes(t)) || tipler[0], plan = {};
    const koy = (t, kisi, uyku) => { if(!kisi) return; const q = plan[t] || (plan[t] = { k:[], uyku:false }); q.k.push(kisi); if(uyku) q.uyku = true; };
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

  /* ---------- YERLEŞİM: saf. Ortada asansör, iki yanında koridor, dışta evler; üstte geniş teras, altta sokak ---------- */
  const yatakOdasi = l => l.reduce((s, t) => s + ODA[t].g, 0);
  /* Yer yetmezse önce öteki odalar düşer; yatak odası evde kalır. Telefonda ev tek odaya sığar: o katın ilk odası görünür. */
  function odaBol(tipler, x, en, dar){
    const secili = dar ? tipler.slice(0, 1) : tipler.slice();
    while(secili.length > 1 && yatakOdasi(secili) > en){
      const dus = secili.map(t => t !== 'yatak').lastIndexOf(true);
      secili.splice(dus < 0 ? secili.length - 1 : dus, 1);
    }
    const liste = [];
    let k = x;
    for(const tip of secili){ liste.push({ tip, x:k, w:ODA[tip].g }); k += ODA[tip].g; }
    const pay = Math.floor((x + en - k) / liste.length);
    liste.forEach((o, j) => { o.x += pay * j; o.w = j === liste.length - 1 ? x + en - o.x : o.w + pay; });
    return liste;
  }
  /* Komşuluk: biri kendi evinden çıkar, koridordan geçer, karşı kapıyı çalar. Ev sahibi gelir, kapı açılır,
     kapıda konuşurlar; sonra içeri girer, oturup sohbet eder, el sallayıp döner. Hepsi tek saatten. */
  function komsuYap(b, F, z, e, sag, solSon, sagBas, faz){
    const kx = sag ? sagBas - 13 : solSon + 4, hd = sag ? sagBas + 4 : solSon - 13, ev = sag ? solSon - 34 : sagBas + 24, durak = sag ? sagBas + 30 : solSon - 40, ic = sag ? sagBas + 14 : solSon - 24;
    const kapiX = sag ? sagBas - 1 : solSon - 1, zt = !sag, et = sag;
    const zw = d => d / (HIZ * z.hiz), w1 = zw(Math.abs(kx - ev)), w2 = Math.abs(hd - durak) / (HIZ * e.hiz), w3 = zw(Math.abs(ic - kx));
    const bekle = 7, cal = 3, s1 = 5, s2 = 7, veda = 3;
    const vur = bekle + w1, acil = vur + cal + 1 + w2, gir = acil + s1 * 2, otur = gir + w3, kalk = otur + s2 * 2, cik = kalk + w3, git = cik + veda, T = git + w1 + 6;
    const liste = [
      rutin(null, kapiX, F, [['kapi_k', acil], ['kapi_a', gir + w3 * 0.6 - acil, undefined, !sag], ['kapi_k', kalk - gir - w3 * 0.6], ['kapi_a', git - kalk, undefined, !sag], ['kapi_k', T - git]]),
      rutin(z, ev, F, [['dur', bekle, undefined, zt], ['yuru', 0, kx], ['kapi', cal, undefined, zt], ['dur', 1 + w2, undefined, zt], ['konus', s1, undefined, zt], ['dinle', s1, undefined, zt], ['yuru', w3, ic], ['dinle', s2, undefined, zt], ['konus', s2, undefined, zt], ['yuru', w3, kx], ['el', veda], ['yuru', w1, ev], ['dur', 6, undefined, zt]]),
      rutin(e, durak, F, [['ic', vur + cal + 1, undefined, et], ['yuru', w2, hd], ['dinle', s1, undefined, et], ['konus', s1, undefined, et], ['yuru', w3, durak], ['konus', s2, undefined, et], ['dinle', s2, undefined, et], ['yuru', w3, hd], ['el', veda], ['yuru', w2, durak], ['ic', Math.max(0.1, T - git - w2), undefined, et]]),
      rutin(null, sag ? kapiX + 4 : kapiX - 6, F - 8, [['gizli', vur], ['tak', cal], ['gizli', T - vur - cal]]),
      rutin(null, kx + 2, F - 18, [['gizli', acil], ['laf', s1], ['gizli', T - acil - s1]]),
      rutin(null, hd + 2, F - 18, [['gizli', acil + s1], ['b_gul', s1], ['gizli', T - acil - s1 * 2]]),
      rutin(null, durak + 2, F - 18, [['gizli', otur], ['laf', s2], ['gizli', T - otur - s2]]),
      rutin(null, ic + 2, F - 18, [['gizli', otur + s2], ['b_kalp', 3], ['gizli', T - otur - s2 - 3]]),
    ];
    liste.forEach(r => { r.faz = faz; b.sakin.push(r); });
  }
  function yerlesim(W, H, v){
    const gece = v === 'gece', dar = W < DAR;
    const n = Math.max(1, Math.floor((H - TERAS - 2 - SOKAK) / KAT)), artan = Math.max(0, H - TERAS - 2 - SOKAK - n * KAT), T = TERAS + Math.floor(artan * 0.6), ilk = T + 2, sokak = ilk + n * KAT;
    const ax = dar ? W - ASANSOR : Math.floor((W - ASANSOR) / 2), solSon = dar ? ax : ax - KORIDOR, sagBas = ax + ASANSOR + KORIDOR;
    const f1 = Math.min(1, n - 1), f2 = Math.max(0, n - 2), P = PALET[v], lamba = [], odalar = [], kapilar = {};
    let s = 0;
    const zemin = { tip:'zemin', x:0, y:ilk + (n - 1) * KAT, w:W, h:H - ilk - (n - 1) * KAT, sakin:[] }, bolgeler = [];
    for(let k = 0; k < n; k++){
      const y = ilk + k * KAT, F = y + KAT - 4, bolge = k === n - 1 ? zemin : { tip:'kat', x:0, y, w:W, h:KAT, sakin:[] };
      const ziyaret = !dar && !gece && k % 2 === 0, sag = (k >> 1) % 2 === 0, gidenler = [];
      (dar ? [0] : [0, 1]).forEach(yan => {
        const x = yan ? sagBas : 0, en = yan ? W - sagBas : solSon, ev = EVLER[(k * 2 + yan * 3) % EVLER.length];
        const faz = (k * 37 + yan * 13) % 41, sira = k * 2 + yan;
        const a = SAKIN[s++ % 28], b = SAKIN[s++ % 28], kingde = !dar && yan === 1 && k === n - 1, bolum = odaBol(ev, x, en - (kingde ? ODA.king.g : 0), dar), plan = gunPlani(bolum.map(q => q.tip), a, ziyaret ? null : b, v, sira);
        if(ziyaret) gidenler[yan] = b;
        if(kingde) bolum.push({ tip:'king', x:W - ODA.king.g, w:ODA.king.g });
        bolum.forEach((o, j) => {
          const X = o.x + Math.floor((o.w - ODA[o.tip].g) / 2), q = plan[o.tip] || { k:[], uyku:false }, kapida = ziyaret && (yan ? j === 0 : j === bolum.length - 1);
          const sonuk = v === 'ogle' || ((!q.k.length || q.uyku) && !kapida && o.tip !== 'king');
          odalar.push({ tip:o.tip, x:o.x, y, w:o.w, F, X, sonuk, ilk:j === 0 });
          ODA[o.tip].hayat(X, F, q.k, v, ILISKI[sira % 3], q.uyku, EVCIL[sira % EVCIL.length]).forEach(r => { r.faz = faz + j * 7; bolge.sakin.push(r); });
          if(o.tip === 'salon') bolge.sakin.push(rutin(null, X + 49, F - 16, [['papagan', 30]]));
          if(!sonuk) lamba.push({ x:o.x + Math.floor(o.w / 2), y:y + 3, r:Math.max(o.w * 0.62, 26), k:[o.x, y, o.w, F + 2 - y] });
        });
        if(!dar && v !== 'ogle') lamba.push({ x:yan ? ax + ASANSOR + 9 : ax - 9, y:y + 3, r:20, k:[yan ? ax + ASANSOR : solSon, y, KORIDOR, F + 2 - y] });
      });
      if(ziyaret){ kapilar[k] = sag ? 1 : 0; komsuYap(bolge, F, sag ? gidenler[0] : gidenler[1], sag ? gidenler[1] : gidenler[0], sag, solSon, sagBas, k * 19); }
      if(bolge !== zemin) bolgeler.push(bolge);
    }
    const o = { W, H, T, ilk, ax, dar, sokak, n, f1, f2, solSon, sagBas, gece, odalar, bolgeler, kapilar, cati:catiYap(W, v, T, ax), zemin, lamba, P, vakit:v };
    sokakYap(o);
    o.asansor = asansorYap(o);
    return o;
  }
  /* Teras: sohbet, çamaşır, mangal, kitap, kuş ve bulut; asansör buraya da çıkar. */
  function catiYap(W, v, T, ax){
    const gece = v === 'gece', s = [], yer = f => Math.round(W * f), genis = W >= DAR;
    s.push(rutin(null, -20, 7, [['bulut', 90, W + 2, false], ['gizli', 10]]));
    s.push(rutin(null, W + 2, 13, [['gizli', 30], ['bulut', 110, -20, false]]));
    if(gece) [[0.1, 1], [0.36, 6], [0.62, 0], [0.88, 2]].forEach((q, i) => s.push(rutin(null, yer(q[0]), q[1] + 3, [['yildiz', 3 + i]])));
    if(genis){
      const m = yer(0.17);
      sohbet(SAKIN[34], SAKIN[35], m - 14, m + 16, T, 5, false, true, 'oturK', 'oturD', 'gul').forEach(r => s.push(r));
      s.push(rutin(null, yer(0.33), T - 13, [['camasir', 20]]));
      /* Sağ yan: kitap okuyan, mangal başında biri, güvercinler */
      s.push(rutin(SAKIN[33], yer(0.58), T, [['oku', 24, undefined, false]]));
      s.push(rutin(null, yer(0.58) + 3, T - 18, [['gizli', 9], ['b_' + BALONU[ruhu(SAKIN[33], v)], 4], ['gizli', 11]]));
      s.push(rutin(SAKIN[30], yer(0.7) - 11, T, gece ? [['ic', 30, undefined, false]] : [['firca', 14, undefined, false], ['ic', 8, undefined, false]]));
      if(!gece) s.push(rutin(null, yer(0.7) + 5, T - 15, [['buhar', 30]]));
      s.push(rutin(null, yer(0.84), T - 19, [['kus', 12]]), rutin(null, yer(0.84) + 8, T - 19, [['kus', 15]]));
    }
    /* Kuşlar gündüz sürü hâlinde geçer, korkuluğa konar; gece baykuş ve ateş böcekleri */
    if(gece){
      if(genis){ s.push(rutin(null, yer(0.94) - 3, T - 28, [['baykus', 12]])); [0.3, 0.42, 0.61, 0.74].forEach((f, i) => s.push(rutin(null, yer(f), T - 12 + i, [['bocek', 3 + i], ['bocek', 2, yer(f) + 6, false], ['bocek', 3, yer(f), false]]))); }
    } else {
      [['k', 0, 11, 0], ['k', 9, 8, 0.6], ['s', 16, 12, 1.2]].forEach(q => s.push(rutin(null, -9 - q[1], q[2], [[`kusu_${q[0]}`, W / 16, W + 9, false], ['gizli', 24]])));
      [['m', 0, 9], ['y', 8, 12]].forEach(q => s.push(rutin(null, W + 2 + q[1], q[2], [['gizli', 18], [`kusu_${q[0]}`, W / 14, -9, false], ['gizli', 9]])));
      if(genis){
        [['s', 0.45], ['m', 0.75], ['y', 0.12]].forEach(q => s.push(rutin(null, yer(q[1]), T - 8, [[`kusk_${q[0]}`, 11]])));
        const yk = ax - 40; s.push(rutin(null, yk, T - 13, [['kelebek', 4, yk + 12, false, T - 16], ['kelebek', 3, yk + 6, true, T - 11], ['kelebek', 4, yk, true, T - 13]]));
      }
    }
    if(v !== 'ogle') for(let i = 0; i * 14 < W - 8; i++) s.push(rutin(null, 6 + i * 14, T - 22 + (i % 2), [['ampul', 3 + (i % 3)]]));
    return { tip:'cati', x:0, y:0, w:W, h:T + 2, sakin:s };
  }
  function sokakYap(o){
    const { W, H, sokak, zemin, gece } = o, yol = sokak + 8, alt = H - 2, ust = yol + Math.floor((H - yol) / 2);
    const gez = (W + 20) / HIZ;
    zemin.sakin.push(rutin(SAKIN[28], -10, sokak + 6, [['gizli', 6], ['yuru', gez, W + 10], ['gizli', 20]]), rutin(null, 6, sokak + 7, [['gizli', 6], ['kopek_byuru', gez, W + 26], ['gizli', 20]]));
    if(!o.dar && !gece){ const y = Math.round(W * 0.12); zemin.sakin.push(rutin(null, y + 3, sokak + 1, [['kusk_k', 13]]), rutin(null, y + 9, sokak + 1, [['kusk_m', 9]]), rutin(null, Math.round(W * 0.7) + 1, sokak + 1, [['kusk_s', 7]])); }
    if(!gece){ zemin.sakin.push(rutin(SAKIN[29], W + 10, sokak + 7, [['gizli', 30], ['yuru', 0, -10], ['gizli', 6]])); }
    const gec = W / 34 + 1;
    zemin.sakin.push(rutin(null, -36, ust, [['gizli', 13], ['araba2', gec * 1.4, W + 36, false], ['gizli', 26]]));
    zemin.sakin.push(rutin(null, W + 2, alt, [['gizli', 3], ['araba1', gec, -36, false], ['gizli', 34]]));
    zemin.sakin.push(rutin(null, -36, alt, [['gizli', 26], ['araba3', gec, W + 36, true], ['gizli', 19]]));
  }
  /* Asansör ve iki yolcunun hikâyesi tek saatten kurulur: biri terasa çıkıp saksı sular, biri sokaktan eve gelip gider. */
  function asansorYap(o){
    const { ax, n, f1, f2, sokak, dar, zemin, cati, bolgeler, T:Teras, ilk } = o, X = SAKIN[32], Y = SAKIN[31], z = n - 1, x = ax;
    const dip = k => (k === 't' ? Teras + 1 : ilk + k * KAT + KAT - 3);
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
    const TT = t, bolge = k => (k === z ? zemin : bolgeler[k]);
    const ek = (b, a) => { a.faz = 0; b.sakin.push(a); };
    const sol = ax - 9, hedefX = sol - 36, w = (sol - hedefX) / HIZ, sag = ax + ASANSOR, hedefY = dar ? hedefX : sag + 36, kapiY = dar ? sol : sag;
    const xBin = an[1][1] - 0.6, xCik = an[3][0] + 0.6;
    ek(bolge(f1), rutin(X, hedefX, dip(f1) - 1, [['dur', xBin - w, undefined, false], ['yuru', 0, sol], ['gizli', xCik - xBin], ['yuru', 0, hedefX], ['dur', TT - xCik - w, undefined, false]]));
    const tBas = an[2][0] + 0.6, tSon = an[2][1] - 0.6, tw = 28 / HIZ;
    ek(cati, rutin(X, sol, Teras, [['gizli', tBas], ['yuru', 0, sol - 28], [o.gece ? 'dur' : 'sula', tSon - tBas - tw * 2, undefined, true], ['yuru', 0, sol], ['gizli', TT - tSon]]));
    const yBas = an[5][0] + 0.6, ySon = an[5][1] - 0.6;
    ek(bolge(f2), rutin(Y, kapiY, dip(f2) - 1, [['gizli', yBas], ['yuru', 0, hedefY], ['dur', ySon - yBas - w * 2], ['yuru', 0, kapiY], ['gizli', TT - ySon]]));
    const sBas = an[0][0] + 0.6, sSon = an[4][1] - 0.6, sw = 14 / HIZ + 2;
    ek(zemin, rutin(Y, sol, dip(z) - 1, [['gizli', sBas], ['yuru', 0, sol - 14], ['yuru', 2, sol - 26, undefined, sokak + 5], ['dur', sSon - sBas - sw * 2], ['yuru', 2, sol - 14, undefined, dip(z) - 1], ['yuru', 0, sol], ['gizli', TT - sSon]]));
    return { tip:'asansor', x:ax, y:0, w:ASANSOR, h:sokak, sakin:[{ kisi:null, seg, T:TT, faz:0 }] };
  }

  /* ---------- SABİT SAHNE: yalnız hazırlıkta bir kez ---------- */
  function gokCiz(g, o){
    const { W, P, T } = o, n = P.gok.length - 1, boy = T + 2;
    for(let y = 0; y < boy; y++){
      const f = y / boy * n, i = Math.floor(f), k = f - i;
      R(g, 0, y, W, 1, P.gok[k < 0.5 ? i : Math.min(n, i + 1)]);
      if(k > 0.3 && k < 0.7){ g.fillStyle = P.gok[k < 0.5 ? Math.min(n, i + 1) : i]; for(let x = y & 1; x < W; x += 2) g.fillRect(x, y, 1, 1); }
    }
    const sx = Math.round(W * P.gunesYeri[0]), sy = P.gunesYeri[1] + 2, r = P.gunesYeri[2] + 1;
    daire(g, sx, sy, r + 3, P.hale); daire(g, sx, sy, r + 1, P.hale);
    daire(g, sx, sy, r, P.gunes);
    if(o.gece){
      daire(g, sx + 2, sy - 1, r - 1, P.gok[1]);
      const a = tohum(7); for(let i = 0; i < W / 6; i++) R(g, a() * W, a() * (T - 12), 1, 1, a() < 0.2 ? '#ffffff' : '#c9c6e8');
    }
    const b = tohum(11);
    for(let i = 0; i < W / 40; i++){ const w = 14 + b() * 34, x = b() * W, y = 3 + b() * (T - 22); R(g, x + 4, y - 1, w * 0.5, 1, P.bulut1); R(g, x, y, w, 1, P.bulut1); R(g, x + 3, y + 1, w - 6, 1, P.bulut2); }
    /* Uzak şehir: iki sıra, ışıklı pencereler, ara ara kule ve anten */
    const dip = T + 2;
    [[P.uzak, 9, 11, 3], [P.yakin, 5, 8, 9]].forEach(q => {
      const a = tohum(q[3]);
      for(let x = -4; x < W;){
        const w = 10 + Math.floor(a() * 18), h = q[1] + Math.floor(a() * q[2]);
        R(g, x, dip - h, w, h, q[0]); R(g, x, dip - h, w, 1, tonla(q[0], 1.14));
        if(a() < 0.3) R(g, x + Math.floor(w / 2), dip - h - 3, 1, 3, q[0]);
        for(let wy = dip - h + 2; wy < dip - 1; wy += 3) for(let wx = x + 2; wx < x + w - 2; wx += 3) if(a() < (o.gece ? 0.32 : 0.14)) R(g, wx, wy, 1, 1, P.pencere);
        x += w;
      }
    });
  }
  /* Alçak çalı: kaldırımda kalır, alt kattaki kimsenin önüne geçmez */
  function cali(g, x, y){
    kutu(g, x, y + 3, 15, 3, '#8a6a56');
    [[1, 2], [5, 3], [10, 2]].forEach(q => { daire(g, x + q[0] + 2, y + 2, q[1], HAT); });
    [[1, 1], [5, 2], [10, 1]].forEach(q => { daire(g, x + q[0] + 2, y + 2, q[1], '#6a8f52'); });
    R(g, x + 4, y + 1, 1, 1, '#e8a0a8'); R(g, x + 8, y, 1, 1, '#ffe6a0'); R(g, x + 12, y + 2, 1, 1, '#e8a0a8');
  }
  function direk(g, x, F, gece, lamba){
    R(g, x, F - 26, 1, 26, HAT); R(g, x - 1, F - 1, 3, 1, HAT); R(g, x, F - 27, 5, 1, HAT); kutu(g, x + 3, F - 27, 5, 4, gece ? '#ffe6a0' : '#d9d3c6');
    lamba.push({ x:x + 5, y:F - 23, r:22, k:[x - 28, F - 46, 66, 70] });
  }
  /* Duvar: desen, pervaz, süpürgelik, köşe gölgesi, derinlik için önde iki sıra zemin */
  function duvarCiz(g, x, y, w, h, renk, alt, desen){
    R(g, x, y, w, h, renk);
    const k = tonla(renk, 0.95);
    if(desen === 'cizgi') for(let i = x + 2; i < x + w; i += 4) R(g, i, y, 1, h - 8, k);
    if(desen === 'fayans') for(let j = y + 1; j < y + h - 8; j += 3){ R(g, x, j, w, 1, k); for(let i = x + (j % 2 ? 2 : 0); i < x + w; i += 4) R(g, i, j, 1, 3, k); }
    if(desen === 'ahsap') for(let i = x + 1; i < x + w; i += 6) R(g, i, y, 1, h, k);
    if(desen === 'nokta') for(let j = y + 2; j < y + h - 8; j += 4) for(let i = x + (j % 8 < 4 ? 1 : 3); i < x + w; i += 4) R(g, i, j, 1, 1, k);
    R(g, x, y + h - 8, w, 7, alt); R(g, x, y + h - 8, w, 1, tonla(alt, 1.14)); for(let i = x + 4; i < x + w; i += 12) R(g, i, y + h - 6, 1, 4, tonla(alt, 0.9));
    R(g, x, y + h - 1, w, 1, HAT);
    /* Parke: uzun tahtalar */
    R(g, x, y + h, w, 2, '#a07a60'); R(g, x, y + h, w, 1, '#b8927a'); for(let i = x + 3; i < x + w; i += 9) R(g, i, y + h + (i % 2), 1, 1, '#7a5a46');
    R(g, x, y, w, 2, '#00000026'); R(g, x, y + 2, w, 1, '#00000012');
    R(g, x, y + 2, 1, h - 2, '#00000014'); R(g, x + w - 1, y + 2, 1, h - 2, '#00000014');
  }
  /* Bölme: üstte duvar, altta kapı boşluğu ve kasası */
  function bolme(c, x, y, F){ R(c, x, y, 2, F - y - 19, DOSEME); R(c, x - 1, F - 19, 4, 1, HAT); R(c, x - 1, F - 18, 1, 18, AHSAP_K); R(c, x + 2, F - 18, 1, 18, AHSAP_K); }
  /* Odaları canlandıran küçük şeyler: saat, fotoğraf, halı, askı. Sahneyi kalabalıklaştırmaz, eşyanın arasına oturur. */
  function susle(c, a){
    const { tip, X, F, x, w } = a, sag = x + w;
    if(tip === 'salon') R(c, X + 3, F, 22, 1, '#8a5f96');
    if(tip === 'mutfak'){ daire(c, X + 44, F - 27, 2, HAT); daire(c, X + 44, F - 27, 1, '#fff8ea'); R(c, X + 44, F - 28, 1, 2, HAT); R(c, X + 52, F - 22, 6, 1, HAT); [0, 2, 4].forEach(d => R(c, X + 52 + d, F - 21, 1, 3, d ? METAL : TOPRAK)); }
    if(tip === 'yatak'){ kutu(c, X + 2, F - 25, 7, 6, '#e8b45a'); R(c, X + 3, F - 22, 5, 2, '#5f86a8'); kutu(c, X + 39, F - 26, 8, 6, '#d9737f'); R(c, X + 42, F - 23, 2, 2, '#fff8ea'); }
    if(tip === 'banyo'){ R(c, X + 25, F - 12, 1, 1, HAT); kutu(c, X + 9, F - 21, 6, 5, '#fff8ea'); R(c, X + 11, F - 19, 2, 1, '#8fc7d8'); }
    if(tip === 'ofis'){ kutu(c, X + 51, F - 26, 8, 8, '#fff8ea'); R(c, X + 52, F - 25, 6, 2, TOPRAK); R(c, X + 53, F - 22, 1, 1, HAT); R(c, X + 56, F - 21, 1, 1, HAT); bitki(c, sag - 11 > X + 67 ? sag - 11 : X + 68, F); }
    if(tip === 'kutuphane'){ R(c, X + 1, F, 12, 1, '#c2603f'); kutu(c, X + 2, F - 26, 8, 6, '#e6dcc6'); R(c, X + 3, F - 23, 6, 2, '#6a8f52'); }
    if(tip === 'atolye'){ kutu(c, X + 3, F - 26, 9, 7, '#f3e8d0'); R(c, X + 4, F - 23, 7, 3, '#5f86a8'); daire(c, X + 8, F - 24, 1, '#ffeeb0'); [[46, 3], [50, 1], [54, 4]].forEach(q => R(c, X + q[0], F, 2, 1, ['#c2603f', '#e8b45a', '#5f86a8'][q[1] % 3])); }
  }
  function koridorCiz(c, x, y, F, sagda, kapali, no){
    duvarCiz(c, x, y, KORIDOR, F - y, '#d7c3a0', '#bfa883', 'cizgi');
    const b = sagda ? x + KORIDOR - 1 : x - 1;
    bolme(c, b, y, F);
    /* Ev kapısı, paspas, kapı numarası */
    if(kapali){ R(c, b, F - 18, 2, 18, AHSAP); R(c, b + (sagda ? 0 : 1), F - 18, 1, 18, AHSAP_K); R(c, b, F - 9, 2, 1, '#e8b45a'); }
    R(c, sagda ? b - 7 : b + 2, F, 7, 1, '#7a5040');
    const lx = sagda ? b - 5 : b + 4; kutu(c, lx, F - 23, 5, 4, '#e8e0cc'); R(c, lx + 2, F - 22, 1, 2, no % 2 ? HAT : TOPRAK);
    /* Asansör kapısı */
    const ic = sagda ? x : x + KORIDOR - 3;
    R(c, ic, F - 19, 3, 19, HAT); R(c, ic + 1, F - 18, 1, 18, METAL);
    R(c, sagda ? x + 4 : x + KORIDOR - 6, F - 11, 1, 2, '#e8b45a');
    const m = x + Math.floor(KORIDOR / 2);
    R(c, m, y, 1, 2, HAT); kutu(c, m - 2, y + 2, 5, 3, '#ffe6a0');
  }
  function terasCiz(c, o){
    const { W, ax, T } = o, yer = f => Math.round(W * f), genis = W >= DAR;
    /* Korkuluk en arkada; eşya önünde durur */
    R(c, 0, T - 8, W, 1, HAT); for(let x = 0; x < W; x += 5) R(c, x, T - 7, 1, 7, HAT); R(c, 0, T - 7, W, 1, '#a07a60');
    R(c, 0, T, W, 2, '#8a6450'); R(c, 0, T, W, 1, '#c29a7c'); for(let x = 4; x < W; x += 8) R(c, x, T, 1, 2, '#6a4c3c');
    R(c, 0, T - 24, W, 1, HAT);
    if(genis){
      /* Su deposu */
      const d = yer(0.02); kutu(c, d, T - 22, 18, 15, '#8a9aa6'); R(c, d + 1, T - 17, 16, 1, '#6f7f8a'); R(c, d + 1, T - 12, 16, 1, '#6f7f8a'); kutu(c, d + 6, T - 25, 6, 3, '#6f7f8a'); R(c, d + 2, T - 7, 2, 7, HAT); R(c, d + 14, T - 7, 2, 7, HAT);
      /* Şemsiyeli masa, iki tabure */
      const m = yer(0.17);
      R(c, m + 7, T - 22, 1, 22, HAT);
      [[6, 0], [10, 1], [13, 2], [15, 3]].forEach((q, i) => { R(c, m + 7 - q[0], T - 27 + q[1], q[0] * 2 + 1, 1, HAT); for(let x = -q[0] + 1; x < q[0]; x++) R(c, m + 7 + x, T - 26 + q[1], 1, 1, (x + 40) % 8 < 4 ? '#e8505b' : '#fff8ea'); });
      R(c, m - 8, T - 22, 31, 1, HAT);
      kutu(c, m + 1, T - 7, 13, 2, AHSAP); R(c, m + 6, T - 5, 3, 5, HAT); kutu(c, m + 3, T - 10, 4, 3, '#fff8ea'); kutu(c, m + 9, T - 9, 3, 2, '#e8b45a');
      [m - 12, m + 18].forEach(x => { kutu(c, x, T - 5, 7, 2, AHSAP_K); R(c, x + 2, T - 3, 1, 3, HAT); R(c, x + 4, T - 3, 1, 3, HAT); });
      /* Çamaşır ipi */
      const k = yer(0.33), kw = 24;
      R(c, k - 1, T - 16, 1, 16, HAT); R(c, k + kw, T - 16, 1, 16, HAT); R(c, k - 1, T - 14, kw + 2, 1, HAT);
      /* Asansöre yakın saksı sırası: biri burayı sular */
      const yk = ax - 46; kutu(c, yk, T - 6, 22, 6, TOPRAK); for(let x = yk + 1; x < yk + 21; x += 2){ R(c, x, T - 9 - (x % 3), 1, 3 + (x % 3), '#6a8f52'); if(x % 4 === 1) R(c, x, T - 10 - (x % 3), 1, 1, x % 8 === 1 ? '#e8505b' : '#ffe6a0'); }
      /* Sağ yan: şezlong, mangal, güvercinlik, anten */
      const s = yer(0.58); kutu(c, s - 2, T - 5, 12, 2, '#6f9f78'); R(c, s - 1, T - 3, 1, 3, HAT); R(c, s + 8, T - 3, 1, 3, HAT); R(c, s - 3, T - 11, 2, 7, '#6f9f78');
      const b = yer(0.7); kutu(c, b, T - 9, 13, 5, '#3a3244'); R(c, b + 1, T - 10, 11, 1, '#c2603f'); R(c, b + 2, T - 4, 1, 4, HAT); R(c, b + 10, T - 4, 1, 4, HAT);
      const g = yer(0.84); kutu(c, g - 1, T - 16, 16, 10, AHSAP); R(c, g + 3, T - 13, 3, 4, HAT); R(c, g + 9, T - 13, 3, 4, HAT); R(c, g - 2, T - 17, 18, 1, HAT); R(c, g + 1, T - 6, 1, 6, HAT); R(c, g + 12, T - 6, 1, 6, HAT);
      const an = yer(0.94); R(c, an, T - 28, 1, 28, HAT); R(c, an - 4, T - 25, 9, 1, HAT); R(c, an - 3, T - 28, 7, 1, HAT); R(c, an - 2, T - 22, 5, 1, HAT);
    }
    (genis ? [0.1, 0.27, 0.53, 0.66, 0.79, 0.91] : [0.08, 0.4]).forEach(f => bitki(c, yer(f), T));
    /* Asansör başı: kiremit kapak, ışıklı tepe */
    R(c, ax - 2, T - 25, ASANSOR + 4, 25, HAT); R(c, ax - 1, T - 24, ASANSOR + 2, 24, '#8a5a48'); for(let y = T - 22; y < T; y += 4) R(c, ax - 1, y, ASANSOR + 2, 1, '#6d463c');
    R(c, ax - 4, T - 27, ASANSOR + 8, 2, HAT); R(c, ax - 3, T - 27, ASANSOR + 6, 1, TOPRAK);
    kutu(c, ax + 3, T - 22, 7, 3, '#ffe6a0');
  }
  function sokakCiz(c, o){
    const { W, H, sokak, dar, gece } = o, yol = sokak + 8;
    R(c, 0, sokak, W, 8, '#a58c7a'); R(c, 0, sokak, W, 1, '#c2a892'); for(let x = 3; x < W; x += 12) R(c, x, sokak, 1, 8, '#8c7666');
    R(c, 0, sokak + 4, W, 1, '#94806e');
    R(c, 0, yol - 1, W, 1, '#6a5a58'); R(c, 0, yol, W, H - yol, '#544b5a');
    const d = tohum(5); for(let i = 0; i < W * (H - yol) / 30; i++) R(c, d() * W, yol + d() * (H - yol), 1, 1, d() < 0.5 ? '#5e5564' : '#4a4250');
    for(let x = 6; x < W; x += 22) R(c, x, Math.floor((yol + H) / 2), 10, 1, '#c9b98e');
    if(dar) return;
    [0.05, 0.21, 0.4, 0.6, 0.79].forEach(f => cali(c, Math.round(W * f), sokak + 2));
    [o.solSon + 8, o.sagBas - 9].forEach(x => direk(c, x, sokak + 5, gece, o.lamba));
    [0.12, 0.88].forEach(f => { const x = Math.round(W * f); kutu(c, x, sokak + 1, 16, 3, AHSAP); R(c, x + 2, sokak + 4, 1, 2, HAT); R(c, x + 13, sokak + 4, 1, 2, HAT); });
    /* Yangın musluğu, posta kutusu */
    const yx = Math.round(W * 0.3); kutu(c, yx, sokak + 2, 4, 5, '#c2603f'); R(c, yx - 1, sokak + 3, 6, 1, HAT);
    const px = Math.round(W * 0.7); kutu(c, px, sokak + 1, 8, 5, '#5f86a8'); R(c, px + 1, sokak + 2, 6, 1, HAT); R(c, px + 3, sokak + 6, 2, 1, HAT);
  }
  function binaCiz(g, o){
    const { W, H, P, ax, sokak, solSon, dar, n, gece, T, ilk, kapilar } = o;
    gokCiz(g, o);
    /* Bina ve sokak ayrı tuvalde: ışık yalnız bunlara düşer */
    const on = document.createElement('canvas'); on.width = W; on.height = H;
    const c = on.getContext('2d', { willReadFrequently:true });
        terasCiz(c, o);
    o.odalar.forEach(a => {
      const Z = ODA[a.tip];
      duvarCiz(c, a.x, a.y, a.w, a.F - a.y, Z.duvar, Z.alt, Z.desen);
      Z.ciz(c, a.X, a.F, P);
      susle(c, a);
      /* Tavan lambası: kablo, abajur, ampul */
      const m = a.x + Math.floor(a.w / 2), yan = a.sonuk ? '#7a7680' : '#ffe6a0';
      R(c, m, a.y, 1, 2, HAT); R(c, m - 2, a.y + 2, 5, 1, HAT); R(c, m - 3, a.y + 3, 7, 1, HAT); R(c, m - 2, a.y + 3, 5, 1, a.sonuk ? '#8a6a56' : '#c2603f'); R(c, m - 4, a.y + 4, 9, 1, HAT); R(c, m - 1, a.y + 5, 3, 1, yan);
      if(!a.ilk) bolme(c, a.x - 1, a.y, a.F);
    });
    for(let k = 0; k < n; k++){
      const y = ilk + k * KAT, F = y + KAT - 4;
      if(!dar){ koridorCiz(c, solSon, y, F, false, kapilar[k] !== 0, k * 2 + 1); koridorCiz(c, ax + ASANSOR, y, F, true, kapilar[k] !== 1, k * 2 + 2); }
      R(c, 0, F + 2, W, 2, DOSEME); R(c, 0, F + 2, W, 1, '#8a5f4c');
    }
    R(c, ax, T, ASANSOR, sokak - T, '#3a2a2e'); R(c, ax + 1, T, 1, sokak - T, '#4c3a3c'); R(c, ax + ASANSOR - 2, T, 1, sokak - T, '#4c3a3c'); R(c, ax + 6, T, 1, sokak - T, '#2a1e22');
    for(let k = 0; k < n; k++){ const F = ilk + k * KAT + KAT - 4; R(c, ax, F + 2, ASANSOR, 2, DOSEME); R(c, ax + 5, F - 24, 3, 1, '#e8b45a'); }
    sokakCiz(c, o);
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

  /* Dokunma: çift tıkla açılan sahnede canlıya dokununca balon çıkar. Kişi ruh hâlini, hayvan kalbini gösterir. */
  const CANSIZ = /^(tv|ekran|buhar|z|tak|laf|kalp|bulut|ampul|yildiz|kopuk|camasir|kabin|kapi_|b_|gizli|bocek)/;
  function dokun(o, x, y, t){
    const a = [o.cati].concat(o.bolgeler, o.zemin).find(b => y >= b.y && y < b.y + b.h);
    if(!a) return null;
    for(let j = a.sakin.length - 1; j >= 0; j--){
      const s = a.sakin[j], k = kareAl(s, t + (s.faz || 0));
      if(!k || CANSIZ.test(k.poz)) continue;
      const f = POZ[k.poz].k[k.i], w = f[0].length;
      if(x < k.x - 1 || x > k.x + w || y < k.y - 1 || y > k.y + f.length) continue;
      o.tepki = { poz:k.kisi ? 'b_' + BALONU[ruhu(k.kisi, o.vakit)] : 'b_kalp', x:k.x + Math.floor(w / 2) - 4, y:k.y + (f.bas ? 2 : 0) - 7, bitis:t + 3 };
      return { poz:k.poz, kisi:!!k.kisi, tepki:o.tepki.poz };
    }
    return null;
  }
  /* Karede yalnız değişen kat: önce sabit hâli, üstüne kabin ve sakinler. Kat sınırını aşan kare kırpılır. */
  function damga(g, c, k, a){
    const y0 = Math.max(k.y, a.y), y1 = Math.min(k.y + c.height, a.y + a.h);
    if(y1 > y0) g.drawImage(c, 0, y0 - k.y, c.width, y1 - y0, k.x, y0, c.width, y1 - y0);
  }
  function kare(g, arka, o, t){
    if(!o.cizildi){ g.drawImage(arka, 0, 0); o.cizildi = true; }
    let yenilenen = 0;
    const tum = o.tum || (o.tum = [o.cati].concat(o.bolgeler, o.zemin)), kk = kareAl(o.asansor.sakin[0], t), kabinC = gorsel(kk.poz, kk.i, kk.kisi, false, o.vakit);
    for(let j = 0; j < tum.length; j++){
      const a = tum[j], kareler = a.sakin.map(s => kareAl(s, t + (s.faz || 0))), kabinde = kk.y < a.y + a.h && kk.y + kabinC.height > a.y;
      const tp = o.tepki && t < o.tepki.bitis && o.tepki.y < a.y + a.h && o.tepki.y + 6 > a.y ? o.tepki : null;
      const imza = (tp ? tp.poz + tp.x + ',' + tp.y : '') + (kabinde ? kk.poz + kk.y + (kk.kisi ? kk.kisi.i : '') : '') + kareler.map(k => (k ? k.poz + k.i + ',' + k.x + ',' + k.y : '-')).join('|');
      if(imza === a.imza) continue;
      a.imza = imza; yenilenen++;
      g.drawImage(arka, a.x, a.y, a.w, a.h, a.x, a.y, a.w, a.h);
      if(kabinde) damga(g, kabinC, kk, a);
      kareler.forEach(k => { if(k) damga(g, gorsel(k.poz, k.i, k.kisi, k.ters, o.vakit), k, a); });
      if(tp) damga(g, gorsel(tp.poz, 0, null, false, o.vakit), tp, a);
    }
    return yenilenen;
  }

  L.PIKSEL_APARTMAN = Object.freeze({ vakit, yerlesim, gunPlani, binaCiz, kare, kareAl, dokun, ODA, EVLER, POZ, PALET, SAKIN, ruhu, KAT, TERAS, KORIDOR, ASANSOR });
})(window.LIFEOS);
