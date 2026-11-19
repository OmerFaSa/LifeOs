/* kabuk/ata.js — Atalarımızın piksel portreleri ve Türk devletlerinin yaklaşık sınırlı piksel haritaları (Türk teması 4, 2026-11-19;
 * sahip: «atalarımızın resimleri piksel sanatla», «eski Türklerin sınırları ve başarıları»; örnek: önden bakan, iri pikselli, yaldız çerçeveli tablolar).
 *  - Portre: 32×32 ızgara, her karakter bir piksel; elle kurulur (scratch onden.py), palet portrenin içinde. Çizimde hafif yağlıboya dokusu
 *    (piksel başına sabit, tohumlu parlaklık oynaması) ve 4 piksellik yaldız çerçeve eklenir: 40×40 tablo.
 *    Saygı: Atatürk ağırbaşlı, kalpaklı ve askerî paltolu, al zeminde ay yıldızla; karikatür yok. Portre süstür: konuşmaz, söz uydurmaz.
 *  - Harita: Avrupa–Asya çerçevesi (boylam -10…146, enlem 60…6; piksel 1° × 0,75°). Kıyılar, dağ sıraları ve devlet sınırı çokgen ya da çizgi;
 *    her hücre merkezinden örneklenir (aynı veri aynı resim). Sınırlar YAKLAŞIKTIR: genel tarih atlaslarındaki en geniş hâlin sadeleştirilmiş
 *    çizimi; tarih kaynağıyla yazılır, alan ya da nüfus gibi sayı verilmez.
 * Süstür: veri okumaz, sayı üretmez. Tarayıcıda tuvalden PNG (önbellekli); Node'da yalnız ızgara (sınama).
 * Açılış yükü (kalite/butce.json, 1 MB): ızgaralar ve kıyı çokgenleri ayrı kabuk/ata-veri.js'te (Kabuk.AtaVeri), kabuk.js gerekince yükler.
 * Burada yalnız çizim kodu, logo ve adlar; veri gelene dek resimler boş çerçevedir (data-portre, data-harita, data-simge), doldur() doldurur. */
