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

  /* ---------- BAM ürünleri (core/urun.js, ortak) ----------
     HKM'nin Üretim Bürosu'ndan gelen ve onaylanan özet, rapor, sunum,
     pankart. Basılı hâl bu modülün deposundadır: HKM kapalıyken de açılır.
     Liste boşsa bölüm çizilmez. */
  function urunlerKart(){
    const l = ESP.Urunler ? ESP.Urunler.liste() : [];
    if(!l.length) return '';
    const govde = html`<div class="stack-xs">${map(l, u => html`<div class="row gap-8 wrap">
      <span class="minw0"><b>${u.baslik}</b> <span class="tiny dim">· ${u.urunAd}
        · ${LIFEOS.Urun.etiketAdi(u.dogruluk)}</span></span>
      ${K.Button({ label:'Aç', size:'sm', act:'urun-ac', data:{ 'data-id':u.id } })}
      ${K.Button({ label:'Sil', size:'sm', tone:'ghost', act:'urun-sil', data:{ 'data-id':u.id } })}
    </div>`)}</div>`;
    return K.Entry({ label:'BAM ÜRÜNLERİ', hint:'hkm', meta:l.length + ' ürün', wide:true,
      note:'Sohbette «… hakkında özet hazırla» dersen King’e iletilir; bitince teklif olarak gelir.',
      body:html`${govde}` });
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
          note:'Patron kendi hesabını yapmaz: yedi uzman ve bir koçun raporunu okur, '
             + 'çelişkiyi öncelik sırasına göre çözer.',
          action:K.Button({ label:'Danış', size:'sm', act:'open-agent',
            data:{ 'data-agent':'patron' } }),
          body:html`
            ${K.NextUp({ icon:next.rank ? 'zap' : 'check', calm:!next.rank,
              sanat:'istikrar',
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
          label:'TEKLİFLER', hint:'proposal',
          meta:ESP.Plans.all().length + ' teklif',
          note:'Ajan doğrudan yazmaz: teklif eder, sen onaylarsın, uygulamayı '
             + 'kural motoru yapar. Her teklif ajanın KENDİ alanındadır.',
          wide:true,
          body:ESP.Parts.proposalList(ESP.Plans.all(),
            'Bekleyen teklif yok: masaların bulgusu eylem gerektirmiyor.'),
        }),

        urunlerKart(),

        K.Entry({
          label:'HAFTALIK PLAN', hint:'weekplan',
          meta:ESP.Plans.plan() ? 'kurulu' : 'yok',
          note:'Takvim değil sıra: hangi gün hangi disiplinin düştüğünü söyler, '
             + 'saat vermez.',
          wide:true,
          body:ESP.Parts.weekPlan(),
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
    /* Ürün KUTUDA açılır: sandbox iframe, betik çalışmaz (core/urun.js). */
    async 'urun-ac'(el){
      const u = ESP.Urunler && ESP.Urunler.bul(el.dataset.id);
      if(!u) return;
      ESP.UI.sheet({ title:u.baslik, wide:true,
        subtitle:u.urunAd + ' · ' + LIFEOS.Urun.etiketAdi(u.dogruluk),
        note:u.dogruluk === 'dogrulanmadi' ? 'Doğrulanmadı: kaynaksız, modelin bilgisidir. '
          + 'Karar vermeden önce bir kaynağa bak.' : null,
        body:LIFEOS.Urun.cerceve(u) });
    },
    async 'urun-sil'(el){
      const id = el.dataset.id;
      ESP.UI.confirmSheet('Ürünü sil', 'Ürün yalnız bu cihazdan silinir; HKM’deki kaydı durur.',
        async () => { await ESP.Urunler.sil(id); ESP.UI.toast('Silindi'); ESP.App.render(); }, true);
    },
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
      return 'Dokuz masa: Patron, yedi uzman ve bir koç. Her masa yalnızca kendi '
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
