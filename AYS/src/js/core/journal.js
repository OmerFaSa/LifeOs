/* Ajan defteri — ajanlarin hatirladigi seyler.

   SORUN: bir ekip uyesini degerli yapan sey aylardir seni izliyor olmasidir
   ("sen pazartesileri hep atliyorsun"). Ama LLM'e "hatirla" demek, ona
   uydurma izni vermektir: model gecmiste olmayan bir sey soyler ve bunu
   kimse yakalayamaz.

   COZUM: hafiza LLM'in hatirladigi degil, VERININ DESTEKLEDIGI seydir.
   Iki yol vardir ve ikisi de kural motorundan gecer:

   1) BULUNAN gozlem (detect) — kural motoru gecmisi tarar ve oruntuyu
      kendisi bulur. Saklanmaz, her okumada yeniden hesaplanir; bu yuzden
      bayatlamaz ve dogrulugu tanim geregi kesindir.

   2) ONERILEN gozlem (record) — ajan yapisal bir olcut onerir
      ({olcut, karsilastirma, esik}), kural motoru bunu veri uzerinde
      calistirir. Dogrulanamayan gozlem deftere GIRMEZ. Deftere girmis
      gozlem de her okumada yeniden dogrulanir; artik dogru degilse duser.

   Serbest metin hicbir yolda hafizaya giremez. */

window.R = window.R || {};

