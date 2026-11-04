/* Hane — profiller ve kişisel hedefler.

   Her profil kendi depo anahtarında yaşar; tahlil ve ölçüm verisi profiller
   arasında karışmaz. Hane listesi yalnızca ad, rol ve temel ölçüleri taşır —
   ham sağlık verisi listeye hiç girmez.

   Profil geçişi sayfayı yeniden yükler: yarım kalmış bir yazma işleminin
   yanlış profile düşmesi böylece imkânsızdır. */
window.LIFEOS.PARCA.yazilar({
  'spi.family.eksik-alan':'Eksik alan: ',
  'spi.family.bazal-metabolizma':'Bazal metabolizma',
  'spi.family.bugunku-hareket':'Bugünkü hareket',
  'spi.family.bugunku-ihtiyac':'Bugünkü ihtiyaç',
  'spi.family.hedef-kalori':'Hedef kalori',
  'spi.family.her-profil-kendi-depo-anahta':'Her profil kendi depo anahtarında durur. ',
  'spi.family.profil-degistirdiginde-butun':'Profil değiştirdiğinde bütün veri seti değişir; veriler karışmaz.',
  'spi.family.tema-secildigi-anda-uygulani':'Tema seçildiği anda uygulanır. «Kaydet» yalnız hanedeki kişi ',
  'spi.family.profil-eklendikten-sonra-ona':'Profil eklendikten sonra ona geçip kilo, boy ve hedefini ',
  'spi.family.profili-degistir':'Profili değiştir',
  'spi.family.sayfa-yeniden-yuklenir-ve-bu':'Sayfa yeniden yüklenir ve bu profilin verileri açılır. Kaydedilmemiş bir alan varsa kaybolur.',
  'spi.family.profile-gec':'Profile geç',
  'spi.family.profil-listeden-cikar-ama-ve':'Profil listeden çıkar ama VERİSİ SİLİNMEZ; kendi anahtarında durmaya devam eder. ',
  'spi.family.ayni-adla-yeniden-eklersen-v':'Aynı adla yeniden eklersen veriler geri gelir.',
  'spi.family.listeden-cikarildi':'Listeden çıkarıldı',
  'spi.family.profil-eksik':'Profil eksik.',
  'spi.family.profil-hazir':'Profil hazır.',
  'spi.family.kilo-boy-dogum-yili-ve':'Kilo, boy, doğum yılı ve cinsiyet girilince bütün hedefler ',
  'spi.family.hedefler-gorunum-ve-hane-uye':'Hedefler, görünüm ve hane üyeleri burada. Her profil kendi ',
});


window.SP = window.SP || {};
SP.Screens = SP.Screens || {};
window.LIFEOS.PARCA.yazilar({
  'spi.family.profilin':'Profilin',
  'spi.family.hedefler-hazir':'hedefler hazır',
  'spi.family.ad':'Ad',
  'spi.family.dogum-yili':'Doğum yılı',
  'spi.family.cinsiyet':'Cinsiyet',
  'spi.family.sec':'Seç',
  'spi.family.erkek':'Erkek',
  'spi.family.kadin':'Kadın',
  'spi.family.boy-cm':'Boy (cm)',
  'spi.family.kilo-kg':'Kilo (kg)',
  'spi.family.hedef':'Hedef',
  'spi.family.kaydet':'Kaydet',
  'spi.family.hesaplanan-hedefler':'Hesaplanan hedefler',
  'spi.family.laboratuvara-gore-yukseltile':'Laboratuvara göre yükseltilenler:',
  'spi.family.gunluk-ihtiyac-gunden-gune-d':'Günlük ihtiyaç günden güne değişir: bazal metabolizma artı o gün girdiğin hareketin enerjisi (MET, net). Hareket girmediğin gün ihtiyaç bazal metabolizmadır; hareket düzeyinden tahmin yapılmaz.',
  'spi.family.hanedeki-profiller':'Hanedeki profiller',
  'spi.family.acik':'açık',
  'spi.family.yasinda':'yaşında',
  'spi.family.son':'· son',
  'spi.family.gec':'Geç',
  'spi.family.listeden-cikar':'Listeden çıkar',
  'spi.family.profil-ekle':'Profil ekle',
  'spi.family.gorunum-ve-hane-ayari':'Görünüm ve hane ayarı',
  'spi.family.tema':'Tema',
  'spi.family.sistem':'Sistem',
  'spi.family.acik-2':'Açık',
  'spi.family.koyu':'Koyu',
  'spi.family.hanedeki-kisi-sayisi':'Hanedeki kişi sayısı',
  'spi.family.gizlilik-kilidi':'Gizlilik kilidi',
  'spi.family.profil-kaydedildi':'Profil kaydedildi',
  'spi.family.kaydedildi':'Kaydedildi',
  'spi.family.aile-bireyi-ya-da-ikinci':'Aile bireyi ya da ikinci profil',
  'spi.family.ornek-ayse':'Örnek: Ayşe',
  'spi.family.vazgec':'Vazgeç',
  'spi.family.ekle':'Ekle',
  'spi.family.ad-gerekli':'Ad gerekli',
  'spi.family.profil-eklendi':'Profil eklendi',
  'spi.family.hane':'Hane',
});
/* Rütbe burada bir bölümdür (karar §8-2); üst çubuktaki çip de
buraya açılır. XP yalnız görünürlüktür, kendi çekmecesi olmaz. */
window.LIFEOS.PARCA.sayfa({ id:'family', modul:'spi', cekmece:'ayarlar', ad:'Profil', sira:10 });

