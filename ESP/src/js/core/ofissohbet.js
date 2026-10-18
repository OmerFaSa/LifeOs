/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ofissohbet.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* OFİS SOHBETİ — ajanlarla konuşulan yerin akışı (King gibi), sade görünüş.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ofissohbet.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi
   `ofissohbet.css`.
   ==================================================================

   Depo sahibinin isteği (2026-10-19): «Ofis kısımlarının konuşmalarını
   aynı King'te yaptığımız gibi yap ama onların tasarımları çok daha sade
   olsun, King'in bir ayrıcalığı olsun.»

   King'den alınan DAVRANIŞ (king.js'e bağlı değildir, kopya da değildir):
     1. ENTER GÖNDERİR, Shift+Enter alt satır. Ctrl+Enter modülün kendi
        kısayoludur; burada ikinci kez gönderilmez.
     2. BOŞ KUTUDA ↑ son sorunu geri getirir.
     3. YAZMA ALANI BÜYÜR: yazdıkça en çok altı satıra kadar uzar.
     4. KAYDIRMA YERİ KORUNUR. Ekran yeniden çizilince sohbet en alta
        atılmaz: altta okuyorsan ya da yeni mesaj geldiyse alta, yukarıda
        okuyorsan kaldığın yerde kalır. İlk açılışta en alt.
     5. CEVAP SAKİN BELİRİR: yalnız en yeni ajan cevabı, yalnız bir kez,
        saydamlık ve 4 piksel (Görünüm › Animasyonlar «Az»da hiç).
     6. CEVAP KOPYALANIR: her cevabın yanında küçük kopyala düğmesi.

   King'e AYRILAN görünüş burada YOK: renkli küre, kenar ışığı, buzlu cam,
   dönen ya da nabız atan şey. Ofis sohbeti düz yüzey, ince çizgi, nötr
   renk; modülün rengi en fazla ad satırındaki küçük noktadır.

   İşaretleme (modül kendi ekranında yazar):
     <div class="chat osohbet" data-osohbet="ays:patron"> … .msg … </div>
       ajan mesajının metni [data-osohbet-metin]; bekleyen satır
       [data-osohbet-bekle] (sayılmaz).
     <div class="osohbet-yaz" data-osohbet-yaz>
       <textarea data-osohbet-girdi …> + gonderHtml({ act })
     </div>
   Bu dosya modüle yazmaz: gönderme, modülün kendi düğmesine (data-act)
   tıklanarak olur. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.OFISSOHBET = (function(){
  'use strict';
  const EN_YUKSEK = 160;            // yazma alanı en çok ~6 satır
  const ALT_PAYI = 48;              // en alta bu kadar yakınsa «altta» sayılır
  let durumlar = {};                // anahtar -> { n, altta, top }
  let gorulen = typeof WeakSet === 'function' ? new WeakSet() : null;
  let bagli = false;

  function kac(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  /* Söz 1: hangi tuş gönderir. */
  function gonderMi(e){
    return !!e && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey
      && !e.isComposing && e.keyCode !== 229;
  }

  function alttaMi(el){
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < ALT_PAYI;
  }

  /* Söz 4–5: yeni çizilen sohbet nereye kaysın, en yeni cevap belirsin mi. */
  function karar(onceki, n){
    if(!onceki) return { alta:true, yeni:false };
    if(n > onceki.n) return { alta:true, yeni:true };
    return onceki.altta ? { alta:true, yeni:false } : { alta:false, yeni:false, top:onceki.top };
  }

  function mesajlar(log){
    return Array.from(log.querySelectorAll('.msg')).filter(m => !m.closest('[data-osohbet-bekle]'));
  }

  function kaydet(log){
    const k = log.getAttribute('data-osohbet');
    /* Sökülmüş eski kutunun geciken kaydırma olayı yenisinin yerini ezmesin. */
    if(!k || log.isConnected === false) return;
    durumlar[k] = { n:mesajlar(log).length, altta:alttaMi(log), top:log.scrollTop };
  }

  /* Yeni çizilmiş bir sohbet kutusuna sözleri uygular. */
  function isle(log){
    if(!log || !log.getAttribute) return;
    if(gorulen){ if(gorulen.has(log)) return; gorulen.add(log); }
    const k = log.getAttribute('data-osohbet') || '';
    const l = mesajlar(log);
    const d = karar(durumlar[k], l.length);
    if(d.yeni){
      const son = l[l.length - 1];
      if(son && son.classList.contains('msg--agent')) son.classList.add('is-yeni');
    }
    log.scrollTop = d.alta ? log.scrollHeight : (d.top || 0);
    durumlar[k] = { n:l.length, altta:d.alta, top:log.scrollTop };
  }

  function tara(kok){
    const k = kok && kok.querySelectorAll ? kok : (typeof document !== 'undefined' ? document : null);
    if(!k) return;
    if(k.matches && k.matches('[data-osohbet]')) isle(k);
    k.querySelectorAll('[data-osohbet]').forEach(isle);
  }

  /* Söz 3. */
  function buyut(g){
    if(!g || g.tagName !== 'TEXTAREA') return;
    g.style.height = 'auto';
    g.style.height = Math.min(g.scrollHeight, EN_YUKSEK) + 'px';
  }

  /* Söz 2: ekrandaki son kullanıcı mesajı. */
  function sonSoru(kok){
    const l = (kok || document).querySelectorAll('[data-osohbet] .msg--me [data-osohbet-metin], [data-osohbet] .msg--me .msg__body');
    const s = l.length ? l[l.length - 1] : null;
    return s ? String(s.textContent || '').trim() : '';
  }

  async function panoya(metin){
    try{ await navigator.clipboard.writeText(metin); return true; }
    catch(e){
      try{
        const t = document.createElement('textarea');
        t.value = metin; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        const ok = document.execCommand('copy');
        t.remove();
        return !!ok;
      }catch(er){ return false; }
    }
  }

  function kopyaMetni(dugme){
    const m = dugme && dugme.closest ? dugme.closest('.msg') : null;
    const g = m && (m.querySelector('[data-osohbet-metin]') || m.querySelector('.msg__body'));
    return g ? String(g.innerText || g.textContent || '').trim() : '';
  }

  const SVG_GONDER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg>';
  const SVG_KOPYA = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/>'
    + '<path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>';

  /* Gönder düğmesi: modülün eylemi (data-act) ile. */
  function gonderHtml(o){
    o = o || {};
    return '<button type="button" class="osohbet-gonder" data-osohbet-gonder data-act="' + kac(o.act || '') + '"'
      + (o.kapali ? ' disabled' : '') + ' aria-label="' + kac(o.ad || 'Gönder') + '" title="' + kac(o.ad || 'Gönder') + ' (Enter)">'
      + SVG_GONDER + '</button>';
  }

  function kopyaHtml(){
    return '<button type="button" class="osohbet-kopya" data-osohbet-kopyala aria-label="Cevabı kopyala" title="Kopyala">'
      + SVG_KOPYA + '</button>';
  }

  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('keydown', e => {
      const g = e.target && e.target.matches && e.target.matches('[data-osohbet-girdi]') ? e.target : null;
      if(!g) return;
      if(e.key === 'ArrowUp' && !g.value){
        const s = sonSoru();
        if(s){ e.preventDefault(); g.value = s; try{ g.setSelectionRange(s.length, s.length); }catch(er){ /* yok */ } buyut(g); }
        return;
      }
      if(!gonderMi(e)) return;
      e.preventDefault();
      if(!String(g.value || '').trim()) return;
      const kutu = g.closest('[data-osohbet-yaz]');
      const d = kutu && kutu.querySelector('[data-osohbet-gonder]');
      if(d && !d.disabled) d.click();
    });
    document.addEventListener('input', e => {
      if(e.target && e.target.matches && e.target.matches('textarea[data-osohbet-girdi]')) buyut(e.target);
    });
    document.addEventListener('scroll', e => {
      const t = e.target;
      if(t && t.getAttribute && t.getAttribute('data-osohbet')) kaydet(t);
    }, true);
    document.addEventListener('click', e => {
      const c = e.target && e.target.closest ? e.target.closest('[data-osohbet-kopyala]') : null;
      if(!c) return;
      e.preventDefault();
      const metin = kopyaMetni(c);
      if(!metin) return;
      Promise.resolve(panoya(metin)).then(ok => {
        if(!ok) return;
        c.classList.add('is-kopyalandi'); c.setAttribute('aria-label', 'Kopyalandı');
        setTimeout(() => { c.classList.remove('is-kopyalandi'); c.setAttribute('aria-label', 'Cevabı kopyala'); }, 1400);
      });
    });
    /* Modüller ekranı baştan çizer: yeni gelen sohbet kutusu yakalanır. */
    if(typeof MutationObserver === 'function' && document.documentElement){
      new MutationObserver(kayitlar => {
        for(const r of kayitlar){
          for(const n of r.addedNodes){ if(n.nodeType === 1) tara(n); }
        }
      }).observe(document.documentElement, { childList:true, subtree:true });
    }
    tara(document);
  }

  if(typeof document !== 'undefined'){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bagla);
    else bagla();
  }

  return { gonderMi, alttaMi, karar, isle, tara, buyut, sonSoru, kopyaMetni, gonderHtml, kopyaHtml, bagla,
    _durum:k => durumlar[k] || null,
    _sifirla:() => { durumlar = {}; gorulen = typeof WeakSet === 'function' ? new WeakSet() : null; } };
})();
