/* İlk kurulum (core/setup.js, borç 16). Kurulum bir kez görülür ama yanlış
   kurulum bütün veriyi eğriltir; kapsam %0'dı. Kanıtladığı sözler: ad yoksa
   sihirbaz gerekir; seçim kartları GERÇEK düğme olarak çizilir (html
   şablonunun kaçırdığı ham etiket değil); ad olmadan kaydedilmez; seçim
   kaydedilene kadar geçicidir ve atlanınca düşer; varsayılanlar doğru yazılır. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const St = () => ESP.Setup;

  /* Test sayfasında kabuk yok: çizim susturulur, bildirim kökü geçici kurulur. */
  async function sessiz(fn){
    const eski = ESP.App;
    ESP.App = Object.assign({}, eski || {}, { render:function(){} });
    let kok = document.getElementById('toast-root');
    const yeni = !kok;
    if(yeni){ kok = document.createElement('div'); kok.id = 'toast-root'; document.body.appendChild(kok); }
    try{ return await fn(); }finally{
      ESP.App = eski; ESP.UI.closeSheet();
      if(yeni) kok.remove();
    }
  }
  function yaz(id, v){ const el = document.getElementById(id); if(el) el.value = v; return !!el; }

  describe('İlk kurulum', () => {
    it('ad yoksa gerekir; açılınca form ve seçim kartları gerçek düğmedir', async () => {
      resetState();
      ESP.S.profile = Object.assign({}, ESP.S.profile, { name:'' });
      expect(St().needed()).toBe(true);
      await sessiz(async () => {
        St().open();
        const sheet = document.getElementById('sheet');
        expect(!!sheet).toBe(true);
        expect(!!document.getElementById('su-name')).toBe(true);
        expect(sheet.textContent.indexOf('<button') >= 0).toBe(false);   /* kaçırılmış ham etiket yok */
        expect(sheet.querySelectorAll('button').length > 3).toBe(true);
      });
    });

    it('ad olmadan kaydedilmez; adla varsayılanlar yazılır; seçim geçicidir', async () => {
      resetState();
      ESP.S.profile = Object.assign({}, ESP.S.profile, { name:'' });
      await sessiz(async () => {
        St().open();
        expect(await St().save()).toBe(false);
        expect(ESP.S.profile.name).toBe('');
        const once = ESP.Mod.activeIds().slice();
        St().pick(once[0]);
        expect(St().picked().indexOf(once[0])).toBe(-1);
        St().skip();
        expect(St().picked()).toBe(null);                              /* atlanınca seçim düşer */
        St().open();
        yaz('su-name', 'Ömer');
        expect(await St().save()).toBe(true);
      });
      const p = ESP.S.profile;
      expect([p.name, p.focus, p.langs[0], p.dailyMinutes]).toEqual(['Ömer', 'balanced', 'en', 60]);
      expect(St().needed()).toBe(false);
    });
  });
})();
