/* Toplanti odasi — ajanlarin birbiriyle konustugu yer.

   Akis: Patron gundemi acar → uzmanlar TUR TUR konusur (durum → fikir →
   itiraz → toparlama → serbest) → toplantiyi SEN bitirirsin → rapor cikar.

   Konusmalar ard arda degil SIRAYLA akar: her tur bir model cagrisidir ve
   kota yoneticisi aralarina bosluk koyar, boylece dakikalik sinir asilmaz.
   Gundemi ve karari kural motoru belirler; ajanlar yalnizca gerekcelendirir. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.meeting = (function(){
  const U = R.U, UI = R.UI, S = R.S;
  const { html, raw, when, map, cls } = R.h;
  const K = R.C;
  const O = R.Office;

  /* Canli oturum durumu — ekranda tutulur, kaydedilmez. */
  let session = null;
  let running = false;
  let stopAsked = false;
  let turnIndex = 0;
  let controller = null;
  let closed = null;       // biten toplantinin kaydi
  let waitTimer = null;

  const PER_ROUND = R.MEETING_ORDER.length;
  function maxRounds(){ return O.maxRounds(); }
  function maxTurns(){ return maxRounds() * PER_ROUND; }

  /* ---------- parcalar ---------- */

  function Avatar(agent){
    return html`<span class="${cls('agentav', 'agentav--' + agent.id, 'agentav--sm')}"
      aria-hidden="true">${agent.initial}</span>`;
  }

  function Turn(t){
    if(t.agent === 'aday'){
      return html`
        <div class="meetturn meetturn--me">
          <div class="meetturn__who"><b>Sen</b><span class="dim">söz aldın</span></div>
          <div class="meetturn__body">${raw(U.esc(t.text).replace(/\n/g, '<br/>'))}</div>
        </div>`;
    }
    const agent = R.AGENT_BY_ID[t.agent] || R.AGENT_BY_ID.patron;
    return html`
      <div class="${cls('meetturn', t.closing && 'meetturn--closing')}">
        <div class="meetturn__who">
          ${Avatar(agent)}<b>${agent.name}</b><span class="dim">${agent.role}</span>
          ${when(t.roundTitle, () => html`<span class="meetturn__round">${t.roundTitle}</span>`)}
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
    const agent = R.AGENT_BY_ID[agentId] || R.AGENT_BY_ID.patron;
    return html`
      <div class="meetturn is-live">
        <div class="meetturn__who">${Avatar(agent)}<b>${agent.name}</b>
          <span class="dim">${agent.role}</span></div>
        <div class="meetturn__body dim" id="meet-stream">${label}</div>
      </div>`;
  }

  /* ---------- gundem ---------- */

  function agendaCard(){
    if(session || closed) return '';
    const list = O.agendaCandidates().slice(0, 5);
    const picked = list[U.clamp(S.ui.meetingAgenda || 0, 0, list.length - 1)] || list[0];
    const q = O.agentQuota('patron');
    const roundMs = O.roundEstimateMs('patron');

    return K.Card({
      title:'Gündem', sub:'Kural motoru en yüksek öncelikli başlığı seçti',
      badge:K.Badge({ label:O.mode() === 'llm' ? 'model bağlı' : 'kural motoru',
        tone:O.mode() === 'llm' ? 'ok' : 'info' }),
      body:html`
        ${K.Notice({ tone:'info', title:picked.topic + '.', body:picked.why })}

        ${(function(){
          const d = O.pendingDecision();
          return when(d, () => html`<div class="mt-10">
            ${K.Notice({ tone:'warn', title:'Geçen toplantının kararı hâlâ açık:',
              body:d.title + ' — Patron toplantıyı bunun hesabını sorarak açacak.' })}
          </div>`);
        })()}

        ${when(list.length > 1, () => html`<div class="mt-10">
          ${K.Field({ label:'Başka bir gündemle topla',
            input:K.Select({ id:'meet-agenda', change:'meet-agenda',
              value:String(S.ui.meetingAgenda || 0),
              options:list.map((c, i) => ({ value:String(i), label:c.topic })) }) })}
        </div>`)}

        <div class="row wrap gap-6 mt-12">
          ${K.Button({ label:'Toplantıyı başlat', icon:'zap', tone:'primary', act:'meet-start' })}
          ${K.Button({ label:'Ofise dön', size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'office' } })}
        </div>

        <div class="meetplan mt-12">
          <b class="small">Nasıl işleyecek?</b>
          <ol class="meetplan__list">
            ${map(R.Office.ROUNDS.slice(0, maxRounds()), (r, i) =>
              html`<li><b>${i+1}. ${r.title}</b> — dört uzman sırayla konuşur</li>`)}
          </ol>
          <p class="tiny dim">Toplantıyı <b>sen</b> bitirirsin; istediğin turda “Bitir ve rapor al”a bas.
            Araya girip söz de alabilirsin.
            ${when(roundMs > 0, () => html`Bir tur yaklaşık
              ${Math.round(roundMs/1000)} sn sürer — istekler kotayı aşmamak için sıraya alınır.`)}
            ${when(q && q.known, () => html`Bugünkü hak: ${q.usedToday}/${q.rpd} istek kullanıldı.`)}
            ${when(O.mode() !== 'llm', () => html`Model bağlı olmadığı için toplantı
              ${maxRounds()} turda durur: ajanların elinde yalnızca kural motorunun raporu var,
              sonrasında söyleyecek yeni bir şeyleri olmaz.`)}
          </p>
        </div>`,
    });
  }

  /* ---------- canli toplanti ---------- */

  function controls(){
    const round = session ? Math.min(maxRounds(), Math.floor(turnIndex / PER_ROUND) + 1) : 0;
    return html`
      <div class="meetbar">
        <div class="meetbar__state">
          ${when(running, () => html`<span class="meetbar__live"></span>`)}
          <b>${running ? 'Tur ' + round + '/' + maxRounds() : 'Toplantı duraklatıldı'}</b>
          <span class="dim">${session ? session.turns.length + ' konuşma' : ''}</span>
        </div>
        <div class="row wrap gap-6">
          ${K.Button({ label:'Söz al', icon:'edit', size:'sm', act:'meet-say' })}
          ${when(running, () => K.Button({ label:'Duraklat', size:'sm', tone:'ghost', act:'meet-pause' }))}
          ${when(!running && session,
            () => K.Button({ label:'Devam et', size:'sm', act:'meet-resume' }))}
          ${K.Button({ label:'Bitir ve rapor al', size:'sm', tone:'primary', act:'meet-finish' })}
        </div>
      </div>`;
  }

  function liveCard(){
    if(!session) return '';
    return K.Card({
      title:'Toplantı sürüyor', sub:session.topic,
      body:html`
        ${controls()}
        <div class="meet mt-12" id="meet-live">
          <div id="meet-turns">${map(session.turns, Turn)}</div>
          <div id="meet-pending"></div>
        </div>
        <div id="meet-say-box"></div>`,
    });
  }

  /* ---------- rapor ---------- */

  function reportCard(m){
    if(!m) return '';
    const r = m.report || {};
    return K.Card({
      class:'card--primary',
      title:'Toplantı raporu',
      sub:U.relativeDay(m.at.slice(0, 10)) + ' · ' + m.topic + ' · ' + m.rounds + ' tur',
      actions:K.Button({ label:'Kopyala', icon:'edit', size:'sm', act:'meet-copy',
        data:{ 'data-id':m.id } }),
      body:html`
        ${when(r.summary, () => html`<p class="prose">${r.summary}</p>`)}

        <div class="mt-12">
          ${K.NextUp({ icon:'zap', label:'Karar', title:m.action.title, why:m.action.why,
            action:K.Button({ label:'Şimdi yap', tone:'primary', size:'sm', act:'go',
              data:{ 'data-route':m.action.route || 'today' } }) })}
        </div>

        <div class="mt-12">${K.SectionTitle('Kim ne dedi')}</div>
        <div class="stack-sm">${map(Object.keys(r.byAgent || {}), id => {
          const a = r.byAgent[id];
          const agent = R.AGENT_BY_ID[id];
          return html`<div class="reportrow">
            <div class="meetturn__who">${when(agent, () => Avatar(agent))}
              <b>${a.name}</b><span class="dim">${a.role}</span></div>
            <ul class="reportrow__list">${map(a.lines, l =>
              html`<li><span class="dim">${l.roundTitle}:</span> ${l.text}</li>`)}</ul>
          </div>`;
        })}</div>

        ${when((r.userSaid || []).length, () => html`<div class="mt-12">
          ${K.Notice({ tone:'info', title:'Senin sözlerin:', body:r.userSaid.join(' · ') })}</div>`)}

        ${when((r.warnings || []).length, () => html`<div class="mt-12">
          ${K.Notice({ tone:'warn', title:'Kural motoru düzeltmesi:', body:r.warnings.join(' ') })}</div>`)}

        <div class="mt-12">
          ${K.Table({ tight:true, headers:['Dayandığı veri', { label:'Değer', num:true }], rows:[
            ['Program haftası', r.basis.hafta],
            ['Plan tamamlama', r.basis.planTamamlama == null ? '—' : '%' + r.basis.planTamamlama],
            ['Konu kapanışı', '%' + r.basis.konuKapanisi],
            ['TYT medyan', r.basis.tytMedyan == null ? '—' : U.fmtNet(r.basis.tytMedyan)],
            ['Analiz borcu', r.basis.analizBorcu],
            ['Tekrar borcu', '%' + r.basis.tekrarBorcu],
          ] })}
        </div>

        <div class="row wrap gap-6 mt-12">
          ${K.Button({ label:'Kararı yapıldı işaretle', size:'sm', act:'meet-decide',
            data:{ 'data-id':m.id, 'data-state':'done' } })}
          ${K.Button({ label:'Yeni toplantı', size:'sm', tone:'ghost', act:'meet-new' })}
        </div>`,
    });
  }

  /* ---------- arsiv ---------- */

  function archiveCard(){
    const list = O.meetings();
    if(!list.length) return '';
    return K.Card({
      title:'Geçmiş toplantılar', sub:list.length + ' tutanak saklanıyor',
      body:html`<div class="stack-xs">${map(list, m => K.Collapsible({
        title:m.topic,
        meta:U.relativeDay(m.at.slice(0, 10)) + ' · ' + (m.rounds || 1) + ' tur · '
          + (m.decision && m.decision.state === 'open' ? 'karar açık' : 'karar kapandı'),
        act:'meet-open', data:{ 'data-id':m.id },
        open:S.ui.meetingOpen === m.id,
        body:html`
          ${when(m.report && m.report.summary, () => html`<p class="prose">${m.report.summary}</p>`)}
          ${K.Notice({ tone:'info', title:'Karar:', body:m.action.title })}
          <div class="meet mt-12">${map(m.turns, Turn)}</div>
          <div class="row wrap gap-6 mt-10">
            ${K.Button({ label:'Raporu kopyala', size:'sm', act:'meet-copy', data:{ 'data-id':m.id } })}
            ${K.Button({ label:'Kararı uygula', size:'sm', tone:'primary', act:'go',
              data:{ 'data-route':m.action.route || 'today' } })}
            ${K.Button({ label:'Tutanağı sil', size:'sm', tone:'ghost', act:'meet-delete',
              data:{ 'data-id':m.id } })}
          </div>`,
      }))}</div>`,
    });
  }

  function teamCard(){
    const ids = ['patron'].concat(R.MEETING_ORDER);
    return K.Card({
      title:'Masadakiler', sub:'Patron açar, uzmanlar tur tur konuşur, sen bitirirsin',
      body:html`<div class="stack-xs">${map(ids, id => {
        const a = R.AGENT_BY_ID[id];
        const q = O.agentQuota(id);
        return html`<button class="agentrow" data-act="meet-talk" data-agent="${a.id}">
          ${Avatar(a)}
          <span class="minw0"><b class="small">${a.name}</b>
            <span class="tiny dim">${a.desk}</span></span>
          ${when(q && q.full, () => K.Badge({ label:'kota', tone:'danger' }))}
        </button>`;
      })}</div>`,
    });
  }

  /* ---------- ekran ---------- */

  async function render(){
    O.resetBriefs();
    return String(K.Grid([
      K.Span(8, K.Stack([
        agendaCard(),
        liveCard(),
        when(!session && closed, () => reportCard(closed)),
        archiveCard(),
      ])),
      K.Span(4, K.Stack([
        teamCard(),
        raw(UI.rail(['next-action', 'gate'])),
      ])),
    ]));
  }

  /* ---------- yurutme ---------- */

  function paint(){
    const box = document.getElementById('meet-turns');
    if(box && session) box.innerHTML = String(map(session.turns, Turn));
    scrollToLive();
  }

  function setPending(node){
    const box = document.getElementById('meet-pending');
    if(box) box.innerHTML = node ? String(node) : '';
  }

  function scrollToLive(){
    const el = document.getElementById('meet-pending') || document.getElementById('meet-turns');
    if(el && el.scrollIntoView) el.scrollIntoView({ block:'nearest' });
  }

  /* Kota sirasi beklenirken geri sayim gosterilir; bekleme gizlenmez. */
  function showWait(agentId, ms){
    clearInterval(waitTimer);
    let left = Math.ceil(ms/1000);
    const tick = () => {
      setPending(pendingTurn(agentId, 'Sırasını bekliyor — ' + left + ' sn '
        + '(istek sınırı aşılmasın diye)'));
      if(--left < 0) clearInterval(waitTimer);
    };
    tick();
    waitTimer = setInterval(tick, 1000);
  }

  function stopWait(){ clearInterval(waitTimer); waitTimer = null; }

  function pause(ms){ return new Promise(r => setTimeout(r, ms)); }

  async function loop(){
    while(running && !stopAsked && turnIndex < maxTurns()){
      const agentId = O.speakerAt(turnIndex);

      /* Kota doluysa toplanti kendiliginden durur ve nedeni soylenir. */
      const q = O.agentQuota(agentId);
      if(q && q.full){
        running = false;
        stopWait();
        setPending('');
        UI.toast(R.AGENT_BY_ID[agentId].name + ' için günlük hak doldu — toplantı duraklatıldı');
        await R.App.render();
        return;
      }

      setPending(pendingTurn(agentId, 'Söz alıyor…'));
      try{
        await O.nextTurn(session, turnIndex, {
          signal:controller.signal,
          onWait(ms){ showWait(agentId, ms); },
          onText(ev){
            stopWait();
            const el = document.getElementById('meet-stream');
            if(!el) return;
            el.classList.remove('dim');
            el.innerHTML = U.esc(ev.text).replace(/\n/g, '<br/>');
            scrollToLive();
          },
        });
      }catch(err){
        stopWait();
        if(err && err.code === 'cancelled') return;
        UI.toast(R.LLM.errorText(err && err.code));
        running = false;
        setPending('');
        await R.App.render();
        return;
      }
      stopWait();
      turnIndex++;
      paint();
      setPending('');
      await R.App.render();

      /* Model yokken kota bosluğu da yoktur: turlar goz acip kapayana kadar
         akar ve okunmaz. Konusmanin okunabilir bir ritmi olsun diye kisa
         bir duraklama konur. */
      if(O.mode() !== 'llm' && running && !stopAsked) await pause(700);
    }

    /* Turlar bittiyse kullaniciya soyle; kapatmayi yine o secsin. */
    if(running && turnIndex >= maxTurns()){
      running = false;
      UI.toast('Bütün turlar tamamlandı — bitirip raporu alabilirsin');
      await R.App.render();
    }
  }

  async function start(){
    const list = O.agendaCandidates().slice(0, 5);
    const picked = list[U.clamp(S.ui.meetingAgenda || 0, 0, list.length - 1)] || list[0];

    closed = null;
    stopAsked = false;
    turnIndex = 0;
    controller = new AbortController();
    running = true;

    try{
      session = await O.openMeeting({ agenda:picked, signal:controller.signal });
    }catch(err){
      running = false;
      if(!(err && err.code === 'cancelled')) UI.toast(R.LLM.errorText(err && err.code));
      await R.App.render();
      return;
    }
    await R.App.render();
    await loop();
  }

  async function finish(){
    stopAsked = true;
    running = false;
    stopWait();
    if(!session) return;

    setPending(pendingTurn('patron', 'Kararı ve raporu yazıyor…'));
    try{
      closed = await O.closeMeeting(session, {
        signal:controller ? controller.signal : null,
        onText(ev){
          const el = document.getElementById('meet-stream');
          if(!el) return;
          el.classList.remove('dim');
          el.innerHTML = U.esc(ev.text).replace(/\n/g, '<br/>');
        },
      });
    }catch(err){
      if(!(err && err.code === 'cancelled')) UI.toast(R.LLM.errorText(err && err.code));
    }finally{
      session = null;
      controller = null;
      await R.App.render();
    }
  }

  /* ---------- eylemler ---------- */

  const handle = {
    async 'meet-start'(){ if(!running && !session) await start(); },

    async 'meet-pause'(){
      running = false;
      stopWait();
      if(controller) controller.abort();
      controller = new AbortController();
      setPending('');
      await R.App.render();
    },

    async 'meet-resume'(){
      if(running || !session) return;
      running = true;
      stopAsked = false;
      controller = new AbortController();
      await R.App.render();
      await loop();
    },

    async 'meet-finish'(){
      if(!session) return;
      if(running){
        running = false;
        if(controller) controller.abort();
        controller = new AbortController();
      }
      await finish();
    },

    /* Kullanici araya girer: sozu tutanaga girer, sonraki ajanlar gorur. */
    async 'meet-say'(){
      if(!session) return;
      const box = document.getElementById('meet-say-box');
      if(!box) return;
      box.innerHTML = String(html`
        <div class="composer mt-12">
          ${K.Textarea({ id:'meet-say-input', rows:2, class:'composer__input',
            placeholder:'Ekibe söylemek istediğin…' })}
          ${K.Button({ label:'Söyle', icon:'zap', tone:'primary', act:'meet-say-send' })}
        </div>`);
      const el = document.getElementById('meet-say-input');
      if(el) el.focus();
    },

    async 'meet-say-send'(){
      const el = document.getElementById('meet-say-input');
      const text = el ? el.value.trim() : '';
      const box = document.getElementById('meet-say-box');
      if(box) box.innerHTML = '';
      if(!text || !session) return;
      O.userTurn(session, text);
      paint();
      await R.App.render();
    },

    async 'meet-new'(){
      closed = null;
      session = null;
      turnIndex = 0;
      await R.App.render();
    },

    async 'meet-open'(el){
      const id = el.dataset.id;
      S.ui.meetingOpen = S.ui.meetingOpen === id ? null : id;
      R.App.render();
    },

    async 'meet-copy'(el){
      const m = O.meetings().find(x => x.id === el.dataset.id) || closed;
      if(!m) return;
      const text = O.reportText(m);
      try{
        await navigator.clipboard.writeText(text);
        UI.toast('Rapor kopyalandı');
      }catch(e){
        UI.sheet({ title:'Toplantı raporu', wide:true,
          body:String(html`<textarea class="textarea coachnote" rows="18" readonly>${text}</textarea>`),
          footer:String(K.Button({ label:'Kapat', act:'sheet-close' })) });
      }
    },

    async 'meet-decide'(el){
      await O.closeDecision(el.dataset.id, el.dataset.state);
      UI.toast('Karar kapandı');
      R.App.render();
    },

    async 'meet-delete'(el){
      const id = el.dataset.id;
      UI.confirmSheet('Tutanağı sil', 'Bu toplantı kaydı ve raporu silinecek. Çalışma verilerin etkilenmez.',
        async () => {
          await O.deleteMeeting(id);
          if(closed && closed.id === id) closed = null;
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
    if(S.ui.meetingAuto && !running && !session){
      S.ui.meetingAuto = false;
      setTimeout(start, 60);
    }
  }

  return {
    id:'meeting',
    title:'Toplantı odası',
    subtitle(){
      if(session){
        const round = Math.min(maxRounds(), Math.floor(turnIndex / PER_ROUND) + 1);
        return (running ? 'Sürüyor' : 'Duraklatıldı') + ' · tur ' + round + '/' + maxRounds()
          + ' · ' + session.turns.length + ' konuşma';
      }
      const last = O.lastMeeting();
      return last ? 'Son toplantı ' + U.relativeDay(last.at.slice(0, 10)) + ' · ' + last.topic
        : 'Ekip 5 kişi · gündemi kural motoru seçer, bitişi sen';
    },
    actions(){
      return String(K.Button({ label:'Ofis', icon:'guide', size:'sm', act:'go',
        data:{ 'data-route':'office' } }));
    },
    render, handle, change, afterRender,
    isRunning(){ return running; },
  };
})();
