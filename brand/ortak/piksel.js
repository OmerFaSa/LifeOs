/* PİKSEL — temanın tuvali, simgeleri ve tepkileri (brand/ortak/piksel.css); sahne piksel-apartman.js'te.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/piksel.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır.

   Sözler:
     1. SÜSTÜR. Hiçbir sayıya ve karara bakmaz, veri okumaz, yazmaz. Düşerse yalnız duvar düz kalır.
     2. KODLA ÇİZİLİR. Görsel dosyası yok; çevrimdışı ve tek dosyada çalışır.
     3. EKRANI YORMAZ. Sahne bir kez hazırlanır, yalnız değişen bölge 8 kare/sn yenilenir;
        sekme arkadayken ya da sayfa kaydırılmışken durur; animasyon kapalıysa tek kare çizilir.
     4. KART ÇEKİLİR. Üç dakika işlem olmazsa ya da arka plana çift tıklanırsa kart ve menü çekilir, sahne görünür. */
window.LIFEOS = window.LIFEOS || {};

(function(L){
  const OLCEK = 4;

  /* ---------- FİGÜRLER: piksel-figur.js'teki çizimler; CSS --fig-* ile kullanır ---------- */
  function figurSvg(ad, boy){
    const f = L.PIKSEL_FIGUR && L.PIKSEL_FIGUR[ad];
    if(!f) return '';
    const yol = {};
    f.s.forEach((r, y) => { for(let x = 0; x < r.length; x++){ const c = f.p[r[x]]; if(c) yol[c] = (yol[c] || '') + 'M' + x + ' ' + y + 'h1v1h-1z'; } });
    const G = f.s[0].length, Y = f.s.length;
    return '<svg xmlns="http://www.w3.org/2000/svg" data-px="1" data-pxc="1" viewBox="0 0 ' + G + ' ' + Y + '"' + (boy ? ' width="' + boy + '" height="' + boy + '"' : '') + ' shape-rendering="crispEdges" aria-hidden="true">'
      + Object.keys(yol).map(c => '<path fill="' + c + '" d="' + yol[c] + '"/>').join('') + '</svg>';
  }
  function figurleriKoy(){
    if(!L.PIKSEL_FIGUR) return;
    Object.keys(L.PIKSEL_FIGUR).forEach(ad => document.documentElement.style.setProperty('--fig-' + ad, 'url("data:image/svg+xml,' + encodeURIComponent(figurSvg(ad, ad.indexOf('imlec') === 0 ? 32 : 0)) + '")'));   // imleç boyutsuz çizilmez
  }

  /* ---------- SİMGELER: bütün çizgi simgeler piksel ızgarasına oturur ----------
     150'den fazla simge 15 ayrı listede duruyor; hepsi aynı anda çevrilir. Tuvalde alan kaplamasıyla
     örneklenir, sonuç tek yol olur ve önbelleğe girer. Grafik, halka, görsel kart ve Rütbe çevrilmez. */
  const SIMGE_ATLA = '.vk, .rutbe, .perde, .grafik, [data-grafik], .halka, .gosterge, .sparkline, canvas, .piksel-oda, .minikkat';
    const simgeOnbellek = new Map();
  function parcaCiz(c, e, k){
    const a = n => parseFloat(e.getAttribute(n)) || 0, t = e.tagName.toLowerCase();
    const p = new Path2D();
    if(t === 'path') p.addPath(new Path2D(e.getAttribute('d') || ''));
    else if(t === 'circle') p.arc(a('cx'), a('cy'), a('r'), 0, Math.PI * 2);
    else if(t === 'ellipse') p.ellipse(a('cx'), a('cy'), a('rx'), a('ry'), 0, 0, Math.PI * 2);
    else if(t === 'rect') p.rect(a('x'), a('y'), a('width'), a('height'));
    else if(t === 'line'){ p.moveTo(a('x1'), a('y1')); p.lineTo(a('x2'), a('y2')); }
    else if(t === 'polyline' || t === 'polygon'){
      const n = (e.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      for(let i = 0; i + 1 < n.length; i += 2){ if(i) p.lineTo(n[i], n[i + 1]); else p.moveTo(n[i], n[i + 1]); }
      if(t === 'polygon') p.closePath();
    } else return false;
    const s = getComputedStyle(e), dolgu = s.fill && s.fill !== 'none' && s.fillOpacity !== '0', cizgi = s.stroke && s.stroke !== 'none';
    c.fillStyle = c.strokeStyle = '#000'; c.lineCap = 'round'; c.lineJoin = 'round';
    if(dolgu) c.fill(p);
    if(cizgi){ c.lineWidth = Math.max(parseFloat(s.strokeWidth) || 1.5, 1.9) * k; c.stroke(p); }
    return true;
  }
  /* Saf çekirdek: kaplama dizisinden yol. */
  function kaplamaYol(alfa, n, kat, esik){
    let d = '';
    for(let y = 0; y < n; y++) for(let x = 0; x < n; x++){
      let top = 0;
      for(let j = 0; j < kat; j++) for(let i = 0; i < kat; i++) top += alfa[((y * kat + j) * n * kat + (x * kat + i)) * 4 + 3];
      if(top / (kat * kat * 255) >= esik) d += 'M' + x + ' ' + y + 'h1v1h-1z';
    }
    return d;
  }
  const simgeBoyu = svg => parseFloat(getComputedStyle(svg).width) || parseFloat(svg.getAttribute('width')) || 18;
  function simgeCevir(svg, boy){
    if(svg.dataset.px) return;
    svg.dataset.px = '1';
    if(svg.closest(SIMGE_ATLA)) return;
    const ol = boy || simgeBoyu(svg);
    /* Elle çizim: ad kaynak işlevden gelir (kabuk.simge, UI.icon, kisayol.simge, hesap.ikon). */
    const el = L.PIKSEL_SIMGE && L.PIKSEL_SIMGE.bul(svg.getAttribute('data-simge'));
    if(el && ol <= 48){
      let d = '';
      el.forEach((r, y) => { for(let x = 0; x < r.length; x++) if(r[x] === '#') d += 'M' + x + ' ' + y + 'h1v1h-1z'; });
      const kat = ol >= 17 ? 2 : 1;
      svg.setAttribute('viewBox', '0 0 12 12');
      svg.setAttribute('shape-rendering', 'crispEdges');
      svg.style.width = svg.style.height = (12 * kat) + 'px';
      svg.innerHTML = '<path d="' + d + '" style="fill:currentColor;stroke:none"/>';
      return;
    }
    if(svg.querySelector('text,use,image,defs,[transform],[stroke-dasharray]')) return;
    const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if(vb.length !== 4 || vb[2] !== vb[3] || vb[2] > 48 || vb[2] < 8 || !svg.firstElementChild) return;
    if(ol > 48) return;
    /* Elle çizilmemiş simge: bir piksele bir hücre, kenar yumuşatması yok. */
    const n = Math.max(10, Math.round(ol)), anahtar = n + '|' + vb[2] + '|' + svg.innerHTML;
    let d = simgeOnbellek.get(anahtar);
    if(d === undefined){
      const kat = 5, t = document.createElement('canvas');
      t.width = t.height = n * kat;
      const c = t.getContext('2d', { willReadFrequently:true }), k = n * kat / vb[2];
      c.setTransform(k, 0, 0, k, -vb[0] * k, -vb[1] * k);
      let tamam = true;
      Array.from(svg.children).forEach(e => { if(e.tagName.toLowerCase() === 'g') Array.from(e.children).forEach(x => { tamam = parcaCiz(c, x, 1) && tamam; }); else tamam = parcaCiz(c, e, 1) && tamam; });
      d = tamam ? kaplamaYol(c.getImageData(0, 0, n * kat, n * kat).data, n, kat, 0.5) : '';
      simgeOnbellek.set(anahtar, d);
    }
    if(!d) return;
    svg.setAttribute('viewBox', '0 0 ' + n + ' ' + n);
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.style.width = svg.style.height = n + 'px';
    svg.innerHTML = '<path d="' + d + '" style="fill:currentColor;stroke:none"/>';
  }
  /* Çizimler ızgaraya oturur: grafik noktası kare olur, halka ve yay bloklara bölünür. Değer aynı kalır:
     yalnız üstüne zemin renginde aralık çizilir, dolu kısmın uzunluğuna dokunulmaz. */
  const CIZIM_ATLA = '.rutbe, .perde, .piksel-oda, .kenar, .altbant';
  function cizimCevir(svg){
    if(svg.dataset.pxc) return;
    svg.dataset.pxc = '1';
    if(svg.closest(CIZIM_ATLA) || typeof svg.getBBox !== 'function') return;
    const orbit = !!svg.closest('.agh');
    let halka = null;
    Array.from(svg.querySelectorAll('circle')).forEach(c => {
      const r = parseFloat(c.getAttribute('r')) || 0, s = getComputedStyle(c), dolu = s.fill && s.fill !== 'none';
      if(dolu && r > 0 && r <= (orbit ? 12 : 8)){
        const k = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        Array.from(c.attributes).forEach(a => { if(!/^(cx|cy|r)$/.test(a.name)) k.setAttribute(a.name, a.value); });
        const cx = parseFloat(c.getAttribute('cx')) || 0, cy = parseFloat(c.getAttribute('cy')) || 0;
        k.setAttribute('x', cx - r); k.setAttribute('y', cy - r); k.setAttribute('width', r * 2); k.setAttribute('height', r * 2);
        if(!c.hasAttribute('fill')) k.style.fill = s.fill;
        if(!c.hasAttribute('stroke') && s.stroke !== 'none'){ k.style.stroke = s.stroke; k.style.strokeWidth = s.strokeWidth; }
        c.replaceWith(k);
      } else if(!dolu && r >= 10 && !halka && !orbit) halka = c;
    });
    const yay = halka || svg.querySelector('.pk-gosterge__iz');
    if(!yay || svg.querySelector('.px-ara') || typeof yay.getTotalLength !== 'function') return;
    const L = yay.getTotalLength();
    if(!(L > 40)) return;
    const n = Math.max(12, Math.round(L / 10)), ara = yay.cloneNode(false), g = Math.min(3, L / n / 3);
    ara.removeAttribute('class');
    ara.setAttribute('class', 'px-ara');
    ara.setAttribute('aria-hidden', 'true');
    ara.style.cssText = 'fill:none;stroke:var(--surface);stroke-width:' + ((parseFloat(getComputedStyle(yay).strokeWidth) || 4) + 2) + ';stroke-dasharray:' + g + ' ' + (L / n - g) + ';stroke-dashoffset:0;animation:none;transition:none';
    const yazi = svg.querySelector('text');
    if(yazi) svg.insertBefore(ara, yazi); else svg.appendChild(ara);
  }
  /* Bölüm başlığı konusuna göre simge alır; eşleşmeyen kare işaretle kalır. Süs: veri okumaz. */
  const BASLIK_SIMGE = [['öğün', 'ogun'], ['beslen', 'ogun'], ['uyku', 'ay'], ['gece', 'ay'], ['kilo', 'tarti'], ['hareket', 'nabiz'], ['seans', 'nabiz'], ['nabız', 'nabiz'], ['ölçüm', 'nabiz'],
    ['toparlan', 'kalp'], ['his', 'kalp'], ['test', 'tup'], ['tahlil', 'tup'], ['takvim', 'takvim'], ['hafta', 'takvim'], ['program', 'takvim'], ['plan', 'takvim'], ['akış', 'saat'], ['hedef', 'hedef'],
    ['tekrar', 'yenile'], ['konu', 'kitap'], ['ders', 'kitap'], ['oku', 'kitap'], ['kart', 'kitap'], ['deneme', 'belge'], ['sına', 'belge'], ['seri', 'alev'], ['yol', 'harita'], ['not', 'kalem'], ['yazı', 'kalem'],
    ['müzik', 'nota'], ['öner', 'yildiz'], ['en iyi', 'yildiz'], ['uyarı', 'uyari'], ['risk', 'uyari'], ['ayar', 'ayar'], ['profil', 'kisi'], ['hesap', 'kisi']];
  function baslikAdi(metin){
    const m = String(metin || '').trim().toLocaleLowerCase('tr');
    if(m === 'su' || m.indexOf('su ') === 0) return 'damla';
    const b = BASLIK_SIMGE.find(x => m.indexOf(x[0]) >= 0);
    return b ? b[1] : null;
  }
  function baslikSimge(e){
    if(e.dataset.pxBas !== undefined) return;
    const ad = baslikAdi(e.textContent), r = ad && L.PIKSEL_SIMGE && L.PIKSEL_SIMGE.bul(ad);
    e.dataset.pxBas = ad || '';
    if(!r) return;
    let d = '';
    r.forEach((s, y) => { for(let x = 0; x < s.length; x++) if(s[x] === '#') d += 'M' + x + ' ' + y + 'h1v1h-1z'; });
    e.style.setProperty('--px-bas', 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" shape-rendering="crispEdges"><path d="' + d + '"/></svg>') + '")');
  }
  /* Önce bütün boylar okunur, sonra yazılır: simge simge oku-yaz her simgede yerleşimi baştan hesaplatıyordu
     (sayfa geçişi başına 70 ms, 2026-11-05). */
  function simgeleriTara(kokler){
    if(!secili()) return;
    const yeni = [];
    kokler = [].concat(kokler).filter(k => k && k.querySelectorAll);
    kokler.forEach(kok => {
      kok.querySelectorAll('.kutu__ad').forEach(baslikSimge);
      if(kok.tagName.toLowerCase() === 'svg'){ cizimCevir(kok); if(!kok.dataset.px) yeni.push(kok); }
      kok.querySelectorAll('svg:not([data-px])').forEach(s => yeni.push(s));
    });
    const boylar = yeni.map(simgeBoyu);
    yeni.forEach((s, i) => simgeCevir(s, boylar[i]));
    kokler.forEach(kok => kok.querySelectorAll('svg:not([data-pxc])').forEach(cizimCevir));
  }
  function simgeIzle(){
    if(/\/tests\//.test(location.pathname)) return;
    simgeleriTara(document.body);
    let bekleyen = false, kuyruk = [];
    new MutationObserver(l => {
      l.forEach(m => m.addedNodes.forEach(n => { if(n.nodeType === 1) kuyruk.push(n); }));
      if(bekleyen || !kuyruk.length) return;
      bekleyen = true;
      requestAnimationFrame(() => { bekleyen = false; const q = kuyruk; kuyruk = []; simgeleriTara(q); });
    }).observe(document.body, { childList:true, subtree:true });
  }

  const durum = { c:null, g:null, arka:null, o:null, zaman:null };
  const secili = () => document.documentElement.getAttribute('data-zemin') === 'piksel';
  function hareketsiz(){
    if(document.documentElement.getAttribute('data-hareket') === 'az') return true;
    return !!(L.ANIMASYON && L.ANIMASYON.azMi && L.ANIMASYON.azMi());
  }
  function kare(t){
    if(durum.g && durum.o) L.PIKSEL_APARTMAN.kare(durum.g, durum.arka, durum.o, t);
  }
  function hazirla(){
    if(!durum.c || !L.PIKSEL_APARTMAN) return;
    const W = Math.ceil(window.innerWidth / OLCEK), H = Math.ceil(window.innerHeight / OLCEK), A = L.PIKSEL_APARTMAN;
    durum.c.width = W; durum.c.height = H;
    durum.arka = document.createElement('canvas'); durum.arka.width = W; durum.arka.height = H;
    durum.o = A.yerlesim(W, H, A.vakit(new Date().getHours()));
    A.binaCiz(durum.arka.getContext('2d'), durum.o);
    durum.g = durum.c.getContext('2d');
    kare(Date.now() / 1000);
  }
  function dongu(){
    clearInterval(durum.zaman); durum.zaman = null;
    if(!durum.c || hareketsiz()) return;
    let n = 0;
    durum.zaman = setInterval(() => {
      if(document.visibilityState === 'hidden' || (window.scrollY > 260 && !document.documentElement.hasAttribute('data-bos'))) return;
      /* Vakit değişti mi: dakikada bir bakılır, değiştiyse bina yeniden çizilir */
      if(++n % 480 === 0 && durum.o && L.PIKSEL_APARTMAN.vakit(new Date().getHours()) !== durum.o.vakit) hazirla();
      kare(Date.now() / 1000);
    }, 125);
  }
  /* Boşta: kart ve menü çekilir, sahne kalır. Çift tıkla açılan el ile kapanır; hareketle kapanmaz. */
  const BOS_MS = 180000;
  const bos = { son:Date.now(), el:false };
  function bosEngel(){
    const e = document.activeElement;
    if(e && e.matches && e.matches('input,textarea,select,[contenteditable="true"]')) return true;
    if(document.querySelector('dialog[open],[aria-modal="true"]')) return true;
    return Array.from(document.querySelectorAll('video,audio')).some(m => !m.paused && m.tagName === 'VIDEO');
  }
  function bosAc(el){
    if(!secili() || !L.PIKSEL_APARTMAN) return;
    bos.el = !!el;
    document.documentElement.toggleAttribute('data-bos-el', bos.el);
    document.documentElement.setAttribute('data-bos', '1');
  }
  function bosKapa(){
    bos.el = false;
    const k = document.documentElement;
    k.removeAttribute('data-bos-el');
    if(k.getAttribute('data-bos') !== '1') return;
    k.setAttribute('data-bos', 'don');
    setTimeout(() => { if(k.getAttribute('data-bos') === 'don') k.removeAttribute('data-bos'); }, 420);
  }
  function bosIzle(){
    if(/\/tests\//.test(location.pathname)) return;
    const k = document.documentElement;
    const uyan = () => { bos.son = Date.now(); if(!bos.el) bosKapa(); };
    ['pointermove', 'wheel', 'touchstart'].forEach(o => window.addEventListener(o, uyan, { passive:true }));
    ['pointerdown', 'keydown'].forEach(o => window.addEventListener(o, e => {
      bos.son = Date.now();
      if(k.getAttribute('data-bos') !== '1') return;
      /* Elle açılan sahnede canlıya dokunmak sahneyi kapatmaz, balon çıkarır; boşa dokunmak kapatır. */
      if(o === 'pointerdown' && bos.el && durum.o && L.PIKSEL_APARTMAN.dokun(durum.o, e.clientX / OLCEK, e.clientY / OLCEK, Date.now() / 1000)) return;
      bosKapa();
    }, { capture:true, passive:true }));
    /* King'in odası: King arayüzünde açıkken döner; dokununca aksolot kalp çıkarır */
    let kalp = 0;
    window.addEventListener('pointerdown', e => { if(e.target && e.target.matches && e.target.matches('canvas.king__oda')) kalp = Date.now() + 3000; }, { capture:true, passive:true });
    setInterval(() => {
      const c = document.visibilityState === 'hidden' ? null : document.querySelector('canvas.king__oda'), A = L.PIKSEL_APARTMAN;
      if(c && A) A.kingOda(c, hareketsiz() ? 0 : Date.now() / 1000, A.vakit(new Date().getHours()), Date.now() < kalp);
    }, 125);
    document.addEventListener('dblclick', o => {
      const t = o.target;
      if(!k.hasAttribute('data-bos') && t && t.matches && t.matches('html,body,.piksel-oda,.site--v5,.site__body,.sarmal,#app')) bosAc(true);
    });
    setInterval(() => {
      if(k.hasAttribute('data-bos') || document.visibilityState === 'hidden' || hareketsiz() || Date.now() - bos.son < BOS_MS || bosEngel()) return;
      bosAc(false);
    }, 5000);
  }
  /* Kıvılcım: gerçek bir kayıt ya da tikte sekiz kare dağılır. Süs: veri okumaz, hareket ayarına uyar. */
  const KIVILCIM = [[-16, -16], [0, -24], [16, -16], [24, 0], [16, 16], [0, 24], [-16, 16], [-24, 0]];
  function kivilcim(x, y, renkler){
    if(!secili() || hareketsiz() || !document.body) return 0;
    const R = renkler || ['#ffd35a', '#f2a24e', '#fff8ea'], kap = document.createElement('div');
    kap.className = 'px-kivilcim';
    kap.setAttribute('aria-hidden', 'true');
    kap.style.left = Math.round(x) + 'px';
    kap.style.top = Math.round(y) + 'px';
    KIVILCIM.forEach((d, i) => {
      const k = document.createElement('i');
      k.style.background = R[i % R.length];
      kap.appendChild(k);
      const son = 'translate(' + d[0] + 'px,' + d[1] + 'px)';
      k.animate([{ transform:'none', opacity:1 }, { transform:son, opacity:1, offset:.75 }, { transform:son, opacity:0 }], { duration:360, easing:'steps(5, end)', fill:'forwards' });
    });
    document.body.appendChild(kap);
    setTimeout(() => kap.remove(), 420);
    return KIVILCIM.length;
  }
  /* Kayıtta bir kalp yükselir: yalnız gerçek kayıtta çağrılır. */
  function kayitTepki(e){
    const r = e.getBoundingClientRect(), n = kivilcim(r.left + r.width / 2, r.top + r.height / 2);
    const sim = L.PIKSEL_SIMGE && L.PIKSEL_SIMGE.bul('kalp');
    if(!n || !sim) return n;
    let d = '';
    sim.forEach((s, y) => { for(let x = 0; x < s.length; x++) if(s[x] === '#') d += 'M' + x + ' ' + y + 'h1v1h-1z'; });
    const kap = document.createElement('div');
    kap.className = 'px-kivilcim';
    kap.setAttribute('aria-hidden', 'true');
    kap.style.left = Math.round(r.left + r.width / 2 - 12) + 'px';
    kap.style.top = Math.round(r.top - 26) + 'px';
    kap.innerHTML = '<svg data-px="1" data-pxc="1" width="24" height="24" viewBox="0 0 12 12" shape-rendering="crispEdges"><path fill="#e8505b" d="' + d + '"/></svg>';
    document.body.appendChild(kap);
    kap.firstChild.animate([{ transform:'translateY(8px)', opacity:1 }, { transform:'translateY(-16px)', opacity:1, offset:.8 }, { transform:'translateY(-24px)', opacity:0 }], { duration:560, easing:'cubic-bezier(.2,.7,.3,1)', fill:'forwards' });
    setTimeout(() => kap.remove(), 620);
    return n;
  }
  function ogeKivilcim(e, renkler){
    const r = e.getBoundingClientRect();
    return kivilcim(r.left + r.width / 2, r.top + r.height / 2, renkler);
  }
  function tepkiIzle(){
    document.addEventListener('click', o => {
      const t = o.target;
      if(!t || !t.closest) return;
      const su = t.closest('.su-bardak');
      if(su){ ogeKivilcim(su, ['#58b9ec', '#e6f7ff', '#2f93cf']); return; }
      if(t.matches('input[type="checkbox"]:checked')){ ogeKivilcim(t); return; }
      const satir = t.closest('button.minrow:not(.is-done)');
      if(satir) ogeKivilcim(satir.querySelector('.minrow__mark') || satir);
    }, true);
  }
  function uygula(){
    if(!secili()){
      if(durum.c){ durum.c.remove(); durum.c = null; durum.g = null; }
      clearInterval(durum.zaman); durum.zaman = null;
      return;
    }
    if(!durum.c){
      durum.c = document.createElement('canvas');
      durum.c.className = 'piksel-oda';
      durum.c.setAttribute('aria-hidden', 'true');
      document.body.prepend(durum.c);
    }
    hazirla();
    dongu();
  }
  function kur(){
    uygula();
    simgeIzle();
    tepkiIzle();
    bosIzle();
    let bekle = null;
    window.addEventListener('resize', () => { clearTimeout(bekle); bekle = setTimeout(uygula, 150); });
    new MutationObserver(uygula).observe(document.documentElement, { attributes:true, attributeFilter:['data-zemin', 'data-hareket'] });
  }
  if(typeof document !== 'undefined'){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur); else kur();
  }
  if(typeof document !== 'undefined') figurleriKoy();
  L.PIKSEL = Object.freeze({ uygula, bosAc, bosKapa, figurSvg, kaplamaYol, simgeCevir, simgeleriTara, baslikAdi, kivilcim, ogeKivilcim, kayitTepki, cizimCevir });
})(window.LIFEOS);
