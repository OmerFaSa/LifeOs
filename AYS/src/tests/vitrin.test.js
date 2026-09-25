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

    it('oz-174 oz-175 Ayarlar › Veri: veri nerede şeması ve dışa aktar kartı', async () => {
      await hazirla();
      const k = dom(await R.Screens.guide.render());
      expect(k.querySelector('[data-oz="174"]').textContent).toContain('modüle yazmaz');
      const d = k.querySelector('[data-oz="175"]');
      expect(d.querySelector('[data-act="export-data"]')).toBeTruthy();
      expect(d.querySelectorAll('.sg span')).toHaveLength(1);
      expect(k.querySelector('[data-oz="117"]')).toBeNull();
    });

    it('oz-117 geri dönüş noktaları yalnız orta/büyük uygulanmış öneriden', async () => {
      await hazirla();
      R.S.officeProposals = [
        { id:'gd1', action:'block-add', agent:'tyt', status:'applied', level:'orta', source:'kural', appliedAt:'2026-09-12T09:00:00Z' },
        { id:'gd2', action:'block-add', agent:'tyt', status:'applied', level:'kucuk', otomatik:true, source:'kural', appliedAt:'2026-09-13T09:00:00Z' }];
      const k = dom(await R.Screens.guide.render());
      const g = k.querySelector('[data-oz="117"]');
      expect(g).toBeTruthy();
      expect(g.querySelectorAll('.r')).toHaveLength(1);
      expect(g.querySelector('[data-act="office-undo"]').getAttribute('data-id')).toBe('gd1');
      expect(g.textContent).toContain('ORTA');
      R.S.officeProposals = [];
    });

    it('oz-178 içe aktarma önce önizler; onaysız hiçbir şey yazılmaz', async () => {
      await hazirla();
      const once = JSON.stringify(R.Store.exportAll().data);
      const yedek = R.Store.exportAll();
      yedek.data = Object.assign({}, yedek.data, { 'errors/vt1':{ id:'vt1' } });
      const sheet = R.UI.sheet, imp = R.Store.importAll, oku = R.Store.readBackup;
      let govde = '', yazildi = false;
      try{
        R.UI.sheet = o => { govde = o.body; };
        R.Store.readBackup = o => ({ ok:true, data:o.data, meta:o.__meta });
        R.Store.importAll = async () => { yazildi = true; return {}; };
        await R.Screens.guide.handle['import-run']({ dataset:{} }, { obj:yedek, name:'yedek.json', size:2048 });
      }finally{ R.UI.sheet = sheet; R.Store.importAll = imp; R.Store.readBackup = oku; }
      expect(yazildi).toBe(false);
      const k = dom(govde);
      const b = k.querySelectorAll('[data-oz="178"] .sn3 b');
      expect(b[1].textContent).toBe('1');
      expect(b[3].textContent).toBe('0');
      expect(JSON.stringify(R.Store.exportAll().data)).toBe(once);
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


  /* C · AYS kartları ekranda (vitrin sürüm 4, brand/ortak/vitrin.js). */
  describe('Vitrin · C kartları AYS ekranlarında', () => {
    /* Küçük aksiyonlar «Geri al» şeridi açar; test sayfasında kök yoksa kurulur. */
    if(!document.getElementById('toast-root')){
      const t = document.createElement('div'); t.id = 'toast-root'; t.hidden = true; document.body.appendChild(t);
    }
    /* İşleyiciler ekranı yeniden çizer; test sayfasında kabuk yok. Çizim
       burada ölçülmez (ayrıca render ile sınanır), yalnız kayıt. */
    async function cizmeden(fn){
      const A = R.App, r = A.render, p = A.patch;
      A.render = async () => {}; A.patch = () => true;
      try{ await fn(); } finally { A.render = r; A.patch = p; }
    }
    const T = (a, b) => [{ name:'Türkçe', correct:a[0], wrong:a[1], blank:a[2] }, { name:'Matematik', correct:b[0], wrong:b[1], blank:b[2] }];
    const iki = () => {
      R.S.exams = [{ id:'c1', family:'TYT', kind:'full', type:'D12', date:gun(-9), tests:T([30, 6, 4], [22, 6, 12]) },
        { id:'c2', family:'TYT', kind:'full', type:'D13', date:gun(-2), tests:T([34, 4, 2], [25, 6, 9]) }];
      R.S.ui.examOpen = 'c2';
    };

    it('oz-046 oz-048 oz-062 deneme ayrıntısı: karne, önceki denemeyle karşılaştırma, D/Y/B giriş hücreleri', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla(); iki();
        const k = dom(await R.Screens.exams.render());
        const net = Math.round(R.Model.examNet(R.S.exams[1]) * 100) / 100;
        expect(k.querySelector('[data-oz="046"] .top b').textContent).toBe(window.LIFEOS.VITRIN.sayi(net, 2));
        expect(k.querySelectorAll('[data-oz="048"] .fk').length).toBe(3);
        expect(k.querySelectorAll('[data-oz="062"] input[data-change="test-num"]').length).toBe(6);
        /* Önceki deneme yoksa karşılaştırma çizilmez; sıfır farkla değil. */
        R.S.exams = [R.S.exams[1]];
        expect(dom(await R.Screens.exams.render()).querySelector('[data-oz="048"]')).toBeNull();
      });
    });

    it('oz-047 hız şeridi yalnız süreli oturumun ölçtüğü sürelerle çizilir', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla(); iki();
        R.S.sessions = [];
        expect(dom(await R.Screens.exams.render()).querySelector('[data-oz="047"]')).toBeNull();
        R.S.sessions = [{ id:'s1', examId:'c2', marks:[60, 60, 60, 200].map((v, i) => ({ test:'Matematik', no:i + 1, spent:v })) }];
        expect(dom(await R.Screens.exams.render()).querySelector('[data-oz="047"] circle[r="3.6"]')).toBeTruthy();
      });
    });

    it('oz-056 yanlış nedenleri etiketten sayılır; etiketsiz hata dağılıma girmez', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla(); iki();
        R.S.errors = [{ id:'h1', examId:'c2', tag:'K' }, { id:'h2', examId:'c2', tag:'K' }, { id:'h3', examId:'c2', tag:'D' }, { id:'h4', examId:'c2', tag:null }];
        const z = dom(await R.Screens.exams.render()).querySelector('[data-oz="056"]');
        expect(z.querySelector('.u b').textContent).toBe('3 hata');
      });
    });

    it('oz-057 oz-066 deneme listesi: takvim plandan, hedefe kalan TAHMİN etiketiyle', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla(); iki(); R.S.ui.examOpen = null;
        const k = dom(await R.Screens.exams.render());
        const tk = k.querySelector('[data-oz="057"]');
        expect(tk.querySelectorAll('.nk.g').length).toBe(1);
        expect(tk.querySelectorAll('.nk.y').length).toBe(1);
        const hk = k.querySelector('[data-oz="066"]');
        if(hk) expect(hk.querySelector('[data-kesinlik]').getAttribute('data-kesinlik')).toBe('estimated');
      });
    });

    it('oz-045 oz-059 oz-065 tekrar: kart çevrilir, paket konu konu, aralıklar koddan', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        R.S.cards = [{ id:'k1', front:'Ana fikir?', back:'Ayrıntı', topic:'Paragraf', source:'error', stage:2, dueAt:gun(0), history:[] },
          { id:'k2', front:'Türev?', back:'x', topic:'Türev', stage:0, dueAt:gun(-1), history:[] }];
        let k = dom(await R.Screens.cards.render());
        const kart = k.querySelector('[data-oz="045"]');
        expect(kart.getAttribute('data-act')).toBe('flip');
        expect(kart.getAttribute('aria-pressed')).toBe('false');
        expect(k.querySelector('[data-oz="059"] .u b').textContent).toBe('2 kart');
        expect(k.querySelectorAll('[data-oz="065"] .nk').length).toBe(R.SRS_INTERVALS.length);
        R.S.ui.flipped = { [kart.getAttribute('data-id')]:true };
        k = dom(await R.Screens.cards.render());
        expect(k.querySelector('[data-oz="045"]').getAttribute('aria-pressed')).toBe('true');
      });
    });

    it('oz-049 oz-051 oz-052 hafta: kapsam halkası, 40 hafta çizgisi, saatsiz plan ızgarası', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const k = dom(await R.Screens.week.render());
        expect(k.querySelector('[data-oz="051"]').textContent).toContain('/ ' + R.PLAN.totalWeeks + ' HAFTA');
        const iz = k.querySelector('[data-oz="052"]');
        expect(iz.querySelectorAll('.bk').length).toBeGreaterThan(0);
        expect(/\d\d:\d\d/.test(iz.textContent)).toBeFalsy();
        expect(k.querySelector('[data-oz="049"]')).toBeTruthy();
      });
    });

    it('oz-061 oz-067 ders dengesi yalnız gerçekleşen dakika varsa çizilir; ders harfle ayrılır', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        expect(dom(await R.Screens.week.render()).querySelector('[data-oz="061"]')).toBeNull();
        const gunDoc = R.S.days[R.U.todayISO()];
        gunDoc.blocks[0].subjectId = 'tyt-matematik'; gunDoc.blocks[0].status = 'done'; gunDoc.blocks[0].actualMin = 60;
        const k = dom(await R.Screens.week.render());
        expect(k.querySelector('[data-oz="061"]').textContent).toContain('GERÇEK');
        expect(k.querySelector('[data-oz="067"] .d2').textContent).toBe('M');
      });
    });

    it('oz-050 oz-063 dersler: konu tablosu ve eksik önkoşul', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const s = R.SUBJECTS[0];
        R.S.ui.subjectOpen = s.id;
        const g = s.topics.filter(t => t.group === s.topics[0].group).sort((a, b) => a.order - b.order);
        await R.Model.setTopicState(s.id, g[1].id, { state:'learning' });
        const k = dom(await R.Screens.subjects.render());
        expect(k.querySelector('[data-oz="063"] [data-act="topic-open"]')).toBeTruthy();
        expect(k.querySelector('[data-oz="063"] .uy2')).toBeTruthy();
        expect(k.querySelector('[data-oz="050"] .dg.ek')).toBeTruthy();
      });
    });

    it('oz-055 soru çöz: tek satır kayıt konusuz kaydetmez, kaydedince geri alınır', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        R.S.solved = [];
        const k = dom(await R.Screens.solve.render());
        expect(k.querySelectorAll('[data-oz="055"] select').length).toBe(3);
        const d = R.SUBJECTS[0];
        await cizmeden(async () => {
          await R.Screens.solve.handle['q-hizli']();
          expect(R.S.solved.length).toBe(0);
          await R.Screens.solve.change['qh-alan']({ dataset:{ alan:'qh-konu' }, value:d.topics[0].id, id:'qh-konu' });
          await R.Screens.solve.handle['q-hizli']();
        });
        expect(R.S.solved.length).toBe(1);
        expect(R.S.solved[0].topicId).toBe(d.topics[0].id);
      });
    });

    it('oz-060 oz-064 oz-054 bugün: blok bitiş özeti, hedef ayarı geri alınır, blok taşınınca hayalet kalır', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const g = R.S.days[R.U.todayISO()];
        const bl = g.blocks.filter(b => b.slot !== 'Dinlenme');
        bl[0].status = 'done'; bl[0].actualQ = 30; bl[0].correctQ = 23; bl[0].actualMin = 64;
        const k = dom(await R.Screens.today.render());
        const z = k.querySelector('[data-oz="060"]');
        expect(z.querySelectorAll('.uc > div').length).toBe(3);
        expect(z.querySelector('[data-act="timer-start"]').getAttribute('data-block')).toBe(bl[1].id);
        const a = dom(await R.Screens.gun.render());
        expect(a.querySelectorAll('[data-oz="064"]').length).toBe(2);
        const once = g.paragraphTarget;
        await cizmeden(() => R.Screens.today.handle['hedef-ayar']({ dataset:{ kind:'paragraph', delta:'1' } }));
        expect(g.paragraphTarget).toBe(once + 1);
        if(bl.length >= 3){
          const ilk = bl[1].id;
          await cizmeden(() => R.Screens.today.handle['block-sonra']({ dataset:{ block:ilk } }));
          const b = dom(await R.Screens.gun.render());
          expect(b.querySelector('[data-oz="054"] .hy')).toBeTruthy();
          await cizmeden(() => R.Screens.today.handle['block-geri']());
          expect(g.blocks.filter(x => x.slot !== 'Dinlenme')[1].id).toBe(ilk);
        }
      });
    });
  });

  describe('Vitrin · AYS son parti (020 125 134 136 157 161 168 180)', () => {
    async function cizmeden(fn){
      const A = R.App, r = A.render, p = A.patch;
      A.render = async () => {}; A.patch = () => true;
      try{ await fn(); } finally { A.render = r; A.patch = p; }
    }
    if(!document.getElementById('toast-root')){
      const t = document.createElement('div'); t.id = 'toast-root'; t.hidden = true; document.body.appendChild(t);
    }
    it('oz-020 Denemeler: aile süzgeci açıkken çip ve sonuç sayısı; «Tümü»de kart yok', async () => {
      await hazirla();
      R.S.exams = [deneme(1, 30, 5), Object.assign(deneme(2, 32, 4), { family:'AYT' })];
      R.S.ui.examFilter = 'all';
      let k = dom(await R.Screens.exams.render());
      expect(k.querySelector('[data-oz="020"]')).toBeNull();
      R.S.ui.examFilter = 'TYT';
      k = dom(await R.Screens.exams.render());
      expect(k.querySelector('[data-oz="020"] .sn b').textContent).toBe('1');
      expect(k.querySelector('[data-oz="020"] .cp2 [data-value="all"]')).toBeTruthy();
      R.S.ui.examFilter = 'all'; R.S.exams = [];
    });
    it('oz-125 Hafta: bekleyen blok önerisi hayalet olarak durur, «Yerleştir» onaya gider', async () => {
      await hazirla();
      const s = R.SUBJECTS[0], t = s.topics[0];
      R.S.officeProposals = [{ id:'hy1', action:'block-add', agent:'tyt', status:'pending', source:'kural', level:'kucuk',
        params:{ subjectId:s.id, topicId:t.id, minutes:30 }, at:new Date().toISOString() }];
      const k = dom(await R.Screens.week.render());
      const g = k.querySelector('[data-oz="125"]');
      expect(g).toBeTruthy();
      expect(g.querySelector('.hy2').textContent).toContain('30 dk');
      expect(g.querySelector('[data-act="office-approve"]').getAttribute('data-id')).toBe('hy1');
      R.S.officeProposals = [];
    });
    it('oz-136 Ayarlar: üslup önizlemesi senin tekrar borcunu kod cümlesiyle söyler; değişiklik geri alınır', async () => {
      await hazirla();
      R.S.profile.coachTone = 'sert';
      const k = dom(await R.Screens.guide.render());
      const u = k.querySelector('[data-oz="136"]');
      expect(u.querySelector('.on').textContent).toBe('Sert');
      expect(u.querySelector('.bal').textContent).toContain('%' + R.Calc.cardDebt());
      await cizmeden(() => R.Screens.guide.handle['set-tone']({ dataset:{ value:'destekleyici' } }));
      expect(R.S.profile.coachTone).toBe('destekleyici');
      await cizmeden(() => R.Screens.guide.handle['set-tone']({ dataset:{ value:'yok-boyle-bir-ton' } }));
      expect(R.S.profile.coachTone).toBe('destekleyici');
      R.S.profile.coachTone = 'dengeli';
    });
    it('oz-161 Bugün: bekleyen satır kaydırılabilir; sağa = bitti (geri alınır), sola = ertele', async () => {
      await hazirla();
      const day = await R.Model.ensureDay(R.U.today());
      const bl = day.blocks.filter(b => b.slot !== 'Dinlenme');
      if(bl.length < 2) return;
      const k = dom(await R.Screens.today.render());
      expect(k.querySelectorAll('[data-kaydir]').length).toBeGreaterThan(0);
      expect(k.querySelector('[data-kaydir]').getAttribute('data-kaydir')).toBe('block-kaydir');
      await cizmeden(() => R.Screens.today.handle['block-kaydir']({ dataset:{ block:bl[0].id, yon:'sag' } }));
      expect(bl[0].status).toBe('done');
      const ilk = day.blocks.filter(b => b.slot !== 'Dinlenme' && b.status === 'pending')[0];
      await cizmeden(() => R.Screens.today.handle['block-kaydir']({ dataset:{ block:ilk.id, yon:'sol' } }));
      expect(day.blocks.filter(b => b.slot !== 'Dinlenme' && b.status === 'pending')[0].id === ilk.id).toBe(false);
    });
    it('oz-157 Ayrıntı: bekleyen blok sürüklenir; bırakma yeri sırayı değiştirir ve «Blok taşındı» geri alır', async () => {
      await hazirla();
      const day = await R.Model.ensureDay(R.U.today());
      if(day.blocks.length < 3) return;
      const k = dom(await R.Screens.gun.render());
      expect(k.querySelectorAll('[data-oz="157"]').length).toBe(day.blocks.length + 1);
      const son = day.blocks[day.blocks.length - 1];
      await cizmeden(() => R.Screens.today.handle['block-sira']({ dataset:{ block:son.id, sira:'0' } }));
      expect(day.blocks[0].id).toBe(son.id);
      await cizmeden(() => R.Screens.today.handle['block-geri']());
      expect(day.blocks[day.blocks.length - 1].id).toBe(son.id);
    });
    it('oz-168 Ayrıntı: çıpa sayacı büyük artı/eksi; eksi sıfırda kapalı', async () => {
      await hazirla();
      const day = await R.Model.ensureDay(R.U.today());
      day.paragraphActual = 0;
      const k = dom(await R.Screens.gun.render());
      const a = k.querySelector('[data-oz="168"]');
      expect(a).toBeTruthy();
      expect(a.querySelector('[data-delta="-1"]').disabled).toBe(true);
      expect(a.querySelector('[data-delta="1"]').getAttribute('data-act')).toBe('anchor');
    });
    it('oz-134 Ofis sohbeti: «@» ile başlayınca ajan listesi, başka metinde yok', () => {
      const h = R.Screens.team.mentionHtml('@' + R.AGENTS[0].name.slice(0, 2));
      expect(dom(h).querySelector('[data-oz="134"] [data-act="team-agent"]').getAttribute('data-value')).toBe(R.AGENTS[0].id);
      expect(R.Screens.team.mentionHtml('merhaba')).toBe('');
    });
    it('oz-180 oz-122 ofis bildirimi: tür kapalıyken gönderilmez', () => {
      const P = window.LIFEOS.Pwa;
      const once = P.bildirimAyari('ays');
      try{
        P.bildirimAyariYaz('ays', { turler:{ ofis:false } });
        expect(P.gonderilebilir('ays', 'ofis').neden).toBe('kapali');
        expect(R.App.notifyFromOffice()).toBe(false);
      }finally{ P.bildirimAyariYaz('ays', { turler:{ ofis:once.turler.ofis !== false } }); }
    });
  });

})();
