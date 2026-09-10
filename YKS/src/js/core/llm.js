/* Model tasima katmani — ofis ajanlarini ucretsiz LLM uclarina baglar.

   Ilke: bu modul YALNIZCA tasir. Ne istem kurar, ne veri secer, ne karar verir.
   Istemler core/office.js'te, kural motoru calc/analytics'te durur.

   Uc bicim desteklenir:
     builtin  window.claude.use('sample')      — Artifact icinde, anahtarsiz
     openai   POST /chat/completions (SSE)     — OpenRouter, Groq, yerel, ozel uc
     gemini   POST /models/x:streamGenerateContent — Google AI Studio

   Anahtarlar 'rota.llm.keys' altinda, uygulama verisinden AYRI durur:
   yedege girmez (Store.exportAll baska bir anahtari okur), buluta gitmez. */

window.R = window.R || {};

R.LLM = (function(){

  const KEY_STORE = 'rota.llm.keys';
  const MODEL_STORE = 'rota.llm.catalog';
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

  /* ---------- akil yurutme cikardimi ----------

     Akil yuruten ucretsiz modeller (DeepSeek R1, Qwen3, bircok ":free" uc)
     ic seslerini iki yoldan sizdirir: ya govdeye <think>…</think> yazarlar
     ya da ayri bir `reasoning` alanina koyarlar. Birincisi ekrana "ajanin
     yaniti" diye ciziliyordu — kullanicinin gordugu "yanlis yanit"in en sik
     sebebi buydu. Ic ses cevap degildir; ayiklanir.

     Akista da ayiklanir: kapanmamis bir <think> acilisindan SONRASI henuz
     cevap degildir, o yuzden kesilir. Boylece kullanici modelin dusunmesini
     degil, bitmis cumleyi gorur. */
  const THINK_PAIR = /<(think|thinking|reasoning|reflection)>[\s\S]*?<\/\1>/gi;
  const THINK_OPEN = /<(?:think|thinking|reasoning|reflection)>/i;
  const THINK_CLOSE = /^[\s\S]*?<\/(?:think|thinking|reasoning|reflection)>/i;

  function stripThinking(text){
    let s = String(text || '');
    if(s.indexOf('<') < 0) return s.trim();
    s = s.replace(THINK_PAIR, '');
    /* Acilis etiketi gelmeden kapanis geldiyse (bazi ucler acilisi hic
       gondermez) kapanisa kadarki her sey ic sestir. */
    if(THINK_CLOSE.test(s) && !THINK_OPEN.test(s)) s = s.replace(THINK_CLOSE, '');
    /* Kapanmamis acilis: sonrasi henuz cevap degil. */
    const open = s.search(THINK_OPEN);
    if(open >= 0) s = s.slice(0, open);
    return s.trim();
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

  /* ---------- anahtar bicimi ----------

     Bicim bilgisi data/providers.js'te durur; burada yalnizca okunur.
     Uyari ENGELLEMEZ: saglayicilar oneki degistirebilir ve yanlis bir
     uyari yuzunden gecerli anahtari reddetmek, en kotu ariza olurdu.
     Tek kesin durum, anahtarin acikca BASKA bir saglayiciya ait olmasidir. */

  /* Anahtar hangi saglayicinin bicimine uyuyor? Hicbirine uymuyorsa null. */
  function keyOwner(value){
    const v = String(value || '').trim();
    if(!v) return null;
    const ids = Object.keys(R.PROVIDERS);
    for(let i = 0; i < ids.length; i++){
      const p = R.PROVIDERS[ids[i]];
      if(p.keyPattern && p.keyPattern.test(v)) return p.id;
    }
    return null;
  }

  /* { level:'wrong'|'shape', text } ya da null.
     'wrong' — anahtar baska bir saglayiciya ait, kaydetmek anlamsiz.
     'shape' — bilinen bicime uymuyor ama sahibi de belli degil: yalniz soylenir. */
  function keyProblem(providerId, value){
    const v = String(value || '').trim();
    const p = R.PROVIDERS[providerId];
    if(!v || !p) return null;
    const owner = keyOwner(v);
    if(owner && owner !== providerId){
      return { level:'wrong', owner,
        text:'Bu anahtar ' + R.PROVIDERS[owner].label + ' anahtarına benziyor, '
           + p.label + ' anahtarına değil. Sağlayıcıyı değiştir ya da doğru anahtarı yapıştır.' };
    }
    if(p.keyPattern && !p.keyPattern.test(v)){
      return { level:'shape',
        text:(p.keyShape || '') + ' Yine de kaydedebilirsin: sağlayıcılar biçim değiştirebiliyor.' };
    }
    return null;
  }

  /* Kotasi musait olan anahtari secer; hepsi doluysa en az bekleyeni.
     Donen index kota sayacinin anahtarina girer. */
  function pickKey(cfg){
    const keys = getKeys(cfg.provider);
    if(!keys.length) return null;
    let best = null;
    for(let i = 0; i < keys.length; i++){
      const state = R.Quota.check(Object.assign({}, cfg, { keyId:i }));
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
  function isLocal(url){
    return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:|\/|$)/i.test(String(url || ''));
  }
  /* Baglanti hic kurulamadi. Sebep uce ayrilir cunku cozumleri farklidir:
     kum havuzu (uygulamayi baska yerde ac), yerel sunucu (CORS'u ac),
     duz ag (interneti kontrol et). */
  function networkCode(endpoint){
    if(isLocal(endpoint)) return 'local_cors';
    return inSandbox() ? 'sandboxed' : 'network';
  }

  function retryAfterSeconds(response){
    const raw = response.headers && response.headers.get('retry-after');
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 300) : null;
  }

  /* HTTP kodu tek basina yetmez: Google gecersiz anahtari 400 ile,
     OpenRouter bilinmeyen modeli 400 ile bildirir. Govde okunmadan
     yapilan siniflama kullaniciyi yanlis yere bakmaya gonderiyordu —
     "istek reddedildi" diyen bir mesaj, anahtari yenilemesi gereken
     kullaniciya hicbir sey soylemez. Once govdeye bakilir. */
  function classify(status, detail){
    const d = String(detail || '').toLowerCase();

    /* Google'in yeni "AQ." anahtarlari bazi hesaplarda Gemini API'ye
       kapalidir ve bunu kendine ozgu bir kodla soyler. */
    if(d.indexOf('access_token_type_unsupported') >= 0) return 'key_type';

    if(/api[_ ]?key[_ ]?invalid|api key not valid|invalid api key|invalid_api_key|no auth credentials/.test(d)){
      return 'unauthorized';
    }
    if(/model.*(not found|not exist|does not exist|is not supported|decommission|deprecat)|no endpoints found|unknown model|invalid model/.test(d)){
      return 'bad_model';
    }
    if(status === 429 && /per day|daily|quota|resource[_ ]exhausted|free-models-per-day/.test(d)){
      return 'daily_quota';
    }
    if(/insufficient|no credit|requires more credits|payment required/.test(d)) return 'no_credit';

    if(status === 401 || status === 403) return 'unauthorized';
    if(status === 402) return 'no_credit';
    if(status === 404) return 'bad_model';
    if(status === 408) return 'timeout';
    if(status === 413) return 'too_long';
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
    key_type:'Bu anahtar türü Gemini API’de kabul edilmiyor. Google AI Studio’da anahtarı '
      + 'sil ve yeni bir tane üret; hesabın hâlâ eski “AIza…” anahtarı veriyorsa onu kullan.',
    no_credit:'Bu hesapta kredi kalmamış. Ücretsiz bir model seç ya da başka sağlayıcı ekle.',
    bad_model:'Model bulunamadı. Ücretsiz model kimlikleri sık değişir: Ayarlar’da '
      + '“Modelleri yenile” ile sağlayıcının güncel listesini çek ve oradan seç.',
    rate_limited:'İstek sınırına takıldın. Birkaç dakika bekle ya da başka sağlayıcı dene.',
    server:'Sağlayıcı şu an yanıt vermiyor. Biraz sonra tekrar dene.',
    bad_request:'İstek reddedildi. Model kimliği ya da uç adresi hatalı olabilir.',
    too_long:'İstek bu model için fazla uzun. Daha kısa bir soru sor ya da geniş bağlamlı bir model seç.',
    network:'Bağlantı kurulamadı. İnternetini ve uç adresini kontrol et.',
    local_cors:'Kendi bilgisayarındaki sunucuya erişilemedi. Sunucu açık mı, adres doğru mu, '
      + 've tarayıcıdan erişime izin verdin mi? (Ollama için OLLAMA_ORIGINS="*" ile başlat.)',
    timeout:'Yanıt zaman aşımına uğradı. Daha hızlı bir model dene.',
    cancelled:'İptal edildi.',
    empty:'Model boş yanıt döndürdü. Tekrar dene.',
    thinking_only:'Bu model yalnızca kendi düşünme metnini döndürdü, cevabı yazmadı. '
      + 'Akıl yürüten modeller (R1, Qwen3 gibi) kısa yanıtlarda bunu sık yapar: '
      + 'listeden akıl yürütmeyen bir model seç.',
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
  const RETRYABLE = ['rate_limited', 'server', 'bad_model', 'timeout', 'empty', 'thinking_only', 'too_long'];
  /* Baglanti gelince kaldigi yerden devam edilebilecek hatalar. */
  const RESUMABLE = ['offline', 'network', 'server', 'timeout', 'local_cors'];
  function retryable(code){ return RETRYABLE.indexOf(code) >= 0; }
  function resumable(code){ return RESUMABLE.indexOf(code) >= 0; }

  /* Baglanti geri gelince haber verir; toplanti kaldigi yerden devam eder. */
  function onceOnline(fn){
    if(!offline()){ fn(); return function(){}; }
    const h = function(){ window.removeEventListener('online', h); fn(); };
    window.addEventListener('online', h);
    return function(){ window.removeEventListener('online', h); };
  }

  /* ---------- uc adresi ----------

     Iki ayri ariza buradan cikiyordu:

     1) SIZAN ADRES. Ayar ekrani, adres alani olmayan bir saglayici secildiginde
        de eski adresi geri veriyordu; Ollama'dan Groq'a gecen kullanicinin
        istekleri localhost:11434'e gidiyor ve "model cagrilamiyor" oluyordu.
        Cozum burada: adres YALNIZCA kendi adresini duzenleyebilen
        saglayicilarda dikkate alinir, digerlerinde katalogdaki resmî uc kullanilir.

     2) EKSIK YOL. Kullanici genelde taban adresi yapistirir (…/v1) ya da yalniz
        makine adini yazar (localhost:11434). Ikisi de 404 verirdi; tamamlanir. */

  function normalizeOpenAI(url){
    let u = String(url || '').trim().replace(/\s+/g, '');
    if(!u) return '';
    if(!/^https?:\/\//i.test(u)) u = 'http://' + u;      // "localhost:11434"
    const q = u.indexOf('?');
    const query = q >= 0 ? u.slice(q) : '';
    u = (q >= 0 ? u.slice(0, q) : u).replace(/\/+$/, '');
    if(/\/chat\/completions$/i.test(u)) return u + query;
    if(/\/chat$/i.test(u)) return u + '/completions' + query;
    if(/\/v\d+[a-z]*$/i.test(u)) return u + '/chat/completions' + query;
    return u + '/v1/chat/completions' + query;
  }

  function normalizeGemini(url){
    const u = String(url || '').trim().replace(/\/+$/, '');
    if(!u) return '';
    return /\/models$/i.test(u) ? u : u + '/models';
  }

  /* Bir cagrinin gercekten gidecegi adres. */
  function endpointFor(provider, cfg){
    const own = provider.editableEndpoint ? String((cfg && cfg.endpoint) || '').trim() : '';
    const base = own || provider.endpoint || '';
    return provider.kind === 'gemini' ? normalizeGemini(base) : normalizeOpenAI(base);
  }

  /* Anahtar hangi baslikla gider? Google'inki Bearer DEGILDIR. */
  function authHeaders(provider, key){
    if(!key) return {};
    if(provider.auth === 'google') return { 'x-goog-api-key':key };
    return { 'Authorization':'Bearer ' + key };
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
      const msg = String(e.message || e.detail || e.type || '');
      /* Hata kodu mesajda gecmiyorsa siniflama icin eklenir
         (Google sebebi `status`/`reason` alaninda tasir). */
      const extra = [e.status, e.reason, e.code].filter(x => typeof x === 'string').join(' ');
      return (msg + (extra && msg.indexOf(extra) < 0 ? ' ' + extra : '')).slice(0, 240);
    }catch(e){ return body.slice(0, 240); }
  }

  /* ---------- parametre onarimi ----------

     Ucler "OpenAI uyumlu" olsa da parametrelerde ayrisir: bazilari artik
     max_tokens yerine max_completion_tokens ister, bazisi temperature
     kabul etmez, Gemini 3 thinkingBudget yerine thinkingLevel bekler.
     Bunlarin hepsi 400 doner ve kullaniciya "istek reddedildi" diye
     gorunurdu.

     Cozum: 400'un govdesi hangi alandan sikâyet ediyorsa o alan duzeltilir
     ve istek BIR KEZ tekrarlanir. Duzeltme model basina hatirlanir, boylece
     ikinci istekten sonra fazladan tur olmaz. */

  const repairs = new Map();               // 'provider|model' -> { ... }
  function repairKey(cfg){ return cfg.provider + '|' + cfg.model; }
  function repairOf(cfg){ return repairs.get(repairKey(cfg)) || {}; }
  function learnRepair(cfg, patch){
    const next = Object.assign({}, repairOf(cfg), patch);
    repairs.set(repairKey(cfg), next);
    return next;
  }

  /* 400 govdesinden cikarilabilecek duzeltme; yoksa null. */
  function repairFor(detail, current){
    const d = String(detail || '').toLowerCase();
    const now = current || {};
    if(d.indexOf('max_completion_tokens') >= 0 && now.tokenField !== 'max_completion_tokens'){
      return { tokenField:'max_completion_tokens' };
    }
    if(d.indexOf('temperature') >= 0 && !now.dropTemperature){
      return { dropTemperature:true };
    }
    if(/thinking|thought/.test(d) && !now.dropThinking){
      return { dropThinking:true };
    }
    if(/system_instruction|systeminstruction|'system'|"system"|system role/.test(d) && !now.systemAsUser){
      return { systemAsUser:true };
    }
    return null;
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
    return { text, finish:'' };
  }

  /* ---------- OpenAI uyumlu cagri ---------- */

  function openaiBody(req, fix, stream){
    const messages = [];
    if(req.system){
      /* Bazi ucler 'system' rolunu reddeder; onarim ogrenildiyse ilk
         kullanici mesajina katilir. */
      if(fix.systemAsUser) messages.push({ role:'user', content:req.system });
      else messages.push({ role:'system', content:req.system });
    }
    (req.messages || []).forEach(m => messages.push({ role:m.role, content:m.text }));

    const body = { model:req.model, messages, stream:!!stream };
    const budget = req.maxTokens || DEFAULT_MAX_TOKENS;
    if(fix.tokenField === 'max_completion_tokens') body.max_completion_tokens = budget;
    else body.max_tokens = budget;
    if(!fix.dropTemperature) body.temperature = req.temperature == null ? 0.4 : req.temperature;
    return body;
  }

  async function callOpenAI(req, provider){
    const key = req.key;
    if(!key && provider.needsKey) throw fail('no_key');
    const endpoint = req.endpoint;
    if(!endpoint) throw fail('no_endpoint');

    const headers = Object.assign(
      { 'Content-Type':'application/json' },
      authHeaders(provider, key));
    /* OpenRouter kaynak basligi bekler; tarayicidan gonderilmesi serbesttir. */
    if(provider.id === 'openrouter'){
      headers['HTTP-Referer'] = location.origin || 'https://rota.local';
      headers['X-Title'] = 'Rota — YKS ofisi';
    }

    const stream = !!req.onText;
    const cfgKey = { provider:provider.id, model:req.model };
    let fix = repairOf(cfgKey);
    let response;
    let guard;

    /* En fazla iki tur: ilk istek + ogrenilen tek duzeltme. */
    for(let attempt = 0; attempt < 2; attempt++){
      guard = withTimeout(req.signal, req.timeout);
      try{
        response = await fetch(endpoint, {
          method:'POST', headers, signal:guard.signal,
          body:JSON.stringify(openaiBody(req, fix, stream)),
        });
      }catch(e){
        guard.done();
        if(guard.timedOut()) throw fail('timeout');
        if(req.signal && req.signal.aborted) throw fail('cancelled');
        throw fail(networkCode(endpoint), e && e.message);
      }

      if(response.ok) break;

      const detail = await errorMessage(response);
      const code = classify(response.status, detail);
      guard.done();
      /* Saglayici bizim saydigimizdan daha siki davraniyor: pencereyi kapat. */
      if(code === 'rate_limited' || code === 'daily_quota'){
        R.Quota.penalize({ provider:provider.id, model:req.model, keyId:req.keyId }, retryAfterSeconds(response));
      }
      const patch = response.status === 400 ? repairFor(detail, fix) : null;
      if(!patch || attempt === 1) throw fail(code, detail);
      fix = learnRepair(cfgKey, patch);
    }

    let text = '';
    let finish = '';
    let reasoned = false;
    try{
      const ctype = response.headers.get('content-type') || '';
      if(stream && ctype.indexOf('event-stream') >= 0){
        await readSSE(response, obj => {
          const ch = obj.choices && obj.choices[0];
          if(!ch) return;
          /* Bitis sebebi genelde SON karede, govdesi bos olarak gelir:
             delta kontrolunden ONCE okunmali, yoksa kesilme hic gorulmez. */
          if(ch.finish_reason) finish = String(ch.finish_reason);
          const d = ch.delta || {};
          /* Ayri akil yurutme akisi cevaba KARISMAZ; yalniz varligi not edilir. */
          if(d.reasoning || d.reasoning_content) reasoned = true;
          const delta = d.content || ch.text;
          if(!delta) return;
          text += delta;
          req.onText({ text:stripThinking(text), delta });
        });
      }else{
        /* Akis istendigi hâlde duz JSON dondu — ayni govdeden okunur. */
        const json = await response.json();
        const ch = json.choices && json.choices[0];
        const msg = (ch && ch.message) || {};
        if(ch && ch.finish_reason) finish = String(ch.finish_reason);
        if(msg.reasoning || msg.reasoning_content) reasoned = true;
        text = String(msg.content || (ch && ch.text) || '');
        if(req.onText && text) req.onText({ text:stripThinking(text), delta:text });
      }
    }catch(e){
      if(guard.timedOut()) { guard.done(); throw fail('timeout'); }
      if(req.signal && req.signal.aborted){ guard.done(); throw fail('cancelled'); }
      guard.done();
      throw fail('server', e && e.message);
    }
    guard.done();

    const shown = stripThinking(text);
    if(!shown) throw fail(reasoned || text.trim() ? 'thinking_only' : 'empty');
    return { text:shown, finish };
  }

  /* ---------- Gemini cagrisi ---------- */

  /* "Dusunme" cevapla ayni butceden yer: acik birakilirsa model butceyi
     dusunerek harcar ve cevap YARIM ya da BOS doner. Ofis ajanlari kisa
     konusur, dusunmeye ihtiyaclari yok — kapatilir.

     Alan aileye gore degisir ve DESTEKLEMEYEN modele gonderilirse 400 verir:
       2.5 flash / flash-lite  → thinkingConfig.thinkingBudget = 0
       3.x                     → thinkingConfig.thinkingLevel  = 'low'
     Tanimadigimiz bir model icin hicbir sey gonderilmez; yanlis tahmin
     etmektense modele karismamak dogrudur. Yine de 400 gelirse parametre
     onarimi alani tumden dusurur. */
  function thinkingFor(model){
    const m = String(model || '');
    if(/^gemini-2\.5.*(flash|lite)/i.test(m)) return { thinkingBudget:0 };
    if(/^gemini-3/i.test(m)) return { thinkingLevel:'low' };
    return null;
  }

  function geminiBody(req, fix){
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
    const think = fix.dropThinking ? null : thinkingFor(req.model);
    if(think) body.generationConfig.thinkingConfig = think;
    if(req.system){
      if(fix.systemAsUser) body.contents.unshift({ role:'user', parts:[{ text:req.system }] });
      else body.systemInstruction = { parts:[{ text:req.system }] };
    }
    return body;
  }

  async function callGemini(req, provider){
    const key = req.key;
    if(!key) throw fail('no_key');
    const base = req.endpoint;
    if(!base) throw fail('no_endpoint');
    const stream = !!req.onText;
    /* Anahtar ARTIK adres satirinda gitmiyor: baslikla gider. Sorgu dizesi
       tarayici gecmisine, Referer'a ve vekil gunluklerine dusuyordu; ayrica
       yeni "AQ." anahtarlari nokta iceriyor ve kacislarla ugrasmak gereksiz. */
    const path = base + '/' + encodeURIComponent(req.model) + ':'
      + (stream ? 'streamGenerateContent?alt=sse' : 'generateContent');

    const headers = Object.assign(
      { 'Content-Type':'application/json' },
      authHeaders(provider, key));

    const cfgKey = { provider:provider.id, model:req.model };
    let fix = repairOf(cfgKey);
    let response;
    let guard;

    for(let attempt = 0; attempt < 2; attempt++){
      guard = withTimeout(req.signal, req.timeout);
      try{
        response = await fetch(path, {
          method:'POST', headers, signal:guard.signal,
          body:JSON.stringify(geminiBody(req, fix)),
        });
      }catch(e){
        guard.done();
        if(guard.timedOut()) throw fail('timeout');
        if(req.signal && req.signal.aborted) throw fail('cancelled');
        throw fail(networkCode(path), e && e.message);
      }

      if(response.ok) break;

      const detail = await errorMessage(response);
      const code = classify(response.status, detail);
      guard.done();
      if(code === 'rate_limited' || code === 'daily_quota'){
        R.Quota.penalize({ provider:provider.id, model:req.model, keyId:req.keyId }, retryAfterSeconds(response));
      }
      const patch = response.status === 400 ? repairFor(detail, fix) : null;
      if(!patch || attempt === 1) throw fail(code, detail);
      fix = learnRepair(cfgKey, patch);
    }

    function partsText(obj){
      const cand = obj.candidates && obj.candidates[0];
      const parts = cand && cand.content && cand.content.parts;
      /* Dusunme parcalari metin degildir; cevaba karistirilmaz. */
      return (parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
    }
    function thoughtSeen(obj){
      const cand = obj.candidates && obj.candidates[0];
      const parts = (cand && cand.content && cand.content.parts) || [];
      return parts.some(p => p.thought);
    }
    function finishOf(obj){
      const cand = obj.candidates && obj.candidates[0];
      return (cand && cand.finishReason) ? String(cand.finishReason) : '';
    }
    /* Icerik suzgeci yaniti tumden engelleyebilir; sebebi 'candidates'
       yerine 'promptFeedback' altinda gelir. */
    function blockedBy(obj){
      const f = obj.promptFeedback;
      return (f && f.blockReason) ? String(f.blockReason) : '';
    }

    let text = '';
    let finish = '';
    let thought = false;
    let blocked = '';
    try{
      const ctype = response.headers.get('content-type') || '';
      if(stream && ctype.indexOf('event-stream') >= 0){
        await readSSE(response, obj => {
          const f = finishOf(obj);
          if(f) finish = f;
          if(!blocked) blocked = blockedBy(obj);
          if(thoughtSeen(obj)) thought = true;
          const delta = partsText(obj);
          if(!delta) return;
          text += delta;
          req.onText({ text:stripThinking(text), delta });
        });
      }else{
        const json = await response.json();
        const list = Array.isArray(json) ? json : [json];
        text = list.map(partsText).join('');
        list.forEach(o => {
          const f = finishOf(o); if(f) finish = f;
          if(!blocked) blocked = blockedBy(o);
          if(thoughtSeen(o)) thought = true;
        });
        if(req.onText && text) req.onText({ text:stripThinking(text), delta:text });
      }
    }catch(e){
      if(guard.timedOut()){ guard.done(); throw fail('timeout'); }
      if(req.signal && req.signal.aborted){ guard.done(); throw fail('cancelled'); }
      guard.done();
      throw fail('server', e && e.message);
    }
    guard.done();

    const shown = stripThinking(text);
    if(!shown){
      if(blocked) throw fail('bad_request', 'içerik süzgeci engelledi: ' + blocked);
      /* Butce dusunmeye gitti: bos yanit "tekrar dene" degil, model degistir
         demektir — ayni model ayni sekilde davranir. */
      if(thought || truncated(finish)) throw fail('thinking_only');
      throw fail('empty');
    }
    return { text:shown, finish };
  }

  /* ---------- canli model listesi ----------

     Ucretsiz model kimlikleri aylik doner ve katalog kacinilmaz olarak eskir;
     eskidiginde kullanici "model bulunamadi" duvarina carpar ve dogru kimligi
     bilmesinin hicbir yolu yoktur. Bu yuzden liste artik saglayicinin kendi
     ucundan cekilebilir ve tarayicida saklanir.

     Cagri bir SOHBET istegi degildir: gunluk kotadan dusmez, kota
     yoneticisinden gecmez. */

  function readCatalog(){
    try{ return JSON.parse(localStorage.getItem(MODEL_STORE) || '{}'); }
    catch(e){ return {}; }
  }
  function writeCatalog(all){
    try{ localStorage.setItem(MODEL_STORE, JSON.stringify(all)); }catch(e){}
  }
  /* { models:[{id,label,free}], at } ya da null. */
  function cachedModels(providerId){
    const e = readCatalog()[providerId];
    return (e && Array.isArray(e.models) && e.models.length) ? e : null;
  }
  function clearCatalog(providerId){
    if(!providerId){ try{ localStorage.removeItem(MODEL_STORE); }catch(e){} return; }
    const all = readCatalog();
    delete all[providerId];
    writeCatalog(all);
  }

  /* Ekranin gordugu liste: canli liste varsa O, yoksa katalog tohumu.
     Tohumdaki etiket ve guc bilgisi canli kimlikle eslesirse korunur —
     "Llama 3.3 70B · denge" okunakli, ham kimlik degildir. */
  function modelsFor(providerId){
    const p = R.PROVIDERS[providerId];
    if(!p) return [];
    const seed = p.models || [];
    const live = cachedModels(providerId);
    if(!live) return seed.slice();
    const byId = {};
    seed.forEach(m => { byId[m.id] = m; });
    return live.models.map(m => Object.assign({}, m, byId[m.id] || {}, { id:m.id, free:m.free }));
  }

  /* Ham listeyi kimlige gore duzenler: ucretsizler once, sonra alfabetik. */
  function sortModels(list){
    return list.sort((a, b) => {
      if(!!a.free !== !!b.free) return a.free ? -1 : 1;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
  }

  /* Bir modelin ucretsiz olup olmadigi: OpenRouter fiyati sifir yazar ve
     kimligi ":free" ile biter; digerlerinde fiyat bilgisi yoktur. */
  function freeFlag(providerId, row){
    if(/:free$/.test(String(row.id || ''))) return true;
    const p = row.pricing;
    if(p && (Number(p.prompt) === 0 && Number(p.completion) === 0)) return true;
    return providerId !== 'openrouter';   // Groq, yerel ucler: hepsi ucretsiz
  }

  async function fetchJson(url, headers, signal){
    const guard = withTimeout(signal, 25000);
    let response;
    try{
      response = await fetch(url, { method:'GET', headers, signal:guard.signal });
    }catch(e){
      guard.done();
      if(guard.timedOut()) throw fail('timeout');
      if(signal && signal.aborted) throw fail('cancelled');
      throw fail(networkCode(url), e && e.message);
    }
    if(!response.ok){
      const detail = await errorMessage(response);
      guard.done();
      throw fail(classify(response.status, detail), detail);
    }
    try{
      const json = await response.json();
      guard.done();
      return json;
    }catch(e){
      guard.done();
      throw fail('server', e && e.message);
    }
  }

  /* Saglayicinin guncel model listesini ceker ve saklar. */
  async function listModels(cfg, opts){
    const o = opts || {};
    const provider = R.PROVIDERS[cfg && cfg.provider];
    if(!provider) throw fail('no_provider');
    if(provider.kind === 'builtin') return { models:(provider.models || []).slice(), at:null, live:false };
    if(offline()) throw fail('offline');

    const key = getKey(provider.id);
    if(provider.needsKey && !key) throw fail('no_key');

    /* Adres: ozel ucte model listesi chat adresinden turetilir. */
    let url = provider.modelsUrl || '';
    if(!url || provider.editableEndpoint){
      const chat = endpointFor(provider, cfg);
      if(!chat) throw fail('no_endpoint');
      url = provider.kind === 'gemini' ? chat : chat.replace(/\/chat\/completions.*$/, '/models');
    }

    const json = await fetchJson(url, authHeaders(provider, key), o.signal);

    let models = [];
    if(provider.kind === 'gemini'){
      /* Google 'models/gemini-…' seklinde tam ad doner; ustelik listede
         gomme (embedding) ve baska yetenekler de vardir. Sohbet edemeyen
         model listeye girerse kullanici onu secip 400 alir. */
      models = (json.models || [])
        .filter(m => (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0)
        .map(m => ({
          id:String(m.name || '').replace(/^models\//, ''),
          label:m.displayName || null,
          free:true,
        }))
        .filter(m => m.id && !/embedding|aqa|imagen|veo|tts|image-generation/i.test(m.id));
    }else{
      models = (json.data || json.models || [])
        .map(m => ({ id:String(m.id || m.name || ''), label:m.name && m.id !== m.name ? m.name : null,
          free:freeFlag(provider.id, m) }))
        .filter(m => m.id);
    }
    if(!models.length) throw fail('empty');

    /* Ucretsiz katmani olan saglayicida ucretli modeli listede tutmak
       kullaniciyi 402'ye gonderir; ayiklanir. */
    if(provider.id === 'openrouter') models = models.filter(m => m.free);

    const entry = { models:sortModels(models), at:new Date().toISOString() };
    const all = readCatalog();
    all[provider.id] = entry;
    writeCatalog(all);
    return Object.assign({}, entry, { live:true });
  }

  /* ---------- kamu API ---------- */

  /* Tek cagri. cfg: { provider, model, endpoint } — anahtar depodan okunur.
     req: { system, messages:[{role,text}], maxTokens, temperature, signal, onText } */
  async function chat(cfg, req){
    const provider = R.PROVIDERS[cfg && cfg.provider];
    if(!provider) throw fail('no_provider');
    if(!cfg.model && provider.kind !== 'builtin') throw fail('no_model');

    /* Cevrimdisiyken hic deneme: kota harcanmaz, sebep dogru soylenir. */
    if(provider.kind !== 'builtin' && offline()) throw fail('offline');

    const endpoint = provider.kind === 'builtin' ? '' : endpointFor(provider, cfg);
    if(provider.kind !== 'builtin' && !endpoint) throw fail('no_endpoint');

    /* Anahtar zorunlu olmayan ucte de anahtar GIRILDIYSE kullanilir:
       kendi sunucusunun onunde vekil olan kullanici bunu bekler. */
    const keyCount = getKeys(provider.id).length;
    const wantsKey = provider.needsKey || (provider.keyOptional && keyCount > 0);

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
      if(wantsKey){
        if(!keyCount) throw fail('no_key');
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
        endpoint,
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
      slot = await R.Quota.acquire(quotaCfg, { signal:req && req.signal, onWait:req && req.onWait });
      waited += slot.waited || 0;

      let out;
      try{
        if(provider.kind === 'builtin') out = await callBuiltin(payload);
        else if(provider.kind === 'gemini') out = await callGemini(payload, provider);
        else out = await callOpenAI(payload, provider);
      }catch(err){
        /* Istek hic gonderilemediyse gunluk hakki tuketmis sayma. */
        if(err && (err.code === 'cancelled' || err.code === 'sandboxed'
                || err.code === 'no_key' || err.code === 'offline'
                || err.code === 'local_cors' || err.code === 'no_endpoint')){
          R.Quota.release(quotaCfg);
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

  /* ---------- tanilama ----------

     "Bağlanamadı" tek basina hicbir sey ogretmez: sorun anahtarda mi,
     model kimliginde mi, adreste mi, ortamda mi? Tanilama zinciri sirayla
     bakar ve ILK kirilan halkayi soyler. Her adim kendi sonucunu tasir,
     boylece ekran "anahtar tamam, model listesi geldi, sohbet 404 verdi"
     diyebilir — kullanici artik nereye bakacagini bilir. */
  async function diagnose(cfg, opts){
    const o = opts || {};
    const provider = R.PROVIDERS[cfg && cfg.provider];
    const steps = [];
    const add = (name, ok, note, code) => { steps.push({ name, ok, note:note || '', code:code || null }); return ok; };

    if(!provider){ add('Sağlayıcı', false, errorText('no_provider'), 'no_provider'); return { ok:false, steps }; }
    add('Sağlayıcı', true, provider.label);

    if(provider.kind === 'builtin'){
      const ready = builtinReady() || await initBuiltin();
      add('Yerleşik yetenek', ready, ready ? 'açık' : errorText('unavailable'), ready ? null : 'unavailable');
      return { ok:ready, steps };
    }

    /* 1. ortam */
    if(offline()){ add('Ağ', false, errorText('offline'), 'offline'); return { ok:false, steps }; }
    const endpoint = endpointFor(provider, cfg);
    if(inSandbox() && !isLocal(endpoint)){
      add('Ortam', false, errorText('sandboxed'), 'sandboxed');
    }else{
      add('Ortam', true, 'dış çağrılara açık');
    }

    /* 2. adres */
    if(!endpoint){ add('Uç adresi', false, errorText('no_endpoint'), 'no_endpoint'); return { ok:false, steps }; }
    add('Uç adresi', true, endpoint);

    /* 3. anahtar (bicim) */
    const keys = getKeys(provider.id);
    if(provider.needsKey && !keys.length){
      add('API anahtarı', false, errorText('no_key'), 'no_key');
      return { ok:false, steps };
    }
    if(keys.length){
      const problem = keyProblem(provider.id, keys[0]);
      add('API anahtarı', !problem || problem.level !== 'wrong',
        problem ? problem.text : keys.length + ' anahtar bağlı · biçim tanıdık',
        problem && problem.level === 'wrong' ? 'unauthorized' : null);
    }else{
      add('API anahtarı', true, 'gerekmiyor');
    }

    /* 4. model listesi — anahtari da dogrular, kotadan dusmez */
    let known = null;
    try{
      const res = await listModels(cfg, { signal:o.signal });
      known = res.models.map(m => m.id);
      add('Model listesi', true, res.models.length + ' model çekildi');
    }catch(err){
      const code = err && err.code;
      add('Model listesi', false, errorText(code)
        + (err && err.message && err.message !== code ? ' — ' + String(err.message).slice(0, 120) : ''), code);
      /* Anahtar reddedildiyse ileriye bakmanin anlami yok. */
      if(code === 'unauthorized' || code === 'key_type') return { ok:false, steps };
    }

    /* 5. secili model gercekten listede mi */
    if(known && cfg.model){
      const has = known.indexOf(cfg.model) >= 0;
      add('Seçili model', has, has ? cfg.model
        : cfg.model + ' bu listede yok. “Modelleri yenile” ile listeyi güncelle ve oradan seç.',
        has ? null : 'bad_model');
    }

    /* 6. gercek cagri */
    try{
      const res = await test(cfg);
      add('Sohbet çağrısı', true, res.ms + ' ms · yanıt: “' + res.text + '”');
      return { ok:true, steps };
    }catch(err){
      const code = err && err.code;
      add('Sohbet çağrısı', false, errorText(code)
        + (err && err.message && err.message !== code ? ' — ' + String(err.message).slice(0, 120) : ''), code);
      return { ok:false, steps };
    }
  }

  /* Bir yapilandirmanin kullanilabilir olup olmadigi (cagri yapmadan). */
  function ready(cfg){
    const provider = R.PROVIDERS[cfg && cfg.provider];
    if(!provider) return false;
    if(provider.kind === 'builtin') return builtinReady();
    if(provider.needsKey && !getKeys(provider.id).length) return false;
    if(provider.editableEndpoint && !(cfg.endpoint || '').trim()) return false;
    return !!cfg.model;
  }

  return {
    initBuiltin, builtinReady,
    getKey, getKeys, setKey, addKey, removeKeyAt, clearKeys, maskKey, maskKeys, pickKey,
    keyOwner, keyProblem,
    chat, complete, test, ready, diagnose,
    listModels, modelsFor, cachedModels, clearCatalog, MODEL_STORE,
    errorText, retryable, resumable, offline, onceOnline, inSandbox, KEY_STORE,
    truncated, trimToSentence, joinContinuation, dropLastWord, stripThinking,
    endpointFor, normalizeOpenAI, normalizeGemini, classify,
    DEFAULT_MAX_TOKENS,
  };
})();
