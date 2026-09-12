/* Analiz — türetilmiş okumalar tek yerde.

   İlerleme ekranı karar verir (KPI, kapı); bu ekran soru sorar:
   ne değişti, hangi konu hangi hatayı üretiyor, hız mı isabet mi,
   uyku ne yapıyor, söylenen kapasite gerçek mi.

   Yazim bicimi: STIL.md. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.analytics = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const A = () => R.Analytics;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const TABS = [
    { id:'compare', label:'Karşılaştırma' },
    { id:'errors',  label:'Hata haritası' },
    { id:'rank',    label:'Sıra geçmişi' },
    { id:'speed',   label:'Hız ve isabet' },
    { id:'value',   label:'Konu değeri' },
    { id:'habits',  label:'Alışkanlık' },
  ];

  function empty(text, action){
    return K.Card({ body:K.Empty({ icon:'chart', text, action }) });
  }
  const addExam = K.Button({ label:'Deneme ekle', size:'sm', tone:'primary',
    act:'go', data:{ 'data-route':'exams' } });

  /* ---------- karşılaştırma ---------- */

  function compareTab(){
    const list = S.exams.slice().sort((a, b) => b.date.localeCompare(a.date));
    if(list.length < 2) return empty('Karşılaştırma için en az iki deneme gerekir.', addExam);

    const opts = list.map(e => ({ value:e.id, label:U.fmtShort(e.date)+' · '+e.type }));
    const a = S.ui.compareA || list[1].id;
    const b = S.ui.compareB || list[0].id;
    const cmp = A().compareExams(a, b);

    return K.Grid([
      K.Span(8, K.Stack([
        K.Card({ title:'İki denemeyi yan yana koy', sub:'Toplam net değil, test bazında ne değişti',
          body:html`
            ${K.Cols(2, [
              K.Field({ label:'Önceki', input:K.Select({ options:opts, value:a, change:'cmp-a' }) }),
              K.Field({ label:'Sonraki', input:K.Select({ options:opts, value:b, change:'cmp-b' }) }),
            ])}` }),

        when(cmp, () => K.Card({
          title:cmp.delta > 0 ? 'Net arttı' : cmp.delta < 0 ? 'Net düştü' : 'Net aynı',
          sub:U.fmtShort(cmp.a.date)+' → '+U.fmtShort(cmp.b.date),
          badge:K.Badge({ label:(cmp.delta > 0 ? '+' : '')+U.fmtNet(cmp.delta)+' net',
            tone:cmp.delta > 0 ? 'ok' : cmp.delta < 0 ? 'danger' : 'muted' }),
          body:html`
            ${K.Table({ tight:true,
              headers:['Test', { label:'Önce', num:true }, { label:'Sonra', num:true },
                { label:'Fark', num:true }, { label:'Doğruluk', num:true }, { label:'Boş', num:true }],
              rows:cmp.rows.map(r => [
                r.name,
                html`<span class="num">${r.netA == null ? '—' : U.fmtNet(r.netA)}</span>`,
                html`<span class="num">${r.netB == null ? '—' : U.fmtNet(r.netB)}</span>`,
                html`<span class="${r.delta > 0 ? 'num is-up' : r.delta < 0 ? 'num is-down' : 'num dim'}">${
                  r.delta == null ? '—' : (r.delta > 0 ? '+' : '')+U.fmtNet(r.delta)}</span>`,
                html`<span class="num dim">${r.accA == null ? '—' : '%'+r.accA} → ${r.accB == null ? '—' : '%'+r.accB}</span>`,
                html`<span class="num dim">${r.blankA == null ? '—' : r.blankA} → ${r.blankB == null ? '—' : r.blankB}</span>`,
              ]) })}
            <div class="mt-12">${K.Notice({ tone:'info', body:cmp.note })}</div>` })),
      ])),
      K.Span(4, K.Stack([blankCard(), publisherCard(), raw(UI.rail(['median', 'base-score', 'net']))])),
    ]);
  }

  function blankCard(){
    const b = A().blankStrategy('TYT');
    if(!b.ok) return K.Card({ title:'Boş bırakma', body:K.Notice({ tone:'info', body:b.why }) });
    return K.Card({
      title:'Boş bırakma stratejisi', sub:'Boş sayısı ile net arasındaki ilişki',
      badge:K.Badge({ label:'ort. '+b.avgBlank+' boş', tone:'muted' }),
      body:html`
        ${K.Cols(2, [
          K.Stat({ label:'En iyi deneme', value:U.fmtNet(b.best.net), note:b.best.blank+' boş' }),
          K.Stat({ label:'En düşük', value:U.fmtNet(b.worst.net), note:b.worst.blank+' boş' }),
        ])}
        <div class="mt-12">${K.Notice({ tone:b.dir === 'same' ? 'info' : 'ok', body:b.note })}</div>
        <p class="tiny dim mt-8">${b.kapsam}</p>`,
    });
  }

  function publisherCard(){
    const p = A().publisherAdjust('TYT');
    if(!p.ok) return K.Card({ title:'Yayın etkisi', body:K.Notice({ tone:'info', body:p.why }) });
    return K.Card({
      title:'Yayın zorluk farkı', sub:'Kolay yayından gelen yükseliş yanıltır',
      badge:K.Badge({ label:'fark '+U.fmtNet(p.spread), tone:p.spread >= 6 ? 'warn' : 'muted' }),
      body:html`
        ${K.Table({ tight:true, headers:['Yayın', { label:'Deneme', num:true },
          { label:'Medyan', num:true }, { label:'Sapma', num:true }],
          rows:p.rows.map(r => [r.publisher, r.count,
            html`<span class="num">${U.fmtNet(r.median)}</span>`,
            html`<span class="${r.offset > 0 ? 'num is-up' : r.offset < 0 ? 'num is-down' : 'num dim'}">${
              (r.offset > 0 ? '+' : '')+U.fmtNet(r.offset)}</span>`]) })}
        <p class="tiny dim mt-10">${p.note}</p>`,
    });
  }

  /* ---------- hata haritası ---------- */

  function errorsTab(){
    const h = A().errorHeatmap(14);
    if(!h.rows.length) return empty('Yanlış defterine kayıt girildikçe konu × hata haritası burada oluşur.',
      K.Button({ label:'Yanlış defterine git', size:'sm', tone:'primary', act:'go', data:{ 'data-route':'cards' } }));

    const cell = (v) => {
      if(!v) return html`<span class="heat heat--0">·</span>`;
      const lvl = h.max <= 1 ? 3 : Math.max(1, Math.min(4, Math.ceil(4 * v / h.max)));
      return html`<span class="heat heat--${lvl}">${v}</span>`;
    };

    return K.Grid([
      K.Span(8, K.Card({
        title:'Konu × hata tipi', sub:'Aynı konu farklı hata üretiyorsa reçete de farklıdır',
        body:html`
          ${K.Table({ tight:true,
            headers:['Konu'].concat(h.tags.map(t => ({ label:t, num:true })))
              .concat([{ label:'Toplam', num:true }]),
            rows:h.rows.map(r => [
              html`<span class="small">${r.topic}</span>`,
            ].concat(h.tags.map(t => cell(r.cells[t])))
              .concat([html`<b class="num">${r.total}</b>`])) })}
          <div class="mt-12">${K.Notice({ tone:'info',
            body:'K kavram, İ işlem, Y yorum, S süre, D dikkat. Bir konuda İ baskınsa çözüm '
               + 'daha çok konu tekrarı değil, işlem rutini kurmaktır.' })}</div>`,
      })),
      K.Span(4, K.Stack([leechCard(), raw(UI.rail(['pareto', 'error-tags', 'notebook']))])),
    ]);
  }

  function leechCard(){
    const rows = A().leechCards(4);
    return K.Card({
      title:'Yapışkan kartlar', sub:'Dört kez üst üste unutulan kart kötü yazılmıştır',
      badge:rows.length ? K.Badge({ label:String(rows.length), tone:'warn' }) : null,
      body:rows.length
        ? html`<div class="stack-xs">${map(rows.slice(0, 8), c => html`
            <div class="row between">
              <span class="small truncate">${c.front}</span>
              <span class="tiny dim num">${c.forgot}× unutuldu</span>
            </div>`)}</div>
          <p class="tiny dim mt-10">Bu kartları yeniden yaz: tek şey sorsun, cevabı tek cümle olsun.</p>`
        : K.Empty({ icon:'cards', text:'Yapışkan kart yok. Kartların iyi yazılmış.' }),
    });
  }

  /* ---------- sıra geçmişi ---------- */

  function rankTab(){
    const hist = A().rankHistory();
    if(hist.length < 2) return empty('Sıra geçmişi için en az dört tam deneme gerekir.', addExam);

    const target = (S.profile && S.profile.targetRank) || R.PROGRAM.refRank;
    const series = hist.map(h => h.score);
    const labels = hist.map(h => U.fmtShort(h.date));
    const last = hist[hist.length-1];
    const first = hist[0];
    const moved = last.rank && first.rank ? first.rank - last.rank : 0;

    return K.Grid([
      K.Span(8, K.Stack([
        K.Card({
          title:'Tahmini sıra zaman içinde', hint:'estimate',
          sub:'Her noktada son 3 denemenin medyanı — tek fotoğraf değil film',
          badge:raw(UI.provenance('estimate')),
          body:html`
            ${raw(UI.lineChart([{ data:series }], { labels, height:210 }))}
            ${K.Cols(3, [
              K.Stat({ label:'İlk tahmin', value:U.fmtNum(first.rank), note:U.fmtShort(first.date) }),
              K.Stat({ label:'Son tahmin', value:U.fmtNum(last.rank), note:U.fmtShort(last.date),
                tone:last.rank <= target ? 'ok' : null }),
              K.Stat({ label:'Değişim', value:(moved > 0 ? '−' : '+')+U.fmtNum(Math.abs(moved)),
                note:moved > 0 ? 'sıra iyileşti' : 'sıra geriledi',
                tone:moved > 0 ? 'ok' : moved < 0 ? 'warn' : null }),
            ])}` }),

        K.Card({ title:'Bant tablosu', sub:'Her denemeden sonraki iyimser–kötümser aralık',
          body:K.Table({ tight:true,
            headers:['Tarih', { label:'Puan', num:true }, { label:'İyimser sıra', num:true },
              { label:'Kötümser sıra', num:true }],
            rows:hist.slice().reverse().map(h => [
              U.fmtShort(h.date),
              html`<span class="num">${U.fmtNet(h.score)}</span>`,
              html`<span class="num">${U.fmtNum(h.rankBest)}</span>`,
              html`<span class="num dim">${U.fmtNum(h.rankWorst)}</span>`,
            ]) }) }),
      ])),
      K.Span(4, K.Stack([
        K.Notice({ tone:'warn', title:'Bu bir ÖSYM hesabı değildir.',
          body:'Puan standart sapmaya göre normalize edilir ve aday dağılımı her yıl değişir. '
             + 'Buradaki aralık son yılların sonuçlarından çıkarılmış koçluk bandıdır.' }),
        raw(UI.rail(['rank', 'tiers', 'certainty'])),
      ])),
    ]);
  }

  /* ---------- hız ve isabet ---------- */

  function speedTab(){
    const sp = A().speedAccuracy('TYT');
    const w = A().warmup();

    return K.Grid([
      K.Span(7, K.Stack([
        sp.ok
          ? K.Card({ title:'Hız–isabet dengesi', sub:'Soru başına saniye ve doğruluk',
              body:html`
                ${K.Table({ tight:true, headers:['Test', { label:'sn/soru', num:true },
                  { label:'Doğruluk', num:true }, 'Profil'],
                  rows:sp.rows.map(r => [
                    r.test,
                    html`<span class="num">${r.secPerQ}</span>`,
                    html`<span class="${r.accuracy >= 70 ? 'num' : 'num is-down'}">%${r.accuracy}</span>`,
                    K.Badge({ label:r.profile === 'ideal' ? 'dengede'
                        : r.profile === 'fast-wrong' ? 'hızlı–isabetsiz'
                        : r.profile === 'slow-right' ? 'doğru–yavaş' : 'karışık',
                      tone:r.profile === 'ideal' ? 'ok' : r.profile === 'mixed' ? 'muted' : 'warn' }),
                  ]) })}
                <div class="stack-xs mt-12">${map(sp.rows.filter(r => r.profile !== 'ideal'), r => html`
                  <div class="small muted"><b>${r.test}:</b> ${r.note}</div>`)}</div>` })
          : empty(sp.why, addExam),

        K.Card({ title:'Isınma', hint:'quiz', sub:'İlk 20 dakika ile kalanı arasındaki fark',
          body:w.ok
            ? html`${K.Cols(3, [
                K.Stat({ label:'İlk 20 dk', value:'%'+w.early }),
                K.Stat({ label:'Sonrası', value:'%'+w.late }),
                K.Stat({ label:'Fark', value:(w.diff > 0 ? '+' : '')+w.diff, tone:w.diff >= 15 ? 'warn' : 'ok' }),
              ])}
              <div class="mt-12">${K.Notice({ tone:w.diff >= 15 ? 'warn' : 'ok', body:w.note })}</div>`
            : K.Empty({ icon:'clock', text:w.why,
                action:K.Button({ label:'Süreli deneme başlat', size:'sm', tone:'primary',
                  act:'go', data:{ 'data-route':'exams' } }) }) }),
      ])),
      K.Span(5, K.Stack([sessionsCard(), raw(UI.rail(['time-drift', 'net']))])),
    ]);
  }

  function sessionsCard(){
    const list = S.sessions.filter(s => s.status === 'done');
    if(!list.length){
      return K.Card({ title:'Süreli oturumlar',
        body:K.Empty({ icon:'clock', text:'Henüz süreli deneme oturumu yok. '
          + 'Deneme ekranından “Süreli oturum” ile başlatabilirsin.' }) });
    }
    return K.Card({
      title:'Süreli oturumlar', sub:list.length+' prova',
      body:html`<div class="stack-sm">${map(list.slice(0, 6), s => html`
        <div class="row between">
          <div class="minw0">
            <b class="small">${U.fmtShort(s.date)}</b>
            <div class="tiny dim">${U.fmtClock(s.totalSeconds)} · ${s.marks ? s.marks.length : 0} işaret</div>
          </div>
          ${K.Badge({ label:(s.overtime > 0 ? '+' : '')+Math.round(s.overtime/60)+' dk',
            tone:s.overtime > 300 ? 'danger' : s.overtime > 0 ? 'warn' : 'ok' })}
        </div>`)}</div>`,
    });
  }

  /* ---------- konu değeri ---------- */

  function valueTab(){
    const rows = A().topicValue(16);
    const totalGap = U.round(U.sum(rows.map(r => r.gap)), 1);
    return K.Grid([
      K.Span(8, K.Card({
        title:'Konu net katkısı', sub:'Bu konu kapanırsa yaklaşık kaç net gelir',
        badge:K.Badge({ label:'~'+U.fmtNet(totalGap)+' net açık', tone:'warn' }),
        body:html`
          ${K.Table({ tight:true,
            headers:['Konu', 'Ders', { label:'Potansiyel', num:true },
              { label:'Kazanılan', num:true }, { label:'Açık', num:true }],
            rows:rows.map(r => [
              html`<span class="small">${r.topicName}</span>`,
              html`<span class="tiny dim">${r.subjectName}</span>`,
              html`<span class="num dim">${U.fmtNet(r.potential)}</span>`,
              html`<span class="num">${U.fmtNet(r.earned)}</span>`,
              html`<b class="num ${r.gap > 1 ? 'is-down' : ''}">${U.fmtNet(r.gap)}</b>`,
            ]) })}
          <div class="mt-12">${K.Notice({ tone:'info',
            body:'Potansiyel, dersin soru sayısı ile konunun frekans payından çıkar. '
               + 'Kazanılan, kapanış durumu ve gerçek çözüm doğruluğundan gelir. '
               + 'Aradaki fark, o konuya ayrılacak zamanın karşılığıdır.' })}</div>`,
      })),
      K.Span(4, raw(UI.rail(['closure', 'risk', 'second-check']))),
    ]);
  }

  /* ---------- alışkanlık ---------- */

  function habitsTab(){
    const sleep = A().sleepImpact();
    const cap = A().capacityReality();
    const curve = A().forgettingCurve();
    const dist = A().distractionTrend();

    return K.Grid([
      K.Span(6, K.Stack([
        K.Card({ title:'Uyku ve net', hint:'sleep', sub:'Genel tavsiye değil, senin verin',
          body:sleep.ok
            ? html`${K.Cols(3, [
                K.Stat({ label:'Yeterli uyku', value:U.fmtNet(sleep.goodMedian), note:sleep.goodCount+' deneme' }),
                K.Stat({ label:'Yetersiz uyku', value:U.fmtNet(sleep.badMedian), note:sleep.badCount+' deneme' }),
                K.Stat({ label:'Fark', value:(sleep.diff > 0 ? '+' : '')+U.fmtNet(sleep.diff),
                  tone:sleep.diff >= 2 ? 'ok' : null }),
              ])}
              <div class="mt-12">${K.Notice({ tone:'info', body:sleep.note })}</div>`
            : K.Empty({ icon:'moon', text:sleep.why }) }),

        K.Card({ title:'Unutma eğrisi', hint:'srs', sub:'Hangi aralıkta gerçekten hatırlıyorsun',
          body:curve.ok
            ? html`
              ${K.Table({ tight:true, headers:['Aralık', { label:'Tekrar', num:true }, { label:'Hatırlama', num:true }],
                rows:curve.rows.map(r => [r.gap, r.total,
                  html`<span class="${r.rate >= 70 ? 'num' : 'num is-down'}">%${r.rate}</span>`]) })}
              <p class="tiny dim mt-10">${curve.note}</p>`
            : K.Empty({ icon:'cards', text:curve.note }) }),
      ])),

      K.Span(6, K.Stack([
        K.Card({ title:'Kapasite gerçeklik kontrolü', sub:'Söylenen saat ile çalışılan saat',
          badge:cap.ok ? K.Badge({ label:'%'+cap.ratio,
            tone:cap.status === 'gercekci' ? 'ok' : cap.status === 'iyimser' ? 'warn' : 'danger' }) : null,
          body:cap.ok
            ? html`${K.Cols(2, [
                K.Stat({ label:'Yazdığın', value:cap.claimed, unit:' sa' }),
                K.Stat({ label:'Çalıştığın', value:cap.actualAvg, unit:' sa',
                  tone:cap.ratio >= 85 ? 'ok' : 'warn' }),
              ])}
              <div class="mt-12">${K.Notice({ tone:cap.status === 'gercekci' ? 'ok' : 'warn', body:cap.note })}</div>
              ${when(cap.status !== 'gercekci', () => K.Button({ label:'Kapasiteyi düzelt', size:'sm',
                class:'mt-10', act:'setup-open' }))}`
            : K.Empty({ icon:'clock', text:cap.why }) }),

        K.Card({ title:'Dikkat dağılması', sub:'Blok sırasında kaç kez bölündün',
          body:dist.ok
            ? html`${raw(UI.barChart(dist.rows.map(r => ({ label:U.fmtShort(r.date).split(' ')[0], value:r.count })),
                { goodAt:0 }))}
              <div class="mt-12">${K.Notice({ tone:dist.avg >= 5 ? 'warn' : 'info', body:dist.note })}</div>
              <p class="tiny dim mt-8">${dist.kapsam}</p>`
            : K.Empty({ icon:'warn', text:dist.why }) }),
      ])),
    ]);
  }

  const BODIES = { compare:compareTab, errors:errorsTab, rank:rankTab,
    speed:speedTab, value:valueTab, habits:habitsTab };

  async function render(){
    /* Kayitli sekme adi artik yoksa ilk sekmeye duser. Eskimis bir deger
       ('overview') seritte HICBIR sekmeyi secili gostermiyor, govdede ise
       karsilastirmayi ciziyordu: ekran nerede oldugunu yanlis soyluyordu. */
    const tab = TABS.some(t => t.id === S.ui.analyticsTab) ? S.ui.analyticsTab : TABS[0].id;
    return String(K.Stack([
      K.Subtabs({ items:TABS, value:tab, act:'analytics-tab', aria:'Analiz bölümleri' }),
      (BODIES[tab] || compareTab)(),
    ]));
  }

  const handle = {
    async 'analytics-tab'(el){ S.ui.analyticsTab = el.dataset.tab; R.App.render(); },
  };

  const change = {
    async 'cmp-a'(el){ S.ui.compareA = el.value; R.App.render(); },
    async 'cmp-b'(el){ S.ui.compareB = el.value; R.App.render(); },
  };

  return {
    id:'analytics',
    title:'Analiz',
    subtitle(){
      const tab = TABS.find(t => t.id === S.ui.analyticsTab) || TABS[0];
      return (tab ? tab.label : 'Analiz') + ' · türetilmiş okumalar';
    },
    actions(){ return ''; },
    render, handle, change,
  };
})();
