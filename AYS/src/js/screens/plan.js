/* Program — tum programin zaman cizgisi ve yogunluk haritasi.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.plan = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  function WeekRow(n){
    const c = M.curriculumFor(n);
    const cur = M.currentWeek();
    const week = S.weeks[M.weekId(n)];
    const isCurrent = n === cur;
    const isPast = n < cur;
    const comp = (isPast || isCurrent) ? C.planCompletion(n) : null;

    return html`
      <div class="${['tlweek', isCurrent && 'is-current', isPast && 'is-past'].filter(Boolean).join(' ')}"
           data-act="open-week" data-n="${n}">
        <div><div class="tlweek__no">H${n}</div>
          <div class="tlweek__dates">${U.fmtRange(M.weekStart(n), M.weekEnd(n))}</div></div>
        <div class="minw0">
          <div class="row-sm wrap"><b class="small">${c.title}</b>
            ${when(isCurrent, () => K.Badge({ label:'şimdi', tone:'ok' }))}
            ${when(week && week.signedAt, () => K.Badge({ label:'imzalı', tone:'muted' }))}</div>
          <div class="tiny dim mt-2">${c.topics.join(' · ')}</div>
          <div class="tiny dim mt-2">Deneme: ${c.exam}</div>
        </div>
        <div class="tlweek__right right">
          <div class="num small strong">${c.q} soru</div>
          ${comp != null
            ? html`<div class="mt-5">${K.Bar({ value:comp, auto:true })}</div>
                   <div class="tiny dim">%${comp} tamamlandı</div>`
            : html`<div class="tiny dim">planlandı</div>`}
        </div>
      </div>`;
  }

  /* Faz aralıkları: üretilmiş plan varsa ondan, yoksa sabit fazlardan. */
  function phaseRanges(){
    const total = R.PLAN.totalWeeks;
    const plan = M.activePlan();

    if(plan){
      const out = [];
      plan.weeks.forEach(w => {
        const last = out[out.length-1];
        if(last && last.phase.key === w.phase){ last.to = w.n; return; }
        out.push({ phase:{ key:w.phase, label:w.phaseLabel, theme:w.theme }, from:w.n, to:w.n });
      });
      return out;
    }

    const full = R.PROGRAM.totalWeeks;
    if(total >= full) return R.PHASES.map(p => ({ phase:p, from:p.weeks[0], to:p.weeks[1] }));
    const scale = total / full;
    let prev = 0;
    return R.PHASES.map(p => {
      const to = Math.min(total, Math.max(prev+1, Math.round(p.weeks[1]*scale)));
      const range = { phase:p, from:prev+1, to };
      prev = to;
      return range;
    }).filter(r => r.from <= r.to && r.from <= total);
  }

  function PhaseBlock(range){
    const { phase, from, to } = range;
    const weeks = [];
    let totalQ = 0;
    for(let n = from; n <= to; n++){ weeks.push(n); totalQ += M.curriculumFor(n).q; }
    return html`
      <div class="tlmonth">
        <div class="tlmonth__head"><h3>${phase.label}</h3>
          <span class="small muted">${phase.theme}</span>
          <span class="tiny dim ml-auto">H${from}${to > from ? '–H'+to : ''} · ${U.fmtNum(totalQ)} soru</span></div>
        ${map(weeks, WeekRow)}
      </div>`;
  }

  function planCard(){
    const plan = M.activePlan();
    if(!plan) return K.Card({ title:'Program', sub:'Sabit müfredat kullanılıyor',
      body:K.Notice({ tone:'info', body:'Kişisel plan henüz üretilmedi. Rehber → Ayarlar’dan '
        + 'takvimini ve kapasiteni gir; program sana göre yeniden dizilir.' }) });

    const m = plan.meta;
    const lv = R.Planner.level(m.level);
    const dropped = m.dropped || [];
    const byFreq = {};
    dropped.forEach(d => { byFreq[d.freq] = (byFreq[d.freq] || 0) + 1; });

    return K.Card({
      title:'Bu plan sana göre üretildi', hint:'intensity',
      sub:m.total+' hafta · haftada '+m.perWeek+' ana konu · '+lv.name.toLowerCase(),
      actions:K.Button({ label:'Yeniden hesapla', icon:'refresh', size:'sm', act:'auto-replan' }),
      body:html`
        ${K.Cols(4, [
          K.Stat({ label:'Kapsama', value:'%'+m.coverage, tone:m.coverage >= 80 ? 'ok' : 'warn',
            note:m.placed+' / '+m.poolSize+' konu' }),
          K.Stat({ label:'Kapasite', value:m.capacityHoursPerWeek, unit:' sa', note:'haftalık' }),
          K.Stat({ label:'Karar kapısı', value:(m.gates || []).length, note:'H'+(m.gates || []).join(' · H') }),
          K.Stat({ label:'Konu işlenen', value:m.productive, unit:' hafta', note:'prova hariç' }),
        ])}

        ${when(dropped.length, () => K.Notice({ tone:'warn',
          title:dropped.length+' konu plana yazılmadı.',
          body:html`Takvimin ve haftalık ${m.capacityHoursPerWeek} saatlik kapasiten
            ${m.placed} konuya yetiyor. Düşenler ${byFreq.low || 0} düşük, ${byFreq.mid || 0} orta frekanslı;
            ${byFreq.high
              ? html`<b>${byFreq.high} yüksek frekanslı konu da düşmek zorunda kaldı</b> —
                     takvim gerçekten dar, hedefi gözden geçir.`
              : html`<b>yüksek frekanslı hiçbir konu düşmedi</b>.`} Bu konular silinmedi — Dersler ekranında
            öncelik sırasına göre duruyor, boşluk buldukça çalışırsın.
            Tam kapsama için haftalık kapasite ~${m.capacityForFull} saat olmalıydı.` }))}

        ${when(!dropped.length, () => K.Notice({ tone:'ok',
          body:'Takvimin tüm konulara yetiyor; plan müfredatın tamamını kapsıyor.' }))}

        <p class="tiny dim mt-10">Plan sabit değildir: takvimi, kapasiteyi ya da seviyeni değiştirirsen
          yeniden üretilir. Geride kalırsan “Yeniden hesapla” kapanmamış konuları öne alır.</p>`,
    });
  }

  function droppedCard(){
    const plan = M.activePlan();
    const dropped = plan && plan.meta.dropped ? plan.meta.dropped : [];
    if(!dropped.length) return null;
    const bySubject = {};
    dropped.forEach(d => { (bySubject[d.subjectName] = bySubject[d.subjectName] || []).push(d); });
    return K.Collapsible({
      title:'Plana girmeyen konular', meta:dropped.length+' konu',
      act:'toggle-dropped', open:!!S.ui.droppedOpen,
      body:html`<div class="stack-xs mt-10">${map(Object.keys(bySubject), name => html`
        <div><span class="mono-label">${name}</span>
          ${K.Row(map(bySubject[name], d => K.Chip({
            label:d.name, act:'open-dropped',
            data:{ 'data-subject':d.subjectId, 'data-topic':d.topicId },
          })), { wrap:true })}
        </div>`)}</div>`,
    });
  }

  async function render(){
    const cur = M.currentWeek();
    let totalQ = 0, doneQ = 0;
    for(let i = 1; i <= R.PLAN.totalWeeks; i++){
      const q = M.curriculumFor(i).q;
      totalQ += q;
      if(i < cur) doneQ += q;
    }
    const plan = M.activePlan();
    const scale = R.PLAN.totalWeeks / R.PROGRAM.totalWeeks;
    const gateWeeks = (plan && plan.meta.gates && plan.meta.gates.length)
      ? plan.meta.gates
      : [11, 16, 20, 29, 33].map(w => Math.max(1, Math.round(w*scale)))
          .filter((w, i, a) => a.indexOf(w) === i);
    const grid = C.intensityGrid();

    return String(K.Grid([
      K.Span(12, K.Cols(4, [
        K.Stat({ label:'Program ilerlemesi', value:'%'+M.programProgress(), note:'Hafta '+cur+' / '+R.PLAN.totalWeeks }),
        K.Stat({ label:'Planlanan toplam soru', value:U.fmtNum(totalQ), note:'yeni ve bağımsız sorular' }),
        K.Stat({ label:'Bugüne kadar planlanan', value:U.fmtNum(doneQ), note:'ilk '+Math.max(0, cur-1)+' hafta' }),
        K.Stat({ label:'Sınava kalan', value:U.fmtNum(U.diffDays(U.todayISO(), R.PLAN.examTytISO)),
          unit:' gün', note:'TYT tahmini' }),
      ])),

      K.Span(12, planCard()),
      K.Span(12, droppedCard()),

      K.Span(12, K.Card({
        title:'Çalışma yoğunluğu', hint:'intensity', sub:R.PLAN.totalWeeks+' hafta × 7 gün',
        body:html`
          ${raw(UI.heatmap(grid.cells, { cols:R.PLAN.totalWeeks, monthTicks:grid.ticks }))}
          ${raw(UI.legend([
            { label:'çalışıldı — koyuluk yükü gösterir', color:'var(--primary)' },
            { label:'kayıt yok', color:'color-mix(in srgb, var(--danger) 30%, transparent)' },
            { label:'gelecek', color:'var(--surface-2)' },
          ]))}`,
      })),

      K.Span(12, K.Card({
        title:'Program zaman çizgisi',
        sub:U.fmtDate(R.PLAN.startISO)+' – '+U.fmtDate(U.iso(M.weekEnd(R.PLAN.totalWeeks)))+' · '+R.PLAN.totalWeeks+' hafta',
        actions:html`<span class="small dim">Karar kapıları: H${gateWeeks.join(' · H')}</span>`,
        body:html`<div class="timeline">${map(phaseRanges(), PhaseBlock)}</div>`,
      })),
    ]));
  }

  const handle = {
    async 'toggle-dropped'(){ S.ui.droppedOpen = !S.ui.droppedOpen; R.App.render(); },
    async 'open-dropped'(el){
      S.ui.subjectOpen = el.dataset.subject;
      R.App.go('subjects');
      setTimeout(() => R.Screens.subjects.handle['open-topic']({
        dataset:{ subject:el.dataset.subject, topic:el.dataset.topic } }), 100);
    },
    async 'open-week'(el){
      S.ui.weekView = Number(el.dataset.n);
      await M.ensureWeek(S.ui.weekView);
      R.App.go('week');
    },
  };

  return {
    id:'plan',
    title:'Program',
    subtitle(){
      return 'Hafta '+M.currentWeek()+' / '+R.PLAN.totalWeeks+' · '
        + U.fmtDate(R.PLAN.startISO)+' – '+U.fmtDate(U.iso(M.weekEnd(R.PLAN.totalWeeks)));
    },
    actions(){
      return String(K.Button({ label:'Bu haftayı aç', size:'sm', act:'go', data:{ 'data-route':'week' } }));
    },
    render, handle,
  };
})();
