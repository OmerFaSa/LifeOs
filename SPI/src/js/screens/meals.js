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

  /* Saate gore ogun secimi: once kullanicinin kendi ogun saatleri
     (core/ogun.js), saat yoksa gunun saatine gore yerlesik sira. */
  function guessSlot(){ return SP.Ogun ? SP.Ogun.simdiki() : 'kahvalti'; }
  const acikSlotlar = () => SP.MEAL_SLOTS.filter(s => !s.gizli);

  /* ---------------------------------------------------------- giris */

  /* Akıllı tahmin & hızlı besin önerileri — aradıkça canlı daralır, boşken yuvaya göre önerir. */
  function mealSuggestionChips(){
    const slot = S.ui.mealSlot || guessSlot();
    const q = (S.ui.mealDraftQuery || '').trim();
    let list = [];
    if(q.length >= 2){
      const n = U.norm(q);
      list = SP.FOODS.filter(f => U.norm(f.name + ' ' + (f.aliases || []).join(' ')).indexOf(n) >= 0).slice(0, 6);
    } else {
      const slotMap = {
        kahvalti: ['yumurta', 'lor-peyniri', 'beyaz-peynir', 'yulaf', 'zeytin-siyah', 'omlet'],
        ara1:     ['muz', 'elma', 'badem', 'kefir', 'cilek'],
        ogle:     ['tavuk-gogsu', 'bulgur-pilavi', 'mercimek-corbasi', 'salatalik', 'ayran'],
        ara2:     ['protein-bar', 'fistik-ezmesi', 'ceviz', 'kuru-kayisi'],
        aksam:    ['somon', 'kofte', 'kuru-fasulye-etli', 'haslanmis-patates', 'suzme-yogurt'],
        gece:     ['kazein-protein', 'suzme-yogurt', 'yesil-cay', 'maden-suyu'],
      };
      const ids = slotMap[slot] || ['yumurta', 'tavuk-gogsu', 'yulaf', 'muz'];
      list = ids.map(id => SP.FOOD_BY_ID[id]).filter(Boolean);
    }
    if(!list.length) return '';
    return html`
      <div class="meal-suggs row wrap gap-6 mt-8" aria-label="Besin önerileri">
        ${map(list.slice(0, 4), f => {
          const p = (f.portions || [])[0];
          const pName = p ? p.label : '100g';
          return html`<button type="button" class="btn btn--xs btn--ghost chip-sugg"
            data-act="quick-add-food" data-id="${f.id}" data-g="${p ? p.g : 100}" data-label="${pName}"
            title="${f.name} · ${f.kcal} kcal · P ${f.p}g">
            + ${f.name} <span class="tiny dim">(${pName})</span>
          </button>`;
        })}
      </div>`;
  }

  /* iPhone Faz 2b: ev ölçüsü listesi ve «tarttıysan gramı yaz» ⓘ'de
     (hints: portion); alanın örnek metni biçimi zaten gösteriyor. */
  function quickEntry(){
    return K.Entry({
      label:'Öğün ekle', hint:'portion',
      action:html`${K.Button({ label:'Besin ara', act:'open-search' })}
        ${K.Button({ label:'Fotoğraftan', icon:'camera', act:'open-photo' })}`,
      body:html`
        <div class="quick">
          ${K.Select({ id:'meal-slot', value:S.ui.mealSlot || guessSlot(), aria:'Öğün',
            options:acikSlotlar().map(s => ({ value:s.id, label:s.label + (s.saat ? ' · ' + s.saat : '') })), change:'pick-slot' })}
          ${K.IconButton({ icon:'gear', size:'sm', plain:true, aria:'Öğünlerimi düzenle', act:'ogun-duzen' })}
          ${K.Mic({ target:'meal-text' })}
          ${K.Input({ id:'meal-text', placeholder:'1 tabak etli kuru fasulye, 2 dilim ekmek, 1 bardak ayran',
            aria:'Öğün metni', value:S.ui.mealDraftText || '' })}
          ${K.Button({ label:'Ekle', tone:'primary', act:'add-meal' })}
        </div>
        ${mealSuggestionChips()}`,
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
          body:'Fotoğraftan öğün okumak için HKM › Modeller’de «SPİ · Görsel» (ya da King) için '
            + 'görüntü okuyan bir model ata. Öğünü tek satır yazarak '
            + 'modelsiz de girebilirsin.' })),
        K.Drop({ act:'meal-photo', label:'Yemek fotoğrafı', icon:'camera', kamera:{},
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

  /* ---------------------------------------------------------- öğünlerim */

  function ogunSheet(){
    const t = S.ui.ogunTaslak;
    if(!t) return;
    UI.sheet({ title:'Öğünlerim', subtitle:'Adını ve saatini sen koy; eski kayıtlar yeni adla görünür',
      body:String(html`<div class="stack-sm" data-ogun-kok>
        ${map(t.liste, (x, i) => html`<div class="row gap-8 ogun-satir">
          ${K.Input({ value:x.label, placeholder:'Gün başlangıcı', aria:'Öğün ' + (i + 1) + ' adı', data:{ 'data-ogun-ad':String(i) } })}
          ${K.Input({ type:'time', value:x.saat || '', aria:'Öğün ' + (i + 1) + ' saati', data:{ 'data-ogun-saat':String(i) } })}
          ${K.Button({ label:'Sil', size:'sm', tone:'ghost', act:'ogun-sil', data:{ 'data-i':String(i) } })}
        </div>`)}
        <p>${K.Button({ label:'Öğün ekle', icon:'plus', size:'sm', tone:'ghost', act:'ogun-ekle' })}</p>
        <p class="tiny muted">Saat yazarsan öğün girerken o saate en yakın öğün kendiliğinden seçilir. Silinen öğünün
          eski kayıtları adını korur.</p>
        ${when(t.hata, () => html`<p class="small" role="alert">${t.hata}</p>`)}
      </div>`),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'ogun-kaydet' })}`), noFocus:true });
  }
  function ogunOku(){
    const t = S.ui.ogunTaslak, kok = document.querySelector('[data-ogun-kok]');
    if(!t || !kok) return;
    kok.querySelectorAll('[data-ogun-ad]').forEach(el => { const x = t.liste[Number(el.getAttribute('data-ogun-ad'))]; if(x) x.label = el.value.trim(); });
    kok.querySelectorAll('[data-ogun-saat]').forEach(el => { const x = t.liste[Number(el.getAttribute('data-ogun-saat'))]; if(x) x.saat = el.value || null; });
  }

  /* ---------------------------------------------------------- ogunler */

  function mealCard(meal){
    const a = SP.Nutri.absorbMeal(meal.items || []);
    const slot = SP.MEAL_SLOTS.find(s => s.id === meal.slot);
    return html`
      <div class="mealcard">
        <div class="mealcard__head">
          ${raw(UI.icon(slot ? slot.icon : 'meal'))}
          <span class="mealcard__slot">${SP.Ogun ? SP.Ogun.ad(meal.slot) : (slot ? slot.label : meal.slot)}</span>
          <span class="mealcard__kcal num">${(meal.items || []).some(it => Number(it.g) > 0) ? Math.round(a.raw.kcal) + ' kcal' : '— kcal'}</span>
          ${raw(String(SP.FotoUI.kutu({ sahip:'ogun:' + meal.id, sinif:'foto-kutu--sm',
            ad:(SP.Ogun ? SP.Ogun.ad(meal.slot) : (slot ? slot.label : meal.slot)) + ' · ' + U.fmtShort(shownDate()) })))}
          ${when(SP.Hazir && (meal.items || []).length, () => K.IconButton({ icon:'bookmark', size:'sm', plain:true,
            aria:'Hazır öğün yap', act:'hazir-ogun-sakla', data:{ 'data-id':meal.id } }))}
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'Öğünü sil',
            act:'del-meal', data:{ 'data-id':meal.id } })}
        </div>
        ${map(meal.items || [], (it, i) => {
          const f = SP.FOOD_BY_ID[it.foodId];
          if(!f) return '';
          return html`<div class="mealitem">
            <span class="mealitem__g num">${Number(it.g) > 0 ? it.g + ' g' : '—'}</span>
            <span class="mealitem__name">${f.name}
              ${when(it.portion, () => html`<span class="tiny dim"> · ${it.portion}</span>`)}</span>
            ${P.cert(it.cert)}
            ${K.IconButton({ icon:'close', size:'sm', plain:true, aria:'Çıkar',
              act:'del-item', data:{ 'data-id':meal.id, 'data-i':i } })}
          </div>`;
        })}
        <div class="row wrap mt-8">
          ${(() => {
            /* Eksik veri sıfır değildir (AGENTS §1.2): gramı girilmemiş kalem
               «Protein 0 g» diye gösterilmez; hesaba girmediği söylenir. */
            const gramli = (meal.items || []).filter(it => Number(it.g) > 0).length;
            const eksik = (meal.items || []).length - gramli;
            if(!gramli) return html`<span class="tiny dim">Besin değeri için kalemlerin gramı gerekli.</span>`;
            return html`<span class="tiny dim">Protein ${Math.round(a.raw.protein)} g ·
              yağ ${Math.round(a.raw.fat)} g · karbonhidrat ${Math.round(a.raw.carb)} g ·
              lif ${Math.round(a.raw.fiber)} g${eksik ? ' · ' + eksik + ' kalemin gramı yok, hesaba girmedi' : ''}</span>`;
          })()}
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
        : P.empty('Bu güne henüz öğün girilmedi.', 'Öğün ekle', 'focus-meal', null, true),
    });
  }

  /* ---------- D · vitrin kartları (brand/ortak/vitrin.js) ---------- */
  const VT = () => (window.LIFEOS || {}).VITRIN;
  const vkutu = (ad, yuva, ic) => ic ? K.Kutu({ ad, yuva, class:'vkutu', govde:raw(ic) }) : '';

  /* 072 TABAK: bölmeler hedefin enerji payı; ortada proteinden kalan gram.
     Öğün girilmemişse kalan «—» (yenmedi değil, girilmedi). */
  function tabakKutusu(){
    if(!VT()) return '';
    const t = SP.Nutri.targets();
    if(!t.ok) return '';
    const tot = SP.Nutri.dayTotals(shownDate());
    const k = (hedef, yenen) => tot.empty ? null : hedef - yenen;
    return vkutu('Tabak', tot.empty ? 'girilmedi' : 'kalan', VT().tabak({ bolmeler:[
      { ad:'Protein', pay:t.protein.min * 4, kalan:k(t.protein.min, tot.protein) },
      { ad:'Karbonhidrat', pay:t.carb.min * 4, kalan:k(t.carb.min, tot.carb) },
      { ad:'Yağ', pay:t.fat.min * 9, kalan:k(t.fat.min, tot.fat) } ] }));
  }

  /* 080 ÖĞÜN ÇİZELGESİ: öğünün girildiği saat (kayıt anı). */
  function cizelgeKutusu(){
    if(!VT()) return '';
    const d = shownDate();
    const og = M.mealsOf(d).filter(m => m.at && U.iso(new Date(m.at)) === d).map(m => {
      const t = new Date(m.at);
      const sl = SP.MEAL_SLOTS.find(x => x.id === m.slot);
      return { saat:t.getHours() + t.getMinutes() / 60, ad:(SP.Ogun ? SP.Ogun.ad(m.slot) : (sl ? sl.label : m.slot)) + ' · ' + U.pad2(t.getHours()) + ':' + U.pad2(t.getMinutes()),
        kucuk:/^ara/.test(m.slot) };
    });
    const n = new Date();
    return vkutu('Öğün çizelgesi', 'girildiği saat', VT().ogunCizelgesi({ ogunler:og,
      simdi:d === U.todayISO() ? n.getHours() + n.getMinutes() / 60 : null }));
  }

  /* 085 ÖĞÜN ŞABLONLARI: son 30 günde en az iki kez aynı içerikle girilen
     öğün tek dokunuşla eklenir (küçük aksiyon, «Geri al»). */
  function sablonlar(){
    const say = {};
    for(let i = 0; i < 30; i++){
      const d = U.iso(U.addDays(U.today(), -i));
      M.mealsOf(d).forEach(m => {
        const ids = (m.items || []).map(x => x.foodId).filter(id => SP.FOOD_BY_ID[id]);
        if(!ids.length) return;
        const anahtar = ids.slice().sort().join('+');
        const x = say[anahtar] || (say[anahtar] = { anahtar, n:0, ornek:{ date:d, id:m.id }, slot:m.slot, ids });
        x.n++;
      });
    }
    return Object.keys(say).map(k => say[k]).filter(x => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 3);
  }
  /* HAZIR ÖĞÜNLER (core/hazir.js, 2026-10-17): kullanıcının adını koyduğu
     öğünler üstte, son 30 günün sık öğünleri altta; ikisi de tek dokunuş.
     «Düzenle» yalnız silme listesini açar. */
  function sablonKutusu(){
    if(!VT()) return '';
    const bugun = M.mealsOf(shownDate()).map(m => (m.items || []).map(x => x.foodId).sort().join('+'));
    const anahtar = items => (items || []).map(x => x.foodId).sort().join('+');
    const hazir = SP.Hazir ? SP.Hazir.ogunler() : [];
    const sik = sablonlar().filter(x => !hazir.some(h => anahtar(h.items) === x.anahtar));
    if(!hazir.length && !sik.length) return '';
    const duzen = !!S.ui.hazirOgunDuzen && hazir.length;
    const ust = hazir.length ? '<div class="hazir__ust">'
      + String(K.Button({ label:duzen ? 'Bitti' : 'Düzenle', size:'sm', tone:'ghost', act:'hazir-ogun-duzen' })) + '</div>' : '';
    const liste = duzen
      ? '<ul class="hazir__liste">' + hazir.map(h => '<li><span><b>' + U.esc(h.ad) + '</b><small>' + U.esc(SP.Hazir.ogunOzet(h)) + '</small></span>'
        + String(K.Button({ label:'Sil', size:'sm', tone:'ghost', act:'hazir-ogun-sil', data:{ 'data-id':h.id } })) + '</li>').join('') + '</ul>'
      : hazir.length ? VT().ogunSablonlari({ act:'hazir-ogun-ekle', baslik:'senin hazırladıkların · tek dokunuş', sablonlar:hazir.map(h => ({ ad:h.ad,
        icerik:SP.Hazir.ogunOzet(h), on:bugun.indexOf(anahtar(h.items)) >= 0, data:{ 'data-id':h.id } })) }) : '';
    const sikHtml = sik.length && !duzen ? VT().ogunSablonlari({ act:'sablon-ekle', baslik:'sık öğünler · son 30 gün', sablonlar:sik.map(x => {
      const sl = SP.MEAL_SLOTS.find(y => y.id === x.slot);
      return { ad:SP.Ogun ? SP.Ogun.ad(x.slot) : (sl ? sl.label : x.slot), icerik:x.ids.map(id => SP.FOOD_BY_ID[id].name.toLocaleLowerCase('tr-TR')).join(' · '),
        on:bugun.indexOf(x.anahtar) >= 0, data:{ 'data-date':x.ornek.date, 'data-id':x.ornek.id } };
    }) }) : '';
    return vkutu('Hazır öğünler', '', ust + liste + sikHtml);
  }
  function hazirOgunSheet(meal){
    UI.sheet({
      title:'Hazır öğün yap', subtitle:'Öğün sayfasında tek dokunuşla bugüne eklenir',
      body:String(K.Stack([
        K.Field({ label:'Adı', input:K.Input({ id:'hazir-ogun-ad', value:SP.Hazir.ogunVarsayilanAd(meal) }) }),
        html`<p class="tiny dim">${SP.Hazir.ogunOzet(meal)}</p>`,
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Sakla', tone:'primary', act:'hazir-ogun-kaydet', data:{ 'data-id':meal.id } })}`),
    });
  }

  /* ---------------------------------------------------------- hedefler */

  function targetCard(){
    const d = shownDate();
    const t = SP.Nutri.targets(null, d);
    const tot = SP.Nutri.dayTotals(d);

    if(!t.ok){
      return K.Card({ title:'Günlük hedef',
        body:K.Notice({ tone:'warn', title:'Hesaplanamıyor.',
          body:'Profilde ' + t.missing.join(', ') + ' eksik. Bu üçü olmadan kalori '
             + 've protein hedefi tahmin edilmez.' }),
        foot:K.Button({ label:'Profili aç', size:'sm',
          act:'go', data:{ 'data-route':'family' } }) });
    }

    return K.Card({
      title:'Günlük hedef', hint:'macro-target',
      sub:t.goal.label + ' · ' + U.fmtNum(t.tdee) + ' kcal ihtiyaç'
        + (t.need && t.need.hareketYok ? ' (hareket girilmedi)' : ''),
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

  /* iPhone Faz 2b (2026-10-02): günün kalorisi ve proteini hedefle birlikte
     küçük dönen kartta; «Günlük hedef» kartı ayrıntısıyla şerittir. Hedef
     hesaplanır (bazal metabolizma). Yenen toplam ev ölçüsünden geldiyse
     TAHMİN, hepsi tartıldıysa HESAPLANDI. Öğün girilmemiş gün ve gramı
     olmayan kalem «0 kcal» değildir: sayı değil cümle, eksik kalem yazılır
     (AGENTS §1.2). Her madde tek söz söyler (satır tek satırdır, sığmayan
     kesilir): eksik kalem Kalori'de, eksik profil kendi maddesinde. */
  function DonenOgun(){
    const V = VT();
    if(!V || !V.donen) return '';
    const L = window.LIFEOS || {};
    const sayi = s => L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger) + (s.birim ? ' ' + s.birim : ''));
    const d = shownDate();
    const gun = d === U.todayISO() ? '' : ' · ' + U.fmtShort(d);
    const tg = SP.Nutri.targets();
    const t = SP.Nutri.dayTotals(d);
    const kalemler = M.mealsOf(d).reduce((a, x) => a.concat(x.items || []), []).filter(it => SP.FOOD_BY_ID[it.foodId]);
    const gramli = kalemler.filter(it => Number(it.g) > 0);
    const eksik = [t.unknownFoods.length ? t.unknownFoods.length + ' kalem tanınmadı' : '',
      kalemler.length > gramli.length ? (kalemler.length - gramli.length) + ' kalemin gramı yok' : ''].filter(Boolean).join(', ');
    const tahmin = gramli.some(it => it.cert !== 'measured');
    const m = [];
    if(!gramli.length){
      m.push({ ust:'Kalori' + gun, cumle:t.empty ? 'Öğün girilmedi.' : kalemler.length ? 'Gram girilmedi.' : 'Kalem tanınmadı.',
        vurgu:eksik ? eksik + '.' : tg.ok ? 'Hedef ' + U.fmtNum(tg.kcal) + ' kcal.' : '', sistem:'spi' });
      if(tg.ok) m.push({ ust:'Protein' + gun, cumle:'Hedef ' + tg.protein.min + '–' + tg.protein.max + ' g.',
        vurgu:'Öğün girilince hesaplanır.', sistem:'spi' });
    }else{
      /* Köken kartı (025): tahminde kaynak, hesapta formül ve girdi. */
      const kes = tahmin
        ? { kesinlik:'estimated', kaynak:'ev ölçüsünden gram × besin tablosu', zaman:d }
        : { kesinlik:'computed', formul:'tartılan gram × besin tablosu', zaman:d,
            girdiler:[{ ad:'Tartılan kalem', deger:gramli.length, birim:'kalem', kesinlik:'measured' }] };
      m.push({ ust:'Kalori' + gun, sayi:sayi(Object.assign({ deger:Math.round(t.kcal), birim:'kcal' }, kes)), cumle:'alındı.',
        vurgu:eksik ? eksik + '; toplama girmedi.'
          : tg.ok ? 'Hedef ' + U.fmtNum(tg.kcal) + ' kcal' + (tahmin ? ' · tahmin.' : '.')
          : tahmin ? 'Ev ölçüsünden tahmin.' : 'Tartılan gramdan.', sistem:'spi' });
      m.push({ ust:'Protein' + gun, sayi:sayi(Object.assign({ deger:Math.round(t.protein), birim:'g' }, kes)), cumle:'alındı.',
        vurgu:tg.ok ? 'Hedef ' + tg.protein.min + '–' + tg.protein.max + ' g.' : 'Hedef hesaplanmadı.', sistem:'spi' });
    }
    if(!tg.ok){
      m.push({ ust:'Günlük hedef', cumle:'Hedef yok.', vurgu:'Profilde ' + tg.missing.join(', ') + ' eksik.', sistem:'spi',
        dugme:{ label:'Profil', act:'go', data:{ 'data-route':'family' } } });
    }
    const adj = tg.ok ? Object.keys(tg.adjustments || {}) : [];
    if(adj.length){
      const girdiler = adj.map(k => {
        const mk = tg.adjustments[k].marker, son = M.latestOf(mk), b = SP.BIO_BY_ID[mk];
        return { ad:b ? b.name : mk, deger:son ? son.v : null, birim:b ? b.unit : '', kesinlik:son ? 'measured' : 'missing' };
      });
      m.push({ ust:'Tahlil bağı', sayi:sayi({ deger:adj.length, birim:'hedef', kesinlik:'computed',
          formul:'hedef bandın dışındaki tahlil → besin hedefi çarpanı', girdiler, zaman:U.todayISO() }),
        cumle:'yükseltildi.', vurgu:adj.map(k => SP.NUTRI_BY_ID[k] ? SP.NUTRI_BY_ID[k].name : k).join(', ') + '.', sistem:'spi',
        dugme:{ label:'Öneri', act:'meal-tab', data:{ 'data-tab':'oneri' } } });
    }
    return raw(V.donen({ id:'spi-ogun', ad:'Öğün', maddeler:m }));
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
        html`<div class="row gap-6">
          ${K.Input({ id:'food-q', value:q, placeholder:'Ara: mercimek, somon, yoğurt…',
            change:'food-query', data:{ 'data-debounce':'200' } })}
          ${K.Button({ label:'Barkod', size:'sm', act:'barkod-ac' })}</div>`,
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

  /* Barkod (core/barkod.js, fikir 4): kişisel defter. Bilinen barkod
     doğrudan porsiyona gider; bilinmeyen için gıda SORULUR ve bağlanır. */
  let barkodKod = null;

  function barkodSheet(hata){
    UI.sheet({
      title:'Barkod', subtitle:'ilk okutmada bir gıdaya bağlanır, sonra doğrudan gelir',
      body:String(K.Stack([
        when(SP.Barkod.fotoVar(), () => K.Drop({ act:'barkod-foto', label:'Barkodun fotoğrafı', kamera:{},
          icon:'file', accept:'image/*', hint:'Barkodu yakından çek ya da fotoğraf seç' })),
        when(!SP.Barkod.fotoVar(), () => K.Notice({ tone:'info',
          body:'Bu tarayıcı fotoğraftan barkod okuyamıyor; numarayı elle yaz.' })),
        K.Field({ label:'Barkod numarası', hint:'8 ya da 13 hane',
          input:K.Input({ id:'barkod-kod', numeric:true, placeholder:'8690000000000' }) }),
        html`<div id="barkod-hata" class="small" role="alert">${hata || ''}</div>`,
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Bul', tone:'primary', act:'barkod-bul' })}`),
      noFocus:true,
    });
  }

  function barkodBagSheet(){
    const q = S.ui.barkodQ || '';
    let list = SP.FOODS;
    if(q) list = list.filter(f => U.norm(f.name + ' ' + (f.aliases || []).join(' ')).indexOf(U.norm(q)) >= 0);
    UI.sheet({
      title:'Bu barkod hangi gıda?', subtitle:barkodKod + ' · henüz bir gıdaya bağlı değil', wide:true,
      body:String(K.Stack([
        K.Input({ id:'barkod-q', value:q, placeholder:'Ara: yoğurt, ekmek…',
          change:'barkod-q', data:{ 'data-debounce':'200' } }),
        html`<div class="stack-xs">${map(list.slice(0, 12), f => html`
          <button class="foodrow" data-act="barkod-bagla" data-id="${f.id}">
            <span class="foodrow__name">${f.name}</span>
            <span class="foodrow__meta num">${f.kcal} kcal · P ${U.fmtNet(f.p)} g</span>
          </button>`)}</div>`,
        when(!list.length, () => K.Empty({ text:'Eşleşen gıda yok.' })),
        html`<p class="tiny dim">Seçtiğin gıda bu barkoda bağlanır; sonraki okutmada doğrudan gelir.
          Listede yoksa önce gıdayı ekle.</p>`,
      ])),
      footer:String(K.Button({ label:'Vazgeç', act:'sheet-close' })),
      noFocus:true,
    });
  }

  async function barkodSonuc(r){
    if(!r.ok){ barkodSheet(r.why); return; }
    barkodKod = r.kod;
    if(r.foodId){ portionSheet(r.foodId); return; }
    S.ui.barkodQ = '';
    barkodBagSheet();
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

  /* Bazal metabolizma → hareket → hedef. Her adım ayrı yazılır ki
     çıkan sayının nereden geldiği tartışılabilir olsun. */
  function energyCard(){
    const d = shownDate();
    const tg = SP.Nutri.targets(null, d);
    if(!tg.ok){
      return K.Card({ title:'Günlük enerji',
        body:K.Notice({ tone:'warn', title:'Hesaplanamıyor.',
          body:'Profilde ' + tg.missing.join(', ') + ' eksik. Bu üçü olmadan bazal '
             + 'metabolizma tahmin edilmez; uydurulmuş bir sayı yazılmaz.' }),
        foot:K.Button({ label:'Profili tamamla', size:'sm',
          act:'go', data:{ 'data-route':'family' } }) });
    }
    /* Zincir: bazal metabolizma + o gün GİRİLEN hareket = ihtiyaç → hedef.
       Hareket düzeyi çarpanı yok (kullanıcı, 2026-10-20): hareket girilmeyen
       gün ihtiyaç bazal metabolizmadır, tahmin eklenmez. */
    const n = tg.need;
    const seans = n.seanslar.map(s => s.ad + ' ' + s.dakika + ' dk · ' + U.fmtNum(s.kcal) + ' kcal').join(' · ');
    return K.Card({
      title:'Günlük enerji', hint:'macro-target',
      sub:U.fmtDate(d) + ' · bazal metabolizma ve girilen hareket',
      badge:K.Badge({ label:tg.goal.label, tone:'info' }),
      body:html`
        <div class="chain">
          <div class="chain__step">
            <span class="chain__label">Bazal metabolizma</span>
            <span class="chain__value num">${U.fmtNum(tg.bmr)}<small>kcal</small></span>
            <span class="chain__note">Mifflin-St Jeor · kilo, boy, yaş ve cinsiyet</span>
          </div>
          <div class="chain__op">+</div>
          <div class="chain__step">
            <span class="chain__label">Girilen hareket</span>
            <span class="chain__value num">${n.hareketYok ? '—' : U.fmtNum(n.hareket)}<small>kcal</small></span>
            <span class="chain__note">${n.hareketYok ? 'Bu gün hareket girilmedi; ihtiyaca eklenmedi.'
              : seans + ' · net MET (hesaplandı)'}${when(n.eksik.length, () => html` <b>Hesaba girmeyen: ${n.eksik.join(', ')}.</b>`)}</span>
          </div>
          <div class="chain__op">=</div>
          <div class="chain__step">
            <span class="chain__label">İhtiyaç</span>
            <span class="chain__value num">${U.fmtNum(tg.tdee)}<small>kcal</small></span>
            <span class="chain__note">hesaplandı · günden güne değişir</span>
          </div>
          <div class="chain__op">${tg.goal.deficit === 0 ? '=' :
            (tg.goal.deficit > 0 ? '+' : '−') + '%' + Math.abs(Math.round(tg.goal.deficit * 100))}</div>
          <div class="chain__step chain__step--end">
            <span class="chain__label">Hedef</span>
            <span class="chain__value num">${U.fmtNum(tg.kcal)}<small>kcal</small></span>
            <span class="chain__note">${tg.kcalKaynak === 'plan' ? 'Uygulanan planın günlük farkı' : tg.goal.note}${when(tg.bmrTaban, () => ' · bazal metabolizmanın altına inmez')}</span>
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
            ${K.Katmanli({ metin:a.why, sinif:'link__why' })}
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
        foot:K.Button({ label:'Öğün ekle', size:'sm',
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

  function akilliBeslenmeKutusu(){
    const list = (SP.SPOR_BESLENME || []).slice(0, 6);
    if(!list.length) return '';
    return K.Card({
      title:'Beslenme ve emilim notları',
      sub:'Kanıta dayalı sporcu beslenmesi ve biyoyararlanım senaryoları',
      body:html`<div class="stack-sm">${map(list, s => html`
        <div class="ogrenme">
          <div class="row between gap-6 mb-2">
            <b class="small" style="color:var(--text)">${s.situation}</b>
            <span class="tiny dim">Akıllı İlke</span>
          </div>
          <p class="small mb-0" style="line-height:1.4">${s.editor_action}</p>
        </div>`)}</div>`,
    });
  }

  /* Sekme yok (EKIP-PLANI §1.2): üç bölüm alt alta; bölüm çubuğu kaydırır,
     günün öğün sayısı çubukta rozet. Bir bölüm çizilemezse yalnız o bölüm
     sakin bir notla düşer. */
  const BODIES = {
    /* iPhone Faz 2b: sol sütun iş (öğünü yaz, günün öğünleri), sağ sütun
       durum ve kısayol (dönen «Öğün» kartı, sık öğünler); raf DOM sırasıyla
       ikişer dizer. Telefonda tek sütun: önce yazma alanı. */
    gunluk:() => html`${K.Ledger(() => [quickEntry(), DonenOgun(), dayCard(), sablonKutusu(), cizelgeKutusu(), targetCard(), tabakKutusu()])}
      <div class="mt-24">${raw(UI.rail(['portion', 'bioavailability', 'macro-target']))}</div>`,
    oneri:() => html`${K.Ledger(() => [energyCard(), labLinkCard(), suggestCard(), akilliBeslenmeKutusu()])}
      <div class="mt-24">${raw(UI.rail(['macro-target', 'lab-linked-food', 'nutri-gap']))}</div>`,
    deger:() => html`${K.Ledger(() => [microCard(), gapCard()])}
      <div class="mt-24">${raw(UI.rail(['bioavailability', 'nutri-gap']))}</div>`,
  };

  function govde(t){
    try{ return BODIES[t.id](); }
    catch(e){
      console.error('Öğün bölümü çizilemedi (' + t.id + '):', e);
      return K.Notice({ tone:'warn', body:'Bu bölüm şu an çizilemedi; verin yerinde duruyor.' });
    }
  }

  /* PANO KARTLARI (2026-10-20; brand/ortak/pano.js): öğünlerim günün
     çizgisinde (kendi öğün adların ve saatlerin; girilen öğün dolu nokta)
     ve makrolar tek yığılmış çubukta. Kayıt yoksa boş hâl. */
  function PanoOgun(){
    const P = (window.LIFEOS || {}).PANO;
    if(!P || !SP.Ogun) return '';
    const d = shownDate();
    const ogunler = M.mealsOf(d);
    const slotlar = SP.Ogun.liste();
    const dk = s => /^\d{1,2}:\d{2}$/.test(s || '') ? Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]) : null;
    const saatli = slotlar.every(s => dk(s.saat) != null);
    const bas = 5 * 60, bit = 23 * 60;
    const noktalar = slotlar.map((s, i) => ({ ad:s.label, dolu:ogunler.some(m => m.slot === s.id),
      yer:saatli ? Math.max(0, Math.min(1, (dk(s.saat) - bas) / (bit - bas))) : (slotlar.length > 1 ? i / (slotlar.length - 1) : .5) }));
    const girilen = noktalar.filter(n => n.dolu).length;
    const sira = noktalar.find(n => !n.dolu);
    const sirada = sira ? slotlar[noktalar.indexOf(sira)] : null;
    const ogunKart = P.kart({ tur:'ogunlerim', ad:'Öğünlerim', simge:'ogun', yuva:girilen + ' / ' + slotlar.length,
      govde:P.cizgi({ noktalar }) + P.not(sirada ? 'Sıradaki: ' + sirada.label + (sirada.saat ? ' · ' + sirada.saat : '') : 'Bütün öğünler girildi.') });
    const t = SP.Nutri.dayTotals(d);
    const tg = SP.Nutri.targets(null, d);
    const g = x => Math.round(Number(x) || 0);
    const makro = t.empty
      ? P.kart({ tur:'makro', ad:'Makrolar', simge:'cubuk', bos:{ cumle:'Öğün girilince protein, karbonhidrat ve yağ burada çizilir.' } })
      : P.kart({ tur:'makro', ad:'Makrolar', simge:'cubuk', yuva:'girilen öğünlerden',
          govde:P.yigin({ parcalar:[{ ad:'Protein', deger:g(t.protein), metin:g(t.protein) + ' g' }, { ad:'Karbonhidrat', deger:g(t.carb), metin:g(t.carb) + ' g' },
            { ad:'Yağ', deger:g(t.fat), metin:g(t.fat) + ' g' }] })
            + (tg.ok && tg.protein ? P.esik({ deger:g(t.protein), esik:tg.protein.min, etiket:'Protein ' + g(t.protein) + ' gram, hedef en az ' + tg.protein.min, yon:'artis-iyi' })
              + P.not('protein · hedef en az ' + tg.protein.min + ' g') : '') });
    /* Su ve protein serileri: son 14 gün (dolu: eşik/hedef tuttu, yarım:
       girildi ama tutmadı, kesik: kayıt yok). */
    const on4 = []; for(let i = 13; i >= 0; i--) on4.push(U.iso(U.addDays(U.today(), -i)));
    const suDurum = on4.map(g => { const v = S.vitals[g]; const ml = v && v.water != null ? Number(v.water) : null; return ml == null ? 'yok' : ml >= 2000 ? 'dolu' : 'yarim'; });
    const suKart = P.kart({ tur:'su-serisi', ad:'Su · 14 gün', simge:'su', yuva:suDurum.filter(x => x === 'dolu').length + ' gün 2 L',
      govde:P.kareler({ durumlar:suDurum, sutun:14, etiket:'Son 14 günün ' + suDurum.filter(x => x === 'dolu').length + '’inde 2 litre içildi' })
        + P.not('dolu: 2 L ve üstü · yarım: girildi · kesik: kayıt yok') });
    const tgP = tg.ok && tg.protein ? tg.protein.min : null;
    const prDurum = on4.map(g => { const x = SP.Nutri.dayTotals(g); return x.empty ? 'yok' : tgP && x.protein >= tgP ? 'dolu' : 'yarim'; });
    const prKart = tgP ? P.kart({ tur:'protein-serisi', ad:'Protein · 14 gün', simge:'cubuk', yuva:prDurum.filter(x => x === 'dolu').length + ' gün hedefte',
      govde:P.kareler({ durumlar:prDurum, sutun:14, etiket:'Son 14 günün ' + prDurum.filter(x => x === 'dolu').length + '’inde protein hedefi tuttu' })
        + P.not('dolu: en az ' + tgP + ' g · yarım: öğün var, hedef altında · kesik: öğün yok') }) : '';
    /* En sık yenenler: son 30 günün öğün kalemleri. */
    const say = {};
    for(let i = 0; i < 30; i++){
      M.mealsOf(U.iso(U.addDays(U.today(), -i))).forEach(m => (m.items || []).forEach(it => { if(it.foodId) say[it.foodId] = (say[it.foodId] || 0) + 1; }));
    }
    const sik = Object.keys(say).sort((a, b) => say[b] - say[a]).slice(0, 5);
    const enSik = say[sik[0]] || 1;
    const sikKart = sik.length >= 2 ? P.kart({ tur:'sik-yenenler', ad:'En sık yenenler', simge:'ogun', yuva:'son 30 gün',
      govde:P.cubuklar({ satirlar:sik.map(id => ({ ad:(SP.FOOD_BY_ID[id] || {}).name || id, oran:say[id] / enSik, metin:say[id] + ' kez' })) }) }) : '';
    /* Öğün saatleri: son 30 günün öğünleri günün saatlerine göre (girilen
       saat; yoksa kaydın saati). */
    const saat = new Array(24).fill(null);
    for(let i = 0; i < 30; i++){
      M.mealsOf(U.iso(U.addDays(U.today(), -i))).forEach(m => {
        const s = /^(\d{1,2}):/.exec(m.time || '') || /T(\d{2}):/.exec(m.at || '');
        if(s){ const h = Number(s[1]); saat[h] = (saat[h] || 0) + 1; }
      });
    }
    const saatKart = saat.filter(v => v != null).length >= 3 ? P.kart({ tur:'ogun-saatleri', ad:'Öğün saatlerin', simge:'saat', yuva:'son 30 gün',
      govde:P.sutun({ degerler:saat, yukseklik:44, etiket:'Öğünlerin günün saatlerine dağılımı' })
        + '<div class="pk-saat__ad"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>'
        + P.not('girilen öğün saati; yoksa kaydın saati') }) : '';
    return '<div class="pk-ust">' + P.izgara([ogunKart, makro, suKart, prKart, sikKart, saatKart]) + '</div>';
  }

  async function render(){
    const n = M.mealsOf(shownDate()).length;
    return String(PanoOgun() + K.SayfaBolumleri({ act:'meal-tab', aria:'Besin bölümleri',
      bolumler:TABS.map(t => ({ id:t.id, ad:t.label, govde:govde(t),
        sayi:t.id === 'gunluk' && n ? n : null })) }));
  }

  /* Başka yerden istenen bölüm (ofis kartının «Besin değeri tablosu» gibi)
     çizimden sonra görünür yapılır; istek bir kez kullanılır. */
  function afterRender(){
    const t = S.ui.mealTab;
    S.ui.mealTab = null;
    if(t && t !== TABS[0].id && TABS.some(x => x.id === t)) K.bolumeGit(t);

    const mt = document.getElementById('meal-text');
    if(mt && !mt._hasAutoListener){
      mt._hasAutoListener = true;
      mt.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        S.ui.mealDraftQuery = val;
        S.ui.mealDraftText = e.target.value;
        const cont = document.querySelector('.meal-suggs');
        if(cont){
          let list = [];
          if(val.length >= 2){
            const n = U.norm(val);
            list = SP.FOODS.filter(f => U.norm(f.name + ' ' + (f.aliases || []).join(' ')).indexOf(n) >= 0).slice(0, 6);
          }
          if(list.length){
            cont.innerHTML = list.slice(0, 4).map(f => {
                const p = (f.portions || [])[0];
                const pName = p ? p.label : '100g';
                return `<button type="button" class="btn btn--xs btn--ghost chip-sugg"
                  data-act="quick-add-food" data-id="${f.id}" data-g="${p ? p.g : 100}" data-label="${pName}"
                  title="${f.name} · ${f.kcal} kcal · P ${f.p}g">
                  + ${f.name} <span class="tiny dim">(${pName})</span>
                </button>`;
              }).join('');
          }
        }
      });
    }
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
    async 'meal-tab'(el){ K.bolumeGit(el.dataset.tab); },
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
    async 'quick-add-food'(el){
      const foodId = el.dataset.id;
      const f = SP.FOOD_BY_ID[foodId];
      if(!f) return;
      const g = Number(el.dataset.g) || 100;
      const portion = el.dataset.label || '1 porsiyon';
      await pushItems([{ foodId:f.id, g:g, cert:'estimated', portion:portion }], f.name);
      S.ui.mealDraftText = '';
      S.ui.mealDraftQuery = '';
      UI.toast(f.name + ' (' + portion + ') eklendi · tahmin');
      SP.App.render();
    },
    async 'add-meal'(){
      const el = document.getElementById('meal-text');
      if(!el || !el.value.trim()) return;
      const parsed = SP.Parse.parseMeal(el.value);
      if(!parsed.items.length){ UI.toast(parsed.note); return; }
      await pushItems(parsed.items.map(i => ({ foodId:i.foodId, g:i.g, cert:i.cert, portion:i.portion })),
        el.value.trim());
      el.value = '';
      S.ui.mealDraftText = '';
      S.ui.mealDraftQuery = '';
      UI.toast(parsed.note);
      SP.App.render();
    },
    'hazir-ogun-sakla'(el){
      const meal = M.mealsOf(shownDate()).find(m => m.id === el.dataset.id);
      if(meal && SP.Hazir) hazirOgunSheet(meal);
    },
    async 'hazir-ogun-kaydet'(el){
      const meal = M.mealsOf(shownDate()).find(m => m.id === el.dataset.id);
      const g = document.getElementById('hazir-ogun-ad');
      const r = meal ? await SP.Hazir.ogunSakla(meal, g ? g.value : '') : { ok:false, why:'Öğün bulunamadı.' };
      UI.closeSheet();
      UI.toast(r.ok ? '«' + r.kayit.ad + '» hazır öğünlere eklendi' : r.why);
      SP.App.render();
    },
    async 'hazir-ogun-ekle'(el){
      const d = shownDate();
      const r = await SP.Hazir.ogunEkle(el.dataset.id, d, guessSlot());
      if(!r.ok){ UI.toast(r.why); return; }
      SP.App.render();
      { const Z = (window.LIFEOS || {}).ZEMIN; if(Z && Z.nabiz) Z.nabiz(); }
      UI.toast('«' + r.ad + '» eklendi', { undo:async () => { await r.geriAl(); SP.App.render(); } });
    },
    'hazir-ogun-duzen'(){ S.ui.hazirOgunDuzen = !S.ui.hazirOgunDuzen; SP.App.render(); },
    async 'hazir-ogun-sil'(el){
      const h = SP.Hazir.ogunler().find(x => x.id === el.dataset.id);
      const r = await SP.Hazir.ogunSil(el.dataset.id);
      if(!SP.Hazir.ogunler().length) S.ui.hazirOgunDuzen = false;
      SP.App.render();
      /* Silme geri alınır: kayıt aynen geri saklanır (küçük aksiyon). */
      if(r.ok && h) UI.toast('«' + h.ad + '» silindi', { undo:async () => {
        await M.saveProfile({ hazirOgunler:[h].concat(SP.Hazir.ogunler()) }); SP.App.render(); } });
    },
    async 'sablon-ekle'(el){
      const kaynak = M.mealsOf(el.dataset.date).find(m => m.id === el.dataset.id);
      if(!kaynak) return;
      const yeni = M.newMeal(guessSlot());
      yeni.items = (kaynak.items || []).map(x => Object.assign({}, x));
      const d = shownDate();
      await M.addMeal(d, yeni);
      SP.App.render();
      UI.toast('Öğün eklendi', { undo:async () => { await M.deleteMeal(d, yeni.id); SP.App.render(); } });
    },
    async 'del-meal'(el){
      await M.deleteMeal(shownDate(), el.dataset.id);
      /* Öğünle birlikte fotoğrafı da gider; sahipsiz fotoğraf kalmaz. */
      if(SP.Foto) await SP.Foto.sil('ogun:' + el.dataset.id);
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
    async 'barkod-ac'(){ barkodSheet(); },
    async 'barkod-bul'(){
      const e = document.getElementById('barkod-kod');
      await barkodSonuc(await SP.Barkod.coz(e ? e.value : ''));
    },
    async 'barkod-bagla'(el){
      const r = await SP.Barkod.bagla(barkodKod, el.dataset.id);
      if(!r.ok){ UI.toast(r.why); return; }
      UI.toast('Barkod bağlandı');
      portionSheet(el.dataset.id);
    },
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
    /* ÖĞÜNLERİM (core/ogun.js): ad ve saat kullanıcının. */
    'ogun-duzen'(){ S.ui.ogunTaslak = { liste:SP.Ogun.liste().map(x => Object.assign({}, x)), hata:null }; ogunSheet(); },
    'ogun-ekle'(){ ogunOku(); const t = S.ui.ogunTaslak; t.liste.push(SP.Ogun.yeni('', null)); ogunSheet(); },
    'ogun-sil'(el){ ogunOku(); const t = S.ui.ogunTaslak; t.liste.splice(Number(el.dataset.i), 1); ogunSheet(); },
    async 'ogun-kaydet'(){
      ogunOku();
      const t = S.ui.ogunTaslak;
      const r = await SP.Ogun.kaydet(t.liste);
      if(!r.ok){ t.hata = r.why; ogunSheet(); return; }
      S.ui.ogunTaslak = null;
      if(S.ui.mealSlot && !SP.Ogun.liste().some(x => x.id === S.ui.mealSlot)) S.ui.mealSlot = null;
      UI.closeSheet();
      UI.toast('Öğünlerin kaydedildi', { undo:async () => { await SP.Ogun.geriAl(r); UI.toast('Geri alındı'); SP.App.render(); } });
      SP.App.render();
    },
    async 'food-query'(el){ S.ui.foodQuery = el.value; S.ui.foodPage = 1; searchSheet(); },
    async 'food-cat'(el){ S.ui.foodCat = el.value; S.ui.foodPage = 1; searchSheet(); },
    async 'barkod-q'(el){ S.ui.barkodQ = el.value; barkodBagSheet(); },
    async 'barkod-foto'(el){
      const f = el.files && el.files[0];
      if(!f) return;
      await barkodSonuc(await UI.withBusy('Barkod okunuyor', 'fotoğraf bu cihazda okunur',
        () => SP.Barkod.fotodan(f)));
    },
  };

  /* King'den gelen fotoğraf (king.js söz 11): «Fotoğraftan öğün» penceresi
     bu fotoğrafla açılır; okuma yine kullanıcının «Oku»suyla, model bağlıysa. */
  function fotoKoy(file){ photoFile = file || null; photoRes = null; photoSheet(); return !!photoFile; }

  return {
    fotoKoy,
    id:'meals',
    /* Sadelik (açık en çok üç): başvuru notları küçük başlar. */
    kucukVarsayilan:['beslenme-ve-emilim-notları'],
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
      return String(html`${K.Button({ label:'Öğün ekle', icon:'plus', size:'sm',
        act:'meal-tab', data:{ 'data-tab':'gunluk' } })}
        ${K.Button({ label:'Öneriyi aç', size:'sm', act:'meal-tab', data:{ 'data-tab':'oneri' } })}`);
    },
    render, afterRender, handle, change, guessSlot,
  };
})();
