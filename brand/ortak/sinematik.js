/* SİNEMATİK — hesaba ilk girişte LifeOS'u anlatan 40 saniyelik piksel film.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/sinematik.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Biçimi `sinematik.css`,
   testi `sinematik.test.js`.
   ==================================================================

   Kullanıcı (2026-11-05): «hesaba ilk kez girildiğinde LifeOS'u ve misyonunu
   anlatan mini piksel sanat sinematiği»; «video şeklinde olsun, güzel geçişler,
   güzel sözler, anlatan güzel bir ses».

   Sözler:
     1. SÜSTÜR. Hiçbir veri okumaz, yazmaz; sayı göstermez. Çizelgedeki
        sütunlar örnektir, kimsenin kaydı değildir.
     2. MOTORU KULLANIR. Manzara, mahalle, King'in odası ve figürler
        piksel-doga.js, piksel-apartman.js ve piksel-figur.js'in kendi
        çizimleridir; burada yalnız kamera, geçiş ve yerleşim var.
     3. HAREKET YUMUŞAK. Görünüm piksel, hareket kare kare değil: kamera ve
        figürler ekran pikseli hassasiyetinde, yumuşatılmış eğriyle kayar.
        Animasyonlar «Az» ise aynı film hareketsiz slaytlar olur (kesme geçiş).
     4. BİR KEZ, HESAP BAŞINA. Görüldü bilgisi kapıya bakmayan çerezdedir:
        aynı cihazdaki üç modül birlikte bilir. Menü › Tanıtım filmi yeniden açar.
     5. SES İSTEĞE BAĞLI. Film «İzle» denmeden başlamaz; ses düğmesi her an
        kapatır. Anlatım King'in yerel sesiyle (EMA) bir kez kaydedildi
        (`brand/medya/tanitim/`); dosya çalmazsa cihazın Türkçe sesi okur.
     6. HER AN ÇIKILIR. «Geç» ve Esc her sahnede; metin ekran okuyucuya
        gider, tuval gizlidir. Sekme arkadayken film durur. */
window.LIFEOS.PARCA.yazilar({
  'ortak.sinematik.ad':'LifeOS tanıtımı',
  'ortak.sinematik.menu':'Tanıtım filmi',
  'ortak.sinematik.izle':'İzle',
  'ortak.sinematik.gec':'Geç',
  'ortak.sinematik.ses-ac':'Sesi aç',
  'ortak.sinematik.ses-kapa':'Sesi kapat',
  'ortak.sinematik.duraklat':'Duraklat',
  'ortak.sinematik.surdur':'Sürdür',
  'ortak.sinematik.basla':'Başla',
  'ortak.sinematik.yeniden':'Yeniden izle',
  'ortak.sinematik.s0':'Her gün, küçük bir başlangıçtır.',
  'ortak.sinematik.s1':'Bu LifeOS: gündelik hayatın için tek bir sistem.',
  'ortak.sinematik.s2':'AYS, sınava giden yolu planlar.',
  'ortak.sinematik.s3':'SPİ; uykunu, beslenmeni ve hareketini izler.',
  'ortak.sinematik.s4':'ESP, dilden felsefeye gelişimini planlar.',
  'ortak.sinematik.s5':'Hepsinin yanında King var: seni tanır, sana yol gösterir.',
  'ortak.sinematik.s6':'Verin senin bilgisayarında kalır.',
  'ortak.sinematik.s7':'Sayıyı ve kararı kod verir; boş geçen gün sıfır sayılmaz.',
  'ortak.sinematik.s8':'Ustalık küçük adımlarla gelir.',
  'ortak.sinematik.s9':'Hazırsan, başlayalım.',
});

