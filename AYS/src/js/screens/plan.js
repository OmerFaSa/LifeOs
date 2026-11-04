/* Program — tum programin zaman cizgisi ve yogunluk haritasi.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */

window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'ays', sira:130, group:'Git', label:'40 haftalık plan', icon:'map', route:'plan', run(){ R.App.go('plan'); } });
window.LIFEOS.PARCA.yazilar({
  'ays.plan.simdi':'şimdi',
  'ays.plan.imzali':'imzalı',
  'ays.plan.tamamlandi':'tamamlandı',
  'ays.plan.planlandi':'planlandı',
  'ays.plan.konulari-cikarmak-yerine-dah':'Konuları çıkarmak yerine daha çok çalışabilirsin.',
  'ays.plan.su-an-ders-gunu':'Şu an ders günü',
  'ays.plan.gunde':'Günde',
  'ays.plan.haftada':'· haftada',
  'ays.plan.uygula':'Uygula',
  'ays.plan.gunluk-sureyi-artirmak-bu-pl':'Günlük süreyi artırmak bu planda konu getirmez.',
  'ays.plan.sure-artisi-haftada':'Süre artışı haftada',
  'ays.plan.konuda-durur-haftada-en-fazl':'konuda durur: haftada en fazla',
  'ays.plan.konu-secmissin':'konu seçmişsin.',
  'ays.plan.tavani-degistir':'Tavanı değiştir',
  'ays.plan.takvim-dar':'Takvim dar:',
  'ays.plan.haftada-hepsi-icin-haftada':'haftada hepsi için haftada',
  'ays.plan.konu-gerekirdi-en-yuksek-tav':'konu gerekirdi; en yüksek tavanla (',
  'ays.plan.bile-sigmaz':') bile sığmaz.',
  'ays.plan.ile-bile-hepsi-sigmaz':'ile bile hepsi sığmaz.',
  'ays.plan.program':'Program',
  'ays.plan.sabit-mufredat-kullaniliyor':'Sabit müfredat kullanılıyor',
  'ays.plan.bu-plan-sana-gore-uretildi':'Bu plan sana göre üretildi',
  'ays.plan.yeniden-hesapla':'Yeniden hesapla',
  'ays.plan.kapsama':'Kapsama',
  'ays.plan.kapasite':'Kapasite',
  'ays.plan.haftalik':'haftalık',
  'ays.plan.karar-kapisi':'Karar kapısı',
  'ays.plan.konu-islenen':'Konu işlenen',
  'ays.plan.prova-haric':'prova hariç',
  'ays.plan.takvimin-ve-haftalik':'Takvimin ve haftalık',
  'ays.plan.saatlik-kapasiten':'saatlik kapasiten',
  'ays.plan.konuya-yetiyor-dusenler':'konuya yetiyor. Düşenler',
  'ays.plan.dusuk':'düşük,',
  'ays.plan.orta-frekansli':'orta frekanslı;',
  'ays.plan.yuksek-frekansli-konu-da-dus':'yüksek frekanslı konu da düşmek zorunda kaldı',
  'ays.plan.takvim-gercekten-dar-hedefi':'— takvim gerçekten dar, hedefi gözden geçir.',
  'ays.plan.yuksek-frekansli-hicbir-konu':'yüksek frekanslı hiçbir konu düşmedi',
  'ays.plan.bu-konular-silinmedi-dersler':'Bu konular silinmedi — Dersler ekranında öncelik sırasına göre duruyor, boşluk buldukça çalışırsın.',
  'ays.plan.plan-sabit-degildir-takvimi':'Plan sabit değildir: takvimi, kapasiteyi ya da seviyeni değiştirirsen yeniden üretilir. Geride kalırsan “Yeniden hesapla” kapanmamış konuları öne alır.',
  'ays.plan.plana-girmeyen-konular':'Plana girmeyen konular',
  'ays.plan.i-lerleme':'İlerleme',
  'ays.plan.tamamlandi-2':'tamamlandı.',
  'ays.plan.hafta':'Hafta ',
  'ays.plan.sinava-kalan':'Sınava kalan',
  'ays.plan.kaldi':'kaldı.',
  'ays.plan.planlanan-soru':'Planlanan soru',
  'ays.plan.program-zaman-cizgisi':'Program zaman çizgisi',
  'ays.plan.karar-kapilari-h':'Karar kapıları: H',
  'ays.plan.siradaki-haftalar':'Sıradaki haftalar',
  'ays.plan.calisma-yogunlugu':'Çalışma yoğunluğu',
  'ays.plan.calisildi-koyuluk-yuku-goste':'çalışıldı — koyuluk yükü gösterir',
  'ays.plan.kayit-yok':'kayıt yok',
});
window.LIFEOS.PARCA.sayfa({ id:'plan', modul:'ays', king:{ sira:90, ad:'Program', es:['program', 'plan'] }, cekmece:'plan', ad:'Program', ikon:'map', sira:20 });

