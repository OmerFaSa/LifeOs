/* ESP Kütüphanem › Anlatımlar ve Çalışma bölümlerindeki alan kartı. Her alanın
   en az bir anlatımı vardır; içerik biçim denetiminden geçer; seviye ya da
   yetenek yargısı ve sonuç garantisi cümlesi yoktur (ESP.PEDAGOGIC). */
(function(){
  const { describe, it, expect } = ESP.Test;
  describe('ESP Anlatımlar', () => {
    it('her alanın en az bir anlatımı var; biçim denetimi temiz', () => {
      expect(window.LIFEOS.REHBER.denetle(ESP.REHBER_KONULAR)).toEqual([]);
      ['lang', 'philo', 'music', 'diction', 'reading', 'writing', 'history']
        .forEach(d => expect(ESP.REHBER_KONULAR.some(k => k.disc === d)).toBe(true));
    });
    it('Çalışma bölümünün kartı yalnız o alanın konularını gösterir', () => {
      window.LIFEOS.REHBER._sifirla();
      const dil = ESP.Screens.rehber.alanKarti('lang');
      expect(dil).toContain('Dil öğrenmenin işleyişi');
      expect(dil.indexOf('Argüman') < 0).toBe(true);
      const ses = ESP.Screens.rehber.alanKarti(['music', 'diction']);
      expect(ses).toContain('Akorlar ve ritim');
      expect(ses).toContain('Boğumlama, vurgu ve tonlama');
      window.LIFEOS.REHBER._sifirla();
    });
    it('yetenek yargısı ya da sonuç garantisi yok', () => {
      const metin = JSON.stringify(ESP.REHBER_KONULAR);
      expect(/yeteneklisin|yeteneksizsin|kesin(likle)? (öğrenirsin|başarırsın)|garanti(li)? (sonuç|öğren)/i.test(metin)).toBe(false);
    });
  });
})();
