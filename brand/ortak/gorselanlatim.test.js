/* Anlatım: grafik, tablo, görsel işaretleri (brand/ortak/anlatim.js). Tek kaynak; --yay ile kopyalanır. */
(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const A = () => window.LIFEOS.ANLATIM;
  describe('Anlatım — görsel öğrenme', () => {
    it('ifade güvenli ayrıştırılır: sayı, x, işlemler, fonksiyonlar; kod reddedilir', () => {
      expect(A().ifadeCoz('x^2-4')(2)).toBe(0);
      expect(A().ifadeCoz('2x²+1')(3)).toBe(19);
      expect(Math.round(A().ifadeCoz('sin x')(Math.PI / 2) * 100)).toBe(100);
      expect(A().ifadeCoz('√x')(9)).toBe(3);
      expect(A().ifadeCoz('alert(1)')).toBe(null);
      expect(A().ifadeCoz('x;process.exit()')).toBe(null);
      expect(A().ifadeCoz('window.x')).toBe(null);
    });
    it('işaretler ve markdown tablo ayrıştırılır; metinden çıkarılır; «f(x) = …» kendiliğinden grafik olur', () => {
      const z = A().zenginlestir('Bak: [[grafik: sin(x); -6..6]] ve [[görsel: fotosentez]]\n| | Türev | İntegral |\n|---|---|---|\n| Anlamı | eğim | alan |');
      expect(z.ekler.map(e => e.tur).sort()).toEqual(['gorsel', 'grafik', 'tablo']);
      expect(z.metin.indexOf('[[')).toBe(-1);
      expect(z.ekler.find(e => e.tur === 'tablo').satirlar[0]).toEqual(['Anlamı', 'eğim', 'alan']);
      expect(A().zenginlestir('Parabol: f(x) = x² - 4 olsun.').ekler[0].tur).toBe('grafik');
      expect(A().zenginlestir('Bugün 40 soru çözdün.').ekler.length).toBe(0);
    });
    it('grafik SVG çizer; çizilemeyen ifade boş döner', () => {
      expect(A().grafikSvg('x^2-4', -5, 5)).toContain('<path d="M');
      expect(A().grafikSvg('alert(1)', -5, 5)).toBe('');
    });
  });
})();
