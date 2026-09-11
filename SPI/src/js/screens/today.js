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
  const { html, raw, when, map, cls } = SP.h;
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

  /* ZAMAN KAYDIRICI. Günler arasında gezinmek için üç düğme vardı:
     «‹ · bugün · ›». Geçmiş bir günü doldurmak zahmetliydi — on gün
     geriye gitmek on tıklamaydı.

     Şerit son on dört günü GÖSTERİR: her günün altında o gün veri
     girilip girilmediğini söyleyen bir nokta durur. Böylece «hangi
     günler eksik» sorusu tıklamadan cevaplanır. */
  const SERIT_GUN = 14;

  function dayNav(d){
    const bugun = U.todayISO();
    const gunler = [];
    for(let i = SERIT_GUN - 1; i >= 0; i--){
      const t = U.iso(U.addDays(U.parse(bugun), -i));
      const v = M.vitalsOf(t);
      /* Dolu sayılmak için tek alan yeter: sistem «eksik gün» demez,
         «hiç girilmemiş gün» der. */
      const dolu = !!(v && FIELDS.some(f => v[f.id] != null));
      gunler.push({ date:t, dolu, bugun:t === bugun, secili:t === d });
    }
    return html`<div class="daynav">
      <div class="daynav__strip" role="group" aria-label="Gün seç">
        ${map(gunler, g => html`<button
          class="${cls('daybtn', g.secili && 'is-on', g.bugun && 'is-today')}"
          data-act="open-day" data-date="${g.date}"
          aria-pressed="${g.secili ? 'true' : 'false'}"
          title="${U.fmtDate(g.date) + (g.dolu ? ' · veri var' : ' · veri yok')}">
          <span class="daybtn__d">${U.parse(g.date).getDate()}</span>
          <span class="${cls('daybtn__dot', g.dolu && 'is-full')}" aria-hidden="true"></span>
        </button>`)}
      </div>
      ${when(d !== bugun, () => K.Button({ label:'Bugüne dön', size:'sm',
        act:'open-day', data:{ 'data-date':bugun } }))}
    </div>`;
  }

  function formEntry(){
    const d = shownDate();
    const v = M.vitalsOf(d) || M.defaultVitals(d);
    return K.Entry({
      label:'Günün ölçümü',
      meta:U.fmtDate(d),
      note:'Boş bıraktığın alan sıfır sayılmaz — hesaba hiç girmez. Uyku '
        + 'süresini yazman bile anlamlı bir sonuç üretir.',
      action:html`${dayNav(d)}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-vitals' })}`,
      body:html`
        <div class="grid-form">${map(FIELDS, f => K.Field({
          label:f.label,
          input:K.Input({ id:'v-' + f.id, type:'number', numeric:true, step:f.step,
            min:f.min, max:f.max, value:v[f.id] == null ? '' : v[f.id] }),
        }))}</div>
        ${K.Field({ label:'Bugün nasıl hissediyorsun?',
          hint:'cihazın göremediği tek girdi',
          input:K.Segmented({ act:'set-soreness', value:v.soreness == null ? '' : String(v.soreness),
            items:SORENESS, block:true, aria:'Günün hissi' }) })}
        ${K.Field({ label:'Not',
          input:html`<div class="withmic">
            ${K.Textarea({ id:'v-note', rows:2, value:v.note || '',
              placeholder:'Hastalık, ilaç değişikliği, olağandışı bir gün…' })}
            ${K.Mic({ target:'v-note' })}
          </div>` })}`,
    });
  }

  function quickEntry(){
    return K.Entry({
      label:'Öğün ekle', hint:'portion',
      meta:'tek satır, tek Enter',
      note:'Ev ölçüsünden gelen gramaj «tahmin» olarak işaretlenir. '
        + 'Tarttıysan «150 g tavuk» yaz, «ölçüldü» olur.',
      action:K.Button({ label:'Bütün öğünler', act:'go', data:{ 'data-route':'meals' } }),
      body:html`
        <div class="quick">
          ${K.Mic({ target:'quick-meal' })}
          ${K.Input({ id:'quick-meal', placeholder:'1 tabak etli kuru fasulye, 1 bardak ayran',
            aria:'Öğün metni' })}
          ${K.Button({ label:'Öğüne ekle', tone:'primary', act:'quick-meal' })}
        </div>`,
    });
  }

  function statusEntry(){
    const d = shownDate();
    const v = M.vitalsOf(d);
    if(!v) return '';
    const rows = FIELDS.filter(f => f.marker && v[f.id] != null).map(f => {
      const b = SP.BIO_BY_ID[f.marker];
      const r = SP.Bio.refFor(f.marker);
      return { marker:b, value:v[f.id], at:d, cert:'measured',
        status:SP.Bio.statusOf(f.marker, v[f.id]), ref:r.ref, optimal:r.optimal };
    });
    if(!rows.length) return '';
    return K.Entry({
      label:'Girilen değerler', hint:'ref-range',
      meta:rows.length + ' ölçüm',
      note:'Referans aralığı laboratuvarın normal saydığı yer; hedef bandı '
        + 'bu sistemin istediği daha dar yer.',
      body:html`${map(rows, r => P.markerRow(r, {}))}`,
    });
  }

  function whyEntry(){
    return K.Entry({
      label:'Neden bunlar?',
      meta:'toparlanmanın girdileri',
      body:html`<ul class="bullets small muted">
        ${map(SP.READINESS_INPUTS, i => html`<li><b>${i.label}</b> — ${i.note}</li>`)}
      </ul>`,
    });
  }

  function baselineEntry(){
    const rows = [['hrv', 'HRV'], ['rhr', 'İstirahat nabzı'], ['sleep', 'Uyku'], ['weight', 'Kilo']]
      .map(([key, label]) => {
        const b = SP.Move.baseline(key);
        return [label, b ? html`<b class="num">${U.fmtNet(b.mean)}</b>` : html`<span class="dim">—</span>`,
          b ? b.n + ' gün' : 'en az 3 gün gerekir'];
      });
    return K.Entry({
      label:'Taban çizgin',
      meta:'son 30 gün, bugün hariç',
      note:'HRV ve nabız mutlak değil kişisel ölçektir: kendi ortalamana göre '
        + 'okunur, başkasınınkiyle karşılaştırılmaz.',
      body:K.Table({ tight:true, headers:['Ölçüm', { label:'Ortalama', num:true }, 'Kapsam'], rows }),
    });
  }

  function historyEntry(){
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
    if(!rows.length){
      return K.Entry({ label:'Son iki hafta', meta:'kayıt yok',
        body:P.empty('Bu aralıkta ölçüm girilmemiş.') });
    }
    return K.Entry({
      label:'Son iki hafta', meta:rows.length + ' gün',
      body:K.Table({ tight:true,
        headers:['Gün', { label:'Uyku', num:true }, { label:'Nabız', num:true },
          { label:'HRV', num:true }, 'Toparlanma'],
        rows }),
    });
  }

  /* ---------------------------------------------------------- kartlar */  /* ---------------------------------------------------------- kartlar */

  function minimumEntry(){
    const m = SP.Calc.minimumDay();
    const streak = SP.Calc.streak();
    return K.Entry({
      label:'Asgari gün', hint:'minimum-day',
      meta:m.done + ' / ' + m.total + ' · seri ' + streak + ' gün',
      note:m.note,
      body:html`<div class="mt-2">${map(m.rows, P.minRow)}</div>`,
    });
  }

  function readinessEntry(){
    const rx = SP.Move.prescription();
    const r = rx.readiness;
    if(!r.ok){
      return K.Entry({
        label:'Toparlanma', hint:'readiness', meta:'ölçüm bekliyor',
        note:r.note,
        action:K.Button({ label:'Veri gir', tone:'primary',
          act:'day-tab', data:{ 'data-tab':'giris' } }),
        body:P.empty('Bugünün ölçümü girilmedi.'),
      });
    }
    return K.Entry({
      label:'Toparlanma', hint:'readiness',
      meta:r.band.label,
      note:r.missing.length
        ? 'Girilmeyen: ' + r.missing.join(', ') + ' — ağırlığı kalanlara dağıtıldı.'
        : null,
      action:K.Button({ label:'Hareketi aç', act:'go', data:{ 'data-route':'move' } }),
      body:html`
        <div class="row wrap" style="gap:26px">
          ${raw(UI.gauge(r.score, { tone:r.band.tone, label:r.band.label, size:126,
            bands:SP.READINESS_BANDS.map(b => b.min).filter(x => x > 0) }))}
          <div class="grow" style="min-width:210px">${map(r.parts, p => html`
            <div class="${p.score == null ? 'readypart readypart--off' : 'readypart'}">
              <span class="readypart__label">${p.label}</span>
              <span class="small dim">${p.score == null ? 'girilmedi' : U.fmtNum(U.round(p.value, 1))}</span>
              <span class="readypart__score num">${p.score == null ? '—' : Math.round(p.score)}</span>
            </div>`)}</div>
        </div>
        ${K.Notice({ tone:r.band.tone === 'ok' ? 'ok' : r.band.tone, body:r.band.order })}`,
    });
  }

  function nutritionEntry(){
    const d = U.todayISO();
    const t = SP.Nutri.dayTotals(d);
    const tg = SP.Nutri.targets();

    if(!tg.ok){
      return K.Entry({
        label:'Beslenme', meta:'hedef yok',
        note:'Profilde ' + tg.missing.join(', ') + ' eksik. Bu üçü olmadan kalori ve '
          + 'protein hedefi tahmin edilmez.',
        action:K.Button({ label:'Profili tamamla', tone:'primary',
          act:'go', data:{ 'data-route':'family' } }),
        body:P.empty('Hedef hesaplanamıyor.'),
      });
    }
    if(t.empty){
      return K.Entry({
        label:'Beslenme', meta:'hedef ' + U.fmtNum(tg.kcal) + ' kcal',
        action:K.Button({ label:'Öğün ekle', tone:'primary',
          act:'go', data:{ 'data-route':'meals' } }),
        body:P.empty('Bugün hiç öğün girilmedi.'),
      });
    }
    return K.Entry({
      label:'Beslenme',
      meta:t.meals + ' öğün · ' + Math.round(t.kcal) + ' / ' + tg.kcal + ' kcal',
      action:K.Button({ label:'Öğünleri aç', act:'go', data:{ 'data-route':'meals' } }),
      body:html`
        ${raw(UI.macroSplit({ protein:t.protein * 4, fat:t.fat * 9, carb:t.carb * 4 }))}
        <div class="nutgrid">
          ${P.nutCell({ label:'Protein', got:t.protein, target:tg.protein.min, unit:'g' })}
          ${P.nutCell({ label:'Lif', got:t.fiber, target:tg.fiber, unit:'g' })}
          ${P.nutCell({ label:'Yağ', got:t.fat, target:tg.fat.min, unit:'g' })}
        </div>
        ${map(t.notes.slice(0, 1), P.absorbNote)}`,
    });
  }

  function officeEntry(){
    const d = U.todayISO();
    const b = S.officeBriefings[d];
    const notes = SP.Office.notes().slice(0, 3);
    return K.Entry({
      label:'Ofisten', hint:'office',
      meta:'beş ajan · günün notu',
      action:html`${K.Button({ label:'Ofisi aç', act:'go', data:{ 'data-route':'office' } })}
        ${K.Button({ label:'Tazele', act:'refresh-briefing' })}`,
      body:html`
        ${when(b, () => html`<p class="small">${b.text}</p>`)}
        ${when(!b, () => html`<p class="small dim">Günün brifingi henüz üretilmedi.</p>`)}
        ${when(notes.length, () => html`<div class="notes">${map(notes, n => html`
          <div class="note note--${n.tone}">
            ${P.avatar(n.agent, 'sm')}
            <div><b class="tiny">${n.name}</b> <span class="small">${n.text}</span></div>
          </div>`)}</div>`)}`,
    });
  }

  function moneyEntry(){
    const m = SP.Money.status();
    return K.Entry({
      label:'Bütçe', hint:'budget-rank',
      meta:m.tone === 'ok' ? 'uyumlu' : m.tone === 'muted' ? 'boş' : 'gözden geçir',
      action:K.Button({ label:'Finansı aç', act:'go', data:{ 'data-route':'basket' } }),
      body:html`<p class="small">${m.text}</p>
        ${when(m.basket.limit != null && m.basket.rows.length,
          () => K.Meter({ label:'Haftalık sınır', value:Math.min(100, m.basket.pct || 0),
            text:U.fmtNum(Math.round(m.basket.total)) + ' / ' + U.fmtNum(m.basket.limit) + ' TL',
            tone:m.basket.over ? 'danger' : '' }))}`,
    });
  }

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

    const head = html`
      ${when(flags.length, () => html`<div class="stack-sm mb-16">${map(flags, P.flagCard)}</div>`)}
      <div class="mb-8">${tabs()}</div>`;

    if(tab === 'ozet'){
      return String(html`${head}${K.Ledger([
        readinessEntry(), nutritionEntry(), minimumEntry(), officeEntry(), moneyEntry(),
      ])}
      <div class="mt-24">${raw(UI.rail(['next-action', 'minimum-day', 'readiness', 'certainty']))}</div>`);
    }

    if(tab === 'gecmis'){
      return String(html`${head}${K.Ledger([historyEntry(), baselineEntry()])}
      <div class="mt-24">${raw(UI.rail(['readiness', 'certainty']))}</div>`);
    }

    return String(html`${head}${K.Ledger([
      formEntry(), quickEntry(), statusEntry(), whyEntry(),
    ])}
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
