/* Sınama — kendini test et, boşluğu gör, boşluğu karta çevir.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz.
   Karar motoru R.Quiz'dedir; ekran yalnizca cizer ve olay tasir. */
window.LIFEOS.PARCA.yazilar({
  'ays.quiz.ne-kadar-eminsin':'Ne kadar eminsin?',
  'ays.quiz.eminim':'Eminim',
  'ays.quiz.kararsizim':'Kararsızım',
  'ays.quiz.tahmin':'Tahmin',
  'ays.quiz.emindin-kart-one-alindi':'Emindin; bu kart sonraki sınamada öne alınır.',
  'ays.quiz.bugunku-sira':'Bugünkü sıra',
  'ays.quiz.karisik':'karışık',
  'ays.quiz.sirayi-sina':'Sırayı sına',
  'ays.quiz.emin-yanilmistin':'emin yanılmıştın',
  'ays.quiz.gun-gecikti':' gün gecikti',
  'ays.quiz.ilk-sinama':'ilk sınama',
  'ays.quiz.kalicilik':'Kalıcılık',
  'ays.quiz.konu-olculdu':' konu ölçüldü',
  'ays.quiz.emin-dediklerinin':'Emin dediklerinin %',
  'ays.quiz.kadari-tuttu':' kadarı tuttu',
  'ays.quiz.cevap':' cevap',
  'ays.quiz.kalicilik-kurali':'kalıcı: 7 gün arayla %70 ve üstü · sağlam: 21 gün, karışık sınamada',
});

window.LIFEOS.PARCA.yazilar({
  'ays.quiz.olcumden':'Ölçümden: ',
  'ays.quiz.bu-secimde-sinanacak-madde-y':'Bu seçimde sınanacak madde yok. Ders notu ekle, kart üret ya da ',
  'ays.quiz.bos-biraktin':'Boş bıraktın.',
  'ays.quiz.senin-cevabin':'Senin cevabın ',
  'ays.quiz.hatali-isaretli-geri-al':'Hatalı işaretli — geri al',
  'ays.quiz.bu-soru-hatali':'Bu soru hatalı',
  'ays.quiz.dogru-sik':'Doğru şık',
  'ays.quiz.yanlis-sik-dogrusu-isaretlen':'Yanlış şık — doğrusu işaretlendi',
  'ays.quiz.yarim-oturum-kaydedilmez-ver':'Yarım oturum kaydedilmez; verdiğin cevaplar kart aralıklarına zaten işlendi.',
  'ays.quiz.kaydetmeden-bitir':'Kaydetmeden bitir',
  'ays.quiz.once-kart-veya-ders-notu':'Önce kart veya ders notu üret',
});


