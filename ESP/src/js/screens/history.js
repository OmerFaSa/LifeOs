/* Kronoloji — tarih masası.

   Beş sekme: Şerit · Olaylar · Kaynaklar · Zincir · Çalışma.

   Ekranın taşıdığı tek iddia şudur: tarih bir liste değildir. Bu yüzden
   sekmeler bir SIRA anlatır — olayı yerleştir, kaynağını eleştir, nedenini
   kur, tekrarla. Sıranın tersi de mümkündür ama ekran sırayı önerir.

   Boş bir kronoloji «%0 kapsam» diye çizilmez: ölçülmemiş bir şeyi ölçülmüş
   gibi göstermek, bu depodaki en pahalı hatanın ta kendisi. Boşken ekran
   yalnızca tohumu önerir. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.history = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;

  const TABS = [
    { id:'serit',     label:'Şerit' },
    { id:'olaylar',   label:'Olaylar' },
    { id:'kaynaklar', label:'Kaynaklar' },
    { id:'zincir',    label:'Zincir' },
    { id:'calisma',   label:'Çalışma' },
  ];

  function evs(){ return S.events || []; }
  function srcs(){ return S.sources || []; }
  function chs(){ return S.chains || []; }
  function eventOf(id){ return evs().filter(e => e.id === id)[0] || null; }
  function sourceOf(id){ return srcs().filter(s => s.id === id)[0] || null; }

  function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function num(id){
    const v = val(id);
    if(v === '') return null;
    const n = Number(v.replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  /* ------------------------------------------------------------------ şerit */

  function seritRows(){
    const st = ESP.Chrono.status();
    const rows = [];

    if(!evs().length){
      rows.push(K.Entry({
        label:'BOŞ ŞERİT', hint:'chrono',
        meta:'olay yok',
        note:'Kronoloji boşken kapsam ölçülmez. Sıfır kapsam ile ölçülmemiş '
           + 'kapsam aynı şey değildir.',
        body:html`
          ${K.Empty({ text:'Zaman şeridinde hiç olay yok.' })}
          ${K.Notice({ tone:'info',
            body:'Tohum listesi ' + (ESP.SEED_EVENTS || []).length + ' dönüm noktası '
              + 'taşıyor. Tohum bir müfredat değil bir iskelettir: kendi olaylarını '
              + 'eklemek için bir zemin.' })}
          ${K.Button({ label:'Tohumu yükle', tone:'primary', act:'seed', class:'mt-10' })}`,
      }));
      return rows;
    }

    /* Dönem şeridi — her dönem kendi olay sayısıyla. */
    const donem = ESP.Chrono.spread('era');
    rows.push(K.Entry({
      label:'DÖNEMLER', hint:'era',
      meta:st.eras.covered + '/' + st.eras.total + ' kapsandı',
      note:'Dönem sınırları tartışmalıdır ve öyle gösterilir: bir sınır bir '
         + 'ölçüm değil bir karardır.',
      wide:true,
      body:html`<div class="erastrip">${map(donem.buckets, b => {
        const e = ESP.ERA_BY_ID[b.id];
        return html`
          <button class="${cls('eracell', b.n === 0 && 'is-empty',
              S.ui.histEra === b.id && 'is-active')}"
            data-act="pick-era" data-id="${b.id}"
            aria-pressed="${S.ui.histEra === b.id ? 'true' : 'false'}">
            <span class="eracell__label">${b.label}</span>
            <span class="eracell__span">${ESP.yearLabel(e.from)} – ${ESP.yearLabel(e.to)}</span>
            <span class="eracell__n num">${b.n}</span>
          </button>`;
      })}</div>
      ${when(S.ui.histEra !== 'all', () => {
        const e = ESP.ERA_BY_ID[S.ui.histEra];
        return e ? html`<div class="eranote">
            <p>${e.note}</p>
            <p class="small muted"><b>Tartışmalı:</b> ${e.disputed}</p>
            ${K.Button({ label:'Süzgeci kaldır', size:'sm', act:'pick-era',
              data:{ 'data-id':'all' } })}
          </div>` : '';
      })}`,
    }));

    /* Yüzyıl boşlukları. */
    rows.push(K.Entry({
      label:'YÜZYIL BOŞLUKLARI', hint:'gap',
      meta:st.gaps.length ? st.gaps.length + ' boşluk' : 'yok',
      note:'Üst üste üç yüzyıl boş kaldığında kör nokta sayılır. Her yüzyılda '
         + 'dönüm noktası olmak zorunda değil — ama üç yüzyıl sessizlik bir sorudur.',
      body:st.gaps.length
        ? K.Table({ tight:true, headers:['Aralık', { label:'Yüzyıl', num:true }],
            rows:st.gaps.map(g => [
              ESP.centuryLabel(g.from) + ' – ' + ESP.centuryLabel(g.to),
              String(g.length),
            ]) })
        : K.Empty({ text:'Kapsanan aralıkta üç yüzyıldan uzun boşluk yok.' }),
    }));

    /* Dağılım: alan ve bölge. */
    rows.push(K.Entry({
      label:'DAĞILIM', hint:'coverage',
      meta:st.kinds.covered + '/' + st.kinds.total + ' alan',
      note:'Yalnızca savaş ve antlaşma girilirse nedensellik hep askerî kalır. '
         + 'Ekonomik ve düşünsel olaylar zinciri değiştirir.',
      wide:true,
      body:html`
        <div class="cols-2">
          <div>
            ${K.SectionTitle('Alan')}
            ${map(ESP.Chrono.spread('kind').buckets, b => K.Meter({
              label:b.label, value:b.pct, text:b.n + ' olay',
              tone:b.n === 0 ? 'warn' : null }))}
          </div>
          <div>
            ${K.SectionTitle('Bölge')}
            ${map(ESP.Chrono.spread('region').buckets, b => K.Meter({
              label:b.label, value:b.pct, text:b.n + ' olay',
              tone:b.n === 0 ? 'warn' : null }))}
          </div>
        </div>`,
    }));

    return rows;
  }

  /* ---------------------------------------------------------------- olaylar */

  function filteredEvents(){
    const q = U.norm(S.ui.histQuery || '');
    return evs()
      .filter(e => S.ui.histEra === 'all' || !S.ui.histEra || e.era === S.ui.histEra)
      .filter(e => !q || U.norm(e.title).indexOf(q) >= 0);
  }

  function olayRows(){
    const list = filteredEvents();
    const rows = [];

    rows.push(K.Entry({
      label:'OLAY EKLE', hint:'event',
      meta:'yıl zorunlu',
      note:'Dönem yıldan türetilir, sorulmaz: aynı yıl iki döneme düşemez ve '
         + 'elle girilen dönem zamanla yanlış kalır.',
      body:html`
        <div class="cols-2">
          ${K.Field({ label:'Olay',
            input:K.Input({ id:'ev-title', placeholder:'Malazgirt Savaşı',
              aria:'Olayın adı' }) })}
          ${K.Field({ label:'Yıl', hint:'MÖ için eksi yaz: -753',
            input:K.Input({ id:'ev-year', type:'number', numeric:true,
              placeholder:'1071', aria:'Olayın yılı' }) })}
        </div>
        <div class="cols-2 mt-10">
          ${K.Field({ label:'Alan',
            input:K.Select({ id:'ev-kind', value:'siyasi', aria:'Olayın alanı',
              options:ESP.EVENT_KINDS.map(k => ({ value:k.id, label:k.label })) }) })}
          ${K.Field({ label:'Bölge',
            input:K.Select({ id:'ev-region', value:'anadolu', aria:'Olayın bölgesi',
              options:ESP.REGIONS.map(r => ({ value:r.id, label:r.label })) }) })}
        </div>
        ${K.Field({ label:'Neden dönüm noktası?', class:'mt-10',
          input:K.Input({ id:'ev-why', aria:'Olayın önemi',
            placeholder:'Anadolu\'nun Türkleşme sürecinin açılışı.' }) })}
        ${K.Button({ label:'Olayı ekle', tone:'primary', act:'add-event', class:'mt-10' })}`,
    }));

    if(!list.length){
      rows.push(K.Entry({ label:'OLAYLAR', meta:'yok',
        body:K.Empty({ text:'Süzgece uyan olay yok.' }) }));
      return rows;
    }

    rows.push(K.Entry({
      label:'OLAYLAR',
      meta:list.length + ' olay',
      action:K.Input({ id:'ev-q', value:S.ui.histQuery || '', size:'sm',
        placeholder:'Olay ara…', change:'hist-query', aria:'Olay ara' }),
      wide:true,
      body:html`${map(list, e => {
        const a = ESP.Chrono.explained(e.id);
        const era = ESP.ERA_BY_ID[e.era];
        return html`
          <div class="evrow">
            <span class="evrow__year num">${ESP.yearLabel(e.year)}</span>
            <div class="evrow__body">
              <b>${e.title}</b>
              ${when(e.why, () => html`<p class="small muted">${e.why}</p>`)}
              <div class="evrow__meta">
                ${when(era, () => K.Badge({ label:era.label, tone:'muted', icon:false }))}
                ${K.Badge({ label:(ESP.EVENT_KIND_BY_ID[e.kind] || {}).label || e.kind,
                  tone:'muted', icon:false })}
                ${K.Badge({ label:a.state === 'balanced' ? 'dengeli zincir'
                    : (a.state === 'thin' ? 'zayıf zincir' : 'zincirsiz'),
                  tone:a.state === 'balanced' ? 'ok' : (a.state === 'thin' ? 'warn' : 'muted') })}
                ${K.Button({ label:'Eşzamanlı', size:'sm', act:'contemp',
                  data:{ 'data-id':e.id } })}
                ${K.Button({ label:'Zincir kur', size:'sm', act:'new-chain',
                  data:{ 'data-id':e.id } })}
                ${K.Button({ label:'Karta çevir', size:'sm', act:'to-cards',
                  data:{ 'data-id':e.id } })}
                ${K.Button({ label:'Sil', size:'sm', act:'del-event',
                  data:{ 'data-id':e.id } })}
              </div>
              ${when(S.ui.eventOpen === e.id, () => esZamanli(e))}
            </div>
          </div>`;
      })}`,
    }));

    return rows;
  }

  function esZamanli(e){
    const list = ESP.Chrono.contemporaries(e.year, 50).filter(x => x.id !== e.id);
    return html`<div class="contemp">
      <p class="small"><b>${ESP.yearLabel(e.year)} ± 50 yıl</b> — tarihin en öğretici sorusu:
        aynı anda başka yerde ne oluyordu?</p>
      ${list.length
        ? html`<ul class="contemp__list">${map(list, x => html`<li>
            <span class="num">${ESP.yearLabel(x.year)}</span>
            <span>${x.title}</span>
            <em class="tiny dim">${(ESP.REGIONS.filter(r => r.id === x.region)[0] || {}).label || ''}</em>
          </li>`)}</ul>`
        : K.Empty({ text:'Bu aralıkta başka olay girilmemiş.' })}
      ${K.Button({ label:'Kapat', size:'sm', act:'contemp', data:{ 'data-id':'' } })}
    </div>`;
  }

  /* -------------------------------------------------------------- kaynaklar */

  function kaynakRows(){
    const b = ESP.Chrono.sourceBalance();
    const rows = [];

    rows.push(K.Entry({
      label:'KAYNAK EKLE', hint:'source',
      meta:'birincil / ikincil',
      note:'Tek kaynağa dayanan bir iddia bir tezdir, bir olgu değil.',
      body:html`
        <div class="cols-2">
          ${K.Field({ label:'Kaynak',
            input:K.Input({ id:'sr-title', placeholder:'Tevârîh-i Âl-i Osman',
              aria:'Kaynağın adı' }) })}
          ${K.Field({ label:'Yazar',
            input:K.Input({ id:'sr-author', placeholder:'Âşıkpaşazâde', aria:'Yazar' }) })}
        </div>
        <div class="cols-3 mt-10">
          ${K.Field({ label:'Tür',
            input:K.Select({ id:'sr-kind', value:'secondary', aria:'Kaynağın türü',
              options:ESP.SOURCE_KINDS.map(k => ({ value:k.id, label:k.label })) }) })}
          ${K.Field({ label:'Yıl',
            input:K.Input({ id:'sr-year', type:'number', numeric:true, aria:'Kaynağın yılı' }) })}
          ${K.Field({ label:'Tarih yazımı okulu',
            input:K.Select({ id:'sr-school', value:'', aria:'Tarih yazımı okulu',
              options:[{ value:'', label:'(belirsiz)' }]
                .concat(ESP.HISTORIOGRAPHY.map(h => ({ value:h.id, label:h.label }))) }) })}
        </div>
        ${K.Button({ label:'Kaynağı ekle', tone:'primary', act:'add-source', class:'mt-10' })}`,
    }));

    rows.push(K.Entry({
      label:'DENGE', hint:'balance',
      meta:b.cert === 'missing' ? 'veri yok'
        : b.primary + '/' + b.total + ' birincil',
      note:'Birincil oran bir kalite değil bir kompozisyon ölçüsüdür: %100 '
         + 'birincil de sağlıklı değildir, bağlamı ikincil kaynak verir.',
      body:b.cert === 'missing'
        ? K.Empty({ text:'Henüz kaynak değerlendirilmedi.' })
        : html`
          ${K.Meter({ label:'Birincil oran', value:Math.round(b.ratio * 100),
            text:'%' + Math.round(b.ratio * 100) })}
          ${when(b.note, () => K.Notice({ tone:'info', body:b.note }))}`,
    }));

    if(srcs().length){
      rows.push(K.Entry({
        label:'KAYNAKLAR', meta:srcs().length + ' kaynak', wide:true,
        body:html`${map(srcs(), s => {
          const d = M.critiqueDepth(s);
          const okul = ESP.SCHOOL_BY_ID[s.school];
          return html`
            <div class="srcrow">
              <div class="srcrow__head">
                <b>${s.title}</b>
                <span class="tiny dim">${s.author || '—'}${s.year ? ' · ' + ESP.yearLabel(s.year) : ''}</span>
                ${K.Badge({ label:(ESP.SOURCE_KINDS.filter(k => k.id === s.kind)[0] || {}).label || s.kind,
                  tone:s.kind === 'primary' ? 'info' : 'muted', icon:false })}
                ${when(okul, () => K.Badge({ label:okul.label, tone:'muted', icon:false }))}
                ${K.Badge({ label:d.answered + '/' + d.total + ' soru',
                  tone:d.answered === d.total ? 'ok' : (d.answered ? 'warn' : 'muted') })}
                ${K.Button({ label:S.ui.sourceOpen === s.id ? 'Kapat' : 'Eleştir',
                  size:'sm', act:'open-source', data:{ 'data-id':s.id } })}
                ${K.Button({ label:'Sil', size:'sm', act:'del-source', data:{ 'data-id':s.id } })}
              </div>
              ${when(S.ui.sourceOpen === s.id, () => critiqueForm(s))}
            </div>`;
        })}`,
      }));
    }

    return rows;
  }

  function critiqueForm(s){
    return html`<div class="critique">
      ${map(ESP.SOURCE_CRITIQUE, q => html`
        <div class="critique__q">
          <label for="cq-${q.id}"><b>${q.q}</b></label>
          <p class="tiny dim">${q.note}</p>
          ${K.Textarea({ id:'cq-' + q.id, rows:2, value:(s.answers || {})[q.id] || '',
            aria:q.q })}
        </div>`)}
      ${K.Button({ label:'Eleştiriyi kaydet', tone:'primary', size:'sm',
        act:'save-critique', data:{ 'data-id':s.id } })}
    </div>`;
  }

  /* ----------------------------------------------------------------- zincir */

  function zincirRows(){
    const rows = [];
    const acik = S.ui.chainOpen ? chs().filter(c => c.id === S.ui.chainOpen)[0] : null;

    rows.push(K.Entry({
      label:'NEDEN ZİNCİRİ', hint:'causal',
      meta:chs().length + ' zincir',
      note:'Yapısal koşul ile tetikleyici aynı şey değildir. Yalnızca kıvılcımdan '
         + 'kurulan bir açıklama, tarihin en yaygın hatasıdır.',
      body:evs().length
        ? html`
          <div class="row wrap">
            ${K.Select({ id:'ch-event', aria:'Zincirin olayı',
              options:evs().map(e => ({ value:e.id,
                label:ESP.yearLabel(e.year) + ' — ' + e.title })) })}
            ${K.Input({ id:'ch-q', placeholder:'Soru: bu neden oldu?',
              aria:'Zincirin sorusu' })}
            ${K.Button({ label:'Zincir aç', tone:'primary', act:'add-chain' })}
          </div>`
        : K.Empty({ text:'Önce bir olay ekle: zincir olaysız kurulmaz.' }),
    }));

    chs().forEach(c => {
      const e = eventOf(c.eventId);
      const b = M.chainBalance(c);
      rows.push(K.Entry({
        label:(e ? ESP.yearLabel(e.year) : '—'),
        meta:b.links + ' halka',
        note:c.question || (e ? e.title : ''),
        action:html`${K.Button({ label:acik && acik.id === c.id ? 'Kapat' : 'Aç', size:'sm',
            act:'open-chain', data:{ 'data-id':c.id } })}
          ${K.Button({ label:'Sil', size:'sm', act:'del-chain', data:{ 'data-id':c.id } })}`,
        wide:true,
        body:html`
          <div class="row wrap">
            ${K.Badge({ label:b.balanced ? 'dengeli' : 'dengesiz',
              tone:b.balanced ? 'ok' : 'warn' })}
            ${K.Badge({ label:b.sourced + '/' + b.links + ' kaynaklı',
              tone:b.sourced === b.links && b.links ? 'ok' : 'muted' })}
          </div>
          ${when(b.why, () => K.Notice({ tone:'warn', body:b.why }))}
          ${when(c.links.length, () => html`<ul class="chain">${map(c.links, l => {
            const src = sourceOf(l.sourceId);
            const kind = ESP.CAUSE_KINDS.filter(k => k.id === l.kind)[0] || {};
            return html`<li class="${cls('chain__link', 'chain__link--' + l.kind)}">
              <span class="chain__kind">${kind.label || l.kind}</span>
              <span class="chain__text">${l.text}</span>
              <span class="tiny dim">${src ? src.title : 'kaynaksız'}</span>
              ${K.Button({ label:'Kaldır', size:'sm', act:'del-link',
                data:{ 'data-c':c.id, 'data-l':l.id } })}
            </li>`;
          })}</ul>`)}
          ${when(acik && acik.id === c.id, () => html`
            <div class="linkform mt-10">
              ${K.Select({ id:'cl-kind', value:'yapisal', aria:'Halkanın türü',
                options:ESP.CAUSE_KINDS.map(k => ({ value:k.id, label:k.label })) })}
              ${K.Input({ id:'cl-text', placeholder:'Halka: ne, neden?',
                aria:'Halkanın metni' })}
              ${K.Select({ id:'cl-src', value:'', aria:'Halkanın kaynağı',
                options:[{ value:'', label:'Kaynaksız' }]
                  .concat(srcs().map(s => ({ value:s.id, label:s.title }))) })}
              ${K.Button({ label:'Halka ekle', tone:'primary', size:'sm',
                act:'add-link', data:{ 'data-id':c.id } })}
            </div>`)}`,
      }));
    });

    return rows;
  }

  /* ---------------------------------------------------------------- çalışma */

  function calismaRows(){
    const rows = [];
    const drill = ESP.Chrono.drill();
    const r = ESP.Chrono.retention();
    const due = ESP.SRS.dueCards().filter(c => c.lang === ESP.HISTORY_DECK);

    rows.push(K.Entry({
      label:'BUGÜNÜN EGZERSİZİ', hint:'drill',
      meta:drill ? 'kademe ' + drill.level : '—',
      note:'Egzersizi kural motoru seçer, model değil: açığı olan eksen önce gelir.',
      body:drill
        ? K.NextUp({ icon:'zap', label:drill.label, title:drill.task,
            why:'Bu egzersiz, ölçülen açığa göre seçildi.' })
        : K.Empty({ text:'Egzersiz listesi boş.' }),
    }));

    rows.push(K.Entry({
      label:'TARİH DESTESİ', hint:'srs',
      meta:due.length ? due.length + ' kart vadeli' : 'vadesi gelen yok',
      note:'Tarih destesi dil destesinden AYRI ölçülür: birinin iyi olması '
         + 'ötekinin çöküşünü gizlememeli.',
      body:html`
        ${r.cert === 'missing'
          ? K.Notice({ tone:'info', body:'Retansiyon henüz ölçülemedi: taban için '
              + 'en az ' + ESP.Planner.RETENTION_MIN_CARDS + ' cevaplanmış kart gerekir.' })
          : K.Meter({ label:'Retansiyon', value:Math.round(r.value * 100),
              text:'%' + Math.round(r.value * 100),
              tone:r.value < ESP.Planner.RETENTION_FLOOR ? 'danger' : 'ok',
              note:r.n + ' karttan hesaplandı' })}
        ${when(due.length, () => K.Button({ label:'Tekrara başla', tone:'primary',
          act:'go-cards', class:'mt-10' }))}`,
    }));

    rows.push(K.Entry({
      label:'ANAKRONİZM TUZAKLARI', hint:'anachronism',
      meta:ESP.ANACHRONISMS.length + ' tuzak',
      note:'Bugünün gözüyle okumak, tarihin en sessiz hatasıdır: yanlış cevap '
         + 'vermez, yanlış soru sordurur.',
      body:K.Table({ tight:true, headers:['Tuzak', 'Ne yapar'],
        rows:ESP.ANACHRONISMS.map(a => [a.label, a.note]) }),
    }));

    rows.push(K.Entry({
      label:'TARİH YAZIMI OKULLARI', hint:'school',
      meta:ESP.HISTORIOGRAPHY.length + ' okul',
      note:'Aynı olay, farklı okulda farklı bir hikâyedir. Bunu görmek, tarih '
         + 'bilmek ile tarihsel düşünmek arasındaki fark.',
      wide:true,
      body:K.Table({ tight:true, headers:['Okul', 'Neye bakar', 'Sorusu'],
        rows:ESP.HISTORIOGRAPHY.map(h => [h.label, h.note, h.asks]) }),
    }));

    rows.push(K.Entry({
      label:'EGZERSİZ KATALOĞU',
      meta:ESP.HISTORY_DRILLS.length + ' egzersiz',
      wide:true,
      body:K.Table({ tight:true,
        headers:[{ label:'Kademe', num:true }, 'Egzersiz', 'Ne yapılır'],
        rows:ESP.HISTORY_DRILLS.slice().sort((a, b) => a.level - b.level)
          .map(d => [String(d.level), d.label, d.task]) }),
    }));

    return rows;
  }

  /* ----------------------------------------------------------------- çizim */

  function render(){
    const tab = S.ui.histTab || 'serit';
    const rows = tab === 'serit' ? seritRows()
      : tab === 'olaylar' ? olayRows()
      : tab === 'kaynaklar' ? kaynakRows()
      : tab === 'zincir' ? zincirRows()
      : calismaRows();

    return K.Grid(html`
      ${K.Span(12, K.Toolbar({
        tabs:K.Subtabs({ value:tab, act:'pick-tab', aria:'Kronoloji bölümleri',
          items:TABS.map(t => ({ id:t.id, label:t.label })) }),
        actions:when(evs().length, () => K.Button({ label:'Tohumu yükle', size:'sm',
          act:'seed' })),
      }))}
      ${K.Span(12, K.Ledger(() => rows))}`);
  }

  /* ----------------------------------------------------------------- eylem */

  const handle = {
    async 'pick-tab'(el){ S.ui.histTab = el.dataset.tab; ESP.App.render(); },
    async 'pick-era'(el){
      S.ui.histEra = el.dataset.id === S.ui.histEra ? 'all' : el.dataset.id;
      ESP.App.render();
    },

    async 'seed'(){
      const res = await M.seedEvents();
      ESP.Memo.bitir();
      ESP.UI.toast(res.added + ' olay eklendi'
        + (res.skipped ? ', ' + res.skipped + ' tanesi zaten vardı' : ''));
      ESP.App.render();
    },

    async 'add-event'(){
      const res = await M.saveEvent(M.newEvent({
        title:val('ev-title'), year:num('ev-year'),
        kind:val('ev-kind') || 'siyasi', region:val('ev-region') || 'dunya',
        why:val('ev-why'),
      }));
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      ESP.Memo.bitir();
      ESP.UI.toast('Olay kronolojiye girdi');
      ESP.App.render();
    },

    async 'del-event'(el){
      const id = el.dataset.id;
      const e = eventOf(id);
      ESP.UI.confirmSheet('Olay silinsin mi?',
        (e ? '«' + e.title + '» ' : '') + 've bu olaya bağlı neden zincirleri kalkar.',
        async () => {
          await M.deleteEvent(id);
          ESP.Memo.bitir();
          ESP.App.render();
        }, true);
    },

    async 'contemp'(el){
      S.ui.eventOpen = el.dataset.id || null;
      ESP.App.render();
    },

    /* Bir olaydan iki kart cikar: "olay -> yil" ve "yil -> olay".
       Ikisi ayri hatirlama isidir; biri bilinirken oteki bilinmeyebilir. */
    async 'to-cards'(el){
      const e = eventOf(el.dataset.id);
      if(!e) return;
      const kartlar = ESP.Chrono.cardsFor(e);
      let eklenen = 0;
      for(const k of kartlar){
        const var_ = (S.cards || []).some(c => c.lang === ESP.HISTORY_DECK
          && U.norm(c.front) === U.norm(k.front));
        if(var_) continue;
        await M.saveCard(M.newCard(k));
        eklenen++;
      }
      ESP.Memo.bitir();
      ESP.UI.toast(eklenen ? eklenen + ' kart eklendi' : 'Kartlar zaten vardı');
      ESP.App.render();
    },

    async 'go-cards'(){
      S.ui.langDeck = ESP.HISTORY_DECK;
      S.ui.langTab = 'calis';
      ESP.App.go('lang');
    },

    async 'add-source'(){
      const res = await M.saveSource(M.newSource({
        title:val('sr-title'), author:val('sr-author'), year:num('sr-year'),
        kind:val('sr-kind') || 'secondary', school:val('sr-school') || null,
      }));
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'open-source'(el){
      S.ui.sourceOpen = S.ui.sourceOpen === el.dataset.id ? null : el.dataset.id;
      ESP.App.render();
    },

    async 'save-critique'(el){
      const s = sourceOf(el.dataset.id);
      if(!s) return;
      const cevaplar = {};
      ESP.SOURCE_CRITIQUE.forEach(q => {
        const v = val('cq-' + q.id);
        if(v) cevaplar[q.id] = v;
      });
      await M.saveSource(Object.assign({}, s, { answers:cevaplar }));
      ESP.Memo.bitir();
      ESP.UI.toast('Eleştiri kaydedildi');
      ESP.App.render();
    },

    async 'del-source'(el){
      await M.deleteSource(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'add-chain'(){
      const res = await M.saveChain(M.newChain({
        eventId:val('ch-event'), question:val('ch-q'),
      }));
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      S.ui.chainOpen = res.chain.id;
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'new-chain'(el){
      const res = await M.saveChain(M.newChain({ eventId:el.dataset.id }));
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      S.ui.chainOpen = res.chain.id;
      S.ui.histTab = 'zincir';
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'open-chain'(el){
      S.ui.chainOpen = S.ui.chainOpen === el.dataset.id ? null : el.dataset.id;
      ESP.App.render();
    },

    async 'add-link'(el){
      const c = chs().filter(x => x.id === el.dataset.id)[0];
      if(!c) return;
      const metin = val('cl-text');
      if(!metin){ ESP.UI.toast('Halkanın metni boş olamaz'); return; }
      const links = (c.links || []).concat([{
        id:U.uid('l'), kind:val('cl-kind') || 'yapisal', text:metin,
        sourceId:val('cl-src') || null,
      }]);
      await M.saveChain(Object.assign({}, c, { links }));
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'del-link'(el){
      const c = chs().filter(x => x.id === el.dataset.c)[0];
      if(!c) return;
      await M.saveChain(Object.assign({}, c,
        { links:(c.links || []).filter(l => l.id !== el.dataset.l) }));
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'del-chain'(el){
      await M.deleteChain(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },
  };

  const change = {
    async 'hist-query'(el){ S.ui.histQuery = el.value; ESP.App.render(); },
  };

  return {
    id:'history',
    title:'Kronoloji',
    headline(){
      const st = ESP.Chrono.status();
      if(st.cert === 'missing') return 'Zaman şeridi boş.';
      if(st.chains.unbalanced) return st.chains.unbalanced + ' zincirde yapısal koşul yok.';
      if(!st.chains.total) return st.events + ' olay var, hiçbiri zincirle açıklanmamış.';
      if(st.kinds.empty.length) return st.kinds.empty.join(', ') + ' alanından olay yok.';
      return st.events + ' olay, ' + st.chains.total + ' zincir.';
    },
    lede(){
      return 'Kaç olay bildiğin değil, kaçını kaynağıyla açıklayabildiğin sayılır. '
           + 'Kronoloji iskelet, zincir ve kaynak ettir.';
    },
    stats(){
      const st = ESP.Chrono.status();
      return [
        { value:String(st.events), label:'olay' },
        { value:st.eras.covered + '/' + st.eras.total, label:'dönem' },
        { value:String(st.chains.total), label:'zincir' },
        { value:st.sources.total ? st.sources.primary + '/' + st.sources.total : '—',
          label:'birincil kaynak' },
      ];
    },
    subtitle(){
      const st = ESP.Chrono.status();
      return st.cert === 'missing' ? 'boş şerit'
        : ESP.yearLabel(st.firstYear) + ' – ' + ESP.yearLabel(st.lastYear);
    },
    actions(){ return ''; },
    render, handle, change,
  };
})();