window.LIFEOS.SINEMATIK = (function(L){
  'use strict';
  const yz = id => L.PARCA.yazi('ortak.sinematik.' + id);
  const OLCEK = 3, SURE = 40.5, SON_KART = 39.2, CEREZ = 'lifeos_sinematik';
  const SES_DOSYA = 'img/marka/tanitim-sinematik.mp4';
  /* [başlangıç sn, süre sn]: kayıttaki anlatımın yeri; ses dosyası bu çizelgeyle üretildi. */
  const SATIR = Object.freeze([[0.6, 1.96], [3.0, 3.2], [7.9, 2.32], [11.4, 2.96], [15.2, 2.76],
    [19.4, 3.4], [25.0, 1.8], [29.4, 3.52], [34.6, 1.72], [37.8, 1.2]]);
  /* Sahneler 0,8 sn üst üste biner: geçiş o aralıkta çözülerek olur. */
  const SAHNE = Object.freeze([
    { id:'gol', bas:0, son:7.4 }, { id:'sokak', bas:6.6, son:19.2 }, { id:'king', bas:18.4, son:24.6 },
    { id:'ev', bas:23.8, son:28.8 }, { id:'kod', bas:28.0, son:34.0 }, { id:'basamak', bas:33.2, son:SURE + 60 }]);
  const RENK = Object.freeze({ ays:'#5a84ea', spi:'#ff7d8f', esp:'#ffd166' });

  let d = null;   // açık filmin durumu; kapalıyken null

  /* ---------- zaman ve hareket ---------- */
  const hareketAz = () => document.documentElement.getAttribute('data-hareket') === 'az' || !!(L.hareketAz && L.hareketAz());
  const yumusak = f => (f <= 0 ? 0 : f >= 1 ? 1 : f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2);
  /* a-b arasında 0'dan 1'e; hareketsizken ortasında keser (slayt). */
  const ara = (t, a, b) => (d && d.az ? (t >= (a + b) / 2 ? 1 : 0) : yumusak((t - a) / (b - a)));
  const karis = (x, y, f) => x + (y - x) * f;
  const oyna = () => (d && d.az ? 0 : 1);
  /* Kesirli ölçek ekran pikselinin tam katına iner: büyütülen çizimde pikseller eşit kalır. */
  const ekranKat = (x, en) => Math.max(en || 1 / OLCEK, Math.floor(x * OLCEK) / OLCEK);

  /* Hangi satır konuşuluyor (yazı biraz daha kalır). */
  function satirAt(t){
    for(let i = SATIR.length - 1; i >= 0; i--) if(t >= SATIR[i][0] - 0.15 && t < SATIR[i][0] + SATIR[i][1] + 0.9) return i;
    return -1;
  }
  /* Görünen sahneler ve karışım oranı: [{ s, f }] (f: üstteki sahnenin opaklığı). */
  function sahneler(t, az){
    const l = [];
    SAHNE.forEach((s, i) => {
      if(t < s.bas || t >= s.son) return;
      const once = SAHNE[i - 1];
      const f = once && t < once.son ? (az ? (t >= (s.bas + once.son) / 2 ? 1 : 0) : yumusak((t - s.bas) / (once.son - s.bas))) : 1;
      l.push({ s, f });
    });
    return l;
  }

  /* ---------- çizim yardımcıları ---------- */
  const tuval = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
  const figurler = {};
  function figur(ad){
    if(figurler[ad]) return figurler[ad];
    const f = L.PIKSEL_FIGUR && L.PIKSEL_FIGUR[ad];
    if(!f) return null;
    const c = tuval(f.s[0].length, f.s.length), g = c.getContext('2d');
    f.s.forEach((r, y) => { for(let x = 0; x < r.length; x++){ const k = f.p[r[x]]; if(k){ g.fillStyle = k; g.fillRect(x, y, 1, 1); } } });
    return (figurler[ad] = c);
  }
  function figurCiz(g, ad, x, y, k, alfa){
    const c = figur(ad);
    if(!c || alfa <= 0) return;
    g.globalAlpha = Math.min(1, alfa);
    g.drawImage(c, x, y, c.width * k, c.height * k);
    g.globalAlpha = 1;
  }
  function kareCiz(g, renk, x, y, w, h, alfa){
    if(alfa <= 0) return;
    g.globalAlpha = Math.min(1, alfa); g.fillStyle = renk; g.fillRect(x, y, w, h); g.globalAlpha = 1;
  }
  /* Bina ya da manzaranın üstüne gök: kamera gökten iner, göğe kalkar. */
  function gok(arka, yuk){
    const W = arka.width, c = tuval(W, yuk), g = c.getContext('2d');
    const p = arka.getContext('2d').getImageData(Math.floor(W / 2), 0, 1, 1).data;
    /* Piksel bant: yukarı çıktıkça koyulaşan, dörder piksellik basamaklar */
    const n = Math.max(2, Math.ceil(yuk / 4));
    for(let i = 0; i < n; i++){
      const f = i / (n - 1), r = Math.round(karis(p[0] * 0.45, p[0], f)), gg = Math.round(karis(p[1] * 0.45, p[1], f)), b = Math.round(karis(p[2] * 0.6, p[2], f));
      g.fillStyle = 'rgb(' + r + ',' + gg + ',' + b + ')';
      g.fillRect(0, Math.floor(yuk * i / n), W, Math.ceil(yuk / n) + 1);
    }
    return c;
  }
  function manzara(motor, W, H, vakit, tur){
    const arka = tuval(W, H), o = motor.yerlesim(W, H, vakit, tur);
    motor.binaCiz(arka.getContext('2d'), o);
    return { o, arka, tampon:tuval(W, H), motor };
  }
  function manzaraCiz(m, t){
    m.motor.kare(m.tampon.getContext('2d'), m.arka, m.o, t);
    return m.tampon;
  }
  /* Kamera: sahnenin kendi yakınlaşması (merkez çevresinde) */
  function yakin(g, W, H, z){
    if(z === 1) return;
    g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  }

  /* Bilgisayar: 16×13 ızgara (sinematiğe ait tek yeni çizim). */
  const PC = { p:{ k:'#1f1a2e', g:'#8d867b', G:'#b9b2a6', e:'#5a84ea', E:'#9fc2ff', w:'#fff8ea' }, s:[
    '.kkkkkkkkkkkkkk.',
    'kGGGGGGGGGGGGGGk',
    'kGkkkkkkkkkkkkGk',
    'kGkeeeeeeeeeekGk',
    'kGkeEEeeeeeeekGk',
    'kGkeEeeeeeeeekGk',
    'kGkeeeeeeeeeekGk',
    'kGkeeeeeeeeeekGk',
    'kGkkkkkkkkkkkkGk',
    'kGGGGGGGGGGGGGGk',
    '.kkkkkkggkkkkkk.',
    '.....kkGGkk.....',
    '...kkkkkkkkkk...'] };
  function pcCiz(g, x, y, k, isik){
    const c = figurler.__pc || (figurler.__pc = (() => {
      const t = tuval(16, 13), gg = t.getContext('2d');
      PC.s.forEach((r, j) => { for(let i = 0; i < 16; i++){ const r2 = PC.p[r[i]]; if(r2){ gg.fillStyle = r2; gg.fillRect(i, j, 1, 1); } } });
      return t;
    })());
    g.drawImage(c, x, y, 16 * k, 13 * k);
    if(isik > 0) kareCiz(g, '#ffffff', x + 3 * k, y + 3 * k, 10 * k, 5 * k, isik * 0.35);
  }

  /* ---------- sahneler: hazirla(W, H) bir kez, ciz(g, W, H, yt, h) her kare ----------
     yt: sahnenin kendi saati; h: motorun saati (hareketsizken 0, figürler durur). */
  const SAHNELER = {
    gol:{
      hazirla(W, H){ const m = manzara(L.PIKSEL_DOGA, W, H, 'dogum', 'dag'), yuk = Math.round(H * 0.6); return { m, yuk, gok:gok(m.arka, yuk) }; },
      ciz(g, W, H, yt, h, s){
        const y = s.yuk * (ara(yt, 0.1, 3.4) - 0.85 * ara(yt, 6.2, 7.5));
        g.drawImage(s.gok, 0, -y);
        g.drawImage(manzaraCiz(s.m, h), 0, s.yuk - y);
        const gel = ara(yt, 2.3, 3.6), git = ara(yt, 6.3, 7.3), k = Math.max(2, Math.min(5, Math.round(Math.min(W, H) / 70)));
        const boy = 16 * k * (0.85 + 0.15 * gel);
        figurCiz(g, 'logo', W / 2 - boy / 2, H * 0.26 - boy / 2 + Math.sin(yt * 1.7) * 1.4 * oyna() - git * H * 0.25, boy / 16, gel * (1 - git));
      },
    },
    sokak:{
      hazirla(W, H){
        const l = ['calisma', 'bugun', 'analiz'].map(yer => manzara(L.PIKSEL_APARTMAN, W, H, 'ogle', yer)), yuk = Math.round(H * 0.5);
        return { l, yuk, gok:gok(l[0].arka, yuk) };
      },
      ciz(g, W, H, yt, h, s){
        const y = s.yuk * ara(yt, 0, 2.4), x = W * (ara(yt, 4.1, 5.1) + ara(yt, 7.9, 8.9)), z = 1 + 0.9 * ara(yt, 11.3, 12.6);
        g.save(); yakin(g, W, H, z);
        for(let i = 0; i < 3; i++){
          const sol = i * W - x;
          if(sol > W || sol + W < 0) continue;
          g.drawImage(s.gok, sol, -y, W, s.yuk);
          g.drawImage(manzaraCiz(s.l[i], h), sol, s.yuk - y);
        }
        /* Her binanın üstünde kendi sistemi: konuşulan parlak, öteki ikisi soluk */
        const k = Math.max(1, Math.min(4, Math.round(Math.min(W, H) / 90))), on = satirAt(yt + 6.6) - 2, gel = ara(yt, 1.2, 2.2);
        ['ays', 'spi', 'esp'].forEach((ad, i) => {
          const parlak = i === on, zip = parlak ? Math.abs(Math.sin(yt * 3)) * 2 * oyna() : 0;
          figurCiz(g, ad, i * W - x + W / 2 - 8 * k, s.yuk - y + H * 0.06 - zip + (1 - gel) * 6, k, gel * (parlak ? 1 : 0.4));
        });
        g.restore();
      },
    },
    king:{
      hazirla(W, H){
        const oda = tuval(L.PIKSEL_APARTMAN.KING_EN, L.PIKSEL_APARTMAN.KING_BOY), yildiz = [];
        let r = 7;
        for(let i = 0; i < Math.round(W * H / 500); i++){ r = (r * 9301 + 49297) % 233280; const a = r / 233280; r = (r * 9301 + 49297) % 233280; yildiz.push([Math.floor(a * W), Math.floor(r / 233280 * H * 0.55), i % 7]); }
        return { oda, yildiz };
      },
      ciz(g, W, H, yt, h, s){
        const A = L.PIKSEL_APARTMAN, z = 1.35 - 0.35 * ara(yt, 0, 1.8);
        kareCiz(g, '#2a2144', 0, 0, W, H, 1);
        s.yildiz.forEach(([x, y, f]) => kareCiz(g, '#fff8ea', x, y, 1, 1, 0.35 + 0.35 * Math.sin(yt * 2 + f) * oyna()));
        g.save(); yakin(g, W, H, z);
        const k = ekranKat(Math.min(W * 0.86 / A.KING_EN, H * 0.48 / A.KING_BOY), 1), ow = A.KING_EN * k, ox = Math.round((W - ow) / 2), oy = Math.round(H * 0.36);
        A.kingOda(s.oda, h, 'batim', yt > 3.2, L.PIKSEL && L.PIKSEL.kingYuzu ? L.PIKSEL.kingYuzu() : 'mochi');
        g.drawImage(s.oda, ox, oy, ow, A.KING_BOY * k);
        /* Üç sistemden King'e akan ışık: noktalar yol boyunca kayar */
        const fk = ekranKat(k * 0.8, 1), ps = Math.max(2, Math.round(fk)), hedefX = W / 2, hedefY = oy - 2, akis = ara(yt, 1.4, 2.4);
        ['ays', 'spi', 'esp'].forEach((ad, i) => {
          const fx = W * (0.2 + 0.3 * i), fy = H * 0.08, gel = ara(yt, 0.5 + i * 0.3, 1.2 + i * 0.3);
          figurCiz(g, ad, fx - 8 * fk, fy + (1 - gel) * 4, fk, gel);
          for(let j = 0; j < 6; j++){
            const p = d && d.az ? (j + 0.5) / 6 : (yt * 0.45 + j / 6) % 1, sx = fx, sy = fy + 16 * fk + 2;
            const px = karis(sx, hedefX, p), py = karis(sy, hedefY, p) - Math.sin(p * Math.PI) * 6;
            kareCiz(g, RENK[ad], px - ps / 2, py - ps / 2, ps, ps, akis * Math.sin(p * Math.PI) * 0.9);
          }
        });
        g.restore();
      },
    },
    ev:{
      hazirla(W, H){ return { m:manzara(L.PIKSEL_APARTMAN, W, H, 'gece', 'bugun') }; },
      ciz(g, W, H, yt, h, s){
        g.save(); yakin(g, W, H, 1 + 0.08 * ara(yt, 0, 5));
        g.drawImage(manzaraCiz(s.m, h), 0, 0);
        g.restore();
        kareCiz(g, '#120c24', 0, 0, W, H, 0.35);
        /* Üç sistemden bilgisayara veri: küçük kareler eğri yolla iner */
        const k = Math.max(2, Math.min(5, Math.round(Math.min(W, H) / 60))), px = Math.round(W / 2 - 8 * k), py = Math.round(H * 0.66 - 13 * k);
        const hx = W / 2, hy = py + 5 * k, gel = ara(yt, 0.3, 1.2);
        let isik = 0;
        ['ays', 'spi', 'esp'].forEach((ad, i) => {
          const fx = W * (0.2 + 0.3 * i), fy = H * 0.08, fk = Math.max(1, Math.round(k / 2)), ps = fk + 1;
          figurCiz(g, ad, fx - 8 * fk, fy, fk, gel);
          for(let j = 0; j < 4; j++){
            const p = d && d.az ? (j + 0.5) / 4 : ((yt - 0.8 - i * 0.25) * 0.55 + j / 4) % 1;
            if(p < 0) continue;
            const cx = karis(fx, hx, 0.5) + (i - 1) * W * 0.15, cy = karis(fy, hy, 0.15);
            const q = 1 - p, x = q * q * fx + 2 * q * p * cx + p * p * hx, y = q * q * (fy + 16 * fk) + 2 * q * p * cy + p * p * hy;
            kareCiz(g, RENK[ad], x - ps / 2, y - ps / 2, ps, ps, gel * Math.min(1, (1 - p) * 4));
            if(p > 0.9) isik = Math.max(isik, (p - 0.9) * 10);
          }
        });
        pcCiz(g, px, py, k, gel * (0.4 + 0.6 * isik * oyna()));
      },
    },
    kod:{
      hazirla(W, H){
        const kagit = tuval(W, H), k = kagit.getContext('2d');
        k.fillStyle = '#fff8ea'; k.fillRect(0, 0, W, H);
        k.fillStyle = '#e9dfcb';
        for(let y = 3; y < H; y += 8) for(let x = 3; x < W; x += 8) k.fillRect(x, y, 1, 1);
        return { kagit };
      },
      ciz(g, W, H, yt, h, s){
        g.drawImage(s.kagit, 0, 0);
        /* Yedi günlük örnek çizelge: dördüncü gün girilmemiş, sütun değil nokta */
        const cw = Math.min(Math.floor(W * 0.82), 168), ch = Math.min(Math.floor(H * 0.4), 88), cx = Math.round((W - cw) / 2), cy = Math.round(H * 0.18);
        const DEGER = [0.45, 0.7, 0.55, null, 0.85, 0.6, 0.92], adim = (cw - 12) / 7, bw = Math.max(3, Math.floor(adim * 0.55)), taban = cy + ch - 6;
        kareCiz(g, '#1f1a2e', cx, cy, cw, 1, 1); kareCiz(g, '#1f1a2e', cx, cy + ch, cw, 1, 1);
        kareCiz(g, '#1f1a2e', cx, cy, 1, ch, 1); kareCiz(g, '#1f1a2e', cx + cw - 1, cy, 1, ch + 1, 1);
        kareCiz(g, '#d8ccb4', cx + 6, taban + 1, cw - 12, 1, 1);
        DEGER.forEach((v, i) => {
          const x = Math.round(cx + 6 + adim * i + (adim - bw) / 2);
          if(v == null){
            const n = 5, nx = x + Math.floor((bw - n) / 2), ny = taban - n, nabiz = ara(yt, 3.0, 3.6) * oyna();
            kareCiz(g, '#1f1a2e', nx, ny, n, 1, 1); kareCiz(g, '#1f1a2e', nx, ny + n - 1, n, 1, 1);
            kareCiz(g, '#1f1a2e', nx, ny, 1, n, 1); kareCiz(g, '#1f1a2e', nx + n - 1, ny, 1, n, 1);
            if(nabiz > 0){
              const r = (yt * 1.4) % 1, e = 2 + r * 6;
              g.globalAlpha = (1 - r) * 0.8; g.strokeStyle = '#5a84ea'; g.lineWidth = 1;
              g.strokeRect(nx + n / 2 - e, ny + n / 2 - e, e * 2, e * 2); g.globalAlpha = 1;
            }
            return;
          }
          const boy = (ch - 14) * v * ara(yt, 0.5 + i * 0.12, 1.3 + i * 0.12);
          kareCiz(g, '#5a84ea', x, taban - boy, bw, boy, 1);
          kareCiz(g, '#2f5fd0', x, taban - boy, bw, Math.min(1, boy), 1);
        });
        /* Eşik: kuralın çizgisi soldan sağa gelir */
        const ey = Math.round(taban - (ch - 14) * 0.6), ew = (cw - 12) * ara(yt, 1.4, 2.4);
        for(let x = 0; x < ew; x += 4) kareCiz(g, '#1f1a2e', cx + 6 + x, ey, 2, 1, 1);
      },
    },
    basamak:{
      hazirla(W, H){ return { m:manzara(L.PIKSEL_DOGA, W, H, 'dogum', 'kiraz') }; },
      ciz(g, W, H, yt, h, s){
        g.drawImage(manzaraCiz(s.m, h), 0, 0);
        const n = 5, sw = Math.max(16, Math.floor(Math.min(W * 0.6 / n, 30))), sh = Math.max(6, Math.floor(Math.min(H * 0.07, 16))), taban = Math.round(H * 0.74), x0 = Math.round(W / 2 - sw * n / 2);
        for(let i = 0; i < n; i++){
          const x = x0 + i * sw, y = taban - (i + 1) * sh;
          kareCiz(g, '#3a2e2a', x, y, sw, taban - y, 1);
          kareCiz(g, '#b9b2a6', x + 1, y + 1, sw - 2, taban - y - 1, 1);
          kareCiz(g, '#e8e2d6', x + 1, y + 1, sw - 2, 2, 1);
          kareCiz(g, '#8d867b', x + sw - 3, y + 3, 2, taban - y - 3, 1);
        }
        /* King basamakları tek tek çıkar; her inişte küçük kıvılcım */
        const yuz = L.PIKSEL && L.PIKSEL.kingYuzu ? L.PIKSEL.kingYuzu() : 'mochi', fk = ekranKat(sw * 1.25 / 16, 1);
        const yer = j => (j < 0 ? [x0 - sw, taban] : [x0 + j * sw, taban - (j + 1) * sh]);
        let fx, fy, j = -1;
        for(let i = 0; i < n; i++) if(yt >= 0.7 + i * 0.75 + 0.55) j = i;
        const sonraki = j + 1, bas = 0.7 + sonraki * 0.75, f = sonraki < n && !(d && d.az) ? Math.max(0, Math.min(1, (yt - bas) / 0.55)) : 0;
        const [ax, ay] = yer(j), [bx, by] = yer(Math.min(n - 1, sonraki));
        fx = karis(ax, bx, yumusak(f)); fy = karis(ay, by, f) - Math.sin(f * Math.PI) * sh * 1.6;
        if(d && d.az){ const [sx, sy] = yer(n - 1); fx = sx; fy = sy; }
        figurCiz(g, 'king_' + yuz, fx + (sw - 16 * fk) / 2, fy - 16 * fk, fk, 1);
        for(let i = 0; i <= j; i++){
          const r = (yt - (0.7 + i * 0.75 + 0.55)) / 0.5;
          if(r < 0 || r > 1 || (d && d.az)) continue;
          const [kx, ky] = yer(i), mx = kx + sw / 2;
          [[-1, 0], [1, 0], [0, -1], [-0.7, -0.7], [0.7, -0.7]].forEach(([vx, vy]) => kareCiz(g, '#ffd35a', mx + vx * (3 + r * 6), ky - 2 + vy * (3 + r * 6), 1, 1, 1 - r));
        }
        const gel = ara(yt, 4.4, 5.4), k = Math.max(2, Math.min(5, Math.round(Math.min(W, H) / 70)));
        figurCiz(g, 'logo', W / 2 - 8 * k, H * 0.16 - 8 * k + Math.sin(yt * 1.7) * 1.4 * oyna() + (1 - gel) * 4, k, gel);
      },
    },
  };

  /* ---------- kare döngüsü ---------- */
  function hazir(s){
    if(!d.hazir[s.id]) d.hazir[s.id] = SAHNELER[s.id].hazirla(d.W, d.H);
    return d.hazir[s.id];
  }
  function ciz(t){
    const g = d.g, W = d.W, H = d.H;
    g.setTransform(OLCEK, 0, 0, OLCEK, 0, 0);
    g.imageSmoothingEnabled = false;
    sahneler(t, d.az).forEach(({ s, f }) => {
      const yt = t - s.bas, x = hazir(s), h = d.az ? 0 : t;
      if(f >= 1){ g.save(); SAHNELER[s.id].ciz(g, W, H, yt, h, x); g.restore(); return; }
      if(f <= 0) return;
      /* Geçiş: alttaki sahne tam, üstteki ara tuvalden f opaklıkla çözülür */
      const a = d.ara.getContext('2d');
      a.setTransform(1, 0, 0, 1, 0, 0); a.imageSmoothingEnabled = false;
      a.clearRect(0, 0, W, H);
      a.save(); SAHNELER[s.id].ciz(a, W, H, yt, h, x); a.restore();
      g.globalAlpha = f; g.drawImage(d.ara, 0, 0); g.globalAlpha = 1;
    });
  }
  function yazi(t){
    const i = d.basladi ? satirAt(t) : -1;
    if(i === d.satir) return;
    d.satir = i;
    d.yazi.classList.toggle('is-gorunur', i >= 0);
    if(i >= 0){
      d.yazi.textContent = yz('s' + i);
      if(d.sesAcik && d.dosyaYok && d.oynuyor) cihazOku(yz('s' + i));
    }
  }
  function zaman(){
    if(!d.oynuyor) return d.t;
    /* Ses çalıyorsa saat sestir: görüntü anlatımdan kaymaz */
    if(d.kaynak && d.ac.state === 'running'){
      const t = d.ac.currentTime - d.kaynakBas;
      d.t0 = performance.now() - t * 1000;
      return t;
    }
    return (performance.now() - d.t0) / 1000;
  }
  function dongu(){
    if(!d) return;
    const t = Math.min(zaman(), SURE);
    d.t = t;
    if(!d.az || d.son !== sahneler(t, true).map(x => x.s.id).join() + satirAt(t)){
      d.son = sahneler(t, true).map(x => x.s.id).join() + satirAt(t);
      ciz(t);
    }
    yazi(t);
    d.cubuk.style.transform = 'scaleX(' + (t / SURE).toFixed(4) + ')';
    if(t >= SON_KART && !d.kok.classList.contains('is-son')) sonKart();
    if(t >= SURE && d.oynuyor){ d.oynuyor = false; d.t = SURE; dugmeler(); }
    d.istek = requestAnimationFrame(dongu);
  }

  /* ---------- ses: kayıtlı anlatım, olmazsa cihazın Türkçe sesi ---------- */
  function duzey(){ try{ return L.SES && L.SES.duzey ? L.SES.duzey('king') : 1; }catch(e){ return 1; } }
  function cihazOku(metin){
    const sz = window.speechSynthesis;
    if(!sz || typeof SpeechSynthesisUtterance !== 'function') return;
    try{
      sz.cancel();
      const u = new SpeechSynthesisUtterance(metin), sesler = sz.getVoices ? sz.getVoices() : [];
      const tr = sesler.filter(v => /^tr([-_]|$)/i.test(v.lang || '') && v.localService !== false);
      u.lang = 'tr-TR'; if(tr[0]) u.voice = tr[0]; u.volume = duzey();
      sz.speak(u);
    }catch(e){ /* ses yok: yazı yeter */ }
  }
  /* Kayıt WebAudio'yla çalar: saniyesi saniyesine görüntüyle eşleşir, duraklayıp sürer.
     Dosya poster açıkken iner; çözülemezse (eski tarayıcı) cihazın sesi satır satır okur. */
  function sesIndir(){
    if(!d.indir) d.indir = fetch(SES_DOSYA).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
    return d.indir;
  }
  function sesKur(){
    if(d.ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    try{ d.ac = AC ? new AC() : null; }catch(e){ d.ac = null; }
    const x = d;
    if(!x.ac){ x.dosyaYok = true; return; }
    x.kazanc = x.ac.createGain(); x.kazanc.connect(x.ac.destination); kazanc();
    if(x.ac.resume) x.ac.resume().catch(() => null);
    sesIndir().then(ab => (ab ? new Promise((ok, no) => x.ac.decodeAudioData(ab, ok, no)) : null)).then(b => {
      if(d !== x) return;
      if(!b){ x.dosyaYok = true; x.satir = -2; return; }
      x.tampon = b; sesCal();
    }).catch(() => { if(d === x){ x.dosyaYok = true; x.satir = -2; } });
  }
  function kazanc(){ if(d.kazanc) d.kazanc.gain.value = d.sesAcik ? Math.max(0, Math.min(1, duzey())) : 0; }
  function sesCal(){
    sesDur();
    if(!d.tampon || !d.oynuyor || d.t >= d.tampon.duration) return;
    const k = d.ac.createBufferSource();
    k.buffer = d.tampon; k.connect(d.kazanc);
    k.start(0, d.t);
    d.kaynak = k; d.kaynakBas = d.ac.currentTime - d.t;
  }
  function sesDur(){
    if(d.kaynak){ try{ d.kaynak.stop(); }catch(e){ /* durmuş */ } d.kaynak.disconnect(); d.kaynak = null; }
    try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(e){ /* yok */ }
  }

  /* ---------- denetimler ---------- */
  const SIMGE = { oynat:'<path d="M8 6l10 6-10 6z"/>', dur:'<path d="M8 6h3v12H8zM13 6h3v12h-3z"/>',
    sesli:'<path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 9a4 4 0 010 6" fill="none"/>', sessiz:'<path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 10l4 4M20 10l-4 4" fill="none"/>' };
  const simge = ad => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + SIMGE[ad] + '</svg>';
  function dugmeler(){
    const o = d.kok.querySelector('[data-sinematik="oynat"]'), s = d.kok.querySelector('[data-sinematik="ses"]');
    o.innerHTML = simge(d.oynuyor ? 'dur' : 'oynat'); o.setAttribute('aria-label', yz(d.oynuyor ? 'duraklat' : 'surdur'));
    s.innerHTML = simge(d.sesAcik ? 'sesli' : 'sessiz'); s.setAttribute('aria-label', yz(d.sesAcik ? 'ses-kapa' : 'ses-ac'));
  }
  function oynat(){
    if(d.t >= SURE) basaDon();
    d.oynuyor = true;
    d.t0 = performance.now() - d.t * 1000;
    d.kok.classList.add('is-oynuyor');
    sesCal();
    dugmeler();
  }
  function duraklat(){
    d.t = zaman(); d.oynuyor = false;
    sesDur();
    dugmeler();
  }
  function sesDegis(){
    d.sesAcik = !d.sesAcik;
    try{ localStorage.setItem('lifeos.sinematik.ses', d.sesAcik ? '1' : '0'); }catch(e){ /* depo kapalı */ }
    kazanc();
    if(d.sesAcik) d.satir = -2;   // cihaz sesi kullanılıyorsa söylenen satır yeniden okunur
    else{ sesDur(); sesCal(); }    // konuşma kesilir, kayıt sessiz sürer (saat kaymasın)
    dugmeler();
  }
  function basaDon(){
    d.t = 0; d.satir = -1; d.son = null;
    d.kok.classList.remove('is-son');
  }
  function sonKart(){
    d.kok.classList.add('is-son');
    d.kok.querySelector('[data-sinematik="basla"]').focus({ preventScroll:true });
  }

  function boyutla(){
    if(!d) return;
    const w = window.innerWidth, h = window.innerHeight;
    d.c.width = w; d.c.height = h;
    const W = Math.ceil(w / OLCEK), H = Math.ceil(h / OLCEK);
    if(W !== d.W || H !== d.H){ d.W = W; d.H = H; d.hazir = {}; d.ara = tuval(W, H); }
    d.g = d.c.getContext('2d');
    d.son = null;
    ciz(d.t);
  }
  /* Sahneleri boş anlarda sırayla hazırla: oynarken çizim takılmasın. */
  function onceden(){
    let i = 0;
    const yap = () => {
      if(!d || i >= SAHNE.length) return;
      hazir(SAHNE[i++]);
      setTimeout(yap, 30);
    };
    setTimeout(yap, 60);
  }

  function ac(o){
    if(d || typeof document === 'undefined' || !L.PIKSEL_DOGA || !L.PIKSEL_APARTMAN) return false;
    let sesAcik = true;
    try{ sesAcik = localStorage.getItem('lifeos.sinematik.ses') !== '0'; }catch(e){ /* depo kapalı */ }
    const kok = document.createElement('div');
    kok.className = 'sinematik';
    kok.setAttribute('role', 'dialog'); kok.setAttribute('aria-modal', 'true'); kok.setAttribute('aria-label', yz('ad'));
    kok.innerHTML = '<canvas class="sinematik__tuval" aria-hidden="true"></canvas>'
      + '<button type="button" class="sinematik__gec" data-sinematik="gec">' + yz('gec') + '</button>'
      + '<button type="button" class="sinematik__izle" data-sinematik="izle">' + simge('oynat') + '<span>' + yz('izle') + '</span></button>'
      + '<div class="sinematik__alt"><p class="sinematik__yazi" aria-live="polite"></p>'
      +   '<div class="sinematik__son"><button type="button" class="sinematik__basla" data-sinematik="basla">' + yz('basla') + '</button>'
      +   '<button type="button" class="sinematik__yeniden" data-sinematik="yeniden">' + yz('yeniden') + '</button></div>'
      +   '<div class="sinematik__denetim"><button type="button" class="sinematik__dugme" data-sinematik="oynat"></button>'
      +   '<button type="button" class="sinematik__dugme" data-sinematik="ses"></button>'
      +   '<span class="sinematik__cizgi" aria-hidden="true"><i></i></span></div></div>';
    document.body.appendChild(kok);
    d = { kok, c:kok.querySelector('canvas'), yazi:kok.querySelector('.sinematik__yazi'), cubuk:kok.querySelector('.sinematik__cizgi i'),
      t:4.6, oynuyor:false, sesAcik, az:hareketAz(), hazir:{}, satir:-1, W:0, H:0, once:document.activeElement, son:null,
      bitince:o && o.bitince };
    kok.addEventListener('click', tikla);
    document.addEventListener('keydown', tus, true);
    document.addEventListener('visibilitychange', gorunurluk);
    window.addEventListener('resize', boyutla);
    /* Afiş: oynatılmadan önce ilk sahnenin logolu karesi (t = 4,6) durur */
    boyutla();
    dugmeler();
    d.istek = requestAnimationFrame(dongu);
    d.kok.querySelector('[data-sinematik="izle"]').focus({ preventScroll:true });
    onceden();
    sesIndir();
    return true;
  }
  function izle(){
    d.basladi = true;
    d.kok.classList.add('is-basladi');
    sesKur();
    basaDon();
    oynat();
    d.kok.querySelector('[data-sinematik="oynat"]').focus({ preventScroll:true });
  }
  function kapat(){
    if(!d) return;
    const x = d;
    cancelAnimationFrame(x.istek);
    sesDur();
    if(x.ac && x.ac.close) x.ac.close().catch(() => null);
    document.removeEventListener('keydown', tus, true);
    document.removeEventListener('visibilitychange', gorunurluk);
    window.removeEventListener('resize', boyutla);
    x.kok.remove();
    d = null;
    if(x.once && x.once.focus && x.once.isConnected) x.once.focus({ preventScroll:true });
    if(x.bitince) x.bitince();
  }
  function tikla(e){
    const b = e.target.closest('[data-sinematik]');
    if(!b) return;
    const ne = b.getAttribute('data-sinematik');
    if(ne === 'gec' || ne === 'basla') kapat();
    else if(ne === 'izle') izle();
    else if(ne === 'oynat') (d.oynuyor ? duraklat : oynat)();
    else if(ne === 'ses') sesDegis();
    else if(ne === 'yeniden') izle();
  }
  function tus(e){
    if(!d) return;
    if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); kapat(); }
  }
  function gorunurluk(){
    if(!d) return;
    if(document.visibilityState === 'hidden' && d.oynuyor){ duraklat(); d.arkada = true; }
    else if(document.visibilityState === 'visible' && d.arkada){ d.arkada = false; oynat(); }
  }

  /* ---------- bir kez, hesap başına ---------- */
  function cerez(ad){
    const m = String(document.cookie || '').match(new RegExp('(?:^|;\\s*)' + ad + '=([^;]*)'));
    if(!m || !m[1]) return null;
    try{ return JSON.parse(decodeURIComponent(m[1])); }catch(e){ return null; }
  }
  /* Kimin filmi: hesabın kimliği (yoksa adı) ya da beta. Girişsiz modül (sunucusuz) göstermez. */
  function anahtar(){
    const H = L.HESAP, o = H && H.CEREZ ? cerez(H.CEREZ) : null;
    if(o && typeof o.j === 'string' && o.j) return 'h:' + (o.h || o.a || '');
    return cerez('lifeos_beta') === 1 ? 'beta' : null;
  }
  function gorulenler(){ const l = cerez(CEREZ); return Array.isArray(l) ? l.filter(x => typeof x === 'string') : []; }
  function gordu(k){
    const l = gorulenler().filter(x => x !== k).concat(k).slice(-20), guvenli = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = CEREZ + '=' + encodeURIComponent(JSON.stringify(l)) + '; Path=/; Max-Age=34560000; SameSite=Strict' + guvenli;
  }
  function gerekli(){
    const k = anahtar();
    return !!k && gorulenler().indexOf(k) < 0;
  }
  function ilkGiris(){
    if(navigator.webdriver || /\/tests\//.test(location.pathname) || !gerekli()) return false;
    gordu(anahtar());
    return ac();
  }

  if(typeof document !== 'undefined'){
    /* Menü › Tanıtım filmi (kabuk.js menü sayfası) */
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest && e.target.closest('[data-sinematik-ac]');
      if(b){ e.preventDefault(); ac(); }
    });
    const bekle = () => setTimeout(ilkGiris, 700);
    if(document.readyState === 'complete') bekle(); else window.addEventListener('load', bekle, { once:true });
  }

  return Object.freeze({ ac, kapat, acikMi:() => !!d, gerekli, SATIR, SAHNE, SURE, _satirAt:satirAt, _sahneler:sahneler, _durum:() => d, _kare:t => { if(d) ciz(t); } });
})(window.LIFEOS);
