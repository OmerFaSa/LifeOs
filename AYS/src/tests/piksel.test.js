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
    it('oda içerik sütununa oturur, ekrandan taşmaz', () => {
      const o = window.LIFEOS.PIKSEL.yerlesim(98, 2);
      expect(o.dx + o.dw <= 98).toBe(true);
      expect(o.yer < o.rh).toBe(true);
    });
  });
})();
