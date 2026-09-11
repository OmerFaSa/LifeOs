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

  /* ------------------------------------------------------------- açılış

     Sisteme giren herkesin gördüğü İLK ŞEY ve uzun süre hiç tasarlanmadı:
     beş alanlık bir alt sayfaydı. İlk izlenim bir kez oluşur ve sistemin
     en zayıf ekranı, en güçlü ekranından önce geliyordu.

     Şimdi üç bölümü var ve üçü de bir şey ANLATIYOR:

       1. Sistem ne yapar — ve daha önemlisi NE YAPMAZ.
       2. Beş alan — neden bu beşi sorulduğu her alanın yanında yazıyor.
       3. Bu beş alan neyi AÇAR — soru bedelsiz değil, karşılığı görünür.

     Hiçbir adım zorunlu değil: atlanınca ekranlar boş kalmaz, «profil
     eksik» diyen ve nereye gidileceğini söyleyen kartlar görünür. */

  function acilirYil(){
    const y = new Date().getFullYear();
    return { min:y - 110, max:y - 5 };
  }

  function open(){
    const p = SP.S.profile || {};
    const yil = acilirYil();

    SP.UI.sheet({
      title:'SPİ', subtitle:'kişisel ve aile odaklı sağlık sistemi',
      wide:true, noClose:true,
      body:String(html`<div class="setup">

        <div class="setup__hero">
          <p class="setup__kicker">İlk kurulum</p>
          <h2 class="setup__h">Beş alan yeter. Gerisi zamanla dolar.</h2>
          <p class="setup__lede">Bu sistem senin girdiğin veriyi okur ve ondan
            hesap yapar. Ölçüm yapmaz, teşhis koymaz, ilaç önermez — ve bilmediği
            hiçbir şeyi tahmin etmez.</p>
        </div>

        <div class="setup__rules">
          <div class="setup__rule">
            <b>Eksik veri sıfır sayılmaz.</b>
            <span>Boş bıraktığın alan hesaba «0» diye girmez; o hesap hiç yapılmaz
              ve nedeni yazar.</span>
          </div>
          <div class="setup__rule">
            <b>Tahmin, ölçüm gibi gösterilmez.</b>
            <span>Her sayının yanında nereden geldiği durur: ölçüldü, hesaplandı,
              tahmin.</span>
          </div>
          <div class="setup__rule">
            <b>Veriler bu cihazda kalır.</b>
            <span>Ad ve doğum yılı hiçbir modele gönderilmez.</span>
          </div>
        </div>

        <div class="setup__form">
          ${K.Field({ label:'Ad', hint:'yalnızca sana seslenmek için — modele gitmez',
            input:K.Input({ id:'su-name', value:p.name || '',
              placeholder:'Sana nasıl seslenelim?' }) })}
          ${K.Field({ label:'Doğum yılı', hint:'referans aralıkları yaşa göre değişir',
            input:K.Input({ id:'su-birth', type:'number', numeric:true,
              min:yil.min, max:yil.max, value:p.birthYear || '',
              placeholder:String(yil.max - 25) }) })}
          ${K.Field({ label:'Cinsiyet', hint:'ferritin ve hemoglobin aralıkları buna bağlı',
            input:K.Select({ id:'su-sex', value:p.sex || 'male',
              options:[{ value:'male', label:'Erkek' }, { value:'female', label:'Kadın' }] }) })}
          ${K.Field({ label:'Boy (cm)', hint:'bazal metabolizma hesabına girer',
            input:K.Input({ id:'su-height', type:'number', numeric:true,
              min:80, max:230, value:p.heightCm || '', placeholder:'178' }) })}
          ${K.Field({ label:'Kilo (kg)', hint:'ilk günün ölçümü olarak da kaydedilir',
            input:K.Input({ id:'su-weight', type:'number', numeric:true, step:'0.1',
              min:20, max:250, value:p.weightKg || '', placeholder:'74' }) })}
          ${K.Field({ label:'Hareket düzeyi', hint:'kalori hedefinin çarpanı',
            input:K.Select({ id:'su-activity', value:p.activity || 'moderate',
              options:SP.ACTIVITY_LEVELS.map(a => ({ value:a.id, label:a.label })) }) })}
          ${K.Field({ label:'Hedef', hint:'sonradan değiştirilebilir',
            input:K.Select({ id:'su-goal', value:p.goal || 'health',
              options:SP.GOALS.map(g => ({ value:g.id, label:g.label })) }) })}
        </div>

        <div class="setup__unlock">
          <p class="setup__kicker">Bu beş alan neyi açar</p>
          <ul class="setup__list">
            <li><b>Kalori ve protein hedefi</b> — bazal metabolizmandan hesaplanır</li>
            <li><b>Yaşa ve cinsiyete göre referans aralıkları</b> — 58 ölçüm için</li>
            <li><b>eGFR ve FIB-4</b> — yaş olmadan hesaplanamayan indeksler</li>
            <li><b>Toparlanma skoru</b> — ilk günün kilosu taban çizgi olur</li>
          </ul>
        </div>

        ${K.Notice({ tone:'warn', title:'Sınır:', body:SP.CLINICAL.disclaimer })}
      </div>`),
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
