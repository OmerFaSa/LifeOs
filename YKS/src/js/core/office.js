/* Ofis motoru — bes ajanin veri okumasi, konusmasi ve toplanti yapmasi.

   MIMARI ILKESI (koc katmaniyla ayni): kural motoru otoritedir.
   Her ajanin masasinda kural motorunun hesapladigi bir BRIFING durur;
   ajan yalnizca o brifingi yorumlar. Model yoksa brifing dogrudan
   cumleye cevrilir ve ofis cevrimdisi calismaya devam eder.

   Katmanlar:
     brief(agentId)     kural motoru → { headline, metrics, findings, suggestion, data }
     ask(agentId, soru) brifing + soru → ajanin yaniti
     meet(...)          gundem → sirayla konusma → Patron'un tek karari

   Yetki: her ajan yalnizca kendi brifingini gorur; ham veriye erisemez.
   Gizlilik: LLM'e giden her nesne R.Tools.sanitize'dan gecer. */

window.R = window.R || {};

R.Office = (function(){
  const U = R.U, M = R.Model, C = R.Calc, S = R.S;

  const CHAT_MAX = 30;        // ajan basina saklanan mesaj
  const MEETING_MAX = 20;     // saklanan toplanti kaydi
  const TURN_CONTEXT = 4;     // toplantida bir uzmana gosterilen onceki konusma

  /* ==================== ayarlar ==================== */

  function defaultSettings(){
    return {
      provider:'builtin',
      model:'default',
      endpoint:'',
      fallback:true,          // ilk model dusunce sirayi dene
      perAgent:{},            // agentId -> { provider, model }
      updatedAt:null,
      promptVersion:R.OFFICE_PROMPTS.version,
    };
  }

  function settings(){
    if(!S.office) S.office = defaultSettings();
    return S.office;
  }

  async function saveSettings(patch){
    const next = Object.assign(defaultSettings(), settings(), patch || {});
    next.updatedAt = new Date().toISOString();
    S.office = next;
    await R.Store.set('office/settings', next);
    return next;
  }

  /* Bir ajanin calisacagi yapilandirma: kendi secimi yoksa ofis varsayilani. */
  function agentConfig(agentId){
    const st = settings();
    const own = st.perAgent && st.perAgent[agentId];
    const provider = (own && own.provider) || st.provider;
    const model = (own && own.model) || (provider === st.provider ? st.model : firstModel(provider));
    return {
      provider,
      model,
      endpoint:(own && own.endpoint) || (provider === st.provider ? st.endpoint : ''),
    };
  }

  function firstModel(providerId){
    const p = R.PROVIDERS[providerId];
    return (p && p.models && p.models.length) ? p.models[0].id : '';
  }

  /* Yedek zinciri: ajanin yapilandirmasi → ofis varsayilani → ayni saglayicinin
     diger ucretsiz modelleri → yerlesik yetenek. Ucretsiz modeller sik sinira
     takildigi icin tek modele bagli kalinmaz. */
  function chainFor(agentId){
    const st = settings();
    const chain = [];
    const seen = {};
    const push = cfg => {
      if(!cfg || !cfg.provider || !R.LLM.ready(cfg)) return;
      const key = cfg.provider + '|' + cfg.model;
      if(seen[key]) return;
      seen[key] = true;
      chain.push(cfg);
    };

    push(agentConfig(agentId));
    push({ provider:st.provider, model:st.model, endpoint:st.endpoint });

    if(st.fallback){
      const main = agentConfig(agentId);
      const p = R.PROVIDERS[main.provider];
      if(p && p.models) p.models.forEach(m => push({ provider:p.id, model:m.id, endpoint:main.endpoint }));
      push({ provider:'builtin', model:'default' });
    }
    return chain;
  }

  function ready(agentId){ return chainFor(agentId || 'patron').length > 0; }

  /* 'llm' — model bagli; 'kural' — yalniz kural motoru. */
  function mode(){ return ready('patron') ? 'llm' : 'kural'; }

  function providerLabel(){
    const cfg = agentConfig('patron');
    const p = R.PROVIDERS[cfg.provider];
    if(!p) return 'tanımsız';
    if(p.kind === 'builtin') return p.label;
    const m = (p.models || []).find(x => x.id === cfg.model);
    return p.label + ' · ' + ((m && m.label) || cfg.model);
  }

  /* ==================== kural motoru brifingleri ==================== */

  function tone(pct, good, warn){
    if(pct == null) return 'muted';
    return pct >= good ? 'ok' : pct >= warn ? 'warn' : 'danger';
  }
  function num(x, d){ return x == null ? null : U.round(x, d == null ? 1 : d); }

  /* Bir brans (TYT/AYT) icin ortak brifing govdesi. */
  function branchBrief(agent, family){
    const closure = C.examClosure(family);
    const trend = C.medianTrend(family);
    const base = C.examBase(family);

    const subjects = R.SUBJECTS.filter(s => s.exam === family).map(s => {
      const c = C.subjectClosure(s.id);
      return { id:s.id, ders:s.name, kapanan:c.closed, baslanan:c.started, toplam:c.total,
        yuzde:c.pct, hedefBant:s.targetBand, soruSayisi:s.questions };
    }).sort((a, b) => a.yuzde - b.yuzde);

    const bands = R.TEST_BANDS.filter(b => b.exam === family).map(b => {
      const med = C.testMedian(b.testKey, b.exam);
      return { test:b.test, hedefAlt:b.low, hedefUst:b.high, medyan:num(med),
        fark:med == null ? null : num(med - b.low) };
    });

    const risks = C.riskRanking(40)
      .filter(r => { const s = R.SUBJECTS.find(x => x.id === r.subjectId); return s && s.exam === family; })
      .slice(0, 3)
      .map(r => ({ ders:r.subjectName, konu:r.topicName, risk:r.score, bant:r.label,
        durum:r.state, acikYanlis:r.errors }));

    const exams = S.exams.filter(e => e.family === family && e.kind === 'full').length;

    /* ---- bulgular: siraya sokulmus, cumle hâlinde ---- */
    const findings = [];
    const weakest = subjects[0];
    const gapBand = bands.filter(b => b.fark != null).sort((a, b) => a.fark - b.fark)[0];

    if(trend.last3 == null){
      findings.push({ tone:'info',
        text:family + ' medyanı için yeterli tam deneme yok (' + trend.count + '/3); '
          + 'şimdilik konu kapanışı tek ölçüt.' });
    }else if(trend.delta != null && trend.delta <= -1.5){
      findings.push({ tone:'danger',
        text:family + ' medyanı ' + U.fmtNet(trend.last3) + ' nete indi, önceki üçlüye göre '
          + U.fmtNet(Math.abs(trend.delta)) + ' net düşüş var.' });
    }else if(trend.delta != null && trend.delta >= 1.5){
      findings.push({ tone:'ok',
        text:family + ' medyanı ' + U.fmtNet(trend.last3) + ' nete çıktı, '
          + U.fmtNet(trend.delta) + ' net artış var.' });
    }else if(trend.last3 != null){
      findings.push({ tone:'info',
        text:family + ' medyanı ' + U.fmtNet(trend.last3) + ' netde duruyor; taban '
          + (base == null ? '—' : U.fmtNet(base)) + ' net.' });
    }

    if(gapBand && gapBand.fark < 0){
      findings.push({ tone:'warn',
        text:gapBand.test + ' medyanı ' + U.fmtNet(gapBand.medyan) + ', hedef bandın '
          + U.fmtNet(Math.abs(gapBand.fark)) + ' net altında.' });
    }

    if(weakest){
      findings.push({ tone:tone(weakest.yuzde, 70, 40),
        text:weakest.ders + ' kapanışı %' + weakest.yuzde + ' (' + weakest.kapanan + '/'
          + weakest.toplam + ' konu); ' + family + ' genelinde %' + closure.pct + '.' });
    }

    if(risks.length){
      findings.push({ tone:'warn',
        text:'En riskli konu ' + risks[0].konu + ' (' + risks[0].ders + ', risk '
          + risks[0].risk + '/100).' });
    }

    const suggestion = risks.length
      ? { text:risks[0].konu + ' konusuna dön: ' + risks[0].ders + ' içinde en yüksek riskli başlık.',
          route:'subjects', label:'Derslere git' }
      : { text:(weakest ? weakest.ders : family) + ' kapanışını ilerlet.', route:'subjects', label:'Derslere git' };

    return {
      agent:agent.id, name:agent.name, role:agent.role,
      headline:family + ' kapanışı %' + closure.pct
        + (trend.last3 != null ? ' · medyan ' + U.fmtNet(trend.last3) + ' net' : ''),
      metrics:[
        { label:family + ' kapanış', value:'%' + closure.pct, tone:tone(closure.pct, 70, 40),
          note:closure.closed + '/' + closure.total + ' konu' },
        { label:'Medyan (son 3)', value:trend.last3 == null ? '—' : U.fmtNet(trend.last3),
          tone:trend.delta == null ? 'muted' : trend.delta >= 0 ? 'ok' : 'danger',
          note:trend.delta == null ? trend.count + ' deneme' : (trend.delta >= 0 ? '+' : '') + U.fmtNet(trend.delta) },
        { label:'Taban', value:base == null ? '—' : U.fmtNet(base), tone:'muted', note:'son 4 denemenin en düşüğü' },
      ],
      findings,
      suggestion,
      data:{
        alan:family,
        kapanis:{ kapanan:closure.closed, toplam:closure.total, yuzde:closure.pct },
        medyan:{ son3:num(trend.last3), onceki3:num(trend.prev3), fark:num(trend.delta),
          denemeSayisi:trend.count, taban:num(base) },
        tamDenemeSayisi:exams,
        dersler:subjects,
        netMatrisi:bands,
        riskliKonular:risks,
      },
    };
  }

  const BRIEFS = {

    tyt(agent){ return branchBrief(agent, 'TYT'); },
    ayt(agent){ return branchBrief(agent, 'AYT'); },

    rehber(agent){
      const n = M.currentWeek();
      const comp = C.planCompletion(n);
      const qr = C.questionRealization(n);
      const sleep = C.sleepAverage(7);
      const energy = M.energyAverage(7);
      const streak = C.behaviorStreak();
      const flow = C.dailyFlow();
      const reasons = C.skipReasonCounts(n);
      const target = (S.profile && S.profile.sleepTarget) || 7.5;
      const health = M.planHealth();
      const review = S.reviews[M.weekId(n)];

      const topReason = Object.keys(reasons)
        .map(k => ({ neden:k, adet:reasons[k] }))
        .sort((a, b) => b.adet - a.adet)[0];

      const days = [];
      for(let i = 0; i < 7; i++){
        const iso = U.iso(U.addDays(U.today(), -i));
        const d = S.days[iso];
        if(!d) continue;
        const blocks = d.blocks.filter(b => b.slot !== 'Dinlenme');
        days.push({ tarih:iso, tamamlanan:blocks.filter(b => b.status === 'done').length,
          toplam:blocks.length, uyku:d.sleepHours, calisilanDakika:U.sum(blocks.map(b => b.actualMin || 0)) });
      }

      const findings = [];
      if(comp != null){
        findings.push({ tone:tone(comp, 85, 70),
          text:'Hafta ' + n + ' plan tamamlaması %' + comp + (comp < 85 ? ' — hedef %85’in altında.' : '.') });
      }
      if(sleep != null && sleep < target - 0.75){
        findings.push({ tone:'danger',
          text:'Son 7 günün uyku ortalaması ' + U.fmtNet(sleep) + ' saat; hedefin '
            + U.fmtNet(target - sleep) + ' saat altında.' });
      }else if(sleep != null){
        findings.push({ tone:'ok', text:'Uyku ortalaması ' + U.fmtNet(sleep) + ' saat, hedefin içinde.' });
      }
      if(topReason){
        findings.push({ tone:'warn',
          text:'Bu hafta en sık atlama nedeni "' + topReason.neden + '" (' + topReason.adet + ' blok).' });
      }
      findings.push({ tone:streak.streak >= 3 ? 'ok' : 'warn',
        text:'Davranış serisi ' + streak.streak + ' gün; bugünün akışında '
          + flow.done + '/' + flow.total + ' adım tamam.' });
      if(energy != null && energy <= 2.5){
        findings.push({ tone:'warn', text:'Enerji ortalaması ' + U.fmtNet(energy) + '/5 — yük fazla gelmiş olabilir.' });
      }
      if(health && health.status && health.status !== 'ok'){
        findings.push({ tone:'warn', text:'Plan sağlığı: ' + (health.note || health.status) + '' });
      }

      const suggestion = (comp != null && comp < 85)
        ? { text:'Haftalık sözleşmeyi gözden geçir: kapasitenin üstünde yük varsa tek konuyu devret.',
            route:'week', label:'Haftaya git' }
        : { text:'Bugünün akışında eksik kalan adımı tamamla.', route:'today', label:'Bugüne git' };

      return {
        agent:agent.id, name:agent.name, role:agent.role,
        headline:'Plan %' + (comp == null ? '—' : comp) + ' · seri ' + streak.streak + ' gün',
        metrics:[
          { label:'Plan tamamlama', value:comp == null ? '—' : '%' + comp, tone:tone(comp, 85, 70), note:'hedef %85' },
          { label:'Uyku (7 gün)', value:sleep == null ? '—' : U.fmtNet(sleep) + ' sa',
            tone:sleep == null ? 'muted' : sleep >= target - 0.75 ? 'ok' : 'danger', note:'hedef ' + U.fmtNet(target) },
          { label:'Davranış serisi', value:streak.streak + ' gün', tone:streak.streak >= 3 ? 'ok' : 'warn',
            note:C.minimumDayMet() ? 'bugün tutuldu' : 'bugün henüz yok' },
        ],
        findings,
        suggestion,
        data:{
          hafta:n,
          planTamamlama:comp,
          soruGerceklesme:qr,
          uykuOrtalamasi:num(sleep),
          uykuHedefi:target,
          enerjiOrtalamasi:num(energy),
          davranisSerisi:streak.streak,
          minimumGun:C.minimumDayMet(),
          gununAkisi:{ tamamlanan:flow.done, toplam:flow.total, yuzde:flow.pct },
          atlamaNedenleri:reasons,
          planSagligi:health ? { durum:health.status, yuzde:health.pct, geride:health.behind } : null,
          son7Gun:days,
          adayinYazdigi:review ? { neden:review.why, duzeltme:review.decision } : null,
        },
      };
    },

    analist(agent){
      const debt = C.analysisDebt();
      const pareto = C.errorPareto().filter(p => p.count);
      const due = C.dueCards();
      const overdue = C.overdueCards();
      const cardDebt = C.cardDebt();
      const open = C.openErrors();
      const risks = C.riskRanking(5);
      const tyt = C.medianTrend('TYT');
      const ayt = C.medianTrend('AYT');
      const est = C.estimateScore();
      const n = M.currentWeek();
      const qr = C.questionRealization(n);
      const closure = C.overallClosure();

      const findings = [];
      if(debt.length){
        findings.push({ tone:'danger',
          text:debt.length + ' denemenin analizi bitmemiş; analiz edilmemiş deneme ölçüm sayılmaz.' });
      }
      if(pareto.length){
        const top = pareto[0];
        findings.push({ tone:'warn',
          text:'Hata dağılımında ilk sırada ' + R.ERROR_TAGS[top.tag].name + ' var: '
            + top.count + ' kayıt (%' + top.pct + ').' });
      }else{
        findings.push({ tone:'info', text:'Yanlış defterinde kayıt yok; hata dağılımı hesaplanamıyor.' });
      }
      if(cardDebt > 10){
        findings.push({ tone:'warn',
          text:'Tekrar borcu %' + cardDebt + ' (' + overdue.length + ' gecikmiş kart); eşik %10.' });
      }
      if(risks.length){
        findings.push({ tone:'warn',
          text:'Risk sıralamasının başında ' + risks[0].topicName + ' (' + risks[0].subjectName
            + ') var, risk ' + risks[0].score + '/100.' });
      }
      if(est.ok){
        findings.push({ tone:'info',
          text:'Tahmini sıra bandı ' + U.fmtNum(est.rankBest) + '–' + U.fmtNum(est.rankWorst)
            + ' (' + est.samples + ' denemeden, koçluk bandı).' });
      }else{
        findings.push({ tone:'info', text:'Sıra tahmini için yeterli kayıt yok: ' + est.why });
      }

      const suggestion = debt.length
        ? { text:'En eski analiz borcunu kapat; ölçüm ancak analizle değer kazanır.',
            route:'exams', label:'Denemelere git' }
        : (cardDebt > 10
          ? { text:'Gecikmiş kartları sadeleştir, sonra yeni kart üret.', route:'cards', label:'Tekrara git' }
          : { text:'Hata dağılımının ilk etiketine bir blok ayır.', route:'analytics', label:'Analize git' });

      return {
        agent:agent.id, name:agent.name, role:agent.role,
        headline:(debt.length ? debt.length + ' analiz borcu' : 'Analiz borcu yok')
          + ' · kapanış %' + closure.pct,
        metrics:[
          { label:'Analiz borcu', value:String(debt.length), tone:debt.length ? 'danger' : 'ok',
            note:debt.length ? 'en geç 24 saatte' : 'temiz' },
          { label:'Tekrar borcu', value:'%' + cardDebt, tone:cardDebt > 10 ? 'warn' : 'ok',
            note:due.length + ' kart bugün' },
          { label:'Açık yanlış', value:String(open.length), tone:open.length >= 10 ? 'warn' : 'muted',
            note:pareto.length ? 'ilk etiket ' + pareto[0].tag : 'kayıt yok' },
        ],
        findings,
        suggestion,
        data:{
          analizBorcu:debt.map(e => ({ tarih:e.date, tur:e.type })),
          hataDagilimi:pareto.map(p => ({ etiket:p.tag, ad:R.ERROR_TAGS[p.tag].name, adet:p.count, yuzde:p.pct })),
          acikYanlis:open.length,
          tekrar:{ due:due.length, gecikmis:overdue.length, borcYuzdesi:cardDebt, toplamKart:S.cards.length },
          riskSiralamasi:risks.map(r => ({ ders:r.subjectName, konu:r.topicName, risk:r.score,
            durum:r.state, acikYanlis:r.errors, gunGecti:r.staleDays })),
          medyan:{ tyt:num(tyt.last3), tytFark:num(tyt.delta), ayt:num(ayt.last3), aytFark:num(ayt.delta) },
          soruGerceklesme:qr,
          konuKapanisi:{ kapanan:closure.closed, toplam:closure.total, yuzde:closure.pct },
          tahmin:est.ok ? { puan:est.score, siraBandi:[est.rankBest, est.rankWorst],
            hedefSira:est.targetRank, konum:est.meta.label } : null,
        },
      };
    },

    /* Patron kendi hesabini yapmaz: dort uzmanin brifingindeki ilk bulguyu
       toplar, kural motorunun sonraki hamlesini basa koyar. */
    patron(agent){
      const action = nextAction();
      const gate = C.currentGate();
      const health = M.planHealth();
      const est = C.estimateScore();
      const n = M.currentWeek();

      const reports = R.MEETING_ORDER.map(id => {
        const b = brief(id);
        return {
          ajan:b.name, alan:b.role,
          baslik:b.headline,
          enOnemliBulgu:b.findings.length ? b.findings[0].text : 'bulgu yok',
          onerisi:b.suggestion ? b.suggestion.text : null,
          _tone:b.findings.length ? b.findings[0].tone : 'muted',
        };
      });

      const findings = reports.map(r => ({
        tone:r._tone === 'danger' ? 'danger' : r._tone === 'ok' ? 'ok' : 'warn',
        text:r.ajan + ' (' + r.alan + '): ' + r.enOnemliBulgu,
      }));

      const data = {
        bugun:U.todayISO(),
        programHaftasi:n,
        toplamHafta:R.PLAN.totalWeeks,
        sinavaKalanGun:U.diffDays(U.todayISO(), R.PLAN.examTytISO),
        kuralMotorununSectigiIs:{ baslik:action.title, neden:action.why },
        ekipRaporlari:reports.map(r => ({ ajan:r.ajan, alan:r.alan, baslik:r.baslik,
          bulgu:r.enOnemliBulgu, onerisi:r.onerisi })),
        planSagligi:health ? { durum:health.status, yuzde:health.pct, geride:health.behind } : null,
        ayinKapisi:gate ? { ay:gate.month, tytBant:gate.tyt, kural:gate.note } : null,
        tahmin:est.ok ? { siraBandi:[est.rankBest, est.rankWorst], hedefSira:est.targetRank,
          konum:est.meta.label } : null,
      };

      return {
        agent:agent.id, name:agent.name, role:agent.role,
        headline:action.title,
        metrics:[
          { label:'Hafta', value:n + '/' + R.PLAN.totalWeeks, tone:'muted',
            note:U.diffDays(U.todayISO(), R.PLAN.examTytISO) + ' gün kaldı' },
          { label:'Odak', value:action.label || 'Bugün', tone:action.tone === 'urgent' ? 'danger' : 'ok',
            note:action.title },
          { label:'Sıra bandı', value:est.ok ? U.fmtNum(est.rankBest) + '–' + U.fmtNum(est.rankWorst) : '—',
            tone:'muted', note:est.ok ? est.meta.label : 'yeterli deneme yok' },
        ],
        findings,
        suggestion:{ text:action.title + ' — ' + action.why, route:action.route || 'today',
          label:'Şimdi yap' },
        data,
      };
    },
  };

  /* nextAction() veri yokken null donebilir; ofis her zaman bir is gosterir. */
  function nextAction(){
    return C.nextAction() || {
      key:'today', icon:'today', label:'Bugün', title:'Bugünün akışını tamamla',
      why:'Ölçüm için önce düzenli kayıt gerekir.', route:'today', tone:'calm',
    };
  }

  const briefCache = new Map();
  /* Ayni cizimde bes ajan da brifing ister; hesap bir kez yapilir. */
  function brief(agentId){
    const agent = R.AGENT_BY_ID[agentId];
    if(!agent) throw new Error('bilinmeyen ajan: ' + agentId);
    if(briefCache.has(agentId)) return briefCache.get(agentId);
    const out = BRIEFS[agentId](agent);
    briefCache.set(agentId, out);
    return out;
  }
  function resetBriefs(){ briefCache.clear(); }

  /* Ekip ozeti — ofis ekraninin ust seridi. */
  function snapshot(){
    resetBriefs();
    return {
      mode:mode(),
      provider:providerLabel(),
      action:nextAction(),
      agents:R.AGENTS.map(a => {
        const b = brief(a.id);
        const worst = b.findings.reduce((acc, f) =>
          f.tone === 'danger' ? 'danger' : (acc === 'danger' ? acc : (f.tone === 'warn' ? 'warn' : acc)), 'ok');
        return { id:a.id, name:a.name, role:a.role, headline:b.headline, tone:worst,
          findings:b.findings.length };
      }),
    };
  }

  /* ==================== kural motoru metni (model yokken) ==================== */

  /* Brifingi cumleye cevirir. Model bagli degilken ofis bu metinlerle calisir;
     icerik ayni kural motorundan geldigi icin dogruluk degismez, yalniz
     anlatim sadelesir. */
  function ruleText(agentId, kind, ctx){
    const b = brief(agentId);
    const lines = b.findings.slice(0, kind === 'turn' ? 2 : 3).map(f => f.text);

    if(kind === 'opening'){
      return 'Gündem: ' + ctx.topic + '. ' + ctx.why + ' Sırayla dinliyorum.';
    }
    if(kind === 'closing'){
      return 'Ekipten çıkan tabloya göre bu haftanın tek işi: ' + ctx.action.title + '. '
        + (ctx.action.why || '') + ' Diğer başlıklar sıraya girer; aynı anda iki müdahale yapılmaz.';
    }

    /* Tur farkli sey soruyorsa cevap da farkli olmali. Model yokken ajanin
       elinde yalnizca brifing vardir; ucuncu turdan sonra soyleyecek YENI
       bir seyi yoktur ve bunu uydurmak yerine acikca soyler. */
    const round = (ctx && ctx.round && ctx.round.key) || null;
    let body;
    if(kind === 'turn' && round === 'fikir'){
      body = b.suggestion
        ? b.suggestion.text + ' Gerekçe: ' + (lines[0] || b.headline)
        : b.headline + '. Bu masadan çıkacak somut bir öneri yok.';
    }else if(kind === 'turn' && round === 'itiraz'){
      body = lines[1]
        ? 'Buna itirazım şu: ' + lines[1]
        : 'Kendi alanımdan itirazım yok; ' + (lines[0] || b.headline);
    }else if(kind === 'turn' && (round === 'sentez' || round === 'serbest')){
      body = b.suggestion
        ? 'Bana düşen iş: ' + b.suggestion.text
        : 'Ekleyecek bir şeyim yok.';
    }else{
      body = lines.length
        ? lines.join(' ') + (b.suggestion ? ' ' + b.suggestion.text : '')
        : b.headline + '. Bu masada bugün ayrıca bildirilecek bir şey yok.';
    }

    /* Soruya yanit verirken durustluk: model bagli degilken ajan soruyu
       okuyamaz, yalnizca masasindaki tabloyu okur. Bunu saklamaz. */
    if(kind === 'chat'){
      return 'Masamdaki rapor şunu söylüyor. ' + body
        + ' Sorunun kendisini okuyabilmem için ofise bir model bağlaman gerekir;'
        + ' şimdilik yalnız bu tabloyu aktarabiliyorum.';
    }
    return body;
  }

  /* ==================== model cagrisi ==================== */

  function toneId(){ return (S.profile && S.profile.coachTone) || 'dengeli'; }

  /* ---------- kural motoru dogrulamasi ----------
     Model ne yazarsa yazsin cikti ev kurallarina karsi denetlenir.
     Gardlar veri katmanindan gelir (R.PROMPTS.forbidden); when() kural
     motorunu alir, yani yasak yalnizca veri onu destekliyorsa uygulanir. */

  function validate(text){
    const warnings = [];
    (R.PROMPTS.forbidden || []).forEach(rule => {
      try{ if(rule.re.test(text) && rule.when(C)) warnings.push(rule.why); }
      catch(e){ /* gard hesaplanamadiysa uyari uretme */ }
    });
    return { text, warnings };
  }

  /* ---------- nottan kart uretimi ----------
     Once koc katmanindaydi; artik ofisin isi ve ucretsiz modellerle de
     calisir. LLM yalniz metin onerir, kart nesnesini kural motoru kurar:
     sema, uzunluk ve SRS asamalari uygulamada kalir. */

  function noteContext(noteId){
    const note = S.videoNotes.find(n => n.id === noteId);
    if(!note || !note.segments.length) return null;
    return {
      baslik:note.title,
      konu:M.noteTopicName(note),
      notlar:note.segments.slice(0, 40).map(s => ({
        saniye:s.ts, etiket:s.tag, metin:String(s.text).slice(0, 220),
      })),
      mevcutKartSayisi:S.cards.filter(c => c.source === 'note' && c.sourceRef === noteId).length,
    };
  }

  function validateCards(rawObj, note){
    const cfg = R.PROMPTS.cards;
    const list = (rawObj && Array.isArray(rawObj.cards)) ? rawObj.cards : [];
    const seen = {};
    const out = [];
    let dropped = 0;

    for(const c of list){
      const front = String((c && c.front) || '').trim();
      const back = String((c && c.back) || '').trim();
      if(!front || !back){ dropped++; continue; }
      if(front.length > cfg.frontMax || back.length > cfg.backMax){ dropped++; continue; }
      const key = front.toLowerCase();
      if(seen[key]){ dropped++; continue; }
      seen[key] = true;
      out.push(M.newCard({
        front, back,
        topic:String((c && c.topic) || M.noteTopicName(note)).slice(0, 80),
        subjectId:note.subjectId || null,
        source:'note', sourceRef:note.id,
      }));
      if(out.length >= cfg.max) break;
    }
    return { cards:out, dropped };
  }

  /* Ucretsiz modeller JSON'u kod cercevesi icinde dondurebiliyor;
     metinden ilk gecerli nesne cikarilir. */
  function parseJson(text){
    const raw = String(text || '').trim();
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const body = fence ? fence[1] : raw;
    try{ return JSON.parse(body); }catch(e){}
    const start = body.indexOf('{');
    const end = body.lastIndexOf('}');
    if(start >= 0 && end > start){
      try{ return JSON.parse(body.slice(start, end + 1)); }catch(e){}
    }
    return null;
  }

  async function generateCards(noteId, opts){
    const o = opts || {};
    const note = S.videoNotes.find(n => n.id === noteId);
    if(!note || !note.segments.length){
      throw Object.assign(new Error('Bu derste not yok'), { code:'no_data' });
    }
    const chain = chainFor('analist');
    if(!chain.length){
      throw Object.assign(new Error('Model bağlı değil'), { code:'unavailable' });
    }

    const cfg = R.PROMPTS.cards;
    const ctx = R.Tools.sanitize(noteContext(noteId));
    const res = await R.LLM.complete(chain, {
      system:cfg.system + '\nEn fazla ' + cfg.max + ' kart üret.',
      messages:[{ role:'user', text:'NOTLAR (JSON):\n' + JSON.stringify(ctx, null, 1) }],
      maxTokens:900,
      temperature:0.2,
      signal:o.signal,
    });

    const parsed = parseJson(res.text);
    const checked = validateCards(parsed, note);
    if(!checked.cards.length){
      throw Object.assign(new Error('Geçerli kart üretilemedi'), { code:'empty' });
    }
    return checked;
  }

  /* Tek bir ajan konusturur. Model yoksa ya da cagri basarisiz olursa
     kural motoru metnine duser — ofis hicbir kosulda sessiz kalmaz. */
  async function speak(agentId, kind, payload, opts){
    const agent = R.AGENT_BY_ID[agentId];
    const o = opts || {};
    const chain = chainFor(agentId);

    if(!chain.length || o.rulesOnly){
      const text = ruleText(agentId, kind, payload.ctx || {});
      return { agent:agentId, name:agent.name, role:agent.role, text, warnings:[], mode:'kural' };
    }

    try{
      const res = await R.LLM.complete(chain, {
        system:R.OFFICE_PROMPTS.system(agent, toneId()),
        messages:payload.messages,
        maxTokens:o.maxTokens || 420,
        temperature:agent.temperature,
        signal:o.signal,
        onText:o.onText,
      });
      const checked = validate(res.text);
      return { agent:agentId, name:agent.name, role:agent.role, text:checked.text,
        warnings:checked.warnings, mode:'llm', model:res.model, provider:res.provider,
        fellBack:!!res.fellBack, ms:res.ms };
    }catch(err){
      if(err && err.code === 'cancelled') throw err;
      const text = ruleText(agentId, kind, payload.ctx || {});
      return { agent:agentId, name:agent.name, role:agent.role, text, warnings:[],
        mode:'kural', error:R.LLM.errorText(err && err.code) };
    }
  }

  /* ==================== sohbet ==================== */

  function chatOf(agentId){ return (S.officeChats && S.officeChats[agentId]) || []; }

  async function pushChat(agentId, role, text, meta){
    S.officeChats = S.officeChats || {};
    const list = (S.officeChats[agentId] || []).concat([Object.assign({
      role, text, at:new Date().toISOString(),
    }, meta || {})]).slice(-CHAT_MAX);
    S.officeChats[agentId] = list;
    await R.Store.set('office/chat-' + agentId, { messages:list });
    return list;
  }

  async function clearChat(agentId){
    S.officeChats = S.officeChats || {};
    S.officeChats[agentId] = [];
    await R.Store.remove('office/chat-' + agentId);
  }

  /* Bir ajana soru sorar. Sohbetin son turlari baglama eklenir. */
  async function ask(agentId, question, opts){
    const agent = R.AGENT_BY_ID[agentId];
    if(!agent) throw new Error('bilinmeyen ajan: ' + agentId);
    const q = String(question || '').trim();
    if(!q) throw Object.assign(new Error('boş soru'), { code:'empty' });

    resetBriefs();
    const data = R.Tools.sanitize(brief(agentId).data);
    const history = chatOf(agentId).slice(-4)
      .map(m => ({ role:m.role === 'user' ? 'user' : 'assistant', text:m.text }));

    const messages = history.concat([
      { role:'user', text:R.OFFICE_PROMPTS.chat(agent, data, q) },
    ]);

    return speak(agentId, 'chat', { messages, ctx:{} }, opts);
  }

  /* Ajanin kendi alanini ozetlemesi (soru olmadan). */
  async function briefing(agentId, opts){
    const agent = R.AGENT_BY_ID[agentId];
    resetBriefs();
    const data = R.Tools.sanitize(brief(agentId).data);
    return speak(agentId, 'briefing', {
      messages:[{ role:'user', text:R.OFFICE_PROMPTS.briefing(agent, data) }],
      ctx:{},
    }, opts);
  }

  /* ==================== toplanti ==================== */

  /* Gundem kural motorundan gelir; LLM gundem secmez.
     Adaylar puanlanir, en yuksek puanli tek gundem toplantiya girer. */
  function agendaCandidates(){
    const n = M.currentWeek();
    const debt = C.analysisDebt();
    const comp = C.planCompletion(n);
    const cardDebt = C.cardDebt();
    const tyt = C.medianTrend('TYT');
    const ayt = C.medianTrend('AYT');
    const sleep = C.sleepAverage(7);
    const target = (S.profile && S.profile.sleepTarget) || 7.5;
    const gate = C.currentGate();
    const decided = gate ? S.decisions[U.monthKey(U.today())] : null;
    const closure = C.overallClosure();
    const risks = C.riskRanking(1);
    const out = [];

    if(gate && !decided){
      out.push({ score:95, topic:'Bu ayın karar kapısı',
        why:'Ayda bir medyanın bandın neresinde olduğuna bakılır ve tek müdahale seçilir.',
        data:{ ay:gate.month, tytBant:gate.tyt, tytGuvenli:gate.tytSafe, aytBant:gate.ayt,
          kural:gate.note, tytMedyan:num(tyt.last3), aytMedyan:num(ayt.last3) } });
    }
    if(debt.length){
      out.push({ score:90, topic:debt.length + ' denemenin analiz borcu',
        why:'Analiz edilmemiş deneme ölçüm sayılmaz; ekip bu borcu konuşmadan başka karar veremez.',
        data:{ borc:debt.length, denemeler:debt.slice(0, 5).map(e => ({ tarih:e.date, tur:e.type })) } });
    }
    if(comp != null && comp < 80){
      out.push({ score:85, topic:'Plan tamamlaması %' + comp + ' — hedefin altında',
        why:'İki hafta üst üste %80 altı telafi tetikler; nedeni davranışta mı yükte mi ayrılmalı.',
        data:{ hafta:n, tamamlama:comp, atlamaNedenleri:C.skipReasonCounts(n) } });
    }
    if(tyt.delta != null && tyt.delta <= -1.5){
      out.push({ score:80, topic:'TYT medyanında ' + U.fmtNet(Math.abs(tyt.delta)) + ' net düşüş',
        why:'Düşüş tek denemeden değil medyandan geliyor; kaynağı konu mu süre mi diye ayrılmalı.',
        data:{ son3:num(tyt.last3), onceki3:num(tyt.prev3), fark:num(tyt.delta), taban:num(C.examBase('TYT')) } });
    }
    if(sleep != null && sleep < target - 1){
      out.push({ score:78, topic:'Uyku ortalaması ' + U.fmtNet(sleep) + ' saate düştü',
        why:'Uyku bellek pekişmesinin parçası; hacim tartışmasından önce bu konuşulur.',
        data:{ ortalama:num(sleep), hedef:target } });
    }
    if(cardDebt > 10){
      out.push({ score:70, topic:'Tekrar borcu %' + cardDebt,
        why:'Borç eşiği aşıldı; yeni kart üretimi azaltılmadan önce ekip sırayı belirlemeli.',
        data:{ borc:cardDebt, gecikmis:C.overdueCards().length, due:C.dueCards().length } });
    }
    if(ayt.delta != null && ayt.delta <= -1.5){
      out.push({ score:68, topic:'AYT medyanında ' + U.fmtNet(Math.abs(ayt.delta)) + ' net düşüş',
        why:'Alan derslerinde düşüş sıralamaya doğrudan yansır.',
        data:{ son3:num(ayt.last3), onceki3:num(ayt.prev3), fark:num(ayt.delta) } });
    }
    if(closure.pct < 55){
      out.push({ score:60, topic:'Konu kapanışı %' + closure.pct,
        why:'Kapanmamış konu net üretmez; hangi dersin öne alınacağı ekip kararıdır.',
        data:{ kapanan:closure.closed, toplam:closure.total, yuzde:closure.pct } });
    }
    if(risks.length){
      out.push({ score:50, topic:'En riskli konu: ' + risks[0].topicName,
        why:'Risk sıralamasının başındaki konu haftanın hedefini belirler.',
        data:{ ders:risks[0].subjectName, konu:risks[0].topicName, risk:risks[0].score,
          durum:risks[0].state, acikYanlis:risks[0].errors } });
    }
    out.push({ score:10, topic:'Haftanın genel durumu',
      why:'Acil bir başlık yok; ekip düzenli gözden geçirme yapar.',
      data:{ hafta:n, kapanis:closure.pct, planTamamlama:comp } });

    return out.sort((a, b) => b.score - a.score);
  }

  function agenda(){ return agendaCandidates()[0]; }

  /* Toplanti: Patron acar → uzmanlar sirayla konusur → Patron tek karar verir.
     onTurn her konusmadan sonra cagirilir (ekranda canli akis icin). */
  /* ---------- turlar ----------
     Toplanti tek turluk bir yoklama degil, tur tur ilerleyen bir fikir
     patlamasidir. Her turun AYRI bir sorusu vardir; boylece ajanlar ayni
     cumleyi tekrar etmez, tartisma derinlesir. */

  const ROUNDS = [
    { key:'durum',  title:'Durum tespiti',
      ask:'Kendi alanindan gundemle ilgili TEK bulgu bildir. Sayilari raporundan al.' },
    { key:'fikir',  title:'Fikir turu',
      ask:'Gundemi cozecek TEK somut fikir at. Baskasinin fikrini tekrarlama; '
        + 'senden onceki fikirlerden farkli bir sey soyle.' },
    { key:'itiraz', title:'İtiraz turu',
      ask:'Masadaki fikirlerden hangisi kendi alaninda TUTMAZ, nedenini veriyle soyle. '
        + 'Itirazin yoksa hangisini destekledigini ve neden oldugunu tek cumlede yaz.' },
    { key:'sentez', title:'Toparlama turu',
      ask:'Konusulanlardan kendi alanina dusen tek isi soyle: sen ne yapacaksin, '
        + 'aday senden ne bekleyecek.' },
    { key:'serbest', title:'Serbest tur',
      ask:'Sana kalan son sozu soyle. Yeni bir sey yoksa "ekleyecegim yok" de, uzatma.' },
  ];

  function roundDef(n){ return ROUNDS[Math.min(n, ROUNDS.length) - 1] || ROUNDS[ROUNDS.length - 1]; }

  /* Kac tur anlamli? Model bagliyken bes turun hepsi ayri bir soru sorar.
     Model yokken ajanin elinde yalnizca brifing vardir: ucuncu turdan sonra
     yeni bir sey cikmaz, bu yuzden toplanti orada durur. */
  function maxRounds(){ return mode() === 'llm' ? ROUNDS.length : 3; }

  /* ---------- canli oturum ----------
     Toplanti artik tek bir cagriyla bitmez: kullanici bitirene kadar
     tur tur ilerler. Her konusma bir model cagrisidir ve kota yoneticisi
     araya bosluk koyar; bu yuzden "hepsi aninda" degil sirayla akar. */

  function newSession(ag){
    return {
      id:U.uid('m'),
      at:new Date().toISOString(),
      topic:ag.topic, why:ag.why, agendaData:ag.data || {},
      round:0,
      turns:[],
      status:'live',
      promptVersion:R.OFFICE_PROMPTS.version,
    };
  }

  /* Bir uzmanin konusma sirasi. Toplantida herkes ayni tur icinde bir kez konusur. */
  function speakerAt(index){
    return R.MEETING_ORDER[index % R.MEETING_ORDER.length];
  }

  /* Toplantida o ana kadar soylenenlerin son N tanesi (ajanin baglamı). */
  function saidSoFar(session, limit){
    return session.turns.slice(-(limit || TURN_CONTEXT))
      .map(t => ({ name:t.name, role:t.role, text:t.text }));
  }

  /* Toplantiyi acar: gundem secilir, Patron soz alir. */
  async function openMeeting(opts){
    const o = opts || {};
    resetBriefs();
    const ag = o.agenda || agenda();
    const session = newSession(ag);

    const pending = pendingDecision();
    const turn = await speak('patron', 'opening', {
      messages:[{ role:'user', text:R.OFFICE_PROMPTS.opening(
        { topic:ag.topic, why:ag.why, data:R.Tools.sanitize(ag.data || {}) }, pending) }],
      ctx:{ topic:ag.topic, why:ag.why, pending },
    }, Object.assign({}, o, { maxTokens:260 }));

    turn.round = 0;
    turn.roundTitle = 'Açılış';
    session.turns.push(turn);
    return session;
  }

  /* Siradaki konusmaciyi konusturur. index tur icindeki sirayi verir. */
  async function nextTurn(session, index, opts){
    const o = opts || {};
    const roundNo = Math.floor(index / R.MEETING_ORDER.length) + 1;
    const def = roundDef(roundNo);
    const agentId = speakerAt(index);
    const agent = R.AGENT_BY_ID[agentId];

    resetBriefs();
    const data = R.Tools.sanitize(brief(agentId).data);
    const turn = await speak(agentId, 'turn', {
      messages:[{ role:'user', text:R.OFFICE_PROMPTS.turn(agent,
        { topic:session.topic }, data, saidSoFar(session), def, recentSaid(agentId)) }],
      ctx:{ topic:session.topic, round:def },
    }, Object.assign({}, o, { maxTokens:320 }));

    turn.round = roundNo;
    turn.roundTitle = def.title;
    session.round = roundNo;
    session.turns.push(turn);
    return turn;
  }

  /* Kullanici soz alir: konusma kaydina girer, sonraki ajanlar bunu gorur. */
  function userTurn(session, text){
    const turn = {
      agent:'aday', name:'Sen', role:'aday', text:String(text || '').trim(),
      warnings:[], mode:'kullanici', round:session.round, roundTitle:'Söz aldın',
    };
    if(!turn.text) return null;
    session.turns.push(turn);
    return turn;
  }

  /* Toplantiyi kapatir: Patron karari gerekcelendirir, rapor uretilir,
     karar takibe alinir ve tutanak kaydedilir. */
  async function closeMeeting(session, opts){
    const o = opts || {};
    resetBriefs();
    const action = nextAction();
    const said = session.turns.slice(1)
      .map(t => ({ name:t.name, role:t.role, text:t.text }));

    const closing = await speak('patron', 'closing', {
      messages:[{ role:'user', text:R.OFFICE_PROMPTS.closing(
        { topic:session.topic }, said, action) }],
      ctx:{ topic:session.topic, action },
    }, Object.assign({}, o, { maxTokens:320 }));

    closing.closing = true;
    closing.round = session.round;
    closing.roundTitle = 'Karar';
    session.turns.push(closing);

    const modes = session.turns.filter(t => t.mode !== 'kullanici').map(t => t.mode);
    const meeting = {
      id:session.id,
      at:session.at,
      closedAt:new Date().toISOString(),
      topic:session.topic,
      why:session.why,
      rounds:session.round,
      status:'closed',
      mode:modes.every(m => m === 'llm') ? 'llm' : (modes.some(m => m === 'llm') ? 'karma' : 'kural'),
      promptVersion:R.OFFICE_PROMPTS.version,
      action:{ title:action.title, why:action.why, route:action.route || 'today',
        label:action.label || '' },
      decision:{
        id:session.id, title:action.title, why:action.why,
        route:action.route || 'today', state:'open', at:new Date().toISOString(),
      },
      turns:session.turns.map(t => ({ agent:t.agent, name:t.name, role:t.role, text:t.text,
        warnings:t.warnings || [], mode:t.mode, round:t.round || 0,
        roundTitle:t.roundTitle || '', closing:!!t.closing, error:t.error || null })),
      report:buildReport(session, action, closing),
    };

    await saveMeeting(meeting);
    await rememberTurns(meeting);
    return meeting;
  }

  /* ---------- rapor ----------
     Rapor kural motorunun urettigi bir belgedir: kim ne dedi, hangi tur,
     karar ne. Patron'un kapanis metni ozet olarak basa konur — LLM'e
     ayrica bir rapor yazdirilmaz, boylece fazladan kota harcanmaz. */

  function buildReport(session, action, closing){
    const byAgent = {};
    session.turns.forEach(t => {
      if(t.agent === 'patron' || t.agent === 'aday') return;
      byAgent[t.agent] = byAgent[t.agent] || { name:t.name, role:t.role, lines:[] };
      byAgent[t.agent].lines.push({ round:t.round, roundTitle:t.roundTitle, text:t.text });
    });

    const warnings = [];
    session.turns.forEach(t => (t.warnings || []).forEach(w => {
      if(warnings.indexOf(w) < 0) warnings.push(w);
    }));

    const userSaid = session.turns.filter(t => t.agent === 'aday').map(t => t.text);

    return {
      summary:closing ? closing.text : '',
      topic:session.topic,
      why:session.why,
      rounds:session.round,
      turnCount:session.turns.length,
      speakers:Object.keys(byAgent).length,
      byAgent,
      userSaid,
      warnings,
      decision:{ title:action.title, why:action.why, route:action.route || 'today' },
      /* Kararin dayandigi sayilar: rapor sonradan okundugunda baglam kalsin. */
      basis:(function(){
        const d = R.Tools.durum();
        return {
          hafta:d.programHaftasi,
          planTamamlama:d.planTamamlama,
          tytMedyan:d.tytMedyan,
          aytMedyan:d.aytMedyan,
          konuKapanisi:d.konuKapanisYuzdesi,
          analizBorcu:d.analizBorcu,
          tekrarBorcu:d.tekrarBorcuYuzdesi,
        };
      })(),
    };
  }

  /* Raporu duz metne cevirir — kopyalanip disariya tasinabilsin. */
  function reportText(meeting){
    const r = meeting.report || {};
    const out = [];
    out.push('TOPLANTI RAPORU — ' + new Date(meeting.at).toLocaleString('tr-TR'));
    out.push('Gündem: ' + meeting.topic);
    if(r.why) out.push('Neden: ' + r.why);
    out.push('');
    out.push('KARAR: ' + meeting.action.title);
    if(meeting.action.why) out.push(meeting.action.why);
    out.push('');
    if(r.summary){ out.push('PATRON’UN KAPANIŞI'); out.push(r.summary); out.push(''); }
    Object.keys(r.byAgent || {}).forEach(id => {
      const a = r.byAgent[id];
      out.push(a.name.toUpperCase() + ' — ' + a.role);
      a.lines.forEach(l => out.push('  · [' + (l.roundTitle || 'tur') + '] ' + l.text));
      out.push('');
    });
    if((r.userSaid || []).length){
      out.push('SENİN SÖZLERİN');
      r.userSaid.forEach(t => out.push('  · ' + t));
      out.push('');
    }
    if((r.warnings || []).length){
      out.push('KURAL MOTORU UYARILARI');
      r.warnings.forEach(w => out.push('  ! ' + w));
      out.push('');
    }
    const b = r.basis || {};
    out.push('DAYANDIĞI VERİ');
    out.push('  hafta ' + b.hafta + ' · plan %' + (b.planTamamlama == null ? '—' : b.planTamamlama)
      + ' · kapanış %' + b.konuKapanisi
      + ' · analiz borcu ' + b.analizBorcu + ' · tekrar borcu %' + b.tekrarBorcu);
    return out.join('\n');
  }

  /* ---------- karar takibi ----------
     Ofisi "gercek" yapan sey: verilen karar unutulmaz. Bir sonraki
     toplantiyi Patron hesap sorarak acar. */

  function decisions(){
    return meetings()
      .filter(m => m.decision)
      .map(m => Object.assign({}, m.decision, { topic:m.topic, meetingId:m.id }));
  }
  function openDecisions(){ return decisions().filter(d => d.state === 'open'); }
  function pendingDecision(){ return openDecisions()[0] || null; }

  async function closeDecision(id, state){
    const m = (S.officeMeetings || []).find(x => x.id === id);
    if(!m || !m.decision) return null;
    m.decision.state = (state === 'done' || state === 'carried') ? state : 'open';
    m.decision.closedAt = new Date().toISOString();
    await R.Store.set('meetings/' + m.id, m);
    return m.decision;
  }

  /* ---------- ajan hafizasi ----------
     Ajan ayni cumleyi iki toplanti ust uste kurmasin diye son sozleri
     hatirlanir. Koc katmanindaki recentSaid ile ayni fikir. */

  function recentSaid(agentId, limit){
    const out = [];
    meetings().forEach(m => {
      (m.turns || []).forEach(t => {
        if(t.agent === agentId && t.text) out.push({ at:m.at, text:t.text });
      });
    });
    (chatOf(agentId) || []).forEach(msg => {
      if(msg.role !== 'user' && msg.text) out.push({ at:msg.at || '', text:msg.text });
    });
    return out.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
      .slice(0, limit || 3)
      .map(x => String(x.text).slice(0, 180));
  }

  /* Tutanak kaydedildikten sonra hafiza zaten meetings() uzerinden okunur;
     ayrica bir yazma gerekmez. Kanca ileride genisletilebilir diye durur. */
  async function rememberTurns(){ return true; }

  /* ---------- kota ---------- */

  /* Bir ajanin siradaki cagrisi ne zaman yapilabilir? Ekran bunu gosterir. */
  function agentQuota(agentId){
    const chain = chainFor(agentId);
    if(!chain.length) return null;
    const state = R.Quota.check(chain[0]);
    const st = R.Quota.status(chain[0]);
    return {
      waitMs:state.waitMs || 0,
      full:!state.ok && state.reason === 'daily',
      usedToday:st.usedToday, rpd:st.rpd, rpm:st.rpm, known:st.known,
    };
  }

  /* Bir toplanti turu kac saniye surer (kota bosluklariyla)? */
  function roundEstimateMs(agentId){
    const chain = chainFor(agentId || 'patron');
    if(!chain.length) return 0;
    return R.Quota.estimateMs(chain[0], R.MEETING_ORDER.length);
  }

  /* ---------- tek cagriyla toplanti (test ve otomasyon icin) ----------
     Ekran turlu akisi kullanir; bu sarmalayici bir turu acar, kosar, kapatir. */
  async function meet(opts){
    const o = opts || {};
    const session = await openMeeting(o);
    if(o.onTurn) await o.onTurn(session.turns[0], session.turns);
    const count = (o.rounds || 1) * R.MEETING_ORDER.length;
    for(let i = 0; i < count; i++){
      const turn = await nextTurn(session, i, o);
      if(o.onTurn) await o.onTurn(turn, session.turns);
    }
    const meeting = await closeMeeting(session, o);
    if(o.onTurn) await o.onTurn(meeting.turns[meeting.turns.length - 1], session.turns);
    return meeting;
  }

  async function saveMeeting(meeting){
    S.officeMeetings = [meeting].concat((S.officeMeetings || []).filter(m => m.id !== meeting.id))
      .sort((a, b) => (b.at || '').localeCompare(a.at || ''));
    const drop = S.officeMeetings.slice(MEETING_MAX);
    S.officeMeetings = S.officeMeetings.slice(0, MEETING_MAX);
    await R.Store.set('meetings/' + meeting.id, meeting);
    for(const old of drop){
      try{ await R.Store.remove('meetings/' + old.id); }catch(e){}
    }
    return meeting;
  }

  async function deleteMeeting(id){
    S.officeMeetings = (S.officeMeetings || []).filter(m => m.id !== id);
    await R.Store.remove('meetings/' + id);
  }

  function meetings(){ return S.officeMeetings || []; }

  function lastMeeting(){ return meetings()[0] || null; }

  /* ==================== yukleme ==================== */

  async function load(){
    const [cfg, docs, mts] = await Promise.all([
      R.Store.get('office/settings'),
      R.Store.list('office'),
      R.Store.list('meetings'),
    ]);

    S.office = Object.assign(defaultSettings(), cfg || {});

    S.officeChats = {};
    (docs || []).forEach(d => {
      if(String(d.id).indexOf('chat-') !== 0) return;
      const agentId = String(d.id).slice(5);
      if(!R.AGENT_BY_ID[agentId]) return;
      S.officeChats[agentId] = Array.isArray(d.messages) ? d.messages.slice(-CHAT_MAX) : [];
    });

    S.officeMeetings = (mts || [])
      .filter(m => m && Array.isArray(m.turns))
      .sort((a, b) => (b.at || '').localeCompare(a.at || ''))
      .slice(0, MEETING_MAX);

    await R.LLM.initBuiltin();
    return S.office;
  }

  return {
    /* ayar */
    defaultSettings, settings, saveSettings, agentConfig, chainFor, ready, mode, providerLabel,
    /* brifing */
    brief, resetBriefs, snapshot, ruleText, nextAction, recentSaid,
    /* dogrulama ve kart uretimi (eski koc katmanindan devralindi) */
    validate, validateCards, generateCards, noteContext, parseJson,
    /* sohbet */
    ask, briefing, chatOf, pushChat, clearChat,
    /* toplanti — turlu canli oturum */
    agenda, agendaCandidates, openMeeting, nextTurn, userTurn, closeMeeting, speakerAt, roundDef,
    meet, meetings, lastMeeting, saveMeeting, deleteMeeting, reportText, maxRounds,
    /* karar takibi */
    decisions, openDecisions, pendingDecision, closeDecision,
    /* kota */
    agentQuota, roundEstimateMs,
    /* yasam dongusu */
    load,
    /* sabitler */
    CHAT_MAX, MEETING_MAX, ROUNDS,
  };
})();