R.Journal = (function(){
  const U = R.U, M = R.Model, C = R.Calc, S = R.S;

  const MAX_PER_AGENT = 12;

  /* ==================== dogrulanabilir olcutler ====================
     Bir gozlem ancak bu listedeki bir olcut uzerine kurulabilir.
     Liste kapalidir: ajan yeni olcut uyduramaz. */

  const METRICS = {
    planTamamlama:   { label:'plan tamamlama',   unit:'%',      agent:'rehber',
                       get:() => C.planCompletion(M.currentWeek()) },
    uykuOrtalamasi:  { label:'uyku ortalaması',  unit:' saat',  agent:'rehber',
                       get:() => C.sleepAverage(7) },
    enerjiOrtalamasi:{ label:'enerji ortalaması',unit:'/5',     agent:'rehber',
                       get:() => M.energyAverage(7) },
    davranisSerisi:  { label:'davranış serisi',  unit:' gün',   agent:'rehber',
                       get:() => C.behaviorStreak().streak },
    analizBorcu:     { label:'analiz borcu',     unit:' deneme',agent:'analist',
                       get:() => C.analysisDebt().length },
    tekrarBorcu:     { label:'tekrar borcu',     unit:'%',      agent:'analist',
                       get:() => C.cardDebt() },
    acikYanlis:      { label:'açık yanlış',      unit:' kayıt', agent:'analist',
                       get:() => C.openErrors().length },
    konuKapanisi:    { label:'konu kapanışı',    unit:'%',      agent:'analist',
                       get:() => C.overallClosure().pct },
    tytMedyan:       { label:'TYT medyanı',      unit:' net',   agent:'tyt',
                       get:() => C.medianTrend('TYT').last3 },
    tytKapanis:      { label:'TYT kapanışı',     unit:'%',      agent:'tyt',
                       get:() => C.examClosure('TYT').pct },
    aytMedyan:       { label:'AYT medyanı',      unit:' net',   agent:'ayt',
                       get:() => C.medianTrend('AYT').last3 },
    aytKapanis:      { label:'AYT kapanışı',     unit:'%',      agent:'ayt',
                       get:() => C.examClosure('AYT').pct },
  };

  const OPS = {
    lt:  { sign:'<',  test:(a, b) => a <  b },
    lte: { sign:'≤',  test:(a, b) => a <= b },
    gt:  { sign:'>',  test:(a, b) => a >  b },
    gte: { sign:'≥',  test:(a, b) => a >= b },
  };

  function metricList(){
    return Object.keys(METRICS).map(k => Object.assign({ key:k }, METRICS[k]));
  }

  /* Bir gozlemi veri uzerinde calistirir. */
  function verify(obs){
    if(!obs || !METRICS[obs.metric]) return { ok:false, why:'bilinmeyen ölçüt' };
    const op = OPS[obs.op];
    if(!op) return { ok:false, why:'bilinmeyen karşılaştırma' };
    const value = Number(obs.value);
    if(!Number.isFinite(value)) return { ok:false, why:'eşik sayı değil' };

    let actual;
    try{ actual = METRICS[obs.metric].get(); }
    catch(e){ return { ok:false, why:'ölçüt hesaplanamadı' }; }
    if(actual == null) return { ok:false, why:'bu ölçüt için henüz veri yok', actual:null };

    return { ok:op.test(actual, value), actual, metric:METRICS[obs.metric] };
  }

  /* Gozlemi okunur cumleye cevirir — metin kural motorundan uretilir,
     modelden gelmez. */
  function say(obs, actual){
    const m = METRICS[obs.metric];
    if(!m) return '';
    const op = OPS[obs.op];
    const val = a => (a == null ? '—' : U.fmtNet(a)) + (m.unit || '');
    return m.label + ' ' + op.sign + ' ' + val(obs.value)
      + (actual == null ? '' : ' (şu an ' + val(actual) + ')');
  }

  /* ==================== bulunan gozlemler ====================
     Kural motorunun tek bir anlik goruntude goremedigi oruntuler.
     Saklanmaz: her cagrida yeniden hesaplanir, bu yuzden bayatlamaz. */

  const TR_DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  /* Hangi gun daha cok blok atlaniyor? Tek haftadan degil, butun kayittan. */
  function weekdayMiss(){
    const stat = TR_DAYS.map(() => ({ done:0, total:0 }));
    Object.keys(S.days).forEach(iso => {
      const day = S.days[iso];
      if(!day || iso > U.todayISO()) return;
      const idx = U.weekdayIndex(iso);
      day.blocks.forEach(b => {
        if(b.slot === 'Dinlenme') return;
        stat[idx].total++;
        if(b.status === 'done') stat[idx].done++;
      });
    });
    const rows = stat.map((s, i) => ({ gun:TR_DAYS[i], ...s, pct:U.pct(s.done, s.total) }))
      .filter(r => r.total >= 3);
    if(rows.length < 3) return null;

    const worst = rows.slice().sort((a, b) => a.pct - b.pct)[0];
    const avg = U.pct(U.sum(rows.map(r => r.done)), U.sum(rows.map(r => r.total)));
    if(worst.pct >= avg - 15) return null;      // belirgin bir fark yoksa oruntu yok

    return {
      id:'weekday-miss', agent:'rehber', tone:'warn',
      text:worst.gun + ' günleri diğer günlerden belirgin olarak geride: '
        + 'bu günde blokların %' + worst.pct + '’i tamamlanmış, genel ortalama %' + avg + '.',
      evidence:{ gun:worst.gun, yuzde:worst.pct, ortalama:avg, blok:worst.total },
    };
  }

  /* Plan tamamlama kac haftadir hedefin altinda? */
  function planStreak(){
    const hist = C.completionHistory(8).filter(h => h.value != null);
    if(hist.length < 3) return null;
    let miss = 0;
    for(let i = hist.length - 1; i >= 0; i--){
      if(hist[i].value < 85) miss++; else break;
    }
    if(miss < 2) return null;
    return {
      id:'plan-streak', agent:'rehber', tone:miss >= 3 ? 'danger' : 'warn',
      text:miss + ' haftadır plan tamamlaması %85 hedefinin altında kalıyor '
        + '(son hafta %' + hist[hist.length - 1].value + ').',
      evidence:{ hafta:miss, sonDeger:hist[hist.length - 1].value },
    };
  }

  /* Ayni atlama nedeni haftalar boyu tekrar ediyor mu? */
  function repeatedSkip(){
    const cur = M.currentWeek();
    const totals = {};
    let weeks = 0;
    for(let n = Math.max(1, cur - 3); n <= cur; n++){
      const counts = C.skipReasonCounts(n);
      const keys = Object.keys(counts);
      if(!keys.length) continue;
      weeks++;
      keys.forEach(k => { totals[k] = (totals[k] || 0) + counts[k]; });
    }
    if(weeks < 2) return null;
    const top = Object.keys(totals).map(k => ({ neden:k, adet:totals[k] }))
      .sort((a, b) => b.adet - a.adet)[0];
    if(!top || top.adet < 3) return null;
    return {
      id:'repeated-skip', agent:'rehber', tone:'warn',
      text:'Son ' + weeks + ' haftada en sık atlama nedeni "' + top.neden + '" ('
        + top.adet + ' blok) — tek seferlik bir aksama değil, tekrar eden bir kalıp.',
      evidence:{ neden:top.neden, adet:top.adet, hafta:weeks },
    };
  }

  /* Uykunun deneme netine etkisi olculebiliyor mu? Belirgin degilse
     (|fark| < 2 net) gozlem uretilmez — zayif iliskiden cikarim yapilmaz. */
  function sleepLink(){
    const imp = R.Analytics.sleepImpact();
    if(!imp || !imp.ok || Math.abs(imp.diff) < 2) return null;
    return {
      id:'sleep-link', agent:'rehber', tone:imp.diff > 0 ? 'warn' : 'info',
      text:'Deneme öncesi yeterli uyunan günlerde medyanın '
        + U.fmtNet(Math.abs(imp.diff)) + ' net ' + (imp.diff > 0 ? 'yüksek' : 'düşük')
        + ' çıkıyor (' + imp.goodCount + ' yeterli, ' + imp.badCount + ' yetersiz uyku kaydı).',
      evidence:{ fark:imp.diff, yeterli:imp.goodCount, yetersiz:imp.badCount },
    };
  }

  /* Analiz borcu tekrar tekrar birikiyor mu? */
  function debtHabit(){
    const done = S.exams.filter(e => e.analysisCompletedAt);
    if(done.length < 4) return null;
    const late = done.filter(e => U.diffDays(e.date, e.analysisCompletedAt.slice(0, 10)) > 1);
    const pct = U.pct(late.length, done.length);
    if(pct < 50) return null;
    return {
      id:'debt-habit', agent:'analist', tone:'warn',
      text:'Analiz edilen denemelerin %' + pct + '’i 24 saatten geç çözümlenmiş ('
        + late.length + '/' + done.length + ') — borç birikmesi tek seferlik değil.',
      evidence:{ yuzde:pct, gec:late.length, toplam:done.length },
    };
  }

  /* Kapanan konular gercekten kapali kaliyor mu? */
  function reopenHabit(){
    let reopened = 0, closed = 0;
    R.SUBJECTS.forEach(s => s.topics.forEach(t => {
      const st = M.topicState(s.id, t.id);
      if(st.state === 'closed') closed++;
      if(st.state === 'reopened') reopened++;
    }));
    if(reopened < 2) return null;
    return {
      id:'reopen-habit', agent:'analist', tone:'warn',
      text:reopened + ' konu kapandıktan sonra yeniden açıldı; kapanış ölçütü '
        + 'erken uygulanıyor olabilir.',
      evidence:{ yenidenAcilan:reopened, kapali:closed },
    };
  }

  const DETECTORS = [weekdayMiss, planStreak, repeatedSkip, sleepLink, debtHabit, reopenHabit];

  /* Butun bulunan gozlemler. agentId verilirse yalniz o ajanin alanindakiler. */
  function detect(agentId){
    const out = [];
    DETECTORS.forEach(fn => {
      let obs = null;
      try{ obs = fn(); }catch(e){ obs = null; }
      if(obs) out.push(Object.assign({ kind:'bulunan' }, obs));
    });
    return agentId ? out.filter(o => o.agent === agentId) : out;
  }

  /* ==================== onerilen gozlemler ====================
     Ajan yapisal bir olcut onerir; kural motoru dogrular ve saklar. */

  function all(){ return S.journal || {}; }

  async function record(agentId, obs){
    if(!R.AGENT_BY_ID[agentId]) return { ok:false, why:'bilinmeyen ajan' };
    const check = verify(obs);
    if(!check.ok){
      return { ok:false, why:check.why || 'veri bu gözlemi desteklemiyor', actual:check.actual };
    }
    const entry = {
      id:U.uid('j'),
      agent:agentId,
      metric:obs.metric, op:obs.op, value:Number(obs.value),
      note:String(obs.note || '').slice(0, 160),
      at:new Date().toISOString(),
      seenAt:new Date().toISOString(),
      actual:check.actual,
    };
    S.journal = S.journal || {};
    const list = (S.journal[agentId] || []).filter(e =>
      !(e.metric === entry.metric && e.op === entry.op && e.value === entry.value));
    list.unshift(entry);
    S.journal[agentId] = list.slice(0, MAX_PER_AGENT);
    await R.Store.set('journal/' + agentId, { entries:S.journal[agentId] });
    return { ok:true, entry };
  }

  /* Saklanan gozlemler her okumada YENIDEN dogrulanir: veri degistiyse
     gozlem duser. Boylece defter bayat bilgi tasimaz. */
  function forAgent(agentId){
    const stored = (all()[agentId] || []).map(e => {
      const check = verify(e);
      return Object.assign({}, e, { kind:'önerilen', stillTrue:check.ok, actual:check.actual });
    });
    return stored.filter(e => e.stillTrue);
  }

  async function prune(agentId){
    const keep = forAgent(agentId).map(e => {
      const copy = Object.assign({}, e);
      delete copy.kind; delete copy.stillTrue;
      return copy;
    });
    S.journal = S.journal || {};
    S.journal[agentId] = keep;
    await R.Store.set('journal/' + agentId, { entries:keep });
    return keep;
  }

  async function clear(agentId){
    S.journal = S.journal || {};
    delete S.journal[agentId];
    await R.Store.remove('journal/' + agentId);
  }

  /* Bir ajanin defteri: bulunan + dogrulanmis onerilen gozlemler. */
  function forBrief(agentId){
    const found = detect(agentId).map(o => ({ kind:'bulunan', tone:o.tone, text:o.text }));
    const proposed = forAgent(agentId).map(e => ({
      kind:'önerilen', tone:'info', text:say(e, e.actual) + (e.note ? ' — ' + e.note : ''),
    }));
    return found.concat(proposed);
  }

  /* ==================== guven skoru ====================
     Bir ajanin alanina dusen kararlarin kaci uygulandi?
     Karar kural motorundan gelir (Calc.nextAction) ve is anahtari
     R.ACTION_OWNER ile bir ajana baglanir. */

  function ownerOf(decision){
    if(!decision) return null;
    if(decision.owner) return decision.owner;
    return R.ACTION_OWNER[decision.key] || null;
  }

  function trust(agentId){
    const rows = (S.officeMeetings || [])
      .map(m => m.decision)
      .filter(d => d && ownerOf(d) === agentId);
    const closed = rows.filter(d => d.state !== 'open');
    const done = rows.filter(d => d.state === 'done');
    return {
      toplam:rows.length,
      kapanan:closed.length,
      uygulanan:done.length,
      yuzde:closed.length ? U.pct(done.length, closed.length) : null,
    };
  }

  function trustAll(){
    const out = {};
    R.AGENT_IDS.forEach(id => { out[id] = trust(id); });
    return out;
  }

  /* ==================== yukleme ==================== */

  async function load(){
    const docs = await R.Store.list('journal');
    S.journal = {};
    (docs || []).forEach(d => {
      if(!R.AGENT_BY_ID[d.id]) return;
      S.journal[d.id] = Array.isArray(d.entries) ? d.entries.slice(0, MAX_PER_AGENT) : [];
    });
    return S.journal;
  }

  return {
    METRICS, OPS, metricList,
    verify, say, record, forAgent, forBrief, prune, clear, all,
    detect, DETECTORS,
    trust, trustAll, ownerOf,
    load, MAX_PER_AGENT,
  };
})();
