/* Otomasyon — sistemin kendi kendine yaptığı işler.

   İlke: otomasyon ÖNERİR, kullanıcı ONAYLAR. Hiçbir şey sessizce değişmez.
   Her öneri "neden" taşır ve tek tıkla uygulanır ya da atlanır.

   Kural motoru (R.Calc) ve plan üreteci (R.Planner) otoritedir; burası
   yalnız onların çıktısını eyleme çevirir. LLM burada yer almaz. */

window.R = window.R || {};

R.Auto = (function(){
  const U = R.U, M = R.Model, C = R.Calc, S = R.S;

  /* ---------- haftalık sözleşmeyi plandan doldur ---------- */

  /* Plandaki konular + risk sıralaması → hafta sözleşmesi taslağı.
     İmzalı hafta dokunulmaz. */
  function draftWeek(n){
    const week = S.weeks[M.weekId(n)];
    if(!week) return null;
    if(week.signedAt) return { ok:false, reason:'Hafta imzalı; önce revize et.' };

    const plan = M.curriculumFor(n);
    const items = (plan.items || []).slice(0, 3);
    const risky = C.riskRanking(6);
    const carry = week.carryIn || [];

    /* Plan konuları + geçen haftadan devir + en riskli konu (varsa boşluk). */
    const picked = [];
    const seen = {};
    const push = (name, subjectId, topicId, why) => {
      const key = (subjectId || '') + ':' + (topicId || '') + ':' + name;
      if(seen[key] || picked.length >= 3) return;
      seen[key] = true;
      picked.push({ name, subjectId:subjectId || null, topicId:topicId || null, why });
    };

    carry.forEach(name => push(name, null, null, 'geçen haftadan devir'));
    items.forEach(it => push(it.name, it.subjectId, it.topicId, 'plandaki sıra'));
    risky.forEach(r => {
      if(picked.length >= 3) return;
      push(r.topicName, r.subjectId, r.topicId, 'risk ' + r.score + ' — ' + r.label.toLowerCase());
    });

    const cap = Number(S.profile.capacityHoursPerWeek) || 21;
    const target = plan.q || 400;
    const perTopic = Math.max(40, Math.round(target / Math.max(1, picked.length) / 10) * 10);

    return {
      ok:true,
      topics:picked.map(p => ({
        name:p.name, subjectId:p.subjectId, topicId:p.topicId,
        questionTarget:perTopic, accuracy:70, why:p.why,
      })),
      questionTarget:target,
      capacityMin:Math.round(cap * 60),
      behaviorGoal:week.behaviorGoal || suggestBehaviorGoal(),
      examPlan:plan.exam,
      checkpoint:plan.check,
    };
  }

  /* Davranış hedefi verideki en zayıf davranıştan seçilir. */
  function suggestBehaviorGoal(){
    const sleep = C.sleepAverage(7);
    const target = (S.profile && S.profile.sleepTarget) || 7.5;
    const streak = C.behaviorStreak().streak;
    const debt = C.analysisDebt().length;

    if(sleep != null && sleep < target - 0.75) return '6 gün ' + target + ' saat uyku';
    if(debt) return 'Her denemenin analizi 24 saat içinde biter';
    if(streak < 3) return '6 gün minimum standardı tuttur';
    if(C.cardDebt() > 10) return 'Her gün due kartları sıfırla';
    return '6 gün planlanan blokların en az beşini tamamla';
  }

  async function applyDraft(n, draft){
    const week = S.weeks[M.weekId(n)];
    if(!week || !draft || !draft.ok) return false;
    week.mainTopics = draft.topics.map(t => ({
      name:t.name, questionTarget:t.questionTarget, accuracy:t.accuracy,
      subjectId:t.subjectId, topicId:t.topicId,
    }));
    week.questionTarget = draft.questionTarget;
    week.capacityMin = draft.capacityMin;
    if(!week.behaviorGoal) week.behaviorGoal = draft.behaviorGoal;
    await M.saveWeek(n);
    return true;
  }

  /* ---------- günün bloklarını haftanın konularına bağla ---------- */

  async function syncDayBlocks(dateISO){
    const iso = dateISO || U.todayISO();
    const day = S.days[iso];
    if(!day) return 0;
    const n = M.weekOf(iso);
    const week = S.weeks[M.weekId(n)];
    if(!week || !week.mainTopics.length) return 0;

    let changed = 0;
    const work = day.blocks.filter(b => b.slot !== 'Dinlenme');
    work.forEach((b, i) => {
      if(b.status !== 'pending') return;          // başlanmış bloğa dokunma
      const t = week.mainTopics[i % week.mainTopics.length];
      if(!t) return;
      if(b.topic !== t.name || b.subjectId !== (t.subjectId || null)){
        b.topic = t.name;
        b.subjectId = t.subjectId || null;
        b.topicId = t.topicId || null;
        changed++;
      }
    });
    if(changed) await M.saveDay(iso);
    return changed;
  }

  /* ---------- öneri kuyruğu ----------
     Bugün ekranında ve hafta ekranında gösterilir; her biri tek tıkla uygulanır. */

  function suggestions(){
    const out = [];
    const n = M.currentWeek();
    const week = S.weeks[M.weekId(n)];
    const health = M.planHealth();
    const todayISO = U.todayISO();
    const day = S.days[todayISO];

    if(week && !week.signedAt && !week.mainTopics.some(t => t.name)){
      out.push({
        id:'draft-week', icon:'week', title:'Haftalık sözleşmeyi doldur',
        why:'Plandaki konular ve risk sıralaması hazır; taslak tek tıkla yazılır.',
        act:'auto-draft-week', tone:'primary',
      });
    }

    if(day && week && week.mainTopics.length){
      const unlinked = day.blocks.filter(b => b.slot !== 'Dinlenme' && b.status === 'pending' && !b.subjectId).length;
      if(unlinked >= 2){
        out.push({
          id:'sync-blocks', icon:'today', title:'Blokları haftanın konularına bağla',
          why:unlinked+' blok derse bağlı değil; bağlanmayan blok konu istatistiğine girmez.',
          act:'auto-sync-blocks',
        });
      }
    }

    if(health && health.status === 'geride'){
      out.push({
        id:'replan', icon:'map', title:'Planı yeniden hesapla',
        why:health.note,
        act:'auto-replan', tone:'primary',
      });
    }

    const pending = C.pendingSecondChecks().filter(p => p.overdue);
    if(pending.length){
      out.push({
        id:'second-check', icon:'check', title:pending.length+' konuda 2. ölçüm gecikti',
        why:'Tek ölçüm kapanış saymaz; gecikmiş ölçüm konu kapanışını olduğundan iyi gösterir.',
        act:'go', data:{ 'data-route':'subjects' },
      });
    }

    const triggers = C.protocolTriggers().filter(t => !M.activeProtocols().some(a => a.protoId === t.id));
    triggers.forEach(t => {
      out.push({
        id:'proto-' + t.id, icon:'shield', title:'Telafi önerisi: ' + t.title,
        why:t.detail, act:'go', data:{ 'data-route':'protocols' },
      });
    });

    const notesNoCards = S.videoNotes.filter(v =>
      v.segments.length >= 3 && !S.cards.some(c => c.source === 'note' && c.sourceRef === v.id));
    if(notesNoCards.length){
      out.push({
        id:'note-cards', icon:'cards', title:notesNoCards.length+' dersin notu karta dönmedi',
        why:'Not tek başına tekrar değildir; kart olmadan iki haftada unutulur.',
        act:'go', data:{ 'data-route':'learn' },
      });
    }

    /* Erken uyarı: iki hafta üst üste sapma varsa dördüncü haftayı bekleme. */
    const drift = driftStreak();
    if(drift.weeks >= 2){
      out.push({
        id:'drift', icon:'warn', title:drift.weeks + ' hafta üst üste plan sapması',
        why:'Ortalama tamamlama %' + drift.avg + '. Bu bir irade sorunu değil kapasite sorunu olabilir; '
          + 'hedefi kısmak ya da engeli kaldırmak gerekir.',
        act:'go', data:{ 'data-route':'protocols' }, tone:'primary',
      });
    }

    /* Pazar akşamı: hafta kapanışı hatırlatması. */
    const dow = U.weekdayIndex(U.today());
    if(dow === 6 && !S.reviews[M.weekId(n)]){
      out.push({
        id:'close-week', icon:'check', title:'Haftayı kapat',
        why:'Pazar review’u 30–40 dakika. Sistem özeti hazırladı; sen dört sütunu doldur.',
        act:'auto-close-week', tone:'primary',
      });
    }

    /* Sınav haftası modu: son iki hafta arayüz sadeleşir. */
    const ew = C.examWeekMode();
    if(ew.active && !S.ui.examWeekAck){
      out.push({
        id:'exam-week', icon:'flag', title:'Sınav haftası modu',
        why:ew.note + ' Kalan ' + ew.daysLeft + ' gün.',
        act:'auto-exam-week',
      });
    }

    if(M.backupDue()){
      out.push({
        id:'backup', icon:'download', title:'Yedek al',
        why:'Son yedekten bu yana bir haftadan fazla geçti; tarayıcı verisi silinirse geçmiş kaybolur.',
        act:'export-data',
      });
    }

    return out;
  }

  /* Üst üste sapan hafta sayısı — erken uyarının girdisi. */
  function driftStreak(){
    const cur = M.currentWeek();
    let weeks = 0;
    const vals = [];
    for(let n = cur - 1; n >= Math.max(1, cur - 4); n--){
      const comp = C.planCompletion(n);
      if(comp == null) break;
      if(comp >= 70) break;
      weeks++;
      vals.push(comp);
    }
    return { weeks, avg:vals.length ? U.round(U.sum(vals) / vals.length, 0) : null };
  }

  /* Hafta kapanış taslağı: review'un dört sütununu veriyle doldurur. */
  function closeWeekDraft(n){
    const week = S.weeks[M.weekId(n)];
    const comp = C.planCompletion(n);
    const qr = C.questionRealization(n);
    const reasons = C.skipReasonCounts(n);
    const topReason = Object.keys(reasons).sort((a, b) => reasons[b] - reasons[a])[0];
    const blocks = C.weekBlocks(n, true);
    const solved = U.sum(blocks.map(b => b.actualQ || 0));
    const correct = U.sum(blocks.map(b => b.correctQ || 0));
    const acc = solved ? U.pct(correct, solved) : null;

    const planned = week && week.mainTopics.length
      ? week.mainTopics.map(t => t.name + ' (' + t.questionTarget + ' soru)').join(', ')
      : 'Hafta sözleşmesi boş kaldı.';
    const done = qr
      ? qr.solved + ' soru çözüldü (hedef ' + qr.target + '), plan tamamlama %' + (comp == null ? '—' : comp) + '.'
        + (acc != null ? ' Doğruluk %' + acc + '.' : '')
      : 'Ölçülebilir çıktı kaydedilmedi.';
    const why = topReason
      ? 'En sık sapma nedeni: ' + topReason + ' (' + reasons[topReason] + ' blok).'
      : (comp != null && comp >= 85 ? 'Belirgin sapma yok.' : 'Sapma nedeni işaretlenmemiş.');

    /* Devir: kapanmamış plan konuları. */
    const carry = [];
    const plan = M.curriculumFor(n);
    (plan.items || []).forEach(it => {
      const st = M.topicState(it.subjectId, it.topicId);
      if(st.state !== 'closed' && carry.length < 2) carry.push(it.name);
    });

    return { planned, done, why, decision:'', carry };
  }

  /* ---------- gün açılışında çalışan sessiz bakım ----------
     Yalnız güvenli işler: plan üretimi ve blok bağlama. Veri silmez. */
  async function onDayOpen(){
    const done = [];
    try{
      if(S.profile && S.profile.setupDone){
        const before = S.plan;
        await M.ensurePlan();
        if(S.plan !== before) done.push('plan');
      }
      const n = await syncDayBlocks();
      if(n) done.push('bloklar:' + n);
    }catch(e){
      console.error('[Auto]', e);
    }
    return done;
  }

  return { draftWeek, applyDraft, suggestBehaviorGoal, syncDayBlocks, suggestions, onDayOpen,
    driftStreak, closeWeekDraft };
})();
