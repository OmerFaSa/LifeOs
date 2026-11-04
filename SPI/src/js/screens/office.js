/* Ofis — beş masa.

   Her masada bir ajan oturur ve YALNIZCA kendi brifingini görür. Masayı
   açtığında ajanın kural motorundan gelen raporu ve kendi cümlesi görünür.

   Rozet önemlidir: cümle modelden mi geldi yoksa kural motorundan mı?
   Model kapalıyken ofis kapanmaz, yalnızca rozet değişir. */

window.SP = window.SP || {};
SP.Screens = SP.Screens || {};
window.LIFEOS.PARCA.yazilar({
  'spi.office.devir-daha':'devir daha.',
  'spi.office.model-acik':'model açık',
  'spi.office.hazir-kurallar':'hazır kurallar',
  'spi.office.not-daha-raporu-ac':'not daha — raporu aç.',
  'spi.office.soru-sor':'Soru sor',
  'spi.office.deger':'Değer',
  'spi.office.kapsama':'Kapsama',
  'spi.office.emilen':'Emilen',
  'spi.office.tasarruf':'Tasarruf',
  'spi.office.gunun-ozeti':'Günün özeti',
  'spi.office.uretilmedi':'üretilmedi',
  'spi.office.tazele':'Tazele',
  'spi.office.takipteki-kararlar':'Takipteki kararlar',
  'spi.office.henuz-karar-kaydi-yok':'Henüz karar kaydı yok.',
  'spi.office.kapat':'Kapat',
  'spi.office.kapanan-kararlar':'Kapanan kararlar',
  'spi.office.kapandi':'kapandı',
  'spi.office.karar-ekle':'Karar ekle',
  'spi.office.masalar-arasi-devir':'Masalar arası devir',
  'spi.office.bag-daha-masalari-ac':'bağ daha — masaları aç.',
  'spi.office.masalar-arasinda-devredilece':'Masalar arasında devredilecek ölçülmüş bir bulgu yok. ',
  'spi.office.gundem-adaylari':'Gündem adayları',
  'spi.office.i-ncelemeyi-ac':'İncelemeyi aç',
  'spi.office.masa':'Masa',
  'spi.office.gunun-toplantisi':'Günün toplantısı',
  'spi.office.patron-masasi':'Patron masası',
  'spi.office.dort-uzman-masasi':'Dört uzman masası',
  'spi.office.yetki-ayrimi':'Yetki ayrımı',
  'spi.office.brifing-uretiliyor':'Brifing üretiliyor…',
  'spi.office.takibe-alinir-kapanana-kadar':'takibe alınır, kapanana kadar gündemde durur',
  'spi.office.karar-bir-niyet-degil-bir':'Karar bir niyet değil bir DENEYDİR: neyi değiştirdiğini ve hangi ',
  'spi.office.karar':'Karar',
  'spi.office.ornek-iki-hafta-boyunca-cayi':'Örnek: iki hafta boyunca çayı öğünden bir saat sonraya al',
  'spi.office.gerekce':'Gerekçe',
  'spi.office.hangi-bulguya-dayaniyor':'Hangi bulguya dayanıyor?',
  'spi.office.vazgec':'Vazgeç',
  'spi.office.kaydet':'Kaydet',
  'spi.office.karar-metni-gerekli':'Karar metni gerekli',
  'spi.office.karar-takibe-alindi':'Karar takibe alındı',
  'spi.office.karari-kapat':'Kararı kapat',
  'spi.office.sonucu-olcuyle-yaz':'sonucu ölçüyle yaz',
  'spi.office.i-yi-geldi-bir-sonuc-degildi':'"İyi geldi" bir sonuç değildir. Hangi ölçüm ne kadar değişti? ',
  'spi.office.sonuc':'Sonuç',
  'spi.office.ne-degisti-olcumle-hisle-deg':'Ne değişti? Ölçümle, hisle değil.',
  'spi.office.karar-kapatildi':'Karar kapatıldı',
  'spi.office.ofis':'Ofis',
  'spi.office.masa-notu':'masa notu',
  'spi.office.masalar-arasi-devir-2':'masalar arası devir',
  'spi.office.karar-takipte':'karar takipte',
  'spi.office.i-nceleme':'İnceleme',
});
window.LIFEOS.PARCA.sayfa({ id:'office', modul:'spi', cekmece:'ofis', ad:'Masalar', sira:10 });

