/* CANLI — rota hareket ederken kaydedilir ve çizilir. Modül 3'ün parçası;
   Strava'daki «Kayda başla»nın SPİ karşılığı (depo sahibi, 2026-10-03:
   «rotayı biz hareket ederken çizecek»). Konum tarayıcının konum
   servisinden gelir (navigator.geolocation); kitaplık yok. Hesap yine
   `core/rota.js`'tedir: kayıt bitince noktalar GPX'ten gelmiş gibi aynı
   `analiz`ten geçer. Canlı kayıt için ayrı bir mesafe kuralı YOKTUR.

   Sözler:
     1. KAYIT KAYBOLMAZ. Noktalar en geç 15 saniyede bir, her duraklatmada
        ve sayfa gizlenirken taslak olarak bu cihazın deposuna yazılır.
        Sayfa kapanır ya da yenilenirse kayıt DURAKLATILMIŞ olarak geri
        gelir: sürdürülür ya da bitirilir. Taslak profilin defterine değil
        ayrı bir anahtara yazılır; her yazımda bütün defter yeniden
        yazılmaz.
     2. KÖTÜ KONUM İZE GİRMEZ. Doğruluğu 30 metreden kötü konum alınmaz;
        sayılır ve kayıt sonunda söylenir.
     3. DURAKLATMA YENİ PARÇA AÇAR. Duraklatma ile sürdürme arasındaki yol
        mesafe sayılmaz (GPX'teki iki trkseg gibi).
     4. EKRAN KAPALIYKEN KONUM GELMEZ. Tarayıcı kilitli ekranda konum
        vermez. Ekran açık tutulmaya çalışılır (Wake Lock); 30 saniyeden
        uzun konum boşlukları toplanır ve kayıt sonunda söylenir. Boşlukta
        yol uydurulmaz: iki uç arası düz çizgidir ve bu yazılır.
     5. KONUM YALNIZ GÜVENLİ BAĞLANTIDA. Tarayıcı konumu https ya da
        localhost dışında vermez; o zaman kayıt başlamaz ve nedeni söylenir.
     6. KONUM CİHAZDAN ÇIKMAZ. Noktalar yalnız bu cihazın deposuna yazılır.

   Hâller: (yok) → kayitta ⇄ duraklat → bitti → kaydedilir ya da silinir. */

window.SP = window.SP || {};

