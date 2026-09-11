/* SEMPTOM VE DONGU KURAL MOTORU.

   Iki isi var ve ikisi de AYNI SORUYA hizmet eder: bir olcumun
   yaninda okunmasi gereken baska ne var?

   1. SEMPTOM. Gunluge isaretlenen sikayetler sayilir, egilime donur ve
      ilgili olcumle birlikte okunur. «Ferritin 18» tek basina bir
      sayidir; «ferritin 18 ve son otuz gunun on ikisinde yorgunluk»
      bir tablodur.

   2. ADET DONGUSU. Hane sistemi kadin profilleri tasiyacak. Ferritin ve
      hemoglobin yorumu donguye baglidir: kanama doneminde alinan bir
      kan, deponun gercek halini gostermez. Cinsiyete gore referans
      araligi vardi; DONGU BAGLAMI yoktu.

   ─────────────────────────────────────────────────────────────────

   DEGISMEZLER:

   · Semptom yoklugu VERI DEGILDIR. Isaretlenmemis bir gun «sikayet
     yok» demek degil «girilmemis» demektir.
   · Sistem TESHIS KOYMAZ. «Su olcumle birlikte okunur» der.
   · Dongu tahmini bir TAHMINDIR ve oyle etiketlenir: ortalama
     uzunluktan hesaplanir, olculmez. */

window.SP = window.SP || {};

