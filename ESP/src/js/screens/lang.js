/* Dil Stüdyosu — aralıklı tekrar, deste ve üretim.

   Dört sekme: Çalış · Kartlar · Ekle · İlerleme.

   Çalış varsayılandır çünkü bu ekrana girmenin sebebi çoğu zaman kart
   eklemek değil, vadesi gelenleri kapatmaktır. Unutma eğrisi beklemez.

   Ekranda hiçbir yerde «şu kadar kelime biliyorsun» yazmaz: bilinen kelime
   ölçülemez, hatırlanan kelime ölçülür. Bu yüzden her sayının yanında
   nereden geldiği durur. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.lang = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;

  const TABS = [
    { id:'calis',    label:'Çalış' },
    { id:'kartlar',  label:'Kartlar' },
    { id:'ekle',     label:'Ekle' },
    { id:'gramer',   label:'Dilbilgisi' },
    { id:'ilerleme', label:'İlerleme' },
  ];

  function aktifDil(){
    return S.ui.langDeck && S.ui.langDeck !== 'all'
      ? S.ui.langDeck
      : ((S.profile && S.profile.langs && S.profile.langs[0]) || 'en');
  }

  function cert(c){
    const x = ESP.CERTAINTY[c] || ESP.CERTAINTY.missing;
    return K.Badge({ label:x.label, tone:x.tone, icon:false });
  }

  /* ------------------------------------------------------------------ çalış

     Kuyruk durumu `S.ui.reviewQueue` içinde durur: { ids, pos, shown }.
     Kart listesi oturumun BAŞINDA dondurulur — çalışırken cevaplanan kartın
     vadesi ileri gider ve kuyruk canlı hesaplansaydı kart ortadan kaybolur,
     kullanıcı ilerlemeyi göremezdi. */

  function queueStart(){
    const due = ESP.SRS.dueCards().filter(c => c.lang === aktifDil());
    return { ids:due.map(c => c.id), pos:0, shown:false, correct:0, again:0 };
  }

  function reviewRows(){
    const q = S.ui.reviewQueue;
    const d = ESP.SRS.deckStatus(aktifDil());

    if(!q){
      if(!d.total){
        return [K.Entry({
          label:'ÇALIŞMA', meta:'deste boş',
          body:K.Empty({ text:'Bu dilde hiç kart yok. Ekle sekmesinden bir liste '
            + 'yapıştırabilir ya da tek tek yazabilirsin.',
            action:K.Button({ label:'Kart ekle', tone:'primary', act:'tab-ekle' }) }),
        })];
      }
      if(!d.due){
        return [K.Entry({
          label:'ÇALIŞMA', hint:'srs',
          meta:'vadesi gelen kart yok',
          note:'Aralıklı tekrarın amacı her gün çalışmak değil, doğru günde '
             + 'çalışmaktır. Bugün sırası gelen kart yok.',
          body:K.Notice({ tone:'ok', title:'Bugünlük bitti',
            body:d.total + ' kartın hepsi ileri tarihli. Erken çalışmak aralığı '
              + 'kısaltır ve tekrar sayısını artırır — kazanç getirmez.' }),
        })];
      }
      return [K.Entry({
        label:'ÇALIŞMA', hint:'srs',
        meta:d.due + ' kart vadeli' + (d.overdue ? ' · ' + d.overdue + ' gecikmiş' : ''),
        note:d.overdue
          ? 'En çok geciken kart ' + d.maxOverdueDays + ' gündür bekliyor.'
          : 'Bugün sırası gelenler.',
        body:html`
          ${K.Button({ label:d.due + ' kartı çalış', tone:'primary', act:'start-review' })}
          <p class="small muted mt-10">Oturum başladığında liste dondurulur:
            çalışırken cevapladığın kartın vadesi ileri gitse de kuyruktan düşmez,
            ilerlemeyi görebilirsin.</p>`,
      })];
    }

    const kart = S.cards.find(c => c.id === q.ids[q.pos]);
    if(!kart){
      return [finishRow(q)];
    }

    const gecikme = ESP.SRS.overdueDays(kart);
    return [K.Entry({
      label:'KART ' + (q.pos + 1) + '/' + q.ids.length,
      meta:(ESP.LANG_BY_ID[kart.lang] || {}).label || kart.lang,
      note:gecikme ? gecikme + ' gündür bekliyor.' : 'Bugün vadeli.',
      action:K.Button({ label:'Oturumu bitir', size:'sm', act:'end-review' }),
      wide:true,
      body:html`
        <div class="srscard">
          <div class="srscard__front">${kart.front}</div>
          ${when(kart.context, () => html`<p class="srscard__ctx">${kart.context}</p>`)}
          ${q.shown
            ? html`<div class="srscard__back">${kart.back}</div>`
            : html`<button class="srscard__reveal" data-act="reveal-card">Karşılığı göster</button>`}
        </div>
        ${when(q.shown, () => html`
          <div class="row wrap mt-12">
            ${map(ESP.SRS.GRADES, g => {
              const next = ESP.SRS.schedule(kart, g.id);
              return K.Button({
                label:g.label + ' · ' + (next.interval ? next.interval + ' gün' : 'bugün'),
                tone:g.id === 'again' ? '' : (g.id === 'good' ? 'primary' : ''),
                size:'sm', act:'grade-card', data:{ 'data-grade':g.id },
                title:g.note,
              });
            })}
          </div>
          <p class="small muted mt-8">Kutu ${kart.box} · kolaylık
            ${U.fmtNum(Math.round(kart.ease * 100) / 100)} · ${kart.reps} tekrar,
            ${kart.lapses} unutma</p>`)}`,
    })];
  }

  function finishRow(q){
    return K.Entry({
      label:'OTURUM BİTTİ',
      meta:q.ids.length + ' kart',
      note:'Cevapladığın her kart yeni vadesine taşındı.',
      body:html`
        ${K.Notice({ tone:'ok', title:'Tamamlandı',
          body:q.correct + ' kart hatırlandı, ' + q.again + ' kart başa döndü.' })}
        <div class="row mt-10">
          ${K.Button({ label:'Kapat', tone:'primary', act:'end-review' })}
          ${K.Button({ label:'Bugüne oturum yaz', act:'log-review',
            data:{ 'data-count':String(q.ids.length) } })}
        </div>`,
    });
  }

  /* ---------------------------------------------------------------- kartlar */

  function cardRows(){
    const q = U.norm(S.ui.cardQuery || '');
    const hepsi = M.cardsOf(aktifDil())
      .filter(c => !q || U.norm(c.front + ' ' + c.back).indexOf(q) >= 0)
      .sort((a, b) => (a.due || '').localeCompare(b.due || ''));

    return [K.Entry({
      label:'DESTE',
      meta:hepsi.length + ' kart',
      note:'Vadesi yakın olan üstte. «Aktif» işareti kartın üretimde '
         + 'kullanıldığını söyler; tanımak ile kullanmak ayrı şeylerdir.',
      action:html`${K.Input({ id:'card-q', value:S.ui.cardQuery || '',
        placeholder:'Kart ara…', change:'card-query', size:'sm', aria:'Kart ara' })}`,
      wide:true,
      body:hepsi.length
        ? K.Table({ tight:true,
            headers:['Ön yüz', 'Karşılık', 'Kutu', 'Vade', 'Aktif', ''],
            rows:hepsi.slice(0, 200).map(c => [
              c.front, c.back,
              String(c.box),
              c.due === U.todayISO() ? 'bugün' : U.fmtShort(c.due),
              K.Checkbox({ checked:!!c.active, act:'toggle-active',
                data:{ 'data-id':c.id }, label:'' }),
              K.Button({ label:'Sil', size:'sm', act:'del-card', data:{ 'data-id':c.id } }),
            ]) })
        : K.Empty({ text:q ? 'Aramaya uyan kart yok.' : 'Deste boş.' }),
    })];
  }

  /* ------------------------------------------------------------------ ekle */

  function addRows(){
    const res = S.ui.vocabParsed;
    return [
      K.Entry({
        label:'LİSTE YAPIŞTIR',
        meta:'kelime – karşılık',
        note:'Üç ayraç tanınır: tire, eşittir, iki nokta. Tanınmayan satır '
           + 'atılmaz — sana geri gösterilir ve elle bağlarsın.',
        body:html`
          ${K.Textarea({ id:'vocab-text', rows:6, aria:'Kelime listesi',
            placeholder:'nevertheless – yine de\nto grasp = kavramak\nmake a point: bir noktaya değinmek' })}
          <div class="row mt-10">
            ${K.Select({ id:'vocab-lang', value:aktifDil(), change:'pick-lang',
              aria:'Kartların dili',
              options:ESP.LANGS.map(l => ({ value:l.id, label:l.label })) })}
            ${K.Button({ label:'Çöz', tone:'primary', act:'parse-vocab' })}
          </div>
          ${when(res, () => vocabPreview(res))}`,
      }),

      K.Entry({
        label:'TEK KART',
        meta:'elle',
        body:html`
          <div class="cols-3">
            ${K.Field({ label:'Ön yüz', input:K.Input({ id:'c-front', placeholder:'nevertheless' }) })}
            ${K.Field({ label:'Karşılık', input:K.Input({ id:'c-back', placeholder:'yine de' }) })}
            ${K.Field({ label:'Bağlam', hint:'isteğe bağlı',
              input:K.Input({ id:'c-ctx', placeholder:'örnek cümle' }) })}
          </div>
          ${K.Button({ label:'Kart ekle', tone:'primary', act:'add-card', class:'mt-10' })}`,
      }),

      K.Entry({
        label:'TOHUM DESTE',
        meta:'başlangıç için',
        note:'Bu kartlar senin ölçümün değildir; ilk ekranı boş bırakmamak için '
           + 'vardır ve istediğin zaman silinir.',
        body:ESP.SEED_CARDS[aktifDil()]
          ? html`${K.Button({ label:'Tohum desteyi ekle', act:'seed-cards' })}
              <p class="small muted mt-8">${ESP.SEED_CARDS[aktifDil()].length} kart</p>`
          : K.Notice({ tone:'info', body:'Bu dil için tohum deste yok; kendi listeni yapıştırabilirsin.' }),
      }),
    ];
  }

  function vocabPreview(res){
    return html`
      <div class="mt-10">
        ${when(res.rows.length, () => html`
          ${K.Table({ tight:true, headers:['Ön yüz', 'Karşılık', 'Tür'],
            rows:res.rows.slice(0, 20).map(r => [r.front, r.back,
              (ESP.CARD_KINDS.find(k => k.id === r.kind) || {}).label || r.kind]) })}
          ${when(res.rows.length > 20, () => html`<p class="small muted">
            …ve ${res.rows.length - 20} kart daha.</p>`)}
          <div class="row mt-8">
            ${K.Button({ label:res.rows.length + ' kartı ekle', tone:'primary',
              size:'sm', act:'save-vocab' })}
            ${K.Button({ label:'Vazgeç', size:'sm', act:'clear-vocab' })}
          </div>`)}
        ${when(res.duplicates.length, () => K.Notice({ tone:'info',
          body:res.duplicates.length + ' satır aynı ön yüze sahip olduğu için '
            + 'bir kez alındı. İkiz kart destede iki ayrı soru üretir.' }))}
        ${when(res.unmatched.length, () => K.Notice({ tone:'warn', title:'Eşleşmedi',
          body:res.unmatched.slice(0, 8).map(u => '«' + U.esc(u.text) + '» — ' + u.why).join('<br/>') }))}
      </div>`;
  }

  /* -------------------------------------------------------------- ilerleme */

  function progressRows(){
    const d = ESP.SRS.deckStatus(aktifDil());
    const bant = ESP.cefrOf(d.active, d.retention.value);

    return [
      K.Entry({
        label:'RETANSİYON', hint:'retention',
        meta:d.retention.cert === 'missing' ? 'veri yok'
          : '%' + Math.round(d.retention.value * 100),
        note:d.retention.cert === 'missing'
          ? 'Hiç cevaplanmış kart yok; ortalama üretilmedi.'
          : d.retention.total + ' kartın ' + d.retention.n + '\'inden hesaplandı. '
            + 'Hiç sorulmamış kart bu ortalamaya girmez.',
        body:d.retention.cert === 'missing'
          ? K.Empty({ text:'İlk çalışma oturumundan sonra ölçülmeye başlar.' })
          : html`${K.Meter({ label:'Ortalama hatırlama olasılığı',
              value:d.retention.value * 100,
              text:'%' + Math.round(d.retention.value * 100),
              tone:d.retention.value < ESP.Planner.RETENTION_FLOOR ? 'danger' : '' })}
            <p class="small muted mt-8">Taban %${Math.round(ESP.Planner.RETENTION_FLOOR * 100)}:
              altına inerse yeni kart eklemek önceliği kaybeder.</p>`,
      }),

      K.Entry({
        label:'KUTU DAĞILIMI', hint:'srs',
        meta:d.total + ' kart',
        note:'Kutu kaba sınıftır: bir kart doğru cevaplandıkça yukarı çıkar, '
           + 'unutulduğunda başa döner.',
        body:d.total
          ? html`${map(d.boxes, b => K.Meter({
              label:'Kutu ' + b.box + ' · ' + b.label,
              value:d.total ? b.count / d.total * 100 : 0,
              text:String(b.count) }))}`
          : K.Empty({ text:'Deste boş.' }),
      }),

      K.Entry({
        label:'BANT', hint:'pedagogic',
        meta:bant.band ? bant.band.label : 'ölçülemedi',
        note:'Bant KİŞİYE değil ÜRETİME verilir ve iki ölçüm birden gerekir: '
           + 'aktif kelime sayısı ve retansiyon.',
        body:html`
          ${K.Notice({ tone:bant.band ? 'info' : 'warn',
            body:bant.text || bant.why })}
          ${K.Table({ tight:true,
            headers:['Bant', { label:'Aktif kelime', num:true }, { label:'Retansiyon', num:true }, 'Ne yapabilir'],
            rows:ESP.CEFR.map(b => [
              b.label, U.fmtNum(b.activeWords), '%' + Math.round(b.retention * 100), b.can,
            ]) })}
          <p class="small muted mt-8">Şu an: ${d.active} aktif kelime,
            ${d.retention.cert === 'missing' ? 'retansiyon ölçülmedi'
              : '%' + Math.round(d.retention.value * 100) + ' retansiyon'}.</p>`,
      }),

      K.Entry({
        label:'SHADOWING',
        meta:'kaynak türleri',
        note:'Süre ölçülür, kalite ölçülmez: sistem sesini dinlemez. '
           + 'Kendi işaretlediğin zorluk «tahmin» etiketiyle durur.',
        body:K.Table({ tight:true, headers:['Kaynak', 'Not'],
          rows:ESP.SHADOW_SOURCES.map(s => [s.label, s.note]) }),
      }),
    ];
  }

  /* -------------------------------------------------------------- dilbilgisi

     Kelime ezberi bir dili taşımaz: dört bin kart bilen biri koşul cümlesi
     kuramıyorsa üretemez. Bu sekme ikinci ekseni tutar.

     Buradaki işaretler ÖLÇÜM DEĞİL BEYANDIR ve öyle etiketlenir: kullanıcı
     «bunu üretebiliyorum» der, sistem doğrulayamaz. Beyanı ölçüm gibi
     göstermek, retansiyon sayısını uydurmakla aynı şey olurdu. */

  function grammarMarks(){
    return ((S.prefs && S.prefs.grammar) || {})[aktifDil()] || {};
  }

  function grammarRows(){
    const d = ESP.SRS.deckStatus(aktifDil());
    const bant = ESP.cefrOf(d.active, d.retention.value);
    const isaret = grammarMarks();
    const bantlar = ESP.CEFR.map(b => b.label);
    const hataKartlari = (S.cards || []).filter(c => (c.tags || []).indexOf('hata') >= 0);

    const rows = [
      K.Entry({
        label:'İKİ EKSEN', hint:'grammar',
        meta:bant.band ? bant.band.label : 'bant yok',
        note:'Soldaki eksen kelime (ölçülür), sağdaki işlev (beyan edilir). '
           + 'İkisi ayrı durur çünkü biri ölçüm, öteki beyandır.',
        body:html`
          ${K.Notice({ tone:'info', body:bant.text || bant.why })}
          <p class="small muted mt-8">${ESP.AVOIDANCE_NOTE}</p>`,
      }),
    ];

    bantlar.forEach(b => {
      const konular = ESP.GRAMMAR_BY_BAND[b] || [];
      if(!konular.length) return;
      const kac = konular.filter(t => isaret[t.id]).length;
      rows.push(K.Entry({
        label:b,
        meta:kac + '/' + konular.length + ' beyan',
        note:(ESP.CEFR.filter(x => x.label === b)[0] || {}).can || '',
        wide:true,
        body:html`${map(konular, t => html`
          <div class="${cls('gramrow', isaret[t.id] && 'is-on')}">
            ${K.Checkbox({ label:t.label, checked:!!isaret[t.id],
              act:'mark-topic', data:{ 'data-id':t.id } })}
            <span class="gramrow__can">${t.can}</span>
            <span class="gramrow__trap"><b>Tuzak:</b> ${t.trap}</span>
            ${when(isaret[t.id], () => ESP.Parts.cert('estimated'))}
          </div>`)}`,
      }));
    });

    rows.push(K.Entry({
      label:'HATA GÜNLÜĞÜ', hint:'error-log',
      meta:hataKartlari.length + ' kart',
      note:'Bir hatayı adlandırmak onu bir daha görmenin tek yolu: '
         + '«bir şeyler yanlıştı» tekrar eder, «edat eşleşmesi» tekrar etmez.',
      wide:true,
      body:html`
        <div class="cols-3">
          ${K.Field({ label:'Hata türü',
            input:K.Select({ id:'er-kind', value:'dizim', aria:'Hata türü',
              options:ESP.PRODUCTION_ERRORS.map(e => ({ value:e.id, label:e.label })) }) })}
          ${K.Field({ label:'Yanlış hâli',
            input:K.Input({ id:'er-wrong', aria:'Yanlış hâli' }) })}
          ${K.Field({ label:'Doğrusu',
            input:K.Input({ id:'er-right', aria:'Doğru hâli' }) })}
        </div>
        ${K.Button({ label:'Karta çevir', tone:'primary', act:'add-error', class:'mt-10' })}
        ${K.Table({ tight:true, headers:['Tür', 'Ne olur'],
          rows:ESP.PRODUCTION_ERRORS.map(e => [e.label, e.note]) })}`,
    }));

    return rows;
  }

  /* ------------------------------------------------------------------ çizim */

  function render(){
    const tab = S.ui.langTab || 'calis';
    const d = ESP.SRS.deckStatus(aktifDil());
    const rows = tab === 'kartlar' ? cardRows()
      : tab === 'ekle' ? addRows()
      : tab === 'gramer' ? grammarRows()
      : tab === 'ilerleme' ? progressRows()
      : reviewRows();

    return K.Grid(html`
      ${K.Span(12, K.Toolbar({
        tabs:K.Subtabs({ value:tab, act:'lang-tab', aria:'Dil sekmeleri',
          items:TABS.map(t => Object.assign({}, t,
            t.id === 'calis' ? { count:d.due || null } : {})) }),
        actions:K.Select({ value:aktifDil(), change:'deck-lang', size:'sm',
          aria:'Çalışılan dil',
          options:ESP.LANGS.map(l => ({ value:l.id, label:l.label })) }),
      }))}
      ${K.Span(12, K.Ledger(() => [ESP.Parts.coach('lang')].concat(rows)))}`);
  }

  const handle = {
    async 'lang-tab'(el){ S.ui.langTab = el.dataset.tab; ESP.App.render(); },

    /* Beyan bir olcum degildir: prefs icinde durur, deste sayilarina
       karismaz ve hicbir kapiyi acmaz. */
    async 'mark-topic'(el){
      const dil = aktifDil(), id = el.dataset.id;
      const prefs = Object.assign({}, S.prefs || {});
      prefs.grammar = Object.assign({}, prefs.grammar || {});
      prefs.grammar[dil] = Object.assign({}, prefs.grammar[dil] || {});
      if(prefs.grammar[dil][id]) delete prefs.grammar[dil][id];
      else prefs.grammar[dil][id] = true;
      await M.savePrefs(prefs);
      ESP.App.render();
    },

    /* Hata karti iki yonlu degildir: yalnizca "yanlis -> dogru". Ters yonu
       sormak, yanlis hali ezberletmek olurdu. */
    async 'add-error'(){
      const g = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      const yanlis = g('er-wrong'), dogru = g('er-right');
      if(!yanlis || !dogru){ ESP.UI.toast('İki alan da gerekir'); return; }
      const tur = ESP.ERROR_BY_ID_LANG[g('er-kind')] || ESP.PRODUCTION_ERRORS[0];
      await M.saveCard(M.newCard({
        front:yanlis + '  →  ?', back:dogru, lang:aktifDil(),
        context:tur.label + ' — ' + tur.note,
        tags:['hata', tur.id],
      }));
      ESP.Memo.bitir();
      ESP.UI.toast('Hata kartı eklendi');
      ESP.App.render();
    },
    async 'tab-ekle'(){ S.ui.langTab = 'ekle'; ESP.App.render(); },

    async 'start-review'(){ S.ui.reviewQueue = queueStart(); ESP.App.render(); },
    async 'reveal-card'(){ if(S.ui.reviewQueue) S.ui.reviewQueue.shown = true; ESP.App.render(); },

    async 'grade-card'(el){
      const q = S.ui.reviewQueue;
      if(!q) return;
      const res = await ESP.SRS.answer(q.ids[q.pos], el.dataset.grade);
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      if(el.dataset.grade === 'again') q.again++; else q.correct++;
      q.pos++; q.shown = false;
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'end-review'(){ S.ui.reviewQueue = null; ESP.App.render(); },

    async 'log-review'(el){
      const n = Number(el.dataset.count) || 0;
      await M.addSession(U.todayISO(), { disc:'lang', minutes:Math.max(1, Math.round(n * 0.4)),
        count:n, note:'kart çalışması' });
      S.ui.reviewQueue = null;
      ESP.Memo.bitir();
      ESP.UI.toast('Bugüne yazıldı');
      ESP.App.render();
    },

    async 'parse-vocab'(){
      const el = document.getElementById('vocab-text');
      const dil = document.getElementById('vocab-lang');
      const res = ESP.Parse.parseVocab(el ? el.value : '', dil ? dil.value : aktifDil());
      if(!res.rows.length && !res.unmatched.length){ ESP.UI.toast('Liste boş'); return; }
      S.ui.vocabParsed = res;
      ESP.App.render();
    },

    async 'save-vocab'(){
      const res = S.ui.vocabParsed;
      if(!res) return;
      for(const r of res.rows){
        await M.saveCard(M.newCard({ front:r.front, back:r.back, lang:r.lang }));
      }
      S.ui.vocabParsed = null;
      ESP.Memo.bitir();
      ESP.UI.toast(res.rows.length + ' kart eklendi');
      ESP.App.render();
    },

    async 'clear-vocab'(){ S.ui.vocabParsed = null; ESP.App.render(); },

    async 'add-card'(){
      const v = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      const front = v('c-front'), back = v('c-back');
      if(!front || !back){ ESP.UI.toast('Ön yüz ve karşılık gerekir'); return; }
      await M.saveCard(M.newCard({ front, back, context:v('c-ctx'), lang:aktifDil() }));
      ESP.Memo.bitir();
      ESP.UI.toast('Kart eklendi');
      ESP.App.render();
    },

    async 'seed-cards'(){
      const tohum = ESP.SEED_CARDS[aktifDil()] || [];
      for(const t of tohum){
        await M.saveCard(M.newCard({ front:t.front, back:t.back, lang:aktifDil(),
          tags:['tohum'] }));
      }
      ESP.Memo.bitir();
      ESP.UI.toast(tohum.length + ' tohum kart eklendi');
      ESP.App.render();
    },

    async 'toggle-active'(el){
      const c = S.cards.find(x => x.id === el.dataset.id);
      if(!c) return;
      c.active = !c.active;
      await M.saveCard(c);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'del-card'(el){
      await M.deleteCard(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },
  };

  const change = {
    async 'card-query'(el){ S.ui.cardQuery = el.value; ESP.App.render(); },
    async 'deck-lang'(el){ S.ui.langDeck = el.value; S.ui.reviewQueue = null; ESP.App.render(); },
    async 'pick-lang'(){ /* form içi seçim; kaydetme anında okunur */ },
  };

  return {
    id:'lang',
    title:'Dil Stüdyosu',
    headline(){
      const d = ESP.SRS.deckStatus(aktifDil());
      if(!d.total) return 'Deste boş.';
      if(d.overdue) return d.overdue + ' kartın vadesi geçti.';
      if(d.due) return d.due + ' kart bugün vadeli.';
      return 'Bugün vadesi gelen kart yok.';
    },
    lede(){
      const d = ESP.SRS.deckStatus(aktifDil());
      if(!d.total) return 'Bir liste yapıştırdığında ölçüm başlar: retansiyon, kutu dağılımı ve bant.';
      return d.retention.cert === 'missing'
        ? d.total + ' kart kayıtlı; hiçbiri henüz cevaplanmadı, retansiyon ölçülmedi.'
        : d.total + ' kart · retansiyon %' + Math.round(d.retention.value * 100)
          + ' (' + d.retention.n + ' karttan hesaplandı).';
    },
    stats(){
      const d = ESP.SRS.deckStatus(aktifDil());
      return [
        { value:String(d.total), label:'kart' },
        { value:String(d.due), label:'vadeli' },
        { value:String(d.active), label:'aktif' },
        { value:d.retention.cert === 'missing' ? '—' : '%' + Math.round(d.retention.value * 100),
          label:'retansiyon' },
      ];
    },
    subtitle(){ return (ESP.LANG_BY_ID[aktifDil()] || {}).label || aktifDil(); },
    actions(){ return ''; },
    render, handle, change,
  };
})();
