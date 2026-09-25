/* Teklif ve eylem planı — koçun sistemi değiştirme YOLU.

   İstenen şey şuydu: koçlar kendi alanlarında değişiklik yapabilsin, plan
   kurabilsin. Bunun iki yolu var ve aralarındaki fark bu dosyanın tamamı:

     (a) Ajan doğrudan yazar. Model bir şey söyler, sistem yapar.
     (b) Ajan TEKLİF eder, kullanıcı onaylar, KURAL MOTORU uygular.

   (a) yanlıştır ve tartışılmaz. Bir dil modelinin kullanıcının verisine
   doğrudan yazması, halüsinasyon riskini kalıcı hâle getirir: yanlış bir
   çıkarım bir cümle olarak kalmaz, bir hatırlatıcıya, bir hedefe, bir
   silinmiş karta dönüşür. Bu depodaki bütün doktrin (kural motoru
   otoritedir, model yalnızca cümleye çevirir) bunun üstüne kurulu.

   Bu yüzden (b): teklif KURAL MOTORUNUN ürettiği TİPLİ bir nesnedir.
   Modelin teklifi yazması diye bir şey yok — model teklifi yalnızca
   CÜMLEYE çevirir. Kullanıcı onaylar, uygulamayı yine kural motoru yapar.

   Üç değişmez:

   1. HER TEKLİF BİR AJANIN KENDİ ALANINDADIR. Maestro hatırlatıcı kurabilir
      ama dil ünitesi ekleyemez. `allowed()` bunu denetler ve bir ihlal bir
      hata değil bir IMKANSIZLIKTIR: kapsam dışı teklif hiç üretilmez.

   2. AJANIN TEKLİFİ KENDİLİĞİNDEN UYGULANMAZ. Onaysız teklif bir
      öneridir; reddedilen teklif kaydı SİLİNMEZ (aynı öneriyi yarın tekrar
      üretmemek için hatırlanır). KULLANICININ İSTEĞİ ise (talep) seviyesi
      KÜÇÜKSE hemen uygulanır — AGENTS.md §1.9; orta ve büyük yine onay
      bekler.

   3. TEKLİF GERİ ALINABİLİR OLMALIDIR. Uygulanan her teklif ne yaptığını
      (`applied`) kaydeder; geri alınamayacak bir iş teklif edilmez. Bu
      yüzden hiçbir teklif SİLME işlemi önermez. */

window.ESP = window.ESP || {};

