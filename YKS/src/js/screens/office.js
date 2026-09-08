/* Ofis — bes ajanin masasi, gunun karari, kota panosu ve model ayarlari.

   Yazim bicimi: STIL.md / DONUSTURME.md. String birlestirme yok,
   etkilesim yalniz data-act / data-change ile baglanir. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.office = (function(){
  const U = R.U, UI = R.UI, S = R.S;
  const { html, raw, when, map, cls } = R.h;
  const K = R.C;
  const O = R.Office;

  /* ---------- parcalar ---------- */

  function Avatar(agent, size){
    return html`<span class="${cls('agentav', 'agentav--' + agent.id, size === 'sm' && 'agentav--sm')}"
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
        <b class="${cls('deskstat__value num', m.tone && m.tone !== 'muted' && 'is-' + m.tone)}">${m.value}</b>
        ${when(m.note, () => html`<span class="deskstat__note">${m.note}</span>`)}
      </div>`)}</div>`;
  }

  /* Masanin durum satiri — ofis hissini veren sey: herkesin ne yaptigi belli. */
  function deskStatus(agent){
    const q = O.agentQuota(agent.id);
    if(O.mode() !== 'llm') return { text:'kural motoruyla çalışıyor', tone:'muted' };
    if(q && q.full) return { text:'günlük hakkı doldu', tone:'danger' };
    if(q && q.waitMs > 1500) return { text:'sırada · ' + Math.ceil(q.waitMs/1000) + ' sn', tone:'warn' };
    return { text:'masasında, müsait', tone:'ok' };
  }

  function Desk(agent){
    const b = O.brief(agent.id);
    const open = S.ui.officeDesk === agent.id;
    const st = deskStatus(agent);
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

        <div class="${'deskstate deskstate--' + st.tone}">
          <span class="deskstate__dot"></span>${st.text}
        </div>

        <p class="desk__line">${b.headline}</p>
        ${deskMetrics(b)}

        ${when(open, () => html`
          <div class="desk__open">
            <div class="stack-xs">${map(b.findings, findingRow)}</div>
            ${when(b.suggestion, () => html`<div class="mt-10">
              ${K.Notice({ tone:'info', title:'Önerisi:', body:b.suggestion.text })}</div>`)}
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

  /* Ofis panosu — girişte asılı tahta: hangi gün, kaç gün kaldı, ekip ne durumda. */
  function boardCard(){
    const n = M().currentWeek();
    const daysLeft = U.diffDays(U.todayISO(), R.PLAN.examTytISO);
    const meetings = O.meetings().length;
    const open = O.openDecisions().length;

    return K.Card({
      class:'board',
      body:html`
        <div class="board__row">
          <div class="board__cell">
            <span class="board__label">Bugün</span>
            <b class="board__value">${U.fmtShort(U.today())}</b>
            <span class="board__note">hafta ${n}/${R.PLAN.totalWeeks}</span>
          </div>
          <div class="board__cell">
            <span class="board__label">TYT’ye kalan</span>
            <b class="board__value num">${daysLeft}</b>
            <span class="board__note">gün (tahmin)</span>
          </div>
          <div class="board__cell">
            <span class="board__label">Toplantı</span>
            <b class="board__value num">${meetings}</b>
            <span class="board__note">${meetings ? 'tutanak arşivde' : 'henüz yapılmadı'}</span>
          </div>
          <div class="board__cell">
            <span class="board__label">Açık karar</span>
            <b class="${cls('board__value num', open && 'is-warn')}">${open}</b>
            <span class="board__note">${open ? 'takipte' : 'temiz'}</span>
          </div>
        </div>`,
    });
  }

  function M(){ return R.Model; }

  /* Patron karti — gunun tek isini gosterir, digerlerinden ayrilir. */
  function BossCard(){
    const b = O.brief('patron');
    const action = O.nextAction();
    const patron = R.AGENT_BY_ID.patron;

    return K.Card({
      class:'card--primary',
      body:html`
        <div class="desk__head">
          ${Avatar(patron)}
          <div class="minw0">
            <b class="desk__name">Patron’un masası</b>
            <span class="desk__role">Dört uzmanın raporunu birleştirir; günün tek işini o söyler</span>
          </div>
          ${K.Badge({ label:O.mode() === 'llm' ? 'model bağlı' : 'kural motoru',
            tone:O.mode() === 'llm' ? 'ok' : 'info' })}
        </div>

        <div class="mt-12">
          ${K.NextUp({ icon:action.icon || 'zap', label:action.label || 'Sıradaki iş',
            title:action.title, why:action.why, hint:'next-action',
            action:K.Button({ label:'Şimdi yap', tone:'primary', size:'sm', act:'go',
              data:{ 'data-route':action.route || 'today' } }) })}
        </div>

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

  /* Takipteki kararlar — ofisi "gercek" yapan sey: verilen karar unutulmaz. */
  function decisionsCard(){
    const open = O.openDecisions();
    if(!open.length) return '';
    return K.Card({
      title:'Takipteki kararlar', sub:'Toplantıda verildi, henüz kapanmadı',
      badge:K.Badge({ label:String(open.length), tone:'warn' }),
      body:html`<div class="stack-sm">${map(open, d => html`
        <div class="decisionrow">
          <div class="minw0">
            <b class="small">${d.title}</b>
            <span class="tiny dim">${U.relativeDay(d.at.slice(0, 10))} · ${d.topic}</span>
          </div>
          <div class="row gap-6">
            ${K.Button({ label:'Yapıldı', size:'sm', tone:'primary', act:'office-decision',
              data:{ 'data-id':d.id, 'data-state':'done' } })}
            ${K.Button({ label:'Devret', size:'sm', tone:'ghost', act:'office-decision',
              data:{ 'data-id':d.id, 'data-state':'carried' } })}
          </div>
        </div>`)}</div>`,
    });
  }

  /* ---------- model ve kota panosu ---------- */

  function quotaCard(){
    const cfg = O.agentConfig('patron');
    const q = R.Quota.status(cfg);
    const sandbox = R.LLM.inSandbox() && cfg.provider !== 'builtin';

    if(O.mode() !== 'llm'){
      return K.Card({
        title:'Ofis modeli', sub:'Ücretsiz bir model bağlayınca ajanlar konuşmaya başlar',
        actions:K.Button({ label:'Bağla', icon:'gear', size:'sm', tone:'primary', act:'office-settings' }),
        body:html`
          ${K.Notice({ tone:'info', title:'Şu an kural motoru modundasın.',
            body:'Ajanlar veriyi okuyup bulgularını yazıyor ama cümleleri sabit. '
               + 'Ücretsiz bir anahtar bağlarsan aynı bulguları kendi cümleleriyle tartışırlar.' })}
          <div class="row wrap gap-6 mt-10">
            ${map(['openrouter', 'groq', 'gemini'], id => K.Chip({ label:R.PROVIDERS[id].label,
              act:'office-settings', data:{ 'data-provider':id } }))}
          </div>`,
      });
    }

    return K.Card({
      title:'Ofis modeli', sub:O.providerLabel(),
      actions:K.Button({ label:'Ayarlar', icon:'gear', size:'sm', act:'office-settings' }),
      body:html`
        ${when(sandbox, () => K.Notice({ tone:'warn', title:'Bu ortamda dış model çalışmayabilir.',
          body:'Uygulama Claude içinde yayımlanmış bir sayfa olarak açıldığında dış API çağrıları '
             + 'engellenir. Yerleşik modeli seç ya da uygulamayı kendi tarayıcında aç.' }))}

        ${when(q.known, () => html`
          ${K.Meter({ label:'Bugün kullanılan hak', value:q.rpd ? (100 * q.usedToday / q.rpd) : 0,
            text:q.usedToday + ' / ' + q.rpd, tone:q.full ? 'danger' : (q.remainingToday < 10 ? 'warn' : ''),
            note:'dakikada en fazla ' + q.rpm + ' istek · istekler arası ' + Math.round(q.gapMs/100)/10 + ' sn' })}
          <p class="tiny dim mt-8">
            Sınır motorda uygulanıyor: istekler sıraya alınır, kota hiçbir zaman aşılmaz.
            Bir toplantı turu ${Math.round(R.Quota.estimateMs(O.agentConfig('patron'), 6)/1000)} sn sürer.
          </p>`)}
        ${when(!q.known, () => html`<p class="small muted">Bu sağlayıcı için bilinen bir istek sınırı yok;
          kota yöneticisi araya girmiyor.</p>`)}`,
    });
  }

  function lastMeetingCard(){
    const m = O.lastMeeting();
    if(!m){
      return K.Card({ title:'Son toplantı', sub:'Ekip henüz toplanmadı',
        body:K.Empty({ icon:'guide', text:'Toplantıda gündemi kural motoru seçer, uzmanlar sırayla konuşur, '
          + 'sen bitirdiğinde rapor çıkar.',
          action:K.Button({ label:'İlk toplantıyı başlat', tone:'primary', act:'office-meet' }) }) });
    }
    return K.Card({
      title:'Son toplantı', sub:U.relativeDay(m.at.slice(0, 10)) + ' · ' + m.topic,
      badge:K.Badge({ label:m.mode, tone:m.mode === 'llm' ? 'ok' : 'info' }),
      body:html`
        ${when(m.report, () => html`<p class="prose">${m.report.summary}</p>`)}
        ${when(m.action, () => K.Notice({ tone:'info', title:'Karar:', body:m.action.title }))}
        <div class="row wrap gap-6 mt-10">
          ${K.Button({ label:'Tutanağı aç', size:'sm', act:'go', data:{ 'data-route':'meeting' } })}
          ${when(m.action, () => K.Button({ label:'Kararı uygula', size:'sm', tone:'primary', act:'go',
            data:{ 'data-route':m.action.route || 'today' } }))}
        </div>`,
    });
  }

  /* ---------- ayar sayfasi ---------- */

  /* Anahtar bicimi saglayiciya gore bellidir; yanlis yapistirmayi kaydetmeden
     once yakalamak icin uyarilir (engellenmez: bicim degisebilir). */
  const KEY_SHAPES = {
    openrouter:{ re:/^sk-or-/, hint:'OpenRouter anahtarları "sk-or-" ile başlar.' },
    groq:      { re:/^gsk_/,   hint:'Groq anahtarları "gsk_" ile başlar.' },
    gemini:    { re:/^AIza/,   hint:'Google AI Studio anahtarları "AIza" ile başlar.' },
  };

  function keyWarning(providerId, value){
    const shape = KEY_SHAPES[providerId];
    if(!shape || !value) return null;
    if(shape.re.test(value)) return null;
    return shape.hint + ' Yanlış sağlayıcının anahtarını yapıştırmış olabilirsin.';
  }

  function providerForm(providerId){
    const st = O.settings();
    const p = R.PROVIDERS[providerId];
    const models = p.models || [];
    const current = providerId === st.provider ? st.model : (models[0] ? models[0].id : '');
    const hasKey = !!R.LLM.getKey(providerId);
    const lim = R.Quota.limitsFor({ provider:providerId, model:current });
    const over = R.Quota.getOverride(providerId);

    return K.Stack([
      K.Notice({ tone:'info', body:p.note }),

      /* --- 1. anahtar --- */
      when(p.needsKey, () => K.Stack([
        K.SectionTitle('1. API anahtarı'),
        when(hasKey, () => K.Notice({ tone:'ok', title:'Kayıtlı anahtar var:',
          body:html`${R.LLM.maskKey(providerId)}
            <div class="mt-8">${K.Button({ label:'Anahtarı sil', size:'sm', tone:'ghost',
              act:'office-forget', data:{ 'data-provider':providerId } })}</div>` })),
        K.Field({ label:hasKey ? 'Yeni anahtarla değiştir' : 'Anahtarı yapıştır',
          hint:p.keyHint,
          input:K.Input({ id:'llm-key', type:'password', placeholder:p.keyHint,
            aria:'API anahtarı', change:'office-key' }) }),
        html`<div id="llm-key-warn"></div>`,
        html`<p class="tiny dim">Anahtar yalnız bu tarayıcıda durur; yedeğe girmez, buluta gitmez,
          modele gönderilmez. ${when(p.keyUrl, () => html`Ücretsiz anahtar:
          <a href="${p.keyUrl}" target="_blank" rel="noopener">${p.keyUrl.replace(/^https:\/\//, '')}</a>`)}</p>`,
      ], 'sm')),

      /* --- 2. uc adresi (yalniz ozel) --- */
      when(p.editableEndpoint, () => K.Stack([
        K.SectionTitle('Uç adresi'),
        K.Field({ label:'OpenAI uyumlu /chat/completions',
          input:K.Input({ id:'llm-endpoint', value:st.endpoint || '',
            placeholder:'http://localhost:11434/v1/chat/completions' }) }),
      ], 'sm')),

      /* --- 3. model --- */
      K.Stack([
        K.SectionTitle(p.needsKey ? '2. Model' : 'Model'),
        when(models.length, () => K.Field({ label:'Listeden seç',
          input:K.Select({ id:'llm-model', value:current, change:'office-model',
            options:models.map(m => ({ value:m.id,
              label:m.label + (m.strength ? ' · ' + m.strength : '') })) }) })),
        K.Field({ label:'Ya da model kimliğini elle yaz',
          hint:'liste eskiyse doldur; boş bırakırsan yukarıdaki seçilir',
          input:K.Input({ id:'llm-model-custom', placeholder:'ör. deepseek/deepseek-chat-v3-0324:free' }) }),
      ], 'sm'),

      /* --- 4. istek siniri --- */
      when(p.needsKey, () => K.Stack([
        K.SectionTitle(p.editableEndpoint ? 'İstek sınırı' : '3. İstek sınırı'),
        html`<p class="small muted">Motor bu sınırı hiç aşmaz: istekleri sıraya alır ve aralarına
          boşluk koyar. Sınır senin hesabında farklıysa buradan düzelt.
          ${when(p.checked, () => html`<span class="tiny dim">(katalog: ${p.checked})</span>`)}</p>`,
        html`<div class="cols-2">
          ${K.Field({ label:'Dakikada istek',
            input:K.Input({ id:'llm-rpm', type:'number', min:1, numeric:true,
              value:over.rpm || (lim && lim.rpm) || '', placeholder:'—' }) })}
          ${K.Field({ label:'Günde istek',
            input:K.Input({ id:'llm-rpd', type:'number', min:1, numeric:true,
              value:over.rpd || (lim && lim.rpd) || '', placeholder:'—' }) })}
        </div>`,
        when(p.rpdChoices, () => K.Row(map(p.rpdChoices, c =>
          K.Chip({ label:c.label, act:'office-rpd', data:{ 'data-rpd':c.value } })), { wrap:true })),
      ], 'sm')),

      /* --- 5. yedek --- */
      K.Checkbox({ label:'Model düşerse yedeğe geç (önerilir)', checked:st.fallback !== false,
        act:'office-toggle-fallback' }),

      html`<div id="llm-test"></div>`,
    ]);
  }

  function openSettings(providerId){
    const st = O.settings();
    const pid = providerId || st.provider || 'builtin';
    const sandbox = R.LLM.inSandbox();

    UI.sheet({
      title:'Ofis ayarları',
      subtitle:'Ajanların kullandığı model — ücretsiz sağlayıcılar desteklenir',
      wide:true,
      body:String(K.Stack([
        when(sandbox, () => K.Notice({ tone:'warn', title:'Dikkat: bu ortam dışa kapalı olabilir.',
          body:'Uygulama Claude içinde yayımlanmış bir sayfa olarak çalışıyor. Bu ortamda dış API '
             + 'çağrıları engellenir; "Yerleşik" sağlayıcı çalışır, diğerleri çalışmayabilir. '
             + 'Ücretsiz sağlayıcıları kullanmak için uygulamayı kendi tarayıcında aç.' })),
        K.Field({ label:'Sağlayıcı', input:K.Select({ id:'llm-provider', change:'office-provider',
          value:pid,
          options:R.PROVIDER_ORDER.map(id => ({ value:id,
            label:R.PROVIDERS[id].label + (R.PROVIDERS[id].free ? ' · ücretsiz' : '') })) }) }),
        html`<div id="llm-form">${providerForm(pid)}</div>`,
        K.Collapsible({ title:'Ajan başına model', meta:'isteğe bağlı', act:'office-peragent',
          open:!!S.ui.officePerAgent,
          body:html`<div class="stack-sm">
            <p class="small muted">Boş bırakılan ajan ofis varsayılanını kullanır.
              Patron’a güçlü, uzmanlara hızlı model verebilirsin.</p>
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

  /* Sheet icindeki alanlari tek yerden okur. */
  function readForm(){
    const provider = (document.getElementById('llm-provider') || {}).value;
    if(!provider || !R.PROVIDERS[provider]){ UI.toast('Sağlayıcı seçilmedi'); return null; }
    const p = R.PROVIDERS[provider];
    const val = id => { const el = document.getElementById(id); return el ? String(el.value).trim() : ''; };
    const custom = val('llm-model-custom');
    const picked = val('llm-model');
    const model = custom || picked || (p.models[0] ? p.models[0].id : '');
    return {
      provider, model,
      endpoint:document.getElementById('llm-endpoint') ? val('llm-endpoint') : (O.settings().endpoint || ''),
      key:val('llm-key'),
      rpm:val('llm-rpm'),
      rpd:val('llm-rpd'),
    };
  }

  /* Kaydetmeden once eksigi soyler; sessizce kabul edip sonra patlamaz. */
  function validate(cfg){
    const p = R.PROVIDERS[cfg.provider];
    if(p.needsKey && !cfg.key && !R.LLM.getKey(cfg.provider)){
      return 'Bu sağlayıcı için API anahtarı gerekiyor. Ücretsiz anahtarı bağlantıdan alabilirsin.';
    }
    if(p.editableEndpoint && !cfg.endpoint){
      return 'Özel uç için adres gerekiyor (OpenAI uyumlu /chat/completions).';
    }
    if(!cfg.model) return 'Model seçilmedi. Listeden seç ya da model kimliğini elle yaz.';
    return null;
  }

  function applyForm(cfg){
    if(cfg.key) R.LLM.setKey(cfg.provider, cfg.key);
    R.Quota.setOverride(cfg.provider, { rpm:cfg.rpm, rpd:cfg.rpd });
  }

  function testOutput(node){
    const out = document.getElementById('llm-test');
    if(out) out.innerHTML = String(node);
  }

  /* ---------- ekran ---------- */

  async function render(){
    O.resetBriefs();
    const specialists = R.AGENTS.filter(a => !a.lead);

    return String(K.Grid([
      K.Span(8, K.Stack([
        boardCard(),
        BossCard(),
        decisionsCard(),
        K.SectionTitle('Uzman masaları'),
        html`<div class="desks">${map(specialists, Desk)}</div>`,
      ])),
      K.Span(4, K.Stack([
        quotaCard(),
        lastMeetingCard(),
        raw(UI.rail(['next-action', 'median', 'closure'])),
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
      const sel = document.getElementById('llm-provider');
      openSettings(sel ? sel.value : null);
    },

    async 'office-toggle-fallback'(el){
      await O.saveSettings({ fallback:!!el.checked });
    },

    async 'office-forget'(el){
      R.LLM.setKey(el.dataset.provider, '');
      UI.toast('Anahtar silindi');
      const sel = document.getElementById('llm-provider');
      const form = document.getElementById('llm-form');
      if(form && sel) form.innerHTML = String(providerForm(sel.value));
    },

    async 'office-rpd'(el){
      const input = document.getElementById('llm-rpd');
      if(input) input.value = el.dataset.rpd;
    },

    async 'office-test'(el){
      const cfg = readForm();
      if(!cfg) return;
      const problem = validate(cfg);
      if(problem){ testOutput(K.Notice({ tone:'warn', body:problem })); return; }
      applyForm(cfg);

      el.disabled = true;
      testOutput(K.Notice({ tone:'info', body:'Deneniyor… (ücretsiz modellerde 5–30 sn sürebilir)' }));
      try{
        const res = await R.LLM.test({ provider:cfg.provider, model:cfg.model, endpoint:cfg.endpoint });
        const q = R.Quota.status({ provider:cfg.provider, model:cfg.model });
        testOutput(K.Notice({ tone:'ok', title:'Bağlantı çalışıyor.',
          body:res.model + ' · ' + res.ms + ' ms'
            + (q.known ? ' · bugün ' + q.usedToday + '/' + q.rpd + ' istek kullanıldı' : '')
            + ' · yanıt: “' + res.text + '”' }));
      }catch(err){
        const code = err && err.code;
        const detail = (err && err.message && err.message !== code)
          ? String(err.message).slice(0, 160) : '';
        testOutput(K.Notice({ tone:'danger', title:'Bağlanamadı.',
          body:html`${R.LLM.errorText(code)}
            ${when(detail, () => html`<span class="tiny dim"> — sağlayıcının yanıtı: ${detail}</span>`)}` }));
      }finally{
        el.disabled = false;
      }
    },

    async 'office-save'(){
      const cfg = readForm();
      if(!cfg) return;
      const problem = validate(cfg);
      if(problem){ testOutput(K.Notice({ tone:'warn', body:problem })); return; }
      applyForm(cfg);

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

    async 'office-decision'(el){
      await O.closeDecision(el.dataset.id, el.dataset.state);
      UI.toast(el.dataset.state === 'done' ? 'Karar kapandı' : 'Karar devredildi');
      R.App.render();
    },
  };

  const change = {
    async 'office-provider'(el){
      const form = document.getElementById('llm-form');
      if(form) form.innerHTML = String(providerForm(el.value));
      testOutput('');
    },
    async 'office-key'(el){
      const sel = document.getElementById('llm-provider');
      const warn = keyWarning(sel ? sel.value : '', el.value.trim());
      const box = document.getElementById('llm-key-warn');
      if(box) box.innerHTML = warn ? String(K.Notice({ tone:'warn', body:warn })) : '';
    },
    async 'office-model'(el){
      const custom = document.getElementById('llm-model-custom');
      if(custom) custom.value = '';
      const sel = document.getElementById('llm-provider');
      const lim = R.Quota.limitsFor({ provider:sel ? sel.value : '', model:el.value });
      const rpm = document.getElementById('llm-rpm');
      const rpd = document.getElementById('llm-rpd');
      const over = R.Quota.getOverride(sel ? sel.value : '');
      if(rpm && !over.rpm) rpm.value = (lim && lim.rpm) || '';
      if(rpd && !over.rpd) rpd.value = (lim && lim.rpd) || '';
    },
  };

  return {
    id:'office',
    title:'Ofis',
    subtitle(){
      const m = O.mode();
      const open = O.openDecisions().length;
      return (m === 'llm' ? O.providerLabel() : 'kural motoru modu')
        + ' · 5 ajan' + (open ? ' · ' + open + ' açık karar' : '');
    },
    actions(){
      return String(K.Button({ label:'Ayarlar', icon:'gear', size:'sm', act:'office-settings' }));
    },
    render, handle, change, openSettings,
  };
})();
