/* Konu özeti — bir konunun her şeyi tek ekranda.

   Şu an notlar Öğrenme'de, kartlar Tekrar'da, hatalar Yanlış defterinde,
   ölçümler Dersler'de duruyor. Bir konuya çalışırken dördünü birden görmek
   gerekiyor; bu ekran o dördünü birleştirir.

   Yazim bicimi: STIL.md. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.topic = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  function ctx(){
    const sid = S.ui.topicSubject;
    const tid = S.ui.topicOpen;
    const subject = R.SUBJECTS.find(s => s.id === sid);
    const topic = subject ? subject.topics.find(t => t.id === tid) : null;
    return { subject, topic };
  }

  function cardsOf(subject, topic){
    return S.cards.filter(c => c.subjectId === subject.id
      && (!c.topic || c.topic === topic.name || c.topic.indexOf(topic.name) >= 0));
  }
  function errorsOf(subject, topic){
    return S.errors.filter(e => e.subjectId === subject.id && e.topicId === topic.id);
  }
  function notesOf(subject, topic){
    return S.videoNotes.filter(n => n.subjectId === subject.id
      && (!n.topicId || n.topicId === topic.id));
  }
  function planWeeks(subject, topic){
    const plan = M.activePlan();
    if(!plan) return [];
    return plan.weeks.filter(w => (w.items || []).some(i =>
      i.subjectId === subject.id && i.topicId === topic.id)).map(w => w.n);
  }

  function headerCard(subject, topic, st, risk){
    const freq = R.TOPIC_FREQ[topic.freq] || R.TOPIC_FREQ.mid;
    const weeks = planWeeks(subject, topic);
    return K.Card({
      title:topic.name,
      sub:subject.name + (topic.group ? ' · ' + topic.group : ''),
      badge:when(risk, () => K.Badge({ label:'risk ' + risk.score, tone:risk.tone })),
      actions:K.Button({ label:'Durumu düzenle', size:'sm', tone:'primary', act:'topic-edit' }),
      body:html`
        ${K.Row([
          K.Chip(R.TOPIC_STATES[st.state].label),
          K.Chip(freq.label + ' frekans'),
          K.Chip('tahmini ' + topic.days),
          when(weeks.length, () => K.Chip('plan: H' + weeks.join(', H'))),
        ], { wrap:true })}
        <p class="small muted mt-10">${freq.note}</p>`,
    });
  }

  /* ÖĞRENME YOLU (core/ogrenyolu.js): altı adım, sıradaki adım ve eylemi.
     Adımlar kayıtlardan okunur; eşikler planın kuralıdır ve yazılır. */
  /* KONUNUN MALZEMELERİ (BAM; brand/ortak/urun.js söz 6). «Bu konuyu
     öğren» konu anlatımını ister; kavram sözlüğü ve çalışma kâğıdı ayrı.
     Her istek King'in onay kapısından geçer (model kotası harcar); ürün
     Onaylar'dan gelir ve burada, konusunun yanında açılır. HKM kapalıyken
     gelmiş olanlar okunur. Etiket modülün kendi bağıdır; HKM anlamaz. */
  const MALZEME = [
    { tur:'ders_notu', ad:'Konu anlatımı' },
    { tur:'sozluk', ad:'Kavram sözlüğü' },
    { tur:'calisma_kagidi', ad:'Çalışma kâğıdı' },
  ];
  function etiketOf(subject, topic){ return 'ays:konu:' + subject.id + '/' + topic.id; }
  function malzemeler(subject, topic){
    const Ur = R.Urunler;
    if(!Ur || !Ur.etiketli) return null;
    const et = etiketOf(subject, topic);
    return { urunler:Ur.etiketli(et), bekleyen:Ur.bekleyen(et) };
  }
  function malzemeCard(subject, topic){
    const m = malzemeler(subject, topic);
    if(!m) return null;
    const var_ = tur => m.urunler.some(u => u.urun === tur);
    const istendi = tur => m.bekleyen.some(x => x.tur === tur);
    const eksik = MALZEME.filter(x => !var_(x.tur));
    return K.Card({
      title:'Konunun malzemeleri',
      sub:m.urunler.length ? m.urunler.length + ' malzeme · internetsiz de açılır' : 'BAM bu konu için yazar',
      body:html`
        ${when(m.urunler.length, () => html`<div class="stack-xs">${map(m.urunler, u => html`
          <div class="row between gap-8">
            <span class="small minw0"><b>${u.urunAd}</b> <span class="dim">${u.baslik}</span>
              <span class="tiny dim">· ${LIFEOS.Urun.etiketAdi(u.dogruluk)}</span></span>
            ${K.Button({ label:'Aç', size:'sm', act:'konu-urun-ac', data:{ 'data-id':u.id } })}
          </div>`)}</div>`)}
        ${when(eksik.length, () => html`<div class="row wrap gap-6 ${m.urunler.length ? 'mt-12' : ''}">${map(eksik, x => istendi(x.tur)
          ? K.Chip(x.ad + ' · istendi')
          : K.Button({ label:x.tur === 'ders_notu' ? 'Bu konuyu öğren' : x.ad, icon:x.tur === 'ders_notu' ? 'book' : null,
              size:'sm', tone:x.tur === 'ders_notu' ? 'primary' : null, act:'konu-malzeme', data:{ 'data-tur':x.tur } }))}</div>`)}
        <p class="tiny dim mt-10">Her istek önce King’in onayından geçer (Bugün › King teklifi); BAM yazar, sonra Onaylar’a
          gelir. Kaynaksız malzeme «doğrulanmadı» yazar: karar vermeden önce bir kaynağa bak.</p>`,
    });
  }

  const YOL_EYLEM = {
    ogren:(subject, topic) => {
      const m = malzemeler(subject, topic);
      const anlatim = m && m.urunler.find(u => u.urun === 'ders_notu');
      const istendi = m && m.bekleyen.some(x => x.tur === 'ders_notu');
      return K.Row([
        anlatim ? K.Button({ label:'Anlatımı aç', icon:'book', size:'sm', tone:'primary', act:'konu-urun-ac', data:{ 'data-id':anlatim.id } })
          : m && !istendi ? K.Button({ label:'Bu konuyu öğren', icon:'book', size:'sm', tone:'primary', act:'konu-malzeme', data:{ 'data-tur':'ders_notu' } })
          : null,
        K.Button({ label:'Ders notu ekle', icon:'play', size:'sm', tone:anlatim || (m && !istendi) ? null : 'primary', act:'topic-add-note' }),
        K.Button({ label:'Okudum', icon:'check', size:'sm', act:'yol-okundu' }),
      ].filter(Boolean), { wrap:true });
    },
    kartla:() => K.Button({ label:'Kart ekle', icon:'cards', size:'sm', tone:'primary', act:'topic-add-card' }),
    coz:() => K.Button({ label:'Bugün ekranına git', icon:'today', size:'sm', tone:'primary', act:'go', data:{ 'data-route':'today' } }),
    duzelt:() => K.Button({ label:'Yanlış defteri', icon:'list', size:'sm', tone:'primary', act:'yol-yanlis' }),
    olc:() => K.Button({ label:'Testi gir', icon:'edit', size:'sm', tone:'primary', act:'topic-edit' }),
    pekistir:() => K.Button({ label:'Testi gir', icon:'edit', size:'sm', tone:'primary', act:'topic-edit' }),
  };
  const YOL_NEDEN = {
    ogren:'Önce konunun kendisi: anlatımı oku ya da bir ders izleyip not al; okuyunca «Okudum»a bas.',
    kartla:'Öğrendiğini karta çevir: kart, unutmadan önce sana geri sorar.',
    coz:'Bugün ekranında bir bloğu bu konuya bağla; çözdüğün soru ve doğruluk buraya sayılır.',
    duzelt:'Bu konudan açık yanlış var: kök nedenini yaz, ilkesini çıkar, kapat.',
    olc:'Konu testi: ilk ölçüm kapanışın yarısıdır.',
    pekistir:'Aynı konuyu bir hafta sonra yeniden ölç: tek ölçüm kapanış saymaz.',
  };
  function yolCard(subject, topic, st){
    const Y = R.OgrenYolu;
    if(!Y) return null;
    const l = Y.adimlar(subject.id, topic.id);
    const s = l.find(a => !a.tamam) || null;
    const tamam = l.filter(a => a.tamam).length;
    const k = Y.KURAL, rule = R.CLOSURE_RULE;
    return K.Card({
      title:'Öğrenme yolu', sub:tamam + ' / ' + l.length + ' adım', wide:true,
      badge:when(!s, () => K.Badge({ label:'tamamlandı', tone:'ok' })),
      body:html`
        ${!s ? K.Notice({ tone:'ok', body:'Bütün adımlar tamam: konu iki ölçümle kapandı. Kartlar tekrar zamanında yine sorar.' })
          : s.bekle ? K.NextUp({ icon:'clock', calm:true, label:'Sıradaki adım', title:s.ad + ' · ' + s.ayrinti,
              why:'Bu arada kartlarını tekrar et; zamanı gelince burada «Testi gir» çıkar.' })
          : K.NextUp({ icon:'target', label:'Sıradaki adım', title:s.ad, why:YOL_NEDEN[s.id] + ' ' + s.ayrinti,
              action:YOL_EYLEM[s.id](subject, topic) })}
        <ol class="yol mt-12" aria-label="Öğrenme yolunun adımları">${map(l, a => html`
          <li class="${'yol__adim' + (a.tamam ? ' is-tamam' : '') + (s && a.id === s.id ? ' is-sirada' : '')}">
            <span class="yol__isaret" aria-hidden="true">${raw(UI.icon(a.tamam ? 'check' : 'clock'))}</span>
            <span class="yol__metin"><b>${a.ad}</b> <span class="tiny dim">${a.ayrinti}</span></span>
            ${when(a.etiket, () => html`<span class="yol__etiket tiny">${a.etiket}</span>`)}
            <span class="sr-only">${a.tamam ? 'tamam' : 'eksik'}</span>
          </li>`)}</ol>
        ${when(st.okunduAt, () => html`<p class="tiny dim mt-10">«Okudum» bir beyandır; sistem doğrulayamaz.
          <button type="button" class="linkbtn" data-act="yol-okundu-geri">İşareti kaldır</button></p>`)}
        <p class="tiny dim mt-10">Eşikler planın kuralıdır: en az ${k.kartEnAz} kart, ${k.pratikEnAz} soru ve
          %${k.pratikDogruluk} doğruluk; kapanış %${rule.first} ve ${rule.gapDays} gün sonra %${rule.second}.</p>`,
    });
  }

  function measureCard(subject, topic, st){
    const rule = R.CLOSURE_RULE;
    const first = st.first, second = st.second;
    const dueISO = st.firstAt && second == null
      ? U.iso(U.addDays(U.parse(st.firstAt), rule.gapDays)) : null;
    const overdue = dueISO && dueISO < U.todayISO();

    return K.Card({
      title:'Kapanış ölçümü', hint:'second-check',
      sub:'İlk test ≥%' + rule.first + ' ve ' + rule.gapDays + ' gün sonra ≥%' + rule.second,
      body:html`
        ${K.Cols(2, [
          K.Stat({ label:'1. ölçüm', value:first == null ? '—' : '%' + first,
            note:st.firstAt ? U.fmtShort(st.firstAt) : 'girilmedi',
            tone:first == null ? null : first >= rule.first ? 'ok' : 'warn' }),
          K.Stat({ label:'2. ölçüm', value:second == null ? '—' : '%' + second,
            note:second != null ? U.fmtShort(st.secondAt)
              : dueISO ? (overdue ? 'gecikti' : U.relativeDay(dueISO)) : 'ilk ölçümden sonra',
            tone:second == null ? (overdue ? 'warn' : null) : second >= rule.second ? 'ok' : 'warn' }),
        ])}
        ${when(overdue, () => html`<div class="mt-12">${K.Notice({ tone:'warn',
          body:'2. ölçüm gecikti. Tek ölçüm kapanış saymaz; konu kapalı görünüyor ama kapalı değil.' })}</div>`)}
        ${when(st.note, () => html`<p class="small muted mt-10"><span class="dim">Not:</span> ${st.note}</p>`)}`,
    });
  }

  function practiceCard(subject, topic){
    const p = C.topicPractice(subject.id, topic.id);
    const v = R.Analytics.topicValue().find(x => x.subjectId === subject.id && x.topicId === topic.id);
    return K.Card({
      title:'Pratik', sub:'Bu konuya bağlı bloklardan gelen gerçek veri',
      body:html`
        ${K.Cols(3, [
          K.Stat({ label:'Çözülen', value:U.fmtNum(p.solved), note:p.sessions + ' blok' }),
          K.Stat({ label:'Doğruluk', value:p.accuracy == null ? '—' : '%' + p.accuracy,
            tone:p.accuracy == null ? null : p.accuracy >= 70 ? 'ok' : 'warn' }),
          K.Stat({ label:'Net açığı', value:v ? U.fmtNet(v.gap) : '—',
            note:v ? 'potansiyel ' + U.fmtNet(v.potential) : '' }),
        ])}
        ${when(p.solved === 0, () => html`<p class="tiny dim mt-10">
          Henüz bu konuya bağlı blok yok. Bugün ekranında bloğu bu konuya bağlarsan
          doğruluk buradan okunur.</p>`)}`,
    });
  }

  function notesCard(subject, topic){
    const notes = notesOf(subject, topic);
    const segs = [];
    notes.forEach(n => n.segments.forEach(s => segs.push({ note:n, seg:s })));
    if(!segs.length){
      return K.Card({ title:'Ders notları',
        body:K.Empty({ icon:'play', text:'Bu konuya bağlı ders notu yok.',
          action:K.Button({ label:'Ders ekle', size:'sm', act:'go', data:{ 'data-route':'learn' } }) }) });
    }
    return K.Card({
      title:'Ders notları', sub:U.plural(segs.length, 'not', 'not') + ' · ' + notes.length + ' ders',
      body:html`<div class="stack-xs">${map(segs.slice(0, 10), x => html`
        <div class="row-top gap-8">
          <a class="seg-row__ts num" href="${M.tsUrl(x.note, x.seg.ts)}" target="_blank" rel="noopener">${M.fmtTs(x.seg.ts)}</a>
          <span class="small">${x.seg.text}</span>
        </div>`)}</div>`,
    });
  }

  function cardsCard(subject, topic){
    const cards = cardsOf(subject, topic);
    const due = cards.filter(c => c.dueAt <= U.todayISO()).length;
    if(!cards.length){
      return K.Card({ title:'Tekrar kartları',
        body:K.Empty({ icon:'cards', text:'Bu konuda kart yok. Not ya da yanlış kaydından üretilir.' }) });
    }
    return K.Card({
      title:'Tekrar kartları', sub:cards.length + ' kart · ' + due + ' bugün due',
      actions:when(due, () => K.Button({ label:'Sına', icon:'zap', size:'sm', act:'topic-quiz' })),
      body:html`<div class="stack-xs">${map(cards.slice(0, 8), c => html`
        <div class="row between">
          <span class="small truncate">${c.front}</span>
          <span class="${c.dueAt <= U.todayISO() ? 'tiny num is-late' : 'tiny num dim'}">${U.fmtShort(c.dueAt)}</span>
        </div>`)}</div>`,
    });
  }

  function errorsCard(subject, topic){
    const errs = errorsOf(subject, topic);
    if(!errs.length){
      return K.Card({ title:'Bu konudan gelen yanlışlar',
        body:K.Empty({ icon:'list', text:'Bu konudan kayıtlı yanlış yok.' }) });
    }
    const dist = {};
    errs.forEach(e => { dist[e.tag] = (dist[e.tag] || 0) + 1; });
    const top = Object.keys(dist).sort((a, b) => dist[b] - dist[a])[0];
    return K.Card({
      title:'Bu konudan gelen yanlışlar', sub:errs.length + ' kayıt',
      badge:when(top, () => K.Badge({ label:top + ' baskın', tone:'warn' })),
      body:html`
        <div class="stack-xs">${map(errs.slice(0, 6), e => html`
          <div class="row-top gap-8">
            ${raw(UI.tagDot(e.tag))}
            <div class="minw0">
              <div class="small">${e.rootCause || 'kök neden yazılmadı'}</div>
              ${when(e.principle, () => html`<div class="tiny dim">İlke: ${e.principle}</div>`)}
            </div>
          </div>`)}</div>
        ${when(top, () => html`<div class="mt-12">${K.Notice({ tone:'info',
          body:'Baskın hata ' + top + ' — ' + R.ERROR_TAGS[top].name + '. Reçete: ' + R.ERROR_TAGS[top].recipe })}</div>`)}`,
    });
  }

  function riskCard(risk){
    if(!risk) return null;
    const parts = [
      ['Frekans', risk.parts.freq],
      ['Kapanış', risk.parts.closure],
      ['Açık yanlış', risk.parts.errors],
      ['Gecikmiş kart', risk.parts.cards],
      ['Tazelik', risk.parts.stale],
      ['Pratik', risk.parts.practice || 0],
    ];
    return K.Card({
      title:'Risk neden bu kadar?', hint:'risk', sub:'Skoru oluşturan beş girdi',
      body:html`<div class="stack-xs">${map(parts, p => html`
        <div class="stack-xs">
          <div class="row between"><span class="small">${p[0]}</span>
            <span class="tiny dim num">${Math.round(p[1] * 100)}%</span></div>
          ${K.Bar({ value:p[1] * 100, tone:p[1] > 0.66 ? 'danger' : p[1] > 0.33 ? 'warn' : '' })}
        </div>`)}</div>`,
    });
  }

  async function render(){
    const { subject, topic } = ctx();
    if(!subject || !topic){
      return String(K.Card({ body:K.Empty({ icon:'book', text:'Konu seçilmedi.',
        action:K.Button({ label:'Derslere git', tone:'primary', act:'go', data:{ 'data-route':'subjects' } }) }) }));
    }
    const st = M.topicState(subject.id, topic.id);
    const risk = C.topicRisk(subject.id, topic.id);

    return String(K.Grid([
      K.Span(12, K.Row([
        K.Button({ label:'Dersler', icon:'left', size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'subjects' } }),
        K.Row([
          K.Button({ label:'Ders ekle', icon:'plus', size:'sm', act:'topic-add-note' }),
          K.Button({ label:'Kart ekle', icon:'cards', size:'sm', act:'topic-add-card' }),
        ], { wrap:true }),
      ], { between:true, wrap:true })),

      K.Span(7, K.Stack([
        headerCard(subject, topic, st, risk),
        yolCard(subject, topic, st),
        malzemeCard(subject, topic),
        measureCard(subject, topic, st),
        practiceCard(subject, topic),
        notesCard(subject, topic),
      ])),

      K.Span(5, K.Stack([
        riskCard(risk),
        cardsCard(subject, topic),
        errorsCard(subject, topic),
        raw(UI.rail(['closure', 'second-check', 'risk', 'recall'])),
      ])),
    ]));
  }

  const handle = {
    async 'topic-edit'(){
      const { subject, topic } = ctx();
      if(subject && topic) R.Screens.subjects.handle['open-topic']({ dataset:{ subject:subject.id, topic:topic.id } });
    },
    async 'topic-quiz'(){
      const { subject, topic } = ctx();
      if(!subject || !topic) return;
      S.ui.quizMode = 'topic';
      S.ui.quizSubject = subject.id;
      S.ui.quizTopic = topic.id;
      R.App.go('quiz');
    },
    async 'topic-add-note'(){
      const { subject, topic } = ctx();
      S.ui.noteOpen = null;
      R.App.go('learn');
      setTimeout(() => R.Screens.learn.handle['note-new']({ dataset:{
        subject:subject ? subject.id : '', topic:topic ? topic.id : '' } }), 80);
    },
    async 'topic-add-card'(){
      R.App.go('cards');
      setTimeout(() => R.Screens.cards.handle['new-card']({ dataset:{} }), 80);
    },
    /* Öğrenme yolu: «Okudum» bir beyandır (core/ogrenyolu.js söz 2). */
    async 'yol-okundu'(){
      const { subject, topic } = ctx();
      if(!subject || !topic) return;
      await R.OgrenYolu.okundu(subject.id, topic.id, true);
      UI.toast('İşaretlendi · sıradaki adım: ' + ((R.OgrenYolu.siradaki(subject.id, topic.id) || {}).ad || 'yok'));
      R.App.render();
    },
    async 'yol-okundu-geri'(){
      const { subject, topic } = ctx();
      if(!subject || !topic) return;
      await R.OgrenYolu.okundu(subject.id, topic.id, false);
      UI.toast('«Okudum» işareti kaldırıldı');
      R.App.render();
    },
    /* «Bu konuyu öğren» ve öteki malzemeler: açık istek, konu etiketiyle. */
    async 'konu-malzeme'(el){
      const { subject, topic } = ctx();
      const m = MALZEME.find(x => x.tur === el.dataset.tur);
      if(!subject || !topic || !m || !R.Urunler) return;
      const sinav = subject.id.indexOf('ayt') === 0 ? 'AYT' : 'TYT';
      const konu = topic.name + ' (' + subject.name + ')';
      const ayrinti = 'YKS ' + sinav + ' hazırlığı: ' + subject.name + (topic.group ? ' › ' + topic.group : '')
        + ' › ' + topic.name + '. Lise düzeyinde; tanımlar, adım adım çözülmüş örnekler, sık yapılan hatalar '
        + 've ÖSYM soru tarzına uygun kısa alıştırmalar.';
      const r = await R.Urunler.iste(m.ad + ': ' + konu, { tur:m.tur, konu, ayrinti, etiket:etiketOf(subject, topic) });
      UI.toast(r.metin || (r.ok ? 'King’e iletildi.' : 'İletilemedi.'), { life:r.ok ? 5000 : 6000 });
      R.App.render();
    },
    /* Malzeme KUTUDA açılır (brand/ortak/urun.js söz 2): betik çalışmaz. */
    async 'konu-urun-ac'(el){
      const u = R.Urunler && R.Urunler.bul(el.dataset.id);
      if(!u) return;
      UI.sheet({ title:u.baslik, wide:true,
        subtitle:u.urunAd + ' · ' + LIFEOS.Urun.etiketAdi(u.dogruluk),
        note:u.dogruluk === 'dogrulanmadi' ? 'Doğrulanmadı: kaynaksız, modelin bilgisidir. '
          + 'Karar vermeden önce bir kaynağa bak.' : null,
        body:LIFEOS.Urun.cerceve(u) });
    },
    async 'yol-yanlis'(){
      S.ui.analyticsTab = 'errors';
      R.App.go('analytics');
    },
  };

  return {
    id:'topic',
    title:'Konu',
    subtitle(){
      const { subject, topic } = ctx();
      return topic ? subject.name + ' · ' + topic.name : 'Konu özeti';
    },
    actions(){ return ''; },
    render, handle,
  };
})();
