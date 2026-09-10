/* Konu özeti — bir konunun her şeyi tek ekranda.

   Şu an notlar Öğrenme'de, kartlar Tekrar'da, hatalar Yanlış defterinde,
   ölçümler Dersler'de duruyor. Bir konuya çalışırken dördünü birden görmek
   gerekiyor; bu ekran o dördünü birleştirir.

   Yazim bicimi: STIL.md. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.topic = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  function ctx(){
    const sid = S.ui.topicSubject;
    const tid = S.ui.topicOpen;
    const subject = R.SUBJECTS.find(s => s.id === sid);
    const topic = subject ? subject.topics.find(t => t.id === tid) : null;
    return { subject, topic };
  }

  function cardsOf(subject, topic){
    return S.cards.filter(c => c.subjectId === subject.id
      && (!c.topic || c.topic === topic.name || c.topic.indexOf(topic.name) >= 0));
  }
  function errorsOf(subject, topic){
    return S.errors.filter(e => e.subjectId === subject.id && e.topicId === topic.id);
  }
  function notesOf(subject, topic){
    return S.videoNotes.filter(n => n.subjectId === subject.id
      && (!n.topicId || n.topicId === topic.id));
  }
  function planWeeks(subject, topic){
    const plan = M.activePlan();
    if(!plan) return [];
    return plan.weeks.filter(w => (w.items || []).some(i =>
      i.subjectId === subject.id && i.topicId === topic.id)).map(w => w.n);
  }

  function headerCard(subject, topic, st, risk){
    const freq = R.TOPIC_FREQ[topic.freq] || R.TOPIC_FREQ.mid;
    const weeks = planWeeks(subject, topic);
    return K.Card({
      title:topic.name,
      sub:subject.name + (topic.group ? ' · ' + topic.group : ''),
      badge:when(risk, () => K.Badge({ label:'risk ' + risk.score, tone:risk.tone })),
      actions:K.Button({ label:'Durumu düzenle', size:'sm', tone:'primary', act:'topic-edit' }),
      body:html`
        ${K.Row([
          K.Chip(R.TOPIC_STATES[st.state].label),
          K.Chip(freq.label + ' frekans'),
          K.Chip('tahmini ' + topic.days),
          when(weeks.length, () => K.Chip('plan: H' + weeks.join(', H'))),
        ], { wrap:true })}
        <p class="small muted mt-10">${freq.note}</p>`,
    });
  }

  function measureCard(subject, topic, st){
    const rule = R.CLOSURE_RULE;
    const first = st.first, second = st.second;
    const dueISO = st.firstAt && second == null
      ? U.iso(U.addDays(U.parse(st.firstAt), rule.gapDays)) : null;
    const overdue = dueISO && dueISO < U.todayISO();

    return K.Card({
      title:'Kapanış ölçümü', hint:'second-check',
      sub:'İlk test ≥%' + rule.first + ' ve ' + rule.gapDays + ' gün sonra ≥%' + rule.second,
      body:html`
        ${K.Cols(2, [
          K.Stat({ label:'1. ölçüm', value:first == null ? '—' : '%' + first,
            note:st.firstAt ? U.fmtShort(st.firstAt) : 'girilmedi',
            tone:first == null ? null : first >= rule.first ? 'ok' : 'warn' }),
          K.Stat({ label:'2. ölçüm', value:second == null ? '—' : '%' + second,
            note:second != null ? U.fmtShort(st.secondAt)
              : dueISO ? (overdue ? 'gecikti' : U.relativeDay(dueISO)) : 'ilk ölçümden sonra',
            tone:second == null ? (overdue ? 'warn' : null) : second >= rule.second ? 'ok' : 'warn' }),
        ])}
        ${when(overdue, () => html`<div class="mt-12">${K.Notice({ tone:'warn',
          body:'2. ölçüm gecikti. Tek ölçüm kapanış saymaz; konu kapalı görünüyor ama kapalı değil.' })}</div>`)}
        ${when(st.note, () => html`<p class="small muted mt-10"><span class="dim">Not:</span> ${st.note}</p>`)}`,
    });
  }

  function practiceCard(subject, topic){
    const p = C.topicPractice(subject.id, topic.id);
    const v = R.Analytics.topicValue().find(x => x.subjectId === subject.id && x.topicId === topic.id);
    return K.Card({
      title:'Pratik', sub:'Bu konuya bağlı bloklardan gelen gerçek veri',
      body:html`
        ${K.Cols(3, [
          K.Stat({ label:'Çözülen', value:U.fmtNum(p.solved), note:p.sessions + ' blok' }),
          K.Stat({ label:'Doğruluk', value:p.accuracy == null ? '—' : '%' + p.accuracy,
            tone:p.accuracy == null ? null : p.accuracy >= 70 ? 'ok' : 'warn' }),
          K.Stat({ label:'Net açığı', value:v ? U.fmtNet(v.gap) : '—',
            note:v ? 'potansiyel ' + U.fmtNet(v.potential) : '' }),
        ])}
        ${when(p.solved === 0, () => html`<p class="tiny dim mt-10">
          Henüz bu konuya bağlı blok yok. Bugün ekranında bloğu bu konuya bağlarsan
          doğruluk buradan okunur.</p>`)}`,
    });
  }

  function notesCard(subject, topic){
    const notes = notesOf(subject, topic);
    const segs = [];
    notes.forEach(n => n.segments.forEach(s => segs.push({ note:n, seg:s })));
    if(!segs.length){
      return K.Card({ title:'Ders notları',
        body:K.Empty({ icon:'play', text:'Bu konuya bağlı ders notu yok.',
          action:K.Button({ label:'Ders ekle', size:'sm', act:'go', data:{ 'data-route':'learn' } }) }) });
    }
    return K.Card({
      title:'Ders notları', sub:U.plural(segs.length, 'not', 'not') + ' · ' + notes.length + ' ders',
      body:html`<div class="stack-xs">${map(segs.slice(0, 10), x => html`
        <div class="row-top gap-8">
          <a class="seg-row__ts num" href="${M.tsUrl(x.note, x.seg.ts)}" target="_blank" rel="noopener">${M.fmtTs(x.seg.ts)}</a>
          <span class="small">${x.seg.text}</span>
        </div>`)}</div>`,
    });
  }

  function cardsCard(subject, topic){
    const cards = cardsOf(subject, topic);
    const due = cards.filter(c => c.dueAt <= U.todayISO()).length;
    if(!cards.length){
      return K.Card({ title:'Tekrar kartları',
        body:K.Empty({ icon:'cards', text:'Bu konuda kart yok. Not ya da yanlış kaydından üretilir.' }) });
    }
    return K.Card({
      title:'Tekrar kartları', sub:cards.length + ' kart · ' + due + ' bugün due',
      actions:when(due, () => K.Button({ label:'Sına', icon:'zap', size:'sm', act:'topic-quiz' })),
      body:html`<div class="stack-xs">${map(cards.slice(0, 8), c => html`
        <div class="row between">
          <span class="small truncate">${c.front}</span>
          <span class="${c.dueAt <= U.todayISO() ? 'tiny num is-late' : 'tiny num dim'}">${U.fmtShort(c.dueAt)}</span>
        </div>`)}</div>`,
    });
  }

  function errorsCard(subject, topic){
    const errs = errorsOf(subject, topic);
    if(!errs.length){
      return K.Card({ title:'Bu konudan gelen yanlışlar',
        body:K.Empty({ icon:'list', text:'Bu konudan kayıtlı yanlış yok.' }) });
    }
    const dist = {};
    errs.forEach(e => { dist[e.tag] = (dist[e.tag] || 0) + 1; });
    const top = Object.keys(dist).sort((a, b) => dist[b] - dist[a])[0];
    return K.Card({
      title:'Bu konudan gelen yanlışlar', sub:errs.length + ' kayıt',
      badge:when(top, () => K.Badge({ label:top + ' baskın', tone:'warn' })),
      body:html`
        <div class="stack-xs">${map(errs.slice(0, 6), e => html`
          <div class="row-top gap-8">
            ${raw(UI.tagDot(e.tag))}
            <div class="minw0">
              <div class="small">${e.rootCause || 'kök neden yazılmadı'}</div>
              ${when(e.principle, () => html`<div class="tiny dim">İlke: ${e.principle}</div>`)}
            </div>
          </div>`)}</div>
        ${when(top, () => html`<div class="mt-12">${K.Notice({ tone:'info',
          body:'Baskın hata ' + top + ' — ' + R.ERROR_TAGS[top].name + '. Reçete: ' + R.ERROR_TAGS[top].recipe })}</div>`)}`,
    });
  }

  function riskCard(risk){
    if(!risk) return null;
    const parts = [
      ['Frekans', risk.parts.freq],
      ['Kapanış', risk.parts.closure],
      ['Açık yanlış', risk.parts.errors],
      ['Gecikmiş kart', risk.parts.cards],
      ['Tazelik', risk.parts.stale],
      ['Pratik', risk.parts.practice || 0],
    ];
    return K.Card({
      title:'Risk neden bu kadar?', hint:'risk', sub:'Skoru oluşturan beş girdi',
      body:html`<div class="stack-xs">${map(parts, p => html`
        <div class="stack-xs">
          <div class="row between"><span class="small">${p[0]}</span>
            <span class="tiny dim num">${Math.round(p[1] * 100)}%</span></div>
          ${K.Bar({ value:p[1] * 100, tone:p[1] > 0.66 ? 'danger' : p[1] > 0.33 ? 'warn' : '' })}
        </div>`)}</div>`,
    });
  }

  async function render(){
    const { subject, topic } = ctx();
    if(!subject || !topic){
      return String(K.Card({ body:K.Empty({ icon:'book', text:'Konu seçilmedi.',
        action:K.Button({ label:'Derslere git', tone:'primary', act:'go', data:{ 'data-route':'subjects' } }) }) }));
    }
    const st = M.topicState(subject.id, topic.id);
    const risk = C.topicRisk(subject.id, topic.id);

    return String(K.Grid([
      K.Span(12, K.Row([
        K.Button({ label:'Dersler', icon:'left', size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'subjects' } }),
        K.Row([
          K.Button({ label:'Ders ekle', icon:'plus', size:'sm', act:'topic-add-note' }),
          K.Button({ label:'Kart ekle', icon:'cards', size:'sm', act:'topic-add-card' }),
        ], { wrap:true }),
      ], { between:true, wrap:true })),

      K.Span(7, K.Stack([
        headerCard(subject, topic, st, risk),
        measureCard(subject, topic, st),
        practiceCard(subject, topic),
        notesCard(subject, topic),
      ])),

      K.Span(5, K.Stack([
        riskCard(risk),
        cardsCard(subject, topic),
        errorsCard(subject, topic),
        raw(UI.rail(['closure', 'second-check', 'risk', 'recall'])),
      ])),
    ]));
  }

  const handle = {
    async 'topic-edit'(){
      const { subject, topic } = ctx();
      if(subject && topic) R.Screens.subjects.handle['open-topic']({ dataset:{ subject:subject.id, topic:topic.id } });
    },
    async 'topic-quiz'(){
      const { subject, topic } = ctx();
      if(!subject || !topic) return;
      S.ui.quizMode = 'topic';
      S.ui.quizSubject = subject.id;
      S.ui.quizTopic = topic.id;
      R.App.go('quiz');
    },
    async 'topic-add-note'(){
      const { subject, topic } = ctx();
      S.ui.noteOpen = null;
      R.App.go('learn');
      setTimeout(() => R.Screens.learn.handle['note-new']({ dataset:{
        subject:subject ? subject.id : '', topic:topic ? topic.id : '' } }), 80);
    },
    async 'topic-add-card'(){
      R.App.go('cards');
      setTimeout(() => R.Screens.cards.handle['new-card']({ dataset:{} }), 80);
    },
  };

  return {
    id:'topic',
    title:'Konu',
    subtitle(){
      const { subject, topic } = ctx();
      return topic ? subject.name + ' · ' + topic.name : 'Konu özeti';
    },
    actions(){ return ''; },
    render, handle,
  };
})();
