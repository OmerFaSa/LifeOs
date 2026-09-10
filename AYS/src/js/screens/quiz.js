/* Sınama — kendini test et, boşluğu gör, boşluğu karta çevir.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz.
   Karar motoru R.Quiz'dedir; ekran yalnizca cizer ve olay tasir. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.quiz = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;
  const Q = R.Quiz;

  const VERDICTS = [
    { key:'unknown', label:'Bilmiyordum', tone:'danger', hint:'1' },
    { key:'shaky',   label:'Emin değildim', tone:null,   hint:'2' },
    { key:'known',   label:'Biliyordum',  tone:'primary', hint:'3' },
  ];

  let lastSummary = null;

  /* ---------- kurulum ---------- */

  function setupView(){
    const av = Q.availability();
    const mode = S.ui.quizMode || 'due';
    const size = S.ui.quizSize || 10;
    const count = {
      due:av.due, errors:av.errors, notes:av.notes, mixed:av.mixed,
      subject:Q.pool({ mode:'subject', subjectId:S.ui.quizSubject || null }).length,
      topic:Q.pool({ mode:'topic', subjectId:S.ui.quizSubject || null, topicId:S.ui.quizTopic || null }).length,
    };
    const ready = (count[mode] || 0) > 0;

    const modeItems = Object.keys(Q.MODES).map(k => ({
      value:k, label:Q.MODES[k].label + (count[k] != null ? ' (' + count[k] + ')' : ''),
    }));

    const subject = R.SUBJECTS.find(s => s.id === S.ui.quizSubject);
    const topicOpts = subject
      ? [{ value:'', label:'— tüm konular —' }].concat(subject.topics.map(t => ({ value:t.id, label:t.name })))
      : [{ value:'', label:'— önce ders seç —' }];

    return K.Grid([
      K.Span(7, K.Stack([
        K.Card({
          title:'Sınama kur', hint:'recall',
          sub:'Önce cevabı üret, sonra bak. Tanımak bilmek değildir.',
          body:html`
            ${K.Field({ label:'Kaynak', hint:Q.MODES[mode].note,
              input:K.Select({ id:'qz-mode', options:modeItems, value:mode, change:'quiz-mode' }) })}
            ${when(mode === 'subject' || mode === 'topic', () => K.Cols(2, [
              K.Field({ label:'Ders', input:K.Select({ id:'qz-subject', change:'quiz-subject',
                value:S.ui.quizSubject || '',
                options:[{ value:'', label:'— ders —' }].concat(R.SUBJECTS.map(s => ({ value:s.id, label:s.name }))) }) }),
              K.Field({ label:'Konu', input:K.Select({ id:'qz-topic', options:topicOpts,
                value:S.ui.quizTopic || '', change:'quiz-topic' }) }),
            ]))}
            ${K.Cols(2, [
              K.Field({ label:'Soru sayısı',
                input:K.Segmented({ items:Q.SIZES.map(n => ({ value:n, label:String(n) })),
                  value:size, act:'quiz-size', aria:'Soru sayısı' }) }),
              K.Field({ label:'Biçim', hint:Q.FORMATS[S.ui.quizFormat || 'open'].note,
                input:K.Segmented({ act:'quiz-format', value:S.ui.quizFormat || 'open',
                  items:Object.keys(Q.FORMATS).map(k => ({ value:k, label:Q.FORMATS[k].name })),
                  aria:'Sınama biçimi' }) }),
            ])}
            ${K.Cols(2, [
              K.Field({ label:'Soru başına süre', hint:'süre baskısı hızını ölçer',
                input:K.Segmented({ act:'quiz-timer', value:S.ui.quizSeconds || 0,
                  items:Q.TIMERS.map(n => ({ value:n, label:n ? n + ' sn' : 'süresiz' })),
                  aria:'Soru süresi' }) }),
              K.Field({ label:'Okuma', hint:'ekrana bakmadan tekrar',
                input:K.Segmented({ act:'quiz-voice', value:S.ui.quizVoice ? '1' : '0',
                  items:[{ value:'0', label:'Sessiz' }, { value:'1', label:'Sesli' }],
                  aria:'Sesli okuma' }) }),
            ])}
            ${ready
              ? K.Button({ label:'Sınamayı başlat', icon:'play', tone:'primary', block:true,
                  class:'mt-12', act:'quiz-start' })
              : K.Notice({ tone:'warn', class:'mt-12',
                  body:'Bu seçimde sınanacak madde yok. Ders notu ekle, kart üret ya da '
                     + 'yanlış defterine kök neden yaz.' })}`,
        }),

        when(lastSummary, () => summaryCard(lastSummary)),
      ])),

      K.Span(5, K.Stack([
        K.Card({ title:'Neden sınama?', sub:'Kart çevirmekten farkı', body:html`
          <ul class="bullets small muted">
            <li>Kartı görünce “biliyorum” demek <b>tanımadır</b>; sınav <b>üretme</b> ister.</li>
            <li>Bilinmeyen madde otomatik karta düşer, tekrar takvimine girer.</li>
            <li>Bilinen madde kartın aralığını uzatır — boşuna tekrar etmezsin.</li>
            <li>Oturum sonunda zayıf konular adlandırılır; tahmin yok, sayım var.</li>
          </ul>` }),
        K.Card({ title:'Havuz', sub:'Şu an sınanabilir madde', body:K.Cols(2, [
          K.Stat({ label:'Bugünün kartı', value:U.fmtNum(av.due) }),
          K.Stat({ label:'Açık yanlış', value:U.fmtNum(av.errors) }),
          K.Stat({ label:'Ders notu', value:U.fmtNum(av.notes) }),
          K.Stat({ label:'Toplam', value:U.fmtNum(av.mixed) }),
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
          ${when(!revealed && !item.choices, () => html`<p class="quizcard__hint">Cevabı önce kendine söyle — sonra göster.</p>`)}
          ${when(revealed, () => html`<div class="quizcard__answer"><span class="mono-label">Doğru cevap</span>
            <p>${item.answer}</p></div>`)}
        </div>`,

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
              ? html`<p class="tiny dim center">Bir şık seç — sonra kendini işaretle.</p>`
              : K.Button({ label:'Cevabı göster', icon:'zap', tone:'primary', block:true, act:'quiz-reveal' })),

        K.Row([
          K.Button({ label:'Atla', size:'sm', tone:'ghost', act:'quiz-skip' }),
          K.Button({ label:'Oturumu bitir', size:'sm', tone:'ghost', act:'quiz-cancel' }),
        ], { between:true }),
      ])),

      K.Span(4, K.Stack([
        K.Card({ title:'Nasıl işaretlemeli?', sub:'Dürüstlük burada işe yarar', body:html`
          <div class="stack-xs">
            <div class="row-top gap-8">${K.Badge({ label:'Bilmiyordum', tone:'danger' })}
              <span class="small muted">Aklına gelmedi. Kart yarın geri gelir.</span></div>
            <div class="row-top gap-8">${K.Badge({ label:'Emin değildim', tone:'muted' })}
              <span class="small muted">Kısmen geldi. Aralık kısalır.</span></div>
            <div class="row-top gap-8">${K.Badge({ label:'Biliyordum', tone:'ok' })}
              <span class="small muted">Bakmadan üretebildin. Aralık uzar.</span></div>
          </div>
          <p class="tiny dim mt-10">Kendine iyi not vermek, sınavda ödemeni pahalılaştırır.</p>` }),
        raw(UI.rail(['recall', 'srs'])),
      ])),
    ]);
  }

  /* ---------- özet ---------- */

  function summaryCard(sum){
    const tone = sum.verdict === 'strong' ? 'ok' : sum.verdict === 'ok' ? 'warn' : 'danger';
    return K.Card({
      title:'Son oturum', sub:Q.MODES[sum.mode].label + ' · ' + U.fmtClock(sum.seconds),
      badge:K.Badge({ label:'%' + sum.score, tone }),
      body:html`
        ${K.Cols(3, [
          K.Stat({ label:'Biliyordum', value:sum.known, tone:'ok' }),
          K.Stat({ label:'Emin değil', value:sum.shaky, tone:sum.shaky ? 'warn' : null }),
          K.Stat({ label:'Bilmiyordum', value:sum.unknown, tone:sum.unknown ? 'danger' : null }),
        ])}
        <div class="mt-12">${K.Notice({ tone:tone === 'ok' ? 'ok' : 'info', body:sum.note })}</div>
        ${when(sum.createdCards, () => html`<p class="small muted mt-10">
          ${sum.createdCards} yeni tekrar kartı açıldı; yarın karşına çıkacak.</p>`)}
        ${when(sum.weak.length, () => html`
          <div class="stack-xs mt-12"><span class="mono-label">Zayıf konular</span>
            ${map(sum.weak, w => html`<div class="row between">
              <span class="small">${w.topic}</span>
              <span class="tiny dim num">${w.miss}/${w.total} gelmedi</span></div>`)}</div>`)}
        ${K.Row([
          K.Button({ label:'Tekrar sına', icon:'refresh', size:'sm', act:'quiz-start' }),
          K.Button({ label:'Kartlara git', size:'sm', act:'go', data:{ 'data-route':'cards' } }),
        ], { wrap:true })}`,
    });
  }

  async function render(){
    return String(Q.active() ? runView() : setupView());
  }

  const handle = {
    async 'quiz-size'(el){ S.ui.quizSize = Number(el.dataset.value); R.App.render(); },
    async 'quiz-format'(el){ S.ui.quizFormat = el.dataset.value; R.App.render(); },
    async 'quiz-timer'(el){ S.ui.quizSeconds = Number(el.dataset.value); R.App.render(); },
    async 'quiz-voice'(el){ S.ui.quizVoice = el.dataset.value === '1'; R.App.render(); },
    async 'quiz-pick'(el){
      const res = Q.pick(Number(el.dataset.i));
      if(res) UI.toast(res.correct ? 'Doğru şık' : 'Yanlış şık — doğrusu işaretlendi');
      R.App.render();
    },
    async 'quiz-say'(){ speak(); },
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
    async 'quiz-reveal'(){ Q.reveal(); R.App.render(); },
    async 'quiz-answer'(el){
      const res = await Q.answer(el.dataset.verdict);
      if(res && res.done){
        lastSummary = res.summary;
        UI.toast('Oturum bitti · %' + res.summary.score);
      }
      R.App.render();
    },
    async 'quiz-skip'(){ Q.skip(); R.App.render(); },
    async 'quiz-cancel'(){
      UI.confirmSheet('Oturumu bitir',
        'Yarım oturum kaydedilmez; verdiğin cevaplar kart aralıklarına zaten işlendi.', async () => {
          Q.cancel();
          UI.closeSheet();
          R.App.render();
        });
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
        if(res && res.done){ lastSummary = res.summary; UI.toast('Süre doldu — oturum bitti'); }
        else UI.toast('Süre doldu');
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
    title:'Sınama',
    subtitle(){
      const p = Q.progress();
      if(p) return p.index + 1 + ' / ' + p.total + ' · geri çağırma testi';
      const av = Q.availability();
      return av.mixed ? U.fmtNum(av.mixed) + ' madde sınanabilir' : 'Önce kart veya ders notu üret';
    },
    actions(){ return ''; },
    render, afterRender, handle, change, onKey,
  };
})();
