/* KISAYOL — üç arayüzde aynı kısa yollar: ekranda dokunulan şerit ve klavye.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kisayol.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Depo sahibi (2026-10-16): «bir sürü kullanım kolaylığı, kısa yollar koy»;
   sonra: «klavyeden ziyade ekranda kısa yollar».

   EKRANDA (asıl yüz): Bugün'de «Ne yaptın?» kutusunun İÇİNDE, girdinin
   altında tek sıra düğme (giris.js söz 6: örnek çiplerinin yerinde). Modül kendi düğmelerini verir (`dugmeler()`), sonuna her modülde
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
      const D = L.DEFTER;
      if(D && D.kuruluMu && D.kuruluMu()){ D.ac(); return true; }
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
    if(L.DEFTER && L.DEFTER.kuruluMu && L.DEFTER.kuruluMu()) l.push({ ad:'Notlarım', is:() => L.DEFTER.ac() });
    else if(L.NOTUM && L.NOTUM.kuruluMu && L.NOTUM.kuruluMu()) l.push({ ad:'Notlarım', is:() => L.NOTUM.panelAc() });
    if(L.KING && L.KING.ac) l.push({ ad:'King’e sor', is:() => L.KING.ac() });
    return l;
  }

  /* Oyunsu düğme (kullanıcı, 2026-10-30, örnek: cam kareler, üstte eğlenceli
     renkli simge, altta minik ad: «daha oyunsu, anlaşılması kolay, sistem daha
     sıcak olur; camsı efekti unutma»). Simge adın anlamından seçilir; tanınmayan
     ad yıldız alır. Renk süs değildir, düğmeyi bulmayı kolaylaştırır. */
  const SIMGELER = [
    [/uyku/, '<path d="M15.5 3.5a8.5 8.5 0 1 0 5 15.4A7 7 0 0 1 15.5 3.5z" fill="#8B7CF6"/><circle cx="18.2" cy="5.8" r="1.3" fill="#FFC93C"/><circle cx="20.6" cy="9.8" r=".9" fill="#FFC93C"/>'],
    [/kilo|tart/, '<rect x="3.5" y="4" width="17" height="16" rx="4.5" fill="#2EC4B6"/><path d="M8 11a4 4 0 0 1 8 0z" fill="#fff"/><path d="M12 11l1.7-2.4" stroke="#2EC4B6" stroke-width="1.4" stroke-linecap="round"/>'],
    [/öğün|yemek|kahvalt|öğle|akşam|besin|mutfak/, '<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z" fill="#FF9F43"/><path d="M9 3.8c-1 1.2 1 2 0 3.4M13 3.8c-1 1.2 1 2 0 3.4" stroke="#FFC93C" stroke-width="1.6" fill="none" stroke-linecap="round"/>'],
    [/hareket|antrenman|koşu|yürüyüş|spor|ağırlık/, '<path d="M13.5 2.5 5 13.5h6l-1.5 8 9-11.5h-6z" fill="#FFB020"/><path d="M13.5 2.5 5 13.5h6z" fill="#FF8A3D"/>'],
    [/test|tahlil/, '<path d="M10 3v5.5L4.8 17.6A2.3 2.3 0 0 0 6.8 21h10.4a2.3 2.3 0 0 0 2-3.4L14 8.5V3" fill="#DDF7EC" stroke="#2ECC8F" stroke-width="1.6" stroke-linejoin="round"/><path d="M6.3 15h11.4l1.5 2.6a2.3 2.3 0 0 1-2 3.4H6.8a2.3 2.3 0 0 1-2-3.4z" fill="#2ECC8F"/><path d="M8.5 3h7" stroke="#2ECC8F" stroke-width="1.8" stroke-linecap="round"/>'],
    [/su\b|sıvı/, '<path d="M12 3.5c3.3 4 5.5 7.1 5.5 10a5.5 5.5 0 0 1-11 0c0-2.9 2.2-6 5.5-10z" fill="#4DA3FF"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>'],
    [/not/, '<rect x="5" y="3" width="14" height="18" rx="3" fill="#FFC93C"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>'],
    [/king/, '<path d="M3.5 8l4.2 3.6L12 5l4.3 6.6L20.5 8l-1.8 10H5.3z" fill="#FFB020"/><rect x="5.3" y="18.6" width="13.4" height="2.2" rx="1.1" fill="#E89611"/><circle cx="12" cy="13.6" r="1.5" fill="#fff"/>'],
    [/soru/, '<path d="M12 3.5a8.5 8.5 0 0 1 0 17c-1.5 0-2.9-.4-4.1-1L4 20.5l1.1-3.6A8.5 8.5 0 0 1 12 3.5z" fill="#4DA3FF"/><path d="M9.8 9.6a2.3 2.3 0 1 1 3.3 2.1c-.7.3-1.1.9-1.1 1.6v.4" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round"/><circle cx="12" cy="16.4" r="1" fill="#fff"/>'],
    [/tekrar/, '<path d="M19 9a7.5 7.5 0 0 0-13.4-2.6M5 15a7.5 7.5 0 0 0 13.4 2.6" stroke="#2EC4B6" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M5 3.5v4h4M19 20.5v-4h-4" stroke="#2EC4B6" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'],
    [/konu|okuma|kitap|ders/, '<path d="M3.5 5.5c3-1.2 5.8-1 8.5.8v14c-2.7-1.8-5.5-2-8.5-.8z" fill="#4DA3FF"/><path d="M20.5 5.5c-3-1.2-5.8-1-8.5.8v14c2.7-1.8 5.5-2 8.5-.8z" fill="#9CCBFF"/>'],
    [/deneme|sınav/, '<rect x="5" y="4.5" width="14" height="16.5" rx="3" fill="#FF6B9D"/><rect x="9" y="3" width="6" height="3.5" rx="1.5" fill="#FFB3CC"/><path d="M8.5 12.5l2.2 2.2 4.8-4.8" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'],
    [/dil|kelime/, '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z" fill="#FF6B9D"/><path d="M8 9h8M8 12h5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>'],
    [/felsefe|fikir/, '<path d="M12 3a6.5 6.5 0 0 0-3.8 11.8c.6.4.8 1 .8 1.7V17h6v-.5c0-.7.3-1.3.8-1.7A6.5 6.5 0 0 0 12 3z" fill="#FFC93C"/><rect x="9" y="18" width="6" height="2.8" rx="1.2" fill="#A99FD0"/>'],
    [/tarih/, '<path d="M6 3.5h12M6 20.5h12" stroke="#8B7CF6" stroke-width="2" stroke-linecap="round"/><path d="M7.5 4v2.5c0 2 4.5 3.7 4.5 5.5S7.5 15.5 7.5 17.5V20h9v-2.5c0-2-4.5-3.7-4.5-5.5s4.5-3.5 4.5-5.5V4z" fill="#DCD5FF"/><path d="M9 20h6c0-1.8-3-2.6-3-3.6 0 1-3 1.8-3 3.6z" fill="#FF9F43"/>'],
    [/ses|müzik/, '<path d="M4 12v0M7.5 8.5v7M11 5v14M14.5 8v8M18 10v4" stroke="#FF6B9D" stroke-width="2.4" stroke-linecap="round"/>'],
    [/yazı|yaz\b/, '<path d="M15.5 4.5l4 4L9 19l-5 1 1-5z" fill="#FF9F43"/><path d="M14 6l4 4" stroke="#fff" stroke-width="1.4"/>'],
    [/merdiven|seviye/, '<path d="M4 20h4v-4h4v-4h4V8h4V4" stroke="#2ECC8F" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19.5" cy="4.5" r="2" fill="#FFC93C"/>'],
  ];
  const YILDIZ = '<path d="M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6-5.6-1.9 5.6-1.9z" fill="#8B7CF6"/><path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill="#FFC93C"/>';
  function simge(ad){
    const t = String(ad || '').toLocaleLowerCase('tr-TR');
    const s = SIMGELER.find(x => x[0].test(t));
    return '<span class="kisayol__simge" aria-hidden="true"><svg viewBox="0 0 24 24">' + (s ? s[1] : YILDIZ) + '</svg></span>';
  }

  function seritHtml(){
    if(!ayar) return '';
    sonDugmeler = dugmeListesi();
    if(!sonDugmeler.length) return '';
    tikBagla();
    return '<nav class="kisayol" aria-label="Kısa yollar">'
      + sonDugmeler.map((d, i) => '<button type="button" class="kisayol__d" data-kisayol="' + i + '">'
        + simge(d.ad) + '<span class="kisayol__ad">' + kac(d.ad) + '</span>'
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

  return { kur, tus, satirlar, seritHtml, simge, dugmeCalistir, dugmeListesi, metinSatirlari, harita, HARF, ADLAR, kuruluMu:() => !!ayar, _sifirla, _ayar:() => ayar };
})();
