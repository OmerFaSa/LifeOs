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
  const BOLUMLER = Object.freeze([
    { id:'gorunum', ad:'Görünüm' },
    { id:'hareket', ad:'Animasyon' },
    { id:'ses',     ad:'Ses' },
    { id:'ekip',    ad:'Minikler ve King' },
    { id:'hesap',   ad:'Hesap' },
    { id:'modul',   ad:'Bu modül' },
  ]);
  let secili = 'gorunum';

  const H = (ad, not, denetim) => '<div class="ayarlar__satir"><div class="ayarlar__ad">' + kac(ad)
    + (not ? '<small>' + kac(not) + '</small>' : '') + '</div><div class="ayarlar__deger">' + (denetim || '') + '</div></div>';
  /* Geniş denetim (kaydırıcılar, katmanlı seçiciler): ad üstte, denetim altta tam genişlik. */
  const G = (ad, not, denetim) => H(ad, not, denetim).replace('ayarlar__satir"', 'ayarlar__satir ayarlar__satir--genis"');
  const hesapVar = () => { try{ const d = L.HESAP && L.HESAP.dugme ? L.HESAP.dugme() : null; return !!(d && !d.gizli); }catch(e){ return false; } };
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
        + (hesapVar()
          ? H('Hesap ve eşitleme', 'Cihazlar, iki adımlı doğrulama, yedek',
            '<button type="button" class="btn btn--sm ayarlar__hesap" data-ayarlar-hesap>Hesabı aç</button>')
          : H('Hesap ve eşitleme', 'LifeOS sunucusu kapalı ya da giriş yapılmadı; kayıtlar bu cihazda', ''));
    }
    if(id === 'modul') return (o.modul || []).map(m => H(m.ad, m.not || '',
      '<button type="button" class="btn btn--sm" data-act="go" data-route="' + kac(m.route) + '">Aç</button>')).join('')
      || '<p class="ayarlar__bos">Bu modülün ayrı ayar ekranı yok.</p>';
    return '';
  }

  function html(o){
    o = o || {};
    if(!BOLUMLER.some(b => b.id === secili)) secili = 'gorunum';
    const nav = BOLUMLER.map(b => '<button type="button" class="ayarlar__sekme' + (b.id === secili ? ' is-on' : '') + '" role="tab"'
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
  }

  if(typeof document !== 'undefined'){
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
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
      /* Hesap paneli kabuğun hesap düğmesindedir (hesap.js); yoksa sessiz. */
      if(t.closest('[data-ayarlar-hesap]')){
        const h = document.querySelector('.kenar .ust__hesap:not([hidden])') || document.querySelector('.ust__hesap:not([hidden])');
        if(h){ if(L.KABUK) L.KABUK.katmanKapat(); h.click(); }
      }
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

  L.AYARLAR = Object.freeze({ html, BOLUMLER, YAZILAR, yazi, yaziAyarla, _sec:id => { secili = id; } });
})();
