/* Goodhart nöbetçisi — gösterge amaca dönüştüğünde haber verir.

   Goodhart yasası: bir ölçü hedef hâline geldiğinde, iyi bir ölçü olmaktan
   çıkar. Sınav hazırlığında bunun en bilinen hâli soru sayısıdır. Günde
   300 soru çözmek bir hedefe dönüştüğünde, aday kolay soruları seçmeye,
   yanlışlarını incelememeye ve süreyi tutmamaya başlar. Sayı yükselir,
   net yükselmez.

   Nöbetçi bunu arar: ÇABA'yı temsil eden bir sayı ile SONUÇ'u temsil eden
   bir sayı iki bitişik pencerede karşılaştırılır.

   Dört kural:

   1. NÖBETÇİ HÜKÜM VERMEZ, SORU SORAR. Ayrışmanın meşru sebepleri vardır:
      zor bir konuya geçiş, deneme kalitesinin değişmesi, hasta bir hafta.

   2. İKİ TARAFTA DA ÖLÇÜM YOKSA AYRIŞMA YOKTUR. Ölçülmemiş sonuç, sıfır
      sonuç değildir.

   3. ÇABA DÜŞERKEN UYARI ÜRETİLMEZ. Nöbetçinin işi tembelliği değil,
      VERİMSİZ GAYRETİ görmektir.

   4. KÜÇÜK HACİMDE GÜRÜLTÜ VARDIR; eşiğin altındaki hacim değerlendirilmez. */

window.R = window.R || {};

