/* Günlük — sistemin ilk ve tek günlük sayfası.

   Önceden iki ayrı ekran vardı: "Bugün" (özet) ve "Günlük ölçüm" (giriş).
   İkisi de aynı günü anlatıyordu ve kullanıcı hangisine gireceğini
   düşünmek zorunda kalıyordu. Şimdi tek sayfa, üç sekme:

     Giriş    günün verisi buraya yazılır — sayfanın VARSAYILANI budur
     Özet     yazılanın karşılığı: toparlanma, beslenme, asgari gün, bütçe
     Geçmiş   son iki hafta ve kişisel taban çizgi

   Giriş önce gelir çünkü bu sayfaya girmenin sebebi çoğu zaman okumak
   değil YAZMAKtır. Özet, yazılanın sonucudur; sonuç girdiden önce
   gelmez.

   Hiçbir alan zorunlu değildir: eksik girdi sıfır sayılmaz, ağırlığı
   kalan girdilere dağıtılır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.today = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  function shownDate(){ return S.ui.mealDate || U.todayISO(); }

  /* Girilecek alanlar tek yerde tanimlanir; form da, kaydetme de bunu okur. */
  const FIELDS = [
    { id:'sleep',    label:'Uyku (saat)',        step:'0.5', min:0,  max:16,  marker:'sleep' },
    { id:'rhr',      label:'İstirahat nabzı',    step:'1',   min:30, max:140, marker:'rhr' },
    { id:'hrv',      label:'HRV (ms)',           step:'1',   min:5,  max:250, marker:'hrv' },
    { id:'sbp',      label:'Büyük tansiyon',     step:'1',   min:60, max:250, marker:'sbp' },
    { id:'dbp',      label:'Küçük tansiyon',     step:'1',   min:30, max:160, marker:'dbp' },
    { id:'spo2',     label:'Oksijen (%)',        step:'1',   min:70, max:100, marker:'spo2' },
    { id:'temp',     label:'Ateş (°C)',          step:'0.1', min:33, max:43,  marker:'temp' },
    { id:'weight',   label:'Kilo (kg)',          step:'0.1', min:20, max:250, marker:'weight' },
    { id:'waist',    label:'Bel çevresi (cm)',   step:'0.5', min:40, max:200, marker:'waist' },
    { id:'bodyfat',  label:'Yağ oranı (%)',      step:'0.1', min:3,  max:60,  marker:'bodyfat' },
    { id:'water',    label:'Su (ml)',            step:'100', min:0,  max:8000, marker:null },
  ];

  const SORENESS = [
    { value:1, label:'1 · bitkin' }, { value:2, label:'2 · yorgun' },
    { value:3, label:'3 · normal' }, { value:4, label:'4 · iyi' },
    { value:5, label:'5 · zinde' },
  ];

  function formCard(){
    const d = shownDate();
    const v = M.vitalsOf(d) || M.defaultVitals(d);
    return K.Card({
      title:U.fmtDate(d) + ' ölçümleri',
      sub:'Boş bıraktığın alan sıfır sayılmaz',
      actions:K.Segmented({ act:'shift-day', value:'', aria:'Gün değiştir', items:[
        { value:'-1', label:'‹ önceki' }, { value:'0', label:'bugün' }, { value:'1', label:'sonraki ›' },
      ] }),
      body:html`
        <div class="grid-form mt-4">${map(FIELDS, f => K.Field({
          label:f.label,
          input:K.Input({ id:'v-' + f.id, type:'number', numeric:true, step:f.step,
            min:f.min, max:f.max, value:v[f.id] == null ? '' : v[f.id] }),
        }))}</div>
        <div class="mt-12">${K.Field({ label:'Bugün nasıl hissediyorsun?',
          hint:'cihazın göremediği tek girdi',
          input:K.Segmented({ act:'set-soreness', value:v.soreness == null ? '' : String(v.soreness),
            items:SORENESS, block:true, aria:'Günün hissi' }) })}</div>
        <div class="mt-12">${K.Field({ label:'Not',
          input:html`<div class="withmic">
            ${K.Textarea({ id:'v-note', rows:2, value:v.note || '',
              placeholder:'Hastalık, ilaç değişikliği, olağandışı bir gün…' })}
            ${K.Mic({ target:'v-note' })}
          </div>` })}</div>`,
      foot:html`${K.Button({ label:'Kaydet', tone:'primary', act:'save-vitals' })}
        <span class="small dim">Kaydettiğinde toparlanma skoru ve kırmızı bayraklar yeniden hesaplanır.</span>`,
    });
  }

  /* Girilen degerin referans araligindaki yeri hemen gorunur. */
  function statusCard(){
    const d = shownDate();
    const v = M.vitalsOf(d);
    if(!v) return null;
    const rows = FIELDS.filter(f => f.marker && v[f.id] != null).map(f => {
      const b = SP.BIO_BY_ID[f.marker];
      const r = SP.Bio.refFor(f.marker);
      return { marker:b, value:v[f.id], at:d, cert:'measured',
        status:SP.Bio.statusOf(f.marker, v[f.id]), ref:r.ref, optimal:r.optimal };
    });
    if(!rows.length) return null;
    return K.Card({ title:'Girilen değerler nerede duruyor?', hint:'ref-range',
      body:html`${map(rows, r => P.markerRow(r, {}))}` });
  }

  function readinessCard(){
    const r = SP.Move.readiness(shownDate());
    if(!r.ok) return K.Card({ title:'Toparlanma', hint:'readiness',
      body:K.Notice({ tone:'info', body:r.note }) });
    return K.Card({
      title:'Toparlanma', hint:'readiness',
      badge:K.Badge({ label:r.band.label, tone:r.band.tone }),
      body:html`
        <div class="kpi"><span class="kpi__value">${r.score}</span><span class="kpi__unit">/ 100</span></div>
        <div class="mt-8">${K.Bar({ value:r.score, tone:r.band.tone })}</div>
        <div class="mt-10">${map(r.parts, p => html`
          <div class="${p.score == null ? 'readypart readypart--off' : 'readypart'}">
            <span class="readypart__label">${p.label}</span>
            <span class="small dim">${p.score == null ? 'girilmedi' : U.fmtNum(U.round(p.value, 1))} · ağırlık %${Math.round(p.weight * 100)}</span>
            <span class="readypart__score num">${p.score == null ? '—' : Math.round(p.score)}</span>
            <span class="readypart__note">${p.note}</span>
          </div>`)}</div>
        ${K.Notice({ tone:r.band.tone === 'ok' ? 'ok' : r.band.tone, class:'mt-10', body:r.band.order })}`,
    });
  }

  function baselineCard(){
    const rows = [['hrv', 'HRV'], ['rhr', 'İstirahat nabzı'], ['sleep', 'Uyku'], ['weight', 'Kilo']]
      .map(([key, label]) => {
        const b = SP.Move.baseline(key);
        return [label, b ? html`<b class="num">${U.fmtNet(b.mean)}</b>` : html`<span class="dim">—</span>`,
          b ? b.n + ' gün' : 'en az 3 gün gerekir'];
      });
    return K.Card({ title:'Kişisel taban çizgin', sub:'Son 30 gün, bugün hariç',
      body:html`${K.Table({ tight:true, headers:['Ölçüm', { label:'Ortalama', num:true }, 'Kapsam'], rows })}
        <p class="small muted mt-10">HRV ve nabız mutlak değil kişisel ölçektir: kendi ortalamana göre
          okunur, başkasınınkiyle karşılaştırılmaz.</p>` });
  }

  function historyCard(){
    const days = [];
    for(let i = 13; i >= 0; i--) days.push(U.iso(U.addDays(U.today(), -i)));
    const rows = days.filter(d => S.vitals[d]).reverse().map(d => {
      const v = S.vitals[d];
      const r = SP.Move.readiness(d);
      return [
        html`<button class="linkbtn" data-act="open-day" data-date="${d}">${U.fmtShort(d)}</button>`,
        v.sleep == null ? '—' : U.fmtNet(v.sleep),
        v.rhr == null ? '—' : U.fmtNum(v.rhr),
        v.hrv == null ? '—' : U.fmtNum(v.hrv),
        r.ok ? K.Badge({ label:String(r.score), tone:r.band.tone }) : html`<span class="dim">—</span>`,
      ];
    });
    if(!rows.length) return null;
    return K.Card({ title:'Son iki hafta',
      body:K.Table({ tight:true,
        headers:['Gün', { label:'Uyku', num:true }, { label:'Nabız', num:true },
          { label:'HRV', num:true }, 'Toparlanma'],
        rows }) });
  }


  /* Öğün girişi de günlük veridir: aynı sayfada, aynı sekmede durur.
     Kullanıcı günün verisini yazarken öğün için başka ekrana gitmez. */
  function quickCard(){
    return K.Card({
      title:'Öğün ekle', hint:'portion',
      sub:'Tek satır yaz, Enter\'a bas',
      body:html`
        <div class="quick">
          ${K.Mic({ target:'quick-meal' })}
          ${K.Input({ id:'quick-meal', placeholder:'1 tabak etli kuru fasulye, 1 bardak ayran',
            aria:'Öğün metni' })}
          ${K.Button({ label:'Öğüne ekle', tone:'primary', act:'quick-meal' })}
          <span class="quick__hint">Ev ölçüsünden gelen gramaj «tahmin» olarak işaretlenir.
            Tarttıysan «150 g tavuk» yaz, «ölçüldü» olur.</span>
        </div>`,
      foot:K.Button({ label:'Bütün öğünleri aç', size:'sm', act:'go', data:{ 'data-route':'meals' } }),
    });
  }

  function whyCard(){
    return K.Card({ title:'Bu ölçümler ne işe yarıyor?',
      body:html`<ul class="bullets small muted">
        ${map(SP.READINESS_INPUTS, i => html`<li><b>${i.label}</b> — ${i.note}</li>`)}
      </ul>
      <p class="small muted mt-10">Hiçbiri zorunlu değil. Girmediğin ölçüm sıfır
        sayılmaz; ağırlığı girdiklerine dağıtılır.</p>` });
  }

  /* ---------------------------------------------------------- kartlar */

  function minimumCard(){
    const m = SP.Calc.minimumDay();
    const streak = SP.Calc.streak();
    return K.Card({
      title:'Asgari gün', hint:'minimum-day',
      sub:'Kötü günün alt sınırı',
      badge:K.Badge({ label:m.done + '/' + m.total, tone:m.complete ? 'ok' : 'warn' }),
      body:html`
        <div class="mt-2">${map(m.rows, P.minRow)}</div>
        <p class="small muted mt-10">${m.note}</p>`,
      foot:html`<span class="small">Davranış serisi <b class="num">${streak}</b> gün</span>`,
    });
  }

  function readinessCard(){
    const rx = SP.Move.prescription();
    const r = rx.readiness;
    if(!r.ok){
      return K.Card({ title:'Toparlanma', hint:'readiness',
        body:html`${K.Notice({ tone:'info', body:r.note })}
          <div class="mt-10">${K.Button({ label:'Bugünün ölçümünü gir', size:'sm', tone:'primary',
            act:'go', data:{ 'data-route':'today' } })}</div>` });
    }
    /* Gerekcelerin tamami Hareket ekraninda durur; burada yalnizca bandin
       emri gorunur. Ayni uyariyi iki ekranda tekrarlamak sadelik degil
       gurultudur. */
    return K.Card({
      title:'Toparlanma', hint:'readiness',
      badge:K.Badge({ label:r.band.label, tone:r.band.tone }),
      body:html`
        <div class="row wrap" style="gap:22px">
          ${raw(UI.gauge(r.score, { tone:r.band.tone, label:r.band.label, size:124,
            bands:SP.READINESS_BANDS.map(b => b.min).filter(m => m > 0) }))}
          <div class="grow" style="min-width:180px">${map(r.parts, p => html`
          <div class="${p.score == null ? 'readypart readypart--off' : 'readypart'}">
            <span class="readypart__label">${p.label}</span>
            <span class="small dim">${p.score == null ? 'girilmedi' : U.fmtNum(U.round(p.value, 1))}</span>
            <span class="readypart__score num">${p.score == null ? '—' : Math.round(p.score)}</span>
          </div>`)}</div>
        </div>
        ${K.Notice({ tone:r.band.tone === 'ok' ? 'ok' : r.band.tone, class:'mt-14', body:r.band.order })}`,
      foot:html`${K.Button({ label:'Hareket ekranını aç', size:'sm', act:'go', data:{ 'data-route':'move' } })}
        ${when(r.missing.length, () => html`<span class="small dim">Eksik girdi:
          ${r.missing.join(', ')} — ağırlığı kalanlara dağıtıldı.</span>`)}`,
    });
  }

  function nutritionCard(){
    const d = U.todayISO();
    const t = SP.Nutri.dayTotals(d);
    const tg = SP.Nutri.targets();

    if(!tg.ok){
      return K.Card({ title:'Beslenme',
        body:K.Notice({ tone:'warn', title:'Hedef hesaplanamıyor.',
          body:'Profilde ' + tg.missing.join(', ') + ' eksik. Bu üçü olmadan '
             + 'kalori ve protein hedefi tahmin edilmez.' }),
        foot:K.Button({ label:'Profili tamamla', size:'sm', tone:'primary',
          act:'go', data:{ 'data-route':'family' } }) });
    }
    if(t.empty){
      return K.Card({ title:'Beslenme', sub:'Hedef ' + U.fmtNum(tg.kcal) + ' kcal',
        body:P.empty('Bugün hiç öğün girilmedi.', 'Öğün ekle', 'go', { 'data-route':'meals' }) });
    }

    return K.Card({
      title:'Beslenme', sub:t.meals + ' öğün girildi',
      /* Gün sürerken hedefin altında olmak bir hata değildir: yalnızca
         hedefin belirgin ÜSTÜNE çıkmak uyarı tonuyla işaretlenir. */
      badge:K.Badge({ label:Math.round(t.kcal) + ' / ' + tg.kcal + ' kcal',
        tone:t.kcal > tg.kcal * 1.15 ? 'warn' : 'info' }),
      body:html`
        ${raw(UI.macroSplit({ protein:t.protein * 4, fat:t.fat * 9, carb:t.carb * 4 }))}
        <div class="nutgrid mt-12">
          ${P.nutCell({ label:'Protein', got:t.protein, target:tg.protein.min, unit:'g' })}
          ${P.nutCell({ label:'Lif', got:t.fiber, target:tg.fiber, unit:'g' })}
          ${P.nutCell({ label:'Yağ', got:t.fat, target:tg.fat.min, unit:'g' })}
        </div>
        ${map(t.notes.slice(0, 1), P.absorbNote)}`,
      foot:K.Button({ label:'Öğünleri aç', size:'sm', act:'go', data:{ 'data-route':'meals' } }),
    });
  }

  function officeCard(){
    const d = U.todayISO();
    const b = S.officeBriefings[d];
    const notes = SP.Office.notes().slice(0, 3);
    return K.Card({
      title:'Ofisten', hint:'office',
      sub:'Beş ajan · günün notu',
      badge:b ? P.sourceBadge(b.source) : null,
      body:html`
        ${when(b, () => html`<p class="small">${b.text}</p>`)}
        ${when(!b, () => html`<p class="small dim">Günün brifingi henüz üretilmedi.</p>`)}
        ${when(notes.length, () => html`<div class="notes mt-12">${map(notes, n => html`
          <div class="note note--${n.tone}">
            ${P.avatar(n.agent, 'sm')}
            <div><b class="tiny">${n.name}</b> <span class="small">${n.text}</span></div>
          </div>`)}</div>`)}`,
      foot:html`${K.Button({ label:'Ofisi aç', size:'sm', act:'go', data:{ 'data-route':'office' } })}
        ${K.Button({ label:'Brifingi tazele', size:'sm', act:'refresh-briefing' })}`,
    });
  }

  function moneyCard(){
    const m = SP.Money.status();
    return K.Card({
      title:'Bütçe', hint:'budget-rank',
      badge:K.Badge({ label:m.tone === 'ok' ? 'uyumlu' : m.tone === 'muted' ? 'boş' : 'gözden geçir',
        tone:m.tone }),
      body:html`<p class="small">${m.text}</p>
        ${when(m.basket.limit != null && m.basket.rows.length, () => html`<div class="mt-10">
          ${K.Meter({ label:'Haftalık sınır', value:Math.min(100, m.basket.pct || 0),
            text:U.fmtNum(Math.round(m.basket.total)) + ' / ' + U.fmtNum(m.basket.limit) + ' TL',
            tone:m.basket.over ? 'danger' : '' })}</div>`)}`,
      foot:K.Button({ label:'Finansı aç', size:'sm', act:'go', data:{ 'data-route':'basket' } }),
    });
  }

  /* ------------------------------------------------------------- ekran */

  const TABS = [
    { id:'giris',  label:'Giriş',  icon:'pulse' },
    { id:'ozet',   label:'Özet',   icon:'today' },
    { id:'gecmis', label:'Geçmiş', icon:'clock' },
  ];

  function tabs(){
    const v = M.vitalsOf(shownDate());
    const n = v ? Object.keys(v).filter(k => v[k] != null && k !== 'date').length : 0;
    const items = TABS.map(t => Object.assign({}, t,
      t.id === 'giris' && n ? { count:n } : {}));
    return K.Subtabs({ items, value:S.ui.dayTab || 'giris', act:'day-tab',
      aria:'Günlük görünümü' });
  }

  async function render(){
    const tab = S.ui.dayTab || 'giris';
    const flags = M.openFlags();

    /* Kirmizi bayrak her sekmede en ustte durur: sayfanin hangi
       bolumunde olursan ol gorunmeden gecilmez. */
    const head = html`
      ${when(flags.length, () => html`<div class="stack-sm mb-16">${map(flags, P.flagCard)}</div>`)}
      <div class="mb-20">${tabs()}</div>`;

    if(tab === 'ozet'){
      return String(html`
        ${head}
        <section class="sect">
          <div class="grid">
            <div class="span-8"><div class="stack">${[
              readinessCard(), nutritionCard(), officeCard(),
            ]}</div></div>
            <div class="span-4"><div class="stack">${[
              minimumCard(), moneyCard(),
            ]}</div></div>
          </div>
        </section>
        <div class="mt-24">${raw(UI.rail(['next-action', 'minimum-day', 'readiness', 'certainty']))}</div>`);
    }

    if(tab === 'gecmis'){
      return String(html`
        ${head}
        <section class="sect">
          <div class="grid">
            <div class="span-7"><div class="stack">${[historyCard()
              || K.Card({ body:K.Empty({ text:'Son iki haftada kayıt yok.' }) })]}</div></div>
            <div class="span-5"><div class="stack">${[baselineCard()]}</div></div>
          </div>
        </section>
        <div class="mt-24">${raw(UI.rail(['readiness', 'certainty']))}</div>`);
    }

    /* ---- giriş (varsayılan) ---- */
    return String(html`
      ${head}
      <section class="sect">
        <div class="grid">
          <div class="span-7"><div class="stack">${[formCard(), quickCard(), statusCard()]}</div></div>
          <div class="span-5"><div class="stack">${[whyCard()]}</div></div>
        </div>
      </section>
      <div class="mt-24">${raw(UI.rail(['readiness', 'ref-range', 'certainty']))}</div>`);
  }

  const handle = {
    async 'day-tab'(el){ S.ui.dayTab = el.dataset.tab; SP.App.render(); },
    async 'shift-day'(el){
      const n = Number(el.dataset.value);
      S.ui.mealDate = n === 0 ? null : U.iso(U.addDays(U.parse(shownDate()), n));
      if(S.ui.mealDate === U.todayISO()) S.ui.mealDate = null;
      SP.App.render();
    },
    async 'open-day'(el){
      S.ui.mealDate = el.dataset.date === U.todayISO() ? null : el.dataset.date;
      SP.App.render();
    },
    async 'set-soreness'(el){
      await M.saveVitals(shownDate(), { soreness:Number(el.dataset.value) });
      SP.App.render();
    },
    async 'save-vitals'(){
      const patch = {};
      FIELDS.forEach(f => {
        const el = document.getElementById('v-' + f.id);
        if(!el) return;
        const raw = el.value.trim();
        patch[f.id] = raw === '' ? null : Number(raw.replace(',', '.'));
      });
      const note = document.getElementById('v-note');
      if(note) patch.note = note.value.trim();
      await M.saveVitals(shownDate(), patch);
      const flags = M.openFlags().filter(f => !f.ack);
      UI.toast(flags.length ? 'Kaydedildi — ' + flags.length + ' kırmızı bayrak açık' : 'Kaydedildi');
      SP.App.render();
    },
  
    async 'flag-ack'(el){
      await M.ackFlag(el.dataset.id);
      UI.toast('İşaretlendi — kayıt geçmişte duruyor');
      SP.App.render();
    },
    async 'refresh-briefing'(){
      UI.toast('Brifing üretiliyor…');
      await SP.Office.dailyBriefing(true);
      SP.App.render();
    },
    async 'quick-meal'(){
      const el = document.getElementById('quick-meal');
      if(!el || !el.value.trim()) return;
      const parsed = SP.Parse.parseMeal(el.value);
      if(!parsed.items.length){ UI.toast(parsed.note); return; }
      const slot = SP.Screens.meals.guessSlot();
      const meal = M.newMeal(slot);
      meal.items = parsed.items.map(i => ({ foodId:i.foodId, g:i.g, cert:i.cert, portion:i.portion }));
      meal.note = el.value.trim();
      await M.addMeal(U.todayISO(), meal);
      el.value = '';
      UI.toast(parsed.items.length + ' gıda eklendi'
        + (parsed.unmatched.length ? ' · ' + parsed.unmatched.length + ' parça eşleşmedi' : ''));
      SP.App.render();
    },
  };

  return {
    id:'today',
    title:'Günlük',
    /* Bu sayfanın başlığı BUGÜNÜ anlatır. Sıradaki hamle başka bir
       bölüme aitse (tahlil, sepet) onu buraya başlık yapmak kafa
       karıştırıyordu: kullanıcı günlük sayfasını açıp tahlil cümlesi
       okuyordu. Hamle artık düğme olarak duruyor, başlık olarak değil. */
    headline(){
      const d = shownDate();
      const r = SP.Move.readiness(d);
      if(!r.ok) return 'Bugünün verisi henüz girilmedi.';
      const m = SP.Calc.minimumDay();
      if(m.complete) return 'Bugün tamam — toparlanma '
        + r.band.label.toLocaleLowerCase('tr-TR') + '.';
      return 'Toparlanma ' + r.band.label.toLocaleLowerCase('tr-TR') + '.';
    },
    lede(){
      const d = shownDate();
      const r = SP.Move.readiness(d);
      if(!r.ok){
        return 'Uyku süresini yazman bile yeter: tek girdiyle anlamlı bir sonuç '
          + 'çıkar. Boş bıraktığın alan sıfır sayılmaz, hesaba hiç girmez.';
      }
      const m = SP.Calc.minimumDay();
      const eksik = m.rows.filter(x => !x.ok).map(x => x.label.toLocaleLowerCase('tr-TR'));
      return r.band.order
        + (eksik.length ? ' Asgari gün için kalan: ' + eksik.join(', ') + '.' : '');
    },
    stats(){
      const m = SP.Calc.minimumDay();
      const r = SP.Move.readiness(shownDate());
      const out = [];
      if(r.ok) out.push({ value:r.score, unit:'/100', label:'toparlanma' });
      out.push({ value:m.done + '/' + m.total, label:'asgari gün' });
      out.push({ value:SP.Calc.streak(), label:'gün seri' });
      const f = M.openFlags().filter(x => !x.ack).length;
      if(f) out.push({ value:f, label:'kırmızı bayrak' });
      return out.slice(0, 4);
    },
    subtitle(){
      const d = shownDate();
      const r = SP.Move.readiness(d);
      return U.fmtDate(d) + (r.ok ? ' · toparlanma ' + r.score : ' · veri bekliyor');
    },
    actions(){
      const n = SP.Calc.nextAction();
      return String(html`${K.Button({ label:'Veri gir', tone:'primary', size:'sm', icon:'pulse',
        act:'day-tab', data:{ 'data-tab':'giris' } })}
        ${when(!n.calm && n.route !== 'today', () => K.Button({ label:n.action || 'Aç',
          size:'sm', act:'go', data:{ 'data-route':n.route } }))}`);
    },
    render, handle,
  };
})();