window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'ays', sira:100, group:'Git', label:'Sınama — kendini test et', icon:'zap', route:'quiz', run(){ R.App.go('quiz'); } });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:250, group:'Kayıt', label:'Sınamayı başlat', icon:'play', route:'quiz', run(){ R.App.go('quiz'); setTimeout(()=>R.Screens.quiz.handle['quiz-start']({dataset:{}}), 60); } });
window.LIFEOS.PARCA.yazilar({
  'ays.quiz.bilmiyordum':'Bilmiyordum',
  'ays.quiz.emin-degildim':'Emin değildim',
  'ays.quiz.biliyordum':'Biliyordum',
  'ays.quiz.tum-konular':'— tüm konular —',
  'ays.quiz.once-ders-sec':'— önce ders seç —',
  'ays.quiz.sinama-kur':'Sınama kur',
  'ays.quiz.kaynak':'Kaynak',
  'ays.quiz.ders':'Ders',
  'ays.quiz.ders-2':'— ders —',
  'ays.quiz.konu':'Konu',
  'ays.quiz.soru-sayisi':'Soru sayısı',
  'ays.quiz.bicim':'Biçim',
  'ays.quiz.sinama-bicimi':'Sınama biçimi',
  'ays.quiz.diger-ayarlar':'Diğer ayarlar ·',
  'ays.quiz.soru-basina-sure':'Soru başına süre',
  'ays.quiz.soru-suresi':'Soru süresi',
  'ays.quiz.okuma':'Okuma',
  'ays.quiz.sessiz':'Sessiz',
  'ays.quiz.sesli':'Sesli',
  'ays.quiz.sesli-okuma':'Sesli okuma',
  'ays.quiz.sinamayi-baslat':'Sınamayı başlat',
  'ays.quiz.neden-sinama':'Neden sınama?',
  'ays.quiz.kart-cevirmekten-farki':'Kart çevirmekten farkı',
  'ays.quiz.karti-gorunce-biliyorum-deme':'Kartı görünce “biliyorum” demek',
  'ays.quiz.tanimadir':'tanımadır',
  'ays.quiz.sinav':'; sınav',
  'ays.quiz.uretme':'üretme',
  'ays.quiz.bilinmeyen-madde-otomatik-ka':'Bilinmeyen madde otomatik karta düşer, tekrar takvimine girer.',
  'ays.quiz.bilinen-madde-kartin-araligi':'Bilinen madde kartın aralığını uzatır — boşuna tekrar etmezsin.',
  'ays.quiz.oturum-sonunda-zayif-konular':'Oturum sonunda zayıf konular adlandırılır; tahmin yok, sayım var.',
  'ays.quiz.havuz':'Havuz',
  'ays.quiz.su-an-sinanabilir-madde':'Şu an sınanabilir madde',
  'ays.quiz.bugunun-karti':'Bugünün kartı',
  'ays.quiz.acik-yanlis':'Açık yanlış',
  'ays.quiz.ders-notu':'Ders notu',
  'ays.quiz.toplam':'Toplam',
  'ays.quiz.cevabi-once-kendine-soyle':'Cevabı önce kendine söyle — sonra göster.',
  'ays.quiz.dogru-cevap':'Doğru cevap',
  'ays.quiz.bir-sik-sec-sonra':'Bir şık seç — sonra kendini işaretle.',
  'ays.quiz.cevabi-goster':'Cevabı göster',
  'ays.quiz.atla':'Atla',
  'ays.quiz.oturumu-bitir':'Oturumu bitir',
  'ays.quiz.nasil-isaretlemeli':'Nasıl işaretlemeli?',
  'ays.quiz.durustluk-burada-ise-yarar':'Dürüstlük burada işe yarar',
  'ays.quiz.aklina-gelmedi-kart-yarin-ge':'Aklına gelmedi. Kart yarın geri gelir.',
  'ays.quiz.kismen-geldi-aralik-kisalir':'Kısmen geldi. Aralık kısalır.',
  'ays.quiz.bakmadan-uretebildin-aralik':'Bakmadan üretebildin. Aralık uzar.',
  'ays.quiz.kendine-iyi-not-vermek-sinav':'Kendine iyi not vermek, sınavda ödemeni pahalılaştırır.',
  'ays.quiz.son-oturum':'Son oturum',
  'ays.quiz.emin-degil':'Emin değil',
  'ays.quiz.yeni-tekrar-karti-acildi-yar':'yeni tekrar kartı açıldı; yarın karşına çıkacak.',
  'ays.quiz.zayif-konular':'Zayıf konular',
  'ays.quiz.tekrar-sina':'Tekrar sına',
  'ays.quiz.kartlara-git':'Kartlara git',
  'ays.quiz.soru':'Soru ',
  'ays.quiz.modelin-beyani-tahmin-secili':'(modelin beyanı, tahmin). Seçili şıkka yeniden dokunursan boş bırakırsın.',
  'ays.quiz.onceki':'Önceki',
  'ays.quiz.sonraki':'Sonraki',
  'ays.quiz.bolumu-bitir':'Bölümü bitir',
  'ays.quiz.vazgec':'Vazgeç',
  'ays.quiz.bu-bolumde-yanlis-yok-defter':'Bu bölümde yanlış yok; deftere eklenecek soru yok.',
  'ays.quiz.yanlisin-hepsi-yanlis-defter':'yanlışın hepsi yanlış defterinde.',
  'ays.quiz.yanlislari-deftere-ekle':'Yanlışları deftere ekle (',
  'ays.quiz.hata-turunu-k-i-y-s-d-defter':'Hata türünü (K/İ/Y/S/D) defterde sen seçersin.',
  'ays.quiz.dogru':'Doğru',
  'ays.quiz.yanlis':'Yanlış',
  'ays.quiz.bos':'Boş',
  'ays.quiz.net-ve-puan-hesaplanmaz':'. Net ve puan hesaplanmaz: kuralı sınavdan sınava değişir.',
  'ays.quiz.zorluga-gore-etiket-modelin':'Zorluğa göre (etiket modelin beyanı, doğru sayısı senin ölçümün):',
  'ays.quiz.kapat':'Kapat',
  'ays.quiz.gozden-gecir':'Gözden geçir',
  'ays.quiz.anahtari-yanlis-buldugun-sor':'Anahtarı yanlış bulduğun soruyu işaretle; sonuca sayılmaz.',
  'ays.quiz.bolum-birakildi-sonuc-yazilm':'Bölüm bırakıldı; sonuç yazılmadı.',
  'ays.quiz.oturum-bitti':'Oturum bitti · %',
  'ays.quiz.sure-doldu-oturum-bitti':'Süre doldu — oturum bitti',
  'ays.quiz.sure-doldu':'Süre doldu',
  'ays.quiz.sinama':'Sınama',
});
window.LIFEOS.PARCA.sayfa({ id:'quiz', modul:'ays', cekmece:'calisma', ad:'Sınama', ikon:'zap', sira:40 });

