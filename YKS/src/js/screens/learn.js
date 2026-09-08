/* Öğrenme — ders videosu, zaman damgalı not ve nottan tekrar kartı.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz.

   Teknik sinirlar (bilerek):
   - Transcript otomatik cekilmez. CORS ve kullanim kosullari buna izin vermez;
     aday isterse metni kendisi yapistirir.
   - Zaman damgasi elle "mm:ss" girilir ya da calisan blogun sayacindan onerilir.
     YouTube iframe'inden currentTime okumak IFrame API gerektirir; 3. parti
     script yuklemiyoruz, bu yuzden denenmez.
   - Gomulu oynatici acilmayabilir (CSP / ag). Bu durumda not editoru calismaya
     devam eder ve videoyu tarayicida acan bir baglanti gosterilir. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.learn = (function(){
  const U = R.U, M = R.Model, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  /* Not etiketleri modelde tanimli; kart koprusu de oradan gecer. */
  const SEG_TAGS = M.SEGMENT_TAGS;
  const TAG_OPTIONS = Object.keys(SEG_TAGS).map(k => ({ value:k, label:SEG_TAGS[k].label }));

  let pendingCards = [];
  let pendingSplit = [];
  let listening = false;
  let recognition = null;

  /* Sesli not: tarayıcının kendi ses tanıması. Yoksa düğme hiç görünmez. */
  function startVoice(){
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!Rec){ UI.toast('Bu tarayıcı ses tanımayı desteklemiyor'); return; }
    if(listening && recognition){ recognition.stop(); return; }
    try{
      recognition = new Rec();
      recognition.lang = 'tr-TR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = ev => {
        const text = ev.results[0][0].transcript;
        const box = document.getElementById('nf-text');
        if(box){ box.value = text; box.focus(); }
      };
      recognition.onend = () => { listening = false; R.App.render(); };
      recognition.onerror = () => { listening = false; UI.toast('Ses alınamadı'); R.App.render(); };
      recognition.start();
      listening = true;
      R.App.render();
    }catch(e){ listening = false; UI.toast('Ses tanıma başlatılamadı'); }
  }

  const FILTERS = [
    { value:'all',  label:'Tümü' },
    { value:'open', label:'Devam eden' },
    { value:'done', label:'Bitmiş' },
  ];

  function openNote(){
    return S.ui.noteOpen ? S.videoNotes.find(n => n.id === S.ui.noteOpen) : null;
  }

  function subjectOptions(){
    return [{ value:'', label:'— ders —' }].concat(R.SUBJECTS.map(s => ({ value:s.id, label:s.name })));
  }
  function topicOptions(subjectId){
    const s = R.SUBJECTS.find(x => x.id === subjectId);
    if(!s) return [{ value:'', label:'— önce ders seç —' }];
    return [{ value:'', label:'— konu —' }].concat(s.topics.map(t => ({ value:t.id, label:t.order+'. '+t.name })));
  }
  function topicLabel(note){
    const s = R.SUBJECTS.find(x => x.id === note.subjectId);
    if(!s) return 'Ders bağlanmadı';
    const t = s.topics.find(x => x.id === note.topicId);
    return t ? s.name+' · '+t.name : s.name;
  }

  /* Calisan blok varsa zaman damgasi icin bir baslangic onerisi verir. */
  function suggestedTs(){
    const day = S.days[U.todayISO()];
    const b = day ? day.blocks.find(x => x.startedAt) : null;
    if(!b) return null;
    return Math.max(0, Math.floor((Date.now() - new Date(b.startedAt).getTime())/1000));
  }

  /* ---------- liste ---------- */

  function NoteRow(note){
    const segs = note.segments.length;
    const cards = S.cards.filter(c => c.source === 'note' && c.sourceRef === note.id).length;
    const meta = [note.series || topicLabel(note), U.plural(segs, 'not', 'not'),
      cards ? cards+' kart' : null].filter(Boolean).join(' · ');
    return html`
      <div class="listitem listitem--tap" data-act="note-open" data-id="${note.id}">
        <span class="notedot ${note.done ? 'is-done' : ''}">${raw(UI.icon(note.done ? 'check' : 'play'))}</span>
        <div class="grow">
          <div class="row-sm wrap"><b>${note.title || 'Adsız ders'}</b>
            ${when(note.provider === 'youtube', () => K.Badge({ label:'video', tone:'muted' }))}
            ${when(note.transcript, () => K.Badge({ label:'metin var', tone:'muted' }))}</div>
          <div class="tiny dim">${meta}</div>
        </div>
        <span class="tiny dim">${U.fmtShort(note.createdAt.slice(0, 10))}</span>
      </div>`;
  }

  function listView(){
    const filter = S.ui.learnFilter || 'all';
    const q = U.norm(S.ui.learnQuery || '');
    let list = S.videoNotes.slice();
    if(filter === 'open') list = list.filter(n => !n.done);
    else if(filter === 'done') list = list.filter(n => n.done);
    if(q) list = list.filter(n => U.norm(n.title+' '+topicLabel(n)+' '+n.segments.map(s => s.text).join(' ')).indexOf(q) >= 0);

    const pg = K.paginate(list, S.ui.learnPage || 1, 20);
    const totalSegs = S.videoNotes.reduce((a, n) => a + n.segments.length, 0);
    const noteCards = S.cards.filter(c => c.source === 'note').length;

    const body = S.videoNotes.length
      ? (list.length
          ? html`<div class="list">${map(pg.items, NoteRow)}</div>
                 ${K.Pager({ page:pg.page, pages:pg.pages, total:pg.total, act:'note-page' })}`
          : K.Empty({ icon:'search', text:'Bu süzgece uyan ders yok.',
              action:K.Button({ label:'Süzgeci sıfırla', size:'sm', act:'learn-reset' }) }))
      : K.Empty({ icon:'play',
          text:'Henüz ders eklenmedi. Bir video izlerken buraya zaman damgalı not düşersin; '
             + 'not konuya bağlanır ve oradan tekrar kartına dönüşür.',
          action:K.Button({ label:'İlk dersi ekle', icon:'plus', tone:'primary', act:'note-new' }) });

    return K.Grid([
      K.Span(8, K.Stack([
        K.Row([
          K.Segmented({ items:FILTERS, value:filter, act:'learn-filter', aria:'Ders süzgeci' }),
          K.Input({ class:'input--search', placeholder:'Derslerde ve notlarda ara…',
            value:S.ui.learnQuery || '', aria:'derslerde ara',
            change:'learn-search', data:{ 'data-debounce':220 } }),
        ], { between:true, wrap:true }),
        K.Card({ body }),
      ])),
      K.Span(4, K.Stack([
        K.Cols(3, [
          K.Stat({ label:'Ders', value:U.fmtNum(S.videoNotes.length) }),
          K.Stat({ label:'Not', value:U.fmtNum(totalSegs) }),
          K.Stat({ label:'Kart', value:U.fmtNum(noteCards), tone:noteCards ? 'ok' : null }),
        ]),
        K.Card({ title:'Nasıl çalışır?', sub:'Dört adım, tek yolculuk', body:html`
          <ol class="bullets small muted">
            <li>Videoyu ekle, dersi ve konuyu bağla.</li>
            <li>İzlerken durakla, <b>mm:ss</b> ve tek cümle not düş.</li>
            <li>Notu etiketle: kural, örnek, tuzak, soru.</li>
            <li>“Kart yap” ile notu tekrar takvimine sok (1g→3g→1h→1a).</li>
          </ol>
          <p class="tiny dim mt-10">Transcript otomatik çekilmez; istersen metni yapıştırabilirsin.
            Zaman damgası elle girilir ya da çalışan bloğun sayacından önerilir.</p>` }),
        raw(UI.rail(['recall', 'srs', 'closure'])),
      ])),
    ]);
  }

  /* ---------- oynatici ---------- */

  function player(note){
    if(note.provider !== 'youtube' || !note.videoId){
      return K.Notice({ tone:'info', title:'Gömülü oynatıcı yok.',
        body:html`Bu bağlantı tanınan bir video sağlayıcısına ait değil.
          ${when(note.url, () => html`<a href="${note.url}" target="_blank" rel="noopener">Videoyu tarayıcıda aç</a>.`)}
          Not editörü yine de çalışır.` });
    }
    const src = 'https://www.youtube-nocookie.com/embed/' + note.videoId + '?rel=0&modestbranding=1';
    return html`
      <div class="player">
        <iframe class="player__frame" src="${src}" title="${note.title || 'Ders videosu'}"
          loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture"
          referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>
      <p class="tiny dim mt-6">Video açılmıyorsa
        <a href="${M.tsUrl(note, 0)}" target="_blank" rel="noopener">tarayıcıda aç</a> —
        not almaya buradan devam edebilirsin.</p>`;
  }

  /* ---------- not editoru ---------- */

  function segmentRow(note, seg, i){
    const t = SEG_TAGS[seg.tag] || SEG_TAGS.not;
    return html`
      <div class="seg-row">
        <a class="seg-row__ts num" href="${M.tsUrl(note, seg.ts)}" target="_blank" rel="noopener"
           title="videoda bu ana git">${M.fmtTs(seg.ts)}</a>
        <div class="grow">
          <div class="row-sm wrap">${K.Badge({ label:t.label, tone:t.tone })}</div>
          <div class="small mt-2">${seg.text}</div>
        </div>
        <div class="row-sm">
          ${K.Button({ label:'Kart yap', size:'sm', act:'note-seg-card', data:{ 'data-i':i } })}
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'notu sil',
            act:'note-seg-del', data:{ 'data-i':i } })}
        </div>
      </div>`;
  }

  function editor(note){
    const sug = suggestedTs();
    const tag = S.ui.noteTag || 'not';
    const tmpl = R.NOTE_TEMPLATES[tag] || R.NOTE_TEMPLATES.not;
    return K.Card({
      title:'Not al', hint:'notebook',
      sub:'Durakla, tek cümle yaz. Uzun not değil, geri çağırmayı tetikleyen cümle.',
      actions:when(window.SpeechRecognition || window.webkitSpeechRecognition,
        () => K.Button({ label:listening ? 'Dinleniyor…' : 'Sesle yaz', icon:'zap', size:'sm',
          tone:listening ? 'primary' : null, act:'note-voice' })),
      body:html`
        <div class="noteform">
          ${K.Field({ label:'Zaman', hint:note.source === 'kitap' ? 'sayfa' : 'mm:ss',
            input:K.Input({ id:'nf-ts', placeholder:note.source === 'kitap' ? '' : '12:30',
              aria:'zaman damgası', value:sug == null ? '' : M.fmtTs(sug) }) })}
          ${K.Field({ label:'Etiket',
            input:K.Select({ id:'nf-tag', options:TAG_OPTIONS, value:tag, change:'note-tag' }) })}
          ${K.Field({ label:'Not', input:K.Input({ id:'nf-text',
            placeholder:'ör. paydayı eşitlemeden sadeleştirme yapılmaz' }) })}
          ${K.Button({ label:'Ekle', icon:'plus', tone:'primary', act:'note-seg-add' })}
        </div>

        <div class="row wrap gap-6 mt-8">
          <span class="tiny dim">Kalıp:</span>
          ${map(tmpl, t => K.Chip({ label:t, act:'note-template', data:{ 'data-t':t } }))}
        </div>

        <div id="note-quality"></div>

        ${when(sug != null, () => html`<p class="tiny dim mt-6">Çalışan bloğun sayacı
          ${M.fmtTs(sug)} gösteriyor; zaman alanı bununla dolduruldu, değiştirebilirsin.</p>`)}`,
    });
  }

  function detailView(note){
    const segs = note.segments.slice().sort((a, b) => a.ts - b.ts);
    const cards = S.cards.filter(c => c.source === 'note' && c.sourceRef === note.id);

    return K.Grid([
      K.Span(12, K.Row([
        K.Button({ label:'Dersler', icon:'left', size:'sm', tone:'ghost', act:'note-back' }),
        html`<div class="row-sm">
          ${note.done ? K.Badge({ label:'bitti', tone:'ok' }) : K.Badge({ label:'devam ediyor', tone:'muted' })}
          ${K.Button({ label:note.done ? 'Yeniden aç' : 'Bitti işaretle', size:'sm', act:'note-toggle-done' })}
          ${K.IconButton({ icon:'trash', size:'sm', aria:'dersi sil', act:'note-delete', data:{ 'data-id':note.id } })}
        </div>`,
      ], { between:true, wrap:true })),

      K.Span(7, K.Stack([
        K.Card({ title:note.title || 'Adsız ders', sub:topicLabel(note), body:player(note) }),
        editor(note),
        K.Card({
          title:'Notlar', sub:U.plural(segs.length, 'kayıt', 'kayıt'),
          actions:when(segs.length, () => K.Button({ label:'Tümünden kart üret', icon:'cards',
            size:'sm', act:'note-cards-all' })),
          body:segs.length
            ? html`<div class="seglist">${map(segs, (s, i) => segmentRow(note, s, note.segments.indexOf(s)))}</div>`
            : K.Empty({ icon:'edit', text:'Henüz not yok. Videoyu durakla, zaman ve tek cümle gir.' }),
        }),
      ])),

      K.Span(5, K.Stack([
        K.Card({ title:'Ders bağlantısı', sub:'Not hangi konuya ait?', body:html`
          ${K.Field({ label:'Başlık', input:K.Input({ id:'nd-title', value:note.title,
            placeholder:'ör. Paragrafta ana düşünce', change:'note-title' }) })}
          ${K.Cols(2, [
            K.Field({ label:'Ders', input:K.Select({ id:'nd-subject', options:subjectOptions(),
              value:note.subjectId || '', change:'note-subject' }) }),
            K.Field({ label:'Konu', input:K.Select({ id:'nd-topic', options:topicOptions(note.subjectId),
              value:note.topicId || '', change:'note-topic' }) }),
          ])}
          ${K.Cols(2, [
            K.Field({ label:'Kaynak türü', input:K.Select({ id:'nd-source', change:'note-source',
              value:note.source || 'video',
              options:[{ value:'video', label:'Video' }, { value:'kitap', label:'Kitap / PDF' },
                { value:'ders', label:'Canlı ders' }] }) }),
            K.Field({ label:'Seri', hint:'aynı seriyi bir arada tut',
              input:K.Input({ id:'nd-series', value:note.series, placeholder:'ör. Paragraf kampı',
                change:'note-series' }) }),
          ])}
          ${note.source === 'kitap'
            ? K.Field({ label:'Kaynak / sayfa', input:K.Input({ id:'nd-page', value:note.page,
                placeholder:'ör. 345 TYT Matematik s.128', change:'note-page' }) })
            : K.Field({ label:'Video bağlantısı', hint:'YouTube bağlantısı gömülü açılır',
                input:K.Input({ id:'nd-url', value:note.url, placeholder:'https://…', change:'note-url' }) })}` }),

        when(R.Coach.available() && note.segments.length, () => raw(R.Coach.panel('note-summary',
          S.coach && S.coach['note-summary-n-'+note.id]))),

        when(R.Coach.available() && note.segments.length, () => K.Card({
          title:'Koçtan kart üret', sub:'Notlardan geri çağırma kartı önerir; sen onaylarsın',
          body:html`
            <p class="small muted">Koç yalnız metin önerir. Kart nesnesini kural motoru kurar:
              aşama 0, ilk tekrar yarın, konu bu derse bağlı.</p>
            ${K.Button({ label:'Kart önerileri getir', icon:'zap', tone:'primary', block:true,
              class:'mt-10', act:'note-ai-cards', data:{ 'data-id':note.id } })}
            <div id="ai-cards"></div>` })),

        K.Collapsible({
          title:'Metin (transcript)', meta:note.transcript ? U.fmtNum(note.transcript.length)+' karakter' : 'boş',
          act:'note-toggle-transcript', open:!!S.ui.transcriptOpen,
          body:html`
            ${K.Notice({ tone:'info', body:'Otomatik çekilmez. Videonun altyazısını kopyalayıp buraya '
              + 'yapıştır; sistem cümlelere bölüp zaman damgası önerir, sen onaylarsın.' })}
            ${K.Textarea({ id:'nd-transcript', rows:8, value:note.transcript,
              placeholder:'Altyazı metnini buraya yapıştır (isteğe bağlı)', change:'note-transcript' })}
            ${when(note.transcript, () => K.Row([
              K.Field({ label:'Video süresi (dk)', input:K.Input({ id:'nd-dur', type:'number',
                numeric:true, class:'input--cell', placeholder:'—' }) }),
              K.Button({ label:'Cümlelere böl', icon:'zap', tone:'primary', class:'mt-12',
                act:'note-split' }),
            ], { wrap:true }))}`,
        }),

        when(cards.length, () => K.Card({ title:'Bu dersten üretilen kartlar', sub:U.plural(cards.length, 'kart', 'kart'),
          body:html`<div class="stack-xs">${map(cards.slice(0, 8), c => html`
            <div class="row between"><span class="small truncate">${c.front}</span>
              <span class="tiny dim">${U.fmtShort(c.dueAt)}</span></div>`)}</div>
            ${K.Button({ label:'Tekrar ekranına git', size:'sm', class:'mt-10', act:'go',
              data:{ 'data-route':'cards' } })}` })),
      ])),
    ]);
  }

  async function render(){
    const note = openNote();
    return String(note ? detailView(note) : listView());
  }

  const handle = {
    async 'learn-filter'(el){ S.ui.learnFilter = el.dataset.value; S.ui.learnPage = 1; R.App.render(); },
    async 'learn-reset'(){ S.ui.learnFilter = 'all'; S.ui.learnQuery = ''; S.ui.learnPage = 1; R.App.render(); },
    async 'note-page'(el){ S.ui.learnPage = Number(el.dataset.page); R.App.render(); },
    async 'note-open'(el){ S.ui.noteOpen = el.dataset.id; R.App.render(); },
    async 'note-back'(){ S.ui.noteOpen = null; R.App.render(); },
    async 'note-toggle-transcript'(){ S.ui.transcriptOpen = !S.ui.transcriptOpen; R.App.render(); },
    async 'note-tag'(el){ S.ui.noteTag = el.value; R.App.render(); },
    async 'note-template'(el){
      const box = document.getElementById('nf-text');
      if(box){ box.value = el.dataset.t; box.focus(); }
    },
    async 'note-voice'(){ startVoice(); },
    async 'note-split'(){
      const note = openNote();
      if(!note || !note.transcript){ UI.toast('Önce metni yapıştır'); return; }
      const durEl = document.getElementById('nd-dur');
      const secs = durEl && durEl.value ? Number(durEl.value) * 60 : null;
      const parts = M.splitTranscript(note.transcript, secs);
      if(!parts.length){ UI.toast('Bölünecek cümle bulunamadı'); return; }
      pendingSplit = parts;
      UI.sheet({
        title:'Bölünen cümleler', subtitle:parts.length+' öneri · onayladıkların not olur', wide:true,
        body:String(K.Stack([
          K.Notice({ tone:'info', body:'Zaman damgaları tahmindir. Video süresini girdiysen '
            + 'orantılı dağıtıldı; girmediysen cümle uzunluğuna göre yerleştirildi.' }),
          html`<div class="stack-xs">${map(parts, (x, i) => html`
            <label class="check">
              <input type="checkbox" checked data-split="${i}"/>
              <span><b class="tiny num">${M.fmtTs(x.ts)}</b> · ${x.text}</span>
            </label>`)}</div>`,
        ])),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Seçilenleri ekle', tone:'primary', act:'note-split-apply' })}`),
      });
    },
    async 'note-split-apply'(){
      const note = openNote();
      if(!note) return;
      let added = 0;
      document.querySelectorAll('[data-split]').forEach(el => {
        if(!el.checked) return;
        const seg = pendingSplit[Number(el.dataset.split)];
        if(seg){ note.segments.push({ ts:seg.ts, text:seg.text, tag:seg.tag }); added++; }
      });
      pendingSplit = [];
      await M.saveVideoNote(note);
      UI.closeSheet();
      UI.toast(added+' not eklendi');
      R.App.render();
    },

    async 'note-new'(){
      UI.sheet({
        title:'Ders ekle', subtitle:'Video bağlantısı isteğe bağlı — not almaya hemen başlayabilirsin',
        body:String(K.Stack([
          K.Field({ label:'Başlık', input:K.Input({ id:'nn-title', placeholder:'ör. Paragrafta ana düşünce' }) }),
          K.Field({ label:'Video bağlantısı', hint:'YouTube bağlantısı gömülü açılır',
            input:K.Input({ id:'nn-url', placeholder:'https://www.youtube.com/watch?v=…' }) }),
          K.Cols(2, [
            K.Field({ label:'Ders', input:K.Select({ id:'nn-subject', options:subjectOptions(), value:'' }) }),
            K.Field({ label:'Konu', input:K.Select({ id:'nn-topic', options:topicOptions(null), value:'' }) }),
          ]),
          K.Notice({ tone:'info', body:'Transcript otomatik çekilmez. İzlerken durakla, '
            + 'zaman damgası ve tek cümle notla ilerle.' }),
        ])),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Ekle ve aç', tone:'primary', act:'note-create' })}`),
      });
      const sel = document.getElementById('nn-subject');
      if(sel) sel.addEventListener('change', () => {
        const topic = document.getElementById('nn-topic');
        if(topic) topic.outerHTML = String(K.Select({ id:'nn-topic', options:topicOptions(sel.value), value:'' }));
      });
    },
    async 'note-create'(){
      const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      const note = M.newVideoNote({
        title: val('nn-title'),
        url: val('nn-url'),
        subjectId: val('nn-subject') || null,
        topicId: val('nn-topic') || null,
      });
      if(!note.title && !note.url){ UI.toast('Başlık veya bağlantı gir'); return; }
      await M.saveVideoNote(note);
      UI.closeSheet();
      S.ui.noteOpen = note.id;
      UI.toast('Ders eklendi');
      R.App.render();
    },
    async 'note-delete'(el){
      const id = el.dataset.id;
      UI.confirmSheet('Dersi sil', 'Bu ders ve altındaki notlar silinecek. Üretilmiş tekrar kartları kalır.', async () => {
        await M.deleteVideoNote(id);
        S.ui.noteOpen = null;
        UI.closeSheet();
        UI.toast('Ders silindi');
        R.App.render();
      }, true);
    },
    async 'note-toggle-done'(){
      const note = openNote();
      if(!note) return;
      note.done = !note.done;
      await M.saveVideoNote(note);
      R.App.render();
    },

    async 'note-seg-add'(){
      const note = openNote();
      if(!note) return;
      const tsEl = document.getElementById('nf-ts');
      const textEl = document.getElementById('nf-text');
      const tagEl = document.getElementById('nf-tag');
      const text = textEl ? textEl.value.trim() : '';
      if(!text){ UI.toast('Not boş olamaz'); return; }
      const ts = M.parseTs(tsEl ? tsEl.value : '');
      if(ts == null){ UI.toast('Zaman "mm:ss" biçiminde olmalı'); return; }

      const q = M.noteQuality(text);
      if(!q.ok){
        const box = document.getElementById('note-quality');
        if(box) box.innerHTML = String(html`<div class="mt-8">${K.Notice({ tone:'warn',
          title:'Not zayıf.', body:q.issues.map(i => i.why).join(' ') + ' Yine de eklemek için tekrar bas.' })}</div>`);
        if(!S.ui.noteForce){ S.ui.noteForce = true; return; }
      }
      S.ui.noteForce = false;
      note.segments.push({ ts, text, tag:(tagEl && tagEl.value) || 'not' });
      await M.saveVideoNote(note);
      if(textEl) textEl.value = '';
      UI.toast('Not eklendi · '+M.fmtTs(ts));
      await R.App.render();
      const again = document.getElementById('nf-text');
      if(again) again.focus();
    },
    async 'note-seg-del'(el){
      const note = openNote();
      if(!note) return;
      note.segments.splice(Number(el.dataset.i), 1);
      await M.saveVideoNote(note);
      R.App.render();
    },
    async 'note-seg-card'(el){
      const note = openNote();
      if(!note) return;
      const seg = note.segments[Number(el.dataset.i)];
      if(!seg) return;
      await M.saveCard(M.cardFromSegment(note, seg));
      UI.toast('Kart oluşturuldu · yarın tekrar');
      R.App.render();
    },
    async 'note-ai-cards'(el){
      const id = el.dataset.id;
      const out = document.getElementById('ai-cards');
      if(out) out.innerHTML = String(html`<p class="small muted mt-10">Notlar okunuyor…
        <span class="dim">(10–60 sn)</span></p>`);
      try{
        const res = await R.Coach.generateCards(id);
        pendingCards = res.cards;
        UI.sheet({
          title:'Önerilen kartlar', subtitle:res.cards.length+' kart · '+(res.dropped ? res.dropped+' öneri elendi' : 'hepsi geçerli'),
          wide:true,
          body:String(K.Stack([
            K.Notice({ tone:'info', body:'Onaylamadan önce oku. Yanlış bir kart, yanlış bir ezberdir.' }),
            html`<div class="stack-sm">${map(res.cards, (c, i) => K.Card({ flat:true, pad:'sm', body:html`
              <div class="row between"><b class="small">${c.front}</b>
                ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'öneriyi çıkar',
                  act:'note-ai-drop', data:{ 'data-i':i } })}</div>
              <p class="small muted mt-4">${c.back}</p>` }))}</div>`,
          ])),
          footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
            ${K.Button({ label:'Hepsini ekle', tone:'primary', act:'note-ai-accept' })}`),
        });
      }catch(err){
        const msg = R.Coach.errorText(err && err.code);
        if(out) out.innerHTML = String(html`<div class="mt-10">${K.Notice({ tone:'warn', body:msg })}</div>`);
      }
    },
    async 'note-ai-drop'(el){
      pendingCards.splice(Number(el.dataset.i), 1);
      UI.toast('Öneri çıkarıldı');
      const card = el.closest('.card');
      if(card) card.remove();
    },
    async 'note-ai-accept'(){
      if(!pendingCards.length){ UI.toast('Eklenecek kart yok'); return; }
      for(const c of pendingCards) await M.saveCard(c);
      const n = pendingCards.length;
      pendingCards = [];
      UI.closeSheet();
      UI.toast(n+' kart eklendi · yarın tekrar');
      R.App.render();
    },
    async 'note-cards-all'(){
      const note = openNote();
      if(!note || !note.segments.length) return;
      UI.confirmSheet('Tüm notlardan kart üret',
        note.segments.length+' not için tekrar kartı oluşturulacak. Kartlar 1 gün sonra çıkar.', async () => {
          for(const seg of note.segments) await M.saveCard(M.cardFromSegment(note, seg));
          UI.closeSheet();
          UI.toast(note.segments.length+' kart oluşturuldu');
          R.App.render();
        });
    },
  };

  const change = {
    async 'learn-search'(el){ S.ui.learnQuery = el.value; S.ui.learnPage = 1; R.App.render(); },
    async 'note-title'(el){ const n = openNote(); if(!n) return; n.title = el.value; await M.saveVideoNote(n); },
    async 'note-series'(el){ const n = openNote(); if(!n) return; n.series = el.value; await M.saveVideoNote(n); },
    async 'note-page'(el){ const n = openNote(); if(!n) return; n.page = el.value; await M.saveVideoNote(n); },
    async 'note-source'(el){
      const n = openNote(); if(!n) return;
      n.source = el.value;
      await M.saveVideoNote(n);
      R.App.render();
    },
    async 'note-transcript'(el){ const n = openNote(); if(!n) return; n.transcript = el.value; await M.saveVideoNote(n); },
    async 'note-url'(el){
      const n = openNote();
      if(!n) return;
      const parsed = M.parseVideoUrl(el.value);
      n.url = parsed.url; n.provider = parsed.provider; n.videoId = parsed.videoId;
      await M.saveVideoNote(n);
      R.App.render();
    },
    async 'note-subject'(el){
      const n = openNote();
      if(!n) return;
      n.subjectId = el.value || null;
      n.topicId = null;
      await M.saveVideoNote(n);
      R.App.render();
    },
    async 'note-topic'(el){
      const n = openNote();
      if(!n) return;
      n.topicId = el.value || null;
      await M.saveVideoNote(n);
    },
  };

  /* Ctrl+Enter ile not ekle — yazarken elini klavyeden kaldirmadan. */
  function onKey(e){
    if(e.key !== 'Enter') return;
    const el = document.getElementById('nf-text');
    if(el && document.activeElement === el){
      e.preventDefault();
      handle['note-seg-add']();
    }
  }

  return {
    id:'learn',
    title:'Öğrenme',
    subtitle(){
      const note = openNote();
      if(note) return (note.title || 'Adsız ders') + ' · ' + U.plural(note.segments.length, 'not', 'not');
      const segs = S.videoNotes.reduce((a, n) => a + n.segments.length, 0);
      return S.videoNotes.length
        ? U.plural(S.videoNotes.length, 'ders', 'ders') + ' · ' + U.plural(segs, 'not', 'not')
        : 'Video izle, not düş, karta çevir';
    },
    actions(){
      return String(K.Button({ label:'Ders ekle', icon:'plus', size:'sm', tone:'primary', act:'note-new' }));
    },
    render, handle, change, onKey,
  };
})();