SP.Screens.office = (function(){
  const U = SP.U, S = SP.S, UI = SP.UI;
  const { html, raw, when, map } = SP.h;
  const K = SP.C, P = SP.Parts;

  /* Masalar yan yana durur; biri uzarsa hizalama bozulur ve sayfa o
     ajanin boyuna gore uzar. Masada en fazla dort not gosterilir,
     gerisi rapora iner. Not URETIMI de ayrica toplandi (core/office.js):
     on iki ayri "hic olculmemis" notu tek satira indi. */
  const DESK_NOTES = 4;

  /* Patron digerlerinin yanina dizilmez. Dort uzman birbirinin esiti,
     Patron degil: o dordunun raporunu okur. Kat planinda da oyle
     dursun — esitleri yan yana, ustu ustte. */
  const COACHES = SP.AGENTS.filter(a => a.id !== 'patron');

  /* Devir defteri de uzamaz: gerisi masalarin kendi satirlarinda durur. */
  const HANDOFF_MAX = 6;

  /* Devir satiri — iki masa arasindaki bag. Tiklanabilir olmasi sus
     degil: bulgunun DUSTUGU yere gitmeden devir tamamlanmaz. */
  function handoffRow(h){
    return html`
      <button type="button" class="handoff handoff--${h.tone}" data-act="handoff" data-id="${h.id}">
        <span class="handoff__chain" aria-hidden="true">
          ${P.avatar(h.from, 'sm')}
          <span class="handoff__arrow">→</span>
          ${P.avatar(h.to, 'sm')}
        </span>
        <span class="handoff__body">
          <span class="handoff__find">
            <b class="agentref agentref--${h.from}">${h.fromName}</b> ${h.finding}</span>
          <span class="handoff__ask">
            <b class="agentref agentref--${h.to}">${h.toName}</b> ${h.ask}</span>
          <span class="handoff__cta">${h.cta} →</span>
        </span>
      </button>`;
  }

  /* Masanin kendi devir defteri — tek satir, sayiyla. Masayi uzatmaz.

     Patron bir istisnadir: hicbir devrin ucunda durmaz ama HEPSININ
     ustunde durur. Onun defteri kendi isi degil, TRAFIGIN kendisidir. */
  function deskFlow(agentId){
    if(agentId === 'patron'){
      const all = SP.Office.handoffs();
      if(!all.length) return raw('');
      return html`<div class="deskflow">
        ${map(all.slice(0, 4), h => html`
          <button type="button" class="deskflow__row" data-act="handoff" data-id="${h.id}">
            <span class="deskflow__pair" aria-hidden="true">
              ${P.avatar(h.from, 'sm')}<span class="deskflow__dir">→</span>${P.avatar(h.to, 'sm')}
            </span>
            <span class="deskflow__what">${h.cta}</span>
          </button>`)}
        ${when(all.length > 4, () => html`<p class="tiny dim">
          ${all.length - 4} ${yz('spi.office.devir-daha')}</p>`)}
      </div>`;
    }
    const f = SP.Office.handoffsFor(agentId);
    if(!f.out.length && !f.in.length) return raw('');
    return html`<div class="deskflow">
      ${map(f.out.slice(0, 2), h => html`
        <button type="button" class="deskflow__row" data-act="handoff" data-id="${h.id}">
          <span class="deskflow__dir">→</span>
          <span class="agentref agentref--${h.to}">${h.toName}</span>
          <span class="deskflow__what">${h.cta}</span>
        </button>`)}
      ${map(f.in.slice(0, 2), h => html`
        <button type="button" class="deskflow__row" data-act="handoff" data-id="${h.id}">
          <span class="deskflow__dir deskflow__dir--in">←</span>
          <span class="agentref agentref--${h.from}">${h.fromName}</span>
          <span class="deskflow__what">${h.cta}</span>
        </button>`)}
    </div>`;
  }

  /* Masa satirlari: her ajanin kendi kural motoru cumlesi. */
  function deskCard(agent){
    const open = S.ui.officeDesk === agent.id;
    const b = SP.Office.brief(agent.id);
    const line = SP.Office.ruleText(agent.id, b);
    const notes = SP.Office.notes().filter(n => n.agent === agent.id);
    /* «Günün özeti» aynı cümleyi zaten yazıyorsa (model kapalı) patron masası yinelemez. */
    const ozet = (S.officeBriefings || {})[U.todayISO()];
    const tekrar = agent.id === 'patron' && ozet && String(ozet.text || '').trim() === String(line || '').trim();

    return K.Card({
      box:true, class:'desk desk--' + agent.id,
      body:html`
        <div class="desk__head">
          ${html`<span class="${'agentkare agentkare--' + agent.id}"
            aria-hidden="true">${SP.UI.ppKare(agent.id)}${agent.initial}</span>`}
          <div class="grow minw0">
            <b class="desk__name">${agent.name}</b>
            <span class="desk__role">${agent.role}</span>
          </div>
          ${when(notes.length, () => K.Badge({ label:String(notes.length),
            tone:notes.some(n => n.tone === 'danger') ? 'danger' : 'warn' }))}
          ${SP.Office.ready(agent.id) ? K.Badge({ label:yz('spi.office.model-acik'), tone:'info' })
            : K.Badge({ label:yz('spi.office.hazir-kurallar'), tone:'muted', icon:false })}
        </div>
        ${tekrar ? '' : K.Katmanli({ metin:line, sinif:'desk__line' })}
        ${when(notes.length, () => html`<div class="notes mt-10">
          ${map(notes.slice(0, DESK_NOTES), n => html`
            <div class="note note--${n.tone}"><span class="note__dot"></span>
              <span class="small">${n.text}</span></div>`)}
          ${when(notes.length > DESK_NOTES, () => html`<p class="tiny dim mt-6">
            ${notes.length - DESK_NOTES} ${yz('spi.office.not-daha-raporu-ac')}</p>`)}
        </div>`)}
        ${deskFlow(agent.id)}
        ${when(open, () => html`<div class="desk__open">
          ${deskDetail(agent, b)}
        </div>`)}
        <div class="row wrap mt-12">
          ${K.Button({ label:open ? 'Raporu kapat' : 'Raporu aç', size:'sm',
            act:'toggle-desk', data:{ 'data-id':agent.id } })}
          ${K.Button({ label:yz('spi.office.soru-sor'), size:'sm',
            act:'ask-agent', data:{ 'data-agent':agent.id } })}
        </div>`,
    });
  }

  /* Ajanin brifinginin okunabilir hali — sayilar aynen, yorum yok. */
  function deskDetail(agent, b){
    if(agent.id === 'lab'){
      return html`
        ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          ['Girilmiş ölçüm', b.summary.measured + ' / ' + b.summary.total],
          ['Referans dışı', String(b.summary.out)],
          ['Hedef bandın dışı', String(b.summary.offTarget)],
          ['Açık kırmızı bayrak', String(b.flags.length)],
          ['Son tahlil', b.lastLab ? U.fmtDate(b.lastLab) : 'yok'],
        ] })}
        ${when(b.attention.length, () => html`<div class="mt-10">
          ${K.Table({ tight:true, headers:['Ölçüm', { label:yz('spi.office.deger'), num:true }, 'Durum'],
            rows:b.attention.map(a => [a.marker, U.fmtNum(a.value) + ' ' + a.unit,
              K.Badge({ label:a.statusLabel, tone:a.status === 'red' ? 'danger'
                : a.status === 'low' || a.status === 'high' ? 'warn' : 'info' })]) })}</div>`)}`;
    }
    if(agent.id === 'nutri'){
      if(!b.targetsOk) return K.Notice({ tone:'warn', body:'Profilde ' + b.missingProfile.join(', ') + ' eksik.' });
      return html`
        ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          ['Günlük kalori hedefi', U.fmtNum(b.kcal) + ' kcal'],
          ['Protein bandı', b.protein.min + '–' + b.protein.max + ' g'],
          ['Lif hedefi', b.fiber + ' g'],
          ['Kayıtlı gün (7 gün)', String(b.loggedDays)],
          ['Bugün', b.todayMeals + ' öğün · ' + U.fmtNum(b.todayKcal) + ' kcal'],
        ] })}
        ${when(b.gaps.length, () => html`<div class="mt-10">
          ${K.Table({ tight:true, headers:['Açık', { label:yz('spi.office.kapsama'), num:true }, { label:yz('spi.office.emilen'), num:true }],
            rows:b.gaps.map(g => [g.nutrient, '%' + g.pct, U.fmtNum(g.absorbed)]) })}</div>`)}`;
    }
    if(agent.id === 'move'){
      return html`
        ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          ['Toparlanma', b.readiness == null ? 'ölçüm yok' : b.readiness + '/100 · ' + b.band],
          ['Yük çarpanı', '×' + U.fmtNet(b.factor)],
          ['Son hafta / son ay', b.acwr.ratio != null ? U.fmtNet(b.acwr.ratio) + ' · ' + b.acwr.zone : b.acwr.note],
          ['Bu hafta yük', U.fmtNum(b.week)],
          ['Bugün', b.doneToday + ' seans · ' + U.fmtNum(b.loadToday) + ' yük'],
          ['Eksik kalıp', b.balance.length ? b.balance.join(', ') : 'yok'],
        ] })}
        ${when(b.progressionReady.length, () => html`<div class="mt-10">
          ${K.Table({ tight:true, headers:['Hareket', 'Basamak'],
            rows:b.progressionReady.map(p => [p.exercise, p.from + ' → ' + p.to]) })}</div>`)}`;
    }
    if(agent.id === 'money'){
      return html`
        ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
          ['Sepet', b.itemCount + ' kalem · ' + U.fmtNum(Math.round(b.total)) + ' TL'],
          ['Sınır', b.limit == null ? 'konmadı' : U.fmtNum(b.limit) + ' TL' + (b.over ? ' · aşıldı' : '')],
          ['Kişi başı', U.fmtNum(Math.round(b.perPerson)) + ' TL'],
          ['Tahmin payı', '%' + b.estimatePct],
        ] })}
        ${when(b.swaps.length, () => html`<div class="mt-10">
          ${K.Table({ tight:true, headers:['İkame', { label:yz('spi.office.tasarruf'), num:true }, 'Korunan'],
            rows:b.swaps.map(s => [s.from + ' → ' + s.to, U.fmtNum(Math.round(s.saveTotal)) + ' TL',
              s.keeps.join(', ')]) })}</div>`)}`;
    }
    /* patron */
    return html`
      ${K.Table({ tight:true, headers:['Alan', 'Değer'], rows:[
        ['Hafta', U.fmtRange(b.week.start, b.week.end)],
        ['Toparlanma ortalaması', b.week.readiness == null ? '—' : String(b.week.readiness)],
        ['Asgari gün', b.week.minDays + '/7'],
        ['Seans', String(b.week.sessions)],
        ['Öğün kaydı', b.week.loggedMeals + ' gün'],
        ['Davranış serisi', b.streak + ' gün'],
        ['Açık karar', String(b.openDecisions.length)],
      ] })}
      ${when(b.cross.length, () => html`<div class="mt-10">
        ${K.Table({ tight:true, headers:['Çapraz bağ', 'Bulgu'],
          rows:b.cross.map(c => [c.title, html`<span class="small">${c.text}</span>`]) })}</div>`)}`;
  }

  function briefingCard(){
    const d = U.todayISO();
    const b = S.officeBriefings[d];
    return K.Card({
      title:yz('spi.office.gunun-ozeti'), hint:'office',
      sub:U.fmtDate(d),
      badge:b ? P.sourceBadge(b.source) : K.Badge({ label:yz('spi.office.uretilmedi'), tone:'muted' }),
      body:html`
        ${when(b, () => html`<p class="small">${b.text}</p>
          ${when(b.headline && String(b.text || '').indexOf(b.headline) < 0,
            () => html`<p class="small dim mt-8">${b.headline}</p>`)}`)}
        ${when(!b, () => K.Notice({ tone:'info',
          body:'Brifing günde bir kez üretilir ve tek model çağrısı harcar. '
             + 'Model kapalıysa kural motorunun cümlesi yazılır.' }))}`,
      foot:K.Button({ label:yz('spi.office.tazele'), size:'sm', act:'refresh-briefing' }),
    });
  }

  function decisionCard(){
    const open = SP.Model.openDecisions();
    const closed = S.decisions.filter(d => d.status === 'closed').slice(0, 5);
    return K.Card({
      title:yz('spi.office.takipteki-kararlar'), hint:'decision',
      badge:K.Badge({ label:String(open.length), tone:open.length ? 'warn' : 'muted' }),
      body:html`
        ${when(!open.length && !closed.length, () => K.Empty({ text:yz('spi.office.henuz-karar-kaydi-yok') }))}
        ${when(open.length, () => html`<div class="list">${map(open, d => html`
          <div class="listitem">
            <div class="grow"><b class="small">${d.title}</b>
              <div class="tiny dim">${U.relativeDay(SP.U.gunOf(d.at))} · ${d.why || ''}</div></div>
            ${K.Button({ label:yz('spi.office.kapat'), size:'sm', act:'close-decision', data:{ 'data-id':d.id } })}
          </div>`)}</div>`)}
        ${when(closed.length, () => html`<div class="mt-12">
          <h3 class="section-h">${yz('spi.office.kapanan-kararlar')}</h3>
          <div class="list">${map(closed, d => html`
            <div class="listitem"><div class="grow"><b class="small">${d.title}</b>
              <div class="tiny dim">${d.outcome || 'sonuç yazılmadı'}</div></div>
              ${K.Badge({ label:yz('spi.office.kapandi'), tone:'muted' })}</div>`)}</div></div>`)}`,
      foot:K.Button({ label:yz('spi.office.karar-ekle'), size:'sm', act:'add-decision' }),
    });
  }

  /* Devir defteri — Patron'un asil isi. Ofisin en ozgun fikri burada
     gorunur hale gelir: bes ayri rapor degil, aralarindaki TRAFIK. */
  function handoffEntry(){
    const vd = vitrinOfis().devir;
    const rows = SP.Office.handoffs();
    const loud = rows.filter(h => h.tone === 'danger' || h.tone === 'warn').length;
    return K.Entry({
      wide:true, label:yz('spi.office.masalar-arasi-devir'), hint:'office',
      meta:rows.length ? rows.length + ' bağ' + (loud ? ' · ' + loud + ' acil' : '') : 'bağ yok',
      body:rows.length
        ? html`${when(vd, () => html`<div class="mb-12">${raw(vd)}</div>`)}<div class="handoffs">${map(rows.slice(0, HANDOFF_MAX), handoffRow)}</div>
            ${when(rows.length > HANDOFF_MAX, () => html`<p class="tiny dim mt-8">
              ${rows.length - HANDOFF_MAX} ${yz('spi.office.bag-daha-masalari-ac')}</p>`)}`
        : K.Empty({ text:yz('spi.office.masalar-arasinda-devredilece')
            + 'Devir tahminden çıkmaz.' }),
    });
  }

  function agendaCard(){
    const rows = SP.Office.agendaCandidates().slice(0, 5);
    return K.Card({
      hint:'not-gundem-adaylari', title:yz('spi.office.gundem-adaylari'),
      body:html`<div class="list">${map(rows, (a, i) => html`
        <div class="listitem">
          <div class="grow"><b class="small">${a.label}</b>
            ${K.Badge({ label:String(a.score), tone:a.score >= 65 ? 'danger' : a.score >= 40 ? 'warn' : 'muted' })}
            <div class="tiny dim">${a.detail}</div></div>
          ${P.avatar(a.owner, 'sm')}
        </div>`)}</div>`,
      foot:K.Button({ label:yz('spi.office.i-ncelemeyi-ac'), size:'sm', tone:'primary',
        act:'go', data:{ 'data-route':'meeting' } }),
    });
  }

  /* BAM ürünleri Kütüphanem'de (screens/kutuphane.js): «Kütüphane»
     BAM'ın ürettiklerinin tek yeri. */

  /* G · VİTRİN KARTLARI (brand/ortak/vitrin.js › ofis): masa, durum
     halkası, sayı çipli balon, hazır cevap, günün toplantısı, sınır kartı,
     devir. Cümleler kural motorunun (`ruleText`); model cevabı girmez. */
  function vitrinOfis(){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V || !V.ofis) return {};
    const h = SP.Office.handoffs()[0];
    const kisi = id => { const a = SP.AGENT_BY_ID[id]; return a ? { ad:a.name, harf:a.initial, gorsel:'' } : null; };
    return V.ofis({ modul:'spi', acik:S.ui.officeDesk, act:{ ac:'toggle-desk', sor:'ask-agent' },
      ajanlar:SP.AGENTS.map(a => ({ id:a.id, ad:a.name, harf:a.initial, rol:a.role, patron:a.id === 'patron',
        gorsel:'', hazir:SP.Office.ready(a.id),
        cumle:(() => { try{ return SP.Office.ruleText(a.id, SP.Office.brief(a.id)); }catch(e){ return ''; } })(),
        yapar:V.maddele(a.scope), yapmaz:V.maddele(a.notScope) })),
      /* Balonda bulgu; kime ve ne sorulduğu okta ve alttaki devir satırında. */
      devir:h && kisi(h.from) && kisi(h.to) ? { kaynak:kisi(h.from), hedef:kisi(h.to), metin:h.finding } : null });
  }

  LIFEOS.PARCA.blok({ id:'office.aciklamalar', sayfa:'office', yer:'y1', sira:10, ad:'Açıklamalar', ciz({ flags, vo }){
    return raw(UI.rail(['office', 'grounding', 'no-model', 'privacy', 'decision']));
  } });
  LIFEOS.PARCA.blok({ id:'office.masa', sayfa:'office', yer:'y2', sira:10, ad:'Masa', ciz({ flags, vo }){
    return when(vo.masa, () => K.Entry({ wide:true, hint:'not-masa', label:yz('spi.office.masa'), meta:'kim konuşuyor',
          body:html`<div class="vofis">${raw(vo.masa)}${raw(vo.balon || '')}${raw(vo.sinir || '')}${raw(vo.durum || '')}</div>` }));
  } });
  LIFEOS.PARCA.blok({ id:'office.gunun-toplantisi', sayfa:'office', yer:'y2', sira:20, ad:'Günün toplantısı', ciz({ flags, vo }){
    return when(vo.toplanti, () => K.Entry({ wide:true, label:yz('spi.office.gunun-toplantisi'), meta:'her masadan tek cümle',
          body:html`${raw(vo.toplanti)}${raw(vo.hazir || '')}` }));
  } });
  LIFEOS.PARCA.blok({ id:'office.briefingcard', sayfa:'office', yer:'y2', sira:30, ad:'Günün özeti', ciz({ flags, vo }){
    return briefingCard();
  } });
  LIFEOS.PARCA.blok({ id:'office.patron-masasi', sayfa:'office', yer:'y2', sira:40, ad:'Patron masası', ciz({ flags, vo }){
    return K.Entry({ wide:true, label:yz('spi.office.patron-masasi'), hint:'office', meta:'orkestrasyon',
          body:html`<div class="desks desks--solo">${deskCard(SP.AGENT_BY_ID.patron)}</div>` });
  } });
  LIFEOS.PARCA.blok({ id:'office.handoffentry', sayfa:'office', yer:'y2', sira:50, ad:'Devir notu', ciz({ flags, vo }){
    return handoffEntry();
  } });
  LIFEOS.PARCA.blok({ id:'office.dort-uzman-masasi', sayfa:'office', yer:'y2', sira:60, ad:'Dört uzman masası', ciz({ flags, vo }){
    return K.Entry({ wide:true, hint:'not-dort-uzman-masasi', label:yz('spi.office.dort-uzman-masasi'), meta:COACHES.length + ' ajan',
          body:html`<div class="desks">${map(COACHES, deskCard)}</div>` });
  } });
  LIFEOS.PARCA.blok({ id:'office.agendacard', sayfa:'office', yer:'y2', sira:70, ad:'Gündem', ciz({ flags, vo }){
    return agendaCard();
  } });
  LIFEOS.PARCA.blok({ id:'office.decisioncard', sayfa:'office', yer:'y2', sira:80, ad:'Karar', ciz({ flags, vo }){
    return decisionCard();
  } });
  LIFEOS.PARCA.blok({ id:'office.yetki-ayrimi', sayfa:'office', yer:'y2', sira:90, ad:'Yetki ayrımı', ciz({ flags, vo }){
    return K.Entry({ label:yz('spi.office.yetki-ayrimi'), hint:'office', meta:'kim neye bakar',
          body:html`<ul class="bullets small muted">${map(SP.AGENTS, a => html`
            <li><b>${a.name}</b> — ${a.scope}</li>`)}</ul>` });
  } });
  LIFEOS.PARCA.blok({ id:'office.uyari-kartlari', sayfa:'office', yer:'y3', sira:10, ad:'Uyarı kartları', ciz({ flags, vo }){
    return when(flags.length, () => html`<div class="stack-sm mb-16">${map(flags, P.flagCard)}</div>`);
  } });
  LIFEOS.PARCA.blok({ id:'office.sozluk-seridi', sayfa:'office', yer:'y4', sira:10, ad:'Sözlük şeridi', ciz({ flags, vo }){
    return (window.LIFEOS || {}).SOZLUK ? raw(window.LIFEOS.SOZLUK.seritHtml({ acik:SP.Office.ready('patron') })) : '';
  } });
  async function render(){
    const flags = SP.Model.openFlags();
    const vo = vitrinOfis();
    const parcaB = { flags, vo };
    return String(html`
      ${LIFEOS.PARCA.yer('office', 'y4', K, parcaB, typeof raw === 'undefined' ? null : raw)}
      ${LIFEOS.PARCA.yer('office', 'y3', K, parcaB, typeof raw === 'undefined' ? null : raw)}
      ${K.Ledger(() => LIFEOS.PARCA.liste('office', 'y2', K, parcaB))}
      <div class="mt-24">${LIFEOS.PARCA.yer('office', 'y1', K, parcaB, typeof raw === 'undefined' ? null : raw)}</div>`);
  }

  const handle = {
    /* 3B kampüs kalktı (kullanıcı kararı 2026-10-02, «3B kampüsü kaldır»):
       «3B kampüsü aç» ve kampüste toplantı eylemleri kaldirilan.json'da;
       sayfa başındaki «Toplantı» doğrudan Toplantı bölümünü açar. */
    /* Devri tamamlayan hareket: bulgunun DUSTUGU ekrani, dogru sekmesi
       ve dogru satiri acik halde ac. Yoksa devir bir cumleden ibaret
       kalir. */
    async handoff(el){
      const h = SP.Office.handoffs().find(x => x.id === el.dataset.id);
      if(!h) return;
      if(h.ui) Object.assign(S.ui, h.ui);
      UI.toast(h.fromName + ' → ' + h.toName);
      SP.App.go(h.route);
    },
    async 'toggle-desk'(el){
      S.ui.officeDesk = S.ui.officeDesk === el.dataset.id ? null : el.dataset.id;
      SP.App.render();
    },
    async 'refresh-briefing'(){
      UI.toast(yz('spi.office.brifing-uretiliyor'));
      await SP.Office.dailyBriefing(true);
      SP.App.render();
    },
    async 'add-decision'(){
      UI.sheet({
        title:yz('spi.office.karar-ekle'),
        subtitle:yz('spi.office.takibe-alinir-kapanana-kadar'),
        note:yz('spi.office.karar-bir-niyet-degil-bir')
          + 'bulguya dayandığını yazarsan, kapanırken sonucunu ölçüyle '
          + 'karşılaştırabilirsin.',
        body:String(K.Stack([
          K.Field({ label:yz('spi.office.karar'), input:K.Input({ id:'dec-title',
            placeholder:yz('spi.office.ornek-iki-hafta-boyunca-cayi') }) }),
          K.Field({ label:yz('spi.office.gerekce'), input:K.Textarea({ id:'dec-why', rows:2,
            placeholder:yz('spi.office.hangi-bulguya-dayaniyor') }) }),
        ])),
        footer:String(html`${K.Button({ label:yz('spi.office.vazgec'), act:'sheet-close' })}
          ${K.Button({ label:yz('spi.office.kaydet'), tone:'primary', act:'save-decision' })}`),
      });
    },
    async 'save-decision'(){
      const t = document.getElementById('dec-title');
      const w = document.getElementById('dec-why');
      if(!t || !t.value.trim()){ UI.toast(yz('spi.office.karar-metni-gerekli')); return; }
      await SP.Model.saveDecision({ title:t.value.trim(), why:w ? w.value.trim() : '' });
      UI.closeSheet();
      UI.toast(yz('spi.office.karar-takibe-alindi'));
      SP.App.render();
    },
    async 'close-decision'(el){
      const id = el.dataset.id;
      UI.sheet({
        title:yz('spi.office.karari-kapat'),
        subtitle:yz('spi.office.sonucu-olcuyle-yaz'),
        note:yz('spi.office.i-yi-geldi-bir-sonuc-degildi')
          + 'Değişmediyse bu da bir sonuçtur ve yazılması gerekir.',
        body:String(K.Field({ label:yz('spi.office.sonuc'), input:K.Textarea({ id:'dec-out', rows:3,
          placeholder:yz('spi.office.ne-degisti-olcumle-hisle-deg') }) })),
        footer:String(html`${K.Button({ label:yz('spi.office.vazgec'), act:'sheet-close' })}
          ${K.Button({ label:yz('spi.office.kapat'), tone:'primary', act:'save-close', data:{ 'data-id':id } })}`),
      });
    },
    async 'save-close'(el){
      const out = document.getElementById('dec-out');
      await SP.Model.closeDecision(el.dataset.id, out ? out.value.trim() : '');
      UI.closeSheet();
      UI.toast(yz('spi.office.karar-kapatildi'));
      SP.App.render();
    },
  };

  return {
    id:'office',
    /* Sadelik (brand/ortak/gizle.js): uzun aciklama ve basvuru bolumleri
       bastan kucuk gelir; baslik gorunur, ustune gelince onizlenir,
       «Ac» denirse acik kalir. Is yapilan bolumler ve sinir metinleri acik. */
    /* iPhone Faz 4 («brifing + tek eylem»): açık günün brifingi ve Patron
       masası; konuşan masa, toplantı satırları, uzman masaları, gündem ve
       kararlar şerit. */
    kucukVarsayilan:['masalar-arası-devir', 'yetki-ayrımı', 'masa', 'günün-toplantısı', 'dört-uzman-masası',
      'gündem-adayları', 'takipteki-kararlar'],
    title:yz('spi.office.ofis'),
    headline(){
      const notes = SP.Office.notes();
      const loud = notes.filter(n => n.tone === 'danger' || n.tone === 'warn').length;
      const hand = SP.Office.handoffs();
      const urgent = hand.filter(h => h.tone === 'danger');
      if(urgent.length) return urgent[0].fromName + ' masasından ' + urgent[0].toName
        + ' masasına düşen bir iş var.';
      if(!notes.length && !hand.length) return 'Masalar sessiz.';
      if(loud) return loud + ' masada dikkat isteyen not var'
        + (hand.length ? ' · ' + hand.length + ' devir bekliyor' : '') + '.';
      if(!notes.length) return hand.length + ' masalar arası bağ var.';
      return 'Masalarda ' + notes.length + ' not var.';
    },
    lede(){
      return 'Patron ekibi yönetir; Kerem laboratuvara, Nesrin beslenmeye, '
        + 'Barış harekete, Sedef ekonomiye bakar. Her not önce kural motorundan '
        + 'çıkar — model varsa onu yeniden yazar, yerine geçmez. Bir masanın '
        + 'bulgusu başka bir masanın işiyse devir satırı onu taşır.';
    },
    stats(){
      const notes = SP.Office.notes();
      const open = SP.Model.openDecisions().length;
      const hand = SP.Office.handoffs().length;
      const out = [{ value:notes.length, label:yz('spi.office.masa-notu') }];
      if(hand) out.push({ value:hand, label:yz('spi.office.masalar-arasi-devir-2') });
      if(open) out.push({ value:open, label:yz('spi.office.karar-takipte') });
      return out;
    },
    subtitle(){
      const n = SP.Office.notes();
      const open = SP.Model.openDecisions().length;
      const hand = SP.Office.handoffs().length;
      return n.length + ' masa notu'
        + (hand ? ' · ' + hand + ' devir' : '')
        + (open ? ' · ' + open + ' karar takipte' : '');
    },
    actions(){
      return String(K.Button({ label:yz('spi.office.i-nceleme'), size:'sm', icon:'users', class:'btn--screen',
        act:'go', data:{ 'data-route':'meeting' } }));
    },
    render, handle,
  };
})();