R.Screens.quiz = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;
  const Q = R.Quiz;

  const VERDICTS = [
    { key:'unknown', label:yz('ays.quiz.bilmiyordum'), tone:'danger', hint:'1' },
    { key:'shaky',   label:yz('ays.quiz.emin-degildim'), tone:null,   hint:'2' },
    { key:'known',   label:yz('ays.quiz.biliyordum'),  tone:'primary', hint:'3' },
  ];

  let lastSummary = null;

  /* ---------- kurulum ---------- */

  function setupView(){
    const av = Q.availability();
    const mode = S.ui.quizMode || 'due';
    const size = S.ui.quizSize || 10;
    const count = {
      due:av.due, errors:av.errors, notes:av.notes, mixed:av.mixed, siradaki:av.siradaki,
      subject:Q.pool({ mode:'subject', subjectId:S.ui.quizSubject || null }).length,
      topic:Q.pool({ mode:'topic', subjectId:S.ui.quizSubject || null, topicId:S.ui.quizTopic || null }).length,
    };
    const ready = (count[mode] || 0) > 0;

    const modeItems = Object.keys(Q.MODES).map(k => ({
      value:k, label:Q.MODES[k].label + (count[k] != null ? ' (' + count[k] + ')' : ''),
    }));

    const subject = R.SUBJECTS.find(s => s.id === S.ui.quizSubject);
    const topicOpts = subject
      ? [{ value:'', label:yz('ays.quiz.tum-konular') }].concat(subject.topics.map(t => ({ value:t.id, label:t.name })))
      : [{ value:'', label:yz('ays.quiz.once-ders-sec') }];

    return K.Grid([
      K.Span(7, K.Stack([
        K.Card({
          /* iPhone Faz 2d: «önce üret, sonra bak» ⓘ'de (hints: quiz) */
          title:yz('ays.quiz.sinama-kur'), hint:'quiz',
          body:html`
            ${K.Field({ label:yz('ays.quiz.kaynak'), hint:mode === 'zayif' && Q.zayifKonular(3).length
              ? yz('ays.quiz.olcumden') + Q.zayifKonular(3).map(x => x.konu + ' (' + x.acikYanlis + ' açık yanlış)').join(', ')
              : Q.MODES[mode].note,
              input:K.Select({ id:'qz-mode', options:modeItems, value:mode, change:'quiz-mode' }) })}
            ${when(mode === 'subject' || mode === 'topic', () => K.Cols(2, [
              K.Field({ label:yz('ays.quiz.ders'), input:K.Select({ id:'qz-subject', change:'quiz-subject',
                value:S.ui.quizSubject || '',
                options:[{ value:'', label:yz('ays.quiz.ders-2') }].concat(R.SUBJECTS.map(s => ({ value:s.id, label:s.name }))) }) }),
              K.Field({ label:yz('ays.quiz.konu'), input:K.Select({ id:'qz-topic', options:topicOpts,
                value:S.ui.quizTopic || '', change:'quiz-topic' }) }),
            ]))}
            ${K.Cols(2, [
              K.Field({ label:yz('ays.quiz.soru-sayisi'),
                input:K.Segmented({ items:Q.SIZES.map(n => ({ value:n, label:String(n) })),
                  value:size, act:'quiz-size', aria:yz('ays.quiz.soru-sayisi') }) }),
              K.Field({ label:yz('ays.quiz.bicim'), hint:Q.FORMATS[S.ui.quizFormat || 'open'].note,
                input:K.Segmented({ act:'quiz-format', value:S.ui.quizFormat || 'open',
                  items:Object.keys(Q.FORMATS).map(k => ({ value:k, label:Q.FORMATS[k].name })),
                  aria:yz('ays.quiz.sinama-bicimi') }) }),
            ])}
            ${/* Sade (2026-10-16): süre ve sesli okuma ara sıra değişir;
                 seçili değerleriyle tek satırda katlı durur. */ ''}
            <details class="qz-dahasi mt-8"${(S.ui.quizSeconds || S.ui.quizVoice) ? ' open' : ''}>
              <summary class="qz-dahasi__bas small">${yz('ays.quiz.diger-ayarlar')} ${S.ui.quizSeconds ? S.ui.quizSeconds + ' sn' : 'süresiz'} · ${S.ui.quizVoice ? 'sesli' : 'sessiz'}</summary>
            ${K.Cols(2, [
              K.Field({ label:yz('ays.quiz.soru-basina-sure'), hint:'süre baskısı hızını ölçer',
                input:K.Segmented({ act:'quiz-timer', value:S.ui.quizSeconds || 0,
                  items:Q.TIMERS.map(n => ({ value:n, label:n ? n + ' sn' : 'süresiz' })),
                  aria:yz('ays.quiz.soru-suresi') }) }),
              K.Field({ label:yz('ays.quiz.okuma'), hint:'ekrana bakmadan tekrar',
                input:K.Segmented({ act:'quiz-voice', value:S.ui.quizVoice ? '1' : '0',
                  items:[{ value:'0', label:yz('ays.quiz.sessiz') }, { value:'1', label:yz('ays.quiz.sesli') }],
                  aria:yz('ays.quiz.sesli-okuma') }) }),
            ])}
            </details>
            ${ready
              ? K.Button({ label:yz('ays.quiz.sinamayi-baslat'), icon:'play', tone:'primary', block:true,
                  class:'mt-12', act:'quiz-start' })
              : K.Notice({ tone:'warn', class:'mt-12',
                  body:yz('ays.quiz.bu-secimde-sinanacak-madde-y')
                     + 'yanlış defterine kök neden yaz.' })}`,
        }),

        when(lastSummary, () => summaryCard(lastSummary)),
      ])),

      K.Span(5, K.Stack([
        K.Card({ title:yz('ays.quiz.neden-sinama'), sub:yz('ays.quiz.kart-cevirmekten-farki'), body:html`
          <ul class="bullets small muted">
            <li>${yz('ays.quiz.karti-gorunce-biliyorum-deme')} <b>${yz('ays.quiz.tanimadir')}</b>${yz('ays.quiz.sinav')} <b>${yz('ays.quiz.uretme')}</b> ister.</li>
            <li>${yz('ays.quiz.bilinmeyen-madde-otomatik-ka')}</li>
            <li>${yz('ays.quiz.bilinen-madde-kartin-araligi')}</li>
            <li>${yz('ays.quiz.oturum-sonunda-zayif-konular')}</li>
          </ul>` }),
        K.Card({ title:yz('ays.quiz.havuz'), sub:yz('ays.quiz.su-an-sinanabilir-madde'), body:K.Cols(2, [
          K.Stat({ label:yz('ays.quiz.bugunun-karti'), value:U.fmtNum(av.due) }),
          K.Stat({ label:yz('ays.quiz.acik-yanlis'), value:U.fmtNum(av.errors) }),
          K.Stat({ label:yz('ays.quiz.ders-notu'), value:U.fmtNum(av.notes) }),
          K.Stat({ label:yz('ays.quiz.toplam'), value:U.fmtNum(av.mixed) }),
        ]) }),
        raw(UI.rail(['recall', 'srs', 'closure', 'notebook'])),
      ])),
    ]);
  }

  /* ---------- oturum ---------- */

  function runView(){
    const item = Q.current();
    const p = Q.progress();
    const revealed = Q.isRevealed();
    if(!item) return setupView();

    return K.Grid([
      K.Span(8, K.Stack([
        K.Card({ pad:'sm', body:html`
          <div class="row between mb-10">
            <span class="small muted">${p.index + 1} / ${p.total} · ${Q.MODES[Q.active().mode].label}
              · ${Q.FORMATS[Q.format()].name.toLowerCase()}</span>
            ${Q.active().perQuestion
              ? html`<span class="${(Q.questionLeft() || 0) <= 5 ? 'small num is-late' : 'small num'}"
                  id="quiz-left">${Q.questionLeft()} sn</span>`
              : html`<span class="small dim">${U.fmtClock(p.seconds)}</span>`}
          </div>
          ${K.Bar({ value:U.pct(p.index, p.total), tone:'' })}` }),

        html`<div class="quizcard">
          <span class="quizcard__src">${item.sourceLabel}${item.topic ? ' · ' + item.topic : ''}</span>
          <p class="quizcard__prompt">${item.prompt}</p>
          ${when(!revealed && !item.choices, () => html`<p class="quizcard__hint">${yz('ays.quiz.cevabi-once-kendine-soyle')}</p>`)}
          ${when(revealed, () => html`<div class="quizcard__answer"><span class="mono-label">${yz('ays.quiz.dogru-cevap')}</span>
            <p>${item.answer}</p></div>`)}
        </div>`,

        when(!revealed, () => K.Segmented({ act:'quiz-guven', value:Q.guven() || '', aria:yz('ays.quiz.ne-kadar-eminsin'),
          items:[{ value:'emin', label:yz('ays.quiz.eminim') }, { value:'kararsiz', label:yz('ays.quiz.kararsizim') },
            { value:'tahmin', label:yz('ays.quiz.tahmin') }] })),

        when(item.choices, () => html`<div class="choices">${map(item.choices, (opt, i) => {
          const picked = Q.pickedIndex();
          const state = !revealed ? ''
            : i === item.correct ? ' is-correct'
            : i === picked ? ' is-wrong' : ' is-off';
          return html`<button class="${'choice' + state}" data-act="quiz-pick" data-i="${i}"
            ${revealed ? raw('disabled') : ''}>
            <span class="choice__key">${String.fromCharCode(65 + i)}</span>
            <span class="choice__text">${opt}</span></button>`;
        })}</div>`),

        revealed
          ? html`<div class="row gap-8">${map(VERDICTS, v => html`
              <button class="${'btn grow' + (v.tone ? ' btn--' + v.tone : '')}"
                data-act="quiz-answer" data-verdict="${v.key}">
                <span>${v.label}</span><span class="tiny dim">${v.hint}</span></button>`)}</div>`
          : (item.choices
              ? html`<p class="tiny dim center">${yz('ays.quiz.bir-sik-sec-sonra')}</p>`
              : K.Button({ label:yz('ays.quiz.cevabi-goster'), icon:'zap', tone:'primary', block:true, act:'quiz-reveal' })),

        K.Row([
          K.Button({ label:yz('ays.quiz.atla'), size:'sm', tone:'ghost', act:'quiz-skip' }),
          K.Button({ label:yz('ays.quiz.oturumu-bitir'), size:'sm', tone:'ghost', act:'quiz-cancel' }),
        ], { between:true }),
      ])),

      K.Span(4, K.Stack([
        K.Card({ title:yz('ays.quiz.nasil-isaretlemeli'), sub:yz('ays.quiz.durustluk-burada-ise-yarar'), body:html`
          <div class="stack-xs">
            <div class="row-top gap-8">${K.Badge({ label:yz('ays.quiz.bilmiyordum'), tone:'danger' })}
              <span class="small muted">${yz('ays.quiz.aklina-gelmedi-kart-yarin-ge')}</span></div>
            <div class="row-top gap-8">${K.Badge({ label:yz('ays.quiz.emin-degildim'), tone:'muted' })}
              <span class="small muted">${yz('ays.quiz.kismen-geldi-aralik-kisalir')}</span></div>
            <div class="row-top gap-8">${K.Badge({ label:yz('ays.quiz.biliyordum'), tone:'ok' })}
              <span class="small muted">${yz('ays.quiz.bakmadan-uretebildin-aralik')}</span></div>
          </div>
          <p class="tiny dim mt-10">${yz('ays.quiz.kendine-iyi-not-vermek-sinav')}</p>` }),
        raw(UI.rail(['recall', 'srs'])),
      ])),
    ]);
  }

  /* ---------- özet ---------- */

  function summaryCard(sum){
    const tone = sum.verdict === 'strong' ? 'ok' : sum.verdict === 'ok' ? 'warn' : 'danger';
    return K.Card({
      title:yz('ays.quiz.son-oturum'), sub:Q.MODES[sum.mode].label + ' · ' + U.fmtClock(sum.seconds),
      badge:K.Badge({ label:'%' + sum.score, tone }),
      body:html`
        ${K.Cols(3, [
          K.Stat({ label:yz('ays.quiz.biliyordum'), value:sum.known, tone:'ok' }),
          K.Stat({ label:yz('ays.quiz.emin-degil'), value:sum.shaky, tone:sum.shaky ? 'warn' : null }),
          K.Stat({ label:yz('ays.quiz.bilmiyordum'), value:sum.unknown, tone:sum.unknown ? 'danger' : null }),
        ])}
        <div class="mt-12">${K.Notice({ tone:tone === 'ok' ? 'ok' : 'info', body:sum.note })}</div>
        ${when(sum.createdCards, () => html`<p class="small muted mt-10">
          ${sum.createdCards} ${yz('ays.quiz.yeni-tekrar-karti-acildi-yar')}</p>`)}
        ${when(sum.weak.length, () => html`
          <div class="stack-xs mt-12"><span class="mono-label">${yz('ays.quiz.zayif-konular')}</span>
            ${map(sum.weak, w => html`<div class="row between">
              <span class="small">${w.topic}</span>
              <span class="tiny dim num">${w.miss}/${w.total} gelmedi</span></div>`)}</div>`)}
        ${K.Row([
          K.Button({ label:yz('ays.quiz.tekrar-sina'), icon:'refresh', size:'sm', act:'quiz-start' }),
          K.Button({ label:yz('ays.quiz.kartlara-git'), size:'sm', act:'go', data:{ 'data-route':'cards' } }),
        ], { wrap:true })}`,
    });
  }

  /* ---------- test kitapları (core/testkitabi.js) ----------

     BAM'ın bölümlü kitabı SINAV BİÇİMİNDE çözülür: cevaplar bölüm bitene
     kadar gösterilmez, boş bırakmak serbesttir. Sonuç ölçümdür; zorluk
     etiketi modelin beyanıdır (tahmin). Net ya da puan hesaplanmaz. */
  const TK = () => R.TestKitabi;
  const HARF = 'ABCDE';

  /* Soru şeridi: bölümdeki her soruya tek dokunuş; cevaplılar dolu görünür.
     Doğru/yanlış GÖSTERİLMEZ: cevaplar bölüm bitince açılır. */
  /* 044 nötr şerit ve 058 soru ekranı: brand/ortak/vitrin.js. Çözerken
     doğru/yanlış rengi YOK; bölüm bitince açılır (kitapSonucView). */
  const VT = () => (window.LIFEOS || {}).VITRIN;

  function soruSeridi(m){
    return html`<nav class="kitap-serit mb-10" aria-label="Sorular">${map(m.cevaplar, (c, i) => html`<button
      class="${(c != null ? 'is-cevapli' : '') + (i === m.index ? ' is-simdi' : '')}"
      data-act="kitap-no" data-i="${i}" aria-label="${yz('ays.quiz.soru') + (i + 1) + (c != null ? ', cevaplı' : ', boş')}"
      ${i === m.index ? raw('aria-current="step"') : ''}>${i + 1}</button>`)}</nav>`;
  }

  function kitapView(){
    const m = TK().mevcut();
    if(!m){ TK().vazgec(); return setupView(); }
    const s = m.soru;
    return K.Grid([K.Span(12, K.Card({ pad:'sm', title:m.kitap.baslik + ' · ' + m.bolum.ad,
      sub:yz('ays.quiz.soru') + (m.index + 1) + ' / ' + m.toplam + ' · ' + m.cevapli
        + ' cevaplı · cevaplar bölüm bitince görünür',
      body:html`
        ${when(VT(), () => html`<div class="mb-10">${raw(VT().notrSerit({ cevaplar:m.cevaplar.map(c => c != null) }))}</div>`)}
        ${soruSeridi(m)}
        ${VT() ? raw(VT().soruEkrani({ no:m.index + 1, toplam:m.toplam, soru:s.soru, secenekler:s.secenekler,
            secili:m.secili, act:'kitap-sec' })) : html`
        <p class="mb-10">${s.soru}</p>
        <div class="choices">${map(s.secenekler, (x, i) => html`<button
          class="${'choice' + (m.secili === i ? ' is-picked' : '')}" data-act="kitap-sec"
          data-i="${i}" aria-pressed="${m.secili === i ? 'true' : 'false'}">
          <span class="choice__key">${HARF[i]}</span>
          <span class="choice__text">${x}</span></button>`)}</div>`}
        <p class="tiny dim mt-8">Zorluk: ${s.zorluk} ${yz('ays.quiz.modelin-beyani-tahmin-secili')}</p>
        <div class="row wrap mt-12">
          ${K.Button({ label:yz('ays.quiz.onceki'), size:'sm', act:'kitap-git', data:{ 'data-d':'-1' },
            disabled:m.index === 0 })}
          ${K.Button({ label:yz('ays.quiz.sonraki'), size:'sm', act:'kitap-git', data:{ 'data-d':'1' },
            disabled:m.index === m.toplam - 1 })}
          ${K.Button({ label:yz('ays.quiz.bolumu-bitir'), size:'sm', tone:'primary', act:'kitap-bitir' })}
          ${K.Button({ label:yz('ays.quiz.vazgec'), size:'sm', act:'kitap-vazgec' })}
        </div>` }))]);
  }

  /* Yanlış defteri bağı (Part 7 madde 9): bölümün yanlışları deftere
     tek dokunuşla gider; «Geri al» kalır. Etiket seçimi defterde. */
  function defterSatiri(kitap, bolum){
    const y = TK().yanlislar(kitap.id, bolum.no);
    if(!y.length) return html`<p class="tiny dim mt-8">${yz('ays.quiz.bu-bolumde-yanlis-yok-defter')}</p>`;
    const yeni = y.filter(x => !(S.errors || []).some(e => e.kaynak && e.kaynak.tur === 'testkitabi'
      && e.kaynak.kitapId === kitap.id && e.kaynak.no === bolum.no && e.kaynak.i === x.i)).length;
    if(!yeni) return html`<p class="tiny dim mt-8">${y.length} ${yz('ays.quiz.yanlisin-hepsi-yanlis-defter')}</p>`;
    return html`<div class="row wrap mt-8">${K.Button({ label:yz('ays.quiz.yanlislari-deftere-ekle') + yeni + ')',
      size:'sm', act:'kitap-deftere', data:{ 'data-id':kitap.id, 'data-no':String(bolum.no) } })}
      <span class="tiny dim">${yz('ays.quiz.hata-turunu-k-i-y-s-d-defter')}</span></div>`;
  }

  function kitapSonucView(o){
    const { kitap, bolum, sonuc } = o;
    const hatali = kitap.hatali || [];
    const zorluklar = Object.keys(sonuc.zorluk).filter(z => sonuc.zorluk[z].toplam);
    return K.Grid([K.Span(12, K.Stack([
      K.Card({ title:bolum.ad + ' · sonuç', sub:kitap.baslik + ' · ölçüldü', body:html`
        ${when(VT(), () => html`<div class="mb-12">${raw(VT().notrSerit({ sonuclar:bolum.sorular.map((q, i) => {
          const c = (sonuc.cevaplar || [])[i];
          return c == null ? null : c === q.dogru ? 'd' : 'y';
        }) }))}</div>`)}
        ${K.Cols(3, [
          K.Stat({ label:yz('ays.quiz.dogru'), value:String(sonuc.dogru) }),
          K.Stat({ label:yz('ays.quiz.yanlis'), value:String(sonuc.yanlis) }),
          K.Stat({ label:yz('ays.quiz.bos'), value:String(sonuc.bos) }),
        ])}
        <p class="tiny dim mt-8">${Math.round(sonuc.sure_sn / 60) || 1} dakika${sonuc.sayilmayan
          ? ' · hatalı işaretlenen ' + sonuc.sayilmayan + ' soru sayılmadı' : ''}${yz('ays.quiz.net-ve-puan-hesaplanmaz')}</p>
        ${when(zorluklar.length, () => html`<p class="tiny mt-6">${yz('ays.quiz.zorluga-gore-etiket-modelin')} ${zorluklar.map(z => z + ' ' + sonuc.zorluk[z].dogru
          + '/' + sonuc.zorluk[z].toplam).join(' · ')}</p>`)}
        ${defterSatiri(kitap, bolum)}
        <div class="mt-8">${K.Button({ label:yz('ays.quiz.kapat'), size:'sm', tone:'primary', act:'kitap-kapat' })}</div>` }),
      K.Card({ title:yz('ays.quiz.gozden-gecir'), sub:yz('ays.quiz.anahtari-yanlis-buldugun-sor'),
        body:html`<div class="stack-sm">${map(bolum.sorular, (s, i) => {
          const c = (sonuc.cevaplar || [])[i];
          const isaretli = hatali.indexOf(bolum.no + '-' + i) >= 0;
          return html`<div>
            <p class="small"><b>${i + 1}.</b> ${s.soru}</p>
            <div class="choices mt-6">${map(s.secenekler, (x, j) => html`<button disabled
              class="${'choice' + (j === s.dogru ? ' is-correct' : j === c ? ' is-wrong' : ' is-off')}">
              <span class="choice__key">${HARF[j]}</span><span class="choice__text">${x}</span></button>`)}</div>
            <p class="tiny dim mt-6">${c == null ? yz('ays.quiz.bos-biraktin') : c === s.dogru ? 'Doğru.'
              : yz('ays.quiz.senin-cevabin') + HARF[c] + ', anahtar ' + HARF[s.dogru] + '.'}${s.cozum
              ? ' Çözüm: ' + s.cozum : ''}</p>
            ${K.Chip({ label:isaretli ? yz('ays.quiz.hatali-isaretli-geri-al') : yz('ays.quiz.bu-soru-hatali'),
              act:'kitap-hatali', on:isaretli,
              data:{ 'data-id':kitap.id, 'data-no':String(bolum.no), 'data-i':String(i) } })}
          </div>`;
        })}</div>` }),
    ]))]);
  }

  const kitapta = () => !!(TK() && TK().aktif());
  const sonOzet = () => (TK() ? TK().sonOzet() : null);
  LIFEOS.PARCA.blok({ id:'quiz.kitap', sayfa:'quiz', yer:'ana', ad:'Test kitabı', kosul:kitapta, ciz:() => kitapView() });
  LIFEOS.PARCA.blok({ id:'quiz.sonuc', sayfa:'quiz', yer:'ana', ad:'Test sonucu', kosul:() => !kitapta() && sonOzet() && !Q.active(), ciz:() => kitapSonucView(sonOzet()) });
  LIFEOS.PARCA.blok({ id:'quiz.kosu', sayfa:'quiz', yer:'ana', ad:'Sınama', kosul:() => !kitapta() && Q.active(), ciz:() => runView() });
  LIFEOS.PARCA.blok({ id:'quiz.kurulum', sayfa:'quiz', yer:'ana', ad:'Sınama kurulumu', kosul:() => !kitapta() && !sonOzet() && !Q.active(), ciz:() => setupView() });
  LIFEOS.PARCA.blok({ id:'quiz.kalicilik', sayfa:'quiz', yer:'ana', ad:'Sıra ve kalıcılık', kosul:() => !kitapta() && !sonOzet() && !Q.active(), ciz:() => raw(kalicilikHtml()) });

  /* Bugünkü sıra ve konuların kalıcılığı (core/quiz.js, brand/ortak/usta.js). Ölçülmemiş
     konu «ölçüldü»ye girmez; kanıt yoksa kart da yok. */
  function kalicilikHtml(){
    const P = (window.LIFEOS || {}).PANO, Us = window.LIFEOS.USTA;
    if(!P) return '';
    const liste = Q.siradaki(5), k = Q.konuKalicilik(), h = k.harita, emin = k.guven.emin;
    const neden = x => x.kritik ? yz('ays.quiz.emin-yanilmistin') : x.gecikti ? x.gecikti + yz('ays.quiz.gun-gecikti')
      : x.asama === 'yok' ? yz('ays.quiz.ilk-sinama') : Us.adi(x.asama);
    const sira = liste.length ? P.kart({ tur:'sira', ad:yz('ays.quiz.bugunku-sira'), simge:'kart', yuva:yz('ays.quiz.karisik'),
      govde:P.liste({ satirlar:liste.map(x => ({ ad:x.ad, not:neden(x), nokta:x.kritik ? 0 : 'n' })) })
        + '<div class="mt-8">' + K.Button({ label:yz('ays.quiz.sirayi-sina'), size:'sm', tone:'primary', act:'quiz-siradaki' }) + '</div>' }) : '';
    const kalici = h.olculen ? P.kart({ tur:'kalicilik', ad:yz('ays.quiz.kalicilik'), simge:'kart', yuva:h.olculen + '/' + h.toplam + yz('ays.quiz.konu-olculdu'),
      govde:P.yigin({ parcalar:['ogreniyor', 'tutuyor', 'kalici', 'saglam'].map(id => ({ ad:Us.adi(id), deger:h.sayi[id], metin:String(h.sayi[id]) })) })
        + (emin.oran != null ? P.not(yz('ays.quiz.emin-dediklerinin') + Math.round(emin.oran * 100) + yz('ays.quiz.kadari-tuttu') + ' · ' + emin.n + yz('ays.quiz.cevap')) : '')
        + P.not(yz('ays.quiz.kalicilik-kurali')) }) : '';
    return P.izgara([sira, kalici], 'pk-izgara--iki');
  }
  async function render(){ return String(LIFEOS.PARCA.yer('quiz', 'ana', R.C)); }

  const handle = {
    async 'quiz-size'(el){ S.ui.quizSize = Number(el.dataset.value); R.App.render(); },
    async 'quiz-format'(el){ S.ui.quizFormat = el.dataset.value; R.App.render(); },
    async 'quiz-timer'(el){ S.ui.quizSeconds = Number(el.dataset.value); R.App.render(); },
    async 'quiz-voice'(el){ S.ui.quizVoice = el.dataset.value === '1'; R.App.render(); },
    async 'quiz-pick'(el){
      const res = Q.pick(Number(el.dataset.i));
      if(res) UI.toast(res.correct ? yz('ays.quiz.dogru-sik') : yz('ays.quiz.yanlis-sik-dogrusu-isaretlen'));
      R.App.render();
    },
    async 'quiz-say'(){ speak(); },
    async 'kitap-baslat'(el){
      const r = TK().baslat(el.dataset.id, Number(el.dataset.no));
      if(!r.ok){ UI.toast(r.why); return; }
      R.App.render();
    },
    async 'kitap-devam'(){
      const r = TK().devam();
      if(!r.ok){ UI.toast(r.why); return; }
      R.App.render();
    },
    async 'kitap-sec'(el){ TK().sec(Number(el.dataset.i)); R.App.render(); },
    async 'kitap-git'(el){ TK().git(Number(el.dataset.d)); R.App.render(); },
    async 'kitap-no'(el){ TK().gitNo(Number(el.dataset.i)); R.App.render(); },
    async 'kitap-ozet'(el){
      const r = TK().ozetAc(el.dataset.id, Number(el.dataset.no));
      if(!r.ok){ UI.toast(r.why); return; }
      R.App.render();
    },
    async 'kitap-deftere'(el){
      const r = await TK().yanlislariDeftere(el.dataset.id, Number(el.dataset.no));
      if(!r.ok){ UI.toast(r.why); return; }
      R.App.render();
      UI.toast(r.eklenen + ' soru yanlış defterine eklendi', { undo:async () => {
        await TK().defterdenGeriAl(r.ids); R.App.render();
      } });
    },
    async 'kitap-bitir'(){
      const m = TK().mevcut();
      const bos = m ? m.toplam - m.cevapli : 0;
      const bitir = async () => { await TK().bitir(); R.App.render(); };
      if(bos) UI.confirmSheet(yz('ays.quiz.bolumu-bitir'), bos + ' soru boş. Yine de bitirilsin mi? Boşlar '
        + 'boş olarak sayılır.', bitir, false, bos + ' boşla bitir');
      else await bitir();
    },
    async 'kitap-vazgec'(){ TK().vazgec(); UI.toast(yz('ays.quiz.bolum-birakildi-sonuc-yazilm')); R.App.render(); },
    async 'kitap-kapat'(){ TK().ozetKapat(); R.App.render(); },
    async 'kitap-hatali'(el){
      const r = await TK().hataliIsaretle(el.dataset.id, Number(el.dataset.no), Number(el.dataset.i));
      if(!r.ok) UI.toast(r.why);
      R.App.render();
    },
    async 'quiz-start'(){
      const res = Q.start({
        mode:S.ui.quizMode || 'due',
        size:S.ui.quizSize || 10,
        format:S.ui.quizFormat || 'open',
        seconds:S.ui.quizSeconds || 0,
        subjectId:S.ui.quizSubject || null,
        topicId:S.ui.quizTopic || null,
      });
      if(!res.ok){ UI.toast(res.reason); return; }
      lastSummary = null;
      UI.toast(res.total + ' madde · başla');
      R.App.render();
    },
    async 'quiz-siradaki'(){ S.ui.quizMode = 'siradaki'; await handle['quiz-start'](); },
    /* Yeniden çizmez: çizim sesli okumayı baştan başlatırdı. */
    async 'quiz-guven'(el){
      Q.guvenSec(el.dataset.value);
      el.parentElement.querySelectorAll('button').forEach(b => {
        const on = b.dataset.value === Q.guven();
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    },
    async 'quiz-reveal'(){ Q.reveal(); R.App.render(); },
    async 'quiz-answer'(el){
      const eminYanildi = Q.guven() === 'emin' && el.dataset.verdict === 'unknown' && (Q.current() || {}).cardId;
      const res = await Q.answer(el.dataset.verdict);
      if(eminYanildi) UI.toast(yz('ays.quiz.emindin-kart-one-alindi'));
      if(res && res.done){
        lastSummary = res.summary;
        UI.toast(yz('ays.quiz.oturum-bitti') + res.summary.score);
      }
      R.App.render();
    },
    async 'quiz-skip'(){ await Q.skip(); R.App.render(); },
    async 'quiz-cancel'(){
      UI.confirmSheet(yz('ays.quiz.oturumu-bitir'),
        yz('ays.quiz.yarim-oturum-kaydedilmez-ver'), async () => {
          Q.cancel();
          UI.closeSheet();
          R.App.render();
        }, false, yz('ays.quiz.kaydetmeden-bitir'));
    },
  };

  const change = {
    async 'quiz-mode'(el){ S.ui.quizMode = el.value; R.App.render(); },
    async 'quiz-subject'(el){ S.ui.quizSubject = el.value || null; S.ui.quizTopic = null; R.App.render(); },
    async 'quiz-topic'(el){ S.ui.quizTopic = el.value || null; R.App.render(); },
  };

  /* ---------- sesli okuma ve süre sayacı ---------- */

  /* Tarayıcının kendi ses sentezi; ek bağımlılık yok, yoksa sessizce atlanır. */
  function speak(text){
    const item = Q.current();
    const say = text || (item ? item.prompt : '');
    if(!say || !window.speechSynthesis) return false;
    try{
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(say);
      u.lang = 'tr-TR';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
      return true;
    }catch(e){ return false; }
  }

  let timer = null;
  function stopTimer(){ if(timer){ clearInterval(timer); timer = null; } }
  function startTimer(){
    stopTimer();
    const run = Q.active();
    if(!run || !run.perQuestion) return;
    timer = setInterval(async () => {
      const el = document.getElementById('quiz-left');
      if(!Q.active()){ stopTimer(); return; }
      const left = Q.questionLeft();
      if(el) el.textContent = left + ' sn';
      if(left <= 0){
        stopTimer();
        const res = await Q.timeout();
        if(res && res.done){ lastSummary = res.summary; UI.toast(yz('ays.quiz.sure-doldu-oturum-bitti')); }
        else UI.toast(yz('ays.quiz.sure-doldu'));
        R.App.render();
      }
    }, 1000);
  }

  function afterRender(){
    const run = Q.active();
    if(!run){ stopTimer(); return; }
    startTimer();
    if(S.ui.quizVoice && !Q.isRevealed()) speak();
  }

  /* 1/2/3 ile isaretle, bosluk ile goster — kartlarla ayni refleks. */
  function onKey(e){
    if(S.route !== 'quiz' || UI.isSheetOpen()) return;
    if(e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if(!Q.active()) return;
    if(e.code === 'Space' && !Q.isRevealed()){
      e.preventDefault();
      handle['quiz-reveal']();
      return;
    }
    const item = Q.current();
    if(!Q.isRevealed() && item && item.choices){
      const letter = 'ABCD'.indexOf(String(e.key || '').toUpperCase());
      if(letter >= 0 && letter < item.choices.length){
        e.preventDefault();
        handle['quiz-pick']({ dataset:{ i:letter } });
        return;
      }
    }
    if(Q.isRevealed()){
      const idx = ['1', '2', '3'].indexOf(e.key);
      if(idx >= 0) handle['quiz-answer']({ dataset:{ verdict:VERDICTS[idx].key } });
    }
  }

  return {
    id:'quiz',
    title:yz('ays.quiz.sinama'),
    subtitle(){
      const m = R.TestKitabi ? R.TestKitabi.mevcut() : null;
      if(m) return m.bolum.ad + ' · ' + (m.index + 1) + ' / ' + m.toplam + ' · test kitabı';
      const p = Q.progress();
      if(p) return p.index + 1 + ' / ' + p.total + ' · geri çağırma testi';
      const av = Q.availability();
      return av.mixed ? U.fmtNum(av.mixed) + ' madde sınanabilir' : yz('ays.quiz.once-kart-veya-ders-notu');
    },
    actions(){ return ''; },
    render, afterRender, handle, change, onKey,
  };
})();
