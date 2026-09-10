/* Tahliller — Modül 1'in ekranı.

   Üç sekme:
     Paneller  ölçümlerin son durumu, referans aralığındaki yeri
     Eğilim    bir ölçümün kendi geçmişindeki yönü
     Geçmiş    girilen tahlil oturumları

   Giriş iki yoldan olur: raporu yapıştırmak (ayıklayıcı) ya da elle yazmak.
   Ayıklayıcı emin olamadığı satırı atmaz; «eşleşmedi» olarak gösterir. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.labs = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  const TABS = [
    { id:'panel', label:'Paneller' },
    { id:'trend', label:'Eğilim' },
    { id:'gecmis', label:'Geçmiş' },
  ];

  /* Yapistirma onizlemesi oturum boyunca burada durur; kaydedilene kadar
     hicbir sey depoya yazilmaz. */
  let preview = null;

  /* ---------------------------------------------------------- paneller */

  function panelCard(panel){
    const rows = SP.Bio.panelRows(panel.id);
    const has = rows.filter(r => r.value != null).length;
    const open = S.ui.labPanel === panel.id;
    return K.Collapsible({
      title:panel.name,
      meta:has ? has + '/' + rows.length + ' ölçüldü' : 'hiç ölçülmedi',
      act:'open-panel', data:{ 'data-id':panel.id }, open,
      body:html`
        <p class="small muted mt-2">${panel.note}</p>
        <div class="mt-10">${map(rows, r => P.markerRow(r, {
          trend:SP.Bio.trendOf(r.marker.id),
          verdict:SP.Bio.trendVerdict(r.marker.id, SP.Bio.trendOf(r.marker.id)),
        }))}</div>`,
    });
  }

  function attentionCard(){
    const rows = SP.Bio.attention().slice(0, 6);
    if(!rows.length){
      return K.Card({ title:'Dikkat isteyenler',
        body:K.Notice({ tone:'ok', body:'Referans ya da hedef bandın dışında bir ölçüm yok.' }) });
    }
    return K.Card({
      title:'Dikkat isteyenler', hint:'trend',
      sub:'Önem sırasına göre',
      body:K.Table({ tight:true,
        headers:['Ölçüm', { label:'Değer', num:true }, 'Durum', 'Eğilim'],
        rows:rows.map(a => [
          html`<button class="linkbtn" data-act="open-marker" data-id="${a.marker.id}">${a.marker.name}</button>`,
          html`<b class="num">${U.fmtNum(a.value)}</b> <span class="tiny dim">${a.marker.unit}</span>`,
          K.Badge({ label:a.status.label, tone:a.status.tone }),
          a.trend.ok
            ? html`${raw(UI.trend(a.trend.dir))} <span class="small">${a.verdict.label}</span>`
            : html`<span class="tiny dim">${a.trend.n}/${SP.Bio.MIN_POINTS} ölçüm</span>`,
        ]) }),
    });
  }

  function overdueCard(){
    const rows = SP.Bio.overdue();
    if(!rows.length) return null;
    return K.Card({ title:'Ölçüm borcu', sub:rows.length + ' panel',
      body:html`<div class="list">${map(rows, r => html`
        <div class="listitem"><div class="grow"><b class="small">${r.panel.name}</b>
          <div class="tiny dim">${r.note}</div></div>
          ${K.Badge({ label:r.days == null ? 'hiç' : r.days + ' gün', tone:'warn' })}</div>`)}</div>` });
  }

  /* ------------------------------------------------------------- egilim */

  function trendCard(){
    const id = S.ui.trendMarker;
    const b = SP.BIO_BY_ID[id];
    const series = M.seriesOf(id);
    const tr = SP.Bio.trendOf(id);
    const vd = SP.Bio.trendVerdict(id, tr);
    const r = SP.Bio.refFor(id);

    const measured = SP.BIOMARKERS.filter(x => M.seriesOf(x.id).length);
    const options = (measured.length ? measured : SP.BIOMARKERS)
      .map(x => ({ value:x.id, label:x.name }));

    return K.Card({
      title:'Bireysel eğilim', hint:'trend',
      sub:b ? b.name : '',
      actions:K.Select({ value:id, change:'pick-marker', options }),
      body:html`
        ${when(series.length < 2, () => K.Notice({ tone:'info',
          body:'Grafik için en az iki ölçüm gerekir. Şu an ' + series.length + ' var.' }))}
        ${when(series.length >= 2, () => html`
          ${raw(UI.lineChart([{ data:series.map(s => s.v) }], {
            labels:series.map(s => U.fmtShort(s.date)),
            band:r && r.optimal ? r.optimal : (r ? r.ref : null),
            height:200,
          }))}
          <div class="cols-3 mt-12">
            ${K.Stat({ label:'Son değer', value:U.fmtNum(series[series.length - 1].v), unit:b.unit })}
            ${K.Stat({ label:'Ölçüm sayısı', value:String(series.length) })}
            ${K.Stat({ label:'90 günde', value:tr.ok ? (tr.pct > 0 ? '+' : '') + U.fmtNet(tr.pct) : '—', unit:'%' })}
          </div>
          ${K.Notice({ tone:vd.tone === 'muted' ? 'info' : vd.tone, class:'mt-12',
            body:tr.ok ? vd.text : tr.note })}
          ${when(r && r.ref, () => html`<div class="mt-12">
            ${raw(UI.rangeBar(series[series.length - 1].v, r.ref, r.optimal, b.unit))}</div>`)}
          <p class="small muted mt-10">${b.note}</p>`)}`,
    });
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

  /* -------------------------------------------------------------- gecmis */

  function historyCard(){
    if(!S.labs.length){
      return K.Card({ title:'Tahlil geçmişi',
        body:P.empty('Henüz tahlil girilmedi.', 'Rapor yapıştır', 'open-paste') });
    }
    return K.Card({
      title:'Tahlil geçmişi', sub:S.labs.length + ' oturum',
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
    });
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
      title:'Tahlil raporunu yapıştır',
      subtitle:'Metni olduğu gibi yapıştır — değerler ayıklanıp şemaya oturur',
      wide:true,
      body:String(K.Stack([
        K.Notice({ tone:'info', body:'Ayıklayıcı emin olamadığı satırı atmaz. '
          + 'Eşleşmeyen satırlar aşağıda listelenir; istersen elle bağlarsın.' }),
        K.Field({ label:'Tahlil tarihi',
          input:K.Input({ id:'paste-date', type:'date', value:U.todayISO() }) }),
        K.Field({ label:'Laboratuvar (isteğe bağlı)',
          input:K.Input({ id:'paste-lab', placeholder:'Hangi laboratuvar?' }) }),
        K.Field({ label:'Rapor metni',
          input:K.Textarea({ id:'paste-text', rows:10,
            placeholder:'Hemoglobin      14,2   g/dL    13.5 - 17.5\nFerritin        28     ng/mL   30 - 400\n…' }) }),
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
              Değerleri elle girebilirsin.</p>` })),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-paste',
          disabled:!p.rows.filter(r => !r.skip).length })}`),
      noFocus:true,
    });
  }

  function manualSheet(){
    const panel = SP.PANELS.find(x => x.id === (S.ui.labPanel || 'hemogram')) || SP.PANELS[2];
    const markers = SP.BIOMARKERS.filter(b => b.panel === panel.id);
    UI.sheet({
      title:'Elle tahlil gir', subtitle:panel.name, wide:true,
      body:String(K.Stack([
        K.Field({ label:'Tarih', input:K.Input({ id:'man-date', type:'date', value:U.todayISO() }) }),
        K.Field({ label:'Panel',
          input:K.Select({ id:'man-panel', change:'pick-manual-panel', value:panel.id,
            options:SP.PANELS.map(p => ({ value:p.id, label:p.name })) }) }),
        html`<div class="grid-form">${map(markers, b => K.Field({
          label:b.name + ' (' + b.unit + ')',
          input:K.Input({ id:'man-' + b.id, type:'number', numeric:true, step:'any' }),
        }))}</div>`,
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-manual', data:{ 'data-panel':panel.id } })}`),
    });
  }

  /* --------------------------------------------------------------- ekran */

  async function render(){
    const tab = S.ui.labTab;
    const flags = M.openFlags();

    const body = tab === 'trend' ? K.Span(12, trendCard())
      : tab === 'gecmis' ? K.Span(12, historyCard())
      : K.Span(8, K.Stack([attentionCard(), map(SP.PANELS, panelCard)]));

    return String(K.Grid([
      when(flags.length, () => K.Span(12, K.Stack(map(flags, P.flagCard), 'sm'))),
      K.Span(12, K.Subtabs({ items:TABS, value:tab, act:'lab-tab', aria:'Tahlil görünümü' })),
      body,
      when(tab === 'panel', () => K.Span(4, K.Stack([
        K.Card({ title:'Değer ekle', hint:'lab-paste',
          body:html`<p class="small muted">Rapor metnini yapıştırmak elle yazmaktan
            hem hızlı hem daha az hatalıdır.</p>
            <div class="row wrap mt-12">
              ${K.Button({ label:'Rapor yapıştır', tone:'primary', size:'sm', act:'open-paste' })}
              ${K.Button({ label:'Elle gir', size:'sm', act:'open-manual' })}
            </div>` }),
        overdueCard(),
        K.Card({ title:'Hesaplanan ölçümler', hint:'derived',
          body:html`<ul class="bullets small muted">${map(Object.keys(SP.DERIVED), id => {
            const b = SP.BIO_BY_ID[id];
            return html`<li><b>${b.name}</b> — ${SP.DERIVED[id].note}</li>`;
          })}</ul>` }),
        K.Card({ title:'Sınır', body:html`<p class="small">${SP.CLINICAL.disclaimer}</p>` }),
      ]))),
      K.Span(12, raw(UI.rail(['ref-range', 'optimal-band', 'trend', 'red-flag', 'derived', 'lab-paste']))),
    ]));
  }

  const handle = {
    async 'lab-tab'(el){ S.ui.labTab = el.dataset.tab; SP.App.render(); },
    async 'open-panel'(el){
      S.ui.labPanel = S.ui.labPanel === el.dataset.id ? null : el.dataset.id;
      SP.App.render();
    },
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
      UI.sheet({ title:U.fmtDate(l.date), subtitle:l.lab || 'tahlil oturumu',
        wide:true, body:labSheetBody(l), noFocus:true,
        footer:String(K.Button({ label:'Kapat', act:'sheet-close' })) });
    },
    async 'del-lab'(el){
      const id = el.dataset.id;
      UI.confirmSheet('Tahlili sil', 'Bu oturumdaki bütün değerler silinir. Geri alınamaz.',
        async () => { await M.deleteLab(id); UI.closeSheet(); UI.toast('Silindi'); SP.App.render(); }, true);
    },
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
      const flags = M.openFlags().filter(f => !f.ack);
      UI.toast(n + ' değer kaydedildi' + (flags.length ? ' · ' + flags.length + ' kırmızı bayrak' : ''));
      SP.App.render();
    },
    async 'open-manual'(){ manualSheet(); },
    async 'save-manual'(el){
      const panel = el.dataset.panel;
      const date = (document.getElementById('man-date') || {}).value || U.todayISO();
      /* Ayni tarihte oturum varsa ustune yazilir; bir gunun tahlili tek kayittir. */
      const existing = S.labs.find(l => l.date === date);
      const rec = existing || M.newLab(date);
      let n = 0;
      SP.BIOMARKERS.filter(b => b.panel === panel).forEach(b => {
        const input = document.getElementById('man-' + b.id);
        if(!input || input.value.trim() === '') return;
        rec.values[b.id] = { v:Number(input.value.replace(',', '.')), cert:'measured', unit:b.unit };
        n++;
      });
      if(!n){ UI.toast('Hiç değer girilmedi'); return; }
      await M.saveLab(rec);
      UI.closeSheet();
      UI.toast(n + ' değer kaydedildi');
      SP.App.render();
    },
  };

  const change = {
    async 'pick-marker'(el){ S.ui.trendMarker = el.value; SP.App.render(); },
    async 'pick-manual-panel'(el){ S.ui.labPanel = el.value; manualSheet(); },
  };

  return {
    id:'labs',
    title:'Tahliller',
    subtitle(){
      const s = SP.Bio.summary();
      const f = M.openFlags().length;
      if(f) return f + ' kırmızı bayrak açık';
      return s.measured + ' ölçüm · ' + s.out + ' referans dışı · ' + s.offTarget + ' hedef dışı';
    },
    actions(){
      return String(K.Button({ label:'Rapor yapıştır', size:'sm', icon:'flask', act:'open-paste' }));
    },
    render, handle, change,
  };
})();
