/* Dersler — konu yol haritalari, durum takibi ve kapanis olcumleri.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.subjects = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const STATE_BADGE = {
    not_started:['Başlanmadı', 'muted'], learning:['Öğreniliyor', 'info'],
    practicing:['Pratik', 'warn'], provisional:['Geçici kapalı', 'info'],
    closed:['Kapalı', 'ok'], reopened:['Yeniden açıldı', 'danger'],
  };

  const FILTERS = [
    { value:'all', label:'Tümü' }, { value:'high', label:'Yüksek frekans' },
    { value:'active', label:'Çalışılan' }, { value:'open', label:'Kapanmayan' },
  ];

  function openId(){ return S.ui.subjectOpen || R.SUBJECTS[0].id; }

  function StateBadge(state){
    const m = STATE_BADGE[state] || STATE_BADGE.not_started;
    return html`<span class="badge badge--${m[1]}"><span class="statedot state-${state}"></span>${m[0]}</span>`;
  }

  /* Iki olcum kurali: ilk test >= %75, 7 gun sonraki test >= %70. */
  function checkInfo(st){
    if(st.first == null) return null;
    if(st.second != null) return html`<span class="tiny dim">%${st.first} → %${st.second}</span>`;

    const dueISO = st.firstAt ? U.iso(U.addDays(U.parse(st.firstAt), R.CLOSURE_RULE.gapDays)) : null;
    const overdue = !!(dueISO && dueISO < U.todayISO());
    const soon = overdue || dueISO === U.todayISO();
    const label = !dueISO ? '—'
      : overdue ? U.diffDays(dueISO, U.todayISO())+' gün gecikti'
      : dueISO === U.todayISO() ? 'bugün' : U.relativeDay(dueISO);
    return html`<span class="${soon ? 'tiny is-due' : 'tiny dim'}">İlk test %${st.first} · 2. ölçüm ${label}</span>`;
  }

  function TopicRow(subject, topic){
    const st = M.topicState(subject.id, topic.id);
    const mod = st.state === 'closed' ? ' is-closed'
      : (st.state === 'learning' || st.state === 'practicing') ? ' is-active' : '';
    const freq = R.TOPIC_FREQ[topic.freq] || R.TOPIC_FREQ.mid;
    const info = checkInfo(st);

    return html`
      <div class="topicrow${mod}" data-act="topic-open" data-subject="${subject.id}" data-topic="${topic.id}">
        <span class="topicrow__order">${topic.order}</span>
        <div class="minw0">
          <div class="topicrow__name">${topic.name}</div>
          <div class="topicrow__meta">${topic.days} ·
            <span class="freq freq--${topic.freq}" title="${freq.note}">${freq.label} frekans</span></div>
          ${when(info, () => html`<div class="mt-2">${info}</div>`)}
        </div>
        ${StateBadge(st.state)}
      </div>`;
  }

  /* Konular brans grubuna gore bolunur — uzun liste okunabilir kalir. */
  function groupTopics(topics){
    const groups = [];
    topics.forEach(t => {
      const key = t.group || '—';
      let g = groups.find(x => x.key === key);
      if(!g){ g = { key, items:[] }; groups.push(g); }
      g.items.push(t);
    });
    return groups;
  }

  function filterTopics(subject){
    const filter = S.ui.topicFilter || 'all';
    const query = U.norm(S.ui.topicQuery || '');
    let topics = subject.topics;

    if(filter === 'high') topics = topics.filter(t => t.freq === 'high');
    else if(filter === 'open') topics = topics.filter(t => M.topicState(subject.id, t.id).state !== 'closed');
    else if(filter === 'active') topics = topics.filter(t => {
      const st = M.topicState(subject.id, t.id).state;
      return st === 'learning' || st === 'practicing' || st === 'provisional';
    });
    if(query) topics = topics.filter(t => U.norm(t.name+' '+(t.group || '')).indexOf(query) >= 0);
    return topics;
  }

  function subjectPanel(subject){
    const closure = C.subjectClosure(subject.id);
    const topics = filterTopics(subject);
    const highCount = subject.topics.filter(t => t.freq === 'high').length;

    return K.Stack([
      K.Card({
        title:subject.name, sub:subject.questions+' soru · '+subject.weight,
        actions:html`<div class="row-sm">${raw(UI.donut(closure.pct, closure.closed+'/'+closure.total, 72))}</div>`,
        body:html`
          ${K.Row([
            K.Chip('Hedef '+subject.targetBand),
            K.Chip(subject.topics.length+' konu'),
            K.Chip(highCount+' yüksek frekans'),
            when(subject.priority === 'support', () => K.Badge({ label:'destek testi', tone:'warn' })),
          ], { wrap:true })}
          <p class="small muted mt-10">${subject.insight}</p>`,
      }),

      K.Card({
        title:'Konular', hint:'source-arch', sub:'Önkoşul ve getiri sırasına göre',
        actions:K.Segmented({ items:FILTERS, value:S.ui.topicFilter || 'all', act:'topic-filter', aria:'Konu süzgeci' }),
        body:html`
          ${K.Input({ class:'mb-10', placeholder:'Konu ara…', value:S.ui.topicQuery || '',
            aria:'konu ara', change:'topic-search', data:{ 'data-debounce':220 } })}
          ${topics.length
            ? html`<div class="list">${map(groupTopics(topics), g => {
                const closed = g.items.filter(t => M.topicState(subject.id, t.id).state === 'closed').length;
                return html`<div class="topicgroup">
                  <div class="topicgroup__head"><span>${g.key}</span>
                    <span class="tiny dim num">${closed}/${g.items.length}</span></div>
                  ${map(g.items, t => TopicRow(subject, t))}
                </div>`;
              })}</div>`
            : K.Empty({ icon:'search', text:'Bu filtreye uyan konu yok.',
                action:K.Button({ label:'Süzgeci sıfırla', size:'sm', act:'topic-reset' }) })}`,
      }),

      K.Card({
        title:'Kaynak mimarisi', sub:'Temel → orta → branş',
        body:html`<div class="ladder">${map(subject.sources, s => html`
          <div class="ladder__row"><span class="ladder__level">${s.level}</span>
            <span class="muted">${s.detail}</span></div>`)}</div>`,
      }),
    ]);
  }

  /* ---------- konu formu ---------- */

  function topicSheet(subjectId, topicId){
    const subject = R.SUBJECTS.find(s => s.id === subjectId);
    const topic = subject.topics.find(t => t.id === topicId);
    const st = M.topicState(subjectId, topicId);
    const stateOptions = Object.keys(R.TOPIC_STATES).map(k => ({ value:k, label:R.TOPIC_STATES[k].label }));
    const freq = (R.TOPIC_FREQ[topic.freq] || {}).label || '';
    const pctInput = (id, value) => K.Input({ id, type:'number', numeric:true, min:0, max:100, value:value == null ? '' : value });

    const body = K.Stack([
      K.Card({ flat:true, pad:'sm', body:html`
        <div class="row between"><b>${topic.name}</b>${StateBadge(st.state)}</div>
        <p class="small muted mt-4">Tahmini süre: ${topic.days} · ${freq} frekans${topic.group ? ' · '+topic.group : ''}</p>` }),
      K.Notice({ tone:'info', body:html`Kapanış kuralı: konu testi ≥%${R.CLOSURE_RULE.first} <b>ve</b>
        ${R.CLOSURE_RULE.gapDays} gün sonraki test ≥%${R.CLOSURE_RULE.second}. Tek ölçüm kapanış saymaz.` }),
      K.Cols(2, [
        K.Field({ label:'1. ölçüm — konu testi %', input:pctInput('tp-first', st.first) }),
        K.Field({ label:'1. ölçüm tarihi', input:K.Input({ id:'tp-first-at', type:'date', value:st.firstAt || U.todayISO() }) }),
      ]),
      K.Cols(2, [
        K.Field({ label:'2. ölçüm — 7 gün sonra %', input:pctInput('tp-second', st.second) }),
        K.Field({ label:'2. ölçüm tarihi', input:K.Input({ id:'tp-second-at', type:'date', value:st.secondAt || '' }) }),
      ]),
      K.Field({ label:'Durum (elle geçersiz kıl)', input:K.Select({ id:'tp-state', options:stateOptions, value:st.state }) }),
      K.Field({ label:'Not', input:K.Textarea({ id:'tp-note', rows:2, value:st.note,
        placeholder:'Kaynak, zorlanılan alt başlık, kart ihtiyacı…' }) }),
    ]);

    UI.sheet({
      title:subject.name,
      subtitle:'Konu '+topic.order+' · durum ve ölçüm',
      body:String(body),
      footer:String(html`${K.Button({ label:'Kapat', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-topic',
          data:{ 'data-subject':subjectId, 'data-topic':topicId } })}`),
    });
  }

  /* ---------- ekran ---------- */

  function subjectNav(sid){
    return html`<div class="list">${map(R.SUBJECTS, s => {
      const c = C.subjectClosure(s.id);
      return html`
        <button class="${s.id === sid ? 'listitem listitem--tap is-on' : 'listitem listitem--tap'}"
                data-act="open-subject" data-id="${s.id}">
          <div class="grow"><div class="small strong">${s.name}</div>
            <div class="tiny dim">${c.closed}/${c.total} konu kapandı</div></div>
          <div class="w-46">${K.Bar({ value:c.pct, tone:'' })}</div>
        </button>`;
    })}</div>`;
  }

  function riskCard(){
    const list = C.riskRanking(8);
    if(!list.length) return null;
    const reason = r => {
      const parts = [];
      if(r.state === 'not_started') parts.push('başlanmadı');
      else if(r.state !== 'closed') parts.push(R.TOPIC_STATES[r.state].label.toLowerCase());
      if(r.freq === 'high') parts.push('yüksek frekans');
      if(r.errors) parts.push(r.errors+' açık yanlış');
      if(r.staleDays != null && r.staleDays >= R.SCORING.staleDays) parts.push(r.staleDays+' gündür dokunulmadı');
      return parts.slice(0, 3).join(' · ');
    };
    return K.Card({
      title:'Öncelik sırası', hint:'closure',
      sub:'Frekans, kapanış, açık yanlış, gecikmiş kart ve tazelikten hesaplanır',
      actions:K.Button({ label:'Analiste sor', icon:'zap', size:'sm',
        act:'ask-agent', data:{ 'data-agent':'analist' } }),
      body:html`
        ${map(list, r => html`
          <div class="riskrow" data-act="open-topic" data-subject="${r.subjectId}" data-topic="${r.topicId}">
            <span class="riskrow__score is-${r.band}">${r.score}</span>
            <div class="riskrow__text">
              <div class="small strong">${r.topicName}</div>
              <div class="tiny dim truncate">${r.subjectName} · ${reason(r)}</div>
            </div>
            ${K.Badge({ label:r.label, tone:r.tone })}
          </div>`)}
        <p class="tiny dim mt-10">Sıra bir emir değil, bir öneridir: haftanın sözleşmesi imzalıysa
          önce onu bitir, riski gelecek haftaya taşı.</p>`,
    });
  }

  function pendingCard(pending){
    if(!pending.length) return null;
    return K.Span(12, K.Card({ class:'card--accent', title:'Bekleyen 2. ölçümler', sub:'Kapanış için gerekli',
      body:K.Row(map(pending.slice(0, 8), p => K.Chip({
        label:p.topicName+' · '+(p.overdue ? 'gecikti' : U.relativeDay(p.dueISO)),
        act:'open-topic', on:p.overdue,
        data:{ 'data-subject':p.subjectId, 'data-topic':p.topicId },
      })), { wrap:true }) }));
  }

  async function render(){
    const sid = openId();
    const subject = R.SUBJECTS.find(s => s.id === sid);
    const overall = C.overallClosure();
    const tyt = C.examClosure('TYT');
    const ayt = C.examClosure('AYT');

    return String(K.Grid([
      K.Span(12, K.Cols(3, [
        K.Stat({ label:'Toplam konu kapanışı', value:'%'+overall.pct, hint:'closure',
          note:overall.closed+' / '+overall.total+' konu', progress:overall.pct }),
        K.Stat({ label:'TYT kapanış', value:'%'+tyt.pct, note:tyt.closed+' / '+tyt.total, progress:tyt.pct }),
        K.Stat({ label:'AYT kapanış', value:'%'+ayt.pct, note:ayt.closed+' / '+ayt.total,
          progress:ayt.pct, tone:ayt.pct < 55 ? 'warn' : null }),
      ])),
      pendingCard(C.pendingSecondChecks()),
      K.Span(3, K.Stack([
        K.Card({ pad:'sm', title:'Dersler', sub:R.SUBJECTS.length+' ders', body:subjectNav(sid) }),
        riskCard(),
      ])),
      K.Span(7, subjectPanel(subject)),
      K.Span(12, raw(UI.rail(['closure', 'second-check', 'source-arch']))),
    ]));
  }

  const handle = {
    async 'topic-filter'(el){ S.ui.topicFilter = el.dataset.value; R.App.render(); },
    async 'topic-reset'(){ S.ui.topicFilter = 'all'; S.ui.topicQuery = ''; R.App.render(); },
    async 'open-subject'(el){ S.ui.subjectOpen = el.dataset.id; R.App.render(); },
    async 'open-topic'(el){ topicSheet(el.dataset.subject, el.dataset.topic); },
    async 'topic-open'(el){
      S.ui.topicSubject = el.dataset.subject;
      S.ui.topicOpen = el.dataset.topic;
      R.App.go('topic');
    },
    async 'save-topic'(el){
      const subjectId = el.dataset.subject, topicId = el.dataset.topic;
      const firstVal = document.getElementById('tp-first').value;
      const secondVal = document.getElementById('tp-second').value;
      const patch = {
        first: firstVal === '' ? null : Number(firstVal),
        firstAt: firstVal === '' ? null : (document.getElementById('tp-first-at').value || U.todayISO()),
        second: secondVal === '' ? null : Number(secondVal),
        secondAt: secondVal === '' ? null : (document.getElementById('tp-second-at').value || U.todayISO()),
        note: document.getElementById('tp-note').value,
      };
      const chosen = document.getElementById('tp-state').value;
      const auto = (patch.first != null && patch.second != null)
        ? ((patch.first >= R.CLOSURE_RULE.first && patch.second >= R.CLOSURE_RULE.second) ? 'closed' : 'practicing')
        : (patch.first != null ? (patch.first >= R.CLOSURE_RULE.first ? 'provisional' : 'practicing') : 'not_started');
      if(chosen !== auto) patch.state = chosen;

      const next = await M.setTopicState(subjectId, topicId, patch);
      UI.closeSheet();
      UI.toast(next.state === 'closed' ? 'Konu kapandı' : 'Durum kaydedildi');
      R.App.render();
    },
  };

  const change = {
    async 'topic-search'(el){ S.ui.topicQuery = el.value; R.App.render(); },
  };

  return {
    id:'subjects',
    title:'Dersler',
    subtitle(){
      const o = C.overallClosure();
      const total = R.SUBJECTS.reduce((a, s) => a + s.topics.length, 0);
      return o.closed+' / '+o.total+' konu kapandı · '+R.SUBJECTS.length+' derste '+total+' konu';
    },
    actions(){ return ''; },
    render, handle, change,
  };
})();
