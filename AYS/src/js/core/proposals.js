/* Öneri kutusu — ofisin sisteme dokunabildiği tek kapı.

   Ofis bugüne kadar yalnizca okuyordu. Artik yazabilir, ama tek bir yoldan:

     ajan onerir → kural motoru DOGRULAR → kullanici ONAYLAR → motor uygular
                                                            → geri alinabilir

   Onaysiz hicbir sey degismez. Bu dosyada "otomatik uygula" diye bir yol
   YOKTUR ve olmamalidir: ofisin degeri onerisinde, yetkisinde degil.

   Iki oneri kaynagi vardir ve ikisi de ayni kapidan gecer:

     suggest()          kural motoru: veriden kendisi cikarir, model gerekmez,
                        cevrimdisi calisir, kota harcamaz
     fromModel(...)     ajanin onerisi: KAPALI katalogdan bir eylem + yapisal
                        parametre. Serbest metin eyleme donusmez; parametreler
                        gercek veriye karsi dogrulanir, uydurulan duser.

   Dogrulama (check) her zaman calisir — onerinin kaynagi ne olursa olsun.
   Model "kapanmis konuyu tekrara al" derken var olmayan bir konu kimligi
   uydurursa oneri kullaniciya hic gosterilmez.

   Uygulama sirasi kasitlidir: once anlik goruntu alinir (undo), sonra
   degisiklik yazilir. Boylece geri alma her zaman mumkundur. */

window.R = window.R || {};

