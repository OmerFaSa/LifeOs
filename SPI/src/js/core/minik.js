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
    { ad:'Pofuduk', bicim:'yuvarlak', tip:'kulak',   huy:'uykucu',   boy:34, ton:0,   perde:0.9 },
    { ad:'Bıcır',   bicim:'kare',     tip:'anten',   huy:'konuskan', boy:30, ton:28,  perde:1.15 },
    { ad:'Filiz',   bicim:'ucgen',    tip:'filiz',   huy:'merakli',  boy:36, ton:-26, perde:1.05 },
    { ad:'Ponpon',  bicim:'yuvarlak', tip:'kurdele', huy:'neseli',   boy:30, ton:-12, perde:1.25 },
    { ad:'Bulut',   bicim:'ucgen',    tip:'yok',     huy:'hayalci',  boy:32, ton:14,  perde:1 },
    { ad:'Bilge',   bicim:'kare',     tip:'yok',     huy:'bilge',    boy:33, ton:40,  perde:0.8 }
  ]);
  const HUY_AD = Object.freeze({ uykucu:'uykucu', konuskan:'konuşkan', merakli:'meraklı', neseli:'neşeli', hayalci:'hayalci', bilge:'bilge' });
  const BALON = Object.freeze(['hey!', '♪', '…', 'hı hı', 'ooo', '!?', 'hihi', '♡']);

  /* --- saf hesaplar (test edilir) --- */

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

  /* --- DOM --- */

  const durum = { kat:null, minikler:[], zeminler:[], bekle:0, zamanlar:[], sayfa:null, yerlesme:0, bekci:null };
  /* Sohbet gibi çok adımlı işlerin zamanlayıcıları: sayfa değişince silinir. */
  function zamanla(fn, ms){ const t = setTimeout(fn, ms); durum.zamanlar.push(t); return t; }
  /* Meşgul işareti 12 sn'de kendiliğinden düşer: yarıda kalan bir iş
     (iptal edilen yürüyüş, değişen sayfa) miniği sonsuza dek dondurmaz. */
  function mesgul(mk, v){ mk.mesgul = !!v; mk.mesgulSon = v ? Date.now() + 12000 : 0; }
  function mesgulMu(mk){ if(mk.mesgul && Date.now() > mk.mesgulSon) mesgul(mk, false); return mk.mesgul; }

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

  function giydir(mk, k){
    mk.huy = k.huy;
    mk.perde = k.perde;
    mk.el.querySelector('.minik__ad b').textContent = k.ad;
    mk.el.querySelector('.minik__ad i').textContent = HUY_AD[k.huy] || k.huy;
    mk.el.dataset.tip = k.tip;
    mk.el.dataset.bicim = k.bicim;
    mk.el.style.setProperty('--boy', k.boy + 'px');
    mk.el.style.setProperty('--ton', String(k.ton));   // birimsiz: oklch'nin h'si sayı
  }

  function minikYap(i){
    const m = document.createElement('div');
    m.className = 'minik minik--' + (i + 1);
    m.innerHTML = '<i class="minik__golge"></i><i class="minik__ayak minik__ayak--sol"></i><i class="minik__ayak minik__ayak--sag"></i>'
      + '<i class="minik__kol minik__kol--sol"></i><i class="minik__kol minik__kol--sag"></i>'
      + '<span class="minik__govde"><i class="minik__deri"></i><i class="minik__goz"></i><i class="minik__goz"></i>'
      + '<i class="minik__agiz"></i><i class="minik__sus"></i></span><span class="minik__balon"></span><span class="minik__zzz">z</span>'
      + '<span class="minik__kalp">♡</span><span class="minik__ad"><b></b> · <i></i><small>Dokun, gıdıkla</small></span>';
    const mk = { el:m, z:null, x:0, y:0, anim:null, zaman:0, huy:'', perde:1, mesgul:false, mesgulSon:0 };
    giydir(mk, KISILER[i % KISILER.length]);
    m.addEventListener('pointerenter', () => { m.classList.add('is-farkinda'); if(!mesgulMu(mk) && !m.classList.contains('is-uyuyor')) ekHal(mk, 'is-selam', 900); });
    m.addEventListener('pointerleave', () => m.classList.remove('is-farkinda'));
    m.addEventListener('click', e => { e.stopPropagation(); gidikla(mk); });
    return mk;
  }

  function koy(mk, x, y){
    mk.x = x; mk.y = y;
    mk.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
  }

  function sonra(mk, ms){ clearTimeout(mk.zaman); mk.zaman = setTimeout(() => yasat(mk), ms); }

  const HALLER = ['is-bakiyor', 'is-kirpiyor', 'is-hopluyor', 'is-oturuyor', 'is-uyuyor', 'is-uyaniyor', 'is-konusuyor', 'is-gidik', 'is-selam'];
  /* Kısa süren ek hâl (el sallama, kalp): hâlin üstüne biner, kendiliğinden düşer. */
  function ekHal(mk, h, ms){ mk.el.classList.add(h); setTimeout(() => mk.el.classList.remove(h), ms); }
  function temizle(mk){ HALLER.forEach(h => mk.el.classList.remove(h)); }
  function hal(mk, h){ temizle(mk); if(h){ void mk.el.offsetWidth; mk.el.classList.add(h); } }

  /* Paytak yürüyüş: önce yöne hafifçe eğilir, sonra kısa adımlarla, yavaş
     başlayıp yavaş durarak yürür (adım ritmi CSS'te). */
  function yuru(mk, hedef, bitince){
    temizle(mk);
    const yol = Math.abs(hedef - mk.x);
    mk.el.dataset.yon = hedef < mk.x ? 'sol' : 'sag';
    mk.el.classList.add('is-yuruyor');
    const a = mk.x, y = mk.y;
    mk.anim = mk.el.animate([{ transform:'translate(' + a + 'px,' + y + 'px)' }, { transform:'translate(' + hedef + 'px,' + y + 'px)' }],
      { duration:Math.max(900, yol / HIZ * 1000), delay:180, easing:'cubic-bezier(.45,.05,.4,1)', fill:'both' });
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
    const r = Math.random();
    const uyku = mk.huy === 'uykucu' ? .22 : .06;
    const otur = mk.huy === 'merakli' ? .12 : .2;
    if(r < uyku){ hal(mk, 'is-uyuyor'); return sonra(mk, 11000 + Math.random() * 9000); }
    if(r < uyku + otur){ hal(mk, 'is-oturuyor'); return sonra(mk, 6000 + Math.random() * 7000); }
    const s = r - uyku - otur;
    hal(mk, s < .2 ? 'is-bakiyor' : s < .34 ? 'is-kirpiyor' : s < .42 ? 'is-hopluyor' : '');
    sonra(mk, 2200 + Math.random() * 4200);
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
  function gidikla(mk){
    if(mesgulMu(mk)) return;
    clearTimeout(mk.zaman);
    if(mk.anim){ mk.anim.cancel(); mk.el.classList.remove('is-yuruyor'); }
    const uyuyordu = mk.el.classList.contains('is-uyuyor');
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
    /* Aynı karttaki arkadaşının yanına gidip sohbet açar (konuşkan daha sık). */
    const es = sohbetEsi(durum.minikler, mk);
    if(es && !mesgulMu(es) && !es.el.classList.contains('is-uyuyor') && Math.random() < (mk.huy === 'konuskan' ? .45 : .2)){
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

  /* İki ölçüm: biri hemen, biri kartların giriş animasyonu bittikten sonra. */
  let ikinci = 0;
  function iste(){
    if(!durum.bekle) durum.bekle = setTimeout(tazele, 120);
    clearTimeout(ikinci); ikinci = setTimeout(tazele, 700);
  }

  /* Gözler fareyi izler; imlecin altındaki en dış cam kartta ışık imleci
     takip eder (cam.css «EL IŞIĞI»). İkisi de karede en çok bir kez. */
  let imlec = null, kare = 0, hedef = null, isikli = null;
  function elIsigi(){
    let k = hedef && hedef.closest ? hedef.closest(KART) : null;
    while(k && k.parentElement && k.parentElement.closest(KART)) k = k.parentElement.closest(KART);
    if(isikli && isikli !== k){ isikli.classList.remove('isikli'); isikli.style.removeProperty('--mx'); isikli.style.removeProperty('--my'); }
    isikli = k;
    if(!k || !imlec) return;
    const r = k.getBoundingClientRect();
    k.style.setProperty('--mx', (imlec.x - r.left).toFixed(0) + 'px');
    k.style.setProperty('--my', (imlec.y - r.top).toFixed(0) + 'px');
    k.classList.add('isikli');
  }
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
    const en = window.innerWidth || 1024;
    const sayi = en < 680 ? 1 : en < 1100 ? 2 : 3;
    for(let i = 0; i < sayi; i++){ const mk = minikYap(i); kat.appendChild(mk.el); durum.minikler.push(mk); }
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
    window.addEventListener('scroll', iste, { passive:true });
    document.addEventListener('click', sevin, true);
    document.addEventListener('pointermove', fare, { passive:true });
  }

  if(typeof document !== 'undefined'){
    if(document.readyState === 'complete') setTimeout(kur, 60);
    else window.addEventListener('load', () => setTimeout(kur, 60));
  }

  return { kur, zeminler, gorunenler, adim, komsular, sicrama, gozYonu, sohbetEsi, kadro, KISILER, HUY_AD, KART, EN_AZ, PAY };
})();
