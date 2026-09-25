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


  /* D · SPİ kartları ekranda (vitrin sürüm 4, brand/ortak/vitrin.js). */
  describe('Vitrin · D kartları SPİ ekranlarında', () => {
    const gun = n => SP.U.iso(SP.U.addDays(SP.U.parse('2026-10-12'), n));
    if(!document.getElementById('toast-root')){
      const t = document.createElement('div'); t.id = 'toast-root'; t.hidden = true; document.body.appendChild(t);
    }
    async function cizmeden(fn){
      const A = SP.App, r = A.render; A.render = async () => {};
      try{ await fn(); } finally { A.render = r; }
    }

    it('oz-068 oz-069 oz-070 oz-088 Bugün › Durum: halka, uyku bandı, kilo eğrisi, tartı hatırlatıcısı', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        for(let i = -6; i <= 0; i++) pushVitals(gun(i), { sleep:7, weight:71 + (i % 2) * 0.4 });
        const k = dom(await SP.Screens.today.render());
        expect(k.querySelector('[data-oz="068"] text')).toBeTruthy();
        expect(k.querySelector('[data-oz="069"] .bn i')).toBeTruthy();
        expect(k.querySelectorAll('[data-oz="070"] circle').length).toBe(7);
        expect(k.querySelector('[data-oz="088"]').textContent).toContain('kurulmadı');
      });
    });

    it('oz-073 su tek dokunuşla eklenir ve geri alınır; girilmemiş gün sıfır yazmaz', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        let k = dom(await SP.Screens.today.render());
        expect(k.querySelector('[data-oz="073"]').textContent).toContain('Girilmedi');
        await cizmeden(() => SP.Screens.today.handle['su-ekle']());
        expect(SP.S.vitals['2026-10-12'].water).toBe(250);
        k = dom(await SP.Screens.today.render());
        expect(k.querySelectorAll('[data-oz="073"] path[fill="var(--spi)"]').length).toBe(1);
      });
    });

    it('oz-074 günün hissi beş noktalı ölçekle, beyan', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        pushVitals('2026-10-12', { soreness:4 });
        const k = dom(await SP.Screens.today.render());
        expect(k.querySelector('[data-oz="074"] .on').textContent).toBe('4');
      });
    });

    it('oz-077 Ayrıntı › Giriş: tartı tuş takımı dünkü değeri ipucu olarak yazar', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        pushVitals(gun(-1), { weight:71.2 });
        const k = dom(await SP.Screens.gun.render());
        expect(k.querySelector('[data-oz="077"]').textContent).toContain('dün 71,2');
      });
    });

    it('oz-071 oz-078 oz-084 Testler: referans bandı, sonraki kontrol, yan yana karşılaştırma', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        const b = SP.BIOMARKERS.find(x => x.panel !== 'vital' && x.panel !== 'body' && Array.isArray(x.ref));
        SP.S.labs = [{ id:'l1', date:gun(-200), values:{ [b.id]:{ v:b.ref[0] - 1, cert:'measured' } }, fasting:'unknown', source:'manual' },
          { id:'l2', date:gun(-20), values:{ [b.id]:{ v:(b.ref[0] + b.ref[1]) / 2, cert:'measured' } }, fasting:'unknown', source:'manual' }];
        const k = dom(await SP.Screens.labs.render());
        expect(k.querySelector('[data-oz="071"] .nk')).toBeTruthy();
        expect(k.querySelector('[data-oz="078"]').textContent).toContain('yorumlamaz');
        expect(k.querySelector('[data-oz="084"] .ds2')).toBeTruthy();
      });
    });

    it('oz-072 oz-080 oz-085 Öğünler: tabak, çizelge ve sık öğün şablonu', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        const f = Object.keys(SP.FOOD_BY_ID)[0];
        [gun(-3), gun(-2)].forEach(d => SP.Test.pushMeal(d, 'ogle', [[f, 150]]));
        const m = SP.Test.pushMeal('2026-10-12', 'kahvalti', [[f, 100]]);
        m.at = '2026-10-12T08:15:00';
        const k = dom(await SP.Screens.meals.render());
        expect(k.querySelector('[data-oz="085"] [data-act="sablon-ekle"]')).toBeTruthy();
        expect(k.querySelector('[data-oz="080"] .og')).toBeTruthy();
        if(SP.Nutri.targets().ok) expect(k.querySelector('[data-oz="072"] .tb b')).toBeTruthy();
      });
    });

    /* HATA (V5-8'de görüldü): öğün kartının simgesi boyutsuz SVG'ydi ve
       raf düzeninde kartın genişliğine büyüyordu (dev güneş). */
    it('öğün kartının simgesi satır boyunda kalır', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        SP.Test.pushMeal('2026-10-12', 'kahvalti', [[Object.keys(SP.FOOD_BY_ID)[0], 100]]);
        const k = document.createElement('div');
        k.style.cssText = 'position:absolute;left:-9999px;top:0;width:900px';
        k.innerHTML = String(await SP.Screens.meals.render());
        document.body.appendChild(k);
        try{
          const svg = k.querySelector('.mealcard__head svg');
          expect(svg.getBoundingClientRect().width <= 24).toBeTruthy();
        } finally { k.remove(); }
      });
    });

    it('oz-075 oz-076 oz-086 Hareket: set kutucuğu dolar; kaydı olmayan gün veri yok', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        const w = SP.Model.newWorkout('2026-10-12', SP.SESSION_TEMPLATES[0].id);
        SP.S.workouts = [w];
        let k = dom(await SP.Screens.move.render());
        expect(k.querySelectorAll('[data-oz="075"] .st button').length).toBeGreaterThan(0);
        expect(k.querySelectorAll('[data-oz="076"] .hl').length).toBe(7);
        expect(k.querySelector('[data-oz="086"] i.d')).toBeTruthy();
        await cizmeden(() => SP.Screens.move.handle['set-bitti']({ dataset:{ w:w.id, i:'0', set:'1' } }));
        expect(w.items[0].setsDone).toBe(1);
      });
    });

    it('oz-079 Sepet: harcama şeritleri yalnız aylık sınır varsa', async () => {
      await withTodayAsync('2026-10-12', async () => {
        resetState();
        SP.S.basket = Object.assign(SP.Model.defaultBasket(), { monthlyLimit:null });
        expect(dom(await SP.Screens.basket.render()).querySelector('[data-oz="079"]')).toBeNull();
        SP.S.basket.monthlyLimit = 3000;
        expect(dom(await SP.Screens.basket.render()).querySelector('[data-oz="079"] .r')).toBeTruthy();
      });
    });
  });

})();
