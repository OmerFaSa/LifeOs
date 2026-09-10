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
  let thread = [];         // [{ role:'user'|'agent', text }] — çözümden sonraki sohbet
  let lastSource = '';     // arka arkaya aynı kitaptan çözmek yaygın
  let check = null;        // bağımsız denetim sonucu
  let checkBusy = false;
  let topicRef = '';       // seçili ders::konu
  let topicQuery = '';     // konu arama kutusuna yazılan

  /* Denetime ve kayda giden soru metni: kullanıcı yazdıysa o, fotoğraftan
     geldiyse modelin okuyup yazdığı ilk satırlar. */
  function questionText(){
    const el = document.getElementById('q-text');
    const typed = el ? el.value.trim() : '';
    if(typed) return typed;
    if(!result) return '';
    const m = result.text.match(/^\s*Soru[:\s][\s\S]{0,600}?(?=\n\s*\n)/);
    return m ? m[0].trim() : result.text.slice(0, 600);
  }

  function sourceNameOf(id){
    const s = id ? R.Sources.byId(id) : null;
    return s ? s.name : '';
  }

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

  /* Çözüm metni — düz metin, satır sonları korunur.

     Sıra kritik: ÖNCE kaçır (metin modelden geliyor), SONRA raw işaretle.
     Tersi ya da işaretlemeyi unutmak, eklediğimiz <br/> etiketlerinin
     ekrana harfi harfine basılmasına yol açıyordu. */
  function solutionBody(text){
    return html`<div class="qsolution">${raw(U.esc(text).replace(/\n/g, '<br/>'))}</div>`;
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

        ${checkCard()}

        ${when(thread.length, () => html`<div class="qthread mt-12">${map(thread, m => html`
          <div class="${cls('qmsg', 'qmsg--' + (m.role === 'user' ? 'me' : 'teacher'))}">
            <span class="qmsg__who">${m.role === 'user' ? 'Sen' : 'Öğretmen'}</span>
            <div class="qmsg__body">${raw(solutionBody(m.text))}</div>
          </div>`)}</div>`)}

        <div class="mt-12">
          ${K.Field({ label:thread.length ? 'Konuşmaya devam et' : 'Anlamadığın yeri sor',
            hint:'yalnız o adımı açıklar, çözümü baştan yazmaz — istediğin kadar sorabilirsin',
            input:K.Input({ id:'q-follow',
              placeholder:thread.length ? 'başka?' : 'ör. üçüncü adımda neden 2 ile çarptın?' }) })}
          ${K.Row([
            K.Button({ label:followBusy ? 'Yazıyor…' : 'Sor', size:'sm', tone:'primary',
              act:'q-follow', disabled:followBusy }),
            when(thread.length, () => K.Button({ label:'Sohbeti temizle', size:'sm', tone:'ghost',
              act:'q-thread-clear' })),
          ], { wrap:true })}
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

  /* ---------- bağımsız denetim ----------
     Modelin kendi çözümünü "kontrol etmesi" işe yaramaz: aynı modele aynı
     bağlamda sorunca kendi hatasını onaylar. Bu yüzden soru SIFIRDAN,
     ilk çözüm görülmeden, tercihen BAŞKA bir modele yeniden çözdürülür.

     Sonuç bir GARANTİ değildir ve öyle sunulmaz: iki model aynı hatayı da
     yapabilir. Ekran "doğrulandı" demez, "iki bağımsız çözüm aynı cevaba
     çıktı" der. */

  function checkCard(){
    if(checkBusy){
      return K.Notice({ tone:'info', body:'Soru ikinci kez, bağımsız olarak çözülüyor…' });
    }
    if(!check){
      return html`<div class="mt-10">
        ${K.Button({ label:'Çözümü denetle', icon:'shield', size:'sm', act:'q-check' })}
        <span class="tiny dim"> — soruyu başka bir modele sıfırdan çözdürür (1 istek)</span>
      </div>`;
    }
    if(check.durum === 'yapilamadi'){
      return K.Notice({ tone:'warn', title:'Denetim yapılamadı.',
        body:R.LLM.errorText(check.neden) });
    }
    if(check.durum === 'emin_degil'){
      return K.Notice({ tone:'warn', title:'Denetim sonuçsuz.',
        body:'İkinci çözüm bir cevap üretemedi. Bu, çözümün yanlış olduğu anlamına '
           + 'gelmez ama doğrulandığı anlamına da gelmez.' });
    }
    if(check.durum === 'ayni'){
      return K.Notice({ tone:'ok', title:'İki bağımsız çözüm aynı cevaba çıktı.',
        body:(check.second.independent
            ? 'Soru ' + check.second.model + ' modeline sıfırdan çözdürüldü ve aynı sonuca ulaştı. '
            : 'Soru aynı modele sıfırdan çözdürüldü ve aynı sonuca ulaştı — bağlamı '
              + 'görmedi ama model aynı, bağımsızlığı zayıf. ')
          + 'Bu bir garanti değildir: iki çözüm aynı hatayı da yapmış olabilir.' });
    }
    /* ayrildi */
    const j = check.judge;
    return K.Card({
      title:'Dikkat: iki çözüm farklı cevaba çıktı',
      badge:K.Badge({ label:'denetim', tone:'danger' }),
      body:html`
        <div class="qdiff">
          <div class="qdiff__col">
            <span class="mono-label">Yukarıdaki çözüm</span>
            <b class="qdiff__ans">${(result && result.meta && result.meta.answer) || '—'}</b>
          </div>
          <div class="qdiff__col">
            <span class="mono-label">Bağımsız çözüm${
              when(check.second.model, () => ' · ' + check.second.model)}</span>
            <b class="qdiff__ans">${check.second.answer}</b>
          </div>
        </div>
        ${when(!j, () => K.Notice({ tone:'warn',
          body:'Hangisinin doğru olduğuna karar verilemedi. Çözümü kendin kontrol et; '
             + 'aşağıdan öğretmene sorabilirsin.' }))}
        ${when(j, () => html`
          ${K.Notice({ tone:j.winner === 'A' ? 'ok' : 'danger',
            title:j.winner === 'A' ? 'Yukarıdaki çözüm doğru.'
              : j.winner === 'B' ? 'Yukarıdaki çözüm HATALI.'
              : j.winner === 'hicbiri' ? 'İkisi de hatalı.'
              : 'Karar verilemedi.',
            body:j.answer ? 'Doğru cevap: ' + j.answer : '' })}
          ${when(j.step, () => K.Notice({ tone:'info', title:'Hata nerede başlıyor:', body:j.step }))}
          ${when(j.text, () => html`<div class="mt-10">${raw(solutionBody(j.text))}</div>`)}`)}
        <p class="tiny dim mt-10">Denetim yanılabilir. Hakem de bir modeldir ve
          kesin hüküm vermez; sana gösterdiği yeri kendin kontrol et.</p>`,
    });
  }

  /* ---------- konu seçici ----------

     500 satırlık bir <select> içinde konu aramak, konuyu bilmekten daha
     zordu. Artık YAZILARAK aranıyor: her harfte liste daralıyor ve
     eşleşenler altta çıkıyor.

     Model konuyu ZATEN seçmiş olarak geliyor (kapalı katalogdan); kutu
     onun seçimiyle dolu açılır ve sen değiştirebilirsin. Yani sıra:
     önce sistem tahmin eder, sonra sen düzeltirsin. */

  const TOPIC_LIMIT = 8;

  function allTopics(){
    return R.SUBJECTS.reduce((acc, s) => acc.concat(
      s.topics.map(t => ({
        ref:s.id + '::' + t.id,
        subject:s.name, topic:t.name,
        label:s.name + ' · ' + t.name,
        hay:U.norm(s.name + ' ' + t.name),
      }))), []);
  }

  /* Arama: bütün kelimeler geçmeli (sıra önemsiz), böylece "mat üslü"
     de "TYT Temel Matematik · Üslü sayılar"ı bulur. Türkçe harf farkı
     eşleşmeyi bozmaz (U.norm). */
  function searchTopics(q){
    const words = U.norm(q || '').split(/\s+/).filter(Boolean);
    if(!words.length) return [];
    return allTopics()
      .filter(t => words.every(w => t.hay.indexOf(w) >= 0))
      /* Konu adında geçen, ders adında geçenden önce gelir. */
      .sort((a, b) => {
        const sa = words.every(w => U.norm(a.topic).indexOf(w) >= 0) ? 0 : 1;
        const sb = words.every(w => U.norm(b.topic).indexOf(w) >= 0) ? 0 : 1;
        return sa - sb || a.label.length - b.label.length;
      })
      .slice(0, TOPIC_LIMIT);
  }

  function topicLabel(ref){
    const t = allTopics().find(x => x.ref === ref);
    return t ? t.label : '';
  }

  /* Kutunun altındaki öneri listesi — ekranda tek yerden çizilir ki
     yazarken tüm formu yeniden çizmek zorunda kalmayalım. */
  function topicSuggestions(){
    const q = topicQuery.trim();
    if(!q) return '';
    const rows = searchTopics(q);
    if(!rows.length){
      return String(html`<div class="tsug tsug--empty">Eşleşen konu yok.
        Başka bir kelime dene ya da boş bırak.</div>`);
    }
    return String(html`<div class="tsug">${map(rows, t => html`
      <button type="button" class="${cls('tsug__row', t.ref === topicRef && 'is-on')}"
        data-act="q-topic-pick" data-ref="${t.ref}">
        <b>${t.topic}</b><span class="dim">${t.subject}</span>
      </button>`)}</div>`);
  }

  function topicPicker(m){
    const guessed = m.topicId ? m.subjectId + '::' + m.topicId : '';
    const current = topicRef || guessed;
    const label = topicLabel(current);

    return K.Stack([
      html`<div class="tpick">
        ${K.Field({ label:'Ders – konu',
          hint:label ? 'sistemin seçtiği: ' + label + ' — değiştirmek için yaz'
            : 'yazarak ara, aşağıdan seç',
          input:K.Input({ id:'q-topic-q', value:topicQuery, change:'q-topic-q',
            data:{ 'data-debounce':'140' },
            placeholder:label || 'ör. üslü, paragraf, türev' }) })}
        <input type="hidden" id="q-topic" value="${current}"/>
        <div id="q-topic-sug">${raw(topicSuggestions())}</div>
        ${when(current, () => html`<div class="tpick__on">
          ${raw(UI.icon('check'))} <b>${label}</b>
          ${K.Button({ label:'Kaldır', size:'sm', tone:'ghost', act:'q-topic-clear' })}
        </div>`)}
        ${when(!current, () => html`<p class="tiny dim">Konu seçilmezse kayıt konu
          takibine bağlanmaz — sonradan da seçebilirsin.</p>`)}
      </div>`,
    ], 'sm');
  }

  function saveForm(m){
    return K.Stack([
      topicPicker(m),
      K.Field({ label:'Zorluk',
        input:K.Select({ id:'q-diff', value:m.difficulty || 3,
          options:R.DIFFICULTY_ORDER.map(n => ({ value:n,
            label:n + ' — ' + R.DIFFICULTY[n].label })) }) }),
      K.Field({ label:'Sen ne yaptın?',
        hint:'“çözüme baktım” ile “kendim çözdüm” arasındaki fark, konu takibinin en değerli bilgisi',
        input:K.Select({ id:'q-result', value:'bakarak',
          options:R.SOLVE_RESULT_ORDER.map(id => ({ value:id, label:R.SOLVE_RESULTS[id].label })) }) }),
      K.Cols(2, [
        K.Field({ label:'Süre (sn)', hint:'isteğe bağlı',
          input:K.Input({ id:'q-secs', type:'number', numeric:true, min:0 }) }),
        K.Field({ label:'Cevap', input:K.Input({ id:'q-answer', value:m.answer || '' }) }),
      ]),
      /* Kaynak: zorluğu ETİKETİNDEN değil, senin bu kaynaktaki oranından
         öğreneceğiz. Onun için soru kaynağa bağlanmalı. */
      K.Cols(2, [
        K.Field({ label:'Kaynak', hint:'hangi yayından',
          input:K.Select({ id:'q-source', value:lastSource,
            options:[{ value:'', label:'— kaynak seç —' }].concat(
              R.Sources.all().map(x => ({ value:x.id,
                label:x.name + ' · ' + R.SOURCE_LEVELS[x.level].label }))) }) }),
        K.Field({ label:'Soru no', hint:'isteğe bağlı',
          input:K.Input({ id:'q-no', placeholder:'ör. 42' }) }),
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

  /* ---------- kaynaklar ----------
     Etiket bir başlangıç noktasıdır; asıl ölçü SENİN o kaynaktaki oranın.
     Genel olarak %75 çözüp bir kitapta %45'te kalıyorsan o kitap zordur —
     etiketinde ne yazarsa yazsın. */

  function sourceCard(){
    const rows = R.Sources.table();
    const warn = R.Sources.ladderWarning();

    return K.Card({
      title:'Kaynaklarım', sub:'Zorluk etiketten değil, senin oranından çıkar',
      actions:K.Button({ label:'Kaynak ekle', icon:'plus', size:'sm', act:'q-src-new' }),
      body:html`
        ${when(warn, () => K.Notice({ tone:'warn', title:'Yayın merdiveni:', body:warn.text }))}
        ${when(!rows.length, () => K.Empty({ icon:'book',
          text:'Henüz kaynak yok. Kullandığın yayınları ekle; çözdüğün soruları onlara '
             + 'bağladıkça hangisinin sana zor geldiği kendiliğinden çıkar.',
          action:K.Button({ label:'Kaynakları yükle', size:'sm', tone:'primary', act:'q-src-seed' }) }))}
        ${when(rows.length, () => html`<div class="stack-xs">${map(rows, r => html`
          <div class="srcrow">
            <span class="minw0">
              <b class="srcrow__name">${r.src.name}</b>
              <span class="srcrow__meta">${R.SOURCE_LEVELS[r.src.level].label}
                · ${R.SOURCE_KINDS[r.src.kind].label}${
                  when(r.olcum.soru, () => ' · ' + r.olcum.soru + ' soru')}</span>
            </span>
            ${K.Badge({ label:badgeOf(r), tone:toneOf(r) })}
            ${K.IconButton({ icon:'edit', size:'sm', plain:true, aria:'Kaynağı düzenle',
              act:'q-src-edit', data:{ 'data-id':r.src.id } })}
          </div>`)}</div>
        <p class="tiny dim mt-8">Bir kaynak hakkında konuşabilmek için en az
          ${R.SOURCE_MIN_SAMPLE} çözülmüş soru gerekir; altı sorudan çıkan oran gürültüdür.</p>`)}`,
    });
  }

  function badgeOf(r){
    if(r.durum === 'bilinmiyor') return r.olcum.soru ? r.olcum.soru + '/' + R.SOURCE_MIN_SAMPLE : 'kayıt yok';
    return '%' + r.oran + ' · ' + (r.durum === 'zor' ? 'sana zor'
      : r.durum === 'kolay' ? 'sana kolay' : 'denk');
  }
  function toneOf(r){
    return r.durum === 'zor' ? 'danger' : r.durum === 'kolay' ? 'ok'
      : r.durum === 'dengeli' ? 'info' : 'muted';
  }

  function sourceSheet(id){
    const src = id ? R.Sources.byId(id) : null;
    const v = (f, d) => src ? (src[f] == null ? '' : src[f]) : (d == null ? '' : d);
    UI.sheet({
      title:src ? 'Kaynağı düzenle' : 'Kaynak ekle',
      subtitle:'Kademe bir başlangıç noktası; gerçek zorluk çözdükçe ölçülür',
      body:String(K.Stack([
        K.Field({ label:'Ad', input:K.Input({ id:'src-name', value:v('name'),
          placeholder:'ör. 345 TYT Matematik Soru Bankası' }) }),
        K.Cols(2, [
          K.Field({ label:'Zorluk kademesi',
            input:K.Select({ id:'src-level', value:v('level', 'orta'),
              options:R.SOURCE_LEVEL_ORDER.map(k => ({ value:k, label:R.SOURCE_LEVELS[k].label })) }) }),
          K.Field({ label:'Tür',
            input:K.Select({ id:'src-kind', value:v('kind', 'banka'),
              options:R.SOURCE_KIND_ORDER.map(k => ({ value:k, label:R.SOURCE_KINDS[k].label })) }) }),
        ]),
        K.Field({ label:'Ders', hint:'yalnız bir derse aitse',
          input:K.Select({ id:'src-subject', value:v('subjectId'),
            options:[{ value:'', label:'— hepsi —' }].concat(
              R.SUBJECTS.map(x => ({ value:x.id, label:x.name }))) }) }),
        K.Field({ label:'Not', input:K.Input({ id:'src-note', value:v('note') }) }),
        when(src, () => K.Notice({ tone:'info', body:R.Sources.sentence(src.id) })),
        when(src && src.from, () => html`<p class="tiny dim">Kademe varsayılanı
          uygulamanın kendi kaynak mimarisinden geldi (${src.from}); değiştirebilirsin.</p>`),
      ])),
      footer:String(html`
        ${when(src, () => K.Button({ label:'Sil', tone:'ghost', act:'q-src-del',
          data:{ 'data-id':src.id } }))}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'q-src-save',
          data:{ 'data-id':src ? src.id : '' } })}`),
    });
  }

  /* ---------- ekran ---------- */

  async function render(){
    return String(K.Grid([
      K.Span(8, K.Stack([ inputCard(), resultCard() ])),
      K.Span(4, K.Stack([ statCard(), sourceCard(), topicCard(), historyCard() ])),
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
      image = null; result = null; draft = null;
      thread = []; check = null; topicRef = ''; topicQuery = '';
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
      thread = []; check = null; topicRef = ''; topicQuery = '';
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

    /* Sohbet: çözüm bittiğinde iş bitmez. Geçmiş her turda modele geri
       verilir, böylece "peki ya şu?" diye devam edebilirsin. */
    async 'q-follow'(){
      if(followBusy || !result) return;
      const el = document.getElementById('q-follow');
      const q = el ? el.value.trim() : '';
      if(!q) return;
      followBusy = true;
      thread = thread.concat([{ role:'user', text:q }]);
      await R.App.render();
      try{
        const res = await Q.talk({
          solution:result.text,
          follow:q,
          thread:thread.slice(0, -1).map(m => ({ role:m.role, text:m.text })),
        }, {});
        thread = thread.concat([{ role:'agent', text:res.text }]);
      }catch(err){
        /* Soru boşa gitmesin: cevap gelmediyse kullanıcının yazdığı da
           geri alınır, yoksa sohbette cevapsız bir satır kalır. */
        thread = thread.slice(0, -1);
        UI.toast(R.LLM.errorText(err && err.code));
      }finally{
        followBusy = false;
        await R.App.render();
      }
    },

    async 'q-thread-clear'(){
      thread = [];
      await R.App.render();
    },

    /* Bağımsız denetim: soru sıfırdan, ilk çözüm görülmeden, tercihen
       BAŞKA bir modele çözdürülür. Ayrılık varsa hakem turu da çalışır. */
    async 'q-check'(){
      if(checkBusy || !result) return;
      checkBusy = true;
      await R.App.render();
      try{
        check = await Q.verifyRun({
          question:questionText(),
          image,
          solutionA:result.text,
          answerA:(result.meta && result.meta.answer) || '',
          usedModel:result.model,
        }, {});
      }catch(err){
        check = { durum:'yapilamadi', neden:err && err.code };
      }finally{
        checkBusy = false;
        await R.App.render();
      }
    },

    async 'q-save'(){ await saveRecord(false); },
    async 'q-save-error'(){ await saveRecord(true); },

    /* Konu seçici: yazarak ara, listeden seç. */
    async 'q-topic-pick'(el){
      topicRef = el.dataset.ref;
      topicQuery = '';
      await R.App.render();
    },
    async 'q-topic-clear'(){
      topicRef = '';
      topicQuery = '';
      /* Modelin tahmini de kaldırılmalı, yoksa "kaldır" hiçbir şey yapmıyor
         gibi görünür ve tahmin geri gelir. */
      if(result && result.meta){ result.meta.topicId = null; result.meta.subjectId = null; }
      await R.App.render();
    },

    async 'q-src-new'(){ sourceSheet(null); },
    async 'q-src-edit'(el){ sourceSheet(el.dataset.id); },

    async 'q-src-seed'(){
      await R.Sources.seed();
      UI.toast(R.Sources.all().length + ' kaynak eklendi — kademelerini değiştirebilirsin');
      await R.App.render();
    },

    async 'q-src-save'(el){
      const val = id => { const e = document.getElementById(id); return e ? String(e.value).trim() : ''; };
      const name = val('src-name');
      if(!name){ UI.toast('Kaynağın adı gerekiyor'); return; }
      const old = el.dataset.id ? R.Sources.byId(el.dataset.id) : null;
      await R.Sources.save(Object.assign({}, old || {}, {
        id:el.dataset.id || undefined,
        name, level:val('src-level'), kind:val('src-kind'),
        subjectId:val('src-subject') || null,
        note:val('src-note'),
      }));
      UI.closeSheet();
      UI.toast('Kaynak kaydedildi');
      await R.App.render();
    },

    async 'q-src-del'(el){
      await R.Sources.remove(el.dataset.id);
      UI.closeSheet();
      UI.toast('Kaynak silindi');
      await R.App.render();
    },

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
    /* Konu: senin seçimin varsa o, yoksa sistemin tahmini. */
    const guess = (result.meta && result.meta.topicId)
      ? result.meta.subjectId + '::' + result.meta.topicId : '';
    const ref = topicRef || guess;
    const [subjectId, topicId] = ref ? ref.split('::') : [null, null];
    const subject = subjectId ? R.SUBJECTS.find(s => s.id === subjectId) : null;
    const topic = subject ? subject.topics.find(t => t.id === topicId) : null;
    const m = result.meta || {};

    const rec = await Q.save({
      question:questionText(),
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
      sourceId:val('q-source') || null,
      sourceName:sourceNameOf(val('q-source')),
      questionNo:val('q-no'),
      /* Denetimin sonucu kayda geçer: sonradan "bu çözüme güvenilir mi?"
         diye bakabilmek için. */
      checked:check ? check.durum : null,
      checkNote:check && check.judge ? check.judge.step : '',
    });

    /* Sonraki soru genelde AYNI kitaptan gelir: seçim hatırlanır. */
    lastSource = val('q-source') || '';

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
    result = null; image = null; thread = []; check = null;
    topicRef = ''; topicQuery = '';
    await R.App.render();
  }

  const change = {
    async 'q-topic-q'(el){
      topicQuery = el.value;
      /* Yazarken tüm ekranı yeniden çizmek imleci kaybettiriyordu:
         yalnız öneri listesi değişir. */
      const box = document.getElementById('q-topic-sug');
      if(box) box.innerHTML = topicSuggestions();
    },

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
