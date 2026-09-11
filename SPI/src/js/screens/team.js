/* Danışma — bir ajana doğrudan soru sormak.

   Ajan yalnızca kendi brifingini görür ve alan dışına çıkmaz. Cevabın
   altındaki rozet cümlenin nereden geldiğini söyler: model mi, kural motoru mu.

   Model çıktısı ev kurallarına takılırsa cümle basılmaz; yerine kural
   motorunun cümlesi geçer ve neden engellendiği yazılır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.team = (function(){
  const U = SP.U, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  let busy = false;

  function current(){
    return SP.AGENT_BY_ID[S.ui.officeAgent] || SP.AGENT_BY_ID.patron;
  }

  function tabsCard(){
    return html`<div class="agenttabs">${map(SP.AGENTS, a => html`
      <button class="${cls('agenttab', a.id === S.ui.officeAgent && 'is-on')}"
        data-act="pick-agent" data-id="${a.id}" aria-pressed="${a.id === S.ui.officeAgent}">
        ${P.avatar(a.id, 'sm')}
        <span><b>${a.name}</b><span class="tiny dim"> ${a.title}</span></span>
      </button>`)}</div>`;
  }

  function chatCard(){
    const a = current();
    const msgs = S.officeChats[a.id] || [];
    return K.Card({
      title:a.name, sub:a.role,
      badge:SP.Office.ready(a.id) ? K.Badge({ label:'model açık', tone:'info' })
        : K.Badge({ label:'kural motoru', tone:'muted', icon:false }),
      body:html`
        <div class="chat">
          <div class="msg msg--agent">
            ${P.avatar(a.id, 'sm')}
            <div class="msg__body"><p class="small">${a.opening}</p></div>
          </div>
          ${map(msgs, m => html`
            <div class="${cls('msg', m.role === 'user' ? 'msg--me' : 'msg--agent')}">
              ${when(m.role !== 'user', () => P.avatar(a.id, 'sm'))}
              <div class="msg__body">
                <p class="small">${m.text}</p>
                ${when(m.role !== 'user', () => html`<div class="row-sm mt-4">
                  ${P.sourceBadge(m.source)}
                  ${when(m.blocked, () => K.Badge({ label:'kurallara takıldı', tone:'warn' }))}
                  ${when(m.error, () => K.Badge({ label:'bağlantı hatası', tone:'danger' }))}
                </div>`)}
              </div>
            </div>`)}
          ${when(busy, () => html`<div class="msg msg--agent">${P.avatar(a.id, 'sm')}
            <div class="msg__body">${K.Skeleton({ rows:2 })}</div></div>`)}
        </div>`,
      foot:html`
        <div class="quick">
          ${K.Mic({ target:'chat-text' })}
          ${K.Input({ id:'chat-text', placeholder:'Sorunu yaz ya da mikrofona söyle…', aria:'Soru' })}
          ${K.Button({ label:'Gönder', tone:'primary', act:'send-chat', disabled:busy })}
        </div>`,
    });
  }

  function scopeCard(){
    const a = current();
    return K.Card({
      title:'Bu ajan neye bakar?',
      body:html`
        ${K.Table({ tight:true, headers:['Alan', 'Kapsam'], rows:[
          ['Bakar', a.scope],
          ['Bakmaz', a.notScope],
          ['Alan dışında', a.redirect],
        ] })}
        ${K.Notice({ tone:'info', class:'mt-10', title:'Modele ne gider?',
          body:SP.PRIVACY.model })}`,
      foot:K.Button({ label:'Sohbeti temizle', size:'sm', act:'clear-chat' }),
    });
  }

  function briefCard(){
    const a = current();
    const b = SP.Office.brief(a.id);
    return K.Collapsible({
      title:'Ajanın gördüğü brifing', meta:'JSON', act:'toggle-brief',
      open:!!S.ui.briefOpen,
      body:html`<pre class="codeblock">${JSON.stringify(b, null, 2)}</pre>
        <p class="small muted mt-8">Ajan hesap yapmaz: bütün sayılar bu brifingden gelir.
          Brifingde olmayan bir sayıyı yazamaz.</p>`,
    });
  }

  function suggestCard(){
    const a = current();
    const qs = ({
      patron:['Bu hafta neye odaklanmalıyım?', 'Çelişki varsa hangisi öncelikli?',
        'Bütçe ile sağlık hedefi çakışıyor mu?'],
      lab:['Hangi ölçümüm en çok dikkat istiyor?', 'Eğilimi kötüye giden bir değer var mı?',
        'Hangi paneli yenilemeliyim?'],
      nutri:['En büyük açığım hangisi?', 'Demir emilimimi ne bozuyor?',
        'Bugünkü öğünlerim hedefi tutturdu mu?'],
      move:['Bugün ne kadar yüklenmeliyim?', 'Aşırı yükleniyor muyum?',
        'Hangi harekette üst basamağa geçebilirim?'],
      money:['Nereden tasarruf edebilirim?', 'Sepetim besin ihtiyacımı karşılıyor mu?',
        'Toplu alım yapmalı mıyım?'],
    })[a.id] || [];
    return K.Card({
      title:'Sorabileceklerin',
      body:html`<div class="stack-xs">${map(qs, q => K.Button({ label:q, size:'sm', block:true,
        act:'quick-ask', data:{ 'data-q':q } }))}</div>`,
    });
  }

  async function render(){
    return String(html`
      <div class="mb-8">${tabsCard()}</div>
      ${K.Ledger(() => [chatCard(), scopeCard(), suggestCard(), briefCard()])}
      <div class="mt-24">${raw(UI.rail(['office', 'grounding', 'no-model', 'privacy']))}</div>`);
  }

  async function send(text){
    if(busy || !text.trim()) return;
    busy = true;
    SP.App.render();
    try{
      await SP.Office.send(current().id, text.trim());
    }finally{
      busy = false;
      SP.App.render();
    }
  }

  const handle = {
    async 'pick-agent'(el){ S.ui.officeAgent = el.dataset.id; SP.App.render(); },
    async 'toggle-brief'(){ S.ui.briefOpen = !S.ui.briefOpen; SP.App.render(); },
    async 'send-chat'(){
      const el = document.getElementById('chat-text');
      if(!el) return;
      const text = el.value;
      el.value = '';
      await send(text);
    },
    async 'quick-ask'(el){ await send(el.dataset.q); },
    async 'clear-chat'(){
      await SP.Office.clearChat(current().id);
      UI.toast('Sohbet temizlendi');
      SP.App.render();
    },
  };

  return {
    id:'team',
    title:'Danışma',
    subtitle(){
      const a = current();
      return a.name + ' · ' + a.title;
    },
    actions(){ return ''; },
    render, handle,
  };
})();
