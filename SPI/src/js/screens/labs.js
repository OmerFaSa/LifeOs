/* Testler — Modül 1'in ekranı.

   Önceki düzen ölçümleri ORGANA göre kutuluyordu: on iki panel, her biri
   açılır bir kutu, her kutunun içinde birkaç satır. Kullanıcı elinde tek
   bir hastane raporuyla gelir; o rapor organa göre değil, tek seferde
   çıkar. Panel panel gezinmek zorunda kalmak işi zorlaştırıyordu.

   Yeni düzen dört sayfadır:

     Sonuçlar  bütün ölçümler TEK düz listede, önem sırasına göre
     Test gir  kapsamlı bir hastane testinin tamamı tek formda
     Geçmiş    girilen test oturumları
     Eğilim    tek bir ölçümün kendi geçmişindeki yönü

   Panel artık bir yapı değil, bir SÜZGEÇtir: listeyi daraltır, listeyi
   bölmez. Girişte ise hiç yoktur — arama kutusu onun yerini alır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.labs = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  const TABS = [
    { id:'sonuc',  label:'Sonuçlar', icon:'layers' },
    { id:'giris',  label:'Test gir', icon:'flask' },
    { id:'gecmis', label:'Geçmiş',   icon:'clock' },
    { id:'trend',  label:'Eğilim',   icon:'chart' },
  ];

  /* Yapistirma onizlemesi oturum boyunca burada durur; kaydedilene kadar
     hicbir sey depoya yazilmaz. */
  let preview = null;

  /* Girise yazilan ama henuz kaydedilmemis degerler. Sekme degistirip
     geri donunce kaybolmasin diye ekranin disinda tutulur. */
  let draft = { date:U.todayISO(), lab:'', values:{} };

  function tabs(){
    const items = TABS.map(t => {
      if(t.id === 'gecmis' && S.labs.length) return Object.assign({}, t, { count:S.labs.length });
      const n = Object.keys(draft.values).length;
      if(t.id === 'giris' && n) return Object.assign({}, t, { count:n });
      return t;
    });
    return K.Subtabs({ items, value:S.ui.labTab, act:'lab-tab', aria:'Test görünümü' });
  }

  /* ------------------------------------------------------------ süzgeç */

  /* Ölçümü olan panel yoksa süzgeç çizilmez: boş bir süzgeç şeridi
     kullanıcıya seçenek değil, iş verir. */
  function panelFilter(){
    const counts = {};
    SP.BIOMARKERS.forEach(b => {
      if(!M.latestOf(b.id)) return;
      counts[b.panel] = (counts[b.panel] || 0) + 1;
    });
    const used = SP.PANELS.filter(p => counts[p.id]);
    if(used.length < 2) return '';

    const items = [{ id:'all', label:'Tümü', count:SP.Bio.summary().measured }]
      .concat(used.map(p => ({ id:p.id, label:p.name.replace(/\s*paneli$/i, ''), count:counts[p.id] })));
    return K.Subtabs({ items, value:S.ui.labFilter, act:'lab-filter', aria:'Panel süzgeci' });
  }

  /* ---------------------------------------------------------- sonuçlar */

  /* Tek düz liste. Sıra: kırmızı bayrak → referans dışı → hedef dışı →
     hedefte. İçinde arama yapılır, panele göre daraltılır. */
  function resultRows(){
    const q = (S.ui.labQuery || '').trim().toLocaleLowerCase('tr-TR');
    const filter = S.ui.labFilter || 'all';
    const rank = { danger:0, warn:1, info:2, ok:3, muted:4 };

    return SP.BIOMARKERS
      .map(b => {
        const last = M.latestOf(b.id);
        if(!last) return null;
        return { marker:b, value:last.v, at:last.date, cert:last.cert,
          status:SP.Bio.statusOf(b.id, last.v), ref:SP.Bio.refFor(b.id) };
      })
      .filter(Boolean)
      .filter(r => filter === 'all' || r.marker.panel === filter)
      .filter(r => !q || r.marker.name.toLocaleLowerCase('tr-TR').indexOf(q) >= 0
        || (r.marker.aliases || []).some(a => a.toLocaleLowerCase('tr-TR').indexOf(q) >= 0))
      .sort((a, b) => (rank[a.status.tone] ?? 9) - (rank[b.status.tone] ?? 9)
        || a.marker.name.localeCompare(b.marker.name, 'tr'));
  }

  function resultsView(){
    const rows = resultRows();
    const total = SP.Bio.summary().measured;

    if(!total){
      return K.Ledger([K.Entry({
        label:'Sonuçlar', meta:'kayıt yok',
        note:'Elindeki hastane raporunu yapıştır ya da dosyasını bırak; '
          + 'değerler kendiliğinden şemaya oturur.',
        action:K.Button({ label:'Rapor yapıştır', tone:'primary', act:'open-paste' }),
        body:P.empty('Henüz hiç test girilmedi.'),
      })]);
    }

    const missing = SP.BIOMARKERS.filter(b => !M.latestOf(b.id));
    const s = SP.Bio.summary();
    const last = S.labs.length ? S.labs[S.labs.length - 1] : null;

    return K.Ledger([
      K.Entry({
        label:'Sonuçlar',
        meta:total + ' ölçüm' + (last ? ' · ' + U.fmtDate(last.date) : ''),
        note:'Önem sırasına göre: önce bandın dışındakiler. Bir satıra '
          + 'tıklayınca referans aralığı, hedef bandı ve beslenme bağı açılır.',
        action:html`${K.Input({ id:'lab-q', value:S.ui.labQuery || '',
          placeholder:'Ölçüm ara…', aria:'Ölçüm ara', change:'lab-query', debounce:200 })}
          ${K.Button({ label:'Test gir', tone:'primary', act:'lab-tab',
            data:{ 'data-tab':'giris' } })}`,
        body:html`
          ${when(panelFilter(), () => raw(String(panelFilter())))}
          ${when(!rows.length, () => K.Notice({ tone:'info',
            body:'Bu süzgeçle eşleşen ölçüm yok.' }))}
          ${when(rows.length, () => html`<div class="reslist">${map(rows, r => {
            const tr = SP.Bio.trendOf(r.marker.id);
            return html`
              <button class="resrow" data-act="open-marker" data-id="${r.marker.id}">
                <span class="resrow__dot resrow__dot--${r.status.tone}" aria-hidden="true"></span>
                <span class="resrow__name">
                  <b>${r.marker.name}</b>
                  <span class="resrow__panel">${SP.PANEL_BY_ID[r.marker.panel]
                    ? SP.PANEL_BY_ID[r.marker.panel].name.replace(/\s*paneli$/i, '') : ''}</span>
                </span>
                <span class="resrow__val num">${U.fmtNum(r.value)}<small>${r.marker.unit}</small></span>
                <span class="resrow__bar">${when(r.ref,
                  () => raw(UI.rangeBar(r.value, r.ref.ref, r.ref.optimal, r.marker.unit, { bare:true })))}</span>
                <span class="resrow__status">${K.Badge({ label:r.status.label, tone:r.status.tone })}</span>
                <span class="resrow__trend tiny dim">${when(tr.ok,
                  () => html`${raw(UI.trend(tr.dir))}`)} ${r.at ? U.fmtShort(r.at) : ''}</span>
              </button>`;
          })}</div>`)}`,
      }),

      K.Entry({
        label:'Dağılım', meta:'durum sayımı',
        note:'Referans aralığı laboratuvarın normal saydığı yer; hedef bandı '
          + 'ise bu sistemin istediği daha dar yer. İkisi aynı şey değildir.',
        body:html`<div class="pair">
          <div>
            <div class="sidestat"><span class="sidestat__v">${s.measured}</span>
              <span class="sidestat__k">ölçüldü</span></div>
            <div class="sidestat"><span class="sidestat__v">${s.out}</span>
              <span class="sidestat__k">referans dışı</span></div>
          </div>
          <div>
            <div class="sidestat"><span class="sidestat__v">${s.offTarget}</span>
              <span class="sidestat__k">hedef dışı</span></div>
            <div class="sidestat"><span class="sidestat__v">${S.labs.length}</span>
              <span class="sidestat__k">test oturumu</span></div>
          </div>
        </div>`,
      }),

      when(missing.length, () => K.Entry({
        label:'Ölçülmemiş', meta:missing.length + ' ölçüm',
        note:'Bu ölçümler için hiç değer girilmedi. Eksik veri sıfır sayılmaz; '
          + 'hesaplarda yok kabul edilir.',
        body:html`<div class="chips">${map(missing, b => html`
          <span class="chip chip--muted">${b.name}</span>`)}</div>`,
      })),
    ]);
  }

  /* ---------------------------------------------------------- test gir

     Kapsamlı bir hastane testi tek formda girilir. Panel seçimi yoktur:
     rapor elinde nasıl duruyorsa öyle, yukarıdan aşağı yazılır. Arama
     kutusu uzun listeyi anında daraltır. */

  function entryView(){
    const q = (S.ui.labQuery || '').trim().toLocaleLowerCase('tr-TR');
    const list = SP.BIOMARKERS.filter(b => !SP.DERIVED[b.id]).filter(b => !q
      || b.name.toLocaleLowerCase('tr-TR').indexOf(q) >= 0
      || (b.aliases || []).some(a => a.toLocaleLowerCase('tr-TR').indexOf(q) >= 0));

    const filled = Object.keys(draft.values).length;

    return K.Ledger([
      K.Entry({
        label:'Oturum', meta:'tarih ve laboratuvar',
        note:'Aynı tarihe ikinci kez girilen değerler o oturumun üstüne yazılır.',
        action:K.Button({ label:'Rapor yapıştır', icon:'flask', tone:'primary',
          act:'open-paste' }),
        body:html`<div class="pair">
          ${K.Field({ label:'Test tarihi',
            input:K.Input({ id:'entry-date', type:'date', value:draft.date, change:'entry-date' }) })}
          ${K.Field({ label:'Laboratuvar', hint:'isteğe bağlı',
            input:K.Input({ id:'entry-lab', value:draft.lab, placeholder:'Hangi laboratuvar?',
              change:'entry-lab' }) })}
        </div>`,
      }),

      K.Entry({
        label:'Değerler', meta:list.length + ' satır',
        note:'Elindeki rapordaki bütün değerleri tek seferde yaz. Boş bıraktığın '
          + 'satır yok sayılır — sıfır olarak kaydedilmez.',
        action:K.Input({ id:'entry-q', value:S.ui.labQuery || '',
          placeholder:'Ölçüm ara…', change:'lab-query', debounce:200 }),
        body:html`
          ${when(!list.length, () => K.Notice({ tone:'info',
            body:'Bu adla bir ölçüm bulunamadı.' }))}
          <div class="entrygrid">${map(list, b => {
            const has = draft.values[b.id] != null;
            const lastv = M.latestOf(b.id);
            return html`
              <label class="${cls('entryrow', has && 'is-filled')}">
                <span class="entryrow__name">${b.name}
                  <span class="entryrow__unit">${b.unit}</span></span>
                <input class="entryrow__in num" type="number" step="any" inputmode="decimal"
                  id="e-${b.id}" data-change="entry-val" data-id="${b.id}"
                  value="${has ? draft.values[b.id] : ''}"
                  placeholder="${lastv ? U.fmtNum(lastv.v) : '—'}"
                  aria-label="${b.name + ' (' + b.unit + ')'}"/>
              </label>`;
          })}</div>
          <div class="entrybar">
            <span class="small">${filled ? filled + ' değer yazıldı' : 'Henüz değer yazılmadı'}
              ${when(filled, () => html`<span class="dim"> · kaydedilene kadar hiçbir şey yazılmaz</span>`)}</span>
            <span class="row-sm">
              ${when(filled, () => K.Button({ label:'Temizle', size:'sm', act:'entry-clear' }))}
              ${K.Button({ label:'Testi kaydet', tone:'primary', act:'entry-save', disabled:!filled })}
            </span>
          </div>`,
      }),
    ]);
  }

  /* ------------------------------------------------------------- eğilim */

  function trendView(){
    const id = S.ui.trendMarker;
    const b = SP.BIO_BY_ID[id];
    const series = M.seriesOf(id);
    const tr = SP.Bio.trendOf(id);
    const vd = SP.Bio.trendVerdict(id, tr);
    const r = SP.Bio.refFor(id);

    const measured = SP.BIOMARKERS.filter(x => M.seriesOf(x.id).length);
    const options = (measured.length ? measured : SP.BIOMARKERS)
      .map(x => ({ value:x.id, label:x.name }));

    return K.Ledger([
      K.Entry({
        wide:true,
        label:b ? b.name : 'Eğilim',
        meta:series.length + ' ölçüm',
        note:'Bir ölçüm başkasıyla değil, KENDİ geçmişiyle kıyaslanır. '
          + 'Yön en az ' + SP.Bio.MIN_POINTS + ' ölçümle söylenir.',
        action:K.Select({ value:id, change:'pick-marker', options }),
        body:html`
          ${when(series.length < 2, () => K.Notice({ tone:'info',
            body:'Grafik için en az iki ölçüm gerekir. Şu an ' + series.length + ' var.' }))}
          ${when(series.length >= 2, () => html`
            ${raw(UI.lineChart([{ data:series.map(s2 => s2.v) }], {
              labels:series.map(s2 => U.fmtShort(s2.date)),
              band:r && r.optimal ? r.optimal : (r ? r.ref : null),
              height:230,
            }))}
            <div class="pair">
              <div>
                <div class="sidestat"><span class="sidestat__v">${U.fmtNum(series[series.length - 1].v)}<small>${b.unit}</small></span>
                  <span class="sidestat__k">son değer</span></div>
              </div>
              <div>
                <div class="sidestat"><span class="sidestat__v">${tr.ok ? (tr.pct > 0 ? '+' : '') + U.fmtNet(tr.pct) : '—'}<small>%</small></span>
                  <span class="sidestat__k">90 günde</span></div>
              </div>
            </div>
            ${K.Notice({ tone:vd.tone === 'muted' ? 'info' : vd.tone,
              body:tr.ok ? vd.text : tr.note })}
            ${when(r && r.ref, () => raw(UI.rangeBar(series[series.length - 1].v, r.ref, r.optimal, b.unit)))}
            <p class="small muted">${b.note}</p>`)}`,
      }),
    ]);
  }

  function markerSheetBody(id){
    const b = SP.BIO_BY_ID[id];
    const series = M.seriesOf(id);
    const r = SP.Bio.refFor(id);
    const tr = SP.Bio.trendOf(id);
    const vd = SP.Bio.trendVerdict(id, tr);
    const last = series.length ? series[series.length - 1] : null;

    return String(K.Stack([
      when(last, () => html`<div class="markerrow">
        <div class="markerrow__head"><span class="markerrow__name">${b.name}</span>
          ${K.Badge({ label:SP.Bio.statusOf(id, last.v).label, tone:SP.Bio.statusOf(id, last.v).tone })}</div>
        <div class="markerrow__val num">${U.fmtNum(last.v)}<small>${b.unit}</small></div>
        <div class="markerrow__bar">${raw(UI.rangeBar(last.v, r.ref, r.optimal, b.unit))}</div>
        <p class="markerrow__note">${SP.Bio.statusNote(id, last.v)}</p>
      </div>`),
      K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
        ['Referans aralığı', r.ref ? U.fmtNum(r.ref[0]) + ' – ' + U.fmtNum(r.ref[1]) + ' ' + b.unit : '—'],
        ['Hedef bant', r.optimal ? U.fmtNum(r.optimal[0]) + ' – ' + U.fmtNum(r.optimal[1]) + ' ' + b.unit : 'tanımlı değil'],
        ['Kırmızı bayrak', [r.red.below != null ? '< ' + r.red.below : null,
          r.red.above != null ? '> ' + r.red.above : null].filter(Boolean).join(' · ') || 'tanımlı değil'],
        ['Eğilim', tr.ok ? vd.text : tr.note],
        ['Ölçüm sayısı', String(series.length)],
      ] }),
      when(b.nutrients && b.nutrients.length, () => K.Notice({ tone:'info',
        title:'Beslenme bağı:',
        body:b.nutrients.map(n => SP.NUTRI_BY_ID[n] ? SP.NUTRI_BY_ID[n].name : n).join(', ')
          + ' bu ölçümle ilişkilidir. Ölçüm hedefin altındaysa beslenme hedefi kendiliğinden yükselir.' })),
      html`<p class="small muted">${b.note}</p>`,
      when(b.derived, () => K.Notice({ tone:'info', title:'Hesaplanan ölçüm:',
        body:SP.DERIVED[b.derived].note + '. Girdilerden biri eksikse hiç yazılmaz.' })),
    ]));
  }

  /* -------------------------------------------------------------- geçmiş */

  function historyView(){
    if(!S.labs.length){
      return K.Ledger([K.Entry({
        label:'Geçmiş', meta:'kayıt yok',
        action:K.Button({ label:'Rapor yapıştır', tone:'primary', act:'open-paste' }),
        body:P.empty('Henüz test girilmedi.'),
      })]);
    }
    return K.Ledger([K.Entry({
      label:'Geçmiş', meta:S.labs.length + ' oturum',
      note:'Her satır bir test oturumudur. Aynı güne ikinci kez girilen '
        + 'değerler o oturumun üstüne yazılır.',
      body:html`<div class="list">${map(S.labs.slice().reverse(), l => html`
        <div class="listitem">
          <div class="grow">
            <b class="small">${U.fmtDate(l.date)}</b>
            ${when(l.lab, () => html`<span class="tiny dim"> · ${l.lab}</span>`)}
            <div class="tiny dim">${Object.keys(l.values).length} değer
              · ${l.source === 'paste' ? 'yapıştırıldı' : 'elle girildi'}</div>
          </div>
          ${K.Button({ label:'Aç', size:'sm', act:'open-lab', data:{ 'data-id':l.id } })}
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'Sil',
            act:'del-lab', data:{ 'data-id':l.id } })}
        </div>`)}</div>`,
    })]);
  }

  function labSheetBody(l){
    const rows = Object.keys(l.values).map(id => {
      const b = SP.BIO_BY_ID[id];
      if(!b) return null;
      const cell = l.values[id];
      const st = SP.Bio.statusOf(id, cell.v);
      return [b.name, html`<b class="num">${U.fmtNum(cell.v)}</b> <span class="tiny dim">${b.unit}</span>`,
        K.Badge({ label:st.label, tone:st.tone }), P.cert(cell.cert)];
    }).filter(Boolean);
    return String(K.Stack([
      K.Table({ tight:true, headers:['Ölçüm', { label:'Değer', num:true }, 'Durum', 'Kaynak'], rows }),
      when(l.note, () => html`<p class="small">${l.note}</p>`),
    ]));
  }

  /* ---------------------------------------------------------- yapistirma */

  function pasteSheet(){
    UI.sheet({
      title:'Test raporunu yapıştır',
      subtitle:'Metni olduğu gibi yapıştır — değerler ayıklanıp şemaya oturur',
      wide:true,
      body:String(K.Stack([
        K.Drop({ act:'lab-file', label:'Rapor dosyası ya da fotoğrafı',
          icon:'file', accept:'.txt,.csv,.md,image/*',
          hint:'Metin dosyası modelsiz okunur · fotoğraf için model gerekir' }),
        K.Notice({ tone:'info', body:'Ayıklayıcı emin olamadığı satırı atmaz. '
          + 'Eşleşmeyen satırlar aşağıda listelenir; istersen elle bağlarsın.' }),
        html`<div class="cols-2">
          ${K.Field({ label:'Test tarihi',
            input:K.Input({ id:'paste-date', type:'date', value:draft.date }) })}
          ${K.Field({ label:'Laboratuvar (isteğe bağlı)',
            input:K.Input({ id:'paste-lab', placeholder:'Hangi laboratuvar?' }) })}
        </div>`,
        K.Field({ label:'Rapor metni',
          input:html`<div class="withmic">
            ${K.Textarea({ id:'paste-text', rows:9,
              placeholder:'Hemoglobin      14,2   g/dL    13.5 - 17.5\nFerritin        28     ng/mL   30 - 400\n…' })}
            ${K.Mic({ target:'paste-text' })}
          </div>` }),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Ayıkla', tone:'primary', act:'run-paste' })}`),
    });
  }

  function previewSheet(){
    const p = preview;
    return UI.sheet({
      title:'Ayıklanan değerler', subtitle:p.note, wide:true,
      body:String(K.Stack([
        when(p.rows.length, () => html`<div>${map(p.rows, (r, i) => html`
          <div class="${r.skip ? 'pasterow pasterow--off' : 'pasterow'}">
            ${K.Checkbox({ label:'', checked:!r.skip, act:'toggle-row', data:{ 'data-i':i } })}
            <span><b class="small">${r.marker.name}</b>
              ${when(r.converted, () => html` <span class="tiny dim">${r.from} → ${r.to} çevrildi</span>`)}
              ${when(r.mismatch, () => html` <span class="tiny">${K.Badge({ label:'birim ' + r.mismatch, tone:'warn' })}</span>`)}
            </span>
            <span class="pasterow__val num">${U.fmtNum(r.value)} ${r.marker.unit}</span>
            <span class="pasterow__src">${r.line}</span>
          </div>`)}</div>`),
        when(!p.rows.length, () => K.Notice({ tone:'warn', body:p.note })),
        when(p.unmatched.length, () => K.Collapsible({
          title:'Eşleşmeyen satırlar', meta:p.unmatched.length + ' satır',
          act:'toggle-unmatched', open:!!S.ui.pasteUnmatchedOpen,
          body:html`<ul class="bullets small muted mt-10">
            ${map(p.unmatched.slice(0, 40), x => html`<li>${x.line}</li>`)}</ul>
            <p class="small muted">Bu satırlarda bilinen bir ölçüm adı bulunamadı.
              Değerleri «Test gir» sayfasından elle yazabilirsin.</p>` })),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-paste',
          disabled:!p.rows.filter(r => !r.skip).length })}`),
      noFocus:true,
    });
  }

  /* --------------------------------------------------------------- ekran */

  async function render(){
    const tab = S.ui.labTab;
    const flags = M.openFlags();

    return String(html`
      ${when(flags.length, () => html`<div class="stack-sm mb-16">${map(flags, P.flagCard)}</div>`)}
      <div class="mb-20">${tabs()}</div>
      ${tab === 'giris' ? entryView()
        : tab === 'gecmis' ? historyView()
        : tab === 'trend' ? trendView()
        : resultsView()}
      ${when(tab === 'sonuc', () => html`<div class="mt-24">
        ${P.clinicalNote()}</div>`)}
      <div class="mt-24">${raw(UI.rail(['ref-range', 'optimal-band', 'trend', 'red-flag', 'derived', 'lab-paste']))}</div>`);
  }

  const handle = {
    async 'lab-tab'(el){ S.ui.labTab = el.dataset.tab; S.ui.labQuery = ''; SP.App.render(); },
    async 'lab-filter'(el){ S.ui.labFilter = el.dataset.tab; SP.App.render(); },
    async 'toggle-empty'(){ S.ui.labShowEmpty = !S.ui.labShowEmpty; SP.App.render(); },
    async 'open-marker'(el){
      const b = SP.BIO_BY_ID[el.dataset.id];
      UI.sheet({ title:b.name, subtitle:b.unit, wide:true,
        body:markerSheetBody(b.id), noFocus:true,
        footer:String(html`${K.Button({ label:'Kapat', act:'sheet-close' })}
          ${K.Button({ label:'Eğilimi aç', tone:'primary', act:'goto-trend', data:{ 'data-id':b.id } })}`) });
    },
    async 'goto-trend'(el){
      S.ui.trendMarker = el.dataset.id;
      S.ui.labTab = 'trend';
      UI.closeSheet();
      SP.App.render();
    },
    async 'open-lab'(el){
      const l = S.labs.find(x => x.id === el.dataset.id);
      if(!l) return;
      UI.sheet({ title:U.fmtDate(l.date), subtitle:l.lab || 'test oturumu',
        wide:true, body:labSheetBody(l), noFocus:true,
        footer:String(K.Button({ label:'Kapat', act:'sheet-close' })) });
    },
    /* Onay kagidi yerine GERI ALMA: silinen oturum bellekte tutulur ve
       bildirimdeki dugmeyle geri yazilir. Daha hizli ve daha nazik. */
    async 'del-lab'(el){
      const id = el.dataset.id;
      const rec = S.labs.find(x => x.id === id);
      if(!rec) return;
      const copy = JSON.parse(JSON.stringify(rec));
      await M.deleteLab(id);
      S.ui.undo = { restore:() => M.saveLab(copy) };
      UI.toast(U.fmtDate(copy.date) + ' testi silindi', { undo:true });
      SP.App.render();
    },

    /* ---- kapsamlı giriş ---- */
    async 'entry-clear'(){
      draft.values = {};
      UI.toast('Giriş temizlendi');
      SP.App.render();
    },
    async 'entry-save'(){
      const ids = Object.keys(draft.values);
      if(!ids.length){ UI.toast('Hiç değer yazılmadı'); return; }
      /* Ayni tarihte oturum varsa ustune yazilir; bir gunun testi tek kayittir. */
      const existing = S.labs.find(l => l.date === draft.date);
      const rec = existing || M.newLab(draft.date);
      if(draft.lab) rec.lab = draft.lab;
      ids.forEach(id => {
        const b = SP.BIO_BY_ID[id];
        if(!b) return;
        rec.values[id] = { v:draft.values[id], cert:'measured', unit:b.unit };
      });
      await M.saveLab(rec);
      draft = { date:U.todayISO(), lab:'', values:{} };
      S.ui.labTab = 'sonuc';
      const flags = M.openFlags().filter(f => !f.ack);
      UI.toast(ids.length + ' değer kaydedildi'
        + (flags.length ? ' · ' + flags.length + ' kırmızı bayrak' : ''));
      SP.App.render();
    },

    /* ---- yapıştırma ---- */
    async 'open-paste'(){ pasteSheet(); },
    async 'run-paste'(){
      const text = (document.getElementById('paste-text') || {}).value || '';
      const date = (document.getElementById('paste-date') || {}).value || U.todayISO();
      const lab = (document.getElementById('paste-lab') || {}).value || '';
      preview = SP.Parse.parseLab(text);
      preview.date = date; preview.lab = lab;
      previewSheet();
    },
    async 'toggle-row'(el){
      const i = Number(el.dataset.i);
      if(!preview || !preview.rows[i]) return;
      preview.rows[i].skip = !el.checked;
      previewSheet();
    },
    async 'toggle-unmatched'(){
      S.ui.pasteUnmatchedOpen = !S.ui.pasteUnmatchedOpen;
      previewSheet();
    },
    async 'save-paste'(){
      if(!preview) return;
      const rec = SP.Parse.toLabRecord(preview, preview.date, { lab:preview.lab });
      const n = Object.keys(rec.values).length;
      if(!n){ UI.toast('Kaydedilecek değer yok'); return; }
      await M.saveLab(rec);
      preview = null;
      UI.closeSheet();
      S.ui.labTab = 'sonuc';
      const flags = M.openFlags().filter(f => !f.ack);
      UI.toast(n + ' değer kaydedildi' + (flags.length ? ' · ' + flags.length + ' kırmızı bayrak' : ''));
      SP.App.render();
    },
  };

  const change = {
    /* Dosya hem tiklayarak hem surukleyerek gelir; ikisi de buraya duser. */
    async 'lab-file'(el){
      const file = el.files && el.files[0];
      if(!file) return;
      UI.toast('Okunuyor…');
      preview = await SP.Extract.fromLabFile(file);
      preview.date = (document.getElementById('paste-date') || {}).value || U.todayISO();
      preview.lab = (document.getElementById('paste-lab') || {}).value || '';
      if(!preview.rows.length){ UI.toast(preview.note); return; }
      previewSheet();
    },
    async 'pick-marker'(el){ S.ui.trendMarker = el.value; SP.App.render(); },
    async 'lab-query'(el){ S.ui.labQuery = el.value; SP.App.render(); },
    async 'entry-date'(el){ draft.date = el.value || U.todayISO(); },
    async 'entry-lab'(el){ draft.lab = el.value; },
    /* Her tuşta yeniden çizmez: değer taslakta durur, sayaç kaydetmede
       güncellenir. Uzun formda her hanede sayfayı çizmek yazmayı bozar. */
    async 'entry-val'(el){
      const id = el.dataset.id;
      const raw0 = String(el.value || '').trim().replace(',', '.');
      if(raw0 === ''){ delete draft.values[id]; }
      else{
        const n = Number(raw0);
        if(!isFinite(n)) return;
        draft.values[id] = n;
      }
      el.closest('.entryrow').classList.toggle('is-filled', draft.values[id] != null);
      const bar = document.querySelector('.entrybar .small');
      const n2 = Object.keys(draft.values).length;
      if(bar) bar.textContent = n2 ? n2 + ' değer yazıldı' : 'Henüz değer yazılmadı';
      const save = document.querySelector('[data-act="entry-save"]');
      if(save) save.disabled = !n2;
    },
  };

  return {
    id:'labs',
    title:'Testler',

    /* Başlık durumun kendisidir: ekranın adı zaten üstte yazıyor. */
    headline(){
      const f = M.openFlags().filter(x => !x.ack).length;
      if(f) return f + ' kırmızı bayrak açık.';
      const s = SP.Bio.summary();
      if(!s.measured) return 'Henüz test girilmedi.';
      if(s.out) return s.out + ' ölçüm referans aralığının dışında.';
      if(s.offTarget) return s.offTarget + ' ölçüm hedef bandın dışında.';
      return 'Ölçümlerin tamamı hedef bandın içinde.';
    },
    lede(){
      const s = SP.Bio.summary();
      if(!s.measured){
        return 'Herhangi bir kapsamlı hastane testinin sonucunu tek seferde girebilirsin. '
          + 'Raporun metnini yapıştırman yeterli; değerler kendiliğinden şemaya oturur.';
      }
      return s.measured + ' ölçüm kayıtlı. Değerler organa göre bölünmez; '
        + 'tek listede, önem sırasına göre durur.';
    },
    stats(){
      const s = SP.Bio.summary();
      if(!s.measured) return [];
      return [
        { value:s.measured, label:'ölçüm' },
        { value:s.out, label:'referans dışı' },
        { value:s.offTarget, label:'hedef dışı' },
        { value:S.labs.length, label:'test' },
      ];
    },
    subtitle(){
      const s = SP.Bio.summary();
      return s.measured + ' ölçüm · ' + s.out + ' referans dışı';
    },
    actions(){
      return String(html`${K.Button({ label:'Test gir', icon:'flask', tone:'primary', size:'sm',
        act:'lab-tab', data:{ 'data-tab':'giris' } })}
        ${K.Button({ label:'Rapor yapıştır', size:'sm', act:'open-paste' })}`);
    },
    render, handle, change,
  };
})();
