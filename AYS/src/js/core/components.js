/* Deklaratif bilesen seti.

   Her bilesen tek ve net bir API'ye sahiptir; varyantlar acik "modifier"
   alanlariyla gelir (ornegin tone:'ok'). Hepsi h.raw doner, ic ice gecebilir.

   Kullanim:
     C.Card({ title:'Deneme hacmi', sub:'Plan / gerçekleşen', body: C.Table(...) })
     C.Button({ label:'Kaydet', tone:'primary', act:'save-exam' })

   Not: eski R.UI yardimcilari bu setin ustune ince sarmalayici olarak durur;
   ekranlar kademeli olarak C.* API'sine gecirilir. */

window.R = window.R || {};

R.C = (function(){
  const { html, raw, when, cls, attrs, map } = R.h;
  const icon = name => raw(R.UI.icon(name));

  /* ---------- yapisal ---------- */

  /* Card: DEFTER SATIRI. Adi tarihsel; cizdigi sey kutu degildir.

     Kart dili bir yonetim panelinin dilidir: her sey esit agirlikta beyaz
     bir dikdortgene konur, on bes dikdortgen yan yana dizilir ve sayfa bir
     tepsiye doner. Gunde birkac kez acilip aylarca okunacak bir sistemde
     bu dil yorar. SPI bu yuzden kutuyu birakti; AYS de birakiyor.

       solda  dar bir kunye sutunu -- bolum adi, olcu, eylem
       sagda  icerigin kendisi, tam genislikte akan
       arada  ince bir cizgi

     BASLIKSIZ KART KUNYE SUTUNU ACMAZ. Acsaydi 196 piksellik bos bir sol
     sutun kalir, icerik saga sikisirdi -- ekranda gorulen tam olarak
     buydu. Basligi olmayan sey genis satirdir.

     Kutu yalnizca SECILEBILIR ya da YUZEN seylerde kalir (flat): secim
     karti, alt sayfa, uyari. Okunacak bir sey kutuya konmaz. */
  function Card(o){
    if(o.flat) return Box(o);

    const label = o.title
      ? html`<div class="lrow__label">${o.title}${when(o.hint, () => raw(R.UI.hint(o.hint)))}</div>`
      : '';
    const side = (o.title || o.sub || o.badge || o.actions) ? html`
      <div class="lrow__side">
        ${label}
        ${when(o.badge, () => html`<div class="lrow__meta">${o.badge}</div>`)}
        ${when(o.sub, () => html`<p class="lrow__note">${o.sub}</p>`)}
        ${when(o.actions, () => html`<div class="lrow__act">${o.actions}</div>`)}
      </div>` : '';

    return html`
      <section class="${cls('lrow', (o.wide || !o.title) && 'lrow--wide', o.class)}"
               ${when(o.id, () => attrs({ id:o.id }))}>
        ${side}
        <div class="lrow__main">
          ${o.body}
          ${when(o.foot, () => html`<div class="card__foot">${o.foot}</div>`)}
        </div>
      </section>`;
  }

  /* Box: kutu. Yalnizca SECILEBILIR ya da YUZEN seyler icin: masa karti,
     secim karti, alt sayfa. Okunacak bir sey kutuya konmaz.
     `flat` kutuyu golgesiz ve zeminli yapar -- bir listenin icindeki
     kutucuk sayfadan degil, listeden yukselir. */
  function Box(o){
    const head = (o.title || o.sub || o.badge || o.actions) ? html`
      <div class="card__head">
        <div>
          ${when(o.title, () => html`<h3>${o.title}${when(o.hint, () => raw(R.UI.hint(o.hint)))}</h3>`)}
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
          <span class="row-sm"><h2 class="collapse__title">${o.title}</h2>${when(o.meta, () => html`<span class="tiny dim">${o.meta}</span>`)}</span>
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
        <span class="stat__label">${o.label}${when(o.hint, () => raw(R.UI.hint(o.hint)))}</span>
        <span class="stat__value">${o.value}${when(o.unit, () => html`<small>${o.unit}</small>`)}</span>
        ${when(o.spark, o.spark)}
        ${when(pct != null, () => html`<span class="stat__bar" aria-hidden="true">
          <i style="width:${pct}%"></i></span>`)}
        ${when(o.note, () => html`<span class="stat__note">${o.note}</span>`)}
      </div>`;
  }

  /* Serit.

     RENK KENDILIGINDEN GELMEZ, ISTENIR. Onceki surumde ton yuzdeden
     turetiliyordu: %60'in altindaki her serit KIRMIZI oluyordu. Gunun
     akisinda 1/3'te olmak bir basarisizlik degildir -- sabahin dokuzunda
     kirmizi bir serit kullaniciya yanlis bir sey soyluyordu.

     Dahasi `tone:''` gecen on cagri yok sayiliyordu, cunku bos dize
     yanlis degerdir ve `||` onu yutar: cagiran «renk olmasin» diyemiyordu.

     Artik esik renklendirmesi `auto:true` ile ISTENIR ve yalnizca gercek
     bir hedefe karsi olculen yerlerde kullanilir. */
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
      ${when(o.act, () => attrs(Object.assign(
        { 'data-act':o.act, role:'button', tabindex:'0' }, o.data || {})))}>${o.label}</span>`;
  }

  /* ---------- etkilesim ---------- */

  function Button(o){
    return html`<button
      class="${cls('btn', o.tone && 'btn--'+o.tone, o.size && 'btn--'+o.size, o.block && 'btn--block', o.class)}"
      ${attrs(Object.assign({ 'data-act':o.act, disabled:o.disabled, 'aria-label':o.aria, title:o.title }, o.data || {}))}
    >${when(o.icon, () => icon(o.icon))}${o.label}</button>`;
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

  /* Ekran ici sekmeler: [{id,label}] + aktif id */
  function Subtabs(o){
    return html`<div class="subtabs" role="tablist" ${attrs({ 'aria-label':o.aria })}>
      ${map(o.items, t => html`<button class="${cls('subtab', t.id === o.value && 'is-active')}"
        role="tab" aria-selected="${t.id === o.value ? 'true' : 'false'}"
        ${attrs({ 'data-act':o.act, 'data-tab':t.id })}
      >${when(t.icon, () => icon(t.icon))}${t.label}${when(t.count,
        () => html`<span class="subtab__count">${t.count}</span>`)}</button>`)}
    </div>`;
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
      }, o.data || {}))}/>`;
  }

  /* `class` ve `aria` SESSIZCE DUSUYORDU: iki cagri yeri
     `class:'composer__input'` geciyor ve o sinif hicbir zaman yazilmiyordu,
     bu yuzden sohbet kutusu satiri doldurmuyordu. Yer tutucu da etiket
     yerine gecmez — ekran okuyucu yalnizca "metin alani" der. */
  function Textarea(o){
    return html`<textarea class="${cls('textarea', o.class)}"
      ${attrs(Object.assign({ id:o.id, rows:o.rows || 3, placeholder:o.placeholder,
        'aria-label':o.aria, 'data-change':o.change }, o.data || {}))}
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

  function Empty(o){
    return html`<div class="empty">
      ${icon(o.icon || 'list')}
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
          <div class="nextup__label">${o.label}${when(o.hint, () => raw(R.UI.hint(o.hint)))}</div>
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

  /* Izgara DEGIL, DEFTER. On iki sutunluk bir izgara uc sutun yan yana
     kart dizer; defter tek sutundur ve satirlar alt alta akar. Ekranlar
     Grid/Span yazmaya devam eder -- degisen tek sey ne cizdikleridir,
     boylece on dokuz ekranin hicbirine dokunmak gerekmedi. */
  const Grid = body => html`<div class="ledger">${body}</div>`;
  /* Sutun genisligi artik anlamsiz; korunur ki ekranlar degismesin ve
     dar bir seride (span-3, span-4) duran icerik gerekirse gene bilinsin. */
  const Span = (n, body) => html`<div class="lband" data-span="${n}">${body}</div>`;
  const Stack = (body, gap) => html`<div class="${cls('stack', gap === 'sm' && 'stack-sm', gap === 'xs' && 'stack-xs')}">${body}</div>`;
  const Cols = (n, body) => html`<div class="cols-${n}">${body}</div>`;
  const Row = (body, o) => html`<div class="${cls('row', o && o.between && 'between', o && o.wrap && 'wrap', o && o.sm && 'row-sm')}">${body}</div>`;
  const SectionTitle = (title, right) => html`<div class="section-title"><h2>${title}</h2>${when(right, right)}</div>`;

  return {
    Card, Box, Collapsible, Stat, Bar, Meter, Badge, Chip, Button, IconButton, Segmented, Subtabs,
    Field, Input, Textarea, Select, Checkbox, Notice, Empty, Skeleton, NextUp, Table, Pager, paginate,
    Grid, Span, Stack, Cols, Row, SectionTitle,
  };
})();
