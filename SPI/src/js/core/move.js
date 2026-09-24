/* Modul 3'un kural motoru — toparlanma, yuk ve gunun emri.

   Tek dogma: gunun yukunu istek degil toparlanma belirler.

   Toparlanma skoru dort girdiden gelir ve eksik girdi SIFIR SAYILMAZ —
   agirligi kalan girdilere dagitilir. Akilli saati olmayan biri de uyku ve
   nabizla anlamli bir skor alir; cihaz sahibi olmayan cezalandirilmaz.

   HRV ve istirahat nabzi mutlak degil KISISEL olcektir: kendi 30 gunluk
   ortalamana gore okunur. Baskasinin HRV'siyle karsilastirma yapilmaz. */

window.SP = window.SP || {};

SP.Move = (function(){
  const U = SP.U;

  /* ------------------------------------------------------------- taban cizgi */

  /* Bir gunluk olcumun kisisel ortalamasi. Pencere `bitis` gununden
     (varsayilan bugun) GERIYE kurulur ve o gun haric tutulur ki gunun
     degeri kendi taban cizgisini kaydirmasin. Gecmis bir gunun puani o
     gunden SONRAKI olcumlerle hesaplanmaz (ekip/HATALAR.md O-4). */
  function baseline(key, days, bitis){
    const n = days || 30;
    const son = bitis ? U.parse(bitis) : U.today();
    const vals = [];
    for(let i = 1; i <= n; i++){
      const d = U.iso(U.addDays(son, -i));
      const rec = SP.S.vitals[d];
      if(rec && rec[key] != null) vals.push(Number(rec[key]));
    }
    if(vals.length < 3) return null;
    return { mean:U.round(U.sum(vals) / vals.length, 1), n:vals.length,
      median:U.median(vals) };
  }

  /* --------------------------------------------------------- toparlanma */

  /* Her girdi 0-100 arasi bir alt skora cevrilir. */
  function sleepScore(hours){
    if(hours == null) return null;
    const t = SP.BIO_BY_ID.sleep.optimal;   /* [7, 8.5] */
    if(hours >= t[0] && hours <= t[1]) return 100;
    if(hours > t[1]) return U.clamp(100 - (hours - t[1]) * 12, 55, 100);
    /* Yetersiz uykuda ceza dogrusal: 7 saatten her eksik saat 22 puan. */
    return U.clamp(100 - (t[0] - hours) * 22, 0, 100);
  }

  function hrvScore(value, gun){
    const b = baseline('hrv', 30, gun);
    if(value == null || !b) return null;
    /* Kendi ortalamana gore yuzde sapma. -%20 ve altinda skor dibe iner. */
    const pct = 100 * (value - b.mean) / b.mean;
    return U.clamp(70 + pct * 2.2, 0, 100);
  }

  function rhrScore(value, gun){
    const b = baseline('rhr', 30, gun);
    if(value == null || !b) return null;
    /* Nabizda YUKSELIS kotudur: ortalamanin 8 atim ustu skoru dibe cekar. */
    const delta = value - b.mean;
    return U.clamp(80 - delta * 7, 0, 100);
  }

  /* Toparlanma olcumunun «ince» sayildigi esik: agirligin yarisi.
     Bkz. `readiness().thin`. */
  const INCE_ESIK = 0.5;

  function sorenessScore(value){
    /* Kullanicinin 1-5 arasi bildirdigi his: 1 = cok yorgun, 5 = zinde. */
    if(value == null) return null;
    return U.clamp((Number(value) - 1) * 25, 0, 100);
  }

  function readiness(dateISO, profile){
    const d = dateISO || U.todayISO();
    const v = SP.S.vitals[d] || {};

    const parts = [
      { id:'sleep',    score:sleepScore(v.sleep),        value:v.sleep },
      { id:'hrv',      score:hrvScore(v.hrv, d),         value:v.hrv },
      { id:'rhr',      score:rhrScore(v.rhr, d),         value:v.rhr },
      { id:'soreness', score:sorenessScore(v.soreness),  value:v.soreness },
    ].map(p => {
      const def = SP.READINESS_INPUTS.find(x => x.id === p.id);
      return Object.assign({}, p, { label:def.label, weight:def.weight, note:def.note });
    });

    const have = parts.filter(p => p.score != null);
    if(!have.length){
      /* Cumle once «en az uyku suresi gerekir» diyordu ve bu YANLISTI:
         dort girdinin HERHANGI BIRI yeterli. Olmayan bir sarti soyleyen
         bir uyari, kullaniciyi olmayan bir seyi aramaya gonderir. */
      return { ok:false, score:null, band:null, parts, coverage:0, thin:true,
        note:'Bugün hiç ölçüm girilmemiş. Toparlanma skoru için dört '
           + 'girdiden en az biri gerekir: uyku, HRV, istirahat nabzı ya '
           + 'da ağrı/enerji.' };
    }

    /* Eksik girdinin agirligi kalanlara dagitilir. */
    const wsum = U.sum(have.map(p => p.weight));
    const score = Math.round(U.sum(have.map(p => p.score * p.weight)) / wsum);
    const band = SP.READINESS_BANDS.find(b => score >= b.min) || SP.READINESS_BANDS[SP.READINESS_BANDS.length - 1];

    /* Ates ve hastalik her seyi yener: 38,5 uzerinde yuk sifirlanir. */
    let override = null;
    if(v.temp != null && v.temp >= 38.5){
      override = { band:SP.READINESS_BANDS[SP.READINESS_BANDS.length - 1],
        why:'Ateş ' + U.fmtNum(v.temp) + ' °C. Ateşliyken antrenman yapılmaz.' };
    }
    if(v.spo2 != null && v.spo2 < 92){
      override = { band:SP.READINESS_BANDS[SP.READINESS_BANDS.length - 1],
        why:'Oksijen satürasyonu %' + U.fmtNum(v.spo2) + '. Bugün yük yok.' };
    }

    return {
      ok:true, score, band:override ? override.band : band, override,
      parts, missing:parts.filter(p => p.score == null).map(p => p.label),
      coverage:U.round(wsum, 2),
      /* INCE OLCUM: agirligin yarisindan azi olculmus.

         `coverage` hesaplaniyordu ama HICBIR CAGIRAN OKUMUYORDU. Yalniz
         `soreness=5` girilmis bir gunde skor 100, bant «yuksek» ve
         `factor` 1,1 oluyordu: agirligin %15'inden turetilmis bir sayi
         gunun yukunu ARTIRMA emri veriyordu.

         Esik yaridir ve olculmus bir sayi degil bir karardir: uyku tek
         basina 0,35 tasir ve dosyanin kendi notu onu «toparlanmanin tek
         en guclu belirleyicisi» diye yaziyor — ama tek basina da olsa
         yarinin altinda kalir. Ince bir olcum YOK SAYILMAZ; yalnizca
         yuku artirmaya yetki vermez. */
      thin:wsum < INCE_ESIK,
    };
  }

  /* --------------------------------------------------------------- yuk

     Seans yuku = sure x zorluk. Zorluk once kullanicinin bildirdigi
     RPE'den (1-10 algilanan zorluk), yoksa hareketlerin MET ortalamasindan
     gelir. Ikisi de yoksa seans sayilmaz — uydurulmus yuk uretilmez. */

  /* BILINMEYEN YUK SIFIR DEGILDIR — ve sifir saymak GUVENLI YON DEGIL.

     Burasi once 0 donduruyordu ve yorumu «seans sayilmaz» diyordu; oysa
     0 SAYILIR. «45 dk yuzme» gibi katalogda olmayan bir hareketle
     yapilan seans akut yuku dusuk gosteriyor, ACWR «yuk az,
     artirabilirsin» diyordu. Bilinmeyen yuk gercegi yalnizca YUKARI
     ceker; o yuzden sifir saymak, hatanin tehlikeli yonuydu. */
  function sessionLoad(w){
    if(!w || !w.minutes) return 0;
    if(w.rpe != null && isFinite(w.rpe)) return Math.round(w.minutes * Number(w.rpe));
    const mets = (w.items || []).map(it => {
      const ex = SP.EX_BY_ID[it.exId];
      return ex ? ex.met : null;
    }).filter(v => v != null);
    if(!mets.length) return null;               // BILINMIYOR
    const avg = U.sum(mets) / mets.length;
    return Math.round(w.minutes * avg);
  }

  /* Gunun bilinen yuku VE kac seansin yukunun bilinmedigi. */
  function loadInfo(dateISO){
    let load = 0, unknown = 0;
    SP.Model.workoutsOf(dateISO).forEach(w => {
      const y = sessionLoad(w);
      if(y == null) unknown++; else load += y;
    });
    return { load, unknown };
  }

  function loadOn(dateISO){
    return loadInfo(dateISO).load;
  }

  function loadWindow(days, endISO){
    const end = endISO || U.todayISO();
    let total = 0;
    for(let i = 0; i < days; i++){
      total += loadOn(U.iso(U.addDays(U.parse(end), -i)));
    }
    return total;
  }

  /* Penceredeki yuku bilinmeyen seans sayisi. */
  function unknownWindow(days, endISO){
    const end = endISO || U.todayISO();
    let n = 0;
    for(let i = 0; i < days; i++){
      n += loadInfo(U.iso(U.addDays(U.parse(end), -i))).unknown;
    }
    return n;
  }

  /* Akut/kronik yuk orani. 28 gunluk gecmis yoksa oran hesaplanmaz;
     kisa gecmisten uretilen ACWR yanilticidir. */
  function acwr(endISO){
    const first = SP.S.workouts.length ? SP.S.workouts[0].date : null;
    if(!first) return { ok:false, note:'Henüz antrenman kaydı yok.' };
    const span = U.diffDays(first, endISO || U.todayISO());
    if(span < 21){
      return { ok:false, span,
        note:'Son haftayı son aya kıyaslamak için en az 3 haftalık geçmiş gerekir; şu an ' + (span + 1) + ' gün var.' };
    }
    /* KRONIK PENCERE VAR OLAN GECMIS KADARDIR.

       Kapi 21 gunde aciliyor ama kronik yuk HER ZAMAN 28'e
       bolunuyordu. 22 gunluk gecmiste sabit yukle calisan biri icin son
       alti gun sifir sayiliyor, kronik ortalama yapay olarak dusuyor ve
       oran ~28/22 = 1,27 cikiyordu: kirmizi uyari ve yuk kisitlama —
       hicbir sey degismedigi halde. Olmayan gunleri sifir saymak, eksik
       veriyi sifir saymanin ta kendisiydi. */
    const kronikGun = Math.min(28, span + 1);
    const acute = loadWindow(7, endISO) / 7;
    const chronic = loadWindow(kronikGun, endISO) / kronikGun;
    if(!chronic) return { ok:false, note:'Son dört haftada yeterli yük kaydı yok.' };

    const unknown = unknownWindow(kronikGun, endISO);
    const ratio = U.round(acute / chronic, 2);
    const r = SP.LOAD_RULES.acwr;
    let zone = ratio < r.low ? 'low' : ratio > r.high ? 'high' : 'ok';

    /* BILINMEYEN YUK «AZ YUK» HUKMUNU DUSURUR.

       Yuku bilinmeyen bir seans gercegi yalnizca YUKARI ceker; «yuk az,
       artirabilirsin» o yuzden guvenli yonde degildir. Yuksek bolge
       hukmu ise ayakta kalir: o zaten temkinli yondedir. */
    let ek = '';
    if(unknown && zone === 'low'){
      zone = 'ok';
      ek = ' Bu pencerede ' + unknown + ' seansın yükü bilinmiyor '
         + '(zorluk girilmemiş, hareket katalogda yok); gerçek yük bundan '
         + 'yüksek olabilir, bu yüzden «yük az» denmiyor.';
    }else if(unknown){
      ek = ' Bu pencerede ' + unknown + ' seansın yükü bilinmiyor; '
         + 'gerçek oran bundan yüksek olabilir.';
    }

    return {
      ok:true, ratio, acute:Math.round(acute), chronic:Math.round(chronic), zone,
      chronicDays:kronikGun, unknown,
      tone:zone === 'ok' ? 'ok' : zone === 'high' ? 'danger' : 'warn',
      note:(zone === 'ok' ? r.okNote : zone === 'high' ? r.highNote : r.lowNote) + ek,
    };
  }

  /* Bes haftada bir yuk indirme haftasi. Sayac ilk antrenmandan baslar. */
  function deloadWeek(dateISO){
    /* Hic seans yoksa dongu HENUZ BASLAMAMISTIR. Eksik alanla donmek
       cagiran ekranlarda "undefined/undefined" gibi ciktilar uretiyordu;
       eksik veri sifir sayilmaz ama sekli de bozmaz. */
    if(!SP.S.workouts.length){
      return { due:false, started:false, week:0, inCycle:0,
        every:SP.LOAD_RULES.deload.everyWeeks,
        factor:SP.LOAD_RULES.deload.factor,
        note:'Henüz seans kaydı yok; indirme döngüsü başlamadı.' };
    }
    const first = SP.S.workouts[0].date;
    const weeks = Math.floor(U.diffDays(first, dateISO || U.todayISO()) / 7);
    const every = SP.LOAD_RULES.deload.everyWeeks;
    const inCycle = weeks % every;
    return {
      due:inCycle === every - 1,
      started:true,
      week:weeks + 1, inCycle:inCycle + 1, every,
      factor:SP.LOAD_RULES.deload.factor,
      note:SP.LOAD_RULES.deload.note,
    };
  }

  /* Haftalik buyume siniri: toplam yuk gecen haftadan %10'dan fazla artmaz. */
  function weeklyGrowth(endISO){
    const thisWeek = loadWindow(7, endISO);
    const prevEnd = U.iso(U.addDays(U.parse(endISO || U.todayISO()), -7));
    const lastWeek = loadWindow(7, prevEnd);
    if(!lastWeek) return { ok:false, thisWeek, lastWeek };
    const growth = U.round((thisWeek - lastWeek) / lastWeek, 2);
    return {
      ok:true, thisWeek, lastWeek, growth,
      over:growth > SP.LOAD_RULES.weeklyGrowth.max,
      max:SP.LOAD_RULES.weeklyGrowth.max,
      note:SP.LOAD_RULES.weeklyGrowth.note,
    };
  }

  /* ------------------------------------------------------------ gunun emri

     Toparlanma bandi taban emri verir; ACWR ve indirme haftasi bunu
     yalnizca DAHA TEMKINLI yapabilir, asla daha agir yapamaz. */
  function prescription(dateISO){
    const d = dateISO || U.todayISO();
    const r = readiness(d);
    const a = acwr(d);
    const dl = deloadWeek(d);
    const done = SP.Model.workoutsOf(d);

    let factor = r.ok ? r.band.factor : 1;
    const reasons = [];

    /* Her gerekce kimliklidir: ekran skoru zaten buyuk yaziyorsa ayni cumleyi
       ikinci kez basmasin diye 'readiness' gerekcesini eleyebilir. */
    if(r.ok){
      /* INCE OLCUM YUKU ARTIRAMAZ. Dosyanin kendi kurali «ACWR ve
         indirme haftasi emri yalnizca DAHA TEMKINLI yapabilir, asla
         daha agir» diyor; agirligin yarisindan azindan turetilmis bir
         skor icin de ayni sey gecerli. Skor YOK SAYILMAZ — yalnizca
         artirma yetkisi vermez. */
      if(r.thin && factor > 1){
        factor = 1;
        reasons.push({ id:'thin', kind:'muted',
          text:'Toparlanma skoru bugün yalnızca ' + r.parts.filter(p => p.score != null)
               .map(p => p.label).join(', ') + ' ölçümünden türedi; yükü '
             + 'artırmak için yeterli değil. Planlanan yük olduğu gibi kaldı.',
          short:'Ölçüm ince; yük artırılmadı.' });
      }
      reasons.push({ id:'readiness', kind:r.band.tone,
        text:'Toparlanma ' + r.score + '/100 — ' + r.band.label + '. ' + r.band.order,
        short:r.band.order });
    }else{
      reasons.push({ id:'no-data', kind:'muted',
        text:r.note + ' Yük planlandığı gibi kabul edildi.',
        short:r.note });
    }
    if(r.override){
      reasons.push({ id:'override', kind:'danger', text:r.override.why, short:r.override.why });
    }
    if(a.ok && a.zone === 'high'){
      factor = Math.min(factor, 0.7);
      const t = 'Akut/kronik yük oranı ' + U.fmtNet(a.ratio) + '. ' + a.note;
      reasons.push({ id:'acwr', kind:'danger', text:t, short:t });
    }
    if(dl.due){
      factor = Math.min(factor, dl.factor);
      const t = dl.week + '. hafta — yük indirme haftası. ' + dl.note;
      reasons.push({ id:'deload', kind:'warn', text:t, short:t });
    }

    /* Kötü gün modu (core/kotugun.js): yalnız hafifletir, dinlenmeyi
       dinlenme bırakır. */
    if(SP.KotuGun && SP.KotuGun.aktif(d)){
      factor = Math.min(factor, SP.KotuGun.CARPAN);
      const t = 'Kötü gün modu: yük hafifletildi. Bugün asgari gün yeter.';
      reasons.push({ id:'kotu-gun', kind:'warn', text:t, short:t });
    }

    const kind = factor === 0 ? 'rest' : factor <= 0.6 ? 'light' : factor < 1 ? 'reduced' : 'full';
    const templates = kind === 'rest' ? ['mobilite']
      : kind === 'light' ? ['mobilite', 'yuruyus-gunu']
      : kind === 'reduced' ? ['yuruyus-gunu', 'tam-vucut-a']
      : ['tam-vucut-a', 'tam-vucut-b', 'dayaniklilik'];

    return {
      date:d, factor:U.round(factor, 2), kind, reasons,
      readiness:r, acwr:a, deload:dl,
      done:done.length, doneLoad:U.sum(done.map(sessionLoad)),
      suggest:templates.map(id => SP.SESSION_TEMPLATES.find(t => t.id === id)).filter(Boolean),
      minimum:SP.LOAD_RULES.minDay,
    };
  }

  /* ------------------------------------------------------ ilerleme merdiveni

     Bir ust basamak, mevcut basamakta yeterli tekrar yapildiginda acilir.
     Sistem basamak atlatmaz. "Yeterli" olcusu son 14 gunde o basamakta
     en az uc seans gormektir; bu, tek iyi gunun ilerleme sanilmasini onler. */
  const ADVANCE_SESSIONS = 3;
  const ADVANCE_WINDOW = 14;

  function progressionCheck(exId){
    const ex = SP.EX_BY_ID[exId];
    if(!ex) return { ok:false };
    const levelId = SP.Model.currentLevel(exId);
    const i = SP.Model.levelIndex(exId);
    const level = ex.levels[i];
    const next = ex.levels[i + 1] || null;

    const cutoff = U.iso(U.addDays(U.today(), -ADVANCE_WINDOW));
    const hits = SP.S.workouts.filter(w => w.date >= cutoff)
      .reduce((n, w) => n + (w.items || []).filter(it => it.exId === exId && it.levelId === levelId).length, 0);

    return {
      ok:true, exercise:ex, level, next, levelId,
      sessions:hits, needed:ADVANCE_SESSIONS, window:ADVANCE_WINDOW,
      ready:!!next && hits >= ADVANCE_SESSIONS,
      note:!next ? 'Bu merdivenin son basamağındasın.'
        : hits >= ADVANCE_SESSIONS
          ? level.name + ' basamağında son ' + ADVANCE_WINDOW + ' günde ' + hits + ' seans var — üst basamak açık.'
          : 'Üst basamak için ' + ADVANCE_WINDOW + ' gün içinde ' + ADVANCE_SESSIONS + ' seans gerekir; ' + hits + ' var.',
    };
  }

  /* Haftalik hareket kalibi dengesi — her kalip haftada en az bir kez. */
  function patternBalance(endISO){
    const end = endISO || U.todayISO();
    const cutoff = U.iso(U.addDays(U.parse(end), -6));
    const seen = {};
    SP.S.workouts.filter(w => w.date >= cutoff && w.date <= end).forEach(w => {
      (w.items || []).forEach(it => {
        const ex = SP.EX_BY_ID[it.exId];
        if(ex && ex.pattern) seen[ex.pattern] = (seen[ex.pattern] || 0) + 1;
      });
    });
    return SP.PATTERNS.map(p => ({ pattern:p, count:seen[p.id] || 0, missing:!seen[p.id] }));
  }

  /* Son 30 gunun gunluk yuku — grafik icin. */
  function loadSeries(days){
    const n = days || 30;
    const out = [];
    for(let i = n - 1; i >= 0; i--){
      const d = U.iso(U.addDays(U.today(), -i));
      out.push({ date:d, value:loadOn(d) });
    }
    return out;
  }

  return {
    baseline, sleepScore, hrvScore, rhrScore, sorenessScore, readiness,
    sessionLoad, loadInfo, loadOn, loadWindow, unknownWindow,
    acwr, deloadWeek, weeklyGrowth, prescription,
    progressionCheck, patternBalance, loadSeries,
    ADVANCE_SESSIONS, ADVANCE_WINDOW,
  };
})();
