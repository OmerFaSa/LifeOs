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

  /* Metinde gecen ajan adlarini tiklanabilir yapar: "bu Tuna'nin alani"
     dendiginde o masaya gecilebilsin. Kacirma ONCE yapilir, baglanti sonra;
     boylece model ne yazarsa yazsin HTML enjeksiyonu olmaz. */
  const NAME_RE = new RegExp('\\b(' + R.AGENTS.map(a => a.name).join('|') + ')\\b', 'g');

  function body(text){
    const escaped = U.esc(String(text || '')).replace(/\n/g, '<br/>');
    return escaped.replace(NAME_RE, name => {
      const a = R.AGENTS.find(x => x.name === name);
      if(!a) return name;
      return '<button class="agentref agentref--' + a.id + '" data-act="meet-talk" '
        + 'data-agent="' + a.id + '" title="' + U.esc(a.role) + '">' + name + '</button>';
    });
  }

  function Turn(t, i){
    if(t.agent === 'aday'){
      return html`
        <div class="meetturn meetturn--me" data-turn="${i}">
          <div class="meetturn__who"><b>Sen</b><span class="dim">söz aldın</span></div>
          <div class="meetturn__body">${raw(body(t.text))}</div>
        </div>`;
    }
    const agent = R.AGENT_BY_ID[t.agent] || R.AGENT_BY_ID.patron;
    return html`
      <div class="${cls('meetturn', t.closing && 'meetturn--closing',
        t.roundKey === 'capraz' && 'meetturn--cross')}" data-turn="${i}">
        <div class="meetturn__who">
          ${Avatar(agent)}<b>${agent.name}</b><span class="dim">${agent.role}</span>
          <span class="meetturn__wave" aria-hidden="true"><i></i><i></i><i></i></span>
          ${when(t.roundTitle, () => html`<span class="meetturn__round">${t.roundTitle}</span>`)}
          ${when(t.vote, () => K.Badge({ label:t.vote + '. fikre oy', tone:'info' }))}
          ${when(t.closing, () => K.Badge({ label:'karar', tone:'ok' }))}
          ${when(t.mode === 'kural', () => K.Badge({ label:'kural motoru', tone:'info' }))}
        </div>
        <div class="meetturn__body">${raw(body(t.text))}</div>
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
          ${K.Segmented({ aria:'Toplantı akış hızı', value:paceId(), act:'meet-pace',
            items:R.Voice.PACE_ORDER.map(id => ({ value:id, label:R.Voice.PACE[id].label })) })}
          ${when(voiceAvailable(), () => K.Button({
            label:S.ui.meetingVoice ? 'Ses açık' : 'Sesli dinle',
            icon:S.ui.meetingVoice ? 'pause' : 'play', size:'sm',
            tone:S.ui.meetingVoice ? 'primary' : 'ghost', act:'meet-voice' }))}
          ${K.Button({ label:'Ofise dön', size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'office' } })}
        </div>

        ${(function(){
          const list = O.conflicts();
          return when(list.length, () => html`<div class="mt-10">
            ${K.Notice({ tone:'info', title:'Kural motoru ' + list.length + ' çelişki buldu:',
              body:list.map(c => c.name + '’ya sorulacak' ).join(' · ')
                + ' — Patron tur aralarında çapraz soru soracak.' })}
          </div>`);
        })()}

        <div class="meetplan mt-12">
          <b class="small">Nasıl işleyecek?</b>
          <ol class="meetplan__list">
            ${map(R.Office.ROUNDS.slice(0, maxRounds()), (r, i) =>
              html`<li><b>${i+1}. ${r.title}</b> — ${R.MEETING_ORDER.length} uzman sırayla konuşur</li>`)}
          </ol>
          <p class="tiny dim">Toplantıyı <b>sen</b> bitirirsin; istediğin turda “Bitir ve rapor al”a bas.
            Araya girip söz de alabilirsin. Konuşmalar sırayla akar: biri bitmeden
            diğeri başlamaz.
            ${when(S.ui.meetingVoice && voiceAvailable(),
              () => html`Ses açık — her ajanın kendi sesi var; sıradaki konuşma bir
                öncekinin sesi bitmeden başlamaz.`)}
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
          ${when(S.ui.meetingVoice && voiceAvailable(), () => html`<span class="dim">${
            R.Voice.voiceCount() === 0 ? '· cihazda ses yok'
              : R.Voice.voiceCount() > 1
                ? '· ' + Math.min(R.Voice.voiceCount(), R.AGENT_IDS.length) + ' ayrı ses'
                : '· tek ses (perde ile ayrılıyor)'}</span>`)}
        </div>
        <div class="row wrap gap-6">
          ${when(!S.ui.meetingVoice, () => K.Segmented({
            aria:'Toplantı akış hızı', value:paceId(), act:'meet-pace',
            items:R.Voice.PACE_ORDER.map(id => ({ value:id, label:R.Voice.PACE[id].label })) }))}
          ${when(voiceAvailable(), () => K.Button({
            label:S.ui.meetingVoice ? 'Sesi kapat' : 'Sesli dinle',
            icon:S.ui.meetingVoice ? 'pause' : 'play', size:'sm',
            tone:S.ui.meetingVoice ? 'primary' : 'ghost', act:'meet-voice' }))}
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

        ${when(r.vote && r.vote.kazanan, () => html`
          <div class="mt-12">${K.SectionTitle('Oylama', K.Badge({
            label:r.vote.oyVeren + ' oy', tone:'info' }))}</div>
          ${K.Table({ tight:true,
            headers:['Fikir', 'Sahibi', { label:'Oy', num:true }, { label:'Ağırlık', num:true }],
            rows:r.vote.rows.map(row => [
              html`<span class="small">${row.text.slice(0, 90)}</span>`,
              row.name, row.oy, row.agirlik,
            ]) })}
          <p class="tiny dim mt-8">Ağırlık ajanın güven skorundan gelir: önerisi tutan ajanın
            oyu daha ağır basar. Sayımı kural motoru yapar.</p>`)}

        ${when((r.crossed || []).length, () => html`
          <div class="mt-12">${K.SectionTitle('Çapraz soru')}</div>
          <div class="stack-xs">${map(r.crossed, c => html`
            <div class="finding">
              <span class="finding__dot finding__dot--warn"></span>
              <span><b>${c.ajan}:</b> ${c.yanit}</span>
            </div>`)}</div>`)}

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
          ${K.Button({ label:'Raporu indir', icon:'download', size:'sm', act:'meet-download',
            data:{ 'data-id':m.id } })}
          ${K.Button({ label:'Yeni toplantı', size:'sm', tone:'ghost', act:'meet-new' })}
        </div>`,
    });
  }

  /* ---------- arsiv ---------- */

  /* Tutanak arama: gundem, karar ve butun konusma metni taranir. */
  function matches(m, q){
    if(!q) return true;
    const hay = [m.topic, m.why, m.action && m.action.title,
      m.report && m.report.summary]
      .concat((m.turns || []).map(t => t.name + ' ' + t.text))
      .join(' ').toLocaleLowerCase('tr');
    return hay.indexOf(q.toLocaleLowerCase('tr')) >= 0;
  }

  function archiveCard(){
    const all = O.meetings();
    if(!all.length) return '';
    const q = S.ui.meetingSearch || '';
    const list = all.filter(m => matches(m, q));

    return K.Card({
      title:'Geçmiş toplantılar',
      sub:q ? list.length + ' / ' + all.length + ' tutanak eşleşti'
            : all.length + ' tutanak saklanıyor',
      actions:when(all.length > 2, () => K.Input({ id:'meet-search', size:'sm',
        value:q, placeholder:'Tutanaklarda ara…', change:'meet-search', data:{ 'data-debounce':'250' } })),
      body:html`
        ${when(!list.length, () => K.Empty({ icon:'search',
          text:'“' + q + '” için tutanak bulunamadı.',
          action:K.Button({ label:'Süzgeci sıfırla', size:'sm', act:'meet-search-clear' }) }))}
        <div class="stack-xs">${map(list, m => K.Collapsible({
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

  /* ---------- sesli toplanti ve okuma ritmi ----------

     Iki ayri sikayet ayni yere cikiyordu: toplanti okunamayacak kadar hizli
     akiyor, ve sesli modda biri konusurken digeri araya giriyordu.

     Cozum tek bir kural: BIR KONUSMA TESLIM EDILMEDEN SIRADAKI BASLAMAZ.
     Teslim etmek sesli modda konusmanin gercekten bitmesini beklemek,
     sessiz modda ise metnin okunmasina yetecek kadar durmaktir. Bekleme
     dongunun icinde oldugu icin sonraki MODEL CAGRISI da gecikir — bu
     ucretsiz katmanda bir kayip degil kazanctir: kota kendiliginden
     rahatlar. */

  function voiceAvailable(){ return R.Voice.available(); }

  /* Kim konusuyor: ekranda o konusmanin yaninda dalga isareti yanar. */
  let speakingId = null;

  function markSpeaking(index){
    speakingId = (index == null || index < 0) ? null : index;
    const live = document.getElementById('meet-turns');
    if(!live) return;
    live.querySelectorAll('.meetturn').forEach(el => {
      el.classList.toggle('is-speaking',
        speakingId != null && el.dataset.turn === String(speakingId));
    });
  }

  /* Okunacak metin: "Tuna: ..." diye baslar ki kimin konustugu duyulsun. */
  function voiceText(turn){
    return (turn.name ? turn.name + '. ' : '') + turn.text;
  }

  function stopVoice(){
    markSpeaking(null);
    R.Voice.cancel();
  }

  function paceId(){ return O.settings().meetingPace || 'normal'; }



  /* Bir konusmayi kullaniciya TESLIM eder ve ancak ondan sonra doner. */
  async function deliver(turn){
    if(!turn || !turn.text || stopAsked) return;

    if(S.ui.meetingVoice && voiceAvailable()){
      markSpeaking(session ? session.turns.indexOf(turn) : -1);
      const basladi = Date.now();
      const why = await R.Voice.speak(voiceText(turn),
        R.Voice.profileFor(turn.agent, R.AGENT_IDS),
        { signal:controller && controller.signal });
      markSpeaking(null);
      if(why === 'cancelled') return;

      /* Ses SESSIZCE dusebilir: cihazda hic Turkce ses yoksa konusma
         aninda "bitmis" doner ve toplanti 300 ms'de bir tur atmaya baslar —
         yani sesli mod, sikayet edilen hizli akisin daha betersi olur.

         Degismez kural: bir konusma, okunmasi icin gereken sureden AZ
         ekranda kalmaz. Ses gercekten calistiysa zaten daha uzun surer ve
         bu satir yalniz nefes araligini birakir. */
      if(why === 'unavailable' || why === 'error') warnVoiceOnce();
      await pause(R.Voice.holdMs(turn.text, paceId(), Date.now() - basladi));
      return;
    }
    /* Okuma molasi, metnin ZATEN ekranda gecirdigi sureyi sayar.

       Model akarken metin harf harf gelir ve kullanici o sirada okur; buna
       bir de tam okuma suresi eklemek toplantiyi gereksiz yere durdururdu.
       Kota kuyrugunda beklenen sure ise okuma degildir (ekranda "sirada"
       yaziyordu), o yuzden dusulur. */
    const gorunen = Math.max(0, (turn.ms || 0) - (turn.waited || 0));
    await pause(R.Voice.holdMs(turn.text, paceId(), gorunen));
  }

  /* Ses acik ama cihazda calisan bir ses yok: kullanici bunu duyamaz,
     soylenmesi gerekir. Toplanti basina bir kez. */
  let voiceWarned = false;
  function warnVoiceOnce(){
    if(voiceWarned) return;
    voiceWarned = true;
    UI.toast('Bu cihazda çalışan bir konuşma sesi bulunamadı — toplantı sessiz akıyor');
  }

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
        const code = err && err.code;
        if(code === 'cancelled') return;

        /* Baglanti ya da sunucu sorunuysa toplanti bitmez, DURAKLAR:
           konusulanlar duruyor, baglanti gelince kaldigi yerden devam eder. */
        if(R.LLM.resumable(code)){
          running = false;
          setPending('');
          UI.toast(R.LLM.errorText(code));
          await R.App.render();
          R.LLM.onceOnline(() => {
            if(session && !running && !stopAsked){
              UI.toast('Bağlantı geldi — toplantı kaldığı yerden devam ediyor');
              handle['meet-resume']();
            }
          });
          return;
        }

        UI.toast(R.LLM.errorText(code));
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

      /* Konusma teslim edilmeden siradaki tur baslamaz: sesli modda ses
         bitene kadar, sessiz modda metin okunana kadar beklenir. Bekleme
         dongunun icinde oldugu icin sonraki model cagrisi da gecikir ve
         kota kendiliginden rahatlar. */
      if(running && !stopAsked) await deliver(session.turns[session.turns.length - 1]);

      /* Tur bitti: kural motoru celiski bulduysa Patron takip sorusu sorar.
         Toplantiyi yoklamadan tartismaya cikaran adim budur. */
      if(running && !stopAsked && turnIndex % PER_ROUND === 0 && O.nextConflict(session)){
        setPending(pendingTurn('patron', 'Çapraz soru soruyor…'));
        try{
          await O.askCross(session, {
            signal:controller.signal,
            onWait(ms){ showWait('patron', ms); },
            async onTurn(turn){
              stopWait();
              paint();
              setPending('');
              await R.App.render();
              if(running && !stopAsked) await deliver(turn);
            },
          });
        }catch(err){
          stopWait();
          if(err && err.code === 'cancelled') return;
          /* Capraz soru bir ek: basarisiz olursa toplanti devam eder. */
        }
        setPending('');
      }
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
    voiceWarned = false;
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
    /* Acilis da bir konusmadir: teslim edilmeden ilk uzman soz almasin.
       Eskiden acilis ve ilk tur ard arda, ayni anda dusuyordu. */
    await deliver(session.turns[session.turns.length - 1]);
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
      stopVoice();
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
      stopVoice();
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

    async 'meet-voice'(){
      S.ui.meetingVoice = !S.ui.meetingVoice;
      if(S.ui.meetingVoice){
        /* Ses listesi ilk cagrida bos gelebilir; acilirken yuklenir ki
           ilk konusma da dogru sesle okunsun. */
        await R.Voice.load();
        R.Voice.assign(R.AGENT_IDS);
      }else{
        stopVoice();
      }
      await O.saveSettings({ meetingVoice:S.ui.meetingVoice });
      await R.App.render();
    },

    /* Akis hizi kalicidir: her toplantida yeniden secilmesin. */
    async 'meet-pace'(el){
      const v = el.dataset.value;
      if(R.Voice.PACE[v]) await O.saveSettings({ meetingPace:v });
      await R.App.render();
    },

    async 'meet-download'(el){
      const m = O.meetings().find(x => x.id === el.dataset.id) || closed;
      if(!m) return;
      const text = O.reportText(m);
      const name = 'rota-toplanti-' + m.at.slice(0, 10) + '.txt';
      try{
        const url = URL.createObjectURL(new Blob([text], { type:'text/plain;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        UI.toast('Rapor indirildi');
      }catch(e){
        /* Bazi ortamlar indirmeyi engeller; rapor yine de alinabilsin. */
        UI.sheet({ title:'Toplantı raporu', subtitle:'Kopyalayıp kaydedebilirsin', wide:true,
          body:String(html`<textarea class="textarea coachnote" rows="18" readonly>${text}</textarea>`),
          footer:String(K.Button({ label:'Kapat', act:'sheet-close' })) });
      }
    },

    async 'meet-search-clear'(){
      S.ui.meetingSearch = '';
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
    async 'meet-search'(el){
      S.ui.meetingSearch = el.value.trim();
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
