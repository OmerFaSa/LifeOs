/* Deklaratif bilesen seti.

   Her bilesen tek ve net bir API'ye sahiptir; varyantlar acik "modifier"
   alanlariyla gelir (ornegin tone:'ok'). Hepsi h.raw doner, ic ice gecebilir.

   Kullanim:
     C.Card({ title:'Deneme hacmi', sub:'Plan / gerçekleşen', body: C.Table(...) })
     C.Button({ label:'Kaydet', tone:'primary', act:'save-exam' })

   Not: eski SP.UI yardimcilari bu setin ustune ince sarmalayici olarak durur;
   ekranlar kademeli olarak C.* API'sine gecirilir. */

window.SP = window.SP || {};

SP.C = (function(){
  const { html, raw, when, cls, attrs, map } = SP.h;
  const icon = name => raw(SP.UI.icon(name));

  /* ---------- yapisal ---------- */

  /* Card: tek kart stili. Vurgu icin renkli kenarlik yerine rozet kullanilir. */
  function Card(o){
    const head = (o.title || o.sub || o.badge || o.actions) ? html`
      <div class="card__head">
        <div>
          ${when(o.title, () => html`<h3>${o.title}${when(o.hint, () => raw(SP.UI.hint(o.hint)))}</h3>`)}
          ${when(o.sub, () => html`<p>${o.sub}</p>`)}
        </div>
        ${when(o.badge, o.badge)}
        ${when(o.actions, o.actions)}
      </div>` : '';
    return html`
      <section class="${cls('card', o.flat && 'card--flat', o.pad === 'sm' && 'card--pad-sm', o.class)}"
               ${when(o.id, () => attrs({ id:o.id }))}>
        ${head}
        ${o.body}
        ${when(o.foot, () => html`<div class="card__foot">${o.foot}</div>`)}
      </section>`;
  }

  /* Katlanir kart: uzun referans metinleri varsayilan olarak kapali tutar. */
  function Collapsible(o){
    return html`
      <section class="card">
        <button class="collapse__btn" data-act="${o.act}" ${attrs(o.data || {})}
                aria-expanded="${o.open ? 'true' : 'false'}">
          <span class="row-sm"><h3 class="collapse__title">${o.title}</h3>${when(o.meta, () => html`<span class="tiny dim">${o.meta}</span>`)}</span>
          <span class="${cls('collapse__chev', o.open && 'is-open')}">${icon('down')}</span>
        </button>
        ${when(o.open, o.body)}
      </section>`;
  }

  /* ---------- olcum ---------- */

  /* progress: 0–100. Sayinin yaninda "hedefin neresindeyim" seridi cizer —
     ciplak bir sayi ile dolulugu gorunen bir sayi ayni sey degildir.
     Deger anlamsizsa (hesaplanamiyorsa) alan hic verilmez, serit cizilmez. */
  function Stat(o){
    const pct = o.progress == null ? null : Math.max(0, Math.min(100, Number(o.progress) || 0));
    return html`
      <div class="${cls('stat', o.tone && 'stat--'+o.tone)}">
        <span class="stat__label">${o.label}${when(o.hint, () => raw(SP.UI.hint(o.hint)))}</span>
        <span class="stat__value">${o.value}${when(o.unit, () => html`<small>${o.unit}</small>`)}</span>
        ${when(o.spark, o.spark)}
        ${when(pct != null, () => html`<span class="stat__bar" aria-hidden="true">
          <i style="width:${pct}%"></i></span>`)}
        ${when(o.note, () => html`<span class="stat__note">${o.note}</span>`)}
      </div>`;
  }

  /* Doluluk seridi.

     Ton ACIKCA verilir. Eskiden %60 altindaki her deger kendiliginden
     kirmiziya boyaniyordu; ogle saatinde gunluk hedefin yarisinda olmak
     bir hata degildir ve arayuzu bos yere alarma cevirir. Esige gore
     renklendirme isteniyorsa `auto:true` ile acikca istenir. */
  function Bar(o){
    const pct = Math.max(0, Math.min(100, Number(o.value) || 0));
    const tone = o.tone != null && o.tone !== ''
      ? o.tone
      : (o.auto ? (pct >= 85 ? '' : pct >= 60 ? 'warn' : 'danger') : '');
    return html`<div class="${cls('bar', o.large && 'bar--lg')}">
      <div class="${cls('bar__fill', tone && 'bar__fill--'+tone)}" style="width:${pct}%"></div>
    </div>`;
  }

  function Meter(o){
    const pct = Math.max(0, Math.min(100, Number(o.value) || 0));
    return html`
      <div class="meter">
        <div class="meter__top"><span class="muted">${o.label}</span><b class="num">${o.text != null ? o.text : '%'+Math.round(o.value)}</b></div>
        ${Bar({ value:pct, tone:o.tone, large:o.large })}
        ${when(o.note, () => html`<span class="tiny dim">${o.note}</span>`)}
      </div>`;
  }

  /* ---------- etiket ---------- */

  function Badge(o){
    const ICONS = { ok:'check', warn:'warn', danger:'warn', info:'info' };
    return html`<span class="${cls('badge', 'badge--'+(o.tone || 'muted'))}">${when(o.icon !== false && ICONS[o.tone], () => icon(ICONS[o.tone]))}${o.label}</span>`;
  }

  function Chip(o){
    if(typeof o === 'string') o = { label:o };
    return html`<span class="${cls('chip', o.act && 'chip--tap', o.on && 'chip--on')}"
      ${when(o.act, () => attrs(Object.assign({ 'data-act':o.act }, o.data || {})))}>${o.label}</span>`;
  }

  /* ---------- etkilesim ---------- */

  /* Etiket ayri bir span icinde durur: dar ekranda yazi gizlenip ikon
     kalabilsin diye. Ikonu olmayan dugmede etiket her zaman gorunur. */
  function Button(o){
    return html`<button
      class="${cls('btn', o.tone && 'btn--'+o.tone, o.size && 'btn--'+o.size, o.block && 'btn--block', o.class)}"
      ${attrs(Object.assign({ 'data-act':o.act, disabled:o.disabled, 'aria-label':o.aria, title:o.title }, o.data || {}))}
    >${when(o.icon, () => icon(o.icon))}<span class="btn__label">${o.label}</span></button>`;
  }

  function IconButton(o){
    return html`<button class="${cls('iconbtn', o.plain && 'iconbtn--plain', o.size === 'sm' && 'iconbtn--sm', o.class)}"
      ${attrs(Object.assign({ 'data-act':o.act, 'aria-label':o.aria || o.label, title:o.title }, o.data || {}))}
    >${icon(o.icon)}</button>`;
  }

  /* Segmented: [{value,label}] + aktif deger */
  function Segmented(o){
    return html`<div class="${cls('seg', o.block && 'seg--block', o.primary && 'seg--primary')}" role="group" ${attrs({ 'aria-label':o.aria })}>
      ${map(o.items, it => html`<button class="${cls(String(it.value) === String(o.value) && 'is-on')}"
        ${attrs(Object.assign({ 'data-act':o.act, 'data-value':it.value }, o.data || {}))}
        aria-pressed="${String(it.value) === String(o.value) ? 'true' : 'false'}">${it.label}</button>`)}
    </div>`;
  }

  /* Ekran ici sekmeler: [{id, label, icon?, count?}] + aktif id.

     Ince alt cizgi yerine secilebilir hap seridi: bir ekranin kac bolume
     ayrildigi ve hangisinde oldugun tek bakista gorunur. Sayac verilirse
     sekmenin sagina yazilir — hangi bolumde is bekledigi gizlenmez. */
  function Subtabs(o){
    return html`<div class="subtabs" role="tablist" ${attrs({ 'aria-label':o.aria })}>
      ${map(o.items, t => html`<button class="${cls('subtab', t.id === o.value && 'is-active')}"
        role="tab" aria-selected="${t.id === o.value ? 'true' : 'false'}"
        ${attrs({ 'data-act':o.act, 'data-tab':t.id })}
      >${when(t.icon, () => icon(t.icon))}${t.label}${when(t.count,
        () => html`<span class="subtab__count">${t.count}</span>`)}</button>`)}
    </div>`;
  }

  /* Secilebilir kart — "birden cogunu isaretle" durumlari icin.
     Onay kutusu uzun listede kaybolur; kartin tamami dokunma hedefidir. */
  function PickCard(o){
    return html`<button class="${cls('pickcard', o.on && 'is-on')}"
      ${attrs(Object.assign({ 'data-act':o.act, 'aria-pressed':o.on ? 'true' : 'false' }, o.data || {}))}>
      <span class="pickcard__box" aria-hidden="true">&#10003;</span>
      <span class="pickcard__body">
        <span class="pickcard__name">${o.label}</span>
        ${when(o.meta, () => html`<span class="pickcard__meta">${o.meta}</span>`)}
      </span>
    </button>`;
  }

  /* Ekran arac seridi: sekme seridi ile o bolume ait eylemi ayni satirda tutar. */
  function Toolbar(o){
    return html`<div class="toolbar">
      <div class="toolbar__tabs">${o.tabs}</div>
      ${when(o.actions, () => html`<div class="toolbar__actions">${o.actions}</div>`)}
    </div>`;
  }

  /* ---------- dikte ve dosya ----------

     Ikisi de KOSULLUDUR: tarayici ses tanimayi desteklemiyorsa mikrofon
     dugmesi hic cizilmez, dosya alani her zaman cizilir cunku metin
     dosyasi modelsiz de okunur. Calismayan bir dugme gostermek
     kullaniciya secenek degil, hayal kirikligi verir. */
  function Mic(o){
    if(!SP.Voice || !SP.Voice.supported()) return raw('');
    const on = SP.Voice.isActive() && SP.Voice.activeTarget() === o.target;
    return html`<button type="button"
      class="${cls('mic', on && 'is-on', o.size === 'sm' && 'mic--sm')}"
      data-act="dictate" data-target="${o.target}"
      aria-label="${on ? 'Dinlemeyi durdur' : 'Sesle yaz'}"
      aria-pressed="${on ? 'true' : 'false'}"
      title="${on ? 'Dinliyor — durdurmak için tıkla' : 'Sesle yaz'}">
      ${raw(SP.UI.icon('mic'))}
      ${when(on, () => html`<span class="mic__pulse" aria-hidden="true"></span>`)}
    </button>`;
  }

  /* Dosya birakma alani. Tiklayinca dosya secici acilir, uzerine
     birakinca da alir. Iki yol da ayni eylemi tetikler. */
  function Drop(o){
    return html`<label class="drop" data-drop="${o.act}">
      <input type="file" class="drop__input" accept="${o.accept || ''}"
        data-change="${o.act}" ${when(o.id, () => attrs({ id:o.id }))}/>
      <span class="drop__icon" aria-hidden="true">${raw(SP.UI.icon(o.icon || 'upload'))}</span>
      <span class="drop__text">
        <b>${o.label}</b>
        <span>${o.hint || 'Dosyayı buraya bırak ya da seçmek için tıkla'}</span>
      </span>
    </label>`;
  }

  function Field(o){
    return html`<label class="field">
      <span>${o.label}${when(o.hint, () => html` <span class="hint-text">${o.hint}</span>`)}</span>
      ${o.input}
    </label>`;
  }

  function Input(o){
    return html`<input class="${cls('input', o.size === 'sm' && 'input--sm', o.numeric && 'input--num', o.class)}"
      ${attrs(Object.assign({
        id:o.id, type:o.type || 'text', value:o.value == null ? null : o.value,
        placeholder:o.placeholder, min:o.min, max:o.max, step:o.step,
        disabled:o.disabled, 'aria-label':o.aria, 'data-change':o.change,
        'data-debounce':o.debounce,
      }, o.data || {}))}/>`;
  }

  function Textarea(o){
    return html`<textarea class="textarea"
      ${attrs(Object.assign({ id:o.id, rows:o.rows || 3, placeholder:o.placeholder, 'data-change':o.change }, o.data || {}))}
    >${o.value || ''}</textarea>`;
  }

  function Select(o){
    return html`<select class="${cls('select', o.size === 'sm' && 'input--sm')}"
      ${attrs(Object.assign({ id:o.id, disabled:o.disabled, 'data-change':o.change }, o.data || {}))}>
      ${map(o.options, op => {
        const v = op.value != null ? op.value : op;
        const l = op.label != null ? op.label : op;
        return html`<option value="${v}" ${String(v) === String(o.value) ? raw('selected') : ''}>${l}</option>`;
      })}
    </select>`;
  }

  function Checkbox(o){
    return html`<label class="${cls('check', o.checked && 'is-done')}">
      <input type="checkbox" ${o.checked ? raw('checked') : ''}
        ${attrs(Object.assign({ 'data-act':o.act }, o.data || {}))}/>
      <span>${o.label}</span>
    </label>`;
  }

  /* ---------- bilgi ---------- */

  function Notice(o){
    const tone = o.tone || 'info';
    return html`<div class="${cls('notice', 'notice--'+tone, o.class)}" ${when(tone === 'danger', () => attrs({ role:'alert' }))}>
      ${icon(tone === 'warn' || tone === 'danger' ? 'warn' : 'info')}
      <div>${when(o.title, () => html`<span class="notice__title">${o.title}</span> `)}${o.body}</div>
    </div>`;
  }

  /* Boş durum, jenerik bir ikon yerine BÖLÜMÜN İMZASINI taşır: boş
     ekran da tasarımın parçasıdır ve hangi bölümde olunduğunu söyler.
     `icon` verilirse eski davranış korunur. */
  function Empty(o){
    const sec = (SP.App && SP.App.sectionOf && SP.S)
      ? SP.App.sectionOf(SP.S.route) : null;
    const mark = o.icon ? icon(o.icon)
      : (sec && SP.UI.motif ? '<div class="empty__motif">' + SP.UI.motif(sec.id) + '</div>'
         : icon('list'));
    return html`<div class="empty">
      ${raw(mark)}
      <p>${o.text}</p>
      ${when(o.action, o.action)}
    </div>`;
  }

  /* Yukleniyor: spinner degil iskelet */
  function Skeleton(o){
    const n = o && o.rows ? o.rows : 3;
    return html`<div class="skeleton" aria-busy="true" aria-live="polite">
      ${map(Array.from({ length:n }), (_, i) => html`<div class="skeleton__row" style="width:${[92, 74, 84, 62][i % 4]}%"></div>`)}
    </div>`;
  }

  /* Siradaki hamle — her ekranda ayni merkez kart */
  function NextUp(o){
    return html`
      <div class="${cls('nextup', o.calm && 'nextup--calm')}">
        <div class="nextup__icon">${icon(o.icon)}</div>
        <div class="nextup__body">
          <div class="nextup__label">${o.label}${when(o.hint, () => raw(SP.UI.hint(o.hint)))}</div>
          <div class="nextup__title">${o.title}</div>
          ${when(o.why, () => html`<div class="nextup__why">${o.why}</div>`)}
        </div>
        ${when(o.action, o.action)}
      </div>`;
  }

  /* ---------- tablo ---------- */

  /* headers: ['Ad', {label:'Net', num:true}] · rows: [[hucre, ...]] */
  function Table(o){
    return html`<div class="tablewrap"><table class="${cls(o.tight && 'table--tight')}">
      <thead><tr>${map(o.headers, hd => html`<th class="${cls(hd && hd.num && 'num')}">${hd && hd.label != null ? hd.label : hd}</th>`)}</tr></thead>
      <tbody>${map(o.rows, r => html`<tr>${map(r, (cell, i) => {
        const hd = o.headers[i];
        return html`<td class="${cls(hd && hd.num && 'num')}">${cell}</td>`;
      })}</tr>`)}</tbody>
    </table></div>`;
  }

  /* Sayfalama: uzun listelerde tum DOM'u cizmemek icin.
     paginate(list, page, size) -> { items, page, pages, total } */
  function paginate(list, page, size){
    const per = size || 25;
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total/per));
    const p = Math.min(Math.max(1, page || 1), pages);
    return { items:list.slice((p-1)*per, p*per), page:p, pages, total, per };
  }

  function Pager(o){
    if(o.pages <= 1) return raw('');
    return html`
      <div class="pager" role="navigation" aria-label="Sayfalama">
        ${Button({ label:'Önceki', size:'sm', act:o.act, disabled:o.page <= 1,
          data:{ 'data-page':o.page-1 } })}
        <span class="pager__info num">${o.page} / ${o.pages}
          <span class="dim">· ${o.total} kayıt</span></span>
        ${Button({ label:'Sonraki', size:'sm', act:o.act, disabled:o.page >= o.pages,
          data:{ 'data-page':o.page+1 } })}
      </div>`;
  }

  /* ---------- duzen ---------- */

  const Grid = body => html`<div class="grid">${body}</div>`;
  const Span = (n, body) => html`<div class="span-${n}">${body}</div>`;
  const Stack = (body, gap) => html`<div class="${cls('stack', gap === 'sm' && 'stack-sm', gap === 'xs' && 'stack-xs')}">${body}</div>`;
  const Cols = (n, body) => html`<div class="cols-${n}">${body}</div>`;
  const Row = (body, o) => html`<div class="${cls('row', o && o.between && 'between', o && o.wrap && 'wrap', o && o.sm && 'row-sm')}">${body}</div>`;
  const SectionTitle = (title, right) => html`<div class="section-title"><h2>${title}</h2>${when(right, right)}</div>`;

  return {
    Card, Collapsible, Stat, Bar, Meter, Badge, Chip, Button, IconButton, Segmented, Subtabs,
    PickCard, Toolbar,
    Field, Input, Textarea, Select, Checkbox, Notice, Empty, Skeleton, NextUp, Table, Pager, paginate,
    Mic, Drop,
    Grid, Span, Stack, Cols, Row, SectionTitle,
  };
})();
