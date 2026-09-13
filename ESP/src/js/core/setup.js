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

window.ESP = window.ESP || {};

ESP.Setup = (function(){
  const U = ESP.U;
  const K = ESP.C;
  const { html, map, when } = ESP.h;

  /* Sihirbaz yalnizca ad yoksa gerekir. Odak ve dilin varsayilani vardir ve
     varsayilan dogru calisir — zorunlu soru sayisi bir tutulur. */
  function needed(){
    const p = ESP.S.profile;
    return !p || !p.name;
  }

  function open(){
    const p = ESP.S.profile || {};

    ESP.UI.sheet({
      title:'ESP', subtitle:'entelektüel seviye planlayıcı',
      wide:true, noClose:true,
      body:String(html`<div class="setup">

        <div class="setup__hero">
          <p class="setup__kicker">İlk kurulum</p>
          <h2 class="setup__h">Üç alan yeter. Gerisi çalıştıkça dolar.</h2>
          <p class="setup__lede">Bu sistem senin girdiğin pratiği okur ve ondan
            hesap yapar. Sınav yapmaz, seviye vermez, yetenek yargısı kurmaz —
            ve bilmediği hiçbir şeyi tahmin etmez.</p>
        </div>

        <div class="setup__rules">
          <div class="setup__rule">
            <b>Girilmemiş gün sıfır sayılmaz.</b>
            <span>Çalışmadığın gün hesaba «0 dakika» diye girmez; o gün hiç
              sayılmaz ve kaç günden hesaplandığı ekranda yazar.</span>
          </div>
          <div class="setup__rule">
            <b>Tahmin, ölçüm gibi gösterilmez.</b>
            <span>Her sayının yanında nereden geldiği durur: ölçüldü,
              hesaplandı, tahmin.</span>
          </div>
          <div class="setup__rule">
            <b>Ses kaydı tutulmaz.</b>
            <span>Diksiyonda saklanan şey süre ve kendi işaretlediğin hata
              sayısıdır; ses dosyası hiç oluşmaz.</span>
          </div>
        </div>

        <div class="setup__form">
          ${K.Field({ label:'Ad', hint:'yalnızca sana seslenmek için — modele gitmez',
            input:K.Input({ id:'su-name', value:p.name || '',
              placeholder:'Sana nasıl seslenelim?' }) })}
          ${K.Field({ label:'Odak', hint:'eşit skorlu iki iş çıkarsa sırayı belirler',
            input:K.Select({ id:'su-focus', value:p.focus || 'balanced',
              options:ESP.FOCUS.map(f => ({ value:f.id, label:f.label })) }) })}
          ${K.Field({ label:'Çalışılan dil', hint:'sonradan eklenebilir',
            input:K.Select({ id:'su-lang', value:(p.langs && p.langs[0]) || 'en',
              options:ESP.LANGS.map(l => ({ value:l.id, label:l.label })) }) })}
          ${K.Field({ label:'Enstrüman', hint:'metronom ve tempo eşiği bunun için',
            input:K.Input({ id:'su-instrument', value:p.instrument || 'gitar',
              placeholder:'gitar' }) })}
          ${K.Field({ label:'Günlük pratik tabanı (dakika)',
            hint:'hedef değil ölçüt: rota bunu taban alır',
            input:K.Input({ id:'su-minutes', type:'number', numeric:true,
              min:10, max:600, value:p.dailyMinutes || 60, placeholder:'60' }) })}
        </div>

        <div class="setup__mods">
          <p class="setup__kicker">Hangi bölümler açık olsun?</p>
          <p class="setup__lede">Dokunmazsan hepsi açık kalır. Kapattığın bölüm
            gezinmeden kalkar, reçeteye ve denge hesabına girmez — ama verisi
            silinmez, istediğin zaman Ayarlar'dan geri açarsın.</p>
          <div class="setup__picks">${map(ESP.DISCIPLINES, d => K.PickCard({
            label:d.label, meta:d.covers, on:ESP.Mod.isOn(d.id),
            act:'setup-mod', data:{ 'data-id':d.id } }))}</div>
          <p class="setup__hintline">Seçili olanlar ✓ işaretlidir. Dokununca
            açılır ya da kapanır.</p>
        </div>

        <div class="setup__unlock">
          <p class="setup__kicker">Bu alanlar neyi açar</p>
          <ul class="setup__list">
            <li><b>Sıradaki tek iş</b> — açık disiplinler arasında önceliği kural motoru seçer</li>
            <li><b>Aralıklı tekrar</b> — kart eklediğinde retansiyon ölçülmeye başlar</li>
            <li><b>Haftalık rota</b> — hiç açılmayan disiplin öne alınır</li>
            <li><b>Dokuz ajanlı ofis</b> — her masa yalnızca kendi ölçümüne bakar</li>
            <li><b>Merdiven</b> — her bölümde sıfırdan üstatlığa ölçülebilir kapılar</li>
          </ul>
        </div>

        ${K.Notice({ tone:'warn', title:'Sınır:', body:ESP.PEDAGOGIC.disclaimer })}
      </div>`),
      footer:String(html`${K.Button({ label:'Şimdilik atla', act:'setup-skip' })}
        ${K.Button({ label:'Başla', tone:'primary', act:'setup-save' })}`),
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
      ESP.UI.toast('Eksik: ad');
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
    ESP.UI.toast('Hazır — ilk oturumu girince ölçüm başlar');
    ESP.App.render();
    return true;
  }

  function skip(){
    secim = null;
    ESP.UI.closeSheet();
    ESP.UI.toast('Atlandı — Profil ekranından istediğin zaman doldurabilirsin');
  }

  return { needed, open, save, skip, pick, picked };
})();
