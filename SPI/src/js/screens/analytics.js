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
    { id:'kavramlar', label:'Fizyoloji ve kavramlar', icon:'book' },
    { id:'denetim', label:'Denetim',      icon:'list' },
    { id:'durust', label:'Dürüstlük',      icon:'shield' },
  ];

  /* --------------------------------------------------------------- capraz */

  function crossCard(){
    const rows = SP.Calc.crossFindings(60);
    const strong = rows.filter(r => r.ok && !r.weak);
    return K.Card({
      hint:'not-capraz-baglar', title:'Çapraz bağlar',
      badge:K.Badge({ label:strong.length + ' belirgin bağ', tone:strong.length ? 'info' : 'muted' }),
      /* Sınır cümlesi görünür kalır, başlığın yanında tek satır; uzun
         açıklaması ⓘ'de (hints.js). */
      note:'Birlikte hareket etmek, sebep olmak demek değildir.',
      body:html`
        <div class="list">${map(rows, r => html`
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

  /* KİŞİSEL TAHMİN AĞI (core/tahmin.js): ruh hâli, senin verinden; dürüst sınama. */
  function modelCard(){
    if(!SP.Tahmin) return '';
    const m = SP.Tahmin.durum();
    if(!m.ok) return K.Card({ title:'Ruh hâli modeli', badge:K.Badge({ label:'öğreniyor', tone:'muted' }),
      body:K.Notice({ tone:'info', body:m.why + ' Bugün ekranındaki «Günün hissi»ni işaretledikçe öğrenir.' }) });
    const vg = x => String(x).replace('.', ',');
    return K.Card({
      title:'Ruh hâli modeli', sub:m.n + ' gün · ' + m.ozellikSayisi + ' özellik · ' + m.parametre + ' parametre · ' + (m.kaynaklar || ['SPİ']).join(' + '),
      badge:K.Badge({ label:m.iyi ? 'tabandan %' + m.kazanc + ' iyi' : 'henüz tabanı geçmedi', tone:m.iyi ? 'ok' : 'muted' }),
      body:html`
        ${when(m.iyi && m.bugun != null, () => K.Stat({ label:'Bugün için tahmin', value:vg(m.bugun) + ' / 5', note:'tahmin · ölçüm değil' }))}
        <p class="tiny dim mt-8">Son ${m.sinav} günde ortalama hata ${vg(m.maeModel)}; «her gün ortanca his» diyen taban ${vg(m.maeTaban)}.
          ${m.iyi ? '' : ' Model tabandan en az %10 iyi olmadan tahmin göstermez.'}</p>
        ${when(m.onem.length, () => html`<div class="list mt-8">${map(m.onem.slice(0, 4), x => html`
          <div class="listitem"><div class="grow"><b class="small">${x.ad}</b>
            <div class="tiny dim">${x.yon > 0 ? 'arttıkça hissin yükseliyor' : x.yon < 0 ? 'arttıkça hissin düşüyor' : 'yönü belirsiz'} · birliktelik, neden değil</div></div>
            ${P.cert('estimated')}</div>`)}</div>`)}
        ${when(m.iyi && (m.neDegisirse || []).length, () => html`<p class="small mt-12"><b>Tipik bir günde</b></p>
          <div class="list">${map(m.neDegisirse, x => html`<div class="listitem"><div class="grow"><span class="small">${x.ad}</span></div>
            <span class="num small is-up">+${vg(x.fark)}</span>${P.cert('estimated')}</div>`)}</div>
          <p class="tiny dim mt-4">Modelin tahmini; birliktelikten öğrenildi, neden değildir.</p>`)}`,
    });
  }

  function pairCard(){
    const a = S.ui.pairA || 'sleep';
    const b = S.ui.pairB || 'hrv';
    /* Analiz denetimi (2026-10-17): varsayılan çift uyku × toparlanmaydı;
       toparlanma uykudan hesaplandığı için «güçlü» çıkması kaçınılmazdı. */
    const turev = SP.Calc.turetilmis(a, b);
    const pairs = SP.Calc.pairsFor(a, b, 90);
    const c = SP.Calc.correlate(pairs);
    const opts = Object.keys(SP.Calc.SERIES).map(id => ({ value:id, label:seriesLabel(id) }));

    return K.Card({
      hint:'not-kendi-bagini-kur', title:'Kendi bağını kur',
      body:html`
        <div class="cols-2">
          ${K.Field({ label:'Birinci ölçüm', input:K.Select({ value:a, change:'pair-a', options:opts }) })}
          ${K.Field({ label:'İkinci ölçüm', input:K.Select({ value:b, change:'pair-b', options:opts }) })}
        </div>
        <div class="mt-12">
          ${when(turev, () => K.Notice({ tone:'info',
            body:'Toparlanma skoru uyku, HRV ve istirahat nabzından hesaplanır; bu ikisinin bağı hesabın kendisidir, bulgu değil.' }))}
          ${when(c.ok && !turev, () => html`
            ${K.Stat({ label:'Katsayı', value:U.fmtNet(c.r),
              note:c.n + ' ortak gün · ' + (!c.belirgin ? 'rastlantı düzeyinde (|r| ≥ ' + U.fmtNet(c.esik) + ' gerekir)'
                : c.strength >= 0.6 ? 'güçlü' : 'orta') })}
            ${raw(UI.lineChart([
              { data:pairs.map(p => p[0]) },
              { data:pairs.map(p => p[1]), accent:true },
            ], { height:170, area:false }))}
            ${raw(UI.legend([{ label:seriesLabel(a), color:'var(--primary)' },
              { label:seriesLabel(b), color:'var(--accent)' }]))}`)}
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
      body:html`<div class="rapor-govde">
        <!-- Kapak görseli kalktı (SADE, 2026-10-05): rapor başlığı ve sayılarıyla başlar. -->
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
            rows:r.gaps.map(g => [g.nutrient ? g.nutrient.name : g.id, '%' + g.pct]) })}</div>`)}
      </div>`,
      foot:K.Button({ label:'İncelemede gör', size:'sm', act:'go', data:{ 'data-route':'meeting' } }),
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
      actions:K.Select({ value:id, change:'pick-series', aria:'Serisi gösterilecek ölçüm',
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


  /* ------------------------------------------------------------ dürüstlük

     Bu sekme sistemin KENDİSİNİ ölçer. Üç soru sorar:

       Sürtünme      Takip, sağlıklı yaşamanın yerine mi geçiyor?
       Ayrışma       Bir gösterge, temsil ettiği şeyden koptu mu?
       Kalibrasyon   Cihaz yokken kendi bedenini okuyabiliyor musun?

     Üçü de kötü çıkabilir; bu bir arıza değil, ölçüldüğü için görünür
     olmasıdır. İlk kart sayfanın KENDİ gerekliliğini raporlar. */

  function signalLedgerCard(){
    const e = SP.Signals.efficacy();
    const h = SP.Signals.screenVerdict();
    const acik = SP.Signals.current();
    const kapali = SP.Signals.closed().slice(-8).reverse();

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
          headers:['Kapanan sinyal', { label:'Adet', num:true }, { label:'Ayrışma kapandı', num:true }],
          rows:[
            ['Cevaplananlar', String(e.answeredClosed),
              e.answeredRate == null ? '—' : '%' + e.answeredRate],
            ['Cevaplanmayanlar', String(e.unansweredClosed),
              e.unansweredRate == null ? '—' : '%' + e.unansweredRate],
          ] }))}
        <p class="tiny dim mt-8">${e.note}</p>
        ${when(kapali.length, () => K.Table({ tight:true,
          headers:['Soru', 'Cevap', 'Sonuç'],
          rows:kapali.map(sg => [sg.title, sg.answer ? sg.answer.slice(0, 60) : '—',
            sg.outcome === 'realigned' ? 'ayrışma kapandı'
              : sg.outcome === 'still-decoupled' ? 'sürüyor'
              : sg.outcome === 'dismissed' ? 'geçersiz bulundu' : 'ölçülemedi']) }))}`,
    });
  }

  function frictionCard(){
    const f = SP.Friction.verdict();
    const rahat = SP.Friction.relief();
    return K.Entry({
      label:'Sürtünme', hint:'friction',
      meta:f.cert === 'missing' ? 'veri yok' : f.window.perDay + ' dk/gün',
      wide:true,
      body:html`
        ${K.Notice({ tone:f.level === 'high' ? 'warn' : 'info',
          title:f.title, body:f.note })}
        ${when(f.cert === 'measured' && f.window.trainingDays, () => html`
          <p class="tiny dim mt-8">Antrenman yapılan ${f.window.trainingDays} günde
            takip payı %${Math.round((f.window.trainingRatio || 0) * 100)} —
            yalnızca antrenman süresine göre.</p>`)}
        ${when(rahat.length, () => html`<div class="mt-12">
          ${map(rahat, r => html`<div class="mt-8">${K.Notice({ tone:'info',
            body:r.label + ' — ' + r.note })}</div>`)}</div>`)}`,
    });
  }

  function goodhartCard(){
    const cifts = SP.Goodhart.scan();
    const ayrisan = cifts.filter(p => p.status === 'decoupled');
    return K.Entry({
      label:'Gösterge ayrışması', hint:'goodhart',
      meta:ayrisan.length ? ayrisan.length + ' ayrışma' : 'temiz',
      wide:true,
      body:html`
        ${K.Table({ tight:true, headers:['Çift', 'Yön', 'Çaba', 'Sonuç', 'Durum'],
          rows:cifts.map(p => [
            p.effortLabel + ' → ' + p.outcomeLabel,
            (SP.Goodhart.DIRECTIONS[p.direction] || {}).label || 'tanımsız',
            p.effortChange == null ? '—'
              : (p.effortChange === Infinity ? 'yeni' : '%' + Math.round(p.effortChange * 100)),
            p.outcomeChange == null ? '—'
              : (p.outcomeChange === Infinity ? 'yeni' : '%' + Math.round(p.outcomeChange * 100)),
            p.status === 'decoupled' ? 'ayrıştı'
              : p.status === 'aligned' ? 'birlikte'
              : p.status === 'unknown' ? 'ölçülmedi' : 'sessiz',
          ]) })}
        <p class="tiny dim mt-8">«Yön» sütunu sonucun hangi tarafa gitmesinin
          iyi sayıldığını söyler. Yönü tanımsız bir çift değerlendirilmez:
          sistem yüksek olanın iyi olduğunu VARSAYMAZ.</p>
        ${(function(){
          const pol = SP.Goodhart.policy();
          /* T2-14: asgari çaba tek sayı değildir; her çiftin kendi eşiği var
             (gün, dakika, ölçüm). Politikada tek bir değer yoktu ve ekranda
             «asgari çaba dk.» boş kalıyordu; uydurulmaz. */
          return html`<div class="mt-8">${K.Ayrinti({
            ozet:'Pencere ' + pol.windowDays + ' gün · çaba artışı eşiği %'
              + Math.round(pol.effortRiseThreshold * 100) + ' · sonuç durgunluk eşiği %'
              + Math.round(pol.stagnationThreshold * 100) + '.',
            govde:html`<p>Asgari çaba her çift için ayrıdır. Bu sayılar bir bulgu değil bu
              yazılımın ayarıdır: ${pol.rationale}</p>` })}</div>`;
        })()}
        ${map(ayrisan, p => html`<div class="mt-12">
          ${K.Notice({ tone:'warn', body:p.note })}
          ${K.Notice({ tone:'info', body:p.question })}</div>`)}`,
    });
  }

  function calibCard(){
    const puan = SP.Calib.score();
    const vade = SP.Calib.due();
    return K.Entry({
      label:'Kalibrasyon', hint:'calib',
      meta:puan.cert === 'missing' ? puan.n + '/' + SP.Calib.ASGARI + ' tahmin'
        : (puan.grade || '—'),
      wide:true,
      body:html`
        ${K.Ayrinti({ govde:html`<p>Her sayıyı cihazdan bekleyen biri, cihaz yokken kendini
          okuyamaz. Ölçülen şey dardır — kayıtlı türlerde tahminin sayıya ne kadar yaklaştığı;
          «kendini tanıma» değil. Bu bir sağlık yargısı da değildir.</p>` })}
        ${K.Notice({ tone:'info', body:puan.note })}
        ${when(puan.bias.cert === 'measured', () => K.Notice({ tone:'info',
          title:'Yanlılık', body:puan.bias.note }))}
        <div class="mt-12">
          ${K.Field({ label:'Ne tahmin ediyorsun?',
            input:K.Select({ id:'sp-calib-kind', value:S.ui.calibKind || 'weight',
              change:'calib-kind', aria:'Tahmin türü',
              options:SP.CALIB_KINDS.map(k => ({ value:k.id, label:k.label })) }) })}
          ${(function(){
            const k = SP.Calib.kindOf(S.ui.calibKind || 'weight');
            return html`<p class="tiny dim">${k.ask}</p>
              ${K.Field({ label:k.type === 'binary' ? 'Olasılık (0–1)' : 'Tahminin'
                  + (k.unit ? ' (' + k.unit + ')' : ''),
                input:K.Input({ id:'sp-calib-guess', type:'number', step:'any' }) })}`;
          })()}
          ${K.Button({ label:'Tahmini kaydet', tone:'primary', act:'calib-open' })}
        </div>
        ${when(vade.length, () => html`<div class="mt-12">
          ${map(vade, fo => html`<div class="mt-8">
            ${K.Field({ label:(SP.Calib.kindOf(fo.kind) || {}).label
                + ' — tahminin: ' + U.fmtNum(fo.guess),
              input:K.Input({ id:'sp-calib-actual-' + fo.id, type:'number', step:'any' }) })}
            ${K.Button({ label:'Kapat', size:'sm', act:'calib-settle',
              data:{ 'data-id':fo.id } })}</div>`)}</div>`)}
        ${when(SP.Calib.settled().length, () => K.Table({ tight:true,
          headers:['Tür', { label:'Tahmin', num:true }, { label:'Gerçek', num:true },
            { label:'Sapma', num:true }],
          rows:SP.Calib.settled().slice(0, 10).map(fo => {
            const h = SP.Calib.error(fo);
            return [(SP.Calib.kindOf(fo.kind) || {}).label || fo.kind,
              U.fmtNum(fo.guess), U.fmtNum(fo.actual),
              h == null ? '—' : (h.type === 'brier' ? h.value.toFixed(2)
                : '%' + Math.round(h.value * 100))];
          }) }))}`,
    });
  }


  /* ------------------------------------------------------------ denetim

     Bes alanda birikmis bakim borcu. SPI'ye ozgu ek kural: DENETIM
     TESHIS KOYMAZ. Bir bulgu asla "su degerin tehlikeli" demez;
     soyleyebilecegi tek sey KAYDIN durumudur. */
  function denetimCard(){
    const hepsi = SP.Audit.all();
    const ciddi = hepsi.filter(f => f.severity !== 'none');
    return K.Entry({
      label:'Bakım borcu', hint:'audit',
      meta:ciddi.length ? ciddi.length + ' bulgu' : 'temiz',
      note:'Bu denetim teşhis koymaz: bir değerin ne anlama geldiği '
         + 'hekimin işidir. Söylediği tek şey kaydın durumudur — tahlil '
         + 'eskimiş, ölçüm girilmemiş, bayrak açık kalmış.',
      wide:true,
      body:html`
        ${when(!ciddi.length, () => K.Notice({ tone:'ok',
          body:'Beş alanda da bakım borcu görünmüyor. Veri eşiğin '
             + 'altındaysa bu «temiz» değil «ölçülmedi» demektir.' }))}
        ${map(SP.Audit.AREAS, a => {
          const bulgular = SP.Audit.of(a.id);
          if(!bulgular.length) return '';
          return html`<div class="mt-16">
            ${K.SectionTitle(a.label)}
            ${map(bulgular, f => html`
              <div class="mt-8">
                ${K.Notice({ tone:f.severity === 'warn' ? 'warn' : 'info',
                  title:f.title, body:f.note })}
                ${when((f.items || []).length, () => K.Table({ tight:true,
                  headers:['Kayıt', 'Durum'],
                  rows:f.items.map(x => [x.label, x.meta || '—']) }))}
                ${when(f.route, () => K.Button({ label:'Aç', size:'sm', act:'go',
                  data:{ 'data-route':f.route }, class:'mt-8' }))}
              </div>`)}
          </div>`;
        })}`,
    });
  }

  function derinAnalizCard(){
    const list = SP.DERIN_ANALIZLER || [];
    return K.Card({
      title:'Derin fizyoloji analizleri',
      sub:'Yük, adaptasyon ve toparlanma mekanizmaları',
      badge:K.Badge({ label:list.length + ' analiz', tone:'info' }),
      body:html`<div class="stack-sm">${map(list, a => html`
        <div class="ogrenme">
          <div class="row between gap-8 mb-4">
            <b class="small" style="color:var(--text)">${U.esc(a.title)}</b>
            <span class="tiny dim">${a.category || 'Fizyoloji'}</span>
          </div>
          <p class="small mb-6" style="line-height:1.45">${U.esc(a.summary || '')}</p>
          ${when(a.key_points && a.key_points.length, () => html`
            <ul class="tiny dim pl-14 mb-0" style="line-height:1.4">
              ${map(a.key_points, p => html`<li>${U.esc(p)}</li>`)}
            </ul>`)}
        </div>`)}</div>`,
    });
  }

  function kavramlarCard(){
    const tab = S.ui.anKavramTab || 'all';
    let list = SP.OGRENME_KAVRAMLAR || [];
    if(tab !== 'all') list = list.filter(c => c.content_depth === tab);
    const filterTabs = [
      { id:'all', label:'Tümü (' + (SP.OGRENME_KAVRAMLAR || []).length + ')' },
      { id:'basit', label:'Temel' },
      { id:'orta', label:'Orta' },
      { id:'ileri', label:'İleri' },
    ];
    return K.Card({
      title:'Sağlık ve egzersiz kavramları',
      sub:'30 temel fizyoloji, antrenman ve kayıt kavramı',
      body:html`
        <div class="row wrap gap-6 mb-12">
          ${map(filterTabs, t => K.Chip({ label:t.label, act:'an-kavram-tab', on:t.id === tab,
            data:{ 'data-tab':t.id } }))}
        </div>
        <div class="ogrenme-liste ogrenme-liste--kaydir" data-notum-kaynak="kavramlar">
          ${map(list, c => html`
            <div class="ogrenme">
              <div class="row between gap-6 mb-2">
                <b class="small">${U.esc(c.title)}</b>
                <span class="ogrenme__etiket">${({ basit:'Temel', orta:'Orta', ileri:'İleri' })[c.content_depth] || c.content_depth}</span>
              </div>
              <p class="small mb-4" style="line-height:1.4">${U.esc(c.definition)}</p>
              ${when(c.watch, () => html`<p class="tiny dim mb-0"><b>Dikkat:</b> ${U.esc(c.watch)}</p>`)}
            </div>`)}
        </div>
        ${raw(window.LIFEOS && window.LIFEOS.NOTUM ? window.LIFEOS.NOTUM.kutuHtml('kavramlar', { baslik:'Kavram notlarım',
          ipucu:'Kendi cümlelerinle yaz. Yukarıda bir tanımı seçip «Nota ekle»ye basarak da ekleyebilirsin.' }) : '')}`,
    });
  }

  function kanitCard(){
    const list = SP.KANIT_KARTLARI || [];
    return K.Card({
      title:'Bilimsel kanıt ve kaynak kartları',
      sub:'ACSM, NSCA, WHO ve CDC araştırma dayanakları',
      body:html`<div class="stack-xs" style="max-height:300px;overflow-y:auto">${map(list, k => html`
        <div class="ogrenme">
          <div class="row between gap-6 mb-2">
            <b class="small">${U.esc(k.title)}</b>
            <span class="tiny dim">${k.source || 'Araştırma'}</span>
          </div>
          <p class="small mb-0" style="line-height:1.4">${U.esc(k.summary || k.evidence || '')}</p>
        </div>`)}</div>`,
    });
  }

  /* Sekme yok (EKIP-PLANI §1.2): beş okuma alt alta durur, üstteki bölüm
     çubuğu sayfa içinde o okumaya kaydırır. Bir bölüm çizilemezse yalnız o
     bölüm sakin bir notla düşer; öteki dördü durur. */
  const BODIES = {
    capraz:() => html`${K.Ledger(() => [modelCard(), crossCard(), pairCard()])}
      <div class="mt-24">${raw(UI.rail(['correlation', 'trend', 'certainty']))}</div>`,
    hafta:() => html`${K.Ledger(() => [reportCard(), disciplineCard(),
        K.Entry({ label:'Raporun mantığı', meta:'sayı nereden gelir',
          note:'Sayılar kural motorundan gelir; Patron ajan yalnızca cümleye çevirir. '
            + 'Çelişki varsa öncelik sırası uygulanır ve hangi kuralın kazandığı yazılır.',
          body:K.Table({ tight:true, headers:['Sıra', 'Kural'],
            rows:SP.PRECEDENCE.map(p => [String(p.rank), p.label]) }) }),
      ])}
      <div class="mt-24">${raw(UI.rail(['grounding', 'decision', 'minimum-day']))}</div>`,
    seri:() => html`${K.Ledger(() => [seriesCard()])}
      <div class="mt-24">${raw(UI.rail(['trend', 'ref-range', 'certainty']))}</div>`,
    kavramlar:() => html`${K.Ledger(() => [derinAnalizCard(), kavramlarCard(), kanitCard()])}`,
    denetim:() => html`${K.Ledger(() => [denetimCard()])}
      <div class="mt-24">${raw(UI.rail(['audit', 'certainty', 'red-flag']))}</div>`,
    durust:() => html`${K.Ledger(() => [signalLedgerCard(), frictionCard(), goodhartCard(), calibCard()])}
      <div class="mt-24">${raw(UI.rail(['signal', 'friction', 'goodhart', 'calib']))}</div>`,
  };

  function govde(t){
    try{ return BODIES[t.id](); }
    catch(e){
      console.error('Analiz bölümü çizilemedi (' + t.id + '):', e);
      return K.Notice({ tone:'warn', body:'Bu okuma şu an çizilemedi; verin yerinde duruyor.' });
    }
  }

  /* ÖZET (2026-10-20, kullanıcı: «uyku en üstte kalmış, alttaki kategoriye
     taşınsın; önemli şeyler öne çıksın, önemsiz ya da anlaşılmaz olanlar
     azaltılsın; grafik ve tablolarla göze hitap etsin»). Üstte dört karo:
     son 7 günün değeri (kayıttan, etiketiyle), 14 günlük mini sütunlar
     (girilmemiş gün nokta, sıfır değil). Altında bugünün enerji dengesi:
     ihtiyaç (BMR + girilen hareket) ve alınan. Uyku ayrıntısı «Kategoriler»
     bölümünde; denetim ve dürüstlük okumaları «Ayrıntılı okumalar»da. */
  const gunListesi = n => { const out = []; for(let i = n - 1; i >= 0; i--) out.push(U.iso(U.addDays(U.today(), -i))); return out; };
  function miniSutun(l, renk){
    const enBuyuk = Math.max(1e-9, ...l.filter(v => v != null));
    const w = 6, ara = 3, h = 30;
    const g = l.map((v, i) => v == null
      ? '<circle cx="' + (i * (w + ara) + w / 2) + '" cy="' + (h - 1.5) + '" r="1.3" class="ozet-kare__bos"/>'
      : '<rect x="' + (i * (w + ara)) + '" y="' + (h - Math.max(2, v / enBuyuk * h)).toFixed(1) + '" width="' + w + '" height="' + Math.max(2, v / enBuyuk * h).toFixed(1) + '" rx="2" style="fill:' + renk + '"/>').join('');
    return '<svg class="ozet-kare__sutun" viewBox="0 0 ' + (l.length * (w + ara) - ara) + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' + g + '</svg>';
  }
  function ozetKaresi(o){
    const yedi = o.seri.slice(-7).filter(v => v != null);
    const deger = yedi.length ? o.ozet(yedi) : null;
    return html`<button type="button" class="ozet-kare" style="${'--renk:' + o.renk}" data-act="go" data-route="${o.rota}">
      <span class="ozet-kare__ad">${o.ad}</span>
      <span class="ozet-kare__deger num">${deger == null ? '—' : deger}<small>${deger == null ? ' veri yok' : ' ' + o.birim}</small></span>
      ${raw(miniSutun(o.seri, o.renk))}
      <span class="ozet-kare__not">${yedi.length ? o.not + ' · ' + yedi.length + '/7 gün kayıtlı' : 'Son 7 günde kayıt yok'}</span>
    </button>`;
  }
  function ozetHtml(){
    const g14 = gunListesi(14);
    const ort = l => (Math.round(U.sum(l) / l.length * 10) / 10).toLocaleString('tr-TR', { maximumFractionDigits:1 });
    const uyku = g14.map(t => { const v = S.vitals[t]; return v && v.sleep != null ? Number(v.sleep) : null; });
    const top = g14.map(t => { const r = SP.Move.readiness(t); return r.ok ? r.score : null; });
    const hareket = g14.map(t => { const l = SP.Model.workoutsOf(t); return l.length ? U.sum(l.map(w => Number(w.minutes) || 0)) : null; });
    const tg = SP.Nutri.targets();
    const protein = g14.map(t => { const d = SP.Nutri.dayTotals(t); return d.empty ? null : Math.round(d.protein); });
    const kareler = [
      ozetKaresi({ ad:'Gece uykusu', seri:uyku, birim:'sa', ozet:ort, not:'7 günün ortalaması', renk:'var(--mer)', rota:'today' }),
      ozetKaresi({ ad:'Toparlanma', seri:top, birim:'/100', ozet:l => String(Math.round(U.sum(l) / l.length)), not:'hesaplandı, ortalama', renk:'var(--spi)', rota:'move' }),
      ozetKaresi({ ad:'Hareket', seri:hareket, birim:'dk', ozet:l => U.fmtNum(U.sum(l)), not:'7 günün toplamı', renk:'var(--esp)', rota:'move' }),
      ozetKaresi({ ad:'Protein', seri:protein, birim:'g/gün', ozet:l => String(Math.round(U.sum(l) / l.length)),
        not:tg.ok ? 'hedef en az ' + tg.protein.min + ' g' : 'hedef için profil eksik', renk:'var(--ays)', rota:'meals' }),
    ];
    /* Bugünün enerji dengesi: ihtiyaç hesaplandı, alınan girilen öğünden. */
    const d = SP.Nutri.dayTotals(U.todayISO());
    let enerji = '';
    if(tg.ok){
      const enCok = Math.max(tg.tdee, tg.kcal, d.empty ? 0 : d.kcal) || 1;
      const cubuk = (ad, v, cls_, not) => html`<div class="enerji-satir"><span>${ad}</span>
        <span class="enerji-satir__iz"><i class="${cls_}" style="${'width:' + (v == null ? 0 : Math.round(100 * v / enCok)) + '%'}"></i></span>
        <b class="num">${v == null ? '—' : U.fmtNum(Math.round(v)) + ' kcal'}</b><small>${not}</small></div>`;
      enerji = K.Kutu({ ad:'Bugünün enerjisi', yuva:'günden güne değişir', govde:html`
        ${cubuk('İhtiyaç', tg.tdee, 'is-ihtiyac', tg.need && !tg.need.hareketYok ? 'bazal ' + U.fmtNum(tg.bmr) + ' + hareket ' + U.fmtNum(tg.need.hareket) : 'bazal; hareket girilmedi')}
        ${cubuk('Hedef', tg.kcal, 'is-hedef', tg.goal ? tg.goal.label.toLocaleLowerCase('tr-TR') : '')}
        ${cubuk('Alınan', d.empty ? null : d.kcal, 'is-alinan', d.empty ? 'öğün girilmedi · veri yok' : 'girilen öğünlerden')}` });
    }
    return html`<div class="ozet-izgara">${kareler}</div>${enerji ? html`<div class="mt-16">${enerji}</div>` : ''}`;
  }

  /* KATEGORİLER: uyku (eski üst kart) ve vücut ölçümleri burada, altta. */
  function kategorilerHtml(){
    return html`<div class="analizbasi">${uykuKutusu()}${kiloKutusu()}</div>${raw(panoKategoriler())}`;
  }
  /* PANO KARTLARI (2026-10-20): uyku düzenliliği (son 14 gecenin sapması),
     dinlenik nabız ve HRV (son 14 gün). Ölçüm yoksa kart yok. */
  function panoKategoriler(){
    const P = (window.LIFEOS || {}).PANO;
    if(!P) return '';
    const g14 = gunListesi(14);
    const al = k => g14.map(t => { const v = S.vitals[t]; return v && v[k] != null && isFinite(Number(v[k])) ? Number(v[k]) : null; });
    const uyku = al('sleep'), rhr = al('rhr'), hrv = al('hrv');
    const kartlar = [];
    const dolu = uyku.filter(v => v != null);
    if(dolu.length >= 4){
      const ort = dolu.reduce((a, b) => a + b, 0) / dolu.length;
      const sap = Math.sqrt(dolu.reduce((a, b) => a + (b - ort) * (b - ort), 0) / dolu.length);
      kartlar.push(P.kart({ tur:'uyku-duzen', ad:'Uyku düzenliliği', simge:'uyku', yuva:dolu.length + ' gece',
        govde:P.deger('±' + U.fmtNet(U.round(sap, 1)), 'sa', 'ortalama ' + U.fmtNet(U.round(ort, 1)) + ' sa · küçük sapma: düzenli')
          + P.sutun({ degerler:uyku, yukseklik:40, etiket:'Son 14 gecenin uykusu' }) }));
    }
    const izKart = (l, ad, birim, not) => {
      const d = l.filter(v => v != null);
      if(d.length < 3) return '';
      return P.kart({ tur:'iz-' + birim, ad, simge:'kalp', yuva:d.length + ' gün · ölçüldü',
        govde:P.deger(String(Math.round(d[d.length - 1])), birim, not + ' · 14 günün ortalaması ' + Math.round(d.reduce((a, b) => a + b, 0) / d.length))
          + P.sutun({ degerler:l, yukseklik:40, etiket:ad + ', son 14 gün' }) });
    };
    kartlar.push(izKart(rhr, 'Dinlenik nabız', 'atım/dk', 'son ölçüm'), izKart(hrv, 'HRV', 'ms', 'son ölçüm'));
    /* Kısa uykular: son 14 günün gündüz uykusu dakikası (core/uyku.js). */
    if(SP.Uyku){
      const kd = g14.map(t => { const l = SP.Uyku.liste(t); return l.length ? l.reduce((a, k) => a + (Number(k.dk) || 0), 0) : null; });
      const n = kd.filter(v => v != null).length;
      if(n) kartlar.push(P.kart({ tur:'kisa-uyku', ad:'Kısa uykular', simge:'uyku', yuva:n + ' gün',
        govde:P.deger(String(Math.round(kd.filter(v => v != null).reduce((a, b) => a + b, 0) / n)), 'dk', 'kısa uyku olan günlerin ortalaması')
          + P.sutun({ degerler:kd, yukseklik:40, etiket:'Son 14 günün kısa uykuları; ' + n + ' gün' }) + P.not('kesik: o gün kısa uyku yok') }));
    }
    const l = kartlar.filter(Boolean);
    return l.length ? '<div class="mt-16">' + P.izgara(l) + '</div>' : '';
  }
  function kiloKutusu(){
    const G = (window.LIFEOS || {}).GRAFIK;
    if(!G) return '';
    const son = gunListesi(28).map(t => { const v = S.vitals[t]; return { tarih:t, deger:v && v.weight != null ? Number(v.weight) : null }; });
    return K.Kutu({ ad:'Kilo', yuva:'son 28 gün', govde:raw(G.metrikHtml(son, { etiket:'Kilo', birim:'kg', ondalik:1, yon:'notr' })) });
  }

  /* ANALİZ BAŞI (vitrin): 041 veri doluluğu · uyku kartı: 027 kopuk çizgi,
     031 hedef bandı (yalnız profilde hedef yazılıysa; uydurulmaz), 032
     geçen dönem (bir dokunuşla), 036 dağılım, 037 güvenli eğilim, 034
     grafiğin cümlesi. SPİ teşhis koymaz: bant bir hedef, sınır değil. */
  function uykuKutusu(){
    const G = (window.LIFEOS || {}).GRAFIK;
    if(!G) return '';
    const bugun = U.todayISO();
    const gunler = n => { const out = []; for(let i = n - 1; i >= 0; i--) out.push(G.gunEkle(bugun, -i)); return out; };
    const olcumlu = Object.keys(S.vitals || {}).filter(t => {
      const v = S.vitals[t];
      return v && ['sleep', 'weight', 'rhr', 'hrv', 'energy'].some(k => v[k] != null);
    });
    const uyku = t => { const v = S.vitals[t]; return v && v.sleep != null ? Number(v.sleep) : null; };
    const son = gunler(28).map(t => ({ tarih:t, deger:uyku(t) }));
    const once = gunler(56).slice(0, 28).map(t => ({ tarih:t, deger:uyku(t) }));
    const hedef = S.profile && Number(S.profile.sleepGoal);
    const bant = hedef ? [Math.max(0, hedef - 0.5), hedef + 0.5] : null;
    const cizgi = o => raw(G.cizgiSvg(son, Object.assign({ gen:560, yuk:120, etiket:'Uyku', birim:'saat' }, o)));
    return html`${K.Kutu({ ad:'Uyku', yuva:'son 28 gün', govde:html`
        ${/* Metrik kartı (2026-10-18): ortalama, eğilim, doluluk ve eksenli çizgi. */''}
        ${raw(G.metrikHtml(son, { etiket:'Uyku', birim:'saat', ondalik:1, yon:'artis-iyi', bant }))}
        <details class="hiz-ac"><summary>Geçen dönemle karşılaştır</summary>${cizgi({ onceki:once, bant })}</details>
        <details class="hiz-ac"><summary>Dağılım</summary>${raw(G.dagilimSvg({ degerler:son.map(x => x.deger), birim:'saat', etiket:'Uyku' }))}</details>
        ${raw(uykuDuzeniHtml(gunler(14)))}
        <details class="hiz-ac"><summary>Veri doluluğu</summary>${raw(G.dolulukHtml([{ modul:'spi', ad:'SPİ', gunler:olcumlu }], { gun:7 }))}</details>` })}`;
  }

  /* 083 UYKU DÜZENİ: iki haftanın yatış ve kalkış saati. Saat YALNIZ
     telefonun uyku kaydından gelir (core/saglikice.js); elle girilen süre
     saate çevrilmez. Üç geceden azsa kart yok. */
  function uykuDuzeniHtml(gunler){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V || !V.uykuDuzeni) return '';
    const geceler = gunler.map(t => { const v = S.vitals[t] || {};
      return { ad:t, yatis:v.yatis != null ? Number(v.yatis) : null, kalkis:v.kalkis != null ? Number(v.kalkis) : null }; });
    const h = V.uykuDuzeni({ geceler });
    return h ? '<details class="hiz-ac"><summary>Yatış ve kalkış saatleri</summary>' + h + '</details>' : '';
  }

  /* Öne çıkan dört okuma görünür (denetim klinik sınırı taşır, AGENTS §1.5);
     kavram ve dürüstlük okumaları isteyene açılır (anlaşılması emek
     isteyen, her gün bakılmayan şeyler). */
  const ONDE = ['capraz', 'hafta', 'seri', 'denetim'];
  async function render(){
    const acik = !!S.ui.spiAnalizAyrinti;
    const bolumler = TABS.filter(t => acik || ONDE.indexOf(t.id) >= 0).map(t => ({ id:t.id, ad:t.label, govde:govde(t) }));
    /* Başta bugünün özeti (KOLAY-PLANI Faz 2): Bugün'den taşınan karolar,
       pano kartları, Durum ve Öneri (screens/today.js ozet). */
    const bugun = SP.Screens.today && SP.Screens.today.ozet ? SP.Screens.today.ozet() : '';
    return String(html`${raw(bugun)}${K.Kutu({ ad:'Bu hafta', yuva:'kayıttan · son 7 gün', govde:ozetHtml() })}
      <div class="mt-16">${K.SayfaBolumleri({ act:'an-tab', aria:'Analiz bölümleri', bolumler })}</div>
      <h2 class="analiz-ara-baslik">Kategoriler</h2>
      ${kategorilerHtml()}
      <div class="analiz-ayrinti">${K.Button({ label:acik ? 'Ayrıntılı okumaları gizle' : 'Ayrıntılı okumalar: kavramlar ve dürüstlük',
        size:'sm', tone:'ghost', act:'spi-analiz-ayrinti', data:{ 'aria-expanded':acik ? 'true' : 'false' } })}</div>`);
  }

  /* Başka ekrandan istenen bölüm (ofis kartının «Çapraz bağ tablosu» gibi)
     çizimden sonra görünür yapılır; istek bir kez kullanılır. */
  function afterRender(){
    const t = S.ui.analyticsTab;
    S.ui.analyticsTab = null;
    /* İstenen bölüm «Ayrıntılı okumalar»daysa önce açılır, sonra kayılır. */
    if(t && ONDE.indexOf(t) < 0 && !S.ui.spiAnalizAyrinti && TABS.some(x => x.id === t)){
      S.ui.spiAnalizAyrinti = true;
      Promise.resolve(SP.App.render()).then(() => K.bolumeGit(t));
      return;
    }
    if(t && t !== TABS[0].id && TABS.some(x => x.id === t)) K.bolumeGit(t);
  }

  const handle = {
    async 'spi-analiz-ayrinti'(){ S.ui.spiAnalizAyrinti = !S.ui.spiAnalizAyrinti; SP.App.render(); },
    async 'an-tab'(el){ K.bolumeGit(el.dataset.tab); },
    async 'an-kavram-tab'(el){ S.ui.anKavramTab = el.dataset.tab; SP.App.render(); },

    /* Tahmin KÖR açılır: gerçek değer burada hesaplanmaz. */
    async 'calib-open'(){
      const kind = S.ui.calibKind || 'weight';
      const el = document.getElementById('sp-calib-guess');
      const r = await SP.Calib.open(kind, el ? el.value : null, { dueAt:vadeFor(kind) });
      if(!r.ok){ UI.toast(r.error); return; }
      if(el) el.value = '';
      UI.toast('Tahmin deftere yazıldı');
      SP.App.render();
    },

    async 'calib-settle'(el){
      const id = el.dataset.id;
      const inp = document.getElementById('sp-calib-actual-' + id);
      const r = await SP.Calib.settle(id, inp ? inp.value : null);
      if(!r.ok){ UI.toast(r.error); return; }
      const h = SP.Calib.error(r.forecast);
      UI.toast(h && h.type === 'ape'
        ? 'Kapandı — sapma %' + Math.round(h.value * 100) : 'Kapandı');
      SP.App.render();
    },
  };

  /* Özetteki öneri kartının düğmeleri: Onaylar'ın işleyicisi, tek yol. */
  Object.assign(handle, (SP.Screens.today && SP.Screens.today.onayHandle) || {});

  /* Günlük ölçümler aynı gün kapanır; haftalık olanlar hafta sonunda. */
  function vadeFor(kind){
    const bugun = U.parse(U.todayISO());
    if(kind === 'protein') return null;
    if(kind === 'lab-value' || kind === 'flag') return null;
    return U.iso(bugun);
  }

  const change = {
    async 'pair-a'(el){ S.ui.pairA = el.value; SP.App.render(); },
    async 'pair-b'(el){ S.ui.pairB = el.value; SP.App.render(); },
    async 'calib-kind'(el){ S.ui.calibKind = el.value; SP.App.render(); },
    async 'pick-series'(el){ S.ui.trendMarker = el.value; SP.App.render(); },
  };

  return {
    id:'analytics',
    /* iPhone Faz 3: açık yalnız işin kendisi; kendi bağını kur ve dürüstlüğün
       üç meta kartı şerit (kalibrasyon girişi açık). */
    kucukVarsayilan:['kendi-bağını-kur', 'denetim-defteri', 'sürtünme', 'gösterge-ayrışması'],
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
    render, afterRender, handle, change,
  };
})();
