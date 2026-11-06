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
window.LIFEOS.PARCA.yazilar({
  'ays.core.quiz.siradaki-konular':'Sıradaki konular',
  'ays.core.quiz.kaliciligi-sinanacak-konular':'Bugün kalıcılığı sınanacak konular, karışık',
});

window.LIFEOS.PARCA.yazilar({
  'ays.core.quiz.bu-secimde-sinanacak-madde-y':'Bu seçimde sınanacak madde yok. Önce kart üret ya da ders notu ekle.',
  'ays.core.quiz.geri-cagirma-saglam-bu-konud':'Geri çağırma sağlam. Bu konuda tekrar aralığını uzatabilirsin.',
  'ays.core.quiz.yaridan-fazlasi-geldi-ama-bo':'Yarıdan fazlası geldi ama boşluk var. Bilinmeyenler karta düştü.',
  'ays.core.quiz.geri-cagirma-zayif-konu-bili':'Geri çağırma zayıf. Konu "biliyorum" hissi veriyor ama üretilmiyor — kartlarla tekrar et.',
});

window.LIFEOS.PARCA.yazilar({
  'ays.core.quiz.bugunun-kartlari':'Bugünün kartları',
  'ays.core.quiz.tekrar-takviminde-bugune-dus':'Tekrar takviminde bugüne düşenler',
  'ays.core.quiz.ders':'Ders',
  'ays.core.quiz.sectigin-dersin-tum-kartlari':'Seçtiğin dersin tüm kartları',
  'ays.core.quiz.konu':'Konu',
  'ays.core.quiz.tek-konuya-odaklan':'Tek konuya odaklan',
  'ays.core.quiz.yanlis-defteri':'Yanlış defteri',
  'ays.core.quiz.kapanmamis-yanlislarin-ilkel':'Kapanmamış yanlışların ilkeleri',
  'ays.core.quiz.ders-notlari':'Ders notları',
  'ays.core.quiz.video-notlarindan-geri-cagir':'Video notlarından geri çağırma',
  'ays.core.quiz.karisik':'Karışık',
  'ays.core.quiz.hepsinden-rastgele-sinav-ben':'Hepsinden rastgele — sınav benzeri',
  'ays.core.quiz.zayif-konular':'Zayıf konular',
  'ays.core.quiz.acik-yanlisi-en-cok-olan':'Açık yanlışı en çok olan 3 konu (ölçümden)',
  'ays.core.quiz.acik-uclu':'Açık uçlu',
  'ays.core.quiz.cevabi-kendin-uret-en':'Cevabı kendin üret — en zoru, en öğreticisi',
  'ays.core.quiz.coktan-secmeli':'Çoktan seçmeli',
  'ays.core.quiz.siklardan-ele-sinav-bicimine':'Şıklardan ele — sınav biçimine yakın',
});


window.R = window.R || {};

