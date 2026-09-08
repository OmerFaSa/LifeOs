/* KPI hesaplari, karar kapisi mantigi ve tetikleyiciler. */

window.R = window.R || {};

R.Calc = (function(){
  const U = R.U, M = R.Model, S = R.S;

  /* ---------- deneme ---------- */
  function fullExams(family){
    return S.exams
      .filter(e => e.family === family && e.kind === 'full')
      .sort((a,b) => a.date.localeCompare(b.date));
  }
  function comparableNets(family){
    return fullExams(family).map(M.examNet);
  }
  function medianTrend(family){
    const list = comparableNets(family);
    const last3 = list.length >= 3 ? U.median(list.slice(-3)) : null;
    const prev3 = list.length >= 6 ? U.median(list.slice(-6,-3)) : null;
    return {
      count:list.length,
      last3: last3 == null ? null : U.round(last3,1),
      prev3: prev3 == null ? null : U.round(prev3,1),
      delta: (last3 != null && prev3 != null) ? U.round(last3-prev3,1) : null,
      series:list.map(v => U.round(v,1)),
    };
  }
  function examBase(family){
    const list = comparableNets(family);
    if(!list.length) return null;
    return U.round(Math.min.apply(null, list.slice(-4)), 1);
  }
  /* Test bazli medyan — net matrisi icin */
  function testMedian(testName, family){
    const vals = fullExams(family)
      .slice(-4)
      .map(e => (e.tests || []).find(t => t.name === testName))
      .filter(Boolean)
      .map(M.testNet);
    const m = U.median(vals);
    return m == null ? null : U.round(m, 2);
  }
  function analysisDebt(){
    return S.exams.filter(e => {
      if(e.analysisCompletedAt) return false;
      return U.diffDays(e.date, U.todayISO()) >= 1;
    });
  }
  function examVolumeProgress(){
    return R.EXAM_VOLUME.map(row => {
      const from = M.weekStart(row.weeks[0]);
      const to = U.addDays(M.weekStart(row.weeks[1]), 6);
      const inRange = e => {
        const d = U.parse(e.date);
        return d >= from && d <= to;
      };
      const tyt = S.exams.filter(e => inRange(e) && e.family === 'TYT' && e.kind === 'full').length;
      const ayt = S.exams.filter(e => inRange(e) && e.family === 'AYT' && e.kind === 'full').length;
      const branch = S.exams.filter(e => inRange(e) && (e.kind === 'branch' || e.kind === 'mini' || e.kind === 'partial')).length;
      return Object.assign({}, row, { actual:{ tyt, ayt, branch }, from:U.iso(from), to:U.iso(to) });
    });
  }

  /* ---------- hata ---------- */
  function errorDistribution(sinceISO){
    const counts = { K:0, 'İ':0, Y:0, S:0, D:0 };
    S.errors.forEach(e => {
      if(sinceISO && e.createdAt && e.createdAt.slice(0,10) < sinceISO) return;
      if(counts[e.tag] !== undefined) counts[e.tag]++;
    });
    return counts;
  }
  function errorPareto(sinceISO){
    const dist = errorDistribution(sinceISO);
    const total = U.sum(Object.values(dist));
    return Object.keys(dist)
      .map(k => ({ tag:k, count:dist[k], pct: total ? U.pct(dist[k], total) : 0 }))
      .sort((a,b) => b.count - a.count);
  }
  function topTags(n){
    return errorPareto().filter(r => r.count > 0).slice(0, n || 2);
  }
  function openErrors(){ return S.errors.filter(e => !e.closedAt); }

  /* ---------- kartlar ---------- */
  function dueCards(dateISO){
    const day = dateISO || U.todayISO();
    return S.cards.filter(c => c.dueAt <= day);
  }
  function overdueCards(){
    const t = U.todayISO();
    return S.cards.filter(c => c.dueAt < t);
  }
  function cardDebt(){
    const due = dueCards();
    if(!due.length) return 0;
    return U.pct(overdueCards().length, due.length);
  }

  /* ---------- plan ve sorular ---------- */
  function weekBlocks(n, onlyPast){
    const out = [];
    M.weekDates(n).forEach(d => {
      const iso = U.iso(d);
      if(onlyPast && iso > U.todayISO()) return;
      const day = S.days[iso];
      if(!day) return;
      day.blocks.forEach(b => {
        if(b.slot === 'Dinlenme') return;
        out.push(Object.assign({ dayISO:iso }, b));
      });
    });
    return out;
  }
  function planCompletion(n){
    const blocks = weekBlocks(n, true).filter(b => b.status !== 'pending' || b.dayISO < U.todayISO());
    if(!blocks.length) return null;
    const score = blocks.reduce((s,b) => s + (b.status === 'done' ? 1 : b.status === 'partial' ? 0.5 : 0), 0);
    return U.pct(score, blocks.length);
  }
  function questionRealization(n){
    const week = S.weeks[M.weekId(n)];
    if(!week) return null;
    const solved = U.sum(weekBlocks(n).map(b => b.actualQ || 0));
    return { solved, target:week.questionTarget, pct:U.pct(solved, week.questionTarget) };
  }
  function timeRealization(n){
    const blocks = weekBlocks(n);
    const target = U.sum(blocks.map(b => b.targetMin || 0));
    const actual = U.sum(blocks.map(b => b.actualMin || 0));
    return { target, actual, pct:U.pct(actual, target) };
  }
  function plannedMinutes(n){
    return U.sum(weekBlocks(n).map(b => b.targetMin || 0));
  }
  function capacityLoad(n){
    const week = S.weeks[M.weekId(n)];
    if(!week) return null;
    const planned = plannedMinutes(n);
    return { planned, capacity:week.capacityMin, pct:U.pct(planned, week.capacityMin) };
  }
  function completionHistory(count){
    const cur = M.currentWeek();
    const out = [];
    for(let n = Math.max(1, cur - (count||8) + 1); n <= cur; n++){
      out.push({ n, value:planCompletion(n) });
    }
    return out;
  }
  function skipReasonCounts(n){
    const counts = {};
    weekBlocks(n).forEach(b => {
      if(b.skipReason) counts[b.skipReason] = (counts[b.skipReason] || 0) + 1;
    });
    return counts;
  }

  /* ---------- konu kapanisi ---------- */
  function subjectClosure(subjectId){
    const subject = R.SUBJECTS.find(s => s.id === subjectId);
    if(!subject) return { closed:0, total:0, pct:0 };
    let closed = 0, started = 0;
    subject.topics.forEach(t => {
      const st = M.topicState(subjectId, t.id);
      if(st.state === 'closed') closed++;
      if(st.state !== 'not_started') started++;
    });
    return { closed, started, total:subject.topics.length, pct:U.pct(closed, subject.topics.length) };
  }
  function overallClosure(){
    let closed = 0, total = 0;
    R.SUBJECTS.forEach(s => {
      const c = subjectClosure(s.id);
      closed += c.closed; total += c.total;
    });
    return { closed, total, pct:U.pct(closed, total) };
  }
  function examClosure(examKind){
    let closed = 0, total = 0;
    R.SUBJECTS.filter(s => s.exam === examKind).forEach(s => {
      const c = subjectClosure(s.id);
      closed += c.closed; total += c.total;
    });
    return { closed, total, pct:U.pct(closed, total) };
  }
  /* 7 gun sonraki ikinci olcumu bekleyen konular */
  function pendingSecondChecks(){
    const out = [];
    R.SUBJECTS.forEach(s => {
      s.topics.forEach(t => {
        const st = M.topicState(s.id, t.id);
        if(st.first != null && st.second == null && st.firstAt){
          const dueISO = U.iso(U.addDays(U.parse(st.firstAt), R.CLOSURE_RULE.gapDays));
          out.push({ subjectId:s.id, subjectName:s.name, topicId:t.id, topicName:t.name, dueISO,
            overdue: dueISO <= U.todayISO() });
        }
      });
    });
    return out.sort((a,b) => a.dueISO.localeCompare(b.dueISO));
  }

  /* ---------- uyku ---------- */
  function sleepAverage(days){
    const n = days || 7;
    const vals = [];
    for(let i = 0; i < n; i++){
      const d = S.days[U.iso(U.addDays(U.today(), -i))];
      if(d && d.sleepHours) vals.push(Number(d.sleepHours));
    }
    if(!vals.length) return null;
    return U.round(U.sum(vals)/vals.length, 1);
  }

  /* ---------- karar kapisi ---------- */
  function currentGate(){
    const month = U.monthName(U.today());
    const gate = R.MONTH_GATES[month];
    if(!gate) return null;
    return Object.assign({ month }, gate);
  }
  function gateStatus(value, band, safeBand){
    if(value == null) return 'unknown';
    if(safeBand && value >= safeBand[0]) return 'safe';
    if(value >= band[0] && value <= band[1]) return 'inband';
    if(value > band[1]) return 'above';
    return 'below';
  }
  /* En fazla 3 oneri; ilki tetiklenen esik kurali */
  function gateSuggestions(gate){
    const out = [];
    const tyt = medianTrend('TYT'), ayt = medianTrend('AYT');
    const tytStatus = gateStatus(tyt.last3, gate.tyt, gate.tytSafe);
    const aytStatus = gate.ayt ? gateStatus(ayt.last3, gate.ayt, gate.aytSafe) : 'unknown';

    out.push({
      id:'gate-rule',
      text:gate.note,
      why:'Bu ayın kapı kuralı' + (tytStatus === 'below' ? ' — TYT medyanı gözlenen bandın altında.' : '.'),
    });

    const tags = topTags(2);
    if(tags.length){
      const t = tags[0];
      out.push({
        id:'tag-block',
        text:'En baskın hata etiketi '+t.tag+' ('+R.ERROR_TAGS[t.tag].name+', '+t.count+' kayıt, %'+t.pct+') → gelecek haftaya 2 ek blok: '+R.ERROR_TAGS[t.tag].recipe+'.',
        why:'Hata paretosunun ilk sırası',
      });
    }

    const closure = overallClosure();
    const base = examBase('TYT');
    if(closure.pct < 55 && closure.total){
      out.push({ id:'closure', text:'Konu kapanışı %'+closure.pct+' — yeni kaynak açma; açık konuları plana taşı ve ikinci ölçümleri tamamla.', why:'Konu kapanış oranı düşük' });
    }else if(base != null && tyt.last3 != null && base < tyt.last3 - 6){
      out.push({ id:'base', text:'Taban skor medyanın belirgin altında ('+base+' / '+tyt.last3+') — bir hafta hacmi %20 azalt, uyku ve analiz kalitesini düzelt.', why:'Kötü gün dayanıklılığı zayıf' });
    }else{
      out.push({ id:'volume', text:'Kaynak değiştirmeden mevcut hata paretosuna göre bir hafta hacmi %20 azalt ve analiz kalitesini artır.', why:'Varsayılan güvenli müdahale' });
    }

    return { suggestions:out.slice(0,3), tytStatus, aytStatus, tyt, ayt };
  }

  /* ---------- telafi tetikleyicileri ---------- */
  function protocolTriggers(){
    // Program baslamadan sapma olcumu anlamli degildir.
    if(M.daysUntilStart() > 0) return [];
    const hits = [];
    const cur = M.currentWeek();

    const p1 = planCompletion(cur-1), p2 = planCompletion(cur-2);
    if(p1 != null && p2 != null && p1 < 80 && p2 < 80){
      hits.push({ id:'two-weeks-behind', detail:'Son iki hafta: %'+p1+' ve %'+p2+' plan tamamlama.' });
    }

    const ayt = medianTrend('AYT');
    const month = U.monthName(U.today());
    if((month === 'Mart' || month === 'Nisan') && ayt.last3 != null && ayt.last3 < 20){
      hits.push({ id:'ayt-late', detail:'AYT medyanı '+ayt.last3+' — 20 netin altında.' });
    }

    const tytMath = testMedian('Temel Matematik','TYT');
    const aytMath = testMedian('Matematik','AYT');
    if((month === 'Ekim' || month === 'Kasım') && tytMath != null && tytMath < 8){
      hits.push({ id:'math-weak', detail:'TYT Matematik medyanı '+U.fmtNet(tytMath)+' — 8 netin altında.' });
    }else if((month === 'Mart' || month === 'Nisan') && aytMath != null && aytMath < 10){
      hits.push({ id:'math-weak', detail:'AYT Matematik medyanı '+U.fmtNet(aytMath)+' — 10 netin altında.' });
    }

    const tyt = medianTrend('TYT');
    if(tyt.count >= 4 && tyt.delta != null && Math.abs(tyt.delta) < 1.5){
      hits.push({ id:'flat-nets', detail:'Son 3 medyan ile önceki 3 medyan farkı '+tyt.delta+' net.' });
    }

    let gap = 0;
    for(let i = 1; i <= 7; i++){
      const dayISO = U.iso(U.addDays(U.today(), -i));
      if(dayISO < R.PLAN.startISO) break;
      const d = S.days[dayISO];
      const touched = d && (d.blocks.some(b => b.status !== 'pending') || d.paragraphActual > 0);
      if(touched) break;
      gap++;
    }
    if(gap >= 3) hits.push({ id:'illness-break', detail:gap+' gündür kayıt yok.' });

    const active = M.activeProtocols().map(p => p.protoId);
    return hits.filter(h => active.indexOf(h.id) === -1);
  }

  /* ---------- calisma yogunlugu (heatmap) ---------- */
  /* Her gun icin 0..1 arasi yogunluk: gerceklesen dakika / hedef dakika */
  function intensityGrid(){
    const cells = [];
    const ticks = [];
    let lastMonth = null;
    for(let n = 1; n <= R.PLAN.totalWeeks; n++){
      const start = M.weekStart(n);
      const month = start.getMonth();
      if(month !== lastMonth){
        ticks.push({ col:n-1, label:U.MONTHS_SHORT[month] });
        lastMonth = month;
      }
      M.weekDates(n).forEach(d => {
        const iso = U.iso(d);
        const day = S.days[iso];
        const future = iso > U.todayISO();
        let value = null, missed = false;
        if(day){
          const target = U.sum(day.blocks.filter(b => b.slot !== 'Dinlenme').map(b => b.targetMin || 0));
          const actual = U.sum(day.blocks.map(b => b.actualMin || 0));
          if(actual > 0) value = target ? U.clamp(actual/target, 0, 1) : 1;
          else if(!future && day.blocks.some(b => b.status === 'skipped')) missed = true;
        }else if(!future && iso >= R.PLAN.startISO){
          missed = true;
        }
        cells.push({
          value, future, missed, iso,
          label:U.fmtDate(iso) + (value != null ? ' · %'+Math.round(value*100)+' yük' : future ? ' · planlandı' : missed ? ' · kayıt yok' : ''),
        });
      });
    }
    return { cells, ticks };
  }

  /* Test bazli net serisi — her test icin ayri trend */
  function testSeries(family){
    const exams = fullExams(family);
    const names = [];
    exams.forEach(e => (e.tests || []).forEach(t => { if(names.indexOf(t.name) === -1) names.push(t.name); }));
    return names.map(name => ({
      name,
      data:exams.map(e => {
        const t = (e.tests || []).find(x => x.name === name);
        return t ? U.round(M.testNet(t), 2) : null;
      }),
      labels:exams.map(e => U.fmtShort(e.date)),
    }));
  }

  /* ---------- gunluk minimum ---------- */
  function minimumDayMet(dayISO){
    const day = S.days[dayISO || U.todayISO()];
    if(!day) return false;
    const mins = U.sum(day.blocks.map(b => b.actualMin || 0));
    const due = dueCards().length;
    const reviewedToday = S.cards.filter(c => c.lastReviewedAt === (dayISO || U.todayISO())).length;
    return mins >= R.ROUTINES.minimumDay.minutes
      && day.paragraphActual >= R.ROUTINES.minimumDay.paragraphs
      && (due === 0 || reviewedToday > 0);
  }

  /* ---------- siradaki hamle ----------
     Karar yorgunlugunu azaltmak icin tek bir oncelik dondurur.
     Sira sabittir: borc > gecikme > gunun rituali > olcum > blok > cipa. */
  function nextAction(){
    const todayISO = U.todayISO();
    const day = S.days[todayISO];
    const n = M.currentWeek();
    const week = S.weeks[M.weekId(n)];
    const dow = U.weekdayIndex(U.today());
    const beforeStart = M.daysUntilStart() > 0;

    const debt = analysisDebt();
    if(debt.length){
      return { key:'analysis', icon:'exam', label:'Analiz borcu',
        title:debt.length === 1 ? 'Denemenin analizini bitir' : debt.length+' denemenin analizini bitir',
        why:'Analiz edilmemiş deneme, analiz edilenden daha düşük değerlidir.',
        route:'exams', tone:'urgent' };
    }

    const overdue = overdueCards();
    if(overdue.length >= 5 || cardDebt() > 10){
      return { key:'cards', icon:'cards', label:'Tekrar borcu',
        title:overdue.length+' gecikmiş kartı çöz',
        why:'Borç %10’u aştı; yeni kart üretmeden önce borcu sadeleştir.',
        route:'cards', tone:'urgent' };
    }

    if(!beforeStart && dow === 0 && week && !week.signedAt){
      return { key:'contract', icon:'week', label:'Pazartesi ritüeli',
        title:'Haftalık sözleşmeyi imzala',
        why:'Geçen haftanın verisi görülmeden yeni hedef yazılmaz — 15 dakika.',
        route:'week', tone:'ritual' };
    }
    if(!beforeStart && dow === 6 && !S.reviews[M.weekId(n)]){
      return { key:'review', icon:'check', label:'Pazar ritüeli',
        title:'Weekly review’u doldur',
        why:'Planlandı / yapıldı / neden sapıldı / düzeltme — 30–40 dakika.',
        route:'week', act:'open-review', tone:'ritual' };
    }
    if(!beforeStart && dow === 5 && !S.exams.some(e => e.date === todayISO)){
      return { key:'exam', icon:'exam', label:'Cumartesi ritüeli',
        title:'Bugünün denemesini gir',
        why:'Deneme yalnız skor üretmez; gelecek haftanın ders dağılımını belirler.',
        route:'exams', act:'new-exam', tone:'ritual' };
    }

    const pending = pendingSecondChecks().filter(p => p.overdue);
    if(pending.length){
      return { key:'second-check', icon:'book', label:'Bekleyen ölçüm',
        title:pending[0].topicName+' için 7. gün testi',
        why:'İkinci ölçüm yapılmadan konu kapanmaz'+(pending.length > 1 ? ' — '+pending.length+' konu bekliyor.' : '.'),
        route:'subjects', tone:'normal' };
    }

    if(day){
      const running = day.blocks.find(b => b.startedAt);
      if(running){
        return { key:'running', icon:'clock', label:'Devam eden blok',
          title:running.topic, why:'Zamanlayıcı çalışıyor — odak modunda kal.',
          act:'focus-open', tone:'active' };
      }
      const next = day.blocks.find(b => b.status === 'pending' && b.slot !== 'Dinlenme');
      if(next){
        return { key:'block', icon:'play', label:'Sıradaki blok',
          title:next.topic,
          why:next.slot+' · '+next.targetMin+' dakika'+(next.targetQ ? ' · '+next.targetQ+' soru hedefi' : ''),
          act:'timer-start', blockId:next.id, tone:'normal' };
      }
      if(day.paragraphActual < day.paragraphTarget){
        return { key:'anchor', icon:'book', label:'Günlük çıpa',
          title:'Paragraf çıpasını tamamla',
          why:(day.paragraphTarget - day.paragraphActual)+' paragraf kaldı — çıpa konudan bağımsız düşmez.',
          tone:'normal' };
      }
      if(day.problemActual < day.problemTarget){
        return { key:'anchor2', icon:'chart', label:'Günlük çıpa',
          title:'Problem çıpasını tamamla',
          why:(day.problemTarget - day.problemActual)+' soru kaldı.',
          tone:'normal' };
      }
    }

    const due = dueCards();
    if(due.length){
      return { key:'due', icon:'cards', label:'Tekrar', title:due.length+' kart seni bekliyor',
        why:'Günün son işi: due kartlar.', route:'cards', tone:'normal' };
    }

    return { key:'done', icon:'check', label:'Bugün', title:'Günün işi tamam',
      why:'Bloklar, çıpalar ve kartlar kapandı. Erken uyku bugünün son maddesi.', tone:'calm' };
  }

  /* ---------- davranis serisi ----------
     Odul nete degil davranisa baglanir: minimum gun standardini tutturdugun
     ardisik gun sayisi. Pazar dinlenme gunu seriyi kirmaz. */
  function behaviorStreak(){
    let streak = 0;
    let checking = 0;
    const days = [];
    for(let i = 0; i < 60; i++){
      const iso = U.iso(U.addDays(U.today(), -i));
      if(iso < R.PLAN.startISO) break;
      const met = minimumDayMet(iso);
      const isSunday = U.weekdayIndex(iso) === 6;
      if(i < 14) days.unshift({ iso, met, isSunday, today:i === 0 });
      if(i === 0 && !met) { checking = 1; continue; }   // bugun henuz bitmedi, seriyi kirma
      if(met) streak++;
      else if(isSunday) continue;                       // pazar dinlenme
      else break;
    }
    return { streak, days, pendingToday:checking === 1 };
  }

  /* ---------- OBP ---------- */
  function obp(profile){
    const p = profile || S.profile;
    const value = U.clamp(p.diplomaGrade * R.OBP.multiplier, R.OBP.min, R.OBP.max);
    const coef = p.previouslyPlaced ? R.OBP.coefRepeat : R.OBP.coefFirst;
    return { value:U.round(value,0), coef, contribution:U.round(value*coef, 1) };
  }

  /* ==================== puan ve sıra tahmini ====================
     Kural: tek denemeyle konusulmaz, medyan esas alinir; sonuc her zaman
     bant + kesinlik etiketiyle doner. Tek sayi vaadi verilmez. */

  function bandWidth(sampleCount){
    const w = R.SCORING.bandHalfWidth;
    if(sampleCount >= 8) return w.many;
    if(sampleCount >= 5) return w.some;
    return w.few;
  }

  /* Ham net → 500'luk olcekte yaklasik puan (OBP haric). */
  function rawScore(tytNet, aytNet){
    const S1 = R.SCORING;
    const tytPart = S1.base + (Number(tytNet) || 0) * S1.tyt.perNet;
    if(aytNet == null) return { kind:'TYT', value:U.clamp(tytPart, S1.base, S1.tyt.maxRaw) };
    const aytPart = S1.base + (Number(aytNet) || 0) * S1.ayt.perNet;
    const mixed = S1.ayt.tytWeight * tytPart + S1.ayt.aytWeight * aytPart;
    return { kind:'SAY', value:U.clamp(mixed, S1.base, S1.tyt.maxRaw) };
  }

  /* Puan → sira: referans noktalari arasinda log-lineer aradeger. */
  function rankForScore(score){
    const t = R.SCORING.sayRankTable;
    if(!isFinite(score)) return null;
    if(score >= t[0].score) return t[0].rank;
    if(score <= t[t.length-1].score) return t[t.length-1].rank;
    for(let i = 0; i < t.length-1; i++){
      const hi = t[i], lo = t[i+1];
      if(score <= hi.score && score >= lo.score){
        const ratio = (score - lo.score) / (hi.score - lo.score);
        const logRank = Math.log(lo.rank) + ratio * (Math.log(hi.rank) - Math.log(lo.rank));
        return Math.round(Math.exp(logRank));
      }
    }
    return null;
  }

  /* Adayin su anki tahmini puan ve sira bandi.
     Girdi: son 3 tam denemenin medyani (tek deneme kullanilmaz). */
  function estimateScore(){
    const tyt = medianTrend('TYT');
    const ayt = medianTrend('AYT');
    const samples = fullExams('TYT').length;
    const o = obp();

    if(tyt.last3 == null){
      return {
        ok:false, position:'unknown', samples,
        why:'En az 3 tam TYT denemesi gerekir; öncesinde tahmin yanıltıcı olur.',
      };
    }

    const raw = rawScore(tyt.last3, ayt.last3);
    const score = U.round(raw.value + o.contribution, 1);
    const half = bandWidth(samples);
    const low = U.round(score - half, 1);
    const high = U.round(score + half, 1);

    // Sira bandi ters yonludur: yuksek puan kucuk sira.
    const rankBest = rankForScore(high);
    const rankWorst = rankForScore(low);
    const rankMid = rankForScore(score);

    const target = (S.profile && S.profile.targetRank) || R.PROGRAM.refRank;
    const position = rankWorst == null ? 'unknown'
      : rankWorst <= target ? 'above'
      : rankBest <= target ? 'inband'
      : rankBest <= target * 1.35 ? 'near'
      : 'below';

    return {
      ok:true, samples, kind:raw.kind,
      tytMedian:tyt.last3, aytMedian:ayt.last3,
      obp:o.contribution,
      score, scoreLow:low, scoreHigh:high, halfWidth:half,
      rank:rankMid, rankBest, rankWorst,
      targetRank:target,
      position,
      meta:R.SCORING.positions.find(p => p.key === position) || R.SCORING.positions[4],
    };
  }

  /* Hedef siraya ulasmak icin gereken net farki — yon gostergesi.
     "Su kadar net daha" demek yerine "bu bandi tutmak icin" dili kullanilir. */
  function netGapToTarget(){
    const est = estimateScore();
    if(!est.ok) return null;
    const target = est.targetRank;
    const t = R.SCORING.sayRankTable;
    // Hedef siraya karsilik gelen puani ters aradegerle bul.
    let needScore = null;
    for(let i = 0; i < t.length-1; i++){
      const hi = t[i], lo = t[i+1];
      if(target >= hi.rank && target <= lo.rank){
        const ratio = (Math.log(target) - Math.log(lo.rank)) / (Math.log(hi.rank) - Math.log(lo.rank));
        needScore = lo.score + ratio * (hi.score - lo.score);
        break;
      }
    }
    if(needScore == null) return null;
    const diff = needScore - est.score;
    const perNet = est.kind === 'SAY'
      ? R.SCORING.ayt.perNet * R.SCORING.ayt.aytWeight + R.SCORING.tyt.perNet * R.SCORING.ayt.tytWeight
      : R.SCORING.tyt.perNet;
    return {
      needScore:U.round(needScore, 1),
      scoreDiff:U.round(diff, 1),
      netDiff:U.round(diff / perNet, 1),
      reached:diff <= 0,
    };
  }

  /* ==================== konu risk skoru ====================
     "Once neye calisayim?" sorusunu veriyle cevaplar. Tek bir sezgiye degil,
     bes olculebilir girdiye bakar: frekans, kapanis, hata, kart, tazelik. */

  const FREQ_SCORE = { high:1, mid:0.55, low:0.25 };

  /* Konuya bagli bloklardan gercek soru cozum dogrulugu.
     Bu, kapanis olcumunden bagimsiz ikinci bir kanittir: aday konuyu
     "kapali" isaretlemis olabilir ama pratikte dogrulugu dusuk olabilir. */
  function topicPractice(subjectId, topicId, days){
    const back = days || 45;
    let solved = 0, correct = 0, sessions = 0, lastISO = null;
    for(let i = 0; i < back; i++){
      const iso = U.iso(U.addDays(U.today(), -i));
      const day = S.days[iso];
      if(!day) continue;
      day.blocks.forEach(b => {
        if(b.subjectId !== subjectId) return;
        if(topicId && b.topicId !== topicId) return;
        if(!b.actualQ) return;
        solved += b.actualQ;
        correct += (b.correctQ || 0);
        sessions++;
        if(!lastISO || iso > lastISO) lastISO = iso;
      });
    }
    return {
      solved, correct, sessions, lastISO,
      accuracy: solved ? U.pct(correct, solved) : null,
    };
  }

  function topicRisk(subjectId, topicId){
    const subject = R.SUBJECTS.find(s => s.id === subjectId);
    const topic = subject ? subject.topics.find(t => t.id === topicId) : null;
    if(!topic) return null;

    const w = R.SCORING.riskWeights;
    const st = M.topicState(subjectId, topicId);

    // 1) frekans: sinavdaki agirlik
    const freq = FREQ_SCORE[topic.freq] != null ? FREQ_SCORE[topic.freq] : 0.55;

    // 2) kapanis: kapali konu risk uretmez
    const closureScore = st.state === 'closed' ? 0
      : st.state === 'provisional' ? 0.35
      : st.state === 'reopened' ? 1
      : st.state === 'practicing' ? 0.6
      : st.state === 'learning' ? 0.75
      : 1;                                    // not_started

    // 3) hata: bu konudan gelen acik yanlislar (3+ hata tavana yakin)
    const errs = S.errors.filter(e => !e.closedAt && e.subjectId === subjectId && e.topicId === topicId).length;
    const errorScore = U.clamp(errs / 3, 0, 1);

    // 4) kart: bu konunun gecikmis tekrar kartlari
    const late = overdueCards().filter(c => c.subjectId === subjectId).length;
    const cardScore = U.clamp(late / 5, 0, 1);

    // 5) tazelik: son olcumden bu yana gecen sure
    const lastAt = st.secondAt || st.firstAt || null;
    const staleDays = lastAt ? U.diffDays(lastAt, U.todayISO()) : null;
    const staleScore = st.state === 'not_started' ? 0.5
      : staleDays == null ? 0.5
      : U.clamp(staleDays / R.SCORING.staleDays, 0, 1);

    const practice = topicPractice(subjectId, topicId);
    // Pratikte dusuk dogruluk kapanisi gecersiz kilmaz ama riski geri yukseltir.
    const practicePenalty = (practice.accuracy != null && practice.accuracy < 70)
      ? U.clamp((70 - practice.accuracy) / 70, 0, 1) : 0;

    const base = freq*w.freq + closureScore*w.closure + errorScore*w.errors +
      cardScore*w.cards + staleScore*w.stale;
    const score = U.clamp(U.round(base + practicePenalty*w.errors, 0), 0, 100);

    const band = R.SCORING.riskBands.find(b => score >= b.min) || R.SCORING.riskBands[2];

    return {
      subjectId, topicId,
      subjectName:subject.name, topicName:topic.name,
      score, band:band.key, label:band.label, tone:band.tone,
      state:st.state, freq:topic.freq, errors:errs, staleDays,
      practice,
      parts:{ freq, closure:closureScore, errors:errorScore, cards:cardScore,
        stale:staleScore, practice:practicePenalty },
    };
  }

  /* Tum konularin risk siralamasi. limit verilirse kirpilir. */
  function riskRanking(limit){
    const out = [];
    R.SUBJECTS.forEach(s => {
      s.topics.forEach(t => {
        const r = topicRisk(s.id, t.id);
        if(r && r.score > 0) out.push(r);
      });
    });
    out.sort((a, b) => b.score - a.score);
    return limit ? out.slice(0, limit) : out;
  }

  /* ==================== günün akışı ====================
     Bugunun sirasi: izle → not → soru → kart → mola.
     nextAction() tek bir "sonraki hamle" verir; bu ise gunun tamamini
     adim adim gosterir ve her adimin neden orada oldugunu soyler. */

  function dailyFlow(){
    const todayISO = U.todayISO();
    const day = S.days[todayISO];
    const steps = [];

    const openNotes = S.videoNotes.filter(n => !n.done);
    const noteNoCards = S.videoNotes.filter(n =>
      n.segments.length && !S.cards.some(c => c.source === 'note' && c.sourceRef === n.id));

    // 1) izle / not al
    if(openNotes.length){
      steps.push({ key:'watch', icon:'play', route:'learn', label:'İzle ve not al',
        title:openNotes[0].title || 'Devam eden ders',
        why:'Yarım kalan ders, kapanmamış konu demektir.', done:false });
    }
    // 2) nottan kart
    if(noteNoCards.length){
      steps.push({ key:'note-cards', icon:'cards', route:'learn', label:'Nottan kart üret',
        title:noteNoCards.length+' dersin notu karta dönüşmedi',
        why:'Not tek başına tekrar değildir; geri çağırma kartı olmadan unutulur.', done:false });
    }
    // 3) bloklar
    const blocks = day ? day.blocks.filter(b => b.slot !== 'Dinlenme') : [];
    const doneBlocks = blocks.filter(b => b.status === 'done').length;
    if(blocks.length){
      steps.push({ key:'blocks', icon:'today', route:'today', label:'Soru çöz',
        title:doneBlocks+'/'+blocks.length+' blok tamam',
        why:'Konuyu bilmek ile soruda tanımak farklı becerilerdir.',
        done:doneBlocks >= blocks.length });
    }
    // 4) due kartlar
    const due = dueCards().length;
    steps.push({ key:'cards', icon:'cards', route:'cards', label:'Tekrarı kapat',
      title:due ? due+' kart bekliyor' : 'Bugünün kartları bitti',
      why:'Aralıklı tekrar, konu kapanışının tek ucuz yoludur.', done:due === 0 });
    // 5) analiz borcu
    const debt = analysisDebt();
    if(debt.length){
      steps.push({ key:'analysis', icon:'exam', route:'exams', label:'Analizi bitir',
        title:debt.length+' deneme analiz bekliyor',
        why:'Analiz edilmemiş deneme, analiz edilenden daha az değerlidir.', done:false });
    }
    // 6) mola
    const taken = M.breaksOf(todayISO).length;
    steps.push({ key:'break', icon:'moon', route:'today', label:'Mola ver',
      title:taken ? taken+' mola alındı' : 'Bugün mola alınmadı',
      why:'Mola dinlenme değil, pekişme aralığıdır. Blok arası 5–15 dakika.',
      done:taken > 0 });

    const doneCount = steps.filter(s => s.done).length;
    return { steps, done:doneCount, total:steps.length, pct:U.pct(doneCount, steps.length) };
  }

  /* ==================== mola önerisi ====================
     Enerjiye, saate ve gunun yukune gore mesgale onerir.
     Uykudan feda eden veya "sonra telafi et" diyen oneri uretmez. */

  function suggestBreak(){
    const todayISO = U.todayISO();
    const taken = M.breaksOf(todayISO);
    const mood = M.moodOf(todayISO);
    const energy = mood ? mood.energy : null;
    const hour = new Date().getHours();
    const day = S.days[todayISO];
    const running = day ? day.blocks.find(b => b.startedAt) : null;

    if(taken.length >= R.BREAK_RULE.maxPerDay){
      return { ok:false, reason:'Bugün '+taken.length+' mola verildi. Bundan sonrası mola değil kaçınmadır.' };
    }

    const longBlock = running && running.targetMin >= R.BREAK_RULE.shortAfterMin;
    const minutes = longBlock ? R.BREAK_RULE.longMin : R.BREAK_RULE.shortMin;

    // Enerji dusukse enerji isteyen mesgale onerilmez.
    let pool = M.activityCatalog().filter(a => a.minutes <= minutes + 10);
    if(energy != null && energy <= 2) pool = pool.filter(a => a.energy === 'low');
    else if(energy != null && energy >= 4) pool = pool.filter(a => a.energy !== 'low');

    // Gec saatte uyandiran mesgale onerilmez.
    if(hour >= 21) pool = pool.filter(a => a.kind !== 'beden' || a.energy === 'low');
    // Ayni gun tekrar eden oneriyi ele.
    const usedIds = taken.map(b => b.activityId);
    const fresh = pool.filter(a => usedIds.indexOf(a.id) < 0);
    const list = (fresh.length ? fresh : pool);

    if(!list.length) return { ok:false, reason:'Uygun meşgale bulunamadı.' };

    // Gunun tarihine gore dondur — her acilista degismesin, gunluk sabit kalsin.
    const seed = (U.diffDays('2026-01-01', todayISO) + taken.length) % list.length;
    const picks = [list[seed], list[(seed+1) % list.length], list[(seed+2) % list.length]]
      .filter((a, i, arr) => a && arr.indexOf(a) === i);

    return {
      ok:true, minutes, energy,
      picks,
      why:longBlock
        ? 'Uzun blok sonrası '+minutes+' dakikalık mola pekişmeyi artırır.'
        : 'Kısa blok sonrası '+minutes+' dakika yeter; uzun mola ritmi kırar.',
    };
  }

  /* Bugunun odulu — nete degil davranisa baglidir. */
  function todayReward(){
    const todayISO = U.todayISO();
    const min = minimumDayMet();
    const streak = behaviorStreak();
    const day = S.days[todayISO];
    const sleep = day && day.sleepHours != null ? day.sleepHours : null;
    const target = (S.profile && S.profile.sleepTarget) || 7.5;
    const analysisClean = analysisDebt().length === 0;
    const cardsClean = dueCards().length === 0;

    const earned = [];
    if(min) earned.push({ key:'minimum', label:'Minimum gün tutuldu', icon:'check' });
    if(sleep != null && sleep >= target - 0.5) earned.push({ key:'sleep', label:'Uyku hedefi tutuldu', icon:'moon' });
    if(analysisClean) earned.push({ key:'analysis', label:'Analiz borcu yok', icon:'exam' });
    if(cardsClean) earned.push({ key:'cards', label:'Tekrar kapandı', icon:'cards' });

    const all = earned.length >= 4;
    return {
      earned, streak, all,
      title: all ? 'Gün tam kapandı' : earned.length ? 'Bugün kazanılan' : 'Henüz kazanılmadı',
      note: all
        ? 'Dört davranışın dördü de tuttu. Ödül nete değil bu düzene bağlıdır.'
        : 'Ödül nete değil davranışa bağlıdır: düzen, analizin zamanında bitmesi, uyku.',
    };
  }

  /* Sinav haftasi modu: son iki haftada arayuz sadelesir, yeni konu acilmaz. */
  function examWeekMode(){
    const left = U.diffDays(U.todayISO(), R.PLAN.examTytISO);
    const weeks = Math.ceil(left / 7);
    return {
      active:left >= 0 && weeks <= R.EXAM_WEEK_MODE.weeksBefore,
      weeksLeft:weeks, daysLeft:left, note:R.EXAM_WEEK_MODE.note,
    };
  }

  /* Odul esigi — nete degil davranis serisine bagli. */
  function rewardTier(){
    const streak = behaviorStreak().streak;
    const reached = R.REWARD_TIERS.filter(t => streak >= t.days);
    const next = R.REWARD_TIERS.find(t => streak < t.days);
    return {
      streak,
      current:reached.length ? reached[reached.length-1] : null,
      next:next || null,
      toNext:next ? next.days - streak : 0,
    };
  }

  return {
    fullExams, comparableNets, medianTrend, examBase, testMedian, analysisDebt, examVolumeProgress,
    errorDistribution, errorPareto, topTags, openErrors,
    dueCards, overdueCards, cardDebt,
    weekBlocks, planCompletion, questionRealization, timeRealization, plannedMinutes, capacityLoad,
    completionHistory, skipReasonCounts,
    subjectClosure, overallClosure, examClosure, pendingSecondChecks,
    sleepAverage, intensityGrid, testSeries,
    currentGate, gateStatus, gateSuggestions,
    protocolTriggers, minimumDayMet, obp, nextAction, behaviorStreak,
    rawScore, rankForScore, estimateScore, netGapToTarget,
    topicRisk, riskRanking, topicPractice,
    dailyFlow, suggestBreak, todayReward, examWeekMode, rewardTier,
  };
})();
