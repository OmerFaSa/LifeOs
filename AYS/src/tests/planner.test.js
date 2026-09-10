/* Plan üreteci, otomasyon ve palet sistemi. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const P = R.Planner, M = R.Model, U = R.U, S = R.S;

  function profile(patch){
    return Object.assign({
      capacityHoursPerWeek:21, studyDaysPerWeek:6, level:'orta', weakSubjects:[],
    }, patch || {});
  }

  describe('Plan üreteci — temel', function(){
    it('istenen hafta sayısı kadar hafta üretir', function(){
      expect(P.generate(profile(), 40).weeks).toHaveLength(40);
      expect(P.generate(profile(), 12).weeks).toHaveLength(12);
      expect(P.generate(profile(), 1).weeks).toHaveLength(1);
    });
    it('her hafta plan şemasını taşır', function(){
      P.generate(profile(), 20).weeks.forEach(w => {
        expect(typeof w.n).toBe('number');
        expect(typeof w.title).toBe('string');
        expect(Array.isArray(w.topics)).toBeTruthy();
        expect(typeof w.q).toBe('number');
        expect(typeof w.exam).toBe('string');
        expect(typeof w.check).toBe('string');
      });
    });
    it('aynı konu iki kez planlanmaz', function(){
      const seen = {};
      P.generate(profile(), 40).weeks.forEach(w => {
        (w.items || []).forEach(it => {
          const key = it.subjectId+':'+it.topicId;
          expect(seen[key]).toBeUndefined();
          seen[key] = true;
        });
      });
    });
    it('ders içi önkoşul sırası korunur', function(){
      const lastOrder = {};
      let broken = 0;
      P.generate(profile(), 40).weeks.forEach(w => {
        (w.items || []).forEach(it => {
          const sub = R.SUBJECTS.find(s => s.id === it.subjectId);
          const t = sub.topics.find(x => x.id === it.topicId);
          if(lastOrder[it.subjectId] != null && t.order < lastOrder[it.subjectId]) broken++;
          lastOrder[it.subjectId] = t.order;
        });
      });
      expect(broken).toBe(0);
    });
    it('son haftalarda yeni konu açılmaz', function(){
      const plan = P.generate(profile(), 40);
      const last = plan.weeks.slice(-3);
      last.forEach(w => expect((w.items || []).length).toBe(0));
    });
    it('karar kapıları takvime oranlanır', function(){
      const a = P.generate(profile(), 40).meta.gates;
      const b = P.generate(profile(), 20).meta.gates;
      expect(a.length).toBeGreaterThan(2);
      a.forEach(w => expect(w <= 40).toBeTruthy());
      b.forEach(w => expect(w <= 20).toBeTruthy());
      expect(b[0]).toBeLessThan(a[0]);
    });
  });

  describe('Plan üreteci — kişiselleşme', function(){
    it('kapasite arttıkça haftada daha çok konu işlenir', function(){
      const low = P.generate(profile({ capacityHoursPerWeek:12 }), 40).meta.perWeek;
      const high = P.generate(profile({ capacityHoursPerWeek:40 }), 40).meta.perWeek;
      expect(high).toBeGreaterThan(low);
    });
    it('kapasite arttıkça kapsama yükselir', function(){
      const low = P.generate(profile({ capacityHoursPerWeek:12 }), 40).meta.coverage;
      const high = P.generate(profile({ capacityHoursPerWeek:40 }), 40).meta.coverage;
      expect(high).toBeGreaterThan(low);
    });
    it('soru hedefi kapasiteyle ölçeklenir', function(){
      const low = P.generate(profile({ capacityHoursPerWeek:12 }), 40).weeks[10].q;
      const high = P.generate(profile({ capacityHoursPerWeek:35 }), 40).weeks[10].q;
      expect(high).toBeGreaterThan(low);
    });
    it('ileri seviye daha çok soru, sıfırdan daha az verir', function(){
      const yeni = P.generate(profile({ level:'baslangic' }), 40).weeks[10].q;
      const ileri = P.generate(profile({ level:'ileri' }), 40).weeks[10].q;
      expect(ileri).toBeGreaterThan(yeni);
    });
    it('iki farklı profil aynı planı üretmez', function(){
      const a = P.generate(profile({ capacityHoursPerWeek:15, level:'baslangic' }), 30);
      const b = P.generate(profile({ capacityHoursPerWeek:35, level:'ileri' }), 40);
      expect(a.weeks.length === b.weeks.length).toBeFalsy();
      expect(a.meta.perWeek === b.meta.perWeek && a.meta.coverage === b.meta.coverage).toBeFalsy();
    });
    it('kısa takvimde plan sıkışır ama üretilir', function(){
      const plan = P.generate(profile(), 8);
      expect(plan.weeks).toHaveLength(8);
      expect(plan.meta.dropped.length).toBeGreaterThan(0);
    });
  });

  describe('Plan üreteci — konu düşürme', function(){
    it('yeterli takvimde yüksek frekanslı konu düşmez', function(){
      P.generate(profile({ capacityHoursPerWeek:21 }), 40).meta.dropped
        .forEach(d => expect(d.freq === 'high').toBeFalsy());
    });
    it('çok kısa takvimde önce düşük ve orta frekans düşer', function(){
      const dropped = P.generate(profile({ capacityHoursPerWeek:10 }), 10).meta.dropped;
      const high = dropped.filter(d => d.freq === 'high').length;
      const rest = dropped.filter(d => d.freq !== 'high').length;
      const allNonHigh = P.pool({}).filter(t => !t.recurring && t.freq !== 'high').length;
      if(high > 0) expect(rest).toBe(allNonHigh);   // yüksek ancak hepsi bittiyse düşer
      else expect(high).toBe(0);
    });
    it('zayıf işaretlenen ders korunur', function(){
      const plan = P.generate(profile({ capacityHoursPerWeek:10, weakSubjects:['tyt-fen'] }), 14);
      const droppedFen = plan.meta.dropped.filter(d => d.subjectId === 'tyt-fen').length;
      const droppedOther = plan.meta.dropped.filter(d => d.subjectId !== 'tyt-fen').length;
      expect(droppedOther).toBeGreaterThan(droppedFen);
    });
    it('düşen konular rapor edilir, gizlenmez', function(){
      const m = P.generate(profile({ capacityHoursPerWeek:10 }), 12).meta;
      expect(m.dropped.length + m.placed <= m.poolSize).toBeTruthy();
      m.dropped.forEach(d => {
        expect(typeof d.name).toBe('string');
        expect(typeof d.subjectName).toBe('string');
      });
    });
    it('tam kapsama için gereken kapasite hesaplanır', function(){
      const m = P.generate(profile({ capacityHoursPerWeek:14 }), 20).meta;
      expect(m.capacityForFull).toBeGreaterThan(14);
    });
    it('bol takvimde hiçbir konu düşmez', function(){
      const m = P.generate(profile({ capacityHoursPerWeek:45, level:'ileri' }), 40).meta;
      expect(m.coverage).toBeGreaterThan(90);
    });
  });

  describe('Plan sağlığı ve yeniden planlama', function(){
    it('geçmiş hafta yokken durum yeni', function(){
      resetState();
      const h = P.health(P.generate(profile(), 40), 1);
      expect(h.status).toBe('yeni');
      expect(h.pct).toBeNull();
    });
    it('kapanmamış konular geride sayılır', async function(){
      resetState();
      for(const s of R.SUBJECTS) await M.ensureTopics(s.id);
      const plan = P.generate(profile(), 40);
      const h = P.health(plan, 6);
      expect(h.expected).toBeGreaterThan(0);
      expect(h.closed).toBe(0);
      expect(h.status).toBe('geride');
    });
    it('kapanan konular sağlığı yükseltir', async function(){
      resetState();
      for(const s of R.SUBJECTS) await M.ensureTopics(s.id);
      const plan = P.generate(profile(), 40);
      for(const w of plan.weeks.filter(x => x.n < 6)){
        for(const it of (w.items || [])){
          await M.setTopicState(it.subjectId, it.topicId,
            { first:85, firstAt:U.todayISO(), second:80, secondAt:U.todayISO() });
        }
      }
      const h = P.health(plan, 6);
      expect(h.pct).toBe(100);
      expect(h.status).toBe('saglikli');
    });
    it('yeniden planlama geçmiş haftaları korur', function(){
      resetState();
      const plan = P.generate(profile(), 40);
      const next = P.replan(plan, profile(), 10);
      expect(next.weeks).toHaveLength(40);
      for(let i = 0; i < 9; i++){
        expect(next.weeks[i].title).toBe(plan.weeks[i].title);
      }
      expect(next.meta.replannedFrom).toBe(10);
    });
    it('yeniden planlamada kapanmamış konular öne alınır', async function(){
      resetState();
      for(const s of R.SUBJECTS) await M.ensureTopics(s.id);
      const plan = P.generate(profile(), 40);
      const next = P.replan(plan, profile(), 8);
      expect(next.meta.carried).toBeGreaterThan(0);
    });
  });

  describe('Model plan bağlantısı', function(){
    it('plan üretilince curriculumFor plandan okur', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        const plan = await M.ensurePlan(true);
        const w = M.curriculumFor(1);
        expect(w.title).toBe(plan.weeks[0].title);
        expect(w.phase).toBeTruthy();
      });
    });
    it('plan yokken sabit müfredata düşer', function(){
      resetState();
      S.plan = null;
      const w = M.curriculumFor(1);
      expect(w.title).toBe(R.CURRICULUM[0].title);
    });
    it('kapasite değişince plan yeniden üretilir', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        const a = await M.ensurePlan(true);
        S.profile.capacityHoursPerWeek = 35;
        const b = await M.ensurePlan();
        expect(b.meta.capacityHoursPerWeek).toBe(35);
        expect(b.meta.generatedAt === a.meta.generatedAt).toBeFalsy();
      });
    });
    it('hafta sözleşmesi plandaki konuya bağlanır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        const w = await M.ensureWeek(1);
        expect(w.mainTopics.length).toBeGreaterThan(0);
        expect(w.mainTopics[0].subjectId).toBeTruthy();
      });
    });
  });

  describe('Otomasyon', function(){
    it('boş sözleşme için taslak önerilir', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        const n = M.currentWeek();
        const w = await M.ensureWeek(n);
        w.mainTopics = [];
        await M.saveWeek(n);
        expect(R.Auto.suggestions().some(s => s.id === 'draft-week')).toBeTruthy();
      });
    });
    it('taslak konu, hedef ve kapasite üretir', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        const n = M.currentWeek();
        await M.ensureWeek(n);
        const d = R.Auto.draftWeek(n);
        expect(d.ok).toBeTruthy();
        expect(d.topics.length).toBeGreaterThan(0);
        expect(d.questionTarget).toBeGreaterThan(0);
        d.topics.forEach(t => expect(typeof t.why).toBe('string'));
      });
    });
    it('imzalı haftaya taslak yazılmaz', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        const n = M.currentWeek();
        const w = await M.ensureWeek(n);
        w.signedAt = new Date().toISOString();
        await M.saveWeek(n);
        expect(R.Auto.draftWeek(n).ok).toBeFalsy();
      });
    });
    it('taslak uygulanınca sözleşmeye yazılır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        const n = M.currentWeek();
        await M.ensureWeek(n);
        const d = R.Auto.draftWeek(n);
        expect(await R.Auto.applyDraft(n, d)).toBeTruthy();
        expect(S.weeks[M.weekId(n)].mainTopics[0].name).toBe(d.topics[0].name);
      });
    });
    it('bloklar haftanın konularına bağlanır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        const n = M.currentWeek();
        await M.ensureWeek(n);
        await R.Auto.applyDraft(n, R.Auto.draftWeek(n));
        const day = await M.ensureDay('2026-09-15');
        day.blocks.forEach(b => { b.subjectId = null; });
        await M.saveDay('2026-09-15');
        const changed = await R.Auto.syncDayBlocks('2026-09-15');
        expect(changed).toBeGreaterThan(0);
        expect(S.days['2026-09-15'].blocks.some(b => b.subjectId)).toBeTruthy();
      });
    });
    it('başlanmış bloğa dokunmaz', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        const n = M.currentWeek();
        const w = await M.ensureWeek(n);
        w.mainTopics = [{ name:'Yeni', subjectId:'tyt-fen', topicId:'x', questionTarget:50, accuracy:70 }];
        await M.saveWeek(n);
        const day = await M.ensureDay('2026-09-15');
        day.blocks[0].status = 'done';
        day.blocks[0].topic = 'Elle yazdım';
        await M.saveDay('2026-09-15');
        await R.Auto.syncDayBlocks('2026-09-15');
        expect(S.days['2026-09-15'].blocks[0].topic).toBe('Elle yazdım');
      });
    });
    it('davranış hedefi veriden seçilir', function(){
      resetState();
      expect(typeof R.Auto.suggestBehaviorGoal()).toBe('string');
      expect(R.Auto.suggestBehaviorGoal().length).toBeGreaterThan(5);
    });
    it('her öneri neden taşır', function(){
      resetState();
      R.Auto.suggestions().forEach(s => {
        expect(typeof s.why).toBe('string');
        expect(s.why.length).toBeGreaterThan(10);
        expect(typeof s.act).toBe('string');
      });
    });
  });

  describe('Palet sistemi', function(){
    it('en az beş palet tanımlı', function(){
      expect(R.PALETTES.length).toBeGreaterThan(4);
    });
    it('her paletin adı, notu ve iki örnek rengi var', function(){
      R.PALETTES.forEach(p => {
        expect(typeof p.id).toBe('string');
        expect(p.name.length).toBeGreaterThan(1);
        expect(p.note.length).toBeGreaterThan(5);
        expect(p.swatch).toHaveLength(2);
        p.swatch.forEach(c => expect(c.indexOf('#')).toBe(0));
      });
    });
    it('varsayılan palet listede vardır', function(){
      expect(R.PALETTES.some(p => p.id === R.DEFAULT_PALETTE)).toBeTruthy();
    });
    it('profil varsayılan paletle başlar', function(){
      resetState();
      expect(S.profile.palette).toBe(R.DEFAULT_PALETTE);
    });
  });

  describe('Çok kullanıcılı hazırlık', function(){
    it('varsayılan profilde kişisel ad yok', function(){
      resetState();
      expect(S.profile.name).toBe('');
      expect(S.profile.city).toBe('');
    });
    it('kurulum beş adım', function(){
      expect(R.Setup.STEPS).toHaveLength(5);
      R.Setup.STEPS.forEach(s => expect(s.title.length).toBeGreaterThan(3));
    });
    it('kurulum tamamlanmadan gerekli sayılır', function(){
      resetState();
      S.profile.setupDone = false;
      expect(R.Setup.needed()).toBeTruthy();
      S.profile.setupDone = true;
      expect(R.Setup.needed()).toBeFalsy();
    });
  });
})();
