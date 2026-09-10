/* Kurulum sihirbazı — sistemin kişiselleştiği yer.

   Beş adım: kim · hedef · takvim · kapasite · seviye.
   Sonunda plan üretilir; iki farklı aday aynı planı almaz.
   Sonradan Rehber → Ayarlar’dan tek tek değiştirilebilir. */

window.R = window.R || {};

R.Setup = (function(){
  const U = R.U, M = R.Model, UI = R.UI, S = R.S;
  const { html, when, map } = R.h;
  const K = R.C;

  const STEPS = [
    { id:'kim',      title:'Seni tanıyalım',     note:'Bu bilgiler cihazda kalır, koça gönderilmez' },
    { id:'hedef',    title:'Hedefin ne?',        note:'Program adı ve hedef başarı sırası' },
    { id:'takvim',   title:'Takvimin',           note:'Ne zaman başlıyorsun, sınav ne zaman' },
    { id:'kapasite', title:'Haftalık kapasiten', note:'Gerçekçi ol — plan buna göre kurulur' },
    { id:'seviye',   title:'Şu anki seviyen',    note:'Planın hızını belirler' },
  ];

  let step = 0;
  let draft = null;

  function needed(){ return !S.profile || !S.profile.setupDone; }

  /* ---------- takvim önizlemesi ---------- */

  function preview(startISO, examISO){
    const days = U.diffDays(startISO, examISO);
    const weeks = Math.max(0, Math.ceil((days + 1)/7));
    const capped = Math.min(R.PROGRAM.totalWeeks, weeks);
    return {
      days, weeks:capped, rawWeeks:weeks,
      compressed: capped < R.PROGRAM.totalWeeks,
      tooShort: capped < 4,
      startsInPast: U.diffDays(U.todayISO(), startISO) < 0,
    };
  }

  function previewHtml(startISO, examISO){
    const p = preview(startISO, examISO);
    if(p.days <= 0) return K.Notice({ tone:'danger', body:'Sınav tarihi başlangıçtan sonra olmalı.' });
    if(p.tooShort) return K.Notice({ tone:'warn', body:'Takvimde yalnız '+p.weeks+' hafta var. '
      + 'Plan bu süreye sıkıştırılır; yüksek frekanslı konular öne alınır, gerisi düşer.' });
    if(p.compressed) return K.Notice({ tone:'warn', title:p.weeks+' haftalık program.',
      body:'Tam müfredat '+R.PROGRAM.totalWeeks+' haftaya göre yazılmıştır. Bu takvimde plan '
        + 'sıkıştırılır: düşük frekanslı konular plana girmez, hangileri olduğunu Program ekranında görürsün.' });
    return K.Notice({ tone:'ok', body:p.weeks+' haftalık tam program. Haftalar '
      + U.fmtDate(startISO)+' gününden itibaren sayılır.' });
  }

  function nextMonday(fromISO){
    const d = U.parse(fromISO);
    const dow = U.weekdayIndex(d);
    return U.iso(dow === 0 ? d : U.addDays(d, 7-dow));
  }

  /* ---------- taslak ---------- */

  function startDraft(){
    const p = S.profile || M.defaultProfile();
    const todayMon = nextMonday(U.todayISO());
    draft = {
      name:p.name || '',
      city:p.city || '',
      program:p.program || '',
      targetRank:p.targetRank || '',
      startDate:p.startDate || todayMon,
      examTytISO:p.examTytISO || R.PROGRAM.examTytISO,
      capacityHoursPerWeek:p.capacityHoursPerWeek || 21,
      studyDaysPerWeek:p.studyDaysPerWeek || 6,
      sleepTarget:p.sleepTarget || 7.5,
      diplomaGrade:p.diplomaGrade || 70,
      level:p.level || 'orta',
      weakSubjects:(p.weakSubjects || []).slice(),
    };
  }

  function read(id){
    const el = document.getElementById(id);
    return el ? el.value : '';
  }
  function capture(){
    if(!draft) return;
    const s = STEPS[step].id;
    if(s === 'kim'){
      draft.name = read('sw-name').trim() || draft.name;
      draft.city = read('sw-city').trim();
    }else if(s === 'hedef'){
      draft.program = read('sw-program').trim() || draft.program;
      draft.targetRank = Number(read('sw-rank')) || draft.targetRank || null;
      draft.diplomaGrade = U.clamp(Number(read('sw-diploma')) || 0, 0, 100) || draft.diplomaGrade;
    }else if(s === 'takvim'){
      draft.startDate = read('sw-start') || draft.startDate;
      draft.examTytISO = read('sw-exam') || draft.examTytISO;
    }else if(s === 'kapasite'){
      draft.capacityHoursPerWeek = Number(read('sw-cap')) || draft.capacityHoursPerWeek;
      draft.studyDaysPerWeek = Number(read('sw-days')) || draft.studyDaysPerWeek;
      draft.sleepTarget = Number(read('sw-sleep')) || draft.sleepTarget;
    }
  }

  /* ---------- adım gövdeleri ---------- */

  function bodyKim(){
    return K.Stack([
      K.Notice({ tone:'info', body:'Ad ve şehir yalnız bu cihazda tutulur. '
        + 'AI koça gönderilen verilerden bu alanlar otomatik çıkarılır.' }),
      K.Cols(2, [
        K.Field({ label:'Ad', input:K.Input({ id:'sw-name', value:draft.name, placeholder:'adın' }) }),
        K.Field({ label:'Şehir', hint:'isteğe bağlı', input:K.Input({ id:'sw-city', value:draft.city }) }),
      ]),
    ]);
  }

  function bodyHedef(){
    return K.Stack([
      K.Field({ label:'Hedef program', hint:'üniversite ve bölüm',
        input:K.Input({ id:'sw-program', value:draft.program, placeholder:'ör. Çukurova Üniversitesi Hemşirelik' }) }),
      K.Cols(2, [
        K.Field({ label:'Hedef başarı sırası', hint:'geçen yılın taban sırası',
          input:K.Input({ id:'sw-rank', type:'number', numeric:true, value:draft.targetRank,
            placeholder:'ör. 84285' }) }),
        K.Field({ label:'Diploma notu', hint:'OBP hesabı için',
          input:K.Input({ id:'sw-diploma', type:'number', numeric:true, min:0, max:100, value:draft.diplomaGrade }) }),
      ]),
      K.Notice({ tone:'info', body:'Sıra hedefi puandan daha güvenilirdir: aynı net farklı yıllarda '
        + 'farklı puana döner ama sıra karşılaştırılabilir kalır. YÖK Atlas’tan bakabilirsin.' }),
    ]);
  }

  function bodyTakvim(){
    const todayMon = nextMonday(U.todayISO());
    const picks = [
      { start:todayMon, label:todayMon === U.todayISO() ? 'Bugün' : 'Bu pazartesi' },
      { start:U.iso(U.addDays(U.parse(todayMon), 7)), label:'Gelecek pazartesi' },
      { start:U.todayISO(), label:'Hemen bugünden' },
    ];
    return K.Stack([
      html`<div class="stack-xs"><span class="mono-label">Hızlı seçim</span>
        ${K.Row(map(picks, q => K.Button({ label:q.label, size:'sm', act:'setup-quick',
          data:{ 'data-start':q.start } })), { wrap:true })}</div>`,
      K.Cols(2, [
        K.Field({ label:'Başlangıç', hint:'pazartesi önerilir',
          input:K.Input({ id:'sw-start', type:'date', value:draft.startDate }) }),
        K.Field({ label:'TYT sınav tarihi', hint:'ÖSYM duyurusuyla güncelle',
          input:K.Input({ id:'sw-exam', type:'date', value:draft.examTytISO }) }),
      ]),
      html`<div id="su-preview">${previewHtml(draft.startDate, draft.examTytISO)}</div>`,
    ]);
  }

  function bodyKapasite(){
    const cap = draft.capacityHoursPerWeek;
    const perDay = U.round(cap / (draft.studyDaysPerWeek || 6), 1);
    return K.Stack([
      K.Cols(3, [
        K.Field({ label:'Haftalık saat', input:K.Input({ id:'sw-cap', type:'number', numeric:true,
          step:1, min:4, max:70, value:cap, change:'setup-cap' }) }),
        K.Field({ label:'Çalışma günü', input:K.Select({ id:'sw-days', change:'setup-cap',
          value:draft.studyDaysPerWeek,
          options:[4, 5, 6, 7].map(n => ({ value:n, label:n+' gün' })) }) }),
        K.Field({ label:'Uyku hedefi (saat)', input:K.Input({ id:'sw-sleep', type:'number',
          numeric:true, step:0.5, min:5, max:11, value:draft.sleepTarget }) }),
      ]),
      html`<div id="sw-caphint">${capacityHint(cap, draft.studyDaysPerWeek)}</div>`,
      K.Notice({ tone:'warn', body:'Kapasiteyi olduğundan yüksek yazma. Plan bu sayıya göre kurulur; '
        + 'gerçekçi olmayan kapasite, tamamlama oranını da anlamsız kılar.' }),
    ]);
  }

  function capacityHint(cap, days){
    const perDay = U.round(cap / (days || 6), 1);
    const tone = perDay > 7 ? 'danger' : perDay > 5.5 ? 'warn' : 'ok';
    const note = perDay > 7
      ? 'Günde '+perDay+' saat sürdürülebilir değil. İki hafta sonra plan çöker.'
      : perDay > 5.5
      ? 'Günde '+perDay+' saat yoğun. Okul ve dershane varsa gerçekçi mi, iki kez düşün.'
      : 'Günde '+perDay+' saat · '+days+' gün. Sürdürülebilir görünüyor.';
    return K.Notice({ tone, body:note });
  }

  function bodySeviye(){
    const levels = Object.keys(R.Planner.LEVELS).map(k => R.Planner.LEVELS[k]);
    return K.Stack([
      html`<div class="levelpick">${map(levels, lv => html`
        <button class="${draft.level === lv.id ? 'levelbtn is-on' : 'levelbtn'}"
          data-act="setup-level" data-level="${lv.id}"
          aria-pressed="${draft.level === lv.id ? 'true' : 'false'}">
          <b>${lv.name}</b><span class="tiny dim">${lv.note}</span>
        </button>`)}</div>`,
      html`<div class="stack-xs mt-12"><span class="mono-label">Zorlandığın dersler</span>
        <span class="tiny dim">Seçtiğin dersler plandan düşürülmez, öne alınır.</span>
        ${K.Row(map(R.SUBJECTS, s => K.Chip({
          label:s.name, on:draft.weakSubjects.indexOf(s.id) >= 0,
          act:'setup-weak', data:{ 'data-id':s.id },
        })), { wrap:true })}</div>`,
      html`<div id="sw-planpreview">${planPreview()}</div>`,
    ]);
  }

  /* Son adımda planın ne olacağını önceden göster. */
  function planPreview(){
    const p = preview(draft.startDate, draft.examTytISO);
    if(p.days <= 0) return K.Notice({ tone:'danger', body:'Takvim geçersiz; geri dönüp düzelt.' });
    const plan = R.Planner.generate(draft, p.weeks);
    const m = plan.meta;
    return K.Card({ flat:true, pad:'sm', body:html`
      <span class="mono-label">Planın böyle olacak</span>
      ${K.Cols(4, [
        K.Stat({ label:'Hafta', value:m.total }),
        K.Stat({ label:'Haftada konu', value:m.perWeek }),
        K.Stat({ label:'Kapsama', value:'%'+m.coverage, tone:m.coverage >= 80 ? 'ok' : 'warn' }),
        K.Stat({ label:'Karar kapısı', value:(m.gates || []).length }),
      ])}
      <p class="tiny dim mt-8">İlk hafta: ${plan.weeks[0].topics.join(' · ')}</p>` });
  }

  const BODIES = { kim:bodyKim, hedef:bodyHedef, takvim:bodyTakvim, kapasite:bodyKapasite, seviye:bodySeviye };

  /* ---------- sihirbaz ---------- */

  function open(opts){
    const o = opts || {};
    if(!draft) startDraft();
    if(o.step != null) step = o.step;
    if(o.calendarOnly){ step = 2; }
    render();
  }

  function render(){
    const s = STEPS[step];
    const first = step === 0;
    const last = step === STEPS.length - 1;
    const isFirstRun = needed();

    UI.sheet({
      title:s.title,
      subtitle:'Adım '+(step+1)+' / '+STEPS.length+' · '+s.note,
      wide:true,
      body:String(K.Stack([
        html`<div class="wizsteps">${map(STEPS, (x, i) => html`
          <span class="${i === step ? 'wizstep is-on' : i < step ? 'wizstep is-done' : 'wizstep'}"
            title="${x.title}"></span>`)}</div>`,
        BODIES[s.id](),
      ])),
      footer:String(html`
        ${when(!first, () => K.Button({ label:'Geri', act:'setup-back' }))}
        ${when(first && !isFirstRun, () => K.Button({ label:'Vazgeç', act:'sheet-close' }))}
        ${last
          ? K.Button({ label:isFirstRun ? 'Planı üret ve başla' : 'Kaydet ve planı güncelle',
              tone:'primary', act:'setup-save' })
          : K.Button({ label:'Devam', tone:'primary', act:'setup-next' })}`),
      noFocus:true,
    });

    ['sw-start', 'sw-exam'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.addEventListener('change', refreshPreview);
    });
  }

  function refreshPreview(){
    capture();
    const box = document.getElementById('su-preview');
    if(box) box.innerHTML = String(previewHtml(draft.startDate, draft.examTytISO));
    const cap = document.getElementById('sw-caphint');
    if(cap) cap.innerHTML = String(capacityHint(draft.capacityHoursPerWeek, draft.studyDaysPerWeek));
    const pp = document.getElementById('sw-planpreview');
    if(pp) pp.innerHTML = String(planPreview());
  }

  function next(){
    capture();
    if(STEPS[step].id === 'takvim'){
      const p = preview(draft.startDate, draft.examTytISO);
      if(p.days <= 0){ UI.toast('Sınav tarihi başlangıçtan sonra olmalı'); return; }
    }
    step = Math.min(step + 1, STEPS.length - 1);
    render();
  }
  function back(){
    capture();
    step = Math.max(0, step - 1);
    render();
  }
  function setLevel(id){
    capture();
    draft.level = id;
    render();
  }
  function toggleWeak(id){
    capture();
    const i = draft.weakSubjects.indexOf(id);
    if(i >= 0) draft.weakSubjects.splice(i, 1); else draft.weakSubjects.push(id);
    render();
  }
  function quick(startISO){
    const el = document.getElementById('sw-start');
    if(el){ el.value = startISO; refreshPreview(); }
  }

  async function save(){
    capture();
    if(U.diffDays(draft.startDate, draft.examTytISO) <= 0){
      UI.toast('Sınav tarihi başlangıçtan sonra olmalı');
      return;
    }
    if(!draft.targetRank){
      UI.toast('Hedef başarı sırası gerekli — 2. adıma dön');
      step = 1; render();
      return;
    }
    const p = S.profile;
    p.name = draft.name;
    p.city = draft.city;
    p.program = draft.program || p.program;
    p.targetRank = draft.targetRank;
    p.diplomaGrade = draft.diplomaGrade;
    p.startDate = draft.startDate;
    p.examTytISO = draft.examTytISO;
    p.examAytISO = U.iso(U.addDays(U.parse(draft.examTytISO), 1));
    p.capacityHoursPerWeek = draft.capacityHoursPerWeek;
    p.studyDaysPerWeek = draft.studyDaysPerWeek;
    p.sleepTarget = draft.sleepTarget;
    p.level = draft.level;
    p.weakSubjects = draft.weakSubjects;
    p.setupDone = true;
    await M.saveProfile();

    const plan = await M.ensurePlan(true);
    await M.ensureWeek(M.currentWeek());
    await M.ensureDay(U.today());
    await R.Auto.syncDayBlocks();

    draft = null;
    step = 0;
    UI.closeSheet();
    UI.toast(plan.meta.total+' haftalık plan üretildi · %'+plan.meta.coverage+' kapsama');
    R.App.render();
  }

  /* Bugün ekranındaki kurulum kartı */
  function card(){
    if(!needed()) return '';
    return String(K.NextUp({
      icon:'flag', label:'Kurulum', title:'Programını kuralım',
      why:'Beş kısa adım: hedef, takvim, kapasite ve seviye. Sonunda plan sana göre üretilir — '
        + 'kimsenin planı bir diğerininkiyle aynı olmaz.',
      action:K.Button({ label:'Başla', tone:'primary', act:'setup-open' }),
    }));
  }

  return { needed, open, render, next, back, save, quick, card, setLevel, toggleWeak,
    preview, previewHtml, nextMonday, refreshPreview, STEPS };
})();
