/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/sinematik.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* SİNEMATİK — hesaba ilk girişte LifeOS'u anlatan bir dakikalık piksel film.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/sinematik.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Biçimi `sinematik.css`,
   testi `sinematik.test.js`.
   ==================================================================

   Kullanıcı (2026-11-05): «hesaba ilk kez girildiğinde LifeOS'u ve misyonunu
   anlatan mini piksel sanat sinematiği»; «video şeklinde, güzel geçişler,
   güzel sözler, anlatan güzel bir ses»; ikinci tur: «gün doğsun gün batsın,
   AYS, SPİ, ESP'den bahsederken oraları göstersin, editör gibi, bir dakika».

   Kurgu: gece biter, gün doğar (göl) › başlık › AYS (çalışma salonu,
   kütüphane) › SPİ (mutfak, uyku, orman) › ESP (okuma salonu, araştırma
   odası) › King'in odası › gün batar, veri evde kalır › basamaklar, gece.

   Sözler:
     1. SÜSTÜR. Hiçbir veri okumaz, yazmaz; sayı göstermez. Çizelgedeki
        sütunlar örnektir, kimsenin kaydı değildir.
     2. MOTORU KULLANIR. Manzara, mahalle, odalar, sakinler, King ve
        figürler piksel-doga.js, piksel-apartman.js ve piksel-figur.js'in
        kendi çizimleridir; burada yalnız kamera, kurgu ve yerleşim var.
     3. HAREKET YUMUŞAK. Görünüm piksel, hareket kare kare değil: kamera ve
        figürler ekran pikseli hassasiyetinde, yumuşatılmış eğriyle kayar.
        Animasyonlar «Az» ise aynı film hareketsiz slaytlar olur (kesme geçiş).
     4. BİR KEZ, HESAP BAŞINA. Görüldü bilgisi kapıya bakmayan çerezdedir:
        aynı cihazdaki üç modül birlikte bilir. Menü › Tanıtım filmi yeniden açar.
     5. SES İSTEĞE BAĞLI. Film «İzle» denmeden başlamaz; ses düğmesi her an
        kapatır. Anlatım ve müzik tek kayıttır (`brand/medya/tanitim/`);
        kayıt çözülemezse cihazın Türkçe sesi satır satır okur.
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
  'ortak.sinematik.etiket.ays':'Sınav hazırlığı',
  'ortak.sinematik.etiket.spi':'Sağlık',
  'ortak.sinematik.etiket.esp':'Kişisel gelişim',
  'ortak.sinematik.s0':'Her sabah, yeni bir sayfa açılır.',
  'ortak.sinematik.s1':'LifeOS, o sayfayı seninle birlikte yazar.',
  'ortak.sinematik.s2':'Üç sistem; tek bir hayat.',
  'ortak.sinematik.s3':'AYS, sınav yolunu gün gün planlar.',
  'ortak.sinematik.s4':'Konuyu öğretir, denemeni çözümler, tekrarını hatırlatır.',
  'ortak.sinematik.s5':'SPİ; uykunu, beslenmeni ve hareketini izler.',
  'ortak.sinematik.s6':'Teşhis koymaz; neyin iyi gittiğini gösterir.',
  'ortak.sinematik.s7':'ESP, merakını ustalığa çevirir.',
  'ortak.sinematik.s8':'Dil, felsefe, müzik, okuma, yazı ve tarih.',
  'ortak.sinematik.s9':'Hepsinin yanında King var.',
  'ortak.sinematik.s10':'Seni tanır, seninle konuşur, sana yol gösterir.',
  'ortak.sinematik.s11':'Verin senin bilgisayarında kalır.',
  'ortak.sinematik.s12':'Sayıyı ve kararı kod verir; boş geçen gün sıfır sayılmaz.',
  'ortak.sinematik.s13':'Ustalık küçük adımlarla gelir.',
  'ortak.sinematik.s14':'Hazırsan, başlayalım.',
});

