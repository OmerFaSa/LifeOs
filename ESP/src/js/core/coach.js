/* Koç motoru — reçete yazar, tavsiye vermez.

   Aradaki fark şudur: tavsiye «dil çalışmalısın» der ve kullanıcıyı aynı
   kararla baş başa bırakır. Reçete «on kartı bağlam cümlesiyle karta çevir,
   on dakika» der ve karar vermeyi bitirir.

   Reçetenin üç kuralı:

   1. HER EGZERSİZ BİR KAPIYA BAĞLIDIR. Koç rastgele seçmez; merdivende
      açık olan kapıya (ESP.Curriculum.nextGate) bakar ve o kapıyı
      ilerleten egzersizi verir. Hiçbir kapıyı ilerletmeyen çalışma, iyi
      hissettirir ve hiçbir yere götürmez.

   2. SÜRE UYDURULMAZ. Reçetenin toplamı, profildeki günlük tabandan
      taşmaz. Taşan bir reçete okunmaz; okunmayan reçete yoktur.

   3. KADEME ATLATMAZ. Isınma ve asıl iş kullanıcının bulunduğu kademeden,
      zorlanma egzersizi yalnızca BİR üst kademeden gelir. İki üst kademe
      bir egzersiz değil bir hayal kırıklığıdır.

   Koç bir ajan DEĞİLDİR: model çağırmaz, cümle üretmez. Mnemosyne masası
   bu motorun çıktısını okur — tersi değil. */

window.ESP = window.ESP || {};

