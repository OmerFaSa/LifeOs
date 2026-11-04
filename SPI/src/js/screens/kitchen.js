/* Mutfak — hane uyumu.

   Sistemin en pratik iddiası burada durur: evde tek tencere yemek pişer ve
   herkes kendi hedefine göre pay alır. Herkese ayrı diyet yemeği pişirmek
   sürdürülebilir değildir; sürdürülemeyen sistem uygulanmaz.

   Porsiyon çarpanı gizli bir sabit değildir: bu öğünün günlük hedefin
   yüzde kaçını taşıdığı ekranda yazar ve değiştirilebilir. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};
window.LIFEOS.PARCA.yazilar({
  'spi.kitchen.pisen-yemek':'Pişen yemek',
  'spi.kitchen.tencerenin-tamami':'Tencerenin tamamı',
  'spi.kitchen.yemek':'Yemek',
  'spi.kitchen.toplam-gram':'Toplam gram',
  'spi.kitchen.paylastirma':'Paylaştırma',
  'spi.kitchen.profilleri-ac':'Profilleri aç',
  'spi.kitchen.tabaga-paylastirma':'Tabağa paylaştırma',
  'spi.kitchen.sen':'· sen',
  'spi.kitchen.kcal-hedef':'kcal hedef',
  'spi.kitchen.bu-porsiyon':'Bu porsiyon',
  'spi.kitchen.g-protein-tasir':'g protein taşır.',
  'spi.kitchen.payimi-ogune-ekle':'Payımı öğüne ekle',
  'spi.kitchen.hane':'Hane',
  'spi.kitchen.profilleri-duzenle':'Profilleri düzenle',
  'spi.kitchen.evde-ne-var':'Evde ne var?',
  'spi.kitchen.malzemeden-yemek':'malzemeden yemek',
  'spi.kitchen.evdeki-malzemeler':'Evdeki malzemeler',
  'spi.kitchen.yumurta-domates-biber-sogan':'yumurta, domates, biber, soğan…',
  'spi.kitchen.sepetimdekiler':'Sepetimdekiler',
  'spi.kitchen.taninmadi':'Tanınmadı:',
  'spi.kitchen.bu-malzemeyi-listede-bulamad':'— bu malzemeyi listede bulamadım.',
  'spi.kitchen.bu-malzemelerle-listedeki-ev':'Bu malzemelerle listedeki ev yemeklerinden biri çıkmıyor.',
  'spi.kitchen.sec':'Seç',
  'spi.kitchen.100-gramda':'100 gramda',
  'spi.kitchen.kendi-gidalarin':'Kendi gıdaların',
  'spi.kitchen.100-g':'100 g ·',
  'spi.kitchen.kcal-p':'kcal · P',
  'spi.kitchen.y':'· Y',
  'spi.kitchen.k':'· K',
  'spi.kitchen.duzelt':'Düzelt',
  'spi.kitchen.sil':'Sil',
  'spi.kitchen.etiketten-oku':'Etiketten oku',
  'spi.kitchen.elle-ekle':'Elle ekle',
  'spi.kitchen.ad':'Ad',
  'spi.kitchen.urunun-adi':'Ürünün adı',
  'spi.kitchen.butun-degerler':'Bütün değerler',
  'spi.kitchen.100-gram':'100 gram',
  'spi.kitchen.icindir':'içindir.',
  'spi.kitchen.100-gram-icin':'100 gram için',
  'spi.kitchen.vazgec':'Vazgeç',
  'spi.kitchen.kaydet':'Kaydet',
  'spi.kitchen.payin-hesaplanamadi-profilin':'Payın hesaplanamadı; profilini tamamla.',
  'spi.kitchen.geri-alindi':'Geri alındı',
  'spi.kitchen.sepette-malzemeye-cevrilebil':'Sepette malzemeye çevrilebilen bir şey yok',
  'spi.kitchen.besin-etiketi':'Besin etiketi',
  'spi.kitchen.ambalajin-tablosunu-fotograf':'ambalajın tablosunu fotoğrafla',
  'spi.kitchen.etiket-fotografi':'Etiket fotoğrafı',
  'spi.kitchen.oku':'Oku',
  'spi.kitchen.once-bir-fotograf-sec':'Önce bir fotoğraf seç',
  'spi.kitchen.ad-gerekli':'Ad gerekli',
  'spi.kitchen.kalori-protein-yag-ve-karbon':'Kalori, protein, yağ ve karbonhidrat zorunlu',
  'spi.kitchen.mutfak':'Mutfak',
});
window.LIFEOS.PARCA.sayfa({ id:'kitchen', modul:'spi', king:{ sira:30, ad:'Mutfak', es:['mutfak', 'mutfağ', 'tarif'] }, cekmece:'calisma', ad:'Mutfak', sira:30 });

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
      if(row.id === me.id) return Object.assign({}, me, { self:true, weightKg:(M.kiloOf(me) || {}).kg || null });
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
      title:yz('spi.kitchen.pisen-yemek'), hint:'household',
      sub:yz('spi.kitchen.tencerenin-tamami'),
      body:html`
        <div class="cols-2">
          ${K.Field({ label:yz('spi.kitchen.yemek'),
            /* Pişen yemeğin kendi fotoğrafı: seçicinin yanında tek minik kare. */
            input:html`<span class="secici-kare">${K.Select({ value:dishId, change:'pick-dish', options:dishOptions() })}
              ${raw(String(SP.FotoUI.kutu({ sahip:'yemek:' + dishId,
                ad:(SP.FOOD_BY_ID[dishId] || { name:yz('spi.kitchen.yemek') }).name })))}</span>` })}
          ${K.Field({ label:yz('spi.kitchen.toplam-gram'),
            input:K.Input({ id:'kitchen-g', type:'number', numeric:true, step:'50', min:100,
              value:S.ui.kitchenGrams, change:'set-grams' }) })}
        </div>`,
    });
  }

  function splitCard(){
    const dishId = S.ui.kitchenDish || 'kuru-fasulye-etli';
    const res = SP.Nutri.householdSplit(dishId, S.ui.kitchenGrams, members());

    if(!res.ok){
      return K.Card({ title:yz('spi.kitchen.paylastirma'),
        body:K.Notice({ tone:'warn', body:res.error }),
        foot:K.Button({ label:yz('spi.kitchen.profilleri-ac'), size:'sm',
          act:'go', data:{ 'data-route':'family' } }) });
    }

    return K.Card({
      title:yz('spi.kitchen.tabaga-paylastirma'),
      sub:res.food.name + ' · ' + U.fmtNum(res.totalGrams) + ' g',
      badge:res.short ? K.Badge({ label:res.short + ' g eksik', tone:'warn' })
        : K.Badge({ label:'yeterli', tone:'ok' }),
      body:html`
        ${map(res.rows, r => html`
          <div class="splitrow">
            <span class="splitrow__name">${r.member.name || 'Adsız'}
              ${when(r.member.self, () => html`<span class="tiny dim"> ${yz('spi.kitchen.sen')}</span>`)}</span>
            <span class="tiny dim">${U.fmtNum(r.kcalNeed)} ${yz('spi.kitchen.kcal-hedef')}</span>
            <span class="splitrow__g num">${U.fmtNum(r.share)} g</span>
            <span class="splitrow__note">
              ${when(r.gets, () => html`${yz('spi.kitchen.bu-porsiyon')} ${Math.round(r.gets.kcal)} kcal,
                ${Math.round(r.gets.protein)} ${yz('spi.kitchen.g-protein-tasir')}`)}
              ${map(r.addons, a => html` <b>${a.text}</b>`)}
            </span>
            ${when(r.member.self && r.share > 0, () => html`<span class="splitrow__note">${K.Button({
              label:yz('spi.kitchen.payimi-ogune-ekle'), icon:'plus', size:'sm', act:'pay-ogune-ekle',
              data:{ 'data-id':res.food.id } })}</span>`)}
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
      title:yz('spi.kitchen.hane'), hint:'profiles',
      sub:list.length + ' profil',
      body:html`
        ${K.Table({ tight:true, headers:['Kişi', 'Kilo', 'Boy', 'Hedef'],
          rows:list.map(m => [
            html`${m.name || 'Adsız'}${m.self ? html` <span class="tiny dim">${yz('spi.kitchen.sen')}</span>` : ''}`,
            m.weightKg ? U.fmtNum(m.weightKg) + ' kg' : html`<span class="dim">—</span>`,
            m.heightCm ? U.fmtNum(m.heightCm) + ' cm' : html`<span class="dim">—</span>`,
            m.goal ? (SP.GOALS.find(g => g.id === m.goal) || {}).label || '—' : html`<span class="dim">—</span>`,
          ]) })}
        ${when(missing.length, () => K.Notice({ tone:'info', class:'mt-10',
          body:missing.length + ' profilde kilo, boy ya da doğum yılı eksik. '
            + 'Eksik profiller paylaştırmaya girmez — tahmin edilmez.' }))}`,
      foot:K.Button({ label:yz('spi.kitchen.profilleri-duzenle'), size:'sm', act:'go', data:{ 'data-route':'family' } }),
    });
  }

  /* Evdekinden yemek (core/evdeki.js, fikir 29): model yok, tarif yok —
     «bu malzemelerle hangi ev yemeği olur» ve eksiği ne. */
  function evdekiCard(){
    if(!SP.Evdeki) return null;
    const metin = S.ui.evdeki || '';
    const okunan = SP.Evdeki.oku(metin);
    const l = metin.trim() ? SP.Evdeki.oner(okunan.var) : [];
    return K.Card({
      title:yz('spi.kitchen.evde-ne-var'), hint:'evdeki', sub:yz('spi.kitchen.malzemeden-yemek'),
      body:html`
        <div class="row gap-6 wrap">
          ${K.Input({ id:'evdeki-q', value:metin, class:'grow', aria:yz('spi.kitchen.evdeki-malzemeler'),
            placeholder:yz('spi.kitchen.yumurta-domates-biber-sogan'), change:'evdeki', data:{ 'data-debounce':'300' } })}
          ${K.Button({ label:yz('spi.kitchen.sepetimdekiler'), size:'sm', act:'evdeki-sepet' })}
        </div>
        ${when(okunan.taninmayan.length, () => html`<p class="tiny dim mt-6">${yz('spi.kitchen.taninmadi')}
          ${okunan.taninmayan.join(', ')} ${yz('spi.kitchen.bu-malzemeyi-listede-bulamad')}</p>`)}
        ${when(metin.trim() && !l.length, () => html`<p class="small dim mt-10">${yz('spi.kitchen.bu-malzemelerle-listedeki-ev')}</p>`)}
        ${when(l.length, () => html`<div class="mt-10">${K.Table({ tight:true,
          headers:['Yemek', 'Durum', ''],
          rows:l.slice(0, 8).map(r => [
            html`<b>${r.yemek.name}</b>${when(r.arti.length, () => html`<div class="tiny dim">+ ${r.arti.join(', ')}</div>`)}`,
            r.eksik.length ? 'eksik: ' + r.eksik.join(', ') : 'yapılabilir',
            K.Button({ label:yz('spi.kitchen.sec'), size:'sm', act:'evdeki-sec', data:{ 'data-id':r.yemek.id } }),
          ]) })}</div>`)}`,
    });
  }

  /* 100 gramın değeri bir hedef değildir: eskiden her biri kendi hedefiymiş
     gibi «132 / 132 kcal · %100» çiziliyordu (aynı sayı iki kez, anlamsız
     çubuk). Değer bir kez yazılır; tabloda olmayan değer «veri yok»tur —
     demiri bilinmeyen yemek «0 mg» değildir (AGENTS §1.2). */
  function dishInfoCard(){
    const f = SP.FOOD_BY_ID[S.ui.kitchenDish || 'kuru-fasulye-etli'];
    if(!f) return null;
    const c = SP.Nutri.contribution(f.id, 100);
    const deger = (ad, v, birim, basamak) => html`<div class="sidestat">
      <span class="sidestat__v">${v == null ? '—' : html`${U.fmtNum(U.round(v, basamak))}<small>${birim}</small>`}</span>
      <span class="sidestat__k">${ad}${v == null ? ' · veri yok' : ''}</span></div>`;
    return K.Card({
      title:f.name, sub:yz('spi.kitchen.100-gramda'),
      body:html`
        ${raw(UI.macroSplit({ protein:c.protein * 4, fat:c.fat * 9, carb:c.carb * 4 }))}
        <div class="pair mt-12">
          <div>${deger('Kalori', c.kcal, 'kcal', 0)}${deger('Protein', c.protein, 'g', 1)}</div>
          <div>${deger('Lif', c.fiber, 'g', 1)}${deger('Demir', c.micro.iron, 'mg', 1)}</div>
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
      title:yz('spi.kitchen.kendi-gidalarin'), hint:'custom-food', sub:liste.length + ' kayıt',
      body:html`
        ${when(!liste.length, () => P.empty('Henüz kendi gıdan yok.'))}
        ${when(liste.length, () => html`<div class="list mt-10">${map(liste, f => html`
          <div class="listitem">
            ${raw(String(SP.FotoUI.kutu({ sahip:'besin:' + f.id, ad:f.name })))}
            <div class="grow minw0">
              <b class="small">${f.name}</b>
              <div class="tiny dim">${yz('spi.kitchen.100-g')} ${U.fmtNum(f.kcal)} ${yz('spi.kitchen.kcal-p')} ${U.fmtNum(f.p)} ${yz('spi.kitchen.y')} ${U.fmtNum(f.f)} ${yz('spi.kitchen.k')} ${U.fmtNum(f.c)}</div>
              ${when(f.bam, () => html`<div class="tiny dim">${f.bam && f.bam.dogruluk === 'kaynakli'
                ? 'BAM · kaynaklı · ' + f.bam.at
                : 'BAM · doğrulanmadı — ambalaj etiketiyle karşılaştır'}</div>`)}
            </div>
            ${K.Button({ label:yz('spi.kitchen.duzelt'), size:'sm', act:'edit-food',
              data:{ 'data-id':f.id } })}
            ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:yz('spi.kitchen.sil'),
              act:'del-food', data:{ 'data-id':f.id } })}
          </div>`)}</div>`)}`,
      foot:html`${K.Button({ label:yz('spi.kitchen.etiketten-oku'), icon:'camera', tone:'primary',
          act:'open-label' })}
        ${K.Button({ label:yz('spi.kitchen.elle-ekle'), act:'add-food' })}`,
    });
  }

  /* BAM'dan bilgi (besin değeri, fiyat, yer) ve yer listeleri Kütüphanem'de
     (screens/kutuphane.js): «Kütüphane» BAM'ın ürettiklerinin tek yeri.
     Onaylı besin kaydı burada, kendi gıdaların arasında görünür. */

  function foodSheetBody(rec, okundu){
    const alan = (id, label, hint) => K.Field({ label, hint,
      input:K.Input({ id:'fd-' + id, type:'number', numeric:true, step:'any',
        value:rec[id] == null ? '' : rec[id] }) });
    return String(K.Stack([
      when(okundu, () => K.Notice({ tone:okundu.ok ? 'ok' : 'warn',
        title:okundu.ok ? 'Etiket okundu:' : 'Eksik alan var:', body:okundu.note })),
      K.Field({ label:yz('spi.kitchen.ad'), input:K.Input({ id:'fd-name', value:rec.name,
        placeholder:yz('spi.kitchen.urunun-adi') }) }),
      html`<p class="small muted">${yz('spi.kitchen.butun-degerler')} <b>${yz('spi.kitchen.100-gram')}</b> ${yz('spi.kitchen.icindir')}</p>`,
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

  /* iPhone Faz 2b: iş tencere ve tabaktır — pişen yemek, paylaştırma ve
     yemeğin besin kartı açık ve üstte; hane, evdeki malzeme ve kendi
     gıdaların şerit (dokununca açılır), sonda. */
  LIFEOS.PARCA.blok({ id:'kitchen.aciklamalar', sayfa:'kitchen', yer:'y1', sira:10, ad:'Açıklamalar', ciz(){
    return raw(UI.rail(['household', 'portion', 'profiles']));
  } });
  LIFEOS.PARCA.blok({ id:'kitchen.setupcard', sayfa:'kitchen', yer:'y2', sira:10, ad:'Kurulum', ciz(){
    return setupCard();
  } });
  LIFEOS.PARCA.blok({ id:'kitchen.splitcard', sayfa:'kitchen', yer:'y2', sira:20, ad:'Bölüşüm', ciz(){
    return splitCard();
  } });
  LIFEOS.PARCA.blok({ id:'kitchen.dishinfocard', sayfa:'kitchen', yer:'y2', sira:30, ad:'Yemek bilgisi', ciz(){
    return dishInfoCard();
  } });
  LIFEOS.PARCA.blok({ id:'kitchen.membercard', sayfa:'kitchen', yer:'y2', sira:40, ad:'Üye', ciz(){
    return memberCard();
  } });
  LIFEOS.PARCA.blok({ id:'kitchen.evdekicard', sayfa:'kitchen', yer:'y2', sira:50, ad:'Evdekiler', ciz(){
    return evdekiCard();
  } });
  LIFEOS.PARCA.blok({ id:'kitchen.customcard', sayfa:'kitchen', yer:'y2', sira:60, ad:'Özel tarif', ciz(){
    return customCard();
  } });
  async function render(){
    return String(html`
      ${K.Ledger(() => LIFEOS.PARCA.liste('kitchen', 'y2', K, undefined).filter(Boolean))}
      <div class="mt-24">${LIFEOS.PARCA.yer('kitchen', 'y1', K, undefined, typeof raw === 'undefined' ? null : raw)}</div>`);
  }

  /* Alt sayfadaki gıda taslağı — kaydedilene kadar depoya hiçbir şey yazılmaz. */
  let foodDraft = null;
  let labelFile = null;

  function openFoodSheet(rec, okundu){
    foodDraft = rec;
    UI.sheet({ title:rec.name || 'Yeni gıda', subtitle:yz('spi.kitchen.100-gram-icin'), wide:true,
      body:foodSheetBody(rec, okundu),
      footer:String(html`${K.Button({ label:yz('spi.kitchen.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('spi.kitchen.kaydet'), tone:'primary', act:'save-food' })}`) });
  }

  const handle = {
    /* PAYIMI ÖĞÜNE EKLE (2026-10-25): kendi payın bugünün öğününe tek
       dokunuşla. Gram ekranda görünen paydır, yeniden hesaplanır (tıklanan
       düğmenin taşıdığı sayıya güvenilmez); hesap tencere ve hedeften
       geldiği için kesinlik «tahmin». Öğün yeri: seçili öğün, yoksa saate
       göre. «Geri al» eklenen öğünü siler. */
    async 'pay-ogune-ekle'(el){
      const dishId = el.dataset.id || S.ui.kitchenDish || 'kuru-fasulye-etli';
      const res = SP.Nutri.householdSplit(dishId, S.ui.kitchenGrams, members());
      const ben = res.ok ? res.rows.find(r => r.member.self) : null;
      const g = ben ? Math.round(Number(ben.share)) : 0;
      if(!(g > 0)){ UI.toast(yz('spi.kitchen.payin-hesaplanamadi-profilin')); return; }
      const d = U.todayISO();
      const slot = S.ui.mealSlot || (SP.Ogun ? SP.Ogun.simdiki() : 'aksam');
      const yeni = M.newMeal(slot);
      yeni.items = [{ foodId:res.food.id, g, cert:'estimated', portion:'tencereden pay' }];
      yeni.note = 'Mutfak · tencereden pay';
      await M.addMeal(d, yeni);
      SP.App.render();
      const ad = SP.Ogun ? SP.Ogun.ad(slot) : slot;
      UI.toast(res.food.name + ' ' + U.fmtNum(g) + ' g · «' + ad + '» öğününe eklendi · tahmin', { undo:async () => {
        await M.deleteMeal(d, yeni.id); UI.toast(yz('spi.kitchen.geri-alindi')); SP.App.render(); } });
    },
    async 'evdeki-sepet'(){
      const m = SP.Evdeki.sepettenMalzeme().map(id => SP.Evdeki.MALZEME[id].ad);
      if(!m.length){ UI.toast(yz('spi.kitchen.sepette-malzemeye-cevrilebil')); return; }
      const var_ = String(S.ui.evdeki || '').trim();
      S.ui.evdeki = (var_ ? var_ + ', ' : '') + m.join(', ');
      SP.App.render();
    },
    async 'evdeki-sec'(el){
      S.ui.kitchenDish = el.dataset.id;
      UI.toast(SP.FOOD_BY_ID[el.dataset.id].name + ' seçildi · tencereyi paylaştırabilirsin');
      SP.App.render();
    },
    async 'add-food'(){ openFoodSheet(M.newFood(), null); },

    async 'edit-food'(el){
      const f = (S.foods || []).find(x => x.id === el.dataset.id);
      if(!f) return;
      openFoodSheet(JSON.parse(JSON.stringify(f)), null);
    },

    async 'open-label'(){
      labelFile = null;
      UI.sheet({ title:yz('spi.kitchen.besin-etiketi'), subtitle:yz('spi.kitchen.ambalajin-tablosunu-fotograf'),
        wide:true,
        body:String(K.Stack([
          K.Drop({ act:'label-file', label:yz('spi.kitchen.etiket-fotografi'), icon:'camera', kamera:{},
            accept:'image/*' }),
          html`<div id="label-name" class="small dim"></div>`,
          K.Notice({ tone:'info',
            body:'Tablodaki değerler okunur ve sana gösterilir; onaylamadan '
              + 'hiçbir şey kaydedilmez. Etikette olmayan bir alan uydurulmaz, '
              + 'boş bırakılır.' }),
        ])),
        footer:String(html`${K.Button({ label:yz('spi.kitchen.vazgec'), act:'sheet-close' })}
          ${K.Button({ label:yz('spi.kitchen.oku'), tone:'primary', act:'run-label' })}`) });
    },

    async 'run-label'(){
      if(!labelFile){ UI.toast(yz('spi.kitchen.once-bir-fotograf-sec')); return; }
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
      if(!rec.name){ UI.toast(yz('spi.kitchen.ad-gerekli')); return; }
      const eksik = ['kcal', 'p', 'f', 'c'].filter(k => rec[k] == null);
      if(eksik.length){ UI.toast(yz('spi.kitchen.kalori-protein-yag-ve-karbon')); return; }
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
      /* Fotoğraf da gider ama «Geri al» onu da yerine koyar. */
      const foto = SP.Foto ? await SP.Foto.al('besin:' + f.id) : null;
      await M.deleteFood(f.id);
      if(foto) await SP.Foto.sil('besin:' + f.id);
      S.ui.undo = { restore:async () => {
        await M.saveFood(kopya);
        if(foto) await SP.Foto.kaydet('besin:' + kopya.id, foto);
      } };
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
    async 'evdeki'(el){ S.ui.evdeki = el.value; SP.App.render(); },
    async 'set-grams'(el){
      const v = Number(el.value);
      S.ui.kitchenGrams = isFinite(v) && v > 0 ? v : 1000;
      SP.App.render();
    },
  };

  return {
    id:'kitchen',
    kucukVarsayilan:['evde-ne-var', 'kendi-gıdaların'],
    title:yz('spi.kitchen.mutfak'),
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
