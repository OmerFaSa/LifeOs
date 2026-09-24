/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/hareket.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* HAREKET — T4 (ekip/EKIP-PLANI.md §4.2): hareket ve odak, üç arayüzde aynı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/hareket.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır.

   Uygulama her eylemde #app'i BAŞTAN çiziyor (innerHTML). O yüzden hareket
   CSS'e bırakılamaz: bir animasyon her yeniden çizimde baştan oynar. Burada
   çizimden ÖNCE bir fotoğraf alınır (`once`), çizimden SONRA yenisiyle
   karşılaştırılır (`sonra`) ve yalnız DEĞİŞEN öğe hareket eder:

     12  tek canlı öğe      ekranda yalnız ilk `.h-canli` nabız atar
     149 sayı yuvarlanması  `data-h-sayi` metni değiştiyse rakam yukarı kayar
     152 tik çizimi         `data-h-bitti` 0'dan 1'e döndüyse tik çizilir
     158 satır kapanma      `data-h-satir` kaybolduysa yerinde kapanır
     154 küçülen başlık     sayfa başlığı görünmezse üst çubuğa küçülür
     153 kart açılma        yönlendirmede basılan kart ayrıntıya büyür
     156 odak halkası akışı klavyeyle gezerken halka kayarak geçer
     159 önizleme           metindeki bağlantının üstünde küçük kart
     14  odak kapısı        `data-h-odak` varken gerisi sis; Esc çıkar

   Sözleşme: hareket BİLGİ taşımaz, yalnız değişikliği gösterir. Azaltılmış
   harekette hiçbiri çalışmaz; çalışmaması hiçbir işlevi bozmaz. Ekran
   hangi öğenin hareket edeceğini yalnız `data-h-*` ile söyler. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.HAREKET = (function(){
  const CANLI = '.h-canli, .gunserit__blok--suruyor';
  /* Bir çizimde bundan fazla satır kaybolduysa bu bir süzgeç ya da ekran
     değişimidir, silme değil: hayalet satır çizilmez. */
  const EN_COK_KAPANAN = 3;

  let foto = null;
  let ilkCizim = true;
  /* Ekranda ŞU AN çizili olan rota. Çağıranın `S.route`'u yönlendirmede
     çizimden ÖNCE değişir; «yeni ekran mı» ancak buradan bilinir. */
  let cizilenRota;
  let kaynakEl = null;
  let gozcu = null;

  function azMi(){
    try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch(e){ return true; }
  }
  function gorunur(e){ return !!(e && (e.offsetWidth || e.offsetHeight || e.getClientRects().length)); }
  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  function sec(kok, s){ return kok ? Array.from(kok.querySelectorAll(s)) : []; }

  /* ---------------------------------------------------------- fotoğraf */

  function once(kok){
    const f = { rota:cizilenRota, sayi:new Map(), bitti:new Map(), satir:[] };
    sec(kok, '[data-h-sayi]').forEach(e => f.sayi.set(e.getAttribute('data-h-sayi'), e.textContent.trim()));
    sec(kok, '[data-h][data-h-bitti]').forEach(e =>
      f.bitti.set(e.getAttribute('data-h'), e.getAttribute('data-h-bitti') === '1'));
    sec(kok, '[data-h-satir]').forEach(e => f.satir.push({
      k:e.getAttribute('data-h-satir'), h:e.offsetHeight, html:e.outerHTML }));
    foto = f;
    return f;
  }

  /* o.az: test ya da çağıran azaltılmış hareketi kendisi söyler. */
  function sonra(kok, rota, o){
    o = o || {};
    const az = o.az != null ? !!o.az : azMi();
    const onceki = foto; foto = null;
    const yeni = !onceki || onceki.rota !== rota;
    cizilenRota = rota;
    const sonuc = { yuvarla:0, tik:0, kapanan:0 };
    if(!kok) return sonuc;

    tekCanli(kok);
    baslikKopyala(kok);
    if(!az){
      const ust = kok.querySelector('.ust');
      if(ust && ilkCizim) ust.classList.add('h-ilk');
      const main = kok.querySelector('#main, .content');
      if(main && yeni) main.classList.add('h-yeni');
    }
    ilkCizim = false;
    baslikGozcusu(kok);
    if(az || yeni) return sonuc;

    /* 149 — değeri değişen sayı */
    sec(kok, '[data-h-sayi]').forEach(e => {
      const eski = onceki.sayi.get(e.getAttribute('data-h-sayi'));
      if(eski != null && eski !== e.textContent.trim()){ e.classList.add('h-yuvarla'); sonuc.yuvarla++; }
    });
    /* 152 — yeni biten iş */
    sec(kok, '[data-h][data-h-bitti="1"]').forEach(e => {
      if(onceki.bitti.get(e.getAttribute('data-h')) === false){ e.classList.add('h-tik'); sonuc.tik++; }
    });
    /* 158 — kaybolan satır yerinde kapanır */
    const simdi = new Map(sec(kok, '[data-h-satir]').map(e => [e.getAttribute('data-h-satir'), e]));
    const giden = onceki.satir.filter(s => !simdi.has(s.k));
    if(giden.length && giden.length <= EN_COK_KAPANAN){
      onceki.satir.forEach((s, i) => {
        if(simdi.has(s.k)) return;
        const sonraki = onceki.satir.slice(i + 1).find(x => simdi.has(x.k));
        const oncekiSatir = onceki.satir.slice(0, i).reverse().find(x => simdi.has(x.k));
        const komsu = sonraki ? simdi.get(sonraki.k) : oncekiSatir ? simdi.get(oncekiSatir.k) : null;
        if(!komsu || !komsu.parentNode) return;
        const h = hayalet(s);
        komsu.parentNode.insertBefore(h, sonraki ? komsu : komsu.nextSibling);
        kapat(h);
        sonuc.kapanan++;
      });
    }
    return sonuc;
  }

  /* Eski satırın kopyası: okunur ama dokunulamaz, kimlik taşımaz. */
  function hayalet(s){
    const kap = document.createElement('div');
    kap.className = 'h-kapanan';
    kap.setAttribute('aria-hidden', 'true');
    kap.setAttribute('inert', '');
    kap.style.height = s.h + 'px';
    kap.innerHTML = s.html;
    kap.querySelectorAll('[id], [data-act], [data-change], [data-h-satir], [name]').forEach(e => {
      ['id', 'data-act', 'data-change', 'data-h-satir', 'name'].forEach(a => e.removeAttribute(a));
    });
    return kap;
  }
  function kapat(h){
    const bitir = () => { if(h.parentNode) h.parentNode.removeChild(h); };
    requestAnimationFrame(() => requestAnimationFrame(() => { h.classList.add('is-kapali'); }));
    h.addEventListener('transitionend', e => { if(e.propertyName === 'height') bitir(); });
    setTimeout(bitir, 700);
  }

  /* ---------------------------------------------------------- 12 */

  function tekCanli(kok){
    const c = sec(kok, CANLI).filter(gorunur);
    c.slice(1).forEach(e => e.classList.add('h-sakin'));
    return c.length ? c[0] : null;
  }

  /* ---------------------------------------------------------- 154 */

  function baslikKopyala(kok){
    const h1 = kok.querySelector('.sayfabasi__baslik');
    const yuva = kok.querySelector('.ust__baslik');
    if(yuva) yuva.textContent = h1 ? h1.textContent.trim() : '';
  }
  function baslikGozcusu(kok){
    if(gozcu){ try{ gozcu.disconnect(); }catch(e){} gozcu = null; }
    const h1 = kok.querySelector('.sayfabasi__baslik');
    const ust = kok.querySelector('.ust');
    if(!h1 || !ust || typeof IntersectionObserver !== 'function') return;
    const payi = ust.offsetHeight || 64;
    gozcu = new IntersectionObserver(g => {
      const e = g[g.length - 1];
      ust.classList.toggle('is-kucuk', !e.isIntersecting && e.boundingClientRect.top < payi);
    }, { rootMargin:'-' + payi + 'px 0px 0px 0px', threshold:0 });
    gozcu.observe(h1);
  }

  /* ---------------------------------------------------------- 153 */

  /* Yönlendirmeyi başlatan öğe (bir kerelik). */
  function kaynak(el){ kaynakEl = el || null; }

  /* fn DOM'u değiştirir. Tarayıcı görünüm geçişini desteklemiyorsa ya da
     hareket azaltılmışsa fn doğrudan çalışır: geçiş süs değil akıcılıktır,
     olmaması işleyişi bozmaz. */
  function gecis(fn, o){
    o = o || {};
    const el = kaynakEl; kaynakEl = null;
    const az = o.az != null ? !!o.az : azMi();
    if(az || typeof document.startViewTransition !== 'function') return fn();
    const kart = el && el.closest ? el.closest('.kutu, .card, .lrow, .nextup, .okart') : null;
    try{
      if(kart) kart.style.viewTransitionName = 'h-kart';
      const t = document.startViewTransition(async () => {
        await fn();
        const m = document.getElementById('main');
        if(kart && m) m.style.viewTransitionName = 'h-kart';
      });
      const temizle = () => { const m = document.getElementById('main'); if(m) m.style.viewTransitionName = ''; };
      t.finished.then(temizle, temizle);
      return t.updateCallbackDone;
    }catch(e){
      if(kart) kart.style.viewTransitionName = '';
      return fn();
    }
  }

  /* ---------------------------------------------------------- 156 */

  let halkaEl = null, halkaZaman = null;
  function halka(hedef){
    if(!hedef || azMi() || !hedef.getBoundingClientRect) return;
    let gorunurOdak = true;
    try{ gorunurOdak = hedef.matches(':focus-visible'); }catch(e){}
    if(!gorunurOdak) return;
    const r = hedef.getBoundingClientRect();
    if(!r.width || !r.height) return;
    const yeni = !halkaEl || !halkaEl.isConnected;
    if(yeni){
      halkaEl = document.createElement('div');
      halkaEl.className = 'h-halka';
      halkaEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(halkaEl);
    }
    const once = halkaEl.classList.contains('is-acik');
    if(!once) halkaEl.classList.add('is-anlik');
    halkaEl.style.transform = 'translate(' + Math.round(r.left - 3) + 'px,' + Math.round(r.top - 3) + 'px)';
    halkaEl.style.width = Math.round(r.width + 6) + 'px';
    halkaEl.style.height = Math.round(r.height + 6) + 'px';
    halkaEl.getBoundingClientRect();
    halkaEl.classList.remove('is-anlik');
    halkaEl.classList.add('is-acik');
    clearTimeout(halkaZaman);
    /* Yerine varınca söner: kalıcı halka tarayıcının kendi odak halkasıdır. */
    halkaZaman = setTimeout(() => { if(halkaEl) halkaEl.classList.remove('is-acik'); }, 420);
  }

  /* ---------------------------------------------------------- 159 */

  const ONIZLE = '.linkbtn[data-route], a[data-route], [data-h-onizle][data-route]';
  let onizleEl = null, onizleZaman = null, cozucu = null;

  function onizleIcerik(route, coz){
    let b = null;
    try{ b = coz ? coz(route) : null; }catch(e){ b = null; }
    if(!b || !b.baslik) return '';
    return '<b class="h-onizle__ad">' + kac(b.baslik) + '</b>'
      + (b.cumle ? '<span class="h-onizle__cumle">' + kac(b.cumle) + '</span>' : '');
  }
  function onizleKapat(){
    clearTimeout(onizleZaman);
    if(onizleEl){ onizleEl.remove(); onizleEl = null; }
  }
  function onizleAc(el){
    const ic = onizleIcerik(el.getAttribute('data-route'), cozucu);
    if(!ic) return;
    onizleKapat();
    onizleEl = document.createElement('div');
    onizleEl.className = 'h-onizle';
    onizleEl.setAttribute('role', 'tooltip');
    onizleEl.innerHTML = ic;
    document.body.appendChild(onizleEl);
    const r = el.getBoundingClientRect();
    const w = onizleEl.offsetWidth, h = onizleEl.offsetHeight;
    const x = Math.max(8, Math.min(window.innerWidth - w - 8, r.left));
    const y = r.bottom + 8 + h > window.innerHeight ? r.top - h - 8 : r.bottom + 8;
    onizleEl.style.left = Math.round(x) + 'px';
    onizleEl.style.top = Math.round(Math.max(8, y)) + 'px';
  }

  /* ---------------------------------------------------------- 14 */

  function odakCik(){
    /* Açık bir katman (alt sayfa, komut paleti, menü) varsa Esc önce onu
       kapatır; odak kapısı sıradadır. Katmanların hepsi #overlay-root'ta. */
    const kat = document.getElementById('overlay-root');
    if(kat && kat.children.length) return false;
    const b = document.querySelector('[data-h-odak] [data-h-odak-cik], [data-h-odak-cik]');
    if(!document.querySelector('[data-h-odak]') || !b) return false;
    b.click();
    return true;
  }

  /* ---------------------------------------------------------- kurulum */

  let kuruldu = false;
  function kur(o){
    o = o || {};
    cozucu = o.onizle || cozucu;
    if(kuruldu) return;
    kuruldu = true;
    document.addEventListener('focusin', e => halka(e.target));
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape' && !e.defaultPrevented && odakCik()) e.preventDefault();
    });
    let fareVar = false;
    try{ fareVar = window.matchMedia('(hover: hover)').matches; }catch(e){}
    if(!fareVar) return;
    document.addEventListener('pointerover', e => {
      const el = e.target.closest && e.target.closest(ONIZLE);
      if(!el){ return; }
      clearTimeout(onizleZaman);
      onizleZaman = setTimeout(() => onizleAc(el), 450);
    });
    document.addEventListener('pointerout', e => {
      const el = e.target.closest && e.target.closest(ONIZLE);
      if(el && !(e.relatedTarget && el.contains(e.relatedTarget))) onizleKapat();
    });
    document.addEventListener('pointerdown', onizleKapat, true);
    window.addEventListener('scroll', onizleKapat, true);
  }

  return { once, sonra, tekCanli, baslikKopyala, kaynak, gecis, halka, onizleIcerik, odakCik, kur,
    EN_COK_KAPANAN };
})();
