/* Veri okuma katmani — ofis ajanlarinin sistemi gorebilmesi icin.

   Ajanlar bu fonksiyonlar araciligiyla uygulamadaki gercek veriyi okur.
   Araclar YALNIZ OKUR — hicbiri veriyi degistirmez.
   sanitize() modele giden her nesneyi suzer: kisisel alanlar (ad, sehir,
   okul) her derinlikte silinir ve metin icinde de maskelenir. */

window.R = window.R || {};

R.Tools = (function(){
  const U = R.U, M = R.Model, C = R.Calc, S = R.S;

  function num(x){ return x == null ? null : (typeof x === 'number' ? U.round(x, 2) : x); }

  /* ---------- arac govdeleri ---------- */

  function durum(){
    const n = M.currentWeek();
    const tyt = C.medianTrend('TYT'), ayt = C.medianTrend('AYT');
    const gate = C.currentGate();
    const week = S.weeks[M.weekId(n)];
    return {
      bugun:U.todayISO(),
      programHaftasi:n,
      toplamHafta:R.PLAN.totalWeeks,
      sinavaKalanGun:U.diffDays(U.todayISO(), R.PLAN.examTytISO),
      haftaBasligi:week ? week.title : null,
      haftaImzalandi:!!(week && week.signedAt),
      planTamamlama:C.planCompletion(n),
      soruGerceklesme:C.questionRealization(n),
      tytMedyan:num(tyt.last3), tytDelta:num(tyt.delta), tytTaban:num(C.examBase('TYT')),
      aytMedyan:num(ayt.last3), aytDelta:num(ayt.delta), aytTaban:num(C.examBase('AYT')),
      konuKapanisYuzdesi:C.overallClosure().pct,
      tekrarBorcuYuzdesi:C.cardDebt(),
      dueKart:C.dueCards().length,
      acikYanlis:C.openErrors().length,
      analizBorcu:C.analysisDebt().length,
      uykuOrtalamasi:C.sleepAverage(7),
      davranisSerisi:C.behaviorStreak().streak,
      ayinKapisi:gate ? { ay:gate.ay || gate.month, tytBant:gate.tyt, tytGuvenli:gate.tytSafe, aytBant:gate.ayt, kural:gate.note } : null,
      aktifTelafi:M.activeProtocols().map(p => p.title),
      telafiTetikleyicileri:C.protocolTriggers().map(t => t.detail),
    };
  }

  function denemeler(input){
    const o = input || {};
    let list = S.exams.slice().sort((a,b) => b.date.localeCompare(a.date));
    if(o.aile) list = list.filter(e => e.family === o.aile);
    if(o.yalnizTam) list = list.filter(e => e.kind === 'full');
    return list.slice(0, o.limit || 12).map(e => ({
      tarih:e.date, tur:e.type, aile:e.family, yayin:e.publisher || null,
      toplamNet:num(M.examNet(e)),
      testler:(e.tests || []).map(t => ({ ad:t.name, dogru:t.correct, yanlis:t.wrong, bos:t.blank, net:num(M.testNet(t)), dakika:t.minutes })),
      analizTamam:!!e.analysisCompletedAt,
      hataSayisi:S.errors.filter(x => x.examId === e.id).length,
    }));
  }

  function hatalar(input){
    const o = input || {};
    let list = S.errors.slice().sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
    if(o.etiket) list = list.filter(e => e.tag === o.etiket);
    if(o.yalnizAcik) list = list.filter(e => !e.closedAt);
    return {
      dagilim:C.errorPareto().filter(p => p.count).map(p => ({ etiket:p.tag, ad:R.ERROR_TAGS[p.tag].name, adet:p.count, yuzde:p.pct })),
      kayitlar:list.slice(0, o.limit || 30).map(e => ({
        tarih:(e.createdAt || '').slice(0,10),
        test:e.testName || null, konu:e.topic || null, etiket:e.tag, durum:e.status,
        kokNeden:e.rootCause || null, dogruIlke:e.principle || null,
        recete:e.recipe || null, kapandi:!!e.closedAt,
      })),
    };
  }

  function konular(input){
    const o = input || {};
    const subjects = o.ders ? R.SUBJECTS.filter(s => s.id === o.ders || s.name === o.ders) : R.SUBJECTS;
    return subjects.map(s => {
      const c = C.subjectClosure(s.id);
      const topics = s.topics.map(t => {
        const st = M.topicState(s.id, t.id);
        return {
          konu:t.name, grup:t.group || null, siklik:t.freq, tahminiSure:t.days,
          durum:R.TOPIC_STATES[st.state].label,
          ilkOlcum:st.first, ikinciOlcum:st.second,
        };
      });
      return {
        ders:s.name, dersId:s.id, sinav:s.exam, soruSayisi:s.questions, hedefBant:s.targetBand,
        kapanan:c.closed, toplamKonu:c.total, kapanisYuzdesi:c.pct,
        konular: o.tumKonular ? topics : topics.filter(t => t.durum !== 'Başlanmadı'),
        baslanmayanSayisi: topics.filter(t => t.durum === 'Başlanmadı').length,
      };
    });
  }

  function haftalar(input){
    const o = input || {};
    const cur = M.currentWeek();
    const from = Math.max(1, cur - (o.gerideHafta || 6));
    const out = [];
    for(let n = from; n <= cur; n++){
      const w = S.weeks[M.weekId(n)];
      const rev = S.reviews[M.weekId(n)];
      out.push({
        hafta:n,
        tarih:U.fmtRange(M.weekStart(n), M.weekEnd(n)),
        baslik:w ? w.title : M.curriculumFor(n).title,
        anaKonular:w ? w.mainTopics.map(t => t.name) : [],
        soruHedefi:w ? w.questionTarget : null,
        planTamamlama:C.planCompletion(n),
        soruGerceklesme:C.questionRealization(n),
        imzalandi:!!(w && w.signedAt),
        sapmaNedenleri:C.skipReasonCounts(n),
        review: rev ? { planlandi:rev.planned, yapildi:rev.done, neden:rev.why, duzeltme:rev.decision, devir:rev.carry } : null,
      });
    }
    return out;
  }

  function gunler(input){
    const o = input || {};
    const days = o.gun || 14;
    const out = [];
    for(let i = 0; i < days; i++){
      const iso = U.iso(U.addDays(U.today(), -i));
      const d = S.days[iso];
      if(!d) continue;
      const blocks = d.blocks.filter(b => b.slot !== 'Dinlenme');
      out.push({
        tarih:iso,
        gun:R.WEEKDAYS[d.dow].label,
        tamamlanan:blocks.filter(b => b.status === 'done').length,
        toplamBlok:blocks.length,
        calisilanDakika:U.sum(blocks.map(b => b.actualMin || 0)),
        cozulenSoru:U.sum(blocks.map(b => b.actualQ || 0)),
        paragraf:d.paragraphActual+'/'+d.paragraphTarget,
        uyku:d.sleepHours,
        atlamaNedenleri:blocks.filter(b => b.skipReason).map(b => b.skipReason),
        not:d.note || null,
      });
    }
    return out.reverse();
  }

  function hedef(){
    const o = C.obp();
    return {
      program:S.profile.program,
      hedefSira:S.profile.targetRank,
      katmanlar:R.TARGET_TIERS.map(t => ({ katman:t.name, sira:t.rank, tyt:t.tyt, ayt:t.ayt })),
      netMatrisi:R.TEST_BANDS.map(b => ({
        test:b.test, hedefBant:b.low+'–'+b.high,
        guncelMedyan:num(C.testMedian(b.testKey, b.exam)),
      })),
      obp:{ deger:o.value, katsayi:o.coef, puanKatkisi:o.contribution },
    };
  }

  function kartlar(input){
    const o = input || {};
    const due = C.dueCards();
    return {
      toplam:S.cards.length,
      dueBugun:due.length,
      gecikmis:C.overdueCards().length,
      borcYuzdesi:C.cardDebt(),
      ornekler:due.slice(0, o.limit || 8).map(c => ({ on:c.front, konu:c.topic, asama:c.stage, vade:c.dueAt })),
    };
  }

  /* Ders notlari — ham transcript gonderilmez, segment metni sinirli tutulur. */
  const NOTE_TEXT_MAX = 220;
  const NOTE_SEG_MAX = 40;

  function videoNotlari(input){
    const o = input || {};
    let list = S.videoNotes.slice();
    if(o.notId) list = list.filter(n => n.id === o.notId);
    if(o.ders) list = list.filter(n => n.subjectId === o.ders);
    list = list.slice(0, o.limit || 8);
    return {
      toplamDers:S.videoNotes.length,
      toplamNot:S.videoNotes.reduce((a, n) => a + n.segments.length, 0),
      dersler:list.map(n => ({
        id:n.id,
        baslik:n.title,
        konu:M.noteTopicName(n),
        bitti:!!n.done,
        transcriptVarMi:!!n.transcript,
        notlar:n.segments.slice(0, NOTE_SEG_MAX).map(s => ({
          saniye:s.ts, etiket:s.tag, metin:String(s.text).slice(0, NOTE_TEXT_MAX),
        })),
      })),
    };
  }

  function mesgaleler(){
    const sug = C.suggestBreak();
    return {
      bugunAlinanMola:M.breaksOf(U.todayISO()).length,
      gunlukUstSinir:R.BREAK_RULE.maxPerDay,
      onerilebilir:sug.ok,
      onerilenSure:sug.ok ? sug.minutes : null,
      gerekce:sug.ok ? sug.why : sug.reason,
      secenekler:(sug.picks || []).map(a => ({ ad:a.name, dakika:a.minutes, tur:a.kind, enerji:a.energy })),
    };
  }

  function enerjiDurumu(input){
    const o = input || {};
    const gun = o.gun || 7;
    const bugun = M.moodOf(U.todayISO());
    const seri = [];
    for(let i = 0; i < gun; i++){
      const iso = U.iso(U.addDays(U.today(), -i));
      const rec = S.mood[iso];
      if(rec) seri.push({ tarih:iso, enerji:rec.enerji || rec.energy });
    }
    return {
      bugunEnerji:bugun ? bugun.energy : null,
      ortalama:M.energyAverage(gun),
      seri,
      uykuOrtalamasi:C.sleepAverage(7),
      uykuHedefi:S.profile ? S.profile.sleepTarget : null,
      olcek:'1 bitkin … 5 yüksek',
    };
  }

  function gununAkisi(){
    const flow = C.dailyFlow();
    const reward = C.todayReward();
    return {
      adimlar:flow.steps.map(s => ({ anahtar:s.key, baslik:s.title, neden:s.why, tamam:s.done })),
      tamamlanan:flow.done, toplam:flow.total, yuzde:flow.pct,
      siradakiHamle:(function(){ const n = C.nextAction(); return n ? { baslik:n.title, neden:n.why } : null; })(),
      kazanilanDavranis:reward.earned.map(e => e.label),
      davranisSerisi:reward.streak,
      minimumGunTutuldu:C.minimumDayMet(),
    };
  }

  function konuRiski(input){
    const o = input || {};
    return {
      aciklama:'Risk 0–100: frekans, kapanış, açık yanlış, gecikmiş kart ve tazelikten hesaplanır.',
      liste:C.riskRanking(o.limit || 10).map(r => ({
        ders:r.subjectName, konu:r.topicName, risk:r.score, bant:r.label,
        durum:r.state, frekans:r.freq, acikYanlis:r.errors, gunGecti:r.staleDays,
      })),
    };
  }

  function puanTahmini(){
    const est = C.estimateScore();
    if(!est.ok) return { yeterliVeri:false, gerekce:est.why };
    const gap = C.netGapToTarget();
    return {
      yeterliVeri:true,
      denemeSayisi:est.samples,
      tytMedyan:est.tytMedian, aytMedyan:est.aytMedian,
      tahminiPuan:est.score, puanBandi:[est.scoreLow, est.scoreHigh],
      tahminiSiraBandi:[est.rankBest, est.rankWorst],
      hedefSira:est.targetRank,
      konum:est.meta.label,
      uyari:'Bu bir koçluk bandıdır; kesin sıra tahmini değildir.',
      hedefeNetFarki:gap ? gap.netDiff : null,
    };
  }

  /* ---------- sample() icin arac tanimlari ---------- */
  const TOOLS = [
    { name:'durum_ozeti', description:'Bugünkü genel durum: program haftası, KPI’lar, medyanlar, borçlar, aktif telafi ve bu ayın karar kapısı. Neredeyse her soru için önce bunu çağır.',
      inputSchema:{ type:'object', properties:{} }, execute:durum },

    { name:'denemeler', description:'Deneme kayıtları: tarih, tür, test bazlı doğru/yanlış/boş/net ve süreler.',
      inputSchema:{ type:'object', properties:{
        aile:{ type:'string', description:'TYT veya AYT' },
        yalnizTam:{ type:'boolean', description:'yalnız tam denemeler' },
        limit:{ type:'number' } } }, execute:denemeler },

    { name:'hatalar', description:'Yanlış defteri: K/İ/Y/S/D dağılımı ve kök neden metinleri. Kalıp aramak için kullan.',
      inputSchema:{ type:'object', properties:{
        etiket:{ type:'string', description:'K, İ, Y, S veya D' },
        yalnizAcik:{ type:'boolean' },
        limit:{ type:'number' } } }, execute:hatalar },

    { name:'konular', description:'Ders ve konu durumları: kapanış yüzdeleri, ölçümler, soru sıklığı.',
      inputSchema:{ type:'object', properties:{
        ders:{ type:'string', description:'ders id veya adı; boşsa tüm dersler' },
        tumKonular:{ type:'boolean', description:'başlanmamışları da getir' } } }, execute:konular },

    { name:'haftalar', description:'Son haftaların planı, tamamlama oranı, sapma nedenleri ve weekly review metinleri.',
      inputSchema:{ type:'object', properties:{ gerideHafta:{ type:'number' } } }, execute:haftalar },

    { name:'gunler', description:'Son günlerin çalışma kaydı: blok, dakika, soru, uyku, atlama nedeni, not.',
      inputSchema:{ type:'object', properties:{ gun:{ type:'number' } } }, execute:gunler },

    { name:'hedef_ve_net_matrisi', description:'Hedef katmanları, test bazlı hedef bantları ile güncel medyanların karşılaştırması ve OBP katkısı.',
      inputSchema:{ type:'object', properties:{} }, execute:hedef },

    { name:'kartlar', description:'Aralıklı tekrar durumu: due, gecikmiş, borç yüzdesi ve örnek kartlar.',
      inputSchema:{ type:'object', properties:{ limit:{ type:'number' } } }, execute:kartlar },

    { name:'video_notlari', description:'İzlenen derslerin zaman damgalı notları. Konu özeti veya kart üretmek için kullan. Ham transcript verilmez.',
      inputSchema:{ type:'object', properties:{
        notId:{ type:'string', description:'tek bir dersin id’si' },
        ders:{ type:'string', description:'ders id’si' },
        limit:{ type:'number' } } }, execute:videoNotlari },

    { name:'mesgaleler', description:'Mola ve meşgale durumu: bugün kaç mola alındı, şu an ne önerilebilir.',
      inputSchema:{ type:'object', properties:{} }, execute:mesgaleler },

    { name:'enerji_durumu', description:'Adayın günlük enerji girişi (1–5), ortalaması ve uyku ortalaması.',
      inputSchema:{ type:'object', properties:{ gun:{ type:'number' } } }, execute:enerjiDurumu },

    { name:'gunun_akisi', description:'Bugünün adımları (izle → not → soru → kart → mola), hangileri tamam, sıradaki hamle ve kazanılan davranışlar.',
      inputSchema:{ type:'object', properties:{} }, execute:gununAkisi },

    { name:'konu_riski', description:'Konu bazlı risk sıralaması: frekans, kapanış, açık yanlış, gecikmiş kart ve tazelikten hesaplanır. “Neye çalışayım” sorusunda kullan.',
      inputSchema:{ type:'object', properties:{ limit:{ type:'number' } } }, execute:konuRiski },

    { name:'puan_tahmini', description:'Kural motorunun ürettiği tahmini puan ve sıra BANDI. Bu bant dışına çıkma, kesin sıra söyleme.',
      inputSchema:{ type:'object', properties:{} }, execute:puanTahmini },
  ];

  /* ---------- gizlilik suzgeci ----------
     LLM'e giden her nesne bu suzgecten gecer. Kisisel alanlar ADILA cikarilir;
     yalnizca davranissal ve akademik metrikler kalir. Yeni bir alan eklenirse
     varsayilan olarak GECER — ama ad/sehir/okul gibi anahtarlar her derinlikte
     silinir ve metin icindeki profil degerleri maskelenir. */
  const BLOCKED_KEYS = ['name','ad','isim','city','sehir','şehir','school','okul',
    'email','eposta','e-posta','phone','telefon','address','adres','tcNo','tckn'];

  function scrub(value, secrets){
    if(value == null) return value;
    if(typeof value === 'string'){
      let out = value;
      secrets.forEach(sec => {
        if(sec && sec.length > 2) out = out.split(sec).join('—');
      });
      return out;
    }
    if(Array.isArray(value)) return value.map(v => scrub(v, secrets));
    if(typeof value === 'object'){
      const out = {};
      Object.keys(value).forEach(k => {
        if(BLOCKED_KEYS.indexOf(k) >= 0) return;         // anahtar bazli eleme
        out[k] = scrub(value[k], secrets);
      });
      return out;
    }
    return value;
  }

  /* Profildeki kisisel degerleri toplar; ciktida maskelenir. */
  function secretList(){
    const p = S.profile || {};
    return [p.name, p.city, p.school].filter(Boolean);
  }

  function sanitize(value){ return scrub(value, secretList()); }

  /* ---------- arac onbellegi ----------
     Ayni cagri ayni turda tekrarlanirsa veri yeniden hesaplanmaz. */
  let cache = new Map();
  function resetCache(){ cache = new Map(); }

  /* sample() icin: her aracin execute'u guvenli sarmalanir */
  function forSample(){
    resetCache();
    return TOOLS.map(t => ({
      name:t.name,
      description:t.description,
      inputSchema:t.inputSchema,
      execute(input){
        const key = t.name + ':' + JSON.stringify(input || {});
        if(cache.has(key)) return cache.get(key);
        let out;
        try{
          const raw = t.execute(input || {});
          out = raw === undefined ? { sonuc:'veri yok' } : sanitize(raw);
        }catch(e){
          out = { hata:'okunamadı: '+(e && e.message ? e.message : 'bilinmeyen') };
        }
        cache.set(key, out);
        return out;
      },
    }));
  }

  return { TOOLS, forSample, sanitize, resetCache, durum, denemeler, hatalar, konular, haftalar, gunler, hedef, kartlar,
    videoNotlari, mesgaleler, enerjiDurumu, gununAkisi, konuRiski, puanTahmini };
})();
