/* Kurulum — ilk acilista sorulan en az soru.

   ESP'nin sordugu sey SPI'den az: burada hicbir hesap kisisel olcuye
   dayanmaz. Retansiyon, temiz BPM ve okunabilirlik yastan ya da kilodan
   bagimsizdir; sorulmasi gereken tek sey NE CALISILDIGIDIR.

   Uc alan: ad, odak, hangi dil. Gerisi zamanla dolar ve olmadan da sistem
   calisir. Sihirbaz atlanabilir; atlandiginda ekranlar bos kalmaz.

   Bir hata burada uzun sure gorunmeden durdu: secim kartlari
   `String(K.PickCard(...))` ile uretiliyordu. `html` sablonu icine giren duz
   bir dize KACILIR (auto-escape) — yani kullanici kartlari degil,
   `<button class="pickcard">…` diye HAM ETIKETLERI okuyordu.

   Dogrusu `map()` yardimcisini kullanmak: o, isaretli (Raw) parcalari
   oldugu gibi gecirir. Ders: `html` sablonuna giren her sey ya Raw'dur ya
   kacilir; String() ikisinin arasindaki isareti siler.

   Dorduncu bir soru sonradan eklendi ve arayuzun tamamini degistiriyor:
   HANGI BOLUMLER. Kullanici burada calismayacagi disiplinleri kapatir;
   gezinme seridi, reçete, denge hesabi ve ofis masalari ona gore daralir.

   Secim ZORUNLU DEGIL: hicbiri dokunulmazsa hepsi acik kalir. Varsayilan
   "hepsi acik"tir cunku bir sistemin ilk acilista kullaniciya bir seyi
   kapattirmasi, daha kullanmadan bir sey kaybettirmektir. Kapatmak sonra
   da mumkun — ve kapatmak veriyi SILMEZ (bkz. core/modules.js). */
window.LIFEOS.PARCA.yazilar({
  'esp.core.setup.esp':'ESP',
  'esp.core.setup.entelektuel-seviye-planlayic':'entelektüel seviye planlayıcı',
  'esp.core.setup.i-lk-kurulum':'İlk kurulum',
  'esp.core.setup.uc-alan-yeter-gerisi-calisti':'Üç alan yeter. Gerisi çalıştıkça dolar.',
  'esp.core.setup.bu-sistem-senin-girdigin-pra':'Bu sistem senin girdiğin pratiği okur ve ondan hesap yapar. Sınav yapmaz, seviye vermez, yetenek yargısı kurmaz — ve bilmediği hiçbir şeyi tahmin etmez.',
  'esp.core.setup.bu-alanlar-neyi-acar':'Bu alanlar neyi açar',
  'esp.core.setup.siradaki-tek-is':'Sıradaki tek iş',
  'esp.core.setup.acik-disiplinler-arasinda-on':'— açık disiplinler arasında önceliği kural motoru seçer',
  'esp.core.setup.aralikli-tekrar':'Aralıklı tekrar',
  'esp.core.setup.kart-eklediginde-retansiyon':'— kart eklediğinde retansiyon ölçülmeye başlar',
  'esp.core.setup.haftalik-rota':'Haftalık rota',
  'esp.core.setup.hic-acilmayan-disiplin-one':'— hiç açılmayan disiplin öne alınır',
  'esp.core.setup.dokuz-ajanli-ofis':'Dokuz ajanlı ofis',
  'esp.core.setup.her-masa-yalnizca-kendi':'— her masa yalnızca kendi ölçümüne bakar',
  'esp.core.setup.merdiven':'Merdiven',
  'esp.core.setup.her-bolumde-sifirdan-ustatli':'— her bölümde sıfırdan üstatlığa ölçülebilir basamaklar',
  'esp.core.setup.girilmemis-gun-sifir-sayilma':'Girilmemiş gün sıfır sayılmaz.',
  'esp.core.setup.calismadigin-gun-hesaba-0-da':'Çalışmadığın gün hesaba «0 dakika» diye girmez; o gün hiç sayılmaz ve kaç günden hesaplandığı ekranda yazar.',
  'esp.core.setup.tahmin-olcum-gibi-gosterilme':'Tahmin, ölçüm gibi gösterilmez.',
  'esp.core.setup.her-sayinin-yaninda-nereden':'Her sayının yanında nereden geldiği durur: ölçüldü, hesaplandı, tahmin.',
  'esp.core.setup.ses-kaydi-tutulmaz':'Ses kaydı tutulmaz.',
  'esp.core.setup.diksiyonda-saklanan-sey-sure':'Diksiyonda saklanan şey süre ve kendi işaretlediğin hata sayısıdır; ses dosyası hiç oluşmaz.',
  'esp.core.setup.sinir':'Sınır:',
  'esp.core.setup.ad':'Ad',
  'esp.core.setup.sana-nasil-seslenelim':'Sana nasıl seslenelim?',
  'esp.core.setup.odak':'Odak',
  'esp.core.setup.calisilan-dil':'Çalışılan dil',
  'esp.core.setup.enstruman':'Enstrüman',
  'esp.core.setup.gunluk-pratik-tabani-dakika':'Günlük pratik tabanı (dakika)',
  'esp.core.setup.hangi-bolumler-acik-olsun':'Hangi bölümler açık olsun?',
  'esp.core.setup.secili-olanlar-isaretlidir-d':'Seçili olanlar ✓ işaretlidir. Dokununca açılır ya da kapanır.',
  'esp.core.setup.simdilik-atla':'Şimdilik atla',
  'esp.core.setup.geri':'Geri',
  'esp.core.setup.devam':'Devam',
  'esp.core.setup.basla':'Başla',
  'esp.core.setup.eksik-ad':'Eksik: ad',
  'esp.core.setup.hazir-ilk-oturumu-girince':'Hazır — ilk oturumu girince ölçüm başlar',
  'esp.core.setup.atlandi-profil-ekranindan-is':'Atlandı — Profil ekranından istediğin zaman doldurabilirsin',
});


