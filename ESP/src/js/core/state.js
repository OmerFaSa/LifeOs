/* Uygulama durumu, veri modeli ve yukleme/kaydetme islemleri.

   ESP.S calisma anindaki durumu tutar; ESP.Model onu depoyla (core/store.js)
   konusturur. Ekranlar ESP.S'yi okur, degisikligi daima ESP.Model uzerinden
   yazar — hicbir ekran dogrudan depoya dokunmaz.

   Depolama yollari:
     profile              aktif profilin kimligi ve odagi
     prefs                tercihler (tema, palet, duzen, ofis ayarlari)
     days/<YYYY-MM-DD>    o gunun pratik oturumlari
     cards/<id>           bir SRS karti (dil)
     args/<id>            bir arguman (felsefe)
     notes/<id>           bir atomik not (okuma)
     books/<id>           bir kaynak (okuma)
     pieces/<id>          bir parca ya da teknik (muzik)
     recordings/<id>      bir diksiyon kaydinin OLCUMU (ses dosyasi degil)
     drafts/<id>          bir yazi taslagi
     goals/<id>           zamana bagli hedef (sunum, konser, sinav)
     decisions/<id>       ofiste alinan karar
     meta                 yedek zamani ve sema surumu

   Profil listesi profile OZEL DEGILDIR: cihaz genelinde tek yerde, ayri bir
   localStorage anahtarinda durur (bkz. profileList).

   Bu dosyanin en cok tekrar eden kurali sudur: GIRILMEMIS ALAN SIFIR
   DEGILDIR. Bir gun icin oturum yoksa o gun "0 dakika" degil "veri yok"tur
   ve hicbir ortalamaya girmez. Fonksiyon adlarinda bu ayrim gorunur:
   `dayHasEntry` (hic girildi mi) ile `minutesOf` (kac dakika) ayri sorulardir. */

window.ESP = window.ESP || {};

