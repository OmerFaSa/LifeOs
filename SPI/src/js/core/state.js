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
  meds:[],            // ilac ve takviye kayitlari, en yeni ustte
  proposals:[],       // ofisin onerileri — onaysiz hicbiri uygulanmaz
  foods:[],           // kullanicinin ekledigi gidalar (SP.FOODS'a katilir)
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
    undo:null,             // son yikici islemin geri alma kaydi
    dayTab:'giris',        // giris | ozet | gecmis
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
    /* Eski kayıtlarda açlık alanı yoktu: «bilinmiyor» sayılır, «aç»
       değil. Olmayan bir bilgiyi varmış gibi doldurmak, eksik veriyi
       sıfır saymakla aynı hatadır. */
    if(doc && doc.fasting == null) doc.fasting = 'unknown';
    if(doc && doc.time == null) doc.time = '';
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
      design:SP.DEFAULT_DESIGN,
      /* Sabitlenen ölçümler. 58 ölçümde her seferinde aynı üçünü
         aramak sürtünmedir; sabitlenenler listenin başında durur. */
      pinned:[],
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
      lab:'', values:{}, note:'',
      /* AÇLIK DURUMU. Açlık glukozu, insülin, trigliserit ve onlardan
         türeyen TyG ile TG/HDL yalnız aç karnına alınan kandan
         yorumlanır. Sistem bunu sormuyordu ve hepsini açmış gibi
         yorumluyordu: tok karnına alınmış bir trigliserit «referans
         üstü» işaretlenip beslenme hedefini değiştirebiliyordu. */
      fasting:'unknown',      // yes | no | unknown
      time:'',                // 'HH:MM' — isteğe bağlı
      createdAt:new Date().toISOString() };
  }

  /* ------------------------------------------------------ kendi gıdaların

     79 gıdalık tablo Türk mutfağını kapsıyor ama MARKET RAFINI
     kapsamıyor. Kullanıcının eklediği gıdalar `SP.FOODS` listesine
     KATILIR: ayrıştırıcı, sepet ve öğün hesabı hiçbir şey bilmeden
     onları da görür.

     Kimlik çakışması olmaz: kullanıcı gıdalarının kimliği `u-` ile
     başlar ve yerleşik bir gıdayı ezemez. */

  function newFood(){
    return { id:'u-' + U.uid('f').slice(2), name:'', cat:'diger',
      kcal:null, p:null, f:null, sat:null, c:null, sugar:null, fib:null,
      micro:{}, flags:[], portions:[], aliases:[], custom:true,
      createdAt:new Date().toISOString() };
  }

  function normFood(rec){
    rec.name = String(rec.name || '').trim();
    rec.micro = rec.micro || {};
    rec.flags = rec.flags || [];
    rec.portions = rec.portions || [];
    /* Takma adlar aramayı besler: ad değişince onlar da tazelenir. */
    const ad = U.norm(rec.name);
    rec.aliases = [...new Set((rec.aliases || []).concat(ad ? [ad] : []))];
    rec.custom = true;
    return rec;
  }

  /* Yerleşik tabloya EKLEME: ekranlar ve ayrıştırıcı tek bir liste görür. */
  function mountFoods(){
    const kullanici = SP.S.foods || [];
    const yerlesik = SP.FOODS.filter(f => !f.custom);
    SP.FOODS.length = 0;
    yerlesik.concat(kullanici).forEach(f => SP.FOODS.push(f));
    SP.FOOD_BY_ID = SP.FOODS.reduce((acc, f) => { acc[f.id] = f; return acc; }, {});
    if(SP.Parse && SP.Parse.rebuildFoodIndex) SP.Parse.rebuildFoodIndex();
  }

  async function saveFood(rec){
    normFood(rec);
    SP.S.foods = SP.S.foods || [];
    const i = SP.S.foods.findIndex(f => f.id === rec.id);
    if(i >= 0) SP.S.foods[i] = rec; else SP.S.foods.push(rec);
    await SP.Store.set('foods/' + rec.id, rec);
    mountFoods();
    return rec;
  }

  async function deleteFood(id){
    SP.S.foods = (SP.S.foods || []).filter(f => f.id !== id);
    await SP.Store.remove('foods/' + id);
    mountFoods();
  }

  /* --------------------------------------------------------- sabitleme

     Önemsediğin ölçümler listenin başında dursun. Sınır bilinçlidir:
     beşten fazlası «sabitleme» olmaktan çıkar, ikinci bir liste olur. */

  const PIN_MAX = 5;

  function pinnedIds(){
    const p = SP.S.profile;
    return ((p && p.pinned) || []).filter(id => SP.BIO_BY_ID[id]);
  }

  function isPinned(id){ return pinnedIds().indexOf(id) >= 0; }

  async function togglePin(id){
    if(!SP.BIO_BY_ID[id]) return { ok:false, note:'Böyle bir ölçüm yok.' };
    const liste = pinnedIds();
    const i = liste.indexOf(id);
    if(i >= 0){
      liste.splice(i, 1);
      await saveProfile({ pinned:liste });
      return { ok:true, pinned:false };
    }
    if(liste.length >= PIN_MAX){
      return { ok:false, full:true,
        note:'En fazla ' + PIN_MAX + ' ölçüm sabitlenebilir. Birini kaldır.' };
    }
    liste.push(id);
    await saveProfile({ pinned:liste });
    return { ok:true, pinned:true };
  }

  /* ------------------------------------------------------- ilaç ve takviye

     Sistem doz önermez, başlatmaz, kestirmez. Yalnızca NE KULLANILDIĞINI
     kaydeder ki bir ölçümdeki değişimin sebebi aranabilsin. */

  function newMed(){
    return { id:U.uid('med'), kindId:'diger', name:'', dose:'',
      startDate:U.todayISO(), endDate:null, note:'',
      createdAt:new Date().toISOString() };
  }

  function normMed(rec){
    rec.kindId = SP.MED_BY_ID[rec.kindId] ? rec.kindId : 'diger';
    rec.name = String(rec.name || '').trim();
    rec.dose = String(rec.dose || '').trim();
    rec.note = String(rec.note || '').trim();
    if(!rec.startDate) rec.startDate = U.todayISO();
    if(rec.endDate === '') rec.endDate = null;
    /* Bitiş başlangıçtan önce olamaz; olursa bitiş yok sayılır. */
    if(rec.endDate && rec.endDate < rec.startDate) rec.endDate = null;
    return rec;
  }

  async function saveMed(rec){
    normMed(rec);
    SP.S.meds = SP.S.meds || [];
    const i = SP.S.meds.findIndex(m => m.id === rec.id);
    if(i >= 0) SP.S.meds[i] = rec; else SP.S.meds.push(rec);
    SP.S.meds.sort((a, b) => a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0);
    await SP.Store.set('meds/' + rec.id, rec);
    return rec;
  }

  async function deleteMed(id){
    SP.S.meds = (SP.S.meds || []).filter(m => m.id !== id);
    await SP.Store.remove('meds/' + id);
  }

  /* Bırakmak silmek değildir: bırakılmış bir ilaç geçmiş bir ölçümü
     hâlâ açıklıyor. Bitiş tarihi yazılır, kayıt durur. */
  async function stopMed(id, dateISO){
    const rec = (SP.S.meds || []).find(m => m.id === id);
    if(!rec) return null;
    rec.endDate = dateISO || U.todayISO();
    return saveMed(rec);
  }

  /* Turetilmis olcumleri hesaplayip oturuma yazar.

     Uc kural:
       1. Girdi eksikse olcum HIC yazilmaz — tahmin uretilmez.
       2. Formul gecersizse (ornegin Friedewald trigliserit 400 ustunde)
          hesap yapilmaz. Gecersiz formulu uygulamak, hesaplamamaktan
          kotudur.
       3. OLCULEN, HESAPLANANA USTUN GELIR. LDL ve eGFR hem laboratuvarda
          olculebilir hem hesaplanabilir; laboratuvar olctuyse hesap onun
          uzerine yazmaz. Bir olcumun uzerine tahmin yazmak, bu sistemin
          en temel kuralinin ihlalidir. */
  function applyDerived(rec){
    const prof = SP.S.profile || {};
    const ctx = { age:ageOf(prof), sex:prof.sex || 'male' };

    Object.keys(SP.DERIVED).forEach(id => {
      const def = SP.DERIVED[id];

      const mevcut = rec.values[id];
      if(def.measured && mevcut && mevcut.cert === 'measured') return;

      const eksikBaglam = (def.needs || []).some(k => ctx[k] == null);
      if(eksikBaglam){ if(!def.measured || !mevcut) delete rec.values[id]; return; }

      const vals = {};
      const ok = def.inputs.every(k => {
        const cell = rec.values[k];
        if(!cell || cell.v == null) return false;
        vals[k] = Number(cell.v);
        return true;
      });
      if(!ok){ if(!def.measured || !mevcut) delete rec.values[id]; return; }

      const out = def.calc(vals, ctx);
      if(out == null || !isFinite(out)){
        if(!def.measured || !mevcut) delete rec.values[id];
        return;
      }
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
      sleep:null, weight:null, waist:null, bodyfat:null, soreness:null, water:0, note:'',
      /* Semptomlar: id -> şiddet (1-3). Boş nesne «şikâyet yok» demek
         DEĞİL «girilmemiş» demektir; ikisini ayırmak için ayrı bayrak. */
      symptoms:{}, symptomsLogged:false,
      /* Adet kanaması günü. Ferritin ve hemoglobin yorumu buna bağlı. */
      period:false };
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

    S.foods = ((await SP.Store.list('foods')) || []).map(normFood);
    mountFoods();

    /* Oneri kutusu: bekleyen bir oneri acilista gorunur kalmali,
       yoksa kullanici onayladigini sanip onaylamamis olur. */
    if(SP.Proposals) await SP.Proposals.load();

    S.meds = ((await SP.Store.list('meds')) || []).map(normMed)
      .sort((a, b) => a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0);

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
    /* ilac ve takviye */
    newMed, saveMed, deleteMed, stopMed,
    /* sabitleme */
    pinnedIds, isPinned, togglePin, PIN_MAX,
    /* kendi gidalarin */
    newFood, saveFood, deleteFood, mountFoods,
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
