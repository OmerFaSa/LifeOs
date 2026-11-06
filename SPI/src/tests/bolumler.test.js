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

  /* Çubukta kullanıcının gördüğü düğmeler (gruptakilerin gizli düğmesi hariç). */
  const gorunen = d => Array.from(d.querySelectorAll('.bolumcubugu--sayfa .bolumcubugu__ad:not([hidden])'))
    .map(x => x.childNodes[0].textContent.trim());

  /* Ekranın bölüm sözleşmesi: sekme yok, `adlar` sırasıyla bölüm, çubuk
     eski eylemi taşır. */
  async function bolumlu(ekran, act, adlar){
    const d = yerlestir(await SP.Screens[ekran].render());
    try{
      expect(d.querySelectorAll('[role="tab"], .subtabs').length).toBe(0);
      const b = Array.from(d.querySelectorAll('.sayfabolum > .sayfabolum__ad')).map(h => h.textContent.trim());
      expect(b).toEqual(adlar);
      const cubuk = Array.from(d.querySelectorAll('.bolumcubugu--sayfa .bolumcubugu__ad'));
      expect(cubuk.length).toBe(adlar.length);   // grupların gizli düğmesi de çubukta: bölümün kendi adı, grubun adı
      cubuk.forEach(x => expect(x.getAttribute('data-act')).toBe(act));
      /* Eskiden ayrı sekmede çizilen görünümler artık aynı sayfada: iki
         alan aynı kimliği taşırsa etiket ve odak yanlış alana gider. */
      const ids = Array.from(d.querySelectorAll('[id]')).map(e => e.id);
      expect(ids.filter((x, i) => ids.indexOf(x) !== i)).toEqual([]);
      return d;
    }catch(e){ d.remove(); throw e; }
  }

  describe('T3 SPİ — sekmeler bölüm oldu', () => {
    /* 2026-10-15: Öğrenme ve kanıt katmanı (data/ogrenme.js) «Fizyoloji &
       Kavramlar» bölümünü ekledi; okumalar artık altı. */
    it('oz-019 Analiz: bütün işler tek seçicide; dört bölüm ve «Daha» (2026-11-06)', async () => {
      resetState();
      const d = await bolumlu('analytics', 'an-tab', ['Özet', 'Hafta', 'Eğilim', 'Bağlar', 'Haftalık rapor', 'Denetim',
        'Fizyoloji ve kavramlar', 'Dürüstlük', 'Yol haritası', 'Veri aktar', 'Daha']);
      try{
        expect(gorunen(d)).toEqual(['Özet', 'Hafta', 'Eğilim', 'Bağlar', 'Daha']);
        /* Sayfada seçicinin dışında bir şey kalmaz: iş ya bir bölümde ya hiç. */
        expect(Array.from(d.querySelector('.bolumcubugu--sayfa').parentElement.children).every(c =>
          c.matches('.bolumcubugu--sayfa, .sayfabolumler'))).toBe(true);
      }finally{ d.remove(); }
    });

    it('sadelik: seçici telefonda taşmasın diye en çok beş görünür düğme; sayfa başı boş', async () => {
      resetState();
      for(const [ekran, adlar] of [
        ['labs', ['Sonuçlar', 'Test gir', 'Geçmiş', 'Daha']],
        ['move', ['Bugün', 'Egzersizler', 'İlerleme']],
        ['meals', ['Öğünler', 'Özet', 'Öneri', 'Besin değeri']],
        ['basket', ['Bütçe', 'Sepet', 'İkame', 'Fiyat']],
      ]){
        const d = yerlestir(await SP.Screens[ekran].render());
        try{ expect(gorunen(d)).toEqual(adlar); }finally{ d.remove(); }
      }
      ['labs', 'meals', 'basket', 'office', 'analytics'].forEach(e => expect(String(SP.Screens[e].actions())).toBe(''));
    });

    it('sadelik: özet kartları ilk görünüşte değil, kendi bölümünde', async () => {
      resetState();
      const m = yerlestir(await SP.Screens.meals.render());
      const h = yerlestir(await SP.Screens.move.render());
      try{
        expect(!!m.querySelector('#bl-ozet .pk-ust')).toBe(true);
        expect(m.querySelector('#bl-gunluk .pk-ust')).toBe(null);
        expect(!!m.querySelector('#bl-gunluk [data-act="add-meal"]')).toBe(true);
        expect(!!h.querySelector('#bl-ilerleme .pk-ust')).toBe(true);
        expect(h.querySelector('#bl-bugun .pk-ust')).toBe(null);
      }finally{ m.remove(); h.remove(); }
    });

    it('sadelik: her düğme kendi bölümünde; hiçbir eylem kaybolmaz', async () => {
      resetState();
      const b = yerlestir(await SP.Screens.basket.render());
      const l = yerlestir(await SP.Screens.labs.render());
      try{
        expect(!!b.querySelector('#bl-butce [data-act="open-limits"]')).toBe(true);
        expect(!!b.querySelector('#bl-sepet [data-act="open-add"]')).toBe(true);
        expect(!!b.querySelector('#bl-fiyat [data-act="open-receipt"]')).toBe(true);
        expect(!!l.querySelector('#bl-giris [data-act="open-paste"]')).toBe(true);
      }finally{ b.remove(); l.remove(); }
    });

    it('sadelik: başka ekrandan gelen bölüm isteği gruptaki bölümü de açar (İlaç, Kuvvet, Denetim)', async () => {
      resetState();
      const d = yerlestir(await SP.Screens.labs.render());
      try{
        expect(SP.C.bolumeGit('ilac')).toBe(true);
        expect(d.querySelector('#bl-ilac').classList.contains('is-on')).toBe(true);
        const on = d.querySelector('.bolumcubugu--sayfa .bolumcubugu__ad.is-on:not([hidden])');
        expect(on.textContent.trim()).toBe('Daha');
        /* Geri düğmesi grubun listesine döner, liste her üyeye gider. */
        const geri = d.querySelector('#bl-ilac [data-act="lab-tab"]');
        expect(geri.textContent).toContain('Daha');
        expect(SP.C.bolumeGit(geri.getAttribute('data-tab'))).toBe(true);
        const liste = Array.from(d.querySelectorAll('.sayfabolum.is-on button.minrow')).map(x => x.getAttribute('data-tab'));
        expect(liste).toEqual(['kiyas', 'panel', 'ilac', 'trend']);
      }finally{
        SP.C.bolumeGit('sonuc');
        d.remove();
      }
    });

    it('sadelik: kırmızı bayrak Testler\'de seçicinin üstünde kalır (AGENTS §1.5)', async () => {
      resetState();
      const eski = SP.Model.openFlags;
      SP.Model.openFlags = () => [{ id:'x', label:'Deneme bayrağı', detail:'hekime', tone:'danger' }];
      const d = yerlestir(await SP.Screens.labs.render());
      try{
        const nav = d.querySelector('.bolumcubugu--sayfa');
        const bayrak = d.querySelector('.flagcard');
        expect(!!bayrak).toBe(true);
        expect(!!(bayrak.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
      }finally{ d.remove(); SP.Model.openFlags = eski; }
    });

    it('sadelik: Hareket önerilen seansları gösterir, gerisi açılır; önerisizken hepsi görünür', async () => {
      resetState();
      const eski = SP.Move.prescription;
      const sablon = SP.SESSION_TEMPLATES;
      const rx = eski();
      SP.Move.prescription = () => Object.assign({}, rx, { suggest:[sablon[0]] });
      let d = yerlestir(await SP.Screens.move.render());
      try{
        const ac = Array.from(d.querySelectorAll('#bl-bugun .picks:not(details .picks) [data-act="start-session"]')).map(x => x.getAttribute('data-id'));
        expect(ac).toEqual([sablon[0].id, '']);
        expect(d.querySelectorAll('#bl-bugun details .pickcard').length).toBe(sablon.length - 1);
      }finally{ d.remove(); }
      SP.Move.prescription = () => Object.assign({}, rx, { suggest:[] });
      d = yerlestir(await SP.Screens.move.render());
      try{
        expect(d.querySelectorAll('#bl-bugun details .pickcard').length).toBe(0);
        expect(d.querySelectorAll('#bl-bugun .pickcard[data-act="start-session"]').length).toBe(sablon.length + 1);
      }finally{ d.remove(); SP.Move.prescription = eski; }
    });

    it('sadelik: Test gir isteğe bağlı alanları açılır bölümde; doluysa açık gelir', async () => {
      resetState();
      const l = SP.Screens.labs;
      let d = yerlestir(await l.render());
      try{
        expect(d.querySelector('#entry-lab').closest('details').open).toBe(false);
        expect(d.querySelector('#entry-date').closest('details')).toBe(null);
        expect(d.querySelector('#entry-fasting').closest('details')).toBe(null);
      }finally{ d.remove(); }
      const el = { value:'Merkez Lab' };
      await l.change['entry-lab'](el);
      d = yerlestir(await l.render());
      try{ expect(d.querySelector('#entry-lab').closest('details').open).toBe(true); }
      finally{ d.remove(); await l.change['entry-lab']({ value:'' }); }
    });

    it('sadelik: egzersiz kartında şu anki basamak görünür; basamaklar ve teknik açılır bölümde', async () => {
      resetState();
      const d = yerlestir(await SP.Screens.move.render());
      try{
        const k = d.querySelector('#bl-kuvvet .ladderblk');
        const ac = k.querySelector(':scope > .ladder');
        expect(ac.querySelectorAll('.ladderstep').length).toBe(1);
        expect(ac.querySelector('.ladderstep').classList.contains('is-current')).toBe(true);
        const ic = k.querySelector('details');
        expect(ic.open).toBe(false);
        ['open-ex-detail', 'pick-level'].forEach(a => expect(!!ic.querySelector('[data-act="' + a + '"]')).toBe(true));
        expect(ic.querySelectorAll('.ladderstep').length >= 1).toBe(true);
      }finally{ d.remove(); }
    });

    it('sadelik: Danışma iç terim göstermez; İnceleme önce kararı çizer', async () => {
      resetState();
      SP.AGENTS.forEach(a => expect(/Modül|Orkestrat/.test(a.title)).toBe(false));
      const d = yerlestir(await SP.Screens.meeting.render());
      try{
        const b = Array.from(d.querySelectorAll('.inc .kutu__ad, .inc h2, .inc h3')).map(x => x.textContent.trim());
        expect(b[0]).toBe('Tek karar');
      }finally{ d.remove(); }
    });

    it('sadelik: süzgeç çipleri açılır bölümde; süzgeç seçiliyken açık gelir', async () => {
      resetState();
      const paneller = {};
      SP.BIOMARKERS.forEach(b => { if(!b.derived && !paneller[b.panel]) paneller[b.panel] = b; });
      const iki = Object.keys(paneller).slice(0, 2).map(k => paneller[k]);
      const deger = {};
      iki.forEach(b => { deger[b.id] = (b.ref && b.ref.low != null) ? b.ref.low : 1; });
      pushLab('2026-03-01', deger);
      let d = yerlestir(await SP.Screens.labs.render());
      try{ expect(d.querySelector('details [data-act="lab-filter"]').closest('details').open).toBe(false); }finally{ d.remove(); }
      SP.S.ui.labFilter = iki[0].panel;
      d = yerlestir(await SP.Screens.labs.render());
      try{ expect(d.querySelector('details [data-act="lab-filter"]').closest('details').open).toBe(true); }finally{ d.remove(); SP.S.ui.labFilter = 'all'; }
    });

    it('oz-019 Rehber: dört bölüm alt alta, sekme yok', async () => {
      resetState();
      (await bolumlu('guide', 'guide-tab', ['Kullanım', 'Ofis', 'Veri', 'Sınırlar'])).remove();
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

    it('oz-019 Öğün: dört bölüm; ekranda tek dolu düğme (öğünü yaz)', async () => {
      resetState();
      const d = await bolumlu('meals', 'meal-tab', ['Öğünler', 'Özet', 'Öneri', 'Besin değeri']);
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
      const adlar = ['Bugün'].concat(SP.AREAS.map(a => a.label)).concat(['İlerleme', 'Egzersizler']);
      const d = await bolumlu('move', 'move-tab', adlar);
      try{
        const cip = Array.from(d.querySelectorAll('[data-act="pick-pattern-tab"]'));
        expect(cip.length).toBe(SP.PATTERNS.length + 1);
        expect(cip.filter(c => c.getAttribute('aria-pressed') === 'true').length).toBe(1);
        /* Aynı kart iki yerde durmaz: «Kalıp dengesi» bir kez. */
        const basliklar = Array.from(d.querySelectorAll('.lrow__label, .card__title'))
          .map(h => h.textContent.trim()).filter(x => x.indexOf('Kalıp dengesi') === 0);
        expect(basliklar.length).toBe(1);
        /* Sayfa başı boş: seans Bugün'ün listesinden ve alan kartından başlar. */
        expect(d.querySelectorAll('.btn--primary').length).toBe(0);
        expect(String(SP.Screens.move.actions())).toBe('');
        expect(!!d.querySelector('#bl-bugun [data-act="start-session"][data-id=""]')).toBe(true);
        expect(!!d.querySelector('#bl-kuvvet [data-act="start-area"]')).toBe(true);
        expect((d.textContent.match(/\p{Extended_Pictographic}/gu) || [])).toEqual([]);
      }finally{ d.remove(); }
    });

    it('oz-019 Testler: yedi bölüm; panel süzgeci sekme değil, eylemi aynı', async () => {
      resetState();
      const d = await bolumlu('labs', 'lab-tab', ['Sonuçlar', 'Test gir', 'Geçmiş', 'Karşılaştır',
        'Paneller', 'İlaç', 'Eğilim', 'Daha']);
      try{
        /* Tek dolu düğme: formun «Testi kaydet»i. */
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
        'Paneller', 'İlaç', 'Eğilim', 'Daha']);
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
      SP.S.ui.spiAnalizAyrinti = true;
      const d = yerlestir(await SP.Screens.analytics.render());
      SP.S.ui.spiAnalizAyrinti = false;
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
      SP.S.ui.spiAnalizAyrinti = true;
      const d = yerlestir(await SP.Screens.analytics.render());
      try{
        SP.S.ui.analyticsTab = 'denetim';
        let giden = null;
        const eski = SP.C.bolumeGit;
        SP.C.bolumeGit = id => { giden = id; return true; };
        try{ SP.Screens.analytics.afterRender(); }finally{ SP.C.bolumeGit = eski; }
        expect(giden).toBe('denetim');
        expect(SP.S.ui.analyticsTab == null).toBe(true);
      }finally{ d.remove(); SP.S.ui.spiAnalizAyrinti = false; }
    });
  });
})();
