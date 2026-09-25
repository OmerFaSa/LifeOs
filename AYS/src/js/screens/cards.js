/* Tekrar — aralikli tekrar oturumu, kart yonetimi ve yanlis defteri.

   Yazim bicimi: STIL.md. Ekran string birlestirme kullanmaz. */

window.R = window.R || {};
R.Screens = R.Screens || {};

R.Screens.cards = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map } = R.h;
  const K = R.C;

  const STAGES = ['yeni', '+1 gün', '+3 gün', '+1 hafta', '+1 ay'];
  const RATINGS = [
    { rating:'forgot', label:'Hatırlamadım', key:'1', tone:'danger' },
    { rating:'hard', label:'Zorlandım', key:'2', tone:null },
    { rating:'remembered', label:'Hatırladım', key:'3', tone:'primary' },
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
      arkaAd:hata ? 'Yanlış notu' : 'Cevap', cevrik:flipped, act:'flip', data:{ 'data-id':card.id } }));
    return html`<div class="flashcard" data-act="flip" data-id="${card.id}">
      <span class="flashcard__side">${(flipped ? 'Arka yüz' : 'Ön yüz') + (card.topic ? ' · '+card.topic : '')}</span>
      <span class="flashcard__text">${flipped ? (card.back || '—') : card.front}</span></div>`;
  }

  /* 065 TEKRAR TAKVİMİ ÇİZGİSİ: kartın aralıkları R.SRS_INTERVALS'tan
     (kod), geçilen aşamalar dolu, sıradaki parlıyor. */
  function takvimCizgisi(card){
    if(!VT()) return '';
    const gun = card.dueAt ? U.diffDays(U.todayISO(), card.dueAt) : null;
    const not = gun == null ? '' : gun <= 0 ? 'sıradaki tekrar bugün' : 'sıradaki tekrar ' + gun + ' gün sonra';
    return '<div class="mt-12">' + VT().tekrarTakvimi({ adimlar:R.SRS_INTERVALS, asama:Math.min(card.stage || 0, R.SRS_INTERVALS.length),
      baslik:card.source === 'error' ? 'Yanlış · tekrar günleri' : 'Tekrar günleri', etiket:card.topic || '', not }) + '</div>';
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
    if(kalan > 0) konular.push({ ad:'Diğer', n:kalan, dk:Math.max(1, Math.round(kalan * KART_SN / 60)) });
    return K.Kutu({ ad:'Tekrar paketi', yuva:'tahmin', class:'vkutu', govde:raw(VT().tekrarPaketi({ konular,
      dakika:Math.max(1, Math.round(due.length * KART_SN / 60)), act:'paket-baslat', dugme:'Paketi başlat' })) });
  }

  /* ---------- due oturumu ---------- */

  function dueSession(){
    const due = C.dueCards().sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    if(!due.length){
      return K.Card({ body:K.Empty({ icon:'cards',
        text:'Bugün için bekleyen kart yok. Kartlar deneme analizinden otomatik üretilir; elle de ekleyebilirsin.',
        action:K.Button({ label:'Kart ekle', icon:'plus', tone:'primary', act:'new-card' }) }) });
    }

    const card = due[0];
    const flipped = !!S.ui.flipped[card.id];
    const doneToday = S.cards.filter(c => c.lastReviewedAt === U.todayISO()).length;
    const late = card.dueAt < U.todayISO();

    return K.Card({ body:html`
      <div class="row between mb-10">
        <span class="small muted">${due.length} kart bekliyor${late ? ' · bu kart '+U.relativeDay(card.dueAt) : ''}</span>
        <span class="small dim">bugün ${doneToday} tekrar yapıldı</span>
      </div>
      ${K.Meter({ label:'Oturum ilerlemesi', value:U.pct(doneToday, doneToday+due.length),
        text:doneToday+' / '+(doneToday+due.length) })}

      <div class="mt-14">${kartYuzu(card, flipped)}</div>
      ${when(!flipped, () => html`<p class="tiny dim mt-6">Dokun veya boşluk tuşuna bas.</p>`)}
      ${raw(takvimCizgisi(card))}

      ${flipped
        ? html`<div class="row mt-12 gap-8">${map(RATINGS, r => html`
            <button class="${'btn grow' + (r.tone ? ' btn--'+r.tone : '')}" data-act="rate"
              data-id="${card.id}" data-rating="${r.rating}">
              <span>${r.label}</span><span class="tiny dim">${r.key}</span></button>`)}</div>`
        : K.Button({ label:'Cevabı göster', block:true, class:'mt-12', act:'flip', data:{ 'data-id':card.id } })}

      <div class="row between mt-10">
        <span class="tiny dim">Aşama: ${stageLabel(card.stage)}${card.source === 'error' ? ' · deneme hatasından' : ''}</span>
        ${K.Button({ label:'Düzenle', icon:'edit', size:'sm', tone:'ghost', act:'edit-card', data:{ 'data-id':card.id } })}
      </div>` });
  }

  /* ---------- tum kartlar ---------- */

  function allCards(){
    if(!S.cards.length){
      return K.Card({ body:K.Empty({ icon:'cards', text:'Henüz kart yok.',
        action:K.Button({ label:'Kart ekle', icon:'plus', tone:'primary', act:'new-card' }) }) });
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
        aria:'kartı düzenle', act:'edit-card', data:{ 'data-id':c.id } })}</div>`,
    ]);

    const body = html`
      <div class="row between wrap mb-10 gap-8">
        ${K.Input({ class:'input--search', placeholder:'Kartlarda ara…', value:S.ui.cardQuery || '',
          aria:'kartlarda ara', change:'card-search', data:{ 'data-debounce':220 } })}
        <span class="small dim">${list.length} / ${S.cards.length} kart</span>
      </div>
      ${list.length
        ? html`${K.Table({ tight:true, rows, headers:['Kart', 'Aşama', 'Sonraki', ''] })}
               ${K.Pager({ page:pg.page, pages:pg.pages, total:pg.total, act:'card-page' })}`
        : K.Empty({ icon:'search', text:'“'+(S.ui.cardQuery || '')+'” için kart bulunamadı.',
            action:K.Button({ label:'Aramayı temizle', size:'sm', act:'card-search-clear' }) })}`;

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
            : K.Badge({ label:'etiket yok', tone:'warn' })}
          ${when(e.status, () => K.Badge({ label:e.status, tone:'muted' }))}</div>
        <span class="tiny dim">${source}${e.questionNo ? ' · soru '+e.questionNo : ''}</span>
      </div>
      ${when(e.soru, () => html`<div class="small">${String(e.soru).slice(0, 240)}</div>`)}
      ${when(e.senin && e.anahtar, () => html`<div class="tiny dim">Senin cevabın ${e.senin} · doğru cevap ${e.anahtar}</div>`)}
      ${when(!R.ERROR_TAGS[e.tag], () => html`<div class="stack-xs">
        <div class="tiny dim">Hatanın türünü sen seç; seçmeden reçeteye ve hata dağılımına girmez.</div>
        ${K.Row(Object.keys(R.ERROR_TAGS).map(k => K.Button({ label:k + ' · ' + R.ERROR_TAGS[k].name,
          size:'sm', tone:'ghost', act:'error-tag', data:{ 'data-id':e.id, 'data-tag':k } })), { wrap:true })}
      </div>`)}
      ${when(e.rootCause, () => html`<div class="small"><span class="dim">Kök neden:</span> ${e.rootCause}</div>`)}
      ${when(e.principle, () => html`<div class="small"><span class="dim">Doğru ilke:</span> ${e.principle}</div>`)}
      ${when(not, () => html`<div class="row-sm">${K.Button({ label:'Konunun notu: ' + not.title,
        size:'sm', tone:'ghost', act:'note-goto', data:{ 'data-id':not.id } })}</div>`)}
      ${K.Row([
        K.Chip('Reçete: ' + (e.recipe || '—')),
        when(e.similar, () => K.Chip('Benzer: ' + e.similar)),
        when(e.seconds, () => K.Chip(e.seconds + ' sn')),
      ], { wrap:true })}
      <div class="tiny dim">Tekrar tarihleri: ${dueDates}</div>
      ${when(!e.closedAt && String(e.principle || e.recipe || '').trim()
        && !(S.cards || []).some(c => c.sourceRef === e.id), () => html`<div class="row gap-8 mt-4">
        ${K.Button({ label:'Tekrar kartı yap', size:'sm', tone:'primary', icon:'plus',
          act:'error-card', data:{ 'data-id':e.id } })}
        <span class="tiny dim">İlk tekrar yarın; istersen geri alırsın.</span>
      </div>`)}
      <div class="row between mt-4">
        ${e.repairDoneAt
          ? K.Badge({ label:'reçete yapıldı', tone:'ok' })
          : K.Button({ label:'Reçeteyi tamamla', size:'sm', act:'repair-done', data:{ 'data-id':e.id } })}
        ${e.closedAt
          ? K.Badge({ label:'kapandı · '+U.fmtShort(R.U.gunOf(e.closedAt)), tone:'ok' })
          : K.Button({ label:'Kapat (çözümsüz doğru)', size:'sm', act:'close-error', data:{ 'data-id':e.id } })}
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
          ? 'Kapanmış kayıtlar (' + closed.length + ')' : 'Açık kayıtlar (' + open.length + ')'}</span>
          ${K.Button({ label:showClosed ? 'Açıkları göster (' + open.length + ')'
            : 'Kapanmışları göster (' + closed.length + ')', size:'sm', tone:'ghost',
            act:'notebook-filter', data:{ 'data-value':showClosed ? '0' : '1' } })}</div>`,
        list.length
          ? html`${K.Stack(map(pg.items, NotebookItem), 'sm')}
                 ${K.Pager({ page:pg.page, pages:pg.pages, total:pg.total, act:'nb-page' })}`
          : K.Card({ body:K.Empty({ icon:'list',
              text:showClosed ? 'Henüz kapanmış kayıt yok.'
                : 'Açık yanlış yok. Deneme analizinde etiketlenen her hata buraya düşer.' }) }),
      ])),
      K.Span(4, K.Stack([
        K.Card({ title:'Defter alanları', hint:'notebook', sub:'Her kayıtta doldurulacak alanlar',
          body:K.Table({ tight:true, headers:['Alan', 'Yazılacak bilgi'],
            rows:R.NOTEBOOK_FIELDS.map(f => [html`<b class="small">${f[0]}</b>`, html`<span class="small muted">${f[1]}</span>`]) }) }),
        K.Card({ title:'Kapanış ölçütü', body:html`<p class="small muted">Soru, çözüme bakılmadan doğru
          yapıldıysa ve süre uygunsa kapanır. Çözüme bakılarak yapılan soru “doğru” değil,
          “öğrenme sorusu” sayılır.</p>` }),
      ])),
    ]);
  }

  /* ---------- kart formu ---------- */

  function cardSheet(cardId){
    const card = cardId ? S.cards.find(c => c.id === cardId) : null;
    const subjectOptions = [{ value:'', label:'— ders —' }].concat(R.SUBJECTS.map(s => ({ value:s.id, label:s.name })));

    const body = K.Stack([
      K.Notice({ tone:'info', body:'Kart geri çağırma gerektirmeli: “Mitokondri nedir?” yerine '
        + '“Oksijenli solunum basamaklarını yer ve ürünle eşleştir”.' }),
      K.Field({ label:'Ön yüz — soru',
        input:K.Textarea({ id:'cf-front', rows:2, value:card ? card.front : '', placeholder:'Geri çağırma gerektiren soru' }) }),
      K.Field({ label:'Arka yüz — cevap / ilke',
        input:K.Textarea({ id:'cf-back', rows:2, value:card ? card.back : '', placeholder:'Kısa ve genellenebilir' }) }),
      K.Cols(2, [
        K.Field({ label:'Konu', input:K.Input({ id:'cf-topic', value:card ? card.topic : '' }) }),
        K.Field({ label:'Ders', input:K.Select({ id:'cf-subject', options:subjectOptions, value:card ? card.subjectId : '' }) }),
      ]),
      when(card, () => K.Cols(2, [
        K.Field({ label:'Aşama', input:K.Select({ id:'cf-stage', value:card.stage,
          options:STAGES.map((label, value) => ({ value, label })) }) }),
        K.Field({ label:'Sonraki tekrar', input:K.Input({ id:'cf-due', type:'date', value:card.dueAt }) }),
      ])),
    ]);

    UI.sheet({
      title:card ? 'Kartı düzenle' : 'Kart oluştur',
      body:String(body),
      footer:String(html`
        ${when(card, () => K.Button({ label:'Sil', tone:'danger', act:'delete-card', data:{ 'data-id':card.id } }))}
        ${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-card', data:card ? { 'data-id':card.id } : {} })}`),
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
    return K.Kutu({ ad:'Gelecek yük', yuva:'hesaplandı',
      govde:raw(G.yukHtml({ gunler, bugun, birim:'kart', etiket:'Önümüzdeki 7 günün vadesi' })) });
  }

  function bolumler(){
    return [
      { id:'due', ad:'Bugünün kartları', sayi:C.dueCards().length,
        govde:html`${gelecekYuk()}<div class="cardsgrid">${K.Stack(dueSession())}<div>${K.Stack([tekrarPaketi(C.dueCards()), sidebar()])}</div></div>` },
      { id:'notebook', ad:'Yanlış defteri', sayi:C.openErrors().length, govde:notebook() },
      { id:'all', ad:'Bütün kartlar', sayi:S.cards.length, govde:K.Stack(allCards()) },
    ];
  }

  function header(){
    const debt = C.cardDebt();
    const overdue = C.overdueCards().length;
    if(debt <= 10) return '';
    return K.Span(12, K.Notice({ tone:'warn', title:'Tekrar borcu %'+debt+'.',
      body:'Gecikmiş '+overdue+' kart var. %10 üzerindeki borçta yeni kart üretimi azaltılır; önce borcu sadeleştir.' }));
  }

  function sidebar(){
    const debt = C.cardDebt();
    const due = C.dueCards().length;
    return html`<div>${K.Stack([
      K.Cols(2, [
        K.Stat({ label:'Due', value:due, tone:due ? null : 'ok' }),
        K.Stat({ label:'Borç', value:'%'+debt, tone:debt > 10 ? 'warn' : 'ok',
          progress:debt, note:'hedef ≤%10' }),
      ]),
      /* Aciklama tek satira sigmiyordu ve yarida kesiliyordu; gun etiketi
         ustte, aciklama altinda tam metin olarak durur. */
      K.Card({ title:'Tekrar takvimi', hint:'srs', sub:'Aralıklar sabittir',
        body:html`<div class="srslist">${map(R.SRS_PROTOCOL, p => html`
          <div class="srsrow">
            <b class="srsrow__day">${p.day}</b>
            <span class="srsrow__detail">${p.detail}</span>
          </div>`)}</div>` }),
    ])}</div>`;
  }

  async function render(){
    return String(K.Grid([
      header(),
      K.Span(12, K.SayfaBolumleri({ act:'card-tab', aria:'Tekrar bölümleri', bolumler:bolumler() })),
      K.Span(12, raw(UI.rail(['srs', 'card-debt', 'recall', 'notebook']))),
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
      UI.toast('Sonraki tekrar: '+U.fmtShort(card.dueAt));
      R.App.render();
    },
    async 'new-card'(){ cardSheet(); },
    async 'edit-card'(el){ cardSheet(el.dataset.id); },
    async 'save-card'(el){
      const id = el.dataset.id;
      const existing = id ? S.cards.find(c => c.id === id) : null;
      const front = document.getElementById('cf-front').value.trim();
      if(!front){ UI.toast('Ön yüz boş olamaz'); return; }
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
      UI.toast(existing ? 'Kart güncellendi' : 'Kart eklendi');
      R.App.render();
    },
    async 'delete-card'(el){
      await M.deleteCard(el.dataset.id);
      UI.closeSheet();
      UI.toast('Kart silindi');
      R.App.render();
    },
    async 'close-error'(el){
      const err = S.errors.find(e => e.id === el.dataset.id);
      err.closedAt = new Date().toISOString();
      await M.saveError(err);
      UI.toast('Yanlış kapatıldı');
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
      UI.toast('Etiket: ' + t.name);
      R.App.render();
    },
    /* Tek dokunuş tekrar kartı (fikir 22): Ofis'in «card-from-error» önerisiyle
       AYNI eylem; doğrulanır, yazılır, «Geri al» ile geri alınır. */
    async 'error-card'(el){
      const r = await R.Proposals.hemen({ action:'card-from-error', agent:'analist',
        params:{ errorId:el.dataset.id }, reason:'Yanlış defterinden tek dokunuş.' });
      if(!r.ok){ UI.toast(r.why || 'Kart üretilemedi'); return; }
      UI.toast('Tekrar kartı eklendi; ilk tekrar yarın', { undo:async () => {
        await R.Proposals.undo(r.row.id);
        UI.toast('Kart geri alındı');
        R.App.render();
      } });
      R.App.render();
    },
    async 'note-goto'(el){ S.ui.noteOpen = el.dataset.id; R.App.go('learn'); },
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
    title:'Tekrar',
    subtitle(){
      return C.dueCards().length+' kart due · borç %'+C.cardDebt()+' · '+C.openErrors().length+' açık yanlış';
    },
    actions(){
      return String(K.Button({ label:'Kart ekle', icon:'plus', size:'sm', act:'new-card' }));
    },
    render, afterRender, handle, change, onKey,
  };
})();
