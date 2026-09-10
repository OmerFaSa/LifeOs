/* Günlük ölçüm — vital bulgular, vücut ölçüleri ve günün hissi.

   Bu ekran toparlanma skorunun hammaddesini toplar. Hiçbir alan zorunlu
   değildir: eksik girdi sıfır sayılmaz, ağırlığı kalan girdilere dağıtılır.
   Cihazı olmayan kullanıcı da uyku ve nabızla anlamlı bir skor alır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.vitals = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  function shownDate(){ return S.ui.mealDate || U.todayISO(); }

  /* Girilecek alanlar tek yerde tanimlanir; form da, kaydetme de bunu okur. */
  const FIELDS = [
    { id:'sleep',    label:'Uyku (saat)',        step:'0.5', min:0,  max:16,  marker:'sleep' },
    { id:'rhr',      label:'İstirahat nabzı',    step:'1',   min:30, max:140, marker:'rhr' },
    { id:'hrv',      label:'HRV (ms)',           step:'1',   min:5,  max:250, marker:'hrv' },
    { id:'sbp',      label:'Büyük tansiyon',     step:'1',   min:60, max:250, marker:'sbp' },
    { id:'dbp',      label:'Küçük tansiyon',     step:'1',   min:30, max:160, marker:'dbp' },
    { id:'spo2',     label:'Oksijen (%)',        step:'1',   min:70, max:100, marker:'spo2' },
    { id:'temp',     label:'Ateş (°C)',          step:'0.1', min:33, max:43,  marker:'temp' },
    { id:'weight',   label:'Kilo (kg)',          step:'0.1', min:20, max:250, marker:'weight' },
    { id:'waist',    label:'Bel çevresi (cm)',   step:'0.5', min:40, max:200, marker:'waist' },
    { id:'bodyfat',  label:'Yağ oranı (%)',      step:'0.1', min:3,  max:60,  marker:'bodyfat' },
    { id:'water',    label:'Su (ml)',            step:'100', min:0,  max:8000, marker:null },
  ];

  const SORENESS = [
    { value:1, label:'1 · bitkin' }, { value:2, label:'2 · yorgun' },
    { value:3, label:'3 · normal' }, { value:4, label:'4 · iyi' },
    { value:5, label:'5 · zinde' },
  ];

  function formCard(){
    const d = shownDate();
    const v = M.vitalsOf(d) || M.defaultVitals(d);
    return K.Card({
      title:U.fmtDate(d) + ' ölçümleri',
      sub:'Boş bıraktığın alan sıfır sayılmaz',
      actions:K.Segmented({ act:'shift-day', value:'', aria:'Gün değiştir', items:[
        { value:'-1', label:'‹ önceki' }, { value:'0', label:'bugün' }, { value:'1', label:'sonraki ›' },
      ] }),
      body:html`
        <div class="grid-form mt-4">${map(FIELDS, f => K.Field({
          label:f.label,
          input:K.Input({ id:'v-' + f.id, type:'number', numeric:true, step:f.step,
            min:f.min, max:f.max, value:v[f.id] == null ? '' : v[f.id] }),
        }))}</div>
        <div class="mt-12">${K.Field({ label:'Bugün nasıl hissediyorsun?',
          hint:'cihazın göremediği tek girdi',
          input:K.Segmented({ act:'set-soreness', value:v.soreness == null ? '' : String(v.soreness),
            items:SORENESS, block:true, aria:'Günün hissi' }) })}</div>
        <div class="mt-12">${K.Field({ label:'Not',
          input:K.Textarea({ id:'v-note', rows:2, value:v.note || '',
            placeholder:'Hastalık, ilaç değişikliği, olağandışı bir gün…' }) })}</div>`,
      foot:html`${K.Button({ label:'Kaydet', tone:'primary', act:'save-vitals' })}
        <span class="small dim">Kaydettiğinde toparlanma skoru ve kırmızı bayraklar yeniden hesaplanır.</span>`,
    });
  }

  /* Girilen degerin referans araligindaki yeri hemen gorunur. */
  function statusCard(){
    const d = shownDate();
    const v = M.vitalsOf(d);
    if(!v) return null;
    const rows = FIELDS.filter(f => f.marker && v[f.id] != null).map(f => {
      const b = SP.BIO_BY_ID[f.marker];
      const r = SP.Bio.refFor(f.marker);
      return { marker:b, value:v[f.id], at:d, cert:'measured',
        status:SP.Bio.statusOf(f.marker, v[f.id]), ref:r.ref, optimal:r.optimal };
    });
    if(!rows.length) return null;
    return K.Card({ title:'Girilen değerler nerede duruyor?', hint:'ref-range',
      body:html`${map(rows, r => P.markerRow(r, {}))}` });
  }

  function readinessCard(){
    const r = SP.Move.readiness(shownDate());
    if(!r.ok) return K.Card({ title:'Toparlanma', hint:'readiness',
      body:K.Notice({ tone:'info', body:r.note }) });
    return K.Card({
      title:'Toparlanma', hint:'readiness',
      badge:K.Badge({ label:r.band.label, tone:r.band.tone }),
      body:html`
        <div class="kpi"><span class="kpi__value">${r.score}</span><span class="kpi__unit">/ 100</span></div>
        <div class="mt-8">${K.Bar({ value:r.score, tone:r.band.tone })}</div>
        <div class="mt-10">${map(r.parts, p => html`
          <div class="${p.score == null ? 'readypart readypart--off' : 'readypart'}">
            <span class="readypart__label">${p.label}</span>
            <span class="small dim">${p.score == null ? 'girilmedi' : U.fmtNum(U.round(p.value, 1))} · ağırlık %${Math.round(p.weight * 100)}</span>
            <span class="readypart__score num">${p.score == null ? '—' : Math.round(p.score)}</span>
            <span class="readypart__note">${p.note}</span>
          </div>`)}</div>
        ${K.Notice({ tone:r.band.tone === 'ok' ? 'ok' : r.band.tone, class:'mt-10', body:r.band.order })}`,
    });
  }

  function baselineCard(){
    const rows = [['hrv', 'HRV'], ['rhr', 'İstirahat nabzı'], ['sleep', 'Uyku'], ['weight', 'Kilo']]
      .map(([key, label]) => {
        const b = SP.Move.baseline(key);
        return [label, b ? html`<b class="num">${U.fmtNet(b.mean)}</b>` : html`<span class="dim">—</span>`,
          b ? b.n + ' gün' : 'en az 3 gün gerekir'];
      });
    return K.Card({ title:'Kişisel taban çizgin', sub:'Son 30 gün, bugün hariç',
      body:html`${K.Table({ tight:true, headers:['Ölçüm', { label:'Ortalama', num:true }, 'Kapsam'], rows })}
        <p class="small muted mt-10">HRV ve nabız mutlak değil kişisel ölçektir: kendi ortalamana göre
          okunur, başkasınınkiyle karşılaştırılmaz.</p>` });
  }

  function historyCard(){
    const days = [];
    for(let i = 13; i >= 0; i--) days.push(U.iso(U.addDays(U.today(), -i)));
    const rows = days.filter(d => S.vitals[d]).reverse().map(d => {
      const v = S.vitals[d];
      const r = SP.Move.readiness(d);
      return [
        html`<button class="linkbtn" data-act="open-day" data-date="${d}">${U.fmtShort(d)}</button>`,
        v.sleep == null ? '—' : U.fmtNet(v.sleep),
        v.rhr == null ? '—' : U.fmtNum(v.rhr),
        v.hrv == null ? '—' : U.fmtNum(v.hrv),
        r.ok ? K.Badge({ label:String(r.score), tone:r.band.tone }) : html`<span class="dim">—</span>`,
      ];
    });
    if(!rows.length) return null;
    return K.Card({ title:'Son iki hafta',
      body:K.Table({ tight:true,
        headers:['Gün', { label:'Uyku', num:true }, { label:'Nabız', num:true },
          { label:'HRV', num:true }, 'Toparlanma'],
        rows }) });
  }

  async function render(){
    return String(K.Grid([
      K.Span(7, K.Stack([formCard(), statusCard(), historyCard()])),
      K.Span(5, K.Stack([readinessCard(), baselineCard(),
        K.Card({ title:'Neden bu ölçümler?',
          body:html`<ul class="bullets small muted">
            ${map(SP.READINESS_INPUTS, i => html`<li><b>${i.label}</b> — ${i.note}</li>`)}
          </ul>` })])),
      K.Span(12, raw(UI.rail(['readiness', 'ref-range', 'certainty']))),
    ]));
  }

  const handle = {
    async 'shift-day'(el){
      const n = Number(el.dataset.value);
      S.ui.mealDate = n === 0 ? null : U.iso(U.addDays(U.parse(shownDate()), n));
      if(S.ui.mealDate === U.todayISO()) S.ui.mealDate = null;
      SP.App.render();
    },
    async 'open-day'(el){
      S.ui.mealDate = el.dataset.date === U.todayISO() ? null : el.dataset.date;
      SP.App.render();
    },
    async 'set-soreness'(el){
      await M.saveVitals(shownDate(), { soreness:Number(el.dataset.value) });
      SP.App.render();
    },
    async 'save-vitals'(){
      const patch = {};
      FIELDS.forEach(f => {
        const el = document.getElementById('v-' + f.id);
        if(!el) return;
        const raw = el.value.trim();
        patch[f.id] = raw === '' ? null : Number(raw.replace(',', '.'));
      });
      const note = document.getElementById('v-note');
      if(note) patch.note = note.value.trim();
      await M.saveVitals(shownDate(), patch);
      const flags = M.openFlags().filter(f => !f.ack);
      UI.toast(flags.length ? 'Kaydedildi — ' + flags.length + ' kırmızı bayrak açık' : 'Kaydedildi');
      SP.App.render();
    },
  };

  return {
    id:'vitals',
    title:'Günlük ölçüm',
    headline(){
      const r = SP.Move.readiness(shownDate());
      if(!r.ok) return 'Bugünün ölçümü girilmedi.';
      return 'Toparlanma ' + r.band.label.toLocaleLowerCase('tr-TR') + '.';
    },
    lede(){
      const r = SP.Move.readiness(shownDate());
      if(!r.ok) return 'Uyku süresi tek başına bile anlamlı bir toparlanma skoru üretir. '
        + 'Girilmeyen ölçüm sıfır sayılmaz; ağırlığı kalan girdilere dağıtılır.';
      return r.band.order
        + (r.missing.length ? ' Eksik girdi: ' + r.missing.join(', ') + '.' : '');
    },
    stats(){
      const r = SP.Move.readiness(shownDate());
      if(!r.ok) return [];
      return [{ value:r.score, unit:'/100', label:'toparlanma' }]
        .concat(r.parts.filter(p => p.score != null).slice(0, 3)
          .map(p => ({ value:Math.round(p.score), label:p.label.toLocaleLowerCase('tr-TR') })));
    },
    subtitle(){
      const d = shownDate();
      const r = SP.Move.readiness(d);
      return U.fmtDate(d) + (r.ok ? ' · toparlanma ' + r.score : ' · ölçüm bekliyor');
    },
    actions(){ return ''; },
    render, handle,
  };
})();
