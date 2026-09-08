/* Hafta — kapasite sozlesmesi, 7 gunluk izgara ve weekly review.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.week = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const BLOCK_STATUS = [
    { value:'pending', label:'Bekliyor' }, { value:'done', label:'Tamam' },
    { value:'partial', label:'Yarım' }, { value:'skipped', label:'Atlandı' },
  ];

  function viewN(){ return S.ui.weekView || M.currentWeek(); }
  function weekOf(n){ return S.weeks[M.weekId(n)]; }

  /* ---------- 7 gunluk izgara ---------- */

  function DayColumn(dateObj){
    const iso = U.iso(dateObj);
    const day = S.days[iso];
    const wd = R.WEEKDAYS[U.weekdayIndex(dateObj)];
    const today = U.todayISO();
    const planned = day ? day.blocks.filter(b => b.slot !== 'Dinlenme').length : 0;
    const done = day ? day.blocks.filter(b => b.status === 'done').length : 0;

    const blocks = day
      ? map(day.blocks, b => html`<div class="${b.status === 'done' ? 'daycol__block is-done'
          : b.status === 'skipped' ? 'daycol__block is-skipped' : 'daycol__block'}">
          <b>${b.slot}</b><br/>${b.topic}</div>`)
      : map(wd.blocks, b => html`<div class="daycol__block is-preview"><b>${b.slot}</b><br/>${b.subject}</div>`);

    return html`
      <div class="${['daycol', iso === today && 'is-today', iso < today && 'is-past'].filter(Boolean).join(' ')}"
           data-act="open-day" data-date="${iso}">
        <div class="daycol__head"><span class="daycol__name">${wd.short}</span>
          <span class="daycol__date">${U.fmtShort(iso)}</span></div>
        ${blocks}
        ${when(day, () => html`<div class="tiny dim daycol__foot">${done}/${planned} tamam</div>`)}
      </div>`;
  }

  /* ---------- sozlesme ---------- */

  function TopicRow(t, i, signed, count){
    const subjectOpts = [{ value:'', label:'— ders —' }].concat(R.SUBJECTS.map(s => ({ value:s.id, label:s.name })));
    const num = (label, change, value) => K.Field({ label,
      input:K.Input({ type:'number', size:'sm', numeric:true, value, disabled:signed, change, data:{ 'data-i':i } }) });

    return K.Card({ flat:true, pad:'sm', class:'stack-sm', body:html`
      <div class="row gap-8">
        <span class="topicrow__order">${i+1}</span>
        ${K.Input({ class:'grow', value:t.name, aria:'konu adı', disabled:signed,
          change:'topic-name', data:{ 'data-i':i } })}
        ${when(count > 1 && !signed, () => K.IconButton({ icon:'close', size:'sm', plain:true,
          aria:'konuyu kaldır', act:'topic-remove', data:{ 'data-i':i } }))}
      </div>
      ${K.Cols(3, [
        num('Soru hedefi', 'topic-q', t.questionTarget),
        num('Doğruluk %', 'topic-acc', t.accuracy),
        K.Field({ label:'Ders', input:K.Select({ options:subjectOpts, value:t.subjectId || '', size:'sm',
          disabled:signed, change:'topic-subject', data:{ 'data-i':i } }) }),
      ])}` });
  }

  function contractCard(week, n){
    const signed = !!week.signedAt;
    const cap = C.capacityLoad(n);
    const over = !!(cap && cap.pct > 110);
    const curriculum = M.curriculumFor(n);

    return K.Card({
      title:'Haftalık sözleşme', hint:'contract', sub:'En fazla üç ana konu, çıktı temelli hedef',
      badge:signed ? K.Badge({ label:'İmzalandı', tone:'ok' }) : K.Badge({ label:'İmza bekliyor', tone:'warn' }),
      body:html`
        ${K.Stack(map(week.mainTopics, (t, i) => TopicRow(t, i, signed, week.mainTopics.length)), 'sm')}
        ${when(!signed && week.mainTopics.length < 3, () => K.Button({ label:'Konu ekle', icon:'plus',
          size:'sm', class:'mt-8', act:'topic-add' }))}

        <div class="cols-3 mt-16">
          ${K.Field({ label:'Haftalık soru hedefi', hint:'plan: '+curriculum.q,
            input:K.Input({ type:'number', numeric:true, value:week.questionTarget, disabled:signed, change:'week-q' }) })}
          ${K.Field({ label:'Kapasite (saat)',
            input:K.Input({ type:'number', numeric:true, step:0.5, value:U.round(week.capacityMin/60, 1), disabled:signed, change:'week-cap' }) })}
          ${K.Field({ label:'Davranış hedefi',
            input:K.Input({ value:week.behaviorGoal || '', placeholder:'ör. 6 gün 23:30 yatış', change:'week-behavior' }) })}
        </div>

        ${when(cap, () => html`<div class="mt-12">${K.Meter({ label:'Planlanan yük / kapasite', value:cap.pct,
          text:U.fmtMin(cap.planned)+' / '+U.fmtMin(cap.capacity),
          tone:over ? 'danger' : cap.pct > 95 ? 'warn' : '' })}</div>`)}
        ${when(over, () => html`<div class="mt-10">${K.Notice({ tone:'warn',
          body:'Planlanan süre kapasitenin %110’unu aşıyor. İmzadan önce blok azalt veya kapasiteyi gerçekçi yaz.' })}</div>`)}`,
      foot:K.Row(signed
        ? html`<span class="small muted">${U.fmtDate(week.signedAt.slice(0, 10))} tarihinde imzalandı.</span>
               <span class="grow"></span>
               ${K.Button({ label:'Revize et', size:'sm', act:'week-revise' })}`
        : html`${K.Button({ label:'Haftayı imzala', icon:'check', tone:'primary', act:'week-sign', disabled:over })}
               <span class="small dim">Geçen haftanın verisi görülmeden yeni hedef yazılmaz.</span>`,
        { wrap:true }),
    });
  }

  /* ---------- review ---------- */

  function reasonChips(reasons){
    const keys = Object.keys(reasons);
    if(!keys.length) return null;
    return html`<div class="stack-xs"><span class="mono-label">Sapma nedenleri</span>
      ${K.Row(map(keys, r => K.Chip(r+' × '+reasons[r])), { wrap:true })}</div>`;
  }

  function reviewCard(n){
    const rev = S.reviews[M.weekId(n)];
    const comp = C.planCompletion(n);
    const qr = C.questionRealization(n);
    const reasons = C.skipReasonCounts(n);

    return K.Card({
      title:'Weekly review', hint:'review', sub:'Pazar · 30–40 dakika',
      badge:rev ? K.Badge({ label:'tamamlandı', tone:'ok' }) : K.Badge({ label:'bekliyor', tone:'muted' }),
      body:html`
        <div class="cols-2 mb-10">
          ${K.Stat({ label:'Plan tamamlama', value:comp == null ? '—' : '%'+comp,
            tone:comp == null ? null : comp >= 85 ? 'ok' : comp >= 70 ? 'warn' : 'danger' })}
          ${K.Stat({ label:'Soru gerçekleşme', value:qr ? '%'+qr.pct : '—', note:qr ? qr.solved+' / '+qr.target : 'hedef yok' })}
        </div>
        ${reasonChips(reasons) || html`<p class="small dim">Bu hafta atlanan blok yok.</p>`}
        ${when(rev && rev.decision, () => html`<div class="mt-10">${K.Notice({ tone:'ok', title:'Düzeltme:', body:rev.decision })}</div>`)}
        ${K.Button({ label:rev ? 'Review’u güncelle' : 'Review’u doldur', tone:'primary', block:true,
          class:'mt-12', act:'open-review' })}`,
    });
  }

  /* Haftalık özet — review yazmadan önce bakılacak tek kart. */
  function digestCard(n){
    const comp = C.planCompletion(n);
    const qr = C.questionRealization(n);
    const time = C.timeRealization(n);
    const blocks = C.weekBlocks(n, true);
    const solved = U.sum(blocks.map(b => b.actualQ || 0));
    const correct = U.sum(blocks.map(b => b.correctQ || 0));
    const acc = solved ? U.pct(correct, solved) : null;
    const exams = S.exams.filter(e => {
      const d = U.parse(e.date);
      return d >= M.weekStart(n) && d <= M.weekEnd(n);
    });
    const newErrors = S.errors.filter(e => {
      const d = (e.createdAt || '').slice(0, 10);
      return d && d >= U.iso(M.weekStart(n)) && d <= U.iso(M.weekEnd(n));
    });
    const notes = S.videoNotes.filter(v => {
      const d = (v.createdAt || '').slice(0, 10);
      return d && d >= U.iso(M.weekStart(n)) && d <= U.iso(M.weekEnd(n));
    });
    const reviewed = S.cards.filter(c => c.lastReviewedAt
      && c.lastReviewedAt >= U.iso(M.weekStart(n)) && c.lastReviewedAt <= U.iso(M.weekEnd(n))).length;
    const reasons = C.skipReasonCounts(n);
    const topReason = Object.keys(reasons).sort((a, b) => reasons[b] - reasons[a])[0];

    const lines = [];
    if(comp != null) lines.push(comp >= 85 ? 'Plan tamamlama hedefte.'
      : comp >= 70 ? 'Plan tamamlama hedefin altında ama toparlanabilir.'
      : 'Plan tamamlama düşük; hedef hacmi gerçekçi değil olabilir.');
    if(acc != null && acc < 70) lines.push('Çözülen soruda doğruluk %'+acc+' — hız değil isabet sorunu.');
    if(topReason) lines.push('En sık sapma nedeni: '+topReason+' ('+reasons[topReason]+' blok).');
    if(time.target && time.pct < 70) lines.push('Planlanan sürenin %'+time.pct+'’i çalışıldı.');
    if(!lines.length) lines.push('Bu hafta için kayda değer sapma yok.');

    return K.Card({
      title:'Hafta özeti', sub:'Review yazmadan önce buna bak',
      badge:comp == null ? null : K.Badge({ label:'%'+comp,
        tone:comp >= 85 ? 'ok' : comp >= 70 ? 'warn' : 'danger' }),
      body:html`
        ${K.Cols(4, [
          K.Stat({ label:'Soru', value:U.fmtNum(solved), note:qr ? 'hedef '+qr.target : 'hedef yok' }),
          K.Stat({ label:'Doğruluk', value:acc == null ? '—' : '%'+acc,
            tone:acc == null ? null : acc >= 70 ? 'ok' : 'warn' }),
          K.Stat({ label:'Süre', value:U.fmtMin(time.actual), note:'plan '+U.fmtMin(time.target) }),
          K.Stat({ label:'Tekrar', value:U.fmtNum(reviewed), note:'kart çözüldü' }),
        ])}
        ${K.Row([
          K.Chip(U.plural(exams.length, 'deneme', 'deneme')),
          K.Chip(U.plural(newErrors.length, 'yeni yanlış', 'yeni yanlış')),
          K.Chip(U.plural(notes.length, 'ders notu', 'ders notu')),
        ], { wrap:true })}
        <ul class="bullets small muted mt-10">${map(lines, l => html`<li>${l}</li>`)}</ul>`,
    });
  }

  function openReview(){
    const n = viewN();
    const rev = S.reviews[M.weekId(n)] || { planned:'', done:'', why:'', decision:'', carry:[] };
    const comp = C.planCompletion(n);
    const qr = C.questionRealization(n);
    const tyt = C.medianTrend('TYT');
    const base = C.examBase('TYT');
    const area = (label, id, value, placeholder) => K.Field({ label,
      input:K.Textarea({ id, rows:2, value, placeholder }) });

    const body = K.Stack([
      K.Notice({ tone:'info', body:'Dört sütun doldurulur: planlandı / yapıldı / neden sapıldı / düzeltme. '
        + 'Yeni haftaya yalnız en yüksek etkili iki eksik taşınır.' }),
      K.Cols(4, [
        K.Stat({ label:'Plan', value:comp == null ? '—' : '%'+comp }),
        K.Stat({ label:'Soru', value:qr ? '%'+qr.pct : '—' }),
        K.Stat({ label:'Son 3 medyan', value:tyt.last3 == null ? '—' : U.fmtNet(tyt.last3) }),
        K.Stat({ label:'Taban', value:base == null ? '—' : U.fmtNet(base) }),
      ]),
      reasonChips(C.skipReasonCounts(n)),
      area('Planlandı', 'rv-planned', rev.planned, 'Bu hafta ne planlanmıştı?'),
      area('Yapıldı', 'rv-done', rev.done, 'Fiilen ne yapıldı?'),
      area('Neden sapıldı', 'rv-why', rev.why, 'Kök neden — “vakit yoktu” değil, hangi blok hangi engelle düştü?'),
      area('Düzeltme', 'rv-decision', rev.decision, 'Gelecek hafta ne değişecek? Tek somut değişiklik.'),
      K.Field({ label:'Yeni haftaya taşınacak en fazla 2 eksik',
        input:K.Input({ id:'rv-carry', value:(rev.carry || []).join(', '),
          placeholder:'ör. AYT fonksiyon tekrarı, üçgende benzerlik' }) }),
    ]);

    UI.sheet({
      title:'Weekly review — Hafta '+n,
      subtitle:U.fmtRange(M.weekStart(n), M.weekEnd(n)),
      body:String(body),
      footer:String(html`${K.Button({ label:'Kapat', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet ve haftayı kapat', tone:'primary', act:'save-review', data:{ 'data-n':n } })}`),
      wide:true, noFocus:true,
    });
  }

  function openDay(dateISO){
    const day = S.days[dateISO];
    const wd = R.WEEKDAYS[U.weekdayIndex(dateISO)];

    if(!day){
      UI.sheet({
        title:U.fmtDate(dateISO), subtitle:wd.label, noFocus:true,
        body:String(K.Notice({ tone:'info', body:'Bu gün henüz açılmadı. Gün geldiğinde plan otomatik oluşturulur; '
          + 'şimdiden açmak istersen aşağıdaki düğmeyi kullan.' })),
        footer:String(html`${K.Button({ label:'Kapat', act:'sheet-close' })}
          ${K.Button({ label:'Günü oluştur', tone:'primary', act:'create-day', data:{ 'data-date':dateISO } })}`),
      });
      return;
    }

    const body = K.Stack(map(day.blocks, b => K.Card({ flat:true, pad:'sm', body:html`
      <div class="row between"><b class="small">${b.slot}</b><span class="tiny dim">${b.targetMin} dk</span></div>
      ${K.Input({ size:'sm', class:'mt-8', value:b.topic, aria:b.slot+' konusu',
        change:'day-topic', data:{ 'data-date':dateISO, 'data-block':b.id } })}
      <div class="mt-8">${K.Segmented({ items:BLOCK_STATUS, value:b.status, act:'day-status', block:true, primary:true,
        aria:b.slot+' durumu', data:{ 'data-date':dateISO, 'data-block':b.id } })}</div>` })), 'sm');

    UI.sheet({
      title:U.fmtDate(dateISO),
      subtitle:wd.label+' · '+(day.ritual ? 'ritüel günü' : 'çalışma günü'),
      body:String(body), noFocus:true,
      footer:String(K.Button({ label:'Kapat', act:'sheet-close' })),
    });
  }

  /* ---------- ekran ---------- */

  function weekNav(n, week, phase){
    const isCurrent = n === M.currentWeek();
    return K.Span(12, K.Row([
      html`<div class="row-sm">
        ${K.IconButton({ icon:'left', aria:'önceki hafta', act:'week-nav', data:{ 'data-n':n-1 }, disabled:n <= 1 })}
        <div><h2 class="weekhead__title">Hafta ${n} — ${week.title}</h2>
          <span class="small dim">${U.fmtRange(M.weekStart(n), M.weekEnd(n))} · ${phase.label} — ${phase.theme}</span></div>
        ${K.IconButton({ icon:'right', aria:'sonraki hafta', act:'week-nav', data:{ 'data-n':n+1 }, disabled:n >= R.PLAN.totalWeeks })}
      </div>`,
      isCurrent ? K.Badge({ label:'bu hafta', tone:'ok' })
        : K.Button({ label:'Bu haftaya dön', size:'sm', act:'week-nav', data:{ 'data-n':M.currentWeek() } }),
    ], { between:true, wrap:true }));
  }

  async function render(){
    const n = viewN();
    await M.ensureWeek(n);
    const week = weekOf(n);
    const phase = M.phaseOf(n);
    const curriculum = M.curriculumFor(n);
    const history = C.completionHistory(8).map(h => ({ label:'H'+h.n, value:h.value }));

    return String(K.Grid([
      weekNav(n, week, phase),
      K.Span(12, html`<div class="weekgrid">${map(M.weekDates(n), DayColumn)}</div>`),

      K.Span(6, K.Stack([
        contractCard(week, n),
        K.Card({ title:'Plan tamamlama geçmişi', sub:'Hedef %85',
          body:raw(UI.barChart(history, { targetLine:85, goodAt:85 })) }),
      ])),

      K.Span(4, K.Stack([
        digestCard(n),
        reviewCard(n),
        K.Card({ title:'Müfredat referansı', sub:'Bu haftanın plandaki karşılığı', body:html`
          <div class="stack-xs"><span class="mono-label">Konu blokları</span>
            ${K.Row(map(curriculum.topics, t => K.Chip(t)), { wrap:true })}</div>
          <div class="stack-xs mt-10"><span class="mono-label">Deneme planı</span>
            <p class="small">${curriculum.exam}</p></div>
          <div class="stack-xs mt-10"><span class="mono-label">Kontrol noktası</span>
            <p class="small">${curriculum.check}</p></div>` }),
        when(week.revisions && week.revisions.length, () => K.Card({ title:'Revizyon kaydı',
          body:html`<div class="stack-xs">${map(week.revisions, r => html`
            <div class="small"><b>${U.fmtShort(r.at.slice(0, 10))}</b> — ${r.reason}</div>`)}</div>` })),
      ])),

      K.Span(2, raw(UI.rail(['contract', 'capacity', 'review', 'carry', 'plan-completion']))),
    ]));
  }

  const handle = {
    async 'week-nav'(el){
      S.ui.weekView = U.clamp(Number(el.dataset.n), 1, R.PLAN.totalWeeks);
      await M.ensureWeek(S.ui.weekView);
      R.App.render();
    },
    async 'week-sign'(){
      const n = viewN();
      weekOf(n).signedAt = new Date().toISOString();
      await M.saveWeek(n);
      UI.toast('Hafta imzalandı');
      R.App.render();
    },
    async 'week-revise'(){
      const n = viewN();
      UI.sheet({
        title:'Sözleşmeyi revize et',
        body:String(html`
          ${K.Notice({ tone:'info', body:'İmzalı bir hafta değiştirildiğinde neden kaydedilir; '
            + 'bu, sonraki review’da sapma analizini mümkün kılar.' })}
          ${K.Field({ label:'Revizyon nedeni', input:K.Textarea({ id:'rev-reason', rows:2,
            placeholder:'ör. hastalık nedeniyle soru hedefi %20 azaltıldı' }) })}`),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Kaydet ve aç', tone:'primary', act:'week-revise-save', data:{ 'data-n':n } })}`),
      });
    },
    async 'week-revise-save'(el){
      const n = Number(el.dataset.n);
      const week = weekOf(n);
      const reason = document.getElementById('rev-reason').value.trim() || 'Neden belirtilmedi';
      week.revisions = (week.revisions || []).concat([{ at:new Date().toISOString(), reason }]);
      week.signedAt = null;
      await M.saveWeek(n);
      UI.closeSheet();
      UI.toast('Sözleşme yeniden açıldı');
      R.App.render();
    },
    async 'topic-add'(){
      const n = viewN();
      const week = weekOf(n);
      if(week.mainTopics.length >= 3) return;
      week.mainTopics.push({ name:'', questionTarget:100, accuracy:70, subjectId:null, topicId:null });
      await M.saveWeek(n);
      R.App.render();
    },
    async 'topic-remove'(el){
      const n = viewN();
      weekOf(n).mainTopics.splice(Number(el.dataset.i), 1);
      await M.saveWeek(n);
      R.App.render();
    },
    async 'open-review'(){ openReview(); },
    async 'save-review'(el){
      const n = Number(el.dataset.n);
      const data = {
        planned:document.getElementById('rv-planned').value,
        done:document.getElementById('rv-done').value,
        why:document.getElementById('rv-why').value,
        decision:document.getElementById('rv-decision').value,
        carry:document.getElementById('rv-carry').value.split(',').map(s => s.trim()).filter(Boolean).slice(0, 2),
        completion:C.planCompletion(n),
        savedAt:new Date().toISOString(),
      };
      await M.saveReview(n, data);
      if(n < R.PLAN.totalWeeks && data.carry.length){
        const next = await M.ensureWeek(n+1);
        next.carryIn = data.carry;
        await M.saveWeek(n+1);
      }
      UI.closeSheet();
      UI.toast('Review kaydedildi');
      R.App.render();
    },
    async 'open-day'(el){ openDay(el.dataset.date); },
    async 'create-day'(el){
      await M.ensureDay(el.dataset.date);
      UI.closeSheet();
      R.App.render();
    },
    async 'day-status'(el){
      const day = S.days[el.dataset.date];
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.status = el.dataset.value;
      await M.saveDay(day.date);
      openDay(el.dataset.date);
      R.App.render();
    },
  };

  async function patchTopic(el, fn){
    const n = viewN();
    fn(weekOf(n).mainTopics[Number(el.dataset.i)]);
    await M.saveWeek(n);
  }

  const change = {
    async 'topic-name'(el){ await patchTopic(el, t => { t.name = el.value; }); },
    async 'topic-q'(el){ await patchTopic(el, t => { t.questionTarget = Number(el.value) || 0; }); },
    async 'topic-acc'(el){ await patchTopic(el, t => { t.accuracy = Number(el.value) || 0; }); },
    async 'topic-subject'(el){ await patchTopic(el, t => { t.subjectId = el.value || null; }); },
    async 'week-q'(el){
      const n = viewN(); weekOf(n).questionTarget = Number(el.value) || 0; await M.saveWeek(n); R.App.render();
    },
    async 'week-cap'(el){
      const n = viewN(); weekOf(n).capacityMin = Math.round((Number(el.value) || 0)*60); await M.saveWeek(n); R.App.render();
    },
    async 'week-behavior'(el){
      const n = viewN(); weekOf(n).behaviorGoal = el.value; await M.saveWeek(n);
    },
    async 'day-topic'(el){
      const day = S.days[el.dataset.date];
      const b = day.blocks.find(x => x.id === el.dataset.block);
      b.topic = el.value;
      await M.saveDay(day.date);
    },
  };

  return {
    id:'week',
    title:'Hafta',
    subtitle(){
      const n = viewN();
      return 'Hafta '+n+'/'+R.PLAN.totalWeeks+' · '+U.fmtRange(M.weekStart(n), M.weekEnd(n));
    },
    actions(){
      return String(K.Button({ label:'Weekly review', icon:'check', size:'sm', act:'open-review' }));
    },
    render, handle, change, openReview,
  };
})();
