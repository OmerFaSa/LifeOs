/* Hane — profiller ve kişisel hedefler.

   Her profil kendi depo anahtarında yaşar; tahlil ve ölçüm verisi profiller
   arasında karışmaz. Hane listesi yalnızca ad, rol ve temel ölçüleri taşır —
   ham sağlık verisi listeye hiç girmez.

   Profil geçişi sayfayı yeniden yükler: yarım kalmış bir yazma işleminin
   yanlış profile düşmesi böylece imkânsızdır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.family = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  function profileCard(){
    const p = S.profile;
    const t = SP.Nutri.targets();
    return K.Card({
      title:'Profilin', hint:'profiles',
      sub:p.name || 'adsız profil',
      badge:t.ok ? K.Badge({ label:'hedefler hazır', tone:'ok' })
        : K.Badge({ label:t.missing.length + ' alan eksik', tone:'warn' }),
      body:html`
        <div class="grid-form">
          ${K.Field({ label:'Ad', input:K.Input({ id:'p-name', value:p.name || '' }) })}
          ${K.Field({ label:'Doğum yılı',
            input:K.Input({ id:'p-birth', type:'number', numeric:true, min:1900, max:2026,
              value:p.birthYear || '' }) })}
          ${K.Field({ label:'Cinsiyet',
            input:K.Select({ id:'p-sex', value:p.sex, options:[
              { value:'male', label:'Erkek' }, { value:'female', label:'Kadın' }] }) })}
          ${K.Field({ label:'Boy (cm)',
            input:K.Input({ id:'p-height', type:'number', numeric:true, min:80, max:230,
              value:p.heightCm || '' }) })}
          ${K.Field({ label:'Kilo (kg)',
            input:K.Input({ id:'p-weight', type:'number', numeric:true, step:'0.1', min:20, max:250,
              value:p.weightKg || '' }) })}
          ${K.Field({ label:'Hareket düzeyi',
            input:K.Select({ id:'p-activity', value:p.activity,
              options:SP.ACTIVITY_LEVELS.map(a => ({ value:a.id, label:a.label })) }) })}
          ${K.Field({ label:'Hedef',
            input:K.Select({ id:'p-goal', value:p.goal,
              options:SP.GOALS.map(g => ({ value:g.id, label:g.label })) }) })}
        </div>
        ${when(!t.ok, () => K.Notice({ tone:'warn', class:'mt-12',
          body:'Eksik alan: ' + t.missing.join(', ') + '. Bunlar olmadan kalori ve protein '
             + 'hedefi hesaplanmaz — tahmin edilmez.' }))}`,
      foot:K.Button({ label:'Kaydet', tone:'primary', act:'save-profile' }),
    });
  }

  function targetCard(){
    const t = SP.Nutri.targets();
    if(!t.ok) return null;
    const lvl = SP.ACTIVITY_LEVELS.find(a => a.id === S.profile.activity);
    return K.Card({
      title:'Hesaplanan hedefler', hint:'macro-target',
      sub:t.goal.label,
      body:html`
        ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          ['Bazal metabolizma', U.fmtNum(t.bmr) + ' kcal'],
          ['Hareket çarpanı', '×' + U.fmtNet(SP.Nutri.activityFactor()) + (lvl ? ' — ' + lvl.note : '')],
          ['Günlük ihtiyaç', U.fmtNum(t.tdee) + ' kcal'],
          ['Hedef kalori', U.fmtNum(t.kcal) + ' kcal' + (t.goal.deficit ? ' · ' + t.goal.note : '')],
          ['Protein', t.protein.min + '–' + t.protein.max + ' g'],
          ['Yağ', t.fat.min + '–' + t.fat.max + ' g'],
          ['Karbonhidrat', t.carb.min + '–' + t.carb.max + ' g'],
          ['Lif', t.fiber + ' g'],
        ] })}
        ${when(Object.keys(t.adjustments).length, () => K.Notice({ tone:'info', class:'mt-12',
          title:'Laboratuvara göre yükseltilenler:',
          body:html`<ul class="bullets small mt-4">${map(Object.keys(t.adjustments), k => html`
            <li><b>${SP.NUTRI_BY_ID[k] ? SP.NUTRI_BY_ID[k].name : k}</b> ×${U.fmtNet(t.adjustments[k].mult)}
              — ${t.adjustments[k].why}</li>`)}</ul>` }))}
        <p class="small muted mt-10">${SP.MACRO_RULES.protein.note}</p>`,
    });
  }

  function householdCard(){
    const list = M.householdList();
    const active = M.activeProfileId();
    return K.Card({
      title:'Hanedeki profiller', hint:'profiles',
      sub:list.length + ' profil',
      body:html`
        ${K.Notice({ tone:'info', body:'Her profil kendi depo anahtarında durur. '
          + 'Profil değiştirdiğinde bütün veri seti değişir; veriler karışmaz.' })}
        <div class="list mt-12">${map(list, row => html`
          <div class="listitem">
            <div class="grow">
              <b class="small">${row.name || 'Adsız'}</b>
              ${when(row.id === active, () => K.Badge({ label:'açık', tone:'ok' }))}
              <div class="tiny dim">${row.role === 'self' ? 'birincil' : 'aile'}
                ${when(row.birthYear, () => html`· ${new Date().getFullYear() - row.birthYear} yaşında`)}
                ${when(row.seenAt, () => html`· son ${U.fmtShort(row.seenAt.slice(0, 10))}`)}</div>
            </div>
            ${when(row.id !== active, () => K.Button({ label:'Geç', size:'sm',
              act:'switch-profile', data:{ 'data-id':row.id } }))}
            ${when(row.id !== active, () => K.IconButton({ icon:'trash', size:'sm', plain:true,
              aria:'Listeden çıkar', act:'remove-profile', data:{ 'data-id':row.id } }))}
          </div>`)}</div>`,
      foot:K.Button({ label:'Profil ekle', size:'sm', tone:'primary', act:'add-profile' }),
    });
  }

  function prefCard(){
    const p = S.prefs || M.defaultPrefs();
    return K.Card({
      title:'Görünüm ve hane ayarı',
      body:html`
        <div class="grid-form">
          ${K.Field({ label:'Tema',
            input:K.Select({ id:'pref-theme', value:S.profile.theme, options:[
              { value:'system', label:'Sistem' }, { value:'light', label:'Açık' },
              { value:'dark', label:'Koyu' }] }) })}
          ${K.Field({ label:'Palet',
            input:K.Select({ id:'pref-palette', value:S.profile.palette || SP.DEFAULT_PALETTE,
              options:SP.PALETTES.map(x => ({ value:x.id, label:x.name })) }) })}
          ${K.Field({ label:'Hanedeki kişi sayısı', hint:'sepet hesabı için',
            input:K.Input({ id:'pref-size', type:'number', numeric:true, min:1, max:20,
              value:p.householdSize || 1 }) })}
        </div>`,
      foot:K.Button({ label:'Kaydet', size:'sm', tone:'primary', act:'save-prefs' }),
    });
  }

  async function render(){
    return String(K.Grid([
      K.Span(7, K.Stack([profileCard(), targetCard()])),
      K.Span(5, K.Stack([householdCard(), prefCard()])),
      K.Span(12, raw(UI.rail(['profiles', 'macro-target', 'lab-linked-food', 'privacy']))),
    ]));
  }

  const handle = {
    async 'save-profile'(){
      const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      const numOr = v => v === '' ? null : Number(String(v).replace(',', '.'));
      await M.saveProfile({
        name:get('p-name'),
        birthYear:numOr(get('p-birth')),
        sex:get('p-sex') || 'male',
        heightCm:numOr(get('p-height')),
        weightKg:numOr(get('p-weight')),
        activity:get('p-activity') || 'moderate',
        goal:get('p-goal') || 'health',
      });
      /* Kilo profilde tutulur ama gunluk olcum de ayni gun kaydini besler:
         tek yerde yazilir, iki yerde okunur diye ikisi de guncellenir. */
      const w = numOr(get('p-weight'));
      if(w) await M.saveVitals(U.todayISO(), { weight:w });
      UI.toast('Profil kaydedildi');
      SP.App.render();
    },
    async 'save-prefs'(){
      const theme = (document.getElementById('pref-theme') || {}).value;
      const palette = (document.getElementById('pref-palette') || {}).value;
      const size = (document.getElementById('pref-size') || {}).value;
      await M.saveProfile({ theme, palette });
      await M.savePrefs({ householdSize:Math.max(1, Number(size) || 1) });
      SP.App.applyTheme();
      UI.toast('Kaydedildi');
      SP.App.render();
    },
    async 'add-profile'(){
      UI.sheet({
        title:'Profil ekle', subtitle:'Aile bireyi ya da ikinci profil',
        body:String(K.Stack([
          K.Field({ label:'Ad', input:K.Input({ id:'np-name', placeholder:'Örnek: Ayşe' }) }),
          K.Field({ label:'Cinsiyet', input:K.Select({ id:'np-sex', value:'female', options:[
            { value:'female', label:'Kadın' }, { value:'male', label:'Erkek' }] }) }),
          K.Field({ label:'Doğum yılı',
            input:K.Input({ id:'np-birth', type:'number', numeric:true, min:1900, max:2026 }) }),
          K.Notice({ tone:'info', body:'Profil eklendikten sonra ona geçip kilo, boy ve hedefini '
            + 'girmen gerekir. Eksik profil porsiyon paylaştırmasına girmez.' }),
        ])),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Ekle', tone:'primary', act:'save-new-profile' })}`),
      });
    },
    async 'save-new-profile'(){
      const name = (document.getElementById('np-name') || {}).value || '';
      if(!name.trim()){ UI.toast('Ad gerekli'); return; }
      const res = M.addHouseholdMember(name.trim(), {
        sex:(document.getElementById('np-sex') || {}).value,
        birthYear:Number((document.getElementById('np-birth') || {}).value) || null,
      });
      if(!res.ok){ UI.toast(res.error); return; }
      UI.closeSheet();
      UI.toast('Profil eklendi');
      SP.App.render();
    },
    async 'switch-profile'(el){
      const id = el.dataset.id;
      UI.confirmSheet('Profili değiştir',
        'Sayfa yeniden yüklenir ve bu profilin verileri açılır. Kaydedilmemiş bir alan varsa kaybolur.',
        () => M.switchProfile(id));
    },
    async 'remove-profile'(el){
      const id = el.dataset.id;
      UI.confirmSheet('Listeden çıkar',
        'Profil listeden çıkar ama VERİSİ SİLİNMEZ; kendi anahtarında durmaya devam eder. '
        + 'Aynı adla yeniden eklersen veriler geri gelir.',
        async () => {
          const res = M.removeHouseholdMember(id);
          UI.closeSheet();
          UI.toast(res.ok ? 'Listeden çıkarıldı' : res.error);
          SP.App.render();
        });
    },
  };

  return {
    id:'family',
    title:'Hane',
    subtitle(){
      const list = M.householdList();
      const t = SP.Nutri.targets();
      return list.length + ' profil · ' + (t.ok ? 'hedefler hazır' : 'profil eksik');
    },
    actions(){ return ''; },
    render, handle,
  };
})();
