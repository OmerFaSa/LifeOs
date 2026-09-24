/* Uygulama kabugu: gezinme, yonlendirme, olay dagitimi ve acilis. */

window.R = window.R || {};

R.App = (function(){
  const U = R.U, M = R.Model, C = R.Calc, UI = R.UI, S = R.S;
  const { html, raw, when, map, cls, attrs } = R.h;

  /* SEKİZ ÇEKMECE (ekip/CEKMECE-HARITASI.md, kullanıcı kararı 2026-09-24).

     Üç modülde aynı ad ve sıra; adlar tek kaynaktan gelir
     (`LIFEOS.KABUK.CEKMECELER`). İç içelik en çok iki kat: çekmece ›
     bölüm. Bölümler üst çubukta değil, sayfa başının altındaki bölüm
     çubuğunda durur. Onaylar ve Kütüphanem tek bölümlüdür. */
  const K = window.LIFEOS.KABUK;
  const CEK = id => (K.CEKMECELER.find(c => c.id === id) || {}).ad || id;
  const NAV = [
    { id:'bugun', label:CEK('bugun'), items:[
      { id:'today', icon:'today', label:'Bugün' },
      { id:'gun',   icon:'list',  label:'Ayrıntı' },
    ]},
    { id:'plan', label:CEK('plan'), items:[
      { id:'week',   icon:'week',   label:'Hafta' },
      { id:'plan',   icon:'map',    label:'Program' },
      { id:'target', icon:'target', label:'Hedefler' },
    ]},
    { id:'calisma', label:CEK('calisma'), items:[
      { id:'subjects', icon:'book',   label:'Konu çalış' },
      { id:'learn',    icon:'play',   label:'Ders notları' },
      { id:'solve',    icon:'search', label:'Soru çöz' },
      { id:'exams',    icon:'exam',   label:'Deneme' },
      { id:'cards',    icon:'cards',  label:'Tekrar' },
      { id:'quiz',     icon:'zap',    label:'Sınama' },
    ]},
    { id:'analiz', label:CEK('analiz'), items:[
      { id:'progress',  icon:'chart',  label:'İlerleme' },
      { id:'analytics', icon:'search', label:'Ayrıntı' },
      { id:'protocols', icon:'shield', label:'Telafi' },
    ]},
    { id:'onaylar', label:CEK('onaylar'), items:[
      { id:'onaylar', icon:'check', label:'Bekleyen' },
    ]},
    { id:'ofis', label:CEK('ofis'), items:[
      { id:'office',  icon:'guide', label:'Masalar' },
      { id:'team',    icon:'zap',   label:'Danışma' },
      { id:'meeting', icon:'list',  label:'Toplantı' },
    ]},
    { id:'kutuphane', label:CEK('kutuphane'), items:[
      { id:'kutuphane', icon:'book', label:'Kitaplar' },
    ]},
    /* Rütbe burada bir bölümdür (karar §8-2); üst çubuktaki çip de
       buraya açılır. XP yalnız görünürlüktür, kendi çekmecesi olmaz. */
    { id:'ayarlar', label:CEK('ayarlar'), items:[
      { id:'guide',    icon:'guide',  label:'Genel' },
      { id:'profiles', icon:'shield', label:'Profil' },
      { id:'rutbe',    icon:'layers', label:'Rütbe' },
    ]},
  ];

  /* Menüde olmayan ayrıntı ekranı hangi bölümün altındadır. */
  const UST = { topic:'subjects' };

  /* Telefon alt bandı (karar 3): Bugün · Plan · Çalışma · Menü. */
  const BANT = ['bugun', 'plan', 'calisma'];

  /* Gizlenen bolum (core/bolum.js) gezinmeden, alt banttan ve
     yonlendirmeden kalkar. Bos kalan cekmece de gorunmez. */
  function gizliMi(route){ return !!(R.Bolum && R.Bolum.gizli(route)); }
  function navGorunen(){
    return NAV.map(g => Object.assign({}, g, { items:g.items.filter(i => !gizliMi(i.id)) }))
      .filter(g => g.items.length);
  }

  function screen(){
    if(gizliMi(S.route)) S.route = 'today';
    return R.Screens[S.route] || R.Screens.today;
  }

  /* Onaylar'ın bekleyeni: King teklifi, HKM teklifi, ofis önerisi. Üçü
     de tek çekmecede durur; sayı da üçünün toplamıdır. */
  function onaySayisi(){
    try{ return R.Screens.onaylar ? R.Screens.onaylar.bekleyen() : 0; }
    catch(e){ console.error(e); return 0; }
  }

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

  /* Bir ekran hangi cekmecede? */
  function bolumOf(route){
    const r = UST[route] || route;
    return NAV.find(g => g.items.some(i => i.id === r)) || NAV[0];
  }
  function ogeOf(route){
    const r = UST[route] || route;
    return NAV.reduce((f, g) => f || g.items.find(i => i.id === r), null);
  }

  function saatOf(iso){
    if(!iso) return '';
    const d = new Date(iso);
    if(isNaN(d.getTime())) return '';
    if(U.iso(d) === U.todayISO()) return K.saatMetni(d);
    return d.toLocaleDateString('tr-TR', { day:'numeric', month:'short' }) + ' ' + K.saatMetni(d);
  }

  /* Bağlantı noktası (118). Çizim ağa ÇIKMAZ (beacon.js kural 1): durum
     son gönderimin kaydından okunur. Hiç gönderilmemişse «bağlı»
     denmez — ölçülmemiştir. */
  function baglantiVerisi(){
    if(!R.Beacon) return { durum:'kapali', route:'guide' };
    const a = R.Beacon.settings();
    if(!a.enabled) return { durum:'kapali', route:'guide' };
    const bozuk = a.lastStatus !== null && a.lastStatus !== undefined && a.lastStatus !== 202;
    if(bozuk) return { durum:'ulasilamadi', saat:saatOf(a.lastAt), route:'guide' };
    if(a.lastOkAt) return { durum:'bagli', saat:saatOf(a.lastOkAt), route:'guide' };
    return { durum:'bekliyor', route:'guide' };
  }

  /* Rütbe çipi (140). Defter yüklenmemişse çip hiç çizilmez: «0 XP»
     çizmek, bilinmeyeni sıfır saymak olurdu. */
  function rutbeVerisi(){
    if(!R.XP) return null;
    let d;
    try{ d = R.XP.durum(); }catch(e){ return null; }
    if(!d || !d.kademeBilgi) return null;
    let gorsel = '';
    try{ gorsel = new URL('img/seviye/onay-' + d.kademe + '.webp', location.href).href; }catch(e){}
    return { ad:d.kademeBilgi.ad, etiket:d.etiket, kademe:d.kademe, oran:d.oran, tamam:d.tamam,
      icinde:d.icinde, gereken:d.gereken,
      icindeMetin:U.fmtNum(d.icinde), gerekenMetin:U.fmtNum(d.gereken),
      renk:d.kademeBilgi.renk, gorsel, route:'rutbe' };
  }

  /* Profilin satırı: sabit hedef ya da isim yoktur, profilden gelir. */
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

  function profilVerisi(){
    const p = S.profile || {};
    return { ad:p.name || '', harf:(p.name || 'Ben').trim().charAt(0) };
  }

  /* Gruplu bildirimler (09): bu modülün uyarıları ve Merkez'in önerileri
     ayrı kümede. Kaynakları rozetlerle aynıdır; iki yerde iki ayrı sayı
     durmasın diye aynı hesaplardan okunur. */
  function bildirimGruplari(){
    const ays = [];
    const kart = C.dueCards().length;
    if(kart) ays.push({ metin:kart + ' tekrar kartı bekliyor', route:'cards', acil:C.cardDebt() > 10 });
    const analiz = C.analysisDebt().length;
    if(analiz) ays.push({ metin:analiz + ' denemenin analizi eksik', route:'exams', acil:true });
    const tetik = C.protocolTriggers().length;
    if(tetik) ays.push({ metin:tetik + ' telafi protokolü tetiklendi', route:'protocols', acil:true });
    const w = S.weeks[M.weekId(M.currentWeek())];
    if(w && !w.signedAt) ays.push({ metin:'Bu haftanın sözleşmesi imzalanmadı', route:'week' });
    if(S.storeHealth && S.storeHealth.error) ays.push({ metin:'Kayıt sorunu var', act:'show-store-error', acil:true });
    const mer = [];
    const onay = onaySayisi();
    if(onay) mer.push({ metin:onay + ' öneri Onaylar’da bekliyor', route:'onaylar' });
    return [{ modul:'ays', satirlar:ays }, { modul:'mer', satirlar:mer }];
  }

  function ustCubukHtml(sc){
    const aktif = bolumOf(sc.id);
    const onay = onaySayisi();
    const gruplar = safe(bildirimGruplari, []) || [];
    const bil = gruplar.reduce((t, g) => t + g.satirlar.length, 0);
    const acil = gruplar.some(g => g.satirlar.some(s => s.acil));
    return K.ustCubuk({
      modul:'ays',
      cekmeceler:navGorunen().map(g => ({ id:g.id, ad:g.label, route:g.items[0].id,
        on:g.id === aktif.id, sayac:g.id === 'onaylar' ? onay : 0 })),
      onay:{ sayi:onay, route:'onaylar' },
      bildirim:{ sayi:bil, acil },
      baglanti:safe(baglantiVerisi, null) || { durum:'kapali' },
      rutbe:safe(rutbeVerisi, null) || null,
      profil:profilVerisi(),
    });
  }

  /* ---------- gün şeridi ----------
     Bloğun saati yoktur (plan süre ve sıra taşır, saat taşımaz): bloklar
     saate yerleştirilmez, modülün şeridinde SIRA ve SÜRE olarak durur.
     Şimdi çizgisi ve geçmiş dilim saatin kendisidir. */
  function blokDurumu(b){
    if(b.startedAt || (S.timer && S.timer.blockId === b.id)) return 'suruyor';
    return b.status === 'pending' ? 'bekliyor' : 'bitti';
  }

  function haftaVerisi(){
    const bugun = U.todayISO();
    const i = U.weekdayIndex(bugun);
    const AD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    return AD.map((ad, k) => {
      const iso = U.iso(U.addDays(U.today(), k - i));
      const gelecek = iso > bugun;
      const gun = S.days[iso];
      const durum = gelecek ? 'gelecek'
        : !gun ? 'bos'
        : (C.minimumDayMet(iso) ? 'tamam' : 'eksik');
      return { ad, gun:Number(iso.slice(8, 10)), bugun:iso === bugun, gelecek,
        noktalar:[{ modul:'ays', durum }] };
    });
  }

  function gunSeridiHtml(){
    const dateISO = U.todayISO();
    const day = S.days[dateISO];
    const bloklar = day ? day.blocks.filter(b => b.slot !== 'Dinlenme' && (b.targetMin || 0) > 0) : [];
    const kalan = day ? bloklar.filter(b => blokDurumu(b) !== 'bitti').length : null;
    const bitti = bloklar.length - (kalan || 0);
    const n = new Date();
    const tarih = n.toLocaleDateString('tr-TR', { weekday:'short' }) + ' '
      + n.toLocaleDateString('tr-TR', { day:'numeric', month:'short' });
    return K.gunSeridi({
      tarih,
      simdi:new Date(),
      seritler:bloklar.length ? [{ modul:'ays', ozet:bitti + '/' + bloklar.length + ' blok',
        bloklar:bloklar.map(b => ({ ad:(b.subject || b.slot) + ' · ' + b.targetMin + ' dk', dk:b.targetMin,
          durum:blokDurumu(b) })) }] : [],
      kalan,
      hafta:S.ui.haftaAcik ? haftaVerisi() : null,
      haftaAcik:!!S.ui.haftaAcik,
    });
  }

  /* ---------- sayfa başı ----------
     Yol («Plan › Hafta»), başlık, tek cümle ve ekranın eylemleri. Tek
     bölümlü çekmecede yol yazılmaz: «Onaylar › Bekleyen» bir şey söylemez. */
  function yolOf(route){
    const sec = bolumOf(route);
    const oge = ogeOf(route);
    const sc = R.Screens[route] || {};
    const ad = oge ? oge.label : sc.title;
    /* Çekmecenin adını taşıyan bölümde yol tek kattır («Bugün»). */
    const yol = sec.items.length > 1 && ad !== sec.label ? [sec.label, ad] : [sec.label];
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
    const sec = bolumOf(sc.id);
    const r = UST[sc.id] || sc.id;
    return K.bolumCubugu({ cekmece:sec.label, bolumler:sec.items.filter(v => !gizliMi(v.id)).map(v => ({
      route:v.id, ad:v.label, on:v.id === r, rozet:safe(() => badgeFor(v.id), null) || null })) });
  }

  function menuHtml(sc){
    const aktif = UST[sc.id] || sc.id;
    const onay = onaySayisi();
    return K.menuSayfasi({
      cekmeceler:navGorunen().map(g => ({ id:g.id, ad:g.label, sayac:g.id === 'onaylar' ? onay : 0,
        bolumler:g.items.map(v => ({ route:v.id, ad:v.label, on:v.id === aktif })) })),
      ayak:storeHealthHtml(),
    });
  }

  function altBantHtml(sc){
    const aktif = bolumOf(sc.id).id;
    const g = navGorunen();
    const sekmeler = BANT.map(id => g.find(x => x.id === id)).filter(Boolean)
      .map(x => ({ id:x.id, ad:x.label, route:x.items[0].id, on:x.id === aktif }));
    sekmeler.push({ id:'menu', ad:'Menü', act:'toggle-sidebar', on:false });
    return K.altBant({ sekmeler });
  }

  /* Hızlı ekle (166): AYS'nin en sık üç kaydı; ekrana gidip o ekranın
     kendi işleyicisini çağırır (`next-action`). */
  const HIZLI = [
    { ad:'Deneme ekle', act:'next-action', data:{ 'data-route':'exams', 'data-next':'new-exam' } },
    { ad:'Tekrar kartı ekle', act:'next-action', data:{ 'data-route':'cards', 'data-next':'new-card' } },
    { ad:'Ders notu ekle', act:'next-action', data:{ 'data-route':'learn', 'data-next':'note-new' } },
  ];

  /* Seviye rozeti — bu sistemin KENDİ kademesi (core/xp.js). Üst
     çubuktaki rütbe çipi onu gösterir; rozetin kendisi Rütbe ekranında
     ve Menü'nün ayağında durmaz — tek yerde görünür. */

  /* Sayfa sonu: künye yer imi. Derleme damgası ve mahremiyet cümlesi. */
  function footerHtml(){
    return html`
      <footer class="sayfasonu">
        <div class="wrapc sayfasonu__ic">
          <p>Veriler bu cihazda tutulur. Ad ve şehir hiçbir modele gönderilmez.</p>
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
    const ad = (p.name || '').trim();
    return String(html`
      <div class="katman appear" id="appearance" role="dialog" aria-label="Profil ve görünüm">
        <div class="appear__profil">
          <span class="ust__profil" aria-hidden="true">${(ad || 'Ben').charAt(0).toLocaleUpperCase('tr-TR')}</span>
          <span class="minw0"><b>${ad || 'Profil'}</b><small>${brandLine()}</small></span>
          ${R.C.Button({ label:'Profil', size:'sm', tone:'ghost', act:'go', data:{ 'data-route':'profiles' } })}
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

  function safe(fn, fallback){
    try{ return fn(); }
    catch(e){ console.error(e); return fallback || ''; }
  }

  /* Onay düğmesi sonucu söyler (022): «Evet, devam et» değil, kaç haftanın
     yeniden dizileceği. Sayı bilinmiyorsa eylemin adı. */
  function replanEtiketi(h){
    const n = h && h.weeksLeft;
    return n > 0 ? 'Kalan ' + n + ' haftayı yeniden diz' : 'Planı yeniden hesapla';
  }

  /* Ekranın kendi hatası: sakin hata (011). Menü ve öteki ekranlar çalışır. */
  function errorPanel(err){
    const msg = (err && err.message) ? err.message : String(err);
    return String(R.C.SakinHata({ ayrinti:msg,
      not:'Öteki ekranlar menüden açılmaya devam eder.' }));
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

      /* v4 iskeleti (ekip/EKIP-PLANI.md §3): üst çubuk · gün şeridi ·
         sayfa başı · bölüm çubuğu · ekran · sayfa sonu; telefonda alt bant
         ve hızlı ekle. Parçalardan biri çizilemezse yalnız o parça düşer. */
      document.getElementById('app').innerHTML = String(html`
        <a class="skiplink" href="#main">İçeriğe atla</a>
        <div class="site site--v4">
          ${raw(safe(() => ustCubukHtml(sc)))}
          ${raw(safe(gunSeridiHtml))}
          <div class="site__body">
            <div class="wrapc sayfa">
              ${raw(safe(() => sayfaBasiHtml(sc)))}
              ${raw(safe(() => bolumCubuguHtml(sc)))}
              <main class="content" id="main" tabindex="-1" aria-label="${sc.title}">${raw(body)}</main>
            </div>
          </div>
          ${safe(footerHtml)}
          ${raw(safe(() => altBantHtml(sc)))}
        </div>
        ${when(S.sidebarOpen, () => raw(safe(() => menuHtml(sc))))}`);

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
        ${R.C.SakinHata({ baslik:'Ekran çizilemedi.', dugme:'Yeniden yükle',
          ayrinti:err && err.message ? err.message : String(err) })}
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

    /* Acik alt sayfa da kapanir.

       Eskiden kapanmiyordu: bir ekranda sheet acip gezinince o sheet'in
       govdesi DOM'da kaliyor ve YENI ekranin uzerinde duruyordu. Kullanici
       icin sonuc: tikladiginda hicbir sey olmayan bir dugme. (ESP'de duman
       testi bunu "olu dugme" olarak yakaladi.) */
    if(UI.isSheetOpen && UI.isSheetOpen()) UI.closeSheet();
    K.katmanKapat();
    /* Gizlenmis bolumun adresi (eski bir baglanti, palet gecmisi) Bugun'e
       doner: gizlenen bolum «acilmayan bos ekran» olarak gorunmemeli. */
    if(gizliMi(route)) route = 'today';
    S.route = route;
    rotaDegisti = true;
    S.sidebarOpen = false;
    /* Açık deneme ayrıntısı gezinmede KAPANMAZ: Deneme'ye dönen kişi
       bıraktığı denemeyi görür. (Burada `examOpen = examOpen` diye hiçbir şey
       yapmayan bir satır vardı; niyeti bu davranıştı — HATALAR D-10.) */
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
    /* Paletler ve beş düzen kalktı (kullanıcı kararı §8-4, 2026-09-24):
       eski profilde kalan `palette`/`design` değeri okunmaz; kökte
       kalmış nitelik de silinir. */
    root.removeAttribute('data-palette');
    root.removeAttribute('data-design');
  }

  /* ---------- kuresel eylemler ---------- */
  const globalHandle = {
    async go(el){
      if(el.dataset.tab) S.ui.cardTab = el.dataset.tab;
      go(el.dataset.route);
    },
    async 'toggle-sidebar'(){ K.katmanKapat(); S.sidebarOpen = !S.sidebarOpen; render(); },
    /* Kabuğun açılır panelleri (LIFEOS.KABUK): ikinci basış kapatır. */
    async 'modul-menu'(el){
      if(K.katmanAcik('kabuk-modul')){ K.katmanKapat(); return; }
      K.katmanAc('kabuk-modul', K.modulMenusu({ modul:'ays' }), el);
    },
    async 'bildirim-ac'(el){
      if(K.katmanAcik('kabuk-bildirim')){ K.katmanKapat(); return; }
      K.katmanAc('kabuk-bildirim', K.bildirimPaneli({ gruplar:bildirimGruplari() }), el);
    },
    async 'hizli-ekle'(el){
      if(K.katmanAcik('kabuk-hizli')){ K.katmanKapat(); return; }
      K.katmanAc('kabuk-hizli', K.hizliEkle({ modul:'ays', satirlar:HIZLI }), el);
    },
    /* Gün şeridindeki tarih (05): yedi gün açılır ya da kapanır. */
    async 'hafta-ac'(){ S.ui.haftaAcik = !S.ui.haftaAcik; render(); },
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
    /* Sert yenileme: adrese bir kerelik damga eklenir, boylece tarayici
       sayfayi ve bagli dosyalari onbellekten degil sunucudan ister.
       `location.reload()` bunu garanti etmez. */
    async 'hard-reload'(){
      const u = new URL(location.href);
      u.searchParams.set('tazele', String(Date.now()));
      location.replace(u.toString());
    },
    async 'setup-open'(){ R.Setup.open(); },
    /* TANITIM ŞERİDİ — nokta basıldığında panel değişir.

       Sihirbaz YENİDEN ÇİZİLMEZ: `TANITIM_ADIM` doğrudan DOM'a
       dokunur. Yeniden çizmek, kullanıcının o ana kadar yazdığı
       alanları silmek olurdu — bir süsü değiştirmek için formu
       sıfırlamak. */
    'tanitim-adim'(el){ window.LIFEOS.TANITIM_ADIM(el); },
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
        }, false, replanEtiketi(h));
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
    if(!R.Basarim || !R.Perde || rozetPerdede) return;
    const r = R.Basarim.bekleyen();
    if(!r) return;
    rozetPerdede = true;
    const damgala = () => {
      rozetPerdede = false;
      return R.Basarim.gorundu(r.kod)
        .then(() => rozetKutla()).catch(() => {});
    };
    const sonuc = R.Perde.rozetKutla(r, { bitti:damgala });
    if(sonuc && sonuc.sessiz){
      UI.toast('Yeni rozet — ' + r.ad);
      damgala();
    }
  }

  function kutla(y){
    if(!y || !R.Perde || !R.XP) return;
    const damgala = () => R.XP.kutlandi()
      .then(() => R.XP.tazele()).catch(() => {});
    const sonuc = R.Perde.kutla(y, { bitti:damgala });
    if(sonuc && sonuc.sessiz){
      const ad = (y.kademeBilgi && y.kademeBilgi.ad) || ('Kademe ' + y.kademe);
      UI.toast('Yeni rütbe — ' + ad + ' ' + y.etiket);
      damgala();
    }
  }

  let xpBekleyen = null;
  function xpTara(){
    if(!R.XP) return;
    clearTimeout(xpBekleyen);
    xpBekleyen = setTimeout(async () => {
      try{
        /* YALNIZ BUGÜN DEĞİL, yazılabilir pencerenin tamamı. Dünkü
           antrenmanı bu sabah giren kişinin puanı hiç gelmiyordu:
           motor o güne yazmaya izin veriyordu ama kimse o günü
           eşitlemiyordu. Sekiz gün okunur, en çok BİR kez yazılır. */
        const r = await R.XP.esitleCok(
          R.XPSayim.gunler(R.XP.pencere()));
        /* ÇİZİM YOK, DÜĞÜM TAZELEME. Ekranda değişen tek şey rozet ve
           panel; bütün sayfayı çizmek, tıklanan öğeyi kullanıcının
           altından çekmek demekti (bkz. core/xp.js, tazele). */
        if(r && r.degisti) R.XP.tazele();

        /* ROZETLER AYNI TETİKTE ama AYRI DEFTERDE. Aynı yerden
           çağrılırlar çünkü ikisini de tetikleyen şey aynı: veri
           değişti. Ayrı defterde dururlar çünkü ölçtükleri şey ayrı —
           XP «hangi iş kaç puan», rozet «kaç saat, kaç gün, kaç görev».
           Biri ötekinin eşiğini değiştirmez. */
        if(R.Basarim){
          const b = await R.Basarim.esitleCok(
            R.BasarimSayim.gunler(R.XP.pencere()));
          if(b && b.yeni.length) rozetKutla();
        }
      }catch(e){ console.error('XP eşitlenemedi:', e); }
    }, 400);
  }

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
    /* Veri değişmiş olabilir: XP sayımını tazele (gecikmeli, sessiz). */
    xpTara();
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
    /* Veri değişmiş olabilir: XP sayımını tazele (gecikmeli, sessiz). */
    xpTara();
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
      if(K.katmanAcik()){ K.katmanKapat(); return; }
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

  /* Ipucu balonu disariya tiklayinca kapanir. Kabugun panelleri
     (gorunum, modul menusu, bildirimler, hizli ekle) bunu LIFEOS.KABUK
     katman yoneticisinde yapar: disari tiklama, Esc, boyut degisimi. */
  document.addEventListener('mousedown', e => {
    if(UI.isHintOpen()
      && !e.target.closest('#popover') && !e.target.closest('[data-act="hint"]')){
      UI.closeHint();
    }
  });

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
    R.Store.onExternalWrite = function(){
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
    return R.C.Button({ label:isLocal ? 'Kayıt sorunu' : 'Senkronizasyon sorunu', icon:'warn',
      size:'sm', tone:'danger', block:true, act:'show-store-error', data:{ id:'store-health' } });
  }

  /* ---------- telefona kurulum (PWA) ----------
     Manifest gömülü üretilir (tek dosya sürümüyle aynı yol). Sunucuyla
     (http/https) açılınca bir de çevrimdışı kabuk kaydedilir
     (brand/ortak/pwa.js + sw.js): ağ önce, ağ yoksa son kopya. `file://`
     ile açılan tek dosyada kabuk olmaz; uygulama orada da eksiksiz çalışır. */
  let installPrompt = null;

  function installManifest(){
    const el = document.getElementById('pwa-manifest');
    if(!el) return;
    const name = (S.profile && S.profile.name) ? 'Rota — ' + S.profile.name : 'Rota';
    /* Once "R" harfi ureten bir SVG'ydi; artik gercek marka gorseli
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
      name, short_name:'Rota', start_url:location.href,
      /* Göreli kapsam gömülü (data:) manifestte çözülemez ve yok sayılır. */
      scope:new URL('./', location.href).href,
      display:'standalone', background_color:'#F7F8FA', theme_color:'#3D3F8F',
      lang:'tr', description:'Kişisel YKS çalışma sistemi',
      icons:[{ src:icon, sizes:'192x192', type:'image/png', purpose:'any maskable' }],
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
      const stale = open.filter(d => U.diffDays(R.U.gunOf(d.at), today) >= 2);
      if(!urgent.length && !stale.length) return false;

      const body = urgent.length
        ? urgent[0].name + ': ' + urgent[0].text
        : 'Karar ' + U.diffDays(R.U.gunOf(stale[0].at), today) + ' gündür açık: ' + stale[0].title;

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

      /* YARIM KALMIŞ SÜRELİ OTURUM — diskten geri alınır.

         165 dakikalık TYT provası bir modül değişkeninde duruyordu ve
         sekme yenilenince bütün süreler ile işaretler gidiyordu. Süre
         duvar saatinden geldiği için geri yüklenen oturum doğru süreyi
         gösterir.

         KENDİ BAŞINA DÜŞER: bozuk bir kayıt uygulamayı açılışta
         kilitlemez, oturum yokmuş gibi devam eder. */
      try{ await R.ExamRun.restore(); }
      catch(e){ /* oturum geri alınamadı; sistem oturumsuz açılır */ }

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
        if(R.XP) await R.XP.yukle();
        if(R.Basarim) await R.Basarim.yukle();
      }catch(e){
        console.error('Seviye defteri yüklenemedi; seviye gösterilmeyecek.', e);
      }
      applyTheme();
      await render();

      // AI koc yetenegi acilisi bloklamaz; hazir olunca panelleri gostermek icin yeniden ciz.
      installManifest();
      /* Çevrimdışı kabuk: yalnız sunucuyla açılınca (brand/ortak/pwa.js). */
      if(window.LIFEOS && LIFEOS.Pwa) LIFEOS.Pwa.kaydet().catch(() => {});
      /* Tek dosya görselsiz açıldıysa bunu söyle (brand/ortak/gorsel.js). */
      if(window.LIFEOS && LIFEOS.Gorsel) LIFEOS.Gorsel.denetle('ays', m => UI.toast(m, { life:12000 }));
      /* Hedef ağı: etkin hedeflerin özeti HKM'ye, zaman bütçesi geri
         (brand/ortak/hedefag.js). HKM kapalıysa hiçbir şey olmaz. */
      if(R.Hedefler && R.Hedefler.ag){
        R.Hedefler.ag.gonder().then(r => { if(r && r.butce) render(); }).catch(() => {});
      }
      /* Otomatik yedek: HKM açıksa günde bir, doğrulanınca hatırlatma
         kapanır (brand/ortak/yedekag.js). HKM kapalıysa hiçbir şey olmaz. */
      if(window.LIFEOS && LIFEOS.YedekAg){
        LIFEOS.YedekAg.kur({ hkm:() => R.Beacon, modul:'ays',
          disaAktar:() => R.Store.exportAll(), kayit:() => M.dataFootprint().total,
          yas:() => M.backupAgeDays(), isaretle:() => M.markBackup(),
          bildir:m => UI.toast(m, { life:12000 }) }).baslat();
      }
      /* King'in teklifleri (brand/ortak/kingteklif.js): onay bekleyen ücretli
         işler Bugün'de. Modül King'e iş verince hemen, yoksa dakikada bir
         tazelenir; HKM kapalıysa liste boş kalır ve kart çizilmez. */
      if(window.LIFEOS && LIFEOS.KingTeklif){
        R.KingTeklif = LIFEOS.KingTeklif.kur({ hkm:() => R.Beacon, modul:'ays' });
        const kingTazele = () => R.KingTeklif.cek().then(l => {
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
        if(R.XP && R.Perde){
          R.XP.dinle(function(y){ kutla(y); });
          /* Açılış perdesi hâlâ oynuyorsa kutlama SIRAYA girer; iki tam
             ekran katman ve iki ses aynı anda olmaz (bkz. core/perde.js,
             AYNI ANDA TEK PERDE). */
          const bekleyen = R.XP.bekleyenKutlama();
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

      /* HKM işareti — AÇILIŞTA BİR KEZ, aralığı dolduysa. Bir ekranın
         açılması ağ trafiği doğurmaz; çizim döngüsünde hiçbir yerde
         çağrılmaz. Ateşle-ve-unut: söz beklenmez, hata yutulur, açılışı
         bloklamaz. İşaret kapalıysa (varsayılan) hiçbir şey olmaz. */
      if(R.Beacon) R.Beacon.ping();

      /* HKM'nin bekleyen teklifleri — acilista BIR KEZ, ateşle ve unut.
         Kuyruk okumak bir izin degildir: gelen sey Bugun ekraninda bir
         teklif satiri olur ve kullanici gormeden hicbir sey uygulanmaz.
         HKM kapaliysa kuyruk bos gelir ve hicbir sey degismez. */
      if(R.Beacon){
        R.Beacon.intents().then(liste => {
          if(liste && liste.length){ S.ui.hkmIntents = liste; render(); }
        }).catch(() => {});
        /* Uygulamasi yarida kalmis teklifler: kuyruktan bagimsiz, YEREL
           defterden gelir. HKM kapali olsa da gosterilir — cunku belirsiz
           kalan is bizim tarafimizdadir. */
        R.Beacon.intentDoubts().then(d => {
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
          R.Beacon.intents().then(liste => {
            if(liste && liste.length){ S.ui.hkmIntents = liste; render(); }
          }).catch(() => {});
        });
      }

      if(R.Setup.needed()) setTimeout(() => R.Setup.open(), 400);
    }catch(err){
      console.error('Açılış hatası:', err);
      document.getElementById('app').innerHTML = String(html`<div class="content">
        ${R.C.SakinHata({ baslik:'Uygulama açılamadı.', dugme:'Yeniden dene',
          ayrinti:err && err.message ? err.message : String(err) })}
      </div>`);
    }
  }

  return { boot, errorPanel, replanEtiketi, render, patch, go, applyTheme, NAV, yolOf, canInstall, promptInstall, installManifest,
    notifyState, askNotify, notifyFromOffice };
})();

/* Test paketi bu dosyayı da yükler (ekran sözleşmesini denetlemek için)
   ama açılışı tetiklememelidir: test sayfasında #app kabuğu yoktur. */
if(!window.__AYS_NO_BOOT__) R.App.boot();