R.Proposals = (function(){
  const U = R.U, M = R.Model, S = R.S;

  const MAX = 40;             // saklanan oneri (uygulanan + reddedilen dahil)
  const STORE = 'office/proposals';

  /* ==================== eylem uygulamalari ====================

     Her eylemin dort islevi vardir ve dordu de ayrilir:
       check   : uygulanabilir mi — hayirsa NEDEN (kullaniciya gosterilir)
       preview : ne degisecek — once/sonra satirlari
       apply   : degisikligi yazar, geri alma anlik goruntusunu DONDURUR
       revert  : o anlik goruntuden geri alir

     check her cagrida yeniden calisir: bekleyen bir oneri, arada veri
     degistigi icin gecersizlesmis olabilir. */

  function subjectOf(id){ return (R.SUBJECTS || []).find(s => s.id === id) || null; }
  function topicOf(subject, id){
    return subject ? (subject.topics || []).find(t => t.id === id) || null : null;
  }
  function stateLabel(id){
    const st = R.TOPIC_STATES[id];
    return st ? st.label : String(id || '—');
  }
  function fail(why){ return { ok:false, why }; }
  function pass(ctx){ return { ok:true, ctx:ctx || {} }; }

  const IMPL = {

    'topic-review':{
      check(p){
        const subject = subjectOf(p.subjectId);
        if(!subject) return fail('Bu ders sistemde yok.');
        const topic = topicOf(subject, p.topicId);
        if(!topic) return fail('Bu konu bu derste yok.');
        const st = M.topicState(p.subjectId, p.topicId);
        if(st.state !== 'closed' && st.state !== 'provisional'){
          return fail('Konu zaten kapalı sayılmıyor; tekrara almanın etkisi olmaz.');
        }
        return pass({ subject, topic, from:st.state });
      },
      preview(p, ctx){
        return [
          { label:'Konu', before:ctx.subject.name, after:ctx.topic.name },
          { label:'Durum', before:stateLabel(ctx.from), after:stateLabel('reopened') },
        ];
      },
      async apply(p, ctx){
        await M.setTopicState(p.subjectId, p.topicId, { state:'reopened' });
        return { subjectId:p.subjectId, topicId:p.topicId, state:ctx.from };
      },
      async revert(s){
        await M.setTopicState(s.subjectId, s.topicId, { state:s.state });
      },
    },

    'block-add':{
      check(p){
        const subject = subjectOf(p.subjectId);
        if(!subject) return fail('Bu ders sistemde yok.');
        const topic = topicOf(subject, p.topicId);
        if(!topic) return fail('Bu konu bu derste yok.');
        const min = Math.round(Number(p.minutes) || 0);
        if(!(min >= 15 && min <= 120)) return fail('Blok süresi 15–120 dakika arasında olmalı.');
        const day = M.dayOf(U.todayISO());
        if(!day) return fail('Bugünün planı henüz açılmadı.');
        return pass({ subject, topic, min, day });
      },
      preview(p, ctx){
        const blocks = ctx.day.blocks || [];
        const sum = blocks.reduce((a, b) => a + (Number(b.targetMin) || 0), 0);
        return [
          { label:'Eklenecek blok', before:'—', after:ctx.subject.name + ' · ' + ctx.topic.name },
          { label:'Bugünkü blok sayısı', before:String(blocks.length), after:String(blocks.length + 1) },
          { label:'Bugünkü hedef süre', before:sum + ' dk', after:(sum + ctx.min) + ' dk' },
        ];
      },
      async apply(p, ctx){
        const date = U.todayISO();
        const day = await M.ensureDay(date);
        const id = U.uid('b');
        day.blocks.push({
          id, slot:'Ek tekrar',
          subject:ctx.subject.name, topic:ctx.topic.name,
          targetMin:ctx.min, targetQ:0, status:'pending',
          subjectId:p.subjectId, topicId:p.topicId,
          actualMin:null, actualQ:null, correctQ:null,
          skipReason:null, startedAt:null,
        });
        await M.saveDay(date);
        return { date, blockId:id };
      },
      async revert(s){
        const day = M.dayOf(s.date);
        if(!day) return;
        day.blocks = (day.blocks || []).filter(b => b.id !== s.blockId);
        await M.saveDay(s.date);
      },
    },

    'cards-due-today':{
      check(p){
        const limit = Math.round(Number(p.limit) || 0);
        if(!(limit >= 1 && limit <= 50)) return fail('Kart sayısı 1–50 arasında olmalı.');
        const today = U.todayISO();
        const late = (S.cards || [])
          .filter(c => c.dueAt && c.dueAt < today)
          .sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)))
          .slice(0, limit);
        if(!late.length) return fail('Geciken tekrar kartı yok.');
        return pass({ late, today });
      },
      preview(p, ctx){
        const oldest = ctx.late[0];
        return [
          { label:'Bugüne çekilecek kart', before:'—', after:ctx.late.length + ' kart' },
          { label:'En eski gecikme', before:U.fmtShort(oldest.dueAt), after:'bugün' },
        ];
      },
      async apply(p, ctx){
        const before = [];
        for(const c of ctx.late){
          before.push({ id:c.id, dueAt:c.dueAt });
          c.dueAt = ctx.today;
          await M.saveCard(c);
        }
        return { cards:before };
      },
      async revert(s){
        for(const row of (s.cards || [])){
          const c = (S.cards || []).find(x => x.id === row.id);
          if(!c) continue;
          c.dueAt = row.dueAt;
          await M.saveCard(c);
        }
      },
    },

    'card-from-error':{
      check(p){
        const err = (S.errors || []).find(e => e.id === p.errorId);
        if(!err) return fail('Bu yanlış kaydı bulunamadı.');
        if(err.closedAt) return fail('Bu yanlış zaten kapanmış.');
        const back = String(err.principle || err.recipe || '').trim();
        if(!back) return fail('Kayıtta ilke ya da reçete yazılmamış; karta dönüştürülemez.');
        const already = (S.cards || []).some(c => c.sourceRef === err.id);
        if(already) return fail('Bu yanlıştan zaten kart üretilmiş.');
        return pass({ err, back });
      },
      preview(p, ctx){
        const front = cardFront(ctx.err);
        return [
          { label:'Kartın ön yüzü', before:'—', after:front },
          { label:'Kartın arkası', before:'—', after:ctx.back.slice(0, 90) },
          { label:'İlk tekrar', before:'—', after:'yarın' },
        ];
      },
      async apply(p, ctx){
        const card = M.newCard({
          front:cardFront(ctx.err),
          back:ctx.back,
          topic:ctx.err.topic || ctx.err.testName || '',
          subjectId:ctx.err.subjectId || null,
          source:'office', sourceRef:ctx.err.id,
        });
        await M.saveCard(card);
        return { cardId:card.id };
      },
      async revert(s){ await M.deleteCard(s.cardId); },
    },

    'week-target':{
      check(p){
        const n = Math.round(Number(p.weekN) || 0);
        const q = Math.round(Number(p.questionTarget) || 0);
        if(!(n >= 1 && n <= R.PLAN.totalWeeks)) return fail('Hafta numarası plan dışında.');
        if(!(q >= 100 && q <= 3000)) return fail('Haftalık hedef 100–3000 soru arasında olmalı.');
        const week = S.weeks[M.weekId(n)];
        if(!week) return fail(n + '. hafta henüz açılmadı.');
        if(Number(week.questionTarget) === q) return fail('Hedef zaten bu değerde.');
        return pass({ week, n, q });
      },
      preview(p, ctx){
        return [
          { label:'Hafta', before:'—', after:ctx.n + '. hafta' },
          { label:'Soru hedefi', before:ctx.week.questionTarget + ' soru', after:ctx.q + ' soru' },
        ];
      },
      async apply(p, ctx){
        const before = ctx.week.questionTarget;
        ctx.week.questionTarget = ctx.q;
        await M.saveWeek(ctx.n);
        return { n:ctx.n, questionTarget:before };
      },
      async revert(s){
        const week = S.weeks[M.weekId(s.n)];
        if(!week) return;
        week.questionTarget = s.questionTarget;
        await M.saveWeek(s.n);
      },
    },

    'decision-close':{
      check(p){
        const state = p.state === 'carried' ? 'carried' : 'done';
        const d = R.Office.openDecisions().find(x => x.id === p.decisionId);
        if(!d) return fail('Bu karar açık değil ya da bulunamadı.');
        return pass({ d, state });
      },
      preview(p, ctx){
        return [
          { label:'Karar', before:'—', after:ctx.d.title },
          { label:'Durum', before:'açık', after:ctx.state === 'done' ? 'yapıldı' : 'devredildi' },
        ];
      },
      async apply(p, ctx){
        await R.Office.closeDecision(p.decisionId, ctx.state);
        return { id:p.decisionId };
      },
      async revert(s){ await R.Office.closeDecision(s.id, 'open'); },
    },

    /* ==================== KONUŞARAK VERİ GİRİŞİ ====================

       Yukarıdaki eylemler PLAN eylemleridir: konuyu tekrara al, blok
       ekle, hedefi değiştir. Aşağıdakiler ise HAM VERİ girişidir —
       «bugün matematikten 40 soru çözdüm» cümlesinin karşılığı.

       İkisi aynı kapıdan geçer ve geçmelidir: öneri → doğrulama →
       onay → uygulama → geri alma. Veri girişine ayrı ve daha gevşek
       bir yol açmak, sistemin en çok kullanılan yolunu en az
       korunan yol yapardı. */

    'soru-yaz':{
      check(p){
        const n = Number(p.count);
        if(!isFinite(n) || n <= 0) return fail('Soru sayısı yok.');
        if(n > 1000) return fail(n + ' soru bir gün için fazla; yanlış anlaşılmış olabilir.');
        let dogru = p.correct == null ? null : Number(p.correct);
        if(dogru != null && (!isFinite(dogru) || dogru < 0)) dogru = null;
        if(dogru != null && dogru > n) return fail('Doğru sayısı çözülenden fazla olamaz.');
        const subject = p.subjectId ? (R.SUBJECTS || []).find(x => x.id === p.subjectId) : null;
        if(p.subjectId && !subject) return fail('Bu ders sistemde yok.');
        const day = R.S.days[p.date];
        if(!day) return fail('O günün kaydı henüz açılmamış.');
        /* Derse bagli bir blok varsa oraya yazilir; yoksa gunun
           serbest sorusuna eklenir. Uydurma blok ACILMAZ. */
        const blok = subject
          ? (day.blocks || []).find(b => b.subjectId === subject.id
              || (b.subject && R.U.norm(b.subject) === R.U.norm(subject.name)))
          : null;
        return pass({ n:Math.round(n), dogru:dogru == null ? null : Math.round(dogru),
          subject, blok, day });
      },
      preview(p, ctx){
        const nereye = ctx.blok ? ctx.blok.topic || ctx.blok.subject : 'Gün toplamı';
        const once = ctx.blok ? (ctx.blok.actualQ == null ? 'girilmemiş' : String(ctx.blok.actualQ))
          : String(ctx.day.freeQ || 0);
        const sonra = ctx.blok ? String((Number(ctx.blok.actualQ) || 0) + ctx.n)
          : String((ctx.day.freeQ || 0) + ctx.n);
        const rows = [{ label:nereye + ' · soru', before:once, after:sonra }];
        if(ctx.dogru != null){
          const varOlan = ctx.blok ? ctx.blok.correctQ : ctx.day.freeCorrect;
          rows.push({ label:'Doğru',
            before:varOlan == null ? 'girilmemiş' : String(varOlan),
            after:String((Number(varOlan) || 0) + ctx.dogru) });
        }
        return rows;
      },
      async apply(p, ctx){
        const geri = { date:p.date, blockId:ctx.blok ? ctx.blok.id : null,
          eskiQ:ctx.blok ? ctx.blok.actualQ : (ctx.day.freeQ || 0),
          eskiC:ctx.blok ? ctx.blok.correctQ : (ctx.day.freeCorrect || 0) };
        if(ctx.blok){
          ctx.blok.actualQ = (Number(ctx.blok.actualQ) || 0) + ctx.n;
          if(ctx.dogru != null) ctx.blok.correctQ = (Number(ctx.blok.correctQ) || 0) + ctx.dogru;
          if(ctx.blok.status === 'pending') ctx.blok.status = 'done';
        }else{
          ctx.day.freeQ = (ctx.day.freeQ || 0) + ctx.n;
          /* Blok yoksa dogru sayisi da gunun toplamina yazilir. Onceden
             DUSUYORDU: onizleme «dogru: 32 yazilacak» diyor ama kayit
             yalniz bloga gidiyordu. Onizlemenin verdigi soz tutulmali. */
          if(ctx.dogru != null) ctx.day.freeCorrect = (ctx.day.freeCorrect || 0) + ctx.dogru;
        }
        await R.Model.saveDay(p.date);
        return geri;
      },
      async revert(s){
        const day = R.S.days[s.date];
        if(!day) return;
        if(s.blockId){
          const b = (day.blocks || []).find(x => x.id === s.blockId);
          if(b){ b.actualQ = s.eskiQ; b.correctQ = s.eskiC; }
        }else{ day.freeQ = s.eskiQ; day.freeCorrect = s.eskiC; }
        await R.Model.saveDay(s.date);
      },
    },

    'paragraf-yaz':{
      check(p){
        const n = Number(p.count);
        if(!isFinite(n) || n <= 0 || n > 500) return fail('Paragraf sayısı anlaşılmadı.');
        const day = R.S.days[p.date];
        if(!day) return fail('O günün kaydı henüz açılmamış.');
        return pass({ n:Math.round(n), day });
      },
      preview(p, ctx){
        return [{ label:'Paragraf', before:String(ctx.day.paragraphActual || 0),
          after:String((ctx.day.paragraphActual || 0) + ctx.n) }];
      },
      async apply(p, ctx){
        const geri = { date:p.date, eski:ctx.day.paragraphActual || 0 };
        ctx.day.paragraphActual = (ctx.day.paragraphActual || 0) + ctx.n;
        await R.Model.saveDay(p.date);
        return geri;
      },
      async revert(s){
        const day = R.S.days[s.date];
        if(!day) return;
        day.paragraphActual = s.eski;
        await R.Model.saveDay(s.date);
      },
    },

    'problem-yaz':{
      check(p){
        const n = Number(p.count);
        if(!isFinite(n) || n <= 0 || n > 500) return fail('Problem sayısı anlaşılmadı.');
        const day = R.S.days[p.date];
        if(!day) return fail('O günün kaydı henüz açılmamış.');
        return pass({ n:Math.round(n), day });
      },
      preview(p, ctx){
        return [{ label:'Problem', before:String(ctx.day.problemActual || 0),
          after:String((ctx.day.problemActual || 0) + ctx.n) }];
      },
      async apply(p, ctx){
        const geri = { date:p.date, eski:ctx.day.problemActual || 0 };
        ctx.day.problemActual = (ctx.day.problemActual || 0) + ctx.n;
        await R.Model.saveDay(p.date);
        return geri;
      },
      async revert(s){
        const day = R.S.days[s.date];
        if(!day) return;
        day.problemActual = s.eski;
        await R.Model.saveDay(s.date);
      },
    },

    'uyku-yaz':{
      check(p){
        const h = Number(p.hours);
        if(!isFinite(h) || h <= 0 || h > 24) return fail('Uyku süresi anlaşılmadı.');
        const day = R.S.days[p.date];
        if(!day) return fail('O günün kaydı henüz açılmamış.');
        return pass({ h, day });
      },
      preview(p, ctx){
        return [{ label:'Uyku',
          before:ctx.day.sleepHours == null ? 'girilmemiş' : ctx.day.sleepHours + ' saat',
          after:ctx.h + ' saat' }];
      },
      async apply(p, ctx){
        const geri = { date:p.date, eski:ctx.day.sleepHours };
        ctx.day.sleepHours = ctx.h;
        await R.Model.saveDay(p.date);
        return geri;
      },
      async revert(s){
        const day = R.S.days[s.date];
        if(!day) return;
        day.sleepHours = s.eski;
        await R.Model.saveDay(s.date);
      },
    },

    'sure-yaz':{
      check(p){
        const dk = Number(p.minutes);
        if(!isFinite(dk) || dk <= 0) return fail('Süre yok.');
        if(dk > 960) return fail(dk + ' dakika bir blok için fazla.');
        const subject = (R.SUBJECTS || []).find(x => x.id === p.subjectId);
        if(!subject) return fail('Bu ders sistemde yok.');
        const day = R.S.days[p.date];
        if(!day) return fail('O günün kaydı henüz açılmamış.');
        const blok = (day.blocks || []).find(b => b.subjectId === subject.id
          || (b.subject && R.U.norm(b.subject) === R.U.norm(subject.name)));
        if(!blok) return fail(subject.name + ' için bugün planlanmış bir blok yok.');
        return pass({ dk:Math.round(dk), subject, blok });
      },
      preview(p, ctx){
        return [{ label:(ctx.blok.topic || ctx.subject.name) + ' · süre',
          before:ctx.blok.actualMin == null ? 'girilmemiş' : ctx.blok.actualMin + ' dk',
          after:((Number(ctx.blok.actualMin) || 0) + ctx.dk) + ' dk' }];
      },
      async apply(p, ctx){
        const geri = { date:p.date, blockId:ctx.blok.id, eski:ctx.blok.actualMin };
        ctx.blok.actualMin = (Number(ctx.blok.actualMin) || 0) + ctx.dk;
        if(ctx.blok.status === 'pending') ctx.blok.status = 'done';
        await R.Model.saveDay(p.date);
        return geri;
      },
      async revert(s){
        const day = R.S.days[s.date];
        if(!day) return;
        const b = (day.blocks || []).find(x => x.id === s.blockId);
        if(b) b.actualMin = s.eski;
        await R.Model.saveDay(s.date);
      },
    },
  };

  function cardFront(err){
    const head = err.topic || err.testName || 'Yanlış';
    const root = String(err.rootCause || '').trim();
    return root ? head + ' — ' + root : head;
  }

  /* ==================== dogrulama ==================== */

  /* Bir onerinin su anda uygulanabilir olup olmadigi. Bekleyen oneri de
     her cizimde yeniden gecer: arada veri degismis olabilir. */
  function check(p){
    const def = R.ACTION_BY_ID[p && p.action];
    if(!def) return fail('Bilinmeyen eylem.');
    if(def.agents.indexOf(p.agent) < 0){
      return fail(agentName(p.agent) + ' bu eylemi öneremez; alanı dışında.');
    }
    const impl = IMPL[def.id];
    if(!impl) return fail('Bu eylemin uygulaması yok.');
    try{ return impl.check(p.params || {}); }
    catch(e){ return fail('Öneri doğrulanamadı.'); }
  }

  /* Ne degisecek — onaydan ONCE gosterilir. */
  function preview(p){
    const res = check(p);
    if(!res.ok) return { ok:false, why:res.why, rows:[] };
    const impl = IMPL[p.action];
    try{ return { ok:true, rows:impl.preview(p.params || {}, res.ctx) || [] }; }
    catch(e){ return { ok:false, why:'Önizleme üretilemedi.', rows:[] }; }
  }

  function agentName(id){
    const a = R.AGENT_BY_ID[id];
    return a ? a.name : 'Bu ajan';
  }

  /* ==================== depo ==================== */

  function all(){ return (S.officeProposals || []).slice(); }
  function pending(){ return all().filter(p => p.status === 'pending'); }
  function applied(){ return all().filter(p => p.status === 'applied'); }

  /* Gecerliligini yitirmis bekleyen oneriler kullaniciya gosterilmez:
     veri degistiyse oneri de gecersizdir. */
  function actionable(){
    return pending().map(p => Object.assign({}, p, { preview:preview(p) }))
      .filter(p => p.preview.ok);
  }

  async function save(){
    S.officeProposals = (S.officeProposals || []).slice(-MAX);
    await R.Store.set(STORE, { items:S.officeProposals });
    return S.officeProposals;
  }

  async function load(){
    const doc = await R.Store.get(STORE);
    S.officeProposals = (doc && Array.isArray(doc.items)) ? doc.items : [];
    return S.officeProposals;
  }

  /* Ayni eylem+parametre ikinci kez kuyruga girmez. */
  function fingerprint(p){
    return p.action + '|' + JSON.stringify(p.params || {});
  }

  async function propose(p){
    const res = check(p);
    if(!res.ok) return null;
    S.officeProposals = S.officeProposals || [];
    const fp = fingerprint(p);
    if(S.officeProposals.some(x => x.status === 'pending' && fingerprint(x) === fp)) return null;

    const row = {
      id:U.uid('p'),
      action:p.action,
      agent:p.agent,
      params:p.params || {},
      reason:String(p.reason || '').slice(0, 240),
      source:p.source === 'llm' ? 'llm' : 'kural',
      at:new Date().toISOString(),
      status:'pending',
      appliedAt:null,
      undo:null,
    };
    S.officeProposals.push(row);
    await save();
    return row;
  }

  /* ==================== onay ==================== */

  async function approve(id){
    const row = (S.officeProposals || []).find(p => p.id === id);
    if(!row || row.status !== 'pending') return null;
    /* Onay anında yeniden dogrula: kullanici oneriyi gordukten sonra
       veri degismis olabilir, eski dogrulamaya guvenilmez. */
    const res = check(row);
    if(!res.ok){
      row.status = 'stale';
      row.why = res.why;
      await save();
      return { ok:false, why:res.why };
    }
    const impl = IMPL[row.action];
    /* Once anlik goruntu, sonra yazma: geri alma her zaman mumkun olmali. */
    row.undo = await impl.apply(row.params || {}, res.ctx);
    row.status = 'applied';
    row.appliedAt = new Date().toISOString();
    await save();
    return { ok:true, row };
  }

  async function reject(id){
    const row = (S.officeProposals || []).find(p => p.id === id);
    if(!row || row.status !== 'pending') return null;
    row.status = 'rejected';
    await save();
    return row;
  }

  async function undo(id){
    const row = (S.officeProposals || []).find(p => p.id === id);
    if(!row || row.status !== 'applied') return null;
    const impl = IMPL[row.action];
    await impl.revert(row.undo || {});
    row.status = 'undone';
    row.undoneAt = new Date().toISOString();
    await save();
    return row;
  }

  async function clearResolved(){
    S.officeProposals = (S.officeProposals || []).filter(p => p.status === 'pending');
    await save();
  }

  /* ==================== kural motoru onerileri ====================

     Model gerekmez, kota harcanmaz, cevrimdisi calisir. Masa notlariyla
     ayni doktrin: esik asilirsa oneri dogar, asilmazsa dogmaz. */

  function suggest(){
    const out = [];
    const today = U.todayISO();

    /* 1. Geciken tekrar borcu — analistin alani. */
    const late = (S.cards || []).filter(c => c.dueAt && c.dueAt < today);
    if(late.length >= 5){
      out.push({
        action:'cards-due-today', agent:'analist', source:'kural',
        params:{ limit:Math.min(late.length, 30) },
        reason:late.length + ' kartın tekrar tarihi geçmiş; borç ertelendikçe büyüyor.',
      });
    }

    /* 2. Kok nedeni yazilmis ama karta donmemis yanlis. */
    const orphan = (S.errors || []).find(e => !e.closedAt
      && String(e.principle || e.recipe || '').trim()
      && !(S.cards || []).some(c => c.sourceRef === e.id));
    if(orphan){
      out.push({
        action:'card-from-error', agent:'analist', source:'kural',
        params:{ errorId:orphan.id },
        reason:'Kök nedeni yazılmış bu yanlış karta dönmemiş; tekrar edilmezse yine yapılır.',
      });
    }

    /* 3. Kapali gorunen ama acik yanlisi olan konu — brans uzmaninin alani. */
    (R.SUBJECTS || []).forEach(subject => {
      const owner = subject.exam === 'TYT' ? 'tyt' : 'ayt';
      (subject.topics || []).forEach(topic => {
        const st = M.topicState(subject.id, topic.id);
        if(st.state !== 'closed' && st.state !== 'provisional') return;
        const openErrors = (S.errors || []).filter(e => !e.closedAt
          && e.subjectId === subject.id && e.topicId === topic.id).length;
        if(openErrors < 2) return;
        out.push({
          action:'topic-review', agent:owner, source:'kural',
          params:{ subjectId:subject.id, topicId:topic.id },
          reason:topic.name + ' kapalı görünüyor ama üzerinde ' + openErrors
            + ' açık yanlış var; kapanış gerçek değil.',
        });
      });
    });

    /* Dogrulanmayan oneri hic dogmaz. */
    return out.filter(p => check(p).ok);
  }

  /* Kural motorunun buldugu onerileri kuyruga alir; var olanlar tekrarlanmaz. */
  async function refresh(){
    const found = suggest();
    const added = [];
    for(const p of found){
      const row = await propose(p);
      if(row) added.push(row);
    }
    return added;
  }

  /* ==================== modelin onerisi ====================

     Ajan yaniti bir JSON nesnesi tasiyabilir. Nesne kapali kataloga ve
     yapisal parametreye uymuyorsa sessizce dusurulur — model bir eylem
     UYDURAMAZ, yalnizca var olanlardan birini secebilir. */

  function fromModel(agentId, obj){
    if(!obj || typeof obj !== 'object') return null;
    const def = R.ACTION_BY_ID[obj.eylem || obj.action];
    if(!def) return null;
    if(def.agents.indexOf(agentId) < 0) return null;

    /* Parametreler semadan okunur: fazladan alan tasinmaz. */
    const raw = obj.parametreler || obj.params || {};
    const params = {};
    let missing = false;
    Object.keys(def.params).forEach(key => {
      const want = def.params[key];
      const v = raw[key];
      if(v == null || v === ''){ missing = true; return; }
      if(want === 'number'){
        const n = Number(v);
        if(!Number.isFinite(n)){ missing = true; return; }
        params[key] = n;
      }else{
        params[key] = String(v).slice(0, 120);
      }
    });
    if(missing) return null;

    const p = {
      action:def.id, agent:agentId, params, source:'llm',
      reason:String(obj.gerekce || obj.reason || '').slice(0, 240),
    };
    return check(p).ok ? p : null;
  }

  /* Ajana katalogu anlatan istem parcasi. Ekran degil motor kurar:
     katalog degisirse istem kendiliginden degisir. */
  function catalogPrompt(agentId){
    const list = R.actionsFor(agentId);
    if(!list.length) return '';
    return 'SİSTEME MÜDAHALE (isteğe bağlı):\n'
      + 'Aşağıdaki eylemlerden biri durumu düzeltecekse yanıtının SONUNA tek bir '
      + 'JSON nesnesi ekleyebilirsin. Eylem uydurma, listede olmayanı yazma; '
      + 'yazdığın şey doğrudan uygulanmaz, kullanıcının onayına düşer.\n'
      + list.map(a => '- ' + a.id + ' (' + a.title + ') · parametreler: '
          + Object.keys(a.params).join(', ')).join('\n') + '\n'
      + 'Biçim: {"eylem":"<id>","parametreler":{…},"gerekce":"tek cümle"}\n'
      + 'Gerek yoksa JSON yazma.';
  }

  /* Akis sirasinda yarim kalmis JSON kullaniciya gorunmesin. Yalniz eylem
     nesnesine benzeyen kuyruk gizlenir; duz metindeki suslu parantez
     (nadir de olsa) kirpilmaz. */
  function stripTrailingJson(text){
    const s = String(text || '');
    const i = s.lastIndexOf('{');
    if(i < 0) return s;
    if(!/"(eylem|action)"/.test(s.slice(i))) return s;
    return s.slice(0, i).replace(/```(?:json)?\s*$/, '').trimEnd();
  }

  /* Ajan yanitinin sonundaki JSON'u ayirir: kullaniciya gosterilen metin
     JSON tasimaz, oneri ayri durur. */
  function splitAction(text){
    const s = String(text || '');
    const end = s.lastIndexOf('}');
    if(end < 0) return { text:s.trim(), obj:null };
    /* Nesne ic ice oldugunda SON '{' dis nesnenin basi degildir
       ("parametreler":{…} icerideki paranteze denk gelir). Bu yuzden
       gecerli ayrisan EN ERKEN baslangic aranir. */
    for(let i = s.indexOf('{'); i >= 0 && i <= end; i = s.indexOf('{', i + 1)){
      let obj = null;
      try{ obj = JSON.parse(s.slice(i, end + 1)); }catch(e){ continue; }
      if(!obj || (!obj.eylem && !obj.action)) continue;
      /* JSON'dan once kod cercevesi kalmis olabilir. */
      const head = s.slice(0, i).replace(/```(?:json)?\s*$/, '').trim();
      return { text:head, obj };
    }
    return { text:s.trim(), obj:null };
  }

  return {
    all, pending, applied, actionable, check, preview,
    propose, approve, reject, undo, clearResolved,
    suggest, refresh, fromModel, catalogPrompt, splitAction, stripTrailingJson,
    load, save, MAX,
  };
})();
