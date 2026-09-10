/* Soru cozucu motoru — soruyu modele goturur, ciktisini DENETLER, kaydeder.

   Katmanlar:
     prepareImage(file)  fotograf → kucultulmus base64 (tarayicida)
     solve(istek)        model cagrisi → { text, meta }
     parse(text)         anlatim ile makine kuyrugunu ayirir
     verify(meta)        modelin bildirdigini KAPALI KATALOGA oturtur
     save/list/remove    kayit

   ILKE: model uydurabilir, kural motoru dogrular.
   Cozum metni modelden gelir — bir soruyu cozmek hesap isidir ve orada
   modele mecburuz. Ama modelin bildirdigi DERS ve KONU kapali katalogdan
   (R.SUBJECTS) secilir, ZORLUK kapali olcekten gelir. Eslesmeyen deger
   kayda girmez, bos kalir ve kullaniciya sorulur.

   Neden: bu kayitlar konu takibini ve kaynak zorlugunu besliyor.
   Uydurulmus tek bir konu adi butun o hesabi sessizce bozar. */

window.R = window.R || {};

R.Solver = (function(){
  const U = R.U, S = R.S;

  /* Fotograf gonderilmeden once kucultulur. Ham telefon fotografi 4-8 MB
     eder; base64 bunu bir kat daha buyutur ve istek ya reddedilir ya da
     dakikalik jeton sinirini tek basina doldurur. */
  const MAX_EDGE = 1400;
  const JPEG_Q = 0.82;
  /* Kucultmeden sonra bile bu kadari asan gorsel gonderilmez. */
  const MAX_BYTES = 3 * 1024 * 1024;

  const MAX_RECORDS = 500;

  /* ---------- kapali katalog ---------- */

  /* Modele verilen ders/konu listesi. Kapali katalog olmadan model konu adi
     UYDURUR ve kayit konu takibine baglanamaz. */
  function catalogText(){
    return R.SUBJECTS.map(s =>
      s.name + ': ' + s.topics.map(t => t.name).join(' | ')
    ).join('\n');
  }

  /* Modelin yazdigi ders/konu adini gercek kayda oturtur.
     Once tam eslesme, sonra normalize edilmis eslesme, sonra icerme.
     Hicbiri tutmazsa null — TAHMIN YURUTULMEZ. */
  function matchTopic(dersAdi, konuAdi){
    const d = U.norm(dersAdi || '');
    const k = U.norm(konuAdi || '');
    if(!k) return null;

    const subjects = d
      ? R.SUBJECTS.filter(s => U.norm(s.name) === d)
          .concat(R.SUBJECTS.filter(s => U.norm(s.name) !== d && U.norm(s.name).indexOf(d) >= 0))
      : R.SUBJECTS;
    const pool = (subjects.length ? subjects : R.SUBJECTS);

    let hit = null;
    pool.some(s => s.topics.some(t => {
      if(U.norm(t.name) === k){ hit = { subject:s, topic:t }; return true; }
      return false;
    }));
    if(hit) return hit;

    /* Icerme: "Sozcukte anlam" ile "Sozcukte anlam (esanlam)" eslesir.
       Iki tarafli bakilir ama en KISA eslesme secilir; boylece genis bir
       konu adi dar bir konuyu yutmaz. */
    let best = null;
    pool.forEach(s => s.topics.forEach(t => {
      const n = U.norm(t.name);
      if(n.length < 4 || k.length < 4) return;
      if(n.indexOf(k) < 0 && k.indexOf(n) < 0) return;
      if(!best || n.length < U.norm(best.topic.name).length) best = { subject:s, topic:t };
    }));
    return best;
  }

  /* ---------- cikti ayrimi ---------- */

  /* Anlatim ile makine kuyrugunu ayirir. Kuyruk SON satirda, tek JSON
     nesnesi olarak beklenir; model onu kod cercevesine alabilir. */
  function parse(text){
    const raw = String(text || '').trim();
    if(!raw) return { text:'', meta:null };

    /* Sondan geriye dogru ilk gecerli JSON nesnesi aranir. */
    const fence = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```\s*$/);
    if(fence){
      const meta = tryJson(fence[1]);
      if(meta) return { text:raw.slice(0, fence.index).trim(), meta };
    }
    const start = raw.lastIndexOf('{');
    if(start > 0){
      const end = raw.lastIndexOf('}');
      if(end > start){
        const meta = tryJson(raw.slice(start, end + 1));
        if(meta) return { text:raw.slice(0, start).trim(), meta };
      }
    }
    return { text:raw, meta:null };
  }

  function tryJson(s){
    try{
      const o = JSON.parse(s);
      return (o && typeof o === 'object' && !Array.isArray(o)) ? o : null;
    }catch(e){ return null; }
  }

  /* Modelin bildirdigini kapali katalogla dogrular.
     Donen nesnede yalnizca DOGRULANMIS alanlar bulunur. */
  function verify(meta){
    const m = meta || {};
    const hit = matchTopic(m.ders, m.konu);
    const zorluk = Number(m.zorluk);
    return {
      subjectId: hit ? hit.subject.id : null,
      subjectName: hit ? hit.subject.name : '',
      topicId: hit ? hit.topic.id : null,
      topicName: hit ? hit.topic.name : '',
      /* Model listede olmayan bir konu yazdiysa ham hâli saklanir ama
         KAYDA baglanmaz: kullanici duzeltebilsin diye gosterilir. */
      rawTopic: hit ? '' : String(m.konu || '').slice(0, 80),
      difficulty: R.DIFFICULTY[zorluk] ? zorluk : null,
      answer: String(m.cevap == null ? '' : m.cevap).slice(0, 80),
      trap: String(m.tuzak == null ? '' : m.tuzak).slice(0, 240),
      matched: !!hit,
    };
  }

  /* ---------- fotograf ---------- */

  function readFile(file){
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(Object.assign(new Error('dosya okunamadi'), { code:'file' }));
      fr.readAsDataURL(file);
    });
  }

  function loadImage(url){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(Object.assign(new Error('görsel açılamadı'), { code:'image' }));
      img.src = url;
    });
  }

  /* Fotografi kucultup base64'e cevirir.
     Donen: { mime, data, width, height, bytes, previewUrl } */
  async function prepareImage(file){
    if(!file) throw Object.assign(new Error('dosya yok'), { code:'file' });
    if(!/^image\//.test(file.type || '')){
      throw Object.assign(new Error('bu bir görsel değil'), { code:'not_image' });
    }
    const url = await readFile(file);
    const img = await loadImage(url);

    const edge = Math.max(img.width, img.height);
    const scale = edge > MAX_EDGE ? MAX_EDGE / edge : 1;
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    let out;
    try{
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      /* Beyaz zemin: seffaf PNG'ler JPEG'de siyaha donuyordu. */
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      out = canvas.toDataURL('image/jpeg', JPEG_Q);
    }catch(e){
      /* Tuval kullanilamiyorsa (cok eski tarayici) ham dosya gonderilir. */
      out = url;
    }

    const comma = out.indexOf(',');
    const head = out.slice(0, comma);
    const data = out.slice(comma + 1);
    const mime = (head.match(/^data:([^;]+)/) || [])[1] || 'image/jpeg';
    const bytes = Math.round(data.length * 3 / 4);
    if(bytes > MAX_BYTES){
      throw Object.assign(new Error('görsel çok büyük'), { code:'too_big' });
    }
    return { mime, data, width:w, height:h, bytes, previewUrl:out };
  }

  /* ---------- cagri ---------- */

  /* Gorselli istek icin gorsel okuyabilen bir zincir kurulur; metin
     istegi icin ofisin normal zinciri yeter. */
  function chainFor(withImage){
    const cfg = R.Office.agentConfig('analist');
    if(!withImage) return R.Office.chainFor('analist');
    const chain = R.LLM.visionChain(cfg);
    return chain;
  }

  function ready(withImage){ return chainFor(withImage).length > 0; }

  /* req: { question, image, note, follow, previous } */
  async function solve(req, opts){
    const o = opts || {};
    const r = req || {};
    const withImage = !!r.image;
    const chain = chainFor(withImage);

    if(!chain.length){
      throw Object.assign(new Error(withImage
        ? 'Görsel okuyabilen bir model bağlı değil'
        : 'Model bağlı değil'), { code:withImage ? 'no_vision' : 'unavailable' });
    }
    if(!withImage && !String(r.question || '').trim()){
      throw Object.assign(new Error('soru yok'), { code:'empty' });
    }

    const subjects = catalogText();
    let text;
    const message = { role:'user' };

    if(r.follow){
      text = R.SOLVER.followUp({ question:r.question || '(fotoğraftaki soru)', follow:r.follow });
    }else if(withImage){
      text = R.SOLVER.askImage({ note:r.note, subjects });
      message.images = [{ mime:r.image.mime, data:r.image.data }];
    }else{
      text = R.SOLVER.ask({ question:r.question, note:r.note, subjects });
    }
    message.text = text;

    const history = (r.previous || []).slice(-2)
      .map(m => ({ role:m.role === 'user' ? 'user' : 'assistant', text:m.text }));

    const res = await R.LLM.complete(chain, {
      system:R.SOLVER.system,
      messages:history.concat([message]),
      maxTokens:R.SOLVER.budget,
      temperature:0.2,
      signal:o.signal,
      onText:o.onText ? ev => o.onText({ text:parse(ev.text).text, delta:ev.delta }) : undefined,
    });

    const split = parse(res.text);
    return {
      text:split.text || res.text,
      meta:r.follow ? null : verify(split.meta),
      raw:split.meta || null,
      provider:res.provider, model:res.model, ms:res.ms,
      fellBack:!!res.fellBack, truncated:!!res.truncated,
    };
  }

  /* ---------- kayit ---------- */

  function all(){ return (S.solved || []).slice(); }

  function newRecord(fields){
    return Object.assign({
      id:U.uid('q'),
      at:new Date().toISOString(),
      question:'',        // soru metni (fotograftan okunduysa modelin yazdigi)
      solution:'',        // anlatim
      subjectId:null, topicId:null, topicName:'',
      difficulty:null,    // 1-5, dogrulanmis
      answer:'', trap:'',
      result:null,        // R.SOLVE_RESULTS anahtari
      sourceId:null,      // kaynak (yayin) kimligi
      sourceName:'',      // kaynak silinse de kayit hangi yayindan geldigini bilsin
      questionNo:'',      // kaynaktaki soru numarasi
      seconds:null,
      fromImage:false,
      model:'',
    }, fields || {});
  }

  async function save(rec){
    const record = Object.assign(newRecord(), rec);
    S.solved = S.solved || [];
    const i = S.solved.findIndex(x => x.id === record.id);
    if(i >= 0) S.solved[i] = record; else S.solved.unshift(record);
    if(S.solved.length > MAX_RECORDS) S.solved = S.solved.slice(0, MAX_RECORDS);
    await R.Store.set('solved/' + record.id, record);
    return record;
  }

  async function remove(id){
    S.solved = (S.solved || []).filter(x => x.id !== id);
    await R.Store.remove('solved/' + id);
  }

  async function load(){
    const rows = await R.Store.list('solved');
    S.solved = (rows || [])
      .filter(x => x && x.id)
      .sort((a, b) => (b.at || '').localeCompare(a.at || ''))
      .slice(0, MAX_RECORDS);
    return S.solved;
  }

  /* ---------- olcum ---------- */

  /* Bir kayit "cozuldu" mu sayilir? Coozume bakmak cozmek degildir. */
  function solvedOk(rec){
    return rec.result === 'dogru' || rec.result === 'zorla';
  }

  /* Konu basina cozum tablosu: kac soru, kaci cozuldu, ortalama zorluk. */
  function byTopic(){
    const map = {};
    all().forEach(r => {
      if(!r.topicId) return;
      const key = r.subjectId + '::' + r.topicId;
      const row = map[key] || (map[key] = {
        subjectId:r.subjectId, topicId:r.topicId, topicName:r.topicName,
        toplam:0, cozulen:0, zorlukToplam:0, zorlukAdet:0,
      });
      row.toplam++;
      if(solvedOk(r)) row.cozulen++;
      if(r.difficulty){ row.zorlukToplam += r.difficulty; row.zorlukAdet++; }
    });
    return Object.keys(map).map(k => {
      const row = map[k];
      row.yuzde = row.toplam ? Math.round(100 * row.cozulen / row.toplam) : 0;
      row.zorluk = row.zorlukAdet ? U.round(row.zorlukToplam / row.zorlukAdet, 1) : null;
      return row;
    }).sort((a, b) => a.yuzde - b.yuzde);
  }

  /* Gunluk cozum sayisi — son N gun. */
  function daily(days){
    const n = days || 14;
    const out = [];
    for(let i = n - 1; i >= 0; i--){
      const iso = U.iso(U.addDays(U.today(), -i));
      out.push({ date:iso, adet:all().filter(r => (r.at || '').slice(0, 10) === iso).length });
    }
    return out;
  }

  function summary(){
    const list = all();
    const withResult = list.filter(r => r.result);
    const ok = withResult.filter(solvedOk).length;
    const zor = list.filter(r => r.difficulty);
    return {
      toplam:list.length,
      bugun:list.filter(r => (r.at || '').slice(0, 10) === U.todayISO()).length,
      cozumOrani:withResult.length ? Math.round(100 * ok / withResult.length) : null,
      ortZorluk:zor.length
        ? U.round(zor.reduce((s, r) => s + r.difficulty, 0) / zor.length, 1) : null,
      etiketsiz:list.filter(r => !r.topicId).length,
    };
  }

  return {
    catalogText, matchTopic, parse, verify,
    prepareImage, solve, ready, chainFor,
    all, newRecord, save, remove, load,
    byTopic, daily, summary, solvedOk,
    MAX_EDGE, MAX_BYTES, MAX_RECORDS,
  };
})();
