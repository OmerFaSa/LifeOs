/* Sifir bagimlilikli test kosucusu.
   Node gerektirmez; tarayicida calisir ve sonucu window.__SPI_TESTS__ uzerinden verir. */

window.SP = window.SP || {};

SP.Test = (function(){
  const suites = [];
  let current = null;

  function describe(name, fn){
    const prev = current;
    current = { name, tests:[], parent:prev };
    suites.push(current);
    fn();
    current = prev;
  }

  function it(name, fn){
    if(!current) throw new Error('it() describe() icinde cagrilmali');
    current.tests.push({ name, fn });
  }

  function fmt(v){
    if(v === undefined) return 'undefined';
    if(v === null) return 'null';
    if(typeof v === 'string') return '"'+v+'"';
    if(typeof v === 'object'){
      try{ return JSON.stringify(v); }catch(e){ return String(v); }
    }
    return String(v);
  }

  function deepEqual(a, b){
    if(a === b) return true;
    if(a === null || b === null || typeof a !== typeof b) return false;
    if(typeof a !== 'object') return Number.isNaN(a) && Number.isNaN(b);
    if(Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a), kb = Object.keys(b);
    if(ka.length !== kb.length) return false;
    return ka.every(k => deepEqual(a[k], b[k]));
  }

  function expect(actual){
    return {
      toBe(exp){
        if(actual !== exp) throw new Error('beklenen '+fmt(exp)+', gelen '+fmt(actual));
      },
      toEqual(exp){
        if(!deepEqual(actual, exp)) throw new Error('beklenen '+fmt(exp)+', gelen '+fmt(actual));
      },
      toBeCloseTo(exp, digits){
        const d = digits == null ? 2 : digits;
        if(actual == null || Math.abs(actual-exp) > Math.pow(10,-d)/2){
          throw new Error('beklenen ~'+fmt(exp)+', gelen '+fmt(actual));
        }
      },
      toBeNull(){
        if(actual !== null) throw new Error('null bekleniyordu, gelen '+fmt(actual));
      },
      toBeUndefined(){
        if(actual !== undefined) throw new Error('undefined bekleniyordu, gelen '+fmt(actual));
      },
      toBeTruthy(){
        if(!actual) throw new Error('dogru (truthy) bekleniyordu, gelen '+fmt(actual));
      },
      toBeFalsy(){
        if(actual) throw new Error('yanlis (falsy) bekleniyordu, gelen '+fmt(actual));
      },
      toBeGreaterThan(n){
        if(!(actual > n)) throw new Error(fmt(actual)+' > '+fmt(n)+' bekleniyordu');
      },
      toBeLessThan(n){
        if(!(actual < n)) throw new Error(fmt(actual)+' < '+fmt(n)+' bekleniyordu');
      },
      toHaveLength(n){
        const len = actual == null ? -1 : actual.length;
        if(len !== n) throw new Error('uzunluk '+n+' bekleniyordu, gelen '+len);
      },
      toContain(x){
        const ok = actual && (typeof actual.indexOf === 'function') && actual.indexOf(x) >= 0;
        if(!ok) throw new Error(fmt(actual)+' icinde '+fmt(x)+' bekleniyordu');
      },
    };
  }

  async function run(){
    const results = [];
    let passed = 0, failed = 0;
    for(const suite of suites){
      for(const test of suite.tests){
        try{
          await test.fn();
          results.push({ suite:suite.name, name:test.name, ok:true });
          passed++;
        }catch(err){
          results.push({ suite:suite.name, name:test.name, ok:false, error:err && err.message ? err.message : String(err) });
          failed++;
        }
      }
    }
    const summary = { passed, failed, total:passed+failed, results };
    window.__SPI_TESTS__ = summary;
    return summary;
  }

  /* ---------- test yardimcilari ---------- */

  /* Bellek ici sahte depo — Model fonksiyonlari icin */
  function mockStore(){
    const data = {};
    return {
      mode:'test',
      async init(){ return 'test'; },
      async get(path){ return data[path] === undefined ? null : JSON.parse(JSON.stringify(data[path])); },
      async set(path, value){ data[path] = JSON.parse(JSON.stringify(value)); },
      async remove(path){ delete data[path]; },
      async list(prefix){
        const p = prefix.endsWith('/') ? prefix : prefix+'/';
        return Object.keys(data)
          .filter(k => k.indexOf(p) === 0 && k.slice(p.length).indexOf('/') === -1)
          .map(k => Object.assign({ id:k.slice(p.length) }, JSON.parse(JSON.stringify(data[k]))));
      },
      exportAll(){ return JSON.parse(JSON.stringify(data)); },
      async importAll(obj){ Object.keys(data).forEach(k => delete data[k]); Object.assign(data, obj); },
      async clear(){ Object.keys(data).forEach(k => delete data[k]); },
      /* Gercek depoyla ayni yuzey: ekranlar boyut/kota okuyabilmeli. */
      localSize(){ return JSON.stringify(data).length; },
      localQuota(){
        const limit = 5*1024*1024;
        const pct = Math.min(100, Math.round(100*this.localSize()/limit));
        return { bytes:this.localSize(), limit, pct, near:pct >= 75, full:pct >= 92 };
      },
      _data:data,
    };
  }

  /* resetState() SP.Store'u sahte depoyla degistirir; gercek modulun saf
     fonksiyonlarini (readBackup, exportAll) test edebilmek icin referansini sakla. */
  const realStore = SP.Store;

  /* Testler arasinda temiz durum. Profil bilerek TAM doldurulur: cogu hesap
     (kalori, protein, referans araligi) profil olmadan hic calismaz ve
     testlerin her birinde ayni profili kurmak gurultu yaratirdi. */
  function testProfile(){
    return {
      id:'test', name:'Test', role:'self',
      birthYear:new Date().getFullYear() - 30,
      sex:'male', heightCm:178, weightKg:78,
      activity:'moderate', goal:'health',
      conditions:[], theme:'system', palette:SP.DEFAULT_PALETTE,
      createdAt:new Date().toISOString(),
    };
  }

  function resetState(){
    const S = SP.S;
    S.route = 'today';
    S.profile = testProfile();
    S.profiles = [];
    S.prefs = SP.Model.defaultPrefs();
    S.labs = []; S.vitals = {}; S.meals = {}; S.workouts = []; S.progress = {};
    S.basket = SP.Model.defaultBasket();
    S.prices = {}; S.flags = []; S.decisions = [];
    S.office = null; S.officeChats = {}; S.officeMeetings = []; S.officeBriefings = {}; S.journal = {};
    S.meta = { schemaVersion:SP.SCHEMA_VERSION, lastBackupAt:null };
    S.storeHealth = null;
    S.ui = {
      railOpen:false, labTab:'panel', labPanel:'vital', labOpen:null, markerOpen:null,
      mealDate:null, mealSlot:'kahvalti', foodQuery:'', foodCat:'all', foodPage:1,
      kitchenDish:null, kitchenGrams:1000,
      moveTab:'bugun', movePattern:'all', workoutOpen:null,
      basketTab:'sepet', priceEdit:null,
      trendMarker:'weight', trendRange:90, analyticsTab:'capraz',
      officeAgent:'patron', officeDesk:null, officePerAgent:false,
      meetingAgenda:0, meetingOpen:null, guideTab:'kullanim',
      profileOpen:null, quickOpen:false,
    };
    SP.Store = mockStore();
  }

  /* Sabit bir "bugun" degeri ile calis */
  function withToday(iso, fn){
    const U = SP.U;
    const realToday = U.today, realTodayISO = U.todayISO;
    const d = U.parse(iso);
    U.today = () => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    U.todayISO = () => iso;
    try{ return fn(); }
    finally{ U.today = realToday; U.todayISO = realTodayISO; }
  }
  async function withTodayAsync(iso, fn){
    const U = SP.U;
    const realToday = U.today, realTodayISO = U.todayISO;
    const d = U.parse(iso);
    U.today = () => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    U.todayISO = () => iso;
    try{ return await fn(); }
    finally{ U.today = realToday; U.todayISO = realTodayISO; }
  }

  /* ---------- fabrikalar ---------- */

  /* Tahlil oturumu: makeLab('2026-01-10', { ferritin:22, hgb:13.1 }) */
  function makeLab(dateISO, values){
    const rec = SP.Model.newLab(dateISO);
    Object.keys(values || {}).forEach(k => {
      rec.values[k] = { v:values[k], cert:'measured' };
    });
    return SP.Model.applyDerived(rec);
  }

  /* Tahlili dogrudan duruma yazar (depo cagrisi yapmadan). */
  function pushLab(dateISO, values){
    const rec = makeLab(dateISO, values);
    SP.S.labs.push(rec);
    SP.S.labs.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    return rec;
  }

  /* Gunluk olcum */
  function pushVitals(dateISO, patch){
    SP.S.vitals[dateISO] = Object.assign(SP.Model.defaultVitals(dateISO), patch || {});
    return SP.S.vitals[dateISO];
  }

  /* Ogun: pushMeal('2026-01-10', 'ogle', [['mercimek-corbasi', 250]]) */
  function pushMeal(dateISO, slot, items){
    const meal = SP.Model.newMeal(slot);
    meal.items = (items || []).map(x => ({ foodId:x[0], g:x[1], cert:x[2] || 'estimated' }));
    SP.S.meals[dateISO] = (SP.S.meals[dateISO] || []).concat([meal]);
    return meal;
  }

  /* Antrenman */
  function pushWorkout(dateISO, opts){
    const o = opts || {};
    const rec = {
      id:SP.U.uid('w'), date:dateISO,
      templateId:o.templateId || null, name:o.name || 'Test seansı',
      kind:o.kind || 'strength',
      items:(o.items || []).map(id => ({ exId:id, levelId:SP.Model.currentLevel(id) })),
      minutes:o.minutes == null ? 45 : o.minutes,
      rpe:o.rpe == null ? 6 : o.rpe,
      note:'', createdAt:new Date().toISOString(),
    };
    SP.S.workouts.push(rec);
    SP.S.workouts.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    return rec;
  }

  return { describe, it, expect, run, mockStore, resetState, testProfile,
    withToday, withTodayAsync, makeLab, pushLab, pushVitals, pushMeal, pushWorkout,
    suites, realStore };
})();
