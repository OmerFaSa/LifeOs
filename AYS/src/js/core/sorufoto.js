/* SORU FOTOĞRAFI — deneme sorularının fotoğrafları (core/denemeanaliz.js).
   Kullanıcı (2026-10-10): «yayınları analiz edip soruları bakabilecek bir
   sistem». Soru, öğrencinin kendi kitapçığından çekilir.

   Sözler:
     1. FOTOĞRAF CİHAZDAN ÇIKMAZ. Bu cihazın IndexedDB'sinde durur; hesap
        eşitlemesine, yedek dosyasına, HKM'ye girmez (AGENTS §1.4:
        fotoğraflar eşitlenmez). Modele yalnız «Çöz» denince o tek fotoğraf
        gider; o yol buraya yazmaz.
     2. DEFTER ŞİŞMEZ. Ana defter localStorage'dadır; fotoğraf oraya girmez.
     3. KÜÇÜLTÜLÜR. Uzun kenar en çok 1400 piksel (soru metni okunabilsin),
        JPEG.
     4. SAHİP BİR METİNDİR: «deneme:<denemeKimliği>:<test>#<no>». Her sahibin
        en çok bir fotoğrafı vardır; yenisi eskisinin yerine geçer. Profiller
        karışmaz: anahtar profil kimliğiyle başlar.
     5. DEPO YOKSA SÖYLENİR. IndexedDB açılamazsa (gizli pencere) kaydetmeye
        çalışan eylem nedenini söyler; başka hiçbir işlev bozulmaz.
     6. ÇÖZÜM METNİ FOTOĞRAFIN YANINDA DURUR. Modelin çözümü birkaç bin
        karakterdir; ana deftere yazılınca (localStorage, tek anahtar) elli
        denemede kotanın çoğunu yiyordu (denetim 2026-10-11). Çözüm,
        fotoğrafı olan cihazda üretilir; fotoğraf gibi orada kalır ve
        fotoğrafla birlikte silinir. Açılışta belleğe alınır, ekran onu
        beklemeden okur.
     7. SAHİPSİZ KALAN SİLİNİR, ACELE EDİLMEDEN. Deneme başka bir cihazda
        silinip eşitlemeyle giderse buradaki fotoğrafı sahipsiz kalır.
        Deneme defterde yoksa ve kayıt en az 30 günlükse silinir; bekleme,
        geri yükleme gibi geçici bir boşlukta fotoğrafın gitmemesi içindir.

   SPİ'nin core/foto.js kalıbı; AYS'de soru okunabilirliği için daha büyük
   kenar ve önekle toplu silme (deneme silinince fotoğrafları da gider). */

window.R = window.R || {};

