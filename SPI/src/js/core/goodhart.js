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

  /* ------------------------------------------------- POLITIKA PARAMETRELERI

     Bu uc sayi bir BULGU DEGILDIR; bu yazilimin secimidir. Nicin 56 gun?
     Nicin %35? Cevap "gurultuyu azaltmak icin" — ve bu bir gerekcedir,
     bir kanit degil. Kanit katmanindaki (core/evidence.js) ayni dilin
     burada da kullanilmasi kasitlidir: sayilari gizli "dogru esik" gibi
     sunmak, tasarim tercihini bulgu gibi gostermek olurdu.

     SPI'nin sayilari AYS ve ESP'dekinden MUHAFAZAKARDIR cunku saglik
     verisi daha gurultuludur. Bu da bir secimdir. */
  const POLICY = {
    version:1,
    status:'system_tuning',
    windowDays:56,
    effortRiseThreshold:0.35,
    stagnationThreshold:0.05,
    rationale:'Kilo, tansiyon, HRV ve laboratuvar değerleri kısa vadede çok '
      + 'dalgalanır. İki 28 günlük pencereyi karşılaştırmak, gürültüyü bulgu '
      + 'sanmaktır; bu yüzden pencere iki katına çıkarıldı ve çaba artışının '
      + '«belirgin» sayılması için gereken eşik yükseltildi. Başka sayılar da '
      + 'savunulabilirdi.',
    note:'Bu parametreler bilimsel bir eşik değil, bu yazılımın ayarıdır.',
  };

  const PENCERE = POLICY.windowDays;
  const CABA_ARTIS = POLICY.effortRiseThreshold;
  const SONUC_DURGUN = POLICY.stagnationThreshold;

  /* ---------------------------------------------------- YON SEMANTIGI

     Her sonuc olcusunun IYI YONU acikca yazilir. Bunu yazmamak, sessiz
     bir hata uretir: "daha cok antrenman yaptin, toparlanman DUSTU ama
     gosterge hala bir seyi temsil ediyor" gibi savunulamaz bir cumle.

       higher_better   buyudukce iyi (protein hedefi tutturulan gun orani)
       lower_better    kucukduikce iyi (hata orani, istirahat nabzi)
       movement_only   yonu SISTEM BILMEZ; yalnizca hareket olup olmadigina
                       bakilir (kilo — hedefin ne oldugunu sistem bilmiyor)

     Ucuncu deger bir kacamak degil bir DURUSTLUK aracidir: sistemin
     bilmedigi bir hedefe yon atfetmesi, olculmemis bir seyi olculmus
     gostermek olurdu. */
  const DIRECTIONS = {
    higher_better:{ id:'higher_better', label:'yükselmesi iyi',
      improvement:function(d){ return d; } },
    lower_better:{ id:'lower_better', label:'düşmesi iyi',
      improvement:function(d){ return d == null ? null : -d; } },
    movement_only:{ id:'movement_only', label:'yönü sistem bilmez',
      improvement:function(d){ return d == null ? null : Math.abs(d); } },
  };

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
    { id:'logging-vs-protein', direction:'higher_better',
      effortLabel:'öğün kaydedilen gün', outcomeLabel:'protein hedefine ulaşılan gün oranı',
      question:'Daha çok gün kayıt tutuyorsun ama hedefe ulaşılan gün oranı '
             + 'yerinde. Kayıt tutmak ile yemeği değiştirmek aynı şey mi oldu?',
      effort:loggedDays, outcome:proteinHitRate, minEffort:20 },

    { id:'training-vs-readiness', direction:'higher_better',
      effortLabel:'antrenman dakikası', outcomeLabel:'toparlanma skoru',
      question:'Antrenman süresi arttı, toparlanma skoru yerinde ya da '
             + 'geriledi. Yük artışı taşınabiliyor mu, yoksa uyku ve '
             + 'beslenme mi geride kaldı?',
      effort:trainingMinutes, outcome:readinessAvg, minEffort:400 },

    { id:'weighins-vs-weight', direction:'movement_only',
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

    { id:'supplements-vs-marker', direction:'higher_better',
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
      /* Yon her satirda durur: «tanimsiz» ile «olculmedi» ayri seylerdir
         ve arayuz ikisini ayirt edebilmeli. */
      direction:def.direction || null,
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

    /* Yon olmadan "sonuc iyilesti mi" sorusu cevaplanamaz. Tanimsiz
       birakilmis bir cift, sessizce "yukselmesi iyi" sayilmaz — bu bir
       varsayim olurdu; acikca hata verir. */
    const yon = DIRECTIONS[def.direction || ''];
    if(!yon){
      return Object.assign(base, { status:'unknown', cert:'missing',
        note:'Bu çiftin yön tanımı yok; sonucun hangi yönde iyi olduğu '
           + 'bilinmeden ayrışma değerlendirilemez.' });
    }
    const iyilesme = yon.improvement(dS);

    if(dC == null || dC < CABA_ARTIS){
      return Object.assign(base, { status:'idle', cert:'measured',
        direction:yon.id, effortChange:dC, outcomeChange:dS, improvement:iyilesme,
        note:'Çaba belirgin biçimde artmamış; nöbetçi burada bir şey aramaz.' });
    }
    if(iyilesme != null && iyilesme > SONUC_DURGUN){
      return Object.assign(base, { status:'aligned', cert:'measured',
        direction:yon.id, effortChange:dC, outcomeChange:dS, improvement:iyilesme,
        note:yon.id === 'movement_only'
          ? 'Çaba arttı, sonuç da hareket etti. Hareketin YÖNÜ bu sistemin '
            + 'bileceği bir şey değil — hedefini sen biliyorsun.'
          : 'Çaba da sonuç da doğru yönde arttı. Gösterge hâlâ bir şeyi '
            + 'temsil ediyor.' });
    }
    /* Sonuc TERS yone gittiyse bu "yerinde saymak" degildir ve oyle
       yazilmaz. Once bunu ayirmak, uyarinin dogru cumleyi kurmasini saglar. */
    const geriledi = iyilesme != null && iyilesme < -SONUC_DURGUN;
    return Object.assign(base, { status:'decoupled', cert:'measured',
      direction:yon.id, effortChange:dC, outcomeChange:dS, improvement:iyilesme,
      regressed:geriledi,
      note:def.effortLabel + ' %' + Math.round(dC * 100) + ' arttı, '
         + def.outcomeLabel + (geriledi
            ? ' %' + Math.round(Math.abs(iyilesme) * 100) + ' GERİLEDİ.'
            : ' yerinde saydı.') });
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

  function policy(){ return POLICY; }

  return { PAIRS, windows, pair, scan, flags, brief, policy, DIRECTIONS,
    PENCERE, CABA_ARTIS, SONUC_DURGUN };
})();
