/* Ofis — yedi ajanin calisma duzeni.

   Akis her zaman ayni yonde gider:

     Intellect / SRS / Acoustic / Planner  →  brief(agentId)  →  model  →  ekran
          (skor, esik, siradaki adim)           (rapor, JSON)     (yorum)

   Kural motoru otoritedir. Ajan hesap yapmaz; brifingdeki sayiyi oldugu gibi
   kullanir. Model yoksa ofis kapanmaz: brifing dogrudan cumleye cevrilir
   (ruleText) ve ajanlar "kural motoru" rozetiyle konusur.

   Modele giden sey de sinirlidir (ESP.PRIVACY.model): yalnizca olculmus
   metrikler ve durum etiketleri. Ham ses kaydi, tam taslak metni ve atomik
   notun kendi cumlesi brifinge GIRMEZ — bu bir testle denetlenir.

   Tek istisna kullanicinin ACIKCA paylastigi parcadir: Sempozyum ekraninda
   bir teze tiklayip "Socrates'e sor" dendiginde tezin metni SORUNUN icinde
   gider, brifingin icinde degil. Fark onemli: brifing her cagride otomatik
   gider, soru yalnizca kullanici istediginde. */

window.ESP = window.ESP || {};

ESP.Office = (function(){
  const U = ESP.U;
  const S = ESP.S;

  /* --------------------------------------------------------------- ayarlar */

  function defaults(){
    return {
      provider:'builtin', model:'default',
      perAgent:{},            // agentId -> { provider, model }
      autoBriefing:true,
      temperature:0.4,
    };
  }

  function settings(){
    if(!S.office) S.office = defaults();
    return S.office;
  }

  async function saveSettings(patch){
    S.office = Object.assign(defaults(), settings(), patch || {});
    await ESP.Store.set('office', S.office);
    return S.office;
  }

  function cfgFor(agentId){
    const s = settings();
    const own = s.perAgent && s.perAgent[agentId];
    return own && own.provider ? own : { provider:s.provider, model:s.model };
  }

  function ready(agentId){
    return ESP.LLM.ready(cfgFor(agentId));
  }

  /* --------------------------------------------------------------- brifing

     Her brifing SAF bir nesnedir: ekranda da, modelde de, testte de ayni
     sey okunur. Icinde cumle degil olcum vardir.

     Her sayinin yaninda kesinlik etiketi durur. Bu sus degil: model
     "retansiyon %38" ile "retansiyon olculemedi" arasindaki farki gormek
     zorunda, yoksa olmayan bir dususu yorumlar. */

  function langBrief(){
    const d = ESP.SRS.deckStatus();
    const h = ESP.Intellect.hoursOf('lang', 14);
    return {
      agent:'polyglot',
      cards:{ total:d.total, active:d.active, cert:d.total ? 'measured' : 'missing' },
      due:{ value:d.due, overdue:d.overdue, maxOverdueDays:d.maxOverdueDays, cert:'measured' },
      retention:{ value:d.retention.value, cert:d.retention.cert,
        n:d.retention.n, of:d.retention.total },
      practice:{ minutes:h.minutes, enteredDays:h.enteredDays, windowDays:h.windowDays,
        cert:h.cert },
      boxes:d.boxes,
      answered7:ESP.SRS.answeredIn(7),
    };
  }

  function philoBrief(){
    const acik = ESP.Intellect.openArguments();
    const tikanan = ESP.Intellect.stalledArguments();
    const h = ESP.Intellect.hoursOf('philo', 14);
    const primer = (S.books || []).filter(b => b.kind === 'primary');
    /* Itiraz sayilari taşinir, itirazin METNI tasinmaz. */
    const acikItiraz = acik.reduce((a, x) =>
      a + (x.objections || []).filter(o => !o.answered).length, 0);
    return {
      agent:'socrates',
      arguments:{ open:acik.length, stalled:tikanan.length,
        closed:(S.args || []).filter(a => a.status === 'closed').length,
        cert:(S.args || []).length ? 'measured' : 'missing' },
      objections:{ unanswered:acikItiraz, cert:acik.length ? 'measured' : 'missing' },
      primaryTexts:{ value:primer.length, cert:(S.books || []).length ? 'measured' : 'missing' },
      practice:{ minutes:h.minutes, enteredDays:h.enteredDays, windowDays:h.windowDays,
        cert:h.cert },
    };
  }

  function musicBrief(){
    const m = ESP.Acoustic.musicStatus();
    const h = ESP.Intellect.hoursOf('music', 14);
    return {
      agent:'maestro',
      pieces:{ total:m.n || 0, measured:m.measured || 0, cert:m.cert },
      /* Parca adi bir olcum degil bir etikettir; ad olmadan "hangi parca
         platoda" cumlesi kurulamaz, bu yuzden AD gider, kayit gitmez. */
      plateaus:(m.plateaus || []).map(p => ({ name:p.piece.name, days:p.days, bpm:p.bpm })),
      progress:{ value:m.progress ? m.progress.value : null,
        cert:m.progress ? m.progress.cert : 'missing',
        reached:m.progress ? m.progress.reached : 0, n:m.progress ? m.progress.n : 0 },
      thresholds:(m.rows || []).filter(r => r.t.cert !== 'missing')
        .map(r => ({ name:r.piece.name, bpm:r.t.value, target:r.piece.targetBpm || null })),
      practice:{ minutes:h.minutes, enteredDays:h.enteredDays, windowDays:h.windowDays,
        cert:h.cert },
    };
  }

  function dictionBrief(){
    const d = ESP.Acoustic.dictionStatus(30);
    const t = ESP.Acoustic.dictionTrend();
    const h = ESP.Intellect.hoursOf('diction', 14);
    return {
      agent:'demosthenes',
      recordings:{ value:d.n || 0, windowDays:d.windowDays || 30, cert:d.cert },
      wpm:d.wpm || { value:null, cert:'missing' },
      errorRate:d.errorRate || { value:null, cert:'missing' },
      band:ESP.Acoustic.WPM_BAND,
      trend:{ direction:t.direction || null, cert:t.cert },
      practice:{ minutes:h.minutes, enteredDays:h.enteredDays, windowDays:h.windowDays,
        cert:h.cert },
    };
  }

  function readingBrief(){
    const ss = ESP.Intellect.syntopic();
    const h = ESP.Intellect.hoursOf('reading', 14);
    return {
      agent:'aristoteles',
      notes:{ total:ss.total, linked:ss.linked, unlinked:ss.total - ss.linked,
        cert:ss.total ? 'measured' : 'missing' },
      books:{ value:ss.books, authors:ss.authors, cert:ss.books ? 'measured' : 'missing' },
      ssk:{ value:ss.value, cert:ss.cert, why:ss.why || null },
      suggestions:ESP.Intellect.linkSuggestions(3).length,
      practice:{ minutes:h.minutes, enteredDays:h.enteredDays, windowDays:h.windowDays,
        cert:h.cert },
    };
  }

  function writingBrief(){
    const w = ESP.Intellect.wordsWritten(7);
    const r = ESP.Intellect.draftRatio();
    const h = ESP.Intellect.hoursOf('writing', 14);
    /* Taslak METNI gitmez; yalnizca son taslagin OLCUMU gider. */
    const son = (S.drafts || [])[0];
    const ok = son ? ESP.Intellect.readability(son.text) : { value:null, cert:'missing' };
    return {
      agent:'montaigne',
      words7:{ value:w.value, cert:w.cert, enteredDays:w.enteredDays },
      drafts:{ value:r.drafts, revisions:r.revisions, ratio:r.value, cert:r.cert },
      readability:{ value:ok.value, cert:ok.cert,
        band:ok.band ? ok.band.label : null,
        wordsPerSentence:ok.wordsPerSentence || null },
      practice:{ minutes:h.minutes, enteredDays:h.enteredDays, windowDays:h.windowDays,
        cert:h.cert },
    };
  }

  /* Tarih masasi. Uc eksen ayri durur ve tek puana toplanmaz: hangi
     eksenin zayif oldugunu gizleyen bir sayi, o ekseni calistirmaz. */
  function historyBrief(){
    const st = ESP.Chrono.status();
    const h = ESP.Intellect.hoursOf('history', 14);
    const lv = ESP.Curriculum.levelOf('history');
    return {
      agent:'herodot',
      events:{ value:st.events, cert:st.cert,
        firstYear:st.firstYear, lastYear:st.lastYear },
      coverage:{ eras:st.eras, regions:st.regions, kinds:st.kinds, gaps:st.gaps.length },
      sources:st.sources,
      chains:st.chains,
      retention:st.retention,
      level:{ rank:lv ? lv.rank : 0, label:lv ? lv.level.label : null,
        cert:lv ? lv.cert : 'missing' },
      practice:{ minutes:h.minutes, enteredDays:h.enteredDays, windowDays:h.windowDays,
        cert:h.cert },
    };
  }

  /* Koc masasi. Icerige HIC bakmaz: yalnizca «tuttun mu» ve «siradaki kapi
     hangisi» sorularina bakar. Bu ayrim sayesinde koc, bir disiplinin
     uzmaniyla asla celismez — ayni seyi olcmuyorlar. */
  function coachBrief(){
    const ov = ESP.Curriculum.overall();
    const d = ESP.SRS.deckStatus();
    const kapilar = ESP.DISCIPLINES.map(x => {
      const g = ESP.Curriculum.nextGate(x.id);
      const lv = ESP.Curriculum.levelOf(x.id);
      return {
        disc:x.id, label:x.label,
        rank:lv ? lv.rank : 0, mastery:lv ? lv.mastery : 0, cert:lv ? lv.cert : 'missing',
        gate:g ? { label:g.gate.label, action:g.action, rank:g.rank } : null,
      };
    });
    return {
      agent:'mnemosyne',
      overall:{ rank:ov.rank, label:ov.level ? ov.level.label : null,
        mastery:ov.mastery, cert:ov.cert },
      due:{ value:d.due, overdue:d.overdue, maxOverdueDays:d.maxOverdueDays, cert:'measured' },
      retention:{ value:d.retention.value, cert:d.retention.cert, n:d.retention.n },
      gates:kapilar,
      /* Olculemeyen kapi ayri sayilir: "calis" ile "olc" ayri islerdir. */
      unmeasured:kapilar.filter(k => k.gate && k.gate.action === 'measure').length,
    };
  }

  function patronBrief(){
    const next = ESP.Planner.nextAction();
    const ehs = ESP.Intellect.ehs(14);
    const denge = ESP.Planner.balance(7);
    return {
      agent:'patron',
      lang:langBrief(), philo:philoBrief(), music:musicBrief(),
      diction:dictionBrief(), reading:readingBrief(), writing:writingBrief(),
      history:historyBrief(), coach:coachBrief(),
      ehs:{ value:ehs.value, cert:ehs.cert, windowDays:ehs.windowDays,
        enteredDays:ehs.enteredDays, untouched:ehs.untouched },
      balance:{ cert:denge.cert, skewed:denge.skewed,
        top:denge.top ? denge.top.label : null,
        untouched:denge.untouched.map(d => d.label) },
      streak:ESP.Model.streak(),
      cross:ESP.Planner.crossFindings().map(c => ({ id:c.id, from:c.from, to:c.to, text:c.text })),
      next:{ rank:next.rank, title:next.title, why:next.why, agent:next.agent },
      level:(function(){
        const ov = ESP.Curriculum.overall();
        return { rank:ov.rank, label:ov.level ? ov.level.label : null,
          mastery:ov.mastery, cert:ov.cert };
      })(),
      openDecisions:ESP.Model.openDecisions().length,
    };
  }

  const BRIEFS = {
    polyglot:langBrief, socrates:philoBrief, maestro:musicBrief,
    demosthenes:dictionBrief, aristoteles:readingBrief, montaigne:writingBrief,
    herodot:historyBrief, mnemosyne:coachBrief,
    patron:patronBrief,
  };

  function brief(agentId){
    const fn = BRIEFS[agentId] || patronBrief;
    return fn();
  }

  /* ------------------------------------------------------------- kural dili

     Model kapaliyken ajanin konustugu dil. Brifingdeki sayilar dogrudan
     cumleye cevrilir; yorum yoktur, YALNIZCA OLCUM vardir.

     Bu fonksiyon sistemin yedegi degil VARSAYILANIDIR: model bir
     iyilestirmedir. Bu yuzden ciktisi "gecici bir sey" gibi degil, bitmis
     bir cumle gibi yazilir. */
  function pct(v){ return v == null ? null : '%' + Math.round(v * 100); }

  function ruleText(agentId, b){
    const brf = b || brief(agentId);
    const cumle = [];

    if(agentId === 'polyglot'){
      if(brf.cards.cert === 'missing') return 'Henüz kart yok. İlk kartı eklediğinde retansiyon ölçülmeye başlar.';
      cumle.push(brf.cards.total + ' kart var, ' + brf.cards.active + ' tanesi üretimde kullanılmış.');
      if(brf.due.overdue) cumle.push(brf.due.overdue + ' kartın vadesi geçti (en çok geciken ' + brf.due.maxOverdueDays + ' gün).');
      else if(brf.due.value) cumle.push(brf.due.value + ' kart bugün vadeli.');
      else cumle.push('Bugün vadesi gelen kart yok.');
      cumle.push(brf.retention.cert === 'missing'
        ? 'Retansiyon henüz ölçülemedi: hiç cevaplanmış kart yok.'
        : 'Retansiyon ' + pct(brf.retention.value) + ' (' + brf.retention.n + ' karttan hesaplandı).');
      return cumle.join(' ');
    }

    if(agentId === 'socrates'){
      if(brf.arguments.cert === 'missing') return 'Henüz tez girilmemiş. Tek cümlelik bir tez yazmak yeterli; gerisini sorularla açarız.';
      cumle.push(brf.arguments.open + ' tez açık, ' + brf.arguments.closed + ' tez kapandı.');
      if(brf.objections.unanswered) cumle.push(brf.objections.unanswered + ' itiraz cevaplanmayı bekliyor.');
      if(brf.arguments.stalled) cumle.push(brf.arguments.stalled + ' tez 14 günden uzun süredir dokunulmamış.');
      cumle.push(brf.primaryTexts.cert === 'missing'
        ? 'Kaynak listesi boş.'
        : brf.primaryTexts.value + ' primer metin kayıtlı.');
      return cumle.join(' ');
    }

    if(agentId === 'maestro'){
      if(brf.pieces.cert === 'missing') return 'Henüz parça ya da teknik girilmemiş. Bir tane ekleyip tempo kaydetmeye başlayabilirsin.';
      cumle.push(brf.pieces.total + ' parça var, ' + brf.pieces.measured + ' tanesinin temiz tempo eşiği ölçüldü.');
      if(brf.plateaus.length){
        const p = brf.plateaus[0];
        cumle.push(p.name + ' ' + p.days + ' gündür ' + p.bpm + ' BPM\'de duruyor.');
      }
      if(brf.progress.cert !== 'missing'){
        cumle.push('Hedefi olan ' + brf.progress.n + ' parçanın ' + brf.progress.reached + ' tanesi hedef tempoda.');
      }
      return cumle.join(' ');
    }

    if(agentId === 'demosthenes'){
      if(brf.recordings.cert === 'missing') return 'Son 30 günde diksiyon kaydı yok. Bir tekerleme, bir süre ve kendi işaretlediğin hata sayısı yeter.';
      cumle.push('Son ' + brf.recordings.windowDays + ' günde ' + brf.recordings.value + ' kayıt var.');
      if(brf.wpm.cert !== 'missing'){
        const bant = brf.wpm.value >= brf.band.min && brf.wpm.value <= brf.band.max
          ? 'bandın içinde' : 'bandın dışında';
        cumle.push('Konuşma hızı medyanı ' + brf.wpm.value + ' kelime/dakika — ' + brf.band.min + '–' + brf.band.max + ' bandına göre ' + bant + '.');
      }
      if(brf.errorRate.cert !== 'missing'){
        cumle.push('Kendi işaretlediğin hata oranı ' + pct(brf.errorRate.value) + ' (tahmin).');
      }
      return cumle.join(' ');
    }

    if(agentId === 'aristoteles'){
      if(brf.notes.cert === 'missing') return 'Henüz atomik not yok. Tek fikir taşıyan tek cümlelik bir notla başlanır.';
      cumle.push(brf.notes.total + ' not var, ' + brf.notes.linked + ' tanesi bağlı, ' + brf.notes.unlinked + ' tanesi bağsız.');
      cumle.push(brf.ssk.cert === 'missing'
        ? 'Sentez katsayısı hesaplanamadı: ' + (brf.ssk.why || 'kaynak yok') + '.'
        : 'Sentez katsayısı ' + U.fmtNum(Math.round(brf.ssk.value * 100) / 100)
          + ' (' + brf.books.value + ' kaynak, ' + brf.books.authors + ' yazar).');
      if(brf.suggestions) cumle.push(brf.suggestions + ' bağ önerisi bekliyor.');
      return cumle.join(' ');
    }

    if(agentId === 'montaigne'){
      if(brf.drafts.cert === 'missing') return 'Henüz taslak yok. Bir başlık ve bir paragraf yeter; ölçüm oradan başlar.';
      cumle.push(brf.drafts.value + ' taslak, toplam ' + brf.drafts.revisions + ' revizyon.');
      cumle.push(brf.words7.cert === 'missing'
        ? 'Son 7 günde yazı oturumu girilmemiş.'
        : 'Son 7 günde ' + U.fmtNum(brf.words7.value) + ' kelime yazıldı.');
      if(brf.readability.cert !== 'missing'){
        cumle.push('Son taslağın okunabilirliği ' + brf.readability.value + ' (' + brf.readability.band + '), cümle başına ' + U.fmtNum(brf.readability.wordsPerSentence) + ' kelime.');
      }
      return cumle.join(' ');
    }

    if(agentId === 'herodot'){
      if(brf.events.cert === 'missing'){
        return 'Kronoloji boş. Tohum listesinde ' + (ESP.SEED_EVENTS || []).length
          + ' dönüm noktası hazır; şeridi doldurmak oradan başlayabilir.';
      }
      cumle.push(brf.events.value + ' olay var (' + ESP.yearLabel(brf.events.firstYear)
        + ' – ' + ESP.yearLabel(brf.events.lastYear) + ').');
      cumle.push(brf.coverage.eras.covered + '/' + brf.coverage.eras.total + ' dönem, '
        + brf.coverage.kinds.covered + '/' + brf.coverage.kinds.total + ' alan kapsandı.');
      if(brf.chains.total){
        cumle.push(brf.chains.total + ' neden zinciri var'
          + (brf.chains.unbalanced ? ', ' + brf.chains.unbalanced + ' tanesinde yapısal koşul yok' : '')
          + (brf.chains.unsourced ? '; ' + brf.chains.unsourced + ' halka kaynaksız' : '') + '.');
      }else{
        cumle.push('Hiçbir olay neden zinciriyle açıklanmamış: liste var, tarih yok.');
      }
      if(brf.sources.total){
        cumle.push(brf.sources.total + ' kaynağın ' + brf.sources.primary + ' tanesi birincil.');
      }
      return cumle.join(' ');
    }

    if(agentId === 'mnemosyne'){
      if(brf.overall.cert === 'missing'){
        return 'Hiçbir disiplinde ölçülmüş üretim yok. Merdiven ilk ölçümle başlar; '
          + 'kademe kişiye değil üretime verilir.';
      }
      cumle.push('Ölçülmüş üretim genel olarak «' + brf.overall.label + '» kademesinde '
        + '(merdivenin %' + brf.overall.mastery + '\'i).');
      if(brf.due.overdue) cumle.push(brf.due.overdue + ' kartın vadesi geçti.');
      if(brf.unmeasured) cumle.push(brf.unmeasured + ' kapı ölçülemiyor: '
        + 'orada istenen şey çalışmak değil ölçmek.');
      const yakin = (brf.gates || []).filter(g => g.gate && g.gate.action === 'work')[0];
      if(yakin) cumle.push(yakin.label + ' tarafında sıradaki kapı: ' + yakin.gate.label + '.');
      return cumle.join(' ');
    }

    /* Patron — kotu haber once. Iyi haberi kotu haberin arkasina saklamaz. */
    const p = brf;
    cumle.push(p.next.title + '.');
    if(p.balance.skewed && p.balance.untouched.length){
      cumle.push('Haftanın pratiği ' + p.balance.top + ' tarafına yığılmış; '
        + p.balance.untouched.join(' ve ') + ' hiç açılmamış.');
    }
    cumle.push(p.ehs.cert === 'missing'
      ? 'Entelektüel hacim hesaplanamadı: son ' + p.ehs.windowDays + ' günde ölçülmüş pratik yok.'
      : 'Entelektüel hacim ' + U.fmtNum(Math.round(p.ehs.value * 10) / 10)
        + ' (' + p.ehs.windowDays + ' günün ' + p.ehs.enteredDays + '\'inden hesaplandı).');
    if(p.streak) cumle.push('Seri ' + p.streak + ' gün.');
    if(p.openDecisions) cumle.push(p.openDecisions + ' karar takipte.');
    return cumle.join(' ');
  }

  /* --------------------------------------------------------------- model */

  function systemPrompt(agentId, b){
    const a = ESP.AGENT_BY_ID[agentId] || ESP.AGENT_BY_ID.patron;
    return [
      'Sen ' + a.name + ' adında bir entelektüel pratik ajanısın. Rolün: ' + a.role + '.',
      'Alanın: ' + a.scope,
      'Alanın DIŞI: ' + a.notScope + ' Alan dışı bir soru gelirse kısaca ilgili uzmana yönlendir.',
      '',
      'KURALLAR (bunlar tartışılmaz):',
      '1. Sayı üretme. Bütün sayılar aşağıdaki brifingden gelir. Brifingde olmayan bir sayıyı yazma.',
      '2. Sertifika ya da resmî seviye verme. Seviye etiketini kişiye değil ÜRETİME ver ve '
        + 'daima tarih aralığıyla birlikte: «son 30 günlük üretimin şu bandın kriterlerini karşılıyor».',
      '3. Mutlak yetenek yargısı kurma («yeteneklisin / yeteneksizsin»). Yalnızca süreç hakkında konuş.',
      '4. Sonuç garantisi verme. Yön ve olasılık söylenir, garanti verilmez.',
      '5. Estetik otorite iddia etme («kusursuz», «yayımlanmaya hazır»).',
      '6. Bir metrik «veri yok» ise onu sıfır gibi yorumlama; ölçülmediğini söyle.',
      '',
      'ÜSLUP: Türkçe, kısa, somut. En fazla üç cümle. Kötü haberi iyi haberin arkasına saklama.',
      'Soru sorabilirsin ama aynı anda en fazla bir tane.',
      '',
      'BRİFİNG (tek veri kaynağın):',
      JSON.stringify(b || brief(agentId)),
    ].join('\n');
  }

  /* ---------------------------------------------------------------- denetim

     Model ciktisi ev kurallarina karsi denetlenir.

     KRITIK: `validate` metni YENIDEN YAZMAZ, ISARETLER. Sessizce duzeltmek
     anlami tersine cevirebilir — "kesinlikle basaramazsin" cumlesindeki
     "kesinlikle"yi silmek cumleyi duzeltmez, gizler. Cagiran taraf ya
     uyariyi gosterir ya kural motorunun cumlesine duser.

     Uc sey aranir:
       banned       yasak kalip (ESP.GROUNDING.banned)
       scope        ajanin alani disina cikma
       unsupported  brifingde gecmeyen sayi */
  function validate(text, opts){
    const o = opts || {};
    const s = String(text || '');

    const hits = ESP.GROUNDING.banned.filter(b => b.re.test(s))
      .map(b => ({ id:b.id, why:b.why }));

    /* Alan ihlali: ajanin `notScope` alaninda gecen anahtar kelimeler.
       Kaba bir denetim ve oyle kalmali — dar tutulmazsa dogru cumleyi de
       yakalar ve ajan susar. Yalnizca BASKA bir disiplinin adi gecerse
       ve kendi disiplininin adi hic gecmezse isaretlenir. */
    const scope = [];
    const a = ESP.AGENT_BY_ID[o.agentId];
    if(a && a.owns){
      const kendi = ESP.DISCIPLINES.filter(d => d.agent === a.id);
      const baskasi = ESP.DISCIPLINES.filter(d => d.agent !== a.id && d.agent !== 'patron');
      const kendiGecti = kendi.some(d => new RegExp('\\b' + d.short + '', 'i').test(s));
      baskasi.forEach(d => {
        if(!kendiGecti && new RegExp('\\b' + d.short + '\\b', 'i').test(s)){
          scope.push({ id:'scope:' + d.id, why:d.label + ' alanı bu masaya ait değil' });
        }
      });
    }

    /* Desteksiz sayi: metinde gecen ama brifingde bulunmayan sayilar.
       Kucuk sayilar (esik alti) sayilmaz: "iki itiraz" ya da "3 gün" bir
       olcum iddiasi degil dilin kendisidir. */
    const unsupported = [];
    if(o.brief){
      const havuz = JSON.stringify(o.brief);
      const sayilar = s.match(/\d+(?:[.,]\d+)?/g) || [];
      const gorulen = {};
      sayilar.forEach(n => {
        const sayi = Number(String(n).replace(',', '.'));
        if(!isFinite(sayi) || sayi < ESP.GROUNDING.numberFloor) return;
        if(gorulen[n]) return;
        gorulen[n] = true;
        /* Yuvarlanmis hali de kabul edilir: brifingde 0.384 varsa metinde
           "%38" yazmasi uydurma degildir. */
        const yakin = [n, String(Math.round(sayi)), String(Math.round(sayi * 100) / 100),
          String(sayi / 100)];
        if(!yakin.some(v => havuz.indexOf(v) >= 0)){
          unsupported.push(n);
        }
      });
    }

    const warnings = hits.concat(scope);
    return {
      text:s,                       // METIN DEGISTIRILMEZ
      ok:warnings.length === 0 && unsupported.length === 0,
      violations:hits,
      scopeBreaches:scope,
      unsupported,
      warnings,
      note:warnings.length
        ? warnings.map(h => h.why).join(', ') + ' tespit edildi.'
        : (unsupported.length ? 'Brifingde geçmeyen sayı: ' + unsupported.join(', ') + '.' : ''),
    };
  }

  /* ------------------------------------------------------------- konusma */

  const HAFIZA_TUR = 8;

  function historyFor(agentId, extra){
    const list = (extra && extra.length ? extra : (S.officeChats[agentId] || []));
    return list.slice(-HAFIZA_TUR).map(m => ({
      role:m.role === 'user' ? 'user' : 'assistant',
      text:String(m.text || ''),
    })).filter(m => m.text);
  }

  async function ask(agentId, question, opts){
    const o = opts || {};
    const b = o.brief || brief(agentId);
    const fallback = { text:ruleText(agentId, b), source:'rules', brief:b };

    const cfg = cfgFor(agentId);
    if(!ESP.LLM.ready(cfg)) return fallback;

    /* Gecmis acikca kapatilabilir: toplantida her ajan gundeme TEK basina
       cevap verir, sohbet gecmisi oraya karismaz. */
    const gecmis = o.history === false ? [] : historyFor(agentId, o.history);

    try{
      const res = await ESP.LLM.chat(cfg, {
        system:systemPrompt(agentId, b),
        messages:gecmis.concat([{ role:'user', text:question || 'Durumu özetle.' }]),
        temperature:settings().temperature,
        maxTokens:o.maxTokens || 600,
      });
      const check = validate(res.text, { agentId, brief:b });
      if(!check.ok){
        return { text:fallback.text, source:'rules', brief:b,
          blocked:check, note:'Model çıktısı ev kurallarına takıldı: ' + check.note };
      }
      return { text:res.text.trim(), source:'model', brief:b, model:cfg.model };
    }catch(e){
      return Object.assign({}, fallback, {
        error:ESP.LLM.errorText ? ESP.LLM.errorText(e) : String(e && e.message || e) });
    }
  }

  /* Kullanicinin sorusunu ajana gonderir ve iki mesaji da gecmise yazar.

     Tuzak (devir notu §8.3): gecmisi ONCE yakala, sonra ekle. Soru once
     gecmise eklenip ask() sonra cagrilirsa soru sohbet gecmisinde iki kez
     gorunur ve model kendi kendine cevap vermis gibi olur. */
  async function send(agentId, question){
    const onceki = (S.officeChats[agentId] || []).slice();
    const res = await ask(agentId, question, { history:onceki });

    const liste = (S.officeChats[agentId] || []).concat([
      { role:'user', text:question, at:new Date().toISOString() },
      { role:'agent', text:res.text, source:res.source, at:new Date().toISOString(),
        blocked:res.blocked ? res.blocked.note : null, error:res.error || null },
    ]);
    S.officeChats[agentId] = liste.slice(-40);
    await ESP.Store.set('chats/' + agentId, { agentId, messages:S.officeChats[agentId] });
    return res;
  }

  async function clearChat(agentId){
    S.officeChats[agentId] = [];
    await ESP.Store.set('chats/' + agentId, { agentId, messages:[] });
  }

  /* ---------------------------------------------------------- masa notlari

     Not bir tavsiye degil BULGU'dur: kosul saglandiginda kendiliginden
     birakilir, kosul gectiginde kendiliginden kalkar. Kullanici silmez.

     Ayni masaya ayni cumleyle giden uc bulgu uc satir yazmaz: bilgi ayni,
     satir tek. Bes masa ayni notlari uretip kendi satirlarini suzuyordu;
     kare onbellegi bunu bire indirir. */
  function notes(agentId){
    const hepsi = ESP.Memo.of('office.notes', notesRaw);
    return agentId ? hepsi.filter(n => n.agent === agentId) : hepsi;
  }

  function notesRaw(){
    const out = [];
    const add = (agent, kind, text, route) => {
      const k = ESP.NOTE_TYPES.find(x => x.id === kind) || ESP.NOTE_TYPES[3];
      const a = ESP.AGENT_BY_ID[agent];
      out.push({ agent, name:a ? (a.short || a.name) : agent,
        kind, tone:k.tone, label:k.label, text, route:route || null });
    };

    /* --- dil --- */
    const d = ESP.SRS.deckStatus();
    if(d.overdue) add('polyglot', 'overdue',
      d.overdue + ' kartın vadesi geçti; en çok geciken ' + d.maxOverdueDays + ' gün.', 'lang');
    if(d.retention.cert !== 'missing'
       && d.retention.n >= ESP.Planner.RETENTION_MIN_CARDS
       && d.retention.value < ESP.Planner.RETENTION_FLOOR){
      add('polyglot', 'blocked',
        'Retansiyon ' + pct(d.retention.value) + ' — tabanın altında. Yeni kelime eklemek bunu daha da düşürür.', 'lang');
    }
    if(d.total && !d.due && d.retention.cert !== 'missing' && d.retention.value >= 0.8){
      add('polyglot', 'win', 'Vadesi gelen kart yok ve retansiyon ' + pct(d.retention.value) + '.', 'lang');
    }

    /* --- felsefe --- */
    const tikanan = ESP.Intellect.stalledArguments();
    if(tikanan.length === 1){
      add('socrates', 'blocked', 'Bir tez 14+ gündür açık ve dokunulmamış.', 'symposium');
    }else if(tikanan.length > 1){
      add('socrates', 'blocked', tikanan.length + ' tez 14+ gündür açık ve dokunulmamış.', 'symposium');
    }

    /* --- muzik --- */
    ESP.Acoustic.plateaus().slice(0, 3).forEach(p => {
      add('maestro', 'blocked', p.piece.name + ' ' + p.days + ' gündür '
        + p.bpm + ' BPM\'de duruyor.', 'studio');
    });
    (S.pieces || []).forEach(p => {
      if(p.targetBpm && p.cleanBpm && p.cleanBpm >= p.targetBpm
         && p.thresholdAt && U.diffDays(p.thresholdAt, U.todayISO()) <= 7){
        add('maestro', 'win', p.name + ' hedef tempoya ulaştı: ' + p.cleanBpm + ' BPM.', 'studio');
      }
    });

    /* --- diksiyon --- */
    const dik = ESP.Acoustic.dictionStatus(30);
    if(dik.cert === 'missing'){
      add('demosthenes', 'overdue', 'Son 30 günde diksiyon kaydı yok.', 'studio');
    }else{
      const t = ESP.Acoustic.dictionTrend();
      if(t.cert !== 'missing' && t.direction === 'iyi'){
        add('demosthenes', 'win', 'Hata oranı iki hafta öncesine göre düşüyor.', 'studio');
      }
    }

    /* --- okuma --- */
    const ss = ESP.Intellect.syntopic();
    const bagsiz = ss.total - ss.linked;
    if(bagsiz >= 3){
      add('aristoteles', 'overdue', bagsiz + ' not hiçbir yere bağlı değil.', 'library');
    }
    const oneri = ESP.Intellect.linkSuggestions(3);
    if(oneri.length){
      add('aristoteles', 'info', oneri.length + ' bağ önerisi bekliyor: ortak kavramı '
        + 'olan notlar var.', 'library');
    }

    /* --- yazi --- */
    const w = ESP.Intellect.wordsWritten(7);
    if(w.cert === 'missing'){
      add('montaigne', 'overdue', 'Son 7 günde yazı oturumu girilmemiş.', 'writing');
    }
    const dr = ESP.Intellect.draftRatio();
    if(dr.cert !== 'missing' && dr.drafts >= 3 && dr.value < 0.5){
      add('montaigne', 'info', dr.drafts + ' taslak var ama taslak başına '
        + U.fmtNum(Math.round(dr.value * 10) / 10) + ' revizyon düşüyor.', 'writing');
    }

    /* --- tarih --- */
    ESP.Chrono.findings().forEach(f => {
      const tur = f.tone === 'danger' ? 'blocked' : (f.tone === 'warn' ? 'overdue' : 'info');
      add('herodot', tur, f.text, 'history');
    });

    /* --- koc --- */
    ESP.DISCIPLINES.forEach(x => {
      const g = ESP.Curriculum.nextGate(x.id);
      if(g && g.action === 'measure'){
        add('mnemosyne', 'info', x.label + ': «' + g.gate.label + '» kapısı ölçülemiyor. '
          + 'İstenen şey çalışmak değil ölçmek.', x.route);
      }
    });
    (function(){
      const ov = ESP.Curriculum.overall();
      if(ov.cert !== 'missing' && ov.mastery >= 100){
        add('mnemosyne', 'win', 'Bütün merdivenlerin kapıları geçilmiş görünüyor.', 'analytics');
      }
    })();

    /* --- patron --- */
    const denge = ESP.Planner.balance(7);
    if(denge.skewed){
      add('patron', 'info', 'Haftanın pratiği ' + denge.top.label + ' tarafına yığılmış; '
        + denge.untouched.map(x => x.label).join(', ') + ' hiç açılmamış.', 'analytics');
    }
    ESP.Model.openDecisions().forEach(dec => {
      const gun = U.diffDays(dec.openedAt.slice(0, 10), U.todayISO());
      if(gun >= 2) add('patron', 'overdue', 'Karar ' + gun + ' gündür açık: ' + dec.text, 'meeting');
    });
    const seri = ESP.Model.streak();
    if(seri >= 7) add('patron', 'win', 'Seri ' + seri + ' gün.', 'today');

    return out;
  }

  /* ------------------------------------------------------ masalar arasi devir

     Bir masanin BULGUSU baska bir masanin ISI olabilir. Patron'un tek isi o
     devri gormek ve siraya koymaktir.

     Uc kural devri durust tutar:
       1. Devir bir tavsiye degildir — "su olculdu, su masaya dusuyor" der.
       2. Olculmemis bir sey devredilemez. Tahmin devir uretmez.
       3. Her satir tiklanabilir: bulgunun dustugu ekrani acar. */
  function handoffs(){
    return ESP.Memo.of('office.handoffs', handoffsRaw);
  }

  function handoffsRaw(){
    return ESP.Planner.crossFindings().map(c => {
      const from = ESP.AGENT_BY_ID[c.from], to = ESP.AGENT_BY_ID[c.to];
      return {
        id:c.id,
        from:c.from, fromName:from ? (from.short || from.name) : c.from,
        to:c.to, toName:to ? (to.short || to.name) : c.to,
        finding:c.text,
        route:c.route,
        tone:'info',
      };
    });
  }

  function handoffsFor(agentId){
    const hepsi = handoffs();
    return {
      out:hepsi.filter(h => h.from === agentId),
      in:hepsi.filter(h => h.to === agentId),
    };
  }

  /* ------------------------------------------------------------- gundem

     Gundem MODEL tarafindan secilmez: puanlama secer. Model yalnizca
     secilen gundemi konusur. */
  function agendaCandidates(){
    const out = [];
    const add = (id, puan, detay) => {
      const t = ESP.AGENDA_TYPES.find(x => x.id === id);
      if(t) out.push({ id, label:t.label, lead:t.lead, score:puan, detail:detay || '' });
    };

    const tikanan = ESP.Planner.blockedCore();
    if(tikanan.length) add('blocked', 100 + tikanan.length, tikanan[0].label);

    const r = ESP.SRS.retention();
    if(r.cert !== 'missing' && r.n >= ESP.Planner.RETENTION_MIN_CARDS
       && r.value < ESP.Planner.RETENTION_FLOOR){
      add('retention', 90, 'Retansiyon ' + pct(r.value) + ' (' + r.n + ' karttan).');
    }

    const acil = ESP.Planner.deadlines().filter(x => x.urgent);
    if(acil.length) add('deadline', 85, acil[0].goal.label + ' — ' + acil[0].daysLeft + ' gün.');

    const denge = ESP.Planner.balance(7);
    if(denge.skewed) add('balance', 60, denge.top.label + ' tarafına yığılma.');

    const ss = ESP.Intellect.syntopic();
    if(ss.total - ss.linked >= 3) add('synthesis', 50, (ss.total - ss.linked) + ' bağsız not.');

    const kapi = ESP.DISCIPLINES
      .map(x => ESP.Curriculum.nextGate(x.id))
      .filter(g => g && g.action === 'measure');
    if(kapi.length) add('gate', 55, kapi.length + ' kapı ölçülemiyor.');

    const tarih = ESP.Chrono.status();
    if(tarih.cert !== 'missing'
       && (tarih.kinds.empty.length || tarih.eras.empty.length)){
      add('coverage', 45, (tarih.eras.empty.concat(tarih.kinds.empty))[0] + ' boş.');
    }

    add('review', 10, 'Haftalık gözden geçirme.');
    return out.sort((a, b) => b.score - a.score);
  }

  /* ------------------------------------------------------- gunluk brifing

     Gunde TEK model cagrisi. Sonuc gune yazilir; ayni gun tekrar cagrilmaz.
     Model kapaliysa brifing yine uretilir — kural motorunun cumlesiyle. */
  async function dailyBriefing(dateISO){
    const gun = dateISO || U.todayISO();
    if(S.officeBriefings[gun]) return S.officeBriefings[gun];

    const b = patronBrief();
    const res = await ask('patron', 'Günün brifingini yaz. Önce bekleyen iş, sonra '
      + 'varsa dengesizlik, en son kazanım.', { brief:b, history:false, maxTokens:300 });

    const rec = { date:gun, text:res.text, source:res.source,
      at:new Date().toISOString(), next:b.next };
    S.officeBriefings[gun] = rec;
    await ESP.Store.set('briefings/' + gun, rec);
    return rec;
  }

  /* ------------------------------------------------------------- toplanti

     Gundem secilir, alti uzman sirayla konusur, Patron kapatir. Her tur ayri
     bir cagridir ve GELDIGI ANDA ekrana basilir — hepsinin bitmesi
     beklenmez. Uzun suren bir toplantida kullanici ilerlemeyi gorur.

     Kapanistaki karar ESP.Planner.nextAction()'dan gelir; Patron onu
     degistiremez, yalnizca gerekcelendirir. */
  async function runMeeting(agendaId, onTurn){
    const gundem = agendaCandidates().find(a => a.id === agendaId) || agendaCandidates()[0];
    const turlar = [];
    const uzmanlar = ESP.AGENTS.filter(a => a.id !== 'patron');

    for(const a of uzmanlar){
      const b = brief(a.id);
      const res = await ask(a.id, 'Toplantı gündemi: ' + gundem.label + '. ' + gundem.lead
        + ' Kendi masandan tek paragrafla katkı ver.',
        { brief:b, history:false, maxTokens:260 });
      const tur = { agentId:a.id, name:a.name, text:res.text, source:res.source,
        blocked:res.blocked ? res.blocked.note : null };
      turlar.push(tur);
      if(typeof onTurn === 'function') onTurn(tur);
    }

    const karar = ESP.Planner.nextAction();
    const pb = patronBrief();
    const kapanis = await ask('patron',
      'Uzmanların katkısını okudun. Çelişki varsa ESP.PRECEDENCE sırasına göre çöz. '
      + 'Kararı DEĞİŞTİRME, gerekçelendir. Karar: «' + karar.title + '» — ' + karar.why,
      { brief:pb, history:false, maxTokens:300 });

    const rec = {
      id:U.uid('mtg'), at:new Date().toISOString(),
      agenda:gundem.id, agendaLabel:gundem.label,
      turns:turlar,
      closing:{ text:kapanis.text, source:kapanis.source },
      decision:{ id:karar.id, title:karar.title, why:karar.why,
        route:karar.route, rank:karar.rank },
    };
    S.officeMeetings.unshift(rec);
    await ESP.Store.set('meetings/' + rec.id, rec);
    if(typeof onTurn === 'function') onTurn({ agentId:'patron', name:'Patron',
      text:kapanis.text, source:kapanis.source, closing:true });
    return rec;
  }

  /* ------------------------------------------------------------- yukleme */

  async function load(){
    S.office = Object.assign(defaults(), await ESP.Store.get('office'));
    S.officeChats = {};
    ((await ESP.Store.list('chats')) || []).forEach(row => {
      S.officeChats[row.agentId || row.id] = row.messages || [];
    });
    S.officeMeetings = ((await ESP.Store.list('meetings')) || [])
      .sort((a, b) => (a.at || '') < (b.at || '') ? 1 : -1);
    S.officeBriefings = {};
    ((await ESP.Store.list('briefings')) || []).forEach(row => {
      S.officeBriefings[row.date || row.id] = row;
    });
    return S.office;
  }

  return {
    defaults, settings, saveSettings, cfgFor, ready,
    brief, langBrief, philoBrief, musicBrief, dictionBrief, readingBrief,
    historyBrief, coachBrief,
    writingBrief, patronBrief,
    ruleText, systemPrompt, validate, ask, historyFor, HAFIZA_TUR,
    notes, handoffs, handoffsFor, agendaCandidates, dailyBriefing, runMeeting,
    send, clearChat, load,
  };
})();
