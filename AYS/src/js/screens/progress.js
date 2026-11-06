/* Ilerleme — KPI panosu, grafikler ve aylik karar kapisi.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */
window.LIFEOS.PARCA.yazilar({
  'ays.progress.veri-yok':'Veri yok',
  'ays.progress.taban-yok':'Taban yok.',
  'ays.progress.taban':'Taban ',
  'ays.progress.karar-kapisi':'Karar kapısı',
  'ays.progress.recete':'Reçete: ',
  'ays.progress.bu-ayin-secili-mudahalesi-si':'Bu ayın seçili müdahalesi silinecek ve yeniden seçebileceksin.',
  'ays.progress.mudahaleyi-kaldir':'Müdahaleyi kaldır',
  'ays.progress.henuz-tam-deneme-medyani-yok':'Henüz tam deneme medyanı yok',
  'ays.progress.tyt-medyani':'TYT medyanı ',
});


window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'ays', sira:150, group:'Git', label:'İlerleme — göstergeler ve aylık değerlendirme', icon:'chart', route:'progress', run(){ R.App.go('progress'); } });
window.LIFEOS.PARCA.yazilar({
  'ays.progress.tyt':'TYT',
  'ays.progress.ayt':'AYT',
  'ays.progress.bu-hafta':'bu hafta',
  'ays.progress.son-4-denemenin-en-dusugu':'son 4 denemenin en düşüğü',
  'ays.progress.son-tam-tyt':'son tam TYT',
  'ays.progress.hedef':'Hedef ',
  'ays.progress.ayt-medyani':'AYT medyanı',
  'ays.progress.son-3-tam-deneme':'son 3 tam deneme.',
  'ays.progress.gostergeler':'Göstergeler',
  'ays.progress.deneme-net-trendi':'Deneme net trendi',
  'ays.progress.tam-deneme-girildikce-medyan':'Tam deneme girildikçe medyan trendi burada oluşur. Karar tek denemeyle değil, son üç denemenin medyanıyla verilir.',
  'ays.progress.deneme-ekle':'Deneme ekle',
  'ays.progress.tyt-tam-deneme':'TYT tam deneme',
  'ays.progress.ayt-tam-deneme':'AYT tam deneme',
  'ays.progress.secilen-mudahale':'Seçilen müdahale:',
  'ays.progress.veri-donemi':'Veri dönemi:',
  'ays.progress.yeniden-degerlendirme':'· Yeniden değerlendirme:',
  'ays.progress.mudahaleyi-degistir':'Müdahaleyi değiştir',
  'ays.progress.bir-ana-mudahale-sec':'Bir ana müdahale seç',
  'ays.progress.ana-mudahaleyi-kaydet':'Ana müdahaleyi kaydet',
  'ays.progress.aylik-degerlendirme':'Aylık değerlendirme — ',
  'ays.progress.karar-verildi':'karar verildi',
  'ays.progress.karar-bekliyor':'karar bekliyor',
  'ays.progress.bu-ayin-kurali':'Bu ayın kuralı:',
  'ays.progress.deneme-ailesi':'Deneme ailesi',
  'ays.progress.test-bazli-trend':'Test bazlı trend',
  'ays.progress.tam-deneme-girildikce-her-te':'Tam deneme girildikçe her test için ayrı trend burada oluşur.',
  'ays.progress.ust-bant':'üst bant',
  'ays.progress.altinda':'altında',
  'ays.progress.test-basina-seyir':'Test başına seyir',
  'ays.progress.son-4-medyan':'Son 4 medyan',
  'ays.progress.i-lk-son':'İlk→son',
  'ays.progress.simdi':'şimdi',
  'ays.progress.aylik-net-gelisim-egrisi':'Aylık net gelişim eğrisi',
  'ays.progress.tyt-gozlenen':'TYT gözlenen',
  'ays.progress.tyt-guvenli':'TYT güvenli',
  'ays.progress.ayt-gozlenen':'AYT gözlenen',
  'ays.progress.ayt-guvenli':'AYT güvenli',
  'ays.progress.kpi-sozlugu':'KPI sözlüğü',
  'ays.progress.yol-haritasi':'Yol haritası',
  'ays.progress.konular-ders-ders-kapanan-do':'Konular ders ders; kapanan dolu, çalışılan halka, sıradaki kalın',
  'ays.progress.konular-yuklenince-harita-be':'Konular yüklenince harita belirir.',
  'ays.progress.plan-tamamlama-son-8':'Plan tamamlama — son 8 hafta',
  'ays.progress.hedef-85':'Hedef %85',
  'ays.progress.hata-paretosu':'Hata paretosu',
  'ays.progress.surec-gostergeleri':'Süreç göstergeleri',
  'ays.progress.tekrar-borcu':'Tekrar borcu',
  'ays.progress.konu-kapanisi':'Konu kapanışı',
  'ays.progress.uyku-7-gun-ort':'Uyku (7 gün ort.)',
  'ays.progress.bir-mudahale-sec':'Bir müdahale seç',
  'ays.progress.mudahale-kaydedildi-21-gun':'Müdahale kaydedildi · 21 gün sonra yeniden değerlendirilecek',
  'ays.progress.i-lerleme':'İlerleme',
  'ays.progress.ilerleme-bolumleri':'İlerleme bölümleri',
  'ays.progress.bolum-ozet':'Özet',
  'ays.progress.bolum-netler':'Netler',
  'ays.progress.bolum-yol':'Yol',
  'ays.progress.bolum-karar':'Karar',
});
window.LIFEOS.PARCA.sayfa({ id:'progress', modul:'ays', king:{ sira:160, ad:'İlerleme', es:['ilerleme'] }, cekmece:'analiz', ad:'İlerleme', ikon:'chart', sira:10 });

