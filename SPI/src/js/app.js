/* Uygulama kabuğu: gezinme, yönlendirme, olay dağıtımı ve açılış.

   Ekranlar birbirini tanımaz; hepsi bu kabuğun içinde yaşar ve yalnızca
   SP.S'yi okur. Bir ekranın çizilirken hata vermesi diğerlerini kapatmaz:
   hata paneline düşer, kenar çubuğu açılmaya devam eder. */

window.SP = window.SP || {};

SP.App = (function(){
  const U = SP.U, M = SP.Model, UI = SP.UI, S = SP.S;
  const { html, raw, when, map, cls, attrs } = SP.h;

  /* Dört gezinme grubu.

     Önceki düzende her modülün kendi başlığı vardı ve tek öğelik gruplar
     ("EKONOMİ → Sepet") başlık gürültüsünden başka bir şey üretmiyordu.
     Şimdi gruplar İŞE göre ayrılıyor: her gün girilen şey, izlenen dört
     modül, değerlendirme ve sistem.

     `short` alanı mobil alt çubuk içindir: orada etiket tek satıra sığmalı. */
  const NAV = [
    { label:'Günlük', items:[
      { id:'today',  icon:'today', label:'Bugün',        short:'Bugün' },
      { id:'vitals', icon:'pulse', label:'Günlük ölçüm', short:'Ölçüm' },
    ]},
    { label:'İzleme', items:[
      { id:'labs',    icon:'flask',    label:'Tahliller', short:'Tahlil' },
      { id:'meals',   icon:'meal',     label:'Öğünler',   short:'Öğün' },
      { id:'kitchen', icon:'leaf',     label:'Mutfak',    short:'Mutfak' },
      { id:'move',    icon:'dumbbell', label:'Hareket',   short:'Hareket' },
      { id:'basket',  icon:'wallet',   label:'Sepet',     short:'Sepet' },
    ]},
    { label:'Değerlendirme', items:[
      { id:'analytics', icon:'chart', label:'Analiz',   short:'Analiz' },
      { id:'office',    icon:'users', label:'Ofis',     short:'Ofis' },
      { id:'team',      icon:'zap',   label:'Danışma',  short:'Danışma' },
      { id:'meeting',   icon:'list',  label:'Toplantı', short:'Toplantı' },
    ]},
    { label:'Sistem', items:[
      { id:'family', icon:'heart', label:'Hane',   short:'Hane' },
      { id:'guide',  icon:'guide', label:'Rehber', short:'Rehber' },
    ]},
  ];

  const MOBILE_TABS = ['today', 'vitals', 'meals', 'move', 'office'];

  function screen(){ return SP.Screens[S.route] || SP.Screens.today; }

  /* Kenar çubuğundaki sayaçlar — bekleyen işi gizlemez. */
  function badgeFor(id){
    if(id === 'labs'){
      const f = M.openFlags().filter(x => !x.ack).length;
      if(f) return { text:String(f), quiet:false };
      const due = SP.Bio.overdue().length;
      return due ? { text:String(due), quiet:true } : null;
    }
    if(id === 'vitals'){
      const v = S.vitals[U.todayISO()];
      return (!v || v.sleep == null) ? { text:'!', quiet:true } : null;
    }
    if(id === 'meals'){
      const g = SP.Nutri.gaps(7);
      return g.ok && g.rows.length ? { text:String(g.rows.length), quiet:true } : null;
    }
    if(id === 'office'){
      const n = SP.Office.notes().filter(x => x.tone === 'danger' || x.tone === 'warn').length;
      return n ? { text:String(n), quiet:true } : null;
    }
    if(id === 'basket'){
      const m = SP.Money.basketTotal();
      return m.over ? { text:'!', quiet:false } : null;
    }
    return null;
  }

  /* Marka satırı profilden gelir; sabit bir slogan yoktur. */
  function brandLine(){
    const p = S.profile;
    if(!p || !p.name) return 'kişisel sağlık sistemi';
    const goal = SP.GOALS.find(g => g.id === p.goal);
    return p.name + (goal ? ' · ' + goal.label.toLocaleLowerCase('tr-TR') : '');
  }

  function safe(fn, fallback){
    try{ return fn(); }
    catch(e){ console.error(e); return fallback || ''; }
  }

  function sidebarHtml(){
    const streak = safe(() => SP.Calc.streak(), 0);
    const m = safe(() => SP.Calc.minimumDay(), { done:0, total:4 });

    return html`
      <nav class="${cls('sidebar', S.sidebarOpen && 'is-open')}" id="sidebar" aria-label="Ana gezinme">
        <div class="sidebar__head">
          <div class="sidebar__mark">S</div>
          <div class="sidebar__title"><b>SPİ</b><span>${brandLine()}</span></div>
        </div>

        <div class="sidebar__scroll">${map(NAV, group => html`
          <div class="navgroup" role="group" aria-label="${group.label}">
            <div class="navgroup__label" aria-hidden="true">${group.label}</div>
            ${map(group.items, it => {
              const b = safe(() => badgeFor(it.id), null);
              const on = S.route === it.id;
              return html`<button class="${cls('navitem', on && 'is-active')}" data-act="go" data-route="${it.id}"
                ${when(on, () => attrs({ 'aria-current':'page' }))}>
                ${raw(UI.icon(it.icon))}<span>${it.label}</span>
                ${when(b, () => html`<span class="${cls('navitem__badge', b.quiet && 'is-quiet')}"
                  aria-label="${b.text + ' bekleyen'}">${b.text}</span>`)}
              </button>`;
            })}
          </div>`)}
        </div>

        <div class="sidebar__foot">
          <div class="countdown"><b class="num">${streak}</b><span>gün · asgari gün serisi</span></div>
          <div class="weekmeter">
            <div class="weekmeter__row"><span>Bugün</span><span class="num">${m.done}/${m.total}</span></div>
            ${SP.C.Bar({ value:U.pct(m.done, m.total), tone:'' })}
          </div>
          ${storeHealthHtml()}
        </div>
      </nav>`;
  }

  function tabbarHtml(){
    return html`<nav class="tabbar" aria-label="Hızlı gezinme">${map(MOBILE_TABS, id => {
      const item = NAV.reduce((f, g) => f || g.items.find(i => i.id === id), null);
      if(!item) return '';
      const on = S.route === id;
      return html`<button class="${cls('tabbar__item', on && 'is-active')}" data-act="go" data-route="${id}"
        aria-label="${item.label}" ${when(on, () => attrs({ 'aria-current':'page' }))}>
        ${raw(UI.icon(item.icon))}<span>${item.short || item.label}</span></button>`;
    })}</nav>`;
  }

  function topbarHtml(sc){
    const screenActions = safe(() => sc.actions ? sc.actions() : '');
    return html`
      <header class="topbar" role="banner">
        ${SP.C.IconButton({ icon:'menu', aria:'Menü', act:'toggle-sidebar', class:'topbar__menu' })}
        <div class="topbar__titles"><h1>${sc.title}</h1><p>${raw(safe(() => sc.subtitle()))}</p></div>
        <div class="topbar__actions">
          ${raw(screenActions)}
          ${when(screenActions, () => html`<span class="topbar__sep" aria-hidden="true"></span>`)}
          ${SP.C.IconButton({ icon:'search', aria:'Komut paleti (Ctrl+K)', title:'Ctrl+K', act:'open-palette' })}
          ${SP.C.IconButton({ icon:'palette', aria:'Görünüm', title:'Tema ve palet',
            act:'open-appearance', data:{ id:'appearance-btn' } })}
          ${SP.C.IconButton({ icon:'gear', aria:'Rehber ve ayarlar', act:'go', data:{ 'data-route':'guide' } })}
        </div>
      </header>`;
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
    const palette = p.palette || SP.DEFAULT_PALETTE;
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
        <div class="appear__palettes">${map(SP.PALETTES, pal => html`
          <button class="${cls('palbtn', pal.id === palette && 'is-on')}"
            data-act="set-palette" data-palette="${pal.id}" title="${pal.note}"
            aria-pressed="${pal.id === palette ? 'true' : 'false'}">
            <span class="palbtn__dot" style="background:${pal.swatch[0]}"></span>
            <span>${pal.name}</span>
          </button>`)}
        </div>

        <p class="appear__note">Tema ve palet bu profile kaydedilir.
          «Sistem» seçiliyken cihazın açık/koyu tercihi izlenir.</p>
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
    return String(SP.C.Notice({ tone:'danger', title:'Bu ekran çizilemedi.',
      body:html`${msg}
        <div class="row wrap mt-8">
          ${SP.C.Button({ label:'Bugün ekranına dön', size:'sm', act:'go', data:{ 'data-route':'today' } })}
          ${SP.C.Button({ label:'Yeniden yükle', size:'sm', act:'reload' })}
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
        console.error('Ekran hatası (' + sc.id + '):', err);
        body = errorPanel(err);
      }

      document.getElementById('app').innerHTML = String(html`
        <a class="skiplink" href="#main">İçeriğe atla</a>
        <div class="shell">
          ${safe(sidebarHtml)}
          <div class="shell__body">
            ${topbarHtml(sc)}
            <main class="content" id="main" tabindex="-1" aria-label="${sc.title}">${raw(body)}</main>
          </div>
        </div>
        ${tabbarHtml()}
        ${when(S.sidebarOpen, () => html`<div class="scrim" data-act="toggle-sidebar"></div>`)}`);

      const newMain = document.getElementById('main');
      if(newMain && scroll) newMain.scrollTop = scroll;
      restoreFocus(focus);
      if(sc.afterRender) sc.afterRender();
    }catch(err){
      console.error('Render hatası:', err);
      document.getElementById('app').innerHTML = String(html`<div class="content">
        ${SP.C.Notice({ tone:'danger', title:'Ekran çizilirken bir hata oluştu.',
          body:html`${err && err.message ? err.message : String(err)}
            <div class="mt-8">${SP.C.Button({ label:'Yeniden yükle', size:'sm', act:'reload' })}</div>` })}
      </div>`);
    }finally{
      rendering = false;
    }
  }

  function go(route){
    S.route = route;
    S.sidebarOpen = false;
    window.scrollTo(0, 0);
    render();
  }

  function applyTheme(){
    const root = document.documentElement;
    const t = S.profile ? S.profile.theme : 'system';
    if(t === 'light') root.setAttribute('data-theme', 'light');
    else if(t === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');

    const p = (S.profile && S.profile.palette) || SP.DEFAULT_PALETTE;
    if(p === SP.DEFAULT_PALETTE) root.removeAttribute('data-palette');
    else root.setAttribute('data-palette', p);
  }

  /* ---------------------------------------------------------- küresel eylemler */
  const globalHandle = {
    async go(el){ go(el.dataset.route); },
    async 'toggle-sidebar'(){ S.sidebarOpen = !S.sidebarOpen; render(); },
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
    async 'open-palette'(){ SP.Palette.open(); },
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
    async 'cmdk-run'(el){ SP.Palette.runById(el.dataset.id); },
    async 'sheet-close'(){ UI.closeSheet(); },
    async reload(){ location.reload(); },
    async 'setup-save'(){ await SP.Setup.save(); },
    async 'setup-skip'(){ SP.Setup.skip(); },
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
      const K = SP.C;
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
      if(SP.Palette.isOpen()) SP.Palette.close(); else SP.Palette.open();
      return;
    }
    if(e.key === 'Escape'){
      if(SP.Palette.isOpen()){ SP.Palette.close(); return; }
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
    if(typingInField(e) || SP.Palette.isOpen() || UI.isSheetOpen()) return;
    if(e.key === '?'){ e.preventDefault(); SP.Palette.showShortcuts(); return; }

    const sc = screen();
    if(sc.onKey) sc.onKey(e);
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
    SP.Store.onError = function(error, health){
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
    return SP.C.Button({ label:isLocal ? 'Kayıt sorunu' : 'Senkronizasyon sorunu', icon:'warn',
      size:'sm', tone:'danger', block:true, act:'show-store-error', data:{ id:'store-health' } });
  }

  /* ---------------------------------------------------- telefona kurulum (PWA)
     Tek dosya olarak çalıştığı için manifest de gömülü üretilir; ayrı dosya
     ya da service worker gerekmez. Uygulama zaten çevrimdışı çalışır. */
  function installManifest(){
    const el = document.getElementById('pwa-manifest');
    if(!el) return;
    const name = (S.profile && S.profile.name) ? 'SPİ — ' + S.profile.name : 'SPİ';
    const icon = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
      + '<rect width="512" height="512" rx="112" fill="#3D3F8F"/>'
      + '<text x="256" y="342" font-family="system-ui,sans-serif" font-size="270" font-weight="800"'
      + ' fill="#fff" text-anchor="middle">S</text></svg>');
    const manifest = {
      name, short_name:'SPİ', start_url:location.href, scope:'./',
      display:'standalone', background_color:'#F7F8FA', theme_color:'#3D3F8F',
      lang:'tr', description:'Kişisel ve aile odaklı sağlık performans izleyicisi',
      icons:[{ src:icon, sizes:'512x512', type:'image/svg+xml', purpose:'any maskable' }],
    };
    try{
      el.setAttribute('href', 'data:application/manifest+json;charset=utf-8,'
        + encodeURIComponent(JSON.stringify(manifest)));
    }catch(e){}
  }

  /* ------------------------------------------------------------------ açılış */
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
      await render();
      installManifest();

      /* Ofis açılışı bloklamaz: yüklenince yeniden çizilir ve günün
         brifingi bir kez üretilir. */
      SP.Office.load().then(async () => {
        render();
        try{
          if(SP.Office.settings().autoBriefing !== false) await SP.Office.dailyBriefing();
        }catch(e){ /* brifing açılışı bozmaz */ }
        render();
      });

      if(SP.Setup.needed()) setTimeout(() => SP.Setup.open(), 400);
    }catch(err){
      console.error('Açılış hatası:', err);
      document.getElementById('app').innerHTML = String(html`<div class="content">
        ${SP.C.Notice({ tone:'danger', title:'Uygulama başlatılamadı.',
          body:html`${err && err.message ? err.message : String(err)}
            <div class="mt-8">${SP.C.Button({ label:'Yeniden dene', size:'sm', act:'reload' })}</div>` })}
      </div>`);
    }
  }

  return { boot, render, go, applyTheme, NAV, THEMES, installManifest,
    openAppearance, closeAppearance, isAppearanceOpen };
})();

/* Test paketi bu dosyayı da yükler (ekran sözleşmelerini denetlemek için)
   ama açılışı tetiklememelidir: test sayfasında #app kabuğu yoktur. */
if(!window.__SPI_NO_BOOT__) SP.App.boot();
