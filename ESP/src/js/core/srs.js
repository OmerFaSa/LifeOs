/* Arali tekrar motoru — Leitner kutulari, SM-2 ile yumusatilmis.

   Tek is: bir karti TAM UNUTULMADAN HEMEN ONCE sormak. Amac tekrar sayisini
   azaltmak degil, ayni hatirlamayi daha az tekrarla elde etmektir.

   Iki yapi birlikte calisir:

     KUTU (box 1..5)  kaba siniftir; "bu karti ne kadar taniyorum".
     EASE (1.3..2.8)  ince ayardir; ayni kutudaki iki kart ayni hizda uzamaz.

   Neden ikisi birden? Saf Leitner cok kaba: kolay ve zor kart ayni araligi
   alir. Saf SM-2 ise cok kirilgan: tek bir yanlis cevap araligi sifirlar ve
   kullanici ayni kartla gunlerce bogusur. Kutu bir taban verir, ease o
   tabani kartin kendi zorluguna gore kaydirir.

   R(t) = e^(−t/S) — kavramsal retansiyon. S kartin kararliligidir ve her
   dogru cevapta buyur. Bu fonksiyon `intellect.js` tarafindan degil burada
   tanimlidir cunku S'yi ureten sey SRS gecmisidir.

   DOKTRIN: hic calisilmamis kart ortalamaya GIRMEZ. Bir gun ara vermek
   retansiyonu cokmus gibi gosterirdi; oysa hic sorulmamis kart hakkinda
   soylenecek sey "veri yok"tur, "sifir" degil. */

window.ESP = window.ESP || {};

