/* Hareket — Modül 3'ün ekranı.

   Ekran üç bölüme ayrılır ve bölümler seçilebilir bir şerittir, ince bir alt
   çizgi değil:

     Bugün     toparlanmaya göre günün yük emri ve seans kaydı
     Program   hareket merdivenleri — kalıba göre ikinci bir şeritle ayrılır
     İlerleme  yük eğrisi, akut/kronik oran, indirme haftası

   Program bölümünde hareketler KALIBA göre ayrılır (itme, çekme, çömelme,
   kalça, gövde, taşıma, dayanıklılık, mobilite). Böylece "bugün ne
   çalışacağım" sorusu tek dokunuşla cevaplanır ve haftada hangi kalıbın
   eksik kaldığı gizlenmez.

   Ekranın kuralı: sistem yükü kendiliğinden azaltabilir ama asla
   kendiliğinden artıramaz. Artırma kararı hep kullanıcınındır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.move = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  const TABS = [
    { id:'bugun',    label:'Bugün',    icon:'today' },
    { id:'program',  label:'Program',  icon:'layers' },
    { id:'ilerleme', label:'İlerleme', icon:'chart' },
  ];

  /* Program bölümünün ikinci şeridi. "Tümü" ilk sırada durur ki kullanıcı
     kalıp seçmeye mecbur kalmasın. */
  function patternTabs(){
    const rows = SP.Move.patternBalance();
    const byId = {};
    rows.forEach(r => { byId[r.pattern.id] = r.count; });
    return [{ id:'all', label:'Tümü' }]
      .concat(SP.PATTERNS.map(p => ({ id:p.id, label:p.label, count:byId[p.id] || null })))
      .concat([
        { id:'cardio',   label:'Dayanıklılık' },
        { id:'mobility', label:'Mobilite' },
      ]);
  }

  function exercisesFor(patternId){
    if(patternId === 'cardio') return SP.EXERCISES.filter(e => e.kind === 'cardio');
    if(patternId === 'mobility') return SP.EXERCISES.filter(e => e.kind === 'mobility');
    if(!patternId || patternId === 'all') return SP.EXERCISES;
    return SP.EXERCISES.filter(e => e.pattern === patternId);
  }

  /* --------------------------------------------------------------- bugün */

  function orderCard(){
    const rx = SP.Move.prescription();
    const tone = rx.kind === 'rest' ? 'danger' : rx.kind === 'full' ? 'ok' : 'warn';
    const r = rx.readiness;

    return K.Card({
      title:'Günün yük emri', hint:'recovery-order',
      sub:'Toparlanma belirler, istek değil',
      badge:K.Badge({ label:'yük ×' + U.fmtNet(rx.factor), tone }),
      body:html`
        ${when(r.ok, () => html`<div class="row wrap" style="gap:18px">
          <div class="kpi">
            <span class="kpi__value">${r.score}</span>
            <span class="kpi__unit">/ 100 · ${r.band.label}</span>
          </div>
          <div class="grow" style="min-width:180px">${K.Bar({ value:r.score, tone:r.band.tone })}</div>
        </div>`)}
        ${map(rx.reasons, x => K.Notice({ tone:x.kind === 'muted' ? 'info' : x.kind, class:'mt-10',
          /* Skor yukarıda büyük yazıyor: bandın gerekçesi kısa hâliyle basılır,
             aynı cümle iki kez görünmez. */
          body:(r.ok && x.id === 'readiness') ? x.short : x.text }))}
        ${when(rx.kind === 'rest', () => K.Notice({ tone:'info', class:'mt-8',
          body:'Bu bir geri adım değil, planın parçası. Asgari gün yine geçerli: '
            + SP.LOAD_RULES.minDay.minutes + ' dakika yürüyüş.' }))}`,
    });
  }

  /* Seans seçimi — şablonlar seçilebilir kart olarak durur.
     Bir düğme satırı hangi seansın önerildiğini gizler; kart hem öneriyi
     hem içeriğini gösterir. */
  function pickSessionCard(){
    const rx = SP.Move.prescription();
    const suggested = rx.suggest.map(t => t.id);
    return K.Card({
      title:'Seans seç', sub:'Öneri toparlanma bandından gelir; istediğini seçebilirsin',
      body:html`
        <div class="picks">${map(SP.SESSION_TEMPLATES, t => html`
          <button class="${cls('pickcard', suggested[0] === t.id && 'is-on')}"
            data-act="start-session" data-id="${t.id}">
            <span class="pickcard__box" aria-hidden="true">${suggested[0] === t.id ? '★' : ''}</span>
            <span class="pickcard__body">
              <span class="pickcard__name">${t.name}
                ${when(suggested.indexOf(t.id) >= 0, () => html`<span class="tiny dim"> · önerilen</span>`)}</span>
              <span class="pickcard__meta">${t.minutes} dk · ${t.items.length} hareket — ${t.note}</span>
            </span>
          </button>`)}
          <button class="pickcard" data-act="start-session" data-id="">
            <span class="pickcard__box" aria-hidden="true"></span>
            <span class="pickcard__body">
              <span class="pickcard__name">Serbest seans</span>
              <span class="pickcard__meta">Hareketleri kendin seç</span>
            </span>
          </button>
        </div>`,
    });
  }

  function todaySessionsCard(){
    const d = U.todayISO();
    const rows = M.workoutsOf(d);
    if(!rows.length){
      return K.Card({ title:'Bugünün seansları',
        body:K.Empty({ text:'Bugün henüz seans kaydı yok. Yukarıdan bir seans seç.' }) });
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
        body:html`${K.Notice({ tone:'info', body:r.note })}`,
        foot:K.Button({ label:'Ölçüm gir', size:'sm', tone:'primary',
          act:'go', data:{ 'data-route':'vitals' } }) });
    }
    return K.Card({
      title:'Toparlanma', hint:'readiness',
      badge:K.Badge({ label:r.band.label, tone:r.band.tone }),
      body:html`
        <div class="kpi"><span class="kpi__value">${r.score}</span><span class="kpi__unit">/ 100</span></div>
        <div class="mt-8">${K.Bar({ value:r.score, tone:r.band.tone })}</div>
        <div class="mt-12">${map(r.parts, p => html`
          <div class="${p.score == null ? 'readypart readypart--off' : 'readypart'}">
            <span class="readypart__label">${p.label}</span>
            <span class="small dim">${p.score == null ? 'girilmedi' : U.fmtNum(U.round(p.value, 1))}</span>
            <span class="readypart__score num">${p.score == null ? '—' : Math.round(p.score)}</span>
          </div>`)}</div>`,
    });
  }

  /* ------------------------------------------------------------- program */

  function ladderCard(ex){
    const p = SP.Move.progressionCheck(ex.id);
    const cur = M.levelIndex(ex.id);
    const pattern = SP.PATTERNS.find(x => x.id === ex.pattern);
    return K.Card({
      title:ex.name,
      sub:(pattern ? pattern.label : ex.kind === 'cardio' ? 'Dayanıklılık' : 'Mobilite')
        + ' · ' + (ex.equip === 'yok' ? 'ekipmansız' : ex.equip),
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
    const missing = rows.filter(r => r.missing).length;
    return K.Card({
      title:'Haftalık kalıp dengesi',
      sub:'Her kalıp haftada en az bir kez',
      badge:missing ? K.Badge({ label:missing + ' eksik', tone:'warn' })
        : K.Badge({ label:'dengeli', tone:'ok' }),
      body:html`${map(rows, r => html`
        <button class="${cls('minrow', !r.missing && 'is-done')}" style="width:100%"
          data-act="pick-pattern" data-id="${r.pattern.id}">
          <span class="minrow__mark">${r.missing ? '' : '✓'}</span>
          <span class="minrow__label"><b>${r.pattern.label}</b>
            <span class="tiny dim"> · ${r.pattern.note}</span></span>
          <span class="minrow__detail num">${r.count}</span>
        </button>`)}`,
      foot:html`<span class="small dim">Bir kalıba dokunarak o kalıbın hareketlerini aç.</span>`,
    });
  }

  /* ------------------------------------------------------------ ilerleme */

  function loadCard(){
    const series = SP.Move.loadSeries(30);
    const a = SP.Move.acwr();
    const g = SP.Move.weeklyGrowth();
    const dl = SP.Move.deloadWeek();
    const top = Math.max(100, Math.max.apply(null, series.map(s => s.value)) * 1.1);

    return K.Card({
      title:'Yük eğrisi', hint:'load',
      sub:'Son 30 gün',
      body:html`
        ${raw(UI.barChart(series.map(s => ({ label:U.fmtShort(s.date), value:s.value })),
          { max:top, height:160, goodAt:0 }))}
        <div class="cols-3 mt-12">
          ${K.Stat({ label:'Bu hafta', value:U.fmtNum(SP.Move.loadWindow(7)), unit:'yük' })}
          ${K.Stat({ label:'Akut/kronik', value:a.ok ? U.fmtNet(a.ratio) : '—',
            tone:a.ok ? (a.zone === 'ok' ? 'ok' : a.zone === 'high' ? 'danger' : 'warn') : null,
            note:a.ok ? a.zone : 'veri yetersiz' })}
          ${K.Stat({ label:'Döngü haftası', value:String(dl.week || 0),
            note:dl.due ? 'indirme haftası' : dl.inCycle + '/' + dl.every })}
        </div>
        ${K.Notice({ tone:a.ok ? a.tone : 'info', class:'mt-12', body:a.note })}
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

  /* Düzenlenen seans kaydedilene kadar burada bekler. */
  let draft = null;

  function sessionSheet(rec){
    const isNew = !S.workouts.some(w => w.id === rec.id);
    const chosen = (rec.items || []).map(i => i.exId);
    UI.sheet({
      title:isNew ? 'Seans ekle' : 'Seansı düzenle', subtitle:rec.name, wide:true,
      body:String(K.Stack([
        html`<div class="cols-2">
          ${K.Field({ label:'Süre (dakika)',
            input:K.Input({ id:'w-min', type:'number', numeric:true, min:1, step:'5', value:rec.minutes }) })}
          ${K.Field({ label:'Algılanan zorluk (1–10)', hint:'boş bırakılırsa MET değerinden hesaplanır',
            input:K.Input({ id:'w-rpe', type:'number', numeric:true, min:1, max:10, step:'1',
              value:rec.rpe == null ? '' : rec.rpe }) })}
        </div>`,
        html`<h3 class="section-h">Hareketler
          <span class="tiny dim">· ${chosen.length} seçili</span></h3>`,
        /* Uzun bir onay listesi yerine seçilebilir kartlar. Kalıp her kartın
           kendi satırında yazar: kalıba göre ayrı ayrı bölmek on bir hareket
           için gereksiz yere uzun bir kağıt üretiyordu. */
        html`<div class="picks">${map(SP.EXERCISES, ex => {
          const lvl = SP.EX_BY_ID[ex.id].levels.find(l => l.id === M.currentLevel(ex.id));
          const pattern = SP.PATTERNS.find(x => x.id === ex.pattern);
          const group = pattern ? pattern.label
            : ex.kind === 'cardio' ? 'Dayanıklılık' : 'Mobilite';
          return K.PickCard({
            label:ex.name,
            meta:group + ' · ' + (lvl ? lvl.name : '') + ' · hedef ' + (lvl ? lvl.to : '—'),
            on:chosen.indexOf(ex.id) >= 0,
            act:'toggle-ex', data:{ 'data-id':rec.id, 'data-ex':ex.id },
          });
        })}</div>`,
        K.Field({ label:'Not', input:K.Textarea({ id:'w-note', rows:2, value:rec.note || '' }) }),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-session', data:{ 'data-id':rec.id } })}`),
      noFocus:true,
    });
  }

  /* --------------------------------------------------------------- ekran */

  function toolbar(tab){
    const done = M.workoutsOf(U.todayISO()).length;
    const items = TABS.map(t => Object.assign({}, t,
      t.id === 'bugun' && done ? { count:done } : {}));
    return K.Toolbar({
      tabs:K.Subtabs({ items, value:tab, act:'move-tab', aria:'Hareket görünümü' }),
      actions:K.Button({ label:'Seans ekle', icon:'plus', size:'sm', tone:'primary',
        act:'start-session', data:{ 'data-id':'' } }),
    });
  }

  async function render(){
    const tab = S.ui.moveTab;

    if(tab === 'program'){
      const pat = S.ui.movePattern || 'all';
      const list = exercisesFor(pat);
      return String(K.Grid([
        K.Span(12, toolbar(tab)),
        K.Span(12, K.Subtabs({ items:patternTabs(), value:pat, act:'pick-pattern-tab',
          aria:'Hareket kalıbı' })),
        K.Span(8, K.Stack(list.length
          ? map(list, ladderCard)
          : [K.Card({ body:K.Empty({ text:'Bu kalıpta tanımlı hareket yok.' }) })])),
        K.Span(4, K.Stack([balanceCard(),
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
        K.Span(12, toolbar(tab)),
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
      K.Span(12, toolbar(tab)),
      K.Span(8, K.Stack([orderCard(), pickSessionCard(), todaySessionsCard()])),
      K.Span(4, K.Stack([readyCard(), balanceCard()])),
      K.Span(12, raw(UI.rail(['recovery-order', 'readiness', 'load', 'progression']))),
    ]));
  }

  const handle = {
    async 'move-tab'(el){ S.ui.moveTab = el.dataset.tab; SP.App.render(); },
    async 'pick-pattern-tab'(el){ S.ui.movePattern = el.dataset.tab; SP.App.render(); },
    async 'pick-pattern'(el){
      S.ui.moveTab = 'program';
      S.ui.movePattern = el.dataset.id;
      SP.App.render();
    },
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
      /* Kağıdı yeniden çiz ki seçim anında görünsün; girilen süre ve zorluk
         kaybolmasın diye önce okunur. */
      const min = document.getElementById('w-min');
      const rpe = document.getElementById('w-rpe');
      const note = document.getElementById('w-note');
      if(min) draft.minutes = Number(min.value) || draft.minutes;
      if(rpe) draft.rpe = rpe.value.trim() === '' ? null : Number(rpe.value);
      if(note) draft.note = note.value;
      sessionSheet(draft);
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
      const cur = M.currentLevel(ex.id);
      UI.sheet({ title:ex.name, subtitle:'Basamak seç', wide:true,
        body:String(html`
          <p class="small muted">${ex.cue}</p>
          <div class="picks mt-12">${map(ex.levels, (l, i) => K.PickCard({
            label:(i + 1) + '. ' + l.name, meta:'hedef ' + l.to,
            on:l.id === cur,
            act:'set-level', data:{ 'data-id':ex.id, 'data-level':l.id },
          }))}</div>`),
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
    actions(){ return ''; },
    render, handle,
  };
})();
