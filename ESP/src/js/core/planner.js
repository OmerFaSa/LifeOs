/* Planlayici — siradaki tek is, haftalik rota ve capraz bulgular.

   Patron'un karari BURADAN gelir. Ajan kararı degistiremez, yalnizca
   gerekcelendirir: toplanti kapanisinda yazilan eylem daima
   ESP.Planner.nextAction()'in dondugu eylemdir. Model "bunun yerine sunu
   yap" derse tutanaktaki eylem yine kural motorununkidir.

   Sira ESP.PRECEDENCE ile AYNIDIR ve tartisilmaz:

     1  Tikanmis temel      (retansiyon dusuk ya da teknik platoda)
     2  Zamana bagli hedef  (yaklasan sunum, konser, sinav)
     3  Vadesi gecmis SRS   (unutma egrisi beklemez)
     4  Sentopik sentez     (derinlik hacimden sonra gelir)
     5  Yeni icerik         (temel saglamken genisleme)

   Sinirli olan kaynak ZAMANDIR, dogruluk degil. Bu yuzden sira "hangisi
   daha dogru" degil "hangisi beklerse otekileri cokertir" sorusuna gore
   dizilir. */

window.ESP = window.ESP || {};

ESP.Planner = (function(){
  const U = ESP.U;
  const S = ESP.S;

  const RETENTION_FLOOR = 0.50;      // altina inerse "tikanmis temel"

  /* Retansiyon tabani ancak YETERI KADAR olcumle tetiklenir.

     Tek bir gecikmis kart ortalamayi %7'ye dusurur ve sistem "temel
     tikandi" der — oysa soylenebilecek tek sey "bir kart gecikti"dir.
     SPI'nin "egilim icin en az uc olcum" kuralinin buradaki karsiligi:
     bes karttan az olculmusse taban KARAR VERMEZ, vadesi gecmis kart
     kurali (sira 3) devreye girer ve zaten dogru isi soyler. */
  const RETENTION_MIN_CARDS = 5;
  const DEADLINE_DAYS = 14;          // bu kadar gun kalan hedef acil sayilir
  const BALANCE_WINDOW = 7;          // dagilim bu pencerede olculur

  /* ---------------------------------------------------------- 1 · tikanma */

  /* Temeli tikayan iki sey: retansiyonun tabanin altina inmesi ve bir
     teknigin platoya girmesi. Ikisi de "yeni icerik eklemeden once
     kapanmali" sinifindadir. */
  function blockedCore(todayISO){
    const out = [];

    const r = ESP.SRS.retention(null, todayISO);
    if(r.cert !== 'missing' && r.n >= RETENTION_MIN_CARDS && r.value < RETENTION_FLOOR){
      out.push({
        id:'retention', disc:'lang', agent:'polyglot',
        label:'Retansiyon tabanın altında',
        detail:'Kartların hatırlanma olasılığı ortalaması %' + Math.round(r.value * 100)
             + ' (' + r.n + ' karttan hesaplandı; taban için en az '
             + RETENTION_MIN_CARDS + ' ölçüm gerekir). Yeni kelime eklemek bu '
             + 'tabanı daha da düşürür.',
        route:'lang', tab:'calis',
        metric:{ value:r.value, cert:r.cert },
      });
    }

    /* Tarih destesi ayri olculur: dil retansiyonu iyiyken tarih kartlari
       cokmus olabilir ve tersi. Iki desteyi tek ortalamada toplamak, coken
       desteyi saglam olanin arkasina gizler. */
    const rh = ESP.SRS.retention(ESP.HISTORY_DECK, todayISO);
    if(rh.cert !== 'missing' && rh.n >= RETENTION_MIN_CARDS && rh.value < RETENTION_FLOOR){
      out.push({
        id:'retention-history', disc:'history', agent:'herodot',
        label:'Tarih kartları tabanın altında',
        detail:'Tarih destesinin hatırlanma olasılığı ortalaması %'
             + Math.round(rh.value * 100) + ' (' + rh.n + ' karttan). '
             + 'Kronolojiye yeni olay eklemek bu tabanı daha da düşürür.',
        route:'history', tab:'calisma',
        metric:{ value:rh.value, cert:rh.cert },
      });
    }

    ESP.Acoustic.plateaus(todayISO).forEach(p => {
      out.push({
        id:'plateau:' + p.piece.id, disc:'music', agent:'maestro',
        label:p.piece.name + ' platoda',
        detail:p.days + ' gündür temiz tempo eşiği ' + p.bpm + ' BPM\'de duruyor. '
             + 'Aynı çalışma aynı sonucu veriyorsa değişmesi gereken çalışmanın kendisi.',
        route:'studio', tab:'muzik', ref:p.piece.id,
        metric:{ value:p.bpm, cert:'measured' },
      });
    });

    return out;
  }

  /* ------------------------------------------------------ 2 · zamana bagli */

  function deadlines(todayISO){
    const today = todayISO || U.todayISO();
    return ESP.Model.openGoals().map(g => {
      const kalan = U.diffDays(today, g.date);
      return { goal:g, daysLeft:kalan, urgent:kalan <= DEADLINE_DAYS };
    });
  }

  /* -------------------------------------------------------- 3 · vadesi gecmis */

  function overdue(todayISO){
    const today = todayISO || U.todayISO();
    const kartlar = ESP.SRS.dueCards(today);
    const geciken = kartlar.filter(c => ESP.SRS.overdueDays(c, today) > 0);
    return { due:kartlar, overdue:geciken,
      maxDays:geciken.reduce((m, c) => Math.max(m, ESP.SRS.overdueDays(c, today)), 0) };
  }

  /* Vadesi gecmis kartlarin hangi desteden geldigi. Iki deste ayni motoru
     paylasir ama ayri ekranda calisilir; "42 kart gecikti" deyip yanlis
     ekrani acmak, dogru sayiyi yanlis ise cevirir. */
  function overdueDeck(todayISO){
    const o = overdue(todayISO);
    const kaynak = o.overdue.length ? o.overdue : o.due;
    const sayac = {};
    kaynak.forEach(c => {
      const deste = c.lang === ESP.HISTORY_DECK ? 'history' : 'lang';
      sayac[deste] = (sayac[deste] || 0) + 1;
    });
    const en = Object.keys(sayac).sort((a, b) => sayac[b] - sayac[a])[0] || 'lang';
    return {
      due:o.due, overdue:o.overdue, maxDays:o.maxDays,
      byDeck:sayac, deck:en,
      route:en === 'history' ? 'history' : 'lang',
      tab:en === 'history' ? 'calisma' : 'calis',
      agent:en === 'history' ? 'herodot' : 'polyglot',
      disc:en === 'history' ? 'history' : 'lang',
    };
  }

  /* ------------------------------------------------------------ 4 · sentez */

  function synthesisGap(){
    const baglanmamis = ESP.Intellect.unlinkedNotes();
    const oneriler = ESP.Intellect.linkSuggestions(3);
    return { unlinked:baglanmamis, suggestions:oneriler };
  }

  /* --------------------------------------------------------- siradaki is

     Tek bir oncelik gosterilir. Ikinci bir "bunu da yapabilirsin" satiri
     eklemek, tek is gosterme fikrinin kendisini bozar: iki secenek bir
     karardir ve karar vermek zaman alir.

     Donus `{ rank, id, title, detail, route, tab, ref, agent, why }`.
     `why` hangi oncelik kuralinin devreye girdigini soyler — kullanici
     sistemin neden bunu sectigini gorebilmeli. */
  /* Kapali bir disiplinin isi siraya girmez. Suzgec nextAction'in EN BASINDA
     durur, her kuralin icinde ayri ayri degil: tek yerde suzulen bir liste,
     yedi yerde unutulabilecek bir kosuldan guvenlidir. */
  function acik(list){
    return (list || []).filter(x => !x.disc || ESP.Mod.isOn(x.disc));
  }

  function nextAction(todayISO){
    const today = todayISO || U.todayISO();

    /* 1 — tikanmis temel */
    const tikanan = acik(blockedCore(today));
    if(tikanan.length){
      const t = tikanan[0];
      return {
        rank:1, id:t.id, agent:t.agent, disc:t.disc,
        title:t.label, detail:t.detail,
        route:t.route, tab:t.tab, ref:t.ref || null,
        why:'Tıkanmış temel: yeni içerik, eskiyi çökertmeden eklenmez.',
      };
    }

    /* 2 — zamana bagli hedef */
    const acil = deadlines(today).filter(d => d.urgent && ESP.Mod.isOn(d.goal.disc))[0];
    if(acil){
      const d = ESP.DISCIPLINE_BY_ID[acil.goal.disc];
      return {
        rank:2, id:'goal:' + acil.goal.id, agent:d ? d.agent : 'patron', disc:acil.goal.disc,
        title:acil.goal.label,
        detail:acil.daysLeft === 0 ? 'Hedef bugün.'
          : acil.daysLeft + ' gün kaldı. ' + (acil.goal.note || ''),
        route:d ? d.route : 'today', tab:null, ref:acil.goal.id,
        why:'Zamana bağlı hedef: dış dünyanın takvimi iç plandan önce gelir.',
      };
    }

    /* 3 — vadesi gecmis kartlar */
    const o = overdueDeck(today);
    if(!ESP.Mod.isOn(o.disc)){
      /* Destesi kapali bir disiplinin karti bekletilmez, gosterilmez de:
         kullanici o desteyi calismayacagini soylemis. */
      o.due = []; o.overdue = [];
    }
    const desteAdi = o.deck === 'history' ? 'tarih' : 'dil';
    if(o.overdue.length){
      return {
        rank:3, id:'srs-overdue', agent:o.agent, disc:o.disc,
        title:o.overdue.length + ' kartın vadesi geçti',
        detail:'En çok geciken kart ' + o.maxDays + ' gündür bekliyor; '
             + 'çoğunluk ' + desteAdi + ' destesinde. '
             + 'Unutma eğrisi beklemez; geciken her gün kartı bir adım geriye atar.',
        route:o.route, tab:o.tab,
        why:'Vadesi geçmiş tekrar: gecikme kartı geriye atar.',
      };
    }
    if(o.due.length){
      return {
        rank:3, id:'srs-due', agent:o.agent, disc:o.disc,
        title:o.due.length + ' kart bugün vadeli',
        detail:'Bugünün tekrarı henüz yapılmadı (' + desteAdi + ' destesi).',
        route:o.route, tab:o.tab,
        why:'Vadesi gelmiş tekrar: günü geçirmeden kapanır.',
      };
    }

    /* 4 — sentopik sentez */
    const sentez = ESP.Mod.isOn('reading') ? synthesisGap() : { unlinked:[], suggestions:[] };
    if(sentez.suggestions.length){
      const s = sentez.suggestions[0];
      return {
        rank:4, id:'link', agent:'aristoteles', disc:'reading',
        title:'İki not aynı kavramda buluşuyor',
        detail:'«' + s.concepts[0] + '» iki ayrı notta geçiyor'
             + (s.cross ? ' ve notlar farklı kaynaklardan.' : '.')
             + ' Bağı kurmak sana düşer; sistem nedenini uyduramaz.',
        route:'library', tab:'matris', ref:s.a.id,
        why:'Sentopik sentez: bağlanmamış not henüz sermaye değildir.',
      };
    }
    if(sentez.unlinked.length >= 3){
      return {
        rank:4, id:'unlinked', agent:'aristoteles', disc:'reading',
        title:sentez.unlinked.length + ' not hiçbir yere bağlı değil',
        detail:'Ortak kavram bulunamadı: notlara kavram etiketi eklemek '
             + 'bağ önerilerini açar.',
        route:'library', tab:'notlar',
        why:'Sentopik sentez: derinlik hacimden sonra gelir.',
      };
    }

    /* 5 — yeni icerik.

       Buraya gelmek iyi haberdir: temel saglam. Hangi disiplinin
       genisleyecegini dagilim belirler — en az dokunulan once gelir. */
    const denge = balance(BALANCE_WINDOW, today);
    const aday = denge.rows.filter(r => r.cert === 'missing')[0] || denge.rows[0];
    if(aday){
      const d = aday.disc;
      /* Genisleme yonu merdivenden gelir: "bir sey calis" degil "su kapiyi
         gec". Kapi olculemiyorsa istenen sey calismak degil OLCMEKTIR. */
      const kapi = ESP.Curriculum ? ESP.Curriculum.nextGate(d.id) : null;
      const taban = aday.cert === 'missing'
        ? 'Son ' + BALANCE_WINDOW + ' günde hiç girilmemiş.'
        : 'Son ' + BALANCE_WINDOW + ' günde ' + U.fmtMin(aday.minutes) + '.';
      return {
        rank:5, id:'expand:' + d.id, agent:d.agent, disc:d.id,
        title:kapi ? (d.label + ' — ' + kapi.title)
          : (d.label + ' bu hafta en az çalışılan alan'),
        detail:taban + ' Temel sağlam; genişleme sırası burada.'
          + (kapi ? ' ' + kapi.why : ''),
        route:d.route, tab:null,
        why:kapi && kapi.action === 'measure'
          ? 'Yeni içerik: bu kapı henüz ölçülmedi, istenen şey çalışmak değil ölçmek.'
          : 'Yeni içerik: temel sağlamken genişleme sistemin asıl amacıdır.',
      };
    }

    return {
      rank:0, id:'none', agent:'patron', disc:null,
      title:'Bugün için bekleyen bir iş yok',
      detail:'Vadesi gelen kart yok, tıkanma yok, açık sentez önerisi yok. '
           + 'Asgari günü yapıp bırakmak da bir seçenektir.',
      route:'today', tab:null,
      why:'Öncelik sırasındaki beş kuralın hiçbiri tetiklenmedi.',
    };
  }

  /* ------------------------------------------------------------- dagilim

     Haftanin pratigi disiplinlere nasil dagilmis? Bir disipline yigilmis
     ve biri hic acilmamissa bu bir bulgudur — ama bir SUCLAMA degildir:
     yogunlasma kasitli olabilir. Ofis yalnizca gorunur kilar. */
  function balance(days, todayISO){
    const n = days || BALANCE_WINDOW;
    const rows = ESP.Mod.active().map(d => {
      const h = ESP.Intellect.hoursOf(d.id, n);
      return { disc:d, minutes:h.minutes, enteredDays:h.enteredDays, cert:h.cert };
    });
    const olculen = rows.filter(r => r.cert !== 'missing');
    const toplam = olculen.reduce((a, r) => a + r.minutes, 0);

    rows.forEach(r => {
      r.share = (toplam && r.cert !== 'missing') ? r.minutes / toplam : null;
    });
    rows.sort((a, b) => {
      if(a.cert === 'missing' && b.cert !== 'missing') return -1;
      if(b.cert === 'missing' && a.cert !== 'missing') return 1;
      return a.minutes - b.minutes;
    });

    const dokunulmayan = rows.filter(r => r.cert === 'missing');
    const enBuyuk = olculen.length
      ? olculen.reduce((m, r) => r.minutes > m.minutes ? r : m, olculen[0]) : null;

    return {
      rows, totalMinutes:toplam, windowDays:n,
      untouched:dokunulmayan.map(r => r.disc),
      /* Dengesizlik: tek bir disiplin toplamin yarisindan fazlasini aliyor
         VE en az bir disiplin hic acilmamis. Tek basina hicbiri bulgu degil. */
      skewed:!!(enBuyuk && toplam && enBuyuk.minutes / toplam > 0.5 && dokunulmayan.length),
      top:enBuyuk ? enBuyuk.disc : null,
      cert:olculen.length ? 'measured' : 'missing',
    };
  }

  /* -------------------------------------------------------- haftalik rota

     Rota bir TAKVIM DEGILDIR: "sali 19:00'da gitar" demek sistemin isi
     degil. Rota, haftanin kalan gunlerine hangi disiplinin dusmesi
     gerektigini soyler ve sirayi oncelik kurallarindan alir.

     Odak (profile.focus) yalnizca ESIT skorlu iki is arasinda sirayi
     belirler; olculmus bir ihtiyaci ezmez. */
  function weeklyRoute(todayISO){
    const today = todayISO || U.todayISO();
    const denge = balance(BALANCE_WINDOW, today);
    const odak = (S.profile && S.profile.focus) || 'balanced';

    const puanli = ESP.Mod.active().map(d => {
      const row = denge.rows.find(r => r.disc.id === d.id);
      let puan = 0;
      /* Hic dokunulmamis disiplin en yuksek puani alir: denge sistemin amaci. */
      if(!row || row.cert === 'missing') puan += 100;
      else puan += Math.max(0, 60 - row.minutes / 3);
      /* Tikanma varsa o disiplin one gecer. */
      if(blockedCore(today).some(b => b.disc === d.id)) puan += 80;
      /* Yaklasan hedef. */
      if(deadlines(today).some(x => x.urgent && x.goal.disc === d.id)) puan += 90;
      /* Odak yalnizca esitligi bozar — bir puan degil yarim puan. */
      if(odak === d.id) puan += 0.5;
      return { disc:d, score:puan };
    }).sort((a, b) => b.score - a.score);

    return {
      rows:puanli,
      focus:odak,
      cert:denge.cert,
      note:denge.cert === 'missing'
        ? 'Son ' + BALANCE_WINDOW + ' günde hiç kayıt yok; rota yalnızca disiplin '
          + 'listesinden kuruldu.'
        : null,
    };
  }

  /* ------------------------------------------------------- capraz bulgular

     Iki AYRI masanin verisi birlikte anlam kazandiginda cikan bulgu.
     Korelasyon nedensellik gibi yazilmaz: "birlikte hareket ediyor" denir.

     Her bulgu hangi iki masadan geldigini tasir; Patron bunlari devre
     cevirir (bkz. core/office.js). */
  function crossFindings(todayISO){
    const today = todayISO || U.todayISO();
    const out = [];

    /* Dil ↔ okuma: kelime calisiliyor ama yabanci dilde okuma yok.
       Ikisinin birlikte gitmesi retansiyonun en ucuz kaynagidir. */
    const dil = ESP.Intellect.hoursOf('lang', 14);
    const okuma = ESP.Intellect.hoursOf('reading', 14);
    if(dil.cert !== 'missing' && okuma.cert === 'missing'){
      out.push({ id:'lang-no-reading', from:'polyglot', to:'aristoteles',
        text:'Son 14 günde ' + U.fmtMin(dil.minutes) + ' dil çalışması var, '
           + 'okuma hiç girilmemiş. Kartlar bağlamda görülmediğinde retansiyon '
           + 'daha hızlı düşüyor.',
        route:'library' });
    }

    /* Okuma ↔ yazi: not birikiyor ama taslak yok. */
    const ss = ESP.Intellect.syntopic();
    const yazi = ESP.Intellect.hoursOf('writing', 14);
    if(ss.total >= 5 && yazi.cert === 'missing'){
      out.push({ id:'notes-no-writing', from:'aristoteles', to:'montaigne',
        text:ss.total + ' atomik not var ama son 14 günde yazı oturumu yok. '
           + 'Not yığını, yazılana kadar sermaye sayılmıyor.',
        route:'writing' });
    }

    /* Muzik ↔ diksiyon: ayni akustik katmani paylasan iki disiplinden biri
       tamamen kapali. Diksiyon en kolay ertelenen disiplindir. */
    const muzik = ESP.Intellect.hoursOf('music', 14);
    const diksiyon = ESP.Intellect.hoursOf('diction', 14);
    if(muzik.cert !== 'missing' && diksiyon.cert === 'missing'){
      out.push({ id:'music-no-diction', from:'maestro', to:'demosthenes',
        text:'Enstrüman çalışılıyor, diksiyon hiç açılmamış. İkisi de aynı '
           + 'zamanlama duyusunu kullanıyor; biri ötekini ucuza taşıyor.',
        route:'studio' });
    }

    /* Felsefe ↔ yazi: acik tez var, yazi yok. */
    const acikTezler = ESP.Intellect.stalledArguments(14, today);
    if(acikTezler.length && yazi.cert === 'missing'){
      out.push({ id:'args-no-writing', from:'socrates', to:'montaigne',
        text:acikTezler.length + ' tez 14+ gündür açık ve yazı oturumu yok. '
           + 'Bir tez çoğu zaman yazılırken kapanır.',
        route:'writing' });
    }

    /* Tarih ↔ okuma: kronoloji doluyor ama kaynak elestirisi yok.
       Kaynaksiz kronoloji bir liste; liste tarih degildir. */
    const th = ESP.Chrono ? ESP.Chrono.status() : null;
    if(th && th.cert !== 'missing' && th.events >= 20 && !th.sources.total){
      out.push({ id:'events-no-sources', from:'herodot', to:'aristoteles',
        text:th.events + ' olay girilmiş ama hiçbir kaynak değerlendirilmemiş. '
           + 'Kaynaksız kronoloji bir liste; liste tarih değildir.',
        route:'history' });
    }

    /* Tarih ↔ felsefe: nedensellik zinciri kuruluyor ama tez yok.
       Ikisi ayni kasi calistirir: oncul-sonuc ayrimi. */
    if(th && th.chains.total >= 3 && !(S.args || []).length){
      out.push({ id:'chains-no-args', from:'herodot', to:'socrates',
        text:th.chains.total + ' neden zinciri kurulmuş ama hiç tez yazılmamış. '
           + 'İkisi aynı ayrımı kullanıyor: öncül ile sonuç.',
        route:'symposium' });
    }

    /* SRS ↔ seri: kart birikiyor ve gunluk kayit da kopmus. */
    const o = overdue(today);
    const seri = ESP.Model.streak();
    if(o.overdue.length >= 10 && seri === 0){
      out.push({ id:'overdue-no-streak', from:'polyglot', to:'patron',
        text:o.overdue.length + ' kart gecikmiş ve seri kopmuş. Asgari gün '
           + '(vadesi gelen kartlar + 10 dakika okuma) borcu büyütmeden kapatır.',
        route:'today' });
    }

    return out;
  }

  return {
    RETENTION_FLOOR, RETENTION_MIN_CARDS, DEADLINE_DAYS, BALANCE_WINDOW,
    blockedCore, deadlines, overdue, overdueDeck, synthesisGap,
    nextAction, balance, weeklyRoute, crossFindings,
  };
})();
