/* Tekrar — aralikli tekrar oturumu, kart yonetimi ve yanlis defteri.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */
window.LIFEOS.PARCA.yazilar({
  'ays.cards.yanlis-notu':'Yanlış notu',
  'ays.cards.arka-yuz':'Arka yüz',
  'ays.cards.on-yuz':'Ön yüz',
  'ays.cards.yanlis-tekrar-gunleri':'Yanlış · tekrar günleri',
  'ays.cards.tekrar-gunleri':'Tekrar günleri',
  'ays.cards.paketi-baslat':'Paketi başlat',
  'ays.cards.recete':'Reçete: ',
  'ays.cards.benzer':'Benzer: ',
  'ays.cards.kapanmis-kayitlar':'Kapanmış kayıtlar (',
  'ays.cards.acik-kayitlar':'Açık kayıtlar (',
  'ays.cards.aciklari-goster':'Açıkları göster (',
  'ays.cards.kapanmislari-goster':'Kapanmışları göster (',
  'ays.cards.henuz-kapanmis-kayit-yok':'Henüz kapanmış kayıt yok.',
  'ays.cards.acik-yanlis-yok-deneme-anali':'Açık yanlış yok. Deneme analizinde etiketlenen her hata buraya düşer.',
  'ays.cards.yazilacak-bilgi':'Yazılacak bilgi',
  'ays.cards.kart-geri-cagirma-gerektirme':'Kart geri çağırma gerektirmeli: “Mitokondri nedir?” yerine ',
  'ays.cards.karti-duzenle-2':'Kartı düzenle',
  'ays.cards.kart-olustur':'Kart oluştur',
  'ays.cards.gecikmis':'Gecikmiş ',
  'ays.cards.kart-guncellendi':'Kart güncellendi',
  'ays.cards.kart-eklendi':'Kart eklendi',
  'ays.cards.yanlis-defterinden-tek-dokun':'Yanlış defterinden tek dokunuş.',
  'ays.cards.kart-uretilemedi':'Kart üretilemedi',
});


