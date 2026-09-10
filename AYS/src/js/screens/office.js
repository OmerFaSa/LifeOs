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
  /* short: kat planındaki dar masa için — orada uzun metin kırpılıyordu. */
  function deskStatus(agent){
    const q = O.agentQuota(agent.id);
    if(O.mode() !== 'llm'){
      return { text:'kural motoruyla çalışıyor', short:'kural motoru', tone:'muted' };
    }
    if(q && q.full) return { text:'günlük hakkı doldu', short:'hak doldu', tone:'danger' };
    if(q && q.waitMs > 1500){
      const sn = Math.ceil(q.waitMs / 1000);
      return { text:'sırada · ' + sn + ' sn', short:'sırada · ' + sn + ' sn', tone:'warn' };
    }
    return { text:'masasında, müsait', short:'müsait', tone:'ok' };
  }

  function Desk(agent){
    const b = O.brief(agent.id);
    const open = S.ui.officeDesk === agent.id;
    const st = deskStatus(agent);
    const notes = O.notes(agent.id);
    const trust = R.Journal.trust(agent.id);
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

        ${when(notes.length, () => html`<div class="notes mt-10">${map(notes, n => html`
          <div class="${'note note--' + n.tone}">
            <span class="note__dot"></span>
            <span class="minw0">${n.text}</span>
            ${when(n.route, () => K.Button({ label:'Git', size:'sm', tone:'ghost', act:'go',
              data:{ 'data-route':n.route } }))}
          </div>`)}</div>`)}

        ${when(open, () => html`
          <div class="desk__open">
            <div class="stack-xs">${map(b.findings, findingRow)}</div>
            ${when(b.suggestion, () => html`<div class="mt-10">
              ${K.Notice({ tone:'info', title:'Önerisi:', body:b.suggestion.text })}</div>`)}

            ${when(b.journal && b.journal.length, () => html`
              <div class="mt-12">${K.SectionTitle('Defteri')}</div>
              <div class="stack-xs">${map(b.journal, j => html`
                <div class="finding">
                  <span class="${'finding__dot finding__dot--' + (j.tone || 'info')}"></span>
                  <span>${j.text} <span class="tiny dim">· ${j.kind}</span></span>
                </div>`)}</div>`)}

            ${when(trust.toplam, () => html`<p class="tiny dim mt-10">
              Alanına düşen ${trust.toplam} karardan ${trust.kapanan} tanesi kapandı;
              ${trust.yuzde == null ? 'henüz oran çıkmadı' : 'uygulanma oranı %' + trust.yuzde}.</p>`)}

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

  /* ---------- kat planı ----------
     Ofisi "panel" olmaktan çıkaran katman. Beş masa bir zemin üzerinde
     durur: kimin ışığı yanıyor, kimin masasında iş birikmiş, kim şu an
     konuşuyor — bakınca anlaşılır. Tıklayınca o masanın raporu açılır. */

  function seat(agent){
    const st = deskStatus(agent);
    const notes = O.notes(agent.id);
    const open = S.ui.officeDesk === agent.id;
    const busy = S.ui.officeBusy === agent.id;
    const load = Math.min(notes.length, 4);

    return html`<button type="button"
      class="${cls('seat', 'seat--' + agent.id, open && 'is-open')}"
      data-act="office-desk" data-agent="${agent.id}"
      aria-expanded="${open ? 'true' : 'false'}">
      ${Avatar(agent)}
      <span class="seat__body">
        <span class="seat__name">${agent.name}</span>
        <span class="seat__role">${agent.role}</span>
        <span class="seat__state">
          <i class="${cls('seatlight', busy ? 'seatlight--busy' : 'seatlight--' + st.tone)}"></i>
          <span>${busy ? 'konuşuyor…' : (agent.lead ? st.text : st.short)}</span>
        </span>
        <span class="seat__load" aria-hidden="true">${map([0, 1, 2, 3], i =>
          html`<i class="${cls(i < load && 'is-on')}"></i>`)}</span>
        ${when(agent.lead, () => html`<span class="seat__task">Günün işi:
          <b>${O.nextAction().title}</b></span>`)}
      </span>
      ${when(notes.length, () => html`<span class="seat__count">${notes.length}</span>`)}
    </button>`;
  }

  /* ---------- 3B oda ----------
     Kat planı ofisi bir mekân yaptı; 3B görünüm onu bir ODA yapar. Masalar
     bir zeminin üstünde durur, Patron'un masası dipte karşıdadır, uzmanlar
     iki sıra hâlinde önünde oturur. Kamera döndürülebilir.

     Neden kütüphanesiz: uygulamanın hiçbir bağımlılığı yok ve tek dosyalık
     bir HTML olarak yayımlanıyor. WebGL bunun için hem ağır hem gereksiz —
     beş masalık bir oda CSS'in kendi 3B dönüşümleriyle çizilir ve düşük
     donanımda da akıcı kalır.

     Erişilebilirlik: her masa hâlâ bir <button>'dur, klavyeyle gezilir ve
     ad etiketleri kameraya karşı DÖNDÜRÜLÜR (ters dönüşüm), böylece oda
     hangi açıda olursa olsun yazı düz okunur. Hareketi azaltılmış tercihte
     geçiş animasyonu kapanır. */

  /* Kameranın zemine bakış açısı ve başlangıç dönüşü. */
  const ROOM_TILT = 56;
  const ROOM_TURN = -26;
  /* Odadaki yerler: zeminin yüzdesi. Patron dipte ortada, uzmanlar iki sıra. */
  const ROOM_SPOTS = {
    patron: { x:50, y:12 },
    tyt:    { x:20, y:42 },
    ayt:    { x:80, y:42 },
    koc:    { x:50, y:56 },
    rehber: { x:20, y:78 },
    analist:{ x:80, y:78 },
  };

  /* Kamera açısı yeniden çizimler arasında korunur: kullanıcı odayı
     çevirdikten sonra bir öneri onayladığında oda başa dönmemeli. */
  let roomTurn = ROOM_TURN;

  function desk3d(agent){
    const st = deskStatus(agent);
    const notes = O.notes(agent.id);
    const open = S.ui.officeDesk === agent.id;
    const busy = S.ui.officeBusy === agent.id;
    const spot = ROOM_SPOTS[agent.id] || { x:50, y:50 };
    /* Ad kartlari odada yan yana durur; hepsinde durum metni tasimak
       masalari gorunmez ederdi. Metin YALNIZ soylenecek bir sey varken
       cikar: her sey yolundayken isik yeter, kota dolunca ya da sira
       olusunca yazi belirir. Sessiz arayuzun bedeli bilgi kaybi degildir —
       masanin tam durumu title'da ve raporunda durur. */
    const showState = busy || (st.tone !== 'ok' && st.tone !== 'muted');

    return html`<button type="button"
      class="${cls('desk3d', 'seat--' + agent.id, open && 'is-open', agent.lead && 'desk3d--lead')}"
      style="--x:${spot.x}%; --y:${spot.y}%"
      data-act="office-desk" data-agent="${agent.id}"
      aria-expanded="${open ? 'true' : 'false'}">
      <span class="desk3d__shadow" aria-hidden="true"></span>
      <span class="desk3d__front" aria-hidden="true"></span>
      <span class="desk3d__side" aria-hidden="true"></span>
      <span class="desk3d__top" aria-hidden="true">
        <i class="desk3d__paper"></i><i class="desk3d__paper desk3d__paper--b"></i>
      </span>
      <span class="${cls('desk3d__screen', busy && 'is-busy')}" aria-hidden="true"></span>
      <span class="desk3d__chair" aria-hidden="true"></span>
      <span class="desk3d__person" aria-hidden="true"><i></i></span>
      <span class="desk3d__card" title="${agent.role} · ${busy ? 'konuşuyor' : st.text}">
        <span class="desk3d__who">${Avatar(agent, 'sm')}</span>
        <b class="desk3d__name">${agent.name}</b>
        <i class="${cls('seatlight', busy ? 'seatlight--busy' : 'seatlight--' + st.tone)}"></i>
        ${when(showState, () => html`<span class="desk3d__state">${busy ? 'konuşuyor…' : st.short}</span>`)}
        ${when(notes.length, () => html`<span class="desk3d__count">${notes.length}</span>`)}
      </span>
    </button>`;
  }

  function room3d(){
    const action = O.nextAction();
    return html`
      <div class="room3d" id="room3d">
        <div class="room3d__scene" id="room3d-scene"
          style="--turn:${roomTurn}deg; --tilt:${ROOM_TILT}deg">
          <div class="room3d__floor" aria-hidden="true"></div>
          <div class="room3d__rug" aria-hidden="true"></div>
          <div class="room3d__wall room3d__wall--back" aria-hidden="true">
            <span class="room3d__board">
              <span class="room3d__board-label">Bu haftanın tek işi</span>
              <b>${action.title}</b>
            </span>
          </div>
          <div class="room3d__wall room3d__wall--left" aria-hidden="true"></div>
          ${map(R.AGENTS, desk3d)}
        </div>
      </div>
      <p class="tiny dim mt-8">Odayı sürükleyerek çevirebilirsin; masaya dokununca raporu açılır.</p>`;
  }

  function floorPlan(){
    const specialists = R.AGENTS.filter(a => !a.lead);
    const waiting = R.Proposals.actionable().length;
    const three = O.settings().room3d !== false;

    return html`
      <div class="${cls('floor', three && 'floor--room')}">
        <div class="floor__head">
          <div class="minw0">
            <div class="floor__title">${raw(UI.icon(three ? 'cube' : 'users'))}
              ${three ? 'Ofis' : 'Ofis kat planı'}</div>
            <div class="floor__meta">${O.mode() === 'llm' ? O.providerLabel() : 'kural motoru modu'}
              · masaya dokununca raporu açılır</div>
          </div>
          <div class="row wrap gap-6">
            ${when(waiting, () => K.Badge({ label:waiting + ' öneri bekliyor', tone:'warn' }))}
            ${when(three, () => html`<span class="room3d__turn">
              ${K.IconButton({ icon:'left', size:'sm', aria:'Odayı sola çevir',
                title:'Odayı sola çevir', act:'office-turn', data:{ 'data-dir':'-1' } })}
              ${K.IconButton({ icon:'right', size:'sm', aria:'Odayı sağa çevir',
                title:'Odayı sağa çevir', act:'office-turn', data:{ 'data-dir':'1' } })}
            </span>`)}
            ${K.Button({ label:three ? 'Kat planı' : '3B görünüm', icon:three ? 'grid' : 'cube',
              size:'sm', act:'office-view' })}
            ${K.Button({ label:'Masaları tara', icon:'refresh', size:'sm', act:'office-scan' })}
          </div>
        </div>
        ${when(three, room3d)}
        ${when(!three, () => html`<div class="floor__room">
          <div class="floor__lead">${seat(R.AGENT_BY_ID.patron)}</div>
          ${map(specialists, seat)}
        </div>`)}
      </div>`;
  }

  /* ---------- onay kutusu ----------
     Ofisin sisteme dokunabildiği TEK kapı. Ne değişeceği onaydan önce
     önce/sonra olarak gösterilir; onaysız hiçbir satır uygulanmaz. */

  function diffRows(rows){
    return html`<div class="diff">${map(rows, r => html`
      <div class="diff__row">
        <span class="diff__label">${r.label}</span>
        <span class="diff__before">${r.before}</span>
        <span class="diff__arrow" aria-hidden="true">→</span>
        <span class="diff__after">${r.after}</span>
      </div>`)}</div>`;
  }

  function proposalRow(p){
    const def = R.ACTION_BY_ID[p.action];
    const agent = R.AGENT_BY_ID[p.agent];
    return html`
      <div class="${cls('prop', 'prop--' + p.agent)}">
        <div class="prop__head">
          ${Avatar(agent, 'sm')}
          <div class="prop__who">
            <b class="prop__title">${def.title}</b>
            <span class="prop__by">${agent.name} · ${def.touches}
              · ${p.source === 'llm' ? 'ajanın önerisi' : 'kural motoru buldu'}</span>
          </div>
        </div>
        <p class="prop__why">${p.reason || def.summary}</p>
        ${diffRows(p.preview.rows)}
        <div class="prop__acts">
          ${K.Button({ label:'Onayla ve uygula', icon:'check', size:'sm', tone:'primary',
            act:'office-approve', data:{ 'data-id':p.id } })}
          ${K.Button({ label:'Reddet', size:'sm', tone:'ghost',
            act:'office-reject', data:{ 'data-id':p.id } })}
          ${when(def.route, () => K.Button({ label:'Yerini gör', size:'sm', tone:'ghost',
            act:'go', data:{ 'data-route':def.route } }))}
        </div>
      </div>`;
  }

  function appliedRow(p){
    const def = R.ACTION_BY_ID[p.action];
    const agent = R.AGENT_BY_ID[p.agent];
    return html`
      <div class="prop prop--done">
        <div class="prop__head">
          ${Avatar(agent, 'sm')}
          <div class="prop__who">
            <b class="prop__title">${def.title}</b>
            <span class="prop__by">${agent.name} ·
              ${U.relativeDay(String(p.appliedAt || '').slice(0, 10))} uygulandı</span>
          </div>
          ${K.Button({ label:'Geri al', icon:'undo', size:'sm', tone:'ghost',
            act:'office-undo', data:{ 'data-id':p.id } })}
        </div>
      </div>`;
  }

  function proposalsCard(){
    const list = R.Proposals.actionable();
    const done = R.Proposals.applied().slice(-3).reverse();
    if(!list.length && !done.length) return '';

    return K.Card({
      title:'Ofisin önerileri',
      sub:'Ajanlar değişiklik önerir; uygulanıp uygulanmayacağına sen karar verirsin',
      badge:when(list.length, () => K.Badge({ label:String(list.length), tone:'warn' })),
      body:html`
        ${when(!list.length, () => K.Notice({ tone:'ok',
          title:'Bekleyen öneri yok.',
          body:'“Masaları tara” dersen ofis veriyi yeniden okur ve gerekiyorsa öneri bırakır.' }))}
        ${when(list.length, () => html`<div class="props">${map(list, proposalRow)}</div>`)}
        ${when(done.length, () => html`
          <div class="mt-12">${K.SectionTitle('Uygulananlar')}</div>
          <div class="props">${map(done, appliedRow)}</div>`)}`,
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

  /* Gunluk brifing — sabah bir kez uretilir, gun boyu onbellekten okunur. */
  function briefingCard(){
    const b = O.briefingOf();
    const notes = O.notes();
    return K.Card({
      title:'Bugünün brifingi',
      sub:b ? new Date(b.at).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })
            + ' · günde bir kez üretilir'
            : 'Patron masaları henüz özetlemedi',
      badge:when(notes.length, () => K.Badge({ label:notes.length + ' not', tone:'warn' })),
      actions:K.Button({ label:b ? 'Yenile' : 'Brifing al', icon:'refresh', size:'sm',
        act:'office-briefing' }),
      body:html`
        <div id="office-briefing">
          ${b
            ? html`<p class="prose">${b.text}</p>
                ${when(b.stale, () => html`<div class="mt-10">${K.Notice({ tone:'warn',
                  title:'Bu brifing eskidi.',
                  body:'Masalardaki notlar brifing yazıldıktan sonra değişti. '
                     + 'Aşağıdaki notlar günceldir; brifingi yenileyebilirsin.' })}</div>`)}
                ${when(b.mode === 'kural', () => html`<p class="tiny dim mt-8">
                  Kural motoru metni — model bağlı değil.</p>`)}`
            : html`<p class="small muted">${O.ruleBriefingText()}</p>`}
        </div>

        ${when(notes.length, () => html`<div class="notes mt-12">${map(notes.slice(0, 4), n => html`
          <div class="${'note note--' + n.tone}">
            <span class="note__dot"></span>
            <span class="minw0"><b class="small">${n.name}:</b> ${n.text}</span>
            ${when(n.route, () => K.Button({ label:'Git', size:'sm', tone:'ghost', act:'go',
              data:{ 'data-route':n.route } }))}
          </div>`)}</div>`)}`,
    });
  }

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
            <span class="desk__role">Uzmanların raporunu birleştirir; günün tek işini o söyler</span>
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
    const q = R.Quota.status(Object.assign({}, cfg, { keyId:0 }));
    const keyCount = R.LLM.getKeys(cfg.provider).length;
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
            ${when(keyCount > 1, () => html`${keyCount} anahtar bağlı — günlük hak ${keyCount} katı.`)}
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

  /* Anahtar bicimi artik data/providers.js'te durur ve motor okur
     (R.LLM.keyProblem). Ekran yalnizca sonucu cizer: bicim uyarisi
     ENGELLEMEZ, ama anahtar acikca BASKA bir saglayiciya aitse kaydetmek
     yalnizca 401 uretecegi icin durdurulur.

     Eski denetim Google anahtarlarinin "AIza" ile basladigini varsayiyordu;
     Google Eylul 2026'da yeni "AQ." anahtarlarina gecince o anahtari alan
     herkes kapida kaliyordu. Bicim bilgisi tek yerde tutulunca boyle bir
     degisiklik tek satirla karsilanir. */

  /* Bir anahtarin bugunku durumu — coklu anahtarda hangisinin dolduğu görünsün. */
  function keyUsage(providerId, model, index){
    const q = R.Quota.status({ provider:providerId, model, keyId:index });
    if(!q.known) return 'sınır bilinmiyor';
    return q.usedToday + '/' + q.rpd + (q.full ? ' · doldu' : '');
  }

  /* Bildirim izni — istenmeden bildirim gonderilmez. */
  function notifyRow(){
    const state = R.App.notifyState();
    if(state === 'unsupported'){
      return html`<p class="tiny dim">Bu tarayıcı bildirim desteklemiyor.</p>`;
    }
    if(state === 'granted'){
      return K.Notice({ tone:'ok', body:'Bildirim açık. Ofis acil bir not bulduğunda '
        + 'ya da karar iki gündür açık kaldığında günde en fazla bir kez haber verir.' });
    }
    if(state === 'denied'){
      return html`<p class="tiny dim">Bildirim izni reddedilmiş. Tarayıcı ayarlarından
        bu siteye izin verirsen ofis haber verebilir.</p>`;
    }
    return html`<div class="row wrap gap-6">
      ${K.Button({ label:'Bildirime izin ver', icon:'info', size:'sm', act:'office-notify' })}
      <span class="tiny dim">Ofis acil bir not bulduğunda haber verir; günde en fazla bir kez.</span>
    </div>`;
  }

  function keyWarning(providerId, value){
    const problem = R.LLM.keyProblem(providerId, value);
    if(!problem) return null;
    return K.Notice({ tone:problem.level === 'wrong' ? 'danger' : 'warn', body:problem.text });
  }

  /* ---------- model listesi ----------
     Katalog eskir; ekranda gorunen liste once canli listedir (saglayicidan
     cekilip tarayicida saklanir), o yoksa katalog tohumu. */

  function modelOptions(providerId){
    return R.LLM.modelsFor(providerId).map(m => ({
      value:m.id,
      label:(m.label || m.id) + (m.strength ? ' · ' + m.strength : ''),
    }));
  }

  function catalogNote(providerId){
    const live = R.LLM.cachedModels(providerId);
    if(!live) return 'Liste uygulamayla birlikte gelen katalogdan; ücretsiz model kimlikleri '
      + 'sık değişir. “Modelleri yenile” ile sağlayıcının güncel listesini çek.';
    return live.models.length + ' model · ' + U.relativeDay(live.at.slice(0, 10)) + ' güncellendi.';
  }

  /* ---------- sesler ----------

     "Her ajanın kendine has sesi olsun" isteğinin tam karşılığı burası.
     Otomatik dağıtım cihazdaki sesleri ajanlara paylaştırır; buradan
     kullanıcı kendi eşleştirmesini yapabilir ve DİNLEYEREK seçebilir —
     bir sesin nasıl olduğunu ad listesinden anlamak mümkün değil.

     Cihazda iyi ses yoksa bunu saklamak yerine söyleriz: sentezleyiciyi
     biz yazamayız, ama hangisinin kullanıldığını seçebilir ve durumu
     dürüstçe bildirebiliriz. */

  function voiceSection(){
    if(!R.Voice.available()){
      return K.Stack([
        K.SectionTitle('Sesler'),
        html`<p class="tiny dim">Bu tarayıcı konuşma sentezini desteklemiyor.</p>`,
      ], 'sm');
    }
    const q = R.Voice.quality();
    const list = R.Voice.voices();

    return K.Stack([
      K.SectionTitle('Sesler', K.Button({ label:'Sesleri tazele', icon:'refresh', size:'sm',
        act:'office-voices' })),

      when(!list.length, () => K.Notice({ tone:'warn', title:'Bu cihazda konuşma sesi bulunamadı.',
        body:'Toplantı sessiz akar. Chrome ya da Edge’de Türkçe ses paketi kuruluysa '
           + '“Sesleri tazele”ye bas; mobilde sistem dili ayarlarından Türkçe TTS kurulabilir.' })),

      when(list.length && !q.turkish, () => K.Notice({ tone:'warn',
        title:'Türkçe ses yok, yabancı bir sesle okunacak.',
        body:'Türkçe metin yabancı bir sesle bozuk duyulur. Cihazına Türkçe konuşma '
           + 'paketi kurarsan belirgin düzelir.' })),

      when(list.length && q.turkish && q.level === 'dusuk', () => K.Notice({ tone:'info',
        title:'Bu cihazdaki sesler temel seviyede.',
        body:'Elde olan en iyi ses seçildi ama gömülü (robotik) bir motor. Chrome’da '
           + '“Google Türkçe”, Edge’de “Natural/Neural” sesleri belirgin daha doğaldır.' })),

      when(list.length, () => html`<p class="tiny dim">${list.length} ses bulundu;
        en iyisi seçilip ajanlara dağıtıldı. Aşağıdan değiştirip dinleyebilirsin.</p>`),

      when(list.length, () => html`<div class="stack-xs">${map(R.AGENTS, a => {
        const prof = R.Voice.profileFor(a.id, R.AGENT_IDS);
        const current = (R.Voice.overrides()[a.id]) || '';
        return html`<div class="voicerow">
          ${Avatar(a, 'sm')}
          <span class="voicerow__name">${a.name}</span>
          ${K.Select({ id:'voice-' + a.id, value:current, change:'office-voice',
            data:{ 'data-agent':a.id },
            options:[{ value:'', label:'otomatik — ' + (prof.name || 'ses yok') }]
              .concat(list.map(v => ({ value:v.voiceURI || v.name, label:v.name }))) })}
          ${K.IconButton({ icon:'play', size:'sm', aria:a.name + ' sesini dinle',
            title:'Dinle', act:'office-voice-try', data:{ 'data-agent':a.id } })}
        </div>`;
      })}</div>`),
    ], 'sm');
  }

  function providerForm(providerId){
    const st = O.settings();
    const p = R.PROVIDERS[providerId];
    const models = R.LLM.modelsFor(providerId);
    const saved = providerId === st.provider ? st.model : '';
    const inList = saved && models.some(m => m.id === saved);
    const current = inList ? saved : (models[0] ? models[0].id : '');
    /* Elle yazilmis model kimligi listede olmaz. Alan bos birakilirsa
       kaydetme onu listenin ilk modeliyle degistiriyordu: kullanici
       ayarlari acip kaydedince modeli sessizce kaybediyordu. */
    const typed = saved && !inList ? saved : '';
    const keys = R.LLM.maskKeys(providerId);
    const lim = R.Quota.limitsFor({ provider:providerId, model:current });
    const over = R.Quota.getOverride(providerId);

    return K.Stack([
      K.Notice({ tone:'info', body:p.note }),

      /* --- 1. anahtarlar (birden cok olabilir) ---
         Anahtar istemeyen yerel/ozel uclarda da gosterilir: onlerinde vekil
         olan kurulumlar anahtar bekler, alan gizlenince baglanmalarinin
         yolu kalmiyordu. */
      when(p.needsKey || p.keyOptional, () => K.Stack([
        K.SectionTitle(p.needsKey ? '1. API anahtarı' : 'API anahtarı (gerekiyorsa)'),
        when(keys.length, () => html`<div class="stack-xs">${map(keys, (masked, i) => html`
          <div class="keyrow">
            <span class="keyrow__mask">${masked}</span>
            <span class="keyrow__q">${keyUsage(providerId, current, i)}</span>
            ${K.Button({ label:'Sil', size:'sm', tone:'ghost', act:'office-forget',
              data:{ 'data-provider':providerId, 'data-index':i } })}
          </div>`)}</div>`),
        K.Field({ label:keys.length ? 'Başka bir anahtar ekle' : 'Anahtarı yapıştır',
          hint:p.keyHint,
          input:K.Input({ id:'llm-key', type:'password', placeholder:p.keyHint,
            aria:'API anahtarı', change:'office-key' }) }),
        html`<div id="llm-key-warn"></div>`,
        when(keys.length, () => html`<p class="tiny dim">Kota her anahtar için ayrı sayılır:
          ikinci anahtar günlük hakkı ikiye katlar. Motor kotası müsait olanı seçer.</p>`),
        html`<p class="tiny dim">Anahtar yalnız bu tarayıcıda durur; yedeğe girmez, buluta gitmez,
          modele gönderilmez. ${when(p.keyUrl, () => html`Ücretsiz anahtar:
          <a href="${p.keyUrl}" target="_blank" rel="noopener">${p.keyUrl.replace(/^https:\/\//, '')}</a>`)}</p>`,
      ], 'sm')),

      /* --- 2. uc adresi (yalniz ozel) --- */
      when(p.editableEndpoint, () => K.Stack([
        K.SectionTitle('Uç adresi'),
        K.Field({ label:'OpenAI uyumlu /chat/completions',
          hint:p.endpoint ? 'varsayılan: ' + p.endpoint : null,
          input:K.Input({ id:'llm-endpoint',
            value:(providerId === st.provider ? st.endpoint : '') || p.endpoint || '',
            placeholder:p.endpoint || 'http://localhost:11434/v1/chat/completions' }) }),
      ], 'sm')),

      /* --- 3. model ---
         Model kimlikleri saglayicilarda aylik doner ve eskiyen bir katalog
         "model bulunamadi" duvarina cikar. Liste artik saglayicinin kendi
         ucundan tazelenebilir; boylece katalogun eskimesi ariza olmaktan
         cikip tek dugmeye iner. */
      K.Stack([
        K.SectionTitle((p.needsKey ? '2. ' : '') + 'Model',
          K.Button({ label:'Modelleri yenile', icon:'refresh', size:'sm', act:'office-models' })),
        html`<p class="tiny dim" id="llm-model-note">${catalogNote(providerId)}</p>`,
        when(models.length, () => K.Field({ label:'Listeden seç',
          input:K.Select({ id:'llm-model', value:current, change:'office-model',
            options:modelOptions(providerId) }) })),
        K.Field({ label:'Ya da model kimliğini elle yaz',
          hint:'listede yoksa doldur; boş bırakırsan yukarıdaki seçilir',
          input:K.Input({ id:'llm-model-custom', value:typed,
            placeholder:'ör. deepseek/deepseek-chat-v3-0324:free' }) }),
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

      /* --- 5. sesler --- */
      voiceSection(),

      /* --- 6. ofis davranisi --- */
      K.Stack([
        K.SectionTitle('Ofis davranışı'),
        K.Checkbox({ label:'Model düşerse yedeğe geç (önerilir)', checked:st.fallback !== false,
          act:'office-toggle-fallback' }),
        K.Checkbox({ label:'Sabah günün brifingini kendiliğinden üret (günde 1 istek)',
          checked:st.autoBriefing !== false, act:'office-toggle-briefing' }),
        html`<div id="office-notify">${notifyRow()}</div>`,
      ], 'sm'),

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
        ${K.Button({ label:'Tanıla', icon:'info', act:'office-diagnose' })}
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
    const list = R.LLM.modelsFor(provider);
    const custom = val('llm-model-custom');
    const picked = val('llm-model');
    const model = custom || picked || (list[0] ? list[0].id : '');
    /* Adres YALNIZCA kendi adresini duzenleyebilen saglayicilarda anlamlidir.
       Eskiden adres alani olmayan bir saglayici secildiginde kayitli adres
       geri veriliyordu: Ollama'dan Groq'a gecen kullanicinin istekleri
       localhost'a gidiyor ve model "cagrilamiyor" oluyordu. */
    const endpoint = p.editableEndpoint ? R.LLM.normalizeOpenAI(val('llm-endpoint')) : '';
    return {
      provider, model, endpoint,
      key:val('llm-key'),
      rpm:val('llm-rpm'),
      rpd:val('llm-rpd'),
    };
  }

  /* Kaydetmeden once eksigi soyler; sessizce kabul edip sonra patlamaz. */
  function validate(cfg){
    const p = R.PROVIDERS[cfg.provider];
    if(p.needsKey && !cfg.key && !R.LLM.getKeys(cfg.provider).length){
      return 'Bu sağlayıcı için API anahtarı gerekiyor. Ücretsiz anahtarı bağlantıdan alabilirsin.';
    }
    /* Bicim uyarisi engellemez ama anahtar acikca BASKA bir saglayiciya
       aitse kaydetmenin tek sonucu 401'dir: burada durdurulur. */
    const problem = R.LLM.keyProblem(cfg.provider, cfg.key);
    if(problem && problem.level === 'wrong') return problem.text;
    if(p.editableEndpoint && !cfg.endpoint){
      return 'Özel uç için adres gerekiyor (OpenAI uyumlu bir adres yeter: …/v1).';
    }
    if(!cfg.model) return 'Model seçilmedi. Listeden seç ya da model kimliğini elle yaz.';
    return null;
  }

  function applyForm(cfg){
    /* Yeni anahtar eskisinin yerine gecmez, havuza EKLENIR. */
    if(cfg.key) R.LLM.addKey(cfg.provider, cfg.key);
    R.Quota.setOverride(cfg.provider, { rpm:cfg.rpm, rpd:cfg.rpd });
  }

  function testOutput(node){
    const out = document.getElementById('llm-test');
    if(out) out.innerHTML = String(node);
  }

  /* ---------- tanılama ----------
     “Bağlanamadı” tek başına hiçbir şey öğretmez. Zincir sırayla bakar
     (ortam → adres → anahtar → model listesi → seçili model → gerçek çağrı)
     ve ilk kırılan halkayı gösterir: kullanıcı artık nereye bakacağını bilir. */

  function diagList(res){
    return K.Stack([
      K.Notice({ tone:res.ok ? 'ok' : 'danger',
        title:res.ok ? 'Her adım çalışıyor.' : 'Zincir burada kırılıyor:',
        body:res.ok ? 'Bu yapılandırma ofiste kullanılabilir.'
          : 'Aşağıdaki ilk kırmızı satır sorunun kendisidir; sonrakiler onun sonucudur.' }),
      html`<div class="stack-xs mt-8">${map(res.steps, st => html`
        <div class="finding">
          <span class="${'finding__dot finding__dot--' + (st.ok ? 'ok' : 'danger')}"></span>
          <span class="minw0"><b>${st.name}</b>${when(st.note, () => html` — ${st.note}`)}</span>
        </div>`)}</div>`,
    ], 'sm');
  }

  /* ---------- ekran ---------- */

  async function render(){
    O.resetBriefs();
    const specialists = R.AGENTS.filter(a => !a.lead);

    return String(K.Grid([
      K.Span(8, K.Stack([
        boardCard(),
        floorPlan(),
        proposalsCard(),
        briefingCard(),
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

  /* ---------- kamera ----------
     Döndürme ekranı yeniden çizmez: tek bir CSS değişkeni değişir. Yeniden
     çizim hem gereksiz (veri değişmiyor) hem de sürüklerken takılma yapardı. */

  function applyTurn(deg){
    roomTurn = ((deg % 360) + 360) % 360;
    if(roomTurn > 180) roomTurn -= 360;
    const scene = document.getElementById('room3d-scene');
    if(scene) scene.style.setProperty('--turn', roomTurn + 'deg');
  }

  /* Odayı sürükleyerek çevirme. Dikey sürükleme sayfayı kaydırmaya kalır:
     kullanıcı odanın üstünden geçerken sayfa kilitlenmemeli. */
  function bindDrag(){
    const stage = document.getElementById('room3d');
    if(!stage || stage.dataset.bound) return;
    stage.dataset.bound = '1';

    let id = null, x0 = 0, base = 0, moved = false;

    stage.addEventListener('pointerdown', e => {
      if(e.button != null && e.button !== 0) return;
      id = e.pointerId; x0 = e.clientX; base = roomTurn; moved = false;
      stage.classList.add('is-dragging');
    });
    stage.addEventListener('pointermove', e => {
      if(id !== e.pointerId) return;
      const dx = e.clientX - x0;
      if(!moved && Math.abs(dx) < 4) return;
      if(!moved){ moved = true; try{ stage.setPointerCapture(id); }catch(err){} }
      applyTurn(base + dx * 0.4);
    });
    const end = e => {
      if(id !== e.pointerId) return;
      /* Sürüklemeden sonra gelen tık masayı açmasın. */
      if(moved) stage.dataset.dragged = '1';
      id = null;
      stage.classList.remove('is-dragging');
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('click', e => {
      if(stage.dataset.dragged){ delete stage.dataset.dragged; e.stopPropagation(); e.preventDefault(); }
    }, true);
  }

  function afterRender(){ bindDrag(); }

  /* ---------- eylemler ---------- */

  const handle = {
    /* Görünüm tercihi kalıcıdır: kullanıcı 3B'yi kapattıysa her açılışta
       geri gelmemeli. */
    async 'office-view'(){
      await O.saveSettings({ room3d:O.settings().room3d === false });
      R.App.render();
    },

    async 'office-turn'(el){
      applyTurn(roomTurn + Number(el.dataset.dir || 1) * 30);
    },

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

    async 'office-toggle-briefing'(el){
      await O.saveSettings({ autoBriefing:!!el.checked });
    },

    async 'office-voices'(){
      R.Voice.cancel();
      await R.Voice.load(3000);
      const form = document.getElementById('llm-form');
      const sel = document.getElementById('llm-provider');
      if(form && sel) form.innerHTML = String(providerForm(sel.value));
      UI.toast(R.Voice.voiceCount() + ' ses bulundu');
    },

    /* Dinlemeden ses seçilmez: ad listesinden bir sesin nasıl olduğu
       anlaşılmaz. */
    async 'office-voice-try'(el){
      const id = el.dataset.agent;
      const agent = R.AGENT_BY_ID[id];
      if(!agent) return;
      R.Voice.cancel();
      await R.Voice.speak(
        agent.name + '. ' + agent.role + '. TYT kapanışın %62, bu hafta 18 soru çözdün.',
        R.Voice.profileFor(id, R.AGENT_IDS), {});
    },

    async 'office-notify'(){
      await R.App.askNotify();
      const box = document.getElementById('office-notify');
      if(box) box.innerHTML = String(notifyRow());
    },

    async 'office-forget'(el){
      R.LLM.removeKeyAt(el.dataset.provider, Number(el.dataset.index) || 0);
      UI.toast('Anahtar silindi');
      const sel = document.getElementById('llm-provider');
      const form = document.getElementById('llm-form');
      if(form && sel) form.innerHTML = String(providerForm(sel.value));
    },

    async 'office-rpd'(el){
      const input = document.getElementById('llm-rpd');
      if(input) input.value = el.dataset.rpd;
    },

    /* Saglayicinin KENDI model listesini ceker. Sohbet istegi degildir:
       gunluk kotadan dusmez. Eskiyen katalog artik ariza degil, tek dugme. */
    async 'office-models'(el){
      const sel = document.getElementById('llm-provider');
      const provider = sel ? sel.value : '';
      if(!R.PROVIDERS[provider]) return;

      /* Anahtar henuz kaydedilmemis olabilir; alandaki anahtar once havuza
         alinir, yoksa liste "anahtar yok" diye doner. */
      const keyEl = document.getElementById('llm-key');
      if(keyEl && keyEl.value.trim()) R.LLM.addKey(provider, keyEl.value.trim());
      const endEl = document.getElementById('llm-endpoint');

      const note = document.getElementById('llm-model-note');
      if(note) note.textContent = 'Sağlayıcının listesi çekiliyor…';
      el.disabled = true;
      try{
        const res = await R.LLM.listModels({ provider,
          endpoint:endEl ? endEl.value.trim() : '' });
        const form = document.getElementById('llm-form');
        if(form) form.innerHTML = String(providerForm(provider));
        UI.toast(res.models.length + ' model bulundu');
      }catch(err){
        const code = err && err.code;
        if(note) note.textContent = catalogNote(provider);
        testOutput(K.Notice({ tone:'danger', title:'Model listesi alınamadı.',
          body:R.LLM.errorText(code) }));
      }finally{
        el.disabled = false;
      }
    },

    async 'office-diagnose'(el){
      const cfg = readForm();
      if(!cfg) return;
      /* Tanilama gercek anahtarla calisir; alandaki anahtar once havuza alinir. */
      if(cfg.key) R.LLM.addKey(cfg.provider, cfg.key);
      el.disabled = true;
      testOutput(K.Notice({ tone:'info', body:'Zincir sınanıyor: ortam, adres, anahtar, '
        + 'model listesi ve gerçek bir çağrı…' }));
      try{
        const res = await R.LLM.diagnose(cfg);
        testOutput(diagList(res));
      }finally{
        el.disabled = false;
      }
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

    async 'office-briefing'(el){
      const out = document.getElementById('office-briefing');
      el.disabled = true;
      /* Kat planinda Patron'un isigi yanip sonsun: ofis calisiyor gorunmeli.
         Tum ekrani yeniden cizmek yerine tek dugum degistirilir. */
      const light = document.querySelector('.seat--patron .seatlight');
      if(light) light.className = 'seatlight seatlight--busy';
      if(out) out.innerHTML = String(html`<p class="small muted">Masaları okuyor…</p>`);
      try{
        await O.dailyBriefing({ force:true });
      }catch(err){
        UI.toast(R.LLM.errorText(err && err.code));
      }finally{
        el.disabled = false;
        R.App.render();
      }
    },

    /* Kural motoru masalari yeniden okur; model gerekmez, kota harcanmaz. */
    async 'office-scan'(el){
      el.disabled = true;
      try{
        const added = await R.Proposals.refresh();
        UI.toast(added.length
          ? added.length + ' yeni öneri masaya bırakıldı'
          : 'Ofis her şeyi yerinde buldu');
      }finally{
        el.disabled = false;
        R.App.render();
      }
    },

    /* Onay kapisi: uygulama YALNIZ buradan gecer. */
    async 'office-approve'(el){
      const res = await R.Proposals.approve(el.dataset.id);
      if(!res) return;
      UI.toast(res.ok ? 'Uygulandı — istersen geri alabilirsin' : res.why);
      R.App.render();
    },

    async 'office-reject'(el){
      await R.Proposals.reject(el.dataset.id);
      UI.toast('Öneri reddedildi');
      R.App.render();
    },

    async 'office-undo'(el){
      await R.Proposals.undo(el.dataset.id);
      UI.toast('Geri alındı');
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
      if(box) box.innerHTML = warn ? String(warn) : '';
    },
    async 'office-voice'(el){
      const id = el.dataset.agent;
      const next = Object.assign({}, O.settings().voices || {});
      if(el.value) next[id] = el.value; else delete next[id];
      await O.saveSettings({ voices:next });
      /* Seçtiğini hemen duy: sessiz bir kaydetme, seçimin işe yarayıp
         yaramadığını gizler. */
      const agent = R.AGENT_BY_ID[id];
      R.Voice.cancel();
      await R.Voice.speak(agent.name + '. Merhaba.', R.Voice.profileFor(id, R.AGENT_IDS), {});
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
        + ' · ' + R.AGENTS.length + ' ajan' + (open ? ' · ' + open + ' açık karar' : '');
    },
    actions(){
      return String(K.Button({ label:'Ayarlar', icon:'gear', size:'sm', act:'office-settings' }));
    },
    render, afterRender, handle, change, openSettings,
  };
})();
