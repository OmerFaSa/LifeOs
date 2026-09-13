/* Bölüm tezgâhı — her disiplin sayfasının altındaki ortak katman.

   Yedi bölüm yedi ayrı iş yapar ama DÖRT şeyi aynı şekilde ister:

     KOÇ          o bölümün uzmanıyla konuşmak (yazılı ya da sesli)
     HARİTA       sıfırdan üstatlığa nerede durduğun
     EKLER        not, belge, bağlantı ve ses ölçümü iliştirmek
     HATIRLATMA   kendine bir şey söyleyip günü gelince duymak

   Dördü de tek bir yerde tanımlı çünkü bölümden bölüme değişmemeleri
   gerekiyor: kullanıcı bir kez öğrensin, yedi kez değil.

   İki değişmez bu dosyanın tamamını yönetir:

   1. SES İKİNCİ BİR YOL AÇMAZ. Bölüm sayfasındaki sohbet, Danışma
      ekranındakiyle aynı `ESP.Office.send()` üzerinden geçer: aynı brifing,
      aynı ev kuralları denetimi, aynı kayıt. Sesli sohbet de öyle. Ekran
      değişir, yol değişmez.

   2. KOÇ EKLERİ GÖRÜR, İÇERİĞİNİ GÖRMEZ. Brifinge yalnızca sayı, tür ve
      başlık gider. Tam metin, belge içeriği ve ses hiçbir zaman modele
      gitmez — `ESP.PRIVACY.model` bunu zaten söylüyordu, burası uyguluyor. */

window.ESP = window.ESP || {};

