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
    { id:'denetim', label:'Denetim',      icon:'list' },
    { id:'durust', label:'Dürüstlük',      icon:'shield' },
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
        <!-- RAPOR KAPAĞI — belgenin yüzü. Mühür belgeyi imzalar, kapak
             adlandırır; ikisi ayrı şeydir. Dosya yoksa düğüm kalkar. -->
        <img class="rapor-kapak" src="img/marka/kapak-saglik-raporu.webp"
          alt="Sağlık raporu kapağı" loading="lazy" onerror="this.remove()">
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
      note:'Nöbetçi ve sürtünme ölçer arka planda çalışır; soruları Bugün '
         + 'ekranına tek kart olarak düşer. Burası o soruların defteri.',
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
      note:'SPİ\'de ORAN hesaplanmaz: sağlıklı yaşamak bir saat işi değildir. '
         + 'Uyumak, doğru yemek ve yürümek uygulamada dakika olarak görünmez; '
         + 'sahte bir payda uydurmak ölçülmemişi ölçülmüş göstermek olurdu.',
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
      note:'Sağlık verisi gürültülüdür: pencere 56 gün, eşik %35. İki '
         + 'pencerede de ölçüm yoksa hüküm kurulmaz.',
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
      note:'Tahmin KÖR yazılır: değer ekranda dururken yazılan tahmin, tahmin değil kopyadır.',
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

  /* Sekme yok (EKIP-PLANI §1.2): beş okuma alt alta durur, üstteki bölüm
     çubuğu sayfa içinde o okumaya kaydırır. Bir bölüm çizilemezse yalnız o
     bölüm sakin bir notla düşer; öteki dördü durur. */
  const BODIES = {
    capraz:() => html`${K.Ledger(() => [crossCard(), pairCard()])}
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

  /* ANALİZ BAŞI (vitrin): 041 veri doluluğu · uyku kartı: 027 kopuk çizgi,
     031 hedef bandı (yalnız profilde hedef yazılıysa; uydurulmaz), 032
     geçen dönem (bir dokunuşla), 036 dağılım, 037 güvenli eğilim, 034
     grafiğin cümlesi. SPİ teşhis koymaz: bant bir hedef, sınır değil. */
  function analizBasi(){
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
    return K.Grid([K.Span(12, html`<div class="analizbasi">
      ${K.Kutu({ ad:'Veri doluluğu', yuva:'son 7 gün', govde:raw(G.dolulukHtml([{ modul:'spi', ad:'SPİ', gunler:olcumlu }], { gun:7 })) })}
      ${K.Kutu({ ad:'Uyku', yuva:'son 28 gün', govde:html`
        <div class="sira-bas">${raw(G.egilimHtml(son.map(x => x.deger), { yon:'artis-iyi', birim:'saat' }))}</div>
        ${cizgi(bant ? { bant } : {})}
        ${raw(G.cumleHtml(son, { etiket:'Uyku', birim:'saat' }))}
        <details class="hiz-ac"><summary>Geçen dönemle karşılaştır</summary>${cizgi({ onceki:once, bant })}</details>
        <details class="hiz-ac"><summary>Dağılım</summary>${raw(G.dagilimSvg({ degerler:son.map(x => x.deger), birim:'saat', etiket:'Uyku' }))}</details>` })}
    </div>`)]);
  }

  async function render(){
    return String(html`${analizBasi()}${K.SayfaBolumleri({ act:'an-tab', aria:'Analiz bölümleri',
      bolumler:TABS.map(t => ({ id:t.id, ad:t.label, govde:govde(t) })) })}`);
  }

  /* Başka ekrandan istenen bölüm (ofis kartının «Çapraz bağ tablosu» gibi)
     çizimden sonra görünür yapılır; istek bir kez kullanılır. */
  function afterRender(){
    const t = S.ui.analyticsTab;
    S.ui.analyticsTab = null;
    if(t && t !== TABS[0].id && TABS.some(x => x.id === t)) K.bolumeGit(t);
  }

  const handle = {
    async 'an-tab'(el){ K.bolumeGit(el.dataset.tab); },

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
