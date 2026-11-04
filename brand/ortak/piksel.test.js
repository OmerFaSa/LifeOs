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
    it('oda içerik sütununa oturur, ekrandan taşmaz', () => {
      const o = window.LIFEOS.PIKSEL.yerlesim(98, 2);
      expect(o.dx + o.dw <= 98).toBe(true);
      expect(o.yer < o.rh).toBe(true);
    });
  });
})();
