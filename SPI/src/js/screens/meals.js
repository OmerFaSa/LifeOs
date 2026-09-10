/* Öğünler — Modül 2'nin ekranı.

   Giriş sıfır sürtünmelidir: tek satır yazılır, gramaj ev ölçüsünden gelir
   ve «tahmin» olarak işaretlenir. Tartan kullanıcı gramı yazar, «ölçüldü» olur.

   Ekranın ayırt edici tarafı emilim sütunudur: aynı öğünde çay varsa demir
   emilimi yarıya iner ve bu ekranda görünür. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.meals = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  function shownDate(){ return S.ui.mealDate || U.todayISO(); }

  /* Saate gore makul ogun secimi — kullaniciya sormadan dogru tahmin. */
  function guessSlot(){
    const h = new Date().getHours();
    if(h < 10) return 'kahvalti';
    if(h < 12) return 'ara1';
    if(h < 15) return 'ogle';
    if(h < 18) return 'ara2';
    if(h < 22) return 'aksam';
    return 'gece';
  }

  /* ---------------------------------------------------------- giris */

  function quickCard(){
    return K.Card({
      title:'Öğün ekle', hint:'portion',
      sub:'Yaz, Enter\'a bas',
      body:html`
        <div class="quick">
          ${K.Select({ id:'meal-slot', value:S.ui.mealSlot,
            options:SP.MEAL_SLOTS.map(s => ({ value:s.id, label:s.label })), change:'pick-slot' })}
          ${K.Input({ id:'meal-text', placeholder:'1 tabak etli kuru fasulye, 2 dilim ekmek, 1 bardak ayran',
            aria:'Öğün metni' })}
          ${K.Button({ label:'Ekle', tone:'primary', act:'add-meal' })}
          <span class="quick__hint">Ev ölçüsü tanınır: tabak · kase · dilim · bardak · avuç · kaşık.
            Tarttıysan «150 g tavuk göğsü» yaz.</span>
        </div>`,
      foot:K.Button({ label:'Besin ara', size:'sm', act:'open-search' }),
    });
  }

  /* ---------------------------------------------------------- ogunler */

  function mealCard(meal){
    const a = SP.Nutri.absorbMeal(meal.items || []);
    const slot = SP.MEAL_SLOTS.find(s => s.id === meal.slot);
    return html`
      <div class="mealcard">
        <div class="mealcard__head">
          ${raw(UI.icon(slot ? slot.icon : 'meal'))}
          <span class="mealcard__slot">${slot ? slot.label : meal.slot}</span>
          <span class="mealcard__kcal num">${Math.round(a.raw.kcal)} kcal</span>
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'Öğünü sil',
            act:'del-meal', data:{ 'data-id':meal.id } })}
        </div>
        ${map(meal.items || [], (it, i) => {
          const f = SP.FOOD_BY_ID[it.foodId];
          if(!f) return '';
          return html`<div class="mealitem">
            <span class="mealitem__g num">${it.g} g</span>
            <span class="mealitem__name">${f.name}
              ${when(it.portion, () => html`<span class="tiny dim"> · ${it.portion}</span>`)}</span>
            ${P.cert(it.cert)}
            ${K.IconButton({ icon:'close', size:'sm', plain:true, aria:'Çıkar',
              act:'del-item', data:{ 'data-id':meal.id, 'data-i':i } })}
          </div>`;
        })}
        <div class="row wrap mt-8">
          <span class="tiny dim">Protein ${Math.round(a.raw.protein)} g ·
            yağ ${Math.round(a.raw.fat)} g · karbonhidrat ${Math.round(a.raw.carb)} g ·
            lif ${Math.round(a.raw.fiber)} g</span>
        </div>
        ${map(a.notes, P.absorbNote)}
      </div>`;
  }

  function dayCard(){
    const d = shownDate();
    const rows = M.mealsOf(d);
    const order = SP.MEAL_SLOTS.map(s => s.id);
    const sorted = rows.slice().sort((x, y) => order.indexOf(x.slot) - order.indexOf(y.slot));

    return K.Card({
      title:U.fmtDate(d),
      sub:rows.length ? rows.length + ' öğün' : 'kayıt yok',
      actions:K.Segmented({ act:'shift-day', value:'', aria:'Gün değiştir', items:[
        { value:'-1', label:'‹' }, { value:'0', label:'bugün' }, { value:'1', label:'›' },
      ] }),
      body:rows.length
        ? html`${map(sorted, mealCard)}`
        : P.empty('Bu güne henüz öğün girilmedi.', 'Öğün ekle', 'focus-meal'),
    });
  }

  /* ---------------------------------------------------------- hedefler */

  function targetCard(){
    const d = shownDate();
    const t = SP.Nutri.targets();
    const tot = SP.Nutri.dayTotals(d);

    if(!t.ok){
      return K.Card({ title:'Günlük hedef',
        body:K.Notice({ tone:'warn', title:'Hesaplanamıyor.',
          body:'Profilde ' + t.missing.join(', ') + ' eksik. Bu üçü olmadan kalori '
             + 've protein hedefi tahmin edilmez.' }),
        foot:K.Button({ label:'Profili aç', size:'sm', tone:'primary',
          act:'go', data:{ 'data-route':'family' } }) });
    }

    return K.Card({
      title:'Günlük hedef', hint:'macro-target',
      sub:t.goal.label + ' · ' + U.fmtNum(t.tdee) + ' kcal ihtiyaç',
      badge:K.Badge({ label:U.fmtNum(t.kcal) + ' kcal', tone:'info' }),
      body:html`
        <div class="nutgrid">
          ${P.nutCell({ label:'Kalori', got:tot.kcal, target:t.kcal, unit:'kcal' })}
          ${P.nutCell({ label:'Protein', got:tot.protein, target:t.protein.min, unit:'g',
            note:t.protein.min + '–' + t.protein.max + ' g bandı' })}
          ${P.nutCell({ label:'Yağ', got:tot.fat, target:t.fat.min, unit:'g',
            note:t.fat.min + '–' + t.fat.max + ' g bandı' })}
          ${P.nutCell({ label:'Karbonhidrat', got:tot.carb, target:t.carb.min, unit:'g' })}
          ${P.nutCell({ label:'Lif', got:tot.fiber, target:t.fiber, unit:'g' })}
        </div>
        ${when(Object.keys(t.adjustments).length, () => K.Notice({ tone:'info', class:'mt-12',
          title:'Laboratuvara göre yükseltilen hedefler:',
          body:html`<ul class="bullets small mt-4">${map(Object.keys(t.adjustments), k => html`
            <li><b>${SP.NUTRI_BY_ID[k] ? SP.NUTRI_BY_ID[k].name : k}</b>
              ×${U.fmtNet(t.adjustments[k].mult)} — ${t.adjustments[k].why}</li>`)}</ul>` }))}`,
    });
  }

  function microCard(){
    const d = shownDate();
    const t = SP.Nutri.targets();
    const tot = SP.Nutri.dayTotals(d);
    if(!t.ok || tot.empty) return null;

    return K.Card({
      title:'Mikro besinler', hint:'bioavailability',
      sub:'Alınan ve emilen ayrı gösterilir',
      body:K.Table({ tight:true,
        headers:['Öğe', { label:'Alınan', num:true }, { label:'Emilen', num:true },
          { label:'Hedef', num:true }, 'Durum'],
        rows:Object.keys(t.micro).map(id => {
          const n = SP.NUTRI_BY_ID[id];
          const tg = t.micro[id];
          const got = tot.micro[id] || 0;
          const abs = tot.absorbed[id] || 0;
          const pct = U.pct(got, tg.target);
          const tone = tg.limit ? (pct > 100 ? 'danger' : 'ok')
            : pct >= 100 ? 'ok' : pct >= 70 ? 'warn' : 'danger';
          return [
            html`<button class="linkbtn" data-act="open-nutrient" data-id="${id}">${n.name}</button>`,
            U.fmtNum(U.round(got, id === 'omega3' ? 2 : 0)),
            U.fmtNum(U.round(abs, id === 'omega3' ? 2 : 1)),
            U.fmtNum(tg.target) + ' ' + n.unit,
            K.Badge({ label:'%' + pct, tone }),
          ];
        }) }),
      foot:html`<span class="small dim">Emilen sütunu öğün içeriğine göre hesaplanır:
        aynı öğündeki C vitamini, çay, kalsiyum ve yağ emilimi değiştirir.</span>`,
    });
  }

  function gapCard(){
    const g = SP.Nutri.gaps(7);
    if(!g.ok){
      return K.Card({ title:'Son 7 gün', hint:'nutri-gap',
        body:K.Notice({ tone:'info', body:'Son 7 günde hiç öğün girilmemiş; açık hesaplanamıyor. '
          + 'Girilmemiş gün sıfır sayılmaz, ortalamaya katılmaz.' }) });
    }
    if(!g.rows.length){
      return K.Card({ title:'Son 7 gün', hint:'nutri-gap',
        badge:K.Badge({ label:g.avg.days + ' gün kayıt', tone:'ok' }),
        body:K.Notice({ tone:'ok', body:'Son 7 günün ortalaması bütün hedefleri karşılıyor.' }) });
    }
    return K.Card({
      title:'Açıklar', hint:'nutri-gap',
      sub:'Son 7 günün ortalaması · ' + g.avg.days + ' gün kayıt',
      badge:K.Badge({ label:g.rows.length + ' açık', tone:'warn' }),
      body:html`<div class="list">${map(g.rows.slice(0, 8), r => html`
        <div class="listitem">
          <div class="grow">
            <b class="small">${r.nutrient ? r.nutrient.name : r.id}</b>
            ${K.Badge({ label:r.kind === 'over' ? 'sınır aşıldı' : '%' + r.pct,
              tone:r.kind === 'over' ? 'danger' : r.pct >= 70 ? 'warn' : 'danger' })}
            <div class="tiny dim">${U.fmtNum(U.round(r.got, 1))} / ${U.fmtNum(r.target)}
              ${r.nutrient ? r.nutrient.unit : ''}${r.why ? ' · ' + r.why : ''}</div>
          </div>
          ${K.Button({ label:'Kaynaklar', size:'sm', act:'open-nutrient', data:{ 'data-id':r.id } })}
        </div>`)}</div>`,
    });
  }

  /* ------------------------------------------------------------ sheet'ler */

  function nutrientSheet(id){
    const n = SP.NUTRI_BY_ID[id];
    if(!n) return;
    const sources = SP.Nutri.sourcesFor(id, 8);
    const cheap = SP.Money.costPerNutrient(id, 6);
    const t = SP.Nutri.targets();
    const tg = t.ok ? t.micro[id] : null;

    UI.sheet({
      title:n.name, subtitle:n.note, wide:true,
      body:String(K.Stack([
        when(tg, () => K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          ['Günlük hedef', U.fmtNum(tg.target) + ' ' + n.unit],
          ['Taban referans', U.fmtNum(tg.base) + ' ' + n.unit],
          ['Çarpan', tg.mult === 1 ? 'yok' : '×' + U.fmtNet(tg.mult) + (tg.why ? ' — ' + tg.why : '')],
          ['Üst sınır', n.ul ? U.fmtNum(n.ul) + ' ' + n.unit : 'tanımlı değil'],
          ['İlgili ölçüm', n.marker && SP.BIO_BY_ID[n.marker] ? SP.BIO_BY_ID[n.marker].name : '—'],
        ] })),
        K.Notice({ tone:'info', title:'Emilim:', body:n.absorb.note }),
        html`<h3 class="section-h">En yoğun kaynaklar</h3>`,
        K.Table({ tight:true, headers:['Gıda', { label:'100 g\'da', num:true }, 'Porsiyon'],
          rows:sources.map(s => [s.food.name, U.fmtNum(U.round(s.per100, 2)) + ' ' + n.unit,
            (s.food.portions || [])[0] ? (s.food.portions[0].label + ' = ' + s.food.portions[0].g + ' g') : '—']) }),
        when(cheap.length, () => html`<h3 class="section-h">En ucuz kaynaklar</h3>`),
        when(cheap.length, () => K.Table({ tight:true,
          headers:['Gıda', { label:'Birim başı', num:true }, 'Fiyat'],
          rows:cheap.map(c => [c.food.name,
            U.fmtNet(c.tlPerUnit) + ' TL / ' + n.unit,
            html`${U.fmtNum(c.price.tl)} TL/kg ${P.cert(c.cert)}`]) })),
      ])),
      footer:String(K.Button({ label:'Kapat', act:'sheet-close' })),
      noFocus:true,
    });
  }

  function searchSheet(){
    const q = S.ui.foodQuery;
    const cat = S.ui.foodCat;
    let list = SP.FOODS;
    if(cat !== 'all') list = list.filter(f => f.cat === cat);
    if(q) list = list.filter(f => U.norm(f.name + ' ' + (f.aliases || []).join(' ')).indexOf(U.norm(q)) >= 0);
    const page = SP.C.paginate(list, S.ui.foodPage, 12);

    UI.sheet({
      title:'Besin ara', subtitle:list.length + ' gıda', wide:true,
      body:String(K.Stack([
        K.Input({ id:'food-q', value:q, placeholder:'Ara: mercimek, somon, yoğurt…',
          change:'food-query', data:{ 'data-debounce':'200' } }),
        K.Select({ value:cat, change:'food-cat',
          options:[{ value:'all', label:'Tüm kategoriler' }]
            .concat(SP.FOOD_CATS.map(c => ({ value:c.id, label:c.label }))) }),
        html`<div class="stack-xs">${map(page.items, f => html`
          <button class="foodrow" data-act="pick-food" data-id="${f.id}">
            <span class="foodrow__name">${f.name}</span>
            <span class="foodrow__meta num">${f.kcal} kcal · P ${U.fmtNet(f.p)} g</span>
          </button>`)}</div>`,
        when(!page.items.length, () => K.Empty({ text:'Eşleşen gıda yok.' })),
        K.Pager({ page:page.page, pages:page.pages, total:page.total, act:'food-page' }),
      ])),
      footer:String(K.Button({ label:'Kapat', act:'sheet-close' })),
      noFocus:true,
    });
  }

  function portionSheet(foodId){
    const f = SP.FOOD_BY_ID[foodId];
    if(!f) return;
    UI.sheet({
      title:f.name, subtitle:'Porsiyon seç',
      body:String(K.Stack([
        html`<div class="row wrap">${map(f.portions || [], p => K.Button({
          label:p.label + ' (' + p.g + ' g)', size:'sm',
          act:'add-portion', data:{ 'data-id':f.id, 'data-g':p.g, 'data-label':p.label } }))}</div>`,
        K.Field({ label:'Ya da gram gir (tarttıysan)',
          input:K.Input({ id:'portion-g', type:'number', numeric:true, min:1, step:'1', placeholder:'150' }) }),
        K.Table({ tight:true, headers:['100 gramda', { label:'Değer', num:true }], rows:[
          ['Kalori', f.kcal + ' kcal'], ['Protein', U.fmtNet(f.p) + ' g'],
          ['Yağ', U.fmtNet(f.f) + ' g'], ['Karbonhidrat', U.fmtNet(f.c) + ' g'],
          ['Lif', U.fmtNet(f.fib || 0) + ' g'],
        ] }),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Gram ile ekle', tone:'primary', act:'add-grams', data:{ 'data-id':f.id } })}`),
    });
  }

  /* --------------------------------------------------------------- ekran */

  async function render(){
    return String(K.Grid([
      K.Span(7, K.Stack([quickCard(), dayCard()])),
      K.Span(5, K.Stack([targetCard(), gapCard(), microCard()])),
      K.Span(12, raw(UI.rail(['portion', 'bioavailability', 'nutri-gap', 'lab-linked-food', 'macro-target']))),
    ]));
  }

  /* Metinden gelen kalemleri secili ogune yazar. */
  async function pushItems(items, note){
    const d = shownDate();
    const slot = S.ui.mealSlot || guessSlot();
    const rows = M.mealsOf(d).slice();
    let meal = rows.find(m => m.slot === slot);
    if(!meal){ meal = M.newMeal(slot); rows.push(meal); }
    meal.items = (meal.items || []).concat(items);
    if(note) meal.note = [meal.note, note].filter(Boolean).join(' · ');
    await M.saveMeals(d, rows);
  }

  const handle = {
    async 'shift-day'(el){
      const n = Number(el.dataset.value);
      S.ui.mealDate = n === 0 ? null : U.iso(U.addDays(U.parse(shownDate()), n));
      if(S.ui.mealDate === U.todayISO()) S.ui.mealDate = null;
      SP.App.render();
    },
    async 'focus-meal'(){
      const el = document.getElementById('meal-text');
      if(el) el.focus();
    },
    async 'add-meal'(){
      const el = document.getElementById('meal-text');
      if(!el || !el.value.trim()) return;
      const parsed = SP.Parse.parseMeal(el.value);
      if(!parsed.items.length){ UI.toast(parsed.note); return; }
      await pushItems(parsed.items.map(i => ({ foodId:i.foodId, g:i.g, cert:i.cert, portion:i.portion })),
        el.value.trim());
      el.value = '';
      UI.toast(parsed.note);
      SP.App.render();
    },
    async 'del-meal'(el){
      await M.deleteMeal(shownDate(), el.dataset.id);
      SP.App.render();
    },
    async 'del-item'(el){
      const rows = M.mealsOf(shownDate()).slice();
      const meal = rows.find(m => m.id === el.dataset.id);
      if(!meal) return;
      meal.items.splice(Number(el.dataset.i), 1);
      await M.saveMeals(shownDate(), rows);
      SP.App.render();
    },
    async 'open-search'(){ S.ui.foodPage = 1; searchSheet(); },
    async 'food-page'(el){ S.ui.foodPage = Number(el.dataset.page); searchSheet(); },
    async 'pick-food'(el){ portionSheet(el.dataset.id); },
    async 'add-portion'(el){
      await pushItems([{ foodId:el.dataset.id, g:Number(el.dataset.g),
        cert:'estimated', portion:el.dataset.label }]);
      UI.closeSheet();
      UI.toast('Eklendi');
      SP.App.render();
    },
    async 'add-grams'(el){
      const input = document.getElementById('portion-g');
      const g = input ? Number(input.value) : 0;
      if(!g){ UI.toast('Gram gir'); return; }
      await pushItems([{ foodId:el.dataset.id, g, cert:'measured', portion:null }]);
      UI.closeSheet();
      UI.toast('Eklendi · ölçüldü');
      SP.App.render();
    },
    async 'open-nutrient'(el){ nutrientSheet(el.dataset.id); },
  };

  const change = {
    async 'pick-slot'(el){ S.ui.mealSlot = el.value; },
    async 'food-query'(el){ S.ui.foodQuery = el.value; S.ui.foodPage = 1; searchSheet(); },
    async 'food-cat'(el){ S.ui.foodCat = el.value; S.ui.foodPage = 1; searchSheet(); },
  };

  return {
    id:'meals',
    title:'Öğünler',
    subtitle(){
      const t = SP.Nutri.dayTotals(shownDate());
      const tg = SP.Nutri.targets();
      if(t.empty) return U.fmtDate(shownDate()) + ' · kayıt yok';
      return Math.round(t.kcal) + ' kcal · protein ' + Math.round(t.protein) + ' g'
        + (tg.ok ? ' / ' + tg.protein.min + ' g' : '');
    },
    actions(){
      return String(K.Button({ label:'Mutfak', size:'sm', icon:'leaf', class:'btn--screen',
        act:'go', data:{ 'data-route':'kitchen' } }));
    },
    render, handle, change, guessSlot,
  };
})();
