/* Model tasima katmani — ofis ajanlarini ucretsiz LLM uclarina baglar.

   Ilke: bu modul YALNIZCA tasir. Ne istem kurar, ne veri secer, ne karar verir.
   Istemler core/office.js'te, kural motoru calc/analytics'te durur.

   Uc bicim desteklenir:
     builtin  window.claude.use('sample')      — Artifact icinde, anahtarsiz
     openai   POST /chat/completions (SSE)     — OpenRouter, Groq, ozel uc
     gemini   POST /models/x:streamGenerateContent — Google AI Studio

   Anahtarlar 'esp.llm.keys' altinda, uygulama verisinden AYRI durur:
   yedege girmez (Store.exportAll baska bir anahtari okur), buluta gitmez. */

window.ESP = window.ESP || {};

ESP.LLM = (function(){

  const KEY_STORE = 'esp.llm.keys';
  const TIMEOUT_MS = 90000;

  /* Turkce ayni cumleyi Ingilizceden belirgin daha cok token'la yazar:
     ekler ve genis alfabe yuzunden bes cumlelik bir ajan yaniti rahatlikla
     300 token eder. Eski 700'luk tavan uzun yanitlari cumle ortasinda
     kesiyordu ve kesildigi hicbir yerde fark edilmiyordu. */
  const DEFAULT_MAX_TOKENS = 1200;

  /* Yanit yine de kesilirse kac ek istekle tamamlanmaya calisilir.
     Her devam bir kota hakki harcar; ucretsiz katmanda ikiden fazlasi
     pahaliya gelir. */
  const MAX_CONTINUATIONS = 2;

  /* Saglayicilar "token siniri doldu"yu farkli adlandirir. */
  const TRUNCATED_FINISH = ['length', 'max_tokens', 'MAX_TOKENS'];
  function truncated(finish){
    return TRUNCATED_FINISH.indexOf(String(finish || '')) >= 0;
  }

  /* Devam istekleri de yetmediyse yarim kalan son cumle atilir: kesik bir
     cumle gostermek, bir cumle eksik gostermekten kotudur. Sayi icindeki
     nokta (1.500) cumle sonu sayilmaz — noktalamayi bosluk ya da metin
     sonu izlemelidir. */
  function trimToSentence(text){
    const s = String(text || '').trim();
    const m = s.match(/^[\s\S]*[.!?…](?=\s|$)/);
    if(!m) return s;                        // hic tam cumle yok: dokunma
    const head = m[0].trim();
    /* Yalniz SARKAN bir parca kirpilir. Kesilen cumle metnin govdesiyse
       (geriye yarisindan azi kaliyorsa) atmak yerine eksik hâliyle
       gosterilir: yarim cumle kotudur, bos ekran daha kotudur. */
    return head.length >= s.length * 0.4 ? head : s;
  }

  /* Kesilen metnin son kelimesi yarim kalmis olabilir ("kaybı" degil
     "kayb"). Devam istemeden once o kelime atilir ve modelden kaldigi
     noktadan sonrasi istenir: boylece birlestirme ne kelime boler ne de
     kelime kaybeder — atilan kelimeyi model yeniden yazar. */
  function dropLastWord(s){
    const t = String(s || '').trimEnd();
    const i = t.search(/\s\S*$/);
    return i <= 0 ? t : t.slice(0, i);
  }

  /* Kesilen yaniti tamamlatma istemi. Tekrar, kesik cumleden daha kotu
     bir bozulmadir; acikca yasaklanir. */
  function continueAsk(tail){
    return 'Yanıtın uzunluk sınırı yüzünden yarıda kesildi. Yukarıdaki metnin '
      + 'DEVAMINI yaz: baştan başlama, yazdıklarını tekrar etme, selamlama ekleme. '
      + 'Yalnızca eksik kalan kısmı yaz ve cümleyi tamamla.\n\n'
      + 'KESİLDİĞİ YER: …' + tail;
  }

  /* Devam parcasini birlestirir. Model uyariya ragmen sondan bir parcayi
     tekrarlamis olabilir: ortusen en uzun ek bir kez yazilir. */
  function joinContinuation(prev, piece){
    if(!piece) return prev;
    if(!prev) return piece;
    const max = Math.min(prev.length, piece.length, 240);
    for(let n = max; n >= 12; n--){
      if(prev.slice(-n).toLowerCase() === piece.slice(0, n).toLowerCase()){
        return prev + piece.slice(n);
      }
    }
    return prev + (/\s$/.test(prev) ? '' : ' ') + piece;
  }

  /* ---------- anahtar deposu ---------- */

  function readKeys(){
    try{ return JSON.parse(localStorage.getItem(KEY_STORE) || '{}'); }
    catch(e){ return {}; }
  }

  /* Bir saglayiciya BIRDEN COK anahtar verilebilir. Kota anahtar basina
     sayildigi icin ikinci anahtar gunluk hakki ikiye katlar — ucretsiz
     katmanda en ucuz buyume yolu budur.
     Eski bicim (tek dize) okunmaya devam eder. */
  function getKeys(providerId){
    const v = readKeys()[providerId];
    const list = Array.isArray(v) ? v : (typeof v === 'string' ? [v] : []);
    return list.map(k => String(k || '').trim()).filter(Boolean);
  }
  function getKey(providerId){ return getKeys(providerId)[0] || ''; }

  /* value: dize (tek anahtar) ya da dizi. Bos deger anahtarlari siler. */
  function setKey(providerId, value){
    const all = readKeys();
    const list = (Array.isArray(value) ? value : [value])
      .map(k => String(k || '').trim()).filter(Boolean);
    /* Ayni anahtar iki kez sayilmasin: kota anahtar kimligine bagli. */
    const uniq = list.filter((k, i) => list.indexOf(k) === i);
    if(uniq.length) all[providerId] = uniq; else delete all[providerId];
    try{ localStorage.setItem(KEY_STORE, JSON.stringify(all)); return true; }
    catch(e){ return false; }
  }

  function addKey(providerId, value){
    const v = String(value || '').trim();
    if(!v) return getKeys(providerId);
    const list = getKeys(providerId);
    if(list.indexOf(v) < 0) list.push(v);
    setKey(providerId, list);
    return list;
  }
  function removeKeyAt(providerId, index){
    const list = getKeys(providerId);
    list.splice(index, 1);
    setKey(providerId, list);
    return list;
  }
  function clearKeys(){
    try{ localStorage.removeItem(KEY_STORE); }catch(e){}
  }

  function mask(k){
    if(!k) return '';
    return k.length <= 10 ? '••••' : k.slice(0, 6) + '…' + k.slice(-4);
  }
  /* Ayar ekraninda gosterilecek maskeli hâl — tam anahtar hicbir yerde cizilmez. */
  function maskKey(providerId){ return mask(getKey(providerId)); }
  function maskKeys(providerId){ return getKeys(providerId).map(mask); }

  /* Kotasi musait olan anahtari secer; hepsi doluysa en az bekleyeni.
     Donen index kota sayacinin anahtarina girer. */
  function pickKey(cfg){
    const keys = getKeys(cfg.provider);
    if(!keys.length) return null;
    let best = null;
    for(let i = 0; i < keys.length; i++){
      const state = ESP.Quota.check(Object.assign({}, cfg, { keyId:i }));
      if(state.ok) return { key:keys[i], index:i, waitMs:0 };
      if(state.reason === 'daily') continue;              // bu anahtarin gunu bitti
      if(!best || state.waitMs < best.waitMs) best = { key:keys[i], index:i, waitMs:state.waitMs };
    }
    return best;   // hepsinin gunu bittiyse null → daily_quota
  }

  /* ---------- yerlesik yetenek ---------- */

  let sample = null;
  let builtinState = 'unknown';   // 'unknown' | 'ready' | 'unavailable'

  async function initBuiltin(){
    if(builtinState !== 'unknown') return builtinState === 'ready';
    try{
      if(window.claude && typeof window.claude.use === 'function'){
        const api = await window.claude.use('sample');
        if(api){ sample = api; builtinState = 'ready'; return true; }
      }
    }catch(e){ /* sessizce dus */ }
    builtinState = 'unavailable';
    return false;
  }
  function builtinReady(){ return builtinState === 'ready'; }

  /* ---------- hata ---------- */

  function fail(code, message){
    return Object.assign(new Error(message || code), { code });
  }

  /* Yayimlanmis bir Artifact icinde disariya fetch CSP ile engellenir ve
     tarayici bunu ayirt edilemeyen bir TypeError olarak verir. Ayni hata
     cevrimdisiyken de olusur; window.claude varsa neden neredeyse kesin
     kum havuzudur ve kullaniciya bu soylenir. */
  function inSandbox(){
    return !!(window.claude && typeof window.claude.use === 'function');
  }
  function networkCode(){ return inSandbox() ? 'sandboxed' : 'network'; }

  function retryAfterSeconds(response){
    const raw = response.headers && response.headers.get('retry-after');
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 300) : null;
  }

  function codeForStatus(status){
    if(status === 401 || status === 403) return 'unauthorized';
    if(status === 402) return 'no_credit';
    if(status === 404) return 'bad_model';
    if(status === 408) return 'timeout';
    if(status === 429) return 'rate_limited';
    if(status >= 500) return 'server';
    return 'bad_request';
  }

  /* Tarayici cevrimdisi oldugunu biliyorsa istek hic gonderilmez: kota
     harcanmaz, kullaniciya dogru sebep soylenir, baglanti gelince devam edilir. */
  function offline(){
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  }

  const ERRORS = {
    no_provider:'Model sağlayıcı seçilmedi. Ofis → Ayarlar bölümünden bir sağlayıcı seç.',
    no_key:'Bu sağlayıcı için API anahtarı girilmedi.',
    no_model:'Model seçilmedi.',
    no_endpoint:'Özel uç için adres girilmedi.',
    unauthorized:'API anahtarı kabul edilmedi. Anahtarı kontrol et ya da yenisini üret.',
    no_credit:'Bu hesapta kredi kalmamış. Ücretsiz bir model seç ya da başka sağlayıcı ekle.',
    bad_model:'Model bulunamadı. Model kimliği değişmiş olabilir; listeden başka bir model seç.',
    rate_limited:'İstek sınırına takıldın. Birkaç dakika bekle ya da başka sağlayıcı dene.',
    server:'Sağlayıcı şu an yanıt vermiyor. Biraz sonra tekrar dene.',
    bad_request:'İstek reddedildi. Model kimliği ya da uç adresi hatalı olabilir.',
    network:'Bağlantı kurulamadı. İnternetini ve uç adresini kontrol et.',
    timeout:'Yanıt zaman aşımına uğradı. Daha hızlı bir model dene.',
    cancelled:'İptal edildi.',
    empty:'Model boş yanıt döndürdü. Tekrar dene.',
    no_vision:'Yerleşik model görüntü okuyamıyor. Ayarlar → Rehber → Model '
      + 'bölümünden görüntü destekleyen bir sağlayıcı seç.',
    unavailable:'Yerleşik model bu ortamda kapalı. Ofis → Ayarlar’dan ücretsiz bir sağlayıcı bağla.',
    offline:'Bağlantı yok. Çevrimiçi olunca kaldığın yerden devam edersin; kural motoru bu sırada çalışmayı sürdürüyor.',
    daily_quota:'Bu modelin günlük ücretsiz hakkı doldu. Yarın sıfırlanır; o zamana kadar başka bir sağlayıcı kullanabilirsin.',
    rate_wait:'Dakikalık sıra çok uzun. Birkaç dakika sonra tekrar dene ya da dakikalık sınırı daha yüksek bir sağlayıcı seç.',
    sandboxed:'Bu ortam dış servislere bağlanmaya izin vermiyor. Uygulama Claude içinde yayımlanmış bir sayfa olarak '
      + 'çalışırken dış API çağrıları engellenir: burada yerleşik modeli kullan, ücretsiz sağlayıcılar için uygulamayı '
      + 'kendi tarayıcında (dosyadan ya da kendi sunucundan) aç.',
  };
  function errorText(code){ return ERRORS[code] || 'Model şu an yanıt veremedi.'; }

  /* Yeniden denenebilir hatalar: yedek modele gecmek anlamli olanlar. */
  const RETRYABLE = ['rate_limited', 'server', 'bad_model', 'timeout', 'empty'];
  /* Baglanti gelince kaldigi yerden devam edilebilecek hatalar. */
  const RESUMABLE = ['offline', 'network', 'server', 'timeout'];
  function retryable(code){ return RETRYABLE.indexOf(code) >= 0; }
  function resumable(code){ return RESUMABLE.indexOf(code) >= 0; }

  /* Baglanti geri gelince haber verir; toplanti kaldigi yerden devam eder. */
  function onceOnline(fn){
    if(!offline()){ fn(); return function(){}; }
    const h = function(){ window.removeEventListener('online', h); fn(); };
    window.addEventListener('online', h);
    return function(){ window.removeEventListener('online', h); };
  }

  /* ---------- ortak yardimcilar ---------- */

  /* Cagiranin signal'i ile zaman asimini tek denetleyicide birlestirir. */
  function withTimeout(signal, ms){
    const ctrl = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, ms || TIMEOUT_MS);
    const onAbort = () => ctrl.abort();
    if(signal){
      if(signal.aborted) ctrl.abort();
      else signal.addEventListener('abort', onAbort);
    }
    return {
      signal:ctrl.signal,
      timedOut(){ return timedOut; },
      done(){
        clearTimeout(timer);
        if(signal) signal.removeEventListener('abort', onAbort);
      },
    };
  }

  /* SSE govdesini satir satir okur; her 'data:' satirini fn'e verir.

     Iki kapanis tuzagi vardir ve ikisi de yanitin SONUNU goturur:
     akis son 'data:' satirini yeni satirla kapatmadan bitebilir, ve cok
     baytli bir karakter (Turkce ç/ğ/ş/ü hepsi iki bayt) son parcaya
     bolunmus olabilir. Bu yuzden bitiste hem cozucu hem tampon bosaltilir. */
  async function readSSE(response, fn){
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let closed = false;

    /* true donerse akis kapanmistir ([DONE]) ve okuma biter. */
    function handle(line){
      const s = line.trim();
      if(!s || s.indexOf(':') === 0) return false;          // yorum / keep-alive
      if(s.indexOf('data:') !== 0) return false;
      const payload = s.slice(5).trim();
      if(payload === '[DONE]'){ closed = true; return true; }
      try{ fn(JSON.parse(payload)); }
      catch(e){ /* parcali kare — bir sonraki satirda tamamlanir */ }
      return false;
    }

    try{
      for(;;){
        const { done, value } = await reader.read();
        if(done){
          buffer += decoder.decode();                       // yarim kalan cok baytli karakter
          break;
        }
        buffer += decoder.decode(value, { stream:true });
        let nl;
        while((nl = buffer.indexOf('\n')) >= 0){
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if(handle(line)) return;
        }
      }
      /* Kapanis satiri yeni satirla bitmediyse elde kalan HÂLÂ veridir. */
      if(!closed && buffer) handle(buffer);
    }finally{
      try{ reader.cancel(); }catch(e){}
    }
  }

  /* Hata govdesinden okunabilir mesaj cikarir (saglayicilar farkli sarar). */
  async function errorMessage(response){
    let body = '';
    try{ body = await response.text(); }catch(e){ return ''; }
    try{
      const j = JSON.parse(body);
      const e = j.error || j;
      return String(e.message || e.detail || e.type || '').slice(0, 240);
    }catch(e){ return body.slice(0, 240); }
  }

  /* ---------- yerlesik cagri ---------- */

  async function callBuiltin(req){
    if(!builtinReady()) throw fail('unavailable');
    const turns = [];
    if(req.system) turns.push({ role:'user', content:req.system });
    (req.messages || []).forEach(m => {
      /* Yerlesik saglayici goruntu almaz. Sessizce dusurmek yerine
         cagirana bildiririz: ekran "model goruntu okuyamiyor" der. */
      if(m.images && m.images.length) throw fail('no_vision');
      turns.push({ role:m.role, content:m.text });
    });
    const res = await sample(turns.length === 1 ? turns[0].content : turns, {
      modelTier:req.model === 'quick' ? 'quick' : 'default',
      signal:req.signal,
      onText:req.onText ? ev => req.onText({ text:ev.text, delta:'' }) : undefined,
    });
    const text = String((res && res.text) || '').trim();
    if(!text) throw fail('empty');
    return { text, finish:'' };
  }

  /* ---------- OpenAI uyumlu cagri ---------- */

  async function callOpenAI(req, provider){
    const key = req.key;
    if(!key) throw fail('no_key');
    const endpoint = req.endpoint || provider.endpoint;
    if(!endpoint) throw fail('no_endpoint');

    const messages = [];
    if(req.system) messages.push({ role:'system', content:req.system });
    /* Goruntu tasiyan mesaj, OpenAI uyumlu icerik dizisine cevrilir.
       Goruntu yoksa duz metin kalir: eski saglayicilar dizi bicimini
       kabul etmeyebilir, gereksiz yere riske girilmez. */
    (req.messages || []).forEach(m => {
      if(m.images && m.images.length){
        const content = [{ type:'text', text:m.text || '' }];
        m.images.forEach(img => {
          const url = img.url || ('data:' + (img.mime || 'image/jpeg') + ';base64,' + img.b64);
          content.push({ type:'image_url', image_url:{ url } });
        });
        messages.push({ role:m.role, content });
      }else{
        messages.push({ role:m.role, content:m.text });
      }
    });

    const headers = {
      'Content-Type':'application/json',
      'Authorization':'Bearer ' + key,
    };
    /* OpenRouter kaynak basligi bekler; tarayicidan gonderilmesi serbesttir. */
    if(provider.id === 'openrouter'){
      headers['HTTP-Referer'] = location.origin || 'https://esp.local';
      headers['X-Title'] = 'ESP — entelektüel ofis';
    }

    const stream = !!req.onText;
    const guard = withTimeout(req.signal, req.timeout);
    let response;
    try{
      response = await fetch(endpoint, {
        method:'POST',
        headers,
        signal:guard.signal,
        body:JSON.stringify({
          model:req.model,
          messages,
          max_tokens:req.maxTokens || DEFAULT_MAX_TOKENS,
          temperature:req.temperature == null ? 0.4 : req.temperature,
          stream,
        }),
      });
    }catch(e){
      guard.done();
      if(guard.timedOut()) throw fail('timeout');
      if(req.signal && req.signal.aborted) throw fail('cancelled');
      throw fail(networkCode(), e && e.message);
    }

    if(!response.ok){
      const detail = await errorMessage(response);
      const code = codeForStatus(response.status);
      guard.done();
      /* Saglayici bizim saydigimizdan daha siki davraniyor: pencereyi kapat. */
      if(code === 'rate_limited'){
        ESP.Quota.penalize({ provider:provider.id, model:req.model, keyId:req.keyId }, retryAfterSeconds(response));
      }
      throw fail(code, detail);
    }

    let text = '';
    let finish = '';
    try{
      const ctype = response.headers.get('content-type') || '';
      if(stream && ctype.indexOf('event-stream') >= 0){
        await readSSE(response, obj => {
          const ch = obj.choices && obj.choices[0];
          if(!ch) return;
          /* Bitis sebebi genelde SON karede, govdesi bos olarak gelir:
             delta kontrolunden ONCE okunmali, yoksa kesilme hic gorulmez. */
          if(ch.finish_reason) finish = String(ch.finish_reason);
          const delta = (ch.delta && ch.delta.content) || ch.text;
          if(!delta) return;
          text += delta;
          req.onText({ text, delta });
        });
      }else{
        /* Akis istendigi hâlde duz JSON dondu — ayni govdeden okunur. */
        const json = await response.json();
        const ch = json.choices && json.choices[0];
        if(ch && ch.finish_reason) finish = String(ch.finish_reason);
        text = String((ch && ch.message && ch.message.content) || (ch && ch.text) || '');
        if(req.onText && text) req.onText({ text, delta:text });
      }
    }catch(e){
      if(guard.timedOut()) { guard.done(); throw fail('timeout'); }
      if(req.signal && req.signal.aborted){ guard.done(); throw fail('cancelled'); }
      guard.done();
      throw fail('server', e && e.message);
    }
    guard.done();

    text = text.trim();
    if(!text) throw fail('empty');
    return { text, finish };
  }

  /* ---------- Gemini cagrisi ---------- */

  async function callGemini(req, provider){
    const key = req.key;
    if(!key) throw fail('no_key');
    const base = req.endpoint || provider.endpoint;
    const stream = !!req.onText;
    const path = base.replace(/\/$/, '') + '/' + encodeURIComponent(req.model) + ':'
      + (stream ? 'streamGenerateContent?alt=sse&key=' : 'generateContent?key=')
      + encodeURIComponent(key);

    const contents = (req.messages || []).map(m => ({
      role:m.role === 'assistant' ? 'model' : 'user',
      parts:[{ text:m.text }],
    }));

    const body = {
      contents,
      generationConfig:{
        maxOutputTokens:req.maxTokens || DEFAULT_MAX_TOKENS,
        temperature:req.temperature == null ? 0.4 : req.temperature,
      },
    };
    /* 2.5 ailesinde "dusunme" ayni butceden yer: acik birakilirsa model
       butceyi dusunerek harcar ve cevap YARIM ya da bos doner. Ofis
       ajanlari kisa konusur, dusunmeye ihtiyaclari yok — kapatilir.
       Alan yalniz destekleyen modele gonderilir; digerleri 400 verir. */
    if(/2\.5.*flash/i.test(String(req.model || ''))){
      body.generationConfig.thinkingConfig = { thinkingBudget:0 };
    }
    if(req.system) body.systemInstruction = { parts:[{ text:req.system }] };

    const guard = withTimeout(req.signal, req.timeout);
    let response;
    try{
      response = await fetch(path, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        signal:guard.signal,
        body:JSON.stringify(body),
      });
    }catch(e){
      guard.done();
      if(guard.timedOut()) throw fail('timeout');
      if(req.signal && req.signal.aborted) throw fail('cancelled');
      throw fail(networkCode(), e && e.message);
    }

    if(!response.ok){
      const detail = await errorMessage(response);
      const code = codeForStatus(response.status);
      guard.done();
      if(code === 'rate_limited'){
        ESP.Quota.penalize({ provider:provider.id, model:req.model, keyId:req.keyId }, retryAfterSeconds(response));
      }
      throw fail(code, detail);
    }

    function partsText(obj){
      const cand = obj.candidates && obj.candidates[0];
      const parts = cand && cand.content && cand.content.parts;
      /* Dusunme parcalari metin degildir; cevaba karistirilmaz. */
      return (parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
    }
    function finishOf(obj){
      const cand = obj.candidates && obj.candidates[0];
      return (cand && cand.finishReason) ? String(cand.finishReason) : '';
    }

    let text = '';
    let finish = '';
    try{
      const ctype = response.headers.get('content-type') || '';
      if(stream && ctype.indexOf('event-stream') >= 0){
        await readSSE(response, obj => {
          const f = finishOf(obj);
          if(f) finish = f;
          const delta = partsText(obj);
          if(!delta) return;
          text += delta;
          req.onText({ text, delta });
        });
      }else{
        const json = await response.json();
        const list = Array.isArray(json) ? json : [json];
        text = list.map(partsText).join('');
        list.forEach(o => { const f = finishOf(o); if(f) finish = f; });
        if(req.onText && text) req.onText({ text, delta:text });
      }
    }catch(e){
      if(guard.timedOut()){ guard.done(); throw fail('timeout'); }
      if(req.signal && req.signal.aborted){ guard.done(); throw fail('cancelled'); }
      guard.done();
      throw fail('server', e && e.message);
    }
    guard.done();

    text = text.trim();
    if(!text) throw fail('empty');
    return { text, finish };
  }

  /* ---------- kamu API ---------- */

  /* Tek cagri. cfg: { provider, model, endpoint } — anahtar depodan okunur.
     req: { system, messages:[{role,text}], maxTokens, temperature, signal, onText } */
  async function chat(cfg, req){
    const provider = ESP.PROVIDERS[cfg && cfg.provider];
    if(!provider) throw fail('no_provider');
    if(!cfg.model && provider.kind !== 'builtin') throw fail('no_model');

    /* Cevrimdisiyken hic deneme: kota harcanmaz, sebep dogru soylenir. */
    if(provider.kind !== 'builtin' && offline()) throw fail('offline');

    const started = Date.now();
    const baseMessages = (req && req.messages) || [];
    /* Yanit token sinirina carparsa devam istegiyle tamamlanir. Kapatmak
       icin continue:false, sayiyi degistirmek icin maxContinuations. */
    const limit = (req && req.continue === false) ? 0
      : (req && req.maxContinuations != null ? req.maxContinuations : MAX_CONTINUATIONS);

    let text = '';
    let finish = '';
    let rounds = 0;
    let waited = 0;
    let slot = null;
    let picked = null;

    for(let round = 0; round <= limit; round++){
      /* Cok anahtarli havuz: kotasi musait anahtar HER turda yeniden
         secilir — ilk anahtarin gunu devam isteginde dolmus olabilir. */
      picked = null;
      if(provider.needsKey){
        if(!getKeys(provider.id).length) throw fail('no_key');
        picked = pickKey(cfg);
        /* Devam turunda kota bittiyse elde saglam bir metin var: onunla yetin. */
        if(!picked){
          if(round > 0) break;
          throw Object.assign(new Error('gunluk kota doldu'), { code:'daily_quota' });
        }
      }
      const quotaCfg = picked ? Object.assign({}, cfg, { keyId:picked.index }) : cfg;

      /* Devam turunda yarim kalmis son kelime atilir ve model oradan
         surdurur. Kirpma YALNIZ bu turun tabanina uygulanir; elde duran
         metne dokunulmaz, cunku devam istegi duserse onu dondurecegiz. */
      const prefix = round === 0 ? '' : dropLastWord(text);
      const messages = round === 0 ? baseMessages : baseMessages.concat([
        { role:'assistant', text:prefix },
        { role:'user', text:continueAsk(prefix.slice(-120)) },
      ]);

      const payload = Object.assign({}, req, {
        messages,
        model:cfg.model,
        endpoint:cfg.endpoint,
        key:picked ? picked.key : null,
        keyId:picked ? picked.index : null,
        /* Akis kullaniciya kesintisiz gorunmeli: parca degil birikmis
           metin yayinlanir. */
        onText:(req && req.onText)
          ? ev => req.onText({ text:joinContinuation(prefix, ev.text), delta:ev.delta })
          : undefined,
      });

      /* Sira: kota yoneticisi izin verene kadar bekle. Boylece dakikalik
         sinir HIC asilmaz; gun dolduysa beklemek yerine acikca soylenir. */
      slot = await ESP.Quota.acquire(quotaCfg, { signal:req && req.signal, onWait:req && req.onWait });
      waited += slot.waited || 0;

      let out;
      try{
        if(provider.kind === 'builtin') out = await callBuiltin(payload);
        else if(provider.kind === 'gemini') out = await callGemini(payload, provider);
        else out = await callOpenAI(payload, provider);
      }catch(err){
        /* Istek hic gonderilemediyse gunluk hakki tuketmis sayma. */
        if(err && (err.code === 'cancelled' || err.code === 'sandboxed'
                || err.code === 'no_key' || err.code === 'offline')){
          ESP.Quota.release(quotaCfg);
        }
        if(err && err.code === 'cancelled') throw err;
        /* Devam istegi duserse ilk turun metni durur: hata gostermektense
           eksik cumleyi kirpip eldekini vermek daha iyidir. */
        if(round > 0) break;
        throw err;
      }

      rounds++;
      text = round === 0 ? out.text : joinContinuation(prefix, out.text);
      finish = out.finish;
      if(!truncated(finish)) break;
    }

    /* Devam haklari bittigi hâlde hâlâ kesikse yarim cumle atilir. */
    const cut = truncated(finish);
    if(cut) text = trimToSentence(text);
    text = text.trim();
    if(!text) throw fail('empty');

    return {
      text, provider:provider.id, model:cfg.model || 'yerleşik',
      keyIndex:picked ? picked.index : null,
      ms:Date.now() - started, waited,
      usedToday:slot && slot.usedToday, rpd:slot && slot.rpd,
      rounds, truncated:cut,
    };
  }

  /* Yedekli cagri: zincirdeki ilk calisani kullanir.
     Ucretsiz modeller sik sik sinira takilir; tek model yerine sira denenir.
     Iptal ve anahtar hatalarinda zincir kirilir — beklemek anlamsizdir. */
  async function complete(chain, req){
    const list = (chain || []).filter(c => c && c.provider);
    if(!list.length) throw fail('no_provider');
    let last = fail('no_provider');
    for(let i = 0; i < list.length; i++){
      try{
        const res = await chat(list[i], req);
        if(i > 0) res.fellBack = true;
        return res;
      }catch(err){
        last = err;
        const code = err && err.code;
        if(code === 'cancelled') throw err;
        if(code === 'daily_quota'){
          /* Gunluk hak modele ozeldir: ayni saglayicinin baska modeli de
             ayni havuzu paylasiyor olabilir, yine de denemeye deger. */
          continue;
        }
        if(!retryable(code)){
          /* Anahtar/adres/kum havuzu hatasi zincirin geri kalanini da
             vurabilir: farkli saglayici varsa dene, ayni saglayiciysa dur. */
          const next = list[i+1];
          if(!next || next.provider === list[i].provider) throw err;
        }
      }
    }
    throw last;
  }

  /* Baglanti sinamasi — ayar ekraninda "Bağlantıyı dene" icin.
     Gercek bir istek yapar; bu yuzden gunluk haktan bir tane harcar. */
  async function test(cfg){
    const started = Date.now();
    const res = await chat(cfg, {
      system:'Yalnızca istenen kelimeyi yaz, başka hiçbir şey yazma.',
      messages:[{ role:'user', text:'Tek kelimeyle yanıtla: hazır' }],
      maxTokens:16,
      temperature:0,
      timeout:30000,
      /* Sinama kasten dar butceli: kesilme beklenen sonuctur, devam
         istegiyle bosuna kota harcanmaz. */
      continue:false,
    });
    return { ok:true, text:res.text.slice(0, 60), ms:Date.now() - started, model:res.model };
  }

  /* Bir yapilandirmanin kullanilabilir olup olmadigi (cagri yapmadan). */
  function ready(cfg){
    const provider = ESP.PROVIDERS[cfg && cfg.provider];
    if(!provider) return false;
    if(provider.kind === 'builtin') return builtinReady();
    if(provider.needsKey && !getKeys(provider.id).length) return false;
    if(provider.editableEndpoint && !(cfg.endpoint || '').trim()) return false;
    return !!cfg.model;
  }

  return {
    initBuiltin, builtinReady,
    getKey, getKeys, setKey, addKey, removeKeyAt, clearKeys, maskKey, maskKeys, pickKey,
    chat, complete, test, ready,
    errorText, retryable, resumable, offline, onceOnline, inSandbox, KEY_STORE,
    truncated, trimToSentence, joinContinuation, dropLastWord, DEFAULT_MAX_TOKENS,
  };
})();
