/* AYARLAR — bölüm bölüm tek ayar paneli (kullanıcı, 2026-10-29).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ayarlar.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Biçimi
   `ayarlar.css`, testi `ayarlar.test.js`.
   ==================================================================

   Kullanıcı: «sisteme ayarlar kısmı getirmemiz gerekiyor; sol tarafa bir
   ayarlar yap, ses, animasyon, hesap ayarları gibi her şeyin bölüm bölüm
   bir arada olduğu yer» — «UI ve tasarımın karışık olmaması, sade ve
   minimalist olması çok değerli».

   Panel, kenardaki «Ayarlar» düğmesinin açtığı yan sayfadır: solda bölümler,
   sağda o bölümün satırları. Her modülün eski «Görünüm» paneli (open-appearance)
   bunu çizer; modüle özgü olan (tema seçicisi, profil, modülün kendi ayar
   ekranları) çağıran verir. Denetimlerin kendisi sahibinde kalır: animasyon,
   zemin, minik, King ve ses seçicileri kendi dosyalarının HTML'idir ve kendi
   olaylarını dinler; burası yalnız onları bölümlere dizer.

   YAZI TİPİ burada: «sistemin yazılarının fontunu değiştirebilelim». Yalnız
   pakette olan yazılar (fonts.css: Inter, Manrope, Newsreader) ve cihazın
   kendi yazısı — hiçbir şey indirilmez. Tercih `lifeos.yazi`, modül geçişinde
   taşınır (animasyon.js TASINAN); <head>'de okunur, ilk çizim doğru yazıyla. */

window.LIFEOS = window.LIFEOS || {};

