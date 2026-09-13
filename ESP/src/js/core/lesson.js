/* Öğrenme ve pratik motoru — ünite kartlaşır, pratik ölçüme dönüşür.

   İki iş yapar ve ikisi de kural motorunun içindedir; hiçbiri modele
   sorulmaz:

     ÜNİTE   bir konunun somut öğelerini SRS kartına çevirir ve o ünitenin
             ilerlemesini kartların durumundan OKUR.
     PRATİK  destedeki kartlardan soru üretir, cevabı denetler ve sonucu
             doğrudan SRS'e yazar.

   Üç kural bu dosyayı yönetir:

   1. İLERLEME UYDURULMAZ. «%60 tamamlandı» demek için ünitenin kartlarının
      SRS'te hangi kutuda olduğuna bakılır. Ayrı bir «tamamlandı» bayrağı
      tutulmaz: bayrak, yapılmamış işi yapılmış göstermenin en kolay yolu.

   2. PRATİK AYRI BİR KAYIT AÇMAZ. Bir soruya verilen cevap, tekrar
      ekranında verilen cevapla aynı yere gider (`ESP.SRS.answer`). İki ayrı
      hafıza kaydı, iki ayrı retansiyon demekti.

   3. SORU ÜRETİMİ KURAL MOTORUNUNDUR. Çeldiriciler aynı desteden gelir;
      model çeldirici uydurmaz. Uydurulmuş bir çeldirici yanlış bir şeyi
      öğretebilir — sistemin yapabileceği en pahalı hata.

   Cevap denetimi TOLERANSLIDIR ama körü körüne değil: büyük-küçük harf,
   noktalama ve baştaki «to / the / bir» gibi işaretleyiciler yok sayılır;
   kelimenin kendisi yanlışsa yanlıştır. Türkçe'de büyük harf dönüşümü
   `toLocaleLowerCase('tr-TR')` ile yapılır — «I» harfinin karşılığı
   İngilizce'de «i», Türkçe'de «ı»dır ve bu ayrım sessizce yanlış cevap
   üretir. */

window.ESP = window.ESP || {};

