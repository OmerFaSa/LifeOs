/* Model saglayicilari — ofis ajanlarinin kullandigi ucretsiz LLM uclari.

   Bu dosya ICERIKTIR, mantik degil: uc nokta adresleri, model kimlikleri ve
   istek sinirlari saglayicilar tarafindan sik degistirilir. Liste eskirse
   kullanici Ofis → Ayarlar ekranindan kendi model kimligini yazabilir;
   motor (core/llm.js) ve kota yoneticisi (core/quota.js) burayi yalnizca okur.

   SINIRLAR (limits): { rpm, rpd, tpm } — saglayicinin ucretsiz katmani.
   core/quota.js bunlarin %85'ini kullanir ve istekler arasina
   60000/rpm ms bosluk koyar; boylece sinir hic asilmaz.
   Deger bilinmiyorsa alan yazilmaz ve o eksen sinirsiz sayilir.

   Kaynak ve tarih her saglayicinin `checked` alaninda durur; sayilar
   degistiginde yalnizca bu dosya guncellenir.

   Gizlilik: API anahtari yalnizca tarayicida, ayri bir localStorage
   anahtarinda durur. Yedege girmez, buluta gitmez, LLM'e gonderilmez. */

window.R = window.R || {};

R.PROVIDERS = {

  /* Uygulama Artifact olarak calisirken acik olan yerlesik yetenek.
     Anahtar istemez; ucretsiz modellerin hicbiri kurulmadan da ofis calisir. */
  builtin: {
    id:'builtin',
    label:'Yerleşik (bu uygulama)',
    kind:'builtin',
    free:true,
    needsKey:false,
    note:'Uygulama Claude içinde çalışıyorsa açıktır. Anahtar istemez, ayar gerektirmez.',
    /* Yerlesik yetenegin kendi sinirlari vardir ve disaridan okunamaz;
       kota yoneticisi bu yuzden araya girmez. */
    models:[
      { id:'default', label:'Varsayılan', strength:'denge' },
      { id:'quick',   label:'Hızlı',      strength:'hız' },
    ],
  },

  openrouter: {
    id:'openrouter',
    label:'OpenRouter',
    kind:'openai',
    free:true,
    needsKey:true,
    endpoint:'https://openrouter.ai/api/v1/chat/completions',
    keyUrl:'https://openrouter.ai/keys',
    keyHint:'sk-or-v1-…',
    note:'Ücretsiz modellerin çoğu burada toplanır. Dakikada 20 istek sınırı vardır; '
       + 'günlük hak hesabında hiç kredi yoksa 50, bir kez 10 $ yüklediysen 1000 istektir.',
    checked:'2026-09 · openrouter.ai/docs/api-reference/limits',
    /* Tum ucretsiz modeller ayni havuzu paylasir. */
    limits:{ rpm:20, rpd:50 },
    /* Gunluk hak hesaba bagli oldugu icin kullanici ayarlardan yukseltebilir. */
    rpdChoices:[
      { value:50,   label:'50 / gün — hiç kredi yüklemedim' },
      { value:1000, label:'1000 / gün — bir kez 10 $ yükledim' },
    ],
    models:[
      { id:'deepseek/deepseek-chat-v3-0324:free',            label:'DeepSeek V3',       free:true, strength:'analiz' },
      { id:'meta-llama/llama-3.3-70b-instruct:free',         label:'Llama 3.3 70B',     free:true, strength:'denge' },
      { id:'google/gemini-2.0-flash-exp:free',               label:'Gemini 2.0 Flash',  free:true, strength:'hız' },
      { id:'qwen/qwen-2.5-72b-instruct:free',                label:'Qwen 2.5 72B',      free:true, strength:'denge' },
      { id:'mistralai/mistral-small-3.2-24b-instruct:free',  label:'Mistral Small 3.2', free:true, strength:'hız' },
      { id:'deepseek/deepseek-r1-0528:free',                 label:'DeepSeek R1',       free:true, strength:'akıl yürütme' },
    ],
  },

  groq: {
    id:'groq',
    label:'Groq',
    kind:'openai',
    free:true,
    needsKey:true,
    endpoint:'https://api.groq.com/openai/v1/chat/completions',
    keyUrl:'https://console.groq.com/keys',
    keyHint:'gsk_…',
    note:'Ücretsiz katmanı çok hızlıdır: dakikada 30 istek. Günlük hak modele göre '
       + '1000 ile 14 400 arasında değişir. Toplantı için en akıcı seçenek.',
    checked:'2026-09 · console.groq.com/docs/rate-limits',
    limits:{ rpm:30, rpd:1000 },
    models:[
      { id:'llama-3.3-70b-versatile', label:'Llama 3.3 70B', free:true, strength:'denge',
        limits:{ rpm:30, rpd:1000,  tpm:12000 } },
      { id:'llama-3.1-8b-instant',    label:'Llama 3.1 8B',  free:true, strength:'hız',
        limits:{ rpm:30, rpd:14400, tpm:6000 } },
      { id:'openai/gpt-oss-20b',      label:'GPT-OSS 20B',   free:true, strength:'denge',
        limits:{ rpm:30, rpd:1000,  tpm:8000 } },
      { id:'qwen/qwen3-32b',          label:'Qwen 3 32B',    free:true, strength:'analiz',
        limits:{ rpm:30, rpd:1000,  tpm:6000 } },
    ],
  },

  gemini: {
    id:'gemini',
    label:'Google AI Studio',
    kind:'gemini',
    free:true,
    needsKey:true,
    endpoint:'https://generativelanguage.googleapis.com/v1beta/models',
    keyUrl:'https://aistudio.google.com/apikey',
    keyHint:'AIza…',
    note:'Ücretsiz katmanda günde 1500 isteğe kadar hak vardır; dakikalık sınır '
       + 'Flash için 15, Flash-Lite için 30 istektir. Uzun toplantılar için uygun.',
    checked:'2026-09 · ai.google.dev/gemini-api/docs/rate-limits',
    limits:{ rpm:15, rpd:1500 },
    /* thinking: modelin "dusunme" ayari — ofis ajanlari kisa konusur,
       dusunmeye ihtiyaclari yoktur ve acik birakilirsa AYNI cikti
       butcesinden yiyip yaniti yarim birakir.

         { mode:'level',  value:'LOW' }  3.x ailesi — thinkingLevel
         { mode:'budget', value:0 }      2.5 ailesi — thinkingBudget
         yok                             dusunmeyen model, alan gonderilmez

       Alan modelce reddedilirse (400) istek bir kez de alansiz denenir;
       yani buradaki deger yanlissa uygulama durmaz, yalnizca modelin
       varsayilan dusunmesiyle calisir. */
    models:[
      { id:'gemini-3.5-flash',      label:'Gemini 3.5 Flash',      free:true, strength:'analiz',
        thinking:{ mode:'level', value:'LOW' }, limits:{ rpm:15, rpd:1500 } },
      { id:'gemini-3.5-flash-lite', label:'Gemini 3.5 Flash Lite', free:true, strength:'hız',
        thinking:{ mode:'level', value:'LOW' }, limits:{ rpm:30, rpd:1500 } },
      { id:'gemini-2.5-flash',      label:'Gemini 2.5 Flash',      free:true, strength:'denge',
        thinking:{ mode:'budget', value:0 }, limits:{ rpm:15, rpd:1500 } },
      { id:'gemini-2.5-flash-lite', label:'Gemini 2.5 Flash Lite', free:true, strength:'hız',
        thinking:{ mode:'budget', value:0 }, limits:{ rpm:30, rpd:1500 } },
    ],
  },

  /* Bilgisayarda calisan model. Kotasi, ucreti ve internet ihtiyaci YOKTUR;
     ucretsiz katmanlarin butun sinirlarindan kacmanin tek yolu budur. */
  ollama: {
    id:'ollama',
    label:'Ollama (kendi bilgisayarın)',
    kind:'openai',
    free:true,
    needsKey:false,
    endpoint:'http://localhost:11434/v1/chat/completions',
    editableEndpoint:true,
    keyUrl:'https://ollama.com/download',
    note:'Modeli kendi bilgisayarında çalıştırır: kota yok, ücret yok, internet gerekmez. '
       + 'Tarayıcıdan erişebilmek için Ollama’yı OLLAMA_ORIGINS="*" ile başlatman gerekir. '
       + 'Türkçe için 7B ve üstü bir model seç.',
    checked:'2026-09 · ollama.com/blog/openai-compatibility',
    models:[
      { id:'llama3.1:8b',   label:'Llama 3.1 8B',   free:true, strength:'denge' },
      { id:'qwen2.5:7b',    label:'Qwen 2.5 7B',    free:true, strength:'hız' },
      { id:'gemma2:9b',     label:'Gemma 2 9B',     free:true, strength:'denge' },
      { id:'mistral-nemo',  label:'Mistral Nemo',   free:true, strength:'analiz' },
    ],
  },

  lmstudio: {
    id:'lmstudio',
    label:'LM Studio (kendi bilgisayarın)',
    kind:'openai',
    free:true,
    needsKey:false,
    endpoint:'http://localhost:1234/v1/chat/completions',
    editableEndpoint:true,
    keyUrl:'https://lmstudio.ai',
    note:'LM Studio’da yerel sunucuyu başlat ve CORS’u aç. Kota yok, ücret yok. '
       + 'Model kimliğini LM Studio’nun sunucu ekranından kopyala.',
    checked:'2026-09 · lmstudio.ai/docs/local-server',
    models:[],
  },

  /* Kendi sunucusunu ya da listede olmayan bir saglayiciyi kullanmak icin.
     OpenAI uyumlu /chat/completions bekler. Sinir bilinmedigi icin
     kota yoneticisi araya girmez; kullanici kendi sinirini ayarlardan yazar. */
  custom: {
    id:'custom',
    label:'Özel uç (OpenAI uyumlu)',
    kind:'openai',
    free:false,
    needsKey:true,
    endpoint:'',
    editableEndpoint:true,
    keyHint:'anahtarın',
    note:'OpenAI uyumlu bir /chat/completions adresi ver. Ollama, LM Studio ya da '
       + 'listede olmayan bir servis buradan bağlanır. İstek sınırını kendin yazabilirsin.',
    models:[],
  },
};

/* Sirali liste — ayar ekrani bu sirayla gosterir. */
R.PROVIDER_ORDER = ['builtin', 'openrouter', 'groq', 'gemini', 'ollama', 'lmstudio', 'custom'];

/* Ajan basina onerilen model gucu: kural motoru zaten hesabi yapar,
   modelden beklenen yalnizca kisa ve net Turkce yorumdur. */
R.MODEL_TIERS = {
  hiz:   { label:'Hızlı',   note:'Kısa yorumlar için yeterli' },
  denge: { label:'Dengeli', note:'Günlük kullanım' },
  analiz:{ label:'Derin',   note:'Toplantı ve kök neden için' },
};
