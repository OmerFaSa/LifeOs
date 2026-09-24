/* Uygulama kabuğu: gezinme, yönlendirme, olay dağıtımı ve açılış.

   Ekranlar birbirini tanımaz; hepsi bu kabuğun içinde yaşar ve yalnızca
   ESP.S'yi okur. Bir ekranın çizilirken hata vermesi diğerlerini kapatmaz:
   hata paneline düşer, kenar çubuğu açılmaya devam eder. */

window.ESP = window.ESP || {};

ESP.App = (function(){
  const U = ESP.U, M = ESP.Model, UI = ESP.UI, S = ESP.S;
  const { html, raw, when, map, cls, attrs } = ESP.h;

  /* SEKİZ ÇEKMECE (ekip/CEKMECE-HARITASI.md, kullanıcı kararı 2026-09-24).

     Üç modülde aynı ad ve sıra; adlar tek kaynaktan gelir
     (`LIFEOS.KABUK.CEKMECELER`). İç içelik en çok iki kat: çekmece ›
     bölüm. Bölümler üst çubukta değil, sayfa başının altındaki bölüm
     çubuğunda durur. Tek bölümlü çekmecede o çubuk çizilmez.

     Katalog `data/sections.js` içinde bir VERİDİR, mantığı `core/nav.js`
     içinde yaşar: kapalı disiplinin bölümü Çalışma'dan düşer, sayfası
     kalmayan çekmece çizilmez. Yönlendirme kimlikleri değişmedi (komut
     paleti, testler ve derin bağlantılar bozulmaz). */
  const K = window.LIFEOS.KABUK;
  const SECTIONS = ESP.Nav.sections;
  const routeOn = ESP.Nav.routeOn;
  const sectionOf = ESP.Nav.sectionOf;
  const sectionsGorunen = ESP.Nav.sections;

  /* Menüde olmayan ayrıntı ekranı hangi bölümün altındadır. */
  const UST = {};

  /* Telefon alt bandı (karar 3): Bugün · Plan · Çalışma · Menü. */
  const BANT = ['bugun', 'plan', 'calisma'];

  function viewOf(route){
    const r = UST[route] || route;
    return SECTIONS().reduce((f, s) => f || s.views.find(v => v.route === r), null);
  }

  function screen(){ return ESP.Screens[S.route] || ESP.Screens.today; }

  /* Bölüm çubuğundaki sayaçlar — bekleyen işi gizlemez.

     Rozet yalnız **bekleyen iş** sayar, ilerleme değil. "Bugün 3 kart
     çözdün" bir rozet değildir; "9 kartın vadesi geçti" rozettir. */
  function badgeFor(id){
    if(id === 'lang'){
      const due = ESP.SRS.dueCards().length;
      return due ? { text:String(due), quiet:due < 20 } : null;
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

  /* Onaylar'ın bekleyeni. Onaylar ekranı gelene kadar sayı yoktur;
     «0» çizilmez. */
  function onaySayisi(){
    try{ return ESP.Screens.onaylar && ESP.Screens.onaylar.bekleyen ? ESP.Screens.onaylar.bekleyen() : 0; }
    catch(e){ console.error(e); return 0; }
  }

  /* Marka satırı profilden gelir; sabit bir slogan yoktur. */
  function brandLine(){
    const p = S.profile;
    if(!p || !p.name) return 'entelektüel pratik sistemi';
    const goal = ESP.FOCUS.find(g => g.id === p.focus);
    return p.name + (goal ? ' · ' + goal.label.toLocaleLowerCase('tr-TR') : '');
  }

  function profilVerisi(){
    const p = S.profile || {};
    return { ad:p.name || '', harf:(p.name || 'Ben').trim().charAt(0) };
  }

  function safe(fn, fallback){
    try{ return fn(); }
    catch(e){ console.error(e); return fallback || ''; }
  }

  function saatOf(iso){
    if(!iso) return '';
    const d = new Date(iso);
    if(isNaN(d.getTime())) return '';
    if(U.iso(d) === U.todayISO()) return K.saatMetni(d);
    return d.toLocaleDateString('tr-TR', { day:'numeric', month:'short' }) + ' ' + K.saatMetni(d);
  }

  /* Bağlantı noktası (118). Çizim ağa ÇIKMAZ: durum son gönderimin
     kaydından okunur. Hiç gönderilmemişse «bağlı» denmez — ölçülmemiştir. */
  function baglantiVerisi(){
    if(!ESP.Beacon) return { durum:'kapali', route:'profile' };
    const a = ESP.Beacon.settings();
    if(!a.enabled) return { durum:'kapali', route:'profile' };
    const bozuk = a.lastStatus !== null && a.lastStatus !== undefined && a.lastStatus !== 202;
    if(bozuk) return { durum:'ulasilamadi', saat:saatOf(a.lastAt), route:'profile' };
    if(a.lastOkAt) return { durum:'bagli', saat:saatOf(a.lastOkAt), route:'profile' };
    return { durum:'bekliyor', route:'profile' };
  }

  /* Rütbe çipi (140). Defter yüklenmemişse çip hiç çizilmez: «0 XP»
     çizmek, bilinmeyeni sıfır saymak olurdu. */
  function rutbeVerisi(){
    if(!ESP.XP) return null;
    let d;
    try{ d = ESP.XP.durum(); }catch(e){ return null; }
    if(!d || !d.kademeBilgi) return null;
    let gorsel = '';
    try{ gorsel = new URL('img/seviye/onay-' + d.kademe + '.webp', location.href).href; }catch(e){}
    return { ad:d.kademeBilgi.ad, etiket:d.etiket, kademe:d.kademe, oran:d.oran, tamam:d.tamam,
      icinde:d.icinde, gereken:d.gereken,
      icindeMetin:U.fmtNum(d.icinde), gerekenMetin:U.fmtNum(d.gereken),
      renk:d.kademeBilgi.renk, gorsel, route:'rutbe' };
  }

  /* Gruplu bildirimler (09): bu modülün uyarıları ve Merkez'in önerileri
     ayrı kümede. Kaynakları rozetlerle aynıdır; iki yerde iki ayrı sayı
     durmasın diye aynı hesaplardan okunur. */
  function bildirimGruplari(){
    const esp = [];
    const d = S.days[U.todayISO()];
    if(!d || !ESP.Model.dayHasEntry(d)) esp.push({ metin:'Bugünün pratiği girilmedi', route:'today' });
    if(routeOn('lang')){
      const due = safe(() => ESP.SRS.dueCards().length, 0) || 0;
      if(due) esp.push({ metin:due + ' kartın vadesi geldi', route:'lang' });
    }
    if(ESP.Model.backupDue && ESP.Model.backupDue()) esp.push({ metin:'Yedek alma zamanı', route:'profile' });
    if(S.storeHealth && S.storeHealth.error) esp.push({ metin:'Kayıt sorunu var', act:'show-store-error', acil:true });
    const mer = [];
    const onay = onaySayisi();
    if(onay) mer.push({ metin:onay + ' öneri Onaylar’da bekliyor', route:'onaylar' });
    const king = (S.ui.hkmBildirim || []).length;
    if(king) mer.push({ metin:king + ' King bildirimi', route:'today' });
    return [{ modul:'esp', satirlar:esp }, { modul:'mer', satirlar:mer }];
  }

  function ustCubukHtml(sc){
    const aktif = sectionOf(sc.id);
    const onay = onaySayisi();
    const gruplar = safe(bildirimGruplari, []) || [];
    const bil = gruplar.reduce((t, g) => t + g.satirlar.length, 0);
    const acil = gruplar.some(g => g.satirlar.some(s => s.acil));
    return K.ustCubuk({
      modul:'esp',
      cekmeceler:sectionsGorunen().map(g => ({ id:g.id, ad:g.label, route:g.views[0].route,
        on:g.id === aktif.id, sayac:g.id === 'onaylar' ? onay : 0 })),
      onay:{ sayi:onay, route:'onaylar' },
      bildirim:{ sayi:bil, acil },
      baglanti:safe(baglantiVerisi, null) || { durum:'kapali' },
      rutbe:safe(rutbeVerisi, null) || null,
      profil:profilVerisi(),
    });
  }

  /* ---------- gün şeridi ----------
     ESP'nin günü saatli bloklardan değil AÇIK DİSİPLİNLERDEN oluşur: bugün
     seansı yazılmış disiplin «bitti», yazılmamış olan «bekliyor». Girilmemiş
     disiplin «yapılmadı» sayılmaz — ölçülmemiştir. Blok boyu seansın
     dakikası; seans yoksa eşit pay. */
  function gunDisiplinleri(iso){
    const d = S.days[iso];
    const seans = (d && d.sessions) || [];
    return ESP.Mod.active().map(disc => {
      const dk = seans.filter(x => x.disc === disc.id).reduce((a, x) => a + (Number(x.minutes) || 0), 0);
      const var_ = seans.some(x => x.disc === disc.id);
      return { ad:(disc.short || disc.label || disc.id) + (var_ ? ' · ' + dk + ' dk' : ''),
        dk:var_ ? Math.max(dk, 1) : 15, durum:var_ ? 'bitti' : 'bekliyor' };
    });
  }

  function haftaVerisi(){
    const bugun = U.todayISO();
    const i = U.weekdayIndex(bugun);
    const AD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    return AD.map((ad, k) => {
      const iso = U.iso(U.addDays(U.today(), k - i));
      const gelecek = iso > bugun;
      const d = S.days[iso];
      const durum = gelecek ? 'gelecek' : (!d || !ESP.Model.dayHasEntry(d)) ? 'bos'
        : (gunDisiplinleri(iso).every(x => x.durum === 'bitti') ? 'tamam' : 'eksik');
      return { ad, gun:Number(iso.slice(8, 10)), bugun:iso === bugun, gelecek,
        noktalar:[{ modul:'esp', durum }] };
    });
  }

  function gunSeridiHtml(){
    const bloklar = gunDisiplinleri(U.todayISO());
    const biten = bloklar.filter(b => b.durum === 'bitti').length;
    const n = new Date();
    const tarih = n.toLocaleDateString('tr-TR', { weekday:'short' }) + ' '
      + n.toLocaleDateString('tr-TR', { day:'numeric', month:'short' });
    return K.gunSeridi({
      tarih,
      simdi:new Date(),
      seritler:[{ modul:'esp', ozet:biten + '/' + bloklar.length + ' disiplin', bloklar }],
      kalan:bloklar.length - biten,
      hafta:S.ui.haftaAcik ? haftaVerisi() : null,
      haftaAcik:!!S.ui.haftaAcik,
    });
  }

  /* Açık sayaç: kabuğun üst çubuğunda yuvası yok; sayfa başının üstünde
     durur ve Bugün'e götürür. Saniyesini `startClock` tazeler. */
  function sayacHtml(){
    if(!(ESP.Timer && ESP.Timer.active())) return '';
    return String(html`<button class="topclock" data-act="go" data-route="today"
      aria-label="Açık sayaç — Bugün ekranına git">
      <span class="topclock__dot" aria-hidden="true"></span>
      <span class="num" data-timer="1">${ESP.Timer.clock()}</span>
      <span class="topclock__disc">${(ESP.DISCIPLINE_BY_ID[ESP.Timer.disc()] || {}).short || ''}</span>
    </button>`);
  }

  /* ---------- sayfa başı ----------
     Yol («Çalışma › Dil»), başlık, tek cümle ve ekranın eylemleri.
     Tek bölümlü çekmecede yol yazılmaz. */
  function yolOf(route){
    const sec = sectionOf(route);
    const oge = viewOf(route);
    const sc = ESP.Screens[route] || {};
    const ad = oge ? oge.label : sc.title;
    const yol = sec.views.length > 1 && ad !== sec.label ? [sec.label, ad] : [sec.label];
    if(UST[route]) yol.push(sc.title);
    return yol;
  }

  function sayfaBasiHtml(sc){
    const baslik = safe(() => sc.headline ? sc.headline() : '') || sc.title;
    const ozet = safe(() => sc.lede ? sc.lede() : '') || safe(() => sc.subtitle());
    const eylem = safe(() => sc.actions ? sc.actions() : '');
    return K.sayfaBasi({ yol:yolOf(sc.id), baslik, ozet:ozet ? String(ozet) : '', eylem:eylem ? String(eylem) : '' });
  }

  function bolumCubuguHtml(sc){
    const sec = sectionOf(sc.id);
    const r = UST[sc.id] || sc.id;
    return K.bolumCubugu({ cekmece:sec.label, bolumler:sec.views.map(v => ({
      route:v.route, ad:v.label, on:v.route === r, rozet:safe(() => badgeFor(v.route), null) || null })) });
  }

  function menuHtml(sc){
    const aktif = UST[sc.id] || sc.id;
    const onay = onaySayisi();
    return K.menuSayfasi({
      cekmeceler:sectionsGorunen().map(g => ({ id:g.id, ad:g.label, sayac:g.id === 'onaylar' ? onay : 0,
        bolumler:g.views.map(v => ({ route:v.route, ad:v.label, on:v.route === aktif })) })),
      ayak:storeHealthHtml(),
    });
  }

  function altBantHtml(sc){
    const aktif = sectionOf(sc.id).id;
    const g = sectionsGorunen();
    const sekmeler = BANT.map(id => g.find(x => x.id === id)).filter(Boolean)
      .map(x => ({ id:x.id, ad:x.label, route:x.views[0].route, on:x.id === aktif }));
    /* Bandın Menü'sü ESP'nin kendi eylem adını taşır (`toggle-menu`):
       üst çubuktaki kabuk düğmesi `toggle-sidebar` der; ikisi aynı işi
       yapar, eski ad kaybolmaz (envanter tabanı). */
    sekmeler.push({ id:'menu', ad:'Menü', act:'toggle-menu', on:false });
    return K.altBant({ sekmeler });
  }

  /* Hızlı ekle (166): ESP'nin en sık kayıtları. Komut paletinin kendi
     eylemleri çağrılır (`cmdk-run`): aynı iş iki yerde iki ayrı kodla
     yazılmaz. */
  function hizliSatirlar(){
    const ids = (ESP.Palette && ESP.Palette.commands ? ESP.Palette.commands() : [])
      .filter(c => c.kind === 'Eylem').slice(0, 4);
    return ids.map(c => ({ ad:c.label, act:'cmdk-run', data:{ 'data-id':c.id } }));
  }

  /* Sayfa sonu: sistemin iki değişmez cümlesi —pedagojik sınır ve
     mahremiyet— her ekranda bir kez; yanında derleme damgası. Seviye
     rozeti burada durmaz: üst çubuktaki rütbe çipi onu gösterir. */
  function footerHtml(){
    return html`
      <footer class="sayfasonu">
        <div class="wrapc sayfasonu__ic">
          <p><span class="sitefoot__k">Sınır</span> ${ESP.PEDAGOGIC.disclaimer}</p>
          <p>Veriler bu cihazda tutulur. Ham ses kaydı ve tam metin taslak hiçbir modele gönderilmez.</p>
          ${raw(buildStampHtml())}
        </div>
      </footer>`;
  }

  /* ---------- derleme damgası ----------

     Ekrandaki sayfanın HANGİ derleme olduğunu söyler. Tarayıcı eski bir
     js dosyasını önbellekten verdiğinde arayüz aynı görünür, davranış
     eskidir; damga bunu görünür kılar. Yanındaki düğme önbelleği atlar. */
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
    const ad = (p.name || '').trim();
    return String(html`
      <div class="katman appear" id="appearance" role="dialog" aria-label="Profil ve görünüm">
        <div class="appear__profil">
          <span class="ust__profil" aria-hidden="true">${(ad || 'Ben').charAt(0).toLocaleUpperCase('tr-TR')}</span>
          <span class="minw0"><b>${ad || 'Profil'}</b><small>${brandLine()}</small></span>
          ${ESP.C.Button({ label:'Profil', size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'profile' } })}
        </div>
        <div class="appear__label">Tema</div>
        <div class="appear__themes">${map(THEMES, t => html`
          <button class="${cls('themebtn', t.id === theme && 'is-on')}"
            data-act="set-theme" data-theme="${t.id}"
            aria-pressed="${t.id === theme ? 'true' : 'false'}">
            ${raw(UI.icon(t.icon))}<span>${t.label}</span>
          </button>`)}
        </div>

        <p class="appear__note">Tema bu profile kaydedilir. «Sistem» seçiliyken
          cihazın açık/koyu tercihi izlenir. Tek tasarım: renk modülü söyler.</p>
      </div>`);
  }

  /* Panel kabuğun katman yöneticisinden açılır (LIFEOS.KABUK): dışarı
     tıklayınca, Esc'de ve pencere boyutu değişince kapanır; telefonda
     alttan açılır. Tema değişince yerinde tazelenir, kapanmaz. */
  function openAppearance(anchor){ K.katmanAc('appearance', appearanceHtml(), anchor); }
  function closeAppearance(){ if(K.katmanAcik('appearance')) K.katmanKapat(); }
  function isAppearanceOpen(){ return K.katmanAcik('appearance'); }
  function refreshAppearance(){ K.katmanTazele('appearance', appearanceHtml()); }

  /* Ekranın kendi hatası: sakin hata (011). Menü ve öteki ekranlar çalışır. */
  function errorPanel(err){
    const msg = (err && err.message) ? err.message : String(err);
    return String(ESP.C.SakinHata({ ayrinti:msg,
      not:'Öteki ekranlar menüden açılmaya devam eder.' }));
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

      /* v4 iskeleti (ekip/EKIP-PLANI.md §3): üst çubuk · gün şeridi ·
         sayfa başı · bölüm çubuğu · ekran · sayfa sonu; telefonda alt bant
         ve hızlı ekle. Parçalardan biri çizilemezse yalnız o parça düşer. */
      const markup = String(html`
        <a class="skiplink" href="#main">İçeriğe atla</a>
        <div class="site site--v4">
          ${raw(safe(() => ustCubukHtml(sc)))}
          ${raw(safe(gunSeridiHtml))}
          <div class="site__body">
            <div class="wrapc sayfa">
              ${raw(safe(sayacHtml))}
              ${raw(safe(() => sayfaBasiHtml(sc)))}
              ${raw(safe(() => bolumCubuguHtml(sc)))}
              <main class="content" id="main" tabindex="-1" aria-label="${sc.title}">${raw(body)}</main>
            </div>
          </div>
          ${safe(footerHtml)}
          ${raw(safe(() => altBantHtml(sc)))}
        </div>
        ${when(S.sidebarOpen, () => raw(safe(() => menuHtml(sc))))}`);

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
        ${ESP.C.SakinHata({ baslik:'Ekran çizilemedi.', dugme:'Yeniden yükle',
          ayrinti:err && err.message ? err.message : String(err) })}
      </div>`);
    }finally{
      ESP.Memo.bitir();
      rendering = false;
    }
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

    /* Acik alt sayfa da kapanir.

       Eskiden kapanmiyordu: bir ekranda sheet acip gezinince, o sheet'in
       govdesi DOM'da kaliyor ve YENI ekranin uzerinde duruyordu. Duman
       testi bunu "olu dugme" olarak yakaladi — onceki ekrana ait bir
       dugme, yeni ekranda hicbir islevi olmadan duruyordu. Kullanici
       icin de ayni sey: tikladiginda hicbir sey olmayan bir dugme. */
    if(UI.isSheetOpen && UI.isSheetOpen()) UI.closeSheet();

    /* Ekranin kendi temizligi. Ayni sebep: gorunmeyen bir ekranin metronomu
       kullanicinin kapatamayacagi bir sestir. Kanca istege baglidir;
       tanimlamayan ekran hicbir sey odemez. */
    const onceki = ESP.Screens[S.route];
    if(onceki && typeof onceki.leave === 'function'){
      try{ onceki.leave(); }catch(e){ console.error(e); }
    }
    K.katmanKapat();
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
    /* Paletler ve beş düzen kalktı (kullanıcı kararı §8-4, 2026-09-24):
       eski profilde kalan `palette`/`design` değeri okunmaz; kökte
       kalmış nitelik de silinir. */
    root.removeAttribute('data-palette');
    root.removeAttribute('data-design');
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
    /* Tezgâhın açılır satırı: basılan açılır; açık olana yeniden basmak
       kapatır (yalnız bir satır açık kalır). */
    async 'desk-tab'(el){
      const kap = el.closest('.lrow');
      const govde = kap ? kap.querySelector('.desk__body') : null;
      const disc = el.dataset.disc || (govde ? govde.dataset.disc : S.ui.sessionDisc);
      ESP.Desk.setTab(disc, ESP.Desk.tab(disc) === el.dataset.tab ? 'kapali' : el.dataset.tab);
      render();
    },

    async 'desk-send'(el){
      const disc = el.dataset.disc;
      const alan = document.getElementById('desk-ask-' + disc);
      const soru = alan ? alan.value.trim() : '';
      if(!soru) return;
      if(alan) alan.value = '';
      await UI.withBusy('Yanıt bekleniyor', null, async () => { await ESP.Desk.ask(disc, soru); });
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
    async 'topic-open'(el){
      S.ui.topicOpen = S.ui.topicOpen === el.dataset.id ? null : el.dataset.id;
      render();
    },

    /* Beyan bir ölçüm değildir: prefs içinde durur, hiçbir kapıyı açmaz. */
    async 'topic-mark'(el){
      await ESP.Lesson.markTopic(el.dataset.id, el.dataset.i);
      render();
    },

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

    /* Ünite sonu mini sınavı (fikir 41): sorular yalnız ünitenin kartları;
       oturum PRATİK alanında açılır, sonuç ünitenin yanında durur. */
    async 'unit-sinav'(el){
      const u = ESP.Lesson.unitOf(el.dataset.disc, el.dataset.id);
      if(!u) return;
      const s = ESP.Lesson.uniteSinavi(u, el.dataset.lang || undefined);
      if(!s.ok){ UI.toast(s.error); return; }
      S.ui.practice = s;
      S.ui.practiceShown = false;
      S.ui.practiceOrder = null;
      render();
      const hedef = document.querySelector('.prac');
      if(hedef && hedef.scrollIntoView) hedef.scrollIntoView({ block:'center' });
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
      const id = el.dataset.id;
      const res = await ESP.Plans.accept(id);
      if(!res.ok){ UI.toast(res.error); return; }
      /* Uygulanan her is geri alinabilir (core/plans.js geriAl). */
      UI.toast('Onaylandı — kural motoru uyguladı', { undo:async () => {
        const g = await ESP.Plans.geriAl(id);
        UI.toast(g.ok ? 'Geri alındı' : g.error);
        render();
      } });
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

    /* Egzersizin gorev metni katli durur: ada dokununca acilir. Tek bir
       tanesi acik kalir — ikisi acikken liste yine uzuyordu. */
    async 'rx-open'(el){
      S.ui.rxOpen = S.ui.rxOpen === el.dataset.id ? null : el.dataset.id;
      render();
    },

    async 'log-drill'(el){
      const res = await ESP.Coach.logDrill(el.dataset.id);
      if(!res.ok){ UI.toast(res.error); return; }
      UI.toast('İşlendi — gün kaydına yazıldı');
      render();
    },
    /* Menü (telefonda alt bandın dördüncü sekmesi). `toggle-menu` eski
       adıdır; klavye kısayolları ve eski bağlantılar için kalır. */
    async 'toggle-sidebar'(){ K.katmanKapat(); S.sidebarOpen = !S.sidebarOpen; render(); },
    async 'toggle-menu'(){ K.katmanKapat(); S.sidebarOpen = !S.sidebarOpen; render(); },
    /* Kabuğun açılır panelleri (LIFEOS.KABUK): ikinci basış kapatır. */
    async 'modul-menu'(el){
      if(K.katmanAcik('kabuk-modul')){ K.katmanKapat(); return; }
      K.katmanAc('kabuk-modul', K.modulMenusu({ modul:'esp' }), el);
    },
    async 'bildirim-ac'(el){
      if(K.katmanAcik('kabuk-bildirim')){ K.katmanKapat(); return; }
      K.katmanAc('kabuk-bildirim', K.bildirimPaneli({ gruplar:bildirimGruplari() }), el);
    },
    async 'hizli-ekle'(el){
      if(K.katmanAcik('kabuk-hizli')){ K.katmanKapat(); return; }
      K.katmanAc('kabuk-hizli', K.hizliEkle({ modul:'esp', satirlar:hizliSatirlar() }), el);
    },
    /* Gün şeridindeki tarih (05): yedi gün açılır ya da kapanır. */
    async 'hafta-ac'(){ S.ui.haftaAcik = !S.ui.haftaAcik; render(); },
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
    /* TANITIM ŞERİDİ — nokta basıldığında panel değişir.

       Sihirbaz YENİDEN ÇİZİLMEZ: `TANITIM_ADIM` doğrudan DOM'a
       dokunur. Yeniden çizmek, kullanıcının o ana kadar yazdığı
       alanları silmek olurdu — bir süsü değiştirmek için formu
       sıfırlamak. */
    'tanitim-adim'(el){ window.LIFEOS.TANITIM_ADIM(el); },
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

  /* Sayımları deftere eşitle. GECİKMELİ ve SESSİZ:

     · Gecikmeli, çünkü bir eylem sırasında art arda birkaç kayıt
       değişebilir; her birinde depoya yazmak gereksiz.
     · Sessiz, çünkü XP bir yan üründür: hatası hiçbir kaydı
       bozmamalı, hiçbir akışı kesmemeli.

     Hiçbir şey değişmediyse depoya yazılmaz — çoğu çizim bedavaya
     gelir. Seviye atlanırsa kutlamayı `XP.dinle` dinleyicisi açar
     (bkz. boot). */
  /* Seviye kutlaması — perde ya da sakin bir satır.

     Hareket azaltma tercihinde perde HİÇ açılmaz (bkz. core/perde.js):
     tam ekran bir katman açıp odağı çalmak, o tercihi isteyen kişinin
     istemediği şeydir. Bilgi yine verilir, yalnız sesi kısılır. */
  /* Rozet kutlaması — sırayla, BİR SEFERDE BİR TANE.

     Bir eşitleme birden çok rozet açabilir (ilk kurulumda geçmiş veri
     bir anda yirmi rozet doldurabilir). Yirmi perdeyi arka arkaya
     açmak kutlama değil ceza olurdu; kuyruk defterde durur, biri
     kapanınca sıradaki gelir ve uygulama kapansa da kaybolmaz. */
  /* Aynı rozet için İKİ perde açılmasın. `rozetKutla` iki yerden
     çağrılıyor (açılışta bir kez, eşitleme yeni rozet bulunca) ve
     ikisi arka arkaya gelirse kuyruktaki rozet henüz damgalanmamış
     olur: ikinci çağrı AYNI rozeti bir kez daha açardı. */
  let rozetPerdede = false;

  function rozetKutla(){
    if(!ESP.Basarim || !ESP.Perde || rozetPerdede) return;
    const r = ESP.Basarim.bekleyen();
    if(!r) return;
    rozetPerdede = true;
    const damgala = () => {
      rozetPerdede = false;
      return ESP.Basarim.gorundu(r.kod)
        .then(() => rozetKutla()).catch(() => {});
    };
    const sonuc = ESP.Perde.rozetKutla(r, { bitti:damgala });
    if(sonuc && sonuc.sessiz){
      UI.toast('Yeni rozet — ' + r.ad);
      damgala();
    }
  }

  function kutla(y){
    if(!y || !ESP.Perde || !ESP.XP) return;
    const damgala = () => ESP.XP.kutlandi()
      .then(() => ESP.XP.tazele()).catch(() => {});
    const sonuc = ESP.Perde.kutla(y, { bitti:damgala });
    if(sonuc && sonuc.sessiz){
      const ad = (y.kademeBilgi && y.kademeBilgi.ad) || ('Kademe ' + y.kademe);
      UI.toast('Yeni rütbe — ' + ad + ' ' + y.etiket);
      damgala();
    }
  }

  let xpBekleyen = null;
  function xpTara(){
    if(!ESP.XP) return;
    clearTimeout(xpBekleyen);
    xpBekleyen = setTimeout(async () => {
      try{
        /* YALNIZ BUGÜN DEĞİL, yazılabilir pencerenin tamamı. Dünkü
           antrenmanı bu sabah giren kişinin puanı hiç gelmiyordu:
           motor o güne yazmaya izin veriyordu ama kimse o günü
           eşitlemiyordu. Sekiz gün okunur, en çok BİR kez yazılır. */
        const r = await ESP.XP.esitleCok(
          ESP.XPSayim.gunler(ESP.XP.pencere()));
        /* ÇİZİM YOK, DÜĞÜM TAZELEME. Ekranda değişen tek şey rozet ve
           panel; bütün sayfayı çizmek, tıklanan öğeyi kullanıcının
           altından çekmek demekti (bkz. core/xp.js, tazele). */
        if(r && r.degisti) ESP.XP.tazele();

        /* ROZETLER AYNI TETİKTE ama AYRI DEFTERDE. Aynı yerden
           çağrılırlar çünkü ikisini de tetikleyen şey aynı: veri
           değişti. Ayrı defterde dururlar çünkü ölçtükleri şey ayrı —
           XP «hangi iş kaç puan», rozet «kaç saat, kaç gün, kaç görev».
           Biri ötekinin eşiğini değiştirmez. */
        if(ESP.Basarim){
          const b = await ESP.Basarim.esitleCok(
            ESP.BasarimSayim.gunler(ESP.XP.pencere()));
          if(b && b.yeni.length) rozetKutla();
        }
      }catch(e){ console.error('XP eşitlenemedi:', e); }
    }, 400);
  }

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
    /* Veri değişmiş olabilir: XP sayımını tazele (gecikmeli, sessiz). */
    xpTara();
  });

  async function runChange(el, e){
    const sc = screen();
    const fn = (sc.change && sc.change[el.dataset.change]) || globalChange[el.dataset.change];
    if(!fn) return;
    try{ await fn(el, e); }
    catch(err){ console.error('Değişiklik hatası:', err); UI.toast('Değişiklik kaydedilemedi'); }
    /* Veri değişmiş olabilir: XP sayımını tazele (gecikmeli, sessiz). */
    xpTara();
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
  const ENTER_ACTIONS = { 'chat-text':'send-chat' };
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
      if(K.katmanAcik()){ K.katmanKapat(); return; }
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

  /* İpucu balonu dışarıya tıklayınca kapanır. Kabuğun panelleri
     (görünüm, modül menüsü, bildirimler, hızlı ekle) bunu LIFEOS.KABUK
     katman yöneticisinde yapar: dışarı tıklama, Esc, boyut değişimi. */
  document.addEventListener('mousedown', e => {
    if(UI.isHintOpen()
      && !e.target.closest('#popover') && !e.target.closest('[data-act="hint"]')){
      UI.closeHint();
    }
  });

  /* ------------------------------------------------------------ sürtünme ölçümü

     Sistemin kendi maliyeti de ölçülür (core/friction.js). Etkileşim ve
     görünürlük olayları sayaca dokunur; sekme arkaya gidince zincir kesilir
     ki açık unutulmuş bir sayfa «yönetim süresi» sayılmasın.

     Yazma işi seyrek yapılır: her tıklamada depoya yazmak, sürtünmeyi
     ölçerken sürtünme üretmek olurdu. */
  (function wireFriction(){
    if(!ESP.Friction) return;
    let sonYazim = 0;
    const YAZIM_ARALIK = 30000;

    function dokun(){
      if(!S.ready) return;
      ESP.Friction.tick();
      const now = Date.now();
      if(now - sonYazim > YAZIM_ARALIK){
        sonYazim = now;
        ESP.Friction.save();
      }
    }
    ['click', 'keydown', 'input', 'scroll', 'pointerdown'].forEach(t => {
      document.addEventListener(t, dokun, { passive:true, capture:true });
    });
    document.addEventListener('visibilitychange', () => {
      if(document.hidden){ ESP.Friction.blur(); ESP.Friction.save(); }
      else ESP.Friction.tick();
    });
    window.addEventListener('blur', () => ESP.Friction.blur());
    window.addEventListener('pagehide', () => { ESP.Friction.blur(); ESP.Friction.save(); });
  })();

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
    /* Baska sekme ayni kaydi degistirdi: otomatik birlestirme yapilmaz
       (yarim kalmis bir form ustune yazilabilir), yalniz kullanici
       uyarilir ki «son yazan kazanir» sessizce olmasin. Kendi zamanlayicisi
       vardir, onError'unkiyle karismaz.

       Olay tanim geregi GIZLI sekmeye gelir (kullanici o an obur
       sekmededir). O an cizilen bir toast, kullanici donmeden solar;
       bu yuzden uyari sekme GORUNUR olana kadar bekletilir. */
    let lastExternalToastAt = 0;
    let disaridanBekliyor = false;
    function disaridanUyar(){
      const now = Date.now();
      if(now - lastExternalToastAt > 8000){
        lastExternalToastAt = now;
        UI.toast('Veriler başka bir sekmede değişti. Kaybolmasın diye bu sayfayı tazele.', { life:8000 });
      }
    }
    ESP.Store.onExternalWrite = function(){
      if(document.hidden){ disaridanBekliyor = true; return; }
      disaridanUyar();
    };
    document.addEventListener('visibilitychange', () => {
      if(!document.hidden && disaridanBekliyor){ disaridanBekliyor = false; disaridanUyar(); }
    });
  }

  function storeHealthHtml(){
    const sh = S.storeHealth;
    if(!sh || !sh.error) return '';
    const isLocal = sh.error.scope.indexOf('local') === 0;
    return ESP.C.Button({ label:isLocal ? 'Kayıt sorunu' : 'Senkronizasyon sorunu', icon:'warn',
      size:'sm', tone:'danger', block:true, act:'show-store-error', data:{ id:'store-health' } });
  }

  /* ---------------------------------------------------- telefona kurulum (PWA)
     Manifest gömülü üretilir (tek dosya sürümüyle aynı yol). Sunucuyla
     (http/https) açılınca bir de çevrimdışı kabuk kaydedilir
     (brand/ortak/pwa.js + sw.js): ağ önce, ağ yoksa son kopya. `file://`
     ile açılan tek dosyada kabuk olmaz; uygulama orada da eksiksiz çalışır. */
  function installManifest(){
    const el = document.getElementById('pwa-manifest');
    if(!el) return;
    const name = (S.profile && S.profile.name) ? 'ESP — ' + S.profile.name : 'ESP';
    /* Once "E" harfi ureten bir SVG'ydi; artik gercek marka gorseli
       (img/brand/favicon.png: modülün kimlik logosu,
       brand/medya/kimlik/, 192 px kareye yerleştirilmiş). Dosya degisirse ikon
       da kendiliginden degisir, burasi hic dokunulmaz. */
    /* Ikon <link rel="icon"> etiketinden OKUNUR, yola elle yazilmaz.
       Tek dosya surumunde build.py o etiketin icine ikonu data URI
       olarak gomer; kurulan uygulamanin ikonu da boylece dosyayla
       birlikte gider. Kaynak surumde etiket goreli yolu tasir ve sonuc
       degismez. Etiket hic yoksa eski davranis surer. */
    const ikonEl = document.querySelector('link[rel="icon"]');
    const ikonRef = ikonEl && ikonEl.getAttribute('href');
    const icon = new URL(ikonRef || 'img/brand/favicon.png', location.href).href;
    const manifest = {
      name, short_name:'ESP', start_url:location.href,
      /* Göreli kapsam gömülü (data:) manifestte çözülemez ve yok sayılır. */
      scope:new URL('./', location.href).href,
      display:'standalone', background_color:'#F7F8FA', theme_color:'#2F5A8A',
      lang:'tr', description:'Dil, felsefe, müzik, diksiyon, okuma ve yazı pratiğinin kaydı',
      icons:[{ src:icon, sizes:'192x192', type:'image/png', purpose:'any maskable' }],
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

  /* Sayaç çizimle güncellenmez, KENDİ TIK'ıyla güncellenir.

     Her saniye bütün ekranı yeniden çizmek saçma olurdu: ekranda değişen
     tek şey bir metin. Bu yüzden yalnızca `[data-timer]` düğümlerinin metni
     tazelenir. Süre yine duvar saatinden okunur; tik kaçsa bile sayı doğru
     kalır (bkz. core/timer.js). */
  let saatTik = null;
  function startClock(){
    if(saatTik) return;
    saatTik = setInterval(() => {
      if(!ESP.Timer || !ESP.Timer.active() || !ESP.Timer.running()) return;
      const metin = ESP.Timer.clock();
      document.querySelectorAll('[data-timer]').forEach(el => {
        if(el.textContent !== metin) el.textContent = metin;
      });
    }, 1000);
  }

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

      /* SEVİYE DEFTERİ — bu sistemin KENDİ seviyesi (core/xp.js).

         Yükleme çizimden önce yapılır: rozet bir kare «veri yok» gösterip
         sonra dolarsa, kullanıcı seviyesinin sıfırlandığını sanır.
         Depoya erişilemezse defter boş kalır ve rozet hiç çizilmez —
         yüklenmemiş bir defteri «0 XP» diye çizmek, bu deponun en çok
         tekrarlanan kuralının (eksik veri sıfır değildir) ihlali olurdu.

         KENDİ BAŞINA DÜŞER. Seviye bir SÜStür; katalog yüklenmediyse ya
         da defter bozuksa uygulamayı açılış ekranında kilitleyemez. Bu
         `try` olmadan `kademeler.js`'teki tek bir hata bütün sistemi
         kapatırdı — ve kapattığı şey, hiç olmasa da çalışacak bir
         özellikti. */
      try{
        if(ESP.XP) await ESP.XP.yukle();
        if(ESP.Basarim) await ESP.Basarim.yukle();
      }catch(e){
        console.error('Seviye defteri yüklenemedi; seviye gösterilmeyecek.', e);
      }
      applyTheme();
      /* Eski bölüm rengi niteliği kalmışsa silinir: renk modülü söyler. */
      document.documentElement.removeAttribute('data-section');
      await render();
      installManifest();
      /* Çevrimdışı kabuk: yalnız sunucuyla açılınca (brand/ortak/pwa.js). */
      if(window.LIFEOS && LIFEOS.Pwa) LIFEOS.Pwa.kaydet().catch(() => {});
      /* Tek dosya görselsiz açıldıysa bunu söyle (brand/ortak/gorsel.js). */
      if(window.LIFEOS && LIFEOS.Gorsel) LIFEOS.Gorsel.denetle('esp', m => UI.toast(m, { life:12000 }));
      /* Hedef ağı: etkin hedeflerin özeti HKM'ye, zaman bütçesi geri
         (brand/ortak/hedefag.js). HKM kapalıysa hiçbir şey olmaz. */
      if(ESP.Hedefler && ESP.Hedefler.ag){
        ESP.Hedefler.ag.gonder().then(r => { if(r && r.butce) render(); }).catch(() => {});
      }
      /* Otomatik yedek: HKM açıksa günde bir, doğrulanınca hatırlatma
         kapanır (brand/ortak/yedekag.js). HKM kapalıysa hiçbir şey olmaz. */
      if(window.LIFEOS && LIFEOS.YedekAg){
        LIFEOS.YedekAg.kur({ hkm:() => ESP.Beacon, modul:'esp',
          disaAktar:() => ESP.Store.exportAll(), kayit:() => M.dataFootprint().total,
          yas:() => M.backupAgeDays(), isaretle:() => M.markBackup(),
          bildir:m => UI.toast(m, { life:12000 }) }).baslat();
      }
      /* King'in teklifleri (brand/ortak/kingteklif.js): onay bekleyen ücretli
         işler Bugün'de. Modül King'e iş verince hemen, yoksa dakikada bir
         tazelenir; HKM kapalıysa liste boş kalır ve kart çizilmez. */
      if(window.LIFEOS && LIFEOS.KingTeklif){
        ESP.KingTeklif = LIFEOS.KingTeklif.kur({ hkm:() => ESP.Beacon, modul:'esp' });
        const kingTazele = () => ESP.KingTeklif.cek().then(l => {
          const once = JSON.stringify(S.ui.kingTeklifler || []);
          S.ui.kingTeklifler = l;
          if(JSON.stringify(l) !== once) render();
        }).catch(() => {});
        kingTazele();
        window.addEventListener(LIFEOS.KingTeklif.OLAY, kingTazele);
        setInterval(kingTazele, 60000);
      }

      /* Seviye kutlaması. İki yol da buraya çıkar:

           · Uygulama AÇIKKEN atlanan seviye — XP.dinle ile anında.
           · Uygulama KAPALIYKEN atlanmış seviye — açılışta bir kez.

         Kutlama gösterilene kadar «görülmedi» kalır: son kartı çözüp
         uygulamayı kapatan biri kutlamasını kaybetmez. Perde kapanınca
         XP.kutlandi() defteri damgalar ve aynı kutlama bir daha oynamaz. */
      try{
        if(ESP.XP && ESP.Perde){
          ESP.XP.dinle(function(y){ kutla(y); });
          /* Açılış perdesi hâlâ oynuyorsa kutlama SIRAYA girer; iki tam
             ekran katman ve iki ses aynı anda olmaz (bkz. core/perde.js,
             AYNI ANDA TEK PERDE). */
          const bekleyen = ESP.XP.bekleyenKutlama();
          if(bekleyen) kutla(bekleyen);
        }
        /* ROZET KUYRUĞU DA AÇILIŞTA BOŞALIR — ve bir süre boşalmıyordu.

           Motor «kuyruk defterde durur, uygulama kapansa da kaybolmaz»
           diyor ve kuyruk gerçekten duruyordu; onu boşaltan tek yer
           `esitleCok`ten dönen YENİ rozet listesiydi. Yani kutlaması
           yarıda kalan biri (perde kapanmadan sekmeyi kapatmak yeter)
           o rozeti bir daha hiç göremiyordu — ta ki aylar sonra başka
           bir rozet kazanana kadar.

           XP'nin aynı hâli yukarıda çözülmüştü (`bekleyenKutlama`);
           rozet tarafı unutulmuştu. Kuyruk boşsa bu çağrı hiçbir şey
           yapmaz. */
        rozetKutla();
      }catch(e){
        console.error('Seviye kutlaması açılamadı.', e);
      }

      /* Açılışta bir kez eşitle: uygulama kapalıyken (ya da XP
         bağlanmadan önce) girilmiş kayıtlar da sayılsın. */
      xpTara();
      startClock();

      /* Denetim sinyalleri: nöbetçi ve sürtünme ölçer arka planda bir kez
         koşar ve gerekiyorsa TEK bir soru açar (core/signals.js). Açılışı
         bloklamaz; soru varsa Bugün ekranına bir satır olarak düşer. */
      if(ESP.Signals){
        ESP.Signals.sync().then(r => { if(r && r.changed) render(); })
          .catch(e => console.error('Sinyal eşitleme hatası:', e));
      }

      /* Ofis açılışı bloklamaz: yüklenince yeniden çizilir ve günün
         brifingi bir kez üretilir. */
      ESP.Office.load().then(async () => {
        render();
        try{
          if(ESP.Office.settings().autoBriefing !== false) await ESP.Office.dailyBriefing();
        }catch(e){ /* brifing açılışı bozmaz */ }
        render();
      });


      /* HKM işareti — AÇILIŞTA BİR KEZ, aralığı dolduysa. Bir ekranın
         açılması ağ trafiği doğurmaz; çizim döngüsünde hiçbir yerde
         çağrılmaz. Ateşle-ve-unut: söz beklenmez, hata yutulur, açılışı
         bloklamaz. İşaret kapalıysa (varsayılan) hiçbir şey olmaz. */
      if(ESP.Beacon) ESP.Beacon.ping();

      /* HKM'nin bekleyen teklifleri — acilista BIR KEZ, ateşle ve unut.
         Kuyruk okumak bir izin degildir: gelen sey Bugun ekraninda bir
         teklif satiri olur ve kullanici gormeden hicbir sey uygulanmaz.
         HKM kapaliysa kuyruk bos gelir ve hicbir sey degismez. */
      if(ESP.Beacon){
        ESP.Beacon.intents().then(liste => {
          if(liste && liste.length){ S.ui.hkmIntents = liste; render(); }
        }).catch(() => {});
        /* Uygulamasi yarida kalmis teklifler: kuyruktan bagimsiz, YEREL
           defterden gelir. HKM kapali olsa da gosterilir — cunku belirsiz
           kalan is bizim tarafimizdadir. */
        ESP.Beacon.intentDoubts().then(d => {
          if(d && d.length){ S.ui.hkmDoubts = d; render(); }
        }).catch(() => {});

        /* Sekmeye GERI DONUNCE tekrar sor. Once yalniz acilista
           soruluyordu: HKM bir teklif biraktiginda, sayfa acikken
           gormuyordun — yenilemeden haberin olmuyordu. Odaklanma bir
           kullanici eylemidir, cizim degil: bu istek hicbir cizimde
           atilmaz. */
        let sonSoru = Date.now();
        document.addEventListener('visibilitychange', () => {
          if(document.hidden) return;
          if(Date.now() - sonSoru < 30000) return;   /* sekme takibi degil */
          sonSoru = Date.now();
          ESP.Beacon.intents().then(liste => {
            if(liste && liste.length){ S.ui.hkmIntents = liste; render(); }
          }).catch(() => {});
        });
      }

      if(ESP.Setup.needed()) setTimeout(() => ESP.Setup.open(), 400);
    }catch(err){
      console.error('Açılış hatası:', err);
      const markup = String(html`<div class="content">
        ${ESP.C.SakinHata({ baslik:'Uygulama açılamadı.', dugme:'Yeniden dene',
          ayrinti:err && err.message ? err.message : String(err) })}
      </div>`);
    }
  }

  return { boot, errorPanel, render, go, applyTheme, SECTIONS,
    sectionOf, routeOn, yolOf, THEMES, installManifest,
    openAppearance, closeAppearance, isAppearanceOpen, bildirimGruplari };
})();

/* Test paketi bu dosyayı da yükler (ekran sözleşmelerini denetlemek için)
   ama açılışı tetiklememelidir: test sayfasında #app kabuğu yoktur. */
if(!window.__ESP_NO_BOOT__) ESP.App.boot();
