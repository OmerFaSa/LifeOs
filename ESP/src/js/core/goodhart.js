/* Goodhart nöbetçisi — gösterge amaca dönüştüğünde haber verir.

   Goodhart yasası tek cümledir: bir ölçü hedef hâline geldiğinde, iyi bir
   ölçü olmaktan çıkar. Bu, ölçen her sistemin başına gelir ve sessizce
   gelir. Kullanıcı daha çok dakika yazar, daha çok kart çevirir, daha çok
   sayfa okur — sayılar yükselir, tablo güzelleşir, HİÇBİR ŞEY öğrenilmez.

   Bu dosya o boşluğu arar. Yöntem basit ve kaba: her disiplinde ÇABA'yı
   temsil eden bir sayı ile SONUÇ'u temsil eden bir sayı yan yana konur,
   iki bitişik pencerede ölçülür ve şu sorulur: çaba arttı da sonuç yerinde
   mi saydı?

   Dört kural:

   1. NÖBETÇİ HÜKÜM VERMEZ, SORU SORAR. Çıktısı "yanlış çalışıyorsun"
      değildir; "bu iki sayı ayrışmış, sebebini sen bilirsin"dir. Ayrışmanın
      meşru sebepleri vardır: plato, zor bir parçaya geçiş, yeni bir dil.

   2. İKİ TARAFTA DA VERİ OLMADAN AYRIŞMA YOKTUR. Sonuç ölçülmediyse sonuç
      sıfır değildir; o çift 'unknown' döner. Bu, deponun en eski kuralıdır.

   3. ÇABA DÜŞERKEN UYARI ÜRETİLMEZ. Az çalışıp az ilerlemek bir Goodhart
      vakası değildir, yalnızca az çalışmaktır. Nöbetçinin işi tembelliği
      değil, VERİMSİZ GAYRETİ görmektir.

   4. KÜÇÜK SAYILARDA GÜRÜLTÜ VARDIR. Eşiğin altındaki hacimde bir çift
      hiç değerlendirilmez: 4 karttan 6 karta çıkmak %50 artıştır ve
      hiçbir şey ifade etmez. */

window.ESP = window.ESP || {};

