/* Kurulum — ilk açılışta sorulan en az soru.

   Yalnızca hesabın yapılabilmesi için gereken beş alan sorulur: ad, doğum
   yılı, cinsiyet, boy, kilo. Geri kalan her şey (hedef, hane, sepet)
   sonradan doldurulur ve olmadan da sistem çalışır.

   Sihirbaz atlanabilir. Atlandığında ekranlar boş kalmaz; "profil eksik"
   diyen ve nereye gidileceğini söyleyen kartlar görünür. */

window.SP = window.SP || {};

SP.Setup = (function(){
  const U = SP.U;
  const K = SP.C;
  const { html } = SP.h;

  /* Profilde hesap icin gereken alanlar eksikse sihirbaz gerekir. */
  function needed(){
    const p = SP.S.profile;
    if(!p) return true;
    return !p.name || !p.birthYear || !p.heightCm || !p.weightKg;
  }

  function open(){
    const p = SP.S.profile || {};
    SP.UI.sheet({
      title:'SPİ — ilk kurulum',
      subtitle:'Beş alan yeter; gerisi sonra',
      wide:true,
      body:String(K.Stack([
        K.Notice({ tone:'info', body:'Bu beş alan olmadan kalori ve protein hedefi hesaplanmaz. '
          + 'Sistem eksik veriyi tahmin etmez, boş bırakır ve nedenini söyler.' }),
        html`<div class="grid-form">
          ${K.Field({ label:'Ad', input:K.Input({ id:'su-name', value:p.name || '',
            placeholder:'Sana nasıl seslenelim?' }) })}
          ${K.Field({ label:'Doğum yılı', input:K.Input({ id:'su-birth', type:'number',
            numeric:true, min:1900, max:2026, value:p.birthYear || '' }) })}
          ${K.Field({ label:'Cinsiyet', input:K.Select({ id:'su-sex', value:p.sex || 'male',
            options:[{ value:'male', label:'Erkek' }, { value:'female', label:'Kadın' }] }) })}
          ${K.Field({ label:'Boy (cm)', input:K.Input({ id:'su-height', type:'number',
            numeric:true, min:80, max:230, value:p.heightCm || '' }) })}
          ${K.Field({ label:'Kilo (kg)', input:K.Input({ id:'su-weight', type:'number',
            numeric:true, step:'0.1', min:20, max:250, value:p.weightKg || '' }) })}
          ${K.Field({ label:'Hareket düzeyi', input:K.Select({ id:'su-activity',
            value:p.activity || 'moderate',
            options:SP.ACTIVITY_LEVELS.map(a => ({ value:a.id, label:a.label })) }) })}
          ${K.Field({ label:'Hedef', input:K.Select({ id:'su-goal', value:p.goal || 'health',
            options:SP.GOALS.map(g => ({ value:g.id, label:g.label })) }) })}
        </div>`,
        K.Notice({ tone:'warn', title:'Sınır:', body:SP.CLINICAL.disclaimer }),
      ])),
      footer:String(html`${K.Button({ label:'Şimdilik atla', act:'setup-skip' })}
        ${K.Button({ label:'Başla', tone:'primary', act:'setup-save' })}`),
    });
  }

  async function save(){
    const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const numOr = v => v === '' ? null : Number(String(v).replace(',', '.'));

    const patch = {
      name:get('su-name'),
      birthYear:numOr(get('su-birth')),
      sex:get('su-sex') || 'male',
      heightCm:numOr(get('su-height')),
      weightKg:numOr(get('su-weight')),
      activity:get('su-activity') || 'moderate',
      goal:get('su-goal') || 'health',
    };

    const missing = [];
    if(!patch.name) missing.push('ad');
    if(!patch.birthYear) missing.push('doğum yılı');
    if(!patch.heightCm) missing.push('boy');
    if(!patch.weightKg) missing.push('kilo');
    if(missing.length){
      SP.UI.toast('Eksik: ' + missing.join(', '));
      return false;
    }

    await SP.Model.saveProfile(patch);
    await SP.Model.saveVitals(U.todayISO(), { weight:patch.weightKg });
    SP.UI.closeSheet();
    SP.UI.toast('Hazır — hedefler hesaplandı');
    SP.App.render();
    return true;
  }

  function skip(){
    SP.UI.closeSheet();
    SP.UI.toast('Atlandı — Hane ekranından istediğin zaman doldurabilirsin');
  }

  return { needed, open, save, skip };
})();
