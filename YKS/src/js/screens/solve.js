/* Soru çözüm ekranı — soruyu yaz ya da fotoğrafla, çözümü adım adım al.

   Yazım biçimi: STIL.md / DONUSTURME.md. String birleştirme yok,
   etkileşim yalnız data-act / data-change ile bağlanır.

   Ekranın işi çözüm ÜRETMEK değil, çözümü KAYDA bağlamak: her çözülen soru
   bir konuya, bir zorluğa ve bir sonuca (kendim çözdüm / çözüme baktım)
   oturur. Konu takibi ve kaynak zorluğu bu kayıtlardan beslenir. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.solve = (function(){
  const U = R.U, UI = R.UI, S = R.S;
  const { html, raw, when, map, cls } = R.h;
  const K = R.C;
  const Q = R.Solver;

  /* Ekran durumu — kaydedilmez, oturumda durur. */
  let image = null;        // { mime, data, previewUrl, bytes, width, height }
  let busy = false;
  let result = null;       // { text, meta, model, provider }
  let draft = null;        // kaydedilmeyi bekleyen kayıt
  let controller = null;
  let followBusy = false;
  let follows = [];        // [{ q, a }]

  /* ---------- parçalar ---------- */

  function statCard(){
    const s = Q.summary();
    return K.Card({
      title:'Çözüm kaydı', sub:'Her çözülen soru bir konuya ve bir zorluğa oturur',
      body:html`${K.Cols(2, [
        K.Stat({ label:'Toplam soru', value:s.toplam }),
        K.Stat({ label:'Bugün', value:s.bugun }),
        K.Stat({ label:'Kendi çözdüğün',
          value:s.cozumOrani == null ? '—' : '%' + s.cozumOrani,
          tone:s.cozumOrani == null ? 'muted' : s.cozumOrani >= 60 ? 'ok' : 'warn' }),
        K.Stat({ label:'Ortalama zorluk',
          value:s.ortZorluk == null ? '—' : s.ortZorluk }),
      ])}
      ${when(s.etiketsiz, () => html`<p class="tiny dim mt-8">
        ${s.etiketsiz} kayıt konuya bağlanmadı — model konuyu listede bulamamış olabilir,
        aşağıdan elle seçebilirsin.</p>`)}`,
    });
  }

  /* Görsel okuyabilen bir model bağlı mı? Fotoğraf kutusu buna göre konuşur. */
  function visionReady(){ return Q.ready(true); }

  function inputCard(){
    const canText = Q.ready(false);
    const canImage = visionReady();

    return K.Card({
      title:'Soruyu ver', sub:'Fotoğrafını yapıştır ya da metnini yaz',
      body:K.Stack([
        when(!canText, () => K.Notice({ tone:'warn', title:'Model bağlı değil.',
          body:html`Soru çözmek için bir model gerekiyor.
            ${K.Button({ label:'Ofis ayarlarını aç', size:'sm', act:'go',
              data:{ 'data-route':'office' } })}` })),

        /* --- fotoğraf --- */
        html`<div class="${cls('qdrop', image && 'is-full')}" id="q-drop"
          data-act="q-pick" tabindex="0" role="button"
          aria-label="Soru fotoğrafı seç">
          ${when(image, () => html`
            <img class="qdrop__img" src="${image.previewUrl}" alt="Seçilen soru fotoğrafı"/>
            <span class="qdrop__meta">${image.width}×${image.height} ·
              ${Math.round(image.bytes / 1024)} KB</span>`)}
          ${when(!image, () => html`
            <span class="qdrop__icon">${raw(UI.icon('exam'))}</span>
            <b>Fotoğrafı buraya bırak</b>
            <span class="tiny dim">ya da tıkla · Ctrl+V ile yapıştır</span>`)}
        </div>
        <input type="file" id="q-file" accept="image/*" class="sr-only"
          data-change="q-file" aria-hidden="true" tabindex="-1"/>`,

        when(image, () => K.Row([
          K.Button({ label:'Fotoğrafı kaldır', size:'sm', tone:'ghost', act:'q-clear-image' }),
        ], { wrap:true })),

        when(image && !canImage, () => K.Notice({ tone:'warn',
          title:'Bağlı model görsel okuyamıyor.',
          body:'Fotoğraflı soru için görsel destekleyen bir model gerekir — Google AI Studio’nun '
             + 'Gemini modelleri ücretsiz katmanda bunu yapar. Ofis → Ayarlar’dan bağlayabilirsin. '
             + 'Ya da soruyu metin olarak yaz.' })),

        /* --- metin --- */
        K.Field({ label:'Soru metni', hint:image ? 'fotoğraf varken boş bırakabilirsin' : null,
          input:K.Textarea({ id:'q-text', rows:4,
            placeholder:'Soruyu buraya yazabilir ya da yapıştırabilirsin' }) }),

        K.Field({ label:'Notun', hint:'isteğe bağlı — nerede takıldığını yazarsan oraya odaklanır',
          input:K.Input({ id:'q-note', placeholder:'ör. ikinci adımı anlamadım' }) }),

        K.Row([
          K.Button({ label:busy ? 'Çözülüyor…' : 'Çöz ve anlat', icon:'zap', tone:'primary',
            act:'q-solve', disabled:busy || !canText }),
          when(busy, () => K.Button({ label:'İptal', size:'sm', tone:'ghost', act:'q-cancel' })),
          when(result && !busy, () => K.Button({ label:'Yeni soru', size:'sm', act:'q-reset' })),
        ], { wrap:true }),

        html`<div id="q-out"></div>`,
      ], 'sm'),
    });
  }

  /* Çözüm metni — düz metin, satır sonları korunur. */
  function solutionBody(text){
    return html`<div class="qsolution">${U.esc(text).replace(/\n/g, '<br/>')}</div>`;
  }

  function resultCard(){
    if(!result) return '';
    const m = result.meta || {};
    return K.Card({
      class:'card--primary',
      title:'Çözüm', sub:result.model ? result.provider + ' · ' + result.model : '',
      badge:when(result.fellBack, () => K.Badge({ label:'yedek model', tone:'info' })),
      body:html`
        ${raw(solutionBody(result.text))}
        ${when(result.truncated, () => html`<p class="tiny dim mt-8">
          Yanıt uzunluk sınırına takıldı; son cümle eksik olabilir.</p>`)}

        ${when(follows.length, () => html`<div class="mt-12">${map(follows, f => html`
          <div class="qfollow">
            <div class="qfollow__q"><b>Sen:</b> ${f.q}</div>
            <div class="qfollow__a">${raw(solutionBody(f.a))}</div>
          </div>`)}</div>`)}

        <div class="mt-12">
          ${K.Field({ label:'Anlamadığın yeri sor',
            hint:'yalnız o adımı açıklar, çözümü baştan yazmaz',
            input:K.Input({ id:'q-follow', placeholder:'ör. üçüncü adımda neden 2 ile çarptın?' }) })}
          ${K.Button({ label:followBusy ? 'Yazıyor…' : 'Sor', size:'sm', act:'q-follow',
            disabled:followBusy })}
        </div>

        <div class="qmeta mt-12">
          ${K.SectionTitle('Kayda geçir')}
          ${when(!m.matched && m.rawTopic, () => K.Notice({ tone:'warn',
            body:'Model konuyu “' + m.rawTopic + '” diye yazdı ama bu ders listende yok. '
               + 'Aşağıdan doğru konuyu seç — yanlış konu, konu takibini sessizce bozar.' }))}
          ${saveForm(m)}
        </div>`,
    });
  }

  function topicOptions(){
    return [{ value:'', label:'— konu seç —' }].concat(
      R.SUBJECTS.reduce((acc, s) => acc.concat(
        s.topics.map(t => ({ value:s.id + '::' + t.id, label:s.name + ' · ' + t.name }))), []));
  }

  function saveForm(m){
    const ref = m.topicId ? m.subjectId + '::' + m.topicId : '';
    return K.Stack([
      K.Cols(2, [
        K.Field({ label:'Ders – konu',
          input:K.Select({ id:'q-topic', value:ref, options:topicOptions() }) }),
        K.Field({ label:'Zorluk',
          input:K.Select({ id:'q-diff', value:m.difficulty || 3,
            options:R.DIFFICULTY_ORDER.map(n => ({ value:n,
              label:n + ' — ' + R.DIFFICULTY[n].label })) }) }),
      ]),
      K.Field({ label:'Sen ne yaptın?',
        hint:'“çözüme baktım” ile “kendim çözdüm” arasındaki fark, konu takibinin en değerli bilgisi',
        input:K.Select({ id:'q-result', value:'bakarak',
          options:R.SOLVE_RESULT_ORDER.map(id => ({ value:id, label:R.SOLVE_RESULTS[id].label })) }) }),
      K.Cols(2, [
        K.Field({ label:'Süre (sn)', hint:'isteğe bağlı',
          input:K.Input({ id:'q-secs', type:'number', numeric:true, min:0 }) }),
        K.Field({ label:'Cevap', input:K.Input({ id:'q-answer', value:m.answer || '' }) }),
      ]),
      when(m.trap, () => K.Notice({ tone:'info', title:'Tuzak:', body:m.trap })),
      K.Row([
        K.Button({ label:'Kaydet', icon:'check', tone:'primary', act:'q-save' }),
        K.Button({ label:'Yanlış defterine de ekle', size:'sm', act:'q-save-error' }),
      ], { wrap:true }),
    ], 'sm');
  }

  /* ---------- geçmiş ---------- */

  function historyCard(){
    const list = Q.all().slice(0, 12);
    if(!list.length){
      return K.Card({ title:'Çözülen sorular',
        body:K.Empty({ icon:'exam',
          text:'Henüz kayıt yok. Bir soru çözdürdüğünde buraya düşer ve konu takibine bağlanır.' }) });
    }
    return K.Card({
      title:'Çözülen sorular', sub:Q.all().length + ' kayıt',
      body:html`<div class="stack-xs">${map(list, row => html`
        <div class="qrow">
          <span class="${'qrow__dot qrow__dot--' + (R.SOLVE_RESULTS[row.result] || {}).tone}"></span>
          <span class="minw0">
            <b class="qrow__topic">${row.topicName || 'konusuz'}</b>
            <span class="qrow__text">${String(row.question || '').slice(0, 90)}</span>
          </span>
          ${when(row.difficulty, () => K.Badge({ label:R.DIFFICULTY[row.difficulty].short,
            tone:row.difficulty >= 4 ? 'warn' : 'info' }))}
          <span class="tiny dim">${U.relativeDay((row.at || '').slice(0, 10))}</span>
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'Kaydı sil',
            act:'q-del', data:{ 'data-id':row.id } })}
        </div>`)}</div>`,
    });
  }

  function topicCard(){
    const rows = Q.byTopic().slice(0, 8);
    if(!rows.length) return '';
    return K.Card({
      title:'Konu başına çözüm', sub:'En düşük oran üstte',
      body:html`<div class="stack-xs">${map(rows, r => html`
        <div class="qtopic">
          <span class="minw0"><b>${r.topicName}</b>
            <span class="tiny dim">${r.cozulen}/${r.toplam} soru${
              r.zorluk ? ' · ort. zorluk ' + r.zorluk : ''}</span></span>
          ${raw(String(K.Bar({ value:r.yuzde,
            tone:r.yuzde >= 60 ? '' : r.yuzde >= 40 ? 'warn' : 'danger' })))}
          <b class="num w-46 right">%${r.yuzde}</b>
        </div>`)}</div>`,
    });
  }

  /* ---------- ekran ---------- */

  async function render(){
    return String(K.Grid([
      K.Span(8, K.Stack([ inputCard(), resultCard() ])),
      K.Span(4, K.Stack([ statCard(), topicCard(), historyCard() ])),
    ]));
  }

  /* Sürükle-bırak ve yapıştır: her ikisi de aynı yola çıkar. */
  function afterRender(){
    const drop = document.getElementById('q-drop');
    if(drop && !drop.dataset.bound){
      drop.dataset.bound = '1';
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
        e.preventDefault(); drop.classList.add('is-over');
      }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
        e.preventDefault(); drop.classList.remove('is-over');
      }));
      drop.addEventListener('drop', e => {
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if(f) useFile(f);
      });
      drop.addEventListener('keydown', e => {
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pickFile(); }
      });
    }
    if(!document.body.dataset.qpaste){
      document.body.dataset.qpaste = '1';
      document.addEventListener('paste', e => {
        if(S.route !== 'solve') return;
        const items = (e.clipboardData && e.clipboardData.items) || [];
        for(let i = 0; i < items.length; i++){
          if(items[i].type && items[i].type.indexOf('image/') === 0){
            const f = items[i].getAsFile();
            if(f){ e.preventDefault(); useFile(f); return; }
          }
        }
      });
    }
  }

  function pickFile(){
    const el = document.getElementById('q-file');
    if(el) el.click();
  }

  async function useFile(file){
    try{
      image = await Q.prepareImage(file);
      UI.toast('Fotoğraf hazır');
    }catch(err){
      const code = err && err.code;
      UI.toast(code === 'too_big' ? 'Görsel çok büyük — daha küçük bir kırpma dene'
        : code === 'not_image' ? 'Bu bir görsel değil'
        : 'Görsel okunamadı');
      image = null;
    }
    await R.App.render();
  }

  function out(node){
    const el = document.getElementById('q-out');
    if(el) el.innerHTML = String(node);
  }

  /* ---------- eylemler ---------- */

  const handle = {
    async 'q-pick'(){ pickFile(); },

    async 'q-clear-image'(){ image = null; await R.App.render(); },

    async 'q-reset'(){
      image = null; result = null; draft = null; follows = [];
      await R.App.render();
    },

    async 'q-cancel'(){
      if(controller) controller.abort();
      busy = false;
      await R.App.render();
    },

    async 'q-solve'(){
      if(busy) return;
      const text = (document.getElementById('q-text') || {}).value || '';
      const note = (document.getElementById('q-note') || {}).value || '';
      if(!image && !text.trim()){
        UI.toast('Önce soruyu yaz ya da fotoğrafını ekle');
        return;
      }
      busy = true;
      follows = [];
      result = null;
      controller = new AbortController();
      await R.App.render();
      out(K.Notice({ tone:'info', body:'Soru okunuyor ve çözülüyor…' }));

      try{
        const res = await Q.solve({ question:text, image, note }, {
          signal:controller.signal,
          onText(ev){
            const el = document.getElementById('q-out');
            if(el) el.innerHTML = String(solutionBody(ev.text));
          },
        });
        result = res;
        draft = null;
        out('');
      }catch(err){
        const code = err && err.code;
        out(K.Notice({ tone:'danger', title:'Çözülemedi.', body:R.LLM.errorText(code) }));
      }finally{
        busy = false;
        await R.App.render();
      }
    },

    async 'q-follow'(){
      if(followBusy || !result) return;
      const el = document.getElementById('q-follow');
      const q = el ? el.value.trim() : '';
      if(!q) return;
      followBusy = true;
      await R.App.render();
      try{
        const res = await Q.solve({
          question:result.text.slice(0, 1200),
          follow:q,
          previous:[{ role:'assistant', text:result.text }],
        }, {});
        follows = follows.concat([{ q, a:res.text }]);
      }catch(err){
        UI.toast(R.LLM.errorText(err && err.code));
      }finally{
        followBusy = false;
        await R.App.render();
      }
    },

    async 'q-save'(){ await saveRecord(false); },
    async 'q-save-error'(){ await saveRecord(true); },

    async 'q-del'(el){
      await Q.remove(el.dataset.id);
      UI.toast('Kayıt silindi');
      await R.App.render();
    },
  };

  /* Kaydı kurar. Konu ve zorluk formdan okunur: model bir öneri verir,
     son sözü kullanıcı söyler. */
  async function saveRecord(alsoError){
    if(!result) return;
    const val = id => { const e = document.getElementById(id); return e ? String(e.value).trim() : ''; };
    const ref = val('q-topic');
    const [subjectId, topicId] = ref ? ref.split('::') : [null, null];
    const subject = subjectId ? R.SUBJECTS.find(s => s.id === subjectId) : null;
    const topic = subject ? subject.topics.find(t => t.id === topicId) : null;
    const m = result.meta || {};

    const rec = await Q.save({
      question:(val('q-text') || m.questionText || result.text.slice(0, 300)),
      solution:result.text,
      subjectId:subjectId || null,
      topicId:topicId || null,
      topicName:topic ? topic.name : (m.rawTopic || ''),
      difficulty:Number(val('q-diff')) || null,
      answer:val('q-answer'),
      trap:m.trap || '',
      result:val('q-result') || null,
      seconds:Number(val('q-secs')) || null,
      fromImage:!!image,
      model:result.model || '',
    });

    if(alsoError){
      /* Yanlis defteri ayri bir kayittir ve kendi semasi vardir; cozum
         kaydindan turetilir ama onun yerine gecmez. */
      const err = {
        id:U.uid('r'), createdAt:new Date().toISOString(), closedAt:null, repairDoneAt:null,
        examId:null, examDate:(rec.at || '').slice(0, 10), publisher:'',
        testName:rec.topicName || 'Soru çözümü', questionNo:'', status:'Yanlış',
        tag:'K', seconds:rec.seconds,
        rootCause:rec.trap || '',
        principle:String(rec.solution || '').slice(0, 400),
        similar:'', recipe:'',
        topicRef:ref, subjectId:rec.subjectId, topicId:rec.topicId,
        topic:rec.topicName || '',
      };
      await R.Model.saveError(err);
    }

    UI.toast(alsoError ? 'Kaydedildi ve yanlış defterine eklendi' : 'Kaydedildi');
    result = null; image = null; follows = [];
    await R.App.render();
  }

  const change = {
    async 'q-file'(el){
      const f = el.files && el.files[0];
      if(f) await useFile(f);
      el.value = '';
    },
  };

  return {
    id:'solve',
    title:'Soru çöz',
    subtitle(){
      const s = Q.summary();
      return s.toplam ? s.toplam + ' soru çözüldü'
        + (s.cozumOrani == null ? '' : ' · %' + s.cozumOrani + ' kendi çözdüğün')
        : 'Soruyu yaz ya da fotoğrafla, çözümü adım adım al';
    },
    render, afterRender, handle, change,
  };
})();