window.R = window.R || {};
R.Screens = R.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'ays', sira:110, group:'Git', label:'Tekrar ve yanlış defteri', icon:'cards', route:'cards', run(){ R.App.go('cards'); } });
window.LIFEOS.PARCA.komut({ modul:'ays', sira:220, group:'Kayıt', label:'Tekrar kartı ekle', icon:'plus', run(){ R.App.go('cards'); setTimeout(()=>R.Screens.cards.handle['new-card']({dataset:{}}), 60); } });
window.LIFEOS.PARCA.yazilar({
  'ays.cards.hatirlamadim':'Hatırlamadım',
  'ays.cards.zorlandim':'Zorlandım',
  'ays.cards.hatirladim':'Hatırladım',
  'ays.cards.diger':'Diğer',
  'ays.cards.tekrar-paketi':'Tekrar paketi',
  'ays.cards.bugun-icin-bekleyen-kart-yok':'Bugün için bekleyen kart yok. Kartlar deneme analizinden otomatik üretilir; elle de ekleyebilirsin.',
  'ays.cards.kart-ekle':'Kart ekle',
  'ays.cards.kart-bekliyor':'kart bekliyor',
  'ays.cards.bugun':'bugün',
  'ays.cards.tekrar-yapildi':'tekrar yapıldı',
  'ays.cards.oturum-ilerlemesi':'Oturum ilerlemesi',
  'ays.cards.cevabi-goster':'Cevabı göster',
  'ays.cards.asama':'Aşama:',
  'ays.cards.duzenle':'Düzenle',
  'ays.cards.henuz-kart-yok':'Henüz kart yok.',
  'ays.cards.karti-duzenle':'kartı düzenle',
  'ays.cards.kartlarda-ara':'Kartlarda ara…',
  'ays.cards.kartlarda-ara-2':'kartlarda ara',
  'ays.cards.aramayi-temizle':'Aramayı temizle',
  'ays.cards.etiket-yok':'etiket yok',
  'ays.cards.senin-cevabin':'Senin cevabın',
  'ays.cards.dogru-cevap':'· doğru cevap',
  'ays.cards.hatanin-turunu-sen-sec-secme':'Hatanın türünü sen seç; seçmeden reçeteye ve hata dağılımına girmez.',
  'ays.cards.kok-neden':'Kök neden:',
  'ays.cards.dogru-ilke':'Doğru ilke:',
  'ays.cards.konunun-notu':'Konunun notu: ',
  'ays.cards.konuyu-calis':'Konuyu Çalış',
  'ays.cards.tekrar-tarihleri':'Tekrar tarihleri:',
  'ays.cards.tekrar-karti-yap':'Tekrar kartı yap',
  'ays.cards.i-lk-tekrar-yarin-istersen-g':'İlk tekrar yarın; istersen geri alırsın.',
  'ays.cards.recete-yapildi':'reçete yapıldı',
  'ays.cards.receteyi-tamamla':'Reçeteyi tamamla',
  'ays.cards.kapandi':'kapandı · ',
  'ays.cards.kapat-cozumsuz-dogru':'Kapat (çözümsüz doğru)',
  'ays.cards.defter-alanlari':'Defter alanları',
  'ays.cards.her-kayitta-doldurulacak-ala':'Her kayıtta doldurulacak alanlar',
  'ays.cards.kapanis-olcutu':'Kapanış ölçütü',
  'ays.cards.soru-cozume-bakilmadan-dogru':'Soru, çözüme bakılmadan doğru yapıldıysa ve süre uygunsa kapanır. Çözüme bakılarak yapılan soru “doğru” değil, “öğrenme sorusu” sayılır.',
  'ays.cards.ders':'— ders —',
  'ays.cards.on-yuz-soru':'Ön yüz — soru',
  'ays.cards.geri-cagirma-gerektiren-soru':'Geri çağırma gerektiren soru',
  'ays.cards.arka-yuz-cevap':'Arka yüz — cevap / ilke',
  'ays.cards.kisa-ve-genellenebilir':'Kısa ve genellenebilir',
  'ays.cards.konu':'Konu',
  'ays.cards.ders-2':'Ders',
  'ays.cards.asama-2':'Aşama',
  'ays.cards.sonraki-tekrar':'Sonraki tekrar',
  'ays.cards.sil':'Sil',
  'ays.cards.vazgec':'Vazgeç',
  'ays.cards.kaydet':'Kaydet',
  'ays.cards.gelecek-yuk':'Gelecek yük',
  'ays.cards.onumuzdeki-7-gunun-vadesi':'Önümüzdeki 7 günün vadesi',
  'ays.cards.bugunun-kartlari':'Bugünün kartları',
  'ays.cards.yanlis-defteri':'Yanlış defteri',
  'ays.cards.butun-kartlar':'Bütün kartlar',
  'ays.cards.tekrar-borcu':'Tekrar borcu %',
  'ays.cards.tekrar-takvimi':'Tekrar takvimi',
  'ays.cards.araliklar-sabittir':'Aralıklar sabittir',
  'ays.cards.tekrar-bolumleri':'Tekrar bölümleri',
  'ays.cards.sonraki-tekrar-2':'Sonraki tekrar: ',
  'ays.cards.on-yuz-bos-olamaz':'Ön yüz boş olamaz',
  'ays.cards.kart-silindi':'Kart silindi',
  'ays.cards.yanlis-kapatildi':'Yanlış kapatıldı',
  'ays.cards.etiket':'Etiket: ',
  'ays.cards.tekrar-karti-eklendi-ilk-tek':'Tekrar kartı eklendi; ilk tekrar yarın',
  'ays.cards.kart-geri-alindi':'Kart geri alındı',
  'ays.cards.tekrar':'Tekrar',
});
window.LIFEOS.PARCA.sayfa({ id:'cards', modul:'ays', king:{ sira:150, ad:'Tekrar', es:['tekrar', 'kart'] }, cekmece:'calisma', ad:'Tekrar', ikon:'cards', sira:30 });