R.Screens.progress = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const FAMILIES = [{ value:'TYT', label:yz('ays.progress.tyt') }, { value:'AYT', label:yz('ays.progress.ayt') }];

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
      { key:'planCompletion', num:comp, birim:'%', value:comp == null ? '—' : '%'+comp, spark:history, note:yz('ays.progress.bu-hafta'),
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
      { key:'examBase', num:base, birim:'net', ondalik:2, value:base == null ? '—' : U.fmtNet(base), note:yz('ays.progress.son-4-denemenin-en-dusugu') },
      { key:'errorMix', value:pareto[0] && pareto[0].count ? pareto[0].tag : '—',
        note:pareto[0] && pareto[0].count ? R.ERROR_TAGS[pareto[0].tag].name+' · %'+pareto[0].pct : 'hata kaydı yok' },
      { key:'timeDrift', num:timeDrift, birim:'dk', value:timeDrift == null ? '—' : (timeDrift > 0 ? '+' : '')+timeDrift,
        unit:timeDrift == null ? '' : ' dk', note:yz('ays.progress.son-tam-tyt'),
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
        ? { ust:def.name, cumle:(c.value !== '—' ? c.note : /gerek|yok|girilmemiş/.test(c.note || '') ? buyuk(c.note) : yz('ays.progress.veri-yok')) + '.',
            vurgu:yz('ays.progress.hedef') + def.target + '.', sistem:'ays' }
        : { ust:def.name, sayi:sayi({ deger:c.num, birim:c.birim, ondalik:c.ondalik, kesinlik:'computed', formul:def.formula }),
            cumle:c.tone === 'ok' ? 'hedefte.' : c.tone ? 'hedefin dışında.' : '',
            vurgu:yz('ays.progress.hedef') + def.target + (c.note ? ' · ' + c.note : '') + '.', sistem:'ays' });
    const ayt = C.medianTrend('AYT'), ab = C.examBase('AYT');
    if(ayt.last3 != null) m.push({ ust:yz('ays.progress.ayt-medyani'), sayi:sayi({ deger:ayt.last3, birim:'net', ondalik:2, kesinlik:'computed',
      formul:'son 3 tam AYT denemesinin medyanı' }), cumle:yz('ays.progress.son-3-tam-deneme'), vurgu:ab == null ? yz('ays.progress.taban-yok') : yz('ays.progress.taban') + U.fmtNet(ab) + '.', sistem:'ays' });
    /* Özet'teki Bugün'ün «Gidişat»ından ayrı kimlik ve ad (aynı sayfada iki kart). */
    return raw(V.donen({ id:'ays-kpi', ad:yz('ays.progress.gostergeler'), maddeler:m }));
  }

  /* ---------- trend ---------- */

  function trendCard(){
    const tyt = C.medianTrend('TYT'), ayt = C.medianTrend('AYT');
    const gate = C.currentGate();

    if(!tyt.series.length && !ayt.series.length){
      return K.Card({ title:yz('ays.progress.deneme-net-trendi'), body:K.Empty({ icon:'chart',
        text:yz('ays.progress.tam-deneme-girildikce-medyan'),
        action:K.Button({ label:yz('ays.progress.deneme-ekle'), tone:'primary', act:'go', data:{ 'data-route':'exams' } }) }) });
    }

    const delta = (fam, t) => when(t.delta != null, () =>
      K.Badge({ label:fam+' '+(t.delta > 0 ? '+' : '')+U.fmtNet(t.delta), tone:t.delta > 0 ? 'ok' : 'warn' }));

    return K.Card({
      hint:'median', title:yz('ays.progress.deneme-net-trendi'),       actions:html`<div class="row-sm">${delta('TYT', tyt)}${delta('AYT', ayt)}</div>`,
      body:html`
        ${raw(UI.lineChart([{ data:tyt.series }, { data:ayt.series, accent:true }],
          { labels:C.fullExams('TYT').map(e => U.fmtShort(e.date)), band:gate ? gate.tyt : null,
            bandLabel:'bu ayın bandı', height:180 }))}
        ${raw(UI.legend([
          { label:yz('ays.progress.tyt-tam-deneme'), color:'var(--primary)' },
          /* Lejant yalnız çizilen şeyi adlandırır (2026-10-07): AYT verisi
             yokken «AYT tam deneme» ve bandın adı grafikte yazarken gri
             (görünmez) kareli ikinci adı boşta duruyordu. */
          ...(ayt.series.some(v => v != null) ? [{ label:yz('ays.progress.ayt-tam-deneme'), color:'var(--accent)' }] : []),
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
        ${K.Notice({ tone:'ok', title:yz('ays.progress.secilen-mudahale'), body:html`${decision.action}
          <div class="small muted">${yz('ays.progress.veri-donemi')} ${decision.window} ${yz('ays.progress.yeniden-degerlendirme')} ${U.fmtDate(decision.reevaluateAt)}</div>` })}
        ${K.Button({ label:yz('ays.progress.mudahaleyi-degistir'), size:'sm', act:'clear-decision', data:{ 'data-key':key } })}`
      : html`
        <div class="stack-xs"><span class="mono-label">${yz('ays.progress.bir-ana-mudahale-sec')}</span>
          ${map(g.suggestions, (s, i) => html`
            <label class="check"><input type="radio" name="gate-opt" value="${i}"/>
              <span>${s.text}<br/><span class="tiny dim">${s.why}</span></span></label>`)}
        </div>
        ${K.Button({ label:yz('ays.progress.ana-mudahaleyi-kaydet'), tone:'primary', act:'save-decision' })}`;

    return K.Card({
      hint:'gate', title:yz('ays.progress.aylik-degerlendirme')+gate.month,
      badge:decision ? K.Badge({ label:yz('ays.progress.karar-verildi'), tone:'ok' }) : K.Badge({ label:yz('ays.progress.karar-bekliyor'), tone:'warn' }),
      body:K.Stack([
        meter('TYT', g.tytStatus, g.tyt.last3, gate.tyt, gate.tytSafe),
        when(gate.ayt, () => meter('AYT', g.aytStatus, g.ayt.last3, gate.ayt, gate.aytSafe)),
        /* Karar beklerken kural zaten ilk seçenektir («Bu ayın kapı kuralı»);
           ayrıca kutuda yazmak aynı cümleyi iki kez okutuyordu. */
        when(decision, () => K.Notice({ tone:'info', title:yz('ays.progress.bu-ayin-kurali'), body:gate.note })),
        choice,
      ]),
    });
  }

  /* ---------- test bazli trend ---------- */

  function testTrendCard(){
    const fam = S.ui.trendFamily || 'TYT';
    const series = C.testSeries(fam);
    const seg = K.Segmented({ items:FAMILIES, value:fam, act:'trend-family', aria:yz('ays.progress.deneme-ailesi') });

    if(!series.length){
      return K.Card({ title:yz('ays.progress.test-bazli-trend'), actions:seg,
        body:K.Empty({ icon:'chart', text:yz('ays.progress.tam-deneme-girildikce-her-te') }) });
    }

    const rows = series.map(s => {
      const vals = s.data.filter(v => v != null);
      const last = vals.length ? vals[vals.length-1] : null;
      const first = vals.length ? vals[0] : null;
      const med = U.median(vals.slice(-4));
      const band = R.TEST_BANDS.find(b => b.testKey === s.name && b.exam === fam);
      const change = (first != null && last != null) ? U.round(last-first, 1) : null;
      const status = (!band || med == null) ? K.Badge({ label:'—', tone:'muted' })
        : med >= band.high ? K.Badge({ label:yz('ays.progress.ust-bant'), tone:'ok' })
        : med >= band.low ? K.Badge({ label:'bantta', tone:'ok' })
        : K.Badge({ label:yz('ays.progress.altinda'), tone:'warn' });
      return [
        html`<b class="small">${s.name}</b>${when(band, () => html`<div class="tiny dim">hedef ${band.low}–${band.high}</div>`)}`,
        raw(UI.sparkline(s.data)),
        html`<span class="num">${med == null ? '—' : U.fmtNet(med)}</span>`,
        html`<span class="${change > 0 ? 'num is-up' : change < 0 ? 'num is-down' : 'num dim'}">${change == null ? '—' : (change > 0 ? '+' : '')+U.fmtNet(change)}</span>`,
        status,
      ];
    });

    return K.Card({
      title:yz('ays.progress.test-bazli-trend'), sub:yz('ays.progress.test-basina-seyir'), actions:seg,
      body:K.Table({ tight:true, rows,
        headers:['Test', 'Seyir', { label:yz('ays.progress.son-4-medyan'), num:true }, { label:yz('ays.progress.i-lk-son'), num:true }, 'Durum'] }),
    });
  }

  /* ---------- katlanir referanslar ---------- */

  function monthCurveCard(){
    const now = U.monthName(U.today());
    const rows = Object.keys(R.MONTH_GATES).map(m => {
      const g = R.MONTH_GATES[m];
      const range = b => b ? b[0]+'–'+b[1] : '—';
      return [
        m === now ? html`<b>${m}</b> ${K.Badge({ label:yz('ays.progress.simdi'), tone:'ok' })}` : m,
        html`<span class="num">${range(g.tyt)}</span>`,
        html`<span class="num dim">${range(g.tytSafe)}</span>`,
        html`<span class="num">${range(g.ayt)}</span>`,
        html`<span class="num dim">${range(g.aytSafe)}</span>`,
        html`<span class="small muted">${g.note}</span>`,
      ];
    });
    return K.Collapsible({
      title:yz('ays.progress.aylik-net-gelisim-egrisi'), meta:'koçluk bandı', act:'toggle-month-curve', open:!!S.ui.monthCurveOpen,
      body:K.Table({ tight:true, rows, headers:['Ay', { label:yz('ays.progress.tyt-gozlenen'), num:true }, { label:yz('ays.progress.tyt-guvenli'), num:true },
        { label:yz('ays.progress.ayt-gozlenen'), num:true }, { label:yz('ays.progress.ayt-guvenli'), num:true }, yz('ays.progress.karar-kapisi')] }),
    });
  }

  function kpiReference(){
    return K.Collapsible({
      title:yz('ays.progress.kpi-sozlugu'), meta:'formül ve müdahale', act:'toggle-kpi-ref', open:!!S.ui.kpiRefOpen,
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

  /* YOL HARİTASI (kullanıcı, 2026-10-30: «istatistiklerde nöral ağ haritası;
     neyi başardığımızı, hangi konularda ilerlediğimizi; yol haritası gibi»).
     Ders kümeleri, konular müfredat sırasıyla yol; durum konunun kendi
     kaydından (kapandı / çalışılıyor / başlamadı), sayı uydurulmaz. */
  function yolHaritasi(){
    const A = window.LIFEOS.AGHARITA;
    if(!A) return '';
    const kumeler = R.SUBJECTS.map(s => ({ ad:s.name, dugumler:s.topics.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map(t => {
      const st = M.topicState(s.id, t.id).state;
      return { ad:t.name, durum:st === 'closed' ? 'bitti' : st === 'not_started' ? 'bekliyor' : 'suruyor' };
    }) }));
    return K.Card({ title:yz('ays.progress.yol-haritasi'), sub:yz('ays.progress.konular-ders-ders-kapanan-do'),
      body:raw(A.html({ merkez:'Sınav', kumeler, bos:yz('ays.progress.konular-yuklenince-harita-be') })) });
  }

  LIFEOS.PARCA.blok({ id:'progress.ilerleme-ozeti', sayfa:'progress', yer:'ozet', sira:10, ad:'İlerleme özeti', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return raw(ozet);
  } });
  LIFEOS.PARCA.blok({ id:'progress.yolharitasi', sayfa:'progress', yer:'yol-ust', sira:10, ad:'Yol haritası', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return yolHaritasi();
  } });
  LIFEOS.PARCA.blok({ id:'progress.ice-aktarma-karti', sayfa:'progress', yer:'ozet', sira:10, ad:'İçe aktarma kartı', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return raw((window.LIFEOS.ICE ? window.LIFEOS.ICE.kartHtml('ays') : ''));
  } });
  LIFEOS.PARCA.blok({ id:'progress.donengidisat', sayfa:'progress', yer:'ozet', sira:10, ad:'Dönen gidişat', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return DonenGidisat();
  } });
  LIFEOS.PARCA.blok({ id:'progress.trendcard', sayfa:'progress', yer:'netler', sira:10, ad:'Gidişat', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return trendCard();
  } });
  LIFEOS.PARCA.blok({ id:'progress.gatecard', sayfa:'progress', yer:'karar', sira:10, ad:'Geçiş kapıları', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return gateCard();
  } });
  LIFEOS.PARCA.blok({ id:'progress.testtrendcard', sayfa:'progress', yer:'netler', sira:10, ad:'Test gidişatı', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return testTrendCard();
  } });
  LIFEOS.PARCA.blok({ id:'progress.plan-tamamlama-son-8-hafta', sayfa:'progress', yer:'yol', sira:20, ad:'Plan tamamlama — son 8 hafta', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return K.Card({ title:yz('ays.progress.plan-tamamlama-son-8'), sub:yz('ays.progress.hedef-85'),
          body:raw(UI.barChart(history, { targetLine:85, goodAt:85 })) });
  } });
  LIFEOS.PARCA.blok({ id:'progress.monthcurvecard', sayfa:'progress', yer:'netler', sira:30, ad:'Aylık eğri', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return monthCurveCard();
  } });
  LIFEOS.PARCA.blok({ id:'progress.kpireference', sayfa:'progress', yer:'yol', sira:40, ad:'Gösterge rehberi', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return kpiReference();
  } });
  LIFEOS.PARCA.blok({ id:'progress.hata-paretosu', sayfa:'progress', yer:'netler', sira:10, ad:'Hata paretosu', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return K.Card({ hint:'pareto', title:yz('ays.progress.hata-paretosu'), body:html`
          ${raw(UI.paretoBars(pareto))}
          ${when(pareto[0] && pareto[0].count, () => html`<div class="mt-10">${K.Notice({ tone:'info',
            body:yz('ays.progress.recete')+R.ERROR_TAGS[pareto[0].tag].recipe })}</div>`)}` });
  } });
  LIFEOS.PARCA.blok({ id:'progress.surec-gostergeleri', sayfa:'progress', yer:'yol', sira:20, ad:'Süreç göstergeleri', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return K.Card({ hint:'not-surec-gostergeleri', title:yz('ays.progress.surec-gostergeleri'), body:K.Stack([
          K.Meter({ label:yz('ays.progress.tekrar-borcu'), value:debt, text:'%'+debt, tone:debt > 10 ? 'danger' : '' }),
          K.Meter({ label:yz('ays.progress.konu-kapanisi'), value:closure, text:'%'+closure }),
          /* «Bu hızla» (fikir 20): kapanış hızından sınava yetişme — tahmin. */
          html`<p class="tiny dim">${C.buHizla().metin}</p>`,
          html`<p class="tiny dim">${C.verimliSaat().metin}</p>`,
          when(sleep != null, () => K.Meter({ label:yz('ays.progress.uyku-7-gun-ort'),
            value:U.pct(sleep, S.profile.sleepTarget), text:sleep+' / '+S.profile.sleepTarget+' sa' })),
        ], 'sm') });
  } });
  LIFEOS.PARCA.blok({ id:'progress.aciklamalar', sayfa:'progress', yer:'y9', sira:10, ad:'Açıklamalar', ciz({ pareto, history, sleep, debt, closure, ozet }){
    return raw(UI.rail(['median', 'base-score', 'bands', 'gate', 'pareto', 'plan-completion', 'test-trend']));
  } });
  async function render(){
    const pareto = C.errorPareto();
    const history = C.completionHistory(8).map(h => ({ label:'H'+h.n, value:h.value }));
    const sleep = C.sleepAverage(7);
    const debt = C.cardDebt();
    const closure = C.overallClosure().pct;
    /* Özet (KOLAY-PLANI Faz 2): Bugün'den taşınan günün sayıları en üstte. */
    const ozet = await R.Screens.today.ozet();

    /* TEK İŞ (kullanıcı, 2026-11-06: «bir bölümde birden fazla özellik olduğundan
       anlaşılmıyor»): Özet açılır; netler, yol ve aylık karar kendi katında. Karar
       bekliyorsa seçicide rozet durur, gizli kalmaz. */
    const parcaB = { pareto, history, sleep, debt, closure, ozet };
    const P = LIFEOS.PARCA;
    const gate = C.currentGate();
    const kararBekliyor = gate && !S.decisions[U.monthKey(U.today())];
    return String(html`${K.SayfaBolumleri({ act:'progress-tab', aria:yz('ays.progress.ilerleme-bolumleri'), bolumler:[
      { id:'ozet', ad:yz('ays.progress.bolum-ozet'), govde:K.Stack(P.liste('progress', 'ozet', K, parcaB)) },
      { id:'netler', ad:yz('ays.progress.bolum-netler'), govde:K.Stack(P.liste('progress', 'netler', K, parcaB)) },
      { id:'yol', ad:yz('ays.progress.bolum-yol'), govde:K.Stack(P.liste('progress', 'yol-ust', K, parcaB).concat(P.liste('progress', 'yol', K, parcaB))) },
      { id:'karar', ad:yz('ays.progress.bolum-karar'), sayi:kararBekliyor ? 1 : null, govde:gate ? P.yer('progress', 'karar', K, parcaB, raw) : '' },
    ] })}${P.yer('progress', 'y9', K, parcaB, raw)}`);
  }

  const handle = {
    async 'progress-tab'(el){ K.bolumeGit(el.dataset.tab); },
    async 'trend-family'(el){ S.ui.trendFamily = el.dataset.value; R.App.render(); },
    async 'toggle-kpi-ref'(){ S.ui.kpiRefOpen = !S.ui.kpiRefOpen; R.App.render(); },
    async 'toggle-month-curve'(){ S.ui.monthCurveOpen = !S.ui.monthCurveOpen; R.App.render(); },
    async 'save-decision'(){
      const sel = document.querySelector('input[name="gate-opt"]:checked');
      if(!sel){ UI.toast(yz('ays.progress.bir-mudahale-sec')); return; }
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
      UI.toast(yz('ays.progress.mudahale-kaydedildi-21-gun'));
      R.App.render();
    },
    async 'clear-decision'(el){
      UI.confirmSheet(yz('ays.progress.mudahaleyi-degistir'), yz('ays.progress.bu-ayin-secili-mudahalesi-si'), async () => {
        delete S.decisions[el.dataset.key];
        await R.Store.remove('decisions/'+el.dataset.key);
        UI.closeSheet();
        R.App.render();
      }, false, yz('ays.progress.mudahaleyi-kaldir'));
    },
  };

  /* Özet'in Öneri kartının düğmeleri Onaylar'ın işleyicilerine gider (Bugün'deki gibi). */
  R.Screens.today.onayEylemleri.forEach(a => { handle[a] = el => R.Screens.onaylar.handle[a](el); });

  return {
    id:'progress',
    /* Her katta iş açık; plan geçmişi ve hata dağılımı ara sıra bakılır (başvuru kartları app.js'te gizli). */
    kucukVarsayilan:['plan-tamamlama-son-hafta', 'hata-paretosu'],
    title:yz('ays.progress.i-lerleme'),
    subtitle(){
      const t = C.medianTrend('TYT');
      return t.last3 == null ? yz('ays.progress.henuz-tam-deneme-medyani-yok')
        : yz('ays.progress.tyt-medyani')+U.fmtNet(t.last3)+' · taban '+U.fmtNet(C.examBase('TYT'));
    },
    actions(){ return ''; },
    render, handle,
  };
})();
