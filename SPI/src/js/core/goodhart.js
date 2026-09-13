/* Goodhart nobetcisi — gosterge amaca donustugunde haber verir.

   AYS ve ESP'deki nobetcinin SPI'ye uyarlanmasi. Uc onemli fark var ve
   ucu de saglik verisinin dogasindan geliyor:

   1. PENCERE DAHA UZUN. AYS'de 28 gun yeterliydi; burada 56 gun. Kilo,
      tansiyon, HRV ve laboratuvar degerleri kisa vadede cok dalgalanir.
      Iki 28 gunluk pencereyi karsilastirmak, gurultuyu bulgu sanmaktir.

   2. ESIK DAHA YUKSEK. Caba artisinin "belirgin" sayilmasi icin %35
      gerekir (digerlerinde %25). Sebep ayni: gurultu.

   3. BIYOBELIRTEC CIFTLERI ICIN LABORATUVAR SARTI VAR. Iki pencerenin
      HER IKISINDE de olcum yoksa cift degerlendirilmez. Tek tahlille
      egilim cikarmak, iki noktadan dogru gecirip "egilim" demektir.

   Kurallar aynen korunur: nobetci hukum vermez soru sorar; caba dususte
   uyari uretmez; iki tarafta da olcum yoksa 'unknown' doner. */

window.SP = window.SP || {};

SP.Goodhart = (function(){
  const U = SP.U, S = SP.S;

  const PENCERE = 56;
  const CABA_ARTIS = 0.35;
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

  /* ---------------------------------------------------------- sayaclar */

  function workoutsIn(w){
    return (S.workouts || []).filter(x => inWin(x.date, w));
  }
  function trainingMinutes(w){
    return workoutsIn(w).reduce((a, x) => a + (Number(x.minutes) || 0), 0);
  }

  /* Gunluk olcum girilen gunler ve o gunlerin toparlanma skoru. */
  function vitalDays(w){
    return Object.keys(S.vitals || {}).filter(k => inWin(k, w));
  }
  function readinessAvg(w){
    const g = vitalDays(w).map(d => {
      const r = SP.Move.readiness(d);
      return r && r.score != null ? r.score : null;
    }).filter(v => v != null);
    return g.length >= 10 ? g.reduce((a, b) => a + b, 0) / g.length : null;
  }

  /* Bir olcumun pencere icindeki medyani.

     Seri SP.Model.seriesOf'tan okunur: tahlil hucreleri {v, cert}
     bicimindedir ve gunluk olcumlerle birlestirilir. Iki noktadan az
     olcumde medyan hesaplanmaz — iki nokta her zaman bir dogru cizer. */
  function markerMedian(markerId, w){
    const vals = (SP.Model.seriesOf(markerId) || [])
      .filter(p => inWin(p.date, w) && isFinite(p.v))
      .map(p => p.v);
    return vals.length >= 2 ? U.median(vals) : null;
  }

  /* Ogun kaydedilen gun sayisi — "takip cabasi". */
  function loggedDays(w){
    return Object.keys(S.meals || {})
      .filter(d => inWin(d, w) && (S.meals[d] || []).length).length;
  }

  /* Protein hedefine ulasilan gunlerin orani — "takibin sonucu".
     Hedefi hesaplanamiyorsa null doner; sifir DEGIL. */
  function proteinHitRate(w){
    const t = SP.Nutri.targets();
    if(!t || !t.ok || !t.protein) return null;
    const gunler = Object.keys(S.meals || {}).filter(d => inWin(d, w) && (S.meals[d] || []).length);
    if(gunler.length < 10) return null;
    let tam = 0;
    gunler.forEach(d => {
      const tot = SP.Nutri.dayTotals(d);
      if(tot && !tot.empty && tot.protein >= t.protein.min) tam++;
    });
    return tam / gunler.length;
  }

  /* -------------------------------------------------------------- ciftler */

  const PAIRS = [
    { id:'logging-vs-protein',
      effortLabel:'öğün kaydedilen gün', outcomeLabel:'protein hedefine ulaşılan gün oranı',
      question:'Daha çok gün kayıt tutuyorsun ama hedefe ulaşılan gün oranı '
             + 'yerinde. Kayıt tutmak ile yemeği değiştirmek aynı şey mi oldu?',
      effort:loggedDays, outcome:proteinHitRate, minEffort:20 },

    { id:'training-vs-readiness',
      effortLabel:'antrenman dakikası', outcomeLabel:'toparlanma skoru',
      question:'Antrenman süresi arttı, toparlanma skoru yerinde ya da '
             + 'geriledi. Yük artışı taşınabiliyor mu, yoksa uyku ve '
             + 'beslenme mi geride kaldı?',
      effort:trainingMinutes, outcome:readinessAvg, minEffort:400 },

    { id:'weighins-vs-weight',
      effortLabel:'tartılan gün', outcomeLabel:'kilo yönü',
      /* Kilo YONU hedefe gore degerlendirilemez: hedefin ne oldugunu
         sistem bilmez. Bu yuzden yalnizca DEGISIM olculur ve degismemek
         ayrisma sayilir — daha sik tartilmak tek basina bir sey degistirmez. */
      question:'Daha sık tartılıyorsun ama tartı hareket etmiyor. Tartılmak '
             + 'bir ölçüm, bir müdahale değil — bu dönemde ne değişti?',
      effort:w => Object.keys(S.vitals || {}).filter(function(d){
        return inWin(d, w) && (S.vitals[d] || {}).weight != null;
      }).length,
      outcome:w => markerMedian('weight', w), minEffort:20 },

    { id:'supplements-vs-marker',
      effortLabel:'takviye kaydı', outcomeLabel:'D vitamini düzeyi',
      question:'Takviye kaydı arttı ama ölçülen düzey yerinde. Emilim '
             + 'koşulları (yağlı öğünle eşleştirme) sağlanıyor mu?',
      effort:w => (S.meds || []).filter(function(m){
        const tur = SP.MED_BY_ID[m.kindId];
        return tur && tur.group === 'takviye' && inWin(m.startDate, w);
      }).length,
      outcome:w => markerMedian('vitd', w), minEffort:2 },
  ];

  /* ----------------------------------------------------------------- olcum */

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
        note:'Sonuç tarafında iki pencerenin birinde yeterli ölçüm yok. '
           + 'Ölçülmemiş sonuç, sıfır sonuç değildir.' });
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
    if(dS != null && Math.abs(dS) > SONUC_DURGUN){
      return Object.assign(base, { status:'aligned', cert:'measured',
        effortChange:dC, outcomeChange:dS,
        note:'Çaba arttı, sonuç da hareket etti. Gösterge hâlâ bir şeyi '
           + 'temsil ediyor — yönü senin hedefine göre sen değerlendir.' });
    }
    return Object.assign(base, { status:'decoupled', cert:'measured',
      effortChange:dC, outcomeChange:dS,
      note:def.effortLabel + ' %' + Math.round(dC * 100) + ' arttı, '
         + def.outcomeLabel + ' yerinde saydı.' });
  }

  function scan(){ return PAIRS.map(pair); }
  function flags(){ return scan().filter(p => p.status === 'decoupled'); }

  function brief(){
    const f = flags();
    if(!f.length) return null;
    return { count:f.length,
      title:f.length === 1 ? 'Bir gösterge ayrışmış' : f.length + ' gösterge ayrışmış',
      body:f[0].note + ' ' + f[0].question, flags:f };
  }

  return { PAIRS, windows, pair, scan, flags, brief,
    PENCERE, CABA_ARTIS, SONUC_DURGUN };
})();