SP.Symptom = (function(){
  const U = SP.U;

  /* ------------------------------------------------------------ semptom */

  function ofDay(dateISO){
    const v = SP.Model.vitalsOf(dateISO);
    return (v && v.symptoms) || {};
  }

  async function setSymptom(dateISO, id, severity){
    if(!SP.SYMPTOM_BY_ID[id]) return null;
    const v = SP.Model.vitalsOf(dateISO) || SP.Model.defaultVitals(dateISO);
    const s = Object.assign({}, v.symptoms || {});
    if(!severity) delete s[id];
    else s[id] = Math.max(1, Math.min(3, Number(severity) || 1));
    return SP.Model.saveVitals(dateISO, { symptoms:s });
  }

  /* Son N gunde hangi sikayet kac gun isaretlendi?

     `days` PAYDA DEGILDIR: yalnizca veri girilmis gunler sayilir.
     Otuz gunun besinde giris varsa «30 gunde 3 gun» demek yaniltir;
     «giris yapilan 5 gunun 3'u» dogrudur. */
  function window_(days){
    const n = days || 30;
    const bugun = U.today();
    const sayim = {}, siddet = {};
    let girilenGun = 0;

    for(let i = 0; i < n; i++){
      const d = U.iso(U.addDays(bugun, -i));
      const v = SP.Model.vitalsOf(d);
      if(!v) continue;
      const s = v.symptoms || {};
      const idler = Object.keys(s);
      /* Gunluge dokunulmus mu? Semptom alani VARSA o gun sayilir —
         bos birakilmis bir gun «sikayet yok» demek degildir. */
      if(v.symptomsLogged || idler.length) girilenGun++;
      idler.forEach(id => {
        sayim[id] = (sayim[id] || 0) + 1;
        siddet[id] = (siddet[id] || 0) + (Number(s[id]) || 1);
      });
    }

    const rows = Object.keys(sayim).map(id => ({
      symptom:SP.SYMPTOM_BY_ID[id],
      id, days:sayim[id],
      avgSeverity:U.round(siddet[id] / sayim[id], 1),
      pct:girilenGun ? Math.round(100 * sayim[id] / girilenGun) : null,
    })).filter(r => r.symptom).sort((a, b) => b.days - a.days);

    return { ok:girilenGun > 0, loggedDays:girilenGun, windowDays:n, rows };
  }

  /* Bir olcumun yaninda okunacak sikayetler. */
  function forMarker(markerId, days){
    const w = window_(days || 30);
    if(!w.ok) return { ok:false, rows:[], note:'Semptom kaydı yok.' };
    const ilgili = (SP.SYMPTOM_FOR_MARKER[markerId] || []).map(s => s.id);
    const rows = w.rows.filter(r => ilgili.indexOf(r.id) >= 0);
    return { ok:rows.length > 0, rows, loggedDays:w.loggedDays, windowDays:w.windowDays };
  }

  /* ------------------------------------------------------------- dongu */

  const CYCLE_DEFAULT = 28;

  function periods(){
    /* Kanama gunleri gunlukte isaretlenir; her kesintisiz dizi bir
       donemdir. Baslangic tarihleri dongu uzunlugunu verir. */
    const gunler = Object.keys(SP.S.vitals || {})
      .filter(d => SP.S.vitals[d] && SP.S.vitals[d].period)
      .sort();
    const donemler = [];
    gunler.forEach(d => {
      const son = donemler[donemler.length - 1];
      if(son && U.diffDays(son.end, d) <= 1){ son.end = d; son.days++; return; }
      donemler.push({ start:d, end:d, days:1 });
    });
    return donemler;
  }

  function cycle(){
    const p = SP.S.profile || {};
    if(p.sex !== 'female') return { ok:false, na:true };

    const d = periods();
    if(!d.length){
      return { ok:false, n:0,
        note:'Kanama günü işaretlenmemiş. Günlükte işaretlersen ferritin ve '
          + 'hemoglobin yorumu döngüyü hesaba katar.' };
    }

    const son = d[d.length - 1];
    const gecen = U.diffDays(son.start, U.todayISO());

    /* Ortalama uzunluk en az iki donem ister; yoksa varsayilan
       kullanilir ve bu ACIKCA soylenir. */
    let uzunluk = CYCLE_DEFAULT, olculdu = false;
    if(d.length >= 2){
      const farklar = [];
      for(let i = 1; i < d.length; i++) farklar.push(U.diffDays(d[i - 1].start, d[i].start));
      const gecerli = farklar.filter(x => x >= 15 && x <= 60);
      if(gecerli.length){
        uzunluk = Math.round(U.sum(gecerli) / gecerli.length);
        olculdu = true;
      }
    }

    const faz = gecen <= (son.days || 5) ? 'kanama'
      : gecen < uzunluk - 14 ? 'foliküler'
      : gecen < uzunluk - 10 ? 'ovulasyon'
      : 'luteal';

    return {
      ok:true, n:d.length, last:son, dayOfCycle:gecen + 1,
      length:uzunluk, measured:olculdu, phase:faz,
      nextExpected:U.iso(U.addDays(U.parse(son.start), uzunluk)),
      note:olculdu
        ? d.length + ' dönemden hesaplanan ortalama: ' + uzunluk + ' gün.'
        : 'Ortalama uzunluk için en az iki dönem gerekir; ' + CYCLE_DEFAULT
          + ' günlük varsayılan kullanıldı.',
    };
  }

  /* Kanama doneminde ya da hemen sonrasinda alinan bir kan, demir
     deposunun gercek halini gostermez. */
  const CYCLE_SENSITIVE = ['ferritin', 'hgb', 'hct', 'iron_s', 'tsat'];

  function cycleNote(markerId, dateISO){
    if(CYCLE_SENSITIVE.indexOf(markerId) < 0) return null;
    const p = SP.S.profile || {};
    if(p.sex !== 'female') return null;

    const d = periods();
    if(!d.length) return null;
    const t = dateISO || U.todayISO();

    /* Olcum hangi donemin icinde ya da yakinindaydi? */
    for(let i = d.length - 1; i >= 0; i--){
      const don = d[i];
      if(t < don.start) continue;
      const fark = U.diffDays(don.end, t);
      if(fark < 0) continue;
      if(fark <= 7){
        return { tone:'info',
          title:'Bu ölçüm döngünün kanama dönemine yakın',
          text:'Kanama ' + U.fmtDate(don.start) + ' tarihinde başlamış; ölçüm '
            + (fark === 0 ? 'aynı dönemde' : fark + ' gün sonra') + ' alınmış. '
            + 'Bu dönemde ve hemen sonrasında demir deposu ve hemoglobin '
            + 'olduğundan düşük okunabilir.' };
      }
      break;
    }
    return null;
  }

  return { ofDay, setSymptom, window:window_, forMarker,
    periods, cycle, cycleNote, CYCLE_SENSITIVE, CYCLE_DEFAULT };
})();
