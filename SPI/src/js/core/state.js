/* Uygulama durumu, veri modeli ve yukleme/kaydetme islemleri.

   SP.S calisma anindaki durumu tutar; SP.Model onu depoyla (core/store.js)
   konusturur. Ekranlar SP.S'yi okur, degisikligi daima SP.Model uzerinden
   yazar — hicbir ekran dogrudan depoya dokunmaz.

   Depolama yollari:
     profile            aktif profilin kimligi ve hedefleri
     prefs              tercihler (tema, palet, ofis ayarlari)
     labs/<id>          bir tahlil oturumu (tek tarihte gelen degerler)
     vitals/<YYYY-MM-DD> gunluk vital ve vucut olcumleri
     meals/<YYYY-MM-DD> o gunun ogunleri
     workouts/<id>      bir antrenman kaydi
     progress           hareket merdivenlerindeki mevcut basamaklar
     basket             haftalik sepet
     prices             kullanicinin girdigi fiyatlar
     flags              acik ve gecmis kirmizi bayraklar
     decisions/<id>     ofiste alinan kararlar
     meta               yedek zamani ve sema surumu

   Hane profil listesi profile OZEL DEGILDIR: cihaz genelinde tek yerde,
   ayri bir localStorage anahtarinda durur (bkz. householdList). */

window.SP = window.SP || {};

SP.S = {
  route:'today',
  ready:false,
  sidebarOpen:false,

  profile:null,       // aktif profil
  profiles:[],        // hanedeki butun profiller (ozet)
  prefs:null,

  labs:[],            // tahlil oturumlari, tarihe gore artan
  vitals:{},          // YYYY-MM-DD -> gunluk olcum kaydi
  meals:{},           // YYYY-MM-DD -> ogun dizisi
  workouts:[],        // antrenman kayitlari
  progress:{},        // exId -> { levelId, achievedAt }

  basket:null,        // { items, weeklyLimit, monthlyLimit, testFee, equipment, updatedAt }
  prices:{},          // foodId -> { tl, at, source }

  flags:[],           // kirmizi bayrak kayitlari
  decisions:[],       // ofis kararlari

  office:null,        // ofis ayarlari (saglayici, model, ajan basina secim)
  officeChats:{},     // agentId -> mesajlar
  officeMeetings:[],  // haftalik toplanti tutanaklari
  officeBriefings:{}, // YYYY-MM-DD -> gunluk brifing
  journal:{},         // agentId -> dogrulanmis gozlemler

  meta:null,
  storeHealth:null,

  ui:{
    railOpen:false,
    labTab:'sonuc',        // sonuc | giris | gecmis | trend
    labPanel:'vital',      // acik panel id'si
    labQuery:'',           // sonuc ve giris listesindeki arama
    labFilter:'all',       // sonuc listesindeki panel suzgeci
    labShowEmpty:false,    // olculmemis satirlar gorunsun mu
    labOpen:null,          // acik tahlil oturumu
    markerOpen:null,       // acik biyobelirtec ayrintisi
    mealDate:null,         // gorunen gun (null = bugun)
    mealTab:'gunluk',      // gunluk | oneri | deger
    mealSlot:'kahvalti',
    foodQuery:'',
    foodCat:'all',
    foodPage:1,
    kitchenDish:null,      // mutfakta paylastirilan yemek
    kitchenGrams:1000,
    moveTab:'bugun',       // bugun | kardiyo | kuvvet | esneklik | dinlenme | ilerleme
    movePattern:'all',     // kuvvet alanindaki kalip seridinde secili olan
    workoutOpen:null,
    basketTab:'butce',     // butce | sepet | ikame | fiyat
    priceEdit:null,
    trendMarker:'weight',
    trendRange:90,
    analyticsTab:'capraz',
    officeAgent:'patron',
    officeDesk:null,
    officePerAgent:false,
    meetingAgenda:0,
    meetingOpen:null,
    guideTab:'kullanim',
    profileOpen:null,
    quickOpen:false,
  },
};

