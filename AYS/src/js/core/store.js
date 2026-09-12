/* Kalici depolama.
   Once Artifact "db" yetenegi denenir (cihazlar arasi), yoksa localStorage'a duser.
   Her iki durumda da yerel kopya tutulur; boylece cevrimdisi calisir.
   Hatalar yutulmaz: onError kancasi uzerinden arayuze bildirilir. */

window.R = window.R || {};

R.SCHEMA_VERSION = 5;

R.Store = (function(){
  /* Cok kullanicili kullanim: her profil kendi anahtarinda durur.
     'main' geriye donuk uyum icin eski anahtari kullanmaya devam eder. */
  function activeProfile(){
    try{ return localStorage.getItem('rota.activeProfile') || 'main'; }
    catch(e){ return 'main'; }
  }
  const PROFILE = activeProfile();
  const LOCAL_KEY = PROFILE === 'main' ? 'rota84285.v2' : 'rota84285.v2.' + PROFILE;
  let db = null;
  let mode = 'local';

  const health = {
    cloud:'off',        // 'off' | 'ok' | 'error'
    local:'ok',         // 'ok' | 'error'
    lastError:null,     // { scope, code, message, at }
    pendingCloudWrites:0,
  };

  let onError = null;   // app.js tarafindan baglanir

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

  function localAll(){
    try{ return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'); }
    catch(e){
      report('local-read', e, 'Yerel kayıt okunamadı; veriler geçici olarak bellekte tutuluyor.');
      health.local = 'error';
      return {};
    }
  }
  function localWrite(all){
    try{
      localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
      if(health.local === 'error'){ health.local = 'ok'; }
      return true;
    }catch(e){
      health.local = 'error';
      report('local-write', e, isQuotaError(e)
        ? 'Tarayıcı depolama alanı doldu. Ayarlar → Veri bölümünden yedek alıp eski kayıtları temizle.'
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
        rows.forEach(r => lSet(collection+'/'+r.id, r));
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

  function exportAll(){
    return {
      __meta:{
        app:'rota-84285',
        schemaVersion:R.SCHEMA_VERSION,
        exportedAt:new Date().toISOString(),
        mode,
      },
      data:localAll(),
    };
  }

  /* Hem yeni ({__meta,data}) hem eski (duz sozluk) bicimi kabul eder. */
  function readBackup(obj){
    if(!obj || typeof obj !== 'object') return { ok:false, error:'Dosya okunamadı.' };
    if(obj.__meta && obj.data){
      if(obj.__meta.schemaVersion > R.SCHEMA_VERSION){
        return { ok:false, error:'Bu yedek daha yeni bir sürümle alınmış (şema '+obj.__meta.schemaVersion+'). Önce uygulamayı güncelle.' };
      }
      return { ok:true, data:obj.data, meta:obj.__meta };
    }
    const keys = Object.keys(obj);
    const looksLegacy = keys.some(k => k.indexOf('/') > 0);
    if(!looksLegacy) return { ok:false, error:'Bu dosya bir Rota yedeği değil.' };
    return { ok:true, data:obj, meta:{ schemaVersion:1, legacy:true } };
  }

  async function importAll(obj){
    const parsed = readBackup(obj);
    if(!parsed.ok) throw new Error(parsed.error);
    localWrite(parsed.data);
    if(db){
      for(const k of Object.keys(parsed.data)){
        try{ await db.doc(k).set(parsed.data[k]); }
        catch(e){ health.cloud = 'error'; }
      }
    }
    return parsed.meta;
  }

  async function clear(){
    const all = localAll();
    try{ localStorage.removeItem(LOCAL_KEY); }catch(e){}
    if(db){
      for(const k of Object.keys(all)){
        try{ await db.doc(k).delete(); }catch(e){}
      }
    }
  }

  /* Kabaca kullanilan yerel alan (byte) */
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
    exportAll, importAll, readBackup, clear, localSize, localQuota,
    health(){ return Object.assign({ mode }, health); },
    set onError(fn){ onError = fn; },
    get mode(){ return mode; },
  };
})();
