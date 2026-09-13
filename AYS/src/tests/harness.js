/* Sifir bagimlilikli test kosucusu.
   Node gerektirmez; tarayicida calisir ve sonucu window.__ROTA_TESTS__ uzerinden verir. */

window.R = window.R || {};

R.Test = (function(){
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
    window.__ROTA_TESTS__ = summary;
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

  /* resetState() R.Store'u sahte depoyla degistirir; gercek modulun saf
     fonksiyonlarini (readBackup, exportAll) test edebilmek icin referansini sakla. */
  const realStore = R.Store;

  /* Testler arasinda temiz state */
  function resetState(){
    const S = R.S;
    S.route = 'today';
    S.profile = R.Model.defaultProfile();
    S.weeks = {}; S.days = {}; S.reviews = {}; S.decisions = {}; S.topics = {};
    S.exams = []; S.errors = []; S.cards = []; S.protocols = [];
    S.prefs = R.Model.defaultPrefs();
    S.videoNotes = []; S.activities = []; S.mood = {}; S.breaks = []; S.plan = null;
    S.calendar = []; S.sessions = []; S.profiles = [];
    S.usage = null; S.forecasts = []; S.signals = [];
    S.meta = { lastBackupAt:null, schemaVersion:R.SCHEMA_VERSION };
    S.ui = { weekView:null, examTab:'list', examOpen:null, cardTab:'due',
      subjectOpen:'tyt-turkce', guideTab:'analysis', progressRange:8, flipped:{}, timer:null,
      noteOpen:null, learnFilter:'all', learnQuery:'', learnPage:1, transcriptOpen:false,
      quizMode:'due', quizSize:10, quizSubject:null, quizTopic:null,
      quizFormat:'open', quizSeconds:0, quizVoice:false, droppedOpen:false,
      topicOpen:null, topicSubject:null, analyticsTab:'compare', compareA:null, compareB:null };
    R.Store = mockStore();
  }

  /* Sabit bir "bugun" degeri ile calis */
  function withToday(iso, fn){
    const U = R.U;
    const realToday = U.today, realTodayISO = U.todayISO;
    const d = U.parse(iso);
    U.today = () => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    U.todayISO = () => iso;
    try{ return fn(); }
    finally{ U.today = realToday; U.todayISO = realTodayISO; }
  }
  async function withTodayAsync(iso, fn){
    const U = R.U;
    const realToday = U.today, realTodayISO = U.todayISO;
    const d = U.parse(iso);
    U.today = () => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    U.todayISO = () => iso;
    try{ return await fn(); }
    finally{ U.today = realToday; U.todayISO = realTodayISO; }
  }

  /* Deneme fabrikasi */
  function makeExam(opts){
    const o = opts || {};
    const tests = o.tests || [{ name:'Türkçe', correct:o.correct == null ? 20 : o.correct, wrong:o.wrong == null ? 4 : o.wrong, blank:0, minutes:null }];
    return {
      id:o.id || R.U.uid('e'),
      date:o.date || '2026-09-19',
      type:o.type || 'Tam TYT',
      family:o.family || 'TYT',
      kind:o.kind || 'full',
      publisher:o.publisher || '345',
      duration:o.duration || 165,
      tests,
      protocol:{},
      createdAt:new Date().toISOString(),
      analysisCompletedAt:o.analysisCompletedAt === undefined ? new Date().toISOString() : o.analysisCompletedAt,
    };
  }
  /* Toplam neti hedeflenen degere getiren tek testlik deneme */
  function examWithNet(dateISO, net, family){
    return makeExam({ date:dateISO, family:family || 'TYT',
      type: (family === 'AYT' ? 'Tam AYT (SAY)' : 'Tam TYT'),
      tests:[{ name: family === 'AYT' ? 'Matematik' : 'Türkçe', correct:net, wrong:0, blank:0, minutes:null }] });
  }

  return { describe, it, expect, run, mockStore, resetState, withToday, withTodayAsync, makeExam, examWithNet, suites, realStore };
})();
