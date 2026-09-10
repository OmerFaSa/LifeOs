/* Model saglayicilari — ofis ajanlarinin kullandigi ucretsiz LLM uclari.

   Bu dosya ICERIKTIR, mantik degil: uc nokta adresleri, model kimlikleri ve
   istek sinirlari saglayicilar tarafindan sik degistirilir. Motor
   (core/llm.js) ve kota yoneticisi (core/quota.js) burayi yalnizca okur.

   KATALOG ESKIR — VE BU NORMALDIR.
   Ucretsiz model kimlikleri aylik doner: OpenRouter'da ":free" listesi
   surekli degisir, Google 2.0 Flash'i Mart 2026'da emekli etti. Bu yuzden
   asagidaki liste artik TEK kaynak degil, yalnizca TOHUMDUR: kullanici
   ayar ekranindaki "Modelleri yenile" ile saglayicinin KENDI listesini
   ceker (R.LLM.listModels) ve secim o listeden yapilir. Buradaki liste
   yalnizca ilk acilista ve ag yokken kullanilir.

   SINIRLAR (limits): { rpm, rpd, tpm } — saglayicinin ucretsiz katmani.
   core/quota.js dakikalik sinirin %85'ini kullanir ve istekler arasina
   60000/rpm ms bosluk koyar; boylece sinir hic asilmaz.
   Deger bilinmiyorsa alan YAZILMAZ ve saglayicinin varsayilanina duser —
   uydurma sayi yazmak, sayi yazmamaktan kotudur.

   ANAHTAR BICIMI (keyPattern): saglayici anahtarlarinin tanidik onekleri.
   Yanlis saglayiciya yapistirilan anahtar en sik ariza sebebidir; bicim
   burada durur, ekran yalnizca okur. Bicim degisebilecegi icin uyari
   ENGELLEMEZ, yalnizca soyler — tek istisna, anahtarin acikca BASKA bir
   saglayiciya ait olmasidir.

   Kaynak ve tarih her saglayicinin `checked` alaninda durur.

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
    auth:'none',
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
    auth:'bearer',
    free:true,
    needsKey:true,
    endpoint:'https://openrouter.ai/api/v1/chat/completions',
    modelsUrl:'https://openrouter.ai/api/v1/models',
    keyUrl:'https://openrouter.ai/keys',
    keyHint:'sk-or-v1-…',
    keyPattern:/^sk-or-/,
    keyShape:'OpenRouter anahtarları "sk-or-" ile başlar.',
    note:'Ücretsiz modellerin çoğu burada toplanır. Dakikada 20 istek sınırı vardır; '
       + 'günlük hak hesabında hiç kredi yoksa 50, bir kez 10 $ yüklediysen 1000 istektir. '
       + 'Ücretsiz model listesi sık değişir: "Modelleri yenile" ile güncelini çek.',
    checked:'2026-09 · openrouter.ai/docs/api-reference/limits',
    /* Tum ucretsiz modeller ayni havuzu paylasir. */
    limits:{ rpm:20, rpd:50 },
    /* Gunluk hak hesaba bagli oldugu icin kullanici ayarlardan yukseltebilir. */
    rpdChoices:[
      { value:50,   label:'50 / gün — hiç kredi yüklemedim' },
      { value:1000, label:'1000 / gün — bir kez 10 $ yükledim' },
    ],
    /* Tohum liste. ":free" kuyrugu olmayan kimlik UCRETLIDIR; yenileme
       suzgeci bunu ayirir. */
    models:[
      { id:'deepseek/deepseek-chat-v3-0324:free',            label:'DeepSeek V3',       free:true, strength:'analiz' },
      { id:'meta-llama/llama-3.3-70b-instruct:free',         label:'Llama 3.3 70B',     free:true, strength:'denge' },
      { id:'qwen/qwen-2.5-72b-instruct:free',                label:'Qwen 2.5 72B',      free:true, strength:'denge' },
      { id:'mistralai/mistral-small-3.2-24b-instruct:free',  label:'Mistral Small 3.2', free:true, strength:'hız' },
      { id:'deepseek/deepseek-r1-0528:free',                 label:'DeepSeek R1',       free:true, strength:'akıl yürütme' },
    ],
  },

  groq: {
    id:'groq',
    label:'Groq',
    kind:'openai',
    auth:'bearer',
    free:true,
    needsKey:true,
    endpoint:'https://api.groq.com/openai/v1/chat/completions',
    modelsUrl:'https://api.groq.com/openai/v1/models',
    keyUrl:'https://console.groq.com/keys',
    keyHint:'gsk_…',
    keyPattern:/^gsk_/,
    keyShape:'Groq anahtarları "gsk_" ile başlar.',
    note:'Ücretsiz katmanı çok hızlıdır: dakikada 30 istek. Günlük hak modele göre '
       + '1000 ile 14 400 arasında değişir. Toplantı için en akıcı seçenek.',
    checked:'2026-09 · console.groq.com/docs/rate-limits',
    limits:{ rpm:30, rpd:1000 },
    models:[
      { id:'llama-3.3-70b-versatile', label:'Llama 3.3 70B', free:true, strength:'denge',
        limits:{ rpm:30, rpd:1000,  tpm:12000 } },
      { id:'llama-3.1-8b-instant',    label:'Llama 3.1 8B',  free:true, strength:'hız',
        limits:{ rpm:30, rpd:14400, tpm:6000 } },
      { id:'openai/gpt-oss-120b',     label:'GPT-OSS 120B',  free:true, strength:'analiz',
        limits:{ rpm:30, rpd:1000,  tpm:8000 } },
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
    /* Google anahtari Bearer DEGILDIR: x-goog-api-key basligiyla gider.
       Adres satirindaki ?key= de calisir ama anahtari tarayici gecmisine,
       yonlendirici gunlugune ve Referer'a dusurur; baslik kullanilir. */
    auth:'google',
    free:true,
    needsKey:true,
    endpoint:'https://generativelanguage.googleapis.com/v1beta/models',
    modelsUrl:'https://generativelanguage.googleapis.com/v1beta/models',
    keyUrl:'https://aistudio.google.com/apikey',
    keyHint:'AIza… ya da AQ.…',
    /* Google Eylul 2026'da anahtar bicimini degistirdi: yeni "auth key"ler
       AQ. ile baslar, eski "standard key"ler AIza ile. Ikisi de gecerlidir
       ve ikisi de ayni baslikla gonderilir. Yalniz AIza'yi kabul eden eski
       denetim, yeni anahtar alan herkesi kapida durduruyordu. */
    keyPattern:/^(AIza[\w-]{8,}|AQ\.[\w.\-]{8,})$/,
    keyShape:'Google AI Studio anahtarları "AIza" (eski) ya da "AQ." (yeni) ile başlar.',
    note:'Ücretsiz katmanda günde 1000–1500 isteğe kadar hak vardır; dakikalık sınır '
       + 'modele göre 10 ile 30 istek arasındadır. Uzun toplantılar için uygun. '
       + 'Yeni anahtarlar "AQ." ile başlar; ikisi de çalışır.',
    checked:'2026-09 · ai.google.dev/gemini-api/docs/rate-limits',
    /* Model bilinmiyorsa buraya duser — dar tutulur, kota asilmasin. */
    limits:{ rpm:10, rpd:1000 },
    models:[
      { id:'gemini-2.5-flash',      label:'Gemini 2.5 Flash',      free:true, strength:'analiz',
        limits:{ rpm:15, rpd:1500 } },
      { id:'gemini-2.5-flash-lite', label:'Gemini 2.5 Flash Lite', free:true, strength:'hız',
        limits:{ rpm:30, rpd:1500 } },
      { id:'gemini-3-flash-preview', label:'Gemini 3 Flash',       free:true, strength:'denge',
        limits:{ rpm:10, rpd:1500 } },
      /* Sinirlari dogrulanmadi: saglayici varsayilanina duser. */
      { id:'gemini-3.1-flash-lite', label:'Gemini 3.1 Flash Lite', free:true, strength:'hız' },
    ],
  },

  /* Bilgisayarda calisan model. Kotasi, ucreti ve internet ihtiyaci YOKTUR;
     ucretsiz katmanlarin butun sinirlarindan kacmanin tek yolu budur. */
  ollama: {
    id:'ollama',
    label:'Ollama (kendi bilgisayarın)',
    kind:'openai',
    auth:'bearer',
    free:true,
    needsKey:false,
    /* Yerel sunucular genelde anahtar istemez; onunde bir vekil varsa
       kullanici yine de anahtar girebilir. */
    keyOptional:true,
    endpoint:'http://localhost:11434/v1/chat/completions',
    modelsUrl:'http://localhost:11434/v1/models',
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
    auth:'bearer',
    free:true,
    needsKey:false,
    keyOptional:true,
    endpoint:'http://localhost:1234/v1/chat/completions',
    modelsUrl:'http://localhost:1234/v1/models',
    editableEndpoint:true,
    keyUrl:'https://lmstudio.ai',
    note:'LM Studio’da yerel sunucuyu başlat ve CORS’u aç. Kota yok, ücret yok. '
       + 'Model kimliğini "Modelleri yenile" ile doğrudan LM Studio’dan çekebilirsin.',
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
    auth:'bearer',
    free:false,
    /* Anahtar ZORUNLU DEGIL: kendi sunucusu ya da sirket ici bir vekil
       anahtar istemeyebilir. Isteyen servis 401 dondurur ve motor bunu
       acikca soyler — kapida durdurmak yerine denemek dogrudur. */
    needsKey:false,
    keyOptional:true,
    endpoint:'',
    editableEndpoint:true,
    keyHint:'anahtarın (gerekiyorsa)',
    note:'OpenAI uyumlu bir adres ver: ister tam /chat/completions yolu, ister yalnız '
       + 'taban adres (…/v1) — eksik yol tamamlanır. Anahtar istemeyen bir uç ise '
       + 'anahtar alanını boş bırak. İstek sınırını kendin yazabilirsin.',
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
