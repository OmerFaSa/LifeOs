/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/minik.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* MİNİK — kartların üstünde yaşayan minikler.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/minik.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Biçimi
   `brand/ortak/cam.css` (12–13. bölüm), testi `brand/ortak/minik.test.js`.
   ==================================================================

   KULLANICININ İSTEĞİ (2026-10-27): «agentlar kartların üstünde fiziksel bir
   yermiş gibi hareket etsin; çok daha tatlı, minnoş»; «sayfada zaten
   olsunlar, yürüyüş daha doğal»; «bazıları birbiriyle konuşsun, bazıları
   kartın kenarından ayağını sarkıtsın, bazıları uyusun, bazıları fareyi
   gözüyle takip etsin, tıklayınca gıdıklansınlar; birbirlerinden farklı
   olsunlar».

   Kartların üst kenarı birer zemindir. Minik sayfa açıldığında zaten bir
   kartın üstündedir (belirme yok); paytak yürür, bakınır, göz kırpar,
   hoplar, kenara oturup ayaklarını sallar, uyur, aynı karttaki arkadaşıyla
   sohbet eder, ara sıra yakındaki karta zıplar. Fare yaklaşınca gözleriyle
   izler; üstüne gelince fark eder, tıklayınca gıdıklanıp kıkırdar (ses.js
   «gidik»). Her minik başka: kendi süsü (kulak, anten, filiz), boyu, tonu
   ve huyu (uykucu, konuşkan, meraklı) var.

   Süstür, veri değildir: hiçbir kayda bakmaz, hiçbir şey yazmaz, ekran
   okuyucuya görünmez (aria-hidden). Yalnız miniğin kendisi tıklanır; kartın
   tıklamasını yutmaz. Görünüm › Animasyonlar «Az» (animasyon.js matchMedia'yı
   yamar), Sade zemin ya da King açıkken yoktur. Hareket transform'dur ve Web
   Animations ile zincirlenir; sürekli döngü yok, göz yönü yalnız fare
   kıpırdarken karede bir kez hesaplanır. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.MINIK = (function(){
  'use strict';

  /* Zemin sayılan kartlar: kabın içindeki kart değil, en dıştaki cam. */
  const KART = 'main.content .kutu, main.content .card:not(.card--flat), .sayfa--kapakli .bugun__alan, main.content .pk, main.content .kapak__sayi, main.content .giris, main.content .ledger .lrow:not(.kahraman)';
  const EN_AZ = 150;          // daha dar kart zemin olmaz (minik sığmaz, kenarı görünmez)
  const PAY = 18;             // kartın köşesine bu kadar yaklaşmaz (yuvarlak köşe)
  const HIZ = 30;             // yürüyüş, piksel/sn (paytak, acelesiz)
  const MENZIL = { x:520, y:420 };   // zıplayabileceği en uzak kenar
  const SOHBET_YAKIN = 70;    // sohbette aradaki mesafe
  const GOZ = { menzil:420, en:2.2 }; // göz bebeği en çok 2,2 px kayar

  /* Kadro: her minik başka (biçim, süs, boy, ton farkı, huy). Kullanıcı
     (2026-10-27): «kimisi üçgen kimisi kare olsun, daha profesyonel».
     Gözlük kalktı: gözler imleci izleyince yerinde kalıp kayık duruyordu.
     Her sayfa kadrodan kendi miniklerini çağırır (kadro()); aynı sayfaya
     dönünce aynıları. */
  /* Ad ve huy, üstüne gelince küçük bir etikette görünür (kullanıcı,
     2026-10-28: «agentlar daha anlaşılır olsun»); perde miniğin ses tonudur
     (ses.js «bla», «gidik»): bilge alçak, neşeli ince konuşur. */
  const KISILER = Object.freeze([
    { ad:'Pofuduk', bicim:'yuvarlak', tip:'kulak',   huy:'uykucu',   boy:42, ton:0,   perde:0.9 },
    { ad:'Bıcır',   bicim:'kare',     tip:'anten',   huy:'konuskan', boy:38, ton:28,  perde:1.15 },
    { ad:'Filiz',   bicim:'ucgen',    tip:'filiz',   huy:'merakli',  boy:44, ton:-26, perde:1.05 },
    { ad:'Ponpon',  bicim:'yuvarlak', tip:'kurdele', huy:'neseli',   boy:38, ton:-12, perde:1.25 },
    { ad:'Bulut',   bicim:'ucgen',    tip:'percem',  huy:'hayalci',  boy:40, ton:14,  perde:1 },
    { ad:'Bilge',   bicim:'kare',     tip:'yok',     huy:'bilge',    boy:41, ton:40,  perde:0.8 }
  ]);
  const HUY_AD = Object.freeze({ uykucu:'uykucu', konuskan:'konuşkan', merakli:'meraklı', neseli:'neşeli', hayalci:'hayalci', bilge:'bilge' });
  const BALON = Object.freeze(['hey!', '♪', '…', 'hı hı', 'ooo', '!?', 'hihi', '♡']);

  /* Ruh hâli (kullanıcı, 2026-10-28: «çok tıklarsak kızsın; üzgün, mutlu,
     uykulu olsunlar»). Kişi başına oturumda bellekte durur; hiçbir kayda
     bakmaz, hiçbir şey yazmaz. Sıra: kızgın > küs (üzgün) > mutlu > gece
     uykulu > özlem (üzgün) > huyun kendi hâli. */
  const RUH = Object.freeze({ SIK:5, PENCERE:4000, KIZ:8000, KUS:20000, MUTLU:15000, OZLEM:30 * 60000 });
  const RUH_AD = Object.freeze({ mutlu:'mutlu', uzgun:'üzgün', uykulu:'uykulu', kizgin:'kızgın' });
  const RUH_IPUCU = Object.freeze({ kizgin:'Biraz bekle', uzgun:'Dokun, sevindir', uykulu:'Dokun, uyandır' });

  /* Sayfadaki sayı (kullanıcı, 2026-10-28: «bir sayfada görünebilecek
     sayıyı değiştirebilelim»): Görünüm › Minikler, Yok ya da 1–6. Tercih
     bu kapının deposunda durur, modül geçişinde taşınır (animasyon.js
     TASINAN); seçilmemişse ekran genişliği karar verir. */
  const ANAHTAR = 'lifeos.minik';
  const EN_COK = KISILER.length;

  /* --- saf hesaplar (test edilir) --- */

  function sayi(tercih, en){
    const n = tercih == null || tercih === '' ? NaN : Number(tercih);
    if(Number.isInteger(n) && n >= 0 && n <= EN_COK) return n;
    return en < 680 ? 1 : en < 1100 ? 2 : 3;
  }
  function seciciHtml(n){
    const s = n == null ? simdikiSayi() : n;
    let h = '<div class="seg seg--block miniksec" role="group" aria-label="Minikler">';
    for(let i = 0; i <= EN_COK; i++){
      h += '<button type="button" class="' + (i === s ? 'is-on' : '') + '" data-minik-sec="' + i + '" aria-pressed="' + (i === s ? 'true' : 'false') + '"'
        + ' title="' + (i ? 'Sayfada en çok ' + i + ' minik' : 'Minik yok') + '">' + (i ? i : 'Yok') + '</button>';
    }
    return h + '</div>';
  }

  /* Dikdörtgenlerden yürünebilir kenarlar: belge koordinatında {x1, x2, y}.
     Ekrandan çıkan kart da zemindir: minik kartıyla birlikte kayar. */
  function zeminler(kutular){
    return kutular
      .filter(k => k.genis >= EN_AZ)
      .map(k => ({ x1:k.sol + PAY, x2:k.sol + k.genis - PAY, y:k.ust, el:k.el }))
      .sort((a, b) => a.y - b.y || a.x1 - b.x1);
  }

  /* Yeni yer (sayfa açılınca, kartı kaybolunca) yalnız ekranda görünen kenardan. */
  function gorunenler(liste, gorunum){
    return liste.filter(z => z.y > gorunum.ust + 40 && z.y < gorunum.ust + gorunum.boy - 20);
  }

  /* Aynı kenarda bir sonraki durak: 24–110 px öteye, kenarın içinde kalır. */
  function adim(z, x, rnd, gen){
    const yari = (gen || 0) / 2;
    const alt = z.x1 + yari, ust = z.x2 - yari;
    if(ust <= alt) return (z.x1 + z.x2) / 2;
    const uzak = 24 + rnd() * 86;
    let hedef = x + (rnd() < .5 ? -uzak : uzak);
    if(hedef < alt || hedef > ust) hedef = x + (hedef < alt ? uzak : -uzak);
    return Math.min(ust, Math.max(alt, hedef));
  }

  /* Zıplanabilecek kenarlar (kendisi hariç, menzil içinde). */
  function komsular(liste, z, x){
    return liste.filter(o => o !== z && Math.abs(o.y - z.y) <= MENZIL.y
      && Math.abs(((o.x1 + o.x2) / 2) - x) <= MENZIL.x);
  }

  /* Yay biçiminde uçuş: kalkışta ezilir, havada uzar, inişte ezilip oturur.
     Tepe, iki kenardan yüksekte olanın 46 px + yolun %12'si üstündedir. */
  function sicrama(a, b){
    const tepe = Math.min(a.y, b.y) - 46 - Math.abs(b.x - a.x) * .12;
    const t = (x, y, sx, sy) => 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + sx + ',' + sy + ')';
    const orta = (a.x + b.x) / 2;
    return [
      { transform:t(a.x, a.y, 1, 1), offset:0 },
      { transform:t(a.x, a.y, 1.18, .8), offset:.14 },
      { transform:t((a.x * 3 + orta) / 4, (a.y + tepe * 3) / 4, .9, 1.12), offset:.36, easing:'ease-out' },
      { transform:t(orta, tepe, 1, 1), offset:.55, easing:'ease-in' },
      { transform:t(b.x, b.y, 1.2, .78), offset:.86 },
      { transform:t(b.x, b.y, 1, 1), offset:1 }
    ];
  }

  /* Göz bebeğinin kayması: imlece doğru, en çok GOZ.en px; uzaksa bakmaz (null). */
  function gozYonu(merkez, imlec){
    const dx = imlec.x - merkez.x, dy = imlec.y - merkez.y;
    const d = Math.hypot(dx, dy);
    if(d > GOZ.menzil) return null;
    if(d < 1) return { x:0, y:0 };
    const k = Math.min(1, d / 60) * GOZ.en / d;
    return { x:+(dx * k).toFixed(2), y:+(dy * k).toFixed(2) };
  }

  /* Sayfanın kadrosu: anahtardan türeyen sabit bir karışımın ilk n'i. */
  function kadro(anahtar, n){
    let h = 2166136261;
    for(const c of String(anahtar || '')){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    const sira = KISILER.map((_, i) => i);
    for(let i = sira.length - 1; i > 0; i--){
      h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
      const j = h % (i + 1);
      [sira[i], sira[j]] = [sira[j], sira[i]];
    }
    return sira.slice(0, Math.min(n, sira.length));
  }

  /* Sohbet edebilecek eş: aynı kartın kenarında, en çok 260 px ötede. */
  function sohbetEsi(liste, mk){
    return liste.find(o => o !== mk && o.z && mk.z && o.z.el === mk.z.el && Math.abs(o.x - mk.x) <= 260) || null;
  }

  function yeniRuh(simdi){ return { dokunus:[], kizgin:0, kus:0, mutlu:0, son:simdi }; }

  /* Dokunuş: 'kalp' (sevindi), 'kizdi' (4 sn'de 5. dokunuş), 'hirr'
     (kızgınken dokunuldu, kızgınlık uzar), 'baristi' (küsken tek dokunuş). */
  function dokun(r, simdi){
    r.son = simdi;
    r.dokunus = r.dokunus.filter(t => simdi - t < RUH.PENCERE).concat(simdi);
    if(simdi < r.kizgin){ r.kizgin = Math.max(r.kizgin, simdi + RUH.KIZ * .6); r.kus = r.kizgin + RUH.KUS; return 'hirr'; }
    if(r.dokunus.length >= RUH.SIK){
      r.dokunus = []; r.mutlu = 0;
      r.kizgin = simdi + RUH.KIZ; r.kus = r.kizgin + RUH.KUS;
      return 'kizdi';
    }
    if(simdi < r.kus){ r.kus = 0; r.mutlu = simdi + RUH.MUTLU; return 'baristi'; }
    r.mutlu = simdi + RUH.MUTLU;
    return 'kalp';
  }

  function ruh(r, simdi, saat, huy){
    if(simdi < r.kizgin) return 'kizgin';
    if(simdi < r.kus) return 'uzgun';
    if(simdi < r.mutlu) return 'mutlu';
    if(saat >= 23 || saat < 6) return 'uykulu';
    if(huy === 'uykucu' && saat >= 13 && saat < 16) return 'uykulu';
    if(simdi - r.son > RUH.OZLEM) return 'uzgun';
    return huy === 'neseli' ? 'mutlu' : '';
  }

  /* --- DOM --- */

  const durum = { kat:null, minikler:[], zeminler:[], bekle:0, zamanlar:[], sayfa:null, yerlesme:0, bekci:null, ruhlar:{}, isikTazele:false };
  /* Sohbet gibi çok adımlı işlerin zamanlayıcıları: sayfa değişince silinir. */
  function zamanla(fn, ms){ const t = setTimeout(fn, ms); durum.zamanlar.push(t); return t; }
  /* Meşgul işareti 12 sn'de kendiliğinden düşer: yarıda kalan bir iş
     (iptal edilen yürüyüş, değişen sayfa) miniği sonsuza dek dondurmaz. */
  function mesgul(mk, v){ mk.mesgul = !!v; mk.mesgulSon = v ? Date.now() + 12000 : 0; }
  function mesgulMu(mk){ if(mk.mesgul && Date.now() > mk.mesgulSon) mesgul(mk, false); return mk.mesgul; }

  function tercihOku(){ try{ return localStorage.getItem(ANAHTAR); }catch(e){ return null; } }
  function simdikiSayi(){ return sayi(tercihOku(), typeof window !== 'undefined' ? window.innerWidth || 1024 : 1024); }

  function azMi(){
    try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; }
  }
  function kapaliMi(){
    const h = document.documentElement;
    return azMi() || h.getAttribute('data-zemin') !== 'yumusak' || h.classList.contains('king-acik');
  }
  /* Kendi tonunda ses. kur:false — yalnız kullanıcı daha önce bir şeye
     dokunduysa (ses bağlamı kuruluysa) çalar; sohbet kendiliğinden ses
     açmaz. Sekme arkadaysa ya da pencere odakta değilse minikler susar. */
  function ses(tur, mk, kur){
    try{
      if(kur === false && (document.visibilityState === 'hidden' || (document.hasFocus && !document.hasFocus()))) return;
      if(window.LIFEOS.SES) window.LIFEOS.SES.tik(tur, kur, { perde:mk && mk.perde || 1 });
    }catch(e){}
  }
  const rasgele = l => l[Math.floor(Math.random() * l.length)];

  function olcum(){
    const sy = window.scrollY || 0, sx = window.scrollX || 0;
    const kutular = [];
    document.querySelectorAll(KART).forEach(el => {
      if(el.parentElement && el.parentElement.closest(KART)) return;   // iç kart zemin olmaz
      const r = el.getBoundingClientRect();
      if(!r.width || !r.height) return;
      /* Gruplu listede (iOS Ayarlar gibi) yalnız grubun ilk satırının üstü açıktır. */
      const once = el.previousElementSibling;
      if(once && once.matches && once.matches('.lrow') && Math.abs(once.getBoundingClientRect().bottom - r.top) < 3) return;
      kutular.push({ sol:r.left + sx, ust:r.top + sy, genis:r.width, el });
    });
    return zeminler(kutular);
  }

  /* Ruh hâli kişinindir: sayfa değişip minik başka kişiyi giyince o kişinin hâli gelir. */
  function ruhu(mk){ return durum.ruhlar[mk.ad] || (durum.ruhlar[mk.ad] = yeniRuh(Date.now())); }
  function ruhNe(mk){ return ruh(ruhu(mk), Date.now(), new Date().getHours(), mk.huy); }
  /* Yüz (cam.css data-ruh) ve etiket: ruh hâli varsa huyun yerine o yazar. */
  function ruhUygula(mk){
    const r = ruhNe(mk);
    if((mk.el.dataset.ruh || '') !== r){ if(r) mk.el.dataset.ruh = r; else delete mk.el.dataset.ruh; }
    mk.el.querySelector('.minik__ad i').textContent = r ? RUH_AD[r] : (HUY_AD[mk.huy] || mk.huy);
    mk.el.querySelector('.minik__ad small').textContent = RUH_IPUCU[r] || 'Dokun, gıdıkla';
    return r;
  }

  function giydir(mk, k){
    mk.huy = k.huy;
    mk.ad = k.ad;
    mk.perde = k.perde;
    mk.el.querySelector('.minik__ad b').textContent = k.ad;
    mk.el.dataset.tip = k.tip;
    mk.el.dataset.bicim = k.bicim;
    mk.el.style.setProperty('--boy', k.boy + 'px');
    mk.el.style.setProperty('--ton', String(k.ton));   // birimsiz: oklch'nin h'si sayı
    ruhUygula(mk);
  }

  function minikYap(i){
    const m = document.createElement('div');
    m.className = 'minik minik--' + (i + 1);
    m.innerHTML = '<i class="minik__golge"></i><i class="minik__ayak minik__ayak--sol"></i><i class="minik__ayak minik__ayak--sag"></i>'
      + '<i class="minik__kol minik__kol--sol"></i><i class="minik__kol minik__kol--sag"></i>'
      + '<span class="minik__govde"><i class="minik__deri"></i><i class="minik__goz"></i><i class="minik__goz"></i>'
      + '<i class="minik__agiz"></i><i class="minik__sus"></i></span><span class="minik__balon"></span><span class="minik__zzz">z</span>'
      + '<span class="minik__kalp">♡</span><span class="minik__ad"><b></b> · <i></i><small>Dokun, gıdıkla</small></span>';
    const mk = { el:m, z:null, x:0, y:0, anim:null, zaman:0, huy:'', ad:'', perde:1, mesgul:false, mesgulSon:0 };
    giydir(mk, KISILER[i % KISILER.length]);
    m.addEventListener('pointerenter', () => {
      m.classList.add('is-farkinda');
      const r = ruhUygula(mk);
      if(!mesgulMu(mk) && !m.classList.contains('is-uyuyor') && r !== 'kizgin' && r !== 'uzgun') ekHal(mk, 'is-selam', 900);
    });
    m.addEventListener('pointerleave', () => m.classList.remove('is-farkinda'));
    m.addEventListener('click', e => { e.stopPropagation(); gidikla(mk); });
    return mk;
  }

  function koy(mk, x, y){
    mk.x = x; mk.y = y;
    mk.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
  }

  function sonra(mk, ms){ clearTimeout(mk.zaman); mk.zaman = setTimeout(() => yasat(mk), ms); }

  const HALLER = ['is-bakiyor', 'is-kirpiyor', 'is-hopluyor', 'is-oturuyor', 'is-uyuyor', 'is-uyaniyor', 'is-konusuyor', 'is-gidik', 'is-selam', 'is-tepin', 'is-esniyor', 'is-kasiniyor', 'is-silkiniyor', 'is-dans'];
  /* Kısa süren ek hâl (el sallama, kalp): hâlin üstüne biner, kendiliğinden düşer. */
  function ekHal(mk, h, ms){ mk.el.classList.add(h); setTimeout(() => mk.el.classList.remove(h), ms); }
  function temizle(mk){ HALLER.forEach(h => mk.el.classList.remove(h)); }
  function hal(mk, h){ temizle(mk); if(h){ void mk.el.offsetWidth; mk.el.classList.add(h); } }

  /* Üzgün ağır, uykulu ağır aksak, mutlu ve kızgın hızlı yürür. */
  const HIZ_RUH = Object.freeze({ uzgun:.6, uykulu:.7, mutlu:1.25, kizgin:1.5 });

  /* Paytak yürüyüş: önce yöne hafifçe eğilir, sonra kısa adımlarla, yavaş
     başlayıp yavaş durarak yürür (adım ritmi CSS'te). */
  function yuru(mk, hedef, bitince){
    temizle(mk);
    const yol = Math.abs(hedef - mk.x);
    mk.el.dataset.yon = hedef < mk.x ? 'sol' : 'sag';
    mk.el.classList.add('is-yuruyor');
    const a = mk.x, y = mk.y;
    mk.anim = mk.el.animate([{ transform:'translate(' + a + 'px,' + y + 'px)' }, { transform:'translate(' + hedef + 'px,' + y + 'px)' }],
      { duration:Math.max(900, yol / (HIZ * (HIZ_RUH[mk.el.dataset.ruh] || 1)) * 1000), delay:180, easing:'cubic-bezier(.45,.05,.4,1)', fill:'both' });
    mk.anim.onfinish = () => { mk.el.classList.remove('is-yuruyor'); koy(mk, hedef, y); mk.anim.cancel(); (bitince || dinlen)(mk); };
  }

  function zipla(mk, z, x, ms){
    temizle(mk);
    mk.el.dataset.yon = x < mk.x ? 'sol' : 'sag';
    mk.el.classList.add('is-ucuyor');
    const kare = sicrama({ x:mk.x, y:mk.y }, { x, y:z.y });
    mk.anim = mk.el.animate(kare, { duration:ms || 900, fill:'forwards' });
    mk.anim.onfinish = () => { mk.el.classList.remove('is-ucuyor'); mk.z = z; koy(mk, x, z.y); mk.anim.cancel(); dinlen(mk); };
  }

  /* Dururken küçük şeyler; huy olasılıkları değiştirir. Uyuyan bir sonraki
     turda gerinip uyanır (yasat). */
  function dinlen(mk){
    if(mesgulMu(mk)) return;
    const ne = ruhUygula(mk);
    const r = Math.random();
    const uyku = ne === 'uykulu' ? .4 : mk.huy === 'uykucu' ? .22 : ne ? .02 : .06;
    const otur = ne === 'uzgun' ? .45 : mk.huy === 'merakli' ? .12 : .2;
    if(ne === 'kizgin'){ hal(mk, ''); return sonra(mk, 1600 + Math.random() * 1200); }   // kollar kavuşuk, ayak vurur (CSS)
    if(r < uyku){ hal(mk, 'is-uyuyor'); return sonra(mk, 11000 + Math.random() * 9000); }
    if(r < uyku + otur){ hal(mk, 'is-oturuyor'); return sonra(mk, 6000 + Math.random() * 7000); }
    const s = r - uyku - otur;
    if(ne === 'uykulu' && s < .25){ hal(mk, 'is-esniyor'); return sonra(mk, 2600 + Math.random() * 2000); }
    /* Küçük işler: kaşınma, silkinme; mutlu ya da neşeli olan dans eder. */
    const hop = ne === 'mutlu' ? .5 : ne === 'uzgun' ? .3 : .38;
    const dans = ne === 'mutlu' || mk.huy === 'neseli' ? .12 : 0;
    const is = s < .2 ? 'is-bakiyor' : s < .3 ? 'is-kirpiyor' : s < hop ? 'is-hopluyor'
      : s < hop + .14 ? 'is-kasiniyor' : s < hop + .2 ? 'is-silkiniyor' : s < hop + .2 + dans ? 'is-dans' : '';
    if(is === 'is-dans') mk.el.querySelector('.minik__balon').textContent = '♪';
    hal(mk, is);
    sonra(mk, (is === 'is-kasiniyor' || is === 'is-dans' ? 2700 : 2200) + Math.random() * 4200);
  }

  /* Sohbet: ikisi birbirine döner, sırayla balon açar. */
  function sohbet(a, b){
    [a, b].forEach(m => { clearTimeout(m.zaman); if(m.anim) m.anim.cancel(); mesgul(m, true); temizle(m); m.el.classList.remove('is-yuruyor'); });
    const solda = a.x < b.x ? a : b, sagda = solda === a ? b : a;
    solda.el.dataset.yon = 'sag'; sagda.el.dataset.yon = 'sol';
    const sira = [a, b, a, b, a].slice(0, 3 + Math.floor(Math.random() * 3));
    sira.forEach((m, i) => zamanla(() => {
      if(!durum.kat || kapaliMi()) return;
      (m === a ? b : a).el.classList.remove('is-konusuyor');
      m.el.querySelector('.minik__balon').textContent = rasgele(BALON);
      hal(m, 'is-konusuyor');
      ses('bla', m, false);
      if(i === 0) ekHal(m, 'is-selam', 900);
    }, i * 1300));
    zamanla(() => {
      [a, b].forEach(m => { mesgul(m, false); temizle(m); });
      hal(a, 'is-hopluyor');
      sonra(a, 1800 + Math.random() * 1500); sonra(b, 2800 + Math.random() * 2500);
    }, sira.length * 1300 + 400);
  }

  /* Gıdıklanınca kıvrılır, gözleri «^ ^» olur, kıkırdar; uyuyorsa irkilir. */
  /* Çok gıdıklanınca kızar: ayak vurur, «hıh!» der, kollarını kavuşturur,
     imleçten başını çevirir (CSS); kızgınlık geçince bir süre küser, tek
     bir dokunuşla barışır. */
  function gidikla(mk){
    if(mesgulMu(mk)) return;
    clearTimeout(mk.zaman);
    if(mk.anim){ mk.anim.cancel(); mk.el.classList.remove('is-yuruyor'); koy(mk, mk.x, mk.y); }
    const uyuyordu = mk.el.classList.contains('is-uyuyor');
    const olay = dokun(ruhu(mk), Date.now());
    ruhUygula(mk);
    if(olay === 'kizdi' || olay === 'hirr'){
      mk.el.querySelector('.minik__balon').textContent = olay === 'kizdi' ? 'hıh!' : 'hı-ıh';
      hal(mk, 'is-tepin'); mk.el.classList.add('is-konusuyor');
      ses('hirr', mk);
      return sonra(mk, 1400);
    }
    hal(mk, uyuyordu ? 'is-uyaniyor' : 'is-gidik');
    if(!uyuyordu) ekHal(mk, 'is-kalp', 1400);
    ses(uyuyordu ? 'tik' : 'gidik', mk);
    sonra(mk, uyuyordu ? 1600 : 1500);
  }

  /* Sayfada zaten durur gibi: görünen bir kenarın üstüne, animasyonsuz.
     Miniklerin her biri başka kenara düşer (yeterince kenar varsa). */
  function yerlestir(mk){
    const g = gorunenler(durum.zeminler, { ust:window.scrollY || 0, boy:window.innerHeight || 800 });
    const l = g.length ? g : durum.zeminler;
    if(!l.length){ mk.z = null; mk.el.hidden = true; return false; }
    const dolu = durum.minikler.filter(o => o !== mk && o.z).map(o => o.z.el);
    const bos = l.filter(z => dolu.indexOf(z.el) < 0);
    const z = rasgele(bos.length ? bos : l);
    mk.z = z; mk.el.hidden = false;
    koy(mk, z.x1 + 20 + Math.random() * Math.max(0, z.x2 - z.x1 - 40), z.y);
    return true;
  }

  function yasat(mk){
    if(!durum.kat || kapaliMi() || mesgulMu(mk)) return;
    /* Her adımdan önce kenarlar yeniden ölçülür: kart giriş animasyonuyla,
       açılıp kapanan bölümle ya da yazı yüklenince kayabilir. */
    const l = durum.zeminler = olcum();
    if(mk.z){
      const ayni = l.find(o => o.el === mk.z.el);
      mk.z = ayni || null;
      if(ayni && Math.abs(ayni.y - mk.y) > 1) koy(mk, Math.min(ayni.x2, Math.max(ayni.x1, mk.x)), ayni.y);
    }
    if(!mk.z){ yerlestir(mk); return sonra(mk, 1800 + Math.random() * 2000); }
    if(mk.el.classList.contains('is-uyuyor')){ hal(mk, 'is-uyaniyor'); return sonra(mk, 1600); }
    const ne = ruhUygula(mk);
    /* Kızgın: imleçten uzağa, kenarın öbür ucuna yürür. */
    if(ne === 'kizgin'){
      const uzak = imlec && imlec.x + (window.scrollX || 0) > mk.x ? mk.z.x1 + 20 : mk.z.x2 - 20;
      if(Math.abs(uzak - mk.x) > 30) return yuru(mk, uzak);
      return dinlen(mk);
    }
    /* Aynı karttaki arkadaşının yanına gidip sohbet açar (konuşkan daha sık);
       üzgün ya da kızgın olan sohbete girmez. */
    const es = sohbetEsi(durum.minikler, mk);
    const keyifli = m => { const r = ruhNe(m); return r !== 'kizgin' && r !== 'uzgun'; };
    if(es && keyifli(mk) && keyifli(es) && !mesgulMu(es) && !es.el.classList.contains('is-uyuyor') && Math.random() < (mk.huy === 'konuskan' ? .45 : ne === 'mutlu' ? .3 : .2)){
      clearTimeout(es.zaman);
      if(es.anim){ es.anim.cancel(); es.el.classList.remove('is-yuruyor'); }
      if(Math.abs(es.x - mk.x) <= SOHBET_YAKIN + 10) return sohbet(mk, es);
      const hedef = es.x + (mk.x < es.x ? -SOHBET_YAKIN : SOHBET_YAKIN);
      mesgul(es, true);
      return yuru(mk, Math.min(mk.z.x2, Math.max(mk.z.x1, hedef)), () => { mesgul(es, false); sohbet(mk, es); });
    }
    const yan = komsular(l, mk.z, mk.x);
    if(yan.length && Math.random() < .12){
      const z = rasgele(yan);
      return zipla(mk, z, adim(z, Math.max(z.x1, Math.min(z.x2, mk.x)), Math.random, 40));
    }
    if(Math.random() < .3) return dinlen(mk);   // bazen hiç yürümez
    yuru(mk, adim(mk.z, mk.x, Math.random, 40));
  }

  /* Sayfa yeniden çizilince ya da boyut değişince kenarlar tazelenir; kartı
     kayan minik kenara oturur, kartı kaybolan minik yeni sayfada zaten
     bir kartın üstünde durur (belirme animasyonu yok). */
  function tazele(){
    durum.bekle = 0;
    if(!durum.kat) return;
    /* Sayfa yeniden çizildi ya da kaydı: imleç yerinde, altındaki kart değişmiş olabilir. */
    if(imlec && (!hedef || !hedef.isConnected || durum.isikTazele)){ hedef = null; elIsigi(); }
    durum.isikTazele = false;
    if(kapaliMi()){ durum.kat.hidden = true; return; }
    durum.kat.hidden = false;
    durum.zeminler = olcum();
    durum.minikler.forEach(mk => {
      const ayni = mk.z && durum.zeminler.find(o => o.el === mk.z.el);
      if(ayni){
        mk.z = ayni;
        if(Math.abs(ayni.y - mk.y) > .5 && !(mk.anim && mk.anim.playState === 'running')) koy(mk, Math.min(ayni.x2, Math.max(ayni.x1, mk.x)), ayni.y);
      } else {
        /* Sayfa değiştiyse yerleşmeyi sayfaDegisti yapar (içerik oturunca). */
        if(durum.yerlesme) return;
        /* Aynı sayfa yeniden çizildi (kart yenisiyle değişti): miniğin
           altındaki yeni kenar bulunur, minik yerinde kalır. Bulunmazsa
           görünen bir kenara konur — eski yerinde havada beklemez. */
        const yakin = !(mk.anim && mk.anim.playState === 'running')
          && durum.zeminler.find(o => mk.x >= o.x1 && mk.x <= o.x2 && Math.abs(o.y - mk.y) < 60);
        if(yakin){ mk.z = yakin; koy(mk, mk.x, yakin.y); return; }
        if(mk.anim) mk.anim.cancel();
        mesgul(mk, false); temizle(mk);
        mk.el.classList.remove('is-yuruyor', 'is-ucuyor');
        if(yerlestir(mk)) sonra(mk, 1800 + Math.random() * 2000);
      }
    });
  }
  /* Sayfa değişti: yarım işler silinir, sayfanın kendi kadrosu giyinir ve
     sayfanın içeriği yerine oturunca (giriş animasyonu ~700 ms) kartların
     üstünde durur; o ana kadar katman sayfa girişiyle birlikte gizlidir. */
  function sayfaDegisti(){
    const anahtar = document.documentElement.dataset.sayfa || '';
    if(anahtar === durum.sayfa) return;
    durum.sayfa = anahtar;
    durum.zamanlar.forEach(clearTimeout); durum.zamanlar = [];
    const k = kadro(anahtar, durum.minikler.length);
    durum.minikler.forEach((mk, i) => {
      clearTimeout(mk.zaman);
      if(mk.anim){ mk.anim.cancel(); mk.anim = null; }
      mesgul(mk, false); temizle(mk);
      mk.el.classList.remove('is-yuruyor', 'is-ucuyor', 'is-farkinda', 'is-takip');
      giydir(mk, KISILER[k[i]]);
      mk.z = null;
    });
    clearTimeout(durum.yerlesme);
    durum.yerlesme = setTimeout(() => {
      durum.yerlesme = 0;
      durum.zeminler = olcum();
      durum.minikler.forEach((mk, i) => { if(yerlestir(mk)) sonra(mk, 2000 + i * 1400); });
    }, 720);
  }

  /* Sayı değişince: fazlası iner, eksiği kadronun sıradakiyle görünen bir
     kenara konur (sayfayı yeniden açmadan). */
  function sayiUygula(){
    if(!durum.kat) return;
    const n = simdikiSayi();
    while(durum.minikler.length > n){
      const mk = durum.minikler.pop();
      clearTimeout(mk.zaman); if(mk.anim) mk.anim.cancel();
      mk.el.remove();
    }
    if(durum.minikler.length >= n) return;
    const k = kadro(durum.sayfa, n);
    durum.zeminler = olcum();
    for(let i = durum.minikler.length; i < n; i++){
      const mk = minikYap(i);
      giydir(mk, KISILER[k[i]]);
      durum.kat.appendChild(mk.el); durum.minikler.push(mk);
      if(yerlestir(mk)) sonra(mk, 1200 + i * 900);
    }
  }
  function ayarla(n){
    try{ localStorage.setItem(ANAHTAR, String(n)); }catch(e){ /* depo kapalı: bu sayfada geçerli */ }
    const s = simdikiSayi();
    document.querySelectorAll('[data-minik-sec]').forEach(b => {
      const on = Number(b.getAttribute('data-minik-sec')) === s;
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    sayiUygula();
    return s;
  }
  if(typeof document !== 'undefined'){
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest ? e.target.closest('[data-minik-sec]') : null;
      if(!b) return;
      e.preventDefault();
      ayarla(Number(b.getAttribute('data-minik-sec')));
    });
    window.addEventListener('storage', e => { if(e.key === ANAHTAR) sayiUygula(); });
  }

  /* İki ölçüm: biri hemen, biri kartların giriş animasyonu bittikten sonra. */
  let ikinci = 0;
  function iste(){
    if(!durum.bekle) durum.bekle = setTimeout(tazele, 120);
    clearTimeout(ikinci); ikinci = setTimeout(tazele, 700);
  }

  /* Gözler fareyi izler; imlecin altındaki en dış cam kartta ışık imleci
     takip eder (cam.css «EL IŞIĞI»). İkisi de karede en çok bir kez.
     Işık imlece gecikmeyle yetişir (her karede yolun %22'si: suyun
     altındaki ışık gibi süzülür); miniğin üstündeyken altındaki kartta
     kalır; kart yeniden çizilince (tıklama, kayıt) aynı yerdeki yeni
     karta sönmeden geçer. Ayrılınca --mx/--my kalır: ışık olduğu yerde söner. */
  let imlec = null, kare = 0, hedef = null, isikli = null, isikKare = 0;
  const isikYer = { x:0, y:0, hx:0, hy:0 };
  function isikKarti(){
    let el = hedef;
    if(imlec && (!el || !el.isConnected)) el = hedef = document.elementFromPoint(imlec.x, imlec.y);
    const m = el && el.closest && el.closest('.minik');
    if(m){ const mk = durum.minikler.find(o => o.el === m); return mk && mk.z && mk.z.el && mk.z.el.isConnected ? mk.z.el : null; }
    let k = el && el.closest ? el.closest(KART) : null;
    while(k && k.parentElement && k.parentElement.closest(KART)) k = k.parentElement.closest(KART);
    return k;
  }
  function elIsigi(){
    const k = imlec ? isikKarti() : null;
    const kopan = isikli && !isikli.isConnected;
    if(isikli && isikli !== k) isikli.classList.remove('isikli', 'isik-bas');
    if(!k){ isikli = null; return; }
    const r = k.getBoundingClientRect();
    isikYer.hx = imlec.x - r.left; isikYer.hy = imlec.y - r.top;
    if(isikli !== k){
      if(!kopan){ isikYer.x = isikYer.hx; isikYer.y = isikYer.hy; }
      else k.classList.add('isik-hemen');
      k.classList.add('isikli');
      isikli = k;
    }
    if(!isikKare) isikKare = requestAnimationFrame(isikAdim);
  }
  function isikAdim(){
    isikKare = 0;
    if(!isikli) return;
    isikli.classList.remove('isik-hemen');
    isikYer.x += (isikYer.hx - isikYer.x) * .22; isikYer.y += (isikYer.hy - isikYer.y) * .22;
    isikli.style.setProperty('--mx', isikYer.x.toFixed(1) + 'px');
    isikli.style.setProperty('--my', isikYer.y.toFixed(1) + 'px');
    if(Math.abs(isikYer.hx - isikYer.x) + Math.abs(isikYer.hy - isikYer.y) > .6) isikKare = requestAnimationFrame(isikAdim);
  }
  /* Basınca ışık parmağın altında toplanır; bırakınca yayılır. */
  function bas(e){ if(isikli && isikli.contains(e.target)) isikli.classList.add('isik-bas'); }
  function birak(){ if(isikli) isikli.classList.remove('isik-bas'); }
  function gozler(){
    kare = 0;
    elIsigi();
    durum.minikler.forEach(mk => {
      if(mk.el.hidden || mk.el.classList.contains('is-uyuyor')){ mk.el.classList.remove('is-takip'); return; }
      const r = mk.el.getBoundingClientRect();
      const y = imlec && gozYonu({ x:r.left + r.width / 2, y:r.top + r.height / 2 }, imlec);
      mk.el.classList.toggle('is-takip', !!y);
      if(y){ mk.el.style.setProperty('--gx', y.x + 'px'); mk.el.style.setProperty('--gy', y.y + 'px'); }
    });
  }
  function fare(e){
    imlec = { x:e.clientX, y:e.clientY };
    hedef = e.target;
    if(!kare) kare = requestAnimationFrame(gozler);
  }

  /* Dokunulan kartın üstündeki minik yerinde sevinip zıplar. */
  function sevin(e){
    const kart = e.target && e.target.closest && e.target.closest(KART);
    if(!kart) return;
    durum.minikler.forEach(mk => {
      if(mesgulMu(mk) || !mk.z || mk.z.el !== kart || (mk.anim && mk.anim.playState === 'running')) return;
      clearTimeout(mk.zaman); temizle(mk);
      zipla(mk, mk.z, mk.x, 620);
    });
  }

  function kur(){
    if(durum.kat || typeof document === 'undefined') return;
    /* Uygulama ilk açılışta kurulum ekranındaysa kabuk henüz yok: kabuk
       çizilince kurulur (test sayfasında #app yok, hiç kurulmaz). */
    if(!document.querySelector('#app .site--v5')){
      const app = document.getElementById('app');
      if(app && !durum.bekci && typeof MutationObserver === 'function'){
        durum.bekci = new MutationObserver(() => {
          if(!document.querySelector('#app .site--v5')) return;
          durum.bekci.disconnect(); durum.bekci = null; kur();
        });
        durum.bekci.observe(app, { childList:true, subtree:true });
      }
      return;
    }
    const kat = document.createElement('div');
    kat.className = 'minikkat';
    kat.setAttribute('aria-hidden', 'true');
    document.body.appendChild(kat);
    durum.kat = kat;
    const n = simdikiSayi();
    for(let i = 0; i < n; i++){ const mk = minikYap(i); kat.appendChild(mk.el); durum.minikler.push(mk); }
    durum.sayfa = document.documentElement.dataset.sayfa || '';
    const ilk = kadro(durum.sayfa, durum.minikler.length);
    durum.minikler.forEach((mk, i) => giydir(mk, KISILER[ilk[i]]));
    durum.zeminler = olcum();
    durum.minikler.forEach((mk, i) => { if(yerlestir(mk)) sonra(mk, 2500 + i * 1700); });
    iste();
    const icerik = document.querySelector('.site--v5') || document.body;
    if(typeof MutationObserver === 'function') new MutationObserver(iste).observe(icerik, { childList:true, subtree:true });
    /* Kökün sınıfı sık değişir (kenar-sakin…): yalnız açık/kapalı geçişinde uyanır. */
    let onceki = kapaliMi();
    new MutationObserver(() => {
      if((document.documentElement.dataset.sayfa || '') !== durum.sayfa) sayfaDegisti();
      const k = kapaliMi();
      if(k === onceki) return;
      onceki = k; tazele();
      if(!k) durum.minikler.forEach(mk => sonra(mk, 400));
    }).observe(document.documentElement, { attributes:true, attributeFilter:['class', 'data-zemin', 'data-sayfa'] });
    /* Bekçi: kart DOM değişmeden de kayabilir (üstteki kapak büyür, yazı
       yüklenir); saniyede bir miniğin durduğu kartın yeri okunur (en çok üç
       ölçüm), kaymışsa minik kenarla birlikte iner. */
    setInterval(() => {
      if(durum.kat.hidden || document.visibilityState === 'hidden') return;
      const sy = window.scrollY || 0;
      if(durum.minikler.some(mk => mk.z && mk.z.el && !(mk.anim && mk.anim.playState === 'running')
        && Math.abs(mk.z.el.getBoundingClientRect().top + sy - mk.y) > 1)) tazele();
    }, 1000);
    window.addEventListener('resize', iste);
    window.addEventListener('scroll', () => { durum.isikTazele = true; iste(); }, { passive:true });
    document.addEventListener('pointerdown', bas, true);
    document.addEventListener('pointerup', birak, true);
    document.addEventListener('pointercancel', birak, true);
    document.addEventListener('click', sevin, true);
    document.addEventListener('pointermove', fare, { passive:true });
  }

  if(typeof document !== 'undefined'){
    if(document.readyState === 'complete') setTimeout(kur, 60);
    else window.addEventListener('load', () => setTimeout(kur, 60));
  }

  return { kur, sayi, seciciHtml, ayarla, ANAHTAR, EN_COK, zeminler, gorunenler, adim, komsular, sicrama, gozYonu, sohbetEsi, kadro, yeniRuh, dokun, ruh,
    KISILER, HUY_AD, RUH, RUH_AD, KART, EN_AZ, PAY };
})();
