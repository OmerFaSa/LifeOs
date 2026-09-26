/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/gizle.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
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
        önerebilir (`varsayilan`); kullanıcı geri getirirse o seçim kalır.
     6. KÜÇÜLTMEK DE KALICIDIR. Küçültülen bölümün yalnız başlığı görünür
        ve kullanıcı açana dek öyle kalır. Üzerine gelince (ya da klavyeyle
        odaklanınca) küçük bir pencerede ÖNİZLEMESİ belirir; önizleme
        salt bakmak içindir (`inert`): içindeki düğme bir şey uygulamaz.
        Gizlenenlerin önizlemesi de paneldeki satırın üzerinde açılır.

   Bölüm sayılanlar: başlığı olan `section.lrow` (defter satırı),
   `section.kutu` ve `.card`. İç içe olanlardan yalnız en dıştaki. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.Gizle = (function(){
  const ONEK = 'lifeos.gizli.';
  const GUNLER = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
  const SECICI = 'section.lrow, section.kutu, .card';

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
    return s.replace(/[^a-zçğıöşü]+/g, ' ').trim().replace(/\s+/g, '-');
  }

  function baslikOf(el){
    const b = el.querySelector(':scope > .lrow__side .lrow__label, :scope > .kutu__bas .kutu__ad, :scope > .card__head h3');
    if(!b) return '';
    const kopya = b.cloneNode(true);
    kopya.querySelectorAll('.hint, button, svg, .sr-only').forEach(x => x.remove());
    return kopya.textContent.replace(/\s+/g, ' ').trim();
  }

  function depoAdi(o){ return ONEK + (o.modul || 'x') + '.' + (o.profil || 'main') + '.' + (o.ekran || 'x'); }
  function oku(o){
    try{
      const d = JSON.parse(localStorage.getItem(depoAdi(o)) || 'null');
      if(d && typeof d === 'object') return { gizli:d.gizli || {}, acik:d.acik || {}, ad:d.ad || {}, kucuk:d.kucuk || {} };
    }catch(e){}
    return { gizli:{}, acik:{}, ad:{}, kucuk:{} };
  }
  function yaz(o, d){
    try{ localStorage.setItem(depoAdi(o), JSON.stringify(d)); }catch(e){ /* depo kapalı: bu oturumda geçerli */ }
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
      const k = !g && !!d.kucuk[b.anahtar];
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
        const dugme = (ne, yazi, etiket) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'gizle-dugme';
          btn.setAttribute(ne, b.anahtar);
          btn.setAttribute('aria-label', etiket);
          btn.textContent = yazi;
          arac.appendChild(btn);
        };
        if(k) dugme('data-ac', 'Aç', '«' + b.baslik + '» bölümünü aç');
        else dugme('data-kucult', 'Küçült', '«' + b.baslik + '» bölümünü küçült');
        if(duzen) dugme('data-gizle', 'Gizle', '«' + b.baslik + '» bölümünü gizle');
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
    if(v === false) delete d.kucuk[a]; else d.kucuk[a] = true;
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
    onizleme.appendChild(ic);
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
      c.innerHTML = '<span>Sayfayı düzenliyorsun: bölümleri küçült ya da gizle.</span>'
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

  function panelCiz(){
    const l = gizliListe();
    const govde = l.length
      ? '<ul class="gizle-liste">' + l.map(b => '<li data-onizle="' + kac(b.anahtar) + '" tabindex="0"><span>' + kac(b.baslik) + '</span>'
          + '<button type="button" data-goster="' + kac(b.anahtar) + '">Geri getir</button></li>').join('') + '</ul>'
      : '<p class="kmenu__bos">Bu sayfada gizlenen bölüm yok.</p>';
    panel.innerHTML = '<p class="kmenu__bas">Gizlenen bölümler</p>' + govde
      + '<div class="gizle-alt">'
      + '<button type="button" data-duzen aria-pressed="' + (duzen ? 'true' : 'false') + '">'
      + (duzen ? 'Düzenlemeyi bitir' : 'Bu sayfayı düzenle') + '</button>'
      + (l.length ? '<button type="button" data-hepsi>Hepsini göster</button>' : '')
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
    panel.style.top = Math.round(r.bottom + 6) + 'px';
    panel.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + 'px';
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
      const ac2 = t.closest('[data-ac]');
      if(ac2){ e.preventDefault(); e.stopPropagation(); kucult(ac2.getAttribute('data-ac'), false); return; }
      if(panel && panel.contains(t)){
        const g = t.closest('[data-goster]');
        if(g){ goster(g.getAttribute('data-goster')); return; }
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
    const gir = e => { const h = hedefOf(e.target); if(h && h.kaynak) onizlemeZamanla(h.kaynak, h.yakin); };
    const cik = e => {
      const h = hedefOf(e.target);
      if(!h) return;
      const ic = e.relatedTarget && h.yakin.contains(e.relatedTarget);
      if(!ic) onizlemeKapat();
    };
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
