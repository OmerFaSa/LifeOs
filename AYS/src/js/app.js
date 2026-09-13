/* Uygulama kabugu: gezinme, yonlendirme, olay dagitimi ve acilis. */

window.R = window.R || {};

R.App = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map, cls, attrs } = R.h;

  /* Birincil gezinme 5 grup. Ikincil seviyeler ekran ici alt-sekme olarak durur. */
  /* BOLUMLER — numarali ust serit.

     Sol panel kaldirildi. Numara bir sus degil: alti bolumun SIRASI
     anlamlidir (once gunu gir, sonra plani gor, sonra kaydi tut,
     sonra analize bak) ve numara o sirayi gorunur kilar.

     SPI ile ayni kabuk: kunye + numarali serit + hero. Iki uygulama
     yan yana acildiginda ayni sistemden geldikleri anlasilmalidir. */
  const NAV = [
    { id:'gunluk', num:'01', icon:'today', label:'Günlük',
      note:'Bugünü gir, haftayı gör', items:[
      { id:'today', icon:'today', label:'Bugün' },
      { id:'week',  icon:'week',  label:'Hafta' },
    ]},
    { id:'plan', num:'02', icon:'map', label:'Plan',
      note:'Program, dersler ve hedef', items:[
      { id:'plan',     icon:'map',    label:'Program' },
      { id:'subjects', icon:'book',   label:'Dersler' },
      { id:'target',   icon:'target', label:'Hedef' },
    ]},
    { id:'kayit', num:'03', icon:'play', label:'Kayıt',
      note:'Öğrenme, deneme, tekrar ve soru', items:[
      { id:'learn', icon:'play',  label:'Öğrenme' },
      { id:'exams', icon:'exam',  label:'Deneme' },
      { id:'cards', icon:'cards', label:'Tekrar' },
      { id:'quiz',  icon:'zap',   label:'Sınama' },
      { id:'solve', icon:'search', label:'Soru çöz' },
    ]},
    { id:'analiz', num:'04', icon:'chart', label:'Analiz',
      note:'İlerleme, analiz ve telafi', items:[
      { id:'progress',  icon:'chart',  label:'İlerleme' },
      { id:'analytics', icon:'search', label:'Analiz' },
      { id:'protocols', icon:'shield', label:'Telafi' },
    ]},
    { id:'rehber', num:'05', icon:'guide', label:'Rehber',
      note:'Kullanım ve profiller', items:[
      { id:'guide', icon:'guide', label:'Rehber' },
      { id:'profiles', icon:'shield', label:'Profiller' },
    ]},
    { id:'ofis', num:'06', icon:'zap', label:'Ofis',
      note:'Patron ve beş koç', items:[
      { id:'office',  icon:'guide', label:'Ofis' },
      { id:'team',    icon:'zap',   label:'Ekip sohbeti' },
      { id:'meeting', icon:'list',  label:'Toplantı' },
    ]},
  ];

  const MOBILE_TABS = ['today','learn','cards','quiz','progress'];

  function screen(){ return R.Screens[S.route] || R.Screens.today; }

  function badgeFor(id){
    if(id === 'cards'){
      const n = C.dueCards().length;
      return n ? { text:String(n), quiet:C.cardDebt() <= 10 } : null;
    }
    if(id === 'exams'){
      const n = C.analysisDebt().length;
      return n ? { text:String(n), quiet:false } : null;
    }
    if(id === 'protocols'){
      const n = C.protocolTriggers().length + M.activeProtocols().length;
      return n ? { text:String(n), quiet:!C.protocolTriggers().length } : null;
    }
    if(id === 'week'){
      const w = S.weeks[M.weekId(M.currentWeek())];
      return (w && !w.signedAt) ? { text:'!', quiet:true } : null;
    }
    return null;
  }

  /* Marka satırı profilden gelir; sabit hedef ya da isim yoktur. */
  function brandLine(){
    const p = S.profile;
    if(!p) return 'kişisel çalışma sistemi';
    const rank = p.targetRank ? U.fmtNum(p.targetRank) : null;
    const prog = (p.program || '').replace(/^.*Üniversitesi\s*/i, '').trim();
    if(rank && prog) return rank + ' · ' + prog;
    if(prog) return prog;
    if(rank) return 'hedef sıra ' + rank;
    return 'kişisel çalışma sistemi';
  }

  /* Bir ekran hangi bolumde? */
  function bolumOf(route){
    return NAV.find(g => g.items.some(i => i.id === route)) || NAV[0];
  }

  /* Bolumun rozeti: icindeki sayfalarin rozetlerinin toplami. */
  function bolumBadge(sec){
    let sessiz = 0, yuksek = 0;
    sec.items.forEach(it => {
      const b = safe(() => badgeFor(it.id), null);
      if(!b) return;
      const n = Number(String(b.text).replace(/\D/g, '')) || 1;
      if(b.quiet) sessiz += n; else yuksek += n;
    });
    if(yuksek) return { text:String(yuksek), quiet:false };
    if(sessiz) return { text:String(sessiz), quiet:true };
    return null;
  }

  /* ---------- kunye ----------

     Uygulama cubugu degil KUNYE. Iki satir:

       1. kimlik · tarih · araclar   — sayfayla birlikte yukari kayar
       2. numarali bolumler          — kaydirinca ustte yapisir

     Ilk satirin kaymasina izin vermek kasitlidir: okurken kimlige
     ihtiyac yoktur, gezinmeye vardir. */
  function mastheadHtml(){
    const now = new Date();
    const gun = now.toLocaleDateString('tr-TR', { weekday:'long' });
    return html`
      <div class="masthead">
        <div class="wrapc masthead__in">
          <button class="brand" data-act="go" data-route="today" aria-label="Bugün bölümüne git">
            <span class="brand__mark" aria-hidden="true">R</span>
            <span class="brand__text"><b>Rota</b><span>${brandLine()}</span></span>
          </button>

          <div class="masthead__date">
            <span class="masthead__day">${U.fmtDate(U.todayISO())}</span>
            <span class="masthead__wd">${gun}</span>
          </div>

          <div class="navtools">
            ${R.C.IconButton({ icon:'search', aria:'Komut paleti (Ctrl+K)', title:'Ctrl+K', act:'open-palette' })}
            ${R.C.IconButton({ icon:'palette', aria:'Görünüm', title:'Tema, palet ve düzen',
              act:'open-appearance', data:{ id:'appearance-btn' } })}
            ${R.C.IconButton({ icon:'gear', aria:'Rehber ve ayarlar', act:'go', data:{ 'data-route':'guide' } })}
            ${R.C.IconButton({ icon:'menu', aria:'Bölümler', act:'toggle-sidebar', class:'sitenav__menu' })}
          </div>
        </div>
      </div>`;
  }

  function sitenavHtml(sc){
    const aktif = bolumOf(sc.id);
    return html`
      <nav class="sitenav" aria-label="Bölümler">
        <div class="wrapc navlinks">${map(NAV, sec => {
          const on = sec.id === aktif.id;
          const b = bolumBadge(sec);
          return html`<button class="${cls('navlink', on && 'is-active')}"
            data-act="go" data-route="${sec.items[0].id}"
            ${when(on, () => attrs({ 'aria-current':'page' }))}>
            <span class="navlink__num" aria-hidden="true">${sec.num}</span>
            <span class="navlink__label">${sec.label}</span>
            ${when(b, () => html`<span class="${cls('navlink__badge', b.quiet && 'is-quiet')}"
              aria-label="${b.text + ' bekleyen'}">${b.text}</span>`)}
          </button>`;
        })}</div>
      </nav>`;
  }

  /* Hero — bolum numarasi, baslik ve ozet. Eski ust cubugun yerini
     alir ama ondan farkli bir sey yapar: cubuk gezinmeydi, hero
     SAYFANIN KENDISIDIR. */
  function heroHtml(sc){
    const sec = bolumOf(sc.id);
    const baslik = safe(() => sc.headline ? sc.headline() : '') || sc.title;
    const ozet = safe(() => sc.lede ? sc.lede() : '') || safe(() => sc.subtitle());
    const eylem = safe(() => sc.actions ? sc.actions() : '');
    const cur = M.currentWeek();
    const kalan = U.diffDays(U.todayISO(), R.PLAN.examTytISO);

    return html`
      <div class="hero" data-num="${sec.num}">
        <div class="wrapc hero__in">
          <div class="hero__main">
            <div class="hero__eyebrow">
              <span class="hero__num">${sec.num}</span>
              ${raw(UI.icon(sec.icon))}
              <span>${sec.label}</span>
            </div>
            <h1 class="hero__title">${baslik}</h1>
            ${when(ozet, () => html`<p class="hero__lede">${raw(ozet)}</p>`)}
            ${when(eylem, () => html`<div class="hero__actions">${raw(eylem)}</div>`)}
          </div>
          <div class="hero__side">
            <div class="herostat">
              <span class="herostat__value">${kalan}<small>gün</small></span>
              <span class="herostat__label">TYT (tahmini)</span>
            </div>
            <div class="herostat">
              <span class="herostat__value">${cur}<small>/${R.PLAN.totalWeeks}</small></span>
              <span class="herostat__label">hafta</span>
            </div>
          </div>
          <div class="hero__motif" aria-hidden="true">${raw(UI.motif(sec.id))}</div>
        </div>
      </div>`;
  }

  /* Bolumun sayfalari. Tek sayfaliysa cizilmez — tek sekmeli bir
     serit secim degil gurultu olur. */
  function pagenavHtml(sc){
    const sec = bolumOf(sc.id);
    if(sec.items.length < 2) return '';
    return html`
      <nav class="pagenav" aria-label="${sec.label + ' sayfaları'}">
        <div class="wrapc pagenav__in">${map(sec.items, v => {
          const on = v.id === sc.id;
          const b = safe(() => badgeFor(v.id), null);
          return html`<button class="${cls('pagelink', on && 'is-active')}"
            data-act="go" data-route="${v.id}"
            ${when(on, () => attrs({ 'aria-current':'page' }))}>
            ${raw(UI.icon(v.icon))}<span>${v.label}</span>
            ${when(b, () => html`<span class="${cls('pagelink__badge', b.quiet && 'is-quiet')}">${b.text}</span>`)}
          </button>`;
        })}</div>
      </nav>`;
  }

  /* Dar ekranda tam bolum listesi — kunyedeki menu dugmesi acar. */
  function navsheetHtml(sc){
    const aktif = bolumOf(sc.id);
    return html`
      <div class="navsheet" role="dialog" aria-label="Bölümler">
        <div class="navsheet__panel">
          <div class="navsheet__head">
            <b>Bölümler</b>
            ${R.C.IconButton({ icon:'close', plain:true, aria:'Kapat', act:'toggle-sidebar' })}
          </div>
          <div class="navsheet__list">${map(NAV, sec => html`
            <div class="navsheet__sec">
              <div class="navsheet__num">${sec.num}</div>
              <div class="minw0">
                <b>${sec.label}</b>
                <span class="tiny dim">${sec.note}</span>
                <div class="navsheet__views">${map(sec.items, v => html`
                  <button class="${cls('navsheet__view', v.id === sc.id && 'is-active')}"
                    data-act="go" data-route="${v.id}">${v.label}</button>`)}</div>
              </div>
            </div>`)}
          </div>
          <div class="navsheet__foot">${raw(storeHealthHtml())}</div>
        </div>
      </div>`;
  }

  /* Alt bant — sayfayi sonlandirir ve sistemin degismez cumlesini
     her ekranda bir kez soyler. */
  function footerHtml(){
    const progress = M.programProgress();
    const cur = M.currentWeek();
    return html`
      <footer class="sitefoot">
        <div class="wrapc sitefoot__in">
          <div class="sitefoot__brand">
            <span class="brand__mark" aria-hidden="true">R</span>
            <div>
              <b>Rota</b>
              <span>Kişisel çalışma sistemi</span>
            </div>
          </div>
          <div class="sitefoot__notes">
            <p><span class="sitefoot__k">Hafta</span> ${cur}/${R.PLAN.totalWeeks} · program %${progress}</p>
            <p><span class="sitefoot__k">Mahremiyet</span> Veriler bu cihazda tutulur.
              Ad ve şehir hiçbir modele gönderilmez.</p>
            ${raw(buildStampHtml())}
          </div>
        </div>
      </footer>`;
  }

  function tabbarHtml(){
    return html`<nav class="tabbar" aria-label="Hızlı gezinme">${map(MOBILE_TABS, id => {
      const item = NAV.reduce((f, g) => f || g.items.find(i => i.id === id), null)
        || { label:id, icon:'right' };
      const on = S.route === id;
      const b = safe(() => badgeFor(id), null);
      return html`<button class="${cls('tabbtn', on && 'is-active')}" data-act="go" data-route="${id}"
        aria-label="${item.label}" ${when(on, () => attrs({ 'aria-current':'page' }))}>
        <span class="tabbtn__ic">${raw(UI.icon(item.icon))}</span>
        <span class="tabbtn__t">${item.label}</span>
        ${when(b, () => html`<span class="${cls('tabbtn__b', b.quiet && 'is-quiet')}"
          aria-label="${b.text + ' bekleyen'}">${b.text}</span>`)}</button>`;
    })}</nav>`;
  }

  /* ---------- derleme damgası ----------

     Ekrandaki sayfanın HANGİ derleme olduğunu söyler. Küçük bir ayrıntı
     gibi görünür ama olmadığında pahalıya patlıyor: bir hata
     düzeltildikten sonra kullanıcı hâlâ eski davranışı görebiliyor ve
     bunu anlamanın hiçbir yolu olmuyor. Tarayıcı eski bir js dosyasını
     önbellekten verdiğinde arayüz aynı görünür, davranış eskidir.

     Yanındaki düğme tarayıcıyı önbelleği atlamaya zorlar: adres bir
     kerelik damgayla yeniden yüklenir. */
  function buildStampHtml(){
    const b = R.BUILD || {};
    if(!b.id) return '';
    return String(html`<p class="sitefoot__build">
      <span class="sitefoot__k">Derleme</span>
      <span class="sitefoot__sha"${when(b.dirty, () => attrs({
        title:'Bu derleme kaydedilmemiş yerel değişiklik içeriyor; '
          + 'bir commit\'e birebir karşılık gelmez.' }))}>${b.id}${when(b.dirty,
        () => html`<span aria-label="yerel değişiklikli">+</span>`)}</span>
      ${when(b.at, () => html`<span class="dim"> · ${b.at}</span>`)}
      <button class="sitefoot__reload" data-act="hard-reload"
        title="Tarayıcının önbelleğini atlayarak yeniden yükler">tazele</button>
    </p>`);
  }

  /* ------------------------------------------------------------- görünüm

     Tema ve palet üst çubuktan tek dokunuşla değişir. Ayarların dördüncü
     sekmesine gömülü bir tercih, hiç kullanılmayan bir tercihtir.

     Seçim profile yazılır; yani cihaz değil KİŞİ hatırlanır ve hane
     profilleri arasında geçerken herkesin kendi görünümü gelir. */
  const THEMES = [
    { id:'system', icon:'monitor', label:'Sistem' },
    { id:'light',  icon:'sun',     label:'Açık' },
    { id:'dark',   icon:'moon2',   label:'Koyu' },
  ];

  function appearanceHtml(){
    const p = S.profile || {};
    const theme = p.theme || 'system';
    const palette = p.palette || R.DEFAULT_PALETTE;
    const design = p.design || R.DEFAULT_DESIGN;
    return String(html`
      <div class="appear" id="appearance" role="dialog" aria-label="Görünüm">
        <div class="appear__label">Tema</div>
        <div class="appear__themes">${map(THEMES, t => html`
          <button class="${cls('themebtn', t.id === theme && 'is-on')}"
            data-act="set-theme" data-theme="${t.id}"
            aria-pressed="${t.id === theme ? 'true' : 'false'}">
            ${raw(UI.icon(t.icon))}<span>${t.label}</span>
          </button>`)}
        </div>

        <div class="appear__label">Palet</div>
        <div class="appear__palettes">${map(R.PALETTES, pal => html`
          <button class="${cls('palbtn', pal.id === palette && 'is-on')}"
            data-act="set-palette" data-palette="${pal.id}" title="${pal.note}"
            aria-pressed="${pal.id === palette ? 'true' : 'false'}">
            <span class="palbtn__dot" style="background:${pal.swatch[0]}"></span>
            <span>${pal.name}</span>
          </button>`)}
        </div>

        <div class="appear__label">Düzen</div>
        <div class="appear__designs">${map(R.DESIGNS, d => html`
          <button class="${cls('desbtn', d.id === design && 'is-on')}"
            data-act="set-design" data-design="${d.id}" title="${d.note}"
            aria-pressed="${d.id === design ? 'true' : 'false'}">
            <span class="${'desbtn__mini desbtn__mini--' + d.swatch}" aria-hidden="true"
              >${raw('<i></i>'.repeat(d.swatch === 'nodes' ? 4 : 5))}</span>
            <span class="desbtn__name">${d.name}</span>
          </button>`)}
        </div>

        <p class="appear__note">Tema, palet ve düzen bu profile kaydedilir.
          «Sistem» seçiliyken cihazın açık/koyu tercihi izlenir. Düzen yalnız
          iskeleti değiştirir: durum renkleri ve kesinlik etiketleri
          hiçbir düzende değişmez.</p>
      </div>`);
  }

  function openAppearance(anchor){
    closeAppearance();
    const root = document.getElementById('overlay-root');
    const el = document.createElement('div');
    el.innerHTML = appearanceHtml();
    const panel = el.firstElementChild;
    root.appendChild(panel);

    /* Çapaya göre konumla; ekranın dışına taşarsa içeri çek. */
    const r = anchor.getBoundingClientRect();
    const w = panel.offsetWidth;
    let left = r.right - w;
    left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
    let top = r.bottom + 8;
    if(top + panel.offsetHeight > window.innerHeight - 12){
      top = Math.max(12, r.top - panel.offsetHeight - 8);
    }
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }
  function closeAppearance(){
    const el = document.getElementById('appearance');
    if(el) el.remove();
  }
  function isAppearanceOpen(){ return !!document.getElementById('appearance'); }

  /* Paneli yerinde tazele: tema değişince sayfa yeniden çizilmez, yalnızca
     kök nitelikleri ve panelin işaretli düğmesi değişir. Böylece açık panel
     kapanmaz ve seçimin etkisi anında görülür. */
  function refreshAppearance(){
    const el = document.getElementById('appearance');
    if(!el) return;
    const left = el.style.left, top = el.style.top;
    const wrap = document.createElement('div');
    wrap.innerHTML = appearanceHtml();
    const next = wrap.firstElementChild;
    next.style.left = left; next.style.top = top;
    el.replaceWith(next);
  }

  function safe(fn, fallback){
    try{ return fn(); }
    catch(e){ console.error(e); return fallback || ''; }
  }

  function errorPanel(err){
    const msg = (err && err.message) ? err.message : String(err);
    return String(R.C.Notice({ tone:'danger', title:'Bu ekran çizilemedi.',
      body:R.h.html`${msg}
        <div class="row wrap errorpanel__actions">
          ${R.C.Button({ label:'Bugün ekranına dön', size:'sm', act:'go', data:{ 'data-route':'today' } })}
          ${R.C.Button({ label:'Yeniden yükle', size:'sm', act:'reload' })}
        </div>
        <p class="tiny dim">Diğer ekranlar soldaki menüden açılmaya devam eder. Veriler silinmedi.</p>` }));
  }

  /* Yeniden cizimde odagi ve imlec konumunu korumak icin
     aktif alani niteliklerinden turetilen kararli bir anahtarla isaretle. */
  const FOCUS_ATTRS = ['data-change','data-act','data-block','data-field','data-i','data-date','data-t','name'];
  function focusSnapshot(){
    const el = document.activeElement;
    if(!el || el === document.body) return null;

    /* ODAK YALNIZ FORM ALANLARINDA KORUNUYORDU.

       Bir düğmeye basmak çoğu zaman yeniden çizim tetikler; düğme form
       alanı olmadığı için anlık görüntü alınmıyor, çizimden sonra odak
       `<body>`ye düşüyordu. Sonuç: klavyeyle çalışan biri her eylemden
       sonra sayfanın başına dönüyor ve listede bulunduğu yeri kaybediyor.

       Artık odaklanabilir her öge işaretlenir. Ögenin kendisi bulunamazsa
       (liste değiştiyse) odak içerik alanına döner — sayfanın başına
       değil. `icerikte` bunu söyler. */
    const odaklanabilir = /^(input|textarea|select|button|a)$/i.test(el.tagName)
      || el.getAttribute('role') === 'button'
      || el.hasAttribute('tabindex');
    if(!odaklanabilir) return null;
    const icerikte = !!(el.closest && el.closest('#main'));
    let selector = null;
    if(el.id){
      selector = '#'+el.id.replace(/([^\w-])/g, '\\$1');
    }else{
      const parts = FOCUS_ATTRS
        .map(a => { const v = el.getAttribute(a); return v == null ? null : '['+a+'="'+v.replace(/"/g,'\\"')+'"]'; })
        .filter(Boolean);
      if(parts.length) selector = el.tagName.toLowerCase()+parts.join('');
    }
    if(!selector) return icerikte ? { selector:null, icerikte:true } : null;
    const snap = { selector, icerikte };
    try{
      if(el.selectionStart != null){ snap.start = el.selectionStart; snap.end = el.selectionEnd; }
    }catch(e){ /* number/date girdilerinde secim okunamaz */ }
    return snap;
  }
  function restoreFocus(snap){
    if(!snap) return;
    const icerige = () => {
      if(!snap.icerikte) return;
      const main = document.getElementById('main');
      if(main){ try{ main.focus({ preventScroll:true }); }catch(e){} }
    };
    if(!snap.selector){ icerige(); return; }
    /* ARAMA İÇERİK ALANIYLA SINIRLANIR.

       Seçici niteliklerden türetilir (`button[data-act="..."]`) ve tek
       başına benzersiz değildir: aynı eylem künyede, hero'da ya da alt
       sayfada da bulunabilir. `document.querySelector` belge sırasında
       İLK eşleşeni döndürdüğü için odak bambaşka bir düğmeye taşınıyordu.
       Anlık görüntü içerikte alındıysa arama da orada yapılır. */
    const kok = snap.icerikte ? (document.getElementById('main') || document) : document;
    let el;
    try{ el = kok.querySelector(snap.selector); }catch(e){ icerige(); return; }
    if(!el){ icerige(); return; }
    el.focus({ preventScroll:true });
    if(snap.start != null){
      try{ el.setSelectionRange(snap.start, snap.end); }catch(e){}
    }
  }

  let rendering = false;
  let queued = null;
  /* Ayni karede pes pese gelen render cagrilarini tek cizime indirger.
     Arka plan sekmesinde rAF hic calismaz; bu yuzden zamanlayici yedegi vardir. */
  function nextFrame(fn){
    let done = false;
    const once = () => { if(done) return; done = true; fn(); };
    if(typeof requestAnimationFrame === 'function') requestAnimationFrame(once);
    setTimeout(once, 50);
  }

  function render(){
    if(queued) return queued;
    queued = new Promise(resolve => {
      nextFrame(async () => {
        queued = null;
        await doRender();
        resolve();
      });
    });
    return queued;
  }

  async function doRender(){
    if(rendering) return;
    rendering = true;
    try{
      const sc = screen();
      const main = document.getElementById('main');
      const scroll = main ? main.scrollTop : 0;
      const focus = focusSnapshot();
      let body;
      try{
        body = String(await sc.render());
      }catch(err){
        console.error('Ekran hatası ('+sc.id+'):', err);
        body = errorPanel(err);
      }

      document.getElementById('app').innerHTML = String(html`
        <a class="skiplink" href="#main">İçeriğe atla</a>
        <div class="site">
          ${safe(mastheadHtml)}
          ${safe(() => sitenavHtml(sc))}
          ${safe(() => heroHtml(sc))}
          ${safe(() => pagenavHtml(sc))}
          <div class="site__body">
            <main class="wrapc content" id="main" tabindex="-1" aria-label="${sc.title}">${raw(body)}</main>
          </div>
          ${safe(footerHtml)}
          ${tabbarHtml()}
        </div>
        ${when(S.sidebarOpen, () => safe(() => navsheetHtml(sc)))}`);

      const newMain = document.getElementById('main');
      if(newMain && scroll) newMain.scrollTop = scroll;
      restoreFocus(focus);
      /* Odağı ancak YÖNLENDİRMEDEN sonra taşı: sıradan bir yeniden
         çizimde taşımak, yazan kullanıcının imlecini alandan koparırdı. */
      if(rotaDegisti){ rotaDegisti = false; rotayaOdaklan(sc); }
      /* Kabuk her cizimde yeniden kuruluyor; acik bir alt sayfa varsa
         `inert` onunla birlikte silinir ve arka plan yeniden okunur
         hale gelir. Cizimden sonra geri konur. */
      if(R.UI.isSheetOpen()){
        const kabuk = document.querySelector('.site');
        if(kabuk){ kabuk.setAttribute('inert', ''); kabuk.setAttribute('aria-hidden', 'true'); }
      }
      if(sc.afterRender) sc.afterRender();
    }catch(err){
      console.error('Render hatası:', err);
      document.getElementById('app').innerHTML = String(html`<div class="content">
        ${R.C.Notice({ tone:'danger', title:'Ekran çizilirken bir hata oluştu.',
          body:html`${err && err.message ? err.message : String(err)}
            <div class="mt-8">${R.C.Button({ label:'Yeniden yükle', size:'sm', act:'reload' })}</div>` })}
      </div>`);
    }finally{
      rendering = false;
    }
  }

  /* Kismi cizim: tum #app yerine yalniz degisen dilimi yeniler.
     Sik tetiklenen etkilesimlerde (sayac, kart cevirme, kontrol listesi)
     tam render yerine bu kullanilir — odak ve kaydirma hic bozulmaz.
     Hedef bulunamazsa false doner; cagiran tam render'a duser. */
  function patch(selector, node){
    const el = document.querySelector(selector);
    if(!el) return false;
    const focus = focusSnapshot();
    el.innerHTML = String(node);
    restoreFocus(focus);
    return true;
  }

  /* Bolumun rengi KOKTE durur: CSS `--sec` jetonunu oradan okur.

     palettes.css yedi bolum imzasi tasiyordu ama kimse `data-section`
     yazmiyordu: alti bolumun altisi da ana rengi kullaniyordu, yani
     «tek tasarim, alti imza» kurali yaziliydi ama calismiyordu.

     Yeniden cizimde degil YONLENDIRMEDE yazilir ki her karede DOM'a
     dokunulmasin. */
  function applySection(route){
    document.documentElement.setAttribute('data-section', bolumOf(route).id);
  }

  function go(route){
    /* Ekran degisirse sesli oturum biter: paneli olmayan bir ekranda
       acik kalan mikrofon, kullanicinin goremedigi bir kayittir. */
    if(R.Talk && R.Talk.isActive()) R.Talk.stop();
    S.route = route;
    rotaDegisti = true;
    applySection(route);
    S.sidebarOpen = false;
    if(route !== 'exams') S.ui.examOpen = S.ui.examOpen;
    window.scrollTo(0,0);
    render();
  }


  /* ---------- yönlendirme duyurusu ve odak ----------

     EKRAN DEĞİŞİNCE EKRAN OKUYUCU HİÇBİR ŞEY SÖYLEMİYORDU.

     Tek sayfalık bir uygulamada gezinme, tarayıcının sayfa yüklemesi
     değildir: adres değişmez, başlık okunmaz, odak yerinde kalır. Fareyle
     çalışan biri yeni ekranı görür; klavye ya da ekran okuyucuyla çalışan
     biri için HİÇBİR ŞEY olmamıştır — odak hâlâ bastığı bağlantıdadır ve
     altındaki içeriğin değiştiğinden haberi yoktur.

     İki şey yapılır ve yalnız YÖNLENDİRMEDE yapılır:

       · gelinen ekranın adı görünmez bir canlı alana yazılır
       · odak `<main>`'e taşınır (zaten `tabindex="-1"` taşır)

     Her çizimde yapılsaydı, bir alana yazarken odak elden giderdi. */
  let rotaDegisti = false;

  function duyur(metin){
    const el = document.getElementById('rota-duyuru');
    if(!el || !metin) return;
    /* Aynı metin üst üste yazılırsa okuyucu ikinciyi seslendirmez;
       önce boşaltmak duyurunun her seferinde duyulmasını sağlar. */
    el.textContent = '';
    setTimeout(() => { el.textContent = metin; }, 30);
  }

  function rotayaOdaklan(sc){
    const main = document.getElementById('main');
    if(main){ try{ main.focus({ preventScroll:true }); }catch(e){} }
    const ad = (sc && sc.title) || '';
    if(ad) duyur(ad + ' ekranı açıldı');
  }

  function applyTheme(){
    const root = document.documentElement;
    const t = S.profile ? S.profile.theme : 'system';
    if(t === 'light') root.setAttribute('data-theme','light');
    else if(t === 'dark') root.setAttribute('data-theme','dark');
    else root.removeAttribute('data-theme');

    const p = (S.profile && S.profile.palette) || R.DEFAULT_PALETTE;
    if(p === R.DEFAULT_PALETTE) root.removeAttribute('data-palette');
    else root.setAttribute('data-palette', p);

    /* Duzen ISKELETI degistirir: gezinmenin nerede durdugunu, kartin
       kutu mu cizgi mi oldugunu. Varsayilan olan hicbir sey YAZMAZ —
       varsayilanin bedeli sifir olmalidir. */
    /* TANIMSIZ DUZEN VARSAYILANA DUSER. Eski profillerde artik olmayan
       bir duzen adi kayitli olabilir ('panel'); onu koke yazmak, hicbir
       kurali olmayan bir nitelik birakir ve hata ayiklarken yaniltir. */
    const d = (S.profile && S.profile.design) || R.DEFAULT_DESIGN;
    if(d === R.DEFAULT_DESIGN || !R.DESIGN_BY_ID[d]) root.removeAttribute('data-design');
    else root.setAttribute('data-design', d);
  }

  /* ---------- kuresel eylemler ---------- */
  const globalHandle = {
    async go(el){
      if(el.dataset.tab) S.ui.cardTab = el.dataset.tab;
      go(el.dataset.route);
    },
    async 'toggle-sidebar'(){ S.sidebarOpen = !S.sidebarOpen; render(); },
    async hint(el){
      if(UI.isHintOpen() && el.dataset.hint === UI._lastHint){ UI.closeHint(); UI._lastHint = null; return; }
      UI._lastHint = el.dataset.hint;
      UI.openHint(el.dataset.hint, el);
    },
    /* Ekran acıklamaları paneli — kapali baslar, tercih oturumda kalir. */
    async 'rail-toggle'(el){
      S.ui.railOpen = !S.ui.railOpen;
      const rail = el.closest('.rail');
      if(!rail) return render();
      const body = rail.querySelector('.rail__body');
      rail.classList.toggle('is-open', S.ui.railOpen);
      el.setAttribute('aria-expanded', S.ui.railOpen ? 'true' : 'false');
      if(body) body.hidden = !S.ui.railOpen;
    },
    async 'open-palette'(){ R.Palette.open(); },
    async 'open-appearance'(el){
      if(isAppearanceOpen()){ closeAppearance(); return; }
      openAppearance(el);
    },
    async 'set-theme'(el){
      S.profile.theme = el.dataset.theme;
      await M.saveProfile();
      applyTheme(); refreshAppearance();
    },
    async 'set-palette'(el){
      S.profile.palette = el.dataset.palette;
      await M.saveProfile();
      applyTheme(); refreshAppearance();
    },
    /* Duzen degisince sayfa YENIDEN CIZILIR: kimi duzen kabugun
       izgarasini degistiriyor ve yapiskan sutunlarin yeni olcuyle
       yerlesmesi gerekiyor. */
    async 'set-design'(el){
      S.profile.design = el.dataset.design;
      await M.saveProfile();
      applyTheme(); refreshAppearance(); render();
    },
    /* Sert yenileme: adrese bir kerelik damga eklenir, boylece tarayici
       sayfayi ve bagli dosyalari onbellekten degil sunucudan ister.
       `location.reload()` bunu garanti etmez. */
    async 'hard-reload'(){
      const u = new URL(location.href);
      u.searchParams.set('tazele', String(Date.now()));
      location.replace(u.toString());
    },
    async 'setup-open'(){ R.Setup.open(); },
    async 'setup-save'(){ await R.Setup.save(); },
    async 'setup-quick'(el){ R.Setup.quick(el.dataset.start); },
    async 'setup-next'(){ R.Setup.next(); },
    async 'setup-back'(){ R.Setup.back(); },
    async 'setup-level'(el){ R.Setup.setLevel(el.dataset.level); },
    async 'setup-weak'(el){ R.Setup.toggleWeak(el.dataset.id); },
    async 'focus-open'(){ R.Palette.openFocus(); },
    async 'focus-close'(){ R.Palette.closeFocus(); },
    async 'focus-finish'(el){
      R.Palette.closeFocus();
      await R.Screens.today.handle['timer-stop'](el);
    },
    /* Siradaki hamle kartindan tetiklenen genel yonlendirme */
    async 'next-action'(el){
      const act = el.dataset.next;
      const route = el.dataset.route;
      if(route && route !== S.route){ go(route); }
      if(!act) return;
      setTimeout(async () => {
        const sc = screen();
        const fn = (sc.handle && sc.handle[act]) || globalHandle[act];
        if(fn) await fn({ dataset:{ block:el.dataset.block || '', exam:el.dataset.exam || '' } });
      }, route && route !== S.route ? 80 : 0);
    },
    async 'sheet-close'(){ UI.closeSheet(); },
    /* Paletten gelen veri girisi onayi — bkz. core/palette.js */
    async 'veri-kaydet'(){ await R.Palette.veriKaydet(); },
    async reload(){ location.reload(); },
    /* Herhangi bir ekrandan bir ajana soru sormak icin. */
    async 'ask-agent'(el){
      S.ui.officeAgent = el.dataset.agent || 'patron';
      go('team');
    },
    async 'show-store-error'(){
      const sh = S.storeHealth;
      if(!sh) return;
      const h = sh.health || {};
      const K = R.C;
      const state = (v, okLabel) => v === 'ok' ? K.Badge({ label:okLabel, tone:'ok' })
        : v === 'off' ? K.Badge({ label:'kapalı', tone:'muted' })
        : K.Badge({ label:'hata', tone:'danger' });

      UI.sheet({
        title:'Kayıt durumu',
        body:String(K.Stack([
          K.Notice({ tone:sh.error.scope.indexOf('local') === 0 ? 'danger' : 'warn', body:sh.error.message }),
          K.Table({ tight:true, headers:['Alan', 'Durum'], rows:[
            ['Bu cihaz (yerel)', state(h.local, 'çalışıyor')],
            ['Hesaba bağlı kopya', state(h.cloud, 'çalışıyor')],
            ['Son hata', html`<span class="small">${sh.error.scope} · ${sh.error.code}</span>`],
            ['Zaman', html`<span class="small">${new Date(sh.error.at).toLocaleString('tr-TR')}</span>`],
          ] }),
          K.Notice({ tone:'info', body:'Verilerin bu cihazda tutulmaya devam ediyor. '
            + 'Güvende olmak için Rehber → Ayarlar bölümünden yedek al.' }),
        ])),
        footer:String(html`${K.Button({ label:'Kapat', act:'sheet-close' })}
          ${K.Button({ label:'Ayarlara git', tone:'primary', act:'go', data:{ 'data-route':'guide' } })}`),
        noFocus:true,
      });
    },
    async 'auto-draft-week'(){
      const n = M.currentWeek();
      const draft = R.Auto.draftWeek(n);
      if(!draft || !draft.ok){ UI.toast(draft ? draft.reason : 'Taslak üretilemedi'); return; }
      UI.sheet({
        title:'Haftalık sözleşme taslağı', subtitle:'Hafta '+n+' · onayladıktan sonra imzalayabilirsin',
        wide:true,
        body:String(R.C.Stack([
          R.C.Notice({ tone:'info', body:'Konular plandan ve risk sıralamasından geldi. '
            + 'İstediğini değiştirebilirsin; bu taslak imza değildir.' }),
          R.C.Table({ tight:true, headers:['Konu', 'Neden', { label:'Soru', num:true }],
            rows:draft.topics.map(t => [t.name, html`<span class="small dim">${t.why}</span>`, t.questionTarget]) }),
          html`<div class="cols-2">
            ${R.C.Stat({ label:'Haftalık soru', value:U.fmtNum(draft.questionTarget) })}
            ${R.C.Stat({ label:'Kapasite', value:U.fmtMin(draft.capacityMin) })}
          </div>`,
          R.C.Field({ label:'Davranış hedefi', input:R.C.Input({ id:'auto-behavior', value:draft.behaviorGoal }) }),
        ])),
        footer:String(html`${R.C.Button({ label:'Vazgeç', act:'sheet-close' })}
          ${R.C.Button({ label:'Sözleşmeye yaz', tone:'primary', act:'auto-draft-apply', data:{ 'data-n':n } })}`),
      });
    },
    async 'auto-draft-apply'(el){
      const n = Number(el.dataset.n);
      const draft = R.Auto.draftWeek(n);
      const behavior = document.getElementById('auto-behavior');
      if(behavior && draft && draft.ok) draft.behaviorGoal = behavior.value;
      const ok = await R.Auto.applyDraft(n, draft);
      UI.closeSheet();
      UI.toast(ok ? 'Sözleşme dolduruldu — gözden geçir ve imzala' : 'Yazılamadı');
      go('week');
    },
    async 'auto-sync-blocks'(){
      const n = await R.Auto.syncDayBlocks();
      UI.toast(n ? n+' blok haftanın konularına bağlandı' : 'Bağlanacak blok yok');
      render();
    },
    async 'pwa-install'(){
      const ok = await promptInstall();
      UI.toast(ok ? 'Uygulama kuruldu' : 'Kurulum iptal edildi');
      render();
    },
    async 'auto-close-week'(){
      const n = M.currentWeek();
      const d = R.Auto.closeWeekDraft(n);
      R.Screens.week.openReview();
      setTimeout(() => {
        const set = (id, v) => { const el = document.getElementById(id); if(el && !el.value) el.value = v; };
        set('rv-planned', d.planned);
        set('rv-done', d.done);
        set('rv-why', d.why);
        set('rv-carry', d.carry.join(', '));
        UI.toast('Taslak dolduruldu — düzeltmeyi sen yaz');
      }, 120);
    },
    async 'auto-exam-week'(){
      S.ui.examWeekAck = true;
      const ew = C.examWeekMode();
      UI.sheet({
        title:'Sınav haftası modu', subtitle:ew.daysLeft + ' gün kaldı',
        body:String(R.C.Stack([
          R.C.Notice({ tone:'warn', body:ew.note }),
          R.C.Table({ tight:true, headers:['Ne değişir', 'Neden'], rows:[
            ['Yeni konu açılmaz', 'Son iki haftada açılan konu sınavda net üretmez'],
            ['Hacim düşer', 'Yorgunluk sınav günü isabeti bozar'],
            ['Tekrar ve prova öne çıkar', 'Bilinen bilgiyi hızlı üretmek tek kalan kazanç'],
            ['Uyku sınav saatine ayarlanır', 'Kalkış saati kademeli öne çekilir'],
          ] }),
        ])),
        footer:String(R.C.Button({ label:'Anladım', tone:'primary', act:'sheet-close' })),
      });
    },
    async 'auto-replan'(){
      const h = M.planHealth();
      UI.confirmSheet('Planı yeniden hesapla',
        (h ? h.note+' ' : '')+'Geçmiş haftalar korunur; kapanmamış konular öne alınır, kalan haftalar yeniden dizilir.',
        async () => {
          await M.replanFrom(M.currentWeek());
          UI.closeSheet();
          UI.toast('Plan yeniden hesaplandı');
          render();
        });
    },
    async 'confirm-yes'(){
      const fn = UI._confirm;
      UI._confirm = null;
      if(fn) await fn();
    },
  };

  const globalChange = {
    async 'setup-cap'(){ R.Setup.refreshPreview(); },
  };

  /* ---------- olay dagitimi ---------- */
  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-act]');
    if(!el) return;
    const act = el.dataset.act;
    const sc = screen();
    const fn = (sc.handle && sc.handle[act]) || globalHandle[act];
    if(!fn) return;
    if(el.tagName !== 'INPUT') e.preventDefault();
    try{ await fn(el, e); }
    catch(err){ console.error('Eylem hatası ('+act+'):', err); UI.toast('Bir şeyler ters gitti'); }
  });

  /* KLAVYE, FARENIN IKIZIDIR.

     Tiklama `[data-act]` tasiyan her ogeden devralinir; klavye
     devralmiyordu. Sonuc: bir satirin tamami tiklanabilir oldugunda
     (haftanin gunu, konu satiri, oneri rozeti) o eylem yalnizca fareyle
     yapilabiliyordu — klavyeyle calisan biri icin o eylem YOKTU.

     Yerel dugme ve baglantilar zaten Enter/Bosluk'u kendileri isler;
     burada yalnizca `role="button"` ile dugme gibi davranan ogeler
     ele alinir. Bosluk sayfayi kaydirmasin diye varsayilan durdurulur. */
  document.addEventListener('keydown', e => {
    if(e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('[data-act][role="button"]');
    if(!el) return;
    if(/^(button|a|input|select|textarea)$/i.test(e.target.tagName)) return;
    e.preventDefault();
    el.click();
  });

  async function runChange(el, e){
    const sc = screen();
    const fn = (sc.change && sc.change[el.dataset.change]) || globalChange[el.dataset.change];
    if(!fn) return;
    try{ await fn(el, e); }
    catch(err){ console.error('Değişiklik hatası:', err); UI.toast('Değişiklik kaydedilemedi'); }
  }

  document.addEventListener('change', e => {
    const el = e.target.closest('[data-change]');
    if(el && !el.dataset.debounce) runChange(el, e);
  });

  /* Arama gibi alanlar her tus vurusunda degil, yazma durunca hesaplar. */
  const debouncers = new Map();
  document.addEventListener('input', e => {
    const el = e.target.closest('[data-change][data-debounce]');
    if(!el) return;
    const key = el.dataset.change;
    clearTimeout(debouncers.get(key));
    debouncers.set(key, setTimeout(() => runChange(el, e), Number(el.dataset.debounce) || 250));
  });

  function typingInField(e){
    const t = e.target;
    return t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable);
  }

  document.addEventListener('keydown', e => {
    // Komut paleti her yerden acilir
    if((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')){
      e.preventDefault();
      if(R.Palette.isOpen()) R.Palette.close(); else R.Palette.open();
      return;
    }
    /* Sesli sohbette BOSLUK sozu keser. Sesle kesilemiyor (koc
       konusurken mikrofon kapali olmak zorunda — bkz. core/talk.js),
       bu yuzden kesme dokunmayla olur ve en yakin tus bosluktur.
       Bir alana yaziyorken bosluk elbette bosluktur. */
    if(e.key === ' ' && R.Talk && R.Talk.isActive() && !typingInField(e)){
      if(R.Talk.kes()){ e.preventDefault(); return; }
    }
    if(e.key === 'Escape'){
      if(R.Talk && R.Talk.isActive()){ R.Talk.stop(); render(); return; }
      if(R.Palette.isOpen()){ R.Palette.close(); return; }
      if(R.Palette.isFocusOpen()){ R.Palette.closeFocus(); return; }
      if(isAppearanceOpen()){ closeAppearance(); return; }
      if(UI.isHintOpen()){ UI.closeHint(); return; }
      if(UI.isSheetOpen()){ UI.closeSheet(); return; }
      if(S.sidebarOpen){ S.sidebarOpen = false; render(); return; }
    }
    if(typingInField(e) || R.Palette.isOpen() || UI.isSheetOpen()) return;

    if(e.key === '?'){ e.preventDefault(); R.Palette.showShortcuts(); return; }
    if((e.key === 'f' || e.key === 'F') && R.Palette.runningBlock()){
      e.preventDefault();
      if(R.Palette.isFocusOpen()) R.Palette.closeFocus(); else R.Palette.openFocus();
      return;
    }

    const sc = screen();
    if(sc.onKey) sc.onKey(e);
  });

  /* Yuzen panelleri disariya tiklayinca kapat: ipucu balonu ve gorunum
     paneli. Ikisi de capaya gore konumlanir, ikisi de disari tiklamayla
     kapanmali — biri kapanip digeri kalirsa kullanici hangisinin "acik"
     oldugunu bilemez. */
  document.addEventListener('mousedown', e => {
    if(UI.isHintOpen()
      && !e.target.closest('#popover') && !e.target.closest('[data-act="hint"]')){
      UI.closeHint();
    }
    if(isAppearanceOpen()
      && !e.target.closest('#appearance') && !e.target.closest('[data-act="open-appearance"]')){
      closeAppearance();
    }
  });

  /* Pencere boyutu degisince panelin capasi kayar; yeniden konumlamak
     yerine kapatmak daha durust: kullanici nereye tikladigini bilir. */
  window.addEventListener('resize', () => { if(isAppearanceOpen()) closeAppearance(); });

  /* ------------------------------------------------------- sürtünme ölçümü

     Sistemin kendi maliyeti de ölçülür (core/friction.js): etkileşim ve
     görünürlük olayları sayaca dokunur, sekme arkaya gidince zincir kesilir.
     Süreli deneme oturumu açıkken geçen süre SINAVDIR, yönetim değil.

     Depoya yazma seyrektir: sürtünmeyi ölçerken sürtünme üretmemek gerekir. */
  (function wireFriction(){
    if(!R.Friction) return;
    let sonYazim = 0;
    const YAZIM_ARALIK = 30000;

    function dokun(){
      if(!S.ready) return;
      R.Friction.tick();
      const now = Date.now();
      if(now - sonYazim > YAZIM_ARALIK){
        sonYazim = now;
        R.Friction.save();
      }
    }
    ['click', 'keydown', 'input', 'scroll', 'pointerdown'].forEach(t => {
      document.addEventListener(t, dokun, { passive:true, capture:true });
    });
    document.addEventListener('visibilitychange', () => {
      if(document.hidden){ R.Friction.blur(); R.Friction.save(); }
      else R.Friction.tick();
    });
    window.addEventListener('blur', () => R.Friction.blur());
    window.addEventListener('pagehide', () => { R.Friction.blur(); R.Friction.save(); });
  })();

  /* ---------- depolama sagligi ---------- */
  let lastErrorToastAt = 0;
  function wireStoreErrors(){
    R.Store.onError = function(error, health){
      S.storeHealth = { error, health };
      // Ayni hatayi saniyede bir defadan fazla bildirme
      const now = Date.now();
      if(now - lastErrorToastAt > 8000){
        lastErrorToastAt = now;
        UI.toast(error.message);
      }
      const badge = document.getElementById('store-health');
      if(badge) badge.classList.remove('hidden');
    };
  }

  function storeHealthHtml(){
    const sh = S.storeHealth;
    if(!sh || !sh.error) return '';
    const isLocal = sh.error.scope.indexOf('local') === 0;
    return R.C.Button({ label:isLocal ? 'Kayıt sorunu' : 'Senkronizasyon sorunu', icon:'warn',
      size:'sm', tone:'danger', block:true, act:'show-store-error', data:{ id:'store-health' } });
  }

  /* ---------- telefona kurulum (PWA) ----------
     Tek dosya olarak çalıştığı için manifest de gömülü üretilir; ayrı dosya
     ya da service worker gerekmez. Uygulama zaten çevrimdışı çalışıyor. */
  let installPrompt = null;

  function installManifest(){
    const el = document.getElementById('pwa-manifest');
    if(!el) return;
    const name = (S.profile && S.profile.name) ? 'Rota — ' + S.profile.name : 'Rota';
    const icon = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
      + '<rect width="512" height="512" rx="112" fill="#3D3F8F"/>'
      + '<text x="256" y="342" font-family="system-ui,sans-serif" font-size="280" font-weight="800"'
      + ' fill="#fff" text-anchor="middle">R</text></svg>');
    const manifest = {
      name, short_name:'Rota', start_url:location.href, scope:'./',
      display:'standalone', background_color:'#F7F8FA', theme_color:'#3D3F8F',
      lang:'tr', description:'Kişisel YKS çalışma sistemi',
      icons:[{ src:icon, sizes:'512x512', type:'image/svg+xml', purpose:'any maskable' }],
    };
    try{
      el.setAttribute('href', 'data:application/manifest+json;charset=utf-8,'
        + encodeURIComponent(JSON.stringify(manifest)));
    }catch(e){}
  }

  /* ---------- bildirim ----------
     Ofis bir seyi kacirdiginda haber verir. Izin kullanicidan acikca istenir;
     istenmeden bildirim gonderilmez ve gunde en fazla bir tane gider. */

  function notifySupported(){ return typeof Notification !== 'undefined'; }
  function notifyState(){ return notifySupported() ? Notification.permission : 'unsupported'; }

  async function askNotify(){
    if(!notifySupported()) return 'unsupported';
    try{ return await Notification.requestPermission(); }
    catch(e){ return Notification.permission; }
  }

  const NOTIFY_KEY = 'rota.notify.lastDay';

  function notifyFromOffice(){
    if(notifyState() !== 'granted') return false;
    try{
      const today = U.todayISO();
      if(localStorage.getItem(NOTIFY_KEY) === today) return false;

      const notes = R.Office.notes();
      const urgent = notes.filter(n => n.tone === 'danger');
      const open = R.Office.openDecisions();
      const stale = open.filter(d => U.diffDays(d.at.slice(0, 10), today) >= 2);
      if(!urgent.length && !stale.length) return false;

      const body = urgent.length
        ? urgent[0].name + ': ' + urgent[0].text
        : 'Karar ' + U.diffDays(stale[0].at.slice(0, 10), today) + ' gündür açık: ' + stale[0].title;

      new Notification('Rota — ofisten', { body, tag:'rota-office', lang:'tr' });
      localStorage.setItem(NOTIFY_KEY, today);
      return true;
    }catch(e){ return false; }
  }

  function canInstall(){ return !!installPrompt; }
  async function promptInstall(){
    if(!installPrompt) return false;
    try{
      installPrompt.prompt();
      const res = await installPrompt.userChoice;
      installPrompt = null;
      return res && res.outcome === 'accepted';
    }catch(e){ return false; }
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    render();
  });

  /* ---------- acilis ---------- */
  async function boot(){
    try{
      // Arayuz Turkce: CSS buyuk harfe cevirirken "i" → "İ" olsun.
      // (Tek dosya surumunde <html> kabugu disaridan gelir, bu yuzden burada.)
      const root = document.documentElement;
      root.lang = 'tr';
      /* Derlenmis surumde <html> kabugu disaridan gelir: mobil tarayicinin
         sayfayi cevirmesini burada da engelle, yoksa arayuz Turkce-Ingilizce
         karisir. Hem nitelik hem sinif gerekir; motorlar ikisine de bakar. */
      root.setAttribute('translate', 'no');
      root.classList.add('notranslate');
      if(document.body){
        document.body.setAttribute('translate', 'no');
        document.body.classList.add('notranslate');
      }
      wireStoreErrors();
      await M.loadAll();
      applyTheme();
      applySection(S.route);
      await render();

      // AI koc yetenegi acilisi bloklamaz; hazir olunca panelleri gostermek icin yeniden ciz.
      installManifest();
      R.Auto.onDayOpen().then(done => { if(done.length) render(); });

      /* Denetim sinyalleri: nöbetçi ve sürtünme ölçer arka planda bir kez
         koşar ve gerekiyorsa TEK soru açar (core/signals.js). Açılışı
         bloklamaz; soru varsa Bugün ekranına bir kart olarak düşer. */
      if(R.Signals){
        R.Signals.sync().then(r => { if(r && r.changed) render(); })
          .catch(e => console.error('Sinyal eşitleme hatası:', e));
      }
      /* Profil özeti gözetmen tablosu için sessizce tazelenir. */
      try{ if(R.Screens.profiles) R.Screens.profiles.writeSnapshot(); }catch(e){}
      /* Ofis ekibi: ayarlar, defter, sohbetler ve tutanaklar acilisi bloklamaz.
         Yuklendikten sonra gunun brifingi bir kez uretilir — ofisin sen
         kapisini acmadan calismasi bununla baslar. */
      R.Office.load().then(async () => {
        render();
        try{
          if(R.Office.settings().autoBriefing !== false) await R.Office.dailyBriefing();
        }catch(e){ /* brifing acilisi bozmaz */ }
        notifyFromOffice();
        render();
      });
      if(R.Setup.needed()) setTimeout(() => R.Setup.open(), 400);
    }catch(err){
      console.error('Açılış hatası:', err);
      document.getElementById('app').innerHTML = String(html`<div class="content">
        ${R.C.Notice({ tone:'danger', title:'Uygulama başlatılamadı.',
          body:html`${err && err.message ? err.message : String(err)}
            <div class="mt-8">${R.C.Button({ label:'Yeniden dene', size:'sm', act:'reload' })}</div>` })}
      </div>`);
    }
  }

  return { boot, render, patch, go, applyTheme, NAV, canInstall, promptInstall, installManifest,
    notifyState, askNotify, notifyFromOffice };
})();

R.App.boot();