ESP.Goodhart = (function(){
  const U = ESP.U, S = ESP.S;

  /* ------------------------------------------------- POLİTİKA PARAMETRELERİ

     Bu sayılar bir PEDAGOJİK BULGU DEĞİLDİR; bu yazılımın seçimidir.
     Kanıt katmanındaki (core/evidence.js) ayrımın aynısı burada da geçerli:
     sayıları gizli «doğru eşik» gibi sunmak, bir tasarım tercihini bulgu
     gibi göstermek olurdu. */
  const POLICY = {
    version:1,
    status:'system_tuning',
    windowDays:28,
    effortRiseThreshold:0.25,
    stagnationThreshold:0.05,
    minEffortMinutes:60,
    rationale:'28 gün, çoğu pratik disiplininde bir «dönem» hissi verecek '
      + 'kadar uzun; iki bitişik pencere iki ayı kapsar. %25\'lik eşik '
      + 'gürültüyü ayıklamak için seçildi: küçük dalgalanmalar çaba artışı '
      + 'sayılmaz. Başka sayılar da savunulabilirdi.',
    note:'Bu parametreler pedagojik bir eşik değil, bu yazılımın ayarıdır.',
  };

  /* Pencere uzunluğu (gün). İki bitişik pencere karşılaştırılır:
     [bugün−28, bugün] ile [bugün−56, bugün−28]. */
  const PENCERE = POLICY.windowDays;
  const CABA_ARTIS = POLICY.effortRiseThreshold;
  const SONUC_DURGUN = POLICY.stagnationThreshold;

  /* Bu hacmin altındaki çabada çift değerlendirilmez (dakika). */
  const ASGARI_CABA = POLICY.minEffortMinutes;

  /* ---------------------------------------------------- YÖN SEMANTİĞİ

     `lower:true` alanı baştan beri vardı ama bir SÖZLÜK değildi. Her çift
     için açık bir yön adı yazmak iki şey kazandırır: üçüncü bir durumu
     («yönü sistem bilmez») mümkün kılar, ve yön tanımı unutulmuş bir çifti
     sessiz varsayımla çalıştırmak yerine açıkça reddeder.

       higher_better   büyüdükçe iyi
       lower_better    küçüldükçe iyi (hata oranı)
       movement_only   yönü SİSTEM BİLMEZ; yalnızca hareket olup olmadığına
                       bakılır

     Üçüncü değer bir kaçamak değil bir DÜRÜSTLÜK aracıdır: sistemin
     bilmediği bir hedefe yön atfetmesi, ölçülmemiş bir şeyi ölçülmüş
     göstermek olurdu. */
  const DIRECTIONS = {
    higher_better:{ id:'higher_better', label:'yükselmesi iyi',
      improvement:function(d){ return d; } },
    lower_better:{ id:'lower_better', label:'düşmesi iyi',
      improvement:function(d){ return d == null ? null : -d; } },
    movement_only:{ id:'movement_only', label:'yönü sistem bilmez',
      improvement:function(d){ return d == null ? null : Math.abs(d); } },
  };

  function iso(n){ return U.iso(U.addDays(U.parse(U.todayISO()), n)); }

  /* Bir pencerenin sınırları: [bas, son) — son hariç. */
  function windows(){
    return {
      now:{ from:iso(-PENCERE), to:iso(0) },
      prev:{ from:iso(-2 * PENCERE), to:iso(-PENCERE) },
    };
  }

  function inWin(dateISO, w){
    const d = String(dateISO || '').slice(0, 10);
    return !!d && d >= w.from && d < w.to;
  }

  /* ------------------------------------------------------- ham sayaçlar */

  function minutesIn(discId, w){
    let t = 0;
    Object.keys(S.days || {}).forEach(k => {
      if(!inWin(k, w)) return;
      (S.days[k].sessions || []).forEach(s => {
        if(s.disc === discId) t += Number(s.minutes) || 0;
      });
    });
    return t;
  }

  /* Kart cevapları: pencerede kaç cevap ve bunların yüzde kaçı ilk
     denemede hatırlandı ('good' ya da 'easy'). */
  function cardAnswers(w){
    let n = 0, iyi = 0;
    (S.cards || []).forEach(c => {
      (c.history || []).forEach(h => {
        if(!inWin(h.at, w)) return;
        n++;
        if(h.grade === 'good' || h.grade === 'easy') iyi++;
      });
    });
    return { n, rate:n ? iyi / n : null };
  }

  function countIn(list, w, dateField, pred){
    return (list || []).filter(x => inWin(x[dateField], w) && (!pred || pred(x))).length;
  }

  /* Diksiyon: pencerede okunan kelime başına hata. Kayıt kayıt ortalama
     ALINMAZ — üç kelimelik bir kayıt, üç yüz kelimelik bir kayıtla aynı
     ağırlığı taşımamalı. Toplam hata / toplam kelime doğru olandır. */
  function dictionError(w){
    let hata = 0, kelime = 0;
    (S.recordings || []).forEach(x => {
      if(!inWin(x.date, w)) return;
      const h = Number(x.errors), k = Number(x.words);
      if(!isFinite(h) || !isFinite(k) || !(k > 0)) return;
      hata += h; kelime += k;
    });
    return kelime >= 100 ? hata / kelime : null;
  }

  /* Müzik: pencerede yapılan denemelerin kaçı temiz kapandı. */
  function cleanRate(w){
    let n = 0, temiz = 0;
    (S.pieces || []).forEach(p => {
      (p.attempts || []).forEach(a => {
        if(!inWin(a.date, w)) return;
        n++; if(a.clean) temiz++;
      });
    });
    return n >= 10 ? temiz / n : null;
  }

  /* -------------------------------------------------------------- çiftler

     `effort`  çabayı temsil eden sayı — hep dakika ya da tekrar sayısı
     `outcome` sonucu temsil eden sayı — üretim, isabet ya da temizlik
     `lower`   sonuç DÜŞTÜKÇE mi iyi? (hata oranı gibi)

     Her çift, sonucun çabanın yerine geçemeyeceği bir yerde durur. */
  const PAIRS = [
    { id:'lang-volume-vs-recall', direction:'higher_better', disc:'lang',
      effortLabel:'çalışma dakikası', outcomeLabel:'ilk denemede hatırlama',
      question:'Kart sayısını mı artırdın, yoksa aynı kartları mı '
             + 'tekrar ediyorsun?',
      effort:w => minutesIn('lang', w),
      outcome:w => { const a = cardAnswers(w); return a.n >= 20 ? a.rate : null; } },

    { id:'lang-reps-vs-recall', direction:'higher_better', disc:'lang',
      effortLabel:'kart tekrarı', outcomeLabel:'ilk denemede hatırlama',
      question:'Kart destesi çok mu büyük, yoksa kartlar çok mu uzun?',
      effort:w => cardAnswers(w).n,
      outcome:w => { const a = cardAnswers(w); return a.n >= 20 ? a.rate : null; },
      minEffort:40 },

    { id:'reading-minutes-vs-notes', direction:'higher_better', disc:'reading',
      effortLabel:'okuma dakikası', outcomeLabel:'çıkan not',
      question:'Okuduğun metin not almaya değmiyor mu, yoksa okuma '
             + 'pasifleşti mi?',
      effort:w => minutesIn('reading', w),
      outcome:w => countIn(S.notes, w, 'createdAt') },

    { id:'reading-notes-vs-links', direction:'higher_better', disc:'reading',
      effortLabel:'not sayısı', outcomeLabel:'not başına bağ',
      question:'Bağlanmayan not ikinci kez okunmaz; notları bağlamayı '
             + 'mı erteliyorsun, yoksa bağlanacak bir şey mi çıkmıyor?',
      effort:w => countIn(S.notes, w, 'createdAt'),
      outcome:w => {
        const n = (S.notes || []).filter(x => inWin(x.createdAt, w));
        if(n.length < 5) return null;
        return n.reduce((a, x) => a + ((x.links || []).length), 0) / n.length;
      },
      minEffort:5 },

    { id:'writing-minutes-vs-drafts', direction:'higher_better', disc:'writing',
      effortLabel:'yazı dakikası', outcomeLabel:'elden geçen taslak',
      question:'Yazmak ile yazıyı düzenlemek aynı iş değil — süre '
             + 'hangisine gidiyor?',
      effort:w => minutesIn('writing', w),
      outcome:w => countIn(S.drafts, w, 'updatedAt') },

    { id:'philo-minutes-vs-closed', direction:'higher_better', disc:'philo',
      effortLabel:'felsefe dakikası', outcomeLabel:'kapanan argüman',
      question:'Açık kalan argüman bir düşünce değil bir niyettir; '
             + 'hangisi kapanmaya en yakın?',
      effort:w => minutesIn('philo', w),
      outcome:w => countIn(S.args, w, 'updatedAt', a => a.status === 'closed') },


    { id:'music-minutes-vs-clean', direction:'higher_better', disc:'music',
      effortLabel:'gitar dakikası', outcomeLabel:'temiz deneme oranı',
      question:'Tempoyu erken mi açtın? Plato kontrolüne bakmak ister misin?',
      effort:w => minutesIn('music', w),
      outcome:w => cleanRate(w) },

    { id:'diction-minutes-vs-error', direction:'lower_better', disc:'diction',
      effortLabel:'diksiyon dakikası', outcomeLabel:'hata oranı',
      question:'Kaydı dinleyip hataları işaretliyor musun, yoksa aynı '
             + 'tekrarı mı sürdürüyorsun?',
      effort:w => minutesIn('diction', w),
      outcome:w => dictionError(w) },

    { id:'history-minutes-vs-events', direction:'higher_better', disc:'history',
      effortLabel:'tarih dakikası', outcomeLabel:'yerleştirilen olay',
      question:'Yerleştirilmeyen olay hatırlanmaz; okuduklarını '
             + 'kronolojiye taşımayı mı erteliyorsun?',
      effort:w => minutesIn('history', w),
      outcome:w => countIn(S.events, w, 'createdAt') },
  ];

  /* ------------------------------------------------------------ ölçüm */

  function oran(yeni, eski){
    if(eski == null || yeni == null) return null;
    if(eski === 0) return yeni > 0 ? Infinity : 0;
    return (yeni - eski) / Math.abs(eski);
  }

  /* Tek bir çiftin durumu.

     'decoupled'  çaba arttı, sonuç yerinde saydı ya da düştü
     'aligned'    ikisi de arttı ya da ikisi de düştü
     'idle'       çaba artmadı — nöbetçinin işi değil
     'unknown'    iki taraftan biri ölçülmedi */
  function pair(def){
    const w = windows();
    const eC = def.effort(w.prev), yC = def.effort(w.now);
    const eS = def.outcome(w.prev), yS = def.outcome(w.now);

    const base = { id:def.id, disc:def.disc,
      effortLabel:def.effortLabel, outcomeLabel:def.outcomeLabel,
      effort:{ prev:eC, now:yC }, outcome:{ prev:eS, now:yS },
      question:def.question };

    const asgari = def.minEffort != null ? def.minEffort : ASGARI_CABA;
    if(eS == null || yS == null){
      return Object.assign(base, { status:'unknown', cert:'missing',
        note:'Sonuç tarafında iki pencerenin birinde ölçüm yok. '
           + 'Ölçülmemiş sonuç, sıfır sonuç değildir.' });
    }
    if(!(yC >= asgari)){
      return Object.assign(base, { status:'idle', cert:'measured',
        note:'Bu pencerede hacim değerlendirmeye yetmiyor (' + yC + ' < ' + asgari + ').' });
    }

    const dC = oran(yC, eC);
    const dS = oran(yS, eS);

    /* Yön olmadan «sonuç iyileşti mi» sorusu cevaplanamaz. Tanımsız bir
       çift sessizce «yükselmesi iyi» SAYILMAZ — bu bir varsayım olurdu. */
    const yon = DIRECTIONS[def.direction || ''];
    if(!yon){
      return Object.assign(base, { status:'unknown', cert:'missing',
        note:'Bu çiftin yön tanımı yok; sonucun hangi yönde iyi olduğu '
           + 'bilinmeden ayrışma değerlendirilemez.' });
    }
    const sonucIyilesme = yon.improvement(dS);

    if(dC == null || dC < CABA_ARTIS){
      return Object.assign(base, { status:'idle', cert:'measured',
        effortChange:dC, outcomeChange:sonucIyilesme,
        note:'Çaba belirgin biçimde artmamış; nöbetçi burada bir şey aramaz.' });
    }
    if(sonucIyilesme != null && sonucIyilesme > SONUC_DURGUN){
      return Object.assign(base, { status:'aligned', cert:'measured',
        direction:yon.id, effortChange:dC, outcomeChange:sonucIyilesme,
        note:yon.id === 'movement_only'
          ? 'Çaba arttı, sonuç da hareket etti. Hareketin YÖNÜ bu sistemin '
            + 'bileceği bir şey değil.'
          : 'Çaba da sonuç da doğru yönde arttı. Gösterge hâlâ bir şeyi '
            + 'temsil ediyor.' });
    }
    return Object.assign(base, { status:'decoupled', cert:'measured',
      direction:yon.id,
      regressed:sonucIyilesme != null && sonucIyilesme < -SONUC_DURGUN,
      effortChange:dC, outcomeChange:sonucIyilesme,
      note:def.effortLabel + ' %' + Math.round(dC * 100) + ' arttı, '
         + def.outcomeLabel + ' ' + (sonucIyilesme == null ? 'ölçülemedi'
            : (sonucIyilesme >= 0 ? '%' + Math.round(sonucIyilesme * 100) + ' değişti'
               : '%' + Math.round(Math.abs(sonucIyilesme) * 100) + ' geriledi')) + '.' });
  }

  /* Açık bölümlerin çiftleri. Kapalı bölüm hakkında hüküm kurulmaz. */
  function scan(){
    return PAIRS
      .filter(p => !ESP.Mod || ESP.Mod.isOn(p.disc))
      .map(pair);
  }

  function flags(){ return scan().filter(p => p.status === 'decoupled'); }

  /* Ekrana çıkacak tek cümle. Bayrak yoksa sessizdir — nöbetçinin
     konuşmadığı gün, iyi gündür. */
  function brief(){
    const f = flags();
    if(!f.length) return null;
    const ilk = f[0];
    return {
      count:f.length,
      title:f.length === 1 ? 'Bir gösterge ayrışmış' : f.length + ' gösterge ayrışmış',
      body:ilk.note + ' ' + ilk.question,
      flags:f,
    };
  }

  function policy(){ return POLICY; }

  return { PAIRS, windows, pair, scan, flags, brief, policy, DIRECTIONS,
    PENCERE, CABA_ARTIS, SONUC_DURGUN, ASGARI_CABA };
})();
