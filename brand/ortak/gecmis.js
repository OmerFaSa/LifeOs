/* SOHBET GEÇMİŞİ — Ofis sohbetinin geçmiş konuşmaları (GPT gibi).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/gecmis.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Depo sahibinin isteği (2026-10-18): «Ofis kısmındaki sohbet GPT gibi
   olsun; geçmiş konuşmaları da görebilelim.»

   Sözler:
     1. BU CİHAZDA. Geçmiş tarayıcının deposundadır (modül ve ajan başına,
        en çok 30 sohbet); hiçbir sunucuya gitmez.
     2. «YENİ SOHBET» SİLMEZ. Açık konuşma geçmişe geçer, sonra ekran
        boşalır. Boş konuşma (senden mesaj yoksa) geçmişe yazılmaz.
     3. GEÇMİŞTEN AÇILAN SOHBET ORADAN SÜRER. Açılan kayıt geçmişten çıkar
        ve açık konuşma olur; yeniden «Yeni sohbet» denince güncel haliyle
        geri yazılır, kopya oluşmaz.
     4. SİLME TEK DOKUNUŞ DEĞİL. Bir kaydı silmek için iki kez dokunulur;
        ilk dokunuş düğmeyi «Silinsin mi?»ye çevirir.
     5. ÇİZİM YALNIZ İŞARETLEME ÜRETİR. Uygulayan modülün kendi kodudur
        (Office.setChat / clearChat); bu dosya modüle yazmaz. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.GECMIS = (function(){
  'use strict';
  const EN_COK = 30;
  const anahtar = (modul, ajan) => 'lifeos.sohbet.gecmis.' + modul + '.' + ajan;
  const depo = {
    oku:k => { try{ const v = JSON.parse(localStorage.getItem(k) || 'null'); return Array.isArray(v) ? v : []; }catch(e){ return []; } },
    yaz:(k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ /* yer yok */ } },
  };
  let silOnay = null;

  function kac(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  const temiz = l => (Array.isArray(l) ? l : []).filter(m => m && (m.role === 'user' || m.role === 'agent' || m.role === 'assistant') && m.text);

  function liste(modul, ajan){ return depo.oku(anahtar(modul, ajan)).filter(k => k && k.id && Array.isArray(k.mesajlar)); }

  /* Açık konuşmayı geçmişe yazar. Doner: kayıt ya da null (boşsa). */
  function arsivle(modul, ajan, mesajlar, id, simdi){
    const l = temiz(mesajlar);
    if(!l.some(m => m.role === 'user')) return null;
    const d = simdi || new Date();
    const kayit = { id:id || ('s' + d.getTime()), zaman:d.toISOString(), mesajlar:l };
    depo.yaz(anahtar(modul, ajan), [kayit].concat(liste(modul, ajan).filter(k => k.id !== kayit.id)).slice(0, EN_COK));
    return kayit;
  }

  /* Geçmişten çıkarıp döndürür (açık konuşma olacak). */
  function al(modul, ajan, id){
    const l = liste(modul, ajan);
    const k = l.find(x => x.id === id);
    if(!k) return null;
    depo.yaz(anahtar(modul, ajan), l.filter(x => x.id !== id));
    return k;
  }

  /* İki dokunuşla siler (söz 4). Doner: true silindiyse. */
  function sil(modul, ajan, id){
    if(silOnay !== id){ silOnay = id; return false; }
    silOnay = null;
    depo.yaz(anahtar(modul, ajan), liste(modul, ajan).filter(x => x.id !== id));
    return true;
  }

  function baslik(k){
    const ilk = (k.mesajlar || []).find(m => m.role === 'user');
    const t = String(ilk ? ilk.text : 'Sohbet').replace(/\s+/g, ' ').trim();
    return t.length > 42 ? t.slice(0, 41) + '…' : t;
  }
  const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function zaman(iso){
    const d = new Date(iso);
    if(isNaN(d)) return '';
    return d.getDate() + ' ' + AY[d.getMonth()] + ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /* Kenar listesi. act: { ac, sil } eylem adları (modülün handle'ı). */
  function listeHtml(modul, ajan, act){
    const l = liste(modul, ajan);
    if(!l.length) return '<p class="gecmis__bos">Henüz geçmiş sohbet yok. «Yeni sohbet» dediğinde açık konuşma buraya geçer.</p>';
    return '<ul class="gecmis">' + l.map(k => '<li class="gecmis__satir">'
      + '<button type="button" class="gecmis__ac" data-act="' + kac(act.ac) + '" data-id="' + kac(k.id) + '">'
      + '<span class="gecmis__ad">' + kac(baslik(k)) + '</span><small class="gecmis__zaman">' + kac(zaman(k.zaman))
      + ' · ' + k.mesajlar.length + ' mesaj</small></button>'
      + '<button type="button" class="gecmis__sil' + (silOnay === k.id ? ' is-onay' : '') + '" data-act="' + kac(act.sil) + '" data-id="' + kac(k.id)
      + '" aria-label="' + (silOnay === k.id ? 'Silinsin mi? Bir daha dokun' : 'Bu sohbeti sil') + '" title="' + (silOnay === k.id ? 'Silinsin mi?' : 'Sil') + '">'
      + (silOnay === k.id ? 'Silinsin mi?' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>')
      + '</button></li>').join('') + '</ul>';
  }

  return { liste, arsivle, al, sil, baslik, listeHtml, EN_COK, _anahtar:anahtar, _sifirla:() => { silOnay = null; } };
})();