ESP.S = {
  route:'today',
  ready:false,
  sidebarOpen:false,

  profile:null,        // aktif profil
  profiles:[],         // cihazdaki butun profiller (ozet)
  prefs:null,

  days:{},             // YYYY-MM-DD -> { date, sessions:[], note }
  cards:[],            // SRS kartlari
  args:[],             // argumanlar, en yeni ustte
  notes:[],            // atomik notlar
  books:[],            // kaynaklar
  pieces:[],           // parca ve teknikler
  recordings:[],       // diksiyon olcumleri
  drafts:[],           // yazi taslaklari
  goals:[],            // zamana bagli hedefler

  office:null,         // ofis ayarlari (saglayici, model, ajan basina secim)
  officeChats:{},      // agentId -> mesajlar
  officeMeetings:[],   // toplanti tutanaklari
  officeBriefings:{},  // YYYY-MM-DD -> gunluk brifing
  journal:{},          // agentId -> dogrulanmis gozlemler

  decisions:[],        // ofis kararlari

  meta:null,
  storeHealth:null,

  ui:{
    railOpen:false,
    undo:null,              // son yikici islemin geri alma kaydi
    dayTab:'giris',         // giris | ozet | gecmis
    dayDate:null,           // gorunen gun (null = bugun)
    sessionDisc:'lang',     // giris formunda secili disiplin
    langTab:'calis',        // calis | kartlar | ekle | ilerleme
    langDeck:'all',
    cardQuery:'',
    cardOpen:null,
    reviewQueue:null,       // acik calisma oturumu
    philoTab:'acik',        // acik | kapali | ekle | metinler
    argOpen:null,
    studioTab:'muzik',      // muzik | diksiyon | ilerleme
    pieceOpen:null,
    metronomeBpm:80,
    metronomeOn:false,
    readTab:'notlar',       // notlar | matris | kaynaklar
    noteQuery:'',
    noteOpen:null,
    conceptFilter:null,
    writeTab:'taslaklar',   // taslaklar | olcum
    draftOpen:null,
    analyticsTab:'radar',   // radar | seriler | rapor
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

ESP.Model = (function(){
  const U = ESP.U;
  const S = ESP.S;

  /* ---------------------------------------------------------- yardimcilar */

  /* Bos nesne ve diziler depolama katmanindan geri gelmeyebilir; okunan her
     belge kullanilmadan once eksik kaplari tamamlanir. Eksik kap yuzunden
     cizim sirasinda patlayan bir ekran, kabugu da kapatmasa bile o bolumu
     kullanilamaz hale getirir. */
  function arr(v){ return Array.isArray(v) ? v : []; }
  function obj(v){ return (v && typeof v === 'object') ? v : {}; }

  /* Bir sayiyi kesinlik etiketiyle birlikte okur.

     Devir notundaki en pahali hata buydu: `Number(x) || 0` bos alani sifir
     yapar ve uydurulmus sifir ortalamaya girer. Burada bos alan `null`
     doner ve etiketi `missing` olur. */
  function numCert(raw, cert){
    const yazildi = raw != null && String(raw).trim() !== '';
    if(!yazildi) return { value:null, cert:'missing' };
    const n = Number(String(raw).replace(',', '.'));
    if(!isFinite(n) || n < 0) return { value:null, cert:'missing' };
    return { value:n, cert:cert || 'measured' };
  }

  /* --------------------------------------------------------------- profil */

  function defaultProfile(){
    return {
      id:ESP.Store.activeProfileId ? ESP.Store.activeProfileId() : 'ben',
      name:'',
      focus:'balanced',            // ESP.FOCUS
      langs:['en'],                // calisilan diller
      instrument:'gitar',
      dailyMinutes:60,             // hedef degil, olcut: gunun plan tabani
      startedAt:U.todayISO(),
      createdAt:new Date().toISOString(),
    };
  }

  async function saveProfile(patch){
    S.profile = Object.assign(defaultProfile(), S.profile, patch || {});
    await ESP.Store.set('profile', S.profile);
    await touchProfileList();
    return S.profile;
  }

  function defaultPrefs(){
    return {
      theme:'system',
      palette:'kagit',
      design:'defter',
      reduceMotion:false,
      autoBriefing:true,
      pinned:[],
    };
  }

  async function savePrefs(patch){
    S.prefs = Object.assign(defaultPrefs(), S.prefs, patch || {});
    await ESP.Store.set('prefs', S.prefs);
    return S.prefs;
  }

  /* ------------------------------------------------------- profil listesi

     Cihazdaki profiller tek bir localStorage anahtarinda durur; her profilin
     VERISI ise kendi depo anahtarinda (esp.v1.<profil>) yasar. Profil gecisi
     sayfayi yeniden yukler: yarim kalmis bir yazma isleminin yanlis profile
     dusmesi boylece imkansizdir. */
  const LIST_KEY = 'esp.profiles';

  function profileList(){
    try{ return JSON.parse(localStorage.getItem(LIST_KEY) || '[]'); }
    catch(e){ return []; }
  }

  function writeProfileList(list){
    try{ localStorage.setItem(LIST_KEY, JSON.stringify(list)); }catch(e){}
    S.profiles = list;
  }

  function activeProfileId(){
    try{ return localStorage.getItem('esp.activeProfile') || 'ben'; }
    catch(e){ return 'ben'; }
  }

  async function touchProfileList(){
    const id = activeProfileId();
    const list = profileList();
    const row = list.find(x => x.id === id);
    const name = (S.profile && S.profile.name) || '';
    if(row){ row.name = name; }
    else list.push({ id, name });
    writeProfileList(list);
  }

  function addProfile(name){
    const clean = String(name || '').trim();
    if(!clean) return { ok:false, error:'Profil adı boş olamaz.' };
    const id = U.slug(clean) || ('p' + Date.now().toString(36));
    const list = profileList();
    if(list.some(x => x.id === id)) return { ok:false, error:'Bu adla bir profil zaten var.' };
    list.push({ id, name:clean });
    writeProfileList(list);
    return { ok:true, id };
  }

  function removeProfile(id){
    if(id === activeProfileId()) return { ok:false, error:'Açık olan profil silinemez.' };
    writeProfileList(profileList().filter(x => x.id !== id));
    try{ localStorage.removeItem('esp.v1.' + id); }catch(e){}
    return { ok:true };
  }

  function switchProfile(id){
    try{ localStorage.setItem('esp.activeProfile', id); }catch(e){}
    location.reload();
  }

  /* ----------------------------------------------------------- gun kaydi

     Bir gun oturumlardan olusur. Oturum = bir disiplinde gecirilen olculmus
     sure. Gunun kendisi bir skor tasimaz: skoru kural motoru hesaplar.

     `dayHasEntry` ile `minutesOf` ayri sorulardir ve ayri kalmalidir:
     birincisi "bu gune hic dokunuldu mu", ikincisi "kac dakika". Bir gun
     acilip hicbir oturum girilmemisse birincisi de yanlistir — kayit
     yalnizca oturum eklendiginde olusur. */

  function newDay(dateISO){
    return { date:dateISO, sessions:[], note:'', updatedAt:new Date().toISOString() };
  }

  function normDay(doc){
    const d = obj(doc);
    return {
      date:d.date,
      sessions:arr(d.sessions).map(normSession),
      note:d.note || '',
      updatedAt:d.updatedAt || null,
    };
  }

  function normSession(s){
    const r = obj(s);
    return {
      id:r.id || U.uid('s'),
      disc:r.disc || 'lang',
      minutes:(typeof r.minutes === 'number' && isFinite(r.minutes)) ? r.minutes : null,
      minutesCert:r.minutesCert || (r.minutes == null ? 'missing' : 'measured'),
      /* Kalite kullanicinin kendi degerlendirmesidir ve DAIMA tahmindir.
         Olculmus bir sey gibi gosterilmesi doktrin ihlali olurdu. */
      quality:(typeof r.quality === 'number' && isFinite(r.quality)) ? r.quality : null,
      qualityCert:r.quality == null ? 'missing' : 'estimated',
      /* Disipline ozel olculmus ikinci sayi. Yazida kelime, dilde cozulen
         kart, muzikte temiz tekrar. Tek alan tutulur cunku ekranlarin
         hepsinde "sure + bir sayi" kalibi var; ucuncu bir sayi isteyen
         disiplin cikmadi. */
      count:(typeof r.count === 'number' && isFinite(r.count)) ? r.count : null,
      countCert:r.count == null ? 'missing' : 'measured',
      ref:r.ref || null,        // hangi karta/parcaya/kaynaga baglandi
      note:r.note || '',
      at:r.at || null,
    };
  }

  function dayOf(dateISO){ return S.days[dateISO] || null; }

  function ensureDay(dateISO){
    if(!S.days[dateISO]) S.days[dateISO] = newDay(dateISO);
    return S.days[dateISO];
  }

  /* Bir gune hic dokunuldu mu? Bos bir gun kaydi "dokunuldu" sayilmaz:
     ortalamaya girecek olan sey oturumdur, kaydin varligi degil. */
  function dayHasEntry(day){
    const d = obj(day);
    return arr(d.sessions).length > 0;
  }

  function sessionsOf(dateISO){ return arr((S.days[dateISO] || {}).sessions); }

  /* Bir gunde bir disiplinde gecen olculmus dakika.

     Donus `null` ise o gun o disipline HIC dokunulmamistir — sifir degil.
     Cagiran taraf ikisini ayirmak zorundadir; bu yuzden 0 donmuyoruz. */
  function minutesOf(dateISO, discId){
    const rows = sessionsOf(dateISO)
      .filter(s => (!discId || s.disc === discId) && s.minutesCert !== 'missing' && s.minutes != null);
    if(!rows.length) return null;
    return rows.reduce((a, s) => a + s.minutes, 0);
  }

  async function saveDay(dateISO){
    const rec = ensureDay(dateISO);
    rec.updatedAt = new Date().toISOString();
    /* Bos gun kaydi depoya YAZILMAZ: yazilsaydi "dokunulmus gun" sayisi
       kullanicinin acip kapattigi her gunle sisecekti. */
    if(!dayHasEntry(rec) && !rec.note){
      delete S.days[dateISO];
      await ESP.Store.remove('days/' + dateISO);
      return null;
    }
    await ESP.Store.set('days/' + dateISO, rec);
    return rec;
  }

  async function addSession(dateISO, patch){
    const day = ensureDay(dateISO);
    const m = numCert(patch && patch.minutes, 'measured');
    const c = numCert(patch && patch.count, 'measured');
    const s = normSession(Object.assign({}, patch, {
      id:U.uid('s'),
      minutes:m.value, minutesCert:m.cert,
      count:c.value, countCert:c.cert,
      at:new Date().toISOString(),
    }));
    day.sessions.push(s);
    await saveDay(dateISO);
    return s;
  }

  async function updateSession(dateISO, id, patch){
    const day = ensureDay(dateISO);
    const i = day.sessions.findIndex(s => s.id === id);
    if(i < 0) return null;
    const merged = Object.assign({}, day.sessions[i], patch || {});
    if(patch && 'minutes' in patch){
      const m = numCert(patch.minutes, 'measured');
      merged.minutes = m.value; merged.minutesCert = m.cert;
    }
    if(patch && 'count' in patch){
      const c = numCert(patch.count, 'measured');
      merged.count = c.value; merged.countCert = c.cert;
    }
    day.sessions[i] = normSession(merged);
    await saveDay(dateISO);
    return day.sessions[i];
  }

  async function deleteSession(dateISO, id){
    const day = ensureDay(dateISO);
    day.sessions = day.sessions.filter(s => s.id !== id);
    await saveDay(dateISO);
  }

  /* Son N gunun kayitli gunleri — girilmemis gunler DIZIDE YOKTUR.
     Cagiran "kac gun girildi" ile "kac gun gecti" farkini gorebilsin diye. */
  function recentDays(n){
    return U.lastDays(n || 30)
      .map(d => S.days[d])
      .filter(d => d && dayHasEntry(d));
  }

  /* Seri: bugunden geriye dogru, oturumu olan ust uste gun sayisi.

     Bugun henuz girilmemisse seri KIRILMIS sayilmaz — gun bitmedi.
     Sayim dunden baslar, bugun varsa ona eklenir. */
  function streak(){
    let n = 0;
    const bugun = U.todayISO();
    if(dayHasEntry(S.days[bugun])) n = 1;
    for(let i = 1; i < 400; i++){
      const d = U.iso(U.addDays(U.parse(bugun), -i));
      if(dayHasEntry(S.days[d])) n++;
      else break;
    }
    return n;
  }

  /* ------------------------------------------------------------ SRS karti

     Kartin SRS alanlari (box, ease, interval, due) core/srs.js tarafindan
     yazilir; model yalnizca tasir. Boylece algoritma degisirse burasi
     degismez. */

  function newCard(patch){
    return Object.assign({
      id:U.uid('c'),
      front:'', back:'', lang:'en', context:'',
      tags:[],
      box:1, ease:2.5, interval:0, due:U.todayISO(),
      reps:0, lapses:0, history:[],
      active:false,             // uretimde kullanildi mi (i+1)
      createdAt:new Date().toISOString(),
    }, patch || {});
  }

  function normCard(doc){
    const c = obj(doc);
    return Object.assign(newCard(), c, {
      tags:arr(c.tags), history:arr(c.history),
    });
  }

  async function saveCard(rec){
    const c = normCard(rec);
    const i = S.cards.findIndex(x => x.id === c.id);
    if(i >= 0) S.cards[i] = c; else S.cards.push(c);
    await ESP.Store.set('cards/' + c.id, c);
    return c;
  }

  async function deleteCard(id){
    S.cards = S.cards.filter(c => c.id !== id);
    await ESP.Store.remove('cards/' + id);
  }

  function cardsOf(lang){
    return lang ? S.cards.filter(c => c.lang === lang) : S.cards.slice();
  }

  /* ----------------------------------------------------------- arguman

     Bir tez ACIK kalir: cevaplanmamis itirazi varsa kapanmaz. Acik tez bir
     eksiklik degildir — calisan bir dusuncedir. Yalnizca 14 gunden uzun
     dokunulmadiysa masa notu duser. */

  function newArgument(patch){
    return Object.assign({
      id:U.uid('a'),
      thesis:'', supports:[], objections:[],
      sourceId:null,           // hangi kaynaktan (books/<id>)
      concepts:[],
      status:'open',           // open | closed | abandoned
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
    }, patch || {});
  }

  function normArgument(doc){
    const a = obj(doc);
    return Object.assign(newArgument(), a, {
      supports:arr(a.supports),
      objections:arr(a.objections).map(o => ({
        id:o.id || U.uid('o'), text:o.text || '',
        answered:!!o.answered, answer:o.answer || '',
      })),
      concepts:arr(a.concepts),
    });
  }

  /* Cevaplanmamis itirazi olan tez kapanamaz. Bunu model zorlar, ekran
     degil: ayni kural iki ekrandan da gecerli olsun diye. */
  function argumentOpen(a){
    return arr(a && a.objections).some(o => !o.answered);
  }

  async function saveArgument(rec){
    const a = normArgument(rec);
    if(a.status === 'closed' && argumentOpen(a)) a.status = 'open';
    a.updatedAt = new Date().toISOString();
    const i = S.args.findIndex(x => x.id === a.id);
    if(i >= 0) S.args[i] = a; else S.args.unshift(a);
    await ESP.Store.set('args/' + a.id, a);
    return a;
  }

  async function deleteArgument(id){
    S.args = S.args.filter(a => a.id !== id);
    await ESP.Store.remove('args/' + id);
  }

  /* ------------------------------------------------------- atomik not ve kaynak */

  function newNote(patch){
    return Object.assign({
      id:U.uid('n'),
      text:'',                 // TEK fikir, tek cumle
      bookId:null,
      concepts:[],
      links:[],                // [{ to:noteId, why:'' }]
      createdAt:new Date().toISOString(),
    }, patch || {});
  }

  function normNote(doc){
    const n = obj(doc);
    return Object.assign(newNote(), n, {
      concepts:arr(n.concepts),
      links:arr(n.links).map(l => ({ to:l.to, why:l.why || '' })),
    });
  }

  async function saveNote(rec){
    const n = normNote(rec);
    const i = S.notes.findIndex(x => x.id === n.id);
    if(i >= 0) S.notes[i] = n; else S.notes.unshift(n);
    await ESP.Store.set('notes/' + n.id, n);
    return n;
  }

  async function deleteNote(id){
    S.notes = S.notes.filter(n => n.id !== id);
    /* Silinen nota giden baglar da kalkar; yoksa matris olmayan bir
       dugume isaret eden ok cizer. */
    const etkilenen = S.notes.filter(n => n.links.some(l => l.to === id));
    for(const n of etkilenen){
      n.links = n.links.filter(l => l.to !== id);
      await ESP.Store.set('notes/' + n.id, n);
    }
    await ESP.Store.remove('notes/' + id);
  }

  /* Iki notu birbirine baglar. Bag CIFT YONLUDUR: sentopik okuma "A, B'yi
     soyle goruyor" degil "A ile B su kavramda bulusuyor" der. */
  async function linkNotes(aId, bId, why){
    if(aId === bId) return { ok:false, error:'Bir not kendine bağlanmaz.' };
    const a = S.notes.find(n => n.id === aId), b = S.notes.find(n => n.id === bId);
    if(!a || !b) return { ok:false, error:'Not bulunamadı.' };
    if(a.links.some(l => l.to === bId)) return { ok:false, error:'Bu bağ zaten var.' };
    a.links.push({ to:bId, why:why || '' });
    b.links.push({ to:aId, why:why || '' });
    await saveNote(a); await saveNote(b);
    return { ok:true };
  }

  async function unlinkNotes(aId, bId){
    const a = S.notes.find(n => n.id === aId), b = S.notes.find(n => n.id === bId);
    if(a){ a.links = a.links.filter(l => l.to !== bId); await saveNote(a); }
    if(b){ b.links = b.links.filter(l => l.to !== aId); await saveNote(b); }
  }

  function newBook(patch){
    return Object.assign({
      id:U.uid('b'),
      title:'', author:'',
      kind:'primary',          // primary | secondary  (§ hints: primer metin)
      startedAt:U.todayISO(), finishedAt:null,
      createdAt:new Date().toISOString(),
    }, patch || {});
  }

  async function saveBook(rec){
    const b = Object.assign(newBook(), obj(rec));
    const i = S.books.findIndex(x => x.id === b.id);
    if(i >= 0) S.books[i] = b; else S.books.unshift(b);
    await ESP.Store.set('books/' + b.id, b);
    return b;
  }

  async function deleteBook(id){
    S.books = S.books.filter(b => b.id !== id);
    await ESP.Store.remove('books/' + id);
  }

  /* ------------------------------------------------------------ muzik

     Bir parca ya da teknik kendi BPM merdivenini tasir. Esik kendiliginden
     ARTAR ama kendiliginden DUSMEZ: bir kotu gun kazanilmis esigi geri
     almaz (bkz. core/acoustic.js). */

  function newPiece(patch){
    return Object.assign({
      id:U.uid('p'),
      name:'', kind:'technique',   // technique | piece
      key:'', targetBpm:null,
      cleanBpm:null,               // olculmus esik — acoustic.js yazar
      attempts:[],                 // [{ date, bpm, clean, note }]
      createdAt:new Date().toISOString(),
    }, patch || {});
  }

  function normPiece(doc){
    const p = obj(doc);
    return Object.assign(newPiece(), p, { attempts:arr(p.attempts) });
  }

  async function savePiece(rec){
    const p = normPiece(rec);
    const i = S.pieces.findIndex(x => x.id === p.id);
    if(i >= 0) S.pieces[i] = p; else S.pieces.push(p);
    await ESP.Store.set('pieces/' + p.id, p);
    return p;
  }

  async function deletePiece(id){
    S.pieces = S.pieces.filter(p => p.id !== id);
    await ESP.Store.remove('pieces/' + id);
  }

  /* -------------------------------------------------------- diksiyon olcumu

     Dikkat: ses DOSYASI saklanmaz. Saklanan sey olcumdur: sure, kelime,
     kullanicinin kendi isaretledigi hata sayisi. Mahremiyet dogru cozumu
     degil, en ucuz cozumu bu: olmayan dosya sizamaz. */

  function newRecording(patch){
    return Object.assign({
      id:U.uid('r'),
      date:U.todayISO(),
      seconds:null, secondsCert:'missing',
      words:null, wordsCert:'missing',
      errors:null,                 // kullanicinin isaretledigi hata sayisi
      errorsCert:'missing',
      textId:null,                 // hangi tekerleme / metin
      note:'',
      createdAt:new Date().toISOString(),
    }, patch || {});
  }

  async function saveRecording(rec){
    const r = Object.assign(newRecording(), obj(rec));
    const i = S.recordings.findIndex(x => x.id === r.id);
    if(i >= 0) S.recordings[i] = r; else S.recordings.unshift(r);
    await ESP.Store.set('recordings/' + r.id, r);
    return r;
  }

  async function deleteRecording(id){
    S.recordings = S.recordings.filter(r => r.id !== id);
    await ESP.Store.remove('recordings/' + id);
  }

  /* ------------------------------------------------------------ yazi taslagi */

  function newDraft(patch){
    return Object.assign({
      id:U.uid('d'),
      title:'', text:'',
      revisions:0,                 // kac kez uzerinden gecildi
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
    }, patch || {});
  }

  async function saveDraft(rec){
    const d = Object.assign(newDraft(), obj(rec));
    d.updatedAt = new Date().toISOString();
    const i = S.drafts.findIndex(x => x.id === d.id);
    if(i >= 0) S.drafts[i] = d; else S.drafts.unshift(d);
    await ESP.Store.set('drafts/' + d.id, d);
    return d;
  }

  async function deleteDraft(id){
    S.drafts = S.drafts.filter(d => d.id !== id);
    await ESP.Store.remove('drafts/' + id);
  }

  /* --------------------------------------------------------- zamana bagli hedef

     Dis dunyanin takvimi ic plandan once gelir (ESP.PRECEDENCE §2). Bir
     hedefin tarihi varsa planner onu one alir. */

  function newGoal(patch){
    return Object.assign({
      id:U.uid('g'),
      label:'', disc:'lang', date:null,
      note:'', done:false,
      createdAt:new Date().toISOString(),
    }, patch || {});
  }

  async function saveGoal(rec){
    const g = Object.assign(newGoal(), obj(rec));
    const i = S.goals.findIndex(x => x.id === g.id);
    if(i >= 0) S.goals[i] = g; else S.goals.push(g);
    await ESP.Store.set('goals/' + g.id, g);
    return g;
  }

  async function deleteGoal(id){
    S.goals = S.goals.filter(g => g.id !== id);
    await ESP.Store.remove('goals/' + id);
  }

  /* Tarihi gecmemis ve tamamlanmamis hedefler, yakin olan once. */
  function openGoals(){
    const bugun = U.todayISO();
    return S.goals
      .filter(g => !g.done && g.date && g.date >= bugun)
      .sort((a, b) => a.date < b.date ? -1 : 1);
  }

  /* --------------------------------------------------------------- karar */

  async function saveDecision(row){
    const d = Object.assign({
      id:U.uid('dec'), text:'', agentId:'patron', source:'meeting',
      openedAt:new Date().toISOString(), closedAt:null, result:'',
    }, obj(row));
    const i = S.decisions.findIndex(x => x.id === d.id);
    if(i >= 0) S.decisions[i] = d; else S.decisions.unshift(d);
    await ESP.Store.set('decisions/' + d.id, d);
    return d;
  }

  async function closeDecision(id, result){
    const d = S.decisions.find(x => x.id === id);
    if(!d) return null;
    d.closedAt = new Date().toISOString();
    d.result = result || '';
    await ESP.Store.set('decisions/' + d.id, d);
    return d;
  }

  function openDecisions(){ return S.decisions.filter(d => !d.closedAt); }

  /* -------------------------------------------------------------- sistem */

  async function markBackup(){
    S.meta = Object.assign({ schemaVersion:ESP.SCHEMA_VERSION }, S.meta,
      { lastBackup:new Date().toISOString() });
    await ESP.Store.set('meta', S.meta);
  }

  function backupAgeDays(){
    const at = S.meta && S.meta.lastBackup;
    if(!at) return null;
    return Math.floor((Date.now() - new Date(at).getTime()) / U.DAY_MS);
  }

  function backupDue(){
    const n = backupAgeDays();
    return n == null ? true : n >= 30;
  }

  function dataFootprint(){
    const bytes = ESP.Store.localSize();
    const quota = ESP.Store.localQuota();
    return { bytes, quota, pct:quota ? Math.round(bytes / quota * 100) : null };
  }

  /* ------------------------------------------------------------------ goc

     Yikici degildir: yeni koleksiyonlar bos baslar, ilk yazmada olusur.
     Bir goc yalnizca KENDINI ELE VEREN veriyi onarir; emin olunamayan
     kayda dokunmaz. */
  function migrate(meta){
    const m = Object.assign({ schemaVersion:0 }, obj(meta));
    if(m.schemaVersion < 1){
      m.schemaVersion = 1;
      m.migratedAt = new Date().toISOString();
    }
    return m;
  }

  /* ------------------------------------------------------------- yukleme */

  async function loadAll(){
    await ESP.Store.init();

    S.meta = migrate(await ESP.Store.get('meta') || { schemaVersion:ESP.SCHEMA_VERSION });
    await ESP.Store.set('meta', S.meta);

    S.profile = Object.assign(defaultProfile(), await ESP.Store.get('profile'));
    S.prefs = Object.assign(defaultPrefs(), await ESP.Store.get('prefs'));
    S.profiles = profileList();
    if(!S.profiles.length) await touchProfileList();

    S.days = {};
    ((await ESP.Store.list('days')) || []).forEach(row => {
      const d = normDay(row);
      if(d.date) S.days[d.date] = d;
    });

    S.cards = ((await ESP.Store.list('cards')) || []).map(normCard);
    S.args = ((await ESP.Store.list('args')) || []).map(normArgument)
      .sort((a, b) => (b.updatedAt || '') < (a.updatedAt || '') ? -1 : 1);
    S.notes = ((await ESP.Store.list('notes')) || []).map(normNote);
    S.books = ((await ESP.Store.list('books')) || []).map(b => Object.assign(newBook(), b));
    S.pieces = ((await ESP.Store.list('pieces')) || []).map(normPiece);
    S.recordings = ((await ESP.Store.list('recordings')) || [])
      .map(r => Object.assign(newRecording(), r));
    S.drafts = ((await ESP.Store.list('drafts')) || [])
      .map(d => Object.assign(newDraft(), d));
    S.goals = ((await ESP.Store.list('goals')) || []).map(g => Object.assign(newGoal(), g));
    S.decisions = ((await ESP.Store.list('decisions')) || []);

    S.storeHealth = ESP.Store.health();
    S.ready = true;
  }

  return {
    /* profil */
    defaultProfile, saveProfile, defaultPrefs, savePrefs,
    profileList, addProfile, removeProfile, switchProfile, activeProfileId,
    /* gun ve oturum */
    newDay, dayOf, ensureDay, saveDay, dayHasEntry, sessionsOf, minutesOf,
    addSession, updateSession, deleteSession, recentDays, streak,
    /* dil */
    newCard, saveCard, deleteCard, cardsOf,
    /* felsefe */
    newArgument, saveArgument, deleteArgument, argumentOpen,
    /* okuma */
    newNote, saveNote, deleteNote, linkNotes, unlinkNotes,
    newBook, saveBook, deleteBook,
    /* muzik */
    newPiece, savePiece, deletePiece,
    /* diksiyon */
    newRecording, saveRecording, deleteRecording,
    /* yazi */
    newDraft, saveDraft, deleteDraft,
    /* hedef ve karar */
    newGoal, saveGoal, deleteGoal, openGoals,
    saveDecision, closeDecision, openDecisions,
    /* sistem */
    numCert, markBackup, backupAgeDays, backupDue, dataFootprint, migrate, loadAll,
  };
})();
