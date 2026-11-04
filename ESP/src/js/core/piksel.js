/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/piksel.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* PİKSEL ODA — piksel temasının sahnesi (brand/ortak/piksel.css).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/piksel.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır.

   Sözler:
     1. SÜSTÜR. Hiçbir sayıya ve karara bakmaz, veri okumaz, yazmaz. Düşerse yalnız duvar düz kalır.
     2. KODLA ÇİZİLİR. Görsel dosyası yok; çevrimdışı ve tek dosyada çalışır.
     3. EKRANI YORMAZ. Sahne bir kez hazırlanır, yalnız kedi, fincan ve ampuller 8 kare/sn oynar;
        sekme arkadayken ya da sayfa kaydırılmışken durur; animasyon kapalıysa tek kare çizilir.
     4. TEMAYA UYAR. Açık ve koyuda ayrı palet; piksel teması seçili değilse hiç çizmez. */
window.LIFEOS = window.LIFEOS || {};

(function(L){
  const OLCEK = 4;
  const KEDI = ['...k...k............','..kck.kck...kkkkk...','.kcccccccckkcccccck.','.kcccccccckcdccdccck','.kckcckcccccdccdccck','.kccpcccccccccccccck','..kllllcccccccccccck','..kllllkkccccccccck.','...kkkkllkkkkkkkkk..','........kkk.........'];
  const KEDI_P = { k:'#4a2a26', c:'#ee9c52', d:'#c9743a', l:'#fbe3bb', p:'#e8826e' };
  const LAMBA = ['....sssss....','...syyyyys...','..syyyyyyys..','.syyyyyyyyys.','.syyyyyyyyys.','..ooooooooo..','......b......','......b......','......b......','......b......','....bbbbb....'];
  const LAMBA_P = { s:'#f4b860', y:'#ffe6a0', o:'#c98a3e', b:'#4a2f2a' };
  const FINCAN = ['.mmmmm..','.mmmmmmm','.mmmmm.m','.mmmmmmm','.nnnnn..','..nnn...'];
  const FINCAN_P = { m:'#fbeed5', n:'#d9b896' };
  const SAKSI = ['...g......','..ggg.g...','.gggggg...','..gGggGg..','.gGgggg...','...ggg....','..ppppp...','..ppppp...','...ppp....'];
  const SAKSI_P = { g:'#7fa35a', G:'#5a7f47', p:'#c2603f' };
  const PALET = {
    gunduz:{ duvar:['#efb27a', '#d09168', '#a66d62', '#7c5560'], yer:'#6d463c', yerC:'#5a382f', gok:['#4d4679', '#7c5691', '#c3657f', '#ef916b', '#fac67d'], gunes:'#ffeeb0', tepe1:'#6a4470', tepe2:'#3f2f50', cerceve:'#f2dcb8', golge:'#c79f7c', tel:'#3f282c' },
    gece:{ duvar:['#a8765f', '#7c5a58', '#54434f', '#332a44'], yer:'#3a2a2e', yerC:'#2a1e26', gok:['#12122e', '#1b1b45', '#27275c', '#343070', '#46407f'], gunes:'#f2f0d8', tepe1:'#241f49', tepe2:'#15122e', cerceve:'#cdb798', golge:'#8e7a66', tel:'#1c1218' },
  };

  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function spr(g, x, y, satirlar, p){
    x = Math.round(x); y = Math.round(y);
    satirlar.forEach((r, j) => { for(let i = 0; i < r.length; i++){ const c = p[r[i]]; if(c){ g.fillStyle = c; g.fillRect(x + i, y + j, 1, 1); } } });
  }
  function daire(g, cx, cy, r, c){
    g.fillStyle = c;
    for(let y = -r; y <= r; y++){ const w = Math.round(Math.sqrt(r * r - y * y)); g.fillRect(Math.round(cx) - w, Math.round(cy) + y, w * 2 + 1, 1); }
  }
  const kemer = (i, r) => (i < r ? Math.round(r - Math.sqrt(Math.max(0, r * r - (r - i) * (r - i)))) : 0);

  /* Oda, içerik sütununun başına oturur; x0 kenar çubuğunun hemen sağıdır. */
  function yerlesim(W, x0){
    return { rh:60, yer:52, x0, wx:x0 + 34, wy:6, ww:32, wh:30, dx:x0 + 2, dw:Math.min(W - x0 - 4, 150), dy:44, lx:x0 + 5, ly:33, kx:x0 + 20, ky:34, mx:x0 + 44, bx:x0 + 60 };
  }

  function arkaPlan(g, W, H, o, P){
    const yer = o.yer, lx = o.lx + 6, ly = o.ly + 3, bant = [14, 24, 40], r = P.duvar;
    for(let y = 0; y < yer; y++) for(let x = 0; x < W; x++){
      const d = Math.hypot((x - lx) / 1.3, y - ly);
      let i = 0;
      while(i < 3 && d > bant[i]) i++;
      if(i < 3 && d > bant[i] - 1.6 && (x + y) % 2) i++;
      g.fillStyle = r[i]; g.fillRect(x, y, 1, 1);
    }
    R(g, 0, yer, W, H - yer, P.yer);
    for(let y = yer + 6; y < H; y += 7) R(g, 0, y, W, 1, P.yerC);
    R(g, 0, yer - 2, W, 2, P.tel); R(g, 0, yer, W, 1, P.tel);

    const { wx, wy, ww, wh } = o, ka = Math.floor(ww / 2);
    for(let i = -3; i < wh + 3; i++){ const q = kemer(i + 3, ka + 3); R(g, wx - 3 + q, wy + i, ww + 6 - q * 2, 1, P.cerceve); }
    for(let i = wh; i < wh + 3; i++) R(g, wx - 3, wy + i, ww + 6, 1, P.golge);
    const n = P.gok.length;
    for(let i = 0; i < wh; i++){
      const q = kemer(i, ka), f = Math.min(n - 1, Math.floor(i / wh * 1.15 * n)), s = Math.floor((i + 1) / wh * 1.15 * n);
      for(let x = q; x < ww - q; x++) R(g, wx + x, wy + i, 1, 1, s !== f && s < n && (x + i) % 2 ? P.gok[s] : P.gok[f]);
    }
    const gy = wy + wh * 0.74;
    daire(g, wx + ww * 0.62, gy, 4, P.gunes);
    for(let x = 0; x < ww; x++){ const h = Math.round(gy + 2 + Math.sin(x * 0.16 + 1) * 2); R(g, wx + x, h, 1, wy + wh - h, P.tepe1); }
    for(let x = 0; x < ww; x++){ const h = Math.round(gy + 5 + Math.sin(x * 0.11 + 3.4)); R(g, wx + x, h, 1, wy + wh - h, P.tepe2); }
    R(g, wx + ka - 1, wy, 2, wh, P.cerceve); R(g, wx, wy + Math.round(wh * 0.48), ww, 2, P.cerceve);
    R(g, wx - 5, wy + wh + 3, ww + 10, 2, P.cerceve); R(g, wx - 5, wy + wh + 5, ww + 10, 1, P.golge);
    spr(g, wx + ww - 7, wy + wh - 6, SAKSI, SAKSI_P);

    R(g, o.dx, o.dy, o.dw, 2, '#c28d5c'); R(g, o.dx, o.dy + 2, o.dw, 3, '#8a5c40'); R(g, o.dx, o.dy + 5, o.dw, 1, P.tel);
    R(g, o.dx + 3, o.dy + 6, 3, yer - o.dy - 6, '#6a4434'); R(g, o.dx + o.dw - 6, o.dy + 6, 3, yer - o.dy - 6, '#6a4434');
    spr(g, o.lx, o.dy - 11, LAMBA, LAMBA_P);
    [['#6f8fa0', 14], ['#c2603f', 12], ['#e8b45a', 13]].forEach((k, i) => { R(g, o.bx, o.dy - 2 - i * 2, k[1], 2, k[0]); R(g, o.bx, o.dy - 2 - i * 2, k[1], 1, '#ffffff30'); });
    R(g, o.kx + 1, o.dy - 1, 18, 1, '#a56f48');
    spr(g, o.mx, o.dy - 6, FINCAN, FINCAN_P);
    if(o.dw > 100){
      const sx = o.x0 + 84;
      R(g, sx, 20, 26, 1, P.tel);
      [['#c2603f', 10], ['#e8b45a', 8], ['#6f8fa0', 11], ['#7fa35a', 9], ['#fbeed5', 7], ['#c2603f', 9]].forEach((k, i) => { R(g, sx + 1 + i * 4, 20 - k[1], 3, k[1], k[0]); R(g, sx + 1 + i * 4, 20 - k[1], 1, k[1], '#ffffff30'); });
    }
    for(let x = 0; x < W; x++) R(g, x, Math.round(3 + Math.abs(Math.sin(x / 30 * Math.PI)) * 2), 1, 1, P.tel);
  }

  function hareket(g, W, o, P, t){
    spr(g, o.kx, o.ky, KEDI, KEDI_P);
    if(Math.sin(t * 1.2) > 0.25){ R(g, o.kx + 12, o.ky, 5, 1, KEDI_P.k); R(g, o.kx + 12, o.ky + 1, 5, 1, KEDI_P.c); }
    const f = Math.floor(t * 2.2);
    for(let i = 0; i < 3; i++){ const k = (f + i) % 3; R(g, o.mx + 3 + ((k + i) % 2), o.dy - 8 - k * 2 - i, 1, 1, '#fbeed5' + ['aa', '77', '44'][k]); }
    for(let i = 0, x = 4; x < W; x += 13, i++){
      const y = Math.round(3 + Math.abs(Math.sin(x / 30 * Math.PI)) * 2), yanik = Math.sin(t * 0.9 + i * 1.3) > 0.2;
      R(g, x, y + 1, 2, 2, yanik ? '#ffe6a0' : '#f4b860'); R(g, x, y, 2, 1, P.tel);
    }
    if(Math.sin(t * 0.7) > -0.4) R(g, o.wx + o.ww * 0.3, o.wy + 5, 1, 1, '#fff6d0');
    if(Math.sin(t * 0.5 + 2) > -0.2) R(g, o.wx + o.ww * 0.72, o.wy + 7, 1, 1, '#fff6d0');
  }

  const durum = { c:null, g:null, arka:null, o:null, P:null, zaman:null };
  const secili = () => document.documentElement.getAttribute('data-zemin') === 'piksel';
  function koyuMu(){
    const t = document.documentElement.getAttribute('data-theme');
    if(t) return t === 'dark';
    try{ return window.matchMedia('(prefers-color-scheme: dark)').matches; }catch(e){ return false; }
  }
  function hareketsiz(){
    if(document.documentElement.getAttribute('data-hareket') === 'az') return true;
    return !!(L.ANIMASYON && L.ANIMASYON.azMi && L.ANIMASYON.azMi());
  }
  function kare(t){
    if(!durum.g) return;
    durum.g.drawImage(durum.arka, 0, 0);
    hareket(durum.g, durum.c.width, durum.o, durum.P, t);
  }
  function hazirla(){
    if(!durum.c) return;
    const W = Math.ceil(window.innerWidth / OLCEK), H = Math.ceil(window.innerHeight / OLCEK);
    durum.c.width = W; durum.c.height = H;
    durum.arka = document.createElement('canvas'); durum.arka.width = W; durum.arka.height = H;
    const kenar = document.querySelector('.site--v5 > .kenar');
    const genis = kenar && getComputedStyle(kenar).display !== 'none' ? kenar.getBoundingClientRect().right : 0;
    durum.o = yerlesim(W, Math.ceil(genis / OLCEK) + 4);
    durum.P = koyuMu() ? PALET.gece : PALET.gunduz;
    arkaPlan(durum.arka.getContext('2d'), W, H, durum.o, durum.P);
    durum.g = durum.c.getContext('2d');
    kare(2);
  }
  function dongu(){
    clearInterval(durum.zaman); durum.zaman = null;
    if(!durum.c || hareketsiz()) return;
    durum.zaman = setInterval(() => {
      if(document.visibilityState === 'hidden' || window.scrollY > 260) return;
      kare(Date.now() / 1000);
    }, 125);
  }
  function uygula(){
    if(!secili()){
      if(durum.c){ durum.c.remove(); durum.c = null; durum.g = null; }
      clearInterval(durum.zaman); durum.zaman = null;
      return;
    }
    if(!durum.c){
      durum.c = document.createElement('canvas');
      durum.c.className = 'piksel-oda';
      durum.c.setAttribute('aria-hidden', 'true');
      document.body.prepend(durum.c);
    }
    hazirla();
    dongu();
  }
  function kur(){
    uygula();
    let bekle = null;
    window.addEventListener('resize', () => { clearTimeout(bekle); bekle = setTimeout(uygula, 150); });
    new MutationObserver(uygula).observe(document.documentElement, { attributes:true, attributeFilter:['data-zemin', 'data-theme', 'data-hareket'] });
    /* Kenar çubuğu kabukla sonradan gelir: oda onun yanına oturur. */
    const app = document.getElementById('app');
    if(app){ const mo = new MutationObserver(() => { if(document.querySelector('.site--v5 > .kenar')){ mo.disconnect(); uygula(); } }); mo.observe(app, { childList:true, subtree:true }); }
  }
  if(typeof document !== 'undefined'){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur); else kur();
  }
  L.PIKSEL = Object.freeze({ uygula, yerlesim });
})(window.LIFEOS);