R.Screens.cards = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const STAGES = ['yeni', '+1 gün', '+3 gün', '+1 hafta', '+1 ay'];
  const RATINGS = [
    { rating:'forgot', label:yz('ays.cards.hatirlamadim'), key:'1', tone:'danger' },
    { rating:'hard', label:yz('ays.cards.zorlandim'), key:'2', tone:null },
    { rating:'remembered', label:yz('ays.cards.hatirladim'), key:'3', tone:'primary' },
  ];

  function stageLabel(stage){ return STAGES[stage] || 'yeni'; }

  /* ---------- vitrin kartları (brand/ortak/vitrin.js) ----------

     045 YANLIŞ KARTI: önde soru, arkada «neden yanlış» (hatadan gelen
     kartta yanlış notu). Kitaplık yoksa eski düz kart çizilir. */
  const VT = () => (window.LIFEOS || {}).VITRIN;
  function kartYuzu(card, flipped){
    const hata = card.source === 'error';
    if(VT()) return raw(VT().yanlisKarti({ on:card.front, arka:card.back || '—',
      ust:(hata ? 'Yanlış' : 'Kart') + (card.topic ? ' · ' + card.topic : ''),
      arkaAd:hata ? yz('ays.cards.yanlis-notu') : 'Cevap', cevrik:flipped, act:'flip', data:{ 'data-id':card.id } }));
    return html`<div class="flashcard" data-act="flip" data-id="${card.id}">
      <span class="flashcard__side">${(flipped ? yz('ays.cards.arka-yuz') : yz('ays.cards.on-yuz')) + (card.topic ? ' · '+card.topic : '')}</span>
      <span class="flashcard__text">${flipped ? (card.back || '—') : card.front}</span></div>`;
  }

  /* 065 TEKRAR TAKVİMİ ÇİZGİSİ: kartın aralıkları R.SRS_INTERVALS'tan
     (kod), geçilen aşamalar dolu, sıradaki parlıyor. */
  function takvimCizgisi(card){
    if(!VT()) return '';
    const gun = card.dueAt ? U.diffDays(U.todayISO(), card.dueAt) : null;
    const not = gun == null ? '' : gun <= 0 ? 'sıradaki tekrar bugün' : 'sıradaki tekrar ' + gun + ' gün sonra';
    return '<div class="mt-12">' + VT().tekrarTakvimi({ adimlar:R.SRS_INTERVALS, asama:Math.min(card.stage || 0, R.SRS_INTERVALS.length),
      baslik:card.source === 'error' ? yz('ays.cards.yanlis-tekrar-gunleri') : yz('ays.cards.tekrar-gunleri'), etiket:card.topic || '', not }) + '</div>';
  }

  /* 059 TEKRAR PAKETİ: bugünün vadeli kartları konu konu. Süre TAHMİNDİR:
     kart başına 20 saniye (geri çağırma + değerlendirme) varsayımı. */
  const KART_SN = 20;
  function tekrarPaketi(due){
    if(!VT() || !due.length) return '';
    const grup = {};
    due.forEach(c => { const k = c.topic || 'Konusuz'; grup[k] = (grup[k] || 0) + 1; });
    const konular = Object.keys(grup).sort((a, b) => grup[b] - grup[a]).slice(0, 5)
      .map(k => ({ ad:k, n:grup[k], dk:Math.max(1, Math.round(grup[k] * KART_SN / 60)) }));
    const kalan = due.length - konular.reduce((a, x) => a + x.n, 0);
    if(kalan > 0) konular.push({ ad:yz('ays.cards.diger'), n:kalan, dk:Math.max(1, Math.round(kalan * KART_SN / 60)) });
    return K.Kutu({ ad:yz('ays.cards.tekrar-paketi'), yuva:'tahmin', class:'vkutu', govde:raw(VT().tekrarPaketi({ konular,
      dakika:Math.max(1, Math.round(due.length * KART_SN / 60)), act:'paket-baslat', dugme:yz('ays.cards.paketi-baslat') })) });
  }

  /* ---------- due oturumu ---------- */

  function dueSession(){
    const due = C.dueCards().sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    if(!due.length){
      return K.Card({ body:K.Empty({ icon:'cards',
        text:yz('ays.cards.bugun-icin-bekleyen-kart-yok'),
        action:K.Button({ label:yz('ays.cards.kart-ekle'), icon:'plus', tone:'primary', act:'new-card' }) }) });
    }

    const card = due[0];
    const flipped = !!S.ui.flipped[card.id];
    const doneToday = S.cards.filter(c => c.lastReviewedAt === U.todayISO()).length;
    const late = card.dueAt < U.todayISO();

    return K.Card({ body:html`
      <div class="row between mb-10">
        <span class="small muted">${due.length} ${yz('ays.cards.kart-bekliyor')}${late ? ' · bu kart '+U.relativeDay(card.dueAt) : ''}</span>
        <span class="small dim">${yz('ays.cards.bugun')} ${doneToday} ${yz('ays.cards.tekrar-yapildi')}</span>
      </div>
      ${K.Meter({ label:yz('ays.cards.oturum-ilerlemesi'), value:U.pct(doneToday, doneToday+due.length),
        text:doneToday+' / '+(doneToday+due.length) })}

      <div class="mt-14">${kartYuzu(card, flipped)}</div>
      ${raw(takvimCizgisi(card))}

      ${flipped
        ? html`<div class="row mt-12 gap-8">${map(RATINGS, r => html`
            <button class="${'btn grow' + (r.tone ? ' btn--'+r.tone : '')}" data-act="rate"
              data-id="${card.id}" data-rating="${r.rating}">
              <span>${r.label}</span><span class="tiny dim">${r.key}</span></button>`)}</div>`
        : K.Button({ label:yz('ays.cards.cevabi-goster'), block:true, class:'mt-12', act:'flip', data:{ 'data-id':card.id } })}

      <div class="row between mt-10">
        <span class="tiny dim">${yz('ays.cards.asama')} ${stageLabel(card.stage)}${card.source === 'error' ? ' · deneme hatasından' : ''}</span>
        ${K.Button({ label:yz('ays.cards.duzenle'), icon:'edit', size:'sm', tone:'ghost', act:'edit-card', data:{ 'data-id':card.id } })}
      </div>` });
  }

  /* ---------- tum kartlar ---------- */

  function allCards(){
    if(!S.cards.length){
      return K.Card({ body:K.Empty({ icon:'cards', text:yz('ays.cards.henuz-kart-yok'),
        action:K.Button({ label:yz('ays.cards.kart-ekle'), icon:'plus', tone:'primary', act:'new-card' }) }) });
    }

    const q = U.norm(S.ui.cardQuery || '');
    let list = S.cards.slice().sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    if(q) list = list.filter(c => U.norm(c.front+' '+c.back+' '+(c.topic || '')).indexOf(q) >= 0);
    const pg = K.paginate(list, S.ui.cardPage || 1, 30);

    const rows = pg.items.map(c => [
      html`<div><b class="small">${c.front}</b><div class="tiny dim">${c.topic || '—'}</div></div>`,
      html`<span class="small">${stageLabel(c.stage)}</span>`,
      html`<span class="${c.dueAt < U.todayISO() ? 'small num is-late' : 'small num dim'}">${U.fmtShort(c.dueAt)}</span>`,
      html`<div class="row-sm jc-end">${K.IconButton({ icon:'edit', size:'sm', plain:true,
        aria:yz('ays.cards.karti-duzenle'), act:'edit-card', data:{ 'data-id':c.id } })}</div>`,
    ]);

    const body = html`
      <div class="row between wrap mb-10 gap-8">
        ${K.Input({ class:'input--search', placeholder:yz('ays.cards.kartlarda-ara'), value:S.ui.cardQuery || '',
          aria:yz('ays.cards.kartlarda-ara-2'), change:'card-search', data:{ 'data-debounce':220 } })}
        <span class="small dim">${list.length} / ${S.cards.length} kart</span>
      </div>
      ${list.length
        ? html`${K.Table({ tight:true, rows, headers:['Kart', 'Aşama', 'Sonraki', ''] })}
               ${K.Pager({ page:pg.page, pages:pg.pages, total:pg.total, act:'card-page' })}`
        : K.Empty({ icon:'search', text:'“'+(S.ui.cardQuery || '')+'” için kart bulunamadı.',
            action:K.Button({ label:yz('ays.cards.aramayi-temizle'), size:'sm', act:'card-search-clear' }) })}`;

    return K.Card({ body });
  }

  /* ---------- yanlis defteri ---------- */

  /* Fikir 26: yanlışın konusunun ders notu — aynı ders ve konu kimliği. */
  function notOf(e){
    if(!e.subjectId || !e.topicId) return null;
    return (S.videoNotes || []).find(n => n.subjectId === e.subjectId && n.topicId === e.topicId) || null;
  }

  function NotebookItem(e){
    const not = notOf(e);
    const exam = S.exams.find(x => x.id === e.examId);
    const base = e.createdAt ? R.U.gunOf(e.createdAt) : U.todayISO();
    const dueDates = R.SRS_INTERVALS.map(d => U.fmtShort(U.addDays(U.parse(base), d))).join(' · ');
    const source = exam ? exam.type+' · '+U.fmtShort(e.examDate || exam.date) : (e.testName || '—');

    return K.Card({ flat:true, pad:'sm', class:'stack-xs', body:html`
      <div class="row between wrap gap-6">
        <div class="row-sm">${raw(UI.tagDot(e.tag))}<b class="small">${e.topic || e.testName || 'Yanlış'}</b>
          ${R.ERROR_TAGS[e.tag]
            ? K.Badge({ label:e.tag+' · '+R.ERROR_TAGS[e.tag].name, tone:'muted' })
            : K.Badge({ label:yz('ays.cards.etiket-yok'), tone:'warn' })}
          ${when(e.status, () => K.Badge({ label:e.status, tone:'muted' }))}</div>
        <span class="tiny dim">${source}${e.questionNo ? ' · soru '+e.questionNo : ''}</span>
      </div>
      ${when(e.soru, () => html`<div class="small">${String(e.soru).slice(0, 240)}</div>`)}
      ${when(e.senin && e.anahtar, () => html`<div class="tiny dim">${yz('ays.cards.senin-cevabin')} ${e.senin} ${yz('ays.cards.dogru-cevap')} ${e.anahtar}</div>`)}
      ${when(!R.ERROR_TAGS[e.tag], () => html`<div class="stack-xs">
        <div class="tiny dim">${yz('ays.cards.hatanin-turunu-sen-sec-secme')}</div>
        ${K.Row(Object.keys(R.ERROR_TAGS).map(k => K.Button({ label:k + ' · ' + R.ERROR_TAGS[k].name,
          size:'sm', tone:'ghost', act:'error-tag', data:{ 'data-id':e.id, 'data-tag':k } })), { wrap:true })}
      </div>`)}
      ${when(e.rootCause, () => html`<div class="small"><span class="dim">${yz('ays.cards.kok-neden')}</span> ${e.rootCause}</div>`)}
      ${when(e.principle, () => html`<div class="small"><span class="dim">${yz('ays.cards.dogru-ilke')}</span> ${e.principle}</div>`)}
      ${when(not, () => html`<div class="row-sm">${K.Button({ label:yz('ays.cards.konunun-notu') + not.title,
        size:'sm', tone:'ghost', act:'note-goto', data:{ 'data-id':not.id } })}</div>`)}
      ${when(e.topicRef || e.topicId, () => html`<div class="row-sm">${K.Button({ label:yz('ays.cards.konuyu-calis'),
        icon:'book', size:'sm', tone:'ghost', act:'study-topic', data:{ 'data-id':e.id } })}</div>`)}
      ${K.Row([
        K.Chip(yz('ays.cards.recete') + (e.recipe || '—')),
        when(e.similar, () => K.Chip(yz('ays.cards.benzer') + e.similar)),
        when(e.seconds, () => K.Chip(e.seconds + ' sn')),
      ], { wrap:true })}
      <div class="tiny dim">${yz('ays.cards.tekrar-tarihleri')} ${dueDates}</div>
      ${when(!e.closedAt && String(e.principle || e.recipe || '').trim()
        && !(S.cards || []).some(c => c.sourceRef === e.id), () => html`<div class="row gap-8 mt-4">
        ${K.Button({ label:yz('ays.cards.tekrar-karti-yap'), size:'sm', tone:'primary', icon:'plus',
          act:'error-card', data:{ 'data-id':e.id } })}
        <span class="tiny dim">${yz('ays.cards.i-lk-tekrar-yarin-istersen-g')}</span>
      </div>`)}
      <div class="row between mt-4">
        ${e.repairDoneAt
          ? K.Badge({ label:yz('ays.cards.recete-yapildi'), tone:'ok' })
          : K.Button({ label:yz('ays.cards.receteyi-tamamla'), size:'sm', act:'repair-done', data:{ 'data-id':e.id } })}
        ${e.closedAt
          ? K.Badge({ label:yz('ays.cards.kapandi')+U.fmtShort(R.U.gunOf(e.closedAt)), tone:'ok' })
          : K.Button({ label:yz('ays.cards.kapat-cozumsuz-dogru'), size:'sm', act:'close-error', data:{ 'data-id':e.id } })}
      </div>` });
  }

  function notebook(){
    const showClosed = !!S.ui.notebookClosed;
    const all = S.errors.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const open = all.filter(e => !e.closedAt);
    const closed = all.filter(e => e.closedAt);
    const list = showClosed ? closed : open;
    const pg = K.paginate(list, S.ui.nbPage || 1, 20);

    /* Süzgeç sekme değil tek düğmedir (§1.2: ekran içi sekme 0): hangi
       listenin gösterildiği başlıkta yazar, düğme ötekine geçer. */
    return K.Grid([
      K.Span(8, K.Stack([
        html`<div class="row between wrap"><span class="small muted">${showClosed
          ? yz('ays.cards.kapanmis-kayitlar') + closed.length + ')' : yz('ays.cards.acik-kayitlar') + open.length + ')'}</span>
          ${K.Button({ label:showClosed ? yz('ays.cards.aciklari-goster') + open.length + ')'
            : yz('ays.cards.kapanmislari-goster') + closed.length + ')', size:'sm', tone:'ghost',
            act:'notebook-filter', data:{ 'data-value':showClosed ? '0' : '1' } })}</div>`,
        list.length
          ? html`${K.Stack(map(pg.items, NotebookItem), 'sm')}
                 ${K.Pager({ page:pg.page, pages:pg.pages, total:pg.total, act:'nb-page' })}`
          : K.Card({ body:K.Empty({ icon:'list',
              text:showClosed ? yz('ays.cards.henuz-kapanmis-kayit-yok')
                : yz('ays.cards.acik-yanlis-yok-deneme-anali') }) }),
      ])),
      K.Span(4, K.Stack([
        K.Card({ title:yz('ays.cards.defter-alanlari'), hint:'notebook', sub:yz('ays.cards.her-kayitta-doldurulacak-ala'),
          body:K.Table({ tight:true, headers:['Alan', yz('ays.cards.yazilacak-bilgi')],
            rows:R.NOTEBOOK_FIELDS.map(f => [html`<b class="small">${f[0]}</b>`, html`<span class="small muted">${f[1]}</span>`]) }) }),
        K.Card({ title:yz('ays.cards.kapanis-olcutu'), body:html`<p class="small muted">${yz('ays.cards.soru-cozume-bakilmadan-dogru')}</p>` }),
      ])),
    ]);
  }

  /* ---------- kart formu ---------- */

  function cardSheet(cardId){
    const card = cardId ? S.cards.find(c => c.id === cardId) : null;
    const subjectOptions = [{ value:'', label:yz('ays.cards.ders') }].concat(R.SUBJECTS.map(s => ({ value:s.id, label:s.name })));

    const body = K.Stack([
      K.Notice({ tone:'info', body:yz('ays.cards.kart-geri-cagirma-gerektirme')
        + '“Oksijenli solunum basamaklarını yer ve ürünle eşleştir”.' }),
      K.Field({ label:yz('ays.cards.on-yuz-soru'),
        input:K.Textarea({ id:'cf-front', rows:2, value:card ? card.front : '', placeholder:yz('ays.cards.geri-cagirma-gerektiren-soru') }) }),
      K.Field({ label:yz('ays.cards.arka-yuz-cevap'),
        input:K.Textarea({ id:'cf-back', rows:2, value:card ? card.back : '', placeholder:yz('ays.cards.kisa-ve-genellenebilir') }) }),
      K.Cols(2, [
        K.Field({ label:yz('ays.cards.konu'), input:K.Input({ id:'cf-topic', value:card ? card.topic : '' }) }),
        K.Field({ label:yz('ays.cards.ders-2'), input:K.Select({ id:'cf-subject', options:subjectOptions, value:card ? card.subjectId : '' }) }),
      ]),
      when(card, () => K.Cols(2, [
        K.Field({ label:yz('ays.cards.asama-2'), input:K.Select({ id:'cf-stage', value:card.stage,
          options:STAGES.map((label, value) => ({ value, label })) }) }),
        K.Field({ label:yz('ays.cards.sonraki-tekrar'), input:K.Input({ id:'cf-due', type:'date', value:card.dueAt }) }),
      ])),
    ]);

    UI.sheet({
      title:card ? yz('ays.cards.karti-duzenle-2') : yz('ays.cards.kart-olustur'),
      body:String(body),
      footer:String(html`
        ${when(card, () => K.Button({ label:yz('ays.cards.sil'), tone:'danger', act:'delete-card', data:{ 'data-id':card.id } }))}
        ${K.Button({ label:yz('ays.cards.vazgec'), act:'sheet-close' })}
        ${K.Button({ label:yz('ays.cards.kaydet'), tone:'primary', act:'save-card', data:card ? { 'data-id':card.id } : {} })}`),
    });
  }

  /* ---------- ekran ---------- */

  /* Üç görünüm (bugünün kartları, yanlış defteri, bütün kartlar) sekme
     değil, alt alta bölümdür (§1.2); bölüm çubuğu sayfa içinde kaydırır. */
  /* 033 GELECEK YÜK (vitrin, brand/ortak/grafik.js): önümüzdeki yedi günün
     vadesi. Bugünün sütunu geciken kartları da taşır; gelecek günler kesik
     çerçevedir, çünkü henüz olmadılar. */
  function gelecekYuk(){
    const G = (window.LIFEOS || {}).GRAFIK;
    if(!G || !S.cards.length) return '';
    const bugun = U.todayISO();
    const gunler = [];
    for(let i = 0; i < 7; i++){
      const t = G.gunEkle(bugun, i);
      gunler.push({ tarih:t, deger:S.cards.filter(c => i === 0 ? c.dueAt <= t : c.dueAt === t).length });
    }
    return K.Kutu({ ad:yz('ays.cards.gelecek-yuk'), yuva:'hesaplandı',
      govde:raw(G.yukHtml({ gunler, bugun, birim:'kart', etiket:yz('ays.cards.onumuzdeki-7-gunun-vadesi') })) });
  }

  function bolumler(){
    return [
      { id:'due', ad:yz('ays.cards.bugunun-kartlari'), sayi:C.dueCards().length,
        govde:html`${gelecekYuk()}<div class="cardsgrid">${K.Stack(dueSession())}<div>${K.Stack([tekrarPaketi(C.dueCards()), sidebar()])}</div></div>` },
      { id:'notebook', ad:yz('ays.cards.yanlis-defteri'), sayi:C.openErrors().length, govde:notebook() },
      { id:'all', ad:yz('ays.cards.butun-kartlar'), sayi:S.cards.length, govde:K.Stack(allCards()) },
    ];
  }

  function header(){
    const debt = C.cardDebt();
    const overdue = C.overdueCards().length;
    if(debt <= 10) return '';
    return K.Span(12, K.Notice({ tone:'warn', title:yz('ays.cards.tekrar-borcu')+debt+'.',
      body:yz('ays.cards.gecikmis')+overdue+' kart var. %10 üzerindeki borçta yeni kart üretimi azaltılır; önce borcu sadeleştir.' }));
  }

  function sidebar(){
    /* iPhone Faz 2: «Due» ve «Borç» sayıları kalktı — bekleyen kart sekme
       rozetinde, borç %10'u aşınca sayfanın başındaki uyarıda, ikisi de ⓘ'de. */
    return html`<div>${K.Stack([
      /* Aciklama tek satira sigmiyordu ve yarida kesiliyordu; gun etiketi
         ustte, aciklama altinda tam metin olarak durur. */
      K.Card({ title:yz('ays.cards.tekrar-takvimi'), hint:'srs', sub:yz('ays.cards.araliklar-sabittir'),
        body:html`<div class="srslist">${map(R.SRS_PROTOCOL, p => html`
          <div class="srsrow">
            <b class="srsrow__day">${p.day}</b>
            <span class="srsrow__detail">${p.detail}</span>
          </div>`)}</div>` }),
    ])}</div>`;
  }

  LIFEOS.PARCA.blok({ id:'cards.header', sayfa:'cards', yer:'y1', sira:10, ad:'Sayfa başlığı', ciz(){
    return header();
  } });
  LIFEOS.PARCA.blok({ id:'cards.tekrar-sekmeleri', sayfa:'cards', yer:'y2', sira:10, ad:'Tekrar sekmeleri', ciz(){
    return K.SayfaBolumleri({ act:'card-tab', aria:yz('ays.cards.tekrar-bolumleri'), bolumler:bolumler() });
  } });
  LIFEOS.PARCA.blok({ id:'cards.aciklamalar', sayfa:'cards', yer:'y3', sira:10, ad:'Açıklamalar', ciz(){
    return raw(UI.rail(['srs', 'card-debt', 'recall', 'notebook']));
  } });
  async function render(){
    return String(K.Grid([
    LIFEOS.PARCA.yer('cards', 'y1', K, undefined, typeof raw === 'undefined' ? null : raw),
    K.Span(12, LIFEOS.PARCA.yer('cards', 'y2', K, undefined, typeof raw === 'undefined' ? null : raw)),
    K.Span(12, LIFEOS.PARCA.yer('cards', 'y3', K, undefined, typeof raw === 'undefined' ? null : raw)),
  ]));
  }

  /* Başka ekrandan «Yanlış defteri»ne gelindiyse (Bugün, `data-tab`)
     çizimden sonra oraya kayılır; sonra istek düşer. */
  function afterRender(){
    const t = S.ui.cardTab;
    S.ui.cardTab = 'due';
    if(t && t !== 'due') K.bolumeGit(t);
  }

  const handle = {
    async 'card-tab'(el){ K.bolumeGit(el.dataset.tab); },
    /* 059: paket Sınama'nın «vadeli kartlar» kipinde açılır. */
    async 'paket-baslat'(){ S.ui.quizMode = 'due'; R.App.go('quiz'); },
    async 'card-page'(el){ S.ui.cardPage = Number(el.dataset.page); R.App.render(); },
    async 'nb-page'(el){ S.ui.nbPage = Number(el.dataset.page); R.App.render(); },
    async 'notebook-filter'(el){ S.ui.notebookClosed = el.dataset.value === '1'; S.ui.nbPage = 1; R.App.render(); },
    async 'card-search-clear'(){ S.ui.cardQuery = ''; S.ui.cardPage = 1; R.App.render(); },
    async flip(el){
      const id = el.dataset.id;
      S.ui.flipped[id] = !S.ui.flipped[id];
      R.App.render();
    },
    async rate(el){
      const card = S.cards.find(c => c.id === el.dataset.id);
      M.schedule(card, el.dataset.rating);
      await M.saveCard(card);
      delete S.ui.flipped[card.id];
      UI.toast(yz('ays.cards.sonraki-tekrar-2')+U.fmtShort(card.dueAt));
      R.App.render();
    },
    async 'new-card'(){ cardSheet(); },
    async 'edit-card'(el){ cardSheet(el.dataset.id); },
    async 'save-card'(el){
      const id = el.dataset.id;
      const existing = id ? S.cards.find(c => c.id === id) : null;
      const front = document.getElementById('cf-front').value.trim();
      if(!front){ UI.toast(yz('ays.cards.on-yuz-bos-olamaz')); return; }
      const card = existing || M.newCard({});
      card.front = front;
      card.back = document.getElementById('cf-back').value.trim();
      card.topic = document.getElementById('cf-topic').value.trim();
      card.subjectId = document.getElementById('cf-subject').value || null;
      if(existing){
        card.stage = Number(document.getElementById('cf-stage').value) || 0;
        card.dueAt = document.getElementById('cf-due').value || card.dueAt;
      }
      await M.saveCard(card);
      UI.closeSheet();
      UI.toast(existing ? yz('ays.cards.kart-guncellendi') : yz('ays.cards.kart-eklendi'));
      R.App.render();
    },
    async 'delete-card'(el){
      await M.deleteCard(el.dataset.id);
      UI.closeSheet();
      UI.toast(yz('ays.cards.kart-silindi'));
      R.App.render();
    },
    async 'close-error'(el){
      const err = S.errors.find(e => e.id === el.dataset.id);
      err.closedAt = new Date().toISOString();
      await M.saveError(err);
      UI.toast(yz('ays.cards.yanlis-kapatildi'));
      R.App.render();
    },
    /* Etiketsiz yanlış (test kitabından gelen): türü kullanıcı seçer. */
    async 'error-tag'(el){
      const err = S.errors.find(e => e.id === el.dataset.id);
      const t = R.ERROR_TAGS[el.dataset.tag];
      if(!err || !t) return;
      err.tag = el.dataset.tag;
      if(!err.recipe) err.recipe = t.recipe;
      await M.saveError(err);
      UI.toast(yz('ays.cards.etiket') + t.name);
      R.App.render();
    },
    /* Tek dokunuş tekrar kartı (fikir 22): Ofis'in «card-from-error» önerisiyle
       AYNI eylem; doğrulanır, yazılır, «Geri al» ile geri alınır. */
    async 'error-card'(el){
      const r = await R.Proposals.hemen({ action:'card-from-error', agent:'analist',
        params:{ errorId:el.dataset.id }, reason:yz('ays.cards.yanlis-defterinden-tek-dokun') });
      if(!r.ok){ UI.toast(r.why || yz('ays.cards.kart-uretilemedi')); return; }
      UI.toast(yz('ays.cards.tekrar-karti-eklendi-ilk-tek'), { undo:async () => {
        await R.Proposals.undo(r.row.id);
        UI.toast(yz('ays.cards.kart-geri-alindi'));
        R.App.render();
      } });
      R.App.render();
    },
    async 'note-goto'(el){ S.ui.noteOpen = el.dataset.id; R.App.go('learn'); },
    async 'study-topic'(el){
      const err = S.errors.find(e => e.id === el.dataset.id);
      const topicKey = err ? (err.topicRef || err.topicId) : null;
      if(!topicKey) return;
      if(R.Ogren){
        let sId = (err && err.subjectId) || null;
        let tId = topicKey;
        if(R.Ogren.konuyuBul){
          const found = R.Ogren.konuyuBul(topicKey);
          if(found && found.subject && found.topic){
            sId = found.subject.id;
            tId = found.topic.id;
          }
        }
        if(sId && tId){
          await R.Ogren.sec(sId, tId);
        }
      }
      R.App.go('ogren');
    },
    async 'repair-done'(el){
      const err = S.errors.find(e => e.id === el.dataset.id);
      err.repairDoneAt = new Date().toISOString();
      await M.saveError(err);
      R.App.render();
    },
  };

  const change = {
    async 'card-search'(el){ S.ui.cardQuery = el.value; S.ui.cardPage = 1; R.App.render(); },
  };

  /* klavye: bosluk cevir, 1/2/3 degerlendir */
  function onKey(e){
    if(R.S.route !== 'cards' || UI.isSheetOpen()) return;
    if(e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    const due = C.dueCards().sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    if(!due.length) return;
    const card = due[0];
    if(e.code === 'Space'){
      e.preventDefault();
      S.ui.flipped[card.id] = !S.ui.flipped[card.id];
      R.App.render();
    }else if(S.ui.flipped[card.id] && ['1', '2', '3'].indexOf(e.key) >= 0){
      const byKey = { '1':'forgot', '2':'hard', '3':'remembered' };
      handle.rate({ dataset:{ id:card.id, rating:byKey[e.key] } });
    }
  }

  return {
    id:'cards',
    title:yz('ays.cards.tekrar'),
    subtitle(){
      return C.dueCards().length+' kart due · borç %'+C.cardDebt()+' · '+C.openErrors().length+' açık yanlış';
    },
    actions(){
      return String(K.Button({ label:yz('ays.cards.kart-ekle'), icon:'plus', size:'sm', act:'new-card' }));
    },
    render, afterRender, handle, change, onKey,
  };
})();
