/* Kalici depolama.
   Once Artifact "db" yetenegi denenir (cihazlar arasi), yoksa localStorage'a duser.
   Her iki durumda da yerel kopya tutulur; boylece cevrimdisi calisir.
   Hatalar yutulmaz: onError kancasi uzerinden arayuze bildirilir. */

window.ESP = window.ESP || {};

ESP.SCHEMA_VERSION = 1;

ESP.Store = (function(){
  /* Hane halki: her profil kendi anahtarinda durur. Tahlil ve olcum verisi
     profiller arasinda karismaz; 'ben' varsayilan birincil profildir. */
  function activeProfile(){
    try{ return localStorage.getItem('esp.activeProfile') || 'ben'; }
    catch(e){ return 'ben'; }
  }
  const PROFILE = activeProfile();
  /* Yedegin kimligi — disa aktarirken yazilir, geri yuklerken ARANIR.
     Iki yerde ayri ayri yazilan bir kimlik, bir gun ayrisir. */
  const APP_ID = 'esp-entelektuel';

  const LOCAL_KEY = 'esp.v1.' + PROFILE;
  /* Yedekten yukleme ONCESI durumun tek yuvalik kopyasi. LOCAL_KEY'in
     GOVDESINE degil, AYRI bir anahtara yazilir: importAll o anahtari
     ezmedigi icin geri alma imkani import'un kendisinden hayatta kalir. */
  const UNDO_KEY = LOCAL_KEY + '.oncesi';
  let db = null;
  let mode = 'local';

  const health = {
    cloud:'off',        // 'off' | 'ok' | 'error'
    local:'ok',         // 'ok' | 'error'
    lastError:null,     // { scope, code, message, at }
    pendingCloudWrites:0,
  };

  let onError = null;   // app.js tarafindan baglanir
  let onExternalWrite = null;   // app.js tarafindan baglanir

  function report(scope, err, userMessage){
    const code = (err && err.code) || (err && err.name) || 'unknown';
    health.lastError = {
      scope, code,
      message: userMessage || (err && err.message) || String(err),
      at: new Date().toISOString(),
    };
    console.error('[Store:'+scope+']', err);
    if(typeof onError === 'function'){
      try{ onError(health.lastError, health); }catch(e){}
    }
  }

  function isQuotaError(e){
    if(!e) return false;
    return e.name === 'QuotaExceededError'
      || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      || e.code === 22 || e.code === 1014
      || /quota|storage.*full/i.test(e.message || '');
  }

  /* ---------- ayrıştırılmış kopya ----------

     HER YAZMA TÜM DEPOYU AYRIŞTIRIYORDU. `lSet` önce `localAll()` ile
     bütün kaydı JSON'dan çözüyor, tek anahtarı değiştirip yeniden
     serileştiriyordu; yani bir ölçüm girmenin maliyeti, o güne kadar
     girilmiş HER ŞEYİN boyutuyla büyüyordu.

     Ölçüldü: 50 kayıtta yazma başına 0,17 ms, 1000 kayıtta 5,00 ms —
     yirmi dokuz kat. Dokuz aylık kullanımda (günde ~10 kayıt) her
     dokunuş fark edilir bir gecikmeye dönüşürdü.

     Çözüm ayrıştırılmış kopyayı bellekte tutmaktır. Serileştirme
     KALIR — yazma yine anında diske iner, ertelenmez. Ertelenen bir
     yazma, sekmesini kapatan kullanıcının verisini kaybeder ve burası
     verinin kaybolabileceği tek yerdir; hız için o riski almayız.

     Kopya BAŞKA BİR SEKME yazdığında geçersizleşir: `storage` olayı
     yalnızca diğer sekmelerde tetiklenir, tam da bize gereken şey. */
  let kopya = null;

  function localAll(){
    if(kopya) return kopya;
    try{
      kopya = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
      return kopya;
    }catch(e){
      report('local-read', e, 'Yerel kayıt okunamadı; veriler geçici olarak bellekte tutuluyor.');
      health.local = 'error';
      kopya = {};
      return kopya;
    }
  }

  /* Başka sekme yazdıysa bellekteki kopya eskimiştir.

     ÖNCE YALNIZ `kopya` (ayrıştırılmış ham JSON önbelleği) sıfırlanıyordu.
     Uygulamanın BELLEKTEKİ modeli (`S.days`, `S.cards` vb.) bu satırdan
     habersizdir — o modeli dolduran `Model.loadAll()` yalnızca açılışta
     çalışır. İki sekme aynı günü/kartı düzenlerse: B sekmesi yazar, A
     sekmesinin belleği BAYAT KALIR; A daha sonra kaydettiğinde B'nin
     yazdığı hiçbir yerde söylenmeden kaybolur.

     Tam bir birleştirme bu katmanda YAPILMAZ: hangi alanın kazanacağına
     bu dosya karar veremez, üstelik kullanıcı A sekmesinde yarım kalmış
     bir form dolduruyor olabilir — otomatik yeniden yükleme onu da
     silebilir. Ama sessizce ezilmesi de kabul edilebilir değil; bu yüzden
     `onExternalWrite` app.js'te bir uyarıya bağlanır ve kullanıcı
     kendi kararını verir (sayfayı tazele ya da göz ardı et). */
  try{
    window.addEventListener('storage', e => {
      if(!e || e.key === null || e.key === LOCAL_KEY){
        kopya = null;
        if(typeof onExternalWrite === 'function'){
          try{ onExternalWrite(); }catch(err){}
        }
      }
    });
  }catch(e){ /* olay bağlanamadıysa kopya yalnız bu sekmede yaşar */ }
  function localWrite(all){
    kopya = all;
    try{
      localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
      if(health.local === 'error'){ health.local = 'ok'; }
      return true;
    }catch(e){
      health.local = 'error';
      report('local-write', e, isQuotaError(e)
        ? 'Tarayıcı depolama alanı doldu. Ayarlar → Rehber → Veri bölümünden yedek alıp eski kayıtları temizle.'
        : 'Değişiklik bu cihaza kaydedilemedi.');
      return false;
    }
  }

  function lGet(path){
    const all = localAll();
    return all[path] === undefined ? null : all[path];
  }
  function lSet(path, data){
    const all = localAll();
    all[path] = data;
    return localWrite(all);
  }
  function lDel(path){
    const all = localAll();
    delete all[path];
    localWrite(all);
  }
  /* Birden çok yolu TEK yazmayla kaydeder.

     Bulut listesi geldiğinde her satır ayrı ayrı `lSet` ile yazılıyordu:
     yüz kayıtlık bir koleksiyon, yüz kez tam serileştirme demekti. */
  function lSetMany(pairs){
    if(!pairs.length) return true;
    const all = localAll();
    pairs.forEach(([path, data]) => { all[path] = data; });
    return localWrite(all);
  }

  function lList(prefix){
    const all = localAll();
    const p = prefix.endsWith('/') ? prefix : prefix + '/';
    const out = [];
    Object.keys(all).forEach(k => {
      if(k.indexOf(p) === 0){
        const rest = k.slice(p.length);
        if(rest && rest.indexOf('/') === -1) out.push(Object.assign({ id:rest }, all[k]));
      }
    });
    return out;
  }

  async function init(){
    try{
      if(window.claude && typeof window.claude.use === 'function'){
        const api = await window.claude.use('db');
        if(api){ db = api; mode = 'cloud'; health.cloud = 'ok'; }
      }
    }catch(e){
      db = null;
      health.cloud = 'error';
      report('cloud-init', e, 'Hesaba bağlı senkronizasyon açılamadı; uygulama bu cihazda çalışmaya devam ediyor.');
    }
    return mode;
  }

  async function get(path){
    if(db){
      try{
        const snap = await db.doc(path).get();
        health.cloud = 'ok';
        if(snap.exists){
          const data = snap.data();
          lSet(path, data);
          return data;
        }
        return lGet(path);
      }catch(e){
        health.cloud = 'error';
        report('cloud-read', e, 'Buluttan okunamadı; bu cihazdaki kopya kullanılıyor.');
        return lGet(path);
      }
    }
    return lGet(path);
  }

  async function set(path, data){
    const localOk = lSet(path, data);
    if(db){
      health.pendingCloudWrites++;
      try{
        await db.doc(path).set(data);
        health.cloud = 'ok';
      }catch(e){
        health.cloud = 'error';
        report('cloud-write', e, localOk
          ? 'Değişiklik bu cihaza kaydedildi ama buluta gönderilemedi. Bağlantı gelince tekrar dene.'
          : 'Değişiklik kaydedilemedi.');
      }finally{
        health.pendingCloudWrites--;
      }
    }
    return localOk;
  }

  async function remove(path){
    lDel(path);
    if(db){
      try{ await db.doc(path).delete(); }
      catch(e){
        health.cloud = 'error';
        report('cloud-delete', e, 'Kayıt buluttan silinemedi.');
      }
    }
  }

  async function list(collection){
    if(db){
      try{
        const snap = await db.collection(collection).get();
        health.cloud = 'ok';
        const rows = snap.docs.map(d => Object.assign({ id:d.id }, d.data()));
        lSetMany(rows.map(r => [collection+'/'+r.id, r]));
        if(rows.length) return rows;
        return lList(collection);
      }catch(e){
        health.cloud = 'error';
        report('cloud-list', e, 'Bulut verisi okunamadı; bu cihazdaki kopya kullanılıyor.');
        return lList(collection);
      }
    }
    return lList(collection);
  }

  /* ---------- yedekleme ---------- */

  /* CIHAZA AIT anahtarlar yedege girmez, yedekten de gelmez.

     `hkm`: HKM adresi, acik/kapali durumu ve Bearer JETONU. Yedek
     dosyasi e-postaya, buluta, baska bir diske gider; jeton oraya duz
     metin girmemeli. Geri yukleme de baska bir cihazin (ya da eski bir
     donemin) «acik» ayarini sormadan geri getirmemeli: bu cihazin
     ayari neyse o kalir, hic kurulmamissa kurulmamis kalir. */
  const CIHAZA_AIT = ['hkm'];
  function cihazsiz(data){
    const out = Object.assign({}, data);
    CIHAZA_AIT.forEach(k => { delete out[k]; });
    return out;
  }

  function exportAll(){
    return {
      __meta:{
        app:APP_ID,
        schemaVersion:ESP.SCHEMA_VERSION,
        exportedAt:new Date().toISOString(),
        mode,
      },
      data:cihazsiz(localAll()),
    };
  }

  /* Hem yeni ({__meta,data}) hem eski (duz sozluk) bicimi kabul eder. */
  function readBackup(obj){
    if(!obj || typeof obj !== 'object') return { ok:false, error:'Dosya okunamadı.' };
    if(obj.__meta && obj.data){
      /* UYGULAMA KIMLIGI once denetlenir. Yalniz sema surumune bakan bir
         okuma, baska bir LifeOS uygulamasinin yedegini kabul ediyordu:
         dosya secicide yanlis dosyayi secmek, profil verisinin baska bir
         uygulamanin verisiyle degismesi demekti. */
      if(obj.__meta.app && obj.__meta.app !== APP_ID){
        return { ok:false, error:'Bu yedek başka bir uygulamadan («'
          + String(obj.__meta.app).slice(0, 32) + '»). ESP yedeği gerekir.' };
      }
      if(typeof obj.data !== 'object' || Array.isArray(obj.data)){
        return { ok:false, error:'Yedek gövdesi okunamadı.' };
      }
      if(obj.__meta.schemaVersion > ESP.SCHEMA_VERSION){
        return { ok:false, error:'Bu yedek daha yeni bir sürümle alınmış (şema '+obj.__meta.schemaVersion+'). Önce uygulamayı güncelle.' };
      }
      return { ok:true, data:obj.data, meta:obj.__meta };
    }
    const keys = Object.keys(obj);
    const looksLegacy = keys.some(k => k.indexOf('/') > 0);
    if(!looksLegacy) return { ok:false, error:'Bu dosya bir ESP yedeği değil.' };
    return { ok:true, data:obj, meta:{ schemaVersion:1, legacy:true } };
  }

  async function importAll(obj){
    const parsed = readBackup(obj);
    if(!parsed.ok) throw new Error(parsed.error);

    /* USTUNE YAZMADAN ONCE tek yuvalik bir geri donus kopyasi birakilir.
       Dosya secicide YANLIS AMA GECERLI bir yedek secmek — baska bir
       profilin ya da eski bir donemin yedegi — bu depodaki geri donussuz
       tek islemdi. Yazma basarisiz olursa (kota dolu) geri alma imkani
       sessizce kaybolur ama import yine de denenir: hic geri alamamak,
       hic import edememekten daha az kotudur. */
    try{
      localStorage.setItem(UNDO_KEY, JSON.stringify({ at:new Date().toISOString(), data:localAll() }));
    }catch(e){ /* kota dolu olabilir — asagidaki import denemesi engellenmez */ }

    /* YAZMA SONUCU DEGERLENDIRILIR. Once localWrite()'in donusu
       yutuluyordu: kota dolu bir tarayicida hicbir sey yazilmadigi halde
       cagri normal bitiyor, ekran «Yedek yuklendi» diyordu. Basarisiz bir
       kaydi basari gibi gostermek, bu depodaki en pahali hata tipidir. */
    const mevcut = localAll();
    const veri = cihazsiz(parsed.data);
    CIHAZA_AIT.forEach(k => { if(mevcut[k] !== undefined) veri[k] = mevcut[k]; });
    const yerel = localWrite(veri);
    if(!yerel){
      const e = new Error('Yedek bu cihaza yazılamadı; mevcut kayıt '
        + 'korundu. Depolama alanı dolu olabilir: Ayarlar → Veri '
        + 'bölümünden yer aç, sonra tekrar dene.');
      e.code = 'local-write';
      throw e;
    }

    /* Buluta KISMI yazma ayrica raporlanir: «tamamlandi» izlenimi
       verilmez. */
    let bulutYazilan = 0, bulutHata = 0;
    if(db){
      for(const k of Object.keys(veri)){
        try{ await db.doc(k).set(veri[k]); bulutYazilan++; }
        catch(e){ bulutHata++; health.cloud = 'error'; }
      }
    }
    return Object.assign({}, parsed.meta, {
      local:true, cloudWritten:bulutYazilan, cloudFailed:bulutHata,
      partialCloud:bulutHata > 0,
    });
  }

  /* En son ice aktarmadan ONCEKI duruma dair bilgi — «geri al» dugmesinin
     gorunup gorunmeyecegine bu karar verir. Icerigin kendisini degil,
     yalniz ne zaman alindigini dondurur. */
  function importUndoInfo(){
    try{
      const raw = localStorage.getItem(UNDO_KEY);
      if(!raw) return null;
      const parsed = JSON.parse(raw);
      return { at:parsed.at };
    }catch(e){ return null; }
  }

  /* Son ice aktarmayi geri alir. TEK YUVALIDIR: bir kez kullanilinca
     yuva bosalir — ikinci bir «geri al» ilk ice aktarmadan ONCEKI
     duruma degil, geri alinmis duruma doner, bu da kafa karistirir. */
  async function undoImport(){
    let raw;
    try{ raw = localStorage.getItem(UNDO_KEY); }
    catch(e){ throw new Error('Geri alma kaydı okunamadı.'); }
    if(!raw) throw new Error('Geri alınacak bir içe aktarma yok.');
    let parsed;
    try{ parsed = JSON.parse(raw); }
    catch(e){ throw new Error('Geri alma kaydı bozuk.'); }

    const yerel = localWrite(parsed.data);
    if(!yerel){
      const e = new Error('Geri alma bu cihaza yazılamadı. Depolama alanı dolu olabilir.');
      e.code = 'local-write';
      throw e;
    }
    try{ localStorage.removeItem(UNDO_KEY); }catch(e){}

    let bulutYazilan = 0, bulutHata = 0;
    if(db){
      for(const k of Object.keys(parsed.data)){
        try{ await db.doc(k).set(parsed.data[k]); bulutYazilan++; }
        catch(e){ bulutHata++; health.cloud = 'error'; }
      }
    }
    return { local:true, cloudWritten:bulutYazilan, cloudFailed:bulutHata, partialCloud:bulutHata > 0 };
  }

  async function clear(){
    const all = localAll();
    kopya = {};
    try{ localStorage.removeItem(LOCAL_KEY); }catch(e){}
    if(db){
      for(const k of Object.keys(all)){
        try{ await db.doc(k).delete(); }catch(e){}
      }
    }
  }

  /* Kabaca kullanilan yerel alan (byte) */

  /* Koleksiyon basina boyut — "depo dolmus" uyarisi tek basina ise
     yaramaz; NEYIN buyudugunu bilmek gerekir.

     Yol semasi "koleksiyon/kimlik" ya da tek parcali ("meta", "prefs").
     Tek parcalilar kendi adlariyla sayilir. */
  function sizeByCollection(){
    const all = localAll();
    const out = {};
    Object.keys(all).forEach(function(k){
      const kok = k.indexOf('/') > 0 ? k.slice(0, k.indexOf('/')) : k;
      let n = 0;
      try{ n = JSON.stringify(all[k]).length; }catch(e){ n = 0; }
      if(!out[kok]) out[kok] = { collection:kok, bytes:0, count:0 };
      out[kok].bytes += n + k.length + 4;   /* anahtar ve ayraclar da yer kaplar */
      out[kok].count += 1;
    });
    return Object.keys(out).map(function(k){ return out[k]; })
      .sort(function(a, b){ return b.bytes - a.bytes; });
  }

  function localSize(){
    try{ return (localStorage.getItem(LOCAL_KEY) || '').length; }
    catch(e){ return 0; }
  }

  /* Tarayicilarin localStorage siniri genelde ~5 MB'tir (kaynak basina).
     Kesin deger okunamaz; bu yuzden 5 MB varsayilip doluluk yuzdesi tahmin edilir.
     %75 uzerinde kullaniciyi uyarmak icin `near` isaretlenir. */
  const LOCAL_QUOTA = 5 * 1024 * 1024;
  function localQuota(){
    const bytes = localSize();
    const pct = Math.min(100, Math.round(100*bytes/LOCAL_QUOTA));
    return { bytes, limit:LOCAL_QUOTA, pct, near:pct >= 75, full:pct >= 92 };
  }

  return {
    init, get, set, remove, list,
    /* Aktif profilin kimligi. state.js varsayilan profili kurarken buna
       ihtiyac duyar; depo anahtarini uretmis olan katman soylesin diye
       disari acilir. */
    activeProfileId(){ return PROFILE; },
    exportAll, importAll, readBackup, importUndoInfo, undoImport, clear, localSize, localQuota, sizeByCollection,
    health(){ return Object.assign({ mode }, health); },
    set onError(fn){ onError = fn; },
    set onExternalWrite(fn){ onExternalWrite = fn; },
    get mode(){ return mode; },
  };
})();
