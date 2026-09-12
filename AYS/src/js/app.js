/* Uygulama kabugu: gezinme, yonlendirme, olay dagitimi ve acilis. */

window.R = window.R || {};

R.App = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map, cls, attrs } = R.h;

  /* Birincil gezinme 5 grup. Ikincil seviyeler ekran ici alt-sekme olarak durur. */
  const NAV = [
    { label:'Günlük', items:[
      { id:'today', icon:'today', label:'Bugün' },
      { id:'week',  icon:'week',  label:'Hafta' },
    ]},
    { label:'Plan', items:[
      { id:'plan',     icon:'map',    label:'Program' },
      { id:'subjects', icon:'book',   label:'Dersler' },
      { id:'target',   icon:'target', label:'Hedef' },
    ]},
    { label:'Kayıt', items:[
      { id:'learn', icon:'play',  label:'Öğrenme' },
      { id:'exams', icon:'exam',  label:'Deneme' },
      { id:'cards', icon:'cards', label:'Tekrar' },
      { id:'quiz',  icon:'zap',   label:'Sınama' },
      { id:'solve', icon:'search', label:'Soru çöz' },
    ]},
    { label:'Analiz', items:[
      { id:'progress',  icon:'chart',  label:'İlerleme' },
      { id:'analytics', icon:'search', label:'Analiz' },
      { id:'protocols', icon:'shield', label:'Telafi' },
    ]},
    { label:'Rehber', items:[
      { id:'guide', icon:'guide', label:'Rehber' },
      { id:'profiles', icon:'shield', label:'Profiller' },
    ]},
    { label:'Ofis', items:[
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

  function sidebarHtml(){
    const cur = M.currentWeek();
    const progress = M.programProgress();
    const daysLeft = U.diffDays(U.todayISO(), R.PLAN.examTytISO);

    return html`
      <nav class="${cls('sidebar', S.sidebarOpen && 'is-open')}" id="sidebar" aria-label="Ana gezinme">
        <div class="sidebar__head">
          <div class="sidebar__mark">R</div>
          <div class="sidebar__title"><b>Rota</b><span>${brandLine()}</span></div>
        </div>

        <div class="sidebar__scroll">${map(NAV, group => html`
          <div class="navgroup" role="group" aria-label="${group.label}">
            <div class="navgroup__label" aria-hidden="true">${group.label}</div>
            ${map(group.items, it => {
              const b = badgeFor(it.id);
              const on = S.route === it.id;
              return html`<button class="${cls('navitem', on && 'is-active')}" data-act="go" data-route="${it.id}"
                ${when(on, () => attrs({ 'aria-current':'page' }))}>
                ${raw(UI.icon(it.icon))}<span>${it.label}</span>
                ${when(b, () => html`<span class="${cls('navitem__badge', b.quiet && 'is-quiet')}"
                  aria-label="${b.text+' bekleyen'}">${b.text}</span>`)}
              </button>`;
            })}
          </div>`)}
        </div>

        <div class="sidebar__foot">
          <div class="countdown"><b class="num">${daysLeft}</b><span>gün · TYT (tahmin)</span></div>
          <div class="weekmeter">
            <div class="weekmeter__row"><span>Hafta ${cur}/${R.PLAN.totalWeeks}</span>
              <span class="num">%${progress}</span></div>
            ${R.C.Bar({ value:progress, tone:'' })}
          </div>
          ${storeHealthHtml()}
        </div>
      </nav>`;
  }

  function tabbarHtml(){
    return html`<nav class="tabbar" aria-label="Hızlı gezinme">${map(MOBILE_TABS, id => {
      const item = NAV.reduce((f, g) => f || g.items.find(i => i.id === id), null);
      const on = S.route === id;
      return html`<button class="${cls('tabbar__item', on && 'is-active')}" data-act="go" data-route="${id}"
        aria-label="${item.label}" ${when(on, () => attrs({ 'aria-current':'page' }))}>
        ${raw(UI.icon(item.icon))}<span>${item.label}</span></button>`;
    })}</nav>`;
  }

  function safe(fn, fallback){
    try{ return fn(); }
    catch(e){ console.error(e); return fallback || ''; }
  }

  function topbarHtml(sc){
    return html`
      <header class="topbar" role="banner">
        ${R.C.IconButton({ icon:'menu', aria:'Menü', act:'toggle-sidebar', class:'topbar__menu' })}
        <div class="topbar__titles"><h1>${sc.title}</h1><p>${raw(safe(() => sc.subtitle()))}</p></div>
        <div class="topbar__actions">${raw(safe(() => sc.actions ? sc.actions() : ''))}
          ${R.C.IconButton({ icon:'search', aria:'Komut paleti (Ctrl+K)', title:'Ctrl+K', act:'open-palette' })}
          ${R.C.IconButton({ icon:'gear', aria:'Rehber ve ayarlar', act:'go', data:{ 'data-route':'guide' } })}
        </div>
      </header>`;
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
    if(!el || !/^(input|textarea|select)$/i.test(el.tagName)) return null;
    let selector = null;
    if(el.id){
      selector = '#'+el.id.replace(/([^\w-])/g, '\\$1');
    }else{
      const parts = FOCUS_ATTRS
        .map(a => { const v = el.getAttribute(a); return v == null ? null : '['+a+'="'+v.replace(/"/g,'\\"')+'"]'; })
        .filter(Boolean);
      if(parts.length) selector = el.tagName.toLowerCase()+parts.join('');
    }
    if(!selector) return null;
    const snap = { selector };
    try{
      if(el.selectionStart != null){ snap.start = el.selectionStart; snap.end = el.selectionEnd; }
    }catch(e){ /* number/date girdilerinde secim okunamaz */ }
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

  function go(route){
    /* Ekran degisirse sesli oturum biter: paneli olmayan bir ekranda
       acik kalan mikrofon, kullanicinin goremedigi bir kayittir. */
    if(R.Talk && R.Talk.isActive()) R.Talk.stop();
    S.route = route;
    S.sidebarOpen = false;
    if(route !== 'exams') S.ui.examOpen = S.ui.examOpen;
    window.scrollTo(0,0);
    render();
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
    const d = (S.profile && S.profile.design) || R.DEFAULT_DESIGN;
    if(d === R.DEFAULT_DESIGN) root.removeAttribute('data-design');
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

  /* Balonu disariya tiklayinca kapat */
  document.addEventListener('mousedown', e => {
    if(!UI.isHintOpen()) return;
    if(e.target.closest('#popover') || e.target.closest('[data-act="hint"]')) return;
    UI.closeHint();
  });

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
      await render();

      // AI koc yetenegi acilisi bloklamaz; hazir olunca panelleri gostermek icin yeniden ciz.
      installManifest();
      R.Auto.onDayOpen().then(done => { if(done.length) render(); });
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
