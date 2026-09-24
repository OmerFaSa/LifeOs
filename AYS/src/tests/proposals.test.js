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
    S.officeProposalKeys = [];
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

    it('tek dokunuş: aynı katalogdan geçer, bekleyen öneriyi kullanır, geri alınır', async () => {
      /* Fikir 22: yanlış defterindeki «Tekrar kartı yap» öneri kuyruğunu
         beklemez ama doğrulamayı ve geri almayı atlamaz. */
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.saveError({ id:'e3', closedAt:null, topic:'Paragraf', tag:'K',
          rootCause:'', principle:'', recipe:'Ana fikri önce bul', subjectId:SUBJECT.id, topicId:TOPIC.id });
        /* Ofis zaten öneri kurmuş olabilir: ikinci satır açılmaz, o onaylanır. */
        const bekleyen = await P.propose({ action:'card-from-error', agent:'analist', params:{ errorId:'e3' } });
        const r = await P.hemen({ action:'card-from-error', params:{ errorId:'e3' } });
        expect(r.ok).toBe(true);
        expect(r.row.id).toBe(bekleyen.id);
        expect(S.cards.filter(c => c.sourceRef === 'e3').length).toBe(1);
        expect((await P.hemen({ action:'card-from-error', params:{ errorId:'e3' } })).ok).toBe(false);
        await P.undo(r.row.id);
        expect(S.cards.some(c => c.sourceRef === 'e3')).toBe(false);
        /* Doğrulamadan geçmeyen eylem yazılmaz ve nedeni söylenir. */
        await M.saveError({ id:'e4', closedAt:null, topic:'X', principle:'', recipe:'' });
        const y = await P.hemen({ action:'card-from-error', params:{ errorId:'e4' } });
        expect(y.ok).toBe(false);
        expect(y.why).toContain('ilke');
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

  /* ==================== seviye ve otomatik uygulama ====================

     AGENTS.md §1.9: aksiyonun seviyesini KATALOG belirler, model değil.
     Küçük aksiyon, kullanıcı İSTEDİYSE sormadan uygulanır ve geri
     alınabilir kalır; ajanın kendi bulduğu küçük aksiyon yalnız kullanıcı
     buna izin verdiyse uygulanır. Orta ve büyük her zaman onay bekler. */

  describe('Öneri — seviye', () => {
    it('her eylemin geçerli bir seviyesi vardır', () => {
      R.ACTIONS.forEach(a => {
        expect(['kucuk', 'orta', 'buyuk'].indexOf(a.level) >= 0).toBeTruthy();
      });
    });

    it('birden çok kaydı birden değiştiren eylem küçük değildir', () => {
      expect(R.ACTION_BY_ID['cards-due-today'].level).toBe('orta');
      expect(R.ACTION_BY_ID['topic-review'].level).toBe('kucuk');
    });

    it('seviye öneriye katalogdan yazılır; öneren değiştiremez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        for(let i = 0; i < 3; i++) await M.saveCard(lateCard('c' + i, '2026-11-01'));
        const row = await P.propose({ action:'cards-due-today', agent:'analist',
          params:{ limit:3 }, level:'kucuk', seviye:'kucuk' });
        expect(row.level).toBe('orta');
      });
    });
  });

  describe('Öneri — otomatik uygulama', () => {
    async function kapaliKonu(){
      await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
      return { action:'topic-review', agent:'tyt',
        params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } };
    }

    it('karar tablosu: kaynak × seviye × ayar', () => {
      const k = { level:'kucuk' }, o = { level:'orta' }, b = { level:'buyuk' };
      const ist = s => Object.assign({ source:'istek' }, s);
      const kur = s => Object.assign({ source:'kural' }, s);
      const llm = s => Object.assign({ source:'llm' }, s);
      /* varsayılan: yalnız istenen küçük */
      expect(P.otomatikMi(ist(k), 'istek')).toBe(true);
      expect(P.otomatikMi(kur(k), 'istek')).toBe(false);
      expect(P.otomatikMi(llm(k), 'istek')).toBe(false);
      /* hepsi: ajanın küçük önerisi de */
      expect(P.otomatikMi(kur(k), 'hepsi')).toBe(true);
      expect(P.otomatikMi(llm(k), 'hepsi')).toBe(true);
      /* hiçbiri: istenen küçük de sorar */
      expect(P.otomatikMi(ist(k), 'hicbiri')).toBe(false);
      /* orta ve büyük hiçbir ayarda kendiliğinden uygulanmaz */
      ['istek', 'hepsi', 'hicbiri'].forEach(m => {
        expect(P.otomatikMi(ist(o), m)).toBe(false);
        expect(P.otomatikMi(ist(b), m)).toBe(false);
      });
      /* bilinmeyen ayar güvenli tarafa düşer: varsayılan gibi davranır */
      expect(P.otomatikMi(kur(k), 'bozuk')).toBe(false);
      expect(P.otomatikMi(ist(k), undefined)).toBe(true);
    });

    it('istenen küçük aksiyon sormadan uygulanır ve geri alınabilir', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const p = await kapaliKonu();
        const res = await P.talep(Object.assign({ source:'istek' }, p));
        expect(res.otomatik).toBe(true);
        expect(res.row.status).toBe('applied');
        expect(M.topicState(SUBJECT.id, TOPIC.id).state).toBe('reopened');
        await P.undo(res.row.id);
        expect(M.topicState(SUBJECT.id, TOPIC.id).state).toBe('closed');
      });
    });

    it('ajanın kendi bulduğu küçük aksiyon varsayılan ayarda onay bekler', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const p = await kapaliKonu();
        const res = await P.talep(Object.assign({ source:'kural' }, p));
        expect(res.otomatik).toBe(false);
        expect(res.row.status).toBe('pending');
        expect(M.topicState(SUBJECT.id, TOPIC.id).state).toBe('closed');
      });
    });

    it('«hiçbiri» ayarında istenen küçük aksiyon da onay bekler', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await R.Office.saveSettings({ otomatikUygula:'hicbiri' });
        const p = await kapaliKonu();
        const res = await P.talep(Object.assign({ source:'istek' }, p));
        expect(res.otomatik).toBe(false);
        expect(M.topicState(SUBJECT.id, TOPIC.id).state).toBe('closed');
      });
    });

    it('istenen orta aksiyon sormadan uygulanmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        for(let i = 0; i < 3; i++) await M.saveCard(lateCard('c' + i, '2026-11-01'));
        const res = await P.talep({ action:'cards-due-today', agent:'analist',
          params:{ limit:3 }, source:'istek' });
        expect(res.otomatik).toBe(false);
        expect(res.row.status).toBe('pending');
        expect(S.cards.every(c => c.dueAt === '2026-11-01')).toBeTruthy();
      });
    });

    it('geçersiz talep hiçbir şey yazmaz', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const res = await P.talep({ action:'topic-review', agent:'tyt', source:'istek',
          params:{ subjectId:SUBJECT.id, topicId:'olmayan' } });
        expect(res.row).toBe(null);
        expect(res.why.length > 3).toBeTruthy();
        expect(P.all()).toHaveLength(0);
      });
    });
  });

  /* ==================== iz ve tek uygulama ====================

     Dışarıdan (HKM, BAM) gelen bir teklif ağ yüzünden iki kez gelebilir.
     Aynı ANAHTAR ikinci kez kuyruğa girmez — uygulanmış, geri alınmış ya
     da reddedilmiş olsa bile. İz, «bu değişiklik nereden geldi?»
     sorusunun cevabıdır ve temizlenerek saklanır. */

  describe('Öneri — iz ve tek uygulama', () => {
    it('aynı anahtar ikinci kez kuyruğa girmez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        const p = { action:'topic-review', agent:'tyt', anahtar:'bam:teklif:91',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id } };
        const ilk = await P.propose(p);
        await P.approve(ilk.id);
        await P.undo(ilk.id);
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        expect(await P.propose(p)).toBe(null);
      });
    });

    it('anahtarsız veri girişi tekrar edilebilir', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.ensureDay(TODAY);
        const p = { action:'paragraf-yaz', agent:'patron', source:'istek',
          params:{ count:10, date:TODAY } };
        /* Ölçüm yazan eylem onay bekler (KR-1); onaylanan iki ayrı giriş
           ikisi de yazılır. */
        const a = await P.talep(p);
        expect(a.row.status).toBe('pending');
        expect((await P.approve(a.row.id)).ok).toBe(true);
        const b = await P.talep(p);
        expect(b.row.status).toBe('pending');
        expect((await P.approve(b.row.id)).ok).toBe(true);
        expect(S.days[TODAY].paragraphActual).toBe(20);
      });
    });

    it('iz temizlenerek saklanır', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        await M.setTopicState(SUBJECT.id, TOPIC.id, { state:'closed' });
        const row = await P.propose({ action:'topic-review', agent:'tyt',
          params:{ subjectId:SUBJECT.id, topicId:TOPIC.id },
          iz:[{ tur:'arastirma', id:'184' }, { tur:'plan', id:52 },
              'bozuk', { tur:'', id:'x' }, { tur:'teklif', id:'91', fazla:'alan' }] });
        expect(row.iz).toEqual([{ tur:'arastirma', id:'184' }, { tur:'plan', id:'52' },
          { tur:'teklif', id:'91' }]);
      });
    });
  });
  /* ==================== geri alma: fark tabanlı (HATALAR Y-6) ====================

     «Geri al» eski değeri MUTLAK yazıyordu: sabah 40, akşam 20 soru girilip
     sabahki geri alınınca 60 → 0 oluyor, akşamki geri alınınca geri
     alınmış 40 diriliyordu; blok «tamamlandı» kalıyordu. Geri alma yalnız
     O kaydın yaptığını geri çevirir: sonraki kaydı ve elle düzenlemeyi
     silmez, girilmemiş alanı sıfıra çevirmez. */

  describe('Öneri — geri alma sırası (Y-6)', () => {
    const mat = () => (R.SUBJECTS || []).find(x => (x.aliases || []).indexOf('matematik') >= 0) || SUBJECT;
    async function gun(){
      reset();
      await M.ensureDay(TODAY);
      S.days[TODAY].freeQ = 0; S.days[TODAY].freeCorrect = 0;
      S.days[TODAY].paragraphActual = 0; S.days[TODAY].sleepHours = null;
      S.days[TODAY].blocks = [{ id:'b1', slot:'Ders', subject:mat().name, subjectId:mat().id,
        topic:'Türev', topicId:null, targetMin:60, targetQ:0, status:'pending',
        actualMin:null, actualQ:null, correctQ:null }];
      return S.days[TODAY];
    }
    const yaz = (action, params) => P.hemen({ action, params:Object.assign({ date:TODAY }, params) });

    it('toplamalı kayıt: sıradan bağımsız, sonraki kaydı silmez, geri alınan dirilmez', async () => {
      await withTodayAsync(TODAY, async () => {
        const d = await gun();
        const a = await yaz('soru-yaz', { count:40 });
        const b = await yaz('soru-yaz', { count:20 });
        expect(d.freeQ).toBe(60);
        await P.undo(a.row.id);
        expect(d.freeQ).toBe(20);
        await P.undo(b.row.id);
        expect(d.freeQ).toBe(0);

        const c = await yaz('paragraf-yaz', { count:10 });
        const e = await yaz('paragraf-yaz', { count:5 });
        await P.undo(e.row.id);
        expect(d.paragraphActual).toBe(10);
        await P.undo(c.row.id);
        expect(d.paragraphActual).toBe(0);
      });
    });

    it('bloğa yazılan soru ve doğru: girilmemiş alan geri alınınca yine girilmemiş, blok «bekliyor»', async () => {
      await withTodayAsync(TODAY, async () => {
        const d = await gun();
        const b = d.blocks[0];
        const a = await yaz('soru-yaz', { count:40, correct:30, subjectId:mat().id });
        const c = await yaz('soru-yaz', { count:20, correct:15, subjectId:mat().id });
        expect([b.actualQ, b.correctQ, b.status]).toEqual([60, 45, 'done']);
        await P.undo(a.row.id);
        expect([b.actualQ, b.correctQ, b.status]).toEqual([20, 15, 'done']);
        await P.undo(c.row.id);
        expect([b.actualQ, b.correctQ, b.status]).toEqual([null, null, 'pending']);
      });
    });

    it('süre kaydı geri alınınca blok durumu da geri döner; başka iş kaldıysa «tamamlandı» kalır', async () => {
      await withTodayAsync(TODAY, async () => {
        const d = await gun();
        const b = d.blocks[0];
        const a = await yaz('sure-yaz', { minutes:60, subjectId:mat().id });
        expect([b.actualMin, b.status]).toEqual([60, 'done']);
        await P.undo(a.row.id);
        expect([b.actualMin, b.status]).toEqual([null, 'pending']);

        const s1 = await yaz('sure-yaz', { minutes:60, subjectId:mat().id });
        const q1 = await yaz('soru-yaz', { count:20, subjectId:mat().id });
        await P.undo(s1.row.id);
        expect([b.actualMin, b.actualQ, b.status]).toEqual([null, 20, 'done']);
        await P.undo(q1.row.id);
        expect([b.actualMin, b.actualQ, b.status]).toEqual([null, null, 'pending']);
      });
    });

    it('değer yazan kayıt: sonraki değeri ezmez, geri alınmış değer dirilmez', async () => {
      await withTodayAsync(TODAY, async () => {
        const d = await gun();
        const a = await yaz('uyku-yaz', { hours:7 });
        const b = await yaz('uyku-yaz', { hours:7.5 });
        await P.undo(a.row.id);
        expect(d.sleepHours).toBe(7.5);
        await P.undo(b.row.id);
        expect(d.sleepHours).toBe(null);
        /* aynı değer iki kez */
        const c = await yaz('uyku-yaz', { hours:7 });
        const e = await yaz('uyku-yaz', { hours:7 });
        await P.undo(c.row.id);
        expect(d.sleepHours).toBe(7);
        await P.undo(e.row.id);
        expect(d.sleepHours).toBe(null);
      });
    });

    it('sonradan elle yapılan düzenleme silinmez', async () => {
      await withTodayAsync(TODAY, async () => {
        const d = await gun();
        const a = await yaz('uyku-yaz', { hours:7 });
        d.sleepHours = 8;
        await P.undo(a.row.id);
        expect(d.sleepHours).toBe(8);
        const q = await yaz('soru-yaz', { count:40 });
        d.freeQ = 10;                 /* elle azaltılmış: 40 çıkarılamaz */
        await P.undo(q.row.id);
        expect(d.freeQ).toBe(10);
        const r = await yaz('soru-yaz', { count:20 });
        d.freeQ += 5;                 /* elle eklenmiş 5 kalır */
        await P.undo(r.row.id);
        expect(d.freeQ).toBe(15);
      });
    });

    it('haftalık hedef: sonraki hedef değişikliğini ezmez', async () => {
      await withTodayAsync(TODAY, async () => {
        reset();
        const n = M.currentWeek();
        await M.ensureWeek(n);
        const w = S.weeks[M.weekId(n)];
        const once = w.questionTarget;
        const a = await P.hemen({ action:'week-target', params:{ weekN:n, questionTarget:once === 600 ? 650 : 600 } });
        const b = await P.hemen({ action:'week-target', params:{ weekN:n, questionTarget:700 } });
        await P.undo(a.row.id);
        expect(w.questionTarget).toBe(700);
        await P.undo(b.row.id);
        expect(w.questionTarget).toBe(once);
      });
    });

    it('eski biçimli anlık görüntü (fark bilgisi yok) önerinin parametresinden geri alınır', async () => {
      await withTodayAsync(TODAY, async () => {
        const d = await gun();
        const a = await yaz('soru-yaz', { count:40 });
        const b = await yaz('soru-yaz', { count:20 });
        delete a.row.undo.n; delete a.row.undo.dogru; delete a.row.sira;
        delete b.row.undo.n; delete b.row.undo.dogru;
        await P.undo(a.row.id);
        expect(d.freeQ).toBe(20);
      });
    });
  });
})();
