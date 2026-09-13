/* Mufredat motoru — kademeyi OLCUMDEN uretir, kullanicidan sormaz.

   data/curriculum.js merdiveni tanimlar; bu dosya merdivenin kapilarini
   gercek veriyle karsilastirir. Iki katmanin ayri durmasi kasitlidir:
   esikler bir VERIDIR ve degismesi kod degisikligi gerektirmemelidir.

   Uc kavram:

     OLCU (metric)   kural motorunun urettigi tek sayi, kesinlik etiketiyle.
     KAPI  (gate)    bir olcunun bir esigi gecip gecmedigi.
     KADEME (level)  butun kapilari gecilmis en yuksek basamak.

   Kademe hesabi MERDIVENDIR, puan degil: 3. kademenin kapilarini gecmis
   ama 2. kademede bir kapiyi atlamis biri 2. kademededir. Sebep pedagojik:
   atlanan kapi ileride her zaman geri gelir ve ustune kurulan her sey
   cover. Sistem bunu simdi soyler, alti ay sonra degil.

   En onemli kural: OLCULEMEYEN KAPI GECILMIS SAYILMAZ AMA KALINMIS DA
   SAYILMAZ. Degeri `missing` olan kapi ucuncu bir durumdur ('unknown') ve
   kullaniciya "once bunu olc" der. `Number(x) || 0` yazmak burada butun
   merdiveni yalan yapardi. */

window.ESP = window.ESP || {};