SP.Screens.family = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  function profileCard(){
    const p = S.profile;
    const t = SP.Nutri.targets();
    const kilo = M.kiloOf(p);
    return K.Card({
      title:yz('spi.family.profilin'), hint:'profiles',
      sub:p.name || 'adsız profil',
      badge:t.ok ? K.Badge({ label:yz('spi.family.hedefler-hazir'), tone:'ok' })
        : K.Badge({ label:t.missing.length + ' alan eksik', tone:'warn' }),
      body:html`
        <div class="grid-form">
          ${K.Field({ label:yz('spi.family.ad'), input:K.Input({ id:'p-name', value:p.name || '' }) })}
          ${K.Field({ label:yz('spi.family.dogum-yili'),
            input:K.Input({ id:'p-birth', type:'number', numeric:true, min:1900, max:2026,
              value:p.birthYear || '' }) })}
          ${K.Field({ label:yz('spi.family.cinsiyet'),
            input:K.Select({ id:'p-sex', value:p.sex || '', options:[{ value:'', label:yz('spi.family.sec') },
              { value:'male', label:yz('spi.family.erkek') }, { value:'female', label:yz('spi.family.kadin') }] }) })}
          ${K.Field({ label:yz('spi.family.boy-cm'),
            input:K.Input({ id:'p-height', type:'number', numeric:true, min:80, max:230,
              value:p.heightCm || '' }) })}
          ${K.Field({ label:yz('spi.family.kilo-kg'), hint:kilo && kilo.date ? 'ölçüldü · ' + U.fmtDate(kilo.date) : '',
            input:K.Input({ id:'p-weight', type:'number', numeric:true, step:'0.1', min:20, max:250,
              value:kilo ? kilo.kg : '' }) })}
          ${K.Field({ label:yz('spi.family.hedef'),
            input:K.Select({ id:'p-goal', value:p.goal,
              options:SP.GOALS.map(g => ({ value:g.id, label:g.label })) }) })}
        </div>
        ${when(!t.ok, () => K.Notice({ tone:'warn', class:'mt-12',
          body:yz('spi.family.eksik-alan') + t.missing.join(', ') + '. Bunlar olmadan kalori ve protein '
             + 'hedefi hesaplanmaz — tahmin edilmez.' }))}`,
      foot:K.Button({ label:yz('spi.family.kaydet'), tone:'primary', act:'save-profile' }),
    });
  }

  function targetCard(){
    const t = SP.Nutri.targets();
    if(!t.ok) return null;
    const n = t.need;
    return K.Card({
      title:yz('spi.family.hesaplanan-hedefler'), hint:'macro-target',
      sub:t.goal.label,
      body:html`
        ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          [yz('spi.family.bazal-metabolizma'), U.fmtNum(t.bmr) + ' kcal'],
          [yz('spi.family.bugunku-hareket'), n && !n.hareketYok ? '+' + U.fmtNum(n.hareket) + ' kcal · ' + n.dakika + ' dk (hesaplandı)'
            : 'girilmedi — ihtiyaca eklenmedi'],
          [yz('spi.family.bugunku-ihtiyac'), U.fmtNum(t.tdee) + ' kcal (hesaplandı)'],
          [yz('spi.family.hedef-kalori'), U.fmtNum(t.kcal) + ' kcal' + (t.goal.deficit ? ' · ' + t.goal.note : '')
            + (t.bmrTaban ? ' · bazal metabolizmanın altına inmez' : '')],
          ['Protein', t.protein.min + '–' + t.protein.max + ' g'],
          ['Yağ', t.fat.min + '–' + t.fat.max + ' g'],
          ['Karbonhidrat', t.carb.min + '–' + t.carb.max + ' g'],
          ['Lif', t.fiber + ' g'],
        ] })}
        ${when(Object.keys(t.adjustments).length, () => K.Notice({ tone:'info', class:'mt-12',
          title:yz('spi.family.laboratuvara-gore-yukseltile'),
          body:html`<ul class="bullets small mt-4">${map(Object.keys(t.adjustments), k => html`
            <li><b>${SP.NUTRI_BY_ID[k] ? SP.NUTRI_BY_ID[k].name : k}</b> ×${U.fmtNet(t.adjustments[k].mult)}
              — ${t.adjustments[k].why}</li>`)}</ul>` }))}
        <p class="small muted mt-10">${yz('spi.family.gunluk-ihtiyac-gunden-gune-d')}</p>
        <p class="small muted mt-6">${SP.MACRO_RULES.protein.note}</p>`,
    });
  }

  function householdCard(){
    const list = M.householdList();
    const active = M.activeProfileId();
    return K.Card({
      title:yz('spi.family.hanedeki-profiller'), hint:'profiles',
      sub:list.length + ' profil',
      body:html`
        ${K.Notice({ tone:'info', body:yz('spi.family.her-profil-kendi-depo-anahta')
          + yz('spi.family.profil-degistirdiginde-butun') })}
        <div class="list mt-12">${map(list, row => html`
          <div class="listitem">
            <div class="grow">
              <b class="small">${row.name || 'Adsız'}</b>
              ${when(row.id === active, () => K.Badge({ label:yz('spi.family.acik'), tone:'ok' }))}
              <div class="tiny dim">${row.role === 'self' ? 'birincil' : 'aile'}
                ${when(row.birthYear, () => html`· ${new Date().getFullYear() - row.birthYear} ${yz('spi.family.yasinda')}`)}
                ${when(row.seenAt, () => html`${yz('spi.family.son')} ${U.fmtShort(row.seenAt.slice(0, 10))}`)}</div>
            </div>
            ${when(row.id !== active, () => K.Button({ label:yz('spi.family.gec'), size:'sm',
              act:'switch-profile', data:{ 'data-id':row.id } }))}
            ${when(row.id !== active, () => K.IconButton({ icon:'trash', size:'sm', plain:true,
              aria:yz('spi.family.listeden-cikar'), act:'remove-profile', data:{ 'data-id':row.id } }))}
          </div>`)}</div>`,
      foot:K.Button({ label:yz('spi.family.profil-ekle'), size:'sm', act:'add-profile' }),
    });
  }

  /* Görünüm tercihleri ANINDA uygulanır, «Kaydet»i beklemez.

     Beklemesi hataydı: kullanıcı listeden «Harita»yı seçiyor, ekranda
     hiçbir şey değişmiyor ve düzenin çalışmadığını sanıyordu. Bir
     görünüm tercihinin karşılığı ancak görülerek anlaşılır; onay
     düğmesinin arkasına saklanamaz.

     Kaydet düğmesi yalnız hane sayısı için kalır. */
  function prefCard(){
    const p = S.prefs || M.defaultPrefs();
    return K.Card({
      title:yz('spi.family.gorunum-ve-hane-ayari'),
      body:html`
        <div class="grid-form">
          ${K.Field({ label:yz('spi.family.tema'),
            input:K.Select({ id:'pref-theme', change:'set-look', value:S.profile.theme || 'system',
              data:{ 'data-varsayilan':'system', 'data-varsayilan-ad':'Sistem' }, options:[
              { value:'system', label:yz('spi.family.sistem') }, { value:'light', label:yz('spi.family.acik-2') },
              { value:'dark', label:yz('spi.family.koyu') }] }) })}
          ${K.Field({ label:yz('spi.family.hanedeki-kisi-sayisi'), hint:'sepet hesabı için',
            input:K.Input({ id:'pref-size', type:'number', numeric:true, min:1, max:20,
              value:p.householdSize || 1 }) })}
        </div>
        ${K.Notice({ tone:'info', class:'mt-10',
          body:yz('spi.family.tema-secildigi-anda-uygulani')
            + 'sayısı için. Tek tasarım: renk modülü söyler.' })}`,
      foot:K.Button({ label:yz('spi.family.kaydet'), size:'sm', act:'save-prefs' }),
    });
  }

  LIFEOS.PARCA.blok({ id:'family.aciklamalar', sayfa:'family', yer:'y1', sira:10, ad:'Açıklamalar', ciz(){
    return raw(UI.rail(['profiles', 'macro-target', 'lab-linked-food', 'privacy']));
  } });
  LIFEOS.PARCA.blok({ id:'family.profilecard', sayfa:'family', yer:'y2', sira:10, ad:'Profil', ciz(){
    return profileCard();
  } });
  LIFEOS.PARCA.blok({ id:'family.targetcard', sayfa:'family', yer:'y2', sira:20, ad:'Hedefler', ciz(){
    return targetCard();
  } });
  LIFEOS.PARCA.blok({ id:'family.householdcard', sayfa:'family', yer:'y2', sira:30, ad:'Hane', ciz(){
    return householdCard();
  } });
  LIFEOS.PARCA.blok({ id:'family.prefcard', sayfa:'family', yer:'y2', sira:40, ad:'Tercihler', ciz(){
    return prefCard();
  } });
  LIFEOS.PARCA.blok({ id:'family.gizlilik-kilidi', sayfa:'family', yer:'y2', sira:50, ad:'Gizlilik kilidi', ciz(){
    return window.LIFEOS && window.LIFEOS.KILIT ? K.Card({ title:yz('spi.family.gizlilik-kilidi'),
          body:raw(window.LIFEOS.KILIT.ayarHtml('spi', { govde:true })) }) : null;
  } });
  async function render(){
    return String(html`
      ${K.Ledger(() => LIFEOS.PARCA.liste('family', 'y2', K, undefined).filter(Boolean))}
      <div class="mt-24">${LIFEOS.PARCA.yer('family', 'y1', K, undefined, typeof raw === 'undefined' ? null : raw)}</div>`);
  }

  /* Görünüm listesi tek bir değişiklik işlevine bağlanır: profile yazılır
     ve kök hemen güncellenir. Paletler ve beş düzen kullanıcı kararıyla
     kalktı (§8-4); yalnız tema kaldı. */
  const change = {
    async 'set-look'(){
      const val = id => { const el = document.getElementById(id); return el ? el.value : null; };
      const patch = {};
      const theme = val('pref-theme');
      if(theme) patch.theme = theme;
      await M.saveProfile(patch);
      SP.App.applyTheme();
      SP.App.render();
    },
  };

  const handle = {
    async 'save-profile'(){
      const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      const numOr = v => v === '' ? null : Number(String(v).replace(',', '.'));
      const once = M.kiloOf();
      await M.saveProfile({
        name:get('p-name'),
        birthYear:numOr(get('p-birth')),
        sex:get('p-sex') || null,
        heightCm:numOr(get('p-height')),
        weightKg:numOr(get('p-weight')),
        goal:get('p-goal') || 'health',
      });
      /* Kilo profilde tutulur ama gunluk olcum de ayni gun kaydini besler:
         tek yerde yazilir, iki yerde okunur diye ikisi de guncellenir. */
      /* Alan son ölçümle dolu gelir: değişmeden kaydetmek bugüne ölçüm yazmaz. */
      const w = numOr(get('p-weight'));
      if(w && w !== (once && once.kg)) await M.saveVitals(U.todayISO(), { weight:w });
      UI.toast(yz('spi.family.profil-kaydedildi'));
      SP.App.render();
    },
    async 'save-prefs'(){
      const size = (document.getElementById('pref-size') || {}).value;
      await M.savePrefs({ householdSize:Math.max(1, Number(size) || 1) });
      UI.toast(yz('spi.family.kaydedildi'));
      SP.App.render();
    },
    async 'add-profile'(){
      UI.sheet({
        title:yz('spi.family.profil-ekle'), subtitle:yz('spi.family.aile-bireyi-ya-da-ikinci'),
        body:String(K.Stack([
          K.Field({ label:yz('spi.family.ad'), input:K.Input({ id:'np-name', placeholder:yz('spi.family.ornek-ayse') }) }),
          K.Field({ label:yz('spi.family.cinsiyet'), input:K.Select({ id:'np-sex', value:'', options:[{ value:'', label:yz('spi.family.sec') },
            { value:'female', label:yz('spi.family.kadin') }, { value:'male', label:yz('spi.family.erkek') }] }) }),
          K.Field({ label:yz('spi.family.dogum-yili'),
            input:K.Input({ id:'np-birth', type:'number', numeric:true, min:1900, max:2026 }) }),
          K.Notice({ tone:'info', body:yz('spi.family.profil-eklendikten-sonra-ona')
            + 'girmen gerekir. Eksik profil porsiyon paylaştırmasına girmez.' }),
        ])),
        footer:String(html`${K.Button({ label:yz('spi.family.vazgec'), act:'sheet-close' })}
          ${K.Button({ label:yz('spi.family.ekle'), tone:'primary', act:'save-new-profile' })}`),
      });
    },
    async 'save-new-profile'(){
      const name = (document.getElementById('np-name') || {}).value || '';
      if(!name.trim()){ UI.toast(yz('spi.family.ad-gerekli')); return; }
      const res = M.addHouseholdMember(name.trim(), {
        sex:(document.getElementById('np-sex') || {}).value,
        birthYear:Number((document.getElementById('np-birth') || {}).value) || null,
      });
      if(!res.ok){ UI.toast(res.error); return; }
      UI.closeSheet();
      UI.toast(yz('spi.family.profil-eklendi'));
      SP.App.render();
    },
    async 'switch-profile'(el){
      const id = el.dataset.id;
      UI.confirmSheet(yz('spi.family.profili-degistir'),
        yz('spi.family.sayfa-yeniden-yuklenir-ve-bu'),
        () => M.switchProfile(id), false, yz('spi.family.profile-gec'));
    },
    async 'remove-profile'(el){
      const id = el.dataset.id;
      UI.confirmSheet(yz('spi.family.listeden-cikar'),
        yz('spi.family.profil-listeden-cikar-ama-ve')
        + yz('spi.family.ayni-adla-yeniden-eklersen-v'),
        async () => {
          const res = M.removeHouseholdMember(id);
          UI.closeSheet();
          UI.toast(res.ok ? yz('spi.family.listeden-cikarildi') : res.error);
          SP.App.render();
        }, false, yz('spi.family.listeden-cikar'));
    },
  };

  return {
    id:'family',
    title:yz('spi.family.hane'),
    headline(){
      const t = SP.Nutri.targets();
      if(!t.ok) return yz('spi.family.profil-eksik');
      const list = M.householdList();
      return list.length > 1 ? list.length + ' kişilik hane.' : yz('spi.family.profil-hazir');
    },
    lede(){
      const t = SP.Nutri.targets();
      if(!t.ok) return yz('spi.family.kilo-boy-dogum-yili-ve')
        + 'kendiliğinden hesaplanır. Bunlar olmadan hiçbir sayı tahmin edilmez.';
      return yz('spi.family.hedefler-gorunum-ve-hane-uye')
        + 'temasını ve hedefini taşır.';
    },
    subtitle(){
      const list = M.householdList();
      const t = SP.Nutri.targets();
      return list.length + ' profil · ' + (t.ok ? 'hedefler hazır' : 'profil eksik');
    },
    actions(){ return ''; },
    render, handle, change,
  };
})();
