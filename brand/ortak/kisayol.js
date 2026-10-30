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
    if(L.KING && L.KING.ac) l.push({ ad:(L.KING.adYonelme ? L.KING.adYonelme() : 'King’e') + ' sor', simge:'king', is:() => L.KING.ac() });
    return l;
  }

  /* Cam kutu, ince çizgi simge (kullanıcı, 2026-10-30: önce «cam kareler, üstte
     eğlenceli simge, altta minik ad»; sonra «ikonlar çok emojisel, daha
     profesyonel»). Simgeler tek renk, ince çizgi (sistemin geri kalanı gibi),
     rengi modülün rengi; anlam addan seçilir, tanınmayan ad yıldız alır. */
  const SIMGELER = [
    [/uyku/, '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'],
    [/kilo|tart/, '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 10.5a3.5 3.5 0 0 1 7 0"/><path d="M12 10.5l1.5-2"/>'],
    [/öğün|yemek|kahvalt|öğle|akşam|besin|mutfak/, '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 4.5c-.8 1 .8 1.8 0 3M13 4.5c-.8 1 .8 1.8 0 3"/>'],
    [/hareket|antrenman|koşu|yürüyüş|spor|ağırlık/, '<path d="M3 12h3l2.5-6 4 12 2.5-6h6"/>'],
    [/test|tahlil/, '<path d="M9.5 3.5h5M10 3.5v6L5 18.5a1.5 1.5 0 0 0 1.3 2.2h11.4a1.5 1.5 0 0 0 1.3-2.2L14 9.5v-6"/><path d="M7.5 15h9"/>'],
    [/su\b|sıvı/, '<path d="M12 3.5c3 3.8 5.5 6.8 5.5 10a5.5 5.5 0 0 1-11 0c0-3.2 2.5-6.2 5.5-10z"/>'],
    [/not/, '<path d="M14 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9z"/><path d="M14 3.5V9h5.5M8.5 13h7M8.5 16.5h4.5"/>'],
    [/king/, '<path d="M4 8l4 3.5L12 5l4 6.5L20 8l-1.5 9.5h-13z"/><path d="M5.5 20.5h13"/>'],
    [/soru/, '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.2 1-1.2 1.8"/><path d="M12 16.6v.1"/>'],
    [/tekrar/, '<path d="M19 9a7.5 7.5 0 0 0-13.4-2.6M5 15a7.5 7.5 0 0 0 13.4 2.6"/><path d="M5 3.5v4h4M19 20.5v-4h-4"/>'],
    [/konu|okuma|kitap|ders/, '<path d="M12 6.5C10 5 7 4.5 3.5 5v13.5C7 18 10 18.5 12 20c2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5V20"/>'],
    [/deneme|sınav/, '<rect x="5" y="4.5" width="14" height="16" rx="2.5"/><path d="M9 3.5h6v3H9zM8.5 13l2.2 2.2 4.8-4.8"/>'],
    [/dil|kelime/, '<path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H11l-4.5 3.5v-3.5h0a2 2 0 0 1-2-2z"/><path d="M8.5 9h7M8.5 12h4.5"/>'],
    [/felsefe|fikir/, '<path d="M9 17.5h6M10 20.5h4"/><path d="M12 3.5a6 6 0 0 0-3.6 10.8c.6.5.6.9.6 1.7v1.5h6V16c0-.8 0-1.2.6-1.7A6 6 0 0 0 12 3.5z"/>'],
    [/tarih/, '<path d="M6.5 3.5h11M6.5 20.5h11"/><path d="M7.5 3.5c0 4 4.5 5.5 4.5 8.5s-4.5 4.5-4.5 8.5M16.5 3.5c0 4-4.5 5.5-4.5 8.5s4.5 4.5 4.5 8.5"/>'],
    [/ses|müzik/, '<path d="M4 12h0M7.5 9v6M11 6v12M14.5 8.5v7M18 10.5v3"/>'],
    [/yazı|yaz\b/, '<path d="M15 4.5l4.5 4.5L9 19.5l-5 1 1-5z"/><path d="M13 6.5l4.5 4.5"/>'],
    [/merdiven|seviye/, '<path d="M4 19.5h4v-4h4v-4h4v-4h4"/>'],
  ];
  const YILDIZ = '<path d="M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6-5.6-1.9 5.6-1.9z"/>';
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
        + simge(d.simge || d.ad) + '<span class="kisayol__ad">' + kac(d.ad) + '</span>'
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
