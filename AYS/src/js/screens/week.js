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
  /* Sozlesmeye elle en fazla kac konu eklenir: eskisi gibi 3, kullanicinin
     haftalik konu tavani daha yuksekse o (core/planner.js TAVAN). */
  function konuSiniri(){ return Math.max(3, R.Planner.tavan(S.profile)); }

  /* ---------- 7 gunluk izgara ---------- */

  function DayColumn(dateObj){
    const iso = U.iso(dateObj);
    const day = S.days[iso];
    const wd = R.WEEKDAYS[U.weekdayIndex(dateObj)];
    const today = U.todayISO();
    const planned = day ? day.blocks.filter(b => b.slot !== 'Dinlenme').length : 0;
    const done = day ? day.blocks.filter(b => b.status === 'done').length : 0;

    /* Ara gunu — kaydi olsun ya da olmasin — «ara» diye gorunur; sablonun
       onizlemesi gosterilirse plan bozulmus gibi okunur. */
    const ist = R.Istisna ? R.Istisna.gunIcin(iso) : null;
    const araGunu = (day && day.ara) || (!day && ist && ist.tur === 'ara');
    const blocks = araGunu
      ? html`<div class="daycol__block is-preview"><b>Ara</b><br/>${(ist && ist.neden) || 'plan boş'}</div>`
      : day
      ? map(day.blocks, b => html`<div class="${b.status === 'done' ? 'daycol__block is-done'
          : b.status === 'skipped' ? 'daycol__block is-skipped' : 'daycol__block'}">
          <b>${b.slot}</b><br/>${b.topic}</div>`)
      : map(wd.blocks, b => html`<div class="daycol__block is-preview"><b>${b.slot}</b><br/>${b.subject}</div>`);

    return html`
      <div class="${['daycol', iso === today && 'is-today', iso < today && 'is-past'].filter(Boolean).join(' ')}"
           data-act="open-day" data-date="${iso}" role="button" tabindex="0">
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
      title:'Haftalık sözleşme', hint:'contract', sub:'En fazla ' + konuSiniri() + ' ana konu, çıktı temelli hedef',
      badge:signed ? K.Badge({ label:'İmzalandı', tone:'ok' }) : K.Badge({ label:'İmza bekliyor', tone:'warn' }),
      body:html`
        ${K.Stack(map(week.mainTopics, (t, i) => TopicRow(t, i, signed, week.mainTopics.length)), 'sm')}
        ${when(!signed && week.mainTopics.length < konuSiniri(), () => K.Button({ label:'Konu ekle', icon:'plus',
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
          ${K.Stat({ label:'Soru gerçekleşme', value:qr && qr.pct != null ? '%'+qr.pct : '—', note:qr ? qr.solved+' / '+qr.target : 'hedef yok' })}
        </div>
        ${reasonChips(reasons) || html`<p class="small dim">Bu hafta atlanan blok yok.</p>`}
        ${when(rev && rev.decision, () => html`<div class="mt-10">${K.Notice({ tone:'ok', title:'Düzeltme:', body:rev.decision })}</div>`)}
        ${K.Button({ label:rev ? 'Review’u güncelle' : 'Review’u doldur', block:true,
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
      const d = R.U.gunOf((e.createdAt || ''));
      return d && d >= U.iso(M.weekStart(n)) && d <= U.iso(M.weekEnd(n));
    });
    const notes = S.videoNotes.filter(v => {
      const d = R.U.gunOf((v.createdAt || ''));
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
      body:html`<div class="rapor-govde">
        <!-- RAPOR KAPAĞI — belgenin yüzü. Mühür belgeyi imzalar, kapak
             adlandırır; ikisi ayrı şeydir. Dosya yoksa düğüm kalkar. -->
        <img class="rapor-kapak" src="img/marka/kapak-akademik-rapor.webp"
          alt="Akademik rapor kapağı" loading="lazy" onerror="this.remove()">
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
        <ul class="bullets small muted mt-10">${map(lines, l => html`<li>${l}</li>`)}</ul>
      </div>`,
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
        K.Stat({ label:'Soru', value:qr && qr.pct != null ? '%'+qr.pct : '—' }),
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

  /* ---------- planin sekli: temel + tarihli istisna ----------

     Degisiklikler oneri kutusundan gecer (core/proposals.js): hepsi ORTA
     seviyededir, once onizleme gorulur, sonra tek dokunusla uygulanir ve
     ofis ekraninda «Geri al» ile geri alinabilir. */

  function istisnaCard(){
    const I = R.Istisna;
    if(!I) return '';
    const temel = I.temelDakika();
    const liste = I.etkin();
    const takvim = I.takvimde();
    return K.Card({ title:'Planın şekli', sub:'Temel plan + tarihli istisnalar',
      body:html`
        <div class="row gap-8" style="justify-content:space-between;align-items:center">
          <span class="small">Ders günü: <b>${temel || I.sablonDakikasi()} dk</b>
            <span class="dim">${temel ? '(kalıcı ayar)' : '(şablon)'}</span></span>
          ${K.Button({ label:'Değiştir', size:'sm', tone:'ghost', act:'istisna-ac',
            data:{ 'data-tur':'gunluk' } })}
        </div>
        ${when(liste.length, () => html`<div class="stack-xs mt-10">${map(liste, x => html`
          <div class="row gap-8" style="justify-content:space-between;align-items:center">
            <span class="small">${I.tanim(x)}${when(x.neden, () => html` <span class="dim">· ${x.neden}</span>`)}</span>
            ${K.Button({ label:x.from > U.todayISO() ? 'Kaldır' : 'Bitir', size:'sm', tone:'ghost',
              act:'istisna-bitir', data:{ 'data-id':x.id } })}
          </div>`)}</div>`)}
        ${when(takvim.length, () => html`<div class="stack-xs mt-10">${map(takvim, x => html`
          <div class="small">${I.tanim(x)}${when(x.neden, () => html` <span class="dim">· ${x.neden}</span>`)}
            <span class="tiny dim">· takvim kaydı, Rehber › İstisnalar</span></div>`)}</div>`)}
        ${when(!liste.length && !takvim.length, () => html`<p class="small dim mt-8">Etkin istisna yok; plan temel düzeninde.</p>`)}
        <div class="row gap-8 mt-10" style="flex-wrap:wrap">
          ${K.Button({ label:'Ara ver', icon:'pause', size:'sm', act:'istisna-ac', data:{ 'data-tur':'ara' } })}
          ${K.Button({ label:'Geçici süre', icon:'clock', size:'sm', act:'istisna-ac', data:{ 'data-tur':'sure' } })}
        </div>` });
  }

  const ISTISNA_EYLEM = { ara:'ara-ver', sure:'gecici-sure', gunluk:'gunluk-sure' };
  let istisnaTaslak = null;

  /* Baska ekrandan (Program › «konu düşünce süre teklifi») kalici gunluk
     sure onizlemesini dakikasi dolu acar. Onay yine ayni yoldan gecer:
     onizleme + «Uygula» (orta seviye, AGENTS.md §1.9). */
  function sureOner(dakika){
    const p = { dakika:Number(dakika) };
    istisnaTaslak = { tur:'gunluk', p };
    istisnaSheet('gunluk', p, R.Proposals.preview({ action:'gunluk-sure', agent:'patron', params:p }));
  }

  function istisnaParams(tur){
    const v = id => { const el = document.getElementById(id); return el ? el.value : ''; };
    if(tur === 'gunluk') return { dakika:Number(v('ist-dakika')) };
    const p = { from:v('ist-from'), to:v('ist-to') };
    if(tur === 'sure') p.dakika = Number(v('ist-dakika'));
    return p;
  }

  function istisnaForm(tur, p){
    const bugun = U.todayISO();
    const tarih = (id, label, value) => K.Field({ label,
      input:K.Input({ id, type:'date', value:value || bugun }) });
    const dakika = value => K.Field({ label:'Ders günü süresi (dakika)',
      hint:R.Istisna.DAKIKA.min + '–' + R.Istisna.DAKIKA.max,
      input:K.Input({ id:'ist-dakika', type:'number', numeric:true, value:value || '' }) });
    return html`<div class="stack-sm">
      ${when(tur !== 'gunluk', () => tarih('ist-from', 'Başlangıç', p.from))}
      ${when(tur !== 'gunluk', () => tarih('ist-to', 'Bitiş', p.to))}
      ${when(tur !== 'ara', () => dakika(p.dakika))}
    </div>`;
  }

  function istisnaSheet(tur, p, pv){
    const baslik = { ara:'Ara ver', sure:'Geçici günlük süre', gunluk:'Günlük çalışma süresi' }[tur];
    const alt = { ara:'Seçtiğin günlerde plan boş kalır; ara bitince kaldığı yerden sürer.',
      sure:'Ders günlerinin süresi yalnız bu tarihlerde değişir; sonra temel plana döner.',
      gunluk:'Kalıcı değişiklik: kapasite ve plan bu haftadan itibaren yeniden dağıtılır.' }[tur];
    UI.sheet({ title:baslik, subtitle:alt,
      body:String(html`${istisnaForm(tur, p || {})}
        ${when(pv && !pv.ok, () => html`<div class="mt-10">${K.Notice({ tone:'warn', body:pv.why })}</div>`)}
        ${when(pv && pv.ok, () => html`<div class="diff mt-10">${map(pv.rows, r => html`
          <div class="diff__row"><span class="diff__label">${r.label}</span>
            <span class="diff__before">${r.before}</span><span class="diff__arrow" aria-hidden="true">→</span>
            <span class="diff__after">${r.after}</span></div>`)}</div>`)}`),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${pv && pv.ok
          ? K.Button({ label:'Uygula', tone:'primary', act:'istisna-uygula' })
          : K.Button({ label:'Önizle', tone:'primary', act:'istisna-onizle' })}`),
    });
  }

  /* ---------- C · vitrin kartları (brand/ortak/vitrin.js) ---------- */
  const VT = () => (window.LIFEOS || {}).VITRIN;
  const kutu = (ad, yuva, ic) => ic ? K.Kutu({ ad, yuva, class:'vkutu', govde:raw(ic) }) : '';

  /* Ders işareti (067): renk değil harf. Aile TYT/AYT ayrımını değil
     dersin türünü söyler; eşleme kimlikten, ad benzerliğinden değil. */
  const AILE = { 'tyt-turkce':'T', 'tyt-matematik':'M', 'ayt-matematik':'M', 'tyt-fen':'F',
    'ayt-fizik':'F', 'ayt-kimya':'F', 'ayt-biyoloji':'F', 'tyt-sosyal':'S' };
  const AILE_AD = { T:'Türkçe', M:'Matematik', F:'Fen', S:'Sosyal' };

  /* 051 40 HAFTA ÇİZGİSİ: tamamı ara günü olan hafta taralı. */
  function haftaCizgisi(n){
    if(!VT()) return '';
    const ara = [];
    if(R.Istisna) for(let h = 1; h <= R.PLAN.totalWeeks; h++){
      if(M.weekDates(h).every(d => { const x = R.Istisna.gunIcin(U.iso(d)); return x && x.tur === 'ara'; })) ara.push(h);
    }
    return kutu('Sınava kadar', 'planlı', VT().haftaCizgisi({ hafta:n, toplam:R.PLAN.totalWeeks, ara }));
  }

  /* 125 TAKVİMDE HAYALET ÖNERİ: bugüne blok ekleyen bekleyen öneri,
     günün blokları arasında kesikli mor durur; «Yerleştir» Onaylar'daki
     aynı onaydan geçer (office-approve), onaysız hiçbir şey yerleşmez. */
  function hayaletOneri(n){
    if(!VT() || !R.Proposals || n !== M.currentWeek()) return '';
    const p = R.Proposals.actionable().find(x => x.action === 'block-add');
    if(!p) return '';
    const gun = M.dayOf(U.todayISO());
    const bloklar = ((gun && gun.blocks) || []).filter(b => b.slot !== 'Dinlenme');
    const konu = (() => { try{ const s = R.SUBJECTS.find(x => x.id === p.params.subjectId);
      const t = s && (s.topics || []).find(x => x.id === p.params.topicId); return t ? t.name : s ? s.name : 'Ek blok'; }catch(e){ return 'Ek blok'; } })();
    const satirlar = bloklar.map((b, i) => ({ saat:String(i + 1), ad:b.topic || b.subject || b.slot, modul:'ays' }))
      .concat([{ saat:String(bloklar.length + 1), ad:konu + ' · ' + (Number(p.params.minutes) || '—') + ' dk', hayalet:true }]);
    return kutu('Bugüne önerilen blok', 'öneri', VT().hayaletOneri({ satirlar, act:'office-approve', data:{ 'data-id':p.id } }));
  }

  /* 052 PLAN IZGARASI: yedi gün × günün blokları. Bloklara saat yazılmaz;
     satır bloğun günün içindeki sırasıdır. Açılmamış gün şablondan. */
  function planIzgarasi(n){
    if(!VT()) return '';
    const bugun = U.todayISO();
    const tarihler = M.weekDates(n).map(U.iso);
    let enCok = 0;
    const bloklar = [];
    tarihler.forEach((iso, g) => {
      const day = S.days[iso];
      const liste = day ? day.blocks : R.WEEKDAYS[U.weekdayIndex(iso)].blocks;
      const ist = R.Istisna ? R.Istisna.gunIcin(iso) : null;
      if((day && day.ara) || (!day && ist && ist.tur === 'ara')) return;
      liste.forEach((b, y) => {
        enCok = Math.max(enCok, y + 1);
        if(b.slot === 'Dinlenme') return;
        bloklar.push({ gun:g, yuva:y, modul:'ays', gecti:iso < bugun, durum:b.status || 'pending',
          ad:b.slot + ' · ' + (b.topic || b.subject || '') });
      });
    });
    if(!bloklar.length) return '';
    const yuvalar = Array.from({ length:enCok }, (_, i) => (i + 1) + '. blok');
    return kutu('Plan ızgarası', 'planlı', VT().planIzgarasi({ gunler:tarihler.map(iso => R.WEEKDAYS[U.weekdayIndex(iso)].short),
      bugun:tarihler.indexOf(bugun) >= 0 ? tarihler.indexOf(bugun) : null, yuvalar, bloklar }));
  }

  /* 049 KONU KAPSAM HALKASI: sözleşmedeki ana konuların soru hedefine
     karşı, haftanın bloklarında o konuda çözülen soru. */
  function kapsam(week, n){
    if(!VT() || !week.mainTopics || !week.mainTopics.length) return '';
    const bl = C.weekBlocks(n, true);
    const satirlar = week.mainTopics.filter(t => String(t.name || '').trim()).map(t => ({ ad:t.name,
      plan:Number(t.questionTarget) || null,
      cozulen:U.sum(bl.filter(b => U.norm(b.topic || '') === U.norm(t.name)).map(b => Number(b.actualQ) || 0)) }));
    return kutu('Konu kapsamı', 'hesaplandı', VT().kapsamHalkasi({ satirlar }));
  }

  /* 061 DERS DENGESİ ve 067 DERS İŞARETLERİ: planlanan ve gerçekleşen
     dakikanın ders ailelerine dağılımı; derse bağlanmamış blok girmez. */
  function dersDengesi(n){
    if(!VT()) return '';
    const bl = C.weekBlocks(n, false).filter(b => AILE[b.subjectId]);
    const harfler = ['T', 'M', 'F', 'S'];
    const topla = f => harfler.map(h => U.sum(bl.filter(b => AILE[b.subjectId] === h).map(f)));
    const plan = topla(b => Number(b.targetMin) || 0);
    const gercek = topla(b => (b.status === 'done' || b.status === 'partial') ? Number(b.actualMin) || 0 : 0);
    const pT = U.sum(plan), gT = U.sum(gercek);
    if(!pT || !gT) return '';
    const pay = (a, t) => harfler.map((h, i) => ({ harf:h, ad:AILE_AD[h], pay:100 * a[i] / t }));
    const P = pay(plan, pT), G = pay(gercek, gT);
    let en = 0;
    harfler.forEach((h, i) => { if(Math.abs(G[i].pay - P[i].pay) > Math.abs(G[en].pay - P[en].pay)) en = i; });
    const fark = Math.round(G[en].pay - P[en].pay);
    const not = fark === 0 ? 'Dağılım plana uyuyor' : AILE_AD[harfler[en]] + ' planın ' + (fark > 0 ? 'üstünde' : 'altında');
    return kutu('Ders dengesi', 'hesaplandı', VT().dersDengesi({ baslik:'Haftalık ders dengesi · dakika', plan:P, gercek:G, not, fark })
      + VT().dersIsaretleri({ dersler:harfler.map(h => ({ harf:h, ad:AILE_AD[h] })) }));
  }

  async function render(){
    const n = viewN();
    await M.ensureWeek(n);
    const week = weekOf(n);
    const phase = M.phaseOf(n);
    const curriculum = M.curriculumFor(n);
    const history = C.completionHistory(8).map(h => ({ label:'H'+h.n, value:h.value }));

    /* 112 çakışma (dilim düzeyi): hedef ağının bütçesinden; HKM yoksa yok. */
    const cak = (window.LIFEOS || {}).ONERI && R.Hedefler && R.Hedefler.ag
      ? window.LIFEOS.ONERI.butceCakismaHtml(R.Hedefler.ag.butce()) : '';
    return String(K.Grid([
      weekNav(n, week, phase),
      cak ? K.Span(12, raw(cak)) : '',
      K.Span(12, html`<div class="weekgrid">${map(M.weekDates(n), DayColumn)}</div>`),

      K.Span(6, K.Stack([
        contractCard(week, n),
        kapsam(week, n),
        dersDengesi(n),
        K.Card({ title:'Plan tamamlama geçmişi', sub:'Hedef %85',
          body:raw(UI.barChart(history, { targetLine:85, goodAt:85 })) }),
      ])),

      K.Span(4, K.Stack([
        hayaletOneri(n),
        haftaCizgisi(n),
        planIzgarasi(n),
        istisnaCard(),
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
            <div class="small"><b>${U.fmtShort(R.U.gunOf(r.at))}</b> — ${r.reason}</div>`)}</div>` })),
      ])),

      K.Span(12, raw(UI.rail(['contract', 'capacity', 'review', 'carry', 'plan-completion']))),
    ]));
  }

  const handle = {
    /* 125: onay tek yoldan geçer (Onaylar ekranının işleyicisi). */
    async 'office-approve'(el){ return R.Screens.onaylar.handle['office-approve'](el); },
    'istisna-ac'(el){
      const tur = el.dataset.tur;
      istisnaTaslak = { tur, p:{} };
      istisnaSheet(tur, {}, null);
    },
    'istisna-onizle'(){
      if(!istisnaTaslak) return;
      const tur = istisnaTaslak.tur;
      const p = istisnaParams(tur);
      istisnaTaslak.p = p;
      const pv = R.Proposals.preview({ action:ISTISNA_EYLEM[tur], agent:'patron', params:p });
      istisnaSheet(tur, p, pv);
    },
    async 'istisna-uygula'(){
      if(!istisnaTaslak) return;
      const { tur, p } = istisnaTaslak;
      /* Kullanicinin kendi istegi: oneri kutusundan gecer ki ofiste
         «Geri al» ile geri alinabilsin. Orta seviye oldugu icin talep
         bekler; kullanici onizlemeyi gorup «Uygula»ya bastigi icin burada
         onaylanir. */
      const t = await R.Proposals.talep({ action:ISTISNA_EYLEM[tur], agent:'patron',
        source:'istek', params:p, reason:'Hafta ekranından.' });
      let ok = false, why = t.why;
      if(t.row){
        const r = t.otomatik ? { ok:true } : await R.Proposals.approve(t.row.id);
        ok = !!(r && r.ok);
        if(!ok) why = r && r.why;
      }
      istisnaTaslak = null;
      UI.closeSheet();
      UI.toast(ok ? 'Plan güncellendi · ofiste geri alınabilir' : (why || 'Uygulanamadı'));
      R.App.render();
    },
    'istisna-bitir'(el){
      const id = el.dataset.id;
      const x = R.Istisna.liste().find(i => i.id === id);
      if(!x) return;
      const basladi = x.from <= U.todayISO();
      UI.confirmSheet(basladi ? 'İstisnayı bugün bitir' : 'İstisnayı kaldır',
        basladi ? 'Bugün ve sonraki günler temel plana göre yeniden kurulur. Geçmiş günler olduğu gibi kalır.'
          : 'Bu istisna hiç uygulanmamış gibi kalkar.',
        async () => {
          const r = await R.Istisna.bitir(id);
          UI.toast(r.ok ? 'Plan temel düzenine döndü' : r.why);
          R.App.render();
        }, false, basladi ? 'İstisnayı bugün bitir' : 'İstisnayı kaldır');
    },
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
      if(week.mainTopics.length >= konuSiniri()) return;
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
    render, handle, change, openReview, sureOner,
  };
})();