ESP.Coach = (function(){
  const U = ESP.U, S = ESP.S;

  const SHAPE = function(){ return ESP.PRESCRIPTION_SHAPE || []; };

  function dailyBase(){
    const n = (S.profile && S.profile.dailyMinutes) || 60;
    return (typeof n === 'number' && isFinite(n) && n > 0) ? n : 60;
  }

  /* SURE ve DUZEN kapilari her egzersizle ilerler ve bunu tek tek etiketle
     yazmak yanlis olurdu: "30 gunde 600 dakika" kapisini ilerleten sey
     belirli bir egzersiz degil, o disiplinde gecirilen HERHANGI bir
     dakikadir. Katalogda her satira 'lang.minutes30' yazmak, hedef alanini
     anlamsizlastirirdi. */
  const SURE_KAPILARI = /\.(minutes30|days14|streakDays)$/;

  /* Bir egzersizin bugunku kapiyi ilerletip ilerletmedigi. */
  function hits(drill, metric){
    if(!metric) return false;
    if(SURE_KAPILARI.test(metric)){
      return metric.indexOf(drill.disc + '.') === 0;
    }
    return (drill.targets || []).indexOf(metric) >= 0;
  }

  /* Gunun icinde kararli ama gunden gune degisen secim. Rastgele secim iki
     sorun uretirdi: ayni ekran iki kez cizildiginde recete degisirdi ve
     kullanici "yenile"ye basip hosuna gideni secerdi. Gunun tarihi tohumdur. */
  function rota(list, seedStr){
    if(!list.length) return null;
    let h = 0;
    const s = String(seedStr || '');
    for(let i = 0; i < s.length; i++){ h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
    return list[Math.abs(h) % list.length];
  }

  /* --------------------------------------------------------------- reçete */

  function prescribe(discId, opts){
    const o = opts || {};
    const bugun = o.today || U.todayISO();
    const d = ESP.DISCIPLINE_BY_ID[discId];
    if(!d) return null;

    const lv = ESP.Curriculum.levelOf(discId);
    const kapi = ESP.Curriculum.nextGate(discId);
    const metric = kapi ? kapi.gate.gate.metric : null;
    /* Kademe 0 da bir kademedir: oradaki kullanici birinci kademenin
       egzersizlerini yapar. Hicbir egzersiz vermemek, "once bir seviye
       kazan" demek olurdu ki bu bir kisir dongudur. */
    const rank = Math.max(1, lv ? lv.rank : 1);
    const havuz = ESP.DRILLS_OF(discId);

    const butce = o.minutes || dailyBase();
    const secilen = [];
    let toplam = 0;

    SHAPE().forEach(function(bolum){
      const uygun = havuz.filter(function(x){
        if(x.kind !== bolum.kind) return false;
        if(bolum.kind === 'stretch') return x.level === rank + 1;
        return x.level <= rank;
      });
      if(!uygun.length) return;

      /* Asil iste once kapiyi ilerletenler gelir; hicbiri yoksa kademedeki
         en yuksek egzersiz. */
      const hedefli = uygun.filter(function(x){ return hits(x, metric); });
      const sira = (hedefli.length ? hedefli : uygun).slice()
        .sort(function(a, b){ return b.level - a.level; });

      const kac = Math.min(bolum.max, sira.length);
      for(let i = 0; i < kac; i++){
        const aday = i === 0 ? (rota(sira.slice(0, Math.min(3, sira.length)), bugun + discId + bolum.kind) || sira[0])
          : sira.filter(function(x){ return !secilen.some(function(y){ return y.drill.id === x.id; }); })[0];
        if(!aday) break;
        if(secilen.some(function(y){ return y.drill.id === aday.id; })) continue;
        if(toplam + aday.minutes > butce && secilen.length) break;
        secilen.push({ drill:aday, kind:bolum.kind, label:bolum.label, note:bolum.note });
        toplam += aday.minutes;
      }
    });

    return {
      disc:discId, label:d.label, route:d.route, agent:d.agent,
      rank:rank, level:lv ? lv.level : ESP.LEVEL_BY_RANK[0],
      cert:lv ? lv.cert : 'missing',
      gate:kapi, metric:metric,
      items:secilen, minutes:toplam, budget:butce,
      why:kapi
        ? (kapi.action === 'measure'
            ? 'Sıradaki kapı ölçülemiyor: «' + kapi.gate.label + '». '
              + 'Bu reçete o ölçümü üretir.'
            : 'Sıradaki kapı: «' + kapi.gate.label + '». Reçete oraya çalışıyor.')
        : 'Bu merdivenin bütün kapıları geçilmiş görünüyor; reçete korumaya çalışıyor.',
      done:doneToday(discId, bugun),
    };
  }

  /* Bugun bu disiplinde hangi egzersizler islendi.

     Kaynak gun kayitlaridir: bir egzersiz "yapildi" sayilmasi icin bir
     OTURUM olarak girilmis olmali. Ayri bir "tamamlandi" bayragi tutmak,
     yapilmamis isi yapilmis gostermenin en kolay yolu olurdu. */
  function doneToday(discId, todayISO){
    const bugun = todayISO || U.todayISO();
    return ESP.Model.sessionsOf(bugun)
      .filter(function(s){ return s.disc === discId && s.ref; })
      .map(function(s){ return s.ref; });
  }

  /* Bir egzersizin gecmisi: kac kez, en son ne zaman. */
  function historyOf(drillId, days){
    const n = days || 90;
    const gunler = U.lastDays(n);
    let kez = 0, son = null, dakika = 0;
    gunler.forEach(function(g){
      ESP.Model.sessionsOf(g).forEach(function(s){
        if(s.ref !== drillId) return;
        kez++;
        son = g;
        if(s.minutes != null) dakika += s.minutes;
      });
    });
    return { drillId:drillId, times:kez, lastDate:son, minutes:dakika,
      cert:kez ? 'measured' : 'missing', windowDays:n };
  }

  /* Bir egzersizi yapildi olarak isler. Sure verilmezse egzersizin kendi
     suresi kullanilir ama etiket yine 'measured' olur — cunku kullanici
     "yaptim" demistir; tahmin edilen sey sure degil, suresinin standarda
     uydugudur. Kullanici degistirebilir. */
  async function logDrill(drillId, opts){
    const o = opts || {};
    const d = ESP.DRILL_BY_ID[drillId];
    if(!d) return { ok:false, error:'Bilinmeyen egzersiz.' };
    const gun = o.date || U.todayISO();
    const dakika = o.minutes != null ? o.minutes : d.minutes;
    const s = await ESP.Model.addSession(gun, {
      disc:d.disc, minutes:dakika, ref:d.id,
      note:o.note || d.label,
    });
    ESP.Memo.bitir();
    return { ok:true, session:s };
  }

  /* ----------------------------------------------------------- günün planı

     Hangi disiplinlerin bugun calisilacagi PLANLAYICIDAN gelir; koç yalnizca
     o disiplinlere recete yazar. Iki motorun isi ayridir: planlayici SIRAYI
     bilir, koç ICERIGI. */
  function plan(todayISO){
    const bugun = todayISO || U.todayISO();
    const next = ESP.Planner.nextAction(bugun);
    const rota_ = ESP.Planner.weeklyRoute(bugun);
    const taban = dailyBase();

    /* Ilk disiplin siradaki isten, ikincisi haftalik rotanin en ustunden.
       Ucuncu bir disiplin EKLENMEZ: gunde uc alan acmak, hicbirini
       kapatmamanin en kibar yoludur. */
    const idler = [];
    if(next && next.disc) idler.push(next.disc);
    (rota_.rows || []).forEach(function(r){
      if(idler.length < 2 && idler.indexOf(r.disc.id) < 0) idler.push(r.disc.id);
    });

    /* Butce boluşur ama her disipline en az on dakika kalir; on dakikanin
       altinda bir recete yazilamaz. */
    const pay = Math.max(10, Math.floor(taban / Math.max(1, idler.length)));
    const receteler = idler.map(function(id){
      return prescribe(id, { minutes:pay, today:bugun });
    }).filter(Boolean);

    return {
      date:bugun,
      budget:taban,
      minutes:receteler.reduce(function(a, r){ return a + r.minutes; }, 0),
      prescriptions:receteler,
      next:next,
      minimum:ESP.MINIMUM_DAY,
    };
  }

  /* Asgari gun: kotu gunun alt siniri. Recete degil SIGINAKTIR — reçeteyi
     yapamayan kisi burayi yapar ve zincir kopmaz. */
  function minimumDay(todayISO){
    const bugun = todayISO || U.todayISO();
    const due = ESP.SRS.dueCards(bugun);
    return {
      cards:due.length,
      read:ESP.MINIMUM_DAY.read,
      practice:ESP.MINIMUM_DAY.practice,
      note:ESP.MINIMUM_DAY.note,
      metToday:ESP.Model.dayHasEntry(ESP.Model.dayOf(bugun)),
    };
  }

  /* Koçun tek cümlesi — model kapaliyken de konusan dil. */
  function sentence(discId){
    const r = prescribe(discId);
    if(!r) return '';
    if(!r.items.length){
      return r.label + ' için bu kademede tanımlı egzersiz yok.';
    }
    return r.label + ' · ' + r.level.label + ': ' + r.items.length + ' egzersiz, '
      + r.minutes + ' dakika. ' + r.why;
  }

  return { prescribe, plan, logDrill, doneToday, historyOf, minimumDay, sentence,
    dailyBase, advances:hits };
})();
