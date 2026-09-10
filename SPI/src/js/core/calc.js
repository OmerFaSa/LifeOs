/* Orkestratorun kural motoru — capraz cikarim ve siradaki hamle.

   Dort uzman kendi alanini hesaplar; bu dosya onlari BIR ARAYA getirir.
   Patron ajan buradan beslenir ve buradaki karari degistiremez, yalnizca
   gerekcelendirir.

   Iki temel cikti vardir:

     nextAction()     Tek bir oncelik. Sira SP.PRECEDENCE ile aynidir ve
                      tartisilmaz: kirmizi bayrak → guvenlik → olcum borcu →
                      besin acigi → antrenman → butce.

     crossFindings()  Alanlar arasi baglar. PDF'teki ornek burada yasar:
                      "Butceyi %10 astik fakat protein tutarliligi ve
                      toparlanma skoru son iki ayin zirvesinde."

   Korelasyon nedensellik degildir ve oyle sunulmaz: bulgu daima "birlikte
   hareket ediyor" diliyle yazilir, "sebep oldu" diliyle degil. */

window.SP = window.SP || {};

SP.Calc = (function(){
  const U = SP.U;

  /* --------------------------------------------------------------- gunluk */

  /* Asgari gun standardi — kotu gunun alt siniri.
     Dordunu tutturan gun kayipsiz sayilir. */
  function minimumDay(dateISO){
    const d = dateISO || U.todayISO();
    const v = SP.S.vitals[d] || {};
    const totals = SP.Nutri.dayTotals(d);
    const p = SP.S.profile;
    const proteinFloor = p && p.weightKg ? Math.round(1.2 * p.weightKg) : null;
    const moveMin = U.sum(SP.Model.workoutsOf(d).map(w => w.minutes || 0));

    const rows = [
      { id:'protein', label:SP.MINIMUM_DAY.protein,
        ok:proteinFloor != null && totals.protein >= proteinFloor,
        known:proteinFloor != null && !totals.empty,
        detail:proteinFloor == null ? 'Profilde kilo yok'
          : Math.round(totals.protein) + ' / ' + proteinFloor + ' g' },
      { id:'water', label:SP.MINIMUM_DAY.water,
        ok:(v.water || 0) >= 2000, known:v.water != null,
        detail:U.fmtNum(v.water || 0) + ' / 2.000 ml' },
      { id:'move', label:SP.MINIMUM_DAY.move,
        ok:moveMin >= SP.LOAD_RULES.minDay.minutes, known:true,
        detail:moveMin + ' / ' + SP.LOAD_RULES.minDay.minutes + ' dk' },
      { id:'sleep', label:SP.MINIMUM_DAY.sleep,
        ok:v.sleep != null && v.sleep >= 7, known:v.sleep != null,
        detail:v.sleep != null ? U.fmtNet(v.sleep) + ' / 7 sa' : 'girilmedi' },
    ];
    const done = rows.filter(r => r.ok).length;
    return { rows, done, total:rows.length, complete:done === rows.length, note:SP.MINIMUM_DAY.note };
  }

  /* Davranis serisi — asgari gunu ust uste kac gun tutturdun.
     Odul olcume degil DAVRANISA baglidir: tek gunun iyi tahlili degil,
     surdurulen duzen odullendirilir. */
  function streak(){
    let n = 0;
    for(let i = 0; i < 365; i++){
      const d = U.iso(U.addDays(U.today(), -i));
      /* Bugun henuz bitmedi: tamamlanmamis olmasi seriyi kirmaz. */
      if(i === 0 && !minimumDay(d).complete) continue;
      if(minimumDay(d).complete) n++;
      else break;
    }
    return n;
  }

  /* Gunun butun modullerden ozeti. */
  function dayStatus(dateISO){
    const d = dateISO || U.todayISO();
    return {
      date:d,
      vitals:SP.S.vitals[d] || null,
      nutrition:SP.Nutri.dayTotals(d),
      targets:SP.Nutri.targets(),
      prescription:SP.Move.prescription(d),
      minimum:minimumDay(d),
      flags:SP.Model.openFlags(),
      money:SP.Money.status(),
    };
  }

  /* ---------------------------------------------------------- siradaki hamle

     Sira SP.PRECEDENCE'tir. Ilk eslesen doner; digerleri beklemeye gecer.
     Her hamle nereye gidecegini (route) ve NEDEN geldigini (why) tasir —
     gerekcesiz bir emir sistemin isi degildir. */
  function nextAction(){
    const d = U.todayISO();

    /* 1 — kirmizi bayrak */
    const flags = SP.Model.openFlags().filter(f => !f.ack);
    if(flags.length){
      return { id:'flag', rank:1, tone:'danger', icon:'warn',
        label:'Kırmızı bayrak', title:flags[0].label,
        why:flags[0].detail, route:'labs',
        action:'Hekime başvur ve bayrağı gördüğünü işaretle.' };
    }

    /* 2 — guvenlik: asiri yuklenme ve ates */
    const rx = SP.Move.prescription(d);
    if(rx.readiness.ok && rx.readiness.override){
      return { id:'override', rank:2, tone:'danger', icon:'heart',
        label:'Güvenlik', title:'Bugün antrenman yok',
        why:rx.readiness.override.why, route:'move',
        action:'Yükü sıfırla, dinlen.' };
    }
    if(rx.acwr.ok && rx.acwr.zone === 'high'){
      return { id:'overreach', rank:2, tone:'warn', icon:'dumbbell',
        label:'Güvenlik', title:'Yük alıştığının üstünde',
        why:rx.acwr.note + ' Oran ' + U.fmtNet(rx.acwr.ratio) + '.', route:'move',
        action:'Bu hafta yükü indir.' };
    }

    /* 3 — olcum borcu */
    const v = SP.S.vitals[d];
    if(!v || v.sleep == null){
      return { id:'vitals', rank:3, tone:'info', icon:'pulse',
        label:'Ölçüm', title:'Bugünün ölçümü girilmedi',
        why:'Toparlanma skoru en az uyku süresiyle hesaplanır; onsuz günün yükü körlemesine verilir.',
        route:'vitals', action:'Uyku ve nabzı gir.' };
    }
    const due = SP.Bio.overdue();
    if(due.length){
      return { id:'panel', rank:3, tone:'info', icon:'flask',
        label:'Ölçüm', title:(/paneli$/i.test(due[0].panel.name)
          ? due[0].panel.name : due[0].panel.name + ' paneli') + ' bekliyor',
        why:due[0].note + ' Eğilim okumak için düzenli aralık gerekir.',
        route:'labs', action:'Tahlil sonucunu gir.' };
    }

    /* 4 — besin acigi */
    const g = SP.Nutri.gaps(7);
    if(g.ok && g.rows.length){
      const worst = g.rows[0];
      return { id:'gap', rank:4, tone:'warn', icon:'leaf',
        label:'Beslenme', title:worst.nutrient.name + ' hedefin %' + worst.pct + '\'inde',
        why:(worst.why ? worst.why + ' ' : '') + 'Son 7 günün ortalaması hedefin altında.',
        route:'meals', action:'Kaynakları gör ve öğüne ekle.' };
    }
    if(!SP.Model.mealsOf(d).length){
      return { id:'meal', rank:4, tone:'info', icon:'meal',
        label:'Beslenme', title:'Bugün hiç öğün girilmedi',
        why:'Girilmemiş gün ortalamaya katılmaz; kayıt olmadan açık da görülmez.',
        route:'meals', action:'Öğünü sesli ya da yazarak ekle.' };
    }

    /* 5 — antrenman */
    if(rx.kind !== 'rest' && !rx.done){
      const t = rx.suggest[0];
      return { id:'workout', rank:5, tone:'ok', icon:'dumbbell',
        label:'Hareket', title:t ? t.name : 'Bugünün antrenmanı',
        why:rx.reasons.length ? rx.reasons[0].text : 'Toparlanma uygun.',
        route:'move', action:'Seansı başlat.' };
    }

    /* 6 — butce */
    const m = SP.Money.status();
    if(m.tone === 'warn'){
      return { id:'budget', rank:6, tone:'warn', icon:'wallet',
        label:'Bütçe', title:'Sepet gözden geçirilmeli',
        why:m.text, route:'basket', action:'İkame önerilerine bak.' };
    }

    return { id:'calm', rank:99, tone:'ok', icon:'check', calm:true,
      label:'Bugün', title:'Sıradaki hamle yok',
      why:'Bayrak yok, ölçüm güncel, açık yok ve günün yükü tamam.',
      route:'today', action:'' };
  }

  /* ------------------------------------------------------------- korelasyon

     Pearson katsayisi. Iki seri ayni gunlerde olculmus olmali; eslesmeyen
     gunler atilir. En az 10 ortak gun sarti vardir — daha azindan cikan
     katsayi rastlantiyi olcer. */
  const MIN_PAIRS = 10;

  function correlate(pairs){
    const xs = pairs.map(p => p[0]), ys = pairs.map(p => p[1]);
    const n = xs.length;
    if(n < MIN_PAIRS) return { ok:false, n };
    const mx = U.sum(xs) / n, my = U.sum(ys) / n;
    let num = 0, dx = 0, dy = 0;
    for(let i = 0; i < n; i++){
      const a = xs[i] - mx, b = ys[i] - my;
      num += a * b; dx += a * a; dy += b * b;
    }
    if(!dx || !dy) return { ok:false, n, note:'Serilerden biri hiç değişmiyor.' };
    const r = num / Math.sqrt(dx * dy);
    return { ok:true, n, r:U.round(r, 2), strength:Math.abs(r) };
  }

  /* Gunluk seri ureticiler — korelasyon icin ortak arayuz. */
  const SERIES = {
    sleep:d => { const v = SP.S.vitals[d]; return v ? v.sleep : null; },
    hrv:d => { const v = SP.S.vitals[d]; return v ? v.hrv : null; },
    rhr:d => { const v = SP.S.vitals[d]; return v ? v.rhr : null; },
    weight:d => { const v = SP.S.vitals[d]; return v ? v.weight : null; },
    sbp:d => { const v = SP.S.vitals[d]; return v ? v.sbp : null; },
    readiness:d => { const r = SP.Move.readiness(d); return r.ok ? r.score : null; },
    load:d => { const n = SP.Model.workoutsOf(d).length; return n ? SP.Move.loadOn(d) : null; },
    protein:d => { const t = SP.Nutri.dayTotals(d); return t.empty ? null : t.protein; },
    kcal:d => { const t = SP.Nutri.dayTotals(d); return t.empty ? null : t.kcal; },
    fiber:d => { const t = SP.Nutri.dayTotals(d); return t.empty ? null : t.fiber; },
    sodium:d => { const t = SP.Nutri.dayTotals(d); return t.empty ? null : t.micro.sodium; },
  };

  function pairsFor(aKey, bKey, days){
    const n = days || 60;
    const out = [];
    for(let i = 0; i < n; i++){
      const d = U.iso(U.addDays(U.today(), -i));
      const a = SERIES[aKey] ? SERIES[aKey](d) : null;
      const b = SERIES[bKey] ? SERIES[bKey](d) : null;
      if(a != null && b != null) out.push([Number(a), Number(b)]);
    }
    return out;
  }

  /* Aranan baglar. Her biri hangi iki seriyi karsilastirdigini, beklenen
     yonu ve bulgunun nasil yazilacagini tasir. */
  const LINKS = [
    { id:'sleep-hrv', a:'sleep', b:'hrv', expect:'+',
      title:'Uyku ve toparlanma',
      pos:'Uzun uyuduğun günlerde HRV yükseliyor.',
      neg:'Uyku süresiyle HRV ters hareket ediyor; ölçüm saatini kontrol et.' },
    { id:'load-readiness', a:'load', b:'readiness', expect:'-',
      title:'Yük ve ertesi gün toparlanması',
      pos:'Ağır yüklenilen günlerde toparlanma skoru da yüksek — yük taşınıyor.',
      neg:'Ağır günlerde toparlanma belirgin düşüyor; yük bandın üstünde.' },
    { id:'protein-readiness', a:'protein', b:'readiness', expect:'+',
      title:'Protein ve toparlanma',
      pos:'Protein aldığın günlerde toparlanma daha iyi.',
      neg:'Protein ile toparlanma arasında ters bir hareket var.' },
    { id:'sodium-bp', a:'sodium', b:'sbp', expect:'+',
      title:'Sodyum ve tansiyon',
      pos:'Tuz alımının yüksek olduğu günlerde sistolik tansiyon da yükseliyor.',
      neg:'Sodyum ile tansiyon arasında beklenen yönde bir hareket görünmüyor.' },
    { id:'kcal-weight', a:'kcal', b:'weight', expect:'+',
      title:'Kalori ve kilo',
      pos:'Kalori alımı ile kilo aynı yönde hareket ediyor.',
      neg:'Kalori ile kilo ters hareket ediyor; tartım koşulları değişiyor olabilir.' },
    { id:'sleep-kcal', a:'sleep', b:'kcal', expect:'-',
      title:'Uyku ve iştah',
      pos:'Az uyuduğun günlerde kalori alımı artıyor.',
      neg:'Uyku ile kalori arasında belirgin bir bağ yok.' },
  ];

  function crossFindings(days){
    return LINKS.map(link => {
      const pairs = pairsFor(link.a, link.b, days || 60);
      const c = correlate(pairs);
      if(!c.ok){
        return { link, ok:false, n:c.n,
          note:'Ortak gün sayısı yetersiz (' + c.n + '/' + MIN_PAIRS + '). '
             + 'İki ölçüm de aynı günlerde girilmeli.' };
      }
      /* Zayif katsayi bulgu sayilmaz. */
      if(c.strength < 0.3){
        return { link, ok:true, weak:true, r:c.r, n:c.n,
          tone:'muted', text:'Belirgin bir birliktelik yok (r=' + U.fmtNet(c.r) + ', ' + c.n + ' gün).' };
      }
      const matches = link.expect === '+' ? c.r > 0 : c.r < 0;
      return {
        link, ok:true, weak:false, r:c.r, n:c.n,
        tone:matches ? 'ok' : 'warn',
        text:(matches ? link.pos : link.neg)
          + ' (r=' + U.fmtNet(c.r) + ', ' + c.n + ' gün — birliktelik, nedensellik değil.)',
      };
    });
  }

  /* --------------------------------------------------------- haftalik rapor

     PDF'teki konsolide raporun kural motoru tarafi. Patron bunu cumleye
     cevirir; sayilar buradan cikar. */
  function weeklyReport(endISO){
    const end = endISO || U.todayISO();
    const start = U.iso(U.addDays(U.parse(end), -6));

    const days = [];
    for(let i = 6; i >= 0; i--) days.push(U.iso(U.addDays(U.parse(end), -i)));

    const readiness = days.map(d => SP.Move.readiness(d)).filter(r => r.ok).map(r => r.score);
    const nutri = SP.Nutri.windowAverage(7);
    const t = SP.Nutri.targets();
    const money = SP.Money.basketTotal();
    const load = SP.Move.loadWindow(7, end);
    const growth = SP.Move.weeklyGrowth(end);
    const minDays = days.filter(d => minimumDay(d).complete).length;

    return {
      start, end, days,
      readiness:{ avg:readiness.length ? Math.round(U.sum(readiness) / readiness.length) : null,
        n:readiness.length, min:readiness.length ? Math.min.apply(null, readiness) : null },
      nutrition:{ avg:nutri, targets:t, loggedDays:nutri.days,
        proteinPct:t.ok && !nutri.empty ? U.pct(nutri.protein, t.protein.min) : null,
        fiberPct:t.ok && !nutri.empty ? U.pct(nutri.fiber, t.fiber) : null },
      movement:{ load, growth, sessions:SP.S.workouts.filter(w => w.date >= start && w.date <= end).length,
        balance:SP.Move.patternBalance(end) },
      money,
      discipline:{ minDays, of:7, streak:streak() },
      flags:SP.Model.openFlags(),
      gaps:SP.Nutri.gaps(7).rows.slice(0, 3),
      attention:SP.Bio.attention().slice(0, 3),
    };
  }

  /* Raporun tek cumlelik basligi — celiskiyi de tasir.
     PDF'teki ornek cumle bicimi burada uretilir. */
  function headline(report){
    const r = report || weeklyReport();
    const wins = [], losses = [];

    if(r.readiness.avg != null){
      (r.readiness.avg >= 70 ? wins : losses).push('toparlanma ortalaması ' + r.readiness.avg);
    }
    if(r.nutrition.proteinPct != null){
      (r.nutrition.proteinPct >= 95 ? wins : losses).push('protein hedefin %' + r.nutrition.proteinPct + '\'i');
    }
    if(r.money.limit != null){
      (r.money.over ? losses : wins).push(r.money.over
        ? 'bütçe %' + Math.max(0, r.money.pct - 100) + ' aşıldı'
        : 'bütçe sınırın altında');
    }
    (r.discipline.minDays >= 5 ? wins : losses).push('asgari gün ' + r.discipline.minDays + '/7');

    if(!wins.length && !losses.length) return 'Hafta için yeterli kayıt yok.';
    if(wins.length && losses.length){
      /* Celiskiyi tek cumlede tut: once kaybedilen, sonra "fakat" ile kazanilan.
         Rapor iyi haberi kotu haberin arkasina saklamaz. */
      const lead = losses[0].charAt(0).toLocaleUpperCase('tr-TR') + losses[0].slice(1);
      return lead + ' fakat ' + wins.join(' ve ') + '.';
    }
    if(wins.length) return 'Hafta temiz: ' + wins.join(' · ') + '.';
    return 'Hafta zorlandı: ' + losses.join(' · ') + '.';
  }

  return {
    minimumDay, streak, dayStatus, nextAction,
    correlate, pairsFor, crossFindings, SERIES, LINKS, MIN_PAIRS,
    weeklyReport, headline,
  };
})();
