/* Süreli deneme oturumu — sınav günü provası.

   Test başına kronometre işler, soru bazlı işaretler alınır, oturum bitince
   deneme kaydına dönüşür. Dakikalar elle girilmez; ölçülür.

   Kural motoru otoritedir: burada yalnız süre ve işaret toplanır; net,
   medyan ve karar hesabı her zaman R.Calc'te kalır. */

window.R = window.R || {};

R.ExamRun = (function(){
  const U = R.U, M = R.Model;

  const MARKS = {
    ok:   { label:'Yaptım',    tone:'ok',    key:'1' },
    slow: { label:'Zorlandım', tone:'warn',  key:'2' },
    skip: { label:'Atladım',   tone:'muted', key:'3' },
  };

  let run = null;

  function active(){ return run; }
  function currentTest(){ return run ? run.tests[run.index] : null; }

  function start(template, opts){
    const o = opts || {};
    const tmpl = typeof template === 'string'
      ? R.EXAM_TEMPLATES.find(t => t.id === template)
      : template;
    if(!tmpl) return { ok:false, reason:'Şablon bulunamadı.' };

    run = {
      templateId:tmpl.id,
      name:tmpl.name,
      family:tmpl.family,
      kind:tmpl.kind,
      duration:tmpl.duration,
      publisher:o.publisher || '',
      date:o.date || U.todayISO(),
      tests:tmpl.tests.map(t => ({
        name:t.name, q:t.q,
        seconds:0, startedMs:null, finished:false,
      })),
      index:0,
      marks:[],
      startedMs:Date.now(),
      pausedMs:0,
      pausedAt:null,
    };
    run.tests[0].startedMs = Date.now();
    return { ok:true, run };
  }

  function elapsedTotal(){
    if(!run) return 0;
    const paused = run.pausedAt ? Date.now() - run.pausedAt : 0;
    return Math.max(0, Math.floor((Date.now() - run.startedMs - run.pausedMs - paused)/1000));
  }
  function elapsedTest(){
    const t = currentTest();
    if(!t) return 0;
    if(!t.startedMs || run.pausedAt) return t.seconds;
    return t.seconds + Math.floor((Date.now() - t.startedMs)/1000);
  }
  function remaining(){
    if(!run) return 0;
    return Math.max(0, run.duration*60 - elapsedTotal());
  }

  function pause(){
    if(!run || run.pausedAt) return;
    const t = currentTest();
    if(t && t.startedMs){
      t.seconds += Math.floor((Date.now() - t.startedMs)/1000);
      t.startedMs = null;
    }
    run.pausedAt = Date.now();
  }
  function resume(){
    if(!run || !run.pausedAt) return;
    run.pausedMs += Date.now() - run.pausedAt;
    run.pausedAt = null;
    const t = currentTest();
    if(t) t.startedMs = Date.now();
  }
  function isPaused(){ return !!(run && run.pausedAt); }

  /* Soru işareti: hangi testte, kaçıncı soruda, o soruya kaç saniye gitti. */
  function mark(kind){
    if(!run) return null;
    const t = currentTest();
    if(!t) return null;
    const secs = elapsedTest();
    const prev = run.marks.filter(m => m.test === t.name);
    const last = prev.length ? prev[prev.length-1].at : 0;
    const rec = {
      test:t.name,
      no:prev.length + 1,
      kind:kind,
      at:secs,
      spent:Math.max(0, secs - last),
    };
    run.marks.push(rec);
    return rec;
  }
  function undoMark(){
    if(!run || !run.marks.length) return null;
    return run.marks.pop();
  }

  function stopClockOfCurrent(){
    const t = currentTest();
    if(t && t.startedMs){
      t.seconds += Math.floor((Date.now() - t.startedMs)/1000);
      t.startedMs = null;
    }
    return t;
  }

  function nextTest(){
    if(!run) return null;
    const t = stopClockOfCurrent();
    if(t) t.finished = true;
    if(run.index >= run.tests.length - 1) return null;
    run.index++;
    const next = currentTest();
    if(!run.pausedAt) next.startedMs = Date.now();
    return next;
  }
  function gotoTest(i){
    if(!run || i < 0 || i >= run.tests.length) return null;
    stopClockOfCurrent();
    run.index = i;
    const next = currentTest();
    if(!run.pausedAt) next.startedMs = Date.now();
    return next;
  }

  function testSeconds(t){
    if(!t) return 0;
    if(!t.startedMs || (run && run.pausedAt)) return t.seconds;
    return t.seconds + Math.floor((Date.now() - t.startedMs)/1000);
  }

  /* Oturum özeti: süre dağılımı, yavaş sorular ve ısınma analizi. */
  function summary(){
    if(!run) return null;
    const total = elapsedTotal();
    const totalQ = U.sum(run.tests.map(x => x.q)) || 1;
    const perTest = run.tests.map(t => {
      const seconds = testSeconds(t);
      const planned = Math.round(run.duration*60 * (t.q / totalQ));
      return { name:t.name, q:t.q, seconds, planned, drift:seconds - planned };
    });

    const marks = run.marks;
    const spent = marks.map(m => m.spent).filter(x => x > 0);
    const medianSpent = U.median(spent);

    const early = marks.filter(m => m.at <= 20*60);
    const late = marks.filter(m => m.at > 20*60);
    const rate = list => list.length ? U.pct(list.filter(m => m.kind === 'ok').length, list.length) : null;
    const earlyRate = rate(early);
    const lateRate = rate(late);

    return {
      totalSeconds:total,
      overtime:total - run.duration*60,
      perTest,
      marks:marks.length,
      slow:marks.filter(m => m.kind === 'slow').length,
      skipped:marks.filter(m => m.kind === 'skip').length,
      medianSpent:medianSpent == null ? null : Math.round(medianSpent),
      slowest:marks.slice().sort((a, b) => b.spent - a.spent).slice(0, 5),
      earlyRate, lateRate,
      warmup:(earlyRate != null && lateRate != null && lateRate - earlyRate >= 15)
        ? 'Isınma sorunu: ilk 20 dakikada isabet %'+earlyRate+', sonrasında %'+lateRate+'. '
          + 'Denemeye başlamadan önce 5 dakikalık kolay set çöz.'
        : null,
    };
  }

  /* Oturumu bitir: deneme kaydı ve süre kaydı oluşur. */
  async function finish(scores){
    if(!run) return null;
    pause();
    const sum = summary();
    const tests = run.tests.map((t, i) => {
      const sc = (scores && scores[i]) || {};
      const c = Number(sc.correct) || 0, w = Number(sc.wrong) || 0;
      /* Giris formundaki kuralin aynisi: bos birakilan "boş" alani sifir
         sayilmaz, testin soru sayisindan turetilir. */
      const bos = R.Model.blankCertainty(c, w, sc.blank, t.q);
      return {
        name:t.name,
        correct:c,
        wrong:w,
        blank:bos.blank,
        blankCert:bos.blankCert,
        minutes:Math.round(sum.perTest[i].seconds / 60),
      };
    });

    const exam = {
      id:U.uid('e'),
      date:run.date,
      type:run.name,
      family:run.family,
      kind:run.kind,
      publisher:run.publisher,
      duration:run.duration,
      tests,
      protocol:{},
      createdAt:new Date().toISOString(),
      analysisCompletedAt:null,
      timed:true,
    };
    await M.saveExam(exam);

    const session = await M.saveSession({
      examId:exam.id,
      templateId:run.templateId,
      date:run.date,
      status:'done',
      totalSeconds:sum.totalSeconds,
      overtime:sum.overtime,
      tests:sum.perTest,
      marks:run.marks,
      earlyRate:sum.earlyRate,
      lateRate:sum.lateRate,
      warmup:sum.warmup,
      finishedAt:new Date().toISOString(),
    });

    run = null;
    return { exam, session, summary:sum };
  }

  function cancel(){ run = null; }

  return { MARKS, start, active, currentTest, elapsedTotal, elapsedTest, remaining,
    pause, resume, isPaused, mark, undoMark, nextTest, gotoTest, summary, finish, cancel };
})();
