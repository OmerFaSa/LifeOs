/* VİTRİN KARTLARI EKRANDA — SPİ Analiz başı (041 027 031 032 034 036 037).
   Eksik gün çizgide boşluktur; hedef bandı yalnız profilde hedef varsa. */
(function(){
  const { describe, it, expect, resetState, withTodayAsync, pushVitals } = SP.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };

  describe('Vitrin · SPİ Analiz', () => {
    it('oz-041 oz-027 oz-034 oz-036 oz-037 veri yokken de kartlar çizilir ve «veri yok» der', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        const k = dom(await SP.Screens.analytics.render());
        ['041', '027', '034', '036', '037'].forEach(n => expect(k.querySelector('[data-oz~="' + n + '"]')).toBeTruthy());
        expect(k.querySelector('[data-oz="034"]').textContent).toContain('veri yok');
      });
    });

    it('oz-031 oz-032 hedef bandı yalnız hedef yazılıysa; geçen dönem gölgesi önceki 28 günden', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        for(let i = 1; i <= 50; i += 2) pushVitals(SP.U.iso(SP.U.addDays(SP.U.parse('2026-10-12'), -i)), { sleep:6 + (i % 3) });
        let k = dom(await SP.Screens.analytics.render());
        expect(k.querySelector('[data-oz~="031"]')).toBeNull();
        expect(k.querySelector('details [data-oz~="032"]')).toBeTruthy();
        SP.S.profile.sleepGoal = 8;
        k = dom(await SP.Screens.analytics.render());
        expect(k.querySelector('[data-oz~="031"]')).toBeTruthy();
      });
    });
  });
  describe('Vitrin · SPİ tür ayarı', () => {
    it('oz-116 tür ayarı moddan önce gelir; ölçüm yazan tür hiçbir ayarda sormadan yazılmaz', async () => {
      resetState();
      const ids = SP.Proposals.katalogIdleri();
      const kucuk = ids.find(id => (SP.Proposals.eylem(id) || {}).level === 'kucuk' && !(SP.Proposals.eylem(id) || {}).olcum);
      const olcum = ids.find(id => (SP.Proposals.eylem(id) || {}).olcum);
      if(kucuk){
        await SP.Office.saveSettings({ otomatikTurler:{ [kucuk]:true } });
        expect(SP.Proposals.otomatikMi({ level:'kucuk', action:kucuk, source:'kural' }, 'hicbiri')).toBe(true);
      }
      if(olcum){
        await SP.Office.saveSettings({ otomatikTurler:{ [olcum]:true } });
        expect(SP.Proposals.otomatikMi({ level:'kucuk', action:olcum, source:'istek' }, 'hepsi')).toBe(false);
      }
      await SP.Office.saveSettings({ otomatikTurler:{} });
    });
  });
  describe('Vitrin · SPİ güven, şüphe, tazelik', () => {
    /* Sayının yaşı gerçek saatle hesaplanır (sayi.js yas): tarih bugüne göre kurulur. */
    it('oz-015 oz-026 Bugün «Son ölçümler» eski ölçümün yaşını yazar; ölçülmemiş «—»', async () => {
      resetState();
      pushVitals(SP.U.iso(SP.U.addDays(SP.U.parse(SP.U.todayISO()), -12)), { weight:71.4 });
      const k = dom(await SP.Screens.today.render());
      const kutu = Array.from(k.querySelectorAll('.kutu')).find(x => (x.querySelector('.kutu__ad') || {}).textContent === 'Son ölçümler');
      expect(kutu).toBeTruthy();
      expect(kutu.querySelector('[data-oz~="026"]')).toBeTruthy();
      expect(kutu.textContent).toContain('—');
    });

    it('oz-018 tartıda 714 yazılınca kaydetmeden sorar; seçilen değer kaydedilir', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        pushVitals('2026-10-11', { weight:71.2 });
        const kap = document.createElement('div');
        kap.innerHTML = String(await SP.Screens.today.render());
        document.body.appendChild(kap);
        const ciz = SP.App.render, bil = SP.UI.toast;
        try{
          SP.App.render = () => {}; SP.UI.toast = () => {};
          document.getElementById('v-weight').value = '714';
          await SP.Screens.today.handle['save-vitals']();
          expect(kap.querySelector('#suphe-yuva [data-oz="018"]')).toBeTruthy();
          expect((SP.Model.vitalsOf('2026-10-12') || {}).weight == null).toBeTruthy();
          await SP.Screens.today.handle['suphe-kaydet']({ dataset:{ deger:'71.4' } });
          expect(SP.Model.vitalsOf('2026-10-12').weight).toBe(71.4);
        }finally{ SP.App.render = ciz; SP.UI.toast = bil; kap.remove(); }
      });
    });

    it('oz-173 veri kartı yedek durumunu gösterir; oz-177 «Bütün veriyi sil» kapıyı açar', async () => {
      resetState();
      /* Sahte depoda `health` yok; Veri bölümü onu soran kartla birlikte çizilir. */
      const saglik = SP.Store.health;
      if(typeof saglik !== 'function') SP.Store.health = () => ({ mode:'local', local:'ok', cloud:'off' });
      let k;
      try{ k = dom(await SP.Screens.guide.render()); }
      finally{ if(typeof saglik !== 'function') delete SP.Store.health; }
      expect(k.querySelector('[data-oz="173"]')).toBeTruthy();
      const sheet = SP.UI.sheet;
      let govde = '';
      try{ SP.UI.sheet = o => { govde = o.body; }; await SP.Screens.guide.handle.wipe(); }
      finally{ SP.UI.sheet = sheet; }
      expect(govde).toContain('data-oz="177"');
    });
  });

})();
