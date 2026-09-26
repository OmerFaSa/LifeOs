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

   Bölüm sayılanlar: başlığı olan `section.lrow` (defter satırı),
   `section.kutu` ve `.card`. İç içe olanlardan yalnız en dıştaki. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.Gizle = (function(){
  const ONEK = 'lifeos.gizli.';
  const GUNLER = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
  const SECICI = 'section.lrow, section.kutu, .card';

  /* Küçük tek renk simgeler (currentColor): düğmeler yazısız kalır ama
     aria-label ve title ne yaptıklarını söyler. */
  const SIMGE = {
    kucult:'<path d="M5 12h14"/>',
    gizle:'<path d="M3 3l18 18"/><path d="M10.6 5.2A9.8 9.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7a13 13 0 0 1-2.6 3.6M6.4 6.6C4.4 8 3 10 2.5 12c1 2.5 4.5 7 9.5 7 1.7 0 3.2-.5 4.5-1.2"/><path d="M9.9 10a3 3 0 0 0 4.1 4.1"/>',
    goz:'<path d="M2.5 12C3.5 9.5 7 5 12 5s8.5 4.5 9.5 7c-1 2.5-4.5 7-9.5 7s-8.5-4.5-9.5-7z"/><circle cx="12" cy="12" r="3"/>',
    ac:'<path d="M9 6l6 6-6 6"/>',
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
    const b = el.querySelector(':scope > .lrow__side .lrow__label, :scope > .kutu__bas .kutu__ad, :scope > .card__head h3');
    if(!b) return '';
    const kopya = b.cloneNode(true);
    /* İpucu ve sözlük balonları (role=tooltip, .terim__kart) başlığın
       parçası değildir: yoksa anahtar balonun metnini de taşır. */
    kopya.querySelectorAll('.hint, button, svg, .sr-only, [role="tooltip"], .terim__kart, [hidden]').forEach(x => x.remove());
    return kopya.textContent.replace(/\s+/g, ' ').trim();
  }

  function depoAdi(o){ return ONEK + (o.modul || 'x') + '.' + (o.profil || 'main') + '.' + (o.ekran || 'x'); }
  function oku(o){
    try{
      const d = JSON.parse(localStorage.getItem(depoAdi(o)) || 'null');
      if(d && typeof d === 'object') return { gizli:d.gizli || {}, acik:d.acik || {}, ad:d.ad || {},
        kucuk:d.kucuk || {}, acikK:d.acikK || {} };
    }catch(e){}
    return { gizli:{}, acik:{}, ad:{}, kucuk:{}, acikK:{} };
  }
  function yaz(o, d){
    try{ localStorage.setItem(depoAdi(o), JSON.stringify(d)); }catch(e){ /* depo kapalı: bu oturumda geçerli */ }
  }

  function kucukMu(d, a, varsayilan){
    if(d.kucuk[a]) return true;
    return (varsayilan || []).indexOf(a) >= 0 && !d.acikK[a];
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
    son = o;
    const d = oku(o);
    let degisti = false;
    const liste = bolumler(o.kok);
    liste.forEach(b => {
      const g = gizliMi(d, b.anahtar, o.varsayilan);
      const k = !g && kucukMu(d, b.anahtar, o.kucukVarsayilan);
      b.el.hidden = g;
      b.el.classList.toggle('gizle-bolum', duzen);
      b.el.classList.toggle('gizle-kucuk', k);
      if(k) b.el.setAttribute('data-gizle-kucuk', b.anahtar); else b.el.removeAttribute('data-gizle-kucuk');
      if(g && d.ad[b.anahtar] !== b.baslik){ d.ad[b.anahtar] = b.baslik; degisti = true; }
      const eski = b.el.querySelector(':scope > .gizle-araclar');
      if(eski) eski.remove();
      if(!g && (duzen || k)){
        const arac = document.createElement('div');
        arac.className = 'gizle-araclar';
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
        if(k) dugme('data-ac', 'ac', '«' + b.baslik + '» bölümünü aç', 'Aç');
        else dugme('data-kucult', 'kucult', '«' + b.baslik + '» bölümünü küçült', 'Küçült');
        if(duzen) dugme('data-gizle', 'gizle', '«' + b.baslik + '» bölümünü gizle', 'Gizle');
        b.el.insertBefore(arac, b.el.firstChild);
      }
    });
    if(degisti) yaz(o, d);
    if(o.kok) o.kok.classList.toggle('gizle-duzen', duzen);
    sayacYaz(gizliListe().length);
    if(panel) panelCiz();
    bagla();
    return liste.length;
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
    if(v === false){ delete d.kucuk[a]; d.acikK[a] = true; }
    else { d.kucuk[a] = true; delete d.acikK[a]; }
    yaz(son, d);
    onizlemeKapat();
    uygula(son);
  }

  /* ---------- önizleme: küçük pencerede kartın kendisi ---------- */
  let onizleme = null, onizSayac = null;
  function onizlemeAc(kaynak, yakin){
    onizlemeKapat();
    if(!kaynak) return;
    const kopya = kaynak.cloneNode(true);
    kopya.hidden = false;
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
    delete d.gizli[a]; d.acik[a] = true;
    yaz(son, d);
    uygula(son);
  }
  function hepsiniGoster(){
    if(!son) return;
    const d = oku(son);
    gizliListe().forEach(b => { delete d.gizli[b.anahtar]; d.acik[b.anahtar] = true; });
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
      c.innerHTML = '<span><b>Düzen kipi</b><i> · bölümleri küçült ya da gizle</i></span>'
        + '<button type="button" data-duzen-bitir>Bitti</button>';
      document.body.appendChild(c);
    }
  }

  /* Üst çubuk düğmesi `kabuk.js` ustSerit'te çizilir; sayı burada yazılır. */
  function sayacYaz(n){
    document.querySelectorAll('.ust__gizli').forEach(b => {
      const s = b.querySelector('.ust__gizli-sayi');
      if(s) s.textContent = n ? String(n) : '';
      b.classList.toggle('is-dolu', !!n);
      b.setAttribute('aria-label', n ? 'Gizlenen bölümler, ' + n + ' tane' : 'Gizlenen bölümler, yok');
    });
  }

  function kucukListe(){
    if(!son) return [];
    return bolumler(son.kok).filter(b => b.el.classList.contains('gizle-kucuk'))
      .map(b => ({ anahtar:b.anahtar, baslik:b.baslik }));
  }

  function panelCiz(){
    const l = gizliListe(), k = kucukListe();
    const satir = (b, veri, yazi) => '<li data-onizle="' + kac(b.anahtar) + '" tabindex="0">'
      + '<span class="gizle-liste__ad">' + kac(b.baslik) + '</span>'
      + '<button type="button" ' + veri + '="' + kac(b.anahtar) + '">' + yazi + '</button></li>';
    const grup = (ad, liste, veri, yazi, simge) => liste.length
      ? '<p class="gizle-grup">' + svg(simge) + '<span>' + ad + '</span><b>' + liste.length + '</b></p>'
        + '<ul class="gizle-liste">' + liste.map(b => satir(b, veri, yazi)).join('') + '</ul>' : '';
    const govde = (l.length || k.length)
      ? grup('Gizlenenler', l, 'data-goster', 'Geri getir', 'gizle') + grup('Küçültülenler', k, 'data-ac', 'Aç', 'kucult')
      : '<p class="gizle-bos">Bu sayfa olduğu gibi. Kalabalık gelen bölümleri<br>«Bu sayfayı düzenle» ile küçültebilir ya da gizleyebilirsin.</p>';
    panel.innerHTML = '<p class="kmenu__bas">Sayfa düzeni</p>' + govde
      + '<div class="gizle-alt">'
      + '<button type="button" data-duzen aria-pressed="' + (duzen ? 'true' : 'false') + '">'
      + (duzen ? 'Düzenlemeyi bitir' : 'Bu sayfayı düzenle') + '</button>'
      + (l.length ? '<button type="button" data-hepsi>' + svg('goz') + 'Hepsini göster</button>' : '')
      + '</div><p class="gizle-not">Gizlemek veriyi silmez; bölüm yalnız bu sayfada gösterilmez.</p>';
  }

  function panelAc(dugme){
    if(panel){ panelKapat(); return; }
    panel = document.createElement('div');
    panel.className = 'katman kmenu kmenu--gizle';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Gizlenen bölümler');
    panelCiz();
    document.body.appendChild(panel);
    const r = dugme.getBoundingClientRect();
    /* Sağ kenarı düğmeye hizalı, ama dar ekranda da ekranın içinde. */
    const w = panel.offsetWidth, W = document.documentElement.clientWidth || window.innerWidth;
    panel.style.top = Math.round(r.bottom + 6) + 'px';
    panel.style.left = Math.round(Math.max(8, Math.min(r.right - w, W - w - 8))) + 'px';
    panel.style.right = 'auto';
    dugme.setAttribute('aria-expanded', 'true');
    const ilk = panel.querySelector('button');
    if(ilk) ilk.focus();
  }
  function panelKapat(){
    onizlemeKapat();
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
      const gz = t.closest('[data-gizle]');
      if(gz){ e.preventDefault(); e.stopPropagation(); onizlemeKapat(); gizle(gz.getAttribute('data-gizle')); return; }
      const kc = t.closest('[data-kucult]');
      if(kc){ e.preventDefault(); e.stopPropagation(); kucult(kc.getAttribute('data-kucult'), true); return; }
      const serit = t.closest('[data-gizle-kucuk]');
      if(serit && !duzen && !t.closest('a, input, select, textarea, [data-act], .hint, .terim') && !t.closest('[data-kucult],[data-gizle]')){
        e.preventDefault(); e.stopPropagation(); kucult(serit.getAttribute('data-gizle-kucuk'), false); return;
      }
      const ac2 = t.closest('[data-ac]');
      if(ac2){ e.preventDefault(); e.stopPropagation(); kucult(ac2.getAttribute('data-ac'), false); return; }
      if(panel && panel.contains(t)){
        const g = t.closest('[data-goster]');
        if(g){ goster(g.getAttribute('data-goster')); return; }
        const pa = t.closest('[data-ac]');
        if(pa){ kucult(pa.getAttribute('data-ac'), false); return; }
        if(t.closest('[data-duzen]')){ duzenle(); return; }
        if(t.closest('[data-hepsi]')){ hepsiniGoster(); return; }
        return;
      }
      if(panel) panelKapat();
    }, true);
    document.addEventListener('keydown', e => {
      if(e.key !== 'Escape') return;
      if(onizleme) onizlemeKapat();
      else if(panel) panelKapat();
    });
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
      if(e.type === 'focusin' && !klavyeOdagi(e.target)) return;
      const h = hedefOf(e.target); if(h && h.kaynak) onizlemeZamanla(h.kaynak, h.yakin);
    };
    const cik = e => {
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
    duzenMi:() => duzen, panelAc, panelKapat, onizlemeAc, onizlemeKapat,
    onizlemeVar:() => !!onizleme,
    _sifirla(){ son = null; duzen = false; panelKapat(); onizlemeKapat(); bitirCubugu(); } };
})();
