/* SPİ Öğren › Konular (data/rehber.js + screens/rehber.js). İçerik biçim
   denetiminden geçer; liste ve konu çizilir; sınır notu her sayfadadır;
   kişiye özel doz ya da teşhis cümlesi yoktur. */
(function(){
  const { describe, it, expect } = SP.Test;
  describe('SPİ Öğren — anlatımlar', () => {
    it('içerik biçim denetiminden geçer; istenen konular var', () => {
      expect(window.LIFEOS.REHBER.denetle(SP.REHBER_KONULAR)).toEqual([]);
      ['spor-temel', 'yuruyus', 'kosu', 'kalistenik', 'kalori', 'kilo-verme', 'diyet', 'beslenme-temel']
        .forEach(id => expect(!!SP.REHBER_KONULAR.find(k => k.id === id)).toBe(true));
    });
    it('liste ve konu çizilir; sınır notu konunun sonunda', () => {
      const RB = window.LIFEOS.REHBER;
      RB._sifirla();
      let h = SP.Screens.rehber.render();
      expect(h).toContain('rehber__liste');
      expect(h).toContain('Kalistenik');
      RB.sec('kalori');
      h = SP.Screens.rehber.render();
      expect(h).toContain('Kalori ve enerji dengesi');
      expect(h).toContain('teşhis, tedavi ya da kişisel program değildir');
      RB._sifirla();
    });
    it('anlatımda kişiye özel buyruk yok («sen şu kadar ye/al» kalıpları)', () => {
      const metin = JSON.stringify(SP.REHBER_KONULAR);
      expect(/(günde|her gün)\s+\d+\s*(kcal|kalori)\s+(ye|al|tüket)\b/i.test(metin)).toBe(false);
      expect(/\b(mg|mcg|IU)\b[^"]{0,20}\b(al|kullan|iç)\b/i.test(metin.replace(/200 mg kafein alan/g, ''))).toBe(false);
    });
  });
})();
