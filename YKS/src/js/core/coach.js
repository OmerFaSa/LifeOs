/* AI koc katmani (opsiyonel).

   Ilke: kural motoru otoritedir. LLM yalnizca hesaplanmis veriyi yorumlar;
   ciktisi kural motoruna karsi dogrulanir ve ihlaller kullaniciya bildirilir.
   Yetenek yoksa (cevrimdisi / izin verilmemis) tum arayuz gizlenir. */

window.R = window.R || {};

R.Coach = (function(){
  const U = R.U, M = R.Model, C = R.Calc, S = R.S;

  let sample = null;
  let state = 'unknown';   // 'unknown' | 'ready' | 'unavailable'

  async function init(){
    try{
      if(window.claude && typeof window.claude.use === 'function'){
        const api = await window.claude.use('sample');
        if(api){ sample = api; state = 'ready'; return true; }
      }
    }catch(e){ /* sessizce dus */ }
    state = 'unavailable';
    return false;
  }

  function available(){ return state === 'ready'; }

  /* ---------- baglam kurucular (kisisel bilgi gondermez) ---------- */

  function weekContext(n){
    const week = S.weeks[M.weekId(n)];
    const review = S.reviews[M.weekId(n)];
    const comp = C.planCompletion(n);
    const qr = C.questionRealization(n);
    const tyt = C.medianTrend('TYT'), ayt = C.medianTrend('AYT');
    const pareto = C.errorPareto().filter(p => p.count);
    const reasons = C.skipReasonCounts(n);
    const closure = C.overallClosure();

    return {
      hafta:n,
      haftaBasligi:week ? week.title : '',
      anaKonular:(week ? week.mainTopics : []).map(t => ({ konu:t.name, soruHedefi:t.questionTarget, dogrulukHedefi:t.accuracy })),
      planTamamlama:comp,
      soruGerceklesme:qr ? { cozulen:qr.solved, hedef:qr.target, yuzde:qr.pct } : null,
      tytMedyan:tyt.last3, tytOncekiMedyan:tyt.prev3, tytDelta:tyt.delta, tytTaban:C.examBase('TYT'),
      aytMedyan:ayt.last3, aytDelta:ayt.delta,
      hataDagilimi:pareto.map(p => ({ etiket:p.tag, ad:R.ERROR_TAGS[p.tag].name, adet:p.count, yuzde:p.pct })),
      atlamaNedenleri:reasons,
      konuKapanisYuzdesi:closure.pct,
      tekrarBorcu:C.cardDebt(),
      uykuOrtalamasi:C.sleepAverage(7),
      adayinYazdigi:review ? {
        planlandi:review.planned, yapildi:review.done, nedenSapildi:review.why, duzeltme:review.decision,
      } : null,
    };
  }

  function gateContext(){
    const gate = C.currentGate();
    if(!gate) return null;
    const g = C.gateSuggestions(gate);
    const prevKey = U.monthKey(U.addDays(U.today(), -28));
    const prev = S.decisions[prevKey];
    return {
      ay:gate.month,
      tytGozlenenBant:gate.tyt, tytGuvenliBant:gate.tytSafe,
      aytGozlenenBant:gate.ayt, aytGuvenliBant:gate.aytSafe,
      tytMedyan:g.tyt.last3, tytDurum:g.tytStatus,
      aytMedyan:g.ayt.last3, aytDurum:g.aytStatus,
      tytTaban:C.examBase('TYT'),
      ayinKurali:gate.note,
      kuralMotoruOnerileri:g.suggestions.map(s => s.text),
      gecenAyinMudahalesi:prev ? prev.action : null,
      konuKapanisYuzdesi:C.overallClosure().pct,
      hataDagilimi:C.errorPareto().filter(p => p.count).map(p => ({ etiket:p.tag, adet:p.count })),
    };
  }

  function rootCauseContext(limit){
    const errors = S.errors
      .slice()
      .sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))
      .slice(0, limit || 40);
    return {
      toplamKayit:errors.length,
      kayitlar:errors.map(e => ({
        etiket:e.tag,
        ders:e.topic || e.testName || '',
        durum:e.status,
        kokNeden:e.rootCause || '',
        ilke:e.principle || '',
      })).filter(e => e.kokNeden),
      dagilim:C.errorPareto().filter(p => p.count).map(p => ({ etiket:p.tag, ad:R.ERROR_TAGS[p.tag].name, adet:p.count })),
    };
  }

  /* ---------- istem (prompt) ---------- */

  const HOUSE_RULES = R.PROMPTS.houseRules;

  function prompt(role, contextObj, ask){
    const tone = (S.profile && S.profile.coachTone) || 'dengeli';
    return 'Sen bir YKS koçusun. Aşağıda bir adayın çalışma verisinin makine tarafından hesaplanmış özeti var.\n'
      + 'Bu veriler bir kural motorundan geliyor; sen yalnızca yorumlarsın, hesapları yeniden yapmazsın.\n\n'
      + 'KURALLAR:\n' + HOUSE_RULES.map(r => '- '+r).join('\n') + '\n'
      + R.PROMPTS.toneLine(tone) + '\n\n'
      + R.PROMPTS.memoryLine(recentSaid(role))
      + 'GÖREV: ' + ask + '\n\n'
      + 'VERİ (JSON):\n' + JSON.stringify(contextObj, null, 1) + '\n\n'
      + 'Yanıtı düz metin olarak yaz, başlık ve madde işareti kullanma, en fazla '
      + ((R.PROMPTS.kinds[role] && R.PROMPTS.kinds[role].maxSentences) || 5) + ' cümle.';
  }

  /* Koç hafızası: aynı türden son üç yorumun metni.
     Böylece koç üç hafta üst üste aynı cümleyi kurmaz. */
  function recentSaid(kind, limit){
    const out = [];
    Object.keys(S.coach || {}).forEach(key => {
      if(key.indexOf(kind + '-') !== 0) return;
      const p = S.coach[key];
      if(p && p.text) out.push({ at:p.generatedAt || '', text:p.text });
    });
    return out.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
      .slice(0, limit || 3)
      .map(x => x.text);
  }

  /* ---------- kural motoru dogrulamasi ---------- */

  /* Gardlar veri katmanindan gelir; when() kural motorunu alir. */
  const FORBIDDEN = R.PROMPTS.forbidden;

  function validate(text){
    const warnings = [];
    FORBIDDEN.forEach(rule => {
      if(rule.re.test(text) && rule.when(C)) warnings.push(rule.why);
    });
    return { text, warnings };
  }

  /* ---------- onbellek ---------- */

  /* Istem surumu degisince eski yorumlar gecersiz olur. */
  function cacheKey(kind, id){ return kind + '-' + id; }

  async function getCached(kind, id){
    const key = cacheKey(kind, id);
    if(S.coach && S.coach[key]) return S.coach[key];
    const doc = await R.Store.get('coach/'+key);
    if(doc){
      S.coach = S.coach || {};
      S.coach[key] = doc;
    }
    return doc;
  }

  async function putCached(kind, id, payload){
    const key = cacheKey(kind, id);
    S.coach = S.coach || {};
    S.coach[key] = payload;
    await R.Store.set('coach/'+key, payload);
  }

  /* ---------- kamu API ---------- */

  const KINDS = {
    week:{
      id(){ return M.weekId(S.ui.weekView || M.currentWeek()); },
      context(){ return weekContext(S.ui.weekView || M.currentWeek()); },
      ask:R.PROMPTS.kinds.week.ask,
    },
    gate:{
      id(){ return U.monthKey(U.today()); },
      context(){ return gateContext(); },
      ask:R.PROMPTS.kinds.gate.ask,
    },
    roots:{
      id(){ return U.todayISO(); },
      context(){ return rootCauseContext(40); },
      ask:R.PROMPTS.kinds.roots.ask,
    },
    'daily-flow':{
      id(){ return U.todayISO(); },
      context(){ return R.CoachTools.gununAkisi(); },
      ask:R.PROMPTS.kinds['daily-flow'].ask,
    },
    motivation:{
      id(){ return U.todayISO(); },
      context(){ return motivationContext(); },
      ask:R.PROMPTS.kinds.motivation.ask,
    },
    risk:{
      id(){ return U.monthKey(U.today()) + '-' + Math.floor(U.diffDays(R.PLAN.startISO, U.todayISO())/7); },
      context(){ return R.CoachTools.konuRiski({ limit:10 }); },
      ask:R.PROMPTS.kinds.risk.ask,
    },
    'weekly-report':{
      id(){ return M.weekId(M.currentWeek()); },
      context(){ return weeklyReportContext(); },
      ask:R.PROMPTS.kinds['weekly-report'].ask,
    },
    devil:{
      id(){ return U.monthKey(U.today()); },
      context(){ return devilContext(); },
      ask:R.PROMPTS.kinds.devil.ask,
    },
    'note-summary':{
      id(){ return 'n-' + (S.ui.noteOpen || 'yok'); },
      context(){ return noteContext(S.ui.noteOpen); },
      ask:R.PROMPTS.kinds['note-summary'].ask,
    },
  };

  function motivationContext(){
    const reward = C.todayReward();
    const streak = C.behaviorStreak();
    const days = [];
    for(let i = 0; i < 7; i++){
      const iso = U.iso(U.addDays(U.today(), -i));
      const d = S.days[iso];
      if(!d) continue;
      const blocks = d.blocks.filter(b => b.slot !== 'Dinlenme');
      days.push({
        tarih:iso,
        tamamlanan:blocks.filter(b => b.status === 'done').length,
        toplam:blocks.length,
        uyku:d.sleepHours,
        atlamaNedeni:blocks.filter(b => b.skipReason).map(b => b.skipReason),
      });
    }
    return {
      davranisSerisi:streak.streak,
      kazanilan:reward.earned.map(e => e.label),
      minimumGun:C.minimumDayMet(),
      uykuOrtalamasi:C.sleepAverage(7),
      enerjiOrtalamasi:M.energyAverage(7),
      planTamamlama:C.planCompletion(M.currentWeek()),
      analizBorcu:C.analysisDebt().length,
      son7Gun:days,
    };
  }

  /* Haftalık rapor: hafta verisi + davranış + plan sağlığı tek pakette. */
  function weeklyReportContext(){
    const n = M.currentWeek();
    const week = weekContext(n);
    const health = M.planHealth();
    const reward = C.todayReward();
    return Object.assign({}, week, {
      planSagligi:health ? { durum:health.status, yuzde:health.pct, geride:health.behind } : null,
      davranisSerisi:reward.streak,
      kazanilanDavranis:reward.earned.map(e => e.label),
      enerjiOrtalamasi:M.energyAverage(7),
      molaSayisi:M.breaksOf(U.todayISO()).length,
      sinamaOturumu:(S.sessions || []).length,
    });
  }

  /* Karşı argüman: planın kırılgan varsayımını göstermesi için gereken veri. */
  function devilContext(){
    const est = C.estimateScore();
    const health = M.planHealth();
    const cap = R.Analytics.capacityReality();
    const plan = M.activePlan();
    return {
      hedefSira:(S.profile && S.profile.targetRank) || null,
      tahmin:est.ok ? { puan:est.score, siraBandi:[est.rankBest, est.rankWorst], konum:est.meta.label } : null,
      planKapsama:plan ? plan.meta.coverage : null,
      planaGirmeyenKonu:plan ? plan.meta.dropped.length : null,
      planSagligi:health ? health.status : null,
      kapasiteGercekligi:cap.ok ? { yazilan:cap.claimed, calisilan:cap.actualAvg, oran:cap.ratio } : null,
      konuKapanisi:C.overallClosure().pct,
      tekrarBorcu:C.cardDebt(),
      analizBorcu:C.analysisDebt().length,
      haftaSayisi:R.PLAN.totalWeeks,
      kalanHafta:Math.max(0, R.PLAN.totalWeeks - M.currentWeek()),
    };
  }

  function noteContext(noteId){
    const note = S.videoNotes.find(n => n.id === noteId);
    if(!note || !note.segments.length) return null;
    return {
      baslik:note.title,
      konu:M.noteTopicName(note),
      notlar:note.segments.slice(0, 40).map(s => ({
        saniye:s.ts, etiket:s.tag, metin:String(s.text).slice(0, 220),
      })),
      mevcutKartSayisi:S.cards.filter(c => c.source === 'note' && c.sourceRef === note.id).length,
    };
  }

  async function run(kind, opts){
    const def = KINDS[kind];
    if(!def) throw new Error('bilinmeyen koç türü: '+kind);
    if(!available()) throw Object.assign(new Error('AI koç bu ortamda kullanılamıyor'), { code:'unavailable' });

    const o = opts || {};
    const id = def.id();
    const context = def.context();
    if(!context) throw Object.assign(new Error('Yorumlanacak veri yok'), { code:'no_data' });

    const safeContext = R.CoachTools.sanitize(context);
    const { text } = await sample(prompt(kind, safeContext, def.ask), {
      modelTier:'default',
      onText:o.onText,
      signal:o.signal,
    });

    const checked = validate(text);
    const payload = {
      kind, id, promptVersion:R.PROMPTS.version,
      text:checked.text,
      warnings:checked.warnings,
      generatedAt:new Date().toISOString(),
      basis:{
        planTamamlama:context.planTamamlama != null ? context.planTamamlama : null,
        tytMedyan:context.tytMedyan != null ? context.tytMedyan : null,
        konuKapanis:context.konuKapanisYuzdesi != null ? context.konuKapanisYuzdesi : null,
      },
    };
    await putCached(kind, id, payload);
    return payload;
  }

  async function cached(kind){
    const def = KINDS[kind];
    if(!def) return null;
    try{ return await getCached(kind, def.id()); }
    catch(e){ return null; }
  }

  /* Hata kodundan kullaniciya gosterilecek metin */
  function errorText(code){
    const map = {
      not_granted:'AI koç için izin verilmedi. Menüden tekrar deneyebilirsin.',
      rate_limited:'Şu an çok fazla istek var; birkaç dakika sonra dene.',
      prompt_too_large:'Veri özeti çok büyük; daha dar bir aralık seç.',
      cancelled:'İptal edildi.',
      session_expired:'Oturum süresi doldu; sayfayı yenile.',
      sampling_disabled:'AI koç bu ortamda kapalı.',
      not_declared:'AI koç bu sürümde tanımlı değil.',
      refused:'Bu istek yanıtlanamadı.',
      empty_completion:'Boş yanıt geldi; tekrar dene.',
      upstream_error:'Servise ulaşılamadı; sonra tekrar dene.',
      unavailable:'AI koç çevrimdışıyken kullanılamaz.',
      no_data:'Henüz yorumlanacak veri yok.',
    };
    return map[code] || 'AI koç şu an yanıt veremedi.';
  }

  /* ---------- nottan kart üretimi ----------
     LLM yalniz metin onerir; kart nesnesini kural motoru kurar, sema ve
     SRS asamalari uygulamada kalir. Gecersiz oneri sessizce elenir. */

  function validateCards(raw, note){
    const cfg = R.PROMPTS.cards;
    const list = (raw && Array.isArray(raw.cards)) ? raw.cards : [];
    const seen = {};
    const out = [];
    const dropped = [];

    for(const c of list){
      const front = String((c && c.front) || '').trim();
      const back = String((c && c.back) || '').trim();
      if(!front || !back){ dropped.push('boş alan'); continue; }
      if(front.length > cfg.frontMax || back.length > cfg.backMax){ dropped.push('çok uzun'); continue; }
      const key = front.toLowerCase();
      if(seen[key]){ dropped.push('tekrar'); continue; }
      seen[key] = true;
      out.push(M.newCard({
        front, back,
        topic:String((c && c.topic) || M.noteTopicName(note)).slice(0, 80),
        subjectId:note.subjectId || null,
        source:'note', sourceRef:note.id,
      }));
      if(out.length >= cfg.max) break;
    }
    return { cards:out, dropped:dropped.length };
  }

  async function generateCards(noteId, opts){
    if(!available()) throw Object.assign(new Error('AI koç bu ortamda kullanılamıyor'), { code:'unavailable' });
    const note = S.videoNotes.find(n => n.id === noteId);
    if(!note || !note.segments.length){
      throw Object.assign(new Error('Bu derste not yok'), { code:'no_data' });
    }
    const o = opts || {};
    const ctx = R.CoachTools.sanitize(noteContext(noteId));
    const cfg = R.PROMPTS.cards;
    const input = cfg.system
      + '\nEn fazla ' + cfg.max + ' kart üret.\n\nNOTLAR (JSON):\n'
      + JSON.stringify(ctx, null, 1);

    const raw = await sample.json(input, { modelTier:'default', signal:o.signal });
    const res = validateCards(raw, note);
    if(!res.cards.length){
      throw Object.assign(new Error('Geçerli kart üretilemedi'), { code:'empty_completion' });
    }
    return res;
  }

  /* ---------- soru ipucu ----------
     Cevabı vermez, bir sonraki adımı söyler. Görsel desteği varsa
     fotoğraf da gönderilir; yoksa yalnız metinle çalışır. */
  async function questionHint(input, opts){
    if(!available()) throw Object.assign(new Error('AI koç bu ortamda kullanılamıyor'), { code:'unavailable' });
    const o = opts || {};
    const tone = (S.profile && S.profile.coachTone) || 'dengeli';
    const text = 'Sen bir YKS koçusun. Aday bir soruda takıldı.\n'
      + 'KURALLAR:\n' + HOUSE_RULES.map(r => '- ' + r).join('\n') + '\n'
      + R.PROMPTS.toneLine(tone) + '\n\n'
      + 'GÖREV: ' + R.PROMPTS.kinds.hint.ask + '\n\n'
      + 'SORU / TAKILDIĞI YER:\n' + String(input || '').slice(0, 1200) + '\n\n'
      + 'En fazla ' + R.PROMPTS.kinds.hint.maxSentences + ' cümle. Cevabı asla yazma.';

    const payload = o.image
      ? [{ role:'user', content:[{ type:'text', text }, o.image] }]
      : text;

    const { text:out } = await sample(payload, { modelTier:'quick', signal:o.signal, onText:o.onText });
    return validate(out);
  }

  async function supportsImages(){
    if(!available() || !sample.limits) return false;
    try{ const l = await sample.limits(); return !!(l && l.images); }
    catch(e){ return false; }
  }

  /* ---------- arayuz parcasi (uc ekranda ortak kullanilir) ---------- */

  const LABELS = {
    week:{ title:'AI koç — hafta yorumu', hint:'Haftanın verisini ve kendi review notlarını yorumlar', cta:'Haftayı yorumla' },
    gate:{ title:'AI koç — kapı yorumu', hint:'Medyanın bandın neresinde olduğunu ve neden o müdahalenin uygun olduğunu açıklar', cta:'Kapıyı yorumla' },
    roots:{ title:'AI koç — kök neden kalıbı', hint:'Yanlış defterindeki kök neden metinlerinde tekrar eden kalıbı arar', cta:'Kalıpları çözümle' },
    'daily-flow':{ title:'AI koç — bugünün akışı', hint:'Hangi adımın atlandığını ve bedelini söyler', cta:'Günü yorumla' },
    motivation:{ title:'AI koç — davranış notu', hint:'Son 7 günün davranış verisine bakar; övgü değil gözlem yazar', cta:'Davranışı yorumla' },
    risk:{ title:'AI koç — risk yorumu', hint:'En riskli konunun neden orada olduğunu açıklar', cta:'Riski yorumla' },
    'weekly-report':{
      id(){ return M.weekId(M.currentWeek()); },
      context(){ return weeklyReportContext(); },
      ask:R.PROMPTS.kinds['weekly-report'].ask,
    },
    devil:{
      id(){ return U.monthKey(U.today()); },
      context(){ return devilContext(); },
      ask:R.PROMPTS.kinds.devil.ask,
    },
    'weekly-report':{ title:'AI koç — haftalık rapor', hint:'Haftanın verisini, davranışı ve plan sağlığını tek raporda toplar', cta:'Haftalık raporu üret' },
    devil:{ title:'AI koç — karşı argüman', hint:'Planın kırılgan varsayımını dürüstçe söyler', cta:'Planımı sorgula' },
    'note-summary':{ title:'AI koç — ders özeti', hint:'Bu dersin notlarını tek özete indirir ve eksiği söyler', cta:'Notları özetle' },
  };

  /* payload: cached() ile alinan kayit veya null */
  function panel(kind, payload){
    if(!available()) return '';
    const { html, when } = R.h;
    const K = R.C;
    const L = LABELS[kind];
    const fresh = !!payload && !(kind === 'week' && payload.id !== KINDS.week.id());

    const body = fresh
      ? html`
        <p class="prose">${payload.text}</p>
        ${when(payload.warnings && payload.warnings.length, () => html`<div class="mt-10">
          ${K.Notice({ tone:'warn', title:'Kural motoru düzeltmesi:', body:payload.warnings.join(' ') })}</div>`)}
        <div class="row between mt-10">
          <span class="tiny dim">${new Date(payload.generatedAt).toLocaleString('tr-TR')} · veriden üretildi</span>
          ${K.Button({ label:'Yenile', icon:'refresh', size:'sm', tone:'ghost', act:'coach-run', data:{ 'data-kind':kind } })}
        </div>`
      : html`
        <p class="small muted">${L.hint}</p>
        ${K.Button({ label:L.cta, tone:'primary', block:true, class:'mt-10', act:'coach-run', data:{ 'data-kind':kind } })}`;

    return String(K.Card({
      class:'card--primary', title:L.title,
      sub:'Kural motorunun hesapladığı veriyi yorumlar; kararı değiştirmez',
      badge:fresh ? K.Badge({ label:'hazır', tone:'ok' }) : K.Badge({ label:'çevrimiçi', tone:'info' }),
      body:html`<div id="coach-out">${body}</div>`,
    }));
  }

  /* ---------- sohbet: koc sistemi okuyarak yanit verir ---------- */

  const CHAT_SYSTEM = R.PROMPTS.chatSystem
    + 'KURALLAR:\n' + HOUSE_RULES.map(r => '- '+r).join('\n') + '\n';

  function chatTurns(question){
    const history = (S.coachChat || []).slice(-6);
    const turns = [];
    history.forEach(m => turns.push({ role:m.role, content:m.text }));
    turns.push({ role:'user', content: (turns.length ? '' : CHAT_SYSTEM + '\nSORU: ') + question });
    return turns;
  }

  async function ask(question, opts){
    if(!available()) throw Object.assign(new Error('AI koç kullanılamıyor'), { code:'unavailable' });
    const o = opts || {};
    const { text } = await sample(chatTurns(question), {
      modelTier:'default',
      tools:R.CoachTools.forSample(),
      onText:o.onText,
      signal:o.signal,
    });
    const checked = validate(text);
    return { text:checked.text, warnings:checked.warnings };
  }

  async function pushChat(role, text, warnings){
    S.coachChat = (S.coachChat || []).concat([{ role, text, warnings:warnings || [], at:new Date().toISOString() }]).slice(-24);
    await R.Store.set('coach/chat', { messages:S.coachChat });
  }
  async function clearChat(){
    S.coachChat = [];
    await R.Store.remove('coach/chat');
  }

  /* Baglama gore onerilen sorular */
  function suggestions(){
    const C2 = R.Calc;
    const out = [];
    if(C2.analysisDebt().length) out.push('Analiz borcum var, hangi denemeden başlamalıyım?');
    if(C2.openErrors().length >= 5) out.push('Kök neden metinlerimde tekrar eden bir kalıp var mı?');
    if(C2.medianTrend('TYT').last3 != null) out.push('Net trendim hedef bandın neresinde?');
    out.push('Bu hafta neye odaklanmalıyım?');
    out.push('Hangi konular en çok net kaybettiriyor?');
    out.push('Konu kapanışımda en zayıf ders hangisi?');
    return out.slice(0, 4);
  }

  return { init, available, run, cached, panel, errorText, weekContext, gateContext, rootCauseContext,
    motivationContext, noteContext, weeklyReportContext, devilContext, recentSaid,
    generateCards, validateCards, questionHint, supportsImages,
    validate, KINDS, ask, pushChat, clearChat, suggestions, CHAT_SYSTEM };
})();