R.Goodhart = (function(){
  const U = R.U, S = R.S, M = R.Model;

  const PENCERE = 28;
  const CABA_ARTIS = 0.25;
  const SONUC_DURGUN = 0.05;

  function iso(n){ return U.iso(U.addDays(U.parse(U.todayISO()), n)); }

  function windows(){
    return {
      now:{ from:iso(-PENCERE), to:iso(0) },
      prev:{ from:iso(-2 * PENCERE), to:iso(-PENCERE) },
    };
  }
  function inWin(d, w){
    const x = String(d || '').slice(0, 10);
    return !!x && x >= w.from && x < w.to;
  }

  /* ------------------------------------------------------------ sayaçlar */

  function daysIn(w){
    return Object.keys(S.days || {}).filter(k => inWin(k, w)).map(k => S.days[k]);
  }

  function minutesIn(w){
    return daysIn(w).reduce((a, d) =>
      a + (d.blocks || []).reduce((x, b) => x + (Number(b.actualMin) || 0), 0), 0);
  }

  function questionsIn(w){
    return daysIn(w).reduce((a, d) => {
      const blok = (d.blocks || []).reduce((x, b) => x + (Number(b.actualQ) || 0), 0);
      return a + blok + (Number(d.paragraphActual) || 0) + (Number(d.problemActual) || 0)
        + (Number(d.freeQ) || 0);
    }, 0);
  }

  /* Blok doğruluk oranı: sayılan soruların kaçı doğru. */
  function accuracyIn(w){
    let soru = 0, dogru = 0;
    daysIn(w).forEach(d => {
      (d.blocks || []).forEach(b => {
        const q = Number(b.actualQ), c = Number(b.correctQ);
        if(!isFinite(q) || !isFinite(c) || !(q > 0)) return;
        soru += q; dogru += c;
      });
    });
    return soru >= 100 ? dogru / soru : null;
  }

  function examsIn(w){
    return (S.exams || []).filter(e => e.kind === 'full' && inWin(e.date, w));
  }

  /* Pencere içindeki tam denemelerin medyan neti. */
  function examMedianIn(w){
    const nets = examsIn(w).map(M.examNet).filter(v => isFinite(v));
    return nets.length >= 2 ? U.median(nets) : null;
  }

  /* Pencere içinde kapanan konu sayısı. Kapanış tarihi ikinci testin
     tarihinden gelir: bir konu ikinci testiyle kapanır. */
  function closedTopicsIn(w){
    let n = 0;
    Object.keys(S.topics || {}).forEach(sid => {
      const st = (S.topics[sid] || {}).states || {};
      Object.keys(st).forEach(tid => {
        const t = st[tid];
        if(t.state === 'closed' && inWin(t.secondAt, w)) n++;
      });
    });
    return n;
  }

  /* Pencerede işaretlenen hatalar ve bunların kaçının analizi yapılmış. */
  function errorsIn(w){
    return (S.errors || []).filter(e => inWin(e.createdAt, w));
  }

  /* -------------------------------------------------------------- çiftler */

  const PAIRS = [
    { id:'questions-vs-net',
      effortLabel:'çözülen soru', outcomeLabel:'deneme medyan neti',
      question:'Soru sayısı artarken net yerinde sayıyor — kolay soruları mı '
             + 'seçiyorsun, yoksa yanlışların üzerinden geçmiyor musun?',
      effort:questionsIn, outcome:examMedianIn, minEffort:300 },

    { id:'questions-vs-accuracy',
      effortLabel:'çözülen soru', outcomeLabel:'doğruluk oranı',
      question:'Daha çok soru çözüp aynı oranda yanlış yapmak, hatayı '
             + 'pekiştirmek olabilir. Yanlışlarını etiketliyor musun?',
      effort:questionsIn, outcome:accuracyIn, minEffort:300 },

    { id:'minutes-vs-closed',
      effortLabel:'çalışma dakikası', outcomeLabel:'kapanan konu',
      question:'Süre artıyor ama konu kapanmıyor. Konu testlerini erteliyor '
             + 'musun, yoksa konular kapanış eşiğini geçemiyor mu?',
      effort:minutesIn, outcome:closedTopicsIn, minEffort:600 },

    { id:'exams-vs-net',
      effortLabel:'çözülen deneme', outcomeLabel:'medyan net',
      question:'Deneme sayısı arttı, net yerinde. Analiz edilmeyen deneme '
             + 'bir ölçüm değil, bir yorgunluktur — kaç tanesinin analizi bitti?',
      effort:w => examsIn(w).length, outcome:examMedianIn, minEffort:4 },

    { id:'errors-vs-analysis',
      effortLabel:'işaretlenen hata', outcomeLabel:'analizi biten hata oranı',
      question:'Hata biriktiriyorsun ama üzerinden geçilmiyor. İncelenmeyen '
             + 'hata, tekrar edeceğin hatadır — hangisiyle başlarsın?',
      effort:w => errorsIn(w).length,
      outcome:w => {
        const h = errorsIn(w);
        if(h.length < 10) return null;
        return h.filter(e => e.closedAt || e.repairDoneAt).length / h.length;
      },
      minEffort:10 },
  ];

  /* ---------------------------------------------------------------- ölçüm */

  function oran(yeni, eski){
    if(eski == null || yeni == null) return null;
    if(eski === 0) return yeni > 0 ? Infinity : 0;
    return (yeni - eski) / Math.abs(eski);
  }

  function pair(def){
    const w = windows();
    const eC = def.effort(w.prev), yC = def.effort(w.now);
    const eS = def.outcome(w.prev), yS = def.outcome(w.now);

    const base = { id:def.id, effortLabel:def.effortLabel,
      outcomeLabel:def.outcomeLabel, question:def.question,
      effort:{ prev:eC, now:yC }, outcome:{ prev:eS, now:yS } };

    if(eS == null || yS == null){
      return Object.assign(base, { status:'unknown', cert:'missing',
        note:'Sonuç tarafında iki pencerenin birinde ölçüm yok. Ölçülmemiş '
           + 'sonuç, sıfır sonuç değildir.' });
    }
    if(!(yC >= def.minEffort)){
      return Object.assign(base, { status:'idle', cert:'measured',
        note:'Bu pencerede hacim değerlendirmeye yetmiyor ('
           + yC + ' < ' + def.minEffort + ').' });
    }
    const dC = oran(yC, eC);
    const dS = oran(yS, eS);
    if(dC == null || dC < CABA_ARTIS){
      return Object.assign(base, { status:'idle', cert:'measured',
        effortChange:dC, outcomeChange:dS,
        note:'Çaba belirgin biçimde artmamış; nöbetçi burada bir şey aramaz.' });
    }
    if(dS != null && dS > SONUC_DURGUN){
      return Object.assign(base, { status:'aligned', cert:'measured',
        effortChange:dC, outcomeChange:dS,
        note:'Çaba da sonuç da arttı. Gösterge hâlâ bir şeyi temsil ediyor.' });
    }
    return Object.assign(base, { status:'decoupled', cert:'measured',
      effortChange:dC, outcomeChange:dS,
      note:def.effortLabel + ' %' + Math.round(dC * 100) + ' arttı, '
         + def.outcomeLabel + ' '
         + (dS == null ? 'ölçülemedi'
            : dS >= 0 ? '%' + Math.round(dS * 100) + ' değişti'
            : '%' + Math.round(Math.abs(dS) * 100) + ' geriledi') + '.' });
  }

  function scan(){ return PAIRS.map(pair); }
  function flags(){ return scan().filter(p => p.status === 'decoupled'); }

  function brief(){
    const f = flags();
    if(!f.length) return null;
    return {
      count:f.length,
      title:f.length === 1 ? 'Bir gösterge ayrışmış' : f.length + ' gösterge ayrışmış',
      body:f[0].note + ' ' + f[0].question,
      flags:f,
    };
  }

  return { PAIRS, windows, pair, scan, flags, brief,
    PENCERE, CABA_ARTIS, SONUC_DURGUN };
})();
