/* Toplantı — dört uzman konuşur, Patron kapatır.

   Gündem kural motorunun puanlamasından gelir; model gündem seçmez.
   Her tur ayrı bir çağrıdır ve ekrana geldiği anda basılır, hepsi bitmeyi
   beklemez: uzun süren bir toplantıda kullanıcı ilerlemeyi görür.

   Kapanışta Patron çelişkiyi SP.PRECEDENCE sırasına göre çözer ve tek bir
   karar yazar. Kararın kendisi kural motorundan gelir; Patron gerekçelendirir. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.meeting = (function(){
  const U = SP.U, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  let running = false;
  let live = null;     /* devam eden toplantının şu ana kadarki turları */

  function agendaCard(){
    const rows = SP.Office.agendaCandidates();
    const sel = Math.min(S.ui.meetingAgenda, rows.length - 1);
    return K.Card({
      title:'Gündem',
      sub:'Puanlama kural motorundan gelir; model gündem seçmez',
      body:html`<div class="list">${map(rows, (a, i) => html`
        <button class="${cls('listitem', 'listitem--tap', i === sel && 'is-on')}"
          data-act="pick-agenda" data-i="${i}">
          <div class="grow">
            <b class="small">${a.label}</b>
            ${K.Badge({ label:String(a.score),
              tone:a.score >= 65 ? 'danger' : a.score >= 40 ? 'warn' : 'muted' })}
            <div class="tiny dim">${a.detail}</div>
            <div class="tiny dim">${a.note}</div>
          </div>
          ${P.avatar(a.owner, 'sm')}
        </button>`)}</div>`,
      foot:html`${K.Button({ label:running ? 'Toplantı sürüyor…' : 'Toplantıyı başlat',
        tone:'primary', size:'sm', act:'run-meeting', disabled:running })}
        <span class="small dim">Beş çağrı harcanır: dört uzman ve kapanış.
          Model kapalıysa hepsi kural motoru cümlesidir.</span>`,
    });
  }

  function turnBlock(t, closing){
    const a = SP.AGENT_BY_ID[t.agent];
    return html`
      <div class="${cls('meetturn', closing && 'meetturn--closing')}">
        <div class="meetturn__who">
          ${P.avatar(t.agent, 'sm')}
          <b>${t.name}</b>
          <span class="dim">${a ? a.title : ''}</span>
          ${P.sourceBadge(t.source)}
        </div>
        <div class="meetturn__body">${t.text}</div>
      </div>`;
  }

  function liveCard(){
    if(!live) return null;
    return K.Card({
      title:'Toplantı sürüyor', sub:live.agenda.label,
      body:html`<div class="meet">
        ${map(live.turns, t => turnBlock(t, false))}
        ${when(running, () => html`<div class="meetturn is-live">
          ${K.Skeleton({ rows:2, label:'Sıradaki konuşuyor',
            hint:'her ajan yalnız kendi alanından konuşur' })}</div>`)}
      </div>`,
    });
  }

  function minutesCard(rec){
    return K.Card({
      title:'Tutanak', sub:rec.agenda.label + ' · ' + U.fmtDate(rec.date),
      badge:P.sourceBadge(rec.source),
      body:html`
        <p class="small dim">${rec.agenda.detail}</p>
        <div class="meet mt-12">
          ${map(rec.turns, t => turnBlock(t, false))}
          ${turnBlock({ agent:'patron', name:'Patron', text:rec.closing, source:rec.source }, true)}
        </div>
        ${when(rec.decision && !rec.decision.calm, () => K.Notice({ tone:'info', class:'mt-12',
          title:'Kural motorunun kararı:',
          body:rec.decision.title + ' — ' + rec.decision.why }))}`,
      foot:html`${K.Button({ label:'Kararı takibe al', size:'sm', tone:'primary',
        act:'track-decision', data:{ 'data-id':rec.id } })}`,
    });
  }

  function historyCard(){
    const rows = S.officeMeetings;
    if(!rows.length){
      return K.Card({ title:'Geçmiş toplantılar',
        body:K.Empty({ text:'Henüz toplantı yapılmadı.' }) });
    }
    return K.Card({
      title:'Geçmiş toplantılar', sub:rows.length + ' tutanak',
      body:html`<div class="list">${map(rows.slice(0, 12), m => html`
        <div class="listitem">
          <div class="grow"><b class="small">${m.agenda.label}</b>
            <div class="tiny dim">${U.fmtDate(m.date)} · ${m.turns.length + 1} tur</div></div>
          ${K.Button({ label:S.ui.meetingOpen === m.id ? 'Kapat' : 'Aç', size:'sm',
            act:'open-minutes', data:{ 'data-id':m.id } })}
        </div>`)}</div>`,
    });
  }

  async function render(){
    const open = S.officeMeetings.find(m => m.id === S.ui.meetingOpen);
    return String(html`
      ${K.Ledger(() => [
        agendaCard(), liveCard(), open ? minutesCard(open) : null, historyCard(),
        K.Entry({ label:'Çelişki nasıl çözülür?', hint:'office', meta:'öncelik sırası',
          note:'Üstteki sıra alttakini her zaman yener. Bu tartışmaya açık değildir; '
            + 'Patron da buna uyar.',
          body:K.Table({ tight:true, headers:['Sıra', 'Kural', 'Neden'],
            rows:SP.PRECEDENCE.map(p => [String(p.rank), html`<b>${p.label}</b>`,
              html`<span class="small">${p.note}</span>`]) }) }),
      ])}
      <div class="mt-24">${raw(UI.rail(['office', 'grounding', 'decision', 'no-model']))}</div>`);
  }

  const handle = {
    async 'pick-agenda'(el){ S.ui.meetingAgenda = Number(el.dataset.i); SP.App.render(); },
    async 'run-meeting'(){
      if(running) return;
      const rows = SP.Office.agendaCandidates();
      const pick = rows[Math.min(S.ui.meetingAgenda, rows.length - 1)];
      running = true;
      live = { agenda:pick, turns:[] };
      SP.App.render();
      try{
        const rec = await SP.Office.runMeeting(pick.id, turn => {
          live.turns.push(turn);
          SP.App.render();
        });
        S.ui.meetingOpen = rec.id;
        UI.toast('Toplantı tamamlandı');
      }catch(e){
        UI.toast('Toplantı tamamlanamadı: ' + (e && e.message ? e.message : e));
      }finally{
        running = false;
        live = null;
        SP.App.render();
      }
    },
    async 'open-minutes'(el){
      S.ui.meetingOpen = S.ui.meetingOpen === el.dataset.id ? null : el.dataset.id;
      SP.App.render();
    },
    async 'track-decision'(el){
      const rec = S.officeMeetings.find(m => m.id === el.dataset.id);
      if(!rec) return;
      const d = rec.decision;
      await SP.Model.saveDecision({
        title:d && !d.calm ? d.title : rec.agenda.label,
        why:d && !d.calm ? d.why : rec.agenda.detail,
      });
      UI.toast('Karar takibe alındı');
      SP.App.render();
    },
  };

  return {
    id:'meeting',
    title:'Toplantı',
    subtitle(){
      if(running) return 'Toplantı sürüyor…';
      const rows = SP.Office.agendaCandidates();
      return rows.length ? 'Gündem: ' + rows[0].label : 'Gündem yok';
    },
    actions(){ return ''; },
    render, handle,
  };
})();
