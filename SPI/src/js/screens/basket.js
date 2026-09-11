/* Sepet — Modül 4'ün ekranı.

   Üç sekme:
     Sepet   haftalık alışveriş, maliyet ve besin kapsaması
     İkame   eşdeğer ucuz muadiller — neyi koruyup neyi kaybettiğiyle
     Fiyat   kendi fişinden fiyat girme (tahmini ezer)

   Ekranın etik kuralı görünürdür: tahmin fiyatı her yerde «tahmin» rozetiyle
   durur ve hesabın yüzde kaçının tahmine dayandığı yazılır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.basket = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  const TABS = [
    { id:'butce', label:'Bütçe', icon:'target' },
    { id:'sepet', label:'Sepet', icon:'wallet' },
    { id:'ikame', label:'İkame', icon:'refresh' },
    { id:'fiyat', label:'Fiyat', icon:'list' },
  ];

  function toolbar(tab){
    const n = ((S.basket && S.basket.items) || []).length;
    const items = TABS.map(t => Object.assign({}, t, t.id === 'sepet' && n ? { count:n } : {}));
    /* Eylemler hero'da duruyor; burada tekrar etmek aynı düğmeyi iki kez
       göstermek olurdu. */
    return K.Subtabs({ items, value:tab, act:'basket-tab', aria:'Sepet görünümü' });
  }

  /* ---------------------------------------------------------------- sepet */

  function totalCard(){
    const b = SP.Money.basketTotal();
    return K.Card({
      title:'Haftalık sepet', hint:'price-estimate',
      sub:b.rows.length + ' kalem' + (b.householdSize > 1 ? ' · ' + b.householdSize + ' kişilik hane' : ''),
      badge:b.limit != null
        ? K.Badge({ label:b.over ? 'sınır aşıldı' : 'sınırın altında', tone:b.over ? 'danger' : 'ok' })
        : null,
      body:html`
        <div class="cols-3">
          ${K.Stat({ label:'Toplam', value:U.fmtNum(Math.round(b.total)), unit:'TL' })}
          ${K.Stat({ label:'Kişi başı', value:U.fmtNum(Math.round(b.perPerson)), unit:'TL' })}
          ${K.Stat({ label:'Tahmin payı', value:'%' + b.estimate.pct,
            note:b.estimate.pct >= 50 ? 'kendi fişini gir' : 'çoğu ölçülü' })}
        </div>
        ${when(b.limit != null, () => html`<div class="mt-12">
          ${K.Meter({ label:'Haftalık sınır', value:Math.min(100, b.pct || 0),
            text:U.fmtNum(Math.round(b.total)) + ' / ' + U.fmtNum(b.limit) + ' TL',
            tone:b.over ? 'danger' : '' })}</div>`)}
        ${when(b.estimate.pct >= 50 && b.rows.length, () => K.Notice({ tone:'warn', class:'mt-12',
          body:'Bu hesabın %' + b.estimate.pct + '\'i başlangıç tahminiyle yapıldı. '
            + 'Uygulama market taramaz; gerçeğe yaklaşmak için kendi fişindeki fiyatı gir.' }))}`,
      foot:html`${K.Button({ label:'Kalem ekle', size:'sm', tone:'primary', act:'open-add' })}
        ${K.Button({ label:'Haftalık sınır', size:'sm', act:'open-limit' })}`,
    });
  }

  function itemsCard(){
    const b = SP.Money.basketTotal();
    if(!b.rows.length){
      return K.Card({ title:'Kalemler',
        body:P.empty('Sepet boş.', 'Kalem ekle', 'open-add') });
    }
    return K.Card({
      title:'Kalemler', sub:'Maliyete göre sıralı',
      body:html`${map(b.rows, r => html`
        <div class="pricerow">
          <span><b class="small">${r.food.name}</b>
            <span class="tiny dim"> · ${U.fmtNet(r.item.kg)} kg</span>
            ${P.cert(r.price.cert)}</span>
          <span class="pricerow__tl num">${r.cost == null ? '—' : U.fmtNum(Math.round(r.cost)) + ' TL'}</span>
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'Çıkar',
            act:'del-item', data:{ 'data-id':r.item.foodId } })}
        </div>`)}`,
    });
  }

  function coverageCard(){
    const c = SP.Money.basketCoverage();
    if(!c.ok) return K.Card({ title:'Besin kapsaması',
      body:K.Notice({ tone:'info', body:c.note }) });

    const macro = [
      { label:'Kalori', o:c.kcal, unit:'kcal' },
      { label:'Protein', o:c.protein, unit:'g' },
      { label:'Lif', o:c.fiber, unit:'g' },
    ];
    return K.Card({
      title:'Besin kapsaması',
      sub:'Sepet ' + c.householdSize + ' kişinin 7 günlük ihtiyacına göre',
      badge:c.gaps.length ? K.Badge({ label:c.gaps.length + ' öğe eksik', tone:'warn' })
        : K.Badge({ label:'kapsıyor', tone:'ok' }),
      body:html`
        <div class="nutgrid">
          ${map(macro, m => P.nutCell({ label:m.label, got:m.o.got, target:m.o.need, unit:m.unit }))}
        </div>
        ${when(c.gaps.length, () => html`<div class="mt-12">
          ${K.Table({ tight:true, headers:['Karşılanmayan öğe', { label:'Kapsama', num:true }, ''],
            rows:c.gaps.map(id => [
              SP.NUTRI_BY_ID[id] ? SP.NUTRI_BY_ID[id].name : id,
              '%' + c.micro[id].pct,
              K.Button({ label:'En ucuz kaynak', size:'sm', act:'open-cheap', data:{ 'data-id':id } }),
            ]) })}</div>`)}
        ${when(!c.gaps.length, () => K.Notice({ tone:'ok', class:'mt-10',
          body:'Sepetteki gıdalar hanenin haftalık besin hedeflerini karşılıyor.' }))}`,
    });
  }

  /* ---------------------------------------------------------------- ikame */

  function swapCard(){
    const rows = SP.Money.swapOpportunities();
    if(!rows.length){
      return K.Card({ title:'İkame fırsatları', hint:'substitute',
        body:K.Notice({ tone:'info', body:'Sepetteki kalemler için tanımlı bir ikame yok. '
          + 'Somon, badem, ceviz, dana eti ve süzme yoğurt gibi kalemlerde öneri çıkar.' }) });
    }
    return K.Card({
      title:'İkame fırsatları', hint:'substitute',
      sub:'Sepetindeki kalemler için',
      body:html`${map(rows, s => html`
        <div class="listitem">
          <div class="grow">
            <b class="small">${s.from.name} → ${s.to.name}</b>
            ${K.Badge({ label:U.fmtNum(Math.round(s.saveTotal)) + ' TL', tone:'ok' })}
            <div class="tiny dim mt-2">${s.sub.note}</div>
            <div class="tiny mt-2">
              <b>Korunan:</b> ${s.keeps.map(k => k.name).join(', ') || '—'}
              ${when(s.loses.length, () => html` · <b>Düşen:</b> ${s.loses.map(k => k.name).join(', ')}`)}
            </div>
          </div>
          ${K.Button({ label:'Değiştir', size:'sm', act:'do-swap',
            data:{ 'data-from':s.from.id, 'data-to':s.to.id, 'data-kg':s.kg } })}
        </div>`)}`,
      foot:html`<span class="small dim">Öneri neyi koruduğunu ve neyi kaybettiğini birlikte söyler.
        «Ucuz olan iyidir» diye bir kural yoktur.</span>`,
    });
  }

  function bulkCard(){
    const rows = SP.Money.bulkOpportunities();
    return K.Card({
      title:'Toplu alım', hint:'bulk',
      sub:'Bozulmadan saklanan kalemler',
      body:K.Table({ tight:true,
        headers:['Kalem', { label:'En az', num:true }, { label:'Tasarruf', num:true }, 'Durum'],
        rows:rows.map(b => [
          html`<b>${b.food.name}</b> <span class="tiny dim">${b.item.note}</span>`,
          U.fmtNet(b.item.minKg) + ' kg',
          U.fmtNum(Math.round(b.saveTl)) + ' TL',
          b.worth ? K.Badge({ label:U.fmtNet(b.weeksToUse) + ' haftada biter', tone:'ok' })
            : b.weeklyKg ? K.Badge({ label:'yavaş tüketim', tone:'warn' })
            : K.Badge({ label:'sepette yok', tone:'muted' }),
        ]) }),
      foot:html`<span class="small dim">Yalnızca kuru bakliyat, yağ ve konserve gibi kalemler listede.
        Taze üründe toplu alım tasarruf değil israf üretir.</span>`,
    });
  }

  /* ---------------------------------------------------------------- fiyat */

  function priceCard(){
    const q = S.ui.foodQuery;
    let list = SP.FOODS.filter(f => SP.PRICE_SEED.perKg[f.id] != null || S.prices[f.id]);
    if(q) list = list.filter(f => U.norm(f.name).indexOf(U.norm(q)) >= 0);
    const page = K.paginate(list, S.ui.foodPage, 20);

    return K.Card({
      title:'Fiyat listesi', hint:'price-estimate',
      sub:'Kendi fişindeki fiyat tahmini ezer',
      actions:K.Input({ id:'price-q', value:q, size:'sm', placeholder:'Ara…',
        change:'price-query', data:{ 'data-debounce':'200' } }),
      body:html`
        ${K.Notice({ tone:'info',
          body:SP.PRICE_SEED.note + ' Başlangıç tahminleri ' + SP.PRICE_SEED.seededAt
            + ' ayına ait; üzerinden ' + (SP.Money.monthsSince(SP.PRICE_SEED.seededAt) || 0) + ' ay geçti.' })}
        <div class="mt-12">${map(page.items, f => {
          const p = SP.Money.priceOf(f.id);
          return html`<div class="pricerow">
            <span><b class="small">${f.name}</b> ${P.cert(p.cert)}
              ${when(p.source === 'seed', () => html`<span class="tiny dim"> · ${p.age.label}</span>`)}</span>
            <span class="pricerow__tl num">${p.tl == null ? '—' : U.fmtNum(p.tl) + ' TL/kg'}</span>
            ${K.Input({ type:'number', numeric:true, size:'sm', step:'1', min:0,
              placeholder:'TL/kg', change:'set-price', data:{ 'data-id':f.id } })}
          </div>`;
        })}</div>
        ${K.Pager({ page:page.page, pages:page.pages, total:page.total, act:'price-page' })}`,
    });
  }

  /* -------------------------------------------------------------- sheet'ler */

  function addSheet(){
    const q = S.ui.foodQuery;
    let list = SP.FOODS;
    if(q) list = list.filter(f => U.norm(f.name + ' ' + (f.aliases || []).join(' ')).indexOf(U.norm(q)) >= 0);
    const page = K.paginate(list, S.ui.foodPage, 12);

    UI.sheet({
      title:'Sepete kalem ekle', wide:true,
      body:String(K.Stack([
        K.Input({ id:'add-q', value:q, placeholder:'Ara: mercimek, tavuk, zeytinyağı…',
          change:'add-query', data:{ 'data-debounce':'200' } }),
        html`<div class="stack-xs">${map(page.items, f => {
          const p = SP.Money.priceOf(f.id);
          return html`<button class="foodrow" data-act="pick-basket" data-id="${f.id}">
            <span class="foodrow__name">${f.name}</span>
            <span class="foodrow__meta num">${p.tl == null ? 'fiyat yok' : U.fmtNum(p.tl) + ' TL/kg'}</span>
          </button>`;
        })}</div>`,
        K.Pager({ page:page.page, pages:page.pages, total:page.total, act:'add-page' }),
      ])),
      footer:String(K.Button({ label:'Kapat', act:'sheet-close' })),
      noFocus:true,
    });
  }

  function kgSheet(foodId){
    const f = SP.FOOD_BY_ID[foodId];
    const cur = ((S.basket.items || []).find(x => x.foodId === foodId) || {}).kg;
    UI.sheet({
      title:f.name, subtitle:'Haftalık miktar',
      body:String(K.Field({ label:'Kilogram',
        input:K.Input({ id:'basket-kg', type:'number', numeric:true, step:'0.1', min:0,
          value:cur == null ? '' : cur, placeholder:'1,5' }) })),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-kg', data:{ 'data-id':foodId } })}`),
    });
  }

  function cheapSheet(nutrientId){
    const n = SP.NUTRI_BY_ID[nutrientId];
    const rows = SP.Money.costPerNutrient(nutrientId, 10);
    UI.sheet({
      title:'En ucuz ' + n.name.toLocaleLowerCase('tr-TR') + ' kaynağı', wide:true,
      subtitle:'Bir birim öğe başına maliyet',
      body:String(K.Stack([
        K.Table({ tight:true,
          headers:['Gıda', { label:'Birim başı', num:true }, { label:'100 g\'da', num:true }, 'Fiyat'],
          rows:rows.map(r => [r.food.name, U.fmtNet(r.tlPerUnit) + ' TL',
            U.fmtNum(U.round(r.per100, 2)) + ' ' + n.unit,
            html`${U.fmtNum(r.price.tl)} TL/kg ${P.cert(r.cert)}`]) }),
        K.Notice({ tone:'info', body:'Bu tablo bütçe ile sağlık hedefini aynı yerde buluşturur: '
          + 'hedefi indirmeden, aynı öğeyi daha ucuz taşıyan gıdayı gösterir.' }),
      ])),
      footer:String(K.Button({ label:'Kapat', act:'sheet-close' })),
      noFocus:true,
    });
  }

  /* -------------------------------------------------------------- bütçe

     Sedef'in sayfası. Bütçe tek başına üretilmez: diğer üç koçun talebi
     toplanır (SP.Money.budget). Fiyatı bilinmeyen kalem sıfır sayılmaz —
     "veri yok" olarak durur ve toplamın dışında kalır. */

  function budgetView(){
    const b = SP.Money.budget();
    const st = SP.Money.status();

    return html`
      <section class="sect">
        <div class="sect__h">
          <div class="sect__ht">
            <div class="sect__eyebrow">Sedef</div>
            <h2>Aylık bütçe</h2>
            <p>Bütçe diğer koçların talebinden çıkar: Nesrin gıdayı, Kerem testi,
              Barış ekipmanı ister. Fiyatı bilinmeyen kalem toplama katılmaz.</p>
          </div>
        </div>

        <div class="grid">
          <div class="span-7"><div class="stack">
            ${K.Card({
              title:'Talep tablosu', hint:'budget-rank',
              badge:K.Badge({ label:U.fmtNum(b.total) + ' TL / ay',
                tone:b.over ? 'warn' : 'info' }),
              body:html`${map(b.rows, r => html`
                <div class="demand">
                  <div class="demand__who">
                    ${P.avatar(r.agent, 'sm')}
                    <div class="minw0">
                      <b class="small">${r.label}</b>
                      <div class="tiny dim">${r.detail}</div>
                    </div>
                  </div>
                  <div class="demand__cost num">
                    ${r.monthly == null ? html`<span class="dim">veri yok</span>`
                      : html`${U.fmtNum(r.monthly)}<small>TL</small>`}
                  </div>
                  <div class="demand__cert">${when(r.monthly != null, () => P.cert(r.cert))}</div>
                  ${when(r.note, () => html`<p class="demand__note">${r.note}</p>`)}
                </div>`)}`,
              foot:html`
                ${when(b.unknown, () => html`<span class="small">
                  <b>${b.unknown}</b> kalem fiyatı bilinmediği için toplamın dışında.</span>`)}
                ${when(!b.unknown, () => html`<span class="small dim">
                  Bütün kalemlerin karşılığı hesaplandı.</span>`)}`,
            })}

            ${when(b.limit != null, () => K.Card({
              title:'Aylık sınır',
              body:html`${K.Meter({ label:'Kullanılan',
                value:Math.min(100, b.pct || 0),
                text:U.fmtNum(b.total) + ' / ' + U.fmtNum(b.limit) + ' TL',
                tone:b.over ? 'danger' : '' })}
                ${K.Notice({ tone:b.over ? 'warn' : 'ok', class:'mt-12',
                  body:b.over
                    ? 'Talep sınırın ' + U.fmtNum(b.total - b.limit) + ' TL üstünde. '
                      + 'Sıralama gereği önce güvenlik ve tahlil korunur; kısıntı '
                      + 'gıda kaleminde ikame ile yapılır.'
                    : 'Talep aylık sınırın içinde.' })}` }))}
          </div></div>

          <div class="span-5"><div class="stack">
            ${K.Card({ title:'Sedef\'in notu', hint:'budget-rank',
              badge:K.Badge({ label:'kural motoru', tone:'muted', icon:false }),
              body:html`<p class="small">${st.text}</p>`,
              foot:K.Button({ label:'Sedef\'e sor', size:'sm',
                act:'ask-agent', data:{ 'data-agent':'money' } }) })}

            ${K.Card({ title:'Bütçenin yeri', hint:'budget-rank',
              body:html`<p class="small">${SP.PRECEDENCE[5].note}</p>
                <div class="mt-10">${K.Table({ tight:true, headers:['Sıra', 'Kural'],
                  rows:SP.PRECEDENCE.map(p => [String(p.rank), p.label]) })}</div>` })}

            ${K.Card({ title:'Fiyatlar nereden geliyor?', hint:'price-estimate',
              body:html`<p class="small muted">Fiyatlar internetten çekilmez —
                bu uygulama çevrimdışı çalışır ve sağlık verisi dışarı çıkmaz.
                Başlangıçta tohum fiyat listesi kullanılır ve açıkça «tahmin»
                olarak işaretlenir. Fişten girdiğin her fiyat tohumun üstüne
                yazılır ve «ölçüldü» olur.</p>`,
              foot:K.Button({ label:'Fiyat gir', size:'sm',
                act:'basket-tab', data:{ 'data-tab':'fiyat' } }) })}
          </div></div>
        </div>
      </section>`;
  }

  function limitsSheet(){
    const bk = S.basket || {};
    UI.sheet({
      title:'Sınır ve ücretler',
      subtitle:'Girilmeyen alan «sınır yok» demektir, sıfır değil',
      body:String(K.Stack([
        K.Field({ label:'Haftalık sepet sınırı (TL)',
          input:K.Input({ id:'lim-week', type:'number', numeric:true, step:'any',
            value:bk.weeklyLimit == null ? '' : bk.weeklyLimit }) }),
        K.Field({ label:'Aylık toplam sağlık bütçesi (TL)',
          input:K.Input({ id:'lim-month', type:'number', numeric:true, step:'any',
            value:bk.monthlyLimit == null ? '' : bk.monthlyLimit }) }),
        K.Field({ label:'Tek panel test ücreti (TL)',
          hint:'ölçüm borcu olan panellerin maliyeti bundan hesaplanır',
          input:K.Input({ id:'lim-test', type:'number', numeric:true, step:'any',
            value:bk.testFee == null ? '' : bk.testFee }) }),
        K.Notice({ tone:'info', body:'Bu üç sayı yalnız bu cihazda tutulur ve '
          + 'hiçbir modele gönderilmez.' }),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-limits' })}`),
    });
  }

  /* ---------------------------------------------------------------- fiş

     Fiş okuma, fiyat tablosunun çürümesini çözer: tohum tahminler
     kullanıcının gerçek fiyatıyla değişir ve «ölçüldü» olur. Sistem
     market taramaz; fiyat hep kullanıcının elindeki belgeden gelir. */

  let receiptFile = null;
  let receiptRes = null;

  function receiptSheet(){
    UI.sheet({
      title:'Fiş oku', subtitle:'Fiyatlar tahminden ölçüme geçer',
      wide:true,
      body:String(K.Stack([
        when(!SP.Extract.modelReady(), () => K.Notice({ tone:'warn',
          title:'Model bağlı değil.',
          body:'Fiş okumak için Ayarlar → Rehber → Model bölümünden bir sağlayıcı '
            + 'seç. Fiyatları Fiyat sayfasından elle de girebilirsin.' })),
        K.Drop({ act:'receipt-file', label:'Fiş fotoğrafı ya da metni',
          icon:'file', accept:'image/*,.txt,.csv',
          hint:'Fişi buraya bırak ya da seçmek için tıkla' }),
        html`<div id="receipt-name" class="small dim">${receiptFile ? receiptFile.name : ''}</div>`,
        K.Notice({ tone:'info', body:'Okunan fiyat kilogram başınadır. Fişte toplam '
          + 'fiyat ve ağırlık varsa kilogram fiyatı hesaplanır.' }),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Oku', tone:'primary', act:'run-receipt',
          disabled:!receiptFile || !SP.Extract.modelReady() })}`),
      noFocus:true,
    });
  }

  function receiptPreviewSheet(res){
    UI.sheet({
      title:'Fişten okunanlar', subtitle:res.note, wide:true,
      body:String(K.Stack([
        when(res.rows.length, () => html`<div>${map(res.rows, (r, i) => html`
          <div class="${r.skip ? 'pasterow pasterow--off' : 'pasterow'}">
            ${K.Checkbox({ label:'', checked:!r.skip, act:'toggle-receipt-row',
              data:{ 'data-i':i } })}
            <span><b class="small">${r.food.name}</b>
              ${when(SP.Money.priceOf(r.food.id).cert === 'estimated',
                () => html` <span class="tiny dim">tahmini eziyor</span>`)}</span>
            <span class="pasterow__val num">${U.fmtNum(r.tl)} TL/kg</span>
            <span class="pasterow__src">fişten</span>
          </div>`)}</div>`),
        when(!res.rows.length, () => K.Notice({ tone:'warn', body:res.note })),
        when(res.unmatched.length, () => K.Notice({ tone:'info', title:'Eşleşmeyenler:',
          body:res.unmatched.map(x => x.line).join(' · ')
            + ' — bu ürünler gıda listemizde yok.' })),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Fiyatları kaydet', tone:'primary', act:'save-receipt',
          disabled:!res.rows.filter(r => !r.skip).length })}`),
      noFocus:true,
    });
  }

  /* --------------------------------------------------------------- ekran */

  async function render(){
    const tab = S.ui.basketTab;
    if(tab === 'butce'){
      return String(html`
        <div class="mb-20">${toolbar(tab)}</div>
        ${budgetView()}
        <div class="mt-24">${raw(UI.rail(['budget-rank', 'price-estimate', 'certainty']))}</div>`);
    }
    if(tab === 'ikame'){
      return String(K.Grid([
        K.Span(12, toolbar(tab)),
        K.Span(8, K.Stack([swapCard(), bulkCard()])),
        K.Span(4, K.Stack([
          K.Card({ title:'Bütçenin yeri', hint:'budget-rank',
            body:html`<p class="small">${SP.PRECEDENCE[5].note}</p>
              <div class="mt-10">${K.Table({ tight:true, headers:['Sıra', 'Kural'],
                rows:SP.PRECEDENCE.map(p => [String(p.rank), p.label] ) })}</div>` }),
        ])),
        K.Span(12, raw(UI.rail(['substitute', 'bulk', 'budget-rank']))),
      ]));
    }
    if(tab === 'fiyat'){
      return String(K.Grid([
        K.Span(12, toolbar(tab)),
        K.Span(12, priceCard()),
        K.Span(12, raw(UI.rail(['price-estimate', 'certainty']))),
      ]));
    }
    return String(K.Grid([
      K.Span(12, toolbar(tab)),
      K.Span(7, K.Stack([totalCard(), itemsCard()])),
      K.Span(5, K.Stack([coverageCard()])),
      K.Span(12, raw(UI.rail(['price-estimate', 'substitute', 'bulk', 'budget-rank']))),
    ]));
  }

  const handle = {
    async 'open-receipt'(){ receiptFile = null; receiptRes = null; receiptSheet(); },
    async 'run-receipt'(){
      if(!receiptFile) return;
      UI.toast('Fiş okunuyor…');
      receiptRes = await SP.Extract.fromReceipt(receiptFile);
      receiptPreviewSheet(receiptRes);
    },
    async 'toggle-receipt-row'(el){
      const i = Number(el.dataset.i);
      if(!receiptRes || !receiptRes.rows[i]) return;
      receiptRes.rows[i].skip = !el.checked;
      receiptPreviewSheet(receiptRes);
    },
    async 'save-receipt'(){
      if(!receiptRes) return;
      const rows = receiptRes.rows.filter(r => !r.skip);
      if(!rows.length) return;
      for(const r of rows) await M.setPrice(r.food.id, r.tl);
      receiptRes = null; receiptFile = null;
      UI.closeSheet();
      UI.toast(rows.length + ' fiyat kaydedildi · ölçüldü');
      SP.App.render();
    },
    async 'open-limits'(){ limitsSheet(); },
    async 'save-limits'(){
      const num = id => {
        const el = document.getElementById(id);
        if(!el || String(el.value).trim() === '') return null;
        const n = Number(String(el.value).replace(',', '.'));
        return isFinite(n) ? n : null;
      };
      await M.saveBasket({ weeklyLimit:num('lim-week'), monthlyLimit:num('lim-month'),
        testFee:num('lim-test') });
      UI.closeSheet();
      UI.toast('Kaydedildi');
      SP.App.render();
    },
    async 'basket-tab'(el){ S.ui.basketTab = el.dataset.tab; S.ui.foodPage = 1; SP.App.render(); },
    async 'open-add'(){ S.ui.foodPage = 1; addSheet(); },
    async 'add-page'(el){ S.ui.foodPage = Number(el.dataset.page); addSheet(); },
    async 'pick-basket'(el){ kgSheet(el.dataset.id); },
    async 'save-kg'(el){
      const input = document.getElementById('basket-kg');
      const kg = input ? Number(String(input.value).replace(',', '.')) : 0;
      await M.setBasketItem(el.dataset.id, kg);
      UI.closeSheet();
      UI.toast(kg > 0 ? 'Sepete eklendi' : 'Sepetten çıkarıldı');
      SP.App.render();
    },
    async 'del-item'(el){
      await M.setBasketItem(el.dataset.id, 0);
      SP.App.render();
    },
    async 'open-limit'(){
      UI.sheet({
        title:'Haftalık sınır',
        body:String(K.Stack([
          K.Field({ label:'Haftalık sepet sınırı (TL)',
            input:K.Input({ id:'limit-tl', type:'number', numeric:true, step:'50', min:0,
              value:S.basket.weeklyLimit == null ? '' : S.basket.weeklyLimit }) }),
          K.Field({ label:'Hanedeki kişi sayısı',
            input:K.Input({ id:'limit-size', type:'number', numeric:true, step:'1', min:1,
              value:(S.prefs && S.prefs.householdSize) || 1 }) }),
          K.Notice({ tone:'info', body:'Sınır aşıldığında sistem sağlık hedefini indirmez; '
            + 'ikame önerisi çıkarır. Bütçe öncelik sırasında en sonda gelir.' }),
        ])),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Kaydet', tone:'primary', act:'save-limit' })}`),
      });
    },
    async 'save-limit'(){
      const tl = document.getElementById('limit-tl');
      const size = document.getElementById('limit-size');
      await M.saveBasket({ weeklyLimit:tl && tl.value.trim() !== '' ? Number(tl.value) : null });
      await M.savePrefs({ householdSize:size ? Math.max(1, Number(size.value) || 1) : 1 });
      UI.closeSheet();
      UI.toast('Kaydedildi');
      SP.App.render();
    },
    async 'do-swap'(el){
      const kg = Number(el.dataset.kg);
      await M.setBasketItem(el.dataset.from, 0);
      await M.setBasketItem(el.dataset.to, kg);
      UI.toast('Sepette değiştirildi');
      SP.App.render();
    },
    async 'open-cheap'(el){ cheapSheet(el.dataset.id); },
    async 'price-page'(el){ S.ui.foodPage = Number(el.dataset.page); SP.App.render(); },
  };

  const change = {
    async 'receipt-file'(el){
      receiptFile = (el.files && el.files[0]) || null;
      const n = document.getElementById('receipt-name');
      if(n) n.textContent = receiptFile ? receiptFile.name : '';
      const run = document.querySelector('[data-act="run-receipt"]');
      if(run) run.disabled = !receiptFile || !SP.Extract.modelReady();
    },
    async 'set-price'(el){
      const v = String(el.value).trim();
      await M.setPrice(el.dataset.id, v === '' ? null : Number(v.replace(',', '.')));
      UI.toast(v === '' ? 'Fiyat kaldırıldı' : 'Fiyat kaydedildi · ölçüldü');
      SP.App.render();
    },
    async 'price-query'(el){ S.ui.foodQuery = el.value; S.ui.foodPage = 1; SP.App.render(); },
    async 'add-query'(el){ S.ui.foodQuery = el.value; S.ui.foodPage = 1; addSheet(); },
  };

  return {
    id:'basket',
    title:'Finans',
    headline(){
      const b = SP.Money.budget();
      if(!b.rows.filter(r => r.monthly).length) return 'Bütçe için henüz veri yok.';
      if(b.over) return 'Talep aylık sınırın üstünde.';
      if(b.limit != null) return 'Talep aylık sınırın içinde.';
      return 'Aylık talep ' + U.fmtNum(b.total) + ' TL.';
    },
    lede(){
      const b = SP.Money.budget();
      const est = SP.Money.estimateShare();
      const base = 'Bütçe tek başına üretilmez: Nesrin gıdayı, Kerem testi, '
        + 'Barış ekipmanı ister; Sedef toplar.';
      if(b.unknown) return base + ' Şu an ' + b.unknown + ' kalemin fiyatı bilinmiyor '
        + 've toplamın dışında duruyor — sıfır sayılmadı.';
      return base + (est.pct ? ' Hesabın %' + est.pct + '\u2019i tahmin fiyatıyla.' : '');
    },
    stats(){
      const b = SP.Money.budget();
      const w = SP.Money.basketTotal();
      const out = [{ value:U.fmtNum(b.total), label:'aylık talep (TL)' }];
      if(b.limit != null) out.push({ value:U.fmtNum(b.limit), label:'aylık sınır (TL)' });
      if(w.rows.length) out.push({ value:U.fmtNum(Math.round(w.total)), label:'haftalık sepet (TL)' });
      if(b.unknown) out.push({ value:b.unknown, label:'fiyatı yok' });
      return out;
    },
    subtitle(){
      const st = SP.Money.status();
      return st.text;
    },
    actions(){
      return String(html`${K.Button({ label:'Kalem ekle', icon:'plus', size:'sm', tone:'primary',
        act:'open-add' })}
        ${K.Button({ label:'Fiş oku', size:'sm', icon:'camera', act:'open-receipt' })}
        ${K.Button({ label:'Sınır ve ücretler', size:'sm', act:'open-limits' })}`);
    },
    render, handle, change,
  };
})();
