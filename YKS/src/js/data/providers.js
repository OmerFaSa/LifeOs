/* Model saglayicilari — ofis ajanlarinin kullandigi ucretsiz LLM uclari.

   Bu dosya ICERIKTIR, mantik degil: uc nokta adresleri ve model kimlikleri
   saglayicilar tarafindan sik degistirilir. Liste eskirse kullanici
   Ofis → Ayarlar ekranindan kendi model kimligini yazabilir; motor
   (core/llm.js) buradaki kayitlari yalnizca okur.

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
    note:'Ücretsiz modellerin çoğu burada toplanır. Günlük istek sınırı vardır; '
       + 'sınıra takılınca motor yedek modele geçer.',
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
    note:'Ücretsiz katmanı çok hızlıdır; dakikalık istek sınırı düşüktür. '
       + 'Toplantı gibi arka arkaya çağrılarda sınıra takılabilir.',
    models:[
      { id:'llama-3.3-70b-versatile', label:'Llama 3.3 70B', free:true, strength:'denge' },
      { id:'llama-3.1-8b-instant',    label:'Llama 3.1 8B',  free:true, strength:'hız' },
      { id:'openai/gpt-oss-20b',      label:'GPT-OSS 20B',   free:true, strength:'denge' },
      { id:'qwen/qwen3-32b',          label:'Qwen 3 32B',    free:true, strength:'analiz' },
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
    note:'Ücretsiz katmanda günlük istek hakkı geniştir. Uzun toplantılar için uygundur.',
    models:[
      { id:'gemini-2.0-flash',      label:'Gemini 2.0 Flash',      free:true, strength:'denge' },
      { id:'gemini-2.5-flash',      label:'Gemini 2.5 Flash',      free:true, strength:'analiz' },
      { id:'gemini-2.0-flash-lite', label:'Gemini 2.0 Flash Lite', free:true, strength:'hız' },
    ],
  },

  /* Kendi sunucusunu ya da listede olmayan bir saglayiciyi kullanmak icin.
     OpenAI uyumlu /chat/completions bekler. */
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
       + 'listede olmayan bir servis buradan bağlanır.',
    models:[],
  },
};

/* Sirali liste — ayar ekrani bu sirayla gosterir. */
R.PROVIDER_ORDER = ['builtin', 'openrouter', 'groq', 'gemini', 'custom'];

/* Ajan basina onerilen model gucu: kural motoru zaten hesabi yapar,
   modelden beklenen yalnizca kisa ve net Turkce yorumdur. */
R.MODEL_TIERS = {
  hiz:   { label:'Hızlı',   note:'Kısa yorumlar için yeterli' },
  denge: { label:'Dengeli', note:'Günlük kullanım' },
  analiz:{ label:'Derin',   note:'Toplantı ve kök neden için' },
};