R.SoruFoto = (function(){
  const DB_AD = 'ays-soru-foto', DEPO = 'foto';
  const EN_UZUN = 1400, KALITE = 0.85;

  const ortam = {
    idb:() => (typeof indexedDB !== 'undefined' ? indexedDB : null),
    dbAd:DB_AD,
  };

  let db = null, hazir = null, yok = false;
  const adres = new Map();        /* anahtar → blob URL */
  const metinler = new Map();     /* anahtar → çözüm metni (söz 6) */
  const METIN = '|cozum';
  const SAHIPSIZ_GUN = 30;

  function profil(){
    try{ return localStorage.getItem('rota.activeProfile') || 'main'; }catch(e){ return 'main'; }
  }
  const anahtar = sahip => profil() + '|' + sahip;

  function ac(){
    return new Promise((ok, red) => {
      const idb = ortam.idb();
      if(!idb){ red(new Error('IndexedDB yok')); return; }
      let r;
      try{ r = idb.open(ortam.dbAd, 1); }catch(e){ red(e); return; }
      r.onupgradeneeded = () => { r.result.createObjectStore(DEPO, { keyPath:'k' }); };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => red(r.error || new Error('IndexedDB açılamadı'));
    });
  }
  function islem(kip, fn){
    return new Promise((ok, red) => {
      const tx = db.transaction(DEPO, kip);
      const sonuc = fn(tx.objectStore(DEPO));
      tx.oncomplete = () => ok(sonuc && 'result' in sonuc ? sonuc.result : undefined);
      tx.onerror = () => red(tx.error);
      tx.onabort = () => red(tx.error || new Error('işlem kesildi'));
    });
  }

  /* Açılışta bir kez: depoyu açar, bu profilin fotoğraflarını belleğe
     adres olarak alır. Birden çok çağrı aynı sözü döner. */
  function hazirla(){
    if(hazir) return hazir;
    hazir = (async () => {
      try{
        db = await ac();
        const hepsi = await islem('readonly', s => s.getAll());
        const on = profil() + '|';
        (hepsi || []).forEach(r => {
          if(!r || !r.k || r.k.indexOf(on) !== 0) return;
          if(r.blob) adres.set(r.k, URL.createObjectURL(r.blob));
          else if(typeof r.metin === 'string') metinler.set(r.k, r.metin);
        });
      }catch(e){
        yok = true;
        console.warn('Soru fotoğrafı deposu açılamadı:', e);
      }
      return !yok;
    })();
    return hazir;
  }

  function var_(){ return !!db && !yok; }
  function url(sahip){ return adres.get(anahtar(sahip)) || null; }

  async function gorselOku(kaynak){
    if(typeof createImageBitmap === 'function'){
      try{ return await createImageBitmap(kaynak, { imageOrientation:'from-image' }); }
      catch(e){ /* eski imza: seçeneksiz dene */ }
      try{ return await createImageBitmap(kaynak); }catch(e){ /* img yoluna düş */ }
    }
    const u = URL.createObjectURL(kaynak);
    try{
      return await new Promise((ok, red) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = () => red(new Error('Görsel okunamadı'));
        img.src = u;
      });
    }finally{ setTimeout(() => URL.revokeObjectURL(u), 0); }
  }

  /* Herhangi bir görsel → küçültülmüş JPEG Blob; küçükse büyütülmez.
     Şeffaf zemin beyaza boyanır (PNG ekran görüntüsü siyaha dönmesin). */
  async function kucult(kaynak){
    const bmp = await gorselOku(kaynak);
    const oran = Math.min(1, EN_UZUN / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * oran)), h = Math.max(1, Math.round(bmp.height * oran));
    const tuval = document.createElement('canvas');
    tuval.width = w; tuval.height = h;
    const ctx = tuval.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    if(bmp.close) bmp.close();
    return await new Promise((ok, red) => tuval.toBlob(b => b ? ok(b) : red(new Error('JPEG üretilemedi')),
      'image/jpeg', KALITE));
  }

  /* Döner: { ok } ya da { ok:false, why }. */
  async function kaydet(sahip, kaynak){
    await hazirla();
    if(!var_()) return { ok:false, why:'Bu tarayıcı fotoğraf saklayamıyor (gizli pencere olabilir).' };
    if(!kaynak || !/^image\//.test(kaynak.type || '')) return { ok:false, why:'Bu bir fotoğraf değil.' };
    let blob;
    try{ blob = await kucult(kaynak); }
    catch(e){ return { ok:false, why:'Fotoğraf okunamadı.' }; }
    const k = anahtar(sahip);
    try{ await islem('readwrite', s => s.put({ k, blob, at:new Date().toISOString() })); }
    catch(e){ return { ok:false, why:'Fotoğraf kaydedilemedi (depo dolu olabilir).' }; }
    const eski = adres.get(k);
    if(eski) URL.revokeObjectURL(eski);
    adres.set(k, URL.createObjectURL(blob));
    return { ok:true };
  }

  async function al(sahip){
    await hazirla();
    if(!var_()) return null;
    const r = await islem('readonly', s => s.get(anahtar(sahip)));
    return r ? r.blob : null;
  }

  async function sil(sahip){
    await hazirla();
    if(!var_()) return;
    const k = anahtar(sahip);
    try{ await islem('readwrite', s => s.delete(k)); }catch(e){ return; }
    const eski = adres.get(k);
    if(eski) URL.revokeObjectURL(eski);
    adres.delete(k);
  }

  /* Çözüm metni (söz 6). Boş metin kaydı siler. Döner: { ok } ya da { ok:false, why }. */
  async function metinKaydet(sahip, metin){
    await hazirla();
    if(!var_()) return { ok:false, why:'Bu tarayıcı çözüm saklayamıyor (gizli pencere olabilir).' };
    const k = anahtar(sahip) + METIN, m = String(metin || '');
    try{
      if(m) await islem('readwrite', s => s.put({ k, metin:m, at:new Date().toISOString() }));
      else await islem('readwrite', s => s.delete(k));
    }catch(e){ return { ok:false, why:'Çözüm kaydedilemedi (depo dolu olabilir).' }; }
    if(m) metinler.set(k, m); else metinler.delete(k);
    return { ok:true };
  }
  function metin(sahip){ return metinler.get(anahtar(sahip) + METIN) || null; }

  /* Bir önekin bütün fotoğrafları (ör. silinen bir denemenin). Döner: sayı. */
  async function onekSil(onek){
    await hazirla();
    if(!var_()) return 0;
    const on = anahtar(onek);
    const anahtarlar = ((await islem('readonly', s => s.getAllKeys())) || [])
      .filter(k => String(k).indexOf(on) === 0);
    if(anahtarlar.length) await islem('readwrite', s => { anahtarlar.forEach(k => s.delete(k)); });
    anahtarlar.forEach(k => { const u = adres.get(k); if(u) URL.revokeObjectURL(u); adres.delete(k); metinler.delete(k); });
    return anahtarlar.length;
  }

  /* Söz 7: defterde olmayan denemelerin en az SAHIPSIZ_GUN günlük kayıtları.
     varOlan: deneme kimlikleri. Döner: silinen kayıt sayısı. */
  async function sahipsizTemizle(varOlan, o){
    const opt = o || {};
    await hazirla();
    if(!var_()) return 0;
    const ids = new Set(varOlan || []);
    const sinir = (opt.simdi || Date.now()) - (opt.gun == null ? SAHIPSIZ_GUN : opt.gun) * 864e5;
    const on = anahtar('deneme:');
    const silinecek = ((await islem('readonly', s => s.getAll())) || []).filter(r => {
      if(!r || String(r.k).indexOf(on) !== 0) return false;
      const id = String(r.k).slice(on.length).split(':')[0];
      return !ids.has(id) && Date.parse(r.at || 0) < sinir;
    }).map(r => r.k);
    if(silinecek.length) await islem('readwrite', s => { silinecek.forEach(k => s.delete(k)); });
    silinecek.forEach(k => { const u = adres.get(k); if(u) URL.revokeObjectURL(u); adres.delete(k); metinler.delete(k); });
    return silinecek.length;
  }

  /* Bu profilin BÜTÜN fotoğrafları — «Bütün veriyi sil». */
  function temizle(){ return onekSil(''); }

  /* Testler için: bağlantıyı bırakır, belleği boşaltır. */
  function _sifirla(){
    if(db){ try{ db.close(); }catch(e){ /* kapalı */ } }
    adres.forEach(u => URL.revokeObjectURL(u));
    adres.clear();
    metinler.clear();
    db = null; hazir = null; yok = false;
  }

  return { hazirla, var:var_, url, kaydet, al, sil, metinKaydet, metin, onekSil, sahipsizTemizle, temizle, kucult,
    EN_UZUN, _ortam:ortam, _sifirla };
})();
