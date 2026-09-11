/* Mutfak — hane uyumu.

   Sistemin en pratik iddiası burada durur: evde tek tencere yemek pişer ve
   herkes kendi hedefine göre pay alır. Herkese ayrı diyet yemeği pişirmek
   sürdürülebilir değildir; sürdürülemeyen sistem uygulanmaz.

   Porsiyon çarpanı gizli bir sabit değildir: bu öğünün günlük hedefin
   yüzde kaçını taşıdığı ekranda yazar ve değiştirilebilir. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.kitchen = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  /* Hane profillerinin tam kaydini okur. Kendi profilimiz depoda, digerleri
     hane listesinde ozet olarak durur — ozet porsiyon hesabina yetmez, bu
     yuzden eksik olanlar acikca bildirilir. */
  function members(){
    const list = M.householdList();
    const me = S.profile;
    return list.map(row => {
      if(row.id === me.id) return Object.assign({}, me, { self:true });
      return Object.assign({ self:false, weightKg:null, heightCm:null }, row);
    });
  }

  function dishOptions(){
    return SP.FOODS.filter(f => f.cat === 'yemek' || f.cat === 'et' || f.cat === 'balik')
      .map(f => ({ value:f.id, label:f.name }));
  }

  function setupCard(){
    const dishId = S.ui.kitchenDish || 'kuru-fasulye-etli';
    return K.Card({
      title:'Pişen yemek', hint:'household',
      sub:'Tencerenin tamamı',
      body:html`
        <div class="cols-2">
          ${K.Field({ label:'Yemek',
            input:K.Select({ value:dishId, change:'pick-dish', options:dishOptions() }) })}
          ${K.Field({ label:'Toplam gram',
            input:K.Input({ id:'kitchen-g', type:'number', numeric:true, step:'50', min:100,
              value:S.ui.kitchenGrams, change:'set-grams' }) })}
        </div>
        <p class="small muted mt-10">Tencerede kaç gram olduğunu bilmiyorsan kaba bir tahmin yeter:
          paylaştırma oranları değişmez, yalnızca mutlak gramlar ölçeklenir.</p>`,
    });
  }

  function splitCard(){
    const dishId = S.ui.kitchenDish || 'kuru-fasulye-etli';
    const res = SP.Nutri.householdSplit(dishId, S.ui.kitchenGrams, members());

    if(!res.ok){
      return K.Card({ title:'Paylaştırma',
        body:K.Notice({ tone:'warn', body:res.error }),
        foot:K.Button({ label:'Profilleri aç', size:'sm', tone:'primary',
          act:'go', data:{ 'data-route':'family' } }) });
    }

    return K.Card({
      title:'Tabağa paylaştırma',
      sub:res.food.name + ' · ' + U.fmtNum(res.totalGrams) + ' g',
      badge:res.short ? K.Badge({ label:res.short + ' g eksik', tone:'warn' })
        : K.Badge({ label:'yeterli', tone:'ok' }),
      body:html`
        ${map(res.rows, r => html`
          <div class="splitrow">
            <span class="splitrow__name">${r.member.name || 'Adsız'}
              ${when(r.member.self, () => html`<span class="tiny dim"> · sen</span>`)}</span>
            <span class="tiny dim">${U.fmtNum(r.kcalNeed)} kcal hedef</span>
            <span class="splitrow__g num">${U.fmtNum(r.share)} g</span>
            <span class="splitrow__note">
              ${when(r.gets, () => html`Bu porsiyon ${Math.round(r.gets.kcal)} kcal,
                ${Math.round(r.gets.protein)} g protein taşır.`)}
              ${map(r.addons, a => html` <b>${a.text}</b>`)}
            </span>
          </div>`)}
        ${when(res.short, () => K.Notice({ tone:'warn', class:'mt-12',
          body:'Tencere hanenin bu öğün için ihtiyacının altında: yaklaşık '
            + res.short + ' gram daha gerekiyor. Yan gıda (yoğurt, salata, ekmek) farkı kapatır.' }))}
        ${K.Notice({ tone:'info', class:'mt-10',
          body:'Bu öğün günlük hedefin %' + Math.round(res.mealShare * 100)
            + '\'i sayıldı. Ana öğün varsayımıdır; kahvaltı için pay daha küçüktür.' })}`,
    });
  }

  function memberCard(){
    const list = members();
    const missing = list.filter(m => !m.weightKg || !m.heightCm || !m.birthYear);
    return K.Card({
      title:'Hane', hint:'profiles',
      sub:list.length + ' profil',
      body:html`
        ${K.Table({ tight:true, headers:['Kişi', 'Kilo', 'Boy', 'Hedef'],
          rows:list.map(m => [
            html`${m.name || 'Adsız'}${m.self ? html` <span class="tiny dim">· sen</span>` : ''}`,
            m.weightKg ? U.fmtNum(m.weightKg) + ' kg' : html`<span class="dim">—</span>`,
            m.heightCm ? U.fmtNum(m.heightCm) + ' cm' : html`<span class="dim">—</span>`,
            m.goal ? (SP.GOALS.find(g => g.id === m.goal) || {}).label || '—' : html`<span class="dim">—</span>`,
          ]) })}
        ${when(missing.length, () => K.Notice({ tone:'info', class:'mt-10',
          body:missing.length + ' profilde kilo, boy ya da doğum yılı eksik. '
            + 'Eksik profiller paylaştırmaya girmez — tahmin edilmez.' }))}`,
      foot:K.Button({ label:'Profilleri düzenle', size:'sm', act:'go', data:{ 'data-route':'family' } }),
    });
  }

  function dishInfoCard(){
    const f = SP.FOOD_BY_ID[S.ui.kitchenDish || 'kuru-fasulye-etli'];
    if(!f) return null;
    const c = SP.Nutri.contribution(f.id, 100);
    return K.Card({
      title:f.name, sub:'100 gramda',
      body:html`
        ${raw(UI.macroSplit({ protein:c.protein * 4, fat:c.fat * 9, carb:c.carb * 4 }))}
        <div class="nutgrid mt-12">
          ${P.nutCell({ label:'Kalori', got:c.kcal, target:c.kcal, unit:'kcal' })}
          ${P.nutCell({ label:'Protein', got:c.protein, target:c.protein, unit:'g', digits:1 })}
          ${P.nutCell({ label:'Lif', got:c.fiber, target:c.fiber, unit:'g', digits:1 })}
          ${P.nutCell({ label:'Demir', got:c.micro.iron || 0, target:c.micro.iron || 1, unit:'mg', digits:1 })}
        </div>
        ${when((f.flags || []).length, () => html`<div class="mt-10">${map(f.flags, fl => {
          const a = SP.ABSORB_FACTORS[fl];
          return a ? P.absorbNote({ kind:a.kind, text:a.name + ' — ' + a.text }) : '';
        })}</div>`)}`,
    });
  }

  async function render(){
    return String(html`
      ${K.Ledger(() => [setupCard(), splitCard(), memberCard(), dishInfoCard()])}
      <div class="mt-24">${raw(UI.rail(['household', 'portion', 'profiles']))}</div>`);
  }

  const handle = {};

  const change = {
    async 'pick-dish'(el){ S.ui.kitchenDish = el.value; SP.App.render(); },
    async 'set-grams'(el){
      const v = Number(el.value);
      S.ui.kitchenGrams = isFinite(v) && v > 0 ? v : 1000;
      SP.App.render();
    },
  };

  return {
    id:'kitchen',
    title:'Mutfak',
    headline(){
      const list = SP.Model.householdList();
      if(list.length < 2) return 'Tek tencere, tek porsiyon.';
      return 'Tek tencere, ' + list.length + ' ayrı porsiyon.';
    },
    lede(){
      return 'Aynı yemek herkese pişer; kimin tabağına ne kadar gireceği '
        + 'hedeflerden hesaplanır. Herkese ayrı yemek pişirme zorunluluğu kalkar.';
    },
    subtitle(){
      const f = SP.FOOD_BY_ID[S.ui.kitchenDish || 'kuru-fasulye-etli'];
      return (f ? f.name : '') + ' · ' + U.fmtNum(S.ui.kitchenGrams) + ' g';
    },
    actions(){ return ''; },
    render, handle, change,
  };
})();