R.Screens.plan = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  function WeekRow(n){
    const c = M.curriculumFor(n);
    const cur = M.currentWeek();
    const week = S.weeks[M.weekId(n)];
    const isCurrent = n === cur;
    const isPast = n < cur;
    const comp = (isPast || isCurrent) ? C.planCompletion(n) : null;

    return html`
      <div class="${['tlweek', isCurrent && 'is-current', isPast && 'is-past'].filter(Boolean).join(' ')}"
           data-act="open-week" data-n="${n}" role="button" tabindex="0">
        <div><div class="tlweek__no">H${n}</div>
          <div class="tlweek__dates">${U.fmtRange(M.weekStart(n), M.weekEnd(n))}</div></div>
        <div class="minw0">
          <div class="row-sm wrap"><b class="small">${c.title}</b>
            ${when(isCurrent, () => K.Badge({ label:yz('ays.plan.simdi'), tone:'ok' }))}
            ${when(week && week.signedAt, () => K.Badge({ label:yz('ays.plan.imzali'), tone:'muted' }))}</div>
          <div class="tiny dim mt-2">${c.topics.join(' · ')}</div>
          <div class="tiny dim mt-2">Deneme: ${c.exam}</div>
        </div>
        <div class="tlweek__right right">
          <div class="num small strong">${c.q} soru</div>
          ${comp != null
            ? html`<div class="mt-5">${K.Bar({ value:comp, auto:true })}</div>
                   <div class="tiny dim">%${comp} ${yz('ays.plan.tamamlandi')}</div>`
            : html`<div class="tiny dim">${yz('ays.plan.planlandi')}</div>`}
        </div>
      </div>`;
  }

  /* Faz aralıkları: üretilmiş plan varsa ondan, yoksa sabit fazlardan. */
  function phaseRanges(){
    const total = R.PLAN.totalWeeks;
    const plan = M.activePlan();

    if(plan){
      const out = [];
      plan.weeks.forEach(w => {
        const last = out[out.length-1];
        if(last && last.phase.key === w.phase){ last.to = w.n; return; }
        out.push({ phase:{ key:w.phase, label:w.phaseLabel, theme:w.theme }, from:w.n, to:w.n });
      });
      return out;
    }

    const full = R.PROGRAM.totalWeeks;
    if(total >= full) return R.PHASES.map(p => ({ phase:p, from:p.weeks[0], to:p.weeks[1] }));
    const scale = total / full;
    let prev = 0;
    return R.PHASES.map(p => {
      const to = Math.min(total, Math.max(prev+1, Math.round(p.weeks[1]*scale)));
      const range = { phase:p, from:prev+1, to };
      prev = to;
      return range;
    }).filter(r => r.from <= r.to && r.from <= total);
  }

  function PhaseBlock(range){
    const { phase, from, to } = range;
    const weeks = [];
    let totalQ = 0;
    for(let n = from; n <= to; n++){ weeks.push(n); totalQ += M.curriculumFor(n).q; }
    return html`
      <div class="tlmonth">
        <div class="tlmonth__head"><h2>${phase.label}</h2>
          <span class="small muted">${phase.theme}</span>
          <span class="tiny dim ml-auto">H${from}${to > from ? '–H'+to : ''} · ${U.fmtNum(totalQ)} soru</span></div>
        ${map(weeks, WeekRow)}
      </div>`;
  }

  /* Konu düştüyse: «konuları çıkar» yerine «daha çok çalış» seçeneği,
     SAYIYLA. Satırlar R.Planner.sureSecenekleri'nden gelir: yalnız konu
     geri getiren en küçük günlük süreler, gunluk-sure aksiyonunun
     uygulayacağı kapasiteyle hesaplanmış. «Uygula» önizleme + onaydan
     geçer (orta seviye); sormadan hiçbir şey değişmez. Süre yetmiyorsa
     neden yetmediği söylenir: kullanıcının tavanı mı, takvim mi. */
  function sureTeklifi(m){
    const I = R.Istisna;
    if(!I) return '';
    const simdi = I.temelDakika() || I.sablonDakikasi();
    const sec = R.Planner.sureSecenekleri(S.profile, m.total,
      { simdiDk:simdi, kapasite:I.kapasiteSaati, maxDk:I.DAKIKA.max });
    if(!sec) return '';
    const T = R.Planner.TAVAN;
    let rows = sec.satirlar;
    if(rows.length > 3) rows = rows.slice(0, 2).concat([rows[rows.length - 1]]);
    const enIyi = rows.length ? rows[rows.length - 1].perWeek : sec.perWeek;
    const tavanSiniri = !sec.tam && sec.tavan < T.max && enIyi >= sec.tavan;
    return html`<div class="stack-xs mt-10">
      <div class="small"><b>${yz('ays.plan.konulari-cikarmak-yerine-dah')}</b>
        ${yz('ays.plan.su-an-ders-gunu')} ${U.fmtMin(simdi)}.</div>
      ${map(rows, r => html`<div class="row gap-8" style="justify-content:space-between;align-items:center">
        <span class="small">${yz('ays.plan.gunde')} <b>${U.fmtMin(r.dakika)}</b> → ${r.dusen
          ? r.geriGelen + ' konu geri gelir' : 'bütün konular sığar, ' + r.geriGelen + ' konu geri gelir'}
          <span class="dim">${yz('ays.plan.haftada')} ${r.perWeek} konu</span></span>
        ${K.Button({ label:yz('ays.plan.uygula'), size:'sm', tone:'ghost', act:'sure-oner', data:{ 'data-dakika':r.dakika } })}
      </div>`)}
      ${when(!rows.length, () => html`<p class="small dim">${yz('ays.plan.gunluk-sureyi-artirmak-bu-pl')}</p>`)}
      ${when(tavanSiniri, () => html`<div class="row gap-8" style="justify-content:space-between;align-items:center">
        <span class="small">${yz('ays.plan.sure-artisi-haftada')} ${sec.tavan} ${yz('ays.plan.konuda-durur-haftada-en-fazl')} ${sec.tavan} ${yz('ays.plan.konu-secmissin')}${sec.engel === 'tavan' ? ' Hepsi için haftada ' + sec.gerekenKonu + ' konu gerekir.' : ''}</span>
        ${K.Button({ label:yz('ays.plan.tavani-degistir'), size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'guide' } })}
      </div>`)}
      ${when(sec.engel === 'takvim', () => html`<p class="small">${yz('ays.plan.takvim-dar')} ${m.total} ${yz('ays.plan.haftada-hepsi-icin-haftada')}
        ${sec.gerekenKonu} ${yz('ays.plan.konu-gerekirdi-en-yuksek-tav')}${T.max}${yz('ays.plan.bile-sigmaz')}</p>`)}
      ${when(!sec.tam && !sec.engel && !tavanSiniri && rows.length, () => html`<p class="small dim">${yz('ays.plan.gunde')}
        ${U.fmtMin(sec.maxDk)} ${yz('ays.plan.ile-bile-hepsi-sigmaz')}</p>`)}
    </div>`;
  }

  function planCard(){
    const plan = M.activePlan();
    if(!plan) return K.Card({ title:yz('ays.plan.program'), sub:yz('ays.plan.sabit-mufredat-kullaniliyor'),
      body:K.Notice({ tone:'info', body:'Kişisel plan henüz üretilmedi. Rehber → Ayarlar’dan '
        + 'takvimini ve kapasiteni gir; program sana göre yeniden dizilir.' }) });

    const m = plan.meta;
    const lv = R.Planner.level(m.level);
    const dropped = m.dropped || [];
    const byFreq = {};
    dropped.forEach(d => { byFreq[d.freq] = (byFreq[d.freq] || 0) + 1; });

    return K.Card({
      title:yz('ays.plan.bu-plan-sana-gore-uretildi'), hint:'intensity',
      sub:m.total+' hafta · haftada '+m.perWeek+' ana konu · '+lv.name.toLowerCase(),
      actions:K.Button({ label:yz('ays.plan.yeniden-hesapla'), icon:'refresh', size:'sm', act:'auto-replan' }),
      body:html`
        ${K.Cols(4, [
          K.Stat({ label:yz('ays.plan.kapsama'), value:'%'+m.coverage, tone:m.coverage >= 80 ? 'ok' : 'warn',
            note:m.placed+' / '+m.poolSize+' konu' }),
          K.Stat({ label:yz('ays.plan.kapasite'), value:m.capacityHoursPerWeek, unit:' sa', note:yz('ays.plan.haftalik') }),
          K.Stat({ label:yz('ays.plan.karar-kapisi'), value:(m.gates || []).length, note:'H'+(m.gates || []).join(' · H') }),
          K.Stat({ label:yz('ays.plan.konu-islenen'), value:m.productive, unit:' hafta', note:yz('ays.plan.prova-haric') }),
        ])}

        ${when(dropped.length, () => K.Notice({ tone:'warn',
          title:dropped.length+' konu plana yazılmadı.',
          body:html`${yz('ays.plan.takvimin-ve-haftalik')} ${m.capacityHoursPerWeek} ${yz('ays.plan.saatlik-kapasiten')}
            ${m.placed} ${yz('ays.plan.konuya-yetiyor-dusenler')} ${byFreq.low || 0} ${yz('ays.plan.dusuk')} ${byFreq.mid || 0} ${yz('ays.plan.orta-frekansli')}
            ${byFreq.high
              ? html`<b>${byFreq.high} ${yz('ays.plan.yuksek-frekansli-konu-da-dus')}</b> ${yz('ays.plan.takvim-gercekten-dar-hedefi')}`
              : html`<b>${yz('ays.plan.yuksek-frekansli-hicbir-konu')}</b>.`} ${yz('ays.plan.bu-konular-silinmedi-dersler')}
            ${sureTeklifi(m)}` }))}

        ${when(!dropped.length, () => K.Notice({ tone:'ok',
          body:'Takvimin tüm konulara yetiyor; plan müfredatın tamamını kapsıyor.' }))}

        <p class="tiny dim mt-10">${yz('ays.plan.plan-sabit-degildir-takvimi')}</p>`,
    });
  }

  function droppedCard(){
    const plan = M.activePlan();
    const dropped = plan && plan.meta.dropped ? plan.meta.dropped : [];
    if(!dropped.length) return null;
    const bySubject = {};
    dropped.forEach(d => { (bySubject[d.subjectName] = bySubject[d.subjectName] || []).push(d); });
    return K.Collapsible({
      title:yz('ays.plan.plana-girmeyen-konular'), meta:dropped.length+' konu',
      act:'toggle-dropped', open:!!S.ui.droppedOpen,
      body:html`<div class="stack-xs mt-10">${map(Object.keys(bySubject), name => html`
        <div><span class="mono-label">${name}</span>
          ${K.Row(map(bySubject[name], d => K.Chip({
            label:d.name, act:'open-dropped',
            data:{ 'data-subject':d.subjectId, 'data-topic':d.topicId },
          })), { wrap:true })}
        </div>`)}</div>`,
    });
  }

  /* iPhone (2026-10-02, «program güzel ama H1, H2, H3 diye uzuyor; çalışma
     yoğunluğu falan ekstraya kaçıyor»): dört istatistik tek küçük dönen
     kart; zaman çizgisi bu hafta + sonraki üç hafta, tamamı «Tüm program»
     ile. Isı haritası ve «Program» notu app.js SADE_GIZLI'de. */
  const YAKIN = 3;
  function DonenProgram(cur, totalQ, doneQ){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V || !V.donen) return '';
    const L = window.LIFEOS || {};
    const sayi = s => L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger) + (s.birim ? ' ' + s.birim : ''));
    /* Varsayılan tarih ÖSYM duyurusuna kadar tahmindir (data/curriculum.js). */
    const profilTarihi = R.PLAN.examTytISO !== R.PROGRAM.examTytISO;
    return raw(V.donen({ id:'ays-program', ad:yz('ays.plan.program'), maddeler:[
      { ust:yz('ays.plan.i-lerleme'), sayi:sayi({ deger:M.programProgress(), birim:'%', kesinlik:'computed', formul:'geçen hafta ÷ program haftası' }),
        cumle:yz('ays.plan.tamamlandi-2'), vurgu:yz('ays.plan.hafta') + cur + ' / ' + R.PLAN.totalWeeks + '.', sistem:'ays' },
      { ust:yz('ays.plan.sinava-kalan'), sayi:sayi({ deger:U.diffDays(U.todayISO(), R.PLAN.examTytISO), birim:'gün',
          kesinlik:profilTarihi ? 'computed' : 'estimated', formul:'TYT tarihi − bugün' }),
        cumle:yz('ays.plan.kaldi'), vurgu:profilTarihi ? 'TYT.' : 'TYT, tahmini tarih.', sistem:'ays' },
      { ust:yz('ays.plan.planlanan-soru'), sayi:sayi({ deger:totalQ, birim:'soru', kesinlik:'computed', formul:'haftaların soru hedefi toplamı' }),
        cumle:'toplam.', vurgu:U.fmtNum(doneQ) + ' soru geride kaldı.', sistem:'ays' },
    ] }));
  }

  function zamanCizgisi(gateWeeks){
    const cur = M.currentWeek();
    const tumu = !!S.ui.programTumu;
    const dugme = K.Button({ label:tumu ? 'Yalnız sıradaki haftalar' : 'Tüm program · ' + R.PLAN.totalWeeks + ' hafta',
      size:'sm', tone:'ghost', act:'program-tumu' });
    if(tumu){
      return K.Card({
        title:yz('ays.plan.program-zaman-cizgisi'),
        sub:U.fmtDate(R.PLAN.startISO)+' – '+U.fmtDate(U.iso(M.weekEnd(R.PLAN.totalWeeks)))+' · '+R.PLAN.totalWeeks+' hafta',
        actions:html`<span class="small dim">${yz('ays.plan.karar-kapilari-h')}${gateWeeks.join(' · H')}</span>`,
        body:html`<div class="timeline">${map(phaseRanges(), PhaseBlock)}</div><div class="mt-8">${dugme}</div>`,
      });
    }
    const weeks = [];
    for(let n = cur; n <= Math.min(R.PLAN.totalWeeks, cur + YAKIN); n++) weeks.push(n);
    return K.Card({
      title:yz('ays.plan.siradaki-haftalar'),
      body:html`<div class="timeline"><div class="tlmonth">${map(weeks, WeekRow)}</div></div><div class="mt-8">${dugme}</div>`,
    });
  }

  LIFEOS.PARCA.blok({ id:'plan.donenprogram', sayfa:'plan', yer:'y1', sira:10, ad:'Dönen program', ciz({ cur, totalQ, doneQ, plan, scale, gateWeeks, grid }){
    return DonenProgram(cur, totalQ, doneQ);
  } });
  LIFEOS.PARCA.blok({ id:'plan.plancard', sayfa:'plan', yer:'y2', sira:10, ad:'Plan', ciz({ cur, totalQ, doneQ, plan, scale, gateWeeks, grid }){
    return planCard();
  } });
  LIFEOS.PARCA.blok({ id:'plan.droppedcard', sayfa:'plan', yer:'y3', sira:10, ad:'Bırakılanlar', ciz({ cur, totalQ, doneQ, plan, scale, gateWeeks, grid }){
    return droppedCard();
  } });
  LIFEOS.PARCA.blok({ id:'plan.calisma-yogunlugu', sayfa:'plan', yer:'y4', sira:10, ad:'Çalışma yoğunluğu', ciz({ cur, totalQ, doneQ, plan, scale, gateWeeks, grid }){
    return K.Card({
        title:yz('ays.plan.calisma-yogunlugu'), hint:'intensity', sub:R.PLAN.totalWeeks+' hafta × 7 gün',
        body:html`
          ${raw(UI.heatmap(grid.cells, { cols:R.PLAN.totalWeeks, monthTicks:grid.ticks }))}
          ${raw(UI.legend([
            { label:yz('ays.plan.calisildi-koyuluk-yuku-goste'), color:'var(--primary)' },
            { label:yz('ays.plan.kayit-yok'), color:'color-mix(in srgb, var(--danger) 30%, transparent)' },
            { label:'gelecek', color:'var(--surface-2)' },
          ]))}`,
      });
  } });
  LIFEOS.PARCA.blok({ id:'plan.zamancizgisi', sayfa:'plan', yer:'y5', sira:10, ad:'Zaman çizgisi', ciz({ cur, totalQ, doneQ, plan, scale, gateWeeks, grid }){
    return zamanCizgisi(gateWeeks);
  } });
  async function render(){
    const cur = M.currentWeek();
    let totalQ = 0, doneQ = 0;
    for(let i = 1; i <= R.PLAN.totalWeeks; i++){
      const q = M.curriculumFor(i).q;
      totalQ += q;
      if(i < cur) doneQ += q;
    }
    const plan = M.activePlan();
    const scale = R.PLAN.totalWeeks / R.PROGRAM.totalWeeks;
    const gateWeeks = (plan && plan.meta.gates && plan.meta.gates.length)
      ? plan.meta.gates
      : [11, 16, 20, 29, 33].map(w => Math.max(1, Math.round(w*scale)))
          .filter((w, i, a) => a.indexOf(w) === i);
    const grid = C.intensityGrid();

    const parcaB = { cur, totalQ, doneQ, plan, scale, gateWeeks, grid };
    return String(K.Grid([
    K.Span(12, LIFEOS.PARCA.yer('plan', 'y1', K, parcaB, typeof raw === 'undefined' ? null : raw)),
    K.Span(12, LIFEOS.PARCA.yer('plan', 'y2', K, parcaB, typeof raw === 'undefined' ? null : raw)),
    K.Span(12, LIFEOS.PARCA.yer('plan', 'y3', K, parcaB, typeof raw === 'undefined' ? null : raw)),
    K.Span(12, LIFEOS.PARCA.yer('plan', 'y4', K, parcaB, typeof raw === 'undefined' ? null : raw)),
    K.Span(12, LIFEOS.PARCA.yer('plan', 'y5', K, parcaB, typeof raw === 'undefined' ? null : raw)),
  ]));
  }

  const handle = {
    /* Süre teklifi: kalıcı günlük süre önizlemesi dakikası dolu açılır.
       Pencerenin «Önizle»/«Uygula» düğmeleri açık ekranın işleyicisine
       gelir; aynı işi yapan Hafta işleyicisine devredilir. */
    'sure-oner'(el){ R.Screens.week.sureOner(el.dataset.dakika); },
    'istisna-onizle'(el){ return R.Screens.week.handle['istisna-onizle'](el); },
    async 'istisna-uygula'(el){ return R.Screens.week.handle['istisna-uygula'](el); },
    async 'toggle-dropped'(){ S.ui.droppedOpen = !S.ui.droppedOpen; R.App.render(); },
    async 'program-tumu'(){ S.ui.programTumu = !S.ui.programTumu; R.App.render(); },
    async 'open-dropped'(el){
      S.ui.subjectOpen = el.dataset.subject;
      R.App.go('subjects');
      setTimeout(() => R.Screens.subjects.handle['open-topic']({
        dataset:{ subject:el.dataset.subject, topic:el.dataset.topic } }), 100);
    },
    async 'open-week'(el){
      S.ui.weekView = Number(el.dataset.n);
      await M.ensureWeek(S.ui.weekView);
      R.App.go('week');
    },
  };

  return {
    id:'plan',
    /* Sadelik (brand/ortak/gizle.js): uzun aciklama ve basvuru bolumleri
       bastan kucuk gelir; baslik gorunur, ustune gelince onizlenir,
       «Ac» denirse acik kalir. Is yapilan bolumler ve sinir metinleri acik. */
    kucukVarsayilan:['bu-plan-sana-göre-üretildi'],
    title:yz('ays.plan.program'),
    subtitle(){
      return 'Hafta '+M.currentWeek()+' / '+R.PLAN.totalWeeks+' · '
        + U.fmtDate(R.PLAN.startISO)+' – '+U.fmtDate(U.iso(M.weekEnd(R.PLAN.totalWeeks)));
    },
    /* «Bu haftayı aç» bölümlü seçicide zaten var (Hafta); sayfa başı sade. */
    actions(){ return ''; },
    render, handle,
  };
})();