R.Quiz = (function(){
  const U = R.U, M = R.Model, S = R.S;

  const MODES = {
    due:      { label:yz('ays.core.quiz.bugunun-kartlari'), note:yz('ays.core.quiz.tekrar-takviminde-bugune-dus') },
    subject:  { label:yz('ays.core.quiz.ders'),             note:yz('ays.core.quiz.sectigin-dersin-tum-kartlari') },
    topic:    { label:yz('ays.core.quiz.konu'),             note:yz('ays.core.quiz.tek-konuya-odaklan') },
    errors:   { label:yz('ays.core.quiz.yanlis-defteri'),   note:yz('ays.core.quiz.kapanmamis-yanlislarin-ilkel') },
    notes:    { label:yz('ays.core.quiz.ders-notlari'),     note:yz('ays.core.quiz.video-notlarindan-geri-cagir') },
    mixed:    { label:yz('ays.core.quiz.karisik'),          note:yz('ays.core.quiz.hepsinden-rastgele-sinav-ben') },
    zayif:    { label:yz('ays.core.quiz.zayif-konular'),    note:yz('ays.core.quiz.acik-yanlisi-en-cok-olan') },
    siradaki: { label:yz('ays.core.quiz.siradaki-konular'), note:yz('ays.core.quiz.kaliciligi-sinanacak-konular') },
  };

  /* ---------- kalıcılık (brand/ortak/usta.js) ----------
     Beceri konudur. Yeni kayıt yok: kart geçmişi ve çözülen soru blokları kanıta çevrilir.
     Bir konunun o günkü kanıtı TEKtir: doğruluk ≥ R.CLOSURE_RULE.second (planın kapanış
     eşiği) ise isabet. Tek yanlış kart konunun bütün zincirini kesmesin diye gün gün toplanır. */
  const kartKaniti = card => (card.history || []).map(h => ({ g:String(h.at).slice(0, 10),
    isabet:h.rating !== 'forgot', guven:h.guven, karisik:h.karisik }));

  function konuBecerileri(){
    const gun = {};
    const yaz = (anahtar, g, dogru, toplam, x) => {
      const k = gun[anahtar] = gun[anahtar] || {};
      const o = k[g] = k[g] || { d:0, n:0, karisik:false, eminYanlis:false };
      o.d += dogru; o.n += toplam;
      if(x && x.karisik) o.karisik = true;
      if(x && x.guven === 'emin' && !x.isabet) o.eminYanlis = true;
    };
    S.cards.forEach(c => { if(c.subjectId && c.topic) kartKaniti(c).forEach(k => yaz(c.subjectId + '|' + c.topic, k.g, k.isabet ? 1 : 0, 1, k)); });
    const adlar = {};
    R.SUBJECTS.forEach(s => s.topics.forEach(t => { adlar[s.id + '/' + t.id] = t.name; }));
    Object.keys(S.days || {}).forEach(g => ((S.days[g] || {}).blocks || []).forEach(b => {
      const ad = adlar[b.subjectId + '/' + b.topicId];
      /* Doğru sayısı yazılmamış blok sıfır doğru değildir, kanıt da değildir. */
      if(ad && b.actualQ > 0 && b.correctQ != null) yaz(b.subjectId + '|' + ad, g, b.correctQ, b.actualQ);
    }));
    /* Öğrenme motoru, Öğren soruları ve karma testler de kanıttır (ortak/ogrenmotor.js). */
    const OM = window.LIFEOS.OGRENMOTOR;
    if(OM && OM.kuruluMu()) R.SUBJECTS.forEach(s => s.topics.forEach(t => OM.kanitlar(t.id).forEach(k => yaz(s.id + '|' + t.name, k.g, k.isabet ? 1 : 0, 1, k))));
    const esik = R.CLOSURE_RULE.second / 100, kartli = {};
    S.cards.forEach(c => { kartli[c.subjectId + '|' + c.topic] = true; });
    const cikti = [];
    R.SUBJECTS.forEach(s => s.topics.forEach(t => {
      const id = s.id + '|' + t.name, k = gun[id] || {};
      cikti.push({ id, grup:s.id, ad:t.name, kartli:!!kartli[id], kanitlar:Object.keys(k).map(g => ({ g,
        isabet:k[g].d / k[g].n >= esik, karisik:k[g].karisik, guven:k[g].eminYanlis ? 'emin' : undefined })) });
    }));
    return cikti;
  }

  /* Sınanabilir, yani kartı olan konulardan bugünün sırası. */
  function siradaki(n){
    const b = konuBecerileri().filter(x => x.kartli);
    return window.LIFEOS.USTA.sira(b, U.todayISO(), n || 5)
      .map(x => Object.assign(x, { ad:b.find(y => y.id === x.id).ad }));
  }

  function konuKalicilik(){
    const Us = window.LIFEOS.USTA;
    return { harita:Us.harita(konuBecerileri(), U.todayISO()),
      guven:Us.kalibrasyon([].concat.apply([], S.cards.map(kartKaniti))) };
  }

  /* Zayıf konu ÖLÇÜMDEN gelir (fikir 23): açık yanlışı en çok olan konular.
     Yanlış yoksa zayıf konu da yoktur — tahmin edilmez. */
  function zayifKonular(n){
    const say = {};
    R.Calc.openErrors().forEach(e => {
      const k = e.topic || null;
      if(k) say[k] = (say[k] || 0) + 1;
    });
    return Object.keys(say).sort((a, b) => say[b] - say[a] || a.localeCompare(b, 'tr'))
      .slice(0, n || 3).map(k => ({ konu:k, acikYanlis:say[k] }));
  }

  const SIZES = [5, 10, 20];

  /* Sınama biçimi: açık uçlu (üret) ya da çoktan seçmeli (tanı + ele).
     ÖSYM çoktan seçmelidir; ikisi farklı beceri ölçer, ikisi de gerekir. */
  const FORMATS = {
    open:   { id:'open',   name:yz('ays.core.quiz.acik-uclu'), note:yz('ays.core.quiz.cevabi-kendin-uret-en') },
    choice: { id:'choice', name:yz('ays.core.quiz.coktan-secmeli'), note:yz('ays.core.quiz.siklardan-ele-sinav-bicimine') },
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
    }else if(mode === 'zayif'){
      const adlar = zayifKonular(3).map(x => x.konu);
      items = S.cards.filter(c => adlar.indexOf(c.topic) >= 0).map(fromCard)
        .concat(C.openErrors().filter(e => adlar.indexOf(e.topic) >= 0 && (e.principle || e.recipe))
          .map(fromError));
    }else if(mode === 'siradaki'){
      const sec = siradaki(5).map(x => x.id);
      items = S.cards.filter(c => sec.indexOf(c.subjectId + '|' + c.topic) >= 0).map(fromCard);
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
    /* Emin olup yanıldığın kart oturuma kesin girer: en kolay düzelen ama geri dönebilen hata. */
    const kritikKart = {};
    S.cards.forEach(c => { if(window.LIFEOS.USTA.asama(kartKaniti(c)).kritik) kritikKart[c.id] = true; });
    let items = all.filter(i => kritikKart[i.cardId])
      .concat(shuffle(all.filter(i => !kritikKart[i.cardId]))).slice(0, size);

    /* Karışık tekrar: aynı konudan iki madde peş peşe gelmesin.
       ÖSYM sana konu başlığı vermiyor; ard arda aynı konu yanıltıcı kolaylık üretir. */
    if(o.interleave !== false) items = interleave(items);

    if(!items.length){
      session = null;
      return { ok:false, reason:yz('ays.core.quiz.bu-secimde-sinanacak-madde-y') };
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
      /* Tek ders ya da tek konu sınaması başlığı baştan söyler; karışık sayılmaz. */
      karisik:o.interleave !== false && o.mode !== 'subject' && o.mode !== 'topic',
      guven:null,
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
  /* Cevaptan önce; ikinci dokunuş kaldırır. İşaretsiz cevap güven oranına girmez. */
  function guven(){ return session ? session.guven : null; }
  function guvenSec(v){ if(session) session.guven = session.guven === v ? null : v; }

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
      subjectId:item.subjectId, seconds:questionSeconds(), picked:session.picked, guven:session.guven });

    if(item.cardId){
      const card = S.cards.find(c => c.id === item.cardId);
      if(card){
        const ek = {};
        if(session.guven) ek.guven = session.guven;
        if(session.karisik) ek.karisik = true;
        M.schedule(card, verdict === 'known' ? 'remembered' : verdict === 'shaky' ? 'hard' : 'forgot', ek);
        await M.saveCard(card);
      }
    }

    session.revealed = false;
    session.guven = null;
    session.picked = null;
    session.questionStartedMs = Date.now();
    session.index++;
    if(session.index >= session.items.length) return await finish();
    return { done:false, next:current() };
  }

  /* Son maddeyi atlamak da oturumu BİTİRİR — önce bitirmiyordu. `answer()`
     son maddede `finish()`i çağırırken `skip()` yalnız `index`i ileri
     alıyordu; sınırda `index === items.length` olunca `current()` `null`
     dönüyor, ekran kuruluma dönüyor ama oturum bellekte ASILI kalıyordu.
     Kaybolan şey özet değildi yalnız: o oturumdaki "bilmiyordum"
     maddeleri için kart açan `ensureCards()` hiç çalışmıyordu — tekrar
     döngüsü sessizce kapanmıyordu, hiç açılmıyordu. */
  async function skip(){
    if(!session) return null;
    session.revealed = false;
    session.guven = null;
    session.picked = null;
    session.questionStartedMs = Date.now();
    session.index = Math.min(session.index + 1, session.items.length);
    if(session.index >= session.items.length) return await finish();
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
        ? yz('ays.core.quiz.geri-cagirma-saglam-bu-konud')
        : score >= 55
        ? yz('ays.core.quiz.yaridan-fazlasi-geldi-ama-bo')
        : yz('ays.core.quiz.geri-cagirma-zayif-konu-bili'),
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
      zayif:pool({ mode:'zayif' }).length,
      siradaki:pool({ mode:'siradaki' }).length,
    };
  }

  return { MODES, SIZES, FORMATS, TIMERS, pool, start, active, current, reveal, isRevealed,
    pick, pickedIndex, format, questionSeconds, questionLeft, timeout,
    progress, answer, skip, finish, cancel, availability, zayifKonular,
    guven, guvenSec, kartKaniti, konuBecerileri, siradaki, konuKalicilik };
})();
