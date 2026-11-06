/* Kütüphane — atomik not, sentopik matris ve kaynaklar.

   Üç sekme: Notlar · Matris · Kaynaklar.

   Tek kural: BİR NOT BİR FİKİR. İki fikir taşıyan not hiçbir yere
   bağlanamaz, çünkü hangi fikirle bağlandığı belirsizdir.

   Sistem bağ KURMAZ, bağ ÖNERİR: iki notun ortak kavramı varsa satır düşer,
   bağın nedenini kullanıcı yazar. Nedeni uydurmak, uydurulmuş sayı kadar
   zararlıdır — matris görünür ama anlamsız olur. */
window.LIFEOS.PARCA.yazilar({
  'esp.library.ne-yapilir':'Ne yapılır',
  'esp.library.ne-zaman':'Ne zaman',
  'esp.library.suzgece-uyan-not-yok':'Süzgece uyan not yok.',
  'esp.library.henuz-atomik-not-yok-okudugu':'Henüz atomik not yok. Okuduğun tek bir fikri tek cümleyle yaz.',
  'esp.library.yalniz-son':'Yalnız son ',
  'esp.library.tumu':'Tümü · ',
  'esp.library.baglanacak-baska-not-yok':'Bağlanacak başka not yok.',
  'esp.library.not-ve-kaynak-girildiginde-k':'Not ve kaynak girildiğinde katsayı hesaplanmaya başlar.',
  'esp.library.ortak-kavram-bulunamadi-notl':'Ortak kavram bulunamadı. Notlara kavram etiketi eklemek öneri açar.',
  'esp.library.baglanmamis-not-yok':'Bağlanmamış not yok.',
  'esp.library.notlara-kavram-ekledikce-bur':'Notlara kavram ekledikçe burası açılır.',
  'esp.library.kaydedildi-yalniz-kavram-say':'Kaydedildi · yalnız kavram sayısı',
  'esp.library.not-eklendi':'Not eklendi · ',
  'esp.library.not-eklendi-kavram-bulunamad':'Not eklendi · kavram bulunamadı',
  'esp.library.kullanicinin-bir-kaynaktan-a':'Kullanıcının bir kaynaktan aldığı notları üç maddeye indir. Yalnız notlarda geçen bilgiyi kullan; ',
  'esp.library.henuz-atomik-not-yok':'Henüz atomik not yok.',
  'esp.library.i-ki-not-ayni-kavramda-bulus':'İki not aynı kavramda buluşuyor.',
  'esp.library.kac-sayfa-okudugun-degil-kac':'Kaç sayfa okuduğun değil, kaç bağ kurduğun sayılır. ',
  'esp.library.baglanmamis-not-henuz-sermay':'Bağlanmamış not henüz sermaye değildir.',
});


window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'esp', sira:60, id:'act:note', kind:'Eylem', label:'Atomik not ekle',
  hint:'Okuma', run:() => { ESP.S.ui.readTab = 'notlar'; ESP.App.go('library');
    setTimeout(() => { const el = document.getElementById('note-text'); if(el) el.focus(); }, 160); } });
