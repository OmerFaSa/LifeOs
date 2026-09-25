/* Uygulama kabuğu: gezinme, yönlendirme, olay dağıtımı ve açılış.

   Ekranlar birbirini tanımaz; hepsi bu kabuğun içinde yaşar ve yalnızca
   SP.S'yi okur. Bir ekranın çizilirken hata vermesi diğerlerini kapatmaz:
   hata paneline düşer, kenar çubuğu açılmaya devam eder. */

window.SP = window.SP || {};

SP.App = (function(){
  const U = SP.U, M = SP.Model, UI = SP.UI, S = SP.S;
  const { html, raw, when, map, cls, attrs } = SP.h;

  /* SEKİZ ÇEKMECE (ekip/CEKMECE-HARITASI.md, kullanıcı kararı 2026-09-24).

     Üç modülde aynı ad ve sıra; adlar tek kaynaktan gelir
     (`LIFEOS.KABUK.CEKMECELER`). İç içelik en çok iki kat: çekmece ›
     bölüm. Bölümler üst çubukta değil, sayfa başının altındaki bölüm
     çubuğunda durur. Tek bölümlü çekmecede o çubuk çizilmez.

     Yönlendirme kimlikleri değişmedi (komut paleti, testler ve derin
     bağlantılar bozulmaz); değişen yalnız gruplama. Önceki yedi bölümden
     nereye: Günlük → Bugün; Testler, Besin, Hareket, Finans → Çalışma;
     Ofis › Analiz → Analiz; Rütbe → Ayarlar › Rütbe; Hane → Ayarlar ›
     Profil. Yeni: Plan › Hedefler (Bugün'ün Özet sekmesindeydi), Onaylar
     (Bugün'ün başındaki teklifler), Kütüphanem (BAM'ın ürettikleri). */
  const K = window.LIFEOS.KABUK;
  const CEK = id => (K.CEKMECELER.find(c => c.id === id) || {}).ad || id;
  const SECTIONS = [
    { id:'bugun', label:CEK('bugun'), views:[
      { route:'today', label:'Bugün' },
      { route:'gun',   label:'Ayrıntı' },
    ]},
    { id:'plan', label:CEK('plan'), views:[
      { route:'hedefler', label:'Hedefler' },
    ]},
    { id:'calisma', label:CEK('calisma'), views:[
      { route:'labs',    label:'Testler' },
      { route:'meals',   label:'Öğün' },
      { route:'kitchen', label:'Mutfak' },
      { route:'move',    label:'Hareket' },
      { route:'basket',  label:'Bütçe' },
    ]},
    { id:'analiz', label:CEK('analiz'), views:[
      { route:'analytics', label:'Analiz' },
    ]},
    { id:'onaylar', label:CEK('onaylar'), views:[
      { route:'onaylar', label:'Bekleyen' },
    ]},
    { id:'ofis', label:CEK('ofis'), views:[
      { route:'office',  label:'Masalar' },
      { route:'team',    label:'Danışma' },
      { route:'meeting', label:'Toplantı' },
    ]},
    { id:'kutuphane', label:CEK('kutuphane'), views:[
      { route:'kutuphane', label:'Bilgi ve ürünler' },
    ]},
    /* Rütbe burada bir bölümdür (karar §8-2); üst çubuktaki çip de
       buraya açılır. XP yalnız görünürlüktür, kendi çekmecesi olmaz. */
    { id:'ayarlar', label:CEK('ayarlar'), views:[
      { route:'family', label:'Profil' },
      { route:'guide',  label:'Genel' },
      { route:'rutbe',  label:'Rütbe' },
    ]},
  ];

  /* Menüde olmayan ayrıntı ekranı hangi bölümün altındadır. */
  const UST = {};

  /* Telefon alt bandı (karar 3): Bugün · Plan · Çalışma · Menü. */
  const BANT = ['bugun', 'plan', 'calisma'];

  const SECTION_OF = (function(){
    const m = {};
    SECTIONS.forEach(sec => sec.views.forEach(v => { m[v.route] = sec; }));
    return m;
  })();

  function sectionOf(route){ return SECTION_OF[UST[route] || route] || SECTIONS[0]; }
  function viewOf(route){
    const r = UST[route] || route;
    return SECTIONS.reduce((f, s) => f || s.views.find(v => v.route === r), null);
  }

  /* Gizlenen bolum (core/bolum.js) gezinmeden, alt banttan ve
     yonlendirmeden kalkar; bos kalan cekmece de gorunmez. */
  function gizliMi(route){ return !!(SP.Bolum && SP.Bolum.gizli(route)); }
  function sectionsGorunen(){
    return SECTIONS.map(s => Object.assign({}, s, { views:s.views.filter(v => !gizliMi(v.route)) }))
      .filter(s => s.views.length);
  }

  function screen(){
    if(gizliMi(S.route)) S.route = 'today';
    return SP.Screens[S.route] || SP.Screens.today;
  }

  /* Bölüm çubuğundaki sayaçlar — bekleyen işi gizlemez. */
  function badgeFor(id){
    if(id === 'labs'){
      const f = M.openFlags().filter(x => !x.ack).length;
      if(f) return { text:String(f), quiet:false };
      const due = SP.Bio.overdue().length;
      return due ? { text:String(due), quiet:true } : null;
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

  /* Onaylar'ın bekleyeni: King teklifi, HKM teklifi, bekleyen kayıt.
     Hepsi tek çekmecede durur; sayı da onların toplamıdır. */
  function onaySayisi(){
    try{ return SP.Screens.onaylar ? SP.Screens.onaylar.bekleyen() : 0; }
    catch(e){ console.error(e); return 0; }
  }

  /* Marka satırı profilden gelir; sabit bir slogan yoktur. */
  function brandLine(){
    const p = S.profile;
    if(!p || !p.name) return 'kişisel sağlık sistemi';
    const goal = SP.GOALS.find(g => g.id === p.goal);
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
    if(!SP.Beacon) return { durum:'kapali', route:'guide' };
    const a = SP.Beacon.settings();
    if(!a.enabled) return { durum:'kapali', route:'guide' };
    const bozuk = a.lastStatus !== null && a.lastStatus !== undefined && a.lastStatus !== 202;
    if(bozuk) return { durum:'ulasilamadi', saat:saatOf(a.lastAt), route:'guide' };
    if(a.lastOkAt) return { durum:'bagli', saat:saatOf(a.lastOkAt), route:'guide' };
    return { durum:'bekliyor', route:'guide' };
  }

  /* Rütbe çipi (140). Defter yüklenmemişse çip hiç çizilmez: «0 XP»
     çizmek, bilinmeyeni sıfır saymak olurdu. */
  function rutbeVerisi(){
    if(!SP.XP) return null;
    let d;
    try{ d = SP.XP.durum(); }catch(e){ return null; }
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
    const spi = [];
    const bayrak = M.openFlags().filter(x => !x.ack).length;
    if(bayrak) spi.push({ metin:bayrak + ' kırmızı bayrak açık', route:'today', acil:true });
    const gecen = SP.Bio.overdue().length;
    if(gecen) spi.push({ metin:gecen + ' testin zamanı geçti', route:'labs' });
    const v = S.vitals[U.todayISO()];
    if(!v || v.sleep == null) spi.push({ metin:'Bugünün ölçümü girilmedi', route:'today' });
    if(SP.Money.basketTotal().over) spi.push({ metin:'Haftalık bütçe aşıldı', route:'basket', acil:true });
    if(M.backupDue()) spi.push({ metin:'Yedek alma zamanı', route:'guide' });
    if(S.storeHealth && S.storeHealth.error) spi.push({ metin:'Kayıt sorunu var', act:'show-store-error', acil:true });
    const mer = [];
    const onay = onaySayisi();
    if(onay) mer.push({ metin:onay + ' öneri Onaylar’da bekliyor', route:'onaylar' });
    const king = (S.ui.hkmBildirim || []).length;
    if(king) mer.push({ metin:king + ' King bildirimi', route:'today' });
    return [{ modul:'spi', satirlar:spi }, { modul:'mer', satirlar:mer }];
  }

  function ustCubukHtml(sc){
    const aktif = sectionOf(sc.id);
    const onay = onaySayisi();
    const gruplar = safe(bildirimGruplari, []) || [];
    const bil = gruplar.reduce((t, g) => t + g.satirlar.length, 0);
    const acil = gruplar.some(g => g.satirlar.some(s => s.acil));
    /* v5 (LifeOS Tasarım Dili sürüm 5): kenar çubuğu + ince üst şerit; açık
       çekmecenin bölümleri kenarda (bölüm çubuğunun yerini alır). */
    const r = UST[sc.id] || sc.id;
    return K.iskeletV5({
      modul:'spi',
      yol:yolOf(sc.id),
      baglam:safe(brandLine, ''),
      cekmeceler:sectionsGorunen().map(g => ({ id:g.id, ad:g.label, route:g.views[0].route,
        on:g.id === aktif.id, sayac:g.id === 'onaylar' ? onay : 0,
        bolumler:g.views.map(v => ({ route:v.route, ad:v.label, on:v.route === r,
          rozet:safe(() => badgeFor(v.route), null) || null })) })),
      onay:{ sayi:onay, route:'onaylar' },
      bildirim:{ sayi:bil, acil },
      baglanti:safe(baglantiVerisi, null) || { durum:'kapali' },
      rutbe:safe(rutbeVerisi, null) || null,
      profil:profilVerisi(),
    });
  }

  /* ---------- gün şeridi ----------
     SPİ'nin günü saatli bloklardan değil ASGARİ GÜNÜN dört adımından
     oluşur (protein, su, yürüyüş, uyku; core/calc.js minimumDay): şeritte
     sıra olarak durur, tutulan adım «bitti». Girilmemiş adım «bitti»
     sayılmaz ama «yapılmadı» da denmez — bekliyor kalır. */
  function haftaVerisi(){
    const bugun = U.todayISO();
    const i = U.weekdayIndex(bugun);
    const AD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    return AD.map((ad, k) => {
      const iso = U.iso(U.addDays(U.today(), k - i));
      const gelecek = iso > bugun;
      const veri = !!(S.vitals[iso] || (S.meals[iso] && S.meals[iso].length)
        || SP.Model.workoutsOf(iso).length);
      const durum = gelecek ? 'gelecek'
        : !veri ? 'bos'
        : (SP.Calc.minimumDay(iso).complete ? 'tamam' : 'eksik');
      return { ad, gun:Number(iso.slice(8, 10)), bugun:iso === bugun, gelecek,
        noktalar:[{ modul:'spi', durum }] };
    });
  }

  /* Gün şeridi sayfaya çizilmiyor (kullanıcı, 2026-09-25: «o yukarıdaki gün
     çizgisini kaldır»). Kalan iş sayısı Bugün'ün Şimdi alanında durur. */
  function gunSeridiHtml(){
    const m = SP.Calc.minimumDay();
    const n = new Date();
    const tarih = n.toLocaleDateString('tr-TR', { weekday:'short' }) + ' '
      + n.toLocaleDateString('tr-TR', { day:'numeric', month:'short' });
    return K.gunSeridi({
      tarih,
      simdi:new Date(),
      seritler:[{ modul:'spi', ozet:m.done + '/' + m.total + ' asgari',
        bloklar:m.rows.map(r => ({ ad:r.label + ' · ' + r.detail, dk:1, durum:r.ok ? 'bitti' : 'bekliyor' })) }],
      kalan:m.total - m.done,
      hafta:S.ui.haftaAcik ? haftaVerisi() : null,
      haftaAcik:!!S.ui.haftaAcik,
    });
  }

  /* ---------- sayfa başı ----------
     Yol («Çalışma › Testler»), başlık, tek cümle ve ekranın eylemleri.
     Tek bölümlü çekmecede yol yazılmaz: «Onaylar › Bekleyen» bir şey
     söylemez. */
  function yolOf(route){
    const sec = sectionOf(route);
    const oge = viewOf(route);
    const sc = SP.Screens[route] || {};
    const ad = oge ? oge.label : sc.title;
    const yol = sec.views.length > 1 && ad !== sec.label ? [sec.label, ad] : [sec.label];
    if(UST[route]) yol.push(sc.title);
    return yol;
  }

  /* Ayarlar çekmecesi (T5): ayar arama (183) sayfa başında, kaydedilmemiş
     değişiklik (21) ve varsayılana dön (182) yalnız burada çalışır. */
  function ayarlardaMi(route){ return !!safe(() => sectionOf(route) && sectionOf(route).id === 'ayarlar', false); }
  function ayarRotalari(){ return safe(() => (SECTIONS.find(s => s.id === 'ayarlar') || { views:[] }).views.map(v => ({ route:v.route, ad:v.label })), []) || []; }

  function sayfaBasiHtml(sc){
    const baslik = safe(() => sc.headline ? sc.headline() : '') || sc.title;
    const ozet = safe(() => sc.lede ? sc.lede() : '') || safe(() => sc.subtitle());
    const AY = window.LIFEOS && window.LIFEOS.AYAR;
    const eylem = (AY && ayarlardaMi(sc.id) ? AY.aramaKutusu() : '')
      + (safe(() => sc.actions ? sc.actions() : '') || '');
    return K.sayfaBasi({ yol:[], ust:safe(() => sc.ust ? String(sc.ust()) : ''), baslik, ozet:ozet ? String(ozet) : '', eylem:eylem ? String(eylem) : '',
      /* 004: günün cümlesi başlıktaysa katalog numarası başlıkta durur. */
      oz:sc.headlineOz || '' });
  }

  function bolumCubuguHtml(sc){
    const sec = sectionOf(sc.id);
    const r = UST[sc.id] || sc.id;
    return K.bolumCubugu({ kabuk:true, cekmece:sec.label, bolumler:sec.views.filter(v => !gizliMi(v.route)).map(v => ({
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
    /* Bandın Menü'sü SPİ'nin kendi eylem adını taşır (`toggle-menu`):
       üst çubuktaki kabuk düğmesi `toggle-sidebar` der; ikisi aynı işi
       yapar, eski ad kaybolmaz (envanter tabanı). */
    sekmeler.push({ id:'menu', ad:'Menü', act:'toggle-menu', on:false });
    return K.altBant({ sekmeler });
  }

  /* Hızlı ekle (166): SPİ'nin en sık dört kaydı. Komut paletinin kendi
     eylemleri çağrılır (`cmdk-run`): aynı iş iki yerde iki ayrı kodla
     yazılmaz. */
  const HIZLI = [
    { ad:'Öğün ekle', act:'cmdk-run', data:{ 'data-id':'act:meal' } },
    { ad:'Günün ölçümünü gir', act:'cmdk-run', data:{ 'data-id':'act:vitals' } },
    { ad:'Antrenman seansı ekle', act:'cmdk-run', data:{ 'data-id':'act:session' } },
    { ad:'Tahlil raporu yapıştır', act:'cmdk-run', data:{ 'data-id':'act:paste' } },
  ];

  /* Sayfa sonu: sistemin iki değişmez cümlesi —klinik sınır ve
     mahremiyet— her ekranda bir kez; yanında derleme damgası. Seviye
     rozeti burada durmaz: üst çubuktaki rütbe çipi onu gösterir. */
  function footerHtml(){
    return html`
      <footer class="sayfasonu">
        <div class="wrapc sayfasonu__ic">
          <p><span class="sitefoot__k">Sınır</span> ${SP.CLINICAL.disclaimer}</p>
          <p>Veriler bu cihazda tutulur. Ad ve doğum yılı hiçbir modele gönderilmez.</p>
          ${raw(buildStampHtml())}
        </div>
      </footer>`;
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
    const b = SP.BUILD || {};
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

     Tema üst çubuktaki profil düğmesinden tek dokunuşla değişir. Seçim
     profile yazılır; yani cihaz değil KİŞİ hatırlanır ve hane profilleri
     arasında geçerken herkesin kendi görünümü gelir. */
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
          ${SP.C.Button({ label:'Profil', size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'family' } })}
        </div>
        <div class="appear__label">Tema</div>
        <div class="appear__themes">${SP.C.TemaSecici({ value:theme, act:'set-theme' })}</div>

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
    return String(SP.C.SakinHata({ ayrinti:msg,
      not:'Öteki ekranlar menüden açılmaya devam eder.' }));
  }


  /* Yeniden çizimde odağı ve imleç konumunu korumak için aktif alanı
     niteliklerinden türetilen kararlı bir anahtarla işaretle. */
  const FOCUS_ATTRS = ['data-change', 'data-act', 'data-id', 'data-i', 'data-date', 'name'];
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
      selector = '#' + el.id.replace(/([^\w-])/g, '\\$1');
    }else{
      const parts = FOCUS_ATTRS
        .map(a => { const v = el.getAttribute(a); return v == null ? null : '[' + a + '="' + v.replace(/"/g, '\\"') + '"]'; })
        .filter(Boolean);
      if(parts.length) selector = el.tagName.toLowerCase() + parts.join('');
    }
    if(!selector) return icerikte ? { selector:null, icerikte:true } : null;
    const snap = { selector, icerikte };
    try{
      if(el.selectionStart != null){ snap.start = el.selectionStart; snap.end = el.selectionEnd; }
    }catch(e){ /* sayı ve tarih girdilerinde seçim okunamaz */ }
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
    if(!changed) return fn();
    /* Destek ve azaltılmış hareket denetimi hareket.js'te; basılan kart
       varsa yeni ekrana büyür (T4, 153). */
    const H = window.LIFEOS && window.LIFEOS.HAREKET;
    if(H) return H.gecis(fn);
    const ok = typeof document.startViewTransition === 'function'
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
    SP.Memo.baslat();
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
        <div class="site site--v5">
          ${raw(safe(() => ustCubukHtml(sc)))}
          <div class="site__body">
            <div class="wrapc sayfa">
              ${raw(safe(() => sayfaBasiHtml(sc)))}
              ${raw(safe(() => bolumCubuguHtml(sc), ''))}
              <main class="content" id="main" tabindex="-1" aria-label="${sc.title}">${raw(body)}</main>
            </div>
          </div>
          ${safe(footerHtml)}
          ${raw(safe(() => altBantHtml(sc)))}
        </div>
        ${when(S.sidebarOpen, () => raw(safe(() => menuHtml(sc))))}`);

      /* Hareket (T4): çizimden önce fotoğraf, sonra karşılaştırma — yalnız
         değişen öğe hareket eder. */
      const appEl = document.getElementById('app');
      const H = window.LIFEOS && window.LIFEOS.HAREKET;
      if(H) H.once(appEl);
      if(window.LIFEOS && window.LIFEOS.AYAR) window.LIFEOS.AYAR.once(appEl);
      await withTransition(() => { appEl.innerHTML = markup; });

      const newMain = document.getElementById('main');
      if(newMain && scroll) newMain.scrollTop = scroll;
      restoreFocus(focus);
      if(H) H.sonra(appEl, S.route);
      if(window.LIFEOS && window.LIFEOS.AYAR) window.LIFEOS.AYAR.sonra(appEl, { rota:S.route, etkin:ayarlardaMi(S.route) });
      /* Ne değişti? (17): güncellemeden sonraki ilk açılışta sayfanın başında. */
      if(window.LIFEOS && window.LIFEOS.YENILIK) window.LIFEOS.YENILIK.yerlestir(appEl, { modul:'spi',
        yeniKullanici:!!safe(() => SP.Setup.needed(), true) });
      revealActiveTab();
      /* Odağı ancak YÖNLENDİRMEDEN sonra taşı: sıradan bir yeniden
         çizimde taşımak, yazan kullanıcının imlecini alandan koparırdı. */
      if(rotaDegisti){ rotaDegisti = false; rotayaOdaklan(sc); }
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
        ${SP.C.SakinHata({ baslik:'Ekran çizilemedi.', dugme:'Yeniden yükle',
          ayrinti:err && err.message ? err.message : String(err) })}
      </div>`);
    }finally{
      SP.Memo.bitir();
      rendering = false;
    }
  }

  function go(route){
    /* Ekran degisirse sesli oturum biter: paneli olmayan bir ekranda
       acik kalan mikrofon, kullanicinin goremedigi bir kayittir. */
    if(SP.Talk && SP.Talk.isActive()) SP.Talk.stop();

    /* Acik alt sayfa da kapanir.

       Eskiden kapanmiyordu: bir ekranda sheet acip gezinince o sheet'in
       govdesi DOM'da kaliyor ve YENI ekranin uzerinde duruyordu. Kullanici
       icin sonuc: tikladiginda hicbir sey olmayan bir dugme. (ESP'de duman
       testi bunu "olu dugme" olarak yakaladi.) */
    if(UI.isSheetOpen && UI.isSheetOpen()) UI.closeSheet();
    K.katmanKapat();
    /* Gizlenmis bolumun adresi Bugun'e doner. */
    if(gizliMi(route)) route = 'today';
    S.route = route;
    S.sidebarOpen = false;
    rotaDegisti = true;
    window.scrollTo(0, 0);
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
    /* Ayar aramasının sonucu (183): ekrana git, alana kay ve odakla. */
    async 'ayar-git'(el){
      const alan = el.dataset.alan;
      go(el.dataset.route);
      await render();
      if(window.LIFEOS && window.LIFEOS.AYAR) window.LIFEOS.AYAR.alanaGit(alan);
    },
    async go(el){
      if(window.LIFEOS && window.LIFEOS.HAREKET) window.LIFEOS.HAREKET.kaynak(el);
      go(el.dataset.route);
    },
    /* Menü (telefonda alt bandın dördüncü sekmesi). `toggle-menu` eski
       adıdır; klavye kısayolları ve eski bağlantılar için kalır. */
    async 'toggle-sidebar'(){ K.katmanKapat(); S.sidebarOpen = !S.sidebarOpen; render(); },
    async 'toggle-menu'(){ K.katmanKapat(); S.sidebarOpen = !S.sidebarOpen; render(); },
    /* Kabuğun açılır panelleri (LIFEOS.KABUK): ikinci basış kapatır. */
    async 'modul-menu'(el){
      if(K.katmanAcik('kabuk-modul')){ K.katmanKapat(); return; }
      K.katmanAc('kabuk-modul', K.modulMenusu({ modul:'spi' }), el);
    },
    async 'bildirim-ac'(el){
      if(K.katmanAcik('kabuk-bildirim')){ K.katmanKapat(); return; }
      K.katmanAc('kabuk-bildirim', K.bildirimPaneli({ gruplar:bildirimGruplari() }), el);
    },
    async 'hizli-ekle'(el){
      if(K.katmanAcik('kabuk-hizli')){ K.katmanKapat(); return; }
      K.katmanAc('kabuk-hizli', K.hizliEkle({ modul:'spi', satirlar:HIZLI }), el);
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

      if(SP.Voice.isActive() && SP.Voice.activeTarget() === id){
        SP.Voice.stop();
        el.classList.remove('is-on');
        el.setAttribute('aria-pressed', 'false');
        return;
      }

      const started = SP.Voice.dictateInto(field, {
        onEnd(){
          el.classList.remove('is-on');
          el.setAttribute('aria-pressed', 'false');
        },
        onError(code){
          el.classList.remove('is-on');
          el.setAttribute('aria-pressed', 'false');
          UI.toast(SP.Voice.message(code));
        },
      });
      if(started){
        el.classList.add('is-on');
        el.setAttribute('aria-pressed', 'true');
        field.focus({ preventScroll:true });
      }
    },

    async 'open-palette'(){ SP.Palette.open(); },
    async 'open-appearance'(el){
      if(isAppearanceOpen()){ closeAppearance(); return; }
      openAppearance(el);
    },
    async 'set-theme'(el){
      await M.saveProfile({ theme:el.dataset.theme });
      /* Ekran da yeniden çizilir: Ayarlar'daki seçici (ESP Profil) seçili
         kutuyu eskisinde bırakıyordu. */
      applyTheme();
      refreshAppearance();
      render();
    },
    async 'cmdk-run'(el){ SP.Palette.runById(el.dataset.id); },
    async 'quick-save'(){ await SP.Palette.saveQuick(); },
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
    async 'setup-save'(){ await SP.Setup.save(); },
    async 'setup-skip'(){ SP.Setup.skip(); },
    /* TANITIM ŞERİDİ — nokta basıldığında panel değişir.

       Sihirbaz YENİDEN ÇİZİLMEZ: `TANITIM_ADIM` doğrudan DOM'a
       dokunur. Yeniden çizmek, kullanıcının o ana kadar yazdığı
       alanları silmek olurdu — bir süsü değiştirmek için formu
       sıfırlamak. */
    'tanitim-adim'(el){ window.LIFEOS.TANITIM_ADIM(el); },
    /* Kurulumun üç adımı (171): yeniden çizmeden, yazılan kaybolmaz. */
    'kurulum-ileri'(el){ window.LIFEOS.KURULUM_GIT(el, 1); },
    'kurulum-geri'(el){ window.LIFEOS.KURULUM_GIT(el, -1); },
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
  /* Hatırlatmalar (screens/hatirlatui.js) Bugün'den, Özet'ten ve İlaç
     sekmesinden açılır; eylemleri her ekranda çalışsın diye geneldir. */
  if(SP.HatirlatUI){
    Object.assign(globalHandle, SP.HatirlatUI.handle);
    Object.assign(globalChange, SP.HatirlatUI.change);
  }

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
    if(!SP.Basarim || !SP.Perde || rozetPerdede) return;
    const r = SP.Basarim.bekleyen();
    if(!r) return;
    rozetPerdede = true;
    const damgala = () => {
      rozetPerdede = false;
      return SP.Basarim.gorundu(r.kod)
        .then(() => rozetKutla()).catch(() => {});
    };
    const sonuc = SP.Perde.rozetKutla(r, { bitti:damgala });
    if(sonuc && sonuc.sessiz){
      const V = (window.LIFEOS || {}).VITRIN;
      if(!(sonuc.sakin && V && V.sakinGoster && V.sakinGoster({ ust:'Yeni rozet', ad:r.ad, sistem:'SPİ' })))
        UI.toast('Yeni rozet — ' + r.ad);
      damgala();
    }
  }

  function kutla(y){
    if(!y || !SP.Perde || !SP.XP) return;
    const damgala = () => SP.XP.kutlandi()
      .then(() => SP.XP.tazele()).catch(() => {});
    const sonuc = SP.Perde.kutla(y, { bitti:damgala });
    if(sonuc && sonuc.sessiz){
      const ad = (y.kademeBilgi && y.kademeBilgi.ad) || ('Kademe ' + y.kademe);
      /* 143: sakin seçildiyse kısa parlama; yoksa (hareket azaltma) toast. */
      const V = (window.LIFEOS || {}).VITRIN;
      const renkAd = (y.kademeBilgi && y.kademeBilgi.id) || '';
      if(!(sonuc.sakin && V && V.sakinGoster && V.sakinGoster({ ust:y.yeniKademe ? 'Yeni kademe' : 'Yeni rütbe',
        ad:ad + ' ' + y.etiket, sistem:'SPİ', renk:renkAd })))
        UI.toast('Yeni rütbe — ' + ad + ' ' + y.etiket);
      damgala();
    }
  }

  let xpBekleyen = null;
  function xpTara(){
    if(!SP.XP) return;
    clearTimeout(xpBekleyen);
    xpBekleyen = setTimeout(async () => {
      try{
        /* YALNIZ BUGÜN DEĞİL, yazılabilir pencerenin tamamı. Dünkü
           antrenmanı bu sabah giren kişinin puanı hiç gelmiyordu:
           motor o güne yazmaya izin veriyordu ama kimse o günü
           eşitlemiyordu. Sekiz gün okunur, en çok BİR kez yazılır. */
        const r = await SP.XP.esitleCok(
          SP.XPSayim.gunler(SP.XP.pencere()));
        /* ÇİZİM YOK, DÜĞÜM TAZELEME. Ekranda değişen tek şey rozet ve
           panel; bütün sayfayı çizmek, tıklanan öğeyi kullanıcının
           altından çekmek demekti (bkz. core/xp.js, tazele). */
        if(r && r.degisti) SP.XP.tazele();

        /* ROZETLER AYNI TETİKTE ama AYRI DEFTERDE. Aynı yerden
           çağrılırlar çünkü ikisini de tetikleyen şey aynı: veri
           değişti. Ayrı defterde dururlar çünkü ölçtükleri şey ayrı —
           XP «hangi iş kaç puan», rozet «kaç saat, kaç gün, kaç görev».
           Biri ötekinin eşiğini değiştirmez. */
        if(SP.Basarim){
          const b = await SP.Basarim.esitleCok(
            SP.BasarimSayim.gunler(SP.XP.pencere()));
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
  const ENTER_ACTIONS = { 'meal-text':'add-meal', 'quick-meal':'quick-meal', 'chat-text':'send-chat',
    'barkod-kod':'barkod-bul', 'ht-saat':'ht-kaydet' };
  document.addEventListener('keydown', async e => {
    if((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')){
      e.preventDefault();
      if(SP.Palette.isOpen()) SP.Palette.close(); else SP.Palette.open();
      return;
    }
    /* Sesli sohbette BOSLUK sozu keser. Sesle kesilemiyor (ajan
       konusurken mikrofon kapali olmak zorunda — bkz. core/talk.js),
       bu yuzden kesme dokunmayla olur ve en yakin tus bosluktur.
       Bir alana yaziyorken bosluk elbette bosluktur. */
    if(e.key === ' ' && SP.Talk && SP.Talk.isActive() && !typingInField(e)){
      if(SP.Talk.kes()){ e.preventDefault(); return; }
    }
    if(e.key === 'Escape'){
      if(SP.Talk && SP.Talk.isActive()){ SP.Talk.stop(); render(); return; }
      if(SP.Palette.isOpen()){ SP.Palette.close(); return; }
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
    if(typingInField(e) || SP.Palette.isOpen() || UI.isSheetOpen()) return;
    if(e.key === '?'){ e.preventDefault(); SP.Palette.showShortcuts(); return; }

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

  /* ------------------------------------------------------- sürtünme ölçümü

     Sistemin kendi maliyeti de ölçülür (core/friction.js). SPİ'de oran
     hesaplanmaz: sağlıklı yaşamak bir saat işi değildir ve sahte bir
     payda uydurmak, ölçülmemiş bir şeyi ölçülmüş göstermek olurdu. */
  (function wireFriction(){
    if(!SP.Friction) return;
    let sonYazim = 0;
    const YAZIM_ARALIK = 30000;

    function dokun(){
      if(!S.ready) return;
      SP.Friction.tick();
      const now = Date.now();
      if(now - sonYazim > YAZIM_ARALIK){ sonYazim = now; SP.Friction.save(); }
    }
    ['click', 'keydown', 'input', 'scroll', 'pointerdown'].forEach(t => {
      document.addEventListener(t, dokun, { passive:true, capture:true });
    });
    document.addEventListener('visibilitychange', () => {
      if(document.hidden){ SP.Friction.blur(); SP.Friction.save(); }
      else SP.Friction.tick();
    });
    window.addEventListener('blur', () => SP.Friction.blur());
    window.addEventListener('pagehide', () => { SP.Friction.blur(); SP.Friction.save(); });
  })();

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
    SP.Store.onExternalWrite = function(){
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
    return SP.C.Button({ label:isLocal ? 'Kayıt sorunu' : 'Senkronizasyon sorunu', icon:'warn',
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
    const name = (S.profile && S.profile.name) ? 'SPİ — ' + S.profile.name : 'SPİ';
    /* Once "S" harfi ureten bir SVG'ydi; artik gercek marka gorseli
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
      name, short_name:'SPİ', start_url:location.href,
      /* Göreli kapsam gömülü (data:) manifestte çözülemez ve yok sayılır. */
      scope:new URL('./', location.href).href,
      display:'standalone', background_color:'#F7F8FA', theme_color:'#3D3F8F',
      lang:'tr', description:'Kişisel ve aile odaklı sağlık performans izleyicisi',
      icons:[{ src:icon, sizes:'192x192', type:'image/png', purpose:'any maskable' }],
    };
    try{
      el.setAttribute('href', 'data:application/manifest+json;charset=utf-8,'
        + encodeURIComponent(JSON.stringify(manifest)));
    }catch(e){}
  }

  /* ------------------------------------------------------------------ açılış */
  async function boot(){
    try{
      /* Hareket (T4, hareket.js): odak halkası, önizleme, odak kapısı.
         Önizleme ekranın kendi başlığını ve tek cümlesini okur. */
      if(window.LIFEOS && window.LIFEOS.HAREKET) window.LIFEOS.HAREKET.kur({ onizle(route){
        const hs = SP.Screens[route];
        if(!hs) return null;
        let cumle = '';
        try{ cumle = hs.headline ? String(hs.headline() || '') : ''; }catch(e){}
        return { baslik:hs.title, cumle };
      } });
      /* Ayarlar (T5): arama dizini ayar ekranlarının kendi çiziminden kurulur. */
      if(window.LIFEOS && window.LIFEOS.AYAR) window.LIFEOS.AYAR.kur({ dizin:async () => {
        const ekranlar = [];
        for(const r of ayarRotalari()){
          const es = SP.Screens[r.route];
          if(!es) continue;
          try{ ekranlar.push({ route:r.route, ad:r.ad, html:String(await es.render()) }); }catch(e){}
        }
        return window.LIFEOS.AYAR.dizin('SPİ', ekranlar);
      } });
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
        if(SP.XP) await SP.XP.yukle();
        if(SP.Basarim) await SP.Basarim.yukle();
      }catch(e){
        console.error('Seviye defteri yüklenemedi; seviye gösterilmeyecek.', e);
      }
      applyTheme();
      /* Gizlilik kilidi (176): açılışta, çizimden ÖNCE — arkada veri çizilmez.
         Kilit yoksa hemen döner. */
      if(window.LIFEOS && window.LIFEOS.KILIT){
        window.LIFEOS.KILIT.kurDinle();
        const isaret = safe(() => window.LIFEOS.KABUK.modulIsareti('spi', true), '');
        await window.LIFEOS.KILIT.ac('spi', { isaret });
      }
      await render();
      installManifest();
      /* Çevrimdışı kabuk: yalnız sunucuyla açılınca (brand/ortak/pwa.js). */
      if(window.LIFEOS && LIFEOS.Pwa) LIFEOS.Pwa.kaydet().catch(() => {});
      /* Tek dosya görselsiz açıldıysa bunu söyle (brand/ortak/gorsel.js). */
      if(window.LIFEOS && LIFEOS.Gorsel) LIFEOS.Gorsel.denetle('spi', m => UI.toast(m, { life:12000 }));
      /* Hedef ağı: etkin hedeflerin özeti HKM'ye, zaman bütçesi geri
         (brand/ortak/hedefag.js). HKM kapalıysa hiçbir şey olmaz. */
      if(SP.Hedefler && SP.Hedefler.ag){
        SP.Hedefler.ag.gonder().then(r => { if(r && r.butce) render(); }).catch(() => {});
      }
      /* Otomatik yedek: HKM açıksa günde bir, doğrulanınca hatırlatma
         kapanır (brand/ortak/yedekag.js). HKM kapalıysa hiçbir şey olmaz. */
      if(window.LIFEOS && LIFEOS.YedekAg){
        LIFEOS.YedekAg.kur({ hkm:() => SP.Beacon, modul:'spi',
          disaAktar:() => SP.Store.exportAll(), kayit:() => M.dataFootprint().total,
          yas:() => M.backupAgeDays(), isaretle:() => M.markBackup(),
          bildir:m => UI.toast(m, { life:12000 }) }).baslat();
      }
      /* King'in teklifleri (brand/ortak/kingteklif.js): onay bekleyen ücretli
         işler Bugün'de. Modül King'e iş verince hemen, yoksa dakikada bir
         tazelenir; HKM kapalıysa liste boş kalır ve kart çizilmez. */
      if(window.LIFEOS && LIFEOS.KingTeklif){
        SP.KingTeklif = LIFEOS.KingTeklif.kur({ hkm:() => SP.Beacon, modul:'spi' });
        const kingTazele = () => SP.KingTeklif.cek().then(l => {
          const once = JSON.stringify(S.ui.kingTeklifler || []);
          S.ui.kingTeklifler = l;
          if(JSON.stringify(l) !== once) render();
        }).catch(() => {});
        kingTazele();
        window.addEventListener(LIFEOS.KingTeklif.OLAY, kingTazele);
        setInterval(kingTazele, 60000);
      }
      /* Hatırlatma bildirimi (core/hatirlat.js): yalnız kullanıcı açtıysa ve
         tarayıcı izin verdiyse; saati son 15 dakikada gelmiş olan için. */
      if(SP.Hatirlat){
        SP.Hatirlat.tik();
        setInterval(() => { try{ SP.Hatirlat.tik(); }catch(e){} }, 60000);
      }

      /* Seviye kutlaması. İki yol da buraya çıkar:

           · Uygulama AÇIKKEN atlanan seviye — XP.dinle ile anında.
           · Uygulama KAPALIYKEN atlanmış seviye — açılışta bir kez.

         Kutlama gösterilene kadar «görülmedi» kalır: son kartı çözüp
         uygulamayı kapatan biri kutlamasını kaybetmez. Perde kapanınca
         XP.kutlandi() defteri damgalar ve aynı kutlama bir daha oynamaz. */
      try{
        if(SP.XP && SP.Perde){
          SP.XP.dinle(function(y){ kutla(y); });
          /* Açılış perdesi hâlâ oynuyorsa kutlama SIRAYA girer; iki tam
             ekran katman ve iki ses aynı anda olmaz (bkz. core/perde.js,
             AYNI ANDA TEK PERDE). */
          const bekleyen = SP.XP.bekleyenKutlama();
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

      /* Denetim sinyalleri: nöbetçi ve sürtünme ölçer arka planda bir kez
         koşar ve gerekiyorsa TEK soru açar (core/signals.js). */
      if(SP.Signals){
        SP.Signals.sync().then(r => { if(r && r.changed) render(); })
          .catch(e => console.error('Sinyal eşitleme hatası:', e));
      }

      /* Ofis açılışı bloklamaz: yüklenince yeniden çizilir ve günün
         brifingi bir kez üretilir. */
      SP.Office.load().then(async () => {
        render();
        try{
          if(SP.Office.settings().autoBriefing !== false) await SP.Office.dailyBriefing();
        }catch(e){ /* brifing açılışı bozmaz */ }
        render();
      });


      /* HKM işareti — AÇILIŞTA BİR KEZ, aralığı dolduysa. Bir ekranın
         açılması ağ trafiği doğurmaz; çizim döngüsünde hiçbir yerde
         çağrılmaz. Ateşle-ve-unut: söz beklenmez, hata yutulur, açılışı
         bloklamaz. İşaret kapalıysa (varsayılan) hiçbir şey olmaz. */
      if(SP.Beacon) SP.Beacon.ping();

      /* HKM'nin bekleyen teklifleri — acilista BIR KEZ, ateşle ve unut.
         Kuyruk okumak bir izin degildir: gelen sey Bugun ekraninda bir
         teklif satiri olur ve kullanici gormeden hicbir sey uygulanmaz.
         HKM kapaliysa kuyruk bos gelir ve hicbir sey degismez. */
      if(SP.Beacon){
        SP.Beacon.intents().then(liste => {
          if(liste && liste.length){ S.ui.hkmIntents = liste; render(); }
        }).catch(() => {});
        /* King'in bildirimleri (core/plan.js) — ayni kural: acilista BIR KEZ,
           HKM kapaliysa bos gelir ve hicbir sey cizilmez. */
        if(SP.Plan){
          SP.Plan.bildirimleriCek().then(l => {
            if(l && l.length){ S.ui.hkmBildirim = l; render(); }
          }).catch(() => {});
        }
        /* Uygulamasi yarida kalmis teklifler: kuyruktan bagimsiz, YEREL
           defterden gelir. HKM kapali olsa da gosterilir — cunku belirsiz
           kalan is bizim tarafimizdadir. */
        SP.Beacon.intentDoubts().then(d => {
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
          SP.Beacon.intents().then(liste => {
            if(liste && liste.length){ S.ui.hkmIntents = liste; render(); }
          }).catch(() => {});
          if(SP.Plan){
            SP.Plan.bildirimleriCek().then(l => {
              if(l){ S.ui.hkmBildirim = l; render(); }
            }).catch(() => {});
          }
        });
      }

      if(SP.Setup.needed()) setTimeout(() => SP.Setup.open(), 400);
    }catch(err){
      console.error('Açılış hatası:', err);
      const markup = String(html`<div class="content">
        ${SP.C.SakinHata({ baslik:'Uygulama açılamadı.', dugme:'Yeniden dene',
          ayrinti:err && err.message ? err.message : String(err) })}
      </div>`);
    }
  }

  return { boot, errorPanel, render, go, applyTheme, SECTIONS, sectionOf, yolOf, THEMES, installManifest,
    openAppearance, closeAppearance, isAppearanceOpen, bildirimGruplari };
})();

/* Test paketi bu dosyayı da yükler (ekran sözleşmelerini denetlemek için)
   ama açılışı tetiklememelidir: test sayfasında #app kabuğu yoktur. */
if(!window.__SPI_NO_BOOT__) SP.App.boot();
