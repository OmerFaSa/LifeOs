/* Ofis — dokuz masa ve aralarındaki devir.

   Patron sekiz uzmanın yanına dizilmez, ÜSTÜNE konur: kendi defteri kendi
   işi değil, trafiğin kendisidir.

   Masa notu bir tavsiye değil BULGUDUR: koşul sağlandığında kendiliğinden
   düşer, koşul geçtiğinde kendiliğinden kalkar. Kullanıcı silmez.

   Masanın sol kenarındaki kimlik şeridi bir DURUM değil bir İMZADIR:
   masanın kime ait olduğunu söyler. Durum renkleri (kırmızı/sarı/yeşil)
   kimlik şeridinde asla kullanılmaz; aciliyet yalnızca devir okuna dokunur.
   İki renk sistemi aynı yüzeyde karışmaz. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};
window.LIFEOS.PARCA.komut({ modul:'esp', sira:130, id:'act:proposals', kind:'Eylem', label:'Bekleyen teklifleri gör',
  hint:'Ofis', run:() => ESP.App.go('office') });
window.LIFEOS.PARCA.yazilar({
  'esp.office.ac':'Aç',
  'esp.office.bu-masada-bekleyen-bulgu-yok':'Bu masada bekleyen bulgu yok.',
  'esp.office.danis':'Danış',
  'esp.office.masaya-git':'Masaya git',
  'esp.office.masa':'Masa',
  'esp.office.gunun-toplantisi':'Günün toplantısı',
  'esp.office.patron':'Patron',
  'esp.office.siradaki-tek-is':'Sıradaki tek iş',
  'esp.office.masalar-arasi-devir':'Masalar arası devir',
  'esp.office.i-ki-masayi-birbirine-baglay':'İki masayı birbirine bağlayan ölçülmüş bir bulgu yok.',
  'esp.office.uzman-masalari':'Uzman masaları',
  'esp.office.oneriler':'Öneriler',
  'esp.office.onaylar-da-gor':'Onaylar’da gör',
  'esp.office.haftalik-plan':'Haftalık plan',
  'esp.office.oncelik-sirasi':'Öncelik sırası',
  'esp.office.masalar':'Masalar',
  'esp.office.tikanma':'tıkanma',
  'esp.office.vadesi-gecmis':'vadesi geçmiş',
});
window.LIFEOS.PARCA.sayfa({ id:'office', modul:'esp', cekmece:'ofis', ad:'Masalar', ikon:'users', sira:10 });

ESP.Screens.office = (function(){
  const U = ESP.U, S = ESP.S;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;

  function avatar(a){
    return html`<span class="agentav" style="background:${a.color}"
      aria-hidden="true">${ESP.UI.pp(a.id)}${a.initial}</span>`;
  }

  /* --------------------------------------------------------------- masalar */

  function deskCard(a){
    const notlar = ESP.Office.notes(a.id);
    const devir = ESP.Office.handoffsFor(a.id);
    const hazir = ESP.Office.ready(a.id);

    return K.Card({
      box:true,
      class:'desk desk--' + a.id,
      title:html`${avatar(a)} ${a.short || a.name}`,
      sub:a.role,
      badge:K.Badge({ label:hazir ? 'model bağlı' : 'kural motoru',
        tone:hazir ? 'info' : 'muted' }),
      body:html`
        ${notlar.length
          ? html`<ul class="desknotes">${map(notlar, n => html`
              <li class="${cls('desknote', 'desknote--' + n.tone)}">
                <span class="desknote__label">${n.label}</span>
                <span class="desknote__text">${n.text}</span>
                ${when(n.route, () => K.Button({ label:yz('esp.office.ac'), size:'sm', act:'go',
                  data:{ 'data-route':n.route } }))}
              </li>`)}</ul>`
          : html`<p class="small muted">${yz('esp.office.bu-masada-bekleyen-bulgu-yok')}</p>`}

        ${when(devir.in.length || devir.out.length, () => html`
          <div class="deskflow">
            ${map(devir.in, h => html`<div class="deskflow__row deskflow__row--in">
              <span class="deskflow__arrow">←</span>
              <span><b>${h.fromName}</b> ${h.finding}</span>
            </div>`)}
            ${map(devir.out, h => html`<div class="deskflow__row deskflow__row--out">
              <span class="deskflow__arrow">→</span>
              <span><b>${h.toName}</b> ${h.finding}</span>
            </div>`)}
          </div>`)}`,
      foot:html`${K.Button({ label:yz('esp.office.danis'), size:'sm', act:'open-agent',
          data:{ 'data-agent':a.id } })}
        ${when(a.owns && a.owns.length, () => K.Button({ label:yz('esp.office.masaya-git'), size:'sm',
          act:'go', data:{ 'data-route':a.owns[0] } }))}`,
    });
  }

  /* G · VİTRİN KARTLARI (brand/ortak/vitrin.js › ofis). Cümleler kural
     motorunun (`ruleText`); model cevabı balona girmez. Açık masa yok:
     «Danış» sohbeti açar, masa seçimi tutulmaz — konuşan Patron'dur. */
  function vitrinOfis(){
    const V = (window.LIFEOS || {}).VITRIN;
    if(!V || !V.ofis) return {};
    const aktif = ['patron'].concat(ESP.Mod.activeAgents().map(a => a.id).filter(id => id !== 'patron'));
    const kisi = id => { const a = ESP.AGENT_BY_ID[id]; return a ? { ad:a.short || a.name, harf:a.initial, gorsel:'' } : null; };
    const h = ESP.Office.handoffs()[0];
    return V.ofis({ modul:'esp', act:{ sor:'open-agent' },
      ajanlar:aktif.map(id => ESP.AGENT_BY_ID[id]).filter(Boolean).map(a => ({ id:a.id, ad:a.short || a.name, harf:a.initial, rol:a.role,
        patron:a.id === 'patron', gorsel:'', hazir:ESP.Office.ready(a.id),
        cumle:(() => { try{ return ESP.Office.ruleText(a.id, a.id === 'patron' ? ESP.Office.patronBrief() : ESP.Office.brief(a.id)); }catch(e){ return ''; } })(),
        yapar:V.maddele(a.scope), yapmaz:V.maddele(a.notScope) })),
      devir:h && kisi(h.from) && kisi(h.to) ? { kaynak:kisi(h.from), hedef:kisi(h.to), metin:h.finding + ' — ' + h.toName + '’a düşüyor.' } : null });
  }

  LIFEOS.PARCA.blok({ id:'office.uzman-masalari', sayfa:'office', yer:'y1', sira:10, ad:'Uzman masaları', ciz({ vo, patron, uzmanlar, devir, brf, next }){
    return K.Span(12, K.Ledger(() => [
        when(vo.masa, () => K.Entry({ wide:true, hint:'not-masa', label:yz('esp.office.masa'), meta:'kim konuşuyor',
          body:html`<div class="vofis">${raw(vo.masa)}${raw(vo.balon || '')}${raw(vo.durum || '')}</div>` })),
        when(vo.toplanti, () => K.Entry({ wide:true, label:yz('esp.office.gunun-toplantisi'), meta:'her masadan tek cümle',
          body:raw(vo.toplanti) })),

        K.Entry({
          label:yz('esp.office.patron'), hint:'rule-engine',
          meta:ESP.Office.ready('patron') ? 'model bağlı' : 'kural motoru',
          action:K.Button({ label:yz('esp.office.danis'), size:'sm', act:'open-agent',
            data:{ 'data-agent':'patron' } }),
          body:html`
            ${K.NextUp({ icon:next.rank ? 'zap' : 'check', calm:!next.rank,
              sanat:'istikrar',
              label:yz('esp.office.siradaki-tek-is'), title:next.title, why:next.why })}
            <p class="rulesay mt-10">${ESP.Office.ruleText('patron', brf)}</p>`,
        }),

        K.Entry({
          label:yz('esp.office.masalar-arasi-devir'), hint:'handoff',
          meta:devir.length ? devir.length + ' devir' : 'yok',
          wide:true,
          body:devir.length
            ? html`${when(vo.devir, () => html`<div class="mb-12">${raw(vo.devir)}</div>`)}${map(devir, h => html`
                <button class="handoff" data-act="go" data-route="${h.route}">
                  <span class="handoff__from">${h.fromName}</span>
                  <span class="handoff__arrow">→</span>
                  <span class="handoff__to">${h.toName}</span>
                  <span class="handoff__text">${h.finding}</span>
                </button>`)}`
            : K.Empty({ text:yz('esp.office.i-ki-masayi-birbirine-baglay') }),
        }),

        K.Entry({
          hint:'not-uzman-masalari', label:yz('esp.office.uzman-masalari'),
          meta:uzmanlar.length + ' masa',
          wide:true,
          /* Masa kartlarinin basligi h3'tur; araya bir h2 girmezse baslik
             sirasi h1'den h3'e atlar ve ekran okuyucu bir seviye kaybeder.
             h2 gozle gorunmez: kutunun etiketi zaten «Uzman masalari» der,
             ayni ad iki kez ust uste yazilmaz. */
          body:html`<h2 class="sr-only">${yz('esp.office.uzman-masalari')}</h2>
            <div class="desks">${map(uzmanlar, deskCard)}</div>`,
        }),

        /* Teklifler Onaylar çekmecesinde (tek yer, CEKMECE-HARITASI). */
        K.Entry({ label:yz('esp.office.oneriler'), hint:'proposal', meta:ESP.Plans.all().length + ' öneri',
          body:K.Button({ label:yz('esp.office.onaylar-da-gor'), size:'sm', act:'go', data:{ 'data-route':'onaylar' } }) }),


        K.Entry({
          label:yz('esp.office.haftalik-plan'), hint:'weekplan',
          meta:ESP.Plans.plan() ? 'kurulu' : 'yok',
          wide:true,
          body:ESP.Parts.weekPlan(),
        }),

        K.Entry({
          label:yz('esp.office.oncelik-sirasi'), hint:'precedence',
          meta:ESP.PRECEDENCE.length + ' kural',
          body:K.Table({ tight:true, headers:[{ label:'#', num:true }, 'Kural', 'Neden'],
            rows:ESP.PRECEDENCE.map(p => [String(p.rank), p.label, p.note]) }),
        }),

      ]));
  } });
  LIFEOS.PARCA.blok({ id:'office.sozluk-seridi', sayfa:'office', yer:'y2', sira:10, ad:'Sözlük şeridi', ciz({ vo, patron, uzmanlar, devir, brf, next }){
    return K.Span(12, (window.LIFEOS || {}).SOZLUK ? raw(window.LIFEOS.SOZLUK.seritHtml({ acik:ESP.Office.ready('patron') })) : '');
  } });
  function render(){
    const vo = vitrinOfis();
    const patron = ESP.AGENT_BY_ID.patron;
    const uzmanlar = ESP.Mod.activeAgents().filter(a => a.id !== 'patron');
    const devir = ESP.Office.handoffs();
    const brf = ESP.Office.patronBrief();
    const next = brf.next;

    const parcaB = { vo, patron, uzmanlar, devir, brf, next };
    return K.Grid(html`
      ${LIFEOS.PARCA.yer('office', 'y2', K, parcaB, typeof raw === 'undefined' ? null : raw)}
      ${LIFEOS.PARCA.yer('office', 'y1', K, parcaB, typeof raw === 'undefined' ? null : raw)}`);
  }

  const handle = {
    async 'open-agent'(el){
      S.ui.officeAgent = el.dataset.agent;
      ESP.App.go('team');
    },
  };

  const change = {};

  return {
    id:'office',
    /* Sadelik (brand/ortak/gizle.js): uzun aciklama ve basvuru bolumleri
       bastan kucuk gelir; baslik gorunur, ustune gelince onizlenir,
       «Ac» denirse acik kalir. Is yapilan bolumler ve sinir metinleri acik. */
    /* iPhone Faz 4 («brifing + tek eylem»): açık Patron ve teklifler;
       konuşan masa, toplantı satırları, uzman masaları, haftalık plan şerit. */
    kucukVarsayilan:['masalar-arası-devir', 'öncelik-sırası', 'masa', 'günün-toplantısı', 'uzman-masaları', 'haftalık-plan'],
    title:yz('esp.office.masalar'),
    headline(){
      const n = ESP.Office.notes().filter(x => x.tone === 'danger').length;
      if(n) return n + ' masada tıkanma bulgusu var.';
      const d = ESP.Office.handoffs();
      if(d.length) return d.length + ' bulgu başka bir masaya düşüyor.';
      return 'Masalarda bekleyen bulgu yok.';
    },
    lede(){
      return 'Dokuz masa: Patron, yedi uzman ve bir koç. Her masa yalnızca kendi '
           + 'ölçümüne bakar; çelişkiyi Patron çözer.';
    },
    stats(){
      const notlar = ESP.Office.notes();
      return [
        { value:String(ESP.Mod.activeAgents().length), label:'masa' },
        { value:String(notlar.filter(n => n.tone === 'danger').length), label:yz('esp.office.tikanma') },
        { value:String(notlar.filter(n => n.tone === 'warn').length), label:yz('esp.office.vadesi-gecmis') },
        { value:String(ESP.Office.handoffs().length), label:'devir' },
      ];
    },
    subtitle(){ return ESP.Office.notes().length + ' bulgu'; },
    actions(){ return ''; },
    render, handle, change,
  };
})();
