/* Rehber ve ayarlar.

   Dört sekme: kullanım, model ayarları, veri (yedek) ve sınırlar.
   Sınırlar sekmesi süs değildir: sistemin ne yapmayacağı, verinin nereye
   gittiği ve kırmızı bayrak protokolü orada açıkça yazar. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.guide = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  const TABS = [
    { id:'kullanim', label:'Kullanım', icon:'guide' },
    { id:'model',    label:'Model',    icon:'zap' },
    { id:'veri',     label:'Veri',     icon:'layers' },
    { id:'sinir',    label:'Sınırlar', icon:'shield' },
  ];

  /* ------------------------------------------------------------ kullanim */

  function howCard(){
    const rows = [
      ['Öğün girmek', 'Öğünler ekranında tek satır yaz: «1 tabak etli kuru fasulye, 1 bardak ayran». '
        + 'Ev ölçüsü tanınır ve gramaj tahmin olarak işaretlenir.'],
      ['Tahlil girmek', 'Tahliller → Rapor yapıştır. Laboratuvar metnini olduğu gibi yapıştır; '
        + 'eşleşen değerler listelenir, eşleşmeyen satırlar da gösterilir.'],
      ['Günlük ölçüm', 'Günlük ölçüm ekranında uyku, nabız ve hissettiğin hâl. '
        + 'Hepsi zorunlu değil: eksik girdi sıfır sayılmaz.'],
      ['Antrenman', 'Hareket ekranı günün yük emrini verir. Emri toparlanma belirler, istek değil.'],
      ['Sepet', 'Sepet ekranına haftalık alışverişi gir. Fiyatı kendi fişinden düzeltince '
        + 'hesap tahminden ölçüme geçer.'],
      ['Ofis', 'Beş ajan kendi alanına bakar. Danışma ekranından birine doğrudan soru sorabilirsin.'],
    ];
    return K.Card({ title:'Nasıl kullanılır', body:K.Table({ tight:true,
      headers:['İş', 'Yol'], rows:rows.map(r => [html`<b>${r[0]}</b>`, html`<span class="small">${r[1]}</span>`]) }) });
  }

  function moduleCard(){
    return K.Card({
      title:'Beş modül',
      body:html`<div class="list">${map(SP.AGENTS, a => html`
        <div class="listitem">
          ${P.avatar(a.id, 'sm')}
          <div class="grow">
            <b class="small">${a.title} — ${a.name}</b>
            <div class="tiny dim">${a.scope}</div>
            <div class="tiny dim">Bakmaz: ${a.notScope}</div>
          </div>
        </div>`)}</div>`,
    });
  }

  function precedenceCard(){
    return K.Card({
      title:'Öncelik sırası', hint:'office',
      sub:'Üstteki alttakini her zaman yener',
      body:K.Table({ tight:true, headers:['Sıra', 'Kural', 'Neden'],
        rows:SP.PRECEDENCE.map(p => [String(p.rank), html`<b>${p.label}</b>`,
          html`<span class="small">${p.note}</span>`]) }),
    });
  }

  /* --------------------------------------------------------------- model */

  function modelCard(){
    const s = SP.Office.settings();
    const provider = SP.PROVIDERS[s.provider];
    const models = provider ? provider.models : [];
    return K.Card({
      title:'Model ayarları', hint:'no-model',
      sub:'Ofis modelsiz de çalışır',
      badge:SP.LLM.ready({ provider:s.provider, model:s.model })
        ? K.Badge({ label:'hazır', tone:'ok' }) : K.Badge({ label:'kapalı', tone:'muted' }),
      body:html`
        ${K.Notice({ tone:'info', body:SP.GROUNDING.noModel + ' ' + SP.GROUNDING.authority })}
        <div class="grid-form mt-12">
          ${K.Field({ label:'Sağlayıcı',
            input:K.Select({ id:'m-provider', value:s.provider, change:'pick-provider',
              options:Object.keys(SP.PROVIDERS).map(id => ({ value:id, label:SP.PROVIDERS[id].label })) }) })}
          ${K.Field({ label:'Model',
            input:K.Select({ id:'m-model', value:s.model,
              options:models.map(m => ({ value:m.id, label:m.label })) }) })}
        </div>
        ${when(provider && provider.note, () => html`<p class="small muted mt-8">${provider.note}</p>`)}
        ${when(provider && provider.needsKey, () => html`<div class="mt-12">
          ${K.Field({ label:'API anahtarı', hint:provider.keyHint || '',
            input:K.Input({ id:'m-key', type:'password',
              placeholder:SP.LLM.getKeys(provider.id).length
                ? SP.LLM.maskKeys(provider.id).join(', ') : 'anahtar yapıştır' }) })}
          <p class="small muted mt-4">Anahtar yalnızca bu tarayıcıda, uygulama verisinden ayrı bir
            anahtarda durur. Yedeğe girmez, buluta gitmez, modele gönderilmez.</p>
        </div>`)}`,
      foot:html`${K.Button({ label:'Kaydet', size:'sm', tone:'primary', act:'save-model' })}
        ${K.Button({ label:'Bağlantıyı dene', size:'sm', act:'test-model' })}`,
    });
  }

  function quotaCard(){
    const s = SP.Office.settings();
    const st = SP.Quota.status({ provider:s.provider, model:s.model });
    if(!st) return null;
    return K.Card({
      title:'Kullanım hakkı',
      body:K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
        ['Son dakikada', String(st.lastMinute)],
        ['Bugün kullanılan', String(st.usedToday)],
        ['Bugün kalan', st.remainingToday == null ? 'sınırsız' : String(st.remainingToday)],
      ] }),
      foot:html`<span class="small dim">Ofis günde bir brifing, toplantı başına beş çağrı harcar.</span>`,
    });
  }

  /* ---------------------------------------------------------------- veri */

  function dataCard(){
    const f = M.dataFootprint();
    const age = M.backupAgeDays();
    return K.Card({
      title:'Veri ve yedek', hint:'backup',
      badge:M.backupDue() ? K.Badge({ label:'yedek gerekiyor', tone:'warn' })
        : K.Badge({ label:'yedek güncel', tone:'ok' }),
      body:html`
        ${K.Table({ tight:true, headers:['Kayıt', { label:'Adet', num:true }], rows:[
          ['Tahlil oturumu', String(f.labs)],
          ['Ölçüm günü', String(f.vitalDays)],
          ['Öğün günü', String(f.mealDays)],
          ['Antrenman', String(f.workouts)],
          ['Kapladığı alan', U.fmtNum(Math.round(f.bytes / 1024)) + ' KB · %' + f.pct],
        ] })}
        ${when(f.near, () => K.Notice({ tone:'warn', class:'mt-10',
          body:'Tarayıcı depolama alanının %' + f.pct + '\'i dolu. Yedek al ve eski kayıtları temizle.' }))}
        ${K.Notice({ tone:'info', class:'mt-10',
          body:age == null ? 'Henüz yedek alınmadı.' : 'Son yedek ' + age + ' gün önce.' })}`,
      foot:html`${K.Button({ label:'Yedek indir', size:'sm', tone:'primary', act:'backup' })}
        ${K.Button({ label:'Yedek yükle', size:'sm', act:'restore' })}
        ${K.Button({ label:'Bütün veriyi sil', size:'sm', tone:'danger', act:'wipe' })}`,
    });
  }

  function storageCard(){
    const h = SP.Store.health();
    return K.Card({
      title:'Kayıt durumu',
      body:K.Table({ tight:true, headers:['Alan', 'Durum'], rows:[
        ['Kip', h.mode === 'cloud' ? 'hesaba bağlı kopya açık' : 'bu cihaz'],
        ['Bu cihaz', h.local === 'ok' ? K.Badge({ label:'çalışıyor', tone:'ok' })
          : K.Badge({ label:'hata', tone:'danger' })],
        ['Bulut', h.cloud === 'ok' ? K.Badge({ label:'çalışıyor', tone:'ok' })
          : h.cloud === 'off' ? K.Badge({ label:'kapalı', tone:'muted' })
          : K.Badge({ label:'hata', tone:'danger' })],
        ['Profil anahtarı', M.activeProfileId()],
      ] }),
    });
  }

  /* -------------------------------------------------------------- sinirlar */

  function clinicalCard(){
    return K.Card({
      title:'Klinik sınır',
      body:html`
        ${K.Notice({ tone:'warn', body:SP.CLINICAL.disclaimer })}
        <h3 class="section-h mt-12">Sistemin asla yapmayacağı şeyler</h3>
        <div class="list">${map(SP.CLINICAL.never, n => html`
          <div class="listitem"><div class="grow"><b class="small">${n.label}</b>
            <div class="tiny dim">${n.note}</div></div></div>`)}</div>
        <p class="small muted mt-10">${SP.CLINICAL.supplement}</p>`,
    });
  }

  function redFlagCard(){
    return K.Card({
      title:'Kırmızı bayrak protokolü', hint:'red-flag',
      body:html`
        <p class="small">${SP.RED_FLAGS.lead}</p>
        <h3 class="section-h mt-12">Birden fazla ölçümle tetiklenen örüntüler</h3>
        ${K.Table({ tight:true, headers:['Örüntü', 'Ne demek'],
          rows:SP.RED_FLAGS.patterns.map(p => [html`<b>${p.label}</b>`,
            html`<span class="small">${p.detail}</span>`]) })}
        <p class="small muted mt-10">Tek ölçümle tetiklenen eşikler her biyobelirtecin kendi
          tanımındadır ve Tahliller ekranında görülebilir. Bayrak
          ${SP.RED_FLAGS.window} gün açık kalır; kapansa da kayıtta durur.</p>`,
    });
  }

  function privacyCard(){
    return K.Card({
      title:'Veri mahremiyeti', hint:'privacy',
      body:K.Table({ tight:true, headers:['Alan', 'Kural'], rows:[
        ['Saklama', SP.PRIVACY.storage],
        ['Model eğitimi', SP.PRIVACY.training],
        ['Modele giden', SP.PRIVACY.model],
        ['Yedek dosyası', SP.PRIVACY.export],
      ] }),
    });
  }

  function groundingCard(){
    return K.Card({
      title:'Halüsinasyon engeli', hint:'grounding',
      body:html`
        ${K.Table({ tight:true, headers:['Alan', 'Kural'], rows:[
          ['Otorite', SP.GROUNDING.authority],
          ['Karar', SP.GROUNDING.decision],
          ['Kaynak', SP.GROUNDING.sources],
          ['Model yoksa', SP.GROUNDING.noModel],
        ] })}
        <h3 class="section-h mt-12">Çıktı denetimi</h3>
        <p class="small muted">Model çıktısı basılmadan önce aşağıdaki desenlere karşı denetlenir.
          Bir ihlal bulunursa çıktı basılmaz; yerine kural motorunun cümlesi geçer.</p>
        ${K.Table({ tight:true, headers:['Denetim', 'Ne arar'],
          rows:SP.GROUNDING.banned.map(b => [html`<b>${b.why}</b>`,
            html`<code class="tiny">${String(b.re)}</code>`]) })}`,
    });
  }

  /* --------------------------------------------------------------- ekran */

  async function render(){
    const tab = S.ui.guideTab;
    const tabs = K.Span(12, K.Subtabs({ items:TABS, value:tab, act:'guide-tab', aria:'Rehber görünümü' }));

    if(tab === 'model'){
      return String(K.Grid([tabs, K.Span(7, modelCard()), K.Span(5, quotaCard()),
        K.Span(12, raw(UI.rail(['no-model', 'grounding', 'privacy'])))]));
    }
    if(tab === 'veri'){
      return String(K.Grid([tabs, K.Span(7, dataCard()), K.Span(5, storageCard()),
        K.Span(12, raw(UI.rail(['backup', 'privacy', 'profiles'])))]));
    }
    if(tab === 'sinir'){
      return String(K.Grid([tabs,
        K.Span(7, K.Stack([clinicalCard(), redFlagCard()])),
        K.Span(5, K.Stack([privacyCard(), groundingCard()])),
        K.Span(12, raw(UI.rail(['red-flag', 'grounding', 'privacy', 'certainty'])))]));
    }
    return String(K.Grid([tabs,
      K.Span(7, K.Stack([howCard(), moduleCard()])),
      K.Span(5, K.Stack([precedenceCard(),
        K.Card({ title:'Asgari gün', hint:'minimum-day',
          body:html`<ul class="bullets small muted">
            <li>${SP.MINIMUM_DAY.protein}</li><li>${SP.MINIMUM_DAY.water}</li>
            <li>${SP.MINIMUM_DAY.move}</li><li>${SP.MINIMUM_DAY.sleep}</li></ul>
            <p class="small mt-8">${SP.MINIMUM_DAY.note}</p>` }),
      ])),
      K.Span(12, raw(UI.rail(['next-action', 'minimum-day', 'certainty', 'office']))),
    ]));
  }

  const handle = {
    async 'guide-tab'(el){ S.ui.guideTab = el.dataset.tab; SP.App.render(); },
    async 'save-model'(){
      const provider = (document.getElementById('m-provider') || {}).value;
      const model = (document.getElementById('m-model') || {}).value;
      const key = (document.getElementById('m-key') || {}).value;
      if(key && key.trim()) SP.LLM.addKey(provider, key.trim());
      await SP.Office.saveSettings({ provider, model });
      UI.toast('Kaydedildi');
      SP.App.render();
    },
    async 'test-model'(){
      const s = SP.Office.settings();
      UI.toast('Deneniyor…');
      try{
        const res = await SP.LLM.test({ provider:s.provider, model:s.model });
        UI.toast(res && res.ok !== false ? 'Bağlantı çalışıyor' : 'Bağlantı kurulamadı');
      }catch(e){
        UI.toast('Hata: ' + (SP.LLM.errorText ? SP.LLM.errorText(e) : String(e && e.message || e)));
      }
      SP.App.render();
    },
    async backup(){
      const data = SP.Store.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'spi-yedek-' + U.todayISO() + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      await M.markBackup();
      UI.toast('Yedek indirildi');
      SP.App.render();
    },
    async restore(){
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async () => {
        const file = input.files && input.files[0];
        if(!file) return;
        try{
          const text = await file.text();
          const meta = await SP.Store.importAll(JSON.parse(text));
          UI.toast('Yedek yüklendi (şema ' + meta.schemaVersion + ') — sayfa yenileniyor');
          setTimeout(() => location.reload(), 900);
        }catch(e){
          UI.toast(e && e.message ? e.message : 'Yedek okunamadı');
        }
      };
      input.click();
    },
    async wipe(){
      UI.confirmSheet('Bütün veriyi sil',
        'Bu profildeki tahliller, ölçümler, öğünler ve antrenmanlar silinir. '
        + 'Geri alınamaz. Önce yedek al.',
        async () => {
          await SP.Store.clear();
          UI.closeSheet();
          location.reload();
        }, true);
    },
  };

  const change = {
    async 'pick-provider'(el){
      const p = SP.PROVIDERS[el.value];
      const first = p && p.models && p.models[0] ? p.models[0].id : '';
      await SP.Office.saveSettings({ provider:el.value, model:first });
      SP.App.render();
    },
  };

  return {
    id:'guide',
    title:'Rehber',
    subtitle(){
      const s = SP.Office.settings();
      return SP.LLM.ready({ provider:s.provider, model:s.model })
        ? 'Model açık · ' + (SP.PROVIDERS[s.provider] || {}).label
        : 'Model kapalı · kural motoru çalışıyor';
    },
    actions(){ return ''; },
    render, handle, change,
  };
})();
