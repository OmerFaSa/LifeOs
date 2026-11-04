/* Kurulum — ilk açılışta sorulan en az soru.

   Yalnızca hesabın yapılabilmesi için gereken beş alan sorulur: ad, doğum
   yılı, cinsiyet, boy, kilo. Geri kalan her şey (hedef, hane, sepet)
   sonradan doldurulur ve olmadan da sistem çalışır.

   Sihirbaz atlanabilir. Atlandığında ekranlar boş kalmaz; "profil eksik"
   diyen ve nereye gidileceğini söyleyen kartlar görünür. */
window.LIFEOS.PARCA.yazilar({
  'spi.core.setup.spi':'SPİ',
  'spi.core.setup.kisisel-ve-aile-odakli-sagli':'kişisel ve aile odaklı sağlık sistemi',
  'spi.core.setup.i-lk-kurulum':'İlk kurulum',
  'spi.core.setup.bes-alan-yeter-gerisi-zamanl':'Beş alan yeter. Gerisi zamanla dolar.',
  'spi.core.setup.bu-sistem-senin-girdigin-ver':'Bu sistem senin girdiğin veriyi okur ve ondan hesap yapar. Ölçüm yapmaz, teşhis koymaz, ilaç önermez — ve bilmediği hiçbir şeyi tahmin etmez.',
  'spi.core.setup.bu-bes-alan-neyi-acar':'Bu beş alan neyi açar',
  'spi.core.setup.kalori-ve-protein-hedefi':'Kalori ve protein hedefi',
  'spi.core.setup.bazal-metabolizmandan-hesapl':'— bazal metabolizmandan hesaplanır',
  'spi.core.setup.yasa-ve-cinsiyete-gore-refer':'Yaşa ve cinsiyete göre referans aralıkları',
  'spi.core.setup.58-olcum-icin':'— 58 ölçüm için',
  'spi.core.setup.egfr-ve-fib-4':'eGFR ve FIB-4',
  'spi.core.setup.yas-olmadan-hesaplanamayan-i':'— yaş olmadan hesaplanamayan indeksler',
  'spi.core.setup.toparlanma-skoru':'Toparlanma skoru',
  'spi.core.setup.ilk-gunun-kilosu-taban':'— ilk günün kilosu taban çizgi olur',
  'spi.core.setup.eksik-veri-sifir-sayilmaz':'Eksik veri sıfır sayılmaz.',
  'spi.core.setup.bos-biraktigin-alan-hesaba-0':'Boş bıraktığın alan hesaba «0» diye girmez; o hesap hiç yapılmaz ve nedeni yazar.',
  'spi.core.setup.tahmin-olcum-gibi-gosterilme':'Tahmin, ölçüm gibi gösterilmez.',
  'spi.core.setup.her-sayinin-yaninda-nereden':'Her sayının yanında nereden geldiği durur: ölçüldü, hesaplandı, tahmin.',
  'spi.core.setup.veriler-bu-cihazda-kalir':'Veriler bu cihazda kalır.',
  'spi.core.setup.ad-ve-dogum-yili-hicbir':'Ad ve doğum yılı hiçbir modele gönderilmez.',
  'spi.core.setup.sinir':'Sınır:',
  'spi.core.setup.ad':'Ad',
  'spi.core.setup.sana-nasil-seslenelim':'Sana nasıl seslenelim?',
  'spi.core.setup.dogum-yili':'Doğum yılı',
  'spi.core.setup.cinsiyet':'Cinsiyet',
  'spi.core.setup.sec':'Seç',
  'spi.core.setup.erkek':'Erkek',
  'spi.core.setup.kadin':'Kadın',
  'spi.core.setup.boy-cm':'Boy (cm)',
  'spi.core.setup.kilo-kg':'Kilo (kg)',
  'spi.core.setup.hedef':'Hedef',
  'spi.core.setup.simdilik-atla':'Şimdilik atla',
  'spi.core.setup.geri':'Geri',
  'spi.core.setup.devam':'Devam',
  'spi.core.setup.basla':'Başla',
  'spi.core.setup.eksik':'Eksik: ',
  'spi.core.setup.hazir-hedefler-hesaplandi':'Hazır — hedefler hesaplandı',
  'spi.core.setup.atlandi-hane-ekranindan-iste':'Atlandı — Hane ekranından istediğin zaman doldurabilirsin',
});