ESP.SRS = (function(){
  const U = ESP.U;
  const S = ESP.S;

  /* Kutu araliklari (gun). Ilk iki basamak kasitli olarak kisadir: yeni bir
     kartin ilk yirmi dort saatteki kaybi en buyuktur. */
  const BOXES = [
    { box:1, days:0,  label:'Yeni' },
    { box:2, days:1,  label:'Taze' },
    { box:3, days:3,  label:'Oturuyor' },
    { box:4, days:7,  label:'Yerleşti' },
    { box:5, days:21, label:'Sağlam' },
  ];

  const EASE_MIN = 1.3;
  const EASE_MAX = 2.8;
  const EASE_START = 2.5;

  /* Cevap kalitesi — dort dugme. Bes ve uzeri secenek kullaniciyi karsilastirma
     yapmaya zorluyor ve cevap suresini uzatiyordu; dordu yeter. */
  const GRADES = [
    { id:'again', label:'Yine',  quality:0, note:'Hatırlamadım. Kart başa döner.' },
    { id:'hard',  label:'Zor',   quality:3, note:'Hatırladım ama zorlandım. Aralık az uzar.' },
    { id:'good',  label:'İyi',   quality:4, note:'Hatırladım. Aralık normal uzar.' },
    { id:'easy',  label:'Kolay', quality:5, note:'Anında geldi. Aralık daha çok uzar.' },
  ];

  const GRADE_BY_ID = GRADES.reduce(function(m, g){ m[g.id] = g; return m; }, {});

  function boxDays(box){
    const row = BOXES.find(b => b.box === box);
    return row ? row.days : 0;
  }

  function clampEase(e){ return Math.min(EASE_MAX, Math.max(EASE_MIN, e)); }

  /* ---------------------------------------------------------- zamanlama */

  /* Bir cevabin karta ne yaptigi. SAF fonksiyon: kart nesnesini degistirmez,
     yeni alanlari doner. Boylece test tek satirda yazilir ve onizleme
     ("bu dugmeye basarsam ne olur") ayni hesabi kullanir. */
  function schedule(card, gradeId, todayISO){
    const g = GRADE_BY_ID[gradeId];
    if(!g) return null;
    const today = todayISO || U.todayISO();
    const c = card || {};
    const ease = clampEase(typeof c.ease === 'number' ? c.ease : EASE_START);
    const box = Math.min(5, Math.max(1, c.box || 1));

    /* Yanlis cevap: kutu basa doner ama ease TAMAMEN sifirlanmaz.
       Sifirlansaydi bir kez unutulan kart, hic ogrenilmemis kartla ayni
       muameleyi gorurdu — oysa gecmisi var. */
    if(g.quality === 0){
      return {
        box:1,
        ease:clampEase(ease - 0.2),
        interval:0,
        due:today,                       // aynı oturumda tekrar sorulur
        reps:(c.reps || 0) + 1,
        lapses:(c.lapses || 0) + 1,
      };
    }

    const yeniKutu = Math.min(5, box + (g.quality >= 4 ? 1 : 0));
    /* Zor cevap kutuyu yukseltmez ama araligi da tamamen dondurmaz:
       kartin bir onceki araligina gore kucuk bir ilerleme verir. */
    const taban = boxDays(yeniKutu) || 1;
    const carpan = g.quality === 3 ? 0.6 : (g.quality === 5 ? ease / 2 + 0.5 : 1);
    const interval = Math.max(1, Math.round(taban * carpan));

    return {
      box:yeniKutu,
      ease:clampEase(ease + (g.quality === 5 ? 0.10 : g.quality === 3 ? -0.12 : 0)),
      interval,
      due:U.iso(U.addDays(U.parse(today), interval)),
      reps:(c.reps || 0) + 1,
      lapses:(c.lapses || 0),
    };
  }

  /* Bir cevabi karta ISLER ve kaydeder. Gecmise tek satir duser; gecmis
     retansiyon hesabinin tek girdisidir. */
  async function answer(cardId, gradeId){
    const card = S.cards.find(c => c.id === cardId);
    if(!card) return { ok:false, error:'Kart bulunamadı.' };
    const next = schedule(card, gradeId);
    if(!next) return { ok:false, error:'Böyle bir cevap yok.' };

    const onceki = { box:card.box, ease:card.ease, due:card.due };
    Object.assign(card, next);
    card.history = (card.history || []).concat([{
      at:new Date().toISOString(), grade:gradeId, box:next.box, interval:next.interval,
    }]);
    /* Gecmis sinirsiz buyumesin: retansiyon hesabi son 50 cevabi kullanir,
       fazlasi depoyu sisirir ve hicbir soruyu daha iyi cevaplamaz. */
    if(card.history.length > 50) card.history = card.history.slice(-50);

    await ESP.Model.saveCard(card);
    return { ok:true, card, before:onceki, after:next };
  }

  /* ------------------------------------------------------------- kuyruk */

  /* Vadesi gelmis kartlar. Bugun ve oncesi — geciken kart once gelir.

     `null` donmez, bos dizi doner: "vadesi gelen kart yok" olculmus bir
     sonuctur, eksik veri degil. */
  function dueCards(todayISO){
    const today = todayISO || U.todayISO();
    return S.cards
      .filter(c => (c.due || today) <= today)
      .sort((a, b) => {
        const d = (a.due || '').localeCompare(b.due || '');
        if(d !== 0) return d;                    // en cok geciken once
        return (a.box || 1) - (b.box || 1);      // sonra en zayif kutu
      });
  }

  /* Kac gun gecikmis. Kart bugun vadeliyse 0 doner. */
  function overdueDays(card, todayISO){
    const today = todayISO || U.todayISO();
    if(!card || !card.due) return 0;
    return Math.max(0, U.diffDays(card.due, today));
  }

  /* -------------------------------------------------------- retansiyon

     R(t) = e^(−t/S)

     S (kararlilik) kartin son araligindan gelir: bir kart 21 gun sonra
     soruldugunda dogru cevaplaniyorsa kararliligi kabaca o aralik kadardir.
     Yeni kartta aralik 0'dir; bu yuzden hic cevaplanmamis kart hesaba
     GIRMEZ — sifir bir olcum degil, olcumun yoklugudur. */
  function stabilityOf(card){
    const c = card || {};
    if(!c.reps) return null;                      // hic sorulmamis
    const taban = Math.max(1, c.interval || boxDays(c.box) || 1);
    /* Ease kararliligi olceklendirir: ayni araligi kolay bulan kart daha
       kararlidir. */
    return taban * (typeof c.ease === 'number' ? c.ease : EASE_START) / 2;
  }

  function retentionOf(card, todayISO){
    const s = stabilityOf(card);
    if(s == null) return null;
    const today = todayISO || U.todayISO();
    /* Gecen sure: kart en son ne zaman sorulduysa oradan. `due - interval`
       son cevap gunudur. */
    const sonCevap = card.due && card.interval
      ? U.iso(U.addDays(U.parse(card.due), -card.interval))
      : (card.history && card.history.length
          ? card.history[card.history.length - 1].at.slice(0, 10) : null);
    if(!sonCevap) return null;
    const t = Math.max(0, U.diffDays(sonCevap, today));
    return Math.exp(-t / s);
  }

  /* Destenin ortalama retansiyonu.

     Donus `{ value, cert, n, total }`. `cert` daima soylenir:
       measured   en az bir kart cevaplanmis
       missing    hic cevaplanmis kart yok — ORTALAMA URETILMEZ

     Hic cevaplanmamis kartlar `total`da gorunur ama `value`ya girmez.
     Kapsam ekranda yazilir: "12 karttan 9'undan hesaplandi". */
  function retention(lang, todayISO){
    const kartlar = ESP.Model.cardsOf(lang);
    const olculen = kartlar
      .map(c => retentionOf(c, todayISO))
      .filter(r => r != null);
    if(!olculen.length){
      return { value:null, cert:'missing', n:0, total:kartlar.length };
    }
    const ort = olculen.reduce((a, b) => a + b, 0) / olculen.length;
    return { value:ort, cert:'derived', n:olculen.length, total:kartlar.length };
  }

  /* --------------------------------------------------------------- ozet */

  /* Kutu dagilimi — hangi kart nerede. Ilerleme ekrani bunu cizer. */
  function boxCounts(lang){
    const kartlar = ESP.Model.cardsOf(lang);
    return BOXES.map(b => ({
      box:b.box, label:b.label,
      count:kartlar.filter(c => (c.box || 1) === b.box).length,
    }));
  }

  /* Aktif kelime: uretimde kullanildigini kullanicinin isaretledigi kart.

     Tanimak (pasif) ile cumlede kullanmak (aktif) ayri seylerdir ve ayri
     sayilir. Bir kartin kutusunun yuksek olmasi onu aktif yapmaz. */
  function activeCount(lang){
    return ESP.Model.cardsOf(lang).filter(c => c.active).length;
  }

  /* Destenin durumu — brifingin dil bolumu buradan beslenir. */
  function deckStatus(lang, todayISO){
    const today = todayISO || U.todayISO();
    const kartlar = ESP.Model.cardsOf(lang);
    const due = dueCards(today).filter(c => !lang || c.lang === lang);
    const r = retention(lang, today);
    const geciken = due.filter(c => overdueDays(c, today) > 0);
    return {
      total:kartlar.length,
      due:due.length,
      overdue:geciken.length,
      maxOverdueDays:geciken.reduce((m, c) => Math.max(m, overdueDays(c, today)), 0),
      retention:r,
      active:activeCount(lang),
      boxes:boxCounts(lang),
    };
  }

  /* Son N gunde cevaplanan kart sayisi. Gun basina degil TOPLAM doner;
     "gunde ortalama" hesabini cagiran yapar ve paydasini kendi soyler. */
  function answeredIn(days, todayISO){
    const today = todayISO || U.todayISO();
    const sinir = U.iso(U.addDays(U.parse(today), -(days || 7)));
    let n = 0;
    S.cards.forEach(c => {
      (c.history || []).forEach(h => { if(h.at.slice(0, 10) >= sinir) n++; });
    });
    return n;
  }

  return {
    BOXES, GRADES, GRADE_BY_ID, EASE_START, EASE_MIN, EASE_MAX,
    boxDays, schedule, answer,
    dueCards, overdueDays,
    stabilityOf, retentionOf, retention,
    boxCounts, activeCount, deckStatus, answeredIn,
  };
})();
