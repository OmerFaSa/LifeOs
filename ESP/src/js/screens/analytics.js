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
    { id:'radar',     label:'Radar' },
    { id:'seriler',   label:'Seriler' },
    { id:'rapor',     label:'Rapor' },
    { id:'durust',    label:'Dürüstlük' },
    { id:'rubrikler', label:'Rubrik ve analiz' },
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
        label:'Entelektüel sermaye', hint:'ehs',
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
        /* Geniş ekranda radar ile tablo yan yana (esp.css .radarcift):
           radar ortada dar duruyordu, iki yanı boştu (iPhone §8 «boy»). */
        body:html`<div class="radarcift">
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
            ]) })}</div>`,
      }),

      K.Entry({
        hint:'not-denge', label:'Denge',
        meta:(function(){
          const b = ESP.Planner.balance(7);
          return b.cert === 'missing' ? 'veri yok' : (b.skewed ? 'dengesiz' : 'dengeli');
        })(),
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
        hint:'not-haftalik-rota', label:'Haftalık rota',
        meta:'öncelik sırasına göre',
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
        hint:'not-gunluk-sure', label:'Günlük süre',
        meta:olculen.length + '/' + gunler.length + ' günde kayıt',
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
        label:'Seri', hint:'streak',
        meta:M.streak() + ' gün',
        body:html`
          ${K.Meter({ label:'Üst üste kayıtlı gün', value:Math.min(100, M.streak() / 30 * 100),
            text:M.streak() + ' gün' })}
          <p class="small muted mt-8">Bugün henüz girilmediyse seri kırılmış
            sayılmaz: gün bitmedi.</p>`,
      }),

      K.Entry({
        label:'Kart hatırlama', hint:'retention',
        meta:(function(){
          const r = ESP.SRS.retention();
          return r.cert === 'missing' ? 'veri yok' : '%' + Math.round(r.value * 100);
        })(),
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
        hint:'not-haftalik-rapor', label:'Haftalık rapor',
        meta:'kural motorundan',
        wide:true,
        body:html`<div class="rapor-govde">
          <!-- RAPOR KAPAĞI — belgenin yüzü. Mühür belgeyi imzalar, kapak
               adlandırır; ikisi ayrı şeydir. Dosya yoksa düğüm kalkar. -->
          <img class="rapor-kapak" src="img/marka/kapak-performans-analizi.webp"
            alt="Performans analizi kapağı" loading="lazy" onerror="this.remove()">
          <p class="rulesay">${ESP.Office.ruleText('patron', brf)}</p>
        </div>`,
      }),

      K.Entry({
        hint:'not-capraz-bulgular', label:'Çapraz bulgular',
        meta:cross.length ? cross.length + ' bulgu' : 'yok',
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
        hint:'not-gunun-brifingi', label:'Günün brifingi',
        meta:gunluk ? (gunluk.source === 'model' ? 'model' : 'kural motoru') : 'üretilmedi',
        action:K.Button({ label:gunluk ? 'Yeniden üret' : 'Üret', size:'sm',
          act:'gen-briefing' }),
        body:gunluk
          ? html`<p class="rulesay">${gunluk.text}</p>`
          : K.Empty({ text:'Bugün için brifing üretilmedi.' }),
      }),

      K.Entry({
        label:'Sınır', hint:'pedagogic',
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
      label:'Denetim defteri', hint:'signal',
      meta:e.opened ? e.answered + '/' + e.opened + ' cevaplandı' : 'sinyal yok',
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
        label:'Sürtünme', hint:'friction',
        meta:f.cert === 'missing' ? 'veri yok'
          : f.window.perDay + ' dk/gün'
            + (f.window.ratio == null ? '' : ' · %' + Math.round(f.window.ratio * 100)),
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
        label:'Gösterge ayrışması', hint:'goodhart',
        meta:ayrisan.length ? ayrisan.length + ' ayrışma' : 'temiz',
        wide:true,
        body:bayraklar.length
          ? html`${K.Table({ tight:true,
              headers:['Çift', 'Yön', 'Çaba', 'Sonuç', 'Durum'],
              rows:bayraklar.map(p => [
                p.effortLabel + ' → ' + p.outcomeLabel,
                (ESP.Goodhart.DIRECTIONS[p.direction] || {}).label || 'tanımsız',
                p.effortChange == null ? P.cert(p.cert === 'missing' ? 'missing' : 'estimated')
                  : (p.effortChange === Infinity ? 'yeni' : '%' + Math.round(p.effortChange * 100)),
                p.outcomeChange == null ? P.cert('missing')
                  : (p.outcomeChange === Infinity ? 'yeni' : '%' + Math.round(p.outcomeChange * 100)),
                p.status === 'decoupled' ? 'ayrıştı'
                  : p.status === 'aligned' ? 'birlikte'
                  : p.status === 'unknown' ? 'ölçülmedi' : 'sessiz',
              ]) })}
            <p class="small muted mt-8">«Yön» sütunu sonucun hangi tarafa
              gitmesinin iyi sayıldığını söyler. Yönü tanımsız bir çift
              değerlendirilmez: sistem yüksek olanın iyi olduğunu VARSAYMAZ.</p>
            ${(function(){
              const pol = ESP.Goodhart.policy();
              return K.Ayrinti({ class:'small muted mt-8', etiket:'Bu sayılar nereden?',
                ozet:'Pencere ' + pol.windowDays + ' gün · çaba artışı eşiği %'
                  + Math.round(pol.effortRiseThreshold * 100) + ' · sonuç durgunluk eşiği %'
                  + Math.round(pol.stagnationThreshold * 100) + ' · asgari çaba '
                  + pol.minEffortMinutes + ' dk.',
                govde:html`<p>Bu sayılar bir bulgu değil bu yazılımın ayarıdır: ${pol.rationale}</p>` });
            })()}`
          : K.Empty({ text:'Açık bölüm yok; nöbetçinin bakacağı çift de yok.' }),
      }),

      ...ayrisan.map(p => K.Entry({
        label:p.effortLabel.toUpperCase(),
        meta:'ayrıştı',
        note:p.note,
        body:K.Notice({ tone:'info', title:'Soru', body:p.question }),
      })),

      K.Entry({
        label:'Kalibrasyon', hint:'calib',
        meta:puan.cert === 'missing' ? puan.n + '/' + ESP.Calib.ASGARI + ' tahmin'
          : (puan.grade || (puan.brier == null ? '—' : 'brier ' + puan.brier.toFixed(2))),
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

  /* ---------------------------------------------------------------- rubrikler */

  function rubriklerRows(){
    const discFilter = S.ui.anRubDisc || 'all';
    let derinler = ESP.DERIN_ANALIZLER || [];
    let rubler = ESP.RUBRIKLER || [];
    let kademeler = ESP.KADEMELI_GERI_BILDIRIM || [];

    if(discFilter !== 'all'){
      derinler = derinler.filter(d => d.discipline === discFilter);
      rubler = rubler.filter(r => r.discipline === discFilter);
      kademeler = kademeler.filter(k => k.discipline === discFilter);
    }

    const discOptions = [{ value:'all', label:'Tüm disiplinler (7 alan)' }]
      .concat(ESP.Mod.active().map(d => ({ value:d.id, label:d.label })));

    return [
      K.Entry({
        label:'Disiplin Filtresi',
        action:K.Select({ id:'an-rub-disc', value:discFilter, change:'an-rub-disc', size:'sm',
          options:discOptions }),
      }),

      K.Entry({
        label:'Derin alan analizleri', hint:'deep-analysis',
        meta:derinler.length + ' derin analiz',
        wide:true,
        body:html`
          <p class="small muted mb-10">Her disiplin için karar sıraları, 3 durum senaryosu, karşı örnekler ve veri sınırları.</p>
          <div class="stack-sm">${map(derinler, da => {
            const discName = (ESP.DISCIPLINE_BY_ID[da.discipline] || {}).label || da.discipline;
            return html`
              <div class="ogrenme">
                <div class="row between gap-8 mb-4">
                  <b class="small">${U.esc(da.title)}</b>
                  <span class="badge badge--muted tiny">${discName}</span>
                </div>
                <div class="small mb-6"><b>Karar Sırası:</b> ${(da.decision_order || []).join(' → ')}</div>
                <div class="stack-xs mb-6">${map(da.cases || [], c => html`
                  <div class="ogrenme__kutu">
                    <div class="tiny bold text-1">${U.esc(c.name)}:</div>
                    <div class="tiny dim">${U.esc(c.condition)} → <span class="text-2">${U.esc(c.decision)}</span></div>
                  </div>`)}</div>
                ${when(da.counter_example, () => html`
                  <div class="tiny dim mb-4"><b>Karşı Örnek:</b> ${U.esc(da.counter_example.text)}</div>`)}
                <div class="tiny dim"><b>Veri Sınırı:</b> ${U.esc(da.data_boundary)}</div>
              </div>`;
          })}</div>`,
      }),

      K.Entry({
        label:'Değerlendirme rubrikleri ve boyutlar', hint:'rubric',
        meta:rubler.length + ' rubrik · 22 boyut',
        wide:true,
        body:html`
          <p class="small muted mb-10">0–3 puanlama skalası, gözlenebilir davranış çapaları ve değerlendirme kuralları.</p>
          <div class="stack-sm">${map(rubler, rub => {
            const discName = (ESP.DISCIPLINE_BY_ID[rub.discipline] || {}).label || rub.discipline;
            return html`
              <div class="ogrenme">
                <div class="row between gap-8 mb-4">
                  <b class="small">${discName} Değerlendirme Rubriği</b>
                  <span class="badge badge--muted tiny">${(rub.dimensions || []).length} boyut</span>
                </div>
                <p class="tiny dim mb-6">${U.esc(rub.rule)}</p>
                <div class="stack-xs">${map(rub.dimensions || [], dim => html`
                  <div class="ogrenme__kutu mb-4">
                    <b class="tiny text-1">${U.esc(dim.name)}</b>
                    <div class="stack-xs mt-4">${map(dim.anchors || [], a => html`
                      <div class="tiny dim">
                        <span class="bold" style="color:var(--primary)">${a.score} Puan:</span> ${U.esc(a.description)}
                      </div>`)}</div>
                  </div>`)}</div>
              </div>`;
          })}</div>`,
      }),

      when(kademeler.length, () => K.Entry({
        label:'Kademeli geri bildirim ipuçları', hint:'feedback',
        meta:kademeler.length + ' ipucu akışı',
        wide:true,
        body:html`<div class="stack-sm">${map(kademeler, kf => html`
          <div class="ogrenme">
            <b class="small block mb-4">${U.esc(kf.title)}</b>
            <div class="tiny dim mb-2"><b>1. Seviye (Soru):</b> ${U.esc(kf.level_1_question)}</div>
            <div class="tiny dim mb-2"><b>2. Seviye (Kural):</b> ${U.esc(kf.level_2_rule)}</div>
            <div class="tiny dim"><b>3. Seviye (Örnek):</b> ${U.esc(kf.level_3_worked)}</div>
          </div>`)}</div>`,
      })),
    ];
  }

  /* ------------------------------------------------------------------ çizim */

  /* Sekme yok (EKIP-PLANI §1.2): okumalar alt alta. */
  const GOVDE = { radar:radarRows, seriler:seriesRows, rapor:reportRows, durust:honestyRows, rubrikler:rubriklerRows };

  /* ALANLARA ÖZEL GÖRÜNÜM (2026-10-20, kullanıcı: «ESP Analiz çok karmaşık;
     alanlara özel ama göz yormayan, göze hitap eden bir düzen»).
     Her açık disiplin bir karo: son 14 günün dakikası (ölçüldü), 14 günlük
     mini sütunlar (girilmemiş gün boşluk, sıfır değil), önceki 14 günle
     fark — ancak İKİ pencerede de en az 3 kayıtlı gün varsa — ve kural
     motorunun o alana özel kalite cümlesi (Intellect.ehs kWhy). Altta
     haftanın dengesi tek yığılmış çubuk. Eski beş okuma «Ayrıntılı
     okumalar»da, baştan kapalı. */
  const RENK = ['var(--esp)', 'var(--ays)', 'var(--mer)', 'var(--spi)', 'var(--ok)', 'var(--text-2)',
    'color-mix(in oklab, var(--ays) 50%, var(--spi))'];
  /* Alanın simgesi: ui.js'te çizimi OLAN adlardan (olmayan ad «i» çıkıyordu). */
  const SIMGE = { lang:'cards', philo:'users', history:'map', music:'play', diction:'mic', reading:'book', writing:'edit' };
  const ESIK_GUN = 3;
  function discIcon(id){
    const v = (ESP.SECTIONS_ALL || []).reduce((f, s) => f || (s.views || []).find(x => x.disc === id || (Array.isArray(x.disc) && x.disc.indexOf(id) >= 0)), null);
    return { icon:SIMGE[id] || 'book', route:v && v.route || null };
  }
  function pencereDk(discId, bas, gun){
    const l = [];
    for(let i = bas + gun - 1; i >= bas; i--){
      const d = U.iso(U.addDays(U.parse(U.todayISO()), -i));
      l.push(M.minutesOf(d, discId));
    }
    return l;
  }
  function sutunlar(l, renk){
    const enBuyuk = Math.max(1, ...l.filter(v => v != null));
    const w = 6, ara = 3, h = 34;
    const bar = l.map((v, i) => v == null
      ? '<circle cx="' + (i * (w + ara) + w / 2) + '" cy="' + (h - 1.5) + '" r="1.3" class="alan-kare__bos"/>'
      : '<rect x="' + (i * (w + ara)) + '" y="' + (h - Math.max(2, v / enBuyuk * h)).toFixed(1) + '" width="' + w + '" height="' + Math.max(2, v / enBuyuk * h).toFixed(1) + '" rx="2" style="fill:' + renk + '"/>').join('');
    return '<svg class="alan-kare__sutun" viewBox="0 0 ' + (l.length * (w + ara) - ara) + ' ' + h + '" aria-hidden="true" preserveAspectRatio="none">' + bar + '</svg>';
  }
  function alanKarolari(){
    const ehs = ESP.Intellect.ehs(14);
    const kWhy = {};
    ehs.rows.forEach(r => { kWhy[r.disc.id] = r.kCert === 'missing' ? null : r.kWhy; });
    const kartlar = ESP.Mod.active().map((d, i) => {
      const son = pencereDk(d.id, 0, 14), once = pencereDk(d.id, 14, 14);
      const sonK = son.filter(v => v != null), onceK = once.filter(v => v != null);
      const top = sonK.reduce((a, b) => a + b, 0);
      const renk = RENK[i % RENK.length];
      const ic = discIcon(d.id);
      let fark = null;
      if(sonK.length >= ESIK_GUN && onceK.length >= ESIK_GUN){
        const a = top / sonK.length, b = onceK.reduce((x, y) => x + y, 0) / onceK.length;
        fark = { yuzde:b ? Math.round((a - b) / b * 100) : null, a, b };
      }
      const sonGun = (() => { for(let k = 0; k < 60; k++){ const t = U.iso(U.addDays(U.parse(U.todayISO()), -k)); if(M.minutesOf(t, d.id) != null) return t; } return null; })();
      return html`<button type="button" class="alan-kare" style="${'--alan:' + renk}" ${raw(ic.route ? 'data-act="go" data-route="' + ic.route + '"' : 'disabled')}>
        <span class="alan-kare__bas"><span class="alan-kare__simge">${raw(ESP.UI.icon(ic.icon))}</span><b>${d.short || d.label}</b>
          <small>${sonGun ? (sonGun === U.todayISO() ? 'bugün' : U.fmtShort ? U.fmtShort(sonGun) : sonGun) : 'kayıt yok'}</small></span>
        <span class="alan-kare__deger num">${sonK.length ? U.fmtMin(top) : '—'}<small>${sonK.length ? ' · ' + sonK.length + ' gün' : ' veri yok'}</small></span>
        ${raw(sutunlar(son, renk))}
        <span class="alan-kare__alt">
          ${when(fark && fark.yuzde != null, () => html`<span class="${'alan-kare__fark ' + (fark.yuzde > 0 ? 'is-art' : fark.yuzde < 0 ? 'is-az' : '')}">${(fark.yuzde > 0 ? '▲ ' : fark.yuzde < 0 ? '▼ ' : '') + '%' + Math.abs(fark.yuzde)} günlük ortalama, önceki 14 güne göre</span>`)}
          ${when(kWhy[d.id], () => html`<span class="alan-kare__kalite">${kWhy[d.id]}</span>`)}
        </span>
      </button>`;
    });
    return K.Kutu({ ad:'Alanların', yuva:'son 14 gün · kayıttan', govde:html`<div class="alan-izgara">${kartlar}</div>
      <p class="tiny muted mt-10">Sütunlar günlük dakikadır; nokta girilmemiş gündür (sıfır sayılmaz). Önceki 14 günle fark, iki pencerede de
        en az ${ESIK_GUN} kayıtlı gün varsa yazılır. Alt satır, alanın kalite ölçüsüdür (kural motoru).</p>` });
  }
  /* PANO KARTI (2026-10-20; brand/ortak/pano.js): son 5 haftanın günlük
     dakikası ısı haritasında; girilmemiş gün kesik kare (sıfır değil). */
  function isiHaritasi(){
    const P = (window.LIFEOS || {}).PANO;
    if(!P) return '';
    const bugun = U.parse(U.todayISO());
    const pzt = U.addDays(bugun, -((bugun.getDay() + 6) % 7) - 28);
    const gunler = []; for(let i = 0; i < 35; i++) gunler.push(U.iso(U.addDays(pzt, i)));
    const bugunISO = U.todayISO();
    const deger = gunler.map(d => d > bugunISO ? null : M.minutesOf(d));
    const kayitli = deger.filter(v => v != null).length;
    const enCok = Math.max(1, ...deger.filter(v => v != null));
    if(!kayitli) return P.kart({ tur:'isi', ad:'Son 5 hafta', simge:'takvim', bos:{ cumle:'Son beş haftada oturum yok.' } });
    return P.kart({ tur:'isi', ad:'Son 5 hafta', simge:'takvim', yuva:'günlük dakika · ' + kayitli + ' gün kayıtlı',
      govde:'<div class="pk-sutun__ad">' + ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(g => '<span>' + g + '</span>').join('') + '</div>'
        + P.kareler({ sutun:7, etiket:'Son beş haftanın günlük dakikası; ' + kayitli + ' gün kayıtlı',
            durumlar:gunler.map((d, i) => d > bugunISO ? 'bos' : deger[i] == null ? 'yok' : deger[i] <= 0 ? 0 : Math.max(1, Math.ceil(deger[i] / enCok * 3))) })
        + P.not('koyu: çok · açık: az · kesik: kayıt yok') });
  }
  /* PANO KARTLARI (2026-10-20, ikinci tur): verimli saatler, bu hafta ve
     geçen hafta, rekorlar, alanların son dokunuşu. Hepsi oturum kaydından. */
  function panoAnaliz(){
    const P = (window.LIFEOS || {}).PANO;
    if(!P) return '';
    const bugun = U.todayISO();
    const gun = i => U.iso(U.addDays(U.parse(bugun), -i));
    const oturumlar = [];
    for(let i = 0; i < 30; i++){ const d = gun(i); M.sessionsOf(d).forEach(s => oturumlar.push(Object.assign({ gun:d }, s))); }
    const dakikali = oturumlar.filter(s => s.minutes != null && s.minutesCert !== 'missing');
    /* Verimli saatler: oturumun kaydedildiği saat (at); saat bilinmeyen sayılmaz. */
    const saat = new Array(24).fill(null);
    dakikali.forEach(s => { const m = /T(\d{2}):/.exec(s.at || ''); if(!m) return; const h = Number(m[1]); saat[h] = (saat[h] || 0) + s.minutes; });
    const saatli = saat.filter(v => v != null).length;
    const enIyi = saat.reduce((m, v, i) => v != null && (m < 0 || v > saat[m]) ? i : m, -1);
    const saatKart = saatli >= 3
      ? P.kart({ tur:'saatler', ad:'Verimli saatler', simge:'saat', yuva:'son 30 gün',
          govde:P.deger(String(enIyi).padStart(2, '0') + ':00', '', 'en çok dakika bu saatte kaydedildi')
            + P.sutun({ degerler:saat.map(v => v == null ? null : v), yukseklik:48, etiket:'Günün saatlerine göre dakika; en çok ' + enIyi + ':00' })
            + '<div class="pk-saat__ad"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>'
            + P.not('saat: oturumun kaydedildiği an · kesik: o saatte kayıt yok') })
      : P.kart({ tur:'saatler', ad:'Verimli saatler', simge:'saat', bos:{ cumle:'Üç farklı saatte oturum olunca en verimli saatin çizilir.' } });
    /* Bu hafta / geçen hafta: disiplin başına dakika. */
    const pencere = (bas, n) => { const o = {}; for(let i = bas; i < bas + n; i++){ M.sessionsOf(gun(i)).forEach(s => { if(s.minutes == null || s.minutesCert === 'missing') return; o[s.disc] = (o[s.disc] || 0) + s.minutes; }); } return o; };
    const bu = pencere(0, 7), once = pencere(7, 7);
    const discler = ESP.Mod.active().filter(d => bu[d.id] || once[d.id]);
    const en = Math.max(1, ...discler.map(d => Math.max(bu[d.id] || 0, once[d.id] || 0)));
    const ikiHafta = discler.length
      ? P.kart({ tur:'iki-hafta', ad:'Bu hafta · geçen hafta', simge:'satir', yuva:U.fmtMin(Object.values(bu).reduce((a, b) => a + b, 0)) + ' · ' + U.fmtMin(Object.values(once).reduce((a, b) => a + b, 0)),
          govde:P.cubuklar({ satirlar:discler.map(d => ({ ad:d.short || d.label, oran:(bu[d.id] || 0) / en, plan:once[d.id] ? once[d.id] / en : null, metin:U.fmtMin(bu[d.id] || 0) })) })
            + P.not('çubuk: son 7 gün · siyah çizgi: önceki 7 gün') })
      : '';
    /* Rekorlar: en uzun gün, en çok oturumlu gün (bütün kayıt). */
    let enUzun = null, enCok = null;
    Object.keys(S.days || {}).forEach(d => {
      const m = M.minutesOf(d), n = M.sessionsOf(d).length;
      if(m != null && (!enUzun || m > enUzun.m)) enUzun = { d, m };
      if(n && (!enCok || n > enCok.n)) enCok = { d, n };
    });
    const rekor = enUzun
      ? P.kart({ tur:'rekor', ad:'Rekorların', yildiz:'rekor',
          govde:P.liste({ satirlar:[{ sol:U.fmtShort ? U.fmtShort(enUzun.d) : enUzun.d, ad:'En uzun gün', not:U.fmtMin(enUzun.m), nokta:0 },
            { sol:U.fmtShort ? U.fmtShort(enCok.d) : enCok.d, ad:'En çok oturum', not:enCok.n + ' oturum', nokta:1 },
            { sol:'', ad:'En uzun seri', not:M.streak() + ' gün (şu an)', nokta:2 }] }) })
      : '';
    /* Son dokunuş: her açık alanın son oturumundan bu yana geçen gün. */
    const son = ESP.Mod.active().map(d => {
      for(let i = 0; i < 90; i++){ if(M.minutesOf(gun(i), d.id) != null) return { d, g:i }; }
      return { d, g:null };
    });
    const dokunus = P.kart({ tur:'son-dokunus', ad:'Son dokunuş', simge:'takvim', yuva:'gün önce',
      govde:P.cubuklar({ satirlar:son.map(x => ({ ad:x.d.short || x.d.label, oran:x.g == null ? null : Math.min(1, x.g / 14), renk:x.g != null && x.g >= 7 ? 2 : 0,
        metin:x.g == null ? '90+ gün' : x.g === 0 ? 'bugün' : x.g + ' gün' })) })
        + P.not('uzun çubuk: uzun süredir açılmadı · 14 gün ve üstü dolu') });
    return '<div class="pk-izgara">' + [saatKart, ikiHafta, rekor, dokunus].filter(Boolean).join('') + '</div>';
  }
  function dengeCubugu(){
    const b = ESP.Planner.balance(7);
    if(b.cert === 'missing') return K.Kutu({ ad:'Haftanın dengesi', yuva:'son 7 gün', govde:html`<p class="small muted">Son yedi günde kayıt yok.</p>` });
    const act = ESP.Mod.active().map(d => d.id);
    const satir = b.rows.filter(r => r.share != null && r.share > 0);
    return K.Kutu({ ad:'Haftanın dengesi', yuva:'son 7 gün · süre payı', govde:html`
      <div class="denge-cubuk" role="img" aria-label="${satir.map(r => r.disc.label + ' %' + Math.round(r.share * 100)).join(', ')}">
        ${map(satir, r => html`<i style="${'width:' + (r.share * 100).toFixed(1) + '%;background:' + RENK[Math.max(0, act.indexOf(r.disc.id)) % RENK.length]}" title="${r.disc.label + ' · ' + U.fmtMin(r.minutes)}"></i>`)}
      </div>
      <div class="denge-lejant">${map(satir, r => html`<span><i style="${'background:' + RENK[Math.max(0, act.indexOf(r.disc.id)) % RENK.length]}"></i>${r.disc.short || r.disc.label} <b class="num">%${Math.round(r.share * 100)}</b></span>`)}</div>
      ${when(b.skewed, () => html`<p class="small muted mt-8">Pratik ${b.top.label} tarafına yığılmış; ${b.untouched.map(d => d.label).join(', ')} bu hafta açılmadı. Bu bir bulgudur, hata değil.</p>`)}` });
  }

  /* ANALİZ BAŞI (vitrin): 041 veri doluluğu, günlük dakika çizgisi (027,
     girilmemiş gün boşluk), 037 güvenli eğilim, 034 grafiğin cümlesi. */
  function analizBasi(){
    const G = (window.LIFEOS || {}).GRAFIK;
    if(!G) return '';
    const bugun = U.todayISO();
    const kayitli = Object.keys(S.days || {}).filter(t => ESP.Model.sessionsOf(t).length > 0);
    const son = [];
    for(let i = 27; i >= 0; i--){
      const t = G.gunEkle(bugun, -i);
      const r = ESP.Model.sessionsOf(t);
      son.push({ tarih:t, deger:r.length ? r.reduce((a, s) => a + (s.minutes || 0), 0) : null });
    }
    return html`<div class="analizbasi">
      ${K.Kutu({ ad:'Günlük pratik', yuva:'son 28 gün', govde:html`
        ${/* Metrik kartı (2026-10-18): ortalama, eğilim, doluluk ve eksenli çizgi. */''}
        ${raw(G.metrikHtml(son, { etiket:'Günlük pratik', birim:'dk', ondalik:0, yon:'artis-iyi' }))}
        <details class="hiz-ac"><summary>Veri doluluğu</summary>${raw(G.dolulukHtml([{ modul:'esp', ad:'ESP', gunler:kayitli }], { gun:7 }))}</details>` })}
      ${dengeCubugu()}
    </div>`;
  }

  /* YOL HARİTASI (kullanıcı, 2026-10-30: «istatistiklerde nöral ağ haritası;
     öğrendiğimiz konular hedefinde; yol haritası gibi»). Açık alanların
     merdiveni: basamak durumu ve yüzdesi müfredat motorundan (geçilmeyen
     kapı ilerleme sayılmaz). */
  function yolHaritasi(){
    const A = window.LIFEOS.AGHARITA;
    if(!A || !ESP.Curriculum || !ESP.Curriculum.roadmap) return '';
    const kumeler = ESP.Mod.active().map(d => {
      const y = ESP.Curriculum.roadmap(d.id);
      return { ad:d.short || d.label, dugumler:y ? y.steps.map(s => ({ ad:s.title, durum:s.state === 'done' ? 'bitti' : s.state === 'current' ? (s.pct > 0 ? 'suruyor' : 'sirada') : 'bekliyor',
        ilerleme:s.state === 'current' && s.pct > 0 ? s.pct / 100 : undefined })) : [] };
    });
    return html`<section class="kutu" aria-label="Yol haritası"><h2 class="kutu__ad">Yol haritası</h2>
      <p class="tiny dim">Her alanın merdiveni; geçilen basamak dolu, içinde olduğun basamak halka</p>
      ${raw(A.html({ merkez:'Gelişim', kumeler, bos:'Bir alan açınca merdiveni burada belirir.' }))}</section>`;
  }

  function render(){
    const acik = !!S.ui.analizAyrinti;
    /* KOLAY Faz 2 (2026-10-26): Bugün'ün karoları, pano ve dönen kartları,
       haftalık özeti ve bekleyen önerisi burada, en başta (today.analizOzeti). */
    return K.Grid(html`
      ${map(ESP.Screens.today.analizOzeti(), x => K.Span(12, raw(x)))}
      ${K.Span(12, alanKarolari())}
      ${K.Span(12, yolHaritasi())}
      ${K.Span(12, raw('<div class="pk-izgara pk-izgara--iki">' + isiHaritasi() + '</div>'))}
      ${K.Span(12, raw(panoAnaliz()))}
      ${K.Span(12, analizBasi())}
      ${K.Span(12, html`<div class="analiz-ayrinti">
        ${K.Button({ label:acik ? 'Ayrıntılı okumaları gizle' : 'Ayrıntılı okumalar: radar, seriler, rapor, dürüstlük, rubrik', size:'sm', tone:'ghost',
          act:'analiz-ayrinti', data:{ 'aria-expanded':acik ? 'true' : 'false' } })}</div>`)}
      ${when(acik, () => K.Span(12, ESP.Parts.bolumler(null, { act:'ana-tab', aria:'Analiz bölümleri', tabs:TABS, govde:GOVDE })))}`);
  }

  function afterRender(){ if(S.ui.analizAyrinti) ESP.Parts.bolumIstegi('analyticsTab', TABS[0].id); }

  const handle = {
    async 'analiz-ayrinti'(){ S.ui.analizAyrinti = !S.ui.analizAyrinti; ESP.App.render(); },
    async 'ana-tab'(el){ S.ui.analizAyrinti = true; K.bolumeGit(el.dataset.tab); },

    async 'gen-briefing'(){
      delete S.officeBriefings[U.todayISO()];
      await ESP.UI.withBusy('Brifing üretiliyor', null, async () => {
        await ESP.Office.dailyBriefing();
      });
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

  /* Öneri kartının düğmeleri Onaylar'ın işleyicilerine gider (tek yol). */
  ESP.Screens.today.onayEylemleri.forEach(a => { handle[a] = el => ESP.Screens.onaylar.handle[a](el); });

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
    async 'an-rub-disc'(el){ S.ui.anRubDisc = el.value; ESP.App.render(); },
  };

  return {
    id:'analytics',
    /* iPhone Faz 3: her bölümde açık yalnız işin kendisi; ikincil kartlar,
       dürüstlüğün meta kartları ve disiplin başına ayrışma kartları şerit. */
    get kucukVarsayilan(){
      const G = (window.LIFEOS || {}).Gizle;
      const bayrak = G && ESP.Goodhart ? ESP.Goodhart.flags().map(p => G.anahtar(p.effortLabel.toUpperCase())) : [];
      return ['denge', 'haftalık-rota', 'seri', 'çapraz-bulgular', 'günün-brifingi',
        'denetim-defteri', 'sürtünme', 'gösterge-ayrışması', 'derin-alan-analizleri', 'kademeli-geri-bildirim-ipuçları'].concat(bayrak);
    },
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
    render, afterRender, handle, change,
  };
})();
