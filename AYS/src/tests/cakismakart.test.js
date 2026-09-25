/* 112 Çakışma kartı — AYS ekranında (dilim düzeyi). Veri hedef ağının HKM
   bütçesinden (Hedefler.ag.butce().cakismalar); yoksa kart yok. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };
  const CAK = { cakismalar:[{ a:{ modul:'ays', ad:'TYT paragraf', dilim:'aksam', gunluk_dk:60 },
    b:{ modul:'spi', ad:'Koşu', dilim:'aksam', gunluk_dk:45 } }] };

  describe('112 Çakışma — AYS', () => {
    it('oz-112 aynı dilimde iki modül varsa kart; bütçe yoksa yok', async () => {
      resetState();
      R.S.profile.setupDone = true;
      const eski = R.Hedefler.ag;
      try{
        R.Hedefler.ag = { butce:() => CAK };
        expect(dom(await R.Screens.week.render()).querySelectorAll('[data-oz="112"]').length).toBe(1);
        R.Hedefler.ag = { butce:() => null };
        expect(dom(await R.Screens.week.render()).querySelector('[data-oz="112"]')).toBe(null);
      }finally{ R.Hedefler.ag = eski; }
    });
  });
})();