SP.Canli = (function(){
  const DOGRULUK_M = 30;
  const BOSLUK_MS = 30000;
  const YAZ_MS = 15000;
  /* Durakta titreşen konum biriktirilmez (analiz onu zaten atlar); ama bu
     aralıkta bir nokta yine tutulur ki zaman çizgisi kopmasın. */
  const SEYREK_MS = 30000;
  const SECENEK = { enableHighAccuracy:true, maximumAge:0, timeout:30000 };

  const GUVENSIZ = 'Konum bu bağlantıda kullanılamıyor: tarayıcı konumu yalnız '
    + 'güvenli bağlantıda (https) verir.';
  const KONUM_YOK = 'Bu tarayıcı konum vermiyor.';
  const IZIN_YOK = 'Konum izni verilmedi. Tarayıcının site ayarlarından konuma izin ver.';

  /* Dış dünya tek yerde; testler bunları değiştirir. */
  const ortam = {
    kaynak:() => (typeof navigator !== 'undefined' && navigator.geolocation) || null,
    guvenli:() => window.isSecureContext !== false,
    saat:() => Date.now(),
    kilit:() => (typeof navigator !== 'undefined' && navigator.wakeLock) || null,
    depo:{
      oku(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } },
      yaz(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } },
      sil(k){ try{ localStorage.removeItem(k); }catch(e){ /* depo yok */ } },
    },
  };

  let d = null;              /* çalışan kayıt */
  let yuklendi = false;
  let izNo = null;           /* watchPosition kimliği */
  let kilit = null;          /* ekran kilidi (WakeLockSentinel) */
  let sonYazim = 0;
  let onbellek = { d:null, n:-1, a:null };
  const dinleyiciler = [];

  function anahtar(){
    let p = 'ben';
    try{ p = localStorage.getItem('spi.activeProfile') || 'ben'; }catch(e){ /* depo yok */ }
    return 'spi.canli.' + p;
  }

  function bildir(olay){
    const o = olay || { tip:'guncel' };
    dinleyiciler.slice().forEach(fn => { try{ fn(o); }catch(e){ console.error('Canlı kayıt dinleyicisi:', e); } });
  }
  function dinle(fn){
    dinleyiciler.push(fn);
    return () => { const i = dinleyiciler.indexOf(fn); if(i >= 0) dinleyiciler.splice(i, 1); };
  }

  /* ------------------------------------------------------------ taslak
     Noktalar kısa dizilerle: [lat, lon, yükseklik|null, başlangıçtan ms,
     yeni parça 1/0]. İki saatlik koşu ~300 KB. */
  function yaz(){
    if(!d) return;
    sonYazim = ortam.saat();
    ortam.depo.yaz(anahtar(), {
      v:1, hal:d.hal, tur:d.tur, bas:d.bas, sureMs:d.sureMs, aktifBas:d.aktifBas,
      kotu:d.kotu, bosluk:d.bosluk, yazildi:sonYazim,
      n:d.noktalar.map(p => [p.lat, p.lon, p.ele, p.t - d.bas, p.parca ? 1 : 0]),
    });
  }

  /* Taslaktan geri gelen kayıt her zaman DURAKLATILMIŞTIR: izleme sayfayla
     birlikte durdu. Son yazıma kadar geçen süre sayılır, sonrası
     sayılmaz (ne kadar sürdüğü bilinmiyor). */
  function yukle(){
    if(yuklendi) return;
    yuklendi = true;
    const t = ortam.depo.oku(anahtar());
    /* Number.isFinite: JSON'dan gelen null, isFinite(null) ile «sayı» geçiyordu. */
    if(!t || t.v !== 1 || !Array.isArray(t.n) || !Number.isFinite(t.bas)) return;
    const kesik = t.hal === 'kayitta' && Number.isFinite(t.aktifBas);
    d = {
      hal:t.hal === 'bitti' ? 'bitti' : 'duraklat', tur:t.tur || null, bas:t.bas,
      sureMs:(t.sureMs || 0) + (kesik ? Math.max(0, (t.yazildi || t.aktifBas) - t.aktifBas) : 0),
      aktifBas:null, kotu:t.kotu || 0, bosluk:t.bosluk || 0,
      noktalar:t.n.map(x => ({ lat:x[0], lon:x[1], ele:x[2], t:t.bas + x[3], parca:!!x[4] })),
      yeniParca:true, sonGelis:null, hata:null, ekran:null, geriGeldi:kesik,
    };
  }

  /* ------------------------------------------------------------- konum */

  function izle(k){
    birak();
    try{ izNo = k.watchPosition(konum, hata, SECENEK); }
    catch(e){ d.hata = 'Konum alınamadı.'; }
  }
  function birak(){
    const k = ortam.kaynak();
    if(izNo != null && k){ try{ k.clearWatch(izNo); }catch(e){ /* zaten kapalı */ } }
    izNo = null;
  }

  function konum(p){
    if(!d || d.hal !== 'kayitta' || !p || !p.coords) return;
    const c = p.coords, t = isFinite(p.timestamp) ? p.timestamp : ortam.saat();
    if(d.sonGelis != null && t - d.sonGelis > BOSLUK_MS) d.bosluk += t - d.sonGelis;
    d.sonGelis = t;
    if(!(c.accuracy <= DOGRULUK_M)){
      d.kotu++;
      d.hata = isFinite(c.accuracy) ? 'Konum zayıf (±' + Math.round(c.accuracy) + ' m)' : 'Konum zayıf';
      bildir();
      return;
    }
    d.hata = null;
    const n = {
      lat:Math.round(c.latitude * 1e7) / 1e7, lon:Math.round(c.longitude * 1e7) / 1e7,
      ele:c.altitude == null || !isFinite(c.altitude) ? null : Math.round(c.altitude * 10) / 10,
      t, parca:d.yeniParca,
    };
    const son = d.noktalar[d.noktalar.length - 1];
    if(son && t < son.t) return;
    if(son && !n.parca && t - son.t < SEYREK_MS && SP.Rota.mesafe(son, n) < SP.Rota.TITREME_M){
      bildir();
      return;
    }
    d.yeniParca = false;
    d.noktalar.push(n);
    if(ortam.saat() - sonYazim >= YAZ_MS) yaz();
    bildir();
  }

  function hata(e){
    if(!d) return;
    if(e && e.code === 1){
      /* İzin yok: hiç nokta yoksa kayıt hiç başlamamış sayılır. */
      if(!d.noktalar.length){ sil(); bildir({ tip:'hata', why:IZIN_YOK }); return; }
      duraklat();
      d.hata = IZIN_YOK;
      bildir({ tip:'hata', why:IZIN_YOK });
      return;
    }
    d.hata = 'GPS sinyali yok';
    bildir();
  }

  /* ------------------------------------------------------- ekran kilidi */

  async function ekranAc(){
    const w = ortam.kilit();
    if(!w || typeof w.request !== 'function'){ if(d) d.ekran = 'yok'; bildir(); return; }
    try{
      const k = await w.request('screen');
      if(!d || d.hal !== 'kayitta'){ try{ k.release(); }catch(e){ /* bırakılmış */ } return; }
      kilit = k;
      d.ekran = 'acik';
      if(k.addEventListener) k.addEventListener('release', () => {
        if(kilit === k) kilit = null;
        if(d && d.hal === 'kayitta'){ d.ekran = 'birakildi'; bildir(); }
      });
    }catch(e){ if(d) d.ekran = 'yok'; }
    bildir();
  }
  function ekranBirak(){
    const k = kilit;
    kilit = null;
    if(k){ try{ k.release(); }catch(e){ /* bırakılmış */ } }
    if(d) d.ekran = null;
  }

  /* -------------------------------------------------------------- akış */

  function baslat(tur){
    yukle();
    if(d) return { ok:false, why:'Bir kayıt zaten var; önce onu bitir ya da sil.' };
    if(!ortam.guvenli()) return { ok:false, why:GUVENSIZ };
    const k = ortam.kaynak();
    if(!k) return { ok:false, why:KONUM_YOK };
    const simdi = ortam.saat();
    d = { hal:'kayitta', tur:SP.Rota.HAREKETLER.indexOf(tur) >= 0 ? tur : null, bas:simdi,
      sureMs:0, aktifBas:simdi, kotu:0, bosluk:0, noktalar:[],
      yeniParca:true, sonGelis:null, hata:null, ekran:null, geriGeldi:false };
    izle(k);
    yaz();
    ekranAc();
    bildir();
    return { ok:true };
  }

  function duraklat(){
    yukle();
    if(!d || d.hal !== 'kayitta') return false;
    d.sureMs += Math.max(0, ortam.saat() - d.aktifBas);
    d.aktifBas = null;
    d.hal = 'duraklat';
    d.yeniParca = true;
    birak();
    ekranBirak();
    yaz();
    bildir();
    return true;
  }

  function surdur(){
    yukle();
    if(!d || d.hal !== 'duraklat') return { ok:false, why:'Duraklatılmış bir kayıt yok.' };
    if(!ortam.guvenli()) return { ok:false, why:GUVENSIZ };
    const k = ortam.kaynak();
    if(!k) return { ok:false, why:KONUM_YOK };
    Object.assign(d, { hal:'kayitta', aktifBas:ortam.saat(), yeniParca:true, sonGelis:null,
      hata:null, geriGeldi:false });
    izle(k);
    yaz();
    ekranAc();
    bildir();
    return { ok:true };
  }

  /* Noktalardan kaydedilecek rota (kayıt sürerken de kurulabilir). */
  function rota(){
    yukle();
    if(!d) return { ok:false, why:'Kayıt yok.' };
    if(!d.noktalar.length) return { ok:false, why:'Henüz hiç konum gelmedi; kayıt boş.' };
    return SP.Rota.noktalardan(d.noktalar, {
      kaynak:'canli', zayif:d.kotu, bosluk:Math.round(d.bosluk / 1000) });
  }

  /* Kaydı bitirir. İzde hareket yoksa kayıt SİLİNMEZ: duraklatılmış kalır,
     sürdürülür ya da elle silinir. */
  function bitir(){
    yukle();
    if(!d) return { ok:false, why:'Kayıt yok.' };
    if(d.hal === 'kayitta') duraklat();
    const r = rota();
    if(!r.ok) return r;
    d.hal = 'bitti';
    yaz();
    bildir();
    return r;
  }

  function sil(){
    birak();
    ekranBirak();
    d = null;
    onbellek = { d:null, n:-1, a:null };
    ortam.depo.sil(anahtar());
    bildir();
  }

  /* ------------------------------------------------------------ okuma */

  function sure(){
    if(!d) return 0;
    return Math.round((d.sureMs + (d.aktifBas != null ? Math.max(0, ortam.saat() - d.aktifBas) : 0)) / 1000);
  }

  function durum(){
    yukle();
    if(!d) return null;
    return { hal:d.hal, tur:d.tur, bas:d.bas, sure:sure(), nokta:d.noktalar.length,
      kotu:d.kotu, bosluk:Math.round(d.bosluk / 1000), hata:d.hata, ekran:d.ekran,
      geriGeldi:d.geriGeldi };
  }

  function noktalar(){ yukle(); return d ? d.noktalar : []; }

  /* Şimdiye kadarki iz özeti (analiz); hareket yoksa null. Nokta sayısı
     değişmedikçe yeniden hesaplanmaz. */
  function ozet(){
    yukle();
    if(!d || d.noktalar.length < 2) return null;
    if(onbellek.d !== d || onbellek.n !== d.noktalar.length){
      const a = SP.Rota.analiz(d.noktalar);
      onbellek = { d, n:d.noktalar.length, a:a.ok ? a : null };
    }
    return onbellek.a;
  }

  /* Sayfa gizlenirken taslak yazılır; dönünce ekran kilidi yeniden istenir
     (tarayıcı gizlenen sayfanın kilidini kendiliğinden bırakır). */
  document.addEventListener('visibilitychange', () => {
    if(!d) return;
    if(document.visibilityState === 'hidden'){ yaz(); return; }
    if(d.hal === 'kayitta' && !kilit) ekranAc();
  });
  window.addEventListener('pagehide', () => { if(d) yaz(); });

  /* Testler için: bellekteki kaydı bırakır (depoya dokunmadan). */
  function _sifirla(){
    birak();
    ekranBirak();
    d = null;
    yuklendi = false;
    sonYazim = 0;
    onbellek = { d:null, n:-1, a:null };
  }

  return {
    durum, noktalar, ozet, baslat, duraklat, surdur, bitir, rota, sil, dinle, yukle,
    DOGRULUK_M, BOSLUK_MS, GUVENSIZ, IZIN_YOK, _ortam:ortam, _sifirla,
  };
})();
