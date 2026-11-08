/* Kurulum sihirbazı — sistemin kişiselleştiği yer.

   Beş adım: kim · hedef · takvim · kapasite · seviye.
   Sonunda plan üretilir; iki farklı aday aynı planı almaz.
   Sonradan Rehber → Ayarlar’dan tek tek değiştirilebilir. */
window.LIFEOS.PARCA.yazilar({
  'ays.core.setup.sinav-tarihi-baslangictan-so-2':'Sınav tarihi başlangıçtan sonra olmalı.',
  'ays.core.setup.takvimde-yalniz':'Takvimde yalnız ',
  'ays.core.setup.plan-bu-sureye-sikistirilir':'Plan bu süreye sıkıştırılır; yüksek frekanslı konular öne alınır, gerisi düşer.',
  'ays.core.setup.tam-mufredat':'Tam müfredat ',
  'ays.core.setup.ad-ve-sehir-yalniz-bu':'Ad ve şehir yalnız bu cihazda tutulur. ',
  'ays.core.setup.ai-koca-gonderilen-verilerde':'AI koça gönderilen verilerden bu alanlar otomatik çıkarılır.',
  'ays.core.setup.obp-hesabi-icin':'OBP hesabı için',
  'ays.core.setup.sira-hedefi-puandan-daha-guv':'Sıra hedefi puandan daha güvenilirdir: aynı net farklı yıllarda ',
  'ays.core.setup.bu-pazartesi':'Bu pazartesi',
  'ays.core.setup.osym-duyurusuyla-guncelle':'ÖSYM duyurusuyla güncelle',
  'ays.core.setup.kapasiteyi-oldugundan-yuksek':'Kapasiteyi olduğundan yüksek yazma. Plan bu sayıya göre kurulur; ',
  'ays.core.setup.gunde':'Günde ',
  'ays.core.setup.takvim-gecersiz-geri-donup-d':'Takvim geçersiz; geri dönüp düzelt.',
  'ays.core.setup.adim':'Adım ',
  'ays.core.setup.plani-uret-ve-basla':'Planı üret ve başla',
  'ays.core.setup.kaydet-ve-plani-guncelle':'Kaydet ve planı güncelle',
});

window.LIFEOS.PARCA.yazilar({
  'ays.core.setup.seni-taniyalim':'Seni tanıyalım',
  'ays.core.setup.bu-bilgiler-cihazda-kalir-ko':'Bu bilgiler cihazda kalır, koça gönderilmez',
  'ays.core.setup.hedefin-ne':'Hedefin ne?',
  'ays.core.setup.program-adi-ve-hedef-basari':'Program adı ve hedef başarı sırası',
  'ays.core.setup.takvimin':'Takvimin',
  'ays.core.setup.ne-zaman-basliyorsun-sinav-n':'Ne zaman başlıyorsun, sınav ne zaman',
  'ays.core.setup.haftalik-kapasiten':'Haftalık kapasiten',
  'ays.core.setup.gercekci-ol-plan-buna':'Gerçekçi ol — plan buna göre kurulur',
  'ays.core.setup.su-anki-seviyen':'Şu anki seviyen',
  'ays.core.setup.planin-hizini-belirler':'Planın hızını belirler',
  'ays.core.setup.ad':'Ad',
  'ays.core.setup.adin':'adın',
  'ays.core.setup.sehir':'Şehir',
  'ays.core.setup.hedef-program':'Hedef program',
  'ays.core.setup.or-cukurova-universitesi-hem':'ör. Çukurova Üniversitesi Hemşirelik',
  'ays.core.setup.hedef-basari-sirasi':'Hedef başarı sırası',
  'ays.core.setup.or-84285':'ör. 84285',
  'ays.core.setup.diploma-notu':'Diploma notu',
  'ays.core.setup.gelecek-pazartesi':'Gelecek pazartesi',
  'ays.core.setup.hemen-bugunden':'Hemen bugünden',
  'ays.core.setup.hizli-secim':'Hızlı seçim',
  'ays.core.setup.baslangic':'Başlangıç',
  'ays.core.setup.tyt-sinav-tarihi':'TYT sınav tarihi',
  'ays.core.setup.haftalik-saat':'Haftalık saat',
  'ays.core.setup.calisma-gunu':'Çalışma günü',
  'ays.core.setup.uyku-hedefi-saat':'Uyku hedefi (saat)',
  'ays.core.setup.zorlandigin-dersler':'Zorlandığın dersler',
  'ays.core.setup.sectigin-dersler-plandan-dus':'Seçtiğin dersler plandan düşürülmez, öne alınır.',
  'ays.core.setup.planin-boyle-olacak':'Planın böyle olacak',
  'ays.core.setup.hafta':'Hafta',
  'ays.core.setup.haftada-konu':'Haftada konu',
  'ays.core.setup.kapsama':'Kapsama',
  'ays.core.setup.aylik-degerlendirme':'Aylık değerlendirme',
  'ays.core.setup.i-lk-hafta':'İlk hafta:',
  'ays.core.setup.geri':'Geri',
  'ays.core.setup.vazgec':'Vazgeç',
  'ays.core.setup.devam':'Devam',
  'ays.core.setup.sinav-tarihi-baslangictan-so':'Sınav tarihi başlangıçtan sonra olmalı',
  'ays.core.setup.hedef-basari-sirasi-gerekli':'Hedef başarı sırası gerekli — 2. adıma dön',
  'ays.core.setup.kurulum':'Kurulum',
  'ays.core.setup.programini-kuralim':'Programını kuralım',
  'ays.core.setup.bes-kisa-adim-hedef-takvim':'Beş kısa adım: hedef, takvim, kapasite ve seviye. Sonunda plan sana göre üretilir — ',
  'ays.core.setup.basla':'Başla',
});