(function (kok) {
  'use strict';
  var L = kok.LIFEOS = kok.LIFEOS || {}, Kabuk = L.Kabuk = L.Kabuk || {};

  // Logo: al mühür, altın halka, dış kuşakta on altı yıldız (on altı büyük Türk devleti), ortada bozkurt başı
  var LOGO = { p: {"O":"#5e430c","o":"#e3bb55","a":"#c8102e","A":"#6e0c18","y":"#f2cf6a","w":"#fff6d8","k":"#1e140c","g":"#9aa3ad","G":"#5f6872","e":"#f0a630"}, s: ["..............OOOO..............","..........OOOAAAyAAOOO..........","........OOyAAAAywyAAAyOO........",".......OAywyAAAAyAAAywyAO.......",".....OOAAAyAooooooooAyAAAOO.....","....OOyAAAoaaaaaaaaaaoAAAyOO....","....OywyooaaaaaaaaaaaaooywyO....","...OAAyoaaaaaaaaaaaaaaaaoyAAO...","..OAAAokaaaaaaaaaaaaaaakaoAAAO..","..OyAAokGkaaaaaaaaaaakGkaoAAyO..",".OywyoakGGkaaaaaaaaakGGkaaoywyO.",".OAyAaakGgGkaakkkaakGgGkaaaAyAO.",".OAAoakgGggGkkgggkkGggGgkaaoAAO.",".AAAoakgggggggggggggggggkaaoAAA.","OAAAoakgggggggggggggggggkaaoAAAO","OAyAoakgwgggggggggggggwgkaaoAyAO","OywyoakgwwkeegggggeekwwgkaaoywyO","OAyAoakgwwwkkgggggkkwwwgkaaoAyAO",".AAAoaakwwwwwgggggwwwwwkaaaoAAA.",".OAAoaakgwwwwwgwgwwwwwgkaaaoAAO.",".OAyAaaakgwwwwwwwwwwwgkaaaaAyAO.",".OywyoaaakgwwwwwwwwwgkaaaaoywyO.","..OyAAoaaakgwwwwwwwgkaaaaoAAyO..","..OAAAoaaaakgwkkkwgkaaaaaoAAAO..","...OAAyoaaaakkkkkkkaaaaaoyAAO...","....OywyooaaaaaaaaaaaaooywyO....","....OOyAAAoaaaaaaaaaaoAAAyOO....",".....OOAAAyAooooooooAyAAAOO.....",".......OAywyAAAAyAAAywyAO.......","........OOyAAAAywyAAAyOO........","..........OOOAAAyAAOOO..........","..............OOOO.............."] };
  // Portrelerin adları (ızgaralar ata-veri.js PORTRE)
  var PORTRE = {"mete":{"ad":"Mete Han"},"attila":{"ad":"Attila"},"bumin":{"ad":"Bumin Kağan"},"bilge":{"ad":"Bilge Kağan"},"kultigin":{"ad":"Kül Tigin"},"tonyukuk":{"ad":"Tonyukuk"},"alparslan":{"ad":"Alp Arslan"},"osman":{"ad":"Osman Gazi"},"fatih":{"ad":"Fatih Sultan Mehmet"},"yavuz":{"ad":"Yavuz Sultan Selim"},"kanuni":{"ad":"Kanuni Sultan Süleyman"},"timur":{"ad":"Emir Timur"},"babur":{"ad":"Babür Şah"},"enver":{"ad":"Enver Paşa"},"ataturk":{"ad":"Mustafa Kemal Atatürk"}};
  // metindeki ad → portre (ilk eşleşen)
  var SOZ_PORTRE = [['Atatürk', 'ataturk'], ['Mustafa Kemal', 'ataturk'], ['Fatih', 'fatih'], ['Kül Tigin', 'kultigin'], ['Bilge Kağan', 'bilge'], ['Bumin', 'bumin'],
    ['Tonyukuk', 'tonyukuk'], ['Mete', 'mete'], ['Attila', 'attila'], ['Alp Arslan', 'alparslan'], ['Osman Gazi', 'osman'], ['Yavuz', 'yavuz'], ['Kanuni', 'kanuni'],
    ['Timur', 'timur'], ['Babür', 'babur'], ['Enver', 'enver']];
  // Devletler: ad, yıl, zirve (en geniş hâli), başkent [ad, boylam, enlem], kaynak (tarihler için); sınır çokgeni ata-veri.js SINIR
  var DEVLET = {
    hun: { ad: "Büyük Hun (Asya Hun) Devleti", yil: "Mete Han · MÖ 209–174", zirve: "En geniş hâli: Mete Han dönemi, Mançurya’dan Tarım havzasına", baskent: ["Ötüken bölgesi",102,47.5], kaynak: "TDV İslâm Ansiklopedisi, «Hunlar» maddesi" },
    gokturk: { ad: "Göktürk Kağanlığı", yil: "552–744", zirve: "En geniş hâli: 6. yüzyılın sonu, Mançurya’dan Karadeniz’e", baskent: ["Ötüken",101.5,47.5], kaynak: "TDV İslâm Ansiklopedisi, «Göktürkler» maddesi" },
    uygur: { ad: "Uygur Kağanlığı", yil: "744–840", zirve: "En geniş hâli: 8. yüzyılın ikinci yarısı, Moğolistan merkezli", baskent: ["Ordubalık",102.6,47.4], kaynak: "TDV İslâm Ansiklopedisi, «Uygurlar» maddesi" },
    karahanli: { ad: "Karahanlı Devleti", yil: "840–1212", zirve: "En geniş hâli: 11. yüzyıl başı, Maveraünnehir’den Kaşgar’a", baskent: ["Balasagun",75.2,42.8], kaynak: "TDV İslâm Ansiklopedisi, «Karahanlılar» maddesi" },
    selcuklu: { ad: "Büyük Selçuklu Devleti", yil: "1040–1157", zirve: "En geniş hâli: Melikşah dönemi (1072–1092), Anadolu’dan Maveraünnehir’e", baskent: ["İsfahan",51.7,32.7], kaynak: "TDV İslâm Ansiklopedisi, «Selçuklular» maddesi" },
    timurlu: { ad: "Timur Devleti", yil: "1370–1507", zirve: "En geniş hâli: 1405, Timur’un ölümünde", baskent: ["Semerkant",67,39.7], kaynak: "TDV İslâm Ansiklopedisi, «Timurlular» maddesi" },
    babur: { ad: "Babür Devleti", yil: "1526–1858", zirve: "En geniş hâli: Evrengzib dönemi, 17. yüzyılın sonu", baskent: ["Delhi",77.2,28.6], kaynak: "TDV İslâm Ansiklopedisi, «Bâbürlüler» maddesi" },
    osmanli: { ad: "Osmanlı Devleti", yil: "1299–1922", zirve: "En geniş hâli: 17. yüzyıl, üç kıtada", baskent: ["İstanbul",29,41], kaynak: "TDV İslâm Ansiklopedisi, «Osmanlılar» maddesi" },
  };
  // Türk simgeleri: ad ve tek cümle bilgi (ızgaralar ata-veri.js SIMGE)
  var SIMGE = {
    tug: { ad: "Tuğ", bilgi: "At kuyruğundan hükümranlık sancağı; Hunlardan Osmanlı’ya." },
    kurt: { ad: "Asena", bilgi: "Göktürk türeyiş destanında soyun atası sayılan dişi kurt." },
    sancak: { ad: "Kurt başlı sancak", bilgi: "Çin kaynaklarına göre Göktürk sancağının tepesinde altın kurt başı vardı." },
    ayyildiz: { ad: "Ay yıldız", bilgi: "Al bayrağın ay ve yıldızı; oranlarını 1936 tarihli Türk Bayrağı Kanunu belirler." },
    yildiz8: { ad: "Sekiz köşeli yıldız", bilgi: "Selçuklu ve beylik sanatında çini ve taş işçiliğinin yıldızı." },
    kartal: { ad: "Çift başlı kartal", bilgi: "Anadolu Selçuklu yapılarında görülen hükümranlık simgesi." },
    yay: { ad: "Yay ve ok", bilgi: "Oğuz Kağan Destanı’nda altın yay ve gümüş oklar Bozok ve Üçok boylarına ad verir." },
    kilic: { ad: "Kılıç", bilgi: "Osmanlı’da tahta çıkan padişah kılıç kuşanırdı." },
    kalkan: { ad: "Kalkan", bilgi: "Yuvarlak kalkanlar kamışın ipekle sarılmasıyla örülürdü." },
    kopuz: { ad: "Kopuz", bilgi: "Ozanların telli çalgısı; Dede Korkut onunla anılır." },
    otag: { ad: "Otağ", bilgi: "Hükümdarın çadırı; bozkırda devletin merkezi." },
    kos: { ad: "Kös", bilgi: "Büyük savaş davulu; mehterin en gür sesi." },
  };
  var V = function () { return Kabuk.AtaVeri || null; };

  // ---- harita ızgarası ----
  var L0 = -10, B0 = 60, DL = 1, DB = 0.75, HW = 156, HH = 72;
  function ic(p, x, y) {
    var c = false;
    for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
      var xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function hucre(lo, la) { return [Math.round((lo - L0) / DL - 0.5), Math.round((B0 - la) / DB - 0.5)]; }
  var karaOnbellek = null;
  function kara() {
    if (karaOnbellek) return karaOnbellek;
    var m = [];
    for (var y = 0; y < HH; y++) for (var x = 0; x < HW; x++) {
      var lo = L0 + (x + 0.5) * DL, la = B0 - (y + 0.5) * DB;
      m.push(V().KIYI.kara.some(function (p) { return ic(p, lo, la); }) && !V().KIYI.su.some(function (p) { return ic(p, lo, la); }));
    }
    return (karaOnbellek = m);
  }
  // s derin deniz, S kıyı suyu, w dalga; l kara, L kıyı, n/N dağ (ışık/gölge); d devlet, h devlet taraması, D devlet sınırı,
  // m/M devlet içinde dağ; y/Y/k başkent yıldızı
  function haritaIzgara(ad) {
    var dv = DEVLET[ad], sinir = V() && V().SINIR[ad]; if (!dv || !sinir) return null;
    var k = kara(), st = k.map(function (v, i) { return v && ic(sinir, L0 + (i % HW + 0.5) * DL, B0 - (Math.floor(i / HW) + 0.5) * DB); });
    var at = function (m, x, y) { return x < 0 || y < 0 || x >= HW || y >= HH ? null : m[y * HW + x]; }, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], g = [];
    for (var y = 0; y < HH; y++) {
      var s = [];
      for (var x = 0; x < HW; x++) {
        if (!k[y * HW + x]) {
          var yakin = false;
          for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) if (at(k, x + i, y + j)) yakin = true;
          s.push(yakin ? 'S' : (x * 5 + y * 11) % 23 === 0 && x % 2 === 0 ? 'w' : 's'); continue;
        }
        var kiyi = N4.some(function (n) { return at(k, x + n[0], y + n[1]) === false; });
        if (st[y * HW + x]) s.push(N4.some(function (n) { return at(st, x + n[0], y + n[1]) === false; }) ? 'D' : (x + y) % 4 === 0 ? 'h' : 'd');
        else s.push(kiyi ? 'L' : 'l');
      }
      g.push(s);
    }
    // dağ sıraları: çizgi boyunca beş piksellik tepe (sol yamaç ışıkta, sağ yamaç gölgede)
  var TEPE = [[0, -2, 0], [-1, -1, 0], [0, -1, 1], [-2, 0, 0], [-1, 0, 0], [0, 0, 1], [1, 0, 1], [1, -1, 1], [2, 0, 1]];
    V().DAG.forEach(function (c) {
      for (var i = 1; i < c.length; i++) {
        var a = hucre(c[i - 1][0], c[i - 1][1]), b = hucre(c[i][0], c[i][1]), n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
        for (var t = 0; t <= n; t += 5) {
          var x = Math.round(a[0] + (b[0] - a[0]) * t / n), y = Math.round(a[1] + (b[1] - a[1]) * t / n);
          TEPE.forEach(function (q) {
            var X = x + q[0], Y = y + q[1], v = g[Y] && g[Y][X];
            if (!v || 'lLdhnNmM'.indexOf(v) < 0) return;
            var dv2 = 'dhmM'.indexOf(v) >= 0;
            g[Y][X] = dv2 ? (q[2] ? 'M' : 'm') : (q[2] ? 'N' : 'n');
          });
        }
      }
    });
    if (dv.baskent) {
      var c = hucre(dv.baskent[1], dv.baskent[2]);
      [[0, -2], [-1, -1], [1, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2]].forEach(function (n) { if (g[c[1] + n[1]]) g[c[1] + n[1]][c[0] + n[0]] = 'k'; });
      [[0, -1], [-1, 0], [1, 0], [0, 1]].forEach(function (n) { g[c[1] + n[1]][c[0] + n[0]] = 'Y'; });
      g[c[1]][c[0]] = 'y';
    }
    return g.map(function (r) { return r.join(''); });
  }
  var HARITA_P = { s: '#16263a', S: '#22394f', w: '#2e4a63', l: '#b9a074', L: '#8c7350', n: '#e2d0a2', N: '#6a5233',
    d: '#9e2a20', h: '#b2372b', D: '#4e1410', m: '#cf6658', M: '#5c1612', y: '#fff3c4', Y: '#e9bd4c', k: '#2a1a0a' };

  // ---- çizim: doku, yaldız çerçeve ----
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; }
  function titre(x, y) { var h = Math.imul(x, 374761393) + Math.imul(y, 668265263) >>> 0; h = Math.imul(h ^ h >>> 13, 1274126177) >>> 0; return ((h >>> 16) & 255) / 255 - 0.5; }
  // satırları RGBA dizisine boyar; doku: parlaklık oynaması (0.1 = ±%5)
  function boya(d, W, satirlar, pal, ox, oy, doku) {
    var on = {};
    for (var y = 0; y < satirlar.length; y++) for (var x = 0; x < satirlar[y].length; x++) {
      var ch = satirlar[y][x]; if (ch === '.') continue;
      var r = on[ch] || (on[ch] = hx(pal[ch])), f = 1 + titre(x + ox, y + oy) * doku, i = ((y + oy) * W + x + ox) * 4;
      d[i] = Math.min(255, r[0] * f); d[i + 1] = Math.min(255, r[1] * f); d[i + 2] = Math.min(255, r[2] * f); d[i + 3] = 255;
    }
  }
  // dört halkalı yaldız çerçeve: koyu dış kenar, eğimli altın (üst-sol ışıkta), boncuklu süs halkası, resme düşen iç gölge
  var CERCEVE = ['#3a2810', ['#e6c260', '#a67824'], ['#c99a3c', '#f2d57e', '#f7e6a6'], '#22170a'];
  function cerceve(d, W, H) {
    var p = [];
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var h = Math.min(x, y, W - 1 - x, H - 1 - y); if (h > 3) continue;
      var c = h === 0 ? CERCEVE[0] : h === 3 ? CERCEVE[3] : h === 1 ? CERCEVE[1][(x === h || y === h) && x < W - 1 - h && y < H - 1 - h ? 0 : 1]
        : ((x <= 3 || x >= W - 4) && (y <= 3 || y >= H - 4)) ? CERCEVE[2][2] : CERCEVE[2][(x + y) % 2];
      p.push([x, y, c]);
    }
    p.forEach(function (q) { var r = hx(q[2]), f = 1 + titre(q[0] + 91, q[1] + 37) * 0.12, i = (q[1] * W + q[0]) * 4; d[i] = Math.min(255, r[0] * f); d[i + 1] = Math.min(255, r[1] * f); d[i + 2] = Math.min(255, r[2] * f); d[i + 3] = 255; });
  }
  var CER = 4;
  // tablo: ızgara + çerçeve → { w, h, d (RGBA) }
  function tablo(satirlar, pal, doku) {
    var w = satirlar[0].length + CER * 2, h = satirlar.length + CER * 2, d = new Uint8ClampedArray(w * h * 4);
    boya(d, w, satirlar, pal, CER, CER, doku); cerceve(d, w, h);
    return { w: w, h: h, d: d };
  }
  var resimOnbellek = {};
  function png(ad, t) {
    if (resimOnbellek[ad]) return resimOnbellek[ad];
    if (typeof document === 'undefined' || !t) return null;
    try {
      var c = document.createElement('canvas'); c.width = t.w; c.height = t.h;
      c.getContext('2d').putImageData(new ImageData(t.d, t.w, t.h), 0, 0);
      return (resimOnbellek[ad] = c.toDataURL('image/png'));
    } catch (e) { return null; }
  }
  function portreTablo(ad) { var p = V() && V().PORTRE[ad]; return p ? tablo(p.s, p.p, 0.11) : null; }
  function haritaTablo(ad) { var g = haritaIzgara(ad); return g ? tablo(g, HARITA_P, 0.08) : null; }
  function kac(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Portre: yaldız çerçeveli tablo; ad ekran okuyucuya alt metinle (kim olduğu bilgidir)
  function portreHtml(ad, sinif) {
    var p = PORTRE[ad], u = p && png('p-' + ad, portreTablo(ad));
    return p ? '<img class="ata-portre' + (sinif ? ' ' + sinif : '') + '" data-portre="' + ad + '"' + (u ? ' src="' + u + '"' : '') + ' width="40" height="40" alt="' + kac(p.ad + ', piksel portre') + '">' : '';
  }
  // Metindeki addan portre (söz kaynağı, hükümdar adı): «Atatürk, …», «Kül Tigin Yazıtı», «Tuğrul Bey, Alp Arslan»; portresi olmayan metinde boş
  function sozPortresi(kaynak) {
    var k = String(kaynak || '');
    for (var i = 0; i < SOZ_PORTRE.length; i++) if (k.indexOf(SOZ_PORTRE[i][0]) >= 0 && PORTRE[SOZ_PORTRE[i][1]]) return SOZ_PORTRE[i][1];
    return null;
  }
  // ust === false: başlıksız (çevreleyen kart aynı devletin adını zaten yazıyor)
  function haritaHtml(ad, ust) {
    var d = DEVLET[ad]; if (!d) return '';
    var u = png('h-' + ad, haritaTablo(ad));
    return '<figure class="ata-harita">' + (ust === false ? '' : '<figcaption class="ata-harita__ust"><span class="ata-harita__etiket">Günün haritası</span>' +
      '<span class="ata-harita__ad">' + kac(d.ad) + '</span><span class="ata-harita__yil">' + kac(d.yil) + '</span></figcaption>') +
      '<img class="ata-harita__resim" data-harita="' + ad + '"' + (u ? ' src="' + u + '"' : '') + ' width="' + (HW + CER * 2) + '" height="' + (HH + CER * 2) + '" alt="' + kac(d.ad + ' haritası, ' + d.zirve + '; sınırlar yaklaşık') + '">' +
      '<p class="ata-harita__not">' + kac(d.zirve) + (d.baskent ? ' · <span class="ata-harita__yildiz" aria-hidden="true">✦</span> ' + kac(d.baskent[0]) : '') + '</p>' +
      '<p class="ata-harita__kaynak">Sınırlar yaklaşık, sadeleştirilmiş çizim · Tarihler: ' + kac(d.kaynak) + '</p></figure>';
  }
  function gununHaritasi(t) { var a = Object.keys(DEVLET), n = Math.floor(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / 864e5); return a[n % a.length]; }

  // Tarih tabloları (sahip: «pixel artları çok kötü yapıyoruz»): siluet zafer tabloları kalktı; yerine önceki turun elle ayarlanmış sahneleri.
  // Resimler ayrı kabuk/tablo.js'te (açılış yüküne girmez); yüklenene dek çerçeve boş, tabloDoldur doldurur.
  var TABLO = {
    otuken: { ad: 'Ötüken', alt: 'Göktürk Kağanlığı', metin: 'Kağan otağı, önünde altın kurt başlı tuğ; kaplumbağa kaideli Kül Tigin yazıtı ve doğuya uzanan balbal sırası.' },
    kocatepe: { ad: 'Kocatepe', alt: '26 Ağustos 1922 · Büyük Taarruz', metin: 'Başkomutan Mustafa Kemal Paşa taarruzu Kocatepe’den yönetti; 30 Ağustos’ta Başkomutanlık Meydan Muharebesi kazanıldı.' },
    semerkant: { ad: 'Semerkant', alt: 'Timur Devleti · 1370–1507', metin: 'Timur’un başkenti: firuze kubbeli Gur-i Emir, uzakta Bibi Hanım.' }
  };
  function tabloHtml(ad, sinif) {
    var t = TABLO[ad]; if (!t) return '';
    return '<figure class="tablo' + (sinif ? ' ' + sinif : '') + '"><span class="tablo__cerceve"><img class="tablo__resim" data-tablo="' + ad + '" width="420" height="236" alt="' + kac(t.ad + ', ' + t.alt + ', piksel tablo') + '"></span>' +
      '<figcaption><span class="tablo__ad">' + kac(t.ad) + '</span><span class="tablo__alt">' + kac(t.alt) + '</span><span class="tablo__metin">' + kac(t.metin) + '</span></figcaption></figure>';
  }
  function tablolarHtml() {
    return '<section class="tablolar"><h3 class="tarih-arsiv__bas">Tarih tabloları</h3><div class="tablolar__izgara">' + Object.keys(TABLO).map(function (k) { return tabloHtml(k); }).join('') + '</div></section>';
  }
  // kabuk/tablo.js yüklüyse boş çerçeveleri doldurur (telefonda küçük, masaüstünde büyük resim); yüklü değilse false
  function tabloDoldur(el) {
    var R = Kabuk.Tablo; if (!R) return false;
    // telefonda 336 piksellik resim 1× (cihazda tam sayı kat), masaüstünde 420'lik resim 2×: pikseller eşit kalır
    var kucuk = kok.matchMedia && kok.matchMedia('(max-width: 640px)').matches;
    el.querySelectorAll('img[data-tablo]:not([src])').forEach(function (i) { var r = R[i.getAttribute('data-tablo')]; if (r) i.src = kucuk ? r.kucuk : r.buyuk; });
    return true;
  }
  // millî günün tablosu (ay-gün → tablo): o gün Tarih'in «Türk tarihi» kartında
  var TABLO_GUN = { '8-26': 'kocatepe', '8-30': 'kocatepe' };
  function gununTablosu(t) { return TABLO_GUN[(t.getMonth() + 1) + '-' + t.getDate()] || null; }
  // Türk simgeleri (16×16): bant (süs) ve kart (adı ve bir cümle bilgi)
  function simgeTablo(ad) { var x = V() && V().SIMGE[ad]; if (!x) return null; var d = new Uint8ClampedArray(16 * 16 * 4); boya(d, 16, x.s, x.p, 0, 0, 0); return { w: 16, h: 16, d: d }; }
  function simgeHtml(ad, sinif) { var u = SIMGE[ad] && png('s-' + ad, simgeTablo(ad)); return SIMGE[ad] ? '<img class="simge' + (sinif ? ' ' + sinif : '') + '" data-simge="' + ad + '"' + (u ? ' src="' + u + '"' : '') + ' width="16" height="16" alt="">' : ''; }
  function turkBandi() {
    var a = Object.keys(SIMGE), h = '';
    a.forEach(function (k, i) { h += simgeHtml(k) + (i < a.length - 1 ? '<span class="turk-bant__ara">✦</span>' : ''); });
    return h ? '<div class="turk-bant" aria-hidden="true">' + h + '</div>' : '';
  }
  function simgelerHtml() {
    return '<section class="simgeler"><h3 class="tarih-arsiv__bas">Türk simgeleri</h3><ul class="simgeler__liste">' + Object.keys(SIMGE).map(function (k) {
      return '<li>' + simgeHtml(k, 'simgeler__resim') + '<span><b>' + kac(SIMGE[k].ad) + '</b>' + kac(SIMGE[k].bilgi) + '</span></li>'; }).join('') + '</ul></section>';
  }
  // Bütün haritalar: Tarih arşivinde küçük tablolar
  function haritalarHtml() {
    return '<section class="ata-haritalar"><h3 class="tarih-arsiv__bas">Türk devletleri haritaları</h3><ul>' + Object.keys(DEVLET).map(function (k) {
      var d = DEVLET[k], u = png('h-' + k, haritaTablo(k));
      return '<li><img data-harita="' + k + '"' + (u ? ' src="' + u + '"' : '') + ' width="' + (HW + CER * 2) + '" height="' + (HH + CER * 2) + '" alt="' + kac(d.ad + ' haritası; sınırlar yaklaşık') + '">' +
        '<span><b>' + kac(d.ad) + '</b> ' + kac(d.yil) + '</span><span>' + kac(d.zirve) + '</span></li>'; }).join('') +
      '</ul><p class="ata-harita__kaynak">Sınırlar yaklaşık, sadeleştirilmiş çizim · Tarihler: TDV İslâm Ansiklopedisi ilgili maddeleri</p></section>';
  }

  // Başbuğ logosu (2026-11-19, sahip: «bir kurdun etrafında Türk devleti sayısı kadar yıldız»): al mühür, on altı yıldız, bozkurt başı; 32×32
  function logoTablo() { var d = new Uint8ClampedArray(32 * 32 * 4); boya(d, 32, LOGO.s, LOGO.p, 0, 0, 0.05); return { w: 32, h: 32, d: d }; }
  function logoHtml(sinif) { var u = png('logo', logoTablo()); return u ? '<img class="' + (sinif || 'logo') + '" src="' + u + '" width="32" height="32" alt="">' : ''; }
  // sekme simgesi: k kat büyütülmüş keskin PNG (tarayıcı küçültürken yumuşatmasın)
  function logoPng(k) {
    if (typeof document === 'undefined') return null;
    try {
      var t = logoTablo(), c = document.createElement('canvas'), b = document.createElement('canvas'); b.width = b.height = 32; b.getContext('2d').putImageData(new ImageData(t.d, 32, 32), 0, 0);
      c.width = c.height = 32 * k; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(b, 0, 0, 32 * k, 32 * k); return c.toDataURL('image/png');
    } catch (e) { return null; }
  }

  // ata-veri.js yüklüyse boş portre, harita ve simge çerçevelerini doldurur; yüklü değilse false
  function doldur(el) {
    if (!V()) return false;
    el.querySelectorAll('img[data-portre]:not([src]), img[data-harita]:not([src]), img[data-simge]:not([src])').forEach(function (i) {
      var a = i.getAttribute('data-portre'), h = i.getAttribute('data-harita'), s = i.getAttribute('data-simge');
      var u = a ? png('p-' + a, portreTablo(a)) : h ? png('h-' + h, haritaTablo(h)) : png('s-' + s, simgeTablo(s));
      if (u) i.src = u;
    });
    return true;
  }

  var Ata = { doldur: doldur, LOGO: LOGO, logoTablo: logoTablo, logoHtml: logoHtml, logoPng: logoPng, PORTRE: PORTRE, DEVLET: DEVLET, SIMGE: SIMGE, HW: HW, HH: HH, CER: CER, haritaIzgara: haritaIzgara, portreTablo: portreTablo, haritaTablo: haritaTablo,
    simgeTablo: simgeTablo, portreHtml: portreHtml, sozPortresi: sozPortresi, haritaHtml: haritaHtml, haritalarHtml: haritalarHtml, gununHaritasi: gununHaritasi,
    TABLO: TABLO, tabloHtml: tabloHtml, tablolarHtml: tablolarHtml, tabloDoldur: tabloDoldur, gununTablosu: gununTablosu, simgeHtml: simgeHtml, turkBandi: turkBandi, simgelerHtml: simgelerHtml };
  Kabuk.Ata = Ata;
  if (typeof module !== 'undefined' && module.exports) module.exports = Ata;
})(typeof window !== 'undefined' ? window : globalThis);
