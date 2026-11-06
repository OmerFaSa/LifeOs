/* Dersler — konu yol haritalari, durum takibi ve kapanis olcumleri.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */
window.LIFEOS.PARCA.yazilar({
  'ays.subjects.sirada':'Sırada',
  'ays.subjects.konuyu-ac':'Konuyu aç',
  'ays.subjects.konu-bolumleri':'Konu bölümleri',
  'ays.subjects.bolum-konular':'Konular',
  'ays.subjects.bolum-genel':'Genel',
  'ays.subjects.gecici-kapali':'Geçici kapalı',
  'ays.subjects.yeniden-acildi':'Yeniden açıldı',
  'ays.subjects.hedef-2':'Hedef ',
  'ays.subjects.konu-kapanisi':'Konu kapanışı',
  'ays.subjects.kapandi-2':'kapandı',
  'ays.subjects.calisiliyor':'çalışılıyor',
  'ays.subjects.baslanmadi':'başlanmadı',
  'ays.subjects.yks-planin-degismez':'YKS planın değişmez.',
  'ays.subjects.profil-kaldirildi':'Profil kaldırıldı',
  'ays.subjects.profili-ve-isaretleri-sil':'Profili ve işaretleri sil',
  'ays.subjects.konu-kapandi-2':'Konu kapandı',
  'ays.subjects.durum-kaydedildi':'Durum kaydedildi',
});


window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'ays', sira:120, group:'Git', label:'Dersler — konu kapanışı', icon:'book', route:'subjects', run(){ R.App.go('subjects'); } });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:310, uret(){
  return R.SUBJECTS.map(s => ({ group:'Ders', label:s.name, icon:'book', run(){ R.S.ui.subjectOpen = s.id; R.S.ui.bolumIstek = 'konular'; R.App.go('subjects'); } }));
} });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:320, uret(){
  return R.Calc.riskRanking(5).map(r => ({ group:'Öncelik', label:r.topicName+' — risk '+r.score, icon:'target',
    keywords:r.subjectName, weight:4,
    run(){ R.S.ui.subjectOpen = r.subjectId; R.S.ui.bolumIstek = 'konular'; R.App.go('subjects');
      setTimeout(()=>R.Screens.subjects.handle['open-topic']({ dataset:{ subject:r.subjectId, topic:r.topicId } }), 80); } }));
} });
window.LIFEOS.PARCA.yazilar({
  'ays.subjects.tumu':'Tümü',
  'ays.subjects.yuksek-frekans':'Yüksek frekans',
  'ays.subjects.calisilan':'Çalışılan',
  'ays.subjects.kapanmayan':'Kapanmayan',
  'ays.subjects.i-lk-test':'İlk test %',
  'ays.subjects.2-olcum':'· 2. ölçüm',
  'ays.subjects.konu-zinciri':'Konu zinciri',
  'ays.subjects.destek-testi':'destek testi',
  'ays.subjects.konular':'Konular',
  'ays.subjects.onkosul-ve-getiri-sirasina-g':'Önkoşul ve getiri sırasına göre',
  'ays.subjects.konu-suzgeci':'Konu süzgeci',
  'ays.subjects.konu-ara':'Konu ara…',
  'ays.subjects.konu-ara-2':'konu ara',
  'ays.subjects.bu-filtreye-uyan-konu-yok':'Bu filtreye uyan konu yok.',
  'ays.subjects.suzgeci-sifirla':'Süzgeci sıfırla',
  'ays.subjects.kaynak-mimarisi':'Kaynak mimarisi',
  'ays.subjects.temel-orta-brans':'Temel → orta → branş',
  'ays.subjects.tahmini-sure':'Tahmini süre:',
  'ays.subjects.kapanis-kurali-konu-testi':'Kapanış kuralı: konu testi ≥%',
  'ays.subjects.gun-sonraki-test':'gün sonraki test ≥%',
  'ays.subjects.tek-olcum-kapanis-saymaz':'. Tek ölçüm kapanış saymaz.',
  'ays.subjects.bu-sayilar-nereden-geliyor':'Bu sayılar nereden geliyor?',
  'ays.subjects.1-olcum-konu-testi':'1. ölçüm — konu testi %',
  'ays.subjects.1-olcum-tarihi':'1. ölçüm tarihi',
  'ays.subjects.2-olcum-7-gun':'2. ölçüm — 7 gün sonra %',
  'ays.subjects.2-olcum-tarihi':'2. ölçüm tarihi',
  'ays.subjects.durum-elle-gecersiz-kil':'Durum (elle geçersiz kıl)',
  'ays.subjects.not':'Not',
  'ays.subjects.kaynak-zorlanilan-alt-baslik':'Kaynak, zorlanılan alt başlık, kart ihtiyacı…',
  'ays.subjects.konu':'Konu ',
  'ays.subjects.kapat':'Kapat',
  'ays.subjects.kaydet':'Kaydet',
  'ays.subjects.konu-kapandi':'konu kapandı',
  'ays.subjects.oncelik-sirasi':'Öncelik sırası',
  'ays.subjects.analiste-sor':'Analiste sor',
  'ays.subjects.bekleyen-2-olcumler':'Bekleyen 2. ölçümler',
  'ays.subjects.kapanis-icin-gerekli':'Kapanış için gerekli',
  'ays.subjects.ders':'ders ·',
  'ays.subjects.dersler-ve-konular':'Dersler ve konular',
  'ays.subjects.acik-kalanlar':'Açık kalanlar:',
  'ays.subjects.profili-kaldir':'Profili kaldır',
  'ays.subjects.test-kitabi-iste':'Test kitabı iste',
  'ays.subjects.hangi-sinav-bana-uygun':'Hangi sınav bana uygun?',
  'ays.subjects.egitim-durumu':'Eğitim durumu',
  'ays.subjects.sec':'Seç',
  'ays.subjects.hedef':'Hedef',
  'ays.subjects.mufredatini-iste':'Müfredatını iste',
  'ays.subjects.oneri-kural-tablosundandir-k':'Öneri kural tablosundandır, karar senindir. Ana sınavın (YKS) değişmez; istenen müfredat ek profil olarak gelir.',
  'ays.subjects.sinav-profilleri':'Sınav profilleri',
  'ays.subjects.baska-bir-sinav':'Başka bir sınav',
  'ays.subjects.or-kpss-genel-kultur':'ör. KPSS genel kültür',
  'ays.subjects.mufredati-kendin-yukle-unive':'Müfredatı kendin yükle (üniversite ya da başka bir sınav)',
  'ays.subjects.profilin-adi':'Profilin adı',
  'ays.subjects.or-muhendislik-1-sinif':'ör. Mühendislik 1. sınıf',
  'ays.subjects.her-satir-ders-konu-konu':'Her satır «Ders: konu, konu» ya da «Ders:» ve altında «- konu». Kaynağı sensin: AYS doğrulamaz, yalnız süzer (en çok',
  'ays.subjects.ders-ders-basina':'ders, ders başına',
  'ays.subjects.konu-ana-sinavin-yks-degisme':'konu). Ana sınavın (YKS) değişmez.',
  'ays.subjects.profili-ekle':'Profili ekle',
  'ays.subjects.kapandi':'kapandı.',
  'ays.subjects.kapanis':'Kapanış',
  'ays.subjects.konu-haritasi':'Konu haritası · ',
  'ays.subjects.i-kinci-kontrol':'İkinci kontrol',
  'ays.subjects.dersler':'Dersler',
});
window.LIFEOS.PARCA.sayfa({ id:'subjects', modul:'ays', king:{ sira:120, ad:'Konu kapanışı', es:['konu kapanış', 'kapanış', 'konu', 'ders'] }, cekmece:'calisma', ad:'Konu takibi', ikon:'book', sira:40 });