window.SP = window.SP || {};

SP.Setup = (function(){
  const U = SP.U;
  const K = SP.C;
  const { html, raw } = SP.h;

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
      title:yz('spi.core.setup.spi'), subtitle:yz('spi.core.setup.kisisel-ve-aile-odakli-sagli'),
      wide:true, noClose:true,
      body:String(html`<div class="setup">

        <!-- TANITIM AFISI — sisteme ILK giren burada durur.

             ALT METNI BOS ve aria-hidden: afisin uzerinde yazan sey
             (baslik, cumle, dort ozellik) hemen ALTINDA gercek metin
             olarak zaten yaziyor. Ayni cumleyi bir de alt metinde
             tekrarlamak, ekran okuyucuya her seyi iki kere okutmakti.
             Afis burada bir SUSTUR ve susun alt metni bos olur.

             Dosya yoksa onerror dugumu kaldirir; sihirbaz eskisi gibi
             calisir.

             NOT: bu yorum bir sablon dizesinin (template literal)
             ICINDE duruyor — icinde TERS TIRNAK OLAMAZ. Ilk yazimda
             alt sozcugu ters tirnak icine alinmisti ve dize orada
             kapandi: butun dosya
             ayrisamadi, SPI'nin dokuz yuz testi «SP.Setup tanimsiz»
             diye dustu. -->
        ${raw(window.LIFEOS.KURULUM_HTML('spi', { adimlar:[
          /* 1/3 Ne ölçüyoruz? — ne yapar, beş alan neyi açar */
          String(html`
        <div class="setup__hero">
          <p class="setup__kicker">${yz('spi.core.setup.i-lk-kurulum')}</p>
          <h2 class="setup__h">${yz('spi.core.setup.bes-alan-yeter-gerisi-zamanl')}</h2>
          <p class="setup__lede">${yz('spi.core.setup.bu-sistem-senin-girdigin-ver')}</p>
        </div>

        <div class="setup__unlock">
          <p class="setup__kicker">${yz('spi.core.setup.bu-bes-alan-neyi-acar')}</p>
          <ul class="setup__list">
            <li><b>${yz('spi.core.setup.kalori-ve-protein-hedefi')}</b> ${yz('spi.core.setup.bazal-metabolizmandan-hesapl')}</li>
            <li><b>${yz('spi.core.setup.yasa-ve-cinsiyete-gore-refer')}</b> ${yz('spi.core.setup.58-olcum-icin')}</li>
            <li><b>${yz('spi.core.setup.egfr-ve-fib-4')}</b> ${yz('spi.core.setup.yas-olmadan-hesaplanamayan-i')}</li>
            <li><b>${yz('spi.core.setup.toparlanma-skoru')}</b> ${yz('spi.core.setup.ilk-gunun-kilosu-taban')}</li>
          </ul>
        </div>

`),
          /* 2/3 Neye karar vermiyoruz? — sınır atlanamaz: «Başla» son adımda */
          String(html`
        <div class="setup__rules">
          <div class="setup__rule">
            <b>${yz('spi.core.setup.eksik-veri-sifir-sayilmaz')}</b>
            <span>${yz('spi.core.setup.bos-biraktigin-alan-hesaba-0')}</span>
          </div>
          <div class="setup__rule">
            <b>${yz('spi.core.setup.tahmin-olcum-gibi-gosterilme')}</b>
            <span>${yz('spi.core.setup.her-sayinin-yaninda-nereden')}</span>
          </div>
          <div class="setup__rule">
            <b>${yz('spi.core.setup.veriler-bu-cihazda-kalir')}</b>
            <span>${yz('spi.core.setup.ad-ve-dogum-yili-hicbir')}</span>
          </div>
        </div>

        ${K.Notice({ tone:'warn', title:yz('spi.core.setup.sinir'), body:SP.CLINICAL.disclaimer })}
`),
          /* 3/3 Nasıl başlıyoruz? — beş alan */
          String(html`
        <div class="setup__form">
          ${K.Field({ label:yz('spi.core.setup.ad'), hint:'yalnızca sana seslenmek için — modele gitmez',
            input:K.Input({ id:'su-name', value:p.name || '',
              placeholder:yz('spi.core.setup.sana-nasil-seslenelim') }) })}
          ${K.Field({ label:yz('spi.core.setup.dogum-yili'), hint:'referans aralıkları yaşa göre değişir',
            input:K.Input({ id:'su-birth', type:'number', numeric:true,
              min:yil.min, max:yil.max, value:p.birthYear || '',
              placeholder:String(yil.max - 25) }) })}
          ${K.Field({ label:yz('spi.core.setup.cinsiyet'), hint:'ferritin ve hemoglobin aralıkları buna bağlı',
            input:K.Select({ id:'su-sex', value:p.sex || '',
              options:[{ value:'', label:yz('spi.core.setup.sec') }, { value:'male', label:yz('spi.core.setup.erkek') }, { value:'female', label:yz('spi.core.setup.kadin') }] }) })}
          ${K.Field({ label:yz('spi.core.setup.boy-cm'), hint:'bazal metabolizma hesabına girer',
            input:K.Input({ id:'su-height', type:'number', numeric:true,
              min:80, max:230, value:p.heightCm || '', placeholder:'178' }) })}
          ${K.Field({ label:yz('spi.core.setup.kilo-kg'), hint:'ilk günün ölçümü olarak da kaydedilir',
            input:K.Input({ id:'su-weight', type:'number', numeric:true, step:'0.1',
              min:20, max:250, value:p.weightKg || '', placeholder:'74' }) })}
          ${K.Field({ label:yz('spi.core.setup.hedef'), hint:'sonradan değiştirilebilir',
            input:K.Select({ id:'su-goal', value:p.goal || 'health',
              options:SP.GOALS.map(g => ({ value:g.id, label:g.label })) }) })}
        </div>

`),
        ] }))}
      </div>`),
      /* Üç adım (171): «Geri» ilk adımda, «Devam» son adımda, «Başla»
         son adımdan önce gizli — LIFEOS.KURULUM_GIT görünürlüğü değiştirir. */
      footer:String(html`${K.Button({ label:yz('spi.core.setup.simdilik-atla'), act:'setup-skip' })}
        ${K.Button({ label:yz('spi.core.setup.geri'), act:'kurulum-geri', data:{ 'data-kurulum-degil':'1', hidden:true } })}
        ${K.Button({ label:yz('spi.core.setup.devam'), tone:'primary', act:'kurulum-ileri', data:{ 'data-kurulum-degil':'3' } })}
        ${K.Button({ label:yz('spi.core.setup.basla'), tone:'primary', act:'setup-save', data:{ 'data-kurulum-yalniz':'3', hidden:true } })}`),
    });
  }

  async function save(){
    const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const numOr = v => v === '' ? null : Number(String(v).replace(',', '.'));

    const patch = {
      name:get('su-name'),
      birthYear:numOr(get('su-birth')),
      sex:get('su-sex') || null,
      heightCm:numOr(get('su-height')),
      weightKg:numOr(get('su-weight')),
      goal:get('su-goal') || 'health',
    };

    const missing = [];
    if(!patch.name) missing.push('ad');
    if(!patch.birthYear) missing.push('doğum yılı');
    if(!patch.heightCm) missing.push('boy');
    if(!patch.weightKg) missing.push('kilo');
    if(missing.length){
      SP.UI.toast(yz('spi.core.setup.eksik') + missing.join(', '));
      return false;
    }

    await SP.Model.saveProfile(patch);
    await SP.Model.saveVitals(U.todayISO(), { weight:patch.weightKg });
    SP.UI.closeSheet();
    SP.UI.toast(yz('spi.core.setup.hazir-hedefler-hesaplandi'));
    SP.App.render();
    return true;
  }

  /* Açılışta kendiliğinden açılsın mı? «Şimdilik atla» bu profilde
     hatırlanır: sihirbaz her açılışta (telefon uygulamasında her modül
     dönüşünde) yeniden gelmez. Profil yine eksik sayılır (needed): «profil
     eksik» kartları durur, Hane'den doldurulur. */
  function acilsinMi(){
    return needed() && !(SP.S.prefs && SP.S.prefs.kurulumAtlandi);
  }

  async function skip(){
    SP.UI.closeSheet();
    SP.UI.toast(yz('spi.core.setup.atlandi-hane-ekranindan-iste'));
    await SP.Model.savePrefs({ kurulumAtlandi:true });
  }

  return { needed, acilsinMi, open, save, skip };
})();
