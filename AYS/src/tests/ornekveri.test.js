/* 172 Örnek veri kipi — modül tarafı. Doldurucu tekrar açılışta kaydı
   ikilemez ve örnek profilde yapılan değişikliği ezmez; örnek profilde
   HKM işareti kapalıdır (hiçbir kanaldan veri gitmez); Ayarlar › Veri'de
   giriş satırı vardır. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };

  describe('172 Örnek veri — AYS', () => {
    it('oz-172 doldurucu ikilemez, değişikliği ezmez', () => {
      resetState();
      R.OrnekVeri.doldur();
      const a = R.S.exams.length, b = R.S.cards.length;
      expect(a > 0 && b > 0).toBe(true);
      R.S.exams[0].ornekDegisti = true;
      R.OrnekVeri.doldur();
      expect(R.S.exams.length).toBe(a);
      expect(R.S.cards.length).toBe(b);
      expect(R.S.exams[0].ornekDegisti).toBe(true);
    });

    it('oz-172 örnek profilde HKM işareti kapalı', () => {
      let once = null;
      try{ once = localStorage.getItem('rota.activeProfile'); }catch(e){}
      try{
        localStorage.setItem('rota.activeProfile', 'ornek');
        const s = R.Beacon.settings();
        expect(s.enabled).toBe(false);
        expect(s.ornek).toBe(true);
      }finally{
        if(once === null) localStorage.removeItem('rota.activeProfile'); else localStorage.setItem('rota.activeProfile', once);
      }
    });

    it('oz-172 örnek profil HKM bağını alamaz (çıkışta gerçek profilin bağı kopmasın)', async () => {
      /* Canlı denemede bulundu: örnek kipte eşleşme yapılsaydı cihazdaki bağ
         «ornek»e geçerdi; çıkınca gerçek profil HKM'ye bağlanamazdı. */
      const M_ = 'ays';
      const eskiP = localStorage.getItem('rota.activeProfile'), eskiB = window.LIFEOS.HkmBag.sahip(M_);
      try{
        window.LIFEOS.HkmBag.birak(M_, eskiB || 'x');
        localStorage.setItem('rota.activeProfile', 'ornek');
        await R.Beacon.save({ enabled:true, token:'t', url:'http://127.0.0.1:4200' });
        expect(window.LIFEOS.HkmBag.sahip(M_)).toBe(null);
        expect(R.Beacon.settings().enabled).toBe(false);
      }finally{
        if(eskiP === null) localStorage.removeItem('rota.activeProfile'); else localStorage.setItem('rota.activeProfile', eskiP);
        window.LIFEOS.HkmBag.birak(M_, 'ornek');
        if(eskiB) window.LIFEOS.HkmBag.al(M_, eskiB);
        await R.Beacon.save({ enabled:false });
      }
    });

    it('oz-172 Ayarlar › Veri\'de «Örnek veriye geç» satırı', async () => {
      resetState();
      const k = dom(await R.Screens.guide.render());
      const s = k.querySelector('[data-oz="172"] [data-act="ornek-gir"]');
      expect(s).toBeTruthy();
      expect(s.textContent).toBe('Örnek veriye geç');
    });
  });
})();