window.LIFEOS.PARCA.yazilar({
  'esp.library.notlar':'Notlar',
  'esp.library.not-ve-kitap':'Not ve kitap',
  'esp.library.calis':'Çalış',
  'esp.library.ilerleme':'İlerleme',
  'esp.library.ilk-not':'Okuduğun bir fikri yaz',
  'esp.library.ilk-not-neden':'Tek fikir, tek cümle yeter.',
  'esp.library.not-yaz':'Not yaz',
  'esp.library.bagsiz-not':'not henüz bağlanmadı',
  'esp.library.bagsiz-neden':'Bir notu başka bir nota bağla.',
  'esp.library.notlara-git':'Notlara git',
  'esp.library.kaynaklar':'Kaynaklar',
  'esp.library.yontem':'Yöntem',
  'esp.library.ogren':'Öğren',
  'esp.library.dort-duzey':'Dört düzey',
  'esp.library.analitik-okumanin-dort-sorus':'Analitik okumanın dört sorusu',
  'esp.library.okuma-protokolu':'Okuma protokolü',
  'esp.library.not-sablonlari':'Not şablonları',
  'esp.library.birakma-izni':'Bırakma izni',
  'esp.library.not-ekle':'Not ekle',
  'esp.library.atomik-not-metni':'Atomik not metni',
  'esp.library.ozgurluk-secenek-coklugu-deg':'Özgürlük, seçenek çokluğu değil seçebilme kapasitesidir.',
  'esp.library.notun-kaynagi':'Notun kaynağı',
  'esp.library.kaynak-sec-istege-bagli':'Kaynak seç (isteğe bağlı)',
  'esp.library.notu-ekle':'Notu ekle',
  'esp.library.bagli-notlar':'Bağlı notlar',
  'esp.library.not-ara':'Not ara…',
  'esp.library.not-ara-2':'Not ara',
  'esp.library.suzgeci-kaldir':'Süzgeci kaldır',
  'esp.library.bag':'bağ',
  'esp.library.bagla':'Bağla',
  'esp.library.sil':'Sil',
  'esp.library.kaldir':'Kaldır',
  'esp.library.baglanacak-not':'Bağlanacak not',
  'esp.library.neden-bagli-bir-cumle':'Neden bağlı? (bir cümle)',
  'esp.library.bagin-gerekcesi':'Bağın gerekçesi',
  'esp.library.vazgec':'Vazgeç',
  'esp.library.sentez-katsayisi':'Sentez katsayısı',
  'esp.library.baglanmis-not-orani':'Bağlanmış not oranı',
  'esp.library.bag-onerileri':'Bağ önerileri',
  'esp.library.farkli-kaynak':'farklı kaynak',
  'esp.library.kavram-matrisi':'Kavram matrisi',
  'esp.library.not':'Not',
  'esp.library.yazar':'Yazar',
  'esp.library.notlari-gor':'Notları gör',
  'esp.library.henuz-kavram-etiketli-not-yo':'Henüz kavram etiketli not yok.',
  'esp.library.veri-yok':'veri yok',
  'esp.library.son':'· son',
  'esp.library.ogrendigini-anlat':'Öğrendiğini anlat',
  'esp.library.notlarinda-en-az':'Notlarında en az ',
  'esp.library.anlatilacak-kaynak':'Anlatılacak kaynak',
  'esp.library.anlatimin':'Anlatımın',
  'esp.library.bu-kaynaktan-ne-ogrendin-ken':'Bu kaynaktan ne öğrendin? Kendi cümlelerinle anlat…',
  'esp.library.olc':'Ölç',
  'esp.library.sonucu-kaydet':'Sonucu kaydet',
  'esp.library.kavram-anlatiminda-gecti-hes':'kavram anlatımında geçti · hesaplandı',
  'esp.library.gecmeyen':'Geçmeyen:',
  'esp.library.son-anlatim':'Son anlatım',
  'esp.library.not-2':'not · ',
  'esp.library.raf':'Raf',
  'esp.library.ozet':'Özet',
  'esp.library.alinti':'Alıntı',
  'esp.library.bam':'BAM ·',
  'esp.library.notlarini-ozetle':'Notlarını özetle',
  'esp.library.kaynak-listesi-bos-sempozyum':'Kaynak listesi boş. Felsefe › Öğren bölümünden ',
  'esp.library.okuma-listesi-iste':'Okuma listesi iste',
  'esp.library.konu-stoacilik-bilim-tarihi':'Konu: Stoacılık, bilim tarihi…',
  'esp.library.okuma-konusu':'Okuma konusu',
  'esp.library.king-e-ilet':'King’e ilet',
  'esp.library.kaynak-ekle':'Kaynak ekle',
  'esp.library.eser':'Eser',
  'esp.library.baslik':'Başlık',
  'esp.library.sayfa':'Sayfa',
  'esp.library.tur':'Tür',
  'esp.library.primer-metin':'Primer metin',
  'esp.library.yorum':'Yorum',
  'esp.library.ekle':'Ekle',
  'esp.library.konular':'Konular',
  'esp.library.okuma-bolumleri':'Okuma bölümleri',
  'esp.library.not-bos':'Not boş',
  'esp.library.bag-kuruldu':'Bağ kuruldu',
  'esp.library.ozet-icin-bu-kaynagin-en':'Özet için bu kaynağın en az üç notu gerekir.',
  'esp.library.model-bagli-degil-ozet-yalni':'Model bağlı değil; özet yalnız model açıkken çıkarılır.',
  'esp.library.notlarin-ozetleniyor':'Notların özetleniyor…',
  'esp.library.kaynak':'Kaynak: ',
  'esp.library.model-ciktisi-denetimden-gec':'Model çıktısı denetimden geçmedi; özet yazılmadı.',
  'esp.library.ozet-alinamadi':'Özet alınamadı: ',
  'esp.library.eser-adi-gerekir':'Eser adı gerekir',
  'esp.library.kutuphane':'Kütüphane',
  'esp.library.bagli':'bağlı',
  'esp.library.ssk':'SSK',
});
window.LIFEOS.PARCA.sayfa({ id:'library', modul:'esp', king:{ sira:190, ad:'Okuma', es:['okuma', 'kitap', 'kütüphane'] }, cekmece:'calisma', ad:'Okuma', ikon:'book', ek:{ disc:'reading' }, sira:50 });

