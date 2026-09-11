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

  function quickEntry(){
    return K.Entry({
      label:'Öğün ekle', hint:'portion',
      meta:'tek satır, tek Enter',
      note:'Ev ölçüsü tanınır: tabak · kase · dilim · bardak · avuç · kaşık. '
        + 'Tarttıysan «150 g tavuk göğsü» yaz.',
      action:html`${K.Button({ label:'Besin ara', act:'open-search' })}
        ${K.Button({ label:'Fotoğraftan', icon:'camera', act:'open-photo' })}`,
      body:html`
        <div class="quick">
          ${K.Select({ id:'meal-slot', value:S.ui.mealSlot,
            options:SP.MEAL_SLOTS.map(s => ({ value:s.id, label:s.label })), change:'pick-slot' })}
          ${K.Mic({ target:'meal-text' })}
          ${K.Input({ id:'meal-text', placeholder:'1 tabak etli kuru fasulye, 2 dilim ekmek, 1 bardak ayran',
            aria:'Öğün metni' })}
          ${K.Button({ label:'Ekle', tone:'primary', act:'add-meal' })}
        </div>`,
    });
  }

  /* ---------------------------------------------------------- fotograf

     Fotograf tek basina zayif bir kaynaktir: porsiyon buyuklugu
     fotograftan guvenilir cikmaz. Bu yuzden UC KISA NOT sorulur.
     Serbest bir "not" alani degil uc alan -- tahmini guclendiren sey
     tam olarak bu uc bilgidir ve sorulmadan verilmez. */

  let photoFile = null;

  const AMOUNTS = [
    { value:'tamamı',   label:'Tamamı' },
    { value:'yarısı',   label:'Yarısı' },
    { value:'çeyreği',  label:'Çeyreği' },
    { value:'iki tabak',label:'İki tabak' },
  ];

  function photoSheet(){
    UI.sheet({
      title:'Fotoğraftan öğün', subtitle:'Üç kısa not tahmini belirgin ölçüde güçlendirir',
      wide:true,
      body:String(K.Stack([
        when(!SP.Extract.modelReady(), () => K.Notice({ tone:'warn',
          title:'Model bağlı değil.',
          body:'Fotoğraftan öğün okumak için Ayarlar → Rehber → Model bölümünden '
            + 'görüntü destekleyen bir sağlayıcı seç. Öğünü tek satır yazarak '
            + 'modelsiz de girebilirsin.' })),
        K.Drop({ act:'meal-photo', label:'Yemek fotoğrafı', icon:'camera',
          accept:'image/*', hint:'Fotoğrafı buraya bırak ya da seçmek için tıkla' }),
        html`<div id="photo-name" class="small dim">${photoFile ? photoFile.name : ''}</div>`,
        html`<div class="cols-2">
          ${K.Field({ label:'Ne kadarı yendi?',
            input:K.Select({ id:'ph-amount', options:AMOUNTS }) })}
          ${K.Field({ label:'Kabın ölçüsü', hint:'isteğe bağlı',
            input:K.Input({ id:'ph-vessel', placeholder:'24 cm tabak, çay bardağı…' }) })}
        </div>`,
        K.Field({ label:'Gizli malzeme', hint:'fotoğrafta görünmeyen şeyler',
          input:html`<div class="withmic">
            ${K.Input({ id:'ph-extra', placeholder:'zeytinyağlı, şekerli, tereyağında kavrulmuş…' })}
            ${K.Mic({ target:'ph-extra' })}
          </div>` }),
        K.Notice({ tone:'info', body:'Fotoğraftan gelen gramaj her zaman «tahmin» '
          + 'olarak işaretlenir. Tartıp düzeltirsen «ölçüldü» olur.' }),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Oku', tone:'primary', act:'run-photo',
          disabled:!photoFile || !SP.Extract.modelReady() })}`),
      noFocus:true,
    });
  }

  function photoPreviewSheet(res){
    UI.sheet({
      title:'Fotoğraftan okunanlar', subtitle:res.note, wide:true,
      body:String(K.Stack([
        when(res.items.length, () => html`<div>${map(res.items, (it, i) => {
          const f = SP.FOOD_BY_ID[it.foodId];
          return html`<div class="pasterow">
            ${K.Checkbox({ label:'', checked:!it.skip, act:'toggle-photo-row', data:{ 'data-i':i } })}
            <span><b class="small">${f ? f.name : it.foodId}</b>
              ${P.cert('estimated')}</span>
            <span class="pasterow__val num">${it.g} g</span>
            <span class="pasterow__src">fotoğraftan tahmin</span>
          </div>`;
        })}</div>`),
        when(!res.items.length, () => K.Notice({ tone:'warn', body:res.note })),
        when(res.unmatched.length, () => K.Notice({ tone:'info',
          title:'Eşleşmeyenler:',
          body:res.unmatched.map(x => x.line).join(' · ')
            + ' — bunlar gıda listemizde yok, kaydedilmedi.' })),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Öğüne ekle', tone:'primary', act:'save-photo',
          disabled:!res.items.filter(x => !x.skip).length })}`),
      noFocus:true,
    });
  }

  let photoRes = null;

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

  /* ------------------------------------------------------------- öneri

     Bu sayfa yeni bir kural icat etmez. Nesrin'in (beslenme) hedefi zaten
     Kerem'in (laboratuvar) bulgusundan besleniyor: SP.Nutri.labAdjust bir
     tahlil sonucu hedef bandın dışındaysa ilgili besin öğesinin hedefini
     yükseltir. Burada o zincir GÖRÜNÜR hale gelir — hangi ölçüm, hangi
     hedefi, ne kadar değiştirdi ve bunun karşılığı hangi yemektir.

     Zincir: ölçüm → hedef çarpanı → eksik öğe → o öğeyi taşıyan gıda. */

  const TABS = [
    { id:'gunluk', label:'Öğünler',      icon:'meal' },
    { id:'oneri',  label:'Öneri',        icon:'target' },
    { id:'deger',  label:'Besin değeri', icon:'layers' },
  ];

  function tabs(){
    const rows = M.mealsOf(shownDate());
    const items = TABS.map(t => Object.assign({}, t,
      t.id === 'gunluk' && rows.length ? { count:rows.length } : {}));
    return K.Subtabs({ items, value:S.ui.mealTab || 'gunluk', act:'meal-tab',
      aria:'Besin görünümü' });
  }

  /* Bazal metabolizma → hareket → hedef. Her adım ayrı yazılır ki
     çıkan sayının nereden geldiği tartışılabilir olsun. */
  function energyCard(){
    const tg = SP.Nutri.targets();
    const p = S.profile || {};
    if(!tg.ok){
      return K.Card({ title:'Günlük enerji',
        body:K.Notice({ tone:'warn', title:'Hesaplanamıyor.',
          body:'Profilde ' + tg.missing.join(', ') + ' eksik. Bu üçü olmadan bazal '
             + 'metabolizma tahmin edilmez; uydurulmuş bir sayı yazılmaz.' }),
        foot:K.Button({ label:'Profili tamamla', size:'sm', tone:'primary',
          act:'go', data:{ 'data-route':'family' } }) });
    }
    /* Gosterilen carpan, HESAPTA kullanilan carpanin ta kendisidir.
       Profilde hareket duzeyi secilmemisse motor varsayilana duser; kart
       da o varsayilani yazar, yoksa zincir kendi sayisini yalanlar. */
    const factor = SP.Nutri.activityFactor(p);
    const act = SP.ACTIVITY_LEVELS.find(a => a.factor === factor && a.id === p.activity)
      || SP.ACTIVITY_LEVELS.find(a => a.factor === factor);
    const guessed = !SP.ACTIVITY_LEVELS.some(a => a.id === p.activity);
    return K.Card({
      title:'Günlük enerji', hint:'macro-target',
      sub:'Bazal metabolizmadan hedefe',
      badge:K.Badge({ label:tg.goal.label, tone:'info' }),
      body:html`
        <div class="chain">
          <div class="chain__step">
            <span class="chain__label">Bazal metabolizma</span>
            <span class="chain__value num">${U.fmtNum(tg.bmr)}<small>kcal</small></span>
            <span class="chain__note">Mifflin-St Jeor · kilo, boy, yaş ve cinsiyet</span>
          </div>
          <div class="chain__op">×${U.fmtNet(factor)}</div>
          <div class="chain__step">
            <span class="chain__label">Hareketle</span>
            <span class="chain__value num">${U.fmtNum(tg.tdee)}<small>kcal</small></span>
            <span class="chain__note">${act ? act.label : 'varsayılan'}${when(guessed,
              () => html` <b>(profilde seçilmedi)</b>`)} — ${act ? act.note : ''}</span>
          </div>
          <div class="chain__op">${tg.goal.deficit === 0 ? '=' :
            (tg.goal.deficit > 0 ? '+' : '−') + '%' + Math.abs(Math.round(tg.goal.deficit * 100))}</div>
          <div class="chain__step chain__step--end">
            <span class="chain__label">Hedef</span>
            <span class="chain__value num">${U.fmtNum(tg.kcal)}<small>kcal</small></span>
            <span class="chain__note">${tg.goal.note}</span>
          </div>
        </div>
        <div class="cols-3 mt-16">
          ${K.Stat({ label:'Protein', value:tg.protein.min + '–' + tg.protein.max, unit:'g' })}
          ${K.Stat({ label:'Yağ', value:tg.fat.min + '–' + tg.fat.max, unit:'g' })}
          ${K.Stat({ label:'Lif', value:String(tg.fiber), unit:'g' })}
        </div>`,
      foot:html`<span class="small dim">Hedef değiştirmek için Hane ekranındaki
        amaç alanını değiştir.</span>`,
    });
  }

  /* Koçlar arası bağ: Kerem'in bulgusu Nesrin'in hedefini değiştirdiyse
     burada satır satır yazar. Değiştirmediyse bu kart hiç çizilmez —
     olmayan bir bağ için boş kutu göstermek gürültüdür. */
  function labLinkCard(){
    const tg = SP.Nutri.targets();
    const adj = tg.adjustments || {};
    const ids = Object.keys(adj);
    if(!ids.length){
      return K.Card({ title:'Tahlil bağı', hint:'lab-linked-food',
        body:K.Notice({ tone:'info',
          body:SP.Bio.summary().measured
            ? 'Şu an hiçbir tahlil sonucu beslenme hedefini değiştirmiyor. '
              + 'Ölçümler hedef bandın içinde.'
            : 'Henüz test girilmedi. Tahlil sonucu girildiğinde beslenme hedefi '
              + 'kendiliğinden ona göre ayarlanır.' }),
        foot:K.Button({ label:'Testler bölümüne git', size:'sm',
          act:'go', data:{ 'data-route':'labs' } }) });
    }
    return K.Card({
      title:'Tahlil bağı', hint:'lab-linked-food',
      sub:'Laboratuvar bulgusu beslenme hedefini değiştirdi',
      badge:K.Badge({ label:ids.length + ' hedef', tone:'warn' }),
      body:html`${map(ids, id => {
        const a = adj[id];
        const n = SP.NUTRI_BY_ID[id];
        const b = SP.BIO_BY_ID[a.marker];
        const last = M.latestOf(a.marker);
        return html`
          <div class="link">
            <div class="link__from">
              ${P.avatar('lab', 'sm')}
              <button class="linkbtn" data-act="open-marker-x" data-id="${a.marker}">
                ${b ? b.name : a.marker}</button>
              ${when(last, () => html`<b class="num small">${U.fmtNum(last.v)}
                <span class="dim">${b ? b.unit : ''}</span></b>`)}
            </div>
            <div class="link__arrow" aria-hidden="true">→</div>
            <div class="link__to">
              ${P.avatar('nutri', 'sm')}
              <b class="small">${n ? n.name : id}</b>
              ${K.Badge({ label:'hedef ×' + U.fmtNet(a.mult),
                tone:a.mult > 1 ? 'warn' : 'info' })}
            </div>
            <p class="link__why">${a.why}</p>
          </div>`;
      })}`,
    });
  }

  /* Eksik öğeyi hangi yemek kapatır? Öneri gıda listesinden gelir,
     modelden değil: kural motoru burada da otoritedir. */
  function suggestCard(){
    const g = SP.Nutri.gaps(7);
    if(!g.ok){
      return K.Card({ title:'Bugün ne yenmeli?',
        body:K.Notice({ tone:'info',
          body:'Öneri için en az birkaç günlük öğün kaydı gerekir. '
            + 'Kayıt yoksa eksik hesaplanamaz — sıfır sayılmaz.' }),
        foot:K.Button({ label:'Öğün ekle', size:'sm', tone:'primary',
          act:'meal-tab', data:{ 'data-tab':'gunluk' } }) });
    }
    const under = g.rows.filter(r => r.kind === 'under').slice(0, 4);
    if(!under.length){
      return K.Card({ title:'Bugün ne yenmeli?',
        body:K.Notice({ tone:'ok', body:'Son yedi günün ortalaması bütün besin '
          + 'öğelerinde hedefi karşılıyor. Öneri üretilmedi.' }) });
    }
    return K.Card({
      title:'Bugün ne yenmeli?', hint:'nutri-gap',
      sub:'Son yedi günün en büyük eksikleri ve onları taşıyan gıdalar',
      body:html`${map(under, r => html`
        <div class="sugg">
          <div class="sugg__head">
            <b class="small">${r.nutrient.name}</b>
            ${K.Badge({ label:'%' + Math.round(r.pct), tone:r.pct < 60 ? 'danger' : 'warn' })}
            <span class="tiny dim">${U.fmtNum(U.round(r.gap, 1))} ${r.nutrient.unit} eksik</span>
          </div>
          <div class="sugg__foods">${map(SP.Nutri.sourcesFor(r.id, 4), sr => html`
            <button class="suggfood" data-act="pick-food" data-id="${sr.food.id}">
              <b>${sr.food.name}</b>
              <span class="num">${U.fmtNum(U.round(sr.per100, 1))} ${r.nutrient.unit}
                <span class="dim">/100 g</span></span>
            </button>`)}</div>
          ${when(r.why, () => html`<p class="sugg__why">${r.why}</p>`)}
        </div>`)}`,
      foot:html`<span class="small dim">Bir gıdaya dokunarak porsiyonuyla öğüne ekleyebilirsin.</span>`,
    });
  }

  function adviceView(){
    return html`
      <section class="sect">
        <div class="sect__h"><div class="sect__ht">
          <div class="sect__eyebrow">Hedef</div>
          <h2>Enerji ve öneri</h2>
          <p>Bazal metabolizmadan hedefe, tahlil bulgusundan tabağa. Her adımın
            gerekçesi yazar; hiçbir sayı kaynağı olmadan görünmez.</p>
        </div></div>
        <div class="grid">
          <div class="span-7"><div class="stack">${[energyCard(), suggestCard()]}</div></div>
          <div class="span-5"><div class="stack">${[labLinkCard(), P.clinicalNote()]}</div></div>
        </div>
      </section>`;
  }

  async function render(){
    const tab = S.ui.mealTab || 'gunluk';
    const head = html`<div class="mb-8">${tabs()}</div>`;

    if(tab === 'oneri'){
      return String(html`${head}${K.Ledger(() => [
        energyCard(), labLinkCard(), suggestCard(),
      ])}
      <div class="mt-24">${raw(UI.rail(['macro-target', 'lab-linked-food', 'nutri-gap']))}</div>`);
    }

    if(tab === 'deger'){
      return String(html`${head}${K.Ledger(() => [microCard(), gapCard()])}
      <div class="mt-24">${raw(UI.rail(['bioavailability', 'nutri-gap']))}</div>`);
    }

    return String(html`${head}${K.Ledger(() => [
      quickEntry(), dayCard(), targetCard(),
    ])}
    <div class="mt-24">${raw(UI.rail(['portion', 'bioavailability', 'macro-target']))}</div>`);
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
    async 'open-photo'(){ photoFile = null; photoRes = null; photoSheet(); },
    async 'run-photo'(){
      if(!photoFile) return;
      const hints = {
        amount:(document.getElementById('ph-amount') || {}).value || '',
        vessel:(document.getElementById('ph-vessel') || {}).value || '',
        extra:(document.getElementById('ph-extra') || {}).value || '',
      };
      photoRes = await UI.withBusy('Fotoğraf okunuyor',
        'gramaj tahmin edilecek, ölçüm değil',
        () => SP.Extract.fromMealPhoto(photoFile, hints));
      photoPreviewSheet(photoRes);
    },
    async 'toggle-photo-row'(el){
      const i = Number(el.dataset.i);
      if(!photoRes || !photoRes.items[i]) return;
      photoRes.items[i].skip = !el.checked;
      photoPreviewSheet(photoRes);
    },
    async 'save-photo'(){
      if(!photoRes) return;
      const items = photoRes.items.filter(x => !x.skip);
      if(!items.length) return;
      await pushItems(items.map(i => ({ foodId:i.foodId, g:i.g, cert:'estimated',
        portion:'fotoğraf' })), 'fotoğraftan');
      photoRes = null; photoFile = null;
      UI.closeSheet();
      UI.toast(items.length + ' gıda eklendi · tahmin');
      SP.App.render();
    },
    async 'meal-tab'(el){ S.ui.mealTab = el.dataset.tab; SP.App.render(); },
    /* Tahlil bagindan olcume gitmek: Testler bolumu o olcumun egilimini acar. */
    async 'open-marker-x'(el){
      S.ui.trendMarker = el.dataset.id;
      S.ui.labTab = 'trend';
      SP.App.go('labs');
    },
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
    async 'meal-photo'(el){
      photoFile = (el.files && el.files[0]) || null;
      const n = document.getElementById('photo-name');
      if(n) n.textContent = photoFile ? photoFile.name : '';
      const run = document.querySelector('[data-act="run-photo"]');
      if(run) run.disabled = !photoFile || !SP.Extract.modelReady();
    },
    async 'pick-slot'(el){ S.ui.mealSlot = el.value; },
    async 'food-query'(el){ S.ui.foodQuery = el.value; S.ui.foodPage = 1; searchSheet(); },
    async 'food-cat'(el){ S.ui.foodCat = el.value; S.ui.foodPage = 1; searchSheet(); },
  };

  return {
    id:'meals',
    title:'Öğünler',
    headline(){
      const tg = SP.Nutri.targets();
      if(!tg.ok) return 'Hedef için profil eksik.';
      const t = SP.Nutri.dayTotals(shownDate());
      if(t.empty) return 'Bugün hiç öğün girilmedi.';
      const pct = U.pct(t.kcal, tg.kcal);
      if(pct > 115) return 'Bugün hedefin üstündesin.';
      if(pct >= 85) return 'Bugün hedefin içindesin.';
      return 'Günün ' + Math.round(pct) + '%\u2019i tamam.';
    },
    lede(){
      const tg = SP.Nutri.targets();
      if(!tg.ok){
        return 'Profilde ' + tg.missing.join(', ') + ' girilince bazal metabolizma ve '
          + 'hedef hesaplanır. Eksik veriden sayı uydurulmaz.';
      }
      const adj = Object.keys(tg.adjustments || {}).length;
      return tg.goal.label.toLocaleLowerCase('tr-TR') + ' hedefi için günde '
        + U.fmtNum(tg.kcal) + ' kcal ve ' + tg.protein.min + ' g protein.'
        + (adj ? ' ' + adj + ' hedef, tahlil sonucuna göre yükseltildi.' : '');
    },
    stats(){
      const tg = SP.Nutri.targets();
      if(!tg.ok) return [];
      const t = SP.Nutri.dayTotals(shownDate());
      return [
        { value:U.fmtNum(tg.bmr), label:'bazal (kcal)' },
        { value:U.fmtNum(tg.kcal), label:'hedef (kcal)' },
        { value:t.empty ? '0' : U.fmtNum(Math.round(t.kcal)), label:'bugün alınan' },
        { value:t.empty ? '0' : Math.round(t.protein), unit:'g', label:'protein' },
      ];
    },
    subtitle(){
      const t = SP.Nutri.dayTotals(shownDate());
      const tg = SP.Nutri.targets();
      if(t.empty) return U.fmtDate(shownDate()) + ' · kayıt yok';
      return Math.round(t.kcal) + ' kcal · protein ' + Math.round(t.protein) + ' g'
        + (tg.ok ? ' / ' + tg.protein.min + ' g' : '');
    },
    actions(){
      return String(html`${K.Button({ label:'Öğün ekle', icon:'plus', size:'sm', tone:'primary',
        act:'meal-tab', data:{ 'data-tab':'gunluk' } })}
        ${K.Button({ label:'Öneriyi aç', size:'sm', act:'meal-tab', data:{ 'data-tab':'oneri' } })}`);
    },
    render, handle, change, guessSlot,
  };
})();
