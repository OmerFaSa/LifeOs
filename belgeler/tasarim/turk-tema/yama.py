# Örnek tema: brand/ortak/piksel-doga.js'in bir kopyasına üç manzara ekler (bozkir, kocatepe, semerkant).
# Asıl dosyaya dokunmaz; çıktı bu klasörde piksel-doga-turk.js olur. Çalıştır: python yama.py
#
# Araştırma notları (2026-11-08):
# - Göktürk: Çin kaynakları (Zhoushu) kağan otağının önünde altın kurt başlı tuğ dikildiğini yazar.
# - Kül Tigin anıtı: yazıt kaplumbağa kaide üstündedir; tepelikte dağ keçisi (arkar) damgası vardır;
#   balbal sıraları anıttan doğuya ~3 km uzanır. Yanında taş insan heykelleri (taş baba) bulunur.
# - Gökyüzü: Yedi Han (Büyük Ayı), Demir Kazık (Kutup Yıldızı), Kuş Yolu (Samanyolu).
# - Kocatepe, 26 Ağustos 1922: sis yüzünden topçu ateşi ilk ışıkla başladı; başkomutanın yanında
#   Fevzi ve İsmet Paşalar. Kağnı ve cephane taşıyan kadınlar: İstiklal Yolu.
# - Timur: üç halka damgası; Gur-i Emir'in yüksek kasnaklı, dilimli firuze kubbesi; Bibi Hanım
#   camisinin büyük taç kapısı. Registan'ın bugünkü hali Uluğ Bey ve sonrasıdır, bu yüzden kullanılmadı.
import pathlib, sys

BURA = pathlib.Path(__file__).parent
KAYNAK = BURA.parents[2] / 'brand' / 'ortak' / 'piksel-doga.js'
s = KAYNAK.read_text(encoding='utf-8')

def ekle(capa, yeni, once=True):
    global s
    if s.count(capa) != 1:
        sys.exit('çapa bulunamadı ya da birden çok: ' + capa[:60])
    s = s.replace(capa, (yeni + capa) if once else (capa + yeni))

# Renkler: altın, al bayrak, şafak siluet + kenar ışığı, uzak siluet
ekle("T:'#8a6450'", ", G:'#f0c040', A:'#e30a17', a:'#a8101c', X:'#241826', Z:'#e8906c', V:'#6a5470'", once=False)

SPRITLER = r"""
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
"""
ekle("  const POZ = {", SPRITLER)

POZ = r"""
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
"""
ekle("    gizli:{ h:1, k:[[]] },", POZ)
ekle("  /* Büyük bulut sprit'leri", r"""  const renkle = (k, m) => k.map(f => f.map(r => r.replace(/./g, c => m[c] || c)));
  POZ.atli2 = { h:8, k:renkle(POZ.atli.k, { R:'B', o:'K', N:'d', n:'K', g:'K' }) };
  POZ.atli3 = { h:8, k:renkle(POZ.atli.k, { R:'T', o:'R', N:'w', n:'W', g:'t' }) };
  POZ.atak = { h:0.3, k:renkle(POZ.at.k, { N:'w', n:'W', g:'t', e:'W' }) };
  POZ.atkara = { h:0.3, k:renkle(POZ.at.k, { N:'d', n:'d', g:'e' }) };
  POZ.deve2 = { h:0.8, k:renkle(POZ.deve.k, { d:'t' }) };
""")

YARDIM = r"""
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
"""
ekle("  /* ---------- MANZARALAR ---------- */", YARDIM)

TURLER = r"""
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
"""
ekle("  };\n  const TUR_LISTE", TURLER)
ekle("const GOK_BOY = { ", "bozkir:0.62, kocatepe:0.72, semerkant:0.66, ", once=False)

(BURA / 'piksel-doga-turk.js').write_text(s, encoding='utf-8')
print('yazıldı:', BURA / 'piksel-doga-turk.js')