(function(){
  'use strict';

  const L = window.LIFEOS;

  /* ------------------------------------------------------------ yazı */
  const YAZI_ANAHTAR = 'lifeos.yazi';
  const YAZILAR = Object.freeze([
    { id:'inter',   ad:'Inter',     not:'varsayılan, sade' },
    { id:'manrope', ad:'Manrope',   not:'yuvarlak, yumuşak' },
    { id:'sistem',  ad:'Cihazın',   not:'işletim sisteminin yazısı' },
    { id:'kitap',   ad:'Newsreader', not:'kitap gibi, serif' },
    /* Ek aileler (kullanıcı, 2026-10-30: «çok daha güzel fontlar; kullanıcının
       gözüne birçok şey hitap edebilir»; OFL, src/fonts/ek/KUNYE.md). Gömülmez:
       yalnız seçilince ya da seçici açılınca yüklenir (yaziYukle). */
    { id:'fraunces',  ad:'Fraunces',   not:'sıcak serif, şık başlık', aile:'Fraunces',         dosya:'fraunces',         agirlik:'300 700' },
    { id:'nunito',    ad:'Nunito',     not:'yuvarlak, dost canlısı',  aile:'Nunito',           dosya:'nunito',           agirlik:'400 800' },
    { id:'grotesk',   ad:'Space Grotesk', not:'modern, teknik',       aile:'Space Grotesk',    dosya:'space-grotesk',    agirlik:'400 700' },
    { id:'dmsans',    ad:'DM Sans',    not:'temiz, geometrik',        aile:'DM Sans',          dosya:'dm-sans',          agirlik:'400 700' },
    { id:'playfair',  ad:'Playfair',   not:'zarif, dergi gibi',       aile:'Playfair Display', dosya:'playfair-display', agirlik:'400 800' },
    { id:'lora',      ad:'Lora',       not:'okunaklı kitap serifi',   aile:'Lora',             dosya:'lora',             agirlik:'400 700' },
    { id:'quicksand', ad:'Quicksand',  not:'yuvarlak, oyunsu',        aile:'Quicksand',        dosya:'quicksand',        agirlik:'400 700' },
    { id:'comfortaa', ad:'Comfortaa',  not:'yumuşak, tatlı',          aile:'Comfortaa',        dosya:'comfortaa',        agirlik:'400 700' },
  ]);
  const ARALIK = { latin:'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    'latin-ext':'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF' };
  const yuklenen = {};
  /* Dosya adresi ayarlar.js'in yerine göre (kaynak ve test sayfası); tek dosyada belgenin yanı (dist/fonts/ek). */
  function ekYol(dosya){
    const b = typeof document !== 'undefined' ? document.querySelector('script[src*="core/ayarlar.js"]') : null;
    return new URL(b ? '../../fonts/ek/' + dosya : 'fonts/ek/' + dosya, b ? b.src : document.baseURI).href;
  }
  function yaziYukle(id){
    const y = YAZILAR.find(x => x.id === id);
    if(!y || !y.dosya || yuklenen[id] || typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) return false;
    yuklenen[id] = true;
    Object.keys(ARALIK).forEach(alt => {
      try{
        const f = new FontFace(y.aile, 'url("' + ekYol(y.dosya + '-' + alt + '.woff2') + '") format("woff2")', { weight:y.agirlik, display:'swap', unicodeRange:ARALIK[alt] });
        f.load().then(ff => document.fonts.add(ff)).catch(() => { /* dosya yok: sistem yazısına düşer */ });
      }catch(e){ /* eski tarayıcı */ }
    });
    return true;
  }
  function yazi(){
    let v = null;
    try{ v = localStorage.getItem(YAZI_ANAHTAR); }catch(e){}
    return YAZILAR.some(y => y.id === v) ? v : 'inter';
  }
  function yaziUygula(k){
    if(typeof document === 'undefined') return;
    const kok = document.documentElement;
    if(k === 'inter') kok.removeAttribute('data-yazi'); else kok.setAttribute('data-yazi', k);
    yaziYukle(k);
  }
  function yaziAyarla(k){
    if(!YAZILAR.some(y => y.id === k)) return false;
    try{ if(k === 'inter') localStorage.removeItem(YAZI_ANAHTAR); else localStorage.setItem(YAZI_ANAHTAR, k); }catch(e){ /* depo kapalı: bu sayfada geçerli */ }
    yaziUygula(k);
    return true;
  }
  yaziUygula(yazi());

  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  function yaziSeciciHtml(){
    const s = yazi();
    YAZILAR.forEach(y => yaziYukle(y.id));   // örnek «Aa»lar kendi yazısıyla görünsün
    return '<div class="ayarlar__yazilar" role="radiogroup" aria-label="Yazı tipi">' + YAZILAR.map(y =>
      '<button type="button" class="ayarlar__yazi' + (y.id === s ? ' is-on' : '') + '" role="radio" aria-checked="' + (y.id === s) + '"'
      + ' data-yazi-sec="' + y.id + '" data-yazi-ornek="' + y.id + '">'
      + '<b>Aa</b><span>' + kac(y.ad) + '</span><small>' + kac(y.not) + '</small></button>').join('') + '</div>';
  }

  /* ---------------------------------------------------------- bölümler */
  /* GRUPLAR (kullanıcı, 2026-10-29: «sistem direkt olmayacak; Sistem altında ses,
     animasyon, plan; sonra Hesap: güvenlik, bağlantılar, Google»; «görünüm ve
     minik ve King'i de Sistem'in içine koy; seçenekleri arttır; arka plan
     fotoğrafını değiştirebilmeyi göremedim»). Grup adı başlıktır, sekme değil. */
  /* KAPSAM (kullanıcı, 2026-10-30: «hangi ayar sadece AYS'de, hangisi bütün
     sistemde belli değil; sol tarafa sistem ayarları ve modül ayarları diye
     ayırın; karmaşık yapma, sadeleştir»). Sistem ayarları PC'de tek kopya
     (sistem/ayar.py) ve her modülde, giriş sayfasında aynıdır; «Bu modül»
     yalnız açık modülü değiştirir. Her bölümün başında kapsamı tek satır. */
  const BOLUMLER = Object.freeze([
    { id:'profil',   ad:'Profiller',        grup:'Sistem' },
    { id:'gorunum',  ad:'Görünüm',          grup:'Sistem' },
    { id:'zemin',    ad:'Arka plan',        grup:'Sistem' },
    { id:'ses',      ad:'Ses ve müzik',     grup:'Sistem' },
    { id:'hareket',  ad:'Animasyon',        grup:'Sistem' },
    { id:'erisim',   ad:'Erişilebilirlik',  grup:'Sistem' },
    { id:'king',     ad:'King',             grup:'Sistem' },
    { id:'ekip',     ad:'Minikler',         grup:'Sistem' },
    { id:'bildirim', ad:'Bildirimler',      grup:'Sistem' },
    { id:'sistem',   ad:'Planlama',         grup:'Sistem' },
    { id:'modul',    ad:'Modül ayarları',   grup:'Bu modül' },
    { id:'hesap',    ad:'Güvenlik',         grup:'Hesap' },
    { id:'baglanti', ad:'Bağlantılar',      grup:'Hesap' },
  ]);
  const MODUL_AD = Object.freeze({ ays:'AYS', spi:'SPİ', esp:'ESP' });
  /* ALANLAR (kullanıcı, 2026-10-30: «sistem ile yalnız o modül arasındaki ayrımı
     daha güzel yap; ayarları daha minimalist, anlaşılır yap»). Üstte üç alan;
     solda yalnız seçili alanın bölümleri. Modül alanı modülün renginde. */
  const ALANLAR = Object.freeze(['Sistem', 'Bu modül', 'Hesap']);
  const alanOf = id => (BOLUMLER.find(b => b.id === id) || {}).grup || 'Sistem';
  function alanlarHtml(){
    const m = MODUL_AD[modulAdi()] || 'Bu modül', simdi = alanOf(secili);
    const bilgi = { 'Sistem':['Sistem', 'her yerde'], 'Bu modül':[m, 'yalnız burada'], 'Hesap':['Hesap', 'hesabın'] };
    return '<div class="ayarlar__alanlar" role="group" aria-label="Ayar alanı">' + ALANLAR.map(a => '<button type="button" class="ayarlar__alan ayarlar__alan--'
      + (a === 'Bu modül' ? 'modul' : a === 'Hesap' ? 'hesap' : 'sistem') + (a === simdi ? ' is-on' : '') + '" aria-pressed="' + (a === simdi) + '" data-ayar-alan="' + kac(a) + '">'
      + SIMGE_KAPSAM[a === 'Bu modül' ? 'modul' : a === 'Hesap' ? 'hesap' : 'sistem'] + '<b>' + kac(bilgi[a][0]) + '</b><small>' + bilgi[a][1] + '</small></button>').join('') + '</div>';
  }
  const SIMGE_KAPSAM = {
    sistem:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    modul:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 9h16"/></svg>',
    hesap:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
  };
  /* Bölümün başı (2026-10-31: «daha kaliteli»): büyük başlık ve altında kapsam rozeti. */
  function kapsamHtml(grup, ad){
    const m = MODUL_AD[modulAdi()] || 'Bu modül';
    const [tur, yazi] = grup === 'Sistem' ? ['sistem', 'Bütün sistemde geçerli: AYS, SPİ, ESP ve giriş sayfası']
      : grup === 'Bu modül' ? ['modul', 'Yalnız ' + m + '’de geçerli; öbür modüller değişmez']
      : ['hesap', 'Hesabın: bu bilgisayardaki LifeOS sunucusunda'];
    return '<header class="ayarlar__bolum-bas">' + (ad ? '<h3>' + kac(ad) + '</h3>' : '')
      + '<p class="ayarlar__kapsam ayarlar__kapsam--' + tur + '">' + SIMGE_KAPSAM[tur] + '<span>' + yazi + '</span></p></header>';
  }

  /* SEÇİMLER: tek anahtarlı, kökte niteliği olan tercihler (biçimi cam.css §45).
     Nitelik hep yazılır (varsayılan da): CSS özgüllüğü buna dayanır. */
  const SECIMLER = Object.freeze({
    cam:     { anahtar:'lifeos.cam',           kok:'data-cam',      vars:'orta',  sira:['az', 'orta', 'cok'],  ad:{ az:'Dolu', orta:'Orta', cok:'Saydam' } },
    kontrast:{ anahtar:'lifeos.kontrast',      kok:'data-kontrast', vars:'normal', sira:['normal', 'yuksek'], ad:{ normal:'Normal', yuksek:'Yüksek' } },
    perde:   { anahtar:'lifeos.perde',         kok:'data-perde',    vars:'orta',  sira:['yok', 'az', 'orta', 'cok'],  ad:{ yok:'Yok', az:'Az', orta:'Orta', cok:'Çok' } },
    /* «Hiç» (kullanıcı, 2026-10-30: «az var ama hiç seçeneği yok; arka planda öyle bir şey olmasın»):
       fotoğraf da kartların arkası da bulanmaz (cam.css §51). «Net» yalnız fotoğrafı bulandırmaz. */
    bulanik: { anahtar:'lifeos.zemin.bulanik', kok:'data-bulanik',  vars:'yok',   sira:['yok', 'hafif', 'cok'], ad:{ yok:'Yok', hafif:'Hafif', cok:'Yumuşak' } },
    /* KATMAN KATMAN BULANIKLIK (kullanıcı, 2026-10-30: «bulanıklık ayrı ayrı olsun:
       ayarların, sistem kartlarının, duvar kâğıdının, menünün bulanıklığını aç ya
       da kapat»). Kapalı katman buzlu cam yerine dolu ve okunur (cam.css §51). */
    buzluKart:{ anahtar:'lifeos.buzlu.kart',   kok:'data-buzlu-kart',    vars:'acik', sira:['acik', 'kapali'], ad:{ acik:'Buzlu', kapali:'Dolu' } },
    buzluMenu:{ anahtar:'lifeos.buzlu.menu',   kok:'data-buzlu-menu',    vars:'acik', sira:['acik', 'kapali'], ad:{ acik:'Buzlu', kapali:'Dolu' } },
    buzluPencere:{ anahtar:'lifeos.buzlu.pencere', kok:'data-buzlu-pencere', vars:'acik', sira:['acik', 'kapali'], ad:{ acik:'Buzlu', kapali:'Dolu' } },
    /* Vurgu rengi (2026-10-30, yeni): seçili düğme, sekme ve anahtarın rengi; ölçü renkleri değişmez (§1.10). */
    vurgu:   { anahtar:'lifeos.vurgu',         kok:'data-vurgu',    vars:'modul', sira:['modul', 'mavi', 'yesil', 'mor', 'turuncu', 'pembe', 'grafit'],
      ad:{ modul:'Modülün', mavi:'Mavi', yesil:'Yeşil', mor:'Mor', turuncu:'Turuncu', pembe:'Pembe', grafit:'Grafit' } },
    /* Yazı boyutu (2026-10-30, yeni): bütün arayüz birlikte büyür ya da küçülür (ayarlar.css «boyut»). */
    boyut:   { anahtar:'lifeos.boyut',         kok:'data-boyut',    vars:'normal', sira:['kucuk', 'normal', 'buyuk', 'enbuyuk'], ad:{ kucuk:'Küçük', normal:'Normal', buyuk:'Büyük', enbuyuk:'En büyük' } },
    rozet:   { anahtar:'lifeos.rozet',         kok:'data-rozet',    vars:'acik',  sira:['acik', 'kapali'],     ad:{ acik:'Göster', kapali:'Gizle' } },
    /* ERİŞİLEBİLİRLİK ve ORTAM (2026-10-31, kullanıcı: «ayarların özelliklerini çok arttır»). */
    odak:    { anahtar:'lifeos.odak',          kok:'data-odak',     vars:'normal', sira:['normal', 'belirgin'], ad:{ normal:'Normal', belirgin:'Belirgin' } },
    altcizgi:{ anahtar:'lifeos.altcizgi',      kok:'data-altcizgi', vars:'hayir', sira:['hayir', 'evet'],      ad:{ hayir:'Hayır', evet:'Evet' } },
    satir:   { anahtar:'lifeos.satir',         kok:'data-satir',    vars:'normal', sira:['normal', 'genis'],   ad:{ normal:'Normal', genis:'Geniş' } },
    isik:    { anahtar:'lifeos.isik',          kok:'data-isik',     vars:'acik',  sira:['acik', 'kapali'],     ad:{ acik:'Açık', kapali:'Kapalı' } },
    /* 2026-10-30 (kullanıcı: «sol taraftaki menüyü de camsı yapabilelim ayarlarda»). */
    kenar:   { anahtar:'lifeos.kenar.yuzey',   kok:'data-kenar',    vars:'buzlu', sira:['buzlu', 'cam'],       ad:{ buzlu:'Buzlu', cam:'Cam' } },
  });
  function secim(k){
    const x = SECIMLER[k];
    let v = null;
    try{ v = localStorage.getItem(x.anahtar); }catch(e){}
    return x.sira.indexOf(v) >= 0 ? v : x.vars;
  }
  function secimUygula(k){ if(typeof document !== 'undefined') document.documentElement.setAttribute(SECIMLER[k].kok, secim(k)); }
  function secimAyarla(k, v){
    const x = SECIMLER[k];
    if(!x || x.sira.indexOf(v) < 0) return false;
    try{ if(v === x.vars) localStorage.removeItem(x.anahtar); else localStorage.setItem(x.anahtar, v); }catch(e){ /* depo kapalı: bu sayfada geçerli */ }
    secimUygula(k);
    if(typeof document !== 'undefined') document.querySelectorAll('[data-secim^="' + k + ':"]').forEach(b => {
      const on = b.getAttribute('data-secim') === k + ':' + v;
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    return true;
  }
  const secimHtml = (k, ad) => '<div class="seg seg--block" role="group" aria-label="' + kac(ad) + '">' + SECIMLER[k].sira.map(v => {
    const on = v === secim(k);
    return '<button type="button" class="' + (on ? 'is-on' : '') + '" data-secim="' + k + ':' + v + '" aria-pressed="' + on + '">' + SECIMLER[k].ad[v] + '</button>';
  }).join('') + '</div>';
  const VURGU_RENK = Object.freeze({ modul:'var(--mod, var(--primary))', mavi:'#2f6bff', yesil:'#1f9d6b', mor:'#7a5af5', turuncu:'#e2761f', pembe:'#e2558f', grafit:'#4a4f5a' });
  const vurguHtml = () => '<div class="vurgu" role="group" aria-label="Vurgu rengi">' + SECIMLER.vurgu.sira.map(v => {
    const on = v === secim('vurgu');
    return '<button type="button" class="vurgu__renk' + (on ? ' is-on' : '') + '" data-secim="vurgu:' + v + '" aria-pressed="' + on + '" title="' + SECIMLER.vurgu.ad[v] + '"'
      + ' aria-label="' + SECIMLER.vurgu.ad[v] + '" style="--v:' + VURGU_RENK[v] + '"></button>'; }).join('') + '</div>';
  /* Göç (bir kez): eski «Hiç» bulanıklık = hiçbir katman bulanmaz. */
  try{ if(localStorage.getItem('lifeos.zemin.bulanik') === 'hic'){ localStorage.removeItem('lifeos.zemin.bulanik');
    ['lifeos.buzlu.kart', 'lifeos.buzlu.menu', 'lifeos.buzlu.pencere'].forEach(k => localStorage.setItem(k, 'kapali')); } }catch(e){ /* depo kapalı */ }
  Object.keys(SECIMLER).forEach(secimUygula);
  /* Aç/kapa anahtarı (iki değerli seçim için; Ses'teki anahtarla aynı biçim). */
  const anahtarHtml = (k, ad) => { const on = secim(k) === SECIMLER[k].vars;
    return '<button type="button" class="plan__anahtar' + (on ? ' is-on' : '') + '" role="switch" aria-checked="' + on + '" aria-label="' + kac(ad) + '" data-anahtar="' + k + '"><i aria-hidden="true"></i></button>'; };
  /* Tema paketleri kalktı (kullanıcı, 2026-10-30: «o kısımları kaldır; kastım ayar
     profilleri»): eski seçim depoda kalmasın. */
  try{ localStorage.removeItem('lifeos.tema.paket'); if(typeof document !== 'undefined') document.documentElement.removeAttribute('data-paket'); }catch(e){ /* depo kapalı */ }

  /* AYAR PROFİLLERİ (kullanıcı, 2026-10-30: «bir profil olsun, adını koyabileyim;
     ona geçtiğimde tüm ayarlarım o profildekine dönsün»). Profil = görünüş,
     arka plan seçimi, ses, animasyon, minik ve King tercihleri ve tema.
     Veri, hesap, kilitler ve King'in hafızası girmez. Arka plan dosyası yuvada
     tektir: profil «Kendi»yi tutar, dosyanın kendisini değil.
     Modüller ayrı kökende: liste ve etkin profil taşınır (animasyon.js
     TASINAN). Öbür modül açılınca etkin profilin damgası orada görülmemişse
     profil oraya da uygulanır ve sayfa bir kez yenilenir. */
  /* Yenilemeden önce ortak ayarı sunucuya yaz (animasyon.js ortakYenile). */
  function yenileKaydet(){ if(L.ANIMASYON && L.ANIMASYON.ortakYenile) L.ANIMASYON.ortakYenile(); else try{ location.reload(); }catch(e){ /* yok */ } }
  const PROFIL_ANAHTAR = 'lifeos.profiller', ETKIN_ANAHTAR = 'lifeos.profil.etkin', GORDU_ANAHTAR = 'lifeos.profil.gordu', TEMA_BEKLE = 'lifeos.profil.tema';
  const PROFIL_EN = 8;
  const PROFIL_KAPSAR = Object.freeze(['lifeos.tema.secim', 'lifeos.boyut', 'lifeos.vurgu', 'lifeos.odak', 'lifeos.altcizgi', 'lifeos.satir', 'lifeos.isik', 'lifeos.buzlu.kart', 'lifeos.buzlu.menu', 'lifeos.buzlu.pencere', 'lifeos.yazi', 'lifeos.cam', 'lifeos.kontrast', 'lifeos.perde', 'lifeos.zemin.bulanik', 'lifeos.rozet', 'lifeos.kenar.yuzey',
    'lifeos.zemin', 'lifeos.manzara', 'lifeos.manzara.gece', 'lifeos.tema.oto', 'lifeos.zemin.video', 'lifeos.zemin.onizle.sade',
    'lifeos.yuzey.ays', 'lifeos.yuzey.spi', 'lifeos.yuzey.esp',
    'lifeos.hareket', 'lifeos.hareket.hiz', 'lifeos.ses', 'lifeos.ses.duzey', 'lifeos.sessiz',
    'lifeos.minik', 'lifeos.minik.boy', 'lifeos.minik.takim', 'lifeos.minik.kapali',
    'lifeos.king.ad', 'lifeos.king.gorunus', 'lifeos.king.ses', 'lifeos.king.hiz', 'lifeos.king.tarz']);
  const depoAl = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
  const depoKoy = (k, v) => { try{ if(v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){ /* depo kapalı */ } };
  function profiller(){
    let l = null;
    try{ l = JSON.parse(depoAl(PROFIL_ANAHTAR) || '[]'); }catch(e){ l = []; }
    return (Array.isArray(l) ? l : []).filter(p => p && typeof p.ad === 'string' && p.ayar && typeof p.ayar === 'object').slice(0, PROFIL_EN);
  }
  function etkinProfil(){ try{ const e = JSON.parse(depoAl(ETKIN_ANAHTAR) || 'null'); return e && typeof e.ad === 'string' ? e : null; }catch(x){ return null; } }
  const adTemiz = ad => String(ad || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
  const ayni = (a, b) => a.toLocaleLowerCase('tr-TR') === b.toLocaleLowerCase('tr-TR');
  function anlik(){ const o = {}; PROFIL_KAPSAR.forEach(k => { const v = depoAl(k); if(v != null) o[k] = v; }); return o; }
  function temaSimdi(){
    if(typeof document === 'undefined') return null;
    const b = document.querySelector('.ayarlar [data-act="set-theme"][aria-pressed="true"]');
    return b ? b.getAttribute('data-theme') : null;
  }
  /* Döner: { ok, mesaj }. Aynı adda profil varsa üstüne yazılır (Güncelle). */
  function profilKaydet(ad, tema){
    ad = adTemiz(ad);
    if(!ad) return { ok:false, mesaj:'Profile bir ad ver.' };
    const l = profiller(), i = l.findIndex(p => ayni(p.ad, ad));
    if(i < 0 && l.length >= PROFIL_EN) return { ok:false, mesaj:'En çok ' + PROFIL_EN + ' profil; birini sil.' };
    const p = { ad:i >= 0 ? l[i].ad : ad, ayar:anlik(), tema:tema === undefined ? temaSimdi() : tema, zaman:Date.now() };
    if(i >= 0) l[i] = p; else l.push(p);
    depoKoy(PROFIL_ANAHTAR, JSON.stringify(l));
    const damga = String(Date.now());
    depoKoy(ETKIN_ANAHTAR, JSON.stringify({ ad:p.ad, damga }));
    depoKoy(GORDU_ANAHTAR, damga);
    return { ok:true, mesaj:i >= 0 ? '«' + p.ad + '» güncellendi.' : '«' + p.ad + '» kaydedildi.' };
  }
  /* Profilin ayarlarını depoya yazar (profilde olmayan anahtar varsayılana döner). */
  /* Döner: depoda değişen anahtar sayısı (profil zaten uygulanmışsa 0: sayfa boşuna yenilenmez). */
  function profilYaz(p){
    let n = 0;
    PROFIL_KAPSAR.forEach(k => { const v = Object.prototype.hasOwnProperty.call(p.ayar, k) ? String(p.ayar[k]) : null;
      if(depoAl(k) !== v){ depoKoy(k, v); n++; } });
    /* Profilin teması ortak tema seçimi olur (öbür modüller de geçer); modül kendi eylemiyle uygular. */
    if(p.tema){ if(depoAl('lifeos.tema.secim') !== p.tema){ depoKoy('lifeos.tema.secim', p.tema); n++; } depoKoy(TEMA_BEKLE, p.tema); }
    return n;
  }
  function profilUygula(ad, yenile){
    const p = profiller().find(x => ayni(x.ad, String(ad || '')));
    if(!p) return false;
    profilYaz(p);
    const damga = String(Date.now());
    depoKoy(ETKIN_ANAHTAR, JSON.stringify({ ad:p.ad, damga }));
    depoKoy(GORDU_ANAHTAR, damga);
    if(yenile !== false) yenileKaydet();
    return true;
  }
  function profilSil(ad){
    const l = profiller(), k = l.filter(p => !ayni(p.ad, String(ad || '')));
    if(k.length === l.length) return false;
    depoKoy(PROFIL_ANAHTAR, k.length ? JSON.stringify(k) : null);
    const e = etkinProfil();
    if(e && ayni(e.ad, ad)) depoKoy(ETKIN_ANAHTAR, null);
    return true;
  }
  /* Açılışta: başka modülde seçilen profil burada görülmediyse uygulanır (bir kez). */
  function profilEsitle(){
    const e = etkinProfil();
    if(!e || !e.damga || depoAl(GORDU_ANAHTAR) === String(e.damga)) return false;
    depoKoy(GORDU_ANAHTAR, String(e.damga));
    const p = profiller().find(x => ayni(x.ad, e.ad));
    if(!p) return false;
    return profilYaz(p) > 0;
  }
  /* TEMA SİSTEM AYARIDIR (2026-10-30): seçim `lifeos.tema.secim`'de (ortak
     kopya); modül kendi kaydında tutar, bu yüzden açılışta farklıysa modülün
     kendi «set-theme» eylemiyle eşitlenir. Saate göre tema açıkken dokunulmaz. */
  const TEMA_SECIM = 'lifeos.tema.secim';
  const TEMALAR = ['system', 'light', 'dark'];
  function temaBekleyen(){
    if(typeof document === 'undefined' || !document.body) return false;
    let t = depoAl(TEMA_BEKLE);
    depoKoy(TEMA_BEKLE, null);
    if(!t){
      t = depoAl(TEMA_SECIM);
      if(depoAl('lifeos.tema.oto') === 'acik') return false;
      if(!t || (document.documentElement.getAttribute('data-theme') || 'system') === t) return false;
    }
    if(TEMALAR.indexOf(t) < 0) return false;
    const b = document.createElement('button');
    b.type = 'button'; b.hidden = true;
    b.setAttribute('data-act', 'set-theme'); b.setAttribute('data-theme', t); b.setAttribute('data-value', t);
    document.body.appendChild(b);
    b.click();
    setTimeout(() => b.remove(), 0);
    return true;
  }
  if(typeof document !== 'undefined' && typeof location !== 'undefined' && !/\/tests\//.test(String(location.pathname || ''))){
    if(profilEsitle()) yenileKaydet();
    else{
      const bekle = () => setTimeout(temaBekleyen, 1200);   // modül ilk çizimini bitirsin
      if(document.readyState === 'complete') bekle(); else window.addEventListener('load', bekle, { once:true });
    }
  }
  let profilMesaj = '';
  const SIMGE_PROFIL = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="18" cy="18" r="2.5"/></svg>';
  function profilHtml(){
    const l = profiller(), e = etkinProfil();
    const satir = p => {
      const on = !!(e && ayni(e.ad, p.ad)), n = Object.keys(p.ayar).length;
      return '<li class="profil' + (on ? ' is-on' : '') + '"><span class="profil__harf" aria-hidden="true">' + kac(p.ad.charAt(0).toLocaleUpperCase('tr-TR')) + '</span>'
        + '<span class="profil__bilgi"><b>' + kac(p.ad) + '</b><small>' + (on ? 'Şu an bu profil · ' : '') + n + ' ayar' + (p.tema ? ' · tema ' + ({ light:'açık', dark:'koyu', system:'sistem' }[p.tema] || p.tema) : '') + '</small></span>'
        + (on ? '<button type="button" class="btn btn--sm btn--ghost" data-profil-guncelle="' + kac(p.ad) + '">Güncelle</button>'
              : '<button type="button" class="btn btn--sm" data-profil-gec="' + kac(p.ad) + '">Geç</button>')
        + '<button type="button" class="profil__sil" data-profil-sil="' + kac(p.ad) + '" aria-label="' + kac(p.ad) + ' profilini sil">Sil</button></li>';
    };
    return '<div class="profiller" data-profil-kok>'
      + '<section class="skart"><header class="skart__bas"><span class="skart__simge">' + SIMGE_PROFIL + '</span><span class="skart__baslik"><b>Ayar profilleri</b>'
      + '<small>Görünüş, arka plan, ses, animasyon, minikler, King ve tema birlikte saklanır; geçince hepsi o profile döner. Verin değişmez.</small></span></header>'
      + '<div class="skart__govde">'
      + (l.length ? '<ul class="profil__liste">' + l.map(satir).join('') + '</ul>' : '<div class="skart__bos">' + SIMGE_PROFIL + '<b>Henüz profil yok</b><small>Ayarları istediğin gibi yap, sonra buradan bir adla kaydet.</small></div>')
      + '<form class="profil__yeni" data-profil-form><input class="ayarlar__girdi" type="text" maxlength="24" data-profil-ad placeholder="Profil adı, örneğin Türklük" aria-label="Yeni profilin adı">'
      + '<button type="submit" class="btn btn--sm">Şu anki ayarları kaydet</button></form>'
      + '<p class="skart__durum" role="status">' + kac(profilMesaj) + '</p>'
      + '<p class="skart__not">Arka plan dosyası profilde saklanmaz: profil «Kendi» seçimini tutar, o yuvadaki fotoğraf ya da video kullanılır.</p>'
      + '</div></section></div>';
  }
  function profilYenile(){ if(typeof document !== 'undefined') document.querySelectorAll('[data-profil-kok]').forEach(el => { el.outerHTML = profilHtml(); }); }

  /* «Görünümü varsayılana döndür»: yalnız görünüş tercihleri; veri değil. İki adım. */
  const SIFIRLANAN = Object.freeze(['lifeos.yazi', 'lifeos.cam', 'lifeos.kontrast', 'lifeos.perde', 'lifeos.zemin.bulanik',
    'lifeos.zemin', 'lifeos.manzara', 'lifeos.manzara.gece', 'lifeos.tema.oto', 'lifeos.rozet', 'lifeos.boyut', 'lifeos.vurgu', 'lifeos.kenar.yuzey', 'lifeos.buzlu.kart', 'lifeos.buzlu.menu', 'lifeos.buzlu.pencere',
    'lifeos.odak', 'lifeos.altcizgi', 'lifeos.satir', 'lifeos.isik']);

  /* Arka plan önizlemesi zemin.js'te: seçim ve yüklemede kendini yeniler. */
  const onizleHtml = yuva => L.ZEMIN && L.ZEMIN.onizleHtml ? L.ZEMIN.onizleHtml(yuva) : '';
  let secili = 'gorunum';

  const H = (ad, not, denetim) => '<div class="ayarlar__satir"><div class="ayarlar__ad">' + kac(ad)
    + (not ? '<small>' + kac(not) + '</small>' : '') + '</div><div class="ayarlar__deger">' + (denetim || '') + '</div></div>';
  /* Geniş denetim (kaydırıcılar, katmanlı seçiciler): ad üstte, denetim altta tam genişlik. */
  const G = (ad, not, denetim) => H(ad, not, denetim).replace('ayarlar__satir"', 'ayarlar__satir ayarlar__satir--genis"');
  const hesapVar = () => { try{ const d = L.HESAP && L.HESAP.dugme ? L.HESAP.dugme() : null; return !!(d && !d.gizli); }catch(e){ return false; } };
  /* Hesap merkezinin sayfaları (hesap.js SAYFA_AD): tek tıkla oraya açılır. */
  const HESAP_SAYFALARI = Object.freeze([
    ['guvenlik', 'Güvenlik kontrolü', 'İki adım, kurtarma sorusu, cihazlar ve yedek tek bakışta'],
    ['ikiadim', 'İki adımlı doğrulama', 'Girişte telefondaki kodu da sorar; yedek kodlar'],
    ['cihazlar', 'Oturum açık cihazlar', 'Hangi cihazlar bağlı; birinden ya da hepsinden çık'],
    ['etkinlik', 'Son etkinlik', 'Girişler ve yanlış denemeler'],
    ['yedek', 'Yedekler', 'Hesap deposunun yedekleri; geri yükle, indir'],
    ['verin', 'Verin', 'Bütün verini dışa aktar ya da hesabı sil'],
  ]);
  /* Bağlantılar: hesap merkezinin bağlantı sayfaları (hesap.js SAYFA_AD). */
  const BAGLANTI_SAYFALARI = Object.freeze([
    ['baglantilar', 'Bütün bağlantılar', 'Bu hesaba bağlı olan her şey tek listede'],
    ['bagla', 'Yeni cihaz bağla', 'Telefonu ya da tableti kodla bağla'],
    ['anahtarlar', 'Kısayollar ve otomasyon', 'iPhone Kısayollar, Home Assistant erişim anahtarları'],
    ['gelen', 'Gelen kutusu', 'Kısayollardan gelen satırlar; modül onaylamadan yazılmaz'],
    ['takvim', 'Takvim aboneliği', 'Planını telefonun takvimine abone et'],
  ]);
  const sayfaSatirlari = l => l.map(([sayfa, ad, not]) => H(ad, not,
    '<button type="button" class="btn btn--sm" data-ayarlar-hesap="' + sayfa + '">Aç</button>')).join('');
  const hesapYok = () => H('Hesap ve eşitleme', 'LifeOS sunucusu kapalı ya da giriş yapılmadı; kayıtlar bu cihazda', '');
  const modulAdi = () => (typeof document !== 'undefined' && document.documentElement.getAttribute('data-modul')) || 'ays';
  const ODEME_ANAHTAR = 'lifeos.kilit.odeme';
  function odemeAcik(){ try{ return localStorage.getItem(ODEME_ANAHTAR) === 'acik'; }catch(e){ return false; } }
  function odemeAyarla(acik){
    try{ if(acik) localStorage.setItem(ODEME_ANAHTAR, 'acik'); else localStorage.removeItem(ODEME_ANAHTAR); }catch(e){ /* depo kapalı */ }
    if(typeof document !== 'undefined') document.querySelectorAll('[data-odeme]').forEach(b => {
      const on = (b.getAttribute('data-odeme') === 'acik') === acik;
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  const odemeSecici = () => '<div class="seg seg--block" role="group" aria-label="Satın alma ve kart işlemleri">'
    + [['kapali', 'Kapalı'], ['acik', 'Açık']].map(([k, ad]) => { const on = (k === 'acik') === odemeAcik();
      return '<button type="button" class="' + (on ? 'is-on' : '') + '" data-odeme="' + k + '" aria-pressed="' + on + '">' + ad + '</button>'; }).join('') + '</div>';
  const cagir = (nesne, ad) => { try{ return nesne && typeof nesne[ad] === 'function' ? nesne[ad]() : ''; }catch(e){ return ''; } };
  /* Kart (Ses ve Profiller; biçimi ayarlar.css «skart»): başlık, kısa not, gövde. */
  const SVG = d => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
  const kart = (simge, ad, not, govde) => '<section class="skart"><header class="skart__bas"><span class="skart__simge">' + simge + '</span>'
    + '<span class="skart__baslik"><b>' + kac(ad) + '</b>' + (not ? '<small>' + kac(not) + '</small>' : '') + '</span></header><div class="skart__govde">' + govde + '</div></section>';
  const SIMGE = {
    tema:SVG('M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'),
    yazi:SVG('M5 19L10 5h1l5 14M7 14h7M17 19l2-6 2 6M17.6 17h2.8'),
    renk:SVG('M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.2-1.7-.4-1 .3-2.3 1.5-2.3H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10zM7.5 11h.01M10 7.5h.01M14 7.5h.01'),
    resim:SVG('M4 5h16v14H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17'),
    bulanik:SVG('M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z'),
    zil:SVG('M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0'),
    hareket:SVG('M4 12h4l3-7 4 14 3-7h2'),
    king:SVG('M4 18h16M5 18l-1-10 5 4 3-6 3 6 5-4-1 10'),
    minik:SVG('M12 4a6 6 0 0 1 6 6v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6a6 6 0 0 1 6-6zM9.5 11h.01M14.5 11h.01'),
    kilit:SVG('M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3'),
    yuzey:SVG('M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'),
    indir:SVG('M12 4v11M7 10l5 5 5-5M5 20h14'),
    goz:SVG('M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z'),
    klavye:SVG('M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10'),
    profil:SVG('M5 6h14M5 12h14M5 18h9M18 16.5l1.5 1.5 3-3'),
    ses:SVG('M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 0 1 0 7'),
    plan:SVG('M4 6h16v14H4zM4 10h16M9 3v4M15 3v4'),
    bag:SVG('M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'),
    ekran:SVG('M4 5h16v11H4zM9 20h6M12 16v4'),
  };
  const SIMGE_SES = SVG('M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12');
  const SIMGE_VIDEO = SVG('M4 6h12v12H4zM16 10l4-2.5v9L16 14');

  /* o = { tema:'<tema seçici HTML>', profil:{ ad, alt, route }, modul:[{ ad, route, not }] } */
  function icerik(id, o){
    if(id === 'profil') return profilHtml() + '<div class="skartlar" style="margin-top:14px">'
      + kart(SIMGE.indir, 'Yedek', 'Bütün tercihlerin tek dosyada; başka bir bilgisayara ya da sonraya',
        H('Dışa aktar', 'Görünüş, ses, King, profiller; verin girmez', '<button type="button" class="btn btn--sm" data-ayar-disa>Dosya indir</button>')
        + H('İçe aktar', 'Dosyadaki tercihler uygulanır, sayfa yenilenir', '<label class="btn btn--sm btn--ghost">Dosya seç<input type="file" accept=".json,application/json" data-ayar-ice hidden></label>')
        + '<p class="skart__durum" role="status" data-ayar-yedek-durum></p>') + '</div>';
    /* YERLİ YERİNDE (kullanıcı, 2026-10-30: «ayarlar karman çorman oldu; her şeyi yerli
       yerinde yap»): her bölüm Ses'teki gibi başlıklı kartlardan oluşur; bir kart
       tek bir konuyu toplar. */
    if(id === 'gorunum') return '<div class="skartlar">'
      + kart(SIMGE.tema, 'Tema', 'Açık, koyu ya da cihazınki', H('Tema', '', o.tema) + H('Saate göre', '07:00–19:00 açık, sonra koyu', cagir(L.ZEMIN, 'otoSeciciHtml')))
      + kart(SIMGE.yazi, 'Yazı', 'Bütün modüllerde aynı',
        '<details class="ayarlar__acilir"><summary class="ayarlar__satir"><span class="ayarlar__ad">Yazı tipi</span>'
        + '<span class="ayarlar__acilir-deger" data-yazi-ad>' + kac((YAZILAR.find(y => y.id === yazi()) || YAZILAR[0]).ad) + '</span></summary>' + yaziSeciciHtml() + '</details>'
        + G('Boyut', 'İçerik birlikte büyür; menü yerinde kalır', secimHtml('boyut', 'Yazı boyutu')))
      + kart(SIMGE.renk, 'Renk ve cam', '', H('Vurgu rengi', 'Seçili düğme ve sekmeler', vurguHtml())
        + H('Cam yoğunluğu', 'Kartların ne kadar saydam olduğu', secimHtml('cam', 'Cam yoğunluğu'))
        + H('Sol menü', 'Cam: arkadaki fotoğraf görünür', secimHtml('kenar', 'Sol menü'))
        + H('Ortam ışığı', 'İmlecin peşindeki hafif ışık', anahtarHtml('isik', 'Ortam ışığı')))
      + '<div class="ayarlar__dip"><button type="button" class="btn btn--sm btn--ghost" data-ayarlar-sifirla>Görünümü sıfırla</button><small>Verin değişmez</small></div>'
      + '</div>';
    if(id === 'zemin') return '<div class="skartlar">'
      + kart(SIMGE.resim, 'Duvar kâğıdı', 'Gündüz açık temada, gece koyu temada', H('Zemin', 'Sade: fotoğraf ve cam yok', cagir(L.ZEMIN, 'seciciHtml'))
        + '<div class="zemin-yuvalar">'
        + '<div class="zemin-yuvasi"><div class="zemin-yuvasi__bas"><b>Gündüz</b><small>Açık tema</small></div>' + onizleHtml('gunduz') + cagir(L.ZEMIN, 'manzaraSeciciHtml') + '</div>'
        + '<div class="zemin-yuvasi"><div class="zemin-yuvasi__bas"><b>Gece</b><small>Koyu tema</small></div>' + onizleHtml('gece') + cagir(L.ZEMIN, 'geceSeciciHtml') + '</div></div>')
      + kart(SIMGE.bulanik, 'Bulanıklık ve okunaklık', 'Her katman ayrı; kapalı katman dolu ve okunur',
        H('Duvar kâğıdı', 'Fotoğrafın kendisi', secimHtml('bulanik', 'Duvar kâğıdının bulanıklığı'))
        + H('Perde', 'Fotoğrafın üstündeki örtü', secimHtml('perde', 'Okunaklık perdesi'))
        + H('Kartlar', 'Sayfadaki kartlar buzlu cam', anahtarHtml('buzluKart', 'Kartlar buzlu'))
        + H('Sol menü', 'Menü buzlu cam', anahtarHtml('buzluMenu', 'Sol menü buzlu'))
        + H('Pencereler', 'Ayarlar, bildirimler, çekmeceler', anahtarHtml('buzluPencere', 'Pencereler buzlu')))
      + kart(SIMGE_VIDEO, 'Arka plan videosu', 'Yalnız video seçiliyken', cagir(L.ZEMIN, 'videoAyarHtml'))
      + '</div>';
    if(id === 'bildirim'){
      const ss = L.SES && L.SES.sessiz ? L.SES.sessiz() : null;
      const sb = L.SES && L.SES.susturBitis ? L.SES.susturBitis() : 0;
      const sustur = L.SES && L.SES.sustur ? H('Şimdi sustur', sb ? saatYazi(sb) + '’e kadar susturuldu' : 'Sesler ve King’in sesli okuması bir süre susar',
        '<div class="seg" role="group" aria-label="Şimdi sustur">' + [['60', '1 saat'], ['sabah', 'Sabaha kadar'], ['0', 'Kapalı']].map(([v, ad]) => {
          const on = v === '0' ? !sb : false;
          return '<button type="button" class="' + (on ? 'is-on' : '') + '" aria-pressed="' + on + '" data-sustur="' + v + '">' + ad + '</button>'; }).join('') + '</div>') : '';
      return '<div class="skartlar">' + kart(SIMGE.zil, 'Bildirimler', '', sustur + (ss ? H('Sessiz saatler', 'Sesler ve King’in sesli okuması susar; radyo susmaz',
          '<div class="sessiz">' + '<button type="button" class="plan__anahtar' + (ss.acik ? ' is-on' : '') + '" role="switch" aria-checked="' + ss.acik + '" data-sessiz-ac>'
          + '<i aria-hidden="true"></i><span class="sr-only">' + (ss.acik ? 'Açık' : 'Kapalı') + '</span></button>'
          + '<input type="time" class="plan__saat" data-sessiz="bas" value="' + kac(ss.bas) + '" aria-label="Başlangıç">'
          + '<span aria-hidden="true">–</span><input type="time" class="plan__saat" data-sessiz="bit" value="' + kac(ss.bit) + '" aria-label="Bitiş"></div>') : '')
        + H('Sayaçlar ve noktalar', 'Kenardaki bildirim sayısı ve kırmızı nokta', secimHtml('rozet', 'Sayaçlar ve noktalar'))) + '</div>';
    }
    if(id === 'hareket') return '<div class="skartlar">' + kart(SIMGE.hareket, 'Animasyon', 'Az: yalnız gerekli geçişler',
      H('Animasyonlar', '', cagir(L.ANIMASYON, 'seciciHtml')) + G('Hız', 'Arayüz ve ajanlar ayrı; Ayrıntı içindekileri tek tek', cagir(L.ANIMASYON, 'hizSeciciHtml'))) + '</div>';
    /* ERİŞİLEBİLİRLİK (2026-10-31): okumayı ve gezinmeyi kolaylaştıran ayarlar tek yerde. */
    if(id === 'erisim') return '<div class="skartlar">'
      + kart(SIMGE.goz, 'Okuma', 'Yazı ve renk', G('Yazı boyutu', 'İçerik birlikte büyür', secimHtml('boyut', 'Yazı boyutu'))
        + H('Satır aralığı', 'Geniş: paragraflar daha rahat okunur', secimHtml('satir', 'Satır aralığı'))
        + H('Kontrast', 'Yüksek: soluk yazılar koyulaşır, kartlar dolar', secimHtml('kontrast', 'Kontrast')))
      + kart(SIMGE.klavye, 'Gezinme', 'Klavye ve bağlantılar', H('Odak çerçevesi', 'Klavyeyle gezerken seçili öğe kalın çerçeveyle', secimHtml('odak', 'Odak çerçevesi'))
        + H('Bağlantıların altı çizili', 'Bağlantılar renk dışında da ayırt edilir', secimHtml('altcizgi', 'Bağlantıların altı çizili')))
      + kart(SIMGE.hareket, 'Hareket', '', H('Animasyonlar', 'Az: kayma yok, yalnız solma', cagir(L.ANIMASYON, 'seciciHtml')))
      + '</div>';
    /* Ses (kullanıcı, 2026-10-30: «ses kısmında bayağı eksiklik, amatörlük ve tasarımda kötülük var»):
       kartlar; düzeyler, müzik kitaplığı, açılış, arka plan müziği, arka plan videosu. */
    if(id === 'ses') return '<div class="skartlar">'
      + kart(SIMGE_SES, 'Ses düzeyleri', 'Genel hepsini birlikte kısar; Ayrıntı grubun içindekileri tek tek', cagir(L.SES, 'duzeySeciciHtml'))
      + cagir(L.MUZIK, 'ayarHtml')
      + '<button type="button" class="skart skart--bag" data-ayarlar-git="zemin">' + SIMGE_VIDEO
      + '<span class="skart__baslik"><b>Arka plan videosunun sesi</b><small>Arka plan bölümünde: ses, kesit ve hız</small></span><span aria-hidden="true">›</span></button>'
      + '</div>';
    if(id === 'king') return '<div class="skartlar">' + kart(SIMGE.king, 'King', 'Adı, konuşması ve sesi',
        H('Adı', 'Boş bırakırsan King', '<input class="ayarlar__girdi" type="text" maxlength="20" data-king-ad placeholder="King"'
        + ' value="' + kac((() => { try{ return localStorage.getItem('lifeos.king.ad') || ''; }catch(e){ return ''; } })()) + '" aria-label="King’in adı">')
      + (L.KING && L.KING.ayarHtml ? cagir(L.KING, 'ayarHtml') : H('Görünüşü', '', cagir(L.KING, 'gorunusSeciciHtml')))) + '</div>';
    if(id === 'ekip') return '<div class="skartlar">' + kart(SIMGE.minik, 'Minikler', 'Sayfada gezen küçük yardımcılar',
        H('Kaç minik', 'Sayfada en çok', cagir(L.MINIK, 'seciciHtml')) + H('Boy', '', cagir(L.MINIK, 'boySeciciHtml')))
      + kart(SIMGE.minik, 'Kimler gezsin', 'Basınca sayfadan çıkar ya da gelir', cagir(L.MINIK, 'galeriHtml')) + '</div>';
    if(id === 'hesap'){
      const p = o.profil || {};
      return '<div class="skartlar"><div class="ayarlar__profil"><i class="ayarlar__avatar" aria-hidden="true">' + kac(((p.ad || 'Ben').trim().charAt(0) || 'B').toLocaleUpperCase('tr-TR')) + '</i>'
        + '<span><b>' + kac(p.ad || 'Profil') + '</b><small>' + kac(p.alt || '') + '</small></span>'
        + (p.route ? '<button type="button" class="btn btn--sm" data-act="go" data-route="' + kac(p.route) + '">Profili aç</button>' : '') + '</div>'
        + kart(SIMGE.kilit, 'Güvenlik', '', hesapVar() ? sayfaSatirlari(HESAP_SAYFALARI) : hesapYok())
        + kart(SIMGE.kilit, 'Satın alma ve kart işlemleri', '', H('Durum', odemeAcik() ? 'Açık; yine de LifeOS’ta ödeme yapan bir araç yok'
            : 'Kapalı: King ve ajanlar ödeme, sipariş ya da kart işine girmez', odemeSecici())) + '</div>';
    }
    if(id === 'baglanti') return G('Google’dan veri', 'Hesap bağlanmaz; veri bu bilgisayarda kalır, ölçüm kendiliğinden kayda yazılmaz', cagir(L.ICE, 'ayarHtml'))
      + H('Google ve YouTube', 'Hesap bağlanmaz: King’in bulduğu bağlantılar senin tarayıcında, kendi oturumunla açılır; LifeOS Google’a veri göndermez', '')
      + (hesapVar() ? sayfaSatirlari(BAGLANTI_SAYFALARI) : hesapYok());
    if(id === 'sistem') return '<h4 class="plan__baslik">Sistem planlaması</h4><div class="plan" data-plan-kok><p class="ayarlar__bos">Yükleniyor…</p></div>';
    if(id === 'modul') return '<div class="skartlar">'
      + kart(SIMGE.yuzey, 'Yüzey', 'Kartların bu modüldeki düzeni', H('Düzen', '', cagir(L.ZEMIN, 'yuzeySeciciHtml')))
      + (L.KILIT && L.KILIT.ayarHtml ? kart(SIMGE.kilit, 'Gizlilik kilidi', 'Bu modül açılırken dört haneli kod sorar', L.KILIT.ayarHtml(modulAdi(), { govde:true })) : '')
      + ((o.modul || []).length ? kart(SIMGE.ekran, (MODUL_AD[modulAdi()] || 'Modül') + ' ekranları', 'Modülün kendi ayar sayfaları', o.modul.map(m => H(m.ad, m.not || '',
        '<button type="button" class="btn btn--sm" data-act="go" data-route="' + kac(m.route) + '">Aç</button>')).join('')) : '')
      + '</div>';
    return '';
  }

  function html(o){
    o = o || {};
    if(!BOLUMLER.some(b => b.id === secili)) secili = 'gorunum';
    if(secili === 'sistem' && typeof setTimeout === 'function') setTimeout(() => planYukle(), 0);
    const alan = alanOf(secili);
    const NAV_SIMGE = { profil:SIMGE.profil, gorunum:SIMGE.tema, zemin:SIMGE.resim, ses:SIMGE.ses, hareket:SIMGE.hareket, erisim:SIMGE.goz, king:SIMGE.king,
      ekip:SIMGE.minik, bildirim:SIMGE.zil, sistem:SIMGE.plan, modul:SIMGE.yuzey, hesap:SIMGE.kilit, baglanti:SIMGE.bag };
    const nav = BOLUMLER.map(b => '<button type="button" class="ayarlar__sekme' + (b.id === secili ? ' is-on' : '') + '" role="tab"' + (b.grup === alan ? '' : ' hidden')
      + ' id="ayarlar-sekme-' + b.id + '" aria-selected="' + (b.id === secili) + '" aria-controls="ayarlar-bolum-' + b.id + '"'
      + ' data-ayar-bolum="' + b.id + '">' + (NAV_SIMGE[b.id] || '') + kac(b.ad) + '</button>').join('');
    const govde = BOLUMLER.map(b => '<section class="ayarlar__bolum" role="tabpanel" id="ayarlar-bolum-' + b.id + '" data-baslik="' + kac(b.ad) + '"'
      + ' aria-labelledby="ayarlar-sekme-' + b.id + '"' + (b.id === secili ? '' : ' hidden') + '>'
      + kapsamHtml(b.grup, b.ad) + icerik(b.id, o) + '</section>').join('');
    return '<div class="katman kmenu kmenu--yan ayarlar" role="dialog" aria-label="Ayarlar">'
      + '<header class="ayarlar__bas"><b>Ayarlar</b>'
      + '<button type="button" class="bildirim__kapat" data-katman-kapat aria-label="Ayarları kapat">'
      + (L.KABUK ? L.KABUK.simge('kapat') : '×') + '</button></header>'
      + alanlarHtml()
      + '<div class="ayarlar__govde"><nav class="ayarlar__nav" role="tablist" aria-label="Ayar bölümleri" aria-orientation="vertical">'
      + '<input type="search" class="ayarlar__ara" data-ayarlar-ara placeholder="Ayarlarda ara" aria-label="Ayarlarda ara" autocomplete="off">' + nav + '</nav>'
      + '<div class="ayarlar__icerik">' + govde + '</div></div></div>';
  }

  const saatYazi = t => { try{ return new Date(t).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }); }catch(e){ return ''; } };
  /* Bir bölümü yerinde yeniden çizer (kaydırma yerinde kalır). */
  function bolumYenile(panel, id){
    const sec = panel && panel.querySelector('#ayarlar-bolum-' + id);
    if(!sec) return;
    const b = BOLUMLER.find(x => x.id === id), ic = panel.querySelector('.ayarlar__icerik'), y = ic ? ic.scrollTop : 0;
    sec.innerHTML = kapsamHtml(b.grup, b.ad) + icerik(id, {});
    if(ic) ic.scrollTop = y;
  }
  /* YEDEK (2026-10-31): tercihleri dosyaya yazar / dosyadan okur. Yalnız ortak tercih
     anahtarları (animasyon.js ORTAK; sistem/ayar.py ile aynı); veri, hesap ve kilit girmez. */
  function yedekDurum(m){ if(typeof document !== 'undefined') document.querySelectorAll('[data-ayar-yedek-durum]').forEach(x => { x.textContent = m; }); }
  function ayarAnlik(){
    const R = L.ANIMASYON && L.ANIMASYON.ORTAK, o = {};
    try{ for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(R && R.test(k)) o[k] = localStorage.getItem(k); } }catch(e){ /* depo kapalı */ }
    return o;
  }
  function ayarDisa(){
    try{
      const veri = JSON.stringify({ lifeos:'ayarlar', surum:1, tarih:new Date().toISOString(), ayar:ayarAnlik() }, null, 2);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([veri], { type:'application/json' }));
      a.download = 'lifeos-ayarlar-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
      yedekDurum('İndirildi: ' + Object.keys(JSON.parse(veri).ayar).length + ' tercih.');
    }catch(e){ yedekDurum('İndirilemedi.'); }
  }
  /* Döner: uygulanan anahtar sayısı (dosya bozuksa 0, hiçbir şey değişmez). */
  function ayarUygula(metin){
    let v = null;
    try{ v = JSON.parse(metin); }catch(e){ return 0; }
    const R = L.ANIMASYON && L.ANIMASYON.ORTAK;
    if(!v || v.lifeos !== 'ayarlar' || !v.ayar || typeof v.ayar !== 'object' || !R) return 0;
    let n = 0;
    Object.keys(v.ayar).forEach(k => { const x = v.ayar[k];
      if(R.test(k) && typeof x === 'string' && x.length <= (k === 'lifeos.profiller' ? 60000 : 4000)){ depoKoy(k, x); n++; } });
    return n;
  }
  function ayarIce(dosya){
    if(!dosya || !dosya.text) return;
    dosya.text().then(m => {
      const n = ayarUygula(m);
      if(!n){ yedekDurum('Bu dosya bir LifeOS ayar yedeği değil.'); return; }
      yedekDurum(n + ' tercih uygulandı; sayfa yenileniyor…');
      setTimeout(yenileKaydet, 600);
    }).catch(() => yedekDurum('Dosya okunamadı.'));
  }
  function sessizYaz(degisen){
    if(!(L.SES && L.SES.sessiz)) return;
    const v = Object.assign(L.SES.sessiz(), degisen);
    try{ localStorage.setItem(L.SES.SESSIZ_ANAHTAR, JSON.stringify(v)); }catch(e){ /* depo kapalı */ }
  }
  const kucukHarf = x => String(x || '').toLocaleLowerCase('tr-TR');
  function ara(panel, q){
    if(!panel) return;
    const a = kucukHarf(q).trim();
    panel.classList.toggle('is-aranir', !!a);
    panel.querySelectorAll('.ayarlar__bolum').forEach(sec => {
      if(!a){ sec.hidden = sec.id !== 'ayarlar-bolum-' + secili; sec.querySelectorAll('[data-ara-gizli]').forEach(x => { x.hidden = false; x.removeAttribute('data-ara-gizli'); }); return; }
      const satirlar = Array.from(sec.querySelectorAll('.ayarlar__satir, .zemin-yuvasi, .minikgal__kart, .skart'));
      const basUyar = kucukHarf(sec.getAttribute('data-baslik')).indexOf(a) >= 0;   // bölümün adı tutarsa hepsi kalır
      satirlar.forEach(x => {
        const uy = basUyar || kucukHarf(x.textContent).indexOf(a) >= 0;
        x.hidden = !uy;
        if(uy) x.removeAttribute('data-ara-gizli'); else x.setAttribute('data-ara-gizli', '');
      });
      sec.hidden = !(basUyar || satirlar.some(x => !x.hidden));
    });
  }
  function sekmeSec(panel, id){
    if(!panel || !BOLUMLER.some(b => b.id === id)) return;
    /* Yeni bölüm en üstten açılır (2026-10-31: «ayarlarda kaydırma bazen buga giriyor»:
       bölüm değişince öncekinin kaydırma yerinde, ortadan açılıyordu). */
    const ic = panel.querySelector('.ayarlar__icerik');
    if(ic && secili !== id) ic.scrollTop = 0;
    secili = id;
    panel.querySelectorAll('[data-ayar-bolum]').forEach(b => {
      const on = b.getAttribute('data-ayar-bolum') === id;
      b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panel.querySelectorAll('.ayarlar__bolum').forEach(s => { s.hidden = s.id !== 'ayarlar-bolum-' + id; });
    const alan = alanOf(id);
    panel.querySelectorAll('[data-ayar-bolum]').forEach(b => { b.hidden = alanOf(b.getAttribute('data-ayar-bolum')) !== alan; });
    panel.querySelectorAll('[data-ayar-alan]').forEach(b => { const on = b.getAttribute('data-ayar-alan') === alan; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    if(id === 'sistem') planYukle();
  }

  /* SİSTEM PLANLAMASI (kullanıcı, 2026-10-29: «sistemin kendini ne zaman
     başlatacağını, ne zaman kapatacağını periyodik bir çizgi üzerinden
     haftalık ayarlayalım; misal her cumartesi 7'de genel tarama; kaçarsa en
     müsait anda yapsın ya da onayımızı beklesin»). Plan PC'deki sunucudadır
     (sistem/planlama.py, /api/planlama; yalnız bu bilgisayardan): her
     değişiklik hemen kaydedilir. Haftalık çizgi yedi gündür; her günde o gün
     planlanan açılış, kapanış ve işler saatiyle durur. */
  let plan = null, planMesaj = '', planZaman = 0;
  const saatAd = t => { try{ const d = new Date(t * 1000); return d.toLocaleDateString('tr-TR', { day:'numeric', month:'short' }) + ' ' + d.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }); }catch(e){ return ''; } };
  function planKok(){ return typeof document !== 'undefined' ? document.querySelector('[data-plan-kok]') : null; }
  function planYukle(){
    const kok = planKok();
    if(!kok || typeof fetch !== 'function') return;
    if(!/^https?:$/.test(location.protocol)){ kok.innerHTML = planYok(); return; }
    fetch('/api/planlama', { cache:'no-store' }).then(r => r.ok ? r.json() : Promise.reject())
      .then(v => {
        plan = planUyumla(v);
        try{ planCiz(); }catch(e){ const k = planKok(); if(k) k.innerHTML = '<p class="ayarlar__bos">Plan okundu ama çizilemedi; sayfayı yenile.</p>'; }
      }, () => { const k = planKok(); if(k) k.innerHTML = planYok(); });
  }
  /* Güncellemeden sonra sunucu yeniden başlatılmadıysa eski biçim gelir (açılışta
     gunler + saat, işte tek gun; 2026-10-30'da bu yüzden «sunucu yok» yazıyordu).
     Gösterilir ama kaydedilmez: eski sunucu yeni biçimi anlamaz. */
  function planUyumla(v){
    const p = v && v.plan;
    if(!p) return v;
    ['acilis', 'kapanis'].forEach(k => {
      const x = p[k];
      if(x && !Array.isArray(x.saatler)){ v.eski = true; x.saatler = [0, 1, 2, 3, 4, 5, 6].map(g => (x.gunler || []).indexOf(g) >= 0 ? x.saat : null); }
    });
    Object.keys(p.isler || {}).forEach(id => { const x = p.isler[id]; if(x && !Array.isArray(x.gunler)){ v.eski = true; x.gunler = [typeof x.gun === 'number' ? x.gun : 5]; } });
    return v;
  }
  const planYok = () => '<p class="ayarlar__bos">Sistem planlaması LifeOS sunucusunun bu bilgisayarda açık olmasını ister; telefonda ve tek dosya sürümünde yoktur.</p>';
  /* Esnek plan (kullanıcı, 2026-10-30: «planlama çok eksik ve çok karmaşık;
     her gün aynı saat olmak zorunda değil; esneklik yokken arayüz çok
     karmaşık ve acemice»). Açılış ve kapanış tek tablo: her günün kendi saati
     (boş = o gün yok). İşler tek satır özet; ayrıntı «Düzenle»de: hazır gün
     kümeleri, birden çok gün, saat, kaçarsa. */
  let planAcik = '';
  const KUMELER = [['her', 'Her gün', [0, 1, 2, 3, 4, 5, 6]], ['ici', 'Hafta içi', [0, 1, 2, 3, 4]], ['sonu', 'Hafta sonu', [5, 6]]];
  const ESIT = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  function gunOzet(gunler){
    const k = KUMELER.find(x => ESIT(x[2], gunler));
    return k ? k[1] : gunler.map(g => plan.gunler[g]).join(', ');
  }
  function gunCipleri(ad, secili){
    return '<div class="plan__gunler" role="group" aria-label="Günler">' + plan.gunler.map((g, i) => {
      const on = secili.indexOf(i) >= 0;
      return '<button type="button" class="plan__gun' + (on ? ' is-on' : '') + '" data-plan-gun="' + ad + '|' + i + '" aria-pressed="' + on + '">' + kac(g) + '</button>';
    }).join('') + '</div>';
  }
  const anahtar = (ad, acik, etiket) => '<button type="button" class="plan__anahtar' + (acik ? ' is-on' : '') + '" role="switch" aria-checked="' + acik + '" data-plan-ac="' + ad + '"'
    + ' aria-label="' + kac(etiket) + '"><i aria-hidden="true"></i></button>';
  const saatGirdi = (ad, v, etiket) => '<input type="time" class="plan__saat" data-plan-saat="' + ad + '" value="' + kac(v) + '" aria-label="' + kac(etiket || 'Saat') + '">';
  const gunSaati = (ad, g) => plan.plan[ad].acik ? plan.plan[ad].saatler[g] : null;
  function cizgi(){
    const p = plan.plan, gunler = plan.gunler.map(() => []);
    ['acilis', 'kapanis'].forEach(k => plan.gunler.forEach((x, g) => { const s = gunSaati(k, g); if(s) gunler[g].push({ saat:s, ad:k === 'acilis' ? 'Açılış' : 'Kapanış', tur:k }); }));
    plan.isler.forEach(x => { const i = p.isler[x.id]; if(i.acik) i.gunler.forEach(g => gunler[g].push({ saat:i.saat, ad:x.ad, tur:'is' })); });
    return '<ol class="plan__cizgi" aria-label="Haftalık plan">' + gunler.map((l, i) => '<li><b>' + kac(plan.gunler[i]) + '</b>'
      + l.sort((a, b) => a.saat.localeCompare(b.saat)).map(x => '<span class="plan__olay plan__olay--' + x.tur + '"><time>' + kac(x.saat) + '</time>' + kac(x.ad) + '</span>').join('')
      + '</li>').join('') + '</ol>';
  }
  function saatTablosu(){
    const UZUN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const hucre = (ad, g) => {
      const s = gunSaati(ad, g), ne = (UZUN[g] || '') + (ad === 'acilis' ? ' açılış' : ' kapanış');
      return s ? '<span class="plan__hucre is-on"><input type="time" class="plan__saat" data-plan-gunsaat="' + ad + '|' + g + '" value="' + kac(s) + '" aria-label="' + kac(ne) + ' saati">'
          + '<button type="button" class="plan__sil" data-plan-gunkapa="' + ad + '|' + g + '" aria-label="' + kac(ne) + ' kaldır">×</button></span>'
        : '<button type="button" class="plan__hucre plan__ekle" data-plan-gunac="' + ad + '|' + g + '" aria-label="' + kac(ne) + ' ekle">+</button>';
    };
    const bas = (ad, ne) => '<span class="plan__tbas">' + ne + (plan.plan[ad].acik ? '<button type="button" class="plan__hepsi" data-plan-hepsi="' + ad + '">Her güne</button>' : '') + '</span>';
    return '<div class="plan__tablo" role="group" aria-label="Açılış ve kapanış saatleri"><span></span>' + bas('acilis', 'Açılış') + bas('kapanis', 'Kapanış')
      + plan.gunler.map((g, i) => '<b class="plan__tgun">' + kac(g) + '</b>' + hucre('acilis', i) + hucre('kapanis', i)).join('') + '</div>';
  }
  function planCiz(){
    const kok = planKok();
    if(!kok || !plan) return;
    const p = plan.plan;
    const bekleyen = p.bekleyen.length ? '<div class="plan__bekleyen" role="status"><b>Saatinde yapılamadı</b>' + p.bekleyen.map(id => {
      const x = plan.isler.find(i => i.id === id) || { ad:id };
      return '<div class="plan__bek-satir"><span>' + kac(x.ad) + '</span><button type="button" class="btn btn--sm" data-plan-yap="' + id + '">Yap</button>'
        + '<button type="button" class="btn btn--sm btn--ghost" data-plan-atla="' + id + '">Atla</button></div>';
    }).join('') + '</div>' : '';
    const isler = plan.isler.map(x => {
      const i = p.isler[x.id], son = p.son[x.id], acik = planAcik === x.id && i.acik;
      const ozet = i.acik ? gunOzet(i.gunler) + ' · ' + i.saat + (i.kacarsa === 'onay' ? ' · kaçarsa sorar' : '') : x.not;
      return '<div class="plan__is' + (acik ? ' is-acik' : '') + '"><div class="plan__is-bas">' + anahtar('is:' + x.id, i.acik, x.ad)
        + '<div class="plan__ad">' + kac(x.ad) + '<small>' + kac(ozet) + '</small></div>'
        + (i.acik ? '<button type="button" class="plan__duzen" data-plan-duzen="' + x.id + '" aria-expanded="' + acik + '">' + (acik ? 'Kapat' : 'Düzenle') + '</button>' : '') + '</div>'
        + (acik ? '<div class="plan__ayar"><div class="plan__kumeler" role="group" aria-label="Hazır günler">'
            + KUMELER.map(k => '<button type="button" class="plan__kume' + (ESIT(k[2], i.gunler) ? ' is-on' : '') + '" data-plan-kume="' + x.id + '|' + k[0] + '">' + k[1] + '</button>').join('') + '</div>'
          + gunCipleri('is:' + x.id, i.gunler) + '<div class="plan__ayar-alt">' + saatGirdi('is:' + x.id, i.saat, x.ad + ' saati')
          + '<div class="seg plan__kacarsa" role="group" aria-label="Kaçarsa">'
          + ['hemen', 'onay'].map(k => '<button type="button" class="' + (i.kacarsa === k ? 'is-on' : '') + '" data-plan-kacarsa="' + x.id + ':' + k + '" aria-pressed="' + (i.kacarsa === k) + '">'
            + (k === 'hemen' ? 'Kaçarsa ilk müsait an' : 'Kaçarsa sor') + '</button>').join('') + '</div></div>'
          + (x.id === 'guncelleme' ? '<label class="plan__kur"><input type="checkbox" data-plan-kur' + (i.kur ? ' checked' : '') + '> Yenilik varsa kur</label>' : '')
          + '</div>' : '')
        + '<div class="plan__son">' + (son && son.zaman ? '<span class="' + (son.ok ? 'is-ok' : 'is-sorun') + '">' + (son.ok ? '✓ ' : '✕ ') + kac(saatAd(son.zaman)) + ' · ' + kac(son.mesaj || '') + '</span>' : '<span>Henüz yapılmadı</span>')
        + (plan.calisan.indexOf(x.id) >= 0 ? '<span>Çalışıyor…</span>' : '<button type="button" class="plan__simdi" data-plan-yap="' + x.id + '">Şimdi yap</button>') + '</div></div>';
    }).join('');
    kok.innerHTML = (plan.eski ? '<div class="plan__bekleyen" role="status"><b>LifeOS sunucusu eski sürümle çalışıyor</b><span>Güncelleme sunucu dosyalarını da değiştirdi; LifeOS’u kapatıp yeniden açınca plan kaydedilebilir.</span></div>' : '')
      + bekleyen + cizgi()
      + '<h5 class="plan__alt">Açılış ve kapanış</h5>'
      + '<p class="plan__not">' + (plan.windows ? 'Açılışı Windows yapar (bilgisayar açık olmalı); kapanışı LifeOS kendisi. Boş gün: o gün yok.' : 'Kendiliğinden açılış yalnız Windows’ta.') + '</p>'
      + saatTablosu()
      + '<h5 class="plan__alt">Periyodik işler</h5>' + isler
      + '<p class="plan__mesaj" role="status">' + kac(planMesaj) + '</p>';
  }
  function planKaydet(){
    if(plan.eski){ planMesaj = 'Kaydedilmedi: LifeOS sunucusu eski sürümle çalışıyor. LifeOS’u kapatıp yeniden aç.'; planCiz(); return; }
    clearTimeout(planZaman);
    planZaman = setTimeout(() => {
      fetch('/api/planlama', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-LifeOS':'planlama' }, body:JSON.stringify(plan.plan) })
        .then(r => r.json().then(v => ({ ok:r.ok, v })))
        .then(({ ok, v }) => { if(ok){ plan.plan = v.plan; planMesaj = v.mesaj || 'Kaydedildi.'; } else planMesaj = v.hata || 'Kaydedilemedi.'; planCiz(); })
        .catch(() => { planMesaj = 'Kaydedilemedi: LifeOS sunucusu yanıt vermedi.'; planCiz(); });
    }, 350);
  }
  function hedef(ad){ return ad.indexOf('is:') === 0 ? plan.plan.isler[ad.slice(3)] : plan.plan[ad]; }
  const VARS_SAAT = { acilis:'07:00', kapanis:'23:30' };
  function gunAyarla(ad, g, saat){
    const h = plan.plan[ad];
    if(!h.acik){ h.saatler = [null, null, null, null, null, null, null]; h.acik = true; }
    h.saatler[g] = saat;
    if(!h.saatler.some(Boolean)) h.acik = false;
  }
  function planTikla(t){
    if(!plan) return false;
    const ac = t.closest('[data-plan-ac]');
    if(ac){ const ad = ac.getAttribute('data-plan-ac'), h = hedef(ad); h.acik = !h.acik; if(!h.acik && planAcik === ad.slice(3)) planAcik = ''; planCiz(); planKaydet(); return true; }
    const dz = t.closest('[data-plan-duzen]');
    if(dz){ const id = dz.getAttribute('data-plan-duzen'); planAcik = planAcik === id ? '' : id; planCiz(); return true; }
    const g = t.closest('[data-plan-gun]');
    if(g){
      const [ad, n] = g.getAttribute('data-plan-gun').split('|'), i = Number(n), h = hedef(ad);
      if(h.gunler.indexOf(i) >= 0){ if(h.gunler.length > 1) h.gunler = h.gunler.filter(x => x !== i); }
      else h.gunler = h.gunler.concat(i).sort();
      planCiz(); planKaydet(); return true;
    }
    const km = t.closest('[data-plan-kume]');
    if(km){ const [id, k] = km.getAttribute('data-plan-kume').split('|'); plan.plan.isler[id].gunler = KUMELER.find(x => x[0] === k)[2].slice(); planCiz(); planKaydet(); return true; }
    const ga = t.closest('[data-plan-gunac], [data-plan-gunkapa]');
    if(ga){
      const acilsin = ga.hasAttribute('data-plan-gunac'), [ad, n] = ga.getAttribute(acilsin ? 'data-plan-gunac' : 'data-plan-gunkapa').split('|');
      const h = plan.plan[ad], once = h.acik ? h.saatler.filter(Boolean)[0] : null;
      gunAyarla(ad, Number(n), acilsin ? (once || VARS_SAAT[ad]) : null);
      planCiz(); planKaydet(); return true;
    }
    const hp = t.closest('[data-plan-hepsi]');
    if(hp){ const ad = hp.getAttribute('data-plan-hepsi'), h = plan.plan[ad], s = h.saatler.filter(Boolean)[0] || VARS_SAAT[ad]; h.saatler = h.saatler.map(() => s); h.acik = true; planCiz(); planKaydet(); return true; }
    const k = t.closest('[data-plan-kacarsa]');
    if(k){ const [id, v] = k.getAttribute('data-plan-kacarsa').split(':'); plan.plan.isler[id].kacarsa = v; planCiz(); planKaydet(); return true; }
    const y = t.closest('[data-plan-yap], [data-plan-atla]');
    if(y){
      const yap = y.hasAttribute('data-plan-yap'), id = y.getAttribute(yap ? 'data-plan-yap' : 'data-plan-atla');
      fetch('/api/planlama/' + (yap ? 'yap/' : 'atla/') + id, { method:'POST', headers:{ 'X-LifeOS':'planlama' } })
        .then(() => setTimeout(planYukle, yap ? 1200 : 0)).catch(() => {});
      if(yap){ plan.calisan = plan.calisan.concat(id); planCiz(); }
      return true;
    }
    return false;
  }
  function planDegisti(t){
    if(!plan) return false;
    if(t.matches('[data-plan-gunsaat]')){ const [ad, n] = t.getAttribute('data-plan-gunsaat').split('|'); if(/^\d\d:\d\d$/.test(t.value)){ gunAyarla(ad, Number(n), t.value); planCiz(); planKaydet(); } return true; }
    if(t.matches('[data-plan-saat]')){ const h = hedef(t.getAttribute('data-plan-saat')); if(/^\d\d:\d\d$/.test(t.value)){ h.saat = t.value; planCiz(); planKaydet(); } return true; }
    if(t.matches('[data-plan-kur]')){ plan.plan.isler.guncelleme.kur = t.checked; planKaydet(); return true; }
    return false;
  }

  if(typeof document !== 'undefined'){
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      if(planTikla(t)) return;
      const se = t.closest('[data-secim]');
      if(se){ const [k, v] = se.getAttribute('data-secim').split(':'); secimAyarla(k, v); return; }
      const sf = t.closest('[data-ayarlar-sifirla]');
      if(sf){
        if(sf.getAttribute('data-onay') !== '1'){ sf.setAttribute('data-onay', '1'); sf.textContent = 'Emin misin? Sıfırla'; return; }
        SIFIRLANAN.forEach(k => { try{ localStorage.removeItem(k); }catch(e){} });
        try{ if(L.ZEMIN && L.ZEMIN.yuzeyAnahtar) localStorage.removeItem(L.ZEMIN.yuzeyAnahtar()); }catch(e){}   // Yüzey modüle özel
        yenileKaydet();
        return;
      }
      const su = t.closest('[data-sustur]');
      if(su && L.SES && L.SES.sustur){
        const v = su.getAttribute('data-sustur'), d = new Date();
        if(v === 'sabah'){ const s = new Date(d); s.setDate(d.getDate() + (d.getHours() >= 7 ? 1 : 0)); s.setHours(7, 0, 0, 0); L.SES.sustur(s.getTime()); }
        else L.SES.sustur(v === '0' ? 0 : d.getTime() + Number(v) * 60000);
        bolumYenile(su.closest('.ayarlar'), 'bildirim');
        return;
      }
      if(t.closest('[data-ayar-disa]')){ ayarDisa(); return; }
      const an = t.closest('[data-anahtar]');
      if(an){
        const k = an.getAttribute('data-anahtar'), x = SECIMLER[k];
        if(x){ const ac = secim(k) !== x.vars; secimAyarla(k, ac ? x.vars : x.sira.find(v => v !== x.vars));
          an.classList.toggle('is-on', ac); an.setAttribute('aria-checked', ac ? 'true' : 'false'); }
        return;
      }
      const sa = t.closest('[data-sessiz-ac]');
      if(sa){ sessizYaz({ acik:sa.getAttribute('aria-checked') !== 'true' }); sa.classList.toggle('is-on'); sa.setAttribute('aria-checked', String(sa.classList.contains('is-on'))); return; }
      const ts = t.closest('[data-act="set-theme"][data-theme]');
      if(ts && TEMALAR.indexOf(ts.getAttribute('data-theme')) >= 0 && !ts.hidden){   // modül de kendi işini yapar
        depoKoy(TEMA_SECIM, ts.getAttribute('data-theme'));
        /* Elle tema seçmek «Saate göre»yi kapatır: yoksa düğme işe yaramıyor gibi görünüyordu. */
        if(L.ZEMIN && L.ZEMIN.oto && L.ZEMIN.oto() === 'saat') L.ZEMIN.otoAyarla('kapali');
      }
      const al = t.closest('[data-ayar-alan]');
      if(al){ const ilk = BOLUMLER.find(b => b.grup === al.getAttribute('data-ayar-alan')); if(ilk) sekmeSec(al.closest('.ayarlar'), ilk.id); return; }
      const git = t.closest('[data-ayarlar-git]');
      if(git){ e.preventDefault(); sekmeSec(git.closest('.ayarlar'), git.getAttribute('data-ayarlar-git')); return; }
      const pg = t.closest('[data-profil-gec], [data-profil-guncelle], [data-profil-sil]');
      if(pg){
        e.preventDefault();
        if(pg.hasAttribute('data-profil-gec')){ profilMesaj = 'Geçiliyor…'; profilYenile(); profilUygula(pg.getAttribute('data-profil-gec')); return; }
        if(pg.hasAttribute('data-profil-guncelle')){ profilMesaj = profilKaydet(pg.getAttribute('data-profil-guncelle')).mesaj; profilYenile(); return; }
        if(pg.getAttribute('data-emin') !== '1'){ pg.setAttribute('data-emin', '1'); pg.textContent = 'Silinsin mi?'; return; }
        const ad = pg.getAttribute('data-profil-sil');
        profilMesaj = profilSil(ad) ? '«' + ad + '» silindi; şu anki ayarların değişmedi.' : '';
        profilYenile();
        return;
      }
      const sk = t.closest('[data-ayar-bolum]');
      if(sk){ sekmeSec(sk.closest('.ayarlar'), sk.getAttribute('data-ayar-bolum')); return; }
      const yz = t.closest('[data-yazi-sec]');
      if(yz){
        yaziAyarla(yz.getAttribute('data-yazi-sec'));
        const yad = (YAZILAR.find(y => y.id === yz.getAttribute('data-yazi-sec')) || {}).ad;
        document.querySelectorAll('[data-yazi-ad]').forEach(x => { x.textContent = yad || ''; });
        const g = yz.closest('.ayarlar__yazilar');
        if(g) g.querySelectorAll('[data-yazi-sec]').forEach(b => {
          const on = b === yz; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        return;
      }
      const od = t.closest('[data-odeme]');
      if(od){ odemeAyarla(od.getAttribute('data-odeme') === 'acik'); return; }
      /* Hesap merkezi istenen sayfasında açılır (hesap.js merkezAc). */
      const hs = t.closest('[data-ayarlar-hesap]');
      if(hs && L.HESAP && L.HESAP.merkezAc){
        if(L.KABUK) L.KABUK.katmanKapat();
        L.HESAP.merkezAc(hs.getAttribute('data-ayarlar-hesap') || 'kok');
      }
    });
    document.addEventListener('change', e => {
      if(!(e.target && e.target.matches)) return;
      if(e.target.matches('[data-sessiz]') && /^\d\d:\d\d$/.test(e.target.value)) sessizYaz({ [e.target.getAttribute('data-sessiz')]:e.target.value });
      else if(e.target.matches('[data-ayar-ice]') && e.target.files && e.target.files[0]){ ayarIce(e.target.files[0]); e.target.value = ''; }
      else if(e.target.matches('[data-king-ad]')){
        const v = String(e.target.value || '').replace(/[<>"]/g, '').trim().slice(0, 20);
        try{ if(v) localStorage.setItem('lifeos.king.ad', v); else localStorage.removeItem('lifeos.king.ad'); }catch(x){ /* depo kapalı */ }
      }
      else planDegisti(e.target);
    });
    document.addEventListener('submit', e => {
      const f = e.target && e.target.matches && e.target.matches('[data-profil-form]') ? e.target : null;
      if(!f) return;
      e.preventDefault();
      const i = f.querySelector('[data-profil-ad]');
      profilMesaj = profilKaydet(i ? i.value : '').mesaj;
      profilYenile();
    });
    /* Ayarlarda ara: yazınca bütün bölümler açılır, eşleşmeyen satır gizlenir. */
    document.addEventListener('input', e => {
      if(!(e.target && e.target.matches && e.target.matches('[data-ayarlar-ara]'))) return;
      ara(e.target.closest('.ayarlar'), e.target.value);
    });
    /* Sekmelerde ok tuşları (dikey liste). */
    document.addEventListener('keydown', e => {
      if(e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const sk = e.target && e.target.closest && e.target.closest('[data-ayar-bolum]');
      if(!sk) return;
      const l = Array.from(sk.parentElement.querySelectorAll('[data-ayar-bolum]'));
      const h = l[(l.indexOf(sk) + (e.key === 'ArrowDown' ? 1 : -1) + l.length) % l.length];
      e.preventDefault(); h.focus(); sekmeSec(sk.closest('.ayarlar'), h.getAttribute('data-ayar-bolum'));
    });
  }

  L.AYARLAR = Object.freeze({ html, BOLUMLER, YAZILAR, yazi, yaziAyarla, yaziYukle, HESAP_SAYFALARI, BAGLANTI_SAYFALARI, ODEME_ANAHTAR, odemeAcik, odemeAyarla,
    SECIMLER, secim, secimAyarla, SIFIRLANAN, ara, _sec:id => { secili = id; },
    ayarAnlik, ayarUygula,
    PROFIL_ANAHTAR, ETKIN_ANAHTAR, GORDU_ANAHTAR, TEMA_BEKLE, PROFIL_KAPSAR, PROFIL_EN, profiller, etkinProfil, profilKaydet, profilUygula, profilSil, profilEsitle, profilHtml });
})();
