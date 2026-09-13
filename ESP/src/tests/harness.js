/* Sifir bagimlilikli test kosucusu.
   Node gerektirmez; tarayicida calisir ve sonucu window.__ESP_TESTS__ uzerinden verir. */

window.ESP = window.ESP || {};

ESP.Test = (function(){
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
    window.__ESP_TESTS__ = summary;
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

  /* resetState() ESP.Store'u sahte depoyla degistirir; gercek modulun saf
     fonksiyonlarini (readBackup, exportAll) test edebilmek icin referansini sakla. */
  const realStore = ESP.Store;

  /* Testler arasinda temiz durum. Profil bilerek doldurulur: cogu ekran
     profilsiz de calisir ama her testin basinda ayni profili kurmak gurultu
     yaratirdi. */
  function testProfile(){
    return {
      id:'test', name:'Test',
      focus:'balanced', langs:['en'], instrument:'gitar', dailyMinutes:60,
      startedAt:ESP.U.todayISO(),
      createdAt:new Date().toISOString(),
    };
  }

  function resetState(){
    const S = ESP.S;
    S.route = 'today';
    S.profile = testProfile();
    S.profiles = [];
    S.prefs = ESP.Model.defaultPrefs();
    S.days = {}; S.cards = []; S.args = []; S.notes = []; S.books = [];
    S.pieces = []; S.recordings = []; S.drafts = []; S.goals = [];
    S.events = []; S.sources = []; S.chains = [];
    S.assets = []; S.reminders = [];
    S.office = null; S.officeChats = {}; S.officeMeetings = [];
    S.officeBriefings = {}; S.journal = {};
    S.decisions = [];
    S.meta = { schemaVersion:ESP.SCHEMA_VERSION, lastBackup:null };
    S.storeHealth = null;
    S.ui = {
      railOpen:false, undo:null,
      dayTab:'giris', dayDate:null, sessionDisc:'lang',
      langTab:'calis', langDeck:'all', cardQuery:'', cardOpen:null, reviewQueue:null,
      philoTab:'acik', argOpen:null,
      studioTab:'muzik', pieceOpen:null, metronomeBpm:80, metronomeOn:false,
      readTab:'notlar', noteQuery:'', noteOpen:null, conceptFilter:null,
      writeTab:'taslaklar', draftOpen:null,
      analyticsTab:'radar',
      histTab:'serit', eventOpen:null, sourceOpen:null, chainOpen:null,
      histEra:'all', histQuery:'', curDisc:null, ladderTab:'ozet', expField:'all',
      deskTab:{}, deskOpen:{}, assetOpen:null,
      practice:null, practiceShown:false, practiceOrder:null, unitOpen:null,
      officeAgent:'patron', officeDesk:null, officePerAgent:false,
      meetingAgenda:0, meetingOpen:null, guideTab:'kullanim',
      profileOpen:null, quickOpen:false,
    };
    ESP.Store = mockStore();
    /* Kare onbellegi testler arasinda tasinmamali: bir testin urettigi
       masa notu digerinde gorunurse hata gizlenir. */
    if(ESP.Memo && ESP.Memo.bitir) ESP.Memo.bitir();
  }

  /* Sabit bir "bugun" degeri ile calis */
  function withToday(iso, fn){
    const U = ESP.U;
    const realToday = U.today, realTodayISO = U.todayISO;
    const d = U.parse(iso);
    U.today = () => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    U.todayISO = () => iso;
    try{ return fn(); }
    finally{ U.today = realToday; U.todayISO = realTodayISO; }
  }
  async function withTodayAsync(iso, fn){
    const U = ESP.U;
    const realToday = U.today, realTodayISO = U.todayISO;
    const d = U.parse(iso);
    U.today = () => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    U.todayISO = () => iso;
    try{ return await fn(); }
    finally{ U.today = realToday; U.todayISO = realTodayISO; }
  }

  /* ---------- fabrikalar ----------

     Hepsi duruma DOGRUDAN yazar (depo cagrisi yapmadan): bir testin konusu
     hesap ise, o hesabin girdisini kurmak tek satir olmali. */

  /* Oturum: pushSession('2026-09-10', 'music', 45) */
  function pushSession(dateISO, disc, minutes, extra){
    const gun = ESP.Model.ensureDay(dateISO);
    const s = Object.assign({
      id:ESP.U.uid('s'), disc, minutes,
      minutesCert:minutes == null ? 'missing' : 'measured',
      count:null, countCert:'missing',
      quality:null, qualityCert:'missing',
      ref:null, note:'', at:new Date().toISOString(),
    }, extra || {});
    gun.sessions.push(s);
    return s;
  }

  /* Kart: pushCard({ front, back, box, due, reps }) */
  function pushCard(patch){
    const c = ESP.Model.newCard(patch || {});
    ESP.S.cards.push(c);
    return c;
  }

  /* Not ve kaynak */
  function pushBook(title, author, kind){
    const b = ESP.Model.newBook({ title, author, kind:kind || 'primary' });
    ESP.S.books.push(b);
    return b;
  }
  function pushNote(text, bookId, concepts){
    const n = ESP.Model.newNote({ text, bookId:bookId || null, concepts:concepts || [] });
    ESP.S.notes.push(n);
    return n;
  }

  /* Parca: pushPiece('Gam', { cleanBpm:100, targetBpm:140 }) */
  function pushPiece(name, patch){
    const p = ESP.Model.newPiece(Object.assign({ name }, patch || {}));
    ESP.S.pieces.push(p);
    return p;
  }

  /* Ek: pushAsset('lang', 'note', { text:'...' }) */
  function pushAsset(disc, kind, patch){
    const a = ESP.Model.newAsset(Object.assign({ disc, kind:kind || 'note' }, patch || {}));
    if(!a.title) a.title = String(a.text || '').slice(0, 60) || 'ek';
    ESP.S.assets.unshift(a);
    return a;
  }

  function pushReminder(disc, text, patch){
    const r = ESP.Model.newReminder(Object.assign({ disc, text }, patch || {}));
    ESP.S.reminders.unshift(r);
    return r;
  }

  /* Tarih: pushEvent(1071, 'Malazgirt', { kind:'siyasi', region:'anadolu' }) */
  function pushEvent(year, title, patch){
    const e = ESP.Model.newEvent(Object.assign({ year, title }, patch || {}));
    ESP.S.events.push(e);
    ESP.S.events.sort((a, b) => (a.year || 0) - (b.year || 0));
    return e;
  }

  function pushSource(title, kind, patch){
    const s = ESP.Model.newSource(Object.assign({ title, kind:kind || 'secondary' },
      patch || {}));
    ESP.S.sources.push(s);
    return s;
  }

  /* Zincir: pushChain(eventId, [{ kind:'yapisal', text:'...' }]) */
  function pushChain(eventId, links, patch){
    const c = ESP.Model.newChain(Object.assign({ eventId,
      links:(links || []).map((l, i) => Object.assign({ id:'l' + i, kind:'yapisal',
        text:'', sourceId:null }, l)) }, patch || {}));
    ESP.S.chains.push(c);
    return c;
  }

  /* Arguman */
  function pushArgument(thesis, objections){
    const a = ESP.Model.newArgument({ thesis,
      objections:(objections || []).map((t, i) => ({ id:'o' + i, text:t, answered:false })) });
    ESP.S.args.push(a);
    return a;
  }

  return { describe, it, expect, run, mockStore, resetState, testProfile,
    withToday, withTodayAsync,
    pushSession, pushCard, pushBook, pushNote, pushPiece, pushArgument,
    pushEvent, pushSource, pushChain, pushAsset, pushReminder,
    suites, realStore };
})();
