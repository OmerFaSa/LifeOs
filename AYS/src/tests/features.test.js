/* 50 özellik turu: analiz katmanı, süreli oturum, takvim istisnaları,
   sınama biçimleri, not araçları, kötü gün, ödül eşiği, profiller. */

(function(){
  const { describe, it, expect, resetState, withToday, withTodayAsync, makeExam, examWithNet } = R.Test;
  const A = R.Analytics, C = R.Calc, M = R.Model, U = R.U, S = R.S, Q = R.Quiz, X = R.ExamRun;

  async function seedExams(list){
    resetState();
    for(const [d, net] of list) await M.saveExam(examWithNet(d, net, 'TYT'));
  }

  /* ==================== analiz ==================== */

  describe('Deneme karşılaştırma', function(){
    it('iki deneme yoksa null döner', function(){
      resetState();
      expect(A.compareExams('yok', 'yok2')).toBeNull();
    });
    it('test bazında fark hesaplar', async function(){
      resetState();
      const a = makeExam({ id:'a', date:'2026-10-01', tests:[
        { name:'Türkçe', correct:20, wrong:4, blank:16, minutes:35 }] });
      const b = makeExam({ id:'b', date:'2026-10-08', tests:[
        { name:'Türkçe', correct:28, wrong:4, blank:8, minutes:30 }] });
      await M.saveExam(a); await M.saveExam(b);
      const cmp = A.compareExams('a', 'b');
      expect(cmp.rows).toHaveLength(1);
      expect(cmp.rows[0].delta).toBe(8);
      expect(cmp.delta).toBe(8);
      expect(cmp.biggest.name).toBe('Türkçe');
    });
    it('yalnız birinde olan test null taşır', async function(){
      resetState();
      await M.saveExam(makeExam({ id:'a', date:'2026-10-01',
        tests:[{ name:'Türkçe', correct:20, wrong:0, blank:20, minutes:null }] }));
      await M.saveExam(makeExam({ id:'b', date:'2026-10-08',
        tests:[{ name:'Matematik', correct:10, wrong:0, blank:30, minutes:null }] }));
      const cmp = A.compareExams('a', 'b');
      expect(cmp.rows).toHaveLength(2);
      expect(cmp.rows.some(r => r.delta === null)).toBeTruthy();
    });
  });

  describe('Boş bırakma ve yayın etkisi', function(){
    it('üç denemeden azsa çalışmaz', async function(){
      await seedExams([['2026-10-01', 30]]);
      expect(A.blankStrategy('TYT').ok).toBeFalsy();
      expect(A.publisherAdjust('TYT').ok).toBeFalsy();
    });
    it('boş ortalaması ve en iyi deneme çıkar', async function(){
      await seedExams([['2026-10-01', 30], ['2026-10-08', 40], ['2026-10-15', 35]]);
      const b = A.blankStrategy('TYT');
      expect(b.ok).toBeTruthy();
      expect(b.points).toHaveLength(3);
      expect(b.best.net).toBeGreaterThan(b.worst.net);
    });
    it('yayın farkı hesaplanır', async function(){
      resetState();
      const mk = (id, d, net, pub) => Object.assign(examWithNet(d, net, 'TYT'), { id, publisher:pub });
      for(const e of [mk('1', '2026-10-01', 30, 'A'), mk('2', '2026-10-08', 32, 'A'),
                      mk('3', '2026-10-15', 45, 'B'), mk('4', '2026-10-22', 47, 'B')]){
        await M.saveExam(e);
      }
      const p = A.publisherAdjust('TYT');
      expect(p.ok).toBeTruthy();
      expect(p.rows).toHaveLength(2);
      expect(p.spread).toBeGreaterThan(10);
      expect(p.note).toContain('tek yayın');
    });
  });

  describe('Hata haritası ve konu değeri', function(){
    it('kayıt yokken boş döner', function(){
      resetState();
      expect(A.errorHeatmap().rows).toHaveLength(0);
    });
    it('konu × etiket sayımı doğru', function(){
      resetState();
      S.errors.push({ id:'1', tag:'K', topic:'Paragraf' });
      S.errors.push({ id:'2', tag:'K', topic:'Paragraf' });
      S.errors.push({ id:'3', tag:'İ', topic:'Paragraf' });
      const h = A.errorHeatmap();
      expect(h.rows[0].topic).toBe('Paragraf');
      expect(h.rows[0].cells.K).toBe(2);
      expect(h.rows[0].total).toBe(3);
      expect(h.max).toBe(2);
    });
    it('konu değeri potansiyel ve açık üretir', function(){
      resetState();
      const rows = A.topicValue(5);
      expect(rows).toHaveLength(5);
      rows.forEach(r => {
        expect(r.potential >= 0).toBeTruthy();
        expect(r.gap <= r.potential).toBeTruthy();
      });
    });
    it('kapanan konunun açığı sıfırlanır', async function(){
      resetState();
      const sub = R.SUBJECTS[0], top = sub.topics[0];
      await M.ensureTopics(sub.id);
      await M.setTopicState(sub.id, top.id,
        { first:85, firstAt:U.todayISO(), second:80, secondAt:U.todayISO() });
      const row = A.topicValue().find(r => r.topicId === top.id);
      expect(row.gap).toBe(0);
    });
  });

  describe('Sıra geçmişi ve unutma eğrisi', function(){
    it('üç denemeden azsa geçmiş yok', async function(){
      await seedExams([['2026-10-01', 30], ['2026-10-08', 32]]);
      expect(A.rankHistory()).toHaveLength(0);
    });
    it('her denemeden sonra bant üretir', async function(){
      await withTodayAsync('2026-11-01', async () => {
        await seedExams([['2026-10-01', 30], ['2026-10-08', 32], ['2026-10-15', 34], ['2026-10-22', 36]]);
        const h = A.rankHistory();
        expect(h.length).toBeGreaterThan(1);
        h.forEach(x => expect(x.rankBest).toBeLessThan(x.rankWorst));
      });
    });
    it('net yükselince sıra iyileşir', async function(){
      await withTodayAsync('2026-11-01', async () => {
        await seedExams([['2026-10-01', 20], ['2026-10-08', 22], ['2026-10-15', 60], ['2026-10-22', 65]]);
        const h = A.rankHistory();
        expect(h[h.length-1].rank).toBeLessThan(h[0].rank);
      });
    });
    it('tekrar geçmişi yokken eğri boş', function(){
      resetState();
      expect(A.forgettingCurve().ok).toBeFalsy();
    });
    it('kart geçmişi aralık kaydeder', function(){
      withToday('2026-10-10', () => {
        resetState();
        const c = M.newCard({ front:'a', back:'b' });
        c.lastReviewedAt = '2026-10-07';
        M.schedule(c, 'remembered');
        expect(c.history[0].gapDays).toBe(3);
        expect(c.history[0].result).toBe('remembered');
      });
    });
    it('eğri aralık bazında hatırlama verir', function(){
      resetState();
      const c = M.newCard({ front:'a', back:'b' });
      c.history = [
        { gapDays:1, result:'remembered' }, { gapDays:1, result:'forgot' },
        { gapDays:7, result:'remembered' },
      ];
      S.cards.push(c);
      const f = A.forgettingCurve();
      expect(f.ok).toBeTruthy();
      expect(f.rows.find(r => r.gap === '1g').rate).toBe(50);
    });
  });

  describe('Leech, uyku ve kapasite', function(){
    it('dört kez unutulan kart işaretlenir', function(){
      resetState();
      const c = M.newCard({ front:'zor', back:'x' });
      c.history = [1,2,3,4].map(() => ({ result:'forgot', gapDays:1 }));
      S.cards.push(c);
      expect(A.leechCards(4)).toHaveLength(1);
      expect(A.leechCards(5)).toHaveLength(0);
    });
    it('uyku kaydı yetersizse çalışmaz', async function(){
      await seedExams([['2026-10-01', 30], ['2026-10-08', 32], ['2026-10-15', 34], ['2026-10-22', 36]]);
      expect(A.sleepImpact().ok).toBeFalsy();
    });
    it('kapasite gerçekliği hafta yoksa çalışmaz', function(){
      resetState();
      expect(A.capacityReality().ok).toBeFalsy();
    });
    it('dikkat dağılması ortalaması hesaplanır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        const d = await M.ensureDay('2026-09-15');
        d.distractions = 6;
        await M.saveDay('2026-09-15');
        const t = A.distractionTrend(3);
        expect(t.ok).toBeTruthy();
        expect(t.avg).toBeGreaterThan(0);
      });
    });
  });

  /* ==================== süreli oturum ==================== */

  describe('Süreli deneme oturumu', function(){
    it('bilinmeyen şablonda başlamaz', function(){
      X.cancel();
      expect(X.start('yok').ok).toBeFalsy();
    });
    it('şablondan testleri kurar', function(){
      const r = X.start('tyt-full');
      expect(r.ok).toBeTruthy();
      expect(X.active().tests.length).toBeGreaterThan(0);
      expect(X.currentTest().seconds).toBe(0);
      X.cancel();
    });
    it('işaret soru numarası ve süre taşır', function(){
      X.start('tyt-full');
      const m1 = X.mark('ok');
      const m2 = X.mark('slow');
      expect(m1.no).toBe(1);
      expect(m2.no).toBe(2);
      expect(m2.kind).toBe('slow');
      X.cancel();
    });
    it('geri alma son işareti siler', function(){
      X.start('tyt-full');
      X.mark('ok'); X.mark('ok');
      X.undoMark();
      expect(X.active().marks).toHaveLength(1);
      X.cancel();
    });
    it('sonraki test saati aktarır', function(){
      X.start('tyt-full');
      const first = X.currentTest().name;
      const next = X.nextTest();
      expect(next.name === first).toBeFalsy();
      expect(X.active().tests[0].finished).toBeTruthy();
      X.cancel();
    });
    it('duraklatınca sayaç durur', function(){
      X.start('tyt-full');
      X.pause();
      expect(X.isPaused()).toBeTruthy();
      X.resume();
      expect(X.isPaused()).toBeFalsy();
      X.cancel();
    });
    it('özet test başına planlanan süreyi verir', function(){
      X.start('tyt-full');
      const sum = X.summary();
      expect(sum.perTest.length).toBe(X.active().tests.length);
      sum.perTest.forEach(t => expect(t.planned).toBeGreaterThan(0));
      X.cancel();
    });
    it('bitince deneme ve oturum kaydı üretir', async function(){
      resetState();
      X.start('tyt-full');
      X.mark('ok');
      const res = await X.finish([{ correct:30, wrong:4, blank:6 }]);
      expect(res.exam.timed).toBeTruthy();
      expect(S.exams).toHaveLength(1);
      expect(S.sessions).toHaveLength(1);
      expect(res.exam.tests[0].minutes >= 0).toBeTruthy();
      expect(X.active()).toBeNull();
    });
  });

  /* ==================== takvim istisnaları ==================== */

  describe('Takvim istisnaları', function(){
    it('istisna yoksa gün yükü 1', function(){
      resetState();
      expect(M.dayLoad('2026-10-01').load).toBe(1);
    });
    it('tatil günün yükünü sıfırlar', async function(){
      resetState();
      await M.saveCalendar({ kind:'tatil', from:'2026-10-01', to:'2026-10-03' });
      expect(M.dayLoad('2026-10-02').load).toBe(0);
      expect(M.dayLoad('2026-10-04').load).toBe(1);
    });
    it('okul sınavı yükü kısmen düşürür', async function(){
      resetState();
      await M.saveCalendar({ kind:'okulSinavi', from:'2026-10-05' });
      const l = M.dayLoad('2026-10-05').load;
      expect(l).toBeGreaterThan(0);
      expect(l).toBeLessThan(1);
    });
    it('hafta yükü günlerin ortalamasıdır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        const n = M.currentWeek();
        const from = U.iso(M.weekStart(n));
        await M.saveCalendar({ kind:'tatil', from, to:U.iso(U.addDays(M.weekStart(n), 6)) });
        expect(M.weekLoad(n)).toBe(0);
      });
    });
    it('silinen istisna yükü geri verir', async function(){
      resetState();
      const rec = await M.saveCalendar({ kind:'tatil', from:'2026-10-01' });
      expect(M.dayLoad('2026-10-01').load).toBe(0);
      await M.deleteCalendar(rec.id);
      expect(M.dayLoad('2026-10-01').load).toBe(1);
    });
    it('tatil haftasında soru hedefi düşer', function(){
      const p = { capacityHoursPerWeek:21, studyDaysPerWeek:6, level:'orta', weakSubjects:[] };
      const full = R.Planner.weeklyQuestions(p, R.Planner.PHASES[2], 1);
      const half = R.Planner.weeklyQuestions(p, R.Planner.PHASES[2], 0.5);
      expect(half).toBeLessThan(full);
    });
  });

  /* ==================== sınama biçimleri ==================== */

  describe('Sınama biçimleri', function(){
    async function seedCards(n, topics){
      resetState();
      for(let i = 0; i < n; i++){
        await M.saveCard(M.newCard({
          front:'Soru ' + i, back:'Cevap metni ' + i,
          topic:(topics || ['Paragraf'])[i % (topics || ['Paragraf']).length],
          subjectId:'tyt-turkce', dueAt:U.iso(U.addDays(U.today(), -1)),
        }));
      }
    }
    it('çoktan seçmeli şık üretir', async function(){
      await seedCards(8);
      Q.start({ mode:'due', size:4, format:'choice' });
      const item = Q.current();
      expect(item.choices.length).toBeGreaterThan(2);
      expect(item.choices[item.correct]).toBe(item.answer);
      Q.cancel();
    });
    it('şık seçimi doğruyu bildirir', async function(){
      await seedCards(8);
      Q.start({ mode:'due', size:4, format:'choice' });
      const item = Q.current();
      const res = Q.pick(item.correct);
      expect(res.correct).toBeTruthy();
      expect(Q.isRevealed()).toBeTruthy();
      Q.cancel();
    });
    it('çeldirici yetersizse açık uçlu kalır', async function(){
      await seedCards(2);
      Q.start({ mode:'due', size:2, format:'choice' });
      expect(Q.current().choices).toBeUndefined();
      Q.cancel();
    });
    it('karışık tekrar aynı konuyu peş peşe koymaz', async function(){
      await seedCards(8, ['A', 'B']);
      Q.start({ mode:'due', size:8 });
      const items = Q.active().items;
      let back = 0;
      for(let i = 1; i < items.length; i++){
        if(items[i].topic === items[i-1].topic) back++;
      }
      expect(back).toBe(0);
      Q.cancel();
    });
    it('süre seçimi oturuma yazılır', async function(){
      await seedCards(5);
      const r = Q.start({ mode:'due', size:3, seconds:45 });
      expect(r.perQuestion).toBe(45);
      expect(Q.questionLeft() <= 45).toBeTruthy();
      Q.cancel();
    });
    it('süre dolunca madde bilinmiyor sayılır', async function(){
      await seedCards(2);
      Q.start({ mode:'due', size:2, seconds:20 });
      await Q.timeout();
      expect(Q.active().results[0].verdict).toBe('unknown');
      expect(Q.active().timedOut).toBe(1);
      Q.cancel();
    });
    it('özet biçim ve süre bilgisini taşır', async function(){
      await seedCards(2);
      Q.start({ mode:'due', size:1, format:'choice', seconds:20 });
      const res = await Q.answer('known');
      expect(res.summary.format).toBe('choice');
      expect(res.summary.perQuestion).toBe(20);
      expect(res.summary.medianTime != null).toBeTruthy();
    });
  });

  describe('Kart önceliği', function(){
    it('en gecikmiş kart önce gelir', async function(){
      await withTodayAsync('2026-10-10', async () => {
        resetState();
        await M.saveCard(M.newCard({ front:'yeni', back:'x', dueAt:'2026-10-09' }));
        await M.saveCard(M.newCard({ front:'eski', back:'x', dueAt:'2026-10-01' }));
        expect(M.prioritizedDue()[0].front).toBe('eski');
      });
    });
  });

  /* ==================== not araçları ==================== */

  describe('Transcript bölme ve not kalitesi', function(){
    it('boş metin boş döner', function(){
      expect(M.splitTranscript('')).toHaveLength(0);
    });
    it('cümlelere böler ve zaman dağıtır', function(){
      const t = 'Birinci cümle yeterince uzun ve anlamlıdır burada. '
        + 'İkinci cümle de yeterince uzun ve anlamlıdır burada. '
        + 'Üçüncü cümle yine yeterince uzun ve anlamlıdır burada.';
      const parts = M.splitTranscript(t, 600);
      expect(parts).toHaveLength(3);
      expect(parts[0].ts).toBe(0);
      expect(parts[2].ts).toBeGreaterThan(parts[0].ts);
    });
    it('zaman damgalı metinde damgayı kullanır', function(){
      const t = '[00:30] Ana düşünce paragrafın tamamını kapsar burada. '
        + '[01:45] Yardımcı düşünce ana düşünceyi destekler burada. '
        + '[02:10] Örnek soruda bu ayrım sorulur burada.';
      const parts = M.splitTranscript(t);
      expect(parts).toHaveLength(3);
      expect(parts[0].ts).toBe(30);
      expect(parts[1].ts).toBe(105);
    });
    it('etiket tahmini yapar', function(){
      expect(M.guessTag('Dikkat: bu bir tuzaktır')).toBe('tuzak');
      expect(M.guessTag('Örneğin şu durumda')).toBe('ornek');
      expect(M.guessTag('Bu kural her zaman geçerlidir')).toBe('kural');
    });
    it('belirsiz not uyarı üretir', function(){
      const q = M.noteQuality('dikkatsizlik');
      expect(q.ok).toBeFalsy();
      expect(q.issues.length).toBeGreaterThan(0);
    });
    it('iyi not geçer', function(){
      expect(M.noteQuality('Paydayı eşitlemeden sadeleştirme yapılmaz').ok).toBeTruthy();
    });
    it('çok uzun not uyarı üretir', function(){
      expect(M.noteQuality('x'.repeat(300)).ok).toBeFalsy();
    });
  });

  /* ==================== davranış ==================== */

  describe('Kötü gün ve ödül eşiği', function(){
    it('kötü gün blokları atlar ve hedefi indirir', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensureWeek(M.currentWeek());
        const day = await M.badDay('2026-09-15');
        expect(day.badDay).toBeTruthy();
        const work = day.blocks.filter(b => b.slot !== 'Dinlenme');
        expect(work.every(b => b.status !== 'pending')).toBeTruthy();
        expect(work.some(b => b.skipReason === R.BAD_DAY.reason)).toBeTruthy();
      });
    });
    it('kötü gün geri alınabilir', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        await M.ensureWeek(M.currentWeek());
        await M.badDay('2026-09-15');
        const day = await M.undoBadDay('2026-09-15');
        expect(day.badDay).toBeFalsy();
        expect(day.blocks.some(b => b.status === 'pending')).toBeTruthy();
      });
    });
    it('dikkat sayacı artar', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        expect(await M.addDistraction()).toBe(1);
        expect(await M.addDistraction()).toBe(2);
      });
    });
    it('ödül eşiği sıradaki hedefi gösterir', function(){
      resetState();
      const t = C.rewardTier();
      expect(t.next).toBeTruthy();
      expect(t.toNext).toBeGreaterThan(0);
    });
    it('sınav haftası modu tarihe bağlıdır', function(){
      resetState();
      const m = C.examWeekMode();
      expect(typeof m.active).toBe('boolean');
      expect(m.note.length).toBeGreaterThan(10);
    });
  });

  /* ==================== profiller ==================== */

  describe('Profiller', function(){
    it('ana profil her zaman listede', function(){
      resetState();
      const list = M.profileList();
      expect(list.some(p => p.id === 'main')).toBeTruthy();
    });
    it('yeni profil listeye eklenir', async function(){
      resetState();
      const before = M.profileList().length;
      await M.saveProfileEntry({ name:'Kardeşim' });
      expect(M.profileList().length).toBe(before + 1);
    });
    it('etkin profil kimliği okunur', function(){
      expect(typeof M.activeProfileId()).toBe('string');
    });
  });

  /* ==================== koç eklentileri ==================== */

  describe('Koç üslubu ve hafızası', function(){
    it('üç üslup tanımlı', function(){
      expect(Object.keys(R.COACH_TONES).length).toBe(3);
      Object.keys(R.COACH_TONES).forEach(k => {
        expect(R.COACH_TONES[k].line.length).toBeGreaterThan(20);
      });
    });
    it('üslup satırı istem metnine dönüşür', function(){
      expect(R.PROMPTS.toneLine('sert')).toContain('ÜSLUP');
      expect(R.PROMPTS.toneLine('yok')).toContain('ÜSLUP');
    });
    it('hafıza satırı boşta boş döner', function(){
      expect(R.PROMPTS.memoryLine([])).toBe('');
      expect(R.PROMPTS.memoryLine(['a'])).toContain('DAHA ÖNCE');
    });
    it('ajan hafızası kendi sözlerini geri verir', async function(){
      resetState();
      R.S.officeMeetings = [];
      R.S.officeChats = {};
      await R.Office.pushChat('tyt', 'agent', 'TYT kapanışı düşük.');
      const said = R.Office.recentSaid('tyt');
      expect(said).toHaveLength(1);
      expect(said[0]).toContain('kapanış');
    });
  });

  /* ==================== plan senaryoları ==================== */

  describe('Senaryo ve önkoşul', function(){
    const prof = { capacityHoursPerWeek:21, studyDaysPerWeek:6, level:'orta', weakSubjects:[] };
    it('senaryolar kapasiteye göre kapsama verir', function(){
      const sc = R.Planner.scenarios(prof, 40, [-5, 0, 10]);
      expect(sc.rows).toHaveLength(3);
      const low = sc.rows.find(r => r.delta === -5);
      const high = sc.rows.find(r => r.delta === 10);
      expect(high.coverage >= low.coverage).toBeTruthy();
    });
    it('senaryo günlük saat de gösterir', function(){
      const sc = R.Planner.scenarios(prof, 40, [0]);
      expect(sc.rows[0].perDay).toBeGreaterThan(0);
    });
    it('üretilen planda önkoşul ihlali yok', function(){
      const plan = R.Planner.generate(prof, 40);
      expect(R.Planner.checkPrerequisites(plan).ok).toBeTruthy();
    });
    it('enerji kaydı yoksa gün önerisi çıkmaz', function(){
      resetState();
      expect(R.Planner.energyByWeekday().ok).toBeFalsy();
    });
    it('enerji kaydı varsa en iyi gün bulunur', async function(){
      await withTodayAsync('2026-09-20', async () => {
        resetState();
        await M.saveMood('2026-09-20', { energy:5 });
        await M.saveMood('2026-09-19', { energy:2 });
        await M.saveMood('2026-09-18', { energy:3 });
        const e = R.Planner.energyByWeekday();
        expect(e.ok).toBeTruthy();
        expect(e.best.avg >= e.worst.avg).toBeTruthy();
      });
    });
  });

  /* ==================== otomasyon ==================== */

  describe('Otomasyon eklentileri', function(){
    it('sapma serisi hesaplanır', function(){
      resetState();
      const d = R.Auto.driftStreak();
      expect(typeof d.weeks).toBe('number');
    });
    it('hafta kapanış taslağı dört sütun üretir', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        await M.ensureWeek(M.currentWeek());
        const d = R.Auto.closeWeekDraft(M.currentWeek());
        expect(d.planned.length).toBeGreaterThan(0);
        expect(d.done.length).toBeGreaterThan(0);
        expect(d.why.length).toBeGreaterThan(0);
        expect(Array.isArray(d.carry)).toBeTruthy();
      });
    });
    it('devir en fazla iki konu taşır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        S.profile.setupDone = true;
        await M.ensurePlan(true);
        expect(R.Auto.closeWeekDraft(1).carry.length <= 2).toBeTruthy();
      });
    });
  });

  /* ==================== şema ==================== */

  describe('Şema v4', function(){
    it('sürüm 4', function(){
      expect(R.SCHEMA_VERSION).toBe(4);
    });
    it('yeni koleksiyonlar durumda tanımlı', function(){
      resetState();
      expect(Array.isArray(S.calendar)).toBeTruthy();
      expect(Array.isArray(S.sessions)).toBeTruthy();
      expect(Array.isArray(S.profiles)).toBeTruthy();
    });
    it('gün kaydı yeni alanları taşır', async function(){
      await withTodayAsync('2026-09-15', async () => {
        resetState();
        await M.ensureWeek(M.currentWeek());
        const d = await M.ensureDay('2026-09-15');
        expect(d.badDay).toBeFalsy();
        expect(d.distractions).toBe(0);
      });
    });
  });
})();
