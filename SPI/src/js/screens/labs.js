/* Testler — Modül 1'in ekranı.

   Önceki düzen ölçümleri ORGANA göre kutuluyordu: on iki panel, her biri
   açılır bir kutu, her kutunun içinde birkaç satır. Kullanıcı elinde tek
   bir hastane raporuyla gelir; o rapor organa göre değil, tek seferde
   çıkar. Panel panel gezinmek zorunda kalmak işi zorlaştırıyordu.

   Yeni düzen dört sayfadır:

     Sonuçlar  bütün ölçümler TEK düz listede, önem sırasına göre
     Test gir  kapsamlı bir hastane testinin tamamı tek formda
     Geçmiş    girilen test oturumları
     Eğilim    tek bir ölçümün kendi geçmişindeki yönü

   Panel artık bir yapı değil, bir SÜZGEÇtir: listeyi daraltır, listeyi
   bölmez. Girişte ise hiç yoktur — arama kutusu onun yerini alır. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};

SP.Screens.labs = (function(){
  const U = SP.U, M = SP.Model, S = SP.S, UI = SP.UI;
  const { html, raw, when, map, cls } = SP.h;
  const K = SP.C, P = SP.Parts;

  const TABS = [
    { id:'sonuc',  label:'Sonuçlar',     icon:'layers' },
    { id:'giris',  label:'Test gir',     icon:'flask' },
    { id:'gecmis', label:'Geçmiş',       icon:'clock' },
    { id:'kiyas',  label:'Karşılaştır',  icon:'chart' },
    { id:'ilac',   label:'İlaç',         icon:'flask' },
    { id:'trend',  label:'Eğilim',       icon:'chart' },
  ];

  /* Yapistirma onizlemesi oturum boyunca burada durur; kaydedilene kadar
     hicbir sey depoya yazilmaz. */
  let preview = null;

  /* Girise yazilan ama henuz kaydedilmemis degerler. Sekme degistirip
     geri donunce kaybolmasin diye ekranin disinda tutulur. */
  let draft = { date:U.todayISO(), lab:'', values:{}, fasting:'unknown', time:'' };

  /* Alt sayfadaki ilaç kaydı — kaydedilene kadar depoya hiçbir şey yazılmaz. */
  let medDraft = null;

  function tabs(){
    const items = TABS.map(t => {
      if(t.id === 'gecmis' && S.labs.length) return Object.assign({}, t, { count:S.labs.length });
      if(t.id === 'ilac'){
        const n = SP.Meds.activeList().length;
        if(n) return Object.assign({}, t, { count:n });
      }
      if(t.id === 'kiyas' && S.labs.length >= 2){
        /* Rozette oturum sayısı değil GERÇEK DEĞİŞİM sayısı durur:
           sekmenin orada olması haber değil, orada iş olması haber. */
        const b2 = S.labs[S.labs.length - 1], a2 = S.labs[S.labs.length - 2];
        const n = compareRows(a2, b2)
          .filter(r => r.kind === 'diff' && r.change && r.change.meaningful).length;
        if(n) return Object.assign({}, t, { count:n });
      }
      const n = Object.keys(draft.values).length;
      if(t.id === 'giris' && n) return Object.assign({}, t, { count:n });
      return t;
    });
    return K.Subtabs({ items, value:S.ui.labTab, act:'lab-tab', aria:'Test görünümü' });
  }

  /* ------------------------------------------------------------ süzgeç */

  /* Ölçümü olan panel yoksa süzgeç çizilmez: boş bir süzgeç şeridi
     kullanıcıya seçenek değil, iş verir. */
  function panelFilter(){
    const counts = {};
    SP.BIOMARKERS.forEach(b => {
      if(!M.latestOf(b.id)) return;
      counts[b.panel] = (counts[b.panel] || 0) + 1;
    });
    const used = SP.PANELS.filter(p => counts[p.id]);
    if(used.length < 2) return '';

    const items = [{ id:'all', label:'Tümü', count:SP.Bio.summary().measured }]
      .concat(used.map(p => ({ id:p.id, label:p.name.replace(/\s*paneli$/i, ''), count:counts[p.id] })));
    return K.Subtabs({ items, value:S.ui.labFilter, act:'lab-filter', aria:'Panel süzgeci' });
  }

  /* ---------------------------------------------------------- sonuçlar */

  /* Tek düz liste. Sıra: kırmızı bayrak → referans dışı → hedef dışı →
     hedefte. İçinde arama yapılır, panele göre daraltılır. */
  function resultRows(){
    const q = (S.ui.labQuery || '').trim().toLocaleLowerCase('tr-TR');
    const filter = S.ui.labFilter || 'all';
    const rank = { danger:0, warn:1, info:2, ok:3, muted:4 };

    return SP.BIOMARKERS
      .map(b => {
        const last = M.latestOf(b.id);
        if(!last) return null;
        return { marker:b, value:last.v, at:last.date, cert:last.cert,
          status:SP.Bio.statusOf(b.id, last.v), ref:SP.Bio.refFor(b.id) };
      })
      .filter(Boolean)
      .filter(r => filter === 'all' || r.marker.panel === filter)
      .filter(r => !q || r.marker.name.toLocaleLowerCase('tr-TR').indexOf(q) >= 0
        || (r.marker.aliases || []).some(a => a.toLocaleLowerCase('tr-TR').indexOf(q) >= 0))
      .sort((a, b) => (rank[a.status.tone] ?? 9) - (rank[b.status.tone] ?? 9)
        || a.marker.name.localeCompare(b.marker.name, 'tr'));
  }

  function resultsView(){
    const rows = resultRows();
    const total = SP.Bio.summary().measured;

    if(!total){
      return K.Ledger([K.Entry({
        label:'Sonuçlar', meta:'kayıt yok',
        note:'Elindeki hastane raporunu yapıştır ya da dosyasını bırak; '
          + 'değerler kendiliğinden şemaya oturur.',
        action:K.Button({ label:'Rapor yapıştır', tone:'primary', act:'open-paste' }),
        body:P.empty('Henüz hiç test girilmedi.'),
      })]);
    }

    const missing = SP.BIOMARKERS.filter(b => !M.latestOf(b.id));
    const s = SP.Bio.summary();
    const last = S.labs.length ? S.labs[S.labs.length - 1] : null;
    const pats = SP.Bio.patterns();

    return K.Ledger([
      K.Entry({
        label:'Sonuçlar',
        meta:total + ' ölçüm' + (last ? ' · ' + U.fmtDate(last.date) : ''),
        note:'Önem sırasına göre: önce bandın dışındakiler. Bir satıra '
          + 'tıklayınca referans aralığı, hedef bandı ve beslenme bağı açılır.',
        action:html`${K.Input({ id:'lab-q', value:S.ui.labQuery || '',
          placeholder:'Ölçüm ara…', aria:'Ölçüm ara', change:'lab-query', debounce:200 })}
          ${K.Button({ label:'Test gir', tone:'primary', act:'lab-tab',
            data:{ 'data-tab':'giris' } })}
          ${K.Button({ label:'Hekime götür', act:'open-doctor' })}`,
        body:html`
          ${when(panelFilter(), () => raw(String(panelFilter())))}
          ${when(!rows.length, () => K.Notice({ tone:'info',
            body:'Bu süzgeçle eşleşen ölçüm yok.' }))}
          ${when(rows.length, () => html`<div class="reslist">${map(rows, r => {
            const tr = SP.Bio.trendOf(r.marker.id);
            /* Tok karnına alınmış bir ölçüme durum etiketi basılmaz:
               sayı doğru olabilir ama gösterdiği şey değildir. */
            const yorum = SP.Bio.interpretable(r.marker.id);
            const ilac = SP.Meds.affecting(r.marker.id, r.at).length > 0;
            return html`
              <button class="resrow" data-act="open-marker" data-id="${r.marker.id}">
                <span class="resrow__dot resrow__dot--${r.status.tone}" aria-hidden="true"></span>
                <span class="resrow__name">
                  <b>${r.marker.name}</b>
                  <span class="resrow__panel">${SP.PANEL_BY_ID[r.marker.panel]
                    ? SP.PANEL_BY_ID[r.marker.panel].name.replace(/\s*paneli$/i, '') : ''}</span>
                </span>
                <span class="resrow__val num">${U.fmtNum(r.value)}<small>${r.marker.unit}</small></span>
                <span class="resrow__bar">${when(r.ref,
                  () => raw(UI.rangeBar(r.value, r.ref.ref, r.ref.optimal, r.marker.unit, { bare:true })))}</span>
                <span class="resrow__status">${when(yorum.ok,
                  () => K.Badge({ label:r.status.label, tone:r.status.tone }),
                  () => K.Badge({ label:yorum.label, tone:'muted', icon:false }))}
                  ${when(ilac, () => html`<span class="resrow__ilac"
                    title="Bu ölçümü etkileyen bir şey kullanıyorsun">℞</span>`)}</span>
                <span class="resrow__trend tiny dim">${when(tr.ok,
                  () => html`${raw(UI.trend(tr.dir))}`)} ${r.at ? U.fmtShort(r.at) : ''}</span>
              </button>`;
          })}</div>`)}`,
      }),

      /* BİRLİKTE OKUMA. Tek ölçüm yanıltır, örüntü yanıltmaz. Bu blok
         hiçbir yeni sayı üretmez: var olan değerleri yan yana koyup ne
         anlama geldiklerini söyler ve hangi ölçümlerden geldiğini yazar.
         Örüntü yoksa blok hiç çizilmez — boş bir başlık iş yaratır. */
      when(pats.length, () => K.Entry({
        label:'Birlikte okuma', meta:pats.length + ' örüntü',
        note:'Bu satırlar yeni bir ölçüm değil; var olan ölçümlerin '
          + 'birbirine ne söylediği. Hiçbiri teşhis değildir.',
        body:html`<div class="stack">${map(pats, pt => K.Notice({
          tone:pt.tone, title:pt.title,
          body:html`${pt.text}
            <div class="chips mt-8">${map(pt.markers, id => html`
              <button class="chip" data-act="open-marker" data-id="${id}">
                ${SP.BIO_BY_ID[id] ? SP.BIO_BY_ID[id].name : id}</button>`)}</div>` }))}</div>`,
      })),

      K.Entry({
        label:'Dağılım', meta:'durum sayımı',
        note:'Referans aralığı laboratuvarın normal saydığı yer; hedef bandı '
          + 'ise bu sistemin istediği daha dar yer. İkisi aynı şey değildir.',
        body:html`<div class="pair">
          <div>
            <div class="sidestat"><span class="sidestat__v">${s.measured}</span>
              <span class="sidestat__k">ölçüldü</span></div>
            <div class="sidestat"><span class="sidestat__v">${s.out}</span>
              <span class="sidestat__k">referans dışı</span></div>
          </div>
          <div>
            <div class="sidestat"><span class="sidestat__v">${s.offTarget}</span>
              <span class="sidestat__k">hedef dışı</span></div>
            <div class="sidestat"><span class="sidestat__v">${S.labs.length}</span>
              <span class="sidestat__k">test oturumu</span></div>
          </div>
        </div>`,
      }),

      when(missing.length, () => K.Entry({
        label:'Ölçülmemiş', meta:missing.length + ' ölçüm',
        note:'Bu ölçümler için hiç değer girilmedi. Eksik veri sıfır sayılmaz; '
          + 'hesaplarda yok kabul edilir.',
        body:html`<div class="chips">${map(missing, b => html`
          <span class="chip chip--muted">${b.name}</span>`)}</div>`,
      })),
    ]);
  }

  /* ---------------------------------------------------------- test gir

     Kapsamlı bir hastane testi tek formda girilir. Panel seçimi yoktur:
     rapor elinde nasıl duruyorsa öyle, yukarıdan aşağı yazılır. Arama
     kutusu uzun listeyi anında daraltır. */

  function entryView(){
    const q = (S.ui.labQuery || '').trim().toLocaleLowerCase('tr-TR');
    /* Yalnız hesaplanan ölçümler forma girilmez — onları elle yazmak
       formülü ezmek olurdu. Ama LDL ve eGFR hem laboratuvarda ölçülür
       hem hesaplanır; onlar formda durur ve girilen değer hesabı ezer. */
    const list = SP.BIOMARKERS.filter(b => {
      const d = SP.DERIVED[b.id];
      return !d || d.measured;
    }).filter(b => !q
      || b.name.toLocaleLowerCase('tr-TR').indexOf(q) >= 0
      || (b.aliases || []).some(a => a.toLocaleLowerCase('tr-TR').indexOf(q) >= 0));

    const filled = Object.keys(draft.values).length;

    return K.Ledger([
      K.Entry({
        label:'Oturum', meta:'tarih ve laboratuvar',
        note:'Aynı tarihe ikinci kez girilen değerler o oturumun üstüne yazılır.',
        action:K.Button({ label:'Rapor yapıştır', icon:'flask', tone:'primary',
          act:'open-paste' }),
        body:html`
          <div class="pair">
            ${K.Field({ label:'Test tarihi',
              input:K.Input({ id:'entry-date', type:'date', value:draft.date, change:'entry-date' }) })}
            ${K.Field({ label:'Laboratuvar', hint:'isteğe bağlı',
              input:K.Input({ id:'entry-lab', value:draft.lab, placeholder:'Hangi laboratuvar?',
                change:'entry-lab' }) })}
          </div>
          <div class="pair mt-12">
            ${K.Field({ label:'Kan aç karnına mı alındı?',
              hint:'glukoz, insülin ve trigliserit buna bağlı',
              input:K.Select({ id:'entry-fasting', value:draft.fasting, change:'entry-fasting',
                options:[
                  { value:'unknown', label:'Bilmiyorum' },
                  { value:'yes', label:'Evet — aç karnına' },
                  { value:'no', label:'Hayır — tok' }] }) })}
            ${K.Field({ label:'Saat', hint:'isteğe bağlı',
              input:K.Input({ id:'entry-time', type:'time', value:draft.time,
                change:'entry-time' }) })}
          </div>
          ${when(draft.fasting === 'no', () => K.Notice({ tone:'warn', class:'mt-10',
            title:'Tok ölçüm:', body:'Açlık glukozu, insülin, trigliserit ve onlardan '
              + 'hesaplanan TyG, TG/HDL ve LDL için durum etiketi basılmayacak. '
              + 'Sayılar kaydedilir; yorum yapılmaz.' }))}
          ${when(draft.fasting === 'unknown', () => K.Notice({ tone:'info', class:'mt-10',
            body:'Bilinmiyorsa değerler aç karnına alınmış varsayılır ve bu ölçüm '
              + 'sayfasında açıkça yazılır. Sistem sessizce varsaymaz.' }))}`,
      }),

      K.Entry({
        label:'Değerler', meta:list.length + ' satır',
        note:'Elindeki rapordaki bütün değerleri tek seferde yaz. Boş bıraktığın '
          + 'satır yok sayılır — sıfır olarak kaydedilmez.',
        action:K.Input({ id:'entry-q', value:S.ui.labQuery || '',
          placeholder:'Ölçüm ara…', change:'lab-query', debounce:200 }),
        body:html`
          ${when(!list.length, () => K.Notice({ tone:'info',
            body:'Bu adla bir ölçüm bulunamadı.' }))}
          <div class="entrygrid">${map(list, b => {
            const has = draft.values[b.id] != null;
            const lastv = M.latestOf(b.id);
            return html`
              <label class="${cls('entryrow', has && 'is-filled')}">
                <span class="entryrow__name">${b.name}
                  <span class="entryrow__unit">${b.unit}</span></span>
                <input class="entryrow__in num" type="number" step="any" inputmode="decimal"
                  id="e-${b.id}" data-change="entry-val" data-id="${b.id}"
                  value="${has ? draft.values[b.id] : ''}"
                  placeholder="${lastv ? U.fmtNum(lastv.v) : '—'}"
                  aria-label="${b.name + ' (' + b.unit + ')'}"/>
              </label>`;
          })}</div>
          <div class="entrybar">
            <span class="small">${filled ? filled + ' değer yazıldı' : 'Henüz değer yazılmadı'}
              ${when(filled, () => html`<span class="dim"> · kaydedilene kadar hiçbir şey yazılmaz</span>`)}</span>
            <span class="row-sm">
              ${when(filled, () => K.Button({ label:'Temizle', size:'sm', act:'entry-clear' }))}
              ${K.Button({ label:'Testi kaydet', tone:'primary', act:'entry-save', disabled:!filled })}
            </span>
          </div>`,
      }),
    ]);
  }

  /* ------------------------------------------------------------- eğilim */

  function trendView(){
    const id = S.ui.trendMarker;
    const b = SP.BIO_BY_ID[id];
    const series = M.seriesOf(id);
    const tr = SP.Bio.trendOf(id);
    const vd = SP.Bio.trendVerdict(id, tr);
    const r = SP.Bio.refFor(id);

    const measured = SP.BIOMARKERS.filter(x => M.seriesOf(x.id).length);
    const options = (measured.length ? measured : SP.BIOMARKERS)
      .map(x => ({ value:x.id, label:x.name }));

    return K.Ledger([
      K.Entry({
        wide:true,
        label:b ? b.name : 'Eğilim',
        meta:series.length + ' ölçüm',
        note:'Bir ölçüm başkasıyla değil, KENDİ geçmişiyle kıyaslanır. '
          + 'Yön en az ' + SP.Bio.MIN_POINTS + ' ölçümle söylenir.',
        action:K.Select({ value:id, change:'pick-marker', options }),
        body:html`
          ${when(series.length < 2, () => K.Notice({ tone:'info',
            body:'Grafik için en az iki ölçüm gerekir. Şu an ' + series.length + ' var.' }))}
          ${when(series.length >= 2, () => html`
            ${raw(UI.lineChart([{ data:series.map(s2 => s2.v) }], {
              labels:series.map(s2 => U.fmtShort(s2.date)),
              band:r && r.optimal ? r.optimal : (r ? r.ref : null),
              height:230,
            }))}
            <div class="pair">
              <div>
                <div class="sidestat"><span class="sidestat__v">${U.fmtNum(series[series.length - 1].v)}<small>${b.unit}</small></span>
                  <span class="sidestat__k">son değer</span></div>
              </div>
              <div>
                <div class="sidestat"><span class="sidestat__v">${tr.ok ? (tr.pct > 0 ? '+' : '') + U.fmtNet(tr.pct) : '—'}<small>%</small></span>
                  <span class="sidestat__k">90 günde</span></div>
              </div>
            </div>
            ${K.Notice({ tone:vd.tone === 'muted' ? 'info' : vd.tone,
              body:tr.ok ? vd.text : tr.note })}
            ${when(r && r.ref, () => raw(UI.rangeBar(series[series.length - 1].v, r.ref, r.optimal, b.unit)))}
            <p class="small muted">${b.note}</p>`)}`,
      }),
    ]);
  }

  function markerSheetBody(id){
    const b = SP.BIO_BY_ID[id];
    const series = M.seriesOf(id);
    const r = SP.Bio.refFor(id);
    const tr = SP.Bio.trendOf(id);
    const vd = SP.Bio.trendVerdict(id, tr);
    const last = series.length ? series[series.length - 1] : null;
    const base = SP.Bio.baselineOf(id);
    /* Son iki ölçüm arasındaki fark gürültüden büyük mü? */
    const chg = series.length >= 2
      ? SP.Bio.meaningfulChange(id, series[series.length - 2].v, last.v)
      : null;
    const pats = SP.Bio.patterns().filter(p2 => p2.markers.indexOf(id) >= 0);
    const yorum = SP.Bio.interpretable(id);
    const ilacNotu = SP.Meds.markerNote(id, last ? last.date : null);
    const bozan = SP.Meds.distorts(id, last ? last.date : null);

    return String(K.Stack([
      when(last, () => html`<div class="markerrow">
        <div class="markerrow__head"><span class="markerrow__name">${b.name}</span>
          ${K.Badge({ label:SP.Bio.statusOf(id, last.v).label, tone:SP.Bio.statusOf(id, last.v).tone })}</div>
        <div class="markerrow__val num">${U.fmtNum(last.v)}<small>${b.unit}</small></div>
        <div class="markerrow__bar">${raw(UI.rangeBar(last.v, r.ref, r.optimal, b.unit))}</div>
        <p class="markerrow__note">${SP.Bio.statusNote(id, last.v)}</p>
      </div>`),
      K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
        ['Referans aralığı', r.ref ? U.fmtNum(r.ref[0]) + ' – ' + U.fmtNum(r.ref[1]) + ' ' + b.unit : '—'],
        ['Hedef bant', r.optimal ? U.fmtNum(r.optimal[0]) + ' – ' + U.fmtNum(r.optimal[1]) + ' ' + b.unit : 'tanımlı değil'],
        ['Kırmızı bayrak', [r.red.below != null ? '< ' + r.red.below : null,
          r.red.above != null ? '> ' + r.red.above : null].filter(Boolean).join(' · ') || 'tanımlı değil'],
        ['Eğilim', tr.ok ? vd.text : tr.note],
        ['Ölçüm sayısı', String(series.length)],
      ] }),
      /* İLAÇ VE AÇLIK — değeri yorumlamadan önce okunması gerekenler.
         Kişisel taban çizginin üstünde durur çünkü «gerçekten değişti»
         demeden önce «neden değişti» sorulmalı. */
      when(ilacNotu, () => K.Notice({ tone:ilacNotu.tone, title:ilacNotu.title + ':',
        body:ilacNotu.text })),
      when(bozan, () => K.Notice({ tone:'warn', title:'Bu ölçüm şu an yorumlanmaz:',
        body:bozan.text })),
      when(yorum.state === 'no' || yorum.state === 'unknown', () => K.Notice({
        tone:yorum.state === 'no' ? 'warn' : 'info',
        title:yorum.state === 'no' ? 'Tok ölçüm:' : 'Açlık durumu bilinmiyor:',
        body:yorum.note })),

      /* KİŞİSEL TABAN ÇİZGİ. Referans aralığı nüfusun, hedef bandı
         sistemin; bu ikisi de senin değil. Üç ölçümden sonra kendi
         ortalaman ve saçılman çıkar ve bir değişimin gerçek mi gürültü
         mü olduğu söylenebilir. */
      when(base.ok, () => K.Card({
        title:'Kendi taban çizgin', sub:base.n + ' ölçümün ortalaması',
        body:html`
          ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
            ['Ortalaman', U.fmtNum(base.mean) + ' ' + b.unit],
            ['Saçılman (± 1 SS)', U.fmtNum(base.low) + ' – ' + U.fmtNum(base.high) + ' ' + b.unit],
            ['En düşük / en yüksek', U.fmtNum(base.min) + ' – ' + U.fmtNum(base.max) + ' ' + b.unit],
          ] })}
          ${when(chg && chg.ok, () => K.Notice({
            tone:chg.meaningful ? (chg.good === false ? 'warn' : 'info') : 'info',
            title:chg.meaningful ? 'Son değişim gerçek:' : 'Son değişim gürültü sayılır:',
            body:'Önceki ölçüme göre ' + (chg.diff > 0 ? '+' : '') + U.fmtNum(chg.diff)
              + ' ' + b.unit + '. ' + chg.note }))}
          <p class="small muted mt-8">Bir değişim kendi saçılmandan küçükse
            «değişti» denmez: laboratuvarın hata payı ve günden güne
            dalgalanma o kadarını zaten üretir.</p>`,
      })),
      when(!base.ok && series.length, () => K.Notice({ tone:'info',
        title:'Kişisel taban çizgi yok:', body:base.note })),

      when(pats.length, () => K.Card({
        title:'Bu ölçüm yalnız okunmaz',
        body:html`<div class="stack-sm">${map(pats, pt => K.Notice({
          tone:pt.tone, title:pt.title, body:pt.text }))}</div>`,
      })),

      when(b.nutrients && b.nutrients.length, () => K.Notice({ tone:'info',
        title:'Beslenme bağı:',
        body:b.nutrients.map(n => SP.NUTRI_BY_ID[n] ? SP.NUTRI_BY_ID[n].name : n).join(', ')
          + ' bu ölçümle ilişkilidir. Ölçüm hedefin altındaysa beslenme hedefi kendiliğinden yükselir.' })),
      html`<p class="small muted">${b.note}</p>`,
      when(b.derived, () => K.Notice({ tone:'info', title:'Hesaplanan ölçüm:',
        body:SP.DERIVED[b.derived].note + '. Girdilerden biri eksikse hiç yazılmaz.' })),
    ]));
  }

  /* ------------------------------------------------------- hekim çıktısı

     Tek sayfalık, yazdırılabilir özet. Bu sistemin dışarıya verdiği tek
     belgedir ve iki şeyi aynı anda yapmak zorundadır: hekimin işine
     yarayacak kadar eksiksiz olmak ve ne OLMADIĞINI en üstte söylemek.

     Bu yüzden sayfanın ilk satırı klinik sınırdır. İkinci satır
     kesinlik anahtarıdır: hangi sayının ölçüldüğü, hangisinin
     hesaplandığı yazmazsa hekim hesaplanmış bir LDL'yi ölçülmüş sanar.

     Yazdırma perdesi: `@media print` kuralları sayfanın geri kalanını
     gizler, yalnız bu blok basılır. */

  function doctorBody(){
    const p2 = S.profile || {};
    const yas = M.ageOf(p2);
    const last = S.labs.length ? S.labs[S.labs.length - 1] : null;
    const rows = SP.Bio.attention(p2);
    const pats = SP.Bio.patterns(p2);
    const flags = M.openFlags();
    const ov = SP.Bio.overdue();
    const ilaclar = SP.Meds.activeList();
    const acDurum = last ? (last.fasting || 'unknown') : 'unknown';

    const hucre = (b, cell) => {
      if(!cell || cell.v == null) return null;
      const st = SP.Bio.statusOf(b.id, cell.v, p2);
      const r = SP.Bio.refFor(b.id, p2);
      return [b.name,
        U.fmtNum(cell.v) + ' ' + b.unit,
        r && r.ref ? U.fmtNum(r.ref[0]) + '–' + U.fmtNum(r.ref[1]) : '—',
        st.label,
        SP.CERTAINTY[cell.cert] ? SP.CERTAINTY[cell.cert].label : cell.cert];
    };

    /* Bandın dışındakiler önce; sonra ölçülen geri kalan her şey.
       Hekim tabloyu baştan sona okur, ekranı süzgeçlemez. */
    const disinda = [], icinde = [];
    SP.BIOMARKERS.forEach(b => {
      const cell = M.latestOf(b.id);
      const sat = hucre(b, cell);
      if(!sat) return;
      const st = SP.Bio.statusOf(b.id, cell.v, p2);
      (st.id === 'ok' ? icinde : disinda).push(sat);
    });

    return String(html`<div id="print-root" class="printdoc">
      <div class="printdoc__head">
        <div>
          <b class="printdoc__title">Sağlık kayıt özeti</b>
          <span class="printdoc__sub">${U.fmtDate(U.todayISO())} tarihinde hazırlandı</span>
        </div>
        <div class="printdoc__who">
          ${when(p2.name, () => html`<b>${p2.name}</b>`)}
          <span>${yas != null ? yas + ' yaş' : 'yaş girilmemiş'} ·
            ${p2.sex === 'female' ? 'kadın' : 'erkek'}</span>
          ${when(p2.heightCm && p2.weightKg,
            () => html`<span>${U.fmtNum(p2.heightCm)} cm · ${U.fmtNum(p2.weightKg)} kg</span>`)}
        </div>
      </div>

      <p class="printdoc__limit"><b>Bu bir hekim raporu değildir.</b>
        ${SP.CLINICAL.disclaimer}</p>

      <p class="printdoc__key"><b>Kesinlik anahtarı —</b>
        <b>ölçüldü:</b> laboratuvar ölçtü ·
        <b>hesaplandı:</b> başka ölçümlerden formülle türetildi (formül ilgili
        satırda tanımlıdır) · <b>tahmin:</b> ev ölçüsünden kestirildi.
        Hesaplanan bir değer ölçülmüş gibi okunmamalıdır.</p>

      ${when(last, () => html`<p class="printdoc__meta">Son test oturumu:
        <b>${U.fmtDate(last.date)}</b>${when(last.lab, () => html` · ${last.lab}`)} ·
        açlık: <b>${FASTING_LABEL[acDurum] || acDurum}</b> ·
        ${S.labs.length} oturum kayıtlı</p>`)}
      ${when(acDurum === 'no', () => html`<p class="printdoc__limit">
        <b>Son oturum tok karnına alınmıştır.</b> Açlık glukozu, insülin,
        trigliserit ve bunlardan hesaplanan değerler bu tabloda durum etiketi
        taşımaz.</p>`)}

      ${when(ilaclar.length, () => html`
        <h3 class="printdoc__h">Kullanılan ilaç ve takviyeler</h3>
        <div class="tabloKap">${K.Table({ tight:true,
          headers:['Ad', 'Tür', 'Doz', 'Başlangıç'],
          rows:ilaclar.map(r => [r.name || SP.Meds.kindOf(r).name,
            SP.Meds.kindOf(r).name, r.dose || '—', U.fmtDate(r.startDate)]) })}</div>
        <p class="printdoc__note">Bu liste kullanıcının kendi girdisidir; sistem doz
          önermez ve ilaç kararı vermez. Ölçüm yorumlarında bu kayıtlar hesaba katılır.</p>`)}

      ${when(flags.length, () => html`
        <h3 class="printdoc__h">Açık kırmızı bayraklar</h3>
        <ul class="printdoc__list">${map(flags, f => html`
          <li><b>${f.label}</b> — ${f.detail}</li>`)}</ul>`)}

      ${when(disinda.length, () => html`
        <h3 class="printdoc__h">Referans ya da hedef bandının dışındakiler</h3>
        ${K.Table({ tight:true,
          headers:['Ölçüm', 'Değer', 'Referans', 'Durum', 'Kesinlik'], rows:disinda })}`)}

      ${when(pats.length, () => html`
        <h3 class="printdoc__h">Birlikte okunması gerekenler</h3>
        <ul class="printdoc__list">${map(pats, pt => html`
          <li><b>${pt.title}.</b> ${pt.text}</li>`)}</ul>`)}

      ${when(icinde.length, () => html`
        <h3 class="printdoc__h">Bandın içindeki ölçümler</h3>
        ${K.Table({ tight:true,
          headers:['Ölçüm', 'Değer', 'Referans', 'Durum', 'Kesinlik'], rows:icinde })}`)}

      ${when(ov.length, () => html`
        <h3 class="printdoc__h">Ölçülmemiş ya da tazelenmemiş paneller</h3>
        <p class="printdoc__note">${ov.map(o => o.panel.name).join(' · ')}</p>`)}

      <p class="printdoc__foot">Bu özet kişisel bir izleme sisteminden alınmıştır.
        Değerler kullanıcının kendi girdiği laboratuvar sonuçlarıdır; sistem
        ölçüm yapmaz. Teşhis ve tedavide karar hekimindir.</p>
    </div>`);
  }

  /* ------------------------------------------------------ ilaç ve takviye

     Sistem doz önermez, başlatmaz, kestirmez. Yalnızca ne kullanıldığını
     kaydeder ki bir ölçümdeki değişimin sebebi aranabilsin.

     Serbest metinden tür tahmin edilmez: kullanıcı bir tür seçer ve etki
     eşlemesi o türden gelir. «Ferrosanol» yazan bir kutudan demir çıkarımı
     yapmak, uydurmaktır. */

  function medsView(){
    const hepsi = SP.Meds.all();
    const etkin = SP.Meds.activeList();
    const gecmis = hepsi.filter(r => etkin.indexOf(r) < 0);

    const satir = (rec, aktif) => {
      const k = SP.Meds.kindOf(rec);
      const olcumler = k.affects
        .map(a => SP.BIO_BY_ID[a.id] ? SP.BIO_BY_ID[a.id].name : null)
        .filter(Boolean);
      return html`<div class="${cls('medrow', !aktif && 'is-past')}">
        <div class="medrow__ana">
          <b>${rec.name || k.name}</b>
          ${when(rec.name, () => html`<span class="tiny dim"> · ${k.name}</span>`)}
          ${when(rec.dose, () => html`<span class="tiny dim"> · ${rec.dose}</span>`)}
          <div class="tiny dim">${U.fmtDate(rec.startDate)}
            ${rec.endDate ? '→ ' + U.fmtDate(rec.endDate) : '→ sürüyor'}</div>
          ${when(olcumler.length, () => html`<div class="chips mt-6">${map(olcumler, n => html`
            <span class="chip chip--muted tiny">${n}</span>`)}</div>`)}
          ${when(rec.note, () => html`<p class="tiny dim mt-6">${rec.note}</p>`)}
        </div>
        <div class="medrow__ey">
          ${when(aktif, () => K.Button({ label:'Bıraktım', size:'sm',
            act:'stop-med', data:{ 'data-id':rec.id } }))}
          ${K.Button({ label:'Düzelt', size:'sm', act:'edit-med', data:{ 'data-id':rec.id } })}
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'Sil',
            act:'del-med', data:{ 'data-id':rec.id } })}
        </div>
      </div>`;
    };

    return K.Ledger([
      K.Entry({
        label:'Kullandıkların', meta:etkin.length + ' etkin',
        note:'Bir hap ölçümü değiştirir: demir takviyesi ferritini yükseltir, '
          + 'statin LDL\'yi düşürür, mide ilacı B12 emilimini bozar. Kayıt '
          + 'olmadan sistem «değişti» der ama sebebini bilemez.',
        action:K.Button({ label:'Ekle', tone:'primary', act:'add-med' }),
        body:html`
          ${when(!etkin.length, () => P.empty('Şu an kullandığın bir şey kayıtlı değil.'))}
          ${when(etkin.length, () => html`<div class="medlist">${map(etkin, r => satir(r, true))}</div>`)}`,
      }),

      when(gecmis.length, () => K.Entry({
        label:'Bıraktıkların', meta:gecmis.length + ' kayıt',
        note:'Bırakmak silmek değildir: bırakılmış bir ilaç geçmiş bir ölçümü '
          + 'hâlâ açıklar. Karşılaştırma ekranı bu kayıtları da okur.',
        body:html`<div class="medlist">${map(gecmis, r => satir(r, false))}</div>`,
      })),

      K.Entry({
        label:'Sınır', meta:'ne yapar, ne yapmaz',
        body:K.Notice({ tone:'warn', title:'Sistem doz önermez.',
          body:'Burada tutulan kayıt yalnızca ÖLÇÜM YORUMU içindir: bir değerdeki '
            + 'değişimin sebebini aramak için. Sistem ilaç başlatmaz, kestirmez, '
            + 'dozunu değiştirmez ve bunları önermez. İlaç kararları hekimindir.' }),
      }),
    ]);
  }

  function medSheetBody(rec){
    const k = SP.Meds.kindOf(rec);
    return String(K.Stack([
      K.Field({ label:'Tür', hint:'etki eşlemesi buradan gelir',
        input:K.Select({ id:'md-kind', value:rec.kindId, change:'md-kind',
          options:SP.MED_GROUPS.reduce((acc, g) => acc.concat(
            SP.MED_KINDS.filter(x => x.group === g.id)
              .map(x => ({ value:x.id, label:g.name + ' — ' + x.name }))), []) }) }),
      K.Notice({ tone:'info', class:'mt-0', body:k.note }),
      K.Field({ label:'Adı', hint:'kutunun üstündeki ad — isteğe bağlı',
        input:K.Input({ id:'md-name', value:rec.name, placeholder:k.name }) }),
      K.Field({ label:'Doz', hint:'kendi notun; sistem doz önermez',
        input:K.Input({ id:'md-dose', value:rec.dose, placeholder:'örn. günde 1×' }) }),
      html`<div class="cols-2">
        ${K.Field({ label:'Başlangıç',
          input:K.Input({ id:'md-start', type:'date', value:rec.startDate }) })}
        ${K.Field({ label:'Bitiş', hint:'sürüyorsa boş',
          input:K.Input({ id:'md-end', type:'date', value:rec.endDate || '' }) })}
      </div>`,
      K.Field({ label:'Not',
        input:K.Input({ id:'md-note', value:rec.note, placeholder:'Neden başlandı?' }) }),
    ]));
  }

  /* -------------------------------------------------------- karşılaştırma

     İki test oturumu seç, aradaki farkı gör. Bir sağlık kaydının en çok
     sorulan sorusu budur: «geçen sefere göre ne değişti?»

     Fark yazmak kolaydır; ZOR OLAN hangi farkın gerçek olduğunu
     söylemektir. Her satır kişisel saçılmaya göre işaretlenir: eşiğin
     altında kalan fark «değişti» diye sunulmaz, «gürültü» der. Ölçüm
     sayısı üçün altındaysa eşik hesaplanamaz ve bu da yazılır — sessizce
     «gerçek» demez. */

  function comparePick(){
    const list = S.labs.slice().reverse();
    const opts = list.map(l => ({ value:l.id,
      label:U.fmtDate(l.date) + (l.lab ? ' · ' + l.lab : '')
        + ' (' + Object.keys(l.values).length + ' değer)' }));
    return { list, opts };
  }

  function compareIds(){
    const { list } = comparePick();
    /* Varsayılan: en son iki oturum. Kullanıcı değiştirene kadar en çok
       sorulan karşılaştırma budur. */
    const a = S.ui.cmpA && list.some(l => l.id === S.ui.cmpA)
      ? S.ui.cmpA : (list[1] ? list[1].id : null);
    const b = S.ui.cmpB && list.some(l => l.id === S.ui.cmpB)
      ? S.ui.cmpB : (list[0] ? list[0].id : null);
    return { a, b };
  }

  function compareRows(recA, recB){
    const out = [];
    SP.BIOMARKERS.forEach(m => {
      const ca = recA.values[m.id], cb = recB.values[m.id];
      const va = ca && ca.v != null ? Number(ca.v) : null;
      const vb = cb && cb.v != null ? Number(cb.v) : null;
      if(va == null && vb == null) return;
      const row = { marker:m, from:va, to:vb,
        certFrom:ca ? ca.cert : null, certTo:cb ? cb.cert : null };
      if(va == null || vb == null){
        /* Eksik veri sıfır sayılmaz: fark hesaplanmaz, «yeni» ya da
           «bu kez ölçülmedi» denir. */
        row.kind = va == null ? 'new' : 'gone';
      }else{
        row.kind = 'diff';
        row.change = SP.Bio.meaningfulChange(m.id, va, vb);
        row.statusTo = SP.Bio.statusOf(m.id, vb);
        /* Açlık kuralı burada da geçerli: tok karnına alınmış bir
           ölçüme durum etiketi basılmaz. Kural bir ekrana özgü olamaz. */
        row.interp = SP.Bio.interpretable(m.id, recB.fasting || 'unknown');
        /* İki ölçüm arasında başlayan bir ilaç bu değişimi açıklıyor
           olabilir. Beklenen yöndeki bir değişim HABER DEĞİLDİR ve
           «başarı» diye sunulmamalıdır. */
        row.medNote = SP.Meds.changeNote(m.id, recA.date, recB.date, vb - va);
      }
      out.push(row);
    });
    /* Önce gerçek değişimler, sonra gürültü, sonra eksikler. */
    const rank = r => r.kind !== 'diff' ? 2
      : (r.change && r.change.meaningful ? 0 : 1);
    return out.sort((x, y) => {
      const d = rank(x) - rank(y);
      if(d) return d;
      const ax = x.change && x.change.ratio || 0;
      const ay = y.change && y.change.ratio || 0;
      return ay - ax;
    });
  }

  function compareView(){
    if(S.labs.length < 2){
      return K.Ledger([K.Entry({
        label:'Karşılaştır', meta:S.labs.length + ' oturum',
        note:'Karşılaştırma için en az iki test oturumu gerekir. '
          + 'Tek oturumla «ne değişti» sorusunun cevabı yoktur.',
        action:K.Button({ label:'Rapor yapıştır', tone:'primary', act:'open-paste' }),
        body:P.empty('En az iki test oturumu gerekir.'),
      })]);
    }

    const { opts } = comparePick();
    const { a, b } = compareIds();
    const recA = S.labs.find(l => l.id === a);
    const recB = S.labs.find(l => l.id === b);
    if(!recA || !recB || recA.id === recB.id){
      return K.Ledger([K.Entry({ label:'Karşılaştır',
        note:'İki farklı oturum seç.',
        body:html`<div class="cols-2">
          ${K.Field({ label:'Önceki', input:K.Select({ id:'cmp-a', change:'cmp-pick',
            value:a, options:opts }) })}
          ${K.Field({ label:'Sonraki', input:K.Select({ id:'cmp-b', change:'cmp-pick',
            value:b, options:opts }) })}
        </div>` })]);
    }

    const rows = compareRows(recA, recB);
    const gercek = rows.filter(r => r.kind === 'diff' && r.change && r.change.meaningful);
    const aciklanan = gercek.filter(r => r.medNote && r.medNote.expected);
    const gun = U.diffDays(recA.date, recB.date);

    return K.Ledger([
      K.Entry({
        label:'Karşılaştır',
        meta:U.fmtDate(recA.date) + ' → ' + U.fmtDate(recB.date),
        note:'Fark yazmak kolaydır; zor olan hangi farkın gerçek olduğunu '
          + 'söylemektir. Her satır kendi saçılmana göre işaretlenir.',
        action:html`<div class="stack-sm">
          ${K.Field({ label:'Önceki', input:K.Select({ id:'cmp-a', change:'cmp-pick',
            value:a, options:opts }) })}
          ${K.Field({ label:'Sonraki', input:K.Select({ id:'cmp-b', change:'cmp-pick',
            value:b, options:opts }) })}
        </div>`,
        body:html`
          <div class="pair mb-16">
            <div class="sidestat"><span class="sidestat__v">${gun}<small>gün</small></span>
              <span class="sidestat__k">iki oturum arası</span></div>
            <div class="sidestat"><span class="sidestat__v">${gercek.length}</span>
              <span class="sidestat__k">gerçek değişim</span></div>
            ${when(aciklanan.length, () => html`<div class="sidestat">
              <span class="sidestat__v">${aciklanan.length}</span>
              <span class="sidestat__k">ilaçla açıklanıyor</span></div>`)}
          </div>
          ${when(aciklanan.length, () => K.Notice({ tone:'info', class:'mb-16',
            title:'Bu değişimlerin bir kısmının sebebi belli:',
            body:aciklanan.length + ' ölçümdeki değişim, iki oturum arasında '
              + 'başlayan bir ilaç ya da takviyenin beklenen yönünde. Beklenen bir '
              + 'sonuç haber değildir; beslenmenin ya da yaşam düzeninin başarısı '
              + 'olarak okunmamalı.' }))}
          ${when(!rows.length, () => P.empty('İki oturumda da ortak ölçüm yok.'))}
          ${when(rows.length, () => html`<div class="reslist">${map(rows, r => {
            const c = r.change;
            const isim = r.marker.name;
            if(r.kind !== 'diff'){
              return html`<div class="cmprow cmprow--none">
                <span class="cmprow__name"><b>${isim}</b></span>
                <span class="cmprow__val num">${r.kind === 'new'
                  ? U.fmtNum(r.to) + ' ' + r.marker.unit : U.fmtNum(r.from) + ' ' + r.marker.unit}</span>
                <span class="cmprow__note tiny dim">${r.kind === 'new'
                  ? 'ilk kez ölçüldü' : 'bu kez ölçülmedi'}</span>
              </div>`;
            }
            const ton = !c.ok ? 'muted'
              : !c.meaningful ? 'muted'
              : c.good === false ? 'danger' : c.good === true ? 'ok' : 'info';
            const ok = c.dir === 'up' ? '▲' : c.dir === 'down' ? '▼' : '–';
            return html`<button class="${cls('cmprow', c.meaningful && 'is-real')}"
              data-act="open-marker" data-id="${r.marker.id}">
              <span class="cmprow__name"><b>${isim}</b>
                <span class="tiny dim">${SP.PANEL_BY_ID[r.marker.panel]
                  ? SP.PANEL_BY_ID[r.marker.panel].name : ''}</span></span>
              <span class="cmprow__val num">${U.fmtNum(r.from)}
                <span class="cmprow__arrow" aria-hidden="true">→</span>
                <b>${U.fmtNum(r.to)}</b><small>${r.marker.unit}</small></span>
              <span class="${cls('cmprow__delta', 'is-' + ton)}">${ok}
                ${(c.diff > 0 ? '+' : '') + U.fmtNum(c.diff)}${when(c.pct != null,
                  () => html` <span class="tiny">%${U.fmtNum(Math.round(Math.abs(c.pct)))}</span>`)}</span>
              <span class="cmprow__note tiny dim">${r.medNote
                ? (r.medNote.expected ? 'beklenen — ' : 'ters yönde — ')
                : ''}${c.ok
                ? (c.meaningful ? 'gerçek değişim' : 'gürültü sayılır')
                : 'eşik yok'}</span>
              <span class="cmprow__status">${when(!r.interp || r.interp.ok,
                () => K.Badge({ label:r.statusTo.label, tone:r.statusTo.tone }),
                () => K.Badge({ label:r.interp.label, tone:'muted', icon:false }))}</span>
            </button>`;
          })}</div>`)}`,
      }),

      K.Entry({
        label:'Nasıl okunur', meta:'eşik',
        note:'Kendi ölçümlerinin saçılması eşiktir.',
        body:K.Notice({ tone:'info',
          body:'Bir ölçümün en az ' + SP.Bio.BASELINE_MIN + ' kaydı varsa kendi '
            + 'ortalaması ve saçılması hesaplanır. İki oturum arasındaki fark bu '
            + 'saçılmadan küçükse «gürültü sayılır» yazar: laboratuvarın hata payı '
            + 've günden güne dalgalanma o kadarını zaten üretir. Üçten az kaydı '
            + 'olan ölçümde eşik hesaplanamaz ve «eşik yok» yazar — sistem '
            + 'sessizce «gerçek» demez.' }),
      }),
    ]);
  }

  /* -------------------------------------------------------------- geçmiş */

  function historyView(){
    if(!S.labs.length){
      return K.Ledger([K.Entry({
        label:'Geçmiş', meta:'kayıt yok',
        action:K.Button({ label:'Rapor yapıştır', tone:'primary', act:'open-paste' }),
        body:P.empty('Henüz test girilmedi.'),
      })]);
    }
    return K.Ledger([K.Entry({
      label:'Geçmiş', meta:S.labs.length + ' oturum',
      note:'Her satır bir test oturumudur. Aynı güne ikinci kez girilen '
        + 'değerler o oturumun üstüne yazılır.',
      body:html`<div class="list">${map(S.labs.slice().reverse(), l => html`
        <div class="listitem">
          <div class="grow">
            <b class="small">${U.fmtDate(l.date)}</b>
            ${when(l.lab, () => html`<span class="tiny dim"> · ${l.lab}</span>`)}
            <div class="tiny dim">${Object.keys(l.values).length} değer
              · ${l.source === 'paste' ? 'yapıştırıldı' : 'elle girildi'}</div>
          </div>
          ${K.Button({ label:'Aç', size:'sm', act:'open-lab', data:{ 'data-id':l.id } })}
          ${K.IconButton({ icon:'trash', size:'sm', plain:true, aria:'Sil',
            act:'del-lab', data:{ 'data-id':l.id } })}
        </div>`)}</div>`,
    })]);
  }

  const FASTING_LABEL = { yes:'aç karnına', no:'tok', unknown:'bilinmiyor' };

  function labSheetBody(l){
    const rows = Object.keys(l.values).map(id => {
      const b = SP.BIO_BY_ID[id];
      if(!b) return null;
      const cell = l.values[id];
      const st = SP.Bio.statusOf(id, cell.v);
      return [b.name, html`<b class="num">${U.fmtNum(cell.v)}</b> <span class="tiny dim">${b.unit}</span>`,
        K.Badge({ label:st.label, tone:st.tone }), P.cert(cell.cert)];
    }).filter(Boolean);
    const ac = l.fasting || 'unknown';
    return String(K.Stack([
      K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
        ['Tarih', U.fmtDate(l.date) + (l.time ? ' · ' + l.time : '')],
        ['Laboratuvar', l.lab || '—'],
        ['Açlık durumu', FASTING_LABEL[ac] || ac],
      ] }),
      when(ac === 'no', () => K.Notice({ tone:'warn', title:'Tok ölçüm:',
        body:'Bu oturumdaki açlık glukozu, insülin, trigliserit ve onlardan '
          + 'hesaplanan değerler yorumlanmaz.' })),
      K.Table({ tight:true, headers:['Ölçüm', { label:'Değer', num:true }, 'Durum', 'Kaynak'], rows }),
      when(l.note, () => html`<p class="small">${l.note}</p>`),
    ]));
  }

  /* ---------------------------------------------------------- yapistirma */

  function pasteSheet(){
    UI.sheet({
      title:'Test raporunu yapıştır',
      subtitle:'Metni olduğu gibi yapıştır — değerler ayıklanıp şemaya oturur',
      wide:true,
      body:String(K.Stack([
        K.Drop({ act:'lab-file', label:'Rapor dosyası ya da fotoğrafı',
          icon:'file', accept:'.txt,.csv,.md,image/*',
          hint:'Metin dosyası modelsiz okunur · fotoğraf için model gerekir' }),
        K.Notice({ tone:'info', body:'Ayıklayıcı emin olamadığı satırı atmaz. '
          + 'Eşleşmeyen satırlar aşağıda listelenir; istersen elle bağlarsın.' }),
        html`<div class="cols-2">
          ${K.Field({ label:'Test tarihi',
            input:K.Input({ id:'paste-date', type:'date', value:draft.date }) })}
          ${K.Field({ label:'Laboratuvar (isteğe bağlı)',
            input:K.Input({ id:'paste-lab', placeholder:'Hangi laboratuvar?' }) })}
        </div>`,
        K.Field({ label:'Rapor metni',
          input:html`<div class="withmic">
            ${K.Textarea({ id:'paste-text', rows:9,
              placeholder:'Hemoglobin      14,2   g/dL    13.5 - 17.5\nFerritin        28     ng/mL   30 - 400\n…' })}
            ${K.Mic({ target:'paste-text' })}
          </div>` }),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Ayıkla', tone:'primary', act:'run-paste' })}`),
    });
  }

  function previewSheet(){
    const p = preview;
    return UI.sheet({
      title:'Ayıklanan değerler', subtitle:p.note, wide:true,
      body:String(K.Stack([
        when(p.rows.length, () => html`<div>${map(p.rows, (r, i) => html`
          <div class="${r.skip ? 'pasterow pasterow--off' : 'pasterow'}">
            ${K.Checkbox({ label:'', checked:!r.skip, act:'toggle-row', data:{ 'data-i':i } })}
            <span><b class="small">${r.marker.name}</b>
              ${when(r.converted, () => html` <span class="tiny dim">${r.from} → ${r.to} çevrildi</span>`)}
              ${when(r.mismatch, () => html` <span class="tiny">${K.Badge({ label:'birim ' + r.mismatch, tone:'warn' })}</span>`)}
            </span>
            <span class="pasterow__val num">${U.fmtNum(r.value)} ${r.marker.unit}</span>
            <span class="pasterow__src">${r.line}</span>
          </div>`)}</div>`),
        when(!p.rows.length, () => K.Notice({ tone:'warn', body:p.note })),
        when(p.unmatched.length, () => K.Collapsible({
          title:'Eşleşmeyen satırlar', meta:p.unmatched.length + ' satır',
          act:'toggle-unmatched', open:!!S.ui.pasteUnmatchedOpen,
          body:html`<ul class="bullets small muted mt-10">
            ${map(p.unmatched.slice(0, 40), x => html`<li>${x.line}</li>`)}</ul>
            <p class="small muted">Bu satırlarda bilinen bir ölçüm adı bulunamadı.
              Değerleri «Test gir» sayfasından elle yazabilirsin.</p>` })),
      ])),
      footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
        ${K.Button({ label:'Kaydet', tone:'primary', act:'save-paste',
          disabled:!p.rows.filter(r => !r.skip).length })}`),
      noFocus:true,
    });
  }

  /* --------------------------------------------------------------- ekran */

  async function render(){
    const tab = S.ui.labTab;
    const flags = M.openFlags();

    return String(html`
      ${when(flags.length, () => html`<div class="stack-sm mb-16">${map(flags, P.flagCard)}</div>`)}
      <div class="mb-20">${tabs()}</div>
      ${tab === 'giris' ? entryView()
        : tab === 'gecmis' ? historyView()
        : tab === 'kiyas' ? compareView()
        : tab === 'ilac' ? medsView()
        : tab === 'trend' ? trendView()
        : resultsView()}
      ${when(tab === 'sonuc', () => html`<div class="mt-24">
        ${P.clinicalNote()}</div>`)}
      <div class="mt-24">${raw(UI.rail(['ref-range', 'optimal-band', 'trend', 'red-flag', 'derived', 'lab-paste']))}</div>`);
  }

  const handle = {
    async 'lab-tab'(el){ S.ui.labTab = el.dataset.tab; S.ui.labQuery = ''; SP.App.render(); },
    async 'lab-filter'(el){ S.ui.labFilter = el.dataset.tab; SP.App.render(); },
    async 'toggle-empty'(){ S.ui.labShowEmpty = !S.ui.labShowEmpty; SP.App.render(); },
    async 'open-marker'(el){
      const b = SP.BIO_BY_ID[el.dataset.id];
      UI.sheet({ title:b.name, subtitle:b.unit, wide:true,
        body:markerSheetBody(b.id), noFocus:true,
        footer:String(html`${K.Button({ label:'Kapat', act:'sheet-close' })}
          ${K.Button({ label:'Eğilimi aç', tone:'primary', act:'goto-trend', data:{ 'data-id':b.id } })}`) });
    },
    /* ---- ilaç ve takviye ---- */
    async 'add-med'(){
      const rec = M.newMed();
      UI.sheet({ title:'İlaç ya da takviye ekle',
        subtitle:'sistem doz önermez, yalnızca kaydeder', wide:true,
        body:medSheetBody(rec),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Kaydet', tone:'primary', act:'save-med',
            data:{ 'data-id':rec.id } })}`) });
      medDraft = rec;
    },
    async 'edit-med'(el){
      const rec = SP.Meds.all().find(x => x.id === el.dataset.id);
      if(!rec) return;
      medDraft = JSON.parse(JSON.stringify(rec));
      UI.sheet({ title:'Kaydı düzelt', subtitle:SP.Meds.kindOf(rec).name, wide:true,
        body:medSheetBody(medDraft),
        footer:String(html`${K.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${K.Button({ label:'Kaydet', tone:'primary', act:'save-med',
            data:{ 'data-id':rec.id } })}`) });
    },
    async 'save-med'(el){
      const v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
      const rec = medDraft && medDraft.id === el.dataset.id ? medDraft : M.newMed();
      rec.kindId = v('md-kind') || 'diger';
      rec.name = v('md-name');
      rec.dose = v('md-dose');
      rec.startDate = v('md-start') || U.todayISO();
      rec.endDate = v('md-end') || null;
      rec.note = v('md-note');
      await M.saveMed(rec);
      medDraft = null;
      UI.closeSheet();
      UI.toast((rec.name || SP.Meds.kindOf(rec).name) + ' kaydedildi');
      SP.App.render();
    },
    async 'stop-med'(el){
      await M.stopMed(el.dataset.id, U.todayISO());
      UI.toast('Bugün bırakıldı olarak işaretlendi');
      SP.App.render();
    },
    /* Onay kâğıdı yerine geri alma — silmek bir tuşla geri gelir. */
    async 'del-med'(el){
      const rec = SP.Meds.all().find(x => x.id === el.dataset.id);
      if(!rec) return;
      const kopya = JSON.parse(JSON.stringify(rec));
      await M.deleteMed(rec.id);
      S.ui.undo = { restore:() => M.saveMed(kopya) };
      UI.toast((kopya.name || SP.Meds.kindOf(kopya).name) + ' silindi', { undo:true });
      SP.App.render();
    },

    async 'open-doctor'(){
      UI.sheet({ title:'Hekime götürülecek özet',
        subtitle:'tek sayfa · yazdırılabilir', wide:true,
        body:doctorBody(), noFocus:true,
        footer:String(html`${K.Button({ label:'Kapat', act:'sheet-close' })}
          ${K.Button({ label:'Yazdır', tone:'primary', act:'print-doctor' })}`) });
    },
    async 'print-doctor'(){ window.print(); },
    async 'goto-trend'(el){
      S.ui.trendMarker = el.dataset.id;
      S.ui.labTab = 'trend';
      UI.closeSheet();
      SP.App.render();
    },
    async 'open-lab'(el){
      const l = S.labs.find(x => x.id === el.dataset.id);
      if(!l) return;
      UI.sheet({ title:U.fmtDate(l.date), subtitle:l.lab || 'test oturumu',
        wide:true, body:labSheetBody(l), noFocus:true,
        footer:String(K.Button({ label:'Kapat', act:'sheet-close' })) });
    },
    /* Onay kagidi yerine GERI ALMA: silinen oturum bellekte tutulur ve
       bildirimdeki dugmeyle geri yazilir. Daha hizli ve daha nazik. */
    async 'del-lab'(el){
      const id = el.dataset.id;
      const rec = S.labs.find(x => x.id === id);
      if(!rec) return;
      const copy = JSON.parse(JSON.stringify(rec));
      await M.deleteLab(id);
      S.ui.undo = { restore:() => M.saveLab(copy) };
      UI.toast(U.fmtDate(copy.date) + ' testi silindi', { undo:true });
      SP.App.render();
    },

    /* ---- kapsamlı giriş ---- */
    async 'entry-clear'(){
      draft.values = {};
      UI.toast('Giriş temizlendi');
      SP.App.render();
    },
    async 'entry-save'(){
      const ids = Object.keys(draft.values);
      if(!ids.length){ UI.toast('Hiç değer yazılmadı'); return; }
      /* Ayni tarihte oturum varsa ustune yazilir; bir gunun testi tek kayittir. */
      const existing = S.labs.find(l => l.date === draft.date);
      const rec = existing || M.newLab(draft.date);
      if(draft.lab) rec.lab = draft.lab;
      rec.fasting = draft.fasting || 'unknown';
      rec.time = draft.time || '';
      ids.forEach(id => {
        const b = SP.BIO_BY_ID[id];
        if(!b) return;
        rec.values[id] = { v:draft.values[id], cert:'measured', unit:b.unit };
      });
      await M.saveLab(rec);
      draft = { date:U.todayISO(), lab:'', values:{}, fasting:'unknown', time:'' };
      S.ui.labTab = 'sonuc';
      const flags = M.openFlags().filter(f => !f.ack);
      UI.toast(ids.length + ' değer kaydedildi'
        + (flags.length ? ' · ' + flags.length + ' kırmızı bayrak' : ''));
      SP.App.render();
    },

    /* ---- yapıştırma ---- */
    async 'open-paste'(){ pasteSheet(); },
    async 'run-paste'(){
      const text = (document.getElementById('paste-text') || {}).value || '';
      const date = (document.getElementById('paste-date') || {}).value || U.todayISO();
      const lab = (document.getElementById('paste-lab') || {}).value || '';
      preview = SP.Parse.parseLab(text);
      preview.date = date; preview.lab = lab;
      previewSheet();
    },
    async 'toggle-row'(el){
      const i = Number(el.dataset.i);
      if(!preview || !preview.rows[i]) return;
      preview.rows[i].skip = !el.checked;
      previewSheet();
    },
    async 'toggle-unmatched'(){
      S.ui.pasteUnmatchedOpen = !S.ui.pasteUnmatchedOpen;
      previewSheet();
    },
    async 'save-paste'(){
      if(!preview) return;
      const rec = SP.Parse.toLabRecord(preview, preview.date, { lab:preview.lab });
      const n = Object.keys(rec.values).length;
      if(!n){ UI.toast('Kaydedilecek değer yok'); return; }
      await M.saveLab(rec);
      preview = null;
      UI.closeSheet();
      S.ui.labTab = 'sonuc';
      const flags = M.openFlags().filter(f => !f.ack);
      UI.toast(n + ' değer kaydedildi' + (flags.length ? ' · ' + flags.length + ' kırmızı bayrak' : ''));
      SP.App.render();
    },
  };

  const change = {
    /* Tür değişince o türün etki açıklaması da değişmeli: kullanıcı
       neyin eşleneceğini seçtiği anda görsün. */
    async 'md-kind'(){
      if(!medDraft) return;
      const e = document.getElementById('md-kind');
      if(e) medDraft.kindId = e.value;
      const kutu = document.querySelector('.sheet .notice--info');
      if(kutu){
        const g = kutu.querySelector('.notice__body') || kutu;
        g.textContent = SP.Meds.kindOf(medDraft).note;
      }
    },

    /* Karşılaştırılacak iki oturum. Seçim anında uygulanır; onay
       düğmesi beklemez — bir görünüm tercihinin karşılığı görülerek
       anlaşılır. */
    async 'cmp-pick'(){
      const val = id => { const el = document.getElementById(id); return el ? el.value : null; };
      S.ui.cmpA = val('cmp-a');
      S.ui.cmpB = val('cmp-b');
      SP.App.render();
    },

    /* Dosya hem tiklayarak hem surukleyerek gelir; ikisi de buraya duser. */
    async 'lab-file'(el){
      const file = el.files && el.files[0];
      if(!file) return;
      preview = await UI.withBusy('Rapor okunuyor', file.name,
        () => SP.Extract.fromLabFile(file));
      preview.date = (document.getElementById('paste-date') || {}).value || U.todayISO();
      preview.lab = (document.getElementById('paste-lab') || {}).value || '';
      if(!preview.rows.length){ UI.toast(preview.note); return; }
      previewSheet();
    },
    async 'pick-marker'(el){ S.ui.trendMarker = el.value; SP.App.render(); },
    async 'lab-query'(el){ S.ui.labQuery = el.value; SP.App.render(); },
    async 'entry-date'(el){ draft.date = el.value || U.todayISO(); },
    async 'entry-fasting'(el){ draft.fasting = el.value || 'unknown'; SP.App.render(); },
    async 'entry-time'(el){ draft.time = el.value || ''; },
    async 'entry-lab'(el){ draft.lab = el.value; },
    /* Her tuşta yeniden çizmez: değer taslakta durur, sayaç kaydetmede
       güncellenir. Uzun formda her hanede sayfayı çizmek yazmayı bozar. */
    async 'entry-val'(el){
      const id = el.dataset.id;
      const raw0 = String(el.value || '').trim().replace(',', '.');
      if(raw0 === ''){ delete draft.values[id]; }
      else{
        const n = Number(raw0);
        if(!isFinite(n)) return;
        draft.values[id] = n;
      }
      el.closest('.entryrow').classList.toggle('is-filled', draft.values[id] != null);
      const bar = document.querySelector('.entrybar .small');
      const n2 = Object.keys(draft.values).length;
      if(bar) bar.textContent = n2 ? n2 + ' değer yazıldı' : 'Henüz değer yazılmadı';
      const save = document.querySelector('[data-act="entry-save"]');
      if(save) save.disabled = !n2;
    },
  };

  return {
    id:'labs',
    title:'Testler',

    /* Başlık durumun kendisidir: ekranın adı zaten üstte yazıyor. */
    headline(){
      const f = M.openFlags().filter(x => !x.ack).length;
      if(f) return f + ' kırmızı bayrak açık.';
      const s = SP.Bio.summary();
      if(!s.measured) return 'Henüz test girilmedi.';
      if(s.out) return s.out + ' ölçüm referans aralığının dışında.';
      if(s.offTarget) return s.offTarget + ' ölçüm hedef bandın dışında.';
      return 'Ölçümlerin tamamı hedef bandın içinde.';
    },
    lede(){
      const s = SP.Bio.summary();
      if(!s.measured){
        return 'Herhangi bir kapsamlı hastane testinin sonucunu tek seferde girebilirsin. '
          + 'Raporun metnini yapıştırman yeterli; değerler kendiliğinden şemaya oturur.';
      }
      return s.measured + ' ölçüm kayıtlı. Değerler organa göre bölünmez; '
        + 'tek listede, önem sırasına göre durur.';
    },
    stats(){
      const s = SP.Bio.summary();
      if(!s.measured) return [];
      return [
        { value:s.measured, label:'ölçüm' },
        { value:s.out, label:'referans dışı' },
        { value:s.offTarget, label:'hedef dışı' },
        { value:S.labs.length, label:'test' },
      ];
    },
    subtitle(){
      const s = SP.Bio.summary();
      return s.measured + ' ölçüm · ' + s.out + ' referans dışı';
    },
    actions(){
      return String(html`${K.Button({ label:'Test gir', icon:'flask', tone:'primary', size:'sm',
        act:'lab-tab', data:{ 'data-tab':'giris' } })}
        ${K.Button({ label:'Rapor yapıştır', size:'sm', act:'open-paste' })}`);
    },
    render, handle, change,
  };
})();
