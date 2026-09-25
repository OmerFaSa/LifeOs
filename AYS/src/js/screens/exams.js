/* Deneme — kayit, net hesabi, analiz protokolu ve hata olaylari.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz; metin h`` icinde
   otomatik kacirilir, yapisal parcalar C.* bilesenlerinden gelir. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.exams = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const FILTERS = [{ value:'all', label:'Tümü' }, { value:'TYT', label:'TYT' }, { value:'AYT', label:'AYT' }];

  function analysisState(exam){
    if(exam.analysisCompletedAt) return { label:'Analiz tamam', tone:'ok' };
    const hours = (Date.now() - new Date(exam.date+'T12:00:00').getTime())/3600000;
    if(hours > 24) return { label:'Analiz borcu', tone:'danger' };
    return { label:'Analiz bekliyor', tone:'warn' };
  }

  /* ---------- liste ---------- */

  function ExamRow(exam){
    const st = analysisState(exam);
    const errs = S.errors.filter(e => e.examId === exam.id).length;
    const meta = [U.fmtDate(exam.date), exam.publisher, errs ? errs+' hata kaydı' : null].filter(Boolean).join(' · ');
    return html`
      <div class="listitem listitem--tap" data-act="open-exam" data-id="${exam.id}">
        <div class="exam-row__net">
          <div class="num exam-net">${U.fmtNet(M.examNet(exam))}</div>
          <div class="tiny dim">net</div>
        </div>
        <div class="grow">
          <div class="row-sm"><b>${exam.type}</b>${K.Badge({ label:exam.family, tone:'muted' })}</div>
          <div class="tiny dim">${meta}</div>
        </div>
        ${K.Badge({ label:st.label, tone:st.tone })}
      </div>`;
  }

  /* Dönem başına plan/gerçekleşen. Dört sütunlu tablo bu dar kolonda
     taşıp kesiliyordu ("Branş" başlığı yarım, değerler görünmüyordu);
     dönem başlığı üstte, üç ölçüm altında etiket olarak dizilir. */
  function volumeTable(){
    const curWeek = M.currentWeek();
    const pill = (label, actual, target, note) => {
      if(!target){
        return html`<span class="volpill volpill--off"><b>${label}</b> ${note || '—'}</span>`;
      }
      const span = target[1] !== target[0] ? target[0]+'–'+target[1] : String(target[0]);
      return html`<span class="${'volpill' + (actual >= target[0] ? ' is-ok' : '')}">
        <b>${label}</b> <span class="num">${actual}</span><span class="dim">/${span}</span></span>`;
    };
    return html`<div class="vollist">${map(C.examVolumeProgress(), v => {
      const active = curWeek >= v.weeks[0] && curWeek <= v.weeks[1];
      return html`<div class="${'volrow' + (active ? ' is-now' : '')}">
        <div class="volrow__head">
          <span class="volrow__period">${v.period}</span>
          ${when(active, () => K.Badge({ label:'şimdi', tone:'ok' }))}
        </div>
        <div class="volrow__cells">
          ${pill('TYT', v.actual.tyt, v.tyt)}
          ${pill('AYT', v.actual.ayt, v.ayt, v.aytNote)}
          ${pill('Branş', v.actual.branch, v.branch, v.branchNote)}
        </div>
      </div>`;
    })}</div>`;
  }

  /* 035 ARALIK ÇUBUĞU (vitrin): sıralama tahmini tek sayı değil banttır;
     dayanak (kaç tam deneme) yanında yazar. Yeterli deneme yoksa «—». */
  function siralamaKutusu(){
    const G = (window.LIFEOS || {}).GRAFIK;
    if(!G) return '';
    const est = C.estimateScore();
    return K.Kutu({ ad:'Sıralama', yuva:est.ok ? 'tahmin' : 'veri yok',
      govde:raw(G.aralikHtml(est.ok ? { alt:est.rankBest, ust:est.rankWorst, olasi:est.rank, min:1,
          max:Math.round(Math.max(est.rankWorst, est.targetRank) * 1.15), ters:true,
          dayanak:est.samples, dayanakBirim:'tam deneme' }
        : { dayanak:C.fullExams('TYT').length, dayanakBirim:'tam deneme (en az 3 gerekir)' })) });
  }

  /* ---------- C · vitrin kartları (brand/ortak/vitrin.js) ---------- */
  const VT = () => (window.LIFEOS || {}).VITRIN;
  const kutu = (ad, yuva, ic, o) => ic ? K.Kutu(Object.assign({ ad, yuva, class:'vkutu', govde:raw(ic) }, o || {})) : '';
  const r2 = n => Math.round(n * 100) / 100;

  /* 066 HEDEFE KALAN: bugünkü net son tam TYT'nin neti; hedef tahmini
     sıra modelinden (`C.netGapToTarget`), bu yüzden etiket TAHMİN. */
  function hedefeKalanKutusu(){
    if(!VT()) return '';
    const gap = C.netGapToTarget();
    const tyt = C.fullExams('TYT');
    if(!gap || !tyt.length) return '';
    const simdi = r2(M.examNet(tyt[tyt.length - 1]));
    const hafta = Math.max(1, Math.ceil(U.diffDays(U.todayISO(), R.PLAN.examTytISO) / 7));
    const kalan = Math.max(0, gap.netDiff);
    return kutu('Hedefe kalan', 'tahmin', VT().hedefeKalan({ ad:'Hedef net', simdi, hedef:r2(simdi + kalan),
      kalanHafta:hafta, haftalik:gap.reached ? null : r2(kalan / hafta), birim:'net', kesinlik:'estimated',
      not:gap.reached ? 'Hedef bandın üstündesin; bandı koru' : '' }));
  }

  /* 057 DENEME TAKVİMİ: son deneme netiyle, sonraki üç deneme günü PLANDAN
     (haftanın deneme ritüeli; ara günü atlanır). */
  function denemeTakvimi(){
    if(!VT()) return '';
    const bugun = U.todayISO();
    const gecmis = S.exams.filter(e => e.date <= bugun).sort((a, b) => a.date.localeCompare(b.date)).slice(-1);
    const gun = R.WEEKDAYS.findIndex(w => w.ritual === 'exam');
    const plan = [];
    for(let i = 1; i <= 35 && plan.length < 3; i++){
      const d = U.iso(U.addDays(U.today(), i));
      if(U.weekdayIndex(d) !== gun) continue;
      const ist = R.Istisna ? R.Istisna.gunIcin(d) : null;
      if(ist && ist.tur === 'ara') continue;
      plan.push(d);
    }
    if(!plan.length) return '';
    const ilk = gecmis.length ? gecmis[0].date : bugun, son = plan[plan.length - 1];
    const aralik = Math.max(1, U.diffDays(ilk, son));
    const yer = d => 6 + 88 * U.diffDays(ilk, d) / aralik;
    const ne = d => { const g = U.diffDays(bugun, d); return g < 7 ? g + ' gün sonra' : Math.round(g / 7) + ' hafta'; };
    const ogeler = gecmis.map(e => ({ ad:e.type || 'Deneme', yer:yer(e.date), not:U.fmtNet(M.examNet(e)) + ' net', durum:'g' }))
      .concat(plan.map((d, i) => ({ ad:U.fmtShort(d), yer:yer(d), not:ne(d), durum:i === 0 ? 'y' : '' })));
    if(ogeler.length < 2) return '';
    return kutu('Deneme takvimi', 'planlı', VT().denemeTakvimi({ ogeler, bugun:yer(bugun), kesinlik:'computed', etiketAd:'planlı' }));
  }

  function listView(){
    const filter = S.ui.examFilter || 'all';
    let list = S.exams.slice().sort((a, b) => b.date.localeCompare(a.date));
    if(filter !== 'all') list = list.filter(e => e.family === filter);
    const pg = K.paginate(list, S.ui.examPage || 1, 25);

    const body = list.length
      ? html`<div class="list">${map(pg.items, ExamRow)}</div>
             ${K.Pager({ page:pg.page, pages:pg.pages, total:pg.total, act:'exam-page' })}`
      : K.Empty({ icon:'exam',
          text:'Henüz deneme eklenmedi. Cumartesi denemesi yalnız skor üretmez; bir sonraki haftanın ders dağılımını belirler.',
          action:K.Button({ label:'İlk denemeyi ekle', icon:'plus', tone:'primary', act:'new-exam' }) });

    return K.Grid([
      K.Span(8, K.Stack([
        K.Row([
          K.Segmented({ items:FILTERS, value:filter, act:'exam-filter', aria:'Deneme ailesi' }),
          html`<span class="small dim">${U.plural(list.length, 'kayıt', 'kayıt')}</span>`,
        ], { between:true, wrap:true }),
        K.Card({ body, pad:'sm' }),
      ])),
      K.Span(3, K.Stack([
        siralamaKutusu(),
        hedefeKalanKutusu(),
        denemeTakvimi(),
        K.Card({ title:'Deneme hacmi', hint:'exam-volume', sub:'Plan / gerçekleşen', body:volumeTable() }),
        K.Card({ title:'Yayın merdiveni', hint:'publisher', sub:'Zorluk kademesi',
          body:html`<div class="ladder">${map(R.PUBLISHER_LADDER, l => html`
            <div class="ladder__row"><span class="ladder__level">${l.level}</span>
              <span class="muted">${l.detail}</span></div>`)}</div>` }),
      ])),
      K.Span(12, raw(UI.rail(['net', 'analysis-debt', 'error-tags', 'exam-volume', 'publisher']))),
    ]);
  }

  /* ---------- detay ---------- */

  function NumCell(o){
    return K.Input({ type:'number', size:'sm', numeric:true, class:'input--cell',
      value:o.value, aria:o.aria, change:o.change, data:o.data });
  }

  /* 062 DENEME GİRİŞİ: ders ders D/Y/B hücreleri; neti kod hesaplar
     (M.testNet). Hedef bandı ve doğruluk korunur. */
  function testTable(exam){
    if(VT()){
      const satirlar = exam.tests.map((t, i) => {
        const answered = t.correct + t.wrong;
        const band = R.TEST_BANDS.find(b => b.exam === exam.family && b.testKey && t.name.indexOf(b.testKey) >= 0);
        const acc = answered ? U.pct(t.correct, answered) : null;
        return { i, ad:t.name, correct:t.correct, wrong:t.wrong, blank:t.blank, net:r2(M.testNet(t)),
          not:band ? 'hedef ' + band.low + '–' + band.high : '', dogruluk:acc, dogrulukDusuk:acc != null && acc < 70 };
      });
      return raw(VT().denemeGirisi({ satirlar, toplam:r2(M.examNet(exam)), change:'test-num' }));
    }
    const rows = exam.tests.map((t, i) => {
      const net = M.testNet(t);
      const answered = t.correct + t.wrong;
      // HATALAR D-8: cevaplanmamis test olculmemistir; «%0» degil «—».
      const acc = answered ? U.pct(t.correct, answered) : null;
      const band = R.TEST_BANDS.find(b => b.exam === exam.family && b.testKey && t.name.indexOf(b.testKey) >= 0);
      const num = (field, label) => NumCell({ value:t[field], aria:t.name+' '+label,
        change:'test-num', data:{ 'data-i':i, 'data-field':field } });
      return [
        t.name,
        num('correct', 'doğru'), num('wrong', 'yanlış'), num('blank', 'boş'),
        html`<b class="num">${U.fmtNet(net)}</b>${when(band, () => html`<div class="tiny dim">hedef ${band.low}–${band.high}</div>`)}`,
        acc == null ? html`<span class="num dim" title="veri yok">—</span>`
          : html`<span class="${acc >= 70 ? 'num' : 'num dim'}">%${acc}</span>`,
      ];
    });
    return K.Table({ rows, headers:['Test', { label:'D', num:true }, { label:'Y', num:true },
      { label:'B', num:true }, { label:'Net', num:true }, { label:'Doğruluk', num:true }] });
  }

  function protocolList(steps){
    return html`<div class="checklist stack-xs">${map(R.ANALYSIS_PROTOCOL, (p, i) => html`
      <label class="${p.key && steps[p.key] ? 'check is-done' : 'check'}" title="${p.detail}">
        <input type="checkbox" ${steps[p.key] ? raw('checked') : ''} data-act="protocol-step" data-key="${p.key}"/>
        <span><b>${(i+1)+'. '+p.title}</b>${when(p.time !== '—', () => html` <span class="tiny dim">${p.time}</span>`)}</span>
      </label>`)}</div>`;
  }

  function ErrorRow(e){
    const label = (e.testName || '—') + (e.questionNo ? ' · soru '+e.questionNo : '');
    return html`
      <div class="listitem">
        ${raw(UI.tagDot(e.tag))}
        <div class="grow">
          <div class="row-sm"><b class="small">${label}</b>
            ${R.ERROR_TAGS[e.tag] ? K.Badge({ label:e.tag+' · '+R.ERROR_TAGS[e.tag].name, tone:'muted' })
              : K.Badge({ label:'etiket yok', tone:'warn' })}
            ${when(e.status, () => K.Badge({ label:e.status, tone:'muted' }))}</div>
          <div class="tiny dim">${e.rootCause || 'kök neden yazılmadı'}</div>
          ${when(e.principle, () => html`<div class="tiny">İlke: ${e.principle}</div>`)}
        </div>
        ${K.IconButton({ icon:'edit', size:'sm', plain:true, aria:'hatayı düzenle', act:'edit-error', data:{ 'data-id':e.id } })}
      </div>`;
  }

  /* 046 DENEME KARNESİ: satır uzunluğu dersin soru sayısıyla orantılı. */
  function karne(exam){
    if(!VT()) return '';
    return kutu('Karne', 'hesaplandı', VT().denemeKarnesi({ aile:exam.family,
      satirlar:exam.tests.map(t => ({ ad:t.name, d:Number(t.correct) || 0, y:Number(t.wrong) || 0, b:Number(t.blank) || 0,
        net:r2(M.testNet(t)) })).filter(x => x.d + x.y + x.b > 0), toplam:r2(M.examNet(exam)) }));
  }

  /* 048 DENEME KARŞILAŞTIRMASI: aynı aile ve türün bir önceki denemesiyle,
     test adına göre eşlenir; eşi olmayan ders «—». */
  function karsilastirma(exam){
    if(!VT()) return '';
    const onceki = S.exams.filter(e => e.id !== exam.id && e.family === exam.family && e.kind === exam.kind && e.date <= exam.date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if(!onceki) return '';
    const satirlar = exam.tests.map(t => {
      const o = onceki.tests.find(x => x.name === t.name);
      return { ad:t.name, once:o ? r2(M.testNet(o)) : null, sonra:r2(M.testNet(t)) };
    });
    return kutu('Önceki denemeyle', 'hesaplandı', VT().denemeKarsilastirma({ onceAd:U.fmtShort(onceki.date), sonraAd:U.fmtShort(exam.date),
      satirlar, toplam:{ once:r2(M.examNet(onceki)), sonra:r2(M.examNet(exam)) } }));
  }

  /* 047 HIZ ŞERİDİ: süreli oturumun soru başına süresi (ölçüldü). */
  function hizSeridi(exam){
    if(!VT() || !M.sessionForExam) return '';
    const ses = M.sessionForExam(exam.id);
    const sureler = ses && (ses.marks || []).map(m => Number(m.spent)).filter(x => x > 0);
    return sureler && sureler.length >= 3 ? kutu('Hız şeridi', 'ölçüldü', VT().hizSeridi({ sureler })) : '';
  }

  /* 056 YANLIŞ NEDENLERİ: hata etiketlerinin dağılımı; etiketi kullanıcı
     seçer (beyan), kod sayar. Etiketsiz hata dağılıma girmez. */
  function nedenler(errs){
    if(!VT()) return '';
    return VT().yanlisNedenleri({ birim:'hata', nedenler:Object.keys(R.ERROR_TAGS).map(k => ({ ad:R.ERROR_TAGS[k].name,
      n:errs.filter(e => e.tag === k).length })).sort((a, b) => b.n - a.n) });
  }

  function detailView(id){
    const exam = S.exams.find(e => e.id === id);
    if(!exam) return K.Empty({ text:'Deneme bulunamadı.',
      action:K.Button({ label:'Denemelere dön', act:'exam-back' }) });

    const errs = S.errors.filter(e => e.examId === id);
    const st = analysisState(exam);
    const steps = exam.protocol || {};
    const dist = {};
    errs.forEach(e => { dist[e.tag] = (dist[e.tag] || 0) + 1; });
    const segs = Object.keys(R.ERROR_TAGS).map(k => ({ label:k, value:dist[k] || 0, color:R.ERROR_TAGS[k].color }));
    const meta = [U.fmtDate(exam.date), exam.publisher, exam.duration ? exam.duration+' dk' : null].filter(Boolean).join(' · ');

    return K.Grid([
      K.Span(12, K.Row([
        K.Button({ label:'Denemeler', icon:'left', size:'sm', tone:'ghost', act:'exam-back' }),
        html`<div class="row-sm">${K.Badge({ label:st.label, tone:st.tone })}
          ${K.IconButton({ icon:'trash', size:'sm', aria:'denemeyi sil', act:'delete-exam', data:{ 'data-id':exam.id } })}</div>`,
      ], { between:true, wrap:true })),

      K.Span(8, K.Stack([
        K.Card({
          title:exam.type, sub:meta,
          actions:html`<div class="right">
            <div class="num exam-net exam-net--lg">${U.fmtNet(M.examNet(exam))}</div>
            <div class="tiny dim">toplam net</div></div>`,
          body:testTable(exam),
        }),
        karsilastirma(exam),
        K.Card({
          title:'Hata analizi', sub:U.plural(errs.length, 'kayıt', 'kayıt'),
          actions:K.Button({ label:'Hata ekle', icon:'plus', size:'sm', tone:'primary', act:'new-error', data:{ 'data-exam':exam.id } }),
          body:html`
            ${when(errs.length, () => html`<div class="mb-12">${nedenler(errs) ? raw(nedenler(errs)) : raw(UI.stackBar(segs))}</div>`)}
            ${errs.length
              ? html`<div class="list">${map(errs, ErrorRow)}</div>`
              : K.Empty({ icon:'list',
                  text:'Henüz hata kaydedilmedi. Her yanlış ve boş için konu ve etiket girilir; yavaş sorular ayrıca işaretlenir.' })}`,
        }),
      ])),

      K.Span(4, K.Stack([
        karne(exam),
        hizSeridi(exam),
        K.Card({
          title:'Analiz protokolü', hint:'analysis-protocol', sub:'24 saat içinde',
          body:html`
            ${protocolList(steps)}
            ${exam.analysisCompletedAt
              ? html`<div class="mt-12">${K.Notice({ tone:'ok',
                  body:'Analiz '+U.fmtDate(exam.analysisCompletedAt.slice(0, 10))+' tarihinde tamamlandı.' })}</div>`
              : K.Button({ label:'Analizi tamamla', icon:'check', tone:'primary', block:true,
                  class:'mt-12', act:'complete-analysis', data:{ 'data-id':exam.id } })}`,
        }),
        K.Card({
          title:'Süre kaydı', hint:'time-drift', sub:'Test başına harcanan dakika',
          body:K.Stack(map(exam.tests, (t, i) => html`
            <div class="row between"><span class="small">${t.name}</span>
              <div class="row-sm">${K.Input({ type:'number', size:'sm', numeric:true, class:'input--mins',
                placeholder:'dk', value:t.minutes == null ? '' : t.minutes, aria:t.name+' süresi',
                change:'test-minutes', data:{ 'data-i':i } })}<span class="tiny dim">dk</span></div>
            </div>`), 'sm'),
        }),
      ])),
    ]);
  }


  /* ---------- süreli oturum (sınav günü provası) ---------- */

  let tick = null;
  function startTick(){
    stopTick();
    tick = setInterval(() => {
      const total = document.getElementById('run-total');
      if(!R.ExamRun.active() || !total){ stopTick(); return; }
      total.textContent = U.fmtClock(R.ExamRun.remaining());
      const test = document.getElementById('run-test');
      if(test) test.textContent = U.fmtClock(R.ExamRun.elapsedTest());
    }, 1000);
  }
  function stopTick(){ if(tick){ clearInterval(tick); tick = null; } }

  function runView(){
    const run = R.ExamRun.active();
    const t = R.ExamRun.currentTest();
    const left = R.ExamRun.remaining();
    const marks = run.marks.filter(m => m.test === t.name);
    const paused = R.ExamRun.isPaused();

    return K.Grid([
      K.Span(8, K.Stack([
        K.Card({ pad:'sm', body:html`
          <div class="row between wrap gap-8">
            <div>
              <div class="mono-label">${run.name}${run.publisher ? ' · ' + run.publisher : ''}</div>
              <div class="${left <= 300 ? 'runclock is-low' : 'runclock'}" id="run-total">${U.fmtClock(left)}</div>
              <div class="tiny dim">kalan toplam süre</div>
            </div>
            <div class="right">
              <div class="mono-label">${t.name}</div>
              <div class="runclock runclock--sm" id="run-test">${U.fmtClock(R.ExamRun.elapsedTest())}</div>
              <div class="tiny dim">${marks.length} / ${t.q} soru işaretlendi</div>
            </div>
          </div>
          ${VT() && t.q <= 80 ? raw(VT().notrSerit({ cevaplar:Array.from({ length:t.q }, (_, i) => i < marks.length) }))
            : K.Bar({ value:U.pct(marks.length, t.q), tone:'' })}` }),

        html`<div class="row gap-8">${map(Object.keys(R.ExamRun.MARKS), k => {
          const m = R.ExamRun.MARKS[k];
          const cls = m.tone === 'ok' ? 'btn grow btn--primary'
            : m.tone === 'warn' ? 'btn grow' : 'btn grow btn--ghost';
          return html`<button class="${cls}" data-act="run-mark" data-kind="${k}"
            ${paused ? raw('disabled') : ''}>
            <span>${m.label}</span><span class="tiny dim">${m.key}</span></button>`;
        })}</div>`,

        K.Row([
          K.Button({ label:'Geri al', size:'sm', tone:'ghost', act:'run-undo', disabled:!run.marks.length }),
          K.Row([
            K.Button({ label:paused ? 'Devam et' : 'Duraklat', size:'sm',
              icon:paused ? 'play' : 'pause', act:'run-pause' }),
            K.Button({ label:'Sonraki test', size:'sm', act:'run-next',
              disabled:run.index >= run.tests.length - 1 }),
            K.Button({ label:'Bitir', size:'sm', tone:'primary', act:'run-finish' }),
          ], { wrap:true }),
        ], { between:true, wrap:true }),

        K.Card({ title:'Testler', sub:'Tıklayarak geç — süre o teste yazılır',
          body:html`<div class="stack-xs">${map(run.tests, (x, i) => html`
            <button class="${'runtest' + (i === run.index ? ' is-on' : '') + (x.finished ? ' is-done' : '')}"
              data-act="run-goto" data-i="${i}">
              <span class="small strong">${x.name}</span>
              <span class="tiny dim num">${U.fmtClock(i === run.index ? R.ExamRun.elapsedTest() : x.seconds)} · ${x.q} soru</span>
            </button>`)}</div>` }),
      ])),

      K.Span(4, K.Stack([
        K.Notice({ tone:'info', title:'Nasıl kullanılır?',
          body:'Her soruyu bitirdiğinde bir tuşa bas: 1 yaptım, 2 zorlandım, 3 atladım. '
             + 'Sistem soru başına süreyi kendisi hesaplar; sonunda dakikaları elle girmene gerek kalmaz.' }),
        K.Card({ title:'Son işaretler', sub:U.plural(run.marks.length, 'işaret', 'işaret'),
          body:run.marks.length
            ? html`<div class="stack-xs">${map(run.marks.slice(-8).reverse(), m => html`
                <div class="row between">
                  <span class="small">${m.test} · ${m.no}. soru</span>
                  <span class="tiny dim num">${m.spent} sn · ${R.ExamRun.MARKS[m.kind].label}</span>
                </div>`)}</div>`
            : K.Empty({ icon:'clock', text:'Henüz işaret yok.' }) }),
        raw(UI.rail(['time-drift', 'analysis-protocol'])),
      ])),
    ]);
  }

  function startRunSheet(){
    const opts = R.EXAM_TEMPLATES.map(t => ({ value:t.id, label:t.name + ' · ' + t.duration + ' dk' }));
    UI.sheet({
      title:'Süreli oturum', subtitle:'Sınav koşullarında prova — süre otomatik ölçülür',
      body:String(K.Stack([
        K.Notice({ tone:'info', body:'Oturum başlayınca kronometre işler. Her soruyu bitirdiğinde '
          + 'bir tuşa basarsın; sistem soru başına süreyi hesaplar.' }),
        K.Cols(2, [
          K.Field({ label:'Şablon', input:K.Select({ id:'rn-tmpl', options:opts, value:'tyt-full' }) }),
          K.Field({ label:'Yayın', input:K.Input({ id:'rn-pub', placeholder:'ör. 345' }) }),
        ]),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Başlat', tone:'primary', icon:'play', act:'run-start' })}`),
    });
  }

  function finishSheet(){
    const run = R.ExamRun.active();
    if(!run) return;
    const sum = R.ExamRun.summary();
    const cell = (key, ph, i, aria) => K.Input({ type:'number', size:'sm', numeric:true,
      class:'input--cell', placeholder:ph, aria:aria, data:{ 'data-run':key, 'data-i':i } });

    UI.sheet({
      title:'Oturumu bitir', subtitle:'Netleri gir — süreler zaten ölçüldü', wide:true,
      body:String(K.Stack([
        K.Cols(3, [
          K.Stat({ label:'Toplam süre', value:U.fmtClock(sum.totalSeconds) }),
          K.Stat({ label:'Süre sapması', value:(sum.overtime > 0 ? '+' : '') + Math.round(sum.overtime/60),
            unit:' dk', tone:sum.overtime > 300 ? 'danger' : sum.overtime > 0 ? 'warn' : 'ok' }),
          K.Stat({ label:'İşaret', value:sum.marks, note:sum.slow + ' zorlandım' }),
        ]),
        html`<div class="stack-sm">${map(run.tests, (t, i) => html`
          <div class="card card--flat card--pad-sm">
            <div class="row between"><b class="small">${t.name}</b>
              <span class="tiny dim num">${U.fmtClock(sum.perTest[i].seconds)} · plan ${U.fmtClock(sum.perTest[i].planned)}</span></div>
            <div class="row-sm mt-8">
              ${cell('c', 'D', i, t.name + ' doğru')}
              ${cell('w', 'Y', i, t.name + ' yanlış')}
              ${cell('b', 'B', i, t.name + ' boş')}
              <span class="tiny dim">/ ${t.q}</span>
            </div>
          </div>`)}</div>`,
        when(sum.warmup, () => K.Notice({ tone:'warn', body:sum.warmup })),
      ])),
      footer:String(html`${K.Button({ label:'İptal et', tone:'danger', act:'run-cancel' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'run-save' })}`),
    });
  }

  /* ---------- formlar ---------- */

  function newExamSheet(){
    const tmplOptions = R.EXAM_TEMPLATES.map(t => ({ value:t.id, label:t.name }));
    const body = K.Stack([
      K.Cols(2, [
        K.Field({ label:'Tarih', input:K.Input({ id:'ex-date', type:'date', value:U.todayISO() }) }),
        K.Field({ label:'Şablon', input:K.Select({ id:'ex-tmpl', options:tmplOptions, value:'tyt-full' }) }),
      ]),
      K.Cols(2, [
        K.Field({ label:'Yayın / aile', hint:'trend için en az 3 deneme aynı aileden',
          input:K.Input({ id:'ex-pub', placeholder:'ör. 345, Bilgi Sarmal, Endemik' }) }),
        K.Field({ label:'Toplam süre (dk)', input:K.Input({ id:'ex-dur', type:'number', numeric:true, value:165 }) }),
      ]),
      /* KÖR NET TAHMİNİ — sonuçları yazmadan ÖNCE.

         Kendi netini kestirebilmek bir süs değil sınav becerisidir: hangi
         testte zaman harcayacağını, hangi soruyu bırakacağını ve bir
         denemenin kötü mü yoksa zor mu olduğunu o kestirim söyler.

         Alan bilerek test satırlarının ÜSTÜNDE durur. Kayıt sırasında
         satırların o an boş olup olmadığına bakılır: sonuçlar girildikten
         sonra yazılan bir tahmin «kör değil» işaretlenir ve kalibrasyon
         puanına katılmaz. Tahmin değil kopya olurdu. */
      K.Field({ label:'Netini kaç tahmin ediyorsun? (isteğe bağlı)',
        hint:'sonuçları yazmadan önce doldur — sonra yazılan tahmin puana girmez',
        input:K.Input({ id:'ex-guess', type:'number', step:'any',
          placeholder:'ör. 62' }) }),
      /* Fikir 7: sonuç kâğıdının fotoğrafı formu DOLDURUR, kaydetmez
         (core/denemefoto.js). Tahmin alanının altında: önce kör tahmin. */
      R.DenemeFoto && R.DenemeFoto.hazir()
        ? K.Drop({ act:'ex-foto', label:'Sonuç kâğıdının fotoğrafından doldur', icon:'file',
            accept:'image/*', hint:'Doğru/yanlış/boş okunur; kaydetmeden önce kontrol edersin' })
        : '',
      raw('<div id="ex-foto-not" class="small" role="status"></div>'),
      raw('<div id="ex-tests" class="stack-sm"></div>'),
      K.Notice({ tone:'info', body:'Net otomatik hesaplanır: doğru − yanlış/4. Boş bırakılan testler kaydedilmez.' }),
    ]);

    UI.sheet({
      title:'Deneme ekle', subtitle:'Hızlı kayıt — hedef 60 saniyenin altı',
      body:String(body),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}${K.Button({ label:'Kaydet', tone:'primary', act:'save-exam' })}`),
    });

    renderTemplateRows('tyt-full');
    const sel = document.getElementById('ex-tmpl');
    sel.addEventListener('change', () => {
      renderTemplateRows(sel.value);
      const t = R.EXAM_TEMPLATES.find(x => x.id === sel.value);
      document.getElementById('ex-dur').value = t.duration;
    });

    /* Tahminin KÖRLÜĞÜ yazıldığı anda ölçülür, kayıt anında değil: o an
       satırlar boşsa tahmin gerçekten bir tahmindir. Sonradan bakıp
       "boş mıydı" diye sormanın yolu yok — bu yüzden burada damgalanır. */
    const tahmin = document.getElementById('ex-guess');
    if(tahmin){
      /* Yalnızca SONUÇ hücrelerine bakılır. Test adı alanı da `data-t`
         taşır ve şablondan dolu gelir; ona bakmak her tahmini «kör değil»
         yapardı. */
      const bosMu = () => ['c', 'w', 'b'].every(k => Array.prototype.slice
        .call(document.querySelectorAll('#ex-tests [data-t="' + k + '"]'))
        .every(i => String(i.value).trim() === ''));
      tahmin.dataset.rowsEmpty = 'true';
      tahmin.addEventListener('input', () => {
        /* Bir kez "kör değil" olan tahmin geri KÖR olamaz: satırları
           silip tahmini düzeltmek, sonucu görmüş olmayı geri almaz. */
        if(tahmin.dataset.rowsEmpty === 'false') return;
        tahmin.dataset.rowsEmpty = bosMu() ? 'true' : 'false';
      });
    }
  }

  function renderTemplateRows(tmplId){
    const t = R.EXAM_TEMPLATES.find(x => x.id === tmplId);
    const wrap = document.getElementById('ex-tests');
    if(!wrap || !t) return;
    const cell = (key, ph) => K.Input({ size:'sm', numeric:true, class:'input--cell', type:'number',
      placeholder:ph, aria:ph, data:{ 'data-t':key } });
    wrap.innerHTML = String(html`
      <span class="mono-label">Test sonuçları</span>
      ${map(t.tests, test => html`
        <div class="row-sm" data-test-row>
          ${K.Input({ size:'sm', class:'grow', value:test.name, aria:'test adı', data:{ 'data-t':'name' } })}
          ${cell('c', 'D')}${cell('w', 'Y')}${cell('b', 'B')}
          <span class="tiny dim w-34 right">/${test.q}</span>
        </div>`)}`);
  }

  function errorSheet(examId, errorId){
    const exam = S.exams.find(e => e.id === examId);
    const err = errorId ? S.errors.find(e => e.id === errorId) : null;
    const testOptions = exam.tests.map(t => ({ value:t.name, label:t.name }));
    const tagOptions = Object.keys(R.ERROR_TAGS).map(k => ({ value:k, label:k+' — '+R.ERROR_TAGS[k].name }));
    const topicOptions = [{ value:'', label:'— konu —' }].concat(
      R.SUBJECTS.reduce((acc, s) => acc.concat(s.topics.map(t => ({ value:s.id+'::'+t.id, label:s.name+' · '+t.name }))), [])
    );
    const v = (field, fallback) => err ? (err[field] == null ? '' : err[field]) : (fallback == null ? '' : fallback);

    const body = K.Stack([
      html`<span class="mono-label">Kimlik</span>`,
      K.Cols(3, [
        K.Field({ label:'Test', input:K.Select({ id:'er-test', options:testOptions, value:v('testName') }) }),
        K.Field({ label:'Soru no', input:K.Input({ id:'er-no', type:'number', numeric:true, value:v('questionNo') }) }),
        K.Field({ label:'Durum', input:K.Select({ id:'er-status', options:['Yanlış', 'Boş', 'Yavaş'], value:v('status', 'Yanlış') }) }),
      ]),
      K.Field({ label:'Ders – konu', input:K.Select({ id:'er-topic', options:topicOptions, value:v('topicRef') }) }),
      html`<span class="mono-label">Etiket ve kök neden</span>`,
      K.Cols(2, [
        K.Field({ label:'Etiket', input:K.Select({ id:'er-tag', options:tagOptions, value:v('tag', 'K') }) }),
        K.Field({ label:'Harcanan süre (sn)', input:K.Input({ id:'er-secs', type:'number', numeric:true, value:v('seconds') }) }),
      ]),
      K.Field({ label:'Kök neden — tek somut cümle', hint:'“dikkatsizlik” son açıklama değildir',
        input:K.Input({ id:'er-root', value:v('rootCause'), placeholder:'ör. birimi çevirmeden işleme girdim' }) }),
      K.Field({ label:'Doğru ilke (2–3 satır)',
        input:K.Textarea({ id:'er-principle', rows:2, value:v('principle'),
          placeholder:'Tam çözüm kopyalanmaz; genellenebilir ilke yazılır.' }) }),
      K.Cols(2, [
        K.Field({ label:'Benzer soru — kaynak / test no',
          input:K.Input({ id:'er-similar', value:v('similar'), placeholder:'ör. 345 TYT Mat test 12 / 7' }) }),
        K.Field({ label:'Tamir reçetesi', input:K.Input({ id:'er-recipe', value:v('recipe', R.ERROR_TAGS.K.recipe) }) }),
      ]),
      K.Notice({ tone:'info', body:'Kaydedince tekrar kartı otomatik oluşur ve +1 gün / +3 gün / +1 hafta / +1 ay takvimine girer.' }),
    ]);

    UI.sheet({
      title:err ? 'Hatayı düzenle' : 'Hata ekle',
      subtitle:exam.type+' · '+U.fmtDate(exam.date),
      body:String(body), wide:true,
      footer:String(html`
        ${when(err, () => K.Button({ label:'Sil', tone:'danger', act:'delete-error', data:{ 'data-id':err.id } }))}
        ${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-error',
          data:Object.assign({ 'data-exam':examId }, err ? { 'data-id':err.id } : {}) })}`),
    });

    const tagSel = document.getElementById('er-tag');
    tagSel.addEventListener('change', () => {
      document.getElementById('er-recipe').value = R.ERROR_TAGS[tagSel.value].recipe;
    });
  }

  async function render(){
    if(R.ExamRun.active()) return String(runView());
    return String(S.ui.examOpen ? detailView(S.ui.examOpen) : listView());
  }

  function afterRender(){
    if(R.ExamRun.active()) startTick(); else stopTick();
  }

  const handle = {
    async 'new-exam'(){ newExamSheet(); },
    async 'run-open'(){ startRunSheet(); },
    async 'run-start'(){
      const tmpl = document.getElementById('rn-tmpl').value;
      const pub = document.getElementById('rn-pub').value.trim();
      const res = R.ExamRun.start(tmpl, { publisher:pub });
      if(!res.ok){ UI.toast(res.reason); return; }
      UI.closeSheet();
      UI.toast('Oturum başladı — kronometre işliyor');
      R.App.render();
    },
    async 'run-mark'(el){
      if(R.ExamRun.mark(el.dataset.kind)) R.App.render();
    },
    async 'run-undo'(){ R.ExamRun.undoMark(); R.App.render(); },
    async 'run-pause'(){
      if(R.ExamRun.isPaused()) R.ExamRun.resume(); else R.ExamRun.pause();
      R.App.render();
    },
    async 'run-next'(){
      const next = R.ExamRun.nextTest();
      if(next) UI.toast(next.name + ' başladı');
      R.App.render();
    },
    async 'run-goto'(el){ R.ExamRun.gotoTest(Number(el.dataset.i)); R.App.render(); },
    async 'run-finish'(){ R.ExamRun.pause(); finishSheet(); },
    async 'run-cancel'(){
      UI.confirmSheet('Oturumu iptal et', 'Ölçülen süreler kaydedilmeyecek.', async () => {
        R.ExamRun.cancel();
        UI.closeSheet();
        R.App.render();
      }, true);
    },
    async 'run-save'(){
      const scores = [];
      document.querySelectorAll('[data-run]').forEach(el => {
        const i = Number(el.dataset.i);
        scores[i] = scores[i] || {};
        const key = el.dataset.run === 'c' ? 'correct' : el.dataset.run === 'w' ? 'wrong' : 'blank';
        scores[i][key] = Number(el.value) || 0;
      });
      const res = await R.ExamRun.finish(scores);
      UI.closeSheet();
      if(res){
        S.ui.examOpen = res.exam.id;
        UI.toast('Oturum kaydedildi · net ' + U.fmtNet(M.examNet(res.exam)));
      }
      R.App.render();
    },
    async 'exam-filter'(el){ S.ui.examFilter = el.dataset.value; S.ui.examPage = 1; R.App.render(); },
    async 'exam-page'(el){ S.ui.examPage = Number(el.dataset.page); R.App.render(); },
    async 'open-exam'(el){ S.ui.examOpen = el.dataset.id; R.App.render(); },
    async 'exam-back'(){ S.ui.examOpen = null; R.App.render(); },
    async 'save-exam'(){
      const date = document.getElementById('ex-date').value || U.todayISO();
      const tmpl = R.EXAM_TEMPLATES.find(t => t.id === document.getElementById('ex-tmpl').value);
      const publisher = document.getElementById('ex-pub').value.trim();
      const duration = Number(document.getElementById('ex-dur').value) || tmpl.duration;
      const rows = Array.prototype.slice.call(document.querySelectorAll('#ex-tests [data-test-row]'));
      const tests = rows.map((r, i) => {
        const g = sel => r.querySelector('[data-t="'+sel+'"]').value;
        const ham = { c:g('c'), w:g('w'), b:g('b') };
        /* HIC DOKUNULMAMIS SATIR ATILIR. Once bu bakilir: bos bir satirin
           "boş" sayisini soru sayisindan turetmek, girilmemis bir testi
           "kirk soru bos birakildi" diye kaydederdi. */
        const dolu = ['c','w','b'].some(k => String(ham[k]).trim() !== '');
        if(!dolu) return null;
        const c = Number(ham.c)||0, w = Number(ham.w)||0;
        /* "boş" alani BOS BIRAKILDIYSA sifir yazilmaz: sablonun soru
           sayisindan turetilir, o da yoksa bilinmiyor kalir. */
        const q = (tmpl && tmpl.tests[i]) ? tmpl.tests[i].q : null;
        const bos = M.blankCertainty(c, w, ham.b, q);
        return { name:g('name')||'Test', correct:c, wrong:w,
          blank:bos.blank, blankCert:bos.blankCert, minutes:null };
      }).filter(Boolean);

      if(!tests.length){ UI.toast('En az bir test doldurulmalı'); return; }

      const exam = {
        id:U.uid('e'), date, type:tmpl.name, templateId:tmpl.id,
        family:tmpl.family, kind:tmpl.kind,
        publisher, duration, tests, protocol:{},
        createdAt:new Date().toISOString(), analysisCompletedAt:null,
      };
      /* Tahmin, sonuclar YAZILMADAN once girilmis mi? Girilmediyse kayit
         yine tutulur ama «kor degil» isaretlenir ve puana katilmaz. */
      const tahminEl = document.getElementById('ex-guess');
      const tahmin = tahminEl ? Number(tahminEl.value) : NaN;

      await M.saveExam(exam);

      let kalibrasyonNotu = '';
      if(isFinite(tahmin) && tahminEl && tahminEl.value !== ''){
        const kor = tahminEl.dataset.rowsEmpty !== 'false';
        const acik = await R.Calib.open('exam-net', tahmin,
          { ref:exam.id, blind:kor });
        if(acik.ok){
          const kapali = await R.Calib.settle(acik.forecast.id, M.examNet(exam));
          if(kapali.ok){
            /* Sapma TEK YERDE biçimlenir (`Calib.errorText`): burası
               `exam-net`in `abs` hatasını oran sanıp 100 ile çarpıyordu
               ve 62/58 tahmini «%400» diye yazıyordu. */
            const yazi = R.Calib.errorText(kapali.forecast);
            kalibrasyonNotu = yazi ? (' · tahmin sapması ' + yazi
              + (kor ? '' : ' (kör değil, puana girmez)')) : '';
          }
        }
      }

      UI.closeSheet();
      S.ui.examOpen = exam.id;
      UI.toast('Deneme kaydedildi · net ' + U.fmtNet(M.examNet(exam)) + kalibrasyonNotu);
      R.App.render();
    },
    async 'delete-exam'(el){
      const id = el.dataset.id;
      UI.confirmSheet('Denemeyi sil', 'Bu deneme ve bağlı hata kayıtları silinecek. Bu işlem geri alınamaz.', async () => {
        await M.deleteExam(id);
        S.ui.examOpen = null;
        UI.closeSheet();
        UI.toast('Deneme silindi');
        R.App.render();
      }, true);
    },
    async 'protocol-step'(el){
      const exam = S.exams.find(e => e.id === S.ui.examOpen);
      exam.protocol = exam.protocol || {};
      exam.protocol[el.dataset.key] = el.checked;
      await M.saveExam(exam);
      R.App.render();
    },
    async 'complete-analysis'(el){
      const exam = S.exams.find(e => e.id === el.dataset.id);
      const errs = S.errors.filter(e => e.examId === exam.id);
      if(!errs.length){
        UI.confirmSheet('Hata kaydı yok', 'Hiç hata etiketlenmedi. Yine de analizi tamamlandı olarak işaretlemek istiyor musun?', async () => {
          exam.analysisCompletedAt = new Date().toISOString();
          await M.saveExam(exam);
          UI.closeSheet(); R.App.render();
        });
        return;
      }
      exam.analysisCompletedAt = new Date().toISOString();
      await M.saveExam(exam);
      UI.toast('Analiz tamamlandı');
      R.App.render();
    },
    async 'new-error'(el){ errorSheet(el.dataset.exam); },
    async 'edit-error'(el){
      const err = S.errors.find(e => e.id === el.dataset.id);
      errorSheet(err.examId, err.id);
    },
    async 'save-error'(el){
      const examId = el.dataset.exam;
      const exam = S.exams.find(e => e.id === examId);
      const existing = el.dataset.id ? S.errors.find(e => e.id === el.dataset.id) : null;
      const topicRef = document.getElementById('er-topic').value;
      const [subjectId, topicId] = topicRef ? topicRef.split('::') : [null, null];
      const subject = subjectId ? R.SUBJECTS.find(s => s.id === subjectId) : null;
      const topic = subject ? subject.topics.find(t => t.id === topicId) : null;

      const err = Object.assign(existing || { id:U.uid('r'), createdAt:new Date().toISOString(), closedAt:null, repairDoneAt:null }, {
        examId,
        examDate:exam.date,
        publisher:exam.publisher,
        testName:document.getElementById('er-test').value,
        questionNo:document.getElementById('er-no').value,
        status:document.getElementById('er-status').value,
        tag:document.getElementById('er-tag').value,
        seconds:Number(document.getElementById('er-secs').value) || null,
        rootCause:document.getElementById('er-root').value.trim(),
        principle:document.getElementById('er-principle').value.trim(),
        similar:document.getElementById('er-similar').value.trim(),
        recipe:document.getElementById('er-recipe').value.trim(),
        topicRef, subjectId, topicId,
        topic: topic ? topic.name : '',
      });
      await M.saveError(err);

      if(!existing){
        const card = M.newCard({
          front:(err.topic || err.testName || 'Yanlış') + ' — ' + (err.rootCause || 'kök neden'),
          back:err.principle || err.recipe,
          topic:err.topic || err.testName,
          subjectId:err.subjectId,
          source:'error', sourceRef:err.id,
        });
        await M.saveCard(card);
      }
      UI.closeSheet();
      UI.toast(existing ? 'Hata güncellendi' : 'Hata ve tekrar kartı kaydedildi');
      R.App.render();
    },
    async 'delete-error'(el){
      await M.deleteError(el.dataset.id);
      UI.closeSheet();
      UI.toast('Hata silindi');
      R.App.render();
    },
  };

  const change = {
    async 'ex-foto'(el){
      const f = el.files && el.files[0];
      const sel = document.getElementById('ex-tmpl');
      const tmpl = R.EXAM_TEMPLATES.find(t => t.id === (sel && sel.value));
      const not = document.getElementById('ex-foto-not');
      if(!f || !tmpl) return;
      const r = await UI.withBusy('Sonuç kâğıdı okunuyor', 'sayıları kod doğrular, kaydetmek sende',
        () => R.DenemeFoto.oku(f, tmpl));
      const satirlar = Array.prototype.slice.call(document.querySelectorAll('#ex-tests [data-test-row]'));
      (r.satirlar || []).forEach(x => {
        const row = satirlar[x.i];
        if(!row) return;
        const yaz = (k, v) => { const i = row.querySelector('[data-t="' + k + '"]'); if(i) i.value = v == null ? '' : String(v); };
        yaz('c', x.c); yaz('w', x.w); yaz('b', x.b);
      });
      if(not){
        const parca = [];
        if(r.satirlar && r.satirlar.length) parca.push(r.satirlar.length + ' test fotoğraftan dolduruldu — kaydetmeden önce kontrol et.');
        (r.atlanan || []).forEach(a => parca.push(a.ad + ': ' + a.neden + '.'));
        if(r.eksik && r.eksik.length && r.satirlar && r.satirlar.length) parca.push('Elle yazılacak: ' + r.eksik.join(', ') + '.');
        if(!r.ok && r.note) parca.push(r.note);
        not.textContent = parca.join(' ');
      }
    },
    async 'test-num'(el){
      const exam = S.exams.find(e => e.id === S.ui.examOpen);
      exam.tests[Number(el.dataset.i)][el.dataset.field] = Number(el.value)||0;
      await M.saveExam(exam);
      R.App.render();
    },
    async 'test-minutes'(el){
      const exam = S.exams.find(e => e.id === S.ui.examOpen);
      exam.tests[Number(el.dataset.i)].minutes = el.value === '' ? null : Number(el.value);
      await M.saveExam(exam);
    },
  };

  return {
    id:'exams',
    title:'Deneme',
    subtitle(){
      const debt = C.analysisDebt().length;
      return S.exams.length + ' deneme' + (debt ? ' · ' + debt + ' analiz borcu' : ' · analiz borcu yok');
    },
    actions(){
      if(R.ExamRun.active()) return '';
      return String(html`
        ${K.Button({ label:'Süreli oturum', icon:'clock', size:'sm', act:'run-open' })}
        ${K.Button({ label:'Deneme ekle', icon:'plus', size:'sm', tone:'primary', act:'new-exam' })}`);
    },
    onKey(e){
      if(!R.ExamRun.active() || UI.isSheetOpen()) return;
      if(e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      const keys = { '1':'ok', '2':'slow', '3':'skip' };
      if(keys[e.key]){ e.preventDefault(); handle['run-mark']({ dataset:{ kind:keys[e.key] } }); }
    },
    render, afterRender, handle, change,
  };
})();