window.ESP = window.ESP || {};

ESP.Setup = (function(){
  const U = ESP.U;
  const K = ESP.C;
  const { html, raw, map, when } = ESP.h;

  /* Sihirbaz yalnizca ad yoksa gerekir. Odak ve dilin varsayilani vardir ve
     varsayilan dogru calisir — zorunlu soru sayisi bir tutulur. */
  function needed(){
    const p = ESP.S.profile;
    return !p || !p.name;
  }

  function open(){
    const p = ESP.S.profile || {};

    ESP.UI.sheet({
      title:yz('esp.core.setup.esp'), subtitle:yz('esp.core.setup.entelektuel-seviye-planlayic'),
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
        ${raw(window.LIFEOS.KURULUM_HTML('esp', { adimlar:[
          /* 1/3 Ne ölçüyoruz? — ne yapar, alanlar neyi açar */
          String(html`
        <div class="setup__hero">
          <p class="setup__kicker">${yz('esp.core.setup.i-lk-kurulum')}</p>
          <h2 class="setup__h">${yz('esp.core.setup.uc-alan-yeter-gerisi-calisti')}</h2>
          <p class="setup__lede">${yz('esp.core.setup.bu-sistem-senin-girdigin-pra')}</p>
        </div>

        <div class="setup__unlock">
          <p class="setup__kicker">${yz('esp.core.setup.bu-alanlar-neyi-acar')}</p>
          <ul class="setup__list">
            <li><b>${yz('esp.core.setup.siradaki-tek-is')}</b> ${yz('esp.core.setup.acik-disiplinler-arasinda-on')}</li>
            <li><b>${yz('esp.core.setup.aralikli-tekrar')}</b> ${yz('esp.core.setup.kart-eklediginde-retansiyon')}</li>
            <li><b>${yz('esp.core.setup.haftalik-rota')}</b> ${yz('esp.core.setup.hic-acilmayan-disiplin-one')}</li>
            <li><b>${yz('esp.core.setup.dokuz-ajanli-ofis')}</b> ${yz('esp.core.setup.her-masa-yalnizca-kendi')}</li>
            <li><b>${yz('esp.core.setup.merdiven')}</b> ${yz('esp.core.setup.her-bolumde-sifirdan-ustatli')}</li>
          </ul>
        </div>

`),
          /* 2/3 Neye karar vermiyoruz? — sınır atlanamaz: «Başla» son adımda */
          String(html`
        <div class="setup__rules">
          <div class="setup__rule">
            <b>${yz('esp.core.setup.girilmemis-gun-sifir-sayilma')}</b>
            <span>${yz('esp.core.setup.calismadigin-gun-hesaba-0-da')}</span>
          </div>
          <div class="setup__rule">
            <b>${yz('esp.core.setup.tahmin-olcum-gibi-gosterilme')}</b>
            <span>${yz('esp.core.setup.her-sayinin-yaninda-nereden')}</span>
          </div>
          <div class="setup__rule">
            <b>${yz('esp.core.setup.ses-kaydi-tutulmaz')}</b>
            <span>${yz('esp.core.setup.diksiyonda-saklanan-sey-sure')}</span>
          </div>
        </div>

        ${K.Notice({ tone:'warn', title:yz('esp.core.setup.sinir'), body:ESP.PEDAGOGIC.disclaimer })}
`),
          /* 3/3 Nasıl başlıyoruz? — alanlar ve açık bölümler */
          String(html`
        <div class="setup__form">
          ${K.Field({ label:yz('esp.core.setup.ad'), hint:'yalnızca sana seslenmek için — modele gitmez',
            input:K.Input({ id:'su-name', value:p.name || '',
              placeholder:yz('esp.core.setup.sana-nasil-seslenelim') }) })}
          ${K.Field({ label:yz('esp.core.setup.odak'), hint:'eşit skorlu iki iş çıkarsa sırayı belirler',
            input:K.Select({ id:'su-focus', value:p.focus || 'balanced',
              options:ESP.FOCUS.map(f => ({ value:f.id, label:f.label })) }) })}
          ${K.Field({ label:yz('esp.core.setup.calisilan-dil'), hint:'sonradan eklenebilir',
            input:K.Select({ id:'su-lang', value:(p.langs && p.langs[0]) || 'en',
              options:ESP.LANGS.map(l => ({ value:l.id, label:l.label })) }) })}
          ${K.Field({ label:yz('esp.core.setup.enstruman'), hint:'metronom ve tempo eşiği bunun için',
            input:K.Input({ id:'su-instrument', value:p.instrument || 'gitar',
              placeholder:'gitar' }) })}
          ${K.Field({ label:yz('esp.core.setup.gunluk-pratik-tabani-dakika'),
            hint:'alt sınır, hedef değil: plan bunu en az sayar',
            input:K.Input({ id:'su-minutes', type:'number', numeric:true,
              min:10, max:600, value:p.dailyMinutes || 60, placeholder:'60' }) })}
        </div>

        <div class="setup__mods">
          <p class="setup__kicker">${yz('esp.core.setup.hangi-bolumler-acik-olsun')}</p>
          <p class="setup__lede">Dokunmazsan hepsi açık kalır. Kapattığın bölüm
            gezinmeden kalkar, reçeteye ve denge hesabına girmez — ama verisi
            silinmez, istediğin zaman Ayarlar'dan geri açarsın.</p>
          <div class="setup__picks">${map(ESP.DISCIPLINES, d => K.PickCard({
            label:d.label, meta:d.covers, on:ESP.Mod.isOn(d.id),
            act:'setup-mod', data:{ 'data-id':d.id } }))}</div>
          <p class="setup__hintline">${yz('esp.core.setup.secili-olanlar-isaretlidir-d')}</p>
        </div>

`),
        ] }))}
      </div>`),
      /* Üç adım (171): «Geri» ilk adımda, «Devam» son adımda, «Başla»
         son adımdan önce gizli — LIFEOS.KURULUM_GIT görünürlüğü değiştirir. */
      footer:String(html`${K.Button({ label:yz('esp.core.setup.simdilik-atla'), act:'setup-skip' })}
        ${K.Button({ label:yz('esp.core.setup.geri'), act:'kurulum-geri', data:{ 'data-kurulum-degil':'1', hidden:true } })}
        ${K.Button({ label:yz('esp.core.setup.devam'), tone:'primary', act:'kurulum-ileri', data:{ 'data-kurulum-degil':'3' } })}
        ${K.Button({ label:yz('esp.core.setup.basla'), tone:'primary', act:'setup-save', data:{ 'data-kurulum-yalniz':'3', hidden:true } })}`),
    });
  }

  /* Sihirbaz içindeki seçim GEÇİCİDİR: kaydedilene kadar yalnızca bu
     nesnede durur. Yarıda kapatılan bir sihirbaz, kullanıcının profilini
     yarım bir seçimle bırakmamalı. */
  let secim = null;

  function pick(id){
    if(!secim) secim = ESP.Mod.activeIds().slice();
    const i = secim.indexOf(id);
    if(i >= 0) secim.splice(i, 1); else secim.push(id);
    return secim;
  }

  function picked(){ return secim; }

  async function save(){
    const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const numOr = v => v === '' ? null : Number(String(v).replace(',', '.'));

    const ad = get('su-name');
    if(!ad){
      ESP.UI.toast(yz('esp.core.setup.eksik-ad'));
      return false;
    }

    await ESP.Model.saveProfile({
      name:ad,
      focus:get('su-focus') || 'balanced',
      langs:[get('su-lang') || 'en'],
      instrument:get('su-instrument') || 'gitar',
      dailyMinutes:numOr(get('su-minutes')) || 60,
    });

    if(secim && secim.length){
      const res = await ESP.Mod.setAll(secim);
      if(!res.ok){ ESP.UI.toast(res.error); return false; }
    }
    secim = null;

    ESP.UI.closeSheet();
    ESP.UI.toast(yz('esp.core.setup.hazir-ilk-oturumu-girince'));
    ESP.App.render();
    return true;
  }

  /* Açılışta kendiliğinden açılsın mı? «Şimdilik atla» bu profilde
     hatırlanır: sihirbaz her açılışta (telefon uygulamasında her modül
     dönüşünde) yeniden gelmez. Profil yine eksik sayılır (needed): Profil
     ekranından doldurulur. SPİ'nin ikizi (1c4854ef). */
  function acilsinMi(){
    return needed() && !(ESP.S.prefs && ESP.S.prefs.kurulumAtlandi);
  }

  async function skip(){
    secim = null;
    ESP.UI.closeSheet();
    ESP.UI.toast(yz('esp.core.setup.atlandi-profil-ekranindan-is'));
    await ESP.Model.savePrefs({ kurulumAtlandi:true });
  }

  return { needed, acilsinMi, open, save, skip, pick, picked };
})();
