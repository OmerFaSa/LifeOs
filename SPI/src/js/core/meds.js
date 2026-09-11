/* ILAC VE TAKVIYE KURAL MOTORU.

   Tek isi var: bir olcumdeki degisimin SEBEBINI aramak. Sistem
   «ferritin gercekten yukseldi» diyebiliyordu ama neden yukseldigini
   bilmiyordu; uc aydir demir hapi icen biri icin bu bir basari degil,
   beklenen bir sonuctur.

   Bu modul hicbir sayi uretmez ve hicbir doz onermez. Yalnizca su iki
   cumleyi kurar:

     «Bu olcumu etkileyen bir sey kullaniyorsun.»
     «Bu degisim, baslattigin seyin beklenen yonunde.»

   Ikincisi kritik: beklenen yonde bir degisim HABER DEGILDIR. Sistem
   onu «basari» diye sunmaz, «beklenen» diye isaretler. Ters yonde bir
   degisim ise haberdir ve oyle yazilir. */

window.SP = window.SP || {};

SP.Meds = (function(){
  const U = SP.U;

  /* Bir kayit o tarihte etkin mi? Bitis yoksa hala kullaniliyor demektir. */
  function activeOn(rec, dateISO){
    if(!rec || !rec.startDate) return false;
    if(rec.startDate > dateISO) return false;
    if(rec.endDate && rec.endDate < dateISO) return false;
    return true;
  }

  function all(){ return (SP.S.meds || []).slice(); }

  function activeList(dateISO){
    const d = dateISO || U.todayISO();
    return all().filter(r => activeOn(r, d));
  }

  function kindOf(rec){
    return SP.MED_BY_ID[rec && rec.kindId] || SP.MED_BY_ID.diger;
  }

  /* Bu olcumu, verilen tarihte etkileyen kayitlar. */
  function affecting(markerId, dateISO){
    const d = dateISO || U.todayISO();
    const out = [];
    all().forEach(rec => {
      if(!activeOn(rec, d)) return;
      const k = kindOf(rec);
      const a = k.affects.find(x => x.id === markerId);
      if(a) out.push({ rec, kind:k, dir:a.dir });
    });
    return out;
  }

  /* Iki tarih ARASINDA baslayan ya da biten kayitlar — karsilastirma
     ekraninin «bu degisim neye denk geliyor» sorusu bundan cevaplanir. */
  function changedBetween(markerId, fromISO, toISO){
    const out = [];
    all().forEach(rec => {
      const k = kindOf(rec);
      const a = k.affects.find(x => x.id === markerId);
      if(!a) return;
      if(rec.startDate && rec.startDate > fromISO && rec.startDate <= toISO)
        out.push({ rec, kind:k, dir:a.dir, event:'start' });
      else if(rec.endDate && rec.endDate > fromISO && rec.endDate <= toISO)
        out.push({ rec, kind:k, dir:a.dir, event:'stop' });
    });
    return out;
  }

  /* Olculen degisim, baslatilan seyin beklenen yonunde mi?

     Donen `verdict`:
       'expected'    degisim beklenen yonde — HABER DEGIL
       'contrary'    beklenenin tersine — haber
       'none'        eslesen bir kayit yok */
  function explainChange(markerId, fromISO, toISO, diff){
    const olaylar = changedBetween(markerId, fromISO, toISO);
    if(!olaylar.length) return { verdict:'none', events:[] };

    /* Birakilan bir sey, beklenen yonun TERSINI uretir. */
    const beklenen = olaylar.map(o => {
      const yon = o.event === 'stop'
        ? (o.dir === 'up' ? 'down' : 'up')
        : o.dir;
      return Object.assign({}, o, { beklenenYon:yon });
    });

    const gozlenen = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
    const uyan = beklenen.filter(o => o.beklenenYon === gozlenen);

    return {
      verdict:uyan.length ? 'expected' : 'contrary',
      events:beklenen,
      matching:uyan,
      observed:gozlenen,
    };
  }

  /* Ekranlarin dogrudan bastigi cumle. */
  function changeNote(markerId, fromISO, toISO, diff){
    const e = explainChange(markerId, fromISO, toISO, diff);
    if(e.verdict === 'none') return null;
    const adlar = (e.matching.length ? e.matching : e.events)
      .map(o => o.kind.name + (o.event === 'stop' ? ' (bırakıldı)' : ''));
    const liste = adlar.join(', ');
    if(e.verdict === 'expected'){
      return { tone:'info', expected:true,
        text:'Bu değişim iki ölçüm arasında başlayan ' + liste + ' ile aynı yönde. '
          + 'Beklenen bir sonuç; beslenmenin ya da yaşam düzeninin başarısı '
          + 'olarak okunmamalı.' };
    }
    return { tone:'warn', expected:false,
      text:liste + ' bu ölçümü ters yönde değiştirmesi beklenirdi; ölçülen değişim '
        + 'beklenenin tersine. Bu bir bulgudur.' };
  }

  /* Etkin kullanimlarin olcum sayfasindaki uyarisi. */
  function markerNote(markerId, dateISO){
    const et = affecting(markerId, dateISO);
    if(!et.length) return null;
    const adlar = et.map(o => o.kind.name).join(', ');
    const yonler = [...new Set(et.map(o => o.dir))];
    const yon = yonler.length === 1
      ? (yonler[0] === 'up' ? 'yükseltmesi' : 'düşürmesi')
      : 'değiştirmesi';
    return {
      tone:'info',
      title:'Bu ölçümü etkileyen bir şey kullanıyorsun',
      text:adlar + ' bu ölçümü ' + yon + ' beklenir. Değeri yorumlarken bu '
        + 'hesaba katılmalı; sistem doz önermez, yalnızca hatırlatır.',
      kinds:et.map(o => o.kind.id),
    };
  }

  /* Kreatin gibi bazi kayitlar bir olcumu YORUMLANAMAZ kilar: olcum
     dogru, ama gosterdigi sey degil. Bunlari ayri isaretleriz. */
  const BOZAN = {
    egfr:['kreatin'],
    creat:['kreatin'],
  };

  function distorts(markerId, dateISO){
    const liste = BOZAN[markerId];
    if(!liste) return null;
    const et = affecting(markerId, dateISO).filter(o => liste.indexOf(o.kind.id) >= 0);
    if(!et.length) return null;
    return { kinds:et.map(o => o.kind.name),
      text:et.map(o => o.kind.name).join(', ') + ' kullanırken bu ölçüm böbrek '
        + 'fonksiyonunu göstermez; kas kütlesinden gelen kreatin değeri yükseltir.' };
  }

  return { activeOn, all, activeList, kindOf, affecting, changedBetween,
    explainChange, changeNote, markerNote, distorts, BOZAN };
})();
