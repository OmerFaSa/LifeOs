/* VİTRİN KARTLARI EKRANDA (ekip/vitrin.html → brand/ortak çizicileri).
   Her kart DOM'da kendi katalog numarasını (data-oz) taşır; envanter onu
   «ekranda» sayar. Veri yokken kart sıfır değil «—» / «veri yok» der. */
(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };
  const gun = n => { const d = new Date(R.U.todayISO() + 'T12:00:00'); d.setDate(d.getDate() + n); return R.U.iso(d); };
  const deneme = (i, c, w) => ({ id:'vd' + i, family:'TYT', kind:'full', date:gun(-7 * (8 - i)), tests:[{ correct:c, wrong:w }] });

  async function hazirla(){
    resetState();
    R.S.profile.setupDone = true;
    await R.Model.ensurePlan(true);
    await R.Model.ensureWeek(R.Model.currentWeek());
    await R.Model.ensureDay(R.U.today());
  }

  describe('Vitrin · AYS ekranlarında', () => {
    it('oz-033 Tekrar: gelecek yük kartı yedi gün çizer; kart yoksa hiç çizilmez', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        R.S.cards = [];
        expect(dom(await R.Screens.cards.render()).querySelector('[data-oz="033"]')).toBeNull();
        R.S.cards = [{ id:'k1', dueAt:gun(-2) }, { id:'k2', dueAt:gun(0) }, { id:'k3', dueAt:gun(3) }];
        expect(dom(await R.Screens.cards.render()).querySelector('[data-oz="033"]')).toBeTruthy();
      });
    });

    it('oz-035 Deneme: sıralama bandı; üç tam denemeden azsa «—» ve dayanağı yazar', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        R.S.exams = [deneme(1, 70, 10)];
        const az = dom(await R.Screens.exams.render()).querySelector('[data-oz="035"]');
        expect(az.className).toContain('aralik--yok');
        expect(az.textContent).toContain('—');
        R.S.exams = [deneme(1, 70, 10), deneme(2, 74, 8), deneme(3, 78, 8)];
        const dolu = dom(await R.Screens.exams.render()).querySelector('[data-oz="035"]');
        expect(dolu.className.indexOf('aralik--yok') < 0).toBeTruthy();
        expect(dolu.getAttribute('aria-label')).toContain('tahmin');
        R.S.exams = [];
      });
    });

    it('oz-041 oz-040 Analiz başı: veri doluluğu ve haftanın birikimi', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const k = dom(await R.Screens.analytics.render());
        expect(k.querySelector('[data-oz="041"]')).toBeTruthy();
        expect(k.querySelector('[data-oz="040"]')).toBeTruthy();
      });
    });

    it('oz-037 oz-034 oz-038 oz-035 Sıra geçmişi: eğilim, grafiğin cümlesi, çubuklu hücre, bant', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        R.S.exams = [1, 2, 3, 4, 5, 6].map(i => deneme(i, 68 + i * 3, 10 - i));
        const k = dom(await R.Screens.analytics.render());
        const sira = k.querySelector('#bl-rank');
        ['037', '034', '038', '035'].forEach(n => expect(sira.querySelector('[data-oz="' + n + '"]')).toBeTruthy());
        R.S.exams = [];
      });
    });

    it('oz-035 oz-039 Hedef: tahmini sıra bandı ve «hedefe kalan»dan açılan hız konisi', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        R.S.exams = [1, 2, 3, 4, 5, 6].map(i => deneme(i, 40 + i * 2, 12));
        const k = dom(await R.Screens.target.render());
        expect(k.querySelector('[data-oz="035"]')).toBeTruthy();
        const gap = R.Calc.netGapToTarget();
        if(gap && !gap.reached) expect(k.querySelector('details [data-oz="039"]')).toBeTruthy();
        R.S.exams = [];
      });
    });
  });
  describe('Vitrin · AYS öneri kartı ve tür ayarı', () => {
    it('oz-110 oz-123 ofisin önerisi Onaylar\'da ortak kartla; «Geç» nedeni öneriye yazılır', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const ders = R.SUBJECTS.find(s => (s.topics || []).length);
        const row = await R.Proposals.propose({ action:'block-add', agent:'tyt', source:'kural',
          params:{ subjectId:ders.id, topicId:ders.topics[0].id, minutes:30 }, reason:'Açık konu' });
        expect(row).toBeTruthy();
        expect(R.Proposals.actionable().some(p => p.id === row.id)).toBeTruthy();
        const k = dom(await R.Screens.onaylar.render());
        const kart = k.querySelector('[data-oz="110"][data-oneri="' + row.id + '"]');
        expect(kart).toBeTruthy();
        const ciz = R.App.render, bil = R.UI.toast;
        try{
          R.App.render = () => {}; R.UI.toast = () => {};
          await R.Screens.onaylar.handle['oneri-gec-neden']({ dataset:{ oneri:row.id, neden:'uymuyor' } });
        }finally{ R.App.render = ciz; R.UI.toast = bil; }
        const r = R.S.officeProposals.find(p => p.id === row.id);
        expect(r.status).toBe('rejected');
        expect(r.gecme.neden).toBe('uymuyor');
      });
    });

    it('oz-116 tür ayarı moddan önce gelir; ölçüm yazan tür hiçbir ayarda sormadan uygulanmaz', async () => {
      await hazirla();
      const kucuk = R.ACTIONS.find(a => a.level === 'kucuk' && !a.olcum);
      const row = { level:'kucuk', action:kucuk.id, source:'kural' };
      await R.Office.saveSettings({ otomatikTurler:{} });
      expect(R.Proposals.otomatikMi(row, 'hepsi')).toBe(true);
      await R.Office.saveSettings({ otomatikTurler:{ [kucuk.id]:false } });
      expect(R.Proposals.otomatikMi(row, 'hepsi')).toBe(false);
      await R.Office.saveSettings({ otomatikTurler:{ [kucuk.id]:true } });
      expect(R.Proposals.otomatikMi(row, 'hicbiri')).toBe(true);
      expect(R.Proposals.otomatikMi({ level:'orta', action:kucuk.id, source:'istek' }, 'hepsi')).toBe(false);
      const olcum = R.ACTIONS.find(a => a.olcum);
      if(olcum){
        await R.Office.saveSettings({ otomatikTurler:{ [olcum.id]:true } });
        expect(R.Proposals.otomatikMi({ level:'kucuk', action:olcum.id, source:'istek' }, 'hepsi')).toBe(false);
      }
      await R.Office.saveSettings({ otomatikTurler:{} });
    });
  });
  describe('Vitrin · AYS güven, ofis, şüphe', () => {
    it('oz-173 Ayarlar › Veri yedek durumunu gösterir; oz-177 «Tümünü sıfırla» kalıcı silme kapısını açar', async () => {
      await hazirla();
      const k = dom(await R.Screens.guide.render());
      expect(k.querySelector('[data-oz="173"]')).toBeTruthy();
      const sheet = R.UI.sheet;
      let govde = '';
      try{
        R.UI.sheet = o => { govde = o.body; };
        await R.Screens.guide.handle['reset-data']();
      }finally{ R.UI.sheet = sheet; }
      expect(govde).toContain('data-oz="177"');
    });

    it('oz-139 model kapalıyken Ofis gri şeritle açılır; oz-137 masa raporu veriyi adıyla çipler', async () => {
      await hazirla();
      const ajan = R.AGENTS.find(a => !a.lead);
      R.S.ui.officeDesk = ajan.id;
      const k = dom(await R.Screens.office.render());
      if(R.Office.mode() === 'kural') expect(k.querySelector('[data-oz="139"]')).toBeTruthy();
      const cip = k.querySelector('[data-oz="137"]');
      expect(cip).toBeTruthy();
      expect(cip.textContent.indexOf('_') < 0).toBeTruthy();
      R.S.ui.officeDesk = null;
    });

    it('oz-179 Onaylar «Son kararlar» geçmişi kararın kaynağını ayırır', async () => {
      await hazirla();
      R.S.officeProposals = [{ id:'g1', action:'block-add', agent:'tyt', status:'applied', source:'kural', at:'2026-10-10T08:00:00Z', appliedAt:'2026-10-10T09:00:00Z' },
        { id:'g2', action:'block-add', agent:'tyt', status:'rejected', source:'kural', at:'2026-10-11T08:00:00Z', gecme:{ neden:'uymuyor', nedenAd:'Bana uymuyor' } }];
      const k = dom(await R.Screens.onaylar.render());
      const g = k.querySelector('[data-oz="179"]');
      expect(g).toBeTruthy();
      expect(g.textContent).toContain('Bana uymuyor');
      R.S.officeProposals = [];
    });

    it('oz-018 Soru çöz: süre basamak kaymasıyla saparsa sorulur, doğal fark sorulmaz', async () => {
      await hazirla();
      R.S.solved = [{ id:'s1', seconds:90 }];
      const r = R.Screens.solve.sureSuphesi(900);
      expect(r.supheli).toBeTruthy();
      expect(r.secenekler[0].deger).toBe(90);
      expect(R.Screens.solve.sureSuphesi(200).supheli).toBeFalsy();
      R.S.solved = [];
      expect(R.Screens.solve.sureSuphesi(900).supheli).toBeFalsy();
    });
  });

})();
