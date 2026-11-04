/* Konu özeti — bir konunun her şeyi tek ekranda.

   Şu an notlar Öğrenme'de, kartlar Tekrar'da, hatalar Yanlış defterinde,
   ölçümler Dersler'de duruyor. Bir konuya çalışırken dördünü birden görmek
   gerekiyor; bu ekran o dördünü birleştirir.

   Yazim bicimi: STIL.md. */

window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.yazilar({
  'ays.topic.risk':'risk ',
  'ays.topic.durumu-duzenle':'Durumu düzenle',
  'ays.topic.ogren':'Öğren',
  'ays.topic.anlatimi-ac':'Anlatımı aç',
  'ays.topic.sorular':'Sorular',
  'ays.topic.koca-sor':'Koça sor',
  'ays.topic.ders-notu-ekle':'Ders notu ekle',
  'ays.topic.okudum':'Okudum',
  'ays.topic.kart-ekle':'Kart ekle',
  'ays.topic.bugun-ekranina-git':'Bugün ekranına git',
  'ays.topic.yanlis-defteri':'Yanlış defteri',
  'ays.topic.testi-gir':'Testi gir',
  'ays.topic.ogrenme-yolu':'Öğrenme yolu',
  'ays.topic.tamamlandi':'tamamlandı',
  'ays.topic.siradaki-adim':'Sıradaki adım',
  'ays.topic.bu-arada-kartlarini-tekrar-e':'Bu arada kartlarını tekrar et; zamanı gelince burada «Testi gir» çıkar.',
  'ays.topic.okudum-bir-beyandir-sistem-d':'«Okudum» bir beyandır; sistem doğrulayamaz.',
  'ays.topic.i-sareti-kaldir':'İşareti kaldır',
  'ays.topic.esikler-planin-kuralidir-en':'Eşikler planın kuralıdır: en az',
  'ays.topic.soru-ve':'soru ve %',
  'ays.topic.dogruluk-kapanis':'doğruluk; kapanış %',
  'ays.topic.gun-sonra':'gün sonra %',
  'ays.topic.kapanis-olcumu':'Kapanış ölçümü',
  'ays.topic.i-lk-test':'İlk test ≥%',
  'ays.topic.1-olcum':'1. ölçüm',
  'ays.topic.2-olcum':'2. ölçüm',
  'ays.topic.pratik':'Pratik',
  'ays.topic.bu-konuya-bagli-bloklardan-g':'Bu konuya bağlı bloklardan gelen gerçek veri',
  'ays.topic.cozulen':'Çözülen',
  'ays.topic.dogruluk':'Doğruluk',
  'ays.topic.net-acigi':'Net açığı',
  'ays.topic.henuz-bu-konuya-bagli-blok':'Henüz bu konuya bağlı blok yok. Bugün ekranında bloğu bu konuya bağlarsan doğruluk buradan okunur.',
  'ays.topic.ders-notlari':'Ders notları',
  'ays.topic.bu-konuya-bagli-ders-notu':'Bu konuya bağlı ders notu yok.',
  'ays.topic.ders-ekle':'Ders ekle',
  'ays.topic.tekrar-kartlari':'Tekrar kartları',
  'ays.topic.bu-konuda-kart-yok-not':'Bu konuda kart yok. Not ya da yanlış kaydından üretilir.',
  'ays.topic.sina':'Sına',
  'ays.topic.bu-konudan-gelen-yanlislar':'Bu konudan gelen yanlışlar',
  'ays.topic.bu-konudan-kayitli-yanlis-yo':'Bu konudan kayıtlı yanlış yok.',
  'ays.topic.i-lke':'İlke:',
  'ays.topic.risk-neden-bu-kadar':'Risk neden bu kadar?',
  'ays.topic.skoru-olusturan-bes-girdi':'Skoru oluşturan beş girdi',
  'ays.topic.dersler':'Dersler',
  'ays.topic.konu-secilmedi':'Konu seçilmedi.',
  'ays.topic.derslere-git':'Derslere git',
  'ays.topic.i-saretlendi-siradaki-adim':'İşaretlendi · sıradaki adım: ',
  'ays.topic.okudum-isareti-kaldirildi':'«Okudum» işareti kaldırıldı',
  'ays.topic.konu':'Konu',
});
window.LIFEOS.PARCA.sayfa({ id:'topic', modul:'ays' });

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
      badge:when(risk, () => K.Badge({ label:yz('ays.topic.risk') + risk.score, tone:risk.tone })),
      actions:K.Button({ label:yz('ays.topic.durumu-duzenle'), size:'sm', tone:'primary', act:'topic-edit' }),
      body:html`
        ${K.Row([
          K.Chip(R.TOPIC_STATES[st.state].label),
          K.Chip(freq.label + ' frekans'),
          K.Chip('tahmini ' + topic.days),
          when(weeks.length, () => K.Chip('plan: H' + weeks.join(', H'))),
        ], { wrap:true })}
        <p class="small muted mt-10">${freq.note}</p>
        ${raw(soruSiklikHtml(topic))}`,
    });
  }

  /* SORU SIKLIĞI (data/sorusiklik.js, 2026-10-22): konunun TYT'de yıllara göre
     soru sayısı, ikincil kaynaktan («tahmin»). Kaynakta yılı olmayan sütun
     kesiktir (sıfır değil). Öncelik hesabına girmez; yalnız kanıt olarak durur. */
  function soruSiklikHtml(topic){
    const SS = R.SORU_SIKLIK, l = SS && SS.konular && SS.konular[topic.id];
    const P = (window.LIFEOS || {}).PANO;
    if(!l || !P) return '';
    const yil = y => '’' + String(y).slice(2);
    const seri = x => {
      const metin = SS.yillar.map((y, i) => y + ' ' + (x.seri[i] == null ? 'veri yok' : x.seri[i] + ' soru')).join(', ');
      return '<div class="soru-siklik__s"><p class="small"><b>' + U.esc(x.ad) + '</b>'
        + (x.ortak ? ' <span class="muted">· bu konu dahil, türlerin toplamı</span>' : '') + '</p>'
        + P.sutun({ degerler:x.seri, yukseklik:36, gunler:SS.yillar.map(yil),
            etiket:SS.sinav + ', ' + x.ad + ': ' + metin }) + '</div>';
    };
    return '<div class="soru-siklik mt-12" data-oz="soru-siklik"><p class="small muted">' + U.esc(SS.sinav)
      + '’te yıllara göre soru · ' + SS.yillar[0] + '–' + SS.yillar[SS.yillar.length - 1] + '</p>'
      + l.map(seri).join('')
      + '<p class="small muted">Kesik sütun: kaynakta o yıl yok. İkincil kaynak (<a href="' + U.esc(SS.kaynak)
      + '" target="_blank" rel="noopener">ozeldersalani.com</a>), etiket «tahmin»; öncelik sırasını değiştirmez.</p></div>';
  }

  /* ÖĞRENME YOLU (core/ogrenyolu.js): altı adım, sıradaki adım ve eylemi.
     Adımlar kayıtlardan okunur; eşikler planın kuralıdır ve yazılır. */

  /* ÖĞREN (screens/ogren.js, 2026-10-09): konunun anlatımı, örnek soruları,
     kısa özeti, BAM malzemeleri ve koçu artık Öğren çekmecesinde. Burada
     yalnız oraya giden tek kart durur: aynı şey iki yerde durmaz. */
  function ogrenData(subject, topic, route){
    return { 'data-route':route, 'data-subject':subject.id, 'data-topic':topic.id };
  }
  function ogrenCard(subject, topic){
    const O = R.Ogren;
    if(!O) return null;
    const d = O.durum(subject.id, topic.id);
    const parca = [d.anlatim ? 'ayrıntılı anlatım' : 'kısa özet'];
    if(d.skor.toplam) parca.push(d.skor.toplam + ' örnek soru');
    parca.push('koç');
    const durum = [d.okundu ? 'okundu' : 'okunmadı'];
    if(d.skor.cevaplanan) durum.push(d.skor.dogru + '/' + d.skor.toplam + ' örnek soru doğru (ölçüldü)');
    return K.Card({ title:yz('ays.topic.ogren'), sub:parca.join(' · '),
      body:html`<p class="small muted">${durum.join(' · ')}</p>
        <div class="row wrap gap-6 mt-10">
          ${K.Button({ label:yz('ays.topic.anlatimi-ac'), icon:'book', size:'sm', tone:'primary', act:'ogren-git', data:ogrenData(subject, topic, 'anlatim') })}
          ${when(d.skor.toplam, () => K.Button({ label:yz('ays.topic.sorular'), icon:'check', size:'sm', act:'ogren-git', data:ogrenData(subject, topic, 'sorular') }))}
          ${K.Button({ label:yz('ays.topic.koca-sor'), icon:'zap', size:'sm', tone:'ghost', act:'ogren-git', data:ogrenData(subject, topic, 'koc') })}
        </div>` });
  }

  const YOL_EYLEM = {
    ogren:(subject, topic) => K.Row([
      K.Button({ label:yz('ays.topic.anlatimi-ac'), icon:'book', size:'sm', tone:'primary', act:'ogren-git', data:ogrenData(subject, topic, 'anlatim') }),
      K.Button({ label:yz('ays.topic.ders-notu-ekle'), icon:'play', size:'sm', act:'topic-add-note' }),
      K.Button({ label:yz('ays.topic.okudum'), icon:'check', size:'sm', act:'yol-okundu' }),
    ], { wrap:true }),
    kartla:() => K.Button({ label:yz('ays.topic.kart-ekle'), icon:'cards', size:'sm', tone:'primary', act:'topic-add-card' }),
    coz:() => K.Button({ label:yz('ays.topic.bugun-ekranina-git'), icon:'today', size:'sm', tone:'primary', act:'go', data:{ 'data-route':'today' } }),
    duzelt:() => K.Button({ label:yz('ays.topic.yanlis-defteri'), icon:'list', size:'sm', tone:'primary', act:'yol-yanlis' }),
    olc:() => K.Button({ label:yz('ays.topic.testi-gir'), icon:'edit', size:'sm', tone:'primary', act:'topic-edit' }),
    pekistir:() => K.Button({ label:yz('ays.topic.testi-gir'), icon:'edit', size:'sm', tone:'primary', act:'topic-edit' }),
  };
  const YOL_NEDEN = {
    ogren:'Önce konunun kendisi: Öğren › Anlatım’da oku ya da bir ders izleyip not al; okuyunca «Okudum»a bas.',
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
      title:yz('ays.topic.ogrenme-yolu'), sub:tamam + ' / ' + l.length + ' adım', wide:true,
      badge:when(!s, () => K.Badge({ label:yz('ays.topic.tamamlandi'), tone:'ok' })),
      body:html`
        ${!s ? K.Notice({ tone:'ok', body:'Bütün adımlar tamam: konu iki ölçümle kapandı. Kartlar tekrar zamanında yine sorar.' })
          : s.bekle ? K.NextUp({ icon:'clock', calm:true, label:yz('ays.topic.siradaki-adim'), title:s.ad + ' · ' + s.ayrinti,
              why:yz('ays.topic.bu-arada-kartlarini-tekrar-e') })
          : K.NextUp({ icon:'target', label:yz('ays.topic.siradaki-adim'), title:s.ad, why:YOL_NEDEN[s.id] + ' ' + s.ayrinti,
              action:YOL_EYLEM[s.id](subject, topic) })}
        <ol class="yol mt-12" aria-label="Öğrenme yolunun adımları">${map(l, a => html`
          <li class="${'yol__adim' + (a.tamam ? ' is-tamam' : '') + (s && a.id === s.id ? ' is-sirada' : '')}">
            <span class="yol__isaret" aria-hidden="true">${raw(UI.icon(a.tamam ? 'check' : 'clock'))}</span>
            <span class="yol__metin"><b>${a.ad}</b> <span class="tiny dim">${a.ayrinti}</span></span>
            ${when(a.etiket, () => html`<span class="yol__etiket tiny">${a.etiket}</span>`)}
            <span class="sr-only">${a.tamam ? 'tamam' : 'eksik'}</span>
          </li>`)}</ol>
        ${when(st.okunduAt, () => html`<p class="tiny dim mt-10">${yz('ays.topic.okudum-bir-beyandir-sistem-d')}
          <button type="button" class="linkbtn" data-act="yol-okundu-geri">${yz('ays.topic.i-sareti-kaldir')}</button></p>`)}
        <p class="tiny dim mt-10">${yz('ays.topic.esikler-planin-kuralidir-en')} ${k.kartEnAz} kart, ${k.pratikEnAz} ${yz('ays.topic.soru-ve')}${k.pratikDogruluk} ${yz('ays.topic.dogruluk-kapanis')}${rule.first} ve ${rule.gapDays} ${yz('ays.topic.gun-sonra')}${rule.second}.</p>`,
    });
  }

  function measureCard(subject, topic, st){
    const rule = R.CLOSURE_RULE;
    const first = st.first, second = st.second;
    const dueISO = st.firstAt && second == null
      ? U.iso(U.addDays(U.parse(st.firstAt), rule.gapDays)) : null;
    const overdue = dueISO && dueISO < U.todayISO();

    return K.Card({
      title:yz('ays.topic.kapanis-olcumu'), hint:'second-check',
      sub:yz('ays.topic.i-lk-test') + rule.first + ' ve ' + rule.gapDays + ' gün sonra ≥%' + rule.second,
      body:html`
        ${K.Cols(2, [
          K.Stat({ label:yz('ays.topic.1-olcum'), value:first == null ? '—' : '%' + first,
            note:st.firstAt ? U.fmtShort(st.firstAt) : 'girilmedi',
            tone:first == null ? null : first >= rule.first ? 'ok' : 'warn' }),
          K.Stat({ label:yz('ays.topic.2-olcum'), value:second == null ? '—' : '%' + second,
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
      title:yz('ays.topic.pratik'), sub:yz('ays.topic.bu-konuya-bagli-bloklardan-g'),
      body:html`
        ${K.Cols(3, [
          K.Stat({ label:yz('ays.topic.cozulen'), value:U.fmtNum(p.solved), note:p.sessions + ' blok' }),
          K.Stat({ label:yz('ays.topic.dogruluk'), value:p.accuracy == null ? '—' : '%' + p.accuracy,
            tone:p.accuracy == null ? null : p.accuracy >= 70 ? 'ok' : 'warn' }),
          K.Stat({ label:yz('ays.topic.net-acigi'), value:v ? U.fmtNet(v.gap) : '—',
            note:v ? 'potansiyel ' + U.fmtNet(v.potential) : '' }),
        ])}
        ${when(p.solved === 0, () => html`<p class="tiny dim mt-10">
          ${yz('ays.topic.henuz-bu-konuya-bagli-blok')}</p>`)}`,
    });
  }

  function notesCard(subject, topic){
    const notes = notesOf(subject, topic);
    const segs = [];
    notes.forEach(n => n.segments.forEach(s => segs.push({ note:n, seg:s })));
    if(!segs.length){
      return K.Card({ title:yz('ays.topic.ders-notlari'),
        body:K.Empty({ icon:'play', text:yz('ays.topic.bu-konuya-bagli-ders-notu'),
          action:K.Button({ label:yz('ays.topic.ders-ekle'), size:'sm', act:'go', data:{ 'data-route':'learn' } }) }) });
    }
    return K.Card({
      title:yz('ays.topic.ders-notlari'), sub:U.plural(segs.length, 'not', 'not') + ' · ' + notes.length + ' ders',
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
      return K.Card({ title:yz('ays.topic.tekrar-kartlari'),
        body:K.Empty({ icon:'cards', text:yz('ays.topic.bu-konuda-kart-yok-not') }) });
    }
    return K.Card({
      title:yz('ays.topic.tekrar-kartlari'), sub:cards.length + ' kart · ' + due + ' bugün due',
      actions:when(due, () => K.Button({ label:yz('ays.topic.sina'), icon:'zap', size:'sm', act:'topic-quiz' })),
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
      return K.Card({ title:yz('ays.topic.bu-konudan-gelen-yanlislar'),
        body:K.Empty({ icon:'list', text:yz('ays.topic.bu-konudan-kayitli-yanlis-yo') }) });
    }
    const dist = {};
    errs.forEach(e => { dist[e.tag] = (dist[e.tag] || 0) + 1; });
    const top = Object.keys(dist).sort((a, b) => dist[b] - dist[a])[0];
    return K.Card({
      title:yz('ays.topic.bu-konudan-gelen-yanlislar'), sub:errs.length + ' kayıt',
      badge:when(top, () => K.Badge({ label:top + ' baskın', tone:'warn' })),
      body:html`
        <div class="stack-xs">${map(errs.slice(0, 6), e => html`
          <div class="row-top gap-8">
            ${raw(UI.tagDot(e.tag))}
            <div class="minw0">
              <div class="small">${e.rootCause || 'kök neden yazılmadı'}</div>
              ${when(e.principle, () => html`<div class="tiny dim">${yz('ays.topic.i-lke')} ${e.principle}</div>`)}
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
      title:yz('ays.topic.risk-neden-bu-kadar'), hint:'risk', sub:yz('ays.topic.skoru-olusturan-bes-girdi'),
      body:html`<div class="stack-xs">${map(parts, p => html`
        <div class="stack-xs">
          <div class="row between"><span class="small">${p[0]}</span>
            <span class="tiny dim num">${Math.round(p[1] * 100)}%</span></div>
          ${K.Bar({ value:p[1] * 100, tone:p[1] > 0.66 ? 'danger' : p[1] > 0.33 ? 'warn' : '' })}
        </div>`)}</div>`,
    });
  }

  LIFEOS.PARCA.blok({ id:'topic.konu-basligi-ve-geri-donus', sayfa:'topic', yer:'y1', sira:10, ad:'Konu başlığı ve geri dönüş', ciz({ subject, topic, st, risk }){
    return K.Row([
        K.Button({ label:yz('ays.topic.dersler'), icon:'left', size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'subjects' } }),
        K.Row([
          K.Button({ label:yz('ays.topic.ders-ekle'), icon:'plus', size:'sm', act:'topic-add-note' }),
          K.Button({ label:yz('ays.topic.kart-ekle'), icon:'cards', size:'sm', act:'topic-add-card' }),
        ], { wrap:true }),
      ], { between:true, wrap:true });
  } });
  LIFEOS.PARCA.blok({ id:'topic.headercard', sayfa:'topic', yer:'y2', sira:10, ad:'Konu başlığı', ciz({ subject, topic, st, risk }){
    return headerCard(subject, topic, st, risk);
  } });
  LIFEOS.PARCA.blok({ id:'topic.yolcard', sayfa:'topic', yer:'y2', sira:20, ad:'Konu yolu', ciz({ subject, topic, st, risk }){
    return yolCard(subject, topic, st);
  } });
  LIFEOS.PARCA.blok({ id:'topic.ogrencard', sayfa:'topic', yer:'y2', sira:30, ad:'Öğren', ciz({ subject, topic, st, risk }){
    return ogrenCard(subject, topic);
  } });
  LIFEOS.PARCA.blok({ id:'topic.measurecard', sayfa:'topic', yer:'y2', sira:40, ad:'Ölçüm', ciz({ subject, topic, st, risk }){
    return measureCard(subject, topic, st);
  } });
  LIFEOS.PARCA.blok({ id:'topic.practicecard', sayfa:'topic', yer:'y2', sira:50, ad:'Pratik', ciz({ subject, topic, st, risk }){
    return practiceCard(subject, topic);
  } });
  LIFEOS.PARCA.blok({ id:'topic.notescard', sayfa:'topic', yer:'y2', sira:60, ad:'Notlar', ciz({ subject, topic, st, risk }){
    return notesCard(subject, topic);
  } });
  LIFEOS.PARCA.blok({ id:'topic.riskcard', sayfa:'topic', yer:'y3', sira:10, ad:'Risk', ciz({ subject, topic, st, risk }){
    return riskCard(risk);
  } });
  LIFEOS.PARCA.blok({ id:'topic.cardscard', sayfa:'topic', yer:'y3', sira:20, ad:'Kartlar', ciz({ subject, topic, st, risk }){
    return cardsCard(subject, topic);
  } });
  LIFEOS.PARCA.blok({ id:'topic.errorscard', sayfa:'topic', yer:'y3', sira:30, ad:'Hatalar', ciz({ subject, topic, st, risk }){
    return errorsCard(subject, topic);
  } });
  LIFEOS.PARCA.blok({ id:'topic.aciklamalar', sayfa:'topic', yer:'y3', sira:40, ad:'Açıklamalar', ciz({ subject, topic, st, risk }){
    return raw(UI.rail(['closure', 'second-check', 'risk', 'recall']));
  } });
  async function render(){
    const { subject, topic } = ctx();
    if(!subject || !topic){
      return String(K.Card({ body:K.Empty({ icon:'book', text:yz('ays.topic.konu-secilmedi'),
        action:K.Button({ label:yz('ays.topic.derslere-git'), tone:'primary', act:'go', data:{ 'data-route':'subjects' } }) }) }));
    }
    const st = M.topicState(subject.id, topic.id);
    const risk = C.topicRisk(subject.id, topic.id);

    const parcaB = { subject, topic, st, risk };
    return String(K.Grid([
    K.Span(12, LIFEOS.PARCA.yer('topic', 'y1', K, parcaB, typeof raw === 'undefined' ? null : raw)),
    K.Span(7, K.Stack(LIFEOS.PARCA.liste('topic', 'y2', K, parcaB))),
    K.Span(5, K.Stack(LIFEOS.PARCA.liste('topic', 'y3', K, parcaB))),
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
      UI.toast(yz('ays.topic.i-saretlendi-siradaki-adim') + ((R.OgrenYolu.siradaki(subject.id, topic.id) || {}).ad || 'yok'));
      R.App.render();
    },
    async 'yol-okundu-geri'(){
      const { subject, topic } = ctx();
      if(!subject || !topic) return;
      await R.OgrenYolu.okundu(subject.id, topic.id, false);
      UI.toast(yz('ays.topic.okudum-isareti-kaldirildi'));
      R.App.render();
    },
    async 'yol-yanlis'(){
      S.ui.analyticsTab = 'errors';
      R.App.go('analytics');
    },
  };

  return {
    id:'topic',
    title:yz('ays.topic.konu'),
    subtitle(){
      const { subject, topic } = ctx();
      return topic ? subject.name + ' · ' + topic.name : 'Konu özeti';
    },
    actions(){ return ''; },
    render, handle,
  };
})();
