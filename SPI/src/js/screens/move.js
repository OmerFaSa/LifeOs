/* Hareket — Modül 3'ün ekranı.

   Üç sekme:
     Bugün     toparlanmaya göre günün yük emri ve seans kaydı
     Program   hareket merdivenleri ve kalıp dengesi
     İlerleme  yük eğrisi, akut/kronik oran, indirme haftası

   Ekranın kuralı: sistem yükü kendiliğinden azaltabilir ama asla
   kendiliğinden artıramaz. Artırma kararı hep kullanıcınındır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.move = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  const TABS = [
    { id:'bugun', label:'Bugün' },
    { id:'program', label:'Program' },
    { id:'ilerleme', label:'İlerleme' },
  ];

  /* --------------------------------------------------------------- bugun */

  function orderCard(){
    const rx = SP.Move.prescription();
    const tone = rx.kind === 'rest' ? 'danger' : rx.kind === 'full' ? 'ok' : 'warn';
    return K.Card({
      title:'Günün yük emri', hint:'recovery-order',
      sub:'Toparlanma belirler, istek değil',
      badge:K.Badge({ label:'yük ×' + U.fmtNet(rx.factor), tone }),
      body:html`
        ${map(rx.reasons, r => K.Notice({ tone:r.kind === 'muted' ? 'info' : r.kind, body:r.text, class:'mt-4' }))}
        ${when(rx.kind === 'rest', () => K.Notice({ tone:'info', class:'mt-8',
          body:'Bu bir geri adım değil, planın parçası. Asgari gün yine geçerli: '
            + SP.LOAD_RULES.minDay.minutes + ' dakika yürüyüş.' }))}
        <div class="row wrap mt-12">${map(rx.suggest, t => K.Button({
          label:t.name + ' · ' + t.minutes + ' dk', size:'sm',
          tone:rx.suggest[0] === t ? 'primary' : null,
          act:'start-session', data:{ 'data-id':t.id } }))}</div>`,
      foot:html`<span class="small dim">Öneri toparlanma bandından gelir; istediğin seansı yine seçebilirsin.</span>`,
    });
  }

  function todaySessionsCard(){
    const d = U.todayISO();
    const rows = M.workoutsOf(d);
    if(!rows.length){
      return K.Card({ title:'Bugünün seansları',
        body:P.empty('Bugün henüz seans kaydı yok.', 'Serbest seans ekle', 'start-session',
          { 'data-id':'' }) });
    }
    return K.Card({
      title:'Bugünün seansları', sub:rows.length + ' seans',
      badge:K.Badge({ label:U.sum(rows.map(SP.Move.sessionLoad)) + ' yük', tone:'info' }),
      body:html`<div class="list">${map(rows, w => html`
        <div class="listitem">
          <div class="grow">
            <b class="small">${w.name}</b>
            <div class="tiny dim">${w.minutes} dk
              ${when(w.rpe, () => html`· zorluk ${w.rpe}/10`)}
              · yük ${SP.Move.sessionLoad(w)}
              · ${(w.items || []).length} hareket</div>
          </div>
          ${K.Button({ label:'Düzenle', size:'sm', act:'edit-session', data:{ 'data-id':w.id } })}
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'Sil',
            act:'del-session', data:{ 'data-id':w.id } })}
        </div>`)}</div>`,
    });
  }

  function readyCard(){
    const r = SP.Move.readiness();
    if(!r.ok){
      return K.Card({ title:'Toparlanma', hint:'readiness',
        body:html`${K.Notice({ tone:'info', body:r.note })}
          <div class="mt-10">${K.Button({ label:'Ölçüm gir', size:'sm', tone:'primary',
            act:'go', data:{ 'data-route':'vitals' } })}</div>` });
    }
    return K.Card({
      title:'Toparlanma', hint:'readiness',
      badge:K.Badge({ label:r.score + '/100', tone:r.band.tone }),
      body:html`${K.Meter({ label:r.band.label, value:r.score, text:String(r.score), tone:r.band.tone })}
        <div class="mt-10">${map(r.parts, p => html`
          <div class="${p.score == null ? 'readypart readypart--off' : 'readypart'}">
            <span class="readypart__label">${p.label}</span>
            <span class="small dim">${p.score == null ? 'girilmedi' : U.fmtNum(p.value)}</span>
            <span class="readypart__score num">${p.score == null ? '—' : Math.round(p.score)}</span>
          </div>`)}</div>` });
  }

  /* -------------------------------------------------------------- program */

  function ladderCard(ex){
    const p = SP.Move.progressionCheck(ex.id);
    const cur = SP.Model.levelIndex(ex.id);
    return K.Card({
      title:ex.name,
      sub:(SP.PATTERNS.find(x => x.id === ex.pattern) || {}).label || ex.kind,
      badge:p.ready ? K.Badge({ label:'üst basamak açık', tone:'ok' })
        : K.Badge({ label:p.sessions + '/' + p.needed + ' seans', tone:'muted' }),
      body:html`
        <p class="small muted">${ex.cue}</p>
        <div class="ladder">${map(ex.levels, (l, i) => html`
          <div class="${cls('ladderstep', i < cur && 'is-done', i === cur && 'is-current')}">
            <span class="ladderstep__no">${i + 1}</span>
            <span>${l.name}</span>
            <span class="ladderstep__to">${l.to}</span>
          </div>`)}</div>
        <p class="small mt-10">${p.note}</p>`,
      foot:html`
        ${when(p.ready, () => K.Button({ label:'Üst basamağa geç', size:'sm', tone:'primary',
          act:'advance', data:{ 'data-id':ex.id } }))}
        ${K.Button({ label:'Basamağı seç', size:'sm', act:'pick-level', data:{ 'data-id':ex.id } })}`,
    });
  }

  function balanceCard(){
    const rows = SP.Move.patternBalance();
    return K.Card({
      title:'Haftalık kalıp dengesi',
      sub:'Her kalıp haftada en az bir kez',
      body:html`${K.Table({ tight:true, headers:['Kalıp', { label:'Bu hafta', num:true }, 'Durum'],
        rows:rows.map(r => [
          html`<b>${r.pattern.label}</b> <span class="tiny dim">${r.pattern.note}</span>`,
          String(r.count),
          r.missing ? K.Badge({ label:'eksik', tone:'warn' }) : K.Badge({ label:'var', tone:'ok' }),
        ]) })}` });
  }

  /* ------------------------------------------------------------- ilerleme */

  function loadCard(){
    const series = SP.Move.loadSeries(30);
    const a = SP.Move.acwr();
    const g = SP.Move.weeklyGrowth();
    const dl = SP.Move.deloadWeek();

    return K.Card({
      title:'Yük eğrisi', hint:'load',
      sub:'Son 30 gün',
      body:html`
        ${raw(UI.barChart(series.map(s => ({ label:U.fmtShort(s.date), value:s.value })),
          { max:Math.max(100, Math.max.apply(null, series.map(s => s.value)) * 1.1), height:160, goodAt:0 }))}
        <div class="cols-3 mt-12">
          ${K.Stat({ label:'Bu hafta', value:U.fmtNum(SP.Move.loadWindow(7)), unit:'yük' })}
          ${K.Stat({ label:'Akut/kronik', value:a.ok ? U.fmtNet(a.ratio) : '—',
            note:a.ok ? a.zone : 'veri yetersiz' })}
          ${K.Stat({ label:'Hafta', value:dl.due ? String(dl.week) : String(dl.week || 0),
            note:dl.due ? 'indirme haftası' : 'normal' })}
        </div>
        ${K.Notice({ tone:a.ok ? a.tone : 'info', class:'mt-12', body:a.ok ? a.note : a.note })}
        ${when(g.ok, () => K.Notice({ tone:g.over ? 'warn' : 'info', class:'mt-8',
          body:'Geçen haftaya göre değişim %' + Math.round(g.growth * 100) + '. ' + g.note }))}
        ${when(dl.due, () => K.Notice({ tone:'warn', class:'mt-8', body:dl.note }))}`,
    });
  }

  function historyCard(){
    const rows = S.workouts.slice(-20).reverse();
    if(!rows.length) return null;
    return K.Card({ title:'Seans geçmişi', sub:S.workouts.length + ' kayıt',
      body:K.Table({ tight:true,
        headers:['Tarih', 'Seans', { label:'Dakika', num:true }, { label:'Yük', num:true }],
        rows:rows.map(w => [U.fmtShort(w.date), w.name, String(w.minutes),
          String(SP.Move.sessionLoad(w))]) }) });
  }

  /* -------------------------------------------------------------- sheet'ler */

  function sessionSheet(rec){
    const isNew = !S.workouts.some(w => w.id === rec.id);
    UI.sheet({
      title:isNew ? 'Seans ekle' : 'Seansı düzenle', subtitle:rec.name, wide:true,
      body:String(K.Stack([
        html`<div class="cols-2">
          ${K.Field({ label:'Süre (dakika)',
            input:K.Input({ id:'w-min', type:'number', numeric:true, min:1, step:'5', value:rec.minutes }) })}
          ${K.Field({ label:'Algılanan zorluk (1–10)', hint:'boş bırakılırsa MET\'ten hesaplanır',
            input:K.Input({ id:'w-rpe', type:'number', numeric:true, min:1, max:10, step:'1',
              value:rec.rpe == null ? '' : rec.rpe }) })}
        </div>`,
        html`<h3 class="section-h">Hareketler</h3>`,
        html`<div class="stack-xs">${map(SP.EXERCISES, ex => {
          const on = (rec.items || []).some(i => i.exId === ex.id);
          const lvl = SP.EX_BY_ID[ex.id].levels.find(l => l.id === M.currentLevel(ex.id));
          return K.Checkbox({ label:ex.name + ' — ' + (lvl ? lvl.name : ''), checked:on,
            act:'toggle-ex', data:{ 'data-id':rec.id, 'data-ex':ex.id } });
        })}</div>`,
        K.Field({ label:'Not', input:K.Textarea({ id:'w-note', rows:2, value:rec.note || '' }) }),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-session', data:{ 'data-id':rec.id } })}`),
      noFocus:true,
    });
  }

  /* Duzenlenen seans kaydedilene kadar burada bekler. */
  let draft = null;

  async function render(){
    const tab = S.ui.moveTab;
    if(tab === 'program'){
      return String(K.Grid([
        K.Span(12, K.Subtabs({ items:TABS, value:tab, act:'move-tab', aria:'Hareket görünümü' })),
        K.Span(8, K.Stack(map(SP.EXERCISES.filter(e => e.kind !== 'mobility'), ladderCard))),
        K.Span(4, K.Stack([balanceCard(),
          K.Card({ title:'Mobilite akışları',
            body:html`<div class="list">${map(SP.EXERCISES.filter(e => e.kind === 'mobility'), e => html`
              <div class="listitem"><div class="grow"><b class="small">${e.name}</b>
                <div class="tiny dim">${e.cue}</div></div></div>`)}</div>` }),
          K.Card({ title:'İlerleme kuralı', hint:'progression',
            body:html`<p class="small muted">Bir üst basamak, mevcut basamakta son
              ${SP.Move.ADVANCE_WINDOW} günde ${SP.Move.ADVANCE_SESSIONS} seans yapıldığında açılır.
              Sistem basamak atlatmaz: aşırı yüklenmenin en yaygın sebebi budur.</p>` }),
        ])),
        K.Span(12, raw(UI.rail(['progression', 'load', 'deload']))),
      ]));
    }
    if(tab === 'ilerleme'){
      return String(K.Grid([
        K.Span(12, K.Subtabs({ items:TABS, value:tab, act:'move-tab', aria:'Hareket görünümü' })),
        K.Span(8, K.Stack([loadCard(), historyCard()])),
        K.Span(4, K.Stack([balanceCard(),
          K.Card({ title:'Yük nasıl hesaplanır?',
            body:html`<p class="small muted">Seans yükü süre × zorluktur. Zorluk önce senin
              bildirdiğin algılanan zorluktan (1–10), yoksa hareketlerin MET ortalamasından gelir.
              İkisi de yoksa seans yük üretmez — uydurulmuş yük yazılmaz.</p>` }),
        ])),
        K.Span(12, raw(UI.rail(['load', 'deload', 'recovery-order']))),
      ]));
    }
    return String(K.Grid([
      K.Span(12, K.Subtabs({ items:TABS, value:tab, act:'move-tab', aria:'Hareket görünümü' })),
      K.Span(8, K.Stack([orderCard(), todaySessionsCard()])),
      K.Span(4, K.Stack([readyCard(), balanceCard()])),
      K.Span(12, raw(UI.rail(['recovery-order', 'readiness', 'load', 'progression']))),
    ]));
  }

  const handle = {
    async 'move-tab'(el){ S.ui.moveTab = el.dataset.tab; SP.App.render(); },
    async 'start-session'(el){
      draft = M.newWorkout(U.todayISO(), el.dataset.id || null);
      sessionSheet(draft);
    },
    async 'edit-session'(el){
      draft = S.workouts.find(w => w.id === el.dataset.id);
      if(draft) sessionSheet(draft);
    },
    async 'toggle-ex'(el){
      if(!draft) return;
      const exId = el.dataset.ex;
      draft.items = draft.items || [];
      const i = draft.items.findIndex(x => x.exId === exId);
      if(i >= 0) draft.items.splice(i, 1);
      else draft.items.push({ exId, levelId:M.currentLevel(exId), sets:3, reps:null, minutes:null });
    },
    async 'save-session'(el){
      if(!draft) return;
      const min = document.getElementById('w-min');
      const rpe = document.getElementById('w-rpe');
      const note = document.getElementById('w-note');
      draft.minutes = min ? Number(min.value) || 0 : draft.minutes;
      draft.rpe = rpe && rpe.value.trim() !== '' ? Number(rpe.value) : null;
      draft.note = note ? note.value.trim() : '';
      if(!draft.minutes){ UI.toast('Süre gir'); return; }
      await M.saveWorkout(draft);
      draft = null;
      UI.closeSheet();
      UI.toast('Seans kaydedildi');
      SP.App.render();
    },
    async 'del-session'(el){
      const id = el.dataset.id;
      UI.confirmSheet('Seansı sil', 'Bu seans ve ürettiği yük kaydından silinir.',
        async () => { await M.deleteWorkout(id); UI.closeSheet(); SP.App.render(); }, true);
    },
    async advance(el){
      const res = await M.advanceLevel(el.dataset.id);
      UI.toast(res.ok ? 'Yeni basamak: ' + res.level.name : res.error);
      SP.App.render();
    },
    async 'pick-level'(el){
      const ex = SP.EX_BY_ID[el.dataset.id];
      UI.sheet({ title:ex.name, subtitle:'Basamak seç',
        body:String(html`<div class="stack-xs">${map(ex.levels, (l, i) => K.Button({
          label:(i + 1) + '. ' + l.name + ' — hedef ' + l.to, block:true, size:'sm',
          tone:l.id === M.currentLevel(ex.id) ? 'primary' : null,
          act:'set-level', data:{ 'data-id':ex.id, 'data-level':l.id } }))}</div>`),
        footer:String(K.Button({ label:'Kapat', act:'sheet-close' })), noFocus:true });
    },
    async 'set-level'(el){
      await M.setLevel(el.dataset.id, el.dataset.level);
      UI.closeSheet();
      UI.toast('Basamak güncellendi');
      SP.App.render();
    },
  };

  return {
    id:'move',
    title:'Hareket',
    subtitle(){
      const rx = SP.Move.prescription();
      if(!rx.readiness.ok) return 'Ölçüm bekliyor';
      return rx.readiness.band.label + ' · yük ×' + U.fmtNet(rx.factor)
        + (rx.done ? ' · ' + rx.done + ' seans yapıldı' : '');
    },
    actions(){
      return String(K.Button({ label:'Seans ekle', size:'sm', icon:'dumbbell',
        act:'start-session', data:{ 'data-id':'' } }));
    },
    render, handle,
  };
})();