ESP.Screens.library = (function(){
  const U = ESP.U, M = ESP.Model, S = ESP.S;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;

  const TABS = [
    { id:'calis',     label:yz('esp.library.calis') },
    { id:'notlar',    label:yz('esp.library.not-ve-kitap') },
    { id:'ogren',     label:yz('esp.library.ogren') },
    { id:'ilerleme',  label:yz('esp.library.ilerleme') },
  ];

  /* ----------------------------------------------------------------- yöntem

     «Okudum» cümlesi ölçülebilir bir şey söylemez: göz gezdirmek de
     okumaktır, bir bölümü üç kez dönüp çıkarmak da. Bu sekme ikisini ayıran
     dili tutar. */
  function methodRows(){
    return [
      K.Entry({
        label:yz('esp.library.dort-duzey'), hint:'reading-level',
        meta:ESP.READING_LEVELS.length + ' düzey',
        wide:true,
        body:K.Table({ tight:true,
          headers:[{ label:'#', num:true }, 'Düzey', 'Sorusu', 'Not'],
          rows:ESP.READING_LEVELS.map(l => [String(l.rank), l.label, l.q, l.note]) }),
      }),

      K.Entry({
        label:yz('esp.library.analitik-okumanin-dort-sorus'), hint:'analytic',
        meta:'kitap bitince',
        wide:true,
        body:html`${map(ESP.ANALYTIC_QUESTIONS, q => html`
          <div class="toolrow">
            <b>${q.q}</b>
            <span class="tiny dim">${q.note}</span>
          </div>`)}`,
      }),

      K.Entry({
        label:yz('esp.library.okuma-protokolu'), hint:'protocol',
        meta:ESP.READING_PROTOCOL.length + ' adım',
        body:K.Table({ tight:true, headers:[{ label:'#', num:true }, 'Adım', yz('esp.library.ne-yapilir')],
          rows:ESP.READING_PROTOCOL.map(p => [String(p.step), p.label, p.do]) }),
      }),

      K.Entry({
        label:yz('esp.library.not-sablonlari'), hint:'note-template',
        meta:ESP.NOTE_TEMPLATES.length + ' şablon',
        wide:true,
        body:K.Table({ tight:true, headers:['Şablon', 'Biçim', yz('esp.library.ne-zaman')],
          rows:ESP.NOTE_TEMPLATES.map(t => [t.label, t.form, t.use]) }),
      }),

      K.Entry({
        label:yz('esp.library.birakma-izni'), hint:'abandon',
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
        label:yz('esp.library.not-ekle'), hint:'atomic-note',
        meta:'tek fikir, tek cümle',
        body:html`
          ${K.Textarea({ id:'note-text', rows:2, aria:yz('esp.library.atomik-not-metni'),
            placeholder:yz('esp.library.ozgurluk-secenek-coklugu-deg') })}
          <div class="row gap-8 mt-10">
            <div class="grow">${K.Select({ id:'note-book', value:'', aria:yz('esp.library.notun-kaynagi'),
              options:[{ value:'', label:yz('esp.library.kaynak-sec-istege-bagli') }]
                .concat((S.books || []).map(b => ({ value:b.id, label:b.author + ' — ' + b.title }))) })}</div>
            ${K.Button({ label:yz('esp.library.notu-ekle'), tone:'primary', act:'add-note' })}
          </div>`,
      }),
    ];

    if(!hepsi.length){
      rows.push(K.Entry({ label:yz('esp.library.notlar'), meta:'yok',
        body:K.Empty({ text:q || kavram ? yz('esp.library.suzgece-uyan-not-yok')
          : yz('esp.library.henuz-atomik-not-yok-okudugu') }) }));
      return rows;
    }

    const bagHtml = bagli();
    if(bagHtml) rows.push(K.Entry({ label:yz('esp.library.bagli-notlar'), meta:'en çok bağı olan', body:raw(bagHtml) }));
    /* iPhone Faz 2c: uzun liste kısa gelir — en yeni beş not + «Tümü».
       Arama ya da kavram süzgeci açıkken liste kesilmez (aranan bulunur). */
    const suzgec = !!(q || kavram);
    const tumu = suzgec || !!S.ui.notTumu;
    const gosterilen = tumu ? hepsi : hepsi.slice(0, NOT_ILK);
    rows.push(K.Entry({
      label:yz('esp.library.notlar'),
      meta:hepsi.length + ' not' + (kavram ? ' · ' + (ESP.CONCEPT_BY_ID[kavram] || {}).label : ''),
      action:html`${K.Input({ id:'note-q', value:S.ui.noteQuery || '',
          placeholder:yz('esp.library.not-ara'), change:'note-query', size:'sm', aria:yz('esp.library.not-ara-2') })}
        ${when(kavram, () => K.Button({ label:yz('esp.library.suzgeci-kaldir'), size:'sm', act:'clear-concept' }))}`,
      wide:true,
      body:html`${raw(notSuzgec(hepsi.length))}${map(gosterilen, n => {
        const kitap = bookOf(n.bookId);
        return html`
          <div class="noterow">
            <p class="noterow__text">${n.text}</p>
            <div class="noterow__meta">
              ${when(kitap, () => html`<span class="tiny dim">${kitap.author} · ${kitap.title}</span>`)}
              ${map(n.concepts, c => K.Button({ size:'sm', act:'filter-concept',
                label:(ESP.CONCEPT_BY_ID[c] || {}).label || c, data:{ 'data-id':c } }))}
              <span class="tiny dim">${(n.links || []).length} ${yz('esp.library.bag')}</span>
              ${K.Button({ label:yz('esp.library.bagla'), size:'sm', tone:'ghost', act:'open-link', data:{ 'data-id':n.id } })}
              ${K.Button({ label:yz('esp.library.sil'), size:'sm', tone:'ghost', class:'noterow__sil', act:'del-note', data:{ 'data-id':n.id } })}
            </div>
            ${when(S.ui.linkFrom === n.id, () => linkForm(n))}
            ${when((n.links || []).length, () => html`
              <ul class="noterow__links">${map(n.links, l => {
                const hedef = (S.notes || []).find(x => x.id === l.to);
                return html`<li>
                  <span>${hedef ? hedef.text : '(silinmiş not)'}</span>
                  ${when(l.why, () => html`<em>${l.why}</em>`)}
                  ${K.Button({ label:yz('esp.library.kaldir'), size:'sm', act:'unlink',
                    data:{ 'data-a':n.id, 'data-b':l.to } })}
                </li>`;
              })}</ul>`)}
          </div>`;
      })}
      ${when(!suzgec && hepsi.length > NOT_ILK, () => K.Button({ size:'sm', tone:'ghost', act:'not-tumu', class:'mt-8',
        label:S.ui.notTumu ? yz('esp.library.yalniz-son') + NOT_ILK : yz('esp.library.tumu') + hepsi.length + ' not' }))}`,
    }));

    return rows;
  }
  const NOT_ILK = 5;

  function linkForm(n){
    const adaylar = (S.notes || []).filter(x => x.id !== n.id
      && !(n.links || []).some(l => l.to === x.id));
    if(!adaylar.length){
      return K.Notice({ tone:'info', body:yz('esp.library.baglanacak-baska-not-yok') });
    }
    return html`
      <div class="linkform">
        ${K.Select({ id:'link-to', aria:yz('esp.library.baglanacak-not'),
          options:adaylar.map(x => ({ value:x.id, label:x.text.slice(0, 60) })) })}
        ${K.Input({ id:'link-why', placeholder:yz('esp.library.neden-bagli-bir-cumle'),
          aria:yz('esp.library.bagin-gerekcesi') })}
        ${K.Button({ label:yz('esp.library.bagla'), tone:'primary', size:'sm', act:'do-link',
          data:{ 'data-id':n.id } })}
        ${K.Button({ label:yz('esp.library.vazgec'), size:'sm', act:'close-link' })}
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
        label:yz('esp.library.sentez-katsayisi'), hint:'ssk',
        meta:ss.cert === 'missing' ? 'veri yok'
          : U.fmtNum(Math.round(ss.value * 100) / 100),
        /* Eksikken gerekçe aşağıdaki kutuda bir kez yazılır (eskiden not
           olarak ikinci kez); hesaplanınca not, formülün kendi değerleridir. */
        note:ss.cert === 'missing' ? null
          : ss.linked + ' bağlı not ÷ ' + ss.books + ' kaynak × log(1 + '
            + ss.authors + ' yazar)',
        body:ss.cert === 'missing'
          ? K.Notice({ tone:'info', body:ss.why
              || yz('esp.library.not-ve-kaynak-girildiginde-k') })
          : html`
            ${K.Meter({ label:yz('esp.library.baglanmis-not-orani'), value:ss.linkedRatio * 100,
              text:ss.linked + '/' + ss.total })}`,
      }),

      K.Entry({
        label:yz('esp.library.bag-onerileri'), hint:'syntopic',
        meta:oneri.length + ' öneri',
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
                  ${when(o.cross, () => K.Badge({ label:yz('esp.library.farkli-kaynak'), tone:'info' }))}
                  ${K.Button({ label:yz('esp.library.bagla'), size:'sm', act:'open-link',
                    data:{ 'data-id':o.a.id } })}
                </div>
              </div>`)}`
          : K.Empty({ text:bagsiz.length
              ? yz('esp.library.ortak-kavram-bulunamadi-notl')
              : yz('esp.library.baglanmamis-not-yok') }),
      }),

      K.Entry({
        label:yz('esp.library.kavram-matrisi'), hint:'kavram-matrisi',
        meta:kavramSatirlari.length + ' kavram',
        wide:true,
        body:kavramSatirlari.length
          ? K.Table({ tight:true,
              headers:['Kavram', { label:yz('esp.library.not'), num:true }, { label:yz('esp.library.yazar'), num:true }, ''],
              rows:kavramSatirlari.map(c => [
                c.label, String(c.notes), String(c.authors),
                K.Button({ label:yz('esp.library.notlari-gor'), size:'sm', act:'filter-concept',
                  data:{ 'data-id':c.id } }),
              ]) })
          : K.Empty({ text:yz('esp.library.henuz-kavram-etiketli-not-yo') }),
      }),
    ];
  }

  /* --------------------------------------------------------------- kaynaklar */

  /* Kitap başına ÖLÇÜLMÜŞ okuma (fikir 39): yalnız kitaba bağlanmış
     oturumlardan. Bağlı oturum yoksa «veri yok» — sıfır dakika değil. */
  function okumaHucresi(b){
    const o = M.kitapOkuma(b.id);
    if(!o) return html`<span class="tiny dim">${yz('esp.library.veri-yok')}</span>`;
    /* 095: sayfa sayısı yazılı ve okunan sayfa ölçülmüşse ince ilerleme. */
    const il = M.okumaIlerlemesi && M.okumaIlerlemesi(b);
    if(il && VT()) return raw(VT().okumaIlerlemesi({ ad:b.title, alt:il.okunan + ' / ' + il.toplam + ' sayfa · ' + U.fmtMin(o.dakika),
      oran:il.oran, kalanDk:il.kalanDk, kalanAd:'kalan' }));
    return html`<span class="num">${U.fmtMin(o.dakika)}</span>
      <div class="tiny dim">${o.oturum} oturum${o.sayfa != null ? ' · ' + o.sayfa + ' sayfa' : ''}
        ${yz('esp.library.son')} ${U.fmtShort(o.sonGun)}${o.cert !== 'measured' ? ' · tahmin' : ''}</div>`;
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
      label:yz('esp.library.ogrendigini-anlat'), hint:'anlat', meta:'sesle ya da yazıyla',
      wide:true,
      body:!uygun.length
        ? K.Empty({ text:yz('esp.library.notlarinda-en-az') + ESP.Anlat.EN_AZ_KAVRAM + ' kavram etiketi olan bir kaynak yok. '
            + yz('esp.library.notlara-kavram-ekledikce-bur') })
        : html`
          <div class="row gap-8 wrap">
            ${K.Select({ id:'anlat-kitap', value:secili.id, aria:yz('esp.library.anlatilacak-kaynak'), change:'anlat-kitap',
              options:uygun.map(b => ({ value:b.id, label:(b.author ? b.author + ' — ' : '') + b.title })) })}
            <span class="tiny dim">${ESP.Anlat.kavramlar(secili.id).length} kavram</span>
          </div>
          <div class="row mt-10">
            ${K.Textarea({ id:'anlat-metin', rows:4, aria:yz('esp.library.anlatimin'), value:S.ui.anlatMetin || '',
              placeholder:yz('esp.library.bu-kaynaktan-ne-ogrendin-ken') })}
            ${K.Mic({ target:'anlat-metin' })}
          </div>
          <div class="row wrap mt-10">
            ${K.Button({ label:yz('esp.library.olc'), tone:'primary', act:'anlat-olc' })}
            ${when(k && k.ok, () => K.Button({ label:yz('esp.library.sonucu-kaydet'), act:'anlat-kaydet' }))}
          </div>
          ${when(k && !k.ok, () => K.Notice({ tone:'info', class:'mt-10', body:k.why }))}
          ${when(k && k.ok, () => html`<div class="mt-10">
            <p class="small"><b>${k.gecen.length}/${k.toplam}</b> ${yz('esp.library.kavram-anlatiminda-gecti-hes')}</p>
            ${when(k.gecmeyen.length, () => html`<p class="tiny dim">${yz('esp.library.gecmeyen')} ${k.gecmeyen.join(', ')}</p>`)}
          </div>`)}
          ${when(son, () => html`<p class="tiny dim mt-6">${yz('esp.library.son-anlatim')} ${U.fmtShort(son.gun)}:
            ${son.gecen}/${son.toplam} kavram</p>`)}`,
    });
  }

  /* ---------- E · vitrin kartları (brand/ortak/vitrin.js) ---------- */
  const VT = () => (window.LIFEOS || {}).VITRIN;
  /* 020 etkin süzgeç: kavram ve arama çip olur. */
  function notSuzgec(n){
    if(!VT()) return '';
    const c = [];
    if(S.ui.conceptFilter) c.push({ ad:(ESP.CONCEPT_BY_ID[S.ui.conceptFilter] || {}).label || S.ui.conceptFilter, modul:'esp', act:'clear-concept' });
    if((S.ui.noteQuery || '').trim()) c.push({ ad:'«' + S.ui.noteQuery.trim() + '»', act:'clear-note-query' });
    return c.length ? '<div class="mb-12">' + VT().suzgecCipleri({ cipler:c, sonuc:n, birim:'not', temizle:{ act:'clear-note-filters' } }) + '</div>' : '';
  }

  /* 094 KÜTÜPHANE RAFI: sayfa sayısı tutulmadığı için sırtlar eşit kalın;
     okunan oran yalnız BİTEN kitapta bilinir (%100), okunanda çizgi yok. */
  function raf(kitaplar){
    if(!VT() || !kitaplar.length) return '';
    return VT().kutuphaneRafi({ not:'kalınlık tutulmuyor', kitaplar:kitaplar.slice(0, 12).map(b => {
      const st = M.bookStatus(b);
      return { ad:b.title, durum:st.label, on:st.id === 'okunuyor', oran:st.id === 'bitti' ? 100 : null };
    }) });
  }

  /* 096 ALINTI KARTI ve 104 BAĞLI NOTLAR: kaynağa bağlı en yeni not ve
     en çok bağı olan not. Not metni kullanıcının; bağ sayısı kayıttan. */
  function alinti(){
    if(!VT()) return '';
    const n = (S.notes || []).filter(x => x.bookId && bookOf(x.bookId)).slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0];
    if(!n) return '';
    const b = bookOf(n.bookId);
    return VT().alintiKarti({ metin:n.text, kaynak:b.title + (b.author ? ' · ' + b.author : '') });
  }
  function bagli(){
    if(!VT()) return '';
    const n = (S.notes || []).filter(x => (x.links || []).length).slice().sort((a, b) => (b.links || []).length - (a.links || []).length)[0];
    if(!n) return '';
    const baslik = (n.concepts || []).map(c => (ESP.CONCEPT_BY_ID[c] || {}).label).filter(Boolean)[0] || 'Not';
    const baglar = (n.links || []).map(l => { const x = (S.notes || []).find(y => y.id === l.to); return x ? String(x.text).slice(0, 40) : null; }).filter(Boolean);
    const kitap = bookOf(n.bookId);
    if(kitap) baglar.unshift(kitap.title);
    return VT().bagliNotlar({ baslik, ust:yz('esp.library.not-2') + U.fmtShort(ESP.U.gunOf(n.createdAt || '')), metin:n.text, baglar });
  }

  /* 109 ÜÇ MADDE ÖZETİ: model açıkken, bir kaynağın EN AZ ÜÇ notundan.
     Model yalnız senin notlarını üç cümleye indirir; notlarda olmayan bir
     sayı yazarsa özet atılır (sayıyı model üretmez, AGENTS §1.1). Etiketi
     «model özeti · kontrol et»: tahmindir. Desteye eklenmez — ESP destesi
     dil destesidir; not defteri de özet kabul etmez (tek fikir, tek cümle). */
  const OZET_AJAN = 'aristoteles';
  function ozetHazir(){ return !!(ESP.Office && ESP.Office.ready && ESP.Office.ready(OZET_AJAN)); }
  function ozetDogrula(metin, notlar){
    let o;
    try{ o = JSON.parse(String(metin || '').replace(/^[^{]*/, '').replace(/[^}]*$/, '')); }catch(e){ return null; }
    const m = (o && Array.isArray(o.maddeler) ? o.maddeler : []).map(x => String(x || '').trim()).filter(Boolean);
    if(m.length < 1 || m.length > 3 || m.some(x => x.length > 200)) return null;
    const kaynak = notlar.join(' ');
    const sayilar = m.join(' ').match(/\d+(?:[.,]\d+)?/g) || [];
    if(sayilar.some(n => kaynak.indexOf(n) < 0)) return null;
    return m;
  }
  function ozetKarti(){
    const o = S.ui.ozet;
    const b = o && bookOf(o.bookId);
    if(!b || !VT() || !(o.maddeler || []).length) return '';
    return VT().ucMaddeOzet({ baslik:b.title, kaynak:o.notSayisi + ' notundan', maddeler:o.maddeler });
  }

  function bookRows(){
    const kitaplar = S.books || [];
    const notSayisi = id => (S.notes || []).filter(n => n.bookId === id).length;
    const rafHtml = raf(kitaplar), alintiHtml = alinti();
    const ozetHtml = ozetKarti(), model = ozetHazir();

    return [
      when(rafHtml, () => K.Entry({ label:yz('esp.library.raf'), meta:kitaplar.length + ' kitap', body:raw(rafHtml) })),
      when(ozetHtml, () => K.Entry({ label:yz('esp.library.ozet'), meta:'model · tahmin', body:raw(ozetHtml) })),
      when(alintiHtml, () => K.Entry({ label:yz('esp.library.alinti'), meta:'son not', body:raw(alintiHtml) })),
      K.Entry({
        label:yz('esp.library.kaynaklar'), hint:'primary-text',
        meta:kitaplar.length + ' kayıt',
        wide:true,
        body:kitaplar.length
          ? K.Table({ tight:true,
              headers:['Eser', 'Yazar', 'Tür', { label:yz('esp.library.not'), num:true }, 'Okuma', 'Durum', ''],
              rows:kitaplar.map(b => [
                html`${b.title}${when(b.bam && b.bam.not, () => html`<div class="tiny dim">${yz('esp.library.bam')} ${b.bam.not}</div>`)}`,
                b.author,
                b.kind === 'primary' ? 'primer' : 'yorum',
                String(notSayisi(b.id)),
                okumaHucresi(b),
                M.bookStatus(b).label,
                html`${when(model && notSayisi(b.id) >= 3, () => K.Button({ label:yz('esp.library.notlarini-ozetle'), size:'sm',
                    act:'ozet-iste', data:{ 'data-id':b.id } }))}
                  ${K.Button({ label:M.bookStatus(b).action, size:'sm',
                    act:'toggle-book', data:{ 'data-id':b.id } })}
                  ${K.Button({ label:yz('esp.library.sil'), size:'sm', act:'del-book2',
                    data:{ 'data-id':b.id } })}`,
              ]) })
          : K.Empty({ text:yz('esp.library.kaynak-listesi-bos-sempozyum')
              + 'kanondan da ekleyebilirsin.' }),
      }),

      anlatEntry(),

      K.Entry({
        label:yz('esp.library.okuma-listesi-iste'), hint:'belge',
        meta:'okuma · HKM',
        body:html`<div class="row gap-8 wrap">
          ${K.Input({ id:'belge-okuma', placeholder:yz('esp.library.konu-stoacilik-bilim-tarihi'), aria:yz('esp.library.okuma-konusu'),
            size:'sm', class:'grow' })}
          ${K.Button({ label:yz('esp.library.king-e-ilet'), size:'sm', act:'belge-iste',
            data:{ 'data-alan':'okuma' } })}
        </div>`,
      }),

      K.Entry({
        label:yz('esp.library.kaynak-ekle'),
        meta:'elle',
        body:html`
          <div class="cols-3">
            ${K.Field({ label:yz('esp.library.eser'), input:K.Input({ id:'lb-title', placeholder:yz('esp.library.baslik') }) })}
            ${K.Field({ label:yz('esp.library.yazar'), input:K.Input({ id:'lb-author', placeholder:yz('esp.library.yazar') }) })}
            ${K.Field({ label:yz('esp.library.sayfa'), hint:'isteğe bağlı', input:K.Input({ id:'lb-pages', type:'number', numeric:true, min:1, placeholder:'320' }) })}
            ${K.Field({ label:yz('esp.library.tur'), input:K.Select({ id:'lb-kind', value:'primary',
              options:[{ value:'primary', label:yz('esp.library.primer-metin') },
                { value:'secondary', label:yz('esp.library.yorum') }] }) })}
          </div>
          ${K.Button({ label:yz('esp.library.ekle'), act:'add-book2', class:'mt-10' })}`,
      }),
    ];
  }

  /* Konu haritası — bu bölümde nelerin çalışılacağı.

     İşaretler beyandır ve öyle etiketlenir; hiçbir kapıyı açmaz. */
  function topicRows(){
    const ozet = ESP.Lesson.topicSummary('reading');
    return [
      K.Entry({
        label:yz('esp.library.konular'), hint:'topic',
        meta:ozet.topics + ' konu · ' + ozet.items + ' madde',
        wide:true,
        body:ESP.Parts.topics('reading'),
      }),
    ];
  }

  /* ------------------------------------------------------------------ çizim */

  /* Sekme yok (EKIP-PLANI §1.2): bölümler alt alta, tezgâh en sonda. */
  /* Çalış: hiç not yoksa ilk adım, bağsız not varsa onlar, yoksa yeni not. Sayılar kayıttan. */
  function calisRows(){
    const notlar = S.notes || [];
    const bagsiz = notlar.filter(n => !(n.links || []).length).length;
    return [].concat([ESP.Parts.simdi('reading', bagsiz
        ? { baslik:bagsiz + ' ' + yz('esp.library.bagsiz-not'), neden:yz('esp.library.bagsiz-neden'), dugme:{ label:yz('esp.library.notlara-git'), act:'tab-not' } }
        : { baslik:yz('esp.library.ilk-not'), neden:yz('esp.library.ilk-not-neden'), dugme:{ label:yz('esp.library.not-yaz'), act:'tab-not' } })],
      notlar.length ? [ESP.Parts.recete('reading', { kunyesiz:true })] : [], [ESP.Parts.desk('reading')]);
  }
  const GOVDE = { calis:calisRows, notlar:() => [].concat(noteRows(), matrixRows(), bookRows()),
    ogren:() => [].concat(topicRows(), methodRows()), ilerleme:() => [ESP.Parts.yol('reading')] };

  /* PANO KARTI (2026-10-20, üçüncü tur): bu yıl biten kitaplar (yıldız,
     en az biri bittiyse) ve aylara göre dağılımı. */
  function PanoOkuma(){
    const P = (window.LIFEOS || {}).PANO;
    if(!P) return '';
    const yil = U.todayISO().slice(0, 4);
    const biten = (S.books || []).filter(b => b.finishedAt && String(b.finishedAt).slice(0, 4) === yil);
    if(!biten.length) return '';
    const ay = new Array(Number(U.todayISO().slice(5, 7))).fill(null);
    biten.forEach(b => { const i = Number(String(b.finishedAt).slice(5, 7)) - 1; if(i < ay.length) ay[i] = (ay[i] || 0) + 1; });
    const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const son = biten.slice().sort((a, b) => String(b.finishedAt).localeCompare(String(a.finishedAt)))[0];
    return P.izgara([P.kart({ tur:'biten-kitaplar', ad:yil + '’de biten kitaplar', yildiz:biten.length + ' kitap',
      govde:P.deger(String(biten.length), 'kitap', 'son biten: ' + son.title)
        + P.sutun({ degerler:ay, yukseklik:40, gunler:ay.map((x, i) => AY[i]), etiket:yil + ' yılında ' + biten.length + ' kitap bitti' }) })], 'pk-izgara--iki');
  }

  LIFEOS.PARCA.blok({ id:'library.okuma-sekmeleri', sayfa:'library', yer:'y1', sira:10, ad:'Okuma sekmeleri', ciz(){
    return K.Span(12, ESP.Parts.bolumler({ act:'read-tab', aria:yz('esp.library.okuma-bolumleri'), tabs:TABS,
        govde:GOVDE, sayi:{ notlar:(S.notes || []).length || null },
        ust:{ ilerleme:() => LIFEOS.PARCA.yer('library', 'ilerleme', K, undefined, raw) } }));
  } });
  LIFEOS.PARCA.blok({ id:'library.okuma-panosu', sayfa:'library', yer:'ilerleme', sira:10, ad:'Okuma panosu', ciz(){
    return raw(PanoOkuma());
  } });
  function render(){
    return K.Grid(html`
      ${LIFEOS.PARCA.yer('library', 'y1', K, undefined, typeof raw === 'undefined' ? null : raw)}`);
  }

  function afterRender(){ ESP.Parts.bolumIstegi('readTab', TABS[0].id); }

  function val(id){ const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  const handle = {
    async 'not-tumu'(){ S.ui.notTumu = !S.ui.notTumu; ESP.App.render(); },
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
      ESP.UI.toast(r.ok ? yz('esp.library.kaydedildi-yalniz-kavram-say') : r.why);
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
    async 'tab-not'(){ S.ui.readTab = 'notlar'; ESP.App.render(); },

    async 'add-note'(){
      const t = val('note-text');
      if(!t){ ESP.UI.toast(yz('esp.library.not-bos')); return; }
      const kavramlar = ESP.Parse.extractConcepts(t).map(c => c.id);
      await M.saveNote(M.newNote({ text:t, bookId:val('note-book') || null,
        concepts:kavramlar }));
      ESP.Memo.bitir();
      ESP.UI.toast(kavramlar.length
        ? yz('esp.library.not-eklendi') + kavramlar.length + ' kavram bulundu'
        : yz('esp.library.not-eklendi-kavram-bulunamad'));
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
      ESP.UI.toast(yz('esp.library.bag-kuruldu'));
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
    async 'clear-note-query'(){ S.ui.noteQuery = ''; ESP.App.render(); },
    async 'clear-note-filters'(){ S.ui.noteQuery = ''; S.ui.conceptFilter = null; ESP.App.render(); },

    async 'ozet-iste'(el){
      const b = bookOf(el.dataset.id);
      const notlar = (S.notes || []).filter(n => n.bookId === (b && b.id)).map(n => String(n.text || ''));
      if(!b || notlar.length < 3){ ESP.UI.toast(yz('esp.library.ozet-icin-bu-kaynagin-en')); return; }
      if(!ozetHazir()){ ESP.UI.toast(yz('esp.library.model-bagli-degil-ozet-yalni')); return; }
      ESP.UI.toast(yz('esp.library.notlarin-ozetleniyor'));
      try{
        const r = await ESP.Office.tamamla(OZET_AJAN, {
          system:yz('esp.library.kullanicinin-bir-kaynaktan-a')
            + 'yorum, dış bilgi ve yeni sayı ekleme. Türkçe, her madde tek cümle. '
            + 'ÇIKTI yalnız JSON: {"maddeler":["…","…","…"]}',
          messages:[{ role:'user', text:yz('esp.library.kaynak') + b.title + '\nNotlar:\n- ' + notlar.slice(0, 40).join('\n- ') }],
          temperature:0.2, maxTokens:400 });
        const m = ozetDogrula(r && r.text, notlar);
        if(!m){ ESP.UI.toast(yz('esp.library.model-ciktisi-denetimden-gec')); return; }
        S.ui.ozet = { bookId:b.id, maddeler:m, notSayisi:notlar.length };
        ESP.App.render();
      }catch(e){
        ESP.UI.toast(yz('esp.library.ozet-alinamadi') + (ESP.LLM.errorText ? ESP.LLM.errorText(e) : 'bağlantı hatası'));
      }
    },
    async 'add-book2'(){
      const t = val('lb-title');
      if(!t){ ESP.UI.toast(yz('esp.library.eser-adi-gerekir')); return; }
      const sayfa = Math.round(Number(val('lb-pages')));
      await M.saveBook(M.newBook({ title:t, author:val('lb-author'),
        kind:val('lb-kind') || 'primary', pages:sayfa > 0 && sayfa < 20000 ? sayfa : null }));
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
    /* iPhone Faz 2c: Kaynaklar'da raf (listenin görseli) ve okuma listesi
       isteği, Yöntem'in beş başvuru kartı şerit — dokununca açılır. */
    kucukVarsayilan:['uzman-masası', 'yol-haritası', 'sentez-katsayısı', 'bağ-önerileri', 'kavram-matrisi', 'kaynaklar', 'kaynak-ekle', 'raf', 'okuma-listesi-iste', 'dört-düzey', 'analitik-okumanın-dört-sorusu',
      'okuma-protokolü', 'not-şablonları', 'bırakma-izni'],
    title:yz('esp.library.kutuphane'),
    headline(){
      const ss = ESP.Intellect.syntopic();
      if(!ss.total) return yz('esp.library.henuz-atomik-not-yok');
      const bagsiz = ss.total - ss.linked;
      if(bagsiz >= 3) return bagsiz + ' not hiçbir yere bağlı değil.';
      const oneri = ESP.Intellect.linkSuggestions(1);
      if(oneri.length) return yz('esp.library.i-ki-not-ayni-kavramda-bulus');
      return ss.linked + ' not bağlı.';
    },
    lede(){
      return yz('esp.library.kac-sayfa-okudugun-degil-kac')
           + yz('esp.library.baglanmamis-not-henuz-sermay');
    },
    stats(){
      const ss = ESP.Intellect.syntopic();
      return [
        { value:String(ss.total), label:'not' },
        { value:String(ss.linked), label:yz('esp.library.bagli') },
        { value:String(ss.books), label:'kaynak' },
        { value:ss.cert === 'missing' ? '—' : U.fmtNum(Math.round(ss.value * 100) / 100),
          label:yz('esp.library.ssk') },
      ];
    },
    subtitle(){ return (S.notes || []).length + ' not · ' + (S.books || []).length + ' kaynak'; },
    actions(){ return ''; },
    ozetDogrula, render, afterRender, handle, change,
  };
})();
