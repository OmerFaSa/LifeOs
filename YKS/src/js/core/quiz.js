/* Kendini sınama motoru.

   Neden var: kart çevirmek "tanıma"dır, sınav "geri çağırma" ister.
   Aday kartı görünce "biliyorum" der, sınavda aynı soruyu yapamaz.
   Quiz bu farkı ölçer: önce cevabı yazdırır/seçtirir, sonra gösterir.

   Kaynaklar (hepsi sistemde zaten var, yeni veri türü üretilmez):
     - tekrar kartları (ön/arka yüz)
     - yanlış defteri (kök neden → doğru ilke)
     - video notları (zaman damgalı segmentler)

   Sonuç kural motoruna bağlanır:
     - bilinmeyen madde → kartın SRS aşaması düşer (schedule 'forgot')
     - kart yoksa yeni kart açılır
     - oturum özeti konu risk skoruna girdi olur

   Karar motoru burada da otoritedir; LLM soru üretebilir ama puanlamaz. */

window.R = window.R || {};

R.Quiz = (function(){
  const U = R.U, M = R.Model, S = R.S;

  const MODES = {
    due:      { label:'Bugünün kartları', note:'Tekrar takviminde bugüne düşenler' },
    subject:  { label:'Ders',             note:'Seçtiğin dersin tüm kartları' },
    topic:    { label:'Konu',             note:'Tek konuya odaklan' },
    errors:   { label:'Yanlış defteri',   note:'Kapanmamış yanlışların ilkeleri' },
    notes:    { label:'Ders notları',     note:'Video notlarından geri çağırma' },
    mixed:    { label:'Karışık',          note:'Hepsinden rastgele — sınav benzeri' },
  };

  const SIZES = [5, 10, 20];

  /* Sınama biçimi: açık uçlu (üret) ya da çoktan seçmeli (tanı + ele).
     ÖSYM çoktan seçmelidir; ikisi farklı beceri ölçer, ikisi de gerekir. */
  const FORMATS = {
    open:   { id:'open',   name:'Açık uçlu', note:'Cevabı kendin üret — en zoru, en öğreticisi' },
    choice: { id:'choice', name:'Çoktan seçmeli', note:'Şıklardan ele — sınav biçimine yakın' },
  };

  /* Süre baskısı: bildiğin ama yetiştiremediğin konuyu ayırır. */
  const TIMERS = [0, 20, 45, 90];

  /* Oturum yalnizca bellekte durur; bitince sonuc kalici kayitlara yazilir.
     Yarim kalan oturum kaydedilmez — yarim sinav veri kirletir. */
  let session = null;

  /* Çoktan seçmeli için çeldirici: aynı konudan, benzer uzunlukta başka cevaplar. */
  function distractors(item, pool_, n){
    const want = n || 3;
    const same = pool_.filter(x => x.id !== item.id && x.answer && x.answer !== item.answer);
    const sameTopic = same.filter(x => x.topic && x.topic === item.topic);
    const rest = same.filter(x => !x.topic || x.topic !== item.topic);
    const pick = shuffle(sameTopic).slice(0, want);
    if(pick.length < want) pick.push.apply(pick, shuffle(rest).slice(0, want - pick.length));
    return pick.slice(0, want).map(x => x.answer);
  }

  function buildChoices(item, pool_){
    const wrong = distractors(item, pool_, 3);
    if(wrong.length < 2) return null;                 // yeterli çeldirici yoksa açık uçlu kal
    const all = shuffle([item.answer].concat(wrong));
    return { options:all, correct:all.indexOf(item.answer) };
  }

  /* ---------- madde üretimi ---------- */

  function fromCard(card){
    return {
      id:'c:'+card.id,
      kind:'card',
      prompt:card.front,
      answer:card.back || '—',
      topic:card.topic || '',
      subjectId:card.subjectId || null,
      cardId:card.id,
      sourceLabel:card.source === 'error' ? 'yanlış defterinden'
        : card.source === 'note' ? 'ders notundan' : 'kart',
    };
  }

  function fromError(err){
    const label = err.topic || err.testName || 'Yanlış';
    return {
      id:'e:'+err.id,
      kind:'error',
      prompt:label + ' — "' + (err.rootCause || 'kök neden yazılmadı') + '" hatasında doğru ilke neydi?',
      answer:err.principle || err.recipe || '—',
      topic:err.topic || '',
      subjectId:err.subjectId || null,
      errorId:err.id,
      sourceLabel:'yanlış defteri',
    };
  }

  function fromSegment(note, seg, i){
    const topic = M.noteTopicName(note);
    const tag = (M.SEGMENT_TAGS[seg.tag] || M.SEGMENT_TAGS.not).label.toLowerCase();
    return {
      id:'n:'+note.id+':'+i,
      kind:'note',
      prompt:(topic ? topic + ' — ' : '') + M.fmtTs(seg.ts) + ' anındaki ' + tag + ' neydi?',
      answer:seg.text,
      topic,
      subjectId:note.subjectId || null,
      noteId:note.id,
      sourceLabel:'ders notu',
    };
  }

  /* Kaynak havuzu — moda gore toplanir, karistirilir, kirpilir. */
  function pool(opts){
    const o = opts || {};
    const mode = o.mode || 'due';
    const C = R.Calc;
    let items = [];

    if(mode === 'due'){
      items = C.dueCards().map(fromCard);
    }else if(mode === 'subject'){
      items = S.cards.filter(c => c.subjectId === o.subjectId).map(fromCard);
    }else if(mode === 'topic'){
      const subject = R.SUBJECTS.find(s => s.id === o.subjectId);
      const topic = subject ? subject.topics.find(t => t.id === o.topicId) : null;
      const name = topic ? topic.name : null;
      items = S.cards.filter(c => c.subjectId === o.subjectId && (!name || c.topic === name)).map(fromCard);
      S.videoNotes.filter(n => n.subjectId === o.subjectId && (!o.topicId || n.topicId === o.topicId))
        .forEach(n => n.segments.forEach((seg, i) => items.push(fromSegment(n, seg, i))));
    }else if(mode === 'errors'){
      items = C.openErrors().filter(e => e.principle || e.recipe).map(fromError);
    }else if(mode === 'notes'){
      S.videoNotes.forEach(n => n.segments.forEach((seg, i) => items.push(fromSegment(n, seg, i))));
    }else{ // mixed
      items = S.cards.map(fromCard)
        .concat(C.openErrors().filter(e => e.principle).map(fromError));
      S.videoNotes.forEach(n => n.segments.forEach((seg, i) => items.push(fromSegment(n, seg, i))));
    }

    return items.filter(x => x.answer && x.answer !== '—');
  }

  /* Deterministik olmayan ama tekrar edilebilir karistirma:
     ayni saniyede iki kez baslatilirsa ayni sirayi vermesin diye Math.random. */
  function shuffle(list){
    const a = list.slice();
    for(let i = a.length-1; i > 0; i--){
      const j = Math.floor(Math.random()*(i+1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- oturum ---------- */

  function start(opts){
    const o = opts || {};
    const size = Number(o.size) > 0 ? Math.min(Math.floor(Number(o.size)), 100) : 10;
    const format = FORMATS[o.format] ? o.format : 'open';
    const perQuestion = TIMERS.indexOf(Number(o.seconds)) >= 0 ? Number(o.seconds) : 0;

    const all = pool(o);
    let items = shuffle(all).slice(0, size);

    /* Karışık tekrar: aynı konudan iki madde peş peşe gelmesin.
       ÖSYM sana konu başlığı vermiyor; ard arda aynı konu yanıltıcı kolaylık üretir. */
    if(o.interleave !== false) items = interleave(items);

    if(!items.length){
      session = null;
      return { ok:false, reason:'Bu seçimde sınanacak madde yok. Önce kart üret ya da ders notu ekle.' };
    }

    if(format === 'choice'){
      items = items.map(it => {
        const ch = buildChoices(it, all);
        return ch ? Object.assign({}, it, { choices:ch.options, correct:ch.correct }) : it;
      });
    }

    session = {
      mode:o.mode || 'due',
      format, perQuestion,
      subjectId:o.subjectId || null,
      topicId:o.topicId || null,
      items,
      index:0,
      revealed:false,
      picked:null,
      questionStartedMs:Date.now(),
      timedOut:0,
      results:[],
      startedAt:new Date().toISOString(),
      startedMs:Date.now(),
    };
    return { ok:true, total:items.length, format, perQuestion };
  }

  /* Aynı konudan ard arda gelmeyi engelle; mümkün değilse sırayı bozmadan bırak. */
  function interleave(list){
    const out = [];
    const rest = list.slice();
    let lastTopic = null;
    while(rest.length){
      let idx = rest.findIndex(x => !x.topic || x.topic !== lastTopic);
      if(idx < 0) idx = 0;
      const item = rest.splice(idx, 1)[0];
      lastTopic = item.topic || null;
      out.push(item);
    }
    return out;
  }

  function active(){ return session; }
  function current(){ return session ? session.items[session.index] : null; }
  function reveal(){ if(session) session.revealed = true; }
  function pick(i){
    if(!session || session.revealed) return null;
    session.picked = i;
    session.revealed = true;
    const item = current();
    return { correct:item && item.correct === i, correctIndex:item ? item.correct : null };
  }
  function pickedIndex(){ return session ? session.picked : null; }
  function format(){ return session ? session.format : 'open'; }
  function questionSeconds(){
    if(!session) return 0;
    return Math.floor((Date.now() - session.questionStartedMs)/1000);
  }
  function questionLeft(){
    if(!session || !session.perQuestion) return null;
    return Math.max(0, session.perQuestion - questionSeconds());
  }
  function isRevealed(){ return !!(session && session.revealed); }

  function progress(){
    if(!session) return null;
    return {
      index:session.index, total:session.items.length,
      answered:session.results.length,
      pct:U.pct(session.results.length, session.items.length),
      seconds:Math.round((Date.now() - session.startedMs)/1000),
    };
  }

  /* Cevap kaydi. Kart tabanli maddede SRS aşaması da guncellenir:
     bilinmeyen madde tekrar takviminde one cekilir. */
  async function answer(verdict){
    if(!session) return null;
    const item = current();
    if(!item) return null;

    session.results.push({ itemId:item.id, verdict, kind:item.kind, topic:item.topic,
      subjectId:item.subjectId, seconds:questionSeconds(), picked:session.picked });

    if(item.cardId){
      const card = S.cards.find(c => c.id === item.cardId);
      if(card){
        M.schedule(card, verdict === 'known' ? 'remembered' : verdict === 'shaky' ? 'hard' : 'forgot');
        await M.saveCard(card);
      }
    }

    session.revealed = false;
    session.picked = null;
    session.questionStartedMs = Date.now();
    session.index++;
    if(session.index >= session.items.length) return await finish();
    return { done:false, next:current() };
  }

  function skip(){
    if(!session) return null;
    session.revealed = false;
    session.picked = null;
    session.questionStartedMs = Date.now();
    session.index = Math.min(session.index + 1, session.items.length);
    return current();
  }

  /* Süre dolunca madde otomatik "bilmiyordum" sayılır — sınavdaki gibi. */
  async function timeout(){
    if(!session) return null;
    session.timedOut++;
    session.revealed = true;
    return await answer('unknown');
  }

  /* ---------- bitiş ve sonuç ---------- */

  /* Bilinmeyen madde icin kart yoksa acilir: sinav bosluk gosterir,
     bosluk kapatilmadan biten oturum ise yalniz moral kirar. */
  async function ensureCards(res){
    const created = [];
    for(const r of res){
      if(r.verdict === 'known') continue;
      const item = session.items.find(x => x.id === r.itemId);
      if(!item || item.cardId) continue;

      const card = M.newCard({
        front:item.prompt,
        back:item.answer,
        topic:item.topic,
        subjectId:item.subjectId,
        source:item.kind === 'error' ? 'error' : 'note',
        sourceRef:item.errorId || item.noteId || null,
      });
      await M.saveCard(card);
      created.push(card);
    }
    return created;
  }

  async function finish(){
    if(!session) return null;
    const res = session.results;
    const known = res.filter(r => r.verdict === 'known').length;
    const shaky = res.filter(r => r.verdict === 'shaky').length;
    const unknown = res.filter(r => r.verdict === 'unknown').length;
    const created = await ensureCards(res);

    // Zayif konular: iki ve uzeri bilinmeyen/sallantili madde ureten konular.
    const byTopic = {};
    res.forEach(r => {
      if(!r.topic) return;
      byTopic[r.topic] = byTopic[r.topic] || { topic:r.topic, total:0, miss:0 };
      byTopic[r.topic].total++;
      if(r.verdict !== 'known') byTopic[r.topic].miss++;
    });
    const weak = Object.values(byTopic).filter(t => t.miss >= 2)
      .sort((a, b) => b.miss - a.miss).slice(0, 3);

    const total = res.length || 1;
    const score = U.pct(known, total);
    const times = res.map(r => r.seconds).filter(x => x != null && x >= 0);
    const medianTime = U.median(times);
    const summary = {
      mode:session.mode,
      total:res.length, known, shaky, unknown, score,
      seconds:Math.round((Date.now() - session.startedMs)/1000),
      format:session.format,
      perQuestion:session.perQuestion,
      timedOut:session.timedOut,
      medianTime:medianTime == null ? null : Math.round(medianTime),
      createdCards:created.length,
      weak,
      verdict:score >= 80 ? 'strong' : score >= 55 ? 'ok' : 'weak',
      note:score >= 80
        ? 'Geri çağırma sağlam. Bu konuda tekrar aralığını uzatabilirsin.'
        : score >= 55
        ? 'Yarıdan fazlası geldi ama boşluk var. Bilinmeyenler karta düştü.'
        : 'Geri çağırma zayıf. Konu "biliyorum" hissi veriyor ama üretilmiyor — kartlarla tekrar et.',
      finishedAt:new Date().toISOString(),
    };

    session = null;
    return { done:true, summary };
  }

  function cancel(){ session = null; }

  /* Bir sinav baslatilabilir mi? Ekran bunu sorup dugmeyi kilitler. */
  function availability(){
    return {
      due:pool({ mode:'due' }).length,
      errors:pool({ mode:'errors' }).length,
      notes:pool({ mode:'notes' }).length,
      mixed:pool({ mode:'mixed' }).length,
    };
  }

  return { MODES, SIZES, FORMATS, TIMERS, pool, start, active, current, reveal, isRevealed,
    pick, pickedIndex, format, questionSeconds, questionLeft, timeout,
    progress, answer, skip, finish, cancel, availability };
})();
