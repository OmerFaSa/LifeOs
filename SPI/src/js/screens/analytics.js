/* Analiz — alanlar arası bağlar ve haftalık konsolide rapor.

   Bu ekranın tek dürüstlük kuralı: KORELASYON NEDENSELLİK DEĞİLDİR.
   Bulgu daima «birlikte hareket ediyor» diliyle yazılır, «sebep oldu»
   diliyle değil. Ortak gün sayısı yetersizse bulgu hiç üretilmez. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.analytics = (function(){
  const U = SP.U, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  const TABS = [
    { id:'capraz', label:'Çapraz bağlar',  icon:'layers' },
    { id:'hafta',  label:'Haftalık rapor', icon:'list' },
    { id:'seri',   label:'Seriler',        icon:'chart' },
  ];

  /* --------------------------------------------------------------- capraz */

  function crossCard(){
    const rows = SP.Calc.crossFindings(60);
    const strong = rows.filter(r => r.ok && !r.weak);
    return K.Card({
      title:'Çapraz bağlar',
      sub:'Son 60 gün · aynı günde ölçülmüş veriler',
      badge:K.Badge({ label:strong.length + ' belirgin bağ', tone:strong.length ? 'info' : 'muted' }),
      body:html`
        ${K.Notice({ tone:'info', body:'Katsayı iki ölçümün birlikte hareket edip etmediğini söyler. '
          + 'Birinin diğerine sebep olduğunu söylemez — bunu ancak deneyerek anlarsın.' })}
        <div class="list mt-12">${map(rows, r => html`
          <div class="listitem">
            <div class="grow">
              <b class="small">${r.link.title}</b>
              ${when(r.ok && !r.weak, () => K.Badge({ label:'r = ' + U.fmtNet(r.r), tone:r.tone }))}
              ${when(r.ok && r.weak, () => K.Badge({ label:'zayıf', tone:'muted' }))}
              ${when(!r.ok, () => K.Badge({ label:'veri yetersiz', tone:'muted' }))}
              <div class="tiny dim mt-2">${r.ok ? r.text : r.note}</div>
            </div>
          </div>`)}</div>`,
    });
  }

  function pairCard(){
    const a = S.ui.pairA || 'sleep';
    const b = S.ui.pairB || 'readiness';
    const pairs = SP.Calc.pairsFor(a, b, 90);
    const c = SP.Calc.correlate(pairs);
    const opts = Object.keys(SP.Calc.SERIES).map(id => ({ value:id, label:seriesLabel(id) }));

    return K.Card({
      title:'Kendi bağını kur',
      sub:'İki ölçümü seç, birlikte hareket edip etmediklerine bak',
      body:html`
        <div class="cols-2">
          ${K.Field({ label:'Birinci ölçüm', input:K.Select({ value:a, change:'pair-a', options:opts }) })}
          ${K.Field({ label:'İkinci ölçüm', input:K.Select({ value:b, change:'pair-b', options:opts }) })}
        </div>
        <div class="mt-12">
          ${when(c.ok, () => html`
            ${K.Stat({ label:'Katsayı', value:U.fmtNet(c.r),
              note:c.n + ' ortak gün · ' + (c.strength >= 0.6 ? 'güçlü' : c.strength >= 0.3 ? 'orta' : 'zayıf') })}
            ${raw(UI.lineChart([
              { data:pairs.map(p => p[0]) },
              { data:pairs.map(p => p[1]), accent:true },
            ], { height:170, area:false }))}
            ${UI.legend([{ label:seriesLabel(a), color:'var(--primary)' },
              { label:seriesLabel(b), color:'var(--accent)' }])}`)}
          ${when(!c.ok, () => K.Notice({ tone:'info',
            body:'Ortak gün sayısı yetersiz (' + c.n + '/' + SP.Calc.MIN_PAIRS + '). '
              + 'İki ölçüm de aynı günlerde girilmiş olmalı.' }))}
        </div>`,
    });
  }

  function seriesLabel(id){
    return ({ sleep:'Uyku', hrv:'HRV', rhr:'İstirahat nabzı', weight:'Kilo', sbp:'Büyük tansiyon',
      readiness:'Toparlanma', load:'Antrenman yükü', protein:'Protein', kcal:'Kalori',
      fiber:'Lif', sodium:'Sodyum' })[id] || id;
  }

  /* ---------------------------------------------------------------- hafta */

  function reportCard(){
    const r = SP.Calc.weeklyReport();
    return K.Card({
      title:'Haftalık konsolide rapor',
      sub:U.fmtRange(r.start, r.end),
      badge:K.Badge({ label:r.discipline.minDays + '/7 asgari gün',
        tone:r.discipline.minDays >= 5 ? 'ok' : 'warn' }),
      body:html`
        ${K.Notice({ tone:'info', body:SP.Calc.headline(r) })}
        <div class="cols-4 mt-12">
          ${K.Stat({ label:'Toparlanma', value:r.readiness.avg == null ? '—' : String(r.readiness.avg),
            note:r.readiness.n + ' gün ölçüldü' })}
          ${K.Stat({ label:'Seans', value:String(r.movement.sessions),
            note:U.fmtNum(r.movement.load) + ' yük' })}
          ${K.Stat({ label:'Öğün kaydı', value:r.nutrition.loggedDays + '/7',
            note:r.nutrition.proteinPct != null ? 'protein %' + r.nutrition.proteinPct : 'hedef yok' })}
          ${K.Stat({ label:'Sepet', value:r.money.rows.length ? U.fmtNum(Math.round(r.money.total)) : '—',
            unit:r.money.rows.length ? 'TL' : '', note:r.money.over ? 'sınır aşıldı' : 'sınır içinde' })}
        </div>
        ${when(r.flags.length, () => html`<div class="mt-12">${map(r.flags, P.flagCard)}</div>`)}
        ${when(r.attention.length, () => html`<div class="mt-12">
          <h3 class="section-h">Dikkat isteyen ölçümler</h3>
          ${K.Table({ tight:true, headers:['Ölçüm', { label:'Değer', num:true }, 'Durum'],
            rows:r.attention.map(a => [a.marker.name, U.fmtNum(a.value) + ' ' + a.marker.unit,
              K.Badge({ label:a.status.label, tone:a.status.tone })]) })}</div>`)}
        ${when(r.gaps.length, () => html`<div class="mt-12">
          <h3 class="section-h">Beslenme açıkları</h3>
          ${K.Table({ tight:true, headers:['Öğe', { label:'Kapsama', num:true }],
            rows:r.gaps.map(g => [g.nutrient ? g.nutrient.name : g.id, '%' + g.pct]) })}</div>`)}`,
      foot:K.Button({ label:'Ofiste konuş', size:'sm', act:'go', data:{ 'data-route':'meeting' } }),
    });
  }

  function disciplineCard(){
    const days = [];
    for(let i = 27; i >= 0; i--){
      const d = U.iso(U.addDays(U.today(), -i));
      const m = SP.Calc.minimumDay(d);
      days.push({ label:U.fmtShort(d), value:U.pct(m.done, m.total) });
    }
    return K.Card({
      title:'Asgari gün tutturma', hint:'minimum-day',
      sub:'Son 28 gün',
      badge:K.Badge({ label:SP.Calc.streak() + ' gün seri', tone:'info' }),
      body:raw(UI.barChart(days, { max:100, height:150, goodAt:100 })),
    });
  }

  /* ---------------------------------------------------------------- seri */

  function seriesCard(){
    const id = S.ui.trendMarker;
    const b = SP.BIO_BY_ID[id];
    const series = SP.Model.seriesOf(id);
    const r = SP.Bio.refFor(id);
    const tr = SP.Bio.trendOf(id);
    const vd = SP.Bio.trendVerdict(id, tr);
    const measured = SP.BIOMARKERS.filter(x => SP.Model.seriesOf(x.id).length);

    return K.Card({
      title:'Ölçüm serisi', hint:'trend',
      sub:b ? b.name : '',
      actions:K.Select({ value:id, change:'pick-series',
        options:(measured.length ? measured : SP.BIOMARKERS).map(x => ({ value:x.id, label:x.name })) }),
      body:html`
        ${when(series.length < 2, () => K.Notice({ tone:'info',
          body:'En az iki ölçüm gerekir; şu an ' + series.length + ' var.' }))}
        ${when(series.length >= 2, () => html`
          ${raw(UI.lineChart([{ data:series.map(s => s.v) }], {
            labels:series.map(s => U.fmtShort(s.date)),
            band:r && r.optimal ? r.optimal : (r ? r.ref : null), height:210 }))}
          ${K.Notice({ tone:vd.tone === 'muted' ? 'info' : vd.tone, class:'mt-12',
            body:tr.ok ? vd.text : tr.note })}
          ${K.Table({ tight:true, headers:['Tarih', { label:'Değer', num:true }, 'Durum', 'Kaynak'],
            rows:series.slice().reverse().map(s => [U.fmtDate(s.date), U.fmtNum(s.v) + ' ' + b.unit,
              K.Badge({ label:SP.Bio.statusOf(id, s.v).label, tone:SP.Bio.statusOf(id, s.v).tone }),
              P.cert(s.cert)]) })}`)}`,
    });
  }

  /* --------------------------------------------------------------- ekran */

  async function render(){
    const tab = S.ui.analyticsTab;
    const head = html`<div class="mb-8">${K.Subtabs({ items:TABS, value:tab,
      act:'an-tab', aria:'Analiz görünümü' })}</div>`;

    if(tab === 'hafta'){
      return String(html`${head}
        ${K.Ledger(() => [reportCard(), disciplineCard(),
          K.Entry({ label:'Raporun mantığı', meta:'sayı nereden gelir',
            note:'Sayılar kural motorundan gelir; Patron ajan yalnızca cümleye çevirir. '
              + 'Çelişki varsa öncelik sırası uygulanır ve hangi kuralın kazandığı yazılır.',
            body:K.Table({ tight:true, headers:['Sıra', 'Kural'],
              rows:SP.PRECEDENCE.map(p => [String(p.rank), p.label]) }) }),
        ])}
        <div class="mt-24">${raw(UI.rail(['grounding', 'decision', 'minimum-day']))}</div>`);
    }
    if(tab === 'seri'){
      return String(html`${head}
        ${K.Ledger(() => [seriesCard()])}
        <div class="mt-24">${raw(UI.rail(['trend', 'ref-range', 'certainty']))}</div>`);
    }
    return String(html`${head}
      ${K.Ledger(() => [crossCard(), pairCard()])}
      <div class="mt-24">${raw(UI.rail(['correlation', 'trend', 'certainty']))}</div>`);
  }

  const handle = {
    async 'an-tab'(el){ S.ui.analyticsTab = el.dataset.tab; SP.App.render(); },
  };

  const change = {
    async 'pair-a'(el){ S.ui.pairA = el.value; SP.App.render(); },
    async 'pair-b'(el){ S.ui.pairB = el.value; SP.App.render(); },
    async 'pick-series'(el){ S.ui.trendMarker = el.value; SP.App.render(); },
  };

  return {
    id:'analytics',
    title:'Analiz',
    headline(){
      const rows = SP.Calc.crossFindings(60).filter(r => r.ok && !r.weak);
      if(!rows.length) return 'Belirgin bir bağ bulunamadı.';
      return rows.length + ' belirgin bağ bulundu.';
    },
    lede(){
      return 'Birlikte hareket eden iki ölçüm, birinin diğerine sebep olduğu '
        + 'anlamına gelmez. Bağ en az ' + SP.Calc.MIN_PAIRS + ' eşleşen gün olduğunda '
        + 'yazılır; altında hiç yazılmaz.';
    },
    subtitle(){
      const rows = SP.Calc.crossFindings(60).filter(r => r.ok && !r.weak);
      return rows.length ? rows.length + ' belirgin bağ bulundu' : 'Belirgin bağ yok';
    },
    actions(){ return ''; },
    render, handle, change,
  };
})();
