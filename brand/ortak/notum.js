/* NOTUM — öğrenme ekranlarında kendi notun; üç arayüzde aynı kutu.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/notum.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `notum.css`.
   ==================================================================

   Depo sahibi (2026-10-15/16): «öğrenmeyi ve not etmeyi kolaylaştır;
   anlaşılır, profesyonel yap; bütün modüllere uygula». AYS'nin Anlatım
   ekranındaki «Notum» (core/konunotu.js) burada genelleşti: SPİ'nin
   kavramları ve ESP'nin konu kartları aynı kutuyu kullanır.

   Sözler:
     1. BAĞLAM BAŞINA BİR NOT. Not bir bağlama bağlıdır («konu:l-ses»,
        «kavramlar»); modülün KENDİ deposunda `notum/<bağlam>` olarak durur
        (eşitleme ve yedek o depoyla gelir). Kayıt kaynağı modül isterse
        kendi alanını verebilir (kaynak: { oku, yaz }).
     2. YAZINCA KAYDOLUR; EKLEMEK EZMEZ. Kutu gecikmeli kaydeder; «Nota ekle»
        (seçili metin) notun SONUNA yeni satır ekler. En çok SINIR karakter.
     3. NOT ÖLÇÜM DEĞİLDİR. Hiçbir sayıyı, kapıyı, seviyeyi değiştirmez.
     4. SEÇİP EKLE YALNIZ İŞARETLİ METİNDE. `data-notum-kaynak="<bağlam>"`
        taşıyan öğenin içinde seçilen metin o bağlamın notuna eklenir.
     5. MODÜL ONSUZ DA ÇALIŞIR. Kurulmadıysa kutu çizilmez.
     6. NOTLARIM TEK YERDE. panelAc() modülün bütün notlarını (kendi
        deposundakiler + modülün ek kaynağı, ör. AYS konu notları) tek
        pencerede listeler; arama yazdıkça süzer; nota dokununca modülün
        `ac(bağlam)`ı o ekranı açar. Paletten ve King'den («notlarım») açılır. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.NOTUM = (function(){
  'use strict';

  const SINIR = 4000;
  let ayar = null;            // { modul, store:{ set, list }, kaynak? }
  const notlar = new Map();   // bağlam → metin
  let bagli = false;
  const zaman = new Map();

  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  const yolu = b => 'notum/' + String(b).toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü_-]+/g, '-').slice(0, 80);

  function oku(baglam){
    if(ayar && ayar.kaynak && ayar.kaynak.oku) return String(ayar.kaynak.oku(baglam) || '');
    return notlar.get(String(baglam)) || '';
  }

  async function yaz(baglam, metin){
    const m = String(metin == null ? '' : metin).replace(/\r\n/g, '\n').slice(0, SINIR);
    if(ayar && ayar.kaynak && ayar.kaynak.yaz){ await ayar.kaynak.yaz(baglam, m); return m; }
    notlar.set(String(baglam), m);
    if(ayar && ayar.store && ayar.store.set){
      await ayar.store.set(yolu(baglam), { baglam:String(baglam), metin:m, at:new Date().toISOString() });
    }
    return m;
  }

  async function ekle(baglam, satir){
    const s = String(satir || '').replace(/\s+/g, ' ').trim();
    if(!s) return null;
    const eski = oku(baglam).replace(/\s+$/, '');
    return yaz(baglam, eski ? eski + '\n' + s : s);
  }

  async function yukle(){
    if(!ayar || !ayar.store || !ayar.store.list) return 0;
    let rows = [];
    try{ rows = (await ayar.store.list('notum')) || []; }catch(e){ rows = []; }
    notlar.clear();
    rows.forEach(r => { if(r && r.baglam != null) notlar.set(String(r.baglam), String(r.metin || '')); });
    return notlar.size;
  }

  function hepsi(){
    return Array.from(notlar.entries()).filter(x => x[1].trim()).map(x => ({ baglam:x[0], metin:x[1] }));
  }

  /* Kutu. o: { baslik, ipucu } */
  function kutuHtml(baglam, o){
    if(!ayar) return '';
    bagla();
    o = o || {};
    const b = String(baglam);
    const m = oku(b);
    return '<div class="notum" data-notum-kutu="' + kac(b) + '">'
      + '<div class="notum__bas"><b>' + kac(o.baslik || 'Notum') + '</b>'
      + '<span class="notum__durum" data-notum-durum aria-live="polite">' + (m ? m.length + ' / ' + SINIR : 'kendiliğinden kaydedilir') + '</span></div>'
      + '<textarea class="notum__metin" rows="' + Math.min(10, Math.max(3, m.split('\n').length + 1)) + '" maxlength="' + SINIR + '"'
      + ' data-notum="' + kac(b) + '" aria-label="' + kac(o.baslik || 'Notum') + '"'
      + ' placeholder="' + kac(o.ipucu || 'Kendi cümlelerinle yaz. Metinde bir yeri seçip «Nota ekle»ye basarak da ekleyebilirsin.') + '">'
      + kac(m) + '</textarea></div>';
  }

  function durumYaz(baglam, metin){
    if(typeof document === 'undefined') return;
    document.querySelectorAll('[data-notum-kutu]').forEach(k => {
      if(k.getAttribute('data-notum-kutu') !== String(baglam)) return;
      const d = k.querySelector('[data-notum-durum]');
      if(d) d.textContent = metin ? metin.length + ' / ' + SINIR + ' · kaydedildi' : 'kendiliğinden kaydedilir';
      const t = k.querySelector('textarea');
      if(t && t.value !== metin && document.activeElement !== t) t.value = metin;
    });
  }

  function secimGoster(){
    const d0 = document.getElementById('notum-ekle');
    const sel = window.getSelection ? window.getSelection() : null;
    const metin = sel ? String(sel).replace(/\s+/g, ' ').trim() : '';
    const kap = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement) : null;
    const kaynak = kap && kap.closest ? kap.closest('[data-notum-kaynak]') : null;
    if(!kaynak || metin.length < 3 || metin.length > 500 || sel.rangeCount === 0){ if(d0) d0.remove(); return; }
    const r = sel.getRangeAt(0).getBoundingClientRect();
    let d = d0;
    if(!d){
      d = document.createElement('button');
      d.type = 'button'; d.id = 'notum-ekle'; d.className = 'notum-ekle'; d.textContent = 'Nota ekle';
      d.addEventListener('mousedown', e => e.preventDefault());
      d.addEventListener('click', async () => {
        const b = d.dataset.baglam, s = d.dataset.metin;
        d.remove();
        const yeni = await ekle(b, '«' + s + '»');
        if(yeni != null){
          document.querySelectorAll('[data-notum="' + (window.CSS && CSS.escape ? CSS.escape(b) : b) + '"]').forEach(t => { t.value = yeni; });
          durumYaz(b, yeni);
        }
        if(window.getSelection) window.getSelection().removeAllRanges();
      });
      document.body.appendChild(d);
    }
    d.dataset.baglam = kaynak.getAttribute('data-notum-kaynak');
    d.dataset.metin = metin;
    d.style.left = Math.max(8, Math.min(window.innerWidth - 120, r.left + r.width / 2 - 50)) + 'px';
    d.style.top = Math.max(8, r.top - 44) + 'px';
  }

  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('input', e => {
      const t = e.target && e.target.closest ? e.target.closest('[data-notum]') : null;
      if(!t) return;
      const b = t.getAttribute('data-notum');
      clearTimeout(zaman.get(b));
      zaman.set(b, setTimeout(async () => { const m = await yaz(b, t.value); durumYaz(b, m); }, 600));
    });
    document.addEventListener('mouseup', () => setTimeout(secimGoster, 0));
    document.addEventListener('touchend', () => setTimeout(secimGoster, 250));
    window.addEventListener('scroll', () => { const d = document.getElementById('notum-ekle'); if(d) d.remove(); }, { passive:true, capture:true });
  }

  /* Söz 6: bütün notlar — { baglam, metin, ad, ust, ac? }. */
  function liste(){
    const l = [];
    const et = b => (ayar && ayar.etiket ? (ayar.etiket(b) || {}) : {});
    hepsi().forEach(x => { const e = et(x.baglam); l.push({ baglam:x.baglam, metin:x.metin, ad:e.ad || x.baglam, ust:e.ust || '' }); });
    if(ayar && ayar.ekKaynak){
      try{ (ayar.ekKaynak() || []).forEach(x => { if(x && String(x.metin || '').trim()) l.push(x); }); }catch(e){ /* ek kaynak düşer */ }
    }
    return l;
  }

  function panelListeHtml(ara){
    const q = String(ara || '').toLocaleLowerCase('tr-TR').trim();
    const l = liste().filter(x => !q || (x.ad + ' ' + x.ust + ' ' + x.metin).toLocaleLowerCase('tr-TR').indexOf(q) >= 0);
    if(!liste().length) return '<p class="notlar__bos">Henüz not yok. Öğrenme ekranlarındaki «Notum» kutularına yazdıkların burada toplanır.</p>';
    if(!l.length) return '<p class="notlar__bos">«' + kac(ara) + '» geçen not yok.</p>';
    return l.map((x, i) => {
      const m = String(x.metin).replace(/\s+/g, ' ');
      return '<button type="button" class="notlar__satir" data-notlar-ac="' + kac(x.baglam) + '">'
        + '<span class="notlar__ad">' + kac(x.ad) + (x.ust ? ' <small>' + kac(x.ust) + '</small>' : '') + '</span>'
        + '<span class="notlar__ozet">' + kac(m.length > 160 ? m.slice(0, 157) + '…' : m) + '</span></button>';
    }).join('');
  }

  function panelKapat(){
    const el = typeof document !== 'undefined' ? document.getElementById('notlar-panel') : null;
    if(el) el.remove();
  }

  function panelAc(){
    if(typeof document === 'undefined' || !ayar) return false;
    panelKapat();
    const el = document.createElement('div');
    el.id = 'notlar-panel';
    el.className = 'notlar';
    el.innerHTML = '<div class="notlar__perde" data-notlar-kapat></div>'
      + '<div class="notlar__kutu" role="dialog" aria-modal="true" aria-label="Notlarım">'
      + '<div class="notlar__bas"><b>Notlarım</b><span class="notlar__say">' + liste().length + ' not</span>'
      + '<button type="button" class="notlar__kapat" data-notlar-kapat aria-label="Kapat">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></div>'
      + '<input class="notlar__ara" type="search" placeholder="Notlarında ara" aria-label="Notlarında ara" autocomplete="off"/>'
      + '<div class="notlar__liste" data-notlar-liste>' + panelListeHtml('') + '</div></div>';
    document.body.appendChild(el);
    const ara = el.querySelector('.notlar__ara');
    ara.addEventListener('input', () => { el.querySelector('[data-notlar-liste]').innerHTML = panelListeHtml(ara.value); });
    el.addEventListener('keydown', e => { if(e.key === 'Escape'){ e.preventDefault(); panelKapat(); } });
    el.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      if(t.closest('[data-notlar-kapat]')){ panelKapat(); return; }
      const s = t.closest('[data-notlar-ac]');
      if(s){
        const b = s.getAttribute('data-notlar-ac');
        const x = liste().find(y => y.baglam === b);
        panelKapat();
        try{
          if(x && typeof x.ac === 'function') x.ac();
          else if(ayar.ac) ayar.ac(b);
        }catch(err){ console.error('Notlarım: aç', err); }
      }
    });
    try{ ara.focus(); }catch(e){ /* odak yok */ }
    return true;
  }

  function kur(o){
    ayar = Object.assign({ modul:'' }, o || {});
    bagla();
  }

  function _sifirla(){ ayar = null; notlar.clear(); }

  return { SINIR, kur, yukle, oku, yaz, ekle, hepsi, liste, kutuHtml, panelAc, panelKapat, kuruluMu:() => !!ayar, _sifirla };
})();
