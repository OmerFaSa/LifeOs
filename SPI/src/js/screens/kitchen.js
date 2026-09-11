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

  /* ==================================================== kendi gıdaların

     79 gıdalık tablo Türk mutfağını kapsıyor ama MARKET RAFINI
     kapsamıyor. Etiket okuma, kullanıcının kendi listesini büyütmesinin
     tek pratik yolu — ve kesinliği «ölçüldü»dür, çünkü üretici beyanı
     ambalajda yazılı. Yemek fotoğrafından gelen gramaj tahmindir;
     etiketten gelen besin değeri değildir.

     Eklenen gıda `SP.FOODS` listesine katılır: ayrıştırıcı, sepet ve
     öğün hesabı hiçbir şey bilmeden onu da görür. */

  function customCard(){
    const liste = (S.foods || []);
    return K.Card({
      title:'Kendi gıdaların', sub:liste.length + ' kayıt',
      body:html`
        <p class="small muted">Sistemin tablosunda olmayan bir ürünü ekle:
          ambalajın besin değerleri tablosunu fotoğrafla ya da değerleri elle yaz.
          Eklenen gıda öğün girişinde, sepette ve hesaplarda görünür.</p>
        ${when(!liste.length, () => P.empty('Henüz kendi gıdan yok.'))}
        ${when(liste.length, () => html`<div class="list mt-10">${map(liste, f => html`
          <div class="listitem">
            <div class="grow minw0">
              <b class="small">${f.name}</b>
              <div class="tiny dim">100 g · ${U.fmtNum(f.kcal)} kcal ·
                P ${U.fmtNum(f.p)} · Y ${U.fmtNum(f.f)} · K ${U.fmtNum(f.c)}</div>
            </div>
            ${K.Button({ label:'Düzelt', size:'sm', act:'edit-food',
              data:{ 'data-id':f.id } })}
            ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'Sil',
              act:'del-food', data:{ 'data-id':f.id } })}
          </div>`)}</div>`)}`,
      foot:html`${K.Button({ label:'Etiketten oku', icon:'camera', tone:'primary',
          act:'open-label' })}
        ${K.Button({ label:'Elle ekle', act:'add-food' })}`,
    });
  }

  function foodSheetBody(rec, okundu){
    const alan = (id, label, hint) => K.Field({ label, hint,
      input:K.Input({ id:'fd-' + id, type:'number', numeric:true, step:'any',
        value:rec[id] == null ? '' : rec[id] }) });
    return String(K.Stack([
      when(okundu, () => K.Notice({ tone:okundu.ok ? 'ok' : 'warn',
        title:okundu.ok ? 'Etiket okundu:' : 'Eksik alan var:', body:okundu.note })),
      K.Field({ label:'Ad', input:K.Input({ id:'fd-name', value:rec.name,
        placeholder:'Ürünün adı' }) }),
      html`<p class="small muted">Bütün değerler <b>100 gram</b> içindir.</p>`,
      html`<div class="grid-form">
        ${alan('kcal', 'Kalori (kcal)')}
        ${alan('p', 'Protein (g)')}
        ${alan('f', 'Yağ (g)')}
        ${alan('sat', 'Doymuş yağ (g)', 'isteğe bağlı')}
        ${alan('c', 'Karbonhidrat (g)')}
        ${alan('sugar', 'Şeker (g)', 'isteğe bağlı')}
        ${alan('fib', 'Lif (g)', 'isteğe bağlı')}
      </div>`,
      K.Notice({ tone:'info',
        body:'Boş bıraktığın alan sıfır sayılmaz; o besin öğesi bu gıda için '
          + 'hesaba hiç girmez. Kalori, protein, yağ ve karbonhidrat zorunludur.' }),
    ]));
  }

  async function render(){
    return String(html`
      ${K.Ledger(() => [setupCard(), splitCard(), memberCard(), customCard(), dishInfoCard()])}
      <div class="mt-24">${raw(UI.rail(['household', 'portion', 'profiles']))}</div>`);
  }

  /* Alt sayfadaki gıda taslağı — kaydedilene kadar depoya hiçbir şey yazılmaz. */
  let foodDraft = null;
  let labelFile = null;

  function openFoodSheet(rec, okundu){
    foodDraft = rec;
    UI.sheet({ title:rec.name || 'Yeni gıda', subtitle:'100 gram için', wide:true,
      body:foodSheetBody(rec, okundu),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-food' })}`) });
  }

  const handle = {
    async 'add-food'(){ openFoodSheet(M.newFood(), null); },

    async 'edit-food'(el){
      const f = (S.foods || []).find(x => x.id === el.dataset.id);
      if(!f) return;
      openFoodSheet(JSON.parse(JSON.stringify(f)), null);
    },

    async 'open-label'(){
      labelFile = null;
      UI.sheet({ title:'Besin etiketi', subtitle:'ambalajın tablosunu fotoğrafla',
        wide:true,
        body:String(K.Stack([
          K.Drop({ act:'label-file', label:'Etiket fotoğrafı', icon:'camera',
            accept:'image/*' }),
          html`<div id="label-name" class="small dim"></div>`,
          K.Notice({ tone:'info',
            body:'Tablodaki değerler okunur ve sana gösterilir; onaylamadan '
              + 'hiçbir şey kaydedilmez. Etikette olmayan bir alan uydurulmaz, '
              + 'boş bırakılır.' }),
        ])),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Oku', tone:'primary', act:'run-label' })}`) });
    },

    async 'run-label'(){
      if(!labelFile){ UI.toast('Önce bir fotoğraf seç'); return; }
      const r = await UI.withBusy('Etiket okunuyor',
        'değerler «ölçüldü» sayılacak: üretici beyanı',
        () => SP.Extract.fromFoodLabel(labelFile));
      if(!r.food){ UI.toast(r.note); return; }
      const rec = M.newFood();
      Object.keys(r.food).forEach(k => { if(r.food[k] != null) rec[k] = r.food[k]; });
      openFoodSheet(rec, r);
    },

    async 'save-food'(){
      const v = id => { const e = document.getElementById('fd-' + id); return e ? e.value.trim() : ''; };
      const n = x => x === '' ? null : Number(String(x).replace(',', '.'));
      const rec = foodDraft || M.newFood();
      rec.name = v('name');
      ['kcal', 'p', 'f', 'sat', 'c', 'sugar', 'fib'].forEach(k => { rec[k] = n(v(k)); });
      if(!rec.name){ UI.toast('Ad gerekli'); return; }
      const eksik = ['kcal', 'p', 'f', 'c'].filter(k => rec[k] == null);
      if(eksik.length){ UI.toast('Kalori, protein, yağ ve karbonhidrat zorunlu'); return; }
      await M.saveFood(rec);
      foodDraft = null;
      UI.closeSheet();
      UI.toast(rec.name + ' eklendi — öğün girişinde de görünür');
      SP.App.render();
    },

    async 'del-food'(el){
      const f = (S.foods || []).find(x => x.id === el.dataset.id);
      if(!f) return;
      const kopya = JSON.parse(JSON.stringify(f));
      await M.deleteFood(f.id);
      S.ui.undo = { restore:() => M.saveFood(kopya) };
      UI.toast(kopya.name + ' silindi', { undo:true });
      SP.App.render();
    },
  };

  const change = {
    async 'label-file'(el){
      labelFile = (el.files && el.files[0]) || null;
      const g = document.getElementById('label-name');
      if(g) g.textContent = labelFile ? labelFile.name : '';
    },
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
