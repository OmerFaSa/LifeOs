/* GİRİŞ — üç arayüzde tek satırda veri girme kapısı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/giris.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `giris.css`.
   ==================================================================

   Depo sahibi (2026-10-15): «veri girme, öğrenme yerleri gibi şeyleri de
   daha kolay, daha anlaşılır arayüzler yap; genel sistem mimarisi
   açısından, bütün modüllere uygula».

   ÖNCE: her modülün kendi tek satır ayrıştırıcısı vardı (AYS core/komut.js,
   SPİ core/quickentry.js, ESP core/parse.js) ama her biri başka bir yerden
   ve başka biçimde açılıyordu: AYS'de yalnız Ctrl+K, SPİ'de Ctrl+K ve
   yalnız öğün kutusu, ESP'de Bugün'de ayrı bir form; King de üçünde farklı.

   ŞİMDİ TEK SÖZLEŞME: modül ayrıştırıcısını BİR KEZ bağlar —
       GIRIS.kur({ modul, onizle(metin) → { metin, ipucu, kaydet() } | null, ornekler })
   ve aynı kapıyı üç yer kullanır: Bugün'deki kutu (kutuHtml), King
   (kaynak) ve modülün paleti. Kutu, önizleme kartı ve Kaydet/Vazgeç her
   modülde AYNI görünür ve aynı davranır.

   Sözler:
     1. HİÇBİR ŞEY DOĞRUDAN KAYDEDİLMEZ. Yazılan önizlenir; «Kaydet»
        denmeden depoya gitmez (modülün kaydet'i kendi koduyla yazar).
     2. ANLAŞILMAYAN UYDURULMAZ (AGENTS §1.7). Ayrıştırıcı null dönerse
        «anlayamadım» denir ve örnekler gösterilir; tahminle kayıt yok.
     3. AYRIŞTIRICI MODÜLÜNDÜR. Bu dosya cümle anlamaz; yalnız kapıdır.
        Sayıyı ve kararı modülün kodu üretir.
     4. YAZARKEN ODAK KAYBOLMAZ. Önizleme ve sonuç kutunun içinde güncellenir;
        sayfa baştan çizilmez. Mikrofon varsa söylenen kutuya yazılır.
     5. MODÜL ONSUZ DA ÇALIŞIR. Kurulmadıysa kutu hiç çizilmez; King ve
        palet kendi yollarıyla sürer.
     6. AZ SÜRTÜNME (2026-10-16, «veri sürtünmesini azalt, kalabalık
        olmasın»). Önizleme görünürken aynı satırda yeniden Enter «Kaydet»
        demektir (açık onay; metin değiştiyse yeniden önizlenir). Kayıttan
        sonra imleç kutuda kalır, sıradaki giriş hemen yazılır. Kutunun
        altında tek sıra çip durur: modülün kısa yolları (kisayol.js) varsa
        onlar, yoksa örnekler; örnek her zaman yer tutucuda ve «anlayamadım»
        mesajının altında.
     7. BİR CÜMLE, BİRÇOK KAYIT (2026-10-16, «bir sürü veri girişi yapmamız
        lazım»). «7 saat uyudum, 2 yumurta yedim, 45 dk koştum» parçalara
        ayrılır (virgül, noktalı virgül, «ve», satır sonu); her parça
        modülün ayrıştırıcısına gider, aynı türdekiler («2 yumurta, 1 çay»)
        yeniden birleştirilip tek kayıt olur. Önizleme liste gösterir,
        tek «Kaydet» hepsini yazar. Anlaşılmayan parça uydurulmaz:
        «yazılmayacak» diye adıyla söylenir. Tek türden bir cümle eskisi
        gibi bütün olarak ayrıştırılır. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.GIRIS = (function(){
  'use strict';

  const ortam = {
    tanima:() => (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null,
  };

  let ayar = null;           // { modul, onizle, ornekler }
  let bekleyen = null;       // { yazilan, p }
  let mesaj = null;          // { tur:'ok'|'uyari', metin }
  let dinleyen = null;
  let bagli = false;

  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  function tekOnizle(t){
    try{
      const p = ayar.onizle(t);
      return p && typeof p.kaydet === 'function' ? p : null;
    }catch(e){ console.error('Giriş: önizleme', e); return null; }
  }

  /* Söz 7. Ondalık virgül («7,5») ayıraç değildir. */
  function parcala(t){
    return String(t).split(/(?<!\d),|,(?!\d)|;|\n|\s+ve\s+|\s+sonra\s+/i).map(x => x.trim()).filter(Boolean);
  }

  function onizle(metin){
    if(!ayar || typeof ayar.onizle !== 'function') return null;
    const t = String(metin || '').trim();
    if(!t) return null;
    const parca = parcala(t);
    if(parca.length < 2) return tekOnizle(t);
    const tek = parca.map(x => ({ x, p:tekOnizle(x) }));
    const anlasilan = tek.filter(o => o.p);
    const tur = o => o.p.tur || '?';
    const turler = anlasilan.map(tur).filter((v, i, l) => l.indexOf(v) === i);
    /* Tek türden cümle: eskisi gibi bütün olarak (modül kendisi birleştirir). */
    if(turler.length < 2){
      const butun = tekOnizle(t);
      if(butun) return butun;
      if(!anlasilan.length) return null;
    }
    /* Aynı türdekiler yeniden birleştirilir: «2 yumurta, 1 çay» tek öğün. */
    const parcalar = [];
    turler.forEach(k => {
      const g = anlasilan.filter(o => tur(o) === k);
      const j = g.length > 1 ? tekOnizle(g.map(o => o.x).join(', ')) : null;
      if(j) parcalar.push(j); else g.forEach(o => parcalar.push(o.p));
    });
    const kalan = tek.filter(o => !o.p).map(o => o.x);
    if(parcalar.length === 1 && !kalan.length) return parcalar[0];
    return {
      tur:turler.length === 1 ? turler[0] : 'veri',
      parcalar,
      metin:parcalar.map(p => p.metin).join(' · '),
      ipucu:kalan.length ? 'Anlaşılmadı, yazılmayacak: «' + kalan.join('», «') + '»'
        : (parcalar.length > 1 ? parcalar.length + ' kayıt birlikte yazılır.' : (parcalar[0].ipucu || '')),
      async kaydet(){
        let n = 0;
        for(const p of parcalar){ await p.kaydet(); n++; }
        return n > 1 ? n + ' kayıt eklendi.' : 'Kaydedildi.';
      },
    };
  }

  /* King ve palet için (söz 3): modülün kapısı. */
  function kaynak(){ return ayar && typeof ayar.onizle === 'function' ? { onizle } : null; }

  function sonucHtml(){
    if(bekleyen){
      const p = bekleyen.p;
      return '<div class="giris__onizle" role="group" aria-label="Kaydedilecek">'
        + '<span class="giris__onizle-ad">Şunu kaydedeyim mi?</span>'
        + (p.parcalar && p.parcalar.length > 1
          ? '<ul class="giris__liste">' + p.parcalar.map(x => '<li><b>' + kac(x.metin) + '</b></li>').join('') + '</ul>'
          : '<b>' + kac(p.metin) + '</b>')
        + (p.ipucu ? '<small>' + kac(p.ipucu) + '</small>' : '')
        + '<div class="giris__dugmeler">'
        + '<button type="button" class="btn btn--sm btn--primary" data-giris="kaydet"><span class="btn__label">Kaydet</span></button>'
        + '<button type="button" class="btn btn--sm btn--ghost" data-giris="vazgec"><span class="btn__label">Vazgeç</span></button>'
        + '<span class="giris__kisa">ya da yeniden Enter</span>'
        + '</div></div>';
    }
    if(mesaj) return '<p class="giris__mesaj giris__mesaj--' + mesaj.tur + '" role="status">' + kac(mesaj.kisa || mesaj.metin) + '</p>'
      + (mesaj.tur === 'uyari' && mesaj.ornekli ? ornekHtml() : '');
    return '';
  }

  function ornekHtml(){
    const l = (ayar && ayar.ornekler) || [];
    if(!l.length) return '';
    return '<div class="giris__ornekler" role="group" aria-label="Örnekler">'
      + l.map(o => '<button type="button" class="giris__ornek" data-giris-ornek="' + kac(o) + '">' + kac(o) + '</button>').join('')
      + '</div>';
  }

  function yerTutucu(){
    const o = (ayar && ayar.ornekler) || [];
    return o.length ? 'Örneğin: ' + o[0] : 'Yaz ya da söyle; önce gösteririm, onaylarsan kaydederim';
  }
  /* Kısa yollar (kisayol.js) kutunun içinde, örneklerin yerinde (söz 6). */
  function seritHtml(){
    const K = window.LIFEOS.KISAYOL;
    return K && K.kuruluMu && K.kuruluMu() && K.seritHtml ? K.seritHtml() : '';
  }

  /* Bugün'deki kutu. Kurulmadıysa boş (söz 5). */
  function kutuHtml(){
    if(!ayar) return '';
    bagla();
    const mik = ortam.tanima()
      ? '<button type="button" class="giris__mik' + (dinleyen ? ' is-acik' : '') + '" data-giris="mik" aria-pressed="'
        + (dinleyen ? 'true' : 'false') + '" aria-label="Söyleyerek gir" title="Söyleyerek gir · tanımayı tarayıcı yapar">'
        + '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3.5" width="6" height="11" rx="3"/>'
        + '<path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></button>'
      : '';
    return '<div class="giris" data-giris-kutu data-modul="' + kac(ayar.modul || '') + '">'
      + '<form class="giris__satir" data-giris-form data-ayar-disi>'
      + '<label class="giris__etiket" for="giris-girdi">Ne yaptın?</label>'
      + '<input class="giris__girdi" id="giris-girdi" type="text" autocomplete="off" enterkeyhint="send"'
      + ' placeholder="' + kac(yerTutucu()) + '"/>'
      + mik
      + '<button type="submit" class="giris__gonder" aria-label="Önizle"><svg viewBox="0 0 24 24" aria-hidden="true">'
      + '<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg></button>'
      + '</form>'
      + (seritHtml() || ornekHtml())
      + '<div class="giris__sonuc" data-giris-sonuc aria-live="polite">' + sonucHtml() + '</div>'
      + '</div>';
  }

  function tazele(){
    if(typeof document === 'undefined') return;
    document.querySelectorAll('[data-giris-sonuc]').forEach(el => { el.innerHTML = sonucHtml(); });
    document.querySelectorAll('.giris__mik').forEach(m => {
      m.classList.toggle('is-acik', !!dinleyen);
      m.setAttribute('aria-pressed', dinleyen ? 'true' : 'false');
    });
  }

  function gonder(metin){
    const t = String(metin || '').trim();
    if(!t) return null;
    /* Söz 6: önizlenen metinde yeniden Enter = Kaydet. */
    if(bekleyen && bekleyen.yazilan === t){ const p0 = bekleyen.p; kaydet(); return p0; }
    const p = onizle(t);
    if(p){ bekleyen = { yazilan:t, p }; mesaj = null; }
    else{
      bekleyen = null;
      const o = (ayar && ayar.ornekler) || [];
      const bas = 'Bunu anlayamadım; tahminle kaydetmiyorum.';
      /* metin tam cümle (durum() okuyanlar için); ekranda örnekler çip olur */
      mesaj = { tur:'uyari', ornekli:o.length > 0, kisa:o.length ? bas + ' Şöyle yazabilirsin:' : bas,
        metin:bas + (o.length ? ' Şöyle yazabilirsin: «' + o.slice(0, 3).join('», «') + '».' : '') };
    }
    tazele();
    return p;
  }

  async function kaydet(){
    const b = bekleyen;
    if(!b) return null;
    bekleyen = null;
    let r = null;
    try{
      r = await b.p.kaydet();
      mesaj = { tur:'ok', metin:(r && String(r)) || 'Kaydedildi.' };
      const g = typeof document !== 'undefined' ? document.getElementById('giris-girdi') : null;
      if(g){ g.value = ''; try{ g.focus(); }catch(err){ /* odak yok */ } }
    }catch(e){
      mesaj = { tur:'uyari', metin:'Kaydedilemedi: ' + ((e && e.message) || 'bilinmeyen hata') };
    }
    tazele();
    return mesaj.metin;
  }

  function dinle(){
    if(dinleyen){ try{ dinleyen.stop(); }catch(e){ /* kapalı */ } return; }
    const T = ortam.tanima();
    if(!T) return;
    let r;
    try{ r = new T(); }catch(e){ return; }
    r.lang = 'tr-TR'; r.interimResults = true; r.continuous = false;
    let son = '';
    r.onresult = e => {
      let t = '';
      for(let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      son = t.trim();
      const g = document.getElementById('giris-girdi');
      if(g) g.value = son;
    };
    r.onerror = e => {
      if(e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')){
        mesaj = { tur:'uyari', metin:'Mikrofon izni verilmedi; yazarak da girebilirsin.' };
      }
    };
    r.onend = () => { dinleyen = null; tazele(); if(son) gonder(son); };
    dinleyen = r;
    try{ r.start(); }catch(e){ dinleyen = null; }
    tazele();
  }

  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-giris-form]') : null;
      if(!f) return;
      e.preventDefault();
      const g = f.querySelector('.giris__girdi');
      gonder(g ? g.value : '');
    });
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const o = t.closest('[data-giris-ornek]');
      if(o){
        const g = document.getElementById('giris-girdi');
        if(g){ g.value = o.getAttribute('data-giris-ornek'); try{ g.focus(); }catch(err){ /* odak yok */ } }
        return;
      }
      const d = t.closest('[data-giris]');
      if(!d) return;
      const is = d.getAttribute('data-giris');
      if(is === 'kaydet'){ e.preventDefault(); kaydet(); }
      else if(is === 'vazgec'){ e.preventDefault(); bekleyen = null; mesaj = null; tazele(); }
      else if(is === 'mik'){ e.preventDefault(); dinle(); }
    });
  }

  /* Modülün tek çağrısı (app.js). */
  function kur(o){
    ayar = Object.assign({ modul:'', ornekler:[] }, o || {});
    bagla();
  }

  function _sifirla(){ ayar = null; bekleyen = null; mesaj = null; dinleyen = null; }

  return { kur, kaynak, onizle, kutuHtml, gonder, kaydet, kuruluMu:() => !!ayar,
    durum:() => ({ bekleyen:bekleyen ? bekleyen.p.metin : null, mesaj:mesaj ? mesaj.metin : null }),
    _ortam:ortam, _sifirla };
})();
