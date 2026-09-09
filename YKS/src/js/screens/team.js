/* Ekip sohbeti — bes ajandan biriyle konusma ekrani.

   Her ajan yalnizca kendi brifingini gorur; alan disi soruda kendi
   arkadasina yonlendirir. Model bagli degilse yanit kural motoru
   metninden gelir — ekran her kosulda calisir. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.team = (function(){
  const U = R.U, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;
  const O = R.Office;

  let busy = false;
  let controller = null;

  function current(){
    const id = S.ui.officeAgent;
    return R.AGENT_BY_ID[id] ? R.AGENT_BY_ID[id] : R.AGENT_BY_ID.patron;
  }

  function Avatar(agent){
    return html`<span class="${'agentav agentav--' + agent.id + ' agentav--sm'}"
      aria-hidden="true">${agent.initial}</span>`;
  }

  function Bubble(agent, m){
    if(m.role === 'user'){
      return html`<div class="msg msg--me">
        <div class="msg__body">${raw(U.esc(m.text).replace(/\n/g, '<br/>'))}</div>
      </div>`;
    }
    return html`
      <div class="msg msg--agent">
        <div class="msg__who">${Avatar(agent)}<b>${agent.name}</b>
          <span class="dim">${agent.role}</span>
          ${when(m.mode === 'kural', () => K.Badge({ label:'kural motoru', tone:'info' }))}
        </div>
        <div class="msg__body">${raw(U.esc(m.text).replace(/\n/g, '<br/>'))}</div>
        ${when(m.warnings && m.warnings.length, () => html`
          <div class="msg__warn">${raw(UI.icon('warn'))} ${m.warnings.join(' ')}</div>`)}
        ${when(m.error, () => html`<div class="msg__warn">${raw(UI.icon('warn'))} ${m.error}</div>`)}
      </div>`;
  }

  /* Ajanin masasindaki sayilar — sohbetin ustunde sabit durur,
     boylece yanitin neye dayandigi gorunur. */
  function deskStrip(agent){
    const b = O.brief(agent.id);
    return K.Row(map(b.metrics, m => html`
      <span class="chip"><span class="dim">${m.label}</span> <b>${m.value}</b></span>`), { wrap:true });
  }

  function picker(){
    return K.Segmented({
      act:'team-agent', value:current().id, block:true, aria:'Ajan seç',
      /* Sekmede de avatar durur: ofis kat planındaki kimlik rengi burada
         tekrarlanınca kimin masasında olduğun bakınca anlaşılır. */
      items:R.AGENTS.map(a => ({ value:a.id, label:html`<span class="agenttab">
        <span class="${'agentav agentav--xs agentav--' + a.id}" aria-hidden="true">${a.initial}</span>
        <span class="agenttab__name">${a.name}</span></span>` })),
    });
  }

  async function render(){
    O.resetBriefs();
    const agent = current();
    const msgs = O.chatOf(agent.id);
    const ruleMode = O.mode() !== 'llm';

    return String(K.Grid([
      K.Span(8, K.Stack([
        K.Card({
          body:html`
            <div class="desk__head">
              ${html`<span class="${'agentav agentav--' + agent.id}" aria-hidden="true">${agent.initial}</span>`}
              <div class="minw0">
                <b class="desk__name">${agent.name}</b>
                <span class="desk__role">${agent.role} — ${agent.desk}</span>
              </div>
              ${when(msgs.length, () => K.Button({ label:'Temizle', size:'sm', tone:'ghost', act:'team-clear' }))}
            </div>
            <p class="small muted mt-8">${agent.scope}</p>
            <div class="mt-10">${deskStrip(agent)}</div>`,
        }),

        picker(),

        when(ruleMode, () => K.Notice({ tone:'info', title:'Model bağlı değil.',
          body:'Ajan yine de verine bakıp yanıtlıyor ama cümleleri kural motorundan geliyor. '
             + 'Ücretsiz bir model bağlarsan kendi cümleleriyle konuşur.' })),

        html`<div class="chat" id="chat-log">
          ${msgs.length
            ? map(msgs, m => Bubble(agent, m))
            : html`<div class="chat__empty">${raw(UI.icon('guide'))}
                <p>${agent.name} masasındaki raporu okudu. Sor ya da brifing iste.</p></div>`}
          <div id="chat-pending"></div>
        </div>`,

        K.Row(map(agent.ask, q => K.Chip({ label:q, act:'team-suggest', data:{ 'data-q':q } })), { wrap:true }),

        html`<div class="composer">
          ${K.Textarea({ id:'team-input', rows:2, class:'composer__input',
            placeholder:agent.name + '’a sor…' })}
          ${K.Button({ label:'Sor', icon:'zap', tone:'primary', act:'team-send' })}
        </div>`,
      ])),

      K.Span(4, K.Stack([
        K.Card({
          title:'Masasındaki rapor', sub:'Kural motoru hesapladı; ajan bunu yorumlar',
          actions:K.Button({ label:'Brifing', icon:'refresh', size:'sm', act:'team-brief' }),
          body:html`
            <div class="stack-xs">${map(O.brief(agent.id).findings, f => html`
              <div class="finding">
                <span class="${'finding__dot finding__dot--' + (f.tone || 'muted')}"></span>
                <span>${f.text}</span>
              </div>`)}</div>
            <p class="tiny dim mt-10">Okuduğu veri: ${agent.reads.join(' · ')}</p>`,
        }),
        K.Card({
          title:'Ekipteki diğerleri', sub:'Alan dışı soruyu sahibine sor',
          body:html`<div class="stack-xs">${map(R.AGENTS.filter(a => a.id !== agent.id), a => html`
            <button class="agentrow" data-act="team-agent" data-value="${a.id}">
              ${Avatar(a)}
              <span class="minw0"><b class="small">${a.name}</b>
                <span class="tiny dim">${a.desk}</span></span>
            </button>`)}</div>`,
        }),
        raw(UI.rail([agent.hint, 'ai-coach'])),
      ])),
    ]));
  }

  /* ---------- konusma ---------- */

  function scrollLog(){
    const log = document.getElementById('chat-log');
    if(log) log.scrollTop = log.scrollHeight;
  }

  function pendingBox(agent, label){
    const pending = document.getElementById('chat-pending');
    if(!pending) return;
    pending.innerHTML = String(html`
      <div class="msg msg--agent">
        <div class="msg__who">${Avatar(agent)}<b>${agent.name}</b><span class="dim">${agent.role}</span></div>
        <div class="msg__body dim" id="chat-stream">${label}
          <span class="tiny">(ücretsiz modellerde ilk yanıt 10–60 sn sürebilir)</span></div>
      </div>`);
    scrollLog();
  }

  async function run(kind, question){
    if(busy) return;
    const agent = current();
    busy = true;
    controller = new AbortController();

    if(kind === 'ask'){
      await O.pushChat(agent.id, 'user', question);
      await R.App.render();
    }
    pendingBox(agent, kind === 'ask' ? 'Raporuna bakıyor…' : 'Brifingi hazırlıyor…');

    try{
      const opts = {
        signal:controller.signal,
        onText(ev){
          const el = document.getElementById('chat-stream');
          if(!el) return;
          el.classList.remove('dim');
          el.innerHTML = U.esc(ev.text).replace(/\n/g, '<br/>');
          scrollLog();
        },
      };
      const res = kind === 'ask'
        ? await O.ask(agent.id, question, opts)
        : await O.briefing(agent.id, opts);
      await O.pushChat(agent.id, 'agent', res.text, {
        warnings:res.warnings || [], mode:res.mode, error:res.error || null,
      });
    }catch(err){
      if(!(err && err.code === 'cancelled')){
        await O.pushChat(agent.id, 'agent', R.LLM.errorText(err && err.code), { mode:'kural' });
      }
    }finally{
      busy = false;
      controller = null;
      await R.App.render();
      scrollLog();
    }
  }

  const handle = {
    async 'team-agent'(el){
      const id = el.dataset.value;
      if(!R.AGENT_BY_ID[id]) return;
      if(busy && controller) controller.abort();
      S.ui.officeAgent = id;
      R.App.render();
    },
    async 'team-send'(){
      const el = document.getElementById('team-input');
      const q = el ? el.value.trim() : '';
      if(el) el.value = '';
      if(q) await run('ask', q);
    },
    async 'team-suggest'(el){ await run('ask', el.dataset.q); },
    async 'team-brief'(){ await run('brief'); },
    async 'team-clear'(){
      const agent = current();
      UI.confirmSheet('Sohbeti temizle',
        agent.name + ' ile yaptığın konuşma silinecek. Çalışma verilerin etkilenmez.', async () => {
          await O.clearChat(agent.id);
          UI.closeSheet();
          R.App.render();
        });
    },
  };

  function onKey(e){
    if(e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return;
    const el = document.getElementById('team-input');
    if(el && document.activeElement === el){
      e.preventDefault();
      handle['team-send']();
    }
  }

  return {
    id:'team',
    title:'Ekip sohbeti',
    subtitle(){
      const agent = current();
      const n = O.chatOf(agent.id).length;
      return agent.name + ' · ' + agent.role + (n ? ' · ' + Math.ceil(n/2) + ' soru' : '');
    },
    actions(){
      return String(R.C.Button({ label:'Ofis', icon:'guide', size:'sm', act:'go',
        data:{ 'data-route':'office' } }));
    },
    render, handle, onKey, afterRender:scrollLog,
  };
})();
