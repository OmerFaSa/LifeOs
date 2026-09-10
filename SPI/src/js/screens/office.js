/* Ofis — beş masa.

   Her masada bir ajan oturur ve YALNIZCA kendi brifingini görür. Masayı
   açtığında ajanın kural motorundan gelen raporu ve kendi cümlesi görünür.

   Rozet önemlidir: cümle modelden mi geldi yoksa kural motorundan mı?
   Model kapalıyken ofis kapanmaz, yalnızca rozet değişir. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.office = (function(){
  const U = SP.U, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  /* Masa satirlari: her ajanin kendi kural motoru cumlesi. */
  function deskCard(agent){
    const open = S.ui.officeDesk === agent.id;
    const b = SP.Office.brief(agent.id);
    const line = SP.Office.ruleText(agent.id, b);
    const notes = SP.Office.notes().filter(n => n.agent === agent.id);

    return K.Card({
      class:'desk',
      body:html`
        <div class="desk__head">
          ${P.avatar(agent.id)}
          <div class="grow minw0">
            <b class="desk__name">${agent.name}</b>
            <span class="desk__role">${agent.role}</span>
          </div>
          ${when(notes.length, () => K.Badge({ label:String(notes.length),
            tone:notes.some(n => n.tone === 'danger') ? 'danger' : 'warn' }))}
          ${SP.Office.ready(agent.id) ? K.Badge({ label:'model açık', tone:'info' })
            : K.Badge({ label:'kural motoru', tone:'muted', icon:false })}
        </div>
        <p class="desk__line">${line}</p>
        ${when(notes.length, () => html`<div class="notes mt-10">${map(notes, n => html`
          <div class="note note--${n.tone}"><span class="note__dot"></span>
            <span class="small">${n.text}</span></div>`)}</div>`)}
        ${when(open, () => html`<div class="desk__open">
          ${deskDetail(agent, b)}
        </div>`)}
        <div class="row wrap mt-12">
          ${K.Button({ label:open ? 'Raporu kapat' : 'Raporu aç', size:'sm',
            act:'toggle-desk', data:{ 'data-id':agent.id } })}
          ${K.Button({ label:'Soru sor', size:'sm', tone:'primary',
            act:'ask-agent', data:{ 'data-agent':agent.id } })}
        </div>`,
    });
  }

  /* Ajanin brifinginin okunabilir hali — sayilar aynen, yorum yok. */
  function deskDetail(agent, b){
    if(agent.id === 'lab'){
      return html`
        ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          ['Girilmiş ölçüm', b.summary.measured + ' / ' + b.summary.total],
          ['Referans dışı', String(b.summary.out)],
          ['Hedef bandın dışı', String(b.summary.offTarget)],
          ['Açık kırmızı bayrak', String(b.flags.length)],
          ['Son tahlil', b.lastLab ? U.fmtDate(b.lastLab) : 'yok'],
        ] })}
        ${when(b.attention.length, () => html`<div class="mt-10">
          ${K.Table({ tight:true, headers:['Ölçüm', { label:'Değer', num:true }, 'Durum'],
            rows:b.attention.map(a => [a.marker, U.fmtNum(a.value) + ' ' + a.unit,
              K.Badge({ label:a.statusLabel, tone:a.status === 'red' ? 'danger'
                : a.status === 'low' || a.status === 'high' ? 'warn' : 'info' })]) })}</div>`)}`;
    }
    if(agent.id === 'nutri'){
      if(!b.targetsOk) return K.Notice({ tone:'warn', body:'Profilde ' + b.missingProfile.join(', ') + ' eksik.' });
      return html`
        ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          ['Günlük kalori hedefi', U.fmtNum(b.kcal) + ' kcal'],
          ['Protein bandı', b.protein.min + '–' + b.protein.max + ' g'],
          ['Lif hedefi', b.fiber + ' g'],
          ['Kayıtlı gün (7 gün)', String(b.loggedDays)],
          ['Bugün', b.todayMeals + ' öğün · ' + U.fmtNum(b.todayKcal) + ' kcal'],
        ] })}
        ${when(b.gaps.length, () => html`<div class="mt-10">
          ${K.Table({ tight:true, headers:['Açık', { label:'Kapsama', num:true }, { label:'Emilen', num:true }],
            rows:b.gaps.map(g => [g.nutrient, '%' + g.pct, U.fmtNum(g.absorbed)]) })}</div>`)}`;
    }
    if(agent.id === 'move'){
      return html`
        ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          ['Toparlanma', b.readiness == null ? 'ölçüm yok' : b.readiness + '/100 · ' + b.band],
          ['Yük çarpanı', '×' + U.fmtNet(b.factor)],
          ['Akut/kronik', b.acwr.ratio != null ? U.fmtNet(b.acwr.ratio) + ' · ' + b.acwr.zone : b.acwr.note],
          ['Bu hafta yük', U.fmtNum(b.week)],
          ['Bugün', b.doneToday + ' seans · ' + U.fmtNum(b.loadToday) + ' yük'],
          ['Eksik kalıp', b.balance.length ? b.balance.join(', ') : 'yok'],
        ] })}
        ${when(b.progressionReady.length, () => html`<div class="mt-10">
          ${K.Table({ tight:true, headers:['Hareket', 'Basamak'],
            rows:b.progressionReady.map(p => [p.exercise, p.from + ' → ' + p.to]) })}</div>`)}`;
    }
    if(agent.id === 'money'){
      return html`
        ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          ['Sepet', b.itemCount + ' kalem · ' + U.fmtNum(Math.round(b.total)) + ' TL'],
          ['Sınır', b.limit == null ? 'konmadı' : U.fmtNum(b.limit) + ' TL' + (b.over ? ' · aşıldı' : '')],
          ['Kişi başı', U.fmtNum(Math.round(b.perPerson)) + ' TL'],
          ['Tahmin payı', '%' + b.estimatePct],
        ] })}
        ${when(b.swaps.length, () => html`<div class="mt-10">
          ${K.Table({ tight:true, headers:['İkame', { label:'Tasarruf', num:true }, 'Korunan'],
            rows:b.swaps.map(s => [s.from + ' → ' + s.to, U.fmtNum(Math.round(s.saveTotal)) + ' TL',
              s.keeps.join(', ')]) })}</div>`)}`;
    }
    /* patron */
    return html`
      ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
        ['Hafta', U.fmtRange(b.week.start, b.week.end)],
        ['Toparlanma ortalaması', b.week.readiness == null ? '—' : String(b.week.readiness)],
        ['Asgari gün', b.week.minDays + '/7'],
        ['Seans', String(b.week.sessions)],
        ['Öğün kaydı', b.week.loggedMeals + ' gün'],
        ['Davranış serisi', b.streak + ' gün'],
        ['Açık karar', String(b.openDecisions.length)],
      ] })}
      ${when(b.cross.length, () => html`<div class="mt-10">
        ${K.Table({ tight:true, headers:['Çapraz bağ', 'Bulgu'],
          rows:b.cross.map(c => [c.title, html`<span class="small">${c.text}</span>`]) })}</div>`)}`;
  }

  function briefingCard(){
    const d = U.todayISO();
    const b = S.officeBriefings[d];
    return K.Card({
      title:'Günün brifingi', hint:'office',
      sub:U.fmtDate(d),
      badge:b ? P.sourceBadge(b.source) : K.Badge({ label:'üretilmedi', tone:'muted' }),
      body:html`
        ${when(b, () => html`<p class="small">${b.text}</p>
          ${when(b.headline, () => html`<p class="small dim mt-8">${b.headline}</p>`)}`)}
        ${when(!b, () => K.Notice({ tone:'info',
          body:'Brifing günde bir kez üretilir ve tek model çağrısı harcar. '
             + 'Model kapalıysa kural motorunun cümlesi yazılır.' }))}`,
      foot:K.Button({ label:'Tazele', size:'sm', act:'refresh-briefing' }),
    });
  }

  function decisionCard(){
    const open = SP.Model.openDecisions();
    const closed = S.decisions.filter(d => d.status === 'closed').slice(0, 5);
    return K.Card({
      title:'Takipteki kararlar', hint:'decision',
      badge:K.Badge({ label:String(open.length), tone:open.length ? 'warn' : 'muted' }),
      body:html`
        ${when(!open.length && !closed.length, () => K.Empty({ text:'Henüz karar kaydı yok.' }))}
        ${when(open.length, () => html`<div class="list">${map(open, d => html`
          <div class="listitem">
            <div class="grow"><b class="small">${d.title}</b>
              <div class="tiny dim">${U.relativeDay(d.at.slice(0, 10))} · ${d.why || ''}</div></div>
            ${K.Button({ label:'Kapat', size:'sm', act:'close-decision', data:{ 'data-id':d.id } })}
          </div>`)}</div>`)}
        ${when(closed.length, () => html`<div class="mt-12">
          <h3 class="section-h">Kapanan kararlar</h3>
          <div class="list">${map(closed, d => html`
            <div class="listitem"><div class="grow"><b class="small">${d.title}</b>
              <div class="tiny dim">${d.outcome || 'sonuç yazılmadı'}</div></div>
              ${K.Badge({ label:'kapandı', tone:'muted' })}</div>`)}</div></div>`)}`,
      foot:K.Button({ label:'Karar ekle', size:'sm', act:'add-decision' }),
    });
  }

  function agendaCard(){
    const rows = SP.Office.agendaCandidates().slice(0, 5);
    return K.Card({
      title:'Gündem adayları',
      sub:'Puanlama kural motorundan gelir',
      body:html`<div class="list">${map(rows, (a, i) => html`
        <div class="listitem">
          <div class="grow"><b class="small">${a.label}</b>
            ${K.Badge({ label:String(a.score), tone:a.score >= 65 ? 'danger' : a.score >= 40 ? 'warn' : 'muted' })}
            <div class="tiny dim">${a.detail}</div></div>
          ${P.avatar(a.owner, 'sm')}
        </div>`)}</div>`,
      foot:K.Button({ label:'Toplantıyı başlat', size:'sm', tone:'primary',
        act:'go', data:{ 'data-route':'meeting' } }),
    });
  }

  async function render(){
    const flags = SP.Model.openFlags();
    return String(K.Grid([
      when(flags.length, () => K.Span(12, K.Stack(map(flags, P.flagCard), 'sm'))),
      K.Span(12, briefingCard()),
      K.Span(8, html`<div class="desks">${map(SP.AGENTS, deskCard)}</div>`),
      K.Span(4, K.Stack([agendaCard(), decisionCard(),
        K.Card({ title:'Yetki ayrımı', hint:'office',
          body:html`<ul class="bullets small muted">${map(SP.AGENTS, a => html`
            <li><b>${a.name}</b> — ${a.scope}</li>`)}</ul>` }),
      ])),
      K.Span(12, raw(UI.rail(['office', 'grounding', 'no-model', 'privacy', 'decision']))),
    ]));
  }

  const handle = {
    async 'toggle-desk'(el){
      S.ui.officeDesk = S.ui.officeDesk === el.dataset.id ? null : el.dataset.id;
      SP.App.render();
    },
    async 'refresh-briefing'(){
      UI.toast('Brifing üretiliyor…');
      await SP.Office.dailyBriefing(true);
      SP.App.render();
    },
    async 'add-decision'(){
      UI.sheet({
        title:'Karar ekle',
        body:String(K.Stack([
          K.Field({ label:'Karar', input:K.Input({ id:'dec-title',
            placeholder:'Örnek: iki hafta boyunca çayı öğünden bir saat sonraya al' }) }),
          K.Field({ label:'Gerekçe', input:K.Textarea({ id:'dec-why', rows:2,
            placeholder:'Hangi bulguya dayanıyor?' }) }),
        ])),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Kaydet', tone:'primary', act:'save-decision' })}`),
      });
    },
    async 'save-decision'(){
      const t = document.getElementById('dec-title');
      const w = document.getElementById('dec-why');
      if(!t || !t.value.trim()){ UI.toast('Karar metni gerekli'); return; }
      await SP.Model.saveDecision({ title:t.value.trim(), why:w ? w.value.trim() : '' });
      UI.closeSheet();
      UI.toast('Karar takibe alındı');
      SP.App.render();
    },
    async 'close-decision'(el){
      const id = el.dataset.id;
      UI.sheet({
        title:'Kararı kapat',
        body:String(K.Field({ label:'Sonuç', input:K.Textarea({ id:'dec-out', rows:3,
          placeholder:'Ne değişti? Ölçümle, hisle değil.' }) })),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Kapat', tone:'primary', act:'save-close', data:{ 'data-id':id } })}`),
      });
    },
    async 'save-close'(el){
      const out = document.getElementById('dec-out');
      await SP.Model.closeDecision(el.dataset.id, out ? out.value.trim() : '');
      UI.closeSheet();
      UI.toast('Karar kapatıldı');
      SP.App.render();
    },
  };

  return {
    id:'office',
    title:'Ofis',
    headline(){
      const notes = SP.Office.notes();
      const loud = notes.filter(n => n.tone === 'danger' || n.tone === 'warn').length;
      if(!notes.length) return 'Masalar sessiz.';
      if(loud) return loud + ' masada dikkat isteyen not var.';
      return 'Masalarda ' + notes.length + ' not var.';
    },
    lede(){
      return 'Patron ekibi yönetir; Kerem laboratuvara, Nesrin beslenmeye, '
        + 'Barış harekete, Sedef ekonomiye bakar. Her not önce kural motorundan '
        + 'çıkar — model varsa onu yeniden yazar, yerine geçmez.';
    },
    stats(){
      const notes = SP.Office.notes();
      const open = SP.Model.openDecisions().length;
      const out = [{ value:notes.length, label:'masa notu' }];
      if(open) out.push({ value:open, label:'karar takipte' });
      return out;
    },
    subtitle(){
      const n = SP.Office.notes();
      const open = SP.Model.openDecisions().length;
      return n.length + ' masa notu' + (open ? ' · ' + open + ' karar takipte' : '');
    },
    actions(){
      return String(K.Button({ label:'Toplantı', size:'sm', icon:'users', class:'btn--screen',
        act:'go', data:{ 'data-route':'meeting' } }));
    },
    render, handle,
  };
})();
