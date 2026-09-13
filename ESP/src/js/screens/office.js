/* Ofis — yedi masa ve aralarındaki devir.

   Patron dört uzmanın yanına dizilmez, ÜSTÜNE konur: kendi defteri kendi
   işi değil, trafiğin kendisidir.

   Masa notu bir tavsiye değil BULGUDUR: koşul sağlandığında kendiliğinden
   düşer, koşul geçtiğinde kendiliğinden kalkar. Kullanıcı silmez.

   Masanın sol kenarındaki kimlik şeridi bir DURUM değil bir İMZADIR:
   masanın kime ait olduğunu söyler. Durum renkleri (kırmızı/sarı/yeşil)
   kimlik şeridinde asla kullanılmaz; aciliyet yalnızca devir okuna dokunur.
   İki renk sistemi aynı yüzeyde karışmaz. */

window.ESP = window.ESP || {};
ESP.Screens = ESP.Screens || {};

ESP.Screens.office = (function(){
  const U = ESP.U, S = ESP.S;
  const { html, raw, when, map, cls } = ESP.h;
  const K = ESP.C;

  function avatar(a){
    return html`<span class="agentav" style="background:${a.color}"
      aria-hidden="true">${a.initial}</span>`;
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
                ${when(n.route, () => K.Button({ label:'Aç', size:'sm', act:'go',
                  data:{ 'data-route':n.route } }))}
              </li>`)}</ul>`
          : html`<p class="small muted">Bu masada bekleyen bulgu yok.</p>`}

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
      foot:html`${K.Button({ label:'Danış', size:'sm', act:'open-agent',
          data:{ 'data-agent':a.id } })}
        ${when(a.owns && a.owns.length, () => K.Button({ label:'Masaya git', size:'sm',
          act:'go', data:{ 'data-route':a.owns[0] } }))}`,
    });
  }

  function render(){
    const patron = ESP.AGENT_BY_ID.patron;
    const uzmanlar = ESP.Mod.activeAgents().filter(a => a.id !== 'patron');
    const devir = ESP.Office.handoffs();
    const brf = ESP.Office.patronBrief();
    const next = brf.next;

    return K.Grid(html`
      ${K.Span(12, K.Ledger(() => [

        K.Entry({
          label:'PATRON', hint:'rule-engine',
          meta:ESP.Office.ready('patron') ? 'model bağlı' : 'kural motoru',
          note:'Patron kendi hesabını yapmaz: altı uzmanın raporunu okur, '
             + 'çelişkiyi öncelik sırasına göre çözer.',
          action:K.Button({ label:'Danış', size:'sm', act:'open-agent',
            data:{ 'data-agent':'patron' } }),
          body:html`
            ${K.NextUp({ icon:next.rank ? 'zap' : 'check', calm:!next.rank,
              label:'Sıradaki tek iş', title:next.title, why:next.why })}
            <p class="rulesay mt-10">${ESP.Office.ruleText('patron', brf)}</p>`,
        }),

        K.Entry({
          label:'MASALAR ARASI DEVİR', hint:'handoff',
          meta:devir.length ? devir.length + ' devir' : 'yok',
          note:'Devir bir tavsiye değildir: «şu ölçüldü, şu masaya düşüyor» der. '
             + 'Ölçülmemiş bir şey devredilemez — tahmin devir üretmez.',
          wide:true,
          body:devir.length
            ? html`${map(devir, h => html`
                <button class="handoff" data-act="go" data-route="${h.route}">
                  <span class="handoff__from">${h.fromName}</span>
                  <span class="handoff__arrow">→</span>
                  <span class="handoff__to">${h.toName}</span>
                  <span class="handoff__text">${h.finding}</span>
                </button>`)}`
            : K.Empty({ text:'İki masayı birbirine bağlayan ölçülmüş bir bulgu yok.' }),
        }),

        K.Entry({
          label:'UZMAN MASALARI',
          meta:uzmanlar.length + ' masa',
          note:'Her ajan yalnızca kendi alanına bakar. Alan dışı bir soru gelirse '
             + 'sahibine yönlendirir, cevap uydurmaz.',
          wide:true,
          /* Masa kartlarinin basligi h3'tur; araya bir h2 girmezse baslik
             sirasi h1'den h3'e atlar ve ekran okuyucu bir seviye kaybeder. */
          body:html`${K.SectionTitle('Uzman masaları')}
            <div class="desks">${map(uzmanlar, deskCard)}</div>`,
        }),

        K.Entry({
          label:'ÖNCELİK SIRASI', hint:'precedence',
          meta:ESP.PRECEDENCE.length + ' kural',
          note:'İki uzman ters şey söylediğinde Patron bu sıraya uyar. '
             + 'Üstteki alttakini her zaman yener.',
          body:K.Table({ tight:true, headers:[{ label:'#', num:true }, 'Kural', 'Neden'],
            rows:ESP.PRECEDENCE.map(p => [String(p.rank), p.label, p.note]) }),
        }),

      ]))}`);
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
    title:'Masalar',
    headline(){
      const n = ESP.Office.notes().filter(x => x.tone === 'danger').length;
      if(n) return n + ' masada tıkanma bulgusu var.';
      const d = ESP.Office.handoffs();
      if(d.length) return d.length + ' bulgu başka bir masaya düşüyor.';
      return 'Masalarda bekleyen bulgu yok.';
    },
    lede(){
      return 'Yedi masa: Patron ve altı uzman. Her masa yalnızca kendi '
           + 'ölçümüne bakar; çelişkiyi Patron çözer.';
    },
    stats(){
      const notlar = ESP.Office.notes();
      return [
        { value:String(ESP.Mod.activeAgents().length), label:'masa' },
        { value:String(notlar.filter(n => n.tone === 'danger').length), label:'tıkanma' },
        { value:String(notlar.filter(n => n.tone === 'warn').length), label:'vadesi geçmiş' },
        { value:String(ESP.Office.handoffs().length), label:'devir' },
      ];
    },
    subtitle(){ return ESP.Office.notes().length + ' bulgu'; },
    actions(){ return ''; },
    render, handle, change,
  };
})();
