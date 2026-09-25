/* 112 Çakışma kartı — SPI ekranında (dilim düzeyi). Veri hedef ağının HKM
   bütçesinden (Hedefler.ag.butce().cakismalar); yoksa kart yok. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };
  const CAK = { cakismalar:[{ a:{ modul:'ays', ad:'TYT paragraf', dilim:'aksam', gunluk_dk:60 },
    b:{ modul:'spi', ad:'Koşu', dilim:'aksam', gunluk_dk:45 } }] };

  describe('112 Çakışma — SPI', () => {
    it('oz-112 aynı dilimde iki modül varsa kart; bütçe yoksa yok', async () => {
      resetState();
      SP.S.profile.setupDone = true;
      const eski = SP.Hedefler.ag;
      try{
        SP.Hedefler.ag = { butce:() => CAK };
        expect(dom(await SP.Screens.today.render()).querySelectorAll('[data-oz="112"]').length).toBe(1);
        SP.Hedefler.ag = { butce:() => null };
        expect(dom(await SP.Screens.today.render()).querySelector('[data-oz="112"]')).toBe(null);
      }finally{ SP.Hedefler.ag = eski; }
    });
  });
})();
