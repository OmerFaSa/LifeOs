/* Oneri kutusu — ofisin sisteme dokunabildigi tek kapi.

   Bu paketin asil isi bir seyin OLMADIGINI kanitlamaktir: onaysiz hicbir
   veri degismez, ajan katalog disina cikamaz, model parametre uyduramaz.
   Onay verildiginde de degisiklik geri alinabilir olmalidir. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync } = R.Test;
  const P = R.Proposals, M = R.Model, S = R.S, U = R.U;

  const TODAY = '2026-11-10';

  function reset(){
    resetState();
    S.officeProposals = [];
    S.officeMeetings = [];
    S.office = null;
  }

  /* Testlerde kullanilan gercek ders/konu — katalogdan okunur, uydurulmaz. */
  const SUBJECT = R.SUBJECTS[0];
  const TOPIC = SUBJECT.topics[0];

  function lateCard(id, dueAt){
    return M.newCard({ id, front:'ön ' + id, back:'arka', dueAt });
  }

  /* ==================== katalog ==================== */

  describe('Öneri — katalog', () => {
    it('her eylemin kimliği benzersizdir', () => {
      const ids = R.ACTIONS.map(a => a.id);
      expect(ids.length).toBe(Object.keys(R.ACTION_BY_ID).length);
    });

    it('her eylem gerçek ajanlara bağlıdır', () => {
      R.ACTIONS.forEach(a => {
        expect(a.agents.length > 0).toBeTruthy();
        a.agents.forEach(id => expect(!!R.AGENT_BY_ID[id]).toBeTruthy());
      });
    });

    it('her eylem parametre şeması taşır', () => {
      R.ACTIONS.forEach(a => {
        expect(Object.keys(a.params).length > 0).toBeTruthy();
        Object.keys(a.params).forEach(k => {
          expect(['string', 'number'].indexOf(a.params[k]) >= 0).toBeTruthy();
        });
      });
    });

    it('her eylem kullanıcıya anlatılır', () => {
      R.ACTIONS.forEach(a => {
        expect(a.title.length > 3).toBeTruthy();
        expect(a.summary.length > 10).toBeTruthy();
        expect(a.touches.length > 2).toBeTruthy();
      });
    });

    it('ajan yalnız kendi alanındaki eylemleri görür', () => {
      const rehber = R.actionsFor('rehber').map(a => a.id);
      expect(rehber.indexOf('topic-review')).toBe(-1);
      expect(rehber.indexOf('block-add') >= 0).toBeTruthy();
      const analist = R.actionsFor('analist').map(a => a.id);
      expect(analist.indexOf('cards-due-today') >= 0).toBeTruthy();
      expect(analist.indexOf('week-target')).toBe(-1);
    });
  });

  /* ==================== dogrulama ==================== */

  describe('Öneri — doğrulama', () => {
    it('alanı dışındaki eylemi öneren ajan reddedilir', () => {
      const res = P.check({ action:'topic-review', agent:'rehber',
        params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } });
      expect(res.ok).toBeFalsy();
      expect(res.why).toContain('alanı dışında');
    });

    it('uydurulmuş konu kimliği geçmez', () => {
      reset();
      const res = P.check({ action:'topic-review', agent:'tyt',
        params:{ subjectId:SUBJECT.id, topicId:'olmayan-konu' } });
      expect(res.ok).toBeFalsy();
    });

    it('bilinmeyen eylem reddedilir', () => {
      const res = P.check({ action:'veriyi-sil', agent:'patron', params:{} });
      expect(res.ok).toBeFalsy();
    });

    it('etkisi olmayan öneri kuyruğa girmez', async () => {
      reset();
      /* Konu zaten acik: tekrara almanin etkisi yok. */
      const row = await P.propose({ action:'topic-review', agent:'tyt',
        params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } });
      expect(row).toBe(null);
      expect(P.pending()).toHaveLength(0);
    });

    it('sınır dışı sayısal parametre reddedilir', async () => {
      reset();
      await M.saveCard(lateCard('c1', '2020-01-01'));
      expect(P.check({ action:'cards-due-today', agent:'analist',
        params:{ limit:0 } }).ok).toBeFalsy();
      expect(P.check({ action:'cards-due-today', agent:'analist',
        params:{ limit:999 } }).ok).toBeFalsy();
    });
  });

  /* ==================== onay kapisi ==================== */

  describe('Öneri — onay kapısı', () => {
    it('öneri kaydedilir ama HİÇBİR ŞEY değişmez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        const row = await P.propose({ action:'topic-review', agent:'tyt',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id },
          reason:'Üzerinde açık yanlış var.' });

        expect(row.status).toBe('pending');
        /* Onay verilmedi: veri elle sürülmemiş olmalı. */
        expect(M.topicState(SUBJECT.id, TOPIC.id).state).toBe('closed');
      });
    });

    it('onaylanınca uygulanır, geri alınınca eski hâline döner', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        const row = await P.propose({ action:'topic-review', agent:'tyt',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } });

        const res = await P.approve(row.id);
        expect(res.ok).toBeTruthy();
        expect(M.topicState(SUBJECT.id, TOPIC.id).state).toBe('reopened');
        expect(P.all()[0].status).toBe('applied');

        await P.undo(row.id);
        expect(M.topicState(SUBJECT.id, TOPIC.id).state).toBe('closed');
        expect(P.all()[0].status).toBe('undone');
      });
    });

    it('reddedilen öneri uygulanmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        const row = await P.propose({ action:'topic-review', agent:'tyt',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } });
        await P.reject(row.id);
        expect(M.topicState(SUBJECT.id, TOPIC.id).state).toBe('closed');
        expect(await P.approve(row.id)).toBe(null);
      });
    });

    it('onay anında veri değiştiyse öneri bayatlar, uygulanmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        const row = await P.propose({ action:'topic-review', agent:'tyt',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } });

        /* Kullanici oneriyi gordukten sonra konuyu kendisi acti. */
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'learning' });

        const res = await P.approve(row.id);
        expect(res.ok).toBeFalsy();
        expect(P.all()[0].status).toBe('stale');
        expect(M.topicState(SUBJECT.id, TOPIC.id).state).toBe('learning');
      });
    });

    it('aynı öneri iki kez kuyruğa girmez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        const p = { action:'topic-review', agent:'tyt',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } };
        expect(await P.propose(p)).toBeTruthy();
        expect(await P.propose(p)).toBe(null);
        expect(P.pending()).toHaveLength(1);
      });
    });

    it('geçersizleşen bekleyen öneri kullanıcıya gösterilmez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        await P.propose({ action:'topic-review', agent:'tyt',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } });
        expect(P.actionable()).toHaveLength(1);

        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'learning' });
        expect(P.pending()).toHaveLength(1);
        expect(P.actionable()).toHaveLength(0);
      });
    });
  });

  /* ==================== onizleme ==================== */

  describe('Öneri — önizleme', () => {
    it('ne değişeceği önce/sonra olarak gösterilir', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        const pv = P.preview({ action:'topic-review', agent:'tyt',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } });
        expect(pv.ok).toBeTruthy();
        expect(pv.rows.length >= 2).toBeTruthy();
        const durum = pv.rows.find(r => r.label === 'Durum');
        expect(durum.before).toBe('Kapalı');
        expect(durum.after).toBe('Yeniden açıldı');
      });
    });

    it('uygulanamayan öneri nedenini söyler', () => {
      reset();
      const pv = P.preview({ action:'card-from-error', agent:'analist',
        params:{ errorId:'yok' } });
      expect(pv.ok).toBeFalsy();
      expect(pv.why.length > 5).toBeTruthy();
    });
  });

  /* ==================== eylemler ==================== */

  describe('Öneri — eylemler', () => {
    it('geciken tekrarlar bugüne çekilir ve geri alınır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.saveCard(lateCard('c1', '2026-11-01'));
        await M.saveCard(lateCard('c2', '2026-11-05'));
        await M.saveCard(lateCard('c3', '2027-01-01'));   // gecikmemis

        const row = await P.propose({ action:'cards-due-today', agent:'analist',
          params:{ limit:10 } });
        await P.approve(row.id);

        expect(S.cards.find(c => c.id === 'c1').dueAt).toBe(TODAY);
        expect(S.cards.find(c => c.id === 'c2').dueAt).toBe(TODAY);
        /* Gecikmeyen kart ellenmez. */
        expect(S.cards.find(c => c.id === 'c3').dueAt).toBe('2027-01-01');

        await P.undo(row.id);
        expect(S.cards.find(c => c.id === 'c1').dueAt).toBe('2026-11-01');
        expect(S.cards.find(c => c.id === 'c2').dueAt).toBe('2026-11-05');
      });
    });

    it('bugüne blok eklenir ve geri alınır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const day = await M.ensureDay(TODAY);
        const before = day.blocks.length;

        const row = await P.propose({ action:'block-add', agent:'rehber',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id, minutes:40 } });
        await P.approve(row.id);
        expect(M.dayOf(TODAY).blocks).toHaveLength(before + 1);

        await P.undo(row.id);
        expect(M.dayOf(TODAY).blocks).toHaveLength(before);
      });
    });

    it('blok süresi sınır dışındaysa öneri doğmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.ensureDay(TODAY);
        expect(P.check({ action:'block-add', agent:'rehber',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id, minutes:5 } }).ok).toBeFalsy();
        expect(P.check({ action:'block-add', agent:'rehber',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id, minutes:400 } }).ok).toBeFalsy();
      });
    });

    it('açık yanlıştan kart üretilir ve geri alınır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.saveError({ id:'e1', closedAt:null, topic:'Sözcükte anlam',
          rootCause:'Bağlamı okumadım', principle:'Önce cümleyi bitir',
          subjectId:SUBJECT.id, topicId:TOPIC.id });

        const row = await P.propose({ action:'card-from-error', agent:'analist',
          params:{ errorId:'e1' } });
        await P.approve(row.id);

        const card = S.cards.find(c => c.sourceRef === 'e1');
        expect(!!card).toBeTruthy();
        expect(card.back).toBe('Önce cümleyi bitir');

        await P.undo(row.id);
        expect(S.cards.some(c => c.sourceRef === 'e1')).toBeFalsy();
      });
    });

    it('aynı yanlıştan ikinci kart üretilmez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.saveError({ id:'e1', closedAt:null, topic:'Konu',
          rootCause:'sebep', principle:'ilke', subjectId:SUBJECT.id, topicId:TOPIC.id });
        const row = await P.propose({ action:'card-from-error', agent:'analist',
          params:{ errorId:'e1' } });
        await P.approve(row.id);
        expect(P.check({ action:'card-from-error', agent:'analist',
          params:{ errorId:'e1' } }).ok).toBeFalsy();
      });
    });

    it('ilkesi yazılmamış yanlış karta dönüştürülemez', async () => {
      reset();
      await M.saveError({ id:'e2', closedAt:null, topic:'Konu', rootCause:'sebep',
        principle:'', recipe:'' });
      expect(P.check({ action:'card-from-error', agent:'analist',
        params:{ errorId:'e2' } }).ok).toBeFalsy();
    });

    it('haftalık hedef güncellenir ve geri alınır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const n = M.currentWeek();
        const week = await M.ensureWeek(n);
        const before = week.questionTarget;

        const row = await P.propose({ action:'week-target', agent:'patron',
          params:{ weekN:n, questionTarget:before + 120 } });
        await P.approve(row.id);
        expect(S.weeks[M.weekId(n)].questionTarget).toBe(before + 120);

        await P.undo(row.id);
        expect(S.weeks[M.weekId(n)].questionTarget).toBe(before);
      });
    });

    it('açık karar kapatılır ve geri alınınca yeniden açılır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        S.officeMeetings = [{
          id:'m1', at:new Date().toISOString(), topic:'Gündem', turns:[],
          decision:{ id:'m1', title:'Analiz borcunu kapat', topic:'Gündem',
            at:new Date().toISOString(), state:'open', closedAt:null },
        }];
        expect(R.Office.openDecisions()).toHaveLength(1);

        const row = await P.propose({ action:'decision-close', agent:'patron',
          params:{ decisionId:'m1', state:'done' } });
        await P.approve(row.id);
        expect(R.Office.openDecisions()).toHaveLength(0);

        await P.undo(row.id);
        expect(R.Office.openDecisions()).toHaveLength(1);
        expect(S.officeMeetings[0].decision.closedAt).toBe(null);
      });
    });
  });

  /* ==================== yeni eylemler ==================== */

  describe('Öneri — blok taşıma', () => {
    it('atlanan blok yarına taşınır ve geri alınır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const day = await M.ensureDay(TODAY);
        day.blocks[0].status = 'skipped';
        await M.saveDay(TODAY);
        const yarin = U.iso(U.addDays(U.parse(TODAY), 1));

        const row = await P.propose({ action:'block-move', agent:'rehber',
          params:{ blockId:day.blocks[0].id } });
        await P.approve(row.id);

        const dst = M.dayOf(yarin);
        expect(dst.blocks.some(b => b.movedFrom === day.blocks[0].id)).toBeTruthy();
        expect(dst.blocks.some(b => b.slot === 'Telafi')).toBeTruthy();

        await P.undo(row.id);
        expect(M.dayOf(yarin).blocks.some(b => b.movedFrom === day.blocks[0].id)).toBeFalsy();
      });
    });

    it('atlanmamış blok taşınmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const day = await M.ensureDay(TODAY);
        expect(P.check({ action:'block-move', agent:'rehber',
          params:{ blockId:day.blocks[0].id } }).ok).toBeFalsy();
      });
    });

    it('aynı blok iki kez taşınmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const day = await M.ensureDay(TODAY);
        day.blocks[0].status = 'skipped';
        await M.saveDay(TODAY);
        const row = await P.propose({ action:'block-move', agent:'rehber',
          params:{ blockId:day.blocks[0].id } });
        await P.approve(row.id);
        expect(P.check({ action:'block-move', agent:'rehber',
          params:{ blockId:day.blocks[0].id } }).ok).toBeFalsy();
      });
    });
  });

  describe('Öneri — deneme analizi', () => {
    function tamProtokol(){
      const p = {};
      R.ANALYSIS_PROTOCOL.forEach(x => { p[x.key] = true; });
      return p;
    }

    it('protokolü biten deneme kapatılır ve geri alınır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.saveExam({ id:'e1', date:TODAY, type:'TYT Genel', family:'TYT',
          kind:'full', tests:[], protocol:tamProtokol(), analysisCompletedAt:null });

        const row = await P.propose({ action:'exam-analysis-done', agent:'analist',
          params:{ examId:'e1' } });
        await P.approve(row.id);
        expect(!!S.exams.find(e => e.id === 'e1').analysisCompletedAt).toBeTruthy();

        await P.undo(row.id);
        expect(S.exams.find(e => e.id === 'e1').analysisCompletedAt).toBe(null);
      });
    });

    it('protokolü yarım deneme kapatılamaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.saveExam({ id:'e2', date:TODAY, type:'TYT Genel', family:'TYT',
          kind:'full', tests:[], protocol:{ score:true }, analysisCompletedAt:null });
        /* Yapilmamis analizi "yapildi" saymak olcumu bozar. */
        const res = P.check({ action:'exam-analysis-done', agent:'analist',
          params:{ examId:'e2' } });
        expect(res.ok).toBeFalsy();
        expect(res.why).toContain('işaretsiz');
      });
    });
  });

  describe('Öneri — uyku hedefi', () => {
    it('hedef güncellenir ve geri alınır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const before = S.profile.sleepTarget;
        const row = await P.propose({ action:'sleep-target', agent:'rehber',
          params:{ hours:8 } });
        await P.approve(row.id);
        expect(S.profile.sleepTarget).toBe(8);
        await P.undo(row.id);
        expect(S.profile.sleepTarget).toBe(before);
      });
    });

    it('mantıksız hedef reddedilir', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        expect(P.check({ action:'sleep-target', agent:'rehber', params:{ hours:3 } }).ok).toBeFalsy();
        expect(P.check({ action:'sleep-target', agent:'rehber', params:{ hours:14 } }).ok).toBeFalsy();
      });
    });

    it('kural motoru uyku hedefini kendiliğinden önermez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        /* Hedefi kendiliginden dusurmek "uykudan feda ettirme" yasagiyla
           ayni kapiya cikar; bu eylem yalniz ajan konusurken onerilebilir. */
        expect(P.suggest().some(x => x.action === 'sleep-target')).toBeFalsy();
      });
    });
  });

  describe('Öneri — haftaya konu alma', () => {
    it('konu haftanın planına eklenir ve geri alınır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const n = M.currentWeek();
        const week = await M.ensureWeek(n);
        week.mainTopics = [];
        await M.saveWeek(n);

        const row = await P.propose({ action:'week-topic-add', agent:'tyt',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } });
        await P.approve(row.id);
        expect(S.weeks[M.weekId(n)].mainTopics.some(t => t.topicId === TOPIC.id)).toBeTruthy();

        await P.undo(row.id);
        expect(S.weeks[M.weekId(n)].mainTopics.some(t => t.topicId === TOPIC.id)).toBeFalsy();
      });
    });

    it('imzalanmış haftanın sözleşmesi değiştirilmez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const n = M.currentWeek();
        const week = await M.ensureWeek(n);
        week.mainTopics = [];
        week.signedAt = new Date().toISOString();
        await M.saveWeek(n);
        const res = P.check({ action:'week-topic-add', agent:'tyt',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } });
        expect(res.ok).toBeFalsy();
        expect(res.why).toContain('imzalanmış');
      });
    });

    it('üç konu doluysa yenisi alınmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const n = M.currentWeek();
        const week = await M.ensureWeek(n);
        week.mainTopics = [{ topicId:'a' }, { topicId:'b' }, { topicId:'c' }];
        await M.saveWeek(n);
        expect(P.check({ action:'week-topic-add', agent:'tyt',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } }).ok).toBeFalsy();
      });
    });
  });

  /* ==================== kural motoru onerileri ==================== */

  describe('Öneri — kural motoru', () => {
    it('geciken kart birikince öneri doğar', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        for(let i = 0; i < 6; i++) await M.saveCard(lateCard('c' + i, '2026-11-01'));
        const found = P.suggest();
        const row = found.find(p => p.action === 'cards-due-today');
        expect(!!row).toBeTruthy();
        expect(row.agent).toBe('analist');
        expect(row.source).toBe('kural');
      });
    });

    it('eşik aşılmadıysa öneri doğmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.saveCard(lateCard('c1', '2026-11-01'));
        expect(P.suggest().some(p => p.action === 'cards-due-today')).toBeFalsy();
      });
    });

    it('kapalı görünen ama açık yanlışı olan konu tekrara önerilir', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        await M.saveError({ id:'e1', closedAt:null, subjectId:SUBJECT.id, topicId:TOPIC.id });
        await M.saveError({ id:'e2', closedAt:null, subjectId:SUBJECT.id, topicId:TOPIC.id });

        const row = P.suggest().find(p => p.action === 'topic-review');
        expect(!!row).toBeTruthy();
        expect(row.params.topicId).toBe(TOPIC.id);
        /* Sahibi dersin sinavina gore secilir. */
        expect(row.agent).toBe(SUBJECT.exam === 'TYT' ? 'tyt' : 'ayt');
      });
    });

    it('atlanan blok için taşıma önerilir', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const day = await M.ensureDay(TODAY);
        day.blocks[0].status = 'skipped';
        await M.saveDay(TODAY);
        const row = P.suggest().find(x => x.action === 'block-move');
        expect(!!row).toBeTruthy();
        expect(row.agent).toBe('rehber');
      });
    });

    it('protokolü biten ama kapanmayan deneme için öneri doğar', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const protocol = {};
        R.ANALYSIS_PROTOCOL.forEach(x => { protocol[x.key] = true; });
        await M.saveExam({ id:'e1', date:TODAY, type:'TYT Genel', family:'TYT',
          kind:'full', tests:[], protocol, analysisCompletedAt:null });
        const row = P.suggest().find(x => x.action === 'exam-analysis-done');
        expect(!!row).toBeTruthy();
        expect(row.agent).toBe('analist');
      });
    });

    it('risk sırasındaki konu haftaya alınması için önerilir', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const n = M.currentWeek();
        const week = await M.ensureWeek(n);
        week.mainTopics = [];
        week.signedAt = null;
        await M.saveWeek(n);
        /* Riski yukseltmek icin acik yanlis birak. */
        await M.saveError({ id:'e1', closedAt:null, subjectId:SUBJECT.id, topicId:TOPIC.id });
        const row = P.suggest().find(x => x.action === 'week-topic-add');
        expect(!!row).toBeTruthy();
        expect(['tyt', 'ayt'].indexOf(row.agent) >= 0).toBeTruthy();
      });
    });

    it('refresh önerileri kuyruğa alır, tekrarlamaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        for(let i = 0; i < 6; i++) await M.saveCard(lateCard('c' + i, '2026-11-01'));
        const first = await P.refresh();
        expect(first.length >= 1).toBeTruthy();
        const second = await P.refresh();
        expect(second).toHaveLength(0);
      });
    });
  });

  /* ==================== modelin onerisi ==================== */

  describe('Öneri — modelin önerisi', () => {
    it('katalog dışı eylem uydurulamaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        expect(P.fromModel('patron', { eylem:'tum-veriyi-sil', parametreler:{} })).toBe(null);
      });
    });

    it('alanı dışındaki eylem kabul edilmez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        expect(P.fromModel('rehber', { eylem:'topic-review',
          parametreler:{ subjectId:SUBJECT.id, topicId:TOPIC.id } })).toBe(null);
      });
    });

    it('eksik parametre öneriyi düşürür', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        expect(P.fromModel('tyt', { eylem:'topic-review',
          parametreler:{ subjectId:SUBJECT.id } })).toBe(null);
      });
    });

    it('fazladan alan taşınmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        const p = P.fromModel('tyt', { eylem:'topic-review', parametreler:{
          subjectId:SUBJECT.id, topicId:TOPIC.id, sil:'hepsini' } });
        expect(Object.keys(p.params).sort()).toEqual(['subjectId', 'topicId']);
      });
    });

    it('sayısal parametre sayı olmalıdır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.saveCard(lateCard('c1', '2026-11-01'));
        expect(P.fromModel('analist', { eylem:'cards-due-today',
          parametreler:{ limit:'çok' } })).toBe(null);
        expect(P.fromModel('analist', { eylem:'cards-due-today',
          parametreler:{ limit:'3' } }).params.limit).toBe(3);
      });
    });

    it('geçerli öneri kaynağıyla birlikte gelir', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        const p = P.fromModel('tyt', { eylem:'topic-review',
          parametreler:{ subjectId:SUBJECT.id, topicId:TOPIC.id },
          gerekce:'Üzerinde açık yanlış var.' });
        expect(p.source).toBe('llm');
        expect(p.reason).toContain('açık yanlış');
      });
    });

    it('yanıt metni ile eylem nesnesi ayrılır', () => {
      const out = P.splitAction('Türkçede net kaybın var.\n'
        + '{"eylem":"topic-review","parametreler":{"subjectId":"a","topicId":"b"}}');
      expect(out.text).toBe('Türkçede net kaybın var.');
      expect(out.obj.eylem).toBe('topic-review');
    });

    it('kod çerçevesi içindeki nesne de ayrılır', () => {
      const out = P.splitAction('Bir bakalım.\n```json\n{"eylem":"block-add","parametreler":{}}\n```');
      expect(out.text).toBe('Bir bakalım.');
      expect(out.obj.eylem).toBe('block-add');
    });

    it('JSON yoksa metne dokunulmaz', () => {
      const out = P.splitAction('Bu hafta matematiğe dön.');
      expect(out.text).toBe('Bu hafta matematiğe dön.');
      expect(out.obj).toBe(null);
    });

    it('akışta yarım kalan eylem nesnesi gizlenir', () => {
      expect(P.stripTrailingJson('Net kaybın var. {"eylem":"topic-rev'))
        .toBe('Net kaybın var.');
      /* Duz metindeki suslu parantez kirpilmaz. */
      expect(P.stripTrailingJson('Küme {1,2} gibi düşün.'))
        .toBe('Küme {1,2} gibi düşün.');
    });

    it('istem ajanın yalnız kendi eylemlerini anlatır', () => {
      const prompt = P.catalogPrompt('analist');
      expect(prompt).toContain('cards-due-today');
      expect(prompt.indexOf('week-target')).toBe(-1);
      expect(prompt).toContain('onayına');
    });
  });
})();
