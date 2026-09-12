/* Analiz — entelektüel sermaye radarı, seriler ve haftalık rapor.

   Üç sekme: Radar · Seriler · Rapor.

   Burada tek bir kural her şeyi belirler: KORELASYON NEDENSELLİK GİBİ
   YAZILMAZ. Bulgu daima «birlikte hareket ediyor» diliyle kurulur ve
   ölçülmemiş bir eksen sıfıra çekilmez.

   Haftalık rapor iyi haberi kötü haberin arkasına saklamaz: kötü olan önce
   söylenir, sonra «fakat» gelir. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.analytics = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C, P = ESP.Parts;

  const TABS = [
    { id:'radar',   label:'Radar' },
    { id:'seriler', label:'Seriler' },
    { id:'rapor',   label:'Rapor' },
  ];

  /* ------------------------------------------------------------------ radar */

  function radarRows(){
    const pencere = S.ui.radarWindow || 14;
    const ehs = ESP.Intellect.ehs(pencere);
    const enBuyuk = ehs.rows.reduce((m, r) =>
      (r.score != null && r.score > m) ? r.score : m, 0);

    const eksenler = ehs.rows.map(r => ({
      label:r.disc.short,
      value:enBuyuk && r.score != null ? r.score / enBuyuk : null,
      cert:r.cert,
    }));

    return [
      K.Entry({
        label:'ENTELEKTÜEL SERMAYE', hint:'ehs',
        meta:ehs.cert === 'missing' ? 'veri yok'
          : U.fmtNum(Math.round(ehs.value * 10) / 10) + ' hacim',
        note:ehs.cert === 'missing'
          ? 'Son ' + pencere + ' günde ölçülmüş pratik yok.'
          : pencere + ' günün ' + ehs.enteredDays + '\'inden hesaplandı. '
            + 'Girilmemiş gün toplama girmez.',
        action:K.Select({ value:String(pencere), change:'radar-window', size:'sm',
          aria:'Ölçüm penceresi',
          options:[{ value:'7', label:'7 gün' }, { value:'14', label:'14 gün' },
            { value:'30', label:'30 gün' }] }),
        wide:true,
        body:html`
          ${P.radar(eksenler, { scale:'Dış halka = bu penceredeki en yüksek disiplin.' })}
          ${K.Table({ tight:true,
            headers:['Disiplin', { label:'Süre', num:true }, { label:'Gün', num:true },
              { label:'Katsayı', num:true }, 'Katsayının kaynağı'],
            rows:ehs.rows.map(r => [
              r.disc.label,
              r.cert === 'missing' ? P.cert('missing') : U.fmtMin(Math.round(r.hours * 60)),
              r.cert === 'missing' ? '—' : String(r.enteredDays),
              r.cert === 'missing' ? '—' : U.fmtNum(Math.round(r.k * 100) / 100),
              r.kWhy,
            ]) })}`,
      }),

      K.Entry({
        label:'DENGE',
        meta:(function(){
          const b = ESP.Planner.balance(7);
          return b.cert === 'missing' ? 'veri yok' : (b.skewed ? 'dengesiz' : 'dengeli');
        })(),
        note:'Yoğunlaşma kasıtlı olabilir; sistem yalnızca görünür kılar, '
           + 'suçlamaz.',
        body:(function(){
          const b = ESP.Planner.balance(7);
          if(b.cert === 'missing'){
            return K.Empty({ text:'Son yedi günde kayıt yok.' });
          }
          return html`
            ${map(b.rows, r => K.Meter({ label:r.disc.label,
              value:r.share == null ? 0 : r.share * 100,
              text:r.cert === 'missing' ? 'veri yok' : U.fmtMin(r.minutes) }))}
            ${when(b.skewed, () => K.Notice({ tone:'info',
              body:'Pratik ' + b.top.label + ' tarafına yığılmış ve '
                + b.untouched.map(d => d.label).join(', ') + ' hiç açılmamış. '
                + 'Bu bir bulgudur, bir hata değil.' }))}`;
        })(),
      }),

      K.Entry({
        label:'HAFTALIK ROTA',
        meta:'öncelik sırasına göre',
        note:'Rota bir takvim değildir: hangi disiplinin öne geçtiğini söyler, '
           + '«salı 19:00» demez. Odak yalnızca eşitliği bozar.',
        body:(function(){
          const r = ESP.Planner.weeklyRoute();
          return html`
            ${K.Table({ tight:true, headers:[{ label:'#', num:true }, 'Disiplin', 'Neden önde'],
              rows:r.rows.map((x, i) => [String(i + 1), x.disc.label,
                x.score >= 100 ? 'Son 7 günde hiç açılmadı'
                  : x.score >= 80 ? 'Tıkanma ya da yaklaşan hedef'
                  : 'Süre payı düşük']) })}
            ${when(r.note, () => K.Notice({ tone:'info', body:r.note }))}`;
        })(),
      }),
    ];
  }

  /* ---------------------------------------------------------------- seriler */

  function seriesRows(){
    const gunler = U.lastDays(30);
    const disipl = S.ui.seriesDisc || 'all';

    /* Girilmemis gun diziye SIFIR olarak girmez: `null` girer ve grafik
       orada kopar. Sifir girseydi "o gun hic calisilmadi" ile "o gun
       girilmedi" ayni gorunurdu. */
    const seri = gunler.map(d => {
      const v = M.minutesOf(d, disipl === 'all' ? null : disipl);
      return v == null ? null : v;
    });
    const olculen = seri.filter(v => v != null);

    return [
      K.Entry({
        label:'GÜNLÜK SÜRE',
        meta:olculen.length + '/' + gunler.length + ' günde kayıt',
        note:'Girilmemiş gün grafikte boşluktur, sıfır değildir. '
           + 'Ortalama yalnızca kayıtlı günlerden hesaplanır.',
        action:K.Select({ value:disipl, change:'series-disc', size:'sm',
          aria:'Disiplin süzgeci',
          options:[{ value:'all', label:'Tümü' }]
            .concat(ESP.DISCIPLINES.map(d => ({ value:d.id, label:d.short }))) }),
        wide:true,
        body:olculen.length
          ? html`
            ${raw(ESP.UI.barChart(
              seri.map((v, i) => ({ label:i % 3 ? '' : gunler[i].slice(5), value:v })),
              { max:Math.max(60, Math.ceil(Math.max.apply(null, olculen) / 30) * 30),
                goodAt:0 }))}
            <p class="small muted mt-8">
              Ortalama ${U.fmtMin(Math.round(olculen.reduce((a, b) => a + b, 0) / olculen.length))}
              — ${olculen.length} kayıtlı günden hesaplandı, 30 günden değil.</p>`
          : K.Empty({ text:'Son 30 günde kayıt yok.' }),
      }),

      K.Entry({
        label:'SERİ', hint:'streak',
        meta:M.streak() + ' gün',
        note:'Seri bir hedef değil bir gözlemdir. Hiç girilmemiş gün seriyi '
           + 'kırar; «0 dakika» girilen gün de kırar — ikisi ayrı şeydir.',
        body:html`
          ${K.Meter({ label:'Üst üste kayıtlı gün', value:Math.min(100, M.streak() / 30 * 100),
            text:M.streak() + ' gün' })}
          <p class="small muted mt-8">Bugün henüz girilmediyse seri kırılmış
            sayılmaz: gün bitmedi.</p>`,
      }),

      K.Entry({
        label:'RETANSİYON', hint:'retention',
        meta:(function(){
          const r = ESP.SRS.retention();
          return r.cert === 'missing' ? 'veri yok' : '%' + Math.round(r.value * 100);
        })(),
        note:'Hiç cevaplanmamış kart bu ortalamaya girmez.',
        body:(function(){
          const r = ESP.SRS.retention();
          if(r.cert === 'missing'){
            return K.Empty({ text:'Hiç cevaplanmış kart yok.' });
          }
          return html`${K.Meter({ label:r.n + '/' + r.total + ' karttan',
            value:r.value * 100, text:'%' + Math.round(r.value * 100),
            tone:r.value < ESP.Planner.RETENTION_FLOOR ? 'danger' : '' })}`;
        })(),
      }),
    ];
  }

  /* ------------------------------------------------------------------ rapor */

  function reportRows(){
    const cross = ESP.Planner.crossFindings();
    const brf = ESP.Office.patronBrief();
    const gunluk = S.officeBriefings[U.todayISO()];

    return [
      K.Entry({
        label:'HAFTALIK RAPOR',
        meta:'kural motorundan',
        note:'İyi haber kötü haberin arkasına saklanmaz: kötü olan önce söylenir.',
        wide:true,
        body:html`<p class="rulesay">${ESP.Office.ruleText('patron', brf)}</p>`,
      }),

      K.Entry({
        label:'ÇAPRAZ BULGULAR',
        meta:cross.length ? cross.length + ' bulgu' : 'yok',
        note:'İki AYRI masanın verisi birlikte anlam kazandığında çıkar. '
           + '«Birlikte hareket ediyor» denir, «sebep oldu» denmez.',
        wide:true,
        body:cross.length
          ? html`${map(cross, c => html`
              <div class="crossrow">
                <div class="crossrow__pair">
                  ${P.avatar(c.from, 'sm')}
                  <span class="crossrow__arrow">→</span>
                  ${P.avatar(c.to, 'sm')}
                </div>
                <p>${c.text}</p>
                ${when(c.route, () => K.Button({ label:'Aç', size:'sm', act:'go',
                  data:{ 'data-route':c.route } }))}
              </div>`)}`
          : K.Empty({ text:'İki masayı birbirine bağlayan ölçülmüş bir bulgu yok.' }),
      }),

      K.Entry({
        label:'GÜNÜN BRİFİNGİ',
        meta:gunluk ? (gunluk.source === 'model' ? 'model' : 'kural motoru') : 'üretilmedi',
        note:'Günde tek model çağrısı. Sonuç güne yazılır; aynı gün tekrar '
           + 'çağrılmaz.',
        action:K.Button({ label:gunluk ? 'Yeniden üret' : 'Üret', size:'sm',
          act:'gen-briefing' }),
        body:gunluk
          ? html`<p class="rulesay">${gunluk.text}</p>`
          : K.Empty({ text:'Bugün için brifing üretilmedi.' }),
      }),

      K.Entry({
        label:'SINIR', hint:'pedagogic',
        meta:'ne söylenmez',
        body:html`
          ${K.Notice({ tone:'info', body:ESP.PEDAGOGIC.disclaimer })}
          ${K.Table({ tight:true, headers:['Denetim', 'Ne arar'],
            rows:ESP.PEDAGOGIC.never.map(n => [n.label, n.note]) })}`,
      }),
    ];
  }

  /* ------------------------------------------------------------------ çizim */

  function render(){
    const tab = S.ui.analyticsTab || 'radar';
    const rows = tab === 'seriler' ? seriesRows()
      : tab === 'rapor' ? reportRows()
      : radarRows();

    return K.Grid(html`
      ${K.Span(12, K.Toolbar({
        tabs:K.Subtabs({ value:tab, act:'ana-tab', aria:'Analiz sekmeleri', items:TABS }),
      }))}
      ${K.Span(12, K.Ledger(() => rows))}`);
  }

  const handle = {
    async 'ana-tab'(el){ S.ui.analyticsTab = el.dataset.tab; ESP.App.render(); },

    async 'gen-briefing'(){
      delete S.officeBriefings[U.todayISO()];
      await ESP.UI.withBusy(async () => {
        await ESP.Office.dailyBriefing();
      }, 'Brifing üretiliyor');
      ESP.App.render();
    },
  };

  const change = {
    async 'radar-window'(el){ S.ui.radarWindow = Number(el.value) || 14; ESP.App.render(); },
    async 'series-disc'(el){ S.ui.seriesDisc = el.value; ESP.App.render(); },
  };

  return {
    id:'analytics',
    title:'Analiz',
    headline(){
      const b = ESP.Planner.balance(7);
      if(b.cert === 'missing') return 'Ölçülecek veri yok.';
      if(b.skewed) return 'Haftanın pratiği ' + b.top.label + ' tarafına yığılmış.';
      const c = ESP.Planner.crossFindings();
      if(c.length) return c.length + ' çapraz bulgu var.';
      return 'Dağılım dengeli.';
    },
    lede(){
      const ehs = ESP.Intellect.ehs(14);
      return ehs.cert === 'missing'
        ? 'Son 14 günde ölçülmüş pratik yok; hacim hesaplanmadı.'
        : 'Entelektüel hacim ' + U.fmtNum(Math.round(ehs.value * 10) / 10)
          + ' — 14 günün ' + ehs.enteredDays + '\'inden hesaplandı.';
    },
    stats(){
      const ehs = ESP.Intellect.ehs(14);
      const ss = ESP.Intellect.syntopic();
      const r = ESP.SRS.retention();
      return [
        { value:ehs.cert === 'missing' ? '—' : U.fmtNum(Math.round(ehs.value)), label:'hacim' },
        { value:ss.cert === 'missing' ? '—' : U.fmtNum(Math.round(ss.value * 100) / 100), label:'SSK' },
        { value:r.cert === 'missing' ? '—' : '%' + Math.round(r.value * 100), label:'retansiyon' },
        { value:String(ESP.Planner.crossFindings().length), label:'çapraz bulgu' },
      ];
    },
    subtitle(){ return 'son 14 gün'; },
    actions(){ return ''; },
    render, handle, change,
  };
})();
