/* Uygulama durumu, veri modeli ve yukleme/kaydetme islemleri. */

window.R = window.R || {};

R.S = {
  route:'today',
  ready:false,
  sidebarOpen:false,
  profile:null,
  weeks:{},        // wNN -> hafta sozlesmesi
  days:{},         // YYYY-MM-DD -> gun kaydi
  exams:[],
  errors:[],
  cards:[],
  reviews:{},      // wNN -> weekly review
  decisions:{},    // YYYY-MM -> karar kapisi
  topics:{},       // subjectId -> { states:{topicId:{...}} }
  protocols:[],    // aktif/gecmis telafi protokolleri
  prefs:null,      // tercih listesi
  plan:null,       // uretilmis kisisel program
  calendar:[],     // tatil / okul sinavi / yogun gun istisnalari
  sessions:[],     // sureli deneme oturumlari (soru bazli sure dahil)
  profiles:[],     // cihazdaki profiller (cok kullanicili kullanim)
  videoNotes:[],   // izlenen ders kaydi + zaman damgali notlar
  activities:[],   // kullanicinin kendi ekledigi/gizledigi mesgaleler
  mood:{},         // YYYY-MM-DD -> { energy, note } (gunde tek kayit)
  breaks:[],       // alinan molalar
  meta:null,       // { lastBackupAt, schemaVersion }
  storeHealth:null,// son depolama hatasi (varsa)
  coach:{},        // AI koc yorumlari (onbellek): 'week-w05' -> payload
  coachChat:[],    // koc sohbeti
  ui:{
    weekView:null,     // gorunen hafta no
    examTab:'list',
    examOpen:null,
    cardTab:'due',
    subjectOpen:'tyt-turkce',
    guideTab:'analysis',
    progressRange:8,
    flipped:{},
    timer:null,        // {dayISO, blockId, startedAt, elapsed}
    noteOpen:null,     // acik video notu id'si
    learnFilter:'all',
    learnQuery:'',
    learnPage:1,
    transcriptOpen:false,
    quizMode:'due',
    quizSize:10,
    quizSubject:null,
    quizTopic:null,
    quizFormat:'open',
    quizSeconds:0,
    quizVoice:false,
    droppedOpen:false,
    topicOpen:null,      // konu ozeti sayfasi
    topicSubject:null,
    analyticsTab:'overview',
    compareA:null, compareB:null,
    sessionId:null,      // calisan deneme oturumu
    noteTag:'not',
    noteForce:false,
    examWeekAck:false,
  },
};