window.LIFEOS.SINEMATIK = (function(L){
  'use strict';
  const yz = id => L.PARCA.yazi('ortak.sinematik.' + id);
  const OLCEK = 3, SURE = 64, SON_KART = 62, AFIS = 12.4, CEREZ = 'lifeos_sinematik';
  const SES_DOSYA = 'img/marka/tanitim-sinematik.mp4';
  /* [başlangıç sn, süre sn]: kayıttaki anlatımın yeri; ses dosyası bu çizelgeyle üretildi. */
  const SATIR = Object.freeze([[1.2, 2.04], [5.2, 2.64], [10.6, 1.72], [15.0, 2.44], [19.8, 3.16], [24.6, 2.96], [28.4, 2.52],
    [34.6, 2.36], [39.2, 2.64], [44.0, 1.56], [46.4, 2.8], [50.4, 1.8], [53.2, 3.52], [57.4, 1.72], [60.4, 1.2]]);
  /* Sahneler ve girişleri: önceki sahneyle üst üste bindiği aralıkta geçiş olur.
     cozul: çözülme · blok: piksel bloklarla silme · kay: yana kayma · yakin: yakınlaşarak çözülme */
  const SAHNE = Object.freeze([
    { id:'safak', bas:0, son:10.6 },
    { id:'baslik', bas:10.0, son:15.0, gecis:'cozul' },
    { id:'ays1', bas:14.4, son:19.6, gecis:'blok', etiket:'ays' },
    { id:'ays2', bas:19.2, son:24.6, gecis:'kay', etiket:'ays' },
    { id:'spi1', bas:24.0, son:27.8, gecis:'blok', etiket:'spi' },
    { id:'spi2', bas:27.4, son:30.8, gecis:'kay', etiket:'spi' },
    { id:'spi3', bas:30.4, son:34.6, gecis:'kay', etiket:'spi' },
    { id:'esp1', bas:34.0, son:39.0, gecis:'blok', etiket:'esp' },
    { id:'esp2', bas:38.6, son:43.8, gecis:'kay', etiket:'esp' },
    { id:'king', bas:43.2, son:50.4, gecis:'yakin' },
    { id:'soz', bas:49.8, son:56.8, gecis:'cozul' },
    { id:'son', bas:56.2, son:SURE + 60, gecis:'cozul' }]);
  const RENK = Object.freeze({ ays:'#5a84ea', spi:'#ff7d8f', esp:'#ffd166' });
  const AD = Object.freeze({ ays:'AYS', spi:'SPİ', esp:'ESP' });

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

  /* Hangi satır konuşuluyor (yazı bir sonrakine dek, en çok 1,2 sn daha kalır). */
  function satirAt(t){
    for(let i = SATIR.length - 1; i >= 0; i--) if(t >= SATIR[i][0] - 0.15 && t < SATIR[i][0] + SATIR[i][1] + 1.2) return i;
    return -1;
  }
  /* Görünen sahneler: [{ s, f }]; f üstteki sahnenin girişindeki ilerleme (0-1). */
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
  const etiketAt = t => { const s = SAHNE.find(x => t >= x.bas + 0.4 && t < x.son - 0.3 && x.etiket); return s ? s.etiket : null; };

  /* ---------- çizim yardımcıları ---------- */
  const tuval = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
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
  /* Gök: vaktin sekiz rengi, dörder piksellik basamaklarla (tepesi biraz daha koyu) */
  function gokBant(W, H, v){
    const c = tuval(W, H), g = c.getContext('2d'), l = L.PIKSEL_APARTMAN.PALET[v].gok, n = Math.max(2, Math.ceil(H / 4));
    const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
    for(let i = 0; i < n; i++){
      const f = i / (n - 1) * (l.length - 1), a = rgb(l[Math.floor(f)]), b = rgb(l[Math.min(l.length - 1, Math.floor(f) + 1)]), q = f - Math.floor(f);
      g.fillStyle = 'rgb(' + a.map((x, j) => Math.round(karis(x, b[j], q))).join(',') + ')';
      g.fillRect(0, Math.floor(H * i / n), W, Math.ceil(H / n) + 1);
    }
    return c;
  }
  /* Manzaranın üstüne gök uzantısı: dikiş olmasın diye manzaranın kendi tepe renginden başlar, yukarı koyulaşır */
  function gokUzat(arka, yuk){
    const W = arka.width, c = tuval(W, yuk), g = c.getContext('2d'), p = arka.getContext('2d').getImageData(Math.floor(W / 2), 0, 1, 1).data, n = Math.max(2, Math.ceil(yuk / 4));
    for(let i = 0; i < n; i++){
      const f = i / (n - 1);
      g.fillStyle = 'rgb(' + Math.round(karis(p[0] * 0.5, p[0], f)) + ',' + Math.round(karis(p[1] * 0.5, p[1], f)) + ',' + Math.round(karis(p[2] * 0.65, p[2], f)) + ')';
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
  function yakin(g, W, H, z, ox, oy){
    if(z === 1) return;
    const x = ox == null ? W / 2 : ox, y = oy == null ? H / 2 : oy;
    g.translate(x, y); g.scale(z, z); g.translate(-x, -y);
  }
  function yildizlar(W, H, tohum){
    const l = [];
    let r = tohum || 7;
    for(let i = 0; i < Math.round(W * H / 420); i++){ r = (r * 9301 + 49297) % 233280; const a = r / 233280; r = (r * 9301 + 49297) % 233280; l.push([Math.floor(a * W), Math.floor(r / 233280 * H * 0.6), i % 7]); }
    return l;
  }
  function yildizCiz(g, l, yt, alfa){
    if(alfa <= 0) return;
    l.forEach(([x, y, f]) => kareCiz(g, '#fff8ea', x, y, 1, 1, alfa * (0.45 + 0.35 * Math.sin(yt * 2 + f) * oyna())));
  }
  /* Yazı tuvalde: dönüşüm ölçeği ekran çözünürlüğünde basar, piksel yazı keskin kalır */
  function yaziCiz(g, metin, x, y, boy, renk, alfa){
    if(alfa <= 0) return;
    g.globalAlpha = Math.min(1, alfa);
    g.font = '700 ' + boy + 'px "Pixelify Sans", system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#1f1a2e'; g.fillText(metin, x + boy / 12, y + boy / 12);
    g.fillStyle = renk; g.fillText(metin, x, y);
    g.globalAlpha = 1;
  }

  /* Bilgisayar: 16×13 ızgara (sinematiğe ait tek yeni çizim). */
  const PC = { p:{ k:'#1f1a2e', g:'#8d867b', G:'#b9b2a6', e:'#5a84ea', E:'#9fc2ff' }, s:[
    '.kkkkkkkkkkkkkk.', 'kGGGGGGGGGGGGGGk', 'kGkkkkkkkkkkkkGk', 'kGkeeeeeeeeeekGk', 'kGkeEEeeeeeeekGk', 'kGkeEeeeeeeeekGk', 'kGkeeeeeeeeeekGk',
    'kGkeeeeeeeeeekGk', 'kGkkkkkkkkkkkkGk', 'kGGGGGGGGGGGGGGk', '.kkkkkkggkkkkkk.', '.....kkGGkk.....', '...kkkkkkkkkk...'] };
  function pcCiz(g, x, y, k, isik){
    const c = figurler.__pc || (figurler.__pc = (() => {
      const t = tuval(16, 13), gg = t.getContext('2d');
      PC.s.forEach((r, j) => { for(let i = 0; i < 16; i++){ const r2 = PC.p[r[i]]; if(r2){ gg.fillStyle = r2; gg.fillRect(i, j, 1, 1); } } });
      return t;
    })());
    g.drawImage(c, x, y, 16 * k, 13 * k);
    if(isik > 0) kareCiz(g, '#ffffff', x + 3 * k, y + 3 * k, 10 * k, 5 * k, isik * 0.35);
  }
  /* Örnek çizelge (yedi gün, dördüncüsü girilmemiş: sütun değil boş kare) */
  function cizelge(g, cx, cy, cw, ch, yt, gel){
    const DEGER = [0.45, 0.7, 0.55, null, 0.85, 0.6, 0.92], adim = (cw - 12) / 7, bw = Math.max(3, Math.floor(adim * 0.55)), taban = cy + ch - 6;
    kareCiz(g, '#1f1a2e', cx - 1, cy - 1, cw + 2, ch + 2, 1);
    kareCiz(g, '#fff8ea', cx, cy, cw, ch, 1);
    kareCiz(g, '#d8ccb4', cx + 6, taban + 1, cw - 12, 1, 1);
    DEGER.forEach((v, i) => {
      const x = Math.round(cx + 6 + adim * i + (adim - bw) / 2);
      if(v == null){
        const n = 5, nx = x + Math.floor((bw - n) / 2), ny = taban - n;
        g.strokeStyle = '#1f1a2e'; g.lineWidth = 1; g.strokeRect(nx + 0.5, ny + 0.5, n - 1, n - 1);
        const r = (yt * 1.2) % 1, e = 2 + r * 6;
        if(oyna() && gel >= 1){ g.globalAlpha = (1 - r) * 0.8; g.strokeStyle = '#5a84ea'; g.strokeRect(nx + n / 2 - e, ny + n / 2 - e, e * 2, e * 2); g.globalAlpha = 1; }
        return;
      }
      const boy = (ch - 14) * v * gel * ara(yt, 0.3 + i * 0.1, 1.0 + i * 0.1);
      kareCiz(g, '#5a84ea', x, taban - boy, bw, boy, 1);
      kareCiz(g, '#2f5fd0', x, taban - boy, bw, Math.min(1, boy), 1);
    });
    const ey = Math.round(taban - (ch - 14) * 0.6), ew = (cw - 12) * ara(yt, 1.0, 2.0) * gel;
    for(let x = 0; x < ew; x += 4) kareCiz(g, '#1f1a2e', cx + 6 + x, ey, 2, 1, 1);
  }

  /* Oda yakın planda: vaktin göğü, bina kesiti, oda ve sakinleri; kamera yavaşça yaklaşır.
     Dar ekranda oda yüksekliğe göre büyür ve kamera odanın bir ucundan öbürüne kayar. */
  function odaSahnesi(tip, v, kisiler, uyku){
    return {
      hazirla(W, H){
        const A = L.PIKSEL_APARTMAN, en = A.ODA[tip].g, boy = A.KAT;
        return { c:tuval(en, boy), en, boy, gok:gokBant(W, H, v), kisi:kisiler.map(i => A.SAKIN[i]) };
      },
      ciz(g, W, H, yt, h, s, sure){
        const A = L.PIKSEL_APARTMAN;
        g.drawImage(s.gok, 0, 0);
        A.odaCiz(s.c, tip, h, v, s.kisi, uyku);
        const dar = W / H < 1, kW = W * 0.9 / s.en, kH = H * (dar ? 0.42 : 0.62) / s.boy, k = ekranKat(dar ? Math.min(kH, kW * 2) : Math.min(kW, kH), 1);
        const w = s.en * k, hh = s.boy * k, f = ara(yt, 0.2, sure - 0.2), z = 1 + 0.05 * yt / sure * oyna();
        const x = w <= W * 0.96 ? (W - w) / 2 : karis(W * 0.04, W * 0.96 - w, f), y = Math.round(H * 0.47 - hh / 2);
        g.save(); yakin(g, W, H, z);
        const p = Math.max(2, Math.round(k * 2));
        kareCiz(g, '#3a2420', x - p - 1, y - p - 1, w + 2 * p + 2, hh + 2 * p + 2, 1);
        kareCiz(g, '#8a5a44', x - p, y - p, w + 2 * p, hh + 2 * p, 1);
        kareCiz(g, '#6e4434', x - p, y + hh, w + 2 * p, p, 1);
        g.drawImage(s.c, x, y, w, hh);
        g.restore();
      },
    };
  }

  /* ---------- sahneler: hazirla(W, H) bir kez, ciz(g, W, H, yt, h, s, sure) her kare ----------
     yt: sahnenin kendi saati; h: motorun saati (hareketsizken 0, figürler durur). */
  const SAHNELER = {
    /* Gece biter, gün doğar: kamera yıldızlardan göle iner */
    safak:{
      hazirla(W, H){
        const D = L.PIKSEL_DOGA, yuk = Math.round(H * 0.6), gece = manzara(D, W, H, 'gece', 'dag'), sabah = manzara(D, W, H, 'dogum', 'dag');
        return { gece, sabah, yuk, gokG:gokUzat(gece.arka, yuk), gokS:gokUzat(sabah.arka, yuk), yildiz:yildizlar(W, yuk) };
      },
      ciz(g, W, H, yt, h, s){
        const y = s.yuk * ara(yt, 0.2, 5.0), dog = ara(yt, 1.0, 7.5);
        g.drawImage(s.gokG, 0, -y); g.drawImage(manzaraCiz(s.gece, h), 0, s.yuk - y);
        if(dog > 0){ g.globalAlpha = dog; g.drawImage(s.gokS, 0, -y); g.drawImage(manzaraCiz(s.sabah, h), 0, s.yuk - y); g.globalAlpha = 1; }
        g.save(); g.translate(0, -y); yildizCiz(g, s.yildiz, yt, 1 - dog); g.restore();
      },
    },
    /* Başlık: logo, ad ve üç sistem */
    baslik:{
      hazirla(W, H){ return { m:manzara(L.PIKSEL_DOGA, W, H, 'dogum', 'dag') }; },
      ciz(g, W, H, yt, h, s){
        g.save(); yakin(g, W, H, 1.06 + 0.04 * yt / 5 * oyna(), W / 2, H * 0.3);
        g.drawImage(manzaraCiz(s.m, h), 0, 0); g.restore();
        kareCiz(g, '#1f1a2e', 0, 0, W, H, 0.38);
        const k = ekranKat(Math.min(W, H) / 64, 2), gel = ara(yt, 0.1, 1.0);
        figurCiz(g, 'logo', W / 2 - 8 * k, H * 0.2 - 8 * k * (0.9 + 0.1 * gel) + (1 - gel) * 6, k, gel);
        yaziCiz(g, 'LifeOS', W / 2, H * 0.2 + 12 * k, Math.max(12, Math.round(Math.min(W, H) / 9)), '#fff8ea', ara(yt, 0.4, 1.3));
        const fk = ekranKat(k * 0.7, 1), aralik = Math.min(W * 0.26, 34 * fk);
        ['ays', 'spi', 'esp'].forEach((ad, i) => {
          const a = ara(yt, 0.6 + i * 0.45, 1.2 + i * 0.45), x = W / 2 + (i - 1) * aralik - 8 * fk, yy = H * 0.56 + (1 - a) * 5;
          figurCiz(g, ad, x, yy, fk, a);
          yaziCiz(g, AD[ad], x + 8 * fk, yy + 16 * fk + 7, Math.max(7, Math.round(fk * 5)), RENK[ad], a);
        });
      },
    },
    ays1:odaSahnesi('calisma', 'dogum', [3, 10]),
    ays2:odaSahnesi('kutuphane', 'ogle', [7, 22]),
    spi1:odaSahnesi('mutfak', 'ogle', [1, 14]),
    spi2:odaSahnesi('yatak', 'gece', [5, 18], true),
    /* Hareket: yaylada öğle, patikada iki koşucu */
    spi3:{
      hazirla(W, H){
        /* Gök görünmüyorsa tarla (yedek; yaylada gök hep açık) */
        const m = manzara(L.PIKSEL_DOGA, W, H, 'ogle', 'yayla'), p = m.arka.getContext('2d').getImageData(Math.floor(W / 2), Math.floor(H * 0.07), 1, 1).data;
        return { m:p[2] > p[1] ? m : manzara(L.PIKSEL_DOGA, W, H, 'ogle', 'tarla') };
      },
      ciz(g, W, H, yt, h, s){
        const A = L.PIKSEL_APARTMAN, n = A.POZ.yuru.k.length;
        g.save(); yakin(g, W, H, 1.1 - 0.08 * ara(yt, 0, 4) * oyna());
        g.drawImage(manzaraCiz(s.m, h), 0, 0);
        [[12, 0, 0.82], [27, 0.9, 0.86]].forEach(([i, gec, y]) => {
          const f = d && d.az ? 0.45 + gec * 0.2 : (yt - 0.1 - gec) / 3.6, kare = d && d.az ? 0 : Math.floor(h * 9) % n, c = A.gorsel('yuru', kare, A.SAKIN[i], false, 'ogle');
          const k = ekranKat(Math.min(W, H) / 110, 1);   // ön planda: manzaradan biraz büyük
          if(c && f > -0.1 && f < 1.1) g.drawImage(c, Math.round(karis(-c.width * k, W + 4, f) * OLCEK) / OLCEK, Math.round(H * y) - c.height * k, c.width * k, c.height * k);
        });
        g.restore();
      },
    },
    esp1:odaSahnesi('okuma', 'ogle', [9, 26]),
    esp2:odaSahnesi('arastirma', 'batim', [2, 31]),
    /* King'in odası, ikindi: üç sistemden ona ışık akar */
    king:{
      hazirla(W, H){ return { oda:tuval(L.PIKSEL_APARTMAN.KING_EN, L.PIKSEL_APARTMAN.KING_BOY), gok:gokBant(W, H, 'batim'), yildiz:yildizlar(W, H, 11) }; },
      ciz(g, W, H, yt, h, s){
        const A = L.PIKSEL_APARTMAN, z = 1.25 - 0.25 * ara(yt, 0, 2.2);
        g.drawImage(s.gok, 0, 0);
        kareCiz(g, '#1f1a2e', 0, 0, W, H, 0.45);
        g.save(); yakin(g, W, H, z);
        const k = ekranKat(Math.min(W * 0.86 / A.KING_EN, H * 0.48 / A.KING_BOY), 1), ow = A.KING_EN * k, ox = Math.round((W - ow) / 2), oy = Math.round(H * 0.36);
        A.kingOda(s.oda, h, 'batim', yt > 3.4, L.PIKSEL && L.PIKSEL.kingYuzu ? L.PIKSEL.kingYuzu() : 'mochi');
        kareCiz(g, '#3a2420', ox - 3, oy - 3, ow + 6, A.KING_BOY * k + 6, 1);
        g.drawImage(s.oda, ox, oy, ow, A.KING_BOY * k);
        const fk = ekranKat(k * 0.8, 1), ps = Math.max(2, Math.round(fk)), hx = W / 2, hy = oy - 2, akis = ara(yt, 1.2, 2.2);
        ['ays', 'spi', 'esp'].forEach((ad, i) => {
          const fx = W * (0.2 + 0.3 * i), fy = H * 0.08, gel = ara(yt, 0.4 + i * 0.3, 1.1 + i * 0.3);
          figurCiz(g, ad, fx - 8 * fk, fy + (1 - gel) * 4, fk, gel);
          for(let j = 0; j < 6; j++){
            const p = d && d.az ? (j + 0.5) / 6 : (yt * 0.45 + j / 6) % 1, sy = fy + 16 * fk + 2;
            kareCiz(g, RENK[ad], karis(fx, hx, p) - ps / 2, karis(sy, hy, p) - Math.sin(p * Math.PI) * 6 - ps / 2, ps, ps, akis * Math.sin(p * Math.PI) * 0.9);
          }
        });
        g.restore();
      },
    },
    /* Gün batar: mahallede ışıklar yanar, veri evdeki bilgisayara iner; sonra örnek çizelge */
    soz:{
      hazirla(W, H){ const A = L.PIKSEL_APARTMAN; return { batim:manzara(A, W, H, 'batim', 'bugun'), gece:manzara(A, W, H, 'gece', 'bugun') }; },
      ciz(g, W, H, yt, h, s){
        const gece = ara(yt, 0.4, 3.0);
        g.save(); yakin(g, W, H, 1 + 0.08 * ara(yt, 0, 7) * oyna());
        g.drawImage(manzaraCiz(s.batim, h), 0, 0);
        if(gece > 0){ g.globalAlpha = gece; g.drawImage(manzaraCiz(s.gece, h), 0, 0); g.globalAlpha = 1; }
        g.restore();
        kareCiz(g, '#120c24', 0, 0, W, H, 0.3);
        const k = ekranKat(Math.min(W, H) / 60, 2), px = Math.round(W / 2 - 8 * k), py = Math.round(H * 0.6 - 13 * k), gel = ara(yt, 0.3, 1.2);
        const kart = ara(yt, 3.0, 3.8);
        let isik = 0;
        ['ays', 'spi', 'esp'].forEach((ad, i) => {
          const fx = W * (0.2 + 0.3 * i), fy = H * 0.1, fk = ekranKat(k / 2, 1), ps = Math.max(2, Math.round(fk) + 1);
          figurCiz(g, ad, fx - 8 * fk, fy, fk, gel * (1 - kart));
          for(let j = 0; j < 4; j++){
            const p = d && d.az ? (j + 0.5) / 4 : ((yt - 0.8 - i * 0.25) * 0.55 + j / 4) % 1;
            if(p < 0) continue;
            const cx = W / 2 + (i - 1) * W * 0.15, cy = karis(fy, py, 0.15), q = 1 - p;
            const x = q * q * fx + 2 * q * p * cx + p * p * (W / 2), y = q * q * (fy + 16 * fk) + 2 * q * p * cy + p * p * (py + 5 * k);
            kareCiz(g, RENK[ad], x - ps / 2, y - ps / 2, ps, ps, gel * (1 - kart) * Math.min(1, (1 - p) * 4));
            if(p > 0.9) isik = Math.max(isik, (p - 0.9) * 10);
          }
        });
        pcCiz(g, px, py + kart * H * 0.2, k, gel * (0.4 + 0.6 * isik * oyna()));
        if(kart > 0){
          const cw = Math.min(Math.floor(W * 0.8), 168), ch = Math.min(Math.floor(H * 0.36), 88);
          cizelge(g, Math.round((W - cw) / 2), Math.round(H * 0.16 + (1 - kart) * H * 0.5), cw, ch, yt - 3.0, kart);
        }
      },
    },
    /* Son: gün batımında basamaklar, King tek tek çıkar; gece çöker, logo kalır */
    son:{
      hazirla(W, H){ const D = L.PIKSEL_DOGA; return { batim:manzara(D, W, H, 'batim', 'kiraz'), gece:manzara(D, W, H, 'gece', 'kiraz'), yildiz:yildizlar(W, H, 3) }; },
      ciz(g, W, H, yt, h, s){
        const gece = ara(yt, 3.4, 6.4);
        g.drawImage(manzaraCiz(s.batim, h), 0, 0);
        if(gece > 0){ g.globalAlpha = gece; g.drawImage(manzaraCiz(s.gece, h), 0, 0); g.globalAlpha = 1; yildizCiz(g, s.yildiz, yt, gece); }
        const n = 5, sw = Math.max(16, Math.floor(Math.min(W * 0.6 / n, 30))), sh = Math.max(6, Math.floor(Math.min(H * 0.07, 16))), taban = Math.round(H * 0.74), x0 = Math.round(W / 2 - sw * n / 2);
        for(let i = 0; i < n; i++){
          const x = x0 + i * sw, y = taban - (i + 1) * sh;
          kareCiz(g, '#3a2e2a', x, y, sw, taban - y, 1);
          kareCiz(g, '#b9b2a6', x + 1, y + 1, sw - 2, taban - y - 1, 1);
          kareCiz(g, '#e8e2d6', x + 1, y + 1, sw - 2, 2, 1);
          kareCiz(g, '#8d867b', x + sw - 3, y + 3, 2, taban - y - 3, 1);
        }
        kareCiz(g, '#120c24', x0, taban - n * sh, sw * n, n * sh, gece * 0.45);
        const yuz = L.PIKSEL && L.PIKSEL.kingYuzu ? L.PIKSEL.kingYuzu() : 'mochi', fk = ekranKat(sw * 1.25 / 16, 1);
        const yer = j => (j < 0 ? [x0 - sw, taban] : [x0 + j * sw, taban - (j + 1) * sh]);
        let j = -1;
        for(let i = 0; i < n; i++) if(yt >= 0.6 + i * 0.6 + 0.45) j = i;
        const sonraki = j + 1, bas = 0.6 + sonraki * 0.6, f = sonraki < n && !(d && d.az) ? Math.max(0, Math.min(1, (yt - bas) / 0.45)) : 0;
        const [ax, ay] = yer(j), [bx, by] = yer(Math.min(n - 1, sonraki));
        let fx = karis(ax, bx, yumusak(f)), fy = karis(ay, by, f) - Math.sin(f * Math.PI) * sh * 1.6;
        if(d && d.az){ [fx, fy] = yer(n - 1); }
        figurCiz(g, 'king_' + yuz, fx + (sw - 16 * fk) / 2, fy - 16 * fk, fk, 1);
        for(let i = 0; i <= j; i++){
          const r = (yt - (0.6 + i * 0.6 + 0.45)) / 0.5;
          if(r < 0 || r > 1 || (d && d.az)) continue;
          const [kx, ky] = yer(i), mx = kx + sw / 2;
          [[-1, 0], [1, 0], [0, -1], [-0.7, -0.7], [0.7, -0.7]].forEach(([vx, vy]) => kareCiz(g, '#ffd35a', mx + vx * (3 + r * 6), ky - 2 + vy * (3 + r * 6), 1, 1, 1 - r));
        }
        const gel = ara(yt, 4.0, 5.2), k = ekranKat(Math.min(W, H) / 70, 2);
        figurCiz(g, 'logo', W / 2 - 8 * k, H * 0.14 - 8 * k + Math.sin(yt * 1.7) * 1.4 * oyna() + (1 - gel) * 4, k, gel);
        yaziCiz(g, 'LifeOS', W / 2, H * 0.14 + 13 * k, Math.max(11, Math.round(Math.min(W, H) / 11)), '#fff8ea', ara(yt, 4.4, 5.6));
      },
    },
  };

  /* ---------- kurgu: sahne girişleri ve kare döngüsü ---------- */
  function hazir(s){
    if(!d.hazir[s.id]) d.hazir[s.id] = SAHNELER[s.id].hazirla(d.W, d.H);
    return d.hazir[s.id];
  }
  function sahneCiz(g, s, t){
    const h = d.az ? 0 : t;
    g.save(); SAHNELER[s.id].ciz(g, d.W, d.H, t - s.bas, h, hazir(s), s.son - s.bas); g.restore();
  }
  function araCiz(s, t){
    const a = d.ara.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0); a.imageSmoothingEnabled = false;
    a.clearRect(0, 0, d.W, d.H);
    sahneCiz(a, s, t);
    return d.ara;
  }
  function ciz(t){
    const g = d.g, W = d.W, H = d.H, l = sahneler(t, d.az);
    g.setTransform(OLCEK, 0, 0, OLCEK, 0, 0);
    g.imageSmoothingEnabled = false;
    if(l.length < 2 || l[1].f >= 1){ sahneCiz(g, (l[1] || l[0]).s, t); return; }
    const [{ s:eski }, { s:yeni, f }] = l;
    if(f <= 0){ sahneCiz(g, eski, t); return; }
    const tur = yeni.gecis || 'cozul';
    if(tur === 'kay'){
      /* Kamera yana kayar: eski sola çıkar, yeni sağdan girer */
      g.save(); g.translate(-Math.round(f * W * OLCEK) / OLCEK, 0); sahneCiz(g, eski, t); g.restore();
      g.drawImage(araCiz(yeni, t), Math.round((1 - f) * W * OLCEK) / OLCEK, 0);
      return;
    }
    if(tur === 'yakin'){
      g.save(); yakin(g, W, H, 1 + 0.8 * f); sahneCiz(g, eski, t); g.restore();
    }else sahneCiz(g, eski, t);
    const yc = araCiz(yeni, t);
    if(tur === 'blok'){
      /* Piksel bloklar çaprazlamasına açılır */
      const b = Math.max(8, Math.round(Math.min(W, H) / 12)), nx = Math.ceil(W / b), ny = Math.ceil(H / b);
      g.save(); g.beginPath();
      for(let y = 0; y < ny; y++) for(let x = 0; x < nx; x++) if((x + y * 0.7) / (nx + ny * 0.7) < f * 1.15 - 0.05) g.rect(x * b, y * b, b, b);
      g.clip(); g.drawImage(yc, 0, 0); g.restore();
      return;
    }
    g.globalAlpha = f; g.drawImage(yc, 0, 0); g.globalAlpha = 1;
  }
  function etiket(t){
    const e = d.basladi ? etiketAt(t) : null;
    if(e === d.etiketOn) return;
    d.etiketOn = e;
    d.etiket.classList.toggle('is-gorunur', !!e);
    if(e){
      d.etiket.style.setProperty('--sinematik-renk', RENK[e]);
      d.etiket.innerHTML = '<b>' + AD[e] + '</b><span>' + yz('etiket.' + e) + '</span>';
    }
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
    etiket(t);
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
      + '<p class="sinematik__etiket" aria-hidden="true"></p>'
      + '<div class="sinematik__alt"><p class="sinematik__yazi" aria-live="polite"></p>'
      +   '<div class="sinematik__son"><button type="button" class="sinematik__basla" data-sinematik="basla">' + yz('basla') + '</button>'
      +   '<button type="button" class="sinematik__yeniden" data-sinematik="yeniden">' + yz('yeniden') + '</button></div>'
      +   '<div class="sinematik__denetim"><button type="button" class="sinematik__dugme" data-sinematik="oynat"></button>'
      +   '<button type="button" class="sinematik__dugme" data-sinematik="ses"></button>'
      +   '<span class="sinematik__cizgi" aria-hidden="true"><i></i></span></div></div>';
    document.body.appendChild(kok);
    d = { kok, c:kok.querySelector('canvas'), yazi:kok.querySelector('.sinematik__yazi'), cubuk:kok.querySelector('.sinematik__cizgi i'),
      etiket:kok.querySelector('.sinematik__etiket'), t:AFIS, oynuyor:false, sesAcik, az:hareketAz(), hazir:{}, satir:-1, W:0, H:0, once:document.activeElement, son:null,
      bitince:o && o.bitince };
    kok.addEventListener('click', tikla);
    document.addEventListener('keydown', tus, true);
    document.addEventListener('visibilitychange', gorunurluk);
    window.addEventListener('resize', boyutla);
    /* Afiş: oynatılmadan önce başlık kartı (t = AFIS) durur */
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

  return Object.freeze({ ac, kapat, acikMi:() => !!d, gerekli, hesapAnahtari:anahtar, SATIR, SAHNE, SURE, _satirAt:satirAt, _sahneler:sahneler, _durum:() => d, _kare:t => { if(d) ciz(t); } });
})(window.LIFEOS);
