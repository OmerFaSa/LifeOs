/* KISAYOL — üç arayüzde aynı kısa yollar: ekranda dokunulan şerit ve klavye.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kisayol.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Depo sahibi (2026-10-16): «bir sürü kullanım kolaylığı, kısa yollar koy»;
   sonra: «klavyeden ziyade ekranda kısa yollar».

   EKRANDA (asıl yüz): Bugün'de «Ne yaptın?» kutusunun altında tek sıra
   düğme. Modül kendi düğmelerini verir (`dugmeler()`), sonuna her modülde
   aynı iki düğme eklenir: Notlarım ve King'e sor. Bir düğme üç şeyden
   birini yapar: bir ekrana gider (rota), «Ne yaptın?» kutusunu başlangıç
   sözüyle doldurur (doldur — yazmaz, kullanıcı tamamlayıp önizler) ya da
   modülün verdiği işi çalıştırır (is). Sayı rozeti yalnız modülün
   hesapladığı sayıdır; sayı yoksa rozet yok (sıfır uydurulmaz).

   KLAVYE (ek):

     N          «Ne yaptın?» kutusuna git, yazmaya başla (giris.js)
     Shift+N    Notlarım paneli (notum.js)
     /          komut paleti (Ctrl+K'nin kısası)
     G + harf   çekmeceye git: B Bugün · P Plan · C Çalışma · Ö Öğren ·
                A Analiz · O Onaylar · F Ofis · K Kütüphane · Y Ayarlar
                (yalnız modülde olan çekmeceler; harita çekmece kimliğinden
                türetilir, modül `cekmeceler()` ile [{id, rota}] verir)

   Sözler:
     1. YAZARKEN SUSAR. Girdi, metin alanı ya da düzenlenebilir alanda;
        Ctrl/Alt/Cmd basılıyken; bir pencere (King, sayfa altı, panel)
        açıkken hiçbir kısayol çalışmaz.
     2. MODÜLÜN TUŞUNA DOKUNMAZ. Var olan tuşlar (Ctrl+K, ?, Esc, AYS'de
        f, tekrar kartlarında 1–3 ve boşluk, listelerde j/k) bu dosyada
        yoktur; çakışmaz.
     3. ADRES YALNIZ HARİTADAN. G + harf yalnız modülün verdiği haritadaki
        rotaya gider; bilinmeyen harf hiçbir şey yapmaz.
     4. LİSTE TEK YERDEN. `satirlar()` modülün «?» penceresine eklenir.
     5. ŞERİT HİÇBİR ŞEY YAZMAZ. «doldur» yalnız kutuya metin koyar; kayıt
        her zamanki gibi önizleme + «Kaydet» ile olur (giris.js söz 1). */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.KISAYOL = (function(){
  'use strict';

  /* çekmece kimliği -> harf; ad ekranda görünür */
  const HARF = { bugun:'b', plan:'p', calisma:'c', ogren:'ö', analiz:'a', onaylar:'o', ofis:'f', kutuphane:'k', ayarlar:'y' };
  const ADLAR = { b:'Bugün', p:'Plan', c:'Çalışma', 'ö':'Öğren', a:'Analiz', o:'Onaylar', f:'Ofis', k:'Kütüphane', y:'Ayarlar' };
  let ayar = null;        // { modul, git(route), cekmeceler():[{id, rota}], palet() }
  let sabitHarita = null;
  let gBekliyor = 0;
  let bagli = false;

  function yaziyor(e){
    const t = e.target;
    return !!(t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable));
  }
  function pencereAcik(){
    if(typeof document === 'undefined') return false;
    return !!document.querySelector('html.king-acik, #cmdk, #notlar-panel, .sheet.is-open, .sheet--open, [role="dialog"][aria-modal="true"]:not([hidden])');
  }

  function harita(){
    if(sabitHarita) return sabitHarita;
    const h = {};
    let l = [];
    try{ l = (ayar && ayar.cekmeceler) ? (ayar.cekmeceler() || []) : []; }catch(e){ l = []; }
    l.forEach(c => { const k = HARF[c && c.id]; if(k && c.rota && !h[k]) h[k] = c.rota; });
    return h;
  }

  function girisOdak(){
    const g = () => document.getElementById('giris-girdi');
    if(g()){ try{ g().focus(); g().scrollIntoView({ block:'center', behavior:'smooth' }); }catch(e){ /* odak yok */ } return true; }
    const r = harita().b;
    if(!r || !ayar.git) return false;
    ayar.git(r);
    setTimeout(() => { const x = g(); if(x) try{ x.focus(); }catch(e){ /* odak yok */ } }, 120);
    return true;
  }

  /* Döner: işlendi mi. Testler doğrudan çağırır. */
  function tus(e){
    if(!ayar || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || yaziyor(e) || pencereAcik()) return false;
    const k = String(e.key || '');
    const kk = k.toLocaleLowerCase('tr-TR');
    if(gBekliyor && Date.now() - gBekliyor < 1500){
      gBekliyor = 0;
      const rota = harita()[kk];
      if(rota && ayar.git){ ayar.git(rota); return true; }
      return false;
    }
    gBekliyor = 0;
    if(kk === 'g' && !e.shiftKey){ gBekliyor = Date.now(); return true; }
    if(k === '/'){ if(ayar.palet){ ayar.palet(); return true; } return false; }
    if(k === 'N' || (kk === 'n' && e.shiftKey)){
      const N = window.LIFEOS.NOTUM;
      if(N && N.kuruluMu && N.kuruluMu()){ N.panelAc(); return true; }
      return false;
    }
    if(kk === 'n'){ return girisOdak(); }
    return false;
  }

  function satirlar(){
    if(!ayar) return [];
    const l = [[['N'], '«Ne yaptın?» kutusuna git'], [['Shift', 'N'], 'Notlarım'], [['/'], 'Komut paleti']];
    const h = harita();
    Object.keys(h).forEach(k => {
      l.push([['G', k.toLocaleUpperCase('tr-TR')], ADLAR[k] + ' çekmecesine git']);
    });
    return l;
  }
  /* SPİ ve ESP penceresi düz metin satır ister: ['G sonra B', 'Bugün …'] */
  function metinSatirlari(){
    return satirlar().map(s => [s[0][0] === 'G' ? 'G sonra ' + s[0][1] : s[0].join(' + '), s[1]]);
  }

  function kur(o){
    ayar = Object.assign({}, o || {});
    sabitHarita = ayar.harita || null;
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    /* Yakalama evresinde, pencerede: G'den sonraki harf (G K, G F) modülün
       j/k ya da f tuşuna da gitmesin diye işlenen tuş durdurulur. */
    window.addEventListener('keydown', e => { if(tus(e)){ e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* ---------- ekrandaki şerit ---------- */
  let sonDugmeler = [];
  let tikBagli = false;
  const kac = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);

  function dugmeListesi(){
    let l = [];
    try{ l = (ayar && ayar.dugmeler) ? (ayar.dugmeler() || []) : []; }catch(e){ l = []; }
    l = l.filter(d => d && d.ad && (d.rota || d.is || d.doldur != null));
    const L = window.LIFEOS;
    if(L.NOTUM && L.NOTUM.kuruluMu && L.NOTUM.kuruluMu()) l.push({ ad:'Notlarım', is:() => L.NOTUM.panelAc() });
    if(L.KING && L.KING.ac) l.push({ ad:'King’e sor', is:() => L.KING.ac() });
    return l;
  }

  function seritHtml(){
    if(!ayar) return '';
    sonDugmeler = dugmeListesi();
    if(!sonDugmeler.length) return '';
    tikBagla();
    return '<nav class="kisayol" aria-label="Kısa yollar">'
      + sonDugmeler.map((d, i) => '<button type="button" class="kisayol__d" data-kisayol="' + i + '">'
        + kac(d.ad)
        + (typeof d.sayi === 'number' && d.sayi > 0 ? '<span class="kisayol__sayi">' + kac(d.sayi) + '</span>' : '')
        + '</button>').join('')
      + '</nav>';
  }

  function doldur(metin){
    const g = document.getElementById('giris-girdi');
    if(!g) return false;
    g.value = metin;
    try{ g.focus(); g.setSelectionRange(metin.length, metin.length); }catch(e){ /* odak yok */ }
    return true;
  }

  /* Döner: işlendi mi. Testler doğrudan çağırır. */
  function dugmeCalistir(i){
    const d = sonDugmeler[i];
    if(!d) return false;
    if(d.doldur != null) return doldur(String(d.doldur));
    if(d.is){ d.is(); return true; }
    if(d.rota && ayar && ayar.git){ ayar.git(d.rota); return true; }
    return false;
  }

  function tikBagla(){
    if(tikBagli || typeof document === 'undefined') return;
    tikBagli = true;
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest ? e.target.closest('[data-kisayol]') : null;
      if(!b) return;
      e.preventDefault();
      dugmeCalistir(Number(b.getAttribute('data-kisayol')));
    });
  }

  function _sifirla(){ ayar = null; sabitHarita = null; gBekliyor = 0; }

  return { kur, tus, satirlar, seritHtml, dugmeCalistir, dugmeListesi, metinSatirlari, harita, HARF, ADLAR, kuruluMu:() => !!ayar, _sifirla, _ayar:() => ayar };
})();
