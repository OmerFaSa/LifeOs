/* Ilerleme — KPI panosu, grafikler ve aylik karar kapisi.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.progress = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const FAMILIES = [{ value:'TYT', label:'TYT' }, { value:'AYT', label:'AYT' }];

  const GATE_STATUS = {
    safe:'güvenli bantta', inband:'gözlenen bantta', above:'bandın üstünde',
    below:'bandın ALTINDA', unknown:'veri yok',
  };

  /* ---------- KPI panosu ---------- */

  function kpiValues(){
    const cur = M.currentWeek();
    const comp = C.planCompletion(cur);
    const qr = C.questionRealization(cur);
    const closure = C.overallClosure();
    const tyt = C.medianTrend('TYT');
    const base = C.examBase('TYT');
    const pareto = C.errorPareto();
    const debt = C.cardDebt();
    const history = C.completionHistory(8).map(h => h.value);

    const timeDrift = (function(){
      const withTime = C.fullExams('TYT').slice(-3).filter(e => e.tests.some(t => t.minutes != null));
      if(!withTime.length) return null;
      const last = withTime[withTime.length-1];
      return U.sum(last.tests.map(t => t.minutes || 0)) - (last.duration || 165);
    })();

    return [
      { key:'planCompletion', num:comp, birim:'%', value:comp == null ? '—' : '%'+comp, spark:history, note:'bu hafta',
        progress:comp, target:85,
        tone:comp == null ? null : comp >= 85 ? 'ok' : comp >= 70 ? 'warn' : 'danger' },
      { key:'questionRate', num:qr && qr.pct != null ? qr.pct : null, birim:'%', value:qr && qr.pct != null ? '%'+qr.pct : '—', note:qr ? qr.solved+' / '+qr.target+' soru' : 'hedef girilmemiş',
        progress:qr ? qr.pct : null, target:90,
        tone:qr && qr.pct >= 90 ? 'ok' : qr && qr.pct >= 70 ? 'warn' : null },
      { key:'topicClosure', num:closure.pct, birim:'%', value:'%'+closure.pct, tone:closure.pct >= 55 ? 'ok' : 'warn',
        progress:closure.pct, target:55,
        note:closure.closed+' / '+closure.total+' konu' },
      { key:'netTrend', num:tyt.delta, birim:'net', ondalik:2, spark:tyt.series,
        value:tyt.delta == null ? '—' : (tyt.delta > 0 ? '+' : '')+U.fmtNet(tyt.delta),
        tone:tyt.delta == null ? null : tyt.delta > 0 ? 'ok' : tyt.delta < -1 ? 'danger' : 'warn',
        note:tyt.last3 == null ? 'en az 3 tam TYT gerekir'
          : 'son3 '+U.fmtNet(tyt.last3)+(tyt.prev3 != null ? ' · önceki3 '+U.fmtNet(tyt.prev3) : '') },
      { key:'examBase', num:base, birim:'net', ondalik:2, value:base == null ? '—' : U.fmtNet(base), note:'son 4 denemenin en düşüğü' },
      { key:'errorMix', value:pareto[0] && pareto[0].count ? pareto[0].tag : '—',
        note:pareto[0] && pareto[0].count ? R.ERROR_TAGS[pareto[0].tag].name+' · %'+pareto[0].pct : 'hata kaydı yok' },
      { key:'timeDrift', num:timeDrift, birim:'dk', value:timeDrift == null ? '—' : (timeDrift > 0 ? '+' : '')+timeDrift,
        unit:timeDrift == null ? '' : ' dk', note:'son tam TYT',
        tone:timeDrift == null ? null : timeDrift > 5 ? 'warn' : 'ok' },
      { key:'cardDebt', num:debt, birim:'%', value:'%'+debt, tone:debt > 10 ? 'danger' : 'ok',
        progress:debt, target:10,
        note:C.overdueCards().length+' gecikmiş kart' },
    ];
  }

  /* iPhone Faz 3 (2026-10-02): sekiz KPI kutusu tek dönen kart. Sıra kural
     motorundan: hedefin dışındakiler önce (danger, warn), sonra öbürleri.
     Ölçülmemiş KPI sayı değil cümledir. */
  function DonenGidisat(){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V || !V.donen) return '';
    const L = window.LIFEOS || {};
    const sayi = o => L.SAYI ? L.SAYI.html(o) : U.esc(String(o.deger) + (o.birim ? ' ' + o.birim : ''));
    const sira = t => t === 'danger' ? 0 : t === 'warn' ? 1 : 2;
    const buyuk = t => String(t || '').charAt(0).toLocaleUpperCase('tr-TR') + String(t || '').slice(1);
    const m = kpiValues().map((c, i) => ({ c, i, def:R.KPI_DEFS.find(d => d.key === c.key) }))
      .sort((a, b) => (sira(a.c.tone) - sira(b.c.tone)) || a.i - b.i)
      .map(({ c, def }) => c.num == null
        ? { ust:def.name, cumle:(c.value !== '—' ? c.note : /gerek|yok|girilmemiş/.test(c.note || '') ? buyuk(c.note) : 'Veri yok') + '.',
            vurgu:'Hedef ' + def.target + '.', sistem:'ays' }
        : { ust:def.name, sayi:sayi({ deger:c.num, birim:c.birim, ondalik:c.ondalik, kesinlik:'computed', formul:def.formula }),
            cumle:c.tone === 'ok' ? 'hedefte.' : c.tone ? 'hedefin dışında.' : '',
            vurgu:'Hedef ' + def.target + (c.note ? ' · ' + c.note : '') + '.', sistem:'ays' });
    const ayt = C.medianTrend('AYT'), ab = C.examBase('AYT');
    if(ayt.last3 != null) m.push({ ust:'AYT medyanı', sayi:sayi({ deger:ayt.last3, birim:'net', ondalik:2, kesinlik:'computed',
      formul:'son 3 tam AYT denemesinin medyanı' }), cumle:'son 3 tam deneme.', vurgu:ab == null ? 'Taban yok.' : 'Taban ' + U.fmtNet(ab) + '.', sistem:'ays' });
    return raw(V.donen({ id:'ays-gidisat', ad:'Gidişat', maddeler:m }));
  }

  /* ---------- trend ---------- */

  function trendCard(){
    const tyt = C.medianTrend('TYT'), ayt = C.medianTrend('AYT');
    const gate = C.currentGate();

    if(!tyt.series.length && !ayt.series.length){
      return K.Card({ title:'Deneme net trendi', body:K.Empty({ icon:'chart',
        text:'Tam deneme girildikçe medyan trendi burada oluşur. Karar tek denemeyle değil, son üç denemenin medyanıyla verilir.',
        action:K.Button({ label:'Deneme ekle', tone:'primary', act:'go', data:{ 'data-route':'exams' } }) }) });
    }

    const delta = (fam, t) => when(t.delta != null, () =>
      K.Badge({ label:fam+' '+(t.delta > 0 ? '+' : '')+U.fmtNet(t.delta), tone:t.delta > 0 ? 'ok' : 'warn' }));

    return K.Card({
      hint:'median', title:'Deneme net trendi',       actions:html`<div class="row-sm">${delta('TYT', tyt)}${delta('AYT', ayt)}</div>`,
      body:html`
        ${raw(UI.lineChart([{ data:tyt.series }, { data:ayt.series, accent:true }],
          { labels:C.fullExams('TYT').map(e => U.fmtShort(e.date)), band:gate ? gate.tyt : null, height:180 }))}
        ${raw(UI.legend([
          { label:'TYT tam deneme', color:'var(--primary)' },
          { label:'AYT tam deneme', color:'var(--accent)' },
          { label:'bu ayın gözlenen bandı', color:'var(--c-band)' },
        ]))}
`,
    });
  }

  /* ---------- karar kapisi ---------- */

  function gateCard(){
    const gate = C.currentGate();
    if(!gate) return raw('');
    const key = U.monthKey(U.today());
    const decision = S.decisions[key];
    const g = C.gateSuggestions(gate);

    const meter = (fam, status, value, band, safe) => html`
      <div class="stack-xs">
        <div class="row between"><span class="mono-label">${fam} · ${GATE_STATUS[status]}</span>
          <b class="num">${value == null ? '—' : U.fmtNet(value)}</b></div>
        ${raw(UI.rangeBar(value, band, safe, '', { bare:true }))}
      </div>`;

    const choice = decision
      ? html`
        ${K.Notice({ tone:'ok', title:'Seçilen müdahale:', body:html`${decision.action}
          <div class="small muted">Veri dönemi: ${decision.window} · Yeniden değerlendirme: ${U.fmtDate(decision.reevaluateAt)}</div>` })}
        ${K.Button({ label:'Müdahaleyi değiştir', size:'sm', act:'clear-decision', data:{ 'data-key':key } })}`
      : html`
        <div class="stack-xs"><span class="mono-label">Bir ana müdahale seç</span>
          ${map(g.suggestions, (s, i) => html`
            <label class="check"><input type="radio" name="gate-opt" value="${i}"/>
              <span>${s.text}<br/><span class="tiny dim">${s.why}</span></span></label>`)}
        </div>
        ${K.Button({ label:'Ana müdahaleyi kaydet', tone:'primary', act:'save-decision' })}`;

    return K.Card({
      hint:'gate', title:'Aylık karar kapısı — '+gate.month,
      badge:decision ? K.Badge({ label:'karar verildi', tone:'ok' }) : K.Badge({ label:'karar bekliyor', tone:'warn' }),
      body:K.Stack([
        meter('TYT', g.tytStatus, g.tyt.last3, gate.tyt, gate.tytSafe),
        when(gate.ayt, () => meter('AYT', g.aytStatus, g.ayt.last3, gate.ayt, gate.aytSafe)),
        /* Karar beklerken kural zaten ilk seçenektir («Bu ayın kapı kuralı»);
           ayrıca kutuda yazmak aynı cümleyi iki kez okutuyordu. */
        when(decision, () => K.Notice({ tone:'info', title:'Bu ayın kuralı:', body:gate.note })),
        choice,
      ]),
    });
  }

  /* ---------- test bazli trend ---------- */

  function testTrendCard(){
    const fam = S.ui.trendFamily || 'TYT';
    const series = C.testSeries(fam);
    const seg = K.Segmented({ items:FAMILIES, value:fam, act:'trend-family', aria:'Deneme ailesi' });

    if(!series.length){
      return K.Card({ title:'Test bazlı trend', actions:seg,
        body:K.Empty({ icon:'chart', text:'Tam deneme girildikçe her test için ayrı trend burada oluşur.' }) });
    }

    const rows = series.map(s => {
      const vals = s.data.filter(v => v != null);
      const last = vals.length ? vals[vals.length-1] : null;
      const first = vals.length ? vals[0] : null;
      const med = U.median(vals.slice(-4));
      const band = R.TEST_BANDS.find(b => b.testKey === s.name && b.exam === fam);
      const change = (first != null && last != null) ? U.round(last-first, 1) : null;
      const status = (!band || med == null) ? K.Badge({ label:'—', tone:'muted' })
        : med >= band.high ? K.Badge({ label:'üst bant', tone:'ok' })
        : med >= band.low ? K.Badge({ label:'bantta', tone:'ok' })
        : K.Badge({ label:'altında', tone:'warn' });
      return [
        html`<b class="small">${s.name}</b>${when(band, () => html`<div class="tiny dim">hedef ${band.low}–${band.high}</div>`)}`,
        raw(UI.sparkline(s.data)),
        html`<span class="num">${med == null ? '—' : U.fmtNet(med)}</span>`,
        html`<span class="${change > 0 ? 'num is-up' : change < 0 ? 'num is-down' : 'num dim'}">${change == null ? '—' : (change > 0 ? '+' : '')+U.fmtNet(change)}</span>`,
        status,
      ];
    });

    return K.Card({
      title:'Test bazlı trend', sub:'Test başına seyir', actions:seg,
      body:K.Table({ tight:true, rows,
        headers:['Test', 'Seyir', { label:'Son 4 medyan', num:true }, { label:'İlk→son', num:true }, 'Durum'] }),
    });
  }

  /* ---------- katlanir referanslar ---------- */

  function monthCurveCard(){
    const now = U.monthName(U.today());
    const rows = Object.keys(R.MONTH_GATES).map(m => {
      const g = R.MONTH_GATES[m];
      const range = b => b ? b[0]+'–'+b[1] : '—';
      return [
        m === now ? html`<b>${m}</b> ${K.Badge({ label:'şimdi', tone:'ok' })}` : m,
        html`<span class="num">${range(g.tyt)}</span>`,
        html`<span class="num dim">${range(g.tytSafe)}</span>`,
        html`<span class="num">${range(g.ayt)}</span>`,
        html`<span class="num dim">${range(g.aytSafe)}</span>`,
        html`<span class="small muted">${g.note}</span>`,
      ];
    });
    return K.Collapsible({
      title:'Aylık net gelişim eğrisi', meta:'koçluk bandı', act:'toggle-month-curve', open:!!S.ui.monthCurveOpen,
      body:K.Table({ tight:true, rows, headers:['Ay', { label:'TYT gözlenen', num:true }, { label:'TYT güvenli', num:true },
        { label:'AYT gözlenen', num:true }, { label:'AYT güvenli', num:true }, 'Karar kapısı'] }),
    });
  }

  function kpiReference(){
    return K.Collapsible({
      title:'KPI sözlüğü', meta:'formül ve müdahale', act:'toggle-kpi-ref', open:!!S.ui.kpiRefOpen,
      body:K.Table({ tight:true, headers:['KPI', 'Formül', 'Hedef', 'Sapmada'],
        rows:R.KPI_DEFS.map(d => [
          html`<b class="small">${d.name}</b>`,
          html`<span class="small dim">${d.formula}</span>`,
          K.Badge({ label:d.target, tone:'muted' }),
          html`<span class="small muted">${d.action}</span>`,
        ]) }),
    });
  }

  /* ---------- ekran ---------- */

  async function render(){
    const pareto = C.errorPareto();
    const history = C.completionHistory(8).map(h => ({ label:'H'+h.n, value:h.value }));
    const sleep = C.sleepAverage(7);
    const debt = C.cardDebt();
    const closure = C.overallClosure().pct;

    /* Raf iki sütunu DOM sırasıyla dizer: trend ile karar kapısı yan yana,
       şeritler altta; gizli başvuru kartları en sonda (iPhone Faz 3). */
    return String(K.Grid([
      K.Span(12, DonenGidisat()),
      K.Span(6, K.Stack([ trendCard() ])),
      K.Span(4, K.Stack([ gateCard() ])),
      K.Span(6, K.Stack([
        testTrendCard(),
        K.Card({ title:'Plan tamamlama — son 8 hafta', sub:'Hedef %85',
          body:raw(UI.barChart(history, { targetLine:85, goodAt:85 })) }),
        monthCurveCard(),
        kpiReference(),
      ])),
      K.Span(4, K.Stack([
        K.Card({ hint:'pareto', title:'Hata paretosu', body:html`
          ${raw(UI.paretoBars(pareto))}
          ${when(pareto[0] && pareto[0].count, () => html`<div class="mt-10">${K.Notice({ tone:'info',
            body:'Reçete: '+R.ERROR_TAGS[pareto[0].tag].recipe })}</div>`)}` }),
        K.Card({ hint:'not-surec-gostergeleri', title:'Süreç göstergeleri', body:K.Stack([
          K.Meter({ label:'Tekrar borcu', value:debt, text:'%'+debt, tone:debt > 10 ? 'danger' : '' }),
          K.Meter({ label:'Konu kapanışı', value:closure, text:'%'+closure }),
          /* «Bu hızla» (fikir 20): kapanış hızından sınava yetişme — tahmin. */
          html`<p class="tiny dim">${C.buHizla().metin}</p>`,
          html`<p class="tiny dim">${C.verimliSaat().metin}</p>`,
          when(sleep != null, () => K.Meter({ label:'Uyku (7 gün ort.)',
            value:U.pct(sleep, S.profile.sleepTarget), text:sleep+' / '+S.profile.sleepTarget+' sa' })),
        ], 'sm') }),
      ])),

      K.Span(12, raw(UI.rail(['median', 'base-score', 'bands', 'gate', 'pareto', 'plan-completion', 'test-trend']))),
    ]));
  }

  const handle = {
    async 'trend-family'(el){ S.ui.trendFamily = el.dataset.value; R.App.render(); },
    async 'toggle-kpi-ref'(){ S.ui.kpiRefOpen = !S.ui.kpiRefOpen; R.App.render(); },
    async 'toggle-month-curve'(){ S.ui.monthCurveOpen = !S.ui.monthCurveOpen; R.App.render(); },
    async 'save-decision'(){
      const sel = document.querySelector('input[name="gate-opt"]:checked');
      if(!sel){ UI.toast('Bir müdahale seç'); return; }
      const gate = C.currentGate();
      const g = C.gateSuggestions(gate);
      const chosen = g.suggestions[Number(sel.value)];
      const key = U.monthKey(U.today());
      const dataWindow = C.fullExams('TYT').slice(-3).map(e => U.fmtShort(e.date)).join(', ') || 'deneme verisi yok';
      await M.saveDecision(key, {
        month:gate.month,
        action:chosen.text,
        why:chosen.why,
        threshold:gate.note,
        window:dataWindow,
        createdAt:new Date().toISOString(),
        reevaluateAt:U.iso(U.addDays(U.today(), 21)),
      });
      UI.toast('Müdahale kaydedildi · 21 gün sonra yeniden değerlendirilecek');
      R.App.render();
    },
    async 'clear-decision'(el){
      UI.confirmSheet('Müdahaleyi değiştir', 'Bu ayın seçili müdahalesi silinecek ve yeniden seçebileceksin.', async () => {
        delete S.decisions[el.dataset.key];
        await R.Store.remove('decisions/'+el.dataset.key);
        UI.closeSheet();
        R.App.render();
      }, false, 'Müdahaleyi kaldır');
    },
  };

  return {
    id:'progress',
    /* iPhone Faz 3: açık trend ve (karar bekliyorsa) karar kapısı; test
       trendi, plan geçmişi ve pareto şerit; başvuru kartları app.js'te gizli. */
    get kucukVarsayilan(){
      const G = (window.LIFEOS || {}).Gizle;
      const gate = C.currentGate();
      const verildi = gate && S.decisions[U.monthKey(U.today())];
      return ['test-bazlı-trend', 'plan-tamamlama-son-hafta', 'hata-paretosu']
        .concat(G && verildi ? [G.anahtar('Aylık karar kapısı — ' + gate.month)] : []);
    },
    title:'İlerleme',
    subtitle(){
      const t = C.medianTrend('TYT');
      return t.last3 == null ? 'Henüz tam deneme medyanı yok'
        : 'TYT medyanı '+U.fmtNet(t.last3)+' · taban '+U.fmtNet(C.examBase('TYT'));
    },
    actions(){ return ''; },
    render, handle,
  };
})();
