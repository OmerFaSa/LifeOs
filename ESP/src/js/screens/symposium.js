/* Sempozyum — tez, destek, itiraz ve safsata denetimi.

   Dört sekme: Açık · Kapalı · Ekle · Metinler.

   Sistemin buradaki tek iddiası şu: bir tez ancak cevaplanmamış itirazı
   kalmadığında kapanır. Bunu model değil kural motoru zorlar (Model.
   argumentOpen) — bir tezi «kapandı» diye işaretlemek, itirazı cevaplamanın
   yerine geçmez.

   Socrates cevap yazmaz, soru sorar. Model kapalıyken de sorar: sorular
   data/canon.js içindeki kalıplardan gelir ve kural motorunun kendi
   çıktısıdır. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.symposium = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map } = ESP.h;
  const K = ESP.C;

  const TABS = [
    { id:'acik',     label:'Açık' },
    { id:'kapali',   label:'Kapalı' },
    { id:'ekle',     label:'Ekle' },
    { id:'metinler', label:'Metinler' },
    { id:'deneyler', label:'Deneyler' },
    { id:'ogren',     label:'Öğren' },
  ];

  /* --------------------------------------------------------------- deneyler

     Bir tez yazmak ile bir tezi SINAMAK ayrı işlerdir. Düşünce deneyi
     sınamanın en ucuz aracıdır: laboratuvar gerektirmez, yalnızca dürüstlük
     ister.

     Deneylerin «doğru cevabı» yazılmadı ve bu bilinçli: cevabı veren bir
     liste, deneyi bir bilgi yarışması sorusuna çevirir. Yazılan tek şey,
     deneyin hangi AYRIMI zorladığı. */
  function experimentRows(){
    const alan = S.ui.expField || 'all';
    const list = (ESP.EXPERIMENTS || [])
      .filter(x => alan === 'all' || x.field === alan);

    return [
      K.Entry({
        label:'DÜŞÜNCE DENEYLERİ', hint:'experiment',
        meta:list.length + ' deney',
        note:'Deney bir tezi sınar. Tezini sarsmayan bir deney seçmek, '
           + 'sınamadan geçmiş saymaktır.',
        action:K.Select({ id:'exp-field', value:alan, change:'exp-field',
          aria:'Alan süzgeci',
          options:[{ value:'all', label:'Bütün alanlar' }]
            .concat(ESP.EXPERIMENT_FIELDS.map(f => ({ value:f.id, label:f.label }))) }),
        wide:true,
        body:html`${map(list, x => html`
          <div class="exprow">
            <div class="exprow__head">
              <b>${x.label}</b>
              ${K.Badge({ label:(ESP.EXPERIMENT_FIELDS.filter(f => f.id === x.field)[0]
                || {}).label || x.field, tone:'muted', icon:false })}
              ${K.Button({ label:'Tez yap', size:'sm', act:'exp-to-thesis',
                data:{ 'data-id':x.id } })}
            </div>
            <p>${x.setup}</p>
            <p class="small muted"><b>Zorladığı ayrım:</b> ${x.tests}</p>
          </div>`)}`,
      }),

      K.Entry({
        label:'ARGÜMAN ALIŞTIRMALARI', hint:'argument-drill',
        meta:ESP.ARGUMENT_DRILLS.length + ' alıştırma',
        note:'Safsata denetimi metinde desen arar; bunlar egzersizdir.',
        wide:true,
        body:K.Table({ tight:true, headers:['Alıştırma', 'Ne yapılır', 'Neden'],
          rows:ESP.ARGUMENT_DRILLS.map(d => [d.label, d.task, d.note]) }),
      }),
    ];
  }

  /* ---------------------------------------------------------------- tez kartı */

  function argRow(a){
    const acikItiraz = (a.objections || []).filter(o => !o.answered);
    const safsata = ESP.Intellect.checkFallacies(
      [a.thesis].concat(a.supports || []).join(' '));
    const yas = U.diffDays((a.updatedAt || a.createdAt || '').slice(0, 10), U.todayISO());

    return K.Entry({
      label:a.status === 'open' ? 'AÇIK TEZ' : 'KAPANDI',
      meta:U.fmtShort((a.updatedAt || a.createdAt || '').slice(0, 10))
        + (yas >= 14 && a.status === 'open' ? ' · ' + yas + ' gündür sessiz' : ''),
      note:acikItiraz.length
        ? acikItiraz.length + ' itiraz cevaplanmadı; tez bu yüzden kapanamaz.'
        : (a.status === 'open' ? 'Cevaplanmamış itiraz yok — kapatılabilir.' : ''),
      action:html`${when(a.status === 'open' && !acikItiraz.length,
          () => K.Button({ label:'Kapat', size:'sm', tone:'primary', act:'close-arg',
            data:{ 'data-id':a.id } }))}
        ${K.Button({ label:'Sil', size:'sm', act:'del-arg', data:{ 'data-id':a.id } })}`,
      wide:true,
      body:html`
        <p class="thesis">${a.thesis}</p>

        ${when((a.concepts || []).length, () => html`<div class="row wrap mt-8">
          ${map(a.concepts, c => K.Chip({ label:(ESP.CONCEPT_BY_ID[c] || {}).label || c }))}
        </div>`)}

        <div class="argcols mt-12">
          <div class="argcol">
            <p class="argcol__h">Destek</p>
            ${(a.supports || []).length
              ? html`<ul class="argcol__list">${map(a.supports, s => html`<li>${s}</li>`)}</ul>`
              : html`<p class="small muted">Henüz destek yazılmadı.</p>`}
            <div class="row mt-8">
              ${K.Input({ id:'sup-' + a.id, placeholder:'Destek ekle…', size:'sm',
                aria:'Destek ekle' })}
              ${K.Button({ label:'Ekle', size:'sm', act:'add-support', data:{ 'data-id':a.id } })}
            </div>
          </div>

          <div class="argcol">
            <p class="argcol__h">İtiraz</p>
            ${(a.objections || []).length
              ? html`<ul class="argcol__list">${map(a.objections, o => html`
                  <li class="${o.answered ? 'is-answered' : ''}">
                    <span>${o.text}</span>
                    ${o.answered
                      ? html`<em class="argcol__ans">${o.answer}</em>`
                      : html`<div class="row mt-4">
                          ${K.Input({ id:'ans-' + o.id, placeholder:'Cevabın…', size:'sm',
                            aria:'İtiraza cevabın' })}
                          ${K.Button({ label:'Cevapla', size:'sm', act:'answer-obj',
                            data:{ 'data-id':a.id, 'data-obj':o.id } })}
                        </div>`}
                  </li>`)}</ul>`
              : html`<p class="small muted">İtiraz yok. En güçlü karşı tezi sen yazmazsan
                  tez sınanmamış kalır.</p>`}
            <div class="row mt-8">
              ${K.Input({ id:'obj-' + a.id, placeholder:'İtiraz ekle…', size:'sm',
                aria:'İtiraz ekle' })}
              ${K.Button({ label:'Ekle', size:'sm', act:'add-obj', data:{ 'data-id':a.id } })}
            </div>
          </div>
        </div>

        ${when(safsata.length, () => K.Notice({ tone:'info', title:'Safsata denetimi',
          body:safsata.map(f => '<b>' + f.label + '</b> — ' + f.note).join('<br/>')
            + '<br/><br/>Bu bir yargı değil bir bulgudur: kalıbın yakalanması '
            + 'argümanın yanlış olduğunu göstermez, bakmaya değer olduğunu gösterir.' }))}

        <div class="row mt-12">
          ${K.Button({ label:'Socrates\'e sor', act:'ask-socrates', data:{ 'data-id':a.id } })}
          ${K.Button({ label:'Rastgele soru', size:'sm', act:'socratic-q',
            data:{ 'data-id':a.id } })}
        </div>
        ${when(S.ui.socraticFor === a.id && S.ui.socraticQ,
          () => K.Notice({ tone:'info', title:'Soru', body:S.ui.socraticQ }))}`,
    });
  }

  /* ------------------------------------------------------------------ sekmeler */

  function openRows(){
    const rows = ESP.Intellect.openArguments();
    if(!rows.length){
      return [K.Entry({ label:'AÇIK TEZ', meta:'yok',
        body:K.Empty({ text:'Açık tez yok. Tek cümlelik bir tez yazmak yeterli; '
          + 'gerisini itirazlar açar.',
          action:K.Button({ label:'Tez yaz', tone:'primary', act:'tab-ekle' }) }) })];
    }
    return rows.map(argRow);
  }

  function closedRows(){
    const rows = (S.args || []).filter(a => a.status === 'closed');
    if(!rows.length){
      return [K.Entry({ label:'KAPANAN TEZ', meta:'yok',
        body:K.Empty({ text:'Henüz kapanan tez yok. Bir tez ancak cevaplanmamış '
          + 'itirazı kalmadığında kapanır.' }) })];
    }
    return rows.map(argRow);
  }

  function addRows(){
    const res = S.ui.argParsed;
    return [
      K.Entry({
        label:'YENİ TEZ', hint:'argument',
        meta:'tek cümle yeter',
        note:'Uzun deneme gerekmez. «X doğrudur çünkü Y. Ama Z olabilir.» yazarsan '
           + 'tez, destek ve itiraz ayrıştırılır — anlaşılmayan cümle atılmaz, sorulur.',
        body:html`
          ${K.Textarea({ id:'arg-text', rows:4, aria:'Tez metni',
            placeholder:'Özgürlük yalnızca seçenek çokluğu değildir çünkü seçenekleri '
              + 'değerlendirecek ölçüt de gerekir. Ama ölçütü kim koyar?' })}
          <div class="row mt-10">
            ${K.Button({ label:'Çöz', act:'parse-arg' })}
            ${K.Button({ label:'Olduğu gibi kaydet', tone:'primary', act:'save-arg-raw' })}
          </div>
          ${when(res, () => html`
            <div class="mt-10">
              ${K.Table({ tight:true, headers:['Parça', 'İçerik'], rows:[
                ['Tez', res.thesis || '—'],
                ['Destek', (res.supports || []).join(' · ') || '—'],
                ['İtiraz', (res.objections || []).join(' · ') || '—'],
              ] })}
              ${when(res.unmatched.length, () => K.Notice({ tone:'warn',
                title:'Nereye koyacağımı anlamadım',
                body:res.unmatched.map(u => '«' + U.esc(u.text) + '»').join('<br/>')
                  + '<br/><br/>Kaydedersen bu cümleler destek sayılır; '
                  + 'istersen metni düzenleyip yeniden çözebilirsin.' }))}
              <div class="row mt-8">
                ${K.Button({ label:'Kaydet', tone:'primary', size:'sm', act:'save-arg' })}
                ${K.Button({ label:'Vazgeç', size:'sm', act:'clear-arg' })}
              </div>
            </div>`)}`,
      }),

      K.Entry({
        label:'SOKRATİK SORULAR',
        meta:ESP.SOCRATIC.length + ' kalıp',
        note:'Model kapalıyken Socrates bu kalıplardan sorar. Kalıp olmaları '
           + 'kasıtlı: bir soru ancak teze bağlandığında işe yarar.',
        body:K.Table({ tight:true, headers:['Soru'],
          rows:ESP.SOCRATIC.map(q => [q.q]) }),
      }),
    ];
  }

  function textRows(){
    const kitaplar = (S.books || []);
    return [
      K.Entry({
        label:'KAYNAKLAR', hint:'primary-text',
        meta:kitaplar.length + ' kayıt',
        note:'Primer metin filozofun kendi metnidir; yorum ayrı tutulur. '
           + 'Sentez katsayısı yalnızca primer metinden kurulan bağları sayar.',
        wide:true,
        body:kitaplar.length
          ? K.Table({ tight:true, headers:['Eser', 'Yazar', 'Tür', 'Başlangıç', ''],
              rows:kitaplar.map(b => [
                b.title, b.author,
                b.kind === 'primary' ? 'primer' : 'yorum',
                U.fmtShort(b.startedAt),
                K.Button({ label:'Sil', size:'sm', act:'del-book', data:{ 'data-id':b.id } }),
              ]) })
          : K.Empty({ text:'Kaynak listesi boş.' }),
      }),

      K.Entry({
        label:'KANONDAN EKLE',
        meta:ESP.CANON.length + ' eser',
        note:'Yazar adının iki farklı yazımı sentez katsayısının yazar sayısını '
           + 'ikiye katlıyordu; listeden seçmek bunu kapatır.',
        body:html`
          <div class="row wrap">
            ${K.Select({ id:'canon-pick', aria:'Kanondan eser seç',
              options:ESP.CANON.map(c => ({ value:c.id,
                label:c.author + ' — ' + c.title })) })}
            ${K.Button({ label:'Ekle', tone:'primary', act:'add-canon' })}
          </div>
          <p class="small muted mt-8">Listede olmayan bir kaynağı elle de ekleyebilirsin.</p>
          <div class="cols-3 mt-10">
            ${K.Field({ label:'Eser', input:K.Input({ id:'b-title', placeholder:'Başlık' }) })}
            ${K.Field({ label:'Yazar', input:K.Input({ id:'b-author', placeholder:'Yazar' }) })}
            ${K.Field({ label:'Tür', input:K.Select({ id:'b-kind', value:'primary',
              options:[{ value:'primary', label:'Primer metin' },
                { value:'secondary', label:'Yorum' }] }) })}
          </div>
          ${K.Button({ label:'Elle ekle', act:'add-book', class:'mt-10' })}`,
      }),
    ];
  }

  /* Konu haritası — bu bölümde nelerin çalışılacağı.

     İşaretler beyandır ve öyle etiketlenir; hiçbir kapıyı açmaz. */
  function topicRows(){
    const ozet = ESP.Lesson.topicSummary('philo');
    return [
      K.Entry({
        label:'KONULAR', hint:'topic',
        meta:ozet.topics + ' konu · ' + ozet.items + ' madde',
        note:'Konu listesi bir müfredattır, bir ölçüm değil. İşaretlediklerin '
           + '«beyan» olarak durur: hiçbir kapıyı açmaz, kademeyi değiştirmez.',
        wide:true,
        body:ESP.Parts.topics('philo'),
      }),
    ];
  }

  /* ------------------------------------------------------------------ çizim */

  function render(){
    const tab = S.ui.philoTab || 'acik';
    const rows = tab === 'kapali' ? closedRows()
      : tab === 'ekle' ? addRows()
      : tab === 'metinler' ? textRows()
      : tab === 'deneyler' ? experimentRows()
      : tab === 'ogren' ? topicRows()
      : openRows();

    return K.Grid(html`
      ${K.Span(12, K.Toolbar({
        tabs:K.Subtabs({ value:tab, act:'philo-tab', aria:'Sempozyum sekmeleri',
          items:TABS.map(t => Object.assign({}, t,
            t.id === 'acik' ? { count:ESP.Intellect.openArguments().length || null } : {})) }),
      }))}
      ${K.Span(12, K.Ledger(() => [ESP.Parts.desk('philo')]
        .concat(rows)))}`);
  }

  function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  const handle = {
    async 'philo-tab'(el){ S.ui.philoTab = el.dataset.tab; ESP.App.render(); },
    async 'tab-ekle'(){ S.ui.philoTab = 'ekle'; ESP.App.render(); },

    /* Deneyi teze çevirmek: deneyin kurgusu tezin YERINE geçmez, tezi
       kullanıcı yazar. Sistem yalnızca boş tezi açar ve deneyi bağlam
       olarak taşır — cevabı uydurmak, argümanı kullanıcının elinden
       almak olurdu. */
    async 'exp-to-thesis'(el){
      const x = (ESP.EXPERIMENTS || []).filter(e => e.id === el.dataset.id)[0];
      if(!x) return;
      const a = await M.saveArgument(M.newArgument({
        thesis:'',
        objections:[{ id:U.uid('o'), text:x.setup, answered:false, answer:'' }],
        concepts:[],
      }));
      S.ui.argOpen = a.id;
      S.ui.philoTab = 'acik';
      ESP.Memo.bitir();
      ESP.UI.toast('Deney bir itiraz olarak açıldı — tezi sen yaz');
      ESP.App.render();
    },

    async 'parse-arg'(){
      const res = ESP.Parse.parseArgument(val('arg-text'));
      if(!res.thesis){ ESP.UI.toast('Tez bulunamadı'); return; }
      S.ui.argParsed = res;
      ESP.App.render();
    },

    async 'save-arg'(){
      const res = S.ui.argParsed;
      if(!res) return;
      /* Anlasilmayan cumleler ATILMAZ: destek olarak kaydedilir ve kullanici
         sonradan tasiyabilir. Sessizce dusmesi kullanicinin yazdigini sandigi
         ama sistemde olmayan bir metin demektir. */
      const destekler = (res.supports || []).concat((res.unmatched || []).map(u => u.text));
      await M.saveArgument(M.newArgument({
        thesis:res.thesis,
        supports:destekler,
        objections:(res.objections || []).map(t => ({ id:U.uid('o'), text:t, answered:false })),
        concepts:ESP.Parse.extractConcepts(res.thesis + ' ' + destekler.join(' ')).map(c => c.id),
      }));
      S.ui.argParsed = null;
      S.ui.philoTab = 'acik';
      ESP.Memo.bitir();
      ESP.UI.toast('Tez kaydedildi');
      ESP.App.render();
    },

    async 'save-arg-raw'(){
      const t = val('arg-text');
      if(!t){ ESP.UI.toast('Metin boş'); return; }
      await M.saveArgument(M.newArgument({ thesis:t,
        concepts:ESP.Parse.extractConcepts(t).map(c => c.id) }));
      S.ui.philoTab = 'acik';
      ESP.Memo.bitir();
      ESP.UI.toast('Tez kaydedildi');
      ESP.App.render();
    },

    async 'clear-arg'(){ S.ui.argParsed = null; ESP.App.render(); },

    async 'add-support'(el){
      const a = S.args.find(x => x.id === el.dataset.id);
      const t = val('sup-' + el.dataset.id);
      if(!a || !t) return;
      a.supports = (a.supports || []).concat([t]);
      await M.saveArgument(a);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'add-obj'(el){
      const a = S.args.find(x => x.id === el.dataset.id);
      const t = val('obj-' + el.dataset.id);
      if(!a || !t) return;
      a.objections = (a.objections || []).concat([{ id:U.uid('o'), text:t, answered:false }]);
      a.status = 'open';
      await M.saveArgument(a);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'answer-obj'(el){
      const a = S.args.find(x => x.id === el.dataset.id);
      if(!a) return;
      const o = (a.objections || []).find(x => x.id === el.dataset.obj);
      const t = val('ans-' + el.dataset.obj);
      if(!o || !t) return;
      o.answered = true; o.answer = t;
      await M.saveArgument(a);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'close-arg'(el){
      const a = S.args.find(x => x.id === el.dataset.id);
      if(!a) return;
      if(M.argumentOpen(a)){
        ESP.UI.toast('Cevaplanmamış itiraz varken tez kapanmaz');
        return;
      }
      a.status = 'closed';
      await M.saveArgument(a);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'del-arg'(el){
      await M.deleteArgument(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'socratic-q'(el){
      const q = ESP.SOCRATIC[Math.floor(Math.random() * ESP.SOCRATIC.length)];
      S.ui.socraticFor = el.dataset.id;
      S.ui.socraticQ = q.q;
      ESP.App.render();
    },

    /* Tezin METNI burada gider — brifingde degil.

       Fark kasitlidir: brifing her cagride otomatik gider ve icinde yalnizca
       olcum vardir. Tez metni yalnizca kullanici bu dugmeye bastiginda,
       SORUNUN icinde gider. Acikca paylasilan parca. */
    async 'ask-socrates'(el){
      const a = S.args.find(x => x.id === el.dataset.id);
      if(!a) return;
      S.ui.officeAgent = 'socrates';
      const soru = 'Tezim: «' + a.thesis + '»'
        + ((a.supports || []).length ? '\nDesteklerim: ' + a.supports.join(' · ') : '')
        + ((a.objections || []).length ? '\nİtirazlar: '
            + a.objections.map(o => o.text + (o.answered ? ' (cevapladım)' : ' (açık)')).join(' · ') : '')
        + '\nBana tek bir soru sor.';
      ESP.App.go('team');
      setTimeout(() => {
        const inp = document.getElementById('chat-input');
        if(inp){ inp.value = soru; inp.focus(); }
      }, 200);
    },

    async 'add-canon'(){
      const id = val('canon-pick');
      const c = ESP.CANON_BY_ID[id];
      if(!c) return;
      await M.saveBook(M.newBook({ title:c.title, author:c.author, kind:c.kind }));
      ESP.Memo.bitir();
      ESP.UI.toast(c.title + ' eklendi');
      ESP.App.render();
    },

    async 'add-book'(){
      const t = val('b-title'), a = val('b-author');
      if(!t){ ESP.UI.toast('Eser adı gerekir'); return; }
      await M.saveBook(M.newBook({ title:t, author:a, kind:val('b-kind') || 'primary' }));
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'del-book'(el){
      await M.deleteBook(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },
  };

  const change = {
    async 'exp-field'(el){ S.ui.expField = el.value; ESP.App.render(); },
  };

  return {
    id:'symposium',
    title:'Sempozyum',
    headline(){
      const acik = ESP.Intellect.openArguments();
      const tikanan = ESP.Intellect.stalledArguments();
      if(!(S.args || []).length) return 'Henüz tez yok.';
      if(tikanan.length) return tikanan.length + ' tez 14 günden uzun süredir sessiz.';
      const itiraz = acik.reduce((a, x) => a + (x.objections || []).filter(o => !o.answered).length, 0);
      if(itiraz) return itiraz + ' itiraz cevaplanmayı bekliyor.';
      return acik.length + ' tez açık.';
    },
    lede(){
      return 'Bir tez ancak cevaplanmamış itirazı kalmadığında kapanır. '
           + 'Socrates cevap yazmaz, soru sorar.';
    },
    stats(){
      const acik = ESP.Intellect.openArguments();
      const kapali = (S.args || []).filter(a => a.status === 'closed');
      const itiraz = acik.reduce((a, x) => a + (x.objections || []).filter(o => !o.answered).length, 0);
      const primer = (S.books || []).filter(b => b.kind === 'primary');
      return [
        { value:String(acik.length), label:'açık tez' },
        { value:String(itiraz), label:'açık itiraz' },
        { value:String(kapali.length), label:'kapandı' },
        { value:String(primer.length), label:'primer metin' },
      ];
    },
    subtitle(){ return (S.args || []).length + ' tez'; },
    actions(){ return ''; },
    render, handle, change,
  };
})();
