/* Puan/sıra tahmini, konu riski, günün akışı, mola, ödül ve sınama motoru. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync, examWithNet } = R.Test;
  const C = R.Calc, M = R.Model, U = R.U, S = R.S, Q = R.Quiz;

  async function withExams(nets, fn){
    resetState();
    for(let i = 0; i < nets.length; i++){
      const d = U.iso(U.addDays(U.parse('2026-11-01'), i*7));
      await M.saveExam(examWithNet(d, nets[i], 'TYT'));
    }
    return fn();
  }

  describe('Puan tahmini', function(){
    it('3 denemeden azsa tahmin üretmez', function(){
      resetState();
      const est = C.estimateScore();
      expect(est.ok).toBeFalsy();
      expect(est.position).toBe('unknown');
    });
    it('3 denemede bant üretir', async function(){
      await withTodayAsync('2026-11-20', async () => {
        await withExams([40, 44, 42], () => {
          const est = C.estimateScore();
          expect(est.ok).toBeTruthy();
          expect(est.samples).toBe(3);
          expect(est.scoreLow).toBeLessThan(est.score);
          expect(est.scoreHigh).toBeGreaterThan(est.score);
        });
      });
    });
    it('deneme arttıkça bant daralır', async function(){
      await withTodayAsync('2026-11-20', async () => {
        let few, many;
        await withExams([40, 44, 42], () => { few = C.estimateScore().halfWidth; });
        await withExams([40, 44, 42, 43, 45, 44, 46, 45], () => { many = C.estimateScore().halfWidth; });
        expect(many).toBeLessThan(few);
      });
    });
    it('sıra bandı ters yönlüdür: iyi puan küçük sıra', async function(){
      await withTodayAsync('2026-11-20', async () => {
        await withExams([50, 52, 51], () => {
          const est = C.estimateScore();
          expect(est.rankBest).toBeLessThan(est.rankWorst);
        });
      });
    });
    it('daha yüksek net daha iyi sıra verir', async function(){
      await withTodayAsync('2026-11-20', async () => {
        let low, high;
        await withExams([30, 30, 30], () => { low = C.estimateScore().rank; });
        await withExams([70, 70, 70], () => { high = C.estimateScore().rank; });
        expect(high).toBeLessThan(low);
      });
    });
    it('sıra tablosu uçlarda kırpılır', function(){
      expect(C.rankForScore(600)).toBe(1);
      expect(C.rankForScore(50)).toBe(900000);
    });
    it('puan tabanın altına düşmez', function(){
      expect(C.rawScore(-50, null).value).toBe(R.SCORING.base);
    });
    it('hedefe net farkı yön verir', async function(){
      await withTodayAsync('2026-11-20', async () => {
        await withExams([30, 30, 30], () => {
          const gap = C.netGapToTarget();
          expect(gap).toBeTruthy();
          expect(gap.reached).toBeFalsy();
          expect(gap.netDiff).toBeGreaterThan(0);
        });
      });
    });
    it('konum etiketi tanımlı bir bandı gösterir', async function(){
      await withTodayAsync('2026-11-20', async () => {
        await withExams([45, 45, 45], () => {
          const est = C.estimateScore();
          expect(R.SCORING.positions.some(p => p.key === est.position)).toBeTruthy();
          expect(est.meta.label.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Konu riski', function(){
    const SID = 'tyt-turkce';
    function firstTopic(){ return R.SUBJECTS.find(s => s.id === SID).topics[0]; }

    it('bilinmeyen konu için null döner', function(){
      resetState();
      expect(C.topicRisk('yok', 'yok')).toBeNull();
    });
    it('başlanmamış konu risk üretir', async function(){
      resetState();
      await M.ensureTopics(SID);
      const r = C.topicRisk(SID, firstTopic().id);
      expect(r.score).toBeGreaterThan(0);
      expect(r.state).toBe('not_started');
    });
    it('kapanan konunun riski düşer', async function(){
      resetState();
      await M.ensureTopics(SID);
      const id = firstTopic().id;
      const before = C.topicRisk(SID, id).score;
      await M.setTopicState(SID, id, { first:85, firstAt:U.todayISO(), second:80, secondAt:U.todayISO() });
      expect(C.topicRisk(SID, id).score).toBeLessThan(before);
    });
    it('açık yanlış riski yükseltir', async function(){
      resetState();
      await M.ensureTopics(SID);
      const id = firstTopic().id;
      const before = C.topicRisk(SID, id).score;
      for(let i = 0; i < 3; i++){
        S.errors.push({ id:'r'+i, tag:'K', subjectId:SID, topicId:id, closedAt:null });
      }
      expect(C.topicRisk(SID, id).score).toBeGreaterThan(before);
    });
    it('risk 0–100 aralığında kalır', async function(){
      resetState();
      await M.ensureTopics(SID);
      C.riskRanking().forEach(r => {
        expect(r.score >= 0 && r.score <= 100).toBeTruthy();
      });
    });
    it('sıralama azalan gider ve limit uygular', async function(){
      resetState();
      const list = C.riskRanking(5);
      expect(list).toHaveLength(5);
      for(let i = 1; i < list.length; i++) expect(list[i-1].score >= list[i].score).toBeTruthy();
    });
    it('her risk bir banda düşer', function(){
      resetState();
      C.riskRanking(10).forEach(r => {
        expect(['high','mid','low'].indexOf(r.band) >= 0).toBeTruthy();
      });
    });
  });

  describe('Konu bazlı pratik', function(){
    const SID = 'tyt-turkce';
    async function dayWithBlock(iso, patch){
      await withTodayAsync(iso, async () => {
        const day = await M.ensureDay(iso);
        Object.assign(day.blocks[0], patch);
        await M.saveDay(iso);
      });
    }
    it('kayıt yokken doğruluk null', function(){
      resetState();
      expect(C.topicPractice(SID, null).accuracy).toBeNull();
    });
    it('bloklardan çözülen ve doğru toplanır', async function(){
      resetState();
      await dayWithBlock('2026-09-15', { subjectId:SID, topicId:'x', actualQ:20, correctQ:14 });
      await withTodayAsync('2026-09-15', () => {
        const p = C.topicPractice(SID, 'x');
        expect(p.solved).toBe(20);
        expect(p.correct).toBe(14);
        expect(p.accuracy).toBe(70);
      });
    });
    it('başka dersin bloğu sayılmaz', async function(){
      resetState();
      await dayWithBlock('2026-09-15', { subjectId:'tyt-matematik', topicId:'y', actualQ:30, correctQ:10 });
      await withTodayAsync('2026-09-15', () => {
        expect(C.topicPractice(SID, 'x').solved).toBe(0);
      });
    });
    it('düşük doğruluk konu riskini yükseltir', async function(){
      resetState();
      await M.ensureTopics(SID);
      const tid = R.SUBJECTS.find(s => s.id === SID).topics[0].id;
      await withTodayAsync('2026-09-15', async () => {
        await M.setTopicState(SID, tid, { first:85, firstAt:'2026-09-15', second:80, secondAt:'2026-09-15' });
        const before = C.topicRisk(SID, tid).score;
        const day = await M.ensureDay('2026-09-15');
        Object.assign(day.blocks[0], { subjectId:SID, topicId:tid, actualQ:40, correctQ:16 });
        await M.saveDay('2026-09-15');
        expect(C.topicRisk(SID, tid).score).toBeGreaterThan(before);
      });
    });
    it('blok varsayılanı haftanın konusundan ders alır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        const w = await M.ensureWeek(M.currentWeek());
        w.mainTopics[0].subjectId = SID;
        await M.saveWeek(M.currentWeek());
        delete S.days['2026-09-15'];
        await R.Store.remove('days/2026-09-15');
        const day = await M.ensureDay('2026-09-15');
        expect(day.blocks[0].subjectId).toBe(SID);
      });
    });
  });

  describe('Günün akışı', function(){
    it('adımlar ve yüzde tutarlı', function(){
      resetState();
      const f = C.dailyFlow();
      expect(f.total).toBeGreaterThan(0);
      expect(f.done <= f.total).toBeTruthy();
      expect(f.pct).toBe(U.pct(f.done, f.total));
    });
    it('yarım kalan ders adımı ekler', async function(){
      resetState();
      await M.saveVideoNote(M.newVideoNote({ title:'Yarım ders' }));
      expect(C.dailyFlow().steps.some(s => s.key === 'watch')).toBeTruthy();
    });
    it('notu karta dönmemiş ders adımı ekler', async function(){
      resetState();
      const n = M.newVideoNote({ title:'A' });
      n.segments.push({ ts:10, text:'not', tag:'kural' });
      n.done = true;
      await M.saveVideoNote(n);
      expect(C.dailyFlow().steps.some(s => s.key === 'note-cards')).toBeTruthy();
    });
    it('mola alınınca mola adımı tamamlanır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        expect(C.dailyFlow().steps.find(s => s.key === 'break').done).toBeFalsy();
        await M.saveBreak({ activityId:'stretch', minutes:5 });
        expect(C.dailyFlow().steps.find(s => s.key === 'break').done).toBeTruthy();
      });
    });
  });

  describe('Mola önerisi', function(){
    it('üst sınırda öneri kesilir', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        for(let i = 0; i < R.BREAK_RULE.maxPerDay; i++) await M.saveBreak({ activityId:'water' });
        const s = C.suggestBreak();
        expect(s.ok).toBeFalsy();
        expect(s.reason).toContain('mola');
      });
    });
    it('düşük enerjide yalnız düşük enerjili meşgale önerir', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        await M.saveMood('2026-09-15', { energy:1 });
        C.suggestBreak().picks.forEach(a => expect(a.energy).toBe('low'));
      });
    });
    it('öneri sayısı üçü aşmaz ve tekrar etmez', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        const picks = C.suggestBreak().picks;
        expect(picks.length <= 3).toBeTruthy();
        expect(new Set(picks.map(p => p.id)).size).toBe(picks.length);
      });
    });
    it('aynı gün alınan meşgale tekrar önerilmez', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        const first = C.suggestBreak().picks[0];
        await M.saveBreak({ activityId:first.id });
        expect(C.suggestBreak().picks.some(p => p.id === first.id)).toBeFalsy();
      });
    });
  });

  describe('Günün ödülü', function(){
    it('boş günde ödül yok, not davranışa bağlı', function(){
      resetState();
      const r = C.todayReward();
      expect(r.all).toBeFalsy();
      expect(r.note).toContain('davranış');
    });
    it('analiz ve tekrar temizse iki ödül gelir', function(){
      resetState();
      const r = C.todayReward();
      expect(r.earned.some(e => e.key === 'analysis')).toBeTruthy();
      expect(r.earned.some(e => e.key === 'cards')).toBeTruthy();
    });
  });

  describe('Sınama motoru', function(){
    async function seedCards(n){
      resetState();
      for(let i = 0; i < n; i++){
        await M.saveCard(M.newCard({ front:'soru '+i, back:'cevap '+i, topic:'Paragraf',
          subjectId:'tyt-turkce', dueAt:U.iso(U.addDays(U.today(), -1)) }));
      }
    }
    it('havuz boşsa oturum başlamaz', function(){
      resetState();
      const res = Q.start({ mode:'due' });
      expect(res.ok).toBeFalsy();
      expect(Q.active()).toBeNull();
    });
    it('oturum istenen boyutta başlar', async function(){
      await seedCards(12);
      const res = Q.start({ mode:'due', size:5 });
      expect(res.ok).toBeTruthy();
      expect(res.total).toBe(5);
      expect(Q.progress().total).toBe(5);
      Q.cancel();
    });
    it('havuzdan az madde varsa o kadarını alır', async function(){
      await seedCards(3);
      expect(Q.start({ mode:'due', size:10 }).total).toBe(3);
      Q.cancel();
    });
    it('cevap verince ilerler ve bitince özet döner', async function(){
      await seedCards(2);
      Q.start({ mode:'due', size:2 });
      const a = await Q.answer('known');
      expect(a.done).toBeFalsy();
      const b = await Q.answer('unknown');
      expect(b.done).toBeTruthy();
      expect(b.summary.total).toBe(2);
      expect(b.summary.known).toBe(1);
      expect(b.summary.score).toBe(50);
    });
    it('bilinmeyen kartın SRS aşaması düşer', async function(){
      await seedCards(1);
      S.cards[0].stage = 3;
      await M.saveCard(S.cards[0]);
      Q.start({ mode:'due', size:1 });
      await Q.answer('unknown');
      expect(S.cards[0].stage).toBeLessThan(3);
    });
    it('bilinen kartın aşaması yükselir', async function(){
      await seedCards(1);
      S.cards[0].stage = 1;
      await M.saveCard(S.cards[0]);
      Q.start({ mode:'due', size:1 });
      await Q.answer('known');
      expect(S.cards[0].stage).toBe(2);
    });
    it('kartı olmayan bilinmeyen madde için kart açılır', async function(){
      resetState();
      const n = M.newVideoNote({ title:'Ders', subjectId:'tyt-turkce' });
      n.segments.push({ ts:5, text:'ana düşünce tüm paragrafı kapsar', tag:'kural' });
      await M.saveVideoNote(n);
      Q.start({ mode:'notes', size:1 });
      const res = await Q.answer('unknown');
      expect(res.summary.createdCards).toBe(1);
      expect(S.cards).toHaveLength(1);
      expect(S.cards[0].source).toBe('note');
    });
    it('bilinen madde için kart açılmaz', async function(){
      resetState();
      const n = M.newVideoNote({ title:'Ders', subjectId:'tyt-turkce' });
      n.segments.push({ ts:5, text:'metin', tag:'not' });
      await M.saveVideoNote(n);
      Q.start({ mode:'notes', size:1 });
      const res = await Q.answer('known');
      expect(res.summary.createdCards).toBe(0);
      expect(S.cards).toHaveLength(0);
    });
    it('zayıf konu iki kaçırmadan sonra adlandırılır', async function(){
      await seedCards(3);
      Q.start({ mode:'due', size:3 });
      await Q.answer('unknown');
      await Q.answer('unknown');
      const res = await Q.answer('known');
      expect(res.summary.weak.length).toBeGreaterThan(0);
      expect(res.summary.weak[0].topic).toBe('Paragraf');
    });
    it('iptal edilen oturum kayıt bırakmaz', async function(){
      await seedCards(4);
      Q.start({ mode:'due', size:4 });
      Q.cancel();
      expect(Q.active()).toBeNull();
      expect(Q.progress()).toBeNull();
    });
    it('havuz sayımı modlara göre çalışır', async function(){
      await seedCards(3);
      const av = Q.availability();
      expect(av.due).toBe(3);
      expect(av.notes).toBe(0);
    });
  });

  describe('Koç araçları ve gardlar', function(){
    it('yeni araçlar kayıtlı ve şemalı', function(){
      const names = R.CoachTools.TOOLS.map(t => t.name);
      ['video_notlari','mesgaleler','enerji_durumu','gunun_akisi','konu_riski','puan_tahmini']
        .forEach(n => expect(names.indexOf(n) >= 0).toBeTruthy());
      R.CoachTools.TOOLS.forEach(t => {
        expect(typeof t.execute).toBe('function');
        expect(t.inputSchema.type).toBe('object');
      });
    });
    it('video notu aracı ham transcript sızdırmaz', async function(){
      resetState();
      const n = M.newVideoNote({ title:'A', subjectId:'tyt-turkce' });
      n.transcript = 'ÇOK UZUN GİZLİ TRANSCRIPT METNİ';
      n.segments.push({ ts:1, text:'kısa not', tag:'not' });
      await M.saveVideoNote(n);
      const out = JSON.stringify(R.CoachTools.videoNotlari({}));
      expect(out.indexOf('GİZLİ')).toBe(-1);
      expect(out).toContain('kısa not');
    });
    it('puan tahmini aracı veri yokken uyarır', function(){
      resetState();
      expect(R.CoachTools.puanTahmini().yeterliVeri).toBeFalsy();
    });
    it('puan tahmini aracı bant ve uyarı taşır', async function(){
      await withTodayAsync('2026-11-20', async () => {
        await withExams([40, 42, 41], () => {
          const out = R.CoachTools.puanTahmini();
          expect(out.tahminiSiraBandi).toHaveLength(2);
          expect(out.uyari).toContain('koçluk bandı');
        });
      });
    });
    it('istem sürümü yükseldi', function(){
      expect(R.PROMPTS.version).toBeGreaterThan(3);
    });
    it('yeni istem türleri tanımlı', function(){
      ['note-summary','daily-flow','motivation','risk']
        .forEach(k => expect(R.PROMPTS.kinds[k].ask.length).toBeGreaterThan(20));
      expect(R.Coach.KINDS['daily-flow']).toBeTruthy();
      expect(R.Coach.KINDS.motivation).toBeTruthy();
    });
  });

  describe('Kart üretimi doğrulaması', function(){
    const note = { id:'v9', title:'Paragraf', subjectId:'tyt-turkce', topicId:null, segments:[] };

    it('boş alan elenir', function(){
      resetState();
      const res = R.Coach.validateCards({ cards:[{ front:'', back:'x' }, { front:'a', back:'' }] }, note);
      expect(res.cards).toHaveLength(0);
      expect(res.dropped).toBe(2);
    });
    it('çok uzun kart elenir', function(){
      const long = 'x'.repeat(R.PROMPTS.cards.frontMax + 1);
      expect(R.Coach.validateCards({ cards:[{ front:long, back:'y' }] }, note).cards).toHaveLength(0);
    });
    it('tekrar eden ön yüz elenir', function(){
      const res = R.Coach.validateCards({ cards:[
        { front:'Aynı soru', back:'a' }, { front:'aynı soru', back:'b' },
      ] }, note);
      expect(res.cards).toHaveLength(1);
    });
    it('üst sınır aşılmaz', function(){
      const many = Array.from({ length:20 }, (_, i) => ({ front:'soru '+i, back:'cevap '+i }));
      expect(R.Coach.validateCards({ cards:many }, note).cards.length <= R.PROMPTS.cards.max).toBeTruthy();
    });
    it('üretilen kart uygulama şemasını taşır', function(){
      resetState();
      const c = R.Coach.validateCards({ cards:[{ front:'Soru?', back:'Cevap' }] }, note).cards[0];
      expect(c.stage).toBe(0);
      expect(c.source).toBe('note');
      expect(c.sourceRef).toBe('v9');
      expect(c.subjectId).toBe('tyt-turkce');
      expect(c.history).toHaveLength(0);
    });
    it('bozuk yanıt çökmez', function(){
      expect(R.Coach.validateCards(null, note).cards).toHaveLength(0);
      expect(R.Coach.validateCards({ cards:'metin' }, note).cards).toHaveLength(0);
    });
  });
})();
