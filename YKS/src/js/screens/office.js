/* Ofis — bes ajanin masasi, gunun karari ve model ayarlari.

   Yazim bicimi: STIL.md / DONUSTURME.md. String birlestirme yok,
   etkilesim yalniz data-act ile baglanir. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.office = (function(){
  const U = R.U, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;
  const O = R.Office;

  /* ---------- parcalar ---------- */

  function Avatar(agent, size){
    return html`<span class="${'agentav agentav--' + agent.id + (size === 'sm' ? ' agentav--sm' : '')}"
      aria-hidden="true">${agent.initial}</span>`;
  }

  function findingRow(f){
    return html`<div class="finding">
      <span class="${'finding__dot finding__dot--' + (f.tone || 'muted')}"></span>
      <span>${f.text}</span>
    </div>`;
  }

  function deskMetrics(b){
    return html`<div class="deskstats">${map(b.metrics, m => html`
      <div class="deskstat">
        <span class="deskstat__label">${m.label}</span>
        <b class="${'deskstat__value num' + (m.tone && m.tone !== 'muted' ? ' is-' + m.tone : '')}">${m.value}</b>
        ${when(m.note, () => html`<span class="deskstat__note">${m.note}</span>`)}
      </div>`)}</div>`;
  }

  function Desk(agent){
    const b = O.brief(agent.id);
    const open = S.ui.officeDesk === agent.id;
    const worst = b.findings.some(f => f.tone === 'danger') ? 'danger'
      : b.findings.some(f => f.tone === 'warn') ? 'warn' : 'ok';

    return K.Card({
      class:'desk',
      body:html`
        <div class="desk__head">
          ${Avatar(agent)}
          <div class="minw0">
            <b class="desk__name">${agent.name}</b>
            <span class="desk__role">${agent.role}</span>
          </div>
          ${K.Badge({ label:worst === 'danger' ? 'dikkat' : worst === 'warn' ? 'izliyor' : 'temiz', tone:worst })}
        </div>

        <p class="desk__line">${b.headline}</p>
        ${deskMetrics(b)}

        ${when(open, () => html`
          <div class="desk__open">
            <div class="stack-xs mt-10">${map(b.findings, findingRow)}</div>
            ${when(b.suggestion, () => K.Notice({ tone:'info', title:'Önerisi:', body:b.suggestion.text }))}
            <p class="tiny dim mt-8">Masasındaki veri: ${agent.reads.join(' · ')}</p>
          </div>`)}

        <div class="row wrap gap-6 mt-10">
          ${K.Button({ label:'Konuş', icon:'zap', size:'sm', tone:'primary',
            act:'office-talk', data:{ 'data-agent':agent.id } })}
          ${K.Button({ label:open ? 'Kapat' : 'Raporu aç', size:'sm', tone:'ghost',
            act:'office-desk', data:{ 'data-agent':agent.id } })}
          ${when(b.suggestion && b.suggestion.route, () => K.Button({ label:b.suggestion.label, size:'sm',
            act:'go', data:{ 'data-route':b.suggestion.route } }))}
        </div>`,
    });
  }

  /* Patron karti — gunun tek isini gosterir, digerlerinden ayrilir. */
  function BossCard(){
    const patron = R.AGENT_BY_ID.patron;
    const b = O.brief('patron');
    const action = O.nextAction();

    return K.Card({
      class:'card--primary',
      title:'Patron’un masası',
      sub:'Dört uzmanın raporunu birleştirir; günün tek işini o söyler',
      badge:K.Badge({ label:O.mode() === 'llm' ? 'model bağlı' : 'kural motoru',
        tone:O.mode() === 'llm' ? 'ok' : 'info' }),
      body:html`
        ${K.NextUp({ icon:action.icon || 'zap', label:action.label || 'Sıradaki iş',
          title:action.title, why:action.why, hint:'next-action',
          action:K.Button({ label:'Şimdi yap', tone:'primary', size:'sm', act:'go',
            data:{ 'data-route':action.route || 'today' } }) })}

        <div class="stack-xs mt-12">${map(b.findings, findingRow)}</div>

        <div class="row wrap gap-6 mt-12">
          ${K.Button({ label:'Toplantı başlat', icon:'zap', tone:'primary', act:'office-meet' })}
          ${K.Button({ label:'Patron’a danış', size:'sm', act:'office-talk',
            data:{ 'data-agent':'patron' } })}
          ${K.Button({ label:'Toplantı odası', size:'sm', tone:'ghost', act:'go',
            data:{ 'data-route':'meeting' } })}
        </div>`,
    });
  }

  function modeCard(){
    if(O.mode() === 'llm'){
      const st = O.settings();
      const custom = Object.keys(st.perAgent || {}).length;
      return K.Card({
        title:'Ofis modeli', sub:'Ajanların konuşmak için kullandığı model',
        actions:K.Button({ label:'Ayarlar', icon:'gear', size:'sm', act:'office-settings' }),
        body:html`
          ${K.Notice({ tone:'ok', title:'Bağlı:', body:O.providerLabel() })}
          <p class="tiny dim mt-8">
            ${custom ? custom + ' ajan kendi modelini kullanıyor. ' : ''}Model düşerse motor
            yedek modele geçer; hiçbiri yanıt vermezse ajanlar kural motoru metniyle konuşur.
          </p>`,
      });
    }
    return K.Card({
      title:'Ofis modeli', sub:'Ücretsiz bir model bağlayınca ajanlar konuşmaya başlar',
      actions:K.Button({ label:'Bağla', icon:'gear', size:'sm', tone:'primary', act:'office-settings' }),
      body:html`
        ${K.Notice({ tone:'info', title:'Şu an kural motoru modundasın.',
          body:'Ajanlar veriyi okuyup bulgularını yazıyor ama cümleleri sabit. '
             + 'OpenRouter, Groq ya da Google AI Studio’dan ücretsiz bir anahtar alıp bağlarsan '
             + 'aynı bulguları kendi cümleleriyle tartışırlar.' })}
        <div class="row wrap gap-6 mt-10">
          ${map(['openrouter', 'groq', 'gemini'], id => K.Chip({ label:R.PROVIDERS[id].label,
            act:'office-settings', data:{ 'data-provider':id } }))}
        </div>`,
    });
  }

  function lastMeetingCard(){
    const m = O.lastMeeting();
    if(!m){
      return K.Card({ title:'Son toplantı', sub:'Ekip henüz toplanmadı',
        body:K.Empty({ icon:'guide', text:'Toplantıda gündemi kural motoru seçer, uzmanlar sırayla konuşur, '
          + 'Patron tek karar çıkarır.',
          action:K.Button({ label:'İlk toplantıyı başlat', tone:'primary', act:'office-meet' }) }) });
    }
    const closing = m.turns.filter(t => t.closing).pop();
    return K.Card({
      title:'Son toplantı', sub:U.relativeDay(m.at.slice(0, 10)) + ' · ' + m.topic,
      badge:K.Badge({ label:m.mode, tone:m.mode === 'llm' ? 'ok' : 'info' }),
      body:html`
        ${when(closing, () => html`<p class="prose">${closing.text}</p>`)}
        ${K.Notice({ tone:'info', title:'Karar:', body:m.action.title })}
        <div class="row wrap gap-6 mt-10">
          ${K.Button({ label:'Tutanağı aç', size:'sm', act:'go', data:{ 'data-route':'meeting' } })}
          ${K.Button({ label:'Kararı uygula', size:'sm', tone:'primary', act:'go',
            data:{ 'data-route':m.action.route || 'today' } })}
        </div>`,
    });
  }

  /* ---------- ayar sayfasi (sheet) ---------- */

  function providerForm(providerId){
    const st = O.settings();
    const p = R.PROVIDERS[providerId];
    const models = p.models || [];
    const current = providerId === st.provider ? st.model : (models[0] ? models[0].id : '');

    return K.Stack([
      K.Notice({ tone:'info', body:p.note }),

      when(p.needsKey, () => K.Stack([
        K.Field({ label:'API anahtarı', hint:R.LLM.getKey(providerId) ? 'kayıtlı: ' + R.LLM.maskKey(providerId) : p.keyHint,
          input:K.Input({ id:'llm-key', type:'password', placeholder:p.keyHint,
            aria:'API anahtarı' }) }),
        html`<p class="tiny dim">Anahtar yalnız bu tarayıcıda durur; yedeğe girmez, buluta gitmez,
          modele gönderilmez. ${when(p.keyUrl, () => html`Ücretsiz anahtar:
          <a href="${p.keyUrl}" target="_blank" rel="noopener">${p.keyUrl.replace(/^https:\/\//, '')}</a>`)}</p>`,
      ], 'xs')),

      when(p.editableEndpoint, () => K.Field({ label:'Uç adresi',
        hint:'OpenAI uyumlu /chat/completions',
        input:K.Input({ id:'llm-endpoint', value:st.endpoint || '',
          placeholder:'http://localhost:11434/v1/chat/completions' }) })),

      when(models.length, () => K.Field({ label:'Varsayılan model',
        input:K.Select({ id:'llm-model', value:current,
          options:models.map(m => ({ value:m.id, label:m.label + (m.strength ? ' · ' + m.strength : '') })) }) })),

      K.Field({ label:'Model kimliğini elle yaz', hint:'liste eskiyse doldur, boş bırakırsan yukarıdaki seçilir',
        input:K.Input({ id:'llm-model-custom', placeholder:'ör. deepseek/deepseek-chat-v3-0324:free' }) }),

      K.Checkbox({ label:'Model düşerse yedeğe geç (önerilir)', checked:st.fallback !== false,
        act:'office-toggle-fallback' }),

      html`<div id="llm-test" class="mt-8"></div>`,
    ]);
  }

  function openSettings(providerId){
    const st = O.settings();
    const pid = providerId || st.provider || 'builtin';

    UI.sheet({
      title:'Ofis ayarları',
      subtitle:'Ajanların kullandığı model — ücretsiz sağlayıcılar desteklenir',
      wide:true,
      body:String(K.Stack([
        K.Field({ label:'Sağlayıcı', input:K.Select({ id:'llm-provider', change:'office-provider',
          value:pid,
          options:R.PROVIDER_ORDER.map(id => ({ value:id,
            label:R.PROVIDERS[id].label + (R.PROVIDERS[id].free ? ' · ücretsiz' : '') })) }) }),
        html`<div id="llm-form">${providerForm(pid)}</div>`,
        K.Collapsible({ title:'Ajan başına model', meta:'isteğe bağlı', act:'office-peragent',
          open:!!S.ui.officePerAgent,
          body:html`<div class="stack-sm">
            <p class="small muted">Boş bırakılan ajan ofis varsayılanını kullanır.
              Toplantıda Patron’a daha güçlü, uzmanlara daha hızlı model verebilirsin.</p>
            ${map(R.AGENTS, a => K.Field({ label:a.name + ' · ' + a.role,
              input:K.Input({ id:'llm-agent-' + a.id,
                value:(st.perAgent && st.perAgent[a.id] && st.perAgent[a.id].model) || '',
                placeholder:'ofis varsayılanı' }) }))}
          </div>` }),
      ])),
      footer:String(html`
        ${K.Button({ label:'Bağlantıyı dene', icon:'refresh', act:'office-test' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'office-save' })}`),
    });
  }

  /* ---------- ekran ---------- */

  async function render(){
    O.resetBriefs();
    const specialists = R.AGENTS.filter(a => !a.lead);

    return String(K.Grid([
      K.Span(8, K.Stack([
        BossCard(),
        K.SectionTitle('Uzman masaları'),
        html`<div class="desks">${map(specialists, Desk)}</div>`,
      ])),
      K.Span(4, K.Stack([
        modeCard(),
        lastMeetingCard(),
        raw(UI.rail(['ai-coach', 'next-action', 'median'])),
      ])),
    ]));
  }

  /* ---------- eylemler ---------- */

  const handle = {
    async 'office-desk'(el){
      const id = el.dataset.agent;
      S.ui.officeDesk = S.ui.officeDesk === id ? null : id;
      R.App.render();
    },

    async 'office-talk'(el){
      S.ui.officeAgent = el.dataset.agent;
      R.App.go('team');
    },

    async 'office-meet'(){
      S.ui.meetingAuto = true;
      R.App.go('meeting');
    },

    async 'office-settings'(el){
      openSettings(el && el.dataset ? el.dataset.provider : null);
    },

    async 'office-peragent'(){
      S.ui.officePerAgent = !S.ui.officePerAgent;
      openSettings(document.getElementById('llm-provider') ? document.getElementById('llm-provider').value : null);
    },

    async 'office-toggle-fallback'(el){
      await O.saveSettings({ fallback:!!el.checked });
    },

    async 'office-test'(el){
      const out = document.getElementById('llm-test');
      const cfg = readForm();
      if(!cfg) return;
      if(cfg.key) R.LLM.setKey(cfg.provider, cfg.key);
      el.disabled = true;
      if(out) out.innerHTML = String(K.Notice({ tone:'info', body:'Deneniyor…' }));
      try{
        const res = await R.LLM.test({ provider:cfg.provider, model:cfg.model, endpoint:cfg.endpoint });
        if(out) out.innerHTML = String(K.Notice({ tone:'ok', title:'Bağlantı çalışıyor.',
          body:res.model + ' · ' + res.ms + ' ms · yanıt: ' + res.text }));
      }catch(err){
        if(out) out.innerHTML = String(K.Notice({ tone:'danger', title:'Bağlanamadı.',
          body:R.LLM.errorText(err && err.code) + (err && err.message && err.code !== err.message
            ? ' (' + String(err.message).slice(0, 120) + ')' : '') }));
      }finally{
        el.disabled = false;
      }
    },

    async 'office-save'(){
      const cfg = readForm();
      if(!cfg) return;
      if(cfg.key) R.LLM.setKey(cfg.provider, cfg.key);

      const perAgent = {};
      R.AGENTS.forEach(a => {
        const el = document.getElementById('llm-agent-' + a.id);
        const v = el ? el.value.trim() : '';
        if(v) perAgent[a.id] = { provider:cfg.provider, model:v, endpoint:cfg.endpoint };
      });

      await O.saveSettings({
        provider:cfg.provider, model:cfg.model, endpoint:cfg.endpoint, perAgent,
      });
      UI.closeSheet();
      UI.toast(O.mode() === 'llm' ? 'Ofis modeli bağlandı' : 'Ayarlar kaydedildi');
      R.App.render();
    },
  };

  /* Sheet icindeki alanlari tek yerden okur. */
  function readForm(){
    const provider = (document.getElementById('llm-provider') || {}).value;
    if(!provider || !R.PROVIDERS[provider]){ UI.toast('Sağlayıcı seçilmedi'); return null; }
    const p = R.PROVIDERS[provider];
    const keyEl = document.getElementById('llm-key');
    const custom = (document.getElementById('llm-model-custom') || {}).value;
    const picked = (document.getElementById('llm-model') || {}).value;
    const endpointEl = document.getElementById('llm-endpoint');
    const model = (custom && custom.trim()) || picked || (p.models[0] ? p.models[0].id : '');
    return {
      provider,
      model,
      endpoint:endpointEl ? endpointEl.value.trim() : (O.settings().endpoint || ''),
      key:keyEl ? keyEl.value.trim() : '',
    };
  }

  const change = {
    async 'office-provider'(el){
      const form = document.getElementById('llm-form');
      if(form) form.innerHTML = String(providerForm(el.value));
    },
  };

  return {
    id:'office',
    title:'Ofis',
    subtitle(){
      const m = O.mode();
      const n = O.meetings().length;
      return (m === 'llm' ? O.providerLabel() : 'kural motoru modu')
        + ' · 5 ajan' + (n ? ' · ' + n + ' toplantı' : '');
    },
    actions(){
      return String(K.Button({ label:'Ayarlar', icon:'gear', size:'sm', act:'office-settings' }));
    },
    render, handle, change, openSettings,
  };
})();
