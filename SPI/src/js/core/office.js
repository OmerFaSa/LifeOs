/* Ofis — bes ajanin calisma duzeni.

   Akis her zaman ayni yonde gider:

     Bio / Nutri / Move / Money  →  brief(agentId)  →  model  →  ekranda cumle
        (hesap, esik, karar)         (rapor, JSON)    (yorum)

   Kural motoru otoritedir. Ajan hesap yapmaz; brifingdeki sayiyi oldugu gibi
   kullanir. Model yoksa ofis kapanmaz: brifing dogrudan cumleye cevrilir
   (ruleText) ve ajanlar "kural motoru" rozetiyle konusur.

   Modele giden sey de sinirlidir (SP.PRIVACY.model): yalnizca sayilar ve
   durum etiketleri. Ad, dogum tarihi ve ham tahlil belgesi gonderilmez. */

window.SP = window.SP || {};

SP.Office = (function(){
  const U = SP.U;

  /* --------------------------------------------------------------- ayarlar */

  function defaults(){
    return {
      provider:'builtin', model:'default',
      perAgent:{},            // agentId -> { provider, model }
      autoBriefing:true,
      temperature:0.4,
    };
  }

  function settings(){
    if(!SP.S.office) SP.S.office = defaults();
    return SP.S.office;
  }

  async function saveSettings(patch){
    SP.S.office = Object.assign(defaults(), settings(), patch || {});
    await SP.Store.set('office', SP.S.office);
    return SP.S.office;
  }

  function cfgFor(agentId){
    const s = settings();
    const own = s.perAgent && s.perAgent[agentId];
    return own && own.provider ? own : { provider:s.provider, model:s.model };
  }

  function ready(agentId){
    return SP.LLM.ready(cfgFor(agentId));
  }

  /* --------------------------------------------------------------- brifing

     Her brifing SAF bir nesnedir: ekranda da, modelde de, testte de ayni
     sey okunur. Icinde cumle degil olcum vardir. */

  function labBrief(){
    const sum = SP.Bio.summary();
    const att = SP.Bio.attention().slice(0, 5).map(a => ({
      marker:a.marker.name, id:a.marker.id, value:a.value, unit:a.marker.unit,
      at:a.at, status:a.status.id, statusLabel:a.status.label,
      trend:a.trend.ok ? a.trend.dir : null,
      trendPct:a.trend.ok ? a.trend.pct : null,
      verdict:a.verdict.text,
    }));
    return {
      agent:'lab', summary:sum,
      flags:SP.Model.openFlags().map(f => ({ id:f.id, label:f.label, detail:f.detail, ack:!!f.ack })),
      attention:att,
      overdue:SP.Bio.overdue().map(o => ({ panel:o.panel.name, days:o.days, note:o.note })),
      lastLab:SP.S.labs.length ? SP.S.labs[SP.S.labs.length - 1].date : null,
    };
  }

  function nutriBrief(){
    const t = SP.Nutri.targets();
    const g = SP.Nutri.gaps(7);
    const today = SP.Nutri.dayTotals(U.todayISO());
    return {
      agent:'nutri',
      targetsOk:t.ok, missingProfile:t.missing,
      kcal:t.ok ? t.kcal : null,
      protein:t.ok ? t.protein : null,
      fiber:t.ok ? t.fiber : null,
      adjustments:t.ok ? Object.keys(t.adjustments).map(k => ({
        nutrient:SP.NUTRI_BY_ID[k] ? SP.NUTRI_BY_ID[k].name : k,
        mult:t.adjustments[k].mult, why:t.adjustments[k].why })) : [],
      loggedDays:g.ok ? g.avg.days : 0,
      gaps:g.ok ? g.rows.slice(0, 5).map(r => ({
        nutrient:r.nutrient ? r.nutrient.name : r.id, id:r.id, kind:r.kind,
        pct:r.pct, target:U.round(r.target, 1), got:U.round(r.got, 1),
        absorbed:U.round(r.absorbed, 1), why:r.why })) : [],
      todayMeals:today.meals,
      todayKcal:Math.round(today.kcal),
      todayProtein:Math.round(today.protein),
      absorbNotes:today.notes.slice(0, 4).map(n => ({ kind:n.kind, text:n.text, slot:n.slot })),
    };
  }

  function moveBrief(){
    const rx = SP.Move.prescription();
    const ready = SP.EXERCISES.map(e => SP.Move.progressionCheck(e.id))
      .filter(p => p.ok && p.ready)
      .map(p => ({ exercise:p.exercise.name, from:p.level.name, to:p.next.name }));
    return {
      agent:'move',
      readiness:rx.readiness.ok ? rx.readiness.score : null,
      band:rx.readiness.ok ? rx.readiness.band.label : null,
      order:rx.readiness.ok ? rx.readiness.band.order : rx.readiness.note,
      missingInputs:rx.readiness.ok ? rx.readiness.missing : null,
      override:rx.readiness.override ? rx.readiness.override.why : null,
      factor:rx.factor, kind:rx.kind,
      acwr:rx.acwr.ok ? { ratio:rx.acwr.ratio, zone:rx.acwr.zone, note:rx.acwr.note } : { note:rx.acwr.note },
      deload:rx.deload.due ? { week:rx.deload.week, note:rx.deload.note } : null,
      doneToday:rx.done, loadToday:rx.doneLoad,
      week:SP.Move.loadWindow(7),
      balance:SP.Move.patternBalance().filter(b => b.missing).map(b => b.pattern.label),
      progressionReady:ready,
      suggest:rx.suggest.map(s => s.name),
    };
  }

  function moneyBrief(){
    const st = SP.Money.status();
    const swaps = SP.Money.swapOpportunities().slice(0, 3);
    const bulk = SP.Money.bulkOpportunities().filter(b => b.worth).slice(0, 3);
    return {
      agent:'money',
      total:st.basket.total, limit:st.basket.limit, over:st.basket.over,
      perPerson:st.basket.perPerson, householdSize:st.basket.householdSize,
      estimatePct:st.basket.estimate.pct,
      itemCount:st.basket.rows.length,
      coverageGaps:st.coverage.ok ? st.coverage.gaps.map(id => ({
        nutrient:SP.NUTRI_BY_ID[id] ? SP.NUTRI_BY_ID[id].name : id,
        pct:st.coverage.micro[id].pct })) : [],
      swaps:swaps.map(s => ({ from:s.from.name, to:s.to.name, saveTotal:s.saveTotal,
        keeps:s.keeps.map(k => k.name), loses:s.loses.map(k => k.name), note:s.sub.note })),
      bulk:bulk.map(b => ({ food:b.food.name, minKg:b.item.minKg, saveTl:b.saveTl, note:b.item.note })),
    };
  }

  function patronBrief(){
    const report = SP.Calc.weeklyReport();
    return {
      agent:'patron',
      headline:SP.Calc.headline(report),
      next:SP.Calc.nextAction(),
      minimum:SP.Calc.minimumDay(),
      streak:SP.Calc.streak(),
      lab:labBrief(), nutri:nutriBrief(), move:moveBrief(), money:moneyBrief(),
      cross:SP.Calc.crossFindings().filter(f => f.ok && !f.weak)
        .map(f => ({ title:f.link.title, tone:f.tone, text:f.text })),
      openDecisions:SP.Model.openDecisions().map(d => ({ id:d.id, title:d.title, at:d.at })),
      week:{ start:report.start, end:report.end,
        readiness:report.readiness.avg, minDays:report.discipline.minDays,
        sessions:report.movement.sessions, loggedMeals:report.nutrition.loggedDays },
    };
  }

  const BRIEFS = { lab:labBrief, nutri:nutriBrief, move:moveBrief, money:moneyBrief, patron:patronBrief };

  function brief(agentId){
    const fn = BRIEFS[agentId] || BRIEFS.patron;
    return fn();
  }

  /* ------------------------------------------------------ kural motoru metni

     Model kapaliyken ajanin agzindan cikan cumle. Bu bir yedek degil,
     sistemin TABANIDIR: model yalnizca bunun uzerine anlatim ekler. */

  function ruleText(agentId, b){
    const d = b || brief(agentId);
    const lines = [];

    if(agentId === 'lab'){
      if(d.flags.length){
        lines.push(d.flags.length + ' kırmızı bayrak açık: ' + d.flags.map(f => f.label).join(', ')
          + '. Bu bir teşhis değil, hekime yönlendirmedir.');
      }
      lines.push(d.summary.measured + ' ölçüm girilmiş. '
        + d.summary.out + ' tanesi referans aralığının dışında, '
        + d.summary.offTarget + ' tanesi hedef bandın dışında.');
      if(d.attention.length){
        const a = d.attention[0];
        lines.push('En çok dikkat isteyen: ' + a.marker + ' ' + U.fmtNum(a.value) + ' ' + a.unit
          + ' (' + a.statusLabel + '). ' + (a.verdict || ''));
      }
      if(d.overdue.length){
        lines.push(d.overdue[0].panel + ' paneli ' + d.overdue[0].note.toLocaleLowerCase('tr-TR'));
      }
      if(!d.attention.length && !d.flags.length) lines.push('Dikkat isteyen bir ölçüm yok.');
      return lines.join(' ');
    }

    if(agentId === 'nutri'){
      if(!d.targetsOk){
        return 'Hedef hesaplanamıyor: profilde ' + d.missingProfile.join(', ') + ' eksik. '
          + 'Bu üçü olmadan kalori ve protein hedefi tahmin edilmez.';
      }
      lines.push('Günlük hedef ' + U.fmtNum(d.kcal) + ' kcal, protein '
        + d.protein.min + '–' + d.protein.max + ' g, lif ' + d.fiber + ' g.');
      if(d.adjustments.length){
        lines.push('Laboratuvara göre ' + d.adjustments.length + ' hedef yükseltildi: '
          + d.adjustments.map(a => a.nutrient).join(', ') + '.');
      }
      if(!d.loggedDays){
        lines.push('Son 7 günde hiç öğün girilmemiş; açık hesaplanamıyor.');
      }else if(d.gaps.length){
        const g = d.gaps[0];
        lines.push('En büyük açık ' + g.nutrient + ': hedefin %' + g.pct + '\'i. '
          + (g.why ? g.why : '') );
      }else{
        lines.push('Son 7 günün ortalaması bütün hedefleri karşılıyor.');
      }
      if(d.absorbNotes.length){
        const blockers = d.absorbNotes.filter(n => n.kind === 'block');
        if(blockers.length) lines.push(blockers[0].text);
      }
      return lines.join(' ');
    }

    if(agentId === 'move'){
      if(d.override) lines.push(d.override);
      if(d.readiness == null){
        lines.push('Toparlanma skoru hesaplanamıyor: bugün ölçüm girilmemiş.');
      }else{
        lines.push('Toparlanma ' + d.readiness + '/100 — ' + d.band + '. ' + d.order);
        if(d.missingInputs && d.missingInputs.length){
          lines.push('Eksik girdi: ' + d.missingInputs.join(', ') + '. Ağırlığı kalanlara dağıtıldı.');
        }
      }
      if(d.acwr.ratio != null) lines.push('Akut/kronik yük oranı ' + U.fmtNet(d.acwr.ratio) + '. ' + d.acwr.note);
      if(d.deload) lines.push(d.deload.week + '. hafta indirme haftası.');
      if(d.balance.length) lines.push('Bu hafta hiç çalışılmayan kalıp: ' + d.balance.join(', ') + '.');
      if(d.progressionReady.length){
        const p = d.progressionReady[0];
        lines.push(p.exercise + ' için üst basamak açık: ' + p.from + ' → ' + p.to + '.');
      }
      return lines.join(' ');
    }

    if(agentId === 'money'){
      if(!d.itemCount) return 'Sepet boş. Haftalık alışverişi girince maliyet ve besin kapsaması hesaplanır.';
      lines.push('Haftalık sepet ' + U.fmtNum(Math.round(d.total)) + ' TL'
        + (d.householdSize > 1 ? ', kişi başı ' + U.fmtNum(Math.round(d.perPerson)) + ' TL' : '') + '.');
      if(d.limit != null){
        lines.push(d.over ? 'Sınır ' + U.fmtNum(Math.round(d.limit)) + ' TL — aşıldı.'
                          : 'Sınırın altında.');
      }
      if(d.estimatePct >= 50) lines.push('Hesabın %' + d.estimatePct + '\'i hâlâ tahmin fiyatıyla; kendi fişini gir.');
      if(d.coverageGaps.length){
        lines.push('Sepet ' + d.coverageGaps[0].nutrient + ' ihtiyacının yalnızca %'
          + d.coverageGaps[0].pct + '\'ini karşılıyor.');
      }
      if(d.swaps.length){
        const s = d.swaps[0];
        lines.push(s.from + ' yerine ' + s.to + ': haftada ' + U.fmtNum(Math.round(s.saveTotal))
          + ' TL tasarruf, ' + s.keeps.join(' ve ') + ' korunur'
          + (s.loses.length ? ', ' + s.loses.join(' ve ') + ' düşer' : '') + '.');
      }
      return lines.join(' ');
    }

    /* patron */
    lines.push(d.headline);
    if(d.next && !d.next.calm){
      lines.push('Sıradaki hamle: ' + d.next.title + '. ' + d.next.why);
    }
    if(d.cross.length) lines.push(d.cross[0].text);
    lines.push('Asgari gün ' + d.minimum.done + '/' + d.minimum.total
      + ', seri ' + d.streak + ' gün.');
    if(d.openDecisions.length) lines.push(d.openDecisions.length + ' karar takipte.');
    return lines.join(' ');
  }

  /* ------------------------------------------------------------- denetim

     Model ciktisi ev kurallarina karsi denetlenir. Ihlal varsa cikti
     BASILMAZ; yerine kural motorunun cumlesi gecer. */
  function validate(text){
    const s = String(text || '');
    const hits = SP.GROUNDING.banned.filter(b => b.re.test(s));
    return {
      ok:hits.length === 0,
      violations:hits.map(h => ({ id:h.id, why:h.why })),
      note:hits.length ? hits.map(h => h.why).join(', ') + ' tespit edildi.' : '',
    };
  }

  /* --------------------------------------------------------------- model */

  function systemPrompt(agentId, b){
    const a = SP.AGENT_BY_ID[agentId] || SP.AGENT_BY_ID.patron;
    return [
      'Sen ' + a.name + ' adında bir sağlık asistanı ajanısın. Rolün: ' + a.role + '.',
      'Alanın: ' + a.scope,
      'Alanın DIŞI: ' + a.notScope + ' Alan dışı bir soru gelirse kısaca ilgili uzmana yönlendir.',
      '',
      'KURALLAR (bunlar tartışılmaz):',
      '1. Sayı üretme. Bütün sayılar aşağıdaki brifingden gelir. Brifingde olmayan bir sayıyı yazma.',
      '2. Teşhis koyma. İlaç ya da doz önerme. Tedaviyi bırakmayı önerme. Sonuç garantisi verme.',
      '3. ' + SP.CLINICAL.disclaimer,
      '4. Türkçe yaz. Kısa cümle kur. En fazla 4 cümle.',
      '5. Bilmediğin bir şey sorulursa "bu benim alanımda değil" ya da "bu veri girilmemiş" de.',
      '',
      'BRİFİNG (JSON, kural motorundan geldi):',
      JSON.stringify(b),
    ].join('\n');
  }

  /* Ajan yaniti. Model yoksa ya da cagri basarisiz olursa kural motorunun
     cumlesi doner — ofis hicbir kosulda sessiz kalmaz. */
  async function ask(agentId, question, opts){
    const o = opts || {};
    const b = o.brief || brief(agentId);
    const fallback = { text:ruleText(agentId, b), source:'rules', brief:b };

    const cfg = cfgFor(agentId);
    if(!SP.LLM.ready(cfg)) return fallback;

    try{
      const res = await SP.LLM.chat(cfg, {
        system:systemPrompt(agentId, b),
        messages:[{ role:'user', text:question || 'Durumu özetle.' }],
        temperature:settings().temperature,
        maxTokens:o.maxTokens || 600,
      });
      const check = validate(res.text);
      if(!check.ok){
        return { text:fallback.text, source:'rules', brief:b,
          blocked:check, note:'Model çıktısı ev kurallarına takıldı: ' + check.note };
      }
      return { text:res.text.trim(), source:'model', brief:b, model:cfg.model };
    }catch(e){
      return Object.assign({}, fallback, {
        error:SP.LLM.errorText ? SP.LLM.errorText(e) : String(e && e.message || e) });
    }
  }

  /* ---------------------------------------------------------- masa notlari

     Not bir tavsiye degil BULGU'dur: kosul saglandiginda kendiliginden
     birakilir, kosul gectiginde kendiliginden kalkar. Kullanici silmez. */
  function notes(){
    const out = [];
    const add = (agent, kind, text) => {
      const k = SP.NOTE_KINDS.find(x => x.id === kind) || SP.NOTE_KINDS[4];
      const a = SP.AGENT_BY_ID[agent];
      out.push({ agent, name:a ? a.name : agent, kind, tone:k.tone, label:k.label, text });
    };

    SP.Model.openFlags().forEach(f => add('lab', 'flag', f.label + ' — ' + f.detail));
    SP.Bio.overdue().forEach(o => add('lab', 'gap', o.panel.name + ' paneli ' + o.note.toLocaleLowerCase('tr-TR')));

    const g = SP.Nutri.gaps(7);
    if(g.ok) g.rows.slice(0, 2).forEach(r => {
      add('nutri', 'gap', (r.nutrient ? r.nutrient.name : r.id) + ' son 7 günde hedefin %' + r.pct + '\'inde.');
    });
    const today = SP.Nutri.dayTotals(U.todayISO());
    today.notes.filter(n => n.kind === 'block').slice(0, 1).forEach(n => add('nutri', 'info', n.text));

    const rx = SP.Move.prescription();
    if(rx.acwr.ok && rx.acwr.zone === 'high') add('move', 'debt', rx.acwr.note);
    if(rx.deload.due) add('move', 'info', rx.deload.week + '. hafta — yük indirme haftası.');
    SP.EXERCISES.forEach(e => {
      const p = SP.Move.progressionCheck(e.id);
      if(p.ok && p.ready) add('move', 'win', p.exercise.name + ': üst basamak açık (' + p.next.name + ').');
    });

    const m = SP.Money.status();
    if(m.basket.over) add('money', 'debt', m.text);
    if(m.stale && m.basket.rows.length) add('money', 'info',
      'Sepetin %' + m.basket.estimate.pct + '\'i tahmin fiyatıyla hesaplandı.');
    SP.Money.swapOpportunities().slice(0, 1).forEach(s => add('money', 'win',
      s.from.name + ' yerine ' + s.to.name + ': haftada ' + U.fmtNum(Math.round(s.saveTotal)) + ' TL.'));

    const streak = SP.Calc.streak();
    if(streak >= 7) add('patron', 'win', 'Asgari gün serisi ' + streak + ' gün.');
    SP.Model.openDecisions().forEach(d => {
      const age = U.diffDays(d.at.slice(0, 10), U.todayISO());
      if(age >= 2) add('patron', 'debt', 'Karar ' + age + ' gündür açık: ' + d.title);
    });

    return out;
  }

  /* -------------------------------------------------------------- gundem

     Puanlama kural motorundan gelir; model gundem secmez. */
  function agendaCandidates(){
    const out = [];
    const push = (kindId, detail, extra) => {
      const k = SP.AGENDA_KINDS.find(x => x.id === kindId);
      if(!k) return;
      out.push(Object.assign({ id:kindId, label:k.label, owner:k.owner,
        score:k.weight, note:k.note, detail }, extra || {}));
    };

    SP.Model.openFlags().forEach(f => push('red-flag', f.label + ' — ' + f.detail));
    SP.Bio.attention().filter(a => a.verdict.tone === 'warn').slice(0, 2)
      .forEach(a => push('lab-trend', a.marker.name + ': ' + a.verdict.text));
    const g = SP.Nutri.gaps(14);
    if(g.ok) g.rows.filter(r => r.pct < 80).slice(0, 2)
      .forEach(r => push('nutri-gap', (r.nutrient ? r.nutrient.name : r.id) + ' hedefin %' + r.pct + '\'inde'));
    const a = SP.Move.acwr();
    if(a.ok && a.zone === 'high') push('overreach', 'Oran ' + U.fmtNet(a.ratio) + '. ' + a.note);
    const rec = [];
    for(let i = 0; i < 5; i++){
      const r = SP.Move.readiness(U.iso(U.addDays(U.today(), -i)));
      if(r.ok) rec.push(r.score);
    }
    if(rec.length >= 3 && U.sum(rec) / rec.length < 55){
      push('recovery-debt', 'Son ' + rec.length + ' günün toparlanma ortalaması '
        + Math.round(U.sum(rec) / rec.length) + '.');
    }
    const m = SP.Money.status();
    if(m.basket.over) push('budget-over', m.text);
    if(m.stale && m.basket.rows.length) push('price-stale',
      'Sepetin %' + m.basket.estimate.pct + '\'i tahmin fiyatıyla.');
    if(!out.length) push('goal-review', 'Açık bir sorun yok; hedefler gözden geçirilebilir.');

    return out.sort((x, y) => y.score - x.score);
  }

  /* -------------------------------------------------------- gunluk brifing

     Gunde tek model cagrisi. Sonuc gune yazilir; ayni gun tekrar cagrilmaz. */
  async function dailyBriefing(force){
    const d = U.todayISO();
    if(!force && SP.S.officeBriefings[d]) return SP.S.officeBriefings[d];

    const b = patronBrief();
    const res = await ask('patron',
      'Bugünün durumunu dört masadan gelen rapora göre özetle. Çelişki varsa hangi kuralın '
      + 'öncelikli olduğunu söyle. En fazla dört cümle.', { brief:b });

    const rec = { date:d, text:res.text, source:res.source, at:new Date().toISOString(),
      headline:b.headline, next:b.next };
    SP.S.officeBriefings[d] = rec;
    await SP.Store.set('briefings/' + d, rec);
    return rec;
  }

  /* ------------------------------------------------------------- toplanti

     Gundem secilir, dort uzman sirayla konusur, Patron kapatir. Her tur
     ayri bir model cagrisidir; model yoksa hepsi kural motoru cumlesidir. */
  async function runMeeting(agendaId, onTurn){
    const agenda = agendaCandidates().find(a => a.id === agendaId) || agendaCandidates()[0];
    const turns = [];
    const order = ['lab', 'nutri', 'move', 'money'];

    for(const id of order){
      const b = brief(id);
      const res = await ask(id,
        'Gündem: ' + agenda.label + ' — ' + agenda.detail + '\n'
        + 'Kendi alanından bu gündeme ne söylüyorsun? Alanın dışına çıkma. En fazla 3 cümle.',
        { brief:b, maxTokens:400 });
      const turn = { agent:id, name:SP.AGENT_BY_ID[id].name, text:res.text, source:res.source };
      turns.push(turn);
      if(onTurn) onTurn(turn);
    }

    const pb = patronBrief();
    const closing = await ask('patron',
      'Gündem: ' + agenda.label + '\n'
      + 'Uzmanların söyledikleri:\n'
      + turns.map(t => '- ' + t.name + ': ' + t.text).join('\n') + '\n\n'
      + 'Çelişki varsa öncelik sırasına göre çöz (kırmızı bayrak > güvenlik > laboratuvar > '
      + 'beslenme > antrenman > bütçe) ve TEK bir karar yaz. Kararı gerekçelendir.',
      { brief:pb, maxTokens:500 });

    const rec = {
      id:U.uid('mt'), at:new Date().toISOString(), date:U.todayISO(),
      agenda:{ id:agenda.id, label:agenda.label, detail:agenda.detail },
      turns, closing:closing.text, source:closing.source,
      decision:SP.Calc.nextAction(),
    };
    SP.S.officeMeetings.unshift(rec);
    await SP.Store.set('meetings/' + rec.id, rec);
    return rec;
  }

  /* ----------------------------------------------------------------- sohbet */

  async function send(agentId, text){
    const list = SP.S.officeChats[agentId] || (SP.S.officeChats[agentId] = []);
    list.push({ role:'user', text, at:new Date().toISOString() });
    const res = await ask(agentId, text);
    list.push({ role:'agent', text:res.text, source:res.source, at:new Date().toISOString(),
      blocked:res.blocked || null, error:res.error || null });
    await SP.Store.set('chats/' + agentId, { agentId, messages:list });
    return res;
  }

  async function clearChat(agentId){
    SP.S.officeChats[agentId] = [];
    await SP.Store.set('chats/' + agentId, { agentId, messages:[] });
  }

  /* ----------------------------------------------------------------- acilis */

  async function load(){
    SP.S.office = Object.assign(defaults(), await SP.Store.get('office'));
    SP.S.officeChats = {};
    ((await SP.Store.list('chats')) || []).forEach(row => {
      SP.S.officeChats[row.agentId || row.id] = row.messages || [];
    });
    SP.S.officeMeetings = ((await SP.Store.list('meetings')) || [])
      .sort((a, b) => (a.at || '') < (b.at || '') ? 1 : -1);
    SP.S.officeBriefings = {};
    ((await SP.Store.list('briefings')) || []).forEach(row => {
      SP.S.officeBriefings[row.date || row.id] = row;
    });
    return SP.S.office;
  }

  return {
    defaults, settings, saveSettings, cfgFor, ready,
    brief, labBrief, nutriBrief, moveBrief, moneyBrief, patronBrief,
    ruleText, systemPrompt, validate, ask,
    notes, agendaCandidates, dailyBriefing, runMeeting,
    send, clearChat, load,
  };
})();
