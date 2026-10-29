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
  ]);
  function yazi(){
    let v = null;
    try{ v = localStorage.getItem(YAZI_ANAHTAR); }catch(e){}
    return YAZILAR.some(y => y.id === v) ? v : 'inter';
  }
  function yaziUygula(k){
    if(typeof document === 'undefined') return;
    const kok = document.documentElement;
    if(k === 'inter') kok.removeAttribute('data-yazi'); else kok.setAttribute('data-yazi', k);
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
    return '<div class="ayarlar__yazilar" role="radiogroup" aria-label="Yazı tipi">' + YAZILAR.map(y =>
      '<button type="button" class="ayarlar__yazi' + (y.id === s ? ' is-on' : '') + '" role="radio" aria-checked="' + (y.id === s) + '"'
      + ' data-yazi-sec="' + y.id + '" data-yazi-ornek="' + y.id + '">'
      + '<b>Aa</b><span>' + kac(y.ad) + '</span><small>' + kac(y.not) + '</small></button>').join('') + '</div>';
  }

  /* ---------------------------------------------------------- bölümler */
  /* GRUPLAR (kullanıcı, 2026-10-29: «sistem direkt olmayacak; Sistem altında ses,
     animasyon, plan; sonra Hesap: güvenlik, bağlantılar, Google»). Grup adı
     listede başlıktır, kendisi sekme değildir. */
  const BOLUMLER = Object.freeze([
    { id:'gorunum',  ad:'Görünüm' },
    { id:'ekip',     ad:'Minikler ve King' },
    { id:'ses',      ad:'Ses',         grup:'Sistem' },
    { id:'hareket',  ad:'Animasyon',   grup:'Sistem' },
    { id:'sistem',   ad:'Planlama',    grup:'Sistem' },
    { id:'hesap',    ad:'Güvenlik',    grup:'Hesap' },
    { id:'baglanti', ad:'Bağlantılar', grup:'Hesap' },
    { id:'modul',    ad:'Bu modül' },
  ]);
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
      + H('Zemin', '', cagir(L.ZEMIN, 'seciciHtml'))
      + H('Gündüz arka planı', 'Açık tema; kendi fotoğrafın ya da videon', cagir(L.ZEMIN, 'manzaraSeciciHtml'))
      + H('Gece arka planı', 'Koyu tema; gece rengi fotoğrafı karartmaz', cagir(L.ZEMIN, 'geceSeciciHtml'))
      + H('Saate göre tema', '07:00–19:00 açık, sonra koyu', cagir(L.ZEMIN, 'otoSeciciHtml'))
      + H('Yüzey', 'Yalnız bu modül', cagir(L.ZEMIN, 'yuzeySeciciHtml'));
    if(id === 'hareket') return H('Animasyonlar', 'Az: yalnız gerekli geçişler', cagir(L.ANIMASYON, 'seciciHtml'))
      + G('Hız', 'Arayüz ve ajanlar ayrı; Ayrıntı içindekileri tek tek ayarlar', cagir(L.ANIMASYON, 'hizSeciciHtml'));
    if(id === 'ses') return G('Ses düzeyleri', 'Genel hepsini birlikte kısar; Ayrıntı grubun içindekileri tek tek', cagir(L.SES, 'duzeySeciciHtml'));
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
    const govde = BOLUMLER.map(b => '<section class="ayarlar__bolum" role="tabpanel" id="ayarlar-bolum-' + b.id + '"'
      + ' aria-labelledby="ayarlar-sekme-' + b.id + '"' + (b.id === secili ? '' : ' hidden') + '>'
      + icerik(b.id, o) + '</section>').join('');
    return '<div class="katman kmenu kmenu--yan ayarlar" role="dialog" aria-label="Ayarlar">'
      + '<header class="ayarlar__bas"><b>Ayarlar</b>'
      + '<button type="button" class="bildirim__kapat" data-katman-kapat aria-label="Ayarları kapat">'
      + (L.KABUK ? L.KABUK.simge('kapat') : '×') + '</button></header>'
      + '<div class="ayarlar__govde"><nav class="ayarlar__nav" role="tablist" aria-label="Ayar bölümleri" aria-orientation="vertical">' + nav + '</nav>'
      + '<div class="ayarlar__icerik">' + govde + '</div></div></div>';
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
      .then(v => { plan = v; planCiz(); })
      .catch(() => { const k = planKok(); if(k) k.innerHTML = planYok(); });
  }
  const planYok = () => '<p class="ayarlar__bos">Sistem planlaması LifeOS sunucusunun bu bilgisayarda açık olmasını ister; telefonda ve tek dosya sürümünde yoktur.</p>';
  function gunCipleri(ad, secili, tek){
    return '<div class="plan__gunler" role="group" aria-label="Günler">' + plan.gunler.map((g, i) => {
      const on = tek ? secili === i : secili.indexOf(i) >= 0;
      return '<button type="button" class="plan__gun' + (on ? ' is-on' : '') + '" data-plan-gun="' + ad + '|' + i + '" aria-pressed="' + on + '">' + kac(g) + '</button>';
    }).join('') + '</div>';
  }
  const anahtar = (ad, acik) => '<button type="button" class="plan__anahtar' + (acik ? ' is-on' : '') + '" role="switch" aria-checked="' + acik + '" data-plan-ac="' + ad + '">'
    + '<i aria-hidden="true"></i><span class="sr-only">' + (acik ? 'Açık' : 'Kapalı') + '</span></button>';
  const saatGirdi = (ad, v) => '<input type="time" class="plan__saat" data-plan-saat="' + ad + '" value="' + kac(v) + '" aria-label="Saat">';
  function cizgi(){
    const p = plan.plan, gunler = plan.gunler.map(() => []);
    ['acilis', 'kapanis'].forEach(k => { if(p[k].acik) p[k].gunler.forEach(g => gunler[g].push({ saat:p[k].saat, ad:k === 'acilis' ? 'Açılış' : 'Kapanış', tur:k })); });
    plan.isler.forEach(x => { const i = p.isler[x.id]; if(i.acik) gunler[i.gun].push({ saat:i.saat, ad:x.ad, tur:'is' }); });
    return '<ol class="plan__cizgi" aria-label="Haftalık plan">' + gunler.map((l, i) => '<li><b>' + kac(plan.gunler[i]) + '</b>'
      + l.sort((a, b) => a.saat.localeCompare(b.saat)).map(x => '<span class="plan__olay plan__olay--' + x.tur + '"><time>' + kac(x.saat) + '</time>' + kac(x.ad) + '</span>').join('')
      + '</li>').join('') + '</ol>';
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
    const ucSatir = (k, ad, not) => '<div class="plan__satir"><div class="plan__ad">' + ad + '<small>' + not + '</small></div>' + anahtar(k, p[k].acik)
      + (p[k].acik ? '<div class="plan__ayar">' + gunCipleri(k, p[k].gunler) + saatGirdi(k, p[k].saat) + '</div>' : '') + '</div>';
    const isler = plan.isler.map(x => {
      const i = p.isler[x.id], son = p.son[x.id];
      return '<div class="plan__satir plan__satir--is"><div class="plan__ad">' + kac(x.ad) + '<small>' + kac(x.not) + '</small></div>' + anahtar('is:' + x.id, i.acik)
        + (i.acik ? '<div class="plan__ayar">' + gunCipleri('is:' + x.id, i.gun, true) + saatGirdi('is:' + x.id, i.saat)
          + '<div class="seg plan__kacarsa" role="group" aria-label="Kaçarsa">'
          + ['hemen', 'onay'].map(k => '<button type="button" class="' + (i.kacarsa === k ? 'is-on' : '') + '" data-plan-kacarsa="' + x.id + ':' + k + '" aria-pressed="' + (i.kacarsa === k) + '">'
            + (k === 'hemen' ? 'Kaçarsa ilk müsait an' : 'Kaçarsa onay bekle') + '</button>').join('') + '</div>'
          + (x.id === 'guncelleme' ? '<label class="plan__kur"><input type="checkbox" data-plan-kur' + (i.kur ? ' checked' : '') + '> Yenilik varsa kur</label>' : '')
          + '</div>' : '')
        + '<div class="plan__son">' + (son && son.zaman ? '<span class="' + (son.ok ? 'is-ok' : 'is-sorun') + '">' + (son.ok ? '✓ ' : '✕ ') + kac(saatAd(son.zaman)) + ' · ' + kac(son.mesaj || '') + '</span>' : '<span>Henüz yapılmadı</span>')
        + (plan.calisan.indexOf(x.id) >= 0 ? '<span>Çalışıyor…</span>' : '<button type="button" class="btn btn--sm btn--ghost" data-plan-yap="' + x.id + '">Şimdi yap</button>') + '</div></div>';
    }).join('');
    kok.innerHTML = bekleyen + cizgi()
      + '<h5 class="plan__alt">Açılış ve kapanış</h5>'
      + ucSatir('acilis', 'Açılış', plan.windows ? 'LifeOS kapalıysa Windows açar; bilgisayar açık olmalı' : 'Yalnız Windows’ta')
      + ucSatir('kapanis', 'Kapanış', 'Bu saatte LifeOS kendini kapatır')
      + '<h5 class="plan__alt">Periyodik işler</h5>' + isler
      + '<p class="plan__mesaj" role="status">' + kac(planMesaj) + '</p>';
  }
  function planKaydet(){
    clearTimeout(planZaman);
    planZaman = setTimeout(() => {
      fetch('/api/planlama', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-LifeOS':'planlama' }, body:JSON.stringify(plan.plan) })
        .then(r => r.json().then(v => ({ ok:r.ok, v })))
        .then(({ ok, v }) => { if(ok){ plan.plan = v.plan; planMesaj = v.mesaj || 'Kaydedildi.'; } else planMesaj = v.hata || 'Kaydedilemedi.'; planCiz(); })
        .catch(() => { planMesaj = 'Kaydedilemedi: LifeOS sunucusu yanıt vermedi.'; planCiz(); });
    }, 350);
  }
  function hedef(ad){ return ad.indexOf('is:') === 0 ? plan.plan.isler[ad.slice(3)] : plan.plan[ad]; }
  function planTikla(t){
    if(!plan) return false;
    const ac = t.closest('[data-plan-ac]');
    if(ac){ const h = hedef(ac.getAttribute('data-plan-ac')); h.acik = !h.acik; planCiz(); planKaydet(); return true; }
    const g = t.closest('[data-plan-gun]');
    if(g){
      const [ad, n] = g.getAttribute('data-plan-gun').split('|'), i = Number(n);
      const h = hedef(ad);
      if(ad.indexOf('is:') === 0) h.gun = i;
      else if(h.gunler.indexOf(i) >= 0){ if(h.gunler.length > 1) h.gunler = h.gunler.filter(x => x !== i); }
      else h.gunler = h.gunler.concat(i).sort();
      planCiz(); planKaydet(); return true;
    }
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
    if(t.matches('[data-plan-saat]')){ const h = hedef(t.getAttribute('data-plan-saat')); if(/^\d\d:\d\d$/.test(t.value)){ h.saat = t.value; planCiz(); planKaydet(); } return true; }
    if(t.matches('[data-plan-kur]')){ plan.plan.isler.guncelleme.kur = t.checked; planKaydet(); return true; }
    return false;
  }

  if(typeof document !== 'undefined'){
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      if(planTikla(t)) return;
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
    document.addEventListener('change', e => { if(e.target && e.target.matches) planDegisti(e.target); });
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

  L.AYARLAR = Object.freeze({ html, BOLUMLER, YAZILAR, yazi, yaziAyarla, HESAP_SAYFALARI, BAGLANTI_SAYFALARI, ODEME_ANAHTAR, odemeAcik, odemeAyarla,
    _sec:id => { secili = id; } });
})();