ESP.Lesson = (function(){
  const U = ESP.U, S = ESP.S;

  /* ------------------------------------------------------------- üniteler */

  function langUnits(){ return ESP.LANG_UNITS || []; }
  function historyUnits(){ return ESP.HISTORY_UNITS || []; }

  function units(discId){
    if(discId === 'history') return historyUnits().map(function(u){
      return Object.assign({ disc:'history' }, u); });
    if(discId === 'lang') return langUnits().map(function(u){
      return Object.assign({ disc:'lang' }, u); });
    return [];
  }

  function unitOf(discId, id){
    return units(discId).filter(function(u){ return u.id === id; })[0] || null;
  }

  /* Bir dil ünitesinin bu dildeki öğeleri. İçeriği olmayan dil BOŞ döner ve
     ekran bunu açıkça söyler — uydurulmuş çeviri, boş üniteden pahalıdır. */
  function itemsOf(unit, lang){
    if(!unit) return [];
    if(unit.disc === 'history') return historyItems(unit);
    const dil = lang || (S.profile && S.profile.langs && S.profile.langs[0]) || 'en';
    return ((unit.items || {})[dil] || []).map(function(x){
      return { front:x.front, back:x.back, lang:dil };
    });
  }

  /* Tarih ünitesinin öğeleri tohum olaylardan süzülür: iki yerde iki liste
     tutmak, birinin eskimesi demektir. */
  function historyItems(unit){
    const hepsi = (ESP.SEED_EVENTS || []);
    return hepsi.filter(function(e){
      if(unit.era) return ((ESP.eraOf(e.year) || {}).id === unit.era);
      if(unit.region) return e.region === unit.region;
      if(unit.kind) return e.kind === unit.kind;
      return false;
    }).map(function(e){
      return { front:e.title, back:ESP.yearLabel(e.year), lang:ESP.HISTORY_DECK,
        year:e.year, why:e.why, era:(ESP.eraOf(e.year) || {}).id || null,
        kind:e.kind, region:e.region };
    });
  }

  /* Ünitenin kartları: aynı destede, ön yüzü eşleşenler. Etiketle de
     işaretlenir ama etiket TEK dayanak değildir — kullanıcının kendi yazdığı
     aynı kart da o üniteye sayılır ve sayılmalıdır. */
  function cardsOf(unit, lang){
    const ogeler = itemsOf(unit, lang);
    if(!ogeler.length) return [];
    const idx = {};
    ogeler.forEach(function(o){ idx[U.norm(o.front)] = true; });
    return (S.cards || []).filter(function(c){ return idx[U.norm(c.front)]; });
  }

  /* Ünite ilerlemesi — SRS'ten OKUNUR, tutulmaz.

     `known` sayısı 3. kutu ve üstündeki kartlardır: bir kez doğru bilmek
     «öğrenildi» değildir, aralık uzadıysa öğrenilmiştir. */
  const KNOWN_BOX = 3;

  function progress(unit, lang){
    const ogeler = itemsOf(unit, lang);
    const kartlar = cardsOf(unit, lang);
    if(!ogeler.length){
      return { total:0, added:0, known:0, pct:0, cert:'missing',
        why:'Bu ünitenin bu dilde malzemesi yok; kartını kendin yazarsın.' };
    }
    const bilinen = kartlar.filter(function(c){ return (c.box || 1) >= KNOWN_BOX; }).length;
    return {
      total:ogeler.length, added:kartlar.length, known:bilinen,
      pct:Math.round(100 * bilinen / ogeler.length),
      cert:kartlar.length ? 'derived' : 'missing',
      why:kartlar.length ? null : 'Ünite henüz desteye eklenmedi.',
    };
  }

  /* Üniteyi desteye ekler. İki kez basmak kartı iki kez EKLEMEZ: ön yüzü
     aynı olan kart varsa atlanır ve kaç tanesinin atlandığı söylenir. */
  async function addUnit(unit, lang){
    const ogeler = itemsOf(unit, lang);
    if(!ogeler.length) return { ok:false, error:'Bu ünitenin bu dilde malzemesi yok.' };
    let eklenen = 0, atlanan = 0;
    for(const o of ogeler){
      const var_ = (S.cards || []).some(function(c){
        return c.lang === o.lang && U.norm(c.front) === U.norm(o.front); });
      if(var_){ atlanan++; continue; }
      await ESP.Model.saveCard(ESP.Model.newCard({
        front:o.front, back:o.back, lang:o.lang,
        context:o.why || '',
        /* «tohum» etiketi kaybolmaz: bu kartı kullanıcı yazmadı. */
        tags:['seed', 'unit:' + unit.id].concat(o.era ? [o.era] : []),
      }));
      eklenen++;
    }
    if(ESP.Memo && ESP.Memo.bitir) ESP.Memo.bitir();
    return { ok:true, added:eklenen, skipped:atlanan };
  }

  /* --------------------------------------------------------------- konular

     Ünite KARTA döner, konu DÖNMEZ. Bir dil ünitesi on kelimeyi desteye
     ekler ve ilerlemesi SRS'ten okunur; «barre akorlar» ya da «kaynak
     eleştirisi» ise çalışılacak bir konudur ve ölçüsü kart değildir.

     Bu yüzden konu ilerlemesi ÖLÇÜM DEĞİL BEYANDIR ve her yerde öyle
     etiketlenir: kullanıcı «bunu çalıştım» der, sistem doğrulayamaz.
     Beyanı ölçüm gibi göstermek, retansiyon sayısını uydurmakla aynı şey
     olurdu — bu yüzden beyan hiçbir kapıyı açmaz, hiçbir kademeyi
     değiştirmez ve hiçbir hesaba girmez. Yaptığı tek şey kullanıcının
     kendi listesini işaretleyebilmesidir. */

  function topics(discId){
    return ((ESP.TOPICS || {})[discId] || []).map(function(t){
      return Object.assign({ disc:discId }, t);
    });
  }

  function topicOf(discId, id){
    return topics(discId).filter(function(t){ return t.id === id; })[0] || null;
  }

  function topicMarks(){
    return ((S.prefs && S.prefs.topics) || {});
  }

  function topicProgress(topic){
    if(!topic) return { total:0, marked:0, cert:'missing' };
    const isaret = topicMarks()[topic.id] || {};
    const n = (topic.items || []).length;
    const k = Object.keys(isaret).filter(function(i){ return isaret[i]; }).length;
    return {
      total:n, marked:Math.min(k, n),
      /* Beyan bir olcum degildir: etiketi DAIMA 'tahmin'. */
      cert:k ? 'estimated' : 'missing',
      pct:n ? Math.round(100 * Math.min(k, n) / n) : 0,
    };
  }

  async function markTopic(topicId, index){
    const prefs = Object.assign({}, S.prefs || {});
    prefs.topics = Object.assign({}, prefs.topics || {});
    const cur = Object.assign({}, prefs.topics[topicId] || {});
    if(cur[index]) delete cur[index]; else cur[index] = true;
    prefs.topics[topicId] = cur;
    await ESP.Model.savePrefs(prefs);
    return { ok:true, marked:!!cur[index] };
  }

  /* Bir disiplinin konu ozeti — ekran basligi ve ders sekmesi icin. */
  function topicSummary(discId){
    const list = topics(discId);
    if(!list.length) return { topics:0, items:0, marked:0, cert:'missing' };
    let madde = 0, isaretli = 0;
    list.forEach(function(t){
      const p = topicProgress(t);
      madde += p.total; isaretli += p.marked;
    });
    return { topics:list.length, items:madde, marked:isaretli,
      cert:isaretli ? 'estimated' : 'missing',
      pct:madde ? Math.round(100 * isaretli / madde) : 0 };
  }

  /* --------------------------------------------------------------- pratik */

  function norm(s){
    return String(s == null ? '' : s)
      .toLocaleLowerCase('tr-TR')
      .replace(/[.,;:!?"'`´‘’“”()\[\]]/g, ' ')
      .replace(/^\s*(to|the|a|an|bir|der|die|das)\s+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* Cevap doğru mu? Eş anlamlılar «,» ya da «/» ile ayrılmışsa herhangi
     biri kabul edilir: «yine de, buna rağmen» kartında ikisi de doğrudur. */
  function correct(given, expected){
    const g = norm(given);
    if(!g) return false;
    const secenekler = String(expected || '').split(/[,/]|;/)
      .map(norm).filter(Boolean);
    if(!secenekler.length) return false;
    return secenekler.some(function(x){ return x === g; });
  }

  function shuffle(list, seedStr){
    /* Karıştırma da kararlı: aynı oturum iki kez çizildiğinde sıra
       değişmemeli, yoksa cevaplanan soru yer değiştirir. */
    let h = 0;
    const s = String(seedStr || '');
    for(let i = 0; i < s.length; i++){ h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
    const out = list.slice();
    for(let i = out.length - 1; i > 0; i--){
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      const j = h % (i + 1);
      const t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }

  /* Bir soru üretir. Çeldiriciler AYNI DESTEDEN gelir; model uydurmaz. */
  function question(card, deck, kind, seed){
    const tarih = deck === ESP.HISTORY_DECK;
    const digerleri = (S.cards || []).filter(function(c){
      return c.lang === card.lang && c.id !== card.id; });

    if(kind === 'choice' || kind === 'reverse'){
      if(digerleri.length < 3) kind = 'recall';
    }
    if((kind === 'order' || kind === 'era') && !tarih) kind = 'recall';

    if(kind === 'choice'){
      const celdirici = shuffle(digerleri, seed).slice(0, 3)
        .map(function(c){ return c.back; });
      return { kind:'choice', cardId:card.id, prompt:card.front,
        options:shuffle([card.back].concat(celdirici), seed + 'o'),
        answer:card.back };
    }
    if(kind === 'reverse'){
      const celdirici = shuffle(digerleri, seed).slice(0, 3)
        .map(function(c){ return c.front; });
      return { kind:'reverse', cardId:card.id, prompt:card.back,
        options:shuffle([card.front].concat(celdirici), seed + 'o'),
        answer:card.front };
    }
    if(kind === 'era'){
      const yil = Number(String(card.back).replace(/[^\-0-9]/g, ''));
      const donem = ESP.eraOf(yil);
      if(!donem) return { kind:'recall', cardId:card.id, prompt:card.front,
        answer:card.back };
      return { kind:'era', cardId:card.id, prompt:card.front,
        options:(ESP.ERAS || []).map(function(e){ return e.label; }),
        answer:donem.label };
    }
    if(kind === 'order'){
      const havuz = digerleri.filter(function(c){
        return /^(MÖ )?\d+$/.test(String(c.back).trim()); });
      if(havuz.length < 3) return { kind:'recall', cardId:card.id,
        prompt:card.front, answer:card.back };
      const secilen = [card].concat(shuffle(havuz, seed).slice(0, 3));
      const yilOf = function(c){
        const t = String(c.back).trim();
        const n = Number(t.replace(/[^0-9]/g, ''));
        return /^MÖ/.test(t) ? -n : n;
      };
      const dogru = secilen.slice().sort(function(a, b){ return yilOf(a) - yilOf(b); })
        .map(function(c){ return c.front; });
      return { kind:'order', cardId:card.id,
        prompt:'Bu dört olayı eskiden yeniye sırala.',
        options:shuffle(secilen.map(function(c){ return c.front; }), seed + 'r'),
        answer:dogru.join(' | ') };
    }
    return { kind:'recall', cardId:card.id, prompt:card.front, answer:card.back };
  }

  /* Bir pratik oturumu kurar.

     Kartlar önce VADESİ GELENLERDEN seçilir: pratik, tekrarın yerine geçmez
     ama tekrarı da boşa harcamamalı. */
  function start(deck, opts){
    const o = opts || {};
    const bugun = o.today || U.todayISO();
    const deste = deck || ((S.profile && S.profile.langs && S.profile.langs[0]) || 'en');
    const hepsi = (S.cards || []).filter(function(c){ return c.lang === deste; });
    if(hepsi.length < 1) return { ok:false, error:'Bu destede kart yok.' };

    const vadesi = ESP.SRS.dueCards(bugun).filter(function(c){ return c.lang === deste; });
    const geri = hepsi.filter(function(c){ return vadesi.indexOf(c) < 0; });
    const sira = vadesi.concat(shuffle(geri, bugun + deste))
      .slice(0, o.length || ESP.PRACTICE_LENGTH);

    const turler = o.kinds && o.kinds.length ? o.kinds
      : (deste === ESP.HISTORY_DECK ? ['recall', 'choice', 'era', 'order']
        : ['recall', 'choice', 'reverse']);

    return {
      ok:true,
      deck:deste, at:new Date().toISOString(), today:bugun,
      questions:sira.map(function(c, i){
        return question(c, deste, turler[i % turler.length], bugun + deste + i);
      }),
      pos:0, right:0, wrong:0, done:false, log:[],
    };
  }

  /* Cevabı denetler ve SRS'e yazar.

     Not «tekrar» ile «iyi» arasında üçüncü bir değer YOKTUR: pratik bir
     ölçüm değil bir denemedir ve kullanıcının «kolaydı» demesi burada
     sorulmaz. Kolaylık, aralığın kendisinden okunur. */
  async function answer(session, given){
    if(!session || session.done) return { ok:false, error:'Oturum kapalı.' };
    const q = session.questions[session.pos];
    if(!q) return { ok:false, error:'Soru yok.' };

    const dogru = q.kind === 'recall'
      ? correct(given, q.answer)
      : norm(given) === norm(q.answer);

    /* Kart oturum sirasinda silinmis olabilir (baska sekmede, baska
       ekranda). SRS "kart bulunamadi" derse soru SAYILMAZ: olmayan bir
       karta verilmis cevap, retansiyonu da isabeti de yalan yapar. */
    const yazildi = await ESP.SRS.answer(q.cardId, dogru ? 'good' : 'again');
    if(!yazildi.ok){
      session.pos++;
      if(session.pos >= session.questions.length) session.done = true;
      return { ok:false, error:'Bu kart artık yok; soru atlandı.',
        skipped:true, done:session.done };
    }

    session.log.push({ cardId:q.cardId, kind:q.kind, ok:dogru,
      given:String(given || ''), expected:q.answer });
    if(dogru) session.right++; else session.wrong++;
    session.pos++;
    if(session.pos >= session.questions.length) session.done = true;
    return { ok:true, correct:dogru, expected:q.answer, done:session.done };
  }

  /* Oturumun sonucu. İsabet bir «not» değil bir ölçümdür ve öyle yazılır. */
  function result(session){
    if(!session) return null;
    const n = session.right + session.wrong;
    return {
      asked:n, right:session.right, wrong:session.wrong,
      accuracy:n ? session.right / n : null,
      cert:n ? 'measured' : 'missing',
      deck:session.deck,
      missed:session.log.filter(function(x){ return !x.ok; }),
    };
  }

  /* Oturumu gün kaydına yazar: pratik de bir pratiktir ve dakikası sayılır. */
  async function log(session, minutes){
    const r = result(session);
    if(!r || !r.asked) return { ok:false, error:'Cevaplanmış soru yok.' };
    const disc = session.deck === ESP.HISTORY_DECK ? 'history' : 'lang';
    await ESP.Model.addSession(session.today || U.todayISO(), {
      disc:disc,
      minutes:minutes != null ? minutes : Math.max(1, Math.round(r.asked * 0.5)),
      count:r.right,
      note:'pratik · ' + r.right + '/' + r.asked,
    });
    if(ESP.Memo && ESP.Memo.bitir) ESP.Memo.bitir();
    return { ok:true, result:r };
  }

  return { units, unitOf, itemsOf, cardsOf, progress, addUnit, KNOWN_BOX,
    topics, topicOf, topicMarks, topicProgress, markTopic, topicSummary,
    start, question, answer, result, log, correct, norm, shuffle };
})();
