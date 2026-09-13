/* Danışma — bir masayla konuşma.

   Her cümlenin altında hangi kaynaktan geldiği yazar: «model» ya da «kural
   motoru». Bu rozet süs değildir — kullanıcının bir cümleye ne kadar
   güveneceğini belirler.

   Brifingin ham JSON'u açılabilir. Kullanıcı ajanın ne gördüğünü tam olarak
   görebilmelidir; görmediği bir şeye dayanarak konuşamaz. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.team = (function(){
  const U = ESP.U, S = ESP.S;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;

  function agent(){
    const a = ESP.AGENT_BY_ID[S.ui.officeAgent];
    /* Kapali bir masaya eski bir baglantidan girilebilir; o durumda Patron
       acilir — bos bir masa, kapatilan seyi geri gelmis gibi gosterir. */
    return (a && ESP.Mod.agentOn(a.id)) ? a : ESP.AGENT_BY_ID.patron;
  }

  function avatar(a){
    return html`<span class="agentav" style="background:${a.color}"
      aria-hidden="true">${a.initial}</span>`;
  }

  function msgRow(m){
    const kaynak = m.role === 'user' ? null
      : (m.source === 'model' ? { label:'model', tone:'info' }
         : { label:'kural motoru', tone:'muted' });
    return html`
      <div class="${cls('msg', m.role === 'user' ? 'msg--me' : 'msg--agent')}">
        <p>${m.text}</p>
        <div class="msg__foot">
          ${when(kaynak, () => K.Badge({ label:kaynak.label, tone:kaynak.tone, icon:false }))}
          ${when(m.blocked, () => K.Badge({ label:'kurallara takıldı', tone:'warn' }))}
          ${when(m.error, () => K.Badge({ label:'hata', tone:'danger' }))}
          <span class="tiny dim">${U.fmtClock ? U.fmtClock(m.at) : ''}</span>
        </div>
      </div>`;
  }

  function render(){
    const a = agent();
    const brf = ESP.Office.brief(a.id);
    const mesajlar = S.officeChats[a.id] || [];
    const hazir = ESP.Office.ready(a.id);
    const devir = ESP.Office.handoffsFor(a.id);

    return K.Grid(html`
      ${K.Span(12, K.Toolbar({
        tabs:K.Subtabs({ value:a.id, act:'pick-agent', aria:'Ajan seçimi',
          items:ESP.Mod.activeAgents().map(x => ({ id:x.id, label:x.short || x.name })) }),
      }))}

      ${K.Span(12, K.Ledger(() => [

        K.Entry({
          label:'MASA',
          meta:a.role,
          note:a.notScope,
          action:K.Badge({ label:hazir ? 'model bağlı' : 'kural motoru',
            tone:hazir ? 'info' : 'muted' }),
          body:html`
            <div class="row">
              ${avatar(a)}
              <div>
                <b>${a.name}</b>
                <p class="small muted">${a.scope}</p>
              </div>
            </div>
            <p class="rulesay mt-10">${a.opening}</p>`,
        }),

        K.Entry({
          label:'KURAL MOTORUNUN CÜMLESİ', hint:'rule-engine',
          meta:'model olmadan',
          note:'Model kapalıyken ajanın konuştuğu dil budur. Yedek değil '
             + 'varsayılan: model bir iyileştirmedir.',
          body:html`<p class="rulesay">${ESP.Office.ruleText(a.id, brf)}</p>`,
        }),

        ...(devir.in.length || devir.out.length ? [K.Entry({
          label:'BU MASANIN DEFTERİ', hint:'handoff',
          meta:(devir.in.length + devir.out.length) + ' satır',
          body:html`
            ${map(devir.in, h => html`<div class="deskflow__row deskflow__row--in">
              <span class="deskflow__arrow">←</span>
              <span><b>${h.fromName}</b> ${h.finding}</span></div>`)}
            ${map(devir.out, h => html`<div class="deskflow__row deskflow__row--out">
              <span class="deskflow__arrow">→</span>
              <span><b>${h.toName}</b> ${h.finding}</span></div>`)}`,
        })] : []),

        K.Entry({
          label:'KONUŞMA',
          meta:mesajlar.length + ' mesaj',
          action:when(mesajlar.length, () => K.Button({ label:'Geçmişi temizle', size:'sm',
            act:'clear-chat' })),
          wide:true,
          body:html`
            <div class="chat">
              ${mesajlar.length
                ? map(mesajlar.slice(-20), msgRow)
                : html`<p class="small muted">Henüz konuşma yok.
                    ${hazir ? '' : 'Model bağlı değil: cevaplar kural motorundan gelir.'}</p>`}
            </div>
            <div class="composer mt-10">
              ${K.Textarea({ id:'chat-input', rows:2, class:'composer__input',
                aria:'Ajana sorun', placeholder:'Sorunu yaz…' })}
              ${K.Mic({ target:'chat-input' })}
              ${K.Button({ label:'Gönder', tone:'primary', act:'send-chat' })}
            </div>`,
        }),

        K.Entry({
          label:'BRİFİNG', hint:'brief',
          meta:'ajanın gördüğü tek şey',
          note:'Ham ses kaydı, tam taslak metni ve notun kendi cümlesi buraya '
             + 'girmez — yalnızca ölçülmüş metrikler ve durum etiketleri.',
          wide:true,
          body:K.Collapsible({
            title:'Ham brifing (JSON)',
            act:'toggle-brief',
            open:!!S.ui.briefOpen,
            body:html`<pre class="jsonbox">${JSON.stringify(brf, null, 2)}</pre>`,
          }),
        }),

      ]))}`);
  }

  const handle = {
    async 'pick-agent'(el){
      S.ui.officeAgent = el.dataset.tab;
      ESP.App.render();
    },

    async 'toggle-brief'(){ S.ui.briefOpen = !S.ui.briefOpen; ESP.App.render(); },

    async 'send-chat'(){
      const el = document.getElementById('chat-input');
      const soru = el ? el.value.trim() : '';
      if(!soru) return;
      if(el) el.value = '';
      const a = agent();
      await ESP.UI.withBusy(async () => {
        await ESP.Office.send(a.id, soru);
      }, 'Yanıt bekleniyor');
      ESP.App.render();
    },

    async 'clear-chat'(){
      await ESP.Office.clearChat(agent().id);
      ESP.App.render();
    },
  };

  const change = {};

  return {
    id:'team',
    title:'Danışma',
    headline(){
      const a = agent();
      return a.name + ' — ' + a.role.toLocaleLowerCase('tr-TR') + '.';
    },
    lede(){
      const a = agent();
      return ESP.Office.ready(a.id)
        ? 'Model bağlı. Her cümlenin altında kaynağı yazar.'
        : 'Model bağlı değil: cevaplar doğrudan kural motorundan gelir ve '
          + '«kural motoru» rozetiyle durur.';
    },
    stats(){
      const a = agent();
      const m = S.officeChats[a.id] || [];
      return [
        { value:String(m.length), label:'mesaj' },
        { value:String(ESP.Office.notes(a.id).length), label:'bulgu' },
        { value:String(ESP.Office.handoffsFor(a.id).in.length), label:'gelen devir' },
        { value:String(ESP.Office.handoffsFor(a.id).out.length), label:'giden devir' },
      ];
    },
    subtitle(){ return agent().title; },
    actions(){ return ''; },
    render, handle, change,
  };
})();