R.Model = (function(){
  const U = R.U;

  /* Bos nesne ve diziler depolama katmanindan geri gelmeyebilir; okunan her
     belge kullanilmadan once eksik kaplari tamamlanir. */
  function normDay(doc){
    if(!doc) return doc;
    doc.checklist = doc.checklist || {};
    doc.blocks = Array.isArray(doc.blocks) ? doc.blocks : [];
    doc.blocks.forEach(b => {
      if(!b.status) b.status = 'pending';
      if(b.subjectId === undefined) b.subjectId = null;
      if(b.topicId === undefined) b.topicId = null;
    });
    if(doc.paragraphTarget == null) doc.paragraphTarget = 18;
    if(doc.problemTarget == null) doc.problemTarget = 18;
    if(doc.paragraphActual == null) doc.paragraphActual = 0;
    if(doc.problemActual == null) doc.problemActual = 0;
    if(doc.note == null) doc.note = '';
    if(doc.badDay == null) doc.badDay = false;
    if(doc.distractions == null) doc.distractions = 0;
    return doc;
  }
  function normWeek(doc){
    if(!doc) return doc;
    doc.mainTopics = Array.isArray(doc.mainTopics) ? doc.mainTopics : [];
    doc.revisions = Array.isArray(doc.revisions) ? doc.revisions : [];
    doc.carryIn = Array.isArray(doc.carryIn) ? doc.carryIn : [];
    if(doc.behaviorGoal == null) doc.behaviorGoal = '';
    if(doc.capacityMin == null) doc.capacityMin = Math.round(R.PROGRAM.capacityHoursPerWeek*60);
    return doc;
  }
  function normExam(doc){
    if(!doc) return doc;
    doc.protocol = doc.protocol || {};
    doc.tests = Array.isArray(doc.tests) ? doc.tests : [];
    return doc;
  }
  function normCard(doc){
    if(!doc) return doc;
    doc.history = Array.isArray(doc.history) ? doc.history : [];
    if(doc.stage == null) doc.stage = 0;
    return doc;
  }
  function normProtocol(doc){
    if(!doc) return doc;
    doc.steps = doc.steps || {};
    return doc;
  }
  function normTopics(doc){
    if(!doc) return doc;
    doc.states = doc.states || {};
    return doc;
  }
  function normVideoNote(doc){
    if(!doc) return doc;
    doc.segments = Array.isArray(doc.segments) ? doc.segments : [];
    doc.segments.forEach(s => {
      if(s.ts == null) s.ts = 0;
      if(s.text == null) s.text = '';
      if(!s.tag) s.tag = 'not';
    });
    if(doc.title == null) doc.title = '';
    if(doc.url == null) doc.url = '';
    if(doc.provider == null) doc.provider = 'other';
    if(doc.transcript == null) doc.transcript = '';
    if(doc.watchedMin == null) doc.watchedMin = 0;
    if(doc.done == null) doc.done = false;
    if(doc.source == null) doc.source = doc.url ? 'video' : 'video';
    if(doc.series == null) doc.series = '';
    if(doc.page == null) doc.page = '';
    return doc;
  }
  function normMood(doc){
    if(!doc) return doc;
    if(doc.energy == null) doc.energy = 3;
    if(doc.note == null) doc.note = '';
    return doc;
  }
  function normCalendar(doc){
    if(!doc) return doc;
    if(!doc.kind) doc.kind = 'tatil';
    if(doc.load == null) doc.load = 0;
    if(doc.note == null) doc.note = '';
    return doc;
  }
  function normSession(doc){
    if(!doc) return doc;
    doc.tests = Array.isArray(doc.tests) ? doc.tests : [];
    doc.marks = Array.isArray(doc.marks) ? doc.marks : [];
    if(doc.status == null) doc.status = 'done';
    return doc;
  }
  function normBreak(doc){
    if(!doc) return doc;
    if(doc.minutes == null) doc.minutes = R.BREAK_RULE.shortMin;
    if(doc.activityId == null) doc.activityId = null;
    return doc;
  }

  /* ---------- hafta ---------- */
  function weekStart(n){ return U.addDays(U.parse(R.PLAN.startISO), (n-1)*7); }
  function weekEnd(n){ return U.addDays(weekStart(n), 6); }
  function weekId(n){ return 'w'+U.pad2(n); }
  function weekDates(n){
    const s = weekStart(n);
    return [0,1,2,3,4,5,6].map(i => U.addDays(s, i));
  }
  function weekOf(dateLike){
    const d = U.parse(dateLike);
    const diff = U.diffDays(R.PLAN.startISO, d);
    return U.clamp(Math.floor(diff/7)+1, 1, R.PLAN.totalWeeks);
  }
  function currentWeek(){ return weekOf(U.today()); }
  function daysUntilStart(){ return U.diffDays(U.todayISO(), R.PLAN.startISO); }
  function programProgress(){
    const total = R.PLAN.totalWeeks * 7;
    const done = U.clamp(U.diffDays(R.PLAN.startISO, U.todayISO()), 0, total);
    return U.pct(done, total);
  }
  /* Takvim 40 haftadan kisaysa mufredat orantili sikistirilir:
     ilk hafta 1. icerige, son hafta 40. icerige denk gelir. */
  /* Üretilmiş plan varsa o kullanılır; yoksa sabit müfredat orantılanır.
     Plan R.S.plan içinde durur ve profil değişince yeniden üretilir. */
  function activePlan(){
    const plan = R.S.plan;
    if(plan && plan.weeks && plan.weeks.length) return plan;
    return null;
  }

  async function ensurePlan(force){
    const total = R.PLAN.totalWeeks;
    const cur = activePlan();
    const fresh = !cur
      || force
      || cur.meta.total !== total
      || cur.meta.capacityHoursPerWeek !== (Number(R.S.profile.capacityHoursPerWeek) || 21)
      || cur.meta.level !== R.Planner.level(R.S.profile.level).id;
    if(!fresh) return cur;

    const plan = R.Planner.generate(R.S.profile, total);
    R.S.plan = plan;
    await R.Store.set('plan/main', plan);
    return plan;
  }

  async function replanFrom(n){
    const plan = activePlan();
    if(!plan) return await ensurePlan(true);
    const next = R.Planner.replan(plan, R.S.profile, n || currentWeek());
    R.S.plan = next;
    await R.Store.set('plan/main', next);
    return next;
  }

  function planHealth(){
    const plan = activePlan();
    return plan ? R.Planner.health(plan, currentWeek()) : null;
  }

  function curriculumFor(n){
    const plan = activePlan();
    if(plan){
      const idx = U.clamp(n, 1, plan.weeks.length) - 1;
      return plan.weeks[idx];
    }
    const total = R.PLAN.totalWeeks;
    const full = R.PROGRAM.totalWeeks;
    if(total >= full) return R.CURRICULUM[U.clamp(n,1,full)-1];
    if(total <= 1) return R.CURRICULUM[full-1];
    const idx = Math.round((n-1) * (full-1) / (total-1));
    return R.CURRICULUM[U.clamp(idx, 0, full-1)];
  }

  function phaseOf(n){
    const plan = activePlan();
    if(plan){
      const w = curriculumFor(n);
      const total = plan.meta.total;
      const p = R.Planner.PHASES.find(x => x.key === w.phase);
      if(p){
        const from = R.Planner.PHASES.indexOf(p) === 0 ? 1
          : Math.max(1, Math.round(total * R.Planner.PHASES[R.Planner.PHASES.indexOf(p)-1].to) + 1);
        const to = Math.min(total, Math.round(total * p.to));
        return { key:p.key, label:p.label, theme:p.theme, weeks:[from, to] };
      }
    }
    return R.PHASES.find(p => n >= p.weeks[0] && n <= p.weeks[1]) || R.PHASES[0];
  }

  function defaultWeek(n){
    const c = curriculumFor(n);
    const perTopic = Math.round(c.q / Math.max(1, Math.min(3, c.topics.length)) / 10) * 10;
    return {
      n,
      title:c.title,
      mainTopics: (c.items && c.items.length
        ? c.items.slice(0,3).map(t => ({
            name:t.name, questionTarget:perTopic, accuracy:70,
            subjectId:t.subjectId, topicId:t.topicId,
          }))
        : c.topics.slice(0,3).map(t => ({
            name:t, questionTarget:perTopic, accuracy:70, subjectId:null, topicId:null,
          }))),
      questionTarget:c.q,
      examPlan:c.exam,
      checkpoint:c.check,
      capacityMin: Math.round(R.PROGRAM.capacityHoursPerWeek*60),
      signedAt:null,
      revisions:[],
      behaviorGoal:'',
      carryIn:[],
    };
  }

  async function ensureWeek(n){
    const id = weekId(n);
    if(R.S.weeks[id]) return R.S.weeks[id];
    let doc = await R.Store.get('weeks/'+id);
    if(!doc){
      doc = defaultWeek(n);
      await R.Store.set('weeks/'+id, doc);
    }
    R.S.weeks[id] = normWeek(doc);
    return R.S.weeks[id];
  }
  async function saveWeek(n){
    const id = weekId(n);
    await R.Store.set('weeks/'+id, R.S.weeks[id]);
  }

  /* ---------- gun ---------- */
  function defaultDay(dateObj, week){
    const dow = U.weekdayIndex(dateObj);
    const tmpl = R.WEEKDAYS[dow];
    const blocks = tmpl.blocks.map((b, i) => ({
      id:'b'+i,
      slot:b.slot,
      subject:b.subject,
      topic: tmpl.ritual ? b.subject : ((week.mainTopics[i] && week.mainTopics[i].name) || b.subject),
      targetMin:b.min,
      targetQ: tmpl.ritual ? 0 : Math.round(week.questionTarget / 6 / 2),
      status:'pending',
      subjectId:(week.mainTopics[i] && week.mainTopics[i].subjectId) || null,
      topicId:(week.mainTopics[i] && week.mainTopics[i].topicId) || null,
      actualMin:null, actualQ:null, correctQ:null,
      skipReason:null,
      startedAt:null,
    }));
    return {
      date:U.iso(dateObj),
      dow,
      ritual:tmpl.ritual || null,
      paragraphTarget:18, paragraphActual:0,
      problemTarget:18, problemActual:0,
      sleepHours:null,
      checklist:{},
      blocks,
      note:'',
    };
  }

  async function ensureDay(dateLike){
    const d = U.parse(dateLike);
    const id = U.iso(d);
    if(R.S.days[id]) return R.S.days[id];
    let doc = await R.Store.get('days/'+id);
    if(!doc){
      const week = await ensureWeek(weekOf(d));
      doc = defaultDay(d, week);
      await R.Store.set('days/'+id, doc);
    }else if(!Array.isArray(doc.blocks) || !doc.blocks.length){
      const week = await ensureWeek(weekOf(d));
      doc.blocks = defaultDay(d, week).blocks;
    }
    R.S.days[id] = normDay(doc);
    return R.S.days[id];
  }
  async function saveDay(dateISO){
    await R.Store.set('days/'+dateISO, R.S.days[dateISO]);
  }
  function dayOf(dateISO){ return R.S.days[dateISO] || null; }

  /* ---------- konu durumlari ---------- */
  async function ensureTopics(subjectId){
    if(R.S.topics[subjectId]) return R.S.topics[subjectId];
    let doc = await R.Store.get('topics/'+subjectId);
    if(!doc) doc = { subjectId, states:{} };
    R.S.topics[subjectId] = normTopics(doc);
    return R.S.topics[subjectId];
  }
  function topicState(subjectId, topicId){
    const doc = R.S.topics[subjectId];
    const st = doc && doc.states ? doc.states[topicId] : null;
    return st || { state:'not_started', first:null, firstAt:null, second:null, secondAt:null, note:'' };
  }
  async function setTopicState(subjectId, topicId, patch){
    const doc = await ensureTopics(subjectId);
    doc.states = doc.states || {};
    const cur = doc.states[topicId] || { state:'not_started', first:null, firstAt:null, second:null, secondAt:null, note:'' };
    const next = Object.assign({}, cur, patch);

    // Kapanis kurali: ilk test >=75 ve 7 gun sonraki test >=70
    const rule = R.CLOSURE_RULE;
    if(next.first != null && next.second != null){
      next.state = (next.first >= rule.first && next.second >= rule.second) ? 'closed' : 'practicing';
    }else if(next.first != null){
      next.state = next.first >= rule.first ? 'provisional' : 'practicing';
    }
    if(patch.state) next.state = patch.state;   // acik secim onceliklidir

    doc.states[topicId] = next;
    R.S.topics[subjectId] = doc;
    await R.Store.set('topics/'+subjectId, doc);
    return next;
  }

  /* ---------- deneme ---------- */
  function examNet(exam){
    return (exam.tests || []).reduce((s,t)=> s + (Number(t.correct||0) - Number(t.wrong||0)/4), 0);
  }
  function testNet(t){ return Number(t.correct||0) - Number(t.wrong||0)/4; }

  async function saveExam(exam){
    const i = R.S.exams.findIndex(e => e.id === exam.id);
    if(i >= 0) R.S.exams[i] = exam; else R.S.exams.push(exam);
    await R.Store.set('exams/'+exam.id, exam);
  }
  async function deleteExam(id){
    R.S.exams = R.S.exams.filter(e => e.id !== id);
    const errs = R.S.errors.filter(e => e.examId === id);
    R.S.errors = R.S.errors.filter(e => e.examId !== id);
    await R.Store.remove('exams/'+id);
    for(const e of errs) await R.Store.remove('errors/'+e.id);
  }

  /* ---------- hata / yanlis defteri ---------- */
  async function saveError(err){
    const i = R.S.errors.findIndex(e => e.id === err.id);
    if(i >= 0) R.S.errors[i] = err; else R.S.errors.push(err);
    await R.Store.set('errors/'+err.id, err);
  }
  async function deleteError(id){
    R.S.errors = R.S.errors.filter(e => e.id !== id);
    await R.Store.remove('errors/'+id);
  }

  /* ---------- tekrar kartlari ---------- */
  function newCard(fields){
    return Object.assign({
      id:U.uid('c'),
      front:'', back:'', topic:'', subjectId:null,
      source:'manual', sourceRef:null,
      stage:0,
      dueAt:U.iso(U.addDays(U.today(), 1)),
      createdAt:new Date().toISOString(),
      lastResult:null, lastReviewedAt:null,
      history:[],
    }, fields || {});
  }
  async function saveCard(card){
    const i = R.S.cards.findIndex(c => c.id === card.id);
    if(i >= 0) R.S.cards[i] = card; else R.S.cards.push(card);
    await R.Store.set('cards/'+card.id, card);
  }
  async function deleteCard(id){
    R.S.cards = R.S.cards.filter(c => c.id !== id);
    await R.Store.remove('cards/'+id);
  }
  /* 1g / 3g / 1h / 1a — "hatirlamadim" donguyu +1 gunden baslatir,
     "zorlandim" bir sonraki araligi acmaz (ayni araligi tekrarlar). */
  function schedule(card, rating){
    let stage = card.stage || 0;
    if(rating === 'forgot') stage = 1;
    else if(rating === 'hard') stage = Math.max(1, stage);
    else stage = Math.min(R.SRS_INTERVALS.length, stage + 1);

    /* Gerçek aralık: son tekrardan bu yana geçen gün. Unutma eğrisi bunu okur;
       planlanan aralık ile fiilen beklenen süre çoğu zaman aynı değildir. */
    const gapDays = card.lastReviewedAt ? U.diffDays(card.lastReviewedAt, U.todayISO()) : null;
    const result = rating === 'remembered' ? 'remembered' : rating === 'hard' ? 'hard' : 'forgot';

    const days = R.SRS_INTERVALS[stage-1] || 1;
    card.stage = stage;
    card.dueAt = U.iso(U.addDays(U.today(), days));
    card.lastResult = rating;
    card.lastReviewedAt = U.todayISO();
    card.history = (card.history || [])
      .concat([{ at:U.todayISO(), rating, result, stage, gapDays }])
      .slice(-40);
    return card;
  }

  /* Kart öncelik sırası: due kartlar rastgele değil, riskli konudan başlar. */
  function prioritizedDue(dateISO){
    const due = R.Calc.dueCards(dateISO);
    const risk = {};
    R.Calc.riskRanking().forEach(r => { risk[r.subjectId + ':' + r.topicName] = r.score; });
    const today = dateISO || U.todayISO();
    return due.slice().sort((a, b) => {
      const lateA = U.diffDays(a.dueAt, today);
      const lateB = U.diffDays(b.dueAt, today);
      if(lateA !== lateB) return lateB - lateA;                   // en gecikmiş önce
      const ra = risk[(a.subjectId || '') + ':' + (a.topic || '')] || 0;
      const rb = risk[(b.subjectId || '') + ':' + (b.topic || '')] || 0;
      if(ra !== rb) return rb - ra;                               // riskli konu önce
      return (a.stage || 0) - (b.stage || 0);                     // yeni kart önce
    });
  }

  /* ---------- weekly review ---------- */
  async function saveReview(n, data){
    const id = weekId(n);
    R.S.reviews[id] = data;
    await R.Store.set('reviews/'+id, data);
  }

  /* ---------- karar kapisi ---------- */
  async function saveDecision(key, data){
    R.S.decisions[key] = data;
    await R.Store.set('decisions/'+key, data);
  }

  /* ---------- telafi protokolleri ---------- */
  async function startProtocol(protoId){
    const def = R.RECOVERY_PROTOCOLS.find(p => p.id === protoId);
    const rec = {
      id:U.uid('p'), protoId, title:def.title,
      startedAt:U.todayISO(),
      endsAt:U.iso(U.addDays(U.today(), def.durationDays)),
      status:'active',
      steps:{},
      outcome:'',
    };
    R.S.protocols.push(rec);
    await R.Store.set('protocols/'+rec.id, rec);
    return rec;
  }
  async function saveProtocol(rec){
    const i = R.S.protocols.findIndex(p => p.id === rec.id);
    if(i >= 0) R.S.protocols[i] = rec; else R.S.protocols.push(rec);
    await R.Store.set('protocols/'+rec.id, rec);
  }
  function activeProtocols(){
    return R.S.protocols.filter(p => p.status === 'active');
  }

  /* ---------- profil ---------- */
  function defaultProfile(){
    return {
      name:'',
      city:'',
      examYear:2027,
      track:'SAY',
      program:'',
      targetRank:null,
      capacityHoursPerWeek:R.PROGRAM.capacityHoursPerWeek,
      studyDaysPerWeek:R.PROGRAM.studyDaysPerWeek,
      startDate:R.PROGRAM.startISO,      // serbestce degistirilebilir
      examTytISO:R.PROGRAM.examTytISO,
      examAytISO:R.PROGRAM.examAytISO,
      setupDone:false,                   // ilk kurulum yapildi mi
      diplomaGrade:70,
      previouslyPlaced:false,
      theme:'system',
      palette:R.DEFAULT_PALETTE,
      level:'orta',
      weakSubjects:[],
      coachTone:'dengeli',
      sleepTarget:7.5,
      createdAt:new Date().toISOString(),
    };
  }

  async function saveProfile(){
    await R.Store.set('profile/main', R.S.profile);
  }

  /* ---------- yedekleme takibi ---------- */
  async function markBackup(){
    R.S.meta = R.S.meta || {};
    R.S.meta.lastBackupAt = new Date().toISOString();
    // UTC damgasi yerel tarihten farkli gune dusebilir; yasi yerel tarihten hesapla.
    R.S.meta.lastBackupDate = U.todayISO();
    R.S.meta.schemaVersion = R.SCHEMA_VERSION;
    await R.Store.set('meta/backup', R.S.meta);
  }
  function backupAgeDays(){
    const meta = R.S.meta;
    if(!meta) return null;
    const date = meta.lastBackupDate || (meta.lastBackupAt ? meta.lastBackupAt.slice(0,10) : null);
    if(!date) return null;                          // hic yedek alinmamis
    return U.diffDays(date, U.todayISO());
  }
  /* Yedek hatirlatmasi: kayda deger veri var mi? */
  function dataFootprint(){
    const days = Object.values(R.S.days).filter(d =>
      d.blocks.some(b => b.status !== 'pending') || d.paragraphActual > 0).length;
    return {
      days,
      exams:R.S.exams.length,
      errors:R.S.errors.length,
      cards:R.S.cards.length,
      total: days + R.S.exams.length + R.S.errors.length + R.S.cards.length,
    };
  }
  function backupDue(){
    const foot = dataFootprint();
    if(foot.total < 5) return false;              // henuz korunacak veri yok
    const age = backupAgeDays();
    return age === null || age >= 7;
  }

  /* ---------- video / ders notu ----------
     Not bir derse ve konuya baglanir; oradan SRS kartina kopru kurulur.
     Transcript kullanicinin yapistirdigi metindir; otomatik cekilmez. */

  const YT_PATTERNS = [
    /youtube\.com\/watch\?[^#]*\bv=([\w-]{11})/i,
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/embed\/([\w-]{11})/i,
    /youtube\.com\/shorts\/([\w-]{11})/i,
    /youtube\.com\/live\/([\w-]{11})/i,
  ];

  /* URL'den saglayici ve video kimligi cikarilir; taninmazsa 'other' doner
     ve gomulu oynatici yerine dis baglanti gosterilir. */
  function parseVideoUrl(url){
    const raw = String(url || '').trim();
    if(!raw) return { provider:'other', videoId:null, url:'' };
    for(const re of YT_PATTERNS){
      const m = raw.match(re);
      if(m) return { provider:'youtube', videoId:m[1], url:raw };
    }
    return { provider:'other', videoId:null, url:raw };
  }

  function newVideoNote(patch){
    const parsed = parseVideoUrl(patch && patch.url);
    return Object.assign({
      id:U.uid('v'),
      title:'',
      url:parsed.url,
      provider:parsed.provider,
      videoId:parsed.videoId,
      subjectId:null,
      topicId:null,
      segments:[],
      transcript:'',
      watchedMin:0,
      done:false,
      source:'video',
      series:'',
      page:'',
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
    }, patch || {}, { url:parsed.url, provider:parsed.provider, videoId:parsed.videoId });
  }

  async function saveVideoNote(note){
    note.updatedAt = new Date().toISOString();
    const i = R.S.videoNotes.findIndex(n => n.id === note.id);
    if(i >= 0) R.S.videoNotes[i] = note; else R.S.videoNotes.unshift(note);
    await R.Store.set('videoNotes/'+note.id, note);
    return note;
  }
  async function deleteVideoNote(id){
    R.S.videoNotes = R.S.videoNotes.filter(n => n.id !== id);
    await R.Store.remove('videoNotes/'+id);
  }

  /* Zaman damgasi "mm:ss" veya "hh:mm:ss" olarak girilir, saniyeye cevrilir. */
  function parseTs(text){
    const raw = String(text == null ? '' : text).trim();
    if(!raw) return null;
    // Bos parca ("12:") Number ile 0'a duser; once bicimi dogrula.
    const chunks = raw.split(':');
    if(chunks.length > 3 || chunks.some(c => !/^\d+(\.\d+)?$/.test(c.trim()))) return null;
    const parts = chunks.map(c => Number(c));
    if(parts.some(x => !isFinite(x) || x < 0)) return null;
    if(parts.length === 1) return Math.round(parts[0]);
    if(parts.length === 2) return Math.round(parts[0]*60 + parts[1]);
    if(parts.length === 3) return Math.round(parts[0]*3600 + parts[1]*60 + parts[2]);
    return null;
  }
  function fmtTs(seconds){
    const s = Math.max(0, Math.round(Number(seconds) || 0));
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    return (h ? h+':'+U.pad2(m) : String(m)) + ':' + U.pad2(sec);
  }
  /* Zaman damgali baglanti — video disaridan da acilabilsin. */
  function tsUrl(note, seconds){
    if(!note || note.provider !== 'youtube' || !note.videoId) return note ? note.url : '';
    return 'https://www.youtube.com/watch?v='+note.videoId+'&t='+Math.round(seconds || 0)+'s';
  }

  /* Nottan tekrar karti — mevcut kart semasi ve SRS asamalari kullanilir,
     paralel bir tekrar sistemi kurulmaz. Kaynak 'note', referans not id'sidir.
     AI koc ayni kopruden gecer; boylece uretim yolu tek kalir. */
  const SEGMENT_TAGS = {
    not:   { label:'Not',   tone:'muted'  },
    kural: { label:'Kural', tone:'ok'     },
    ornek: { label:'Örnek', tone:'info'   },
    tuzak: { label:'Tuzak', tone:'warn'   },
    soru:  { label:'Soru',  tone:'danger' },
  };

  function noteTopicName(note){
    const s = R.SUBJECTS.find(x => x.id === note.subjectId);
    if(!s) return note.title || '';
    const t = s.topics.find(x => x.id === note.topicId);
    return t ? t.name : s.name;
  }

  function cardFromSegment(note, seg, patch){
    const tag = (SEGMENT_TAGS[seg.tag] || SEGMENT_TAGS.not).label.toLowerCase();
    const topic = noteTopicName(note);
    return newCard(Object.assign({
      front:(topic ? topic + ' — ' : '') + tag + ': bu ne diyordu?',
      back:seg.text,
      topic,
      subjectId:note.subjectId || null,
      source:'note',
      sourceRef:note.id,
    }, patch || {}));
  }


  /* Transcript'i cümlelere bölüp zaman damgası önerir.
     Otomatik çekilmez — aday metni yapıştırır, sistem böler, aday onaylar.
     Süre bilinmiyorsa eşit dağıtılır; bilinen süre varsa ona oranlanır. */
  function splitTranscript(text, totalSeconds){
    const raw = String(text || '').replace(/\s+/g, ' ').trim();
    if(!raw) return [];

    /* Zaman damgası zaten varsa ([12:30] ya da 12:30) onu kullan. */
    const stamped = raw.match(/(\[?\d{1,2}:\d{2}(?::\d{2})?\]?)/g);
    if(stamped && stamped.length >= 3){
      const parts = raw.split(/\[?\d{1,2}:\d{2}(?::\d{2})?\]?/).slice(1);
      return stamped.map((ts, i) => ({
        ts:parseTs(ts.replace(/[\[\]]/g, '')) || 0,
        text:(parts[i] || '').trim().slice(0, 240),
        tag:'not',
      })).filter(x => x.text.length > 8);
    }

    /* Damga yoksa cümlelere böl, süreyi orantılı dağıt. */
    const sentences = raw.split(/(?<=[.!?…])\s+/)
      .map(x => x.trim())
      .filter(x => x.length > 25);
    if(!sentences.length) return [];

    const total = Number(totalSeconds) || sentences.length * 25;
    const chars = sentences.reduce((a, x) => a + x.length, 0) || 1;
    let acc = 0;
    return sentences.slice(0, 60).map(x => {
      const at = Math.round(total * acc / chars);
      acc += x.length;
      return { ts:at, text:x.slice(0, 240), tag:guessTag(x) };
    });
  }

  /* Cümlenin biçiminden etiket tahmini — aday değiştirebilir. */
  function guessTag(text){
    const t = String(text).toLowerCase();
    if(/dikkat|tuzak|karıştır|sanılır|yanılg/.test(t)) return 'tuzak';
    if(/örneğin|örnek|mesela/.test(t)) return 'ornek';
    if(/kural|formül|tanım|eşittir|olur|gerekir/.test(t)) return 'kural';
    if(/\?$/.test(text.trim())) return 'soru';
    return 'not';
  }

  /* Not kalitesi: geri çağırma üretmeyen not, kart olarak da işe yaramaz. */
  function noteQuality(text){
    const t = String(text || '');
    const issues = R.NOTE_QUALITY.rules.filter(r => r.test(t));
    return {
      ok:issues.length === 0,
      issues:issues.map(r => ({ id:r.id, why:r.why })),
      length:t.trim().length,
    };
  }

  /* ---------- mesgale, enerji, mola ---------- */

  /* Katalog = sabit liste + kullanicinin ekledikleri − gizledikleri. */
  function activityCatalog(){
    const hidden = {};
    const custom = [];
    R.S.activities.forEach(a => {
      if(a.hidden) hidden[a.id] = true;
      if(a.custom) custom.push(a);
    });
    return R.ACTIVITIES.filter(a => !hidden[a.id]).concat(custom);
  }
  function activityById(id){
    return activityCatalog().find(a => a.id === id) || null;
  }
  async function saveActivity(rec){
    const i = R.S.activities.findIndex(a => a.id === rec.id);
    if(i >= 0) R.S.activities[i] = rec; else R.S.activities.push(rec);
    await R.Store.set('activities/'+rec.id, rec);
    return rec;
  }
  async function hideActivity(id, hidden){
    const existing = R.S.activities.find(a => a.id === id);
    if(existing && existing.custom && hidden){
      R.S.activities = R.S.activities.filter(a => a.id !== id);
      await R.Store.remove('activities/'+id);
      return;
    }
    await saveActivity(Object.assign({ id }, existing || {}, { hidden:!!hidden }));
  }

  async function saveMood(dateISO, patch){
    const date = dateISO || U.todayISO();
    const rec = Object.assign({ date, energy:3, note:'' }, R.S.mood[date] || {}, patch || {});
    rec.energy = U.clamp(Number(rec.energy) || 3, 1, 5);
    rec.at = new Date().toISOString();
    R.S.mood[date] = rec;
    await R.Store.set('mood/'+date, rec);
    return rec;
  }
  function moodOf(dateISO){ return R.S.mood[dateISO || U.todayISO()] || null; }
  /* Son n gunun enerji ortalamasi — trend icin, tek gune bakarak karar verilmez. */
  function energyAverage(days){
    const n = days || 7;
    const vals = [];
    for(let i = 0; i < n; i++){
      const rec = R.S.mood[U.iso(U.addDays(U.today(), -i))];
      if(rec && rec.energy != null) vals.push(rec.energy);
    }
    if(!vals.length) return null;
    return U.round(U.sum(vals)/vals.length, 1);
  }

  async function saveBreak(patch){
    const rec = Object.assign({
      id:U.uid('b'),
      dayISO:U.todayISO(),
      activityId:null,
      minutes:R.BREAK_RULE.shortMin,
      at:new Date().toISOString(),
    }, patch || {});
    R.S.breaks.unshift(rec);
    await R.Store.set('breaks/'+rec.id, rec);
    return rec;
  }
  function breaksOf(dateISO){
    const d = dateISO || U.todayISO();
    return R.S.breaks.filter(b => b.dayISO === d);
  }


  /* ---------- takvim istisnalari ----------
     Tatil, okul sinavi ya da yogun gun: plan bu gunleri gormezden gelmez,
     yuku komsu gunlere dagitir. load 0..1 = o gun calisilabilecek oran. */
  const CALENDAR_KINDS = {
    tatil:      { label:'Tatil / izin',   load:0,    tone:'muted' },
    okulSinavi: { label:'Okul sınavı',    load:0.35, tone:'warn'  },
    yogun:      { label:'Yoğun gün',      load:0.5,  tone:'warn'  },
    ekstra:     { label:'Ekstra çalışma', load:1.5,  tone:'ok'    },
  };

  async function saveCalendar(rec){
    const doc = Object.assign({ id:U.uid('k'), kind:'tatil', note:'' }, rec);
    if(doc.load == null) doc.load = (CALENDAR_KINDS[doc.kind] || CALENDAR_KINDS.tatil).load;
    const i = R.S.calendar.findIndex(x => x.id === doc.id);
    if(i >= 0) R.S.calendar[i] = doc; else R.S.calendar.push(doc);
    R.S.calendar.sort((a, b) => (a.from || '').localeCompare(b.from || ''));
    await R.Store.set('calendar/' + doc.id, doc);
    return doc;
  }
  async function deleteCalendar(id){
    R.S.calendar = R.S.calendar.filter(x => x.id !== id);
    await R.Store.remove('calendar/' + id);
  }
  /* Bir gunun calisma carpani: istisna yoksa 1. */
  function dayLoad(dateISO){
    const iso = dateISO || U.todayISO();
    const hit = R.S.calendar.find(x => iso >= x.from && iso <= (x.to || x.from));
    return hit ? { load:hit.load, kind:hit.kind, note:hit.note, id:hit.id } : { load:1, kind:null, note:'', id:null };
  }
  /* Haftanin kapasite carpani — plan ureteci ve otomasyon okur. */
  function weekLoad(n){
    const dates = weekDates(n).map(U.iso);
    const sum = dates.reduce((a, iso) => a + dayLoad(iso).load, 0);
    return U.round(sum / dates.length, 2);
  }
  function calendarInWeek(n){
    const from = U.iso(weekStart(n)), to = U.iso(weekEnd(n));
    return R.S.calendar.filter(x => (x.to || x.from) >= from && x.from <= to);
  }

  /* ---------- sureli deneme oturumu ----------
     Sinav gunu provasi: test basina kronometre, soru bazli isaret.
     Oturum bitince deneme kaydina donusur; dakikalar elle girilmez. */
  async function saveSession(rec){
    const doc = Object.assign({ id:U.uid('s'), createdAt:new Date().toISOString(), status:'running' }, rec);
    const i = R.S.sessions.findIndex(x => x.id === doc.id);
    if(i >= 0) R.S.sessions[i] = doc; else R.S.sessions.unshift(doc);
    await R.Store.set('sessions/' + doc.id, doc);
    return doc;
  }
  async function deleteSession(id){
    R.S.sessions = R.S.sessions.filter(x => x.id !== id);
    await R.Store.remove('sessions/' + id);
  }
  function sessionOf(id){ return R.S.sessions.find(x => x.id === id) || null; }
  function sessionForExam(examId){ return R.S.sessions.find(x => x.examId === examId) || null; }

  /* ---------- cok kullanicili profil ----------
     Ayni cihazda birden fazla aday. Her profil kendi anahtar onekinde durur;
     veriler karismaz, gecis tam yeniden yukleme ile olur. */
  function profileList(){
    const list = R.S.profiles.slice();
    if(!list.some(p => p.id === 'main')){
      list.unshift({ id:'main', name:(R.S.profile && R.S.profile.name) || 'Ana profil', createdAt:null });
    }
    return list;
  }
  function activeProfileId(){
    try{ return localStorage.getItem('rota.activeProfile') || 'main'; }
    catch(e){ return 'main'; }
  }
  async function saveProfileEntry(rec){
    const doc = Object.assign({ id:U.uid('p'), name:'Yeni profil', createdAt:new Date().toISOString() }, rec);
    const i = R.S.profiles.findIndex(x => x.id === doc.id);
    if(i >= 0) R.S.profiles[i] = doc; else R.S.profiles.push(doc);
    await R.Store.set('profiles/' + doc.id, doc);
    return doc;
  }
  function switchProfile(id){
    try{ localStorage.setItem('rota.activeProfile', id); }catch(e){}
    location.reload();
  }

  /* ---------- kotu gun protokolu ----------
     Sistem cokmesin diye tek dugmelik inis: hedef minimum gune duser,
     kalan bloklar "kotu gun" nedeniyle atlanir, seri korunur. */
  async function badDay(dateISO){
    const iso = dateISO || U.todayISO();
    const day = await ensureDay(iso);
    day.badDay = true;
    day.paragraphTarget = Math.min(day.paragraphTarget, R.ROUTINES.minimumDay.paragraphs);
    day.problemTarget = Math.min(day.problemTarget, R.ROUTINES.minimumDay.paragraphs);
    day.blocks.forEach(b => {
      if(b.slot === 'Dinlenme') return;
      if(b.status === 'pending'){
        b.status = 'skipped';
        b.skipReason = R.BAD_DAY.reason;
      }
    });
    await saveDay(iso);
    return day;
  }
  async function undoBadDay(dateISO){
    const iso = dateISO || U.todayISO();
    const day = R.S.days[iso];
    if(!day) return null;
    day.badDay = false;
    day.blocks.forEach(b => {
      if(b.skipReason === R.BAD_DAY.reason && b.status === 'skipped'){
        b.status = 'pending';
        b.skipReason = null;
      }
    });
    await saveDay(iso);
    return day;
  }

  /* ---------- dikkat dagilmasi ---------- */
  async function addDistraction(dateISO){
    const iso = dateISO || U.todayISO();
    const day = await ensureDay(iso);
    day.distractions = (day.distractions || 0) + 1;
    await saveDay(iso);
    return day.distractions;
  }

  /* ---------- tercih listesi ---------- */
  function defaultPrefs(){
    return { rows: Array.from({length:24}, (_,i)=>({ no:i+1, program:'', city:'', rank:'', note:'' })), updatedAt:null };
  }
  async function savePrefs(){
    await R.Store.set('prefs/main', R.S.prefs);
  }

  /* ---------- sema gocu ----------
     Kayitlar tek duzlem sozlukte durur; goc yikici degildir, yalniz eksik
     kaplari tamamlar ve sema surumunu yukseltir. Eski yedekler de acilir. */
  async function migrate(){
    const from = (R.S.meta && R.S.meta.schemaVersion) || 1;
    if(from >= R.SCHEMA_VERSION) return { from, to:R.SCHEMA_VERSION, changed:false };

    // v2 → v3: ogrenme akisi varliklari (videoNotes, activities, mood, breaks).
    // v3 → v4: takvim istisnalari, sureli oturumlar, profiller, kotu gun alanlari.
    // Goc yikici degildir; yeni koleksiyonlar bos baslar, ilk yazmada olusur.
    R.S.meta = R.S.meta || {};
    R.S.meta.schemaVersion = R.SCHEMA_VERSION;
    R.S.meta.migratedAt = new Date().toISOString();
    await R.Store.set('meta/backup', R.S.meta);
    return { from, to:R.SCHEMA_VERSION, changed:true };
  }

  /* ---------- yukleme ---------- */
  async function loadAll(){
    await R.Store.init();

    let profile = await R.Store.get('profile/main');
    if(!profile){ profile = defaultProfile(); await R.Store.set('profile/main', profile); }
    R.S.profile = profile;

    R.S.meta = (await R.Store.get('meta/backup')) || { lastBackupAt:null, schemaVersion:R.SCHEMA_VERSION };

    const [weeks, days, exams, errors, cards, reviews, decisions, protocols, prefs,
           videoNotes, activities, mood, breaks, plan, calendar, sessions, profiles] = await Promise.all([
      R.Store.list('weeks'),
      R.Store.list('days'),
      R.Store.list('exams'),
      R.Store.list('errors'),
      R.Store.list('cards'),
      R.Store.list('reviews'),
      R.Store.list('decisions'),
      R.Store.list('protocols'),
      R.Store.get('prefs/main'),
      R.Store.list('videoNotes'),
      R.Store.list('activities'),
      R.Store.list('mood'),
      R.Store.list('breaks'),
      R.Store.get('plan/main'),
      R.Store.list('calendar'),
      R.Store.list('sessions'),
      R.Store.list('profiles'),
    ]);

    const coachDocs = await R.Store.list('coach');
    R.S.coach = {};
    coachDocs.forEach(c => { if(c.id !== 'chat') R.S.coach[c.id] = c; });
    const chat = coachDocs.find(c => c.id === 'chat');
    R.S.coachChat = (chat && Array.isArray(chat.messages)) ? chat.messages : [];

    weeks.forEach(w => { R.S.weeks[w.id] = normWeek(w); });
    days.forEach(d => { R.S.days[d.id] = normDay(d); });
    R.S.exams = exams.map(normExam);
    R.S.errors = errors;
    R.S.cards = cards.map(normCard);
    reviews.forEach(r => { R.S.reviews[r.id] = r; });
    decisions.forEach(d => { R.S.decisions[d.id] = d; });
    R.S.protocols = protocols.map(normProtocol);
    R.S.prefs = (prefs && Array.isArray(prefs.rows) && prefs.rows.length === 24) ? prefs : defaultPrefs();

    R.S.videoNotes = videoNotes.map(normVideoNote)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    R.S.activities = activities;
    R.S.mood = {};
    mood.forEach(m => { R.S.mood[m.id] = normMood(m); });
    R.S.breaks = breaks.map(normBreak)
      .sort((a, b) => (b.at || '').localeCompare(a.at || ''));

    R.S.plan = (plan && plan.weeks && plan.weeks.length) ? plan : null;
    R.S.calendar = calendar.map(normCalendar).sort((a, b) => (a.from || '').localeCompare(b.from || ''));
    R.S.sessions = sessions.map(normSession).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    R.S.profiles = profiles;

    await migrate();

    for(const s of R.SUBJECTS){ await ensureTopics(s.id); }

    if(R.S.profile.setupDone) await ensurePlan();

    const cw = currentWeek();
    await ensureWeek(cw);
    await ensureDay(U.today());
    R.S.ui.weekView = cw;
    R.S.ready = true;
  }

  return {
    weekStart, weekEnd, weekId, weekDates, weekOf, currentWeek, daysUntilStart, programProgress, phaseOf, curriculumFor,
    defaultWeek, ensureWeek, saveWeek,
    defaultDay, ensureDay, saveDay, dayOf,
    ensureTopics, topicState, setTopicState,
    examNet, testNet, saveExam, deleteExam,
    saveError, deleteError,
    newCard, saveCard, deleteCard, schedule, prioritizedDue,
    saveReview, saveDecision,
    startProtocol, saveProtocol, activeProtocols,
    defaultProfile, saveProfile, defaultPrefs, savePrefs,
    activePlan, ensurePlan, replanFrom, planHealth,
    CALENDAR_KINDS, saveCalendar, deleteCalendar, dayLoad, weekLoad, calendarInWeek,
    saveSession, deleteSession, sessionOf, sessionForExam,
    profileList, activeProfileId, saveProfileEntry, switchProfile,
    badDay, undoBadDay, addDistraction,
    parseVideoUrl, newVideoNote, saveVideoNote, deleteVideoNote, parseTs, fmtTs, tsUrl,
    SEGMENT_TAGS, noteTopicName, cardFromSegment, splitTranscript, guessTag, noteQuality,
    activityCatalog, activityById, saveActivity, hideActivity,
    saveMood, moodOf, energyAverage, saveBreak, breaksOf,
    markBackup, backupAgeDays, backupDue, dataFootprint,
    migrate, loadAll,
  };
})();
