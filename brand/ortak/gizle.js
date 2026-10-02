/* GİZLENEN BÖLÜMLER — her sayfada kişiselleştirilebilir sadelik.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/gizle.js`; `tools/ortak.py --yay` ile üç arayüzün
   `src/js/core/` klasörüne birebir kopyalanır.

   Depo sahibinin isteği (2026-09-26): sayfalar kalabalık; kullanıcı
   istemediği kartı/bölümü gizleyebilmeli, gizlenenler üst çubuktaki
   «Gizlenen bölümler» düğmesinde durmalı ve oradan geri gelmeli. Her
   sayfada, üç sistemde.

   Sözler:
     1. YALNIZ GÖRÜNÜM. Gizlemek veriyi silmez, hesabı değiştirmez, hiçbir
        uyarıyı susturmaz; bölüm çizilir ve yalnız gösterilmez. Bir karar
        ya da ölçüm gizlendiği için «yok» sayılmaz (AGENTS §1.2, §1.7).
     2. HER ŞEY GERİ GELİR. Gizlenen her bölüm üst çubuktaki panelde adıyla
        durur; «Geri getir» ve «Hepsini göster» tek dokunuştur.
     3. SAYFA SADE KALIR. Normal görünümde bölümlerin üstünde düğme yoktur;
        gizleme düğmeleri yalnız «Bu sayfayı düzenle» açıkken görünür.
     4. SAYFA BAŞINA, SİSTEM BAŞINA. Tercih modül + profil + ekran için
        ayrı saklanır. Bölüm başlığından anahtar üretilir (sayılar ve gün
        adları atılır: «Pazar blokları» ile «Pazartesi blokları» aynı
        bölümdür).
     5. VARSAYILAN SADELİK. Bir ekran bazı bölümleri baştan gizli
        (`varsayilan`) ya da baştan küçük (`kucukVarsayilan`) önerebilir;
        kullanıcı geri getirir ya da açarsa o seçim kalır.
     6. KÜÇÜLTMEK DE KALICIDIR. Küçültülen bölümün yalnız başlığı görünür
        ve kullanıcı açana dek öyle kalır. Üzerine gelince (ya da klavyeyle
        odaklanınca) küçük bir pencerede ÖNİZLEMESİ belirir; önizleme
        salt bakmak içindir (`inert`): içindeki düğme bir şey uygulamaz.
        Gizlenenlerin önizlemesi de paneldeki satırın üzerinde açılır.
        Telefonda küçük bölüme basılı tutmak önizlemeyi açar.
     7. SIRA DA KİŞİSELDİR. Bölümler aynı kap içinde yukarı/aşağı taşınır
        (panelde sürükle-bırak, ↑/↓ düğmeleri; sayfada düzen kipi). Başka
        bir sütuna geçmez: ekranın ızgarası bozulmaz. Sonradan gelen yeni
        bir bölüm kendi yerinde çıkar.
     8. HER DEĞİŞİKLİK GERİ ALINIR. Gizlemek, küçültmek ve «Varsayılana
        dön» altta birkaç saniyelik «Geri al» bildirimi bırakır
        (AGENTS §1.9: küçük aksiyon sormadan uygulanır, geri al kalır).
     9. UYARI SUSTURULMAZ. Gizli ya da küçük bir bölümün içinde kırmızı bir
        uyarı varsa (badge/stat/card --danger, .tone-danger, role=alert):
        küçük şeritte «uyarı» rozeti, üst düğmede kırmızı sayaç, panel
        satırında işaret ve sayfanın sonundaki notta yazı (AGENTS §1.1, §1.7).
    10. GİZLİ OLAN UNUTULMAZ. Sayfada gizli bölüm varsa sayfanın sonunda tek
        satırlık sade bir not durur: kaç bölüm gizli, «Göster».

   Bölüm sayılanlar: başlığı olan `section.lrow` (defter satırı),
   `section.kutu` ve `.card`. İç içe olanlardan yalnız en dıştaki. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.Gizle = (function(){
  const ONEK = 'lifeos.gizli.';
  const GUNLER = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
  const SECICI = 'section.lrow, section.kutu, .card';
  const BASLIK_SEC = ':scope > .lrow__side .lrow__label, :scope > .kutu__bas .kutu__ad, :scope > .card__head h3';
  /* Kırmızı uyarı: gizlemek onu susturamaz (söz 9). */
  const UYARI = '.badge--danger, .stat--danger, .card--danger, .tone-danger, [role="alert"]';

  /* Küçük tek renk simgeler (currentColor): düğmeler yazısız kalır ama
     aria-label ve title ne yaptıklarını söyler. */
  const SIMGE = {
    kucult:'<path d="M5 12h14"/>',
    gizle:'<path d="M3 3l18 18"/><path d="M10.6 5.2A9.8 9.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7a13 13 0 0 1-2.6 3.6M6.4 6.6C4.4 8 3 10 2.5 12c1 2.5 4.5 7 9.5 7 1.7 0 3.2-.5 4.5-1.2"/><path d="M9.9 10a3 3 0 0 0 4.1 4.1"/>',
    goz:'<path d="M2.5 12C3.5 9.5 7 5 12 5s8.5 4.5 9.5 7c-1 2.5-4.5 7-9.5 7s-8.5-4.5-9.5-7z"/><circle cx="12" cy="12" r="3"/>',
    ac:'<path d="M9 6l6 6-6 6"/>',
    yukari:'<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
    asagi:'<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>',
    tut:'<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
    sifirla:'<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    uyari:'<path d="M12 4l9 16H3z"/><path d="M12 10v4"/><path d="M12 17v.5"/>',
    ara:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    duzen:'<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="11" height="6" rx="1.5"/><path d="M18 14v6M15 17h6"/>',
  };
  function svg(ad){
    return '<svg class="gizle-sim" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"'
      + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + SIMGE[ad] + '</svg>';
  }

  let son = null;          // { kok, modul, profil, ekran, varsayilan }
  let duzen = false;       // «Bu sayfayı düzenle» açık mı
  let panel = null;
  let bagli = false;

  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  /* Başlıktan kalıcı anahtar: küçük harf, sayılar ve gün adları atılır. */
  function anahtar(baslik){
    let s = String(baslik || '').toLocaleLowerCase('tr-TR').replace(/[0-9]+/g, ' ');
    GUNLER.slice().sort((a, b) => b.length - a.length).forEach(g => { s = s.split(g).join(' '); });
    return s.replace(/[^a-zçğıöşüâîû]+/g, ' ').trim().replace(/\s+/g, '-');
  }

  function baslikOf(el){
    const b = el.querySelector(BASLIK_SEC);
    if(!b) return '';
    const kopya = b.cloneNode(true);
    /* İpucu ve sözlük balonları (role=tooltip, .terim__kart) başlığın
       parçası değildir: yoksa anahtar balonun metnini de taşır. */
    kopya.querySelectorAll('.hint, button, svg, .sr-only, [role="tooltip"], .terim__kart, [hidden], .gizle-uyari-rozet').forEach(x => x.remove());
    return kopya.textContent.replace(/\s+/g, ' ').trim();
  }

  function depoAdi(o){ return ONEK + (o.modul || 'x') + '.' + (o.profil || 'main') + '.' + (o.ekran || 'x'); }
  function oku(o){
    try{
      const d = JSON.parse(localStorage.getItem(depoAdi(o)) || 'null');
      if(d && typeof d === 'object') return { gizli:d.gizli || {}, acik:d.acik || {}, ad:d.ad || {},
        kucuk:d.kucuk || {}, acikK:d.acikK || {}, sira:Array.isArray(d.sira) ? d.sira : [],
        yer:(d.yer && typeof d.yer === 'object') ? d.yer : {} };
    }catch(e){}
    return { gizli:{}, acik:{}, ad:{}, kucuk:{}, acikK:{}, sira:[], yer:{} };
  }
  /* «Tüm sayfalar» listesinde sayfanın adı: ekranın başlığı (h1). */
  function sayfaAdi(o){
    const h = (o.kok && o.kok.querySelector('h1')) || document.querySelector('#main h1, h1');
    const t = h ? h.textContent.replace(/\s+/g, ' ').trim() : '';
    return (t || String(o.ekran || '')).slice(0, 60);
  }
  function yaz(o, d){
    d.sayfa = sayfaAdi(o) || d.sayfa;
    try{ localStorage.setItem(depoAdi(o), JSON.stringify(d)); }catch(e){ /* depo kapalı: bu oturumda geçerli */ }
  }

  function sil(o){ try{ localStorage.removeItem(depoAdi(o)); }catch(e){} }
  const kopyala = d => JSON.parse(JSON.stringify(d));

  function kucukMu(d, a, varsayilan){
    if(d.kucuk[a]) return true;
    return (varsayilan || []).indexOf(a) >= 0 && !d.acikK[a];
  }

  /* Kayıt yalnız VARSAYILANDAN SAPMAYI tutar: «açık» işareti yalnız ekranın
     baştan gizlediği/küçülttüğü bölüm için yazılır. Yoksa «Tüm sayfalar»
     özeti küçültülen bölümü «açıldı» diye sayardı. */
  function gosterIsaretle(d, a){
    delete d.gizli[a];
    if(son && (son.varsayilan || []).indexOf(a) >= 0) d.acik[a] = true; else delete d.acik[a];
  }
  function acIsaretle(d, a){
    delete d.kucuk[a];
    if(son && (son.kucukVarsayilan || []).indexOf(a) >= 0) d.acikK[a] = true; else delete d.acikK[a];
  }

  function gizliMi(d, a, varsayilan){
    if(d.gizli[a]) return true;
    return (varsayilan || []).indexOf(a) >= 0 && !d.acik[a];
  }

  /* Sayfadaki gizlenebilir bölümler: [{ el, anahtar, baslik }] */
  function bolumler(kok){
    if(!kok) return [];
    const hepsi = Array.from(kok.querySelectorAll(SECICI));
    const out = [];
    const gorulen = {};
    hepsi.forEach(el => {
      if(el.parentElement && el.parentElement.closest(SECICI)) return;   // iç içe: yalnız en dıştaki
      if(el.closest('[data-gizlenmez]')) return;
      const baslik = baslikOf(el);
      const a = anahtar(baslik);
      if(!a || gorulen[a]) return;
      gorulen[a] = true;
      out.push({ el, anahtar:a, baslik });
    });
    return out;
  }

  /* Her çizimden sonra: gizlileri sakla, düzen kipinde düğmeleri koy,
     üst çubuktaki sayacı güncelle. o: { kok, modul, profil, ekran, varsayilan } */
  function uygula(o){
    /* Yeni çizimde eski önizleme ve bekleyen zamanlayıcısı düşer: şeride
       gelinip 250 ms dolmadan sayfa değişirse önceki ekranın bölümü YENİ
       sayfada açılıyordu (ESP Profil'in düğmeleri Genel'de, 2026-10-02). */
    onizlemeKapat();
    son = o;
    const d = oku(o);
    let degisti = false;
    const ilkListe = bolumler(o.kok);
    ilkListe.forEach(b => {
      if(!ILK.has(b.el)) ILK.set(b.el, ilkSayac++);
      if(!DOGAL_KAP.has(b.el)){ const k = kapOf(b); DOGAL_KAP.set(b.el, k); KAPLAR.add(k); }
    });
    yerUygula(ilkListe, d.yer);
    siraUygula(bolumler(o.kok), d.sira);
    const liste = bolumler(o.kok);
    const grup = gruplar(liste);
    let gizliUyari = 0;
    liste.forEach(b => {
      const g = gizliMi(d, b.anahtar, o.varsayilan);
      const k = !g && kucukMu(d, b.anahtar, o.kucukVarsayilan);
      b.el.hidden = g;
      /* [hidden] bir bölümün kendi display kuralını (.lrow{display:flex})
         YENEMEZ: ayrıca işaret konur ve CSS !important ile gizler. Tek
         çocuklu sarmalayıcısı (ızgara hücresi) da gizlenir: boş hücre kalmaz. */
      const tsy = tasiyici(b.el);
      b.el.toggleAttribute('data-gizle-gizli', g);
      if(tsy !== b.el) tsy.toggleAttribute('data-gizle-gizli', g);
      b.el.classList.toggle('gizle-bolum', duzen);
      b.el.classList.toggle('gizle-kucuk', k);
      if(k) b.el.setAttribute('data-gizle-kucuk', b.anahtar); else b.el.removeAttribute('data-gizle-kucuk');
      if(g && d.ad[b.anahtar] !== b.baslik){ d.ad[b.anahtar] = b.baslik; degisti = true; }
      /* Söz 9: gizli/küçük bölümdeki kırmızı uyarı görünür kalır. */
      const uy = (g || k) && uyariVar(b.el);
      if(g && uy) gizliUyari++;
      const eskiRozet = b.el.querySelector('.gizle-uyari-rozet');
      if(eskiRozet) eskiRozet.remove();
      const bEl = b.el.querySelector(BASLIK_SEC);
      if(k && uy && bEl){
        const rz = document.createElement('span');
        rz.className = 'gizle-uyari-rozet';
        rz.title = 'Bu bölümde bir uyarı var';
        rz.textContent = 'uyarı';
        bEl.appendChild(rz);
      }
      const eski = b.el.querySelector(':scope > .gizle-araclar');
      if(eski) eski.remove();
      /* Açık bölüm de araç taşır (kullanıcı, 2026-10-02: «küçültüp açınca
         tekrar küçültme düğmesi olmuyor»): düzen kipi dışında yalnız
         «Küçült», o da yalnız üzerine gelince ya da odakla görünür. */
      const acikSakin = !g && !k && !duzen;
      b.el.classList.toggle('gizle-acik', acikSakin);
      if(!g){
        const arac = document.createElement('div');
        arac.className = 'gizle-araclar' + (acikSakin ? ' gizle-araclar--uzerinde' : '');
        const dugme = (ne, simge, etiket, ipucu) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'gizle-dugme gizle-dugme--' + simge;
          btn.setAttribute(ne, b.anahtar);
          btn.setAttribute('aria-label', etiket);
          btn.title = ipucu;
          btn.innerHTML = svg(simge);
          arac.appendChild(btn);
        };
        if(duzen){
          const g = grup.get(kapOf(b)) || [];
          const i = g.indexOf(b);
          const ks = uyumluKaplar(kapOf(b)), ki = ks.indexOf(kapOf(b));
          if(g.length > 1 || ks.length > 1){
            /* Sürükleme tutamağı: fareyle/parmakla. Klavyede ↑/↓ düğmeleri. */
            const tut = document.createElement('span');
            tut.className = 'gizle-tut';
            tut.setAttribute('aria-hidden', 'true');
            tut.title = 'Sürükle';
            tut.innerHTML = svg('tut');
            arac.appendChild(tut);
            dugme('data-tasi-yukari', 'yukari', '«' + b.baslik + '» bölümünü yukarı taşı', 'Yukarı taşı');
            dugme('data-tasi-asagi', 'asagi', '«' + b.baslik + '» bölümünü aşağı taşı', 'Aşağı taşı');
            const bt = arac.querySelectorAll('button');
            bt[bt.length - 2].disabled = i <= 0 && ki <= 0;
            bt[bt.length - 1].disabled = i >= g.length - 1 && ki >= ks.length - 1;
          }
        }
        if(k) dugme('data-ac', 'ac', '«' + b.baslik + '» bölümünü aç', 'Aç');
        else dugme('data-kucult', 'kucult', '«' + b.baslik + '» bölümünü küçült', 'Küçült');
        if(duzen) dugme('data-gizle', 'gizle', '«' + b.baslik + '» bölümünü gizle', 'Gizle');
        b.el.insertBefore(arac, b.el.firstChild);
      }
    });
    if(degisti) yaz(o, d);
    if(o.kok) o.kok.classList.toggle('gizle-duzen', duzen);
    /* Raf düzeni (hareket.js) uzun kutuyu keser; küçülen ya da gizlenen
       bölümden SONRA yeniden ölçülmeli. Önce ölçülürse küçülen kart
       «Tamamını göster»in arkasında kalıyordu (2026-10-02). */
    /* «Nasıl okunur» şeridi ⓘ'ye (kabuk.railBilgiye): raf ölçmeden önce. */
    try{ const KB = window.LIFEOS && window.LIFEOS.KABUK; if(KB && KB.railBilgiye && o.kok) KB.railBilgiye(o.kok); }catch(e){}
    try{ const H = window.LIFEOS && window.LIFEOS.HAREKET; if(H && H.raf && o.kok) H.raf(o.kok); }catch(e){}
    dipCiz(o, liste, gizliUyari);
    sayacYaz(gizliListe().length, gizliUyari);
    if(panel) panelCiz();
    bagla();
    return liste.length;
  }

  function uyariVar(el){
    try{ return el.matches(UYARI) || !!el.querySelector(UYARI); }catch(e){ return false; }
  }

  /* Söz 10: sayfada gizli bölüm varsa sayfanın sonunda tek satırlık not. */
  function dipCiz(o, liste, uyariSay){
    if(!o.kok) return;
    let dip = o.kok.querySelector(':scope > .gizle-dip');
    const gizli = liste.filter(b => b.el.hidden);
    if(!gizli.length){ if(dip) dip.remove(); return; }
    if(!dip){
      dip = document.createElement('div');
      dip.className = 'gizle-dip';
      dip.setAttribute('data-gizlenmez', '');
    }
    if(o.kok.lastElementChild !== dip) o.kok.appendChild(dip);
    dip.classList.toggle('gizle-dip--uyari', !!uyariSay);
    const ne = gizli.length === 1 ? '«' + kac(gizli[0].baslik) + '» gizli' : gizli.length + ' bölüm gizli';
    const uy = !uyariSay ? '' : gizli.length === 1 ? ' · içinde uyarı var' : ' · ' + uyariSay + ' tanesinde uyarı var';
    dip.innerHTML = svg(uyariSay ? 'uyari' : 'gizle') + '<span>' + ne + uy + '</span>'
      + '<button type="button" data-gizle-dip>Göster</button>';
  }

  /* FLIP: yer değiştiren öğeler eski yerinden yenisine kayar (kısa, sade).
     Hareketi azaltma tercihinde animasyon yok. */
  function azHareket(){
    try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return true; }
  }
  function flip(els, degistir){
    const canli = !azHareket() && els.length > 0 && typeof els[0].animate === 'function';
    const once = canli ? els.map(el => el.getBoundingClientRect()) : null;
    degistir();
    if(!canli) return;
    els.forEach((el, i) => {
      if(!el.isConnected) return;
      const a = once[i], b = el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if(Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform:'translate(' + dx + 'px,' + dy + 'px)' }, { transform:'none' }],
        { duration:220, easing:'cubic-bezier(.2,.7,.2,1)' });
    });
  }
  function satirKonum(){
    const m = new Map();
    if(panel) panel.querySelectorAll('[data-satir]').forEach(li => m.set(li.getAttribute('data-satir'), li.getBoundingClientRect()));
    return m;
  }
  function satirFlip(once){
    if(!panel || !once || azHareket()) return;
    panel.querySelectorAll('[data-satir]').forEach(li => {
      const a = once.get(li.getAttribute('data-satir'));
      if(!a || typeof li.animate !== 'function') return;
      const dy = a.top - li.getBoundingClientRect().top;
      if(Math.abs(dy) >= 1) li.animate([{ transform:'translateY(' + dy + 'px)' }, { transform:'none' }],
        { duration:200, easing:'cubic-bezier(.2,.7,.2,1)' });
    });
  }

  /* Hazır görünümler: «Önerilen» (ekranın varsayılanı), «Başlıklar»
     (açık olan her bölüm başlığa iner; gizli gizli kalır), «Tümü açık». */
  function hazir(ad){
    if(!son) return;
    if(ad === 'onerilen'){ varsayilanaDon(); return; }
    const d = oku(son);
    const onceki = kopyala(d);
    bolumler(son.kok).forEach(b => {
      const a = b.anahtar;
      if(ad === 'acik'){ gosterIsaretle(d, a); acIsaretle(d, a); }
      else if(ad === 'basliklar' && !gizliMi(d, a, son.varsayilan)){ d.kucuk[a] = true; delete d.acikK[a]; }
    });
    yaz(son, d);
    onizlemeKapat();
    uygula(son);
    geriAlBildir(ad === 'acik' ? 'Bütün bölümler açıldı' : 'Bütün bölümler başlığa indi', onceki);
  }
  function degismisMi(d){
    return !!(Object.keys(d.gizli).length || Object.keys(d.acik).length || Object.keys(d.kucuk).length
      || Object.keys(d.acikK).length || d.sira.length || Object.keys(d.yer || {}).length);
  }
  function hazirHali(){
    if(!son) return null;
    const d = oku(son);
    if(!degismisMi(d)) return 'onerilen';
    const h = bolumler(son.kok).map(b => gizliMi(d, b.anahtar, son.varsayilan) ? 'gizli'
      : kucukMu(d, b.anahtar, son.kucukVarsayilan) ? 'kucuk' : 'acik');
    if(h.every(x => x === 'acik')) return 'acik';
    if(h.some(x => x === 'kucuk') && h.every(x => x !== 'acik')) return 'basliklar';
    return 'ozel';
  }

  /* Tüm sayfalar: bu modül + profil için düzeni değişmiş ekranlar. */
  function onekSayfa(){ return ONEK + ((son && son.modul) || 'x') + '.' + ((son && son.profil) || 'main') + '.'; }
  function depoAnahtarlari(){
    const on = onekSayfa(), out = [];
    try{ for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(k && k.indexOf(on) === 0) out.push(k); } }catch(e){}
    return out;
  }
  function sayfalar(){
    if(!son) return [];
    const on = onekSayfa();
    const say = o => (o && typeof o === 'object') ? Object.keys(o).length : 0;
    const out = [];
    depoAnahtarlari().forEach(k => {
      let d = null;
      try{ d = JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){}
      if(!d || typeof d !== 'object') return;
      const x = { ekran:k.slice(on.length), gizli:say(d.gizli), kucuk:say(d.kucuk),
        acildi:say(d.acik) + say(d.acikK), sira:(Array.isArray(d.sira) && d.sira.length > 0) || say(d.yer) > 0 };
      if(!x.gizli && !x.kucuk && !x.acildi && !x.sira) return;
      x.ad = d.sayfa || x.ekran;
      x.bu = x.ekran === son.ekran;
      out.push(x);
    });
    return out.sort((a, b) => (b.bu - a.bu) || a.ad.localeCompare(b.ad, 'tr'));
  }
  function geriYukle(eski){
    return () => { try{ Object.keys(eski).forEach(k => localStorage.setItem(k, eski[k])); }catch(e){} };
  }
  function sayfaSifirla(ekran){
    if(!son) return;
    const k = onekSayfa() + ekran;
    const x = sayfalar().find(y => y.ekran === ekran);
    const eski = {};
    try{ const v = localStorage.getItem(k); if(v != null) eski[k] = v; localStorage.removeItem(k); }catch(e){}
    uygula(son);
    geriAlBildir('«' + (x ? x.ad : ekran) + '» varsayılan düzenine döndü', geriYukle(eski));
  }
  function hepsiniSifirla(){
    if(!son) return;
    const eski = {};
    depoAnahtarlari().forEach(k => { try{ eski[k] = localStorage.getItem(k); localStorage.removeItem(k); }catch(e){} });
    uygula(son);
    geriAlBildir('Bütün sayfalar varsayılan düzenine döndü', geriYukle(eski));
  }

  /* Sayfada sürükle-bırak ve testler için: a, h'nin önüne (once) ya da
     arkasına. Yalnız aynı kap içinde. */
  function birak(a, h, once){
    if(!son || a === h) return false;
    const liste = bolumler(son.kok);
    const b = liste.find(x => x.anahtar === a), t = liste.find(x => x.anahtar === h);
    if(!b || !t) return false;
    const kb = kapOf(b), kt = kapOf(t);
    if(kb !== kt && uyumluKaplar(kb).indexOf(kt) < 0) return false;
    const k = (gruplar(liste).get(kt) || []).map(x => x.anahtar).filter(x => x !== a);
    const i = k.indexOf(h);
    k.splice(once ? i : i + 1, 0, a);
    siraYaz(k, kb !== kt || DOGAL_KAP.get(b.el) !== kt ? { anahtar:a, kap:kt } : null);
    return true;
  }

  /* Taşınan birim: bölüm, kendi sarmalayıcısının TEK çocuğuysa sarmalayıcı
     (ızgaradaki Span gibi) — yoksa kart sarmalayıcısından kopar, ızgara
     bozulurdu. Kök (#main) aşılmaz. */
  function tasiyici(el){
    let t = el;
    const kok = son && son.kok;
    while(t.parentElement && t.parentElement !== kok && t.parentElement.children.length === 1
      && !KAPLAR.has(t.parentElement)) t = t.parentElement;
    return t;
  }
  /* ALANLAR ARASI TAŞIMA (depo sahibinin isteği, 2026-09-27: «taşınabilir
     olmalı»). Bir bölüm yalnız kendi kabında değil, AYNI TÜRDEKİ komşu
     kaplarda da (ör. Bugün'ün «Şimdi» ve «Durum» alanları: ikisi de
     section.bugun__alan) yer alabilir. Tür = etiket + sınıflar. Hedef kap
     yalnız sayfanın bölümlerinin DOĞAL kaplarından seçilir: bir formun ya
     da kartın içindeki rastgele bir kaba bölüm düşmez. Yer kalıcıdır
     (d.yer: anahtar -> «tür#sıra»); «Varsayılana dön» doğal kabına döndürür. */
  const DOGAL_KAP = new WeakMap();
  const KAPLAR = new WeakSet();
  function imzaTur(kap){
    return kap.tagName.toLowerCase() + '.' + Array.from(kap.classList).filter(c => c.indexOf('gizle') !== 0).sort().join('.');
  }
  function kapImza(kap){
    const tur = imzaTur(kap);
    const hepsi = Array.from(son.kok.querySelectorAll(kap.tagName)).filter(k => imzaTur(k) === tur);
    return tur + '#' + hepsi.indexOf(kap);
  }
  function kapBul(imza){
    const i = String(imza).lastIndexOf('#');
    if(i < 0 || !son) return null;
    const tur = imza.slice(0, i), n = Number(imza.slice(i + 1));
    const hepsi = Array.from(son.kok.querySelectorAll(tur.split('.')[0])).filter(k => imzaTur(k) === tur);
    return hepsi[n] || null;
  }
  function uyumluKaplar(kap){
    if(!son || !kap) return kap ? [kap] : [];
    const tur = imzaTur(kap);
    const set = new Set([kap]);
    bolumler(son.kok).forEach(b => {
      const dk = DOGAL_KAP.get(b.el);
      if(dk && dk.isConnected) set.add(dk);
      set.add(kapOf(b));
    });
    return Array.from(set).filter(k => k && imzaTur(k) === tur && son.kok.contains(k))
      .sort((a, b) => (a.compareDocumentPosition(b) & 4) ? -1 : 1);
  }
  /* Kayıtlı yer uygulanır; kaydı olmayan ama doğal kabının dışında duran
     bölüm (varsayılana dön) doğal kabına döner. */
  function yerUygula(liste, yer){
    liste.forEach(b => {
      const hedef = (yer && yer[b.anahtar]) ? kapBul(yer[b.anahtar]) : DOGAL_KAP.get(b.el);
      if(!hedef || !hedef.isConnected || b.el.contains(hedef)) return;
      if(kapOf(b) !== hedef) hedef.appendChild(tasiyici(b.el));
    });
  }
  function kapOf(b){ return tasiyici(b.el).parentElement; }
  /* Aynı kaptaki bölümler bir grup: taşıma yalnız grup içinde. */
  function gruplar(liste){
    const m = new Map();
    liste.forEach(b => {
      const p = kapOf(b);
      if(!p) return;
      if(!m.has(p)) m.set(p, []);
      m.get(p).push(b);
    });
    return m;
  }
  /* Kayıtlı sırayı uygular. Her bölümün DOĞAL yeri, ilk görüldüğü
     çizimdeki sırasıdır (ILK); kayıtlı sırada adı geçen bölümler kendi
     kapladıkları doğal yerlere kayıtlı sırayla dizilir, adı geçmeyen
     (yeni) bölümler doğal yerinde kalır. Sıra silinince (varsayılana dön)
     aynı yol doğal sırayı geri kurar. Yer tutucu yorumlarla: aradaki
     başka öğeler kıpırdamaz. */
  const ILK = new WeakMap();
  let ilkSayac = 0;
  /* Kapta bölüm OLMAYAN ama içinde bölüm taşıyan bir çocuk (ör. iki kartın
     yan yana durduğu «ikili» sarmalayıcı) da sıranın parçasıdır: anahtarı
     «blok:<içindeki ilk bölüm>». Yoksa sürüklenen kart yeniden çizimde
     o sarmalayıcıya göre yer değiştirirdi. */
  function kapUyeleri(kap, g, liste){
    const uyeT = new Set(g.map(b => tasiyici(b.el)));
    const out = g.map(b => ({ anahtar:b.anahtar, el:b.el, t:tasiyici(b.el) }));
    Array.from(kap.children).forEach(ch => {
      if(uyeT.has(ch)) return;
      const ic = liste.find(b => ch.contains(b.el));
      if(ic) out.push({ anahtar:'blok:' + ic.anahtar, el:ic.el, t:ch });
    });
    return out;
  }
  function siraUygula(liste, sira){
    sira = sira || [];
    let oynadi = false;
    gruplar(liste).forEach((g, kap) => {
      const tum = kapUyeleri(kap, g, liste);
      if(tum.length < 2) return;
      const simdi = tum.slice().sort((a, b) => (a.t.compareDocumentPosition(b.t) & 4) ? -1 : 1);
      const dogal = tum.slice().sort((x, y) => ILK.get(x.el) - ILK.get(y.el));
      const bilinenYer = [], bilinen = [];
      dogal.forEach((b, i) => { if(sira.indexOf(b.anahtar) >= 0){ bilinenYer.push(i); bilinen.push(b); } });
      bilinen.sort((x, y) => sira.indexOf(x.anahtar) - sira.indexOf(y.anahtar));
      const hedef = dogal.slice();
      bilinenYer.forEach((yerI, k) => { hedef[yerI] = bilinen[k]; });
      if(hedef.every((b, i) => b === simdi[i])) return;
      const yer = simdi.map(b => {
        const c = document.createComment('gizle-sira');
        b.t.parentNode.insertBefore(c, b.t);
        return c;
      });
      hedef.forEach((b, i) => yer[i].parentNode.insertBefore(b.t, yer[i]));
      yer.forEach(c => c.remove());
      oynadi = true;
    });
    return oynadi;
  }
  /* Sayfada sürükle-bırak bitince: bölümün ŞU ANKİ kabındaki sıra (ikili
     sarmalayıcılar dahil) olduğu gibi kaydedilir; kap değiştiyse yeri de. */
  function sayfadaBirakildi(a){
    if(!son) return false;
    const liste = bolumler(son.kok);
    const b = liste.find(x => x.anahtar === a);
    if(!b) return false;
    const kap = kapOf(b);
    const g = gruplar(liste).get(kap) || [];
    const sira = kapUyeleri(kap, g, liste).sort((x, y) => (x.t.compareDocumentPosition(y.t) & 4) ? -1 : 1).map(x => x.anahtar);
    siraYaz(sira, { anahtar:a, kap });
    return true;
  }
  /* Bir grubun yeni sırasını kaydeder (anahtar listesi). */
  function siraYaz(anahtarlar, yer){
    if(!son) return;
    const d = oku(son);
    if(yer){
      const b = bolumler(son.kok).find(x => x.anahtar === yer.anahtar);
      const dk = b && DOGAL_KAP.get(b.el);
      if(!dk || yer.kap === dk) delete d.yer[yer.anahtar]; else d.yer[yer.anahtar] = kapImza(yer.kap);
    }
    d.sira = d.sira.filter(k => anahtarlar.indexOf(k) < 0).concat(anahtarlar);
    const els = bolumler(son.kok).map(b => tasiyici(b.el));
    const satir = satirKonum();
    flip(els, () => { yaz(son, d); uygula(son); });
    satirFlip(satir);
  }
  function tasi(a, yon){
    if(!son) return false;
    const liste = bolumler(son.kok);
    const b = liste.find(x => x.anahtar === a);
    if(!b) return false;
    const g = gruplar(liste).get(kapOf(b)) || [];
    const i = g.indexOf(b), j = i + (yon < 0 ? -1 : 1);
    if(i < 0) return false;
    if(j < 0 || j >= g.length){
      const ks = uyumluKaplar(kapOf(b));
      const hedef = ks[ks.indexOf(kapOf(b)) + (yon < 0 ? -1 : 1)];
      if(!hedef) return false;
      const hk = (gruplar(liste).get(hedef) || []).map(x => x.anahtar);
      if(yon < 0) hk.push(a); else hk.unshift(a);
      siraYaz(hk, { anahtar:a, kap:hedef });
      return true;
    }
    const k = g.map(x => x.anahtar);
    k[i] = g[j].anahtar; k[j] = a;
    siraYaz(k);
    return true;
  }

  /* Üç konum: 'acik' | 'kucuk' | 'gizli'. */
  function durumu(a){
    if(!son) return null;
    const d = oku(son);
    if(gizliMi(d, a, son.varsayilan)) return 'gizli';
    return kucukMu(d, a, son.kucukVarsayilan) ? 'kucuk' : 'acik';
  }
  function durumAyarla(a, hal, bildir){
    if(!son) return;
    const d = oku(son);
    const onceki = kopyala(d);
    if(hal === 'gizli'){ d.gizli[a] = true; delete d.acik[a]; }
    else {
      gosterIsaretle(d, a);
      if(hal === 'kucuk'){ d.kucuk[a] = true; delete d.acikK[a]; }
      else acIsaretle(d, a);
    }
    yaz(son, d);
    onizlemeKapat();
    uygula(son);
    if(bildir){
      const ad = baslikBul(a);
      geriAlBildir('«' + ad + '» ' + ({ gizli:'gizlendi', kucuk:'küçültüldü', acik:'açıldı' })[hal], onceki);
    }
  }
  function baslikBul(a){
    const b = son && bolumler(son.kok).find(x => x.anahtar === a);
    if(b) return b.baslik;
    const d = son ? oku(son) : null;
    return (d && d.ad[a]) || a;
  }
  function varsayilanaDon(){
    if(!son) return;
    const onceki = kopyala(oku(son));
    sil(son);
    onizlemeKapat();
    uygula(son);
    geriAlBildir('Sayfa varsayılan düzenine döndü', onceki);
  }

  /* «Geri al» bildirimi: önceki kaydı saklar; basılırsa aynen geri yazar. */
  let geriSayac = null;
  function geriAlBildir(metin, onceki){
    let t = document.querySelector('.gizle-geri');
    if(!t){
      t = document.createElement('div');
      t.className = 'gizle-geri';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.innerHTML = '<span>' + kac(metin) + '</span><button type="button" data-geri-al>Geri al</button>';
    const sahip = son;
    t._geri = typeof onceki === 'function' ? onceki : () => { if(sahip) yaz(sahip, onceki); };
    clearTimeout(geriSayac);
    geriSayac = setTimeout(() => { if(t.parentNode) t.remove(); }, 6000);
  }
  function geriAl(t){
    if(t && t._geri){ t._geri(); if(son) uygula(son); }
    clearTimeout(geriSayac);
    if(t) t.remove();
  }

  function gizliListe(){
    if(!son) return [];
    const d = oku(son);
    return bolumler(son.kok).filter(b => gizliMi(d, b.anahtar, son.varsayilan))
      .map(b => ({ anahtar:b.anahtar, baslik:b.baslik }));
  }

  function kucult(a, v){
    if(!son) return;
    const d = oku(son);
    if(v === false) acIsaretle(d, a);
    else { d.kucuk[a] = true; delete d.acikK[a]; }
    yaz(son, d);
    onizlemeKapat();
    uygula(son);
  }

  /* ---------- önizleme: küçük pencerede kartın kendisi ---------- */
  let onizleme = null, onizSayac = null;
  function onizlemeAc(kaynak, yakin){
    onizlemeKapat();
    if(!kaynak || !kaynak.isConnected) return;   // çizimden düşmüş bölüm önizlenmez
    const kopya = kaynak.cloneNode(true);
    kopya.hidden = false;
    kopya.removeAttribute('data-gizle-gizli');
    kopya.classList.remove('gizle-vurgu');
    kopya.classList.remove('gizle-kucuk', 'gizle-bolum');
    kopya.removeAttribute('id');
    kopya.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
    kopya.querySelectorAll('.gizle-araclar').forEach(x => x.remove());
    onizleme = document.createElement('div');
    onizleme.className = 'gizle-onizleme';
    onizleme.setAttribute('role', 'tooltip');
    onizleme.setAttribute('inert', '');
    /* Ekranın stilleri çoğu zaman atalara bağlıdır (.site--v5 .ledger
       .lrow): kopya, kaynağın iki atasının sınıflarını taşıyan kaplara
       konur ve önizleme sitenin içine eklenir; böylece kart kendi
       görünümüyle çizilir. */
    let ic = kopya;
    let ata = kaynak.parentElement;
    for(let i = 0; i < 2 && ata && ata.id !== 'main'; i++, ata = ata.parentElement){
      const kap = document.createElement('div');
      kap.className = ata.className;
      kap.classList.add('gizle-onizleme__kap');
      kap.appendChild(ic);
      ic = kap;
    }
    const bas = document.createElement('div');
    bas.className = 'gizle-onizleme__bas';
    bas.innerHTML = '<span>Önizleme</span><b>' + kac(baslikOf(kaynak)) + '</b>';
    onizleme.appendChild(bas);
    const govde = document.createElement('div');
    govde.className = 'gizle-onizleme__govde';
    govde.appendChild(ic);
    onizleme.appendChild(govde);
    (document.querySelector('.site') || document.body).appendChild(onizleme);
    const r = yakin.getBoundingClientRect();
    const g = onizleme.offsetWidth, y = onizleme.offsetHeight;
    let sol = Math.min(Math.max(8, r.left), window.innerWidth - g - 8);
    let ust = r.bottom + 6;
    /* Paneldeki satırdan açıldıysa panelin YANINA konur: altına konsa
       paneldeki öteki satırları örterdi. Yer yoksa (telefon) panelin altı. */
    const pk = panel && panel.contains(yakin) ? panel.getBoundingClientRect() : null;
    if(pk && pk.left - g - 8 >= 8){ sol = pk.left - g - 8; ust = r.top; }
    else if(pk){ ust = pk.bottom + 6; }
    if(ust + y > window.innerHeight - 8) ust = Math.max(8, (pk ? window.innerHeight - y - 8 : r.top - y - 6));
    onizleme.style.left = Math.round(sol) + 'px';
    onizleme.style.top = Math.round(ust) + 'px';
  }
  function onizlemeKapat(){
    clearTimeout(onizSayac);
    if(onizleme){ onizleme.remove(); onizleme = null; }
  }
  function onizlemeZamanla(kaynak, yakin){
    clearTimeout(onizSayac);
    onizSayac = setTimeout(() => onizlemeAc(kaynak, yakin), 250);
  }
  function kaynakBul(a){
    const b = son && bolumler(son.kok).find(x => x.anahtar === a);
    return b ? b.el : null;
  }

  function gizle(a){
    if(!son) return;
    const d = oku(son);
    d.gizli[a] = true; delete d.acik[a];
    yaz(son, d);
    uygula(son);
  }
  function goster(a){
    if(!son) return;
    const d = oku(son);
    gosterIsaretle(d, a);
    yaz(son, d);
    uygula(son);
  }
  function hepsiniGoster(){
    if(!son) return;
    const d = oku(son);
    gizliListe().forEach(b => gosterIsaretle(d, b.anahtar));
    yaz(son, d);
    uygula(son);
  }
  /* Düzenleme başlayınca panel kapanır (kartların köşesindeki düğmeleri
     örtmesin); ekranın altında «Bitti» çubuğu kalır. */
  function duzenle(v){
    duzen = v == null ? !duzen : !!v;
    if(duzen) panelKapat();
    if(son) uygula(son);
    bitirCubugu();
  }
  function bitirCubugu(){
    let c = document.getElementById('gizle-bitir');
    if(!duzen){ if(c) c.remove(); return; }
    if(!c){
      c = document.createElement('div');
      c.id = 'gizle-bitir';
      c.className = 'gizle-bitir';
      c.setAttribute('role', 'status');
      c.innerHTML = '<span><b>Düzen kipi</b><i> · taşı, küçült ya da gizle</i></span>'
        + '<button type="button" data-duzen-bitir>Bitti</button>';
      document.body.appendChild(c);
    }
  }

  /* Üst çubuk düğmesi `kabuk.js` ustSerit'te çizilir; sayı burada yazılır. */
  function sayacYaz(n, uyari){
    document.querySelectorAll('.ust__gizli').forEach(b => {
      b.classList.toggle('is-uyari', !!uyari);
      const s = b.querySelector('.ust__gizli-sayi');
      if(s) s.textContent = n ? String(n) : '';
      b.classList.toggle('is-dolu', !!n);
      b.setAttribute('aria-label', n ? 'Sayfa düzeni, ' + n + ' gizli bölüm' + (uyari ? ', gizlilerde uyarı var' : '') : 'Sayfa düzeni');
    });
  }

  function kucukListe(){
    if(!son) return [];
    return bolumler(son.kok).filter(b => b.el.classList.contains('gizle-kucuk'))
      .map(b => ({ anahtar:b.anahtar, baslik:b.baslik }));
  }

  /* Panel iki sekmedir:
     «Bu sayfa»   — hazır görünümler, (uzunsa) arama, sayfanın BÜTÜN
                    bölümleri sayfa sırasıyla: tutamak, ↑/↓, üç konum.
     «Tüm sayfalar» — düzeni değişmiş ekranlar; tek tek ya da hepsi sıfırlanır. */
  let panelSekme = 'sayfa';
  let aramaMetni = '';
  function panelCiz(){
    const odakAra = panel && document.activeElement && document.activeElement.classList
      && document.activeElement.classList.contains('gd-ara');
    const liste = son ? bolumler(son.kok) : [];
    const sayfaListe = sayfalar();
    const kapat = '<button type="button" class="gd-kapat" data-panel-kapat aria-label="Kapat" title="Kapat (Esc)"></button>';
    const sekme = (id, yazi, sayi) => '<button type="button" role="tab" id="gd-s-' + id + '" data-sekme="' + id + '"'
      + ' aria-selected="' + (panelSekme === id) + '" aria-controls="gd-icerik" tabindex="' + (panelSekme === id ? 0 : -1) + '">'
      + yazi + (sayi ? '<b>' + sayi + '</b>' : '') + '</button>';
    let bas = '<div class="gd-bas"><div><p class="gd-baslik">Sayfa düzeni</p>';
    let icerik = '';

    if(panelSekme === 'sayfa'){
      const g = gruplar(liste);
      const d = son ? oku(son) : null;
      const hal = b => gizliMi(d, b.anahtar, son.varsayilan) ? 'gizli'
        : kucukMu(d, b.anahtar, son.kucukVarsayilan) ? 'kucuk' : 'acik';
      const sayi = { acik:0, kucuk:0, gizli:0 };
      let onceki = null, gi = -1;
      const satirlar = liste.map(b => {
        const h = hal(b); sayi[h]++;
        const kp = kapOf(b);
        const kap = g.get(kp) || [b];
        const yeniGrup = kp !== onceki && gi >= 0;
        if(kp !== onceki){ onceki = kp; gi++; }
        const ks = uyumluKaplar(kp), ki = ks.indexOf(kp);
        const i = kap.indexOf(b), tek = kap.length < 2 && ks.length < 2;
        const ustYok = i <= 0 && ki <= 0, altYok = i >= kap.length - 1 && ki >= ks.length - 1;
        const ad = kac(b.baslik);
        const uy = h !== 'acik' && uyariVar(b.el);
        const sec = (v, simge, yazi) => '<button type="button" data-hal-sec="' + v + '" aria-pressed="' + (h === v) + '"'
          + ' title="' + yazi + '" aria-label="«' + ad + '»: ' + yazi + '">' + svg(simge) + '</button>';
        return '<li class="gd-satir' + (yeniGrup ? ' gd-satir--yeni-grup' : '') + '" data-satir="' + kac(b.anahtar) + '" data-hal="' + h + '" data-grup="' + gi + '"'
          + (h !== 'acik' ? ' data-onizle="' + kac(b.anahtar) + '"' : '') + (uy ? ' data-uyari' : '') + ' tabindex="0">'
          + '<span class="gd-tut' + (tek ? ' gd-tut--yok' : '') + '" aria-hidden="true" title="Sürükle">' + svg('tut') + '</span>'
          + '<span class="gd-ad">' + ad + '</span>'
          + (uy ? '<span class="gd-uyari" title="Bu bölümde bir uyarı var">' + svg('uyari') + 'uyarı</span>' : '')
          + '<span class="gd-tasi">'
          +   '<button type="button" data-yukari' + (tek || ustYok ? ' disabled' : '') + ' title="Yukarı taşı (Alt+↑)" aria-label="«' + ad + '» yukarı taşı">' + svg('yukari') + '</button>'
          +   '<button type="button" data-asagi' + (tek || altYok ? ' disabled' : '') + ' title="Aşağı taşı (Alt+↓)" aria-label="«' + ad + '» aşağı taşı">' + svg('asagi') + '</button>'
          + '</span>'
          + '<span class="gd-hal" role="group" aria-label="«' + ad + '» görünümü">'
          +   sec('acik', 'goz', 'Açık') + sec('kucuk', 'kucult', 'Küçük') + sec('gizli', 'gizle', 'Gizli')
          + '</span></li>';
      });
      const ozet = liste.length
        ? liste.length + ' bölüm' + (sayi.kucuk ? ' · ' + sayi.kucuk + ' küçük' : '') + (sayi.gizli ? ' · ' + sayi.gizli + ' gizli' : '')
        : '';
      bas += ozet ? '<p class="gd-ozet">' + ozet + '</p>' : '';
      const hh = hazirHali();
      const hz = (id, yazi, ipucu) => '<button type="button" data-hazir="' + id + '" aria-pressed="' + (hh === id) + '" title="' + ipucu + '">' + yazi + '</button>';
      icerik = liste.length
        ? '<div class="gd-hazir-sat"><div class="gd-hazir" role="group" aria-label="Hazır görünüm">'
          + hz('onerilen', 'Önerilen', 'Ekranın önerdiği düzen')
          + hz('basliklar', 'Başlıklar', 'Her bölüm tek satıra iner; sayfanın haritası')
          + hz('acik', 'Tümü açık', 'Hiçbir şey gizli ya da küçük değil')
          + '</div>' + (hh === 'ozel' ? '<span class="gd-ozel" title="Kendi düzenin">Özel</span>' : '') + '</div>'
          + (liste.length >= 8 ? '<label class="gd-ara-kap">' + svg('ara')
            + '<input type="text" class="gd-ara" autocomplete="off" spellcheck="false" placeholder="Bölüm ara" aria-label="Bölüm ara" value="' + kac(aramaMetni) + '"></label>' : '')
          + '<ul class="gd-liste">' + satirlar.join('') + '</ul>'
          + '<p class="gd-arabos" hidden>Bu adla bir bölüm yok.</p>'
          + '<p class="gd-ipucu">Sürükle ya da ↑↓ ile sırala · üzerine gel: sayfada gör</p>'
          + '<div class="gizle-alt"><button type="button" data-duzen aria-pressed="' + (duzen ? 'true' : 'false') + '">' + svg('duzen')
          + (duzen ? 'Düzenlemeyi bitir' : 'Sayfada düzenle') + '</button></div>'
        : '<p class="gizle-bos">Bu sayfada düzenlenecek bölüm yok.</p>';
    } else {
      bas += '<p class="gd-ozet">' + (sayfaListe.length ? sayfaListe.length + ' sayfanın düzeni değişti' : 'Bütün sayfalar önerilen düzende') + '</p>';
      const ozetOf = x => [x.gizli ? x.gizli + ' gizli' : '', x.kucuk ? x.kucuk + ' küçük' : '',
        x.acildi ? x.acildi + ' açıldı' : '', x.sira ? 'sıra değişti' : ''].filter(Boolean).join(' · ');
      icerik = sayfaListe.length
        ? '<ul class="gd-sayfalar">' + sayfaListe.map(x => '<li data-sayfa="' + kac(x.ekran) + '">'
            + '<div class="gd-sayfa__metin"><span class="gd-sayfa__ad">' + kac(x.ad)
            + (x.bu ? '<i class="gd-bu">bu sayfa</i>' : '') + '</span><span class="gd-sayfa__ozet">' + ozetOf(x) + '</span></div>'
            + '<button type="button" data-sayfa-sifirla="' + kac(x.ekran) + '" aria-label="«' + kac(x.ad) + '» sayfasını sıfırla">' + svg('sifirla') + 'Sıfırla</button></li>').join('') + '</ul>'
          + '<div class="gizle-alt"><button type="button" data-hepsini-sifirla>' + svg('sifirla') + 'Hepsini sıfırla</button></div>'
        : '<p class="gizle-bos">Hiçbir sayfanın düzeni değiştirilmemiş. Bir sayfada küçülttüğün, gizlediğin ya da sıraladığın bölümler burada sayfa sayfa listelenir.</p>';
    }
    bas += '</div>' + kapat + '</div>';
    panel.innerHTML = bas
      + '<div class="gd-sekmeler" role="tablist" aria-label="Kapsam">' + sekme('sayfa', 'Bu sayfa', 0) + sekme('hepsi', 'Tüm sayfalar', sayfaListe.length) + '</div>'
      + '<div id="gd-icerik" class="gd-icerik" role="tabpanel" aria-labelledby="gd-s-' + panelSekme + '">' + icerik + '</div>'
      + '<p class="gizle-not">Yalnız görünüm: gizlemek veriyi silmez, hiçbir uyarıyı susturmaz.</p>';
    araUygula();
    if(odakAra){ const a = panel.querySelector('.gd-ara'); if(a){ a.focus(); try{ a.setSelectionRange(a.value.length, a.value.length); }catch(e){} } }
  }
  function araUygula(){
    if(!panel) return;
    const q = aramaMetni.toLocaleLowerCase('tr-TR').trim();
    let var_ = false;
    panel.querySelectorAll('[data-satir]').forEach(li => {
      const ad = (li.querySelector('.gd-ad') || li).textContent.toLocaleLowerCase('tr-TR');
      li.hidden = !!q && ad.indexOf(q) < 0;
      if(!li.hidden) var_ = true;
    });
    const bos = panel.querySelector('.gd-arabos');
    if(bos) bos.hidden = !q || var_;
    const ipucu = panel.querySelector('.gd-ipucu');
    if(ipucu) ipucu.hidden = !!q;
  }

  /* Yeniden çizimden sonra odak aynı satırın aynı düğmesinde kalır. */
  function panelOdak(a, secici){
    if(!panel) return;
    const satir = Array.from(panel.querySelectorAll('[data-satir]')).find(x => x.getAttribute('data-satir') === a);
    if(!satir) return;
    let h = secici ? satir.querySelector(secici) : satir;
    if(h && h.disabled) h = satir;
    if(h) h.focus();
  }
  function odakKoru(a, ozellik){
    const b = son && bolumler(son.kok).find(x => x.anahtar === a);
    const h = b && b.el.querySelector(':scope > .gizle-araclar [' + ozellik + ']');
    if(h && !h.disabled) h.focus();
    if(b) b.el.scrollIntoView({ block:'nearest' });
  }

  /* Panelde sürükle-bırak: tutamaktan tutulur, yalnız aynı grup içinde
     yer değiştirir; bırakınca sıra kaydedilir. Fare ve dokunmatik aynı yol. */
  function panelSurukleBagla(){
    let tasinan = null;
    document.addEventListener('pointerdown', e => {
      const tut = e.target && e.target.closest && e.target.closest('.gd-tut');
      if(!tut || !panel || !panel.contains(tut) || tut.classList.contains('gd-tut--yok')) return;
      const li = tut.closest('[data-satir]');
      e.preventDefault();
      tasinan = { li, grup:li.getAttribute('data-grup') };
      li.classList.add('gd-satir--tasiniyor');
      panel.classList.add('gd-surukle');
      onizlemeKapat();
    }, true);
    document.addEventListener('pointermove', e => {
      if(!tasinan) return;
      e.preventDefault();
      const ul = tasinan.li.parentElement;
      const kardes = Array.from(ul.querySelectorAll('[data-grup="' + tasinan.grup + '"]')).filter(x => x !== tasinan.li);
      for(const k of kardes){
        const r = k.getBoundingClientRect();
        if(e.clientY > r.top && e.clientY < r.bottom){
          const ust = e.clientY < r.top + r.height / 2;
          ul.insertBefore(tasinan.li, ust ? k : k.nextSibling);
          break;
        }
      }
    }, true);
    const birak = () => {
      if(!tasinan) return;
      const { li, grup } = tasinan;
      tasinan = null;
      li.classList.remove('gd-satir--tasiniyor');
      if(panel) panel.classList.remove('gd-surukle');
      const ul = li.parentElement;
      if(!ul) return;
      const sira = Array.from(ul.querySelectorAll('[data-grup="' + grup + '"]')).map(x => x.getAttribute('data-satir'));
      const a = li.getAttribute('data-satir');
      siraYaz(sira);
      panelOdak(a, null);
    };
    document.addEventListener('pointerup', birak, true);
    document.addEventListener('pointercancel', birak, true);
  }

  /* Sayfada sürükle-bırak (düzen kipi): bölümün köşesindeki tutamaktan
     tutulur; parmak/fare başka bir bölümün üzerine gelince yer anında
     değişir (FLIP ile kayarak), bırakınca sıra kaydedilir. Yalnız aynı
     kap içinde; kenara yaklaşınca sayfa kendiliğinden kayar. */
  function sayfaSurukleBagla(){
    let s = null;
    document.addEventListener('pointerdown', e => {
      const tut = e.target && e.target.closest && e.target.closest('.gizle-tut');
      if(!tut || !duzen || !son) return;
      const bolum = tut.closest('.gizle-bolum');
      const liste = bolumler(son.kok);
      const b = liste.find(x => x.el === bolum);
      if(!b) return;
      /* Adaylar: kendi kabı VE aynı türdeki komşu kaplar (alanlar arası). */
      const ks = uyumluKaplar(kapOf(b));
      const g = liste.filter(x => ks.indexOf(kapOf(x)) >= 0);
      if(g.length < 2) return;
      e.preventDefault();
      s = { b, g, t:tasiyici(b.el) };
      s.t.classList.add('gizle-tasinan');
      document.documentElement.classList.add('gizle-surukluyor');
      onizlemeKapat();
    }, true);
    document.addEventListener('pointermove', e => {
      if(!s) return;
      e.preventDefault();
      if(e.clientY < 72) window.scrollBy(0, -16);
      else if(e.clientY > window.innerHeight - 72) window.scrollBy(0, 16);
      const bizim = s.t.getBoundingClientRect();
      for(const x of s.g){
        if(x === s.b) continue;
        const t = tasiyici(x.el);
        const r = t.getBoundingClientRect();
        if(!r.width || e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue;
        /* Aynı satırdaysa (ızgara) sol/sağ yarı, değilse üst/alt yarı. */
        const yatay = Math.abs(r.top - bizim.top) < 6;
        const once = yatay ? e.clientX < r.left + r.width / 2 : e.clientY < r.top + r.height / 2;
        if(once ? t.previousElementSibling === s.t : t.nextElementSibling === s.t) break;
        flip(s.g.map(y => tasiyici(y.el)), () => t.parentNode.insertBefore(s.t, once ? t : t.nextSibling));
        break;
      }
    }, true);
    const bitir = () => {
      if(!s) return;
      const b = s.b;
      s.t.classList.remove('gizle-tasinan');
      document.documentElement.classList.remove('gizle-surukluyor');
      s = null;
      sayfadaBirakildi(b.anahtar);
    };
    document.addEventListener('pointerup', bitir, true);
    document.addEventListener('pointercancel', bitir, true);
  }

  /* Paneldeki açık bir satırın üzerine gelince bölüm sayfada vurgulanır. */
  function vurgula(a, v){
    document.querySelectorAll('.gizle-vurgu').forEach(x => x.classList.remove('gizle-vurgu'));
    if(!v || !son) return;
    const b = bolumler(son.kok).find(x => x.anahtar === a);
    if(b && !b.el.hidden) b.el.classList.add('gizle-vurgu');
  }

  function panelAc(dugme){
    if(panel){ panelKapat(); return; }
    panelSekme = 'sayfa';
    aramaMetni = '';
    panel = document.createElement('div');
    panel.className = 'katman kmenu kmenu--gizle';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Sayfa düzeni');
    panelCiz();
    document.body.appendChild(panel);
    const r = dugme.getBoundingClientRect();
    /* Sağ kenarı düğmeye hizalı, ama dar ekranda da ekranın içinde. */
    const w = panel.offsetWidth, W = document.documentElement.clientWidth || window.innerWidth;
    panel.style.top = Math.round(r.bottom + 6) + 'px';
    panel.style.left = Math.round(Math.max(8, Math.min(r.right - w, W - w - 8))) + 'px';
    panel.style.right = 'auto';
    dugme.setAttribute('aria-expanded', 'true');
    const ilk = panel.querySelector('[data-satir]') || panel.querySelector('button');
    if(ilk) ilk.focus();
  }
  function panelKapat(){
    onizlemeKapat();
    vurgula(null, false);
    if(!panel) return;
    panel.remove(); panel = null;
    document.querySelectorAll('.ust__gizli').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  /* Olaylar belge düzeyinde bir kez bağlanır: modüllerin data-act
     işleyicilerine dokunulmaz. */
  function bagla(){
    if(bagli) return;
    bagli = true;
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const ac = t.closest('.ust__gizli');
      if(ac){ e.preventDefault(); panelAc(ac); return; }
      if(t.closest('[data-duzen-bitir]')){ e.preventDefault(); duzenle(false); return; }
      const dp = t.closest('[data-gizle-dip]');
      if(dp){ e.preventDefault(); e.stopPropagation(); const u = document.querySelector('.ust__gizli'); if(u) panelAc(u); return; }
      const ga = t.closest('[data-geri-al]');
      if(ga){ e.preventDefault(); geriAl(ga.closest('.gizle-geri')); return; }
      const gz = t.closest('[data-gizle]');
      if(gz){ e.preventDefault(); e.stopPropagation(); durumAyarla(gz.getAttribute('data-gizle'), 'gizli', true); return; }
      const kc = t.closest('[data-kucult]');
      if(kc){ e.preventDefault(); e.stopPropagation(); durumAyarla(kc.getAttribute('data-kucult'), 'kucuk', true); return; }
      const ty = t.closest('[data-tasi-yukari], [data-tasi-asagi]');
      if(ty && !(panel && panel.contains(ty))){
        e.preventDefault(); e.stopPropagation();
        const a = ty.closest('.gizle-bolum') && bolumler(son.kok).find(b => b.el === ty.closest('.gizle-bolum'));
        if(a){ tasi(a.anahtar, ty.hasAttribute('data-tasi-yukari') ? -1 : 1); odakKoru(a.anahtar, ty.hasAttribute('data-tasi-yukari') ? 'data-tasi-yukari' : 'data-tasi-asagi'); }
        return;
      }
      const serit = t.closest('[data-gizle-kucuk]');
      if(serit && !duzen && !t.closest('a, input, select, textarea, [data-act], .hint, .terim') && !t.closest('[data-kucult],[data-gizle]')){
        e.preventDefault(); e.stopPropagation(); kucult(serit.getAttribute('data-gizle-kucuk'), false); return;
      }
      const ac2 = t.closest('[data-ac]');
      if(ac2){ e.preventDefault(); e.stopPropagation(); kucult(ac2.getAttribute('data-ac'), false); return; }
      if(panel && panel.contains(t)){
        const satir = t.closest('[data-satir]');
        const a = satir && satir.getAttribute('data-satir');
        const hs = t.closest('[data-hal-sec]');
        if(hs && a){ durumAyarla(a, hs.getAttribute('data-hal-sec'), false); panelOdak(a, '[data-hal-sec="' + hs.getAttribute('data-hal-sec') + '"]'); return; }
        const tp = t.closest('[data-yukari], [data-asagi]');
        if(tp && a){ const y = tp.hasAttribute('data-yukari'); tasi(a, y ? -1 : 1); panelOdak(a, y ? '[data-yukari]' : '[data-asagi]'); return; }
        if(t.closest('[data-duzen]')){ duzenle(); return; }
        const sk = t.closest('[data-sekme]');
        if(sk){ panelSekme = sk.getAttribute('data-sekme'); panelCiz();
          const y = panel.querySelector('[data-sekme="' + panelSekme + '"]'); if(y) y.focus(); return; }
        const hz = t.closest('[data-hazir]');
        if(hz){ hazir(hz.getAttribute('data-hazir')); const y = panel && panel.querySelector('[data-hazir="' + hz.getAttribute('data-hazir') + '"]'); if(y) y.focus(); return; }
        const ss = t.closest('[data-sayfa-sifirla]');
        if(ss){ sayfaSifirla(ss.getAttribute('data-sayfa-sifirla')); return; }
        if(t.closest('[data-hepsini-sifirla]')){ hepsiniSifirla(); return; }
        if(t.closest('[data-varsayilan]')){ varsayilanaDon(); return; }
        if(t.closest('[data-panel-kapat]')){ panelKapat(); return; }
        return;
      }
      if(panel) panelKapat();
    }, true);
    document.addEventListener('input', e => {
      const a = e.target && e.target.classList && e.target.classList.contains('gd-ara') ? e.target : null;
      if(!a || !panel || !panel.contains(a)) return;
      aramaMetni = a.value;
      araUygula();
    });
    document.addEventListener('keydown', e => {
      /* Sekmeler arasında ←/→ (WAI-ARIA sekme düzeni). */
      if(panel && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.target && e.target.getAttribute
        && e.target.getAttribute('role') === 'tab' && panel.contains(e.target)){
        e.preventDefault();
        panelSekme = panelSekme === 'sayfa' ? 'hepsi' : 'sayfa';
        panelCiz();
        const y = panel.querySelector('[data-sekme="' + panelSekme + '"]'); if(y) y.focus();
        return;
      }
      /* Aramada ↓ ilk satıra iner. */
      if(panel && e.key === 'ArrowDown' && e.target && e.target.classList && e.target.classList.contains('gd-ara')){
        const ilk = panel.querySelector('[data-satir]:not([hidden])');
        if(ilk){ e.preventDefault(); ilk.focus(); }
        return;
      }
      /* Panelde bir satırdayken Alt+↑/↓ bölümü taşır. */
      if(panel && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')){
        const satir = e.target && e.target.closest && e.target.closest('[data-satir]');
        if(satir && panel.contains(satir)){
          e.preventDefault();
          const a = satir.getAttribute('data-satir');
          tasi(a, e.key === 'ArrowUp' ? -1 : 1);
          panelOdak(a, null);
          return;
        }
      }
      if(e.key !== 'Escape') return;
      if(onizleme) onizlemeKapat();
      else if(panel) panelKapat();
      else if(duzen) duzenle(false);
    });
    panelSurukleBagla();
    sayfaSurukleBagla();
    /* Önizleme: küçültülmüş bölümün ya da paneldeki gizli satırın üzerine
       gelince (fare) ya da odaklanınca (klavye) açılır, çıkınca kapanır. */
    const hedefOf = t => {
      if(!t || !t.closest) return null;
      const k = t.closest('[data-gizle-kucuk]');
      if(k) return { kaynak:k, yakin:k };
      const p = t.closest('[data-onizle]');
      if(p && panel && panel.contains(p)) return { kaynak:kaynakBul(p.getAttribute('data-onizle')), yakin:p };
      return null;
    };
    /* Odakla açılma yalnız klavye odağında: panel açılınca ilk düğmeye
       giden programatik odak (dokunuş/fare) önizlemeyi panelin üstüne açmaz. */
    const klavyeOdagi = el => { try{ return el.matches(':focus-visible'); }catch(x){ return true; } };
    const gir = e => {
      const sat = panel && e.target && e.target.closest && e.target.closest('[data-satir]');
      if(sat && panel.contains(sat)) vurgula(sat.getAttribute('data-satir'), sat.getAttribute('data-hal') === 'acik');
      if(e.type === 'focusin' && !klavyeOdagi(e.target)) return;
      const h = hedefOf(e.target); if(h && h.kaynak) onizlemeZamanla(h.kaynak, h.yakin);
    };
    const cik = e => {
      const sat = panel && e.target && e.target.closest && e.target.closest('[data-satir]');
      if(sat && !(e.relatedTarget && sat.contains(e.relatedTarget))) vurgula(null, false);
      const h = hedefOf(e.target);
      if(!h) return;
      const ic = e.relatedTarget && h.yakin.contains(e.relatedTarget);
      if(!ic) onizlemeKapat();
    };
    /* Dokunmatik ekranda «üzerine gelmek» yoktur: küçültülmüş bölüme
       BASILI TUTMAK (~0,45 sn) önizlemeyi açar; parmak kayarsa iptal,
       sonraki dokunuş kapatır. Uzun basışın bağlam menüsü o an bastırılır. */
    let basili = null, basiliAcildi = false;
    document.addEventListener('pointerdown', e => {
      if(onizleme && basiliAcildi){ onizlemeKapat(); basiliAcildi = false; }
      if(e.pointerType !== 'touch') return;
      const k = e.target && e.target.closest && e.target.closest('[data-gizle-kucuk]');
      if(!k || e.target.closest('button, a, input, select, textarea')) return;
      const x = e.clientX, y = e.clientY;
      clearTimeout(basili);
      basili = setTimeout(() => { onizlemeAc(k, k); basiliAcildi = true; }, 450);
      const iptal = ev => {
        if(ev.type === 'pointermove' && Math.hypot(ev.clientX - x, ev.clientY - y) < 10) return;
        clearTimeout(basili);
        document.removeEventListener('pointermove', iptal, true);
        document.removeEventListener('pointerup', iptal, true);
        document.removeEventListener('pointercancel', iptal, true);
      };
      document.addEventListener('pointermove', iptal, true);
      document.addEventListener('pointerup', iptal, true);
      document.addEventListener('pointercancel', iptal, true);
    }, true);
    document.addEventListener('contextmenu', e => {
      if(basiliAcildi && e.target && e.target.closest && e.target.closest('[data-gizle-kucuk]')) e.preventDefault();
    });
    document.addEventListener('mouseover', gir);
    document.addEventListener('mouseout', cik);
    document.addEventListener('focusin', gir);
    document.addEventListener('focusout', cik);
  }

  return { uygula, anahtar, bolumler, gizliListe, gizle, goster, hepsiniGoster, duzenle, kucult,
    tasi, durumu, durumAyarla, varsayilanaDon, sayfadaBirakildi, hazir, hazirHali, sayfalar, sayfaSifirla, hepsiniSifirla, birak,
    duzenMi:() => duzen, panelAc, panelKapat, onizlemeAc, onizlemeKapat,
    onizlemeVar:() => !!onizleme,
    _sifirla(){ son = null; duzen = false; panelKapat(); onizlemeKapat(); bitirCubugu();
      clearTimeout(geriSayac); document.querySelectorAll('.gizle-geri').forEach(x => x.remove()); } };
})();
