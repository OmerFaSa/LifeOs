/* 172 Örnek veri kipi — modül tarafı. Doldurucu tekrar açılışta kaydı
   ikilemez ve örnek profilde yapılan değişikliği ezmez; örnek profilde
   HKM işareti kapalıdır (hiçbir kanaldan veri gitmez); Ayarlar › Veri'de
   giriş satırı vardır. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };

  describe('172 Örnek veri — SPI', () => {
    it('oz-172 doldurucu ikilemez, değişikliği ezmez', () => {
      resetState();
      SP.S.profile.name = '';
      SP.OrnekVeri.doldur();
      const a = SP.S.labs.length, b = SP.S.workouts.length;
      expect(a > 0 && b > 0).toBe(true);
      expect(SP.Setup.needed()).toBe(false);
      SP.S.labs[0].ornekDegisti = true;
      SP.OrnekVeri.doldur();
      expect(SP.S.labs.length).toBe(a);
      expect(SP.S.workouts.length).toBe(b);
      expect(SP.S.labs[0].ornekDegisti).toBe(true);
    });

    it('oz-172 örnek profilde HKM işareti kapalı', () => {
      let once = null;
      try{ once = localStorage.getItem('spi.activeProfile'); }catch(e){}
      try{
        localStorage.setItem('spi.activeProfile', 'ornek');
        const s = SP.Beacon.settings();
        expect(s.enabled).toBe(false);
        expect(s.ornek).toBe(true);
      }finally{
        if(once === null) localStorage.removeItem('spi.activeProfile'); else localStorage.setItem('spi.activeProfile', once);
      }
    });

    it('oz-172 Ayarlar › Veri\'de «Örnek veriye geç» satırı', async () => {
      resetState();
      /* Test deposunda health() yok; Veri bölümü onu ister (gerçek depoda var). */
      const eski = SP.Store.health;
      if(typeof eski !== 'function') SP.Store.health = () => ({ local:'ok', cloud:'off', lastError:null, pendingCloudWrites:0 });
      let k;
      try{ k = dom(await SP.Screens.guide.render()); }
      finally{ if(typeof eski !== 'function') delete SP.Store.health; }
      const s = k.querySelector('[data-oz="172"] [data-act="ornek-gir"]');
      expect(s).toBeTruthy();
      expect(s.textContent).toBe('Örnek veriye geç');
    });
  });
})();
