/* Toplanti odasi — ajanlarin birbiriyle konustugu yer.

   Akis sabittir: Patron gundemi acar → Analist, TYT, AYT ve Rehber sirayla
   kendi alanindan tek bulgu bildirir → Patron tek karar cikarir.
   Gundemi ve karari kural motoru belirler; ajanlar yalnizca gerekcelendirir. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.meeting = (function(){
  const U = R.U, UI = R.UI, S = R.S;
  const { html, raw, when, map, cls } = R.h;
  const K = R.C;
  const O = R.Office;

  /* Konusma sirasi — ekranin "siradaki konusmaci"yi bilmesi icin. */
  const SEQ = ['patron'].concat(R.MEETING_ORDER).concat(['patron']);

  let running = false;
  let controller = null;
  let liveTurns = [];
  let liveAgenda = null;

  /* ---------- parcalar ---------- */

  function Avatar(agent){
    return html`<span class="${'agentav agentav--' + agent.id + ' agentav--sm'}"
      aria-hidden="true">${agent.initial}</span>`;
  }

  function Turn(t){
    const agent = R.AGENT_BY_ID[t.agent] || R.AGENT_BY_ID.patron;
    return html`
      <div class="${cls('meetturn', t.closing && 'meetturn--closing')}">
        <div class="meetturn__who">
          ${Avatar(agent)}<b>${agent.name}</b><span class="dim">${agent.role}</span>
          ${when(t.closing, () => K.Badge({ label:'karar', tone:'ok' }))}
          ${when(t.mode === 'kural', () => K.Badge({ label:'kural motoru', tone:'info' }))}
        </div>
        <div class="meetturn__body">${raw(U.esc(t.text).replace(/\n/g, '<br/>'))}</div>
        ${when(t.warnings && t.warnings.length, () => html`
          <div class="msg__warn">${raw(UI.icon('warn'))} ${t.warnings.join(' ')}</div>`)}
        ${when(t.error, () => html`<div class="msg__warn">${raw(UI.icon('warn'))} ${t.error}</div>`)}
      </div>`;
  }

  function pendingTurn(agentId, label){
    const agent = R.AGENT_BY_ID[agentId];
    return html`
      <div class="meetturn is-live">
        <div class="meetturn__who">${Avatar(agent)}<b>${agent.name}</b>
          <span class="dim">${agent.role}</span></div>
        <div class="meetturn__body dim" id="meet-stream">${label}</div>
      </div>`;
  }

  function agendaCard(){
    const list = O.agendaCandidates().slice(0, 5);
    const picked = list[U.clamp(S.ui.meetingAgenda || 0, 0, list.length - 1)] || list[0];
    const calls = SEQ.length;

    return K.Card({
      title:'Gündem', sub:'Kural motoru en yüksek öncelikli başlığı seçti',
      badge:K.Badge({ label:O.mode() === 'llm' ? 'model bağlı' : 'kural motoru',
        tone:O.mode() === 'llm' ? 'ok' : 'info' }),
      body:html`
        ${K.Notice({ tone:'info', title:picked.topic + '.', body:picked.why })}
        ${when(list.length > 1, () => html`<div class="mt-10">
          ${K.Field({ label:'Başka bir gündemle topla',
            input:K.Select({ id:'meet-agenda', change:'meet-agenda',
              value:String(S.ui.meetingAgenda || 0),
              options:list.map((c, i) => ({ value:String(i), label:c.topic })) }) })}
        </div>`)}
        <div class="row wrap gap-6 mt-12">
          ${running
            ? K.Button({ label:'Toplantıyı durdur', tone:'danger', act:'meet-stop' })
            : K.Button({ label:'Toplantıyı başlat', icon:'zap', tone:'primary', act:'meet-start' })}
          ${K.Button({ label:'Ofise dön', size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'office' } })}
        </div>
        <p class="tiny dim mt-8">Bir toplantı ${calls} konuşma turu sürer.
          ${O.mode() === 'llm'
            ? 'Ücretsiz modellerde istek sınırına takılırsan motor yedek modele, o da olmazsa kural motoruna düşer.'
            : 'Model bağlı değil; ajanlar kural motoru metniyle konuşacak.'}</p>`,
    });
  }

  function liveCard(){
    const turns = liveTurns.length ? liveTurns : null;
    return K.Card({
      title:running ? 'Toplantı sürüyor' : 'Toplantı',
      sub:liveAgenda ? liveAgenda.topic : 'Başlat’a bas; ekip sırayla konuşacak',
      body:html`
        <div class="meet" id="meet-live">
          <div id="meet-turns">${when(turns, () => map(turns, Turn))}</div>
          <div id="meet-pending"></div>
        </div>
        ${when(!turns && !running, () => K.Empty({ icon:'guide',
          text:'Ekip henüz toplanmadı. Patron gündemi açar, uzmanlar sırayla kendi alanından '
             + 'tek bulgu bildirir, sonunda tek karar çıkar.' }))}`,
    });
  }

  function decisionCard(m){
    if(!m) return '';
    return K.Card({
      class:'card--primary', title:'Toplantı kararı',
      sub:'Kural motorunun belirlediği tek iş — Patron gerekçelendirdi',
      body:html`
        ${K.NextUp({ icon:'zap', label:'Karar', title:m.action.title, why:m.action.why,
          action:K.Button({ label:'Şimdi yap', tone:'primary', size:'sm', act:'go',
            data:{ 'data-route':m.action.route || 'today' } }) })}`,
    });
  }

  function archiveCard(){
    const list = O.meetings();
    if(!list.length) return '';
    return K.Card({
      title:'Geçmiş toplantılar', sub:list.length + ' tutanak saklanıyor',
      body:html`<div class="stack-xs">${map(list, m => K.Collapsible({
        title:m.topic,
        meta:U.relativeDay(m.at.slice(0, 10)) + ' · ' + m.mode,
        act:'meet-open', data:{ 'data-id':m.id },
        open:S.ui.meetingOpen === m.id,
        body:html`
          <div class="meet">${map(m.turns, Turn)}</div>
          ${K.Notice({ tone:'info', title:'Karar:', body:m.action.title })}
          <div class="row wrap gap-6 mt-10">
            ${K.Button({ label:'Kararı uygula', size:'sm', tone:'primary', act:'go',
              data:{ 'data-route':m.action.route || 'today' } })}
            ${K.Button({ label:'Tutanağı sil', size:'sm', tone:'ghost', act:'meet-delete',
              data:{ 'data-id':m.id } })}
          </div>`,
      }))}</div>`,
    });
  }

  function teamCard(){
    return K.Card({
      title:'Masadakiler', sub:'Konuşma sırası: Patron açar, uzmanlar konuşur, Patron kapatır',
      body:html`<div class="stack-xs">${map(SEQ.filter((id, i) => SEQ.indexOf(id) === i), id => {
        const a = R.AGENT_BY_ID[id];
        return html`<button class="agentrow" data-act="meet-talk" data-agent="${a.id}">
          ${Avatar(a)}
          <span class="minw0"><b class="small">${a.name}</b>
            <span class="tiny dim">${a.desk}</span></span>
        </button>`;
      })}</div>`,
    });
  }

  /* ---------- ekran ---------- */

  async function render(){
    O.resetBriefs();
    const last = O.lastMeeting();
    const showDecision = !running && liveTurns.length ? last : null;

    return String(K.Grid([
      K.Span(8, K.Stack([
        agendaCard(),
        liveCard(),
        when(showDecision, () => decisionCard(showDecision)),
        archiveCard(),
      ])),
      K.Span(4, K.Stack([
        teamCard(),
        raw(UI.rail(['next-action', 'gate', 'ai-coach'])),
      ])),
    ]));
  }

  /* ---------- toplanti yurutme ---------- */

  function paint(){
    const box = document.getElementById('meet-turns');
    if(box) box.innerHTML = String(map(liveTurns, Turn));
  }

  function paintPending(){
    const box = document.getElementById('meet-pending');
    if(!box) return;
    const nextId = SEQ[liveTurns.length];
    if(!nextId || !running){ box.innerHTML = ''; return; }
    const label = liveTurns.length === 0 ? 'Gündemi açıyor…'
      : liveTurns.length === SEQ.length - 1 ? 'Kararı yazıyor…' : 'Raporuna bakıyor…';
    box.innerHTML = String(pendingTurn(nextId, label));
  }

  function scrollToLive(){
    const el = document.getElementById('meet-pending');
    if(el && el.firstChild && el.scrollIntoView) el.scrollIntoView({ block:'nearest' });
  }

  async function start(){
    if(running) return;
    const list = O.agendaCandidates().slice(0, 5);
    const picked = list[U.clamp(S.ui.meetingAgenda || 0, 0, list.length - 1)] || list[0];

    running = true;
    liveTurns = [];
    liveAgenda = picked;
    controller = new AbortController();
    await R.App.render();
    paintPending();

    try{
      await O.meet({
        agenda:picked,
        signal:controller.signal,
        onText(agentId, ev){
          const el = document.getElementById('meet-stream');
          if(!el) return;
          el.classList.remove('dim');
          el.innerHTML = U.esc(ev.text).replace(/\n/g, '<br/>');
          scrollToLive();
        },
        async onTurn(turn, turns){
          liveTurns = turns.slice();
          paint();
          paintPending();
          scrollToLive();
        },
      });
    }catch(err){
      if(!(err && err.code === 'cancelled')){
        UI.toast(R.LLM.errorText(err && err.code));
      }
    }finally{
      running = false;
      controller = null;
      await R.App.render();
    }
  }

  const handle = {
    async 'meet-start'(){ await start(); },
    async 'meet-stop'(){
      if(controller) controller.abort();
      running = false;
      await R.App.render();
    },
    async 'meet-open'(el){
      const id = el.dataset.id;
      S.ui.meetingOpen = S.ui.meetingOpen === id ? null : id;
      R.App.render();
    },
    async 'meet-delete'(el){
      const id = el.dataset.id;
      UI.confirmSheet('Tutanağı sil', 'Bu toplantı kaydı silinecek. Çalışma verilerin etkilenmez.',
        async () => {
          await O.deleteMeeting(id);
          UI.closeSheet();
          R.App.render();
        }, true);
    },
    async 'meet-talk'(el){
      S.ui.officeAgent = el.dataset.agent;
      R.App.go('team');
    },
  };

  const change = {
    async 'meet-agenda'(el){
      S.ui.meetingAgenda = Number(el.value) || 0;
      R.App.render();
    },
  };

  /* Ofisten "Toplantı başlat" ile gelindiyse ekran acilir acilmaz baslar. */
  function afterRender(){
    if(S.ui.meetingAuto && !running){
      S.ui.meetingAuto = false;
      setTimeout(start, 60);
    }
  }

  return {
    id:'meeting',
    title:'Toplantı odası',
    subtitle(){
      if(running) return 'Toplantı sürüyor · ' + liveTurns.length + '/' + SEQ.length + ' konuşma';
      const last = O.lastMeeting();
      return last ? 'Son toplantı ' + U.relativeDay(last.at.slice(0, 10)) + ' · ' + last.topic
        : 'Ekip 5 kişi · gündemi kural motoru seçer';
    },
    actions(){
      return String(K.Button({ label:'Ofis', icon:'guide', size:'sm', act:'go',
        data:{ 'data-route':'office' } }));
    },
    render, handle, change, afterRender,
    isRunning(){ return running; },
  };
})();
