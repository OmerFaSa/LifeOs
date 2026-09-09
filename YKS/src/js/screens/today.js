/* Bugün — günlük operasyon ekranı.

   ŞABLON DÜZENİ (diğer ekranlar için referans):
   - Görünüm h.html`` ile yazılır; araya giren değerler otomatik kaçırılır.
   - Yapı parçaları C.* bileşenlerinden gelir (Card, Stat, Button, Notice…).
   - Yapısal HTML gerektiğinde h.raw() ile işaretlenir.
   - Etkileşim yalnız data-act / data-change ile bağlanır; inline onclick yok.
   - render() tek bir C.Grid döndürür; kolonlar C.Span ile verilir. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.today = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const c = R.C;

  function todayDoc(){ return S.days[U.todayISO()]; }

  /* ---------- zamanlayici ---------- */
  let tickHandle = null;

  function runningBlock(){
    const day = todayDoc();
    return day ? (day.blocks.find(b => b.startedAt) || null) : null;
  }
  function elapsedSeconds(block){
    if(!block || !block.startedAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(block.startedAt).getTime())/1000));
  }
  function startTick(){
    stopTick();
    tickHandle = setInterval(() => {
      const b = runningBlock();
      const el = document.getElementById('timer-clock');
      if(!b || !el){ stopTick(); return; }
      el.textContent = U.fmtClock(elapsedSeconds(b));
    }, 1000);
  }
  function stopTick(){
    if(tickHandle){ clearInterval(tickHandle); tickHandle = null; }
  }

  /* ---------- parcalar ---------- */

  function AnchorTile(o){
    const pct = o.target ? Math.min(100, 100*o.actual/o.target) : 0;
    const step = d => c.Button({ label:d > 0 ? '+'+d : '−', size:'sm', class:'grow',
      aria:(d > 0 ? 'artır' : 'azalt'), act:'anchor', data:{ 'data-kind':o.kind, 'data-delta':d } });
    return c.Card({ pad:'sm', body:html`
      <div class="stack-xs">
        <div class="row between">
          <span class="stat__label">${o.label}</span>
          ${o.actual >= o.target ? c.Badge({ label:'tamam', tone:'ok' }) : html`<span class="tiny dim">${o.hint}</span>`}
        </div>
        <span class="anchor__value num">${o.actual}<span class="dim">/${o.target}</span></span>
        ${c.Bar({ value:pct, tone:'' })}
        <div class="row row--tight">${step(-1)}${step(1)}${step(5)}</div>
      </div>` });
  }

  function AnchorPane(day){
    return c.Cols(2, html`
      ${AnchorTile({ label:'Paragraf', actual:day.paragraphActual, target:day.paragraphTarget, kind:'paragraph', hint:'günlük 15–20' })}
      ${AnchorTile({ label:'Problem', actual:day.problemActual, target:day.problemTarget, kind:'problem', hint:'günlük 15–20' })}`);
  }

  function StatusBadge(status){
    const m = { done:['Tamamlandı','ok'], partial:['Yarım','warn'], skipped:['Atlandı','muted'], pending:['Bekliyor','muted'] };
    const [label, tone] = m[status] || m.pending;
    return c.Badge({ label, tone, icon:status === 'done' });
  }

  const STATUSES = [['pending','Bekliyor'],['done','Tamamlandı'],['partial','Yarım'],['skipped','Atlandı']];

  function BlockCard(b){
    const running = !!b.startedAt;
    const done = b.status === 'done' || b.status === 'partial';
    const acc = (b.actualQ && b.correctQ != null) ? U.pct(b.correctQ, b.actualQ) : null;

    const numField = (label, field, value) => c.Field({ label, input:c.Input({
      type:'number', min:0, size:'sm', numeric:true, value:value == null ? '' : value,
      change:'block-num', data:{ 'data-field':field, 'data-block':b.id } }) });

    return html`
      <article class="${R.h.cls('block', running && 'is-running', !running && b.status === 'done' && 'is-done',
        !running && b.status === 'partial' && 'is-partial', b.status === 'skipped' && 'is-skipped')}">
        <div class="row between block__top">
          <div class="grow">
            <div class="block__slot">${b.slot} · ${b.targetMin} dk${when(b.targetQ, () => html` · ${b.targetQ} soru`)}</div>
            ${c.Input({ class:'input--ghost block__topic', value:b.topic, aria:'blok konusu',
              change:'block-topic', data:{ 'data-block':b.id } })}
            <div class="tiny dim block__subject">${b.subject}</div>
          </div>
          ${running
            ? html`<div class="stack-xs block__timer-wrap">
                <span class="block__timer" id="timer-clock">${U.fmtClock(elapsedSeconds(b))}</span>
                ${c.Button({ label:'Bitir', icon:'stop', tone:'primary', size:'sm', act:'timer-stop', data:{ 'data-block':b.id } })}
              </div>`
            : b.status === 'pending'
              ? c.Button({ label:'Başlat', icon:'play', size:'sm', act:'timer-start', data:{ 'data-block':b.id } })
              : StatusBadge(b.status)}
        </div>

        ${c.Segmented({ items:STATUSES.map(s => ({ value:s[0], label:s[1] })), value:b.status,
          act:'block-status', block:true, primary:true, aria:'blok durumu', data:{ 'data-block':b.id } })}

        ${c.Cols(2, html`
          ${c.Field({ label:'Ders', input:c.Select({ size:'sm', value:b.subjectId || '',
            change:'block-subject', data:{ 'data-block':b.id },
            options:[{ value:'', label:'— bağlanmadı —' }].concat(R.SUBJECTS.map(s => ({ value:s.id, label:s.name }))) }) })}
          ${c.Field({ label:'Konu', input:c.Select({ size:'sm', value:b.topicId || '',
            change:'block-topic-ref', data:{ 'data-block':b.id },
            options:blockTopicOptions(b.subjectId) }) })}
        `)}

        ${when(done, () => html`
          <div class="cols-3">
            ${numField('Dakika','actualMin', b.actualMin)}
            ${numField('Soru','actualQ', b.actualQ)}
            ${numField('Doğru','correctQ', b.correctQ)}
          </div>
          ${when(acc != null, () => html`<div class="${acc >= 70 ? 'tiny dim' : 'tiny tone-warn'}">Doğruluk %${acc}${acc < 70 ? ' — hedef eşiğin altında' : ''}</div>`)}`)}

        ${when(b.status === 'skipped', () => html`
          <div class="stack-xs">
            <span class="mono-label">Neden atlandı?</span>
            <div class="row wrap row--tight">
              ${map(R.SKIP_REASONS, r => c.Chip({ label:r, on:b.skipReason === r, act:'skip-reason',
                data:{ 'data-block':b.id, 'data-reason':r } }))}
            </div>
          </div>`)}
      </article>`;
  }

  function blockTopicOptions(subjectId){
    const s = R.SUBJECTS.find(x => x.id === subjectId);
    if(!s) return [{ value:'', label:'— önce ders —' }];
    return [{ value:'', label:'— konu —' }].concat(s.topics.map(t => ({ value:t.id, label:t.name })));
  }

  function NextUpCard(){
    const a = C.nextAction();
    const clickable = a.route || a.act;
    return c.NextUp({
      icon:a.icon, label:a.label, title:a.title, why:a.why, hint:'next-action', calm:a.tone === 'calm',
      action:when(clickable, () => c.Button({ label:'Başla', tone:'primary', act:'next-action',
        data:{ 'data-route':a.route || '', 'data-next':a.act || '', 'data-block':a.blockId || '' } })),
    });
  }

  function StreakCard(){
    const s = C.behaviorStreak();
    return c.Card({ pad:'sm', body:html`
      <div class="row between">
        <span class="stat__label">Davranış serisi${raw(UI.hint('streak'))}</span>
        <b class="num">${s.streak}<span class="dim streak__unit"> gün</span></b>
      </div>
      <div class="streak">
        <div class="streak__dots">
          ${map(s.days, d => html`<span class="${R.h.cls('streak__dot', d.met && 'is-on', d.today && 'is-today')}"
            title="${U.fmtShort(d.iso)}${d.met ? ' · tamam' : ''}"></span>`)}
        </div>
      </div>
      <p class="tiny dim">${s.streak === 0 ? 'Minimum standardı tutturunca seri başlar.' : 'Ödül nete değil düzene bağlı.'}</p>` });
  }

  function SleepCard(day){
    const avg = C.sleepAverage(7);
    return c.Card({ pad:'sm', body:html`
      <div class="row between">
        <span class="stat__label">Uyku${raw(UI.hint('sleep'))}</span>
        ${when(avg != null, () => html`<span class="tiny dim">7 gün ort. ${avg} sa</span>`)}
      </div>
      <div class="row sleep__row">
        ${c.Input({ type:'number', step:0.5, min:0, max:14, size:'sm', numeric:true, class:'sleep__input',
          value:day.sleepHours == null ? '' : day.sleepHours, aria:'uyku saati', change:'sleep' })}
        <span class="small muted">saat · hedef ${S.profile.sleepTarget}</span>
      </div>
      ${when(day.sleepHours != null && day.sleepHours < 6.5,
        () => html`<p class="tiny tone-warn">Uyku bellek pekişmesinin parçasıdır — bugünkü hedefi hafiflet.</p>`)}` });
  }

  function RitualCard(day){
    const ritual = R.WEEKDAYS[day.dow].ritual;
    if(!ritual) return '';
    const list = R.CHECKLISTS[{ contract:'monday', exam:'saturday', review:'sunday' }[ritual]];
    const state = day.checklist || {};
    const cta = ritual === 'contract'
      ? c.Button({ label:'Haftalık sözleşmeyi aç', tone:'primary', block:true, act:'go', data:{ 'data-route':'week' } })
      : ritual === 'exam'
        ? c.Button({ label:'Deneme ekle', tone:'primary', block:true, act:'go', data:{ 'data-route':'exams' } })
        : c.Button({ label:'Weekly review’u aç', tone:'primary', block:true, act:'open-review' });

    return c.Card({ title:list.label, sub:'Bugünün ritüeli', body:html`
      <div class="stack-xs">
        ${map(list.items, (it, i) => c.Checkbox({ label:it, checked:!!state[ritual+'-'+i],
          act:'checklist', data:{ 'data-key':ritual+'-'+i } }))}
      </div>
      <div class="ritual__cta">${cta}</div>` });
  }

  function DueCards(){
    const due = C.dueCards().sort((a,b) => a.dueAt.localeCompare(b.dueAt));
    const overdue = C.overdueCards().length;
    if(!due.length){
      return c.Card({ title:'Due kartlar', badge:c.Badge({ label:'temiz', tone:'ok' }),
        body:html`<p class="small muted">Bugün için bekleyen kart yok. Yeni kartlar deneme analizinden otomatik üretilir.</p>` });
    }
    const card = due[0];
    const flipped = !!S.ui.flipped[card.id];
    const rate = (rating, label, tone) => c.Button({ label, tone, class:'grow', act:'rate',
      data:{ 'data-id':card.id, 'data-rating':rating } });

    return c.Card({
      title:'Due kartlar', sub:due.length+' kart bekliyor'+(overdue ? ' · '+overdue+' gecikmiş' : ''),
      actions:c.Button({ label:'Tümü', size:'sm', act:'go', data:{ 'data-route':'cards' } }),
      body:html`
        <div class="flashcard flashcard--sm" data-act="flip" data-id="${card.id}" role="button" tabindex="0">
          <span class="flashcard__side">${flipped ? 'Arka' : 'Ön'}</span>
          <span class="flashcard__text">${flipped ? (card.back || '—') : card.front}</span>
        </div>
        ${flipped
          ? html`<div class="row row--tight due__actions">
              ${rate('forgot','Hatırlamadım','danger')}${rate('hard','Zorlandım')}${rate('remembered','Hatırladım','primary')}
            </div>`
          : html`<p class="tiny dim center due__hint">Cevabı görmek için karta dokun</p>`}` });
  }

  function RepairQueue(){
    const open = C.openErrors().filter(e => !e.repairDoneAt).slice(0, 6);
    if(!open.length) return '';
    return c.Card({ title:'Tamir kuyruğu', sub:'Açık yanlışların reçeteleri',
      actions:c.Button({ label:'Yanlış defteri', size:'sm', act:'go', data:{ 'data-route':'cards', 'data-tab':'notebook' } }),
      body:html`<div class="list">
        ${map(open, e => html`
          <div class="listitem">
            ${raw(UI.tagDot(e.tag))}
            <div class="grow">
              <div class="small strong">${e.topic || e.testName || 'Yanlış'}</div>
              <div class="tiny dim">${e.recipe}</div>
            </div>
            ${c.Button({ label:'Yapıldı', size:'sm', act:'repair-done', data:{ 'data-id':e.id } })}
          </div>`)}
      </div>` });
  }

  function WeekContext(week, n){
    const comp = C.planCompletion(n);
    const qr = C.questionRealization(n);
    const phase = M.phaseOf(n);
    return c.Card({
      title:'Hafta '+n+' bağlamı', sub:phase.label+' — '+phase.theme,
      actions:c.Button({ label:'Aç', size:'sm', act:'go', data:{ 'data-route':'week' } }),
      body:html`
        <div class="stack-sm">
          <div class="stack-xs">
            <span class="mono-label">Bu haftanın ana konuları</span>
            ${map(week.mainTopics, t => html`
              <div class="row between"><span class="small">${t.name}</span>
              <span class="tiny dim num">${t.questionTarget} soru · %${t.accuracy}</span></div>`)}
          </div>
          ${when(comp != null, () => c.Meter({ label:'Plan tamamlama', value:comp }))}
          ${when(qr, () => c.Meter({ label:'Soru gerçekleşme', value:qr.pct, text:qr.solved+' / '+qr.target }))}
          ${c.Notice({ body:week.checkpoint, tone:'info' })}
        </div>` });
  }

  /* ---------- uyarilar ---------- */
  function Banners(){
    const out = [];
    const untilStart = M.daysUntilStart();
    const goBtn = (label, route) => c.Button({ label, size:'sm', act:'go', data:{ 'data-route':route } });

    if(untilStart > 0){
      out.push(c.Notice({ tone:'info', title:untilStart+' gün sonra başlıyor.',
        body:html`Program ${U.fmtDate(R.PLAN.startISO)} tarihinde başlıyor. Hafta 1 içeriği şimdiden önizleme olarak açık.` }));
    }
    M.activeProtocols().forEach(p => {
      out.push(c.Notice({ tone:'warn',
        body:html`<b>${p.title}</b> protokolü ${U.fmtShort(p.endsAt)} tarihine kadar aktif. ${goBtn('Adımları gör','protocols')}` }));
    });
    const triggers = C.protocolTriggers();
    if(triggers.length){
      const def = R.RECOVERY_PROTOCOLS.find(p => p.id === triggers[0].id);
      out.push(c.Notice({ tone:'warn', title:'Telafi tetiklendi.',
        body:html`${triggers[0].detail} <b>${def.title}</b> protokolü öneriliyor. ${goBtn('İncele','protocols')}` }));
    }
    if(M.backupDue()){
      const age = M.backupAgeDays();
      out.push(c.Notice({ tone:'info', title:'Yedekleme.',
        body:html`${age === null ? 'Henüz hiç yedek almadın.' : 'Son yedeğin '+age+' gün önce alındı.'} Tarayıcı verisi silinirse çalışma geçmişin kaybolur. ${goBtn('Yedek al','guide')}` }));
    }
    const debt = C.analysisDebt();
    if(debt.length){
      out.push(c.Notice({ tone:'danger', title:'Analiz borcu.',
        body:html`${debt.length} denemenin analizi 24 saati aştı. Analiz edilmemiş deneme, analiz edilenden daha düşük değerlidir. ${goBtn('Analize git','exams')}` }));
    }
    return out;
  }

  /* ---------- render ---------- */
  /* ---------- günün akışı, enerji, mola, ödül ---------- */

  function FlowCard(){
    const flow = C.dailyFlow();
    return c.Card({
      title:'Günün akışı', hint:'next-action',
      sub:'İzle → not → soru → kart → mola',
      badge:c.Badge({ label:flow.done+'/'+flow.total, tone:flow.pct >= 100 ? 'ok' : 'muted' }),
      body:html`
        ${c.Bar({ value:flow.pct, tone:'' })}
        <div class="mt-12">${map(flow.steps, s => html`
          <div class="${s.done ? 'flowstep is-done' : 'flowstep'}">
            <span class="flowstep__dot">${raw(UI.icon(s.done ? 'check' : s.icon))}</span>
            <div class="minw0">
              <div class="flowstep__title">${s.title}</div>
              <div class="flowstep__why">${s.why}</div>
            </div>
            ${when(!s.done, () => c.Button({ label:'Git', size:'sm', tone:'ghost',
              act:'go', data:{ 'data-route':s.route } }))}
          </div>`)}</div>`,
    });
  }

  function AutoCard(){
    const list = R.Auto.suggestions();
    if(!list.length) return null;
    return c.Card({
      title:'Sistem önerileri', sub:'Otomasyon önerir, sen onaylarsın',
      badge:c.Badge({ label:String(list.length), tone:'muted' }),
      body:html`<div class="autolist">${map(list, s => html`
        <div class="autorow">
          <span class="autorow__icon">${raw(UI.icon(s.icon))}</span>
          <div class="minw0">
            <div class="small strong">${s.title}</div>
            <div class="tiny dim">${s.why}</div>
          </div>
          ${c.Button({ label:'Uygula', size:'sm', tone:s.tone || null, act:s.act, data:s.data || {} })}
        </div>`)}</div>` });
  }

  function PlanHealthCard(){
    const h = M.planHealth();
    if(!h || h.status === 'yeni') return null;
    const tone = h.status === 'saglikli' ? 'ok' : h.status === 'sapma' ? 'warn' : 'danger';
    return c.Card({ pad:'sm', body:html`
      <div class="row between">
        <span class="stat__label">Plan sağlığı</span>
        ${c.Badge({ label:h.pct == null ? '—' : '%'+h.pct, tone })}
      </div>
      ${c.Bar({ value:h.pct || 0, tone:tone === 'ok' ? '' : tone })}
      <p class="tiny dim mt-6">${h.note}</p>
      ${when(h.status !== 'saglikli', () => c.Button({ label:'Planı yeniden hesapla', size:'sm',
        class:'mt-8', act:'auto-replan' }))}` });
  }

  function EnergyCard(){
    const today = U.todayISO();
    const mood = M.moodOf(today);
    const avg = M.energyAverage(7);
    const cur = mood ? mood.energy : null;
    return c.Card({
      title:'Enerji', sub:'Günde tek soru — plan buna göre esner',
      badge:when(avg != null, () => c.Badge({ label:'7 gün ort. '+avg, tone:'muted' })),
      body:html`
        <div class="energy">${map(R.ENERGY_SCALE, e => html`
          <button class="${cur === e.value ? 'is-on' : ''}" data-act="energy-set" data-value="${e.value}"
            aria-pressed="${cur === e.value ? 'true' : 'false'}" title="${e.note}">
            <b>${e.value}</b><span>${e.label}</span></button>`)}</div>
        ${when(cur != null, () => html`<p class="tiny dim mt-8">
          ${(R.ENERGY_SCALE.find(e => e.value === cur) || {}).note}</p>`)}`,
    });
  }

  function BreakCard(){
    const sug = C.suggestBreak();
    const taken = M.breaksOf(U.todayISO());
    if(!sug.ok){
      return c.Card({ title:'Mola', sub:'Bugün alınan: '+taken.length,
        body:c.Notice({ tone:'info', body:sug.reason }) });
    }
    return c.Card({
      title:'Mola', hint:'minimum-day', sub:sug.minutes+' dakika · '+taken.length+' mola alındı',
      body:html`
        <p class="small muted">${sug.why}</p>
        <div class="stack-xs mt-10">${map(sug.picks, a => html`
          <div class="row between">
            <div class="minw0"><b class="small">${a.name}</b>
              <div class="tiny dim">${a.minutes} dk · ${R.ACTIVITY_KINDS[a.kind].label}</div></div>
            ${c.Button({ label:'Aldım', size:'sm', act:'break-take',
              data:{ 'data-id':a.id, 'data-min':a.minutes } })}
          </div>`)}</div>`,
    });
  }

  function RewardCard(){
    const r = C.todayReward();
    const tier = C.rewardTier();
    const ALL = [
      { key:'minimum', label:'Minimum gün', icon:'check' },
      { key:'sleep', label:'Uyku', icon:'moon' },
      { key:'analysis', label:'Analiz', icon:'exam' },
      { key:'cards', label:'Tekrar', icon:'cards' },
    ];
    const has = k => r.earned.some(e => e.key === k);
    return c.Card({
      title:'Bugünün ödülü', hint:'streak', sub:r.title,
      badge:when(r.all, () => c.Badge({ label:'tam gün', tone:'ok' })),
      body:html`
        <div class="reward">${map(ALL, a => html`
          <span class="${has(a.key) ? 'reward__item' : 'reward__item is-off'}">
            ${raw(UI.icon(has(a.key) ? 'check' : a.icon))}${a.label}</span>`)}</div>

        ${when(tier.current || tier.next, () => html`
          <div class="stack-xs mt-12">
            <div class="row between">
              <span class="small">${tier.current ? tier.current.name + ' eşiği geçildi' : 'İlk eşik'}</span>
              ${when(tier.next, () => html`<span class="tiny dim num">${tier.next.name}’e ${tier.toNext} gün</span>`)}
            </div>
            ${c.Bar({ value:tier.next ? U.pct(tier.streak, tier.next.days) : 100,
              tone:tier.current ? '' : 'warn' })}
            <span class="tiny dim">${(tier.current || tier.next || {}).note || ''}</span>
          </div>`)}

        <p class="tiny dim mt-10">${r.note}</p>`,
    });
  }

  /* Kötü gün: sistem çökmesin diye tek düğmelik iniş. */
  function BadDayCard(day){
    if(day.badDay){
      return c.Card({ pad:'sm', class:'card--accent', body:html`
        <div class="row between wrap gap-8">
          <div class="minw0">
            <b class="small">Bugün kötü gün olarak işaretli</b>
            <div class="tiny dim">Hedef minimuma indi, seri korunuyor.</div>
          </div>
          ${c.Button({ label:'Geri al', size:'sm', act:'bad-day-undo' })}
        </div>` });
    }
    return c.Card({ pad:'sm', body:html`
      <div class="row between wrap gap-8">
        <div class="minw0">
          <b class="small">${R.BAD_DAY.label}</b>
          <div class="tiny dim">${R.BAD_DAY.note}</div>
        </div>
        ${c.Button({ label:'İşaretle', size:'sm', act:'bad-day' })}
      </div>` });
  }

  /* Dikkat dağılması: tek tık, kalıbı gösterir. */
  function DistractionCard(day){
    const n = day.distractions || 0;
    const trend = R.Analytics.distractionTrend(14);
    return c.Card({ pad:'sm', body:html`
      <div class="row between">
        <span class="stat__label">Bölünme</span>
        <b class="num">${n}<span class="dim"> kez</span></b>
      </div>
      <div class="row gap-8 mt-8">
        ${c.Button({ label:'+1 bölündüm', size:'sm', class:'grow', act:'distract' })}
        ${when(n, () => c.Button({ label:'Sıfırla', size:'sm', tone:'ghost', act:'distract-reset' }))}
      </div>
      ${when(trend.ok && trend.avg >= 2, () => html`<p class="tiny dim mt-6">${trend.note}</p>`)}` });
  }

  /* Ofisten gelen — ekip sen ekrani acmadan da calisir. Notlar kural
     motorundan gelir; brifing gunde bir kez uretilip onbellekten okunur. */
  function OfficeCard(){
    const notes = R.Office.notes();
    /* Bayat brifing burada hic gosterilmez: notlar her zaman tazedir ve
       ikisi celisirse kullanici hangisine inanacagini bilemez. */
    const cached = R.Office.briefingOf();
    const brief = (cached && !cached.stale) ? cached : null;
    const open = R.Office.openDecisions();
    if(!notes.length && !brief && !open.length) return '';

    return c.Card({
      title:'Ofisten', sub:'Ekibin bugünkü notu',
      badge:when(notes.length, () => c.Badge({ label:notes.length + ' not',
        tone:notes.some(n => n.tone === 'danger') ? 'danger' : 'warn' })),
      body:html`
        ${when(brief, () => html`<p class="small">${brief.text}</p>`)}
        ${when(notes.length, () => html`<div class="notes mt-10">${map(notes.slice(0, 3), n => html`
          <div class="${'note note--' + n.tone}">
            <span class="note__dot"></span>
            <span class="minw0"><b class="small">${n.name}:</b> ${n.text}</span>
          </div>`)}</div>`)}
        ${when(open.length, () => html`<div class="mt-10">${c.Notice({ tone:'warn',
          title:'Açık karar:', body:open[0].title })}</div>`)}
        <div class="row wrap gap-6 mt-10">
          ${c.Button({ label:'Ofise git', size:'sm', act:'go', data:{ 'data-route':'office' } })}
          ${c.Button({ label:'Patron’a sor', size:'sm', tone:'ghost', act:'ask-agent',
            data:{ 'data-agent':'patron' } })}
        </div>`,
    });
  }

  async function render(){
    const dateISO = U.todayISO();
    const n = M.currentWeek();
    await M.ensureWeek(n);
    const day = await M.ensureDay(U.today());
    const week = S.weeks[M.weekId(n)];
    const wd = R.WEEKDAYS[day.dow];

    const minMet = C.minimumDayMet(dateISO);
    const doneBlocks = day.blocks.filter(b => b.status === 'done').length;
    const planBlocks = day.blocks.filter(b => b.slot !== 'Dinlenme').length;
    const debt = C.cardDebt();
    const banners = Banners();

    return c.Grid(html`
      ${when(banners.length, () => c.Span(12, html`<div class="stack-sm">${banners}</div>`))}
      ${c.Span(12, R.Setup.needed() ? raw(R.Setup.card()) : NextUpCard())}

      ${c.Span(12, c.Cols(4, html`
        ${c.Stat({ label:'Bugünün bloğu', value:html`${doneBlocks}<small>/${planBlocks}</small>`,
          note:wd.label+' düzeni',
          tone:planBlocks && doneBlocks >= planBlocks ? 'ok' : null,
          progress:planBlocks ? (100 * doneBlocks / planBlocks) : null })}
        ${c.Stat({ label:'Minimum gün', value:minMet ? 'Tamam' : 'Açık', tone:minMet ? 'ok' : 'warn',
          note:'45 dk · 15 paragraf · kart', progress:minMet ? 100 : 0 })}
        ${c.Stat({ label:'Due kart', value:C.dueCards().length, tone:debt > 10 ? 'warn' : null,
          note:'borç %'+debt, progress:debt })}
        ${c.Stat({ label:'Sınava kalan', value:U.diffDays(dateISO, R.PLAN.examTytISO), unit:' gün',
          note:'TYT tahmini', progress:M.programProgress() })}
      `))}

      ${c.Span(6, c.Stack(html`
        ${AutoCard()}
        <div id="pane-flow">${FlowCard()}</div>
        ${c.SectionTitle(html`${wd.label} blokları${raw(UI.hint('block'))}`, html`<span class="small dim">${U.fmtDate(dateISO)}</span>`)}
        ${map(day.blocks, BlockCard)}
        ${c.Card({ pad:'sm', body:c.Field({ label:'Günün notu',
          input:c.Textarea({ rows:2, value:day.note, change:'day-note', placeholder:'Bugün ne engelledi, ne kolaylaştırdı?' }) }) })}
      `))}

      ${c.Span(4, c.Stack(html`
        ${OfficeCard()}
        <div id="pane-anchors">${AnchorPane(day)}</div>
        <div id="pane-energy">${EnergyCard()}</div>
        <div id="pane-reward">${RewardCard()}</div>
        ${BadDayCard(day)}
        ${DistractionCard(day)}
        ${PlanHealthCard()}
        ${StreakCard()}
        ${SleepCard(day)}
        <div id="pane-break">${BreakCard()}</div>
        <div id="pane-due">${DueCards()}</div>
        <div id="pane-ritual">${RitualCard(day)}</div>
        ${RepairQueue()}
        ${WeekContext(week, n)}
      `))}

      ${c.Span(12, raw(UI.rail(['next-action','anchor','minimum-day','timer','streak','skip-reason'])))}
    `);
  }

  function afterRender(){
    if(runningBlock()) startTick(); else stopTick();
  }

  /* ---------- eylemler ---------- */
  const handle = {
    async 'bad-day'(){
      UI.confirmSheet(R.BAD_DAY.label,
        'Bugünün hedefi minimum güne iner, kalan bloklar “kötü gün” nedeniyle atlanır ve '
        + 'davranış serin kırılmaz. Yarın normal plana dönersin.', async () => {
          await M.badDay();
          UI.closeSheet();
          UI.toast('Bugün minimuma indi — seri korunuyor');
          R.App.render();
        });
    },
    async 'bad-day-undo'(){
      await M.undoBadDay();
      UI.toast('Normal plana dönüldü');
      R.App.render();
    },
    async 'distract'(){
      const n = await M.addDistraction();
      UI.toast(n + '. bölünme kaydedildi');
      R.App.render();
    },
    async 'distract-reset'(){
      const day = todayDoc();
      day.distractions = 0;
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'share-week'(){
      const n = M.currentWeek();
      const comp = C.planCompletion(n);
      const qr = C.questionRealization(n);
      const tyt = C.medianTrend('TYT');
      const streak = C.behaviorStreak().streak;
      const lines = [
        'Hafta ' + n + ' özeti',
        'Plan tamamlama: ' + (comp == null ? '—' : '%' + comp),
        'Soru: ' + (qr ? qr.solved + ' / ' + qr.target : '—'),
        'TYT medyan (son 3): ' + (tyt.last3 == null ? '—' : U.fmtNet(tyt.last3)),
        'Davranış serisi: ' + streak + ' gün',
        'Analiz borcu: ' + C.analysisDebt().length,
        'Konu kapanışı: %' + C.overallClosure().pct,
      ];
      const text = lines.join('\n');
      try{
        if(navigator.share){ await navigator.share({ title:'Rota — hafta özeti', text }); return; }
        await navigator.clipboard.writeText(text);
        UI.toast('Özet kopyalandı — birine gönderebilirsin');
      }catch(e){
        UI.sheet({
          title:'Hafta özeti', subtitle:'Kopyalayıp paylaşabilirsin',
          body:String(c.Textarea({ id:'share-box', rows:8, value:text })),
          footer:String(c.Button({ label:'Kapat', act:'sheet-close' })),
        });
      }
    },
    async 'energy-set'(el){
      await M.saveMood(U.todayISO(), { energy:Number(el.dataset.value) });
      if(!R.App.patch('#pane-energy', EnergyCard())) R.App.render();
      else R.App.patch('#pane-break', BreakCard());
    },
    async 'break-take'(el){
      await M.saveBreak({ activityId:el.dataset.id, minutes:Number(el.dataset.min) || 5 });
      UI.toast('Mola kaydedildi — dönünce blok seni bekliyor');
      if(!R.App.patch('#pane-break', BreakCard())) R.App.render();
      else R.App.patch('#pane-flow', FlowCard());
    },
    async anchor(el){
      const day = todayDoc();
      const field = el.dataset.kind === 'paragraph' ? 'paragraphActual' : 'problemActual';
      day[field] = Math.max(0, (day[field]||0) + Number(el.dataset.delta));
      await M.saveDay(day.date);
      // yalniz cipa panelini yenile; tam cizim gerekmez
      if(!R.App.patch('#pane-anchors', AnchorPane(day))) R.App.render();
    },
    async 'block-status'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.status = el.dataset.value;
      if(b.status === 'done' && b.actualMin == null && !b.startedAt) b.actualMin = b.targetMin;
      if(b.status !== 'skipped') b.skipReason = null;
      if(b.startedAt){ b.actualMin = (b.actualMin||0) + Math.round(elapsedSeconds(b)/60); b.startedAt = null; }
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'skip-reason'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.skipReason = el.dataset.reason;
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'timer-start'(el){
      const day = todayDoc();
      day.blocks.forEach(b => {
        if(b.startedAt){ b.actualMin = (b.actualMin||0) + Math.round(elapsedSeconds(b)/60); b.startedAt = null; }
      });
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.startedAt = new Date().toISOString();
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'timer-stop'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      const mins = Math.round(elapsedSeconds(b)/60);
      b.actualMin = (b.actualMin||0) + mins;
      b.startedAt = null;
      if(b.status === 'pending') b.status = mins >= b.targetMin*0.8 ? 'done' : 'partial';
      await M.saveDay(day.date);
      UI.toast(mins+' dakika kaydedildi');
      R.App.render();
    },
    async checklist(el){
      const day = todayDoc();
      day.checklist = day.checklist || {};
      day.checklist[el.dataset.key] = el.checked;
      await M.saveDay(day.date);
      if(!R.App.patch('#pane-ritual', RitualCard(day))) R.App.render();
    },
    async flip(el){
      S.ui.flipped[el.dataset.id] = !S.ui.flipped[el.dataset.id];
      if(!R.App.patch('#pane-due', DueCards())) R.App.render();
    },
    async rate(el){
      const card = S.cards.find(x => x.id === el.dataset.id);
      M.schedule(card, el.dataset.rating);
      await M.saveCard(card);
      delete S.ui.flipped[card.id];
      UI.toast('Sonraki tekrar: '+U.fmtShort(card.dueAt));
      R.App.render();
    },
    async 'repair-done'(el){
      const err = S.errors.find(e => e.id === el.dataset.id);
      err.repairDoneAt = new Date().toISOString();
      await M.saveError(err);
      UI.toast('Reçete tamamlandı');
      R.App.render();
    },
    async 'open-review'(){ R.Screens.week.openReview(); },
  };

  const change = {
    async 'block-subject'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.subjectId = el.value || null;
      b.topicId = null;
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'block-topic-ref'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.topicId = el.value || null;
      await M.saveDay(day.date);
    },
    async 'block-topic'(el){
      const day = todayDoc();
      day.blocks.find(x => x.id === el.dataset.block).topic = el.value;
      await M.saveDay(day.date);
    },
    async 'block-num'(el){
      const day = todayDoc();
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b[el.dataset.field] = el.value === '' ? null : Number(el.value);
      await M.saveDay(day.date);
      R.App.render();
    },
    async sleep(el){
      const day = todayDoc();
      day.sleepHours = el.value === '' ? null : Number(el.value);
      await M.saveDay(day.date);
      R.App.render();
    },
    async 'day-note'(el){
      const day = todayDoc();
      day.note = el.value;
      await M.saveDay(day.date);
    },
  };

  return {
    id:'today',
    title:'Bugün',
    subtitle(){
      const wd = R.WEEKDAYS[U.weekdayIndex(U.today())];
      return wd.label + ' · ' + U.fmtDate(U.todayISO()) + ' · Hafta ' + M.currentWeek() + '/' + R.PLAN.totalWeeks;
    },
    actions(){
      return String(html`
        ${c.Button({ label:'Özeti paylaş', icon:'upload', size:'sm', act:'share-week' })}
        ${c.Button({ label:'Deneme ekle', icon:'exam', size:'sm', act:'go', data:{ 'data-route':'exams' } })}`);
    },
    render, afterRender, handle, change,
  };
})();