ESP.Desk = (function(){
  const U = ESP.U, S = ESP.S;

  const TABS = [
    { id:'kocla',      label:'Koç' },
    { id:'harita',     label:'Harita' },
    { id:'ekler',      label:'Ekler' },
    { id:'hatirlatma', label:'Hatırlatma' },
    { id:'plan',       label:'Plan' },
  ];

  /* Bir disiplinin masası. Müzik ve diksiyon aynı ekranı paylaşır ama AYRI
     masalardır: Maestro ile Demosthenes'in ölçtüğü şey bir değil. */
  function agentOf(discId){
    const d = ESP.DISCIPLINE_BY_ID[discId];
    return d ? (ESP.AGENT_BY_ID[d.agent] || ESP.AGENT_BY_ID.patron) : ESP.AGENT_BY_ID.patron;
  }

  function tab(discId){
    return (S.ui.deskTab && S.ui.deskTab[discId]) || 'kocla';
  }

  function setTab(discId, id){
    S.ui.deskTab = Object.assign({}, S.ui.deskTab || {});
    S.ui.deskTab[discId] = id;
  }

  function isOpen(discId){
    const m = S.ui.deskOpen || {};
    /* Varsayılan AÇIK: tezgâhı görmek için bir tıklama istemek, onu
       kullanılmaz yapardı. Kapatmak kullanıcının kararı ve hatırlanır. */
    return m[discId] !== false;
  }

  function toggle(discId){
    S.ui.deskOpen = Object.assign({}, S.ui.deskOpen || {});
    S.ui.deskOpen[discId] = !isOpen(discId);
    return S.ui.deskOpen[discId];
  }

  /* --------------------------------------------------------------- sohbet */

  /* Sohbetin kendisi Office'te; burada yalnızca «bu masanın son N mesajı»
     sorusu var. Ayrı bir kayıt tutmak iki gerçek yaratırdı. */
  function messages(discId, n){
    const a = agentOf(discId);
    const list = (S.officeChats[a.id] || []);
    return n ? list.slice(-n) : list;
  }

  async function ask(discId, question){
    const a = agentOf(discId);
    return ESP.Office.send(a.id, question);
  }

  /* Son ajan cümlesi — «dinle» düğmesi bunu seslendirir. */
  function lastAnswer(discId){
    const list = messages(discId);
    for(let i = list.length - 1; i >= 0; i--){
      if(list[i].role !== 'user') return list[i];
    }
    return null;
  }

  function speakLast(discId){
    const m = lastAnswer(discId);
    if(!m || !ESP.Speak || !ESP.Speak.supported()) return { ok:false, reason:'yok' };
    if(ESP.Speak.isSpeaking()){ ESP.Speak.stop(); return { ok:true, stopped:true }; }
    ESP.Speak.say(m.text, { agent:agentOf(discId).id });
    return { ok:true };
  }

  /* Sesli sohbet: sıra alma döngüsü core/talk.js içinde. Buradaki tek iş,
     doğru masayı açmak. */
  function talk(discId){
    const a = agentOf(discId);
    if(!ESP.Talk || !ESP.Talk.supported()){
      return { ok:false, reason:'unsupported',
        message:ESP.Voice ? ESP.Voice.message('unsupported') : 'Bu tarayıcı desteklemiyor.' };
    }
    if(ESP.Talk.isActive()){ ESP.Talk.stop(); return { ok:true, stopped:true }; }
    return ESP.Talk.start(a.id);
  }

  function talking(discId){
    return !!(ESP.Talk && ESP.Talk.isActive() && ESP.Talk.agent
      && ESP.Talk.agent() === agentOf(discId).id);
  }

  /* ---------------------------------------------------------------- ekler */

  function assets(discId){ return ESP.Model.assetsOf(discId); }

  /* Eklerin ÖZETİ — brifinge giden şey budur. İçerik geçmez.

     Ses için toplam süre taşınır çünkü ölçülmüş bir sayıdır; ham kayıt
     zaten hiç tutulmaz (bkz. state.js §ekler). */
  function assetSummary(discId){
    const list = assets(discId);
    if(!list.length){
      return { total:0, cert:'missing', byKind:{}, audioSeconds:null, titles:[] };
    }
    const tur = {};
    let saniye = 0, sesli = 0;
    list.forEach(function(a){
      tur[a.kind] = (tur[a.kind] || 0) + 1;
      if(a.kind === 'audio' && a.seconds != null){ saniye += a.seconds; sesli++; }
    });
    return {
      total:list.length, cert:'measured', byKind:tur,
      audioSeconds:sesli ? saniye : null,
      /* Başlık bir içerik değil bir etikettir: ajanın «hangi malzemeye
         baktığını» söyleyebilmesi için gerekir, metnin kendisi için değil. */
      titles:list.slice(0, 8).map(function(a){ return a.title; }),
    };
  }

  /* ----------------------------------------------------------- hatirlatma */

  function reminders(discId){ return ESP.Model.remindersOf(discId); }
  function due(discId, todayISO){ return ESP.Model.dueReminders(discId, todayISO); }

  function reminderSummary(discId, todayISO){
    const hepsi = reminders(discId).filter(function(r){ return !r.done; });
    const bugun = due(discId, todayISO);
    return {
      open:hepsi.length, due:bugun.length,
      cert:reminders(discId).length ? 'measured' : 'missing',
      texts:bugun.slice(0, 5).map(function(r){ return r.text; }),
    };
  }

  /* ------------------------------------------------------------- brifing ek

     Ofisin disiplin brifinglerine eklenen ortak bölüm. Ayrı bir fonksiyon
     olmasının sebebi tekrar değil TUTARLILIK: yedi masa aynı biçimi görsün. */
  function briefExtras(discId){
    return {
      assets:assetSummary(discId),
      reminders:reminderSummary(discId),
      level:(function(){
        const lv = ESP.Curriculum.levelOf(discId);
        if(!lv) return { rank:0, label:null, cert:'missing' };
        return { rank:lv.rank, label:lv.level.label, mastery:lv.mastery, cert:lv.cert };
      })(),
    };
  }

  /* Tezgâhın üst satırında duran tek cümle. Model kapalıyken de doludur. */
  function headline(discId, todayISO){
    const r = reminderSummary(discId, todayISO);
    if(r.due) return r.due + ' hatırlatma bugüne düştü.';
    const kapi = ESP.Curriculum.nextGate(discId);
    if(kapi) return kapi.action === 'measure'
      ? 'Sıradaki kapı ölçülemiyor: ' + kapi.gate.label + '.'
      : 'Sıradaki kapı: ' + kapi.gate.label + '.';
    return 'Bu merdivenin bütün kapıları geçilmiş görünüyor.';
  }

  /* Bu masanın teklifleri. Teklif bir cümle değil TİPLİ bir nesnedir ve
     kural motoru üretir (bkz. core/plans.js). */
  function proposals(discId, todayISO){
    return ESP.Plans.proposalsFor(agentOf(discId).id, todayISO);
  }

  return { TABS, proposals, agentOf, tab, setTab, isOpen, toggle,
    messages, ask, lastAnswer, speakLast, talk, talking,
    assets, assetSummary, reminders, due, reminderSummary,
    briefExtras, headline };
})();