ESP.Plans = (function(){
  const U = ESP.U, S = ESP.S;

  /* Teklif türleri ve hangi masanın üretebileceği.

     `scope:'own'` demek, teklifin ajanın kendi disiplinine bağlı olması
     demektir. `scope:'coach'` yalnızca koç ve Patron içindir: merdiven ve
     tekrar bütün disiplinlerin ortak işi. */
  const KINDS = [
    { id:'reminder', level:'kucuk', label:'Hatırlatıcı kur', scope:'own',
      note:'Bir tarihe bağlı hatırlatma. Kaçırılırsa ceza üretmez.' },
    { id:'goal', level:'kucuk', label:'Zamana bağlı hedef', scope:'own',
      note:'Takvimde tarihi olan bir hedef. Öncelik sırasında ikinci sıraya girer.' },
    { id:'unit', level:'orta', label:'Ünite ekle', scope:'own',
      note:'Bir öğrenme ünitesini desteye ekler. Kartlar «tohum» etiketiyle gelir.' },
    { id:'drill', level:'kucuk', label:'Egzersiz işle', scope:'own',
      note:'Bugünün reçetesindeki bir egzersizi gün kaydına yazar.' },
    { id:'weekplan', level:'orta', label:'Haftalık plan', scope:'coach',
      note:'Haftanın kalan günlerine disiplin dağıtır. Takvim değil sıradır.' },
    { id:'focus', level:'kucuk', label:'Odağı değiştir', scope:'coach',
      note:'Eşit skorlu iki iş çıkarsa hangisinin öne geçeceğini değiştirir.' },
    { id:'base', level:'orta', label:'Günlük tabanı değiştir', scope:'coach',
      note:'Reçetenin sığdığı dakika. Hedef değil ölçüt.' },
    /* Bölüm açma–kapama (core/modules.js). Orta seviye: bir disiplinin
       bütün ekranlarını, masasını ve denge hesabını etkiler. Veri silinmez. */
    { id:'bolum', level:'orta', label:'Bölümü aç / kapat', scope:'coach',
      note:'Disiplin gezinmeden ve denge hesabından çıkar ya da geri gelir; verisi silinmez.' },
    /* Hedef planı (core/hedefplan.js). BÜYÜK aksiyon (AGENTS.md §1.9):
       odak, günlük taban, gerekirse bölüm ve tarihli hedef birlikte
       değişir. Ayrıntılı önizleme + onay + geri dönüş noktası. Yalnız
       kullanıcının Hedeflerim'deki düğmesinden gelir; kural motoru bu
       türü kendiliğinden üretmez, model hiç öneremez. */
    { id:'hedefplan', level:'buyuk', label:'Hedef planı', scope:'coach', modelYok:true,
      note:'Hedefin disiplini odağa alınır, taban vakte göre yükselir, tarihli hedef ve kontrol noktaları kurulur.' },
  ];

  const KIND_BY_ID = KINDS.reduce(function(m, k){ m[k.id] = k; return m; }, {});

  function discOf(agentId){
    const d = (ESP.DISCIPLINES || []).filter(function(x){ return x.agent === agentId; })[0];
    return d ? d.id : null;
  }

  /* Bir ajan bu türü teklif edebilir mi? */
  function allowed(agentId, kindId){
    const k = KIND_BY_ID[kindId];
    if(!k) return false;
    if(k.scope === 'coach') return agentId === 'patron'
      || (ESP.COACH_IDS || []).indexOf(agentId) >= 0;
    /* 'own': ajanın bir disiplini olmalı ve o disiplin açık olmalı. */
    const disc = discOf(agentId);
    if(!disc) return false;
    if(k.id === 'unit') return ESP.Lesson.units(disc).length > 0;
    return ESP.Mod.isOn(disc);
  }

  /* ------------------------------------------------------------- üretim

     Teklifler BULGUDAN doğar: koşul sağlandığında üretilir, koşul geçtiğinde
     üretilmez. Masa notlarıyla aynı mantık — fark, notun bir bilgi, teklifin
     bir EYLEM önerisi olması. */
  function proposalsFor(agentId, todayISO){
    const bugun = todayISO || U.todayISO();
    return ESP.Memo.of('plans.for:' + agentId + ':' + bugun, function(){
      return proposalsForRaw(agentId, bugun);
    });
  }

  function proposalsForRaw(agentId, todayISO){
    const bugun = todayISO || U.todayISO();
    const out = [];
    const disc = discOf(agentId);
    const ekle = function(kind, title, why, payload){
      if(!allowed(agentId, kind)) return;
      out.push({
        id:'p:' + agentId + ':' + kind + ':' + (payload && payload.key || title),
        agentId:agentId, kind:kind, disc:disc, title:title, why:why,
        payload:payload || {}, at:bugun,
      });
    };

    /* --- uzman masaları: kendi disiplininde --- */
    if(disc && ESP.Mod.isOn(disc)){
      const kapi = ESP.Curriculum.nextGate(disc);
      const d = ESP.DISCIPLINE_BY_ID[disc];

      /* Ölçülemeyen kapı → hatırlatıcı. Burada istenen şey çalışmak değil
         ölçmek; ölçüm bir kez yapılır ve unutulur, hatırlatıcı tam da bunun
         içindir. */
      if(kapi && kapi.action === 'measure'){
        ekle('reminder', d.label + ': «' + kapi.gate.label + '» ölçülsün',
          'Bu kapı ölçülemiyor; ölçüm yapılmadan kademe kanıtlanmaz.',
          { key:'gate', text:kapi.gate.label + ' için ölçüm gir',
            due:U.iso(U.addDays(U.parse(bugun), 1)), repeat:'none' });
      }

      /* Üniteler → desteye eklenmemiş ilk ünite. */
      const uniteler = ESP.Lesson.units(disc);
      const eksik = uniteler.filter(function(u){
        const p = ESP.Lesson.progress(u);
        return p.total > 0 && p.added === 0;
      })[0];
      if(eksik){
        ekle('unit', eksik.title + ' ünitesi desteye eklensin',
          'Bu ünitenin malzemesi var ama hiçbir kartı destede değil.',
          { key:eksik.id, unitId:eksik.id, disc:disc });
      }

      /* Bugünün reçetesinden işlenmemiş ilk egzersiz. */
      const r = ESP.Coach.prescribe(disc, { today:bugun });
      const yapilmamis = (r.items || []).filter(function(it){
        return (r.done || []).indexOf(it.drill.id) < 0; })[0];
      if(yapilmamis){
        ekle('drill', yapilmamis.drill.label + ' işlensin',
          'Bugünün reçetesinde duruyor ve gün kaydına henüz yazılmadı.',
          { key:yapilmamis.drill.id, drillId:yapilmamis.drill.id });
      }

      /* Açık hedefi olmayan disipline tarihli hedef önerisi. */
      const hedefVar = ESP.Model.openGoals().some(function(g){ return g.disc === disc; });
      const lv = ESP.Curriculum.levelOf(disc);
      if(!hedefVar && lv && lv.next && lv.next.step){
        ekle('goal', lv.next.step.proof,
          'Kademenin kapanış işi bu; tarihi olmayan iş ertelenir.',
          { key:'proof', label:lv.next.step.proof, disc:disc,
            date:U.iso(U.addDays(U.parse(bugun), 30)) });
      }
    }

    /* --- koç ve Patron: bütün disiplinlerin ortak işi --- */
    if(allowed(agentId, 'weekplan')){
      const denge = ESP.Planner.balance(7, bugun);
      if(denge.untouched.length){
        ekle('weekplan', 'Haftanın kalanına plan kurulsun',
          denge.untouched.map(function(d){ return d.label; }).join(', ')
            + ' bu hafta hiç açılmadı.',
          { key:'week' });
      }
      const taban = ESP.Coach.dailyBase();
      const r7 = ESP.Intellect.hoursOf(null, 7);
      if(r7.cert !== 'missing' && r7.enteredDays >= 4){
        const ort = r7.minutes / r7.enteredDays;
        if(ort < taban * 0.6){
          ekle('base', 'Günlük taban ' + Math.max(15, Math.round(ort / 5) * 5)
            + ' dakikaya çekilsin',
            'Son 7 günün ölçülmüş ortalaması ' + Math.round(ort) + ' dakika; '
              + 'taban ' + taban + '. Tutulmayan bir taban, reçeteyi okunmaz yapar.',
            { key:'down', minutes:Math.max(15, Math.round(ort / 5) * 5) });
        }else if(ort > taban * 1.5){
          ekle('base', 'Günlük taban ' + Math.round(ort / 5) * 5 + ' dakikaya çıksın',
            'Son 7 günün ortalaması tabanın bir buçuk katı; reçete olduğundan '
              + 'küçük yazılıyor.',
            { key:'up', minutes:Math.round(ort / 5) * 5 });
        }
      }
    }

    /* İki süzgeç, iki ayrı sebep:

       REDDEDİLEN teklif bir daha üretilmez — aynı öneriyi her gün tekrar
       sormak, öneriyi gürültüye çevirir.

       ONAYLANAN teklif ise, UYGULADIĞI ŞEY HÂLÂ DURUYORSA üretilmez. Bu
       ayrım şart: koşul (ölçülemeyen kapı) teklif onaylandıktan sonra da
       sürer — hatırlatıcı kurulmuş olması kapıyı ölçmüş olmaz. Süzgeç
       olmasaydı sistem her çizimde aynı hatırlatıcıyı yeniden önerir ve
       onaylayan kullanıcı yirmi kopya biriktirirdi.

       Uygulanan şey kapandığında (hatırlatıcı yapıldı, hedef tamamlandı,
       plan kaldırıldı) teklif yeniden üretilebilir hâle gelir — çünkü o
       zaman gerçekten yeniden gerekiyordur. */
    const karar = {};
    (S.proposals || []).forEach(function(p){ karar[p.id] = p; });

    return out.filter(function(p){
      const k = karar[p.id];
      if(!k) return true;
      if(k.state === 'declined') return false;
      if(k.state === 'accepted') return !stillApplied(k);
      return true;
    });
  }

  /* Onaylanmış bir teklifin uyguladığı şey hâlâ duruyor mu?

     Bilmediğimiz bir türü «duruyor» saymak, teklifi sonsuza dek susturmak
     olurdu; «durmuyor» saymak ise her gün yeniden sormak. İkisi arasında
     daha az zararlı olan ikincisidir: kullanıcı reddedebilir, ama hiç
     görmediği bir öneriyi geri getiremez. */
  function stillApplied(p){
    const a = p.applied;
    if(!a) return false;
    if(a.kind === 'reminder'){
      return (S.reminders || []).some(function(r){ return r.id === a.id && !r.done; });
    }
    if(a.kind === 'goal'){
      return (S.goals || []).some(function(g){ return g.id === a.id && !g.done; });
    }
    if(a.kind === 'unit'){
      const u = ESP.Lesson.unitOf(p.disc, a.unitId);
      return !!u && ESP.Lesson.progress(u).added > 0;
    }
    if(a.kind === 'drill'){
      return ESP.Coach.doneToday(p.disc).indexOf(p.payload.drillId) >= 0;
    }
    if(a.kind === 'weekplan') return !!plan();
    if(a.kind === 'base'){
      return (S.profile && S.profile.dailyMinutes) === a.minutes;
    }
    if(a.kind === 'focus'){
      return (S.profile && S.profile.focus) === a.focus;
    }
    return false;
  }

  /* Bütün açık masaların teklifleri. */
  function all(todayISO){
    return ESP.Memo.of('plans.all:' + (todayISO || U.todayISO()), function(){
      /* Kullanicinin onay bekleyen istekleri en ustte: onlari kullanici
         kendisi istedi, ajanin kendi bulgularindan once gelir. */
      return istekler().concat(ESP.Mod.activeAgents().reduce(function(acc, a){
        return acc.concat(proposalsFor(a.id, todayISO));
      }, []));
    });
  }

  function open_(){ return (S.proposals || []).filter(function(p){ return p.state === 'proposed'; }); }

  function record(id){
    return (S.proposals || []).filter(function(p){ return p.id === id; })[0] || null;
  }

  /* ------------------------------------------------------------ uygulama

     Uygulamayı KURAL MOTORU yapar. Model hiçbir aşamada veriye dokunmaz;
     bu fonksiyona bir metin değil TİPLİ bir nesne gelir. */
  /* Kullanıcı isteğinin ve bölüm/taban/odak tekliflerinin UYGULANMADAN
     ÖNCE denetimi. Hata değil RED: nedeni söylenir, hiçbir şey yazılmaz. */
  function dogrula(p){
    if(!p || !KIND_BY_ID[p.kind]) return { ok:false, error:'Bilinmeyen teklif türü.' };
    if(!allowed(p.agentId, p.kind)) return { ok:false, error:'Bu masa bu teklifi veremez.' };
    const y = p.payload || {};
    if(p.kind === 'bolum'){
      const d = (ESP.DISCIPLINE_BY_ID || {})[y.disc];
      if(!d) return { ok:false, error:'Bilinmeyen bölüm.' };
      const acik = ESP.Mod.isOn(y.disc);
      if(acik === !!y.on) return { ok:false, error:d.label + ' zaten ' + (acik ? 'açık.' : 'kapalı.') };
      if(!y.on){
        const kalan = ESP.Mod.activeIds().filter(id => id !== y.disc);
        if(!kalan.length) return { ok:false, error:'En az bir bölüm açık kalmalı. Önce başka bir bölümü aç.' };
      }
    }
    if(p.kind === 'base'){
      const dk = Number(y.minutes);
      if(!isFinite(dk) || dk < 10 || dk > 600) return { ok:false, error:'Günlük taban 10–600 dakika arasında olmalı.' };
      if(S.profile && S.profile.dailyMinutes === Math.round(dk)) return { ok:false, error:'Günlük taban zaten ' + Math.round(dk) + ' dakika.' };
    }
    if(p.kind === 'focus'){
      if(!(ESP.DISCIPLINE_BY_ID || {})[y.focus]) return { ok:false, error:'Bilinmeyen bölüm.' };
      if(!ESP.Mod.isOn(y.focus)) return { ok:false, error:'Kapalı bir bölüm odak olamaz; önce aç.' };
    }
    return { ok:true };
  }

  async function accept(prop){
    const p = typeof prop === 'string' ? (record(prop) || bul(prop)) : prop;
    if(!p) return { ok:false, error:'Teklif bulunamadı.' };
    if(!allowed(p.agentId, p.kind)){
      return { ok:false, error:'Bu masa bu teklifi veremez.' };
    }
    if(p.kind === 'bolum' || p.kind === 'base' || p.kind === 'focus'){
      const v = dogrula(p);
      if(!v.ok) return v;
    }

    let uygulanan = null;

    if(p.kind === 'bolum'){
      const onceki = ESP.Mod.isOn(p.payload.disc);
      const res = await ESP.Mod.set(p.payload.disc, !!p.payload.on);
      if(!res.ok) return res;
      uygulanan = { kind:'bolum', disc:p.payload.disc, on:!!p.payload.on, onceki };

    }else if(p.kind === 'reminder'){
      const res = await ESP.Model.saveReminder(ESP.Model.newReminder({
        disc:p.disc, text:p.payload.text, due:p.payload.due,
        repeat:p.payload.repeat || 'none' }));
      if(!res.ok) return res;
      uygulanan = { kind:'reminder', id:res.reminder.id };

    }else if(p.kind === 'goal'){
      const g = await ESP.Model.saveGoal(ESP.Model.newGoal({
        label:p.payload.label, disc:p.disc, date:p.payload.date,
        note:'Kademenin kapanış işi.' }));
      uygulanan = { kind:'goal', id:g.id };

    }else if(p.kind === 'unit'){
      const u = ESP.Lesson.unitOf(p.disc, p.payload.unitId);
      const res = await ESP.Lesson.addUnit(u);
      if(!res.ok) return res;
      uygulanan = { kind:'unit', added:res.added, unitId:p.payload.unitId };

    }else if(p.kind === 'drill'){
      const res = await ESP.Coach.logDrill(p.payload.drillId);
      if(!res.ok) return res;
      uygulanan = { kind:'drill', sessionId:res.session.id,
        date:res.session.date || U.todayISO() };

    }else if(p.kind === 'base'){
      /* Geri alma icin ONCEKI deger saklanir. */
      const onceki = S.profile ? S.profile.dailyMinutes : null;
      await ESP.Model.saveProfile({ dailyMinutes:Math.round(Number(p.payload.minutes)) });
      uygulanan = { kind:'base', minutes:Math.round(Number(p.payload.minutes)), onceki };

    }else if(p.kind === 'focus'){
      const onceki = S.profile ? S.profile.focus : null;
      await ESP.Model.saveProfile({ focus:p.payload.focus });
      uygulanan = { kind:'focus', focus:p.payload.focus, onceki:onceki == null ? null : onceki };

    }else if(p.kind === 'hedefplan'){
      /* Plan UYGULAMA ANINDA yeniden kurulur: önizlemeden bu yana veri
         değişmiş olabilir. */
      if(p.source !== 'istek') return { ok:false, error:'Hedef planı yalnız senin onayınla uygulanır.' };
      const h = ESP.Hedefler && ESP.Hedefler.liste().find(function(x){ return x.id === (p.payload || {}).hedefId; });
      if(!h || !ESP.HedefPlan) return { ok:false, error:'Hedef bulunamadı.' };
      if(ESP.HedefPlan.aktif(h.id)) return { ok:false, error:'Bu hedefin uygulanmış bir planı var; önce onu geri al.' };
      const kr = ESP.HedefPlan.kur(h, U.todayISO());
      if(!kr.ok) return { ok:false, error:kr.why };
      try{ uygulanan = await ESP.HedefPlan.uygula(kr.plan); }
      catch(e){ return { ok:false, error:String(e && e.message || e) }; }

    }else if(p.kind === 'weekplan'){
      const oncekiPlan = plan() ? JSON.parse(JSON.stringify(plan())) : null;
      const yeni = weekPlan(p.at);
      await savePlan(yeni);
      uygulanan = { kind:'weekplan', days:yeni.days.length, oncekiPlan };

    }else{
      return { ok:false, error:'Bilinmeyen teklif türü.' };
    }

    await write(Object.assign({}, p, { state:'accepted',
      decidedAt:new Date().toISOString(), applied:uygulanan }));
    if(ESP.Memo && ESP.Memo.bitir) ESP.Memo.bitir();
    return { ok:true, applied:uygulanan };
  }

  /* ------------------------------------------------------------ geri alma

     Uygulanan her iş `applied` içinde NE YAPTIĞINI ve (değiştirdiyse)
     ÖNCEKİ değeri taşır; geri alma o kayıttan yapılır. Ünite geri
     alınamaz: eklenen kartlar o sırada tekrar edilmiş olabilir — bu
     yüzden ünite ORTA seviyededir ve hiçbir koşulda sormadan uygulanmaz. */
  async function geriAl(id){
    const p = record(id);
    if(!p || p.state !== 'accepted' || !p.applied) return { ok:false, error:'Geri alınacak bir şey yok.' };
    const a = p.applied;
    if(a.kind === 'reminder') await ESP.Model.deleteReminder(a.id);
    else if(a.kind === 'goal') await ESP.Model.deleteGoal(a.id);
    else if(a.kind === 'drill') await ESP.Model.deleteSession(a.date || U.todayISO(), a.sessionId);
    else if(a.kind === 'base') await ESP.Model.saveProfile({ dailyMinutes:a.onceki });
    else if(a.kind === 'focus') await ESP.Model.saveProfile({ focus:a.onceki });
    else if(a.kind === 'weekplan'){ if(a.oncekiPlan) await savePlan(a.oncekiPlan); else await clearPlan(); }
    else if(a.kind === 'hedefplan' && ESP.HedefPlan) await ESP.HedefPlan.geriAl(a);
    else if(a.kind === 'bolum'){
      const res = await ESP.Mod.set(a.disc, !!a.onceki);
      if(!res.ok) return res;
    }
    else return { ok:false, error:'Bu iş geri alınamaz; elle düzeltmen gerekir.' };
    await write(Object.assign({}, p, { state:'undone', undoneAt:new Date().toISOString() }));
    if(ESP.Memo && ESP.Memo.bitir) ESP.Memo.bitir();
    return { ok:true, kind:a.kind };
  }

  /* ------------------------------------------------- kullanıcının isteği

     «Diksiyon çalışmak istemiyorum», «günlük taban 45 dakika» — ajan
     değil KULLANICI istiyor. İstek Patron'un masasından geçer (yetki
     onundur), aynı doğrulamadan geçer ve seviyesi küçükse hemen
     uygulanır (AGENTS.md §1.9). Orta ise «proposed» olarak durur ve
     teklif listesinde onay bekler. */
  const MODLAR = ['istek', 'hepsi', 'hicbiri'];

  function otomatikMi(row, mod){
    if(!row || row.level !== 'kucuk') return false;
    /* Vitrin 116 — TÜR AYARI moddan önce gelir: kullanıcı bir küçük türü
       açık ya da kapalı işaretlediyse o geçerlidir (AGENTS §1.9: «hangi
       küçük türlerin sormadan uygulanacağını kullanıcı ayarlar»). */
    const tur = turAyari()[row.action || row.kind];
    if(tur === true || tur === false) return tur;
    const m = MODLAR.indexOf(mod) >= 0 ? mod : 'istek';
    if(m === 'hicbiri') return false;
    if(m === 'hepsi') return true;
    return row.source === 'istek';
  }

  function turAyari(){
    try{
      const st = ESP.Office && typeof ESP.Office.settings === 'function' ? ESP.Office.settings() : null;
      return (st && st.otomatikTurler && typeof st.otomatikTurler === 'object') ? st.otomatikTurler : {};
    }catch(e){ return {}; }
  }

  function ayar(){
    try{
      const st = ESP.Office && typeof ESP.Office.settings === 'function' ? ESP.Office.settings() : null;
      return (st && st.otomatikUygula) || 'istek';
    }catch(e){ return 'istek'; }
  }

  function baslik(kind, y){
    const d = (ESP.DISCIPLINE_BY_ID || {})[y.disc || y.focus] || {};
    if(kind === 'bolum') return (d.label || 'Bölüm') + ' bölümü ' + (y.on ? 'açılsın' : 'kapansın');
    if(kind === 'base') return 'Günlük taban ' + Math.round(Number(y.minutes)) + ' dakika olsun';
    if(kind === 'focus') return 'Odak ' + (d.label || y.focus) + ' olsun';
    return (KIND_BY_ID[kind] || {}).label || kind;
  }

  async function talep(req){
    const r = req || {};
    const kind = KIND_BY_ID[r.kind];
    const y = r.payload || {};
    const p = {
      id:'i:' + U.uid('t'), agentId:r.agentId || 'patron', kind:r.kind,
      disc:y.disc || null, title:baslik(r.kind, y),
      why:r.metin ? 'Senin isteğin: «' + String(r.metin).slice(0, 120) + '»' : 'Senin isteğin.',
      payload:y, at:U.todayISO(), source:'istek', level:kind ? kind.level : 'orta',
    };
    const v = dogrula(p);
    if(!v.ok) return { row:null, otomatik:false, why:v.error };
    if(otomatikMi(p, ayar())){
      const a = await accept(p);
      if(!a.ok) return { row:null, otomatik:false, why:a.error };
      return { row:record(p.id), otomatik:true, why:null };
    }
    await write(Object.assign({}, p, { state:'proposed' }));
    if(ESP.Memo && ESP.Memo.bitir) ESP.Memo.bitir();
    return { row:record(p.id), otomatik:false, why:null };
  }

  /* Onay bekleyen kullanıcı istekleri — teklif listesinde görünür. */
  function istekler(){
    return (S.proposals || []).filter(function(p){
      return p.source === 'istek' && p.state === 'proposed'; });
  }

  /* `gecme`: vitrin 123 — kullanıcının söylediği neden (isteğe bağlı). */
  async function decline(prop, gecme){
    const p = typeof prop === 'string' ? (record(prop) || bul(prop)) : prop;
    if(!p) return { ok:false, error:'Teklif bulunamadı.' };
    await write(Object.assign({}, p, { state:'declined',
      decidedAt:new Date().toISOString() }, gecme ? { gecme } : {}));
    return { ok:true };
  }

  function bul(id){
    return all().filter(function(p){ return p.id === id; })[0] || null;
  }

  async function write(rec){
    const i = (S.proposals || []).findIndex(function(x){ return x.id === rec.id; });
    if(i >= 0) S.proposals[i] = rec; else S.proposals.unshift(rec);
    await ESP.Store.set('proposals/' + encodeURIComponent(rec.id), rec);
    return rec;
  }

  /* --------------------------------------------------------- haftalık plan

     Plan bir TAKVİM DEĞİLDİR: «salı 19:00'da gitar» demek sistemin işi
     değil. Haftanın kalan günlerine hangi disiplinin düştüğünü söyler ve
     sırayı `ESP.Planner.weeklyRoute()` verir — burada yeni bir karar
     üretilmez, var olan sıra güne dağıtılır. */
  function weekPlan(todayISO){
    const bugun = todayISO || U.todayISO();
    const rota = ESP.Planner.weeklyRoute(bugun);
    const sirali = (rota.rows || []).map(function(r){ return r.disc; });
    if(!sirali.length) return { from:bugun, days:[], cert:'missing' };

    const kalan = [];
    const d0 = U.parse(bugun);
    for(let i = 0; i < 7; i++){
      kalan.push(U.iso(U.addDays(d0, i)));
    }
    return {
      from:bugun, cert:rota.cert,
      days:kalan.map(function(g, i){
        const disc = sirali[i % sirali.length];
        const r = ESP.Coach.prescribe(disc.id, { today:g });
        return {
          date:g, disc:disc.id, label:disc.label, route:disc.route,
          minutes:r.minutes,
          items:(r.items || []).map(function(x){
            return { id:x.drill.id, label:x.drill.label, minutes:x.drill.minutes }; }),
        };
      }),
    };
  }

  async function savePlan(plan){
    S.weekPlan = plan;
    await ESP.Store.set('weekplan', plan);
    return plan;
  }

  function plan(){ return S.weekPlan || null; }

  async function clearPlan(){
    S.weekPlan = null;
    await ESP.Store.remove('weekplan');
  }

  /* Planın bugünkü satırı — Bugün ekranı bunu gösterir. */
  function today(todayISO){
    const p = plan();
    if(!p) return null;
    const g = todayISO || U.todayISO();
    return (p.days || []).filter(function(x){ return x.date === g; })[0] || null;
  }

  return { KINDS, KIND_BY_ID, allowed, discOf, stillApplied,
    proposalsFor, all, open:open_, record, accept, decline,
    dogrula, geriAl, talep, istekler, otomatikMi, ayar, turAyari, MODLAR,
    weekPlan, savePlan, plan, clearPlan, today };
})();