SP.Model = (function(){
  const U = SP.U;

  /* ------------------------------------------------------------ yardimcilar */

  /* Bos nesne ve diziler depolama katmanindan geri gelmeyebilir; okunan her
     belge kullanilmadan once eksik kaplari tamamlanir. */
  function normLab(doc){
    if(!doc) return doc;
    doc.values = doc.values || {};
    doc.source = doc.source || 'manual';
    Object.keys(doc.values).forEach(k => {
      const cell = doc.values[k];
      if(typeof cell === 'number') doc.values[k] = { v:cell, cert:'measured' };
      else if(cell && cell.cert == null) cell.cert = 'measured';
    });
    return doc;
  }

  function normDayMeals(rows){
    if(!Array.isArray(rows)) return [];
    rows.forEach(m => {
      m.items = Array.isArray(m.items) ? m.items : [];
      m.items.forEach(it => { if(it.cert == null) it.cert = 'estimated'; });
    });
    return rows;
  }

  function normWorkout(doc){
    if(!doc) return doc;
    doc.items = Array.isArray(doc.items) ? doc.items : [];
    if(doc.minutes == null) doc.minutes = 0;
    return doc;
  }

  /* ------------------------------------------------------------------ profil */

  function defaultProfile(){
    return {
      id:activeProfileId(),
      name:'',
      role:'self',            // self | family
      birthYear:null,
      sex:'male',             // male | female
      heightCm:null,
      weightKg:null,
      activity:'moderate',
      goal:'health',
      conditions:[],          // kullanicinin bildirdigi durumlar (serbest metin)
      theme:'system',
      palette:SP.DEFAULT_PALETTE,
      createdAt:new Date().toISOString(),
    };
  }

  function ageOf(p){
    const prof = p || SP.S.profile;
    if(!prof || !prof.birthYear) return null;
    return new Date().getFullYear() - Number(prof.birthYear);
  }

  async function saveProfile(patch){
    SP.S.profile = Object.assign({}, SP.S.profile, patch || {});
    await SP.Store.set('profile', SP.S.profile);
    await touchHousehold();
    return SP.S.profile;
  }

  function defaultPrefs(){
    return {
      weeklyBudget:null,       // TL — kullanici koyar
      householdSize:1,
      units:'metric',
      showEstimates:true,
      autoBriefing:true,
    };
  }

  async function savePrefs(patch){
    SP.S.prefs = Object.assign({}, SP.S.prefs, patch || {});
    await SP.Store.set('prefs', SP.S.prefs);
    return SP.S.prefs;
  }

  /* ---------------------------------------------------------------- hane

     Profil listesi cihaz genelindedir: her profil kendi depo anahtarinda
     yasar ama "bu cihazda kimler var" bilgisi ortaktir. Bu yuzden liste
     SP.Store'da degil, ayri bir localStorage anahtarinda durur. */

  const HOUSE_KEY = 'spi.household';
  const ACTIVE_KEY = 'spi.activeProfile';

  function householdList(){
    try{ return JSON.parse(localStorage.getItem(HOUSE_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function writeHousehold(list){
    try{ localStorage.setItem(HOUSE_KEY, JSON.stringify(list)); return true; }
    catch(e){ return false; }
  }
  function activeProfileId(){
    try{ return localStorage.getItem(ACTIVE_KEY) || 'ben'; }
    catch(e){ return 'ben'; }
  }

  /* Aktif profilin ozetini hane listesine yazar; profil secicide ad ve
     rol gorunur ama ham saglik verisi listeye hic girmez. */
  async function touchHousehold(){
    const p = SP.S.profile;
    if(!p) return;
    const list = householdList();
    const row = { id:p.id, name:p.name || 'Adsız', role:p.role || 'family', sex:p.sex,
      birthYear:p.birthYear, seenAt:new Date().toISOString() };
    const i = list.findIndex(x => x.id === row.id);
    if(i >= 0) list[i] = Object.assign(list[i], row); else list.push(row);
    writeHousehold(list);
    SP.S.profiles = list;
  }

  function addHouseholdMember(name, opts){
    const o = opts || {};
    const id = U.slug(name) || U.uid('p');
    const list = householdList();
    if(list.some(x => x.id === id)) return { ok:false, error:'Bu adla bir profil zaten var.' };
    list.push({ id, name, role:o.role || 'family', sex:o.sex || 'female',
      birthYear:o.birthYear || null, seenAt:null });
    writeHousehold(list);
    SP.S.profiles = list;
    return { ok:true, id };
  }

  function removeHouseholdMember(id){
    if(id === activeProfileId()) return { ok:false, error:'Açık olan profil silinemez.' };
    const list = householdList().filter(x => x.id !== id);
    writeHousehold(list);
    SP.S.profiles = list;
    /* Profilin kendi verisi kendi anahtarinda kalir; listeden dusmek
       veriyi silmez. Silmek acikca istenmelidir. */
    return { ok:true };
  }

  function switchProfile(id){
    try{ localStorage.setItem(ACTIVE_KEY, id); }catch(e){}
    location.reload();
  }

  /* ------------------------------------------------------------- tahliller */

  function newLab(dateISO){
    return { id:U.uid('lab'), date:dateISO || U.todayISO(), source:'manual',
      lab:'', values:{}, note:'', createdAt:new Date().toISOString() };
  }

  /* Turetilmis olcumleri hesaplayip oturuma yazar. Girdi eksikse olcum
     hic yazilmaz — tahmin uretilmez. */
  function applyDerived(rec){
    Object.keys(SP.DERIVED).forEach(id => {
      const def = SP.DERIVED[id];
      const vals = {};
      const ok = def.inputs.every(k => {
        const cell = rec.values[k];
        if(!cell || cell.v == null) return false;
        vals[k] = Number(cell.v);
        return true;
      });
      if(!ok){ delete rec.values[id]; return; }
      const out = def.calc(vals);
      if(out == null || !isFinite(out)){ delete rec.values[id]; return; }
      rec.values[id] = { v:U.round(out, 2), cert:'derived' };
    });
    return rec;
  }

  async function saveLab(rec){
    applyDerived(rec);
    rec.updatedAt = new Date().toISOString();
    const i = SP.S.labs.findIndex(l => l.id === rec.id);
    if(i >= 0) SP.S.labs[i] = rec; else SP.S.labs.push(rec);
    SP.S.labs.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    await SP.Store.set('labs/' + rec.id, rec);
    await refreshFlags();
    return rec;
  }

  async function deleteLab(id){
    SP.S.labs = SP.S.labs.filter(l => l.id !== id);
    await SP.Store.remove('labs/' + id);
    await refreshFlags();
  }

  /* Bir biyobelirtecin butun gecmisi — tarihe gore artan.
     Vital olcumler gunluk kayittan, laboratuvar degerleri tahlil
     oturumlarindan gelir; ikisi tek seride birlesir. */
  function seriesOf(markerId){
    const out = [];
    SP.S.labs.forEach(l => {
      const cell = l.values[markerId];
      if(cell && cell.v != null) out.push({ date:l.date, v:Number(cell.v), cert:cell.cert, src:'lab', id:l.id });
    });
    Object.keys(SP.S.vitals).forEach(d => {
      const v = SP.S.vitals[d];
      if(v && v[markerId] != null) out.push({ date:d, v:Number(v[markerId]), cert:'measured', src:'vital' });
    });
    out.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    return out;
  }

  function latestOf(markerId){
    const s = seriesOf(markerId);
    return s.length ? s[s.length - 1] : null;
  }

  /* Butun belirteclerin son degeri — kirmizi bayrak ve ofis brifingi icin. */
  function latestAll(){
    const out = {};
    SP.BIOMARKERS.forEach(b => {
      const l = latestOf(b.id);
      if(l) out[b.id] = l.v;
    });
    return out;
  }

  /* ------------------------------------------------------- gunluk olcumler */

  function defaultVitals(dateISO){
    return { date:dateISO, sbp:null, dbp:null, rhr:null, hrv:null, spo2:null, temp:null,
      sleep:null, weight:null, waist:null, bodyfat:null, soreness:null, water:0, note:'' };
  }

  function vitalsOf(dateISO){
    return SP.S.vitals[dateISO] || null;
  }

  function ensureVitals(dateISO){
    if(!SP.S.vitals[dateISO]) SP.S.vitals[dateISO] = defaultVitals(dateISO);
    return SP.S.vitals[dateISO];
  }

  async function saveVitals(dateISO, patch){
    const rec = Object.assign(ensureVitals(dateISO), patch || {});
    SP.S.vitals[dateISO] = rec;
    await SP.Store.set('vitals/' + dateISO, rec);
    await refreshFlags();
    return rec;
  }

  /* ------------------------------------------------------------------ ogun */

  function mealsOf(dateISO){
    return SP.S.meals[dateISO] || [];
  }

  function newMeal(slot){
    return { id:U.uid('m'), slot:slot || 'kahvalti', items:[], note:'',
      at:new Date().toISOString() };
  }

  async function saveMeals(dateISO, rows){
    SP.S.meals[dateISO] = normDayMeals(rows);
    await SP.Store.set('meals/' + dateISO, { date:dateISO, rows:SP.S.meals[dateISO] });
    return SP.S.meals[dateISO];
  }

  async function addMeal(dateISO, meal){
    const rows = mealsOf(dateISO).slice();
    rows.push(meal);
    return saveMeals(dateISO, rows);
  }

  async function deleteMeal(dateISO, id){
    return saveMeals(dateISO, mealsOf(dateISO).filter(m => m.id !== id));
  }

  /* ------------------------------------------------------------- antrenman */

  function newWorkout(dateISO, templateId){
    const tpl = SP.SESSION_TEMPLATES.find(t => t.id === templateId);
    return {
      id:U.uid('w'), date:dateISO || U.todayISO(),
      templateId:templateId || null,
      name:tpl ? tpl.name : 'Serbest antrenman',
      kind:tpl ? tpl.kind : 'strength',
      items:tpl ? tpl.items.map(exId => ({ exId, levelId:currentLevel(exId), sets:3, reps:null, minutes:null })) : [],
      minutes:tpl ? tpl.minutes : 40,
      rpe:null,
      note:'',
      createdAt:new Date().toISOString(),
    };
  }

  async function saveWorkout(rec){
    normWorkout(rec);
    const i = SP.S.workouts.findIndex(w => w.id === rec.id);
    if(i >= 0) SP.S.workouts[i] = rec; else SP.S.workouts.push(rec);
    SP.S.workouts.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    await SP.Store.set('workouts/' + rec.id, rec);
    return rec;
  }

  async function deleteWorkout(id){
    SP.S.workouts = SP.S.workouts.filter(w => w.id !== id);
    await SP.Store.remove('workouts/' + id);
  }

  function workoutsOf(dateISO){
    return SP.S.workouts.filter(w => w.date === dateISO);
  }

  /* --------------------------------------------------- ilerleme merdiveni */

  function currentLevel(exId){
    const ex = SP.EX_BY_ID[exId];
    if(!ex) return null;
    const rec = SP.S.progress[exId];
    return (rec && rec.levelId) || ex.levels[0].id;
  }

  function levelIndex(exId){
    const ex = SP.EX_BY_ID[exId];
    if(!ex) return 0;
    const id = currentLevel(exId);
    const i = ex.levels.findIndex(l => l.id === id);
    return i < 0 ? 0 : i;
  }

  /* Bir ust basamak yalnizca mevcut basamagin hedefi tutturuldugunda acilir.
     Sistem basamak atlatmaz; asiri yuklenmenin en yaygin sebebi budur. */
  async function advanceLevel(exId){
    const ex = SP.EX_BY_ID[exId];
    if(!ex) return { ok:false, error:'Hareket bulunamadı.' };
    const i = levelIndex(exId);
    if(i >= ex.levels.length - 1) return { ok:false, error:'Bu merdivenin son basamağındasın.' };
    SP.S.progress[exId] = { levelId:ex.levels[i + 1].id, achievedAt:new Date().toISOString() };
    await SP.Store.set('progress', SP.S.progress);
    return { ok:true, level:ex.levels[i + 1] };
  }

  async function setLevel(exId, levelId){
    SP.S.progress[exId] = { levelId, achievedAt:new Date().toISOString() };
    await SP.Store.set('progress', SP.S.progress);
    return SP.S.progress[exId];
  }

  /* ------------------------------------------------------------------ sepet */

  function defaultBasket(){
    /* monthlyLimit, testFee ve equipment butce sayfasi icindir. Hepsi
       null/bos baslar: girilmemis bir sinir "sinir yok" demektir, sifir
       degil. */
    return { items:[], weeklyLimit:null, monthlyLimit:null, testFee:null,
      equipment:[], updatedAt:null };
  }

  async function saveBasket(patch){
    SP.S.basket = Object.assign(defaultBasket(), SP.S.basket, patch || {});
    SP.S.basket.updatedAt = new Date().toISOString();
    await SP.Store.set('basket', SP.S.basket);
    return SP.S.basket;
  }

  async function setBasketItem(foodId, kg){
    const items = (SP.S.basket.items || []).slice();
    const i = items.findIndex(x => x.foodId === foodId);
    if(kg <= 0){
      if(i >= 0) items.splice(i, 1);
    }else if(i >= 0){
      items[i] = { foodId, kg };
    }else{
      items.push({ foodId, kg });
    }
    return saveBasket({ items });
  }

  /* Kullanicinin girdigi fiyat seed tahminini ezer ve "olculdu" olur. */
  async function setPrice(foodId, tl){
    if(tl == null || !isFinite(tl) || tl <= 0){
      delete SP.S.prices[foodId];
    }else{
      SP.S.prices[foodId] = { tl:U.round(tl, 2), at:U.todayISO(), source:'user' };
    }
    await SP.Store.set('prices', SP.S.prices);
    return SP.S.prices[foodId] || null;
  }

  /* ---------------------------------------------------------- kirmizi bayrak

     Bayraklar hesaplanir, elle yazilmaz. Her kayit degisiminde yeniden
     uretilir: kosul gecerse bayrak acilir, gecmezse kapanir ama SILINMEZ —
     gecmiste durur, cunku "bir kez tetiklenmis olmak" da bir bulgudur. */

  function evaluateFlags(){
    const vals = latestAll();
    const out = [];

    /* tek olcumle tetiklenenler */
    SP.BIOMARKERS.forEach(b => {
      const v = vals[b.id];
      if(v == null || !b.red) return;
      if(b.red.below != null && v < b.red.below){
        out.push({ id:b.id + ':below', kind:'marker', marker:b.id,
          label:b.name + ' kritik düşük',
          detail:b.name + ' ' + U.fmtNum(v) + ' ' + b.unit + ' — sistemin yorum yaptığı eşiğin altında.' });
      }
      if(b.red.above != null && v > b.red.above){
        out.push({ id:b.id + ':above', kind:'marker', marker:b.id,
          label:b.name + ' kritik yüksek',
          detail:b.name + ' ' + U.fmtNum(v) + ' ' + b.unit + ' — sistemin yorum yaptığı eşiğin üstünde.' });
      }
    });

    /* birden fazla olcumun birlikte anlam kazandigi oruntuler */
    SP.RED_FLAGS.patterns.forEach(p => {
      const has = p.needs.every(k => vals[k] != null);
      if(!has) return;
      let hit = false;
      try{ hit = !!p.test(vals); }catch(e){ hit = false; }
      if(hit) out.push({ id:p.id, kind:'pattern', label:p.label, detail:p.detail, needs:p.needs });
    });

    return out;
  }

  async function refreshFlags(){
    const live = evaluateFlags();
    const now = new Date().toISOString();
    const prev = SP.S.flags || [];
    const byId = {};
    prev.forEach(f => { byId[f.id] = f; });

    live.forEach(f => {
      if(byId[f.id]){
        byId[f.id] = Object.assign(byId[f.id], f, { status:'open', lastSeenAt:now });
      }else{
        byId[f.id] = Object.assign({}, f, { status:'open', openedAt:now, lastSeenAt:now, ack:false });
      }
    });
    /* Artik gecerli olmayanlar kapanir ama kayitta kalir. */
    Object.keys(byId).forEach(id => {
      if(!live.some(f => f.id === id) && byId[id].status === 'open'){
        byId[id].status = 'closed';
        byId[id].closedAt = now;
      }
    });

    SP.S.flags = Object.keys(byId).map(k => byId[k]);
    await SP.Store.set('flags', SP.S.flags);
    return SP.S.flags;
  }

  function openFlags(){
    return (SP.S.flags || []).filter(f => f.status === 'open');
  }

  async function ackFlag(id){
    const f = (SP.S.flags || []).find(x => x.id === id);
    if(!f) return null;
    f.ack = true;
    f.ackAt = new Date().toISOString();
    await SP.Store.set('flags', SP.S.flags);
    return f;
  }

  /* ---------------------------------------------------------------- kararlar */

  async function saveDecision(rec){
    const row = Object.assign({ id:U.uid('d'), at:new Date().toISOString(),
      status:'open', owner:'patron' }, rec);
    const i = SP.S.decisions.findIndex(d => d.id === row.id);
    if(i >= 0) SP.S.decisions[i] = row; else SP.S.decisions.push(row);
    await SP.Store.set('decisions/' + row.id, row);
    return row;
  }

  async function closeDecision(id, outcome){
    const d = SP.S.decisions.find(x => x.id === id);
    if(!d) return null;
    d.status = 'closed';
    d.outcome = outcome || '';
    d.closedAt = new Date().toISOString();
    await SP.Store.set('decisions/' + d.id, d);
    return d;
  }

  function openDecisions(){
    return SP.S.decisions.filter(d => d.status === 'open');
  }

  /* ------------------------------------------------------------------ yedek */

  async function markBackup(){
    SP.S.meta = Object.assign({}, SP.S.meta, { lastBackupAt:new Date().toISOString() });
    await SP.Store.set('meta', SP.S.meta);
  }

  function backupAgeDays(){
    if(!SP.S.meta || !SP.S.meta.lastBackupAt) return null;
    return U.diffDays(SP.S.meta.lastBackupAt.slice(0, 10), U.todayISO());
  }

  function backupDue(){
    const age = backupAgeDays();
    return age == null || age >= 30;
  }

  function dataFootprint(){
    const q = SP.Store.localQuota();
    return {
      labs:SP.S.labs.length,
      vitalDays:Object.keys(SP.S.vitals).length,
      mealDays:Object.keys(SP.S.meals).length,
      workouts:SP.S.workouts.length,
      bytes:q.bytes, pct:q.pct, near:q.near, full:q.full,
    };
  }

  /* ------------------------------------------------------------------ acilis */

  function migrate(meta){
    const v = (meta && meta.schemaVersion) || 0;
    if(v === SP.SCHEMA_VERSION) return meta;
    return Object.assign({}, meta, { schemaVersion:SP.SCHEMA_VERSION });
  }

  async function loadAll(){
    const S = SP.S;
    await SP.Store.init();

    S.meta = migrate(await SP.Store.get('meta') || { schemaVersion:SP.SCHEMA_VERSION });
    await SP.Store.set('meta', S.meta);

    S.profile = (await SP.Store.get('profile')) || defaultProfile();
    S.profile.id = activeProfileId();
    S.prefs = Object.assign(defaultPrefs(), await SP.Store.get('prefs'));

    S.labs = ((await SP.Store.list('labs')) || []).map(normLab)
      .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

    S.vitals = {};
    ((await SP.Store.list('vitals')) || []).forEach(row => {
      const d = row.date || row.id;
      S.vitals[d] = Object.assign(defaultVitals(d), row);
    });

    S.meals = {};
    ((await SP.Store.list('meals')) || []).forEach(row => {
      const d = row.date || row.id;
      S.meals[d] = normDayMeals(row.rows || []);
    });

    S.workouts = ((await SP.Store.list('workouts')) || []).map(normWorkout)
      .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

    S.progress = (await SP.Store.get('progress')) || {};
    S.basket = Object.assign(defaultBasket(), await SP.Store.get('basket'));
    S.prices = (await SP.Store.get('prices')) || {};
    S.flags = (await SP.Store.get('flags')) || [];
    S.decisions = ((await SP.Store.list('decisions')) || [])
      .sort((a, b) => (a.at || '') < (b.at || '') ? 1 : -1);

    await touchHousehold();
    await refreshFlags();

    S.ready = true;
    return S;
  }

  return {
    /* profil ve hane */
    defaultProfile, saveProfile, ageOf, defaultPrefs, savePrefs,
    householdList, addHouseholdMember, removeHouseholdMember, switchProfile, activeProfileId,
    /* tahlil */
    newLab, saveLab, deleteLab, applyDerived, seriesOf, latestOf, latestAll,
    /* gunluk olcum */
    defaultVitals, vitalsOf, ensureVitals, saveVitals,
    /* ogun */
    mealsOf, newMeal, saveMeals, addMeal, deleteMeal,
    /* antrenman */
    newWorkout, saveWorkout, deleteWorkout, workoutsOf,
    currentLevel, levelIndex, advanceLevel, setLevel,
    /* ekonomi */
    defaultBasket, saveBasket, setBasketItem, setPrice,
    /* bayrak ve karar */
    evaluateFlags, refreshFlags, openFlags, ackFlag,
    saveDecision, closeDecision, openDecisions,
    /* sistem */
    markBackup, backupAgeDays, backupDue, dataFootprint, migrate, loadAll,
  };
})();
