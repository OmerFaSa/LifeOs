/* Kütüphane — atomik not, sentopik matris ve kaynaklar.

   Üç sekme: Notlar · Matris · Kaynaklar.

   Tek kural: BİR NOT BİR FİKİR. İki fikir taşıyan not hiçbir yere
   bağlanamaz, çünkü hangi fikirle bağlandığı belirsizdir.

   Sistem bağ KURMAZ, bağ ÖNERİR: iki notun ortak kavramı varsa satır düşer,
   bağın nedenini kullanıcı yazar. Nedeni uydurmak, uydurulmuş sayı kadar
   zararlıdır — matris görünür ama anlamsız olur. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.library = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;

  const TABS = [
    { id:'notlar',    label:'Notlar' },
    { id:'matris',    label:'Matris' },
    { id:'kaynaklar', label:'Kaynaklar' },
    { id:'yontem',    label:'Yöntem' },
    { id:'ogren',     label:'Öğren' },
  ];

  /* ----------------------------------------------------------------- yöntem

     «Okudum» cümlesi ölçülebilir bir şey söylemez: göz gezdirmek de
     okumaktır, bir bölümü üç kez dönüp çıkarmak da. Bu sekme ikisini ayıran
     dili tutar. */
  function methodRows(){
    return [
      K.Entry({
        label:'Dört düzey', hint:'reading-level',
        meta:ESP.READING_LEVELS.length + ' düzey',
        note:'Hangi düzeyde okuduğunu bilmek, ne kadar okuduğunu bilmekten '
           + 'daha çok şey söyler.',
        wide:true,
        body:K.Table({ tight:true,
          headers:[{ label:'#', num:true }, 'Düzey', 'Sorusu', 'Not'],
          rows:ESP.READING_LEVELS.map(l => [String(l.rank), l.label, l.q, l.note]) }),
      }),

      K.Entry({
        label:'Analitik okumanın dört sorusu', hint:'analytic',
        meta:'kitap bitince',
        note:'Cevaplanmayan soru, okunmamış bir bölüm kadar eksiktir.',
        wide:true,
        body:html`${map(ESP.ANALYTIC_QUESTIONS, q => html`
          <div class="toolrow">
            <b>${q.q}</b>
            <span class="tiny dim">${q.note}</span>
          </div>`)}`,
      }),

      K.Entry({
        label:'Okuma protokolü', hint:'protocol',
        meta:ESP.READING_PROTOCOL.length + ' adım',
        note:'Not yazmak için okumayı durdurmak, okumayı da notu da bozar.',
        body:K.Table({ tight:true, headers:[{ label:'#', num:true }, 'Adım', 'Ne yapılır'],
          rows:ESP.READING_PROTOCOL.map(p => [String(p.step), p.label, p.do]) }),
      }),

      K.Entry({
        label:'Not şablonları', hint:'note-template',
        meta:ESP.NOTE_TEMPLATES.length + ' şablon',
        note:'Şablonsuz not, sonradan ne için alındığı anlaşılmayan nottur.',
        wide:true,
        body:K.Table({ tight:true, headers:['Şablon', 'Biçim', 'Ne zaman'],
          rows:ESP.NOTE_TEMPLATES.map(t => [t.label, t.form, t.use]) }),
      }),

      K.Entry({
        label:'Bırakma izni', hint:'abandon',
        meta:'kural',
        body:(function(){
          /* İlk cümle görünür; gerekçesi bir dokunuşla açılır (§1.2). */
          const c = String(ESP.ABANDON_RULE).split(/(?<=\.)\s+/);
          return K.Notice({ tone:'info', body:c.length > 1
            ? K.Ayrinti({ ozet:c[0], govde:html`<p>${c.slice(1).join(' ')}</p>` }) : c[0] });
        })(),
      }),
    ];
  }

  function bookOf(id){ return (S.books || []).find(b => b.id === id); }

  /* ------------------------------------------------------------------ notlar */

  function noteRows(){
    const q = U.norm(S.ui.noteQuery || '');
    const kavram = S.ui.conceptFilter;
    const hepsi = (S.notes || [])
      .filter(n => !q || U.norm(n.text).indexOf(q) >= 0)
      .filter(n => !kavram || (n.concepts || []).indexOf(kavram) >= 0);

    const rows = [
      K.Entry({
        label:'Not ekle', hint:'atomic-note',
        meta:'tek fikir, tek cümle',
        note:'Kitap özeti değil. İki fikir taşıyan not bağlanamaz; bölerek yaz.',
        body:html`
          ${K.Textarea({ id:'note-text', rows:3, aria:'Atomik not metni',
            placeholder:'Özgürlük, seçenek çokluğu değil seçebilme kapasitesidir.' })}
          <div class="row wrap mt-10">
            ${K.Select({ id:'note-book', value:'', aria:'Notun kaynağı',
              options:[{ value:'', label:'Kaynak seç (isteğe bağlı)' }]
                .concat((S.books || []).map(b => ({ value:b.id, label:b.author + ' — ' + b.title }))) })}
            ${K.Button({ label:'Notu ekle', tone:'primary', act:'add-note' })}
          </div>
          <p class="small muted mt-8">Kavram etiketleri metinden otomatik çıkarılır;
            kanonda olmayan kelime uydurulmaz, elle ekleyebilirsin.</p>`,
      }),
    ];

    if(!hepsi.length){
      rows.push(K.Entry({ label:'Notlar', meta:'yok',
        body:K.Empty({ text:q || kavram ? 'Süzgece uyan not yok.'
          : 'Henüz atomik not yok. Okuduğun tek bir fikri tek cümleyle yaz.' }) }));
      return rows;
    }

    rows.push(K.Entry({
      label:'Notlar',
      meta:hepsi.length + ' not' + (kavram ? ' · ' + (ESP.CONCEPT_BY_ID[kavram] || {}).label : ''),
      action:html`${K.Input({ id:'note-q', value:S.ui.noteQuery || '',
          placeholder:'Not ara…', change:'note-query', size:'sm', aria:'Not ara' })}
        ${when(kavram, () => K.Button({ label:'Süzgeci kaldır', size:'sm', act:'clear-concept' }))}`,
      wide:true,
      body:html`${map(hepsi, n => {
        const kitap = bookOf(n.bookId);
        return html`
          <div class="noterow">
            <p class="noterow__text">${n.text}</p>
            <div class="noterow__meta">
              ${when(kitap, () => html`<span class="tiny dim">${kitap.author} · ${kitap.title}</span>`)}
              ${map(n.concepts, c => K.Button({ size:'sm', act:'filter-concept',
                label:(ESP.CONCEPT_BY_ID[c] || {}).label || c, data:{ 'data-id':c } }))}
              <span class="tiny dim">${(n.links || []).length} bağ</span>
              ${K.Button({ label:'Bağla', size:'sm', act:'open-link', data:{ 'data-id':n.id } })}
              ${K.Button({ label:'Sil', size:'sm', act:'del-note', data:{ 'data-id':n.id } })}
            </div>
            ${when(S.ui.linkFrom === n.id, () => linkForm(n))}
            ${when((n.links || []).length, () => html`
              <ul class="noterow__links">${map(n.links, l => {
                const hedef = (S.notes || []).find(x => x.id === l.to);
                return html`<li>
                  <span>${hedef ? hedef.text : '(silinmiş not)'}</span>
                  ${when(l.why, () => html`<em>${l.why}</em>`)}
                  ${K.Button({ label:'Kaldır', size:'sm', act:'unlink',
                    data:{ 'data-a':n.id, 'data-b':l.to } })}
                </li>`;
              })}</ul>`)}
          </div>`;
      })}`,
    }));

    return rows;
  }

  function linkForm(n){
    const adaylar = (S.notes || []).filter(x => x.id !== n.id
      && !(n.links || []).some(l => l.to === x.id));
    if(!adaylar.length){
      return K.Notice({ tone:'info', body:'Bağlanacak başka not yok.' });
    }
    return html`
      <div class="linkform">
        ${K.Select({ id:'link-to', aria:'Bağlanacak not',
          options:adaylar.map(x => ({ value:x.id, label:x.text.slice(0, 60) })) })}
        ${K.Input({ id:'link-why', placeholder:'Neden bağlı? (bir cümle)',
          aria:'Bağın gerekçesi' })}
        ${K.Button({ label:'Bağla', tone:'primary', size:'sm', act:'do-link',
          data:{ 'data-id':n.id } })}
        ${K.Button({ label:'Vazgeç', size:'sm', act:'close-link' })}
      </div>`;
  }

  /* ------------------------------------------------------------------ matris */

  function matrixRows(){
    const ss = ESP.Intellect.syntopic();
    const oneri = ESP.Intellect.linkSuggestions(10);
    const bagsiz = ESP.Intellect.unlinkedNotes();

    /* Kavram × yazar matrisi: hangi kavramda kac yazar okunmus.
       Sentopik okuma AYNI SORUYU birden cok yazara sormaktir; matris bunu
       tek bakista gosterir. */
    const kavramlar = {};
    (S.notes || []).forEach(n => {
      const b = bookOf(n.bookId);
      (n.concepts || []).forEach(c => {
        kavramlar[c] = kavramlar[c] || { notes:0, authors:new Set() };
        kavramlar[c].notes++;
        if(b && b.author) kavramlar[c].authors.add(b.author);
      });
    });
    const kavramSatirlari = Object.keys(kavramlar)
      .map(c => ({ id:c, label:(ESP.CONCEPT_BY_ID[c] || {}).label || c,
        notes:kavramlar[c].notes, authors:kavramlar[c].authors.size }))
      .sort((a, b) => b.authors - a.authors || b.notes - a.notes);

    return [
      K.Entry({
        label:'Sentez katsayısı', hint:'ssk',
        meta:ss.cert === 'missing' ? 'veri yok'
          : U.fmtNum(Math.round(ss.value * 100) / 100),
        note:ss.cert === 'missing' ? (ss.why || 'Hesap için kaynak gerekir.')
          : ss.linked + ' bağlı not ÷ ' + ss.books + ' kaynak × log(1 + '
            + ss.authors + ' yazar)',
        body:ss.cert === 'missing'
          ? K.Notice({ tone:'info', body:ss.why
              || 'Not ve kaynak girildiğinde katsayı hesaplanmaya başlar.' })
          : html`
            ${K.Meter({ label:'Bağlanmış not oranı', value:ss.linkedRatio * 100,
              text:ss.linked + '/' + ss.total })}
            <p class="small muted mt-8">Formül tek yazarda sıfırlanmaz:
              log(1 + n) kullanılır. Bir kitabı derinlemesine analiz eden
              kullanıcı cezalandırılmaz.</p>`,
      }),

      K.Entry({
        label:'Bağ önerileri', hint:'syntopic',
        meta:oneri.length + ' öneri',
        note:'Sistem bağı KURMAZ, önerir. Bağın nedenini sen yazarsın; '
           + 'sistem nedeni uyduramaz.',
        wide:true,
        body:oneri.length
          ? html`${map(oneri, o => html`
              <div class="sugg">
                <div class="sugg__pair">
                  <p>${o.a.text}</p>
                  <span class="sugg__op" aria-hidden="true">${raw(ESP.UI.icon('bag'))}</span>
                  <p>${o.b.text}</p>
                </div>
                <div class="sugg__meta">
                  ${map(o.concepts, c => K.Chip({ label:(ESP.CONCEPT_BY_ID[c] || {}).label || c }))}
                  ${when(o.cross, () => K.Badge({ label:'farklı kaynak', tone:'info' }))}
                  ${K.Button({ label:'Bağla', size:'sm', act:'open-link',
                    data:{ 'data-id':o.a.id } })}
                </div>
              </div>`)}`
          : K.Empty({ text:bagsiz.length
              ? 'Ortak kavram bulunamadı. Notlara kavram etiketi eklemek öneri açar.'
              : 'Bağlanmamış not yok.' }),
      }),

      K.Entry({
        label:'Kavram matrisi',
        meta:kavramSatirlari.length + ' kavram',
        note:'Bir kavramda kaç ayrı yazar okunduğu, o kavramın ne kadar '
           + 'sentopik çalışıldığını söyler. Tek yazar bir başlangıçtır, '
           + 'bir eksiklik değil.',
        wide:true,
        body:kavramSatirlari.length
          ? K.Table({ tight:true,
              headers:['Kavram', { label:'Not', num:true }, { label:'Yazar', num:true }, ''],
              rows:kavramSatirlari.map(c => [
                c.label, String(c.notes), String(c.authors),
                K.Button({ label:'Notları gör', size:'sm', act:'filter-concept',
                  data:{ 'data-id':c.id } }),
              ]) })
          : K.Empty({ text:'Henüz kavram etiketli not yok.' }),
      }),
    ];
  }

  /* --------------------------------------------------------------- kaynaklar */

  /* Kitap başına ÖLÇÜLMÜŞ okuma (fikir 39): yalnız kitaba bağlanmış
     oturumlardan. Bağlı oturum yoksa «veri yok» — sıfır dakika değil. */
  function okumaHucresi(b){
    const o = M.kitapOkuma(b.id);
    if(!o) return html`<span class="tiny dim">veri yok</span>`;
    return html`<span class="num">${U.fmtMin(o.dakika)}</span>
      <div class="tiny dim">${o.oturum} oturum${o.sayfa != null ? ' · ' + o.sayfa + ' sayfa' : ''}
        · son ${U.fmtShort(o.sonGun)}${o.cert !== 'measured' ? ' · tahmin' : ''}</div>`;
  }

  /* Öğrendiğini anlat (core/anlat.js, fikir 42): sesle ya da yazıyla;
     kod yalnız kaynağın kavramlarından hangilerinin geçtiğini sayar. */
  function anlatEntry(){
    if(!ESP.Anlat) return '';
    const uygun = (S.books || []).filter(b => ESP.Anlat.kavramlar(b.id).length >= ESP.Anlat.EN_AZ_KAVRAM);
    const secili = uygun.find(b => b.id === S.ui.anlatKitap) || uygun[0] || null;
    const k = S.ui.anlatSonuc;
    const son = secili ? ESP.Anlat.son(secili.id) : null;
    return K.Entry({
      label:'Öğrendiğini anlat', meta:'sesle ya da yazıyla',
      note:'Kaynağı kendi sözünle anlat; notlarındaki kavramlardan hangilerinin geçtiği sayılır. '
         + 'Anlatım notlanmaz ve metni kaydedilmez.',
      wide:true,
      body:!uygun.length
        ? K.Empty({ text:'Notlarında en az ' + ESP.Anlat.EN_AZ_KAVRAM + ' kavram etiketi olan bir kaynak yok. '
            + 'Notlara kavram ekledikçe burası açılır.' })
        : html`
          <div class="row gap-8 wrap">
            ${K.Select({ id:'anlat-kitap', value:secili.id, aria:'Anlatılacak kaynak', change:'anlat-kitap',
              options:uygun.map(b => ({ value:b.id, label:(b.author ? b.author + ' — ' : '') + b.title })) })}
            <span class="tiny dim">${ESP.Anlat.kavramlar(secili.id).length} kavram</span>
          </div>
          <div class="row mt-10">
            ${K.Textarea({ id:'anlat-metin', rows:4, aria:'Anlatımın', value:S.ui.anlatMetin || '',
              placeholder:'Bu kaynaktan ne öğrendin? Kendi cümlelerinle anlat…' })}
            ${K.Mic({ target:'anlat-metin' })}
          </div>
          <div class="row wrap mt-10">
            ${K.Button({ label:'Ölç', tone:'primary', act:'anlat-olc' })}
            ${when(k && k.ok, () => K.Button({ label:'Sonucu kaydet', act:'anlat-kaydet' }))}
          </div>
          ${when(k && !k.ok, () => K.Notice({ tone:'info', class:'mt-10', body:k.why }))}
          ${when(k && k.ok, () => html`<div class="mt-10">
            <p class="small"><b>${k.gecen.length}/${k.toplam}</b> kavram anlatımında geçti · hesaplandı</p>
            ${when(k.gecmeyen.length, () => html`<p class="tiny dim">Geçmeyen: ${k.gecmeyen.join(', ')}</p>`)}
          </div>`)}
          ${when(son, () => html`<p class="tiny dim mt-6">Son anlatım ${U.fmtShort(son.gun)}:
            ${son.gecen}/${son.toplam} kavram</p>`)}`,
    });
  }

  function bookRows(){
    const kitaplar = S.books || [];
    const notSayisi = id => (S.notes || []).filter(n => n.bookId === id).length;

    return [
      K.Entry({
        label:'Kaynaklar', hint:'primary-text',
        meta:kitaplar.length + ' kayıt',
        note:'Primer metin sentez katsayısına girer, yorum girmez. '
           + 'Yoksa bir özet kitabı on filozof okumuş gibi görünürdü.',
        wide:true,
        body:kitaplar.length
          ? K.Table({ tight:true,
              headers:['Eser', 'Yazar', 'Tür', { label:'Not', num:true }, 'Okuma', 'Durum', ''],
              rows:kitaplar.map(b => [
                html`${b.title}${when(b.bam && b.bam.not, () => html`<div class="tiny dim">BAM · ${b.bam.not}</div>`)}`,
                b.author,
                b.kind === 'primary' ? 'primer' : 'yorum',
                String(notSayisi(b.id)),
                okumaHucresi(b),
                M.bookStatus(b).label,
                html`${K.Button({ label:M.bookStatus(b).action, size:'sm',
                    act:'toggle-book', data:{ 'data-id':b.id } })}
                  ${K.Button({ label:'Sil', size:'sm', act:'del-book2',
                    data:{ 'data-id':b.id } })}`,
              ]) })
          : K.Empty({ text:'Kaynak listesi boş. Sempozyum → Metinler sekmesinden '
              + 'kanondan da ekleyebilirsin.' }),
      }),

      anlatEntry(),

      K.Entry({
        label:'Okuma listesi iste', hint:'primary-text',
        meta:'okuma · HKM',
        note:'Konunun temel eserleri web kaynaklarından çıkarılır; yazar adı alıntıda doğrulanır. '
           + 'Eserler «başlanmadı» olarak gelir. Web kapalıysa liste yazılmaz.',
        body:html`<div class="row gap-8 wrap">
          ${K.Input({ id:'belge-okuma', placeholder:'Konu: Stoacılık, bilim tarihi…', aria:'Okuma konusu',
            size:'sm', class:'grow' })}
          ${K.Button({ label:'King’e ilet', size:'sm', act:'belge-iste',
            data:{ 'data-alan':'okuma' } })}
        </div>`,
      }),

      K.Entry({
        label:'Kaynak ekle',
        meta:'elle',
        body:html`
          <div class="cols-3">
            ${K.Field({ label:'Eser', input:K.Input({ id:'lb-title', placeholder:'Başlık' }) })}
            ${K.Field({ label:'Yazar', input:K.Input({ id:'lb-author', placeholder:'Yazar' }) })}
            ${K.Field({ label:'Tür', input:K.Select({ id:'lb-kind', value:'primary',
              options:[{ value:'primary', label:'Primer metin' },
                { value:'secondary', label:'Yorum' }] }) })}
          </div>
          ${K.Button({ label:'Ekle', act:'add-book2', class:'mt-10' })}`,
      }),
    ];
  }

  /* Konu haritası — bu bölümde nelerin çalışılacağı.

     İşaretler beyandır ve öyle etiketlenir; hiçbir kapıyı açmaz. */
  function topicRows(){
    const ozet = ESP.Lesson.topicSummary('reading');
    return [
      K.Entry({
        label:'Konular', hint:'topic',
        meta:ozet.topics + ' konu · ' + ozet.items + ' madde',
        note:'Konu listesi bir müfredattır, bir ölçüm değil. İşaretlediklerin '
           + '«beyan» olarak durur: hiçbir kapıyı açmaz, kademeyi değiştirmez.',
        wide:true,
        body:ESP.Parts.topics('reading'),
      }),
    ];
  }

  /* ------------------------------------------------------------------ çizim */

  /* Sekme yok (EKIP-PLANI §1.2): bölümler alt alta, tezgâh en sonda. */
  const GOVDE = { notlar:noteRows, matris:matrixRows, kaynaklar:bookRows, yontem:methodRows,
    ogren:topicRows };

  function render(){
    return K.Grid(html`
      ${K.Span(12, ESP.Parts.bolumler('reading', { act:'read-tab', aria:'Okuma bölümleri', tabs:TABS,
        govde:GOVDE, sayi:{ notlar:(S.notes || []).length || null } }))}`);
  }

  function afterRender(){ ESP.Parts.bolumIstegi('readTab', TABS[0].id); }

  function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  const handle = {
    async 'anlat-olc'(){
      const kitap = document.getElementById('anlat-kitap');
      const metin = document.getElementById('anlat-metin');
      const id = kitap ? kitap.value : null;
      if(!id) return;
      S.ui.anlatKitap = id;
      /* Ölçüm metni silmez: kullanıcı eksik kavramı ekleyip yeniden ölçebilir.
         Metin yalnız bellekte durur; depoya yazılmaz. */
      S.ui.anlatMetin = metin ? metin.value : '';
      S.ui.anlatSonuc = ESP.Anlat.kapsam(S.ui.anlatMetin, ESP.Anlat.kavramlar(id));
      ESP.App.render();
    },
    async 'anlat-kaydet'(){
      const r = await ESP.Anlat.kaydet(S.ui.anlatKitap, S.ui.anlatSonuc);
      ESP.UI.toast(r.ok ? 'Kaydedildi · yalnız kavram sayısı' : r.why);
      S.ui.anlatSonuc = null;
      S.ui.anlatMetin = '';
      ESP.App.render();
    },
    async 'belge-iste'(el){
      const k = document.getElementById('belge-' + el.dataset.alan);
      const r = await ESP.Belge.iste({ alan:el.dataset.alan, konu:k ? k.value : '' });
      ESP.UI.toast(r.metin);
      if(r.ok) ESP.App.render();
    },
    async 'read-tab'(el){ K.bolumeGit(el.dataset.tab); },

    async 'add-note'(){
      const t = val('note-text');
      if(!t){ ESP.UI.toast('Not boş'); return; }
      const kavramlar = ESP.Parse.extractConcepts(t).map(c => c.id);
      await M.saveNote(M.newNote({ text:t, bookId:val('note-book') || null,
        concepts:kavramlar }));
      ESP.Memo.bitir();
      ESP.UI.toast(kavramlar.length
        ? 'Not eklendi · ' + kavramlar.length + ' kavram bulundu'
        : 'Not eklendi · kavram bulunamadı');
      ESP.App.render();
    },

    async 'del-note'(el){
      await M.deleteNote(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'open-link'(el){
      S.ui.linkFrom = el.dataset.id;
      S.ui.readTab = 'notlar';
      ESP.App.render();
    },
    async 'close-link'(){ S.ui.linkFrom = null; ESP.App.render(); },

    async 'do-link'(el){
      const to = val('link-to'), why = val('link-why');
      const res = await M.linkNotes(el.dataset.id, to, why);
      if(!res.ok){ ESP.UI.toast(res.error); return; }
      S.ui.linkFrom = null;
      ESP.Memo.bitir();
      ESP.UI.toast('Bağ kuruldu');
      ESP.App.render();
    },

    async 'unlink'(el){
      await M.unlinkNotes(el.dataset.a, el.dataset.b);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'filter-concept'(el){
      S.ui.conceptFilter = el.dataset.id;
      S.ui.readTab = 'notlar';
      ESP.App.render();
    },
    async 'clear-concept'(){ S.ui.conceptFilter = null; ESP.App.render(); },

    async 'add-book2'(){
      const t = val('lb-title');
      if(!t){ ESP.UI.toast('Eser adı gerekir'); return; }
      await M.saveBook(M.newBook({ title:t, author:val('lb-author'),
        kind:val('lb-kind') || 'primary' }));
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'del-book2'(el){
      await M.deleteBook(el.dataset.id);
      ESP.Memo.bitir();
      ESP.App.render();
    },

    async 'toggle-book'(el){
      const b = bookOf(el.dataset.id);
      if(!b) return;
      /* Başlanmamış kitapta ilk dokunuş «Başla»dır, «Bitir» değil. */
      if(!b.startedAt && !b.finishedAt) b.startedAt = U.todayISO();
      else b.finishedAt = b.finishedAt ? null : U.todayISO();
      await M.saveBook(b);
      ESP.Memo.bitir();
      ESP.App.render();
    },
  };

  const change = {
    async 'note-query'(el){ S.ui.noteQuery = el.value; ESP.App.render(); },
    async 'anlat-kitap'(el){ S.ui.anlatKitap = el.value; S.ui.anlatSonuc = null; S.ui.anlatMetin = ''; ESP.App.render(); },
  };

  return {
    id:'library',
    title:'Kütüphane',
    headline(){
      const ss = ESP.Intellect.syntopic();
      if(!ss.total) return 'Henüz atomik not yok.';
      const bagsiz = ss.total - ss.linked;
      if(bagsiz >= 3) return bagsiz + ' not hiçbir yere bağlı değil.';
      const oneri = ESP.Intellect.linkSuggestions(1);
      if(oneri.length) return 'İki not aynı kavramda buluşuyor.';
      return ss.linked + ' not bağlı.';
    },
    lede(){
      return 'Kaç sayfa okuduğun değil, kaç bağ kurduğun sayılır. '
           + 'Bağlanmamış not henüz sermaye değildir.';
    },
    stats(){
      const ss = ESP.Intellect.syntopic();
      return [
        { value:String(ss.total), label:'not' },
        { value:String(ss.linked), label:'bağlı' },
        { value:String(ss.books), label:'kaynak' },
        { value:ss.cert === 'missing' ? '—' : U.fmtNum(Math.round(ss.value * 100) / 100),
          label:'SSK' },
      ];
    },
    subtitle(){ return (S.notes || []).length + ' not · ' + (S.books || []).length + ' kaynak'; },
    actions(){ return ''; },
    render, afterRender, handle, change,
  };
})();
