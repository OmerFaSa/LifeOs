/* Istek sinir yoneticisi — ucretsiz modellerin kotasi asilmaz.

   Ucretsiz saglayicilarin uc sinirı vardir ve ucu de asilirsa istek reddedilir:
     RPM  dakikada istek     (asilirsa 429; birkac saniye beklemek yeter)
     RPD  gunde istek        (asilirsa gun bitene kadar kapali; beklemek anlamsiz)
     TPM  dakikada jeton     (buyuk istemlerde binder; ofis istemleri kucuk)

   Bu modul iki sey yapar:

   1) ARALIK KOYAR. Ard arda gelen iki istek arasina en az 60000/RPM ms boşluk
      birakir. Boylece patlama (burst) hic olusmaz; toplanti da bu sayede
      "sirayla konusuluyor" ritmine kavusur.

   2) GUNU SAYAR. Gunluk sayac localStorage'da durur; sayfa yenilense de
      kaybolmaz. Gun dolduysa beklemek yerine acik bir hata dondurur.

   Sayaclar saglayici+model basina ayri tutulur: Groq'ta sinira takilmak
   Gemini'yi durdurmaz. */

window.R = window.R || {};

R.Quota = (function(){

  const STORE = 'rota.llm.quota';
  /* Saglayicinin bildirdigi sinirin tamami kullanilmaz: saat farki, ayni
     anahtarla acilmis baska sekme ve saglayicinin kendi yuvarlamasi icin pay. */
  const SAFETY = 0.85;
  /* Bir istegin kuyrukta bekleyebilecegi en uzun sure. Daha uzunu kullaniciyi
     bekletmek yerine acikca soylenir. */
  const MAX_WAIT_MS = 75000;

  /* ---------- kalici gunluk sayac ---------- */

  function todayKey(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function readStore(){
    try{
      const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
      if(raw.day !== todayKey()) return { day:todayKey(), used:{} };
      return { day:raw.day, used:raw.used || {} };
    }catch(e){ return { day:todayKey(), used:{} }; }
  }

  let daily = readStore();

  function persist(){
    try{ localStorage.setItem(STORE, JSON.stringify(daily)); }catch(e){}
  }

  function rollDay(){
    if(daily.day !== todayKey()){ daily = { day:todayKey(), used:{} }; persist(); }
  }

  /* ---------- dakikalik pencere (bellekte) ---------- */

  /* key -> { times:[ms], nextFreeAt:ms } */
  const minute = new Map();

  function bucket(key){
    if(!minute.has(key)) minute.set(key, { times:[], nextFreeAt:0 });
    return minute.get(key);
  }

  function prune(b, now){
    while(b.times.length && now - b.times[0] >= 60000) b.times.shift();
  }

  /* ---------- sinirlarin okunmasi ---------- */

  function key(cfg){ return (cfg && cfg.provider) + '|' + (cfg && cfg.model); }

  /* ---------- kullanici duzeltmesi ----------
     Gunluk hak hesaba bagli olabilir (OpenRouter'da kredi yuklediysen 50 yerine
     1000). Kullanici gercek sinirini ayarlardan yazar; katalog degismez. */

  const OVERRIDE_STORE = 'rota.llm.limits';

  function readOverrides(){
    try{ return JSON.parse(localStorage.getItem(OVERRIDE_STORE) || '{}'); }
    catch(e){ return {}; }
  }
  let overrides = readOverrides();

  function setOverride(providerId, patch){
    const next = Object.assign({}, overrides[providerId] || {});
    Object.keys(patch || {}).forEach(k => {
      const v = Number(patch[k]);
      if(Number.isFinite(v) && v > 0) next[k] = v; else delete next[k];
    });
    if(Object.keys(next).length) overrides[providerId] = next;
    else delete overrides[providerId];
    try{ localStorage.setItem(OVERRIDE_STORE, JSON.stringify(overrides)); }catch(e){}
    return next;
  }
  function getOverride(providerId){ return overrides[providerId] || {}; }
  function clearOverrides(){
    overrides = {};
    try{ localStorage.removeItem(OVERRIDE_STORE); }catch(e){}
  }

  /* Modelin kendi siniri yoksa saglayicinin varsayilanina duser;
     kullanici duzeltmesi ikisinin de ustundedir. */
  function limitsFor(cfg){
    const p = R.PROVIDERS[cfg && cfg.provider];
    if(!p) return null;
    const m = (p.models || []).find(x => x.id === cfg.model);
    const l = Object.assign({}, p.limits || {}, (m && m.limits) || {}, getOverride(p.id));
    if(l.rpm == null && l.rpd == null) return null;   // sinirsiz sayilir (yerlesik, ozel uc)
    return l;
  }

  /* Etkin sinirlar.

     Pay YALNIZ dakikalik sinira uygulanir: orada saatin kaymasi ve
     saglayicinin kendi yuvarlamasi bizi sinirin ustune tasiyabilir.

     Gunluk sayacta pay YOKTUR ve olmamalidir: bu bir zamanlama sorunu degil
     duz bir sayimdir; pay dusmek kullanicinin ucretsiz hakkinin bir kismini
     harcamadan curutur. Sayimimiz saglayicininkinden ancak DUSUK olabilir
     (baska bir sekme ayni anahtari kullaniyorsa); o durumda gercek 429 gelir
     ve penalize() devreye girer. */
  function effective(cfg){
    const l = limitsFor(cfg);
    if(!l) return null;
    const rpm = l.rpm ? Math.max(1, Math.floor(l.rpm * SAFETY)) : null;
    return {
      rpm,
      rpd: l.rpd || null,
      gapMs: rpm ? Math.ceil(60000 / rpm) : 0,
    };
  }

  /* ---------- sorgu ---------- */

  /* Simdi istek yapilsa ne olurdu: hemen mi, ne kadar bekleyerek mi, yoksa
     gun dolduğu icin hic mi? UI bunu cagirarak "3 sn sonra" yazabilir. */
  function check(cfg, now){
    const eff = effective(cfg);
    if(!eff) return { ok:true, waitMs:0, limited:false };

    const t = now == null ? Date.now() : now;
    rollDay();

    const k = key(cfg);
    const usedToday = daily.used[k] || 0;
    if(eff.rpd && usedToday >= eff.rpd){
      return { ok:false, reason:'daily', waitMs:0, limited:true, usedToday, rpd:eff.rpd };
    }

    const b = bucket(k);
    prune(b, t);

    let waitMs = Math.max(0, b.nextFreeAt - t);
    if(eff.rpm && b.times.length >= eff.rpm){
      waitMs = Math.max(waitMs, 60000 - (t - b.times[0]) + 50);
    }
    return { ok:waitMs === 0, waitMs, limited:waitMs > 0, usedToday, rpd:eff.rpd, rpm:eff.rpm };
  }

  /* ---------- ayirma ---------- */

  function sleep(ms, signal){
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { cleanup(); resolve(); }, ms);
      const onAbort = () => { cleanup(); reject(Object.assign(new Error('iptal'), { code:'cancelled' })); };
      function cleanup(){
        clearTimeout(timer);
        if(signal) signal.removeEventListener('abort', onAbort);
      }
      if(signal){
        if(signal.aborted){ cleanup(); reject(Object.assign(new Error('iptal'), { code:'cancelled' })); return; }
        signal.addEventListener('abort', onAbort);
      }
    });
  }

  /* Bir istek icin sira bekler ve yerini ayirir.
     opts.onWait(ms) beklemeden once cagirilir; ekran "3 sn" yazabilir.
     Gun dolduysa beklemez, 'daily_quota' hatasi atar. */
  async function acquire(cfg, opts){
    const o = opts || {};
    const eff = effective(cfg);
    if(!eff){ return { waited:0 }; }

    const state = check(cfg);
    if(!state.ok && state.reason === 'daily'){
      throw Object.assign(new Error('gunluk kota doldu'), {
        code:'daily_quota', usedToday:state.usedToday, rpd:state.rpd,
      });
    }
    if(state.waitMs > MAX_WAIT_MS){
      throw Object.assign(new Error('sira cok uzun'), {
        code:'rate_wait', waitMs:state.waitMs,
      });
    }

    if(state.waitMs > 0){
      if(o.onWait) o.onWait(state.waitMs);
      await sleep(state.waitMs, o.signal);
    }

    /* Yeri simdi ayir: ayni anda baslayan iki cagri ayni yuvayi kapmasin. */
    const now = Date.now();
    const k = key(cfg);
    const b = bucket(k);
    prune(b, now);
    b.times.push(now);
    b.nextFreeAt = now + eff.gapMs;
    daily.used[k] = (daily.used[k] || 0) + 1;
    persist();

    return { waited:state.waitMs, usedToday:daily.used[k], rpd:eff.rpd };
  }

  /* Saglayici yine de 429 dondurduyse: sayilan sinir gercekte daha dusuk.
     Pencereyi doldur ve bir sonraki denemeyi bir sonraki dakikaya at. */
  function penalize(cfg, seconds){
    const eff = effective(cfg);
    if(!eff) return;
    const b = bucket(key(cfg));
    const now = Date.now();
    b.nextFreeAt = Math.max(b.nextFreeAt, now + (seconds ? seconds*1000 : 60000));
  }

  /* Basarisiz istek gunluk kotadan dusulmez mi? OpenRouter'da DUSULUR:
     429 alan istek de gunu tuketir. Bu yuzden acquire'da sayilir ve
     burada geri alinmaz. Yalniz istek hic gonderilmediyse geri alinir. */
  function release(cfg){
    const k = key(cfg);
    if(daily.used[k]) { daily.used[k]--; persist(); }
    const b = bucket(k);
    if(b.times.length) b.times.pop();
  }

  /* ---------- ekran icin ozet ---------- */

  function status(cfg){
    const eff = effective(cfg);
    const k = key(cfg);
    rollDay();
    const usedToday = daily.used[k] || 0;
    if(!eff) return { known:false, usedToday };
    const b = bucket(k);
    prune(b, Date.now());
    return {
      known:true,
      rpm:eff.rpm, rpd:eff.rpd, gapMs:eff.gapMs,
      lastMinute:b.times.length,
      usedToday,
      remainingToday:eff.rpd ? Math.max(0, eff.rpd - usedToday) : null,
      full:!!(eff.rpd && usedToday >= eff.rpd),
    };
  }

  /* Bir dizi cagri (ornegin toplanti) kac saniye surer? */
  function estimateMs(cfg, calls){
    const eff = effective(cfg);
    if(!eff || !eff.gapMs) return 0;
    return Math.max(0, (calls - 1)) * eff.gapMs;
  }

  function reset(){
    minute.clear();
    daily = { day:todayKey(), used:{} };
    persist();
    overrides = readOverrides();
  }

  return { acquire, release, penalize, check, status, estimateMs, effective, limitsFor, reset,
    setOverride, getOverride, clearOverrides,
    SAFETY, MAX_WAIT_MS, STORE, OVERRIDE_STORE };
})();
