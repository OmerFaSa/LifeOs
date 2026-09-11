/* Hareket — Modül 3'ün ekranı.

   Ekran ALANLARA ayrılır. Kullanıcı gününü planlarken "bugün hangi kalıbı
   çalışayım" diye değil, "kardiyo mu yapayım, kuvvet mi, yoksa dinleneyim
   mi" diye düşünür. Sekmeler o soruyu karşılar:

     Bugün      toparlanmaya göre günün yük emri ve seans kaydı
     Kardiyo    yürüyüş, koşu, evde sprint
     Kuvvet     vücut ağırlığıyla altı kalıp — kendi içinde ikinci şeritle ayrılır
     Esneklik   mobilite akışları
     Dinlenme   yükün diğer yarısı: indirme haftası, boş gün, uyku
     İlerleme   yük eğrisi, son hafta / son ay oranı

   Dinlenmenin kendi sayfası olması kasıtlıdır. Antrenman programlarında
   dinlenme çoğu zaman "yapılmayan şey" olarak geçer ve görünmez olur;
   burada görünür, çünkü yük yönetiminin yarısı odur.

   Ekranın kuralı: sistem yükü kendiliğinden azaltabilir ama asla
   kendiliğinden artıramaz. Artırma kararı hep kullanıcınındır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.move = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  /* Sekmeler: iki genel görünüm ve arada dört faaliyet alanı. */
  const TABS = [{ id:'bugun', label:'Bugün', icon:'today' }]
    .concat(SP.AREAS.map(a => ({ id:a.id, label:a.label, icon:a.icon })))
    .concat([{ id:'ilerleme', label:'İlerleme', icon:'chart' }]);

  /* Kuvvet alanının ikinci şeridi: hareket kalıpları. Yalnız kuvvette
     çizilir — kardiyoda ve esneklikte kalıp yoktur, orada şerit çizmek
     boş bir seçim sunmak olurdu. */
  function patternTabs(){
    const rows = SP.Move.patternBalance();
    const byId = {};
    rows.forEach(r => { byId[r.pattern.id] = r.count; });
    return [{ id:'all', label:'Tümü', count:SP.EXERCISES.filter(e => e.kind === 'strength').length }]
      .concat(SP.PATTERNS.map(p => ({ id:p.id, label:p.label, count:byId[p.id] || null })));
  }

  function exercisesOfArea(areaId){
    const area = SP.AREA_BY_ID[areaId];
    if(!area || !area.kind) return [];
    const list = SP.EXERCISES.filter(e => e.kind === area.kind);
    if(areaId !== 'kuvvet') return list;
    const pat = S.ui.movePattern || 'all';
    return pat === 'all' ? list : list.filter(e => e.pattern === pat);
  }

  /* --------------------------------------------------------------- bugün */

  function orderEntry(){
    const rx = SP.Move.prescription();
    const r = rx.readiness;
    return K.Entry({
      label:'Günün yük emri', hint:'recovery-order',
      meta:rx.factor >= 1 ? 'tam yük' : 'yükün %' + Math.round(rx.factor * 100) + '\u2019i',
      note:'Emri toparlanma belirler, istek değil. Sistem yükü kendiliğinden '
        + 'azaltabilir ama asla kendiliğinden artıramaz.',
      action:when(!r.ok, () => K.Button({ label:'Veri gir', tone:'primary',
        act:'go', data:{ 'data-route':'today' } })),
      body:html`
        ${when(r.ok, () => html`<div class="row wrap" style="gap:26px">
          ${raw(UI.gauge(r.score, { tone:r.band.tone, label:r.band.label, size:122,
            bands:SP.READINESS_BANDS.map(b => b.min).filter(x => x > 0) }))}
          <p class="grow small" style="min-width:210px">${r.band.order}</p>
        </div>`)}
        ${map(rx.reasons, x => K.Notice({ tone:x.kind === 'muted' ? 'info' : x.kind,
          body:(r.ok && x.id === 'readiness') ? x.short : x.text }))}
        ${when(rx.kind === 'rest', () => K.Notice({ tone:'info',
          body:'Bu bir geri adım değil, planın parçası. Asgari gün yine geçerli: '
            + SP.LOAD_RULES.minDay.minutes + ' dakika yürüyüş.' }))}`,
    });
  }

  function pickSessionEntry(){
    const rx = SP.Move.prescription();
    const suggested = rx.suggest.map(t => t.id);
    return K.Entry({
      label:'Seans seç',
      meta:SP.SESSION_TEMPLATES.length + ' şablon',
      note:'Öneri toparlanma bandından gelir; istediğini seçebilirsin.',
      body:html`<div class="picks">${map(SP.SESSION_TEMPLATES, t => html`
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

  function todaySessionsEntry(){
    const d = U.todayISO();
    const rows = M.workoutsOf(d);
    if(!rows.length){
      return K.Entry({ label:'Bugünün seansları', meta:'kayıt yok',
        body:P.empty('Bugün henüz seans kaydı yok. Yukarıdan bir seans seç.') });
    }
    return K.Entry({
      label:'Bugünün seansları',
      meta:rows.length + ' seans · ' + U.sum(rows.map(SP.Move.sessionLoad)) + ' yük',
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

  function balanceBody(){
    const rows = SP.Move.patternBalance();
    return html`${map(rows, r => html`
      <button class="${cls('minrow', !r.missing && 'is-done')}" style="width:100%"
        data-act="pick-pattern" data-id="${r.pattern.id}">
        <span class="minrow__mark">${r.missing ? '' : '✓'}</span>
        <span class="minrow__label"><b>${r.pattern.label}</b>
          <span class="tiny dim"> · ${r.pattern.note}</span></span>
        <span class="minrow__detail num">${r.count}</span>
      </button>`)}`;
  }

  /* Merdiven artık kart değil: ince çizgiyle ayrılan bir blok. */
  function ladderBlock(ex){
    const pr = SP.Move.progressionCheck(ex.id);
    const cur = M.levelIndex(ex.id);
    const pattern = SP.PATTERNS.find(x => x.id === ex.pattern);
    return html`
      <div class="ladderblk">
        <div class="ladderblk__head">
          <div class="minw0">
            <b class="ladderblk__name">${ex.name}</b>
            <span class="tiny dim">${pattern ? pattern.label
              : ex.kind === 'cardio' ? 'Dayanıklılık' : 'Mobilite'}
              · ${ex.equip === 'yok' ? 'ekipmansız' : ex.equip}</span>
          </div>
          ${pr.ready ? K.Badge({ label:'üst basamak açık', tone:'ok' })
            : K.Badge({ label:pr.sessions + '/' + pr.needed + ' seans', tone:'muted' })}
        </div>
        <p class="small muted">${ex.cue}</p>
        <div class="ladder">${map(ex.levels, (l, i) => html`
          <div class="${cls('ladderstep', i < cur && 'is-done', i === cur && 'is-current')}">
            <span class="ladderstep__no">${i + 1}</span>
            <span>${l.name}</span>
            <span class="ladderstep__to">${l.to}</span>
          </div>`)}</div>
        <div class="ladderblk__foot">
          <span class="small dim">${pr.note}</span>
          <span class="row-sm">
            ${when(pr.ready, () => K.Button({ label:'Üst basamağa geç', size:'sm', tone:'primary',
              act:'advance', data:{ 'data-id':ex.id } }))}
            ${K.Button({ label:'Basamak seç', size:'sm', act:'pick-level', data:{ 'data-id':ex.id } })}
          </span>
        </div>
      </div>`;
  }

  /* ---------------------------------------------------------- alanlar */

  /* Bir faaliyet alanının sayfası: alanın ne olduğu, o alandaki hareket
     merdivenleri ve alana özel kural. */
  function areaView(areaId){
    const area = SP.AREA_BY_ID[areaId];
    const list = exercisesOfArea(areaId);
    const rx = SP.Move.prescription();

    return K.Ledger([
      when(areaId === 'kardiyo', () => K.Entry({
        label:'Haftalık süre', hint:'load', meta:'%10 kuralı',
        note:area.note, body:cardioBody(),
      })),

      when(areaId === 'esneklik' && rx.kind !== 'full', () => K.Entry({
        label:'Bugün için', meta:'toparlanma bandı',
        body:K.Notice({ tone:'info',
          body:'Toparlanma ' + (rx.readiness.ok ? rx.readiness.band.label.toLocaleLowerCase('tr-TR')
            : 'ölçülmedi') + '. Esneklik akışı ağır antrenmanın yerine geçebilir; '
            + 'yük üretmez ama zinciri kırmaz.' }),
      })),

      K.Entry({
        label:area.label,
        meta:list.length + ' hareket',
        note:area.note,
        action:K.Button({ label:'Seans ekle', icon:'plus', tone:'primary',
          act:'start-area', data:{ 'data-area':areaId } }),
        body:html`
          ${when(areaId === 'kuvvet', () => K.Subtabs({ items:patternTabs(),
            value:S.ui.movePattern || 'all', act:'pick-pattern-tab', aria:'Hareket kalıbı' }))}
          ${when(!list.length, () => P.empty('Bu kalıpta tanımlı hareket yok.'))}
          <div class="ladders">${map(list, ladderBlock)}</div>`,
      }),

      when(areaId === 'kuvvet', () => K.Entry({
        label:'Kalıp dengesi', meta:'haftalık', body:balanceBody(),
      })),

      K.Entry({
        label:'İlerleme kuralı', hint:'progression',
        meta:SP.Move.ADVANCE_SESSIONS + ' seans / ' + SP.Move.ADVANCE_WINDOW + ' gün',
        body:html`<p class="small muted">Bir üst basamak, mevcut basamakta son
          ${SP.Move.ADVANCE_WINDOW} günde ${SP.Move.ADVANCE_SESSIONS} seans yapıldığında açılır.
          Sistem basamak atlatmaz: aşırı yüklenmenin en yaygın sebebi budur.</p>`,
      }),
    ]);
  }

  function cardioBody(){
    const ids = SP.EXERCISES.filter(e => e.kind === 'cardio').map(e => e.id);
    const days = U.lastDays(14);
    let thisWeek = 0, lastWeek = 0;
    days.forEach((d, i) => {
      const mins = M.workoutsOf(d).filter(w => (w.items || []).some(it => ids.indexOf(it.exId) >= 0))
        .reduce((a, w) => a + (w.minutes || 0), 0);
      if(i >= 7) thisWeek += mins; else lastWeek += mins;
    });
    const cap = Math.round(lastWeek * 1.1);
    return html`
      <div class="cols-3">
        ${K.Stat({ label:'Bu hafta', value:String(thisWeek), unit:'dk' })}
        ${K.Stat({ label:'Geçen hafta', value:String(lastWeek), unit:'dk' })}
        ${K.Stat({ label:'Bu haftanın tavanı', value:lastWeek ? String(cap) : '—', unit:'dk',
          note:lastWeek ? '%10 kuralı' : 'geçen hafta veri yok' })}
      </div>
      ${K.Notice({ tone:lastWeek && thisWeek > cap ? 'warn' : 'info',
        body:lastWeek
          ? (thisWeek > cap
            ? 'Bu hafta geçen haftanın %10 üstünü aştı. Süreyi artırmak yerine tempoyu koru.'
            : SP.LOAD_RULES.weeklyGrowth.note)
          : 'Geçen hafta kardiyo kaydı yok; tavan hesaplanmadı. Eksik veri sıfır sayılmaz.' })}`;
  }

  /* ---------------------------------------------------------- dinlenme

     Dinlenme sayfası yeni bir kural icat etmez; var olan kuralların
     dinlenmeye bakan yüzünü tek yerde toplar: toparlanma bandı, indirme
     haftası, son hafta / son ay oranı, uyku ve boş gün sayısı. */
  function restView(){
    const r = SP.Move.readiness();
    const rx = SP.Move.prescription();
    const dl = SP.Move.deloadWeek();
    const a = SP.Move.acwr();
    const days = U.lastDays(7);
    const off = days.filter(d => !M.workoutsOf(d).length).length;
    const sleepVals = days.map(d => (S.vitals[d] || {}).sleep).filter(v => v != null);
    const avgSleep = sleepVals.length ? U.round(U.sum(sleepVals) / sleepVals.length, 1) : null;

    return K.Ledger([
      K.Entry({
        label:'Bugün dinlenmeli misin?', hint:'recovery-order',
        meta:rx.kind === 'rest' ? 'evet' : rx.kind === 'full' ? 'hayır' : 'hafiflet',
        note:SP.AREA_BY_ID.dinlenme.note + ' Kazanç antrenmanda değil, antrenmandan '
          + 'sonraki toparlanmada oluşur.',
        action:when(!r.ok, () => K.Button({ label:'Veri gir', tone:'primary',
          act:'go', data:{ 'data-route':'today' } })),
        body:html`
          ${when(r.ok, () => html`<div class="row wrap" style="gap:26px">
            ${raw(UI.gauge(r.score, { tone:r.band.tone, label:r.band.label, size:122,
              bands:SP.READINESS_BANDS.map(b => b.min).filter(x => x > 0) }))}
            <p class="grow small" style="min-width:210px">${r.band.order}</p>
          </div>`)}
          ${when(!r.ok, () => K.Notice({ tone:'info', body:r.note }))}
          ${when(rx.kind === 'rest', () => K.Notice({ tone:'info',
            body:'Tam dinlenme günü de boş değildir: asgari gün geçerli — '
              + SP.LOAD_RULES.minDay.minutes + ' dakika yürüyüş ve bir mobilite akışı.' }))}`,
      }),

      K.Entry({
        label:'İndirme haftası', hint:'deload',
        meta:!dl.started ? 'başlamadı' : dl.due ? 'bu hafta' : dl.inCycle + '/' + dl.every,
        note:SP.LOAD_RULES.deload.note,
        body:html`<p class="small">${dl.note}</p>`,
      }),

      K.Entry({
        label:'Son yedi gün', meta:off + ' boş gün',
        note:'Yük eğrisi yalnız yapılan işi değil, yapılmayanı da sayar. Üst üste '
          + 'boş geçen günler kondisyonu düşürür; hiç boş geçmeyen haftalar son '
          + 'haftayı son aya göre şişirir. İkisi de aynı ölçüde izlenir.',
        body:html`<div class="cols-3">
          ${K.Stat({ label:'Boş gün', value:String(off), unit:'/ 7',
            note:off === 0 ? 'hiç boş gün yok' : off >= 5 ? 'çok az seans' : 'dengeli' })}
          ${K.Stat({ label:'Ortalama uyku',
            value:avgSleep == null ? '—' : U.fmtNum(avgSleep), unit:'saat',
            note:avgSleep == null ? 'girilmedi' : sleepVals.length + ' gün girildi' })}
          ${K.Stat({ label:'Son hafta / son ay', value:a.ok ? U.fmtNet(a.ratio) : '—',
            tone:a.ok ? (a.zone === 'ok' ? 'ok' : a.zone === 'high' ? 'danger' : 'warn') : null,
            note:a.ok ? (a.zone === 'ok' ? 'normal' : a.zone === 'high' ? 'ağır' : 'hafif')
              : 'veri yetersiz' })}
        </div>`,
      }),
    ]);
  }

  /* ------------------------------------------------------------ ilerleme */

  function loadBody(){
    const series = SP.Move.loadSeries(30);
    const a = SP.Move.acwr();
    const g = SP.Move.weeklyGrowth();
    const dl = SP.Move.deloadWeek();
    const top = Math.max(100, Math.max.apply(null, series.map(s2 => s2.value)) * 1.1);

    return html`
      ${raw(UI.barChart(series.map(s2 => ({ label:U.fmtShort(s2.date), value:s2.value })),
        { max:top, height:170, goodAt:0 }))}
      <div class="cols-3">
        ${K.Stat({ label:'Bu hafta', value:U.fmtNum(SP.Move.loadWindow(7)), unit:'yük' })}
        ${K.Stat({ label:'Son hafta / son ay', value:a.ok ? U.fmtNet(a.ratio) : '—',
          tone:a.ok ? (a.zone === 'ok' ? 'ok' : a.zone === 'high' ? 'danger' : 'warn') : null,
          note:a.ok ? (a.zone === 'ok' ? 'normal' : a.zone === 'high' ? 'ağır' : 'hafif')
            : 'veri yetersiz' })}
        ${K.Stat({ label:'Döngü haftası', value:dl.started ? String(dl.week) : '—',
          note:!dl.started ? 'başlamadı' : dl.due ? 'indirme haftası' : dl.inCycle + '/' + dl.every })}
      </div>
      ${K.Notice({ tone:a.ok ? a.tone : 'info', body:a.note })}
      ${when(g.ok, () => K.Notice({ tone:g.over ? 'warn' : 'info',
        body:'Geçen haftaya göre değişim %' + Math.round(g.growth * 100) + '. ' + g.note }))}
      ${when(dl.due, () => K.Notice({ tone:'warn', body:dl.note }))}`;
  }

  function historyBody(){
    const rows = S.workouts.slice(-20).reverse();
    if(!rows.length) return P.empty('Henüz seans kaydı yok.');
    return K.Table({ tight:true,
      headers:['Tarih', 'Seans', { label:'Dakika', num:true }, { label:'Yük', num:true }],
      rows:rows.map(w => [U.fmtShort(w.date), w.name, String(w.minutes),
        String(SP.Move.sessionLoad(w))]) });
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

  function tabs(tab){
    const done = M.workoutsOf(U.todayISO()).length;
    const items = TABS.map(t => Object.assign({}, t,
      t.id === 'bugun' && done ? { count:done } : {}));
    return K.Subtabs({ items, value:tab, act:'move-tab', aria:'Hareket görünümü' });
  }

  async function render(){
    const tab = S.ui.moveTab;
    const head = html`<div class="mb-8">${tabs(tab)}</div>`;

    if(SP.AREA_BY_ID[tab]){
      return String(html`${head}
        ${tab === 'dinlenme' ? restView() : areaView(tab)}
        <div class="mt-24">${raw(UI.rail(tab === 'dinlenme'
          ? ['recovery-order', 'deload', 'load']
          : ['progression', 'load', 'deload']))}</div>`);
    }

    if(tab === 'ilerleme'){
      return String(html`${head}${K.Ledger([
        K.Entry({ wide:true, label:'Yük eğrisi', hint:'load', meta:'son 30 gün',
          note:'Seans yükü süre × zorluktur. Zorluk önce senin bildirdiğin algılanan '
            + 'zorluktan, yoksa hareketlerin MET ortalamasından gelir. İkisi de yoksa '
            + 'seans yük üretmez — uydurulmuş yük yazılmaz.',
          body:loadBody() }),
        K.Entry({ label:'Kalıp dengesi', meta:'her kalıp haftada en az bir kez',
          body:balanceBody() }),
        K.Entry({ label:'Seans geçmişi', meta:S.workouts.length + ' kayıt',
          body:historyBody() }),
      ])}
      <div class="mt-24">${raw(UI.rail(['load', 'deload', 'recovery-order']))}</div>`);
    }

    return String(html`${head}${K.Ledger([
      orderEntry(), pickSessionEntry(), todaySessionsEntry(),
      K.Entry({ label:'Kalıp dengesi', meta:'haftalık', body:balanceBody() }),
    ])}
    <div class="mt-24">${raw(UI.rail(['recovery-order', 'readiness', 'load', 'progression']))}</div>`);
  }

  const handle = {
    async 'move-tab'(el){ S.ui.moveTab = el.dataset.tab; SP.App.render(); },
    async 'pick-pattern-tab'(el){ S.ui.movePattern = el.dataset.tab; SP.App.render(); },
    async 'pick-pattern'(el){
      S.ui.moveTab = 'kuvvet';
      S.ui.movePattern = el.dataset.id;
      SP.App.render();
    },
    /* Alandan seans: o alanın şablonu varsa onunla, yoksa serbest başlar. */
    async 'start-area'(el){
      const area = SP.AREA_BY_ID[el.dataset.area];
      const tpl = area && area.kind
        ? SP.SESSION_TEMPLATES.find(t => t.kind === area.kind) : null;
      draft = M.newWorkout(U.todayISO(), tpl ? tpl.id : null);
      sessionSheet(draft);
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
    headline(){
      const rx = SP.Move.prescription();
      if(!rx.readiness.ok) return 'Toparlanma ölçümü bekliyor.';
      if(rx.kind === 'rest') return 'Bugün dinlenme günü.';
      if(rx.kind === 'full') return 'Bugün tam yük yapılabilir.';
      return 'Bugün yük hafifletilmeli.';
    },
    lede(){
      const rx = SP.Move.prescription();
      if(!rx.readiness.ok){
        return 'Uyku ve nabız girilince günün yük emri hesaplanır. '
          + 'Ölçüm olmadan yük körlemesine verilmez.';
      }
      return rx.readiness.band.order
        + ' Kardiyo, kuvvet, esneklik ve dinlenme ayrı sayfalardır.';
    },
    stats(){
      const rx = SP.Move.prescription();
      const out = [];
      if(rx.readiness.ok){
        out.push({ value:rx.readiness.score, unit:'/100', label:'toparlanma' });
        out.push({ value:rx.factor >= 1 ? '%100' : '%' + Math.round(rx.factor * 100),
          label:'bugünkü yük' });
      }
      out.push({ value:SP.Move.loadWindow(7), label:'haftalık yük' });
      const a = SP.Move.acwr();
      if(a.ok) out.push({ value:U.fmtNet(a.ratio), label:'hafta / ay' });
      return out;
    },
    subtitle(){
      const rx = SP.Move.prescription();
      if(!rx.readiness.ok) return 'Ölçüm bekliyor';
      return rx.readiness.band.label + (rx.factor >= 1 ? ' · tam yük'
        : ' · yükün %' + Math.round(rx.factor * 100) + '\u2019i');
    },
    actions(){
      return String(K.Button({ label:'Seans ekle', icon:'plus', size:'sm', tone:'primary',
        act:'start-session', data:{ 'data-id':'' } }));
    },
    render, handle,
  };
})();
