/* İlk kurulum (core/setup.js, borç 16). Kanıtladığı sözler: beş alandan biri
   eksikse sihirbaz gerekir ve kaydedilmez (hangisinin eksik olduğu söylenir);
   tamamsa profil ve BUGÜNÜN kilosu ölçüm olarak yazılır. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const St = () => SP.Setup;

  /* Test sayfasında kabuk yok: çizim susturulur, bildirim kökü geçici kurulur. */
  async function sessiz(fn){
    const eski = SP.App;
    SP.App = Object.assign({}, eski || {}, { render:function(){} });
    let kok = document.getElementById('toast-root');
    const yeni = !kok;
    if(yeni){ kok = document.createElement('div'); kok.id = 'toast-root'; document.body.appendChild(kok); }
    try{ return await fn(); }finally{
      SP.App = eski; SP.UI.closeSheet();
      if(yeni) kok.remove();
    }
  }
  function yaz(id, v){ const el = document.getElementById(id); if(el) el.value = v; return !!el; }

  describe('İlk kurulum', () => {
    it('eksik alan varken kaydedilmez; tamamsa profil ve bugünün kilosu yazılır', async () => {
      resetState();
      SP.S.profile = Object.assign({}, SP.S.profile, { name:'', birthYear:null, heightCm:null, weightKg:null });
      expect(St().needed()).toBe(true);
      await sessiz(async () => {
        St().open();
        expect(['su-name', 'su-birth', 'su-height', 'su-weight'].every(id => !!document.getElementById(id))).toBe(true);
        yaz('su-name', 'Ömer');
        expect(await St().save()).toBe(false);
        expect(SP.S.profile.name).toBe('');
        yaz('su-birth', '2008'); yaz('su-height', '178'); yaz('su-weight', '72.5');
        expect(await St().save()).toBe(true);
      });
      const p = SP.S.profile;
      expect([p.name, p.birthYear, p.heightCm, p.weightKg, p.sex, p.activity, p.goal])
        .toEqual(['Ömer', 2008, 178, 72.5, 'male', 'moderate', 'health']);
      expect(SP.S.vitals[SP.U.todayISO()].weight).toBe(72.5);
      expect(St().needed()).toBe(false);
    });
  });
})();