window.R = window.R || {};

R.Setup = (function(){
  const U = R.U, M = R.Model, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  /* BEŞ ADIM KALIR (K'nin kararı, EKIP-PLANI §8-11): katalog 171 «her adım
     tek soru» der; AYS'nin beş adımı plan motorunun beş ayrı sorusudur (kim,
     hedef, takvim, kapasite, seviye). Üçe indirmek adım başına iki soru
     demekti. SPİ/ESP üç adımdır çünkü onlarınki tanıtım · sınır · form. */
  const STEPS = [
    { id:'kim',      title:yz('ays.core.setup.seni-taniyalim'),     note:yz('ays.core.setup.bu-bilgiler-cihazda-kalir-ko') },
    { id:'hedef',    title:yz('ays.core.setup.hedefin-ne'),        note:yz('ays.core.setup.program-adi-ve-hedef-basari') },
    { id:'takvim',   title:yz('ays.core.setup.takvimin'),           note:yz('ays.core.setup.ne-zaman-basliyorsun-sinav-n') },
    { id:'kapasite', title:yz('ays.core.setup.haftalik-kapasiten'), note:yz('ays.core.setup.gercekci-ol-plan-buna') },
    { id:'seviye',   title:yz('ays.core.setup.su-anki-seviyen'),    note:yz('ays.core.setup.planin-hizini-belirler') },
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
    if(p.days <= 0) return K.Notice({ tone:'danger', body:yz('ays.core.setup.sinav-tarihi-baslangictan-so-2') });
    if(p.tooShort) return K.Notice({ tone:'warn', body:yz('ays.core.setup.takvimde-yalniz')+p.weeks+' hafta var. '
      + yz('ays.core.setup.plan-bu-sureye-sikistirilir') });
    if(p.compressed) return K.Notice({ tone:'warn', title:p.weeks+' haftalık program.',
      body:yz('ays.core.setup.tam-mufredat')+R.PROGRAM.totalWeeks+' haftaya göre yazılmıştır. Bu takvimde plan '
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
      K.Notice({ tone:'info', body:yz('ays.core.setup.ad-ve-sehir-yalniz-bu')
        + yz('ays.core.setup.ai-koca-gonderilen-verilerde') }),
      K.Cols(2, [
        K.Field({ label:yz('ays.core.setup.ad'), input:K.Input({ id:'sw-name', value:draft.name, placeholder:yz('ays.core.setup.adin') }) }),
        K.Field({ label:yz('ays.core.setup.sehir'), hint:'isteğe bağlı', input:K.Input({ id:'sw-city', value:draft.city }) }),
      ]),
    ]);
  }

  function bodyHedef(){
    return K.Stack([
      K.Field({ label:yz('ays.core.setup.hedef-program'), hint:'üniversite ve bölüm',
        input:K.Input({ id:'sw-program', value:draft.program, placeholder:yz('ays.core.setup.or-cukurova-universitesi-hem') }) }),
      K.Cols(2, [
        K.Field({ label:yz('ays.core.setup.hedef-basari-sirasi'), hint:'geçen yılın taban sırası',
          input:K.Input({ id:'sw-rank', type:'number', numeric:true, value:draft.targetRank,
            placeholder:yz('ays.core.setup.or-84285') }) }),
        K.Field({ label:yz('ays.core.setup.diploma-notu'), hint:yz('ays.core.setup.obp-hesabi-icin'),
          input:K.Input({ id:'sw-diploma', type:'number', numeric:true, min:0, max:100, value:draft.diplomaGrade }) }),
      ]),
      K.Notice({ tone:'info', body:yz('ays.core.setup.sira-hedefi-puandan-daha-guv')
        + 'farklı puana döner ama sıra karşılaştırılabilir kalır. YÖK Atlas’tan bakabilirsin.' }),
    ]);
  }

  function bodyTakvim(){
    const todayMon = nextMonday(U.todayISO());
    const picks = [
      { start:todayMon, label:todayMon === U.todayISO() ? 'Bugün' : yz('ays.core.setup.bu-pazartesi') },
      { start:U.iso(U.addDays(U.parse(todayMon), 7)), label:yz('ays.core.setup.gelecek-pazartesi') },
      { start:U.todayISO(), label:yz('ays.core.setup.hemen-bugunden') },
    ];
    return K.Stack([
      html`<div class="stack-xs"><span class="mono-label">${yz('ays.core.setup.hizli-secim')}</span>
        ${K.Row(map(picks, q => K.Button({ label:q.label, size:'sm', act:'setup-quick',
          data:{ 'data-start':q.start } })), { wrap:true })}</div>`,
      K.Cols(2, [
        K.Field({ label:yz('ays.core.setup.baslangic'), hint:'pazartesi önerilir',
          input:K.Input({ id:'sw-start', type:'date', value:draft.startDate }) }),
        K.Field({ label:yz('ays.core.setup.tyt-sinav-tarihi'), hint:yz('ays.core.setup.osym-duyurusuyla-guncelle'),
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
        K.Field({ label:yz('ays.core.setup.haftalik-saat'), input:K.Input({ id:'sw-cap', type:'number', numeric:true,
          step:1, min:4, max:70, value:cap, change:'setup-cap' }) }),
        K.Field({ label:yz('ays.core.setup.calisma-gunu'), input:K.Select({ id:'sw-days', change:'setup-cap',
          value:draft.studyDaysPerWeek,
          options:[4, 5, 6, 7].map(n => ({ value:n, label:n+' gün' })) }) }),
        K.Field({ label:yz('ays.core.setup.uyku-hedefi-saat'), input:K.Input({ id:'sw-sleep', type:'number',
          numeric:true, step:0.5, min:5, max:11, value:draft.sleepTarget }) }),
      ]),
      html`<div id="sw-caphint">${capacityHint(cap, draft.studyDaysPerWeek)}</div>`,
      K.Notice({ tone:'warn', body:yz('ays.core.setup.kapasiteyi-oldugundan-yuksek')
        + 'gerçekçi olmayan kapasite, tamamlama oranını da anlamsız kılar.' }),
    ]);
  }

  function capacityHint(cap, days){
    const perDay = U.round(cap / (days || 6), 1);
    const tone = perDay > 7 ? 'danger' : perDay > 5.5 ? 'warn' : 'ok';
    const note = perDay > 7
      ? yz('ays.core.setup.gunde')+perDay+' saat sürdürülebilir değil. İki hafta sonra plan çöker.'
      : perDay > 5.5
      ? yz('ays.core.setup.gunde')+perDay+' saat yoğun. Okul ve dershane varsa gerçekçi mi, iki kez düşün.'
      : yz('ays.core.setup.gunde')+perDay+' saat · '+days+' gün. Sürdürülebilir görünüyor.';
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
      html`<div class="stack-xs mt-12"><span class="mono-label">${yz('ays.core.setup.zorlandigin-dersler')}</span>
        <span class="tiny dim">${yz('ays.core.setup.sectigin-dersler-plandan-dus')}</span>
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
    if(p.days <= 0) return K.Notice({ tone:'danger', body:yz('ays.core.setup.takvim-gecersiz-geri-donup-d') });
    const plan = R.Planner.generate(draft, p.weeks);
    const m = plan.meta;
    return K.Card({ flat:true, pad:'sm', body:html`
      <span class="mono-label">${yz('ays.core.setup.planin-boyle-olacak')}</span>
      ${K.Cols(4, [
        K.Stat({ label:yz('ays.core.setup.hafta'), value:m.total }),
        K.Stat({ label:yz('ays.core.setup.haftada-konu'), value:m.perWeek }),
        K.Stat({ label:yz('ays.core.setup.kapsama'), value:'%'+m.coverage, tone:m.coverage >= 80 ? 'ok' : 'warn' }),
        K.Stat({ label:yz('ays.core.setup.aylik-degerlendirme'), value:(m.gates || []).length }),
      ])}
      <p class="tiny dim mt-8">${yz('ays.core.setup.i-lk-hafta')} ${plan.weeks[0].topics.join(' · ')}</p>` });
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
      subtitle:s.note,   /* adım sayısı artık ilerleme çubuğunda (171) */
      wide:true,
      body:String(K.Stack([
        /* İlerleme ÜSTTE (171): kaçıncı adımda olunduğu tanıtımdan önce
           görünür; ekran okuyucu `progressbar`dan duyar. */
        html`<div class="kurulum__ilerleme" role="progressbar" aria-label="Kurulum adımı"
          aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${step + 1}"
          aria-valuetext="${yz('ays.core.setup.adim') + (step + 1) + ' / ' + STEPS.length}">
          <span class="kurulum__sayac">${yz('ays.core.setup.adim') + (step + 1) + ' / ' + STEPS.length}</span>
          <span class="kurulum__cubuk" aria-hidden="true"><i style="${'width:' + Math.round(100 * (step + 1) / STEPS.length) + '%'}"></i></span>
        </div>`,
        /* TANITIM AFISI — yalniz ILK kurulumun ILK adiminda. Ayarlardan
           yeniden acilan sihirbazda gosterilmez: orada kullanici zaten
           sistemin icinde ve bir tanitim afisi, bildigi seyi anlatan
           bir gecikmedir.

           `alt` bos ve `aria-hidden`: afisteki cumleler adimlarin
           icinde gercek metin olarak duruyor. */
        when(isFirstRun && first, () => raw(window.LIFEOS.TANITIM_HTML('ays'))),
        BODIES[s.id](),
      ])),
      footer:String(html`
        ${when(!first, () => K.Button({ label:yz('ays.core.setup.geri'), act:'setup-back' }))}
        ${when(first && !isFirstRun, () => K.Button({ label:yz('ays.core.setup.vazgec'), act:'sheet-close' }))}
        ${last
          ? K.Button({ label:isFirstRun ? yz('ays.core.setup.plani-uret-ve-basla') : yz('ays.core.setup.kaydet-ve-plani-guncelle'),
              tone:'primary', act:'setup-save' })
          : K.Button({ label:yz('ays.core.setup.devam'), tone:'primary', act:'setup-next' })}`),
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
      if(p.days <= 0){ UI.toast(yz('ays.core.setup.sinav-tarihi-baslangictan-so')); return; }
    }
    /* King 5 D8 (deneme 2026-11-08): boş sıra burada durur; eskiden ancak 5. adımda «2. adıma dön» deniyordu. */
    if(STEPS[step].id === 'hedef' && !draft.targetRank){ UI.toast(yz('ays.core.setup.hedef-basari-sirasi-gerekli').split(' — ')[0]); return; }
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
      UI.toast(yz('ays.core.setup.sinav-tarihi-baslangictan-so'));
      return;
    }
    if(!draft.targetRank){
      UI.toast(yz('ays.core.setup.hedef-basari-sirasi-gerekli'));
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
    /* Kurulum gunu: kopus sayaci (calc.protocolTriggers) bundan onceki
       gunleri «kayitsiz gun» saymaz. Eski profillerde yoktur; o zaman
       davranis degismez. */
    if(!p.setupAt) p.setupAt = U.todayISO();
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
      icon:'flag', label:yz('ays.core.setup.kurulum'), title:yz('ays.core.setup.programini-kuralim'),
      why:yz('ays.core.setup.bes-kisa-adim-hedef-takvim')
        + 'kimsenin planı bir diğerininkiyle aynı olmaz.',
      action:K.Button({ label:yz('ays.core.setup.basla'), tone:'primary', act:'setup-open' }),
    }));
  }

  return { needed, open, render, next, back, save, quick, card, setLevel, toggleWeak,
    preview, previewHtml, nextMonday, refreshPreview, STEPS };
})();
