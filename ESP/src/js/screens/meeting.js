/* Toplantı — gündem seçilir, altı uzman konuşur, Patron kapatır.

   Her tur AYRI bir çağrıdır ve geldiği anda ekrana basılır; hepsinin
   bitmesi beklenmez. Uzun süren bir toplantıda kullanıcı ilerlemeyi görür.

   Kapanıştaki karar ESP.Planner.nextAction()'dan gelir. Patron onu
   DEĞİŞTİREMEZ, yalnızca gerekçelendirir — model «bunun yerine şunu yap»
   derse tutanaktaki eylem yine kural motorununkidir.

   Gündemi de model seçmez: ESP.Office.agendaCandidates() içindeki puanlama
   seçer. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.meeting = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C;

  /* Devam eden toplantinin turlari burada birikir: gelen her tur hemen
     cizilir, tutanak sonda kaydedilir. */
  let canli = null;

  function agendaRows(){
    const adaylar = ESP.Office.agendaCandidates();
    const secili = S.ui.meetingAgenda || adaylar[0].id;

    return K.Entry({
      label:'GÜNDEM',
      meta:adaylar.length + ' aday',
      note:'Gündemi model seçmez: puanlama seçer. En yüksek puanlı aday '
         + 'varsayılan olarak işaretlidir.',
      body:html`
        <div class="picks">
          ${map(adaylar, a => K.PickCard({
            on:a.id === secili, act:'pick-agenda', data:{ 'data-id':a.id },
            label:a.label, meta:a.detail || a.lead,
          }))}
        </div>
        <div class="row mt-12">
          ${K.Button({ label:'Toplantıyı başlat', tone:'primary', act:'run-meeting',
            disabled:!!canli })}
          ${when(canli, () => K.Badge({ label:'devam ediyor', tone:'info' }))}
        </div>`,
    });
  }

  function liveRows(){
    if(!canli) return [];
    return [K.Entry({
      label:'TOPLANTI',
      meta:canli.turns.length + '/' + (ESP.Mod.activeAgents().length - 1) + ' tur',
      note:'Her tur geldiği anda basılır; hepsinin bitmesi beklenmez.',
      wide:true,
      body:html`
        ${map(canli.turns, t => turnRow(t))}
        ${when(!canli.done, () => K.Skeleton({ rows:2 }))}`,
    })];
  }

  function turnRow(t){
    const a = ESP.AGENT_BY_ID[t.agentId];
    return html`
      <div class="meetturn">
        <div class="meetturn__head">
          <span class="agentav" style="background:${a ? a.color : 'var(--agent-patron)'}"
            aria-hidden="true">${a ? a.initial : '?'}</span>
          <b>${t.name}</b>
          ${K.Badge({ label:t.source === 'model' ? 'model' : 'kural motoru',
            tone:t.source === 'model' ? 'info' : 'muted', icon:false })}
          ${when(t.blocked, () => K.Badge({ label:'kurallara takıldı', tone:'warn' }))}
        </div>
        <p>${t.text}</p>
      </div>`;
  }

  function minutesRows(){
    const liste = S.officeMeetings || [];
    if(!liste.length){
      return [K.Entry({ label:'TUTANAKLAR', meta:'yok',
        body:K.Empty({ text:'Henüz toplantı yapılmadı.' }) })];
    }
    return liste.slice(0, 10).map(m => K.Entry({
      label:'TUTANAK',
      meta:U.fmtDate(m.at.slice(0, 10)) + ' · ' + m.agendaLabel,
      note:m.decision ? 'Karar: ' + m.decision.title : '',
      action:K.Button({ label:S.ui.meetingOpen === m.id ? 'Kapat' : 'Aç', size:'sm',
        act:'toggle-minutes', data:{ 'data-id':m.id } }),
      wide:true,
      body:S.ui.meetingOpen === m.id
        ? html`
          ${map(m.turns, turnRow)}
          ${when(m.closing, () => html`
            <div class="meetturn meetturn--close">
              <div class="meetturn__head"><b>Patron</b>
                ${K.Badge({ label:m.closing.source === 'model' ? 'model' : 'kural motoru',
                  tone:m.closing.source === 'model' ? 'info' : 'muted', icon:false })}</div>
              <p>${m.closing.text}</p>
            </div>`)}
          ${when((m.proposals || []).length, () => html`
            <div class="mt-10">
              ${K.SectionTitle('Toplantıda masaya gelen teklifler')}
              <p class="small muted">«Konuştuk ve dağıldık» bir toplantı değildir.
                Teklifleri model üretmez: kural motoru üretir, toplantı yalnızca
                o anın fotoğrafını saklar. Onay senin.</p>
              ${ESP.Parts.proposalList(m.proposals.filter(t =>
                !(ESP.S.proposals || []).some(x => x.id === t.id && x.state !== 'proposed')),
                'Bu toplantının bütün teklifleri karara bağlanmış.')}
            </div>`)}
          ${when(m.decision, () => html`
            <div class="row mt-10">
              ${K.Button({ label:'Kararı takibe al', size:'sm', act:'track-decision',
                data:{ 'data-id':m.id } })}
              ${when(m.decision.route, () => K.Button({ label:'Ekranı aç', size:'sm',
                act:'go', data:{ 'data-route':m.decision.route } }))}
            </div>`)}`
        : html`<p class="small muted">${m.turns.length} tur ·
            ${m.closing ? 'kapanış var' : 'kapanış yok'}</p>`,
    }));
  }

  function decisionRows(){
    const acik = M.openDecisions();
    if(!acik.length) return [];
    return [K.Entry({
      label:'TAKİPTEKİ KARARLAR',
      meta:acik.length + ' açık',
      note:'Karar vermek değil, kararın ne yaptığını görmek sistemi ilerletir. '
         + 'Bu yüzden kapatırken sonuç yazılır.',
      wide:true,
      body:html`${map(acik, d => html`
        <div class="decision">
          <p>${d.text}</p>
          <div class="row wrap mt-8">
            <span class="tiny dim">${U.fmtShort(d.openedAt.slice(0, 10))} tarihinde açıldı</span>
            ${K.Input({ id:'dec-' + d.id, placeholder:'Ne değişti? (ölçümle)', size:'sm' })}
            ${K.Button({ label:'Kapat', size:'sm', act:'close-decision',
              data:{ 'data-id':d.id } })}
          </div>
        </div>`)}`,
    })];
  }

  function render(){
    return K.Grid(html`
      ${K.Span(12, K.Ledger(() => [
        agendaRows(),
        ...liveRows(),
        ...decisionRows(),
        ...minutesRows(),
      ]))}`);
  }

  const handle = {
    async 'pick-agenda'(el){ S.ui.meetingAgenda = el.dataset.id; ESP.App.render(); },

    async 'run-meeting'(){
      if(canli) return;
      const adaylar = ESP.Office.agendaCandidates();
      const id = S.ui.meetingAgenda || adaylar[0].id;
      canli = { turns:[], done:false };
      ESP.App.render();

      try{
        const rec = await ESP.Office.runMeeting(id, tur => {
          canli.turns.push(tur);
          ESP.App.render();
        });
        canli.done = true;
        S.ui.meetingOpen = rec.id;
        ESP.UI.toast('Toplantı bitti');
      }catch(e){
        console.error(e);
        ESP.UI.toast('Toplantı tamamlanamadı');
      }finally{
        canli = null;
        ESP.App.render();
      }
    },

    async 'toggle-minutes'(el){
      S.ui.meetingOpen = S.ui.meetingOpen === el.dataset.id ? null : el.dataset.id;
      ESP.App.render();
    },

    async 'track-decision'(el){
      const m = (S.officeMeetings || []).find(x => x.id === el.dataset.id);
      if(!m || !m.decision) return;
      await M.saveDecision({ text:m.decision.title, agentId:'patron', source:'meeting' });
      ESP.Memo.bitir();
      ESP.UI.toast('Karar takibe alındı');
      ESP.App.render();
    },

    async 'close-decision'(el){
      const inp = document.getElementById('dec-' + el.dataset.id);
      const sonuc = inp ? inp.value.trim() : '';
      if(!sonuc){
        ESP.UI.toast('Sonuç yazılmadan karar kapanmaz');
        return;
      }
      await M.closeDecision(el.dataset.id, sonuc);
      ESP.Memo.bitir();
      ESP.App.render();
    },
  };

  const change = {};

  return {
    id:'meeting',
    title:'Toplantı',
    headline(){
      const a = ESP.Office.agendaCandidates()[0];
      return a ? 'Gündem: ' + a.label.toLocaleLowerCase('tr-TR') + '.' : 'Toplantı';
    },
    lede(){
      return 'Altı uzman sırayla konuşur, Patron kapatır. Kapanıştaki karar '
           + 'kural motorundan gelir; Patron onu değiştiremez, gerekçelendirir.';
    },
    stats(){
      return [
        { value:String((S.officeMeetings || []).length), label:'toplantı' },
        { value:String(M.openDecisions().length), label:'açık karar' },
        { value:String(ESP.Office.agendaCandidates().length), label:'gündem adayı' },
      ];
    },
    subtitle(){ return (S.officeMeetings || []).length + ' tutanak'; },
    actions(){ return ''; },
    render, handle, change,
  };
})();