R.Screens.subjects = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const STATE_BADGE = {
    not_started:['Başlanmadı', 'muted'], learning:['Öğreniliyor', 'info'],
    practicing:['Pratik', 'warn'], provisional:[yz('ays.subjects.gecici-kapali'), 'info'],
    closed:['Kapalı', 'ok'], reopened:[yz('ays.subjects.yeniden-acildi'), 'danger'],
  };

  const FILTERS = [
    { value:'all', label:yz('ays.subjects.tumu') }, { value:'high', label:yz('ays.subjects.yuksek-frekans') },
    { value:'active', label:yz('ays.subjects.calisilan') }, { value:'open', label:yz('ays.subjects.kapanmayan') },
  ];

  function openId(){ return S.ui.subjectOpen || R.SUBJECTS[0].id; }

  function StateBadge(state){
    const m = STATE_BADGE[state] || STATE_BADGE.not_started;
    return html`<span class="badge badge--${m[1]}"><span class="statedot state-${state}"></span>${m[0]}</span>`;
  }

  /* Iki olcum kurali: ilk test >= %75, 7 gun sonraki test >= %70. */
  function checkInfo(st){
    if(st.first == null) return null;
    if(st.second != null) return html`<span class="tiny dim">%${st.first} → %${st.second}</span>`;

    const dueISO = st.firstAt ? U.iso(U.addDays(U.parse(st.firstAt), R.CLOSURE_RULE.gapDays)) : null;
    const overdue = !!(dueISO && dueISO < U.todayISO());
    const soon = overdue || dueISO === U.todayISO();
    const label = !dueISO ? '—'
      : overdue ? U.diffDays(dueISO, U.todayISO())+' gün gecikti'
      : dueISO === U.todayISO() ? 'bugün' : U.relativeDay(dueISO);
    return html`<span class="${soon ? 'tiny is-due' : 'tiny dim'}">${yz('ays.subjects.i-lk-test')}${st.first} ${yz('ays.subjects.2-olcum')} ${label}</span>`;
  }

  function TopicRow(subject, topic){
    const st = M.topicState(subject.id, topic.id);
    const mod = st.state === 'closed' ? ' is-closed'
      : (st.state === 'learning' || st.state === 'practicing') ? ' is-active' : '';
    const freq = R.TOPIC_FREQ[topic.freq] || R.TOPIC_FREQ.mid;
    const info = checkInfo(st);

    return html`
      <div class="topicrow${mod}" data-act="topic-open" data-subject="${subject.id}" data-topic="${topic.id}"
           role="button" tabindex="0">
        <span class="topicrow__order">${topic.order}</span>
        <div class="minw0">
          <div class="topicrow__name">${topic.name}</div>
          <div class="topicrow__meta">${topic.days} ·
            <span class="freq freq--${topic.freq}" title="${freq.note}">${freq.label} frekans</span></div>
          ${when(info, () => html`<div class="mt-2">${info}</div>`)}
        </div>
        ${StateBadge(st.state)}
      </div>`;
  }

  /* ---------- C · vitrin kartları (brand/ortak/vitrin.js) ---------- */
  const VT = () => (window.LIFEOS || {}).VITRIN;
  const AKTIF = ['learning', 'practicing', 'provisional', 'closed', 'reopened'];

  /* Konunun kapsamı: ölçüm varsa ikinci (yoksa ilk) testin yüzdesi;
     ölçüm yoksa YOK (kapalı konu da ölçümsüz kapatılmışsa «—»). */
  function kapsamOf(st){ return st.second != null ? st.second : st.first != null ? st.first : null; }

  /* Son çalışma: bitmiş blok ya da çözülen soru kaydı, konu KİMLİĞİYLE. */
  function sonCalisma(subjectId){
    const son = {};
    const yaz = (tid, iso) => { if(tid && iso && (!son[tid] || iso > son[tid])) son[tid] = iso; };
    Object.keys(S.days || {}).forEach(iso => (S.days[iso].blocks || []).forEach(b => {
      if(b.subjectId === subjectId && (b.status === 'done' || b.status === 'partial')) yaz(b.topicId, iso);
    }));
    (S.solved || []).forEach(r => { if(r.subjectId === subjectId) yaz(r.topicId, R.U.gunOf(r.at || '')); });
    return son;
  }

  /* Eksik önkoşul: aynı grupta SONRAKİ bir konuya başlanmışken kapanmamış konu. */
  function eksikOnkosul(subject){
    const eksik = {};
    groupTopics(subject.topics).forEach(g => {
      const sirali = g.items.slice().sort((a, b) => a.order - b.order);
      sirali.forEach((t, i) => {
        const st = M.topicState(subject.id, t.id).state;
        if(st === 'closed') return;
        if(sirali.slice(i + 1).some(x => AKTIF.indexOf(M.topicState(subject.id, x.id).state) >= 0)) eksik[t.id] = true;
      });
    });
    return eksik;
  }

  /* 050 KONU ZİNCİRİ: ilk etkin konunun önü ve arkası, önkoşul sırasıyla. */
  function zincir(subject){
    if(!VT()) return '';
    const eksik = eksikOnkosul(subject);
    const g = groupTopics(subject.topics).find(x => x.items.some(t => ['learning', 'practicing', 'provisional'].indexOf(M.topicState(subject.id, t.id).state) >= 0));
    if(!g) return '';
    const sirali = g.items.slice().sort((a, b) => a.order - b.order);
    const i = sirali.findIndex(t => ['learning', 'practicing', 'provisional'].indexOf(M.topicState(subject.id, t.id).state) >= 0);
    const parca = sirali.slice(Math.max(0, i - 1), Math.max(0, i - 1) + 3);
    if(parca.length < 2) return '';
    return K.Kutu({ ad:yz('ays.subjects.konu-zinciri'), yuva:g.key, class:'vkutu', govde:raw(VT().konuZinciri({
      halkalar:parca.map(t => ({ ad:t.name, p:kapsamOf(M.topicState(subject.id, t.id)), eksik:!!eksik[t.id] })) })) });
  }

  /* 063 KONU TABLOSU: bir grubun konuları; satır konu formunu açar. */
  function konuTablosu(subject, g, son, eksik){
    const bugun = U.todayISO();
    return VT().konuTablosu({ act:'topic-open', ust:g.key + ' · ' + g.items.length + ' konu',
      konular:g.items.map(t => {
        const st = M.topicState(subject.id, t.id);
        const durum = (STATE_BADGE[st.state] || STATE_BADGE.not_started)[0];
        const gun = son[t.id] ? U.diffDays(son[t.id], bugun) : null;
        const zaman = gun == null ? null : gun === 0 ? 'bugün' : gun + ' gün önce';
        return { ad:t.name, p:kapsamOf(st), onkosul:!!eksik[t.id], son:(zaman ? zaman + ' · ' : '') + durum,
          data:{ 'data-subject':subject.id, 'data-topic':t.id } };
      }) });
  }

  /* Konular brans grubuna gore bolunur — uzun liste okunabilir kalir. */
  function groupTopics(topics){
    const groups = [];
    topics.forEach(t => {
      const key = t.group || '—';
      let g = groups.find(x => x.key === key);
      if(!g){ g = { key, items:[] }; groups.push(g); }
      g.items.push(t);
    });
    return groups;
  }

  function filterTopics(subject){
    const filter = S.ui.topicFilter || 'all';
    const query = U.norm(S.ui.topicQuery || '');
    let topics = subject.topics;

    if(filter === 'high') topics = topics.filter(t => t.freq === 'high');
    else if(filter === 'open') topics = topics.filter(t => M.topicState(subject.id, t.id).state !== 'closed');
    else if(filter === 'active') topics = topics.filter(t => {
      const st = M.topicState(subject.id, t.id).state;
      return st === 'learning' || st === 'practicing' || st === 'provisional';
    });
    if(query) topics = topics.filter(t => U.norm(t.name+' '+(t.group || '')).indexOf(query) >= 0);
    return topics;
  }

  /* Seçili dersin parçaları: künye kartı, konu zinciri, konular, kaynak
     mimarisi. iPhone Faz 2: raf kutuları DOM sırasıyla ikişer dizer;
     konular ders listesinin YANINDA durur, künye ve öncelik şeritleri
     altta (render). */
  function subjectPanel(subject){
    const closure = C.subjectClosure(subject.id);
    const topics = filterTopics(subject);
    const son = sonCalisma(subject.id), eksik = eksikOnkosul(subject);
    const highCount = subject.topics.filter(t => t.freq === 'high').length;

    return {
      kart:K.Card({
        title:subject.name, sub:subject.questions+' soru · '+subject.weight,
        actions:html`<div class="row-sm">${raw(UI.donut(closure.pct, closure.closed+'/'+closure.total, 72))}</div>`,
        body:html`
          ${K.Row([
            K.Chip(yz('ays.subjects.hedef-2')+subject.targetBand),
            K.Chip(subject.topics.length+' konu'),
            K.Chip(highCount+' yüksek frekans'),
            when(subject.priority === 'support', () => K.Badge({ label:yz('ays.subjects.destek-testi'), tone:'warn' })),
          ], { wrap:true })}
          <p class="small muted mt-10">${subject.insight}</p>`,
      }),

      zincir:zincir(subject),
      konular:K.Card({
        title:yz('ays.subjects.konular'), hint:'source-arch', sub:yz('ays.subjects.onkosul-ve-getiri-sirasina-g'),
        actions:K.Segmented({ items:FILTERS, value:S.ui.topicFilter || 'all', act:'topic-filter', aria:yz('ays.subjects.konu-suzgeci') }),
        body:html`
          ${K.Input({ class:'mb-10', placeholder:yz('ays.subjects.konu-ara'), value:S.ui.topicQuery || '',
            aria:yz('ays.subjects.konu-ara-2'), change:'topic-search', data:{ 'data-debounce':220 } })}
          ${topics.length && VT()
            ? html`<div class="stack-sm">${map(groupTopics(topics), g => raw(konuTablosu(subject, g, son, eksik)))}</div>`
            : topics.length
            ? html`<div class="list">${map(groupTopics(topics), g => {
                const closed = g.items.filter(t => M.topicState(subject.id, t.id).state === 'closed').length;
                return html`<div class="topicgroup">
                  <div class="topicgroup__head"><span>${g.key}</span>
                    <span class="tiny dim num">${closed}/${g.items.length}</span></div>
                  ${map(g.items, t => TopicRow(subject, t))}
                </div>`;
              })}</div>`
            : K.Empty({ icon:'search', text:yz('ays.subjects.bu-filtreye-uyan-konu-yok'),
                action:K.Button({ label:yz('ays.subjects.suzgeci-sifirla'), size:'sm', act:'topic-reset' }) })}`,
      }),

      kaynak:K.Card({
        title:yz('ays.subjects.kaynak-mimarisi'), sub:yz('ays.subjects.temel-orta-brans'),
        body:html`<div class="ladder">${map(subject.sources, s => html`
          <div class="ladder__row"><span class="ladder__level">${s.level}</span>
            <span class="muted">${s.detail}</span></div>`)}</div>`,
      }),
    };
  }

  /* ---------- konu formu ---------- */

  function topicSheet(subjectId, topicId){
    const subject = R.SUBJECTS.find(s => s.id === subjectId);
    const topic = subject.topics.find(t => t.id === topicId);
    const st = M.topicState(subjectId, topicId);
    const stateOptions = Object.keys(R.TOPIC_STATES).map(k => ({ value:k, label:R.TOPIC_STATES[k].label }));
    const freq = (R.TOPIC_FREQ[topic.freq] || {}).label || '';
    const pctInput = (id, value) => K.Input({ id, type:'number', numeric:true, min:0, max:100, value:value == null ? '' : value });

    const body = K.Stack([
      K.Card({ flat:true, pad:'sm', body:html`
        <div class="row between"><b>${topic.name}</b>${StateBadge(st.state)}</div>
        <p class="small muted mt-4">${yz('ays.subjects.tahmini-sure')} ${topic.days} · ${freq} frekans${topic.group ? ' · '+topic.group : ''}</p>` }),
      K.Notice({ tone:'info', body:html`${yz('ays.subjects.kapanis-kurali-konu-testi')}${R.CLOSURE_RULE.first} <b>ve</b>
        ${R.CLOSURE_RULE.gapDays} ${yz('ays.subjects.gun-sonraki-test')}${R.CLOSURE_RULE.second}${yz('ays.subjects.tek-olcum-kapanis-saymaz')}` }),

      /* Esigin KAYNAGI. %75 ve %70 pedagojik bir bulgu degil, bu sistemin
         secimidir — ve bunu gizlemek, bir tasarim tercihini bulgu gibi
         sunmak olurdu (core/evidence.js). */
      K.Notice({ tone:'warn', hint:'evidence',
        body:html`<b>${yz('ays.subjects.bu-sayilar-nereden-geliyor')}</b>
          ${R.Ev.line('closure.first').note}
          ${R.Ev.line('closure.second').note}` }),
      K.Cols(2, [
        K.Field({ label:yz('ays.subjects.1-olcum-konu-testi'), input:pctInput('tp-first', st.first) }),
        K.Field({ label:yz('ays.subjects.1-olcum-tarihi'), input:K.Input({ id:'tp-first-at', type:'date', value:st.firstAt || U.todayISO() }) }),
      ]),
      K.Cols(2, [
        K.Field({ label:yz('ays.subjects.2-olcum-7-gun'), input:pctInput('tp-second', st.second) }),
        K.Field({ label:yz('ays.subjects.2-olcum-tarihi'), input:K.Input({ id:'tp-second-at', type:'date', value:st.secondAt || '' }) }),
      ]),
      K.Field({ label:yz('ays.subjects.durum-elle-gecersiz-kil'), input:K.Select({ id:'tp-state', options:stateOptions, value:st.state }) }),
      K.Field({ label:yz('ays.subjects.not'), input:K.Textarea({ id:'tp-note', rows:2, value:st.note,
        placeholder:yz('ays.subjects.kaynak-zorlanilan-alt-baslik') }) }),
    ]);

    UI.sheet({
      title:subject.name,
      subtitle:yz('ays.subjects.konu')+topic.order+' · durum ve ölçüm',
      body:String(body),
      footer:String(html`${K.Button({ label:yz('ays.subjects.kapat'), act:'sheet-close' })}
        ${K.Button({ label:yz('ays.subjects.kaydet'), tone:'primary', act:'save-topic',
          data:{ 'data-subject':subjectId, 'data-topic':topicId } })}`),
    });
  }

  /* ---------- ekran ---------- */

  function subjectNav(sid){
    return html`<div class="list list--sik">${map(R.SUBJECTS, s => {
      const c = C.subjectClosure(s.id);
      return html`
        <button class="${s.id === sid ? 'listitem listitem--tap is-on' : 'listitem listitem--tap'}"
                data-act="open-subject" data-id="${s.id}">
          <!-- DERSİN AMBLEMİ — kimlikten türer (bkz. brand/ortak/simge.js).
               Sekiz ders üst üste sekiz gri satırdı ve göz hangisine
               baktığını her seferinde okuyarak buluyordu; TYT ile AYT
               matematiği ise yan yana ayırt edilmiyordu. -->
          ${raw(window.LIFEOS.SIMGE_HTML('ders', s.id))}
          <div class="grow"><div class="small strong">${s.name}</div>
            <div class="tiny dim">${c.closed}/${c.total} ${yz('ays.subjects.konu-kapandi')}</div></div>
          <div class="w-46">${K.Bar({ value:c.pct, tone:'' })}</div>
        </button>`;
    })}</div>`;
  }

  /* Ekran duruma göre konuşur: bekleyen ölçüm kendi kartındadır; yoksa risk sırasının başı (kural motoru). */
  function siradakiKonu(){
    if(C.pendingSecondChecks().length) return '';
    const r = C.riskRanking(1)[0];
    if(!r) return '';
    return K.NextUp({ calm:true, icon:'book', label:yz('ays.subjects.sirada'), title:r.topicName, why:r.subjectName,
      action:K.Button({ label:yz('ays.subjects.konuyu-ac'), tone:'primary', size:'sm', act:'open-topic',
        data:{ 'data-subject':r.subjectId, 'data-topic':r.topicId } }) });
  }

  function riskCard(){
    const list = C.riskRanking(8);
    if(!list.length) return null;
    const reason = r => {
      const parts = [];
      if(r.state === 'not_started') parts.push('başlanmadı');
      else if(r.state !== 'closed') parts.push(R.TOPIC_STATES[r.state].label.toLowerCase());
      if(r.freq === 'high') parts.push('yüksek frekans');
      if(r.errors) parts.push(r.errors+' açık yanlış');
      if(r.staleDays != null && r.staleDays >= R.SCORING.staleDays) parts.push(r.staleDays+' gündür dokunulmadı');
      return parts.slice(0, 3).join(' · ');
    };
    /* Skorun nasıl hesaplandığı ve «emir değil öneri» notu ⓘ'de (hints: risk). */
    return K.Card({
      title:yz('ays.subjects.oncelik-sirasi'), hint:'risk',
      actions:K.Button({ label:yz('ays.subjects.analiste-sor'), icon:'zap', size:'sm',
        act:'ask-agent', data:{ 'data-agent':'analist' } }),
      body:html`
        ${map(list, r => html`
          <div class="riskrow" data-act="open-topic" data-subject="${r.subjectId}" data-topic="${r.topicId}"
               role="button" tabindex="0">
            <span class="riskrow__score is-${r.band}">${r.score}</span>
            <div class="riskrow__text">
              <div class="small strong">${r.topicName}</div>
              <div class="tiny dim truncate">${r.subjectName} · ${reason(r)}</div>
            </div>
            ${K.Badge({ label:r.label, tone:r.tone })}
          </div>`)}`,
    });
  }

  function pendingCard(pending){
    if(!pending.length) return null;
    return K.Span(12, K.Card({ class:'card--accent', title:yz('ays.subjects.bekleyen-2-olcumler'), sub:yz('ays.subjects.kapanis-icin-gerekli'),
      body:K.Row(map(pending.slice(0, 8), p => K.Chip({
        label:p.topicName+' · '+(p.overdue ? 'gecikti' : U.relativeDay(p.dueISO)),
        act:'open-topic', on:p.overdue,
        data:{ 'data-subject':p.subjectId, 'data-topic':p.topicId },
      })), { wrap:true }) }));
  }

  /* Sınav profilleri (core/sinavprofil.js): yerleşik YKS SAY ve BAM'ın
     çıkarıp kullanıcının onayladığı ek profiller. Ek profil kaynaksızsa
     «doğrulanmadı» yazar; puan hesabı yoktur. Müfredat uydurulmaz: yeni
     profil yalnız King'e iş emriyle istenir. */
  function profilSatiri(p){
    const SP = R.SinavProfil, s = SP.sayilar(p);
    const ek = p.kaynak !== 'yerlesik';
    const biten = p.bitenler || [];
    return html`<div>
      <div class="row between wrap"><b class="small">${p.ad}${p.bolum ? ' · ' + p.bolum : ''}</b>
        ${K.Badge({ label:ek ? ({ kaynakli:'kaynaklı', kullanici:'senin yüklediğin' }[p.dogruluk] || 'doğrulanmadı') : 'yerleşik',
          tone:ek && p.dogruluk === 'dogrulanmadi' ? 'warn' : 'ok' })}</div>
      <div class="tiny dim">${s.ders} ${yz('ays.subjects.ders')} ${s.konu} konu${ek ? ' · ' + s.biten + ' konu bitti · '
        + (p.kayitId ? 'BAM #' + p.kayitId : 'kullanıcı beyanı') + ' · puanlama: veri yok' : ' · kapanış ölçümleri yukarıda'}</div>
      ${when(ek, () => html`<details class="mt-6"><summary class="tiny">${yz('ays.subjects.dersler-ve-konular')}</summary>
        ${map(p.dersler, d => html`<div class="mt-6">
          <div class="tiny"><b>${d.ad}</b>${d.soru ? ' · ' + d.soru + ' soru' : ''}</div>
          ${K.Row(map(d.konular, k => K.Chip({ label:k.ad, act:'sp-konu', on:biten.indexOf(k.id) >= 0,
            data:{ 'data-profil':p.id, 'data-konu':k.id } })), { wrap:true })}</div>`)}
        ${when(p.acikKalanlar && p.acikKalanlar.length, () => html`<p class="tiny dim mt-6">${yz('ays.subjects.acik-kalanlar')} ${p.acikKalanlar.join(' · ')}</p>`)}
        <div class="mt-6">${K.Button({ label:yz('ays.subjects.profili-kaldir'), size:'sm', act:'sp-sil',
          data:{ 'data-id':p.id } })}</div>
      </details>`)}
      ${when(R.TestKitabi, () => html`<div class="mt-6">${K.Button({ label:yz('ays.subjects.test-kitabi-iste'),
        size:'sm', act:'kitap-iste', data:{ 'data-id':p.id } })}</div>`)}
    </div>`;
  }

  /* Hangi sınav bana uygun? (Y11). Eğitim durumu ve hedef SORULUR; öneri
     kural tablosundan (core/sinavoneri.js) gelir ve hiçbir şeyi değiştirmez:
     «Müfredatını iste» yalnız ek profil ister (King teklifi). */
  function oneriBolumu(){
    if(!R.SinavOneri) return '';
    const p = S.profile || {};
    const r = R.SinavOneri.oner({ egitim:p.egitim, hedef:p.sinavHedef, etkin:'yks' });
    const eklenen = R.SinavProfil.liste().map(x => String(x.ad || '').toLocaleLowerCase('tr'));
    return html`<details class="mt-10" ${p.egitim ? '' : raw('open')}>
      <summary>${yz('ays.subjects.hangi-sinav-bana-uygun')}</summary>
      <div class="row wrap mt-8">
        ${K.Field({ label:yz('ays.subjects.egitim-durumu'), input:K.Select({ id:'so-egitim', value:p.egitim || '',
          change:'so-egitim', options:[{ value:'', label:yz('ays.subjects.sec') }].concat(R.SinavOneri.EGITIM.map(x => ({ value:x.id, label:x.ad }))) }) })}
        ${K.Field({ label:yz('ays.subjects.hedef'), input:K.Select({ id:'so-hedef', value:p.sinavHedef || '',
          change:'so-hedef', options:[{ value:'', label:yz('ays.subjects.sec') }].concat(R.SinavOneri.HEDEF.map(x => ({ value:x.id, label:x.ad }))) }) })}
      </div>
      ${when(!r.ok, () => html`<p class="small muted mt-8">${r.soru}</p>`)}
      ${when(r.ok, () => html`<div class="stack-sm mt-8">${map(r.satirlar.filter(s => s.durum !== 'uygun değil'), s => html`
        <div class="listitem">
          <div class="grow minw0">
            <b class="small">${s.ad}</b> <span class="tiny dim">${s.kurum} · ${s.durum}${s.etkin ? ' · şu anki sınavın' : ''}${s.hedefte ? ' · hedefinle örtüşüyor' : ''}</span>
            <div class="tiny dim">${s.gerekce}</div>
          </div>
          ${when(!s.etkin && s.durum === 'uygun' && eklenen.indexOf(s.ad.toLocaleLowerCase('tr')) < 0,
            () => K.Button({ label:yz('ays.subjects.mufredatini-iste'), size:'sm', act:'so-iste', data:{ 'data-ad':s.ad } }))}
        </div>`)}</div>
        ${when(r.not, () => html`<p class="tiny dim mt-6">${r.not}</p>`)}
        <p class="tiny dim mt-6">${yz('ays.subjects.oneri-kural-tablosundandir-k')}</p>`)}
    </details>`;
  }

  function profilKarti(){
    if(!R.SinavProfil) return null;
    const l = R.SinavProfil.liste();
    return K.Span(12, K.Card({ title:yz('ays.subjects.sinav-profilleri'),
      sub:l.length + ' profil · müfredatı BAM çıkarır, sen onaylarsın',
      body:html`<div class="stack-sm">
        ${map(l, profilSatiri)}
        <div class="row wrap mt-8">
          ${K.Field({ label:yz('ays.subjects.baska-bir-sinav'), input:K.Input({ id:'sp-sinav',
            placeholder:yz('ays.subjects.or-kpss-genel-kultur'), size:'sm' }) })}
          ${K.Button({ label:yz('ays.subjects.mufredatini-iste'), size:'sm', tone:'primary', act:'sp-iste' })}
        </div>
        ${when(S.ui.spNot, () => html`<p class="tiny">${S.ui.spNot}</p>`)}
        <details class="mt-10">
          <summary>${yz('ays.subjects.mufredati-kendin-yukle-unive')}</summary>
          <div class="stack-sm mt-8">
            ${K.Field({ label:yz('ays.subjects.profilin-adi'), input:K.Input({ id:'sp-yukle-ad', placeholder:yz('ays.subjects.or-muhendislik-1-sinif'), size:'sm' }) })}
            <textarea id="sp-yukle-metin" class="input" rows="6" aria-label="Müfredat metni"
              placeholder="Matematik I: Limit, Türev, İntegral&#10;Fizik I:&#10;- Kinematik&#10;- Dinamik"></textarea>
            <p class="tiny dim">${yz('ays.subjects.her-satir-ders-konu-konu')} ${R.SinavProfil.SINIR.ders} ${yz('ays.subjects.ders-ders-basina')}
              ${R.SinavProfil.SINIR.konuDers} ${yz('ays.subjects.konu-ana-sinavin-yks-degisme')}</p>
            <div>${K.Button({ label:yz('ays.subjects.profili-ekle'), size:'sm', tone:'primary', act:'sp-yukle' })}</div>
          </div>
        </details>
        ${oneriBolumu()}
      </div>` }));
  }

  /* iPhone Faz 2 (2026-10-02): üç kapanış istatistiği tek küçük dönen kart.
     Sayı kural motorundan (C.overallClosure / examClosure), hesaplandı. */
  function DonenKapanis(){
    const V = VT();
    if(!V || !V.donen) return '';
    const L = window.LIFEOS || {};
    const sayi = s => L.SAYI ? L.SAYI.html(s) : U.esc(String(s.deger) + (s.birim ? ' ' + s.birim : ''));
    const madde = (ust, k) => ({ ust, sayi:sayi({ deger:k.pct, birim:'%', kesinlik:'computed', formul:'kapanan konu ÷ konu' }),
      cumle:yz('ays.subjects.kapandi'), vurgu:k.closed + ' / ' + k.total + ' konu.', sistem:'ays' });
    return raw(V.donen({ id:'ays-kapanis', ad:yz('ays.subjects.kapanis'), maddeler:[
      madde(yz('ays.subjects.konu-kapanisi'), C.overallClosure()), madde('TYT', C.examClosure('TYT')), madde('AYT', C.examClosure('AYT')) ] }));
  }

  /* PANO KARTI (2026-10-20; brand/ortak/pano.js): açık dersin konu
     haritası. Kapalı konu dolu, öğrenilen/pratik/geçici yarım, başlanmamış
     açık kare. Konu durumu kaydından (M.topicState). */
  function KonuHaritasi(subject){
    const P = (window.LIFEOS || {}).PANO;
    if(!P || !subject || !(subject.topics || []).length) return '';
    const st = subject.topics.map(t => M.topicState(subject.id, t.id).state);
    const kapali = st.filter(s => s === 'closed').length;
    const yarim = st.filter(s => ['learning', 'practicing', 'provisional'].indexOf(s) >= 0).length;
    const kart = P.kart({ tur:'konu-haritasi', ad:yz('ays.subjects.konu-haritasi') + subject.name, simge:'harita', yuva:kapali + ' / ' + st.length + ' kapandı',
      govde:P.kareler({ sutun:Math.min(20, st.length), kucuk:st.length > 40,
          durumlar:st.map(s => s === 'closed' ? 'dolu' : ['learning', 'practicing', 'provisional'].indexOf(s) >= 0 ? 'yarim' : 'bos'),
          etiket:st.length + ' konudan ' + kapali + ' kapandı, ' + yarim + ' çalışılıyor' })
        + ('<div class="pk-lejant"><span><i class="pk-renk0"></i>' + yz('ays.subjects.kapandi-2') + ' <b>') + kapali + ('</b></span><span><i class="pk-renk1"></i>' + yz('ays.subjects.calisiliyor') + ' <b>') + yarim
        + ('</b></span><span><i class="pk-renkn"></i>' + yz('ays.subjects.baslanmadi') + ' <b>') + (st.length - kapali - yarim) + '</b></span></div>' });
    /* İkinci kontrol: ilk testi geçen konunun 7 gün sonraki testi. */
    const bek = C.pendingSecondChecks();
    const bugun = U.todayISO();
    const ikinci = bek.length ? P.kart({ tur:'ikinci-kontrol', ad:yz('ays.subjects.i-kinci-kontrol'), simge:'takvim', yuva:bek.length + ' konu',
      govde:P.liste({ satirlar:bek.slice(0, 5).map(x => ({ sol:x.overdue ? 'vakti geldi' : U.diffDays(bugun, x.dueISO) + ' gün', ad:x.topicName, not:x.subjectName, nokta:x.overdue ? 0 : 'n' })) })
        + P.not('konu, ikinci test de geçince kapanır') }) : '';
    return P.izgara([kart, ikinci], 'pk-izgara--iki');
  }

  LIFEOS.PARCA.blok({ id:'subjects.konu-haritasi', sayfa:'subjects', yer:'genel', sira:10, ad:'Konu haritası', ciz({ sid, subject, P }){
    return raw(KonuHaritasi(subject));
  } });
  LIFEOS.PARCA.blok({ id:'subjects.donenkapanis', sayfa:'subjects', yer:'genel', sira:10, ad:'Dönen kapanış', ciz({ sid, subject, P }){
    return DonenKapanis();
  } });
  LIFEOS.PARCA.blok({ id:'subjects.pendingcard', sayfa:'subjects', yer:'konular-ust', sira:10, ad:'Bekleyenler', ciz({ sid, subject, P }){
    return pendingCard(C.pendingSecondChecks());
  } });
  LIFEOS.PARCA.blok({ id:'subjects.dersler', sayfa:'subjects', yer:'konular-sol', sira:10, ad:'Dersler', ciz({ sid, subject, P }){
    return K.Card({ pad:'sm', title:yz('ays.subjects.dersler'), sub:R.SUBJECTS.length+' ders', body:subjectNav(sid) });
  } });
  LIFEOS.PARCA.blok({ id:'subjects.konu-listesi', sayfa:'subjects', yer:'konular-sag', sira:10, ad:'Konu listesi', ciz({ sid, subject, P }){
    return P.konular;
  } });
  LIFEOS.PARCA.blok({ id:'subjects.konu-zinciri', sayfa:'subjects', yer:'konular-sag', sira:20, ad:'Konu zinciri', ciz({ sid, subject, P }){
    return P.zincir;
  } });
  LIFEOS.PARCA.blok({ id:'subjects.riskcard', sayfa:'subjects', yer:'genel', sira:10, ad:'Risk', ciz({ sid, subject, P }){
    return riskCard();
  } });
  LIFEOS.PARCA.blok({ id:'subjects.konu-karti', sayfa:'subjects', yer:'konular-alt', sira:10, ad:'Konu kartı', ciz({ sid, subject, P }){
    return P.kart;
  } });
  LIFEOS.PARCA.blok({ id:'subjects.kaynaklar', sayfa:'subjects', yer:'konular-alt', sira:20, ad:'Kaynaklar', ciz({ sid, subject, P }){
    return P.kaynak;
  } });
  LIFEOS.PARCA.blok({ id:'subjects.profilkarti', sayfa:'subjects', yer:'genel-alt', sira:10, ad:'Ders profili', ciz({ sid, subject, P }){
    return profilKarti();
  } });
  LIFEOS.PARCA.blok({ id:'subjects.aciklamalar', sayfa:'subjects', yer:'y9', sira:10, ad:'Açıklamalar', ciz({ sid, subject, P }){
    return raw(UI.rail(['closure', 'second-check', 'source-arch']));
  } });
  async function render(){
    const sid = openId();
    const subject = R.SUBJECTS.find(s => s.id === sid);
    const P = subjectPanel(subject);

    const parcaB = { sid, subject, P };
    const Y = LIFEOS.PARCA;
    /* TEK İŞ (2026-11-06): konu listesi önce; harita, kapanış oranı ve risk «Genel»de. */
    return String(html`${K.SayfaBolumleri({ act:'subjects-tab', aria:yz('ays.subjects.konu-bolumleri'), bolumler:[
      { id:'konular', ad:yz('ays.subjects.bolum-konular'), govde:K.Grid([
        K.Span(12, siradakiKonu()),
        Y.yer('subjects', 'konular-ust', K, parcaB, raw),
        K.Span(3, K.Stack(Y.liste('subjects', 'konular-sol', K, parcaB))),
        K.Span(7, K.Stack(Y.liste('subjects', 'konular-sag', K, parcaB).concat(Y.liste('subjects', 'konular-alt', K, parcaB)))),
      ]) },
      { id:'genel', ad:yz('ays.subjects.bolum-genel'), govde:K.Grid([
        K.Span(12, K.Stack(Y.liste('subjects', 'genel', K, parcaB))),
        Y.yer('subjects', 'genel-alt', K, parcaB, raw),
      ]) },
    ] })}${K.Grid([K.Span(12, Y.yer('subjects', 'y9', K, parcaB, raw))])}`);
  }

  const handle = {
    async 'subjects-tab'(el){ K.bolumeGit(el.dataset.tab); },
    async 'topic-filter'(el){ S.ui.topicFilter = el.dataset.value; R.App.render(); },
    async 'topic-reset'(){ S.ui.topicFilter = 'all'; S.ui.topicQuery = ''; R.App.render(); },
    async 'open-subject'(el){ S.ui.subjectOpen = el.dataset.id; S.ui.bolumIstek = 'konular'; R.App.render(); },
    async 'sp-yukle'(){
      const ad = document.getElementById('sp-yukle-ad'), m = document.getElementById('sp-yukle-metin');
      const r = R.SinavProfil.metindenProfil(ad ? ad.value : '', m ? m.value : '');
      if(!r.ok){ UI.toast(r.why); return; }
      await R.SinavProfil.kaydet(r.profil);
      const s = R.SinavProfil.sayilar(r.profil);
      UI.toast('«' + r.profil.ad + '» eklendi: ' + s.ders + ' ders, ' + s.konu + ' konu'
        + (r.dusen ? ' (' + r.dusen + ' satır atlandı)' : ''), { undo:async () => {
          await R.SinavProfil.sil(r.profil.id); R.App.render(); } });
      R.App.render();
    },
    async 'so-iste'(el){
      const r = await R.SinavProfil.iste(el.dataset.ad);
      S.ui.spNot = r.metin;
      R.App.render();
    },
    async 'sp-iste'(){
      const inp = document.getElementById('sp-sinav');
      const r = await R.SinavProfil.iste(inp ? inp.value : '');
      S.ui.spNot = r.metin;
      R.App.render();
    },
    async 'kitap-iste'(el){
      const r = await R.TestKitabi.iste(el.dataset.id);
      S.ui.spNot = r.metin;
      R.App.render();
    },
    async 'sp-konu'(el){
      const r = await R.SinavProfil.konuIsaretle(el.dataset.profil, el.dataset.konu);
      if(!r.ok) UI.toast(r.why);
      R.App.render();
    },
    async 'sp-sil'(el){
      const p = R.SinavProfil.bul(el.dataset.id);
      if(!p) return;
      UI.confirmSheet(yz('ays.subjects.profili-kaldir'), '«' + p.ad + '» profili ve konu işaretlerin silinecek. '
        + yz('ays.subjects.yks-planin-degismez'), async () => {
        const r = await R.SinavProfil.sil(p.id);
        UI.toast(r.ok ? yz('ays.subjects.profil-kaldirildi') : r.why);
        R.App.render();
      }, false, yz('ays.subjects.profili-ve-isaretleri-sil'));
    },
    async 'open-topic'(el){ topicSheet(el.dataset.subject, el.dataset.topic); },
    async 'topic-open'(el){
      S.ui.topicSubject = el.dataset.subject;
      S.ui.topicOpen = el.dataset.topic;
      R.App.go('topic');
    },
    async 'save-topic'(el){
      const subjectId = el.dataset.subject, topicId = el.dataset.topic;
      const firstVal = document.getElementById('tp-first').value;
      const secondVal = document.getElementById('tp-second').value;
      const patch = {
        first: firstVal === '' ? null : Number(firstVal),
        firstAt: firstVal === '' ? null : (document.getElementById('tp-first-at').value || U.todayISO()),
        second: secondVal === '' ? null : Number(secondVal),
        secondAt: secondVal === '' ? null : (document.getElementById('tp-second-at').value || U.todayISO()),
        note: document.getElementById('tp-note').value,
      };
      const chosen = document.getElementById('tp-state').value;
      const auto = (patch.first != null && patch.second != null)
        ? ((patch.first >= R.CLOSURE_RULE.first && patch.second >= R.CLOSURE_RULE.second) ? 'closed' : 'practicing')
        : (patch.first != null ? (patch.first >= R.CLOSURE_RULE.first ? 'provisional' : 'practicing') : 'not_started');
      if(chosen !== auto) patch.state = chosen;

      const next = await M.setTopicState(subjectId, topicId, patch);
      UI.closeSheet();
      UI.toast(next.state === 'closed' ? yz('ays.subjects.konu-kapandi-2') : yz('ays.subjects.durum-kaydedildi'));
      R.App.render();
    },
  };

  const change = {
    async 'topic-search'(el){ S.ui.topicQuery = el.value; R.App.render(); },
    /* Tercih (küçük aksiyon): yalnız öneriyi sıralar, planı değiştirmez. */
    async 'so-egitim'(el){ S.profile.egitim = el.value || null; await R.Model.saveProfile(); R.App.render(); },
    async 'so-hedef'(el){ S.profile.sinavHedef = el.value || null; await R.Model.saveProfile(); R.App.render(); },
  };

  return {
    id:'subjects',
    /* Sadelik (brand/ortak/gizle.js): uzun aciklama ve basvuru bolumleri
       bastan kucuk gelir; baslik gorunur, ustune gelince onizlenir,
       «Ac» denirse acik kalir. Is yapilan bolumler ve sinir metinleri acik. */
    /* iPhone Faz 2: açık ders listesi ve konular; öncelik sırası ve seçili
       dersin künyesi (soru sayısı, hedef bandı, not) şerit. */
    get kucukVarsayilan(){
      const G = (window.LIFEOS || {}).Gizle;
      const s = R.SUBJECTS.find(x => x.id === openId());
      return ['kaynak-mimarisi', 'öncelik-sırası'].concat(G && s ? [G.anahtar(s.name)] : []);
    },
    title:yz('ays.subjects.dersler'),
    subtitle(){
      const o = C.overallClosure();
      const total = R.SUBJECTS.reduce((a, s) => a + s.topics.length, 0);
      return o.closed+' / '+o.total+' konu kapandı · '+R.SUBJECTS.length+' derste '+total+' konu';
    },
    actions(){ return ''; },
    render, handle, change,
  };
})();
