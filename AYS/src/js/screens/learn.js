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
window.LIFEOS.PARCA.komut({ modul:'ays', sira:70, group:'Git', label:'Öğrenme — video ve ders notu', icon:'play', route:'learn', run(){ R.App.go('learn'); } });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:230, group:'Kayıt', label:'Ders ekle (video / not)', icon:'plus', route:'learn', run(){ R.App.go('learn'); setTimeout(()=>R.Screens.learn.handle['note-new']({dataset:{}}), 60); } });
window.LIFEOS.PARCA.yazilar({
  'ays.learn.bu-tarayici-ses-tanimayi-des':'Bu tarayıcı ses tanımayı desteklemiyor',
  'ays.learn.ses-alinamadi':'Ses alınamadı',
  'ays.learn.ses-tanima-baslatilamadi':'Ses tanıma başlatılamadı',
  'ays.learn.tumu':'Tümü',
  'ays.learn.devam-eden':'Devam eden',
  'ays.learn.bitmis':'Bitmiş',
  'ays.learn.ders':'— ders —',
  'ays.learn.once-ders-sec':'— önce ders seç —',
  'ays.learn.konu':'— konu —',
  'ays.learn.metin-var':'metin var',
  'ays.learn.bu-suzgece-uyan-ders-yok':'Bu süzgece uyan ders yok.',
  'ays.learn.suzgeci-sifirla':'Süzgeci sıfırla',
  'ays.learn.henuz-ders-eklenmedi-bir-vid':'Henüz ders eklenmedi. Bir video izlerken buraya zaman damgalı not düşersin; ',
  'ays.learn.i-lk-dersi-ekle':'İlk dersi ekle',
  'ays.learn.ders-suzgeci':'Ders süzgeci',
  'ays.learn.derslerde-ve-notlarda-ara':'Derslerde ve notlarda ara…',
  'ays.learn.derslerde-ara':'derslerde ara',
  'ays.learn.ders-2':'Ders',
  'ays.learn.not':'Not',
  'ays.learn.kart':'Kart',
  'ays.learn.nasil-calisir':'Nasıl çalışır?',
  'ays.learn.dort-adim-tek-yolculuk':'Dört adım, tek yolculuk',
  'ays.learn.videoyu-ekle-dersi-ve-konuyu':'Videoyu ekle, dersi ve konuyu bağla.',
  'ays.learn.i-zlerken-durakla':'İzlerken durakla,',
  'ays.learn.ve-tek-cumle-not-dus':'ve tek cümle not düş.',
  'ays.learn.notu-etiketle-kural-ornek-tu':'Notu etiketle: kural, örnek, tuzak, soru.',
  'ays.learn.kart-yap-ile-notu-tekrar':'“Kart yap” ile notu tekrar takvimine sok (1g→3g→1h→1a).',
  'ays.learn.transcript-otomatik-cekilmez':'Transcript otomatik çekilmez; istersen metni yapıştırabilirsin. Zaman damgası elle girilir ya da çalışan bloğun sayacından önerilir.',
  'ays.learn.gomulu-oynatici-yok':'Gömülü oynatıcı yok.',
  'ays.learn.bu-baglanti-taninan-bir-vide':'Bu bağlantı tanınan bir video sağlayıcısına ait değil.',
  'ays.learn.videoyu-tarayicida-ac':'Videoyu tarayıcıda aç',
  'ays.learn.not-editoru-yine-de-calisir':'Not editörü yine de çalışır.',
  'ays.learn.video-acilmiyorsa':'Video açılmıyorsa',
  'ays.learn.tarayicida-ac':'tarayıcıda aç',
  'ays.learn.not-almaya-buradan-devam':'— not almaya buradan devam edebilirsin.',
  'ays.learn.kart-yap':'Kart yap',
  'ays.learn.notu-sil':'notu sil',
  'ays.learn.not-al':'Not al',
  'ays.learn.durakla-tek-cumle-yaz-uzun':'Durakla, tek cümle yaz. Uzun not değil, geri çağırmayı tetikleyen cümle.',
  'ays.learn.zaman':'Zaman',
  'ays.learn.zaman-damgasi':'zaman damgası',
  'ays.learn.etiket':'Etiket',
  'ays.learn.or-paydayi-esitlemeden-sadel':'ör. paydayı eşitlemeden sadeleştirme yapılmaz',
  'ays.learn.ekle':'Ekle',
  'ays.learn.kalip':'Kalıp:',
  'ays.learn.calisan-blogun-sayaci':'Çalışan bloğun sayacı',
  'ays.learn.gosteriyor-zaman-alani-bunun':'gösteriyor; zaman alanı bununla dolduruldu, değiştirebilirsin.',
  'ays.learn.dersler':'Dersler',
  'ays.learn.devam-ediyor':'devam ediyor',
  'ays.learn.dersi-sil':'dersi sil',
  'ays.learn.notlar':'Notlar',
  'ays.learn.tumunden-kart-uret':'Tümünden kart üret',
  'ays.learn.henuz-not-yok-videoyu-durakl':'Henüz not yok. Videoyu durakla, zaman ve tek cümle gir.',
  'ays.learn.ders-baglantisi':'Ders bağlantısı',
  'ays.learn.not-hangi-konuya-ait':'Not hangi konuya ait?',
  'ays.learn.baslik':'Başlık',
  'ays.learn.or-paragrafta-ana-dusunce':'ör. Paragrafta ana düşünce',
  'ays.learn.konu-2':'Konu',
  'ays.learn.kaynak-turu':'Kaynak türü',
  'ays.learn.video':'Video',
  'ays.learn.kitap-pdf':'Kitap / PDF',
  'ays.learn.canli-ders':'Canlı ders',
  'ays.learn.seri':'Seri',
  'ays.learn.or-paragraf-kampi':'ör. Paragraf kampı',
  'ays.learn.kaynak-sayfa':'Kaynak / sayfa',
  'ays.learn.or-345-tyt-matematik-s-128':'ör. 345 TYT Matematik s.128',
  'ays.learn.video-baglantisi':'Video bağlantısı',
  'ays.learn.ofisten-kart-uret':'Ofisten kart üret',
  'ays.learn.notlardan-geri-cagirma-karti':'Notlardan geri çağırma kartı önerir; sen onaylarsın',
  'ays.learn.ajan-yalniz-metin-onerir-kar':'Ajan yalnız metin önerir. Kart nesnesini kural motoru kurar: aşama 0, ilk tekrar yarın, konu bu derse bağlı.',
  'ays.learn.kart-onerileri-getir':'Kart önerileri getir',
  'ays.learn.metin-transcript':'Metin (transcript)',
  'ays.learn.altyazi-metnini-buraya-yapis':'Altyazı metnini buraya yapıştır (isteğe bağlı)',
  'ays.learn.video-suresi-dk':'Video süresi (dk)',
  'ays.learn.cumlelere-bol':'Cümlelere böl',
  'ays.learn.bu-dersten-uretilen-kartlar':'Bu dersten üretilen kartlar',
  'ays.learn.tekrar-ekranina-git':'Tekrar ekranına git',
  'ays.learn.once-metni-yapistir':'Önce metni yapıştır',
  'ays.learn.bolunecek-cumle-bulunamadi':'Bölünecek cümle bulunamadı',
  'ays.learn.bolunen-cumleler':'Bölünen cümleler',
  'ays.learn.vazgec':'Vazgeç',
  'ays.learn.secilenleri-ekle':'Seçilenleri ekle',
  'ays.learn.ders-ekle':'Ders ekle',
  'ays.learn.video-baglantisi-istege-bagl':'Video bağlantısı isteğe bağlı — not almaya hemen başlayabilirsin',
  'ays.learn.ekle-ve-ac':'Ekle ve aç',
  'ays.learn.baslik-veya-baglanti-gir':'Başlık veya bağlantı gir',
  'ays.learn.baglanti-http-ya-da-https':'Bağlantı http:// ya da https:// ile başlamalı',
  'ays.learn.ders-eklendi':'Ders eklendi',
  'ays.learn.ders-silindi':'Ders silindi',
  'ays.learn.not-bos-olamaz':'Not boş olamaz',
  'ays.learn.zaman-mm-ss-biciminde-olmali':'Zaman "mm:ss" biçiminde olmalı',
  'ays.learn.not-zayif':'Not zayıf.',
  'ays.learn.not-eklendi':'Not eklendi · ',
  'ays.learn.kart-olusturuldu-yarin-tekra':'Kart oluşturuldu · yarın tekrar',
  'ays.learn.notlar-okunuyor':'Notlar okunuyor…',
  'ays.learn.10-60-sn':'(10–60 sn)',
  'ays.learn.onerilen-kartlar':'Önerilen kartlar',
  'ays.learn.oneriyi-cikar':'öneriyi çıkar',
  'ays.learn.hepsini-ekle':'Hepsini ekle',
  'ays.learn.oneri-cikarildi':'Öneri çıkarıldı',
  'ays.learn.eklenecek-kart-yok':'Eklenecek kart yok',
  'ays.learn.ogrenme':'Öğrenme',
});
window.LIFEOS.PARCA.sayfa({ id:'learn', modul:'ays', cekmece:'ogren', ad:'Ders notları', ikon:'play', sira:50 });

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
    if(!Rec){ UI.toast(yz('ays.learn.bu-tarayici-ses-tanimayi-des')); return; }
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
      recognition.onerror = () => { listening = false; UI.toast(yz('ays.learn.ses-alinamadi')); R.App.render(); };
      recognition.start();
      listening = true;
      R.App.render();
    }catch(e){ listening = false; UI.toast(yz('ays.learn.ses-tanima-baslatilamadi')); }
  }

  const FILTERS = [
    { value:'all',  label:yz('ays.learn.tumu') },
    { value:'open', label:yz('ays.learn.devam-eden') },
    { value:'done', label:yz('ays.learn.bitmis') },
  ];

  function openNote(){
    return S.ui.noteOpen ? S.videoNotes.find(n => n.id === S.ui.noteOpen) : null;
  }

  function subjectOptions(){
    return [{ value:'', label:yz('ays.learn.ders') }].concat(R.SUBJECTS.map(s => ({ value:s.id, label:s.name })));
  }
  function topicOptions(subjectId){
    const s = R.SUBJECTS.find(x => x.id === subjectId);
    if(!s) return [{ value:'', label:yz('ays.learn.once-ders-sec') }];
    return [{ value:'', label:yz('ays.learn.konu') }].concat(s.topics.map(t => ({ value:t.id, label:t.order+'. '+t.name })));
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
            ${when(note.transcript, () => K.Badge({ label:yz('ays.learn.metin-var'), tone:'muted' }))}</div>
          <div class="tiny dim">${meta}</div>
        </div>
        <span class="tiny dim">${U.fmtShort(R.U.gunOf(note.createdAt))}</span>
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
          : K.Empty({ icon:'search', text:yz('ays.learn.bu-suzgece-uyan-ders-yok'),
              action:K.Button({ label:yz('ays.learn.suzgeci-sifirla'), size:'sm', act:'learn-reset' }) }))
      : K.Empty({ icon:'play',
          text:yz('ays.learn.henuz-ders-eklenmedi-bir-vid')
             + 'not konuya bağlanır ve oradan tekrar kartına dönüşür.',
          action:K.Button({ label:yz('ays.learn.i-lk-dersi-ekle'), icon:'plus', tone:'primary', act:'note-new' }) });

    /* Kitaplık boşken süzgeç, arama ve üç «0» boş durumun tekrarıydı
       (2026-10-07 tasarım turu): boşken yalnız boş durum durur. */
    const bos = !S.videoNotes.length;
    return K.Grid([
      K.Span(8, K.Stack([
        when(!bos, () => K.Row([
          K.Segmented({ items:FILTERS, value:filter, act:'learn-filter', aria:yz('ays.learn.ders-suzgeci') }),
          K.Input({ class:'input--search', placeholder:yz('ays.learn.derslerde-ve-notlarda-ara'),
            value:S.ui.learnQuery || '', aria:yz('ays.learn.derslerde-ara'),
            change:'learn-search', data:{ 'data-debounce':220 } }),
        ], { between:true, wrap:true })),
        K.Card({ body }),
      ])),
      K.Span(4, K.Stack([
        when(!bos, () => K.Cols(3, [
          K.Stat({ label:yz('ays.learn.ders-2'), value:U.fmtNum(S.videoNotes.length) }),
          K.Stat({ label:yz('ays.learn.not'), value:U.fmtNum(totalSegs) }),
          K.Stat({ label:yz('ays.learn.kart'), value:U.fmtNum(noteCards), tone:noteCards ? 'ok' : null }),
        ])),
        K.Card({ title:yz('ays.learn.nasil-calisir'), sub:yz('ays.learn.dort-adim-tek-yolculuk'), body:html`
          <ol class="bullets small muted">
            <li>${yz('ays.learn.videoyu-ekle-dersi-ve-konuyu')}</li>
            <li>${yz('ays.learn.i-zlerken-durakla')} <b>mm:ss</b> ${yz('ays.learn.ve-tek-cumle-not-dus')}</li>
            <li>${yz('ays.learn.notu-etiketle-kural-ornek-tu')}</li>
            <li>${yz('ays.learn.kart-yap-ile-notu-tekrar')}</li>
          </ol>
          <p class="tiny dim mt-10">${yz('ays.learn.transcript-otomatik-cekilmez')}</p>` }),
        raw(UI.rail(['recall', 'srs', 'closure'])),
      ])),
    ]);
  }

  /* ---------- oynatici ---------- */

  function player(note){
    if(note.provider !== 'youtube' || !note.videoId){
      return K.Notice({ tone:'info', title:yz('ays.learn.gomulu-oynatici-yok'),
        body:html`${yz('ays.learn.bu-baglanti-taninan-bir-vide')}
          ${when(note.url, () => html`<a href="${note.url}" target="_blank" rel="noopener">${yz('ays.learn.videoyu-tarayicida-ac')}</a>.`)}
          ${yz('ays.learn.not-editoru-yine-de-calisir')}` });
    }
    const src = 'https://www.youtube-nocookie.com/embed/' + note.videoId + '?rel=0&modestbranding=1';
    return html`
      <div class="player">
        <iframe class="player__frame" src="${src}" title="${note.title || 'Ders videosu'}"
          loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture"
          referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>
      <p class="tiny dim mt-6">${yz('ays.learn.video-acilmiyorsa')}
        <a href="${M.tsUrl(note, 0)}" target="_blank" rel="noopener">${yz('ays.learn.tarayicida-ac')}</a> ${yz('ays.learn.not-almaya-buradan-devam')}</p>`;
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
          ${K.Button({ label:yz('ays.learn.kart-yap'), size:'sm', act:'note-seg-card', data:{ 'data-i':i } })}
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:yz('ays.learn.notu-sil'),
            act:'note-seg-del', data:{ 'data-i':i } })}
        </div>
      </div>`;
  }

  function editor(note){
    const sug = suggestedTs();
    const tag = S.ui.noteTag || 'not';
    const tmpl = R.NOTE_TEMPLATES[tag] || R.NOTE_TEMPLATES.not;
    return K.Card({
      title:yz('ays.learn.not-al'), hint:'notebook',
      sub:yz('ays.learn.durakla-tek-cumle-yaz-uzun'),
      actions:when(window.SpeechRecognition || window.webkitSpeechRecognition,
        () => K.Button({ label:listening ? 'Dinleniyor…' : 'Sesle yaz', icon:'zap', size:'sm',
          tone:listening ? 'primary' : null, act:'note-voice' })),
      body:html`
        <div class="noteform">
          ${K.Field({ label:yz('ays.learn.zaman'), hint:note.source === 'kitap' ? 'sayfa' : 'mm:ss',
            input:K.Input({ id:'nf-ts', placeholder:note.source === 'kitap' ? '' : '12:30',
              aria:yz('ays.learn.zaman-damgasi'), value:sug == null ? '' : M.fmtTs(sug) }) })}
          ${K.Field({ label:yz('ays.learn.etiket'),
            input:K.Select({ id:'nf-tag', options:TAG_OPTIONS, value:tag, change:'note-tag' }) })}
          ${K.Field({ label:yz('ays.learn.not'), input:K.Input({ id:'nf-text',
            placeholder:yz('ays.learn.or-paydayi-esitlemeden-sadel') }) })}
          ${K.Button({ label:yz('ays.learn.ekle'), icon:'plus', tone:'primary', act:'note-seg-add' })}
        </div>

        <div class="row wrap gap-6 mt-8">
          <span class="tiny dim">${yz('ays.learn.kalip')}</span>
          ${map(tmpl, t => K.Chip({ label:t, act:'note-template', data:{ 'data-t':t } }))}
        </div>

        <div id="note-quality"></div>

        ${when(sug != null, () => html`<p class="tiny dim mt-6">${yz('ays.learn.calisan-blogun-sayaci')}
          ${M.fmtTs(sug)} ${yz('ays.learn.gosteriyor-zaman-alani-bunun')}</p>`)}`,
    });
  }

  function detailView(note){
    const segs = note.segments.slice().sort((a, b) => a.ts - b.ts);
    const cards = S.cards.filter(c => c.source === 'note' && c.sourceRef === note.id);

    return K.Grid([
      K.Span(12, K.Row([
        K.Button({ label:yz('ays.learn.dersler'), icon:'left', size:'sm', tone:'ghost', act:'note-back' }),
        html`<div class="row-sm">
          ${note.done ? K.Badge({ label:'bitti', tone:'ok' }) : K.Badge({ label:yz('ays.learn.devam-ediyor'), tone:'muted' })}
          ${K.Button({ label:note.done ? 'Yeniden aç' : 'Bitti işaretle', size:'sm', act:'note-toggle-done' })}
          ${K.IconButton({ icon:'trash', size:'sm', aria:yz('ays.learn.dersi-sil'), act:'note-delete', data:{ 'data-id':note.id } })}
        </div>`,
      ], { between:true, wrap:true })),

      K.Span(7, K.Stack([
        K.Card({ title:note.title || 'Adsız ders', sub:topicLabel(note), body:player(note) }),
        editor(note),
        K.Card({
          title:yz('ays.learn.notlar'), sub:U.plural(segs.length, 'kayıt', 'kayıt'),
          actions:when(segs.length, () => K.Button({ label:yz('ays.learn.tumunden-kart-uret'), icon:'cards',
            size:'sm', act:'note-cards-all' })),
          body:segs.length
            ? html`<div class="seglist">${map(segs, (s, i) => segmentRow(note, s, note.segments.indexOf(s)))}</div>`
            : K.Empty({ icon:'edit', text:yz('ays.learn.henuz-not-yok-videoyu-durakl') }),
        }),
      ])),

      K.Span(5, K.Stack([
        K.Card({ title:yz('ays.learn.ders-baglantisi'), sub:yz('ays.learn.not-hangi-konuya-ait'), body:html`
          ${K.Field({ label:yz('ays.learn.baslik'), input:K.Input({ id:'nd-title', value:note.title,
            placeholder:yz('ays.learn.or-paragrafta-ana-dusunce'), change:'note-title' }) })}
          ${K.Cols(2, [
            K.Field({ label:yz('ays.learn.ders-2'), input:K.Select({ id:'nd-subject', options:subjectOptions(),
              value:note.subjectId || '', change:'note-subject' }) }),
            K.Field({ label:yz('ays.learn.konu-2'), input:K.Select({ id:'nd-topic', options:topicOptions(note.subjectId),
              value:note.topicId || '', change:'note-topic' }) }),
          ])}
          ${K.Cols(2, [
            K.Field({ label:yz('ays.learn.kaynak-turu'), input:K.Select({ id:'nd-source', change:'note-source',
              value:note.source || 'video',
              options:[{ value:'video', label:yz('ays.learn.video') }, { value:'kitap', label:yz('ays.learn.kitap-pdf') },
                { value:'ders', label:yz('ays.learn.canli-ders') }] }) }),
            K.Field({ label:yz('ays.learn.seri'), hint:'aynı seriyi bir arada tut',
              input:K.Input({ id:'nd-series', value:note.series, placeholder:yz('ays.learn.or-paragraf-kampi'),
                change:'note-series' }) }),
          ])}
          ${note.source === 'kitap'
            ? K.Field({ label:yz('ays.learn.kaynak-sayfa'), input:K.Input({ id:'nd-page', value:note.page,
                placeholder:yz('ays.learn.or-345-tyt-matematik-s-128'), change:'note-page' }) })
            : K.Field({ label:yz('ays.learn.video-baglantisi'), hint:'YouTube bağlantısı gömülü açılır',
                input:K.Input({ id:'nd-url', value:note.url, placeholder:'https://…', change:'note-url' }) })}` }),

        when(R.Office.mode() === 'llm' && note.segments.length, () => K.Card({
          title:yz('ays.learn.ofisten-kart-uret'), sub:yz('ays.learn.notlardan-geri-cagirma-karti'),
          body:html`
            <p class="small muted">${yz('ays.learn.ajan-yalniz-metin-onerir-kar')}</p>
            ${K.Button({ label:yz('ays.learn.kart-onerileri-getir'), icon:'zap', tone:'primary', block:true,
              class:'mt-10', act:'note-ai-cards', data:{ 'data-id':note.id } })}
            <div id="ai-cards"></div>` })),

        K.Collapsible({
          title:yz('ays.learn.metin-transcript'), meta:note.transcript ? U.fmtNum(note.transcript.length)+' karakter' : 'boş',
          act:'note-toggle-transcript', open:!!S.ui.transcriptOpen,
          body:html`
            ${K.Notice({ tone:'info', body:'Otomatik çekilmez. Videonun altyazısını kopyalayıp buraya '
              + 'yapıştır; sistem cümlelere bölüp zaman damgası önerir, sen onaylarsın.' })}
            ${K.Textarea({ id:'nd-transcript', rows:8, value:note.transcript,
              placeholder:yz('ays.learn.altyazi-metnini-buraya-yapis'), change:'note-transcript' })}
            ${when(note.transcript, () => K.Row([
              K.Field({ label:yz('ays.learn.video-suresi-dk'), input:K.Input({ id:'nd-dur', type:'number',
                numeric:true, class:'input--cell', placeholder:'—' }) }),
              K.Button({ label:yz('ays.learn.cumlelere-bol'), icon:'zap', tone:'primary', class:'mt-12',
                act:'note-split' }),
            ], { wrap:true }))}`,
        }),

        when(cards.length, () => K.Card({ title:yz('ays.learn.bu-dersten-uretilen-kartlar'), sub:U.plural(cards.length, 'kart', 'kart'),
          body:html`<div class="stack-xs">${map(cards.slice(0, 8), c => html`
            <div class="row between"><span class="small truncate">${c.front}</span>
              <span class="tiny dim">${U.fmtShort(c.dueAt)}</span></div>`)}</div>
            ${K.Button({ label:yz('ays.learn.tekrar-ekranina-git'), size:'sm', class:'mt-10', act:'go',
              data:{ 'data-route':'cards' } })}` })),
      ])),
    ]);
  }

  LIFEOS.PARCA.blok({ id:'learn.detay', sayfa:'learn', yer:'ana', ad:'Ders notu', kosul:() => !!openNote(), ciz:() => detailView(openNote()) });
  LIFEOS.PARCA.blok({ id:'learn.liste', sayfa:'learn', yer:'ana', ad:'Ders notları', kosul:() => !openNote(), ciz:() => listView() });
  async function render(){ return String(LIFEOS.PARCA.yer('learn', 'ana', R.C)); }

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
      if(!note || !note.transcript){ UI.toast(yz('ays.learn.once-metni-yapistir')); return; }
      const durEl = document.getElementById('nd-dur');
      const secs = durEl && durEl.value ? Number(durEl.value) * 60 : null;
      const parts = M.splitTranscript(note.transcript, secs);
      if(!parts.length){ UI.toast(yz('ays.learn.bolunecek-cumle-bulunamadi')); return; }
      pendingSplit = parts;
      UI.sheet({
        title:yz('ays.learn.bolunen-cumleler'), subtitle:parts.length+' öneri · onayladıkların not olur', wide:true,
        body:String(K.Stack([
          K.Notice({ tone:'info', body:'Zaman damgaları tahmindir. Video süresini girdiysen '
            + 'orantılı dağıtıldı; girmediysen cümle uzunluğuna göre yerleştirildi.' }),
          html`<div class="stack-xs">${map(parts, (x, i) => html`
            <label class="check">
              <input type="checkbox" checked data-split="${i}"/>
              <span><b class="tiny num">${M.fmtTs(x.ts)}</b> · ${x.text}</span>
            </label>`)}</div>`,
        ])),
        footer:String(html`${K.Button({ label:yz('ays.learn.vazgec'), act:'sheet-close' })}
          ${K.Button({ label:yz('ays.learn.secilenleri-ekle'), tone:'primary', act:'note-split-apply' })}`),
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

    /* Öğren › Anlatım «Ders notu ekle» seçili konuyu dataset ile verir
       (screens/ogren.js ogren-not): ders ve konu seçili gelir. */
    async 'note-new'(el){
      const ds = (el && el.dataset) || {};
      const onDers = R.SUBJECTS.some(x => x.id === ds.subject) ? ds.subject : '';
      const onKonu = onDers && (R.SUBJECTS.find(x => x.id === onDers).topics || []).some(t => t.id === ds.topic) ? ds.topic : '';
      UI.sheet({
        title:yz('ays.learn.ders-ekle'), subtitle:yz('ays.learn.video-baglantisi-istege-bagl'),
        body:String(K.Stack([
          K.Field({ label:yz('ays.learn.baslik'), input:K.Input({ id:'nn-title', placeholder:yz('ays.learn.or-paragrafta-ana-dusunce') }) }),
          K.Field({ label:yz('ays.learn.video-baglantisi'), hint:'YouTube bağlantısı gömülü açılır',
            input:K.Input({ id:'nn-url', placeholder:'https://www.youtube.com/watch?v=…' }) }),
          K.Cols(2, [
            K.Field({ label:yz('ays.learn.ders-2'), input:K.Select({ id:'nn-subject', options:subjectOptions(), value:onDers }) }),
            K.Field({ label:yz('ays.learn.konu-2'), input:K.Select({ id:'nn-topic', options:topicOptions(onDers || null), value:onKonu }) }),
          ]),
          K.Notice({ tone:'info', body:'Transcript otomatik çekilmez. İzlerken durakla, '
            + 'zaman damgası ve tek cümle notla ilerle.' }),
        ])),
        footer:String(html`${K.Button({ label:yz('ays.learn.vazgec'), act:'sheet-close' })}
          ${K.Button({ label:yz('ays.learn.ekle-ve-ac'), tone:'primary', act:'note-create' })}`),
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
      if(!note.title && !note.url){ UI.toast(yz('ays.learn.baslik-veya-baglanti-gir')); return; }
      if(note.url && !/^https?:\/\//i.test(note.url)){ UI.toast(yz('ays.learn.baglanti-http-ya-da-https')); return; }
      await M.saveVideoNote(note);
      UI.closeSheet();
      S.ui.noteOpen = note.id;
      UI.toast(yz('ays.learn.ders-eklendi'));
      R.App.render();
    },
    async 'note-delete'(el){
      const id = el.dataset.id;
      const notSay = ((S.videoNotes || []).find(n => n.id === id) || { segments:[] }).segments.length;
      UI.confirmSheet('Dersi sil', 'Bu ders ve altındaki notlar silinecek. Üretilmiş tekrar kartları kalır.', async () => {
        await M.deleteVideoNote(id);
        S.ui.noteOpen = null;
        UI.closeSheet();
        UI.toast(yz('ays.learn.ders-silindi'));
        R.App.render();
      }, true, notSay ? 'Dersi ve ' + notSay + ' notu sil' : 'Dersi sil');
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
      if(!text){ UI.toast(yz('ays.learn.not-bos-olamaz')); return; }
      const ts = M.parseTs(tsEl ? tsEl.value : '');
      if(ts == null){ UI.toast(yz('ays.learn.zaman-mm-ss-biciminde-olmali')); return; }

      const q = M.noteQuality(text);
      if(!q.ok){
        const box = document.getElementById('note-quality');
        if(box) box.innerHTML = String(html`<div class="mt-8">${K.Notice({ tone:'warn',
          title:yz('ays.learn.not-zayif'), body:q.issues.map(i => i.why).join(' ') + ' Yine de eklemek için tekrar bas.' })}</div>`);
        if(!S.ui.noteForce){ S.ui.noteForce = true; return; }
      }
      S.ui.noteForce = false;
      note.segments.push({ ts, text, tag:(tagEl && tagEl.value) || 'not' });
      await M.saveVideoNote(note);
      if(textEl) textEl.value = '';
      UI.toast(yz('ays.learn.not-eklendi')+M.fmtTs(ts));
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
      UI.toast(yz('ays.learn.kart-olusturuldu-yarin-tekra'));
      R.App.render();
    },
    async 'note-ai-cards'(el){
      const id = el.dataset.id;
      const out = document.getElementById('ai-cards');
      if(out) out.innerHTML = String(html`<p class="small muted mt-10">${yz('ays.learn.notlar-okunuyor')}
        <span class="dim">${yz('ays.learn.10-60-sn')}</span></p>`);
      try{
        const res = await R.Office.generateCards(id);
        pendingCards = res.cards;
        UI.sheet({
          title:yz('ays.learn.onerilen-kartlar'), subtitle:res.cards.length+' kart · '+(res.dropped ? res.dropped+' öneri elendi' : 'hepsi geçerli'),
          wide:true,
          body:String(K.Stack([
            K.Notice({ tone:'info', body:'Onaylamadan önce oku. Yanlış bir kart, yanlış bir ezberdir.' }),
            html`<div class="stack-sm">${map(res.cards, (c, i) => K.Card({ flat:true, pad:'sm', body:html`
              <div class="row between"><b class="small">${c.front}</b>
                ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:yz('ays.learn.oneriyi-cikar'),
                  act:'note-ai-drop', data:{ 'data-i':i } })}</div>
              <p class="small muted mt-4">${c.back}</p>` }))}</div>`,
          ])),
          footer:String(html`${K.Button({ label:yz('ays.learn.vazgec'), act:'sheet-close' })}
            ${K.Button({ label:yz('ays.learn.hepsini-ekle'), tone:'primary', act:'note-ai-accept' })}`),
        });
      }catch(err){
        const msg = R.LLM.errorText(err && err.code);
        if(out) out.innerHTML = String(html`<div class="mt-10">${K.Notice({ tone:'warn', body:msg })}</div>`);
      }
    },
    async 'note-ai-drop'(el){
      pendingCards.splice(Number(el.dataset.i), 1);
      UI.toast(yz('ays.learn.oneri-cikarildi'));
      const card = el.closest('.card');
      if(card) card.remove();
    },
    async 'note-ai-accept'(){
      if(!pendingCards.length){ UI.toast(yz('ays.learn.eklenecek-kart-yok')); return; }
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
        }, false, note.segments.length + ' kart üret');
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
    title:yz('ays.learn.ogrenme'),
    subtitle(){
      const note = openNote();
      if(note) return (note.title || 'Adsız ders') + ' · ' + U.plural(note.segments.length, 'not', 'not');
      const segs = S.videoNotes.reduce((a, n) => a + n.segments.length, 0);
      return S.videoNotes.length
        ? U.plural(S.videoNotes.length, 'ders', 'ders') + ' · ' + U.plural(segs, 'not', 'not')
        : 'Video izle, not düş, karta çevir';
    },
    actions(){
      return String(K.Button({ label:yz('ays.learn.ders-ekle'), icon:'plus', size:'sm', tone:'primary', act:'note-new' }));
    },
    render, handle, change, onKey,
  };
})();
