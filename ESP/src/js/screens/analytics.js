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
    { id:'durust',  label:'Dürüstlük' },
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
            .concat(ESP.Mod.active().map(d => ({ value:d.id, label:d.short }))) }),
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


  /* ------------------------------------------------------- dürüstlük sekmesi

     Bu sekme sistemin KENDİSİNİ ölçer. Üç soru sorar ve üçünün de cevabı
     kullanıcı hakkında değil, sistem hakkındadır:

       Sürtünme      Sistemi yönetmek, çalışmanın yerine mi geçiyor?
       Ayrışma       Bir gösterge, temsil ettiği şeyden koptu mu?
       Kalibrasyon   Kullanıcı sistemsiz de kendi durumunu biliyor mu?

     Üçü de kötü çıkabilir ve bu bir arıza değildir; ölçüldüğü için
     görünür olmasıdır. Ölçülmeyen sürtünme sıfır değildir, yalnızca
     görünmezdir. */

  /* Bu sayfanın KENDİ gerekliliği.

     Gelen eleştiri şuydu: «Nöbetçi kullanıcıya görünmeden kaldırıldığında
     karar kalitesi düşüyor mu? Cevap hayırsa ekran gereksizdir.»

     Cevabı tahmin etmek yerine ölçüyoruz. Asıl iş artık Bugün ekranına
     düşen tek soruda (core/signals.js); burası o soruların DEFTERİ ve
     defterin ilk satırı, defterin kendisinin işe yarayıp yaramadığı.

     «Kaç anomali yakaladı» bir fayda ölçüsü değildir. Ölçülen şey zincir:
     tespit → farkındalık → cevap → sonraki pencerede ayrışma kapandı mı. */
  function signalLedgerRow(){
    const e = ESP.Signals.efficacy();
    const h = ESP.Signals.screenVerdict();
    const acik = ESP.Signals.current();
    const kapali = ESP.Signals.closed().slice(-8).reverse();

    return K.Entry({
      label:'DENETİM DEFTERİ', hint:'signal',
      meta:e.opened ? e.answered + '/' + e.opened + ' cevaplandı' : 'sinyal yok',
      note:'Nöbetçi ve sürtünme ölçer arka planda çalışır; soruları Bugün '
         + 'ekranına tek satır olarak düşer. Burası o soruların defteri.',
      wide:true,
      body:html`
        ${K.Notice({ tone:h.level === 'used' ? 'ok' : h.level === 'unknown' ? 'info' : 'warn',
          title:'Bu sayfa gerekli mi?', body:h.text })}

        ${when(acik, () => K.Notice({ tone:'info', title:'Açık soru',
          body:acik.question + ' (Bugün ekranında cevaplanabilir.)' }))}

        ${K.Table({ tight:true, headers:['Zincir', { label:'Sayı', num:true }], rows:[
          ['Açılan sinyal', String(e.opened)],
          ['Görüldü', String(e.seen)],
          ['Cevaplandı', String(e.answered)],
          ['«Bana uymuyor» denildi', String(e.dismissed)],
          ['Kapandı', String(e.closed)],
        ] })}

        ${when(e.cert === 'observed', () => K.Table({ tight:true,
          headers:['Kapanan sinyal', { label:'Adet', num:true },
            { label:'Ayrışma kapandı', num:true }],
          rows:[
            ['Cevaplananlar', String(e.answeredClosed),
              (e.answeredRate == null ? '—' : '%' + e.answeredRate)],
            ['Cevaplanmayanlar', String(e.unansweredClosed),
              (e.unansweredRate == null ? '—' : '%' + e.unansweredRate)],
          ] }))}

        <p class="tiny dim mt-8">${e.note}</p>

        ${when(kapali.length, () => K.Table({ tight:true,
          headers:['Soru', 'Cevap', 'Sonuç'],
          rows:kapali.map(sg => [
            sg.title,
            sg.answer ? sg.answer.slice(0, 60) : '—',
            sg.outcome === 'realigned' ? 'ayrışma kapandı'
              : sg.outcome === 'still-decoupled' ? 'sürüyor'
              : sg.outcome === 'dismissed' ? 'geçersiz bulundu' : 'ölçülemedi',
          ]) }))}`,
    });
  }

  function honestyRows(){
    const f = ESP.Friction.verdict();
    const rahatlama = ESP.Friction.relief();
    const bayraklar = ESP.Goodhart.scan();
    const ayrisan = bayraklar.filter(p => p.status === 'decoupled');
    const puan = ESP.Calib.score();
    const vadesi = ESP.Calib.due();

    return [
      signalLedgerRow(),

      K.Entry({
        label:'SÜRTÜNME', hint:'friction',
        meta:f.cert === 'missing' ? 'veri yok'
          : f.window.perDay + ' dk/gün'
            + (f.window.ratio == null ? '' : ' · %' + Math.round(f.window.ratio * 100)),
        note:'Sistemde geçen süre ile çalışmada geçen süre. Pratik sayacı '
           + 'açıkken geçen süre çalışma sayılır, yönetim değil.',
        wide:true,
        body:html`
          ${K.Notice({ tone:f.level === 'high' ? 'warn' : 'info',
            title:f.title, body:f.note })}
          ${when(f.cert === 'measured', () => K.Table({ tight:true,
            headers:['Pencere', { label:'Yönetim', num:true }, { label:'Çalışma', num:true },
              { label:'Pay', num:true }],
            rows:[[
              f.window.days + ' gün (' + f.window.measuredDays + ' ölçüldü)',
              U.fmtMin(f.window.admin), U.fmtMin(f.window.work),
              f.window.ratio == null ? '—' : '%' + Math.round(f.window.ratio * 100),
            ]] }))}
          ${when(rahatlama.length, () => html`
            <div class="mt-10">
              ${map(rahatlama, r => K.Entry({ label:r.label, note:r.note,
                body:K.Button({ label:'Bak', size:'sm', act:r.act }) }))}
            </div>`)}`,
      }),

      K.Entry({
        label:'GÖSTERGE AYRIŞMASI', hint:'goodhart',
        meta:ayrisan.length ? ayrisan.length + ' ayrışma' : 'temiz',
        note:'Çaba arttı da sonuç yerinde mi saydı? Nöbetçi hüküm vermez, '
           + 'soru sorar: ayrışmanın meşru sebepleri vardır.',
        wide:true,
        body:bayraklar.length
          ? K.Table({ tight:true,
              headers:['Çift', 'Çaba', 'Sonuç', 'Durum'],
              rows:bayraklar.map(p => [
                p.effortLabel + ' → ' + p.outcomeLabel,
                p.effortChange == null ? P.cert(p.cert === 'missing' ? 'missing' : 'estimated')
                  : (p.effortChange === Infinity ? 'yeni' : '%' + Math.round(p.effortChange * 100)),
                p.outcomeChange == null ? P.cert('missing')
                  : (p.outcomeChange === Infinity ? 'yeni' : '%' + Math.round(p.outcomeChange * 100)),
                p.status === 'decoupled' ? 'ayrıştı'
                  : p.status === 'aligned' ? 'birlikte'
                  : p.status === 'unknown' ? 'ölçülmedi' : 'sessiz',
              ]) })
          : K.Empty({ text:'Açık bölüm yok; nöbetçinin bakacağı çift de yok.' }),
      }),

      ...ayrisan.map(p => K.Entry({
        label:p.effortLabel.toUpperCase(),
        meta:'ayrıştı',
        note:p.note,
        body:K.Notice({ tone:'info', title:'Soru', body:p.question }),
      })),

      K.Entry({
        label:'KALİBRASYON', hint:'calib',
        meta:puan.cert === 'missing' ? puan.n + '/' + ESP.Calib.ASGARI + ' tahmin'
          : (puan.grade || (puan.brier == null ? '—' : 'brier ' + puan.brier.toFixed(2))),
        note:'Sistem söylemeden önce sen söyle. Burada ölçülen şey senin '
           + 'kendi durumunu ne kadar bildiğin — sistem kapalıyken de geçerli '
           + 'olan tek ölçü bu.',
        wide:true,
        body:html`
          ${K.Notice({ tone:'info', body:puan.note })}
          ${when(puan.bias.cert === 'measured', () => K.Notice({ tone:'info',
            title:'Yanlılık', body:puan.bias.note }))}
          <div class="mt-10">
            ${K.Field({ label:'Ne tahmin ediyorsun?',
              input:K.Select({ id:'calib-kind', value:S.ui.calibKind || 'minutes',
                change:'calib-kind', aria:'Tahmin türü',
                options:ESP.CALIB_KINDS.map(k => ({ value:k.id, label:k.label })) }) })}
            ${(function(){
              const k = ESP.Calib.kindOf(S.ui.calibKind || 'minutes');
              return html`
                <p class="lrow__note">${k.ask}</p>
                ${K.Field({ label:k.type === 'binary' ? 'Olasılık (0–1)' : 'Tahminin' + (k.unit ? ' (' + k.unit + ')' : ''),
                  input:K.Input({ id:'calib-guess', type:'number', numeric:true,
                    step:k.type === 'binary' ? '0.05' : '1',
                    placeholder:k.type === 'binary' ? '0,70' : '0' }) })}`;
            })()}
            ${K.Button({ label:'Tahmini kaydet', tone:'primary', act:'calib-open' })}
          </div>
          ${when(vadesi.length, () => html`
            <div class="mt-10">
              ${map(vadesi, fo => K.Entry({
                label:(ESP.Calib.kindOf(fo.kind) || {}).label || fo.kind,
                meta:'tahminin: ' + U.fmtNum(fo.guess),
                note:'Gerçek değer girilince tahmin kapanır ve deftere yazılır.',
                body:html`
                  ${K.Field({ label:'Gerçekleşen',
                    input:K.Input({ id:'calib-actual-' + fo.id, type:'number', numeric:true }) })}
                  ${K.Button({ label:'Kapat', size:'sm', act:'calib-settle',
                    data:{ 'data-id':fo.id } })}`,
              }))}
            </div>`)}
          ${when(ESP.Calib.settled().length, () => K.Table({ tight:true,
            headers:['Tür', { label:'Tahmin', num:true }, { label:'Gerçek', num:true },
              { label:'Sapma', num:true }],
            rows:ESP.Calib.settled().slice(0, 10).map(fo => {
              const h = ESP.Calib.error(fo);
              return [(ESP.Calib.kindOf(fo.kind) || {}).label || fo.kind,
                U.fmtNum(fo.guess), U.fmtNum(fo.actual),
                h == null ? '—' : (h.type === 'brier' ? h.value.toFixed(2)
                  : '%' + Math.round(h.value * 100))];
            }) }))}`,
      }),
    ];
  }

  /* ------------------------------------------------------------------ çizim */

  function render(){
    const tab = S.ui.analyticsTab || 'radar';
    const rows = tab === 'seriler' ? seriesRows()
      : tab === 'rapor' ? reportRows()
      : tab === 'durust' ? honestyRows()
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

    /* Tahmin KÖR açılır: gerçek değer burada hesaplanmaz, yalnızca
       kapanışta. Ekranda duran bir sayıya bakarak yazılan tahmin, tahmin
       değil kopyadır. */
    async 'calib-open'(){
      const kind = S.ui.calibKind || 'minutes';
      const el = document.getElementById('calib-guess');
      const r = await ESP.Calib.open(kind, el ? el.value : null,
        { dueAt:dueFor(kind) });
      if(!r.ok){ ESP.UI.toast(r.error); return; }
      if(el) el.value = '';
      ESP.UI.toast('Tahmin deftere yazıldı.');
      ESP.App.render();
    },

    async 'calib-settle'(el){
      const id = el.dataset.id;
      const inp = document.getElementById('calib-actual-' + id);
      const r = await ESP.Calib.settle(id, inp ? inp.value : null);
      if(!r.ok){ ESP.UI.toast(r.error); return; }
      const h = ESP.Calib.error(r.forecast);
      ESP.UI.toast(h && h.type === 'ape'
        ? 'Kapandı — sapma %' + Math.round(h.value * 100)
        : 'Kapandı.');
      ESP.App.render();
    },
  };

  /* Tahminin vadesi: haftalık sayılar hafta bitmeden, aylık kapı tahmini
     ay bitmeden kapanmaz. Erken kapanış tahmini kolaylaştırır. */
  function dueFor(kind){
    const bugun = U.parse(U.todayISO());
    if(kind === 'minutes' || kind === 'sessions') return U.iso(U.addDays(bugun, 7));
    if(kind === 'gate') return U.iso(U.addDays(bugun, 30));
    return null;
  }

  const change = {
    async 'radar-window'(el){ S.ui.radarWindow = Number(el.value) || 14; ESP.App.render(); },
    async 'series-disc'(el){ S.ui.seriesDisc = el.value; ESP.App.render(); },
    async 'calib-kind'(el){ S.ui.calibKind = el.value; ESP.App.render(); },
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
