/* Uygulama kabuğu: gezinme, yönlendirme, olay dağıtımı ve açılış.

   Ekranlar birbirini tanımaz; hepsi bu kabuğun içinde yaşar ve yalnızca
   ESP.S'yi okur. Bir ekranın çizilirken hata vermesi diğerlerini kapatmaz:
   hata paneline düşer, kenar çubuğu açılmaya devam eder. */

window.ESP = window.ESP || {};

ESP.App = (function(){
  const U = ESP.U, M = ESP.Model, UI = ESP.UI, S = ESP.S;
  const { html, raw, when, map, cls, attrs } = ESP.h;

  /* Sekiz bölüm.

     Bölüm alana göre değil kullanıcının o gün yaptığı **işe** göre ayrılır
     ve sırası kasıtlıdır: önce günün kaydı, sonra altı disiplinin kendi
     tezgâhı (dil → felsefe → ses → okuma → yazı), sonra danışma, en sonda
     ayar. Disiplinlerin sırası da rastgele değil: spesifikasyondaki
     öncelik sırası (ESP.PRECEDENCE) temel disiplinleri öne alır.

     Spesifikasyon «Analiz»i ayrı bir gezinme grubu sayıyor; burada Ofis'in
     dördüncü sayfası. Sebep: analiz bir alan değil bir **iş** — kararı
     tartışmak. Aynı işin dört sayfası tek bölümde durur; dokuz numaralı
     bir şerit telefonda okunmaz hâle geliyordu.

     `views` bir bölümün sayfalarıdır. Tek sayfalı bölümde sayfa şeridi
     çizilmez: tek sekmelik bir sekme çubuğu gürültüden başka bir şey
     değildir. */
  /* Gezinme şeridi `data/sections.js` içinde bir VERİDİR ve mantığı
     `core/nav.js` içinde yaşar. İkisi de kabuktan ayrı durur: bölüm
     kataloğunu test edebilmek için uygulamayı açmak gerekmesin. */
  const SECTIONS = ESP.Nav.sections;
  const routeOn = ESP.Nav.routeOn;
  const sectionOf = ESP.Nav.sectionOf;

  function screen(){ return ESP.Screens[S.route] || ESP.Screens.today; }

  /* Kenar çubuğundaki sayaçlar — bekleyen işi gizlemez.

     Rozet yalnız **bekleyen iş** sayar, ilerleme değil. "Bugün 3 kart
     çözdün" bir rozet değildir; "9 kartın vadesi geçti" rozettir. */
  function badgeFor(id){
    if(id === 'lang'){
      const due = ESP.SRS.dueCards().length;
      return due ? { text:String(due), quiet:due < 20 } : null;
    }
    if(id === 'today'){
      const d = S.days[U.todayISO()];
      return (!d || !ESP.Model.dayHasEntry(d)) ? { text:'!', quiet:true } : null;
    }
    if(id === 'office'){
      const n = ESP.Office.notes().filter(x => x.tone === 'danger' || x.tone === 'warn').length;
      return n ? { text:String(n), quiet:true } : null;
    }
    if(id === 'library'){
      const open = ESP.Intellect.unlinkedNotes().length;
      return open ? { text:String(open), quiet:true } : null;
    }
    if(id === 'symposium'){
      const stale = ESP.Intellect.stalledArguments().length;
      return stale ? { text:String(stale), quiet:true } : null;
    }
    return null;
  }

  /* Marka satırı profilden gelir; sabit bir slogan yoktur. */
  function brandLine(){
    const p = S.profile;
    if(!p || !p.name) return 'entelektüel pratik sistemi';
    const goal = ESP.FOCUS.find(g => g.id === p.focus);
    return p.name + (goal ? ' · ' + goal.label.toLocaleLowerCase('tr-TR') : '');
  }

  function safe(fn, fallback){
    try{ return fn(); }
    catch(e){ console.error(e); return fallback || ''; }
  }

  /* Bölümün rozeti: içindeki sayfaların bekleyen işlerinin toplamı.
     Sesli olan (kırmızı) sessiz olanı yutar. */
  function sectionBadge(sec){
    let quiet = 0, loud = 0;
    sec.views.forEach(v => {
      const b = safe(() => badgeFor(v.route), null);
      if(!b) return;
      const n = b.text === '!' ? 1 : Number(b.text) || 1;
      if(b.quiet) quiet += n; else loud += n;
    });
    if(loud) return { text:String(loud), quiet:false };
    if(quiet) return { text:String(quiet), quiet:true };
    return null;
  }

  /* ---------- üst gezinme ----------

     Sabit sol menü yerine ince bir site çubuğu. Yedi bölüm tek satırda
     durur; dar ekranda menüye iner. Sağdaki üç araç her yerde aynı yerde
     kalır: arama, görünüm, ayarlar. */
  /* ---------- künye ----------

     Uygulama çubuğu değil KÜNYE. İki satır:

       1. kimlik · tarih · araçlar   — sayfayla birlikte yukarı kayar
       2. numaralı bölümler          — kaydırınca üstte yapışır

     İlk satırın kaymasına izin vermek kasıtlıdır: okurken kimliğe
     ihtiyaç yoktur, gezinmeye vardır. Böylece sabit kalan çubuk yarı
     yüksekliğe iner ve içerik nefes alır. */
  function mastheadHtml(sc){
    const now = new Date();
    const gun = now.toLocaleDateString('tr-TR', { weekday:'long' });
    return html`
      <div class="masthead">
        <div class="wrapc masthead__in">
          <button class="brand" data-act="go" data-route="today" aria-label="Günlük bölümüne git">
            <span class="brand__mark" aria-hidden="true">E</span>
            <span class="brand__text"><b>ESP</b><span>${brandLine()}</span></span>
          </button>

          <div class="masthead__date">
            <span class="masthead__day">${U.fmtDate(U.todayISO())}</span>
            <span class="masthead__wd">${gun}</span>
          </div>

          <div class="navtools">
            ${ESP.C.IconButton({ icon:'search', aria:'Komut paleti (Ctrl+K)', title:'Ctrl+K', act:'open-palette' })}
            ${ESP.C.IconButton({ icon:'palette', aria:'Görünüm', title:'Tema ve palet',
              act:'open-appearance', data:{ id:'appearance-btn' } })}
            ${ESP.C.IconButton({ icon:'sliders', aria:'Ayarlar', act:'go', data:{ 'data-route':'profile' } })}
            ${ESP.C.IconButton({ icon:'menu', aria:'Bölümler', act:'toggle-menu', class:'sitenav__menu' })}
          </div>
        </div>
      </div>`;
  }

  /* Numaralı bölüm şeridi. Numara bir süs değil: yedi bölümün SIRASI
     anlamlıdır (önce yazılan, sonra okunan) ve numara o sırayı görünür
     kılar. */
  function sitenavHtml(sc){
    const active = sectionOf(sc.id);
    return html`
      <nav class="sitenav" aria-label="Bölümler">
        <div class="wrapc navlinks">${map(SECTIONS(), sec => {
          const on = sec.id === active.id;
          const b = sectionBadge(sec);
          return html`<button class="${cls('navlink', on && 'is-active')}"
            data-act="go" data-route="${sec.views[0].route}"
            ${when(on, () => attrs({ 'aria-current':'page' }))}>
            <span class="navlink__num" aria-hidden="true">${sec.num}</span>
            <span class="navlink__label">${sec.label}</span>
            ${when(b, () => html`<span class="${cls('navlink__badge', b.quiet && 'is-quiet')}"
              aria-label="${b.text + ' bekleyen'}">${b.text}</span>`)}
          </button>`;
        })}</div>
      </nav>`;
  }

  /* ---------- alt bant ----------

     Her sayfa bir yerde biter. Koyu bant hem sayfayı sonlandırır hem de
     sistemin iki değişmez cümlesini —klinik sınır ve mahremiyet— her
     ekranda bir kez söyler. Bunları kart olarak sayfanın ortasına koymak
     her seferinde içeriği bölüyordu. */
  function footerHtml(){
    return html`
      <footer class="sitefoot">
        <div class="wrapc sitefoot__in">
          <div class="sitefoot__brand">
            <span class="brand__mark" aria-hidden="true">E</span>
            <div>
              <b>Entelektüel Seviye Planlayıcı</b>
              <span>Dil · felsefe · müzik · diksiyon · okuma · yazı</span>
            </div>
          </div>
          <div class="sitefoot__notes">
            <p><span class="sitefoot__k">Sınır</span> ${ESP.PEDAGOGIC.disclaimer}</p>
            <p><span class="sitefoot__k">Mahremiyet</span> Veriler bu cihazda tutulur.
              Ham ses kaydı ve tam metin taslak hiçbir modele gönderilmez.</p>
            ${raw(buildStampHtml())}
          </div>
        </div>
      </footer>`;
  }

  /* ---------- telefonda alt gezinme ----------

     Telefonda HER ŞEY hamburger menüden geçiyordu. Veri girişinin çoğu
     telefonda yapılacak; en çok kullanılan yollar başparmağın altında
     olmalı, iki dokunuş arkasında değil.

     Beş yuva: dört yol + menü. Yedi bölümün hepsi buraya sığmaz ve
     sığdırmaya çalışmak beşini de okunmaz yapardı; menü yuvası tam
     listeyi açar.

     Yalnız 860 pikselin altında çizilir. */
  const TABBAR_ALL = [
    { route:'today',  label:'Bugün',  icon:'pulse' },
    { route:'lang',   label:'Dil',    icon:'cards' },
    { route:'studio', label:'Stüdyo', icon:'wave' },
    { route:'history', label:'Tarih', icon:'book' },
    { route:'library', label:'Okuma', icon:'book' },
    { route:'symposium', label:'Felsefe', icon:'socratic' },
    { route:'writing', label:'Yazı',  icon:'quill' },
    { route:'office', label:'Ofis',   icon:'users' },
  ];

  /* Dört yuva + menü. Hangi dördü? Bugün ve Ofis sabittir; aradaki iki yuva
     kullanıcının AÇIK bölümlerinden, katalog sırasına göre doldurulur.
     Kapalı bir bölümü başparmağın altında tutmak, en değerli iki yuvayı
     boşa harcamak olurdu. */
  function tabbar(){
    const sabit = TABBAR_ALL.filter(t => t.route === 'today');
    const orta = TABBAR_ALL.filter(t => t.route !== 'today' && t.route !== 'office'
      && routeOn(t.route)).slice(0, 2);
    return sabit.concat(orta, TABBAR_ALL.filter(t => t.route === 'office'));
  }

  function tabbarHtml(sc){
    const aktif = sectionOf(sc.id);
    return html`
      <nav class="tabbar" aria-label="Hızlı gezinme">
        ${map(tabbar(), t => {
          const sec = sectionOf(t.route);
          const on = sec.id === aktif.id;
          const b = safe(() => badgeFor(t.route), null);
          return html`<button class="${cls('tabbtn', on && 'is-active')}"
            data-act="go" data-route="${t.route}"
            ${when(on, () => attrs({ 'aria-current':'page' }))}>
            <span class="tabbtn__ic" aria-hidden="true">${raw(UI.icon(t.icon))}</span>
            <span class="tabbtn__t">${t.label}</span>
            ${when(b, () => html`<span class="${cls('tabbtn__b', b.quiet && 'is-quiet')}"
              aria-label="${b.text + ' bekleyen'}">${b.text}</span>`)}
          </button>`;
        })}
        <button class="${cls('tabbtn', S.sidebarOpen && 'is-active')}" data-act="toggle-menu"
          aria-label="Bütün bölümler">
          <span class="tabbtn__ic" aria-hidden="true">${raw(UI.icon('menu'))}</span>
          <span class="tabbtn__t">Menü</span>
        </button>
      </nav>`;
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
    const b = ESP.BUILD || {};
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

  /* Dar ekranda bölümler tam ekran menüye açılır. Alt sekme çubuğu bir
     panel dilidir; site dilinde karşılığı budur. */
  function navsheetHtml(sc){
    const active = sectionOf(sc.id);
    return html`
      <div class="navsheet" role="dialog" aria-label="Bölümler">
        <div class="navsheet__head">
          <div class="brand">
            <span class="brand__mark" aria-hidden="true">E</span>
            <span class="brand__text"><b>ESP</b><span>${brandLine()}</span></span>
          </div>
          ${ESP.C.IconButton({ icon:'close', aria:'Kapat', act:'toggle-menu' })}
        </div>
        <div class="navsheet__body">
          <div class="navsheet__grid">${map(SECTIONS(), sec => html`
            <button class="${cls('navsheet__item', sec.id === active.id && 'is-active')}"
              data-act="go" data-route="${sec.views[0].route}" data-num="${sec.num}">
              <b>${sec.label}</b>
              <span>${sec.note}</span>
            </button>`)}
          </div>
          ${storeHealthHtml()}
        </div>
      </div>`;
  }

  /* ---------- hero ----------

     Her bölüm bir cümleyle açılır. Panel dilinde ekranın adı yazardı
     ("Tahliller") ve durumu okumak için aşağı bakmak gerekirdi; burada
     BAŞLIK durumun kendisidir, alt satır ne yapılacağını söyler.

     `headline` ve `lede` ekranın kendi sözleşmesindendir; vermeyen ekran
     için başlık ve alt başlık kullanılır. */
  function heroHtml(sc){
    const sec = sectionOf(sc.id);
    const headline = safe(() => sc.headline ? sc.headline() : '') || sc.title;
    const lede = safe(() => sc.lede ? sc.lede() : '') || safe(() => sc.subtitle());
    const stats = safe(() => sc.stats ? sc.stats() : [], []) || [];
    const actions = safe(() => sc.actions ? sc.actions() : '');

    return html`
      <div class="hero" data-num="${sec.num}">
        <div class="wrapc hero__in">
          <div class="hero__main">
            <div class="hero__eyebrow">
              <span class="hero__num">${sec.num}</span>
              ${raw(UI.icon(sec.icon))}
              <span>${sec.label}</span>
            </div>
            <h1 class="hero__title">${headline}</h1>
            ${when(lede, () => html`<p class="hero__lede">${raw(lede)}</p>`)}
            ${when(actions, () => html`<div class="hero__actions">${raw(actions)}</div>`)}
          </div>
          ${when(stats.length, () => html`<div class="hero__side">${map(stats, st => html`
            <div class="herostat">
              <span class="herostat__value">${st.value}${when(st.unit,
                () => html`<small>${st.unit}</small>`)}</span>
              <span class="herostat__label">${st.label}</span>
            </div>`)}</div>`)}
          <div class="hero__motif" aria-hidden="true">${raw(UI.motif(sec.id))}</div>
        </div>
      </div>`;
  }

  /* Bölümün sayfaları. Tek sayfalıysa çizilmez. */
  function pagenavHtml(sc){
    const sec = sectionOf(sc.id);
    if(sec.views.length < 2) return '';
    return html`
      <nav class="pagenav" aria-label="${sec.label + ' sayfaları'}">
        <div class="wrapc pagenav__in">${map(sec.views, v => {
          const on = v.route === sc.id;
          const b = safe(() => badgeFor(v.route), null);
          return html`<button class="${cls('pagelink', on && 'is-active')}"
            data-act="go" data-route="${v.route}"
            ${when(on, () => attrs({ 'aria-current':'page' }))}>
            ${raw(UI.icon(v.icon))}<span>${v.label}</span>
            ${when(b, () => html`<span class="pagelink__count">${b.text}</span>`)}
          </button>`;
        })}</div>
      </nav>`;
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
    const palette = p.palette || ESP.DEFAULT_PALETTE;
    const design = p.design || ESP.DEFAULT_DESIGN;
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
        <div class="appear__palettes">${map(ESP.PALETTES, pal => html`
          <button class="${cls('palbtn', pal.id === palette && 'is-on')}"
            data-act="set-palette" data-palette="${pal.id}" title="${pal.note}"
            aria-pressed="${pal.id === palette ? 'true' : 'false'}">
            <span class="palbtn__dot" style="background:${pal.swatch[0]}"></span>
            <span>${pal.name}</span>
          </button>`)}
        </div>

        <div class="appear__label">Düzen</div>
        <div class="appear__designs">${map(ESP.DESIGNS, d => html`
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

  function errorPanel(err){
    const msg = (err && err.message) ? err.message : String(err);
    return String(ESP.C.Notice({ tone:'danger', title:'Bu ekran çizilemedi.',
      body:html`${msg}
        <div class="row wrap mt-8">
          ${ESP.C.Button({ label:'Bugün ekranına dön', size:'sm', act:'go', data:{ 'data-route':'today' } })}
          ${ESP.C.Button({ label:'Yeniden yükle', size:'sm', act:'reload' })}
        </div>
        <p class="tiny dim">Diğer ekranlar soldaki menüden açılmaya devam eder. Veriler silinmedi.</p>` }));
  }

  /* Yeniden çizimde odağı ve imleç konumunu korumak için aktif alanı
     niteliklerinden türetilen kararlı bir anahtarla işaretle. */
  const FOCUS_ATTRS = ['data-change', 'data-act', 'data-id', 'data-i', 'data-date', 'name'];
  function focusSnapshot(){
    const el = document.activeElement;
    if(!el || !/^(input|textarea|select)$/i.test(el.tagName)) return null;
    let selector = null;
    if(el.id){
      selector = '#' + el.id.replace(/([^\w-])/g, '\\$1');
    }else{
      const parts = FOCUS_ATTRS
        .map(a => { const v = el.getAttribute(a); return v == null ? null : '[' + a + '="' + v.replace(/"/g, '\\"') + '"]'; })
        .filter(Boolean);
      if(parts.length) selector = el.tagName.toLowerCase() + parts.join('');
    }
    if(!selector) return null;
    const snap = { selector };
    try{
      if(el.selectionStart != null){ snap.start = el.selectionStart; snap.end = el.selectionEnd; }
    }catch(e){ /* sayı ve tarih girdilerinde seçim okunamaz */ }
    return snap;
  }
  function restoreFocus(snap){
    if(!snap) return;
    let el;
    try{ el = document.querySelector(snap.selector); }catch(e){ return; }
    if(!el) return;
    el.focus({ preventScroll:true });
    if(snap.start != null){
      try{ el.setSelectionRange(snap.start, snap.end); }catch(e){}
    }
  }

  /* SECILI SEKME GORUNUR KALIR. Serit yatayda kayabildigi icin yeniden
     cizimden sonra etkin sekme gorus alaninin disinda kalabiliyordu:
     kullanici hangi bolumde oldugunu goremiyordu. Kaydirma YALNIZCA
     serit icinde olur, sayfa yerinden oynamaz. */
  function revealActiveTab(){
    document.querySelectorAll('.subtabs').forEach(strip => {
      if(strip.scrollWidth <= strip.clientWidth + 1) return;
      const act = strip.querySelector('.subtab.is-active');
      if(!act) return;
      const sol = act.offsetLeft, sag = sol + act.offsetWidth;
      if(sol < strip.scrollLeft) strip.scrollLeft = Math.max(0, sol - 12);
      else if(sag > strip.scrollLeft + strip.clientWidth){
        strip.scrollLeft = sag - strip.clientWidth + 12;
      }
    });
  }

  let rendering = false;
  let queued = null;

  /* Aynı karede peş peşe gelen render çağrılarını tek çizime indirger.
     Arka plan sekmesinde rAF hiç çalışmaz; bu yüzden zamanlayıcı yedeği vardır. */
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

  /* Gorunum gecisi.

     Tarayici destekliyorsa DOM degisimi `startViewTransition` icinde
     yapilir: eski ve yeni sayfa arasinda tarayici kendi yumusak gecisini
     uretir. Desteklemiyorsa degisim aninda olur -- gecis bir susleme
     degil, akiskanlik; olmamasi isleyisi bozmaz.

     Yalniz YOL degisiminde calisir. Her kucuk yeniden cizimde (bir alan
     yazarken, bir onay kutusu tiklarken) gecis uretmek arayuzu yavas
     ve sarhos gosterir. */
  let lastRoute = null;

  function withTransition(fn){
    const changed = lastRoute !== null && lastRoute !== S.route;
    lastRoute = S.route;
    const ok = changed
      && typeof document.startViewTransition === 'function'
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!ok) return fn();
    try{ return document.startViewTransition(fn).updateCallbackDone; }
    catch(e){ return fn(); }
  }

  async function doRender(){
    if(rendering) return;
    rendering = true;
    /* Kare önbelleği yalnız bu çizim boyunca açık kalır: aynı hesap
       bir karede iki kez yapılmaz, kareler arasında ise hiçbir şey
       taşınmaz. Bkz. core/memo.js. */
    ESP.Memo.baslat();
    try{
      const sc = screen();
      const main = document.getElementById('main');
      const scroll = main ? main.scrollTop : 0;
      const focus = focusSnapshot();
      let body;
      try{
        body = String(await sc.render());
      }catch(err){
        console.error('Ekran hatası (' + sc.id + '):', err);
        body = errorPanel(err);
      }

      const markup = String(html`
        <a class="skiplink" href="#main">İçeriğe atla</a>
        <div class="site">
          ${safe(() => mastheadHtml(sc))}
          ${safe(() => sitenavHtml(sc))}
          ${safe(() => heroHtml(sc))}
          ${safe(() => pagenavHtml(sc))}
          <div class="site__body">
            <main class="wrapc content" id="main" tabindex="-1" aria-label="${sc.title}">${raw(body)}</main>
          </div>
          ${safe(footerHtml)}
          ${safe(() => tabbarHtml(sc))}
        </div>
        ${when(S.sidebarOpen, () => safe(() => navsheetHtml(sc)))}`);

      await withTransition(() => { document.getElementById('app').innerHTML = markup; });

      const newMain = document.getElementById('main');
      if(newMain && scroll) newMain.scrollTop = scroll;
      restoreFocus(focus);
      revealActiveTab();
      /* Kabuk her cizimde yeniden kuruluyor; acik bir alt sayfa varsa
         `inert` onunla birlikte silinir ve arka plan yeniden okunur
         hale gelir. Cizimden sonra geri konur. */
      if(UI.isSheetOpen()){
        const kabuk = document.querySelector('.site');
        if(kabuk){ kabuk.setAttribute('inert', ''); kabuk.setAttribute('aria-hidden', 'true'); }
      }
      if(sc.afterRender) sc.afterRender();
    }catch(err){
      /* Kabuğun kendisi çizilemedi. Ekranın kendi hatası bir üstteki
         yakalayıcıda ele alınır; buraya düşmek künye, hero ya da alt
         bilginin çökmesi demektir.

         Bu blok daha önce hata panelini ÜRETİP atıyordu: değişken
         kuruluyor ama DOM'a hiç yazılmıyordu. Sonuç, kullanıcının bir
         bölüme basıp eski ekranda kalması ve hiçbir şey görmemesiydi
         — sessiz çökme, en kötü çökmedir. */
      console.error('Render hatası:', err);
      const govde = document.getElementById('app');
      if(govde) govde.innerHTML = String(html`<div class="wrapc content">
        ${ESP.C.Notice({ tone:'danger', title:'Ekran çizilirken bir hata oluştu.',
          body:html`${err && err.message ? err.message : String(err)}
            <div class="mt-8">${ESP.C.Button({ label:'Yeniden yükle', size:'sm', act:'reload' })}</div>` })}
      </div>`);
    }finally{
      ESP.Memo.bitir();
      rendering = false;
    }
  }

  /* Bölümün rengi kökte durur: CSS `--sec` jetonunu buradan okur.
     Yeniden çizimde değil YÖNLENDIRMEDE yazılır ki her karede DOM'a
     dokunulmasın. */
  function applySection(route){
    const sec = sectionOf(route);
    document.documentElement.setAttribute('data-section', sec.id);
  }

  function go(route){
    /* Kapalı bir bölümün ekranına gidilmez: boş bir tezgâh, kullanıcının
       kapattığı şeyi geri getirmiş gibi görünür. Sessizce Bugün'e düşer ve
       sebebini söyler. */
    if(ESP.Screens[route] && !routeOn(route)){
      UI.toast('Bu bölüm kapalı. Ayarlar → Bölümler\'den açabilirsin.');
      route = 'today';
    }

    /* Ekran degisirse sesli oturum biter: paneli olmayan bir ekranda
       acik kalan mikrofon, kullanicinin goremedigi bir kayittir. */
    if(ESP.Talk && ESP.Talk.isActive()) ESP.Talk.stop();

    /* Ekranin kendi temizligi. Ayni sebep: gorunmeyen bir ekranin metronomu
       kullanicinin kapatamayacagi bir sestir. Kanca istege baglidir;
       tanimlamayan ekran hicbir sey odemez. */
    const onceki = ESP.Screens[S.route];
    if(onceki && typeof onceki.leave === 'function'){
      try{ onceki.leave(); }catch(e){ console.error(e); }
    }
    S.route = route;
    S.sidebarOpen = false;
    applySection(route);
    window.scrollTo(0, 0);
    render();
  }

  function applyTheme(){
    const root = document.documentElement;
    const t = S.profile ? S.profile.theme : 'system';
    if(t === 'light') root.setAttribute('data-theme', 'light');
    else if(t === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');

    const p = (S.profile && S.profile.palette) || ESP.DEFAULT_PALETTE;
    if(p === ESP.DEFAULT_PALETTE) root.removeAttribute('data-palette');
    else root.setAttribute('data-palette', p);

    /* Düzen de kökte durur. Varsayılan «defter» hiçbir şey yazmaz:
       designs.css yalnız data-design varken devreye girsin diye. */
    const d = (S.profile && S.profile.design) || ESP.DEFAULT_DESIGN;
    if(d === ESP.DEFAULT_DESIGN || !ESP.DESIGN_BY_ID[d]) root.removeAttribute('data-design');
    else root.setAttribute('data-design', d);
  }

  /* ---------------------------------------------------------- küresel eylemler */
  const globalHandle = {
    async go(el){ go(el.dataset.route); },

    /* Egzersiz isleme ORTAK bir eylemdir: koç kutusu yedi ekranda birden
       duruyor ve her ekranda ayri bir islem yazmak, yedi kez bozulabilecek
       bir islem demektir. */
    /* Sihirbazdaki bolum secimi: kart yerinde isaretlenir, sayfa yeniden
       cizilmez — sihirbaz acikken tam cizim, acik sayfayi kapatirdi. */
    async 'setup-mod'(el){
      const list = ESP.Setup.pick(el.dataset.id);
      const on = list.indexOf(el.dataset.id) >= 0;
      el.classList.toggle('is-on', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    },

    /* --- tezgâh: yedi ekranda ortak ---

       Eylemler burada çünkü tezgâh yedi ekranda birden duruyor; her ekranda
       ayrı bir işlem yazmak, yedi kez bozulabilecek bir işlem demektir. */
    async 'desk-toggle'(el){ ESP.Desk.toggle(el.dataset.disc); render(); },
    async 'desk-tab'(el){
      const kap = el.closest('.lrow');
      const govde = kap ? kap.querySelector('.desk__body') : null;
      ESP.Desk.setTab(govde ? govde.dataset.disc : S.ui.sessionDisc, el.dataset.tab);
      render();
    },

    async 'desk-send'(el){
      const disc = el.dataset.disc;
      const alan = document.getElementById('desk-ask-' + disc);
      const soru = alan ? alan.value.trim() : '';
      if(!soru) return;
      if(alan) alan.value = '';
      await UI.withBusy(async () => { await ESP.Desk.ask(disc, soru); },
        'Yanıt bekleniyor');
      render();
    },

    async 'desk-talk'(el){
      const res = ESP.Desk.talk(el.dataset.disc);
      if(!res.ok) UI.toast(res.message || 'Sesli sohbet açılamadı');
      render();
    },

    async 'desk-listen'(el){
      const res = ESP.Desk.speakLast(el.dataset.disc);
      if(!res.ok) UI.toast('Seslendirilecek bir cevap yok');
      render();
    },

    async 'desk-open-team'(el){
      S.ui.officeAgent = ESP.Desk.agentOf(el.dataset.disc).id;
      go('team');
    },

    async 'desk-clear'(el){
      await ESP.Office.clearChat(ESP.Desk.agentOf(el.dataset.disc).id);
      render();
    },

    async 'desk-ladder'(el){
      S.ui.curDisc = el.dataset.disc;
      S.ui.ladderTab = 'yol';
      go('ladder');
    },

    async 'desk-add-asset'(el){
      const disc = el.dataset.disc;
      const v = id => { const n = document.getElementById(id + '-' + disc); return n ? n.value.trim() : ''; };
      const tur = v('as-kind') || 'note';
      const ham = v('as-url');
      const res = await ESP.Model.saveAsset(ESP.Model.newAsset({
        disc, kind:tur, title:v('as-title'), text:v('as-text'),
        url:tur === 'link' ? ham : '',
        seconds:tur === 'audio' ? Number(String(ham).replace(',', '.')) || null : null,
      }));
      if(!res.ok){ UI.toast(res.error); return; }
      ESP.Memo.bitir();
      UI.toast('Eklendi — koç sayısını ve başlığını görür, içeriğini görmez');
      render();
    },

    async 'desk-del-asset'(el){
      await ESP.Model.deleteAsset(el.dataset.id);
      ESP.Memo.bitir();
      render();
    },

    async 'desk-add-rem'(el){
      const disc = el.dataset.disc;
      const v = id => { const n = document.getElementById(id + '-' + disc); return n ? n.value.trim() : ''; };
      const res = await ESP.Model.saveReminder(ESP.Model.newReminder({
        disc, text:v('rm-text'), due:v('rm-due') || ESP.U.todayISO(),
        repeat:v('rm-rep') || 'none',
      }));
      if(!res.ok){ UI.toast(res.error); return; }
      ESP.Memo.bitir();
      render();
    },

    async 'desk-done-rem'(el){
      const res = await ESP.Model.completeReminder(el.dataset.id);
      if(!res.ok){ UI.toast(res.error); return; }
      ESP.Memo.bitir();
      UI.toast(res.reminder.repeat === 'none' ? 'Kapandı'
        : 'Bir sonraki tarihe taşındı: ' + res.reminder.due);
      render();
    },

    async 'desk-del-rem'(el){
      await ESP.Model.deleteReminder(el.dataset.id);
      ESP.Memo.bitir();
      render();
    },

    /* --- öğren ve pratik: iki ekranda ortak --- */
    async 'unit-open'(el){
      S.ui.unitOpen = S.ui.unitOpen === el.dataset.id ? null : el.dataset.id;
      render();
    },

    async 'unit-add'(el){
      const u = ESP.Lesson.unitOf(el.dataset.disc, el.dataset.id);
      if(!u) return;
      const res = await ESP.Lesson.addUnit(u);
      if(!res.ok){ UI.toast(res.error); return; }
      UI.toast(res.added + ' kart eklendi'
        + (res.skipped ? ', ' + res.skipped + ' tanesi zaten vardı' : ''));
      render();
    },

    async 'prac-start'(el){
      const s = ESP.Lesson.start(el.dataset.deck);
      if(!s.ok){ UI.toast(s.error); return; }
      S.ui.practice = s;
      S.ui.practiceShown = false;
      S.ui.practiceOrder = null;
      render();
    },

    async 'prac-pick'(el){
      S.ui.practiceOrder = (S.ui.practiceOrder || []).concat([el.dataset.value]);
      render();
    },

    async 'prac-clear-order'(){ S.ui.practiceOrder = null; render(); },

    async 'prac-answer'(el){
      const s = S.ui.practice;
      if(!s) return;
      let cevap = el.dataset.value;
      if(cevap == null){
        const alan = document.getElementById('prac-input');
        cevap = alan ? alan.value : '';
      }
      const res = await ESP.Lesson.answer(s, cevap);
      if(!res.ok){ UI.toast(res.error); return; }
      S.ui.practiceShown = !res.correct;
      S.ui.practiceOrder = null;
      UI.toast(res.correct ? 'Doğru' : 'Yanlış — doğrusu: ' + res.expected);
      render();
    },

    /* «Bilmiyorum» bir atlama DEĞİLDİR: kart «tekrar» olarak işaretlenir ve
       başa döner. Cevabı görmeden geçmek, unutma eğrisini kandırmak olurdu. */
    async 'prac-skip'(){
      const s = S.ui.practice;
      if(!s) return;
      const res = await ESP.Lesson.answer(s, '');
      S.ui.practiceShown = true;
      S.ui.practiceOrder = null;
      if(res.ok) UI.toast('Doğrusu: ' + res.expected);
      render();
    },

    async 'prac-log'(){
      const s = S.ui.practice;
      if(!s) return;
      const res = await ESP.Lesson.log(s);
      if(!res.ok){ UI.toast(res.error); return; }
      S.ui.practice = null;
      UI.toast('Gün kaydına yazıldı');
      render();
    },

    async 'prac-close'(){
      S.ui.practice = null; S.ui.practiceShown = false; S.ui.practiceOrder = null;
      render();
    },

    /* --- teklif ve plan: tezgâhta, ofiste ve Bugün'de ortak --- */
    async 'prop-accept'(el){
      const res = await ESP.Plans.accept(el.dataset.id);
      if(!res.ok){ UI.toast(res.error); return; }
      UI.toast('Onaylandı — kural motoru uyguladı');
      render();
    },

    async 'prop-decline'(el){
      const res = await ESP.Plans.decline(el.dataset.id);
      if(!res.ok){ UI.toast(res.error); return; }
      UI.toast('Reddedildi — bu teklif tekrar sorulmaz');
      render();
    },

    async 'plan-make'(){
      await ESP.Plans.savePlan(ESP.Plans.weekPlan());
      UI.toast('Plan kuruldu');
      render();
    },

    async 'plan-clear'(){
      await ESP.Plans.clearPlan();
      render();
    },

    async 'log-drill'(el){
      const res = await ESP.Coach.logDrill(el.dataset.id);
      if(!res.ok){ UI.toast(res.error); return; }
      UI.toast('İşlendi — gün kaydına yazıldı');
      render();
    },
    async 'toggle-menu'(){ S.sidebarOpen = !S.sidebarOpen; render(); },
    async hint(el){
      if(UI.isHintOpen() && el.dataset.hint === UI._lastHint){ UI.closeHint(); UI._lastHint = null; return; }
      UI._lastHint = el.dataset.hint;
      UI.openHint(el.dataset.hint, el);
    },
    async 'rail-toggle'(el){
      S.ui.railOpen = !S.ui.railOpen;
      const rail = el.closest('.rail');
      if(!rail) return render();
      const body = rail.querySelector('.rail__body');
      rail.classList.toggle('is-open', S.ui.railOpen);
      el.setAttribute('aria-expanded', S.ui.railOpen ? 'true' : 'false');
      if(body) body.hidden = !S.ui.railOpen;
    },
    /* ---- dikte ----
       Mikrofon dugmesi bir ANAHTARDIR: acikken basinca kapanir. Metin
       alana canli yazilir; kullanici konustugunu gorur. */
    async dictate(el){
      const id = el.dataset.target;
      const field = document.getElementById(id);
      if(!field){ UI.toast('Yazılacak alan bulunamadı'); return; }

      if(ESP.Voice.isActive() && ESP.Voice.activeTarget() === id){
        ESP.Voice.stop();
        el.classList.remove('is-on');
        el.setAttribute('aria-pressed', 'false');
        return;
      }

      const started = ESP.Voice.dictateInto(field, {
        onEnd(){
          el.classList.remove('is-on');
          el.setAttribute('aria-pressed', 'false');
        },
        onError(code){
          el.classList.remove('is-on');
          el.setAttribute('aria-pressed', 'false');
          UI.toast(ESP.Voice.message(code));
        },
      });
      if(started){
        el.classList.add('is-on');
        el.setAttribute('aria-pressed', 'true');
        field.focus({ preventScroll:true });
      }
    },

    async 'open-palette'(){ ESP.Palette.open(); },
    async 'open-appearance'(el){
      if(isAppearanceOpen()){ closeAppearance(); return; }
      openAppearance(el);
    },
    async 'set-theme'(el){
      await M.saveProfile({ theme:el.dataset.theme });
      applyTheme();
      refreshAppearance();
    },
    async 'set-palette'(el){
      await M.saveProfile({ palette:el.dataset.palette });
      applyTheme();
      refreshAppearance();
    },
    /* Düzen değişince sayfa YENİDEN ÇİZİLİR: kimi düzen kabuğun
       ızgarasını değiştiriyor ve yapışkan sütunların yeni ölçüyle
       yerleşmesi gerekiyor. */
    async 'set-design'(el){
      await M.saveProfile({ design:el.dataset.design });
      applyTheme();
      refreshAppearance();
      render();
    },
    async 'cmdk-run'(el){ ESP.Palette.runById(el.dataset.id); },
    async 'quick-save'(){ await ESP.Palette.saveQuick(); },
    async 'sheet-close'(){ UI.closeSheet(); },
    async reload(){ location.reload(); },
    /* Sert yenileme: adrese bir kerelik damga eklenir, böylece tarayıcı
       sayfayı ve bağlı dosyaları önbellekten değil sunucudan ister.
       `location.reload()` bunu garanti etmez. */
    async 'hard-reload'(){
      const u = new URL(location.href);
      u.searchParams.set('tazele', String(Date.now()));
      location.replace(u.toString());
    },
    async 'setup-save'(){ await ESP.Setup.save(); },
    async 'setup-skip'(){ ESP.Setup.skip(); },
    /* Herhangi bir ekrandan bir ajana soru sormak için. */
    async 'ask-agent'(el){
      S.ui.officeAgent = el.dataset.agent || 'patron';
      go('team');
    },
    async 'flag-ack'(el){
      await M.ackFlag(el.dataset.id);
      UI.toast('İşaretlendi — kayıt geçmişte duruyor');
      render();
    },
    async 'show-store-error'(){
      const sh = S.storeHealth;
      if(!sh) return;
      const h = sh.health || {};
      const K = ESP.C;
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
            + 'Güvende olmak için Rehber → Veri bölümünden yedek al.' }),
        ])),
        footer:String(html`${K.Button({ label:'Kapat', act:'sheet-close' })}
          ${K.Button({ label:'Rehbere git', tone:'primary', act:'go', data:{ 'data-route':'guide' } })}`),
        noFocus:true,
      });
    },
    /* ---- geri alma ----
       Son yikici islemin anlik gorüntüsü burada durur. Onay kagidi
       korumanin agir yolu; geri alma hem daha nazik hem daha hizli. */
    async undo(){
      const u = S.ui.undo;
      S.ui.undo = null;
      if(!u || !u.restore) return;
      try{ await u.restore(); UI.toast('Geri alındı'); render(); }
      catch(e){ console.error(e); UI.toast('Geri alınamadı'); }
    },
    async 'confirm-yes'(){
      const fn = UI._confirm;
      UI._confirm = null;
      if(fn) await fn();
    },
  };

  const globalChange = {};

  /* ------------------------------------------------------------ olay dağıtımı */
  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-act]');
    if(!el) return;
    const act = el.dataset.act;
    const sc = screen();
    const fn = (sc.handle && sc.handle[act]) || globalHandle[act];
    if(!fn) return;
    if(el.tagName !== 'INPUT') e.preventDefault();
    try{ await fn(el, e); }
    catch(err){ console.error('Eylem hatası (' + act + '):', err); UI.toast('Bir şeyler ters gitti'); }
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

  /* Arama gibi alanlar her tuş vuruşunda değil, yazma durunca hesaplar. */
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

  /* Enter ile hızlı giriş: metin alanında Enter, yanındaki eylemi tetikler. */
  const ENTER_ACTIONS = { 'meal-text':'add-meal', 'quick-meal':'quick-meal', 'chat-text':'send-chat' };
  document.addEventListener('keydown', async e => {
    if((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')){
      e.preventDefault();
      if(ESP.Palette.isOpen()) ESP.Palette.close(); else ESP.Palette.open();
      return;
    }
    /* Sesli sohbette BOSLUK sozu keser. Sesle kesilemiyor (ajan
       konusurken mikrofon kapali olmak zorunda — bkz. core/talk.js),
       bu yuzden kesme dokunmayla olur ve en yakin tus bosluktur.
       Bir alana yaziyorken bosluk elbette bosluktur. */
    if(e.key === ' ' && ESP.Talk && ESP.Talk.isActive() && !typingInField(e)){
      if(ESP.Talk.kes()){ e.preventDefault(); return; }
    }
    if(e.key === 'Escape'){
      if(ESP.Talk && ESP.Talk.isActive()){ ESP.Talk.stop(); render(); return; }
      if(ESP.Palette.isOpen()){ ESP.Palette.close(); return; }
      if(isAppearanceOpen()){ closeAppearance(); return; }
      if(UI.isHintOpen()){ UI.closeHint(); return; }
      if(UI.isSheetOpen()){ UI.closeSheet(); return; }
      if(S.sidebarOpen){ S.sidebarOpen = false; render(); return; }
    }
    if(e.key === 'Enter' && e.target && ENTER_ACTIONS[e.target.id]){
      e.preventDefault();
      const act = ENTER_ACTIONS[e.target.id];
      const sc = screen();
      const fn = (sc.handle && sc.handle[act]) || globalHandle[act];
      if(fn) await fn(e.target, e);
      return;
    }
    if(typingInField(e) || ESP.Palette.isOpen() || UI.isSheetOpen()) return;
    if(e.key === '?'){ e.preventDefault(); ESP.Palette.showShortcuts(); return; }

    /* LİSTEDE KLAVYE GEZİNME. `j`/`k` ile satır satır, Enter ile aç.
       Masaüstünde toplu giriş için: on beş ölçümü tek tek açmak on beş
       kez fareye uzanmak demekti.

       Gezilebilir satır ekrana ait değildir, ORTAKTIR: `[data-act]`
       taşıyan ve listede duran her düğme. Böylece her ekran ayrıca
       yazmak zorunda kalmaz. */
    if(e.key === 'j' || e.key === 'k' || e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      const asagi = e.key === 'j' || e.key === 'ArrowDown';
      if(moveRowFocus(asagi ? 1 : -1)){ e.preventDefault(); return; }
    }
    if(e.key === 'Enter'){
      const el = document.activeElement;
      if(el && el.matches && el.matches(ROW_SELECTOR)){ e.preventDefault(); el.click(); return; }
    }

    const sc = screen();
    if(sc.onKey) sc.onKey(e);
  });

  /* Gezilebilir satırlar: sonuç listesi, karşılaştırma, geçmiş, öğün ve
     hareket listeleri. Hepsi düğme olduğu için odaklanabilirler. */
  const ROW_SELECTOR = '.reslist .resrow, .reslist .cmprow, .list .listitem[data-act],'
    + ' .medlist .medrow [data-act="edit-med"], .ledger [data-act="open-marker"],'
    + ' [data-act="open-lab"], [data-act="open-day"]';

  function moveRowFocus(delta){
    const rows = Array.from(document.querySelectorAll(ROW_SELECTOR))
      .filter(el => el.offsetParent !== null);
    if(!rows.length) return false;
    const simdi = rows.indexOf(document.activeElement);
    /* Hiçbiri odakta değilse aşağı ilk satıra, yukarı sonuncuya gider. */
    const hedef = simdi < 0
      ? (delta > 0 ? 0 : rows.length - 1)
      : Math.max(0, Math.min(rows.length - 1, simdi + delta));
    const el = rows[hedef];
    if(!el) return false;
    el.focus({ preventScroll:true });
    el.scrollIntoView({ block:'nearest', behavior:'auto' });
    return true;
  }

  /* ---------------------------------------------------------- sürükle-bırak

     Dosya sayfanın herhangi bir yerine bırakılabilir; en yakın bırakma
     alanına değil, EKRANIN tanımladığı alana gider. Kullanıcı dosyayı
     küçük bir kutuya nişan almak zorunda kalmaz. */
  let dragDepth = 0;

  function dropTarget(){
    return document.querySelector('[data-drop]');
  }

  document.addEventListener('dragenter', e => {
    if(!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') < 0) return;
    dragDepth++;
    const t = dropTarget();
    if(t) t.classList.add('is-over');
    document.body.classList.add('is-dragging');
  });
  document.addEventListener('dragover', e => {
    if(document.body.classList.contains('is-dragging')) e.preventDefault();
  });
  document.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if(dragDepth === 0) clearDrag();
  });
  function clearDrag(){
    dragDepth = 0;
    document.body.classList.remove('is-dragging');
    const t = dropTarget();
    if(t) t.classList.remove('is-over');
  }
  document.addEventListener('drop', async e => {
    const t = dropTarget();
    if(!t) return;
    e.preventDefault();
    clearDrag();
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if(!file) return;
    const act = t.getAttribute('data-drop');
    const sc = screen();
    const fn = (sc.change && sc.change[act]) || globalChange[act];
    if(fn) await fn({ files:[file], value:'' }, e);
  });

  /* Açık katmanları dışarıya tıklayınca kapat. */
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

  /* Pencere boyutu değişince panelin çapası kayar; yeniden konumlamak
     yerine kapatmak daha dürüst: kullanıcı nereye tıkladığını bilir. */
  window.addEventListener('resize', () => { if(isAppearanceOpen()) closeAppearance(); });

  /* ------------------------------------------------------------ depolama sağlığı */
  let lastErrorToastAt = 0;
  function wireStoreErrors(){
    ESP.Store.onError = function(error, health){
      S.storeHealth = { error, health };
      const now = Date.now();
      if(now - lastErrorToastAt > 8000){
        lastErrorToastAt = now;
        UI.toast(error.message);
      }
    };
  }

  function storeHealthHtml(){
    const sh = S.storeHealth;
    if(!sh || !sh.error) return '';
    const isLocal = sh.error.scope.indexOf('local') === 0;
    return ESP.C.Button({ label:isLocal ? 'Kayıt sorunu' : 'Senkronizasyon sorunu', icon:'warn',
      size:'sm', tone:'danger', block:true, act:'show-store-error', data:{ id:'store-health' } });
  }

  /* ---------------------------------------------------- telefona kurulum (PWA)
     Tek dosya olarak çalıştığı için manifest de gömülü üretilir; ayrı dosya
     ya da service worker gerekmez. Uygulama zaten çevrimdışı çalışır. */
  function installManifest(){
    const el = document.getElementById('pwa-manifest');
    if(!el) return;
    const name = (S.profile && S.profile.name) ? 'ESP — ' + S.profile.name : 'ESP';
    const icon = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
      + '<rect width="512" height="512" rx="112" fill="#2F5A8A"/>'
      + '<text x="256" y="342" font-family="system-ui,sans-serif" font-size="270" font-weight="800"'
      + ' fill="#fff" text-anchor="middle">E</text></svg>');
    const manifest = {
      name, short_name:'ESP', start_url:location.href, scope:'./',
      display:'standalone', background_color:'#F7F8FA', theme_color:'#2F5A8A',
      lang:'tr', description:'Dil, felsefe, müzik, diksiyon, okuma ve yazı pratiğinin kaydı',
      icons:[{ src:icon, sizes:'512x512', type:'image/svg+xml', purpose:'any maskable' }],
    };
    try{
      el.setAttribute('href', 'data:application/manifest+json;charset=utf-8,'
        + encodeURIComponent(JSON.stringify(manifest)));
    }catch(e){}
  }

  /* ------------------------------------------------------------------ açılış */
  /* Denetim betikleri (tools/smoke.js) ortak eylem adlarini bilmeli:
     karsiligi olmayan bir `data-act`, tiklaninca hicbir sey yapmayan bir
     dugme demektir ve bu SESSIZCE olur — kullanici tiklar, bir sey olmaz,
     bir kez daha tiklar. Liste burada uretilir ki ikinci bir yerde elle
     tutulmasin ve eskimesin. */
  window.__ESP_GLOBAL_ACTS__ = Object.keys(globalHandle);
  window.__ESP_GLOBAL_CHANGES__ = Object.keys(globalChange);

  async function boot(){
    try{
      /* Arayüz Türkçe: CSS büyük harfe çevirirken "i" → "İ" olsun.
         Tek dosya sürümünde <html> kabuğu dışarıdan gelir, bu yüzden burada. */
      const root = document.documentElement;
      root.lang = 'tr';
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
      installManifest();

      /* Ofis açılışı bloklamaz: yüklenince yeniden çizilir ve günün
         brifingi bir kez üretilir. */
      ESP.Office.load().then(async () => {
        render();
        try{
          if(ESP.Office.settings().autoBriefing !== false) await ESP.Office.dailyBriefing();
        }catch(e){ /* brifing açılışı bozmaz */ }
        render();
      });

      if(ESP.Setup.needed()) setTimeout(() => ESP.Setup.open(), 400);
    }catch(err){
      console.error('Açılış hatası:', err);
      const markup = String(html`<div class="content">
        ${ESP.C.Notice({ tone:'danger', title:'Uygulama başlatılamadı.',
          body:html`${err && err.message ? err.message : String(err)}
            <div class="mt-8">${ESP.C.Button({ label:'Yeniden dene', size:'sm', act:'reload' })}</div>` })}
      </div>`);
    }
  }

  return { boot, render, go, applyTheme, applySection, SECTIONS,
    sectionOf, routeOn, THEMES, installManifest,
    openAppearance, closeAppearance, isAppearanceOpen };
})();

/* Test paketi bu dosyayı da yükler (ekran sözleşmelerini denetlemek için)
   ama açılışı tetiklememelidir: test sayfasında #app kabuğu yoktur. */
if(!window.__ESP_NO_BOOT__) ESP.App.boot();