ESP.Curriculum = (function(){
  const U = ESP.U, S = ESP.S;

  const MISSING = { value:null, cert:'missing' };
  function m(value, cert){ return { value:value, cert:cert || 'measured' }; }

  function days(n){ return U.lastDays(n); }

  /* Bir disiplinin son N gunde toplam dakikasi. Hic gun girilmemisse
     'missing' doner — sifir degil. */
  function minutes(discId, n){
    let toplam = 0, girilen = 0;
    days(n).forEach(function(d){
      const v = ESP.Model.minutesOf(d, discId);
      if(v == null) return;
      toplam += v; girilen++;
    });
    return girilen ? m(toplam, 'measured') : MISSING;
  }

  /* Son N gunun kacinda bu disipline dokunuldu. */
  function activeDays(discId, n){
    let girilen = 0, dokunulan = 0;
    days(n).forEach(function(d){
      const gun = ESP.Model.dayOf(d);
      if(!gun || !ESP.Model.dayHasEntry(gun)) return;
      girilen++;
      const v = ESP.Model.minutesOf(d, discId);
      if(v != null && v > 0) dokunulan++;
    });
    return girilen ? m(dokunulan, 'measured') : MISSING;
  }

  function count(list){
    const a = Array.isArray(list) ? list : [];
    return m(a.length, 'measured');
  }

  /* Bos koleksiyon SIFIRDIR, veri yoklugu degil: kullanici hic kart
     eklemediyse "sifir kart" dogru bir olcumdur. Ayrim sudur — bir GUNUN
     dakikasi girilmemis olabilir (veri yok), ama destedeki kart sayisi her
     zaman bilinir. */

  /* ------------------------------------------------------------- olcu kaydi

     Her metrik adi burada bir fonksiyona baglidir. Merdivende gecen ama
     burada karsiligi olmayan bir ad, tests/curriculum.test.js icinde
     hataya duser — sessizce 'veri yok' gorunup kapiyi sonsuza dek acik
     birakmaz. */
  const METRICS = {

    /* -------- dil */
    /* Tarih destesi dil kapisini ACMAZ: iki deste ayni motoru paylasir ama
       ayri seyler olcer. Karistirmak, tarih ezberleyerek "C1" gorunmeye
       yol acardi. */
    'lang.cards':       function(){
      return m((S.cards || []).filter(function(c){
        return c.lang !== ESP.HISTORY_DECK; }).length);
    },
    'lang.langs':       function(){
      const l = (S.profile && S.profile.langs) || [];
      return l.length ? m(l.length, 'measured') : MISSING;
    },
    'lang.retention':   function(){
      const r = ESP.SRS.retention((S.profile && S.profile.langs && S.profile.langs[0]) || 'en');
      if(r.cert === 'missing' || r.n < ESP.Planner.RETENTION_MIN_CARDS) return MISSING;
      return m(r.value, r.cert);
    },
    'lang.minutes30':   function(){ return minutes('lang', 30); },
    'lang.days14':      function(){ return activeDays('lang', 14); },
    'lang.streakDays':  function(){
      const s = ESP.Model.streak();
      return m(typeof s === 'number' ? s : (s && s.days) || 0, 'measured');
    },

    /* -------- felsefe */
    'philo.args':       function(){ return count(S.args); },
    'philo.closedArgs': function(){
      return m((S.args || []).filter(function(a){ return a.status === 'closed'; }).length);
    },
    'philo.concepts':   function(){
      const set = {};
      (S.notes || []).forEach(function(n){ (n.concepts || []).forEach(function(c){ set[c] = 1; }); });
      (S.args || []).forEach(function(a){ (a.concepts || []).forEach(function(c){ set[c] = 1; }); });
      return m(Object.keys(set).length);
    },
    'philo.primaryBooks':function(){
      return m((S.books || []).filter(function(b){ return b.kind === 'primary'; }).length);
    },
    'philo.traditions': function(){ return m(traditionsRead().length); },
    'philo.minutes30':  function(){ return minutes('philo', 30); },

    /* -------- muzik */
    'music.pieces':     function(){ return count(S.pieces); },
    'music.cleanBpm':   function(){
      const olculen = (S.pieces || []).map(function(p){ return p.cleanBpm; })
        .filter(function(b){ return typeof b === 'number' && b > 0; });
      if(!olculen.length) return MISSING;          // hic temiz esik olculmedi
      return m(Math.max.apply(null, olculen), 'measured');
    },
    'music.minutes30':  function(){ return minutes('music', 30); },
    /* Plato YOKLUGU bir kapidir: 1 = tikanma yok, 0 = var. */
    'music.noPlateau':  function(){
      if(!(S.pieces || []).length) return MISSING;
      const p = ESP.Acoustic.plateaus();
      return m(p.length ? 0 : 1, 'derived');
    },

    /* -------- diksiyon */
    'diction.recordings':function(){ return count(S.recordings); },
    'diction.minutes30': function(){ return minutes('diction', 30); },
    'diction.wpm':       function(){
      const w = ESP.Acoustic.wpmOf ? ESP.Acoustic.wpmOf() : null;
      if(!w || w.value == null) return MISSING;
      return m(w.value, w.cert || 'derived');
    },
    'diction.errorRate': function(){
      const e = ESP.Acoustic.errorRateOf ? ESP.Acoustic.errorRateOf() : null;
      if(!e || e.value == null) return MISSING;
      return m(e.value, e.cert || 'estimated');
    },

    /* -------- okuma */
    'reading.notes':    function(){ return count(S.notes); },
    'reading.books':    function(){ return count(S.books); },
    'reading.authors':  function(){
      const set = {};
      (S.books || []).forEach(function(b){
        const a = U.norm(b.author || '');
        if(a) set[a] = 1;
      });
      return m(Object.keys(set).length);
    },
    'reading.linkedRatio':function(){
      const n = (S.notes || []).length;
      if(!n) return MISSING;
      const bagli = S.notes.filter(function(x){ return (x.links || []).length > 0; }).length;
      return m(bagli / n, 'derived');
    },
    'reading.syntopic': function(){
      const s = ESP.Intellect.syntopic();
      return s.value == null ? MISSING : m(s.value, s.cert);
    },
    'reading.minutes30':function(){ return minutes('reading', 30); },

    /* -------- yazi */
    'writing.drafts':   function(){ return count(S.drafts); },
    'writing.words30':  function(){
      const w = ESP.Intellect.wordsWritten(30);
      return w.value == null ? MISSING : m(w.value, w.cert);
    },
    'writing.revisionRatio':function(){
      const r = ESP.Intellect.draftRatio();
      return r.value == null ? MISSING : m(r.value, r.cert);
    },
    'writing.readability':function(){
      /* En son taslagin degil, taslaklarin ORTALAMASI: tek iyi metin bir
         kademe acmaz. */
      const metinli = (S.drafts || []).filter(function(d){ return (d.text || '').trim(); });
      if(!metinli.length) return MISSING;
      const skorlar = metinli.map(function(d){
        return ESP.Intellect.readability(d.text, d.id + (d.updatedAt || '')).value; })
        .filter(function(x){ return x != null; });
      if(!skorlar.length) return MISSING;
      return m(skorlar.reduce(function(a, b){ return a + b; }, 0) / skorlar.length, 'derived');
    },
    'writing.minutes30':function(){ return minutes('writing', 30); },

    /* -------- tarih */
    'history.events':   function(){ return count(S.events); },
    'history.eras':     function(){
      const set = {};
      (S.events || []).forEach(function(e){ if(e.era) set[e.era] = 1; });
      return m(Object.keys(set).length);
    },
    'history.sources':  function(){ return count(S.sources); },
    'history.primaryRatio':function(){
      const t = (S.sources || []).length;
      if(!t) return MISSING;
      const p = S.sources.filter(function(x){ return x.kind === 'primary'; }).length;
      return m(p / t, 'derived');
    },
    'history.causal':   function(){ return count(S.chains); },
    'history.schools':  function(){
      const set = {};
      (S.sources || []).forEach(function(s){ if(s.school) set[s.school] = 1; });
      (S.chains || []).forEach(function(c){ if(c.school) set[c.school] = 1; });
      return m(Object.keys(set).length);
    },
    'history.retention':function(){
      const r = ESP.SRS.retention('history');
      if(r.cert === 'missing' || r.n < ESP.Planner.RETENTION_MIN_CARDS) return MISSING;
      return m(r.value, r.cert);
    },
    'history.minutes30':function(){ return minutes('history', 30); },
  };

  /* Okunan geleneklerin listesi: kaynagin yazari kanonda geciyorsa
     gelenegi oradan gelir. Kanonda olmayan yazar sayilmaz — uydurmak
     yerine eksik birakmak yeglenir. */
  function traditionsRead(){
    const set = {};
    (S.books || []).forEach(function(b){
      const yazar = U.norm(b.author || '');
      if(!yazar) return;
      (ESP.CANON || []).forEach(function(c){
        if(U.norm(c.author) === yazar && c.tradition) set[c.tradition] = 1;
      });
    });
    return Object.keys(set);
  }

  function metricNames(){ return Object.keys(METRICS); }

  /* Tek bir olcuyu okur. Bilinmeyen ad sessizce 'veri yok' dondurmez:
     bu bir programci hatasidir ve gorunur olmalidir. */
  /* Ayni olcu bir kademe hesabinda BES KEZ sorulur: "lang.cards" merdivenin
     bes basamaginin besinde de bir kapidir ve her basamak onu yeniden
     olcer. Uzerine yedi disiplin binince tek cizimde otuz-kirk kez ayni
     tarama yapiliyordu (olculdu: kademe hesabinin maliyeti 10 ms, bunun
     cogu tekrar).

     Kare onbellegi tekrari kaldirir, hesabi degil. */
  function measure(name){
    return ESP.Memo.of('cur.m:' + name, function(){ return measureRaw(name); });
  }

  function measureRaw(name){
    const fn = METRICS[name];
    if(!fn) return { value:null, cert:'missing', unknown:true, metric:name };
    let r;
    try{ r = fn(); }catch(e){ r = MISSING; }
    return { value:r.value, cert:r.cert, metric:name };
  }

  /* --------------------------------------------------------------- kapilar */

  /* Bir kapinin durumu: 'pass' | 'fail' | 'unknown'.
     Ucuncu durum sistemin durustlugudur. */
  function gateStatus(gate){
    const o = measure(gate.metric);
    if(o.value == null){
      return { gate:gate, status:'unknown', value:null, cert:'missing',
        label:gate.label, why:'Bu kapı için henüz ölçüm yok.' };
    }
    let gecti = true;
    if(gate.min != null && o.value < gate.min) gecti = false;
    if(gate.max != null && o.value > gate.max) gecti = false;
    return { gate:gate, status:gecti ? 'pass' : 'fail', value:o.value, cert:o.cert,
      label:gate.label,
      why:gecti ? null : (gate.max != null
        ? 'Ölçülen ' + fmt(o.value) + ', üst sınır ' + fmt(gate.max) + '.'
        : 'Ölçülen ' + fmt(o.value) + ', eşik ' + fmt(gate.min) + '.') };
  }

  function fmt(n){
    if(n == null) return '—';
    if(n < 1 && n > 0) return '%' + Math.round(n * 100);
    return Math.round(n * 100) / 100 + '';
  }

  function ladder(discId){ return ESP.LADDERS[discId] || null; }

  function stepOf(discId, rank){
    const l = ladder(discId);
    if(!l) return null;
    return l.levels.filter(function(x){ return x.rank === rank; })[0] || null;
  }

  /* Bir basamagin butun kapilari. */
  function stepStatus(discId, rank){
    const step = stepOf(discId, rank);
    if(!step) return null;
    const kapilar = step.gates.map(gateStatus);
    const gecen = kapilar.filter(function(g){ return g.status === 'pass'; }).length;
    const bilinmeyen = kapilar.filter(function(g){ return g.status === 'unknown'; }).length;
    return {
      rank:rank, step:step, gates:kapilar,
      passed:gecen, total:kapilar.length, unknown:bilinmeyen,
      complete:gecen === kapilar.length,
      /* Yuzde ilerleme: bilinmeyen kapi ilerleme SAYILMAZ. */
      pct:kapilar.length ? Math.round(100 * gecen / kapilar.length) : 0,
    };
  }

  /* Kademe: butun kapilari gecilmis en yuksek ARDISIK basamak.

     Ardisiklik sarti onemlidir — 1. kademeyi atlayip 3'u gecmek diye bir
     sey yoktur; atlanan kapi ileride cokme uretir. */
  /* Kademe hesabi UCUZ DEGILDIR: her basamagin her kapisi icin bir olcu
     okunur ve bazi olculer (retansiyon, sentopik katsayi) butun desteyi
     dolasir. Tek bir cizimde levelOf() on kez cagriliyor — koc kutusu,
     tezgah haritasi, merdiven kartlari, ofis brifingi ve Patron ozeti ayni
     sayiyi ayri ayri istiyor.

     Kare onbellegi (core/memo.js) tam bu sorun icin var ve siniri nettir:
     yalnizca bir cizim boyunca yasar, kare disinda hicbir sey saklamaz.
     Boylece "durum degisti mi?" sorusu hic sorulmaz — veri kare icinde
     degismez. */
  function levelOf(discId){
    return ESP.Memo.of('cur.level:' + discId, function(){ return levelOfRaw(discId); });
  }

  function levelOfRaw(discId){
    const l = ladder(discId);
    if(!l) return null;
    const basamaklar = l.levels.map(function(x){ return stepStatus(discId, x.rank); });
    let rank = 0, engel = null;
    for(let i = 0; i < basamaklar.length; i++){
      if(basamaklar[i].complete){ rank = basamaklar[i].rank; continue; }
      engel = basamaklar[i];
      break;
    }
    const seviye = ESP.LEVEL_BY_RANK[rank];
    /* Kademenin kendisi bir OLCUMDUR ve kesinligi vardir:

         rank 0    'veri yok'  — «Temas» kademesinin tanimi zaten budur:
                   henuz olculmus uretim yok. Sifirinci basamagi 'hesaplandi'
                   diye etiketlemek, olculmemis bir seyi olculmus gostermek olur.
         unknown   'tahmin'    — bir ust basamakta olculemeyen kapi var;
                   kademe dogru olabilir ama kanitlanmis degil.
         digeri    'hesaplandi' */
    const cert = rank === 0 ? 'missing'
      : (engel && engel.unknown ? 'estimated' : 'derived');
    return {
      disc:discId, rank:rank, level:seviye, cert:cert,
      next:engel, steps:basamaklar, ladder:l,
      /* Merdivenin tamaminda nerede duruyor (0-100). */
      mastery:masteryPct(basamaklar),
    };
  }

  /* Ustatlik yuzdesi: gecilmis basamaklar tam, icinde bulunulan basamak
     kismi sayilir. Bes basamak esit agirliktadir — ustteki basamaklar
     daha zordur ama yuzdeyi egmek ilerlemeyi anlasilmaz yapar. */
  function masteryPct(basamaklar){
    const n = basamaklar.length;
    if(!n) return 0;
    let toplam = 0;
    for(let i = 0; i < n; i++){
      if(basamaklar[i].complete){ toplam += 1; continue; }
      toplam += basamaklar[i].pct / 100;
      break;
    }
    return Math.round(100 * toplam / n);
  }

  /* ACIK disiplinlerin kademesi — analiz ekrani ve Patron brifingi icin.

     Kapali bir disiplinin merdiveni durur ama ortalamaya girmez: gitara hic
     dokunmayacagini soylemis birinin "ustatlik yuzdesi"ni muzikten dolayi
     dusurmek, olculmemis bir seyi olcmek olurdu. */
  function all(){
    return ESP.Memo.of('cur.all', function(){
      return ESP.Mod.active().map(function(d){ return levelOf(d.id); }).filter(Boolean);
    });
  }

  /* Sistemin genel kademesi: disiplinlerin ORTALAMASI degil, EN DUSUGU ile
     ortalamanin arasi. Sebep: her seyi ihmal edip tek disiplinde ustat olan
     biri "ustat" degildir; ama tek zayif disiplin de butun emegi silmez. */
  function overall(){
    return ESP.Memo.of('cur.overall', function(){ return overallRaw(); });
  }

  function overallRaw(){
    const hepsi = all().filter(Boolean);
    if(!hepsi.length) return { rank:0, level:ESP.LEVEL_BY_RANK[0], cert:'missing' };
    const ranks = hepsi.map(function(x){ return x.rank; });
    const ort = ranks.reduce(function(a, b){ return a + b; }, 0) / ranks.length;
    const min = Math.min.apply(null, ranks);
    const rank = Math.floor((ort + min) / 2);
    const olculen = hepsi.filter(function(x){ return x.cert !== 'missing'; }).length;
    return {
      rank:rank, level:ESP.LEVEL_BY_RANK[rank],
      cert:olculen ? 'derived' : 'missing',
      measuredDisciplines:olculen, disciplines:hepsi.length,
      mastery:Math.round(hepsi.reduce(function(a, x){ return a + x.mastery; }, 0) / hepsi.length),
    };
  }

  /* Siradaki kapi — "ne yapayim" sorusunun mufredat cevabi.

     Once OLCULEBILIR ve eksik olan kapi gelir; hicbiri yoksa olculemeyen
     kapi gelir ve istenen sey "calis" degil "olc"tur. */
  function nextGate(discId){
    return ESP.Memo.of('cur.gate:' + discId, function(){ return nextGateRaw(discId); });
  }

  function nextGateRaw(discId){
    const lv = levelOf(discId);
    if(!lv || !lv.next) return null;
    const eksik = lv.next.gates.filter(function(g){ return g.status === 'fail'; });
    const bilinmeyen = lv.next.gates.filter(function(g){ return g.status === 'unknown'; });
    /* OLCULEMEYEN KAPI ONCE GELIR. Bunun sebebi bir tercih degil bir mantik:
       olculmemis bir kapi varken calismaya devam etmek, kapinin acilip
       acilmadigini asla ogretmez. Ustelik bu sistemde "olcmek" cogu zaman
       isin kendisidir — retansiyonu olcmek kart cevaplamak, temiz BPM'i
       olcmek metronomla calmaktir. Once olc demek, once calis demenin
       durust halidir. */
    const hedef = bilinmeyen[0] || eksik[0];
    if(!hedef) return null;
    return {
      disc:discId, rank:lv.next.rank, step:lv.next.step, gate:hedef,
      action:hedef.status === 'unknown' ? 'measure' : 'work',
      title:hedef.status === 'unknown'
        ? hedef.label + ' — önce bunu ölç'
        : hedef.label,
      why:hedef.why || 'Bu kapı için henüz ölçüm yok.',
    };
  }

  /* Yol haritasi: bulundugun yerden tepeye kadar ne kaldigi.
     Yalnizca listeler — sure TAHMIN ETMEZ. "Uc ayda ustat olursun" cumlesi
     ESP.PEDAGOGIC.never icindeki garanti yasagina girer. */
  function roadmap(discId){
    const lv = levelOf(discId);
    if(!lv) return null;
    return {
      disc:discId, current:lv.rank, mastery:lv.mastery,
      steps:lv.steps.map(function(s){
        return {
          rank:s.rank, title:s.step.title, study:s.step.study, proof:s.step.proof,
          state:s.rank <= lv.rank ? 'done' : (s.rank === lv.rank + 1 ? 'current' : 'ahead'),
          pct:s.pct, gates:s.gates, unknown:s.unknown,
        };
      }),
    };
  }

  /* --------------------------------------------------- seviye tespit sinavi

     Cevaplar bir kademe VERMEZ, bir TAHMIN uretir. Tahmin hicbir kapiyi
     acmaz; yalnizca ekranda "buradan baslayabilirsin" der ve etiketi
     daima 'tahmin'dir. Olculmus kademe tahmini her zaman yener. */
  function placement(answers){
    const a = answers || {};
    const toplam = ESP.PLACEMENT.questions.reduce(function(sum, q){
      const v = Number(a[q.id]);
      return sum + (isFinite(v) ? v : 0);
    }, 0);
    /* Uc sorunun toplami en fazla 11; besi asmayan bir kademeye esleriz. */
    const rank = Math.max(0, Math.min(5, Math.round(toplam / 2.2)));
    return {
      rank:rank, level:ESP.LEVEL_BY_RANK[rank], cert:'estimated',
      note:ESP.PLACEMENT.note,
      answered:ESP.PLACEMENT.questions.filter(function(q){ return a[q.id] != null; }).length,
      total:ESP.PLACEMENT.questions.length,
    };
  }

  /* Kademeyi CUMLEYE cevirir — ESP.PEDAGOGIC.level bicimiyle.
     Ajanlar bu cumleyi oldugu gibi kullanir; kendileri kademe yazmaz. */
  function sentence(discId){
    const lv = levelOf(discId);
    const d = ESP.DISCIPLINE_BY_ID[discId];
    if(!lv || !d) return '';
    if(lv.rank === 0){
      return d.label + ': henüz ölçülmüş üretim yok. Kademe kişiye değil '
        + 'üretime verilir; ilk ölçüm girildiğinde merdiven başlar.';
    }
    return d.label + ': son 30 günün ölçülmüş üretimi «' + lv.level.label
      + '» kapılarını karşılıyor'
      + (lv.cert === 'estimated' ? ' (bir üst basamakta ölçülmemiş kapı var)' : '')
      + '. Bu bir sınav sonucu değildir.';
  }

  return {
    METRICS, metricNames, measure,
    gateStatus, stepOf, stepStatus,
    levelOf, all, overall, masteryPct,
    nextGate, roadmap, placement, sentence,
    ladder, traditionsRead,
  };
})();
