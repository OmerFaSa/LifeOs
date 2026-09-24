/* T3 SPİ — ekran içi sekme yok (EKIP-PLANI §1.2, katalog 019; T-DEVIR §2.A-3).

   Kanıtladığı sözler: sekmeli her ekran bölümlerini ALT ALTA çizer ve
   hiçbiri `.subtabs`/`role=tab` taşımaz; üstteki bölüm çubuğu eski sekme
   eylemini taşır (envanter: eylem kaybolmaz), basınca o bölüme kayar;
   başka ekrandan «şu bölüme» gelmek (S.ui.<ekran>Tab) çizimden sonra o
   bölüme kaydırır ve istek bir kez kullanılır. */

(function(){
  const { describe, it, expect, resetState, pushLab } = SP.Test;

  function yerlestir(h){
    const d = document.createElement('div');
    d.innerHTML = String(h);
    document.body.appendChild(d);
    return d;
  }

  /* Ekranın bölüm sözleşmesi: sekme yok, `adlar` sırasıyla bölüm, çubuk
     eski eylemi taşır. */
  async function bolumlu(ekran, act, adlar){
    const d = yerlestir(await SP.Screens[ekran].render());
    try{
      expect(d.querySelectorAll('[role="tab"], .subtabs').length).toBe(0);
      const b = Array.from(d.querySelectorAll('.sayfabolum > .sayfabolum__ad')).map(h => h.textContent.trim());
      expect(b).toEqual(adlar);
      const cubuk = Array.from(d.querySelectorAll('.bolumcubugu--sayfa .bolumcubugu__ad'));
      expect(cubuk.length).toBe(adlar.length);
      cubuk.forEach(x => expect(x.getAttribute('data-act')).toBe(act));
      /* Eskiden ayrı sekmede çizilen görünümler artık aynı sayfada: iki
         alan aynı kimliği taşırsa etiket ve odak yanlış alana gider. */
      const ids = Array.from(d.querySelectorAll('[id]')).map(e => e.id);
      expect(ids.filter((x, i) => ids.indexOf(x) !== i)).toEqual([]);
      return d;
    }catch(e){ d.remove(); throw e; }
  }

  describe('T3 SPİ — sekmeler bölüm oldu', () => {
    it('oz-019 Analiz: beş okuma alt alta, sekme yok', async () => {
      resetState();
      const d = await bolumlu('analytics', 'an-tab',
        ['Çapraz bağlar', 'Haftalık rapor', 'Seriler', 'Denetim', 'Dürüstlük']);
      d.remove();
    });

    it('oz-019 Rehber: dört bölüm alt alta, sekme yok', async () => {
      resetState();
      (await bolumlu('guide', 'guide-tab', ['Kullanım', 'Model', 'Veri', 'Sınırlar'])).remove();
    });

    it('oz-019 Sepet: dört bölüm alt alta; kalem sayısı çubukta rozet', async () => {
      resetState();
      SP.S.basket = SP.S.basket || {};
      SP.S.basket.items = [{ id:'yumurta', qty:1 }, { id:'mercimek', qty:1 }];
      const d = await bolumlu('basket', 'basket-tab', ['Bütçe', 'Sepet', 'İkame', 'Fiyat']);
      try{
        const r = d.querySelector('.bolumcubugu__ad[data-tab="sepet"] .bolumcubugu__rozet');
        expect(r && r.textContent).toBe('2');
      }finally{ d.remove(); }
    });

    it('oz-019 Öğün: üç bölüm alt alta; ekranda tek dolu düğme (öğünü yaz)', async () => {
      resetState();
      const d = await bolumlu('meals', 'meal-tab', ['Öğünler', 'Öneri', 'Besin değeri']);
      try{
        const b = d.querySelectorAll('.btn--primary');
        expect(b.length).toBe(1);
        expect(b[0].getAttribute('data-act')).toBe('add-meal');
        const u = document.createElement('div');
        u.innerHTML = SP.Screens.meals.actions();
        expect(u.querySelectorAll('.btn--primary').length).toBe(0);
      }finally{ d.remove(); }
    });

    it('oz-019 Hareket: altı bölüm alt alta; kalıp süzgeci sekme değil, eylemi aynı', async () => {
      resetState();
      const adlar = ['Bugün'].concat(SP.AREAS.map(a => a.label)).concat(['İlerleme']);
      const d = await bolumlu('move', 'move-tab', adlar);
      try{
        const cip = Array.from(d.querySelectorAll('[data-act="pick-pattern-tab"]'));
        expect(cip.length).toBe(SP.PATTERNS.length + 1);
        expect(cip.filter(c => c.getAttribute('aria-pressed') === 'true').length).toBe(1);
        /* Aynı kart iki yerde durmaz: «Kalıp dengesi» bir kez. */
        const basliklar = Array.from(d.querySelectorAll('.lrow__label, .card__title'))
          .map(h => h.textContent.trim()).filter(x => x.indexOf('Kalıp dengesi') === 0);
        expect(basliklar.length).toBe(1);
        /* Ekranın tek dolu düğmesi başlıktaki «Seans ekle». */
        expect(d.querySelectorAll('.btn--primary').length).toBe(0);
        const u = document.createElement('div');
        u.innerHTML = SP.Screens.move.actions();
        expect(u.querySelectorAll('.btn--primary').length).toBe(1);
        expect((d.textContent.match(/\p{Extended_Pictographic}/gu) || [])).toEqual([]);
      }finally{ d.remove(); }
    });

    it('oz-019 Testler: yedi bölüm alt alta; panel süzgeci sekme değil, eylemi aynı', async () => {
      resetState();
      const d = await bolumlu('labs', 'lab-tab', ['Sonuçlar', 'Test gir', 'Geçmiş', 'Karşılaştır',
        'Paneller', 'İlaç', 'Eğilim']);
      try{
        /* Tek dolu düğme: formun «Testi kaydet»i; başlıktaki «Test gir» o
           bölüme kaydırır, dolu değil. */
        const dolu = Array.from(d.querySelectorAll('.btn--primary')).map(x => x.getAttribute('data-act'));
        expect(dolu).toEqual(['entry-save']);
        const u = document.createElement('div');
        u.innerHTML = SP.Screens.labs.actions();
        expect(u.querySelectorAll('.btn--primary').length).toBe(0);
        /* Süzgeç çipleri yalnız iki panel ölçülmüşse çizilir; çizildiğinde de
           sekme değildir (bölüm sözleşmesi yukarıda sınandı). */
      }finally{ d.remove(); }
    });

    it('oz-019 Testler: iki panel ölçülünce süzgeç çip olur, sekme olmaz; seçili olan basılı', async () => {
      resetState();
      /* İki ayrı panelden birer ölçüm: süzgeç ancak o zaman çizilir. */
      const paneller = {};
      SP.BIOMARKERS.forEach(b => { if(!b.derived && !paneller[b.panel]) paneller[b.panel] = b; });
      const iki = Object.keys(paneller).slice(0, 2).map(k => paneller[k]);
      const deger = {};
      iki.forEach(b => { deger[b.id] = (b.ref && b.ref.low != null) ? b.ref.low : 1; });
      pushLab('2026-03-01', deger);
      SP.S.ui.labFilter = iki[0].panel;
      const d = await bolumlu('labs', 'lab-tab', ['Sonuçlar', 'Test gir', 'Geçmiş', 'Karşılaştır',
        'Paneller', 'İlaç', 'Eğilim']);
      try{
        const cip = Array.from(d.querySelectorAll('[data-act="lab-filter"]'));
        expect(cip.length).toBe(3);
        const basili = cip.filter(c => c.getAttribute('aria-pressed') === 'true');
        expect(basili.length).toBe(1);
        expect(basili[0].getAttribute('data-tab')).toBe(iki[0].panel);
      }finally{ d.remove(); SP.S.ui.labFilter = 'all'; }
    });

    it('T2-14 Analiz › Dürüstlük boş sayı yazmaz («asgari çaba dk.» ya da «undefined»)', async () => {
      resetState();
      const d = yerlestir(await SP.Screens.analytics.render());
      try{
        const m = d.textContent.replace(/\s+/g, ' ');
        expect(/asgari çaba\s+dk/.test(m)).toBe(false);
        expect(m.indexOf('undefined') < 0).toBe(true);
        expect(m.indexOf('NaN') < 0).toBe(true);
      }finally{ d.remove(); }
    });

    it('Katmanlı metin: 30 kelimeyi aşan açıklamada ilk cümle görünür, gerisi Ayrıntı; hiçbir cümle silinmez', () => {
      const kisa = yerlestir(SP.C.Katmanli({ metin:'Kısa bir cümle.', sinif:'x' }));
      try{
        expect(kisa.querySelector('details')).toBeNull();
        expect(kisa.querySelector('p.x').textContent).toBe('Kısa bir cümle.');
      }finally{ kisa.remove(); }
      const uzunMetin = 'Ferritin hedef bandın altında. ' + 'Bu eşik sistem ayarından gelir ve yalnız bilgi verir. '.repeat(4);
      const d = yerlestir(SP.C.Katmanli({ metin:uzunMetin, sinif:'link__why' }));
      try{
        expect(d.querySelector('.ayrinti__ozet').textContent).toBe('Ferritin hedef bandın altında.');
        expect(d.querySelector('.ayrinti__govde').textContent.trim()).toBe(uzunMetin.slice('Ferritin hedef bandın altında. '.length).trim());
      }finally{ d.remove(); }
    });

    it('oz-019 başka ekrandan gelinen bölüme çizimden sonra kayılır; istek bir kez', async () => {
      resetState();
      const d = yerlestir(await SP.Screens.analytics.render());
      try{
        SP.S.ui.analyticsTab = 'denetim';
        let giden = null;
        const eski = SP.C.bolumeGit;
        SP.C.bolumeGit = id => { giden = id; return true; };
        try{ SP.Screens.analytics.afterRender(); }finally{ SP.C.bolumeGit = eski; }
        expect(giden).toBe('denetim');
        expect(SP.S.ui.analyticsTab == null).toBe(true);
      }finally{ d.remove(); }
    });
  });
})();
