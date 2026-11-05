/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/piksel.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Piksel teması: kaynağı brand/ortak/piksel.js ve piksel.css.
   Kanıtladığı sözler: seçili değilken hiç çizmez; yazı kâğıtta okunur (AA), açık ve koyuda. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const Z = window.LIFEOS.ZEMIN;

  function isikli(hex){
    const n = parseInt(hex.trim().slice(1), 16), k = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
  }
  function oran(a, b){ const x = isikli(a), y = isikli(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  describe('Piksel teması', () => {
    it('bölüm başlığı konusuna göre simge alır; bilinmeyen başlık simgesiz kalır', () => {
      const B = window.LIFEOS.PIKSEL.baslikAdi;
      expect(B('Su')).toBe('damla');
      expect(B('Öğünler')).toBe('ogun');
      expect(B('Sürpriz')).toBe(null);
      expect(B('Günün ölçümü')).toBe('nabiz');
      ['damla', 'ogun', 'nabiz', 'ay', 'tarti', 'tup', 'takvim', 'kitap', 'belge', 'alev', 'harita', 'kalem', 'nota', 'yildiz', 'uyari', 'ayar', 'kisi', 'saat', 'hedef', 'yenile', 'kalp']
        .forEach(ad => expect(!!window.LIFEOS.PIKSEL_SIMGE.bul(ad)).toBe(true));
    });
    it('kıvılcım sekiz kare atar, aria-hidden ve dokunulmaz; hareket azaltılmışsa hiç çizmez', () => {
      const P = window.LIFEOS.PIKSEL, kok = document.documentElement, once = kok.getAttribute('data-hareket');
      kok.setAttribute('data-zemin', 'piksel');
      kok.setAttribute('data-hareket', 'az');
      try{
        expect(P.kivilcim(10, 10)).toBe(0);
        expect(document.querySelectorAll('.px-kivilcim').length).toBe(0);
      }finally{ if(once) kok.setAttribute('data-hareket', once); else kok.removeAttribute('data-hareket'); }
      const n = P.kivilcim(10, 10);
      if(n){
        const e = document.querySelector('.px-kivilcim');
        expect(n).toBe(8);
        expect(e.children.length).toBe(8);
        expect(e.getAttribute('aria-hidden')).toBe('true');
        e.remove();
      }
    });
    it('küçük tepkiler: liste bitti yalnız hepsi bitince, cevap sınıfı doğru/yanlışa göre, desenler', () => {
      const P = window.LIFEOS.PIKSEL, d = document.createElement('div'), kok = document.documentElement, once = kok.getAttribute('data-hareket');
      kok.setAttribute('data-zemin', 'piksel');
      kok.setAttribute('data-hareket', 'tam');
      d.innerHTML = '<ul><li><input type="checkbox" checked></li><li><input type="checkbox"></li></ul>'
        + '<div class="kutu"><button class="minrow is-done"></button><button class="minrow" id="m2"></button></div>'
        + '<div class="kutu"><button class="minrow"></button><button class="minrow" id="m3"></button></div>'
        + '<ul><li><input type="checkbox" id="tek" checked></li></ul>'
        + '<button class="secenek is-dogru" data-harf="A"><span class="secenek__harf">A</span></button><button class="secenek is-yanlis" data-harf="B"></button><button class="secenek" data-harf="C"></button>';
      document.body.appendChild(d);
      try{
        const k = d.querySelectorAll('input');
        expect(P.listeBitti(k[1])).toBe(false);
        k[1].checked = true;
        expect(P.listeBitti(k[1])).toBe(true);
        expect(P.listeBitti(d.querySelector('#tek'))).toBe(false);   // tek iş «liste» değil
        expect(P.listeBitti(d.querySelector('#m2'))).toBe(true);
        expect(P.listeBitti(d.querySelector('#m3'))).toBe(false);
        const s = d.querySelectorAll('.secenek');
        expect(P.cevapIsle(s[0])).toBe('dogru');
        expect(s[0].classList.contains('px-dogru')).toBe(true);
        expect(P.cevapIsle(s[1])).toBe('yanlis');
        expect(s[1].classList.contains('px-yanlis')).toBe(true);
        expect(P.cevapIsle(s[2])).toBe(null);
        expect(P.DESEN.buyuk.length).toBe(16);
        expect(P.DESEN.toz.length).toBe(7);
        kok.setAttribute('data-hareket', 'az');
        s[1].classList.remove('px-yanlis');
        expect(P.cevapIsle(s[1])).toBe('yanlis');
        expect(s[1].classList.contains('px-yanlis')).toBe(false);   // azaltılmışta sallanma yok
        expect(P.toz(s[1])).toBe(0);
      }finally{
        d.remove();
        document.querySelectorAll('.px-kivilcim').forEach(e => e.remove());
        if(once) kok.setAttribute('data-hareket', once); else kok.removeAttribute('data-hareket');
      }
    });
    it('kıvılcım: Sistem kipinde işletim sistemi «azalt» derse ve düğme hızı Kapalı ise çizmez', () => {
      const P = window.LIFEOS.PIKSEL, L = window.LIFEOS, eskiAz = L.hareketAz, A = L.ANIMASYON, eskiHiz = A.hizlar();
      document.documentElement.setAttribute('data-zemin', 'piksel');
      try{
        L.hareketAz = () => true;
        expect(P.kivilcim(10, 10)).toBe(0);
        L.hareketAz = () => false;
        A.hizAyarla('dugme', 0);
        expect(P.kivilcim(10, 10)).toBe(0);
      }finally{
        L.hareketAz = eskiAz;
        A.hizAyarla('dugme', eskiHiz.dugme);
        document.querySelectorAll('.px-kivilcim').forEach(e => e.remove());
      }
    });
    it('çizim: nokta kare olur, halka bloklanır ama dolu kısmın uzunluğu değişmez', () => {
      const P = window.LIFEOS.PIKSEL, d = document.createElement('div');
      d.innerHTML = '<svg viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="30" fill="none" stroke="#000" stroke-width="6"/><circle class="dolu" cx="50" cy="50" r="30" fill="none" stroke="#f00" stroke-width="6" stroke-dasharray="40 200"/><circle class="n" cx="20" cy="10" r="4" fill="#00f"/></svg>';
      document.body.appendChild(d);
      try{
        const s = d.firstChild;
        P.cizimCevir(s);
        const k = s.querySelector('rect.n');
        expect(!!k).toBe(true);
        expect(k.getAttribute('x')).toBe('16');
        expect(k.getAttribute('width')).toBe('8');
        expect(!!s.querySelector('circle.n')).toBe(false);
        expect(s.querySelectorAll('.px-ara').length).toBe(1);
        expect(s.querySelector('.dolu').getAttribute('stroke-dasharray')).toBe('40 200');
      }finally{ d.remove(); }
    });
    it('figür svg çevirici tarafından bozulmaz', () => {
      const s = window.LIFEOS.PIKSEL.figurSvg('logo');
      expect(s.indexOf('data-px="1"') > 0).toBe(true);
      expect(s.indexOf('data-pxc="1"') > 0).toBe(true);
    });
    it('oda çizilir: kök piksel, tuval var', () => {
      window.LIFEOS.PIKSEL.uygula();
      expect(document.documentElement.getAttribute('data-zemin')).toBe('piksel');
      expect(!!document.querySelector('.piksel-oda')).toBe(true);
    });
    it('yazı kâğıtta AA geçer: açık ve koyu', async () => {
      /* Test sayfası bütün stilleri yüklemez: jetonları tema dosyasının kendisinden okur. */
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = '../css/piksel.css';
      await new Promise((ok, ret) => { link.onload = ok; link.onerror = ret; document.head.appendChild(link); });
      const eski = Z.kip(), kok = document.documentElement, tema = kok.getAttribute('data-theme');
      try{
        Z.ayarla('piksel');
        ['light', 'dark'].forEach(t => {
          kok.setAttribute('data-theme', t);
          const s = getComputedStyle(kok), kagit = s.getPropertyValue('--piksel-kagit');
          ['--text', '--text-2', '--text-3'].forEach(v => expect(oran(s.getPropertyValue(v), kagit) >= 4.5).toBe(true));
          expect(oran(s.getPropertyValue('--primary-ink'), s.getPropertyValue('--primary')) >= 4.5).toBe(true);
          expect(oran(s.getPropertyValue('--piksel-kenar-yazi'), s.getPropertyValue('--piksel-tahta')) >= 4.5).toBe(true);
        });
      }finally{
        if(tema) kok.setAttribute('data-theme', tema); else kok.removeAttribute('data-theme');
        Z.ayarla(eski);
        link.remove();
      }
    });
    it('figürler çizilir, her satır aynı genişlikte, palette olmayan harf yok', () => {
      const F = window.LIFEOS.PIKSEL_FIGUR;
      Object.keys(F).forEach(ad => {
        const f = F[ad], G = f.s[0].length;
        f.s.forEach(r => { expect(r.length).toBe(G); for(const c of r) expect(c === '.' || c in f.p).toBe(true); });
        expect(window.LIFEOS.PIKSEL.figurSvg(ad).indexOf('<path') >= 0).toBe(true);
      });
    });
    it('simge: kaplama eşiği pikseli doğru seçer, çizgi simge tek yola iner', () => {
      const P = window.LIFEOS.PIKSEL;
      /* 2x2 ızgara, kat 1: yalnız sol üst dolu */
      const a = new Uint8ClampedArray(16); a[3] = 255;
      expect(P.kaplamaYol(a, 2, 1, 0.5)).toBe('M0 0h1v1h-1z');
      const d = document.createElement('div');
      d.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" style="fill:none;stroke:currentColor;stroke-width:2"><path d="M4 12h16"/></svg>';
      document.body.appendChild(d);
      const s = d.firstChild;
      P.simgeCevir(s);
      expect(s.getAttribute('shape-rendering')).toBe('crispEdges');
      expect(s.querySelectorAll('path').length).toBe(1);
      expect(s.getAttribute('viewBox')).toBe('0 0 20 20');
      d.remove();
    });
    it('simgeler toplu çevrilir: bütün boylar okunmadan hiçbiri yazılmaz (yerleşim sarsıntısı yok)', () => {
      const P = window.LIFEOS.PIKSEL, kok = document.documentElement, eskiZemin = kok.getAttribute('data-zemin'), d = document.createElement('div');
      kok.setAttribute('data-zemin', 'piksel');
      d.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" style="fill:none;stroke:currentColor;stroke-width:2"><path d="M4 12h16"/></svg>'.repeat(3);
      document.body.appendChild(d);
      const eski = window.getComputedStyle;
      let yazildiktanSonraOkuma = 0;
      window.getComputedStyle = function(e, s){
        if(e.tagName.toLowerCase() === 'svg' && d.querySelector('svg[shape-rendering]')) yazildiktanSonraOkuma++;
        return eski.call(window, e, s);
      };
      try{
        P.simgeleriTara(d);
        expect(yazildiktanSonraOkuma).toBe(0);
        d.querySelectorAll('svg').forEach(s => expect(s.getAttribute('shape-rendering')).toBe('crispEdges'));
      }finally{
        window.getComputedStyle = eski;
        d.remove();
        if(eskiZemin) kok.setAttribute('data-zemin', eskiZemin); else kok.removeAttribute('data-zemin');
      }
    });
    it('hareket akıcı: tema adımlı eğri dayatmaz, «bütün özellikleri geçişli» öğe üretmez', async () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = '../css/piksel.css';
      await new Promise((ok, ret) => { link.onload = ok; link.onerror = ret; document.head.appendChild(link); });
      const kok = document.documentElement, eskiZemin = kok.getAttribute('data-zemin'), d = document.createElement('div');
      kok.setAttribute('data-zemin', 'piksel');
      document.body.appendChild(d);
      try{
        const s = getComputedStyle(d);
        expect(s.animationTimingFunction.indexOf('steps')).toBe(-1);
        expect(s.transitionTimingFunction.indexOf('steps')).toBe(-1);
        expect(getComputedStyle(kok).getPropertyValue('--ease').indexOf('steps')).toBe(-1);
      }finally{
        d.remove();
        link.remove();
        if(eskiZemin) kok.setAttribute('data-zemin', eskiZemin); else kok.removeAttribute('data-zemin');
      }
    });
    it('elle çizilen simgeler 12×12, takma adlar çizime gider', () => {
      const G = window.LIFEOS.PIKSEL_SIMGE;
      Object.keys(G.S).forEach(ad => { expect(G.S[ad].length).toBe(12); G.S[ad].forEach(r => expect(r.length).toBe(12)); });
      Object.keys(G.AD).forEach(ad => expect(!!G.bul(ad)).toBe(true));
      expect(G.bul('yok-boyle')).toBe(null);
    });
    it('apartman: asansör ortada, koridor iki yanda, evler dışta; hiçbir oda taşmaz ve çakışmaz', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN;
      [[384, 216], [342, 192], [480, 270]].forEach(q => {
        const o = A.yerlesim(q[0], q[1], 'ogle');
        expect(Math.abs(o.ax + A.ASANSOR / 2 - q[0] / 2) <= 1).toBe(true);
        expect(o.solSon).toBe(o.ax - A.KORIDOR);
        expect(o.odalar.every(a => a.x >= 0 && a.x + a.w <= q[0] && (a.x + a.w <= o.solSon || a.x >= o.sagBas))).toBe(true);
        const kat = {};
        o.odalar.forEach(a => { (kat[a.y] = kat[a.y] || []).push(a); });
        Object.values(kat).forEach(l => l.sort((x, y) => x.x - y.x).forEach((a, i) => { if(i) expect(a.x >= l[i - 1].x + l[i - 1].w).toBe(true); }));
      });
    });
    it('apartman: telefonda koridor yok, kat başına tek oda, asansör kenarda', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, o = A.yerlesim(98, 211, 'batim');
      expect(o.dar).toBe(true);
      expect(o.odalar.length).toBe(o.n);
      expect(o.ax + A.ASANSOR + 3).toBe(98);   // asansörün sağında üç piksellik bina duvarı
    });
    it('vakit gerçek saatten gelir: gün doğumu, öğlen, gün batımı, gece', () => {
      const V = window.LIFEOS.PIKSEL_APARTMAN.vakit;
      expect(V(3)).toBe('gece'); expect(V(7)).toBe('dogum'); expect(V(12)).toBe('ogle'); expect(V(19)).toBe('batim'); expect(V(23)).toBe('gece');
    });
    it('günün planı: gece yatakta uyur, öğlen işe gider, akşam ikisi birlikte', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, a = { ad:'a' }, b = { ad:'b' };
      const gece = A.gunPlani(['salon', 'banyo', 'yatak'], a, b, 'gece', 1);
      expect(gece.yatak.uyku).toBe(true); expect(gece.yatak.k.length).toBe(2);
      const ogle = A.gunPlani(['mutfak', 'ofis'], a, b, 'ogle', 0);
      expect(ogle.ofis.k[0]).toBe(a); expect(ogle.mutfak.k[0]).toBe(b);
      const aksam = A.gunPlani(['salon', 'banyo', 'yatak'], a, b, 'batim', 1);
      expect(aksam.salon.k.length).toBe(2);
    });
    it('sahne: aynı t aynı kareyi verir, her kişinin saati kırık değil, bilinmeyen poz yok', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN;
      ['dogum', 'ogle', 'batim', 'gece'].forEach(v => {
        const o = A.yerlesim(384, 216, v), hepsi = [o.cati, o.zemin, o.asansor].concat(o.bolgeler);
        hepsi.forEach(b => b.sakin.forEach(r => {
          expect(r.T > 0 && isFinite(r.T)).toBe(true);
          r.seg.forEach(q => { expect(!!A.POZ[q.poz]).toBe(true); expect(q.t1 >= q.t0).toBe(true); });
          [0, 7.3, r.T + 2].forEach(t => { const k = A.kareAl(r, t); expect(JSON.stringify(k)).toBe(JSON.stringify(A.kareAl(r, t))); });
        }));
      });
    });
    it('hikâye: asansör sakinleri kabinle aynı saatte döner', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, o = A.yerlesim(384, 216, 'ogle'), T = o.asansor.sakin[0].T;
      expect(o.cati.sakin.some(r => Math.abs(r.T - T) < 0.001)).toBe(true);
      expect(o.zemin.sakin.some(r => Math.abs(r.T - T) < 0.001)).toBe(true);
    });
    it('sakinler: otuz altı kişi birbirinin aynısı değil, her karesi düzgün dikdörtgen', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN;
      expect(new Set(A.SAKIN.map(k => [k.s, k.h, k.sac, k.g, k.giyim, k.ek, k.boy].join())).size).toBe(A.SAKIN.length);
      Object.keys(A.POZ).filter(p => p !== 'kabinK' && p !== 'gizli').forEach(p => A.POZ[p].k.forEach(f => expect(new Set(f.map(r => r.length)).size).toBe(1)));
      expect(A.POZ.yuru.k.length).toBe(4);
    });
    it('ruh hâli vakte göre değişir', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN;
      A.SAKIN.forEach(k => ['dogum', 'ogle', 'batim', 'gece'].forEach(v => expect(!!A.ruhu(k, v)).toBe(true)));
      expect(A.SAKIN.some(k => new Set(['dogum', 'ogle', 'batim', 'gece'].map(v => A.ruhu(k, v))).size > 1)).toBe(true);
    });
    it('her evde tam bir yatak odası var; King odası apartmanda değil', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN;
      [[384, 216], [342, 192], [480, 270], [640, 360]].forEach(q => {
        const o = A.yerlesim(q[0], q[1], 'ogle'), ev = {};
        o.odalar.forEach(a => { const k = a.y + (a.x > o.ax ? 's' : 'l'); (ev[k] = ev[k] || []).push(a.tip); });
        Object.values(ev).forEach(l => expect(l.filter(t => t === 'yatak').length).toBe(1));
        expect(o.odalar.some(a => a.tip === 'king')).toBe(false);
      });
    });
    it('komşuluk: gündüz biri kapı çalar, kapı açılır, gece kimse kapı çalmaz', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, poz = o => [o.cati, o.zemin].concat(o.bolgeler).flatMap(b => b.sakin).flatMap(r => r.seg.map(q => q.poz));
      const gun = poz(A.yerlesim(384, 216, 'ogle')), gece = poz(A.yerlesim(384, 216, 'gece'));
      ['kapi', 'tak', 'kapi_a', 'konus', 'dinle', 'el'].forEach(p => expect(gun.includes(p)).toBe(true));
      ['kapi', 'tak', 'kapi_a'].forEach(p => expect(gece.includes(p)).toBe(false));
      const o = A.yerlesim(384, 216, 'batim'), kat = o.bolgeler[0], ikisi = kat.sakin.filter(r => r.seg.some(q => q.poz === 'kapi' || q.poz === 'kapi_a'));
      expect(ikisi.length).toBe(2);
      expect(Math.abs(ikisi[0].T - ikisi[1].T) < 0.001).toBe(true);
    });
    it('hayvanlar: gündüz kuşlar, gece baykuş; evlerde türlü evcil hayvan', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, poz = o => [o.cati, o.zemin].concat(o.bolgeler).flatMap(b => b.sakin).flatMap(r => r.seg.map(q => q.poz));
      const gun = poz(A.yerlesim(384, 216, 'ogle')), gece = poz(A.yerlesim(384, 216, 'gece'));
      expect(new Set(gun.filter(p => /^kus[uk]_/.test(p)).map(p => p.slice(-1))).size >= 3).toBe(true);
      expect(gece.includes('baykus')).toBe(true);
      expect(gece.some(p => /^kusu_/.test(p))).toBe(false);
      expect(new Set(gun.filter(p => /^(kedi|kopek|tavsan)/.test(p) && !/yuru$/.test(p))).size >= 3).toBe(true);
    });
    it('King odası: karakter küçük tuvalde döner, kare değişmezse yeniden çizilmez, gece uyur', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, c = document.createElement('canvas');
      c.width = A.KING_EN; c.height = A.KING_BOY;
      expect(A.kingOda(c, 1, 'ogle', false)).toBe(true);
      expect(A.kingOda(c, 1, 'ogle', false)).toBe(false);
      expect(c.getContext('2d').getImageData(5, 5, 1, 1).data[3]).toBe(255);
      expect(A.kingOda(c, 1, 'ogle', true)).toBe(true);
      expect(A.kingOda(c, 1, 'ogle', true, 'tavsan')).toBe(true);
      expect(A.ODA.king.hayat(0, 42, [], 'gece')[0].seg[0].poz).toBe('kuyu');
    });
    it('King karakteri: dört seçenek, seçim saklanır, bilinmeyen ad kabul edilmez', () => {
      const P = window.LIFEOS.PIKSEL, F = window.LIFEOS.PIKSEL_FIGUR, once = localStorage.getItem('lifeos.king.yuz');
      try{
        expect(P.KING_YUZLER.length).toBe(4);
        P.KING_YUZLER.forEach(a => { expect(F['king_' + a].s.length).toBe(16); expect(P.kingYuz(a)).toBe(true); expect(P.kingYuzu()).toBe(a); expect(document.documentElement.style.getPropertyValue('--fig-king')).toBe('var(--fig-king_' + a + ')'); });
        expect(P.kingYuz('aksolot')).toBe(false);
        expect(!!F.king).toBe(false);
      }finally{ if(once) localStorage.setItem('lifeos.king.yuz', once); else localStorage.removeItem('lifeos.king.yuz'); P.kingYuz(P.kingYuzu()); }
    });
    it('mahalle: her çekmecenin yeri var, binalar yatak odasız ve taşmaz, gündüz çalışan var', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, P = window.LIFEOS.PIKSEL;
      expect(P.MAHALLE.includes('bugun') && P.MAHALLE.includes('calisma') && P.MAHALLE.includes('analiz') && P.MAHALLE.includes('kutuphane')).toBe(true);
      Object.values(P.CEKMECE_YER).forEach(y => expect(P.MAHALLE.includes(y)).toBe(true));
      ['calisma', 'analiz', 'kutuphane'].forEach(y => {
        const o = A.yerlesim(384, 216, 'ogle', y);
        expect(o.yer).toBe(y);
        expect(o.odalar.some(a => a.tip === 'yatak')).toBe(false);
        expect(o.odalar.every(a => a.x >= 0 && a.x + a.w <= 384)).toBe(true);
        expect(o.bolgeler.some(b => b.sakin.some(r => r.kisi))).toBe(true);
        [o.cati, o.zemin].concat(o.bolgeler).forEach(b => b.sakin.forEach(r => r.seg.forEach(q => expect(!!A.POZ[q.poz]).toBe(true))));
      });
      expect(A.yerlesim(384, 216, 'ogle', 'yok').yer).toBe('bugun');
    });
    it('iş binaları apartman değil: az kat, iki yanda boşluk; kütüphane ve çalışma asansörsüz, sokak çizgisi aynı', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, ap = A.yerlesim(384, 216, 'ogle');
      [['calisma', 2, false], ['analiz', 3, true], ['kutuphane', 2, false]].forEach(q => {
        const o = A.yerlesim(384, 216, 'ogle', q[0]);
        expect(o.n).toBe(q[1]); expect(o.n < ap.n).toBe(true); expect(o.sokak).toBe(ap.sokak);
        expect(!!o.asansor).toBe(q[2]); expect(o.bx0 > 0).toBe(true);
        expect(o.odalar.every(a => a.x >= o.bx0 && a.x + a.w <= o.bx1)).toBe(true);
      });
    });
    it('karar: sakin kendi seçer; aynı t aynı kare, bloklar arasında seçim değişir, balon kişiyle aynı zarı atar', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, o = A.yerlesim(384, 216, 'ogle', 'calisma'), hepsi = [o.zemin].concat(o.bolgeler).flatMap(b => b.sakin);
      const k = hepsi.find(r => r.menu && r.kisi), b = hepsi[hepsi.indexOf(k) + 1];
      expect(!!k && !!b.menu && b.tohum === k.tohum).toBe(true);
      const kare = new Set();
      for(let i = 0; i < 40; i++){ const t = i * k.B + 12; expect(JSON.stringify(A.kareAl(k, t))).toBe(JSON.stringify(A.kareAl(k, t))); const q = A.kareAl(k, t); kare.add(q.poz + q.x); }
      expect(kare.size > 2).toBe(true);
      k.menu.forEach(e => { expect(Math.abs(e.T - k.B) < 0.01).toBe(true); expect(e.seg[0].x0).toBe(e.seg[e.seg.length - 1].x1); });
    });
    it('manzara: on tür; aynı t aynı kare, her vakitte kurulur ve çizilir', () => {
      const D = window.LIFEOS.PIKSEL_DOGA;
      expect(D.TUR_LISTE.length).toBe(10);
      D.TUR_LISTE.forEach(t => ['dogum', 'ogle', 'batim', 'gece'].forEach(v => {
        const o = D.yerlesim(384, 216, v, t);
        expect(o.tur).toBe(t);
        o.sakin.forEach(r => { expect(r.T > 0 && isFinite(r.T)).toBe(true); r.seg.forEach(q => expect(!!D.POZ[q.poz]).toBe(true)); expect(JSON.stringify(D.kareAl(r, 7.3))).toBe(JSON.stringify(D.kareAl(r, 7.3))); });
        const c = document.createElement('canvas'); c.width = 384; c.height = 216;
        D.binaCiz(c.getContext('2d'), o);
        const piksel = c.getContext('2d').getImageData(0, 0, 384, 216).data;
        let bos = 0; for(let i = 3; i < piksel.length; i += 4) if(piksel[i] !== 255) bos++;
        expect(bos).toBe(0);
      }));
    });
    it('yüklenme: manzara tuvali perdeye bir kez konur, kaldırılınca durur', () => {
      const P = window.LIFEOS.PIKSEL, el = document.createElement('div');
      document.body.appendChild(el);
      try{ expect(!!P.manzaraKoy(el)).toBe(true); expect(P.manzaraKoy(el)).toBe(null); expect(el.querySelectorAll('canvas.piksel-manzara').length).toBe(1); }finally{ el.remove(); }
    });
    it('dokunma: canlıya dokununca balon çıkar, boşa dokununca hiçbir şey olmaz', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, o = A.yerlesim(384, 216, 'ogle'), t = 2;
      const r = o.bolgeler.flatMap(b => b.sakin).find(s => s.seg.some(q => q.poz === 'kedi')), k = A.kareAl(r, t + (r.faz || 0));
      const sonuc = A.dokun(o, k.x + 6, k.y + 4, t);
      expect(/^kedi/.test(sonuc.poz)).toBe(true);
      expect(sonuc.tepki).toBe('b_kalp');
      expect(!!A.POZ[o.tepki.poz]).toBe(true);
      expect(A.dokun(A.yerlesim(384, 216, 'gece'), 2, 1, t)).toBe(null);
    });
    it('hareketsiz kipte sahne döngüsü hiç kurulmaz', () => {
      const P = window.LIFEOS.PIKSEL, k = document.documentElement, once = k.getAttribute('data-hareket'), asil = [window.setInterval, window.setTimeout, window.requestAnimationFrame];
      let kurulan = 0;
      const say = f => function(){ kurulan++; return f.apply(window, arguments); };
      k.setAttribute('data-zemin', 'piksel'); k.setAttribute('data-hareket', 'az');
      /* az kipine geçişi gözcü de görür: o sıra bitsin, sonra say */
      P.uygula();
      window.setInterval = say(asil[0]); window.setTimeout = say(asil[1]); window.requestAnimationFrame = say(asil[2]);
      try{ P.uygula(); expect(kurulan).toBe(0); }
      finally{ window.setInterval = asil[0]; window.setTimeout = asil[1]; window.requestAnimationFrame = asil[2]; if(once) k.setAttribute('data-hareket', once); else k.removeAttribute('data-hareket'); }
    });
    it('döngü: üç kez kurulsa da tek zincir işler, kapatılınca sıradaki uyanış çizmez', async () => {
      const P = window.LIFEOS.PIKSEL, k = document.documentElement, once = k.getAttribute('data-hareket'), asilRaf = window.requestAnimationFrame;
      k.setAttribute('data-zemin', 'piksel'); k.setAttribute('data-hareket', 'tam');
      let raf = 0;
      window.requestAnimationFrame = function(){ raf++; return asilRaf.apply(window, arguments); };
      try{
        P.uygula(); P.uygula(); P.uygula();
        raf = 0;
        await new Promise(r => setTimeout(r, 500));
        /* tek zincir saniyede en çok 24 uyanır; yarım saniyede 12 (eski zincirler yaşasaydı katlanırdı) */
        expect(raf <= 16).toBe(true);
        k.setAttribute('data-hareket', 'az');
        P.uygula();
        await new Promise(r => setTimeout(r, 120));
        raf = 0;
        await new Promise(r => setTimeout(r, 250));
        expect(raf).toBe(0);
      }finally{ window.requestAnimationFrame = asilRaf; if(once) k.setAttribute('data-hareket', once); else k.removeAttribute('data-hareket'); P.uygula(); }
    });
    it('çizim çevirici önce okur sonra yazar: daireler arası stil yeniden hesaplanmaz', () => {
      const P = window.LIFEOS.PIKSEL, kok = document.documentElement, eskiZemin = kok.getAttribute('data-zemin'), d = document.createElement('div');
      kok.setAttribute('data-zemin', 'piksel');
      d.innerHTML = '<svg viewBox="0 0 100 100" width="100" height="100"><circle cx="10" cy="10" r="3" fill="#00f"/><circle cx="20" cy="10" r="3" fill="#00f"/></svg>'.repeat(3);
      document.body.appendChild(d);
      const eski = window.getComputedStyle, asilYaz = Element.prototype.replaceWith;
      let yazildi = false, gecOkuma = 0;
      window.getComputedStyle = function(e, s){ if(yazildi && e.tagName.toLowerCase() !== 'svg') gecOkuma++; return eski.call(window, e, s); };
      Element.prototype.replaceWith = function(){ yazildi = true; return asilYaz.apply(this, arguments); };
      try{
        P.simgeleriTara(d);
        expect(yazildi).toBe(true);
        expect(gecOkuma).toBe(0);
        expect(d.querySelectorAll('rect').length).toBe(6);
        expect(d.querySelectorAll('circle').length).toBe(0);
      }finally{
        window.getComputedStyle = eski;
        Element.prototype.replaceWith = asilYaz;
        d.remove();
        if(eskiZemin) kok.setAttribute('data-zemin', eskiZemin); else kok.removeAttribute('data-zemin');
      }
    });
    it('hareket ızgaraya oturur: yürüyüş kareleri eşit sürer, araç her karede tam bir piksel ilerler', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, o = A.yerlesim(384, 216, 'ogle');
      const yuruyen = o.zemin.sakin.find(s => s.kisi === A.SAKIN[28]), q = yuruyen.seg.find(g => g.poz === 'yuru');
      const tut = [];
      let son = null, n = 0;
      for(let i = Math.ceil(q.t0 * A.YAVAS_HZ) + 1; i < q.t1 * A.YAVAS_HZ - 1; i++){ const k = A.kareAl(yuruyen, i / A.YAVAS_HZ).i; if(k === son) n++; else { if(son !== null) tut.push(n); son = k; n = 1; } }
      expect(tut.length > 8).toBe(true);
      tut.slice(1).forEach(v => expect(v).toBe(2));
      const araba = o.zemin.sakin.find(s => s.seg.some(g => g.poz === 'araba3')), s = araba.seg.find(g => g.poz === 'araba3');
      expect(araba.hizli).toBe(true);
      expect(o.zemin.sakin.filter(r => r.kisi).every(r => !r.hizli)).toBe(true);
      for(let i = Math.ceil(s.t0 * A.HIZLI_HZ) + 1; i + 1 < s.t1 * A.HIZLI_HZ; i++) expect(A.kareAl(araba, (i + 1) / A.HIZLI_HZ).x - A.kareAl(araba, i / A.HIZLI_HZ).x).toBe(1);
    });
    it('kare: aynı ızgara hücresinde hiç çizmez; hızlı aralık yalnız ekranda araç varken', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, o = A.yerlesim(384, 216, 'ogle'), arka = document.createElement('canvas');
      arka.width = 384; arka.height = 216;
      let ciz = 0;
      const g = { drawImage(){ ciz++; } }, araba = o.zemin.sakin.filter(s => s.hizli);
      const ara = f => { for(let t = 3000; t < 3400; t += 0.5) if(f(araba.some(s => A.kareAl(s, t)))) return Math.floor(t * 12) / 12; };
      const bos = ara(v => !v), dolu = ara(v => v);
      A.kare(g, arka, o, bos + 0.001);
      expect(Math.round(o.aralik)).toBe(83);
      ciz = 0;
      A.kare(g, arka, o, bos + 0.01);
      expect(ciz).toBe(0);
      A.kare(g, arka, o, dolu + 0.001);
      expect(Math.round(o.aralik)).toBe(42);
    });
    it('araçlar kişi boyunda ve binaya göre belirgin; şerit, yön ve çarpışma ölçeğe uyar', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN;
      ['araba1', 'araba2', 'araba3'].forEach(p => A.POZ[p].k.forEach(f => {
        expect(f.length >= 17).toBe(true);
        expect(f[0].length >= 52).toBe(true);
        expect(f.length * 2 >= A.KAT).toBe(true);   // en az yarım kat boyunda
      }));
      [[384, 216], [342, 192], [480, 270], [98, 211], [640, 360], [320, 150]].forEach(q => {
        const o = A.yerlesim(q[0], q[1], 'ogle'), W = q[0], H = q[1], yol = o.sokak + 8;
        expect(H - yol >= 32).toBe(true);
        const arac = o.zemin.sakin.filter(s => s.seg.some(g => /^araba/.test(g.poz)));
        expect(arac.length).toBe(3);
        const T = arac[0].T;
        arac.forEach(a => expect(Math.abs(a.T - T) < 1e-6).toBe(true));
        for(let t = 0; t < T; t += 0.25){
          const k = arac.map(a => { const v = A.kareAl(a, t); return v && Object.assign(v, { w:A.POZ[v.poz].k[v.i][0].length, h:A.POZ[v.poz].k[v.i].length }); });
          k.forEach((v, i) => {
            if(!v) return;
            expect(v.y >= o.sokak + 6).toBe(true);        // kaldırımdaki kişinin üstüne binmez
            expect(v.y + v.h <= H).toBe(true);
            const s = arac[i].seg.find(g => /^araba/.test(g.poz));
            expect(s.x1 < s.x0).toBe(v.ters);             // gittiği yöne bakar
            k.forEach((u, j) => { if(u && j > i && u.y + u.h === v.y + v.h) expect(u.x + u.w <= v.x || v.x + v.w <= u.x).toBe(true); });   // aynı şeritte çakışmaz
          });
        }
        /* ekrana tamamen girer ve tamamen çıkar */
        arac.forEach(a => { const s = a.seg.find(g => /^araba/.test(g.poz)), w = A.POZ[s.poz].k[0][0].length; expect(Math.min(s.x0, s.x1) + w <= 0).toBe(true); expect(Math.max(s.x0, s.x1) >= W).toBe(true); });
      });
    });
    it('yüz: her kişide, her pozda ve yönde gözü ve ağzı var; koyu tende de okunur', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, POZLAR = Object.keys(A.POZ).filter(p => (A.POZ[p].k[0] && A.POZ[p].k[0].bas) || p === 'yat');
      expect(POZLAR.length > 12).toBe(true);
      A.SAKIN.forEach(k => {
        const P = A.yuzPalet(k);
        expect(A.kontrast(P.e, P.s) >= 2.5).toBe(true);
        expect(A.kontrast(P.n, P.s) >= 3).toBe(true);
        Object.keys(A.PALET).forEach(v => POZLAR.forEach(p => A.POZ[p].k.forEach((_, i) => {
          const s = A.kisiSatir(p, i, k, A.ruhu(k, v)).flat();
          expect(s.filter(c => c === 'e').length >= 2).toBe(true);
          expect(s.filter(c => c === 'n' || c === 'M').length >= 1).toBe(true);
        })));
      });
    });
    it('yüz: sakal ağzı, gözlük gözü örtmez; saç tenle aynı aileden ise koyulaşır', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, bul = e => A.SAKIN.find(k => k.ek === e);
      const gozluk = A.kisiSatir('dur', 0, bul('gozluk'), 'sakin').flat();
      expect(gozluk.filter(c => c === 'W').length >= 2).toBe(true);
      const sakal = A.kisiSatir('dur', 0, bul('sakal'), 'sakin'), sira = sakal.findIndex(r => r.includes('n'));
      expect(sira >= 0).toBe(true);
      sakal[sira].forEach((c, x) => { if(c === 'n') expect(sakal[sira][x - 1] === 's' || sakal[sira][x - 1] === 'n').toBe(true); });
      const P = A.yuzPalet({ h:'#a5612f', s:'#a8703f' });
      expect(P.h === '#a5612f').toBe(false);
      expect(A.kontrast(P.h, P.s) > A.kontrast('#a5612f', P.s)).toBe(true);
      expect(A.yuzPalet({ h:'#d9d3c6', s:'#f6d3ae' }).h).toBe('#d9d3c6');   // beyaz saç griye dönmez
    });
    it('yüz: gece çift yatakta öndeki arkadakinin yüzünü örtmez', () => {
      const A = window.LIFEOS.PIKSEL_APARTMAN, o = A.yerlesim(384, 216, 'gece');
      let cift = 0;
      [o.cati].concat(o.bolgeler, o.zemin).forEach(a => {
        const yatan = a.sakin.map(s => A.kareAl(s, 1000 + (s.faz || 0))).filter(q => q && q.kisi && q.poz === 'yat');
        yatan.forEach((q, i) => {
          const yuz = [];
          A.kisiSatir(q.poz, q.i, q.kisi, A.ruhu(q.kisi, 'gece')).forEach((r, yy) => r.forEach((c, xx) => { if(c === 'e' || c === 'n') yuz.push([q.x + xx, q.y + yy]); }));
          yatan.slice(i + 1).forEach(u => {
            const f = A.POZ[u.poz].k[u.i];
            cift++;
            yuz.forEach(d => { const c = f[d[1] - u.y] && f[d[1] - u.y][d[0] - u.x]; expect(!c || c === '.').toBe(true); });
          });
        });
      });
      expect(cift > 0).toBe(true);
    });
    it('kart çekilir ve geri gelir; süs veri okumaz', () => {
      const P = window.LIFEOS.PIKSEL, k = document.documentElement, once = k.getAttribute('data-zemin');
      k.setAttribute('data-zemin', 'piksel');
      try{
        P.bosAc(true);
        expect(k.getAttribute('data-bos')).toBe('1');
        P.bosKapa();
        expect(k.getAttribute('data-bos')).toBe('don');
        k.removeAttribute('data-bos');
        const kaynak = String(window.LIFEOS.PIKSEL_APARTMAN.yerlesim);
        expect(/localStorage|LIFEOS\.|HESAP/.test(kaynak)).toBe(false);
      }finally{ if(once) k.setAttribute('data-zemin', once); else k.removeAttribute('data-zemin'); k.removeAttribute('data-bos'); }
    });
  });
})();
