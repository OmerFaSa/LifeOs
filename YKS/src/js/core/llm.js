/* Model tasima katmani — ofis ajanlarini ucretsiz LLM uclarina baglar.

   Ilke: bu modul YALNIZCA tasir. Ne istem kurar, ne veri secer, ne karar verir.
   Istemler core/office.js'te, kural motoru calc/analytics'te durur.

   Uc bicim desteklenir:
     builtin  window.claude.use('sample')      — Artifact icinde, anahtarsiz
     openai   POST /chat/completions (SSE)     — OpenRouter, Groq, ozel uc
     gemini   POST /models/x:streamGenerateContent — Google AI Studio

   Anahtarlar 'rota.llm.keys' altinda, uygulama verisinden AYRI durur:
   yedege girmez (Store.exportAll baska bir anahtari okur), buluta gitmez. */

window.R = window.R || {};

R.LLM = (function(){

  const KEY_STORE = 'rota.llm.keys';
  const TIMEOUT_MS = 90000;

  /* ---------- anahtar deposu ---------- */

  function readKeys(){
    try{ return JSON.parse(localStorage.getItem(KEY_STORE) || '{}'); }
    catch(e){ return {}; }
  }
  function getKey(providerId){
    const k = readKeys()[providerId];
    return typeof k === 'string' ? k.trim() : '';
  }
  function setKey(providerId, value){
    const all = readKeys();
    const v = String(value || '').trim();
    if(v) all[providerId] = v; else delete all[providerId];
    try{ localStorage.setItem(KEY_STORE, JSON.stringify(all)); return true; }
    catch(e){ return false; }
  }
  function clearKeys(){
    try{ localStorage.removeItem(KEY_STORE); }catch(e){}
  }
  /* Ayar ekraninda gosterilecek maskeli hâl — tam anahtar hicbir yerde cizilmez. */
  function maskKey(providerId){
    const k = getKey(providerId);
    if(!k) return '';
    return k.length <= 10 ? '••••' : k.slice(0, 6) + '…' + k.slice(-4);
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
    unavailable:'Yerleşik model bu ortamda kapalı. Ofis → Ayarlar’dan ücretsiz bir sağlayıcı bağla.',
    daily_quota:'Bu modelin günlük ücretsiz hakkı doldu. Yarın sıfırlanır; o zamana kadar başka bir sağlayıcı kullanabilirsin.',
    rate_wait:'Dakikalık sıra çok uzun. Birkaç dakika sonra tekrar dene ya da dakikalık sınırı daha yüksek bir sağlayıcı seç.',
    sandboxed:'Bu ortam dış servislere bağlanmaya izin vermiyor. Uygulama Claude içinde yayımlanmış bir sayfa olarak '
      + 'çalışırken dış API çağrıları engellenir: burada yerleşik modeli kullan, ücretsiz sağlayıcılar için uygulamayı '
      + 'kendi tarayıcında (dosyadan ya da kendi sunucundan) aç.',
  };
  function errorText(code){ return ERRORS[code] || 'Model şu an yanıt veremedi.'; }

  /* Yeniden denenebilir hatalar: yedek modele gecmek anlamli olanlar. */
  const RETRYABLE = ['rate_limited', 'server', 'bad_model', 'timeout', 'empty'];
  function retryable(code){ return RETRYABLE.indexOf(code) >= 0; }

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

  /* SSE govdesini satir satir okur; her 'data:' satirini fn'e verir. */
  async function readSSE(response, fn){
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    for(;;){
      const { done, value } = await reader.read();
      if(done) break;
      buffer += decoder.decode(value, { stream:true });
      let nl;
      while((nl = buffer.indexOf('\n')) >= 0){
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if(!line || line.indexOf(':') === 0) continue;      // yorum / keep-alive
        if(line.indexOf('data:') !== 0) continue;
        const payload = line.slice(5).trim();
        if(payload === '[DONE]') return;
        try{ fn(JSON.parse(payload)); }
        catch(e){ /* parcali kare — bir sonraki satirda tamamlanir */ }
      }
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
    (req.messages || []).forEach(m => turns.push({ role:m.role, content:m.text }));
    const res = await sample(turns.length === 1 ? turns[0].content : turns, {
      modelTier:req.model === 'quick' ? 'quick' : 'default',
      signal:req.signal,
      onText:req.onText ? ev => req.onText({ text:ev.text, delta:'' }) : undefined,
    });
    const text = String((res && res.text) || '').trim();
    if(!text) throw fail('empty');
    return text;
  }

  /* ---------- OpenAI uyumlu cagri ---------- */

  async function callOpenAI(req, provider){
    const key = req.key;
    if(!key) throw fail('no_key');
    const endpoint = req.endpoint || provider.endpoint;
    if(!endpoint) throw fail('no_endpoint');

    const messages = [];
    if(req.system) messages.push({ role:'system', content:req.system });
    (req.messages || []).forEach(m => messages.push({ role:m.role, content:m.text }));

    const headers = {
      'Content-Type':'application/json',
      'Authorization':'Bearer ' + key,
    };
    /* OpenRouter kaynak basligi bekler; tarayicidan gonderilmesi serbesttir. */
    if(provider.id === 'openrouter'){
      headers['HTTP-Referer'] = location.origin || 'https://rota.local';
      headers['X-Title'] = 'Rota — YKS ofisi';
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
          max_tokens:req.maxTokens || 700,
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
        R.Quota.penalize({ provider:provider.id, model:req.model }, retryAfterSeconds(response));
      }
      throw fail(code, detail);
    }

    let text = '';
    try{
      const ctype = response.headers.get('content-type') || '';
      if(stream && ctype.indexOf('event-stream') >= 0){
        await readSSE(response, obj => {
          const ch = obj.choices && obj.choices[0];
          const delta = ch && ((ch.delta && ch.delta.content) || ch.text);
          if(!delta) return;
          text += delta;
          req.onText({ text, delta });
        });
      }else{
        /* Akis istendigi hâlde duz JSON dondu — ayni govdeden okunur. */
        const json = await response.json();
        const ch = json.choices && json.choices[0];
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
    return text;
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
        maxOutputTokens:req.maxTokens || 700,
        temperature:req.temperature == null ? 0.4 : req.temperature,
      },
    };
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
        R.Quota.penalize({ provider:provider.id, model:req.model }, retryAfterSeconds(response));
      }
      throw fail(code, detail);
    }

    function partsText(obj){
      const cand = obj.candidates && obj.candidates[0];
      const parts = cand && cand.content && cand.content.parts;
      return (parts || []).map(p => p.text || '').join('');
    }

    let text = '';
    try{
      const ctype = response.headers.get('content-type') || '';
      if(stream && ctype.indexOf('event-stream') >= 0){
        await readSSE(response, obj => {
          const delta = partsText(obj);
          if(!delta) return;
          text += delta;
          req.onText({ text, delta });
        });
      }else{
        const json = await response.json();
        text = Array.isArray(json) ? json.map(partsText).join('') : partsText(json);
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
    return text;
  }

  /* ---------- kamu API ---------- */

  /* Tek cagri. cfg: { provider, model, endpoint } — anahtar depodan okunur.
     req: { system, messages:[{role,text}], maxTokens, temperature, signal, onText } */
  async function chat(cfg, req){
    const provider = R.PROVIDERS[cfg && cfg.provider];
    if(!provider) throw fail('no_provider');
    if(!cfg.model && provider.kind !== 'builtin') throw fail('no_model');

    const payload = Object.assign({}, req, {
      model:cfg.model,
      endpoint:cfg.endpoint,
      key:provider.needsKey ? getKey(provider.id) : null,
    });

    /* Sira: kota yoneticisi izin verene kadar bekle. Boylece dakikalik
       sinir HIC asilmaz; gun dolduysa beklemek yerine acikca soylenir. */
    const slot = await R.Quota.acquire(cfg, { signal:req && req.signal, onWait:req && req.onWait });

    const started = Date.now();
    let text;
    try{
      if(provider.kind === 'builtin') text = await callBuiltin(payload);
      else if(provider.kind === 'gemini') text = await callGemini(payload, provider);
      else text = await callOpenAI(payload, provider);
    }catch(err){
      /* Istek hic gonderilemediyse gunluk hakki tuketmis sayma. */
      if(err && (err.code === 'cancelled' || err.code === 'sandboxed' || err.code === 'no_key')){
        R.Quota.release(cfg);
      }
      throw err;
    }

    return {
      text, provider:provider.id, model:cfg.model || 'yerleşik',
      ms:Date.now() - started, waited:slot.waited || 0,
      usedToday:slot.usedToday, rpd:slot.rpd,
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
    });
    return { ok:true, text:res.text.slice(0, 60), ms:Date.now() - started, model:res.model };
  }

  /* Bir yapilandirmanin kullanilabilir olup olmadigi (cagri yapmadan). */
  function ready(cfg){
    const provider = R.PROVIDERS[cfg && cfg.provider];
    if(!provider) return false;
    if(provider.kind === 'builtin') return builtinReady();
    if(provider.needsKey && !getKey(provider.id)) return false;
    if(provider.editableEndpoint && !(cfg.endpoint || '').trim()) return false;
    return !!cfg.model;
  }

  return {
    initBuiltin, builtinReady,
    getKey, setKey, clearKeys, maskKey,
    chat, complete, test, ready,
    errorText, retryable, inSandbox, KEY_STORE,
  };
})();
