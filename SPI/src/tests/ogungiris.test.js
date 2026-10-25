/* Öğün girişi — az sürtünme (2026-10-25).

   Sınanan sözler: her ekleme ve silme «Geri al» taşır (öğün silinirse
   fotoğrafı da geri gelir); tanınmayan parça alanda kalır ve adıyla
   söylenir; öğün girilmemiş gün «0» değil «veri yok»tur; hazır ve sık
   öğünler seçili öğüne yazılır; öneri çipleri kişiseldir ve sayı
   uydurulmaz; «Dünün aynısı» hazır öğünler kutusunda; porsiyon çarpanı;
   Mutfak'ta «Payımı öğüne ekle». */

(function(){
  const { describe, it, expect, resetState, pushMeal } = SP.Test;
  const E = () => SP.Screens.meals;
  const MK = () => SP.Screens.kitchen;
  const gun = n => SP.U.iso(SP.U.addDays(SP.U.today(), n));

  /* Çizim ve bildirim susar; bildirimler (metin + seçenek) toplanır ki
     «Geri al» elle çağrılabilsin. */
  async function sessiz(fn){
    const eskiApp = SP.App, eskiToast = SP.UI.toast, t = [];
    SP.App = Object.assign({}, eskiApp || {}, { render:function(){} });
    SP.UI.toast = (metin, secenek) => { t.push({ metin, secenek:secenek || {} }); };
    try{ await fn(t); }
    finally{ SP.App = eskiApp; SP.UI.toast = eskiToast; SP.UI.closeSheet(); }
    return t;
  }
  function alanla(deger, fn){
    const el = document.createElement('input');
    el.id = 'meal-text'; el.value = deger;
    document.body.appendChild(el);
    return Promise.resolve(fn(el)).finally(() => el.remove());
  }
  const bugun = () => SP.Model.mealsOf(SP.U.todayISO());
  const kalemler = () => bugun().reduce((a, m) => a.concat(m.items || []), []);

  describe('Öğün girişi — geri al', () => {
    it('metinden ekleme geri alınır; yazılan metin alana döner', async () => {
      resetState();
      await sessiz(async t => {
        await alanla('1 kase mercimek çorbası', async () => {
          await E().handle['add-meal']();
          expect(kalemler().length).toBe(1);
          expect(typeof t[0].secenek.undo).toBe('function');
          await t[0].secenek.undo();
          expect(bugun().length).toBe(0);
          expect(SP.S.ui.mealDraftText).toBe('1 kase mercimek çorbası');
        });
      });
    });

    it('var olan öğüne eklenen porsiyon geri alınınca yalnız o kalem çıkar', async () => {
      resetState();
      const m = pushMeal(SP.U.todayISO(), 'kahvalti', [['yumurta', 110]]);
      await sessiz(async t => {
        await E().handle['add-portion']({ dataset:{ id:'muz', g:'120', label:'1 adet' } });
        expect(kalemler().length).toBe(2);
        await t[0].secenek.undo();
        expect(bugun().length).toBe(1);
        expect(bugun()[0].id).toBe(m.id);
        expect(kalemler().map(x => x.foodId)).toEqual(['yumurta']);
      });
    });

    it('çip, gram ve fotoğraftan ekleme de «Geri al» taşır', async () => {
      resetState();
      await sessiz(async t => {
        await E().handle['quick-add-food']({ dataset:{ id:'muz', g:'120', label:'1 adet' } });
        const g = document.createElement('input'); g.id = 'portion-g'; g.value = '150';
        document.body.appendChild(g);
        try{ await E().handle['add-grams']({ dataset:{ id:'yulaf' } }); } finally{ g.remove(); }
        expect(kalemler().length).toBe(2);
        expect(kalemler()[1].cert).toBe('measured');
        const eski = SP.Extract.fromMealPhoto;
        SP.Extract.fromMealPhoto = async () => ({ items:[{ foodId:'yumurta', g:110 }], unmatched:[], note:'okundu' });
        try{
          E().fotoKoy(new File([new Uint8Array([1, 2, 3])], 'a.jpg', { type:'image/jpeg' }));
          await E().handle['run-photo']();
          await E().handle['save-photo']();
        }finally{ SP.Extract.fromMealPhoto = eski; }
        expect(kalemler().length).toBe(3);
        const geriAl = t.filter(x => typeof x.secenek.undo === 'function');
        expect(geriAl.length).toBe(3);
        for(let i = geriAl.length - 1; i >= 0; i--) await geriAl[i].secenek.undo();
        expect(bugun().length).toBe(0);
      });
    });

    it('kalem çıkarma geri alınınca aynı yerine döner', async () => {
      resetState();
      const m = pushMeal(SP.U.todayISO(), 'ogle', [['tavuk-gogsu', 150], ['bulgur-pilavi', 200], ['ayran', 200]]);
      await sessiz(async t => {
        await E().handle['del-item']({ dataset:{ id:m.id, i:'1' } });
        expect(kalemler().map(x => x.foodId)).toEqual(['tavuk-gogsu', 'ayran']);
        await t[0].secenek.undo();
        expect(kalemler().map(x => x.foodId)).toEqual(['tavuk-gogsu', 'bulgur-pilavi', 'ayran']);
      });
    });

    it('öğün silme geri alınır; fotoğrafı da yerine konur', async () => {
      resetState();
      const m = pushMeal(SP.U.todayISO(), 'aksam', [['somon', 150]]);
      const eski = SP.Foto, kayit = [], silinen = [];
      const foto = new Blob([new Uint8Array([9])], { type:'image/jpeg' });
      SP.Foto = Object.assign({}, eski, {
        al:async k => k === 'ogun:' + m.id ? foto : null,
        sil:async k => { silinen.push(k); },
        kaydet:async (k, b) => { kayit.push([k, b]); return { ok:true }; },
      });
      try{
        await sessiz(async t => {
          await E().handle['del-meal']({ dataset:{ id:m.id } });
          expect(bugun().length).toBe(0);
          expect(silinen).toEqual(['ogun:' + m.id]);
          expect(t[0].metin).toContain('silindi');
          await t[0].secenek.undo();
          expect(bugun().length).toBe(1);
          expect(bugun()[0].id).toBe(m.id);
          expect(bugun()[0].items[0].foodId).toBe('somon');
          expect(kayit.length).toBe(1);
          expect(kayit[0][0]).toBe('ogun:' + m.id);
          expect(kayit[0][1]).toBe(foto);
        });
      }finally{ SP.Foto = eski; }
    });
  });

  describe('Öğün girişi — tanınmayan parça', () => {
    it('tanınmayan parça alanda kalır ve bildirimde adıyla yazılır', async () => {
      resetState();
      await sessiz(async t => {
        await alanla('1 kase mercimek çorbası, zıbırtı', async el => {
          await E().handle['add-meal']();
          expect(kalemler().length).toBe(1);
          expect(el.value).toBe('zıbırtı');
          expect(SP.S.ui.mealDraftText).toBe('zıbırtı');
          expect(t[0].metin).toContain('Tanınmadı: zıbırtı');
        });
      });
    });

    it('hiçbir şey tanınmazsa alan olduğu gibi kalır, parça adıyla söylenir', async () => {
      resetState();
      await sessiz(async t => {
        await alanla('zıbırtı', async el => {
          await E().handle['add-meal']();
          expect(bugun().length).toBe(0);
          expect(el.value).toBe('zıbırtı');
          expect(t[0].metin).toContain('Tanınmadı: zıbırtı');
        });
      });
    });
  });

  describe('Öğün girişi — veri yok sıfır değildir', () => {
    it('öğün girilmemiş gün üst sayılarda «0» yok, «veri yok» var', () => {
      resetState();
      const s = E().stats();
      const alinan = s.find(x => /bugün alınan/.test(x.label));
      const protein = s.find(x => /protein/.test(x.label));
      expect(alinan.value).toBe('—');
      expect(alinan.label).toContain('veri yok');
      expect(protein.value).toBe('—');
      expect(protein.label).toContain('veri yok');
      expect(s.some(x => String(x.value) === '0')).toBe(false);
    });
    it('öğün girilince sayı yazılır', () => {
      resetState();
      pushMeal(SP.U.todayISO(), 'ogle', [['tavuk-gogsu', 150]]);
      const alinan = E().stats().find(x => /bugün alınan/.test(x.label));
      expect(alinan.value === '—').toBe(false);
      expect(alinan.label).toBe('bugün alınan');
    });
  });

  describe('Öğün girişi — seçili öğün', () => {
    it('hazır öğün seçili öğüne yazılır', async () => {
      resetState();
      const m = pushMeal(gun(-3), 'kahvalti', [['yumurta', 110]]);
      const r = await SP.Hazir.ogunSakla(m, 'Sabah tabağı');
      SP.S.ui.mealSlot = 'aksam';
      await sessiz(async () => { await E().handle['hazir-ogun-ekle']({ dataset:{ id:r.kayit.id } }); });
      expect(bugun().length).toBe(1);
      expect(bugun()[0].slot).toBe('aksam');
    });
    it('sık öğün seçili öğüne yazılır', async () => {
      resetState();
      const m = pushMeal(gun(-2), 'kahvalti', [['yumurta', 110]]);
      SP.S.ui.mealSlot = 'ogle';
      await sessiz(async () => { await E().handle['sablon-ekle']({ dataset:{ date:gun(-2), id:m.id } }); });
      expect(bugun().length).toBe(1);
      expect(bugun()[0].slot).toBe('ogle');
    });
  });

  describe('Öğün girişi — kişisel çipler', () => {
    const cipler = async () => {
      const d = document.createElement('div');
      d.innerHTML = await E().render();
      return Array.from(d.querySelectorAll('.meal-suggs [data-act="quick-add-food"]'));
    };

    it('kayıt yoksa yerleşik liste gelir', async () => {
      resetState();
      SP.S.ui.mealSlot = 'ogle';
      const c = await cipler();
      expect(c.map(x => x.dataset.id)).toEqual(['tavuk-gogsu', 'bulgur-pilavi', 'mercimek-corbasi', 'salatalik']);
    });

    it('bu öğünde iki kez yenen gıda başa gelir, son porsiyonuyla; tek kez yenen gelmez', async () => {
      resetState();
      SP.S.ui.mealSlot = 'ogle';
      pushMeal(gun(-5), 'ogle', [['yulaf', 40]]);
      pushMeal(gun(-2), 'ogle', [['yulaf', 80]]);
      pushMeal(gun(-1), 'ogle', [['muz', 120]]);
      pushMeal(gun(-1), 'aksam', [['somon', 150]]);
      pushMeal(gun(-3), 'aksam', [['somon', 150]]);
      const c = await cipler();
      expect(c[0].dataset.id).toBe('yulaf');
      expect(c[0].dataset.g).toBe('80');
      expect(c[0].dataset.label).toBe('80 g');
      expect(c[0].getAttribute('title')).toContain('2 kez');
      expect(c.some(x => x.dataset.id === 'muz')).toBe(false);
      expect(c.some(x => x.dataset.id === 'somon')).toBe(false);
      expect(c.length).toBe(4);
    });

    it('eşleşmeyen yazıda eski çipler kalmaz; yazı silinince öneriler döner', async () => {
      resetState();
      SP.S.ui.mealSlot = 'ogle';
      const kok = document.createElement('div');
      kok.innerHTML = await E().render();
      document.body.appendChild(kok);
      try{
        E().afterRender();
        const el = kok.querySelector('#meal-text');
        const kutu = () => kok.querySelector('.meal-suggs');
        const yaz = v => { el.value = v; el.dispatchEvent(new Event('input')); };
        yaz('somon');
        expect(kutu().querySelector('[data-id="somon"]')).toBeTruthy();
        yaz('qqzzx');
        expect(kutu().querySelectorAll('button').length).toBe(0);
        expect(kutu().hidden).toBe(true);
        yaz('');
        expect(kutu().hidden).toBe(false);
        expect(kutu().querySelector('[data-id="tavuk-gogsu"]')).toBeTruthy();
      }finally{ kok.remove(); SP.S.ui.mealDraftText = ''; SP.S.ui.mealDraftQuery = ''; }
    });
  });

  describe('Öğün girişi — dünün aynısı', () => {
    it('dünün öğünü hazır öğünler kutusunda; tek dokunuşla eklenir, geri alınır', async () => {
      resetState();
      const m = pushMeal(gun(-1), 'kahvalti', [['yumurta', 110]]);
      const d = document.createElement('div');
      d.innerHTML = await E().render();
      const b = d.querySelector('[data-act="ogun-dunku-ekle"]');
      expect(b).toBeTruthy();
      expect(b.dataset.id).toBe(m.id);
      await sessiz(async t => {
        await E().handle['ogun-dunku-ekle']({ dataset:{ id:m.id } });
        expect(bugun().length).toBe(1);
        expect(bugun()[0].slot).toBe('kahvalti');
        expect(bugun()[0].items[0].g).toBe(110);
        await t[0].secenek.undo();
        expect(bugun().length).toBe(0);
      });
    });
    it('bugün aynı öğün girildiyse önerilmez', async () => {
      resetState();
      pushMeal(gun(-1), 'kahvalti', [['yumurta', 110]]);
      pushMeal(SP.U.todayISO(), 'kahvalti', [['muz', 120]]);
      const d = document.createElement('div');
      d.innerHTML = await E().render();
      expect(d.querySelector('[data-act="ogun-dunku-ekle"]')).toBeNull();
    });
  });

  describe('Öğün girişi — porsiyon çarpanı', () => {
    const kagit = () => document.getElementById('sheet');
    it('çarpan ev ölçüsünü çarpar; kesinlik tahmin kalır', async () => {
      resetState();
      await sessiz(async () => {
        await E().handle['pick-food']({ dataset:{ id:'mercimek-corbasi' } });
        expect(kagit().querySelector('[data-act="porsiyon-carpan"][data-value="0.5"]')).toBeTruthy();
        await E().handle['porsiyon-carpan']({ dataset:{ id:'mercimek-corbasi', value:'2' } });
        const b = kagit().querySelector('[data-act="add-portion"][data-label="2 kase"]');
        expect(b).toBeTruthy();
        expect(b.dataset.g).toBe('500');
        await E().handle['porsiyon-carpan']({ dataset:{ id:'mercimek-corbasi', value:'0.5' } });
        expect(kagit().querySelector('[data-act="add-portion"][data-label="½ kase"]').dataset.g).toBe('125');
        await E().handle['add-portion']({ dataset:{ id:'mercimek-corbasi', g:'500', label:'2 kase' } });
      });
      expect(kalemler()[0].g).toBe(500);
      expect(kalemler()[0].cert).toBe('estimated');
    });
    it('son girilen porsiyon başta durur', async () => {
      resetState();
      pushMeal(gun(-4), 'ogle', [['mercimek-corbasi', 250]]);
      SP.S.meals[gun(-1)] = [Object.assign(SP.Model.newMeal('ogle'), {
        items:[{ foodId:'mercimek-corbasi', g:500, cert:'estimated', portion:'2 kase' }] })];
      await sessiz(async () => {
        await E().handle['pick-food']({ dataset:{ id:'mercimek-corbasi' } });
        const ilk = kagit().querySelector('[data-act="add-portion"]');
        expect(ilk.dataset.label).toBe('2 kase');
        expect(ilk.dataset.g).toBe('500');
      });
    });
  });

  describe('Mutfak — payımı öğüne ekle', () => {
    it('kendi satırında düğme var; pay gramla, tahmin olarak eklenir ve geri alınır', async () => {
      resetState();
      SP.S.ui.kitchenDish = 'mercimek-corbasi';
      SP.S.ui.mealSlot = 'aksam';
      const eskiHane = SP.Model.householdList;
      SP.Model.householdList = () => [{ id:SP.S.profile.id, name:'Test' }];
      try{
      const d = document.createElement('div');
      d.innerHTML = await MK().render();
      const b = d.querySelector('[data-act="pay-ogune-ekle"]');
      expect(b).toBeTruthy();
      const satir = b.closest('.splitrow');
      const pay = Number(satir.querySelector('.splitrow__g').textContent.replace(/[^\d]/g, ''));
      expect(pay).toBeGreaterThan(0);
      await sessiz(async t => {
        await MK().handle['pay-ogune-ekle']({ dataset:{ id:'mercimek-corbasi' } });
        expect(bugun().length).toBe(1);
        expect(bugun()[0].slot).toBe('aksam');
        expect(kalemler()[0].foodId).toBe('mercimek-corbasi');
        expect(kalemler()[0].g).toBe(pay);
        expect(kalemler()[0].cert).toBe('estimated');
        expect(t[0].metin).toContain('tahmin');
        await t[0].secenek.undo();
        expect(bugun().length).toBe(0);
      });
      }finally{ SP.Model.householdList = eskiHane; }
    });
  });
})();
