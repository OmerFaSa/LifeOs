/* Merdiven — sıfırdan üstatlığa yedi disiplinin kademesi.

   Bu ekran bir «puan tablosu» değildir ve öyle çizilmemelidir. Taşıdığı tek
   cümle şudur: şu an nerede duruyorsun, bir sonraki kapı hangisi ve o kapıyı
   açan ölçüm ne?

   Üç şey bilinçli olarak YOKTUR:

     Süre tahmini.  «Üç ayda usta olursun» ESP.PEDAGOGIC.never içindeki
                    garanti yasağına girer.
     Rozet.         Kademe bir ödül değil bir konumdur; üretim dururken
                    kademe de durur.
     Tek puan.      Yedi disiplin tek sayıya toplanmaz — toplanan sayı,
                    hangi disiplinin çöktüğünü gizler.

   Ölçülemeyen kapı üçüncü bir renkle durur: ne geçilmiş ne kalınmış.
   Orada istenen şey çalışmak değil ÖLÇMEKTİR. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.ladder = (function(){
  const U = ESP.U, S = ESP.S;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;
  const C = () => ESP.Curriculum;

  function discOf(id){ return ESP.DISCIPLINE_BY_ID[id]; }

  function toneOfGate(g){
    return g.status === 'pass' ? 'ok' : (g.status === 'fail' ? 'warn' : 'muted');
  }

  function gateLine(g){
    return html`
      <li class="${cls('gate', 'gate--' + g.status)}">
        <span class="gate__mark" aria-hidden="true">${g.status === 'pass' ? '✓'
          : (g.status === 'fail' ? '·' : '?')}</span>
        <span class="gate__label">${g.label}</span>
        <span class="gate__why">${g.status === 'pass' ? 'geçildi' : (g.why || '')}</span>
        ${K.Badge({ label:(ESP.CERTAINTY[g.cert] || ESP.CERTAINTY.missing).label,
          tone:toneOfGate(g), icon:false })}
      </li>`;
  }

  /* ------------------------------------------------------------ genel bakış */

  function ozetRows(){
    const ov = C().overall();
    const hepsi = C().all().filter(Boolean);
    const rows = [];

    rows.push(K.Entry({
      label:'GENEL KADEME', hint:'level',
      meta:ov.cert === 'missing' ? 'veri yok' : ov.level.label,
      note:'Genel kademe disiplinlerin ortalaması değildir: ortalama ile en '
         + 'düşüğün arasıdır. Tek disiplinde üstat olup ötekileri bırakmak '
         + 'üstatlık sayılmaz; tek zayıf disiplin de bütün emeği silmez.',
      body:ov.cert === 'missing'
        ? K.Notice({ tone:'info', body:'Hiçbir disiplinde ölçülmüş üretim yok. '
            + 'Merdiven ilk ölçümle başlar.' })
        : html`
          ${K.NextUp({ icon:'chart', label:'Ölçülmüş üretim', title:ov.level.label,
            why:ov.level.note })}
          ${K.Meter({ label:'Merdivenin tamamı', value:ov.mastery,
            text:'%' + ov.mastery,
            note:ov.measuredDisciplines + '/' + ov.disciplines
              + ' disiplinde ölçülmüş üretim var' })}
          <p class="small muted mt-8">${ESP.PEDAGOGIC.level}</p>`,
    }));

    rows.push(K.Entry({
      label:'DİSİPLİNLER',
      meta:hepsi.length + ' merdiven',
      note:'Kademe ardışıktır: alttaki kapı atlanarak üsttekine geçilmez. '
         + 'Atlanan kapı ileride her zaman geri gelir.',
      wide:true,
      body:html`<div class="ladders">${map(hepsi, lv => {
        const d = discOf(lv.disc);
        if(!d) return '';
        return html`
          <button class="${cls('ladcard', 'ladcard--' + lv.disc,
              S.ui.curDisc === lv.disc && 'is-active')}"
            data-act="pick-disc" data-id="${lv.disc}"
            aria-pressed="${S.ui.curDisc === lv.disc ? 'true' : 'false'}">
            <span class="ladcard__head">
              <b>${d.label}</b>
              <span class="ladcard__rank num">${lv.level.short}</span>
            </span>
            <span class="ladcard__level">${lv.level.label}</span>
            <span class="ladcard__bar" aria-hidden="true">
              <span class="ladcard__fill" style="width:${lv.mastery}%"></span>
            </span>
            <span class="ladcard__meta">%${lv.mastery} · ${
              (ESP.CERTAINTY[lv.cert] || ESP.CERTAINTY.missing).label}</span>
          </button>`;
      })}</div>`,
    }));

    /* Ölçülemeyen kapılar tek listede: bunlar "çalış" değil "ölç" işleridir. */
    const olcum = ESP.Mod.active().map(d => C().nextGate(d.id))
      .filter(g => g && g.action === 'measure');
    rows.push(K.Entry({
      label:'ÖLÇÜLEMEYEN KAPILAR', hint:'unknown-gate',
      meta:olcum.length ? olcum.length + ' kapı' : 'yok',
      note:'Ölçülemeyen kapı geçilmiş sayılmaz ama kalınmış da sayılmaz. '
         + 'Sıfır varsaymak, sistemin en pahalı hatasıdır.',
      body:olcum.length
        ? K.Table({ tight:true, headers:['Disiplin', 'Kapı', ''],
            rows:olcum.map(g => [
              (discOf(g.disc) || {}).label || g.disc,
              g.gate.label,
              K.Button({ label:'Ölçmeye git', size:'sm', act:'go',
                data:{ 'data-route':(discOf(g.disc) || {}).route || 'today' } }),
            ]) })
        : K.Empty({ text:'Bir sonraki kapıların hepsi ölçülebiliyor.' }),
    }));

    return rows;
  }

  /* ------------------------------------------------------- tek disiplin yolu */

  function yolRows(discId){
    const d = discOf(discId);
    const yol = C().roadmap(discId);
    const lv = C().levelOf(discId);
    const kapi = C().nextGate(discId);
    const lad = C().ladder(discId);
    if(!d || !yol || !lad) return [K.Entry({ label:'YOL', body:K.Empty({ text:'Merdiven yok.' }) })];

    const rows = [];

    rows.push(K.Entry({
      label:d.label.toLocaleUpperCase('tr-TR'), hint:'ladder',
      meta:lv.level.label,
      note:lad.aim,
      action:K.Button({ label:'Masaya git', size:'sm', act:'go',
        data:{ 'data-route':d.route } }),
      body:html`
        ${K.Meter({ label:'Merdiven', value:lv.mastery, text:'%' + lv.mastery })}
        <p class="rulesay mt-10">${C().sentence(discId)}</p>
        ${when(kapi, () => K.NextUp({
          icon:kapi.action === 'measure' ? 'info' : 'zap',
          label:kapi.action === 'measure' ? 'Önce ölç' : 'Sıradaki kapı',
          title:kapi.title, why:kapi.why }))}`,
    }));

    yol.steps.forEach(st => {
      rows.push(K.Entry({
        label:'KADEME ' + (ESP.LEVEL_BY_RANK[st.rank] || {}).short,
        meta:st.state === 'done' ? 'geçildi'
          : (st.state === 'current' ? '%' + st.pct : 'ileride'),
        note:st.title,
        wide:true,
        class:'step step--' + st.state,
        body:html`
          <div class="step__cols">
            <div>
              ${K.SectionTitle('Ne çalışılır')}
              <ul class="studylist">${map(st.study, x => html`<li>${x}</li>`)}</ul>
              <p class="small muted mt-8"><b>Kapanış işi:</b> ${st.proof}</p>
            </div>
            <div>
              ${K.SectionTitle('Kapılar')}
              <ul class="gates">${map(st.gates, gateLine)}</ul>
              ${when(st.unknown, () => K.Notice({ tone:'info',
                body:st.unknown + ' kapı ölçülemiyor: burada istenen şey '
                  + 'çalışmak değil ölçmek.' }))}
            </div>
          </div>`,
      }));
    });

    return rows;
  }

  /* ------------------------------------------------------ seviye tespit sınavı */

  function tespitRows(){
    const cevaplar = (S.prefs && S.prefs.placement) || {};
    const disc = S.ui.curDisc || 'lang';
    const mevcut = cevaplar[disc] || {};
    const tahmin = C().placement(mevcut);
    const lv = C().levelOf(disc);

    return [
      K.Entry({
        label:'SEVİYE TESPİTİ', hint:'placement',
        meta:(discOf(disc) || {}).label || disc,
        note:ESP.PLACEMENT.note,
        body:html`
          ${K.Field({ label:'Disiplin',
            input:K.Select({ id:'pl-disc', value:disc, change:'pick-disc-sel',
              aria:'Tespit yapılacak disiplin',
              options:ESP.Mod.active().map(x => ({ value:x.id, label:x.label })) }) })}
          ${map(ESP.PLACEMENT.questions, q => K.Field({ label:q.label, class:'mt-10',
            input:K.Select({ id:'pl-' + q.id,
              value:mevcut[q.id] != null ? String(mevcut[q.id]) : '',
              aria:q.label,
              options:[{ value:'', label:'(cevapsız)' }]
                .concat(q.options.map(o => ({ value:String(o.value), label:o.label }))) }) }))}
          ${K.Button({ label:'Tahmini kaydet', tone:'primary', act:'save-placement',
            class:'mt-10', data:{ 'data-id':disc } })}`,
      }),

      K.Entry({
        label:'SONUÇ',
        meta:tahmin.answered + '/' + tahmin.total + ' cevap',
        note:'Tahmin hiçbir kapıyı açmaz. Ölçülmüş kademe tahmini her zaman yener.',
        body:html`
          <div class="row wrap">
            ${K.Badge({ label:'tahmin: ' + tahmin.level.label, tone:'warn' })}
            ${K.Badge({ label:'ölçülen: ' + (lv && lv.cert !== 'missing'
              ? lv.level.label : 'veri yok'),
              tone:lv && lv.cert !== 'missing' ? 'ok' : 'muted' })}
          </div>
          <p class="small muted mt-8">${tahmin.level.note}</p>`,
      }),
    ];
  }

  /* ----------------------------------------------------------------- çizim */

  const TABS = [
    { id:'ozet',   label:'Genel' },
    { id:'yol',    label:'Yol' },
    { id:'tespit', label:'Seviye tespiti' },
  ];

  function render(){
    const tab = S.ui.ladderTab || 'ozet';
    const disc = S.ui.curDisc || 'lang';
    const rows = tab === 'ozet' ? ozetRows()
      : tab === 'yol' ? yolRows(disc)
      : tespitRows();

    return K.Grid(html`
      ${K.Span(12, K.Toolbar({
        tabs:K.Subtabs({ value:tab, act:'pick-tab', aria:'Merdiven bölümleri',
          items:TABS.map(t => ({ id:t.id, label:t.label })) }),
        actions:when(tab !== 'ozet', () => K.Select({ id:'lad-disc', value:disc,
          change:'pick-disc-sel', aria:'Disiplin seç',
          options:ESP.Mod.active().map(x => ({ value:x.id, label:x.label })) })),
      }))}
      ${K.Span(12, K.Ledger(() => rows))}`);
  }

  const handle = {
    async 'pick-tab'(el){ S.ui.ladderTab = el.dataset.tab; ESP.App.render(); },

    async 'pick-disc'(el){
      S.ui.curDisc = el.dataset.id;
      S.ui.ladderTab = 'yol';
      ESP.App.render();
    },

    async 'save-placement'(el){
      const disc = el.dataset.id;
      const cevaplar = {};
      ESP.PLACEMENT.questions.forEach(q => {
        const node = document.getElementById('pl-' + q.id);
        const v = node ? node.value : '';
        if(v !== '') cevaplar[q.id] = Number(v);
      });
      const prefs = Object.assign({}, S.prefs || {});
      prefs.placement = Object.assign({}, prefs.placement || {});
      prefs.placement[disc] = cevaplar;
      await ESP.Model.savePrefs(prefs);
      ESP.UI.toast('Tahmin kaydedildi — hiçbir kapı açılmadı');
      ESP.App.render();
    },
  };

  const change = {
    async 'pick-disc-sel'(el){ S.ui.curDisc = el.value; ESP.App.render(); },
  };

  return {
    id:'ladder',
    title:'Merdiven',
    headline(){
      const ov = C().overall();
      if(ov.cert === 'missing') return 'Merdiven henüz başlamadı.';
      const olc = ESP.Mod.active().map(d => C().nextGate(d.id))
        .filter(g => g && g.action === 'measure').length;
      if(olc) return olc + ' kapı ölçülemiyor.';
      return 'Ölçülmüş üretim «' + ov.level.label + '» kademesinde.';
    },
    lede(){
      return 'Kademe kişiye değil ÜRETİME verilir. Ölçüm dururken kademe de '
           + 'durur; bu bir sınav sonucu değildir.';
    },
    stats(){
      const ov = C().overall();
      const hepsi = C().all().filter(Boolean);
      return [
        { value:ov.cert === 'missing' ? '—' : ov.level.short, label:'genel kademe' },
        { value:ov.cert === 'missing' ? '—' : String(ov.mastery), unit:'%', label:'merdiven' },
        { value:String(hepsi.filter(x => x.rank > 0).length), label:'başlamış disiplin' },
        { value:String(ESP.Mod.active().map(d => C().nextGate(d.id))
          .filter(g => g && g.action === 'measure').length), label:'ölçülemeyen kapı' },
      ];
    },
    subtitle(){
      const ov = C().overall();
      return ov.cert === 'missing' ? 'ölçüm yok' : ov.level.label;
    },
    actions(){ return ''; },
    render, handle, change,
  };
})();
