/* 172 Örnek veri kipi — modül tarafı. Doldurucu tekrar açılışta kaydı
   ikilemez ve örnek profilde yapılan değişikliği ezmez; örnek profilde
   HKM işareti kapalıdır (hiçbir kanaldan veri gitmez); Ayarlar › Veri'de
   giriş satırı vardır. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };

  describe('172 Örnek veri — ESP', () => {
    it('oz-172 doldurucu ikilemez, değişikliği ezmez', () => {
      resetState();
      ESP.S.profile.name = '';
      ESP.OrnekVeri.doldur();
      const a = ESP.S.cards.length, b = ESP.S.books.length;
      expect(a > 0 && b > 0).toBe(true);
      expect(ESP.Setup.needed()).toBe(false);
      ESP.S.cards[0].ornekDegisti = true;
      ESP.OrnekVeri.doldur();
      expect(ESP.S.cards.length).toBe(a);
      expect(ESP.S.books.length).toBe(b);
      expect(ESP.S.cards[0].ornekDegisti).toBe(true);
    });

    it('oz-172 örnek profilde HKM işareti kapalı', () => {
      let once = null;
      try{ once = localStorage.getItem('esp.activeProfile'); }catch(e){}
      try{
        localStorage.setItem('esp.activeProfile', 'ornek');
        const s = ESP.Beacon.settings();
        expect(s.enabled).toBe(false);
        expect(s.ornek).toBe(true);
      }finally{
        if(once === null) localStorage.removeItem('esp.activeProfile'); else localStorage.setItem('esp.activeProfile', once);
      }
    });

    it('oz-172 Ayarlar › Veri\'de «Örnek veriye geç» satırı', async () => {
      resetState();
      const k = dom(await ESP.Screens.guide.render());
      const s = k.querySelector('[data-oz="172"] [data-act="ornek-gir"]');
      expect(s).toBeTruthy();
      expect(s.textContent).toBe('Örnek veriye geç');
    });
  });
})();
