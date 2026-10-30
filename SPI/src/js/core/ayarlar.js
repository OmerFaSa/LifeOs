/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ayarlar.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
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
  const BOLUMLER = Object.freeze([
    { id:'gorunum',  ad:'Görünüm',          grup:'Sistem' },
    { id:'zemin',    ad:'Arka plan',        grup:'Sistem' },
    { id:'ekip',     ad:'Minikler ve King', grup:'Sistem' },
    { id:'ses',      ad:'Ses',              grup:'Sistem' },
    { id:'hareket',  ad:'Animasyon',        grup:'Sistem' },
    { id:'bildirim', ad:'Bildirimler',      grup:'Sistem' },
    { id:'sistem',   ad:'Planlama',         grup:'Sistem' },
    { id:'hesap',    ad:'Güvenlik',         grup:'Hesap' },
    { id:'baglanti', ad:'Bağlantılar',      grup:'Hesap' },
    { id:'modul',    ad:'Bu modül' },
  ]);

  /* SEÇİMLER: tek anahtarlı, kökte niteliği olan tercihler (biçimi cam.css §45).
     Nitelik hep yazılır (varsayılan da): CSS özgüllüğü buna dayanır. */
  const SECIMLER = Object.freeze({
    cam:     { anahtar:'lifeos.cam',           kok:'data-cam',      vars:'orta',  sira:['az', 'orta', 'cok'],  ad:{ az:'Dolu', orta:'Orta', cok:'Saydam' } },
    kontrast:{ anahtar:'lifeos.kontrast',      kok:'data-kontrast', vars:'normal', sira:['normal', 'yuksek'], ad:{ normal:'Normal', yuksek:'Yüksek' } },
    perde:   { anahtar:'lifeos.perde',         kok:'data-perde',    vars:'orta',  sira:['az', 'orta', 'cok'],  ad:{ az:'Az', orta:'Orta', cok:'Çok' } },
    bulanik: { anahtar:'lifeos.zemin.bulanik', kok:'data-bulanik',  vars:'yok',   sira:['yok', 'hafif', 'cok'], ad:{ yok:'Net', hafif:'Hafif', cok:'Yumuşak' } },
    rozet:   { anahtar:'lifeos.rozet',         kok:'data-rozet',    vars:'acik',  sira:['acik', 'kapali'],     ad:{ acik:'Göster', kapali:'Gizle' } },
    /* 2026-10-30 (kullanıcı: «sol taraftaki menüyü de camsı yapabilelim ayarlarda»). */
    /* Tema paketi (kullanıcı, 2026-10-30: «genel tema ayarlar olmalı; buzul camsı
       efekte Türklükle ilgili şeyler, kardeşim tatlışlar; King'in adını
       değiştirelim; kimisi uzay, kimisi fantastik, kimisi mitoloji»). Paket
       vurgu rengi, arka plan motifi ve King'in adını verir; sayıya dokunmaz. */
    paket:   { anahtar:'lifeos.tema.paket',    kok:'data-paket',    vars:'sade',  sira:['sade', 'turk', 'tatli', 'uzay', 'fantastik', 'mitoloji'],
      ad:{ sade:'Sade', turk:'Türk', tatli:'Tatlı', uzay:'Uzay', fantastik:'Fantastik', mitoloji:'Mitoloji' } },
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
  Object.keys(SECIMLER).forEach(secimUygula);

  /* «Görünümü varsayılana döndür»: yalnız görünüş tercihleri; veri değil. İki adım. */
  const SIFIRLANAN = Object.freeze(['lifeos.yazi', 'lifeos.cam', 'lifeos.kontrast', 'lifeos.perde', 'lifeos.zemin.bulanik',
    'lifeos.zemin', 'lifeos.manzara', 'lifeos.manzara.gece', 'lifeos.tema.oto', 'lifeos.rozet']);

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

  /* o = { tema:'<tema seçici HTML>', profil:{ ad, alt, route }, modul:[{ ad, route, not }] } */
  function icerik(id, o){
    if(id === 'gorunum') return H('Tema', 'Sistem seçiliyken cihazın açık/koyu tercihi izlenir', o.tema)
      + H('Yazı tipi', 'Bütün modüllerde aynı', yaziSeciciHtml())
      + H('Cam yoğunluğu', 'Kartların ne kadar saydam olduğu', secimHtml('cam', 'Cam yoğunluğu'))
      + H('Sol menü', 'Cam: arkadaki fotoğraf görünür', secimHtml('kenar', 'Sol menü'))
      + G('Tema paketi', 'Vurgu rengi, arka plan motifi ve King’in adı', secimHtml('paket', 'Tema paketi'))
      + H('King’in adı', 'Boş bırakırsan paketin adı: ' + (L.KING && L.KING.PAKET_AD ? (L.KING.PAKET_AD[secim('paket')] || 'King') : 'King'),
        '<input class="ayarlar__girdi" type="text" maxlength="20" data-king-ad placeholder="' + kac(L.KING && L.KING.PAKET_AD ? (L.KING.PAKET_AD[secim('paket')] || 'King') : 'King')
        + '" value="' + kac((() => { try{ return localStorage.getItem('lifeos.king.ad') || ''; }catch(e){ return ''; } })()) + '" aria-label="King’in adı">')
      + H('Kontrast', 'Yüksek: soluk yazılar koyulaşır, kartlar dolar', secimHtml('kontrast', 'Kontrast'))
      + H('Yüzey', 'Yalnız bu modül', cagir(L.ZEMIN, 'yuzeySeciciHtml'))
      + H('Varsayılana dön', 'Tema dışındaki görünüş tercihleri ilk hâline döner; verin değişmez',
        '<button type="button" class="btn btn--sm" data-ayarlar-sifirla>Görünümü sıfırla</button>');
    if(id === 'zemin') return '<div class="zemin-yuvalar">'
      + '<div class="zemin-yuvasi"><div class="zemin-yuvasi__bas"><b>Gündüz</b><small>Açık tema</small></div>' + onizleHtml('gunduz') + cagir(L.ZEMIN, 'manzaraSeciciHtml') + '</div>'
      + '<div class="zemin-yuvasi"><div class="zemin-yuvasi__bas"><b>Gece</b><small>Koyu tema</small></div>' + onizleHtml('gece') + cagir(L.ZEMIN, 'geceSeciciHtml') + '</div></div>'
      + H('Okunaklık perdesi', 'Fotoğrafın üstündeki örtü: az olunca fotoğraf canlı, çok olunca yazı rahat', secimHtml('perde', 'Okunaklık perdesi'))
      + H('Fotoğrafı yumuşat', 'Fotoğraf hafifçe bulanır; kartlar öne çıkar', secimHtml('bulanik', 'Fotoğrafı yumuşat'))
      + H('Zemin', 'Sade: fotoğraf ve cam yok, düz zemin', cagir(L.ZEMIN, 'seciciHtml'))
      + H('Saate göre tema', '07:00–19:00 açık, sonra koyu', cagir(L.ZEMIN, 'otoSeciciHtml'));
    if(id === 'bildirim'){
      const ss = L.SES && L.SES.sessiz ? L.SES.sessiz() : null;
      return (ss ? H('Sessiz saatler', 'Bu aralıkta bütün sesler ve King’in sesli okuması susar; radyo susmaz',
          '<div class="sessiz">' + '<button type="button" class="plan__anahtar' + (ss.acik ? ' is-on' : '') + '" role="switch" aria-checked="' + ss.acik + '" data-sessiz-ac>'
          + '<i aria-hidden="true"></i><span class="sr-only">' + (ss.acik ? 'Açık' : 'Kapalı') + '</span></button>'
          + '<input type="time" class="plan__saat" data-sessiz="bas" value="' + kac(ss.bas) + '" aria-label="Başlangıç">'
          + '<span aria-hidden="true">–</span><input type="time" class="plan__saat" data-sessiz="bit" value="' + kac(ss.bit) + '" aria-label="Bitiş"></div>') : '')
        + H('Sayaçlar ve noktalar', 'Kenardaki bildirim sayısı ve kırmızı nokta', secimHtml('rozet', 'Sayaçlar ve noktalar'));
    }
    if(id === 'hareket') return H('Animasyonlar', 'Az: yalnız gerekli geçişler', cagir(L.ANIMASYON, 'seciciHtml'))
      + G('Hız', 'Arayüz ve ajanlar ayrı; Ayrıntı içindekileri tek tek ayarlar', cagir(L.ANIMASYON, 'hizSeciciHtml'));
    if(id === 'ses') return G('Ses düzeyleri', 'Genel hepsini birlikte kısar; Ayrıntı grubun içindekileri tek tek', cagir(L.SES, 'duzeySeciciHtml'))
      + G('Müzik', 'Kendi parçaların; listeler, açılış kesiti, arka plan', cagir(L.MUZIK, 'ayarHtml'));
    if(id === 'ekip') return G('Kimler gezsin', 'Basınca sayfadan çıkar ya da gelir; yeni minikler açık gelir', cagir(L.MINIK, 'galeriHtml'))
      + H('Minikler', 'Sayfada en çok kaç minik', cagir(L.MINIK, 'seciciHtml'))
      + H('Minik boyu', '', cagir(L.MINIK, 'boySeciciHtml'))
      + H('King’in görünüşü', '', cagir(L.KING, 'gorunusSeciciHtml'));
    if(id === 'hesap'){
      const p = o.profil || {};
      return '<div class="ayarlar__profil"><i class="ayarlar__avatar" aria-hidden="true">' + kac(((p.ad || 'Ben').trim().charAt(0) || 'B').toLocaleUpperCase('tr-TR')) + '</i>'
        + '<span><b>' + kac(p.ad || 'Profil') + '</b><small>' + kac(p.alt || '') + '</small></span>'
        + (p.route ? '<button type="button" class="btn btn--sm" data-act="go" data-route="' + kac(p.route) + '">Profili aç</button>' : '') + '</div>'
        + (hesapVar() ? sayfaSatirlari(HESAP_SAYFALARI) : hesapYok())
        + '<h5 class="plan__alt">Bu cihaz ve kilitler</h5>'
        + (L.KILIT && L.KILIT.ayarHtml ? H('Gizlilik kilidi', 'Bu modül açılırken dört haneli kod sorar', L.KILIT.ayarHtml(modulAdi(), { govde:true })) : '')
        + H('Satın alma ve kart işlemleri', odemeAcik() ? 'Açık; yine de LifeOS’ta ödeme yapan bir araç yok'
            : 'Kapalı: King ve ajanlar ödeme, sipariş ya da kart işine girmez', odemeSecici());
    }
    if(id === 'baglanti') return H('Google ve YouTube', 'Hesap bağlanmaz: King’in bulduğu bağlantılar senin tarayıcında, kendi oturumunla açılır; LifeOS Google’a veri göndermez', '')
      + (hesapVar() ? sayfaSatirlari(BAGLANTI_SAYFALARI) : hesapYok());
    if(id === 'sistem') return '<h4 class="plan__baslik">Sistem planlaması</h4><div class="plan" data-plan-kok><p class="ayarlar__bos">Yükleniyor…</p></div>';
    if(id === 'modul') return (o.modul || []).map(m => H(m.ad, m.not || '',
      '<button type="button" class="btn btn--sm" data-act="go" data-route="' + kac(m.route) + '">Aç</button>')).join('')
      || '<p class="ayarlar__bos">Bu modülün ayrı ayar ekranı yok.</p>';
    return '';
  }

  function html(o){
    o = o || {};
    if(!BOLUMLER.some(b => b.id === secili)) secili = 'gorunum';
    if(secili === 'sistem' && typeof setTimeout === 'function') setTimeout(() => planYukle(), 0);
    const nav = BOLUMLER.map((b, i) => (b.grup && (!i || BOLUMLER[i - 1].grup !== b.grup) ? '<span class="ayarlar__grup" role="presentation">' + kac(b.grup) + '</span>' : '')
      + '<button type="button" class="ayarlar__sekme' + (b.grup ? ' ayarlar__sekme--grupta' : '') + (b.id === secili ? ' is-on' : '') + '" role="tab"'
      + ' id="ayarlar-sekme-' + b.id + '" aria-selected="' + (b.id === secili) + '" aria-controls="ayarlar-bolum-' + b.id + '"'
      + ' data-ayar-bolum="' + b.id + '">' + kac(b.ad) + '</button>').join('');
    const govde = BOLUMLER.map(b => '<section class="ayarlar__bolum" role="tabpanel" id="ayarlar-bolum-' + b.id + '" data-baslik="' + kac(b.ad) + '"'
      + ' aria-labelledby="ayarlar-sekme-' + b.id + '"' + (b.id === secili ? '' : ' hidden') + '>'
      + icerik(b.id, o) + '</section>').join('');
    return '<div class="katman kmenu kmenu--yan ayarlar" role="dialog" aria-label="Ayarlar">'
      + '<header class="ayarlar__bas"><b>Ayarlar</b>'
      + '<button type="button" class="bildirim__kapat" data-katman-kapat aria-label="Ayarları kapat">'
      + (L.KABUK ? L.KABUK.simge('kapat') : '×') + '</button></header>'
      + '<div class="ayarlar__govde"><nav class="ayarlar__nav" role="tablist" aria-label="Ayar bölümleri" aria-orientation="vertical">'
      + '<input type="search" class="ayarlar__ara" data-ayarlar-ara placeholder="Ayarlarda ara" aria-label="Ayarlarda ara" autocomplete="off">' + nav + '</nav>'
      + '<div class="ayarlar__icerik">' + govde + '</div></div></div>';
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
      const satirlar = Array.from(sec.querySelectorAll('.ayarlar__satir, .zemin-yuvasi, .minikgal__kart'));
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
    secili = id;
    panel.querySelectorAll('[data-ayar-bolum]').forEach(b => {
      const on = b.getAttribute('data-ayar-bolum') === id;
      b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panel.querySelectorAll('.ayarlar__bolum').forEach(s => { s.hidden = s.id !== 'ayarlar-bolum-' + id; });
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
        try{ location.reload(); }catch(e){}
        return;
      }
      const sa = t.closest('[data-sessiz-ac]');
      if(sa){ sessizYaz({ acik:sa.getAttribute('aria-checked') !== 'true' }); sa.classList.toggle('is-on'); sa.setAttribute('aria-checked', String(sa.classList.contains('is-on'))); return; }
      const sk = t.closest('[data-ayar-bolum]');
      if(sk){ sekmeSec(sk.closest('.ayarlar'), sk.getAttribute('data-ayar-bolum')); return; }
      const yz = t.closest('[data-yazi-sec]');
      if(yz){
        yaziAyarla(yz.getAttribute('data-yazi-sec'));
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
      else if(e.target.matches('[data-king-ad]')){
        const v = String(e.target.value || '').replace(/[<>"]/g, '').trim().slice(0, 20);
        try{ if(v) localStorage.setItem('lifeos.king.ad', v); else localStorage.removeItem('lifeos.king.ad'); }catch(x){ /* depo kapalı */ }
      }
      else planDegisti(e.target);
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
    SECIMLER, secim, secimAyarla, SIFIRLANAN, ara, _sec:id => { secili = id; } });
})();
