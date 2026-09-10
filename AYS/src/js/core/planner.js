/* Plan üreteci — 40 haftalık sabit müfredatın yerine kişiye özel program.

   Girdi tamamen profilden gelir: başlangıç, sınav tarihi, haftalık kapasite,
   çalışma günü sayısı, seviye ve zayıf dersler. Aynı iki aday aynı planı almaz.

   Çıktı R.CURRICULUM ile aynı şekildedir:
     { n, title, topics:[ad], q, exam, check, phase, items:[{subjectId, topicId}] }
   Böylece plan ekranı, hafta ekranı ve gün üreteci değişmeden çalışır.

   Kural motoru otoritedir: plan burada üretilir, LLM plana karışmaz. */

window.R = window.R || {};

R.Planner = (function(){
  const U = R.U;

  /* Seviye: konu başına gereken süreyi ve soru hacmini ölçekler. */
  const LEVELS = {
    baslangic: { id:'baslangic', name:'Sıfırdan', pace:1.35, qScale:0.85,
      note:'Konuların çoğu yeni. Temel önce, hız sonra.' },
    orta:      { id:'orta', name:'Temeli var', pace:1.0, qScale:1.0,
      note:'Konuların bir kısmı tanıdık; tekrar + eksik kapatma.' },
    ileri:     { id:'ileri', name:'Tekrar ediyorum', pace:0.75, qScale:1.2,
      note:'Konular biliniyor; hız, hata ve deneme ağırlıklı.' },
  };

  /* Faz modeli — takvimin yüzdesine göre yerleşir, hafta sayısından bağımsız. */
  const PHASES = [
    { key:'kalibrasyon', to:0.08, label:'Kalibrasyon', theme:'Tanı ve sistem kurulumu',
      focus:['tyt-turkce', 'tyt-matematik'], exam:'1 tam TYT (tanı) + süresiz AYT denemesi',
      check:'Başlangıç netleri, süreler ve hata envanteri kaydedildi mi?', qFactor:0.55, aytRatio:0 },
    { key:'tyt-temel', to:0.28, label:'TYT temeli', theme:'Türkçe + Temel Matematik çekirdeği',
      focus:['tyt-turkce', 'tyt-matematik'], exam:'Haftada 1 branş denemesi',
      check:'Konu sonrası doğruluk %60’ın üzerinde mi?', qFactor:0.75, aytRatio:0 },
    { key:'tyt-cekirdek', to:0.45, label:'TYT çekirdeği', theme:'Problem, geometri ve fen bloğu',
      focus:['tyt-matematik', 'tyt-fen', 'tyt-turkce'], exam:'2 haftada 1 tam TYT + branş',
      check:'Problem doğruluğu %55’i geçti mi?', qFactor:0.9, aytRatio:0.1 },
    { key:'ayt-kopru', to:0.60, label:'AYT köprüsü', theme:'AYT Matematik önkoşulları açılıyor',
      focus:['ayt-matematik', 'tyt-matematik', 'tyt-fen'], exam:'Haftada 1 tam TYT + AYT branş',
      check:'AYT fonksiyon/polinom temelinde %60 doğruluk var mı?', qFactor:1.0, aytRatio:0.4 },
    { key:'cift-kulvar', to:0.78, label:'Çift kulvar', theme:'AYT ana blok + TYT koruma',
      focus:['ayt-matematik', 'ayt-fizik', 'ayt-kimya', 'ayt-biyoloji'], exam:'Haftada 1 TYT + 1 AYT',
      check:'TYT medyanı düşmeden AYT netleri yükseliyor mu?', qFactor:1.0, aytRatio:0.65 },
    { key:'tamamlama', to:0.90, label:'Tamamlama', theme:'Kalan konular ve ikinci tur',
      focus:['ayt-matematik', 'ayt-fizik', 'ayt-kimya', 'ayt-biyoloji', 'tyt-sosyal'], exam:'Haftada 2 tam deneme',
      check:'Konu kapanışı %75’i geçti mi?', qFactor:0.95, aytRatio:0.6 },
    { key:'prova', to:0.97, label:'Prova', theme:'Sınav koşullarında tekrar',
      focus:[], exam:'Haftada 2 tam deneme + analiz', qFactor:0.7, aytRatio:0.5,
      check:'Süre yönetimi ve taban skor sabitlendi mi?' },
    { key:'taper', to:1.01, label:'Sprint ve azaltma', theme:'Hacim düşer, ritim korunur',
      focus:[], exam:'Kısa oturumlar, tam deneme yok', qFactor:0.4, aytRatio:0.4,
      check:'Uyku sınav saatine ayarlandı mı, evrak hazır mı?' },
  ];

  function levels(){ return LEVELS; }
  function level(id){ return LEVELS[id] || LEVELS.orta; }

  function phaseAt(n, total){
    const ratio = total <= 1 ? 1 : n / total;
    return PHASES.find(p => ratio <= p.to) || PHASES[PHASES.length-1];
  }

  /* "3–4 gün" gibi metni sayıya çevirir; "sürekli" tekrarlayan konudur. */
  function topicDays(text){
    const s = String(text || '');
    if(/sürekli|surekli/i.test(s)) return 0;
    const nums = s.match(/\d+/g);
    if(!nums) return 2;
    const vals = nums.map(Number);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  /* Konu havuzu: ders içi önkoşul sırası korunur, frekans önceliği eklenir. */
  function pool(profile){
    const weak = (profile && profile.weakSubjects) || [];
    const out = [];
    R.SUBJECTS.forEach(sub => {
      sub.topics.forEach(t => {
        out.push({
          subjectId:sub.id, subjectName:sub.name, exam:sub.exam,
          topicId:t.id, name:t.name, order:t.order, freq:t.freq,
          days:topicDays(t.days),
          recurring:topicDays(t.days) === 0,
          weak:weak.indexOf(sub.id) >= 0,
        });
      });
    });
    return out;
  }

  /* Haftalık soru hedefi: kapasite × seviye × faz katsayısı × takvim yükü.
     Tatil ya da okul sınavı olan hafta hedefi otomatik düşer. */
  function weeklyQuestions(profile, phase, loadFactor){
    const cap = Number(profile.capacityHoursPerWeek) || 21;
    const lv = level(profile.level);
    const perHour = 22;
    const load = loadFactor == null ? 1 : loadFactor;
    return Math.round(cap * perHour * phase.qFactor * lv.qScale * load / 10) * 10;
  }

  /* Bir haftaya kaç konu sığar? Kapasite ve seviyeye göre 1–3. */
  function topicsPerWeek(profile){
    const cap = Number(profile.capacityHoursPerWeek) || 21;
    const lv = level(profile.level);
    const budget = (cap / 3.5) / lv.pace;          // kabaca "kaç gün konu işlenebilir"
    return U.clamp(Math.round(budget / 2.2), 1, 5);
  }

  /* Karar kapısı haftaları — takvimin yüzdesine oturur. */
  function gateWeeks(total){
    return [0.28, 0.42, 0.55, 0.74, 0.86]
      .map(r => Math.max(1, Math.round(total * r)))
      .filter((w, i, a) => a.indexOf(w) === i && w <= total);
  }

  /* ---------- ana üreteç ---------- */

  /* Takvim tüm konulara yetmiyorsa hangileri düşer?
     Önce düşük frekans, sonra orta; yüksek frekanslı konu asla düşmez.
     Zayıf işaretlenen ders korunur. Düşenler gizlenmez, rapor edilir. */
  function fitPool(queue, slots){
    if(queue.length <= slots) return { kept:queue, dropped:[] };
    const rank = { low:0, mid:1, high:2 };
    const sorted = queue.slice().sort((a, b) => {
      if(a.weak !== b.weak) return a.weak ? 1 : -1;          // zayıf ders sona düşmez
      if(rank[a.freq] !== rank[b.freq]) return rank[a.freq] - rank[b.freq];
      return b.order - a.order;                               // geç sıradaki önce düşer
    });
    const dropCount = queue.length - slots;
    const dropSet = {};
    sorted.slice(0, dropCount).forEach(t => { dropSet[t.subjectId + ':' + t.topicId] = true; });
    return {
      kept:queue.filter(t => !dropSet[t.subjectId + ':' + t.topicId]),
      dropped:queue.filter(t => dropSet[t.subjectId + ':' + t.topicId]),
    };
  }

  function generate(profile, totalWeeks){
    const p = profile || {};
    const total = Math.max(1, totalWeeks || 40);
    const perWeek = topicsPerWeek(p);
    const gates = gateWeeks(total);

    const all = pool(p);
    const recurring = all.filter(t => t.recurring);
    const rawQueue = all.filter(t => !t.recurring);

    /* Konu işlenebilen hafta sayısı (prova ve taper hariç). */
    let productive = 0;
    for(let n = 1; n <= total; n++){
      if(phaseAt(n, total).focus.length) productive++;
    }
    const fitted = fitPool(rawQueue, productive * perWeek);
    const queue = fitted.kept;

    /* Ders içi sıra korunur; dersler faz odağına göre sıraya girer. */
    const bySubject = {};
    queue.forEach(t => {
      (bySubject[t.subjectId] = bySubject[t.subjectId] || []).push(t);
    });
    Object.keys(bySubject).forEach(k => {
      bySubject[k].sort((a, b) => {
        if(a.order !== b.order) return a.order - b.order;
        return 0;
      });
    });

    const taken = {};
    const weeks = [];

    for(let n = 1; n <= total; n++){
      const phase = phaseAt(n, total);
      const items = [];

      if(phase.focus.length){
        /* Faz odağındaki derslerden sırayla al; biten dersin yerine
           aynı sınav ailesinden kalan en yüksek frekanslı konu gelir. */
        const order = phase.focus.slice();
        let guard = 0;
        while(items.length < perWeek && guard++ < 40){
          let placed = false;
          for(const sid of order){
            if(items.length >= perWeek) break;
            const list = bySubject[sid] || [];
            const next = list.find(t => !taken[t.subjectId + ':' + t.topicId]);
            if(!next) continue;
            taken[next.subjectId + ':' + next.topicId] = true;
            items.push(next);
            placed = true;
          }
          if(!placed) break;
        }
        /* Odak dersleri bittiyse kalan havuzdan frekansa göre doldur. */
        if(items.length < perWeek){
          /* Yedek doldurma: her dersten YALNIZ sıradaki konu alınabilir,
             böylece ders içi önkoşul sırası hiçbir durumda bozulmaz. */
          const wantAyt = phase.aytRatio >= 0.5;
          const heads = Object.keys(bySubject)
            .map(sid => (bySubject[sid] || []).find(t => !taken[t.subjectId + ':' + t.topicId]))
            .filter(Boolean)
            .sort((a, b) => {
              const fam = (wantAyt ? (b.exam === 'AYT') - (a.exam === 'AYT')
                                   : (b.exam === 'TYT') - (a.exam === 'TYT'));
              if(fam) return fam;
              const fw = { high:0, mid:1, low:2 };
              if(fw[a.freq] !== fw[b.freq]) return fw[a.freq] - fw[b.freq];
              return a.order - b.order;
            });
          for(const t of heads){
            if(items.length >= perWeek) break;
            if(taken[t.subjectId + ':' + t.topicId]) continue;
            taken[t.subjectId + ':' + t.topicId] = true;
            items.push(t);
          }
        }
      }

      const load = (R.Model && R.Model.weekLoad) ? R.Model.weekLoad(n) : 1;
      const isGate = gates.indexOf(n) >= 0;
      const names = items.map(t => t.name);
      const title = items.length
        ? (phase.label + ' — ' + items[0].subjectName.replace(/^TYT |^AYT /, ''))
        : phase.label;

      weeks.push({
        n,
        phase:phase.key,
        phaseLabel:phase.label,
        theme:phase.theme,
        title,
        topics:names.length ? names : [phase.theme],
        items:items.map(t => ({ subjectId:t.subjectId, topicId:t.topicId, name:t.name })),
        recurring:recurring.map(t => t.name),
        q:weeklyQuestions(p, phase, load),
        load:U.round(load, 2),
        exam:phase.exam,
        check:isGate
          ? 'KARAR KAPISI: ' + phase.check + ' Son 3 denemenin medyanına bak, tek müdahale seç.'
          : phase.check,
        gate:isGate,
      });
    }

    const placed = Object.keys(taken).length;
    return {
      weeks,
      meta:{
        total, perWeek, gates, productive,
        level:level(p.level).id,
        capacityHoursPerWeek:Number(p.capacityHoursPerWeek) || 21,
        placed,
        poolSize:rawQueue.length,
        leftover:queue.length - placed,
        dropped:fitted.dropped.map(t => ({
          subjectId:t.subjectId, subjectName:t.subjectName,
          topicId:t.topicId, name:t.name, freq:t.freq,
        })),
        coverage:U.pct(placed, rawQueue.length),
        /* Tam kapsama için gereken haftalık saat — dürüst kapasite tavsiyesi. */
        capacityForFull:(function(){
          const need = productive ? Math.ceil(rawQueue.length / productive) : perWeek;
          const cap = Number(p.capacityHoursPerWeek) || 21;
          return need <= perWeek ? cap : Math.ceil(cap * need / Math.max(1, perWeek));
        })(),
        generatedAt:new Date().toISOString(),
        version:1,
      },
    };
  }

  /* Planın gerçeklikle uyumu — otomasyon bunu okuyup yeniden planlar. */
  function health(plan, currentWeek){
    if(!plan || !plan.weeks.length) return null;
    const M = R.Model, C = R.Calc;
    const past = plan.weeks.filter(w => w.n < currentWeek);
    let expected = 0, closed = 0;

    past.forEach(w => {
      (w.items || []).forEach(it => {
        expected++;
        const st = M.topicState(it.subjectId, it.topicId);
        if(st.state === 'closed' || st.state === 'provisional') closed++;
      });
    });

    const pct = expected ? U.pct(closed, expected) : null;
    const behind = expected - closed;
    const weeksLeft = Math.max(0, plan.meta.total - currentWeek + 1);
    const perWeek = plan.meta.perWeek || 2;
    const behindWeeks = perWeek ? U.round(behind / perWeek, 1) : 0;

    return {
      expected, closed, behind, pct, weeksLeft, behindWeeks,
      leftover:plan.meta.leftover,
      status: pct == null ? 'yeni'
        : pct >= 85 ? 'saglikli'
        : pct >= 60 ? 'sapma'
        : 'geride',
      note: pct == null ? 'Henüz geçmiş hafta yok; plan ilk haftasında.'
        : pct >= 85 ? 'Plan gerçeklikle uyumlu. Devam.'
        : pct >= 60 ? behind+' konu geride kaldı (~'+behindWeeks+' hafta). Hedef hacmi bir tık kısmak yeter.'
        : behind+' konu geride kaldı (~'+behindWeeks+' hafta). Plan sıkıştırılmalı: düşük frekanslı konular çıkarılır.',
    };
  }

  /* Kalan haftaları bugünden itibaren yeniden üretir; geçmiş haftalar korunur.
     Kapanmış konular havuzdan düşer, kapanmayanlar öne alınır. */
  function replan(plan, profile, currentWeek){
    const M = R.Model;
    const fresh = generate(profile, plan.meta.total);
    const kept = plan.weeks.filter(w => w.n < currentWeek);

    const done = {};
    R.SUBJECTS.forEach(s => s.topics.forEach(t => {
      const st = M.topicState(s.id, t.id);
      if(st.state === 'closed') done[s.id + ':' + t.id] = true;
    }));

    /* Kapanmamış ama geçmişte planlanmış konuları öne al. */
    const carry = [];
    kept.forEach(w => (w.items || []).forEach(it => {
      if(!done[it.subjectId + ':' + it.topicId]) carry.push(it);
    }));

    const rest = fresh.weeks.filter(w => w.n >= currentWeek);
    const seen = {};
    carry.forEach(it => { seen[it.subjectId + ':' + it.topicId] = true; });

    /* Devredilen konular sıradaki haftaların başına yerleşir. */
    let ci = 0;
    rest.forEach(w => {
      const items = [];
      while(items.length < (fresh.meta.perWeek || 2) && ci < carry.length){
        items.push(carry[ci++]);
      }
      (w.items || []).forEach(it => {
        if(items.length >= (fresh.meta.perWeek || 2)) return;
        if(seen[it.subjectId + ':' + it.topicId]) return;
        items.push(it);
      });
      if(items.length){
        w.items = items;
        w.topics = items.map(i => i.name);
      }
    });

    return {
      weeks:kept.concat(rest),
      meta:Object.assign({}, fresh.meta, {
        replannedAt:new Date().toISOString(),
        replannedFrom:currentWeek,
        carried:carry.length,
      }),
    };
  }


  /* Senaryo karşılaştırma: "günde 1 saat daha çalışsam ne olur?"
     Kapasite kararını hisle değil sayıyla verdirir. */
  function scenarios(profile, total, deltas){
    const base = generate(profile, total);
    const list = (deltas || [-5, 0, 5, 10]).map(d => {
      const cap = Math.max(4, (Number(profile.capacityHoursPerWeek) || 21) + d);
      const p = Object.assign({}, profile, { capacityHoursPerWeek:cap });
      const plan = generate(p, total);
      return {
        delta:d, capacity:cap,
        perWeek:plan.meta.perWeek,
        coverage:plan.meta.coverage,
        dropped:plan.meta.dropped.length,
        weeklyQ:plan.weeks[Math.min(10, plan.weeks.length-1)].q,
        gain:plan.meta.coverage - base.meta.coverage,
        perDay:U.round(cap / (Number(profile.studyDaysPerWeek) || 6), 1),
      };
    });
    return { base:base.meta, rows:list };
  }

  /* Önkoşul denetimi: bir konu, aynı dersteki daha erken sıralı konudan
     önce planlanmış mı? Üreteç bunu bozmaz; bu fonksiyon güvence katmanıdır. */
  function checkPrerequisites(plan){
    const last = {};
    const issues = [];
    plan.weeks.forEach(w => {
      (w.items || []).forEach(it => {
        const sub = R.SUBJECTS.find(x => x.id === it.subjectId);
        const t = sub && sub.topics.find(x => x.id === it.topicId);
        if(!t) return;
        if(last[it.subjectId] != null && t.order < last[it.subjectId]){
          issues.push({ week:w.n, subjectId:it.subjectId, topic:t.name,
            order:t.order, after:last[it.subjectId] });
        }
        last[it.subjectId] = t.order;
      });
    });
    return { ok:issues.length === 0, issues };
  }

  /* Enerjiye göre gün dağılımı: zor konu yüksek enerjili güne.
     Son 4 haftanın enerji ortalamasından haftanın günleri sıralanır. */
  function energyByWeekday(days){
    const n = days || 28;
    const buckets = {};
    for(let i = 0; i < n; i++){
      const iso = U.iso(U.addDays(U.today(), -i));
      const rec = R.S.mood[iso];
      if(!rec) continue;
      const dow = U.weekdayIndex(iso);
      buckets[dow] = buckets[dow] || { dow, vals:[] };
      buckets[dow].vals.push(rec.energy);
    }
    const rows = Object.keys(buckets).map(k => {
      const b = buckets[k];
      return {
        dow:Number(k),
        label:R.WEEKDAYS[Number(k)].short,
        avg:U.round(U.sum(b.vals) / b.vals.length, 1),
        n:b.vals.length,
      };
    }).sort((a, b) => b.avg - a.avg);
    return {
      ok:rows.length >= 3, rows,
      best:rows[0] || null,
      worst:rows[rows.length-1] || null,
      note:rows.length < 3
        ? 'Enerji kaydı yetersiz; birkaç gün giriş yapınca öneri çıkar.'
        : 'En yüksek enerji ' + rows[0].label + ', en düşük ' + rows[rows.length-1].label
          + '. Zor konuyu ' + rows[0].label + ' gününe koy.',
    };
  }

  return { LEVELS, PHASES, levels, level, phaseAt, topicDays, pool,
    weeklyQuestions, topicsPerWeek, gateWeeks, generate, health, replan,
    scenarios, checkPrerequisites, energyByWeekday };
})();
